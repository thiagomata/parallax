import {World} from "../../scene/world.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {ElementResolver} from "../../scene/resolver/element_resolver.ts"; // New Manifest-compliant resolver
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {
    ASSET_STATUS,
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES,
    type DataProviderLib,
    type EffectLib, type ProjectionEffectLib
} from "../../scene/types.ts";

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
import {tutorial_8} from "./tutorial_8.ts";
import step8Source from './tutorial_8.ts?raw';
import {tutorial_9} from "./tutorial_9.ts";
import step9Source from './tutorial_9.ts?raw';
import {tutorial_10} from "./tutorial_10.ts";
import step10Source from './tutorial_10.ts?raw';

export interface SketchConfig {
    width: number;
    height: number;
    backgroundColor?: string;
    clock?: SceneClock,
    loader?: P5AssetLoader,
    paused: boolean,
}

export const DEFAULT_SKETCH_CONFIG: SketchConfig = {
    width: 500,
    height: 400,
    paused: false,
};

export type P5Sketch = (p: p5, config: SketchConfig) => World<P5Bundler, EffectLib, ProjectionEffectLib, DataProviderLib>;


/**
 * ARCHITECTURAL EXPOSURE
 * We bind the core engine classes to the window so the transpiled
 * 'live-editor' code can find them via the fake 'require'.
 */
Object.assign(window, {
    p5,
    World,
    WorldSettings,
    SceneClock: SceneClock,
    // CameraModifier: HeadTrackingModifier,
    CenterFocusModifier: CenterFocusModifier,
    P5AssetLoader,
    P5GraphicProcessor,
    OrbitModifier,
    // HeadTrackingModifier,
    LookAtEffect,
    ELEMENT_TYPES,
    DEFAULT_SETTINGS: DEFAULT_SCENE_SETTINGS,
    ASSET_STATUS,
    DEFAULT_SKETCH_CONFIG,
    DEFAULT_SCENE_SETTINGS,
    resolver: new ElementResolver({}),
});

import { transform } from 'sucrase';
import {tutorialStepTemplate} from "./tutorial.template.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {LookAtEffect} from "../../scene/effects/look_at_effect.ts";
import {WorldSettings} from "../../scene/world_settings.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";

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

    let stepMain = document.getElementById(`step-${containerId}`);
    if (!stepMain) {
        stepMain = tutorialStepTemplate({ containerId, title, source });
        stepMain.id = `step-${containerId}`;
        root.appendChild(stepMain);
    } else {
        // replace inner content to avoid duplicates
        stepMain.innerHTML = tutorialStepTemplate({ containerId, title, source }).innerHTML;
    }

    // Tab switching logic
    const tabButtons = stepMain.querySelectorAll('.tab-btn');
    const tabContents = stepMain.querySelectorAll('.step-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            
            // Update buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update content
            tabContents.forEach(content => {
                if (content.getAttribute('data-content') === tab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    const codeSide   = stepMain.querySelector('.code-side') as HTMLElement;
    const canvasSide = stepMain.querySelector('.canvas-side') as HTMLElement;

    canvasSide.style.width = '100%';

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
    let currentWorld: World<any, any, any, any> | null = null;

    const cleanupSketch = () => {
        if (!currentP5) return;
        
        try {
            // 1. Stop the loop first
            currentP5.noLoop();
            
            // 2. Try to release WebGL context explicitly
            const p5WithCanvas = currentP5 as p5 & { canvas: HTMLCanvasElement | undefined };
            const canvas = p5WithCanvas.canvas;
            if (canvas) {
                const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                if (gl) {
                    const loseExt = gl.getExtension('WEBGL_lose_context');
                    if (loseExt) {
                        loseExt.loseContext();
                    }
                }
            }
            
            // 3. Remove p5 instance
            currentP5.remove();
            
            // 4. Clear canvas from DOM
            if (canvas?.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        } catch (e) {
            console.warn(`[Tutorial ${containerId}] Error during cleanup:`, e);
        }
        
        currentP5 = null;
        currentWorld = null;
    };

    const createSketch = (sketchFn: P5Sketch) => {
        // Clean up old instance properly before creating new one
        cleanupSketch();

        // create new p5 with error handling
        currentP5 = new p5((p: p5) => {
            // Override _draw to catch errors
            const originalDraw = p.draw;
            p.draw = function(...args: unknown[]) {
                try {
                    return originalDraw.call(this, ...args as []);
                } catch (e) {
                    console.error(`[Tutorial ${containerId}] Error in draw:`, e);
                    // Try to recover by recreating
                    p.noLoop();
                }
            };

            const world = sketchFn(p, sketchConfig);
            currentWorld = world;
            return world;
        }, canvasBox);
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
            log.textContent = `Error: ${e.message}`;
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

    // Handle fullscreen changes - resize canvas to match new dimensions
    let isInFullscreenTransition = false;

    const handleResize = () => {
        if (!currentP5 || isInFullscreenTransition) return;
        
        const newRect = canvasWrapper.getBoundingClientRect();
        const newWidth = Math.floor(newRect.width);
        const newHeight = Math.floor(newRect.height);
        
        if (newWidth > 0 && newHeight > 0) {
            currentP5.resizeCanvas(newWidth, newHeight);
            sketchConfig.width = newWidth;
            sketchConfig.height = newHeight;
            
            // Also update the World scene with new dimensions
            if (currentWorld) {
                currentWorld.updateWindowConfig(newWidth, newHeight);
            }
        }
    };

    // Fullscreen change handler
    document.addEventListener('fullscreenchange', () => {
        isInFullscreenTransition = true;
        setTimeout(() => {
            handleResize();
            isInFullscreenTransition = false;
        }, 100);
    });

    // Window resize handler
    window.addEventListener('resize', handleResize);

    // Pause scene when not visible in viewport (performance optimization)
    // Use simple noLoop/loop like the manual pause button - avoids WebGL context issues
    let wasVisible = true;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!currentP5) return;
            
            if (entry.isIntersecting) {
                if (!wasVisible) {
                    console.log(`[Tutorial ${containerId}] RESUME - visible`);
                    currentP5.loop();
                }
                pauseBtn.dataset.paused = 'false';
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                wasVisible = true;
            } else {
                console.log(`[Tutorial ${containerId}] PAUSE - not visible`);
                currentP5.noLoop();
                pauseBtn.dataset.paused = 'true';
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                wasVisible = false;
            }
        });
    }, { threshold: 0.1 });

    observer.observe(stepMain);
}

