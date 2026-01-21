import type {FaceGeometry, Vector3} from "../types.ts";

export class MockFaceFactory {

    /**
     * Creates a "perfect" face looking straight at the camera
     * centered exactly at 0.5, 0.5.
     */
    createCenterFace(): FaceGeometry{
        return {
            nose: { x: 0.5, y: 0.5, z: 0 },
            leftEye: { x: 0.45, y: 0.45, z: 0 },
            rightEye: { x: 0.55, y: 0.45, z: 0 },
            bounds: {
                left: { x: 0.4, y: 0.5, z: 0 },
                right: { x: 0.6, y: 0.5, z: 0 },
                top: { x: 0.5, y: 0.4, z: 0 },
                bottom: { x: 0.5, y: 0.6, z: 0 }
            }
        }
    }

    private move(face: FaceGeometry,  fn: (a: Vector3) => Vector3): FaceGeometry {
        return {
            nose: fn(face.nose),
            leftEye: fn(face.leftEye),
            rightEye: fn(face.rightEye),
            bounds: {
                left: fn(face.bounds.left),
                right: fn(face.bounds.right),
                top: fn(face.bounds.top),
                bottom: fn(face.bounds.bottom),
            }
        }
    }

    /**
     * Move the head in the horizontal axis x
     * @param face
     * @param change
     */
    shiftX(face: FaceGeometry | null = null, change: number = 0.2): FaceGeometry {
        face = face ?? this.createCenterFace();
        return this.move(face,
            (pos) => {
                return {
                    x: pos.x + change,
                    y: pos.y,
                    z: pos.z
                }
            }
        );
    }

    /**
     * Move the head in the vertical axis y
     * @param face
     * @param change
     */
    shiftY(face: FaceGeometry | null = null, change: number = 0.2): FaceGeometry {
        face = face ?? this.createCenterFace();
        return this.move(face,
            (pos) => {
                return {
                    x: pos.x,
                    y: pos.y + change,
                    z: pos.z
                }
            }
        );
    }

    /**
     * Simulates the head scale changing, lean closer or lean back
     * @param face
     * @param factor
     */
    scale(face: FaceGeometry | null = null, factor: number = 1.2): FaceGeometry {
        face = face ?? this.createCenterFace();
        const center = { x: 0.5, y: 0.5 }; // Pivot point for scaling

        return this.move(face, (pos) => {
            return {
                x: center.x + (pos.x - center.x) * factor,
                y: center.y + (pos.y - center.y) * factor,
                z: pos.z
            };
        });
    }

    /**
     * Simulates head rotation by offsetting the nose relative to the midpoint.
     * @param face - the current face geometry
     * @param yaw - Positive for turning right, negative for turning left.
     * @param pitch - Positive for looking down, negative for looking up.
     */
    rotate(face: FaceGeometry | null = null, yaw: number = 0.05, pitch: number = 0.05): FaceGeometry {
        const base = face ?? this.createCenterFace();
        return {
            ...base,
            nose: {
                x: base.nose.x + yaw,
                y: base.nose.y + pitch,
                z: base.nose.z
            }
        };
    }
}