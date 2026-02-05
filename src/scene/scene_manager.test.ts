import {describe, expect, it} from "vitest";

import {
    type CarModifier,
    DEFAULT_SETTINGS,
    MatrixToArray,
    type NudgeModifier,
    type SceneSettings,
    type StickModifier,
    type Vector3,
} from "./types";
import { ScreenModifier, ScreenConfig } from "./modifiers/screen_modifier.ts";

import {SceneManager} from "./scene_manager.ts";
import {createMockState} from "./mock/mock_scene_state.mock.ts";

const mockCar = (id: string, priority: number, pos: Vector3): CarModifier => ({
    name: `MockCar_${id}`,
    active: true,
    priority,
    tick: () => {},
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
    tick: () => {},
    getNudge: () => (
        {
            value: val,
            success: true
        }
    ),
});

const createMockSettings = (pos: Vector3 = {x: 0, y: 0, z: 0}): SceneSettings => ({
    ...DEFAULT_SETTINGS,
    camera: {...DEFAULT_SETTINGS.camera, position: pos}
});

const mockStick = (
    name: string,
    priority: number,
    yaw: number,
    active: boolean = true,
    roll: number = 0,
): StickModifier => ({
    name,
    active,
    priority,
    tick: () => {},
    getStick: () => ({
        value: {
            name,
            yaw,
            pitch: 0,
            roll,
            distance: 10,
            priority
        },
        success: true
    }),
});

