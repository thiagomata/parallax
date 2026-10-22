import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import p5 from 'p5';
import {emotionGame} from './emotion_game.ts';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import {createMockFaceWorldData, createMockHeadTrackingProvider, createMockSceneFace} from "../../scene/mock/face.mock.ts";
import {stubCanvas} from "../../scene/mock/canvas.mock.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS} from "../../scene/types.ts";
import {FaceExpressions} from "../../scene/drivers/mediapipe/face_expressions.ts";
import {FaceWorldData} from "../../scene/providers/head_tracking_data_provider.ts";

const config = {
    width: 500, height: 400, paused: false,
    clock: new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        playback: {...DEFAULT_SCENE_SETTINGS.playback, duration: 100000, isLoop: true},
    }),
};

/** A mock p5 with a canvas in a box, like the real one. */
function createGameP5() {
    const mock = createMockP5();
    mock.createCanvas.mockImplementation((width: number, height: number) => {
        const box = document.createElement('div');
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        box.appendChild(canvas);
        document.body.appendChild(box);
        return { elt: canvas, width, height };
    });
    return mock;
}

/** A face that smiles: with the smile target, the game scores. */
function createSmilingFace() {
    const expressions = new FaceExpressions(
        {mouthSmileLeft: 0.95, mouthSmileRight: 0.95, browInnerUp: 0.6},
        undefined,
        {browInnerToOuter: 1, whiteAboveIris: -0.15, lipGap: 0.001, cornerLift: 0.04},
    );
    const face = createMockFaceWorldData();
    return new FaceWorldData(face.face, createMockSceneFace(), expressions);
}

const gallery = () => document.querySelector('.emotion-game-gallery') as HTMLElement | null;
const galleryText = () => [...(gallery()?.querySelectorAll('div') ?? [])].map(d => d.textContent?.trim() ?? '');
const clickShare = () => {
    const buttons = [...(gallery()?.querySelectorAll('button') ?? [])] as HTMLButtonElement[];
    buttons.find(button => button.textContent?.includes('Share'))?.click();
};

describe('Emotion game: the gallery and the share', () => {
    let restoreCanvas: () => void;

    beforeEach(() => {
        restoreCanvas = stubCanvas();
        vi.useFakeTimers({toFake: ['performance']});
    });

    afterEach(() => {
        vi.useRealTimers();
        restoreCanvas();
        document.body.innerHTML = '';
    });

    it('shows the pictures, and the share button works on the first click', async () => {
        const mock = createGameP5();
        const tracker = createMockHeadTrackingProvider(vi.fn().mockReturnValue(createMockFaceWorldData()));
        (tracker as any).setFallbackCapture = vi.fn();
        await emotionGame(mock as unknown as p5, config, {faceDataProvider: tracker as any} as never);
        await mock.setup();

        // Play it out: three rounds that run out cost the three lives, and the game is over.
        for (let round = 0; round < 5; round++) {
            await mock.draw();
            vi.advanceTimersByTime(11_000);
            await mock.draw();
            await vi.runAllTimersAsync();
        }
        await vi.runAllTimersAsync();

        const overlay = gallery();
        expect(overlay).not.toBeNull();
        expect(getComputedStyle(overlay!).display).not.toBe('none');
        expect(overlay!.querySelectorAll('img').length).toBeGreaterThan(0);

        // The collage is ready before the gallery appears, so the first click shares it.
        const buttons = [...overlay!.querySelectorAll('button')] as HTMLButtonElement[];
        const share = buttons.find(button => button.textContent?.includes('Share'));
        expect(share).toBeDefined();
        share!.click();
        await vi.runAllTimersAsync();

        expect(galleryText().some(text => text.includes('Picture copied') || text.includes('Picture saved'))).toBe(true);
    });

    it('scores a round it makes, and plays again when asked', async () => {
        const mock = createGameP5();
        const tracker = createMockHeadTrackingProvider(vi.fn().mockReturnValue(createSmilingFace()));
        (tracker as any).setFallbackCapture = vi.fn();
        // Always the first target: the smile the mock face makes.
        vi.spyOn(Math, 'random').mockReturnValue(0);
        await emotionGame(mock as unknown as p5, config, {faceDataProvider: tracker as any} as never);
        await mock.setup();

        await mock.draw();
        // Hold the face for the half second the game wants: the hold starts on the first
        // frame that matches, and scores half a second later.
        vi.advanceTimersByTime(600);
        await mock.draw();
        vi.advanceTimersByTime(600);
        await mock.draw();
        await vi.runAllTimersAsync();

        expect(document.querySelector('.emotion-game-hud')?.textContent).toContain('Score 1');
        // A match sends its emoji flying across behind the scene.
        expect(document.querySelectorAll('.emotion-game-parade span').length).toBeGreaterThan(0);

        // Play the game out, then start again with the R key.
        for (let round = 0; round < 5; round++) {
            vi.advanceTimersByTime(11_000);
            await mock.draw();
            await vi.runAllTimersAsync();
        }
        expect(gallery()).not.toBeNull();

        (mock as any).key = 'r';
        (mock as any).keyPressed();
        await mock.draw();
        await vi.runAllTimersAsync();
        expect(getComputedStyle(gallery()!).display).toBe('none');
        expect(document.querySelector('.emotion-game-hud')?.textContent).toContain('Score 0');
    });

    it('says so when the share is cancelled, refused or impossible', async () => {
        const mock = createGameP5();
        const tracker = createMockHeadTrackingProvider(vi.fn().mockReturnValue(createMockFaceWorldData()));
        (tracker as any).setFallbackCapture = vi.fn();
        await emotionGame(mock as unknown as p5, config, {faceDataProvider: tracker as any} as never);
        await mock.setup();
        for (let round = 0; round < 5; round++) {
            await mock.draw();
            vi.advanceTimersByTime(11_000);
            await mock.draw();
            await vi.runAllTimersAsync();
        }
        await vi.runAllTimersAsync();

        // A browser that refuses to share, and one where the player gives up.
        const share = vi.fn().mockRejectedValue(Object.assign(new Error('x'), {name: 'AbortError'}));
        vi.stubGlobal('navigator', {...navigator, canShare: () => true, share});
        clickShare();
        await vi.runAllTimersAsync();
        expect(galleryText().some(text => text.includes('cancelled'))).toBe(true);

        share.mockRejectedValue(new TypeError('files and text cannot be used together'));
        clickShare();
        await vi.runAllTimersAsync();
        expect(galleryText().some(text => text.includes('Sharing did not open'))).toBe(true);

        // A browser whose canShare throws: the picture is saved instead.
        vi.stubGlobal('navigator', {...navigator, canShare: () => { throw new TypeError('boom'); }});
        clickShare();
        await vi.runAllTimersAsync();
        expect(galleryText().some(text => text.includes('Picture saved') || text.includes('Picture copied'))).toBe(true);
        vi.unstubAllGlobals();
    });

});
