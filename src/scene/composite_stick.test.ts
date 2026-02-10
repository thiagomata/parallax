import { describe, it, expect, vi } from 'vitest';
import { CompositeStick } from './composite_stick.ts';
import type { StickModifier, StickResult, SceneState, Vector3, FailableResult } from './types';
import { DEFAULT_ROTATION_LIMITS } from './types';

// Mock StickModifier for testing
class MockStickModifier implements StickModifier {
    public name: string;
    public active = true;
    public priority: number;
    private readonly result: StickResult;
    private readonly shouldSucceed: boolean;

    constructor(name: string, priority: number, result: Partial<StickResult> = {}, shouldSucceed = true) {
        this.name = name;
        this.priority = priority;
        this.shouldSucceed = shouldSucceed;
        this.result = {
            yaw: 0,
            pitch: 0,
            roll: 0,
            distance: 1000,
            priority,
            ...result
        };
    }

    tick(_sceneId: number): void {
        // Mock implementation
    }

    getStick(_finalPos: Vector3, _state: SceneState): FailableResult<StickResult> {
        if (this.shouldSucceed) {
            return { success: true, value: this.result };
        }
        return { success: false, error: `Mock modifier ${this.name} failed` };
    }
}

describe('CompositeStick', () => {
    const mockState: SceneState = {
        sceneId: 1,
        settings: {
            window: { width: 800, height: 600, aspectRatio: 4/3 },
            projection: {
                kind: "camera",
                camera: {
                    position: {x: 0, y: 0, z: 500},
                    lookAt: {x: 0, y: 0, z: 0},
                    fov: Math.PI / 3,
                    near: 0.1,
                    far: 5000,
                    yaw: 0,
                    pitch: 0,
                    roll: 0,
                    direction: {x: 0, y: 0, z: -1},
                },
            },
            playback: { isLoop: true, timeSpeed: 1.0, startTime: 0 },
            debug: false,
            startPaused: false,
            alpha: 1
        },
        playback: { now: 0, delta: 0, progress: 0, frameCount: 0 },
        projection: {
            kind: "camera",
            camera: {
                position: { x: 0, y: 0, z: 500 },
                lookAt: { x: 0, y: 0, z: 0 },
                fov: Math.PI/3,
                near: 0.1,
                far: 5000,
                yaw: 0,
                pitch: 0,
                roll: 0,
                direction: { x: 0, y: 0, z: -1 }
            }
        }
    };
    const mockFinalPos: Vector3 = { x: 0, y: 0, z: 0 };

    describe('basic functionality', () => {
        it('should create with correct name and priority', () => {
            const modifier1 = new MockStickModifier('Test1', 10, { yaw: 0.1 });
            const modifier2 = new MockStickModifier('Test2', 20, { pitch: 0.2 });
            
            const composite = new CompositeStick(50, [modifier1, modifier2]);
            
            expect(composite.priority).toBe(50);
            expect(composite.name).toBe('CompositeStick(Test1+Test2)');
            expect(composite.active).toBe(true);
        });

        it('should tick all sources', () => {
            const modifier1 = new MockStickModifier('Test1', 10);
            const modifier2 = new MockStickModifier('Test2', 20);
            
            const tickSpy1 = vi.spyOn(modifier1, 'tick');
            const tickSpy2 = vi.spyOn(modifier2, 'tick');
            
            const composite = new CompositeStick(50, [modifier1, modifier2]);
            composite.tick(123);
            
            expect(tickSpy1).toHaveBeenCalledWith(123);
            expect(tickSpy2).toHaveBeenCalledWith(123);
        });

        it('should return error when no sources are active', () => {
            const modifier1 = new MockStickModifier('Test1', 10);
            const modifier2 = new MockStickModifier('Test2', 20);
            
            modifier1.active = false;
            modifier2.active = false;
            
            const composite = new CompositeStick(50, [modifier1, modifier2]);
            const result = composite.getStick(mockFinalPos, mockState);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('No active stick sources');
            }
        });

        it('should tick all sources', () => {
            const modifier1 = new MockStickModifier('Test1', 10);
            const modifier2 = new MockStickModifier('Test2', 20);
            
            const tickSpy1 = vi.spyOn(modifier1, 'tick');
            const tickSpy2 = vi.spyOn(modifier2, 'tick');
            
            const composite = new CompositeStick(50, [modifier1, modifier2]);
            composite.tick(123);
            
            expect(tickSpy1).toHaveBeenCalledWith(123);
            expect(tickSpy2).toHaveBeenCalledWith(123);
        });

        it('should return error when no sources are active', () => {
            const modifier1 = new MockStickModifier('Test1', 10);
            const modifier2 = new MockStickModifier('Test2', 20);
            
            modifier1.active = false;
            modifier2.active = false;
            
            const composite = new CompositeStick(50, [modifier1, modifier2]);
            const result = composite.getStick(mockFinalPos, mockState);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('No active stick sources');
            }
        });
    });

    describe('default rotation limits', () => {
        it('should use DEFAULT_ROTATION_LIMITS correctly', () => {
            const modifier = new MockStickModifier('Test1', 10, { 
                yaw: 10, // Way beyond default limit
                pitch: 10,
                roll: 10 
            });
            
            const composite = new CompositeStick(50, [modifier], {
                strategy: 'sum',
                limits: DEFAULT_ROTATION_LIMITS
            });
            const result = composite.getStick(mockFinalPos, mockState);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toMatchObject({
                    yaw: Math.PI/2,        // Clamped to max
                    pitch: Math.PI/3,       // Clamped to max
                    roll: Math.PI/6         // Clamped to max
                });
            }
        });
    });

    describe('integration examples', () => {
        it('should work for gamepad + head tracking scenario', () => {
            const gamepad = new MockStickModifier('Gamepad', 10, { 
                yaw: 0.5, pitch: 0.2, roll: 0, distance: 1000 
            });
            const headTracking = new MockStickModifier('HeadTracking', 20, { 
                yaw: 0.1, pitch: 0.05, roll: 0.02, distance: 500 
            });
            
            const composite = new CompositeStick(50, [gamepad, headTracking], {
                strategy: 'weighted_average',
                weights: [0.8, 0.2], // Gamepad dominates, head adds subtle movement
                limits: DEFAULT_ROTATION_LIMITS
            });
            
            const result = composite.getStick(mockFinalPos, mockState);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.yaw).toBeCloseTo(0.42, 5);     // (0.5 * 0.8) + (0.1 * 0.2) = 0.4 + 0.02 = 0.42
                expect(result.value.pitch).toBeCloseTo(0.17, 5);   // (0.2 * 0.8) + (0.05 * 0.2) = 0.16 + 0.01 = 0.17
                expect(result.value.roll).toBeCloseTo(0.004, 5);    // (0 * 0.8) + (0.02 * 0.2) = 0 + 0.004 = 0.004
                expect(result.value.distance).toBeCloseTo(900, 5);  // (1000 * 0.8) + (500 * 0.2) = 800 + 100 = 900
                expect(result.value.priority).toBe(50);
            }
        });

        it('should work for animation + head enrichment scenario', () => {
            const animation = new MockStickModifier('Animation', 10, { 
                yaw: 0.3, pitch: 0.4, roll: 0.1, distance: 2000 
            });
            const headTracking = new MockStickModifier('HeadTracking', 20, { 
                yaw: 0.05, pitch: 0.03, roll: 0.01, distance: 500 
            });
            
            const composite = new CompositeStick(50, [animation, headTracking], {
                strategy: 'weighted_average',
                weights: [0.9, 0.1], // Animation dominates, head adds enrichment
                limits: DEFAULT_ROTATION_LIMITS
            });
            
            const result = composite.getStick(mockFinalPos, mockState);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.yaw).toBeCloseTo(0.275, 5);    // (0.3 * 0.9) + (0.05 * 0.1) = 0.27 + 0.005 = 0.275
                expect(result.value.pitch).toBeCloseTo(0.363, 5);   // (0.4 * 0.9) + (0.03 * 0.1) = 0.36 + 0.003 = 0.363
                expect(result.value.roll).toBeCloseTo(0.091, 5);    // (0.1 * 0.9) + (0.01 * 0.1) = 0.09 + 0.001 = 0.091
                expect(result.value.distance).toBeCloseTo(1850, 5); // (2000 * 0.9) + (500 * 0.1) = 1800 + 50 = 1850
                expect(result.value.priority).toBe(50);
            }
        });
    });
});