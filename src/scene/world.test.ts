import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest';
import {
    ASSET_STATUS,
    type AssetLoader,
    DEFAULT_SETTINGS, ELEMENT_TYPES,
    type GraphicProcessor,
    type SceneCameraState,
    type ScenePlaybackState,
    type SceneState,
    type SceneStateDebugLog,
    type Vector3
} from './types.ts';
import type {SceneManager} from "./scene_manager.ts";
import {World} from "./world.ts";
import {ChaosLoader} from "./mock/mock_asset_loader.ts";
import {toProps} from "./create_renderable.ts";

const loader = new ChaosLoader();

const mockManager: SceneManager = {
    calculateScene: vi.fn(),
    initialCam: {x: 0, y: 0, z: 0} as Vector3,
    carModifiers: [], nudgeModifiers: [], stickModifiers: [],
    isDebug: false, stickDistance: 1000,
    setDebug: vi.fn(), setStickDistance: vi.fn(), addCarModifier: vi.fn(),
    addNudgeModifier: vi.fn(), addStickModifier: vi.fn(), processNudges: vi.fn(),
    calculateLookAt: vi.fn(), createEmptyDebugLog: vi.fn(),
    initialState: vi.fn(),
} as unknown as SceneManager;

const mockOrigin = {x: 0, y: 0, z: 0};
const mockState: SceneState = {
    settings: DEFAULT_SETTINGS,
    playback: {
        now: Date.now(),
        delta: 0,
        progress: 0,
        frameCount: 60
    } as ScenePlaybackState,
    camera: {
        position: mockOrigin,
        lookAt: mockOrigin,
        yaw: 0,
        pitch: 0,
        direction: mockOrigin,
    } as SceneCameraState
};

const createMockGP = (): GraphicProcessor => {
    return {
        text: vi.fn(),
        loader: {} as AssetLoader,
        setCamera: vi.fn(),
        push: vi.fn(),
        pop: vi.fn(),
        translate: vi.fn(),
        rotateX: vi.fn(),
        rotateY: vi.fn(),
        rotateZ: vi.fn(),
        fill: vi.fn(),
        noFill: vi.fn(),
        stroke: vi.fn(),
        noStroke: vi.fn(),
        drawBox: vi.fn(),
        plane: vi.fn(),
        drawPanel: vi.fn(),
        dist: (v1: Vector3, v2: Vector3) => Math.sqrt(
            Math.pow(v2.x - v1.x, 2) +
            Math.pow(v2.y - v1.y, 2) +
            Math.pow(v2.z - v1.z, 2)
        ),
        map: vi.fn((v, _s1, _st1, _s2, _st2) => v),
        lerp: vi.fn((s, e, t) => s + (e - s) * t),

        drawLabel: vi.fn(),
        drawText: vi.fn(),
        drawCrosshair: vi.fn(),
        drawHUDText: vi.fn(),
        millis: vi.fn(),
        deltaTime: vi.fn(),
        frameCount: vi.fn(),
        initialState: () => mockState
    } as GraphicProcessor<unknown, unknown>;
};

