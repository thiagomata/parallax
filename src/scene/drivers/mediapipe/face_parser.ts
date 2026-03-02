import type {Vector3} from "../../types.ts";
import {experimental_getRunnerTask} from "vitest/node";

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

interface RawLandmark {
    position: Vector3;
    isVisible: boolean;
}

export interface RawExtraction {
    nose: RawLandmark;
    eyes: {
        left: RawLandmark;
        right: RawLandmark;
    };
    brows: {
        left: RawLandmark;
        right: RawLandmark;
    }
    mouth: {
        left: RawLandmark;
        right: RawLandmark;
    };
    rig: {
        leftEar: RawLandmark;
        rightEar: RawLandmark;
        leftTemple: RawLandmark;
        rightTemple: RawLandmark;
    };
    bounds: {
        top: RawLandmark;
        bottom: RawLandmark;
    };
}

export interface HeadProportions {
    width: {
        ear_to_ear: number,
        temple_to_temple: number,
        eye_to_eye: number,
        mouth_width: number,
    },
    depth: {
        skull_center: number,
        eye_plane: number,
        nose_tip: number,
        mouth_plane: number,
    },
    height: {
        forehead_top: number,
        eye_line: number,
        nose_base: number,
        mouth_line: number,
        chin_tip: number,
    },
    offset: {
        ear_y: number
    }
}

