import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FaceParser } from './face_parser';
import { createMockP5 } from '../../mock/mock_p5.mock';
import {MediaPipeFaceProvider} from "./face_provider.ts";

// 1. Mock External Dependencies
vi.mock('@mediapipe/tasks-vision', () => ({
    FaceLandmarker: {
        createFromOptions: vi.fn(),
    },
    FilesetResolver: {
        forVisionTasks: vi.fn(),
    }
}));

vi.mock('./face_parser', () => ({
    FaceParser: {
        parse: vi.fn()
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

describe('MediaPipeFaceProvider', () => {
    let mockP5: any;
    let mockLandmarker: any;
    let provider: MediaPipeFaceProvider;

    beforeEach(() => {
        vi.clearAllMocks();
        mockP5 = createMockP5();
        mockP5.VIDEO = 'video';

        mockLandmarker = {
            detectForVideo: vi.fn().mockReturnValue({ faceLandmarks: [[{ x: 0, y: 0, z: 0 }]] })
        };

        // Default mock setup
        (FaceParser.parse as any).mockReturnValue({ nose: { x: 0.5, y: 0.5, z: 0 } });

        provider = new MediaPipeFaceProvider(mockP5);
    });

    describe('Initialization', () => {
        it('should setup hardware and reach READY status', async () => {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockResolvedValue({});
            (FaceLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarker);

mockP5.createCapture.mockReturnValue({
                size: vi.fn(),
                hide: vi.fn(),
                elt: { readyState: 4 }
            });

            await provider.init();

            expect(provider.getStatus()).toBe('READY');
            expect(mockP5.createCapture).toHaveBeenCalledWith('video');
        });

        it('should transition to ERROR on failure', async () => {
            const { FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockRejectedValue(new Error("Init Failed"));

            await expect(provider.init()).rejects.toThrow();
            expect(provider.getStatus()).toBe('ERROR');
        });
    });

    describe('Dynamic Hardware Handling', () => {
        beforeEach(async () => {
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            (FilesetResolver.forVisionTasks as any).mockResolvedValue({});
            (FaceLandmarker.createFromOptions as any).mockResolvedValue(mockLandmarker);
        });

        it('should wait for readyState >= 2 (HAVE_CURRENT_DATA) before processing', async () => {
            // Sequence: 0 (Nothing), 1 (Metadata), 2 (Ready), 4 (Buffered)
            const dynamicElt = createDynamicVideoElt([0, 1, 2, 4]);

            mockP5.createCapture.mockReturnValue({
                size: vi.fn(),
                hide: vi.fn(),
                elt: dynamicElt
            });

            await provider.init();

            // Frame 1: State 0
            expect(provider.getFace()).toBeNull();

            // Frame 2: State 1
            expect(provider.getFace()).toBeNull();

            // Frame 3: State 2 -> Should finally trigger detection
            const face = provider.getFace();
            expect(face).not.toBeNull();
            expect(mockLandmarker.detectForVideo).toHaveBeenCalledTimes(1);
        });

        it('should return null if face is missing in the frame', async () => {
            mockP5.createCapture.mockReturnValue({
                size: vi.fn(),
                hide: vi.fn(),
                elt: { readyState: 4 }
            });
            await provider.init();

            // Simulate MediaPipe running but finding nothing
            mockLandmarker.detectForVideo.mockReturnValue({ faceLandmarks: [] });

            expect(provider.getFace()).toBeNull();
        });

        it('should handle camera "glitches" by returning null without crashing', async () => {
            // Sequence: 4 (Success), 1 (Glitch/Reload), 4 (Recovery)
            const glitchyElt = createDynamicVideoElt([4, 1, 4]);

            mockP5.createCapture.mockReturnValue({
                size: vi.fn(),
                hide: vi.fn(),
                elt: glitchyElt
            });

            await provider.init();

            expect(provider.getFace()).not.toBeNull(); // Success
            expect(provider.getFace()).toBeNull();     // Glitch
            expect(provider.getFace()).not.toBeNull(); // Recovery
        });
    });
});