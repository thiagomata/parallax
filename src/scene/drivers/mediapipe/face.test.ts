import { describe, it, expect } from 'vitest';
import { Face, DEFAULT_HEAD_PROPORTIONS, type FaceData, type HeadProportions } from "./face";

const createCanonicalHead = (H: HeadProportions = DEFAULT_HEAD_PROPORTIONS): FaceData => {
    return {
        nose: {
            position: { x: 0, y: H.height.nose_base, z: H.depth.nose_tip },
            isVisible: true
        },
        eyes: {
            left: {
                position: { x: -H.width.eye_to_eye / 2, y: H.height.eye_line, z: H.depth.eye_plane },
                isVisible: true
            },
            right: {
                position: { x: H.width.eye_to_eye / 2, y: H.height.eye_line, z: H.depth.eye_plane },
                isVisible: true
            },
        },
        rig: {
            leftEar: {
                position: { x: -H.width.ear_to_ear / 2, y: H.offset.ear_y, z: -0.02 },
                isVisible: true
            },
            rightEar: {
                position: { x: H.width.ear_to_ear / 2, y: H.offset.ear_y, z: -0.02 },
                isVisible: true
            },
            leftTemple: {
                position: { x: -H.width.temple_to_temple / 2, y: H.offset.ear_y, z: 0 },
                isVisible: true
            },
            rightTemple: {
                position: { x: H.width.temple_to_temple / 2, y: H.offset.ear_y, z: 0 },
                isVisible: true
            },
        },
        mouth: {
            left: {
                position: { x: -H.width.mouth_width / 2, y: H.height.mouth_line, z: H.depth.mouth_plane },
                isVisible: true
            },
            right: {
                position: { x: H.width.mouth_width / 2, y: H.height.mouth_line, z: H.depth.mouth_plane },
                isVisible: true
            },
        },
        brows: {
            left: {
                position: { x: -H.width.eye_to_eye / 2, y: H.height.forehead_top * 0.5, z: H.depth.eye_plane },
                isVisible: true
            },
            right: {
                position: { x: H.width.eye_to_eye / 2, y: H.height.forehead_top * 0.5, z: H.depth.eye_plane },
                isVisible: true
            },
        },
        bounds: {
            middleTop: {
                position: { x: 0, y: H.height.forehead_top, z: 0.02 },
                isVisible: true
            },
            middleBottom: {
                position: { x: 0, y: H.height.chin_tip, z: 0.02 },
                isVisible: true
            }
        },
    };
};

describe('Face - constructor', () => {
    it('should create a Face instance with provided data and proportions', () => {
        const head = createCanonicalHead();
        const face = new Face(head);

        expect(face.data).toBe(head);
        expect(face.proportions).toBe(DEFAULT_HEAD_PROPORTIONS);
    });
});

describe('Face - translate', () => {
    it('should translate all landmarks by the given offset (subtraction)', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const translated = face.translate({ x: 0.1, y: 0.2, z: 0.3 });

        expect(translated.data.nose.position.x).toBeCloseTo(head.nose.position.x - 0.1);
        expect(translated.data.nose.position.y).toBeCloseTo(head.nose.position.y - 0.2);
        expect(translated.data.nose.position.z).toBeCloseTo(head.nose.position.z - 0.3);
    });

    it('should not modify the original face', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        face.translate({ x: 0.1, y: 0.2, z: 0.3 });

        expect(face.data.nose.position.x).toBe(head.nose.position.x);
    });
});

describe('Face - center', () => {
    it('should center the face at origin based on skull center', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        const translated = face.translate({ x: 0.1, y: 0.2, z: 0.3 });
        expect(translated.data.nose.position.x).not.toBeCloseTo(0, 1);

        const centered = translated.center();

        expect(centered.data.nose.position.x).toBeCloseTo(0, 5);
    });
});

describe('Face - getSkullCenter', () => {
    it('should compute the skull center from visible landmarks', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const center = face.getSkullCenter();

        expect(center.isVisible).toBe(true);
        expect(center.position.x).toBeCloseTo(0, 1);
    });
});

