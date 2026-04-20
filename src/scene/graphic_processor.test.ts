import { describe, expect, it } from "vitest";
import { MockGraphicProcessor } from "./mock/mock_graphic_processor.mock.ts";
import type { GraphicsBundle, RenderTreeNode, ResolvedSceneState, ResolvedBox, ResolvedPanel, ResolvedSphere, ResolvedCone, ResolvedPyramid, ResolvedCylinder, ResolvedTorus, ResolvedElliptical, ResolvedFloor, ResolvedText, ElementAssets, SceneUnits } from "./types.ts";

describe("BaseGraphicProcessor", () => {
    const createTestProcessor = () => new MockGraphicProcessor<GraphicsBundle>();

    describe("drawTree", () => {
        it("should not call anything for null node", () => {
            const gp = createTestProcessor();
            gp.drawTree(null, {} as ResolvedSceneState);

            expect(gp.push).not.toHaveBeenCalled();
            expect(gp.translate).not.toHaveBeenCalled();
        });

        it("should call push, translate, rotate3 for a node", () => {
            const gp = createTestProcessor();
            const node: RenderTreeNode = {
                props: { type: "box" as const, id: "test", position: { x: 10 as SceneUnits, y: 20 as SceneUnits, z: 30 as SceneUnits }, rotate: undefined },
                assets: {} as ElementAssets<GraphicsBundle>,
                children: [],
            };

            gp.drawTree(node, {} as ResolvedSceneState);

            expect(gp.push).toHaveBeenCalledTimes(4);
            expect(gp.translate).toHaveBeenCalledTimes(3);
            expect(gp.rotate3).toHaveBeenCalledWith(undefined);
        });

        it("should call renderElement for each node", () => {
            const gp = createTestProcessor();
            const node: RenderTreeNode = {
                props: { type: "box" as const, id: "test", position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits }, rotate: undefined },
                assets: {} as ElementAssets<GraphicsBundle>,
                children: [],
            };

            gp.drawTree(node, {} as ResolvedSceneState);

            expect(gp.drawBox).toHaveBeenCalledTimes(1);
        });

        it("should recursively process children", () => {
            const gp = createTestProcessor();
            const childNode: RenderTreeNode = {
                props: { type: "panel" as const, id: "child", position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits }, rotate: undefined },
                assets: {} as ElementAssets<GraphicsBundle>,
                children: [],
            };
            const parentNode: RenderTreeNode = {
                props: { type: "box" as const, id: "parent", position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits }, rotate: undefined },
                assets: {} as ElementAssets<GraphicsBundle>,
                children: [childNode],
            };

            gp.drawTree(parentNode, {} as ResolvedSceneState);

            expect(gp.drawBox).toHaveBeenCalledTimes(1);
            expect(gp.drawPanel).toHaveBeenCalledTimes(1);
        });
    });

    describe("renderElement", () => {
        it("should call drawBox for box type", () => {
            const gp = createTestProcessor();
            const props: ResolvedBox = { type: "box", id: "test", width: 100, height: 100, depth: 100, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawBox).toHaveBeenCalledWith(props, {}, {});
        });

        it("should call drawPanel for panel type", () => {
            const gp = createTestProcessor();
            const props: ResolvedPanel = { type: "panel", id: "test", width: 100, height: 100, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawPanel).toHaveBeenCalledWith(props, {}, {});
        });

        it("should call drawSphere for sphere type", () => {
            const gp = createTestProcessor();
            const props: ResolvedSphere = { type: "sphere", id: "test", radius: 50, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawSphere).toHaveBeenCalledWith(props, {}, {});
        });

        it("should call drawCone for cone type", () => {
            const gp = createTestProcessor();
            const props: ResolvedCone = { type: "cone", id: "test", radius: 50, height: 100, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawCone).toHaveBeenCalledWith(props, {}, {});
        });

        it("should call drawPyramid for pyramid type", () => {
            const gp = createTestProcessor();
            const props: ResolvedPyramid = { type: "pyramid", id: "test", baseSize: 50, height: 100, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawPyramid).toHaveBeenCalledWith(props, {}, {});
        });

        it("should call drawCylinder for cylinder type", () => {
            const gp = createTestProcessor();
            const props: ResolvedCylinder = { type: "cylinder", id: "test", radius: 50, height: 100, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawCylinder).toHaveBeenCalledWith(props, {}, {});
        });

        it("should call drawTorus for torus type", () => {
            const gp = createTestProcessor();
            const props: ResolvedTorus = { type: "torus", id: "test", radius: 50, tubeRadius: 10, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawTorus).toHaveBeenCalledWith(props, {}, {});
        });

        it("should call drawElliptical for elliptical type", () => {
            const gp = createTestProcessor();
            const props: ResolvedElliptical = { type: "elliptical", id: "test", rx: 50, ry: 30, rz: 10, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawElliptical).toHaveBeenCalledWith(props, {}, {});
        });

        it("should call drawFloor for floor type", () => {
            const gp = createTestProcessor();
            const props: ResolvedFloor = { type: "floor", id: "test", width: 50, depth: 100, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawFloor).toHaveBeenCalledWith(props, {}, {});
        });

        it("should call drawText for text type", () => {
            const gp = createTestProcessor();
            const props: ResolvedText = { type: "text", id: "test", text: "hello", size: 16, position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits } };

            gp._test_renderElement(props, {} as ElementAssets<GraphicsBundle>, {} as ResolvedSceneState);

            expect(gp.drawText).toHaveBeenCalledWith(props, {}, {});
        });
    });

    describe("getCenterOffset", () => {
        it("should apply center offset during tree rendering", () => {
            const gp = createTestProcessor();
            const node: RenderTreeNode = {
                props: { type: "box" as const, id: "test", position: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits }, rotate: undefined },
                assets: {} as ElementAssets<GraphicsBundle>,
                children: [],
            };

            gp.drawTree(node, {} as ResolvedSceneState);

            expect(gp.translate).toHaveBeenCalledTimes(3);
        });
    });
});