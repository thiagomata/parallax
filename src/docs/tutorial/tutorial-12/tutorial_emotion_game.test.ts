import {describe, expect, it, vi} from 'vitest';
import {
    tutorial_emotion_game, emotion_game_explanation, EmotionGame, GAME_TARGETS, matchesTarget,
} from './tutorial_emotion_game.ts';
import {faceShape} from '../tutorial-11/tutorial_expressions.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS} from "../../../scene/types.ts";
import {createMockFaceWorldData, createMockHeadTrackingProvider} from "../../../scene/mock/face.mock.ts";

const neutral = faceShape(null);

describe('Tutorial 12: matching the target', () => {
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

describe('Tutorial 12: the game', () => {
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

    it('moves on without a point when the round runs out', () => {
        const game = new EmotionGame(0, () => 0.99);
        const first = game.target;

        expect(game.update(EmotionGame.ROUND_SECONDS - 0.1, false)).toBeNull();
        expect(game.update(EmotionGame.ROUND_SECONDS, false)).toBe('timeout');
        expect(game.score).toBe(0);
        expect(game.target).not.toBe(first);
        expect(game.secondsLeft(EmotionGame.ROUND_SECONDS)).toBe(EmotionGame.ROUND_SECONDS);
    });
});

describe('Tutorial 12: the scene', () => {
    const createScene = async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);
        const mockTracker = createMockHeadTrackingProvider(vi.fn().mockReturnValue(createMockFaceWorldData()));
        (mockTracker as any).setFallbackCapture = vi.fn();
        const world = await tutorial_emotion_game(mockP5 as unknown as p5, {
            width: 500, height: 400, paused: false,
            clock: new SceneClock({ ...DEFAULT_SCENE_SETTINGS, playback: { ...DEFAULT_SCENE_SETTINGS.playback, duration: 10000, isLoop: true } }),
        }, { faceDataProvider: mockTracker } as any);
        await mockP5.setup();
        return { mockP5, world };
    };

    it('explains the game', () => {
        expect(emotion_game_explanation).toContain('EmotionGame');
        expect(emotion_game_explanation).toContain('addEmojiFace');
    });

    it('puts the emoji face beside the webcam panel', async () => {
        const { mockP5, world } = await createScene();
        await mockP5.draw();

        expect(world.getElement('head')).toBeDefined();
        expect(world.getElement('mouth')).toBeDefined();
        expect(world.getElement('videoPanel')).toBeDefined();
    });

    it('draws frames and calibrates on N', async () => {
        const { mockP5 } = await createScene();
        (mockP5 as any).key = 'n';
        (mockP5 as any).keyPressed();
        await mockP5.draw();
        await mockP5.draw();
        await mockP5.draw();
    });
});
