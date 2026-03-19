import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import '@fortawesome/fontawesome-free/css/all.css';
import '../../docs/style/style.css';
import '../../docs/style/tutorial.css';

import {heroExample1, heroExample1_explanation} from "./hero_example_1.ts";
import heroExample1Code from './hero_example_1.ts?raw';

import { 
    DEFAULT_SKETCH_CONFIG, 
    type SketchConfig,
    extractSketchFunction,
    createSketchInstance,
    type P5Sketch
} from "../tutorial/sketch_engine.ts";

import {tutorialStepTemplate} from "../tutorial/tutorial.template.ts";

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
        // Update existing content
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

    const playBtn = stepMain.querySelector('.play-btn') as HTMLButtonElement;
    const resetBtn = stepMain.querySelector('.reset-btn') as HTMLButtonElement;
    const copyBtn = stepMain.querySelector('.copy-btn') as HTMLButtonElement;
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

    // Fullscreen button
    stepMain.querySelectorAll('.fullscreen-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const canvasBox = stepMain.querySelector('.canvas-box');
            if (canvasBox) {
                if (document.fullscreenElement) {
                    document.exitFullscreen?.();
                } else {
                    canvasBox.requestFullscreen?.();
                }
            }
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

renderStep('hero-demo-1', 'Hero Demo', heroExample1, heroExample1Code, heroExample1_explanation);
