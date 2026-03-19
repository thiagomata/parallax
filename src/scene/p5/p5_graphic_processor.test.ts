import { describe, expect, it, vi } from "vitest";
import { P5GraphicProcessor } from "./p5_graphic_processor.ts";
import { ASSET_STATUS, ELEMENT_TYPES, type ProjectionMatrix } from "../types.ts";

const createMockP5 = () => {
    const p = {
        // constants
        PI: Math.PI,
        HALF_PI: Math.PI / 2,
        TRIANGLES: "TRIANGLES",
        CENTER: "CENTER",

        // renderer internals
        _renderer: {
            uPMatrix: {
                set: vi.fn(),
            },
        },

        // state/time
        deltaTime: 16,
        frameCount: 123,

        // core drawing api
        camera: vi.fn(),
        push: vi.fn(),
        pop: vi.fn(),
        translate: vi.fn(),
        rotateX: vi.fn(),
        rotateY: vi.fn(),
        rotateZ: vi.fn(),
        scale: vi.fn(),
        box: vi.fn(),
        plane: vi.fn(),
        sphere: vi.fn(),
        torus: vi.fn(),
        cylinder: vi.fn(),
        cone: vi.fn(),
        ellipsoid: vi.fn(),
        beginShape: vi.fn(),
        vertex: vi.fn(),
        endShape: vi.fn(),
        texture: vi.fn(),
        tint: vi.fn(),
        noTint: vi.fn(),
        fill: vi.fn(),
        noFill: vi.fn(),
        stroke: vi.fn(),
        strokeWeight: vi.fn(),
        noStroke: vi.fn(),
        textFont: vi.fn(),
        textSize: vi.fn(),
        textAlign: vi.fn(),
        text: vi.fn(),
        line: vi.fn(),

        // math helpers
        dist: vi.fn((x1, y1, z1, x2, y2, z2) => Math.hypot(x2 - x1, y2 - y1, z2 - z1)),
        map: vi.fn((v) => v),
        lerp: vi.fn((s, e, a) => s + (e - s) * a),

        // time helpers
        millis: vi.fn(() => 1000),

        // video
        blendMode: vi.fn(),
    };

    return p;
};

