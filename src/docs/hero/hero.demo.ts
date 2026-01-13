import {World} from "../../scene/world.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {DEFAULT_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";

// libs
import p5 from 'p5';
import Prism from 'prismjs';

// Syntax Highlighting Support
import 'prismjs/themes/prism-tomorrow.css';
import '../../docs/style/style.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import {transform} from 'sucrase';

// Tutorial Steps
import {heroExample1} from "./hero_example_1.ts";
import heroExample1Code from './hero_example_1.ts?raw';
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";


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
    p5,
    OrbitModifier,
    CenterFocusModifier
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
    document.getElementById(`fs-${containerId}`)?.addEventListener('click', () => {
        const canvasContainer = document.getElementById(`canvas-${containerId}`);

        if (canvasContainer) {
            // Request fullscreen on the DIV container, not the canvas
            if (canvasContainer.requestFullscreen) {
                canvasContainer.requestFullscreen();
            } else if ((canvasContainer as any).webkitRequestFullscreen) {
                (canvasContainer as any).webkitRequestFullscreen();
            }
        }
    });
}

renderStep('hero-demo-1', 'Demo', heroExample1, heroExample1Code);
