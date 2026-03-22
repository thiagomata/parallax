import {describe, expect, it} from 'vitest';
import {tutorial_adding_elements} from './tutorial_adding_elements';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './../pause_test_utils.ts';
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox} from "../../../scene/types.ts";

describe('Tutorial 1: Adding Elements Basic Box with Rotation', () => {

    it('should resolve rotating box using the actual tutorial logic', async () => {
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

        const world = tutorial_adding_elements(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400, 
            clock: clock,
            paused: false
        });
        mockP5.setup();

        mockP5.draw();

        const element = world.getElement('box');
        if (!element) throw new Error("Box not registered");

        mockP5.draw();

        const box1 = world.getCurrenState()?.elements.get('box') as ResolvedBox;
        expect(box1).toBeDefined();
        if(!box1) return;
        expect(box1.position).toStrictEqual({x:0,y:0,z:0});
        expect(box1.width).toBe(100);
        expect(box1.fillColor?.red).toBe(100);
        expect(box1.fillColor?.green).toBe(100);
        expect(box1.fillColor?.blue).toBe(255);
        expect(box1.strokeColor?.red).toBe(255);
        expect(box1.strokeColor?.green).toBe(255);
        expect(box1.strokeColor?.blue).toBe(255);
        expect(box1.strokeWidth).toBe(1);

        // Pitch: -0.25 * PI = -45 degrees
        expect(box1.rotate?.pitch).toBeCloseTo(-Math.PI * 0.25, 5);
        // Yaw: 0.25 * PI + 2 * PI * 0 = 0.25 * PI = 45 degrees
        expect(box1.rotate?.yaw).toBeCloseTo(Math.PI * 0.25, 5);
        expect(box1.rotate?.roll).toBe(0);

        // TEST POINT B: Progress 0.2 (T = 1000ms / 5000ms) ---
        mockP5.millis.mockReturnValue(1000);
        mockP5.draw();

        const box20 = world.getCurrenState()?.elements.get('box') as ResolvedBox;
        expect(box20).toBeDefined();
        if(!box20) return;
        // Pitch stays constant at -0.25 * PI
        expect(box20.rotate?.pitch).toBeCloseTo(-Math.PI * 0.25, 5);
        // Yaw: 0.25 * PI + 2 * PI * 0.2 = 0.25*PI + 0.4*PI = 0.65*PI
        expect(box20.rotate?.yaw).toBeCloseTo(Math.PI * 0.25 + Math.PI * 2 * 0.2, 5);

        // TEST POINT C: Progress 0.5 (T = 2500ms) ---
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const box50 = world.getCurrenState()?.elements.get('box') as ResolvedBox;
        expect(box50).toBeDefined();
        if(!box50) return;
        // Yaw: 0.25 * PI + 2 * PI * 0.5 = 0.25*PI + PI = 1.25*PI
        expect(box50.rotate?.yaw).toBeCloseTo(Math.PI * 0.25 + Math.PI, 5);

        // TEST POINT D: Progress 1.0 (T = 5000ms) ---
        mockP5.millis.mockReturnValue(5000);
        mockP5.draw();

        const box100 = world.getCurrenState()?.elements.get('box') as ResolvedBox;
        expect(box100).toBeDefined();
        if(!box100) return;
        // Yaw: 0.25 * PI + 2 * PI * 1.0 = 0.25*PI + 2*PI = 2.25*PI = 0.25*PI (due to loop)
        expect(box100.rotate?.yaw).toBeCloseTo(Math.PI * 0.25, 5);

        // Verify side effect: The Bridge called p5
        expect(mockP5.box).toHaveBeenCalled();
        expect(mockP5.stroke).toHaveBeenCalled();
        expect(mockP5.fill).toHaveBeenCalled();
    });

    createPauseTests('Tutorial 1: Adding Elements', tutorial_adding_elements);
});