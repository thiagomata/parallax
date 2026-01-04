import {describe, expect, it} from "vitest";

import {
    type CarModifier,
    DEFAULT_SETTINGS,
    type NudgeModifier, type SceneCameraState,
    type ScenePlaybackState, type SceneSettings, type SceneState,
    type StickModifier,
    type Vector3,
} from "./types";

import {SceneManager} from "./scene_manager.ts";

const mockCar = (id: string, priority: number, pos: Vector3): CarModifier => ({
    name: `MockCar_${id}`,
    active: true,
    priority,
    getCarPosition: () => ({
        value: {
            name: `Position_${id}`,
            position: pos
        },
        success: true
    }),
});

const mockNudge = (val: Partial<Vector3>, active: boolean = true): NudgeModifier => ({
    name: `MockNudge_${JSON.stringify(val)}`,
    active: active,
    getNudge: () => (
        {
            value: val,
            success: true
        }
    ),
});

const createMockSettings = (pos: Vector3 = { x: 0, y: 0, z: 0 }): SceneSettings => ({
    ...DEFAULT_SETTINGS,
    camera: { ...DEFAULT_SETTINGS.camera, position: pos }
});

const mockStick = (
    name: string,
    priority: number,
    yaw: number,
    active: boolean = true
): StickModifier => ({
    name,
    active,
    priority,
    getStick: () => ({
        value: {
            name,
            yaw,
            pitch: 0,
            distance: 10,
            priority
        },
        success: true
    }),
});

let mockState = {
    settings: DEFAULT_SETTINGS,
    playback: {
        now: Date.now(),
        delta: 0,
        progress: 0,
        frameCount: 60
    } as ScenePlaybackState,
    camera: {
        position: {x: 0, y: 0, z: 0},
        lookAt: {x: 0, y: 0, z: 100},
        yaw: 0,
        pitch: 0,
        direction: {x: 0, y: 0, z: 1},
    } as SceneCameraState
} as SceneState;


describe("PortalSceneManager - Stage 1 (Car)", () => {

    it("should pick the highest priority car", () => {
        const manager = new SceneManager(mockState.settings);
        manager
            .addCarModifier(mockCar("low", 0, {x: 10, y: 11, z: 12}))
            .addCarModifier(mockCar("high", 100, {x: 50, y: 51, z: 52}));

        const state = manager.calculateScene(1000, 10, 60, mockState);
        expect(state.camera.position.x).toBe(50);
        expect(state.camera.position.y).toBe(51);
        expect(state.camera.position.z).toBe(52);
    });

    it("should fall back to lower priority if the highest fails with an error", () => {
        const manager = new SceneManager(DEFAULT_SETTINGS);

        const failingHigh: CarModifier = {
            name: "FailingHigh",
            active: true,
            priority: 100,
            getCarPosition: () => ({
                success: false,
                error: "Sensor Failure"
            }),
        };

        manager
            .addCarModifier(failingHigh)
            .addCarModifier(mockCar("fallback", 50, {x: 20, y: 21, z: 22}));

        const state = manager.calculateScene(1000, 10, 60, mockState);
        expect(state.camera.position.x).toBe(20);
        expect(state.camera.position.y).toBe(21);
        expect(state.camera.position.z).toBe(22);
    });

    it("should completely ignore inactive modifiers", () => {
        const manager = new SceneManager(DEFAULT_SETTINGS);

        const inactiveCar = mockCar("high", 100, {x: 50, y: 50, z: 50});
        inactiveCar.active = false; // The switch is off

        const activeCar = mockCar("low", 0, {x: 10, y: 10, z: 10});

        manager
            .addCarModifier(inactiveCar)
            .addCarModifier(activeCar);

        const state = manager.calculateScene(1000, 10, 60, mockState);

        // Should pick the priority zero car because the priority 100 one is inactive
        expect(state.camera.position.x).toBe(10);
    });

    it("should return initialCam and default orientation when no modifiers exist", () => {
        const initial = {x: 1, y: 2, z: 3};
        const manager = new SceneManager(createMockSettings(initial)).setStickDistance(200);

        const state = manager.calculateScene(1000, 10, 60, mockState);

        expect(state.camera.position).toEqual(initial);
        // Default lookAt should be forward from the camera (Z - stick distance)
        expect(state.camera.lookAt.z).toBe(initial.z - 200);
    });

    it("should pick the first one added if priorities are tied", () => {
        const manager = new SceneManager(DEFAULT_SETTINGS);

        manager
            .addCarModifier(mockCar("first", 10, {x: 1, y: 11, z: 111}))
            .addCarModifier(mockCar("second", 10, {x: 2, y: 22, z: 222}));

        const state = manager.calculateScene(1000, 10, 60, mockState);
        // Depending on how you want your engine to behave:
        expect(state.camera.position.x).toBe(1);
        expect(state.camera.position.y).toBe(11);
        expect(state.camera.position.z).toBe(111);
    });

    it("should return to initial defaults if all active modifiers return errors", () => {
        const initial = {x: 500, y: 500, z: 500};
        const manager = new SceneManager(createMockSettings(initial));

        const brokenCar: CarModifier = {
            name: "BrokenCar",
            active: true,
            priority: 999,
            getCarPosition: () => ({
                success: false,
                error: "Critical Error"
            }),
        };

        const brokenStick: StickModifier = {
            name: "BrokenStick",
            active: true,
            priority: 999,
            getStick: () => ({
                success: false,
                error: "Math Overflow"
            }),
        };

        manager.addCarModifier(brokenCar);
        manager.addStickModifier(brokenStick);

        const state = manager.calculateScene(1000, 10, 60, mockState);

        // 1. Camera should stay at initialCam
        expect(state.camera.position).toEqual(initial);

        // 2. LookAt should default to 1000 units in front of initialCam (Z-1000)
        // Based on the default StickResult: { yaw: 0, pitch: 0, distance: 1000 }
        expect(state.camera.lookAt.z).toBe(initial.z - 1000);
    });
});

