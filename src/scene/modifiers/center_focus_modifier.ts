import {
    type FailableResult,
    type StickModifier,
    type StickResult,
    type Vector3
} from '../types';

export class CenterFocusModifier implements StickModifier {
    name = "Center Focus";
    priority = 10;
    active = true;

    constructor() {
    }

    getStick(cameraPos: Vector3): FailableResult<StickResult> {
        const distance = Math.sqrt(
            cameraPos.x ** 2 +
            cameraPos.y ** 2 +
            cameraPos.z ** 2
        );

        const pitch = Math.asin(-cameraPos.y / distance);
        const yaw = Math.atan2(-cameraPos.x, cameraPos.z);

        return {
            success: true,
            value: {
                yaw: yaw,
                pitch: pitch,
                distance: distance,
                priority: this.priority,
            },
        };
    }
}