import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import '../style/style.css';

import {tutorial_adding_elements, adding_elements_explanation} from './tutorial_adding_elements.ts';
import step1Source from './tutorial_adding_elements.ts?raw';
import {tutorial_animation, animation_explanation} from './tutorial_animation.ts';
import step2Source from './tutorial_animation.ts?raw';
import {tutorial_orbital_motion, orbital_motion_explanation} from './tutorial_orbital_motion.ts';
import step3Source from './tutorial_orbital_motion.ts?raw';
import {tutorial_camera_control, camera_control_explanation} from './tutorial_camera_control.ts';
import step4Source from './tutorial_camera_control.ts?raw';
import {tutorial_textures, textures_explanation} from './tutorial_textures.ts';
import step5Source from './tutorial_textures.ts?raw';
import {tutorial_look_at, look_at_explanation} from "./tutorial_look_at.ts";
import step6Source from './tutorial_look_at.ts?raw';
import {tutorial_billboard, billboard_explanation} from "./tutorial_billboard.ts";
import step7Source from './tutorial_billboard.ts?raw';
import {tutorial_observer, observer_explanation} from "./tutorial_observer.ts";
import step8Source from './tutorial_observer.ts?raw';
import {tutorial_parallax, parallax_explanation} from "./tutorial_parallax.ts";
import step9Source from './tutorial_parallax.ts?raw';

import { 
    DEFAULT_SKETCH_CONFIG, 
    type SketchConfig,
    extractSketchFunction,
    createSketchInstance,
    type P5Sketch
} from "./sketch_engine.ts";

import {tutorialStepTemplate} from "./tutorial.template.ts";

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
    explanation: string = '',
    config: Partial<SketchConfig> = {}
) {
    const root = document.getElementById('tutorial-root');
    if (!root) return;

    let stepMain = document.getElementById(`step-${containerId}`);
    if (!stepMain) {
        stepMain = tutorialStepTemplate({ containerId, title, source, explanation });
        root.appendChild(stepMain);
    } else {
        const previewSection = stepMain.querySelector('[data-content="preview"]');
        const codeSection = stepMain.querySelector('[data-content="code"]');
        const learnSection = stepMain.querySelector('[data-content="learn"]');
        
        if (previewSection) {
            const anchor = previewSection.querySelector('.step-anchor');
            if (anchor) anchor.innerHTML = `<span>${title}</span>`;
        }
        if (codeSection) {
            const anchor = codeSection.querySelector('.step-anchor');
            if (anchor) anchor.innerHTML = `<div class="status-dot"></div><span>${title}</span>`;
            const codeEl = codeSection.querySelector('.editor-box code');
            if (codeEl) {
                codeEl.innerHTML = Prism.highlight(source, Prism.languages.typescript, 'typescript');
            }
        }
        if (learnSection) {
            const learnContent = learnSection.querySelector('.learn-content');
            if (learnContent) learnContent.innerHTML = explanation;
        }
    }

    const editorBox = stepMain.querySelector('.editor-box') as HTMLElement;
    const canvasBox = stepMain.querySelector('.canvas-box') as HTMLElement;
    const consolePanel = stepMain.querySelector('.console-panel') as HTMLElement;

    const playBtn = stepMain.querySelector('.code-side .play-btn') as HTMLButtonElement;
    const resetBtn = stepMain.querySelector('.code-side .reset-btn') as HTMLButtonElement;
    const copyBtn = stepMain.querySelector('.code-side .copy-btn') as HTMLButtonElement;
    const pauseBtn = stepMain.querySelector('.pause-btn') as HTMLButtonElement;

    const sketchConfig: SketchConfig = { 
        ...DEFAULT_SKETCH_CONFIG, 
        ...config, 
        width: canvasBox?.clientWidth || 500, 
        height: canvasBox?.clientHeight || 400, 
        paused: false 
    };

    let { currentP5 } = createSketchInstance(
        initialSketch, 
        sketchConfig, 
        canvasBox, 
        containerId,
        null
    );

    // Tab switching
    const tabBtns = stepMain.querySelectorAll('.tab-btn');
    const contentSections = stepMain.querySelectorAll('.step-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            contentSections.forEach(section => {
                if (section.getAttribute('data-content') === tab) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });

    const executeUpdate = () => {
        consolePanel.style.display = 'block';
        consolePanel.innerHTML = '';

        try {
            const { fn } = extractSketchFunction(editorBox.innerText);
            
            const result = createSketchInstance(fn, sketchConfig, canvasBox, containerId, currentP5);
            currentP5 = result.currentP5;

            sketchConfig.paused = false;
            pauseBtn.dataset.paused = 'false';
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

            const log = document.createElement('div');
            log.className = 'log-entry info';
            log.textContent = `[Engine] Hydration successful.`;
            consolePanel.appendChild(log);
        } catch (e: any) {
            console.error('executeUpdate error:', e);
            const log = document.createElement('div');
            log.className = 'log-entry info';
            log.style.color = 'var(--error)';
            log.textContent = `Error: ${e.message}\n\nStack:\n${e.stack}`;
            log.style.whiteSpace = 'pre-wrap';
            log.style.fontSize = '11px';
            consolePanel.appendChild(log);
        }
    };

    playBtn.addEventListener('click', executeUpdate);

    resetBtn.addEventListener('click', () => {
        const codeEl = stepMain.querySelector('.editor-box code');
        if (codeEl) {
            codeEl.innerHTML = Prism.highlight(source, Prism.languages.typescript, 'typescript');
        }
        executeUpdate();
    });

    copyBtn.addEventListener('click', () => navigator.clipboard.writeText(editorBox.innerText));
    
    // Fullscreen buttons - target canvas-side
    const canvasSide = stepMain.querySelector('.canvas-side') as HTMLElement;
    stepMain.querySelectorAll('.fullscreen-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (canvasSide) toggleFS(canvasSide.id);
        });
    });

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
}

// Initialize the Curriculum
// Phase 1: Foundations
renderStep('tutorial-1', '1. Adding Elements', tutorial_adding_elements, step1Source, adding_elements_explanation);
renderStep('tutorial-2', '2. Animation Over Time', tutorial_animation, step2Source, animation_explanation);
renderStep('tutorial-3', '3. Orbital Motion', tutorial_orbital_motion, step3Source, orbital_motion_explanation);

// Phase 2: Camera & Assets
renderStep('tutorial-4', '4. Camera Control', tutorial_camera_control, step4Source, camera_control_explanation);
renderStep('tutorial-5', '5. Loading Textures', tutorial_textures, step5Source, textures_explanation);

// Phase 3: Object Relationships
renderStep('tutorial-6', '6. Objects Looking at Each Other', tutorial_look_at, step6Source, look_at_explanation);
renderStep('tutorial-7', '7. Always Face Camera', tutorial_billboard, step7Source, billboard_explanation);

// Phase 4: Observer & Parallax
renderStep('tutorial-8', '8. The Observer', tutorial_observer, step8Source, observer_explanation);
renderStep('tutorial-9', '9. 3D Parallax Depth', tutorial_parallax, step9Source, parallax_explanation);
