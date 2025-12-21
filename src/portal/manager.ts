import type { 
  Vector3, 
  SceneState, 
  CarModifier, 
  NudgeModifier, 
  StickModifier, 
  StickResult 
} from './types';

export class PortalSceneManager {
  private initialCam: Vector3;
  private carModifiers: CarModifier[] = [];
  private nudgeModifiers: NudgeModifier[] = [];
  private stickModifiers: StickModifier[] = [];

  constructor(initialCam: Vector3) {
    this.initialCam = initialCam;
  }

  public calculateScene(): SceneState {
    // Sort descending: Highest priority first
    const sortedCars = [...this.carModifiers].sort((a, b) => b.priority - a.priority);
    let basePos: Vector3 = { ...this.initialCam };

    for (const m of sortedCars) {
      if (!m.active) continue;
      
      const res = m.getCarPosition(this.initialCam);
      if (res.error === null && res.value) {
        basePos = res.value.position;
        break;
      }
    }

    const finalCamPos = this.processNudges(basePos);

    const sortedSticks = [...this.stickModifiers].sort((a, b) => b.priority - a.priority);
    let stickRes: StickResult = { yaw: 0, pitch: 0, distance: 1000, priority: -1 };

    for (const m of sortedSticks) {
      if (!m.active) continue;

      const res = m.getStick(finalCamPos);
      if (res.error === null && res.value) {
        stickRes = res.value;
        break;
      }
    }

    return {
      camera: finalCamPos,
      lookAt: this.calculateLookAt(finalCamPos, stickRes),
      debug: { activeCar: basePos }
    };
  }

  private processNudges(basePos: Vector3): Vector3 {
    const votes: Record<keyof Vector3, number[]> = { x: [], y: [], z: [] };

    for (const m of this.nudgeModifiers) {
      if (!m.active) continue;
      
      const res = m.getNudge(basePos);
      if (res.error === null && res.value) {
        const n = res.value;
        if (n.x !== undefined) votes.x.push(n.x);
        if (n.y !== undefined) votes.y.push(n.y);
        if (n.z !== undefined) votes.z.push(n.z);
      }
    }

    const avg = (vals: number[]) => vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;

    return {
      x: basePos.x + avg(votes.x),
      y: basePos.y + avg(votes.y),
      z: basePos.z + avg(votes.z)
    };
  }

  private calculateLookAt(pos: Vector3, stick: StickResult): Vector3 {
    return {
      x: pos.x + Math.sin(stick.yaw) * Math.cos(stick.pitch) * stick.distance,
      y: pos.y + Math.sin(stick.pitch) * stick.distance,
      z: pos.z - Math.cos(stick.yaw) * Math.cos(stick.pitch) * stick.distance
    };
  }
}