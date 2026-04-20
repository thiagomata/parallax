import { describe, it, vi, expect } from 'vitest';
import { HeadTrackingDataProvider } from "./head_tracking_data_provider";
import type { FaceProvider } from "./face_provider.ts";
import type { Face } from "../drivers/mediapipe/face.ts";
import { SceneFaceBuilder } from "./scene_face.ts";
import { FaceTrackingConfigBuilder } from "../types.ts";
import type { VideoPixels, SceneUnits, VideoWidthRatio } from "../types.ts";

const createMockP5WithCapture = () => ({
    createCapture: vi.fn().mockReturnValue({
        size: vi.fn(),
        hide: vi.fn(),
        elt: { readyState: 4, onloadedmetadata: null, onerror: null },
        play: vi.fn(),
    }),
});

function MockFaceProvider(mockFace: Face<VideoWidthRatio> | null, status: string = 'READY', mockVideo: any = { mock: 'capture' }): FaceProvider {
    return {
        getFace: vi.fn().mockReturnValue(mockFace ? { success: true, value: mockFace } : { success: false, error: 'No face' }),
        getStatus: vi.fn().mockReturnValue(status),
        getVideo: vi.fn().mockReturnValue({ success: true, value: mockVideo }),
        init: vi.fn().mockResolvedValue(undefined),
    };
}

