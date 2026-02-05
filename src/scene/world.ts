import type {SceneManager} from "./scene_manager.ts";
import type {
    AssetLoader,
    BlueprintBox,
    BlueprintCone,
    BlueprintCylinder,
    BlueprintElliptical,
    BlueprintFloor,
    BlueprintPanel,
    BlueprintPyramid,
    BlueprintSphere,
    BlueprintText,
    BlueprintTorus, EffectLib,
    GraphicProcessor,
    GraphicsBundle,
    BundleDynamicElement,
    SceneState
} from "./types.ts";
import {Stage} from "./stage.ts";

export class World<TBundle extends GraphicsBundle, TEffectLib extends EffectLib> {
    public readonly stage: Stage<TBundle, TEffectLib>;
    private sceneManager: SceneManager;
    private sceneState: SceneState;

    constructor(sceneManager: SceneManager, loader: AssetLoader<TBundle>, stage?: Stage<TBundle, TEffectLib>) {
        this.sceneManager = sceneManager;
        this.sceneState = sceneManager.initialState();
        this.stage = stage ?? new Stage<TBundle, TEffectLib>(loader);
    }

    public getCurrentSceneState(): SceneState {
        return this.sceneState;
    }

    public isPaused(): boolean {
        return this.sceneManager.isPaused();
    }

    public addBox(id: string, blueprint: BlueprintBox): void {
        this.stage.add(id, blueprint);
    }

    public addSphere(id: string, blueprint: BlueprintSphere): void {
        this.stage.add(id, blueprint);
    }

    public addCone(id: string, blueprint: BlueprintCone): void {
        this.stage.add(id, blueprint);
    }

    public addPyramid(id: string, blueprint: BlueprintPyramid): void {
        this.stage.add(id, blueprint);
    }

    public addElliptical(id: string, blueprint: BlueprintElliptical): void {
        this.stage.add(id, blueprint);
    }

    public addCylinder(id: string, blueprint: BlueprintCylinder): void {
        this.stage.add(id, blueprint);
    }

    public addTorus(id: string, blueprint: BlueprintTorus): void {
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

    public getElement(id: string): BundleDynamicElement<any, TBundle> | undefined {
        return this.stage.getElement(id);
    }

    public removeElement(id: string): void {
        this.stage.remove(id);
    }

    public step(gp: GraphicProcessor<TBundle>): void {
        const draftNewState = this.sceneManager.calculateScene(
            gp.millis(),
            gp.deltaTime(),
            gp.frameCount(),
            this.sceneState
        );
        gp.setCamera(draftNewState.camera.position, draftNewState.camera.lookAt);
        
        // Apply off-axis projection if available
        if (draftNewState.projectionMatrix && gp.setProjectionMatrix) {
            gp.setProjectionMatrix(draftNewState.projectionMatrix);
        }
        
        this.sceneState = this.stage.render(gp, draftNewState);
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