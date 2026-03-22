import {describe, expect, it} from 'vitest';
import {tutorial_camera_control} from './tutorial_camera_control.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from '../pause_test_utils.ts';
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox} from "../../../scene/types.ts";

describe('Tutorial 4: Camera Control Camera Orbit', () => {

    it('should register grid of boxes and set up orbit camera', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 5000,
                isLoop: true
            }
        });

        const world = tutorial_camera_control(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        mockP5.setup();
        mockP5.draw();

        // Verify grid of boxes registered (5x5 = 25 boxes)
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const element = world.getElement(`box-${i}-${j}`);
                expect(element).toBeDefined();
            }
        }

        mockP5.draw();

        // Verify first box properties
        const box00 = world.getCurrenState()?.elements.get('box-0-0') as ResolvedBox;
        expect(box00).toBeDefined();
        if (!box00) return;
        
        expect(box00.width).toBe(40);
        expect(box00.position).toStrictEqual({x: -200, y: 0, z: 200});
        expect(box00.fillColor?.red).toBe(0);
        expect(box00.fillColor?.green).toBe(255);
        expect(box00.fillColor?.blue).toBe(200);

        // Verify center box (box-2-2)
        const box22 = world.getCurrenState()?.elements.get('box-2-2') as ResolvedBox;
        expect(box22).toBeDefined();
        if (!box22) return;
        expect(box22.position.x).toBe(0);
        expect(box22.position.z).toBe(0);
        expect(box22.fillColor?.red).toBe(100);
        expect(box22.fillColor?.green).toBe(155);

        // Verify last box (box-4-4)
        const box44 = world.getCurrenState()?.elements.get('box-4-4') as ResolvedBox;
        expect(box44).toBeDefined();
        if (!box44) return;
        expect(box44.position.x).toBe(200);
        expect(box44.position.z).toBe(-200);
        expect(box44.fillColor?.red).toBe(200);
        expect(box44.fillColor?.green).toBe(55);

        // Verify side effects - p5 drawing functions called
        expect(mockP5.box).toHaveBeenCalled();
    });

    createPauseTests('Tutorial 4: Camera Control', tutorial_camera_control);
});