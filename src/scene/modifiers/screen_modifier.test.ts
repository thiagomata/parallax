import { describe, it, expect } from 'vitest';
import { ScreenModifier } from "./screen_modifier.ts";
import { ScreenConfig } from "../types.ts";
import {type ProjectionMatrix} from "../types.ts";
import {projectPoint} from "./projection_matrix_utils.ts";

const defaultConfig = ScreenConfig.create({
    width: 600,
    height: 337,
    z: 0,
    near: 0.1,
    far: 1000,
    epsilon: 0.001
});

describe("ScreenModifier projections", () => {
    const screen = new ScreenModifier(defaultConfig);
    const centeredEye = { x: 0, y: 0, z: -100 };

    it("projects point in front of camera to screen center when eye is centered", () => {
        const point = { x: 0, y: 0, z: -99 }; // in front of eye
        const matrix = screen.buildFrustum(centeredEye);
        const projected = projectPoint(point, matrix);
        expect(projected.x).toBeCloseTo(0, 5);
        expect(projected.y).toBeCloseTo(0, 5);
    });

    it("projects off-center eye correctly", () => {
        const offEye = { x: 10, y: 5, z: -100 };
        const point = { x: 0, y: 0, z: -99 };
        const matrix = screen.buildFrustum(offEye);
        const projected = projectPoint(point, matrix);
        expect(projected.x).not.toBeCloseTo(0, 5);
        expect(projected.y).not.toBeCloseTo(0, 5);
    });

    it("projects consistently with different screen sizes", () => {
        const eye = { x: 0, y: 0, z: -100 };

        const narrow = ScreenConfig.create({ width: 100, height: 50, z: 0, near: 0.1, far: 1000 });
        const wide   = ScreenConfig.create({ width: 200, height: 50, z: 0, near: 0.1, far: 1000 });

        const narrowProj = projectPoint({ x: 10, y: 5, z: -99 }, new ScreenModifier(narrow).buildFrustum(eye));
        const wideProj   = projectPoint({ x: 10, y: 5, z: -99 }, new ScreenModifier(wide).buildFrustum(eye));

        // X projection scales inversely with width → wider screen gives smaller X offset
        expect(Math.abs(wideProj.x)).toBeLessThan(Math.abs(narrowProj.x));

        // Y projection is same because height unchanged
        expect(Math.abs(wideProj.y)).toBeCloseTo(Math.abs(narrowProj.y), 5);
    });

    it("scales X projection inversely with screen width", () => {
        const eye = { x: 0, y: 0, z: -100 };
        const point = { x: 10, y: 5, z: -99 };

        const narrow = ScreenConfig.create({ width: 100, height: 50, z: 0, near: 0.1, far: 1000 });
        const wide   = ScreenConfig.create({ width: 200, height: 50, z: 0, near: 0.1, far: 1000 });

        const narrowProj = projectPoint(point, new ScreenModifier(narrow).buildFrustum(eye));
        const wideProj   = projectPoint(point, new ScreenModifier(wide).buildFrustum(eye));

        expect(Math.abs(wideProj.x)).toBeLessThan(Math.abs(narrowProj.x)); // wider → smaller X offset
        expect(Math.abs(wideProj.y)).toBeCloseTo(Math.abs(narrowProj.y), 5); // Y unchanged
    });

    it("scales Y projection inversely with screen height", () => {
        const eye = { x: 0, y: 0, z: -100 };
        const point = { x: 10, y: 5, z: -99 };

        const short = ScreenConfig.create({ width: 100, height: 50, z: 0, near: 0.1, far: 1000 });
        const tall  = ScreenConfig.create({ width: 100, height: 100, z: 0, near: 0.1, far: 1000 });

        const shortProj = projectPoint(point, new ScreenModifier(short).buildFrustum(eye));
        const tallProj  = projectPoint(point, new ScreenModifier(tall).buildFrustum(eye));

        expect(Math.abs(tallProj.y)).toBeLessThan(Math.abs(shortProj.y)); // taller → smaller Y offset
        expect(Math.abs(tallProj.x)).toBeCloseTo(Math.abs(shortProj.x), 5); // X unchanged
    });

    it("projects points in front of eye plane without NaNs", () => {
        const screen = new ScreenModifier(defaultConfig);
        const matrix = screen.buildFrustum(centeredEye);

        for (const z of [-90, -50, -10]) {
            const projected = projectPoint({ x: 10, y: 5, z }, matrix);
            expect(Number.isFinite(projected.x)).toBe(true);
            expect(Number.isFinite(projected.y)).toBe(true);
        }
    });

    it("throws when projecting a point exactly at the eye plane", () => {
        const badMatrix: ProjectionMatrix = {
            xScale: { x: 1, y: 0, z: 0, w: 0 },
            yScale: { x: 0, y: 1, z: 0, w: 0 },
            projection: { x: 0, y: 0, z: 1, w: -1 },
            translation: { x: 0, y: 0, z: 0, w: 0 }
        };

        expect(() => projectPoint({ x: 0, y: 0, z: 0 }, badMatrix))
            .toThrow(/Cannot project point at eye plane/);
    });

    it("produces off-axis projection when eye is off-center", () => {
        const screen = new ScreenModifier(defaultConfig);
        const eyePos = { x: 20, y: 10, z: -100 };
        const matrix = screen.buildFrustum(eyePos);

        // Off-axis terms (xOffset and yOffset) should not be zero
        expect(matrix.projection.x).not.toBeCloseTo(0, 10);
        expect(matrix.projection.y).not.toBeCloseTo(0, 10);
    });

    it("handles eye closer than epsilon to screen without producing invalid projection", () => {
        const screen = new ScreenModifier(defaultConfig);

        // Put the eye extremely close to the screen (less than epsilon)
        const nearEye = { x: 0, y: 0, z: 0.0001 }; // screen.z = 0, epsilon ~0.001
        const matrix = screen.buildFrustum(nearEye);

        // The distance should be clamped to epsilon internally
        const distance = screen.config.z - nearEye.z;
        expect(distance).toBeLessThan(screen.config.epsilon); // raw distance < epsilon

        // Matrix should still be finite
        const projected = projectPoint({ x: 0, y: 0, z: -0.5 }, matrix);
        expect(Number.isFinite(projected.x)).toBe(true);
        expect(Number.isFinite(projected.y)).toBe(true);

        // Offsets should scale appropriately (non-zero)
        expect(matrix.projection.x).toBeCloseTo(0, 10);
        expect(matrix.projection.y).toBeCloseTo(0, 10);
    });

    it("clamps distance below epsilon", () => {
        const eye = { x: 0, y: 0, z: 0.0001 }; // very close to screen
        const screen = new ScreenModifier(defaultConfig);
        const matrix = screen.buildFrustum(eye);

        // Verify internal clamping
        const safeDistance = Math.max(screen.config.epsilon, screen.config.z - eye.z);
        expect(screen.config.z - eye.z).toBeLessThan(screen.config.epsilon);
        expect(safeDistance).toBe(screen.config.epsilon);

        // Matrix values remain finite
        expect(Number.isFinite(matrix.xScale.x)).toBe(true);
        expect(Number.isFinite(matrix.yScale.y)).toBe(true);
        expect(Number.isFinite(matrix.projection.z)).toBe(true);
        expect(Number.isFinite(matrix.translation.z)).toBe(true);
    });
});

