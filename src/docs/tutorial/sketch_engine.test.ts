import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
    instances: [] as Array<{
        noLoop: ReturnType<typeof vi.fn>;
        remove: ReturnType<typeof vi.fn>;
        resizeCanvas: ReturnType<typeof vi.fn>;
        loop: ReturnType<typeof vi.fn>;
        canvas: HTMLCanvasElement;
        _setupDone: boolean;
    }>,
}));

vi.mock("p5", () => {
    class MockP5 {
        public noLoop = vi.fn();
        public remove = vi.fn();
        public resizeCanvas = vi.fn();
        public loop = vi.fn();
        public redraw = vi.fn();
        public setup = vi.fn();
        public draw = vi.fn();
        public canvas: HTMLCanvasElement;
        public _setupDone = true;

        constructor(sketchFn: (p: MockP5) => void, _canvasBox?: HTMLElement) {
            this.canvas = document.createElement("canvas");
            this.canvas.getContext = vi.fn().mockReturnValue(null) as any;
            sketchFn(this);
            mockState.instances.push(this);
        }
    }

    return { default: MockP5 };
});

describe("Sketch bootstrap modules", () => {
    beforeEach(() => {
        mockState.instances.length = 0;
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it("registers fullscreen listeners when SketchEngine is constructed", async () => {
        const addDocumentListener = vi.spyOn(document, "addEventListener");
        const addWindowListener = vi.spyOn(window, "addEventListener");

        await import("./sketch_engine.ts");

        expect(addDocumentListener).toHaveBeenCalledWith("fullscreenchange", expect.any(Function));
        expect(addDocumentListener).toHaveBeenCalledWith("webkitfullscreenchange", expect.any(Function));
        expect(addWindowListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    it("creates a sketch instance, resizes the canvas, and reuses cleanup", async () => {
        const { SketchEngine, DEFAULT_SKETCH_CONFIG } = await import("./sketch_engine.ts");
        const engine = new SketchEngine();
        const canvasBox = document.createElement("div");

        Object.defineProperty(canvasBox, "clientWidth", { value: 640, configurable: true });
        Object.defineProperty(canvasBox, "clientHeight", { value: 480, configurable: true });

        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            cb(0);
            return 1;
        });

        const sketchFn = vi.fn().mockResolvedValue({ sceneClock: { getSettings: () => ({}) }, resizeViewport: vi.fn() });
        const config = {
            ...DEFAULT_SKETCH_CONFIG,
            width: 1,
            height: 1,
            paused: false,
        };

        const first = await engine.createSketchInstance(sketchFn as any, config as any, canvasBox, "container-1");
        expect(first.currentP5).toBeDefined();
        expect(sketchFn).toHaveBeenCalledTimes(1);
        expect(mockState.instances[0].resizeCanvas).toHaveBeenCalledWith(640, 480, true);
        expect(config.width).toBe(640);
        expect(config.height).toBe(480);

        const nextSketchFn = vi.fn().mockResolvedValue({ sceneClock: { getSettings: () => ({}) }, resizeViewport: vi.fn() });
        await engine.createSketchInstance(nextSketchFn as any, config as any, canvasBox, "container-1");

        expect(mockState.instances[0].noLoop).toHaveBeenCalled();
        expect(mockState.instances[0].remove).toHaveBeenCalled();
        expect(engine.getP5Instance("container-1")).toBeDefined();
        expect(nextSketchFn).toHaveBeenCalledTimes(1);

        raf.mockRestore();
    });

    it("sends sceneready on the canvas box once the scene's assets have loaded", async () => {
        const { SketchEngine, DEFAULT_SKETCH_CONFIG } = await import("./sketch_engine.ts");
        const engine = new SketchEngine();
        const canvasBox = document.createElement("div");
        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => { cb(0); return 1; });
        let assetsLoaded!: () => void;
        const world = { sceneClock: { getSettings: () => ({}) }, resizeViewport: vi.fn(), whenAssetsLoaded: () => new Promise<void>(resolve => { assetsLoaded = resolve; }) };
        const ready = vi.fn();
        canvasBox.addEventListener("sceneready", ready);

        await engine.createSketchInstance(vi.fn().mockResolvedValue(world) as any, { ...DEFAULT_SKETCH_CONFIG } as any, canvasBox, "ready-box");
        await Promise.resolve();
        expect(ready).not.toHaveBeenCalled(); // still loading

        assetsLoaded();
        await Promise.resolve();
        await Promise.resolve();
        expect(ready).toHaveBeenCalledTimes(1);
        raf.mockRestore();
    });

    it("skips sceneready for a sketch that was replaced before its assets loaded", async () => {
        const { SketchEngine, DEFAULT_SKETCH_CONFIG } = await import("./sketch_engine.ts");
        const engine = new SketchEngine();
        const canvasBox = document.createElement("div");
        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => { cb(0); return 1; });
        let firstLoaded!: () => void;
        const first = { sceneClock: { getSettings: () => ({}) }, resizeViewport: vi.fn(), whenAssetsLoaded: () => new Promise<void>(resolve => { firstLoaded = resolve; }) };
        const second = { sceneClock: { getSettings: () => ({}) }, resizeViewport: vi.fn(), whenAssetsLoaded: () => new Promise<void>(() => {}) };
        const ready = vi.fn();
        canvasBox.addEventListener("sceneready", ready);

        await engine.createSketchInstance(vi.fn().mockResolvedValue(first) as any, { ...DEFAULT_SKETCH_CONFIG } as any, canvasBox, "rerun-box");
        await engine.createSketchInstance(vi.fn().mockResolvedValue(second) as any, { ...DEFAULT_SKETCH_CONFIG } as any, canvasBox, "rerun-box");
        firstLoaded();
        await Promise.resolve();
        await Promise.resolve();

        expect(ready).not.toHaveBeenCalled();
        raf.mockRestore();
    });

    it("fits fullscreen canvases to the box aspect ratio and resizes the world", async () => {
        const { SketchEngine, DEFAULT_SKETCH_CONFIG } = await import("./sketch_engine.ts");
        const engine = new SketchEngine();
        const canvasBox = document.createElement("div");
        canvasBox.dataset.aspectRatio = "2";
        Object.defineProperty(canvasBox, "clientWidth", { value: 640, configurable: true });
        Object.defineProperty(canvasBox, "clientHeight", { value: 480, configurable: true });
        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => { cb(0); return 1; });
        const world = { sceneClock: { getSettings: () => ({}) }, resizeViewport: vi.fn() };
        await engine.createSketchInstance(vi.fn().mockResolvedValue(world) as any, { ...DEFAULT_SKETCH_CONFIG, paused: false } as any, canvasBox, "fullscreen-box");
        const instance = mockState.instances[0] as any;
        instance.resizeCanvas.mockClear();

        Object.defineProperty(document, "fullscreenElement", { value: canvasBox, configurable: true });
        Object.defineProperty(window, "innerWidth", { value: 1200, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
        document.dispatchEvent(new Event("fullscreenchange"));

        // 1200x800 screen, 2:1 box: full width, letterboxed height.
        expect(instance.resizeCanvas).toHaveBeenCalledWith(1200, 600, true);
        expect(world.resizeViewport).toHaveBeenCalledWith(1200, 600);

        Object.defineProperty(document, "fullscreenElement", { value: null, configurable: true });
        raf.mockRestore();
    });

    it("extracts tutorial sketch functions from source strings", async () => {
        const { extractSketchFunction } = await import("./sketch_engine.live.ts");

        const { fn, fnName } = extractSketchFunction(`
            export async function demoSketch() {
                return { value: 42 };
            }
        `);

        expect(fnName).toBe("demoSketch");
        expect(fn({} as any, {} as any)).resolves.toEqual({value: 42});
    });
});
