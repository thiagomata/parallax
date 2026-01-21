import {describe, expect, it} from 'vitest';
import {FaceParser} from "./face_parser.ts";

describe('FaceParser', () => {

    // Helper to create a fake MediaPipe landmark array
    const createMockLandmarks = (seed: number = 1000) => {
        // MediaPipe usually provides 478 points
        return Array.from({length: 478}, (_, i) => ({
            x: i / seed,
            y: i / seed,
            z: i / seed
        }));
    };

    it.each([
        { raw: createMockLandmarks(1000) },
        { raw: createMockLandmarks(2000) },
        { raw: createMockLandmarks(3000) },
        { raw: createMockLandmarks(4000) },
    ])(
        'should correctly map MediaPipe indices to semantic names',
        ({ raw }) => {
            const result = FaceParser.parse(raw);

            expect(result.nose.x).toBe(raw[1].x);
            expect(result.leftEye.x).toBe(raw[468].x);
            expect(result.rightEye.x).toBe(raw[473].x);

            expect(result.bounds.top.x).toBe(raw[10].x);
            expect(result.bounds.bottom.x).toBe(raw[152].x);
            expect(result.bounds.left.x).toBe(raw[234].x);
            expect(result.bounds.right.x).toBe(raw[454].x);
        }
    );

    it('should throw an error if the landmark array is too small', () => {
        const incompleteData = Array(10).fill({ x: 0, y: 0, z: 0 });

        expect(() => FaceParser.parse(incompleteData)).toThrow(
            "Invalid landmark data: expected at least 478 points."
        );
    });

    it('should throw an error if data is null or undefined', () => {
        expect(() => FaceParser.parse(null as any)).toThrow();
        expect(() => FaceParser.parse(undefined as any)).toThrow();
    });

    it('should preserve the z-axis for depth calculations', () => {
        const raw = createMockLandmarks();
        const result = FaceParser.parse(raw);

        // If index 1 has z: 0.001, the nose geometry should have it too
        expect(result.nose.z).toBe(raw[1].z);
    });
});