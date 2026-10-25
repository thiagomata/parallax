/**
 * The calibration phase of the Emotion Game: before the first round the player is asked to make
 * the neutral face (the emoji) and to hold it still. The frames of that still, relaxed face
 * become the player's own neutral face, so the game counts from their face and not from
 * everybody else's - the hard faces (angry, surprised) only read right on a face that was
 * measured first.
 *
 * The phase watches the face: the head may not move, turn or change much between two frames,
 * and the eyes may not blink (a blink is not the resting face). A face that stays still for
 * CALIBRATION_SECONDS gives its frames to the calibration.
 */
import {
    FaceExpressions, calibratedRanges, type ExpressionRanges,
} from "../../scene/drivers/mediapipe/face_expressions.ts";
import type { FaceWorldData } from "../../scene/providers/head_tracking_data_provider.ts";

/** The face to make: the neutral emoji. */
export const NEUTRAL_EMOJI = '😐';

/** How long the face must be still before the calibration is done (seconds). */
export const CALIBRATION_SECONDS = 3;

/** How many still frames are averaged into the player's neutral face. */
export const CALIBRATION_FRAMES = 20;

/** The fewest frames that make a neutral face: less than this and it is not a face yet. */
export const MIN_CALIBRATION_FRAMES = 2;

/** The head may move this much between two frames (scene units) and still count as still. */
export const STILL_MOTION = 10;

/** The head may drift this much in all (scene units) before the still time starts over. */
export const STILL_DRIFT = 60;

/** The head may turn this much between two frames (radians) and still count as still. */
export const STILL_TURN = 0.09;

/** The face may change this much between two frames (a score) and still count as still. */
export const STILL_CHANGE = 0.12;

/** The blinks are momentary: they do not mean the face changed. */
const BLINK_SCORES: readonly string[] = ['eyeBlinkLeft', 'eyeBlinkRight'];

/** The eyes are closed this much more than the resting face: such a frame is a blink. */
const BLINK_LIMIT = 0.35;

/** What the phase is doing. */
export type CalibrationState = 'waiting' | 'holding' | 'done';

/** One look at the face: where the head is, how it turns and what it shows. */
interface FaceSample {
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
    readonly rotation: { readonly yaw: number; readonly pitch: number; readonly roll: number };
    readonly scores: Readonly<Record<string, number>>;
}

/** The face as it is now. */
function sampleOf(face: FaceWorldData): FaceSample {
    const raw = face.faceExpressions;
    return {
        position: face.worldPosition,
        // The head's turn, as the scene sees it (the same angles the emoji turns with).
        rotation: face.sceneFace.localRotation,
        scores: raw ? { ...raw.scores } : {},
    };
}

/** How far the head moved between the two looks (scene units). */
function moved(a: FaceSample, b: FaceSample): number {
    return Math.hypot(b.position.x - a.position.x, b.position.y - a.position.y, b.position.z - a.position.z);
}

/** How far the head turned between the two looks (radians). */
function turned(a: FaceSample, b: FaceSample): number {
    return Math.max(
        Math.abs(b.rotation.yaw - a.rotation.yaw),
        Math.abs(b.rotation.pitch - a.rotation.pitch),
        Math.abs(b.rotation.roll - a.rotation.roll),
    );
}

/** How much the face changed between the two looks (a score); a blink does not count. */
function changed(a: FaceSample, b: FaceSample): number {
    let change = 0;
    for (const [name, value] of Object.entries(a.scores)) {
        if (BLINK_SCORES.includes(name)) continue;
        change = Math.max(change, Math.abs(value - (b.scores[name] ?? value)));
    }
    return change;
}

/**
 * Whether the eyes are closed: a blink is not the resting face. Measured against the resting
 * face (the anchor), so heavy lids are not mistaken for a blink.
 */
function blinking(anchor: FaceSample, sample: FaceSample): boolean {
    return BLINK_SCORES.some(name => (sample.scores[name] ?? 0) > (anchor.scores[name] ?? 0) + BLINK_LIMIT);
}

/**
 * The calibration phase: the player makes the neutral face and holds it still, and the frames of
 * that still face become their own neutral face.
 */
export class CalibrationPhase {
    private state: CalibrationState = 'waiting';
    private anchor: FaceSample | null = null;
    private previous: FaceSample | null = null;
    private stillSince = 0;
    private lastNow = 0;
    private frames: FaceExpressions[] = [];
    private ranges: ExpressionRanges | null = null;

    /** What the phase is doing. */
    public get phaseState(): CalibrationState {
        return this.state;
    }

    /** Whether the calibration is over: the neutral face is known. */
    public get isDone(): boolean {
        return this.state === 'done';
    }

    /** How far the still time is, 0..1. */
    public get progress(): number {
        if (this.state === 'done') return 1;
        if (this.state === 'waiting') return 0;
        return Math.max(0, Math.min(1, (this.lastNow - this.stillSince) / CALIBRATION_SECONDS));
    }

    /** The player's own neutral face, once the calibration has run. */
    public get neutralRanges(): ExpressionRanges | null {
        return this.ranges;
    }

    /** Starts over: the next still frames are the neutral face again. */
    public reset(): void {
        this.state = 'waiting';
        this.anchor = null;
        this.previous = null;
        this.frames = [];
        this.ranges = null;
    }

    /**
     * Reads the face and collects the frames of a still, relaxed face.
     * @param face - the tracked face, null when there is none
     * @param now - the time in seconds (the game's clock)
     */
    public update(face: FaceWorldData | null | undefined, now: number): void {
        if (this.state === 'done') return;
        this.lastNow = now;
        if (!face) {
            // No face: there is nothing to calibrate from.
            this.state = 'waiting';
            this.anchor = null;
            this.previous = null;
            this.frames = [];
            return;
        }
        const sample = sampleOf(face);
        const previous = this.previous;
        this.previous = sample;
        if (!previous) {
            // The first look: the still time starts here.
            this.anchor = sample;
            this.stillSince = now;
            this.state = 'holding';
            this.collect(face, sample);
            return;
        }
        const movedAway = moved(previous, sample) > STILL_MOTION
            || turned(previous, sample) > STILL_TURN
            || changed(previous, sample) > STILL_CHANGE;
        const drifted = this.anchor !== null && moved(this.anchor, sample) > STILL_DRIFT;
        if (movedAway || drifted) {
            // The face moved: the still time starts again, from here.
            this.anchor = sample;
            this.stillSince = now;
            this.frames = [];
        }
        this.state = 'holding';
        this.collect(face, sample);
        if (now - this.stillSince >= CALIBRATION_SECONDS && this.frames.length >= MIN_CALIBRATION_FRAMES) {
            this.ranges = calibratedRanges(FaceExpressions.average(this.frames));
            this.state = 'done';
        }
    }

    /** Keeps a frame of the still face - but not one of a blink: that is not the resting face. */
    private collect(face: FaceWorldData, sample: FaceSample): void {
        const raw = face.faceExpressions;
        if (!raw || !this.anchor || blinking(this.anchor, sample)) return;
        if (this.frames.length >= CALIBRATION_FRAMES) return;
        this.frames.push(raw);
    }
}