describe("P5GraphicProcessor", () => {
    it("setCamera forwards eye + lookAt to p5.camera", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        gp.setCamera({
            id: "eye",
            type: "EYE",
            position: { x: 1, y: 2, z: 3 },
            lookAt: { x: 4, y: 5, z: 6 },
            rotation: { pitch: 0, yaw: 0, roll: 0 },
            direction: { x: 0, y: 0, z: -1 },
            distance: 0,
            effects: [],
        } as any);

        expect(p.camera).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6, 0, 1, 0);
    });

    it("setProjectionMatrix updates renderer.uPMatrix when available", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        const m: ProjectionMatrix = {
            xScale: { x: 1, y: 2, z: 3, w: 4 },
            yScale: { x: 5, y: 6, z: 7, w: 8 },
            projection: { x: 9, y: 10, z: 11, w: 12 },
            translation: { x: 13, y: 14, z: 15, w: 16 },
        };

        gp.setProjectionMatrix(m);
        expect(p._renderer.uPMatrix.set).toHaveBeenCalledWith([
            1, 2, 3, 4,
            5, 6, 7, 8,
            9, 10, 11, 12,
            13, 14, 15, 16,
        ]);
    });

    it("setProjectionMatrix is a no-op when renderer.uPMatrix is missing", () => {
        const p = createMockP5();
        (p as any)._renderer = {};
        const gp = new P5GraphicProcessor(p as any, {} as any);

        expect(() => gp.setProjectionMatrix({} as any)).not.toThrow();
    });

    it("drawPanel mirrors video textures horizontally", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        const state = { settings: { alpha: 1 } } as any;
        const assets = { video: { elt: { readyState: 1 } } } as any;

        gp.drawPanel(
            { id: "p", type: ELEMENT_TYPES.PANEL, width: 10, height: 20, position: { x: 0, y: 0, z: 0 } } as any,
            assets,
            state
        );

        expect(p.scale).toHaveBeenCalledWith(-1, 1);
        expect(p.plane).toHaveBeenCalledWith(10, 20);
    });

    it("drawText returns early when font is not ready", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        const state = { settings: { alpha: 1 } } as any;
        const assets = {
            font: { status: ASSET_STATUS.PENDING, value: null },
        } as any;

        gp.drawText(
            { id: "t", type: ELEMENT_TYPES.TEXT, text: "hi", size: 12, position: { x: 0, y: 0, z: 0 } } as any,
            assets,
            state
        );

        expect(p.textFont).not.toHaveBeenCalled();
        expect(p.text).not.toHaveBeenCalled();
    });

    it("applies video texture and tint when a video is ready", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        const state = { settings: { alpha: 0.5 } } as any;
        const assets = { video: { elt: { readyState: 2 } } } as any;

        gp.drawBox(
            { id: "b", type: ELEMENT_TYPES.BOX, width: 10, position: { x: 0, y: 0, z: 0 }, alpha: 0.5 } as any,
            assets,
            state
        );

        expect(p.texture).toHaveBeenCalledWith(assets.video);
        // combinedAlpha = 0.5 * 0.5 = 0.25 => 64
        expect(p.tint).toHaveBeenCalledWith(255, 64);
    });

    it("applies image texture when ready and video is not ready", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        const state = { settings: { alpha: 1 } } as any;
        const img = { id: "img-1" };
        const assets = {
            texture: {
                status: ASSET_STATUS.READY,
                value: { internalRef: img },
            },
        } as any;

        gp.drawBox(
            { id: "b", type: ELEMENT_TYPES.BOX, width: 10, position: { x: 0, y: 0, z: 0 } } as any,
            assets,
            state
        );

        expect(p.texture).toHaveBeenCalledWith(img);
        expect(p.tint).toHaveBeenCalledWith(255, 255);
    });

    it("falls back to fill/noFill and stroke/noStroke when no texture is available", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        const state = { settings: { alpha: 0.5 } } as any;
        const assets = {} as any;

        gp.drawSphere(
            {
                id: "s",
                type: ELEMENT_TYPES.SPHERE,
                radius: 5,
                position: { x: 0, y: 0, z: 0 },
                alpha: 0.5,
                fillColor: { red: 10, green: 20, blue: 30, alpha: 0.5 },
                strokeColor: { red: 1, green: 2, blue: 3, alpha: 0.25 },
                strokeWidth: 2,
            } as any,
            assets,
            state
        );

        // combinedAlpha = 0.5 * 0.5 = 0.25; fill baseAlpha = 0.5 => 0.125 => 32
        expect(p.fill).toHaveBeenCalledWith(10, 20, 30, 32);
        // stroke baseAlpha = 0.25; globalAlpha = 0.25 => 0.0625 => 16
        expect(p.strokeWeight).toHaveBeenCalledWith(2);
        expect(p.stroke).toHaveBeenCalledWith(1, 2, 3, 16);
    });

    it("drawPyramid emits vertices for sides and base", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        const state = { settings: { alpha: 1 } } as any;
        const assets = {} as any;

        gp.drawPyramid(
            {
                id: "py",
                type: ELEMENT_TYPES.PYRAMID,
                baseSize: 10,
                height: 5,
                position: { x: 0, y: 0, z: 0 },
            } as any,
            assets,
            state
        );

        expect(p.beginShape).toHaveBeenCalledWith(p.TRIANGLES);
        expect(p.vertex).toHaveBeenCalled();
        expect(p.endShape).toHaveBeenCalled();
        expect(p.vertex).toHaveBeenCalledTimes(18);
    });

    it("drawTree applies translation then YXZ rotation and recurses to children", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        const state = { settings: { alpha: 1 } } as any;

        const drawBoxSpy = vi.spyOn(gp, "drawBox").mockImplementation(() => {});
        const drawPanelSpy = vi.spyOn(gp, "drawPanel").mockImplementation(() => {});

        gp.drawTree(
            {
                props: {
                    id: "root",
                    type: ELEMENT_TYPES.BOX,
                    position: { x: 1, y: 2, z: 3 },
                    rotate: { yaw: 0.1, pitch: 0.2, roll: 0.3 },
                } as any,
                assets: {} as any,
                children: [
                    {
                        props: {
                            id: "child",
                            type: ELEMENT_TYPES.PANEL,
                            width: 1,
                            height: 1,
                            position: { x: 0, y: 0, z: 0 },
                        } as any,
                        assets: {} as any,
                        children: [],
                    },
                ],
            } as any,
            state
        );

        const translateCall = p.translate.mock.invocationCallOrder[0]!;
        const rotateYCall = p.rotateY.mock.invocationCallOrder[0]!;
        const rotateXCall = p.rotateX.mock.invocationCallOrder[0]!;
        const rotateZCall = p.rotateZ.mock.invocationCallOrder[0]!;

        expect(p.translate).toHaveBeenCalledWith(1, 2, 3);
        expect(translateCall).toBeLessThan(rotateYCall);
        expect(rotateYCall).toBeLessThan(rotateXCall);
        expect(rotateXCall).toBeLessThan(rotateZCall);

        expect(drawBoxSpy).toHaveBeenCalledTimes(1);
        expect(drawPanelSpy).toHaveBeenCalledTimes(1);
    });

    it("drawCrosshair draws two lines at a translated position", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        gp.drawCrosshair({ x: 10, y: 20, z: 30 }, 5);

        expect(p.translate).toHaveBeenCalledWith(10, 20, 30);
        expect(p.line).toHaveBeenNthCalledWith(1, -5, 0, 5, 0);
        expect(p.line).toHaveBeenNthCalledWith(2, 0, -5, 0, 5);
    });

    it("drawTree centers elements and positions children relative to center", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        const state = { settings: { alpha: 1 } } as any;
        const drawBoxSpy = vi.spyOn(gp, "drawBox").mockImplementation(() => {});

        // Parent box at (0,0,0) with size 100x100x50
        // Child box at (0,0,0) - should appear at parent's center
        gp.drawTree(
            {
                props: {
                    id: "parent",
                    type: ELEMENT_TYPES.BOX,
                    position: { x: 0, y: 0, z: 0 },
                    width: 100,
                    height: 100,
                    depth: 50,
                    rotate: undefined,
                } as any,
                assets: {} as any,
                children: [
                    {
                        props: {
                            id: "child",
                            type: ELEMENT_TYPES.BOX,
                            position: { x: 0, y: 0, z: 0 },  // at parent's center
                            width: 20,
                            height: 20,
                            depth: 20,
                        } as any,
                        assets: {} as any,
                        children: [],
                    },
                ],
            } as any,
            state
        );

        // Verify parent was drawn (centered at position)
        expect(drawBoxSpy).toHaveBeenCalledTimes(2);

        // Check translate calls: position -> draw offset -> back to center
        // Expected sequence: translate(0,0,0) -> rotate -> translate(-50,-50,-25) -> draw -> translate(50,50,25) -> child translate
        const translateCalls = p.translate.mock.calls;
        
        // First translate is to position (0,0,0)
        expect(translateCalls[0]).toEqual([0, 0, 0]);
        
        // Second translate is offset by -center to draw centered (-50, -50, -25)
        expect(translateCalls[1]).toEqual([-50, -50, -25]);
        
        // Third translate returns to center (50, 50, 25) for children
        expect(translateCalls[2]).toEqual([50, 50, 25]);
        
        // Child at (0,0,0) should be translated by (0,0,0) relative to parent's center
        // So the fourth translate call should be child's position (0,0,0)
        expect(translateCalls[3]).toEqual([0, 0, 0]);
    });

    it("drawTree with no size uses zero center offset", () => {
        const p = createMockP5();
        const gp = new P5GraphicProcessor(p as any, {} as any);

        expect(gp.millis()).toBe(1000);
        expect(gp.deltaTime()).toBe(16);
        expect(gp.frameCount()).toBe(123);

        expect(gp.dist({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(5);
        expect(p.dist).toHaveBeenCalled();

        expect(gp.map(1, 0, 1, 10, 20, true)).toBe(1);
        expect(p.map).toHaveBeenCalled();

        expect(gp.lerp(0, 10, 0.5)).toBe(5);
        expect(p.lerp).toHaveBeenCalled();
    });
});

