import { describe, it, expect } from 'vitest';
import {
    createProjectionMatrix,
    projectPoint,
    fromFloat32Array,
    projectionMatrixFromFrustum,
    projectionMatrixFromFrustumSymmetric,
    createIdentityProjectionMatrix,
    createScalingProjectionMatrix,
    createZeroProjectionMatrix, MatrixToArray
} from './projection_matrix_utils.ts';
import type {ProjectionMatrix, ProjectionMatrixComponent, Vector3} from '../types.ts';

describe('projection_matrix_utils', () => {
    describe('createProjectionMatrix', () => {
        it('creates a projection matrix from four components', () => {
            const xScale: ProjectionMatrixComponent = { x: 0, y: 1, z: 2, w: 3 };
            const yScale: ProjectionMatrixComponent = { x: 10, y: 11, z: 12, w: 13 };
            const projection: ProjectionMatrixComponent = { x: 20, y: 21, z: 22, w: 23 };
            const translation: ProjectionMatrixComponent = { x: 30, y: 31, z: 32, w: 33 };

            const matrix = createProjectionMatrix(xScale, yScale, projection, translation);

            expect(matrix.xScale).toEqual(xScale);
            expect(matrix.yScale).toEqual(yScale);
            expect(matrix.projection).toEqual(projection);
            expect(matrix.translation).toEqual(translation);
        });
    });


    it("matrix should be casted to array", () => {
        const matrix: ProjectionMatrix = {
            xScale: { x: 0, y: 1, z: 2, w: 3 },
            yScale: { x: 4, y: 5, z: 6, w: 7 },
            projection: { x: 8, y: 9, z: 10, w: 11 },
            translation: { x: 12, y: 13, z: 14, w: 15 }
        };
        const matrixArray = MatrixToArray(matrix);
        const expectedArray = Float32Array.from([...Array(16).keys()]);
        expect(matrixArray).toStrictEqual(expectedArray);
    });

    describe('projectPoint', () => {
        it('projects a point with identity matrix', () => {
            const identity = createIdentityProjectionMatrix();
            const point: Vector3 = { x: 10, y: 5, z: -1 };

            const projected = projectPoint(point, identity);

            expect(projected.x).toBeCloseTo(10, 5);
            expect(projected.y).toBeCloseTo(5, 5);
        });

        it('projects a point with scaling matrix', () => {
            const scaling = createScalingProjectionMatrix(2, 3, 1);
            const point: Vector3 = { x: 10, y: 5, z: -1 };

            const projected = projectPoint(point, scaling);

            expect(projected.x).toBeCloseTo(20, 5);
            expect(projected.y).toBeCloseTo(15, 5);
        });

        it('throws error when point is at eye plane (z = 0)', () => {
            const identity = createIdentityProjectionMatrix();
            const point: Vector3 = { x: 0, y: 0, z: 0 };

            expect(() => projectPoint(point, identity))
                .toThrow('Cannot project point at eye plane (z=0 leads to w≈0).');
        });

        it('throws error when point is very close to eye plane', () => {
            const identity = createIdentityProjectionMatrix();
            const point: Vector3 = { x: 0, y: 0, z: 1e-7 }; // Very close to zero

            expect(() => projectPoint(point, identity))
                .toThrow('Cannot project point at eye plane');
        });

        it('projects point with non-zero projection offsets', () => {
            const matrix = createProjectionMatrix(
                { x: 2, y: 0, z: 0, w: 0 },
                { x: 0, y: 2, z: 0, w: 0 },
                { x: 0.5, y: 0.3, z: 1, w: 0 },
                { x: 0, y: 0, z: 0, w: 1 }
            );

            const point: Vector3 = { x: 10, y: 5, z: -2 };
            const projected = projectPoint(point, matrix);

            // x = (x * xScale.x + projection.x * z) / w
            // x = (10 * 2 + 0.5 * -2) / 2 = (20 - 1) / 2 = 9.5
            expect(projected.x).toBeCloseTo(9.5, 5);
            
            // y = (y * yScale.y + projection.y * z) / w
            // y = (5 * 2 + 0.3 * -2) / 2 = (10 - 0.6) / 2 = 4.7
            expect(projected.y).toBeCloseTo(4.7, 5);
        });
    });

    describe('fromFloat32Array', () => {
        it('creates projection matrix from column-major Float32Array', () => {
            const array = new Float32Array([
                0,  1,   2,  3,   // Column 0
                10, 11, 12, 13,   // Column 0
                20, 21, 22, 23,   // Column 0
                30, 31, 32, 33,   // Column 0
            ]);

            const matrix = fromFloat32Array(array);

            const xScale: ProjectionMatrixComponent = { x: 0, y: 1, z: 2, w: 3 };
            const yScale: ProjectionMatrixComponent = { x: 10, y: 11, z: 12, w: 13 };
            const projection: ProjectionMatrixComponent = { x: 20, y: 21, z: 22, w: 23 };
            const translation: ProjectionMatrixComponent = { x: 30, y: 31, z: 32, w: 33 };

            expect(matrix.xScale).toEqual(xScale);
            expect(matrix.yScale).toEqual(yScale);
            expect(matrix.projection).toEqual(projection);
            expect(matrix.translation).toEqual(translation);
        });

        it('throws error when array length is not 16', () => {
            const shortArray = new Float32Array([1, 2, 3, 4]);
            
            expect(() => fromFloat32Array(shortArray))
                .toThrow('Float32Array must have exactly 16 elements, got 4');
        });

        it('throws error when array length is more than 16', () => {
            const longArray = new Float32Array(32);
            
            expect(() => fromFloat32Array(longArray))
                .toThrow('Float32Array must have exactly 16 elements, got 32');
        });
    });

    describe('projectionMatrixFromFrustum', () => {
        it('creates projection matrix from frustum parameters', () => {
            const matrix = projectionMatrixFromFrustum(-1, 1, -0.5, 0.5, 0.1, 100);

            expect(matrix.xScale.x).toBeCloseTo(0.1, 5); // 2 * near / (right - left) = 0.2 / 2 = 0.1
            expect(matrix.yScale.y).toBeCloseTo(0.2, 5); // 2 * near / (top - bottom) = 0.2 / 1 = 0.2
            expect(matrix.projection.x).toBeCloseTo(0, 5);   // (right + left) / (right - left) = 0 / 2 = 0
            expect(matrix.projection.y).toBeCloseTo(0, 5);   // (top + bottom) / (top - bottom) = 0 / 1 = 0
            expect(matrix.projection.z).toBeCloseTo(-1.002, 3); // -(far + near) / (far - near) = -(100.1) / 99.9
            expect(matrix.projection.w).toBe(-1);
            expect(matrix.translation.z).toBeCloseTo(-0.2002, 3); // -(2 * far * near) / (far - near)
        });

        it('creates off-axis projection matrix', () => {
            const matrix = projectionMatrixFromFrustum(-2, 1, -1, 0.5, 0.1, 100);

            expect(matrix.projection.x).not.toBeCloseTo(0, 5); // Non-zero xOffset for off-axis
            expect(matrix.projection.y).not.toBeCloseTo(0, 5); // Non-zero yOffset for off-axis
        });

        it('handles asymmetric frustum correctly', () => {
            const matrix = projectionMatrixFromFrustum(-3, 1, -2, 1, 0.1, 100);

            expect(matrix.projection.x).toBeCloseTo(-0.5, 5); // (right + left) / (right - left) = (-2) / 4 = -0.5
            expect(matrix.projection.y).toBeCloseTo(-0.33333, 5); // (top + bottom) / (top - bottom) = (-1) / 3 ≈ -0.33333
        });
    });

    describe('projectionMatrixFromFrustumSymmetric', () => {
        it('creates symmetric projection matrix', () => {
            const matrix = projectionMatrixFromFrustumSymmetric(2, 1, 0.1, 100);

            // Should be equivalent to projectionMatrixFromFrustum(-1, 1, -0.5, 0.5, 0.1, 100)
            const expectedMatrix = projectionMatrixFromFrustum(-1, 1, -0.5, 0.5, 0.1, 100);

            expect(matrix.xScale.x).toBeCloseTo(expectedMatrix.xScale.x, 5);
            expect(matrix.yScale.y).toBeCloseTo(expectedMatrix.yScale.y, 5);
            expect(matrix.projection.x).toBeCloseTo(expectedMatrix.projection.x, 5);
            expect(matrix.projection.y).toBeCloseTo(expectedMatrix.projection.y, 5);
            expect(matrix.projection.z).toBeCloseTo(expectedMatrix.projection.z, 5);
            expect(matrix.translation.z).toBeCloseTo(expectedMatrix.translation.z, 5);
        });

        it('produces zero offsets for symmetric frustum', () => {
            const matrix = projectionMatrixFromFrustumSymmetric(2, 1, 0.1, 100);

            expect(matrix.projection.x).toBeCloseTo(0, 5);
            expect(matrix.projection.y).toBeCloseTo(0, 5);
        });
    });

    describe('createIdentityProjectionMatrix', () => {
        it('creates identity projection matrix', () => {
            const matrix = createIdentityProjectionMatrix();

            expect(matrix.xScale).toEqual({ x: 1, y: 0, z: 0, w: 0 });
            expect(matrix.yScale).toEqual({ x: 0, y: 1, z: 0, w: 0 });
            expect(matrix.projection).toEqual({ x: 0, y: 0, z: 1, w: 0 });
            expect(matrix.translation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
        });
    });

    describe('createScalingProjectionMatrix', () => {
        it('creates scaling projection matrix with 2D scale', () => {
            const matrix = createScalingProjectionMatrix(2, 3);

            expect(matrix.xScale).toEqual({ x: 2, y: 0, z: 0, w: 0 });
            expect(matrix.yScale).toEqual({ x: 0, y: 3, z: 0, w: 0 });
            expect(matrix.projection).toEqual({ x: 0, y: 0, z: 1, w: 0 });
            expect(matrix.translation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
        });

        it('creates scaling projection matrix with 3D scale', () => {
            const matrix = createScalingProjectionMatrix(2, 3, 4);

            expect(matrix.xScale).toEqual({ x: 2, y: 0, z: 0, w: 0 });
            expect(matrix.yScale).toEqual({ x: 0, y: 3, z: 0, w: 0 });
            expect(matrix.projection).toEqual({ x: 0, y: 0, z: 4, w: 0 });
            expect(matrix.translation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
        });
    });

    describe('createZeroProjectionMatrix', () => {
        it('creates zero projection matrix', () => {
            const matrix = createZeroProjectionMatrix();

            expect(matrix.xScale).toEqual({ x: 0, y: 0, z: 0, w: 0 });
            expect(matrix.yScale).toEqual({ x: 0, y: 0, z: 0, w: 0 });
            expect(matrix.projection).toEqual({ x: 0, y: 0, z: 0, w: 0 });
            expect(matrix.translation).toEqual({ x: 0, y: 0, z: 0, w: 0 });
        });
    });

    describe('integration tests', () => {
        it('correctly projects points through frustum matrix', () => {
            // Create a simple frustum and test projection
            const matrix = projectionMatrixFromFrustum(-1, 1, -1, 1, 1, 100);
            
            // Point at near plane should project to center
            const nearPoint: Vector3 = { x: 0, y: 0, z: -1 };
            const projected = projectPoint(nearPoint, matrix);
            
            expect(projected.x).toBeCloseTo(0, 5);
            expect(projected.y).toBeCloseTo(0, 5);
        });

        it('maintains relative positions in projection', () => {
            const matrix = projectionMatrixFromFrustum(-1, 1, -1, 1, 1, 100);
            
            const leftPoint: Vector3 = { x: -0.5, y: 0, z: -2 };
            const rightPoint: Vector3 = { x: 0.5, y: 0, z: -2 };
            
            const leftProjected = projectPoint(leftPoint, matrix);
            const rightProjected = projectPoint(rightPoint, matrix);
            
            expect(leftProjected.x).toBeLessThan(0);
            expect(rightProjected.x).toBeGreaterThan(0);
            expect(Math.abs(leftProjected.x)).toBeCloseTo(Math.abs(rightProjected.x), 5);
        });
    });
});