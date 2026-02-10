import { type Vector3, type ProjectionMatrix, ScreenConfig } from "../types.ts";
import {projectionMatrixFromFrustum} from "./projection_matrix_utils.ts";

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