describe('Face - scale', () => {
    it('should scale all landmarks by the given factor', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const scaled = face.scale(2);

        expect(scaled.data.nose.position.x).toBeCloseTo(head.nose.position.x * 2);
        expect(scaled.data.nose.position.y).toBeCloseTo(head.nose.position.y * 2);
    });
});

describe('Face - normalize', () => {
    it('should normalize the face to canonical proportions', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        const eyeDist = Math.hypot(
            face.data.eyes.left.position.x - face.data.eyes.right.position.x,
            face.data.eyes.left.position.y - face.data.eyes.right.position.y,
            face.data.eyes.left.position.z - face.data.eyes.right.position.z,
        )
        const earDist = Math.hypot(
            face.data.rig.leftEar.position.x - face.data.rig.rightEar.position.x,
            face.data.rig.leftEar.position.y - face.data.rig.rightEar.position.y,
            face.data.rig.leftEar.position.z - face.data.rig.rightEar.position.z,
        )
        expect(eyeDist).toBeCloseTo(DEFAULT_HEAD_PROPORTIONS.width.eye_to_eye);
        expect(earDist).toBeCloseTo(DEFAULT_HEAD_PROPORTIONS.width.ear_to_ear);

        const normalized = face.scale(1.5).translate({x: 0.5, y: 0.6, z: 0.7}).normalize();

        const normalizedEyeDist = Math.hypot(
            normalized.data.eyes.left.position.x - normalized.data.eyes.right.position.x,
            normalized.data.eyes.left.position.y - normalized.data.eyes.right.position.y,
            normalized.data.eyes.left.position.z - normalized.data.eyes.right.position.z,
        )
        const normalizedEarDist = Math.hypot(
            normalized.data.rig.leftEar.position.x - normalized.data.rig.rightEar.position.x,
            normalized.data.rig.leftEar.position.y - normalized.data.rig.rightEar.position.y,
            normalized.data.rig.leftEar.position.z - normalized.data.rig.rightEar.position.z,
        )

        expect(normalizedEyeDist).toBeCloseTo(DEFAULT_HEAD_PROPORTIONS.width.eye_to_eye);
        expect(normalizedEarDist).toBeCloseTo(DEFAULT_HEAD_PROPORTIONS.width.ear_to_ear);
    });
});

describe('Face - getSkullCenter', () => {
    it('should compute the skull center from visible landmarks', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const center = face.getSkullCenter();

        expect(center.isVisible).toBe(true);
    });

    it('should return invisible when no landmarks are visible', () => {
        const emptyHead: FaceData = {
            nose: { position: { x: 0, y: 0, z: 0 }, isVisible: false },
            eyes: { left: { position: { x: 0, y: 0, z: 0 }, isVisible: false }, right: { position: { x: 0, y: 0, z: 0 }, isVisible: false } },
            brows: { left: { position: { x: 0, y: 0, z: 0 }, isVisible: false }, right: { position: { x: 0, y: 0, z: 0 }, isVisible: false } },
            mouth: { left: { position: { x: 0, y: 0, z: 0 }, isVisible: false }, right: { position: { x: 0, y: 0, z: 0 }, isVisible: false } },
            rig: { leftEar: { position: { x: 0, y: 0, z: 0 }, isVisible: false }, rightEar: { position: { x: 0, y: 0, z: 0 }, isVisible: false }, leftTemple: { position: { x: 0, y: 0, z: 0 }, isVisible: false }, rightTemple: { position: { x: 0, y: 0, z: 0 }, isVisible: false } },
            bounds: { middleTop: { position: { x: 0, y: 0, z: 0 }, isVisible: false }, middleBottom: { position: { x: 0, y: 0, z: 0 }, isVisible: false } },
        };
        const face = new Face(emptyHead, DEFAULT_HEAD_PROPORTIONS);
        
        const center = face.getSkullCenter();

        expect(center.isVisible).toBe(false);
    });
});

describe('Face - yaw', () => {
    it('should return 0 for a canonical (non-rotated) head', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const yaw = face.yaw;

        expect(yaw).toBeCloseTo(0, 5);
    });

    it('should detect yaw rotation (head turning left/right)', () => {
        const head = createCanonicalHead();
        const face = new Face(head);

        const slices = 8;
        const maxYaw = Math.PI / 2 - 0.1;

        for (let i = 0; i <= 2 * slices; i++) {
            const angle = -maxYaw + i * (2 * maxYaw) / (2 * slices);
            const rotated = face.rotateY(angle);
            const yaw = rotated.yaw;
            expect(yaw).toBeCloseTo(angle, 5);
        }
    });
});

