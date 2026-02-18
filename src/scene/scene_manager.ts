import {
    type CarModifier,
    DEFAULT_SETTINGS,
    type Modifier,
    type NudgeModifier,
    type SceneCameraState,
    type ScenePlaybackState,
    type SceneSettings,
    type SceneState,
    type SceneStateDebugLog,
    type StickModifier,
    type StickResult,
    type Vector3,
} from "./types";
import {type DeepPartial, merge} from "./utils/merge.ts";

export class SceneManager {
    private readonly settings: SceneSettings;
    private modifiers: Map<string, Modifier> = new Map();
    private carModifiers: CarModifier[] = [];
    private nudgeModifiers: NudgeModifier[] = [];
    private stickModifiers: StickModifier[] = [];
    public debug: boolean = false;
    public paused: boolean = false;
    private startTime: number;
    private pausedAt: number | null = null;
    public stickDistance: number = 1000;

    constructor(settings: DeepPartial<SceneSettings> = {}) {
        this.settings = merge(DEFAULT_SETTINGS, settings);
        this.debug = settings.debug ?? DEFAULT_SETTINGS.debug;
        this.paused = settings.startPaused ?? DEFAULT_SETTINGS.startPaused;
        this.startTime = settings.playback?.startTime ?? DEFAULT_SETTINGS.playback.startTime;
    }

    public clearModifiers(): void {
        this.modifiers = new Map<string, Modifier>();
        this.carModifiers = [];
        this.nudgeModifiers = [];
        this.stickModifiers = [];
    }

    public setDebug(isDebug: boolean): SceneManager {
        this.debug = isDebug;
        return this;
    }

    public isDebug(): boolean {
        return this.debug;
    }

    public pause(): SceneManager {
        this.paused = true;
        return this;
    }

    public resume(): SceneManager {
        this.paused = false;
        return this;
    }

    public isPaused(): boolean {
        return this.paused;
    }

    public setStickDistance(stickDistance: number): SceneManager {
        this.stickDistance = stickDistance;
        return this;
    }

    public addCarModifier(carModifier: CarModifier): SceneManager {
        this.addModifier(carModifier);

        // Append and Sort descending: Highest priority first.
        this.carModifiers = [...this.carModifiers, carModifier].sort(
            (a, b) => b.priority - a.priority
        );
        return this;
    }

    public addNudgeModifier(nudgeModifier: NudgeModifier): SceneManager {
        this.addModifier(nudgeModifier);
        this.nudgeModifiers.push(nudgeModifier);
        return this;
    }

    public addStickModifier(stickModifier: StickModifier): SceneManager {
        this.addModifier(stickModifier);
        // Append and Sort descending: Highest priority first.
        this.stickModifiers = [...this.stickModifiers, stickModifier].sort(
            (a, b) => b.priority - a.priority
        );
        return this;
    }

    public initialState(): SceneState {
        return {
            sceneId: 0,
            settings: this.settings,
            projection: this.settings.projection,
            playback: {
                now: 0,
                delta: 0,
                frameCount: 60,
                progress: 0,
            } as ScenePlaybackState,
            debugStateLog: undefined,
        } as SceneState;
    }

