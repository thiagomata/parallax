import {describe, expect, it, vi} from 'vitest';
import {tutorial_parallax} from './tutorial_parallax.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox} from "../../../scene/types.ts";
import {createMockFaceWorldData, createMockHeadTrackingProvider, createMockSceneFace} from "../../../scene/mock/face.mock.ts";

describe('Tutorial 10: Parallax Head-Tracked VR View', () => {

    it('should register all scene elements at canonical head position', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        // Canonical head - centered, looking straight
        const canonicalFace = createMockFaceWorldData({
            sceneFace: createMockSceneFace({
                localPosition: { x: 0, y: 0, z: 0 },
                localRotation: { yaw: 0, pitch: 0, roll: 0 }
            })
        });

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(canonicalFace);

        const world = await tutorial_parallax(mockP5 as unknown as p5, { 
            width: 640, 
            height: 480,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        
        await mockP5.setup();
        mockP5.draw();

        // Verify all elements are registered
        expect(world.getElement('center-cube')).toBeDefined();
        expect(world.getElement('left-cube')).toBeDefined();
        expect(world.getElement('right-cube')).toBeDefined();
        expect(world.getElement('far-cube')).toBeDefined();
        expect(world.getElement('front-cube')).toBeDefined();

        // Verify resolved properties
        const centerCube = world.getCurrenState()?.elements.get('center-cube') as ResolvedBox;
        expect(centerCube).toBeDefined();
        expect(centerCube.width).toBe(50);
        expect(centerCube.position).toStrictEqual({x: 0, y: 200, z: 0});
        
        // Verify side effects
        expect(mockP5.box).toHaveBeenCalled();
        expect(mockP5.cylinder).toHaveBeenCalled();
    });

    it('should use off-axis projection with head tracking hierarchy', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(createMockFaceWorldData());

        await tutorial_parallax(mockP5 as unknown as p5, { 
            width: 640, 
            height: 480,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        
        await mockP5.setup();

        // Verify world was created successfully
        expect(mockP5.createCanvas).toHaveBeenCalled();
    });

    it('should accept mock head tracking provider', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const faceData = createMockFaceWorldData({
            sceneFace: createMockSceneFace({
                localPosition: { x: 50, y: -30, z: 100 },
                localRotation: { yaw: 0.5, pitch: 0.3, roll: 0.1 }
            })
        });

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(faceData);

        const world = await tutorial_parallax(mockP5 as unknown as p5, { 
            width: 640, 
            height: 480,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        
        // Verify world was created with the mock provider
        expect(world).toBeDefined();
    });

    it('should step the parallax scene after setup', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(createMockFaceWorldData());

        await tutorial_parallax(mockP5 as unknown as p5, {
            width: 640,
            height: 480,
            clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);

        await mockP5.setup();
        await mockP5.draw();

        expect(mockP5.background).toHaveBeenCalled();
        expect(mockP5.box).toHaveBeenCalled();
    });
});


it.each(['ERROR', 'READY'])('keeps bounded pointer controls available with camera status %s', async cameraStatus => {
    const { World } = await import('../../../scene/world.ts');
    const spy = vi.spyOn(World.prototype, 'addModifierToProjection');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mock = createMockP5();
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 480 }) as DOMRect;
    mock.createCanvas.mockReturnValue({ elt: canvas });
    const tracker = { init: async () => { if (cameraStatus === 'ERROR') throw new Error('camera blocked'); }, getData: () => null, tick: () => {} };
    await tutorial_parallax(mock as unknown as p5, { width: 640, height: 480, paused: false }, {
        faceDataProvider: tracker,
        webCamProvider: { getStatus: () => cameraStatus, getData: () => null, tick: () => {} },
    } as any);
    await mock.setup();
    const status = vi.fn();
    canvas.addEventListener('observerstatus', status);
    canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 2000, clientY: -2000 }));
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 10000 }));
    const modifier = spy.mock.calls.find(([id]) => id === 'head')![1] as any;
    const result = modifier.getCarPosition({}, { dataProviders: { headTracker: null } });
    expect(result.value.position).toEqual({ x: 150, y: -100, z: 100 });
    expect(status.mock.calls[0][0].detail).toContain(cameraStatus === 'READY' ? 'No face detected' : 'Camera unavailable');
    modifier.getCarPosition({}, { dataProviders: { headTracker: null } });
    expect(status).toHaveBeenCalledTimes(1);
    const tracked = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, { dataProviders: { headTracker: createMockFaceWorldData() } });
    expect(tracked.success).toBe(true);
    expect(status.mock.calls[1][0].detail).toBe('Head tracking active.');
    modifier.tick(1);
    spy.mockRestore(); warning.mockRestore();
});

