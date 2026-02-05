import {describe, expect, it} from 'vitest';
import {tutorial_1} from './tutorial_1';
import {World} from "../../scene/world";
import {SceneManager} from "../../scene/scene_manager";
import {DEFAULT_SETTINGS, ELEMENT_TYPES, type ResolvedBox, type SceneState} from "../../scene/types";
import {SceneResolver} from "../../scene/resolver";
import {createMockGraphicProcessor} from "../../scene/mock/mock_graphic_processor.mock.ts";
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import p5 from "p5";
import {createPauseTests} from "./pause_test_utils.ts";

describe('Tutorial 1: Foundation & Engine Integration', () => {

    describe('Engine Mechanics', () => {
        it('should correctly register and find elements in the world', () => {
            const mockP5 = createMockP5();
            const loader = new P5AssetLoader(mockP5 as unknown as p5);
            const manager = new SceneManager(DEFAULT_SETTINGS);
            const world = new World(manager, loader);

            // Use the new extreme typed method instead of addElement/toProps
            world.addBox('test-box', {
                type: ELEMENT_TYPES.BOX,
                width: 100,
                position: {x: 10, y: 20, z: 30},
                fillColor: {red: 100, green: 100, blue: 255},
            });

            const state = world.getCurrentSceneState();

            expect(state.settings.window.width).toBe(800);
            expect(world.getElement('test-box')).toBeDefined();
        });

        it('should resolve computed properties dynamically during world.step', () => {
            const mockP5 = createMockP5();
            const loader = new P5AssetLoader(mockP5 as unknown as p5);
            const manager = new SceneManager(DEFAULT_SETTINGS);
            const world = new World(manager, loader);
            const mockGP = createMockGraphicProcessor();

            world.addBox('dynamic-box', {
                type: ELEMENT_TYPES.BOX,
                width: (state: SceneState) => state.playback.now > 1000 ? 200 : 100,
                position: {x: 0, y: 0, z: 0}
            });

            // T = 0
            mockGP.millis.mockReturnValue(0);
            world.step(mockGP);

            // The first draw should be size 100
            expect(mockGP.drawBox).toHaveBeenCalledWith(
                expect.objectContaining({width: 100}),
                expect.anything(),
                expect.anything()
            );

            // T = 2000
            mockGP.millis.mockReturnValue(2000);
            world.step(mockGP);

            // The last draw should be size 200
            expect(mockGP.drawBox).toHaveBeenLastCalledWith(
                expect.objectContaining({width: 200}),
                expect.anything(),
                expect.anything()
            );
        });
    });

    describe('Tutorial Function Execution', () => {
        it('should initialize the tutorial world and render with p5', async () => {
            const mockP5 = createMockP5();

            // Execute actual tutorial logic
            const world = tutorial_1(mockP5 as unknown as p5);
            mockP5.setup(); // Triggers registration

            // Verify the specific content defined in tutorial_1.ts
            const element = world.getElement('box');
            if (!element) throw new Error("Tutorial box missing");

            // Use our deterministic resolver
            const resolver = new SceneResolver({});
            const resolvedBundle = resolver.resolve(element, world.getCurrentSceneState()) as { resolved: ResolvedBox };
            expect(resolvedBundle.resolved.width).toBe(100);
            expect(resolvedBundle.resolved.fillColor?.blue).toBe(255);

            // Verify the render loop actually hits p5 via the Bridge
            mockP5.draw();
            expect(mockP5.box).toHaveBeenCalledWith(100, 100, 100);
            // p5 fill uses 0-255 for RGBA
            expect(mockP5.fill).toHaveBeenCalledWith(100, 100, 255, 255);
        });
    });

    // Use the shared pause test utility
    createPauseTests('Tutorial 1', tutorial_1);
});