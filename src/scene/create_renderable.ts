import {
    DEFAULT_CAMERA_FAR,
    ELEMENT_TYPES,
    type GraphicProcessor,
    type MapToSpec,
    type RawElementsProps,
    type RenderableElement,
    type ResolvedBoxProps,
    type ResolvedPanelProps,
    type ResolvedTextProps,
    type SceneElementProps,
    type SceneState,
    type SpecProperty,
} from "./types.ts";

const STATIC_KEYS: Set<string> = new Set(['type', 'texture', 'font']);

/**
 * INTERNAL (NOT EXPORTED)
 * This is the "loose" recursive engine. It doesn't know about Box/Panel/Text.
 * It just knows how to turn any object tree into a Spec tree.
 */
function convertToSpecTree<T extends object>(props: T): MapToSpec<T> {
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
            // Recursive call to the loose internal function
            spec[key] = convertToSpecTree(value as object);
            continue;
        }

        /* Default: Wrap as Static Leaf */
        spec[key] = { kind: "static", value };
    }

    return spec as MapToSpec<T>;
}

/**
 * PUBLIC EXPORT
 * These overloads are the ONLY way to use this module from the outside.
 * They enforce that the TOP LEVEL must be a valid scene element.
 */
export function toProps<T extends RawElementsProps>(props: T): MapToSpec<T> {
    return convertToSpecTree(props);
}

/**
 * Recursive type to unwrap the tree in resolved objects
 */
type Resolved<T> = T extends SpecProperty<infer U>
    ? U
    : T extends object
        ? { [K in keyof T]: Resolved<T[K]> }
        : T;

export function resolve<T>(src: T, state: SceneState): Resolved<T> {
    /* Handle Specs (Leaf) */
    if (src && typeof src === 'object' && 'kind' in src) {
        const spec = src as unknown as SpecProperty<any>;
        return spec.kind === 'static' ? spec.value : spec.compute(state);
    }

    /* Handle Branches (Recursion) */
    if (src && typeof src === 'object' && !Array.isArray(src)) {
        const result = {} as any;
        for (const key in src) {
            result[key] = resolve(src[key], state);
        }
        return result;
    }

    /*  Handle Pass-through */
    return src as Resolved<T>;
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
                    const ResolvedPanelProp = resolve(props, state) as ResolvedPanelProps;
                    gp.drawPanel(ResolvedPanelProp, this.assets, state);
                    break;

                case ELEMENT_TYPES.BOX:
                    const ResolvedBoxProp = resolve(props, state) as ResolvedBoxProps;
                    gp.drawBox(ResolvedBoxProp, this.assets, state);
                    break;

                case ELEMENT_TYPES.TEXT:
                    const ResolvedTextProp = resolve(props, state) as ResolvedTextProps;
                    gp.drawText(ResolvedTextProp, this.assets, state);
                    break;
            }

            gp.pop();
        }
    };
};