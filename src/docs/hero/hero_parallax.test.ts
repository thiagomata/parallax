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

describe('Keyboard zoom (W / S)', () => {
    const press = (code: string, key: string, target: EventTarget = window) =>
        target.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true }));
    const release = (code: string, key: string) =>
        window.dispatchEvent(new KeyboardEvent('keyup', { code, key }));

    it('zooms in while W is held, up to the zoom-in limit', async () => {
        const { observe } = await createInspectedScene();
        press('KeyW', 'w');
        observe();
        expect(observe().position.z).toBe(50 - 16);
        for (let frame = 0; frame < 400; frame++) observe();
        expect(observe().position.z).toBe(-1200);
        release('KeyW', 'w');
    });

    it('zooms out while S is held, up to the max zoom out', async () => {
        const { observe } = await createInspectedScene();
        press('KeyS', 's');
        for (let frame = 0; frame < 400; frame++) observe();
        expect(observe().position.z).toBe(150);
        release('KeyS', 's');
    });

    it('responds right away after holding a key past a limit (no hidden build-up)', async () => {
        const { observe } = await createInspectedScene();
        press('KeyS', 's');
        for (let frame = 0; frame < 400; frame++) observe();
        release('KeyS', 's');
        press('KeyW', 'w');
        observe();
        expect(observe().position.z).toBeLessThan(150);
        release('KeyW', 'w');
    });

    it('releases the key even when Shift changed its key-up', async () => {
        const { observe } = await createInspectedScene();
        press('KeyW', 'w');
        observe();
        release('KeyW', 'W');
        const z = observe().position.z;
        expect(observe().position.z).toBe(z);
    });

    it('ignores keys typed into text fields', async () => {
        const { observe } = await createInspectedScene();
        const editor = document.createElement('textarea');
        document.body.appendChild(editor);
        press('KeyW', 'w', editor);
        observe();
        expect(observe().position.z).toBe(50);
        release('KeyW', 'w');
        editor.remove();
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

describe('Title colors', () => {
    const atEyeZ = (z: number) => ({ projectionPool: { eye: { position: { x: 0, y: 0, z }, globalPosition: { x: 0, y: 0, z } } } });

    it('warms from black at the start to brown at the title as the observer approaches', async () => {
        const { byId } = await createInspectedScene();
        const fillColor = byId('parallax-title-outline').fillColor;

        expect(fillColor(atEyeZ(150))).toEqual({ red: 0, green: 0, blue: 0 });
        expect(fillColor(atEyeZ(-997))).toEqual({ red: 139, green: 69, blue: 19 });
        const reds = [150, -100, -400, -700, -997].map(z => fillColor(atEyeZ(z)).red);
        expect(reds).toEqual([...reds].sort((a, b) => a - b));
    });

    it('tints the fill from the artwork as-is (white) to cyan with the same closeness', async () => {
        const { byId } = await createInspectedScene();
        const fillColor = byId('parallax-title').fillColor;

        expect(fillColor(atEyeZ(150))).toEqual({ red: 255, green: 255, blue: 255 });
        expect(fillColor(atEyeZ(-1000))).toEqual({ red: 0, green: 255, blue: 255 });
        const reds = [150, -100, -400, -700, -1000].map(z => fillColor(atEyeZ(z)).red);
        expect(reds).toEqual([...reds].sort((a, b) => b - a));
    });

    it('keeps the starting colors when no camera is resolved', async () => {
        const { byId } = await createInspectedScene();
        expect(byId('parallax-title-outline').fillColor({ projectionPool: {} })).toEqual({ red: 0, green: 0, blue: 0 });
        expect(byId('parallax-title').fillColor({ projectionPool: {} })).toEqual({ red: 255, green: 255, blue: 255 });
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

    it('keeps the sky (layer-01) top edge above the view, even at max zoom out', async () => {
        const { byId, observe, wheel } = await createInspectedScene();
        wheel(4000);
        const head = observe().position;
        const eye = { y: head.y, z: head.z + 100 };
        const sky = byId('mountain-backdrop-01');
        const bound = sky.effects.find((effect: any) => effect.type === 'follow').settings.targetBounds;
        // The sky box follows the camera (bounded in z): world z = followed z + its local z.
        const skyZ = Math.min(eye.z, bound.max.z) + sky.position.z;
        const skyTop = eye.y + sky.position.y - sky.height / 2;
        const viewTop = eye.y - (eye.z - skyZ) * Math.tan(Math.PI / 6); // 60deg vertical fov

        expect(skyTop).toBeLessThanOrEqual(viewTop);
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
