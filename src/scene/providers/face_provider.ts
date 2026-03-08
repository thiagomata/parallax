import type {Face} from "../drivers/mediapipe/face.ts";
import type {TrackingStatus, Vector3} from "../types.ts";

/**
 * Represents the face geometry as a 3D Rigid Body.
 * * COORDINATE SYSTEM:
 * - Local: Origin (0,0,0) is at the 'rig.center' (Skull Center).
 * - Units: Normalized to "Head Units" (1.0 = total distance between ears).
 * - World: Screen-space coordinates (0.0 to 1.0) relative to the camera frame.
 */
export interface FaceGeometry {
    /**
     * Absolute transformation of the head within the camera view.
     * These values place the head in the 3D scene.
     */
    world: {
        /**
         * The (x,y,z) position of the skull center in scene space.
         * Used for 3D scene translation.
         */
        center: Vector3;
        /**
         * Scale factor derived from head size in the frame.
         * Represents how large the head appears relative to canonical size.
         * Used for 3D scene scaling.
         */
        unitScale: number;
        /**
         * Computed Euler angles in radians from canonical head positions.
         * Follows YXZ rotation order.
         * These angles describe the head's orientation relative to canonical pose.
         */
        rotation: {
            /** Y-axis rotation: Left/Right turn. */
            yaw: number;
            /** X-axis rotation: Up/Down tilt. */
            pitch: number;
            /** Z-axis rotation: Side-to-side lean. */
            roll: number;
        };
    };

    /**
     * The tip of the nose.
     * Position relative to skull center (local space).
     * Fixed anatomical position - does not change with rotation.
     */
    nose: Vector3;

    /**
     * Facial features located on the frontal "Face Plate".
     */
    eyes: {
        /**
         * Left eye center.
         * Position relative to skull center: Approx [-0.2, 0, -0.45]. */
        left: Vector3;
        /**
         * Right eye center.
         * Position relative to skull center: Approx [0.2, 0, -0.45].
         * */
        right: Vector3;
        /**
         * Midpoint of the eye-line (nasal bridge).
         * Position relative to skull center: Approx [0, 0, -0.45].
         */
        midpoint: Vector3;
    };

    /**
     * The internal scaffolding (Rig) of the head model.
     */
    rig: {
        /**
         * The mathematical pivot of the head.
         * Always [0, 0, 0] in local space.
         */
        center: Vector3;
        /**
         * Left ear (Tragus).
         * Position relative to skull center: [-0.5, 0, 0].
         */
        leftEar: Vector3;
        /**
         * Right ear (Tragus).
         * Position relative to skull center: [0.5, 0, 0].
         */
        rightEar: Vector3;
    };

    /**
     * Extremities used for bounding volumes and interaction logic.
     * All positions are relative to the skull center.
     */
    bounds: {
        /** Leftmost point of the head. Approx [-0.5, 0, 0]. */
        left: Vector3;
        /** Rightmost point of the head. Approx [0.5, 0, 0]. */
        right: Vector3;
        /** Top of the skull/hairline. Approx [0, 0.6, -0.2]. */
        top: Vector3;
        /** Bottom of the chin. Approx [0, -0.7, -0.4]. */
        bottom: Vector3;
    };
}

export interface FaceProvider {
    getFace(): Face | null
    getStatus(): TrackingStatus;
    getVideo(): any;
    init(): Promise<void>;
}