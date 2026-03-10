import {describe, expect, it} from 'vitest';
import {tutorial_9} from './tutorial_9';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedSphere} from "../../scene/types.ts";

describe('Tutorial 9: Look At The Object', () => {

    it('should register objects with look_at effect', async () => {
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

        const world = tutorial_9(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        mockP5.setup();
        mockP5.draw();

        // Verify main object (sphere)
        const obj = world.getElement('obj');
        expect(obj).toBeDefined();

        // Verify look-at cylinder
        const lookToObj = world.getElement('look-to-obj');
        expect(lookToObj).toBeDefined();

        mockP5.draw();

        // Check resolved states
        const objState = world.getCurrenState()?.elements.get('obj') as ResolvedSphere;
        expect(objState).toBeDefined();
        if (!objState) return;

        expect(objState.radius).toBe(20);
        expect(objState.fillColor?.red).toBe(0);
        expect(objState.fillColor?.green).toBe(255);
        expect(objState.fillColor?.blue).toBe(0);
        expect(objState.strokeColor?.red).toBe(255);
        expect(objState.strokeColor?.green).toBe(255);
        expect(objState.strokeColor?.blue).toBe(255);

        const lookToObjState = world.getCurrenState()?.elements.get('look-to-obj');
        expect(lookToObjState).toBeDefined();
        if (!lookToObjState) return;

        // Verify side effects - p5 drawing functions called
        expect(mockP5.sphere).toHaveBeenCalled();
    });

    it('should animate object position over time', async () => {
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

        const world = tutorial_9(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        mockP5.setup();

        // Progress 0 (T = 0)
        mockP5.millis.mockReturnValue(0);
        mockP5.draw();

        const obj0 = world.getCurrenState()?.elements.get('obj') as ResolvedSphere;
        expect(obj0).toBeDefined();
        if (!obj0) return;

        // circularProgress = 0 * 4 * PI = 0
        // x = sin(0) * 200 = 0
        // z = cos(0) * 200 = 200
        // y = 100 + sin(0) * 100 = 100
        expect(obj0.position?.x).toBeCloseTo(0, 1);
        expect(obj0.position?.y).toBeCloseTo(100, 1);
        expect(obj0.position?.z).toBeCloseTo(200, 1);

        // Progress 0.25 (T = 2500ms)
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const obj25 = world.getCurrenState()?.elements.get('obj') as ResolvedSphere;
        expect(obj25).toBeDefined();
        if (!obj25) return;

        // circularProgress = 0.25 * 4 * PI = PI
        // x = sin(PI) * 200 = 0
        // z = cos(PI) * 200 = -200
        // y = 100 + sin(PI * 0.5) * 100 = 100 + 1 * 100 = 200
        expect(obj25.position?.x).toBeCloseTo(0, 1);
        expect(obj25.position?.y).toBeCloseTo(200, 1);
        expect(obj25.position?.z).toBeCloseTo(-200, 1);
    });

    createPauseTests('Tutorial 9', tutorial_9);
});