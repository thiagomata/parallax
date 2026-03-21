import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type {FailableResult, TrackingStatus} from "../../types";
import { FaceParser } from "./face_parser";
import p5 from "p5";
import type {Face} from "./face.ts";
import type {FaceProvider} from "../../providers/face_provider.ts";

export interface FaceProviderConfig {
    throttleThreshold?: number;
    videoWidth?: number;
    videoHeight?: number;
}

export class MediaPipeFaceProvider implements FaceProvider {
    private landmarker: FaceLandmarker | null = null;
    private capture: any = null;
    private status: TrackingStatus = 'IDLE';
    private parser: FaceParser;
    private readonly p: p5;
    private readonly wasmPath: string;
    private readonly modelPath: string;
    private readonly mirror: boolean;
    
    private lastFaceResult: Face | null = null;
    private consecutiveNoFaceFrames = 0;
    private readonly throttleThreshold: number;
    private readonly videoWidth: number;
    private readonly videoHeight: number;

    constructor(
        p: p5,
        wasmPath: string = "/parallax/wasm",
        modelPath: string = "/parallax/models/face_landmarker.task",
        mirror: boolean = false,
        config: FaceProviderConfig = {}
    ) {
        this.p = p;
        this.wasmPath = wasmPath;
        this.modelPath = modelPath;
        this.mirror = mirror;
        this.parser = new FaceParser({mirror: this.mirror});
        
        this.throttleThreshold = config.throttleThreshold ?? 3;
        this.videoWidth = config.videoWidth ?? 640;
        this.videoHeight = config.videoHeight ?? 480;

        // Create video capture SYNCHRONOUSLY to trigger camera permission
        this.capture = this.p.createCapture(this.p.VIDEO);
        this.capture.size(this.videoWidth, this.videoHeight);
        this.capture.hide();
        this.capture.elt.onloadedmetadata = () => {
            this.capture.play();
        };
        this.capture.elt.onerror = () => {
                this.status = 'ERROR';
        };
    }

    public setFaceParser(faceParser: FaceParser): void {
        this.parser = faceParser;
    }

    /**
     * HYDRATION
     * Loads the WASM and the Model. This is called during the
     * engine's Registration/Hydration.
     */
    async init(): Promise<void> {
        this.status = 'INITIALIZING';

        try {
            const vision = await FilesetResolver.forVisionTasks(this.wasmPath);
            this.landmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: this.modelPath },
                runningMode: "VIDEO",
                numFaces: 1
            });

            this.status = 'READY';
        } catch (e) {
            this.status = 'ERROR';
            console.warn('Camera not available, face tracking disabled:', e);
        }
    }

    /**
     * THE FRAME LOOP
     * Returns the cleaned FaceGeometry.
     * Synchronous and safe to call inside p5's draw loop.
     */
    getFace(): FailableResult<Face> {
        if (this.status !== 'READY' || !this.landmarker) {
            this.consecutiveNoFaceFrames = 0;
            return { success: false, error: 'Face tracking not ready [' + this.status + ']' };
        }

        const videoElt = this.capture?.elt as HTMLVideoElement | undefined;
        const videoReady = videoElt && videoElt.readyState >= 2;

        if (!videoReady) {
            this.consecutiveNoFaceFrames = 0;
            return { success: false, error: 'Video element not ready' };
        }

        if (this.throttleThreshold > 0 && 
            this.consecutiveNoFaceFrames >= this.throttleThreshold &&
            this.lastFaceResult !== null) {
            return { success: true, value: this.lastFaceResult };
        }

        const result = this.landmarker.detectForVideo(videoElt, performance.now());

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            this.consecutiveNoFaceFrames = 0;
            this.lastFaceResult = this.parser.parse(result.faceLandmarks[0]);
            return { success: true, value: this.lastFaceResult };
        }

        this.consecutiveNoFaceFrames++;
        return { success: false, error: 'No face detected in frame' };
    }

    getStatus(): TrackingStatus {
        return this.status;
    }

    getVideo(): FailableResult<any> {
        if (this.status !== 'READY' || !this.capture) return {
            success: false,
            error: "Video is not ready [" + this.status + "]",
        };
        const videoElt = this.capture.elt as HTMLVideoElement;
        if( !videoElt ) return {
            success: false,
            error: "Video element not ready [readyState:undefined]",
        };
        if (videoElt.readyState < 2) return {
            success: false,
            error: "Video element not ready [readyState: " + videoElt.readyState + "]",
        };
        return {
            success: true,
            value: this.capture
        };
    }
}