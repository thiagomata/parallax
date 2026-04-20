import {ELEMENT_TYPES} from "../types.ts";
import type {
    AssetLoader,
    GraphicsBundle,
    RenderTreeNode,
    ResolvedBaseVisual,
    ResolvedBox,
    ResolvedCone,
    ResolvedCylinder,
    ResolvedElliptical,
    ResolvedFloor,
    ResolvedPanel,
    ResolvedPyramid,
    ResolvedSceneState,
    ResolvedSphere,
    ResolvedText,
    ResolvedTorus,
    Vector3,
    GraphicProcessor,
    ElementAssets,
} from "../types.ts";
import {vi} from "vitest";

export class MockGraphicProcessor<TBundle extends GraphicsBundle> implements GraphicProcessor<TBundle> {
    readonly loader: AssetLoader<TBundle> = {} as AssetLoader<TBundle>;

    setCameraTree = vi.fn();
    setCamera = vi.fn();
    setProjectionMatrix = vi.fn();

    drawBox = vi.fn();
    drawPanel = vi.fn();
    drawSphere = vi.fn();
    drawCone = vi.fn();
    drawPyramid = vi.fn();
    drawElliptical = vi.fn();
    drawCylinder = vi.fn();
    drawTorus = vi.fn();
    drawFloor = vi.fn();
    drawText = vi.fn();

    dist = vi.fn((v1: Vector3, v2: Vector3) => Math.sqrt(
        Math.pow(v2.x - v1.x, 2) +
        Math.pow(v2.y - v1.y, 2) +
        Math.pow(v2.z - v1.z, 2)
    ));
    map = vi.fn((v: number) => v);
    lerp = vi.fn((s: number, e: number, t: number) => s + (e - s) * t);
    millis = vi.fn(() => 0);
    deltaTime = vi.fn(() => 0);
    frameCount = vi.fn(() => 0);

    drawLabel = vi.fn();
    drawCrosshair = vi.fn();
    drawHUDText = vi.fn();
    text = vi.fn();

    drawTree = vi.fn((node: RenderTreeNode | null, state: ResolvedSceneState) => {
        if (!node) return;
        this.renderElement(node.props, node.assets, state);
        for (const child of node.children) {
            this.drawTree(child, state);
        }
    });

    private renderElement(props: ResolvedBaseVisual, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void {
        switch (props.type) {
            case ELEMENT_TYPES.BOX:
                this.drawBox(props as ResolvedBox, assets, state);
                break;
            case ELEMENT_TYPES.PANEL:
                this.drawPanel(props as ResolvedPanel, assets, state);
                break;
            case ELEMENT_TYPES.SPHERE:
                this.drawSphere(props as ResolvedSphere, assets, state);
                break;
            case ELEMENT_TYPES.CONE:
                this.drawCone(props as ResolvedCone, assets, state);
                break;
            case ELEMENT_TYPES.PYRAMID:
                this.drawPyramid(props as ResolvedPyramid, assets, state);
                break;
            case ELEMENT_TYPES.CYLINDER:
                this.drawCylinder(props as ResolvedCylinder, assets, state);
                break;
            case ELEMENT_TYPES.TORUS:
                this.drawTorus(props as ResolvedTorus, assets, state);
                break;
            case ELEMENT_TYPES.ELLIPTICAL:
                this.drawElliptical(props as ResolvedElliptical, assets, state);
                break;
            case ELEMENT_TYPES.FLOOR:
                this.drawFloor(props as ResolvedFloor, assets, state);
                break;
            case ELEMENT_TYPES.TEXT:
                this.drawText(props as ResolvedText, assets, state);
                break;
        }
    }
}

export const createMockGraphicProcessor = <TBundle extends GraphicsBundle>() => {
    return new MockGraphicProcessor<TBundle>();
};

export const createMockGraphicProcessorWithSpies = <TBundle extends GraphicsBundle>() => {
    const gp = new MockGraphicProcessor<TBundle>();
    return {
        graphicProcessor: gp,
        drawTreeSpy: gp.drawTree,
        drawBoxSpy: gp.drawBox,
        drawPanelSpy: gp.drawPanel,
    };
};