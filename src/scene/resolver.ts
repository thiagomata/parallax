import {
    ELEMENT_TYPES,
    SPEC_KINDS,
    type GraphicProcessor,
    type RenderableElement,
    type ResolvedElement,
    type BlueprintElement,
    type SceneState,
    type DynamicProperty,
    type MapToDynamic,
    type GraphicsBundle,
    type DynamicElement,
    type Unwrapped, type AssetLoader, type ElementAssets, ASSET_STATUS,
} from "./types";

/**
 * PHASE 1 & 2: REGISTRATION & HYDRATION
 */
export const createRenderable = <TBundle extends GraphicsBundle>(
    id: string,
    blueprint: BlueprintElement,
    loader: AssetLoader<TBundle>
): RenderableElement<TBundle> => {

    const dynamic = toDynamic(blueprint) as DynamicElement;

    // Determine Initial States:
    // If no ref exists, we are READY (null). If it exists, we are PENDING.
    const assets: ElementAssets<TBundle> = {
        texture: blueprint.texture
            ? { status: ASSET_STATUS.PENDING, value: null }
            : { status: ASSET_STATUS.READY, value: null },
        font: blueprint.font
            ? { status: ASSET_STATUS.PENDING, value: null }
            : { status: ASSET_STATUS.READY, value: null }
    };

    if (blueprint.texture) {
        loader.hydrateTexture(blueprint.texture)
            .then(asset => assets.texture = asset);
    }

    if (blueprint.font) {
        loader.hydrateFont(blueprint.font)
            .then(asset => assets.font = asset);
    }

    return {
        id,
        blueprint,
        dynamic,
        assets,

        render(gp: GraphicProcessor<TBundle>, state: SceneState) {
            const resolved = resolve(this.dynamic, state) as ResolvedElement;

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
                }
            }

            gp.pop();
        }
    };
};

/**
 * Deep Blueprint-to-Dynamic Compiler
 */
export function toDynamic<T>(blueprint: T): MapToDynamic<T> {
    // 1. Root level functions
    if (typeof blueprint === "function") {
        return {
            kind: SPEC_KINDS.COMPUTED,
            compute: blueprint as (state: SceneState) => any,
        } as unknown as MapToDynamic<T>;
    }

    // 2. Branching Objects
    if (blueprint && typeof blueprint === "object" && !Array.isArray(blueprint)) {
        const dynamic = {} as any;

        for (const key in blueprint) {
            if (!Object.prototype.hasOwnProperty.call(blueprint, key)) continue;

            const value = blueprint[key];

            // Static key exceptions (Maintain identity)
            if (key === "type" || key === "texture" || key === "font") {
                dynamic[key] = value;
                continue;
            }

            if (typeof value === "function") {
                dynamic[key] = { kind: SPEC_KINDS.COMPUTED, compute: value };
            } else if (value && typeof value === "object" && !Array.isArray(value)) {
                // Nest as a branch to allow individual property resolution later
                dynamic[key] = { kind: SPEC_KINDS.BRANCH, value: toDynamic(value) };
            } else {
                dynamic[key] = { kind: SPEC_KINDS.STATIC, value };
            }
        }

        return dynamic as MapToDynamic<T>;
    }

    // 3. Leaf Primitives
    return { kind: SPEC_KINDS.STATIC, value: blueprint } as unknown as MapToDynamic<T>;
}

/**
 * PHASE 3 (Moment 2): THE RESOLUTION SIEVE
 * A pure function that recursively unwraps the Dynamic execution plan into Resolved data.
 */
export function resolve<T>(src: T, state: SceneState): Unwrapped<T> {
    // 1. Handle DynamicProperty (The Container)
    if (isDynamicProperty(src)) {
        switch (src.kind) {
            case SPEC_KINDS.STATIC:
                return src.value as Unwrapped<T>;
            case SPEC_KINDS.BRANCH:
                return resolve(src.value, state) as Unwrapped<T>;
            case SPEC_KINDS.COMPUTED:
                // Recursive call handles computed functions that return objects or other properties
                return resolve(src.compute(state), state) as Unwrapped<T>;
        }
    }

    // 2. Handle Objects (The Branch)
    if (src && typeof src === 'object' && !Array.isArray(src)) {
        const result = {} as any;
        for (const key in src) {
            if (Object.prototype.hasOwnProperty.call(src, key)) {
                result[key] = resolve(src[key], state);
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