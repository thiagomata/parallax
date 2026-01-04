import type {CarModifier, FailableResult, SceneState, Vector3} from "../types.ts";
import p5 from "p5";

export class OrbitModifier implements CarModifier {
    name = "Orbiting Camera";
    priority = 10;
    active = true;
    private radius: number;

    constructor(_p5: p5, radius: number) {
        this.radius = radius;
    }

    getCarPosition(_initialCam: Vector3, currentState: SceneState): FailableResult<{ name: string; position: Vector3 }> {
        const circularProgress = currentState.playback.progress * 2 * Math.PI;

        // Exactly the same math as the dummy
        const camX = Math.sin(circularProgress) * this.radius;
        const camZ = Math.cos(circularProgress) * this.radius;
        const camY = -400 + Math.sin(circularProgress * 0.5) * 100;

        return {
            success: true,
            value: {
                name: this.name,
                position: {x: camX, y: camY, z: camZ}
            }
        };
    }
}