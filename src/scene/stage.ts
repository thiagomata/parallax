import type {
    AssetLoader,
    GraphicProcessor,
    GraphicsBundle,
    MapToBlueprint,
    RenderableElement,
    ResolvedElement,
    SceneState
} from "./types.ts";
import {AssetRegistry} from "./asset_registry.ts";
import {SceneResolver} from "./resolver.ts";

export class Stage<TBundle extends GraphicsBundle> {
    private registry: AssetRegistry<TBundle, {}>;
    private resolver: SceneResolver<TBundle, {}>;

    constructor(loader: AssetLoader<TBundle>) {
        this.resolver = new SceneResolver<TBundle, {}>({});
        this.registry = new AssetRegistry<TBundle, {}>(loader, this.resolver);
    }

    public add<T extends ResolvedElement>(id: string, blueprint: MapToBlueprint<T>): void {
        this.registry.register<T>(id, blueprint);
    }

    public remove(id: string): void {
        this.registry.remove(id);
    }

    public getElement(id: string): RenderableElement<any, TBundle> | undefined {
        return this.registry.get(id);
    }

    public render(gp: GraphicProcessor<TBundle>, state: SceneState): void {
        // Optimized Painter's Algorithm: Sort far-to-near
        const renderQueue = Array.from(this.registry.all())
            .map(element => ({
                element,                 distance: gp.dist(state.camera.position, this.resolver.resolveProperty(element.dynamic.position, state))
            }))
            .sort((a, b) => b.distance - a.distance);

        renderQueue.forEach(({element}) => {
            element.render(gp, state);
        });
    }
}