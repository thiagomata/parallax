import {describe, expect, it} from 'vitest';
import {tutorial_3} from './tutorial_3';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox} from "../../scene/types.ts";

describe('Tutorial 3: Orbital Movement', () => {

    it('should resolve orbiting box position using the actual tutorial logic', async () => {
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

        const world = tutorial_3(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400, 
            clock: clock,
            paused: false
        });
        mockP5.setup();
        mockP5.draw();

        const element = world.getElement('orbit-box');
        if (!element) throw new Error("Orbit box not registered");

        mockP5.draw();

        const box1 = world.getCurrenState()?.elements.get('orbit-box') as ResolvedBox;
        expect(box1).toBeDefined();
        if(!box1) return;
        
        expect(box1.width).toBe(50);
        expect(box1.position.z).toBe(-100);
        expect(box1.fillColor?.green).toBe(255);
        expect(box1.fillColor?.blue).toBe(150);
        expect(box1.strokeColor?.blue).toBe(255);
        expect(box1.strokeWidth).toBe(5);

        // TEST POINT A: Progress 0.0 (T = 0ms)
        // x = cos(0) * 50 = 1 * 50 = 50
        // y = sin(0) * 50 = 0
        expect(box1.position.x).toBeCloseTo(50, 1);
        expect(box1.position.y).toBeCloseTo(0, 1);
        // pitch = 0 * PI = 0
        // yaw = 0 * 2PI = 0
        expect(box1.rotate?.pitch).toBeCloseTo(0, 5);
        expect(box1.rotate?.yaw).toBeCloseTo(0, 5);

        // TEST POINT B: Progress 0.25 (T = 1250ms)
        mockP5.millis.mockReturnValue(1250);
        mockP5.draw();

        const box25 = world.getCurrenState()?.elements.get('orbit-box') as ResolvedBox;
        expect(box25).toBeDefined();
        if(!box25) return;
        // x = cos(0.25 * 2PI) * 50 = cos(0.5PI) * 50 = 0
        // y = sin(0.25 * 2PI) * 50 = sin(0.5PI) * 50 = 1 * 50 = 50
        expect(box25.position.x).toBeCloseTo(0, 1);
        expect(box25.position.y).toBeCloseTo(50, 1);
        // pitch = 0.25 * PI = 0.25PI
        // yaw = 0.25 * 2PI = 0.5PI
        expect(box25.rotate?.pitch).toBeCloseTo(Math.PI * 0.25, 5);
        expect(box25.rotate?.yaw).toBeCloseTo(Math.PI * 0.5, 5);

        // TEST POINT C: Progress 0.5 (T = 2500ms)
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const box50 = world.getCurrenState()?.elements.get('orbit-box') as ResolvedBox;
        expect(box50).toBeDefined();
        if(!box50) return;
        // x = cos(0.5 * 2PI) * 50 = cos(PI) * 50 = -1 * 50 = -50
        // y = sin(0.5 * 2PI) * 50 = sin(PI) * 50 = 0
        expect(box50.position.x).toBeCloseTo(-50, 1);
        expect(box50.position.y).toBeCloseTo(0, 1);
        // pitch = 0.5 * PI = 0.5PI
        // yaw = 0.5 * 2PI = PI
        expect(box50.rotate?.pitch).toBeCloseTo(Math.PI * 0.5, 5);
        expect(box50.rotate?.yaw).toBeCloseTo(Math.PI, 5);

        // TEST POINT D: Progress 1.0 (T = 5000ms)
        mockP5.millis.mockReturnValue(5000);
        mockP5.draw();

        const box100 = world.getCurrenState()?.elements.get('orbit-box') as ResolvedBox;
        expect(box100).toBeDefined();
        if(!box100) return;
        // x = cos(2PI) * 50 = 50
        // y = sin(2PI) * 50 = 0
        expect(box100.position.x).toBeCloseTo(50, 1);
        expect(box100.position.y).toBeCloseTo(0, 1);
        // pitch = 1 * PI = PI (wraps to 0)
        // yaw = 1 * 2PI = 2PI (wraps to 0)
        expect(box100.rotate?.pitch).toBeCloseTo(0, 5);
        expect(box100.rotate?.yaw).toBeCloseTo(0, 5);

        // Verify side effect: The Bridge called p5
        expect(mockP5.box).toHaveBeenCalled();
        expect(mockP5.stroke).toHaveBeenCalled();
        expect(mockP5.fill).toHaveBeenCalled();
    });

    createPauseTests('Tutorial 3', tutorial_3);
});