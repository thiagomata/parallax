import {
    ASSET_STATUS,
    type FontAsset,
    type SceneElementProps, type TextProps,
    type TextureAsset,
    type Vector3
} from "./types.ts";

export interface ShapeSpec {
    readonly id: string;
    readonly props: SceneElementProps;
    asset: TextureAsset;
}

export interface TextSpec {
    readonly id: string;
    readonly props: TextProps;
    // readonly fontRef: FontRef;
    asset: FontAsset;
}

export type ElementSpec = TextSpec | ShapeSpec;

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
    defineShape(id: string, props: SceneElementProps): ShapeSpec;

    defineText(id: string, props: TextProps): TextSpec;

    getShape(id: string): ShapeSpec | undefined;

    getText(id: string): TextSpec | undefined;

    all(): IterableIterator<ElementSpec>;
}

export class AssetRegistry implements Registry {
    // The internal store for our Blueprints
    private shapes = new Map<string, ShapeSpec>();
    private texts = new Map<string, TextSpec>();

    constructor() {}

    defineShape(id: string, props: SceneElementProps): ShapeSpec {
        if (this.shapes.has(id)) return this.shapes.get(id)!;

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

        this.shapes.set(id, spec);
        return spec;
    }

    defineText(id: string, props: TextProps): TextSpec {
        if (this.texts.has(id)) return this.texts.get(id)!;

        let initialAsset: FontAsset;

        if (props.font) {
            initialAsset = {
                status: ASSET_STATUS.PENDING,
                value: null,
                error: null
            };
        } else {
            initialAsset = {
                status: ASSET_STATUS.READY,
                value: {
                    internalRef: null
                },
                error: null
            };
        }

        const spec: TextSpec = {
            id,
            props,
            asset: initialAsset
        };

        this.texts.set(id, spec);
        return spec;
    }

    getText(id: string): TextSpec | undefined {
        return this.texts.get(id)!;
    }

    getShape(id: string): ShapeSpec | undefined {
        return this.shapes.get(id)!;
    }

    all(): IterableIterator<ElementSpec> {
        const merged = new Map([...this.shapes, ...this.texts]);
        return merged.values();
    }

    // /**
    //  * Implementation of Registry.
    //  */
    // get(id: string): ElementSpec | undefined {
    //     return this.texts.get(id);
    // }
    //
    // /**
    //  * Implementation of Registry.all
    //  * Returns an iterator for the World's hydration loop
    //  */
    // all(): IterableIterator<ElementSpec> {
    //     return this.specs.values();
    // }
}