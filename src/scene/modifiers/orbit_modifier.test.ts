import { describe, expect, it } from "vitest";
import { OrbitModifier } from "./orbit_modifier.ts";

describe("OrbitModifier", () => {
    const mockP5 = {} as any;

    it("returns position based on progress", () => {
        const modifier = new OrbitModifier(mockP5, 100, -200, 0);
        
        const result = modifier.getCarPosition(
            { x: 0, y: 0, z: 0 },
            { playback: { progress: 0 } } as any
        );

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value?.position.x).toBeCloseTo(0);
            expect(result.value?.position.z).toBeCloseTo(100);
        }
    });

    it("returns position at progress 0.25", () => {
        const modifier = new OrbitModifier(mockP5, 100, -200, 0);
        
        const result = modifier.getCarPosition(
            { x: 0, y: 0, z: 0 },
            { playback: { progress: 0.25 } } as any
        );

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value?.position.x).toBeCloseTo(100);
            expect(result.value?.position.z).toBeCloseTo(0);
        }
    });

    describe("with rotation", () => {
        it("returns rotation when rotationSpeed > 0", () => {
            const modifier = new OrbitModifier(mockP5, 100, -200, 1);
            
            const result = modifier.getCarPosition(
                { x: 0, y: 0, z: 0 },
                { playback: { progress: 0.25 } } as any
            );

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value?.rotation).toBeDefined();
                expect(result.value?.rotation?.yaw).toBeCloseTo(Math.PI / 2);
            }
        });

        it("returns no rotation when rotationSpeed is 0", () => {
            const modifier = new OrbitModifier(mockP5, 100, -200, 0);
            
            const result = modifier.getCarPosition(
                { x: 0, y: 0, z: 0 },
                { playback: { progress: 0.25 } } as any
            );

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value?.rotation).toBeUndefined();
            }
        });

        it("rotation scales with progress and rotationSpeed", () => {
            const modifier = new OrbitModifier(mockP5, 100, -200, 2);
            
            const result = modifier.getCarPosition(
                { x: 0, y: 0, z: 0 },
                { playback: { progress: 0.5 } } as any
            );

            expect(result.success).toBe(true);
            if (result.success) {
                // progress 0.5 = PI, rotationSpeed 2 = 2*PI
                expect(result.value?.rotation?.yaw).toBeCloseTo(2 * Math.PI);
            }
        });
    });
});
