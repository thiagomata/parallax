import { describe, expect, it, vi } from 'vitest';
import { 
    getModule, 
    extractSketchFunction,
    getP5Instance,
    setP5Instance,
} from './sketch_engine';
import { DEFAULT_SKETCH_CONFIG } from './sketch_config';

describe('sketch_engine', () => {
    describe('DEFAULT_SKETCH_CONFIG', () => {
        it('should have correct default values', () => {
            expect(DEFAULT_SKETCH_CONFIG.width).toBe(500);
            expect(DEFAULT_SKETCH_CONFIG.height).toBe(400);
            expect(DEFAULT_SKETCH_CONFIG.paused).toBe(false);
        });
    });

    describe('getModule', () => {
        it('should resolve world module', () => {
            const result = getModule('world');
            expect(result.World).toBeDefined();
            expect(typeof result.World).toBe('function');
        });

        it('should resolve world_settings module', () => {
            const result = getModule('world_settings');
            expect(result.WorldSettings).toBeDefined();
        });

        it('should resolve scene_clock module', () => {
            const result = getModule('scene_clock');
            expect(result.SceneClock).toBeDefined();
        });

        it('should resolve p5_asset_loader module', () => {
            const result = getModule('p5_asset_loader');
            expect(result.P5AssetLoader).toBeDefined();
        });

        it('should resolve p5_graphic_processor module', () => {
            const result = getModule('p5_graphic_processor');
            expect(result.P5GraphicProcessor).toBeDefined();
        });

        it('should resolve types module with ELEMENT_TYPES', () => {
            const result = getModule('types');
            expect(result.ELEMENT_TYPES).toBeDefined();
            expect(result.ELEMENT_TYPES.SPHERE).toBe('sphere');
            expect(result.ELEMENT_TYPES.CONE).toBe('cone');
            expect(result.ELEMENT_TYPES.PYRAMID).toBe('pyramid');
        });

        it('should resolve types module with PROJECTION_TYPES', () => {
            const result = getModule('types');
            expect(result.PROJECTION_TYPES).toBeDefined();
        });

        it('should resolve types module with STANDARD_PROJECTION_IDS', () => {
            const result = getModule('types');
            expect(result.STANDARD_PROJECTION_IDS).toBeDefined();
            expect(result.STANDARD_PROJECTION_IDS.EYE).toBe('eye');
            expect(result.STANDARD_PROJECTION_IDS.SCREEN).toBe('screen');
        });

        it('should resolve types module with LOOK_MODES', () => {
            const result = getModule('types');
            expect(result.LOOK_MODES).toBeDefined();
            expect(result.LOOK_MODES.LOOK_AT).toBe('LOOK_AT');
            expect(result.LOOK_MODES.ROTATION).toBe('ROTATION');
        });

        it('should resolve types module with ASSET_STATUS', () => {
            const result = getModule('types');
            expect(result.ASSET_STATUS).toBeDefined();
        });

        it('should resolve types module with DEFAULT_SCENE_SETTINGS', () => {
            const result = getModule('types');
            expect(result.DEFAULT_SCENE_SETTINGS).toBeDefined();
            expect(result.DEFAULT_SETTINGS).toBeDefined();
        });

        it('should resolve presets module with CenterOrbit', () => {
            const result = getModule('presets');
            expect(result.CenterOrbit).toBeDefined();
            expect(typeof result.CenterOrbit).toBe('function');
        });

        it('should resolve presets module with HEAD_TRACKED_PRESET', () => {
            const result = getModule('presets');
            expect(result.HEAD_TRACKED_PRESET).toBeDefined();
        });

        it('should resolve sketch_config module', () => {
            const result = getModule('sketch_config');
            expect(result.DEFAULT_SKETCH_CONFIG).toBeDefined();
        });

        it('should resolve orbit_modifier module', () => {
            const result = getModule('orbit_modifier');
            expect(result.OrbitModifier).toBeDefined();
        });

        it('should resolve center_focus_modifier module', () => {
            const result = getModule('center_focus_modifier');
            expect(result.CenterFocusModifier).toBeDefined();
        });

        it('should resolve look_at_effect module', () => {
            const result = getModule('look_at_effect');
            expect(result.LookAtEffect).toBeDefined();
        });

        it('should resolve transform_effect module', () => {
            const result = getModule('transform_effect');
            expect(result.TransformEffect).toBeDefined();
        });

        it('should resolve head_tracking_data_provider module', () => {
            const result = getModule('head_tracking_data_provider');
            expect(result.HeadTrackingDataProvider).toBeDefined();
        });

        it('should resolve head_tracking_modifier module', () => {
            const result = getModule('head_tracking_modifier');
            expect(result.HeadTrackingModifier).toBeDefined();
        });

        it('should resolve colors module', () => {
            const result = getModule('colors');
            expect(result.COLORS).toBeDefined();
        });

        it('should resolve p5 module with default export', () => {
            const result = getModule('p5');
            expect(result.default).toBeDefined();
        });

        it('should resolve module by basename (ignoring path)', () => {
            const result = getModule('/some/path/to/types.ts');
            expect(result.ELEMENT_TYPES).toBeDefined();
        });

        it('should resolve module with .ts extension stripped', () => {
            const result = getModule('types.ts');
            expect(result.ELEMENT_TYPES).toBeDefined();
        });

        it('should resolve module with _ts suffix', () => {
            const result = getModule('types_ts');
            expect(result.ELEMENT_TYPES).toBeDefined();
        });

        it('should be case-insensitive when exact match not found', () => {
            const result = getModule('WORLD');
            expect(result.World).toBeDefined();
        });

        it('should return default undefined for unknown modules', () => {
            const result = getModule('nonexistent_module');
            expect(result.default).toBeUndefined();
        });

        it('should return default undefined for partially matching unknown modules', () => {
            const result = getModule('unknown_effect');
            expect(result.default).toBeUndefined();
        });

        it('should handle center_foucs_modifier typo (matching center_focus_modifier)', () => {
            const result = getModule('center_foucs_modifier');
            expect(result.CenterFocusModifier).toBeDefined();
        });

        it('should return combined object with default and named exports', () => {
            const result = getModule('world');
            expect(result.default).toBeDefined();
            expect(result.World).toBeDefined();
        });
    });

    describe('extractSketchFunction', () => {
        it('should extract a simple exported function', () => {
            const code = `
                export function mySketch(p, config) {
                    return { draw: () => {} };
                }
            `;
            
            const { fn, fnName } = extractSketchFunction(code);
            expect(fnName).toBe('mySketch');
            expect(typeof fn).toBe('function');
        });

        it('should extract an async exported function', () => {
            const code = `
                export async function asyncSketch(p, config) {
                    return { draw: () => {} };
                }
            `;
            
            const { fn, fnName } = extractSketchFunction(code);
            expect(fnName).toBe('asyncSketch');
            expect(typeof fn).toBe('function');
        });

        it('should extract function from sucrase-transformed code', () => {
            const code = `
                import { World } from './world';
                export function transformedSketch(p, config) {
                    return new World({});
                }
            `;
            
            const { fn, fnName } = extractSketchFunction(code);
            expect(fnName).toBe('transformedSketch');
            expect(typeof fn).toBe('function');
        });

        it('should extract function from code with imports', () => {
            const code = `
                import { World } from './world';
                import { SceneClock } from './scene_clock';
                import { ELEMENT_TYPES } from './types';
                
                export function completeSketch(p, config) {
                    return new World({});
                }
            `;
            
            const { fn, fnName } = extractSketchFunction(code);
            expect(fnName).toBe('completeSketch');
            expect(typeof fn).toBe('function');
        });

        it('should extract function with complex body', () => {
            const code = `
                export function complexSketch(p, config) {
                    const world = {
                        addBox: () => {},
                        addSphere: () => {},
                    };
                    return world;
                }
            `;
            
            const { fn, fnName } = extractSketchFunction(code);
            expect(fnName).toBe('complexSketch');
            expect(typeof fn).toBe('function');
        });

        it('should throw error when no exported function found', () => {
            const code = `
                function privateFunction(p, config) {
                    return {};
                }
            `;
            
            expect(() => extractSketchFunction(code)).toThrow('No exported function found.');
        });

        it('should throw error for code without any functions', () => {
            const code = `
                const myValue = 42;
                const anotherValue = "test";
            `;
            
            expect(() => extractSketchFunction(code)).toThrow('No exported function found.');
        });

        it('should throw error when export function has no body', () => {
            const code = `
                export function emptySketch()
            `;
            
            expect(() => extractSketchFunction(code)).toThrow();
        });
    });

    describe('p5Instance management', () => {
        it('should store and retrieve p5 instance', () => {
            const mockInstance = { resizeCanvas: vi.fn() } as any;
            
            setP5Instance('test-container', mockInstance);
            
            const retrieved = getP5Instance('test-container');
            expect(retrieved).toBe(mockInstance);
        });

        it('should return undefined for non-existent container', () => {
            const retrieved = getP5Instance('nonexistent');
            expect(retrieved).toBeUndefined();
        });

        it('should remove instance when set to undefined', () => {
            const mockInstance = { resizeCanvas: vi.fn() } as any;
            
            setP5Instance('test-container', mockInstance);
            setP5Instance('test-container', undefined);
            
            const retrieved = getP5Instance('test-container');
            expect(retrieved).toBeUndefined();
        });

        it('should overwrite previous instance', () => {
            const mockInstance1 = { id: 1 } as any;
            const mockInstance2 = { id: 2 } as any;
            
            setP5Instance('test-container', mockInstance1);
            setP5Instance('test-container', mockInstance2);
            
            const retrieved = getP5Instance('test-container');
            expect(retrieved).toBe(mockInstance2);
        });

        it('should handle multiple containers independently', () => {
            const mockInstance1 = { id: 'a' } as any;
            const mockInstance2 = { id: 'b' } as any;
            
            setP5Instance('container-1', mockInstance1);
            setP5Instance('container-2', mockInstance2);
            
            expect(getP5Instance('container-1')).toBe(mockInstance1);
            expect(getP5Instance('container-2')).toBe(mockInstance2);
        });

        it('should allow removing one container without affecting others', () => {
            const mockInstance1 = { id: 'a' } as any;
            const mockInstance2 = { id: 'b' } as any;
            
            setP5Instance('container-1', mockInstance1);
            setP5Instance('container-2', mockInstance2);
            setP5Instance('container-1', undefined);
            
            expect(getP5Instance('container-1')).toBeUndefined();
            expect(getP5Instance('container-2')).toBe(mockInstance2);
        });
    });
});
