import type { Rotation3, Vector3 } from "../types";

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
