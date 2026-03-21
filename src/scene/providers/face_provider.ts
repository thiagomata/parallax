import type {Face} from "../drivers/mediapipe/face.ts";
import type {FailableResult, TrackingStatus} from "../types.ts";

export interface FaceProvider {
    getFace(): Face | null
    getStatus(): TrackingStatus;
    getVideo(): FailableResult<any>;
    init(): Promise<void>;
}