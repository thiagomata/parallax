import {describe, expect, it} from 'vitest';
import {
    CALIBRATION_SECONDS, CalibrationPhase, NEUTRAL_EMOJI,
} from './emotion_game_calibration.ts';
import {FaceExpressions} from "../../scene/drivers/mediapipe/face_expressions.ts";
import {FaceWorldData} from "../../scene/providers/head_tracking_data_provider.ts";
import {createMockFaceWorldData, createMockSceneFace} from "../../scene/mock/face.mock.ts";

/** A relaxed face: what the player makes while the calibration runs. */
const relaxed = () => new FaceExpressions(
    {mouthSmileLeft: 0.05, mouthSmileRight: 0.05, browInnerUp: 0.05, jawOpen: 0.03, eyeBlinkLeft: 0.15, eyeBlinkRight: 0.15},
    undefined,
    {browInnerToOuter: 1, whiteAboveIris: -0.15, lipGap: 0.001, cornerLift: 0},
);

/** A face whose eyes are closed for a moment. */
const blinking = () => new FaceExpressions(
    {mouthSmileLeft: 0.05, mouthSmileRight: 0.05, browInnerUp: 0.05, jawOpen: 0.03, eyeBlinkLeft: 0.95, eyeBlinkRight: 0.95},
    undefined,
    {browInnerToOuter: 1, whiteAboveIris: -0.55, lipGap: 0.001, cornerLift: 0},
);

/** A face that is smiling while it rests: the game's "neutral" is not everybody's neutral. */
const restingSmile = () => new FaceExpressions(
    {mouthSmileLeft: 0.4, mouthSmileRight: 0.4, browInnerUp: 0.05, jawOpen: 0.03, eyeBlinkLeft: 0.15, eyeBlinkRight: 0.15},
    undefined,
    {browInnerToOuter: 1, whiteAboveIris: -0.15, lipGap: 0.001, cornerLift: 0.04},
);

/** The tracked face, as the tracker would deliver it (a new one each frame). */
function faceWith(
    expressions: () => FaceExpressions,
    position = { x: 0, y: 0, z: 0 },
    rotation = { yaw: 0, pitch: 0, roll: 0 },
): FaceWorldData {
    const sceneFace = createMockSceneFace({ localPosition: position, localRotation: rotation });
    return new FaceWorldData(createMockFaceWorldData().face, sceneFace, expressions());
}

describe('Emotion game: the calibration', () => {
    it('asks for the neutral face', () => {
        expect(NEUTRAL_EMOJI).toBe('😐');
    });

    it('waits for a face', () => {
        const phase = new CalibrationPhase();

        phase.update(null, 0);

        expect(phase.phaseState).toBe('waiting');
        expect(phase.progress).toBe(0);
        expect(phase.isDone).toBe(false);
        expect(phase.neutralRanges).toBeNull();
    });

    it('is done when the face holds still for a few seconds', () => {
        const phase = new CalibrationPhase();

        phase.update(faceWith(relaxed), 0);
        expect(phase.phaseState).toBe('holding');
        expect(phase.isDone).toBe(false);

        phase.update(faceWith(relaxed), 1);
        expect(phase.isDone).toBe(false);
        expect(phase.progress).toBeCloseTo(1 / CALIBRATION_SECONDS, 2);

        phase.update(faceWith(relaxed), CALIBRATION_SECONDS);
        expect(phase.isDone).toBe(true);
        expect(phase.progress).toBe(1);
        expect(phase.neutralRanges).not.toBeNull();
    });

    it('starts the still time over when the head moves', () => {
        const phase = new CalibrationPhase();

        phase.update(faceWith(relaxed), 0);
        phase.update(faceWith(relaxed), CALIBRATION_SECONDS - 0.1);
        expect(phase.progress).toBeGreaterThan(0.9);

        // The head moves: the still time starts again, from here.
        phase.update(faceWith(relaxed, { x: 300, y: 0, z: 0 }), CALIBRATION_SECONDS);
        expect(phase.progress).toBe(0);
        expect(phase.isDone).toBe(false);
    });

    it('starts the still time over when the head turns', () => {
        const phase = new CalibrationPhase();

        phase.update(faceWith(relaxed), 0);
        phase.update(faceWith(relaxed, { x: 0, y: 0, z: 0 }, { yaw: 0.5, pitch: 0, roll: 0 }), 1);

        expect(phase.progress).toBe(0);
        expect(phase.isDone).toBe(false);
    });

    it('does not stop for a blink', () => {
        const phase = new CalibrationPhase();

        phase.update(faceWith(relaxed), 0);
        phase.update(faceWith(blinking), 1);
        expect(phase.progress).toBeGreaterThan(0);

        phase.update(faceWith(relaxed), CALIBRATION_SECONDS);
        expect(phase.isDone).toBe(true);
    });

    it('does not mistake heavy lids for a blink', () => {
        const heavyLids = () => new FaceExpressions(
            {mouthSmileLeft: 0.05, mouthSmileRight: 0.05, browInnerUp: 0.05, jawOpen: 0.03, eyeBlinkLeft: 0.45, eyeBlinkRight: 0.45},
            undefined,
            {browInnerToOuter: 1, whiteAboveIris: -0.35, lipGap: 0.001, cornerLift: 0},
        );
        const phase = new CalibrationPhase();

        phase.update(faceWith(heavyLids), 0);
        phase.update(faceWith(heavyLids), CALIBRATION_SECONDS);

        expect(phase.isDone).toBe(true);
    });

    it('measures the neutral face of the player, not of everybody else', () => {
        const phase = new CalibrationPhase();

        phase.update(faceWith(restingSmile), 0);
        phase.update(faceWith(restingSmile), CALIBRATION_SECONDS);

        expect(phase.isDone).toBe(true);
        // The smile that is there while the player rests is the neutral face now.
        expect(phase.neutralRanges?.mouthSmileLeft?.rest).toBeCloseTo(0.42, 2);
    });

    it('starts over when it is reset', () => {
        const phase = new CalibrationPhase();
        phase.update(faceWith(relaxed), 0);
        phase.update(faceWith(relaxed), CALIBRATION_SECONDS);
        expect(phase.isDone).toBe(true);

        phase.reset();

        expect(phase.isDone).toBe(false);
        expect(phase.neutralRanges).toBeNull();
        expect(phase.phaseState).toBe('waiting');
    });
});
