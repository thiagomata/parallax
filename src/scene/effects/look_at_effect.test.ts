import { describe, it, expect, beforeEach } from 'vitest';
import { LookAtEffect, LookAtDefaultConfig, type LookAtEffectConfig } from './look_at_effect.ts';
import { ELEMENT_TYPES } from '../types.ts';
import type { SceneState, ResolvedBaseVisual, ResolvedElement } from '../types.ts';

describe('LookAtEffect', () => {
    let mockState: SceneState;
    let mockCurrent: ResolvedBaseVisual;
    let targetElement: ResolvedElement;

    beforeEach(() => {
        mockState = {
            sceneId: 1,
            settings: {
                window: { width: 800, height: 600, aspectRatio: 4/3 },
                camera: {
                    position: { x: 0, y: 0, z: 500 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    fov: Math.PI / 3,
                    near: 0.1,
                    far: 5000
                },
                playback: {
                    duration: 5000,
                    isLoop: true,
                    timeSpeed: 1.0,
                    startTime: 0
                },
                debug: false,
                alpha: 1,
                startPaused: false
            },
            playback: {
                now: 1000,
                delta: 16,
                progress: 0.2,
                frameCount: 60
            },
            camera: {
                position: { x: 0, y: 0, z: 500 },
                lookAt: { x: 0, y: 0, z: 0 },
                fov: Math.PI / 3,
                near: 0.1,
                far: 5000,
                yaw: Math.PI / 4,
                pitch: Math.PI / 6,
                roll: Math.PI / 8,
                direction: { x: 0, y: 0, z: -1 }
            },
            elements: new Map()
        };

        mockCurrent = {
            type: ELEMENT_TYPES.BOX,
            position: { x: 100, y: 50, z: 0 },
            rotate: { x: 0, y: 0, z: 0 },
            width: 50,
            height: 50,
            depth: 50
        } as ResolvedBaseVisual;

        targetElement = {
            type: ELEMENT_TYPES.SPHERE,
            position: { x: 200, y: 100, z: -100 },
            rotate: { x: 0, y: 0, z: Math.PI / 2 },
            radius: 25
        } as ResolvedElement;
    });

    describe('Effect Bundle Properties', () => {
        it('should have correct type', () => {
            expect(LookAtEffect.type).toBe('look_at');
        });

        it('should have default config', () => {
            expect(LookAtEffect.defaults).toEqual(LookAtDefaultConfig);
        });
    });

    describe('Look at Camera', () => {
        it('should rotate towards camera with default axis settings', () => {
            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'CAMERA'
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.x).toBeCloseTo(mockCurrent.rotate!.x + mockState.camera.pitch);
            expect(result.rotate!.y).toBeCloseTo(mockCurrent.rotate!.y - mockState.camera.yaw);
            expect(result.rotate!.z).toBe(mockCurrent.rotate!.z); // z is false by default
        });

        it('should respect axis locks for camera', () => {
            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'CAMERA',
                axis: { x: false, y: true, z: false }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.x).toBe(mockCurrent.rotate!.x);
            expect(result.rotate!.y).toBeCloseTo(mockCurrent.rotate!.y - mockState.camera.yaw);
            expect(result.rotate!.z).toBe(mockCurrent.rotate!.z);
        });

        it('should handle missing rotate in current visual', () => {
            const currentWithoutRotate = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 100, y: 50, z: 0 },
                width: 50,
                height: 50,
                depth: 50
            } as ResolvedBaseVisual;

            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'CAMERA'
            };

            const result = LookAtEffect.apply(currentWithoutRotate, mockState, config);

            expect(result.rotate!.x).toBeCloseTo(mockState.camera.pitch);
            expect(result.rotate!.y).toBeCloseTo(-mockState.camera.yaw);
            expect(result.rotate!.z).toBe(0); // z is false by default
        });
    });

    describe('Look at Element', () => {
        beforeEach(() => {
            mockState.elements!.set('target', targetElement);
        });

        it('should rotate towards target element', () => {
            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'target',
                axis: { x: true, y: true, z: false }
            };

            // Calculate expected values
            const dx = targetElement.position.x - mockCurrent.position.x; // 100
            const dy = targetElement.position.y - mockCurrent.position.y; // 50
            const dz = targetElement.position.z - mockCurrent.position.z; // -100

            const expectedYaw = Math.atan2(dx, dz); // atan2(100, -100)
            const distanceXZ = Math.sqrt(dx * dx + dz * dz); // sqrt(100^2 + (-100)^2)
            const expectedPitch = -Math.atan2(dy, distanceXZ); // -atan2(50, distanceXZ)

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.y).toBeCloseTo(expectedYaw);
            expect(result.rotate!.x).toBeCloseTo(expectedPitch);
            expect(result.rotate!.z).toBe(mockCurrent.rotate!.z); // z should remain unchanged
        });

        it('should copy target element Z rotation when enabled', () => {
            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'target',
                axis: { x: false, y: false, z: true }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.z).toBeCloseTo(mockCurrent.rotate!.z + targetElement.rotate!.z);
        });

        it('should return unchanged current when target element not found', () => {
            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'nonexistent'
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result).toEqual(mockCurrent);
        });

        it('should return unchanged current when elements map is undefined', () => {
            const stateWithoutElements = { ...mockState, elements: undefined };
            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'target'
            };

            const result = LookAtEffect.apply(mockCurrent, stateWithoutElements, config);

            expect(result).toEqual(mockCurrent);
        });

        it('should handle target element without rotation', () => {
            const targetWithoutRotation = {
                ...targetElement,
                rotate: undefined
            };
            mockState.elements!.set('target', targetWithoutRotation);

            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'target',
                axis: { x: false, y: false, z: true }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.z).toBe(mockCurrent.rotate!.z);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero distance to target', () => {
            const targetAtSamePosition = {
                ...targetElement,
                position: { ...mockCurrent.position }
            };
            mockState.elements!.set('target', targetAtSamePosition);

            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'target',
                axis: { x: true, y: true, z: false }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            // With zero distance, atan2 should handle gracefully
            expect(result.rotate!.x).toBe(mockCurrent.rotate!.x);
            expect(result.rotate!.y).toBe(mockCurrent.rotate!.y);
        });

        it('should handle negative axis values', () => {
            const mockCurrentWithNegative = {
                ...mockCurrent,
                rotate: { x: -Math.PI/4, y: -Math.PI/4, z: -Math.PI/4 }
            } as ResolvedBaseVisual;

            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'CAMERA'
            };

            const result = LookAtEffect.apply(mockCurrentWithNegative, mockState, config);

            expect(result.rotate!.x).toBeCloseTo(-Math.PI/4 + mockState.camera.pitch);
            expect(result.rotate!.y).toBeCloseTo(-Math.PI/4 - mockState.camera.yaw);
            expect(result.rotate!.z).toBe(-Math.PI/4); // z is false by default
        });
    });

    describe('Individual Axis Locks for Camera Coverage', () => {
        it('should handle undefined axis in settings', () => {
            const configWithoutAxis = {
                enabled: true,
                lookAt: 'CAMERA'
            } as LookAtEffectConfig;

            const result = LookAtEffect.apply(mockCurrent, mockState, configWithoutAxis);

            // Should use empty object as default
            expect(result.rotate!.x).toBe(mockCurrent.rotate!.x); // no change
            expect(result.rotate!.y).toBe(mockCurrent.rotate!.y); // no change
            expect(result.rotate!.z).toBe(mockCurrent.rotate!.z); // no change
        });

        it('should test individual Y axis lock with camera', () => {
            const config: LookAtEffectConfig = {
                enabled: true,
                lookAt: 'CAMERA',
                axis: { y: true }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.x).toBe(mockCurrent.rotate!.x); // x unchanged
            expect(result.rotate!.y).toBeCloseTo(mockCurrent.rotate!.y - mockState.camera.yaw);
            expect(result.rotate!.z).toBe(mockCurrent.rotate!.z); // z unchanged
        });

        it('should test individual X axis lock with camera', () => {
            const config: LookAtEffectConfig = {
                enabled: true,
                lookAt: 'CAMERA',
                axis: { x: true }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.x).toBeCloseTo(mockCurrent.rotate!.x + mockState.camera.pitch);
            expect(result.rotate!.y).toBe(mockCurrent.rotate!.y); // y unchanged
            expect(result.rotate!.z).toBe(mockCurrent.rotate!.z); // z unchanged
        });

        it('should test individual Z axis lock with camera', () => {
            const config: LookAtEffectConfig = {
                enabled: true,
                lookAt: 'CAMERA',
                axis: { z: true }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.x).toBe(mockCurrent.rotate!.x); // x unchanged
            expect(result.rotate!.y).toBe(mockCurrent.rotate!.y); // y unchanged
            expect(result.rotate!.z).toBeCloseTo(mockCurrent.rotate!.z - mockState.camera.roll);
        });

        it('should test all axis locks individually with camera', () => {
            const config: LookAtEffectConfig = {
                enabled: true,
                lookAt: 'CAMERA',
                axis: { x: true, y: true, z: true }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.x).toBeCloseTo(mockCurrent.rotate!.x + mockState.camera.pitch);
            expect(result.rotate!.y).toBeCloseTo(mockCurrent.rotate!.y - mockState.camera.yaw);
            expect(result.rotate!.z).toBeCloseTo(mockCurrent.rotate!.z - mockState.camera.roll);
        });

        it('should test all axis locks as false with camera', () => {
            const config: LookAtEffectConfig = {
                enabled: true,
                lookAt: 'CAMERA',
                axis: { x: false, y: false, z: false }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            expect(result.rotate!.x).toBe(mockCurrent.rotate!.x);
            expect(result.rotate!.y).toBe(mockCurrent.rotate!.y);
            expect(result.rotate!.z).toBe(mockCurrent.rotate!.z);
        });
    });

    describe('Edge Cases and Error Conditions', () => {
        it('should handle extreme camera values', () => {
            const extremeState = {
                ...mockState,
                camera: {
                    ...mockState.camera,
                    yaw: Math.PI * 2,
                    pitch: -Math.PI / 2,
                    roll: Math.PI
                }
            };

            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'CAMERA'
            };

            const result = LookAtEffect.apply(mockCurrent, extremeState, config);

            expect(result.rotate!.x).toBeCloseTo(mockCurrent.rotate!.x - Math.PI / 2);
            expect(result.rotate!.y).toBeCloseTo(mockCurrent.rotate!.y - Math.PI * 2);
            expect(result.rotate!.z).toBe(mockCurrent.rotate!.z); // z is false by default
        });

        it('should handle Infinity and NaN positions gracefully', () => {
            const targetWithInfinity = {
                ...targetElement,
                position: { x: Infinity, y: NaN, z: -Infinity }
            };
            mockState.elements!.set('infinity-target', targetWithInfinity);

            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'infinity-target',
                axis: { x: true, y: true, z: false }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            // Should handle gracefully without throwing
            expect(typeof result.rotate!.x).toBe('number');
            expect(typeof result.rotate!.y).toBe('number');
            expect(typeof result.rotate!.z).toBe('number');
        });

        it('should handle very large coordinate values', () => {
            const targetFarAway = {
                ...targetElement,
                position: { x: 1e10, y: -1e10, z: 1e10 }
            };
            mockState.elements!.set('far-target', targetFarAway);

            const config: LookAtEffectConfig = {
                ...LookAtDefaultConfig,
                lookAt: 'far-target',
                axis: { x: true, y: true, z: false }
            };

            const result = LookAtEffect.apply(mockCurrent, mockState, config);

            // Should handle large values
            expect(typeof result.rotate!.x).toBe('number');
            expect(typeof result.rotate!.y).toBe('number');
            expect(isFinite(result.rotate!.x)).toBe(true);
            expect(isFinite(result.rotate!.y)).toBe(true);
        });
    });
});