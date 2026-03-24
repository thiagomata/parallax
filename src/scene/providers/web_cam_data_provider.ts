import p5 from "p5";
import type {DataProviderBundle, FailableResult, TrackingStatus, VideoSourceRef} from "../types.ts";

export class WebCamDataProvider implements DataProviderBundle<"webCam", VideoSourceRef> {
    readonly type = "webCam";

    private readonly p: p5;
    private capture: any = null;
    private source: VideoSourceRef | null = null;
    private status: TrackingStatus = "IDLE";
    private sceneId = -1;
    private lastAttemptSceneId = -2;
    private readonly videoWidth: number;
    private readonly videoHeight: number;

    constructor(
        p: p5,
        videoWidth: number = 640,
        videoHeight: number = 480,
    ) {
        this.p = p;
        this.videoWidth = videoWidth;
        this.videoHeight = videoHeight;
        this.ensureCapture();
    }

    tick(sceneId: number): void {
        if (this.sceneId === sceneId) return;
        this.sceneId = sceneId;

        this.ensureCapture();

        if (this.status === "IDLE") {
            this.status = "INITIALIZING";
        }
    }

    getStatus(): TrackingStatus {
        this.ensureCapture();

        const videoElt = this.capture?.elt as HTMLVideoElement | undefined;
        if (!videoElt) return "ERROR";
        if (videoElt.readyState >= 2) {
            this.status = "READY";
        } else if (this.status !== "READY") {
            this.status = "INITIALIZING";
        }
        return this.status;
    }

    getVideo(): FailableResult<VideoSourceRef> {
        this.ensureCapture();

        const videoElt = this.capture?.elt as HTMLVideoElement | undefined;
        if (!videoElt) {
            return { success: false, error: "Video is not ready [ERROR]" };
        }
        if (this.getStatus() !== "READY") {
            return { success: false, error: "Video is not ready [" + this.getStatus() + "]" };
        }
        this.source = this.source ?? { kind: "webCam", node: this.capture };
        return { success: true, value: this.source };
    }

    getData(): VideoSourceRef | null {
        this.ensureCapture();

        const videoElt = this.capture?.elt as HTMLVideoElement | undefined;
        if (!this.capture || !videoElt || this.getStatus() !== "READY") {
            return null;
        }
        this.source = this.source ?? { kind: "webCam", node: this.capture };
        return this.source;
    }

    getDataResult(): FailableResult<VideoSourceRef> {
        return this.getVideo();
    }

    private ensureCapture(): void {
        if (this.sceneId === this.lastAttemptSceneId) {
            return;
        }

        this.lastAttemptSceneId = this.sceneId;
        this.status = this.status === "READY" ? "READY" : "INITIALIZING";

        const isTestEnv = typeof globalThis !== "undefined"
            && "process" in globalThis
            && Boolean((globalThis as any).process?.env?.VITEST);
        const permissions = typeof navigator !== "undefined"
            ? navigator.permissions
            : undefined;

        if (!isTestEnv && permissions?.query) {
            void permissions.query({ name: "camera" as any })
                .then((result) => {
                    if (result.state === "denied") {
                        this.status = "ERROR";
                        return;
                    }
                    this.createCapture();
                })
                .catch(() => {
                    this.createCapture();
                });
            return;
        }

        this.createCapture();
    }

    private createCapture(): void {
        try {
            if (this.capture) return;
            this.capture = this.p.createCapture(this.p.VIDEO);
            this.capture.size(this.videoWidth, this.videoHeight);
            this.capture.hide();
            this.capture.elt.onloadedmetadata = () => {
                this.capture.play();
            };
            this.capture.elt.onerror = () => {
                this.status = "ERROR";
            };
        } catch {
            this.status = "ERROR";
        }
    }
}
