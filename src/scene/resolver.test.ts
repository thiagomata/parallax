import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
    ASSET_STATUS,
    ELEMENT_TYPES,
    SPEC_KINDS,
    type AssetLoader,
    type DynamicText,
    type GraphicProcessor,
    type ResolvedBox,
    type SceneState,
    type Vector3,
    type ModifierDefinition,
    type BaseModifierSettings,
    type BehaviorBlueprint, type BehaviorBundle,
} from './types';
import type {MockBundle} from "./mock/mock_type.mock.ts";
import {createRenderable, type ElementType, resolve, resolveProperty, SceneResolver, toDynamic} from "./resolver.ts";
import {createMockGraphicProcessor} from "./mock/mock_graphic_processor.mock.ts";
import {createMockState} from "./mock/mock_scene_state.mock.ts";

const mockOrigin: Vector3 = {x: 0, y: 0, z: 0};

const createMockGP = () => {
    return {
        ...createMockGraphicProcessor<MockBundle>(),
        millis: vi.fn(() => 1000),
        deltaTime: vi.fn(() => 16),
        frameCount: vi.fn(() => 60),
    } as unknown as GraphicProcessor<MockBundle>;
}

/**
 * Setup Mock Factory for AssetLoader
 */
const createMockLoader = (): AssetLoader<MockBundle> => ({
    hydrateTexture: vi.fn().mockResolvedValue({
        status: ASSET_STATUS.READY,
        value: {texture: {}, internalRef: {id: 'tex-1'}}
    }),
    hydrateFont: vi.fn().mockResolvedValue({
        status: ASSET_STATUS.READY,
        value: {font: {}, internalRef: {name: 'Arial'}}
    }),
    waitForAllAssets: vi.fn().mockResolvedValue(null)
});

// Minimal mock state
const mockState: SceneState = {
    sceneId: 0,
    settings: {
        window: {width: 800, height: 600, aspectRatio: 1.33},
        camera: {position: mockOrigin, lookAt: mockOrigin},
        playback: {isLoop: true, timeSpeed: 1, startTime: 0},
        debug: false,
        paused: false,
        alpha: 1
    },
    playback: {now: 1000, delta: 16, progress: 0.2, frameCount: 60},
    camera: {
        position: mockOrigin,
        lookAt: mockOrigin,
        yaw: 0,
        pitch: 0,
        roll: 0,
        direction: {x: 0, y: 0, z: -1}
    }
};

