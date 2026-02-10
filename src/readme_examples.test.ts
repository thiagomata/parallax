import {beforeEach, describe, expect, it} from 'vitest';
import {SceneManager} from "./scene/scene_manager.ts";
import {toBlueprint, DEFAULT_SETTINGS, ELEMENT_TYPES, type ResolvedBox, type SceneState,} from "./scene/types.ts";
import {SceneResolver} from "./scene/resolver.ts";
import {ChaosLoader} from "./scene/mock/mock_asset_loader.mock.ts";

describe('README Examples Validation', () => {

    let manager: SceneManager;
    let assetLoader = new ChaosLoader();
    let resolver: SceneResolver<any, {}>;
    beforeEach(() => {
        manager = new SceneManager(DEFAULT_SETTINGS);
        resolver = new SceneResolver({});
    });

    it('should validate the Car, Nudge, and Stick modifier examples', () => {
        const playerPos = {x: 100, y: 50, z: 0};

        // Example: Car Modifier
        manager.addCarModifier({
            name: "FollowPlayer",
            priority: 10,
            active: true,
            tick: () => {},
            getCarPosition: (_current, _state) => ({
                success: true,
                value: {position: playerPos, name: "player"}
            })
        });

        // Example: Nudge Modifier
        manager.addNudgeModifier({
            name: "Breathing",
            active: true,
            tick: () => {},
            getNudge: (_base, state) => ({
                success: true,
                value: {y: Math.sin(state.playback.now * 0.002) * 15}
            })
        });

        // Example: Stick Modifier
        manager.addStickModifier({
            name: "LookAtCenter",
            active: true,
            priority: 1,
            tick: () => {},
            getStick: (camPos) => ({
                success: true,
                value: {
                    yaw: Math.atan2(-camPos.x, camPos.z),
                    pitch: 0,
                    roll: 0,
                    distance: 1000,
                    priority: 1
                }
            })
        });

        const state = manager.calculateScene(1000, 16, 60, manager.initialState());
        expect(state.projection.kind).toBe("camera");
        if(state.projection.kind !== "camera") return;

        // Validate the logic: Car should set position, Nudge should modify Y
        expect(state.projection.camera.position.x).toBe(100);
        expect(state.projection.camera.position.y).toBeCloseTo(50 + Math.sin(1000 * 0.002) * 15);
    });

    it('should validate the Recursive Spec Resolution examples', () => {
        const state = manager.initialState();

        // Example 1: Static & Computed Props
        const blueprint = toBlueprint<ResolvedBox>({
            type: ELEMENT_TYPES.BOX,
            position: {x: 0, y: 0, z: 0},
            width: (s: SceneState) => 50 + (s.playback.progress * 20),
            fillColor: {red: 255, green: 0, blue: 0}
        });

        // We must wrap the blueprint into a Renderable to "compile" the specs
        const element = resolver.prepare('test-id', blueprint, assetLoader);
        const elementResolved = resolver.resolve(element, state) as { resolved: ResolvedBox };

        // Example 2: Deep Resolution (Granular)
        const granularBlueprint = toBlueprint<ResolvedBox>({
            type: ELEMENT_TYPES.BOX,
            position: {
                x: (_s: SceneState) => 100,
                y: 0,
                z: 0
            },
            width: 10
        });

        const granularElement = resolver.prepare('granular-id', granularBlueprint, assetLoader);
        const granularResolved = resolver.resolve(granularElement, state) as { resolved: ResolvedBox };

        // Assertions
        expect(elementResolved.resolved.width).toBe(50);
        expect(elementResolved.resolved.fillColor?.red).toBe(255);
        expect(granularResolved.resolved.position.x).toBe(100);
    });
});