import type {FailableResult, NudgeModifier, SceneState, Vector3} from "./types";

export class FallbackNudge implements NudgeModifier {
    public name: string;
    private primary: NudgeModifier;
    private secondary: NudgeModifier;

    tick(): void {}

    constructor(primary: NudgeModifier, secondary: NudgeModifier) {
        this.primary = primary;
        this.secondary = secondary;
        this.name = "try_" + primary.name + "_else_" + secondary.name;
    }

    get active(): boolean {
        // The chain is active if either part is active
        return this.primary.active || this.secondary.active;
    }

    getNudge(currentCarPos: Vector3, state: SceneState): FailableResult<Partial<Vector3>> {
        // Try Primary
        if (this.primary.active) {
            const res = this.primary.getNudge(currentCarPos, state);
            if (res.success) return res;
        }

        // Fallback to Secondary
        if (this.secondary.active) {
            const res = this.secondary.getNudge(currentCarPos, state);
            if (res.success) return res;
        }

        return {
            success: false,
            error: "Both modifiers in chain failed or inactive"
        };
    }
}
