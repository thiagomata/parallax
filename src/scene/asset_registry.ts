import {type AssetLoader, type GraphicsBundle, type RenderableElement, type ResolvedElement} from "./types.ts";
import {createRenderable} from "./resolver.ts";

export class AssetRegistry<TBundle extends GraphicsBundle> {
    // The ONLY list: A map of IDs to the actual Renderable instances
    private elements: Map<string, RenderableElement<any, TBundle>> = new Map();
    private loader: AssetLoader<TBundle>;

    constructor(loader: AssetLoader<TBundle>) {
        this.loader = loader;
    }

    public register<T extends ResolvedElement>(
        id: string,
        blueprint: any
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
        const renderable = createRenderable<T, TBundle>(id, blueprint, this.loader);

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