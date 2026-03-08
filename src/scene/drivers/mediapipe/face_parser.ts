import type {FaceGeometry, Vector3} from "../../types.ts";
import {DEFAULT_HEAD_PROPORTIONS, Face, type FaceData, type HeadProportions} from "./face.ts";

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

export interface HeadParserConfig {
    physicalHeadWidth: number;
    focalLength: number;
    mirror: boolean;
    headProportions: HeadProportions
}

interface RawLandmark {
    position: Vector3;
    isVisible: boolean;
}

export class FaceParser {
    private config: HeadParserConfig;

    constructor(config: Partial<HeadParserConfig> = {}) {
        this.config = {
            physicalHeadWidth: config.physicalHeadWidth ?? 150,
            focalLength: config.focalLength ?? 1.0,
            mirror: config.mirror ?? false,
            headProportions: config.headProportions ?? DEFAULT_HEAD_PROPORTIONS,
        };
    }

    public static parse(rawDataVector: Partial<Vector3>[], mirror = false): FaceGeometry {
        const parser = new FaceParser({ mirror });
        const face = parser.parse(rawDataVector);
        return face.geometry;
    }

    public parse(rawDataVector: Partial<Vector3>[]): Face {
        const createLandmark = (index: number): RawLandmark => {
            const landmark = rawDataVector[index];
            if (!landmark) {
                return {
                    position: { x: -1, y: -1, z: -1 },
                    isVisible: false,
                };
            }

            let x = landmark?.x ?? 0;

            if (this.config.mirror) {
                x = 1.0 - x;
            }

            const isVisible = 
                landmark.x !== undefined && landmark.x !== null &&
                landmark.y !== undefined && landmark.y !== null &&
                landmark.x >= 0 && landmark.x <= 1 &&
                landmark.y >= 0 && landmark.y <= 1;

            return {
                position: {
                    x: x ?? 0,
                    y: landmark?.y ?? 0,
                    z: landmark?.z ?? 0
                },
                isVisible
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
