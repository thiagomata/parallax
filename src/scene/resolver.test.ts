import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
    ASSET_STATUS,
    type AssetLoader,
    type DynamicText,
    ELEMENT_TYPES,
    type GraphicProcessor,
    type SceneState,
    SPEC_KINDS,
    type Vector3,
} from './types';
import {createRenderable, resolve, resolveProperty, toDynamic} from "./resolver.ts";
import {createMockGraphicProcessor} from "./mock/mock_graphic_processor.mock.ts";
import type {MockBundle} from "./mock/mock_type.mock.ts";
import {createMockState} from "./mock/mock_scene_state.mock.ts";


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
});

describe('createRenderable & Resolver Loop', () => {
    let gp: GraphicProcessor<MockBundle>;
    let loader: AssetLoader<MockBundle>;
    const mockOrigin: Vector3 = {x: 0, y: 0, z: 0};

    // Minimal mock state
    const mockState: SceneState = {
        settings: {
            window: {width: 800, height: 600, aspectRatio: 1.33},
            camera: {position: mockOrigin, lookAt: mockOrigin},
            playback: {isLoop: true, timeSpeed: 1, startTime: 0},
            debug: false,
            alpha: 1
        },
        playback: {now: 1000, delta: 16, progress: 0.2, frameCount: 60},
        camera: {
            position: mockOrigin,
            lookAt: mockOrigin,
            yaw: 0, pitch: 0,
            direction: {x: 0, y: 0, z: -1}
        }
    };

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

        // Immediate state check (Phase 2 start)
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