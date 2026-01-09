import { describe, it, expect } from 'vitest';
import { tutorial_1 } from './tutorial_1';
import { World } from "../../scene/world";
import { SceneManager } from "../../scene/scene_manager";
import {type BoxProps, ELEMENT_TYPES, type ResolvedBoxProps, type SceneState} from "../../scene/types";
import { toProps, resolve } from "../../scene/create_renderable";
import { createMockGraphicProcessor } from "../../scene/mock/mock_graphic_processor.mock.ts";
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";

describe('Tutorial 1: Foundation & Engine Integration', () => {

    // --- SECTION 1: ENGINE UNIT TESTS (Your Original Tests) ---
    // These ensure the core "World" class respects property resolution logic.
    describe('Engine Mechanics', () => {
        it('should correctly resolve static box properties in the scene state', () => {
            const manager = new SceneManager();
            const world = new World(manager);

            const boxProps = toProps({
                type: ELEMENT_TYPES.BOX,
                size: 100,
                position: { x: 10, y: 20, z: 30 },
                fillColor: { red: 100, green: 100, blue: 255 },
            }) as BoxProps;

            world.addElement('test-box', boxProps);
            const state = world.getSceneState();

            expect(state.settings.window.width).toBe(800);
            expect(world.getElement('test-box')).toBeDefined();
        });

        it('should resolve computed properties dynamically during world.step', () => {
            const manager = new SceneManager();
            const world = new World(manager);
            const mockGP = createMockGraphicProcessor();

            world.addElement('dynamic-box', toProps({
                type: ELEMENT_TYPES.BOX,
                size: (state: SceneState) => state.playback.now > 1000 ? 200 : 100,
                position: { x: 0, y: 0, z: 0 }
            }) as BoxProps);

            mockGP.millis.mockReturnValue(0);
            world.step(mockGP);
            expect(mockGP.drawBox).toHaveBeenCalledWith(
                expect.objectContaining({ size: 100 }),
                expect.anything(),
                expect.anything()
            );

            mockGP.millis.mockReturnValue(2000);
            world.step(mockGP);
            expect(mockGP.drawBox).toHaveBeenLastCalledWith(
                expect.objectContaining({ size: 200 }),
                expect.anything(),
                expect.anything()
            );
        });
    });

    // --- SECTION 2: DOCUMENTATION INTEGRATION (The New Pattern) ---
    // These ensure that the actual tutorial code is bug-free and wires up correctly.
    describe('Tutorial Function Execution', () => {
        it('should initialize the tutorial world and render with p5', async () => {
            const mockP5 = createMockP5();

            // Execute actual tutorial
            const world = tutorial_1(mockP5 as unknown as p5);
            await mockP5.setup();

            // Verify the specific content defined in tutorial_1.ts
            const element = world.getElement('box');
            if(!element) throw new Error("Tutorial box missing");

            const resolved = resolve(element.props, world.getSceneState()) as ResolvedBoxProps;
            expect(resolved.size).toBe(100);
            expect(resolved.fillColor?.blue).toBe(255);

            // Verify the render loop actually hits p5
            mockP5.draw();
            expect(mockP5.box).toHaveBeenCalledWith(100);
            expect(mockP5.fill).toHaveBeenCalledWith(100, 100, 255, 255);
        });
    });
});