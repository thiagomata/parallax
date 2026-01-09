import {describe, expect, it} from 'vitest';
import {tutorial_4} from './tutorial_4';
import {SceneManager} from "../../scene/scene_manager.ts";
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";

describe('Tutorial 4: SceneManager Injection', () => {

    it('should drive the tutorial using a controlled manager', async () => {
        const mockP5 = createMockP5();

        mockP5.millis.mockReturnValue(0);

        // 1. Create and configure the manager in the test
        const manager = new SceneManager();
        // Note: No need for mockGP anymore!

        const world = tutorial_4(mockP5 as unknown as p5, manager);
        await mockP5.setup();

        // --- TEST POINT: T=0 ---
        mockP5.millis.mockReturnValue(0);
        mockP5.draw();

        // 1. Verify Camera State in the World
        expect(world.getSceneState().camera.position.z).toBe(800);

        // 2. Verify p5 drawing activity
        // If there are 5 boxes, p5.box() should have been called 5 times
        expect(mockP5.box).toHaveBeenCalledTimes(5);

        // --- TEST POINT: T=2500 ---
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        expect(world.getSceneState().camera.position.z).toBeCloseTo(-800, 5);
    });
});