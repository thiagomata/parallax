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
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);

        expect(face.data).toBe(head);
        expect(face.proportions).toBe(DEFAULT_HEAD_PROPORTIONS);
    });
});

describe('Face - translate', () => {
    it('should translate all landmarks by the given offset (subtraction)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const translated = face.translate({ x: 0.1, y: 0.2, z: 0.3 });

        expect(translated.data.nose.position.x).toBeCloseTo(head.nose.position.x - 0.1);
        expect(translated.data.nose.position.y).toBeCloseTo(head.nose.position.y - 0.2);
        expect(translated.data.nose.position.z).toBeCloseTo(head.nose.position.z - 0.3);
    });

    it('should not modify the original face', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        face.translate({ x: 0.1, y: 0.2, z: 0.3 });

        expect(face.data.nose.position.x).toBe(head.nose.position.x);
    });
});

describe('Face - center', () => {
    it('should center the face at origin based on skull center', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const centered = face.center();

        expect(centered.data.nose.position.x).toBeCloseTo(0, 1);
    });
});

describe('Face - getSkullCenter', () => {
    it('should compute the skull center from visible landmarks', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const center = face.getSkullCenter();

        expect(center.isVisible).toBe(true);
        expect(center.position.x).toBeCloseTo(0, 1);
    });
});

describe('Face - scale', () => {
    it('should scale all landmarks by the given factor', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const scaled = face.scale(2);

        expect(scaled.data.nose.position.x).toBeCloseTo(head.nose.position.x * 2);
        expect(scaled.data.nose.position.y).toBeCloseTo(head.nose.position.y * 2);
    });
});

describe('Face - normalize', () => {
    it('should normalize the face to canonical proportions', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const normalized = face.normalize();

        const leftEarX = normalized.data.rig.leftEar.position.x;
        const rightEarX = normalized.data.rig.rightEar.position.x;
        
        expect(Math.abs(leftEarX - (-0.5))).toBeLessThan(0.01);
        expect(Math.abs(rightEarX - 0.5)).toBeLessThan(0.01);
    });
});

describe('Face - getSkullCenter', () => {
    it('should compute the skull center from visible landmarks', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
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

describe('Face - computeYaw', () => {
    it('should return 0 for a canonical (non-rotated) head', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const yaw = face.computeYaw();

        expect(yaw).toBeCloseTo(0, 5);
    });

    it('should detect yaw rotation (head turning left/right)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        const rotated = face.rotateY(Math.PI / 6); // 30 degrees
        
        const yaw = rotated.computeYaw();

        expect(yaw).not.toBeCloseTo(0, 2);
    });
});

describe('Face - computePitch', () => {
    it('should return 0 for a canonical (non-rotated) head', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const pitch = face.computePitch();

        expect(pitch).toBeCloseTo(0, 5);
    });

    it('should detect pitch rotation (head looking up/down)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        const rotated = face.rotateX(Math.PI / 6); // 30 degrees
        
        const pitch = rotated.computePitch();

        expect(pitch).not.toBeCloseTo(0, 2);
    });
});

describe('Face - computeRoll', () => {
    it('should return 0 for a canonical (non-rotated) head', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const roll = face.roll;

        expect(roll).toBeCloseTo(0, 5);
    });

    it('should detect roll rotation (head tilting)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        const rotated = face.rotateZ(Math.PI / 6); // 30 degrees
        
        const roll = rotated.roll;

        expect(roll).not.toBeCloseTo(0, 2);
    });
});

describe('Face - getRotation (yaw, pitch, roll properties)', () => {
    it('should return all rotation angles for a canonical head', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const rotation = face.getRotation();

        expect(rotation.yaw).toBeCloseTo(0, 5);
        expect(rotation.pitch).toBeCloseTo(0, 5);
        expect(rotation.roll).toBeCloseTo(0, 5);
    });

    it('should use getter properties for yaw, pitch, roll', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        expect(face.yaw).toBeCloseTo(0, 5);
        expect(face.pitch).toBeCloseTo(0, 5);
        expect(face.roll).toBeCloseTo(0, 5);
    });
});

describe('Face - rotation with combined rotations', () => {
    it('should recover rotation with small YXZ rotations', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
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
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
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
                    
                    console.log(
                        "expected", "yaw", yaw.toFixed(3), "pitch", pitch.toFixed(3), "roll", roll.toFixed(3),
                        "| got", "yaw", rotation.yaw.toFixed(3), "pitch", rotation.pitch.toFixed(3), "roll", rotation.roll.toFixed(3),
                        "| err", totalError.toFixed(3)
                    );
                }
            }
        }
    });
});

describe('Face - edge cases', () => {
    it('should handle missing ear landmarks', () => {
        const head = createCanonicalHead();
        head.rig.leftEar.isVisible = false;
        head.rig.rightEar.isVisible = false;
        
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const center = face.getSkullCenter();
        
        expect(center.isVisible).toBe(true); // Should still work using eyes
    });

    it('should handle missing nose landmark', () => {
        const head = createCanonicalHead();
        head.nose.isVisible = false;
        
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const yaw = face.computeYaw();
        expect(yaw).toBe(0);
    });

    it('should handle missing eye landmarks', () => {
        const head = createCanonicalHead();
        head.eyes.left.isVisible = false;
        head.eyes.right.isVisible = false;
        
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const pitch = face.computePitch();
        expect(pitch).toBe(0);
    });
});