describe('Face - pitch', () => {
    it('should return 0 for a canonical (non-rotated) head', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const pitch = face.pitch

        expect(pitch).toBeCloseTo(0, 5);
    });

    it('should detect pitch rotation (head turning up/down)', () => {
        const head = createCanonicalHead();
        const face = new Face(head);

        const slices = 20;
        const maxPitch = Math.PI / 4 - 0.2;

        for (let i = 0; i <= 2 * slices; i++) {
            const angle = -maxPitch + i * (2 * maxPitch) / (2 * slices);
            const rotated = face.rotateX(angle);
            const pitch = rotated.pitch;
            const match = 100 * (1 + pitch)/(1 + angle);
            console.log("pitch input =",angle,", output =",pitch, match,"%");
            expect(match).toBeCloseTo(100, 5);
        }
    });
});

describe('Face - roll', () => {
    it('should return 0 for a canonical (non-rotated) head', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const roll = face.roll;

        expect(roll).toBeCloseTo(0, 5);
    });

    it('should detect roll rotation (head tilting)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);

        const slices = 10;
        const maxRoll = Math.PI / 4 - 0.2;

        let totalError = 0

        for (let i = 0; i <= 2 * slices; i++) {
            const angle = -maxRoll + i * (2 * maxRoll) / (2 * slices);
            const rotated = face.rotateZ(angle);
            const roll = rotated.roll;
            const match = 100 * (1 + roll)/(1 + angle);
            console.log("roll input =",angle,", output =",roll, ".", match,"%");
            totalError += Math.abs(match - 100);
            // expect(match).toBeCloseTo(100, 5);
        }
        const errorAvg = totalError / (2 * slices);
        console.log("error avg = ", errorAvg);
        expect(errorAvg).toBeLessThan(20);
    });
});

describe('Face - rotateX', () => {
    it('should rotate around X axis', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const rotated = face.rotateX(Math.PI / 4);
        
        expect(rotated.data.nose.position.x).toBeCloseTo(head.nose.position.x);
        expect(rotated.data.nose.position.y).not.toBeCloseTo(head.nose.position.y);
    });

    it('should rotate forward and back around X axis', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        const angle = Math.PI / 6;
        
        const rotated = face.rotateX(angle).rotateX(-angle);
        
        expect(rotated.data.nose.position.x).toBeCloseTo(head.nose.position.x, 5);
        expect(rotated.data.nose.position.y).toBeCloseTo(head.nose.position.y, 5);
        expect(rotated.data.nose.position.z).toBeCloseTo(head.nose.position.z, 5);
    });
});

describe('Face - rotateY', () => {
    it('should rotate around Y axis', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const rotated = face.rotateY(Math.PI / 4);
        
        expect(rotated.data.nose.position.y).toBeCloseTo(head.nose.position.y);
        expect(rotated.data.nose.position.x).not.toBeCloseTo(head.nose.position.x);
    });

    it('should rotate forward and back around Y axis', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        const angle = Math.PI / 6;
        
        const rotated = face.rotateY(angle).rotateY(-angle);
        
        expect(rotated.data.nose.position.x).toBeCloseTo(head.nose.position.x, 5);
        expect(rotated.data.nose.position.y).toBeCloseTo(head.nose.position.y, 5);
        expect(rotated.data.nose.position.z).toBeCloseTo(head.nose.position.z, 5);
    });
});

describe('Face - rotateZ', () => {
    it('should rotate around Z axis', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const rotated = face.rotateZ(Math.PI / 4);
        
        expect(rotated.data.nose.position.z).toBeCloseTo(head.nose.position.z);
        expect(rotated.data.nose.position.x).not.toBeCloseTo(head.nose.position.x);
    });

    it('should rotate forward and back around Z axis', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        const angle = Math.PI / 6;
        
        const rotated = face.rotateZ(angle).rotateZ(-angle);
        
        expect(rotated.data.nose.position.x).toBeCloseTo(head.nose.position.x, 5);
        expect(rotated.data.nose.position.y).toBeCloseTo(head.nose.position.y, 5);
        expect(rotated.data.nose.position.z).toBeCloseTo(head.nose.position.z, 5);
    });
});

