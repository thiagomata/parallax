import type {
  Vector3,
  StickModifier,
  StickResult,
  FailableResult,
} from "./types";

export class ChainedStick implements StickModifier {
  public priority: number;
  public name: string;
  private chain: StickModifier[];

  constructor(priority: number, chain: StickModifier[]) {
    this.priority = priority;
    this.chain = chain;
    this.name = `ChainedStick of (${chain.map((m) => m.name).join(",")})`;
  }

  active = true;

  getStick(finalPos: Vector3): FailableResult<StickResult> {
    for (const modifier of this.chain) {
      if (!modifier.active) continue;
      const res = modifier.getStick(finalPos);
      if (res.success) {
        return {
          success: true,
          value: {
            ...res.value,
            priority: this.priority, // Override with chain priority
          }
        };
      }
    }
    return { 
      success: false,
      error: "Entire stick chain failed on " + this.name
    };
  }
}
