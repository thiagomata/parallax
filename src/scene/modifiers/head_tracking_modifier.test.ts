import { describe, it, expect, vi, beforeEach, type Mocked } from 'vitest';
import type p5 from "p5";
import { FaceFeatures } from "../drivers/mediapipe/face_features";
import type { FaceProvider } from "../types.ts";
import { MockFaceFactory } from "../mock/mock_face.mock.ts";
import { createMockP5 } from "../mock/mock_p5.mock.ts";
import {HeadTrackingModifier} from "./head_tracking_modifier.ts";

describe('CameraModifier', () => {
    let mockP5;
    let mockProvider: Mocked<FaceProvider>;
    let factory: MockFaceFactory;
    let modifier: HeadTrackingModifier;

    const config = {
        smoothing: 0.5,
        travelRange: 100,
        zTravelRange: 500,
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

        mockP5.lerp.mockImplementation((start, end, amt) => start + (end - start) * amt);

        mockProvider = {
            init: vi.fn().mockResolvedValue(undefined),
            getFace: vi.fn(),
            getStatus: vi.fn().mockReturnValue('READY'),
        } as Mocked<FaceProvider>;
        modifier = new HeadTrackingModifier(mockP5 as unknown as p5, mockProvider, config);
    });

    describe('1. Initialization & Registration', () => {
        it('should report the correct tracking status', async () => {
            let face = factoryFaces.createCenterFace();
            let tick = 0
            let getStatusCounter = 0;

            // created as idle
            expect(modifier.getStatus()).toBe('IDLE');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);

            // keep as idle
            mockProvider.getStatus.mockReturnValue('IDLE');
            await modifier.init();
            expect(modifier.getStatus()).toBe('IDLE');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);
            modifier.tick(tick++);
            expect(modifier.getStatus()).toBe('IDLE');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);

            // change to initializing with the provider
            mockProvider.getStatus.mockReturnValue('INITIALIZING');
            modifier.tick(tick++);
            expect(modifier.getStatus()).toBe('INITIALIZING');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);

            // keep ready as provider keep ready and returning faces
            mockProvider.getStatus.mockReturnValue('READY');
            (mockProvider.getFace as any).mockReturnValue(face);
            modifier.tick(tick++);
            expect(modifier.getStatus()).toBe('READY');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);

            // keep drifting until the threshold
            for (let failures= 0; failures < modifier.RESET_HEAD_THRESHOLD; failures++ ) {
                (mockProvider.getFace as any).mockReturnValue(null);
                modifier.tick(tick++);
                expect(modifier.getStatus()).toBe('DRIFTING');
                expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);
            }

            // change to DISCONNECTED after threshold
            (mockProvider.getFace as any).mockReturnValue(null);
            modifier.tick(tick++);
            expect(modifier.getStatus()).toBe('DISCONNECTED');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);

            // recover to ready as provider keep ready and returning faces
            (mockProvider.getFace as any).mockReturnValue(face);
            modifier.tick(tick++);
            expect(modifier.getStatus()).toBe('READY');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);

            // change to disconnected when provider change to error
            mockProvider.getStatus.mockReturnValue('DISCONNECTED');
            modifier.tick(tick++);
            expect(modifier.getStatus()).toBe('DISCONNECTED');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);

            // change to error when provider change to error
            mockProvider.getStatus.mockReturnValue('ERROR');
            modifier.tick(tick++);
            expect(modifier.getStatus()).toBe('ERROR');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);

            // recovers
            mockProvider.getStatus.mockReturnValue('READY');
            (mockProvider.getFace as any).mockReturnValue(face);
            modifier.tick(tick++);
            expect(modifier.getStatus()).toBe('READY');
            expect(mockProvider.getStatus).toBeCalledTimes(getStatusCounter++);
        });

        it('should initialize the hardware provider during the hydration phase', async () => {
            await modifier.init();
            expect(mockProvider.init).toHaveBeenCalled();
        });
    });

    describe('2. Calibration', () => {
        it.each(testFaces)('should establish a unique neutral scale on the first frame seen', (face) => {
            (mockProvider.getFace as any).mockReturnValue(face);
            modifier.tick(1);

            const expectedScale = new FaceFeatures(face).scale;
            expect((modifier as any).neutralHeadSize).toBeCloseTo(expectedScale);
        });
    });

    describe('3. Active Tracking & Semantic Smoothing', () => {
        it.each(testFaces)('should interpolate Nudge X towards the target using config smoothing', (targetFace) => {
            const startFace = factory.createCenterFace();
            const startFeatures = new FaceFeatures(startFace);
            const targetFeatures = new FaceFeatures(targetFace);

            (mockProvider.getFace as any).mockReturnValue(startFace);
            modifier.tick(1); // Baseline

            (mockProvider.getFace as any).mockReturnValue(targetFace);
            modifier.tick(2); // Smoothed step

            const result = modifier.getNudge();
            if (result.success) {
                const startX = startFeatures.nudge.x * (config.travelRange * 2);
                const targetX = targetFeatures.nudge.x * (config.travelRange * 2);
                const expectedX = startX + (targetX - startX) * config.smoothing;
                expect(result.value.x).toBeCloseTo(expectedX);
            }
        });

        it.each(testFaces)('should derive Z-Nudge relative to the specific calibrated head size', (calibrationFace) => {
            const neutralScale = new FaceFeatures(calibrationFace).scale;
            const movementFace = factory.scale(calibrationFace, 1.5);
            const movementScale = new FaceFeatures(movementFace).scale;

            (mockProvider.getFace as any).mockReturnValue(calibrationFace);
            modifier.tick(1);

            (mockProvider.getFace as any).mockReturnValue(movementFace);
            modifier.tick(2);

            const result = modifier.getNudge();
            if (result.success) {
                const targetZ = -(movementScale - neutralScale) * config.zTravelRange;
                const expectedZ = targetZ * config.smoothing;
                expect(result.value.z).toBeCloseTo(expectedZ);
            }
        });
    });

    describe('4. Data Mapping (The Graphics Bundle)', () => {
        it.each(testFaces)('should transform raw geometry into engine-ready results', (face) => {
            const features = new FaceFeatures(face);
            (mockProvider.getFace as any).mockReturnValue(face);
            modifier.tick(1);

            const car = modifier.getCarPosition();
            const stick = modifier.getStick();

            expect(car.success && stick.success).toBe(true);
            if (car.success && stick.success) {
                expect(car.value.position).toEqual(features.midpoint);
                expect(stick.value.yaw).toBeCloseTo(features.stick.yaw * config.damping);
                expect(stick.value.distance).toBe(config.lookDistance);
                expect(stick.value.priority).toBe(modifier.priority);
            }
        });
    });

    describe('5. Resilience & Graceful Degradation', () => {
        it('should drift back toward neutral (0,0,0) when the face is temporarily lost', () => {
            const face = factory.shiftX(null, 0.2);
            const startX = new FaceFeatures(face).nudge.x * (config.travelRange * 2);

            (mockProvider.getFace as any).mockReturnValue(face);
            modifier.tick(1);

            (mockProvider.getFace as any).mockReturnValue(null);
            modifier.tick(2);

            const result = modifier.getNudge();
            if (result.success) {
                const expectedX = startX + (0 - startX) * config.smoothing;
                expect(result.value.x).toBeCloseTo(expectedX);
            }
        });

        it.each(testFaces)('should clear cache and neutral calibration after the 90-frame threshold', (face) => {
            const threshold = modifier.RESET_HEAD_THRESHOLD;
            (mockProvider.getFace).mockReturnValue(face);
            modifier.tick(0);

            (mockProvider.getFace).mockReturnValue(null);
            for (let i = 1; i <= threshold + 1; i++) modifier.tick(i);

            expect(modifier.getCarPosition().success).toBe(false);
            expect(modifier.getNudge().success).toBe(false);
            expect(modifier.getStick().success).toBe(false);
        });

        it.each(testFaces)('should re-calibrate and repopulate cache when tracking is regained', (face) => {
            const threshold = modifier.RESET_HEAD_THRESHOLD;
            (mockProvider.getFace as any).mockReturnValue(face);
            modifier.tick(0);

            // Force hard reset
            (mockProvider.getFace as any).mockReturnValue(null);
            for (let i = 1; i <= threshold + 1; i++) modifier.tick(i);

            // Regain
            (mockProvider.getFace as any).mockReturnValue(face);
            modifier.tick(threshold + 2);

            expect(modifier.getCarPosition().success).toBe(true);
            expect((modifier as any).neutralHeadSize).not.toBeNull();
        });
    });

    describe('6. Performance & Idempotency (Implementation Guardrails)', () => {
        it('should not re-calculate features if called multiple times with the same sceneId', () => {
            const face = factory.createCenterFace();
            (mockProvider.getFace as any).mockReturnValue(face);

            // First call for Scene 1
            modifier.tick(1);
            expect(mockProvider.getFace).toHaveBeenCalledTimes(1);

            // Second call for Scene 1 (Redundant)
            modifier.tick(1);

            // Should still be 1 because it should have exited early
            expect(mockProvider.getFace).toHaveBeenCalledTimes(1);

            // Third call for Scene 2 (New Frame)
            modifier.tick(2);
            expect(mockProvider.getFace).toHaveBeenCalledTimes(2);
        });

        it('should maintain the same cache values when tick is skipped due to sceneId', () => {
            const face1 = factory.createCenterFace();
            const face2 = factory.shiftX(null, 0.5); // New data that should be ignored

            (mockProvider.getFace as any).mockReturnValue(face1);
            modifier.tick(1);
            const initialPos = (modifier.getCarPosition() as any).value.position.x;

            (mockProvider.getFace as any).mockReturnValue(face2);
            modifier.tick(1); // Same sceneId, should skip update

            const secondPos = (modifier.getCarPosition() as any).value.position.x;
            expect(secondPos).toBe(initialPos);
        });
    });
});