import { describe, it, expect } from "vitest";

import type {
  Vector3,
  CarModifier,
  NudgeModifier,
  StickModifier,
} from "./types";

import { PortalSceneManager } from "./manager";

const mockCar = (_id: string, priority: number, pos: Vector3): CarModifier => ({
  name: `MockCar_${_id}`,
  active: true,
  priority,
  getCarPosition: () => ({ value: { position: pos }, error: null }),
});

const mockNudge = (val: Partial<Vector3>): NudgeModifier => ({
  name: `MockNudge_${JSON.stringify(val)}`,
  active: true,
  getNudge: () => ({ value: val, error: null }),
});

const mockStick = (
  name: string,
  priority: number,
  yaw: number
): StickModifier => ({
  name,
  active: true,
  priority,
  getStick: () => ({
    value: { yaw, pitch: 0, distance: 10, priority },
    error: null,
  }),
});

describe("PortalSceneManager - Stage 1 (Car)", () => {
  const initial = { x: 0, y: 0, z: 0 };

  it("should pick the highest priority car", () => {
    const manager = new PortalSceneManager(initial);
    manager["carModifiers"] = [
      mockCar("low", 0, { x: 10, y: 10, z: 10 }),
      mockCar("high", 100, { x: 50, y: 50, z: 50 }),
    ];

    const state = manager.calculateScene();
    expect(state.camera.x).toBe(50);
  });

  it("should fall back to lower priority if the highest fails with an error", () => {
    const manager = new PortalSceneManager(initial);

    const failingHigh: CarModifier = {
      name: "FailingHigh",
      active: true,
      priority: 100,
      getCarPosition: () => ({ value: null, error: "Sensor Failure" }),
    };

    manager["carModifiers"] = [
      failingHigh,
      mockCar("fallback", 50, { x: 20, y: 20, z: 20 }),
    ];

    const state = manager.calculateScene();
    expect(state.camera.x).toBe(20); // Successfully fell back
  });

  it("should completely ignore inactive modifiers", () => {
    const manager = new PortalSceneManager({ x: 0, y: 0, z: 0 });

    const inactiveCar = mockCar("high", 100, { x: 50, y: 50, z: 50 });
    inactiveCar.active = false; // The switch is off

    const activeCar = mockCar("low", 0, { x: 10, y: 10, z: 10 });

    manager["carModifiers"] = [inactiveCar, activeCar];

    const state = manager.calculateScene();

    // Should pick the priority 0 car because the priority 100 one is inactive
    expect(state.camera.x).toBe(10);
  });

  it("should return initialCam and default orientation when no modifiers exist", () => {
    const initial = { x: 1, y: 2, z: 3 };
    const manager = new PortalSceneManager(initial);

    const state = manager.calculateScene();

    expect(state.camera).toEqual(initial);
    // Default lookAt should be forward from the camera (Z - 1000)
    expect(state.lookAt.z).toBe(initial.z - 1000);
  });

  it("should pick the first one added if priorities are tied", () => {
    const manager = new PortalSceneManager({ x: 0, y: 0, z: 0 });

    manager["carModifiers"] = [
      mockCar("first", 10, { x: 1, y: 1, z: 1 }),
      mockCar("second", 10, { x: 2, y: 2, z: 2 }),
    ];

    const state = manager.calculateScene();
    // Depending on how you want your engine to behave:
    expect(state.camera.x).toBe(1);
  });

  it("should return to initial defaults if all active modifiers return errors", () => {
    const initial = { x: 500, y: 500, z: 500 };
    const manager = new PortalSceneManager(initial);

    const brokenCar: CarModifier = {
      name: "BrokenCar",
      active: true,
      priority: 999,
      getCarPosition: () => ({ value: null, error: "Critical Error" }),
    };

    const brokenStick: StickModifier = {
      name: "BrokenStick",
      active: true,
      priority: 999,
      getStick: () => ({ value: null, error: "Math Overflow" }),
    };

    manager["carModifiers"] = [brokenCar];
    manager["stickModifiers"] = [brokenStick];

    const state = manager.calculateScene();

    // 1. Camera should stay at initialCam
    expect(state.camera).toEqual(initial);

    // 2. LookAt should default to 1000 units in front of initialCam (Z-1000)
    // Based on the default StickResult: { yaw: 0, pitch: 0, distance: 1000 }
    expect(state.lookAt.z).toBe(initial.z - 1000);
  });
});

