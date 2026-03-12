import {describe, expect, it} from 'vitest';
import {tutorial_2} from './tutorial_2';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox} from "../../scene/types.ts";

describe('Tutorial 2: Progression Integration', () => {

    it('should resolve pulsing size and color using the actual tutorial logic', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        // Inject a manager with 4000ms duration for predictable math
        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 4000,
                isLoop: true
            }
        });

        // Execute the actual tutorial function
        const world = tutorial_2(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400, 
            clock: clock,
            paused: false
        });
        mockP5.setup(); // Triggers registration

        // TEST POINT A: Progress 0.0 (T = 0ms) ---
        mockP5.draw(); // Calculates state and steps world

        const element = world.getElement('pulsing-box');
        if (!element) throw new Error("Pulsing box not registered");

        // let graphicProcessor = createMockGraphicProcessor<any>();
        // world.step(graphicProcessor);
        mockP5.draw();

        const box1 = world.getCurrenState()?.elements.get('pulsing-box') as ResolvedBox;
        expect(box1).toBeDefined();
        if(!box1) return;
        expect(box1.position).toStrictEqual({x:0,y:0,z:0});
        expect(box1.width).toBe(100);
        expect(box1.fillColor?.blue).toBeCloseTo(254, 0);
        expect(
            ( 255 - box1.fillColor!.blue  ) == box1.strokeColor!.blue &&
            ( 255 - box1.fillColor!.red   ) == box1.strokeColor!.red  &&
            ( 255 - box1.fillColor!.green ) == box1.strokeColor!.green
        ).toBe(true);

        // TEST POINT B: Progress 0.25 (T = 1000ms / 4000ms) ---
        mockP5.millis.mockReturnValue(1000);
        mockP5.draw();

        const box25 = world.getCurrenState()?.elements.get('pulsing-box') as ResolvedBox;
        expect(box25).toBeDefined();
        if(!box25) return;
        expect(box25.width).toBeCloseTo(150, 0);
        expect(box25.rotate?.yaw).toBeCloseTo(Math.PI * 0.5, 5);
        expect(box25.fillColor?.blue).toBeCloseTo(127, 0);

        // TEST POINT C: Progress 0.5 (T = 2000ms) ---
        mockP5.millis.mockReturnValue(2000);
        mockP5.draw();

        const box50 = world.getCurrenState()?.elements.get('pulsing-box') as ResolvedBox;
        // Size: 100 + sin(PI) * 50 = 100
        expect(box50.width).toBeCloseTo(100, 5);
        // Blue: 127 + 127 * cos(PI) = 0
        expect(box50.fillColor?.blue).toBeCloseTo(0, 0);

        // Verify side effect: The Bridge called p5
        expect(mockP5.box).toHaveBeenCalled();
        expect(mockP5.stroke).toHaveBeenCalled();
        expect(mockP5.fill).toHaveBeenCalled();
    });

    // Use the shared pause test utility
    createPauseTests('Tutorial 2', tutorial_2);
});