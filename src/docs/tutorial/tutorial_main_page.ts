import {World} from "../../scene/world.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {toProps} from "../../scene/create_renderable.ts";
import {DEFAULT_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";

// libs
import p5 from 'p5';
import Prism from 'prismjs';

// Syntax Highlighting Support
import 'prismjs/themes/prism-tomorrow.css';
import './style.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import { transform } from 'sucrase';

// Tutorial Steps
import { tutorial_1 } from './tutorial_1.ts';
import step1Source from './tutorial_1.ts?raw';

import { tutorial_2 } from './tutorial_2.ts';
import step2Source from './tutorial_2.ts?raw';

import { tutorial_3 } from './tutorial_3.ts';
import step3Source from './tutorial_3.ts?raw';

import { tutorial_4 } from './tutorial_4.ts';
import step4Source from './tutorial_4.ts?raw';

import { tutorial_5 } from './tutorial_5.ts';
import step5Source from './tutorial_5.ts?raw';

/**
 * [2026-01-07] Respecting signatures:
 * We expose the engine to the window so the dynamic code can resolve types.
 */
Object.assign(window, {
    World,
    SceneManager,
    P5AssetLoader,
    P5GraphicProcessor,
    ELEMENT_TYPES,
    DEFAULT_SETTINGS,
    toProps,
    p5 // Also expose p5 for static method access if needed
});

type P5Sketch = (p: p5) => void;

/**
 * Manages the lifecycle of a tutorial step
 */
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

    // Initial state
    let currentP5 = new p5(initialSketch, document.getElementById(`canvas-${containerId}`)!);
    const codeElem = document.getElementById(`code-${containerId}`)! as HTMLElement;

    const executeUpdate = () => {
        const rawText = codeElem.innerText;
        const errorDiv = document.getElementById(`error-${containerId}`)!;

        // Reset UI
        errorDiv.style.display = 'none';
        errorDiv.innerText = '';

        try {
            // --- PHASE 1: TRANSPILE (Check if TS is valid) ---
            // If the user has a syntax error, Sucrase throws here.
            const compiledCode = transform(rawText, {
                transforms: ['typescript', 'imports'],
            }).code;

            // --- PHASE 2: EXTRACT FUNCTION ---
            const fnMatch = rawText.match(/export\s+(?:const|function)\s+([a-zA-Z0-9_]+)/);
            const fnName = fnMatch ? fnMatch[1] : null;
            if (!fnName) throw new Error("No exported function found.");

            // --- PHASE 3: FACTORY & WRAPPER ---
            const factory = new Function('require', 'exports', 'p', compiledCode);
            const fakeExports: any = {};
            const fakeRequire = () => window;

            factory.call(window, fakeRequire, fakeExports, null);
            const originalSketch = fakeExports[fnName];

            // We wrap the sketch to catch runtime errors (e.g., calling undefined functions)
            const safeSketch = (p: p5) => {
                try {
                    originalSketch(p);
                } catch (runtimeError: any) {
                    showUIError(runtimeError, "Runtime");
                }
            };

            // --- PHASE 4: UPDATE P5 ---
            currentP5.remove();
            currentP5 = new p5(safeSketch, document.getElementById(`canvas-${containerId}`)!);

        } catch (compileError: any) {
            // This catches the Sucrase SyntaxError you just saw
            showUIError(compileError, "Syntax/TypeScript");
        }

        function showUIError(e: any, type: string) {
            // Sucrase errors usually include a line number in e.loc
            const line = e.loc ? ` at line ${e.loc.line}` : "";
            errorDiv.innerText = `⚠️ ${type} Error${line}: ${e.message}`;
            errorDiv.style.display = 'block';

            // Shake the error box to alert the user
            errorDiv.classList.remove('shake');
            void errorDiv.offsetWidth; // trigger reflow
            errorDiv.classList.add('shake');
        }
    };

    // Event Listeners
    document.getElementById(`run-${containerId}`)?.addEventListener('click', executeUpdate);

    document.getElementById(`reset-${containerId}`)?.addEventListener('click', () => {
        codeElem.innerHTML = Prism.highlight(source, Prism.languages.typescript, 'typescript');
        executeUpdate();
    });
}

renderStep('tutorial-1', '1. The Foundation', tutorial_1, step1Source);
renderStep('tutorial-2', '2. Animation', tutorial_2, step2Source);
renderStep('tutorial-3', '3. Movement', tutorial_3, step3Source);
renderStep('tutorial-4', '4. Camera', tutorial_4, step4Source);
renderStep('tutorial-5', '5. Stick and Nudge', tutorial_5, step5Source);