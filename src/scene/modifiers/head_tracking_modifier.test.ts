import { describe, it, expect, beforeEach } from 'vitest';
import { HeadTrackingModifier, DEFAULT_HEAD_TRACKING_CONFIG } from "./head_tracking_modifier.ts";
import type { ResolutionContext, DataProviderBundle } from "../types.ts";
import type { FaceWorldData } from "../providers/head_tracking_data_provider.ts";

type TestDataProviderLib = { headTracker: DataProviderBundle<"headTracker", FaceWorldData> };

function createMockContext(headData: FaceWorldData | null): ResolutionContext<TestDataProviderLib> {
    return {
        previousResolved: null,
        playback: { now: 0, delta: 0, frameCount: 0, progress: 0 },
        settings: { 
            window: { width: 640, height: 480, halfWidth: 320, halfHeight: 240, aspectRatio: 1.33, z: 0, depth: 1000, near: 0.1, far: 2000, epsilon: 0.001 }, 
            pixelRatio: 1,
            playback: { speed: 1, loop: true, duration: 0 },
            debug: false,
            alpha: 1,
            startPaused: false
        },
        projectionPool: {},
        elementPool: {},
        dataProviders: {
            headTracker: headData as unknown as DataProviderBundle<"headTracker", FaceWorldData>
        }
    } as unknown as ResolutionContext<TestDataProviderLib>;
}

function createMockFaceWorldData(overrides: Partial<FaceWorldData> = {}): FaceWorldData {
    return {
        face: {} as any,
        sceneHeadWidth: 120,
        midpoint: { x: 0, y: 0, z: 0 },
        nose: { x: 0, y: 0, z: 0 },
        eyes: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        brows: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        bounds: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 }, top: { x: 0, y: 0, z: 0 }, bottom: { x: 0, y: 0, z: 0 } },
        stick: { yaw: 0, pitch: 0, roll: 0 },
        ...overrides
    } as FaceWorldData;
}

describe('HeadTrackingModifier', () => {
    let modifier: HeadTrackingModifier;

    beforeEach(() => {
        modifier = new HeadTrackingModifier();
    });

    describe('1. Configuration', () => {
        it('should use default config when no overrides provided', () => {
            const mod = new HeadTrackingModifier();
            expect(mod.name).toBe("Head Tracker Camera");
            expect(mod.priority).toBe(10);
            expect(mod.active).toBe(true);
        });

        it('should accept custom config overrides', () => {
            const mod = new HeadTrackingModifier({ travelRange: 200, damping: 0.8 });
            expect(mod).toBeDefined();
        });

        it('should declare required data providers', () => {
            expect(modifier.requiredDataProviders).toContain('headTracker');
        });
    });

    describe('2. Stick Output', () => {
        it('should return error when no face detected', () => {
            const context = createMockContext(null);
            const result = modifier.getStick({ x: 0, y: 0, z: 0 }, context);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe("No face detected");
            }
        });

        it('should return stick data when face is detected', () => {
            const faceData = createMockFaceWorldData({
                stick: { yaw: 0.5, pitch: 0.3, roll: 0.1 }
            });
            const context = createMockContext(faceData);
            const result = modifier.getStick({ x: 0, y: 0, z: 0 }, context);

            expect(result.success).toBe(true);
            expect(result.success && result.value.yaw).toBeCloseTo(0.5 * DEFAULT_HEAD_TRACKING_CONFIG.damping);
            expect(result.success && result.value.pitch).toBeCloseTo(0.3 * DEFAULT_HEAD_TRACKING_CONFIG.damping);
            expect(result.success && result.value.roll).toBeCloseTo(0.1 * DEFAULT_HEAD_TRACKING_CONFIG.damping);
            expect(result.success && result.value.distance).toBe(DEFAULT_HEAD_TRACKING_CONFIG.lookDistance);
            expect(result.success && result.value.priority).toBe(10);
        });
    });

    describe('3. Car Position Output', () => {
        it('should return error when no face detected', () => {
            const context = createMockContext(null);
            const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, context);
            expect(result.success).toBe(false);
        });

        it('should return midpoint position when face is detected', () => {
            const faceData = createMockFaceWorldData({
                midpoint: { x: 50, y: -30, z: 100 }
            });
            const context = createMockContext(faceData);
            const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, context);

            expect(result.success).toBe(true);
            expect(result.success && result.value.name).toBe("Head Tracker Camera");
            expect(result.success && result.value.position).toEqual({ x: 50, y: -30, z: 100 });
        });
    });

    describe('4. Nudge Output', () => {
        it('should return error when no face detected', () => {
            const context = createMockContext(null);
            const result = modifier.getNudge({ x: 0, y: 0, z: 0 }, context);
            expect(result.success).toBe(false);
        });

        it('should return scaled nudge values when face is detected', () => {
            const faceData = createMockFaceWorldData({
                midpoint: { x: 0.5, y: 0.3, z: 0.2 }
            });
            const context = createMockContext(faceData);
            const result = modifier.getNudge({ x: 0, y: 0, z: 0 }, context);

            expect(result.success).toBe(true);
            expect(result.success && result.value.x).toBeCloseTo(0.5 * DEFAULT_HEAD_TRACKING_CONFIG.travelRange);
            expect(result.success && result.value.y).toBeCloseTo(0.3 * DEFAULT_HEAD_TRACKING_CONFIG.travelRange);
            expect(result.success && result.value.z).toBeCloseTo(0.2 * DEFAULT_HEAD_TRACKING_CONFIG.zTravelRange);
        });
    });

    describe('5. Tick', () => {
        it('should have a tick method that does nothing', () => {
            expect(() => modifier.tick(1)).not.toThrow();
            expect(() => modifier.tick(100)).not.toThrow();
        });
    });
});
