import { describe, it, expect, beforeEach } from 'vitest';
import { HeadTrackingModifier, DEFAULT_HEAD_TRACKING_CONFIG } from "./head_tracking_modifier.ts";
import type { ResolutionContext, DataProviderBundle, Alpha } from "../types.ts";
import type { FaceWorldData } from "../providers/head_tracking_data_provider.ts";
import { SceneFace, DEFAULT_FACE_SCENE_CONFIG } from "../providers/scene_face.ts";

type TestDataProviderLib = { headTracker: DataProviderBundle<"headTracker", FaceWorldData> };

function createMockSceneFace(overrides: Partial<{
    localPosition: { x: number; y: number; z: number };
    localRotation: { yaw: number; pitch: number; roll: number };
}> = {}): SceneFace {
    return new SceneFace(
        DEFAULT_FACE_SCENE_CONFIG,
        overrides.localPosition ?? { x: 0, y: 0, z: 0 },
        overrides.localRotation ?? { yaw: 0, pitch: 0, roll: 0 },
        180,
        1
    );
}

function createMockContext(headData: FaceWorldData | null): ResolutionContext<TestDataProviderLib> {
    return {
        previousResolved: null,
        playback: { now: 0, delta: 0, frameCount: 0, progress: 0 },
        settings: { 
            window: { width: 640, height: 480, halfWidth: 320, halfHeight: 240, aspectRatio: 1.33, z: 0, depth: 1000, near: 0.1, far: 2000, epsilon: 0.001 }, 
            pixelRatio: 1,
            playback: { speed: 1, loop: true, duration: 0 },
            debug: false,
            alpha: 1 as Alpha,
            startPaused: false
        },
        projectionPool: {},
        elementPool: {},
        dataProviders: {
            headTracker: headData as unknown as DataProviderBundle<"headTracker", FaceWorldData>
        }
    } as unknown as ResolutionContext<TestDataProviderLib>;
}

