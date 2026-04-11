import { describe, it, expect } from 'vitest';
import { LookAtEffect } from './look_at_effect.ts';
import { STANDARD_PROJECTION_IDS, type ResolvedBaseVisual, type Alpha } from '../types.ts';

describe('LookAtEffect', () => {
    const createContext = (projectionPool: Record<string, any> = {}, previousResolved: any = null) => {
        return {
            previousResolved,
            playback: { now: 0, delta: 0, frameCount: 0, progress: 0 },
            settings: {
                window: { width: 640, height: 480, halfWidth: 320, halfHeight: 240, aspectRatio: 1.33, z: 0, depth: 1000, near: 0.1, far: 2000, epsilon: 0.001 },
                pixelRatio: 1,
                playback: { speed: 1, loop: true, duration: 0 },
                debug: false,
                alpha: 1 as Alpha,
                startPaused: false
            },
            projectionPool,
            elementPool: {},
            dataProviders: {},
        } as any;
    };

    const createResolutionPool = (elements: Record<string, any> = {}) => elements as any;

    const createElement = (position: { x: number; y: number; z: number }, rotation = { pitch: 0, yaw: 0, roll: 0 }): ResolvedBaseVisual => ({
        id: 'test-element' as any,
        type: 'box' as any,
        position,
        rotate: rotation,
    });

    describe("lookAt: 'CAMERA'", () => {
	        it('should rotate to face camera when camera exists in pool', () => {
            // Camera at (0, 0, 100), element at (0, 0, 0) - camera directly in front
	            const element = createElement({ x: 0, y: 0, z: 0 }, { pitch: 0, yaw: 0, roll: 0 });
	            const context = createContext({
	                [STANDARD_PROJECTION_IDS.EYE]: { position: { x: 0, y: 0, z: 100 }, rotate: { pitch: 0, yaw: 0, roll: 0 } }
	            });
            const settings = { lookAt: 'CAMERA', enabled: true, axis: { x: true, y: true, z: false } };
            const resolutionPool = createResolutionPool({});

            const result = LookAtEffect.apply(element, context, settings, resolutionPool);

            expect(result.rotate).toBeDefined();
            // Element at origin looking at camera at (0,0,100) directly in front
            // yaw = atan2(0, 100) = 0
            expect(result.rotate?.yaw).toBeCloseTo(0);
            // pitch = -atan2(0, 100) = 0 (camera directly in front)
            expect(result.rotate?.pitch).toBeCloseTo(0);
        });

        it('should return current when no camera in pool', () => {
            const element = createElement({ x: 0, y: 0, z: 0 }, { pitch: 0.5, yaw: 0.3, roll: 0.1 });
            const context = createContext({});
            const settings = { lookAt: 'CAMERA', enabled: true };
            const resolutionPool = createResolutionPool({});

            const result = LookAtEffect.apply(element, context, settings, resolutionPool);

            // Should return unchanged - graceful degradation
            expect(result.rotate?.pitch).toBe(0.5);
            expect(result.rotate?.yaw).toBe(0.3);
            expect(result.rotate?.roll).toBe(0.1);
        });

	        it('should use screen as fallback when eye not in pool', () => {
	            const element = createElement({ x: 0, y: 0, z: 0 });
	            const context = createContext({
	                [STANDARD_PROJECTION_IDS.SCREEN]: { position: { x: 0, y: 0, z: 1000 }, rotate: { pitch: 0, yaw: 0, roll: 0 } }
	            });
            const settings = { lookAt: 'CAMERA', enabled: true };
            const resolutionPool = createResolutionPool({});

            const result = LookAtEffect.apply(element, context, settings, resolutionPool);

            expect(result.rotate).toBeDefined();
            // Screen is far away at z=1000, element at origin
            // Should have very small pitch angle (looking up towards distant screen)
            expect(result.rotate?.yaw).toBeCloseTo(0);
        });

	        it('should respect axis locks', () => {
	            const element = createElement({ x: 0, y: 0, z: 0 });
	            const context = createContext({
	                [STANDARD_PROJECTION_IDS.EYE]: { position: { x: 100, y: 100, z: 100 }, rotate: { pitch: 0, yaw: 0, roll: 0 } }
	            });
            const settings = { lookAt: 'CAMERA', enabled: true, axis: { x: false, y: true, z: false } };
            const resolutionPool = createResolutionPool({});

            const result = LookAtEffect.apply(element, context, settings, resolutionPool);

            // Only Y rotation should be applied (yaw)
            expect(result.rotate?.yaw).not.toBe(0);
            // Pitch should remain 0 because x axis is locked
            expect(result.rotate?.pitch).toBe(0);
        });
    });

    describe("lookAt: element by ID", () => {
        it('should rotate to face target element', () => {
            const element = createElement({ x: 0, y: 0, z: 0 });
            const targetElement = createElement({ x: 100, y: 0, z: 0 });
            const previousResolved = {
                elements: new Map([['target', targetElement]])
            };
            const context = createContext({}, previousResolved);
            const settings = { lookAt: 'target', enabled: true, axis: { x: true, y: true, z: false } };
            const resolutionPool = createResolutionPool({});

            const result = LookAtEffect.apply(element, context, settings, resolutionPool);

            expect(result.rotate).toBeDefined();
            // Parent is at (100, 0, 0) - to the right
            // Yaw should be positive (turning right)
            expect(result.rotate?.yaw).toBeGreaterThan(0);
        });

        it('should return current when target element not found', () => {
            const element = createElement({ x: 0, y: 0, z: 0 }, { pitch: 0.5, yaw: 0.3, roll: 0.1 });
            const context = createContext({}, { elements: new Map() });
            const settings = { lookAt: 'nonexistent', enabled: true };
            const resolutionPool = createResolutionPool({});

            const result = LookAtEffect.apply(element, context, settings, resolutionPool);

            // Should return unchanged
            expect(result.rotate?.pitch).toBe(0.5);
            expect(result.rotate?.yaw).toBe(0.3);
            expect(result.rotate?.roll).toBe(0.1);
        });
    });

    describe('default configuration', () => {
        it('should have CAMERA as default lookAt value', () => {
            expect(LookAtEffect.defaults.lookAt).toBe('CAMERA');
        });

        it('should have x and y axes enabled by default', () => {
            expect(LookAtEffect.defaults.axis?.x).toBe(true);
            expect(LookAtEffect.defaults.axis?.y).toBe(true);
            expect(LookAtEffect.defaults.axis?.z).toBe(false);
        });
    });
});
