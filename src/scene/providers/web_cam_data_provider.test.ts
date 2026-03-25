import { describe, expect, it } from "vitest";
import { createMockP5 } from "../mock/mock_p5.mock.ts";
import { WebCamDataProvider } from "./web_cam_data_provider.ts";

describe("WebCamDataProvider", () => {
    it("creates and exposes webcam capture", () => {
        const p = createMockP5() as any;
        const provider = new WebCamDataProvider(p, 320, 240);

        expect(p.createCapture).toHaveBeenCalledWith(p.VIDEO);
        expect(provider.getData()).not.toBeNull();

        const video = provider.getVideo();
        expect(video.success).toBe(true);
        if (video.success) {
            expect(video.value.kind).toBe("webCam");
            expect(video.value.node).toBe(p._mockCapture);
        }
    });

    it("returns failure when capture is not ready", () => {
        const p = createMockP5() as any;
        p._mockCapture.elt.readyState = 1;

        const provider = new WebCamDataProvider(p, 320, 240);

        expect(provider.getStatus()).toBe("INITIALIZING");
        expect(provider.getData()).toBeNull();
        expect(provider.getVideo().success).toBe(false);
        expect(provider.getDataResult().success).toBe(false);
    });

    it("reports READY when the underlying video element is ready", () => {
        const p = createMockP5() as any;
        p._mockCapture.elt.readyState = 2;

        const provider = new WebCamDataProvider(p, 320, 240);

        expect(provider.getStatus()).toBe("READY");
    });

    it("keeps READY status sticky and ignores duplicate ticks for the same scene", () => {
        const p = createMockP5() as any;
        p._mockCapture.elt.readyState = 1;
        const provider = new WebCamDataProvider(p, 320, 240);

        provider.tick(7);
        expect(provider.getStatus()).toBe("INITIALIZING");

        provider.tick(7);
        expect((provider as any).sceneId).toBe(7);

        p._mockCapture.elt.readyState = 2;
        expect(provider.getStatus()).toBe("READY");

        p._mockCapture.elt.readyState = 1;
        expect(provider.getStatus()).toBe("READY");
    });

    it("returns error when capture is missing", () => {
        const p = createMockP5() as any;
        const provider = new WebCamDataProvider(p, 320, 240);

        (provider as any).capture = { elt: null };
        provider.tick(12);

        expect(provider.getStatus()).toBe("ERROR");
        expect(provider.getData()).toBeNull();

        const video = provider.getVideo();
        expect(video.success).toBe(false);
        expect(provider.getDataResult().success).toBe(false);
    });

    it("wires metadata and error callbacks on the capture element", () => {
        const p = createMockP5() as any;
        const provider = new WebCamDataProvider(p, 320, 240);

        expect(p._mockCapture.elt.onloadedmetadata).toBeTypeOf("function");
        expect(p._mockCapture.elt.onerror).toBeTypeOf("function");

        p._mockCapture.elt.onloadedmetadata();
        expect(p._mockCapture.play).toHaveBeenCalled();

        p._mockCapture.elt.onerror();
        expect(provider.getStatus()).toBe("READY");
    });
});
