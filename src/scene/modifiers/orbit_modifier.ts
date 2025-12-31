import type {CarModifier, FailableResult, Vector3} from "../types.ts";
import p5 from "p5";

export class OrbitModifier implements CarModifier {
    name = "Orbiting Camera";
    priority = 10;
    active = true;
    private p5: p5;
    private radius: number;

    constructor(p5: p5, radius: number) {
        this.p5 = p5;
        this.radius = radius;
    }

    getCarPosition(_initialCam: Vector3): FailableResult<{ name: string; position: Vector3 }> {
        const time = this.p5.millis() * 0.0005;

        // Exactly the same math as the dummy
        const camX = Math.sin(time) * this.radius;
        const camZ = Math.cos(time) * this.radius;
        const camY = -400 + Math.sin(time * 0.5) * 100;

        return {
            success: true,
            value: {
                name: this.name,
                position: { x: camX, y: camY, z: camZ }
            }
        };
    }
}