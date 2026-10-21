import {describe, expect, it, vi} from 'vitest';
import {
    emotionGame, emotionGameExplanation, EmotionGame, GAME_TARGETS, matchesTarget, collageLayout, shareText, postIntentUrl,
} from './emotion_game.ts';
import {faceShape} from './emoji_face.ts';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS} from "../../scene/types.ts";
import {createMockFaceWorldData, createMockHeadTrackingProvider} from "../../scene/mock/face.mock.ts";

const neutral = faceShape(null);

describe('Emotion game: matching the target', () => {
    it('tells the smile from the open grin', () => {
        const smile = { ...neutral, happy: 0.6 };
        const grin = { ...neutral, happy: 1, mouthOpen: 1 };

        expect(matchesTarget('smile', smile)).toBe(true);
        expect(matchesTarget('grin', smile)).toBe(false);
        expect(matchesTarget('grin', grin)).toBe(true);
        expect(matchesTarget('smile', grin)).toBe(false);
    });

    it('needs one eye closed and the other open for the wink', () => {
        expect(matchesTarget('wink', { ...neutral, leftEyeOpen: 0.1, rightEyeOpen: 0.9 })).toBe(true);
        expect(matchesTarget('wink', { ...neutral, leftEyeOpen: 0.9, rightEyeOpen: 0.1 })).toBe(true);
        expect(matchesTarget('wink', { ...neutral, leftEyeOpen: 0.1, rightEyeOpen: 0.1 })).toBe(false); // a blink
        expect(matchesTarget('wink', neutral)).toBe(false);
    });

    it('matches the emotions by the face the emoji shows', () => {
        for (const emotion of ['sad', 'angry', 'surprised', 'sleepy'] as const) {
            expect(matchesTarget(emotion, { ...neutral, [emotion]: 0.7 })).toBe(true);
            expect(matchesTarget(emotion, neutral)).toBe(false);
        }
    });
});

describe('Emotion game: the game', () => {
    it('starts at zero with a target', () => {
        const game = new EmotionGame(0, () => 0);

        expect(game.score).toBe(0);
        expect(game.target).toBe(GAME_TARGETS[0]);
        expect(game.secondsLeft(0)).toBe(EmotionGame.ROUND_SECONDS);
    });

    it('scores after the face is held, then celebrates and moves on to another target', () => {
        const game = new EmotionGame(0, () => 0);
        const first = game.target;

        expect(game.update(1, true)).toBeNull();
        expect(game.holdProgress(1.25)).toBeCloseTo(0.5);
        expect(game.update(1 + EmotionGame.HOLD_SECONDS, true)).toBe('scored');
        expect(game.score).toBe(1);
        expect(game.celebrating(2)).toBe(true);
        expect(game.update(2, true)).toBeNull(); // no double score while celebrating

        game.update(1.5 + EmotionGame.CELEBRATE_SECONDS, false);
        expect(game.celebrating(3)).toBe(false);
        expect(game.target).not.toBe(first);
        expect(game.score).toBe(1);
    });

    it('needs the face held without a break', () => {
        const game = new EmotionGame(0);

        game.update(1, true);
        game.update(1.3, false);
        expect(game.update(1.6, true)).toBeNull();
        expect(game.score).toBe(0);
    });

    it('costs a life and moves on when the round runs out', () => {
        const game = new EmotionGame(0, () => 0.99);
        const first = game.target;

        expect(game.update(EmotionGame.ROUND_SECONDS - 0.1, false)).toBeNull();
        expect(game.update(EmotionGame.ROUND_SECONDS, false)).toBe('timeout');
        expect(game.score).toBe(0);
        expect(game.lives).toBe(EmotionGame.LIVES - 1);
        expect(game.over).toBe(false);
        expect(game.target).not.toBe(first);
        expect(game.secondsLeft(EmotionGame.ROUND_SECONDS)).toBe(EmotionGame.ROUND_SECONDS);
    });

    it('is over when the lives run out, and stops until restarted', () => {
        const game = new EmotionGame(0);
        game.update(1, true);
        game.update(1 + EmotionGame.HOLD_SECONDS, true); // one point
        let now = 1 + EmotionGame.HOLD_SECONDS + EmotionGame.CELEBRATE_SECONDS;
        game.update(now, false);
        for (let life = 0; life < EmotionGame.LIVES; life++) {
            now += EmotionGame.ROUND_SECONDS;
            expect(game.update(now, false)).toBe('timeout');
        }

        expect(game.over).toBe(true);
        expect(game.lives).toBe(0);
        expect(game.score).toBe(1);
        expect(game.update(now + 1, true)).toBeNull();
        expect(game.update(now + 5, true)).toBeNull();
        expect(game.score).toBe(1);

        game.restart(now + 10);
        expect(game.over).toBe(false);
        expect(game.score).toBe(0);
        expect(game.lives).toBe(EmotionGame.LIVES);
        expect(game.secondsLeft(now + 10)).toBe(EmotionGame.ROUND_SECONDS);
    });
});

