import {
    type CarModifier, DEFAULT_SETTINGS,
    type NudgeModifier, type ScenePlaybackState, type SceneCameraState, type SceneSettings,
    type SceneState,
    type SceneStateDebugLog,
    type StickModifier,
    type StickResult,
    type Vector3,
} from "./types";

export class SceneManager {
    private settings: SceneSettings;
    private carModifiers: CarModifier[] = [];
    private nudgeModifiers: NudgeModifier[] = [];
    private stickModifiers: StickModifier[] = [];
    public isDebug: boolean = false;
    public stickDistance: number = 1000;

    constructor(initialSettings: SceneSettings = DEFAULT_SETTINGS) {
        this.settings = initialSettings;
    }

    public setDebug(isDebug: boolean): SceneManager {
        this.isDebug = isDebug;
        return this;
    }

    public setStickDistance(stickDistance: number): SceneManager {
        this.stickDistance = stickDistance;
        return this;
    }

    public addCarModifier(carModifier: CarModifier): SceneManager {
        // Append and Sort descending: Highest priority first.
        this.carModifiers = [...this.carModifiers, carModifier].sort(
            (a, b) => b.priority - a.priority
        );
        return this;
    }

    public addNudgeModifier(nudgeModifier: NudgeModifier): SceneManager {
        this.nudgeModifiers.push(nudgeModifier);
        return this;
    }

    public addStickModifier(stickModifier: StickModifier): SceneManager {
        // Append and Sort descending: Highest priority first.
        this.stickModifiers = [...this.stickModifiers, stickModifier].sort(
            (a, b) => b.priority - a.priority
        );
        return this;
    }

    public initialState(): SceneState {
        return {
            settings: this.settings,
            playback: {
                now: 0,
                delta: 0,
                frameCount: 60,
                progress: 0,
            } as ScenePlaybackState,
            camera: {
                fov: this.settings.camera.fov ?? Math.PI / 3,
                near: this.settings.camera.near ?? 0.1,
                far: this.settings.camera.far ?? 1000,
                position: this.settings.camera.position,
                lookAt: this.settings.camera.lookAt ?? 0,
                yaw: 0,
                pitch: 0,
                direction: this.calculateDirection({
                    yaw: 0,
                    pitch:0,
                    distance: this.stickDistance,
                    priority: 0,
                }),
            } as SceneCameraState,
            debugStateLog: undefined,
        } as SceneState;
    }

    public calculateScene(millis: number, deltaTime: number, frameCount: number, previousState: SceneState): SceneState {
    // public calculateScene(): SceneState {
        let basePos: Vector3 = {...this.settings.camera.position};
        const debugLog = this.isDebug ? this.createEmptyDebugLog() : null;

        const now = millis - this.settings.playback.startTime;
        const scaledNow = now * this.settings.playback.timeSpeed;
        const scaledDelta = deltaTime * this.settings.playback.timeSpeed;
        const progress = this.settings.playback.duration
            ? (scaledNow % this.settings.playback.duration) / this.settings.playback.duration
            : 0

        let currentState = {
            ...previousState,
            playback: {
                ...previousState.playback,
                now: millis,
                delta: deltaTime,
                progress: progress,
                frameCount: frameCount,
            } as ScenePlaybackState
        } as SceneState

        for (const m of this.carModifiers) {
            if (!m.active) continue;

            const res = m.getCarPosition(this.settings.camera.position, currentState);
            if (!res.success && this.isDebug && debugLog) {
                debugLog.errors.push({name: m.name, message: res.error});
                continue;
            }

            if (res.success && res.value) {
                basePos = res.value.position;
                if (this.isDebug && debugLog) {
                    debugLog.car = {
                        name: res.value.name,
                        priority: m.priority,
                        x: basePos.x,
                        y: basePos.y,
                        z: basePos.z,
                    };
                }
                break;
            }
        }

        const finalCamPos = this.processNudges(basePos, debugLog, currentState);

        let stickRes: StickResult = {
            yaw: 0,
            pitch: 0,
            distance: this.stickDistance,
            priority: -1,
        };

        for (const m of this.stickModifiers) {
            if (!m.active) continue;

            const res = m.getStick(finalCamPos, currentState);
            if (res.success) {
                stickRes = res.value;
                if (this.isDebug && debugLog) {
                    debugLog.stick = {
                        name: m.name,
                        priority: m.priority,
                        yaw: stickRes.yaw,
                        pitch: stickRes.pitch,
                        distance: stickRes.distance,
                    };
                }
                break;
            } else if (this.isDebug && debugLog) {
                debugLog.errors.push({name: m.name, message: res.error});
            }
        }

        const lookAt = this.calculateLookAt(finalCamPos, stickRes);

        return {
            settings: this.settings,
            playback: {
                now: scaledNow,
                delta: scaledDelta,
                frameCount: frameCount,
                progress: progress,
            } as ScenePlaybackState,
            camera: {
                fov: this.settings.camera.fov ?? Math.PI / 3,
                near: this.settings.camera.near ?? 0.1,
                far: this.settings.camera.far ?? 1000,
                position: finalCamPos,
                lookAt: lookAt,
                yaw: stickRes.yaw,
                pitch: stickRes.pitch,
                direction: this.calculateDirection(stickRes),
            } as SceneCameraState,
            debugStateLog: debugLog ?? undefined,
        } as SceneState;
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
                if (this.isDebug && debugLog) {
                    debugLog.nudges.push({
                        name: m.name,
                        x: n.x,
                        y: n.y,
                        z: n.z,
                    });
                }
            } else if (this.isDebug && debugLog) {
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
        return {
            car: {
                name: "initialCam",
                priority: -1,
                x: this.settings.camera.position.x,
                y: this.settings.camera.position.y,
                z: this.settings.camera.position.z,
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