function createMockFaceWorldData(overrides: Partial<{
    sceneFace: SceneFace;
    midpoint: { x: number; y: number; z: number };
    nose: { x: number; y: number; z: number };
    eyes: { left: { x: number; y: number; z: number }; right: { x: number; y: number; z: number } };
    brows: { left: { x: number; y: number; z: number }; right: { x: number; y: number; z: number } };
    bounds: { left: { x: number; y: number; z: number }; right: { x: number; y: number; z: number }; top: { x: number; y: number; z: number }; bottom: { x: number; y: number; z: number } };
    stick: { yaw: number; pitch: number; roll: number };
}> = {}): FaceWorldData {
    let sceneFace: SceneFace;
    if (overrides.sceneFace) {
        sceneFace = overrides.sceneFace;
    } else if (overrides.midpoint) {
        sceneFace = createMockSceneFace({ localPosition: overrides.midpoint });
    } else {
        sceneFace = createMockSceneFace();
    }
    const face = {
        rebase: {
            nose: { x: 0, y: 0, z: 0 },
            leftEye: { x: 0, y: 0, z: 0 },
            rightEye: { x: 0, y: 0, z: 0 },
            leftBrow: { x: 0, y: 0, z: 0 },
            rightBrow: { x: 0, y: 0, z: 0 },
            leftEar: { x: 0, y: 0, z: 0 },
            rightEar: { x: 0, y: 0, z: 0 },
            middleTop: { x: 0, y: 0, z: 0 },
            middleBottom: { x: 0, y: 0, z: 0 },
        }
    } as any;
    
    return {
        face,
        sceneFace,
        midpoint: sceneFace.localPosition,
        nose: overrides.nose ?? { x: 0, y: 0, z: 0 },
        eyes: overrides.eyes ?? { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        brows: overrides.brows ?? { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        bounds: overrides.bounds ?? { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 }, top: { x: 0, y: 0, z: 0 }, bottom: { x: 0, y: 0, z: 0 } },
        stick: overrides.stick ?? { yaw: 0, pitch: 0, roll: 0 },
    } as unknown as FaceWorldData;
}

describe('HeadTrackingModifier', () => {
    let modifier: HeadTrackingModifier;

    // Helper to create modifier with no smoothing for testing raw values
    const createUnlimitedModifier = () => new HeadTrackingModifier({
        smoothing: 1,
        rotationSmoothing: 1,
        threshold: 0,
        rotationThreshold: 0,
    });

    beforeEach(() => {
        modifier = createUnlimitedModifier();
    });

    describe('Configuration', () => {
        it('should use default config when no overrides provided', () => {
            const mod = new HeadTrackingModifier();
            expect(mod.name).toBe("Head Tracker Camera");
            expect(mod.priority).toBe(10);
            expect(mod.active).toBe(true);
        });

        it('should accept custom config overrides', () => {
            const mod = new HeadTrackingModifier({ damping: 0.8 });
            expect(mod).toBeDefined();
        });

        it('should declare required data providers', () => {
            expect(modifier.requiredDataProviders).toContain('headTracker');
        });
    });

    describe('Car Position Output', () => {
        it('should return error when no face detected', () => {
            const context = createMockContext(null);
            const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, context);
            expect(result.success).toBe(false);
        });

        it('should calibrate (return zero) on first face detection', () => {
            const faceData = createMockFaceWorldData({
                midpoint: { x: 50, y: -30, z: 100 }
            });
            const context = createMockContext(faceData);
            const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, context);

            expect(result.success).toBe(true);
            expect(result.success && result.value.name).toBe("Head Tracker Camera");
            // First call returns zero (calibration)
            expect(result.success && result.value.position).toEqual({ x: 0, y: 0, z: 0 });
        });

        it('should return relative position on subsequent calls', () => {
            const faceData1 = createMockFaceWorldData({
                midpoint: { x: 50, y: -30, z: 100 }
            });
            const context = createMockContext(faceData1);
            // First call - calibration
            modifier.getCarPosition({ x: 0, y: 0, z: 0 }, context);

            // Second call - same position should return zero
            const faceData2 = createMockFaceWorldData({
                midpoint: { x: 50, y: -30, z: 100 }
            });
            const context2 = createMockContext(faceData2);
            const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, context2);

            expect(result.success).toBe(true);
            expect(result.success && result.value.position).toEqual({ x: 0, y: 0, z: 0 });
        });

        it('should return rotation when face is detected', () => {
            // First call - calibration with initial rotation
            const faceData1 = createMockFaceWorldData({
                stick: { yaw: 0.5, pitch: 0.3, roll: 0.1 }
            });
            const context1 = createMockContext(faceData1);
            modifier.getCarPosition({ x: 0, y: 0, z: 0 }, context1);

            // Second call - different rotation to see relative movement
            const faceData2 = createMockFaceWorldData({
                stick: { yaw: 0.7, pitch: 0.5, roll: 0.2 }
            });
            const context2 = createMockContext(faceData2);
            const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, context2);

            expect(result.success).toBe(true);
            expect(result.success && result.value.rotation).toBeDefined();
            // Should be relative to reference (0.7 - 0.5 = 0.2)
            expect(result.success && result.value.rotation?.yaw).toBeCloseTo(0.2 * DEFAULT_HEAD_TRACKING_CONFIG.damping);
            expect(result.success && result.value.rotation?.pitch).toBeCloseTo(-0.2 * DEFAULT_HEAD_TRACKING_CONFIG.damping);
            expect(result.success && result.value.rotation?.roll).toBeCloseTo(0.1 * DEFAULT_HEAD_TRACKING_CONFIG.damping);
        });
    });

    describe('Tick', () => {
        it('should have a tick method that does nothing', () => {
            expect(() => modifier.tick(1)).not.toThrow();
            expect(() => modifier.tick(100)).not.toThrow();
        });
    });
});
