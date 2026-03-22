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
    /** If true, adds head position to initial camera position instead of replacing */
    offsetMode?: boolean;
    /** If true, disables rotation entirely */
    disableRotation?: boolean;
}

export const DEFAULT_HEAD_TRACKING_CONFIG: HeadTrackingModifierConfig = {
    damping: 1,
    smoothing: 0.1,
    rotationSmoothing: 0.1,
    threshold: 0.5,
    rotationThreshold: 0.01,
    offsetMode: false,
    disableRotation: false,
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
    private referencePosition: Vector3 | null = null;
    private referenceRotation: { yaw: number; pitch: number; roll: number } | null = null;

    constructor(config: Partial<HeadTrackingModifierConfig> = {}) {
        this.config = { ...DEFAULT_HEAD_TRACKING_CONFIG, ...config };
    }

    tick(_sceneId: number): void {
        // Data is provided via context, no need to do anything here
    }

    getCarPosition(initialCam: Vector3, context: ResolutionContext<TDataProviderLib>): FailableResult<CarResult> {
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

        // Calibration: on first face detection, store reference and return zero movement
        if (this.referencePosition === null) {
            this.referencePosition = clampedPosition;
            this.referenceRotation = clampedRotation;
            return {
                success: true,
                value: {
                    name: this.name,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 }
                }
            };
        }

        // Calculate relative position/rotation from reference
        const relativePosition = {
            x: clampedPosition.x - this.referencePosition.x,
            y: clampedPosition.y - this.referencePosition.y,
            z: clampedPosition.z - this.referencePosition.z,
        };

        const relativeRotation = {
            yaw: clampedRotation.yaw - this.referenceRotation!.yaw,
            pitch: clampedRotation.pitch - this.referenceRotation!.pitch,
            roll: clampedRotation.roll - this.referenceRotation!.roll,
        };

        const smooth = this.config.smoothing;
        const rotationSmooth = this.config.rotationSmoothing;
        const threshold = this.config.threshold;
        const rotationThreshold = this.config.rotationThreshold;

        const shouldMoveX = Math.abs(relativePosition.x - this.lastPosition.x) > threshold;
        const shouldMoveY = Math.abs(relativePosition.y - this.lastPosition.y) > threshold;
        const shouldMoveZ = Math.abs(relativePosition.z - this.lastPosition.z) > threshold;

        const shouldYaw = Math.abs(relativeRotation.yaw - this.lastRotation.yaw) > rotationThreshold;
        const shouldPitch = Math.abs(relativeRotation.pitch - this.lastRotation.pitch) > rotationThreshold;
        const shouldRoll = Math.abs(relativeRotation.roll - this.lastRotation.roll) > rotationThreshold;

        const smoothedPosition = {
            x: shouldMoveX ? this.lerp(this.lastPosition.x, relativePosition.x, smooth) : this.lastPosition.x,
            y: shouldMoveY ? this.lerp(this.lastPosition.y, relativePosition.y, smooth) : this.lastPosition.y,
            z: shouldMoveZ ? this.lerp(this.lastPosition.z, relativePosition.z, smooth) : this.lastPosition.z,
        };

        const smoothedRotation = {
            yaw: shouldYaw ? this.lerp(this.lastRotation.yaw, relativeRotation.yaw, rotationSmooth) : this.lastRotation.yaw,
            pitch: shouldPitch ? this.lerp(this.lastRotation.pitch, relativeRotation.pitch, rotationSmooth) : this.lastRotation.pitch,
            roll: shouldRoll ? this.lerp(this.lastRotation.roll, relativeRotation.roll, rotationSmooth) : this.lastRotation.roll,
        };

        this.lastPosition = smoothedPosition;
        this.lastRotation = smoothedRotation;

        // Disable rotation if configured
        const finalRotation = this.config.disableRotation
            ? { yaw: 0, pitch: 0, roll: 0 }
            : smoothedRotation;

        // In offsetMode, add head position to initial camera position instead of replacing
        const finalPosition = this.config.offsetMode
            ? {
                x: initialCam.x + smoothedPosition.x,
                y: initialCam.y + smoothedPosition.y,
                z: initialCam.z + smoothedPosition.z,
              }
            : smoothedPosition;

        return {
            success: true,
            value: {
                name: this.name,
                position: finalPosition,
                rotation: finalRotation
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
