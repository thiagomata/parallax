import {
    ELEMENT_TYPES,
    type GraphicProcessor,
    type RenderableElement,
    type SceneElementProps,
    type SceneState
} from "./types.ts";

export const createRenderable = <TTexture, TFont>(
    id: string,
    props: SceneElementProps
): RenderableElement<TTexture, TFont> => {
    return {
        id,
        props,
        assets: {},

        render(gp: GraphicProcessor<TTexture, TFont>, state: SceneState) {
            gp.push();
            gp.translate(props.position);

            const distance = gp.dist(props.position, state.camera);
            if (distance > 5000) {
                gp.pop();
                return;
            }

            switch (props.type) {
                case ELEMENT_TYPES.PANEL:
                    gp.drawPanel(props, this.assets, state);
                    break;

                case ELEMENT_TYPES.BOX:
                    gp.drawBox(props, this.assets, state);
                    break;

                case ELEMENT_TYPES.TEXT:
                    gp.drawText(props, this.assets, state);
                    break;
            }

            gp.pop();
        }
    };
};