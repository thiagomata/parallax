import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ASSET_STATUS, type AssetLoader, ELEMENT_TYPES,} from '../types';
import {ElementAssetRegistry} from "./element_asset_registry.ts";
import type {MockGraphicBundle} from "../mock/mock_type.mock.ts";

/**
 * Mocking the Loader to observe resolution triggers
 */
const createMockLoader = (): AssetLoader<MockGraphicBundle> => ({
    hydrateTexture: vi.fn().mockResolvedValue({
        status: ASSET_STATUS.READY,
        value: {internalRef: {id: 'tex-1'}}
    }),
    hydrateFont: vi.fn().mockResolvedValue({
        status: ASSET_STATUS.READY,
        value: {internalRef: {name: 'Arial'}}
    }),
    waitForAllAssets: vi.fn().mockResolvedValue(null),
});

describe('AssetRegistry', () => {
    let loader: AssetLoader<MockGraphicBundle>;
    let registry: ElementAssetRegistry<MockGraphicBundle, {}>;

    beforeEach(() => {
        loader = createMockLoader();
        registry = new ElementAssetRegistry<MockGraphicBundle, {}>(loader);
    });

    describe('register', () => {
        it('should create a RenderableElement and trigger texture hydration', () => {
            const id = 'textured-box';
            const blueprint = {
                id: 'textured-box',
                type: ELEMENT_TYPES.BOX,
                position: {x: 0, y: 0, z: 0},
                width: 10,
                texture: {path: 'grass.png', width: 64, height: 64}
            };

            const element = registry.register(blueprint);

            // Identity & Structure
            expect(element.id).toBe(id);
            // Verify that the 'type' static key was preserved correctly (no kind: static)
            expect(element.dynamic.type).toBe(ELEMENT_TYPES.BOX);

            // Asset Hydration Triggered
            expect(element.assets.texture?.status).toBe(ASSET_STATUS.PENDING);
            expect(loader.hydrateTexture).toHaveBeenCalledWith(blueprint.texture);
        });

        it('should return the existing instance and PREVENT re-hydration if ID is already registered', () => {
            const blueprint = {
                id: 'item-1',
                type: ELEMENT_TYPES.BOX,
                width: 5,
                position: {x: 0, y: 0, z: 0},
                texture: {path: 'repeat.png', width: 1, height: 1}
            };

            const first = registry.register(blueprint);

            // Reset mock to see if second call triggers it again
            vi.mocked(loader.hydrateTexture).mockClear();

            const second = registry.register(blueprint);

            expect(first).toBe(second);
            // CRITICAL: Respecting efficiency - don't re-hydrate what is already alive
            expect(loader.hydrateTexture).not.toHaveBeenCalled();
        });
    });

    describe('Collection Integrity', () => {
        it('should correctly store heterogeneous RenderableElements', () => {
            registry.register({
                id: 'box-1',
                type: ELEMENT_TYPES.BOX,
                width: 1,
                position: {x: 0, y: 0, z: 0}
            });
            registry.register({
                id: 'text-1',
                type: ELEMENT_TYPES.TEXT,
                text: 'hi',
                size: 12,
                position: {x: 0, y: 0, z: 0}
            });

            const all = Array.from(registry.all());

            // Verify we have RenderableElement objects, not Resolved objects
            expect(all[0]).toHaveProperty('dynamic');
            expect(all[1]).toHaveProperty('assets');
            expect(all).toHaveLength(2);
        });
    });

    describe('Lifecycle: Removal', () => {
        it('should clean up the registry completely on remove', () => {
            registry.register({
                id: 'target',
                type: ELEMENT_TYPES.BOX,
                width: 1,
                position: {x: 0, y: 0, z: 0}
            });
            expect(registry.get('target')).toBeDefined();

            registry.remove('target');

            expect(registry.get('target')).toBeUndefined();
            expect(Array.from(registry.all())).toHaveLength(0);
        });
    });
});