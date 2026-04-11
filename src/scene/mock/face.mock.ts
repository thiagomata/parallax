import { vi } from 'vitest';
import { DEFAULT_HEAD_PROPORTIONS, type FaceData, type HeadProportions } from "../drivers/mediapipe/face";
import { SceneFace, DEFAULT_FACE_SCENE_CONFIG } from "../providers/scene_face";
import type { FaceWorldData } from "../providers/head_tracking_data_provider";
import type { FaceWidthRatio } from "../types";

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

export function createMockSceneFace(overrides: {
    localPosition?: { x: number; y: number; z: number };
    localRotation?: { yaw: number; pitch: number; roll: number };
    headWidth?: number;
} = {}): SceneFace {
    return new SceneFace(
        DEFAULT_FACE_SCENE_CONFIG,
        overrides.localPosition ?? { x: 0, y: 0, z: 0 },
        overrides.localRotation ?? { yaw: 0, pitch: 0, roll: 0 },
        overrides.headWidth ?? 180,
        1 as FaceWidthRatio
    );
}

export function createMockFaceWorldData(overrides: {
    sceneFace?: SceneFace;
    nose?: { x: number; y: number; z: number };
    eyes?: { left: { x: number; y: number; z: number }; right: { x: number; y: number; z: number } };
    brows?: { left: { x: number; y: number; z: number }; right: { x: number; y: number; z: number } };
    bounds?: { left: { x: number; y: number; z: number }; right: { x: number; y: number; z: number }; top: { x: number; y: number; z: number }; bottom: { x: number; y: number; z: number } };
    stick?: { yaw: number; pitch: number; roll: number };
} = {}): FaceWorldData {
    const sceneFace = overrides.sceneFace ?? createMockSceneFace();
    const mockFace = {
        rebase: {
            nose: { x: 0, y: 0, z: 0 },
            leftEye: { x: 0, y: 0, z: 0 },
            rightEye: { x: 0, y: 0, z: 0 },
            leftBrow: { x: 0, y: 0, z: 0 },
            rightBrow: { x: 0, y: 0, z: 0 },
            leftEar: { x: 0, y: 0, z: 0 },
            rightEar: { x: 0, y: 0, z: 0 },
            middleTop: { x: 0, y: 0, z: 0 },
            middleBottom: { x: 0, y: 0, z: 0 },
        }
    };

    return {
        face: mockFace as any,
        sceneFace,
        midpoint: sceneFace.localPosition,
        nose: overrides.nose ?? { x: 0, y: 0, z: 0 },
        eyes: overrides.eyes ?? { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        brows: overrides.brows ?? { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        bounds: overrides.bounds ?? { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 }, top: { x: 0, y: 0, z: 0 }, bottom: { x: 0, y: 0, z: 0 } },
        stick: overrides.stick ?? { yaw: 0, pitch: 0, roll: 0 },
    } as unknown as FaceWorldData;
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
        getFace: () => ({ success: true, value: createMockSceneFace() }),
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
