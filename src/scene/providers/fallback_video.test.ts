import { describe, expect, it, vi } from "vitest";
import { FallbackVideo } from "./fallback_video.ts";
import type { VideoDataProvider } from "./video_data_provider.ts";
import type { WebCamDataProvider } from "./web_cam_data_provider.ts";
import type { TrackingStatus } from "../types.ts";

/** A clip that only records what it is asked to do. */
function mockClip() {
    return { play: vi.fn(), pause: vi.fn() } as unknown as VideoDataProvider & {
        play: ReturnType<typeof vi.fn>;
        pause: ReturnType<typeof vi.fn>;
    };
}

/** A camera with a status the test controls. */
function mockCamera(status: TrackingStatus) {
    return { getStatus: () => status } as unknown as WebCamDataProvider;
}

describe("FallbackVideo: the clip waits for the camera", () => {
    it("never plays behind a working camera", () => {
        const clip = mockClip();
        const fallback = new FallbackVideo(clip, mockCamera("READY"), 0);

        fallback.update(0);
        fallback.update(1);
        fallback.update(10);

        expect(clip.play).not.toHaveBeenCalled();
        expect(clip.pause).toHaveBeenCalled();
    });

    it("waits for the camera that is still coming up", () => {
        const clip = mockClip();
        const fallback = new FallbackVideo(clip, mockCamera("INITIALIZING"), 0);

        // While the camera may still arrive, nothing is downloaded and nothing plays.
        fallback.update(0);
        fallback.update(1);
        expect(clip.play).not.toHaveBeenCalled();

        // It takes too long: the clip takes over.
        fallback.update(FallbackVideo.GRACE_SECONDS + 0.1);
        expect(clip.play).toHaveBeenCalled();
    });

    it("takes over at once when there is no camera", () => {
        const clip = mockClip();
        const fallback = new FallbackVideo(clip, mockCamera("ERROR"), 0);

        fallback.update(0);

        expect(clip.play).toHaveBeenCalled();
    });

    it("stops when the camera comes up after the clip took over", () => {
        const clip = mockClip();
        let status: TrackingStatus = "ERROR";
        const fallback = new FallbackVideo(clip, { getStatus: () => status } as unknown as WebCamDataProvider, 0);

        fallback.update(0);
        expect(clip.play).toHaveBeenCalled();

        status = "READY";
        fallback.update(1);
        expect(clip.pause).toHaveBeenCalled();
    });
});
