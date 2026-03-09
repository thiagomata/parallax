import type {Face} from "../drivers/mediapipe/face.ts";
import type {TrackingStatus} from "../types.ts";

export interface FaceProvider {
    getFace(): Face | null
    getStatus(): TrackingStatus;
    getVideo(): any;
    init(): Promise<void>;
}