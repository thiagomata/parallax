import type {
  Vector3,
  StickModifier,
  StickResult,
  FailableResult,
} from "./types";

export class ChainedStick implements StickModifier {
  public priority: number;
  private chain: StickModifier[];

  constructor(priority: number, chain: StickModifier[]) {
    this.priority = priority;
    this.chain = chain;
  }

  active = true;

  getStick(finalPos: Vector3): FailableResult<StickResult> {
    for (const modifier of this.chain) {
      if (!modifier.active) continue;
      const res = modifier.getStick(finalPos);
      if (res.error === null && res.value) {
        return {
          value: {
            ...res.value,
            priority: this.priority, // Override with chain priority
          },
          error: null,
        };
      }
    }
    return { value: null, error: "Entire stick chain failed" };
  }
}
