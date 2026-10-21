import {describe, expect, it, vi, beforeEach} from 'vitest';
import {
    tutorial_expressions, expressions_explanation, faceShape, strongestEmotion, zPieces, eyeSize, browPose, mouthPose, mouthSegment, MOUTH_SEGMENTS, GRIN_HAPPINESS, headColor, tearSize, surfaceZ, HEAD,
} from './tutorial_expressions.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS} from "../../../scene/types.ts";
import {createMockFaceWorldData, createMockHeadTrackingProvider} from "../../../scene/mock/face.mock.ts";
import {FaceExpressions} from "../../../scene/drivers/mediapipe/face_expressions.ts";

const createClock = () => new SceneClock({
    ...DEFAULT_SCENE_SETTINGS,
    playback: {
        ...DEFAULT_SCENE_SETTINGS.playback,
        duration: 10000,
        isLoop: true
    }
});

async function createScene(face: unknown) {
    const mockP5 = createMockP5();
    mockP5.millis.mockReturnValue(0);
    const mockTracker = createMockHeadTrackingProvider(vi.fn().mockReturnValue(face));
    (mockTracker as any).setFallbackCapture = vi.fn();
    const world = await tutorial_expressions(mockP5 as unknown as p5, {
        width: 500,
        height: 400,
        clock: createClock(),
        paused: false
    }, { faceDataProvider: mockTracker } as any);
    await mockP5.setup();
    return { mockP5, world, mockTracker };
}

describe('Tutorial 11: Facial Expressions', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('explains the normalized and raw expressions', () => {
        expect(expressions_explanation).toContain('expressions');
        expect(expressions_explanation).toContain('faceExpressions');
        expect(expressions_explanation).toContain('normalize()');
    });

    it('registers the head and its features', async () => {
        const { world, mockP5 } = await createScene(createMockFaceWorldData());

        expect(mockP5.createCanvas).toHaveBeenCalledWith(500, 400, "webgl");
        for (const id of ['head', 'left-eye', 'right-eye', 'left-eye-shine', 'right-eye-shine', 'left-brow', 'right-brow', 'mouth', 'teeth', 'grin-cover', 'tear', 'sleepy-z-0-0', 'sleepy-z-1-2', ...Array.from({ length: MOUTH_SEGMENTS }, (_, i) => `mouth-curve-${i}`)]) {
            expect(world.getElement(id), id).toBeDefined();
        }
    });

    it('initializes the face provider and adds the video panel on the first draw', async () => {
        const { world, mockP5, mockTracker } = await createScene(createMockFaceWorldData());
        const init = vi.spyOn(mockTracker, 'init');

        await mockP5.draw();

        expect(init).toHaveBeenCalled();
        expect((mockTracker as any).setFallbackCapture).toHaveBeenCalled();
        expect(world.getElement('videoPanel')).toBeDefined();
    });

    it('calibrates on N with a relaxed face, and ignores other keys', async () => {
        const { mockP5 } = await createScene(createMockFaceWorldData());

        (mockP5 as any).key = 'x';
        expect(() => (mockP5 as any).keyPressed()).not.toThrow();
        (mockP5 as any).key = 'n';
        expect(() => (mockP5 as any).keyPressed()).not.toThrow();
        await mockP5.draw();
        await mockP5.draw();
    });

    it('draws frames with and without a face', async () => {
        for (const face of [createMockFaceWorldData(), null]) {
            const { world, mockP5 } = await createScene(face);
            await mockP5.draw();
            await mockP5.draw();
            expect(world).toBeDefined();
        }
    });
});

