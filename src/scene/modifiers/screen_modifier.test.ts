import { describe, it, expect } from 'vitest';
import { ScreenModifier, ScreenConfig } from "./screen_modifier.ts";
import {MatrixToArray, type ProjectionMatrix} from "../types.ts";

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

    it("should produce symmetric matrix when eye is centered", () => {
        const screen = new ScreenModifier(defaultConfig);
        const centeredEyePos = { x: 0, y: 0, z: -100 };
        const matrix = screen.buildFrustum(centeredEyePos);
        const matrixArray = MatrixToArray(matrix);
        
        // For centered eye, off-axis terms should be minimal
        // Check that off-axis terms (matrix[2] and matrix[6]) are close to zero
        expect(matrixArray[2]).toBeCloseTo(0, 10);
        expect(matrixArray[6]).toBeCloseTo(0, 10);
    });

    it("should produce off-axis matrix when eye is off-center", () => {
        const screen = new ScreenModifier(defaultConfig);
        const offCenterEyePos = { x: 20, y: 10, z: -100 };
        const matrix = screen.buildFrustum(offCenterEyePos);
        const matrixArray =MatrixToArray(matrix);
        
        // For off-center eye, off-axis terms should be non-zero
        // Note: We check that they're not close to zero
        expect(Math.abs(matrixArray[2])).toBeGreaterThan(0.001);
        expect(Math.abs(matrixArray[6])).toBeGreaterThan(0.001);
    });

    it("should handle different screen configurations", () => {
        const wideConfig: ScreenConfig = ScreenConfig.create({
            width: 200,
            height: 100,
            z: 0,
            near: 0.1,
            far: 1000
        });
        
        const screen = new ScreenModifier(wideConfig);
        const eyePos = { x: 0, y: 0, z: -100 };
        const matrix = screen.buildFrustum(eyePos);
        const matrixArray = MatrixToArray(matrix);
        
        expect(matrixArray).toBeInstanceOf(Float32Array);
        expect(matrixArray.length).toBe(16);
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

    it("should verify matrix structure is correct", () => {
        const screen = new ScreenModifier(defaultConfig);
        const eyePos = { x: 0, y: 0, z: -100 };
        const matrix = screen.buildFrustum(eyePos);

        // Standard projection matrix format check
        // First row: [2n/(r-l), 0, (r+l)/(r-l), 0]
        expect(matrix.xScale.x).toBe(2);
        expect(matrix.xScale.y).toBe(0);
        expect(matrix.xScale.z).toBe(0);
        expect(matrix.xScale.w).toBe(0);

        // Second row: [0, 2n/(t-b), (t+b)/(t-b), 0]
        expect(matrix.yScale.x).toBe(0);
        expect(matrix.yScale.y).toBeCloseTo(2.66, 1);
        expect(matrix.yScale.z).toBe(0);
        expect(matrix.yScale.w).toBe(0);

        // Third row: [0, 0, -(f+n)/(f-n), -2fn/(f-n)]
        expect(matrix.projection.x).toBe(0);
        expect(matrix.projection.y).toBe(0);
        expect(matrix.projection.z).toBeCloseTo(-1.00, 1);
        expect(matrix.projection.w).toBeCloseTo( -0.20, 1);

        // Fourth row: [0, 0, -1, 0]
        expect(matrix.translation.x).toBe(0);
        expect(matrix.translation.y).toBe(0);
        expect(matrix.translation.z).toBe(-1);
        expect(matrix.translation.w).toBeCloseTo( 0);
    });
});