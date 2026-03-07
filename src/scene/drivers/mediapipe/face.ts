import type {Rotation3, Vector3} from "../../types.ts";
import {wrapPi} from "../../utils/projection_utils.ts";


interface RawLandmark {
    position: Vector3;
    isVisible: boolean;
}

export interface FaceData {
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

export class Face {

    readonly data: FaceData;
    readonly proportions: HeadProportions;
    readonly skullCenter: RawLandmark;
    private normalized: boolean;
    private centered: boolean;
    private rotation?: Rotation3;
    private normalFace?: Face;
    private centerFace?: Face;

    public constructor(data: FaceData, proportions: HeadProportions = DEFAULT_HEAD_PROPORTIONS) {
        this.data = data;
        this.proportions = proportions;
        this.skullCenter = this.getSkullCenter();
        this.normalized = false;
        this.centered = false;
    }

    private transform(fn: (lm: RawLandmark) => RawLandmark): Face {
        const transformedData: FaceData = {
            nose: fn(this.data.nose),
            eyes: {
                left: fn(this.data.eyes.left),
                right: fn(this.data.eyes.right),
            },
            brows: {
                left: fn(this.data.brows.left),
                right: fn(this.data.brows.right),
            },
            mouth: {
                left: fn(this.data.mouth.left),
                right: fn(this.data.mouth.right),
            },
            rig: {
                leftEar: fn(this.data.rig.leftEar),
                rightEar: fn(this.data.rig.rightEar),
                leftTemple: fn(this.data.rig.leftTemple),
                rightTemple: fn(this.data.rig.rightTemple),
            },
            bounds: {
                middleTop: fn(this.data.bounds.middleTop),
                middleBottom: fn(this.data.bounds.middleBottom),
            },
        };
        return new Face(transformedData, this.proportions);
    }

    public translate(offset: Vector3): Face {
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
        return this.transform(translate);
    }

    public center(useCache = true): Face {
        if (this.centered && useCache) {
            return this;
        }
        if (this.centerFace && useCache) {
            return this.centerFace;
        }

        const center = this.getSkullCenter();

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

        const translatedToCenter = this.translate(offset);
        translatedToCenter.centered = true;
        // keep previous normalization flag since centering do not change it.
        translatedToCenter.normalized = this.normalized;
        this.centerFace = translatedToCenter;
        return translatedToCenter;
    }