describe('Emotion game: the time limit', () => {
    it('ends the game when its time runs out, however well it goes', () => {
        const game = new EmotionGame(0);
        let now = 0;
        // Score every round, as fast as the game allows, until the clock stops it.
        while (now < EmotionGame.GAME_SECONDS + 5 && !game.over) {
            now += 0.1;
            game.update(now, true);
        }

        expect(game.over).toBe(true);
        expect(game.timeUp).toBe(true);
        expect(game.lives).toBe(EmotionGame.LIVES);
        expect(game.score).toBeGreaterThan(10);
        expect(game.gameSecondsLeft(now)).toBe(0);
        expect(game.update(now + 1, true)).toBeNull();
    });

    it('says time-up once, and restarts with the full time', () => {
        const game = new EmotionGame(0);

        expect(game.update(EmotionGame.GAME_SECONDS - 1, false)).not.toBe('time-up');
        expect(game.update(EmotionGame.GAME_SECONDS, false)).toBe('time-up');
        expect(game.update(EmotionGame.GAME_SECONDS + 1, false)).toBeNull();

        game.restart(200);
        expect(game.timeUp).toBe(false);
        expect(game.over).toBe(false);
        expect(game.gameSecondsLeft(200)).toBe(EmotionGame.GAME_SECONDS);
    });
});

describe('Emotion game: the collage', () => {
    const cell = { width: 360, height: 288 };

    it('lays the pictures out in rows of three under a title', () => {
        const layout = collageLayout(7, cell);

        expect(layout.cells).toHaveLength(7);
        expect(layout.cells[0].y).toBeGreaterThanOrEqual(70);
        expect(layout.cells[1].x).toBeGreaterThan(layout.cells[0].x);
        expect(layout.cells[3].x).toBe(layout.cells[0].x); // the second row starts under the first
        expect(layout.cells[3].y).toBeGreaterThan(layout.cells[0].y);
        expect(layout.width).toBeGreaterThanOrEqual(3 * cell.width);
        expect(layout.height).toBeGreaterThanOrEqual(70 + 3 * cell.height);
    });

    it('fits a few pictures without empty columns', () => {
        expect(collageLayout(2, cell).width).toBeLessThan(collageLayout(3, cell).width);
        expect(collageLayout(0, cell).cells).toHaveLength(0);
    });
});

describe('Emotion game: sharing', () => {
    it('says the score and links to the game', () => {
        const text = shareText(7, 'https://example.com/game/');

        expect(text).toContain('7');
        expect(text).toContain('https://example.com/game/');
    });

    it('opens X with the text filled in', () => {
        const url = new URL(postIntentUrl('I scored 7 😃 & more'));

        expect(url.origin).toBe('https://x.com');
        expect(url.pathname).toBe('/intent/tweet');
        expect(url.searchParams.get('text')).toBe('I scored 7 😃 & more');
    });
});

describe('Emotion game: the scene', () => {
    const createScene = async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);
        const mockTracker = createMockHeadTrackingProvider(vi.fn().mockReturnValue(createMockFaceWorldData()));
        (mockTracker as any).setFallbackCapture = vi.fn();
        const world = await emotionGame(mockP5 as unknown as p5, {
            width: 500, height: 400, paused: false,
            clock: new SceneClock({ ...DEFAULT_SCENE_SETTINGS, playback: { ...DEFAULT_SCENE_SETTINGS.playback, duration: 10000, isLoop: true } }),
        }, { faceDataProvider: mockTracker } as any);
        await mockP5.setup();
        return { mockP5, world };
    };

    it('explains the game', () => {
        expect(emotionGameExplanation).toContain('EmotionGame');
        expect(emotionGameExplanation).toContain('addEmojiFace');
    });

    it('puts the emoji face beside the webcam panel', async () => {
        const { mockP5, world } = await createScene();
        await mockP5.draw();

        expect(world.getElement('head')).toBeDefined();
        expect(world.getElement('mouth')).toBeDefined();
        expect(world.getElement('videoPanel')).toBeDefined();
    });

    it('draws frames, calibrates on N and ignores R while playing', async () => {
        const { mockP5 } = await createScene();
        (mockP5 as any).key = 'n';
        (mockP5 as any).keyPressed();
        (mockP5 as any).key = 'r';
        (mockP5 as any).keyPressed();
        await mockP5.draw();
        await mockP5.draw();
        await mockP5.draw();
    });
});
