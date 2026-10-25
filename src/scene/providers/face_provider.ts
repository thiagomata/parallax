import type {Face} from "../drivers/mediapipe/face.ts";
import type {FaceExpressions} from "../drivers/mediapipe/face_expressions.ts";
import type {FailableResult, TrackingStatus, VideoWidthRatio} from "../types.ts";

export interface FaceProvider {
    getFace(): FailableResult<Face<VideoWidthRatio>>
    /** Raw expressions of the last detected face; optional, providers without blendshapes omit it. */
    getExpressions?(): FaceExpressions | null;
    getStatus(): TrackingStatus;
    getVideo(): FailableResult<any>;
    init(): Promise<void>;
}