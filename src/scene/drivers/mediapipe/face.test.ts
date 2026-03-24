import { describe, it, expect } from 'vitest';
import { Face, DEFAULT_HEAD_PROPORTIONS, type FaceData, type HeadProportions } from "./face";
import { merge } from "../../utils/merge.ts";
import { createCanonicalHead } from "../../mock/face.mock.ts";

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
        const translated = face.translate({ x: 0.1, y: 0.2, z: 0.3 });
        expect(translated.data.nose.position.x).not.toBeCloseTo(0, 1);

        const centered = translated.center();

        expect(centered.data.nose.position.x).toBeCloseTo(0, 5);
    });
});

describe('Face - getSkullCenter', () => {
    it('should compute the skull center from visible landmarks', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const center = face.getSkullCenter();

        expect(center.isUsable).toBe(true);
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

    it('should scale non-centered face from origin (skull center moves)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const originalCenter = face.getSkullCenter().position;
        const scaled = face.scale(2);
        const scaledCenter = scaled.getSkullCenter().position;

        // Skull center should NOT be at origin - it should be scaled from origin
        expect(scaledCenter.x).toBeCloseTo(originalCenter.x * 2);
        expect(scaledCenter.y).toBeCloseTo(originalCenter.y * 2);
        expect(scaledCenter.z).toBeCloseTo(originalCenter.z * 2);
    });

    it('should scale centered face around skull center (skull center stays at origin)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS).center();
        
        const scaled = face.scale(2);
        const scaledCenter = scaled.getSkullCenter().position;

        // Skull center should stay at origin
        expect(scaledCenter.x).toBeCloseTo(0);
        expect(scaledCenter.y).toBeCloseTo(0);
        expect(scaledCenter.z).toBeCloseTo(0);
    });
});

describe('Face - normalize', () => {
    it('should normalize the face to canonical proportions', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
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
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const center = face.getSkullCenter();

        expect(center.isUsable).toBe(true);
    });

    it('should return invisible when no landmarks are visible', () => {
        const emptyHead: FaceData = {
            nose: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
            eyes: {
                left: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
                right: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
            },
            brows: {
                left: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
                right: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
            },
            mouth: {
                left: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
                right: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
            },
            rig: {
                leftEar: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
                rightEar: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
                leftTemple: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
                rightTemple: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
            },
            bounds: {
                middleTop: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
                middleBottom: { position: { x: 0, y: 0, z: 0 }, visibility: null, isUsable: false },
            },
        };
        const face = new Face(emptyHead, DEFAULT_HEAD_PROPORTIONS);
        
        const center = face.getSkullCenter();

        expect(center.isUsable).toBe(false);
    });
});

describe('Face - yaw', () => {
    it('should return 0 for a canonical (non-rotated) head', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const yaw = face.yaw;

        expect(yaw).toBeCloseTo(0, 5);
    });

    it('should detect yaw rotation (head turning left/right)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);

        const slices = 8;
        const maxYaw = Math.PI / 2 - 0.1;

        let totalError = 0;
        for (let i = 0; i <= 2 * slices; i++) {
            const angle = -maxYaw + i * (2 * maxYaw) / (2 * slices);
            const rotated = face.rotateY(angle);
            const yaw = rotated.yaw;
            totalError += Math.abs(yaw - angle);
        }
        
        const avgError = totalError / (2 * slices + 1);
        // console.log("Yaw detection avg error:", avgError.toFixed(4));
        expect(avgError).toBeLessThan(0.2);
    });
});

describe('Face - pitch', () => {
    it('should return 0 for a canonical (non-rotated) head', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const pitch = face.pitch

        expect(pitch).toBeCloseTo(0, 5);
    });

    it('should detect pitch rotation (head turning up/down)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);

        const slices = 20;
        const maxPitch = Math.PI / 4 - 0.2;

        for (let i = 0; i <= 2 * slices; i++) {
            const angle = -maxPitch + i * (2 * maxPitch) / (2 * slices);
            const rotated = face.rotateX(angle);
            const pitch = rotated.pitch;
            const match = 100 * (1 + pitch)/(1 + angle);
            // console.log("pitch input =",angle,", output =",pitch, match,"%");
            expect(match).toBeCloseTo(100, 5);
        }
    });
});

describe('Face - roll', () => {
    it('should return 0 for a canonical (non-rotated) head', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
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
            // console.log("roll input =",angle,", output =",roll, ".", match,"%");
            totalError += Math.abs(match - 100);
            // expect(match).toBeCloseTo(100, 5);
        }
        const errorAvg = totalError / (2 * slices);
        // console.log("error avg = ", errorAvg);
        expect(errorAvg).toBeLessThan(20);
    });
});

