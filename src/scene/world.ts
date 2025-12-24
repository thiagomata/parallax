import {
    ASSET_STATUS,
    type AssetLoader, type GraphicProcessor, type RenderableElement, type SceneElementProps, type SceneState,
    type TextureAsset
} from "./types.ts";
import type {SceneManager} from "./scene_manager.ts";
import {createRenderable} from "./create_renderable.ts";

export class World {
    private registry: Map<string, RenderableElement> = new Map();
    private sceneManager: SceneManager;
    private textureCache: Map<string, Promise<TextureAsset>> = new Map();
    
    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
    }

    /**
     * STEP 1: Add a "Spec" to the world.
     * This creates the object but it is not "Ready" yet.
     */
    public addElement(id: string, props: SceneElementProps): void {
        const element = createRenderable(id, props);
        this.registry.set(id, element);
    }

    /**
     * STEP 2: The "Casting" / Hydration.
     * This takes all elements in storage and fills their asset slots.
     */
    public async hydrate(loader: AssetLoader): Promise<void> {
        const elements = Array.from(this.registry.values());

        const tasks = elements.map(async (el) => {
            if (el.assets.main) return;

            const tex = el.props.texture;
            if (tex) {
                // If this path isn't being loaded yet, start it
                if (!this.textureCache.has(tex.path)) {
                    this.textureCache.set(tex.path, loader.hydrate(tex));
                }

                // Wait for the shared promise (deduplication)
                el.assets.main = await this.textureCache.get(tex.path)!;
            } else {
                el.assets.main = {
                    status: ASSET_STATUS.READY,
                    value: null,
                    error: null
                };
            }
        });

        await Promise.all(tasks);
    }

    /**
     * STEP 3 & 4: The Game Loop.
     * Coordinates the Manager's camera and the Renderables.
     */
    public step(graphicProcessor: GraphicProcessor): void {
        // 1. Get the current Perspective from the SceneManager
        const state = this.sceneManager.calculateScene();

        // 2. Set the Global Camera on the Engine
        graphicProcessor.setCamera(state.camera, state.lookAt);

        // 3. Draw every object in storage
        // The Renderables check their own 'assets' to see if they are Ready or Gray
        this.registry.forEach((element) => {
            element.render(graphicProcessor, state);
        });

        // 4. Optional: Handle Debug Logging
        if (state.debug) {
            this.renderDebugInfo(graphicProcessor, state);
        }
    }

    private renderDebugInfo(graphicProcessor: GraphicProcessor, state: SceneState) {
        if (!state.debug) return;

        const log = state.debug;

        // 1. Draw the "Car" status at its coordinates
        if (log.car.x !== undefined) {
            graphicProcessor.drawLabel(`CAR: ${log.car.name}`, {x: log.car.x, y: log.car.y, z: log.car.z});
        }

        // 2. Iterate through Nudges (the new version of your elementsSummary loop)
        log.nudges.forEach(nudge => {
            if (nudge.x !== undefined) {
                graphicProcessor.drawCrosshair({x: nudge.x, y: nudge.y, z: nudge.z}, 5);
                graphicProcessor.drawText(`Nudge: ${nudge.name}`, {x: nudge.x, y: nudge.y, z: nudge.z});
            }
        });

        // 3. Handle Errors visually
        log.errors.forEach((err, i) => {
            // Draw errors at the top of the screen in 2D space
            graphicProcessor.drawHUDText(`Error: ${err.message}`, 20, 20 + (i * 20));
        });
    }
}