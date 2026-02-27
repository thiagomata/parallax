import p5 from "p5";
import type { DataProviderBundle, FaceProvider, Vector3 } from "../types.ts";
import { MediaPipeFaceProvider } from "../drivers/mediapipe/face_provider.ts";

export interface FaceWorldData {
    // World coordinates (transformed)
    nose: Vector3;
    leftEye: Vector3;
    rightEye: Vector3;
    midpoint: Vector3;
    boundsLeft: Vector3;
    boundsRight: Vector3;
    boundsTop: Vector3;
    boundsBottom: Vector3;

    // Raw normalized coordinates (0-1)
    noseRaw: Vector3;
    leftEyeRaw: Vector3;
    rightEyeRaw: Vector3;
    midpointRaw: Vector3;
    boundsLeftRaw: Vector3;
    boundsRightRaw: Vector3;
    boundsTopRaw: Vector3;
    boundsBottomRaw: Vector3;

    // Rotation (radians) - YXZ
    scale: number;
    stick: { yaw: number; pitch: number; roll: number };
}

export class HeadTrackingDataProvider implements DataProviderBundle<"headTracker", FaceWorldData> {
    readonly type = "headTracker";

    private provider: FaceProvider;
    private width: number;
    private height: number;
    private depth: number;
    private sceneId: number = -1;
    private lastFace: FaceWorldData | null = null;

    constructor(
        p: p5,
        width: number = 400,
        height: number = 400,
        depth: number = 200,
        mirror: boolean = false
    ) {
        this.provider = new MediaPipeFaceProvider(p, "/parallax/wasm", "/parallax/models/face_landmarker.task", mirror);
        this.width = width;
        this.height = height;
        this.depth = depth;
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

        // Raw landmarks
        const noseRaw = face.nose;
        const leftEyeRaw = face.leftEye;
        const rightEyeRaw = face.rightEye;
        const boundsLeftRaw = face.bounds.left;
        const boundsRightRaw = face.bounds.right;
        const boundsTopRaw = face.bounds.top;
        const boundsBottomRaw = face.bounds.bottom;

        // Midpoints
        const midpointRaw: Vector3 = {
            x: (leftEyeRaw.x + rightEyeRaw.x) / 2,
            y: (leftEyeRaw.y + rightEyeRaw.y) / 2,
            z: (leftEyeRaw.z + rightEyeRaw.z) / 2,
        };

        const boxMidX = (boundsLeftRaw.x + boundsRightRaw.x) / 2;
        const boxMidY = (boundsTopRaw.y + boundsBottomRaw.y) / 2;

        // Yaw: nose offset from box center
        const yaw = Math.asin(Math.max(-1, Math.min(1, noseRaw.x - boxMidX)));

        // Pitch: nose offset from box center
        const pitch = Math.asin(Math.max(-1, Math.min(1, noseRaw.y - boxMidY)));

        // Roll: eye line slope
        const dy = rightEyeRaw.y - leftEyeRaw.y;
        const dx = rightEyeRaw.x - leftEyeRaw.x;
        const roll = Math.atan2(dy, dx);

        const scale = Math.hypot(
            (boundsRightRaw.x - boundsLeftRaw.x) * this.width,
            (boundsBottomRaw.y - boundsTopRaw.y) * this.height
        );

        // Transform to world coordinates
        const nose = this.toWorld(noseRaw);
        const leftEye = this.toWorld(leftEyeRaw);
        const rightEye = this.toWorld(rightEyeRaw);
        const midpoint = this.toWorld(midpointRaw);
        const boundsLeft = this.toWorld(boundsLeftRaw);
        const boundsRight = this.toWorld(boundsRightRaw);
        const boundsTop = this.toWorld(boundsTopRaw);
        const boundsBottom = this.toWorld(boundsBottomRaw);

        this.lastFace = {
            nose,
            leftEye,
            rightEye,
            midpoint,
            boundsLeft,
            boundsRight,
            boundsTop,
            boundsBottom,
            noseRaw,
            leftEyeRaw,
            rightEyeRaw,
            midpointRaw,
            boundsLeftRaw,
            boundsRightRaw,
            boundsTopRaw,
            boundsBottomRaw,
            scale,
            stick: { yaw, pitch, roll },
        };

        return this.lastFace;
    }

    private toWorld(point: Vector3): Vector3 {
        return {
            x: (point.x - 0.5) * this.width,
            y: (point.y - 0.5) * this.height,
            z: point.z * this.depth,
        };
    }
}