describe('Face - rotateX', () => {
    it('should rotate forward and back around X axis', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS).center().normalize();
        const angle = Math.PI / 6;
        
        const rotated = face.rotateX(angle).rotateX(-angle);
        
        const diff = Math.abs(rotated.data.nose.position.y - face.data.nose.position.y);
        expect(diff).toBeLessThan(0.01);
    });

    it('should rotate centered face around skull center (skull center stays at origin)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS).center();
        
        const rotated = face.rotateY(Math.PI / 4);
        const rotatedCenter = rotated.getSkullCenter().position;

        expect(rotatedCenter.x).toBeCloseTo(0, 5);
        expect(rotatedCenter.y).toBeCloseTo(0, 5);
        expect(rotatedCenter.z).toBeCloseTo(0, 5);
    });
});

describe('Face - rotateY', () => {
    it('should rotate forward and back around Y axis', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS).center().normalize();
        const angle = Math.PI / 6;
        
        const rotated = face.rotateY(angle).rotateY(-angle);
        
        const diff = Math.abs(rotated.data.nose.position.x - face.data.nose.position.x);
        expect(diff).toBeLessThan(0.3);
    });

    it('should rotate non-centered face around origin (skull center moves)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const originalCenter = face.getSkullCenter().position;
        const rotated = face.rotateY(Math.PI / 4);
        const rotatedCenter = rotated.getSkullCenter().position;

        // Skull center should NOT be at origin - it should rotate around origin
        expect(rotatedCenter.x).not.toBeCloseTo(originalCenter.x, 3);
    });

    it('should rotate centered face around skull center (skull center stays at origin)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS).center();
        
        const rotated = face.rotateY(Math.PI / 4);
        const rotatedCenter = rotated.getSkullCenter().position;

        expect(rotatedCenter.x).toBeCloseTo(0, 5);
        expect(rotatedCenter.y).toBeCloseTo(0, 5);
        expect(rotatedCenter.z).toBeCloseTo(0, 5);
    });
});

describe('Face - rotateZ', () => {
    it('should rotate forward and back around Z axis', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS).center().normalize();
        const angle = Math.PI / 6;
        
        const rotated = face.rotateZ(angle).rotateZ(-angle);
        
        const diff = Math.abs(rotated.data.nose.position.x - face.data.nose.position.x);
        expect(diff).toBeLessThan(0.3);
    });

    it('should rotate non-centered face around origin (skull center moves)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const originalCenter = face.getSkullCenter().position;
        const rotated = face.rotateZ(Math.PI / 4);
        const rotatedCenter = rotated.getSkullCenter().position;

        // Skull center should NOT be at origin - it should rotate around origin
        expect(rotatedCenter.x).not.toBeCloseTo(originalCenter.x, 3);
    });

    it('should rotate centered face around skull center (skull center stays at origin)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS).center();
        
        const rotated = face.rotateZ(Math.PI / 4);
        const rotatedCenter = rotated.getSkullCenter().position;

        expect(rotatedCenter.x).toBeCloseTo(0, 5);
        expect(rotatedCenter.y).toBeCloseTo(0, 5);
        expect(rotatedCenter.z).toBeCloseTo(0, 5);
    });
});

