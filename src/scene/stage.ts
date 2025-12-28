import type {AssetLoader, GraphicProcessor, RenderableElement, SceneState} from "./types.ts";

export class Stage {
    // THE STORAGE: Where your renderables live after being created/cast
    private registry: Map<string, RenderableElement> = new Map();

    /**
     * Add a 'Spec' to the storage
     */
    public add(element: RenderableElement) {
        this.registry.set(element.id, element);
    }

    /**
     * The "Casting" process: Iterates through storage and hydrates assets
     */
    public async hydrateAll(loader: AssetLoader) {
        const elements = Array.from(this.registry.values());

        // We process all "orders" in the storage
        await Promise.all(elements.map(async (el) => {
            if (el.props.texture && !el.assets.texture) {
                el.assets.texture = await loader.hydrateTexture(el.props.texture);
            }
            if (el.props.font && el.assets.font) {
                el.assets.font = await loader.hydrateFont(el.props.font);
            }
        }));
    }

    /**
     * The Game Loop: Replays what is in storage
     */
    public render(gp: GraphicProcessor, state: SceneState) {
        this.registry.forEach(el => el.render(gp, state));
    }
}