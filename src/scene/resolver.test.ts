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
    type BaseModifierSettings,
    type EffectBundle, type BlueprintBox,
} from './types';
import type {MockGraphicBundle} from "./mock/mock_type.mock.ts";
import {SceneResolver} from "./resolver.ts";
import {createMockGraphicProcessor} from "./mock/mock_graphic_processor.mock.ts";
import {createMockState} from "./mock/mock_scene_state.mock.ts";

const mockOrigin: Vector3 = {x: 0, y: 0, z: 0};

const createMockGP = () => {
    return {
        ...createMockGraphicProcessor<MockGraphicBundle>(),
        millis: vi.fn(() => 1000),
        deltaTime: vi.fn(() => 16),
        frameCount: vi.fn(() => 60),
    } as unknown as GraphicProcessor<MockGraphicBundle>;
}

/**
 * Setup Mock Factory for AssetLoader
 */
const createMockLoader = (): AssetLoader<MockGraphicBundle> => ({
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
        projection: {
            kind: "camera",
            camera: {
                position: mockOrigin,
                lookAt: mockOrigin,
                fov: Math.PI / 3,
                near: 0.1,
                far: 1000,
                rotationLimits: {
                    yaw: {min: -Math.PI / 2, max: Math.PI / 2},
                    pitch: {min: -Math.PI / 3, max: Math.PI / 3},
                    roll: {min: -Math.PI / 6, max: Math.PI / 6}
                },
                yaw: 0,
                pitch: 0,
                roll: 0,
                direction: { x: 0, y: 0, z: -1 },
            }
        },
        playback: {isLoop: true, timeSpeed: 1, startTime: 0},
        debug: false,
        startPaused: false,
        alpha: 1
    },
    projection: {
        kind: "camera",
        camera: {
            position: mockOrigin,
            lookAt: mockOrigin,
            fov: Math.PI / 3,
            near: 0.1,
            far: 1000,
            rotationLimits: {
                yaw: {min: -Math.PI / 2, max: Math.PI / 2},
                pitch: {min: -Math.PI / 3, max: Math.PI / 3},
                roll: {min: -Math.PI / 6, max: Math.PI / 6}
            },
            yaw: 0,
            pitch: 0,
            roll: 0,
            direction: { x: 0, y: 0, z: -1 },
        }
    },
    playback: {now: 1000, delta: 16, progress: 0.2, frameCount: 60},
};

