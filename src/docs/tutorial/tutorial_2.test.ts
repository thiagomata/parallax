import {describe, expect, it} from 'vitest';
import {tutorial_2} from './tutorial_2';
import {SceneManager} from "../../scene/scene_manager.ts";
import {DEFAULT_SETTINGS, type ResolvedBox} from "../../scene/types.ts";
import {SceneResolver} from "../../scene/resolver/resolver.ts";
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';

describe('Tutorial 2: Progression Integration', () => {

    it('should resolve pulsing size and color using the actual tutorial logic', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        // Inject a manager with 4000ms duration for predictable math
        const manager = new SceneManager({
            ...DEFAULT_SETTINGS,
            playback: {
                ...DEFAULT_SETTINGS.playback,
                duration: 4000,
                isLoop: true
            }
        });

        // Execute the actual tutorial function
        const world = tutorial_2(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400, 
            manager,
            paused: false
        });
        mockP5.setup(); // Triggers registration

        // TEST POINT A: Progress 0.0 (T = 0ms) ---
        mockP5.draw(); // Calculates state and steps world

        const element = world.getElement('pulsing-box');
        if (!element) throw new Error("Pulsing box not registered");

        const resolver = new SceneResolver({});
        const props0 = resolver.resolve(element, world.getCurrentSceneState()) as { resolved: ResolvedBox };

        // Size: 100 + sin(0) * 50 = 100
        expect(props0.resolved.width).toBe(100);
        // Blue: 127 + 127 * cos(0) = 254 (or ~255)
        expect(props0.resolved.fillColor?.blue).toBeCloseTo(254, 0);

        // TEST POINT B: Progress 0.25 (T = 1000ms / 4000ms) ---
        mockP5.millis.mockReturnValue(1000);
        mockP5.draw();

        const props25 = resolver.resolve(element, world.getCurrentSceneState()) as { resolved: ResolvedBox };

        // Size: 100 + sin(PI/2) * 50 = 150
        expect(props25.resolved.width).toBeCloseTo(150, 0);
        // Rotation: PI * 2 * 0.25 = PI/2
        expect(props25.resolved.rotate?.y).toBeCloseTo(Math.PI * 0.5, 5);
        // Blue: 127 + 127 * cos(PI/2) = 127
        expect(props25.resolved.fillColor?.blue).toBeCloseTo(127, 0);

        // TEST POINT C: Progress 0.5 (T = 2000ms) ---
        mockP5.millis.mockReturnValue(2000);
        mockP5.draw();

        const props50 = resolver.resolve(element, world.getCurrentSceneState()) as { resolved: ResolvedBox };
        // Size: 100 + sin(PI) * 50 = 100
        expect(props50.resolved.width).toBeCloseTo(100, 5);
        // Blue: 127 + 127 * cos(PI) = 0
        expect(props50.resolved.fillColor?.blue).toBeCloseTo(0, 0);

        // Verify side effect: The Bridge called p5
        expect(mockP5.box).toHaveBeenCalled();
    });

    // Use the shared pause test utility
    createPauseTests('Tutorial 2', tutorial_2);
});