describe("PortalSceneManager - Stage 2 (Nudge)", () => {
    it("should set all dimensions", () => {
        const manager = new SceneManager(createMockSettings());
        manager.setDebug(true);
        manager.addNudgeModifier(
            mockNudge({x: 100, y: 200, z: 300})
        );
        const state = manager.calculateScene(1000, 10, 60, mockState);
        expect(state.camera.position.x).toBe(100);
        expect(state.camera.position.y).toBe(200);
        expect(state.camera.position.z).toBe(300);
        expect(state.debugStateLog?.nudges[0]?.x).toBe(100);
        expect(state.debugStateLog?.nudges[0]?.y).toBe(200);
        expect(state.debugStateLog?.nudges[0]?.z).toBe(300);
        expect(state.debugStateLog?.nudges[0]?.name).toBe("MockNudge_{\"x\":100,\"y\":200,\"z\":300}")
    });

    it("should average dimensions independently and not dilute missing axes", () => {
        const manager = new SceneManager(createMockSettings());

        manager
            .addNudgeModifier(mockNudge({x: 10})) // Only votes for X
            .addNudgeModifier(mockNudge({x: 20})) // Only votes for X
            .addNudgeModifier(mockNudge({y: 100})) // Only votes for Y
            .addNudgeModifier(mockNudge({z: 100}, false)); // Ignore non active

        const state = manager.calculateScene(1000, 10, 60, mockState);

        // X should be the average of 10 and 20 = 15
        expect(state.camera.position.x).toBe(15);
        // Y should be 100 (not 100/3 or 100/2, because only one modifier voted)
        expect(state.camera.position.y).toBe(100);
        // Z should remain at initial 0
        expect(state.camera.position.z).toBe(0);
    });
});

describe("PortalSceneManager - Stage 3 (Stick)", () => {
    it("should project lookAt correctly based on yaw/pitch", () => {
        const manager = new SceneManager(createMockSettings());

        const forwardStick: StickModifier = {
            name: "ForwardStick",
            active: true,
            priority: 1,
            getStick: () => ({
                value: {name: "ForwardStick", yaw: 0, pitch: 0, distance: 10, priority: 1},
                success: true
            }),
        };

        manager.addStickModifier(forwardStick);
        const state = manager.calculateScene(1000, 10, 60, mockState);

        // With yaw zero and pitch zero, looking down -Z axis
        expect(state.camera.lookAt.z).toBeCloseTo(-10);
        expect(state.camera.lookAt.x).toBe(0);
    });
});

