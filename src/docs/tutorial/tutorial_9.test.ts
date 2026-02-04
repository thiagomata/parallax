import { describe, expect, it, vi, beforeEach } from 'vitest';
import { tutorial_9 } from './tutorial_9';
import { createMockP5 } from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {DEFAULT_SKETCH_CONFIG} from "./tutorial_main_page.demo.ts";
import {ELEMENT_TYPES} from "../../scene/types.ts";

describe('Tutorial 9: Look At The Object (Integration)', () => {
    let mockP5: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockP5 = createMockP5();

        // Ensure p5 bridge works for any internal calls
        mockP5.sin = vi.fn((x) => Math.sin(x));
        mockP5.cos = vi.fn((x) => Math.cos(x));
        mockP5.createCanvas = vi.fn();
        mockP5.background = vi.fn();
        mockP5.WEBGL = 'webgl';

        // Mock document.title updates
        Object.defineProperty(document, 'title', {
            value: '',
            writable: true,
            configurable: true
        });
    });

    it('should create a world with look_at effect', () => {
        const world = tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        
        expect(world).toBeDefined();
        
        // Setup the sketch to initialize the world
        mockP5.setup();
        
        // Verify we can get current scene state
        const sceneState = world.getCurrentSceneState();
        expect(sceneState).toBeDefined();
        expect(sceneState.camera).toBeDefined();
        
        // Verify world has expected methods
        expect(typeof world.step).toBe('function');
        expect(typeof world.getCurrentSceneState).toBe('function');
        expect(typeof world.addBox).toBe('function');
        
        // Verify world is properly initialized
        const finalState = world.getCurrentSceneState();
        expect(finalState).toBeDefined();
        
        // Use world to satisfy linter
        void world;
    });

    it('should initialize WebGL canvas correctly', () => {
        const createCanvasSpy = vi.spyOn(mockP5, 'createCanvas');
        
        tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        mockP5.setup();
        
        expect(createCanvasSpy).toHaveBeenCalledWith(
            DEFAULT_SKETCH_CONFIG.width,
            DEFAULT_SKETCH_CONFIG.height,
            mockP5.WEBGL
        );
    });

    it('should create two box elements with look_at effect', () => {
        const world = tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        const addBoxSpy = vi.spyOn(world, 'addBox');
        
        mockP5.setup();
        
        expect(addBoxSpy).toHaveBeenCalledTimes(2);
        
        // First call should be the moving object
        expect(addBoxSpy).toHaveBeenNthCalledWith(1, 'obj', expect.objectContaining({
            type: ELEMENT_TYPES.BOX,
            width: 50,
            fillColor: {red: 255, green: 0, blue: 0},
            strokeColor: {red: 255, green: 255, blue: 255},
        }));
        
        // Second call should be the object that looks at the first
        expect(addBoxSpy).toHaveBeenNthCalledWith(2, 'look-to-obj', expect.objectContaining({
            type: ELEMENT_TYPES.BOX,
            width: 50,
            position: {x: 100, y: 100, z: 100},
            fillColor: {red: 0, green: 255, blue: 0},
            strokeColor: {red: 255, green: 255, blue: 255},
            effects: [
                expect.objectContaining({
                    type: 'look_at',
                    settings: {
                        lookAt: 'obj',
                        axis: {
                            x: true,
                            y: true,
                            z: true,
                        },
                    }
                })
            ]
        }));
    });

    it('should have a position function for the moving object', () => {
        const world = tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        const addBoxSpy = vi.spyOn(world, 'addBox');
        mockP5.setup();
        
        // Get the position function from the first box call
        const addBoxCalls = addBoxSpy.mock.calls;
        const firstBoxConfig = addBoxCalls[0][1];
        const positionFunction = firstBoxConfig.position;
        
        expect(typeof positionFunction).toBe('function');
    });

    it('should update document title with camera position', () => {
        const world = tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        const addBoxSpy = vi.spyOn(world, 'addBox');
        mockP5.setup();
        
        const mockState = {
            sceneId: 1,
            settings: DEFAULT_SKETCH_CONFIG,
            playback: { progress: 0, now: 1000, delta: 16, frameCount: 60 },
            camera: { position: { x: 10, y: 20, z: 30 } }
        } as any;
        
        // Trigger the position function which should update document.title
        const addBoxCalls = addBoxSpy.mock.calls;
        const firstBoxConfig = addBoxCalls[0][1];
        const positionFunction = firstBoxConfig.position;
        
        if (typeof positionFunction === 'function') {
            positionFunction(mockState);
        }
        
        expect(document.title).toContain('10');
        expect(document.title).toContain('20');
        expect(document.title).toContain('30');
    });

    it('should handle draw loop without errors', () => {
        const world = tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        mockP5.setup();
        
        // Mock world.step to prevent actual stepping
        world.step = vi.fn();
        
        expect(() => {
            mockP5.draw();
        }).not.toThrow();
        
        expect(world.step).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should set background color in draw loop', () => {
        const world = tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        mockP5.setup();
        
        // Mock world.step to prevent actual stepping
        world.step = vi.fn();
        
        mockP5.draw();
        
        expect(mockP5.background).toHaveBeenCalledWith(20);
    });

    it('should handle paused state correctly', () => {
        const world = tutorial_9(mockP5 as unknown as p5, {
            ...DEFAULT_SKETCH_CONFIG,
            paused: true
        });
        
        mockP5.setup();
        world.step = vi.fn();
        
        expect(() => {
            mockP5.draw();
        }).not.toThrow();
    });

    it('should work with custom manager configuration', () => {
        // Test that the tutorial accepts a config object
        expect(() => {
            const world = tutorial_9(mockP5 as unknown as p5, {
                ...DEFAULT_SKETCH_CONFIG,
                paused: false
            });
            
            expect(world).toBeDefined();
            mockP5.setup();
        }).not.toThrow();
    });

    it('should update document title when position function is called', () => {
        const world = tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        const addBoxSpy = vi.spyOn(world, 'addBox');
        mockP5.setup();
        
        // Get the position function from the first box call
        const addBoxCalls = addBoxSpy.mock.calls;
        const firstBoxConfig = addBoxCalls[0][1];
        const positionFunction = firstBoxConfig.position;
        
        const mockState = {
            sceneId: 1,
            settings: DEFAULT_SKETCH_CONFIG,
            playback: { progress: 0.125, now: 1000, delta: 16, frameCount: 60 },
            camera: { position: { x: 10, y: 20, z: 30 } }
        } as any;
        
        if (typeof positionFunction === 'function') {
            positionFunction(mockState);
            
            // Verify document.title was updated (it should contain the camera position string)
            expect(document.title).toBe(JSON.stringify(mockState.camera.position));
        }
    });

    it('should create look_at effect with correct configuration', () => {
        const world = tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        const addBoxSpy = vi.spyOn(world, 'addBox');
        mockP5.setup();
        
        const addBoxCalls = addBoxSpy.mock.calls;
        const secondBoxConfig = addBoxCalls[1][1];
        const effects = secondBoxConfig.effects || [];
        const effect = effects[0];
        
        expect(effect.type).toBe('look_at');
        expect(effect.settings?.lookAt).toBe('obj');
        expect(effect.settings?.axis.x).toBe(true);
        expect(effect.settings?.axis.y).toBe(true);
        expect(effect.settings?.axis.z).toBe(true);
    });

    it('should handle different sketch configurations', () => {
        const customConfig = {
            width: 1200,
            height: 800,
            paused: false
        };
        
        const createCanvasSpy = vi.spyOn(mockP5, 'createCanvas');
        
        tutorial_9(mockP5 as unknown as p5, customConfig);
        mockP5.setup();
        
        expect(createCanvasSpy).toHaveBeenCalledWith(
            customConfig.width,
            customConfig.height,
            mockP5.WEBGL
        );
    });

    it('should step the world on each draw call', () => {
        const world = tutorial_9(mockP5 as unknown as p5, DEFAULT_SKETCH_CONFIG);
        mockP5.setup();
        
        const stepSpy = vi.spyOn(world, 'step');
        
        mockP5.draw();
        
        expect(stepSpy).toHaveBeenCalledTimes(1);
        expect(stepSpy).toHaveBeenCalledWith(expect.any(Object));
    });
});