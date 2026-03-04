import type {Rotation3, Vector3} from "../../types.ts";
import {add, multiply, subtract} from "../../utils/projection_utils.ts";

function normalize(v: Vector3): Vector3 {
    const len = Math.hypot(v.x, v.y, v.z);
    return {x: v.x / len, y: v.y / len, z: v.z / len};
}

function cross(a: Vector3, b: Vector3): Vector3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

export const wrap2Pi = (a: number) => {
    while (a <= -Math.PI - 0.005) a += 2 * Math.PI;
    while (a >= Math.PI + 0.005) a -= 2 * Math.PI;
    return a;
};

export const wrapPi = (a: number) => {
    while (a <= -Math.PI) a += Math.PI;
    while (a >= Math.PI) a -= Math.PI;
    return a;
};

function computeCanonicalPitches(props: HeadProportions, maxPitch: number = Math.PI / 6, slices: number = 10): { angle: number, distance: number }[] {
    const eyeLine = props.height.eye_line;
    const noseBase = props.height.nose_base;
    const eyePlane = props.depth.eye_plane;
    const noseTip = props.depth.nose_tip;

    const pitches: { angle: number, distance: number }[] = [];
    for (let i = 0; i <= 2 * slices; i++) {
        const angle = -maxPitch + i * (2 * maxPitch) / (2 * slices);
        const distance = (noseBase - eyeLine) * Math.cos(angle) - (noseTip - eyePlane) * Math.sin(angle);
        pitches.push({ angle, distance });
    }
    return pitches;
}

function computePitchFromDistance(measured: number, canonicalPitches: { angle: number, distance: number }[]): number {
    if (canonicalPitches.length < 2) return 0;

    // Sort by distance (ascending) 
    const sorted = canonicalPitches
        .slice()
        .sort((a, b) => a.distance - b.distance);

    // Handle edge cases
    if (measured <= sorted[0].distance) return sorted[0].angle;
    if (measured >= sorted[sorted.length - 1].distance) return sorted[sorted.length - 1].angle;

    // Find the two points that bracket the measured value
    for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].distance <= measured && measured <= sorted[i + 1].distance) {
            const p1 = sorted[i];
            const p2 = sorted[i + 1];
            const t = (measured - p1.distance) / (p2.distance - p1.distance);
            return p1.angle + t * (p2.angle - p1.angle);
        }
    }

    return 0;
}


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

export interface ParsedFace {
    readonly nose: RawLandmark;
    readonly eyes: {
        readonly left: RawLandmark;
        readonly right: RawLandmark;
    };
    readonly brows: {
        readonly left: RawLandmark;
        readonly right: RawLandmark;
    }
    readonly mouth: {
        readonly left: RawLandmark;
        readonly right: RawLandmark;
    };
    readonly rig: {
        readonly leftEar: RawLandmark;
        readonly rightEar: RawLandmark;
        readonly leftTemple: RawLandmark;
        readonly rightTemple: RawLandmark;
    };
    readonly bounds: {
        readonly middleTop: RawLandmark;
        readonly middleBottom: RawLandmark;
    };
    readonly skullCenter: RawLandmark;
    readonly normalized: boolean;
    readonly centered: boolean;
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

    public parseRawVector(rawDataVector: Partial<Vector3>[]): ParsedFace {
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

        const extracted: Omit<ParsedFace, "skullCenter"> = {
            normalized: false,
            centered: false,
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
                middleTop: createLandmark(INDEX.TOP),
                middleBottom: createLandmark(INDEX.BOTTOM),
            }
        };

