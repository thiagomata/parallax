import {SceneClock} from "./scene_clock.ts";
import {
    type BlueprintBox,
    type BlueprintCone,
    type BlueprintCylinder,
    type BlueprintElliptical,
    type BlueprintFloor, blueprintIsType, blueprintLookModeIs,
    type BlueprintPanel,
    type BlueprintProjection, type BlueprintProjectionLookAt, type BlueprintProjectionRotation,
    type BlueprintPyramid,
    type BlueprintSphere,
    type BlueprintText,
    type BlueprintTorus,
    type BundleDynamicElement, DEFAULT_EYE_LOOK_AT, DEFAULT_EYE_ROTATION,
    DEFAULT_SCREEN_LOOK_AT, DEFAULT_SCREEN_ROTATION,
    type EffectLib,
    type ElementId,
    type GraphicProcessor,
    type GraphicsBundle, LOOK_MODES, type LookMode,
    PROJECTION_TYPES,
    type ProjectionEffectLib,
    type ProjectionMatrix,
    type ResolvedProjection,
    type ResolvedSceneState,
    WindowConfig,
} from "./types.ts";
import {Stage} from "./stage.ts";
import type {WorldSettings} from "./world_settings.ts";
import {createPerspectiveMatrix} from "./modifiers/projection_matrix_utils.ts";

type ProjectionMatrixCalculator = (
    eye: ResolvedProjection,
    screen: ResolvedProjection,
    window: WindowConfig
) => ProjectionMatrix;

export class World<
    TBundle extends GraphicsBundle,
    TElementEffectLib extends EffectLib,
    TProjectionEffectLib extends ProjectionEffectLib,
