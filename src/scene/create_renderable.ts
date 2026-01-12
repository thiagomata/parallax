import {
    DEFAULT_CAMERA_FAR,
    ELEMENT_TYPES,
    SPEC_KINDS,
    type GraphicProcessor,
    type RenderableElement,
    type ResolvedElement,
    type BlueprintElement,
    type SceneState,
    type DynamicProperty,
    type MapToDynamic,
} from "./types.ts";

/**
 * Confirmed Recursive Sieve:
 * Unwraps DynamicProperty containers and traverses nested objects.
 */
export type Unwrapped<T> = T extends DynamicProperty<infer U>
    ? Unwrapped<U>
    : T extends object
        ? { [K in keyof T]: Unwrapped<T[K]> }
        : T;

/**
 * Type-safe resolution using the Unwrapped mapping.
 * Guided by the type system to maintain identity from Dynamic to Resolved.
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
                return resolve(src.compute(state), state) as Unwrapped<T>;
        }
    }

    // 2. Handle Objects (The Branch)
    if (src && typeof src === 'object' && !Array.isArray(src)) {
        const result = {} as { [K in keyof T]: Unwrapped<T[K]> };

        for (const key in src) {
            if (Object.prototype.hasOwnProperty.call(src, key)) {
                // Recursive call maintains the specific key's type safety
                result[key] = resolve(src[key], state);
            }
        }
        return result as Unwrapped<T>;
    }

    // 3. Leaf / Primitive identity
    return src as Unwrapped<T>;
}

export const createRenderable = <TTexture, TFont>(
    id: string,
    blueprint: BlueprintElement, // Plain blueprint, no magic types
): RenderableElement<TTexture, TFont> => {

    // The dynamic tree mirrors the Blueprint exactly
    const dynamicTree = toDynamic(blueprint) as MapToDynamic<ResolvedElement>;

    return {
        id,
        blueprint,
        assets

        render(gp: GraphicProcessor<TTexture, TFont>, state: SceneState) {
            // 1. Resolve the dynamic tree into solid data
            // (e.g., DynamicProperty<TextureRef> becomes TextureRef)
            const resolved = resolve(dynamicTree, state);

            gp.push();
            gp.translate(resolved.position);

            // 2. Frustum Culling
            const distance = gp.dist(resolved.position, state.camera.position);
            if (distance > (state.settings.camera.far ?? DEFAULT_CAMERA_FAR)) {
                gp.pop();
                return;
            }

            // 3. Execution
            // The GraphicProcessor implementation of drawBox will handle:
            // const instance = this.assetLoader.getTexture(resolved.texture);
            switch (resolved.type) {
                case ELEMENT_TYPES.BOX:
                    gp.drawBox(resolved, state);
                    break;
                case ELEMENT_TYPES.PANEL:
                    gp.drawPanel(resolved, state);
                    break;
                case ELEMENT_TYPES.TEXT:
                    gp.drawText(resolved, state);
                    break;
            }

            gp.pop();
        }
    };
};

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

/**
 * Transforms a Blueprint tree into a Dynamic tree.
 * Guided by MapToDynamic<T> to ensure the structure mirrors the Resolved type.
 */
export function toDynamic<T>(blueprint: T): MapToDynamic<T> {
    // 1. If the blueprint is a function, it's a Computed leaf at the root
    if (typeof blueprint === "function") {
        return {
            kind: SPEC_KINDS.COMPUTED,
            compute: blueprint as (state: SceneState) => any,
        } as unknown as MapToDynamic<T>;
    }

    // 2. If it's an object (but not null/array), we traverse its branches
    if (blueprint && typeof blueprint === "object" && !Array.isArray(blueprint)) {
        const dynamic = {} as Record<keyof T, unknown>;

        for (const key in blueprint) {
            if (!Object.prototype.hasOwnProperty.call(blueprint, key)) continue;

            const value = blueprint[key];

            // Reserved identity keys (like 'type') are passed through as-is
            if (key === "type" || key === "id") {
                dynamic[key] = value;
                continue;
            }

            // Recursive Wrapping Logic
            if (typeof value === "function") {
                dynamic[key] = {
                    kind: SPEC_KINDS.COMPUTED,
                    compute: value,
                };
            } else if (value && typeof value === "object" && !Array.isArray(value)) {
                // We treat nested objects as Branches to allow deep resolution
                dynamic[key] = {
                    kind: SPEC_KINDS.BRANCH,
                    value: toDynamic(value),
                };
            } else {
                // Primitives or solid Refs are Static leaves
                dynamic[key] = {
                    kind: SPEC_KINDS.STATIC,
                    value,
                };
            }
        }

        return dynamic as MapToDynamic<T>;
    }

    // 3. Fallback for raw primitives passed as blueprints
    return {
        kind: SPEC_KINDS.STATIC,
        value: blueprint,
    } as unknown as MapToDynamic<T>;
}