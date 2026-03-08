import { describe, it, expect } from 'vitest';
import {
    subtract,
    normalize,
    cross,
    dot,
    rotationToDirection
} from './projection_utils.ts';
import type { Rotation3 } from '../types.ts';

describe('vector math helpers', () => {
    describe('sub', () => {
        it('subtracts two vectors', () => {
            const a = { x: 5, y: 3, z: 2 };
            const b = { x: 1, y: 2, z: 3 };
            const result = subtract(a, b);
            expect(result.x).toBe(4);
            expect(result.y).toBe(1);
            expect(result.z).toBe(-1);
        });

        it('returns zero vector when subtracting equal vectors', () => {
            const a = { x: 1, y: 1, z: 1 };
            const result = subtract(a, a);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.z).toBe(0);
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

    describe('dot', () => {
        it('computes dot product of perpendicular vectors', () => {
            const a = { x: 1, y: 0, z: 0 };
            const b = { x: 0, y: 1, z: 0 };
            expect(dot(a, b)).toBe(0);
        });

        it('computes dot product of parallel vectors', () => {
            const a = { x: 2, y: 0, z: 0 };
            const b = { x: 3, y: 0, z: 0 };
            expect(dot(a, b)).toBe(6);
        });
    });
});

describe('rotationToDirection', () => {
    it('converts zero rotation to forward direction', () => {
        const rotation: Rotation3 = { yaw: 0, pitch: 0, roll: 0 };
        const result = rotationToDirection(rotation);
        
        expect(result.x).toBeCloseTo(0, 5);
        expect(result.y).toBeCloseTo(0, 5);
        expect(result.z).toBeCloseTo(1, 5);
    });

    it('converts 90° yaw to right direction', () => {
        const rotation: Rotation3 = { yaw: Math.PI / 2, pitch: 0, roll: 0 };
        const result = rotationToDirection(rotation);
        
        expect(result.x).toBeCloseTo(1, 5);
        expect(result.y).toBeCloseTo(0, 5);
        expect(result.z).toBeCloseTo(0, 5);
    });

    it('converts 90° pitch (looking down) to down direction', () => {
        const rotation: Rotation3 = { yaw: 0, pitch: Math.PI / 2, roll: 0 };
        const result = rotationToDirection(rotation);
        
        expect(result.x).toBeCloseTo(0, 5);
        expect(result.y).toBeCloseTo(1, 5);
        expect(result.z).toBeCloseTo(0, 5);
    });
});
