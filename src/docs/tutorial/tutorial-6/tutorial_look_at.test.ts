import {describe, expect, it} from 'vitest';
import {tutorial_look_at} from './tutorial_look_at.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS} from "../../../scene/types.ts";

describe('Tutorial 6: Look At Objects Looking at Each Other', () => {

    it('should register elements with look_at effect', async () => {
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

        const world = await tutorial_look_at(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        await mockP5.setup();
        mockP5.draw();

        const movingObj = world.getElement('obj');
        expect(movingObj).toBeDefined();

        const lookAtObj = world.getElement('look-to-obj');
        expect(lookAtObj).toBeDefined();
    });
});