it('allows pointer resolution while the camera is still starting', async () => {
    const { World } = await import('../../../scene/world.ts');
    const spy = vi.spyOn(World.prototype, 'addModifierToProjection');
    const mock = createMockP5();
    let finish!: () => void;
    const pending = tutorial_parallax(mock as unknown as p5, { width: 640, height: 480, paused: false }, {
        faceDataProvider: { init: () => new Promise<void>(resolve => { finish = resolve; }) },
        webCamProvider: { getStatus: () => 'INITIALIZING' },
    } as any);
    const modifier = spy.mock.calls.find(([id]) => id === 'head')![1] as any;
    expect(modifier.getCarPosition({}, { dataProviders: { headTracker: null } }).success).toBe(true);
    finish();
    await pending;
    spy.mockRestore();
});

describe('Keyboard alternative', () => {
    async function observerOf() {
        const { World } = await import('../../../scene/world.ts');
        const spy = vi.spyOn(World.prototype, 'addModifierToProjection');
        await tutorial_parallax(createMockP5() as unknown as p5, { width: 640, height: 480, paused: false }, {
            faceDataProvider: { init: async () => {} },
            webCamProvider: { getStatus: () => 'READY' },
        } as any);
        const observer = spy.mock.calls.find(([id]) => id === 'head')![1] as any;
        spy.mockRestore();
        return (headTracker: unknown = null) => observer.getCarPosition({}, { dataProviders: { headTracker } }).value;
    }
    const hold = (code: string, key: string, frames: number, observe: () => unknown, target: EventTarget = window) => {
        target.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true }));
        for (let frame = 0; frame < frames; frame++) observe();
        window.dispatchEvent(new KeyboardEvent('keyup', { code, key }));
    };

    it('turns with the arrow keys, up to 0.1 rad each way', async () => {
        const observe = await observerOf();
        hold('ArrowRight', 'ArrowRight', 100, observe);
        hold('ArrowUp', 'ArrowUp', 100, observe);
        expect(observe().rotation).toEqual({ yaw: expect.closeTo(0.1), pitch: expect.closeTo(-0.1), roll: 0 });

        hold('ArrowLeft', 'ArrowLeft', 100, observe);
        hold('ArrowDown', 'ArrowDown', 100, observe);
        expect(observe().rotation).toEqual({ yaw: expect.closeTo(-0.1), pitch: expect.closeTo(0.1), roll: 0 });
    });

    it('zooms with W / S, up to 150 each way', async () => {
        const observe = await observerOf();
        hold('KeyW', 'w', 100, observe);
        expect(observe().position.z).toBe(-150);
        hold('KeyS', 's', 100, observe);
        expect(observe().position.z).toBe(150);
    });

    it('adds the keys on top of head tracking', async () => {
        const observe = await observerOf();
        const face = { localPosition: { x: 0, y: 0, z: 0 }, stick: { yaw: 0, pitch: 0, roll: 0 } };
        hold('KeyW', 'w', 10, () => observe(face));
        const value = observe(face);
        expect(value.position.z).toBeLessThan(0);
        expect(value.name).not.toBe('Pointer fallback');
    });

    it('ignores keys typed into text fields', async () => {
        const observe = await observerOf();
        const editor = document.createElement('textarea');
        document.body.appendChild(editor);
        hold('KeyW', 'w', 10, observe, editor);
        expect(observe().position.z).toBe(0);
        editor.remove();
    });
});