describe("PortalSceneManager - Stage 2 (Nudge)", () => {
  it("should average dimensions independently and not dilute missing axes", () => {
    const manager = new PortalSceneManager({ x: 0, y: 0, z: 0 });

    manager["nudgeModifiers"] = [
      mockNudge({ x: 10 }), // Only votes for X
      mockNudge({ x: 20 }), // Only votes for X
      mockNudge({ y: 100 }), // Only votes for Y
    ];

    const state = manager.calculateScene();

    // X should be average of 10 and 20 = 15
    expect(state.camera.x).toBe(15);
    // Y should be 100 (not 100/3 or 100/2, because only one modifier voted)
    expect(state.camera.y).toBe(100);
    // Z should remain at initial 0
    expect(state.camera.z).toBe(0);
  });
});

describe("PortalSceneManager - Stage 3 (Stick)", () => {
  it("should project lookAt correctly based on yaw/pitch", () => {
    const manager = new PortalSceneManager({ x: 0, y: 0, z: 0 });

    const forwardStick: StickModifier = {
      name: "ForwardStick",
      active: true,
      priority: 1,
      getStick: () => ({
        value: { yaw: 0, pitch: 0, distance: 10, priority: 1 },
        error: null,
      }),
    };

    manager["stickModifiers"] = [forwardStick];
    const state = manager.calculateScene();

    // With yaw 0 and pitch 0, looking down -Z axis
    expect(state.lookAt.z).toBeCloseTo(-10);
    expect(state.lookAt.x).toBe(0);
  });
});

