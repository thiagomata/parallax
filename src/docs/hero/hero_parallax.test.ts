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
    it('declares static layer geometry, title colors, and layering instead of overriding drawing', async () => {
        const panels = vi.spyOn(World.prototype, 'addPanel');
        const modifiers = vi.spyOn(World.prototype, 'addModifierToProjection');
        const { canvas } = await createScene();
        const panel = (id: string) => panels.mock.calls.find(([props]) => props.id === id)![0] as any;
        const mountain = panel('figcraft-layer-304');
        const title = panel('parallax-title');
        const outline = panel('parallax-title-outline');
        const house = panel('figcraft-layer-434');
        expect(title.renderOrder).toBeLessThan(house.renderOrder);
        expect(outline.renderOrder).toBeGreaterThan(title.renderOrder);
        expect(outline.renderOrder).toBeLessThan(house.renderOrder);
        expect(mountain.depthTest).toBe(false);
        // Layer size/position are baked world-space values, not a per-frame formula:
        // the real camera dolly (via the head car modifier) drives zoom, not the panels.
        expect(typeof mountain.width).toBe('number');
        const modifier = modifiers.mock.calls.find(([id]) => id === 'head')![1] as any;
        modifier.getCarPosition({}, { dataProviders: { headTracker: null } });
        const originalWidth = mountain.width;
        const originalBlue = title.fillColor().blue;
        canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -1000 }));
        modifier.getCarPosition({}, { dataProviders: { headTracker: null } });
        expect(mountain.width).toBe(originalWidth);
        expect(title.fillColor().blue).toBeLessThan(originalBlue);
        expect(outline.fillColor().red).toBeGreaterThan(0);
        panels.mockRestore(); modifiers.mockRestore();
    });

    it('runs the editable source with the same engine modules', async () => {
        const { fn } = extractSketchFunction(source);
        const { world } = await createScene(fn as typeof heroParallax);
        expect(world.getElement('parallax-title-outline')).toBeDefined();
    });
});
