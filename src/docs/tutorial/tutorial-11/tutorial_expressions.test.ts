import {describe, expect, it, vi, beforeEach} from 'vitest';
import {
    tutorial_expressions, expressions_explanation, eyeHeight, mouthSize, EMOTION_COLORS,
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
        for (const id of ['head', 'left-eye', 'right-eye', 'left-pupil', 'right-pupil', 'mouth']) {
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

    it('draws frames with and without a face', async () => {
        for (const face of [createMockFaceWorldData(), null]) {
            const { world, mockP5 } = await createScene(face);
            await mockP5.draw();
            await mockP5.draw();
            expect(world).toBeDefined();
        }
    });
});

describe('Tutorial 11: the face', () => {
    it('closes the eyes to a thin line', () => {
        expect(eyeHeight(1)).toBe(50);
        expect(eyeHeight(0)).toBe(4);
    });

    it('widens the mouth with the smile and opens it with the jaw', () => {
        expect(mouthSize(null)).toEqual({ width: 90, height: 8 });
        const expressions = new FaceExpressions({ mouthSmileLeft: 0.95, mouthSmileRight: 0.95, jawOpen: 0.5 }).normalize();
        expect(mouthSize(expressions)).toEqual({ width: 180, height: 108 });
    });

    it('has a color for every emotion and neutral', () => {
        expect(Object.keys(EMOTION_COLORS).sort()).toEqual(['angry', 'happy', 'neutral', 'sad', 'sleepy', 'surprised']);
    });

    it('explains the emotions and points to the game', () => {
        expect(expressions_explanation).toContain('emotion');
        expect(expressions_explanation).toContain('Emotion Game');
    });
});
