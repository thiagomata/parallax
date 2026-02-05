import type { ProjectionMatrix, ProjectionMatrixComponent } from "../types.ts";

/**
 * Create a ProjectionMatrix from its four components.
 */
export function createProjectionMatrix(
    xscale: ProjectionMatrixComponent,
    yscale: ProjectionMatrixComponent,
    depth: ProjectionMatrixComponent,
    wComponent: ProjectionMatrixComponent
): ProjectionMatrix {
    return { xScale: xscale, yScale: yscale, projection: depth, translation: wComponent };
}

/**
 * Create a ProjectionMatrix from a Float32Array (column-major 4x4 matrix).
 */
export function fromFloat32Array(array: Float32Array): ProjectionMatrix {
    if (array.length !== 16) {
        throw new Error(`Float32Array must have exactly 16 elements, got ${array.length}`);
    }

    return {
        xScale: { x: array[0], y: array[1], z: array[2], w: array[3] },     // xscale - Column 0
        yScale: { x: array[4], y: array[5], z: array[6], w: array[7] },     // yscale - Column 1
        projection: { x: array[8], y: array[9], z: array[10], w: array[11] },   // depth - Column 2
        translation: { x: array[12], y: array[13], z: array[14], w: array[15] }  // wComponent - Column 3
    };
}

/**
 * Create a ProjectionMatrix from off-axis frustum parameters.
 * This is the standard way to create projection matrices for this library.
 */
export function projectionMatrixFromFrustum(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
): ProjectionMatrix {
    const xscale = {
        x: 2 * near / (right - left),
        y: 0,
        z: (right + left) / (right - left),
        w: 0
    };

    const yscale = {
        x: 0,
        y: 2 * near / (top - bottom),
        z: (top + bottom) / (top - bottom),
        w: 0
    };

    const depth = {
        x: 0,
        y: 0,
        z: -(far + near) / (far - near),
        w: -2 * far * near / (far - near)
    };

    const wComponent = {
        x: 0,
        y: 0,
        z: -1,
        w: 0
    };

    return { xScale: xscale, yScale: yscale, projection: depth, translation: wComponent };
}

/**
 * Create a symmetric projection matrix (for simplified use cases).
 */
export function projectionMatrixFromFrustumSymmetric(
    width: number,
    height: number,
    near: number,
    far: number
): ProjectionMatrix {
    const left = -width / 2;
    const right = width / 2;
    const bottom = -height / 2;
    const top = height / 2;
    
    return projectionMatrixFromFrustum(left, right, bottom, top, near, far);
}

/**
 * Create an identity projection matrix (useful for testing).
 */
export function createIdentityProjectionMatrix(): ProjectionMatrix {
    return createProjectionMatrix(
        { x: 1, y: 0, z: 0, w: 0 },     // xscale
        { x: 0, y: 1, z: 0, w: 0 },     // yscale
        { x: 0, y: 0, z: 1, w: 0 },     // depth
        { x: 0, y: 0, z: 0, w: 1 }      // wComponent
    );
}

/**
 * Create a scaling projection matrix (useful for testing).
 */
export function createScalingProjectionMatrix(scaleX: number, scaleY: number, scaleZ: number = 1): ProjectionMatrix {
    return createProjectionMatrix(
        { x: scaleX, y: 0, z: 0, w: 0 },     // xscale
        { x: 0, y: scaleY, z: 0, w: 0 },     // yscale
        { x: 0, y: 0, z: scaleZ, w: 0 },     // depth
        { x: 0, y: 0, z: 0, w: 1 }           // wComponent
    );
}

/**
 * Create a zero projection matrix (useful for testing).
 */
export function createZeroProjectionMatrix(): ProjectionMatrix {
    return createProjectionMatrix(
        { x: 0, y: 0, z: 0, w: 0 },     // xscale
        { x: 0, y: 0, z: 0, w: 0 },     // yscale
        { x: 0, y: 0, z: 0, w: 0 },     // depth
        { x: 0, y: 0, z: 0, w: 0 }      // wComponent
    );
}