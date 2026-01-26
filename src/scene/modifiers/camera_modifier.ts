import p5 from "p5";
import {
    type CarModifier,
    type FailableResult,
    type NudgeModifier,
    type StickModifier,
    type StickResult,
    type Vector3,
    type CarResult,
    type FaceProvider,
    type TrackingStatus,
    type ObserverConfig,
    DEFAULT_OBSERVER_CONFIG,
    type FaceGeometry,
} from "../types.ts";
import { FaceFeatures } from "../drivers/mediapipe/face_features";
import {MediaPipeFaceProvider} from "../drivers/mediapipe/face_provider.ts";

export class CameraModifier implements CarModifier, NudgeModifier, StickModifier {
    readonly name = "Head Tracker Camera";
    readonly priority = 10;
    active = true;
    private status: TrackingStatus = 'IDLE';

    // Calibration and Presence State
    private neutralHeadSize: number | null = null;
    private framesSinceLastSeen: number = 0;
    readonly RESET_HEAD_THRESHOLD = 90; // ~3 seconds at 30fps

    // The "Virtual Face" (Our Smoothed Source of Truth)
    private smoothedFeatures: FaceFeatures | null = null;

    // The Publicly Accessible Result Cache
    private cache: {
        carPos: Vector3;
        nudgePos: Vector3;
        stick: StickResult;
    } | null = null;

    private readonly p: p5;
    private readonly provider: FaceProvider;
    private readonly config: ObserverConfig;
    private sceneId: number = -1;

    constructor(
        p: p5,
        provider: FaceProvider | null = null,
        customConfig: Partial<ObserverConfig> = {}
    ) {
        this.p = p;
        this.provider = provider ?? new MediaPipeFaceProvider(p);
        this.config = { ...DEFAULT_OBSERVER_CONFIG, ...customConfig };
    }

    public getStatus(): TrackingStatus {
        // return this.provider.getStatus();
        return this.status;
    }

    public async init(): Promise<void> {
        // Hydration: Delegate to the specific hardware driver
        await this.provider.init();
        this.status = this.provider.getStatus();
    }

    tick(sceneId: number): void {
        if (this.sceneId === sceneId) return;
        this.sceneId = sceneId;

        const providerStatus = this.provider.getStatus();

        switch (providerStatus) {
            case 'IDLE':
            case 'INITIALIZING':
                this.status = providerStatus;
                break;

            case 'ERROR':
            case 'DISCONNECTED':
                this.status = providerStatus;
                this.handleHardReset();
                break;

            default:
                this.processFrame();
                break;
        }
    }

    /**
     * Handles the logic for a functional provider.
     * Separates presence detection from status orchestration.
     */
    private processFrame(): void {
        const rawFace = this.provider.getFace();

        if (!rawFace) {
            this.handleSignalLoss();
            return;
        }

        const incoming = new FaceFeatures(rawFace);
        this.updateFace(incoming);
        this.status = 'READY';
    }

    private handleHardReset(): void {
        this.neutralHeadSize = null;
        this.smoothedFeatures = null;
        this.cache = null;
    }

    private updateFace(incoming: FaceFeatures): void {
        this.framesSinceLastSeen = 0;

        // 1. Auto-Calibration (First frame or after reset)
        if (this.neutralHeadSize === null) {
            this.neutralHeadSize = incoming.scale;
            console.log("New calibration baseline set:", this.neutralHeadSize);
        }

        // 2. Semantic Smoothing: Interpolate the whole "Face" state
        if (!this.smoothedFeatures) {
            this.smoothedFeatures = incoming;
        } else {
            this.smoothedFeatures = this.interpolateFeatures(this.smoothedFeatures, incoming);
        }

        // 3. Map Smoothed Face to Engine Output
        this.updateCache();
    }

