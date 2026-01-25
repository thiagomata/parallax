import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import '../../docs/style/tutorial.css';
interface StepArgs {
    containerId: string;
    title: string;
    source: string;
}

export function tutorialStepTemplate({ containerId, title, source }: StepArgs): HTMLElement {
    const wrapper = document.createElement('main');
    wrapper.className = 'step-row';
    wrapper.id = `step-${containerId}`;

    wrapper.innerHTML = `
    <section class="code-side">
        <a href="#step-${containerId}" class="step-anchor">
            <div class="status-dot"></div>
            <span>${title}</span>
        </a>

        <div class="editor-box">
            <pre class="language-typescript"><code contenteditable="true" spellcheck="false">
${Prism.highlight(source, Prism.languages.typescript, 'typescript')}
            </code></pre>
        </div>

        <div class="console-panel">
            <div class="log-entry info">[Engine] Idle...</div>
        </div>

        <div class="controls">
            <div class="controls-row">
                <button class="icon-btn play-btn"><i class="fas fa-play"></i></button>
                <button class="icon-btn reset-btn"><i class="fas fa-undo"></i></button>
                <button class="icon-btn copy-btn"><i class="fas fa-copy"></i></button>
                <div class="spacer"></div>
                <button class="icon-btn fullscreen-btn" onclick="toggleFS('step-${containerId}')">
                    <i class="fas fa-maximize"></i>
                </button>
            </div>
        </div>
    </section>

    <section class="canvas-side" id="canv-${containerId}">
        <div class="step-anchor" style="pointer-events: none;">
            <span>Preview</span>
        </div>
        <div class="canvas-wrapper">
            <div class="canvas-box"></div>
        </div>

        <div class="controls">
            <div class="controls-row">
                <button class="icon-btn pause-btn"><i class="fas fa-pause"></i></button>
                <div class="spacer"></div>
                <button class="icon-btn fullscreen-btn"><i class="fas fa-expand"></i></button>
            </div>
        </div>
    </section>
    `;

    return wrapper;
}
