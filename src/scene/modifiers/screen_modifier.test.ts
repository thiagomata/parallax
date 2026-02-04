import { describe, it, expect } from 'vitest';
import { ScreenModifier, type ScreenConfig } from "./screen_modifier.ts";

describe("ScreenModifier", () => {
    const defaultConfig: ScreenConfig = {
        width: 100,
        height: 75,
        z: 0,
        near: 0.1,
        far: 1000
    };

    it("should create ScreenModifier with config", () => {
        const screen = new ScreenModifier(defaultConfig);
        expect(screen.config).toEqual(defaultConfig);
    });

    it("should return Float32Array projection matrix", () => {
        const screen = new ScreenModifier(defaultConfig);
        const eyePos = { x: 0, y: 0, z: -100 };
        const matrix = screen.buildFrustum(eyePos);
        
        expect(matrix).toBeInstanceOf(Float32Array);
        expect(matrix.length).toBe(16);
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
        
        // For centered eye, off-axis terms should be minimal
        // Check that off-axis terms (matrix[2] and matrix[6]) are close to zero
        expect(matrix[2]).toBeCloseTo(0, 10);
        expect(matrix[6]).toBeCloseTo(0, 10);
    });

    it("should produce off-axis matrix when eye is off-center", () => {
        const screen = new ScreenModifier(defaultConfig);
        const offCenterEyePos = { x: 20, y: 10, z: -100 };
        const matrix = screen.buildFrustum(offCenterEyePos);
        
        // For off-center eye, off-axis terms should be non-zero
        // Note: We check that they're not close to zero
        expect(Math.abs(matrix[2])).toBeGreaterThan(0.001);
        expect(Math.abs(matrix[6])).toBeGreaterThan(0.001);
    });

    it("should handle different screen configurations", () => {
        const wideConfig: ScreenConfig = {
            width: 200,
            height: 100,
            z: 0,
            near: 0.1,
            far: 1000
        };
        
        const screen = new ScreenModifier(wideConfig);
        const eyePos = { x: 0, y: 0, z: -100 };
        const matrix = screen.buildFrustum(eyePos);
        
        expect(matrix).toBeInstanceOf(Float32Array);
        expect(matrix.length).toBe(16);
    });

    it("should verify matrix structure is correct", () => {
        const screen = new ScreenModifier(defaultConfig);
        const eyePos = { x: 0, y: 0, z: -100 };
        const matrix = screen.buildFrustum(eyePos);
        
        // Standard projection matrix format check
        // First row: [2n/(r-l), 0, (r+l)/(r-l), 0]
        expect(matrix[0]).toBeTypeOf("number");
        expect(matrix[1]).toBe(0);
        expect(matrix[2]).toBeTypeOf("number");
        expect(matrix[3]).toBe(0);
        
        // Second row: [0, 2n/(t-b), (t+b)/(t-b), 0]
        expect(matrix[4]).toBe(0);
        expect(matrix[5]).toBeTypeOf("number");
        expect(matrix[6]).toBeTypeOf("number");
        expect(matrix[7]).toBe(0);
        
        // Third row: [0, 0, -(f+n)/(f-n), -2fn/(f-n)]
        expect(matrix[8]).toBe(0);
        expect(matrix[9]).toBe(0);
        expect(matrix[10]).toBeTypeOf("number");
        expect(matrix[11]).toBeTypeOf("number");
        
        // Fourth row: [0, 0, -1, 0]
        expect(matrix[12]).toBe(0);
        expect(matrix[13]).toBe(0);
        expect(matrix[14]).toBe(-1);
        expect(matrix[15]).toBe(0);
    });
});