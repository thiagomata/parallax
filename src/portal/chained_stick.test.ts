import { it, expect, describe } from "vitest";
import { ChainedStick } from "./chained_stick";
import type { StickModifier } from "./types";

describe("ChainedStick Decorator", () => {
  const mockStick = (id: string, val: number): StickModifier => ({
    name: `MockStick_${id}`,
    active: true,
    priority: 10, // The internal priority doesn't matter to the Manager, only the wrapper's priority
    getStick: () => ({
      value: { yaw: val, pitch: val, distance: 100, priority: 10 },
      error: null,
    }),
  });

  it("should return the first successful result and ignore the rest", () => {
    const primary = mockStick("primary", 1);
    const secondary = mockStick("secondary", 2);
    const chain = new ChainedStick(50, [primary, secondary]);

    const res = chain.getStick({ x: 0, y: 0, z: 0 });

    // Should be 1, because primary succeeded
    expect(res.value?.yaw).toBe(1);
  });

  it("should skip a failing primary and return the secondary", () => {
    const primary: StickModifier = {
      name: "primary",
      active: true,
      priority: 10,
      getStick: () => ({ value: null, error: "Hardware Disconnected" }),
    };
    const secondary = mockStick("secondary", 2);
    const chain = new ChainedStick(50, [primary, secondary]);

    const res = chain.getStick({ x: 0, y: 0, z: 0 });

    // Should be 2, because primary had an error
    expect(res.error).toBeNull();
    expect(res.value?.yaw).toBe(2);
  });

  it("should skip an inactive modifier even if it would have succeeded", () => {
    const primary = mockStick("primary", 1);
    primary.active = false; // Turned off

    const secondary = mockStick("secondary", 2);
    const chain = new ChainedStick(50, [primary, secondary]);

    const res = chain.getStick({ x: 0, y: 0, z: 0 });

    expect(res.value?.yaw).toBe(2);
  });

  it("should return an error if the entire chain fails", () => {
    const primary: StickModifier = {
      name: "primary",
      active: true,
      priority: 1,
      getStick: () => ({ value: null, error: "Fail 1" }),
    };
    const secondary: StickModifier = {
      name: "secondary",
      active: true,
      priority: 1,
      getStick: () => ({ value: null, error: "Fail 2" }),
    };

    const chain = new ChainedStick(50, [primary, secondary]);
    const res = chain.getStick({ x: 0, y: 0, z: 0 });

    expect(res.value).toBeNull();
    expect(res.error).toBe("Entire stick chain failed");
  });

  it("should overwrite internal priorities with the wrapper priority", () => {
    const internalPriority = 5;
    const wrapperPriority = 99;

    const internal = mockStick("internal", 1);
    internal.priority = internalPriority;

    const chain = new ChainedStick(wrapperPriority, [internal]);
    const res = chain.getStick({ x: 0, y: 0, z: 0 });

    // The result must reflect the wrapper, not the internal child
    expect(res.value?.priority).toBe(99);
  });
});
