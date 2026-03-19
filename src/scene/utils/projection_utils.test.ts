import { describe, it, expect } from 'vitest';
import {
    averageVectors,
    lookAtRotation,
    normalize,
    cross,
    rotateVector,
    wrapPi,
} from './projection_utils.ts';

describe('vector math helpers', () => {
    describe('averageVectors', () => {
        it('averages vectors component-wise', () => {
            const result = averageVectors([
                { x: 2, y: 0, z: 0 },
                { x: 0, y: 2, z: 0 },
            ]);
            expect(result).toEqual({ x: 1, y: 1, z: 0 });
        });

        it('throws on empty input', () => {
            expect(() => averageVectors([])).toThrow("Cannot average empty vector array");
        });
    });

    describe('normalize', () => {
        it('normalizes a unit vector', () => {
            const v = { x: 3, y: 4, z: 0 };
            const result = normalize(v);
            expect(result.x).toBeCloseTo(0.6);
            expect(result.y).toBeCloseTo(0.8);
            expect(result.z).toBe(0);
        });

        it('returns zero vector for zero input', () => {
            const v = { x: 0, y: 0, z: 0 };
            const result = normalize(v);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
        });

        it('preserves already normalized vectors', () => {
            const v = { x: 1, y: 0, z: 0 };
            const result = normalize(v);
            expect(result.x).toBe(1);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
        });
    });

    describe('rotateVector', () => {
        it('applies yaw rotation around Y axis', () => {
            const v = { x: 1, y: 0, z: 0 };
            const result = rotateVector(v, { yaw: Math.PI / 2, pitch: 0, roll: 0 });
            expect(result.x).toBeCloseTo(0);
            expect(result.y).toBeCloseTo(0);
            expect(result.z).toBeCloseTo(1);
        });
    });

    describe('lookAtRotation', () => {
        it('respects axis mask (can freeze yaw/roll)', () => {
            const base = { pitch: 0.1, yaw: 2, roll: 3 };
            const result = lookAtRotation(
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 1 },
                { x: true, y: false, z: false },
                base
            );
            expect(result.yaw).toBe(base.yaw);
            expect(result.roll).toBe(base.roll);
            expect(result.pitch).not.toBe(base.pitch);
        });

        it('returns rotate unchanged when all axes are disabled', () => {
            const base = { pitch: 1, yaw: 2, roll: 3 };
            const result = lookAtRotation(
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 1 },
                { x: false, y: false, z: false },
                base
            );
            expect(result).toEqual(base);
        });
    });

    describe('cross', () => {
        it('computes cross product of two perpendicular vectors', () => {
            const a = { x: 1, y: 0, z: 0 };
            const b = { x: 0, y: 1, z: 0 };
            const result = cross(a, b);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(1);
        });

        it('returns zero vector for parallel vectors', () => {
            const a = { x: 1, y: 0, z: 0 };
            const b = { x: 2, y: 0, z: 0 };
            const result = cross(a, b);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
        });
    });

    describe('wrapPi', () => {
        it('wraps values to within [-π, π]', () => {
            const r1 = wrapPi(4);
            const r2 = wrapPi(-4);
            expect(r1).toBeLessThanOrEqual(Math.PI);
            expect(r1).toBeGreaterThanOrEqual(-Math.PI);
            expect(r2).toBeLessThanOrEqual(Math.PI);
            expect(r2).toBeGreaterThanOrEqual(-Math.PI);
        });
    });
});