describe('Face - combined rotations', () => {
    it('should rotate in YXZ order and return close to original when reversed', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS).center().normalize();
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
        
        const totalDiff = 
            Math.abs(restored.data.nose.position.x - face.data.nose.position.x) +
            Math.abs(restored.data.nose.position.y - face.data.nose.position.y) +
            Math.abs(restored.data.nose.position.z - face.data.nose.position.z);
        expect(totalDiff).toBeLessThan(0.5);
    });

    it('should chain multiple rotations and preserve all landmarks', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
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
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const rotation = face.getRotation();

        expect(rotation.rotation.yaw).toBeCloseTo(0, 5);
        expect(rotation.rotation.pitch).toBeCloseTo(0, 5);
        expect(rotation.rotation.roll).toBeCloseTo(0, 5);
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
        
        expect(rotation.rotation.yaw).not.toBeCloseTo(0, 2);
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

    it('should test all 6 rotation computation orders for angle recovery', () => {
        const maxAngle = Math.PI / 8;
        const slices = 3;
        
        const strategies = [
            { 
                name: "Z->X->Y", 
                fn: (f: Face) => { 
                    const roll = f.computeRoll();
                    const t1 = f.rotateZ(-roll).normalize(); 
                    const pitch = t1.computePitch(); 
                    const t2 = t1.rotateX(-pitch).normalize(); 
                    const yaw = t2.computeYaw(); 
                    return { yaw, pitch, roll }; 
                }
            },
            { 
                name: "Y->X->Z", 
                fn: (f: Face) => { 
                    const yaw = f.computeYaw(); 
                    const t1 = f.rotateY(-yaw).normalize(); 
                    const pitch = t1.computePitch(); 
                    const t2 = t1.rotateX(-pitch).normalize(); 
                    const roll = t2.computeRoll();
                    return { yaw, pitch, roll }; 
                }
            },
            { 
                name: "Z->Y->X", 
                fn: (f: Face) => { 
                    const roll = f.computeRoll();
                    const t1 = f.rotateZ(-roll).normalize(); 
                    const yaw = t1.computeYaw(); 
                    const t2 = t1.rotateY(-yaw).normalize(); 
                    const pitch = t2.computePitch(); 
                    return { yaw, pitch, roll }; 
                }
            },
            { 
                name: "X->Y->Z", 
                fn: (f: Face) => { 
                    const pitch = f.computePitch(); 
                    const t1 = f.rotateX(-pitch).normalize(); 
                    const yaw = t1.computeYaw(); 
                    const t2 = t1.rotateY(-yaw).normalize(); 
                    const roll = t2.roll; 
                    return { yaw, pitch, roll }; 
                }
            },
            { 
                name: "X->Z->Y", 
                fn: (f: Face) => { 
                    const pitch = f.computePitch(); 
                    const t1 = f.rotateX(-pitch).normalize(); 
                    const roll = t1.computeRoll();
                    const t2 = t1.rotateZ(-roll).normalize(); 
                    const yaw = t2.computeYaw(); 
                    return { yaw, pitch, roll }; 
                }
            },
            { 
                name: "Y->Z->X", 
                fn: (f: Face) => { 
                    const yaw = f.computeYaw(); 
                    const t1 = f.rotateY(-yaw).normalize(); 
                    const roll = t1.computeRoll();
                    const t2 = t1.rotateZ(-roll).normalize(); 
                    const pitch = t2.computePitch(); 
                    return { yaw, pitch, roll }; 
                }
            },
        ];
        
        const totals = new Array(strategies.length).fill(0);
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
                    
                    const transformed = face.normalize()
                        .rotateY(yaw).normalize()
                        .rotateX(pitch).normalize()
                        .rotateZ(roll).normalize()
                        .scale(0.2)
                        .translate({ x: -0.05, y: 0.05, z: 0 });

                    for (let i = 0; i < strategies.length; i++) {
                        const computed = strategies[i].fn(transformed);
                        const error = Math.abs(computed.yaw - yaw) +
                                     Math.abs(computed.pitch - pitch) +
                                     Math.abs(computed.roll - roll);
                        totals[i] += error;
                    }
                    count++;
                }
            }
        }
        
        // console.log("=== 6 ROTATION STRATEGIES COMPARISON ===");
        // console.log("Test cases:", count);
        
        const results = strategies.map((s, i) => ({ name: s.name, avg: totals[i] / count }));
        results.sort((a, b) => a.avg - b.avg);
        
        // for (const r of results) {
        //     console.log(`Avg angle error ${r.name}: ${r.avg.toFixed(4)}`);
        // }
        
        // console.log("Best strategy:", results[0].name);
        
        expect(results[0].avg).toBeLessThan(0.5);
    });
});

	describe('Face - edge cases', () => {
	    it('should handle missing ear landmarks', () => {
	        const head = merge(createCanonicalHead(), {
	            rig: {
	                leftEar: { isUsable: false },
	                rightEar: { isUsable: false },
	            },
	        });
	        
	        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
	        
	        const center = face.getSkullCenter();
        
        expect(center.isUsable).toBe(true); // Should still work using eyes
    });

	    it('should handle missing nose landmark', () => {
	        const head = merge(createCanonicalHead(), {
	            nose: { isUsable: false },
	        });
	        
	        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
	        
	        const yaw = face.computeYaw();
        expect(yaw).toBe(0);
    });

	    it('should handle missing eye landmarks', () => {
	        const head = merge(createCanonicalHead(), {
	            eyes: {
	                left: { isUsable: false },
	                right: { isUsable: false },
	            },
	        });
	        
	        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
	        
	        const pitch = face.computePitch();
        expect(pitch).toBe(0);
    });

	    it('should handle invisible skull center in center()', () => {
	        const head = merge(createCanonicalHead(), {
	            rig: {
	                leftEar: { isUsable: false },
	                rightEar: { isUsable: false },
	                leftTemple: { isUsable: false },
	                rightTemple: { isUsable: false },
	            },
	            eyes: {
	                left: { isUsable: false },
	                right: { isUsable: false },
	            },
	        });
	        
	        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
	        const centered = face.center();
        
        expect(centered).toBeDefined();
        // When center can't be resolved, center() falls back to translating by (0.5,0.5,0.5)
        // and marks the face as centered.
        expect(centered.data.nose.position.x).toBeCloseTo(head.nose.position.x - 0.5);
    });

    it('should use cached faceWidth', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const width1 = face.width;
        const width2 = face.width;
        
        expect(width1).toBe(width2);
    });

    it('should calculate width from ears when visible', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const width = face.width;
        
        expect(width).toBeGreaterThan(0);
    });

	    it('should calculate width from eyes when ears not visible', () => {
	        const head = merge(createCanonicalHead(), {
	            rig: {
	                leftEar: { isUsable: false },
	                rightEar: { isUsable: false },
	            },
	        });
	        
	        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
	        
	        const width = face.width;
        
        expect(width).toBeGreaterThan(0);
    });

	    it('should use default eye_to_eye when neither ears nor eyes visible', () => {
	        const head = merge(createCanonicalHead(), {
	            rig: {
	                leftEar: { isUsable: false },
	                rightEar: { isUsable: false },
	            },
	            eyes: {
	                left: { isUsable: false },
	                right: { isUsable: false },
	            },
	        });
	        
	        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
	        
	        const width = face.width;
        
        expect(width).toBe(DEFAULT_HEAD_PROPORTIONS.width.eye_to_eye);
    });

    it('should return rebase (normalized face)', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const rebased = face.rebase;
        
        expect(rebased).toBeDefined();
    });

    it('should cache rebase result', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
        
        const rebase1 = face.rebase;
        const rebase2 = face.rebase;
        
        expect(rebase1).toBe(rebase2);
    });

	    it('normalize should not produce Infinity when width collapses to ~0', () => {
	        // Collapse ear-to-ear width to 0 (can happen with bad upstream frames)
	        const head = merge(createCanonicalHead(), {
	            rig: {
	                leftEar: { position: { x: 0.5, y: 0.5, z: 0 } },
	                rightEar: { position: { x: 0.5, y: 0.5, z: 0 } },
	            },
	        });

	        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);
	        const normalized = face.normalize();

        expect(Number.isFinite(normalized.data.nose.position.x)).toBe(true);
        expect(Number.isFinite(normalized.data.nose.position.y)).toBe(true);
        expect(Number.isFinite(normalized.data.nose.position.z)).toBe(true);
    });

    it('scale ignores non-finite factors', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);

        expect(face.scale(Number.POSITIVE_INFINITY)).toBe(face);
        expect(face.scale(Number.NaN)).toBe(face);
    });
});

