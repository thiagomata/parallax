import {World} from "../../scene/world.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {ElementResolver} from "../../scene/resolver/element_resolver.ts"; // New Manifest-compliant resolver
import {HeadTrackingModifier} from "../../scene/modifiers/head_tracking_modifier.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {ASSET_STATUS, DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";

// libs
import p5 from 'p5';
import Prism from 'prismjs';

// Styles & Highlighting
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import '../style/style.css';

// Tutorial Steps
import {tutorial_1} from './tutorial_1.ts';
import step1Source from './tutorial_1.ts?raw';
import {tutorial_2} from './tutorial_2.ts';
import step2Source from './tutorial_2.ts?raw';
import {tutorial_3} from './tutorial_3.ts';
import step3Source from './tutorial_3.ts?raw';
import {tutorial_4} from './tutorial_4.ts';
import step4Source from './tutorial_4.ts?raw';
import {tutorial_5} from './tutorial_5.ts';
import step5Source from './tutorial_5.ts?raw';
import {tutorial_6} from "./tutorial_6.ts";
import step6Source from './tutorial_6.ts?raw';
import {tutorial_7} from "./tutorial_7.ts";
import step7Source from './tutorial_7.ts?raw';

export interface SketchConfig {
    width: number;
    height: number;
    backgroundColor?: string;
    manager?: SceneClock,
    cameraModifier?: HeadTrackingModifier,
    loader?: P5AssetLoader,
    paused: boolean,
}

export const DEFAULT_SKETCH_CONFIG: SketchConfig = {
    width: 500,
    height: 400,
    paused: false,
};

export type P5Sketch = (p: p5, config: SketchConfig) => void;


/**
 * ARCHITECTURAL EXPOSURE
 * We bind the core engine classes to the window so the transpiled
 * 'live-editor' code can find them via the fake 'require'.
 */
Object.assign(window, {
    p5,
    World,
    SceneManager: SceneClock,
    CameraModifier: HeadTrackingModifier,
    P5AssetLoader,
    P5GraphicProcessor,
    OrbitModifier,
    CenterFocusModifier,
    LookAtEffect,
    ELEMENT_TYPES,
    DEFAULT_SETTINGS: DEFAULT_SCENE_SETTINGS,
    ASSET_STATUS,
    DEFAULT_SKETCH_CONFIG,
    resolver: new ElementResolver({}),
});

import { transform } from 'sucrase';
import {tutorialStepTemplate} from "./tutorial.template.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {LookAtEffect} from "../../scene/effects/look_at_effect.ts";

function toggleFS(id: string) {
    const element = document.getElementById(id);
    if (!element) return;

    // Combine standard and vendor-prefixed fullscreen
    const requestFullscreen =
        element.requestFullscreen?.bind(element) ||
        (element as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(element);

    if (!requestFullscreen) return; // Nothing to do if unsupported

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

    // --- create or reuse the step container ---
    let stepMain = document.getElementById(`step-${containerId}`);
    if (!stepMain) {
        stepMain = tutorialStepTemplate({ containerId, title, source });
        stepMain.id = `step-${containerId}`;
        root.appendChild(stepMain);
    } else {
        // replace inner content to avoid duplicates
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

    // --- config/state for this step ---
    const sketchConfig: SketchConfig = { ...DEFAULT_SKETCH_CONFIG, ...config, width, height, paused: false };

    // --- track current p5 instance ---
    let currentP5: p5 | null = null;

    const createSketch = (sketchFn: P5Sketch) => {
        // remove old instance
        if (currentP5) currentP5.remove();

        // create new p5
        currentP5 = new p5((p: p5) => sketchFn(p, sketchConfig), canvasBox);
    };

    // --- execute update (compile/run) ---
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

            // reset pause button
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

    // --- button listeners ---
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

    // --- initially create sketch ---
    createSketch(initialSketch);
}

// Initialize the updated Curriculum
renderStep('tutorial-1', '1. The Foundation (Registration)', tutorial_1, step1Source);
renderStep('tutorial-2', '2. Animation (Temporal Phase)', tutorial_2, step2Source);
renderStep('tutorial-3', '3. Movement (Spatial Orbit)', tutorial_3, step3Source);
renderStep('tutorial-4', '4. Camera (Modifiers)', tutorial_4, step4Source);
renderStep('tutorial-5', '5. Textures & Fonts (Hydration)', tutorial_5, step5Source);
renderStep('tutorial-6', '6. Integrated Scene (Hybrid Props)', tutorial_6, step6Source);
renderStep('tutorial-7', '7. Head Tracking', tutorial_7, step7Source);
// renderStep('tutorial-8', '8. Billboard', tutorial_8, step8Source);
// renderStep('tutorial-9', '9. Follow Object', tutorial_9, step9Source);