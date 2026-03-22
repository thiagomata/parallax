import {describe, expect, it, vi} from 'vitest';
import {tutorial_observer} from './tutorial_observer.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS} from "../../../scene/types.ts";
import {createFaceWorldData, createMockHeadTrackingProvider} from "../../../scene/mock/face.mock.ts";

describe('Tutorial 8: The Observer', () => {

    it('should register face tracking visualization elements', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createFaceWorldData();
        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(face1);

        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const world = await tutorial_observer(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);
        await mockP5.setup();

        const faceBox = world.getElement('faceBox');
        expect(faceBox).toBeDefined();

        const nose = world.getElement('nose');
        expect(nose).toBeDefined();

        const leftEye = world.getElement('left-eye');
        expect(leftEye).toBeDefined();

        const rightEye = world.getElement('right-eye');
        expect(rightEye).toBeDefined();
    });
});
