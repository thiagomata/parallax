import { describe, expect, it } from "vitest";
import { SceneClock } from "./scene_clock.ts";
import { DEFAULT_SCENE_SETTINGS } from "./types.ts";

const createSettings = (startPaused = false) => ({
    ...DEFAULT_SCENE_SETTINGS,
    startPaused,
    playback: {
        ...DEFAULT_SCENE_SETTINGS.playback,
        startTime: 0,
        timeSpeed: 2,
        duration: 1000,
        isLoop: true,
    },
});

describe("SceneClock", () => {
    it("tracks paused time and resumes without losing elapsed duration", () => {
        const clock = new SceneClock(createSettings(true));

        expect(clock.isPaused()).toBe(true);

        clock.tick(100, 16, 1);
        const pausedPlayback = clock.getPlayback();
        expect(pausedPlayback.delta).toBe(0);
        expect(pausedPlayback.frameCount).toBe(0);
        expect(pausedPlayback.now).toBe(200);
        expect(clock.sceneId).toBe(0);

        clock.resume();
        clock.tick(250, 20, 2);

        expect(clock.sceneId).toBe(1);
        expect(clock.isPaused()).toBe(false);

        const playback = clock.getPlayback();
        expect(playback.now).toBe(200);
        expect(playback.delta).toBe(40);
        expect(playback.frameCount).toBe(2);
        expect(clock.getSettings().playback.duration).toBe(1000);
    });

    it("increments scene id and exposes unpaused playback state", () => {
        const clock = new SceneClock(createSettings(false));

        clock.tick(50, 10, 3);
        clock.tick(75, 12, 4);

        expect(clock.sceneId).toBe(2);
        expect(clock.getPlayback()).toEqual({
            now: 150,
            delta: 24,
            frameCount: 4,
            progress: 0.15,
        });

        clock.pause();
        expect(clock.isPaused()).toBe(true);
    });

    it("keeps paused playback anchored until resume", () => {
        const clock = new SceneClock(createSettings(true));

        clock.tick(100, 16, 1);
        clock.tick(150, 18, 2);

        const playback = clock.getPlayback();
        expect(playback.now).toBe(200);
        expect(playback.delta).toBe(0);
        expect(playback.frameCount).toBe(0);
        expect(clock.sceneId).toBe(0);
    });
});
