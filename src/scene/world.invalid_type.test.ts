import { describe, expect, it, vi } from "vitest";
import { LOOK_MODES } from "./types.ts";

vi.mock("./types.ts", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./types.ts")>();
    return {
        ...actual,
        blueprintIsType: vi.fn(() => false),
    };
});

import { World } from "./world.ts";

describe("World - impossible type guards", () => {
    const createWorld = () => {
        const stage = {
            setEye: vi.fn(),
            setScreen: vi.fn(),
        } as any;

        const clock = {
            isPaused: vi.fn(() => false),
        } as any;

        return new World({ stage, clock } as any);
    };

    it("setEye throws when blueprintIsType returns false (rotation)", () => {
        const world = createWorld();
        expect(() =>
            world.setEye({
                lookMode: LOOK_MODES.ROTATION,
                position: { x: 0, y: 0, z: 100 },
                rotation: { pitch: 0, yaw: 0, roll: 0 },
            } as any)
        ).toThrow("invalid type");
    });

    it("setEye throws when blueprintIsType returns false (lookAt)", () => {
        const world = createWorld();
        expect(() =>
            world.setEye({
                lookMode: LOOK_MODES.LOOK_AT,
                position: { x: 0, y: 0, z: 100 },
                lookAt: { x: 0, y: 0, z: 0 },
            } as any)
        ).toThrow("invalid type");
    });

    it("setScreen throws when blueprintIsType returns false (rotation)", () => {
        const world = createWorld();
        expect(() =>
            world.setScreen({
                lookMode: LOOK_MODES.ROTATION,
                position: { x: 0, y: 0, z: 1000 },
                rotation: { pitch: 0, yaw: 0, roll: 0 },
            } as any)
        ).toThrow("invalid type");
    });

    it("setScreen throws when blueprintIsType returns false (lookAt)", () => {
        const world = createWorld();
        expect(() =>
            world.setScreen({
                lookMode: LOOK_MODES.LOOK_AT,
                position: { x: 0, y: 0, z: 1000 },
                lookAt: { x: 0, y: 0, z: 0 },
            } as any)
        ).toThrow("invalid type");
    });
});

