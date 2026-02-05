import { type Vector3, type ProjectionMatrix } from "../types.ts";
import {projectionMatrixFromFrustum} from "./projection_matrix_utils.ts";

/**
 * A standard 27-inch monitor at 1080p scale (approximate dimensions in mm)
 * Screen is at the world origin (z: 0),
 * assuming the eye starts at some distance (e.g., z: 600)
 */
const DEFAULT_SCREEN_CONFIG = {
    width: 600,      // ~60cm wide
    height: 337,     // ~33.7cm high
    z: 0,            // Screen plane at world Z=0
    near: 10,        // Near clipping at 10mm from eye
    far: 10000,      // Far clipping at 10 meters
    epsilon: 0.001   // Standard precision threshold
};

export class ScreenConfig {
    public readonly width: number;
    public readonly height: number;
    public readonly z: number;
    public readonly near: number;
    public readonly far: number;
    public readonly epsilon: number;
    public readonly halfWidth: number;
    public readonly halfHeight: number;

    private constructor(params: ScreenConfig) {
        this.width = params.width ?? DEFAULT_SCREEN_CONFIG.width;
        this.height = params.height ?? DEFAULT_SCREEN_CONFIG.height;
        this.z = params.z ?? DEFAULT_SCREEN_CONFIG.z;
        this.near = params.near ?? DEFAULT_SCREEN_CONFIG.near;
        this.far = params.far ?? DEFAULT_SCREEN_CONFIG.far;
        this.epsilon = params.epsilon ?? DEFAULT_SCREEN_CONFIG.epsilon;

        this.halfWidth = params.halfWidth ?? this.width / 2;
        this.halfHeight = params.halfHeight ?? this.height / 2;
    }

    public static create(params: Partial<{
        width: number;
        height: number;
        z: number;
        near: number;
        far: number;
        epsilon: number;
    }>): ScreenConfig {

        const screenConfigParam = {...DEFAULT_SCREEN_CONFIG, ...params};

        // 1. Validation Logic
        if (screenConfigParam.width <= 0 || screenConfigParam.height <= 0) {
            throw new Error("Physical dimensions must be positive.");
        }
        if (screenConfigParam.near <= 0 || screenConfigParam.far <= screenConfigParam.near) {
            throw new Error("Invalid clipping planes.");
        }
        if (screenConfigParam.epsilon <= 0) {
            throw new Error("Epsilon must be positive.");
        }

        // 2. Return a validated instance
        return new ScreenConfig({ ...screenConfigParam,
            halfWidth: screenConfigParam.width * 0.5,  // Calculate once here
            halfHeight: screenConfigParam.height * 0.5, // Calculate once here
        });
    }
}
export class ScreenModifier {
    public readonly config: ScreenConfig;

    constructor(config: ScreenConfig) {
        this.config = config;
    }

    /**
     * Compute off-axis frustum based on eye position (camera + head tracking)
     */
    public buildFrustum(eyePos: Vector3): ProjectionMatrix {
        const distance = this.config.z - eyePos.z;
        const safeDistance = distance < this.config.epsilon ? this.config.epsilon : distance;

        const scale = this.config.near / safeDistance;

        const left   = (-this.config.halfWidth - eyePos.x) * scale;
        const right  = ( this.config.halfWidth - eyePos.x) * scale;
        const bottom = (-this.config.halfHeight - eyePos.y) * scale;
        const top    = ( this.config.halfHeight - eyePos.y) * scale;

        return projectionMatrixFromFrustum(left, right, bottom, top, this.config.near, this.config.far);
    }
}