import type {
    CarModifier, CarResult,
    NudgeModifier, Pose,
    ProjectionType,
    Rotation3, SceneState,
    StickModifier, StickResult,
    Vector3
} from "../types.ts";

export type ProjectionElementData = {
    kind: "ProjectionElement";
    type: ProjectionType;
    pose: Pose;
    target?: ProjectionElement;
    debug?: ProjectionElementDebug;

    carModifiers: CarModifier[];
    nudgeModifiers: NudgeModifier[];
    stickModifiers: StickModifier[];
}

export const DEFAULT_ELEMENT = {
    pose: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { pitch: 0, yaw: 0, roll: 0 },
    },
    carModifiers: [],
    nudgeModifiers: [],
    stickModifiers: [],
};

const avg = (vals: number[]) =>
    vals.length === 0 ? 0 :
        vals.reduce((a, b) => a + b, 0) / vals.length;

export interface ProjectionElementDebug {
    // cars
    logFailedCar(element: ProjectionElement,  carModifier: CarModifier, res: { success: false; error: string }): void;
    logSuccessCar(element: ProjectionElement,  carModifier: CarModifier, res: { success: true; value: CarResult }): void;
    // nudge
    logFailedNudge(element: ProjectionElement,  nudgeModifier: NudgeModifier, res: { success: false; error: string }): void;
    logSuccessNudge(element: ProjectionElement,  nudgeModifier: NudgeModifier, res: { success: true; value: Partial<Vector3> }): void;
    logFinalNudge(element: ProjectionElement,  finalNudge: { x: number; y: number; z: number }): void;
    // stick
    logFailedStick(element: ProjectionElement,  stickModifier: StickModifier, res: { success: false; error: string }): void;
    logSuccessStick(element: ProjectionElement,  stickModifier: StickModifier, res: { success: true; value: StickResult }): void;
}


export class ProjectionElement {

    readonly kind = "ProjectionElement";

    readonly id: string;
    type: ProjectionType;
    position: Vector3;
    rotation: Rotation3;
    target?: ProjectionElement;
    debug?: ProjectionElementDebug;

    private carModifiers: CarModifier[] = [];
    private nudgeModifiers: NudgeModifier[] = [];
    private stickModifiers: StickModifier[] = [];

    constructor(data: Partial<ProjectionElementData> & {id: string, type: ProjectionType}) {
        const merged = { ...DEFAULT_ELEMENT, ...data };
        this.id = merged.id;
        this.type = merged.type;
        this.position = merged.pose?.position ?? DEFAULT_ELEMENT.pose.position;
        this.rotation = merged.pose?.rotation ?? DEFAULT_ELEMENT.pose.rotation;
        this.setTarget(merged.target);

        merged.carModifiers?.forEach(this.addCarModifier);
        merged.stickModifiers?.forEach(this.addStickModifier);
        merged.nudgeModifiers?.forEach(this.addNudgeModifier);
    }

    setTarget(target?: ProjectionElement) {
        if (target != undefined && (target === this || target.hasParent(this))) {
            throw new Error(`Invalid target for ${this.id}`);
        }
        this.target = target;
    }

    hasParent(element: ProjectionElement): boolean {
        let current = this.target;
        while (current) {
            if (current === element) return true;
            current = current.target;
        }
        return false;
    }

    addStickModifier(stickModifier: StickModifier) {
        this.stickModifiers = [...this.stickModifiers, stickModifier]
            .sort((a,b) => b.priority - a.priority);
    }

    addNudgeModifier(nudgeModifier: NudgeModifier) {
        this.nudgeModifiers.push(nudgeModifier);
    }

    addCarModifier(carModifier: CarModifier) {
        this.carModifiers = [...this.carModifiers, carModifier]
            .sort((a,b) => b.priority - a.priority);
    }

    getStickModifiers(): StickModifier[] {
        return [...this.stickModifiers];
    }

    getNudgeModifiers(): NudgeModifier[] {
        return [...this.nudgeModifiers];
    }

    getCarModifiers(): CarModifier[] {
        return [...this.carModifiers];
    }

    computeWorldPosition(): Vector3 {
        if (!this.target) return this.position;
        const parentPos = this.target.computeWorldPosition();
        return {
            x: this.position.x + parentPos.x,
            y: this.position.y + parentPos.y,
            z: this.position.z + parentPos.z,
        };
    }

    processCarModifiers(
        basePos: Vector3,
        state: SceneState,
    ): Vector3 {
        for( const carModifier of this.carModifiers ) {
            if (!carModifier.active) continue;

            const res = carModifier.getCarPosition(basePos, state);
            if (!res.success) {
                if (this.debug) {
                    this.debug.logFailedCar(this, carModifier, res);
                }
                continue;
            }

            if (this.debug) {
                this.debug.logSuccessCar(this, carModifier, res);
            }
            return res.value.position;
        }
        return basePos;
    }

    processStickModifiers(
        basePos: Vector3,
        state: SceneState,
    ): StickResult {
        for( const stickModifier of this.stickModifiers ) {
            if (!stickModifier.active) continue;

            const res = stickModifier.getStick(basePos, state);
            if (!res.success) {
                if (this.debug) {
                    this.debug.logFailedStick(this, stickModifier, res);
                }
                continue;
            }

            if (this.debug) {
                this.debug.logSuccessStick(this, stickModifier, res);
            }
            return res.value;
        }
        return {
            yaw: 0,
            pitch: 0,
            roll: 0,
            distance: 0,
            priority: -1,
        };
    }

    processNudges(
        basePos: Vector3,
        state: SceneState
    ): Vector3 {

        const votes: Record<keyof Vector3, number[]> = {
            x: [], y: [], z: []
        };

        for (const nudgeModifier of this.nudgeModifiers) {
            if (!nudgeModifier.active) continue;

            const res = nudgeModifier.getNudge(basePos, state);
            if (!res.success) {
                if (this.debug) this.debug.logFailedNudge(this, nudgeModifier, res);
                continue;
            }

            if (this.debug) this.debug.logSuccessNudge(this, nudgeModifier, res);

            const n = res.value;
            if (n.x !== undefined) votes.x.push(n.x);
            if (n.y !== undefined) votes.y.push(n.y);
            if (n.z !== undefined) votes.z.push(n.z);
        }

        const finalNudge = {
            x: basePos.x + avg(votes.x),
            y: basePos.y + avg(votes.y),
            z: basePos.z + avg(votes.z),
        };

        if (this.debug) this.debug.logFinalNudge(this, finalNudge);

        return finalNudge;
    }

    private calculateLookAt(pos: Vector3, stick: StickResult): Vector3 {
        return {
            x: pos.x + Math.sin(stick.yaw) * Math.cos(stick.pitch) * stick.distance,
            y: pos.y + Math.sin(stick.pitch) * stick.distance,
            z: pos.z - Math.cos(stick.yaw) * Math.cos(stick.pitch) * stick.distance,
        };
    }

    private calculateDirection(stickRes: StickResult): Vector3 {
        return {
            x: Math.sin(stickRes.yaw) * Math.cos(stickRes.pitch),
            y: Math.sin(stickRes.pitch),
            z: -Math.cos(stickRes.yaw) * Math.cos(stickRes.pitch)
        };
    }
}