describe("PortalSceneManager - calculateLookAt Math", () => {
    const manager = new SceneManager(createMockSettings({x: 0, y: 0, z: 0}));
    const origin = {x: 0, y: 0, z: 0};
    const DIST = 10;

    it("should look straight forward (Yaw: 0, Pitch: 0)", () => {
        // Expected: {x: 0, y: 0, z: -10}
        const result = manager.calculateLookAt(origin, {
            yaw: 0,
            pitch: 0,
            distance: DIST,
            priority: 0,
        });
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(0);
        expect(result.z).toBeCloseTo(-10);
    });

    it("should look straight Right (Yaw: PI/2, Pitch: 0)", () => {
        // Expected: {x: 10, y: 0, z: 0}
        const result = manager.calculateLookAt(origin, {
            yaw: Math.PI / 2,
            pitch: 0,
            distance: DIST,
            priority: 0,
        });
        expect(result.x).toBeCloseTo(10);
        expect(result.y).toBeCloseTo(0);
        expect(result.z).toBeCloseTo(0);
    });

    it("should look straight Up (Yaw: 0, Pitch: PI/2)", () => {
        // Expected: {x: 0, y: 10, z: 0}
        // Note: Cos(Pitch) becomes 0, which should nullify X and Z
        const result = manager.calculateLookAt(origin, {
            yaw: 0,
            pitch: Math.PI / 2,
            distance: DIST,
            priority: 0,
        });
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(10);
        expect(result.z).toBeCloseTo(0);
    });

    it("should look 45 degrees Up and Right", () => {
        const angle = Math.PI / 4; // 45 degrees
        const result = manager.calculateLookAt(origin, {
            yaw: angle,
            pitch: angle,
            distance: DIST,
            priority: 0,
        });

        // Math: y = 10 * sin(45) = 7.07
        // x = 10 * sin(45) * cos(45) = 10 * 0.707 * 0.707 = 5
        // z = -10 * cos(45) * cos(45) = -5
        expect(result.y).toBeCloseTo(7.071);
        expect(result.x).toBeCloseTo(5);
        expect(result.z).toBeCloseTo(-5);
    });
});

describe("PortalSceneManager - Debug Output", () => {
    const initial = {x: 10, y: 10, z: 10};

    it("should not include the debug property when isDebug is false", () => {
        const manager = new SceneManager(createMockSettings(initial));
        manager.setDebug(false);
        const state = manager.calculateScene(1000, 10, 60, mockState);
        expect(state.debugStateLog).toBeUndefined();
    });

    it("should capture failed car modifier in the debug log", () => {
        const manager = new SceneManager(createMockSettings(initial));
        manager.setDebug(true);

        const failingCar: CarModifier = {
            name: "FailingCar",
            active: true,
            priority: 100,
            getCarPosition: () => ({
                success: false,
                error: "Element not found"
            }),
        };

        const goodCar: CarModifier = {
            name: "GoodCar",
            active: true,
            priority: 50,
            getCarPosition: () => ({
                value: {name: "GoodCar", position: {x: 20, y: 30, z: 40}},
                success: true,
            }),
        };

        manager
            .addCarModifier(failingCar)
            .addCarModifier(goodCar);
        const state = manager.calculateScene(1000, 10, 60, mockState);

        expect(state.debugStateLog).toBeDefined();
        expect(state.debugStateLog?.errors).toHaveLength(1);
        expect(state.debugStateLog?.errors[0].name).toBe("FailingCar");
        expect(state.debugStateLog?.errors[0].message).toBe("Element not found");
        expect(state.debugStateLog?.car.name).toBe("GoodCar");
        expect(state.debugStateLog?.car.x).toBe(20);
        expect(state.debugStateLog?.car.y).toBe(30);
        expect(state.debugStateLog?.car.z).toBe(40);
        expect(state.debugStateLog?.car.priority).toBe(50);
    });

    it("should capture the winning car details in the debug log", () => {
        const manager = new SceneManager(createMockSettings(initial)).setDebug(true);

        const highPriorityCar: CarModifier = {
            name: "highPriorityCar",
            active: true,
            priority: 100,
            getCarPosition: () => ({
                value: {name: "highPriorityCar", position: {x: 50, y: 60, z: 70}},
                success: true,
            }),
        };

        manager.addCarModifier(highPriorityCar);
        const state = manager.calculateScene(1000, 10, 60, mockState);

        expect(state.debugStateLog).toBeDefined();
        expect(state.debugStateLog?.car.name).toBe("highPriorityCar");
        expect(state.debugStateLog?.car.x).toBe(50);
        expect(state.debugStateLog?.car.y).toBe(60);
        expect(state.debugStateLog?.car.z).toBe(70);
        expect(state.debugStateLog?.car.priority).toBe(100);
    });

    it("should accumulate all successful nudges in the debug audit", () => {
        const manager = new SceneManager(createMockSettings(initial));

        manager
            .addNudgeModifier({
                name: "NudgeX",
                active: true,
                getNudge: () => ({value: {x: 5}, success: true}),
            })
            .addNudgeModifier({
                name: "NudgeY",
                active: true,
                getNudge: () => ({value: {y: 20}, success: true}),
            });

        // by default, debug should be disabled and not create debug output
        expect(manager.isDebug).toBe(false);
        const stateBeforeDebug = manager.calculateScene(1000, 10, 60, mockState);
        expect(stateBeforeDebug.debugStateLog === undefined);

        // When enabled, debug should trigger the debug output
        manager.setDebug(true);
        expect(manager.isDebug).toBe(true);
        const state = manager.calculateScene(1000, 10, 60, mockState);

        expect(state.debugStateLog?.nudges).toHaveLength(2);
        expect(state.debugStateLog?.nudges[0].x).toBe(5);
        expect(state.debugStateLog?.nudges[1].y).toBe(20);

        // When disabled, debug should stop
        manager.setDebug(false);
        expect(manager.isDebug).toBe(false);
        const stateAfterDebug = manager.calculateScene(
            1000,
            10,
            122,
            mockState
        );
        expect(stateAfterDebug.debugStateLog === undefined);
    });

    it("should capture errors for failing modifiers in the debug log", () => {
        const manager = new SceneManager(createMockSettings(initial)).setDebug(true);

        const failingCar: CarModifier = {
            name: "FailingCar",
            active: true,
            priority: 100,
            getCarPosition: () => ({success: false, error: "DOM element missing"}),
        };

        manager.addCarModifier(failingCar);
        const state = manager.calculateScene(1000, 10, 60, mockState);

        expect(state.debugStateLog?.errors).toHaveLength(1);
        expect(state.debugStateLog?.errors[0].message).toBe("DOM element missing");
        // Ensure it fell back to initialCam
        expect(state.debugStateLog?.car.name).toBe("initialCam");
    });

    it("should capture failing nudge", () => {
        const manager = new SceneManager(createMockSettings(initial)).setDebug(true);

        const failingNudge: NudgeModifier = {
            name: "FailingNudge",
            active: true,
            getNudge: () => ({success: false, error: "DOM element missing"}),
        };
        manager.addNudgeModifier(failingNudge);
        const state = manager.calculateScene(1000, 10, 60, mockState);

        expect(state.debugStateLog?.errors).toHaveLength(1);
        expect(state.debugStateLog?.errors[0].message).toBe("DOM element missing");
        // Ensure it fell back to initialCam
        expect(state.debugStateLog?.car.name).toBe("initialCam");
    });
});

