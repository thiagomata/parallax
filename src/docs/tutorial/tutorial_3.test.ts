import {describe, expect, it} from 'vitest';
import {tutorial_3} from './tutorial_3';
import {SceneManager} from "../../scene/scene_manager.ts";
import {DEFAULT_SETTINGS} from "../../scene/types.ts";
import {resolve} from "../../scene/create_renderable.ts";
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";

describe('Tutorial 3 Integration: Computed Orbit', () => {

    it('should calculate orbit positions correctly using the tutorial logic', async () => {
        const mockP5 = createMockP5()

        // Use a manager with a known duration for predictable math
        const manager = new SceneManager({
            ...DEFAULT_SETTINGS,
            playback: { ...DEFAULT_SETTINGS.playback, duration: 5000 }
        });

        // 1. Execute tutorial
        const world = tutorial_3(mockP5 as unknown as p5, manager);
        await mockP5.setup();

        // 2. Test T=0 (0% progress) -> cos(0)=1, sin(0)=0
        mockP5.millis.mockReturnValue(0);
        mockP5.draw();

        // We find our element in the world state
        const element0 = resolve(
            world.getElement( 'orbit-box'),
            world.getSceneState(),
        );
        expect(element0?.props.position).toMatchObject({
            x: 40,
            y: 0,
            z: 0
        });

        // 3. Test T=1250 (25% progress) -> cos(90°)=0, sin(90°)=1
        mockP5.millis.mockReturnValue(1250);
        mockP5.draw();

        const element = resolve(
            world.getElement('orbit-box')?.props,
            world.getSceneState(),
        );
        if (!element) throw new Error("orbit-box not found");

        expect(element.position.x).toBeCloseTo(0, 5);
        expect(element.position.y).toBe(40);

        // 4. Verify p5 side effects
        expect(mockP5.box).toHaveBeenCalled();
    });
});