export const DEFAULT_HEAD_PROPORTIONS: HeadProportions = {
    width: {
        ear_to_ear: 1.0,
        temple_to_temple: 0.85,
        eye_to_eye: 0.45,
        mouth_width: 0.35
    },
    depth: {
        skull_center: 0.0,
        eye_plane: -0.45,
        nose_tip: -0.65,
        mouth_plane: -0.50
    },
    height: {
        forehead_top: -0.6,  // UP is now negative
        eye_line: -0.1,      // UP is now negative
        nose_base: 0.2,      // DOWN is now positive
        mouth_line: 0.4,     // DOWN is now positive
        chin_tip: 0.7        // DOWN is now positive
    },
    offset: {
        ear_y: -0.02,        // Slightly UP from center
    }
} as const;

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

    public parseRawVector(rawDataVector: Partial<Vector3>[]): RawExtraction {
        const createLandmark = (index: number): RawLandmark => {
            const landmark = rawDataVector[index];
            if (!landmark) {
                return {
                    position: {
                        x: -1,
                        y: -1,
                        z: -1,
                    },
                    isVisible: false,
                }
            }

            let x = landmark?.x ?? 0;

            // Apply Mirroring at the source
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

        return {
            mouth: {
                left: createLandmark(INDEX.MOUTH_LEFT),
                right: createLandmark(INDEX.MOUTH_RIGHT),
            },
            brows: {
                left: createLandmark(INDEX.BROW_LEFT),
                right: createLandmark(INDEX.BROW_RIGHT),
            },
            nose: createLandmark(INDEX.NOSE),
            eyes: {
                left: createLandmark(INDEX.EYE_LEFT),
                right: createLandmark(INDEX.EYE_RIGHT),
            },
            rig: {
                leftEar: createLandmark(INDEX.EAR_LEFT),
                rightEar: createLandmark(INDEX.EAR_RIGHT),
                leftTemple: createLandmark(INDEX.TEMPLE_LEFT),
                rightTemple: createLandmark(INDEX.TEMPLE_RIGHT),
            },
            bounds: {
                top: createLandmark(INDEX.TOP),
                bottom: createLandmark(INDEX.BOTTOM),
            }
        };
    }

    public translateToSkullCenter(extraction: RawExtraction): RawExtraction {
        const center = this.getSkullCenter(extraction);

        let offset;

        if (!center.isVisible) {
            offset = {
                x: 0.5,
                y: 0.5,
                z: 0.5,
            }
        } else {
            offset = center.position
        }

        // 3. The Mapping (Deterministic)
        const translate = (lm: RawLandmark): RawLandmark => ({
            ...lm,
            position: {
                x: lm.position.x - offset.x,
                y: lm.position.y - offset.y,
                z: lm.position.z - offset.z
            }
        });

        return {
            nose: translate(extraction.nose),
            eyes: {
                left: translate(extraction.eyes.left),
                right: translate(extraction.eyes.right),
            },
            brows: {
                left: translate(extraction.brows.left),
                right: translate(extraction.brows.right),
            },
            mouth: {
                left: translate(extraction.mouth.left),
                right: translate(extraction.mouth.right),
            },
            rig: {
                leftEar: translate(extraction.rig.leftEar),
                rightEar: translate(extraction.rig.rightEar),
                leftTemple: translate(extraction.rig.leftTemple),
                rightTemple: translate(extraction.rig.rightTemple),
            },
            bounds: {
                top: translate(extraction.bounds.top),
                bottom: translate(extraction.bounds.bottom),
            }
        };
    }

    public getSkullCenter(extraction: RawExtraction): RawLandmark {
        const props = this.config.headProportions;
        const midpoints: Vector3[] = [];

        const pairs = [
            {left: extraction.rig.leftEar, right: extraction.rig.rightEar},
            {left: extraction.rig.leftTemple, right: extraction.rig.rightTemple},
            {left: extraction.eyes.left, right: extraction.eyes.right}
        ];

        for (const pair of pairs) {
            if (pair.left.isVisible && pair.right.isVisible) {
                midpoints.push({
                    x: (pair.left.position.x + pair.right.position.x) / 2,
                    y: (pair.left.position.y + pair.right.position.y) / 2,
                    z: (pair.left.position.z + pair.right.position.z) / 2
                });
            }
        }

        // Resolve Face Height first to validate visibility
        const faceHeightExtraction = this.getFaceHeight(extraction);

        // If no stable midpoints or no height can be resolved, we can't find a valid skull center
        if (midpoints.length === 0 || !faceHeightExtraction.isVisible) {
            return {
                position: { x: 0.5, y: 0.5, z: 0.5 },
                isVisible: false,
            };
        }

        // 1. Average X for stability
        let sumX = 0;
        for (const m of midpoints) sumX += m.x;
        const centerX = sumX / midpoints.length;

        // 2. Resolve Y (Vertical Pivot) using nose_base
        const eyeY = (extraction.eyes.left.position.y + extraction.eyes.right.position.y) / 2;
        const centerY = this.getSkullYCenter(eyeY, faceHeightExtraction.value);

        // 3. Resolve Z (Depth Pivot)
        let centerZ = 0;
        if (extraction.rig.leftEar.isVisible && extraction.rig.rightEar.isVisible) {
            centerZ = (extraction.rig.leftEar.position.z + extraction.rig.rightEar.position.z) / 2;
        } else {
            // eye_to_eye width (0.45) vs full width (1.0)
            const eyeSpan = Math.abs(extraction.eyes.left.position.x - extraction.eyes.right.position.x);
            const fullFaceWidth = eyeSpan / props.width.eye_to_eye;

            const eyeZ = (extraction.eyes.left.position.z + extraction.eyes.right.position.z) / 2;
            const zOffset = Math.abs(props.depth.skull_center - props.depth.eye_plane) * fullFaceWidth;
            centerZ = eyeZ + zOffset;
        }

        return {
            position: { x: centerX, y: centerY, z: centerZ },
            isVisible: true,
        };
    }

    private getSkullYCenter(eyeY: number, faceHeight: number) {
        const props = this.config.headProportions;
        const totalHeight = Math.abs(props.height.forehead_top - props.height.chin_tip);

        const eyeToOriginDelta = props.height.eye_line;
        const ratio = faceHeight / totalHeight;
        const scaledDelta = eyeToOriginDelta * ratio;

        let x = {
            eyeY,          // Is this 0.4?
            faceHeight,    // Is this 0.6?
            totalHeight,   // Is this 1.3?
            ratio,         // Is this 0.46?
            scaledDelta,   // Is this 0.046?
            result: eyeY + scaledDelta
        }
        console.log(x);

        return eyeY - scaledDelta;
    }

    private getFaceHeight(extraction: RawExtraction): { value: number, isVisible: boolean } {
        const props = this.config.headProportions;

    // 1. Determine the "Anatomical Constant" for a Full Head
    // forehead_top (0.6) - chin_tip (-0.7) = 1.3 units
    const totalManifestHeight = Math.abs(props.height.forehead_top - props.height.chin_tip);

        // Strategy A: Direct Measurement (Bounds)
        if (extraction.bounds.top.isVisible && extraction.bounds.bottom.isVisible) {
            const dx = extraction.bounds.bottom.position.x - extraction.bounds.top.position.x;
            const dy = extraction.bounds.bottom.position.y - extraction.bounds.top.position.y;

            return {
                value: Math.sqrt(dx * dx + dy * dy), // Hypotenuse ignores Roll
                isVisible: true,
            };
        }

        // Strategy B: Anatomical Reconstruction (Euclidean)
        if (extraction.eyes.left.isVisible && extraction.eyes.right.isVisible && extraction.nose.isVisible) {
            const eyeX = (extraction.eyes.left.position.x + extraction.eyes.right.position.x) / 2;
            const eyeY = (extraction.eyes.left.position.y + extraction.eyes.right.position.y) / 2;
            const nose = extraction.nose.position;

            // The true distance between the mid-eye point and the nose tip
            const currentInternalDist = Math.hypot(nose.x - eyeX, nose.y - eyeY);
            const manifestInternalDist = Math.abs(props.height.eye_line - props.height.nose_base);

            return {
                value: (currentInternalDist / manifestInternalDist) * totalManifestHeight,
                isVisible: true,
            };
        }

        // Last resort: Return a safe default (e.g., 0.5 of frame) or 0
        return {
            value: 0.5,
            isVisible: false,
        };
    }

    public normalizeToUnitScale(extraction: RawExtraction): RawExtraction {
        const props = this.config.headProportions;
        let screenHeadWidth = 1.0;

        // 1. Resolve how large the "1.0 unit" head is on the screen right now
        if (extraction.rig.leftEar.isVisible && extraction.rig.rightEar.isVisible) {
            // Direct: Ears define the 1.0 width
            screenHeadWidth = Math.hypot(
                extraction.rig.rightEar.position.x - extraction.rig.leftEar.position.x,
                extraction.rig.rightEar.position.y - extraction.rig.leftEar.position.y
            );
        } else if (extraction.eyes.left.isVisible && extraction.eyes.right.isVisible) {
            // Reconstruction: eyeSpan / eye_to_eye proportion
            const eyeSpan = Math.hypot(
                extraction.eyes.right.position.x - extraction.eyes.left.position.x,
                extraction.eyes.right.position.y - extraction.eyes.left.position.y
            );
            // Result: 0.135 / 0.45 = 0.3 (The original scale)
            screenHeadWidth = eyeSpan / props.width.eye_to_eye;
        }

        // 2. The Normalization Factor (The inverse of the detected scale)
        const factor = screenHeadWidth || 1.0;

        const scale = (lm: RawLandmark): RawLandmark => ({
            ...lm,
            position: {
                x: lm.position.x / factor,
                y: lm.position.y / factor,
                z: lm.position.z / factor
            }
        });

        return {
            nose: scale(extraction.nose),
            eyes: {
                left: scale(extraction.eyes.left),
                right: scale(extraction.eyes.right),
            },
            brows: {
                left: scale(extraction.brows.left),
                right: scale(extraction.brows.right),
            },
            mouth: {
                left: scale(extraction.mouth.left),
                right: scale(extraction.mouth.right),
            },
            rig: {
                leftEar: scale(extraction.rig.leftEar),
                rightEar: scale(extraction.rig.rightEar),
                leftTemple: scale(extraction.rig.leftTemple),
                rightTemple: scale(extraction.rig.rightTemple),
            },
            bounds: {
                top: scale(extraction.bounds.top),
                bottom: scale(extraction.bounds.bottom),
            }
        };
    }
}