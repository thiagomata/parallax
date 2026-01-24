import { describe, it, expect, beforeEach } from 'vitest';
import type { Vector3 } from '../types';
import {CenterFocusModifier} from "./center_focus_modifier.ts";

describe('CenterFocusModifier', () => {
    let modifier: CenterFocusModifier;

    beforeEach(() => {
        modifier = new CenterFocusModifier();
    });

    /**
     * Helper to verify the trig logic without hardcoding values
     */
    const calculateExpectedStick = (pos: Vector3) => {
        const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
        return {
            distance,
            pitch: Math.asin(-pos.y / distance),
            yaw: Math.atan2(-pos.x, pos.z)
        };
    };

    it('should return 0 rotation when positioned on the Z axis looking forward', () => {
        const cameraPos: Vector3 = { x: 0, y: 0, z: 100 };
        const result = modifier.getStick(cameraPos);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.yaw).toBeCloseTo(0);   // -0 is not equal to +0 :(
            expect(result.value.pitch).toBeCloseTo(0); // -0 is not equal to +0 :(
            expect(result.value.distance).toBe(100);
        }
    });

    it('should calculate the correct yaw when shifted horizontally', () => {
        // Camera moved to the right, must turn left (negative yaw) to see center
        const cameraPos: Vector3 = { x: 50, y: 0, z: 50 };
        const result = modifier.getStick(cameraPos);
        const expected = calculateExpectedStick(cameraPos);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.yaw).toBeCloseTo(expected.yaw);
            expect(result.value.distance).toBeCloseTo(expected.distance);
        }
    });

    it('should calculate the correct pitch when shifted vertically', () => {
        // Camera moved up, must look down (negative pitch)
        const cameraPos: Vector3 = { x: 0, y: 50, z: 50 };
        const result = modifier.getStick(cameraPos);
        const expected = calculateExpectedStick(cameraPos);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.pitch).toBeCloseTo(expected.pitch);
        }
    });

    it('should handle complex 3D positions (diagonal)', () => {
        const positions: Vector3[] = [
            { x: 10, y: -20, z: 30 },
            { x: -50, y: 50, z: 10 },
            { x: 100, y: 100, z: 100 }
        ];

        positions.forEach(pos => {
            const result = modifier.getStick(pos);
            const expected = calculateExpectedStick(pos);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.yaw).toBeCloseTo(expected.yaw);
                expect(result.value.pitch).toBeCloseTo(expected.pitch);
                expect(result.value.distance).toBeCloseTo(expected.distance);
            }
        });
    });

    it('should respect the priority defined in the class', () => {
        const result = modifier.getStick({ x: 0, y: 0, z: 10 });
        if (result.success) {
            expect(result.value.priority).toBe(modifier.priority);
        }
    });
});