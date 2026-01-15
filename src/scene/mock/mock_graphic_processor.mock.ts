import type {AssetLoader, GraphicsBundle, SceneState, Vector3} from "../types.ts";
import {vi} from "vitest";

export const createMockGraphicProcessor = <TBundle extends GraphicsBundle>(_mockState: SceneState | null = null) => {

    return {
        text: vi.fn(),
        loader: {} as AssetLoader<TBundle>,
        setCamera: vi.fn(),
        push: vi.fn(),
        pop: vi.fn(),
        translate: vi.fn(),
        rotateX: vi.fn(),
        rotateY: vi.fn(),
        rotateZ: vi.fn(),
        fill: vi.fn(),
        noFill: vi.fn(),
        stroke: vi.fn(),
        noStroke: vi.fn(),
        drawBox: vi.fn(),
        plane: vi.fn(),
        drawPanel: vi.fn(),
        dist: vi.fn(
            (v1: Vector3, v2: Vector3) => Math.sqrt(
                Math.pow(v2.x - v1.x, 2) +
                Math.pow(v2.y - v1.y, 2) +
                Math.pow(v2.z - v1.z, 2)
            )
        ),
        map: vi.fn(
            (v, _s1, _st1, _s2, _st2) => v
        ),
        lerp: vi.fn(
            (s, e, t) => s + (e - s) * t
        ),
        drawLabel: vi.fn(),
        drawText: vi.fn(),
        drawCrosshair: vi.fn(),
        drawHUDText: vi.fn(),
        drawPlane: vi.fn(),
        drawSphere: vi.fn(),
        drawCone: vi.fn(),
        drawPyramid: vi.fn(),
        drawElliptical: vi.fn(),
        drawCylinder: vi.fn(),
        drawTorus: vi.fn(),
        drawFloor: vi.fn(),
        millis: vi.fn(),
        deltaTime: vi.fn(),
        frameCount: vi.fn()
    }
};