import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ASSET_STATUS, type Vector3 } from './types.ts';
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
});