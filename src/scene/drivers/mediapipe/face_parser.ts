import {DEFAULT_HEAD_PROPORTIONS, Face, type FaceData, type HeadProportions} from "./face.ts";
import type {Vector3} from "../../types.ts";
import {merge} from "../../utils/merge.ts";

/**
 * Maps MediaPipe landmark indices to semantic face landmarks.
 */
export const INDEX = {
    NOSE: 1,
    EYE_LEFT: 33,
    EYE_RIGHT: 263,
    MOUTH_LEFT: 61,
    MOUTH_RIGHT: 291,
    BROW_LEFT: 105,
    BROW_RIGHT: 334,
    EAR_LEFT: 234,
    EAR_RIGHT: 454,
    TEMPLE_LEFT: 127,
    TEMPLE_RIGHT: 356,
    TOP: 10,
    BOTTOM: 152
};

/**
 * Configuration for face parsing.
 */
export interface HeadParserConfig {
    /**
     * multiplier - depth sensitivity (default: 1.0)
     */
    focalLength: number;
    /**
     * flip landmarks horizontally
     */
    mirror: boolean;
    /**
     *  landmark positions ratios
     */
    headProportions: HeadProportions
}

export const DEFAULT_HEAD_PARSER_CONFIG: HeadParserConfig = {
    focalLength: 1,
    mirror: false,
    headProportions: DEFAULT_HEAD_PROPORTIONS,
}

interface RawLandmark {
    readonly position: Readonly<Vector3>;
    readonly visibility: number | null;
    readonly isUsable: boolean;
}

export class FaceParser {
    private config: HeadParserConfig;

    constructor(config: Partial<HeadParserConfig> = {}) {
        this.config = merge(DEFAULT_HEAD_PARSER_CONFIG, config);
    }

    /**
     * Parses raw MediaPipe landmarks into semantic Face data.
     * @param rawDataVector - array of landmarks from MediaPipe (indices 0-477)
     * @returns Face with semantic landmarks, raw `visibility` scores, and `isUsable` quality flags
     */
    public parse(rawDataVector: Array<Partial<Vector3> & { visibility?: number | null }>): Face {
        const missing: RawLandmark = {
            position: { x: -1, y: -1, z: -1 },
            visibility: null,
            isUsable: false,
        };

        const createLandmark = (index: number): RawLandmark => {
            const landmark = rawDataVector[index];
            if (!landmark) {
                return missing;
            }

            const hasXY = landmark.x !== undefined && landmark.x !== null &&
                landmark.y !== undefined && landmark.y !== null;

            const rawX = landmark.x ?? 0;
            const rawY = landmark.y ?? 0;
            const rawZ = landmark.z ?? 0;

            if (!Number.isFinite(rawX) || !Number.isFinite(rawY) || !Number.isFinite(rawZ)) {
                return missing;
            }

            let x = rawX;

            if (this.config.mirror) {
                x = 1.0 - x;
            }

            const visibility = Number.isFinite(landmark.visibility as number) ? (landmark.visibility as number) : null;

            return {
                position: {
                    x,
                    y: rawY,
                    z: rawZ
                },
                visibility,
                isUsable: hasXY,
            };
        };

        const faceData: FaceData = {
            nose: createLandmark(INDEX.NOSE),
            eyes: {
                left: createLandmark(INDEX.EYE_LEFT),
                right: createLandmark(INDEX.EYE_RIGHT),
            },
            brows: {
                left: createLandmark(INDEX.BROW_LEFT),
                right: createLandmark(INDEX.BROW_RIGHT),
            },
            mouth: {
                left: createLandmark(INDEX.MOUTH_LEFT),
                right: createLandmark(INDEX.MOUTH_RIGHT),
            },
            rig: {
                leftEar: createLandmark(INDEX.EAR_LEFT),
                rightEar: createLandmark(INDEX.EAR_RIGHT),
                leftTemple: createLandmark(INDEX.TEMPLE_LEFT),
                rightTemple: createLandmark(INDEX.TEMPLE_RIGHT),
            },
            bounds: {
                middleTop: createLandmark(INDEX.TOP),
                middleBottom: createLandmark(INDEX.BOTTOM),
            }
        };

        return new Face(faceData, this.config.headProportions);
    }
}
