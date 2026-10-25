import type { VideoDataProvider } from "./video_data_provider.ts";
import type { WebCamDataProvider } from "./web_cam_data_provider.ts";

/**
 * The replacement clip: the prerecorded faces a tutorial shows when the camera is down.
 *
 * It plays only while the camera is really down. The camera needs a moment to come up - the
 * browser asks for the permission, the first frames arrive - so the clip waits a little
 * first: a page whose camera works never downloads the movie and never plays it behind the
 * live picture. When there is no camera at all, the clip takes over at once.
 */
export class FallbackVideo {
    /** How long the camera gets before the clip takes over (seconds). */
    static readonly GRACE_SECONDS = 2.5;

    private readonly clip: VideoDataProvider;
    private readonly webCam: WebCamDataProvider;
    private readonly startedAt: number;

    constructor(clip: VideoDataProvider, webCam: WebCamDataProvider, now: number) {
        this.clip = clip;
        this.webCam = webCam;
        this.startedAt = now;
    }

    /**
     * Called every frame while the scene runs: the clip plays only while the camera is down.
     * @param now - the time in seconds (the scene's clock)
     */
    public update(now: number): void {
        const camera = this.webCam.getStatus();
        if (camera === "READY") {
            // The camera is working: the clip stops. It was never even downloaded.
            this.clip.pause();
            return;
        }
        if (camera !== "ERROR" && now - this.startedAt < FallbackVideo.GRACE_SECONDS) {
            // The camera is still coming up: the clip waits, so nothing is downloaded.
            return;
        }
        // There is no camera, or it is taking too long: the clip takes over.
        this.clip.play();
    }
}