        return {
            ...extracted,
            skullCenter: this.getSkullCenter(extracted),
        }
    }

    public translateToSkullCenter(extraction: ParsedFace): ParsedFace {
        // if (extraction.centered) {
        //     return extraction;
        // }

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
        const translate = (lm: RawLandmark): RawLandmark => {
            if (!lm) {
                return lm;
            }
            return {
                ...lm,
                position: {
                    x: lm.position.x - offset.x,
                    y: lm.position.y - offset.y,
                    z: lm.position.z - offset.z
                }
            }
        };

        return {
            normalized: false,
            centered: true,
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
                middleTop: translate(extraction.bounds.middleTop),
                middleBottom: translate(extraction.bounds.middleBottom),
            },
            skullCenter: translate(extraction.skullCenter),
        };
    }

    public getSkullCenter(face: Omit<ParsedFace, "skullCenter">): RawLandmark {
        const props = this.config.headProportions;
        const midpoints: Vector3[] = [];

        const pairs = [
            {left: face.rig.leftEar, right: face.rig.rightEar},
            {left: face.rig.leftTemple, right: face.rig.rightTemple},
            {left: face.eyes.left, right: face.eyes.right}
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
        const faceHeightExtraction = this.getFaceHeight(face);

        // If no stable midpoints or no height can be resolved, we can't find a valid skull center
        if (midpoints.length === 0 || !faceHeightExtraction.isVisible) {
            return {
                position: {x: 0.5, y: 0.5, z: 0.5},
                isVisible: false,
            };
        }

        // 1. Average X for stability
        let sumX = 0;
        for (const m of midpoints) sumX += m.x;
        const centerX = sumX / midpoints.length;

        // 2. Resolve Y (Vertical Pivot) using nose_base
        // const eyeY = (extraction.eyes.left.position.y + extraction.eyes.right.position.y) / 2;
        const centerY = this.getSkullYCenter(face);

        // 3. Resolve Z (Depth Pivot)
        let centerZ: number;
        if (face.rig.leftEar.isVisible && face.rig.rightEar.isVisible) {
            centerZ = (face.rig.leftEar.position.z + face.rig.rightEar.position.z) / 2;
        } else {
            // eye_to_eye width (0.45) vs full width (1.0)
            const eyeSpan = Math.abs(face.eyes.left.position.x - face.eyes.right.position.x);
            const fullFaceWidth = eyeSpan / props.width.eye_to_eye;

            const eyeZ = (face.eyes.left.position.z + face.eyes.right.position.z) / 2;
            const zOffset = Math.abs(props.depth.skull_center - props.depth.eye_plane) * fullFaceWidth;
            centerZ = eyeZ + zOffset;
        }

        return {
            position: {x: centerX, y: centerY, z: centerZ},
            isVisible: true,
        };
    }

    public normalizeToUnitScale(extraction: ParsedFace): ParsedFace {
        const props = this.config.headProportions;

        // Determine measured head width
        let measuredWidth: number;

        if (extraction.rig.leftEar.isVisible && extraction.rig.rightEar.isVisible) {
            measuredWidth = Math.hypot(
                extraction.rig.rightEar.position.x - extraction.rig.leftEar.position.x,
                extraction.rig.rightEar.position.y - extraction.rig.leftEar.position.y
            );
        } else if (extraction.eyes.left.isVisible && extraction.eyes.right.isVisible) {
            const eyeSpan = Math.hypot(
                extraction.eyes.right.position.x - extraction.eyes.left.position.x,
                extraction.eyes.right.position.y - extraction.eyes.left.position.y
            );
            measuredWidth = eyeSpan * props.width.eye_to_eye / props.width.ear_to_ear; // reconstruct full head width
        } else {
            measuredWidth = props.width.eye_to_eye; // fallback
        }

        // Compute the **scaling factor to reach canonical width**
        const factor = props.width.ear_to_ear / measuredWidth;

        const scale = (lm: RawLandmark): RawLandmark => {
            if (!lm ) {
                return lm;
            }
            return {
                ...lm,
                position: {
                    x: lm.position.x * factor,
                    y: lm.position.y * factor,
                    z: lm.position.z * factor
                }
            }
        };

        return {
            normalized: true,
            centered: extraction.centered,
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
                middleTop: scale(extraction.bounds.middleTop),
                middleBottom: scale(extraction.bounds.middleBottom),
            },
            skullCenter: scale(extraction.skullCenter),
        };
    }

    /**
     * Recover YXZ Euler angles (in radians) from the current centered 3D face
     */
    approximateRotation(centered: ParsedFace): Rotation3 {
        // Build a rotation matrix from landmarks
        // We'll use the eyes-nose plane as a simple head basis
        const leftEye = centered.eyes.left.position;
        const rightEye = centered.eyes.right.position;
        const nose = centered.nose.position;

        // X axis: right direction
        const xAxis = normalize(subtract(rightEye, leftEye));
        // Y axis: up direction
        const eyeCenter = multiply(add(leftEye, rightEye), 0.5);
        const yAxis = normalize(subtract(nose, eyeCenter));
        // Z axis: forward (cross product)
        const zAxis = normalize(cross(xAxis, yAxis));
        // Re-orthogonalize Y
        const yOrtho = cross(zAxis, xAxis);

        // Rotation matrix (columns = axes)
        const R = [
            [xAxis.x, yOrtho.x, zAxis.x],
            [xAxis.y, yOrtho.y, zAxis.y],
            [xAxis.z, yOrtho.z, zAxis.z]
        ];

        // --- Extract YXZ Euler angles ---
        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
        const pitch = Math.asin(clamp(R[1][0], -1, 1));

        let yaw: number, roll: number;
        if (Math.abs(R[1][0]) < 0.99999) {
            yaw = Math.atan2(-R[2][0], R[0][0]);
            roll = Math.atan2(R[1][2], R[1][1]);
        } else {
            // Gimbal lock
            yaw = Math.atan2(R[0][2], R[2][2]);
            roll = 0;
        }

        return {
            pitch: wrapPi(pitch),
            yaw: wrapPi(yaw),
            roll: wrapPi(roll)
        };
    }

    // public fullAxisRotation(centered: ParsedFace): Rotation3 {
    //     const {rig, bounds} = centered;
    //
    //     // 1. Construct full 3D corners of the head box
    //     const topLeft = {x: rig.leftEar.position.x, y: bounds.middleTop.position.y, z: rig.leftEar.position.z};
    //     const topRight = {x: rig.rightEar.position.x, y: bounds.middleTop.position.y, z: rig.rightEar.position.z};
    //     const bottomLeft = {x: rig.leftEar.position.x, y: bounds.middleBottom.position.y, z: rig.leftEar.position.z};
    //     const bottomRight = {x: rig.rightEar.position.x, y: bounds.middleBottom.position.y, z: rig.rightEar.position.z};
    //
    //     // 2. Compute basis vectors
    //     const right = normalize({
    //         x: topRight.x - topLeft.x,
    //         y: topRight.y - topLeft.y,
    //         z: topRight.z - topLeft.z
    //     });
    //
    //     const up = normalize({
    //         x: topLeft.x - bottomLeft.x,
    //         y: topLeft.y - bottomLeft.y,
    //         z: topLeft.z - bottomLeft.z
    //     });
    //
    //     const forward = normalize(cross(up, right));
    //     const trueUp = cross(right, forward); // Gram-Schmidt re-orthogonalize
    //
    //     // 3. Construct rotation matrix (columns = basis vectors)
    //     const m00 = right.x, m01 = trueUp.x, m02 = forward.x;
    //     const m10 = right.y, m11 = trueUp.y, m12 = forward.y;
    //     const m20 = right.z, m21 = trueUp.z, m22 = forward.z;
    //
    //     // // 4. Extract YXZ Euler angles
    //     // const pitch = Math.asin(-m12);               // rotation around X
    //     // const yaw   = Math.atan2(m02, m22);          // rotation around Y
    //     // const roll  = Math.atan2(m10, m11);          // rotation around Z
    //
    //     // YXZ extraction from transposed matrix
    //     const pitch = wrap2Pi(Math.asin(-m12));
    //     const yaw = wrap2Pi(Math.atan2(m02, m22));
    //     const roll = wrap2Pi(Math.atan2(m10, m11) - Math.PI);
    //
    //     const x = dot(right, up);
    //     console.log(x);
    //     return {
    //         pitch,
    //         yaw,
    //         roll,
    //     };
    // }

    getRotation(extraction: ParsedFace) {
        // if (extraction.rig.leftEar.isVisible && extraction.rig.rightEar.isVisible && extraction.bounds.middleTop.isVisible && extraction.bounds.middleBottom.isVisible) {
        //     // most robust method
        //     return this.fullAxisRotation(extraction);
        // }

        if (extraction.eyes.left.isVisible && extraction.eyes.right.isVisible && extraction.nose.isVisible) {
            return this.approximateRotation(extraction); // fallback strategy
        }
        return {yaw: 0, pitch: 0, roll: 0}; // not enough data
    }

    /**
     * Compute roll angle (in radians) from a centered RawExtraction
     */
    computeRoll(extraction: ParsedFace): number {

        const head = this.normalizeToUnitScale(
            this.translateToSkullCenter(extraction)
        );

        const minLength = 0.1; // normalized head

        const lines: {
            a: { x: number; y: number },
            b: { x: number; y: number },
            axis: number
        }[] = [];

        // Ear line
        if (head.rig.leftEar.isVisible && head.rig.rightEar.isVisible) {
            lines.push({
                a: {x: head.rig.leftEar.position.x, y: head.rig.leftEar.position.y},
                b: {x: head.rig.rightEar.position.x, y: head.rig.rightEar.position.y},
                axis: 0,
            });
        }

        // Bounds center line
        if (head.bounds.middleTop?.isVisible && head.bounds.middleBottom?.isVisible) {
            lines.push({
                a: {x: head.bounds.middleTop.position.x, y: head.bounds.middleTop.position.y},
                b: {x: head.bounds.middleBottom.position.x, y: head.bounds.middleBottom.position.y},
                axis: Math.PI / 2,
            });
        }

        // Compute angles relative to horizontal
        const angles = lines
            .filter(({a, b}) => Math.hypot(b.x - a.x, b.y - a.y) >= minLength)
            .map(({a, b, axis}) => //Math.atan2(-(b.y - a.y), b.x - a.x))
            {
                const dx = b.x - a.x;
                const dy = b.y - a.y; // flip Y if needed
                const angle = Math.atan2(dy, dx);
                return angle - axis;
            })
            .map(wrapPi)

        if (angles.length === 0) return 0; // no valid lines

        // Average → roll
        return angles.reduce((acc, v) => acc + v, 0) / angles.length;
    }

    computeYaw(head: ParsedFace) {
        return this.getRotation(head).yaw;
    }

    computePitch(extraction: ParsedFace): number {
        // 1. Normalize and center
        const head = this.normalizeToUnitScale(
            this.translateToSkullCenter(extraction)
        );

        if (!head.eyes.left.isVisible ||
            !head.eyes.right.isVisible ||
            !head.nose.isVisible) {
            return 0;
        }

        // Eye center Y only (for pitch detection)
        const eyeCenterY = (head.eyes.left.position.y + head.eyes.right.position.y) / 2;

        // 2D distance in projection plane
        const dy = head.nose.position.y - eyeCenterY;

        const canonicalPitches = computeCanonicalPitches(this.config.headProportions);
        return computePitchFromDistance(dy, canonicalPitches);
    }

    private getSkullYCenter(extraction: Omit<ParsedFace, "skullCenter">): number {
        const props = this.config.headProportions;

        if (extraction.bounds.middleTop.isVisible && extraction.bounds.middleBottom.isVisible) {
            const top = extraction.bounds.middleTop.position.y;
            const bottom = extraction.bounds.middleBottom.position.y;
            return (top + bottom) / 2;
        }

        if (extraction.eyes.right.isVisible && extraction.eyes.left.isVisible && extraction.nose.isVisible) {
            const eyeMidY = (extraction.eyes.left.position.y + extraction.eyes.right.position.y) / 2;
            const currentEyeToNose = extraction.nose.position.y - eyeMidY;
            const canonicalEyeToNose = props.height.nose_base - props.height.eye_line;
            const scaleRatio = currentEyeToNose / canonicalEyeToNose;
            return eyeMidY - props.height.eye_line * scaleRatio;
        }

        return (extraction.eyes.right.position.y + extraction.eyes.left.position.y) / 2;
    }

    // computePitch(head: RawExtraction) {
    //     return this.getRotation(head).pitch;

    private getFaceHeight(extraction:  Omit<ParsedFace, "skullCenter">): { value: number, isVisible: boolean } {
        const props = this.config.headProportions;

        // 1. Determine the "Anatomical Constant" for a Full Head
        // forehead_top (0.6) - chin_tip (-0.7) = 1.3 units
        const totalManifestHeight = Math.abs(props.height.forehead_top - props.height.chin_tip);

        // Strategy A: Direct Measurement (Bounds)
        if (extraction.bounds.middleTop.isVisible && extraction.bounds.middleBottom.isVisible) {
            const dx = extraction.bounds.middleBottom.position.x - extraction.bounds.middleTop.position.x;
            const dy = extraction.bounds.middleBottom.position.y - extraction.bounds.middleTop.position.y;

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
}