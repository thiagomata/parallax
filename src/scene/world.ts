import type {SceneManager} from "./scene_manager.ts";
import type {
    AssetLoader,
    BlueprintBox,
    BlueprintFloor,
    BlueprintPanel,
    BlueprintSphere,
    BlueprintText,
    GraphicProcessor,
    GraphicsBundle,
    RenderableElement,
    SceneState
} from "./types.ts";
import {Stage} from "./stage.ts";

export class World<TBundle extends GraphicsBundle> {
    public readonly stage: Stage<TBundle>;
    private sceneManager: SceneManager;
    private sceneState: SceneState;

    constructor(sceneManager: SceneManager, loader: AssetLoader<TBundle>, stage?: Stage<TBundle>) {
        this.sceneManager = sceneManager;
        this.sceneState = sceneManager.initialState();
        this.stage = stage ?? new Stage<TBundle>(loader);
    }

    public getCurrentSceneState(): SceneState {
        return this.sceneState;
    }

    public addBox(id: string, blueprint: BlueprintBox): void {
        this.stage.add(id, blueprint);
    }

    public addSphere(id: string, blueprint: BlueprintSphere): void {
        this.stage.add(id, blueprint);
    }

    public addText(id: string, blueprint: BlueprintText): void {
        this.stage.add(id, blueprint);
    }

    public addFloor(id: string, blueprint: BlueprintFloor): void {
        this.stage.add(id, blueprint);
    }

    public addPanel(id: string, blueprint: BlueprintPanel): void {
        this.stage.add(id, blueprint);
    }

    public getElement(id: string): RenderableElement<any, TBundle> | undefined {
        return this.stage.getElement(id);
    }

    public removeElement(id: string): void {
        this.stage.remove(id);
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
            gp.drawLabel(`CAR: ${log.car.name}`, {x: log.car.x, y: log.car.y, z: log.car.z});
        }

        log.nudges.forEach(nudge => {
            if (nudge.x !== undefined) {
                gp.drawCrosshair({x: nudge.x, y: nudge.y, z: nudge.z}, 5);
                gp.text(`Nudge: ${nudge.name}`, {x: nudge.x, y: nudge.y, z: nudge.z});
            }
        });

        log.errors.forEach((err, i) => {
            gp.drawHUDText(`Error: ${err.message}`, 20, 20 + (i * 20));
        });
    }
}