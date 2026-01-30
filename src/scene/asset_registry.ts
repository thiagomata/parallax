import {
    type EffectBundle,
    type AssetLoader,
    type GraphicsBundle,
    type RenderableElement,
    type ResolvedElement,
    type MapToBlueprint
} from "./types.ts";
import {SceneResolver} from "./resolver.ts";

export class AssetRegistry<
    TBundle extends GraphicsBundle,
    TBehaviorLib extends Record<string, EffectBundle<any, any, any>>> {
    // The ONLY list: A map of IDs to the actual Renderable instances
    private elements: Map<string, RenderableElement<any, TBundle>> = new Map();
    private loader: AssetLoader<TBundle>;
    private readonly resolver: SceneResolver<TBundle, TBehaviorLib>;

    constructor(loader: AssetLoader<TBundle>, resolver?: SceneResolver<TBundle, TBehaviorLib>) {
        this.loader = loader;
        this.resolver = resolver ?? new SceneResolver({} as TBehaviorLib);
    }

    public register<T extends ResolvedElement>(
        id: string,
        blueprint: MapToBlueprint<T>
    ): RenderableElement<T, TBundle> {
        // 1. Check if we already have this instance
        const existing = this.elements.get(id);

        if (existing) {
            // Return the existing Single Source of Truth
            // We cast because the Map stores 'any' to support multiple element types
            return existing as RenderableElement<T, TBundle>;
        }

        // 2. Only create a new one if it doesn't exist
        // This triggers the createRenderable factory
        // and the loader hydration exactly once.
        const renderable = this.resolver.createRenderable(id, blueprint, this.loader);

        // 3. Store the instance
        this.elements.set(id, renderable);

        return renderable;
    }

    public get(id: string): RenderableElement<any, TBundle> | undefined {
        return this.elements.get(id);
    }

    /**
     * For the Frame Loop
     */
    public all(): IterableIterator<RenderableElement<any, TBundle>> {
        return this.elements.values();
    }

    public remove(id: string): void {
        this.elements.delete(id);
    }
}