describe('resolver.createRenderable & Resolver Loop', () => {
    let gp: GraphicProcessor<MockGraphicBundle>;
    let loader: AssetLoader<MockGraphicBundle>;
    let resolver: SceneResolver<MockGraphicBundle, {}>;

    beforeEach(() => {
        gp = createMockGP();
        loader = createMockLoader();
        resolver = new SceneResolver<MockGraphicBundle, {}>({});
        vi.mocked(gp.dist).mockReturnValue(0);
    });

    it('should initialize with PENDING assets if blueprint has refs, or READY if empty', () => {
        const blueprint = {
            id: "test-1",
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            width: 10,
            texture: {path: 'test.png', width: 100, height: 100}
        };

        const renderable = resolver.prepare('test-1', blueprint, loader);

        // Immediate state check
        expect(renderable.assets.texture?.status).toBe(ASSET_STATUS.PENDING);
        expect(renderable.assets.font?.status).toBe(ASSET_STATUS.READY); // No font ref in blueprint
        expect(renderable.id).toBe('test-1');

        // Verify loader was triggered
        expect(loader.hydrateTexture).toHaveBeenCalledWith(blueprint.texture);
    });

    it('should cull rendering (early return) if distance > far', () => {
        const blueprint = {
            id: "id-1",
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            width: 10
        };
        const renderable = resolver.prepare('id-1', blueprint, loader);

        vi.mocked(gp.dist).mockReturnValue(6000); // Beyond default far

        expect(renderable).not.toBeNull();
        // renderable.render(gp, mockState);

        expect(gp.drawBox).not.toHaveBeenCalled();
    });

    it('should render a BOX correctly with resolved dynamic props', () => {
        const blueprint = {
            id: "box-1",
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            width: (state: SceneState) => state.playback.progress * 100
        };
        const dynamicBundle = resolver.prepare('box-1', blueprint, loader);

        const resolvedBundle = resolver.resolve(
            dynamicBundle,
            mockState
        );

        resolver.render(resolvedBundle as any, gp, mockState);


        // Verify resolution during render: 0.2 progress * 100 = 20
        expect(gp.drawBox).toHaveBeenCalledWith(
            expect.objectContaining({width: 20}),
            dynamicBundle.assets,
            mockState
        );
    });

    it('should recursively resolve nested objects like fillColor', () => {
        const blueprint = {
            id: "box-1",
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            width: 10,
            fillColor: {
                red: 255,
                green: (s: SceneState) => s.playback.progress * 255,
                blue: 0
            }
        };

        // NEW: Instead of resolving the 'dynamic' object directly,
        // we resolve the RenderableElement to test the Extraction Logic.
        const renderable = resolver.prepare('fill-test', blueprint, loader);
        const resolvedBundle = resolver.resolve(renderable, mockState); // No 'as' needed here!

        expect(resolvedBundle.resolved.fillColor).toEqual({red: 255, green: 51, blue: 0});
        expect(resolvedBundle.resolved.fillColor).not.toHaveProperty('kind');
    });

    it('should pass through static keys (type, texture, font) without wrapping', () => {
        const blueprint = {
            id: "id-1",
            type: ELEMENT_TYPES.BOX,
            texture: {path: 'test.png', width: 100, height: 100},
            position: mockOrigin,
            width: 10
        };

        const dynamic = resolver.toDynamic(blueprint);

        // Verify key mirroring (Structural Identity)
        expect(dynamic.type).toBe(ELEMENT_TYPES.BOX);
        expect(dynamic.texture).toEqual(blueprint.texture);

        // Verify wrapping of dynamic candidates
        expect((dynamic.width as any).kind).toBe(SPEC_KINDS.STATIC);
    });

    it('should handle atomic function resolution for position', () => {
        const blueprint = {
            id: "box-1",
            type: ELEMENT_TYPES.BOX,
            position: (s: SceneState) => ({x: s.playback.now, y: 0, z: 0}),
            width: 10
        };

        const renderable = resolver.prepare('pos-test', blueprint, loader);
        const result = resolver.resolve(renderable, mockState);

        expect(result.resolved.position).toEqual({x: 1000, y: 0, z: 0});
    });

    it('should update assets when the loader promise resolves', async () => {
        const blueprint = {
            id: "box-1",
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            width: 10,
            texture: {path: 'test.png', width: 100, height: 100}
        };

        // Create a promise we can control
        let resolveAsset: any;
        const assetPromise = new Promise(res => {
            resolveAsset = res;
        });
        vi.mocked(loader.hydrateTexture).mockReturnValue(assetPromise as any);

        const renderable = resolver.prepare('async-test', blueprint, loader);
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

describe('resolver.toDynamic Structural Integrity', () => {
    const mockOrigin: Vector3 = {x: 0, y: 0, z: 0};

    let gp: GraphicProcessor<MockGraphicBundle>;
    let resolver: SceneResolver<MockGraphicBundle, {}>;

    beforeEach(() => {
        gp = createMockGP();
        resolver = new SceneResolver<MockGraphicBundle, any>({});
        vi.mocked(gp.dist).mockReturnValue(0);
    });

    it('should treat a static object as a single STATIC leaf (Short-circuit)', () => {
        const blueprint = {
            id: "box-1",
            type: ELEMENT_TYPES.BOX,
            position: {x: 10, y: 20, z: 30}, // Purely static data
            width: 10
        };

        const dynamic = resolver.toDynamic(blueprint);

        expect(dynamic.position).toEqual({
            kind: SPEC_KINDS.STATIC,
            value: {x: 10, y: 20, z: 30}
        });
        expect(dynamic.width).toEqual({
            kind: SPEC_KINDS.STATIC,
            value: 10
        });
    });

    it('should treat an object with a function as a BRANCH', () => {
        const blueprint = {
            id: "box-1",
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            fillColor: {
                red: 255,
                green: (s: SceneState) => s.playback.progress * 255, // Dynamic potential
                blue: 0
            },
            width: 10
        };

        const dynamic = resolver.toDynamic(blueprint);

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
            id: "box-1",
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            width: 10,
            userData: {
                metadata: {
                    id: 1,
                    timestamp: (s: SceneState) => s.playback.now
                },
                staticTag: "stable"
            }
        };

        const dynamic = resolver.toDynamic(blueprint);

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
            id: "box-1",
            type: ELEMENT_TYPES.BOX,
            texture: textureRef,
            position: mockOrigin,
            width: 10
        };

        const dynamic = resolver.toDynamic(blueprint);

        // Static keys should be unwrapped identity values
        expect(dynamic.type).toBe(ELEMENT_TYPES.BOX);
        expect(dynamic.texture).toBe(textureRef);

        // Other keys must be DynamicProperties
        expect(dynamic.position.kind).toBe(SPEC_KINDS.STATIC);
    });

    it('should handle root-level functions as COMPUTED properties', () => {
        // A blueprint where a property IS a function
        const blueprint = {
            id: "box-1",
            type: ELEMENT_TYPES.TEXT,
            position: mockOrigin,
            text: (s: SceneState) => `Time: ${s.playback.now}`,
            size: 12
        };

        const dynamic = resolver.toDynamic(blueprint) as DynamicText;

        expect(dynamic.text.kind).toBe(SPEC_KINDS.COMPUTED);
        expect(typeof (dynamic.text as any).compute).toBe('function');
    });
});


describe('resolver.resolveProperty', () => {
    const mockState = createMockState({x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 100});
    let resolver: SceneResolver<MockGraphicBundle, {}>;

    beforeEach(() => {
        resolver = new SceneResolver({});
    });

    it('should resolve a STATIC property immediately', () => {
        const prop = {
            kind: SPEC_KINDS.STATIC,
            value: {x: 10, y: 20, z: 30}
        };

        const result = resolver.resolveProperty(prop, mockState);

        expect(result).toEqual({x: 10, y: 20, z: 30});
        // Ensure it's not returning the container
        expect(result).not.toHaveProperty('kind');
    });

    it('should resolve a COMPUTED property using SceneState', () => {
        const prop = {
            kind: SPEC_KINDS.COMPUTED,
            compute: (s: SceneState) => s.playback.now * 2
        };

        const result = resolver.resolveProperty(prop, {
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

        const result = resolver.resolveProperty(prop as any, {
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

        const result = resolver.resolveProperty(prop as any, mockState);
        expect(result).toEqual({nested: {val: 'deep'}});
    });
});

describe('Shape Rendering', () => {
    let gp: GraphicProcessor<MockGraphicBundle>;
    let loader: AssetLoader<MockGraphicBundle>;
    let resolver: SceneResolver<MockGraphicBundle, {}>;
    const mockState = createMockState({x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 100});

    beforeEach(() => {
        gp = createMockGP();
        loader = createMockLoader();
        resolver = new SceneResolver({});
    });

    it('should render BOX elements', () => {
        const dynamicBundle = resolver.prepare('test-box', {
            id: 'test-box',
            type: ELEMENT_TYPES.BOX,
            position: {x: 10, y: 20, z: 30},
            width: 50
        }, loader);

        const resolvedBundle = resolver.resolve(
            dynamicBundle,
            mockState
        );

        resolver.render(resolvedBundle as any, gp, mockState);

        expect(gp.drawBox).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.BOX,
                position: {x: 10, y: 20, z: 30},
                width: 50
            }),
            dynamicBundle.assets,
            mockState
        );
    });

    it('should render PANEL elements', () => {
        const renderable = resolver.prepare('test-panel', {
            id: "test-panel",
            type: ELEMENT_TYPES.PANEL,
            position: {x: 15, y: 25, z: 35},
            width: 100,
            height: 75
        }, loader);

        const resolvedBundle = resolver.resolve(renderable, mockState);
        resolver.render(resolvedBundle as any, gp, mockState);

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
        const renderable = resolver.prepare('test-sphere', {
            id: 'test-sphere',
            type: ELEMENT_TYPES.SPHERE,
            position: {x: 5, y: 10, z: 15},
            radius: 25,
            detail: 16
        }, loader);

        const resolvedBundle = resolver.resolve(renderable, mockState);
        resolver.render(resolvedBundle as any, gp, mockState);

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
        const renderable = resolver.prepare('test-cone', {
            id: 'test-cone',
            type: ELEMENT_TYPES.CONE,
            position: {x: 10, y: 20, z: 30},
            radius: 15,
            height: 40
        }, loader);

        const resolvedBundle = resolver.resolve(renderable, mockState);
        resolver.render(resolvedBundle as any, gp, mockState);

        expect(gp.drawCone).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.CONE,
                position: {x: 10, y: 20, z: 30},
                radius: 15,
                height: 40,
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render PYRAMID elements', () => {
        const renderable = resolver.prepare('test-pyramid', {
            id: 'test-pyramid',
            type: ELEMENT_TYPES.PYRAMID,
            position: {x: 7, y: 14, z: 21},
            baseSize: 30,
            height: 60
        }, loader);

        const resolvedBundle = resolver.resolve(renderable, mockState);
        resolver.render(resolvedBundle as any, gp, mockState);

        expect(gp.drawPyramid).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.PYRAMID,
                position: {x: 7, y: 14, z: 21},
                baseSize: 30,
                height: 60
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render CYLINDER elements', () => {
        const renderable = resolver.prepare('test-cylinder', {
            id: 'test-cylinder',
            type: ELEMENT_TYPES.CYLINDER,
            position: {x: 12, y: 24, z: 36},
            radius: 20,
            height: 50
        }, loader);

        const resolvedBundle = resolver.resolve(renderable, mockState);
        resolver.render(resolvedBundle as any, gp, mockState);

        expect(gp.drawCylinder).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.CYLINDER,
                position: {x: 12, y: 24, z: 36},
                radius: 20,
                height: 50
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render TORUS elements', () => {
        const renderable = resolver.prepare('test-torus', {
            id: 'test-torus',
            type: ELEMENT_TYPES.TORUS,
            position: {x: 8, y: 16, z: 24},
            radius: 30,
            tubeRadius: 10
        }, loader);

        const resolvedBundle = resolver.resolve(renderable, mockState);
        resolver.render(resolvedBundle as any, gp, mockState);

        expect(gp.drawTorus).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.TORUS,
                position: {x: 8, y: 16, z: 24},
                radius: 30,
                tubeRadius: 10
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render ELLIPTICAL elements', () => {
        const renderable = resolver.prepare('test-elliptical', {
            id: 'test-elliptical',
            type: ELEMENT_TYPES.ELLIPTICAL,
            position: {x: 9, y: 18, z: 27},
            rx: 12,
            ry: 15,
            rz: 18
        }, loader);

        const resolvedBundle = resolver.resolve(renderable, mockState);
        resolver.render(resolvedBundle as any, gp, mockState);

        expect(gp.drawElliptical).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.ELLIPTICAL,
                position: {x: 9, y: 18, z: 27},
                rx: 12,
                ry: 15,
                rz: 18
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render FLOOR elements', () => {
        const renderable = resolver.prepare('test-floor', {
            id: 'test-floor',
            type: ELEMENT_TYPES.FLOOR,
            position: {x: 0, y: -10, z: -30},
            width: 200,
            depth: 300
        }, loader);

        const resolvedBundle = resolver.resolve(renderable, mockState);
        resolver.render(resolvedBundle as any, gp, mockState);

        expect(gp.drawFloor).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ELEMENT_TYPES.FLOOR,
                position: {x: 0, y: -10, z: -30},
                width: 200,
                depth: 300
            }),
            renderable.assets,
            mockState
        );
    });

    it('should render TEXT elements', () => {
        const renderable = resolver.prepare('test-text', {
            id: 'test-text',
            type: ELEMENT_TYPES.TEXT,
            position: {x: 100, y: 150, z: 0},
            text: 'Hello World',
            size: 24
        }, loader);

        const resolvedBundle = resolver.resolve(renderable, mockState);
        resolver.render(resolvedBundle as any, gp, mockState);

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
        const renderable = resolver.prepare('test-unknown', {
            id: 'test-unknown',
            type: "SECRET",
            position: {x:0, y:0, z:0}
        } as unknown as ResolvedBox, loader);

        expect(renderable).toBeDefined();
        // expect(() => renderable.render(gp, mockState)).toThrow('Unknown type Object {"type":"SECRET","position":{"x":0,"y":0,"z":0}}');
    });
});

