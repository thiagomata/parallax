import { afterEach, describe, expect, it } from "vitest";
import p5 from "p5";
import { P5GraphicProcessor } from "./p5_graphic_processor.ts";
import { ASSET_STATUS, ELEMENT_TYPES, type Alpha, type ResolvedPanel } from "../types.ts";

/**
 * Real WebGL pixel checks for `alphaCutoff` (runs in headless Chromium, not happy-dom).
 *
 * The bug it guards: p5's textured fill shader never discards fragments, so a texture's
 * fully transparent pixels still write depth. Anything drawn *after* that panel and
 * *behind* it fails the depth test and the background shows through instead. The unit
 * tests only see that we bind a shader; these prove the GPU actually lets the far panel
 * through - and that the setup reproduces the bug without the cutout.
 */

const SIZE = 64;
const BACKGROUND = [0, 0, 255] as const;
const FAR_RED = [255, 0, 0] as const;

// p5's friendly-error checker logs unrelated noise about bundled function names.
(p5 as unknown as { disableFriendlyErrors: boolean }).disableFriendlyErrors = true;

let instance: p5 | null = null;

afterEach(() => {
    instance?.remove();
    instance = null;
});

function createWebGLSketch(): Promise<p5> {
    return new Promise(resolve => {
        instance = new p5((p: p5) => {
            p.setup = () => {
                p.createCanvas(SIZE, SIZE, p.WEBGL);
                p.pixelDensity(1);
                p.noLoop();
                resolve(p);
            };
        }, document.body);
    });
}

function centerPixel(p: p5): number[] {
    return (p.get(SIZE / 2, SIZE / 2) as number[]).slice(0, 3);
}

function renderTransparentPanelThenFarRed(p: p5, alphaCutoff: number | undefined): number[] {
    const gp = new P5GraphicProcessor(p, {} as any);
    const state = { settings: { alpha: 1 as Alpha } } as any;

    // createImage() starts fully transparent (rgba 0,0,0,0).
    const transparent = p.createImage(8, 8);
    const assets = {
        texture: { status: ASSET_STATUS.READY, value: { internalRef: transparent } },
    } as any;
    const nearPanel = {
        id: "near-transparent",
        type: ELEMENT_TYPES.PANEL,
        width: SIZE * 4,
        height: SIZE * 4,
        position: { x: 0, y: 0, z: 0 },
        fitMode: "fill",
        alphaCutoff,
    } as ResolvedPanel;

    p.background(...BACKGROUND);

    // Near transparent panel drawn FIRST - the order that triggered the black gaps.
    p.push();
    p.translate(0, 0, 100);
    gp.drawPanel(nearPanel, assets, state);
    p.pop();

    // Opaque red panel behind it, drawn second.
    p.push();
    p.noStroke();
    p.fill(...FAR_RED);
    p.plane(SIZE * 4, SIZE * 4);
    p.pop();

    return centerPixel(p);
}

describe("alphaCutoff (WebGL)", () => {
    it("lets a panel behind a transparent texture show through, regardless of draw order", async () => {
        const p = await createWebGLSketch();

        expect(renderTransparentPanelThenFarRed(p, 0.5)).toEqual([...FAR_RED]);
    });

    it("reproduces the black-gap bug without it (guards the test itself)", async () => {
        const p = await createWebGLSketch();

        expect(renderTransparentPanelThenFarRed(p, undefined)).toEqual([...BACKGROUND]);
    });
});
