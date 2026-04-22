import {vi} from "vitest";

export function createMockCapture() {
    return {
        size: vi.fn(),
        hide: vi.fn(),
        elt: { 
            readyState: 4, 
            onloadedmetadata: null, 
            onerror: null 
        },
        play: vi.fn(),
    };
}

export function createMockVideo() {
    const listeners: Record<string, Function[]> = {};
    const elt = {
        readyState: 0,
        currentTime: 0,
        paused: false,
        ended: false,
    videoWidth: 1920,
    videoHeight: 1080,
        onloadedmetadata: null,
        onerror: null,
        playsInline: true,
        preload: "auto",
        addEventListener: vi.fn((event: string, cb: Function) => {
            listeners[event] = listeners[event] ?? [];
            listeners[event].push(cb);
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn((event: Event) => {
            for (const cb of listeners[event.type] ?? []) {
                cb(event);
            }
            return true;
        }),
    };
    return {
        elt,
        src: "",
        loop: vi.fn(),
        pause: vi.fn(() => {
            elt.paused = true;
        }),
        autoplay: vi.fn(),
        volume: vi.fn(),
        hide: vi.fn(),
        play: vi.fn(() => {
            elt.paused = false;
            return Promise.resolve();
        }),
    };
}

export function createMockP5(): any {
    const mockCapture = createMockCapture();
    const mockVideo = createMockVideo();

    return {
        VIDEO: 'video',
        createCapture: vi.fn().mockReturnValue(mockCapture),
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
        blendMode: vi.fn(),
        BLEND: "BLEND",
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
        map: vi.fn((value, start1, stop1, start2, stop2) => {
            return start2 + ((value - start1) * (stop2 - start2)) / (stop1 - start1);
        }),
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
        setup: vi.fn(),
        draw: vi.fn(),
        
        createVideo: vi.fn().mockImplementation((url) => {
            mockVideo.src = Array.isArray(url) ? (url[0] ?? "") : (url ?? "");
            return mockVideo;
        }),
        _mockCapture: mockCapture,
        _mockVideo: mockVideo,
        lerp: vi.fn((start, stop, amt) => start + (stop - start) * amt),
        frustum: vi.fn(),
        loop: vi.fn(),
        noLoop: vi.fn(),
    };
}