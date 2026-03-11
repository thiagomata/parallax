import {describe, expect, it} from 'vitest';
import {tutorial_9} from './tutorial_9';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedSphere, type ResolvedCylinder} from "../../scene/types.ts";

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
        expect(objState.fillColor?.green).toBe(128);
        expect(objState.fillColor?.blue).toBe(0);
        expect(objState.strokeColor?.red).toBe(255);
        expect(objState.strokeColor?.green).toBe(255);
        expect(objState.strokeColor?.blue).toBe(255);

        const lookToObjState = world.getCurrenState()?.elements.get('look-to-obj') as ResolvedCylinder;
        expect(lookToObjState).toBeDefined();
        if (!lookToObjState) return;

        // Cylinder has look_at effect pointing to 'obj'
        expect(lookToObjState.rotate).toBeDefined();

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

    it('should update cylinder rotation to face the moving object', async () => {
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

        // Progress 0 (T = 0) - sphere at (0, 100, 200)
        mockP5.millis.mockReturnValue(0);
        mockP5.draw();

        const cylinder0 = world.getCurrenState()?.elements.get('look-to-obj') as ResolvedCylinder;
        expect(cylinder0).toBeDefined();
        if (!cylinder0) return;

        const yawAt0 = cylinder0.rotate?.yaw ?? 0;
        const pitchAt0 = cylinder0.rotate?.pitch ?? 0;

        // Progress 0.25 (T = 2500ms) - sphere moved to (0, 200, -200)
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const cylinder25 = world.getCurrenState()?.elements.get('look-to-obj') as ResolvedCylinder;
        expect(cylinder25).toBeDefined();
        if (!cylinder25) return;

        const yawAt25 = cylinder25.rotate?.yaw ?? 0;
        const pitchAt25 = cylinder25.rotate?.pitch ?? 0;

        // Progress 0.5 (T = 5000ms) - sphere at (0, 100, -200)
        mockP5.millis.mockReturnValue(5000);
        mockP5.draw();

        const cylinder50 = world.getCurrenState()?.elements.get('look-to-obj') as ResolvedCylinder;
        expect(cylinder50).toBeDefined();
        if (!cylinder50) return;

        const yawAt50 = cylinder50.rotate?.yaw ?? 0;
        const pitchAt50 = cylinder50.rotate?.pitch ?? 0;

        // Progress 0.75 (T = 7500ms)
        mockP5.millis.mockReturnValue(7500);
        mockP5.draw();

        const cylinder75 = world.getCurrenState()?.elements.get('look-to-obj') as ResolvedCylinder;
        expect(cylinder75).toBeDefined();
        if (!cylinder75) return;

        const yawAt75 = cylinder75.rotate?.yaw ?? 0;
        const pitchAt75 = cylinder75.rotate?.pitch ?? 0;

        // The cylinder should rotate to face the moving sphere
        // At minimum, verify the rotation values changed as the target moved
        const yawChanged = (
            Math.abs(yawAt25 - yawAt0) > 0.1 ||
            Math.abs(yawAt50 - yawAt25) > 0.1 ||
            Math.abs(yawAt75 - yawAt50) > 0.1
        );
        const pitchChanged = (
            Math.abs(pitchAt25 - pitchAt0) > 0.1 ||
            Math.abs(pitchAt50 - pitchAt25) > 0.1 ||
            Math.abs(pitchAt75 - pitchAt50) > 0.1
        );

        expect(yawChanged || pitchChanged).toBe(true);
    });

    createPauseTests('Tutorial 9', tutorial_9);
});