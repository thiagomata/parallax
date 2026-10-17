import { appAssetPath } from "../../utils/app_paths.ts";

/**
 * Shows a page's loading screen over its canvas until the scene is ready.
 *
 * The page's HTML already contains the screen (#scene-loading, styled by
 * public/css/loading-screen.css) so it appears before any JavaScript runs; this moves it over
 * the canvas and fades it out when the sketch engine sends 'sceneready' on the canvas box.
 * Call `show()` before each (re)run of the sketch.
 */
export function attachLoadingScreen(canvasBox: HTMLElement | null, imagePath: string): { show: () => void } {
    if (!canvasBox) return { show: () => {} };
    const screen = document.getElementById('scene-loading') ?? createLoadingScreen(imagePath);
    screen.classList.add('in-canvas');
    canvasBox.addEventListener('sceneready', () => screen.classList.add('loaded'));
    return {
        show: () => {
            screen.classList.remove('loaded');
            if (screen.parentElement !== canvasBox) canvasBox.appendChild(screen);
        },
    };
}

// Fallback for pages whose HTML has no static loading screen.
function createLoadingScreen(imagePath: string): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'scene-loading';
    screen.setAttribute('role', 'status');
    const image = document.createElement('img');
    image.src = appAssetPath(imagePath);
    image.alt = '';
    const label = document.createElement('p');
    label.className = 'scene-loading-label';
    label.textContent = 'Loading the 3D scene…';
    screen.append(image, label);
    return screen;
}
