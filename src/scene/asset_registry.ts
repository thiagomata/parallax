import {
    ASSET_STATUS,
    type FontAsset,
    type SceneElementProps, type TextProps,
    type TextureAsset,
    type Vector3
} from "./types.ts";

export interface ShapeSpec<TTexture> {
    readonly id: string;
    readonly props: SceneElementProps;
    asset: TextureAsset<TTexture>;
}

export interface TextSpec< TFont> {
    readonly id: string;
    readonly props: TextProps;
    // readonly fontRef: FontRef;
    asset: FontAsset< TFont>;
}

export type ElementSpec<TTexture = any, TFont = any> = TextSpec<TFont> | ShapeSpec<TTexture>;

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
export interface Registry<TTexture = any, TFont = any> {
    /** Adds a unique specification to the system.
     * Returns the spec so it can be used immediately.
     */
    defineShape(id: string, props: SceneElementProps): ShapeSpec<TTexture>;

    defineText(id: string, props: TextProps): TextSpec<TFont>;

    getShape(id: string): ShapeSpec<TTexture> | undefined;

    getText(id: string): TextSpec<TFont> | undefined;

    all(): IterableIterator<ElementSpec>;
}

export class AssetRegistry<TTexture, TFont> implements Registry {
    // The internal store for our Blueprints
    private shapes = new Map<string, ShapeSpec<TTexture>>();
    private texts = new Map<string, TextSpec<TFont>>();

    constructor() {}

    defineShape(id: string, props: SceneElementProps): ShapeSpec<TTexture> {
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

    defineText(id: string, props: TextProps): TextSpec<TFont> {
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

        const spec: TextSpec<TFont> = {
            id,
            props,
            asset: initialAsset
        };

        this.texts.set(id, spec);
        return spec;
    }

    getText(id: string): TextSpec<TFont> | undefined {
        return this.texts.get(id)!;
    }

    getShape(id: string): ShapeSpec<TTexture> | undefined {
        return this.shapes.get(id)!;
    }

// 1. Ensure your return type matches the Interface exactly
    all(): IterableIterator<ElementSpec<TTexture, TFont>> {
        // We use a generator to "stream" both maps as one sequence
        return this.generateAll();
    }

// 2. The Generator implementation
    private *generateAll(): IterableIterator<ElementSpec<TTexture, TFont>> {
        // yield* delegates to the iterator of each map's values
        yield* this.shapes.values();
        yield* this.texts.values();
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