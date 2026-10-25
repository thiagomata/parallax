/**
 * The emoji face of the showroom's Emotion Game: a yellow head whose eyes, brows and mouth take
 * the shape of each emotion (🙂 😃 😢 😠 😮 😴 😉), and ExpressionReader, which reads the tracked
 * face's expressions frame by frame - calibrated on N, with sleepy smoothed over time.
 * Tutorial 11 shows the expression data itself, in its simplest form.
 */
import { World } from "../../scene/world.ts";
import type { P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import type { FaceWorldData, ObserverDataProviderLib } from "../../scene/providers/head_tracking_data_provider.ts";
import type { ColorRGBA, ResolutionContext, Rotation3, Vector3 } from "../../scene/types.ts";
import { ELEMENT_TYPES } from "../../scene/types.ts";
import { COLORS } from "../../scene/colors.ts";
import {
    EMOTIONS, EMOTION_THRESHOLD, FaceExpressions, calibratedRanges, type Emotion, type ExpressionRanges,
} from "../../scene/drivers/mediapipe/face_expressions.ts";

const NEUTRAL = {
    leftEyeOpen: 1, rightEyeOpen: 1, mouthOpen: 0,
    happy: 0, sad: 0, angry: 0, surprised: 0, sleepy: 0,
};

export type FaceShape = typeof NEUTRAL;

/**
 * The strongest emotion, or 'neutral' when none reaches EMOTION_THRESHOLD - like
 * FaceExpressions.emotion, with sleepy given separately (smoothed over time; see the tutorial).
 */
export function strongestEmotion(expressions: FaceExpressions, sleepy: number = expressions.sleepy): Emotion | 'neutral' {
    let strongest: Emotion | 'neutral' = 'neutral';
    let strongestScore = EMOTION_THRESHOLD;
    for (const emotion of EMOTIONS) {
        const score = emotion === 'sleepy' ? sleepy : expressions[emotion];
        if (score >= strongestScore) {
            strongest = emotion;
            strongestScore = score;
        }
    }
    return strongest;
}

/**
 * The expression values this face shows: the normalized expressions of the tracked face,
 * or a neutral face (eyes open, mouth closed) when there is none.
 * @param sleepy - sleepy smoothed over time, so a blink does not count (default: this frame's)
 */
export function faceShape(expressions: FaceExpressions | null | undefined, sleepy?: number): FaceShape {
    if (!expressions) return NEUTRAL;
    const sleepyScore = sleepy ?? expressions.sleepy;
    // Only the strongest emotion shapes the face, like an emoji shows one: drawing them all at
    // once could give a smile with a tear.
    const emotion = strongestEmotion(expressions, sleepyScore);
    const only = (name: Emotion) => emotion !== name ? 0 : name === 'sleepy' ? sleepyScore : expressions[name];
    return {
        leftEyeOpen: expressions.leftEyeOpen,
        rightEyeOpen: expressions.rightEyeOpen,
        // Bared teeth part the lips without dropping the jaw, so take whichever is more open.
        mouthOpen: Math.max(expressions.mouthOpen, expressions.lipsApart),
        happy: only('happy'),
        sad: only('sad'),
        angry: only('angry'),
        surprised: only('surprised'),
        sleepy: only('sleepy'),
    };
}

// The face is drawn like an emoji on a yellow head: an ellipsoid this size, with the features on
// its front surface (z from surfaceZ), in the head's local frame (y down).
export const HEAD = { rx: 150, ry: 170, rz: 125 } as const;

/** How far forward the head's surface is at (x, y), so features sit on it. */
export function surfaceZ(x: number, y: number): number {
    return HEAD.rz * Math.sqrt(Math.max(0, 1 - (x / HEAD.rx) ** 2 - (y / HEAD.ry) ** 2));
}

/** Emoji yellow, turning red as the face gets angry (😠 to 😡). */
export function headColor(shape: FaceShape): ColorRGBA {
    const red = Math.max(0, Math.min(1, (shape.angry - 0.3) / 0.6));
    const mix = (from: number, to: number) => Math.round(from + (to - from) * red) as ColorRGBA['red'];
    return { red: mix(255, 235), green: mix(204, 80), blue: mix(77, 55) };
}

/** An eye: a dark oval, flat when closed (blinks and winks show), taller and rounder when wide. */
export function eyeSize(open: number, surprised: number): { rx: number; ry: number } {
    return { rx: 16 + 6 * surprised, ry: Math.max(1.5, 26 * open * (1 + 0.4 * surprised)) };
}

/**
 * A brow: raised high when surprised, a little when sad, lowered when angry; tilted with the
 * inner end down when angry and up when sad. roll turns the brow on the face (the head's
 * local frame, y down), so the side decides which way lifts the inner end.
 */
export function browPose(shape: FaceShape, side: 'left' | 'right'): { y: number; roll: number } {
    const innerEndDown = 0.45 * shape.angry - 0.4 * shape.sad;
    return {
        y: -80 - 30 * shape.surprised - 8 * shape.sad + 12 * shape.angry,
        // The left brow's inner end points to +x, which a positive roll turns down (y grows).
        roll: side === 'left' ? innerEndDown : -innerEndDown,
    };
}

/** How many segments draw the mouth's curve. */
export const MOUTH_SEGMENTS = 15;

/** Happy this strong, with the mouth open, draws the grin (😃) instead of the smile curve. */
export const GRIN_HAPPINESS = 0.8;

/**
 * The mouth, drawn one of three ways - never two at once:
 *  - 'curve': a line along an arc, its middle lower than its ends for a smile and higher for a
 *    frown; a bigger smile makes it deeper and thicker (🙂, 🙁; flat when neutral or angry);
 *  - 'grin': a strong smile with the mouth open - a wide "D", flat on top with a row of teeth (😃);
 *  - 'oval': an open mouth that is not a smile - the tall O of surprise, or bared teeth (😮, 😡).
 */
export function mouthPose(shape: FaceShape): {
    mode: 'curve' | 'grin' | 'oval'; width: number; curve: number; thickness: number; height: number; teeth: number;
} {
    const open = shape.mouthOpen;
    const grin = open > 0.3 && shape.happy >= GRIN_HAPPINESS;
    const oval = !grin && open > 0.3 && shape.happy < Math.max(shape.surprised, shape.angry, 0.35);
    // The grin's height is the depth of the "D" below its flat top.
    const height = grin ? 30 + 30 * open : 8 + 70 * open + 30 * shape.surprised - 4 * shape.angry;
    return {
        mode: grin ? 'grin' : oval ? 'oval' : 'curve',
        width: Math.max(30, 80 + 50 * shape.happy + 30 * shape.angry - 40 * shape.surprised - 30 * shape.sleepy),
        // How far the middle of the curve sits below its ends (negative: above, a frown).
        curve: 26 * shape.happy - 18 * shape.sad,
        thickness: 8 + 18 * shape.happy * open,
        height,
        // Teeth in a grin or bared in anger - not in the O of surprise, a yawn or "ah".
        teeth: grin ? height * 0.3 : oval && shape.angry > 0 ? height * 0.35 : 0,
    };
}

/** Where segment i of the mouth's curve sits, and how it turns to follow the curve. */
export function mouthSegment(pose: ReturnType<typeof mouthPose>, i: number): { x: number; y: number; roll: number; rx: number } {
    const halfWidth = pose.width / 2;
    const t = -1 + 2 * i / (MOUTH_SEGMENTS - 1);
    const x = t * halfWidth;
    const slope = -2 * pose.curve * t / halfWidth;
    return {
        x,
        y: pose.curve * (1 - t * t),
        roll: Math.atan(slope),
        // Long enough to overlap its neighbours along the curve - and at least as long as the
        // line is thick, or a thick smile shows as a row of beads.
        rx: Math.max((pose.width / (MOUTH_SEGMENTS - 1)) * Math.hypot(1, slope) * 0.8, pose.thickness * 0.8),
    };
}

/**
 * The pieces of a "Z" (top bar, diagonal, bottom bar) for a sleepy face (😴): size 0 hides it.
 * Positions are relative to the Z's center, in the head's frame (y down).
 */
export function zPieces(size: number): { x: number; y: number; width: number; height: number; roll: number }[] {
    const bar = Math.max(0.01, size * 0.2);
    return [
        { x: 0, y: -size / 2, width: size, height: bar, roll: 0 },
        // From the bottom-left corner to the top-right one.
        { x: 0, y: 0, width: size * Math.SQRT2, height: bar, roll: -Math.PI / 4 },
        { x: 0, y: size / 2, width: size, height: bar, roll: 0 },
    ].map(piece => size > 0 ? piece : { ...piece, width: 0.01, height: 0.01 });
}

/** A tear under the eye once the face is clearly sad (😢); 0 hides it. */
export function tearSize(shape: FaceShape): number {
    return shape.sad > 0.5 ? 6 + 16 * (shape.sad - 0.5) : 0;
}

const FEATURE_COLOR = { red: 70, green: 40, blue: 20 } as ColorRGBA;
const MOUTH_COLOR = { red: 110, green: 40, blue: 20 } as ColorRGBA;

type EmojiWorld = World<P5Bundler, any, any, ObserverDataProviderLib>;
type ShapeOf = (ctx: ResolutionContext<ObserverDataProviderLib>) => FaceShape;

/**
 * Adds the emoji face: a yellow head ('head') with eyes, brows, mouth, tear and "Z"s, all shaped
 * each frame by shapeOf. The scene decides where the head is and how it turns.
 */
export function addEmojiFace(world: EmojiWorld, options: {
    parentId: string;
    position: (ctx: ResolutionContext<ObserverDataProviderLib>) => Vector3;
    rotate: (ctx: ResolutionContext<ObserverDataProviderLib>) => Rotation3;
    shapeOf: ShapeOf;
}): void {
    const shapeOf = options.shapeOf;
    world.addElliptical({
        type: ELEMENT_TYPES.ELLIPTICAL,
        id: 'head',
        parentId: options.parentId,
        ...HEAD,
        position: options.position,
        rotate: options.rotate,
        fillColor: (ctx) => headColor(shapeOf(ctx)),
        strokeWidth: 0,
    });

    for (const side of ['left', 'right'] as const) {
        const sign = side === 'left' ? -1 : 1;
        const eyeX = 50 * sign, eyeY = -30;
        const open = (shape: FaceShape) => side === 'left' ? shape.leftEyeOpen : shape.rightEyeOpen;

        world.addElliptical({
            type: ELEMENT_TYPES.ELLIPTICAL,
            id: `${side}-eye`,
            parentId: 'head',
            rx: (ctx) => { const shape = shapeOf(ctx); return eyeSize(open(shape), shape.surprised).rx; },
            ry: (ctx) => { const shape = shapeOf(ctx); return eyeSize(open(shape), shape.surprised).ry; },
            rz: 8,
            position: { x: eyeX, y: eyeY, z: surfaceZ(eyeX, eyeY) + 4 },
            fillColor: FEATURE_COLOR,
            strokeWidth: 0,
        });

        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: `${side}-eye-shine`,
            parentId: `${side}-eye`,
            // The light in the eye; it goes out as the eye closes.
            radius: (ctx) => 5 * open(shapeOf(ctx)),
            position: (ctx) => {
                const shape = shapeOf(ctx);
                return { x: -5, y: -eyeSize(open(shape), shape.surprised).ry * 0.4, z: 5 };
            },
            fillColor: COLORS.white,
            strokeWidth: 0,
        });

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: `${side}-brow`,
            parentId: 'head',
            width: 50,
            height: 10,
            depth: 6,
            position: (ctx) => {
                const y = browPose(shapeOf(ctx), side).y;
                return { x: eyeX, y, z: surfaceZ(eyeX, y) + 6 };
            },
            rotate: (ctx) => ({ yaw: 0, pitch: 0, roll: browPose(shapeOf(ctx), side).roll }),
            fillColor: FEATURE_COLOR,
            strokeWidth: 0,
        });
    }

    const mouthY = 70;
    const hidden = 0.01;

    // The open mouth (see mouthPose): the oval, or the grin - the same oval with its top half
    // hidden behind a piece of the head's color, which leaves a "D" flat on top.
    const mouthZ = surfaceZ(0, mouthY) + 4;
    world.addElliptical({
        type: ELEMENT_TYPES.ELLIPTICAL,
        id: 'mouth',
        parentId: 'head',
        rx: (ctx) => { const pose = mouthPose(shapeOf(ctx)); return pose.mode === 'curve' ? hidden : pose.width / 2; },
        ry: (ctx) => {
            const pose = mouthPose(shapeOf(ctx));
            return pose.mode === 'curve' ? hidden : pose.mode === 'grin' ? pose.height : pose.height / 2;
        },
        rz: 10,
        // Forward enough that the head, curving back toward the mouth's ends, stays behind it.
        position: { x: 0, y: mouthY, z: mouthZ },
        fillColor: MOUTH_COLOR,
        strokeWidth: 0,
    });

    // Teeth: along the flat top of the grin, or inside the top of bared teeth (😃, 😡).
    world.addElliptical({
        type: ELEMENT_TYPES.ELLIPTICAL,
        id: 'teeth',
        parentId: 'head',
        rx: (ctx) => { const pose = mouthPose(shapeOf(ctx)); return pose.teeth > 0 ? pose.width * (pose.mode === 'grin' ? 0.4 : 0.36) : hidden; },
        ry: (ctx) => Math.max(hidden, mouthPose(shapeOf(ctx)).teeth / 2),
        rz: 4,
        position: (ctx) => {
            const pose = mouthPose(shapeOf(ctx));
            // The grin's teeth are centered on its flat top, so the cover hides their upper half.
            const y = pose.mode === 'grin' ? mouthY + pose.teeth / 4 : mouthY - pose.height / 2 + pose.teeth / 2 + 4;
            return { x: 0, y, z: mouthZ + 10 };
        },
        fillColor: COLORS.white,
        strokeWidth: 0,
    });

    // The piece of head hiding the top half of the grin's oval (and of its teeth).
    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'grin-cover',
        parentId: 'head',
        width: (ctx) => { const pose = mouthPose(shapeOf(ctx)); return pose.mode === 'grin' ? pose.width + 12 : hidden; },
        height: (ctx) => { const pose = mouthPose(shapeOf(ctx)); return pose.mode === 'grin' ? pose.height + 4 : hidden; },
        depth: 2,
        position: (ctx) => ({ x: 0, y: mouthY - (mouthPose(shapeOf(ctx)).height + 4) / 2, z: mouthZ + 16 }),
        fillColor: (ctx) => headColor(shapeOf(ctx)),
        strokeWidth: 0,
    });

    // The smile / frown curve (see mouthPose), one segment at a time.
    for (let i = 0; i < MOUTH_SEGMENTS; i++) {
        world.addElliptical({
            type: ELEMENT_TYPES.ELLIPTICAL,
            id: `mouth-curve-${i}`,
            parentId: 'head',
            rx: (ctx) => { const pose = mouthPose(shapeOf(ctx)); return pose.mode === 'curve' ? mouthSegment(pose, i).rx : hidden; },
            ry: (ctx) => { const pose = mouthPose(shapeOf(ctx)); return pose.mode === 'curve' ? pose.thickness / 2 : hidden; },
            rz: 6,
            position: (ctx) => {
                const segment = mouthSegment(mouthPose(shapeOf(ctx)), i);
                const y = mouthY + segment.y;
                return { x: segment.x, y, z: surfaceZ(segment.x, y) + 6 };
            },
            rotate: (ctx) => ({ yaw: 0, pitch: 0, roll: mouthSegment(mouthPose(shapeOf(ctx)), i).roll }),
            fillColor: MOUTH_COLOR,
            strokeWidth: 0,
        });
    }

    // Two "Z"s floating up beside the head when sleepy (😴).
    [{ x: 120, y: -130, size: 28 }, { x: 160, y: -185, size: 40 }].forEach((z, k) => {
        for (let piece = 0; piece < 3; piece++) {
            world.addBox({
                type: ELEMENT_TYPES.BOX,
                id: `sleepy-z-${k}-${piece}`,
                parentId: 'head',
                width: (ctx) => zPieces(shapeOf(ctx).sleepy > 0 ? z.size : 0)[piece].width,
                height: (ctx) => zPieces(shapeOf(ctx).sleepy > 0 ? z.size : 0)[piece].height,
                depth: 4,
                position: { x: z.x + zPieces(z.size)[piece].x, y: z.y + zPieces(z.size)[piece].y, z: HEAD.rz * 0.6 },
                rotate: { yaw: 0, pitch: 0, roll: zPieces(z.size)[piece].roll },
                fillColor: { red: 70, green: 110, blue: 200 },
                strokeWidth: 0,
            });
        }
    });

    // A tear running from the right eye when clearly sad: a drop a full size in front of the
    // face, so the head, curving back, does not cover it.
    const tearX = 58, tearY = 8;
    world.addElliptical({
        type: ELEMENT_TYPES.ELLIPTICAL,
        id: 'tear',
        parentId: 'head',
        rx: (ctx) => Math.max(hidden, tearSize(shapeOf(ctx))),
        ry: (ctx) => Math.max(hidden, tearSize(shapeOf(ctx)) * 1.4),
        rz: (ctx) => Math.max(hidden, tearSize(shapeOf(ctx))),
        position: (ctx) => ({ x: tearX, y: tearY, z: surfaceZ(tearX, tearY) + tearSize(shapeOf(ctx)) + 6 }),
        fillColor: { red: 90, green: 180, blue: 255 },
        strokeWidth: 0,
    });

}

