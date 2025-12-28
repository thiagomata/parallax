import {
    ELEMENT_TYPES,
    type GraphicProcessor,
    type RenderableElement,
    type SceneElementProps,
    type SceneState
} from "./types.ts";

export const createRenderable = (id: string, props: SceneElementProps): RenderableElement => {
    return {
        id,
        props,
        assets: {},

        render(gp: GraphicProcessor, state: SceneState) {
            gp.push();

            // 1. Basic Placement
            gp.translate(props.position.x, props.position.y, props.position.z);

            // 2. Intelligent behaviour using State
            // Example: Calculate distance from camera to decide if we should even draw
            const distance = gp.dist(props.position, state.camera);

            // If the object is too far away, we might skip high-quality rendering
            if (distance > 5000) {
                gp.pop();
                return;
            }

            // 3. Unwrapping Logic
            switch (props.type) {
                case ELEMENT_TYPES.PANEL:
                    const texture = this.assets.texture;
                    if (texture?.value) {
                        gp.drawTexture(texture.value, props.width, props.height, props.alpha ?? 255);
                    } else {
                        // ... loading/error logic ...
                    }
                    break;

                case ELEMENT_TYPES.BOX:
                    gp.drawBox(props.size);
                    break;
            }

            gp.pop();
        }
    };
};