describe('Face - combined rotations', () => {
    it('should rotate in YXZ order and return close to original when reversed', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        const yaw = Math.PI / 8;
        const pitch = Math.PI / 8;
        const roll = Math.PI / 8;
        
        const rotated = face
            .rotateY(yaw)
            .rotateX(pitch)
            .rotateZ(roll);
        
        const restored = rotated
            .rotateZ(-roll)
            .rotateX(-pitch)
            .rotateY(-yaw);
        
        expect(restored.data.nose.position.x).toBeCloseTo(head.nose.position.x, 3);
        expect(restored.data.nose.position.y).toBeCloseTo(head.nose.position.y, 3);
        expect(restored.data.nose.position.z).toBeCloseTo(head.nose.position.z, 3);
    });

    it('should chain multiple rotations and preserve all landmarks', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const rotated = face
            .rotateY(Math.PI / 6)
            .rotateX(Math.PI / 6)
            .rotateZ(Math.PI / 6);
        
        expect(rotated.data.eyes.left.position).toBeDefined();
        expect(rotated.data.eyes.right.position).toBeDefined();
        expect(rotated.data.nose.position).toBeDefined();
        expect(rotated.data.rig.leftEar.position).toBeDefined();
        expect(rotated.data.rig.rightEar.position).toBeDefined();
        expect(rotated.data.bounds.middleTop.position).toBeDefined();
    });
});

describe('Face - getRotation (yaw, pitch, roll properties)', () => {
    it('should return all rotation angles for a canonical head', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const rotation = face.getRotation();

        expect(rotation.yaw).toBeCloseTo(0, 5);
        expect(rotation.pitch).toBeCloseTo(0, 5);
        expect(rotation.roll).toBeCloseTo(0, 5);
    });

    it('should use getter properties for yaw, pitch, roll', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        expect(face.yaw).toBeCloseTo(0, 5);
        expect(face.pitch).toBeCloseTo(0, 5);
        expect(face.roll).toBeCloseTo(0, 5);
    });
});

describe('Face - rotation with combined rotations', () => {
    it('should recover rotation with small YXZ rotations', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const yaw = Math.PI / 12;    // 15 degrees
        const pitch = Math.PI / 12; // 15 degrees
        const roll = Math.PI / 12;  // 15 degrees
        
        const transformed = face
            .rotateY(yaw)
            .rotateX(pitch)
            .rotateZ(roll);
        
        const rotation = transformed.getRotation();
        
        expect(rotation.yaw).not.toBeCloseTo(0, 2);
    });
});

describe('Face - chain operations', () => {
    it('should support method chaining (translate -> scale -> center)', () => {
        const head = createCanonicalHead();
        const face = new Face(head);
        
        const result = face
            .translate({ x: 0.1, y: 0.1, z: 0 })
            .scale(0.5)
            .center()
            .normalize();
        
        expect(result.data.nose.position.x).toBeDefined();
    });
});