describe('World Orchestration', () => {
    let world: World;

    beforeEach(() => {
        vi.clearAllMocks();
        (mockManager.calculateScene as Mock).mockReturnValue(mockState);
        world = new World(mockManager);
    });

    it('should handle textureless elements (Born Ready)', async () => {
        world.addElement('color_box', toProps({type: 'box', position: {x: 0, y: 0, z: 0}, size: 5}));

        await world.hydrate(loader); // Using ChaosLoader

        const element = (world as any).registry.get('color_box');
        expect(element.assets.texture.status).toBe(ASSET_STATUS.READY);
        expect(element.assets.texture.value).toBeNull();
    });

    it('should handle native failures from ChaosLoader', async () => {
        world.addElement('broken', toProps({
            type: 'panel', width: 1, height: 1, position: {x: 0, y: 0, z: 0},
            texture: {path: 'fail.png', width: 1, height: 1}
        }));

        await world.hydrate(loader);

        const element = (world as any).registry.get('broken');
        expect(element.assets.texture.status).toBe(ASSET_STATUS.ERROR);
        expect(element.assets.texture.error).toBe("Could not decode");
    });

    it('should successfully hydrate valid textures', async () => {
        world.addElement('sprite', toProps({
            type: 'panel', width: 10, height: 10, position: {x: 0, y: 0, z: 0},
            texture: {path: 'bricks.png', width: 100, height: 100}
        }));

        await world.hydrate(loader);

        const element = (world as any).registry.get('sprite');
        expect(element.assets.texture.status).toBe(ASSET_STATUS.READY);
        expect(element.assets.texture.value.internalRef).toBe("ptr_bricks.png");
    });

    describe('World Orchestration - Sorting & Rendering', () => {
        let world: World;
        let mockGP: GraphicProcessor;

        beforeEach(() => {
            vi.clearAllMocks();
            mockGP = createMockGP();

            (mockManager.calculateScene as Mock).mockReturnValue({
                settings: DEFAULT_SETTINGS,
                playback: {
                    now: Date.now(),
                    delta: 0,
                    progress: 0,
                    frameCount: 60
                } as ScenePlaybackState,
                camera: {
                    position: {x: 0, y: 0, z: 0},
                    lookAt: {x: 0, y: 0, z: 0},
                } as SceneCameraState,
            } as SceneState);

            world = new World(mockManager);
        });

        it('should sort elements by distance and render far-to-near', async () => {
            // Add one element far away
            let farPlace = {x: 0, y: 0, z: 500}
            world.addElement('far', toProps({
                type: 'box', size: 5, position: farPlace
            }));
            // Add one element very close
            let nearPlace = {x: 0, y: 0, z: 50};
            world.addElement('near', toProps({
                type: 'box', size: 5, position: nearPlace
            }));

            // Hydrate so they are ready to render
            await world.hydrate(loader);

            // Capture the internal renderable objects
            const farEl = (world as any).registry.get('far');
            const nearEl = (world as any).registry.get('near');

            const farSpy = vi.spyOn(farEl, 'render');
            const nearSpy = vi.spyOn(nearEl, 'render');

            world.step(mockGP);

            // Distance check:
            // Cam(0,0,100) to Far(0,0,-500) = 600
            // Cam(0,0,100) to Near(0,0,50) = 50
            // 600 > 50, so 'far' must be called first.

            const farCallOrder = farSpy.mock.invocationCallOrder[0];
            const nearCallOrder = nearSpy.mock.invocationCallOrder[0];

            expect(farCallOrder).toBeLessThan(nearCallOrder);
            expect(mockGP.translate).toHaveBeenCalledWith(farPlace);
            expect(mockGP.translate).toHaveBeenCalledWith(nearPlace);

            const calls = vi.mocked(mockGP.translate).mock.calls;

            // first translated the far place
            expect(calls[0][0]).toEqual(farPlace);
            // later translated the near place
            expect(calls[1][0]).toEqual(nearPlace);
        });

        it('should pass debug info to the processor when enabled', () => {
            (mockManager.calculateScene as Mock).mockReturnValue({
                settings: {
                    ...DEFAULT_SETTINGS,
                    debug: true,
                },
                playback: {
                    now: Date.now(),
                    delta: 0,
                    progress: 0,
                    frameCount: 60,
                } as ScenePlaybackState,
                camera: {
                    position: {x:0,y:0,z:0},
                    lookAt: {x: 0, y: 0, z: 100},
                    direction: {x:0,y:0,z:1},
                    yaw: 0,
                    pitch: 0,
                } as SceneCameraState,
                debugStateLog: {
                    car: {name: 'TestCar', priority: 1, x: 10, y: 10, z: 10},
                    nudges: [{name: 'Nudge1', x: 5, y: 5, z: 5}],
                    stick: {name: 'Stick', priority: 1},
                    errors: [{name: 'Err', message: 'Failed'}]
                } as SceneStateDebugLog,
            } as SceneState);

            world.step(mockGP);

            expect(mockGP.drawLabel).toHaveBeenCalledWith(expect.stringContaining('CAR: TestCar'), expect.any(Object));
            expect(mockGP.drawHUDText).toHaveBeenCalledWith(expect.stringContaining('Error: Failed'), 20, 20);
        });
    });

    it('should deduplicate loading tasks for the same texture path', async () => {
        const path = 'shared.png';
        const loaderSpy = vi.spyOn(loader, 'hydrateTexture');

        world.addElement('el1', toProps({
            type: 'box',
            size: 1,
            position: {x: 0, y: 0, z: 0},
            texture: {path, width: 1, height: 1}
        }));
        world.addElement('el2', toProps({
            type: 'box',
            size: 1,
            position: {x: 0, y: 0, z: 0},
            texture: {path, width: 1, height: 1}
        }));

        await world.hydrate(loader);

        // This ensures your cache logic actually saves network/processing resources
        expect(loaderSpy).toHaveBeenCalledTimes(1);
    });

    it('should successfully hydrate valid fonts', async () => {
        world.addElement('text_el', toProps({
            type: 'text', text: 'hi', size: 10, position: {x: 0, y: 0, z: 0},
            font: {name: 'Inter', path: 'inter.ttf'}
        }));

        await world.hydrate(loader);

        const element = (world as any).registry.get('text_el');
        expect(element.assets.font.status).toBe(ASSET_STATUS.READY);
        expect(element.assets.font.value.internalRef).toBe("ptr_inter.ttf");
    });

    it('should skip hydration if asset is already present', async () => {
        world.addElement('pre_hydrated', toProps(
            {type: 'box', size: 5, position: {x: 0, y: 0, z: 0}}
        ));
        const element = (world as any).registry.get('pre_hydrated');

        // Manually set an asset
        element.assets.texture = {status: ASSET_STATUS.READY, value: null};

        const loaderSpy = vi.spyOn(loader, 'hydrateTexture');
        await world.hydrate(loader);

        // Should return early due to: if (el.assets.texture) return;
        expect(loaderSpy).not.toHaveBeenCalled();
    });

    it('should remove all elements and stop rendering after world.clear()', () => {
        const world = new World(mockManager);
        const gp = createMockGP(); // Using the mock from our previous conversation
        gp.dist = (_v1, _v2) => 0;

        // 1. Add an element
        world.addElement('temp-box', toProps({
            type: ELEMENT_TYPES.BOX,
            position: { x: 0, y: 0, z: 0 },
            size: 10
        }));

        world.step(gp);
        expect(gp.drawBox).toHaveBeenCalled();

        // 2. Clear the world
        world.clear();
        vi.clearAllMocks(); // Clear call history

        // 3. Step again - nothing should be drawn
        world.step(gp);
        expect(gp.drawBox).not.toHaveBeenCalled();
    });
});