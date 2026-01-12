import {vi} from "vitest";

export function createMockP5() {
    let mockP5 = {
        fill: vi.fn(),
        box: vi.fn(),
        pop: vi.fn(),
        loadImage: vi.fn(),
        loadFont: vi.fn(),
        createCanvas: vi.fn(),
        background: vi.fn(),
        camera: vi.fn(),
        dist: vi.fn(),
        push: vi.fn(),
        translate: vi.fn(),
        millis: vi.fn(),
        rotateY: vi.fn(),
        rotateX: vi.fn(),
        rotateZ: vi.fn(),
        strokeWeight: vi.fn(),
        strokeWidth: vi.fn(),
        noStroke: vi.fn(),
        stroke: vi.fn(),
        noTint: vi.fn(),
        noFill: vi.fn(),
        line: vi.fn(),
        texture: vi.fn(),
        textureMode: vi.fn(),
        textFont: vi.fn(),
        textSize: vi.fn(),
        textColor: vi.fn(),
        text: vi.fn(),
        tint: vi.fn(),
        WEBGL: 'webgl',
        NORMAL: 'normal',
        setup: undefined as any,
        draw: undefined as any,
    };
    mockP5.millis.mockReturnValue(0);
    return mockP5;
}