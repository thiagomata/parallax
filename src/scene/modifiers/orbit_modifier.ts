import type {CarModifier, FailableResult, ResolutionContext, Vector3} from "../types.ts";
import p5 from "p5";

export class OrbitModifier implements CarModifier {
    name = "Orbiting Camera";
    priority = 10;
    active = true;
    private readonly radius: number;
    private readonly verticalBaseline: number;
    private readonly rotationSpeed: number;

    tick() {}

    constructor(_p5: p5, radius: number, verticalBaseline: number = -400, rotationSpeed: number = 0) {
        this.radius = radius;
        this.verticalBaseline = verticalBaseline;
        this.rotationSpeed = rotationSpeed;
    }

    getCarPosition(_initialCam: Vector3, context: ResolutionContext): FailableResult<{
        name: string;
        position: Vector3;
        rotation?: { yaw: number; pitch: number; roll: number };
    }> {
        const circularProgress = context.playback.progress * 2 * Math.PI;

        // Exactly the same math as the dummy
        const camX = Math.sin(circularProgress) * this.radius;
        const camZ = Math.cos(circularProgress) * this.radius;
        const camY = this.verticalBaseline;

        return {
            success: true,
            value: {
                name: this.name,
                position: {x: camX, y: camY, z: camZ},
                rotation: this.rotationSpeed ? { yaw: circularProgress * this.rotationSpeed, pitch: 0, roll: 0 } : undefined,
            }
        };
    }
}