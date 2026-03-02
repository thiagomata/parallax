import p5 from "p5";
import type { DataProviderBundle, FaceProvider, Vector3 } from "../types.ts";
import { MediaPipeFaceProvider } from "../drivers/mediapipe/face_provider.ts";

export interface HeadProportions {
    width: number;       // reference = 1
    heightRatio: number; // height / width
    depthRatio: number;  // depth / width
}

export interface FaceWorldData {
    // World coordinates (transformed)
    nose: Vector3;
    eyes: {
        /** the position of the left eye */
        left: Vector3;
        /** the point between the two eyes */
        middle: Vector3;
        /** the position of the right eye */
        right: Vector3;
    }
    midpoint: Vector3;
    bounds: {
        left: Vector3;
        right: Vector3;
        top: Vector3;
        bottom: Vector3;
    }

    // // Raw normalized coordinates (0-1)
    // noseRaw: Vector3;
    // leftEyeRaw: Vector3;
    // rightEyeRaw: Vector3;
    // midpointRaw: Vector3;
    // boundsLeftRaw: Vector3;
    // boundsRightRaw: Vector3;
    // boundsTopRaw: Vector3;
    // boundsBottomRaw: Vector3;

    // Rotation (radians) - YXZ
    // scale: number;
    stick: { yaw: number; pitch: number; roll: number };
}

export class HeadTrackingDataProvider implements DataProviderBundle<"headTracker", FaceWorldData> {
    readonly type = "headTracker";

    private provider: FaceProvider;
    private sceneHeadWidth: number;
    private headProportions: HeadProportions;
    private sceneId: number = -1;
    private lastFace: FaceWorldData | null = null;

    constructor(
        p: p5,
        sceneHeadWidth: number = 50, // scene units
        headProportions: HeadProportions = { width: 1, heightRatio: 1.25, depthRatio: 0.85 },
        mirror: boolean = false
    ) {
        this.provider = new MediaPipeFaceProvider(p, "/parallax/wasm", "/parallax/models/face_landmarker.task", mirror);
        this.sceneHeadWidth = sceneHeadWidth;
        this.headProportions = headProportions;
    }

    async init(): Promise<void> {
        await this.provider.init();
    }

    tick(sceneId: number): void {
        if (this.sceneId === sceneId) return;
        this.sceneId = sceneId;
        this.provider.getStatus();
    }

    getVideo(): any {
        return this.provider.getVideo();
    }

