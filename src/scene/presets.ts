import {
    LOOK_MODES,
    PROJECTION_TYPES,
    type BlueprintProjection,
} from "./types.ts";

export interface WorldPreset {
    projectors: BlueprintProjection[];
    elements: Array<Record<string, unknown>>;
}

export const VR_CABIN_PRESET: WorldPreset = {
    projectors: [
        {
            id: 'car',
            type: PROJECTION_TYPES.EYE,
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookMode: LOOK_MODES.ROTATION,
            rotation: { yaw: 0, pitch: 0, roll: 0 },
        },
        {
            id: 'screen',
            type: PROJECTION_TYPES.EYE,
            targetId: 'car',
            position: { x: 0, y: 0, z: 50 },
            direction: { x: 0, y: 0, z: 1 },
            lookMode: LOOK_MODES.ROTATION,
            rotation: { yaw: 0, pitch: 0, roll: 0 },
        },
        {
            id: 'head',
            type: PROJECTION_TYPES.EYE,
            targetId: 'screen',
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookMode: LOOK_MODES.ROTATION,
            rotation: { yaw: 0, pitch: 0, roll: 0 },
        },
        {
            id: 'eye',
            type: PROJECTION_TYPES.EYE,
            targetId: 'head',
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookMode: LOOK_MODES.ROTATION,
            rotation: { yaw: 0, pitch: 0, roll: 0 },
        },
    ],
    elements: [],
};

export const SIMPLE_PRESET: WorldPreset = {
    projectors: [
        {
            id: 'screen',
            type: PROJECTION_TYPES.EYE,
            position: { x: 0, y: 0, z: 100 },
            direction: { x: 0, y: 0, z: 1 },
            lookMode: LOOK_MODES.ROTATION,
            rotation: { yaw: 0, pitch: 0, roll: 0 },
        },
        {
            id: 'eye',
            type: PROJECTION_TYPES.EYE,
            targetId: 'screen',
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookMode: LOOK_MODES.ROTATION,
            rotation: { yaw: 0, pitch: 0, roll: 0 },
        },
    ],
    elements: [],
};

export const HEAD_TRACKED_PRESET: WorldPreset = {
    projectors: [
        {
            id: 'head',
            type: PROJECTION_TYPES.EYE,
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookMode: LOOK_MODES.LOOK_AT,
            lookAt: { x: 0, y: 0, z: 0 },
        },
        {
            id: 'eye',
            type: PROJECTION_TYPES.EYE,
            targetId: 'head',
            position: { x: 0, y: 0, z: 50 },
            direction: { x: 0, y: 0, z: 1 },
            lookMode: LOOK_MODES.LOOK_AT,
            lookAt: { x: 0, y: 0, z: 0 },
        },
        {
            id: 'screen',
            type: PROJECTION_TYPES.EYE,
            targetId: 'head',
            position: { x: 0, y: 0, z: -100 },
            direction: { x: 0, y: 0, z: 1 },
            lookMode: LOOK_MODES.LOOK_AT,
            lookAt: { x: 0, y: 0, z: 0 },
        },
    ],
    elements: [],
};
