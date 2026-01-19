import p5 from "p5";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import {
    type CarModifier,
    type FailableResult,
    type NudgeModifier,
    type StickModifier,
    type StickResult,
    type Vector3,
    type CarResult,
} from "../types.ts";

const LEFT_EYE = 468, RIGHT_EYE = 473, NOSE_TIP = 1;
const LEFT_FACE = 234, RIGHT_FACE = 454, CHIN = 152, FOREHEAD = 10;

export type TrackingStatus = 'IDLE' | 'INITIALIZING' | 'READY' | 'ERROR';

export class CameraModifier implements CarModifier, NudgeModifier, StickModifier {
    readonly name = "Head Tracker Camera";
    readonly priority = 10;
    active = true;

    private status: TrackingStatus = 'IDLE';
    private capture: p5.Element | null = null;
    private faceLandmarker: FaceLandmarker | null = null;
    private neutralHeadSize: number | null = null;

    /* memory */
    private currentNudge: Vector3 = { x: 0, y: 0, z: 0 };
    private currentYaw: number = 0;
    private currentPitch: number = 0;

    private lastSceneId: number = -1;
    private cache: {
        carPos: Vector3;
        nudgePos: Vector3;
        stick: StickResult;
    } | null = null;

    /* configuration */
    private readonly TRAVEL_RANGE = 100;
    private readonly Z_TRAVEL_RANGE = 100;
    private readonly BASE_Z = 500;
    private readonly SMOOTHING = 0.08;
    private readonly ZOOM_DELTA_RANGE = 0.1;
    private readonly LOOK_DISTANCE = 1000; // Distance to the "Look-At" focal point

    private readonly p: p5;

    constructor(p: p5) {
        this.p = p;
    }

    public getStatus(): TrackingStatus {
        return this.status;
    }

    public async init() {
        if (this.status !== 'IDLE') return;

        try {
            this.status = 'INITIALIZING';
            this.capture = this.p.createCapture(this.p.VIDEO);
            this.capture.size(640, 480);
            this.capture.hide();

            const WASM_LOC = "/parallax/wasm";
            const vision = await FilesetResolver.forVisionTasks(WASM_LOC);
            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "/parallax/models/face_landmarker.task"
                },
                runningMode: "VIDEO",
                numFaces: 1
            });
            this.status = 'READY';
        } catch (error) {
            this.status = 'ERROR';
            this.logError(`Init Error: ${error}`);
        }
    }

    tick(sceneId: number): void {
        if (this.lastSceneId === sceneId) return;
        this.lastSceneId = sceneId;

        // Ensure we have hardware and are in a 'READY' state
        if (!this.capture || !this.faceLandmarker || this.status !== 'READY') return;

        const videoElt = this.capture.elt as HTMLVideoElement;
        if (videoElt.readyState < 2) return;

        try {
            const result = this.faceLandmarker.detectForVideo(videoElt, performance.now());

            // Exit if face is lost (Maintain last known memory for stability)
            if (!result.faceLandmarks || result.faceLandmarks.length === 0) return;

            const lm = result.faceLandmarks[0];

            // 1. RAW CALCULATIONS (X, Y)
            const centerX = (lm[NOSE_TIP].x + lm[LEFT_EYE].x + lm[RIGHT_EYE].x) / 3;
            const centerY = (lm[NOSE_TIP].y + lm[LEFT_EYE].y + lm[RIGHT_EYE].y) / 3;

            this.p.perspective(this.p.PI / 3, this.p.width / this.p.height, 0.1, 5000);
            const targetX = this.p.map(centerX, 0, 1, this.TRAVEL_RANGE, -this.TRAVEL_RANGE);
            const targetY = this.p.map(centerY, 0, 1, -this.TRAVEL_RANGE, this.TRAVEL_RANGE);

            // 2. DEPTH CALCULATION (Z)
            const vLeft = this.p.createVector(lm[LEFT_FACE].x, lm[LEFT_FACE].y, lm[LEFT_FACE].z);
            const vRight = this.p.createVector(lm[RIGHT_FACE].x, lm[RIGHT_FACE].y, lm[RIGHT_FACE].z);
            const vChin = this.p.createVector(lm[CHIN].x, lm[CHIN].y, lm[CHIN].z);
            const vFore = this.p.createVector(lm[FOREHEAD].x, lm[FOREHEAD].y, lm[FOREHEAD].z);

            const headSize = (p5.Vector.dist(vLeft, vRight) + p5.Vector.dist(vChin, vFore)) * 0.5;
            if (this.neutralHeadSize === null) this.neutralHeadSize = headSize;

            const sizeDelta = headSize - this.neutralHeadSize;
            const targetZ = this.p.map(sizeDelta, -this.ZOOM_DELTA_RANGE, this.ZOOM_DELTA_RANGE, this.Z_TRAVEL_RANGE, -this.Z_TRAVEL_RANGE);

            // 3. ROTATION CALCULATION (Yaw, Pitch)
            // The cross product of the face-plane vectors gives us the "Forward" gaze
            const forward = p5.Vector.sub(vLeft, vRight).cross(p5.Vector.sub(vChin, vFore)).normalize();
            const DAMPING = 0.5; // 1.0 is raw, 0.5 is half-strength
            const targetYaw = -Math.atan2(forward.x, -forward.z) * DAMPING;
            const targetPitch = -Math.asin(forward.y) * DAMPING;

            // 4. APPLY SMOOTHING (Update Memory)
            this.currentNudge = {
                x: this.p.lerp(this.currentNudge.x, targetX, this.SMOOTHING),
                y: this.p.lerp(this.currentNudge.y, targetY, this.SMOOTHING),
                z: this.p.lerp(this.currentNudge.z, targetZ, this.SMOOTHING),
            };

            this.currentYaw = this.p.lerp(this.currentYaw, targetYaw, this.SMOOTHING);
            this.currentPitch = this.p.lerp(this.currentPitch, targetPitch, this.SMOOTHING);

            // 5. UPDATE THE PUBLIC CACHE (Now injecting rotation)
            this.cache = {
                carPos: { x: 0, y: 0, z: this.BASE_Z },
                nudgePos: { ...this.currentNudge },
                stick: {
                    yaw: this.currentYaw,
                    pitch: this.currentPitch,
                    distance: this.LOOK_DISTANCE,
                    priority: this.priority
                }
            };

        } catch (error) {
            this.logError(`Detection Loop Failed: ${error}`);
        }
    }

    // --- Accessors ---
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

    private logError(message: string) {
        console.error(message);
    }
}