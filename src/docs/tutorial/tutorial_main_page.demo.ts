import {World} from "../../scene/world.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {resolve} from "../../scene/resolver.ts"; // New Manifest-compliant resolver
import {ASSET_STATUS, DEFAULT_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";

// libs
import p5 from 'p5';
import Prism from 'prismjs';
import {transform} from 'sucrase';

// Styles & Highlighting
import 'prismjs/themes/prism-tomorrow.css';
import '../style/style.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';

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
import {CameraModifier} from "../../scene/modifiers/camera_modifier.ts";

/**
 * ARCHITECTURAL EXPOSURE
 * We bind the core engine classes to the window so the transpiled
 * 'live-editor' code can find them via the fake 'require'.
 */
Object.assign(window, {
    World,
    SceneManager,
    P5AssetLoader,
    P5GraphicProcessor,
    ELEMENT_TYPES,
    DEFAULT_SETTINGS,
    ASSET_STATUS,
    CameraModifier,
    resolve, // Expose for users who want to debug element state in console
    p5
});

type P5Sketch = (p: p5) => void;

function renderStep(containerId: string, title: string, initialSketch: P5Sketch, source: string) {
    const root = document.getElementById('tutorial-root');
    if (!root) return;

    const section = document.createElement('section');
    section.className = 'step-row';
    section.id = `section-${containerId}`;

    section.innerHTML = `
        <div class="code-side">
            <h2 class="step-title">${title}</h2>
            <div class="editor-container">
                <pre class="language-typescript"><code 
                    id="code-${containerId}" 
                    contenteditable="true" 
                    spellcheck="false"
                >${Prism.highlight(source, Prism.languages.typescript, 'typescript')}</code></pre>
            </div>
            
            <div class="controls">
                <div class="button-group">
                    <button class="run-btn" id="run-${containerId}">Update Preview</button>
                    <button class="reset-btn" id="reset-${containerId}">Reset</button>
                    <button class="fs-btn" id="fs-${containerId}">Fullscreen</button> 
                    <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('code-${containerId}').innerText)">
                       Copy
                    </button>
                </div>
                <div class="error-log" id="error-${containerId}" style="display: none;"></div>
            </div>
        </div>
        <div class="canvas-side" id="canvas-${containerId}"></div>
    `;
    root.appendChild(section);

    let currentP5 = new p5(initialSketch, document.getElementById(`canvas-${containerId}`)!);
    const codeElem = document.getElementById(`code-${containerId}`)! as HTMLElement;

    const executeUpdate = () => {
        const rawText = codeElem.innerText;
        const errorDiv = document.getElementById(`error-${containerId}`)!;
        errorDiv.style.display = 'none';

        try {
            // Transpile TS -> JS for the browser
            const compiledCode = transform(rawText, {
                transforms: ['typescript', 'imports'],
            }).code;

            const fnMatch = rawText.match(/export\s+(?:const|function)\s+([a-zA-Z0-9_]+)/);
            const fnName = fnMatch ? fnMatch[1] : null;
            if (!fnName) throw new Error("No exported function found.");

            // The 'Fake Require' maps imports in the editor to the window objects we exposed
            const factory = new Function('require', 'exports', compiledCode);
            const fakeExports: any = {};
            const fakeRequire = (_name: string) => window;

            factory(fakeRequire, fakeExports);
            const updatedSketch = fakeExports[fnName];

            currentP5.remove();
            currentP5 = new p5(updatedSketch, document.getElementById(`canvas-${containerId}`)!);

        } catch (e: any) {
            errorDiv.innerText = `⚠️ Error: ${e.message}`;
            errorDiv.style.display = 'block';
        }
    };

    document.getElementById(`run-${containerId}`)?.addEventListener('click', executeUpdate);
    document.getElementById(`reset-${containerId}`)?.addEventListener('click', () => {
        codeElem.innerHTML = Prism.highlight(source, Prism.languages.typescript, 'typescript');
        executeUpdate();
    });

    document.getElementById(`fs-${containerId}`)?.addEventListener('click', () => {
        const canvasContainer = document.getElementById(`canvas-${containerId}`);
        if (canvasContainer) {
            if (canvasContainer.requestFullscreen) {
                canvasContainer.requestFullscreen();
            } else if ((canvasContainer as any).webkitRequestFullscreen) { /* Safari */
                (canvasContainer as any).webkitRequestFullscreen();
            }
        }
    });
}

// Initialize the updated Curriculum
renderStep('tutorial-1', '1. The Foundation (Registration)', tutorial_1, step1Source);
renderStep('tutorial-2', '2. Animation (Temporal Phase)', tutorial_2, step2Source);
renderStep('tutorial-3', '3. Movement (Spatial Orbit)', tutorial_3, step3Source);
renderStep('tutorial-4', '4. Camera (Modifiers)', tutorial_4, step4Source);
renderStep('tutorial-5', '5. Textures & Fonts (Hydration)', tutorial_5, step5Source);
renderStep('tutorial-6', '6. Integrated Scene (Hybrid Props)', tutorial_6, step6Source);
renderStep('tutorial-7', '7. Head Tracking', tutorial_7, step7Source);