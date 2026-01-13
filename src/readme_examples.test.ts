import { describe, it, expect, beforeEach } from 'vitest';
import {SceneManager} from "./scene/scene_manager.ts";
import {
    DEFAULT_SETTINGS,
    ELEMENT_TYPES, type GraphicProcessor,
    type SceneState,
} from "./scene/types.ts";
import {createRenderable, resolve} from "./scene/resolver.ts";
import {ChaosLoader} from "./scene/mock/mock_asset_loader.mock.ts";

describe('README Examples Validation', () => {

    let manager: SceneManager;
    let assetLoader = new ChaosLoader();
    beforeEach(() => {
        manager = new SceneManager(DEFAULT_SETTINGS);
    });

    it('should validate the Car, Nudge, and Stick modifier examples', () => {
        const playerPos = { x: 100, y: 50, z: 0 };

        // Example: Car Modifier
        manager.addCarModifier({
            name: "FollowPlayer",
            priority: 10,
            active: true,
            getCarPosition: (_current, _state) => ({
                success: true,
                value: { position: playerPos, name: "player" }
            })
        });

        // Example: Nudge Modifier
        manager.addNudgeModifier({
            name: "Breathing",
            active: true,
            getNudge: (_base, state) => ({
                success: true,
                value: { y: Math.sin(state.playback.now * 0.002) * 15 }
            })
        });

        // Example: Stick Modifier
        manager.addStickModifier({
            name: "LookAtCenter",
            active: true,
            priority: 1,
            getStick: (camPos) => ({
                success: true,
                value: { yaw: Math.atan2(-camPos.x, camPos.z), pitch: 0, distance: 1000, priority: 1 }
            })
        });

        const state = manager.calculateScene(1000, 16, 60, manager.initialState());

        // Validate the logic: Car should set position, Nudge should modify Y
        expect(state.camera.position.x).toBe(100);
        expect(state.camera.position.y).toBeCloseTo(50 + Math.sin(1000 * 0.002) * 15);
    });

    it('should validate the Recursive Spec Resolution examples', () => {
        const state = manager.initialState();

        // Example 1: Static & Computed Props
        // Added 'position' as it is required by SceneElementProps
        const props = ({
            type: ELEMENT_TYPES.BOX,
            position: { x: 0, y: 0, z: 0 },
            size: (s: SceneState) => 50 + (s.playback.progress * 20),
            fillColor: { red: 255, green: 0, blue: 0 }
        });

        // Example 2: Deep Resolution (Granular)
        const granularProps = ({
            type: ELEMENT_TYPES.BOX,
            position: {
                x: (_s: SceneState) => 100, // Prefixed with _ to satisfy unused variable check
                y: 0,
                z: 0
            },
            size: 10
        });

        // 1. Validate factory creation (TS6133 fix: we use 'element' below)
        const element = createRenderable(
            'test-id',
            props,
            assetLoader
        );
        const elementResolved = resolve(element, state);

        // 2. Validate standalone resolution utility
        const resolved = resolve(props, state);
        const granularResolved = resolve(granularProps, state);

        // Assertions
        expect(elementResolved.id).toBe('test-id');
        expect(resolved.size).toBe(50);

        if (resolved.fillColor) {
            expect(resolved.fillColor.red).toBe(255);
        }

        expect(granularResolved.position.x).toBe(100);
    });
});