describe('Face - getters', () => {
    it('should expose landmark positions via getters', () => {
        const head = createCanonicalHead();
        const face = new Face(head, DEFAULT_HEAD_PROPORTIONS);

        expect(face.nose).toEqual(head.nose.position);
        expect(face.leftEye).toEqual(head.eyes.left.position);
        expect(face.rightEye).toEqual(head.eyes.right.position);
        expect(face.leftBrow).toEqual(head.brows.left.position);
        expect(face.rightBrow).toEqual(head.brows.right.position);
        expect(face.leftEar).toEqual(head.rig.leftEar.position);
        expect(face.rightEar).toEqual(head.rig.rightEar.position);
        expect(face.middleTop).toEqual(head.bounds.middleTop.position);
        expect(face.middleBottom).toEqual(head.bounds.middleBottom.position);
    });

    it('computeYaw should handle NaN singularity by snapping to +/- π/2', () => {
        // Force depthToWidthRatio to become NaN (0/0) and currentEyeWidth to become 0,
        // so atan2(..., NaN) produces NaN and triggers the singularity handler.
        const H: HeadProportions = {
            ...DEFAULT_HEAD_PROPORTIONS,
            width: {
                ...DEFAULT_HEAD_PROPORTIONS.width,
                eye_to_eye: 0,
            },
            depth: {
                ...DEFAULT_HEAD_PROPORTIONS.depth,
                eye_plane: DEFAULT_HEAD_PROPORTIONS.depth.nose_tip,
            },
        };

        const head = createCanonicalHead(H);
        const face = new Face(head, H);
        expect(face.computeYaw()).toBeCloseTo(Math.PI / 2);
    });
});
