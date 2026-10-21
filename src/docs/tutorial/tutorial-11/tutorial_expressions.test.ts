import {describe, expect, it, vi, beforeEach} from 'vitest';
import {
    tutorial_expressions, expressions_explanation, faceShape, eyeHeight, mouthSize, mouthColor,
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
        for (const id of ['head', 'left-eye', 'right-eye', 'left-pupil', 'right-pupil', 'left-brow', 'right-brow', 'nose', 'mouth']) {
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

describe('Tutorial 11: face shape', () => {
    it('is a neutral face without expressions', () => {
        expect(faceShape(null)).toEqual({ leftEyeOpen: 1, rightEyeOpen: 1, mouthOpen: 0, smile: 0, browsUp: 0 });
        expect(faceShape(undefined).mouthOpen).toBe(0);
    });

    it('reads the expressions it is given', () => {
        const expressions = new FaceExpressions({
            eyeBlinkLeft: 0.25, eyeBlinkRight: 1, jawOpen: 0.5, mouthSmileLeft: 0.2, mouthSmileRight: 0.4, browInnerUp: 0.7,
        });

        expect(faceShape(expressions)).toEqual({
            leftEyeOpen: 0.75, rightEyeOpen: 0, mouthOpen: 0.5, smile: expect.closeTo(0.3), browsUp: 0.7,
        });
    });

    it('closes the eyes to a thin line', () => {
        expect(eyeHeight(1)).toBe(50);
        expect(eyeHeight(0)).toBe(4);
    });

    it('widens the mouth with the smile and opens it with the jaw', () => {
        const neutral = faceShape(null);

        expect(mouthSize(neutral)).toEqual({ width: 90, height: 8 });
        expect(mouthSize({ ...neutral, smile: 1, mouthOpen: 1 })).toEqual({ width: 180, height: 108 });
    });

    it('turns the mouth from red to pink as the smile grows', () => {
        expect(mouthColor(0)).toEqual({ red: 200, green: 30, blue: 40 });
        expect(mouthColor(1)).toEqual({ red: 255, green: 120, blue: 180 });
    });
});
