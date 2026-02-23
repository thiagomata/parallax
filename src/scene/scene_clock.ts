import {
    DEFAULT_SETTINGS,
    type SceneSettings,
    type ScenePlaybackState,
} from "./types";

/**
 * The Clock.
 * Simply tracks time. Can be paused.
 * State reads from clock to get temporal values.
 */
export class SceneClock {
    private readonly settings: SceneSettings;
    public paused: boolean = false;
    private startTime: number;
    private pausedAt: number | null = null;
    private lastMillis: number = 0;
    private lastDelta: number = 0;
    private lastFrameCount: number = 0;
    private _sceneId: number = 0;

    constructor(settings: SceneSettings) {
        this.settings = settings;
        this.paused = settings.startPaused ?? DEFAULT_SETTINGS.startPaused;
        this.startTime = settings.playback?.startTime ?? DEFAULT_SETTINGS.playback.startTime;
    }

    /**
     * Tick the clock forward.
     * Called each frame with current time values from the graphics system.
     */
    public tick(millis: number, deltaTime: number, frameCount: number): void {
        if (this.paused) {
            if (!this.pausedAt) {
                this.pausedAt = millis;
            }
            return;
        }

        if (this.pausedAt !== null) {
            this.startTime += (millis - this.pausedAt);
            this.pausedAt = null;
        }

        this.lastMillis = millis;
        this.lastDelta = deltaTime;
        this.lastFrameCount = frameCount;
        this._sceneId++;
    }

    /**
     * Get current playback state based on clock time.
     */
    public getPlayback(): ScenePlaybackState {
        if (this.paused && this.pausedAt !== null) {
            const absoluteNow = this.pausedAt - this.startTime;
            const timeSpeed = this.settings.playback.timeSpeed;
            const scaledNow = absoluteNow * timeSpeed;
            const duration = this.settings.playback.duration;
            const progress = duration ? (scaledNow % duration) / duration : 0;

            return {
                now: scaledNow,
                delta: 0,
                frameCount: this.lastFrameCount,
                progress: progress,
            };
        }

        const absoluteNow = this.lastMillis - this.startTime;
        const timeSpeed = this.settings.playback.timeSpeed;
        const scaledNow = absoluteNow * timeSpeed;
        const scaledDelta = this.lastDelta * timeSpeed;
        const duration = this.settings.playback.duration;
        const progress = duration ? (scaledNow % duration) / duration : 0;

        return {
            now: scaledNow,
            delta: scaledDelta,
            frameCount: this.lastFrameCount,
            progress: progress,
        };
    }

    public get sceneId(): number {
        return this._sceneId;
    }

    public get settingsRef(): SceneSettings {
        return this.settings;
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