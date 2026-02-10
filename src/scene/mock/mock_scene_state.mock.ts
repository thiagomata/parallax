import {DEFAULT_SETTINGS, type SceneCameraState, type ScenePlaybackState, type SceneState} from "../types.ts";

export function createMockState(
    position = {x: 0, y: 0, z: 0},
    lookAt = {x: 0, y: 0, z: 100},
    now = Date.now(),
): SceneState {

    if (DEFAULT_SETTINGS.projection.kind !== "camera") {
        throw new Error("Screen is not supported");
    }

    return {
        sceneId: 1,
        settings: {
            ...DEFAULT_SETTINGS,
            projection: {
                kind: "camera",
                camera: {
                    ...DEFAULT_SETTINGS.projection.camera,
                    position: position,
                    lookAt: lookAt,
                }
            },
        },
        playback: {
            now: now,
            delta: 0,
            progress: 0,
            frameCount: 60
        } as ScenePlaybackState,
        projection: {
            kind: "camera",
            camera: {
                position: position,
                lookAt: lookAt,
                yaw: 0,
                pitch: 0,
                direction: {x: 0, y: 0, z: 1},
            } as SceneCameraState,
        }
    } as SceneState;
}