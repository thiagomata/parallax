import {DEFAULT_SETTINGS, type ScenePlaybackState, type ResolvedSceneState} from "../types.ts";

export function createMockState(
    position = {x: 0, y: 0, z: 0},
    lookAt = {x: 0, y: 0, z: 100},
    now = Date.now(),
): ResolvedSceneState {

    return {
        sceneId: 1,
        settings: {
            ...DEFAULT_SETTINGS,
        },
        playback: {
            now: now,
            delta: 0,
            progress: 0,
            frameCount: 60
        } as ScenePlaybackState,
        elements: new Map(),
        projections: new Map(),
    };
}