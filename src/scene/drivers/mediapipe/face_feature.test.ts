import { describe, it, expect } from 'vitest';
import {MockFaceFactory} from "../../mock/mock_face.mock.ts";
import {FaceFeatures} from "./face_features.ts";
import type {FaceGeometry} from "../../types.ts";

describe('FaceFeatures Logic Validation', () => {
    const factory = new MockFaceFactory();

    describe('Midpoint & Nudge', () => {
        it('should derive midpoint dynamically from the eyeline', () => {
            const face = factory.createCenterFace();
            const features = new FaceFeatures(face);

            // Calculation based on input data instead of hardcoded 0.5
            const expectedMidX = (face.leftEye.x + face.rightEye.x) / 2;
            const expectedMidY = (face.leftEye.y + face.rightEye.y) / 2;

            expect(features.midpoint.x).toBeCloseTo(expectedMidX);
            expect(features.midpoint.y).toBeCloseTo(expectedMidY);
        });

        it('should calculate nudge based on midpoint offset from engine center (0.5)', () => {
            const shift = -0.15;
            const face = factory.shiftX(null, shift);
            const features = new FaceFeatures(face);

            // Our nudge logic: 0.5 - midpoint.x
            const expectedNudgeX = 0.5 - features.midpoint.x;
            const expectedNudgeY = features.midpoint.y - 0.5;

            expect(features.nudge.x).toBeCloseTo(expectedNudgeX);
            expect(features.nudge.y).toBeCloseTo(expectedNudgeY);
        });
    });

    describe('Scale & Depth', () => {
        it('should calculate scale using the hypotenuse of the bounds', () => {
            const scaleFactor = 1.8;
            const face = factory.scale(null, scaleFactor);
            const features = new FaceFeatures(face);

            // Derive expected scale from the transformed bounds
            const dx = face.bounds.right.x - face.bounds.left.x;
            const dy = face.bounds.right.y - face.bounds.left.y;
            const expectedScale = Math.hypot(dx, dy);

            expect(features.scale).toBeCloseTo(expectedScale);
        });

        it('should maintain a consistent scale ratio when resized', () => {
            const factor = 0.5;
            const faceA = factory.createCenterFace();
            const faceB = factory.scale(faceA, factor);

            const featA = new FaceFeatures(faceA);
            const featB = new FaceFeatures(faceB);

            expect(featB.scale / featA.scale).toBeCloseTo(factor);
        });
    });

    describe('Rotation (Stick)', () => {
        it('should calculate stick yaw as the delta between nose and eyeline center', () => {
            const yawShift = 0.08;
            const face = factory.rotate(null, yawShift, 0);
            const features = new FaceFeatures(face);

            const expectedYaw = face.nose.x - features.midpoint.x;

            expect(features.stick.yaw).toBeCloseTo(expectedYaw);
        });

        it('should calculate stick pitch as the vertical delta from eyeline', () => {
            const pitchShift = -0.1;
            const face = factory.rotate(null, 0, pitchShift);
            const features = new FaceFeatures(face);

            const expectedPitch = face.nose.y - features.midpoint.y;

            expect(features.stick.pitch).toBeCloseTo(expectedPitch);
        });
    });

    describe('Immutability & Integrity', () => {
        it('should store the raw face geometry for reference', () => {
            const face: FaceGeometry = factory.createCenterFace();
            const features: FaceFeatures = new FaceFeatures(face);

            expect(features.face).toBe(face);
            expect(Object.isFrozen(features)).toBe(false);
        });
    });
});