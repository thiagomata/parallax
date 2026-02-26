import {
    ALL_ELEMENT_TYPES,
    type BaseModifierSettings,
    type EffectBundle,
    type ResolvedBaseVisual,
    type ResolutionContext,
    type Rotation3,
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

// function lookAtCamera(state: SceneState, settings: LookAtEffectConfig, rotate: {
//     x: number;
//     y: number;
//     z: number
// }, current: ResolvedBaseVisual) {
//     if (state.projection.kind !== "camera") {
//         // @fixme do the projection screen
//         throw new Error("Screen is not supported");
//     }
//     const cam = state.projection.camera;
//     const locks = settings.axis || {};
//
//     if (locks.y) rotate.y -= cam.yaw;
//     if (locks.x) rotate.x += cam.pitch;
//     if (locks.z) rotate.z -= cam.roll;
//
//     return {
//         ...current,
//         rotate
//     };
// }

function lookAtElement(
    context: ResolutionContext,
    settings: LookAtEffectConfig,
    rotate: Rotation3,
    current: ResolvedBaseVisual
) {
    const previousResolved = context.previousResolved;
    if (!previousResolved?.elements) {
        return current;
    }
    const targetElement = previousResolved.elements.get(settings.lookAt)

    if (!targetElement) {

    }


    if (!targetElement) {
        return current;
    }

    // Calculate Vector Difference
    const dx = targetElement.position.x - current.position.x;
    const dy = targetElement.position.y - current.position.y;
    const dz = targetElement.position.z - current.position.z;

    let rotateX = rotate.pitch;
    let rotateY = rotate.yaw;
    let rotateZ = rotate.roll;

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
        rotateZ += targetElement.rotate.roll;
    }

    return {
        ...current,
        rotate: {
            pitch: rotateX,
            yaw: rotateY,
            roll: rotateZ,
        }
    }
}

export const LookAtEffect: EffectBundle<'look_at', LookAtEffectConfig> = {
    type: 'look_at',
    targets: ALL_ELEMENT_TYPES,
    defaults: LookAtDefaultConfig,
    apply(current: ResolvedBaseVisual, context: ResolutionContext, settings: LookAtEffectConfig): ResolvedBaseVisual {
        const rotate = {
            pitch: current.rotate?.pitch ?? 0,
            yaw: current.rotate?.yaw ?? 0,
            roll: current.rotate?.roll ?? 0,
        };

        if (settings.lookAt == 'CAMERA') {
            throw new Error("Screen is not supported");
        }

        return lookAtElement(context, settings, rotate, current);
    }
};