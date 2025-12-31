import {beforeEach, describe, expect, it} from 'vitest';
import {AssetRegistry} from './asset_registry';
import {ASSET_STATUS, ELEMENT_TYPES} from './types';

describe('AssetRegistry', () => {
    // We use 'string' and 'number' as dummy types for TTexture and TFont
    let registry: AssetRegistry<string, number>;

    beforeEach(() => {
        registry = new AssetRegistry<string, number>();
    });

    describe('defineShape', () => {
        it('should initialize with PENDING status if a texture is provided', () => {
            const id = 'textured-box';
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: {x: 0, y: 0, z: 0},
                size: 10,
                texture: {path: 'grass.png', width: 64, height: 64}
            };

            const spec = registry.defineShape(id, props);

            expect(spec.id).toBe(id);
            expect(spec.asset.status).toBe(ASSET_STATUS.PENDING);
            expect(spec.asset.value).toBeNull();
        });

        it('should initialize with READY status if NO texture is provided', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: {x: 0, y: 0, z: 0},
                size: 10
            };

            const spec = registry.defineShape('plain-box', props);

            expect(spec.asset.status).toBe(ASSET_STATUS.READY);
            expect(spec.asset.value).toBeNull();
        });

        it('should return the existing spec if the ID is already defined', () => {
            const props = {type: ELEMENT_TYPES.BOX, position: {x: 0, y: 0, z: 0}, size: 5};
            const first = registry.defineShape('item-1', props);
            const second = registry.defineShape('item-1', props);

            expect(first).toBe(second); // Identity check
        });
    });

    describe('defineText', () => {
        it('should initialize with PENDING status if a font is provided', () => {
            const props = {
                type: ELEMENT_TYPES.TEXT,
                text: 'Hello',
                size: 12,
                position: {x: 0, y: 0, z: 0},
                font: {name: 'Roboto', path: 'roboto.ttf'}
            };

            const spec = registry.defineText('label-1', props);

            expect(spec.asset.status).toBe(ASSET_STATUS.PENDING);
        });

        it('should initialize with READY status if NO font is provided', () => {
            const props = {
                type: ELEMENT_TYPES.TEXT,
                text: 'No Font',
                size: 12,
                position: {x: 0, y: 0, z: 0}
            };

            const spec = registry.defineText('plain-text', props);

            expect(spec.asset.status).toBe(ASSET_STATUS.READY);
        });
    });

    describe('Retrieval and Iteration', () => {
        it('should retrieve shapes and texts by ID', () => {
            registry.defineShape('box-1', {type: ELEMENT_TYPES.BOX, size: 1, position: {x: 0, y: 0, z: 0}});
            registry.defineText('txt-1', {type: ELEMENT_TYPES.TEXT, text: 'hi', size: 1, position: {x: 0, y: 0, z: 0}});

            expect(registry.getShape('box-1')).toBeDefined();
            expect(registry.getText('txt-1')).toBeDefined();
        });

        it('should provide an iterator over all combined specs', () => {
            registry.defineShape('s1', {type: ELEMENT_TYPES.BOX, size: 1, position: {x: 0, y: 0, z: 0}});
            registry.defineShape('s2', {type: ELEMENT_TYPES.BOX, size: 1, position: {x: 0, y: 0, z: 0}});
            registry.defineText('t1', {type: ELEMENT_TYPES.TEXT, text: 'a', size: 1, position: {x: 0, y: 0, z: 0}});

            const allSpecs = Array.from(registry.all());

            expect(allSpecs).toHaveLength(3);
            // Verify we have both types in the stream
            expect(allSpecs.some(s => s.id === 's1')).toBe(true);
            expect(allSpecs.some(s => s.id === 't1')).toBe(true);
        });
    });
});