import type {
    CarModifier,
    CarResult,
    DataProviderLib,
    FailableResult,
    ResolutionContext,
    Vector3,
} from "../types.ts";
import type { FaceWorldData, HeadTrackerDataProviderLib } from "../providers/head_tracking_data_provider.ts";

/**
 * Optional limits for head tracking values
 */
export interface HeadTrackingLimits {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    minZ?: number;
    maxZ?: number;
    minPitch?: number;
    maxPitch?: number;
    minYaw?: number;
    maxYaw?: number;
    minRoll?: number;
    maxRoll?: number;
}

/**
 * Configuration for HeadTrackingModifier.
 */
export interface HeadTrackingModifierConfig {
    /** Rotation intensity multiplier (0-1), higher values reduce head movement */
    damping: number;
    /** Smoothing factor (0-1), lower = more smoothing */
    smoothing: number;
    /** Smoothing factor for rotation (0-1), lower = more smoothing */
    rotationSmoothing: number;
    /** Threshold for position - changes below this value are ignored */
    threshold: number;
    /** Threshold for rotation (in radians) - changes below this value are ignored */
    rotationThreshold: number;
    /** Optional limits for position and rotation */
    limits?: HeadTrackingLimits;
}

export const DEFAULT_HEAD_TRACKING_CONFIG: HeadTrackingModifierConfig = {
    damping: 1,
    smoothing: 0.1,
    rotationSmoothing: 0.02,
    threshold: 0.5,
    rotationThreshold: 0.01,
};

export class HeadTrackingModifier<TDataProviderLib extends DataProviderLib = HeadTrackerDataProviderLib>
    implements CarModifier<TDataProviderLib> {

    readonly name = "Head Tracker Camera";
    readonly priority = 10;
    readonly active = true;
    readonly requiredDataProviders: (keyof TDataProviderLib)[] = ['headTracker' as keyof TDataProviderLib];

    private readonly config: HeadTrackingModifierConfig;
    private lastPosition: Vector3 = { x: 0, y: 0, z: 0 };
    private lastRotation = { yaw: 0, pitch: 0, roll: 0 };

    constructor(config: Partial<HeadTrackingModifierConfig> = {}) {
        this.config = { ...DEFAULT_HEAD_TRACKING_CONFIG, ...config };
    }

    tick(_sceneId: number): void {
        // Data is provided via context, no need to do anything here
    }

    getCarPosition(_initialCam: Vector3, context: ResolutionContext<TDataProviderLib>): FailableResult<CarResult> {
        const headData = context.dataProviders.headTracker as FaceWorldData | null;

        if (!headData) {
            return { success: false, error: "No face detected" };
        }

        const targetPosition = {
            x: headData.midpoint.x,
            y: headData.midpoint.y,
            z: -headData.midpoint.z,
        };

        const targetRotation = {
            yaw: headData.stick.yaw * this.config.damping,
            pitch: -headData.stick.pitch * this.config.damping,
            roll: headData.stick.roll * this.config.damping,
        };

        // Apply limits if configured
        const limits = this.config.limits;
        const clampedPosition = limits ? {
            x: this.clamp(targetPosition.x, limits.minX, limits.maxX),
            y: this.clamp(targetPosition.y, limits.minY, limits.maxY),
            z: this.clamp(targetPosition.z, limits.minZ, limits.maxZ),
        } : targetPosition;

        const clampedRotation = limits ? {
            yaw: this.clamp(targetRotation.yaw, limits.minYaw, limits.maxYaw),
            pitch: this.clamp(targetRotation.pitch, limits.minPitch, limits.maxPitch),
            roll: this.clamp(targetRotation.roll, limits.minRoll, limits.maxRoll),
        } : targetRotation;

        const smooth = this.config.smoothing;
        const rotationSmooth = this.config.rotationSmoothing;
        const threshold = this.config.threshold;
        const rotationThreshold = this.config.rotationThreshold;

        // Check if this is first call (lastPosition is at default 0,0,0)
        const isFirstCall = this.lastPosition.x === 0 && this.lastPosition.y === 0 && this.lastPosition.z === 0;

        // On first call, use full smoothing (lerp factor of 1 = instant)
        const posSmooth = isFirstCall ? 1 : smooth;
        const rotSmooth = isFirstCall ? 1 : rotationSmooth;

        const shouldMoveX = Math.abs(targetPosition.x - this.lastPosition.x) > threshold;
        const shouldMoveY = Math.abs(targetPosition.y - this.lastPosition.y) > threshold;
        const shouldMoveZ = Math.abs(targetPosition.z - this.lastPosition.z) > threshold;

        const shouldYaw = Math.abs(targetRotation.yaw - this.lastRotation.yaw) > rotationThreshold;
        const shouldPitch = Math.abs(targetRotation.pitch - this.lastRotation.pitch) > rotationThreshold;
        const shouldRoll = Math.abs(targetRotation.roll - this.lastRotation.roll) > rotationThreshold;

        const smoothedPosition = {
            x: shouldMoveX ? this.lerp(this.lastPosition.x, clampedPosition.x, posSmooth) : this.lastPosition.x,
            y: shouldMoveY ? this.lerp(this.lastPosition.y, clampedPosition.y, posSmooth) : this.lastPosition.y,
            z: shouldMoveZ ? this.lerp(this.lastPosition.z, clampedPosition.z, posSmooth) : this.lastPosition.z,
        };

        const smoothedRotation = {
            yaw: shouldYaw ? this.lerp(this.lastRotation.yaw, clampedRotation.yaw, rotSmooth) : this.lastRotation.yaw,
            pitch: shouldPitch ? this.lerp(this.lastRotation.pitch, clampedRotation.pitch, rotSmooth) : this.lastRotation.pitch,
            roll: shouldRoll ? this.lerp(this.lastRotation.roll, clampedRotation.roll, rotSmooth) : this.lastRotation.roll,
        };

        this.lastPosition = smoothedPosition;
        this.lastRotation = smoothedRotation;

        return {
            success: true,
            value: {
                name: this.name,
                position: smoothedPosition,
                rotation: smoothedRotation
            }
        };
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    private clamp(value: number, min?: number, max?: number): number {
        if (min !== undefined && value < min) return min;
        if (max !== undefined && value > max) return max;
        return value;
    }
}
