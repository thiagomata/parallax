import { vi } from 'vitest';
import { DEFAULT_HEAD_PROPORTIONS, type FaceData, type HeadProportions, Face } from "../drivers/mediapipe/face";
import { SceneFace, DEFAULT_FACE_SCENE_CONFIG } from "../providers/scene_face";
import { FaceWorldData } from "../providers/head_tracking_data_provider";
import type { FaceWidthRatio, RelativeRatio, SceneUnits, VideoWidthRatio } from "../types";

export function createCanonicalHead<T extends RelativeRatio<string> = VideoWidthRatio>(H: HeadProportions = DEFAULT_HEAD_PROPORTIONS): FaceData<T> {
    return {
        nose: {
            position: { x: 0 as T, y: H.height.nose_base as unknown as T, z: H.depth.nose_tip as unknown as T },
            visibility: 1,
            isUsable: true
        },
        eyes: {
            left: {
                position: { x: -H.width.eye_to_eye / 2 as unknown as T, y: H.height.eye_line as unknown as T, z: H.depth.eye_plane as unknown as T },
                visibility: 1,
                isUsable: true
            },
            right: {
                position: { x: H.width.eye_to_eye / 2 as unknown as T, y: H.height.eye_line as unknown as T, z: H.depth.eye_plane as unknown as T },
                visibility: 1,
                isUsable: true
            },
        },
        rig: {
            leftEar: {
                position: { x: -H.width.ear_to_ear / 2 as unknown as T, y: H.offset.ear_y as unknown as T, z: -0.02 as unknown as T },
                visibility: 1,
                isUsable: true
            },
            rightEar: {
                position: { x: H.width.ear_to_ear / 2 as unknown as T, y: H.offset.ear_y as unknown as T, z: -0.02 as unknown as T },
                visibility: 1,
                isUsable: true
            },
            leftTemple: {
                position: { x: -H.width.temple_to_temple / 2 as unknown as T, y: H.offset.ear_y as unknown as T, z: 0 as unknown as T },
                visibility: 1,
                isUsable: true
            },
            rightTemple: {
                position: { x: H.width.temple_to_temple / 2 as unknown as T, y: H.offset.ear_y as unknown as T, z: 0 as unknown as T },
                visibility: 1,
                isUsable: true
            },
        },
        mouth: {
            left: {
                position: { x: -H.width.mouth_width / 2 as unknown as T, y: H.height.mouth_line as unknown as T, z: H.depth.mouth_plane as unknown as T },
                visibility: 1,
                isUsable: true
            },
            right: {
                position: { x: H.width.mouth_width / 2 as unknown as T, y: H.height.mouth_line as unknown as T, z: H.depth.mouth_plane as unknown as T },
                visibility: 1,
                isUsable: true
            },
        },
        brows: {
            left: {
                position: { x: -H.width.eye_to_eye / 2 as unknown as T, y: (H.height.forehead_top * 0.5) as unknown as T, z: H.depth.eye_plane as unknown as T },
                visibility: 1,
                isUsable: true
            },
            right: {
                position: { x: H.width.eye_to_eye / 2 as unknown as T, y: (H.height.forehead_top * 0.5) as unknown as T, z: H.depth.eye_plane as unknown as T },
                visibility: 1,
                isUsable: true
            },
        },
        bounds: {
            middleTop: {
                position: { x: 0 as unknown as T, y: H.height.forehead_top as unknown as T, z: 0.02 as unknown as T },
                visibility: 1,
                isUsable: true
            },
            middleBottom: {
                position: { x: 0 as unknown as T, y: H.height.chin_tip as unknown as T, z: 0.02 as unknown as T },
                visibility: 1,
                isUsable: true
            }
        },
    };
}

export function createMockSceneFace(overrides: {
    localPosition?: { x: number; y: number; z: number };
    localRotation?: { yaw: number; pitch: number; roll: number };
    headWidth?: SceneUnits;
} = {}): SceneFace {
    return new SceneFace(
        DEFAULT_FACE_SCENE_CONFIG,
        overrides.localPosition ? { x: overrides.localPosition.x as SceneUnits, y: overrides.localPosition.y as SceneUnits, z: overrides.localPosition.z as SceneUnits } : { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits },
        overrides.localRotation ?? { yaw: 0, pitch: 0, roll: 0 },
        overrides.headWidth ?? (180 as SceneUnits),
        1 as FaceWidthRatio
    );
}

export class MockFaceWorldData extends FaceWorldData {
    constructor(sceneFace: SceneFace = createMockSceneFace()) {
        const mockFace = createCanonicalHead();
        super(mockFace as unknown as Face<VideoWidthRatio>, sceneFace);
    }
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
    return new MockFaceWorldData(sceneFace);
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
