import { BaseGraphicProcessor } from "../graphic_processor.ts";
import { vi } from "vitest";
import type { AssetLoader, GraphicsBundle, Vector3 } from "../types.ts";

export class MockGraphicProcessor<TBundle extends GraphicsBundle>
    extends BaseGraphicProcessor<TBundle>
{
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

    push = vi.fn();
    pop = vi.fn();
    translate = vi.fn();
    rotate3 = vi.fn();

    _test_renderElement(props: any, assets: any, state: any) {
        return this.renderElement(props, assets, state);
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