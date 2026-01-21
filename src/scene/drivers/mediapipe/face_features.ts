import type {FaceGeometry, Vector3} from "../../types";

export class FaceFeatures {
    public readonly scale: number;
    public readonly midpoint: Vector3;
    public readonly nudge: Vector3;
    public readonly stick: { yaw: number; pitch: number };
    public readonly face: FaceGeometry;
    public static readonly SCREEN_CENTER = 0.5;

    constructor(data: FaceGeometry) {
        this.face = data;
        this.midpoint = this.calculateMidpoint();
        this.scale = this.calculateScale();
        this.nudge = this.calculateNudge();
        this.stick = this.calculateStick();
    }

    private calculateMidpoint(): Vector3 {
        return {
            x: (this.face.leftEye.x + this.face.rightEye.x) / 2,
            y: (this.face.leftEye.y + this.face.rightEye.y) / 2,
            z: (this.face.leftEye.z + this.face.rightEye.z) / 2
        };
    }

    private calculateScale(): number {
        const { left, right } = this.face.bounds;
        return Math.hypot(left.x - right.x, left.y - right.y);
    }

    private calculateNudge(): Vector3 {
        return {
            x: FaceFeatures.SCREEN_CENTER - this.midpoint.x,
            y: this.midpoint.y - FaceFeatures.SCREEN_CENTER,
            z: 0
        };
    }

    private calculateStick() {
        return {
            yaw: this.face.nose.x - this.midpoint.x,
            pitch: this.face.nose.y - this.midpoint.y
        };
    }
}