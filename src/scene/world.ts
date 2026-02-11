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
    SceneState, ElementId
} from "./types.ts";
import { ScreenModifier } from "./modifiers/screen_modifier.ts";
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

    public addBox<TID extends string>(
        blueprint: BlueprintBox & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
    }

    public addSphere<TID extends string>(
        blueprint: BlueprintSphere & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
    }

    public addCone<TID extends string>(
        blueprint: BlueprintCone & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
    }

    public addPyramid<TID extends string>(
        blueprint: BlueprintPyramid & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
    }

    public addElliptical<TID extends string>(
        blueprint: BlueprintElliptical & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
    }

    public addCylinder<TID extends string>(
        blueprint: BlueprintCylinder & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
    }

    public addTorus<TID extends string>(
        blueprint: BlueprintTorus & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
    }

    public addText<TID extends string>(
        blueprint: BlueprintText & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
    }

    public addFloor<TID extends string>(
        blueprint: BlueprintFloor & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
    }

    public addPanel<TID extends string>(
        blueprint: BlueprintPanel & { id: ElementId<TID> }
    ): void {
        this.stage.add(blueprint.id, blueprint);
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
        // Set camera position based on projection type
        if (draftNewState.projection?.kind === "camera") {
            gp.setCamera(draftNewState.projection.camera.position, draftNewState.projection.camera.lookAt);
        } else if (draftNewState.projection?.kind === "screen") {
            // For screen projection, position camera at eye position, look at screen center
            gp.setCamera(draftNewState.projection.eye, { x: 0, y: 0, z: 0 });
        }
        
        // Apply off-axis projection if available
        if (draftNewState.projectionMatrix && gp.setProjectionMatrix) {
            gp.setProjectionMatrix(draftNewState.projectionMatrix);
        } else if (draftNewState.projection.kind === "screen") {
            // For screen projection, generate off-axis projection matrix from eye position
            const screenModifier = new ScreenModifier(draftNewState.projection.screen);
            const projectionMatrix = screenModifier.buildFrustum(draftNewState.projection.eye);
            if (gp.setProjectionMatrix) {
                gp.setProjectionMatrix(projectionMatrix);
            }
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