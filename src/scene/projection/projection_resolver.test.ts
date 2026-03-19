import {describe, it, expect, beforeEach} from "vitest";
import {ProjectionResolver} from "./projection_resolver";
import {ProjectionAssetRegistry} from "../registry/projection_asset_registry";
import {
    PROJECTION_TYPES,
    LOOK_MODES,
    type DynamicProjection,
    type BlueprintProjection,
    type StickModifier,
    type CarModifier,
    type NudgeModifier,
    type ResolvedProjection,
    type DynamicSceneState,
    DEFAULT_WINDOW_CONFIG,
    WindowConfig,
} from "../types";

const createMockEffectLib = () => ({});

describe("ProjectionResolver", () => {
    let resolver: ProjectionResolver<any>;
    let registry: ProjectionAssetRegistry<any>;

    beforeEach(() => {
        resolver = new ProjectionResolver(createMockEffectLib());
        registry = new ProjectionAssetRegistry(resolver);
    });

    describe("prepare", () => {
        it("should create dynamic projection from blueprint", () => {
            const blueprint: BlueprintProjection = {
                id: "test",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.LOOK_AT,
                position: {x: 0, y: 0, z: 100},
                lookAt: {x: 0, y: 0, z: 0},
                direction: {x: 0, y: 0, z: 1},
            };

            const result = resolver.prepare(blueprint, registry);

            expect(result.id).toBe("test");
            expect(result.type).toBe(PROJECTION_TYPES.SCREEN);
        });

        it("should throw error for self-referencing projection", () => {
            const blueprint: BlueprintProjection = {
                id: "self",
                type: PROJECTION_TYPES.SCREEN,
                targetId: "self",
                lookMode: LOOK_MODES.LOOK_AT,
                position: {x: 0, y: 0, z: 100},
                lookAt: {x: 0, y: 0, z: 0},
                direction: {x: 0, y: 0, z: 1},
            };

            expect(() => resolver.prepare(blueprint, registry)).toThrow(
                'Self-Reference: Projection "self" cannot target itself.'
            );
        });

        it("should throw error for missing target", () => {
            const blueprint: BlueprintProjection = {
                id: "child",
                type: PROJECTION_TYPES.SCREEN,
                targetId: "nonexistent",
                lookMode: LOOK_MODES.LOOK_AT,
                position: {x: 0, y: 0, z: 100},
                lookAt: {x: 0, y: 0, z: 0},
                direction: {x: 0, y: 0, z: 1},
            };

            expect(() => resolver.prepare(blueprint, registry)).toThrow(
                'Hierarchy Violation: Target "nonexistent" not found.'
            );
        });

        it("should throw error for recursive hierarchy references", () => {
            registry.register({
                id: "b",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.LOOK_AT,
                position: {x: 0, y: 0, z: 0},
                lookAt: {x: 0, y: 0, z: 0},
                direction: {x: 0, y: 0, z: 1},
            });

            registry.register({
                id: "a",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.LOOK_AT,
                targetId: "b",
                position: {x: 0, y: 0, z: 0},
                lookAt: {x: 0, y: 0, z: 0},
                direction: {x: 0, y: 0, z: 1},
            });

            expect(() =>
                resolver.prepare(
                    {
                        id: "b",
                        type: PROJECTION_TYPES.SCREEN,
                        lookMode: LOOK_MODES.LOOK_AT,
                        targetId: "a",
                        position: {x: 0, y: 0, z: 0},
                        lookAt: {x: 0, y: 0, z: 0},
                        direction: {x: 0, y: 0, z: 1},
                    },
                    registry
                )
            ).toThrow('Hierarchy Violation: Target "a" has recursive reference.');
        });

        it("should throw error for invalid projection effect type", () => {
            const blueprint: BlueprintProjection = {
                id: "with-effect",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.LOOK_AT,
                position: {x: 0, y: 0, z: 0},
                lookAt: {x: 0, y: 0, z: 0},
                direction: {x: 0, y: 0, z: 1},
                effects: [{type: "missing-effect" as any, settings: {}} as any],
            };

            expect(() => resolver.prepare(blueprint, registry)).toThrow("Invalid projection effect: missing-effect");
        });

        it("should sort modifiers by priority descending", () => {
            const lowPriority: StickModifier = {
                name: "low",
                priority: 10,
                active: true,
                tick: () => {},
                getStick: () => ({success: false, error: "test"}),
            };
            const highPriority: StickModifier = {
                name: "high",
                priority: 100,
                active: true,
                tick: () => {},
                getStick: () => ({success: false, error: "test"}),
            };

            const blueprint: BlueprintProjection = {
                id: "test",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.ROTATION,
                position: {x: 0, y: 0, z: 100},
                rotation: {pitch: 0, yaw: 0, roll: 0},
                direction: {x: 0, y: 0, z: 1},
                modifiers: {
                    stickModifiers: [lowPriority, highPriority],
                },
            };

            const result = resolver.prepare(blueprint, registry);

            expect(result.modifiers?.stickModifiers?.[0]?.name).toBe("high");
            expect(result.modifiers?.stickModifiers?.[1]?.name).toBe("low");
        });
    });

    describe("resolve", () => {
        const createMockState = (): DynamicSceneState => ({
            sceneId: 1,
            settings: {
                window: WindowConfig.create(DEFAULT_WINDOW_CONFIG),
                playback: {
                    isLoop: true,
                    timeSpeed: 1,
                    startTime: 0,
                },
                debug: false,
                alpha: 1,
                startPaused: false,
            },
            playback: {
                now: 0,
                delta: 16,
                progress: 0,
                frameCount: 1,
            },
            projections: new Map(),
            previousResolved: null,
        });

        it("should resolve lookAt mode projection", () => {
            const dynamic: DynamicProjection = {
                id: "test",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.LOOK_AT,
                position: {kind: "static", value: {x: 0, y: 0, z: 100}},
                rotation: {kind: "static", value: {pitch: 0, yaw: 0, roll: 0}},
                lookAt: {kind: "static", value: {x: 0, y: 0, z: 0}},
                direction: {kind: "static", value: {x: 0, y: 0, z: 1}},
                distance: {kind: "static", value: 100},
                modifiers: {
                    carModifiers: [],
                    nudgeModifiers: [],
                    stickModifiers: [],
                },
                effects: [],
            };

            const result = resolver.resolve(dynamic, createMockState());

            expect(result.position).toEqual({x: 0, y: 0, z: 100});
            expect(result.lookAt).toEqual({x: 0, y: 0, z: 0});
            expect(result.distance).toBe(100);
        });

        it("should resolve rotation mode projection", () => {
            const dynamic: DynamicProjection = {
                id: "test",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.ROTATION,
                position: {kind: "static", value: {x: 0, y: 0, z: 100}},
                rotation: {kind: "static", value: {pitch: 0, yaw: 0, roll: 0}},
                lookAt: {kind: "static", value: {x: 0, y: 0, z: 0}},
                direction: {kind: "static", value: {x: 0, y: 0, z: 1}},
                distance: {kind: "static", value: 100},
                modifiers: {
                    carModifiers: [],
                    nudgeModifiers: [],
                    stickModifiers: [],
                },
                effects: [],
            };

            const result = resolver.resolve(dynamic, createMockState());

            expect(result.direction).toBeDefined();
            expect(result.distance).toBeDefined();
        });

        it("should apply car modifier that succeeds", () => {
            const mockCarModifier: CarModifier = {
                name: "testCar",
                priority: 10,
                active: true,
                requiredDataProviders: [],
                tick: () => {},
                getCarPosition: () => ({
                    success: true,
                    value: {name: "test", position: {x: 10, y: 20, z: 30}},
                }),
            };

            const dynamic: DynamicProjection = {
                id: "test",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.LOOK_AT,
                position: {kind: "static", value: {x: 0, y: 0, z: 100}},
                rotation: {kind: "static", value: {pitch: 0, yaw: 0, roll: 0}},
                lookAt: {kind: "static", value: {x: 0, y: 0, z: 0}},
                direction: {kind: "static", value: {x: 0, y: 0, z: 1}},
                distance: {kind: "static", value: 100},
                modifiers: {
                    carModifiers: [mockCarModifier],
                    nudgeModifiers: [],
                    stickModifiers: [],
                },
                effects: [],
            };

            const result = resolver.resolve(dynamic, createMockState());

            expect(result.position).toEqual({x: 10, y: 20, z: 30});
        });

        it("should apply stick modifier that succeeds", () => {
            const mockStickModifier: StickModifier = {
                name: "testStick",
                priority: 10,
                active: true,
                requiredDataProviders: [],
                tick: () => {},
                getStick: () => ({
                    success: true,
                    value: {yaw: 0.5, pitch: 0.3, roll: 0.1, distance: 500, priority: 10},
                }),
            };

            const dynamic: DynamicProjection = {
                id: "test",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.ROTATION,
                position: {kind: "static", value: {x: 0, y: 0, z: 100}},
                rotation: {kind: "static", value: {pitch: 0, yaw: 0, roll: 0}},
                lookAt: {kind: "static", value: {x: 0, y: 0, z: 0}},
                direction: {kind: "static", value: {x: 0, y: 0, z: 1}},
                distance: {kind: "static", value: 100},
                modifiers: {
                    carModifiers: [],
                    nudgeModifiers: [],
                    stickModifiers: [mockStickModifier],
                },
                effects: [],
            };

            const result = resolver.resolve(dynamic, createMockState());

            expect(result.rotation.yaw).toBeDefined();
        });

        it("should apply nudge modifiers", () => {
            const mockNudgeModifier: NudgeModifier = {
                name: "testNudge",
                active: true,
                requiredDataProviders: [],
                tick: () => {},
                getNudge: () => ({
                    success: true,
                    value: {x: 5, y: 10},
                }),
            };

            const dynamic: DynamicProjection = {
                id: "test",
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.LOOK_AT,
                position: {kind: "static", value: {x: 0, y: 0, z: 100}},
                rotation: {kind: "static", value: {pitch: 0, yaw: 0, roll: 0}},
                lookAt: {kind: "static", value: {x: 0, y: 0, z: 0}},
                direction: {kind: "static", value: {x: 0, y: 0, z: 1}},
                distance: {kind: "static", value: 100},
                modifiers: {
                    carModifiers: [],
                    nudgeModifiers: [mockNudgeModifier],
                    stickModifiers: [],
                },
                effects: [],
            };

            const result = resolver.resolve(dynamic, createMockState());

            expect(result.position.x).toBe(5);
            expect(result.position.y).toBe(10);
        });
    });

    describe("applyHierarchyTransform", () => {
        it("should return resolved if no targetId", () => {
            const resolved: ResolvedProjection = {
                id: "test",
                type: PROJECTION_TYPES.SCREEN,
                position: {x: 10, y: 20, z: 30},
                rotation: {pitch: 0, yaw: 0, roll: 0},
                direction: {x: 0, y: 0, z: 1},
                lookAt: {x: 0, y: 0, z: 0},
                distance: 100,
                effects: [],
            };

            const result = resolver.applyHierarchyTransform(resolved, {}, null);

            expect(result.position).toEqual({x: 10, y: 20, z: 30});
        });

        it("should transform position when target exists in pool", () => {
            const parent: ResolvedProjection = {
                id: "parent",
                type: PROJECTION_TYPES.SCREEN,
                position: {x: 100, y: 200, z: 300},
                rotation: {pitch: 0, yaw: 0, roll: 0},
                direction: {x: 0, y: 0, z: 1},
                lookAt: {x: 0, y: 0, z: 0},
                distance: 100,
                effects: [],
            };

            const resolved: ResolvedProjection = {
                id: "child",
                type: PROJECTION_TYPES.SCREEN,
                targetId: "parent",
                position: {x: 10, y: 20, z: 30},
                rotation: {pitch: 0.1, yaw: 0.2, roll: 0.05},
                direction: {x: 0, y: 0, z: 1},
                lookAt: {x: 0, y: 0, z: 0},
                distance: 100,
                effects: [],
            };

            const pool = {parent};

            const result = resolver.applyHierarchyTransform(resolved, pool, null);

            expect(result.position.x).not.toBe(10);
            expect(result.rotation.yaw).toBe(0.2);
        });

        it("should use previousResolved when parent is not in the current pool", () => {
            const parent: ResolvedProjection = {
                id: "parent",
                type: PROJECTION_TYPES.SCREEN,
                position: {x: 100, y: 200, z: 300},
                rotation: {pitch: 0, yaw: 0, roll: 0},
                direction: {x: 0, y: 0, z: 1},
                lookAt: {x: 0, y: 0, z: 0},
                distance: 100,
                effects: [],
            };

            const child: ResolvedProjection = {
                id: "child",
                type: PROJECTION_TYPES.SCREEN,
                targetId: "parent",
                position: {x: 10, y: 20, z: 30},
                rotation: {pitch: 0, yaw: 0, roll: 0},
                direction: {x: 0, y: 0, z: 1},
                lookAt: {x: 0, y: 0, z: 0},
                distance: 100,
                effects: [],
            };

            const previousResolved = {
                projections: new Map([["parent", parent]]),
            } as any;

            const result = resolver.applyHierarchyTransform(child, {}, previousResolved);
            expect(result.position).toEqual({x: 110, y: 220, z: 330});
        });
    });

    describe("apply", () => {
        const createMockState = (): DynamicSceneState => ({
            sceneId: 1,
            settings: {
                window: WindowConfig.create(DEFAULT_WINDOW_CONFIG),
                playback: {
                    isLoop: true,
                    timeSpeed: 1,
                    startTime: 0,
                },
                debug: false,
                alpha: 1,
                startPaused: false,
            },
            playback: {
                now: 0,
                delta: 16,
                progress: 0,
                frameCount: 1,
            },
            projections: new Map(),
            previousResolved: null,
        });

        it("should return resolved projection unchanged when no effects", () => {
            const resolved: ResolvedProjection = {
                id: "test",
                type: PROJECTION_TYPES.SCREEN,
                position: {x: 0, y: 0, z: 100},
                rotation: {pitch: 0, yaw: 0, roll: 0},
                direction: {x: 0, y: 0, z: 1},
                lookAt: {x: 0, y: 0, z: 0},
                distance: 100,
                effects: [],
            };

            const result = resolver.apply(resolved, createMockState(), {});

            expect(result.id).toBe("test");
        });
    });
});
