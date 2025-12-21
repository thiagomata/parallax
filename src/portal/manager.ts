import type {
  Vector3,
  SceneState,
  CarModifier,
  NudgeModifier,
  StickModifier,
  StickResult,
  SceneStateDebugLog,
} from "./types";

export class PortalSceneManager {
  private initialCam: Vector3;
  private carModifiers: CarModifier[] = [];
  private nudgeModifiers: NudgeModifier[] = [];
  private stickModifiers: StickModifier[] = [];
  private readonly isDebug: boolean;

  constructor(initialCam: Vector3, isDebug = false) {
    this.initialCam = initialCam;
    this.isDebug = isDebug;
  }

  public calculateScene(): SceneState {
    // Sort descending: Highest priority first
    const sortedCars = [...this.carModifiers].sort(
      (a, b) => b.priority - a.priority
    );
    let basePos: Vector3 = { ...this.initialCam };
    const debugLog = this.isDebug ? this.createEmptyDebugLog() : null;

    for (const m of sortedCars) {
      if (!m.active) continue;

      const res = m.getCarPosition(this.initialCam);
    if (res.error !== null && this.isDebug && debugLog) {
        debugLog.errors.push({ name: m.name, message: res.error });
        continue;
      }

      if (res.error === null && res.value) {
        basePos = res.value.position;
        if (this.isDebug && debugLog) {
          debugLog.car = {
            name: m.name,
            priority: m.priority,
            x: basePos.x,
            y: basePos.y,
            z: basePos.z,
          };
        }
        break;
      }
    }

    const finalCamPos = this.processNudges(basePos, debugLog);

    const sortedSticks = [...this.stickModifiers].sort(
      (a, b) => b.priority - a.priority
    );
    let stickRes: StickResult = {
      yaw: 0,
      pitch: 0,
      distance: 1000,
      priority: -1,
    };

    for (const m of sortedSticks) {
      if (!m.active) continue;

      const res = m.getStick(finalCamPos);
      if (res.error === null && res.value) {
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
        debugLog.errors.push({ name: m.name, message: res.error });
      }
    }

    const state: SceneState = {
      camera: finalCamPos,
      lookAt: this.calculateLookAt(finalCamPos, stickRes),
    };

    if (this.isDebug) {
      state.debug = debugLog!;
    }

    return state;
  }

  private processNudges(basePos: Vector3, debugLog: SceneStateDebugLog | null): Vector3 {
    const votes: Record<keyof Vector3, number[]> = { x: [], y: [], z: [] };

    for (const m of this.nudgeModifiers) {
      if (!m.active) continue;

      const res = m.getNudge(basePos);
      if (res.error === null && res.value) {
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
        debugLog.errors.push({ name: m.name, message: res.error });
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

  private calculateLookAt(pos: Vector3, stick: StickResult): Vector3 {
    return {
      x: pos.x + Math.sin(stick.yaw) * Math.cos(stick.pitch) * stick.distance,
      y: pos.y + Math.sin(stick.pitch) * stick.distance,
      z: pos.z - Math.cos(stick.yaw) * Math.cos(stick.pitch) * stick.distance,
    };
  }

  private createEmptyDebugLog(): NonNullable<SceneStateDebugLog> {
    return {
      car: { name: "initialCam", priority: -1, x: this.initialCam.x, y: this.initialCam.y, z: this.initialCam.z },
      nudges: [],
      stick: { name: "default", priority: -1, yaw: 0, pitch: 0, distance: 1000 },
      errors: [],
    };
  }  
}
