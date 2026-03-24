import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import { 
    DEFAULT_SKETCH_CONFIG, 
    type SketchConfig,
    sketchEngine,
    type P5Sketch,
    type FaceConfig,
} from "./sketch_engine.ts";
import { extractSketchFunction } from "./sketch_engine.live.ts";
import {tutorialStepTemplate} from "./tutorial.template.ts";

function toggleFS(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    const requestFullscreen = element.requestFullscreen?.bind(element) || 
        (element as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(element);
    if (!requestFullscreen) return;
    if (document.fullscreenElement === element) {
        document.exitFullscreen?.();
    } else {
        requestFullscreen();
    }
}

export function initTutorial(
    containerId: string,
    title: string,
    initialSketch: P5Sketch,
    source: string,
    explanation: string,
    config: Partial<SketchConfig> = {},
    faceConfig?: FaceConfig
) {
    const root = document.getElementById('tutorial-root');
    if (!root) return;

    const stepMain = tutorialStepTemplate({ containerId, title, source, explanation });
    root.appendChild(stepMain);

    const editorBox = stepMain.querySelector('.editor-box') as HTMLElement;
    const canvasBox = stepMain.querySelector('.canvas-box') as HTMLElement;
    const consolePanel = stepMain.querySelector('.console-panel') as HTMLElement;
    const playBtn = stepMain.querySelector('.code-side .play-btn') as HTMLButtonElement;
    const resetBtn = stepMain.querySelector('.code-side .reset-btn') as HTMLButtonElement;
    const copyBtn = stepMain.querySelector('.code-side .copy-btn') as HTMLButtonElement;
    const pauseBtn = stepMain.querySelector('.pause-btn') as HTMLButtonElement;
    const canvasSide = stepMain.querySelector('.canvas-side') as HTMLElement;
    
    requestAnimationFrame(async () => {
        const sketchConfig: SketchConfig = { 
            ...DEFAULT_SKETCH_CONFIG, 
            ...config, 
            width: canvasBox?.clientWidth || 500, 
            height: canvasBox?.clientHeight || 400, 
            paused: false 
        };
        
        let { currentP5 } = await sketchEngine.createSketchInstance(
            initialSketch, 
            sketchConfig, 
            canvasBox, 
            containerId, 
            { faceConfig }
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

        // Execute/update code
        const executeUpdate = async () => {
            consolePanel.style.display = 'block';
            consolePanel.innerHTML = '';
            try {
                const { fn } = extractSketchFunction(editorBox.innerText);
                const result = await sketchEngine.createSketchInstance(fn, sketchConfig, canvasBox, containerId);
                currentP5 = result.currentP5;
                sketchConfig.paused = false;
                pauseBtn.dataset.paused = 'false';
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                const log = document.createElement('div');
                log.className = 'log-entry info';
                log.textContent = `[Engine] Hydration successful.`;
                consolePanel.appendChild(log);
            } catch (e: unknown) {
                const log = document.createElement('div');
                log.className = 'log-entry info';
                log.style.color = 'var(--error)';
                log.textContent = e instanceof Error ? e.message : String(e);
                consolePanel.appendChild(log);
            }
        };

        playBtn.addEventListener('click', executeUpdate);
        resetBtn.addEventListener('click', () => {
            const codeEl = stepMain.querySelector('.editor-box code');
            if (codeEl) codeEl.innerHTML = Prism.highlight(source, Prism.languages.typescript, 'typescript');
            executeUpdate();
        });
        copyBtn.addEventListener('click', () => navigator.clipboard.writeText(editorBox.innerText));
        
        stepMain.querySelectorAll('.fullscreen-btn').forEach(btn => {
            btn.addEventListener('click', () => { if (canvasSide) toggleFS(canvasSide.id); });
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
    });
}