describe("HeadTrackingDataProvider", () => {
    // Test configuration: 1920x1080 video, expected head is 33% of screen
    const faceRatioAtScreen = 1/3;
    const videoWidthPixel = 1920 as VideoPixels;
    const videoHeightPixel = 1080 as VideoPixels;
    const baselineHeadWidthPixel = 1920 * faceRatioAtScreen as VideoPixels;
    const baselineHeadWidthScene = 100 as SceneUnits;

    // size of the head at the baseline in the scene using scene units
    const sceneScreenWidth = 300 as SceneUnits;
    
    const createConfig = () => {
        return new FaceTrackingConfigBuilder()
            .videoWidthPixels(videoWidthPixel)
            .videoHeightPixels(videoHeightPixel)
            .baselineHeadPixels(baselineHeadWidthPixel)
            .baselineHeadSceneUnits(baselineHeadWidthScene)
            .baseline({ x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits })
            .cameraPosition({ x: 0 as SceneUnits, y: 0 as SceneUnits, z: 300 as SceneUnits })
            .depthScale(1)
            .mirror(false)
            .throttleThreshold(1000)
            .build();
    };

    const mockFace = {
        width: faceRatioAtScreen,
        skullCenter: {
            position: { x: 0.5, y: 0.5, z: 0.5 }
        },
        getRotation: () => ({
            rotation: {
                yaw: 0.1,
                pitch: 0.2,
                roll: 0.05,
            }
        }),
        rebase: {
            nose: { x: 0.5, y: 0.5, z: 0.5 },
            leftEye: { x: 0.4, y: 0.5, z: 0.5 },
            rightEye: { x: 0.6, y: 0.5, z: 0.5 },
            leftBrow: { x: 0.4, y: 0.6, z: 0.5 },
            rightBrow: { x: 0.6, y: 0.6, z: 0.5 },
            leftEar: { x: 0.2, y: 0.5, z: 0.5 },
            rightEar: { x: 0.8, y: 0.5, z: 0.5 },
            middleTop: { x: 0.5, y: 0.7, z: 0.5 },
            middleBottom: { x: 0.5, y: 0.3, z: 0.5 },
        },
        yaw: 0.1,
        pitch: 0.2,
        roll: 0.05,
    } as Face<VideoWidthRatio>;

    it("should compute midpoint based on face position and size", () => {
        const mockProvider = MockFaceProvider(mockFace);
        const mockP5 = createMockP5WithCapture();
        const tracker = new HeadTrackingDataProvider(
            mockP5 as any,
            createConfig(),
        );
        (tracker as any).provider = mockProvider;

        const data = tracker.getData();
        expect(data).not.toBeNull();

        // At baseline (face.width = 0.5 = expected), localZ should be 0
        const expectedFace = new SceneFaceBuilder()
            .config({ 
                sceneScreenWidth, 
                baseline: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits },
                baselineHeadSceneUnits: baselineHeadWidthScene 
            })
            .actualFacePixelWidth(baselineHeadWidthPixel)  // same as baseline = ratio 1
            .baselineFacePixelWidth(baselineHeadWidthPixel)
            .build();

        expect(data!.localPosition.z).toBeCloseTo(expectedFace.localPosition.z);
    });

    it("should scale depth using face calibration settings", () => {
        // Face is half the expected size = smaller in video = farther from camera
        const mockFaceSmaller = {
            ...mockFace,
            width: 0.25,  // half of 0.5 baseline
} as unknown as Face<VideoWidthRatio>;
        
        const mockProvider = MockFaceProvider(mockFaceSmaller);
        const mockP5 = createMockP5WithCapture();
        const config = new FaceTrackingConfigBuilder()
            .videoWidthPixels(videoWidthPixel)
            .videoHeightPixels(videoHeightPixel)
            .baselineHeadPixels(baselineHeadWidthPixel)
            .baselineHeadSceneUnits(baselineHeadWidthScene)
            .baseline({ x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits })
            .cameraPosition({ x: 0 as SceneUnits, y: 0 as SceneUnits, z: 300 as SceneUnits })
            .depthScale(4)  // scale factor
            .build();
        
        const tracker = new HeadTrackingDataProvider(mockP5 as any, config);
        (tracker as any).provider = mockProvider;

        const data = tracker.getData();
        expect(data).not.toBeNull();

        // ratio = 0.25 * 1920 / 640 = 480 / 640 = 0.75
        // When smaller (0.25 vs 0.5 expected), head is FARTHER
        // distanceFromCamera = 300 / 0.75 = 400
        // faceZ = 300 + (-1) * 400 = -100 (behind baseline)
        // localZ = (-100 - 0) * 4 = -400
        expect(data!.worldPosition.z).toBeCloseTo(-400);
    });

    it("should return last face if no face detected", () => {
        const mockProvider = MockFaceProvider(null);
        const mockP5 = createMockP5WithCapture();
        const tracker = new HeadTrackingDataProvider(
            mockP5 as any,
            createConfig(),
        );
        (tracker as any).provider = mockProvider;

        const first = tracker.getData();
        expect(first).toBeNull();
    });

    it("should store sceneHeadWidth and face reference", () => {
        const mockProvider = MockFaceProvider(mockFace);
        const mockP5 = createMockP5WithCapture();
        const tracker = new HeadTrackingDataProvider(
            mockP5 as any,
            createConfig(),
        );
        (tracker as any).provider = mockProvider;

        const data = tracker.getData();
        expect(data).not.toBeNull();
        expect(data!.sceneFace.headWidthScene).toBe(baselineHeadWidthScene);
        expect(data!.face).toBe(mockFace);
    });

    describe("validation", () => {
        it("should throw error for invalid baselineHeadPixels", () => {
            const mockP5 = createMockP5WithCapture();
            expect(() => {
                const invalidConfig = new FaceTrackingConfigBuilder()
                    .baselineHeadPixels(-10 as VideoPixels)
                    .baselineHeadSceneUnits(100 as SceneUnits)
                    .build();
                new HeadTrackingDataProvider(mockP5 as any, invalidConfig);
            }).toThrow("Invalid");
        });

        it("should throw error for zero baselineHeadPixels", () => {
            const mockP5 = createMockP5WithCapture();
            expect(() => {
                const invalidConfig = new FaceTrackingConfigBuilder()
                    .baselineHeadPixels(0 as VideoPixels)
                    .baselineHeadSceneUnits(100 as SceneUnits)
                    .build();
                new HeadTrackingDataProvider(mockP5 as any, invalidConfig);
            }).toThrow("Invalid");
        });
    });
});