import { describe, it, vi, expect } from 'vitest';
import { HeadTrackingDataProvider } from "./head_tracking_data_provider";
import type { FaceProvider } from "./face_provider.ts";
import { Face } from "../drivers/mediapipe/face.ts";


function MockFaceProvider(mockFace: Face | null): FaceProvider {
    return {
        getFace: vi.fn().mockReturnValue(mockFace),
        getStatus: vi.fn().mockReturnValue('READY'),
        getVideo: vi.fn(),
        init: vi.fn(),
    };
}

describe("HeadTrackingDataProvider", () => {
    const sceneHeadWidth = 120;
    const sceneScreenWidth = 650;

    const mockFace = {
        width: 0.5,
        skullCenter: {
            position: { x: 0.5, y: 0.5, z: 0.5 }
        }
    } as unknown as Face;

    it("should compute midpoint based on face position and size", () => {
        const mockProvider = MockFaceProvider(mockFace);
        const tracker = new HeadTrackingDataProvider(
            {} as any,
            sceneHeadWidth,
            sceneScreenWidth
        );
        (tracker as any).provider = mockProvider;
        (tracker as any).panelPosition = { x: 0, y: 0, z: 0 };
        (tracker as any).cameraPosition = { x: 0, y: 0, z: 300 };

        const data = tracker.getData();
        expect(data).not.toBeNull();

        const faceScreenWidth = mockFace.width * sceneScreenWidth;
        const cameraToPanelZ = 0 - 300;
        const diff = ((sceneHeadWidth / faceScreenWidth) - 1);
        const expectedZ = cameraToPanelZ * diff;

        expect(data!.midpoint.z).toBeCloseTo(expectedZ);
    });

    it("should return last face if no face detected", () => {
        const mockProvider = MockFaceProvider(null);
        const tracker = new HeadTrackingDataProvider(
            {} as any,
            sceneHeadWidth,
            sceneScreenWidth
        );
        (tracker as any).provider = mockProvider;

        const first = tracker.getData();
        expect(first).toBeNull();

        const mockLastFace = {
            face: mockFace,
            sceneHeadWidth,
            midpoint: { x: 0, y: 0, z: 0 }
        };
        (tracker as any).lastFace = mockLastFace;
        const data = tracker.getData();
        expect(data).toEqual(mockLastFace);
    });
});