describe('createRenderable & Resolver Loop', () => {
    let gp: GraphicProcessor<MockBundle>;
    let loader: AssetLoader<MockBundle>;

    beforeEach(() => {
        gp = createMockGP();
        loader = createMockLoader();
        vi.mocked(gp.dist).mockReturnValue(0);
    });

    it('should initialize with PENDING assets if blueprint has refs, or READY if empty', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            size: 10,
            texture: {path: 'test.png', width: 100, height: 100}
        };

        const renderable = createRenderable('test-1', blueprint, loader);

        // Immediate state check
        expect(renderable.assets.texture?.status).toBe(ASSET_STATUS.PENDING);
        expect(renderable.assets.font?.status).toBe(ASSET_STATUS.READY); // No font ref in blueprint
        expect(renderable.id).toBe('test-1');

        // Verify loader was triggered
        expect(loader.hydrateTexture).toHaveBeenCalledWith(blueprint.texture);
    });

    it('should cull rendering (early return) if distance > far', () => {
        const blueprint = {type: ELEMENT_TYPES.BOX, position: mockOrigin, size: 10};
        const renderable = createRenderable('id-1', blueprint, loader);

        vi.mocked(gp.dist).mockReturnValue(6000); // Beyond default far

        renderable.render(gp, mockState);

        expect(gp.push).toHaveBeenCalled();
        expect(gp.drawBox).not.toHaveBeenCalled();
        expect(gp.pop).toHaveBeenCalled();
    });

    it('should render a BOX correctly with resolved dynamic props', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            size: (state: SceneState) => state.playback.progress * 100
        };
        const renderable = createRenderable('box-1', blueprint, loader);

        renderable.render(gp, mockState);

        // Verify resolution during render: 0.2 progress * 100 = 20
        expect(gp.drawBox).toHaveBeenCalledWith(
            expect.objectContaining({size: 20}),
            renderable.assets,
            mockState
        );
    });

    it('should recursively resolve nested objects like fillColor', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            size: 10,
            fillColor: {
                red: 255,
                green: (s: SceneState) => s.playback.progress * 255,
                blue: 0
            }
        };

        // NEW: Instead of resolving the 'dynamic' object directly,
        // we resolve the RenderableElement to test the Extraction Logic.
        const renderable = createRenderable('fill-test', blueprint, loader);
        const resolved = resolve(renderable, mockState); // No 'as' needed here!

        expect(resolved.fillColor).toEqual({red: 255, green: 51, blue: 0});
        expect(resolved.fillColor).not.toHaveProperty('kind');
    });

    it('should pass through static keys (type, texture, font) without wrapping', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            texture: {path: 'test.png', width: 100, height: 100},
            position: mockOrigin,
            size: 10
        };

        const dynamic = toDynamic(blueprint);

        // Verify key mirroring (Structural Identity)
        expect(dynamic.type).toBe(ELEMENT_TYPES.BOX);
        expect(dynamic.texture).toEqual(blueprint.texture);

        // Verify wrapping of dynamic candidates
        expect((dynamic.size as any).kind).toBe(SPEC_KINDS.STATIC);
    });

    it('should handle atomic function resolution for position', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: (s: SceneState) => ({x: s.playback.now, y: 0, z: 0}),
            size: 10
        };

        const renderable = createRenderable('pos-test', blueprint, loader);
        const result = resolve(renderable, mockState);

        expect(result.position).toEqual({x: 1000, y: 0, z: 0});
    });

    it('should update assets when the loader promise resolves', async () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            size: 10,
            texture: {path: 'test.png', width: 100, height: 100}
        };

        // Create a promise we can control
        let resolveAsset: any;
        const assetPromise = new Promise(res => {
            resolveAsset = res;
        });
        vi.mocked(loader.hydrateTexture).mockReturnValue(assetPromise as any);

        const renderable = createRenderable('async-test', blueprint, loader);
        expect(renderable.assets.texture?.status).toBe(ASSET_STATUS.PENDING); // Waiting for the asset texture
        expect(renderable.assets.font?.status).toBe(ASSET_STATUS.READY); // Asset font is ready since is none

        // Resolve the promise
        const mockAsset = {status: ASSET_STATUS.READY, value: {internalRef: {id: 'new-tex'}}};
        resolveAsset(mockAsset);

        // Wait for the .then() microtask
        await vi.waitFor(() => {
            expect(renderable.assets.texture?.status).toBe(ASSET_STATUS.READY);
        });
    });
});

