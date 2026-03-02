import type { Rotation3, Vector3 } from "../types";

// ========================
// Vector Math Helpers
// ========================

export function subtract(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function add(a: any, b: any) { return { x: a.x + b.x, y: a.y + b.y, z: (a.z || 0) + (b.z || 0) }; }


export function multiply(a: any, scalar: number) { return { x: a.x * scalar, y: a.y * scalar, z: (a.z || 0) * scalar }; }


export function length(v: Vector3): number {
    return Math.hypot(v.x, v.y, v.z);
}

export function normalize(v: Vector3): Vector3 {
    const len = Math.hypot(v.x, v.y, v.z);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function cross(a: Vector3, b: Vector3): Vector3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

export function dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function rotateVector(v: Vector3, r: Rotation3): Vector3 {
    const { yaw, pitch, roll } = r;

    // Yaw (Y axis)
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    const x1 = v.x * cosY - v.z * sinY;
    const z1 = v.x * sinY + v.z * cosY;
    const y1 = v.y;

    // Pitch (X axis)
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    const y2 = y1 * cosP - z1 * sinP;
    const z2 = y1 * sinP + z1 * cosP;

    // Roll (Z axis)
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);

    const x3 = x1 * cosR - y2 * sinR;
    const y3 = x1 * sinR + y2 * cosR;

    return {
        x: x3,
        y: y3,
        z: z2,
    };
}

export function composeRotation(parent: Rotation3, local: Rotation3): Rotation3 {
    return {
        yaw: parent.yaw + local.yaw,
        pitch: parent.pitch + local.pitch,
        roll: parent.roll + local.roll,
    };
}

/**
 * Compute rotation angles to face a target point from a source position.
 * Returns pitch/yaw/roll that makes the object look at the target.
 */
export function lookAtRotation(from: Vector3, to: Vector3): Rotation3 {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance === 0) {
        return { pitch: 0, yaw: 0, roll: 0 };
    }

    // Yaw (rotation around Y axis) - horizontal direction
    const yaw = Math.atan2(dx, dz);

    // Pitch (rotation around X axis) - vertical direction
    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

    return { pitch, yaw, roll: 0 };
}

/**
 * Compute direction vector from rotation angles.
 */
export function rotationToDirection(r: Rotation3): Vector3 {
    const cosP = Math.cos(r.pitch);
    const sinP = Math.sin(r.pitch);
    const cosY = Math.cos(r.yaw);
    const sinY = Math.sin(r.yaw);

    return {
        x: sinY * cosP,
        y: sinP,
        z: cosY * cosP,
    };
}

/**
 * Apply rotation in a specific order.
 */
export function applyRotationOrder(v: Vector3, r: Rotation3, order: string): Vector3 {
    switch (order) {
        case 'XYZ':
            return rotateXYZ(v, r);
        case 'YXZ':
            return rotateYXZ(v, r);
        case 'ZXY':
            return rotateZXY(v, r);
        case 'XZY':
            return rotateXZY(v, r);
        case 'YZX':
            return rotateYZX(v, r);
        case 'ZYX':
            return rotateZYX(v, r);
        default:
            return rotateYXZ(v, r); // default
    }
}

function rotateXYZ(v: Vector3, r: Rotation3): Vector3 {
    // X then Y then Z
    let { x, y, z } = v;

    // Rotate X (pitch)
    let y1 = y * Math.cos(r.pitch) - z * Math.sin(r.pitch);
    let z1 = y * Math.sin(r.pitch) + z * Math.cos(r.pitch);

    // Rotate Y (yaw)
    let x2 = x * Math.cos(r.yaw) + z1 * Math.sin(r.yaw);
    let z2 = -x * Math.sin(r.yaw) + z1 * Math.cos(r.yaw);

    // Rotate Z (roll)
    let x3 = x2 * Math.cos(r.roll) - y1 * Math.sin(r.roll);
    let y3 = x2 * Math.sin(r.roll) + y1 * Math.cos(r.roll);

    return { x: x3, y: y3, z: z2 };
}

function rotateYXZ(v: Vector3, r: Rotation3): Vector3 {
    // Y then X then Z
    let { x, y, z } = v;

    // Rotate Y (yaw)
    let x1 = x * Math.cos(r.yaw) + z * Math.sin(r.yaw);
    let z1 = -x * Math.sin(r.yaw) + z * Math.cos(r.yaw);

    // Rotate X (pitch)
    let y2 = y * Math.cos(r.pitch) - z1 * Math.sin(r.pitch);
    let z2 = y * Math.sin(r.pitch) + z1 * Math.cos(r.pitch);

    // Rotate Z (roll)
    let x3 = x1 * Math.cos(r.roll) - y2 * Math.sin(r.roll);
    let y3 = x1 * Math.sin(r.roll) + y2 * Math.cos(r.roll);

    return { x: x3, y: y3, z: z2 };
}

