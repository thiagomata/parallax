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
    it('declares the tunnel, targets, and marker cubes, with a keyboard-driven head rotation', async () => {
        const { world } = await createScene();
        expect(world.getElement('tunnel-0')).toBeDefined();
        expect(world.getElement('target-1')).toBeDefined();
        expect(world.getElement('center-cube')).toBeDefined();
        expect(world.getElement('left-cube')).toBeDefined();
        expect(world.getElement('right-cube')).toBeDefined();
        expect(world.getElement('far-cube')).toBeDefined();
        expect(world.getElement('front-cube')).toBeDefined();
    });

    it('rotates the head via arrow keys through the ExternalStore', async () => {
        const modifiers = vi.spyOn(World.prototype, 'addModifierToProjection');
        const { world } = await createScene();
        const modifier = modifiers.mock.calls.find(([id]) => id === 'head')![1] as any;
        const store = world.getExternalStore() as any;
        store.global = { keys: { ArrowRight: true } };
        const result = modifier.getCarPosition({}, { dataProviders: { headTracker: null }, previousStore: store, nextStore: {} });
        expect(result.value.rotation.yaw).toBeGreaterThan(0);
        modifiers.mockRestore();
    });

    it('runs the editable source with the same engine modules', async () => {
        const { fn } = extractSketchFunction(source);
        const { world } = await createScene(fn as typeof heroParallax);
        expect(world.getElement('center-cube')).toBeDefined();
    });
});
