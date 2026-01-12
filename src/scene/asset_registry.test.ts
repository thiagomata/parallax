import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetRegistry } from './asset_registry';
import {
    ASSET_STATUS,
    ELEMENT_TYPES,
    type AssetLoader,
} from './types';
import type { MockBundle } from "./mock/mock_type.mock.ts";

/**
 * Mocking the Loader to observe Phase 2 triggers
 */
const createMockLoader = (): AssetLoader<MockBundle> => ({
    hydrateTexture: vi.fn().mockResolvedValue({
        status: ASSET_STATUS.READY,
        value: { internalRef: { id: 'tex-1' } }
    }),
    hydrateFont: vi.fn().mockResolvedValue({
        status: ASSET_STATUS.READY,
        value: { internalRef: { name: 'Arial' } }
    }),
});

describe('AssetRegistry', () => {
    let loader: AssetLoader<MockBundle>;
    let registry: AssetRegistry<MockBundle>;

    beforeEach(() => {
        loader = createMockLoader();
        registry = new AssetRegistry<MockBundle>(loader);
    });

    describe('register', () => {
        it('should create a RenderableElement and trigger texture hydration', () => {
            const id = 'textured-box';
            const blueprint = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                size: 10,
                texture: { path: 'grass.png', width: 64, height: 64 }
            };

            const element = registry.register(id, blueprint);

            // Phase 1 check: Dynamic plan exists
            expect(element.id).toBe(id);
            expect(element.dynamic.type).toBe(ELEMENT_TYPES.BOX);

            // Phase 2 check: Initial status is PENDING because texture exists
            expect(element.assets.texture?.status).toBe(ASSET_STATUS.PENDING);

            // Check dependency injection: Did it call the loader?
            expect(loader.hydrateTexture).toHaveBeenCalledWith(blueprint.texture);
        });

        it('should initialize with READY status if NO asset ref is provided', () => {
            const blueprint = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                size: 10
            };

            const element = registry.register('plain-box', blueprint);

            // Immediate READY because there is no work for the loader to do
            expect(element.assets.texture?.status).toBe(ASSET_STATUS.READY);
            expect(element.assets.texture?.value).toBeNull();
        });

        it('should return the existing instance (singleton) if the ID is already registered', () => {
            const blueprint = { type: ELEMENT_TYPES.BOX, size: 5, position: { x: 0, y: 0, z: 0 } };

            const first = registry.register('item-1', blueprint);
            const second = registry.register('item-1', blueprint);

            expect(first).toBe(second);
            // Ensure loader wasn't called twice for the same registration
            expect(loader.hydrateTexture).not.toHaveBeenCalled();
        });
    });

    describe('Retrieval and Iteration', () => {
        it('should retrieve registered elements by ID', () => {
            registry.register('box-1', { type: ELEMENT_TYPES.BOX, size: 1, position: { x: 0, y: 0, z: 0 } });

            const found = registry.get('box-1');
            expect(found).toBeDefined();
            expect(found?.id).toBe('box-1');
        });

        it('should provide an iterator over all registered elements', () => {
            registry.register('s1', { type: ELEMENT_TYPES.BOX, size: 1, position: { x: 0, y: 0, z: 0 } });
            registry.register('t1', {
                type: ELEMENT_TYPES.TEXT,
                text: 'hi',
                size: 12,
                position: { x: 0, y: 0, z: 0 }
            });

            const allElements = Array.from(registry.all());

            expect(allElements).toHaveLength(2);
            expect(allElements.map(e => e.id)).toContain('s1');
            expect(allElements.map(e => e.id)).toContain('t1');
        });
    });

    describe('Lifecycle: Removal', () => {
        it('should remove an element from the registry', () => {
            registry.register('box-1', {
                type: ELEMENT_TYPES.BOX,
                size: 1,
                position: { x: 0, y: 0, z: 0 }
            });

            expect(registry.get('box-1')).toBeDefined();

            registry.remove('box-1');

            expect(registry.get('box-1')).toBeUndefined();
            expect(Array.from(registry.all())).toHaveLength(0);
        });

        it('should not throw an error when removing a non-existent ID', () => {
            expect(() => registry.remove('ghost-id')).not.toThrow();
        });

        it('should only remove the targeted element and leave others intact', () => {
            registry.register('keep-me', { type: ELEMENT_TYPES.BOX, size: 1, position: {x:0,y:0,z:0} });
            registry.register('delete-me', { type: ELEMENT_TYPES.BOX, size: 1, position: {x:0,y:0,z:0} });

            registry.remove('delete-me');

            expect(registry.get('keep-me')).toBeDefined();
            expect(registry.get('delete-me')).toBeUndefined();
            expect(Array.from(registry.all())).toHaveLength(1);
        });
    });
});