// Scroll to tutorial if URL has hash (e.g., #tutorial-10) and optionally start in fullscreen
function handleHashChange() {
    const hash = window.location.hash;
    if (!hash) return;
    
    const targetId = hash.replace('#', '');
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        // Scroll to the tutorial
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Show a "Click to Fullscreen" overlay because browsers block auto-fullscreen
        const canvasElement = document.getElementById(`canv-${targetId}`);
        if (canvasElement) {
            // Add a one-time click handler to go fullscreen
            const startFullscreen = () => {
                const requestFullscreen = 
                    canvasElement.requestFullscreen?.bind(canvasElement) ||
                    (canvasElement as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(canvasElement);
                requestFullscreen?.();
                canvasElement.removeEventListener('click', startFullscreen);
                canvasElement.style.cursor = '';
            };
            
            canvasElement.addEventListener('click', startFullscreen);
            canvasElement.style.cursor = 'pointer';
            canvasElement.title = 'Click to enter fullscreen';
        }
    }
}

// Listen for hash changes
window.addEventListener('hashchange', handleHashChange);

// Check hash on page load
handleHashChange();

// Initialize the updated Curriculum
renderStep('tutorial-1', '1. The Foundation (Registration)', tutorial_1, step1Source);
renderStep('tutorial-2', '2. Animation (Temporal Phase)', tutorial_2, step2Source);
renderStep('tutorial-3', '3. Movement (Spatial Orbit)', tutorial_3, step3Source);
renderStep('tutorial-4', '4. Camera (Modifiers)', tutorial_4, step4Source);
renderStep('tutorial-5', '5. Textures & Fonts (Hydration)', tutorial_5, step5Source);
renderStep('tutorial-6', '6. Integrated Scene (Hybrid Props)', tutorial_6, step6Source);
renderStep('tutorial-7', '7. Head Tracking', tutorial_7, step7Source);
renderStep('tutorial-8', '8. Billboard', tutorial_8, step8Source);
renderStep('tutorial-9', '9. Follow Object', tutorial_9, step9Source);
renderStep('tutorial-10', '10. Out of Screen', tutorial_10, step10Source);
