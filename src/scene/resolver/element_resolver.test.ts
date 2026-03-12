import { describe, expect, it, vi } from "vitest";
import { ElementResolver } from "./element_resolver.ts";
import { ELEMENT_TYPES, SPEC_KINDS, type BundleResolvedElement, type ResolvedSceneState } from "../types.ts";

describe("ElementResolver", () => {
    it("render dispatches to the correct draw method", () => {
        const resolver = new ElementResolver<any, any>({});

        const gp = {
            drawBox: vi.fn(),
        } as any;

        const bundle: BundleResolvedElement<any, any> = {
            id: "box-1",
            assets: {},
            effects: [],
            resolved: {
                id: "box-1",
                type: ELEMENT_TYPES.BOX,
                width: 1,
                position: { x: 0, y: 0, z: 0 },
            },
        };

        resolver.render(bundle, gp, {} as ResolvedSceneState);
        expect(gp.drawBox).toHaveBeenCalledTimes(1);
    });

    it("render throws for unknown element types", () => {
        const resolver = new ElementResolver<any, any>({});

        const gp = {} as any;
        const bundle: BundleResolvedElement<any, any> = {
            id: "x",
            assets: {},
            effects: [],
            resolved: {
                id: "x",
                type: "unknown" as any,
                position: { x: 0, y: 0, z: 0 },
            },
        };

        expect(() => resolver.render(bundle, gp, {} as ResolvedSceneState)).toThrow("Unknown type");
    });

    it("prepare throws when an effect type is not in the lib", async () => {
        const resolver = new ElementResolver<any, any>({});

        const loader = {
            hydrateTexture: vi.fn(),
            hydrateFont: vi.fn(),
            waitForAllAssets: vi.fn(),
        } as any;

        expect(() =>
            resolver.prepare(
                {
                    id: "box-1",
                    type: ELEMENT_TYPES.BOX,
                    width: 1,
                    position: { x: 0, y: 0, z: 0 },
                    effects: [{ type: "missing-effect" as any, settings: {} }],
                } as any,
                loader
            )
        ).toThrow("Invalid effect: missing-effect");
    });

    it("exposes isStaticData/isDynamicProperty helpers", () => {
        const resolver = new ElementResolver<any, any>({});

        expect(resolver.isStaticData(() => {})).toBe(false);
        expect(resolver.isStaticData({ x: 1, y: { z: 2 } })).toBe(true);

        expect(resolver.isDynamicProperty({ kind: SPEC_KINDS.STATIC, value: 123 })).toBe(true);
        expect(resolver.isDynamicProperty({ kind: "nope", value: 123 })).toBe(false);
    });
});

