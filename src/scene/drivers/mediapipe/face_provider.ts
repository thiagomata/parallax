import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type {FailableResult, TrackingStatus} from "../../types";
import {DEFAULT_HEAD_PARSER_CONFIG, FaceParser, type HeadParserConfig} from "./face_parser";
import p5 from "p5";
import type {Face} from "./face.ts";
import type {FaceProvider} from "../../providers/face_provider.ts";
import {merge} from "../../utils/merge.ts";

export interface FaceProviderConfig extends HeadParserConfig {
    throttleThreshold: number;
    videoWidthPixels: number;
    videoHeightPixels: number;
}

export const DEFAULT_FACE_PROVIDER_CONFIG: FaceProviderConfig = {
    ...DEFAULT_HEAD_PARSER_CONFIG,
    throttleThreshold: 1000,
    videoWidthPixels: 1920,
    videoHeightPixels: 1080,
}

export class MediaPipeFaceProvider implements FaceProvider {
    private landmarker: FaceLandmarker | null = null;
    private capture: any = null;
    private status: TrackingStatus = 'IDLE';
    private parser: FaceParser;
    private readonly p: p5;
    private readonly wasmPath: string;
    private readonly modelPath: string;
    private readonly config: FaceProviderConfig;
    // private readonly mirror: boolean;
    
    private lastFaceResult: Face | null = null;
    private consecutiveNoFaceFrames = 0;
    private readonly throttleThreshold: number;
    // private readonly videoWidth: number;
    // private readonly videoHeight: number;
    private initPromise: Promise<void> | null = null;
    private initAttempt = 0;

    private debug(message: string, details?: Record<string, unknown>): void {
        void message;
        void details;
    }

    constructor(
        p: p5,
        wasmPath: string = "/parallax/wasm",
        modelPath: string = "/parallax/models/face_landmarker.task",
        config: Partial<FaceProviderConfig> = {},
        capture: any | null | undefined = undefined
    ) {
        this.p = p;
        this.config = merge(DEFAULT_FACE_PROVIDER_CONFIG, config);
        this.wasmPath = wasmPath;
        this.modelPath = modelPath;
        this.parser = new FaceParser(this.config);
        
        this.throttleThreshold = config.throttleThreshold ?? 3;

        if (capture === undefined) {
            // Create video capture SYNCHRONOUSLY to trigger camera permission
            this.capture = this.p.createCapture(this.p.VIDEO);
            this.capture.size(this.config.videoWidthPixels, this.config.videoHeightPixels);
            this.capture.hide();
            this.capture.elt.onloadedmetadata = () => {
                this.capture.play();
            };
            this.capture.elt.onerror = () => {
                    this.status = 'ERROR';
            };
        } else {
            this.capture = capture;
        }
    }

    public setCapture(capture: any | null): void {
        this.capture = capture;
    }

    private getVideoElt(source: any): HTMLVideoElement | null {
        if (!source) return null;
        if (typeof source !== "object") return null;
        const candidate = source as { elt?: unknown; node?: unknown };
        if (candidate.elt && typeof candidate.elt === "object") {
            return candidate.elt as HTMLVideoElement;
        }
        if (candidate.node && typeof candidate.node === "object" && "elt" in (candidate.node as Record<string, unknown>)) {
            return (candidate.node as { elt?: HTMLVideoElement }).elt ?? null;
        }
        return null;
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
        await this.ensureInit();
    }

    /**
     * THE FRAME LOOP
     * Returns the cleaned FaceGeometry.
     * Synchronous and safe to call inside p5's draw loop.
     */
    getFace(): FailableResult<Face> {
        void this.ensureInit();

        if (this.status !== 'READY' || !this.landmarker) {
            this.consecutiveNoFaceFrames = 0;
            this.debug("not ready", {
                status: this.status,
                hasLandmarker: this.landmarker !== null,
            });
            return { success: false, error: 'Face tracking not ready [' + this.status + ']' };
        }

        const videoElt = this.getVideoElt(this.capture);
        const videoSnapshot = videoElt ? {
            readyState: videoElt.readyState,
            currentTime: videoElt.currentTime,
            paused: videoElt.paused,
            ended: videoElt.ended,
            videoWidth: videoElt.videoWidth,
            videoHeight: videoElt.videoHeight,
        } : null;
        const videoReady = !!videoElt && (videoSnapshot?.readyState ?? 0) >= 2;

        if (!videoReady) {
            this.consecutiveNoFaceFrames = 0;
            this.debug("video not ready", {
                ...videoSnapshot,
            });
            return { success: false, error: 'Video element not ready' };
        }

        if (this.throttleThreshold > 0 && 
            this.consecutiveNoFaceFrames >= this.throttleThreshold &&
            this.lastFaceResult !== null) {
            this.debug("reusing last face result", {
                consecutiveNoFaceFrames: this.consecutiveNoFaceFrames,
                throttleThreshold: this.throttleThreshold,
            });
            return { success: true, value: this.lastFaceResult };
        }

        this.debug("detecting frame", {
            ...videoSnapshot,
            consecutiveNoFaceFrames: this.consecutiveNoFaceFrames,
        });
        const result = this.landmarker.detectForVideo(videoElt, performance.now());

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            this.consecutiveNoFaceFrames = 0;
            this.lastFaceResult = this.parser.parse(result.faceLandmarks[0]);
            this.debug("face detected", {
                faces: result.faceLandmarks.length,
                landmarks: result.faceLandmarks[0].length,
            });
            return { success: true, value: this.lastFaceResult };
        }

        this.consecutiveNoFaceFrames++;
        this.debug("no face detected", {
            consecutiveNoFaceFrames: this.consecutiveNoFaceFrames,
        });
        return { success: false, error: 'No face detected in frame' };
    }

    getStatus(): TrackingStatus {
        return this.status;
    }

    getVideo(): FailableResult<any> {
        void this.ensureInit();

        if (this.status !== 'READY' || !this.capture) return {
            success: false,
            error: "Video is not ready [" + this.status + "]",
        };
        const videoElt = this.getVideoElt(this.capture);
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

    private async ensureInit(): Promise<void> {
        if (this.landmarker && this.status === 'READY') {
            return;
        }
        if (this.initPromise) {
            return this.initPromise;
        }

        const attempt = ++this.initAttempt;
        this.status = 'INITIALIZING';
        this.debug("initializing", {
            wasmPath: this.wasmPath,
            modelPath: this.modelPath,
            mirror: this.config.mirror,
            videoWidth: this.config.videoWidthPixels,
            videoHeight: this.config.videoHeightPixels,
        });

        this.initPromise = (async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(this.wasmPath);
                const landmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: { modelAssetPath: this.modelPath },
                    runningMode: "VIDEO",
                    numFaces: 1
                });

                if (this.initAttempt === attempt) {
                    this.landmarker = landmarker;
                    this.status = 'READY';
                    this.debug("ready");
                }
            } catch (e) {
                if (this.initAttempt === attempt) {
                    this.status = 'ERROR';
                }
                this.debug("error while initializing", {
                    error: e instanceof Error ? e.message : String(e),
                });
                console.warn('Camera not available, face tracking disabled:', e);
            } finally {
                if (this.initAttempt === attempt) {
                    this.initPromise = null;
                }
            }
        })();

        return this.initPromise;
    }
}
