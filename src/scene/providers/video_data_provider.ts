import p5 from "p5";
import type { DataProviderBundle, FailableResult, TrackingStatus, VideoSourceRef } from "../types.ts";

export interface VideoDataProviderConfig {
    readonly loop?: boolean;
    readonly autoplay?: boolean;
    readonly muted?: boolean;
    readonly playsInline?: boolean;
    readonly preload?: HTMLVideoElement["preload"];
}

export class VideoDataProvider implements DataProviderBundle<"video", VideoSourceRef> {
    readonly type = "video";

    private readonly p: p5;
    private readonly video: p5.MediaElement<HTMLVideoElement>;
    private readonly source: VideoSourceRef;
    private readonly url: string;
    /** Whether the source has been put in: until then, the movie is not fetched at all. */
    private sourceSet = false;
    private status: TrackingStatus = "IDLE";
    private sceneId = -1;
    private playRequested = false;
    /** Whether this video may start on its own: false plays only when play() is asked for. */
    private readonly startsAlone: boolean;
    /** Whether a playing video should loop. */
    private readonly wantsLoop: boolean;

    constructor(
        p: p5,
        url: string,
        config: VideoDataProviderConfig = {},
    ) {
        if (typeof document === "undefined") {
            throw new Error("VideoDataProvider requires a browser-like document");
        }

        this.p = p;
        this.url = url;
        // The video is created without a source on purpose: the browser starts fetching as
        // soon as a source is there, and a page whose camera works must not download a movie
        // it will never show. The source goes in when the clip is played (see play()).
        this.video = this.p.createVideo("");
        this.video.hide();
        this.startsAlone = config.autoplay ?? true;
        this.wantsLoop = config.loop ?? true;
        // A video that waits must not be looped into playing: p5's loop() plays it too.
        if (this.startsAlone) {
            this.ensureSource();
            if (this.wantsLoop) {
                this.video.loop();
            } else {
                this.video.noLoop();
            }
        }
        this.video.autoplay(this.startsAlone);
        // Both: the volume for browsers that honour it, and the muted property because iOS
        // ignores volume on <video>, so a player muted by volume alone still plays audibly.
        this.video.volume((config.muted ?? true) ? 0 : 1);
        this.video.elt.muted = config.muted ?? true;
        this.video.elt.playsInline = config.playsInline ?? true;
        this.video.elt.preload = config.preload ?? "auto";
        this.source = { kind: "video", node: this.video };

        this.video.elt.addEventListener("canplay", () => {
            if (this.startsAlone && this.status !== "ERROR") {
                this.status = "READY";
                void this.ensurePlaying();
            }
        });

        this.video.elt.addEventListener("error", () => {
            this.status = "ERROR";
        });
    }

    /**
     * Puts the source in, so the browser fetches the movie: with preload 'none' it waits for
     * this, and nothing is downloaded before.
     */
    private ensureSource(): void {
        if (this.sourceSet) return;
        this.sourceSet = true;
        // The source child is what the browser fetches: one request, not two.
        const source = this.video.elt.querySelector?.("source");
        if (source) {
            source.setAttribute("src", this.url);
        } else {
            this.video.src = this.url;
        }
    }

    tick(sceneId: number): void {
        if (this.sceneId === sceneId) return;
        this.sceneId = sceneId;

        if (this.status === "IDLE") {
            this.status = "INITIALIZING";
        }
    }

    getStatus(): TrackingStatus {
        if (this.video.elt.readyState >= 2) {
            this.status = "READY";
            if (this.startsAlone) void this.ensurePlaying();
            return this.status;
        }

        if (this.sourceSet) {
            // The source is gone: the clip is broken.
            if (!this.video.src) {
                this.status = "ERROR";
                return this.status;
            }
            this.status = this.status === "READY" ? "READY" : "INITIALIZING";
            return this.status;
        }

        // The clip has no source yet: it is not needed until somebody asks for it.
        this.status = "INITIALIZING";
        return this.status;
    }

    getData(): VideoSourceRef | null {
        return this.getStatus() === "ERROR" ? null : this.source;
    }

    getDataResult(): FailableResult<VideoSourceRef> {
        const status = this.getStatus();
        if (status === "ERROR") {
            return { success: false, error: "Video is not ready [ERROR]" };
        }

        return { success: true, value: this.source };
    }

    seekTo(timeInSeconds: number): void {
        if (this.video.elt.readyState >= 1) {
            this.video.elt.currentTime = timeInSeconds;
        }
    }

    getDuration(): number {
        return this.video.elt.duration ?? 0;
    }

    play(): void {
        // The clip is wanted now: it gets its source, and with it the download.
        this.ensureSource();
        void this.ensurePlaying();
    }

    /** Stops the playback while it is not needed (it is still loaded, ready to play). */
    pause(): void {
        if (typeof this.video.elt.pause === 'function') this.video.elt.pause();
    }

    load(): void {
        if (typeof this.video.elt.load === 'function') {
            this.video.elt.load();
        }
    }

    private async ensurePlaying(): Promise<void> {
        if (this.playRequested) return;
        // Already going? Then nothing to do.
        if (this.video.elt.readyState >= 2 && !this.video.elt.paused) return;

        this.playRequested = true;
        try {
            // p5's loop() both loops and plays; a plain play() would not come back around.
            // play() also starts the download when the browser was told not to preload,
            // so a waiting video begins loading only here.
            if (this.wantsLoop) this.video.loop(); else this.video.play();
        } catch {
            this.playRequested = false;
            return;
        }
        this.playRequested = false;
    }
}
