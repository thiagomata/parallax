import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectionAssetRegistry } from "./projection_asset_registry.ts";
import { ProjectionResolver } from "../projection/projection_resolver.ts";
import { LOOK_MODES, PROJECTION_TYPES, type BlueprintProjection } from "../types.ts";

describe("ProjectionAssetRegistry", () => {
    let resolver: ProjectionResolver<any>;
    let registry: ProjectionAssetRegistry<any>;

    beforeEach(() => {
        resolver = new ProjectionResolver<any>({});
        registry = new ProjectionAssetRegistry(resolver);
    });

    it("register is idempotent (does not re-prepare existing projections)", () => {
        const spy = vi.spyOn(resolver, "prepare");

        const blueprint: BlueprintProjection = {
            id: "p1",
            type: PROJECTION_TYPES.SCREEN,
            lookMode: LOOK_MODES.LOOK_AT,
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookAt: { x: 0, y: 0, z: 0 },
        };

        const first = registry.register(blueprint);
        const second = registry.register(blueprint);

        expect(first).toBe(second);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("supports get/has/delete", () => {
        const blueprint: BlueprintProjection = {
            id: "p1",
            type: PROJECTION_TYPES.SCREEN,
            lookMode: LOOK_MODES.LOOK_AT,
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookAt: { x: 0, y: 0, z: 0 },
        };

        registry.register(blueprint);
        expect(registry.has("p1")).toBe(true);
        expect(registry.get("p1")).toBeDefined();

        registry.delete("p1");
        expect(registry.has("p1")).toBe(false);
        expect(registry.get("p1")).toBeUndefined();
    });
});

