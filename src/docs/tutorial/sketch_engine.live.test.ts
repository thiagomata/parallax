import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("sucrase", () => ({
    transform: vi.fn((code: string) => ({
        code: code.replace(/import .*/g, "").replace(/export /g, "module.exports."),
    })),
}));

vi.mock("p5", () => ({
    default: vi.fn(),
}));

describe("sketch_engine.live", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    describe("getModule", () => {
        it("returns correct module exports for known paths", async () => {
            const { getModule } = await import("./sketch_engine.live.ts");

            const typesModule = getModule("types");
            expect(typesModule).toHaveProperty("DEFAULT_SCENE_SETTINGS");
            expect(typesModule).toHaveProperty("ELEMENT_TYPES");

            const worldModule = getModule("world");
            expect(worldModule).toHaveProperty("World");
        });

        it("returns default undefined for unknown paths", async () => {
            const { getModule } = await import("./sketch_engine.live.ts");

            const result = getModule("nonexistent/path");
            expect(result.default).toBeUndefined();
        });

        it("handles case-insensitive module lookup", async () => {
            const { getModule } = await import("./sketch_engine.live.ts");

            const result = getModule("WORLD");
            expect(result).toHaveProperty("World");
        });

        it("handles path with underscores", async () => {
            const { getModule } = await import("./sketch_engine.live.ts");

            const result = getModule("p5_asset_loader");
            expect(result).toHaveProperty("P5AssetLoader");
        });
    });

    describe("extractSketchFunction", () => {
        it("throws when no exported function found", async () => {
            const { extractSketchFunction } = await import("./sketch_engine.live.ts");

            expect(() => extractSketchFunction("const x = 1;")).toThrow("No exported function found");
        });
    });
});
