import {describe, expect, it} from 'vitest';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {type ResolvedFloor, type ResolvedSphere} from "../../scene/types.ts";
import {SceneResolver} from "../../scene/resolver.ts";
import {createPauseTests} from './pause_test_utils.ts';
import {tutorial_6} from "./tutorial_6.ts";

describe('Tutorial 6: Hybrid Property Resolution', () => {

    it('should correctly resolve atomic position and granular color', async () => {
        const mockP5 = createMockP5();

        // Initialize the Tutorial
        const world = tutorial_6(mockP5 as unknown as p5);

        // Registration
        // In the sketch, p.setup is async and handles registration
        await mockP5.setup();

        // TEST POINT: Progress 0.25 (T = 1250ms / 5000ms) ---
        // At 0.25 progress, sin(0.25 * 2PI) = sin(PI/2) = 1
        mockP5.millis.mockReturnValue(1250);
        mockP5.draw();

        const state = world.getCurrentSceneState();
        expect(state.playback.progress).toBe(0.25);

        // Verify THE HERO SPHERE (The Hybrid Test)
        const sphereElement = world.getElement('hero-sphere');
        const resolver = new SceneResolver({});
        const resSphere = resolver.resolve(sphereElement!, state) as { resolved: ResolvedSphere };

        // Position X (Atomic): sin(0.25 * 2PI) * 100 = 100
        expect(resSphere.resolved.position.x).toBeCloseTo(100, 5);
        expect(resSphere.resolved.position.y).toBe(0);

        // Blue Channel (Granular): 127 + 127 * sin(0.25 * 2PI) = 254
        expect(resSphere.resolved.fillColor?.blue).toBeCloseTo(254, 5);
        expect(resSphere.resolved.fillColor?.red).toBe(255);

        // Verify THE FLOOR (Static Geometry)
        const floorElement = world.getElement('floor');
        const resFloor = resolver.resolve(floorElement!, state) as { resolved: ResolvedFloor };

        expect(resFloor.resolved.width).toBe(500);
        expect(resFloor.resolved.position.y).toBe(100);

        // Verify THE BRIDGE (Execution)
        // Check that the GraphicProcessor actually called p5
        expect(mockP5.sphere).toHaveBeenCalledWith(40);
        expect(mockP5.plane).toHaveBeenCalledWith(500, 500);
        expect(mockP5.background).toHaveBeenCalledWith(15);
    });

    it('should resolve to opposite values at 0.75 progress', async () => {
        const mockP5 = createMockP5();
        const world = tutorial_6(mockP5 as unknown as p5);
        await mockP5.setup();

        // TEST POINT: Progress 0.75 (T = 3750ms / 5000ms) ---
        // At 0.75 progress, sin(1.5PI) = -1
        mockP5.millis.mockReturnValue(3750);
        mockP5.draw();

        const state = world.getCurrentSceneState();
        const sphereElement = world.getElement('hero-sphere');
        const resolver = new SceneResolver({});
        const resSphere = resolver.resolve(sphereElement!, state) as { resolved: ResolvedSphere };

        // Position X: sin(1.5PI) * 100 = -100
        expect(resSphere.resolved.position.x).toBeCloseTo(-100, 5);

        // Blue Channel: 127 + 127 * (-1) = 0
        expect(resSphere.resolved.fillColor?.blue).toBeCloseTo(0, 5);
    });
    // Use the shared pause test utility
    createPauseTests('Tutorial 6', tutorial_6);
});