    private handleSignalLoss(): void {
        this.framesSinceLastSeen++;

        // If face is missing, smoothly drift the virtual face back to "zero" state
        if (this.smoothedFeatures) {
            // We use a dummy "neutral" geometry to lerp back to center
            const neutralFace = this.createNeutralGeometry();
            this.smoothedFeatures = this.interpolateFeatures(this.smoothedFeatures, new FaceFeatures(neutralFace));
        }

        // After the threshold, clear calibration so next person resets it
        if (this.framesSinceLastSeen > this.RESET_HEAD_THRESHOLD) {
            this.status = 'DISCONNECTED';
            this.neutralHeadSize = null;
            this.smoothedFeatures = null;
            this.cache = null;
        } else {
            this.status = 'DRIFTING';
            this.updateCache();
        }
    }

    private updateCache(): void {
        if (!this.smoothedFeatures || this.neutralHeadSize === null) return;

        const face = this.smoothedFeatures;

        this.cache = {
            carPos: face.midpoint,
            nudgePos: {
                x: face.nudge.x * (this.config.travelRange * 2),
                y: face.nudge.y * (this.config.travelRange * 2),
                z: -(face.scale - this.neutralHeadSize) * this.config.zTravelRange
            },
            stick: {
                yaw: face.stick.yaw * this.config.damping,
                pitch: face.stick.pitch * this.config.damping,
                distance: this.config.lookDistance,
                priority: this.priority
            }
        };
    }

    private interpolateFeatures(current: FaceFeatures, target: FaceFeatures): FaceFeatures {
        const s = this.config.smoothing;

        // We create a new smoothed FaceGeometry by lerping the raw landmarks
        const lerpedData: FaceGeometry = {
            nose: this.lerpVec(current.face.nose, target.face.nose, s),
            leftEye: this.lerpVec(current.face.leftEye, target.face.leftEye, s),
            rightEye: this.lerpVec(current.face.rightEye, target.face.rightEye, s),
            bounds: {
                left: this.lerpVec(current.face.bounds.left, target.face.bounds.left, s),
                right: this.lerpVec(current.face.bounds.right, target.face.bounds.right, s),
                top: this.lerpVec(current.face.bounds.top, target.face.bounds.top, s),
                bottom: this.lerpVec(current.face.bounds.bottom, target.face.bounds.bottom, s),
            }
        };

        return new FaceFeatures(lerpedData);
    }

    private lerpVec(v1: Vector3, v2: Vector3, amt: number): Vector3 {
        return {
            x: this.p.lerp(v1.x, v2.x, amt),
            y: this.p.lerp(v1.y, v2.y, amt),
            z: this.p.lerp(v1.z, v2.z, amt)
        };
    }

    /**
     * Generates a "Zeroed" face at center (0.5, 0.5) for drifting back on lost tracking.
     */
    private createNeutralGeometry(): FaceGeometry {
        const center: Vector3 = { x: 0.5, y: 0.5, z: 0 };
        return {
            nose: center,
            leftEye: { x: 0.45, y: 0.45, z: 0 },
            rightEye: { x: 0.55, y: 0.45, z: 0 },
            bounds: {
                left: { x: 0.4, y: 0.5, z: 0 },
                right: { x: 0.6, y: 0.5, z: 0 },
                top: { x: 0.5, y: 0.4, z: 0 },
                bottom: { x: 0.5, y: 0.6, z: 0 }
            }
        };
    }

    // --- Public Accessors ---
    getCarPosition(): FailableResult<CarResult> {
        if (!this.cache) return { success: false, error: "Tracking lost" };
        return { success: true, value: { name: this.name, position: this.cache.carPos } };
    }

    getNudge(): FailableResult<Partial<Vector3>> {
        if (!this.cache) return { success: false, error: "Tracking lost" };
        return { success: true, value: this.cache.nudgePos };
    }

    getStick(): FailableResult<StickResult> {
        if (!this.cache) return { success: false, error: "Tracking lost" };
        return { success: true, value: this.cache.stick };
    }
}