function rotateZXY(v: Vector3, r: Rotation3): Vector3 {
    // Z then X then Y
    let { x, y, z } = v;

    // Rotate Z (roll)
    let x1 = x * Math.cos(r.roll) - y * Math.sin(r.roll);
    let y1 = x * Math.sin(r.roll) + y * Math.cos(r.roll);

    // Rotate X (pitch)
    let y2 = y1 * Math.cos(r.pitch) - z * Math.sin(r.pitch);
    let z2 = y1 * Math.sin(r.pitch) + z * Math.cos(r.pitch);

    // Rotate Y (yaw)
    let x3 = x1 * Math.cos(r.yaw) + z2 * Math.sin(r.yaw);
    let z3 = -x1 * Math.sin(r.yaw) + z2 * Math.cos(r.yaw);

    return { x: x3, y: y2, z: z3 };
}

function rotateXZY(v: Vector3, r: Rotation3): Vector3 {
    // X then Z then Y
    let { x, y, z } = v;

    // Rotate X (pitch)
    let y1 = y * Math.cos(r.pitch) - z * Math.sin(r.pitch);
    let z1 = y * Math.sin(r.pitch) + z * Math.cos(r.pitch);

    // Rotate Z (roll)
    let x2 = x * Math.cos(r.roll) + z1 * Math.sin(r.roll);
    let z2 = -x * Math.sin(r.roll) + z1 * Math.cos(r.roll);

    // Rotate Y (yaw)
    let x3 = x2 * Math.cos(r.yaw) - y1 * Math.sin(r.yaw);
    let y3 = x2 * Math.sin(r.yaw) + y1 * Math.cos(r.yaw);

    return { x: x3, y: y3, z: z2 };
}

function rotateYZX(v: Vector3, r: Rotation3): Vector3 {
    // Y then Z then X
    let { x, y, z } = v;

    // Rotate Y (yaw)
    let x1 = x * Math.cos(r.yaw) + z * Math.sin(r.yaw);
    let z1 = -x * Math.sin(r.yaw) + z * Math.cos(r.yaw);

    // Rotate Z (roll)
    let x2 = x1 * Math.cos(r.roll) + y * Math.sin(r.roll);
    let y2 = -x1 * Math.sin(r.roll) + y * Math.cos(r.roll);

    // Rotate X (pitch)
    let y3 = y2 * Math.cos(r.pitch) - z1 * Math.sin(r.pitch);
    let z3 = y2 * Math.sin(r.pitch) + z1 * Math.cos(r.pitch);

    return { x: x2, y: y3, z: z3 };
}

function rotateZYX(v: Vector3, r: Rotation3): Vector3 {
    // Z then Y then X
    let { x, y, z } = v;

    // Rotate Z (roll)
    let x1 = x * Math.cos(r.roll) - y * Math.sin(r.roll);
    let y1 = x * Math.sin(r.roll) + y * Math.cos(r.roll);

    // Rotate Y (yaw)
    let x2 = x1 * Math.cos(r.yaw) + z * Math.sin(r.yaw);
    let z2 = -x1 * Math.sin(r.yaw) + z * Math.cos(r.yaw);

    // Rotate X (pitch)
    let y3 = y1 * Math.cos(r.pitch) - z2 * Math.sin(r.pitch);
    let z3 = y1 * Math.sin(r.pitch) + z2 * Math.cos(r.pitch);

    return { x: x2, y: y3, z: z3 };
}

// ========================
// YXZ Euler Extraction
// ========================

export function extractYXZFromBasis(right: Vector3, up: Vector3, forward: Vector3): Rotation3 {
    // Build rotation matrix (columns = right, up, forward)
    const m00 = right.x, m01 = up.x, m02 = forward.x;
    const m11 = up.y;
    const m20 = right.z, m21 = up.z, m22 = forward.z;

    // YXZ extraction formulas (intrinsic rotation)
    let pitch: number, yaw: number, roll: number;

    if (Math.abs(m21) < 0.99999) {
        // Normal case
        pitch = Math.asin(-m21);
        yaw = Math.atan2(m20, m22);
        roll = Math.atan2(m01, m11);
    } else {
        // Gimbal lock: pitch ~ +/- 90°
        pitch = Math.asin(-m21);
        yaw = Math.atan2(-m02, m00);
        roll = 0;
    }

    return { pitch, yaw, roll };
}

// 3️⃣ Midpoint helper
export function midpoint(a: Vector3, b: Vector3): Vector3 {
    return { x: (a.x + b.x)/2, y: (a.y + b.y)/2, z: (a.z + b.z)/2 };
}