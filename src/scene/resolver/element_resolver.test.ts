import { describe, expect, it, vi } from "vitest";
import { ElementResolver } from "./element_resolver.ts";
import { ELEMENT_TYPES, SPEC_KINDS, type BundleResolvedElement, type ResolvedSceneState, ASSET_STATUS } from "../types.ts";

describe("ElementResolver", () => {
    it("render dispatches to the correct draw method for each element type", () => {
        const resolver = new ElementResolver<any, any>({});

        const gp = {
            drawBox: vi.fn(),
            drawPanel: vi.fn(),
            drawSphere: vi.fn(),
            drawCone: vi.fn(),
            drawPyramid: vi.fn(),
            drawElliptical: vi.fn(),
            drawCylinder: vi.fn(),
            drawTorus: vi.fn(),
            drawFloor: vi.fn(),
            drawText: vi.fn(),
        } as any;

        const state = {} as ResolvedSceneState;

        const cases: Array<{ type: (typeof ELEMENT_TYPES)[keyof typeof ELEMENT_TYPES]; method: keyof typeof gp }> = [
            { type: ELEMENT_TYPES.BOX, method: "drawBox" },
            { type: ELEMENT_TYPES.PANEL, method: "drawPanel" },
            { type: ELEMENT_TYPES.SPHERE, method: "drawSphere" },
            { type: ELEMENT_TYPES.CONE, method: "drawCone" },
            { type: ELEMENT_TYPES.PYRAMID, method: "drawPyramid" },
            { type: ELEMENT_TYPES.ELLIPTICAL, method: "drawElliptical" },
            { type: ELEMENT_TYPES.CYLINDER, method: "drawCylinder" },
            { type: ELEMENT_TYPES.TORUS, method: "drawTorus" },
            { type: ELEMENT_TYPES.FLOOR, method: "drawFloor" },
            { type: ELEMENT_TYPES.TEXT, method: "drawText" },
        ];

        for (const { type, method } of cases) {
            for (const key of Object.keys(gp) as Array<keyof typeof gp>) {
                gp[key].mockClear();
            }

            const id = `el-${String(type).toLowerCase()}`;
            const bundle: BundleResolvedElement<any, any> = {
                id,
                assets: {},
                effects: [],
                resolved: {
                    id,
                    type,
                    position: { x: 0, y: 0, z: 0 },
                } as any,
            };

            resolver.render(bundle, gp, state);
            expect(gp[method]).toHaveBeenCalledTimes(1);
            expect(gp[method]).toHaveBeenCalledWith(bundle.resolved, bundle.assets, state);
        }
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

    it("preloads texture variants and selects one during resolve", async () => {
        const resolver = new ElementResolver<any, any>({});
        const loader = {
            hydrateTexture: vi.fn((ref: any) => Promise.resolve({
                status: ASSET_STATUS.READY,
                value: { texture: ref, internalRef: { id: ref.path } },
            })),
            hydrateFont: vi.fn(),
            waitForAllAssets: vi.fn(),
        } as any;

        const bundle = resolver.prepare(
            {
                id: "panel-1",
                type: ELEMENT_TYPES.PANEL,
                width: 20,
                height: 20,
                position: { x: 0, y: 0, z: 0 },
                texture: {
                    kind: "texture-set",
                    default: "idle",
                    variants: {
                        idle: { path: "/parallax/img/target.png", width: 100, height: 100 },
                        active: { path: "/parallax/img/arrow.png", width: 100, height: 100 },
                    },
                    select: (ctx: any) => ((ctx.previousStore as any).global.keys?.ArrowUp ? "active" : "idle"),
                },
            } as any,
            loader
        );

        await Promise.resolve();
        await Promise.resolve();

        expect(loader.hydrateTexture).toHaveBeenCalledTimes(2);
        expect(bundle.assets.textureVariants?.idle?.status).toBe(ASSET_STATUS.READY);
        expect(bundle.assets.textureVariants?.active?.status).toBe(ASSET_STATUS.READY);

        const baseContext = {
            previousResolved: null,
            playback: { now: 0, delta: 0, progress: 0, frameCount: 0 },
            settings: {} as any,
            projectionPool: {},
            elementPool: {},
            dataProviders: {},
            previousStore: { global: {} },
            nextStore: { global: {} },
            element: {},
        } as any;

        const idleResolved = resolver.resolve(bundle, baseContext);
        expect(idleResolved.assets.texture?.value?.texture.path).toBe("/parallax/img/target.png");

        const activeResolved = resolver.resolve(bundle, {
            ...baseContext,
            previousStore: { global: { keys: { ArrowUp: true } } },
        });
        expect(activeResolved.assets.texture?.value?.texture.path).toBe("/parallax/img/arrow.png");
    });
});
