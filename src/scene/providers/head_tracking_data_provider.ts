import p5 from "p5";
import type {DataProviderBundle, DataProviderTickContext, FailableResult, TrackingStatus, Vector3, VideoSourceRef} from "../types.ts";
import { MediaPipeFaceProvider, type FaceProviderConfig } from "../drivers/mediapipe/face_provider.ts";
import type {FaceProvider} from "./face_provider.ts";
import type {Face} from "../drivers/mediapipe/face.ts";
import type { WebCamDataProvider } from "./web_cam_data_provider.ts";
import {
    SceneFace,
    SceneFaceBuilder,
    type FaceSceneConfig,
    computeDepthScale,
} from "./scene_face.ts";

/**
 * Data provider library type for head tracking.
 * Used to type the relationship between HeadTrackingDataProvider and modifiers.
 */
export type HeadTrackerDataProviderLib = {
    headTracker: DataProviderBundle<"headTracker", FaceWorldData>
};

export type ObserverDataProviderLib = {
    webCam?: DataProviderBundle<"webCam", VideoSourceRef>,
    video?: DataProviderBundle<"video", VideoSourceRef>,
    headTracker: DataProviderBundle<"headTracker", FaceWorldData>,
};

/**
 * Container for face data transformed to scene coordinates.
 * Provides access to facial features and rotation in scene units.
 */
export class FaceWorldData {
    readonly face: Face;
    readonly sceneFace: SceneFace;
    readonly midpoint: Vector3
    public constructor(
        face: Face,
        sceneFace: SceneFace,
    ) {
        this.face = face;
        this.sceneFace = sceneFace;
        this.midpoint = sceneFace.localPosition;
    }

    /**
     * Transforms a vector from face-local coordinates to scene coordinates.
     * Applies coordinate flipping and scaling to sceneHeadWidth.
     */
    private transform = (vector: Vector3) => {
        const sceneHeadWidth = this.sceneFace.headWidth;
        const scaled = {
            x: vector.x * sceneHeadWidth,
            y: vector.y * sceneHeadWidth,
            z: vector.z * sceneHeadWidth,
        };
        return {
            x: scaled.x,
            y: scaled.y,
            z: -scaled.z,
        };
    }

    public get nose() {
        return this.transform(this.face.rebase.nose)
    };

    public get eyes() {
        const self = this;
        return {
            get left(): Vector3 { return self.transform(self.face.rebase.leftEye); },
            get right(): Vector3 { return self.transform(self.face.rebase.rightEye); },
        };
    }

    public get brows() {
        const self = this;
        return {
            get left(): Vector3 { return self.transform(self.face.rebase.leftBrow); },
            get right(): Vector3 { return self.transform(self.face.rebase.rightBrow); },
        };
    }

    public get bounds() {
        const self = this;
        return {
            get left(): Vector3 { return self.transform(self.face.rebase.leftEar); },
            get right(): Vector3 { return self.transform(self.face.rebase.rightEar); },
            get top(): Vector3 { return self.transform(self.face.rebase.middleTop); },
            get bottom(): Vector3 { return self.transform(self.face.rebase.middleBottom); },
        };
    }

    /**
     * Returns rotation angles.
     */
    public get stick() {
        return {
            yaw: this.face.yaw,
            pitch: -this.face.pitch,
            roll: -this.face.roll,
        }
    }
}

export const DEFAULT_CAMERA_POSITION: Vector3 = { x: 0, y: 0, z: 300 };
export const DEFAULT_CAMERA_PANEL_POSITION: Vector3 = { x: 0, y: 0, z: 0 };

export class HeadTrackingDataProvider implements DataProviderBundle<"headTracker", FaceWorldData> {
    readonly type = "headTracker";
    readonly parentId = "webCam";
    readonly dependencies: readonly string[];

    private provider: FaceProvider;
    private webCamProvider: WebCamDataProvider | null = null;
    private sourceProviders: DataProviderBundle<any, any>[] = [];
    private readonly faceConfig: FaceProviderConfig;
    private fallbackCapture: any = null;

    /**
     * Expected width of the head projected in the screen to the zero Z level.
     * If they match, the head should have Z equals of the screen.
     * If the projected head is bigger than the expected width, head Z is bigger (closer).
     * If the projected head is smaller than the expected width, head Z is small (farther).
     * @private
     */
    readonly sceneHeadWidth: number;

    private sceneId: number = -1;
    private lastFace: FaceWorldData | null = null;
    readonly cameraPosition: Vector3;
    readonly panelPosition: Vector3;

