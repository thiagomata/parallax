import {describe, expect, it, vi, beforeEach} from 'vitest';
import {
    tutorial_expressions, expressions_explanation, faceShape, eyeHeight, browPose, mouthPose, mouthColor, EMOTION_COLORS,
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
        for (const id of ['head', 'left-eye', 'right-eye', 'left-pupil', 'right-pupil', 'left-brow', 'right-brow', 'nose', 'mouth', 'mouth-left-corner', 'mouth-right-corner']) {
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
        expect(neutral).toEqual({ leftEyeOpen: 1, rightEyeOpen: 1, mouthOpen: 0, happy: 0, sad: 0, angry: 0, surprised: 0 });
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
            happy: expect.closeTo(0.3), sad: 0, angry: 0, surprised: 0,
        });
    });

    it('opens the mouth with bared teeth too (lips apart, jaw closed)', () => {
        const teeth = new FaceExpressions({}, undefined, { browInnerToOuter: 1, whiteAboveIris: -0.15, lipGap: 0.05, cornerLift: 0 });

        expect(faceShape(teeth).mouthOpen).toBe(1);
    });

    it('closes the eyes to a thin line', () => {
        expect(eyeHeight(1)).toBe(50);
        expect(eyeHeight(0)).toBe(4);
    });

    it('keeps the brows level when neutral', () => {
        expect(browPose(neutral, 'left')).toEqual({ y: -105, roll: 0 });
        expect(browPose(neutral, 'right')).toEqual({ y: -105, roll: -0 });
    });

    it('lowers the brows and turns their inner ends down when angry', () => {
        const angry = { ...neutral, angry: 1 };

        expect(browPose(angry, 'left').y).toBeGreaterThan(-105);
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
        expect(browPose({ ...neutral, surprised: 1 }, 'left').y).toBe(-145);
    });

    it('turns the mouth corners up when happy and down when sad', () => {
        expect(mouthPose(neutral)).toEqual({ width: 70, height: 8, cornerWidth: 30, cornerY: -0, cornerRoll: 0 });

        const happy = mouthPose({ ...neutral, happy: 1 });
        const sad = mouthPose({ ...neutral, sad: 1 });
        expect(happy.width).toBe(110);
        expect(happy.cornerY).toBeLessThan(0);
        expect(happy.cornerRoll).toBeGreaterThan(0);
        expect(sad.cornerY).toBeGreaterThan(0);
        expect(sad.cornerRoll).toBeLessThan(0);
    });

    it('makes a narrow, tall O when surprised and a wide, flat line when angry', () => {
        const surprised = mouthPose({ ...neutral, surprised: 1, mouthOpen: 1 });
        const angry = mouthPose({ ...neutral, angry: 1 });

        expect(surprised.width).toBe(30);
        expect(surprised.height).toBe(108);
        expect(surprised.cornerWidth).toBe(1);
        expect(angry.width).toBe(100);
        expect(angry.height).toBe(4);
    });

    it('turns the mouth from red to pink as the smile grows', () => {
        expect(mouthColor(0)).toEqual({ red: 200, green: 30, blue: 40 });
        expect(mouthColor(1)).toEqual({ red: 255, green: 120, blue: 180 });
        expect(mouthColor(2)).toEqual(mouthColor(1));
    });
});

describe('Tutorial 11: emotion colors', () => {
    it('has a color for every emotion and neutral', () => {
        expect(Object.keys(EMOTION_COLORS).sort()).toEqual(['angry', 'happy', 'neutral', 'sad', 'surprised']);
    });

    it('explains the emotions', () => {
        expect(expressions_explanation).toContain('emotion');
        expect(expressions_explanation).toContain('angry');
    });
});
