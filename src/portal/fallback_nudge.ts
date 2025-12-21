import type { Vector3, NudgeModifier, FailableResult } from "./types";

export class FallbackNudge implements NudgeModifier {
  private primary: NudgeModifier;
  private secondary: NudgeModifier;

  constructor(primary: NudgeModifier, secondary: NudgeModifier) {
    this.primary = primary;
    this.secondary = secondary;
  }

  get active(): boolean {
    // The chain is active if either part is active
    return this.primary.active || this.secondary.active;
  }

  getNudge(currentCarPos: Vector3): FailableResult<Partial<Vector3>> {
    // 1. Try Primary
    if (this.primary.active) {
      const res = this.primary.getNudge(currentCarPos);
      if (res.error === null) return res;
    }

    // 2. Fallback to Secondary
    if (this.secondary.active) {
      const res = this.secondary.getNudge(currentCarPos);
      if (res.error === null) return res;
    }

    return { value: null, error: "Both modifiers in chain failed or inactive" };
  }
}
