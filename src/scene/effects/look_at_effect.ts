import {
    ALL_ELEMENT_TYPES,
    type BaseModifierSettings,
    type EffectBundle,
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

export const EFFECT_LOOK_AT = 'look_at';

export const LookAtEffect: EffectBundle<typeof EFFECT_LOOK_AT, LookAtEffectConfig> = {
    type: EFFECT_LOOK_AT,
    targets: ALL_ELEMENT_TYPES,
    defaults: LookAtDefaultConfig,
    apply(current, state, settings) {
        const rotate = {
            x: current.rotate?.x ?? 0,
            y: current.rotate?.y ?? 0,
            z: current.rotate?.z ?? 0,
        };

        // Determine Target Position, if available
        let targetPos = state.camera.position;
        if (settings.lookAt !== 'CAMERA') {
            if (!state.elements) {
                return current;
            }
            const targetElement = state.elements.get(settings.lookAt)
            if (!targetElement) {
                return current;
            }
            targetPos = targetElement.position;
        }

        // Calculate Vector Difference
        const dx = targetPos.x - current.position.x;
        const dy = targetPos.y - current.position.y;
        const dz = targetPos.z - current.position.z;

        // Calculate Angles (Atan2 is your best friend here)
        if (settings.axis?.y) {
            // Yaw: Angle on the XZ plane
            rotate.y = Math.atan2(dx, dz);
        }

        if (settings.axis?.x) {
            // Pitch: Angle towards the target height
            const distanceXZ = Math.sqrt(dx * dx + dz * dz);
            rotate.x = -Math.atan2(dy, distanceXZ);
        }

        return {
            ...current,
            rotate
        };
    }
};