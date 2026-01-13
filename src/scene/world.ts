import type {SceneManager} from "./scene_manager.ts";
import type {
    AssetLoader,
    BlueprintBox,
    BlueprintFloor,
    BlueprintText,
    GraphicProcessor,
    GraphicsBundle,
    SceneState
} from "./types.ts";
import {Stage} from "./stage.ts";

export class World<TBundle extends GraphicsBundle> {
    private stage: Stage<TBundle>;
    private sceneManager: SceneManager;
    private sceneState: SceneState;

    constructor(sceneManager: SceneManager, loader: AssetLoader<TBundle>, stage?: Stage<TBundle>) {
        this.sceneManager = sceneManager;
        this.sceneState = sceneManager.initialState();
        this.stage = stage ?? new Stage<TBundle>(loader);
    }

    /**
     * Registers a box using the specific Box Blueprint interface.
     */
    public addBox(id: string, blueprint: BlueprintBox): void {
        this.stage.add(id, blueprint);
    }

    /**
     * Registers text using the specific Text Blueprint interface.
     */
    public addText(id: string, blueprint: BlueprintText): void {
        this.stage.add(id, blueprint);
    }

    /**
     * Registers a floor using the specific Floor Blueprint interface.
     */
    public addFloor(id: string, blueprint: BlueprintFloor): void {
        this.stage.add(id, blueprint);
    }

    public step(gp: GraphicProcessor<TBundle>): void {
        // 1. Advance Physics/Logic (Temporal)
        this.sceneState = this.sceneManager.calculateScene(
            gp.millis(),
            gp.deltaTime(),
            gp.frameCount(),
            this.sceneState
        );

        // 2. Global View Setup
        gp.setCamera(this.sceneState.camera.position, this.sceneState.camera.lookAt);

        // 3. Delegate Rendering to the Stage (Spatial)
        this.stage.render(gp, this.sceneState);

        // 4. Overlay Debug
        if (this.sceneState.settings.debug) {
            this.renderDebug(gp, this.sceneState);
        }
    }

    private renderDebug(gp: GraphicProcessor<TBundle>, state: SceneState) {
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