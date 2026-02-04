import {
    type AssetLoader,
    type GraphicsBundle,
    type BundleDynamicElement,
    type ResolvedElement,
    type MapToBlueprint, type EffectLib
} from "./types.ts";
import {SceneResolver} from "./resolver.ts";

export class AssetRegistry<
    TBundle extends GraphicsBundle,
    TEffectLib extends EffectLib> {
    // The ONLY list: A map of IDs to the actual Renderable instances
    private elements: Map<string, BundleDynamicElement<any, TBundle>> = new Map();
    private loader: AssetLoader<TBundle>;
    private readonly resolver: SceneResolver<TBundle, TEffectLib>;

    constructor(loader: AssetLoader<TBundle>, resolver?: SceneResolver<TBundle, TEffectLib>) {
        this.loader = loader;
        this.resolver = resolver ?? new SceneResolver({} as TEffectLib);
    }

    public register<T extends ResolvedElement>(
        id: string,
        blueprint: MapToBlueprint<T>
    ): BundleDynamicElement<T, TBundle> {
        // Check if we already have this instance
        const existing = this.elements.get(id);

        if (existing) {
            // Return the existing Single Source of Truth
            // We cast because the Map stores 'any' to support multiple element types
            return existing as BundleDynamicElement<T, TBundle>;
        }

        // Only create a new one if it doesn't exist
        // This triggers the createRenderable factory
        // and the loader hydration exactly once.
        const renderable = this.resolver.prepare(id, blueprint, this.loader);

        // Store the instance
        this.elements.set(id, renderable);

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