/**
 * Reads the tracked face's expressions for a scene, frame by frame: calibrated once N has been
 * pressed (start / update), and with sleepy smoothed over time so a blink does not count.
 */
export class ExpressionReader {
    /** Frames averaged into the neutral face when calibrating. */
    static readonly CALIBRATION_FRAMES = 20;
    /** Sleepy is averaged over about this long: a blink (a tenth of a second) does not count. */
    static readonly SLEEPY_SECONDS = 0.8;

    private calibration: ExpressionRanges | null = null;
    private calibrationFrames: FaceExpressions[] | null = null;
    private lastRaw: FaceExpressions | null = null;
    private lastCalibrated: FaceExpressions | null = null;
    private smoothedSleepy = 0;
    private lastSleepyFrame: FaceExpressions | null = null;
    private lastSleepyTime: number | null = null;

    /** Starts calibrating: the next frames, with a relaxed face, become the neutral face. */
    public startCalibration(): void {
        this.calibrationFrames = [];
    }

    /**
     * Uses the given ranges as the player's own neutral face: what the calibration phase measured
     * on a still, relaxed face. The next frame is read with them.
     */
    public setCalibration(ranges: ExpressionRanges): void {
        this.calibration = ranges;
        this.calibrationFrames = null;
        this.lastRaw = null;
        this.lastCalibrated = null;
    }

