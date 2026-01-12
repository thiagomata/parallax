import type {
    GraphicsBundle,
    AssetLoader,
    BlueprintElement,
    RenderableElement,
} from "./types";
import {createRenderable} from "./resolver.ts";

export class AssetRegistry<TBundle extends GraphicsBundle> {
    // We store the fully-formed Renderables, which include:
    // 1. The Blueprint (Intent)
    // 2. The Dynamic Plan (Phase 1)
    // 3. The Asset Containers (Phase 2)
    private elements = new Map<string, RenderableElement<TBundle>>();
    private readonly loader: AssetLoader<TBundle>;

    constructor(loader: AssetLoader<TBundle>) {
        this.loader = loader;
    }

    /**
     * Define or retrieve a renderable element.
     * This triggers Phase 1 (Compiling to Dynamic) and Phase 2 (Async Hydration).
     */
    register(id: string, blueprint: BlueprintElement): RenderableElement<TBundle> {
        const existing = this.elements.get(id);
        if (existing) return existing;

        // Use our resolver utility to build the self-hydrating element
        const element = createRenderable(id, blueprint, this.loader);

        this.elements.set(id, element);
        return element;
    }

    get(id: string): RenderableElement<TBundle> | undefined {
        return this.elements.get(id);
    }

    /**
     * Phase 3 Feed:
     * Provides the list of elements for the World's frame loop.
     */
    all(): IterableIterator<RenderableElement<TBundle>> {
        return this.elements.values();
    }

    remove(id: string) {
        this.elements.delete(id);
    }
}