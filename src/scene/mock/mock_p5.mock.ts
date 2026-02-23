import {vi} from "vitest";

export function createMockP5() {
    return {
        fill: vi.fn(),
        box: vi.fn(),
        sphere: vi.fn(),
        plane: vi.fn(),
        pop: vi.fn(),
        loadImage: vi.fn(
            (_args, success, _failure) => {
                success()
            }
        ),
        loadFont: vi.fn(
            (_args, success, _failure) => {
                success()
            }
        ),
        createCanvas: vi.fn(),
        background: vi.fn(),
        camera: vi.fn(),
        dist: vi.fn(
            (v1x, v1y, v1z, v2x, v2y, v2z) => {
                return Math.sqrt(
                    Math.pow(v2x - v1x, 2) + Math.pow(v2y - v1y, 2) + Math.pow(v2z - v1z, 2)
                )
            }
        ),
        push: vi.fn(),
        translate: vi.fn(),
        millis: vi.fn(() => 0),
        deltaTime: vi.fn(() => 16),
        frameCount: vi.fn(() => 60),
        rotateY: vi.fn(),
        rotateX: vi.fn(),
        rotateZ: vi.fn(),
        strokeWeight: vi.fn(),
        strokeWidth: vi.fn(),
        noStroke: vi.fn(),
        stroke: vi.fn(),
        map: vi.fn(),
        noTint: vi.fn(),
        noFill: vi.fn(),
        line: vi.fn(),
        texture: vi.fn(),
        textureMode: vi.fn(),
        textFont: vi.fn(),
        textSize: vi.fn(),
        textColor: vi.fn(),
        textAlign: vi.fn(),
        text: vi.fn(),
        tint: vi.fn(),
        cone: vi.fn(),
        cylinder: vi.fn(),
        torus: vi.fn(),
        ellipsoid: vi.fn(),
        beginShape: vi.fn(),
        vertex: vi.fn(),
        endShape: vi.fn(),
        HALF_PI: Math.PI / 2,
        
        WEBGL: 'webgl',
        NORMAL: 'normal',
        setup: undefined as any,
        draw: undefined as any,
        createCapture: vi.fn(),
        lerp: vi.fn(),
        frustum: vi.fn(),
    };
}