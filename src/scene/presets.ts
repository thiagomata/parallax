import {
    LOOK_MODES,
    PROJECTION_TYPES,
    type BlueprintProjection, STANDARD_PROJECTION_IDS,
} from "./types.ts";
import {OrbitModifier} from "./modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "./modifiers/center_focus_modifier.ts";
import p5 from "p5";
import {merge} from "./utils/merge.ts";

export interface WorldPreset {
    projectors: BlueprintProjection[];
    elements: Array<Record<string, unknown>>;
}

interface CenterOrbitProperties {
    radius: number;
    verticalBaseline: number;
    eyeScreenDistance: number;
}
const DEFAULT_CENTER_ORBIT: CenterOrbitProperties = {
    radius: 800,
    verticalBaseline: -400,
    eyeScreenDistance: 100
}
export const CenterOrbit = (
    p: p5,
    data: Partial<CenterOrbitProperties> = {}
): WorldPreset => {

    const props = merge(DEFAULT_CENTER_ORBIT, data);

    // similar triangles
    // props.radius / props.verticalBaseline = (props.radius + props.eyeScreenDistance) / eyeDistance;
    // eyeDistance * ( props.radius / props.verticalBaseline) = (props.radius + props.eyeScreenDistance);
    // eyeDistance * ( props.radius ) = (props.radius + props.eyeScreenDistance) * props.verticalBaseline;
    // eyeDistance = (props.radius + props.eyeScreenDistance) * props.verticalBaseline / props.radius;

    const eyeDistance = (props.radius + props.eyeScreenDistance) * props.verticalBaseline / props.radius;;


    return {
        projectors: [
            {
                id: STANDARD_PROJECTION_IDS.SCREEN,
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.ROTATION,
                modifiers: {
                    carModifiers: [
                        new OrbitModifier(p, props.radius, props.verticalBaseline),
                    ],
                    stickModifiers: [
                        new CenterFocusModifier()
                    ]
                },
                position: { x: 0, y: 0, z: props.verticalBaseline },
                direction: { x: 0, y: 0, z: 1 },
                rotation: {yaw: 0, pitch: 0, roll: 0},
            },
            {
                id: STANDARD_PROJECTION_IDS.EYE,
                type: PROJECTION_TYPES.EYE,
                lookMode: LOOK_MODES.ROTATION,
                modifiers: {
                    carModifiers: [
                        new OrbitModifier(p, props.radius + props.eyeScreenDistance, eyeDistance),
                    ],
                    stickModifiers: [
                        new CenterFocusModifier()
                    ]
                },
                position: { x: 0, y: 0, z: props.verticalBaseline },
                direction: { x: 0, y: 0, z: 1 },
                rotation: {yaw: 0, pitch: 0, roll: 0},
            },
        ],
        elements: []
    }
};

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

export const    HEAD_TRACKED_PRESET: WorldPreset = {
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
            position: { x: 0, y: 0, z: 100 },
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
