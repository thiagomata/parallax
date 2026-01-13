import {
    ASSET_STATUS,
    type AssetLoader,
    type DynamicElement,
    type DynamicProperty,
    ELEMENT_TYPES,
    type ElementAssets,
    type GraphicProcessor,
    type GraphicsBundle,
    type MapToBlueprint,
    type MapToDynamic,
    type RenderableElement,
    type ResolvedElement,
    type SceneState,
    SPEC_KINDS,
    type Unwrapped,
} from "./types";

export const createRenderable =
    <T extends ResolvedElement, TBundle extends GraphicsBundle>(
        id: string,
        blueprint: MapToBlueprint<T>,
        loader: AssetLoader<TBundle>
    ): RenderableElement<T, TBundle> => {

        const dynamic = toDynamic(blueprint) as DynamicElement<T>;

        const assets: ElementAssets<TBundle> = {
            texture: blueprint.texture ? {status: ASSET_STATUS.PENDING, value: null} : {
                status: ASSET_STATUS.READY,
                value: null
            },
            font: blueprint.font ? {status: ASSET_STATUS.PENDING, value: null} : {
                status: ASSET_STATUS.READY,
                value: null
            }
        };

        if (blueprint.texture) {
            loader.hydrateTexture(blueprint.texture)
                .then(asset => assets.texture = asset);
        }

        if (blueprint.font) {
            loader.hydrateFont(blueprint.font)
                .then(asset => {
                    assets.font = asset
                });
        }

        return {
            id,
            dynamic,
            assets,

            render(gp: GraphicProcessor<TBundle>, state: SceneState) {
                const resolved = resolve(this, state)

                gp.push();
                gp.translate(resolved.position);

                const distance = gp.dist(resolved.position, state.camera.position);
                const far = state.settings.camera.far ?? 5000;

                if (distance < far) {
                    switch (resolved.type) {
                        case ELEMENT_TYPES.BOX:
                            gp.drawBox(resolved, this.assets, state);
                            break;
                        case ELEMENT_TYPES.PANEL:
                            gp.drawPanel(resolved, this.assets, state);
                            break;
                        case ELEMENT_TYPES.TEXT:
                            gp.drawText(resolved, this.assets, state);
                            break;
                        case ELEMENT_TYPES.SPHERE:
                            gp.drawSphere(resolved, this.assets, state);
                            break;
                        case ELEMENT_TYPES.FLOOR:
                            gp.drawFloor(resolved, this.assets, state);
                            break;
                        default:
                            throw new Error(`Unknown type ${resolved}`);
                    }
                }

                gp.pop();
            }
        };
    };

export function toDynamic<T extends ResolvedElement>(
    blueprint: MapToBlueprint<T>
): MapToDynamic<T> {
    const dynamic = {} as any;

    for (const key in blueprint) {
        if (!Object.prototype.hasOwnProperty.call(blueprint, key)) continue;

        const value = blueprint[key];

        // Identity Keys: Respect the Manifest (Asset Preservation)
        if (key === "type" || key === "texture" || key === "font") {
            dynamic[key] = value;
            continue;
        }

        // Map every other property to its DynamicProperty plan
        dynamic[key] = compileProperty(value);
    }

    return dynamic as MapToDynamic<T>;
}


export type UnwrappedElement<E> = E extends RenderableElement<infer T, any> ? T : never;

export function resolve<E extends RenderableElement<any, any>>(
    element: E,
    state: SceneState
): UnwrappedElement<E> {
    // We unwrap the 'dynamic' property, which is DynamicElement<T>
    // The result is T, which matches UnwrappedElement<E>
    return loopResolve(element.dynamic, state) as UnwrappedElement<E>;
}

export function resolveProperty<V>(
    prop: DynamicProperty<V>,
    state: SceneState
): V {
    return loopResolve(prop, state) as V;
}

function isStaticData(val: any): boolean {
    if (typeof val === 'function') return false;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        return Object.values(val).every(isStaticData);
    }
    return true;
}

function compileProperty<V>(value: V): DynamicProperty<V> {
    // 1. Function -> Computed
    if (typeof value === 'function') {
        return {
            kind: SPEC_KINDS.COMPUTED,
            compute: value as (state: SceneState) => any
        };
    }

    // 2. Objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        // SHORT-CIRCUIT: If the whole object is static (like a Vector3),
        // wrap it once and stop. No "Static Inception."
        if (isStaticData(value)) {
            return {kind: SPEC_KINDS.STATIC, value};
        }

        // Otherwise, it's a Branch: recursively compile its children
        const dynamicBranch: any = {};
        for (const key in value) {
            dynamicBranch[key] = compileProperty(value[key]);
        }

        return {kind: SPEC_KINDS.BRANCH, value: dynamicBranch};
    }

    // 3. Leaf Primitives
    return {kind: SPEC_KINDS.STATIC, value};
}

/**
 * PHASE 3 (Moment 2): THE RESOLUTION SIEVE
 * A pure function that recursively unwraps the Dynamic execution plan into Resolved data.
 */
function loopResolve<T>(src: T, state: SceneState): Unwrapped<T> {
    // 1. Handle DynamicProperty (The Container)
    if (isDynamicProperty(src)) {
        switch (src.kind) {
            case SPEC_KINDS.STATIC:
                return src.value as Unwrapped<T>;
            case SPEC_KINDS.BRANCH:
                return loopResolve(src.value, state) as Unwrapped<T>;
            case SPEC_KINDS.COMPUTED:
                // Recursive call handles computed functions that return objects or other properties
                return loopResolve(src.compute(state), state) as Unwrapped<T>;
        }
    }

    // 2. Handle Objects (The Branch)
    if (src && typeof src === 'object' && !Array.isArray(src)) {
        const result = {} as any;
        for (const key in src) {
            if (Object.prototype.hasOwnProperty.call(src, key)) {
                result[key] = loopResolve(src[key], state);
            }
        }
        return result as Unwrapped<T>;
    }

    // 3. Leaf / Primitive identity
    return src as Unwrapped<T>;
}

/**
 * Internal Type Guard for DynamicProperty
 */
function isDynamicProperty<T>(obj: unknown): obj is DynamicProperty<T> {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'kind' in obj &&
        Object.values(SPEC_KINDS).includes((obj as any).kind)
    );
}