    public getSkullCenter(): RawLandmark {
        const props = this.proportions;
        const midpoints: Vector3[] = [];

        const pairs = [
            {left: this.data.rig.leftEar,    right: this.data.rig.rightEar},
            {left: this.data.rig.leftTemple, right: this.data.rig.rightTemple},
            {left: this.data.eyes.left,      right: this.data.eyes.right}
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
        const faceHeightExtraction = this.getFaceHeight();

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
        const centerY = this.getSkullYCenter();

        // 3. Resolve Z (Depth Pivot)
        let centerZ: number;
        if (this.data.rig.leftEar.isVisible && this.data.rig.rightEar.isVisible) {
            centerZ = (this.data.rig.leftEar.position.z + this.data.rig.rightEar.position.z) / 2;
        } else {
            // eye_to_eye width (0.45) vs full width (1.0)
            const eyeSpan = Math.abs(this.data.eyes.left.position.x - this.data.eyes.right.position.x);
            const fullFaceWidth = eyeSpan / props.width.eye_to_eye;

            const eyeZ = (this.data.eyes.left.position.z + this.data.eyes.right.position.z) / 2;
            const zOffset = Math.abs(props.depth.skull_center - props.depth.eye_plane) * fullFaceWidth;
            centerZ = eyeZ + zOffset;
        }

        return {
            position: {x: centerX, y: centerY, z: centerZ},
            isVisible: true,
        };
    }

    public scale(factor: number): Face {
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
        const scaled = this.transform(scale);
        if (this.centered) {
            return scaled.center();
        }
        return scaled;
    }

    public rotateX(radians: number): Face {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const transform = (lm: RawLandmark): RawLandmark => {
            if (!lm) return lm;
            const { x, y, z } = lm.position;
            return {
                ...lm,
                position: {
                    x,
                    y: y * cos - z * sin,
                    z: y * sin + z * cos
                }
            };
        };
        const centered = this.center().transform(transform);
        if (this.centered) {
            return centered.center();
        }
        return centered.translate(this.skullCenter.position);
    }

    public rotateY(radians: number): Face {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const transform = (lm: RawLandmark): RawLandmark => {
            if (!lm) return lm;
            const { x, y, z } = lm.position;
            return {
                ...lm,
                position: {
                    x: x * cos + z * sin,
                    y,
                    z: -x * sin + z * cos
                }
            };
        };
        const centered = this.center().transform(transform);
        if (this.centered) {
            return centered.center();
        }
        return centered.translate(this.skullCenter.position);
    }

    public rotateZ(radians: number): Face {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const transform = (lm: RawLandmark): RawLandmark => {
            if (!lm) return lm;
            const { x, y, z } = lm.position;
            return {
                ...lm,
                position: {
                    x: x * cos - y * sin,
                    y: x * sin + y * cos,
                    z
                }
            };
        };
        const centered = this.center().transform(transform);
        if (this.centered) {
            return centered.center();
        }
        return centered.translate(this.skullCenter.position);
    }

    public normalize(useCache: boolean = true): Face {
        if (this.normalized && useCache) {
            return this;
        }
        if (this.normalFace && useCache) {
            return this.normalFace;
        }
        const props = this.proportions;

        // Determine measured width
        let measuredWidth: number;

        if (this.data.rig.leftEar.isVisible && this.data.rig.rightEar.isVisible) {
            measuredWidth = Math.hypot(
                this.data.rig.rightEar.position.x - this.data.rig.leftEar.position.x,
                this.data.rig.rightEar.position.y - this.data.rig.leftEar.position.y
            );
            // measuredWidth = this.data.rig.rightEar.position.x - this.data.rig.leftEar.position.x;
        } else if (this.data.eyes.left.isVisible && this.data.eyes.right.isVisible) {
            const eyeSpan = Math.hypot(
                this.data.eyes.right.position.x - this.data.eyes.left.position.x,
                this.data.eyes.right.position.y - this.data.eyes.left.position.y
            );
            // const eyeSpan =  this.data.eyes.right.position.x - this.data.eyes.left.position.x;
            measuredWidth = eyeSpan * (props.width.ear_to_ear / props.width.eye_to_eye);
        } else {
            measuredWidth = props.width.eye_to_eye;
        }

        // Compute the scaling factor to reach canonical width
        const factor = props.width.ear_to_ear / measuredWidth;
        const normalizedFace = this.scale(factor).center();
        normalizedFace.normalized = true;
        normalizedFace.centered = true;
        this.normalFace = normalizedFace;
        return normalizedFace;
    }


    /**
     * Try to recover the roll, pitch and yaw from the rotated face, using the ZYX strategy.
     * As proved by the test 'should test all 6 rotation computation orders for angle recovery' it was the order with better performance.
     */
    getRotation(): Rotation3 {
        if (this.rotation) {
            return this.rotation;
        }

        let face = this.center().normalize();
        // Z
        const roll = face.computeRoll();
        face = face.rotateZ(-roll).normalize();
        // Y
        const yaw = face.computeYaw();
        face = face.rotateY(-yaw).normalize();
        // X
        const pitch = face.computePitch();
        face = face.rotateX(-pitch).normalize();

        return {
            roll,
            pitch,
            yaw
        }
    }

    getRotationYXZ(): Rotation3 {
        if (this.rotation) {
            return this.rotation;
        }

        let face = this.center().normalize();
        // Y
        const yaw = face.computeYaw();
        face = face.rotateY(-yaw).normalize();
        // X
        const pitch = face.computePitch();
        face = face.rotateX(-pitch).normalize();
        // Z
        const roll = face.computeRoll();
        face = face.rotateZ(-roll).normalize();

        return {
            roll,
            pitch,
            yaw
        }
    }
    get yaw(): number {
        return this.getRotation().yaw;
    }

    get pitch(): number {
        return this.getRotation().pitch;
    }

    get roll(): number {
        return this.getRotation().roll;
    }

    /**
     * Compute roll angle (in radians) from a centered RawExtraction
     */
    computeRoll(): number {

        const head = this.normalized ? this : this.normalize();
        const minLength = 0.1; // normalized head

        const lines: {
            a: { x: number; y: number },
            b: { x: number; y: number },
            isVertical: boolean
        }[] = [];

        // Ear line
        if (head.data.rig.leftEar.isVisible && head.data.rig.rightEar.isVisible) {
            lines.push({
                a: {x: head.data.rig.leftEar.position.x, y: head.data.rig.leftEar.position.y},
                b: {x: head.data.rig.rightEar.position.x, y: head.data.rig.rightEar.position.y},
                isVertical: false,
            });
        }

        // Bounds center line
        if (head.data.bounds.middleTop?.isVisible && head.data.bounds.middleBottom?.isVisible) {
            lines.push({
                a: {x: head.data.bounds.middleTop.position.x, y: head.data.bounds.middleTop.position.y},
                b: {x: head.data.bounds.middleBottom.position.x, y: head.data.bounds.middleBottom.position.y},
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

    computeYaw(): number {
        const head = this.normalized ? this : this.normalize();

        if (!head.data.eyes.left.isVisible || !head.data.eyes.right.isVisible || !head.data.nose.isVisible) {
            return 0;
        }

        const props = this.proportions;

        const currentEyeWidth = Math.hypot(
            head.data.eyes.left.position.x - head.data.eyes.right.position.x,
            head.data.eyes.left.position.y - head.data.eyes.right.position.y
        );
        const eyeCenterX = (head.data.eyes.left.position.x + head.data.eyes.right.position.x) / 2;
        const noseXRel = head.data.nose.position.x - eyeCenterX;

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

    computePitch(): number {
        const head = this.normalized ? this : this.normalize();

        if (!head.data.eyes.left.isVisible ||
            !head.data.eyes.right.isVisible ||
            !head.data.nose.isVisible) {
            return 0;
        }

        const props = this.proportions;

        // Eye center Y only (for pitch detection)
        const eyeCenterY = (head.data.eyes.left.position.y + head.data.eyes.right.position.y) / 2;

        // Measured distance (dy) in projection plane
        const dy = head.data.nose.position.y - eyeCenterY;

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

    private getSkullYCenter(): number {
        const props = this.proportions;

        if (this.data.bounds.middleTop.isVisible &&
            this.data.bounds.middleBottom.isVisible &&
            this.data.eyes.left.isVisible &&
            this.data.eyes.right.isVisible) {

            const eyeMidY = (this.data.eyes.left.position.y + this.data.eyes.right.position.y) / 2;

            const topToEyeDist = Math.hypot(
                this.data.bounds.middleTop.position.x - this.data.eyes.left.position.x,
                this.data.bounds.middleTop.position.y - eyeMidY
            );
            const bottomToEyeDist = Math.hypot(
                this.data.bounds.middleBottom.position.x - this.data.eyes.left.position.x,
                this.data.bounds.middleBottom.position.y - eyeMidY
            );

            const canonicalTopToEye = props.height.eye_line - props.height.forehead_top;
            const canonicalBottomToEye = props.height.chin_tip - props.height.eye_line;

            const scaleRatio = (topToEyeDist / canonicalTopToEye +
                bottomToEyeDist / canonicalBottomToEye) / 2;

            return eyeMidY - props.height.eye_line * scaleRatio;
        }

        if (this.data.eyes.right.isVisible && this.data.eyes.left.isVisible && this.data.nose.isVisible) {
            const eyeMidY = (this.data.eyes.left.position.y + this.data.eyes.right.position.y) / 2;

            const currentEyeToNose = Math.hypot(
                this.data.nose.position.x - this.data.eyes.left.position.x,
                this.data.nose.position.y - eyeMidY
            );
            const canonicalEyeToNose = Math.hypot(
                props.width.eye_to_eye / 2,
                props.height.nose_base - props.height.eye_line
            );
            const scaleRatio = currentEyeToNose / canonicalEyeToNose;
            return eyeMidY - props.height.eye_line * scaleRatio;
        }

        return (this.data.eyes.right.position.y + this.data.eyes.left.position.y) / 2;
    }

    private getFaceHeight(): { value: number, isVisible: boolean } {
        const props = this.proportions;

        // 1. Determine the "Anatomical Constant" for a Full Head
        // forehead_top (0.6) - chin_tip (-0.7) = 1.3 units
        const totalManifestHeight = Math.abs(props.height.forehead_top - props.height.chin_tip);

        // Strategy A: Direct Measurement (Bounds)
        if (this.data.bounds.middleTop.isVisible && this.data.bounds.middleBottom.isVisible) {
            const dx = this.data.bounds.middleBottom.position.x - this.data.bounds.middleTop.position.x;
            const dy = this.data.bounds.middleBottom.position.y - this.data.bounds.middleTop.position.y;

            return {
                value: Math.sqrt(dx * dx + dy * dy), // Hypotenuse ignores Roll
                isVisible: true,
            };
        }

        // Strategy B: Anatomical Reconstruction (Euclidean)
        if (this.data.eyes.left.isVisible && this.data.eyes.right.isVisible && this.data.nose.isVisible) {
            const eyeX = (this.data.eyes.left.position.x + this.data.eyes.right.position.x) / 2;
            const eyeY = (this.data.eyes.left.position.y + this.data.eyes.right.position.y) / 2;
            const nose = this.data.nose.position;

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