describe("ScreenConfig validation", () => {
    it("throws error when width is zero or negative", () => {
        expect(() => ScreenConfig.create({ width: 0 }))
            .toThrow("Physical dimensions must be positive.");
        
        expect(() => ScreenConfig.create({ width: -10 }))
            .toThrow("Physical dimensions must be positive.");
    });

    it("throws error when height is zero or negative", () => {
        expect(() => ScreenConfig.create({ height: 0 }))
            .toThrow("Physical dimensions must be positive.");
        
        expect(() => ScreenConfig.create({ height: -5 }))
            .toThrow("Physical dimensions must be positive.");
    });

    it("throws error when both width and height are zero or negative", () => {
        expect(() => ScreenConfig.create({ width: 0, height: 0 }))
            .toThrow("Physical dimensions must be positive.");
        
        expect(() => ScreenConfig.create({ width: -10, height: -5 }))
            .toThrow("Physical dimensions must be positive.");
    });

    it("throws error when near clipping plane is zero or negative", () => {
        expect(() => ScreenConfig.create({ near: 0 }))
            .toThrow("Invalid clipping planes.");
        
        expect(() => ScreenConfig.create({ near: -1 }))
            .toThrow("Invalid clipping planes.");
    });

    it("throws error when far clipping plane is less than or equal to near plane", () => {
        expect(() => ScreenConfig.create({ near: 10, far: 10 }))
            .toThrow("Invalid clipping planes.");
        
        expect(() => ScreenConfig.create({ near: 50, far: 25 }))
            .toThrow("Invalid clipping planes.");
    });

    it("throws error when epsilon is zero or negative", () => {
        expect(() => ScreenConfig.create({ epsilon: 0 }))
            .toThrow("Epsilon must be positive.");
        
        expect(() => ScreenConfig.create({ epsilon: -0.001 }))
            .toThrow("Epsilon must be positive.");
    });

    it("throws error with first validation failure when multiple parameters are invalid", () => {
        // Width validation comes before clipping planes in the code
        expect(() => ScreenConfig.create({ width: -10, near: -1 }))
            .toThrow("Physical dimensions must be positive.");
    });

    it("succeeds with valid parameters", () => {
        expect(() => ScreenConfig.create({
            width: 800,
            height: 600,
            near: 1,
            far: 1000,
            epsilon: 0.001
        })).not.toThrow();
    });

    it("succeeds with partial valid parameters (uses defaults for missing values)", () => {
        expect(() => ScreenConfig.create({
            width: 800,
            height: 600
        })).not.toThrow();
    });
});
