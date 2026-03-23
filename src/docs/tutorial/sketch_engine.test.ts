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

        const sketchFn = vi.fn().mockResolvedValue({ sceneClock: { getSettings: () => ({}) } });
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

        const nextSketchFn = vi.fn().mockResolvedValue({ sceneClock: { getSettings: () => ({}) } });
        await engine.createSketchInstance(nextSketchFn as any, config as any, canvasBox, "container-1");

        expect(mockState.instances[0].noLoop).toHaveBeenCalled();
        expect(mockState.instances[0].remove).toHaveBeenCalled();
        expect(engine.getP5Instance("container-1")).toBeDefined();
        expect(nextSketchFn).toHaveBeenCalledTimes(1);

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
        await expect(fn({} as any, {} as any)).resolves.toEqual({ value: 42 });
    });
});
