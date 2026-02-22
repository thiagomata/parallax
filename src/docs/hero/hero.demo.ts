import {World} from "../../scene/world.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {
    type AssetLoader,
    DEFAULT_SETTINGS,
    ELEMENT_TYPES,
    PROJECTION_TYPES,
    WindowConfig
} from "../../scene/types.ts";

// libs
import p5 from 'p5';
import Prism from 'prismjs';

// Syntax Highlighting Support
import 'prismjs/themes/prism-tomorrow.css';
import '../../docs/style/style.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import '@fortawesome/fontawesome-free/css/all.css';
import {transform} from 'sucrase';

// Tutorial Steps
import {heroExample1} from "./hero_example_1.ts";
import heroExample1Code from './hero_example_1.ts?raw';
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {tutorialStepTemplate} from "../tutorial/tutorial.template.ts";


/**
 * We expose the engine to the window so the dynamic code can resolve types.
 */
Object.assign(window, {
    World,
    SceneManager: SceneClock, // Keeping alias for compatibility or renaming to SceneClock
    P5AssetLoader,
    P5GraphicProcessor,
    WindowConfig,      // Added: The new single source for window math
    ELEMENT_TYPES,
    PROJECTION_TYPES,  // Added: Needed for world.stage.setEye type matching
    DEFAULT_SETTINGS,
    p5,
    OrbitModifier,
    CenterFocusModifier
});
export interface SketchConfig {
    width: number;
    height: number;
    backgroundColor?: string;
    manager?: SceneClock,
    loader?: AssetLoader<P5Bundler>,
    paused: boolean,
}

export const DEFAULT_SKETCH_CONFIG: SketchConfig = {
    width: 500,
    height: 400,
    paused: false,
};

export type P5Sketch = (p: p5, config: SketchConfig) => void;

function toggleFS(id: string) {
    const element = document.getElementById(id);
    if (!element) return;

    const requestFullscreen =
        element.requestFullscreen?.bind(element) ||
        (element as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(element);

    if (!requestFullscreen) return;

    if (document.fullscreenElement === element) {
        document.exitFullscreen?.();
    } else {
        requestFullscreen();
    }
}

export function renderStep(
    containerId: string,
    title: string,
    initialSketch: P5Sketch,
    source: string,
    config: Partial<SketchConfig> = {}
) {
    const root = document.getElementById('tutorial-root');
    if (!root) return;

    let stepMain = document.getElementById(`step-${containerId}`);
    if (!stepMain) {
        stepMain = tutorialStepTemplate({ containerId, title, source });
        stepMain.id = `step-${containerId}`;
        root.appendChild(stepMain);
    } else {
        stepMain.innerHTML = tutorialStepTemplate({ containerId, title, source }).innerHTML;
    }

    const codeSide   = stepMain.querySelector('.code-side') as HTMLElement;
    const canvasSide = stepMain.querySelector('.canvas-side') as HTMLElement;

    const editorBox    = codeSide.querySelector('.editor-box') as HTMLElement;
    const consolePanel = codeSide.querySelector('.console-panel') as HTMLElement;

    const playBtn   = codeSide.querySelector('.play-btn') as HTMLButtonElement;
    const resetBtn  = codeSide.querySelector('.reset-btn') as HTMLButtonElement;
    const copyBtn   = codeSide.querySelector('.copy-btn') as HTMLButtonElement;
    const fsCodeBtn = codeSide.querySelector('.fullscreen-btn') as HTMLButtonElement;

    const canvasBox = canvasSide.querySelector('.canvas-box') as HTMLElement;
    const canvasWrapper = canvasSide.querySelector('.canvas-wrapper') as HTMLElement;

    canvasWrapper.style.width = '100%';
    canvasWrapper.style.height = '90%';
    const { width, height } = canvasWrapper.getBoundingClientRect();

    const pauseBtn    = canvasSide.querySelector('.pause-btn') as HTMLButtonElement;
    const fsCanvasBtn = canvasSide.querySelector('.fullscreen-btn') as HTMLButtonElement;

    const sketchConfig: SketchConfig = { ...DEFAULT_SKETCH_CONFIG, ...config, width, height, paused: false };
    let currentP5: p5 | null = null;

    const createSketch = (sketchFn: P5Sketch) => {
        if (currentP5) currentP5.remove();
        currentP5 = new p5((p: p5) => sketchFn(p, sketchConfig), canvasBox);
    };

    const executeUpdate = () => {
        consolePanel.style.display = 'block';
        consolePanel.innerHTML = '';

        try {
            const compiledCode = transform(editorBox.innerText, { transforms: ['typescript', 'imports'] }).code;

            const fnMatch = editorBox.innerText.match(/export\s+(?:const|function)\s+([a-zA-Z0-9_]+)/);
            if (!fnMatch) throw new Error('No exported function found.');

            const factory = new Function('require', 'exports', compiledCode);
            const fakeExports: any = {};
            const fakeRequire = () => window;

            factory(fakeRequire, fakeExports);
            createSketch(fakeExports[fnMatch[1]]);

            sketchConfig.paused = false;
            pauseBtn.dataset.paused = 'false';
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

            const log = document.createElement('div');
            log.className = 'log-entry info';
            log.textContent = `[Engine] Hydration successful.`;
            consolePanel.appendChild(log);
        } catch (e: any) {
            const log = document.createElement('div');
            log.className = 'log-entry info';
            log.style.color = 'var(--error)';
            log.textContent = `⚠️ Error: ${e.message}`;
            consolePanel.appendChild(log);
        }
    };

    playBtn.addEventListener('click', executeUpdate);

    resetBtn.addEventListener('click', () => {
        editorBox.innerHTML = `<pre class="language-typescript"><code>${Prism.highlight(source, Prism.languages.typescript, 'typescript')}</code></pre>`;
        executeUpdate();
    });

    copyBtn.addEventListener('click', () => navigator.clipboard.writeText(editorBox.innerText));
    fsCodeBtn.addEventListener('click', () => toggleFS(`step-${containerId}`));
    fsCanvasBtn.addEventListener('click', () => toggleFS(`canv-${containerId}`));

    pauseBtn.addEventListener('click', () => {
        if (!currentP5) return;
        const paused = pauseBtn.dataset.paused === 'true';

        if (paused) {
            currentP5.loop();
            sketchConfig.paused = false;
            pauseBtn.dataset.paused = 'false';
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            currentP5.noLoop();
            sketchConfig.paused = true;
            pauseBtn.dataset.paused = 'true';
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    createSketch(initialSketch);
}

renderStep('hero-demo-1', 'Hero Demo', (p: p5, config: SketchConfig) => heroExample1(p, config), heroExample1Code);
