import { describe, it, vi, expect } from 'vitest';
import { HeadTrackingDataProvider, DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_PANEL_POSITION } from "./head_tracking_data_provider";
import type { FaceProvider } from "./face_provider.ts";
import { Face } from "../drivers/mediapipe/face.ts";

const createMockP5WithCapture = () => ({
    createCapture: vi.fn().mockReturnValue({
        size: vi.fn(),
        hide: vi.fn(),
        elt: { readyState: 4, onloadedmetadata: null, onerror: null },
        play: vi.fn(),
    }),
});

function MockFaceProvider(mockFace: Face | null, status: string = 'READY', mockVideo: any = { mock: 'capture' }): FaceProvider {
    return {
        getFace: vi.fn().mockReturnValue(mockFace ? { success: true, value: mockFace } : { success: false, error: 'No face' }),
        getStatus: vi.fn().mockReturnValue(status),
        getVideo: vi.fn().mockReturnValue({ success: true, value: mockVideo }),
        init: vi.fn().mockResolvedValue(undefined),
    };
}

describe("HeadTrackingDataProvider", () => {
    const sceneHeadWidth = 120;
    const sceneScreenWidth = 650;

    const mockFace = {
        width: 0.5,
        skullCenter: {
            position: { x: 0.5, y: 0.5, z: 0.5 }
        },
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
    } as unknown as Face;

    it("should compute midpoint based on face position and size", () => {
        const mockProvider = MockFaceProvider(mockFace);
        const mockP5 = createMockP5WithCapture();
        const tracker = new HeadTrackingDataProvider(
            mockP5 as any,
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

    it("should scale depth using face calibration settings", () => {
        const mockProvider = MockFaceProvider(mockFace);
        const mockP5 = createMockP5WithCapture();
        const tracker = new HeadTrackingDataProvider(
            mockP5 as any,
            sceneHeadWidth,
            sceneScreenWidth,
            false,
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 300 },
            {
                physicalHeadWidth: 300,
                focalLength: 2,
            },
        );
        (tracker as any).provider = mockProvider;

        const data = tracker.getData();
        expect(data).not.toBeNull();

        const faceScreenWidth = mockFace.width * sceneScreenWidth;
        const cameraToPanelZ = 0 - 300;
        const diff = ((sceneHeadWidth / faceScreenWidth) - 1);
        const expectedZ = cameraToPanelZ * diff * 4;

        expect(data!.midpoint.z).toBeCloseTo(expectedZ);
    });

    it("should return last face if no face detected", () => {
        const mockProvider = MockFaceProvider(null);
        const mockP5 = createMockP5WithCapture();
        const tracker = new HeadTrackingDataProvider(
            mockP5 as any,
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

    describe("FaceWorldData", () => {
        it("should transform nose position correctly", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).panelPosition = { x: 0, y: 0, z: 0 };
            (tracker as any).cameraPosition = { x: 0, y: 0, z: 300 };

            const data = tracker.getData();
            expect(data).not.toBeNull();
            
            const nose = data!.nose;
            expect(nose.x).toBeDefined();
            expect(nose.y).toBeDefined();
            expect(nose.z).toBeDefined();
        });

        it("should provide eyes positions", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).panelPosition = { x: 0, y: 0, z: 0 };
            (tracker as any).cameraPosition = { x: 0, y: 0, z: 300 };

            const data = tracker.getData();
            expect(data).not.toBeNull();

            const eyes = data!.eyes;
            expect(eyes.left.x).toBeDefined();
            expect(eyes.right.x).toBeDefined();
        });

        it("should provide brows positions", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).panelPosition = { x: 0, y: 0, z: 0 };
            (tracker as any).cameraPosition = { x: 0, y: 0, z: 300 };

            const data = tracker.getData();
            expect(data).not.toBeNull();

            const brows = data!.brows;
            expect(brows.left.x).toBeDefined();
            expect(brows.right.x).toBeDefined();
        });

        it("should provide bounds positions", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).panelPosition = { x: 0, y: 0, z: 0 };
            (tracker as any).cameraPosition = { x: 0, y: 0, z: 300 };

            const data = tracker.getData();
            expect(data).not.toBeNull();

            const bounds = data!.bounds;
            expect(bounds.left.x).toBeDefined();
            expect(bounds.right.x).toBeDefined();
            expect(bounds.top.x).toBeDefined();
            expect(bounds.bottom.x).toBeDefined();
        });

        it("should provide stick rotation", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).panelPosition = { x: 0, y: 0, z: 0 };
            (tracker as any).cameraPosition = { x: 0, y: 0, z: 300 };

            const data = tracker.getData();
            expect(data).not.toBeNull();

            const stick = data!.stick;
            expect(stick.yaw).toBe(mockFace.yaw);
            expect(stick.pitch).toBe(-mockFace.pitch);
            expect(stick.roll).toBe(-mockFace.roll);
        });

        it("should store sceneHeadWidth and face reference", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).panelPosition = { x: 0, y: 0, z: 0 };
            (tracker as any).cameraPosition = { x: 0, y: 0, z: 300 };

            const data = tracker.getData();
            expect(data).not.toBeNull();
            expect(data!.sceneHeadWidth).toBe(sceneHeadWidth);
            expect(data!.face).toBe(mockFace);
        });
    });

    describe("validation", () => {
        it("should throw error for invalid sceneHeadWidth", () => {
            const mockP5 = createMockP5WithCapture();
            expect(() => {
                new HeadTrackingDataProvider(mockP5 as any, -10, sceneScreenWidth);
            }).toThrow("Invalid scene head width");
        });

        it("should throw error for zero sceneHeadWidth", () => {
            const mockP5 = createMockP5WithCapture();
            expect(() => {
                new HeadTrackingDataProvider(mockP5 as any, 0, sceneScreenWidth);
            }).toThrow("Invalid scene head width");
        });

        it("should throw error for invalid sceneScreenWidth", () => {
            const mockP5 = createMockP5WithCapture();
            expect(() => {
                new HeadTrackingDataProvider(mockP5 as any, sceneHeadWidth, -100);
            }).toThrow("Invalid scene screen width");
        });

        it("should throw error for zero sceneScreenWidth", () => {
            const mockP5 = createMockP5WithCapture();
            expect(() => {
                new HeadTrackingDataProvider(mockP5 as any, sceneHeadWidth, 0);
            }).toThrow("Invalid scene screen width");
        });
    });

    describe("init", () => {
        it("should call provider init", async () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;

            await tracker.init();

            expect(mockProvider.init).toHaveBeenCalled();
        });
    });

    describe("tick", () => {
        it("should call provider getStatus", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;

            tracker.tick(1);

            expect(mockProvider.getStatus).toHaveBeenCalled();
        });

        it("should skip if same sceneId", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).sceneId = 1;

            tracker.tick(1);

            expect(mockProvider.getStatus).not.toHaveBeenCalled();
        });

        it("should call getStatus when sceneId changes", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).sceneId = 1;

            tracker.tick(2);

            expect(mockProvider.getStatus).toHaveBeenCalled();
        });
    });

    describe("getVideo", () => {
        it("should return video from provider", () => {
            const mockVideo = { foo: "bar" };
            const mockWebCam = {
                getVideo: vi.fn().mockReturnValue(mockVideo),
                getData: vi.fn().mockReturnValue(mockVideo),
            };
            const mockProvider = MockFaceProvider(mockFace);
            (mockProvider as any).getVideo = vi.fn().mockReturnValue(mockVideo);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).webCamProvider = mockWebCam;

            const video = tracker.getVideo();

            expect(video.success).toBe(true);
            if (video.success) {
                expect(video.value).toBe(mockVideo);
            }
        });

        it("should fall back to the next source when webcam is unavailable", () => {
            const mockVideo = { foo: "video" };
            const mockWebCam = {
                getDataResult: vi.fn().mockReturnValue({ success: false as const, error: "not ready" }),
                getData: vi.fn().mockReturnValue(null),
            };
            const mockFallbackVideo = {
                getDataResult: vi.fn().mockReturnValue({ success: true as const, value: mockVideo }),
                getData: vi.fn().mockReturnValue(mockVideo),
            };
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;
            (tracker as any).webCamProvider = mockWebCam;
            (tracker as any).sourceProviders = [mockWebCam, mockFallbackVideo];

            const video = tracker.getVideo();

            expect(video.success).toBe(true);
            if (video.success) {
                expect(video.value).toBe(mockVideo);
            }
        });
    });

    describe("default positions", () => {
        it("should have correct default camera position", () => {
            expect(DEFAULT_CAMERA_POSITION).toEqual({ x: 0, y: 0, z: 300 });
        });

        it("should have correct default panel position", () => {
            expect(DEFAULT_CAMERA_PANEL_POSITION).toEqual({ x: 0, y: 0, z: 0 });
        });

        it("should use default positions when not provided", () => {
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(mockP5 as any);
            expect(tracker.cameraPosition).toEqual(DEFAULT_CAMERA_POSITION);
            expect(tracker.panelPosition).toEqual(DEFAULT_CAMERA_PANEL_POSITION);
        });
    });

    describe("sceneScreenHeadProportion", () => {
        it("should calculate proportion correctly", () => {
            const mockProvider = MockFaceProvider(mockFace);
            const mockP5 = createMockP5WithCapture();
            const tracker = new HeadTrackingDataProvider(
                mockP5 as any,
                sceneHeadWidth,
                sceneScreenWidth
            );
            (tracker as any).provider = mockProvider;

            expect(tracker.sceneScreenHeadProportion).toBe(sceneHeadWidth / sceneScreenWidth);
        });
    });
});