describe("PortalSceneManager - calculateLookAt Math", () => {
  const manager = new PortalSceneManager({ x: 0, y: 0, z: 0 });
  const origin = { x: 0, y: 0, z: 0 };
  const DIST = 10;

  it("should look straight forward (Yaw: 0, Pitch: 0)", () => {
    // Expected: {x: 0, y: 0, z: -10}
    const result = manager["calculateLookAt"](origin, {
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
    const result = manager["calculateLookAt"](origin, {
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
    const result = manager["calculateLookAt"](origin, {
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
    const result = manager["calculateLookAt"](origin, {
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
  const initial = { x: 10, y: 10, z: 10 };

  it("should not include the debug property when isDebug is false", () => {
    const manager = new PortalSceneManager(initial, false);
    const state = manager.calculateScene();
    expect(state.debug).toBeUndefined();
  });

  it("should capture failed car modifier in the debug log", () => {
    const manager = new PortalSceneManager(initial, true);

    const failingCar: CarModifier = {
      name: "FailingCar",
      active: true,
      priority: 100,
      getCarPosition: () => ({ value: null, error: "Element not found" }),
    };

    const goodCar: CarModifier = {
      name: "GoodCar",
      active: true,
      priority: 50,
      getCarPosition: () => ({
        value: { position: { x: 20, y: 30, z: 40 } },
        error: null,
      }),
    };

    manager["carModifiers"] = [failingCar, goodCar];
    const state = manager.calculateScene();

    expect(state.debug).toBeDefined();
    expect(state.debug?.errors).toHaveLength(1);
    expect(state.debug?.errors[0].name).toBe("FailingCar");
    expect(state.debug?.errors[0].message).toBe("Element not found");
    expect(state.debug?.car.name).toBe("GoodCar");
    expect(state.debug?.car.x).toBe(20);
    expect(state.debug?.car.y).toBe(30);
    expect(state.debug?.car.z).toBe(40);
    expect(state.debug?.car.priority).toBe(50);
  });

  it("should capture the winning car details in the debug log", () => {
    const manager = new PortalSceneManager(initial, true);

    const highPriorityCar: CarModifier = {
      name: "highPriorityCar",
      active: true,
      priority: 100,
      getCarPosition: () => ({
        value: { position: { x: 50, y: 60, z: 70 } },
        error: null,
      }),
    };

    manager["carModifiers"] = [highPriorityCar];
    const state = manager.calculateScene();

    expect(state.debug).toBeDefined();
    expect(state.debug?.car.name).toBe("highPriorityCar");
    expect(state.debug?.car.x).toBe(50);
    expect(state.debug?.car.y).toBe(60);
    expect(state.debug?.car.z).toBe(70);
    expect(state.debug?.car.priority).toBe(100);
  });

  it("should accumulate all successful nudges in the debug audit", () => {
    const manager = new PortalSceneManager(initial, true);

    manager["nudgeModifiers"] = [
      {
        name: "NudgeX",
        active: true,
        getNudge: () => ({ value: { x: 5 }, error: null }),
      } as NudgeModifier,
      {
        name: "NudgeY",
        active: true,
        getNudge: () => ({ value: { y: 20 }, error: null }),
      } as NudgeModifier,
    ];

    const state = manager.calculateScene();

    expect(state.debug?.nudges).toHaveLength(2);
    expect(state.debug?.nudges[0].x).toBe(5);
    expect(state.debug?.nudges[1].y).toBe(20);
  });

  it("should capture errors for failing modifiers in the debug log", () => {
    const manager = new PortalSceneManager(initial, true);

    const failingCar: CarModifier = {
      name: "FailingCar",
      active: true,
      priority: 100,
      getCarPosition: () => ({ value: null, error: "DOM element missing" }),
    };

    manager["carModifiers"] = [failingCar];
    const state = manager.calculateScene();

    expect(state.debug?.errors).toHaveLength(1);
    expect(state.debug?.errors[0].message).toBe("DOM element missing");
    // Ensure it fell back to initialCam
    expect(state.debug?.car.name).toBe("initialCam");
  });
});

describe("PortalSceneManager - Multi-Stick Logic", () => {
  const initialPos = { x: 0, y: 0, z: 0 };

  it("should settle on the highest priority stick and log its name", () => {
    const manager = new PortalSceneManager(initialPos, true);

    manager["stickModifiers"] = [
      mockStick("Low-Priority-Idle", 10, 0),
      mockStick("High-Priority-Override", 100, 3.14),
      mockStick("Mid-Priority-Input", 50, 1.5),
    ];

    const state = manager.calculateScene();

    // 1. Math check: Must be the High-Priority value
    expect(state.lookAt.z).toBeCloseTo(10); // Since yaw 3.14 (PI) is "backward"

    // 2. Debug check: Must identify the winner by its explicit name
    expect(state.debug?.stick.name).toBe("High-Priority-Override");
    expect(state.debug?.stick.priority).toBe(100);
  });
});

it("should log multiple errors if higher priority sticks fail", () => {
  const initialPos = { x: 0, y: 0, z: 0 };

  const manager = new PortalSceneManager(initialPos, true);

  const broken1: StickModifier = {
    name: "Hardware-Sensor",
    active: true,
    priority: 100,
    getStick: () => ({ value: null, error: "Not Connected" }),
  };

  const broken2: StickModifier = {
    name: "Software-Algorithm",
    active: true,
    priority: 80,
    getStick: () => ({ value: null, error: "NaN Result" }),
  };

  const working3 = mockStick("Safe-Fallback", 10, 0.75);

  manager["stickModifiers"] = [broken1, broken2, working3];
  const state = manager.calculateScene();

  // The final state should be from the working stick
  expect(state.debug?.stick.name).toBe("Safe-Fallback");

  // The error log should contain both failures with their specific names
  expect(state.debug?.errors).toHaveLength(2);
  expect(state.debug?.errors[0]).toEqual({
    name: "Hardware-Sensor",
    message: "Not Connected",
  });
  expect(state.debug?.errors[1]).toEqual({
    name: "Software-Algorithm",
    message: "NaN Result",
  });
});
