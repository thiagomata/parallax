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
        // The video is created empty: the source goes in when it plays, so a page that does
        // not need the clip never fetches it.
        expect(p.createVideo).toHaveBeenCalledWith("");
        expect(video.node.src).toBe("");
        expect(video.node.elt.playsInline).toBe(true);
        expect(provider.getStatus()).toBe("READY");
        // autoplay: false - the video waits, and plays (and loops) when play() asks.
        expect(video.node.loop).not.toHaveBeenCalled();
        expect(video.node.play).not.toHaveBeenCalled();
        expect(video.node.autoplay).toHaveBeenCalledWith(false);
        expect(video.node.volume).toHaveBeenCalledWith(0);
        expect(video.node.hide).toHaveBeenCalled();
        provider.play();
        expect(video.node.src).toBe("/parallax/video/rick.mp4");
        expect(video.node.loop).toHaveBeenCalled();
    });

    it("waits for play() to start the download when told to preload nothing", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4", {
            autoplay: false,
            preload: "none",
        });
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        // Nothing downloaded and no data yet: the video waits (INITIALIZING) and only the
        // first play() starts it - and, with it, the download.
        expect(video.node.elt.preload).toBe("none");
        Object.defineProperty(video.node.elt, "paused", {
            value: true,
            configurable: true,
            writable: true,
        });
        expect(provider.getStatus()).toBe("INITIALIZING");
        provider.play();
        expect(video.node.loop).toHaveBeenCalled();
    });

    it("starts on its own when autoplay is not turned off", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4", {loop: true});
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

        expect(provider.getStatus()).toBe("READY");
        expect(video.node.loop).toHaveBeenCalled();
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
        // autoplay stays on: the video starts (and loops) by itself once it can play.
        expect(video.node.loop).toHaveBeenCalled();
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

        // The clip is wanted: it gets its source - and then the source is gone.
        provider.play();
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

    it("handles tick with sceneId already processed", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parllax/video/rick.mp4");
        provider.tick(1);
        provider.tick(1);
        expect(provider.getStatus()).toBe("INITIALIZING");
    });

    it("handles seekTo when readyState is below 1", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "readyState", {
            value: 0,
            configurable: true,
        });

        provider.seekTo(5);
    });

    it("handles load when video.elt.load exists", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "load", {
            value: vi.fn(),
            configurable: true,
            writable: true,
        });
        provider.load();
        expect(video.node.elt.load).toHaveBeenCalled();
    });

    it("handles getDuration when duration is undefined", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        expect(provider.getDuration()).toBe(0);
    });

    it("handles play when already playing", () => {
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
            value: false,
            configurable: true,
            writable: true,
        });

        provider.play();
    });

    it("handles play when readyState < 2", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "readyState", {
            value: 1,
            configurable: true,
        });

        provider.play();
    });

    it("handles getStatus with readyState 0", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "readyState", {
            value: 0,
            configurable: true,
        });

        expect(provider.getStatus()).toBe("INITIALIZING");
    });

    it("handles getStatus with readyState 1", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "readyState", {
            value: 1,
            configurable: true,
        });

        expect(provider.getStatus()).toBe("INITIALIZING");
    });

    it("handles getStatus with readyState 2", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "readyState", {
            value: 2,
            configurable: true,
        });

        expect(provider.getStatus()).toBe("READY");
    });

    it("handles getStatus with readyState 3", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        const video = provider.getData();
        expect(video).not.toBeNull();
        if (!video) return;

        Object.defineProperty(video.node.elt, "readyState", {
            value: 3,
            configurable: true,
        });

        expect(provider.getStatus()).toBe("READY");
    });

    it("handles multiple ticks with same sceneId", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        provider.tick(1);
        provider.tick(1);
        provider.tick(1);
        expect(provider.getStatus()).toBe("INITIALIZING");
    });

    it("handles ticks with different sceneIds", () => {
        const p = createMockP5() as any;
        const provider = new VideoDataProvider(p, "/parallax/video/rick.mp4");
        provider.tick(1);
        provider.tick(2);
        provider.tick(3);
        expect(provider.getStatus()).toBe("INITIALIZING");
    });
});