describe('toDynamic Structural Integrity', () => {
    const mockOrigin: Vector3 = {x: 0, y: 0, z: 0};

    let gp: GraphicProcessor<MockBundle>;

    beforeEach(() => {
        gp = createMockGP();
        vi.mocked(gp.dist).mockReturnValue(0);
    });

    it('should treat a static object as a single STATIC leaf (Short-circuit)', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: {x: 10, y: 20, z: 30}, // Purely static data
            size: 10
        };

        const dynamic = toDynamic(blueprint);

        expect(dynamic.position).toEqual({
            kind: SPEC_KINDS.STATIC,
            value: {x: 10, y: 20, z: 30}
        });
        expect(dynamic.size).toEqual({
            kind: SPEC_KINDS.STATIC,
            value: 10
        });
    });

    it('should treat an object with a function as a BRANCH', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            fillColor: {
                red: 255,
                green: (s: SceneState) => s.playback.progress * 255, // Dynamic potential
                blue: 0
            },
            size: 10
        };

        const dynamic = toDynamic(blueprint);

        // static value
        expect(dynamic.position.kind).toBe(SPEC_KINDS.STATIC);

        // fillColor MUST be a branch because of the 'green' function
        expect(dynamic.fillColor?.kind).toBe(SPEC_KINDS.BRANCH);

        // Internal values should be wrapped correctly
        const branchValue = (dynamic.fillColor as any).value;
        expect(branchValue.red.kind).toBe(SPEC_KINDS.STATIC);
        expect(branchValue.green.kind).toBe(SPEC_KINDS.COMPUTED);
        expect(branchValue.blue.kind).toBe(SPEC_KINDS.STATIC);
    });

    it('should handle deep nesting with appropriate branching', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            size: 10,
            userData: {
                metadata: {
                    id: 1,
                    timestamp: (s: SceneState) => s.playback.now
                },
                staticTag: "stable"
            }
        };

        const dynamic = toDynamic(blueprint);

        expect(dynamic.userData.kind).toBe(SPEC_KINDS.BRANCH);

        const userDataBranch = (dynamic.userData as any).value;
        expect(userDataBranch.metadata.kind).toBe(SPEC_KINDS.BRANCH);
        expect(userDataBranch.staticTag.kind).toBe(SPEC_KINDS.STATIC);

        const timestampBranch = (userDataBranch as any).metadata.value.timestamp;
        expect(timestampBranch.kind).toBe(SPEC_KINDS.COMPUTED);
    });

    it('should preserve identity for "Static Keys" defined in the Manifest', () => {
        const textureRef = {path: 'test.png', width: 100, height: 100};
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            texture: textureRef,
            position: mockOrigin,
            size: 10
        };

        const dynamic = toDynamic(blueprint);

        // Static keys should be unwrapped identity values
        expect(dynamic.type).toBe(ELEMENT_TYPES.BOX);
        expect(dynamic.texture).toBe(textureRef);

        // Other keys must be DynamicProperties
        expect(dynamic.position.kind).toBe(SPEC_KINDS.STATIC);
    });

    it('should handle root-level functions as COMPUTED properties', () => {
        // A blueprint where a property IS a function
        const blueprint = {
            type: ELEMENT_TYPES.TEXT,
            position: mockOrigin,
            text: (s: SceneState) => `Time: ${s.playback.now}`,
            size: 12
        };

        const dynamic = toDynamic(blueprint) as DynamicText;

        expect(dynamic.text.kind).toBe(SPEC_KINDS.COMPUTED);
        expect(typeof (dynamic.text as any).compute).toBe('function');
    });
});


describe('resolveProperty', () => {
    const mockState = createMockState({x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 100});

    it('should resolve a STATIC property immediately', () => {
        const prop = {
            kind: SPEC_KINDS.STATIC,
            value: {x: 10, y: 20, z: 30}
        };

        const result = resolveProperty(prop, mockState);

        expect(result).toEqual({x: 10, y: 20, z: 30});
        // Ensure it's not returning the container
        expect(result).not.toHaveProperty('kind');
    });

    it('should resolve a COMPUTED property using SceneState', () => {
        const prop = {
            kind: SPEC_KINDS.COMPUTED,
            compute: (s: SceneState) => s.playback.now * 2
        };

        const result = resolveProperty(prop, {
            ...mockState,
            playback: {...mockState.playback, now: 100}
        });

        expect(result).toBe(200);
    });

    it('should resolve a BRANCH property recursively', () => {
        const prop = {
            kind: SPEC_KINDS.BRANCH,
            value: {
                red: {kind: SPEC_KINDS.STATIC, value: 255},
                green: {
                    kind: SPEC_KINDS.COMPUTED,
                    compute: (s: SceneState) => s.playback.progress * 100
                }
            }
        };

        const result = resolveProperty(prop as any, {
            ...mockState,
            playback: {...mockState.playback, progress: 0.5}
        });

        expect(result).toEqual({
            red: 255,
            green: 50
        });
    });

    it('should handle nested branches (Deep Sieve)', () => {
        const prop = {
            kind: SPEC_KINDS.BRANCH,
            value: {
                nested: {
                    kind: SPEC_KINDS.BRANCH,
                    value: {
                        val: {kind: SPEC_KINDS.STATIC, value: 'deep'}
                    }
                }
            }
        };

        const result = resolveProperty(prop as any, mockState);
        expect(result).toEqual({nested: {val: 'deep'}});
    });
});

