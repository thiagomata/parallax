import p5 from "p5";
import type { DataProviderBundle, Vector3 } from "../types.ts";
import { MediaPipeFaceProvider } from "../drivers/mediapipe/face_provider.ts";
import type {FaceProvider} from "./face_provider.ts";
import type {Face} from "../drivers/mediapipe/face.ts";

/**
 * Data provider library type for head tracking.
 * Used to type the relationship between HeadTrackingDataProvider and modifiers.
 */
export type HeadTrackerDataProviderLib = {
    headTracker: DataProviderBundle<"headTracker", FaceWorldData>
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

        return scale(vector, this.sceneHeadWidth);
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
     * Returns rotation angles. Pitch and roll are negated to match scene coordinate system.
     */
    public get stick() {
        return {
            yaw: this.face.yaw,
            pitch: -this.face.pitch,
            roll: -this.face.roll,
        }
    }
}

/**
 * Scales and flips a vector for scene coordinates.
 * Flips X and Z (camera to scene coordinate conversion) and applies scale factor.
 */
const scale = (vector: Vector3, factor: number): Vector3 => {
    return {
        x: -vector.x * factor,
        y: vector.y * factor,
        z: -vector.z * factor,
    }
}

export const DEFAULT_CAMERA_POSITION: Vector3 = { x: 0, y: 0, z: 300 };
export const DEFAULT_CAMERA_PANEL_POSITION: Vector3 = { x: 0, y: 0, z: 0 };

export class HeadTrackingDataProvider implements DataProviderBundle<"headTracker", FaceWorldData> {
    readonly type = "headTracker";

    private provider: FaceProvider;

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

        this.provider = new MediaPipeFaceProvider(p, "/parallax/wasm", "/parallax/models/face_landmarker.task", mirror);
    }

    async init(): Promise<void> {
        await this.provider.init();
    }

    tick(sceneId: number): void {
        if (this.sceneId === sceneId) return;
        this.sceneId = sceneId;
        this.provider.getStatus();
    }

    getVideo(): any {
        return this.provider.getVideo();
    }

    getData(): FaceWorldData | null {
        const face = this.provider.getFace();
        if (!face) return this.lastFace;

        const faceScreeWidth = face.width * this.sceneScreenWidth; // measured width in world units
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

        return this.lastFace;
    }
}