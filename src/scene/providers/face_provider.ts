import type {Face} from "../drivers/mediapipe/face.ts";
import type {FailableResult, TrackingStatus, VideoWidthRatio} from "../types.ts";

export interface FaceProvider {
    getFace(): FailableResult<Face<VideoWidthRatio>>
    getStatus(): TrackingStatus;
    getVideo(): FailableResult<any>;
    init(): Promise<void>;
}