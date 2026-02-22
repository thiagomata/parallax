import {describe, expect, it} from 'vitest';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {heroExample1} from "./hero_example_1.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import type {ResolvedCylinder, ResolvedPyramid} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG} from "./hero.demo.ts";
import {ElementResolver} from "../../scene/resolver/element_resolver.ts";

describe('Hero Demo Integration: World Animation', () => {

    it('should calculate animated box properties correctly across the 10s loop', async () => {
        const mockP5 = createMockP5();

        // Initialize the Hero Demo
        const world = heroExample1(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);

        // Trigger setup
        mockP5.setup();

        // TEST AT 0% PROGRESS (T = 0ms) ---
        mockP5.millis.mockReturnValue(0);
        mockP5.draw(); //  Frame Loop (Calculates SceneState)

        const state0 = world.getCurrenState();
        // We get the element from the world's internal registry
        const midElement0 = world.getElement('mid-cylinder');
        const resolver = new ElementResolver({});
        const resolved0 = resolver.resolve(midElement0!, state0) as { resolved: ResolvedCylinder };

        expect(resolved0.resolved.radius).toBe(100);
        expect(resolved0.resolved.position).toMatchObject({x: 0, y: 0, z: 0});

        // TEST AT 25% PROGRESS (T = 2500ms) ---
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const state25 = world.getCurrenState();
        const resolved25 = resolver.resolve(midElement0!, state25) as { resolved: ResolvedCylinder };
        // const resolved25 = midElement0?.resolve(state25) as ResolvedBox;

        expect(resolved25.resolved.radius).toBeCloseTo(50, 5);
        expect(resolved25.resolved.position.y).toBeCloseTo(-100, 5);
        expect(resolved25.resolved.rotate?.z).toBeCloseTo(Math.PI / 2, 5);

        // TEST AT 50% PROGRESS (T = 5000ms) ---
        mockP5.millis.mockReturnValue(5000);
        mockP5.draw();

        const state50 = world.getCurrenState();
        // const resolved50 = midElement0?.resolve(state50) as ResolvedBox;
        const resolved50 = resolver.resolve(midElement0!, state50) as { resolved: ResolvedCylinder };

        // Size logic: cos(PI) * 50 + 100 = 50
        expect(resolved50.resolved.radius).toBeCloseTo(0, 5);
        expect(resolved50.resolved.position.y).toBeCloseTo(-200, 5);
    });

    it('should maintain static properties for the background box', async () => {
        const mockP5 = createMockP5();
        const world = heroExample1(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        mockP5.setup();

        mockP5.millis.mockReturnValue(1234);
        mockP5.draw();

        const backElement = world.getElement('back-pyramid');
        const resolver = new ElementResolver({});
        const resolvedBundle = resolver.resolve(backElement!, world.getCurrenState()) as { resolved: ResolvedPyramid };

        // Verify the resolved values match the blueprint for static objects
        expect(resolvedBundle.resolved.position).toMatchObject({x: -100, y: 0, z: -200});
        expect(resolvedBundle.resolved.fillColor).toMatchObject({green: 255});
    });

    it('should verify p5 rendering side effects', async () => {
        const mockP5 = createMockP5();
        const loader = new P5AssetLoader(mockP5 as unknown as p5);

        heroExample1(mockP5 as unknown as p5, {
                ...DEFAULT_SKETCH_CONFIG,
                loader: loader
            }
        );
        mockP5.setup();
        await loader.waitForAllAssets();


        // One frame to trigger gp calls via world.step()
        mockP5.draw();

        // Verify the Bridge Pattern: World -> Processor -> P5
        expect(mockP5.cylinder).toHaveBeenCalledTimes(1);
        expect(mockP5.torus).toHaveBeenCalledTimes(1);
        expect(mockP5.beginShape).toHaveBeenCalledTimes(1);
        expect(mockP5.text).toHaveBeenCalledTimes(1);
        expect(mockP5.push).toHaveBeenCalled();
        expect(mockP5.pop).toHaveBeenCalled();
        expect(mockP5.translate).toHaveBeenCalled();
    });
});