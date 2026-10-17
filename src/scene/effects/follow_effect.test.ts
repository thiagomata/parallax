import { describe, it, expect } from 'vitest';
import { FollowEffect } from './follow_effect.ts';
import { STANDARD_PROJECTION_IDS, type ResolvedBaseVisual, type Alpha } from '../types.ts';

describe('FollowEffect', () => {
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

    const createElement = (position: { x: number; y: number; z: number }): ResolvedBaseVisual => ({
        id: 'test-element' as any,
        type: 'panel' as any,
        position,
    });

    describe("follow: 'CAMERA'", () => {
        it('should offset position by camera position when camera exists in pool', () => {
            const element = createElement({ x: 0, y: 0, z: -500 });
            const context = createContext({
                [STANDARD_PROJECTION_IDS.EYE]: { position: { x: 10, y: 20, z: 30 } }
            });
            const settings = { follow: 'CAMERA', enabled: true };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position).toEqual({ x: 10, y: 20, z: -470 });
        });

        it('should use globalPosition when available', () => {
            const element = createElement({ x: 0, y: 0, z: -500 });
            const context = createContext({
                [STANDARD_PROJECTION_IDS.EYE]: { position: { x: 0, y: 0, z: 0 }, globalPosition: { x: 10, y: 20, z: 30 } }
            });
            const settings = { follow: 'CAMERA', enabled: true };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position).toEqual({ x: 10, y: 20, z: -470 });
        });

        it('should return current when no camera in pool', () => {
            const element = createElement({ x: 1, y: 2, z: 3 });
            const context = createContext({});
            const settings = { follow: 'CAMERA', enabled: true };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position).toEqual({ x: 1, y: 2, z: 3 });
        });

        it('should use screen as fallback when eye not in pool', () => {
            const element = createElement({ x: 0, y: 0, z: 0 });
            const context = createContext({
                [STANDARD_PROJECTION_IDS.SCREEN]: { position: { x: 5, y: 0, z: 0 } }
            });
            const settings = { follow: 'CAMERA', enabled: true };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position).toEqual({ x: 5, y: 0, z: 0 });
        });

        it('should respect axis locks', () => {
            const element = createElement({ x: 0, y: 0, z: 0 });
            const context = createContext({
                [STANDARD_PROJECTION_IDS.EYE]: { position: { x: 100, y: 100, z: 100 } }
            });
            const settings = { follow: 'CAMERA', enabled: true, axis: { x: true, y: false, z: true } };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position?.x).toBe(100);
            expect(result.position?.y).toBe(0);
            expect(result.position?.z).toBe(100);
        });

        it('should apply an additional world-space offset', () => {
            const element = createElement({ x: 0, y: 0, z: 0 });
            const context = createContext({
                [STANDARD_PROJECTION_IDS.EYE]: { position: { x: 0, y: 0, z: 0 } }
            });
            const settings = { follow: 'CAMERA', enabled: true, offset: { x: 1, y: 2, z: 3 } };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position).toEqual({ x: 1, y: 2, z: 3 });
        });

        it('should leave the offset world-aligned when followRotation is not set', () => {
            const element = createElement({ x: 0, y: -100, z: 0 });
            const context = createContext({
                [STANDARD_PROJECTION_IDS.EYE]: { position: { x: 0, y: 0, z: 0 }, rotation: { pitch: Math.PI / 2, yaw: 0, roll: 0 } }
            });
            const settings = { follow: 'CAMERA', enabled: true };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position).toEqual({ x: 0, y: -100, z: 0 });
        });

        it('should rotate the offset by the camera rotation when followRotation is set', () => {
            // pitch = +90deg: rotateVector maps local (0, -100, 0) -> (0, 0, -100)
            const element = createElement({ x: 0, y: -100, z: 0 });
            const context = createContext({
                [STANDARD_PROJECTION_IDS.EYE]: { position: { x: 0, y: 0, z: 0 }, rotation: { pitch: Math.PI / 2, yaw: 0, roll: 0 } }
            });
            const settings = { follow: 'CAMERA', enabled: true, followRotation: true };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position?.x).toBeCloseTo(0);
            expect(result.position?.y).toBeCloseTo(0);
            expect(result.position?.z).toBeCloseTo(-100);
        });

        it('should prefer globalRotation over rotation when both are present', () => {
            const element = createElement({ x: 0, y: -100, z: 0 });
            const context = createContext({
                [STANDARD_PROJECTION_IDS.EYE]: {
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { pitch: 0, yaw: 0, roll: 0 },
                    globalRotation: { pitch: Math.PI / 2, yaw: 0, roll: 0 },
                }
            });
            const settings = { follow: 'CAMERA', enabled: true, followRotation: true };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position?.z).toBeCloseTo(-100);
        });

        describe('targetBounds', () => {
            const withCameraAt = (position: { x: number; y: number; z: number }) =>
                createContext({ [STANDARD_PROJECTION_IDS.EYE]: { position } });

            it('follows normally while the camera is inside the bounds', () => {
                const settings = { follow: 'CAMERA', enabled: true, targetBounds: { max: { z: 150 } } };

                const result = FollowEffect.apply(createElement({ x: 0, y: 0, z: -2250 }), withCameraAt({ x: 5, y: 6, z: 100 }), settings, {});

                expect(result.position).toEqual({ x: 5, y: 6, z: -2150 });
            });

            it('stops following past a max bound, holding the element at the bound', () => {
                const settings = { follow: 'CAMERA', enabled: true, targetBounds: { max: { z: 150 } } };

                const result = FollowEffect.apply(createElement({ x: 0, y: 0, z: -2250 }), withCameraAt({ x: 5, y: 6, z: 250 }), settings, {});

                // Without the bound this would be z -2000 - colliding with a fixed layer there.
                expect(result.position).toEqual({ x: 5, y: 6, z: -2100 });
            });

            it('clamps against min bounds per axis, leaving unbounded axes alone', () => {
                const settings = { follow: 'CAMERA', enabled: true, targetBounds: { min: { x: -10, z: -50 } } };

                const result = FollowEffect.apply(createElement({ x: 0, y: 0, z: 0 }), withCameraAt({ x: -40, y: -999, z: -80 }), settings, {});

                expect(result.position).toEqual({ x: -10, y: -999, z: -50 });
            });

            it('keeps a group sharing the same bounds rigid (same clamped target for every member)', () => {
                const settings = { follow: 'CAMERA', enabled: true, targetBounds: { max: { z: 150 } } };
                const context = withCameraAt({ x: 0, y: 0, z: 400 });

                const backdrop = FollowEffect.apply(createElement({ x: 0, y: 0, z: -2250 }), context, settings, {});
                const wall = FollowEffect.apply(createElement({ x: -2700, y: 0, z: -1300 }), context, settings, {});

                expect(wall.position.z - backdrop.position.z).toBe(950);
            });
        });
    });

    describe('follow: element by ID', () => {
        it('should return current when there is no previous frame to follow from yet', () => {
            const element = createElement({ x: 1, y: 2, z: 3 });
            const result = FollowEffect.apply(element, createContext({}, null), { follow: 'some-element', enabled: true }, {});
            expect(result.position).toEqual({ x: 1, y: 2, z: 3 });
        });

        it('should offset position to follow target element', () => {
            const element = createElement({ x: 0, y: 0, z: -500 });
            const targetElement = createElement({ x: 100, y: 0, z: 0 });
            const previousResolved = {
                elements: new Map([['target', targetElement]])
            };
            const context = createContext({}, previousResolved);
            const settings = { follow: 'target', enabled: true };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position).toEqual({ x: 100, y: 0, z: -500 });
        });

        it('should return current when target element not found', () => {
            const element = createElement({ x: 1, y: 2, z: 3 });
            const context = createContext({}, { elements: new Map() });
            const settings = { follow: 'nonexistent', enabled: true };

            const result = FollowEffect.apply(element, context, settings, {});

            expect(result.position).toEqual({ x: 1, y: 2, z: 3 });
        });
    });

    describe('default configuration', () => {
        it('should have CAMERA as default follow value', () => {
            expect(FollowEffect.defaults.follow).toBe('CAMERA');
        });

        it('should have all axes enabled by default', () => {
            expect(FollowEffect.defaults.axis?.x).toBe(true);
            expect(FollowEffect.defaults.axis?.y).toBe(true);
            expect(FollowEffect.defaults.axis?.z).toBe(true);
        });
    });
});
