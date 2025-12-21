import { describe, it, expect } from "vitest";

import type {
  Vector3,
  CarModifier,
  NudgeModifier,
  StickModifier,
} from "./types";

import { PortalSceneManager } from "./manager";

const mockCar = (_id: string, priority: number, pos: Vector3): CarModifier => ({
  active: true,
  priority,
  getCarPosition: () => ({ value: { position: pos }, error: null }),
});

const mockNudge = (val: Partial<Vector3>): NudgeModifier => ({
  active: true,
  getNudge: () => ({ value: val, error: null }),
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
      active: true,
      priority: 999,
      getCarPosition: () => ({ value: null, error: "Critical Error" }),
    };

    const brokenStick: StickModifier = {
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
