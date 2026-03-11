import {describe, expect, it, vi} from "vitest";
import {CompositeStick, type CompositeStickConfig} from "./composite_stick";
import {createResolution, type StickModifier} from "./types";
import {createMockState} from "./mock/mock_scene_state.mock.ts";

describe("CompositeStick Decorator", () => {
    const mockStick = (id: string, val: number, priority: number = 10): StickModifier => ({
        name: `${id}`,
        active: true,
        priority: priority,
        tick: () => {},
        getStick: () => ({
            value: {
                yaw: val,
                pitch: val * 2,
                roll: val * 3,
                distance: 100,
                priority: priority
            },
            success: true,
        }),
    });

    const mockState = createMockState(
        {x: 0, y: 0, z: 0},
        {x: 0, y: 0, z: 100},
    );

    describe("sum strategy", () => {
        it("should sum all active stick results", () => {
            const stick1 = mockStick("stick1", 1);
            const stick2 = mockStick("stick2", 2);
            const composite = new CompositeStick(50, [stick1, stick2], {
                strategy: 'sum'
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.yaw).toBe(3);    // 1 + 2
                expect(res.value.pitch).toBe(6);   // 2 + 4
                expect(res.value.roll).toBe(9);    // 3 + 6
            }
        });

        it("should skip inactive modifiers in sum", () => {
            const stick1 = mockStick("stick1", 1);
            stick1.active = false;
            const stick2 = mockStick("stick2", 2);
            const composite = new CompositeStick(50, [stick1, stick2], {
                strategy: 'sum'
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.yaw).toBe(2);    // Only stick2
            }
        });
    });

    describe("weighted_average strategy", () => {
        it("should calculate weighted average of rotations", () => {
            const stick1 = mockStick("stick1", 10);
            const stick2 = mockStick("stick2", 20);
            const composite = new CompositeStick(50, [stick1, stick2], {
                strategy: 'weighted_average',
                weights: [0.8, 0.2]
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                // (10 * 0.8 + 20 * 0.2) / 1.0 = 12
                expect(res.value.yaw).toBe(12);
                // (20 * 0.8 + 40 * 0.2) / 1.0 = 24
                expect(res.value.pitch).toBe(24);
            }
        });

        it("should handle equal weights", () => {
            const stick1 = mockStick("stick1", 10);
            const stick2 = mockStick("stick2", 20);
            const composite = new CompositeStick(50, [stick1, stick2], {
                strategy: 'weighted_average',
                weights: [0.5, 0.5]
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.yaw).toBe(15);  // (10 + 20) / 2
            }
        });
    });

    describe("distance strategies", () => {
        it("should use average distance by default", () => {
            const stick1: StickModifier = {
                name: "stick1",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: 1, pitch: 1, roll: 1, distance: 100, priority: 10},
                    success: true,
                }),
            };
            const stick2: StickModifier = {
                name: "stick2",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: 1, pitch: 1, roll: 1, distance: 200, priority: 10},
                    success: true,
                }),
            };
            const composite = new CompositeStick(50, [stick1, stick2], {
                strategy: 'sum'
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.distance).toBe(150);  // (100 + 200) / 2
            }
        });

        it("should use min distance when specified", () => {
            const stick1: StickModifier = {
                name: "stick1",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: 1, pitch: 1, roll: 1, distance: 100, priority: 10},
                    success: true,
                }),
            };
            const stick2: StickModifier = {
                name: "stick2",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: 1, pitch: 1, roll: 1, distance: 200, priority: 10},
                    success: true,
                }),
            };
            const composite = new CompositeStick(50, [stick1, stick2], {
                strategy: 'sum',
                distanceStrategy: 'min'
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.distance).toBe(100);
            }
        });

        it("should use max distance when specified", () => {
            const stick1: StickModifier = {
                name: "stick1",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: 1, pitch: 1, roll: 1, distance: 100, priority: 10},
                    success: true,
                }),
            };
            const stick2: StickModifier = {
                name: "stick2",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: 1, pitch: 1, roll: 1, distance: 200, priority: 10},
                    success: true,
                }),
            };
            const composite = new CompositeStick(50, [stick1, stick2], {
                strategy: 'sum',
                distanceStrategy: 'max'
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.distance).toBe(200);
            }
        });
    });

    describe("rotation limits", () => {
        it("should clamp yaw within limits", () => {
            const stick1 = mockStick("stick1", 100);
            const composite = new CompositeStick(50, [stick1], {
                strategy: 'sum',
                limits: {
                    yaw: {min: -10, max: 10},
                    pitch: {min: -Math.PI, max: Math.PI},
                    roll: {min: -Math.PI, max: Math.PI}
                }
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.yaw).toBe(10);  // clamped to max
            }
        });

        it("should clamp pitch within limits", () => {
            const stick1 = mockStick("stick1", 100);
            const composite = new CompositeStick(50, [stick1], {
                strategy: 'sum',
                limits: {
                    yaw: {min: -Math.PI, max: Math.PI},
                    pitch: {min: -5, max: 5},
                    roll: {min: -Math.PI, max: Math.PI}
                }
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.pitch).toBe(5);  // clamped to max (100 * 2 = 200, clamped to 5)
            }
        });

        it("should clamp negative values within limits", () => {
            const stick1: StickModifier = {
                name: "stick1",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: -100, pitch: -100, roll: -100, distance: 100, priority: 10},
                    success: true,
                }),
            };
            const composite = new CompositeStick(50, [stick1], {
                strategy: 'sum',
                limits: {
                    yaw: {min: -10, max: 10},
                    pitch: {min: -5, max: 5},
                    roll: {min: -3, max: 3}
                }
            });

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.yaw).toBe(-10);
                expect(res.value.pitch).toBe(-5);
                expect(res.value.roll).toBe(-3);
            }
        });
    });

    describe("error handling", () => {
        it("should return error when all sources fail", () => {
            const failing: StickModifier = {
                name: "failing",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({success: false, error: "Hardware disconnected"}),
            };
            const composite = new CompositeStick(50, [failing], {strategy: 'sum'});

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(false);
            if (!res.success) {
                expect(res.error).toContain("No active stick sources");
            }
        });

        it("should return error when all sources are inactive", () => {
            const inactive: StickModifier = {
                name: "inactive",
                active: false,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: 1, pitch: 1, roll: 1, distance: 100, priority: 10},
                    success: true,
                }),
            };
            const composite = new CompositeStick(50, [inactive], {strategy: 'sum'});

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(false);
        });

        it("should skip failing sources and use successful ones", () => {
            const failing: StickModifier = {
                name: "failing",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({success: false, error: "Fail"}),
            };
            const stick2 = mockStick("stick2", 5);
            const composite = new CompositeStick(50, [failing, stick2], {strategy: 'sum'});

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.yaw).toBe(5);
            }
        });
    });

    describe("tick", () => {
        it("should call tick on all sources", () => {
            const tickMock1 = vi.fn();
            const tickMock2 = vi.fn();

            const stick1: StickModifier = {
                name: "stick1",
                active: true,
                priority: 10,
                tick: tickMock1,
                getStick: () => ({success: true, value: {yaw: 1, pitch: 1, roll: 1, distance: 100, priority: 10}}),
            };
            const stick2: StickModifier = {
                name: "stick2",
                active: true,
                priority: 10,
                tick: tickMock2,
                getStick: () => ({success: true, value: {yaw: 1, pitch: 1, roll: 1, distance: 100, priority: 10}}),
            };

            const composite = new CompositeStick(50, [stick1, stick2], {strategy: 'sum'});
            composite.tick(123);

            expect(tickMock1).toHaveBeenCalledWith(123);
            expect(tickMock2).toHaveBeenCalledWith(123);
        });

        it("should call tick on inactive sources too", () => {
            const tickMock1 = vi.fn();
            const tickMock2 = vi.fn();

            const stick1: StickModifier = {
                name: "stick1",
                active: false,
                priority: 10,
                tick: tickMock1,
                getStick: () => ({success: true, value: {yaw: 1, pitch: 1, roll: 1, distance: 100, priority: 10}}),
            };
            const stick2: StickModifier = {
                name: "stick2",
                active: false,
                priority: 10,
                tick: tickMock2,
                getStick: () => ({success: true, value: {yaw: 1, pitch: 1, roll: 1, distance: 100, priority: 10}}),
            };

            const composite = new CompositeStick(50, [stick1, stick2], {strategy: 'sum'});
            composite.tick(456);

            expect(tickMock1).toHaveBeenCalledWith(456);
            expect(tickMock2).toHaveBeenCalledWith(456);
        });
    });

    describe("name generation", () => {
        it("should generate correct name from sources", () => {
            const stick1 = mockStick("a", 1);
            const stick2 = mockStick("b", 2);
            const composite = new CompositeStick(50, [stick1, stick2], {strategy: 'sum'});

            expect(composite.name).toBe("CompositeStick(a+b)");
        });

        it("should handle single source", () => {
            const stick = mockStick("solo", 1);
            const composite = new CompositeStick(50, [stick], {strategy: 'sum'});

            expect(composite.name).toBe("CompositeStick(solo)");
        });
    });

    describe("priority", () => {
        it("should use wrapper priority in result", () => {
            const stick1 = mockStick("stick1", 1, 5);
            const composite = new CompositeStick(99, [stick1], {strategy: 'sum'});

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.priority).toBe(99);
            }
        });
    });

    describe("default config", () => {
        it("should use sum strategy by default", () => {
            const stick1 = mockStick("stick1", 1);
            const stick2 = mockStick("stick2", 2);
            const composite = new CompositeStick(50, [stick1, stick2]);

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.yaw).toBe(3);  // sum
            }
        });
    });

    describe("unknown strategy fallback", () => {
        it("should fall back to sum for unknown strategies", () => {
            const stick1 = mockStick("stick1", 1);
            const stick2 = mockStick("stick2", 2);
            const config: CompositeStickConfig = {
                strategy: 'unknown_strategy' as any,
            };
            const composite = new CompositeStick(50, [stick1, stick2], config);

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.yaw).toBe(3);  // falls back to sum
            }
        });

        it("should fall back to average for unknown distance strategies", () => {
            const stick1: StickModifier = {
                name: "stick1",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: 1, pitch: 1, roll: 1, distance: 100, priority: 10},
                    success: true,
                }),
            };
            const stick2: StickModifier = {
                name: "stick2",
                active: true,
                priority: 10,
                tick: () => {},
                getStick: () => ({
                    value: {yaw: 1, pitch: 1, roll: 1, distance: 200, priority: 10},
                    success: true,
                }),
            };
            const config: CompositeStickConfig = {
                strategy: 'sum',
                distanceStrategy: 'unknown' as any,
            };
            const composite = new CompositeStick(50, [stick1, stick2], config);

            const res = composite.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.value.distance).toBe(100);  // falls back to first result
            }
        });
    });
});
