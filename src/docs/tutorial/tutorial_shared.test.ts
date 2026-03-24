import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
    createSketchInstance: vi.fn(),
    extractSketchFunction: vi.fn(),
    tutorialStepTemplate: vi.fn(),
}));

vi.mock("./sketch_engine.ts", () => ({
    DEFAULT_SKETCH_CONFIG: {
        width: 500,
        height: 400,
        paused: false,
    },
    sketchEngine: {
        createSketchInstance: mockState.createSketchInstance,
    },
}));

vi.mock("./sketch_engine.live.ts", () => ({
    extractSketchFunction: mockState.extractSketchFunction,
}));

vi.mock("./tutorial.template.ts", () => ({
    tutorialStepTemplate: mockState.tutorialStepTemplate,
}));

describe("tutorial_shared", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        mockState.createSketchInstance.mockReset();
        mockState.extractSketchFunction.mockReset();
        mockState.tutorialStepTemplate.mockReset();
        vi.restoreAllMocks();
    });

    it("returns early when the tutorial root is missing", async () => {
        const { initTutorial } = await import("./tutorial_shared.ts");

        await expect(
            initTutorial("c1", "Title", vi.fn() as any, "source", "explanation")
        ).toBeUndefined();

        expect(mockState.tutorialStepTemplate).not.toHaveBeenCalled();
        expect(mockState.createSketchInstance).not.toHaveBeenCalled();
    });

    it("hydrates a tutorial step, wires controls, and re-runs sketches", async () => {
        const root = document.createElement("div");
        root.id = "tutorial-root";
        document.body.appendChild(root);

        const step = document.createElement("main");
        step.id = "step-step-1";
        step.innerHTML = `
            <section class="canvas-side" id="canv-step-1">
                <div class="canvas-box"></div>
                <button class="fullscreen-btn" title="Fullscreen"></button>
            </section>
            <section class="code-side">
                <button class="play-btn" title="Run Code"></button>
                <button class="reset-btn" title="Reset Code"></button>
                <button class="copy-btn" title="Copy Code"></button>
                <div class="editor-box"><code contenteditable="true">export async function demo() { return { value: 1 }; }</code></div>
                <div class="console-panel"></div>
            </section>
            <button class="pause-btn" data-paused="false"></button>
            <div class="tab-btn" data-tab="code"></div>
            <section class="step-content" data-content="preview"></section>
            <section class="step-content" data-content="code"></section>
            <section class="step-content" data-content="learn"></section>
        `;

        mockState.tutorialStepTemplate.mockReturnValue(step);
        mockState.extractSketchFunction.mockReturnValue({
            fn: vi.fn().mockResolvedValue({ sceneClock: { getSettings: () => ({}) } }),
            fnName: "demo",
        });
        mockState.createSketchInstance
            .mockResolvedValueOnce({ currentP5: { loop: vi.fn(), noLoop: vi.fn() }, currentWorld: {} })
            .mockResolvedValueOnce({ currentP5: { loop: vi.fn(), noLoop: vi.fn() }, currentWorld: {} });

        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            void cb(0);
            return 1;
        });
        const clipboardWrite = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: clipboardWrite },
            configurable: true,
        });
        const fullscreen = vi.fn();
        (step.querySelector(".canvas-side") as HTMLElement).requestFullscreen = fullscreen as any;

        const { initTutorial } = await import("./tutorial_shared.ts");
        initTutorial("step-1", "Demo", vi.fn() as any, "source", "explanation");

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockState.tutorialStepTemplate).toHaveBeenCalledWith({
            containerId: "step-1",
            title: "Demo",
            source: "source",
            explanation: "explanation",
        });
        expect(root.querySelector("#step-step-1")).toBeTruthy();
        expect(mockState.createSketchInstance).toHaveBeenCalledTimes(1);

        const playBtn = step.querySelector(".play-btn") as HTMLButtonElement;
        playBtn.click();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockState.extractSketchFunction).toHaveBeenCalledWith("export async function demo() { return { value: 1 }; }");
        expect(mockState.createSketchInstance).toHaveBeenCalledTimes(2);

        const pauseBtn = step.querySelector(".pause-btn") as HTMLButtonElement;
        pauseBtn.click();
        expect(pauseBtn.dataset.paused).toBe("true");
        pauseBtn.click();
        expect(pauseBtn.dataset.paused).toBe("false");

        const copyBtn = step.querySelector(".copy-btn") as HTMLButtonElement;
        copyBtn.click();
        expect(clipboardWrite).toHaveBeenCalledWith("export async function demo() { return { value: 1 }; }");

        const fullscreenBtn = step.querySelector(".fullscreen-btn") as HTMLButtonElement;
        fullscreenBtn.click();
        expect(fullscreen).toHaveBeenCalled();

        raf.mockRestore();
    });
});