    getData(): FaceWorldData | null {
        const face = this.provider.getFace();
        if (!face) return this.lastFace;

        // 1️⃣ Determine the Z-Position (Movement, not Growth)
        // We measure how large the face is in the camera feed to decide
        // where to place the head on the scene's Z-axis.
        const rawFaceWidth = Math.abs(face.bounds.right.x - face.bounds.left.x);
        const neutralFaceWidth = 0.3; // The "normalized" size when user is at Z=0
        const movementSensitivity = 500; // How far the head travels in Z space

        // This moves the whole "Rigid Body" forward or backward
        const headGlobalZ = (rawFaceWidth - neutralFaceWidth) * movementSensitivity;

        // 2️⃣ Rigid World Mapping
        // Note: We do NOT use raw normalized coordinates to define the
        // size of the box, as that would make the head "grow."
        // We use the fixed 'sceneHeadWidth' to keep dimensions constant.
        const mapToRigidWorld = (normalizedPoint: Vector3) => {
            return {
                x: (normalizedPoint.x - 0.5) * this.sceneHeadWidth,
                y: (normalizedPoint.y - 0.5) * this.sceneHeadWidth * this.headProportions.heightRatio,
                // The Z is a combination of the global position and the local feature depth
                z: headGlobalZ + (0.5 - normalizedPoint.z) * this.sceneHeadWidth * this.headProportions.depthRatio
            };
        };

        // 3️⃣ Establish the Rigid Points
        const noseWorld = mapToRigidWorld(face.nose);
        const leftEyeWorld = mapToRigidWorld(face.eyes.left);
        const rightEyeWorld = mapToRigidWorld(face.eyes.right);
        const middileEyeWorld = mapToRigidWorld(face.eyes.midpoint);

        // Bounds are calculated once as a fixed-size container
        const boundsLeftWorld = mapToRigidWorld(face.bounds.left);
        const boundsRightWorld = mapToRigidWorld(face.bounds.right);
        const boundsTopWorld = mapToRigidWorld(face.bounds.top);
        const boundsBottomWorld = mapToRigidWorld(face.bounds.bottom);

        // 4️⃣ Rotation Logic (YXZ Order)
        // Calculate the pivot (the center of the head)
        const rotationPivot = {
            x: (boundsLeftWorld.x + boundsRightWorld.x) / 2,
            y: (boundsTopWorld.y + boundsBottomWorld.y) / 2,
            z: (boundsLeftWorld.z + boundsRightWorld.z) / 2
        };

        const eyeDistanceX = face.eyes.right.x - face.eyes.left.x;
        const eyeDistanceY = face.eyes.right.y - face.eyes.left.y;

        // Roll (Z rotation)
        const rollAngle = -Math.atan2(eyeDistanceY, eyeDistanceX);

        // Yaw and Pitch (calculated by nose offset from face center)
        const faceCenterNormalizedX = (face.bounds.left.x + face.bounds.right.x) / 2;
        const faceCenterNormalizedY = (face.bounds.top.y + face.bounds.bottom.y) / 2;

        const yawAngle = (face.nose.x - faceCenterNormalizedX) * Math.PI;
        const pitchAngle = (face.nose.y - faceCenterNormalizedY) * Math.PI;

        const applyRigidRotation = (point: Vector3) => {
            // Translate to pivot
            let localX = point.x - rotationPivot.x;
            let localY = point.y - rotationPivot.y;
            let localZ = point.z - rotationPivot.z;

            // Y - Yaw
            const cosYaw = Math.cos(yawAngle);
            const sinYaw = Math.sin(yawAngle);
            const yawX = localX * cosYaw + localZ * sinYaw;
            const yawZ = -localX * sinYaw + localZ * cosYaw;
            localX = yawX;
            localZ = yawZ;

            // X - Pitch
            const cosPitch = Math.cos(pitchAngle);
            const sinPitch = Math.sin(pitchAngle);
            const pitchY = localY * cosPitch - localZ * sinPitch;
            const pitchZ = localY * sinPitch + localZ * cosPitch;
            localY = pitchY;
            localZ = pitchZ;

            // Z - Roll
            const cosRoll = Math.cos(rollAngle);
            const sinRoll = Math.sin(rollAngle);
            const rollX = localX * cosRoll - localY * sinRoll;
            const rollY = localX * sinRoll + localY * cosRoll;
            localX = rollX;
            localY = rollY;

            // Translate back
            return {
                x: localX + rotationPivot.x,
                y: localY + rotationPivot.y,
                z: localZ + rotationPivot.z
            };
        };

        // 5️⃣ Final Output
        this.lastFace = {
            nose: applyRigidRotation(noseWorld),
            eyes: {
                left: applyRigidRotation(leftEyeWorld),
                right: applyRigidRotation(rightEyeWorld),
                middle: applyRigidRotation(middileEyeWorld),
            },
            bounds: {
                left: applyRigidRotation(boundsLeftWorld),
                right: applyRigidRotation(boundsRightWorld),
                top: applyRigidRotation(boundsTopWorld),
                bottom: applyRigidRotation(boundsBottomWorld),
            },
            midpoint: applyRigidRotation(mapToRigidWorld(face.rig.center)),
            stick: { yaw: yawAngle, pitch: pitchAngle, roll: rollAngle }
        };

        return this.lastFace;
    }
}