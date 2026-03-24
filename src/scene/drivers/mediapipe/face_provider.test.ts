import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockP5 } from '../../mock/mock_p5.mock';
import {MediaPipeFaceProvider} from "./face_provider.ts";

// Mock External Dependencies
vi.mock('@mediapipe/tasks-vision', () => ({
    FaceLandmarker: {
        createFromOptions: vi.fn(),
    },
    FilesetResolver: {
        forVisionTasks: vi.fn(),
    }
}));

/**
 * Creates a mock HTMLVideoElement that cycles through readyStates.
 * This simulates the camera warming up or stuttering.
 */
const createDynamicVideoElt = (states: number[]) => {
    let index = 0;
    const elt = {};
    Object.defineProperty(elt, 'readyState', {
        get: () => {
            const state = states[index];
            if (index < states.length - 1) index++;
            return state;
        }
    });
    return elt;
};

const createMockCapture = (eltProps: any = { readyState: 4 }) => ({
    size: vi.fn(),
    hide: vi.fn(),
    elt: { 
        readyState: 4,
        onloadedmetadata: null as any,
        onerror: null as any,
        ...eltProps 
    },
    play: vi.fn(),
});

describe('MediaPipeFaceProvider', () => {
    let mockP5: any;
    let mockLandmarker: any;
    let mockCapture: any;
    let provider: MediaPipeFaceProvider;

    beforeEach(() => {
        vi.clearAllMocks();
        mockP5 = createMockP5();
        mockP5.VIDEO = 'video';
        mockCapture = createMockCapture();
        mockP5.createCapture.mockReturnValue(mockCapture);

        mockLandmarker = {
            detectForVideo: vi.fn().mockReturnValue({ faceLandmarks: [[{ x: 0, y: 0, z: 0 }]] }),
            parse: vi.fn().mockReturnValue({
                geometry: {
                    world: {
                        center: { x: 0, y: 0, z: 0 },
                        unitScale: 1,
                        rotation: { x: 0, y: 0, z: 0 }
                    }
                }
            })
        };

        provider = new MediaPipeFaceProvider(mockP5);
        provider.setFaceParser(mockLandmarker);
    });

    describe('Initialization', () => {
        it('should setup hardware and reach READY status', async () => {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockResolvedValue({});
            (FaceLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarker);

            await provider.init();

            expect(provider.getStatus()).toBe('READY');
            expect(mockP5.createCapture).toHaveBeenCalledWith('video');
        });

        it('should transition to ERROR on failure', async () => {
            const { FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockRejectedValue(new Error("Init Failed"));

            await provider.init();
            expect(provider.getStatus()).toBe('ERROR');
        });

        it('should retry initialization after a failure on the next attempt', async () => {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any)
                .mockRejectedValueOnce(new Error("Init Failed"))
                .mockResolvedValueOnce({});
            (FaceLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarker);

            await provider.init();
            expect(provider.getStatus()).toBe('ERROR');

            await provider.init();
            expect(provider.getStatus()).toBe('READY');
        });

        it('should set up onloadedmetadata to play video', async () => {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockResolvedValue({});
            (FaceLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarker);

            await provider.init();

            expect(mockCapture.elt.onloadedmetadata).toBeDefined();
            mockCapture.elt.onloadedmetadata();
            expect(mockCapture.play).toHaveBeenCalled();
        });

        it('should set up onerror to transition to ERROR status', async () => {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockResolvedValue({});
            (FaceLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarker);

            await provider.init();

            expect(mockCapture.elt.onerror).toBeDefined();
            mockCapture.elt.onerror();
            expect(provider.getStatus()).toBe('ERROR');
        });

        it('should call capture.size and capture.hide', async () => {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockResolvedValue({});
            (FaceLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarker);

            await provider.init();

            expect(mockCapture.size).toHaveBeenCalledWith(640, 480);
            expect(mockCapture.hide).toHaveBeenCalled();
        });
    });

    describe('getVideo', () => {
        beforeEach(async () => {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockResolvedValue({});
            (FaceLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarker);
        });

        it('should return success true and value capture when status is READY', async () => {
            await provider.init();

            const video = provider.getVideo();
            expect(video.success).toBe(true);
            if (!video.success) return;
            expect(video.value).toBe(mockCapture);
        });

        it('should return success false when status is not READY', async () => {
            await provider.init();
            (provider as any).status = 'INITIALIZING';

            expect(provider.getVideo().success).toBe(false);
        });

        it('should return success false when capture is not created', async () => {
            const { FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockRejectedValue(new Error("Init Failed"));
            
            await provider.init();

            expect(provider.getVideo().success).toBe(false);
        });
    });

    describe('Dynamic Hardware Handling', () => {
        beforeEach(async () => {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockResolvedValue({});
            (FaceLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarker);
        });

        it('should wait for readyState >= 2 (HAVE_CURRENT_DATA) before processing', async () => {
            const dynamicElt = createDynamicVideoElt([0, 1, 2, 4]);
            mockCapture.elt = dynamicElt;

            await provider.init();

            expect(provider.getFace().success).toBe(false);
            expect(provider.getFace().success).toBe(false);
            const faceResult = provider.getFace();
            expect(faceResult.success).toBe(true);
            if (faceResult.success) {
                expect(faceResult.value).not.toBeNull();
            }
            expect(mockLandmarker.detectForVideo).toHaveBeenCalledTimes(1);
        });

        it('should return failure if face is missing in the frame', async () => {
            await provider.init();

            mockLandmarker.detectForVideo.mockReturnValue({ faceLandmarks: [] });

            const result = provider.getFace();
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('No face detected in frame');
            }
        });

        it('should handle camera "glitches" by returning failure when video drops below readyState 2', async () => {
            const glitchyElt = createDynamicVideoElt([4, 1, 4]);
            mockCapture.elt = glitchyElt;

            await provider.init();

            const result1 = provider.getFace();
            expect(result1.success).toBe(true);
            if (result1.success) {
                expect(result1.value).not.toBeNull();
            }

            const result2 = provider.getFace();
            expect(result2.success).toBe(false);
        });
    });
});
