import { describe, it, vi, expect } from 'vitest';
import { HeadTrackingDataProvider, type HeadProportions } from "./head_tracking_data_provider";
import type {FaceGeometry, FaceProvider, Vector3} from "../types.ts";


function MockFaceProvider(mockFace: FaceGeometry | null) {

    return {
        getFace: vi.fn().mockReturnValue(mockFace),
        getStatus: vi.fn().mockReturnValue('READY'),
        getVideo: vi.fn(),
        init: vi.fn(),
    }  as FaceProvider;
}

describe("HeadTrackingDataProvider", () => {
    const defaultProportions: HeadProportions = { width: 1, heightRatio: 1.25, depthRatio: 0.85 };

    const mockFace: FaceGeometry = {
        world: {
            center: { x: 0.5, y: 0.5, z: 0.5 },
            unitScale: 1.0,
            rotation: { yaw: 0, pitch: 0, roll: 0 }
        },
        nose: { x: 0.5, y: 0.5, z: 0.5 },
        eyes: {
            left: { x: 0.4, y: 0.45, z: 0.45 },
            right: { x: 0.6, y: 0.45, z: 0.45 },
            midpoint: { x: 0.5, y: 0.45, z: 0.45 }
        },
        rig: {
            center: { x: 0.5, y: 0.5, z: 0.5 },
            leftEar: { x: 0.3, y: 0.5, z: 0.5 },
            rightEar: { x: 0.7, y: 0.5, z: 0.5 }
        },
        bounds: {
            left: { x: 0.3, y: 0.4, z: 0.4 },
            right: { x: 0.7, y: 0.6, z: 0.6 },
            top: { x: 0.5, y: 0.4, z: 0.4 },
            bottom: { x: 0.5, y: 0.6, z: 0.6 }
        }
    };

    it("should transform normalized coordinates to scene units correctly", () => {
        const mockProvider = MockFaceProvider(mockFace);
        const sceneHeadWidth = 50;
        const tracker = new HeadTrackingDataProvider(
            {} as any, // p5 instance not needed for test
            sceneHeadWidth,
            defaultProportions
        );

        // Replace internal provider with mock
        (tracker as any).provider = mockProvider;

        const data = tracker.getData();
        expect(data).not.toBeNull();

        const expectedNose: Vector3 = {
            x: (mockFace.nose.x - 0.5) * sceneHeadWidth,
            y: (mockFace.nose.y - 0.5) * sceneHeadWidth * defaultProportions.heightRatio,
            z: (mockFace.bounds.right.x - mockFace.bounds.left.x - 0.3) * 500 + (0.5 - mockFace.nose.z) * sceneHeadWidth * defaultProportions.depthRatio
        };

        expect(data!.nose).toEqual(expectedNose);

        // Check rotation stick
        expect(data!.stick.roll).toBeCloseTo(Math.atan2(
            mockFace.eyes.right.y - mockFace.eyes.left.y,
            mockFace.eyes.right.x - mockFace.eyes.left.x
        ));

        expect(data!.stick.yaw).toBeCloseTo(Math.asin(mockFace.nose.x - (mockFace.bounds.left.x + mockFace.bounds.right.x) / 2));
        expect(data!.stick.pitch).toBeCloseTo(Math.asin(mockFace.nose.y - (mockFace.bounds.top.y + mockFace.bounds.bottom.y) / 2));
    });

    // it("should return last face if no face detected", () => {
    //     const mockProvider = MockFaceProvider(null);
    //     const tracker = new HeadTrackingDataProvider({} as any, 50, defaultProportions);
    //     (tracker as any).provider = mockProvider;
    //
    //     const first = tracker.getData();
    //     expect(first).toBeNull();
    //
    //     // set lastFace manually
    //     (tracker as any).lastFace = { ...mockFace, noseRaw: mockFace.nose } as FaceWorldData;
    //     const data = tracker.getData();
    //     expect(data).toEqual((tracker as any).lastFace);
    // });
});