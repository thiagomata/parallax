import { describe, it, expect, vi, beforeEach } from 'vitest';
import type p5 from "p5";
import { FaceFeatures } from "../drivers/mediapipe/face_features";
import type {FaceGeometry, FaceProvider} from "../types.ts";
import {CameraModifier} from "./camera_modifier.ts";
import {MockFaceFactory} from "../mock/mock_face.mock.ts";
import {createMockP5} from "../mock/mock_p5.mock.ts";

describe('CameraModifier', () => {
    let mockP5: any;
    let mockProvider: FaceProvider;
    let factory: MockFaceFactory;
    let modifier: CameraModifier;

    // Test Config
    const config = {
        smoothing: 0.5, // Simple 50/50 lerp for predictable math
        travelRange: 100,
        zTravelRange: 200,
        damping: 1.0,
        lookDistance: 1000
    };

    const factoryFaces = new MockFaceFactory();
    const testFaces = [
        factoryFaces.createCenterFace(),
        factoryFaces.shiftX(null, 0.2),
        factoryFaces.scale(null, 1.5),
        factoryFaces.rotate(null, 0.1, -0.1)
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        factory = new MockFaceFactory();
        mockP5 = createMockP5();

        // Ensure p5.lerp works as expected in the mock
        mockP5.lerp = vi.fn((start, end, amt) => start + (end - start) * amt);

        mockProvider = {
            init: vi.fn().mockResolvedValue(undefined),
            getFace: vi.fn(),
            getStatus: vi.fn().mockReturnValue('READY'),
        };

        modifier = new CameraModifier(mockP5 as unknown as p5, mockProvider, config);
    });

    describe('Calibration Phase', () => {
        it.each(testFaces)('should establish neutralHeadSize on the very first frame', (face: FaceGeometry) => {
            (mockProvider.getFace as any).mockReturnValue(face);

            modifier.tick(1);

            const expectedScale = new FaceFeatures(face).scale;
            expect((modifier as any).neutralHeadSize).toBeCloseTo(expectedScale);
        });
    });

    describe('Smoothing & Cache Logic', () => {
        it('should linearly interpolate towards a target face over multiple ticks', () => {
            const startFace = factory.createCenterFace(); // Nudge X = 0
            const targetFace = factory.shiftX(startFace, 0.2); // Shifted right, Midpoint X = 0.7, Nudge X = -0.2

            // Frame 1: Instant snap to startFace
            (mockProvider.getFace as any).mockReturnValue(startFace);
            modifier.tick(1);

            const failableNudge1 = modifier.getNudge();
            expect(failableNudge1.success);
            if (!failableNudge1.success) return;

            const nudge1 = (failableNudge1.value as any).x;
            expect(nudge1).toBe(0);

            // Frame 2: Move to targetFace with 0.5 smoothing
            // Target nudge: -0.2 * (100 * 2) = -40
            // Lerp(0, -40, 0.5) = -20
            (mockProvider.getFace as any).mockReturnValue(targetFace);
            modifier.tick(2);

            const failableNudge2 = modifier.getNudge();
            expect(failableNudge2.success);
            if (!failableNudge2.success) return;

            const nudge2 = (failableNudge2.value as any).x;
            expect(nudge2).toBeCloseTo(-20);
        });

        it('should correctly calculate Z-Nudge relative to calibrated neutral size', () => {
            const neutralFace = factory.createCenterFace(); // scale 0.2
            const closerFace = factory.scale(neutralFace, 2.0); // scale 0.4

            // Calibrate
            (mockProvider.getFace as any).mockReturnValue(neutralFace);
            modifier.tick(1);

            // Move closer
            // Z Nudge = -(currentScale - neutralScale) * zTravelRange
            // Z Nudge = -(0.4 - 0.2) * 200 = -40
            // Because of smoothing (0.5), Frame 2 result = -20
            (mockProvider.getFace as any).mockReturnValue(closerFace);
            modifier.tick(2);

            const failableNudge = modifier.getNudge();
            expect(failableNudge.success);
            if (!failableNudge.success) return;

            const nudgeZ = (failableNudge.value as any).z;
            expect(nudgeZ).toBeCloseTo(-20);
        });
    });

    describe('Presence & Lost Tracking', () => {
        it('should drift back to neutral (0,0,0) when the face is lost', () => {
            // Setup: Position at X nudge -40
            const shifted = factory.shiftX(null, 0.2);
            (mockProvider.getFace as any).mockReturnValue(shifted);
            modifier.tick(1);

            // Lose tracking
            (mockProvider.getFace as any).mockReturnValue(null);
            modifier.tick(2);

            const failableNudge = modifier.getNudge();
            expect(failableNudge.success);
            if (!failableNudge.success) return;

            const nudge = failableNudge.value as any;
            // Should be moving back towards 0
            expect(Math.abs(nudge.x)).toBeLessThan(40);
            expect(Math.abs(nudge.x)).toBeGreaterThan(0);
        });

        it('should hard-reset calibration after the 90 frame threshold', () => {
            (mockProvider.getFace as any).mockReturnValue(factory.createCenterFace());
            modifier.tick(1);
            expect((modifier as any).neutralHeadSize).not.toBeNull();

            // Simulate 91 frames of null
            (mockProvider.getFace as any).mockReturnValue(null);
            for (let i = 2; i <= 92; i++) {
                modifier.tick(i);
            }

            expect((modifier as any).neutralHeadSize).toBeNull();
            expect(modifier.getNudge().success).toBe(false);
        });
    });
});