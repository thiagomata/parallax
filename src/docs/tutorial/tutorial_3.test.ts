import {describe, expect, it} from 'vitest';
import {tutorial_3} from './tutorial_3';
import {SceneManager} from "../../scene/scene_manager.ts";
import {DEFAULT_SETTINGS, type ResolvedBox} from "../../scene/types.ts";
import {ElementResolver} from "../../scene/resolver/element_resolver.ts"; // The surgical resolver
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {DEFAULT_SKETCH_CONFIG} from "./tutorial_main_page.demo.ts";

describe('Tutorial 3 Integration: Computed Orbit', () => {

    it('should calculate orbit positions correctly using the tutorial logic', async () => {
        const mockP5 = createMockP5();

        // Inject manager with 5000ms duration
        const manager = new SceneManager({
            ...DEFAULT_SETTINGS,
            playback: {
                ...DEFAULT_SETTINGS.playback,
                duration: 5000,
                isLoop: true
            }
        });

        // Execute tutorial
        const world = tutorial_3(mockP5 as unknown as p5, {...DEFAULT_SKETCH_CONFIG, manager});
        mockP5.setup();

        // TEST POINT A: T=0 (0% Progress) ---
        // Progress 0.0 -> cos(0)=1, sin(0)=0. Radius=150
        mockP5.millis.mockReturnValue(0);
        mockP5.draw(); // Calculates state and steps world

        const element = world.getElement('orbit-box');
        if (!element) throw new Error("orbit-box not registered");

        const resolver = new ElementResolver({});
        const resolved0 = resolver.resolve(element, world.getCurrentSceneState()) as { resolved: ResolvedBox };

        expect(resolved0.resolved.position).toMatchObject({
            x: 50,
            y: 0,
            z: -100
        });

        // TEST POINT B: T=1250 (25% Progress) ---
        // Progress 0.25 -> cos(PI/2)=0, sin(PI/2)=1. Radius=150
        mockP5.millis.mockReturnValue(1250);
        mockP5.draw();

        const resolved25 = resolver.resolve(element, world.getCurrentSceneState()) as { resolved: ResolvedBox };

        expect(resolved25.resolved.position.x).toBeCloseTo(0, 5);
        expect(resolved25.resolved.position.y).toBeCloseTo(50, 5);

        // TEST POINT C: T=2500 (50% Progress) ---
        // Progress 0.50 -> cos(PI)=-1, sin(PI)=0
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const resolved50 = resolver.resolve(element, world.getCurrentSceneState()) as { resolved: ResolvedBox };

        expect(resolved50.resolved.position.x).toBeCloseTo(-50, 5);
        expect(resolved50.resolved.position.y).toBeCloseTo(0, 5);

        // Verify Bridge/P5 Execution
        expect(mockP5.translate).toHaveBeenCalled();
        expect(mockP5.box).toHaveBeenCalledWith(50, 50, 50);
    });

    // Use the shared pause test utility
    createPauseTests('Tutorial 3', tutorial_3);
});