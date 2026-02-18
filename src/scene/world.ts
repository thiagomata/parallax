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
    SceneState, ElementId, ProjectionEffectLib
} from "./types.ts";
import {Stage} from "./stage.ts";

export class World<
    TBundle extends GraphicsBundle,
    TElementEffectLib extends EffectLib,
    TProjectionEffectLib extends ProjectionEffectLib,
> {
    public readonly stage: Stage<TBundle, TElementEffectLib, TProjectionEffectLib>;
    private sceneManager: SceneManager;
    private sceneState: SceneState;

    constructor(sceneManager: SceneManager, loader: AssetLoader<TBundle>, stage?: Stage<TBundle, TElementEffectLib, TProjectionEffectLib>) {
        this.sceneManager = sceneManager;
        this.sceneState = sceneManager.initialState();
        this.stage = stage ?? new Stage<TBundle, TElementEffectLib, TProjectionEffectLib>(loader);
    }

    public getCurrentSceneState(): SceneState {
        return this.sceneState;
    }

    public isPaused(): boolean {
        return this.sceneManager.isPaused();
    }

    public addBox<TID extends string>(
        blueprint: BlueprintBox & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public addSphere<TID extends string>(
        blueprint: BlueprintSphere & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public addCone<TID extends string>(
        blueprint: BlueprintCone & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public addPyramid<TID extends string>(
        blueprint: BlueprintPyramid & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public addElliptical<TID extends string>(
        blueprint: BlueprintElliptical & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public addCylinder<TID extends string>(
        blueprint: BlueprintCylinder & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public addTorus<TID extends string>(
        blueprint: BlueprintTorus & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public addText<TID extends string>(
        blueprint: BlueprintText & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public addFloor<TID extends string>(
        blueprint: BlueprintFloor & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public addPanel<TID extends string>(
        blueprint: BlueprintPanel & { id: ElementId<TID> }
    ): void {
        this.stage.addElement(blueprint);
    }

    public getElement(id: string): BundleDynamicElement<any, TBundle> | undefined {
        return this.stage.getElement(id);
    }

    public removeElement(id: string): void {
        this.stage.removeElement(id);
    }

    public step(gp: GraphicProcessor<TBundle>): void {
        const draftNewState = this.sceneManager.calculateScene(
            gp.millis(),
            gp.deltaTime(),
            gp.frameCount(),
            this.sceneState
        );

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