import { type Vector3 } from "../types.ts";

export interface ScreenConfig {
    width: number;    // physical width of screen
    height: number;   // physical height of screen
    z: number;        // z position of screen in world units
    near: number;     
    far: number;
}

export class ScreenModifier {
    public readonly config: ScreenConfig;

    constructor(config: ScreenConfig) {
        this.config = config;
    }

    /**
     * Compute off-axis frustum based on eye position (camera + head tracking)
     */
    public buildFrustum(eyePos: Vector3): Float32Array {
        const { width, height, z, near, far } = this.config;
        const ex = eyePos.x;
        const ey = eyePos.y;
        const ez = eyePos.z;

        // Frustum edges at near plane
        const left   = (-width/2 - ex) * near / (z - ez);
        const right  = ( width/2 - ex) * near / (z - ez);
        const bottom = (-height/2 - ey) * near / (z - ez);
        const top    = ( height/2 - ey) * near / (z - ez);

        // Off-axis projection matrix
        const proj = new Float32Array([
            2*near/(right-left), 0, (right+left)/(right-left), 0,
            0, 2*near/(top-bottom), (top+bottom)/(top-bottom), 0,
            0, 0, -(far+near)/(far-near), -2*far*near/(far-near),
            0, 0, -1, 0
        ]);

        return proj;
    }
}