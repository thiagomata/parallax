import {
    ALL_ELEMENT_TYPES,
    type BaseModifierSettings,
    type EffectBundle,
    type ResolvedBaseVisual,
    type SceneState,
    type Vector3,
} from "../types.ts";

export interface LookAtEffectConfig extends BaseModifierSettings {
    enabled?: boolean;
    readonly axis?: {
        readonly x?: boolean;
        readonly y?: boolean;
        readonly z?: boolean;
    };
    lookAt: string;
}

export const LookAtDefaultConfig: LookAtEffectConfig = {
    enabled: true,
    axis: {
        x: true,
        y: true,
        z: false,
    },
    lookAt: 'CAMERA',
}

function lookAtCamera(state: SceneState, settings: LookAtEffectConfig, rotate: {
    x: number;
    y: number;
    z: number
}, current: ResolvedBaseVisual) {
    const cam = state.camera;
    const locks = settings.axis || {};

    if (locks.y) rotate.y -= cam.yaw;
    if (locks.x) rotate.x += cam.pitch;
    if (locks.z) rotate.z -= cam.roll;

    return {
        ...current,
        rotate
    };
}

function lookAtElement(
    state: SceneState,
    settings: LookAtEffectConfig,
    rotate: Vector3,
    current: ResolvedBaseVisual
) {
    if (!state.elements) {
        return current;
    }
    const targetElement = state.elements.get(settings.lookAt)
    if (!targetElement) {
        return current;
    }

    // Calculate Vector Difference
    const dx = targetElement.position.x - current.position.x;
    const dy = targetElement.position.y - current.position.y;
    const dz = targetElement.position.z - current.position.z;

    let rotateX = rotate.x;
    let rotateY = rotate.y;
    let rotateZ = rotate.z;

    // Calculate Angles (Atan2 is your best friend here)
    if (settings.axis?.y) {
        // Yaw: Angle on the XZ plane
        rotateY += Math.atan2(dx, dz);
    }

    if (settings.axis?.x) {
        // Pitch: Angle towards the target height
        const distanceXZ = Math.sqrt(dx * dx + dz * dz);
        rotateX -= Math.atan2(dy, distanceXZ);
    }

    // Copy the target Z rotation
    if (settings.axis?.z && targetElement.rotate) {
        rotateZ += targetElement.rotate.z;
    }

    return {
        ...current,
        rotate: {
            x: rotateX,
            y: rotateY,
            z: rotateZ,
        }
    }
}

export const LookAtEffect: EffectBundle<'look_at', LookAtEffectConfig> = {
    type: 'look_at',
    targets: ALL_ELEMENT_TYPES,
    defaults: LookAtDefaultConfig,
    apply(current: ResolvedBaseVisual, state: SceneState, settings: LookAtEffectConfig): ResolvedBaseVisual {
        const rotate = {
            x: current.rotate?.x ?? 0,
            y: current.rotate?.y ?? 0,
            z: current.rotate?.z ?? 0,
        };

        if (settings.lookAt == 'CAMERA') {
            return lookAtCamera(state, settings, rotate, current);
        } else {
            return lookAtElement(state, settings, rotate, current);
        }
    }
};