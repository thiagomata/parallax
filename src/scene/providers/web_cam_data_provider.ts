import p5 from "p5";
import type {DataProviderBundle, FailableResult, TrackingStatus} from "../types.ts";

export class WebCamDataProvider implements DataProviderBundle<"webCam", any> {
    readonly type = "webCam";

    private capture: any = null;
    private status: TrackingStatus = "IDLE";
    private sceneId = -1;
    private readonly videoWidth: number;
    private readonly videoHeight: number;

    constructor(
        p: p5,
        videoWidth: number = 640,
        videoHeight: number = 480,
    ) {
        this.videoWidth = videoWidth;
        this.videoHeight = videoHeight;
        this.capture = p.createCapture(p.VIDEO);
        this.capture.size(this.videoWidth, this.videoHeight);
        this.capture.hide();
        this.capture.elt.onloadedmetadata = () => {
            this.capture.play();
        };
        this.capture.elt.onerror = () => {
            this.status = "ERROR";
        };
    }

    tick(sceneId: number): void {
        if (this.sceneId === sceneId) return;
        this.sceneId = sceneId;

        if (this.status === "IDLE") {
            this.status = "INITIALIZING";
        }
    }

    getStatus(): TrackingStatus {
        const videoElt = this.capture?.elt as HTMLVideoElement | undefined;
        if (this.status === "ERROR") return this.status;
        if (!videoElt) return "ERROR";
        if (videoElt.readyState >= 2) {
            this.status = "READY";
        } else if (this.status !== "READY") {
            this.status = "INITIALIZING";
        }
        return this.status;
    }

    getVideo(): FailableResult<any> {
        const videoElt = this.capture?.elt as HTMLVideoElement | undefined;
        if (!videoElt) {
            return { success: false, error: "Video is not ready [ERROR]" };
        }
        if (this.getStatus() !== "READY") {
            return { success: false, error: `Video is not ready [${this.status}]` };
        }
        if (videoElt.readyState < 2) {
            return { success: false, error: `Video element not ready [readyState: ${videoElt.readyState}]` };
        }
        return { success: true, value: this.capture };
    }

    getData(): any | null {
        const result = this.getVideo();
        return result.success ? result.value : null;
    }

    getDataResult(): FailableResult<any> {
        return this.getVideo();
    }
}
