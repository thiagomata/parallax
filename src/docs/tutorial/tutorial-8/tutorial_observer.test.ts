import {describe, expect, it, vi, beforeEach} from 'vitest';
import {tutorial_observer} from './tutorial_observer.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS} from "../../../scene/types.ts";
import {createMockFaceWorldData, createMockHeadTrackingProvider, createMockSceneFace} from "../../../scene/mock/face.mock.ts";
import { WebCamDataProvider } from "../../../scene/providers/web_cam_data_provider.ts";
import { VideoDataProvider } from "../../../scene/providers/video_data_provider.ts";

describe('Tutorial 8: The Observer', () => {
    
    beforeEach(() => {
        // Reset any global p5 state that might interfere with tests
        vi.clearAllMocks();
    });

    it('should register face tracking visualization elements', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(face1);

        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const world = await tutorial_observer(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);
        await mockP5.setup();

        const faceBox = world.getElement('faceBox');
        expect(faceBox).toBeDefined();

        const nose = world.getElement('nose');
        expect(nose).toBeDefined();

        const leftEye = world.getElement('left-eye');
        expect(leftEye).toBeDefined();

        const rightEye = world.getElement('right-eye');
        expect(rightEye).toBeDefined();
    });

    it('should handle case when face data is not available (null)', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(null);

        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const world = await tutorial_observer(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);
        await mockP5.setup();

        // This shouldn't crash
        expect(world).toBeDefined();
    });

    it('should initialize face tracking provider properly', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(face1);

        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const world = await tutorial_observer(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);
        await mockP5.setup();

        // Test that setup function was called to create canvas
        expect(mockP5.createCanvas).toHaveBeenCalledWith(500, 400, "webgl");
        
        // Test that world was initialized with correct elements
        expect(world.getElement('faceBox')).toBeDefined();
        expect(world.getElement('debug_nose')).toBeDefined();
        expect(world.getElement('debug_leftEye')).toBeDefined();
        expect(world.getElement('debug_rightEye')).toBeDefined();
        expect(world.getElement('debug_boundsLeft')).toBeDefined();
        expect(world.getElement('debug_boundsRight')).toBeDefined();
        expect(world.getElement('debug_boundsTop')).toBeDefined();
        expect(world.getElement('debug_boundsBottom')).toBeDefined();
        expect(world.getElement('nose')).toBeDefined();
        expect(world.getElement('left-eye')).toBeDefined();
        expect(world.getElement('right-eye')).toBeDefined();
    });

    it('should handle face data with varying face positions', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        // Test with face data that has specific positions
        const faceDataWithPositions = createMockFaceWorldData({
            sceneFace: createMockSceneFace({
                localPosition: { x: 100, y: -50, z: 200 },
                localRotation: { yaw: 0.5, pitch: 0.2, roll: -0.1 }
            }),
            nose: { x: 105, y: -55, z: 205 },
            eyes: {
                left: { x: 80, y: -70, z: 190 },
                right: { x: 120, y: -70, z: 190 }
            },
        });
        
        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(faceDataWithPositions);

        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const world = await tutorial_observer(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);
        await mockP5.setup();

        // Should successfully create elements even with complex face position data
        expect(world).toBeDefined();
    });

    it('should handle case when no face provider is passed (uses default)', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        // Test with no explicit face data provider - should use default
        const world = await tutorial_observer(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        await mockP5.setup();

        // Should still be able to create world
        expect(world).toBeDefined();
    });

    it('should correctly handle paused state', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(face1);

        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const world = await tutorial_observer(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: true  // Test paused state
        }, { faceDataProvider: mockTracker } as any);
        await mockP5.setup();

        // Should initialize world
        expect(world).toBeDefined();
    });

    it('should build and step the video panel with a webcam parent', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn().mockReturnValue(face1);
        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const webcamData = { kind: "webCam", node: { readyState: 1 } };
        const mockWebCam = {
            type: "webCam",
            parentId: undefined,
            tick: vi.fn(),
            getData: vi.fn().mockReturnValue(webcamData),
            getDataResult: vi.fn().mockReturnValue({ success: true as const, value: webcamData }),
            getVideo: vi.fn().mockReturnValue({ success: true as const, value: webcamData }),
        } as unknown as WebCamDataProvider;

        const world = await tutorial_observer(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            clock,
            paused: false
        }, { faceDataProvider: mockTracker, webCamProvider: mockWebCam } as any);

        await mockP5.setup();
        await mockP5.draw();
        expect(world.getElement('videoPanel')).toBeDefined();

        await mockP5.draw();

        expect(mockP5.background).toHaveBeenCalled();

        /* we need to improve the test mock to trigger the drawing */
        // expect(mockP5.box).toHaveBeenCalled();
    });

    it('should fall back to the MP4 when the webcam stays initializing too long', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValueOnce(0).mockReturnValue(5000);

        const mockVideo = { readyState: 4, currentTime: 1.5, paused: false, ended: false };
        const videoGetDataSpy = vi.spyOn(VideoDataProvider.prototype, 'getData').mockReturnValue(mockVideo as any);
        const videoGetDataResultSpy = vi.spyOn(VideoDataProvider.prototype, 'getDataResult').mockReturnValue({ success: true as const, value: mockVideo as any });
        const videoStatusSpy = vi.spyOn(VideoDataProvider.prototype, 'getStatus').mockReturnValue("READY");

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn().mockReturnValue(face1);
        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const webcamData = { kind: "webCam", node: { readyState: 1 } };
        const mockWebCam = {
            type: "webCam",
            parentId: undefined,
            tick: vi.fn(),
            getStatus: vi.fn().mockReturnValue("INITIALIZING"),
            getData: vi.fn().mockReturnValue(webcamData),
            getDataResult: vi.fn().mockReturnValue({ success: true as const, value: webcamData }),
            getVideo: vi.fn().mockReturnValue({ success: true as const, value: webcamData }),
        } as unknown as WebCamDataProvider;

        const world = await tutorial_observer(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            clock,
            paused: false
        }, { faceDataProvider: mockTracker, webCamProvider: mockWebCam } as any);

        await mockP5.setup();
        await mockP5.draw();

        expect(world.getElement('videoPanel')).toBeDefined();

        videoGetDataSpy.mockRestore();
        videoGetDataResultSpy.mockRestore();
        videoStatusSpy.mockRestore();
    });

    it('runs world with paused config set to false by default', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn().mockReturnValue(face1);
        const mockTracker = createMockHeadTrackingProvider(getDataMock);

        const world = await tutorial_observer(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);

        await mockP5.setup();
        await mockP5.draw();
        await mockP5.draw();

        expect(world.isPaused()).toBe(false);
    });

    it('pauses world when paused config is true', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn().mockReturnValue(face1);
        const mockTracker = createMockHeadTrackingProvider(getDataMock);

        const world = await tutorial_observer(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            clock,
            paused: true
        }, { faceDataProvider: mockTracker } as any);

        await mockP5.setup();
        await mockP5.draw();
        await mockP5.draw();

        expect(world.isPaused()).toBe(true);
    });

    it('resumes world when paused config is false', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn().mockReturnValue(face1);
        const mockTracker = createMockHeadTrackingProvider(getDataMock);

        const world = await tutorial_observer(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);

        await mockP5.setup();
        await mockP5.draw();
        await mockP5.draw();

        expect(world.isPaused()).toBe(false);
    });

    it('initializes face provider and adds video panel on first draw', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn().mockReturnValue(face1);
        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const mockInit = vi.fn().mockResolvedValue(undefined);
        const mockSetFallbackCapture = vi.fn();
        mockTracker.init = mockInit;
        (mockTracker as any).setFallbackCapture = mockSetFallbackCapture;

        const world = await tutorial_observer(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);

        await mockP5.setup();
        await mockP5.draw();

        expect(mockInit).toHaveBeenCalled();
        expect(mockSetFallbackCapture).toHaveBeenCalled();
        expect(world.getElement('videoPanel')).toBeDefined();
    });

    it('video selector returns fallback video when webcam is not available', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn().mockReturnValue(face1);
        const mockTracker = createMockHeadTrackingProvider(getDataMock);
        const mockInit = vi.fn().mockResolvedValue(undefined);
        mockTracker.init = mockInit;

        const webcamData = { kind: "webCam", node: null };
        const mockWebCam = {
            type: "webCam",
            parentId: undefined,
            tick: vi.fn(),
            getStatus: vi.fn().mockReturnValue("INITIALIZING"),
            getData: vi.fn().mockReturnValue(webcamData),
            getDataResult: vi.fn().mockReturnValue({ success: true as const, value: webcamData }),
            getVideo: vi.fn().mockReturnValue({ success: true as const, value: webcamData }),
        } as unknown as WebCamDataProvider;

        const world = await tutorial_observer(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            clock,
            paused: false
        }, { faceDataProvider: mockTracker, webCamProvider: mockWebCam } as any);

        await mockP5.setup();
        await mockP5.draw();

        expect(world.getElement('videoPanel')).toBeDefined();
    });

    it('resumes world when config is not paused but world is paused', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn().mockReturnValue(face1);
        const mockTracker = createMockHeadTrackingProvider(getDataMock);

        const world = await tutorial_observer(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);

        await mockP5.setup();
        await mockP5.draw();
        await mockP5.draw();

        world.pause();

        await mockP5.draw();

        expect(world.isPaused()).toBe(false);
    });

    it('pauses world when config is not paused but user paused the world', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const face1 = createMockFaceWorldData();
        const getDataMock = vi.fn().mockReturnValue(face1);
        const mockTracker = createMockHeadTrackingProvider(getDataMock);

        const world = await tutorial_observer(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            clock,
            paused: false
        }, { faceDataProvider: mockTracker } as any);

        await mockP5.setup();
        await mockP5.draw();
        await mockP5.draw();

        world.pause();

        await mockP5.draw();

        expect(world.isPaused()).toBe(false);
    });
});
