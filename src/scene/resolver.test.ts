import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ELEMENT_TYPES,
    ASSET_STATUS,
    type GraphicProcessor,
    type ResolvedBox,
    type SceneState,
    type Vector3,
    type AssetLoader,
} from './types';
import { createRenderable, resolve, toDynamic } from "./resolver.ts";
import {createMockGraphicProcessor} from "./mock/mock_graphic_processor.mock.ts";
import type {MockBundle} from "./mock/mock_type.mock.ts";


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
    hydrateTexture: vi.fn().mockResolvedValue({ status: ASSET_STATUS.READY, value: { texture: {}, internalRef: { id: 'tex-1' } } }),
    hydrateFont: vi.fn().mockResolvedValue({ status: ASSET_STATUS.READY, value: { font: {}, internalRef: { name: 'Arial' } } }),
});

describe('createRenderable & Resolver Loop', () => {
    let gp: GraphicProcessor<MockBundle>;
    let loader: AssetLoader<MockBundle>;
    const mockOrigin: Vector3 = { x: 0, y: 0, z: 0 };

    // Minimal mock state
    const mockState: SceneState = {
        settings: {
            window: { width: 800, height: 600, aspectRatio: 1.33 },
            camera: { position: mockOrigin, lookAt: mockOrigin },
            playback: { isLoop: true, timeSpeed: 1, startTime: 0 },
            debug: false,
            alpha: 1
        },
        playback: { now: 1000, delta: 16, progress: 0.2, frameCount: 60 },
        camera: {
            position: mockOrigin,
            lookAt: mockOrigin,
            yaw: 0, pitch: 0,
            direction: { x: 0, y: 0, z: -1 }
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
            texture: { path: 'test.png', width: 100, height: 100 }
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
        const blueprint = { type: ELEMENT_TYPES.BOX, position: mockOrigin, size: 10 };
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
            expect.objectContaining({ size: 20 }),
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

        const dynamic = toDynamic(blueprint);
        const resolved = resolve(dynamic, mockState) as ResolvedBox;

        expect(resolved.fillColor).toEqual({ red: 255, green: 51, blue: 0 });
        expect(resolved.fillColor).not.toHaveProperty('kind');
    });

    it('should pass through static keys (type, texture, font) without wrapping', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            texture: { path: 'test.png', width: 100, height: 100 },
            position: mockOrigin,
            size: 10
        };

        const dynamic = toDynamic(blueprint);

        // 'type' and 'texture' should be raw values in the dynamic tree
        expect(typeof dynamic.type).toBe('string');
        expect(dynamic.type).toBe(ELEMENT_TYPES.BOX)
        expect(dynamic.texture).not.toHaveProperty('kind');

        // 'size' should be wrapped
        expect(dynamic.size).toHaveProperty('kind', 'static');
    });

    it('should handle atomic function resolution for position', () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: (s: SceneState) => ({ x: s.playback.now, y: 0, z: 0 }),
            size: 10
        };

        const dynamic = toDynamic(blueprint);
        const result = resolve(dynamic, mockState) as ResolvedBox;

        expect(result.position).toEqual({ x: 1000, y: 0, z: 0 });
    });

    it('should update assets when the loader promise resolves', async () => {
        const blueprint = {
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            size: 10,
            texture: { path: 'test.png', width: 100, height: 100 }
        };

        // Create a promise we can control
        let resolveAsset: any;
        const assetPromise = new Promise(res => { resolveAsset = res; });
        vi.mocked(loader.hydrateTexture).mockReturnValue(assetPromise as any);

        const renderable = createRenderable('async-test', blueprint, loader);
        expect(renderable.assets.texture?.status).toBe(ASSET_STATUS.PENDING); // Waiting for the asset texture
        expect(renderable.assets.font?.status).toBe(ASSET_STATUS.READY); // Asset font is ready since is none

        // Resolve the promise
        const mockAsset = { status: ASSET_STATUS.READY, value: { internalRef: { id: 'new-tex' } } };
        resolveAsset(mockAsset);

        // Wait for the .then() microtask
        await vi.waitFor(() => {
            expect(renderable.assets.texture?.status).toBe(ASSET_STATUS.READY);
        });
    });
});