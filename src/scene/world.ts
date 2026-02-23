import type {SceneClock} from "./scene_clock.ts";
import {
    type AssetLoader,
    type BlueprintBox,
    type BlueprintCone,
    type BlueprintCylinder,
    type BlueprintElliptical,
    type BlueprintFloor,
    type BlueprintPanel,
    type BlueprintPyramid,
    type BlueprintSphere,
    type BlueprintText,
    type BlueprintTorus,
    type EffectLib,
    type GraphicProcessor,
    type GraphicsBundle,
    type BundleDynamicElement,
    type ElementId,
    type ProjectionEffectLib,
    type SceneSettings,
    type ResolvedSceneState,
    DEFAULT_SETTINGS, type BlueprintProjection, PROJECTION_TYPES,
} from "./types.ts";
import {Stage} from "./stage.ts";
import {merge} from "./utils/merge.ts";

export class World<
    TBundle extends GraphicsBundle,
    TElementEffectLib extends EffectLib,
    TProjectionEffectLib extends ProjectionEffectLib,
> {
    public readonly stage: Stage<TBundle, TElementEffectLib, TProjectionEffectLib>;
    private sceneClock: SceneClock;
    private readonly settings: SceneSettings;

    constructor(
        clock: SceneClock,
        loader: AssetLoader<TBundle>,
        settings: Partial<SceneSettings> = {},
        stage?: Stage<TBundle, TElementEffectLib, TProjectionEffectLib>,
    ) {
        this.settings = merge(DEFAULT_SETTINGS, settings);
        this.sceneClock = clock;
        this.stage = stage ?? new Stage<TBundle, TElementEffectLib, TProjectionEffectLib>(
            this.settings,
            loader
        );
    }

    public getCurrenState(): ResolvedSceneState | null {
        return this.stage.getCurrentState()
    }

    public isPaused(): boolean {
        return this.sceneClock.isPaused();
    }

    /**
     * Replaces or sets the Eye projection (The User's position).
     */
    public setEye(blueprint: BlueprintProjection & {type: typeof PROJECTION_TYPES.EYE, id: 'eye'}): void {
        this.stage.setEye(blueprint);
    }

    /**
     * Replaces or sets the Screen projection (The Window's spatial pose).
     */
    public setScreen(blueprint: BlueprintProjection & {type: typeof PROJECTION_TYPES.SCREEN, id: 'screen'}): void {
        this.stage.setScreen(blueprint);
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
        const previousResolved = this.stage.getCurrentState();
        
        const clockState = this.sceneClock.calculateScene(
            gp.millis(), gp.deltaTime(), gp.frameCount(), previousResolved
        );

        const finalState = this.stage.render(gp, clockState);
        const eye = finalState.projections?.get('eye');
        const screen = finalState.projections?.get('screen');

        if (eye && screen) {
            debugger;
            // Now passing the whole projection object
            gp.setCamera(eye);

            // Off-axis math using the ScreenConfig and Eye/Screen relationship
            // const matrix = calculateOffAxisMatrix(eye, screen, finalState.settings.window);
            // gp.setProjectionMatrix(matrix);
        } else {
            throw new Error("no screen or eye to render");
        }
    }
}