import type {CarModifier, FailableResult, ResolutionContext, Vector3} from "../types.ts";
import p5 from "p5";

export class OrbitModifier implements CarModifier {
    name = "Orbiting Camera";
    priority = 10;
    active = true;
    private readonly radius: number;
    private readonly verticalBaseline: number;

    tick() {}

    constructor(_p5: p5, radius: number, verticalBaseline: number = -400) {
        this.radius = radius;
        this.verticalBaseline = verticalBaseline;
    }

    getCarPosition(_initialCam: Vector3, context: ResolutionContext): FailableResult<{
        name: string;
        position: Vector3
    }> {
        const circularProgress = context.playback.progress * 2 * Math.PI;

        // Exactly the same math as the dummy
        const camX = Math.sin(circularProgress) * this.radius;
        const camZ = Math.cos(circularProgress) * this.radius;
        const camY = this.verticalBaseline + Math.sin(circularProgress * 0.5) * 100;

        return {
            success: true,
            value: {
                name: this.name,
                position: {x: camX, y: camY, z: camZ},
            }
        };
    }
}