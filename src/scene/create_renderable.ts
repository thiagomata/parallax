import {
    type BaseVisualProps,
    type BoxProps, DEFAULT_CAMERA_FAR, type DynamicValueFromSceneState,
    ELEMENT_TYPES,
    type FlatBaseVisualProps,
    type FlatBoxProps,
    type FlatPanelProps,
    type FlatTextProps,
    type GraphicProcessor, type MapToSpec,
    type PanelProps,
    type RenderableElement,
    type SceneElementProps,
    type SceneState,
    type SpecProperty,
    type TextProps,
} from "./types.ts";

export function toSpecComputed<T>(source: (state: SceneState) => T): SpecProperty<T> {
    return {
        kind: 'computed',
        compute: source,
    }
}

export function toSpec<T>(source: DynamicValueFromSceneState<T>): SpecProperty<T> {
    if (typeof source === 'function') {
        return {
            kind: 'computed',
            compute: source as (state: SceneState) => T
        };
    }
    return {
        kind: 'static',
        value: source as T
    };
}

const STATIC_KEYS: Set<string> = new Set(['type', 'texture', 'font']);

export function toProps<T extends object>(props: T): MapToSpec<T> {
    const spec = {} as any;

    for (const key in props) {
        const value = props[key];

        /* Static Key Pass-through */
        if (STATIC_KEYS.has(key)) {
            spec[key] = value;
            continue;
        }

        /* Handle Null/Undefined */
        if (value === null || value === undefined) {
            spec[key] = value;
            continue;
        }

        /* Is it a function? Wrap as Atomic Spec */
        if (typeof value === "function") {
            spec[key] = { kind: "computed", compute: value };
            continue;
        }

        /* Is it a plain object? Recurse */
        if (typeof value === "object" && !Array.isArray(value)) {
            spec[key] = toProps(value as object);
            continue;
        }

        /* Default: Wrap as Static Leaf */
        spec[key] = { kind: "static", value };
    }

    return spec as MapToSpec<T>;
}

// Recursive type to unwrap the tree in resolved objects
type Flatten<T> = T extends SpecProperty<infer U>
    ? U
    : T extends object
        ? { [K in keyof T]: Flatten<T[K]> }
        : T;

export function flat<T>(src: T, state: SceneState): Flatten<T> {
    // Handle Specs (Leaf)
    if (src && typeof src === 'object' && 'kind' in src) {
        const spec = src as unknown as SpecProperty<any>;
        return spec.kind === 'static' ? spec.value : spec.compute(state);
    }

    // Handle Branches (Recursion)
    if (src && typeof src === 'object' && !Array.isArray(src)) {
        const result = {} as any;
        for (const key in src) {
            result[key] = flat(src[key], state);
        }
        return result;
    }

    //  Handle Pass-through
    return src as Flatten<T>;
}

export function flatBaseShape(props: BaseVisualProps, sceneState: SceneState): FlatBaseVisualProps {
    return {
        position: flat(props.position, sceneState)!,
        alpha: flat(props.alpha, sceneState),
        fillColor: flat(props.fillColor, sceneState),
        strokeColor: flat(props.strokeColor, sceneState),
        strokeWidth: flat(props.strokeWidth, sceneState),
        rotate: flat(props.rotate, sceneState),
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
    props: SceneElementProps,
): RenderableElement<TTexture, TFont> => {


    return {
        id,
        props,
        assets: {},

        render(gp: GraphicProcessor<TTexture, TFont>, state: SceneState) {

            const position = flat(props.position, state)!;

            gp.push();
            gp.translate(position);

            const distance = gp.dist(position, state.camera.position);
            if (distance > (state.settings.camera.far ?? DEFAULT_CAMERA_FAR )) {
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