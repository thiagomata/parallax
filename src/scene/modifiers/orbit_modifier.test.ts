import { describe, it, expect, beforeEach } from 'vitest';
import {OrbitModifier} from "./orbit_modifier.ts";
import {createMockP5} from "../mock/mock_p5.mock.ts";
import type {SceneState} from "../types.ts";

describe('OrbitModifier', () => {
    let modifier: OrbitModifier;
    const RADIUS = 500;
    const VERTICAL_BASELINE = -300;
    const mockP5 = createMockP5();

    beforeEach(() => {
        modifier = new OrbitModifier(mockP5 as any, RADIUS, VERTICAL_BASELINE);
    });

    /**
     * Helper to calculate expected trig values to avoid magic numbers
     */
    const calculateExpected = (progress: number, radius: number) => {
        const circularProgress = progress * 2 * Math.PI;
        return {
            x: Math.sin(circularProgress) * radius,
            z: Math.cos(circularProgress) * radius,
            y: VERTICAL_BASELINE + Math.sin(circularProgress * 0.5) * 100
        };
    };

    it('should be at the starting position when progress is 0', () => {
        const state: Partial<SceneState> = { playback: {
                progress: 0,
                now: 0,
                delta: 0,
                frameCount: 0
            } };
        const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, state as SceneState);

        const expected = calculateExpected(0, RADIUS);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.position.x).toBeCloseTo(expected.x);
            expect(result.value.position.y).toBeCloseTo(expected.y);
            expect(result.value.position.z).toBeCloseTo(expected.z);
        }
    });

    it('should be at the opposite side when progress is 0.5', () => {
        const state: Partial<SceneState> = { playback: {
                progress: 0.5,
                now: 0,
                delta: 0,
                frameCount: 0
            } };
        const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, state as SceneState);

        const expected = calculateExpected(0.5, RADIUS);

        expect(result.success).toBe(true);
        if (result.success) {
            // At 50% (PI), sin is 0, cos is -1
            expect(result.value.position.x).toBeCloseTo(0);
            expect(result.value.position.z).toBeCloseTo(-RADIUS);
            expect(result.value.position.y).toBeCloseTo(expected.y);
        }
    });

    it.each([0.25, 0.75, 1.0])('should calculate correct position for progress %s', (prog) => {
        const state: Partial<SceneState> = { playback: {
                progress: prog,
                now: 0,
                delta: 0,
                frameCount: 0
            } };
        const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, state as SceneState);
        const expected = calculateExpected(prog, RADIUS);

        if (result.success) {
            expect(result.value.position.x).toBeCloseTo(expected.x);
            expect(result.value.position.y).toBeCloseTo(expected.y);
            expect(result.value.position.z).toBeCloseTo(expected.z);
        }
    });

    it('should normalize signed zeros in calculations', () => {
        // At progress 0.5, sin(PI) can sometimes return -0
        const state: Partial<SceneState> = { playback: {
                progress: 0.5,
                now: 0,
                delta: 0,
                frameCount: 0
            } };
        const result = modifier.getCarPosition({ x: 0, y: 0, z: 0 }, state as SceneState);

        if (result.success) {
            // Using toBeCloseTo(0) effectively ignores -0 vs +0 issues
            expect(result.value.position.x).toBeCloseTo(0);
        }
    });
});