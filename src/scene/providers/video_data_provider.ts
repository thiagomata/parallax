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
    private status: TrackingStatus = "IDLE";
    private sceneId = -1;
    private playRequested = false;

    constructor(
        p: p5,
        url: string,
        config: VideoDataProviderConfig = {},
    ) {
        if (typeof document === "undefined") {
            throw new Error("VideoDataProvider requires a browser-like document");
        }

        this.p = p;
        this.video = this.p.createVideo(url);
        this.video.hide();
        if (config.loop ?? true) {
            this.video.loop();
        } else {
            this.video.noLoop();
        }
        this.video.autoplay(config.autoplay ?? true);
        this.video.volume((config.muted ?? true) ? 0 : 1);
        this.video.elt.playsInline = config.playsInline ?? true;
        this.video.elt.preload = config.preload ?? "auto";
        this.source = { kind: "video", node: this.video };

        this.video.elt.addEventListener("canplay", () => {
            if (this.status !== "ERROR") {
                this.status = "READY";
                void this.ensurePlaying();
            }
        });

        this.video.elt.addEventListener("error", () => {
            this.status = "ERROR";
        });
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
            void this.ensurePlaying();
            return this.status;
        }

        if (this.video.src) {
            this.status = this.status === "READY" ? "READY" : "INITIALIZING";
            return this.status;
        }

        this.status = "ERROR";
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

    private async ensurePlaying(): Promise<void> {
        if (this.playRequested) return;
        if (this.video.elt.readyState < 2) return;
        if (!this.video.elt.paused) return;

        this.playRequested = true;
        try {
            await this.video.play();
        } catch {
            this.playRequested = false;
            return;
        }
        this.playRequested = false;
    }
}
