import { describe, it, expect } from 'vitest';
import { MockFaceFactory } from "../../mock/mock_face.mock.ts";
import { FaceFeatures } from "./face_features.ts";
import type { FaceGeometry } from "../../types.ts";

describe('FaceFeatures Logic Validation', () => {
    const factory = new MockFaceFactory();

    /**
     * A diverse list of head states:
     * Centered, Extreme Shifts, Rotations, Scaled, and Complex Combined States
     */
    const faces = [
        factory.createCenterFace(),
        factory.shiftX(null, 0.4),
        factory.shiftX(null, -0.4),
        factory.shiftY(null, 0.3),
        factory.shiftY(null, -0.3),
        factory.rotate(null, 0.2, 0.1),
        factory.rotate(null, -0.2, -0.1),
        factory.scale(null, 2.0),
        factory.scale(null, 0.5),
        // The "Nightmare" state: Shifted, Rotated, and Scaled simultaneously
        factory.shiftX(
            factory.shiftY(
                factory.rotate(
                    factory.scale(null, 1.5),
                0.1, -0.1),
            0.2),
        -0.2)
    ];

    describe('Midpoint & Nudge', () => {
        it.each(faces)('should derive midpoint dynamically from the eyeline', (face: FaceGeometry) => {
            const features = new FaceFeatures(face);

            const expectedMidX = (face.leftEye.x + face.rightEye.x) / 2;
            const expectedMidY = (face.leftEye.y + face.rightEye.y) / 2;

            expect(features.midpoint.x).toBeCloseTo(expectedMidX);
            expect(features.midpoint.y).toBeCloseTo(expectedMidY);
        });

        it.each(faces)('should calculate nudge based on midpoint offset from center (0.5)', (face: FaceGeometry) => {
            const features = new FaceFeatures(face);

            // Our nudge logic: 0.5 - midpoint.x (inverted for parallax)
            const expectedNudgeX = FaceFeatures.SCREEN_CENTER - features.midpoint.x;
            const expectedNudgeY = features.midpoint.y - FaceFeatures.SCREEN_CENTER;

            expect(features.nudge.x).toBeCloseTo(expectedNudgeX);
            expect(features.nudge.y).toBeCloseTo(expectedNudgeY);
        });
    });

    describe('Scale & Depth', () => {
        it.each(faces)('should calculate scale using the hypotenuse of the bounds', (face: FaceGeometry) => {
            const features = new FaceFeatures(face);

            const dx = face.bounds.right.x - face.bounds.left.x;
            const dy = face.bounds.right.y - face.bounds.left.y;
            const expectedScale = Math.hypot(dx, dy);

            expect(features.scale).toBeCloseTo(expectedScale);
        });

        it.each(faces)('should maintain scale ratio symmetry', (face: FaceGeometry) => {
            const factor = 1.25;
            const scaledFace = factory.scale(face, factor);

            const originalFeatures = new FaceFeatures(face);
            const scaledFeatures = new FaceFeatures(scaledFace);

            expect(scaledFeatures.scale / originalFeatures.scale).toBeCloseTo(factor);
        });
    });

    describe('Rotation (Stick)', () => {
        it.each(faces)('should calculate stick yaw as delta between nose and eyeline center', (face: FaceGeometry) => {
            const features = new FaceFeatures(face);

            // Stick Yaw = distance from nose to the vertical center-line of the eyes
            const expectedYaw = face.nose.x - features.midpoint.x;

            expect(features.stick.yaw).toBeCloseTo(expectedYaw);
        });

        it.each(faces)('should calculate stick pitch as vertical delta from eyeline', (face: FaceGeometry) => {
            const features = new FaceFeatures(face);

            // Stick Pitch = distance from nose to the horizontal eyeline
            const expectedPitch = face.nose.y - features.midpoint.y;

            expect(features.stick.pitch).toBeCloseTo(expectedPitch);
        });
    });

    describe('Immutability & Integrity', () => {
        it.each(faces)('should store and return the exact raw geometry provided', (face: FaceGeometry) => {
            const features = new FaceFeatures(face);
            expect(features.face).toBe(face);
        });
    });
});