describe('Shape Rendering', () => {
    let gp: GraphicProcessor<MockBundle>;
    let loader: AssetLoader<MockBundle>;
    const mockState = createMockState({x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 100});

    beforeEach(() => {
        gp = createMockGP();
        loader = createMockLoader();
    });

    it('should render BOX elements', () => {
        const renderable = createRenderable('test-box', {
            type: ELEMENT_TYPES.BOX,
            position: {x: 10, y: 20, z: 30},
            size: 50
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawBox).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.BOX,
                position: {x: 10, y: 20, z: 30},
                size: 50
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render PANEL elements', () => {
        const renderable = createRenderable('test-panel', {
            type: ELEMENT_TYPES.PANEL,
            position: {x: 15, y: 25, z: 35},
            width: 100,
            height: 75
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawPanel).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.PANEL,
                position: {x: 15, y: 25, z: 35},
                width: 100,
                height: 75
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render SPHERE elements', () => {
        const renderable = createRenderable('test-sphere', {
            type: ELEMENT_TYPES.SPHERE,
            position: {x: 5, y: 10, z: 15},
            radius: 25,
            detail: 16
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawSphere).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.SPHERE,
                position: {x: 5, y: 10, z: 15},
                radius: 25,
                detail: 16
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render CONE elements', () => {
        const renderable = createRenderable('test-cone', {
            type: ELEMENT_TYPES.CONE,
            position: {x: 20, y: 30, z: 40},
            radius: 30,
            height: 60
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawCone).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.CONE,
                position: {x: 20, y: 30, z: 40},
                radius: 30,
                height: 60
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render PYRAMID elements', () => {
        const renderable = createRenderable('test-pyramid', {
            type: ELEMENT_TYPES.PYRAMID,
            position: {x: 12, y: 24, z: 36},
            baseSize: 40,
            height: 80
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawPyramid).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.PYRAMID,
                position: {x: 12, y: 24, z: 36},
                baseSize: 40,
                height: 80
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render CYLINDER elements', () => {
        const renderable = createRenderable('test-cylinder', {
            type: ELEMENT_TYPES.CYLINDER,
            position: {x: 8, y: 16, z: 32},
            radius: 20,
            height: 50
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawCylinder).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.CYLINDER,
                position: {x: 8, y: 16, z: 32},
                radius: 20,
                height: 50
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render TORUS elements', () => {
        const renderable = createRenderable('test-torus', {
            type: ELEMENT_TYPES.TORUS,
            position: {x: 25, y: 35, z: 45},
            radius: 40,
            tubeRadius: 10
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawTorus).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.TORUS,
                position: {x: 25, y: 35, z: 45},
                radius: 40,
                tubeRadius: 10
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render ELLIPTICAL elements', () => {
        const renderable = createRenderable('test-elliptical', {
            type: ELEMENT_TYPES.ELLIPTICAL,
            position: {x: 30, y: 40, z: 50},
            rx: 15,
            ry: 25,
            rz: 10
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawElliptical).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.ELLIPTICAL,
                position: {x: 30, y: 40, z: 50},
                rx: 15,
                ry: 25,
                rz: 10
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render FLOOR elements', () => {
        const renderable = createRenderable('test-floor', {
            type: ELEMENT_TYPES.FLOOR,
            position: {x: 0, y: -10, z: 0},
            width: 200,
            depth: 300
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawFloor).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.FLOOR,
                position: {x: 0, y: -10, z: 0},
                width: 200,
                depth: 300
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render TEXT elements', () => {
        const renderable = createRenderable('test-text', {
            type: ELEMENT_TYPES.TEXT,
            position: {x: 100, y: 150, z: 0},
            text: 'Hello World',
            size: 24
        }, loader);

        renderable.render(gp, mockState);

        expect(gp.drawText).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.TEXT,
                position: {x: 100, y: 150, z: 0},
                text: 'Hello World',
                size: 24
            }),
            renderable.assets,
            mockState
        );
    });

    it('should handle unknown element types with error', () => {

        // Test the error case by directly calling resolve with unknown type
        const renderable = createRenderable('test-unknown', {
            type: "SECRET",
            position: {x:0, y:0, z:0}
        } as unknown as ResolvedBox, loader);

        expect(() => renderable.render(gp, mockState)).toThrow('Unknown type Object {"type":"SECRET","position":{"x":0,"y":0,"z":0}}');
    });
});

describe('SceneResolver', () => {
    // Test behavior modifiers for comprehensive coverage

    let gp: GraphicProcessor<MockBundle>;
    let loader: AssetLoader<MockBundle>;

    beforeEach(() => {
        gp = createMockGP();
        loader = createMockLoader();
        vi.mocked(gp.dist).mockReturnValue(0);
    });

    const sizeModifier: ModifierDefinition<{multiplier: number; enabled?: boolean}, ResolvedBox> = {
        type: 'sizeMultiplier',
        targets: [ELEMENT_TYPES.BOX],
        settings: { multiplier: 1, enabled: true },
        apply(current, _state, settings) {
            if (!settings.enabled) return current;
            return {
                ...current,
                size: current.size * settings.multiplier
            };
        }
    };

    const positionModifier: ModifierDefinition<{offset: Vector3; enabled?: boolean}> = {
        type: 'positionOffset',
        // Cast to the specific union to satisfy the Readonly and Literal requirements
        targets: Object.values(ELEMENT_TYPES) as unknown as ElementType[],
        settings: { offset: {x: 0, y: 0, z: 0}, enabled: true },
        apply(current, _state, settings) {
            if (!settings.enabled) return current;
            return {
                ...current,
                position: {
                    x: current.position.x + settings.offset.x,
                    y: current.position.y + settings.offset.y,
                    z: current.position.z + settings.offset.z
                }
            };
        }
    };

    // const alphaModifier: ModifierDefinition<{alpha: number; enabled?: boolean}> = {
    //     type: 'alphaOverride',
    //     targets: [ELEMENT_TYPES.SPHERE],
    //     settings: { alpha: 1, enabled: true },
    //     apply(current, _state, settings) {
    //         if (!settings.enabled) return current;
    //         return {
    //             ...current,
    //             alpha: settings.alpha
    //         };
    //     }
    // };

    describe('registerModifier', () => {
        it('should register a modifier in the registry', () => {
            const resolver = new SceneResolver();
            
            resolver.register(sizeModifier);
            
            // Verify the modifier was registered by testing resolve behavior
            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 10,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'sizeMultiplier', settings: { multiplier: 2, enabled: true } },
            ]);

            expect(resolved.size).toBe(20);
        });

        it('should allow overriding existing modifiers', () => {
            const resolver = new SceneResolver();
            
            // Register first modifier
            resolver.register(sizeModifier);
            
            // Register modifier with same type but different behavior
            const newModifier: ModifierDefinition<{multiplier: number} & BaseModifierSettings, ResolvedBox> = {
                type: 'sizeMultiplier',
                targets: [ELEMENT_TYPES.BOX],
                settings: { multiplier: 1, enabled: true },
                apply(current, _state, settings) {
                    return {
                        ...current,
                        size: current.size * settings.multiplier * 10 // Different behavior
                    };
                }
            };
            
            resolver.register(newModifier);
            
            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 5,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'sizeMultiplier', settings: { multiplier: 2 } }
            ]);

            // Should use new modifier behavior: 5 * 2 * 10 = 100
            expect(resolved.size).toBe(100);
        });
    });

    describe('resolve', () => {
        it('should apply single modifier to matching element type', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 15,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'sizeMultiplier', settings: { multiplier: 3, enabled: true } },
            ]);

            expect(resolved.size).toBe(45);
            expect(resolved.type).toBe(ELEMENT_TYPES.BOX);
            expect(resolved.position).toEqual(mockOrigin);
        });

        it('should not apply modifier to non-matching element type', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);

            const dynamicSphere = toDynamic({
                type: ELEMENT_TYPES.SPHERE,
                radius: 10,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicSphere, mockState, [
                { type: 'sizeMultiplier', settings: { multiplier: 2 } }
            ]);

            // Should not be affected since sizeModifier only targets BOX
            expect(resolved.radius).toBe(10);
            expect(resolved.type).toBe(ELEMENT_TYPES.SPHERE);
        });

        it('should apply ALL targetType modifiers to any element type', () => {
            const resolver = new SceneResolver();
            resolver.register(positionModifier);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 10,
                position: {x: 1, y: 2, z: 3}
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'positionOffset', settings: { offset: {x: 5, y: -1, z: 0} } }
            ]);

            expect(resolved.position).toEqual({x: 6, y: 1, z: 3});
        });

        it('should apply multiple modifiers in order', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);
            resolver.register(positionModifier);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 5,
                position: {x: 10, y: 0, z: 0}
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'sizeMultiplier', settings: { multiplier: 2 } },
                { type: 'positionOffset', settings: { offset: {x: -3, y: 2, z: 1} } }
            ]);

            expect(resolved.size).toBe(10); // Size applied first
            expect(resolved.position).toEqual({x: 7, y: 2, z: 1}); // Position applied second
        });

        it('should use modifier defaults when settings not provided', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 8,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'sizeMultiplier' } // No settings provided
            ]);

            // Should use default multiplier of 1
            expect(resolved.size).toBe(8);
        });

        it('should merge provided settings with defaults', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 7,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'sizeMultiplier', settings: { multiplier: 4 } }
            ]);

            // Should use provided multiplier, default enabled: true
            expect(resolved.size).toBe(28);
        });

        it('should skip disabled modifiers', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 12,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'sizeMultiplier', settings: { enabled: false, multiplier: 5 } }
            ]);

            // Should not be modified since disabled
            expect(resolved.size).toBe(12);
        });

        it('should ignore unknown modifier types', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 20,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'unknownModifier', settings: { multiplier: 3 } },
                { type: 'sizeMultiplier', settings: { multiplier: 2 } }
            ]);

            // Should only apply known modifier
            expect(resolved.size).toBe(40);
        });

        it('should handle no modifiers gracefully', () => {
            const resolver = new SceneResolver();

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 25,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState);

            expect(resolved.size).toBe(25);
            expect(resolved.type).toBe(ELEMENT_TYPES.BOX);
            expect(resolved.position).toEqual(mockOrigin);
        });

        it('should handle empty modifiers array', () => {
            const resolver = new SceneResolver();

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 30,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, []);

            expect(resolved.size).toBe(30);
        });

        it('should resolve dynamic properties before applying modifiers', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);

            const blueprint = {
                type: ELEMENT_TYPES.BOX,
                size: (state: SceneState) => state.playback.progress * 10,
                position: mockOrigin
            };

            const dynamicBox = toDynamic(blueprint);

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'sizeMultiplier', settings: { multiplier: 3 } }
            ]);

            // Dynamic property: 0.2 * 10 = 2, then modifier: 2 * 3 = 6
            expect(resolved.size).toBe(6);
        });

        it('should work with complex nested properties', () => {
            const resolver = new SceneResolver();
            resolver.register(positionModifier);

            const blueprint = {
                type: ELEMENT_TYPES.BOX,
                size: 10,
                position: {
                    x: (state: SceneState) => state.playback.progress * 100,
                    y: 50,
                    z: -25
                }
            };

            const dynamicBox = toDynamic(blueprint);

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'positionOffset', settings: { offset: {x: 10, y: -20, z: 5} } }
            ]);

            // Dynamic property: 0.2 * 100 = 20, then modifier: 20 + 10 = 30
            expect(resolved.position.x).toBe(30);
            expect(resolved.position.y).toBe(30); // 50 + (-20)
            expect(resolved.position.z).toBe(-20); // -25 + 5
        });
    });

    describe('Integration with createRenderable', () => {
        it('should use SceneResolver when provided to createRenderable', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);

            const blueprint = {
                type: ELEMENT_TYPES.BOX,
                size: 8,
                position: mockOrigin,
                modifiers: [
                    { type: 'sizeMultiplier', settings: { multiplier: 4 } }
                ]
            };

            const renderable = createRenderable('test-with-resolver', blueprint, loader, resolver);

            renderable.render(gp, mockState);

            expect(gp.drawBox).toHaveBeenCalledWith(
                expect.objectContaining({size: 32}), // 8 * 4 = 32
                renderable.assets,
                mockState
            );
        });

        it('should fallback to original resolve when no resolver provided', () => {
            const blueprint = {
                type: ELEMENT_TYPES.BOX,
                size: 15,
                position: mockOrigin
            };

            const renderable = createRenderable('test-no-resolver', blueprint, loader);

            renderable.render(gp, mockState);

            expect(gp.drawBox).toHaveBeenCalledWith(
                expect.objectContaining({size: 15}),
                renderable.assets,
                mockState
            );
        });

        it('should handle dynamic modifiers from blueprint', () => {
            const resolver = new SceneResolver();
            resolver.register(sizeModifier);

            const blueprint = {
                type: ELEMENT_TYPES.BOX,
                size: 5,
                position: mockOrigin,
                modifiers: (state: SceneState) => [
                    { 
                        type: 'sizeMultiplier', 
                        settings: { multiplier: state.playback.progress > 0.5 ? 3 : 1 } 
                    }
                ]
            };

            const renderable = createRenderable('test-dynamic-modifiers', blueprint, loader, resolver);

            renderable.render(gp, mockState); // progress is 0.2

            expect(gp.drawBox).toHaveBeenCalledWith(
                expect.objectContaining({size: 5}), // No change since progress < 0.5
                renderable.assets,
                mockState
            );
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle modifiers with no settings object', () => {
            const resolver = new SceneResolver();
            
            const modifierNoSettings: BehaviorBundle<{}> = {
                type: 'noSettings',
                targets: [ELEMENT_TYPES.BOX],
                defaults: {},
                apply(current, _state, _settings) {
                    return {
                        ...current,
                        size: 999
                    };
                }
            };

            resolver.register(modifierNoSettings);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 1,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'noSettings' }
            ]);

            expect(resolved.size).toBe(999);
        });

        it('should handle modifier that throws errors gracefully', () => {
            const resolver = new SceneResolver();
            
            const errorModifier: BehaviorBundle<{enabled?: boolean}> = {
                type: 'errorModifier',
                targets: [ELEMENT_TYPES.BOX],
                defaults: { enabled: true },
                apply(current, _state, settings) {
                    if (settings.enabled) {
                        throw new Error('Modifier error');
                    }
                    return current;
                }
            };

            resolver.register(errorModifier);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 10,
                position: mockOrigin
            });

            expect(() => {
                resolver.resolve(dynamicBox, mockState, [
                    { type: 'errorModifier', settings: { enabled: true } }
                ]);
            }).toThrow('Modifier error');
        });

        it('should preserve element properties when modifier returns same reference', () => {
            const resolver = new SceneResolver();
            
            const identityModifier: BehaviorBundle<{enabled?: boolean}> = {
                type: 'identity',
                targets: [ELEMENT_TYPES.BOX],
                defaults: { enabled: true },
                settings:{},
                apply(current, _state, settings) {
                    if (!settings.enabled) return current;
                    // Return same reference (not recommended but should handle)
                    return current;
                }
            };

            resolver.register(identityModifier);

            const dynamicBox = toDynamic({
                type: ELEMENT_TYPES.BOX,
                size: 10,
                position: mockOrigin
            });

            const resolved = resolver.resolve(dynamicBox, mockState, [
                { type: 'identity', settings: { enabled: true } }
            ]);

            expect(resolved.size).toBe(10);
            expect(resolved.position).toEqual(mockOrigin);
        });
    });
});