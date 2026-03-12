import {
    type BaseModifierSettings,
    type EffectBundle,
    type ResolvedBaseVisual,
    type ResolutionContext,
    type Rotation3,
    ALL_ELEMENT_TYPES,
    PROJECTION_IDS,
} from "../types.ts";
import { lookAtRotation } from "../utils/projection_utils.ts";

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
    const camera = context.projectionPool[PROJECTION_IDS.EYE] || context.projectionPool[PROJECTION_IDS.SCREEN];
    if (!camera) {
        return current;  // Graceful degradation - no camera found
    }

    const rotationUpdate = computeLookAtRotation(
        current.position,
        camera.position,
        rotate,
        settings,
    );

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

    const rotationUpdate = computeLookAtRotation(
        current.position,
        targetElement.position,
        rotate,
        settings
    );

    return {
        ...current,
        ...rotationUpdate,
    };
}

function computeLookAtRotation(
    fromPosition: { x: number; y: number; z: number },
    toPosition: { x: number; y: number; z: number },
    rotate: Rotation3,
    settings: LookAtEffectConfig,
): Partial<ResolvedBaseVisual> {
    // Use existing utility function
    const computed = lookAtRotation(
        fromPosition,
        toPosition,
        settings.axis,
        rotate,
    );

    // Apply axis locks: use computed + initial (additive), or just initial
    // Note: pitch uses subtraction to match old behavior (rotateX -= ...)
    return {
        rotate: {
            ...computed,
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
