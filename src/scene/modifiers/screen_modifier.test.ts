import { describe, it, expect } from 'vitest';
import { ScreenModifier, ScreenConfig } from "./screen_modifier.ts";
import {MatrixToArray, type ProjectionMatrix, type Vector3} from "../types.ts";

describe("ScreenModifier", () => {
    const defaultConfig: ScreenConfig = ScreenConfig.create({
        width: 100,
        height: 75,
        z: 0,
        near: 0.1,
        far: 1000
    });

    it("should create ScreenModifier with config", () => {
        const screen = new ScreenModifier(defaultConfig);
        expect(screen.config).toEqual(defaultConfig);
    });

    it("should return ProjectionMatrix", () => {
        const screen = new ScreenModifier(defaultConfig);
        const eyePos = { x: 0, y: 0, z: -100 };
        const matrix = screen.buildFrustum(eyePos);

        expect(matrix).toBeDefined();
        expect(matrix?.xScale).toBeDefined()
        expect(matrix?.yScale).toBeDefined()
        expect(matrix?.projection).toBeDefined()
        expect(matrix?.translation).toBeDefined()
        expect(MatrixToArray(matrix)).toBeInstanceOf(Float32Array);
        expect(MatrixToArray(matrix).length).toBe(16);
    });

    it("should produce different matrices for different eye positions", () => {
        const screen = new ScreenModifier(defaultConfig);
        const eyePos1 = { x: 0, y: 0, z: -100 };
        const eyePos2 = { x: 10, y: 0, z: -100 };
        
        const matrix1 = screen.buildFrustum(eyePos1);
        const matrix2 = screen.buildFrustum(eyePos2);
        
        // Matrices should be different when eye position changes
        expect(matrix1).not.toEqual(matrix2);
    });

    it("should produce symmetric projection when eye is centered", () => {
        const screen = new ScreenModifier(defaultConfig);
        const centeredEyePos = { x: 0, y: 0, z: -100 };

        const matrix = screen.buildFrustum(centeredEyePos);

        // For a centered eye, off-axis projection terms must be zero
        expect(matrix.projection.x).toBeCloseTo(0, 10);
        expect(matrix.projection.y).toBeCloseTo(0, 10);

        // Sanity: core perspective terms must still be valid
        expect(matrix.projection.w).toBe(-1);
        expect(matrix.xScale.x).toBeGreaterThan(0);
        expect(matrix.yScale.y).toBeGreaterThan(0);
    });

    it("should produce off-axis projection terms when eye is off-center", () => {
        const screen = new ScreenModifier(defaultConfig);
        const offCenterEyePos = { x: 20, y: 10, z: -100 };

        const matrix = screen.buildFrustum(offCenterEyePos);

        // Off-axis frustum must introduce horizontal and vertical offsets
        expect(Math.abs(matrix.projection.x)).toBeGreaterThan(0.001);
        expect(Math.abs(matrix.projection.y)).toBeGreaterThan(0.001);

        // Sanity checks: these must stay zero in a correct matrix
        expect(matrix.xScale.z).toBe(0);
        expect(matrix.yScale.z).toBe(0);

        // Perspective divide term
        expect(matrix.projection.w).toBe(-1);
    });

    function expectedFrustum(config: ScreenConfig, eyePos: Vector3) {
        const distance = config.z - eyePos.z;
        const safeDistance =
            Math.abs(distance) < config.epsilon ? config.epsilon : distance;

        const scale = config.near / safeDistance;

        const left   = (-config.halfWidth  - eyePos.x) * scale;
        const right  = ( config.halfWidth  - eyePos.x) * scale;
        const bottom = (-config.halfHeight - eyePos.y) * scale;
        const top    = ( config.halfHeight - eyePos.y) * scale;

        return { left, right, bottom, top };
    }

    it("should produce a mathematically correct projection matrix structure", () => {
        const screen = new ScreenModifier(defaultConfig);
        const eyePos = { x: 0, y: 0, z: -100 };

        const matrix = screen.buildFrustum(eyePos);

        const { left, right, top, bottom } =
            expectedFrustum(defaultConfig, eyePos);

        const n = defaultConfig.near;
        const f = defaultConfig.far;

        // --- X scale row ---
        expect(matrix.xScale.x).toBeCloseTo((2 * n) / (right - left), 10);
        expect(matrix.xScale.y).toBe(0);
        expect(matrix.xScale.z).toBe(0);
        expect(matrix.xScale.w).toBe(0);

        // --- Y scale row ---
        expect(matrix.yScale.x).toBe(0);
        expect(matrix.yScale.y).toBeCloseTo((2 * n) / (top - bottom), 10);
        expect(matrix.yScale.z).toBe(0);
        expect(matrix.yScale.w).toBe(0);

        // --- Projection row (off-axis + depth) ---
        expect(matrix.projection.x).toBeCloseTo(
            (right + left) / (right - left),
            10
        );
        expect(matrix.projection.y).toBeCloseTo(
            (top + bottom) / (top - bottom),
            10
        );
        expect(matrix.projection.z).toBeCloseTo(
            -(f + n) / (f - n),
            10
        );
        expect(matrix.projection.w).toBe(-1);

        // --- Translation / depth row ---
        expect(matrix.translation.x).toBe(0);
        expect(matrix.translation.y).toBe(0);
        expect(matrix.translation.z).toBeCloseTo(
            (-2 * f * n) / (f - n),
            10
        );
        expect(matrix.translation.w).toBe(0);
    });

    it("matrix should be casted to array", () => {
        const matrix: ProjectionMatrix = {
            xScale: {
                x: 0,
                y: 1,
                z: 2,
                w: 3,
            },
            yScale: {
                x: 4,
                y: 5,
                z: 6,
                w: 7,
            },
            projection: {
                x: 8,
                y: 9,
                z: 10,
                w: 11,
            },
            translation: {
                x: 12,
                y: 13,
                z: 14,
                w: 15,
            }
        };
        const matrixArray = MatrixToArray(matrix);
        const expectedArray = Float32Array.from([...Array(16).keys()]);
        expect(matrixArray).toStrictEqual(expectedArray);
    });

    it("should verify projection matrix structure mathematically", () => {
        const screen = new ScreenModifier(defaultConfig);
        const eyePos = { x: 0, y: 0, z: -100 };

        const matrix = screen.buildFrustum(eyePos);

        const n = defaultConfig.near;
        const f = defaultConfig.far;

        // Compute expected frustum bounds for this eye
        const distance = defaultConfig.z - eyePos.z;
        const safeDistance = Math.max(Math.abs(distance), defaultConfig.epsilon);
        const scale = n / safeDistance;

        const left   = (-defaultConfig.halfWidth  - eyePos.x) * scale;
        const right  = ( defaultConfig.halfWidth  - eyePos.x) * scale;
        const bottom = (-defaultConfig.halfHeight - eyePos.y) * scale;
        const top    = ( defaultConfig.halfHeight - eyePos.y) * scale;

        // --- X scale row ---
        expect(matrix.xScale.x).toBeCloseTo((2 * n) / (right - left), 10);
        expect(matrix.xScale.y).toBe(0);
        expect(matrix.xScale.z).toBeCloseTo((right + left) / (right - left), 10);
        expect(matrix.xScale.w).toBe(0);

        // --- Y scale row ---
        expect(matrix.yScale.x).toBe(0);
        expect(matrix.yScale.y).toBeCloseTo((2 * n) / (top - bottom), 10);
        expect(matrix.yScale.z).toBeCloseTo((top + bottom) / (top - bottom), 10);
        expect(matrix.yScale.w).toBe(0);

        // --- Depth row ---
        expect(matrix.projection.x).toBe(0);
        expect(matrix.projection.y).toBe(0);
        expect(matrix.projection.z).toBeCloseTo(-(f + n) / (f - n), 10);
        expect(matrix.projection.w).toBe(-1);

        // --- Translation / w row ---
        expect(matrix.translation.x).toBe(0);
        expect(matrix.translation.y).toBe(0);
        expect(matrix.translation.z).toBeCloseTo(-2 * f * n / (f - n), 10);
        expect(matrix.translation.w).toBe(0);
    });


});