describe("PortalSceneManager - Multi-Stick Logic", () => {
    const initialPos = {x: 0, y: 0, z: 0};

    it("should settle on the highest priority stick and log its name", () => {
        const manager = new SceneManager(createMockSettings(initialPos)).setDebug(true);

        manager
            .addStickModifier(mockStick("Disabled", 1000, 10, false))
            .addStickModifier(mockStick("Low-Priority-Idle", 10, 0))
            .addStickModifier(mockStick("High-Priority-Override", 100, 3.14))
            .addStickModifier(mockStick("Mid-Priority-Input", 50, 1.5));

        const state = manager.calculateScene(1000, 10, 60, mockState);

        // 1. Math check: Must be the High-Priority value
        expect(state.camera.lookAt.z).toBeCloseTo(10); // Since yaw 3.14 (PI) is "backward"

        // 2. Debug check: Must identify the winner by its explicit name
        expect(state.debugStateLog?.stick.name).toBe("High-Priority-Override");
        expect(state.debugStateLog?.stick.priority).toBe(100);
    });
});

it("should log multiple errors if higher priority sticks fail", () => {
    const initialPos = {x: 0, y: 0, z: 0};

    const manager = new SceneManager(createMockSettings(initialPos));
    manager.setDebug(true);

    const broken1: StickModifier = {
        name: "Hardware-Sensor",
        active: true,
        priority: 100,
        getStick: () => ({success: false, error: "Not Connected"}),
    };

    const broken2: StickModifier = {
        name: "Software-Algorithm",
        active: true,
        priority: 80,
        getStick: () => ({success: false, error: "NaN Result"}),
    };

    const working3 = mockStick("Safe-Fallback", 10, 0.75);

    manager
        .addStickModifier(broken1)
        .addStickModifier(broken2)
        .addStickModifier(working3);

    const state = manager.calculateScene(1000, 10, 60, mockState);

    // The final state should be from the working stick
    expect(state.debugStateLog?.stick.name).toBe("Safe-Fallback");

    // The error log should contain both failures with their specific names,
    expect(state.debugStateLog?.errors).toHaveLength(2);
    expect(state.debugStateLog?.errors[0]).toEqual({
        name: "Hardware-Sensor",
        message: "Not Connected",
    });
    expect(state.debugStateLog?.errors[1]).toEqual({
        name: "Software-Algorithm",
        message: "NaN Result",
    });
});
