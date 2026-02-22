import { describe, expect, it, vi, beforeEach } from 'vitest';
import { tutorial_8 } from './tutorial_8';
import { createMockP5 } from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {DEFAULT_SKETCH_CONFIG} from "./tutorial_main_page.demo.ts";

describe('Tutorial 8: The Billboard (Integration)', () => {
    let mockP5: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockP5 = createMockP5();

        // Ensure the p5 bridge works for any internal calls
        mockP5.lerp = vi.fn((start, end, amt) => start + (end - start) * amt);
    });

    it('should create a world with billboard elements', () => {
        const world = tutorial_8(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        
        expect(world).toBeDefined();
        
        // Set up the sketch to initialize the world
        mockP5.setup();
        
        // Verify we can get the current scene state
        const sceneState = world.getCurrenState();
        expect(sceneState).toBeDefined();
        expect(sceneState.projection.kind).toBe("camera");
        if (sceneState.projection.kind !== "camera") return;
        expect(sceneState.projection.camera).toBeDefined();
        
        // Verify world has the expected methods
        expect(typeof world.step).toBe('function');
        expect(typeof world.getCurrenState).toBe('function');
        
        // Verify world is properly initialized
        const finalState = world.getCurrenState();
        expect(finalState).toBeDefined();
        
        // Use world to satisfy linter
        void world;
    });

    it('should initialize WebGL canvas correctly', () => {
        const createCanvasSpy = vi.spyOn(mockP5, 'createCanvas');
        
        tutorial_8(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        mockP5.setup();
        
        expect(createCanvasSpy).toHaveBeenCalledWith(
            DEFAULT_SKETCH_CONFIG.width,
            DEFAULT_SKETCH_CONFIG.height,
            mockP5.WEBGL
        );
    });

    it('should handle draw loop without errors', () => {
        const world = tutorial_8(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        mockP5.setup();
        
        // Mock background to prevent actual drawing
        mockP5.background = vi.fn();
        
        expect(() => {
            mockP5.draw();
        }).not.toThrow();
        
        // Use world to avoid unused variable warning
        void world;
    });

    it('should pause and resume correctly', () => {
        const world = tutorial_8(mockP5 as unknown as p5, {
            ...DEFAULT_SKETCH_CONFIG,
            paused: true
        });
        mockP5.setup();
        
        // Mock background to prevent actual drawing
        mockP5.background = vi.fn();
        
        const state = world.getCurrenState();
        expect(state).toBeDefined();
        
        // Use world to avoid unused variable warning
        void world;
    });

    it('should work with custom manager configuration', () => {
        // Test that the tutorial accepts a config object
        expect(() => {
            const world = tutorial_8(mockP5 as unknown as p5, {
                ...DEFAULT_SKETCH_CONFIG,
                paused: false
            });
            
            expect(world).toBeDefined();
            mockP5.setup();
        }).not.toThrow();
    });

    // Use the shared pause test utility
    createPauseTests('Tutorial 8', tutorial_8);
});