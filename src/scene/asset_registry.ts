import {ASSET_STATUS, type SceneElementProps, type TextureAsset, type Vector3} from "./types.ts";

/**
 * The "Blueprint" or "Work Order"
 * Combines the user's intent (props) with the resulting asset.
 */
export interface ElementSpec {
    readonly id: string;
    readonly props: SceneElementProps;
    asset: TextureAsset;
}

/**
 * The "Placement"
 * Just a reference to a Spec and a location in space.
 */
export interface Instance {
    readonly specId: string;
    readonly position: Vector3;
}

/**
 * The Registry Interface
 * Its job is to manage the 'Blueprints' (Specs) of what can exist in the scene.
 */
export interface Registry {
    /** Adds a unique specification to the system.
     * Returns the spec so it can be used immediately.
     */
    define(id: string, props: SceneElementProps): ElementSpec;

    /** * Retrieves a spec by its unique identifier.
     */
    get(id: string): ElementSpec | undefined;

    /**
     * Returns all unique specs currently registered.
     * Useful for the World's 'hydrateAll' loop.
     */
    all(): IterableIterator<ElementSpec>;
}

export class AssetRegistry implements Registry {
    // The internal store for our Blueprints
    private specs = new Map<string, ElementSpec>();

    constructor() {}

    /**
     * Implementation of Registry.define
     */
    define(id: string, props: SceneElementProps): ElementSpec {
        if (this.specs.has(id)) return this.specs.get(id)!;

        // We initialise the asset bucket based on whether a texture is requested
        let initialAsset: TextureAsset;

        if (props.texture) {
            // Case A: Needs loading
            initialAsset = {
                status: ASSET_STATUS.PENDING,
                value: null,
                error: null
            };
        } else {
            // Case B: No texture needed (The "Born Ready" fix)
            // To satisfy the type, we must treat this as a 'READY' state.
            // If your type requires a value to be TextureInstance,
            // we provide a 'null-object' or adjust the type.
            initialAsset = {
                status: ASSET_STATUS.READY,
                value: {
                    internalRef: null
                },
                error: null
            };
        }

        const spec: ElementSpec = {
            id,
            props,
            asset: initialAsset
        };

        this.specs.set(id, spec);
        return spec;
    }

    /**
     * Implementation of Registry.get
     */
    get(id: string): ElementSpec | undefined {
        return this.specs.get(id);
    }

    /**
     * Implementation of Registry.all
     * Returns an iterator for the World's hydration loop
     */
    all(): IterableIterator<ElementSpec> {
        return this.specs.values();
    }
}