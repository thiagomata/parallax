import {describe, it, expect} from "vitest";
import {WindowConfig, DEFAULT_WINDOW_CONFIG} from "./types";

describe("WindowConfig", () => {
    describe("create - validation", () => {
        it("should create with default values", () => {
            const config = WindowConfig.create();
            
            expect(config.width).toBe(DEFAULT_WINDOW_CONFIG.width);
            expect(config.height).toBe(DEFAULT_WINDOW_CONFIG.height);
            expect(config.near).toBe(DEFAULT_WINDOW_CONFIG.near);
            expect(config.far).toBe(DEFAULT_WINDOW_CONFIG.far);
            expect(config.epsilon).toBe(DEFAULT_WINDOW_CONFIG.epsilon);
        });

        it("should create with custom width", () => {
            const config = WindowConfig.create({width: 1920});
            
            expect(config.width).toBe(1920);
            expect(config.height).toBe(DEFAULT_WINDOW_CONFIG.height);
        });

        it("should create with custom height", () => {
            const config = WindowConfig.create({height: 1080});
            
            expect(config.height).toBe(1080);
            expect(config.width).toBe(DEFAULT_WINDOW_CONFIG.width);
        });

        it("should create with custom width and height", () => {
            const config = WindowConfig.create({width: 1920, height: 1080});
            
            expect(config.width).toBe(1920);
            expect(config.height).toBe(1080);
        });

        it("should create with custom near plane", () => {
            const config = WindowConfig.create({near: 1});
            
            expect(config.near).toBe(1);
        });

        it("should create with custom far plane", () => {
            const config = WindowConfig.create({far: 5000});
            
            expect(config.far).toBe(5000);
        });

        it("should create with custom epsilon", () => {
            const config = WindowConfig.create({epsilon: 0.01});
            
            expect(config.epsilon).toBe(0.01);
        });

        it("should throw error for zero width", () => {
            expect(() => WindowConfig.create({width: 0})).toThrow("Portal width/height must be positive.");
        });

        it("should throw error for negative width", () => {
            expect(() => WindowConfig.create({width: -100})).toThrow("Portal width/height must be positive.");
        });

        it("should throw error for zero height", () => {
            expect(() => WindowConfig.create({height: 0})).toThrow("Portal width/height must be positive.");
        });

        it("should throw error for negative height", () => {
            expect(() => WindowConfig.create({height: -100})).toThrow("Portal width/height must be positive.");
        });

        it("should throw error when near is zero", () => {
            expect(() => WindowConfig.create({near: 0})).toThrow("Invalid clipping planes.");
        });

        it("should throw error when near is negative", () => {
            expect(() => WindowConfig.create({near: -1})).toThrow("Invalid clipping planes.");
        });

        it("should throw error when far equals near", () => {
            expect(() => WindowConfig.create({near: 10, far: 10})).toThrow("Invalid clipping planes.");
        });

        it("should throw error when far is less than near", () => {
            expect(() => WindowConfig.create({near: 100, far: 50})).toThrow("Invalid clipping planes.");
        });

        it("should throw error when epsilon is zero", () => {
            expect(() => WindowConfig.create({epsilon: 0})).toThrow("Invalid epsilon value.");
        });

        it("should throw error when epsilon is negative", () => {
            expect(() => WindowConfig.create({epsilon: -0.01})).toThrow("Invalid epsilon value.");
        });

        it("should throw error for both width and height invalid", () => {
            expect(() => WindowConfig.create({width: -1, height: -1})).toThrow("Portal width/height must be positive.");
        });
    });

    describe("computed properties", () => {
        it("should compute halfWidth correctly", () => {
            const config = WindowConfig.create({width: 1000});
            
            expect(config.halfWidth).toBe(500);
        });

        it("should compute halfHeight correctly", () => {
            const config = WindowConfig.create({height: 500});
            
            expect(config.halfHeight).toBe(250);
        });

        it("should compute aspectRatio correctly", () => {
            const config = WindowConfig.create({width: 1920, height: 1080});
            
            expect(config.aspectRatio).toBeCloseTo(1920 / 1080);
        });

        it("should handle 16:9 aspect ratio", () => {
            const config = WindowConfig.create({width: 1600, height: 900});
            
            expect(config.aspectRatio).toBeCloseTo(16 / 9);
        });

        it("should handle square aspect ratio", () => {
            const config = WindowConfig.create({width: 1000, height: 1000});
            
            expect(config.aspectRatio).toBe(1);
        });
    });

    describe("z property", () => {
        it("should default z to 0", () => {
            const config = WindowConfig.create();
            
            expect(config.z).toBe(0);
        });

        it("should allow custom z", () => {
            const config = WindowConfig.create({z: 100});
            
            expect(config.z).toBe(100);
        });
    });

    describe("immutability", () => {
        it("should not expose input object properties directly", () => {
            const config = WindowConfig.create({width: 800, height: 600});
            
            expect(Object.keys(config)).toContain("width");
            expect(Object.keys(config)).toContain("height");
        });
    });
});
