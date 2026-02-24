import p5 from "p5";
import type { DataProviderBundle, FaceProvider, Vector3 } from "../types.ts";
import { MediaPipeFaceProvider } from "../drivers/mediapipe/face_provider.ts";

export interface FaceWorldData {
    nose: Vector3;
    leftEye: Vector3;
    rightEye: Vector3;
    midpoint: Vector3;
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
        depth: number = 200
    ) {
        this.provider = new MediaPipeFaceProvider(p);
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

    getData(): FaceWorldData | null {
        const face = this.provider.getFace();
        if (!face) return this.lastFace;

        const leftEye = this.toWorld(face.leftEye);
        const rightEye = this.toWorld(face.rightEye);
        const nose = this.toWorld(face.nose);
        const midpoint = this.toWorld({
            x: (face.leftEye.x + face.rightEye.x) / 2,
            y: (face.leftEye.y + face.rightEye.y) / 2,
            z: (face.leftEye.z + face.rightEye.z) / 2
        });

        const dx = face.rightEye.x - face.leftEye.x;
        const dy = face.rightEye.y - face.leftEye.y;

        this.lastFace = {
            nose,
            leftEye,
            rightEye,
            midpoint,
            scale: Math.hypot(
                (face.bounds.right.x - face.bounds.left.x) * this.width,
                (face.bounds.bottom.y - face.bounds.top.y) * this.height
            ),
            stick: {
                yaw: face.nose.x - ((face.leftEye.x + face.rightEye.x) / 2),
                pitch: face.nose.y - ((face.leftEye.y + face.rightEye.y) / 2),
                roll: Math.atan2(dy, dx)
            }
        };

        return this.lastFace;
    }

    private toWorld(point: Vector3): Vector3 {
        return {
            x: (point.x - 0.5) * this.width,
            y: (0.5 - point.y) * this.height,
            z: point.z * this.depth
        };
    }
}
