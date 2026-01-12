import {
    type GraphicProcessor,
    type BlueprintElement,
    type SceneState,
    type GraphicsBundle,
    type AssetLoader
} from "./types.ts";
import type { SceneManager } from "./scene_manager.ts";
import { AssetRegistry } from "./asset_registry.ts";
import {resolve} from "./create_renderable.ts"; // The new factory/store

export class World<TBundle extends GraphicsBundle> {
    private registry: AssetRegistry<TBundle>;
    private sceneManager: SceneManager;
    private sceneState: SceneState;

    constructor(sceneManager: SceneManager, loader: AssetLoader<TBundle>) {
        this.sceneManager = sceneManager;
        this.sceneState = this.sceneManager.initialState();
        // The World owns the Registry, passing the Loader down for Phase 1/2
        this.registry = new AssetRegistry<TBundle>(loader);
    }

    public getSceneState(): SceneState {
        return this.sceneState;
    }

    /**
     * PHASE 1 & 2: REGISTRATION & HYDRATION
     * Delegation: We tell the registry to handle the Blueprint.
     * The Registry/createRenderable logic handles the async loading internally.
     */
    public addElement(id: string, blueprint: BlueprintElement): void {
        this.registry.register(id, blueprint);
    }

    public removeElement(id: string): void {
        // Registry handles the deletion of the Renderable instance
        this.registry.remove?.(id);
    }

    /**
     * PHASE 3: THE FRAME LOOP
     * Orchestrates SceneManager calculation and GraphicProcessor execution.
     */
    public step(gp: GraphicProcessor<TBundle>): void {
        // 1. Calculate Scene State (The execution context)
        const state = this.sceneManager.calculateScene(
            gp.millis(),
            gp.deltaTime(),
            gp.frameCount(),
            this.sceneState
        );

        // 2. Global Perspective Setup
        gp.setCamera(state.camera.position, state.camera.lookAt);

        // 3. Painter's Algorithm: Sort Render Queue
        // We resolve position only once during sorting for efficiency.
        const renderQueue = Array.from(this.registry.all())
            .map(element => {
                const resolvedPos = resolve(element.dynamic.position, state);
                return {
                    element,
                    distance: gp.dist(state.camera.position, resolvedPos)
                };
            })
            .sort((a, b) => b.distance - a.distance);

        // 4. Execution of presentation logic
        renderQueue.forEach(({ element }) => {
            element.render(gp, state);
        });

        // 5. Overlay: Debug Data
        if (state.settings.debug) {
            this.renderDebugInfo(gp, state);
        }

        // Cycle the state
        this.sceneState = state;
    }

    private renderDebugInfo(gp: GraphicProcessor<TBundle>, state: SceneState) {
        if (!state.debugStateLog) return;
        const log = state.debugStateLog;

        if (log.car.x !== undefined) {
            gp.drawLabel(`CAR: ${log.car.name}`, { x: log.car.x, y: log.car.y, z: log.car.z });
        }

        log.nudges.forEach(nudge => {
            if (nudge.x !== undefined) {
                gp.drawCrosshair({ x: nudge.x, y: nudge.y, z: nudge.z }, 5);
                gp.text(`Nudge: ${nudge.name}`, { x: nudge.x, y: nudge.y, z: nudge.z });
            }
        });

        log.errors.forEach((err, i) => {
            gp.drawHUDText(`Error: ${err.message}`, 20, 20 + (i * 20));
        });
    }
}