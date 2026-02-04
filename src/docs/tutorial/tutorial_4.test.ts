import {describe, expect, it} from 'vitest';
import {tutorial_4} from './tutorial_4';
import {SceneManager} from "../../scene/scene_manager.ts";
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {DEFAULT_SKETCH_CONFIG} from "./tutorial_main_page.demo.ts";

describe('Tutorial 4: SceneManager & Camera Injection', () => {

    it('should drive the tutorial using a controlled manager and modifiers', async () => {
        const mockP5 = createMockP5();

        // Initialize manager (The Temporal/Camera Brain)
        const manager = new SceneManager();

        // Execute tutorial logic
        // We pass our manager to control time and modifiers from the test
        const world = tutorial_4(mockP5 as unknown as p5, {...DEFAULT_SKETCH_CONFIG, manager});
        mockP5.setup(); // Triggers registration and modifier attachment

        // TEST POINT: T=0ms (Start of Orbit) ---
        mockP5.millis.mockReturnValue(0);
        mockP5.draw(); // Calculate state -> Render

        const state0 = world.getCurrentSceneState();

        // Orbit starting position at distance 800
        expect(state0.camera.position.z).toBeCloseTo(800, 0);

        // Verify the 5 boxes registered in the loop were drawn
        expect(mockP5.box).toHaveBeenCalledTimes(5);

        // TEST POINT: T=2500ms (Halfway through 5s orbit) ---
        // At 50% progress, the camera should be on the opposite side (z = -800)
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const state50 = world.getCurrentSceneState();

        // OrbitModifier: cos(PI) * 800 = -800
        expect(state50.camera.position.z).toBeCloseTo(-800, 0);

        // Ensure the CenterFocusModifier is keeping the camera pointed at origin
        expect(state50.camera.lookAt).toMatchObject({x: 0, y: 0, z: 0});
    });
});