const mockState = createMockState(
    {x: 0, y: 0, z: 0},
    {x: 0, y: 0, z: 100},
);

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
            tick: () => {},
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
            tick: () => {},
            getCarPosition: () => ({
                success: false,
                error: "Critical Error"
            }),
        };

        const brokenStick: StickModifier = {
            name: "BrokenStick",
            active: true,
            priority: 999,
            tick: () => {},
            getStick: () => ({
                success: false,
                error: "Math Overflow"
            }),
        };

        manager.addCarModifier(brokenCar);
        manager.addStickModifier(brokenStick);

        const state = manager.calculateScene(1000, 10, 60, mockState);

        // Camera should stay at initialCam
        expect(state.camera.position).toEqual(initial);

        // LookAt should default to 1000 units in front of initialCam (Z-1000)
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
        
        // Camera position should be unchanged (nudges only affect eye position per EPIC)
        expect(state.camera.position.x).toBe(0);
        expect(state.camera.position.y).toBe(0);
        expect(state.camera.position.z).toBe(0);
        
        // Debug log should still capture the nudge values
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

        // Camera position should be unchanged (nudges only affect eye position per EPIC)
        expect(state.camera.position.x).toBe(0);
        expect(state.camera.position.y).toBe(0);
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
            tick: () => {},
            getStick: () => ({
                value: {
                    name: "ForwardStick",
                    yaw: 0,
                    pitch: 0,
                    roll: 0,
                    distance: 10,
                    priority: 1
                },
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
            roll: 0,
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
            roll: 0,
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
            roll: 0,
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
            roll: angle,
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
            tick: () => {},
            getCarPosition: () => ({
                success: false,
                error: "Element not found"
            }),
        };

        const goodCar: CarModifier = {
            name: "GoodCar",
            active: true,
            priority: 50,
            tick: () => {},
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
            tick: () => {},
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
                tick: () => {},
                getNudge: () => ({value: {x: 5}, success: true}),
            })
            .addNudgeModifier({
                name: "NudgeY",
                active: true,
                tick: () => {},
                getNudge: () => ({value: {y: 20}, success: true}),
            });

        // by default, debug should be disabled and not create debug output
        expect(manager.debug).toBe(false);
        const stateBeforeDebug = manager.calculateScene(1000, 10, 60, mockState);
        expect(stateBeforeDebug.debugStateLog === undefined);

        // When enabled, debug should trigger the debug output
        manager.setDebug(true);
        expect(manager.debug).toBe(true);
        const state = manager.calculateScene(1000, 10, 60, mockState);

        expect(state.debugStateLog?.nudges).toHaveLength(2);
        expect(state.debugStateLog?.nudges[0].x).toBe(5);
        expect(state.debugStateLog?.nudges[1].y).toBe(20);

        // When disabled, debug should stop
        manager.setDebug(false);
        expect(manager.debug).toBe(false);
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
            tick: () => {},
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
            tick: () => {},
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

        // Math check: Must be the High-Priority value
        expect(state.camera.lookAt.z).toBeCloseTo(10); // Since yaw 3.14 (PI) is "backward"

        // Debug check: Must identify the winner by its explicit name
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
        tick: () => {},
        getStick: () => ({success: false, error: "Not Connected"}),
    };

    const broken2: StickModifier = {
        name: "Software-Algorithm",
        active: true,
        priority: 80,
        tick: () => {},
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

it('should completely reset spatial logic after clearModifiers', () => {
    const manager = new SceneManager();
    const initialPos = manager.initialState().camera.position;

    // Add a modifier that moves the camera far away
    manager.addCarModifier({
        name: "Wanderer",
        priority: 100,
        active: true,
        tick: () => {},
        getCarPosition: () => ({success: true, value: {position: {x: 999, y: 999, z: 999}, name: "far"}})
    });

    const stateWithModifier = manager.calculateScene(1000, 16, 60, manager.initialState());
    expect(stateWithModifier.camera.position.x).toBe(999);

    // Clear and verify we are back to baseline
    manager.clearModifiers();

    // We expect the modifiers array to be empty (Internal check if public, or via result)
    const stateAfterClear = manager.calculateScene(1000, 16, 60, manager.initialState());
    expect(stateAfterClear.camera.position).toEqual(initialPos);
});

describe("PortalSceneManager - Pause, Resume, and Debug", () => {
    it("should pause and resume scene calculation", () => {
        const manager = new SceneManager(DEFAULT_SETTINGS);
        const initialState = manager.initialState();
        
        // Add a modifier that changes position over time
        manager.addCarModifier({
            name: "MovingCar",
            priority: 100,
            active: true,
            tick: () => {},
            getCarPosition: () => ({success: true, value: {position: {x: 100, y: 200, z: 300}, name: "moving"}})
        });

        // First calculation - should not be paused (default state)
        expect(manager.isPaused()).toBe(false);
        
        // Calculate scene while playing
        const playingState = manager.calculateScene(1000, 16, 60, initialState);
        expect(playingState.camera.position.x).toBe(100);
        
        // Pause and verify
        manager.pause();
        expect(manager.isPaused()).toBe(true);
        
        // Calculate scene while paused - should return previous state
        const pausedState = manager.calculateScene(2000, 16, 60, playingState);
        expect(pausedState).toEqual(playingState);
        
        // Resume and verify
        manager.resume();
        expect(manager.isPaused()).toBe(false);
        
        // Calculate scene again - should continue from where left off
        const resumedState = manager.calculateScene(3000, 16, 60, pausedState);
        expect(resumedState.camera.position.x).toBe(100);
    });

    it("should set debug mode and return manager for chaining", () => {
        const manager = new SceneManager(DEFAULT_SETTINGS);
        
        // Test initial state
        expect(manager.isDebug()).toBe(false);
        expect(manager.debug).toBe(false);
        
        // Set debug to true and test chaining
        const result = manager.setDebug(true);
        expect(result).toBe(manager);
        expect(manager.isDebug()).toBe(true);
        expect(manager.debug).toBe(true);
        
        // Set debug to false and test chaining
        const result2 = manager.setDebug(false);
        expect(result2).toBe(manager);
        expect(manager.isDebug()).toBe(false);
        expect(manager.debug).toBe(false);
    });

    it("should include debug logs when debug is enabled", () => {
        const manager = new SceneManager(DEFAULT_SETTINGS);
        const initialState = manager.initialState();
        
        // Add modifiers for testing
        manager.addCarModifier(mockCar("test", 100, {x: 50, y: 60, z: 70}))
               .addNudgeModifier(mockNudge({x: 10, y: 20, z: 30}))
               .addStickModifier(mockStick("testStick", 50, 1.5));

        // Calculate without debug - should not have debug logs
        manager.setDebug(false);
        const stateWithoutDebug = manager.calculateScene(1000, 16, 60, initialState);
        expect(stateWithoutDebug.debugStateLog).toBeUndefined();

        // Calculate with debug - should have debug logs
        manager.setDebug(true);
        const stateWithDebug = manager.calculateScene(1000, 16, 60, initialState);
        expect(stateWithDebug.debugStateLog).toBeDefined();
        expect(stateWithDebug.debugStateLog?.car.name).toBe("Position_test");
        expect(stateWithDebug.debugStateLog?.nudges).toHaveLength(1);
        expect(stateWithDebug.debugStateLog?.stick.name).toBe("testStick");
    });

    it("should respect initial settings from constructor", () => {
        const debugSettings = {...DEFAULT_SETTINGS, debug: true, paused: false};
        const manager = new SceneManager(debugSettings);
        
        expect(manager.isDebug()).toBe(true);
        expect(manager.debug).toBe(true);
        expect(manager.isPaused()).toBe(false);
        expect(manager.paused).toBe(false);
        
        const nonDebugSettings = {...DEFAULT_SETTINGS, debug: false, startPaused: true};
        const manager2 = new SceneManager(nonDebugSettings);
        
        expect(manager2.isDebug()).toBe(false);
        expect(manager2.debug).toBe(false);
        expect(manager2.isPaused()).toBe(true);
        expect(manager2.paused).toBe(true);
    });

    it("should handle pause/resume with time calculations correctly", () => {
        const manager = new SceneManager(DEFAULT_SETTINGS);
        const initialState = manager.initialState();
        
        // Resume from paused state
        manager.resume();
        
        // Calculate first scene
        const state1 = manager.calculateScene(1000, 16, 60, initialState);
        expect(state1.playback.now).toBe(1000);
        
        // Pause the scene
        manager.pause();
        const state2 = manager.calculateScene(2000, 16, 60, state1);
        // Should return the same state when paused
        expect(state2).toEqual(state1);
        
        // Resume and calculate again
        manager.resume();
        const state3 = manager.calculateScene(3000, 16, 60, state2);
        // Should adjust time to account for pause duration
        expect(state3.playback.now).toBeGreaterThan(state2.playback.now);
    });
});

describe("PortalSceneManager - ScreenModifier Integration", () => {
    const screenConfig: ScreenConfig = ScreenConfig.create({
        width: 100,
        height: 75,
        z: 0,
        near: 0.1,
        far: 1000
    });

    it("should combine world and head nudges correctly", () => {
        const manager = new SceneManager();
        const screenModifier = new ScreenModifier(screenConfig);
        manager.setScreenModifier(screenModifier);

        // Add a car modifier that moves camera to (10, 20, 30)
        const carModifier: CarModifier = {
            name: "TestCar",
            active: true,
            priority: 100,
            tick: () => {},
            getCarPosition: () => ({
                success: true,
                value: { name: "TestCar", position: { x: 10, y: 20, z: 30 } }
            })
        };

        // Add a world nudge (car shake/vibration) that adds (2, 1, 0)
        const worldNudge: NudgeModifier = {
            name: "WorldShake",
            category: 'world',
            active: true,
            tick: () => {},
            getNudge: () => ({
                success: true,
                value: { x: 2, y: 1, z: 0 }
            })
        };

        // Add a head nudge (user head tracking) that adds (5, 10, 15)
        const headNudge: NudgeModifier = {
            name: "HeadTracking",
            category: 'head',
            active: true,
            tick: () => {},
            getNudge: () => ({
                success: true,
                value: { x: 5, y: 10, z: 15 }
            })
        };

        manager.addCarModifier(carModifier);
        manager.addNudgeModifier(worldNudge);
        manager.addNudgeModifier(headNudge);

        const initialState = manager.initialState();
        const state = manager.calculateScene(1000, 16, 60, initialState);

        // Camera position should be CarModifier + world nudges
        expect(state.camera.position).toEqual({ x: 12, y: 21, z: 30 });

        // Projection matrix should be based on eye position = camera + head nudges = (17, 31, 45)
        expect(state.projectionMatrix).toBeDefined();
        
        const matrixWithWorldOnly = screenModifier.buildFrustum({ x: 12, y: 21, z: 30 });
        const matrixWithFullHybrid = screenModifier.buildFrustum({ x: 17, y: 31, z: 45 });
        
        expect(state.projectionMatrix).toEqual(matrixWithFullHybrid);
        expect(state.projectionMatrix).not.toEqual(matrixWithWorldOnly);
    });

    it("should not include projection matrix when no ScreenModifier is set", () => {
        const manager = new SceneManager();
        const initialState = manager.initialState();
        const state = manager.calculateScene(1000, 16, 60, initialState);

        expect(state.projectionMatrix).toBeUndefined();
    });

    it("should include projection matrix when ScreenModifier is set", () => {
        const manager = new SceneManager();
        const screenModifier = new ScreenModifier(screenConfig);
        manager.setScreenModifier(screenModifier);

        const initialState = manager.initialState();
        const state = manager.calculateScene(1000, 16, 60, initialState);

        expect(state.projectionMatrix).toBeDefined();
        expect(state.projectionMatrix).toHaveProperty('xScale');
        expect(state.projectionMatrix).toHaveProperty('yScale');
        expect(state.projectionMatrix).toHaveProperty('depth');
        expect(state.projectionMatrix).toHaveProperty('wComponent');
        if(state.projectionMatrix) {
            expect(MatrixToArray(state.projectionMatrix)).toBeInstanceOf(Float32Array);
            expect(MatrixToArray(state.projectionMatrix).length).toBe(16);
        }
    });

    it("should compute eye position as CarModifier + NudgeModifier", () => {
        const manager = new SceneManager();
        const screenModifier = new ScreenModifier(screenConfig);
        manager.setScreenModifier(screenModifier);

        // Add a car modifier that moves camera to (10, 20, 30)
        const carModifier: CarModifier = {
            name: "TestCar",
            active: true,
            priority: 100,
            tick: () => {},
            getCarPosition: () => ({
                success: true,
                value: { name: "TestCar", position: { x: 10, y: 20, z: 30 } }
            })
        };

        // Add a nudge modifier that adds (5, 10, 15) 
        const nudgeModifier: NudgeModifier = {
            name: "TestNudge",
            active: true,
            tick: () => {},
            getNudge: () => ({
                success: true,
                value: { x: 5, y: 10, z: 15 }
            })
        };

        manager.addCarModifier(carModifier);
        manager.addNudgeModifier(nudgeModifier);

        const initialState = manager.initialState();
        const state = manager.calculateScene(1000, 16, 60, initialState);

        // Camera position should be CarModifier result only (nudges only affect eye position per EPIC)
        expect(state.camera.position).toEqual({ x: 10, y: 20, z: 30 });

        // Projection matrix should be based on eye position = camera + nudge = (15, 30, 45)
        expect(state.projectionMatrix).toBeDefined();
        
        // Verify the matrix is different from what we'd get with just the camera position
        const matrixWithOnlyCamera = screenModifier.buildFrustum({ x: 10, y: 20, z: 30 });
        const matrixWithEyeOffset = screenModifier.buildFrustum({ x: 15, y: 30, z: 45 });
        
        expect(state.projectionMatrix).toEqual(matrixWithEyeOffset);
        expect(state.projectionMatrix).not.toEqual(matrixWithOnlyCamera);
    });

    it("should clear ScreenModifier when clearModifiers is called", () => {
        const manager = new SceneManager();
        const screenModifier = new ScreenModifier(screenConfig);
        manager.setScreenModifier(screenModifier);

        expect(manager.screenModifier).toBe(screenModifier);

        manager.clearModifiers();

        expect(manager.screenModifier).toBeNull();
    });

    it("should chain setScreenModifier method", () => {
        const manager = new SceneManager();
        const screenModifier = new ScreenModifier(screenConfig);

        const result = manager.setScreenModifier(screenModifier);

        expect(result).toBe(manager);
        expect(manager.screenModifier).toBe(screenModifier);
    });

    it("should produce different projection matrices for different eye positions", () => {
        const manager = new SceneManager();
        // Update screen config to put screen in front of camera
        const screenConfig: ScreenConfig = ScreenConfig.create({
            width: 100,
            height: 75,
            z: 100, // Screen at z=100
            near: 0.1,
            far: 1000
        });
        const screenModifier = new ScreenModifier(screenConfig);
        manager.setScreenModifier(screenModifier);

        const carModifier: CarModifier = {
            name: "TestCar",
            active: true,
            priority: 100,
            tick: () => {},
            getCarPosition: () => ({
                success: true,
                value: { name: "TestCar", position: { x: 0, y: 0, z: 0 } }
            })
        };

        manager.addCarModifier(carModifier);

        const initialState = manager.initialState();

        // Test with no head tracking - eye at (0,0,0)
        const state1 = manager.calculateScene(1000, 16, 60, initialState);
        
        // Add head tracking that moves eye to (10, 0, 0)
        const nudgeModifier: NudgeModifier = {
            name: "HeadNudge",
            active: true,
            tick: () => {},
            getNudge: () => ({
                success: true,
                value: { x: 10, y: 0, z: 0 }
            })
        };
        
        manager.addNudgeModifier(nudgeModifier);
        const state2 = manager.calculateScene(2000, 16, 60, state1);

        // Projection matrices should be different and valid (no NaN)
        expect(state1.projectionMatrix).toBeDefined();
        expect(state2.projectionMatrix).toBeDefined();
        
        // Check for NaN values
        if (state1.projectionMatrix) {
            const array1 = MatrixToArray(state1.projectionMatrix);
            for (let i = 0; i < array1.length; i++) {
                expect(Number.isNaN(array1[i])).toBe(false);
            }
        }
        
        if (state2.projectionMatrix) {
            const array2 = MatrixToArray(state2.projectionMatrix);
            for (let i = 0; i < array2.length; i++) {
                expect(Number.isNaN(array2[i])).toBe(false);
            }
        }
        
        expect(state1.projectionMatrix).not.toEqual(state2.projectionMatrix);
    });
});