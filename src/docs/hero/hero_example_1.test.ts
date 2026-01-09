import {describe, expect, it, vi} from 'vitest';
import { resolve } from "../../scene/create_renderable.ts";
import { createMockP5 } from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {heroExample1} from "./hero_example_1.ts";
import type {ResolvedBoxProps} from "../../scene/types.ts";

describe('Hero Demo Integration: World Animation', () => {

    it('should calculate animated box properties correctly across the 10s loop', async () => {
        const mockP5 = createMockP5();
        mockP5.loadImage = vi.fn((_path, success) => success({ width: 100, height: 100 }));
        mockP5.loadFont = vi.fn((_path, success) => success({ name: 'MockFont' }));

        // 1. Initialize the Hero Demo
        // Note: heroExample1 creates its own SceneManager internally
        const world = heroExample1(mockP5 as unknown as p5);

        // Trigger setup to build the world and processors
        await mockP5.setup();

        // --- TEST AT 0% PROGRESS (T = 0ms) ---
        mockP5.millis.mockReturnValue(0);
        mockP5.draw();

        const state0 = world.getSceneState();
        const midBox0 = resolve(world.getElement('mid')?.props, state0) as unknown as ResolvedBoxProps;

        // Size logic: cos(2 * PI * 0) * 50 + 100 = 1 * 50 + 100 = 150
        expect(midBox0?.size).toBe(150);

        // Position logic: cos(2 * PI * 0) * 100 - 100 = 1 * 100 - 100 = 0
        expect(midBox0?.position).toMatchObject({ x: 0, y: 0, z: 0 });

        // --- TEST AT 25% PROGRESS (T = 2500ms) ---
        // duration is 10000ms, so 2500ms is 0.25 progress
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const state25 = world.getSceneState();
        const midBox25 = resolve(world.getElement('mid')?.props, state25) as unknown as ResolvedBoxProps;

        // Size logic: cos(PI/2) * 50 + 100 = 0 * 50 + 100 = 100
        expect(midBox25.size).toBeCloseTo(100, 5);

        // Position logic: cos(PI/2) * 100 - 100 = 0 - 100 = -100
        expect(midBox25.position.y).toBeCloseTo(-100, 5);

        // Rotation logic: progress * 2 * PI = 0.25 * 2 * PI = PI/2 (approx 1.57)
        expect(midBox25.rotate?.z).toBeCloseTo(Math.PI / 2, 5);

        // --- TEST AT 50% PROGRESS (T = 5000ms) ---
        mockP5.millis.mockReturnValue(5000);
        mockP5.draw();

        const state50 = world.getSceneState();
        const midBox50 = resolve(world.getElement('mid')?.props, state50) as unknown as ResolvedBoxProps;

        // Size logic: cos(PI) * 50 + 100 = -1 * 50 + 100 = 50
        expect(midBox50.size).toBeCloseTo(50, 5);

        // Position logic: cos(PI) * 100 - 100 = -100 - 100 = -200
        expect(midBox50.position.y).toBeCloseTo(-200, 5);
    });

    it('should maintain static properties for the background box', async () => {
        const mockP5 = createMockP5();
        mockP5.loadImage = vi.fn((_path, success) => success({ width: 100, height: 100 }));
        mockP5.loadFont = vi.fn((_path, success) => success({ name: 'MockFont' }));

        const world = heroExample1(mockP5 as unknown as p5);
        await mockP5.setup();

        // Check at any time
        mockP5.millis.mockReturnValue(1234);
        mockP5.draw();

        const backBox = resolve(world.getElement('back'), world.getSceneState());

        expect(backBox?.props.position).toMatchObject({
            x: -100,
            y: 0,
            z: -200
        });
        expect(backBox?.props.fillColor).toMatchObject({ green: 255 });
    });

    it('should verify p5 rendering side effects', async () => {
        const mockP5 = createMockP5();
        mockP5.loadImage = vi.fn((_path, success) => success({ width: 100, height: 100 }));
        mockP5.loadFont = vi.fn((_path, success) => success({ name: 'MockFont' }));

        heroExample1(mockP5 as unknown as p5);
        await mockP5.setup();

        mockP5.draw();

        // Verify that the processor is actually calling p5 drawing functions
        expect(mockP5.box).toHaveBeenCalled();
        expect(mockP5.push).toHaveBeenCalled();
        expect(mockP5.pop).toHaveBeenCalled();
    });
});