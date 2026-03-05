import type {Rotation3, Vector3} from "../../types.ts";
import {add, multiply, subtract, wrapPi, normalize, cross, wrap2Pi} from "../../utils/projection_utils.ts";
import {DEFAULT_HEAD_PROPORTIONS, type FaceData, type HeadProportions} from "./face.ts";

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

    public parseRawVector(rawDataVector: Partial<Vector3>[]): FaceData {
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

        const extracted: Omit<FaceData, "skullCenter"> = {
            // normalized: false,
            // centered: false,
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
            // skullCenter: this.getSkullCenter(extracted),
        }
    }

    public translateToSkullCenter(extraction: FaceData): FaceData {
        // if (extraction.centered && !useCache) {
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
            // normalized: false,
            // centered: true,
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
            // skullCenter: extraction.skullCenter == undefined ? undefined : translate(extraction.skullCenter),
        };
    }

    public getSkullCenter(face: Omit<FaceData, "skullCenter">): RawLandmark {
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

    public normalizeToUnitScale(extraction: FaceData): FaceData {
        const props = this.config.headProportions;

        // Determine measured width
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
            measuredWidth = eyeSpan * (props.width.ear_to_ear / props.width.eye_to_eye);
        } else {
            measuredWidth = props.width.eye_to_eye;
        }

        // Compute the scaling factor to reach canonical width
        const factor = props.width.ear_to_ear / measuredWidth;

        // Scale all positions (including skullCenter)
        const scale = (lm: RawLandmark): RawLandmark => {
            if (!lm) {
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

        const scaled: Omit<FaceData, "skullCenter"> = {
            // normalized: false,
            // centered: false,
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
        };

        // Calculate skull center from scaled face and translate all positions to origin
        const center = this.getSkullCenter(scaled);

        let offset: Vector3;
        if (!center.isVisible) {
            offset = { x: 0.5, y: 0.5, z: 0.5 };
        } else {
            offset = center.position;
        }

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
            // normalized: true,
            // centered: true,
            nose: translate(scaled.nose),
            eyes: {
                left: translate(scaled.eyes.left),
                right: translate(scaled.eyes.right),
            },
            brows: {
                left: translate(scaled.brows.left),
                right: translate(scaled.brows.right),
            },
            mouth: {
                left: translate(scaled.mouth.left),
                right: translate(scaled.mouth.right),
            },
            rig: {
                leftEar: translate(scaled.rig.leftEar),
                rightEar: translate(scaled.rig.rightEar),
                leftTemple: translate(scaled.rig.leftTemple),
                rightTemple: translate(scaled.rig.rightTemple),
            },
            bounds: {
                middleTop: translate(scaled.bounds.middleTop),
                middleBottom: translate(scaled.bounds.middleBottom),
            },
            // skullCenter: { position: { x: 0, y: 0, z: 0 }, isVisible: true },
        };
    }

    /**
     * Recover YXZ Euler angles (in radians) from the current centered 3D face
     */
    approximateRotation(face: FaceData): Rotation3 {
        // Build a rotation matrix from landmarks
        // We'll use the eyes-nose plane as a simple head basis

        const centered = this.normalizeToUnitScale(face);

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

    public fullAxisRotation(centered: FaceData): Rotation3 {
        const {rig, bounds} = centered;

        const topLeft = {x: rig.leftEar.position.x, y: bounds.middleTop.position.y, z: rig.leftEar.position.z};
        const topRight = {x: rig.rightEar.position.x, y: bounds.middleTop.position.y, z: rig.rightEar.position.z};
        const bottomLeft = {x: rig.leftEar.position.x, y: bounds.middleBottom.position.y, z: rig.leftEar.position.z};

        const right = normalize({
            x: topRight.x - topLeft.x,
            y: topRight.y - topLeft.y,
            z: topRight.z - topLeft.z
        });

        const up = normalize({
            x: topLeft.x - bottomLeft.x,
            y: topLeft.y - bottomLeft.y,
            z: topLeft.z - bottomLeft.z
        });

        const forward = normalize(cross(up, right));
        const trueUp = cross(right, forward);

        const m02 = forward.x, m10 = right.y, m11 = trueUp.y, m12 = forward.y, m22 = forward.z;

        const pitch = wrap2Pi(Math.asin(-m12));
        const yaw = wrap2Pi(Math.atan2(m02, m22));
        const roll = wrap2Pi(Math.atan2(m10, m11) - Math.PI);

        return {
            pitch,
            yaw,
            roll,
        };
    }

    sequentialRotation(centered: FaceData): Rotation3 {
        const leftEye = centered.eyes.left.position;
        const rightEye = centered.eyes.right.position;
        const nose = centered.nose.position;

        const xAxis = normalize(subtract(rightEye, leftEye));
        const eyeCenter = multiply(add(leftEye, rightEye), 0.5);
        const yAxis = normalize(subtract(nose, eyeCenter));
        const zAxis = normalize(cross(xAxis, yAxis));
        const yOrtho = cross(zAxis, xAxis);

        const R = [
            [xAxis.x, yOrtho.x, zAxis.x],
            [xAxis.y, yOrtho.y, zAxis.y],
            [xAxis.z, yOrtho.z, zAxis.z]
        ];

        const yaw = Math.atan2(-R[2][0], R[0][0]);

        const cosYaw = Math.cos(-yaw);
        const sinYaw = Math.sin(-yaw);
        const unrotateY = (p: Vector3): Vector3 => ({
            x: p.x * cosYaw - p.z * sinYaw,
            y: p.y,
            z: p.x * sinYaw + p.z * cosYaw
        });

        const unrotatedNose = unrotateY(nose);
        const unrotatedLeftEye = unrotateY(leftEye);
        const unrotatedRightEye = unrotateY(rightEye);

        const unrotatedEyeCenter = multiply(add(unrotatedLeftEye, unrotatedRightEye), 0.5);

        const pitch = Math.atan2(unrotatedEyeCenter.y - unrotatedNose.y, unrotatedNose.z - unrotatedEyeCenter.z);

        const cosPitch = Math.cos(-pitch);
        const sinPitch = Math.sin(-pitch);
        const unrotateP = (p: Vector3): Vector3 => ({
            x: p.x,
            y: p.y * cosPitch - p.z * sinPitch,
            z: p.y * sinPitch + p.z * cosPitch
        });

        const pitchUnrotatedLeftEye = unrotateP(unrotatedLeftEye);
        const pitchUnrotatedRightEye = unrotateP(unrotatedRightEye);

        const roll = Math.atan2(
            pitchUnrotatedLeftEye.y - pitchUnrotatedRightEye.y,
            pitchUnrotatedRightEye.x - pitchUnrotatedLeftEye.x
        );

        return {
            yaw: wrapPi(yaw),
            pitch: wrapPi(pitch),
            roll: wrapPi(roll),
        };
    }

    getRotation(extraction: FaceData) {
        if (extraction.rig.leftEar.isVisible && extraction.rig.rightEar.isVisible && extraction.bounds.middleTop.isVisible && extraction.bounds.middleBottom.isVisible) {
            // most robust method
            return this.fullAxisRotation(extraction);
        }

        if (extraction.eyes.left.isVisible && extraction.eyes.right.isVisible && extraction.nose.isVisible) {
            return this.approximateRotation(extraction); // fallback strategy
        }
        return {yaw: 0, pitch: 0, roll: 0}; // not enough data
    }

    /**
     * Compute roll angle (in radians) from a centered RawExtraction
     */
    computeRoll(extraction: FaceData): number {

        const head = this.normalizeToUnitScale(extraction);

        const minLength = 0.1; // normalized head

        const lines: {
            a: { x: number; y: number },
            b: { x: number; y: number },
            isVertical: boolean
        }[] = [];

        // Ear line
        if (head.rig.leftEar.isVisible && head.rig.rightEar.isVisible) {
            lines.push({
                a: {x: head.rig.leftEar.position.x, y: head.rig.leftEar.position.y},
                b: {x: head.rig.rightEar.position.x, y: head.rig.rightEar.position.y},
                isVertical: false,
            });
        }

        // Bounds center line
        if (head.bounds.middleTop?.isVisible && head.bounds.middleBottom?.isVisible) {
            lines.push({
                a: {x: head.bounds.middleTop.position.x, y: head.bounds.middleTop.position.y},
                b: {x: head.bounds.middleBottom.position.x, y: head.bounds.middleBottom.position.y},
                isVertical: true,
            });
        }

        // Compute angles relative to horizontal
        const rawAngles = lines
            .filter(({a, b}) => Math.hypot(b.x - a.x, b.y - a.y) >= minLength)
            .map(({a, b, isVertical}) => 
            {
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const rawAngle = Math.atan2(dy, dx);
                // For vertical reference lines (like bounds center), measure deviation from vertical (π/2)
                // For horizontal reference lines (like ear line), measure from horizontal (0)
                return isVertical ? rawAngle - Math.PI / 2 : rawAngle;
            });

        if (rawAngles.length === 0) return 0; // no valid lines

        // Compute circular mean of angles (handles -π/π boundary correctly)
        let sinSum = 0;
        let cosSum = 0;
        for (const angle of rawAngles) {
            sinSum += Math.sin(angle);
            cosSum += Math.cos(angle);
        }
        
        const meanAngle = Math.atan2(sinSum, cosSum);
        
        // Wrap to [-π, π] range
        return wrapPi(meanAngle);
    }

    computeYaw(extraction: FaceData): number {
        const head = this.normalizeToUnitScale(extraction);

        if (!head.eyes.left.isVisible || !head.eyes.right.isVisible || !head.nose.isVisible) {
            return 0;
        }

        const props = this.config.headProportions;

        const currentEyeWidth = Math.hypot(
            head.eyes.left.position.x - head.eyes.right.position.x,
            head.eyes.left.position.y - head.eyes.right.position.y
        );
        const eyeCenterX = (head.eyes.left.position.x + head.eyes.right.position.x) / 2;
        const noseXRel = head.nose.position.x - eyeCenterX;

        const noseDepth = props.depth.eye_plane - props.depth.nose_tip;
        const depthToWidthRatio = noseDepth / props.width.eye_to_eye;

        let rawYaw = -Math.atan2(noseXRel, currentEyeWidth * depthToWidthRatio);

        // 1. Handle the NaN Singularity
        if (isNaN(rawYaw)) {
            // If everything is 0, we assume the head has turned
            // fully to the side that the nose is currently on.
            rawYaw = noseXRel >= 0 ? Math.PI / 2 : -Math.PI / 2;
        }

        // 2. Snap to zero for clean neutral pose
        return Math.abs(rawYaw) < 1e-10 ? 0 : rawYaw;
    }

    computePitch(extraction: FaceData): number {
        const head = this.normalizeToUnitScale(extraction);

        if (!head.eyes.left.isVisible ||
            !head.eyes.right.isVisible ||
            !head.nose.isVisible) {
            return 0;
        }

        const props = this.config.headProportions;
        
        // Eye center Y only (for pitch detection)
        const eyeCenterY = (head.eyes.left.position.y + head.eyes.right.position.y) / 2;

        // Measured distance (dy) in projection plane
        const dy = head.nose.position.y - eyeCenterY;

        // Direct trigonometric calculation
        // dy = A * cos(pitch) + B * sin(pitch) where:
        // A = noseBase - eyeLine (height difference)
        // B = eyePlane - noseTip (depth difference)
        const eyeToNoseHeight = props.height.nose_base - props.height.eye_line;
        const eyeToNoseDepth = props.depth.eye_plane - props.depth.nose_tip;

        const R = Math.sqrt(eyeToNoseHeight ** 2 + eyeToNoseDepth ** 2);
        const alpha = Math.atan2(eyeToNoseHeight, eyeToNoseDepth);

        // Clamp ratio to [-1, 1] for asin
        const ratio = Math.max(-1, Math.min(1, dy / R));
        
        return Math.asin(ratio) - alpha;
    }

    private getSkullYCenter(extraction: Omit<FaceData, "skullCenter">): number {
        const props = this.config.headProportions;

        if (extraction.bounds.middleTop.isVisible && 
            extraction.bounds.middleBottom.isVisible &&
            extraction.eyes.left.isVisible && 
            extraction.eyes.right.isVisible) {
            
            const eyeMidY = (extraction.eyes.left.position.y + extraction.eyes.right.position.y) / 2;
            
            const topToEyeDist = Math.hypot(
                extraction.bounds.middleTop.position.x - extraction.eyes.left.position.x,
                extraction.bounds.middleTop.position.y - eyeMidY
            );
            const bottomToEyeDist = Math.hypot(
                extraction.bounds.middleBottom.position.x - extraction.eyes.left.position.x,
                extraction.bounds.middleBottom.position.y - eyeMidY
            );
            
            const canonicalTopToEye = props.height.eye_line - props.height.forehead_top;
            const canonicalBottomToEye = props.height.chin_tip - props.height.eye_line;
            
            const scaleRatio = (topToEyeDist / canonicalTopToEye + 
                               bottomToEyeDist / canonicalBottomToEye) / 2;
            
            return eyeMidY - props.height.eye_line * scaleRatio;
        }

        if (extraction.eyes.right.isVisible && extraction.eyes.left.isVisible && extraction.nose.isVisible) {
            const eyeMidY = (extraction.eyes.left.position.y + extraction.eyes.right.position.y) / 2;
            
            const currentEyeToNose = Math.hypot(
                extraction.nose.position.x - extraction.eyes.left.position.x,
                extraction.nose.position.y - eyeMidY
            );
            const canonicalEyeToNose = Math.hypot(
                props.width.eye_to_eye / 2,
                props.height.nose_base - props.height.eye_line
            );
            const scaleRatio = currentEyeToNose / canonicalEyeToNose;
            return eyeMidY - props.height.eye_line * scaleRatio;
        }

        return (extraction.eyes.right.position.y + extraction.eyes.left.position.y) / 2;
    }

    // computePitch(head: RawExtraction) {
    //     return this.getRotation(head).pitch;

    private getFaceHeight(extraction:  Omit<FaceData, "skullCenter">): { value: number, isVisible: boolean } {
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