> {
    public readonly stage: Stage<TBundle, TElementEffectLib, TProjectionEffectLib>;
    private sceneClock: SceneClock;
    private projectionMatrixCalculator: ProjectionMatrixCalculator | null = null;

    constructor(
        worldSettings: WorldSettings<TBundle, TElementEffectLib, TProjectionEffectLib>
    ) {
        this.sceneClock = worldSettings.clock
        this.stage = worldSettings.stage;
    }

    public getCurrenState(): ResolvedSceneState | null {
        return this.stage.getCurrentState()
    }

    public isPaused(): boolean {
        return this.sceneClock.isPaused();
    }

    public setEye<T extends Partial<BlueprintProjection>>(
        blueprintEye: T & {
            id: 'eye',
            type: typeof PROJECTION_TYPES.EYE,
            lookMode: LookMode,
        }
    ): void {
        if (blueprintLookModeIs(blueprintEye, LOOK_MODES.ROTATION)) {
            const rotateEye: BlueprintProjectionRotation = {
                ...DEFAULT_EYE_ROTATION,
                ...blueprintEye,
                id: 'eye',
                type: PROJECTION_TYPES.EYE,
                lookMode: LOOK_MODES.ROTATION,
            };
            if (!blueprintIsType(rotateEye, PROJECTION_TYPES.EYE)) {
                // impossible, only to make TS happy
                throw new Error("invalid type");
            }
            return this.stage.setEye(rotateEye);
        }
        if (blueprintLookModeIs(blueprintEye, LOOK_MODES.LOOK_AT)) {
            const lookAtEye: BlueprintProjectionLookAt = {
                ...DEFAULT_EYE_LOOK_AT,
                ...blueprintEye,
                id: 'eye',
                type: PROJECTION_TYPES.EYE,
                lookMode: LOOK_MODES.LOOK_AT,
            };
            if (!blueprintIsType(lookAtEye, PROJECTION_TYPES.EYE)) {
                // impossible, only to make TS happy
                throw new Error("invalid type");
            }
            return this.stage.setEye(lookAtEye);
        }
        throw new Error("invalid mode");
    }

    public setScreen<T extends Partial<BlueprintProjection>>(
        blueprintScreen: T & {
            id: 'screen',
            type: typeof PROJECTION_TYPES.SCREEN,
            lookMode: LookMode,
        }
    ): void {
        if (blueprintLookModeIs(blueprintScreen, LOOK_MODES.ROTATION)) {
            const rotateScreen: BlueprintProjectionRotation = {
                ...DEFAULT_SCREEN_ROTATION,
                ...blueprintScreen,
                id: 'screen',
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.ROTATION,
            };
            if (!blueprintIsType(rotateScreen, PROJECTION_TYPES.SCREEN)) {
                // impossible, only to make TS happy
                throw new Error("invalid type");
            }
            return this.stage.setScreen(rotateScreen);
        }
        if (blueprintLookModeIs(blueprintScreen, LOOK_MODES.LOOK_AT)) {
            const lookAtScreen: BlueprintProjectionLookAt = {
                ...DEFAULT_SCREEN_LOOK_AT,
                ...blueprintScreen,
                id: 'screen',
                type: PROJECTION_TYPES.SCREEN,
                lookMode: LOOK_MODES.LOOK_AT,
            };
            if (!blueprintIsType(lookAtScreen, PROJECTION_TYPES.SCREEN)) {
                // impossible, only to make TS happy
                throw new Error("invalid type");
            }
            return this.stage.setScreen(lookAtScreen);
        }
        throw new Error("invalid mode");
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

    /**
     * Get the current WindowConfig (for creating projections, etc.)
     */
    public getWindowConfig(): WindowConfig {
        return this.stage.getSettings().window;
    }

    /**
     * Set a custom projection matrix calculator.
     * When set, this function will be called each frame to compute the projection matrix.
     * @param calculator - Function that takes (eye, screen, window) and returns a ProjectionMatrix
     */
    public setProjectionMatrixCalculator(calculator: ProjectionMatrixCalculator | null): void {
        this.projectionMatrixCalculator = calculator;
    }

    /**
     * Enable default perspective projection using p5-style perspective matrix.
     * Uses createPerspectiveMatrix which matches p5's default perspective() behavior.
     * This is simpler than off-axis and produces standard perspective projection.
     * @param width - Canvas width (optional, uses WindowConfig from settings if not provided)
     * @param height - Canvas height (optional, uses WindowConfig from settings if not provided)
     * @param fov - Field of view in radians (default: PI/3 = 60 degrees)
     */
    public enableDefaultPerspective(width?: number, height?: number, fov: number = Math.PI / 3): void {
        if (width !== undefined && height !== undefined) {
            this.stage.updateWindowConfig(WindowConfig.create({ width, height }));
        }
        
        // Use createPerspectiveMatrix which matches p5's default perspective()
        // FOV defaults to 60 degrees (PI/3), matching p5's default
        // Near = 0.1, Far = 5000, matching p5's WEBGL defaults
        this.projectionMatrixCalculator = (_eye, _screen, window) => {
            const aspect = window.width / window.height;
            return createPerspectiveMatrix(
                fov,
                aspect,
                0.1,     // near
                5000      // far
            );
        };
    }

    public step(gp: GraphicProcessor<TBundle>): void {
        // Tick the clock forward
        this.sceneClock.tick(gp.millis(), gp.deltaTime(), gp.frameCount());

        // Render with just frame params (clock playback + previous resolved state)
        const previousResolved = this.stage.getCurrentState();
        const finalState = this.stage.render(gp, {
            playback: this.sceneClock.getPlayback(),
            previousResolved,
            sceneId: this.sceneClock.sceneId,
        });

        const eye = finalState.projections?.get('eye');
        const screen = finalState.projections?.get('screen');

        if (eye && screen) {
            gp.setCamera(eye);

            // Apply custom projection matrix if calculator is set
            if (this.projectionMatrixCalculator) {
                const windowConfig = this.getWindowConfig();
                const projectionMatrix = this.projectionMatrixCalculator(eye, screen, windowConfig);
                gp.setProjectionMatrix(projectionMatrix);
            }
        } else {
            throw new Error("no screen or eye to render");
        }
    }
}