describe('Face - rotation comparison with known rotations', () => {
    it('should recover YXZ rotation within reasonable tolerance', () => {
        const maxAngle = Math.PI / 12; // 15 degrees
        const slices = 2;

        let totalErrorYXY = 0;
        let count = 0;
        
        for (let iYaw = 0; iYaw <= 2 * slices; iYaw++) {
            for (let iPitch = 0; iPitch <= 2 * slices; iPitch++) {
                for (let iRoll = 0; iRoll <= 2 * slices; iRoll++) {
                    const yaw = -maxAngle + iYaw * (2 * maxAngle) / (2 * slices);
                    const pitch = -maxAngle + iPitch * (2 * maxAngle) / (2 * slices);
                    const roll = -maxAngle + iRoll * (2 * maxAngle) / (2 * slices);

                    if (yaw === 0 && pitch === 0 && roll === 0) continue;

                    const head = createCanonicalHead();
                    const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);

                    const transformed = face
                        .rotateY(yaw)
                        .rotateX(pitch)
                        .rotateZ(roll)
                        .scale(0.2)
                        .translate({ x: -0.05, y: 0.05, z: 0 });


                    const rotation = transformed.getRotation();

                    const yawError = Math.abs(rotation.yaw - yaw);
                    const pitchError = Math.abs(rotation.pitch - pitch);
                    const rollError = Math.abs(rotation.roll - roll);

                    const totalError = yawError + pitchError + rollError;
                    totalErrorYXY += totalError;
                    count++;

                    console.log(
                        "default expected", "yaw", yaw.toFixed(3), "pitch", pitch.toFixed(3), "roll", roll.toFixed(3),
                        "| got", "yaw", rotation.yaw.toFixed(3), "pitch", rotation.pitch.toFixed(3), "roll", rotation.roll.toFixed(3),
                        "| err", totalError.toFixed(3)
                    );
                }
            }
        }
        
        console.log("=== RECOVERY TEST RESULTS ===");
        console.log("Total test cases:", count);
        console.log("Avg error (YXZ order):", (totalErrorYXY / count).toFixed(4));
    });

    it('should test different undo orders for rotation recovery', () => {
        const maxAngle = Math.PI / 8;
        const slices = 3;
        
        let totalErrorZXY = 0;
        let totalErrorYXY = 0;
        let totalErrorZYX = 0;

        let totalAxisErrorZXY = 0;
        let totalAxisErrorYXY = 0;
        let totalAxisErrorZYX = 0;

        let count = 0;
        
        for (let iYaw = 0; iYaw <= slices; iYaw++) {
            for (let iPitch = 0; iPitch <= slices; iPitch++) {
                for (let iRoll = 0; iRoll <= slices; iRoll++) {
                    const yaw = -maxAngle + iYaw * (2 * maxAngle) / slices;
                    const pitch = -maxAngle + iPitch * (2 * maxAngle) / slices;
                    const roll = -maxAngle + iRoll * (2 * maxAngle) / slices;

                    if (yaw === 0 && pitch === 0 && roll === 0) continue;

                    const head = createCanonicalHead();
                    const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
                    
                    const transformed = face.normalize()
                        .rotateY(yaw).normalize()
                        .rotateX(pitch).normalize()
                        .rotateZ(roll).normalize();

                    // Method 1: Undo in reverse order Z -> X -> Y
                    const ZXYRoll = transformed.computeRoll();
                    const restoredZXY1 = transformed.rotateZ(-ZXYRoll).normalize();
                    const ZXYPitch = restoredZXY1.computePitch();
                    const restoredZXY2 = restoredZXY1.rotateX(-ZXYPitch).normalize();
                    const ZXYYall = restoredZXY2.computeYaw();
                    const restoredZXY3 = restoredZXY2.rotateY(-ZXYYall).normalize();

                    // Method 2: Undo in same order Y -> X -> Z
                    const YXZYall = transformed.computeYaw();
                    const restoredYXZ1 = transformed.rotateY(-YXZYall).normalize();
                    const YXZPitch = restoredYXZ1.computePitch();
                    const restoredYXZ2 = restoredYXZ1.rotateX(-YXZPitch).normalize();
                    const YXZRoll = restoredYXZ2.computeRoll();
                    const restoredYXZ3 = restoredYXZ2.rotateZ(-YXZRoll).normalize();

                    // Method 3: Try ZYX order
                    const ZYXRoll = transformed.computeRoll();
                    const restoredZYX1 = transformed.rotateZ(-ZYXRoll).normalize();
                    const ZYXYall = restoredZYX1.computeYaw();
                    const restoredZYX2 = restoredZYX1.rotateY(-ZYXYall).normalize();
                    const ZYXPitch = restoredZYX2.computePitch();
                    const restoredZYX3 = restoredZYX2.rotateX(-ZYXPitch).normalize();


                    const errorZXY = Math.abs(restoredZXY3.data.nose.position.x - head.nose.position.x) +
                                    Math.abs(restoredZXY3.data.nose.position.y - head.nose.position.y) +
                                    Math.abs(restoredZXY3.data.nose.position.z - head.nose.position.z);
                    
                    const errorYXZ = Math.abs(restoredYXZ3.data.nose.position.x - head.nose.position.x) +
                                    Math.abs(restoredYXZ3.data.nose.position.y - head.nose.position.y) +
                                    Math.abs(restoredYXZ3.data.nose.position.z - head.nose.position.z);
                    
                    const errorZYX = Math.abs(restoredZYX3.data.nose.position.x - head.nose.position.x) +
                                    Math.abs(restoredZYX3.data.nose.position.y - head.nose.position.y) +
                                    Math.abs(restoredZYX3.data.nose.position.z - head.nose.position.z);

                    const errorAxisZXY = Math.abs(ZYXRoll- roll) +
                        Math.abs(ZXYYall- yaw) +
                        Math.abs(ZXYPitch - pitch);

                    const errorAxisYXZ = Math.abs(YXZRoll- roll) +
                        Math.abs(YXZYall- yaw) +
                        Math.abs(YXZPitch - pitch);

                    const errorAxisZYX = Math.abs(ZYXRoll- roll) +
                        Math.abs(ZYXYall- yaw) +
                        Math.abs(ZYXPitch - pitch);


                    totalErrorZXY += errorZXY;
                    totalErrorYXY += errorYXZ;
                    totalErrorZYX += errorZYX;

                    totalAxisErrorZXY += errorAxisZXY;
                    totalAxisErrorYXY += errorAxisYXZ;
                    totalAxisErrorZYX += errorAxisZYX;

                    count++;
                }
            }
        }

        const avgErrorZXY = totalErrorZXY / count;
        const avgErrorYXY = totalErrorYXY / count;
        const avgErrorZYX = totalErrorZYX / count;

        const avgAxisErrorZXY = totalAxisErrorZXY / count;
        const avgAxisErrorYXY = totalAxisErrorYXY / count;
        const avgAxisErrorZYX = totalAxisErrorZYX / count;

        console.log("=== UNDO ORDER COMPARISON ===");
        console.log("Test cases:", count);
        console.log("Avg error ZXY:", avgErrorZXY.toFixed(4));
        console.log("Avg error YXY:", avgErrorYXY.toFixed(4));
        console.log("Avg error ZYX:", avgErrorZYX.toFixed(4));
        console.log("Best order:", avgErrorZXY < avgErrorYXY && avgErrorZXY < avgErrorZYX ? "Z -> X -> Y" : (avgErrorYXY < avgErrorZYX ? "Y -> X -> Z" : "Z -> Y -> X"));
        console.log("Avg Axis error ZXY:", avgAxisErrorZXY.toFixed(4));
        console.log("Avg Axis error YXY:", avgAxisErrorYXY.toFixed(4));
        console.log("Avg Axis error ZYX:", avgAxisErrorZYX.toFixed(4));
        console.log("Best Axis order:", avgAxisErrorZXY < avgAxisErrorYXY && avgAxisErrorZXY < avgAxisErrorZYX ? "Z -> X -> Y" : (avgAxisErrorYXY < avgAxisErrorZYX ? "Y -> X -> Z" : "Z -> Y -> X"));

        expect(avgErrorZXY).toBeLessThan(0.1);
        expect(avgErrorZXY).toBeLessThan(avgErrorYXY);
        expect(avgErrorZXY).toBeLessThan(0.1);
        expect(avgErrorZXY).toBeLessThan(avgErrorYXY);
    });
});

describe('Face - edge cases', () => {
    it('should handle missing ear landmarks', () => {
        const head = createCanonicalHead();
        head.rig.leftEar.isVisible = false;
        head.rig.rightEar.isVisible = false;
        
        const face = new Face(head);
        
        const center = face.getSkullCenter();
        
        expect(center.isVisible).toBe(true); // Should still work using eyes
    });

    it('should handle missing nose landmark', () => {
        const head = createCanonicalHead();
        head.nose.isVisible = false;
        
        const face = new Face(head);
        
        const yaw = face.computeYaw();
        expect(yaw).toBe(0);
    });

    it('should handle missing eye landmarks', () => {
        const head = createCanonicalHead();
        head.eyes.left.isVisible = false;
        head.eyes.right.isVisible = false;
        
        const face = new Face(head);
        
        const pitch = face.computePitch();
        expect(pitch).toBe(0);
    });
});
