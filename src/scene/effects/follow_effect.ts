import {
    type BaseModifierSettings,
    type ResolvedBaseVisual,
    type ResolvedProjectionWithGlobals,
    type ResolutionContext,
    type Rotation3,
    type Vector3,
    ALL_ELEMENT_TYPES,
    STANDARD_PROJECTION_IDS,
    type EffectBundle,
} from "../types.ts";
import { rotateVector } from "../utils/projection_utils.ts";

export interface FollowEffectConfig extends BaseModifierSettings {
    enabled?: boolean;
    readonly axis?: {
        readonly x?: boolean;
        readonly y?: boolean;
        readonly z?: boolean;
    };
    /** Extra world-space offset added on top of the element's own position. */
    readonly offset?: Partial<Vector3>;
    /**
     * When true, the local offset (position + offset) is rotated by the followed
     * target's current rotation before being added to its position, so the element
     * moves rigidly within the target's view instead of staying aligned to world axes
     * - e.g. a floor that reads as "ahead and below" wherever the camera looks.
     */
    readonly followRotation?: boolean;
    follow: string;
}

export const FollowDefaultConfig: FollowEffectConfig = {
    enabled: true,
    axis: {
        x: true,
        y: true,
        z: true,
    },
    offset: { x: 0, y: 0, z: 0 },
    followRotation: false,
    follow: 'CAMERA',
}

function computeFollowPosition(
    current: ResolvedBaseVisual,
    targetPosition: Vector3,
    settings: FollowEffectConfig,
    targetRotation?: Rotation3,
): Partial<ResolvedBaseVisual> {
    const axis = settings.axis ?? FollowDefaultConfig.axis;
    const offset = settings.offset ?? FollowDefaultConfig.offset ?? { x: 0, y: 0, z: 0 };

    // current.position is treated as a fixed local offset from the followed target.
    let localOffset: Vector3 = {
        x: current.position.x + (offset.x ?? 0),
        y: current.position.y + (offset.y ?? 0),
        z: current.position.z + (offset.z ?? 0),
    };

    if (settings.followRotation && targetRotation) {
        localOffset = rotateVector(localOffset, targetRotation);
    }

    return {
        position: {
            x: axis?.x !== false ? targetPosition.x + localOffset.x : current.position.x,
            y: axis?.y !== false ? targetPosition.y + localOffset.y : current.position.y,
            z: axis?.z !== false ? targetPosition.z + localOffset.z : current.position.z,
        }
    };
}

function followCamera(
    context: ResolutionContext,
    settings: FollowEffectConfig,
    current: ResolvedBaseVisual
): ResolvedBaseVisual {
    const camera = context.projectionPool[STANDARD_PROJECTION_IDS.EYE] || context.projectionPool[STANDARD_PROJECTION_IDS.SCREEN] as ResolvedProjectionWithGlobals | undefined;
    if (!camera) {
        return current; // Graceful degradation - no camera found
    }

    const cameraPos = (camera as ResolvedProjectionWithGlobals).globalPosition ?? camera.position;
    const cameraRotation = (camera as ResolvedProjectionWithGlobals).globalRotation ?? camera.rotation;

    return {
        ...current,
        ...computeFollowPosition(current, cameraPos, settings, cameraRotation),
    };
}

function followElement(
    context: ResolutionContext,
    settings: FollowEffectConfig,
    current: ResolvedBaseVisual
): ResolvedBaseVisual {
    const previousResolved = context.previousResolved;
    if (!previousResolved?.elements) {
        return current;
    }
    const targetElement = previousResolved.elements.get(settings.follow);

    if (!targetElement) {
        return current;
    }

    return {
        ...current,
        ...computeFollowPosition(current, targetElement.position, settings, targetElement.rotate),
    };
}

export const FollowEffect: EffectBundle<'follow', FollowEffectConfig> = {
    type: 'follow',
    targets: ALL_ELEMENT_TYPES,
    defaults: FollowDefaultConfig,
    apply(current: ResolvedBaseVisual, context: ResolutionContext, settings: FollowEffectConfig): ResolvedBaseVisual {
        if (settings.follow == 'CAMERA') {
            return followCamera(context, settings, current);
        }

        return followElement(context, settings, current);
    }
};
