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

// Captures every panel/floor blueprint the scene declares, plus the observer modifier, so
// the tests can check the scene's rules without depending on specific layer positions.
async function createInspectedScene() {
    const panels = vi.spyOn(World.prototype, 'addPanel');
    const floors = vi.spyOn(World.prototype, 'addFloor');
    const modifiers = vi.spyOn(World.prototype, 'addModifierToProjection');
    const scene = await createScene();
    const blueprints = [...panels.mock.calls, ...floors.mock.calls].map(([blueprint]) => blueprint as any);
    const observer = modifiers.mock.calls.find(([id]) => id === 'head')![1] as any;
    panels.mockRestore();
    floors.mockRestore();
    modifiers.mockRestore();
    const byId = (id: string) => blueprints.find(blueprint => blueprint.id === id);
    const observe = () => observer.getCarPosition({}, { dataProviders: { headTracker: null } }).value;
    const wheel = (deltaY: number) => scene.canvas.dispatchEvent(new WheelEvent('wheel', { deltaY, cancelable: true }));
    const pointAt = (clientX: number, clientY: number) =>
        scene.canvas.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY }));
    return { ...scene, blueprints, byId, observe, wheel, pointAt };
}

const followsCamera = (blueprint: any) =>
    (blueprint.effects ?? []).some((effect: any) => effect.type === 'follow');

describe('Observer limits', () => {
    it('starts lower and a bit in front of the max zoom out', async () => {
        const { observe } = await createInspectedScene();
        expect(observe().position).toEqual({ x: 0, y: 60, z: 50 });
    });

    it('stops zooming out at the point layer-11 is sized to frame', async () => {
        const { observe, wheel } = await createInspectedScene();
        wheel(4000);
        expect(observe().position.z).toBe(150);
    });

    it('flies in at twice the head movement, stopping just past the title', async () => {
        const { observe, wheel } = await createInspectedScene();
        wheel(-400); // pointer z -100 -> head z 50 - 200
        expect(observe().position.z).toBe(-150);
        wheel(-40000);
        expect(observe().position.z).toBe(-1200);
    });

    it('only restricts sideways movement when far back', async () => {
        const { observe, wheel, pointAt } = await createInspectedScene();
        pointAt(640, 240); // far right: pointer x 150
        wheel(4000); // max zoom out: head z 150, 550 from layer-11
        expect(observe().position.x).toBeCloseTo(825 - 550 * 1.23);
        wheel(-40000); // max zoom in: well past layer-11, unrestricted
        expect(observe().position.x).toBe(150);
    });

    it('limits the arrow keys to the turn head tracking can reach (~0.1 rad)', async () => {
        const { observe } = await createInspectedScene();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        for (let frame = 0; frame < 120; frame++) observe();
        const { rotation } = observe();
        expect(rotation.yaw).toBeCloseTo(0.1);
        expect(rotation.pitch).toBeCloseTo(-0.1);
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
    });
});

describe('Post light', () => {
    it('flickers its brightness through the tint, never its alpha', async () => {
        const { byId } = await createInspectedScene();
        const fillColor = byId('post-light').fillColor;
        const samples = Array.from({ length: 600 }, (_, frame) => fillColor({ playback: { now: frame * 1000 / 60 } }));

        const reds = samples.map(color => color.red);
        expect(Math.max(...reds)).toBeLessThanOrEqual(255);
        expect(Math.min(...reds)).toBeGreaterThan(255 * 0.35);
        expect(new Set(reds).size).toBeGreaterThan(20);
        expect(samples.every(color => color.alpha === undefined)).toBe(true);
    });
});

describe('Scene rules', () => {
    it('never puts two overlapping fixed panels at the same depth (they would z-fight)', async () => {
        const { blueprints } = await createInspectedScene();
        const fixed = blueprints.filter(blueprint => !followsCamera(blueprint) && blueprint.width && blueprint.height);
        const overlaps = (a: any, b: any) =>
            Math.abs(a.position.x - b.position.x) < (a.width + b.width) / 2 &&
            Math.abs(a.position.y - b.position.y) < (a.height + b.height) / 2;

        const clashes = fixed.flatMap((a, i) => fixed.slice(i + 1)
            .filter(b => a.position.z === b.position.z && overlaps(a, b))
            .map(b => `${a.id} / ${b.id}`));
        expect(clashes).toEqual([]);
    });

    it('stops the camera-following room as one rigid group, before layer-02 reaches layer-03', async () => {
        const { blueprints, byId } = await createInspectedScene();
        const boundsOf = (blueprint: any) =>
            blueprint.effects.find((effect: any) => effect.type === 'follow').settings.targetBounds;
        const room = blueprints.filter(blueprint =>
            /^mountain-backdrop-0[12]/.test(blueprint.id) || ['ground-floor', 'roof'].includes(blueprint.id));

        expect(room.length).toBeGreaterThanOrEqual(8);
        const bounds = boundsOf(room[0]);
        room.forEach(blueprint => expect(boundsOf(blueprint)).toEqual(bounds));

        const layer02AtBound = bounds.max.z + byId('mountain-backdrop-02').position.z;
        expect(layer02AtBound).toBeLessThanOrEqual(byId('mountain-backdrop-03').position.z - 100);
    });
});
