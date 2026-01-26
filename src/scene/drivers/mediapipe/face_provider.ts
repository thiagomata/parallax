import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FaceParser } from "./face_parser";
import type {FaceGeometry, FaceProvider, TrackingStatus} from "../../types";
import p5 from "p5";

export class MediaPipeFaceProvider implements FaceProvider {
    private landmarker: FaceLandmarker | null = null;
    private capture: any = null; // p5 Video Element
    private status: TrackingStatus = 'IDLE';
    private readonly p: p5;
    private readonly wasmPath: string;
    private readonly modelPath: string;

    constructor(
        p: p5,
        wasmPath: string = "/parallax/wasm",
        modelPath: string = "/parallax/models/face_landmarker.task"
    ) {
        this.p = p;
        this.wasmPath = wasmPath;
        this.modelPath = modelPath;
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

            // p5 creates the capture but we keep it hidden
            this.capture = this.p.createCapture(this.p.VIDEO);
            this.capture.size(640, 480);
            this.capture.hide();

            this.status = 'READY';
        } catch (e) {
            this.status = 'ERROR';
            throw e;
        }
    }

    /**
     * THE FRAME LOOP
     * Returns the cleaned FaceGeometry.
     * Synchronous and safe to call inside p5's draw loop.
     */
    getFace(): FaceGeometry | null {
        if (this.status !== 'READY' || !this.landmarker) return null;

        const videoElt = this.capture.elt as HTMLVideoElement;

        // Ensure the video is actually playing/ready before processing
        if (videoElt.readyState < 2) return null;

        const result = this.landmarker.detectForVideo(videoElt, performance.now());

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            // We immediately use our FaceParser to turn indices into semantics
            return FaceParser.parse(result.faceLandmarks[0]);
        }

        return null;
    }

    getStatus(): TrackingStatus {
        return this.status;
    }
}