    constructor(
        p: p5,
        sceneHeadWidth: number = 120,
        mirror: boolean = false,
        panelPosition: Vector3 = DEFAULT_CAMERA_PANEL_POSITION,
        cameraPosition: Vector3 = DEFAULT_CAMERA_POSITION,
        faceConfig: FaceProviderConfig = {},
        sourceIds: readonly string[] = ["webCam"],
    ) {
        if (sceneHeadWidth <= 0) {
            throw new Error("Invalid scene head width");
        }
        this.sceneHeadWidth = sceneHeadWidth;
        this.faceConfig = faceConfig;

        this.panelPosition  = panelPosition;
        this.cameraPosition = cameraPosition;
        this.dependencies = sourceIds;

        this.provider = new MediaPipeFaceProvider(p, "/parallax/wasm", "/parallax/models/face_landmarker.task", mirror, faceConfig, null);
    }

    async init(): Promise<void> {
        await this.provider.init();
    }

    tick(sceneId: number, context?: DataProviderTickContext): void {
        if (this.sceneId === sceneId) return;
        this.sceneId = sceneId;

        this.sourceProviders = [...(context?.dependencies ?? [])];
        this.webCamProvider = (context?.parent as WebCamDataProvider | null) ?? null;
        
        const capture = this.resolveCapture();
        
        if (this.provider instanceof MediaPipeFaceProvider) {
            this.provider.setCapture(capture);
        }

        this.provider.getStatus();
    }

    getStatus(): TrackingStatus {
        return this.provider.getStatus();
    }

    getVideo(): FailableResult<any> {
        const capture = this.resolveCapture();
        if (capture) {
            return {
                success: true,
                value: capture,
            };
        }
        if (this.webCamProvider) {
            const videoResult = this.webCamProvider.getVideo?.();
            if (videoResult && typeof videoResult === 'object' && 'success' in videoResult) {
                return videoResult as FailableResult<any>;
            }
            return { success: true, value: videoResult };
        }
        return {
            success: false,
            error: "webCam parent provider not wired yet",
        };
    }

    getData(): FaceWorldData | null {
        const result = this.getDataResult();
        return result.success ? result.value : null;
    }

    getDataResult(): FailableResult<FaceWorldData> {
        const capture = this.resolveCapture();
        if (this.provider instanceof MediaPipeFaceProvider) {
            this.provider.setCapture(capture);
        }

        const faceResult = this.provider.getFace();
        if (!faceResult.success) {
            if (this.lastFace) {
                return { success: true, value: this.lastFace };
            }
            return { success: false, error: faceResult.error };
        }

        const face = faceResult.value;
        const rotation = face.getRotation().rotation;

        const videoWidth = this.faceConfig.videoWidth ?? 1920;

        const sceneFaceConfig: FaceSceneConfig = {
            baseline: this.panelPosition,
            cameraPosition: this.cameraPosition,
            depthScale: computeDepthScale(
                this.faceConfig.physicalHeadWidth ?? 150,
                this.faceConfig.focalLength ?? 1
            ),
        };

        const sceneFace = new SceneFaceBuilder()
            .config(sceneFaceConfig)
            .actualWidth(face.width * videoWidth)
            .baselineWidth(this.sceneHeadWidth)
            .skullCenterNormalized(face.skullCenter.position)
            .rotation(rotation)
            .build();

        this.lastFace = new FaceWorldData(
            face,
            sceneFace
        );

        return { success: true, value: this.lastFace };
    }

    private resolveCapture(): any | null {
        // Priority 1: Try webcam first if available and ready
        if (this.webCamProvider) {
            const webcamStatus = typeof this.webCamProvider.getStatus === "function"
                ? this.webCamProvider.getStatus()
                : "IDLE";
            if (webcamStatus === "READY") {
                const webcamData = this.webCamProvider.getData?.();
                if (webcamData) {
                    return webcamData.node;
                }
            }
        }
        
        // Priority 2: Use fallback capture (raw p5 video) if webcam not available
        if (this.fallbackCapture) {
            return this.fallbackCapture;
        }
        
        // Priority 3: Try sourceProviders (video provider)
        const providers = this.sourceProviders.length > 0
            ? this.sourceProviders
            : [];

        for (const provider of providers) {
            const result = typeof provider.getDataResult === "function"
                ? provider.getDataResult()
                : { success: true as const, value: typeof provider.getData === "function" ? provider.getData() : null };
            if (!result.success) continue;
            const value = (result as any).value;
            if (!value) continue;
            return value;
        }
        
        return null;
    }

    setFallbackCapture(capture: any): void {
        this.fallbackCapture = capture;
    }
}