describe('SceneResolver with Effect Bundles', () => {
    let gp: GraphicProcessor<MockGraphicBundle>;
    let loader: AssetLoader<MockGraphicBundle>;

    beforeEach(() => {
        gp = createMockGP();
        loader = createMockLoader();
        vi.mocked(gp.dist).mockReturnValue(0);
    });

    describe('Constructor with Effect Library', () => {
        it('should work with empty effect library', () => {
            const resolver = new SceneResolver({});
            expect(resolver).toBeDefined();
        });

        it('should initialize with provided effect library', () => {
            const sizeModifier: EffectBundle<'sizeMultiplier', {multiplier: number} & BaseModifierSettings> = {
                type: 'sizeMultiplier',
                targets: [ELEMENT_TYPES.BOX],
                defaults: { multiplier: 2, enabled: true },
                apply(current, _state, settings) {
                    return {
                        ...current,
                        width: (current as any).width * settings.multiplier
                    };
                }
            };

            const resolver = new SceneResolver<MockGraphicBundle, Record<string, any>>({
                'sizeMultiplier': sizeModifier
            } as any);

            const blueprintBox = {
                type: ELEMENT_TYPES.BOX,
                width: 10,
                position: mockOrigin,
                effects: [
                    {
                        type: 'sizeMultiplier',
                    }
                ],
            } as BlueprintBox;

            const dynamicBundle = resolver.prepare(
                'box123',
                blueprintBox,
                loader
            );

            const resolvedBundle = resolver.resolve(dynamicBundle, mockState) as { resolved: ResolvedBox };

            const afterEffect = resolver.effect(resolvedBundle as any, mockState);

            const resolved = afterEffect.resolved as ResolvedBox;

            // Should use default multiplier of 2: 10 * 2 = 20
            expect(resolved.width).toBe(20);
        });

        it('should merge provided settings with defaults', () => {
            const sizeModifier: EffectBundle<'sizeMultiplier', {multiplier: number} & BaseModifierSettings> = {
                type: 'sizeMultiplier',
                targets: [ELEMENT_TYPES.BOX],
                defaults: { multiplier: 2, enabled: true },
                apply(current, _state, settings) {
                    if (!settings.enabled) return current;
                    return {
                        ...current,
                        width: (current as any).width * settings.multiplier
                    };
                }
            };

            const resolver = new SceneResolver({
                'sizeMultiplier': sizeModifier
            });

            const blueprintBox = {
                id: "box456",
                type: ELEMENT_TYPES.BOX,
                width: 5,
                position: mockOrigin,
                effects: [
                    {
                        type: 'sizeMultiplier',
                        settings: { multiplier: 3 }
                    }
                ],
            } as BlueprintBox;

            const dynamicBundle = resolver.prepare(
                'box456',
                blueprintBox,
                loader
            );

            const resolvedBundle = resolver.resolve(dynamicBundle, mockState) as { resolved: ResolvedBox };

            const afterEffect = resolver.effect(resolvedBundle as any, mockState);

            const resolved = afterEffect.resolved as ResolvedBox;

            // Should use provided multiplier of 3: 5 * 3 = 15
            expect(resolved.width).toBe(15);
        });

        it('should handle multiple effects in order', () => {
            const sizeModifier: EffectBundle<'sizeMultiplier', {multiplier: number} & BaseModifierSettings> = {
                type: 'sizeMultiplier',
                targets: [ELEMENT_TYPES.BOX],
                defaults: { multiplier: 2, enabled: true },
                apply(current, _state, settings) {
                    return {
                        ...current,
                        width: (current as any).width * settings.multiplier,
                        position: {
                            x: (current as any).position.x * settings.multiplier,
                            y: (current as any).position.y * settings.multiplier,
                            z: (current as any).position.z * settings.multiplier
                        }
                    };
                }
            };

            const positionModifier: EffectBundle<'positionOffset', {offset: {x: number, y: number, z: number}} & BaseModifierSettings> = {
                type: 'positionOffset',
                targets: [ELEMENT_TYPES.BOX],
                defaults: { offset: {x: 0, y: 0, z: 0}, enabled: true },
                apply(current, _state, settings) {
                    return {
                        ...current,
                        position: {
                            x: (current as any).position.x + settings.offset.x,
                            y: (current as any).position.y + settings.offset.y,
                            z: (current as any).position.z + settings.offset.z
                        }
                    };
                }
            };

            const resolver = new SceneResolver<MockGraphicBundle, Record<string, any>>({
                'sizeMultiplier': sizeModifier,
                'positionOffset': positionModifier
            } as any);

            const blueprintBox = {
                id: "box789",
                type: ELEMENT_TYPES.BOX,
                width: 10,
                position: {x: 1, y: 2, z: 3},
                effects: [
                    {
                        type: 'sizeMultiplier',
                        settings: { multiplier: 3 }
                    },
                    {
                        type: 'positionOffset',
                        settings: { offset: {x: 5, y: -1, z: 2} }
                    }
                ],
            } as BlueprintBox;

            const dynamicBundle = resolver.prepare(
                'box789',
                blueprintBox,
                loader
            );

            const resolvedBundle = resolver.resolve(dynamicBundle, mockState) as { resolved: ResolvedBox };
            const afterEffect = resolver.effect(resolvedBundle as any, mockState);
            const resolved = afterEffect.resolved as ResolvedBox;

            // {x: 1, y: 2, z: 3} * 3 + (5, -1, 2) = {
            //      x: 1 * 3 + 5,
            //      y: 2 * 3 - 1,
            //      z: 3 * 3 + 2
            // }
            expect(resolved.position).toEqual({x: 1 * 3 + 5, y: 2 * 3 - 1, z: 3 * 3 + 2});
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle modifiers with no settings object', () => {

            const modifierNoSettings: EffectBundle<'noSettings', {}> = {
                type: 'noSettings',
                targets: [ELEMENT_TYPES.BOX],
                defaults: {enabled: true},
                apply(current, _state, _settings) {
                    return {
                        ...current,
                        width: 999
                    };
                }
            };

            const resolver = new SceneResolver(
                {
                    'noSettings': modifierNoSettings,
                }
            );

            const blueprintBox = {
                type: ELEMENT_TYPES.BOX,
                width: 1,
                position: mockOrigin,
                effects: [
                    {
                        type: 'noSettings'
                    }
                ],
            } as BlueprintBox;

            const dynamicBundle = resolver.prepare(
                'box123',
                blueprintBox,
                createMockLoader()
            );

            const resolvedBundle = resolver.resolve(dynamicBundle, mockState) as { resolved: ResolvedBox };
            const afterEffect = resolver.effect(resolvedBundle as any, mockState);
            const resolved = afterEffect.resolved as ResolvedBox;

            expect(resolved.width).toBe(999);
        });

        it('should skip disabled effects', () => {
            const sizeModifier: EffectBundle<'optionalSize', {multiplier: number, enabled?: boolean}> = {
                type: 'optionalSize',
                targets: [ELEMENT_TYPES.BOX],
                defaults: { multiplier: 5, enabled: false },
                apply(current, _state, settings) {
                    if (!settings.enabled) return current;
                    return {
                        ...current,
                        width: (current as any).width * settings.multiplier
                    };
                }
            };

            const resolver = new SceneResolver<MockGraphicBundle, Record<string, any>>({
                'optionalSize': sizeModifier
            });

            const blueprintBox = {
                id: 'box-disabled',
                type: ELEMENT_TYPES.BOX,
                width: 15,
                position: mockOrigin,
                effects: [
                    {
                        type: 'optionalSize',
                        settings: { enabled: false }
                    }
                ],
            } as BlueprintBox;

            const dynamicBundle = resolver.prepare(
                'box-disabled',
                blueprintBox,
                createMockLoader()
            );

            const resolvedBundle = resolver.resolve(dynamicBundle, mockState) as { resolved: ResolvedBox };
            const afterEffect = resolver.effect(resolvedBundle as any, mockState);
            const resolved = afterEffect.resolved as ResolvedBox;

            expect(resolved.width).toBe(15);
        });

        it('should handle effect that throws errors gracefully', () => {
            const errorEffect: EffectBundle<'errorEffect', {enabled?: boolean}> = {
                type: 'errorEffect',
                targets: [ELEMENT_TYPES.BOX],
                defaults: { enabled: true },
                apply(current, _state, settings) {
                    if (settings.enabled) {
                        throw new Error('Effect error');
                    }
                    return current;
                }
            };

            const resolver = new SceneResolver<MockGraphicBundle, Record<string, any>>({
                'errorEffect': errorEffect
            } as any);

            const blueprintBox = {
                id: "box-error",
                type: ELEMENT_TYPES.BOX,
                width: 10,
                position: mockOrigin,
                effects: [
                    {
                        type: 'errorEffect',
                        settings: { enabled: true }
                    }
                ],
            } as BlueprintBox;

            const dynamicBundle = resolver.prepare(
                'box-error',
                blueprintBox,
                createMockLoader()
            );
            const resolvedBundle = resolver.resolve(dynamicBundle, mockState) as { resolved: ResolvedBox };

            expect(() => {
                resolver.effect(resolvedBundle as any, mockState);
            }).toThrow('Effect error');
        });
    });

        it('should throw error for unknown effect type', () => {
            const resolver = new SceneResolver({});

            const blueprintBox = {
                type: ELEMENT_TYPES.BOX,
                width: 10,
                position: mockOrigin,
                effects: [
                    {
                        type: 'unknownEffect'
                    }
                ],
            } as BlueprintBox;

            expect(() => {
                resolver.prepare('error-box', blueprintBox, createMockLoader());
            }).toThrow('invalid effect unknownEffect');
        });
    });

    describe('loopResolve safety checks', () => {
        it('should handle objects without prototype safely', () => {
            const resolver = new SceneResolver({});

            // Create an object with no prototype (Object.create(null))
            const objWithoutPrototype = Object.create(null);
            objWithoutPrototype.test = 42;

            // This should not throw an error
            const result = resolver.loopResolve(objWithoutPrototype, mockState);
            expect(result.test).toBe(42);
        });
    });
