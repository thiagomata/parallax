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

function lookAtCamera(
    context: ResolutionContext,
    settings: LookAtEffectConfig,
    rotate: Rotation3,
    current: ResolvedBaseVisual
): ResolvedBaseVisual {
    // Look up camera (EYE) projection from pool
    const camera = context.projectionPool['eye'] || context.projectionPool['screen'];
    if (!camera) {
        return current;  // Graceful degradation - no camera found
    }

    const rotationUpdate = computeLookAtRotation(current.position, camera.position, rotate, settings);

    return {
        ...current,
        ...rotationUpdate,
    };
}

function lookAtElement(
    context: ResolutionContext,
    settings: LookAtEffectConfig,
    rotate: Rotation3,
    current: ResolvedBaseVisual
): ResolvedBaseVisual {
    const previousResolved = context.previousResolved;
    if (!previousResolved?.elements) {
        return current;
    }
    const targetElement = previousResolved.elements.get(settings.lookAt)

    if (!targetElement) {
        return current;
    }

    const rotationUpdate = computeLookAtRotation(current.position, targetElement.position, rotate, settings);

    return {
        ...current,
        ...rotationUpdate,
    };
}

function computeLookAtRotation(
    fromPosition: { x: number; y: number; z: number },
    toPosition: { x: number; y: number; z: number },
    rotate: Rotation3,
    settings: LookAtEffectConfig
): Partial<ResolvedBaseVisual> {
    // Calculate Vector Difference
    const dx = toPosition.x - fromPosition.x;
    const dy = toPosition.y - fromPosition.y;
    const dz = toPosition.z - fromPosition.z;

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

    return {
        rotate: {
            pitch: rotateX,
            yaw: rotateY,
            roll: rotateZ,
        }
    };
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
            return lookAtCamera(context, settings, rotate, current);
        }

        return lookAtElement(context, settings, rotate, current);
    }
};