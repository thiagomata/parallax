import { afterEach, describe, expect, it } from 'vitest';
import { attachLoadingScreen } from './loading_screen.ts';

describe('attachLoadingScreen', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it("moves the page's static loading screen over the canvas and fades it on sceneready", () => {
        document.body.innerHTML = '<div id="scene-loading" class="scene-loading"></div><div class="canvas-box"></div>';
        const canvasBox = document.querySelector('.canvas-box') as HTMLElement;
        const screen = document.getElementById('scene-loading')!;

        const loading = attachLoadingScreen(canvasBox, 'img/loading/tutorial-1.jpg');
        loading.show();
        expect(screen.parentElement).toBe(canvasBox);
        expect(screen.classList.contains('in-canvas')).toBe(true);

        canvasBox.dispatchEvent(new CustomEvent('sceneready'));
        expect(screen.classList.contains('loaded')).toBe(true);

        loading.show(); // a re-run brings it back
        expect(screen.classList.contains('loaded')).toBe(false);
    });

    it('creates the loading screen when the page has none', () => {
        document.body.innerHTML = '<div class="canvas-box"></div>';
        const canvasBox = document.querySelector('.canvas-box') as HTMLElement;

        attachLoadingScreen(canvasBox, 'img/loading/tutorial-2.jpg').show();

        const screen = canvasBox.querySelector('.scene-loading')!;
        expect(screen.querySelector('img')!.getAttribute('src')).toContain('img/loading/tutorial-2.jpg');
        expect(screen.textContent).toContain('Loading the 3D scene');
    });

    it('does nothing without a canvas box', () => {
        expect(() => attachLoadingScreen(null, 'img/loading/hero.jpg').show()).not.toThrow();
    });
});
