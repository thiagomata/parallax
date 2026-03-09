import type {
    CarModifier,
    DataProviderLib,
    FailableResult,
    NudgeModifier,
    ResolutionContext,
    StickModifier,
    StickResult,
    Vector3,
} from "../types.ts";
import type { FaceWorldData, HeadTrackerDataProviderLib } from "../providers/head_tracking_data_provider.ts";

/**
 * Configuration for HeadTrackingModifier.
 */
export interface HeadTrackingModifierConfig {
    /** X/Y position movement range in scene units */
    travelRange: number;
    /** Rotation intensity multiplier (0-1), higher values reduce head movement */
    damping: number;
    /** Camera distance for stick rotation calculation */
    lookDistance: number;
    /** Z depth movement range in scene units */
    zTravelRange: number;
}

export const DEFAULT_HEAD_TRACKING_CONFIG: HeadTrackingModifierConfig = {
    travelRange: 100,
    damping: 0.5,
    lookDistance: 1000,
    zTravelRange: 500,
};

export class HeadTrackingModifier<TDataProviderLib extends DataProviderLib = HeadTrackerDataProviderLib>
    implements CarModifier<TDataProviderLib>, NudgeModifier<TDataProviderLib>, StickModifier<TDataProviderLib> {

    readonly name = "Head Tracker Camera";
    readonly priority = 10;
    readonly active = true;
    readonly requiredDataProviders: (keyof TDataProviderLib)[] = ['headTracker' as keyof TDataProviderLib];

    private readonly config: HeadTrackingModifierConfig;

    constructor(config: Partial<HeadTrackingModifierConfig> = {}) {
        this.config = { ...DEFAULT_HEAD_TRACKING_CONFIG, ...config };
    }

    tick(_sceneId: number): void {
        // Data is provided via context, no need to do anything here
    }

    getCarPosition(_initialCam: Vector3, context: ResolutionContext<TDataProviderLib>): FailableResult<{ name: string; position: Vector3 }> {
        const headData = context.dataProviders.headTracker as FaceWorldData | null;

        if (!headData) {
            return { success: false, error: "No face detected" };
        }

        return {
            success: true,
            value: {
                name: this.name,
                position: {
                    x: headData.midpoint.x,
                    y: headData.midpoint.y,
                    z: headData.midpoint.z,
                }
            }
        };
    }

    getNudge(_currentCarPos: Vector3, context: ResolutionContext<TDataProviderLib>): FailableResult<Partial<Vector3>> {
        const headData = context.dataProviders.headTracker as FaceWorldData | null;

        if (!headData) {
            return { success: false, error: "No face detected" };
        }

        return {
            success: true,
            value: {
                x: headData.midpoint.x * this.config.travelRange,
                y: headData.midpoint.y * this.config.travelRange,
                z: headData.midpoint.z * this.config.zTravelRange,
            }
        };
    }

    getStick(_finalPos: Vector3, context: ResolutionContext<TDataProviderLib>): FailableResult<StickResult> {
        const headData = context.dataProviders.headTracker as FaceWorldData | null;

        if (!headData) {
            return { success: false, error: "No face detected" };
        }

        return {
            success: true,
            value: {
                yaw: headData.stick.yaw * this.config.damping,
                pitch: headData.stick.pitch * this.config.damping,
                roll: headData.stick.roll * this.config.damping,
                distance: this.config.lookDistance,
                priority: this.priority,
            }
        };
    }
}
