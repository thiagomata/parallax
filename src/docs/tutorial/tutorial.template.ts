import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';

export interface TutorialStepParams {
    containerId: string;
    title: string;
    source: string;
}

/**
 * Generates a tutorial step DOM using the given parameters.
 */
export function tutorialStepTemplate({
    containerId,
    title,
    source
}: TutorialStepParams): HTMLElement {
    const section = document.createElement('section');
    section.className = 'step-row';
    section.id = `section-${containerId}`;

    section.innerHTML = `
        <div class="code-side">
            <h2 class="step-title">${title}</h2>
            <div class="editor-container">
                <pre class="language-typescript">
<code 
    id="code-${containerId}" 
    contenteditable="true" 
    spellcheck="false"
>${Prism.highlight(source, Prism.languages.typescript, 'typescript')}</code>
                </pre>
            </div>
            <div class="controls">
                <div class="button-group">
                    <button class="run-btn" id="run-${containerId}">Update Preview</button>
                    <button class="reset-btn" id="reset-${containerId}">Reset</button>
                    <button class="fs-btn" id="fs-${containerId}">Fullscreen</button>
                    <button class="copy-btn">Copy</button>
                </div>
                <div class="error-log" id="error-${containerId}" style="display:none;"></div>
            </div>
        </div>
        <div class="canvas-side" id="canvas-${containerId}"></div>
    `;

    return section;
}
