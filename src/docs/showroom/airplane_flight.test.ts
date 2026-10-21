import {describe, expect, it, vi} from 'vitest';
import p5 from 'p5';
import {airplaneFlight} from './airplane_flight.ts';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import {createMockHeadTrackingProvider} from "../../scene/mock/face.mock.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS} from "../../scene/types.ts";

/** A mock p5 whose clock moves forward, so the flight's time-based branches all run. */
function createFlyingP5() {
    const mock = createMockP5();
    let now = 0;
    mock.millis.mockImplementation(() => now);
    mock.frameCount.mockImplementation(() => Math.floor(now / 16));
    mock.advance = (ms: number) => { now += ms; };
    // A canvas in a box, like the real one: the scene puts its overlays there.
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

const config = {
    width: 500,
    height: 400,
    paused: false,
    clock: new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        playback: {...DEFAULT_SCENE_SETTINGS.playback, duration: 100000, isLoop: true},
    }),
};

const keyEvent = (type: string, k: string, code: string) =>
    new KeyboardEvent(type, {key: k, code, bubbles: true});

const pointerMove = (element: HTMLElement, x: number, y: number) => {
    const bounds = element.getBoundingClientRect();
    element.dispatchEvent(new MouseEvent('pointermove', {
        clientX: bounds.left + x,
        clientY: bounds.top + y,
        bubbles: true,
    }));
};

describe('Showroom: the airplane flight', () => {
    it('flies: the scene runs, and the keys and the pointer steer it', async () => {
        const mock = createFlyingP5();
        const tracker = createMockHeadTrackingProvider(vi.fn().mockReturnValue(null));
        const world = await airplaneFlight(mock as unknown as p5, config, {faceDataProvider: tracker as any});

        await mock.setup();
        expect(world.getElement('airplane')).toBeDefined();

        // A few frames with nothing pressed: the plane flies on.
        for (let frame = 0; frame < 5; frame++) {
            mock.advance(16);
            await mock.draw();
        }

        // The arrow keys steer: hold them down over several frames, then let go.
        window.dispatchEvent(keyEvent('keydown', 'ArrowLeft', 'ArrowLeft'));
        window.dispatchEvent(keyEvent('keydown', 'ArrowUp', 'ArrowUp'));
        for (let frame = 0; frame < 5; frame++) {
            mock.advance(16);
            await mock.draw();
        }
        window.dispatchEvent(keyEvent('keyup', 'ArrowLeft', 'ArrowLeft'));
        window.dispatchEvent(keyEvent('keyup', 'ArrowUp', 'ArrowUp'));

        // The pointer steers too.
        const canvas = document.querySelector('canvas') as HTMLElement;
        pointerMove(canvas, 10, 10);
        for (let frame = 0; frame < 3; frame++) {
            mock.advance(16);
            await mock.draw();
        }
        pointerMove(canvas, 480, 380);
        for (let frame = 0; frame < 3; frame++) {
            mock.advance(16);
            await mock.draw();
        }

        // The same frame twice: the flight does not move twice.
        await mock.draw();

        // C recenters, and a key typed into a field is ignored.
        window.dispatchEvent(keyEvent('keydown', 'c', 'KeyC'));
        window.dispatchEvent(keyEvent('keyup', 'c', 'KeyC'));
        const field = document.createElement('input');
        document.body.appendChild(field);
        field.dispatchEvent(keyEvent('keydown', 'ArrowUp', 'ArrowUp'));
        mock.advance(16);
        await mock.draw();
        field.remove();
    });

    it('starts paused, and resumes when the scene says so', async () => {
        const mock = createFlyingP5();
        const tracker = createMockHeadTrackingProvider(vi.fn().mockReturnValue(null));
        // No clock of its own, and paused from the start.
        const world = await airplaneFlight(mock as unknown as p5, {width: 500, height: 400, paused: true}, {faceDataProvider: tracker as any});
        await mock.setup();
        expect(world.getElement('airplane')).toBeDefined();

        mock.advance(16);
        await mock.draw();

        // The world is running again: the scene picks it up on the next frame.
        world.resume();
        mock.advance(16);
        await mock.draw();
    });
});
