import { describe, it, expect } from 'vitest';
import { CompositeStick } from './composite_stick';
import type { StickModifier, StickResult, SceneState, Vector3, FailableResult } from './types';

// Simple mock for integration test
class SimpleStickModifier implements StickModifier {
    public name: string;
    public active = true;
    public priority: number;
    private readonly result: StickResult;

    constructor(name: string, priority: number, result: StickResult) {
        this.name = name;
        this.priority = priority;
        this.result = result;
    }

    tick(_sceneId: number): void {}

    getStick(_finalPos: Vector3, _state: SceneState): FailableResult<StickResult> {
        return { success: true, value: this.result };
    }
}

describe('CompositeStick Integration', () => {
    it('can be used alongside existing modifiers', () => {
        const gamepad = new SimpleStickModifier('Gamepad', 10, {
            yaw: 0.5,
            pitch: 0.2,
            roll: 0,
            distance: 1000,
            priority: 10
        });

        const headTracking = new SimpleStickModifier('HeadTracking', 20, {
            yaw: 0.1,
            pitch: 0.05,
            roll: 0.02,
            distance: 500,
            priority: 20,
            confidence: 0.9
        });

        // Test CompositeStick with weighted average
        const composite = new CompositeStick(50, [gamepad, headTracking], {
            strategy: 'weighted_average',
            weights: [0.8, 0.2]
        });

        expect(composite.name).toBe('CompositeStick(Gamepad+HeadTracking)');
        expect(composite.priority).toBe(50);
        expect(composite.active).toBe(true);

        // Test that it can be ticked
        composite.tick(123);

        // Test that it produces combined results
        const mockState: SceneState = {
            sceneId: 1,
            settings: {
                window: { width: 800, height: 600, aspectRatio: 4/3 },
                camera: { position: { x: 0, y: 0, z: 500 }, lookAt: { x: 0, y: 0, z: 0 }, fov: Math.PI/3, near: 0.1, far: 5000 },
                playback: { isLoop: true, timeSpeed: 1.0, startTime: 0 },
                debug: false,
                startPaused: false,
                alpha: 1
            },
            playback: { now: 0, delta: 0, progress: 0, frameCount: 0 },
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
        };

        const result = composite.getStick({ x: 0, y: 0, z: 0 }, mockState);
        
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.yaw).toBeCloseTo(0.42, 5); // (0.5 * 0.8) + (0.1 * 0.2) = 0.4 + 0.02
            expect(result.value.pitch).toBeCloseTo(0.17, 5); // (0.2 * 0.8) + (0.05 * 0.2) = 0.16 + 0.01
            expect(result.value.roll).toBeCloseTo(0.004, 5); // (0 * 0.8) + (0.02 * 0.2) = 0 + 0.004
            expect(result.value.distance).toBeCloseTo(900, 5); // (1000 * 0.8) + (500 * 0.2) = 800 + 100
            expect(result.value.priority).toBe(50);
        }
    });

    it('handles failure gracefully', () => {
        const workingModifier = new SimpleStickModifier('Working', 10, {
            yaw: 0.5,
            pitch: 0.2,
            roll: 0,
            distance: 1000,
            priority: 10
        });

        const failingModifier = new SimpleStickModifier('Failing', 20, {
            yaw: 0.1,
            pitch: 0.05,
            roll: 0.02,
            distance: 500,
            priority: 20
        });

        failingModifier.active = false; // Make it inactive

        const composite = new CompositeStick(50, [workingModifier, failingModifier], {
            strategy: 'sum'
        });

        const mockState: SceneState = {
            sceneId: 1,
            settings: {
                window: { width: 800, height: 600, aspectRatio: 4/3 },
                camera: { position: { x: 0, y: 0, z: 500 }, lookAt: { x: 0, y: 0, z: 0 }, fov: Math.PI/3, near: 0.1, far: 5000 },
                playback: { isLoop: true, timeSpeed: 1.0, startTime: 0 },
                debug: false,
                startPaused: false,
                alpha: 1
            },
            playback: { now: 0, delta: 0, progress: 0, frameCount: 0 },
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
        };

        const result = composite.getStick({ x: 0, y: 0, z: 0 }, mockState);
        
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.yaw).toBeCloseTo(0.5, 5); // Only working modifier contributes
            expect(result.value.pitch).toBeCloseTo(0.2, 5);
            expect(result.value.roll).toBeCloseTo(0, 5);
            expect(result.value.distance).toBeCloseTo(1000, 5);
            expect(result.value.priority).toBe(50);
        }
    });
});