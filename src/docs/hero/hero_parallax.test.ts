import { describe, expect, it, vi } from 'vitest';
import p5 from 'p5';
import { heroParallax } from './hero_parallax.ts';
import { createMockP5 } from '../../scene/mock/mock_p5.mock.ts';
import { World } from '../../scene/world.ts';
import { HeadTrackingModifier } from '../../scene/modifiers/head_tracking_modifier.ts';
import { extractSketchFunction } from '../tutorial/sketch_engine.live.ts';
import source from './hero_parallax.ts?raw';

async function createDemo(fn = heroParallax) {
    const mock = createMockP5();
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 480 }) as DOMRect;
    mock.createCanvas.mockReturnValue({ elt: canvas });
    const tracker = { init: vi.fn(async () => {}), type: 'headTracker', tick: vi.fn(), getData: () => null };
    const webcam = { type: 'webCam', tick: vi.fn(), getData: () => null };
    const world = await fn(mock as unknown as p5, { width: 640, height: 480, paused: false }, {
        faceDataProvider: tracker, webCamProvider: webcam,
    } as any);
    await mock.setup();
    return { world, mock, canvas };
}

describe('Independent layered main demo', () => {
    it('contains five image panels and no target or cube scene', async () => {
        const { world } = await createDemo();
        for (let index = 0; index < 5; index++) expect(world.getElement(`castle-layer-${index}`)).toBeDefined();
        expect(world.getElement('target-1')).toBeUndefined();
        expect(world.getElement('center-cube')).toBeUndefined();
        expect(world.getElement('tunnel-0')).toBeUndefined();
    });

    it('moves the camera from canvas input when no face is available', async () => {
        const spy = vi.spyOn(World.prototype, 'addModifierToProjection');
        const { canvas } = await createDemo();
        const modifier = spy.mock.calls.find(call => call[0] === "head")![1] as HeadTrackingModifier;
        canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 640, clientY: 480 }));
        canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
        const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, { dataProviders: { headTracker: null } } as any);
        expect(result).toMatchObject({ success: true, value: { position: { x: 150, y: 100, z: 25 } } });
        spy.mockRestore();
    });

    it('can rerun its standalone source in the live editor', async () => {
        const { fn } = extractSketchFunction(source);
        const { world } = await createDemo(fn as typeof heroParallax);
        expect(world.getElement('castle-layer-4')).toBeDefined();
    });
});
