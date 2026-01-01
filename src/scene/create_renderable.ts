import {
    type BaseVisualProps,
    type BoxProps,
    type DynamicValueFromSceneState,
    ELEMENT_TYPES,
    type FlatBaseVisualProps,
    type FlatBoxProps,
    type FlatPanelProps,
    type FlatTextProps,
    type GraphicProcessor,
    type PanelProps,
    type RenderableElement,
    type SceneElementProps,
    type SceneState,
    type SpecProperty,
    type StaticKeys,
    type TextProps
} from "./types.ts";

export function toSpec<T>(source: DynamicValueFromSceneState<T>): SpecProperty<T> {
    if (typeof source === 'function') {
        return {
            kind: 'computed',
            compute: source as (state: SceneState) => T
        };
    }
    return {
        kind: 'static',
        value: source
    };
}

export type MapToSpec<T> = {
    [K in keyof T]: K extends StaticKeys
        ? T[K] // Leave 'type' alone
        : T[K] extends DynamicValueFromSceneState<infer U>
            ? SpecProperty<U>
            : T[K];
};

const STATIC_KEYS = new Set(['type', 'texture', 'font']);

export function toProps<T extends object>(props: T): MapToSpec<T> {
    const spec = {} as any;

    for (const key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) {
            // Do not wrap the 'type' field or any non-dynamic values
            if (STATIC_KEYS.has(key)) {
                spec[key] = props[key];
            } else {
                spec[key] = toSpec((props as any)[key]);
            }
        }
    }

    return spec as MapToSpec<T>;
}

export function flat<T>(source: SpecProperty<T>, sceneState: SceneState): T;
export function flat<T>(source: SpecProperty<T> | undefined, sceneState: SceneState): T | undefined;
export function flat<T>(source: SpecProperty<T> | undefined, sceneState: SceneState): T | undefined {
    if (source == undefined) return undefined;
    if (source.kind === 'static') {
        return source.value
    } else {
        return source.compute(sceneState);
    }
}

export function flatBaseShape(props: BaseVisualProps, sceneState: SceneState): FlatBaseVisualProps {
    return {
        position: flat(props.position, sceneState)!,
        alpha: flat(props.alpha, sceneState),
        fillColor: flat(props.fillColor, sceneState),
        strokeColor: flat(props.strokeColor, sceneState),
        strokeWidth: flat(props.strokeWidth, sceneState),
        texture: props.texture,
        font: props.font,
    } as FlatPanelProps;
}

export function flatBox(props: BoxProps, sceneState: SceneState): FlatBoxProps {
    return {
        type: ELEMENT_TYPES.BOX,
        ...flatBaseShape(props, sceneState),
        size: flat(props.size, sceneState)
    } as FlatBoxProps;
}

export function flatText(props: TextProps, sceneState: SceneState): FlatTextProps {
    return {
        type: ELEMENT_TYPES.TEXT,
        ...flatBaseShape(props, sceneState),
        text: flat(props.text, sceneState),
        size: flat(props.size, sceneState),
    } as FlatTextProps;
}

export function flatPanel(props: PanelProps, sceneState: SceneState): FlatPanelProps {
    return {
        type: ELEMENT_TYPES.PANEL,
        ...flatBaseShape(props, sceneState),
        width: flat(props.width, sceneState),
        height: flat(props.height, sceneState),
    } as FlatPanelProps;
}


export const createRenderable = <TTexture, TFont>(
    id: string,
    props: SceneElementProps
): RenderableElement<TTexture, TFont> => {


    return {
        id,
        props,
        assets: {},

        render(gp: GraphicProcessor<TTexture, TFont>, state: SceneState) {

            const position = flat(props.position, state)!;

            gp.push();
            gp.translate(position);

            const distance = gp.dist(position, state.camera);
            if (distance > 5000) {
                gp.pop();
                return;
            }

            switch (props.type) {
                case ELEMENT_TYPES.PANEL:
                    const flatPanelProp = flatPanel(props, state);
                    gp.drawPanel(flatPanelProp, this.assets, state);
                    break;

                case ELEMENT_TYPES.BOX:
                    const flatBoxProp = flatBox(props, state);
                    gp.drawBox(flatBoxProp, this.assets, state);
                    break;

                case ELEMENT_TYPES.TEXT:
                    const flatTextProp = flatText(props, state);
                    gp.drawText(flatTextProp, this.assets, state);
                    break;
            }

            gp.pop();
        }
    };
};