import type { Rotation3, Vector3 } from "../types";

export function averageVectors(vectors: Vector3[]): Vector3 {
    if (vectors.length === 0) throw new Error("Cannot average empty vector array");
    const sum = vectors.reduce(
        (acc, v) => ({
            x: acc.x + v.x,
            y: acc.y + v.y,
            z: acc.z + v.z
        }),
        { x: 0, y: 0, z: 0 }
    );
    return { x: sum.x / vectors.length, y: sum.y / vectors.length, z: sum.z / vectors.length };
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

export function computeGlobalTransform(
    localPosition: Vector3,
    localRotation: Rotation3,
    parentGlobalPosition: Vector3,
    parentGlobalRotation: Rotation3
): { globalPosition: Vector3; globalRotation: Rotation3 } {
    const rotatedPosition = rotateVector(localPosition, parentGlobalRotation);
    
    const globalPosition = {
        x: rotatedPosition.x + parentGlobalPosition.x,
        y: rotatedPosition.y + parentGlobalPosition.y,
        z: rotatedPosition.z + parentGlobalPosition.z,
    };
    
    const globalRotation = {
        yaw: localRotation.yaw + parentGlobalRotation.yaw,
        pitch: localRotation.pitch + parentGlobalRotation.pitch,
        roll: localRotation.roll + parentGlobalRotation.roll,
    };
    
    return { globalPosition, globalRotation };
}

export function lookAtRotation(
    fromPosition: Vector3,
    toPosition: Vector3,
    axis: {
        readonly x?: boolean;
        readonly y?: boolean;
        readonly z?: boolean;
    } = {x: true, y: true, z: true},
    rotate: Rotation3 = {pitch: 0, yaw: 0, roll: 0},
): Rotation3 {
    const dx = toPosition.x - fromPosition.x;
    const dy = toPosition.y - fromPosition.y;
    const dz = toPosition.z - fromPosition.z;

    // Normalize forward
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const fx = dx / len;
    const fy = dy / len;
    const fz = dz / len;

    // World up
    const upx = 0;
    const upy = 1;
    const upz = 0;

    // right = up × forward
    let rx = upy * fz - upz * fy;
    let ry = upz * fx - upx * fz;
    let rz = upx * fy - upy * fx;

    const rLen = Math.sqrt(rx*rx + ry*ry + rz*rz);
    rx /= rLen;
    ry /= rLen;
    rz /= rLen;

    // trueUp = forward × right
    // const ux = fy * rz - fz * ry;
    const uy = fz * rx - fx * rz;
    // const uz = fx * ry - fy * rx;

    // Rotation matrix
    // const m00 = rx;
    // const m01 = ux;
    const m02 = fx;
    const m10 = ry;
    const m11 = uy;
    const m12 = fy;
    // const m20 = rz;
    // const m21 = uz;
    const m22 = fz;

    let rotateX = rotate.pitch;
    let rotateY = rotate.yaw;
    let rotateZ = rotate.roll;

    if (axis?.x || axis?.y || axis?.z) {

        const pitch = Math.asin(-m12);
        const yaw = Math.atan2(m02, m22);
        const roll = Math.atan2(m10, m11);

        if (axis?.x) rotateX += pitch;
        if (axis?.y) rotateY += yaw;
        if (axis?.z) rotateZ += roll;
    }

    return {
        pitch: rotateX,
        yaw: rotateY,
        roll: rotateZ,
    };
}
//
// export function lookAtRotation(from: Vector3, to: Vector3): Rotation3 {
//     const dx = to.x - from.x;
//     const dy = to.y - from.y;
//     const dz = to.z - from.z;
//
//     const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
//
//     if (distance === 0) {
//         return { pitch: 0, yaw: 0, roll: 0 };
//     }
//
//     // Yaw (rotation around Y axis) - horizontal direction
//     const yaw = Math.atan2(dx, dz);
//
//     // Pitch (rotation around X axis) - vertical direction
//     const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
//
//     return { pitch, yaw, roll: 0 };
// }

export function normalize(v: Vector3): Vector3 {
    const len = Math.hypot(v.x, v.y, v.z);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return {x: v.x / len, y: v.y / len, z: v.z / len};
}

export function cross(a: Vector3, b: Vector3): Vector3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

export const wrapPi = (a: number) => {
    while (a <= -Math.PI) a += Math.PI;
    while (a >= Math.PI) a -= Math.PI;
    return a;
};
