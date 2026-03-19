import {
    type AssetLoader,
    type GraphicsBundle,
    type BundleDynamicElement,
    type ResolvedElement,
    type MapToBlueprint, type EffectLib
} from "../types.ts";
import {ElementResolver} from "../resolver/element_resolver.ts";

export class ElementAssetRegistry<
    TBundle extends GraphicsBundle,
    TEffectLib extends EffectLib> {
    // The ONLY list: A map of IDs to the actual Renderable instances
    private readonly elements: Map<string, BundleDynamicElement<any, TBundle>> = new Map();
    private readonly loader: AssetLoader<TBundle>;
    private readonly resolver: ElementResolver<TBundle, TEffectLib>;

    constructor(loader: AssetLoader<TBundle>, resolver?: ElementResolver<TBundle, TEffectLib>) {
        this.loader = loader;
        this.resolver = resolver ?? new ElementResolver({} as TEffectLib);
    }

    public register<T extends ResolvedElement>(
        blueprint: MapToBlueprint<T>
    ): BundleDynamicElement<T, TBundle> {
        // Check if we already have this instance
        const existing = this.elements.get(blueprint.id);

        if (existing) {
            // Return the existing Single Source of Truth
            // We cast because the Map stores 'any' to support multiple element types
            return existing as BundleDynamicElement<T, TBundle>;
        }

        // Only create a new one if it doesn't exist
        // This triggers the createRenderable factory
        // and the loader hydration exactly once.
        const renderable = this.resolver.prepare(blueprint, this.loader);

        // Store the instance
        this.elements.set(blueprint.id, renderable);

        return renderable;
    }

    public get(id: string): BundleDynamicElement<any, TBundle> | undefined {
        return this.elements.get(id);
    }

    /**
     * For the Frame Loop
     */
    public all(): IterableIterator<BundleDynamicElement<any, TBundle>> {
        return this.elements.values();
    }

    public remove(id: string): void {
        this.elements.delete(id);
    }
}