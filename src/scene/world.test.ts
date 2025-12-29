import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {ASSET_STATUS, type AssetLoader, type GraphicProcessor, type Vector3} from './types.ts';
import type { SceneManager } from "./scene_manager.ts";
import { World } from "./world.ts";
import {ChaosLoader} from "./asset_registry.test.ts";

// 1. Use your actual ChaosLoader
const loader = new ChaosLoader();

const mockManager: SceneManager = {
    calculateScene: vi.fn(),
    initialCam: { x: 0, y: 0, z: 0 } as Vector3,
    carModifiers: [], nudgeModifiers: [], stickModifiers: [],
    isDebug: false, stickDistance: 1000,
    setDebug: vi.fn(), setStickDistance: vi.fn(), addCarModifier: vi.fn(),
    addNudgeModifier: vi.fn(), addStickModifier: vi.fn(), processNudges: vi.fn(),
    calculateLookAt: vi.fn(), createEmptyDebugLog: vi.fn(),
} as unknown as SceneManager;

export const createMockGP = (): GraphicProcessor => {
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
        drawPlane: vi.fn(),
        drawPanel: vi.fn(),
        // Real logic for math utils is often better than a mock for tests
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
        drawHUDText: vi.fn()
    };
};

describe('World Orchestration', () => {
    let world: World;

    beforeEach(() => {
        vi.clearAllMocks();
        (mockManager.calculateScene as Mock).mockReturnValue({
            camera: { x: 0, y: 0, z: 100 }, lookAt: { x: 0, y: 0, z: 0 }, debug: undefined
        });
        world = new World(mockManager);
    });

    it('should handle textureless elements (Born Ready)', async () => {
        world.addElement('color_box', { type: 'box', position: { x: 0, y: 0, z: 0 }, size: 5 });

        await world.hydrate(loader); // Using ChaosLoader

        const element = (world as any).registry.get('color_box');
        expect(element.assets.texture.status).toBe(ASSET_STATUS.READY);
        expect(element.assets.texture.value).toBeNull();
    });

    it('should handle native failures from ChaosLoader', async () => {
        world.addElement('broken', {
            type: 'panel', width: 1, height: 1, position: { x: 0, y: 0, z: 0 },
            texture: { path: 'fail.png', width: 1, height: 1 }
        });

        await world.hydrate(loader);

        const element = (world as any).registry.get('broken');
        expect(element.assets.texture.status).toBe(ASSET_STATUS.ERROR);
        expect(element.assets.texture.error).toBe("Could not decode");
    });

    it('should successfully hydrate valid textures', async () => {
        world.addElement('sprite', {
            type: 'panel', width: 10, height: 10, position: { x: 0, y: 0, z: 0 },
            texture: { path: 'bricks.png', width: 100, height: 100 }
        });

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
                camera: { x: 0, y: 0, z: 100 },
                lookAt: { x: 0, y: 0, z: 0 },
                debug: undefined
            });

            world = new World(mockManager);
        });

        it('should sort elements by distance and render far-to-near', async () => {
            // Add one element far away
            world.addElement('far', {
                type: 'box', size: 5, position: { x: 0, y: 0, z: -500 }
            });
            // Add one element very close
            world.addElement('near', {
                type: 'box', size: 5, position: { x: 0, y: 0, z: 50 }
            });

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
            expect(mockGP.setCamera).toHaveBeenCalledWith(
                { x: 0, y: 0, z: 100 },
                { x: 0, y: 0, z: 0 }
            );
        });

        it('should pass debug info to the processor when enabled', () => {
            (mockManager.calculateScene as Mock).mockReturnValue({
                camera: { x: 0, y: 0, z: 100 },
                lookAt: { x: 0, y: 0, z: 0 },
                debug: {
                    car: { name: 'TestCar', priority: 1, x: 10, y: 10, z: 10 },
                    nudges: [{ name: 'Nudge1', x: 5, y: 5, z: 5 }],
                    stick: { name: 'Stick', priority: 1 },
                    errors: [{ name: 'Err', message: 'Failed' }]
                }
            });

            world.step(mockGP);

            expect(mockGP.drawLabel).toHaveBeenCalledWith(expect.stringContaining('CAR: TestCar'), expect.any(Object));
            expect(mockGP.drawHUDText).toHaveBeenCalledWith(expect.stringContaining('Error: Failed'), 20, 20);
        });
    });
});