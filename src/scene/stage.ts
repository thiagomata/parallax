import type {
    AssetLoader, GraphicProcessor, GraphicsBundle, MapToBlueprint, ResolvedElement, SceneState
} from "./types.ts";
import {AssetRegistry} from "./asset_registry.ts";
import {resolveProperty} from "./resolver.ts";

export class Stage<TBundle extends GraphicsBundle> {
    private registry: AssetRegistry<TBundle>;

    constructor(loader: AssetLoader<TBundle>) {
        this.registry = new AssetRegistry<TBundle>(loader);
    }

    public add<T extends ResolvedElement>(id: string, blueprint: MapToBlueprint<T>): void {
        this.registry.register<T>(id, blueprint);
    }

    public render(gp: GraphicProcessor<TBundle>, state: SceneState): void {
        // Optimized Painter's Algorithm: Sort far-to-near
        const renderQueue = Array.from(this.registry.all())
            .map(element => ({
                element, distance: gp.dist(state.camera.position, resolveProperty(element.dynamic.position, state))
            }))
            .sort((a, b) => b.distance - a.distance);

        renderQueue.forEach(({element}) => element.render(gp, state));
    }
}