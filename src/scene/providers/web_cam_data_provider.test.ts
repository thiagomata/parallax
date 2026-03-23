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
            expect(video.value).toBe(p._mockCapture);
        }
    });

    it("returns failure when capture is not ready", () => {
        const p = createMockP5() as any;
        p._mockCapture.elt.readyState = 1;

        const provider = new WebCamDataProvider(p, 320, 240);

        expect(provider.getData()).toBeNull();
        expect(provider.getVideo().success).toBe(false);
    });
});
