import type {Vector3, FaceGeometry} from "../../types.ts";

export class FaceParser {
    /**
     * MediaPipe Face Mesh Index Mapping
     * @see https://storage.googleapis.com/mediapipe-assets/documentation/visualization/face_ad_mobile_full_2019_04_08.pdf
     */
    private static readonly INDEX = {
        NOSE: 1,
        EYE_L: 468,
        EYE_R: 473,
        FACE_L: 234,
        FACE_R: 454,
        CHIN: 152,
        FOREHEAD: 10
    };

    /**
     * Transforms a raw MediaPipe landmark array into a semantic FaceGeometry object.
     * We normalize the coordinates here if necessary.
     */
    static parse(raw: any[]): FaceGeometry {
        if (!raw || raw.length < 478) {
            throw new Error("Invalid landmark data: expected at least 478 points.");
        }

        const mapPoint = (idx: number): Vector3 => ({
            x: raw[idx].x, // Normalized 0-1 from MediaPipe
            y: raw[idx].y,
            z: raw[idx].z
        });

        return {
            nose: mapPoint(this.INDEX.NOSE),
            leftEye: mapPoint(this.INDEX.EYE_L),
            rightEye: mapPoint(this.INDEX.EYE_R),
            bounds: {
                left: mapPoint(this.INDEX.FACE_L),
                right: mapPoint(this.INDEX.FACE_R),
                top: mapPoint(this.INDEX.FOREHEAD),
                bottom: mapPoint(this.INDEX.CHIN)
            }
        };
    }
}