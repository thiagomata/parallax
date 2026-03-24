import type {Face} from "../drivers/mediapipe/face.ts";
import type {FailableResult, TrackingStatus} from "../types.ts";

export interface FaceProvider {
    getFace(): FailableResult<Face>
    getStatus(): TrackingStatus;
    getVideo(): FailableResult<any>;
    init(): Promise<void>;
}