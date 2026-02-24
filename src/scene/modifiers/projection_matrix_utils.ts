import {
    type ProjectionMatrix,
    type ProjectionMatrixComponent,
    type ResolvedProjection,
    type Vector3, WindowConfig
} from "../types.ts";

/**
 * Zero-recalculation Off-Axis Utility.
 */
export function calculateOffAxisMatrix(
    eye: ResolvedProjection,
    screen: ResolvedProjection,
    window: WindowConfig
): ProjectionMatrix {
    const dx = eye.position.x - screen.position.x;
    const dy = eye.position.y - screen.position.y;

    const distance = Math.abs(eye.position.z - screen.position.z);
    const dz = distance < window.epsilon ? window.epsilon : distance;

    const scale = window.near / dz;

    // Direct property access - no division/multiplication overhead here
    const left   = (-window.halfWidth - dx) * scale;
    const right  = ( window.halfWidth - dx) * scale;
    const bottom = (-window.halfHeight - dy) * scale;
    const top    = ( window.halfHeight - dy) * scale;

    return projectionMatrixFromFrustum(left, right, bottom, top, window.near, window.far);
}

/**
 * Convert ProjectionMatrix to Float32Array for P5/WebGL compatibility.
 * Returns a 16-element column-major 4x4 matrix.
 */
export function MatrixToArray(matrix: ProjectionMatrix): Float32Array {
    return new Float32Array([
        matrix.xScale.x, matrix.xScale.y, matrix.xScale.z, matrix.xScale.w,
        matrix.yScale.x, matrix.yScale.y, matrix.yScale.z, matrix.yScale.w,
        matrix.projection.x, matrix.projection.y, matrix.projection.z, matrix.projection.w,
        matrix.translation.x, matrix.translation.y, matrix.translation.z, matrix.translation.w
    ]);
}

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

export function projectPoint(p: Vector3, m: ProjectionMatrix): { x: number; y: number } {
    // Compute the clip-space w
    const w = -p.z; // or your current formula for w in the projection

    if (Math.abs(w) < 1e-6) {
        throw new Error(`Cannot project point at eye plane (z=${p.z} leads to w≈0).`);
    }

    return {
        x: (p.x * m.xScale.x + m.projection.x * p.z) / w,
        y: (p.y * m.yScale.y + m.projection.y * p.z) / w
    };
}

/**
 * Create a ProjectionMatrix from a Float32Array (column-major 4x4 matrix).
 */
export function fromFloat32Array(array: Float32Array): ProjectionMatrix {
    if (array.length !== 16) {
        throw new Error(`Float32Array must have exactly 16 elements, got ${array.length}`);
    }

    return {
        xScale: { x: array[0], y: array[1], z: array[2], w: array[3] },          // xscale - Column 0
        yScale: { x: array[4], y: array[5], z: array[6], w: array[7] },          // yscale - Column 1
        projection: { x: array[8], y: array[9], z: array[10], w: array[11] },    // projection - Column 2
        translation: { x: array[12], y: array[13], z: array[14], w: array[15] }  // translation - Column 3
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
    const xScale = (2 * near) / (right - left);
    const yScale = (2 * near) / (top - bottom);

    const xOffset = (right + left) / (right - left);
    const yOffset = (top + bottom) / (top - bottom);

    const zScale = -(far + near) / (far - near);
    const zOffset = -(2 * far * near) / (far - near);

    // Column-major decomposition
    return {
        xScale: { x: xScale, y: 0, z: 0, w: 0 },
        yScale: { x: 0, y: yScale, z: 0, w: 0 },
        projection: { x: xOffset, y: yOffset, z: zScale, w: -1 },
        translation: { x: 0, y: 0, z: zOffset, w: 0 }
    };
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
 * Creates a perspective projection matrix similar to p5's default perspective().
 * This is easier to use than calculateOffAxisMatrix when you just want standard perspective.
 * @param fov - Field of view in radians (default p5 is PI/3 = 60 degrees)
 * @param aspect - Aspect ratio (width / height)
 * @param near - Near clipping plane (p5 default is 0.1)
 * @param far - Far clipping plane (p5 default is 5000)
 */
export function createPerspectiveMatrix(
    fov: number = Math.PI / 3,
    aspect: number,
    near: number = 0.1,
    far: number = 5000
): ProjectionMatrix {
    const top = near * Math.tan(fov / 2);
    const right = top * aspect;
    const bottom = -top;
    const left = -right;

    const matrix = projectionMatrixFromFrustum(left, right, bottom, top, near, far);
    
    // Flip Y axis to match p5's default coordinate system
    // This fixes textures being upside down with custom projection
    return {
        xScale: matrix.xScale,
        yScale: { ...matrix.yScale, y: -matrix.yScale.y },
        projection: { ...matrix.projection, y: -matrix.projection.y },
        translation: matrix.translation,
    };
}

/**
 * Create an identity projection matrix (useful for testing).
 */
export function createIdentityProjectionMatrix(): ProjectionMatrix {
    return createProjectionMatrix(
        { x: 1, y: 0, z: 0, w: 0 },     // xscale
        { x: 0, y: 1, z: 0, w: 0 },     // yscale
        { x: 0, y: 0, z: 1, w: 0 },     // projection
        { x: 0, y: 0, z: 0, w: 1 }      // translation
    );
}

/**
 * Create a scaling projection matrix (useful for testing).
 */
export function createScalingProjectionMatrix(scaleX: number, scaleY: number, scaleZ: number = 1): ProjectionMatrix {
    return createProjectionMatrix(
        { x: scaleX, y: 0, z: 0, w: 0 },     // xscale
        { x: 0, y: scaleY, z: 0, w: 0 },     // yscale
        { x: 0, y: 0, z: scaleZ, w: 0 },     // projection
        { x: 0, y: 0, z: 0, w: 1 }           // translation
    );
}

/**
 * Create a zero projection matrix (useful for testing).
 */
export function createZeroProjectionMatrix(): ProjectionMatrix {
    return createProjectionMatrix(
        { x: 0, y: 0, z: 0, w: 0 },     // xscale
        { x: 0, y: 0, z: 0, w: 0 },     // yscale
        { x: 0, y: 0, z: 0, w: 0 },     // projection
        { x: 0, y: 0, z: 0, w: 0 }      // translation
    );
}
