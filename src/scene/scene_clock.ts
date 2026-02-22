import {
    DEFAULT_SETTINGS,
    type SceneSettings,
    type SceneState,
} from "./types";

/**
 * The Architect of Time.
 * Responsible strictly for temporal calculations and state orchestration.
 */
export class SceneClock {
    private readonly settings: SceneSettings;
    public paused: boolean = false;
    private startTime: number;
    private pausedAt: number | null = null;

    constructor(settings: SceneSettings) {
        this.settings = settings;
        this.paused = settings.startPaused ?? DEFAULT_SETTINGS.startPaused;
        this.startTime = settings.playback?.startTime ?? DEFAULT_SETTINGS.playback.startTime;
    }

    /**
     * Temporal Resolution: Updates the "Clock" for the current frame.
     */
    public calculateScene(
        millis: number,
        deltaTime: number,
        frameCount: number,
        previousState: SceneState
    ): SceneState {

        // 1. Handle Pause Logic
        if (this.paused) {
            if (!this.pausedAt) {
                this.pausedAt = millis;
            }
            // Return previous state to freeze the world
            return previousState;
        }

        // Resume: Adjust startTime to account for the gap spent paused
        if (this.pausedAt !== null) {
            this.startTime += (millis - this.pausedAt);
            this.pausedAt = null;
        }

        // 2. Calculate Scaled Time
        const absoluteNow = millis - this.startTime;
        const timeSpeed = this.settings.playback.timeSpeed;

        const scaledNow = absoluteNow * timeSpeed;
        const scaledDelta = deltaTime * timeSpeed;

        const duration = this.settings.playback.duration;
        const progress = duration
            ? (scaledNow % duration) / duration
            : 0;

        // 3. Return Temporal Draft
        // We only modify temporal data. No spatial math (Nudges/Cars) allowed.
        return {
            ...previousState,
            sceneId: previousState.sceneId + 1,
            playback: {
                now: scaledNow,
                delta: scaledDelta,
                frameCount: frameCount,
                progress: progress,
            },
        };
    }

    /* --- Lifecycle Methods --- */

    public pause(): void {
        this.paused = true;
    }

    public resume(): void {
        this.paused = false;
    }

    public isPaused(): boolean {
        return this.paused;
    }

    public getSettings(): SceneSettings {
        return this.settings;
    }
}