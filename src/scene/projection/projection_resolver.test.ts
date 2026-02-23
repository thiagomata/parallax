import { describe, it, expect } from 'vitest';
import {
    type BlueprintProjection,
    type ProjectionType, type StickModifier,
} from '../types';
import {createMockState} from "../mock/mock_scene_state.mock.ts";
import {ProjectionResolver} from "./projection_resolver.ts";
import {ProjectionAssetRegistry} from "../registry/projection_asset_registry.ts";

describe('ProjectionResolver', () => {
    const resolver = new ProjectionResolver({});
    const registry = new ProjectionAssetRegistry(resolver);
    const mockState = createMockState(
        {x: 0, y: 0, z: 0},
        {x: 0, y: 0, z: 100},
    );

    describe('prepare', () => {
        it('should wrap static properties into dynamic containers', () => {
            const blueprint = {
                id: 'test-cam',
                type: 'PLAYER' as ProjectionType,
                position: { x: 10, y: 0, z: 0 }
            };

            const dynamic = resolver.prepare(blueprint, registry);

            expect(dynamic.id).toBe('test-cam');
            // Check if it was compiled into a Static DynamicProperty
            expect((dynamic.position).kind).toBe('static');
            expect((dynamic.position as any).value.x).toBe(10);
        });
    });

    describe('resolve', () => {
        it('should derive the initial distance and project correctly', () => {
            const blueprint = {
                id: 'test-cam',
                type: 'WORLD' as ProjectionType,
                position: { x: 0, y: 0, z: 0 },
                lookAt: { x: 0, y: 0, z: 100 }, // Initial distance = 100
                rotation: { pitch: 0, yaw: 0, roll: 0 },
                carModifiers: [],
                nudgeModifiers: [],
                stickModifiers: []
            };

            const dynamic = resolver.prepare(blueprint, registry);
            const resolved = resolver.resolve(dynamic, mockState);

            expect(resolved.distance).toBe(100);
            expect(resolved.lookAt.z).toBe(100);
            expect(resolved.direction).toEqual({ x: 0, y: 0, z: 1 });
        });

        it('should accumulate position changes from Car and Nudge modifiers', () => {
            const carMod = {
                priority: 1,
                name: "test-car",
                active: true,
                tick: () => {},
                getCarPosition: () => (
                    { success: true, value: { position: { x: 50, y: 0, z: 0 }, name: "test-car" } }
                )
            };
            const nudgeMod = {
                priority: 1,
                name: "test-nudge-mod",
                active: true,
                tick: () => {},
                getNudge: () => (
                    { success: true, value: { x: 5, name: "test-nudge-mod" } }
                )
            };

            const blueprint = {
                id: 'mod-test',
                type: 'PLAYER' as ProjectionType,
                position: { x: 0, y: 0, z: 0 },
                lookAt: { x: 0, y: 0, z: 100 },
                rotation: { pitch: 0, yaw: 0, roll: 0 },
                direction: { x: 0, y: 0, z: 0 },
                modifiers: {
                    carModifiers: [carMod],
                    nudgeModifiers: [nudgeMod]
                }
            } as BlueprintProjection;

            const dynamic = resolver.prepare(blueprint, registry);
            const resolved = resolver.resolve(dynamic, mockState);

            // 50 (Car) + 5 (Nudge) = 55
            expect(resolved.position.x).toBe(55);
            // lookAt is preserved (not shifted by modifiers)
            expect(resolved.lookAt.x).toBe(0);
        });

        it('should modify rotation and distance via Stick modifiers', () => {
            const stickMod = {
                priority: 1,
                name: "test-stick",
                active: true,
                tick: () => {},
                getStick: () => ({
                    success: true,
                    value: {
                        pitch: 0, yaw: Math.PI / 2,
                        roll: 0,
                        distance: 50,
                        name: "test-stick",
                        priority: 1,
                    }
                })
            } as StickModifier;

        const blueprint = {
            id: 'stick-test',
            type: 'PLAYER' as ProjectionType,
            position: { x: 0, y: 0, z: 0 },
            lookAt: { x: 150, y: 0, z: 0 }, // Direction {x:1, z:0}, distance 150
            rotation: { pitch: 0, yaw: 0, roll: 0 },
            modifiers: {
                stickModifiers: [stickMod]
            }
        };

            const dynamic = resolver.prepare(blueprint, registry);
            const resolved = resolver.resolve(dynamic, mockState);

            // New yaw is 90 degrees, so direction should be { x: 1, y: 0, z: 0 }
            expect(resolved.direction.x).toBeCloseTo(1);
            expect(resolved.direction.z).toBeCloseTo(0);

            // Final distance: 100 (initial) + 50 (stick) = 150
            expect(resolved.distance).toBe(150);
            expect(resolved.lookAt.x).toBeCloseTo(150);
        });
    });

    // describe('calculateDirection', () => {
    //     it('should return a normalized vector pointing forward for zero rotation', () => {
    //         const rot = { pitch: 0, yaw: 0, roll: 0 };
    //         // @ts-ignore - accessing private for unit test
    //         const dir = resolver.calculateDirection(rot);
    //         expect(dir).toEqual({ x: 0, y: 0, z: 1 });
    //     });
    //
    //     it('should correctly handle YXZ rotation math', () => {
    //         const rot = { pitch: Math.PI / 4, yaw: Math.PI / 4, roll: 0 };
    //         // @ts-ignore
    //         const dir = resolver.calculateDirection(rot);
    //
    //         // X: sin(45) * cos(45) = 0.5
    //         // Y: sin(-45) = -0.707
    //         // Z: cos(45) * cos(45) = 0.5
    //         expect(dir.x).toBeCloseTo(0.5);
    //         expect(dir.y).toBeCloseTo(-0.707);
    //         expect(dir.z).toBeCloseTo(0.5);
    //     });
    // });
});