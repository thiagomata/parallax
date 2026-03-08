import { describe, it, expect } from 'vitest';
import {
    normalize,
    cross
} from './projection_utils.ts';

describe('vector math helpers', () => {
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
});
