import { describe, expect, it, vi } from 'vitest';
import p5 from 'p5';
import { World } from '../../scene/world.ts';
import { createMockP5 } from '../../scene/mock/mock_p5.mock.ts';
import { heroParallax } from './hero_parallax.ts';
import { extractSketchFunction } from '../tutorial/sketch_engine.live.ts';
import source from './hero_parallax.ts?raw';

async function createScene(fn = heroParallax) {
    const mock = createMockP5();
    const parent = document.createElement('div');
    const canvas = document.createElement('canvas');
    parent.appendChild(canvas);
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 480 }) as DOMRect;
    mock.createCanvas.mockReturnValue({ elt: canvas });
    const tracker = { init: async () => {}, tick: () => {}, getData: () => null };
    const world = await fn(mock as unknown as p5, { width: 640, height: 480, paused: false }, { faceDataProvider: tracker, webCamProvider: tracker } as any);
    await mock.setup();
    return { mock, world, canvas };
}

describe('Main scene declarations', () => {
    it('declares the mountain backdrop, the artwork layers and the title', async () => {
        const { world } = await createScene();
        expect(world.getElement('mountain-backdrop-01')).toBeDefined();
        expect(world.getElement('layer-04')).toBeDefined();
        expect(world.getElement('layer-11')).toBeDefined();
        expect(world.getElement('parallax-title')).toBeDefined();
    });

    it('rotates the head via arrow keys', async () => {
        const modifiers = vi.spyOn(World.prototype, 'addModifierToProjection');
        await createScene();
        const modifier = modifiers.mock.calls.find(([id]) => id === 'head')![1] as any;
        // Arrow-key state is tracked in a plain closure object, not the engine's
        // ExternalStore - see the note above resolveKeyRotation in hero_parallax.ts
        // for why (car modifiers are resolved with a hardcoded empty store).
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        const result = modifier.getCarPosition({}, { dataProviders: { headTracker: null } });
        expect(result.value.rotation.yaw).toBeGreaterThan(0);
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
        modifiers.mockRestore();
    });

    it('runs the editable source with the same engine modules', async () => {
        const { fn } = extractSketchFunction(source);
        const { world } = await createScene(fn as typeof heroParallax);
        expect(world.getElement('layer-11')).toBeDefined();
    });
});