describe('Tutorial 11: face shape', () => {
    const neutral = faceShape(null);

    it('is a neutral face without expressions', () => {
        expect(neutral).toEqual({ leftEyeOpen: 1, rightEyeOpen: 1, mouthOpen: 0, happy: 0, sad: 0, angry: 0, surprised: 0, sleepy: 0 });
        expect(faceShape(undefined).mouthOpen).toBe(0);
    });

    it('reads the expressions it is given', () => {
        const expressions = new FaceExpressions(
            { eyeBlinkLeft: 0.25, eyeBlinkRight: 1, jawOpen: 0.5, mouthSmileLeft: 0.2, mouthSmileRight: 0.4 },
            undefined,
            { browInnerToOuter: 1, whiteAboveIris: -0.15, lipGap: 0.0275, cornerLift: 0 },
        );

        expect(faceShape(expressions)).toEqual({
            leftEyeOpen: 0.75, rightEyeOpen: 0, mouthOpen: 0.5,
            happy: 0, sad: 0, angry: 0, surprised: 0, sleepy: 0, // happy 0.3 is under the threshold: neutral
        });
    });

    it('shapes the face by the strongest emotion only (no smile with a tear)', () => {
        const happyAndSad = new FaceExpressions(
            { mouthSmileLeft: 0.95, mouthSmileRight: 0.95, browInnerUp: 0.6 },
            undefined,
            { browInnerToOuter: 1, whiteAboveIris: -0.15, lipGap: 0.001, cornerLift: 0.04 },
        ).normalize();
        const shape = faceShape(happyAndSad);

        expect(happyAndSad.emotion).toBe('happy');
        expect(shape.happy).toBeGreaterThan(0);
        expect(shape.sad).toBe(0);
        expect(tearSize(shape)).toBe(0);
    });

    it('lets a blink go: sleepy counts only as smoothed over time', () => {
        const blink = new FaceExpressions(
            { eyeBlinkLeft: 0.7, eyeBlinkRight: 0.7, eyeSquintLeft: 0.5, eyeSquintRight: 0.5 },
            undefined,
            { browInnerToOuter: 1, whiteAboveIris: -0.55, lipGap: 0.001, cornerLift: 0 },
        ).normalize();

        expect(blink.emotion).toBe('sleepy');
        expect(strongestEmotion(blink, 0.1)).toBe('neutral');
        expect(faceShape(blink, 0.1).sleepy).toBe(0);
        expect(faceShape(blink, 0.8).sleepy).toBe(0.8);
        expect(faceShape(blink).sleepy).toBeCloseTo(blink.sleepy);
    });

    it('draws the "Z"s of a sleepy face, and hides them otherwise', () => {
        const pieces = zPieces(30);

        expect(pieces).toHaveLength(3);
        expect(pieces[0].y).toBeLessThan(pieces[2].y);
        expect(pieces[1].roll).toBeCloseTo(-Math.PI / 4);
        expect(zPieces(0).every(piece => piece.width < 0.1)).toBe(true);
    });

    it('opens the mouth with bared teeth too (lips apart, jaw closed)', () => {
        const teeth = new FaceExpressions({}, undefined, { browInnerToOuter: 1, whiteAboveIris: -0.15, lipGap: 0.05, cornerLift: 0 });

        expect(faceShape(teeth).mouthOpen).toBe(1);
    });

    it('flattens the eyes as they close and makes them taller and rounder when wide', () => {
        expect(eyeSize(1, 0)).toEqual({ rx: 16, ry: 26 });
        expect(eyeSize(0, 0).ry).toBe(1.5);
        expect(eyeSize(1, 1).ry).toBeGreaterThan(26);
        expect(eyeSize(1, 1).rx).toBeGreaterThan(16);
    });

    it('places the features on the front of the head', () => {
        expect(surfaceZ(0, 0)).toBe(HEAD.rz);
        expect(surfaceZ(50, -30)).toBeLessThan(HEAD.rz);
        expect(surfaceZ(HEAD.rx * 2, 0)).toBe(0);
    });

    it('keeps the brows level when neutral', () => {
        expect(browPose(neutral, 'left')).toEqual({ y: -80, roll: 0 });
        expect(browPose(neutral, 'right')).toEqual({ y: -80, roll: -0 });
    });

    it('lowers the brows and turns their inner ends down when angry', () => {
        const angry = { ...neutral, angry: 1 };

        expect(browPose(angry, 'left').y).toBeGreaterThan(-80);
        // Inner ends: +x on the left brow, -x on the right; down is +y.
        expect(browPose(angry, 'left').roll).toBeGreaterThan(0);
        expect(browPose(angry, 'right').roll).toBeLessThan(0);
    });

    it('turns the inner ends of the brows up when sad', () => {
        const sad = { ...neutral, sad: 1 };

        expect(browPose(sad, 'left').roll).toBeLessThan(0);
        expect(browPose(sad, 'right').roll).toBeGreaterThan(0);
    });

    it('raises the brows high when surprised', () => {
        expect(browPose({ ...neutral, surprised: 1 }, 'left').y).toBe(-110);
    });

    it('draws a flat line when neutral, a smile when happy and a frown when sad', () => {
        const flat = mouthPose(neutral);
        const smile = mouthPose({ ...neutral, happy: 1 });
        const frown = mouthPose({ ...neutral, sad: 1 });

        expect(flat).toMatchObject({ mode: 'curve', width: 80, curve: 0, thickness: 8 });
        // The middle of a smile sits below its ends (y down), the middle of a frown above.
        expect(mouthSegment(smile, (MOUTH_SEGMENTS - 1) / 2).y).toBeGreaterThan(mouthSegment(smile, 0).y);
        expect(mouthSegment(frown, (MOUTH_SEGMENTS - 1) / 2).y).toBeLessThan(mouthSegment(frown, 0).y);
        expect(smile.width).toBeGreaterThan(flat.width);
    });

    it('grins with teeth only when surely happy with the mouth open, and keeps the curve otherwise', () => {
        const grin = mouthPose({ ...neutral, happy: GRIN_HAPPINESS, mouthOpen: 1 });
        const openSmile = mouthPose({ ...neutral, happy: GRIN_HAPPINESS - 0.1, mouthOpen: 1 });
        const closedBigSmile = mouthPose({ ...neutral, happy: 1 });

        expect(grin.mode).toBe('grin');
        expect(grin.teeth).toBeGreaterThan(0);
        expect(openSmile.mode).toBe('curve');
        expect(openSmile.thickness).toBeGreaterThan(closedBigSmile.thickness);
        expect(openSmile.teeth).toBe(0);
        expect(closedBigSmile.mode).toBe('curve');
    });

    it('turns each segment along the curve, and keeps it at least as long as the line is thick', () => {
        const smile = mouthPose({ ...neutral, happy: 1, mouthOpen: 1 });
        const left = mouthSegment(smile, 0), middle = mouthSegment(smile, (MOUTH_SEGMENTS - 1) / 2), right = mouthSegment(smile, MOUTH_SEGMENTS - 1);

        expect(left.x).toBeCloseTo(-smile.width / 2);
        expect(right.x).toBeCloseTo(smile.width / 2);
        expect(middle.roll).toBeCloseTo(0);
        expect(left.roll).toBeCloseTo(-right.roll);
        expect(middle.rx).toBeGreaterThanOrEqual(smile.thickness * 0.8);
    });

    it('opens an oval for the O of surprise and for bared teeth, with teeth only when angry', () => {
        const surprised = mouthPose({ ...neutral, surprised: 1, mouthOpen: 1 });
        const angry = mouthPose({ ...neutral, angry: 1, mouthOpen: 1 });
        const ah = mouthPose({ ...neutral, mouthOpen: 1 });

        expect(surprised).toMatchObject({ mode: 'oval', width: 40, height: 108, teeth: 0 });
        expect(mouthPose({ ...neutral, sleepy: 1, mouthOpen: 1 }).teeth).toBe(0); // a yawn
        expect(angry.mode).toBe('oval');
        expect(angry.teeth).toBeGreaterThan(0);
        expect(ah.mode).toBe('oval');
        expect(mouthPose({ ...neutral, angry: 1 }).mode).toBe('curve');
    });

    it('sheds a tear only when clearly sad', () => {
        expect(tearSize({ ...neutral, sad: 0.4 })).toBe(0);
        expect(tearSize({ ...neutral, sad: 1 })).toBe(14);
    });
});

describe('Tutorial 11: head color', () => {
    it('is emoji yellow, turning red with anger', () => {
        const neutral = faceShape(null);

        expect(headColor(neutral)).toEqual({ red: 255, green: 204, blue: 77 });
        expect(headColor({ ...neutral, happy: 1, sad: 1, surprised: 1 })).toEqual(headColor(neutral));
        expect(headColor({ ...neutral, angry: 1 })).toEqual({ red: 235, green: 80, blue: 55 });
    });

    it('explains the emotions', () => {
        expect(expressions_explanation).toContain('emotion');
        expect(expressions_explanation).toContain('angry');
    });
});
