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

    it("toggles fullscreen when canvas is not in fullscreen", async () => {
        const root = document.createElement("div");
        root.id = "tutorial-root";
        document.body.appendChild(root);

        const step = document.createElement("main");
        step.id = "step-step-1";
        step.innerHTML = `
            <section class="canvas-side" id="canv-step-1">
                <div class="canvas-box"></div>
                <button class="fullscreen-btn"></button>
            </section>
            <button class="pause-btn" data-paused="false"></button>
            <section class="code-side">
                <button class="play-btn"></button>
                <button class="reset-btn"></button>
                <button class="copy-btn"></button>
                <div class="editor-box"></div>
                <div class="console-panel"></div>
            </section>
        `;
        mockState.tutorialStepTemplate.mockReturnValue(step);
        mockState.createSketchInstance.mockResolvedValue({ currentP5: {}, currentWorld: {} });

        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            void cb(0);
            return 1;
        });

        const fullscreenFn = vi.fn().mockResolvedValue(undefined);
        (step.querySelector(".canvas-side") as HTMLElement).requestFullscreen = fullscreenFn as any;
        Object.defineProperty(document, "fullscreenElement", { value: null, configurable: true });

        const { initTutorial } = await import("./tutorial_shared.ts");
        initTutorial("step-1", "Demo", vi.fn() as any, "source", "explanation");

        await new Promise(resolve => setTimeout(resolve, 0));

        const btn = step.querySelector(".fullscreen-btn") as HTMLButtonElement;
        btn.click();
        expect(fullscreenFn).toHaveBeenCalled();

        raf.mockRestore();
    });

    it("exits fullscreen when already in fullscreen", async () => {
        const root = document.createElement("div");
        root.id = "tutorial-root";
        document.body.appendChild(root);

        const step = document.createElement("main");
        step.id = "step-step-1";
        step.innerHTML = `
            <section class="canvas-side" id="canv-step-1">
                <div class="canvas-box"></div>
                <button class="fullscreen-btn"></button>
            </section>
            <button class="pause-btn" data-paused="false"></button>
            <section class="code-side">
                <button class="play-btn"></button>
                <button class="reset-btn"></button>
                <button class="copy-btn"></button>
                <div class="editor-box"></div>
                <div class="console-panel"></div>
            </section>
        `;
        mockState.tutorialStepTemplate.mockReturnValue(step);
        mockState.createSketchInstance.mockResolvedValue({ currentP5: {}, currentWorld: {} });

        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            void cb(0);
            return 1;
        });

        const canvasSide = step.querySelector(".canvas-side") as HTMLElement;
        canvasSide.requestFullscreen = vi.fn().mockResolvedValue(undefined) as any;
        const exitFullscreen = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(document, "fullscreenElement", { value: canvasSide, configurable: true });
        Object.defineProperty(document, "exitFullscreen", { value: exitFullscreen, configurable: true });

        const { initTutorial } = await import("./tutorial_shared.ts");
        initTutorial("step-1", "Demo", vi.fn() as any, "source", "explanation");

        await new Promise(resolve => setTimeout(resolve, 0));

        const btn = step.querySelector(".fullscreen-btn") as HTMLButtonElement;
        btn.click();
        expect(exitFullscreen).toHaveBeenCalled();

        raf.mockRestore();
    });

    it("switches tabs and shows correct content sections", async () => {
        const root = document.createElement("div");
        root.id = "tutorial-root";
        document.body.appendChild(root);

        const step = document.createElement("main");
        step.id = "step-step-1";
        step.innerHTML = `
            <div class="tab-btn active" data-tab="preview"></div>
            <div class="tab-btn" data-tab="code"></div>
            <div class="tab-btn" data-tab="learn"></div>
            <section class="step-content active" data-content="preview"></section>
            <section class="step-content" data-content="code"></section>
            <section class="step-content" data-content="learn"></section>
            <button class="pause-btn" data-paused="false"></button>
            <section class="code-side">
                <button class="play-btn"></button>
                <button class="reset-btn"></button>
                <button class="copy-btn"></button>
                <div class="editor-box"></div>
                <div class="console-panel"></div>
            </section>
        `;
        mockState.tutorialStepTemplate.mockReturnValue(step);
        mockState.createSketchInstance.mockResolvedValue({ currentP5: {}, currentWorld: {} });

        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            void cb(0);
            return 1;
        });

        const { initTutorial } = await import("./tutorial_shared.ts");
        initTutorial("step-1", "Demo", vi.fn() as any, "source", "explanation");

        await new Promise(resolve => setTimeout(resolve, 0));

        const tabBtns = step.querySelectorAll(".tab-btn") as NodeListOf<HTMLButtonElement>;
        const contents = step.querySelectorAll(".step-content");

        expect(contents[0].classList.contains("active")).toBe(true);
        expect(contents[1].classList.contains("active")).toBe(false);
        expect(contents[2].classList.contains("active")).toBe(false);

        tabBtns[1].click();
        expect(tabBtns[1].classList.contains("active")).toBe(true);
        expect(contents[1].classList.contains("active")).toBe(true);

        tabBtns[2].click();
        expect(tabBtns[2].classList.contains("active")).toBe(true);
        expect(contents[2].classList.contains("active")).toBe(true);

        raf.mockRestore();
    });

    it("reset button restores original source with Prism highlight", async () => {
        const root = document.createElement("div");
        root.id = "tutorial-root";
        document.body.appendChild(root);

        const step = document.createElement("main");
        step.id = "step-step-1";
        step.innerHTML = `
            <section class="canvas-side" id="canv-step-1">
                <div class="canvas-box"></div>
            </section>
            <section class="code-side">
                <button class="play-btn"></button>
                <button class="reset-btn"></button>
                <button class="copy-btn"></button>
                <div class="editor-box"><code class="language-typescript" contenteditable="true">edited code</code></div>
                <div class="console-panel"></div>
            </section>
            <button class="pause-btn" data-paused="false"></button>
        `;
        mockState.tutorialStepTemplate.mockReturnValue(step);
        mockState.createSketchInstance.mockResolvedValue({ currentP5: { loop: vi.fn(), noLoop: vi.fn() }, currentWorld: {} });

        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            void cb(0);
            return 1;
        });

        const { initTutorial } = await import("./tutorial_shared.ts");
        initTutorial("step-1", "Demo", vi.fn() as any, "original source", "explanation");

        await new Promise(resolve => setTimeout(resolve, 0));

        const resetBtn = step.querySelector(".reset-btn") as HTMLButtonElement;
        resetBtn.click();
        await new Promise(resolve => setTimeout(resolve, 0));

        const codeEl = step.querySelector(".editor-box code");
        expect(codeEl?.innerHTML).toContain("original source");

        raf.mockRestore();
    });

    it("shows error in console panel when executeUpdate fails", async () => {
        const root = document.createElement("div");
        root.id = "tutorial-root";
        document.body.appendChild(root);

        const step = document.createElement("main");
        step.id = "step-step-1";
        step.innerHTML = `
            <section class="canvas-side" id="canv-step-1">
                <div class="canvas-box"></div>
            </section>
            <section class="code-side">
                <button class="play-btn"></button>
                <button class="reset-btn"></button>
                <button class="copy-btn"></button>
                <div class="editor-box"><code>export async function demo() {}</code></div>
                <div class="console-panel"></div>
            </section>
            <button class="pause-btn" data-paused="false"></button>
        `;
        mockState.tutorialStepTemplate.mockReturnValue(step);
        mockState.extractSketchFunction.mockImplementation(() => {
            throw new Error("Parse error");
        });
        mockState.createSketchInstance.mockResolvedValue({ currentP5: { loop: vi.fn(), noLoop: vi.fn() }, currentWorld: {} });

        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            void cb(0);
            return 1;
        });

        const { initTutorial } = await import("./tutorial_shared.ts");
        initTutorial("step-1", "Demo", vi.fn() as any, "source", "explanation");

        await new Promise(resolve => setTimeout(resolve, 0));

        const playBtn = step.querySelector(".play-btn") as HTMLButtonElement;
        playBtn.click();
        await new Promise(resolve => setTimeout(resolve, 0));

        const consolePanel = step.querySelector(".console-panel") as HTMLElement;
        expect(consolePanel.innerHTML).toContain("Parse error");

        raf.mockRestore();
    });

    it("pause button does nothing when currentP5 is missing", async () => {
        const root = document.createElement("div");
        root.id = "tutorial-root";
        document.body.appendChild(root);

        const step = document.createElement("main");
        step.id = "step-step-1";
        step.innerHTML = `
            <section class="canvas-side" id="canv-step-1">
                <div class="canvas-box"></div>
            </section>
            <button class="pause-btn" data-paused="false"></button>
            <section class="code-side">
                <button class="play-btn"></button>
                <button class="reset-btn"></button>
                <button class="copy-btn"></button>
                <div class="editor-box"></div>
                <div class="console-panel"></div>
            </section>
        `;
        mockState.tutorialStepTemplate.mockReturnValue(step);
        mockState.createSketchInstance.mockResolvedValue({ currentP5: null, currentWorld: {} });

        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            void cb(0);
            return 1;
        });

        const { initTutorial } = await import("./tutorial_shared.ts");
        initTutorial("step-1", "Demo", vi.fn() as any, "source", "explanation");

        await new Promise(resolve => setTimeout(resolve, 0));

        const pauseBtn = step.querySelector(".pause-btn") as HTMLButtonElement;
        expect(pauseBtn.dataset.paused).toBe("false");
        pauseBtn.click();
        expect(pauseBtn.dataset.paused).toBe("false");

        raf.mockRestore();
    });

    it("passes faceConfig to createSketchInstance", async () => {
        const root = document.createElement("div");
        root.id = "tutorial-root";
        document.body.appendChild(root);

        const step = document.createElement("main");
        step.id = "step-step-1";
        step.innerHTML = `
            <section class="canvas-side" id="canv-step-1">
                <div class="canvas-box"></div>
            </section>
            <button class="pause-btn" data-paused="false"></button>
            <section class="code-side">
                <button class="play-btn"></button>
                <button class="reset-btn"></button>
                <button class="copy-btn"></button>
                <div class="editor-box"></div>
                <div class="console-panel"></div>
            </section>
        `;
        mockState.tutorialStepTemplate.mockReturnValue(step);
        mockState.createSketchInstance.mockResolvedValue({ currentP5: {}, currentWorld: {} });

        const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            void cb(0);
            return 1;
        });

        const { initTutorial } = await import("./tutorial_shared.ts");
        initTutorial("step-1", "Demo", vi.fn() as any, "source", "explanation", {}, { mirror: true });

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockState.createSketchInstance).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            { faceConfig: { mirror: true } }
        );

        raf.mockRestore();
    });
});