    /** Whether a resting face has been read (auto, or with N): the harder faces need it. */
    public get isCalibrated(): boolean {
        return this.calibration !== null;
    }

    public get status(): string {
        return this.calibration
            ? 'calibrated (N: again)'
            : this.calibrationFrames ? 'calibrating: relax...' : 'N: calibrate, relaxed';
    }

    /** Sleepy, smoothed over time. */
    public get sleepy(): number {
        return this.smoothedSleepy;
    }

    /** Call once per frame with the tracked face: collects calibration frames and smooths sleepy. */
    public update(face: FaceWorldData | null | undefined, now: number = performance.now()): void {
        const raw = face?.faceExpressions;
        if (this.calibrationFrames && raw && !this.calibrationFrames.includes(raw)) {
            this.calibrationFrames.push(raw);
            if (this.calibrationFrames.length >= ExpressionReader.CALIBRATION_FRAMES) {
                this.calibration = calibratedRanges(FaceExpressions.average(this.calibrationFrames));
                this.calibrationFrames = null;
                this.lastRaw = null;
            }
        }
        const expressions = this.expressionsOf(face);
        if (!expressions || expressions === this.lastSleepyFrame) return;
        this.lastSleepyFrame = expressions;
        const seconds = this.lastSleepyTime === null ? 0 : (now - this.lastSleepyTime) / 1000;
        this.lastSleepyTime = now;
        this.smoothedSleepy += (expressions.sleepy - this.smoothedSleepy) * (1 - Math.exp(-seconds / ExpressionReader.SLEEPY_SECONDS));
    }

    /** The normalized expressions of the tracked face - calibrated once calibration has run. */
    public expressionsOf(face: FaceWorldData | null | undefined): FaceExpressions | null {
        const raw = face?.faceExpressions;
        if (!raw) return null;
        if (!this.calibration) return face.expressions;
        if (raw !== this.lastRaw) {
            this.lastRaw = raw;
            this.lastCalibrated = raw.withRanges(this.calibration).normalize();
        }
        return this.lastCalibrated;
    }

    /** The face shape to draw (faceShape with the smoothed sleepy). */
    public shapeOf(face: FaceWorldData | null | undefined): FaceShape {
        return faceShape(this.expressionsOf(face), this.smoothedSleepy);
    }

    /** The emotion the face shows (strongestEmotion with the smoothed sleepy). */
    public emotionOf(face: FaceWorldData | null | undefined): Emotion | 'neutral' {
        const expressions = this.expressionsOf(face);
        return expressions ? strongestEmotion(expressions, this.smoothedSleepy) : 'neutral';
    }
}

