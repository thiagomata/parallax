import {
    type BoxProps,
    DEFAULT_CAMERA_FAR,
    ELEMENT_TYPES,
    type ResolvedBoxProps,
    type ResolvedPanelProps,
    type ResolvedTextProps,
    type GraphicProcessor, type MapToSpec,
    type PanelProps,
    type RenderableElement,
    type SceneElementProps,
    type SceneState,
    type SpecProperty,
    type TextProps,
} from "./types.ts";


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
type Resolved<T> = T extends SpecProperty<infer U>
    ? U
    : T extends object
        ? { [K in keyof T]: Resolved<T[K]> }
        : T;

export function resolve<T>(src: T, state: SceneState): Resolved<T> {
    // Handle Specs (Leaf)
    if (src && typeof src === 'object' && 'kind' in src) {
        const spec = src as unknown as SpecProperty<any>;
        return spec.kind === 'static' ? spec.value : spec.compute(state);
    }

    // Handle Branches (Recursion)
    if (src && typeof src === 'object' && !Array.isArray(src)) {
        const result = {} as any;
        for (const key in src) {
            result[key] = resolve(src[key], state);
        }
        return result;
    }

    //  Handle Pass-through
    return src as Resolved<T>;
}

export function resolveBox(props: BoxProps, sceneState: SceneState): ResolvedBoxProps {
    return resolve(props, sceneState) as ResolvedBoxProps;
}

export function resolveText(props: TextProps, sceneState: SceneState): ResolvedTextProps {
    return resolve(props, sceneState) as ResolvedTextProps;
}

export function ResolvedPanel(props: PanelProps, sceneState: SceneState): ResolvedPanelProps {
    return resolve(props, sceneState) as ResolvedPanelProps;
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

            const position = resolve(props.position, state)!;

            gp.push();
            gp.translate(position);

            const distance = gp.dist(position, state.camera.position);
            if (distance > (state.settings.camera.far ?? DEFAULT_CAMERA_FAR )) {
                gp.pop();
                return;
            }

            switch (props.type) {
                case ELEMENT_TYPES.PANEL:
                    const ResolvedPanelProp = ResolvedPanel(props, state);
                    gp.drawPanel(ResolvedPanelProp, this.assets, state);
                    break;

                case ELEMENT_TYPES.BOX:
                    const ResolvedBoxProp = resolveBox(props, state);
                    gp.drawBox(ResolvedBoxProp, this.assets, state);
                    break;

                case ELEMENT_TYPES.TEXT:
                    const ResolvedTextProp = resolveText(props, state);
                    gp.drawText(ResolvedTextProp, this.assets, state);
                    break;
            }

            gp.pop();
        }
    };
};