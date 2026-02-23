import type {FailableResult, ResolutionContext, StickModifier, StickResult, Vector3,} from "./types";

export class ChainedStick implements StickModifier {
    public priority: number;
    public name: string;
    private readonly chain: StickModifier[];

    tick(sceneId: number): void {
        for( const modifier of this.chain) {
            modifier.tick(sceneId);
        }
    }

    constructor(priority: number, chain: [StickModifier, ...StickModifier[]]) {
        this.priority = priority;
        this.chain = chain;
        this.name = `ChainedStick of (${chain.map((m) => m.name).join(",")})`;
    }

    active = true;

    getStick(finalPos: Vector3, context: ResolutionContext): FailableResult<StickResult> {
        for (const modifier of this.chain) {
            if (!modifier.active) continue;
            const res = modifier.getStick(finalPos, context);
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
