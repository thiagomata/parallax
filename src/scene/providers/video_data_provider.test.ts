import { describe, expect, it, vi } from "vitest";
import { createMockP5 } from "../mock/mock_p5.mock.ts";
import { VideoDataProvider } from "./video_data_provider.ts";

describe("VideoDataProvider", () => {
    it("creates a looping p5 media element", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4", {
            loop: true,
            autoplay: false,
            muted: true,
            playsInline: true,
        });
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "paused", {
            value: true,
            configurable: true,
            writable: true,
        });
        Object.defineProperty(video.node.elt, "readyState", {
            value: 4,
            configurable: true,
        });

        expect(video.kind).toBe("video");
        expect(p.createVideo).toHaveBeenCalledWith("/parallax/video/rick.mp4");
        expect(video.node.elt.playsInline).toBe(true);
        expect(provider.getStatus()).toBe("READY");
        expect(video.node.loop).toHaveBeenCalled();
        expect(video.node.autoplay).toHaveBeenCalledWith(false);
        expect(video.node.volume).toHaveBeenCalledWith(0);
        expect(video.node.hide).toHaveBeenCalled();
        expect(video.node.play).toHaveBeenCalled();
    });

    it("reports READY once the video can play", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "readyState", {
            value: 4,
            configurable: true,
        });

        expect(provider.getStatus()).toBe("READY");
        expect(provider.getDataResult().success).toBe(true);
    });

    it("recovers when the video element becomes ready after an error", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "paused", {
            value: true,
            configurable: true,
            writable: true,
        });
        video.node.elt.dispatchEvent(new Event("error"));

        expect(provider.getStatus()).toBe("INITIALIZING");

        Object.defineProperty(video.node.elt, "readyState", {
            value: 4,
            configurable: true,
        });

        expect(provider.getStatus()).toBe("READY");
        expect(video.node.play).toHaveBeenCalled();
        expect(provider.getData()).not.toBeNull();
        expect(provider.getDataResult().success).toBe(true);
    });

    it("returns ERROR status when video fails to load", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/bad.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        provider.tick(1);
        expect(provider.getStatus()).toBe("INITIALIZING");

        video.node.src = "";

        expect(provider.getStatus()).toBe("ERROR");
        expect(provider.getData()).toBeNull();
        expect(provider.getDataResult()).toEqual({
            success: false,
            error: "Video is not ready [ERROR]",
        });
    });

    it("handles error when video.play throws", async () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "readyState", {
            value: 4,
            configurable: true,
        });
        Object.defineProperty(video.node.elt, "paused", {
            value: true,
            configurable: true,
            writable: true,
        });

        const originalPlay = video.node.play;
        video.node.play = vi.fn().mockImplementation(() => {
            throw new DOMException("play() aborted", "AbortError");
        }) as any;

        expect(provider.getStatus()).toBe("READY");

        video.node.play = originalPlay;
    });
});
