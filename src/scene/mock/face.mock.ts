import { vi } from 'vitest';
import { DEFAULT_HEAD_PROPORTIONS, type FaceData, type HeadProportions } from "../drivers/mediapipe/face";

export const createCanonicalHead = (H: HeadProportions = DEFAULT_HEAD_PROPORTIONS): FaceData => {
    return {
        nose: {
            position: { x: 0, y: H.height.nose_base, z: H.depth.nose_tip },
            visibility: 1,
            isUsable: true
        },
        eyes: {
            left: {
                position: { x: -H.width.eye_to_eye / 2, y: H.height.eye_line, z: H.depth.eye_plane },
                visibility: 1,
                isUsable: true
            },
            right: {
                position: { x: H.width.eye_to_eye / 2, y: H.height.eye_line, z: H.depth.eye_plane },
                visibility: 1,
                isUsable: true
            },
        },
        rig: {
            leftEar: {
                position: { x: -H.width.ear_to_ear / 2, y: H.offset.ear_y, z: -0.02 },
                visibility: 1,
                isUsable: true
            },
            rightEar: {
                position: { x: H.width.ear_to_ear / 2, y: H.offset.ear_y, z: -0.02 },
                visibility: 1,
                isUsable: true
            },
            leftTemple: {
                position: { x: -H.width.temple_to_temple / 2, y: H.offset.ear_y, z: 0 },
                visibility: 1,
                isUsable: true
            },
            rightTemple: {
                position: { x: H.width.temple_to_temple / 2, y: H.offset.ear_y, z: 0 },
                visibility: 1,
                isUsable: true
            },
        },
        mouth: {
            left: {
                position: { x: -H.width.mouth_width / 2, y: H.height.mouth_line, z: H.depth.mouth_plane },
                visibility: 1,
                isUsable: true
            },
            right: {
                position: { x: H.width.mouth_width / 2, y: H.height.mouth_line, z: H.depth.mouth_plane },
                visibility: 1,
                isUsable: true
            },
        },
        brows: {
            left: {
                position: { x: -H.width.eye_to_eye / 2, y: H.height.forehead_top * 0.5, z: H.depth.eye_plane },
                visibility: 1,
                isUsable: true
            },
            right: {
                position: { x: H.width.eye_to_eye / 2, y: H.height.forehead_top * 0.5, z: H.depth.eye_plane },
                visibility: 1,
                isUsable: true
            },
        },
        bounds: {
            middleTop: {
                position: { x: 0, y: H.height.forehead_top, z: 0.02 },
                visibility: 1,
                isUsable: true
            },
            middleBottom: {
                position: { x: 0, y: H.height.chin_tip, z: 0.02 },
                visibility: 1,
                isUsable: true
            }
        },
    };
};

export interface FaceWorldDataMock {
    face: FaceData;
    sceneHeadWidth: number;
    midpoint: { x: number; y: number; z: number };
    nose: { x: number; y: number; z: number };
    eyes: { left: { x: number; y: number; z: number }; right: { x: number; y: number; z: number } };
    brows: { left: { x: number; y: number; z: number }; right: { x: number; y: number; z: number } };
    bounds: { 
        left: { x: number; y: number; z: number }; 
        right: { x: number; y: number; z: number }; 
        top: { x: number; y: number; z: number }; 
        bottom: { x: number; y: number; z: number } 
    };
    stick: { yaw: number; pitch: number; roll: number };
}

export function createFaceWorldData(overrides: {
    midpoint?: { x: number; y: number; z: number };
    nose?: { x: number; y: number; z: number };
    eyes?: { left: { x: number; y: number; z: number }; right: { x: number; y: number; z: number } };
    stick?: { yaw: number; pitch: number; roll: number };
} = {}): FaceWorldDataMock {
    return {
        face: createCanonicalHead(),
        sceneHeadWidth: 120,
        midpoint: overrides.midpoint ?? { x: 0, y: 0, z: 0 },
        nose: overrides.nose ?? { x: 0, y: 0, z: 0 },
        eyes: overrides.eyes ?? { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        brows: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        bounds: { 
            left: { x: 0, y: 0, z: 0 }, 
            right: { x: 0, y: 0, z: 0 }, 
            top: { x: 0, y: 0, z: 0 }, 
            bottom: { x: 0, y: 0, z: 0 } 
        },
        stick: overrides.stick ?? { yaw: 0, pitch: 0, roll: 0 },
    };
}

export function createMockHeadTrackingProvider(getDataMock: ReturnType<typeof vi.fn>) {
    const mockVideoElement = {
        elt: { readyState: 4 },
        noLoop: () => {},
        hide: () => {},
        size: () => {},
        play: () => {},
    };
    
    const mockFaceProvider = {
        getFace: () => ({ success: true, value: createFaceWorldData() }),
        getStatus: () => 'READY' as const,
        getVideo: () => ({ success: true, value: mockVideoElement }),
        init: async () => {},
    };
    
    const mockTracker = {
        type: 'headTracker' as const,
        provider: mockFaceProvider,
        getData: getDataMock,
        getDataResult: () => ({ success: true as const, value: (getDataMock as any)() }),
        getVideo: () => ({ success: true, value: mockVideoElement }),
        init: async () => {
            await mockFaceProvider.init();
        },
        tick: () => {},
        cameraPosition: { x: 0, y: 0, z: 300 },
        panelPosition: { x: 0, y: 0, z: 0 },
    };
    
    return mockTracker;
}