    public calculateScene(millis: number, deltaTime: number, frameCount: number, previousState: SceneState): SceneState {

        if (this.paused) {
            if (!this.pausedAt) {
                this.pausedAt = millis;
            }
            return previousState;
        }

        let previousPos: Vector3;
        let initialPos: Vector3;
        if (previousState.projection.kind !== "camera" || previousState.settings.projection.kind !== "camera") {
            // @Fixme
            throw new Error("Screen not yet supported");
        }
        previousPos = previousState.projection.camera.position;
        initialPos = previousState.settings.projection.camera.position;



        if (this.pausedAt !== null) {
            this.startTime += (millis - this.pausedAt);
            this.pausedAt = null;
        }

        const debugLog = this.debug ? this.createEmptyDebugLog() : null;

        const startTime = millis - this.startTime;
        const scaledNow = startTime * this.settings.playback.timeSpeed;
        const scaledDelta = deltaTime * this.settings.playback.timeSpeed;
        const progress = this.settings.playback.duration
            ? (scaledNow % this.settings.playback.duration) / this.settings.playback.duration
            : 0

        let currentState = {
            ...previousState,
            projection: {
                camera: {
                    ...previousState.projection.camera
                }
            },
            playback: {
                ...previousState.playback,
                now: millis,
                delta: deltaTime,
                progress: progress,
                frameCount: frameCount,
            } as ScenePlaybackState,
            sceneId: previousState.sceneId + 1,
        } as SceneState

        for (const modifier of this.modifiers.values()) {
            if (modifier.active) {
                modifier.tick(currentState.sceneId);
            }
        }

        for (const modifier of this.carModifiers) {
            if (!modifier.active) continue;

            const res = modifier.getCarPosition(initialPos, currentState);
            if (!res.success && this.debug && debugLog) {
                debugLog.errors.push({name: modifier.name, message: res.error});
                continue;
            }

            if (res.success && res.value) {
                previousPos = res.value.position;
                if (this.debug && debugLog) {
                    debugLog.car = {
                        name: res.value.name,
                        priority: modifier.priority,
                        x: previousPos.x,
                        y: previousPos.y,
                        z: previousPos.z,
                    };
                }
                break;
            }
        }

        const finalCamPos = this.processNudges(previousPos, debugLog, currentState);

        let stickRes: StickResult = {
            yaw: 0,
            pitch: 0,
            roll: 0,
            distance: this.stickDistance,
            priority: -1,
        };

        for (const modifier of this.stickModifiers) {
            if (!modifier.active) continue;

            const res = modifier.getStick(finalCamPos, currentState);
            if (res.success) {
                stickRes = res.value;
                if (this.debug && debugLog) {
                    debugLog.stick = {
                        name: modifier.name,
                        priority: modifier.priority,
                        yaw: stickRes.yaw,
                        pitch: stickRes.pitch,
                        distance: stickRes.distance,
                    };
                }
                break;
            } else if (this.debug && debugLog) {
                debugLog.errors.push({name: modifier.name, message: res.error});
            }
        }

        const lookAt = this.calculateLookAt(finalCamPos, stickRes);

        return {
            sceneId: currentState.sceneId,
            settings: this.settings,
            projection: {
                kind: "camera",
                camera: {
                    ...previousState.projection.camera,
                    position: finalCamPos,
                    lookAt: lookAt,
                    yaw: stickRes.yaw,
                    pitch: stickRes.pitch,
                    roll: stickRes.roll,
                    direction: this.calculateDirection(stickRes),
                } as SceneCameraState,
            },
            playback: {
                now: scaledNow,
                delta: scaledDelta,
                frameCount: frameCount,
                progress: progress,
            } as ScenePlaybackState,
            debugStateLog: debugLog ?? undefined,
        } as SceneState;
    }

    private addModifier(modifier: Modifier) {
        if (!this.modifiers.has(modifier.name)) {
            this.modifiers.set(modifier.name, modifier);
        }
    }

    private processNudges(basePos: Vector3, debugLog: SceneStateDebugLog | null, currentState: SceneState): Vector3 {
        const votes: Record<keyof Vector3, number[]> = {x: [], y: [], z: []};

        for (const m of this.nudgeModifiers) {
            if (!m.active) continue;

            const res = m.getNudge(basePos, currentState);
            if (res.success) {
                const n = res.value;
                if (n.x !== undefined) votes.x.push(n.x);
                if (n.y !== undefined) votes.y.push(n.y);
                if (n.z !== undefined) votes.z.push(n.z);
                if (this.debug && debugLog) {
                    debugLog.nudges.push({
                        name: m.name,
                        x: n.x,
                        y: n.y,
                        z: n.z,
                    });
                }
            } else if (this.debug && debugLog) {
                debugLog.errors.push({name: m.name, message: res.error});
            }
        }

        const avg = (vals: number[]) =>
            vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;

        return {
            x: basePos.x + avg(votes.x),
            y: basePos.y + avg(votes.y),
            z: basePos.z + avg(votes.z),
        };
    }



    public calculateLookAt(pos: Vector3, stick: StickResult): Vector3 {
        return {
            x: pos.x + Math.sin(stick.yaw) * Math.cos(stick.pitch) * stick.distance,
            y: pos.y + Math.sin(stick.pitch) * stick.distance,
            z: pos.z - Math.cos(stick.yaw) * Math.cos(stick.pitch) * stick.distance,
        };
    }

    private createEmptyDebugLog(): NonNullable<SceneStateDebugLog> {
        const initialState = this.initialState();
        // const cameraSettings = initialState.settings.projection.camera;
        return {
            car: {
                name: "initialCam",
                priority: -1,
                x: cameraSettings.position.x,
                y: cameraSettings.position.y,
                z: cameraSettings.position.z,
            },
            nudges: [],
            stick: {
                name: "default",
                priority: -1,
                yaw: 0,
                pitch: 0,
                distance: this.stickDistance
            },
            errors: [],
        };
    }

    private calculateDirection(stickRes: StickResult): Vector3 {
        return {
            x: Math.sin(stickRes.yaw) * Math.cos(stickRes.pitch),
            y: Math.sin(stickRes.pitch),
            z: -Math.cos(stickRes.yaw) * Math.cos(stickRes.pitch)
        }
    }
}
