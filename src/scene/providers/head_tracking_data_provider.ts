import p5 from "p5";
import type {DataProviderBundle, DataProviderTickContext, FailableResult, TrackingStatus, Vector3} from "../types.ts";
import { MediaPipeFaceProvider, type FaceProviderConfig } from "../drivers/mediapipe/face_provider.ts";
import type {FaceProvider} from "./face_provider.ts";
import type {Face} from "../drivers/mediapipe/face.ts";
import type { WebCamDataProvider } from "./web_cam_data_provider.ts";

/**
 * Data provider library type for head tracking.
 * Used to type the relationship between HeadTrackingDataProvider and modifiers.
 */
export type HeadTrackerDataProviderLib = {
    headTracker: DataProviderBundle<"headTracker", FaceWorldData>
};

export type ObserverDataProviderLib = {
    webCam: DataProviderBundle<"webCam", any>,
    headTracker: DataProviderBundle<"headTracker", FaceWorldData>,
};

/**
 * Container for face data transformed to scene coordinates.
 * Provides access to facial features and rotation in scene units.
 */
export class FaceWorldData {
    readonly face: Face;
    readonly sceneHeadWidth: number;
    readonly midpoint: Vector3
    public constructor(
        face: Face,
        sceneHeadWidth: number,
        midpoint: Vector3
    ) {
        this.face = face;
        this.sceneHeadWidth = sceneHeadWidth;
        this.midpoint = midpoint;
    }

    /**
     * Transforms a vector from face-local coordinates to scene coordinates.
     * Applies coordinate flipping and scaling to sceneHeadWidth.
     */
    private transform = (vector: Vector3) => {
        // return {x:0,y:0,z:0};
        const scaled = {
            x: vector.x * this.sceneHeadWidth,
            y: vector.y * this.sceneHeadWidth,
            z: vector.z * this.sceneHeadWidth,
        };
        // Flip Y and Z for p5 coordinate system
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

    private provider: FaceProvider;
    private webCamProvider: WebCamDataProvider | null = null;

    /**
     * Expected width of the head projected in the screen to the zero Z level.
     * If they match, the head should have Z equals of the screen.
     * If the projected head is bigger than the expected width, head Z is bigger (closer).
     * If the projected head is smaller than the expected width, head Z is small (farther).
     * @private
     */
    readonly sceneHeadWidth: number;

    /**
     * The screen width.
     * The projected head is created based in a screen image (normally camera).
     * To properly define the head position, we need to know the screen size.
     * @private
     */
    readonly sceneScreenWidth: number;

    /**
     * Percentage of the screen width that the head in neutral position should match.
     */
    readonly sceneScreenHeadProportion: number;

    private sceneId: number = -1;
    private lastFace: FaceWorldData | null = null;
    readonly cameraPosition: Vector3;
    readonly panelPosition: Vector3;

    constructor(
        p: p5,
        sceneHeadWidth: number = 120,
        sceneScreenWidth: number = 650,
        mirror: boolean = false,
        panelPosition: Vector3 = DEFAULT_CAMERA_PANEL_POSITION,
        cameraPosition: Vector3 = DEFAULT_CAMERA_POSITION,
        faceConfig: FaceProviderConfig = {},
    ) {
        if (sceneHeadWidth <= 0) {
            throw new Error("Invalid scene head width");
        }
        if (sceneScreenWidth <= 0) {
            throw new Error("Invalid scene screen width");
        }
        this.sceneHeadWidth = sceneHeadWidth;
        this.sceneScreenWidth = sceneScreenWidth;
        this.sceneScreenHeadProportion = this.sceneHeadWidth / this.sceneScreenWidth;

        this.panelPosition  = panelPosition;
        this.cameraPosition = cameraPosition;

        this.provider = new MediaPipeFaceProvider(p, "/parallax/wasm", "/parallax/models/face_landmarker.task", mirror, faceConfig, null);
    }

    async init(): Promise<void> {
        await this.provider.init();
    }

    tick(sceneId: number, context?: DataProviderTickContext): void {
        if (this.sceneId === sceneId) return;
        this.sceneId = sceneId;

        this.webCamProvider = (context?.parent as WebCamDataProvider | null) ?? null;
        const capture = this.webCamProvider?.getData() ?? null;
        if (this.provider instanceof MediaPipeFaceProvider) {
            this.provider.setCapture(capture);
        }

        this.provider.getStatus();
    }

    getStatus(): TrackingStatus {
        return this.provider.getStatus();
    }

    getVideo(): FailableResult<any> {
        if (this.webCamProvider) {
            return this.webCamProvider.getVideo();
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
        const capture = this.webCamProvider?.getData() ?? null;
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
        const faceScreeWidth = face.width * this.sceneScreenWidth;
        const cameraToPanelZ = this.panelPosition.z - this.cameraPosition.z;
        const diff = ((this.sceneHeadWidth / faceScreeWidth) - 1);
        const midPointZ = cameraToPanelZ * diff;

        const midpoint = {
            x: -(face.skullCenter.position.x - 0.5) * this.sceneScreenWidth,
            y:  (face.skullCenter.position.y - 0.5) * this.sceneScreenWidth,
            z: midPointZ,
        };

        this.lastFace = new FaceWorldData(
            face,
            this.sceneHeadWidth,
            midpoint
        )

        return { success: true, value: this.lastFace };
    }
}
