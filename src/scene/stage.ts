import {
    type AssetLoader,
    type EffectLib,
    type GraphicProcessor,
    type GraphicsBundle,
    type MapToBlueprint,
    type BundleDynamicElement,
    type ResolvedElement,
    type SceneState,
    type BundleResolvedElement,
    type ProjectionEffectLib,
    type BlueprintProjection,
    type ResolvedProjection,
    type DynamicProjection,
    PROJECTION_TYPES,
    projectionIsType, type ScenePlaybackState, type SceneSettings
} from "./types.ts";
import {ElementResolver} from "./resolver/element_resolver.ts";
import {ProjectionResolver} from "./projection/projection_resolver.ts";
import {ProjectionAssetRegistry} from "./registry/projection_asset_registry.ts";
import {ElementAssetRegistry} from "./registry/element_asset_registry.ts";

export class Stage<
    TGraphicBundle extends GraphicsBundle,
    TElementEffectLib extends EffectLib,
    TProjectionEffectLib extends ProjectionEffectLib,
> {
    private readonly elementRegistry: ElementAssetRegistry<TGraphicBundle, {}>;
    private readonly projectionRegistry: ProjectionAssetRegistry<TProjectionEffectLib>;
    private readonly elementResolver: ElementResolver<TGraphicBundle, TElementEffectLib>;
    private readonly projectionResolver: ProjectionResolver<TProjectionEffectLib>;
    private readonly settings: SceneSettings;

    private lastFrameState: SceneState | null = null;

    constructor(
        settings: SceneSettings,
        loader: AssetLoader<TGraphicBundle>,
        elementEffectLib: TElementEffectLib = {} as TElementEffectLib,
        projectionEffectLib: TProjectionEffectLib = {} as TProjectionEffectLib,
    ) {
        this.settings = settings;

        this.elementResolver = new ElementResolver<TGraphicBundle, TElementEffectLib>(elementEffectLib);
        this.projectionResolver = new ProjectionResolver<TProjectionEffectLib>(projectionEffectLib);

        this.elementRegistry = new ElementAssetRegistry<TGraphicBundle, TElementEffectLib>(loader, this.elementResolver);
        this.projectionRegistry = new ProjectionAssetRegistry<TProjectionEffectLib>(this.projectionResolver);
        this.projectionRegistry.register({
            id: 'screen',
            type: PROJECTION_TYPES.SCREEN,
            position: {x: 0, y: 0, z: 0},
            rotation: {pitch: 0, yaw: 0, roll: 0},
            lookAt: {x: 0, y: 0, z: -1},
            direction: {x: 0, y: 0, z: -1},
            effects: [],
        });
        this.projectionRegistry.register({
            id: 'eye',
            // targetId: 'screen',
            type: PROJECTION_TYPES.EYE,
            position: {x: 0, y: 0, z: 100},
            rotation: {pitch: 0, yaw: 0, roll: 0},
            lookAt: {x: 0, y: 0, z: 0},
            direction: {x: 0, y: 0, z: -1},
            effects: [],
        });
    }

    /**
     * Bootstraps the engine with the base environment.
     * Note: Environmental blueprints (Screen/Eye) are now seeds for the Stage to hydrate.
     */
    public initialState(): SceneState {

        const defaultProjections = new Map();
        defaultProjections.set("screen", this.projectionRegistry.get('screen'));
        defaultProjections.set("eye", this.projectionRegistry.get('eye'));

        return {
            sceneId: 0,
            settings: this.settings,
            playback: {
                now: 0,
                delta: 0,
                frameCount: 0,
                progress: 0,
            } as ScenePlaybackState,
            // Maps start empty; Stage handles the registration of defaults or users.
            elements: new Map(),
            projections: defaultProjections,
        } as SceneState;
    }

    public addElement<T extends ResolvedElement>(blueprint: MapToBlueprint<T>): void {
        this.elementRegistry.register<T>(blueprint);
    }

    public removeElement(id: string): void {
        this.elementRegistry.remove(id);
    }

    public getElement(id: string): BundleDynamicElement<any, TGraphicBundle> | undefined {
        return this.elementRegistry.get(id);
    }

    public addProjection(blueprint: BlueprintProjection): void {
        const targetId = blueprint.targetId;

        if (targetId) {
            // 1. Existence: The target must already exist in the projection registry
            const target = this.projectionRegistry.get(targetId);
            if (!target) {
                throw new Error(`Target ${targetId} not found for projection ${blueprint.id}`);
            }

            // 2. Recursion Check: Trace back to ensure no loops
            let current: DynamicProjection | undefined = target;
            while (current) {
                if (current.id === blueprint.id) {
                    throw new Error(`Circular dependency: ${blueprint.id} targets its own descendant.`);
                }
                // Use the dynamic property to find the next targetId in the chain
                const nextTargetId: string | null = current.targetId ?? null;
                current = nextTargetId ? this.projectionRegistry.get(nextTargetId) : undefined;
            }
        }

        this.projectionRegistry.register(blueprint);
    }

    public replaceProjection(blueprint: BlueprintProjection): void {
        if (this.projectionRegistry.get(blueprint.id) !== undefined) {
            this.projectionRegistry.delete(blueprint.id);
        }
        this.addProjection(blueprint);
    }

    public render(graphicProcessor: GraphicProcessor<TGraphicBundle>, state: SceneState): SceneState {

        // 1.resolve all the projection elements
        const resolutionPool: Record<string, ResolvedProjection> = {};

        for (const dynamicProjection of this.projectionRegistry.all()) {
            // Resolve (incorporates hierarchy logic we just wrote)
            const resolved = this.projectionResolver.resolve(dynamicProjection, state, resolutionPool);

            // Apply Effects
            const final = this.projectionResolver.apply(resolved, state, resolutionPool);

            // Store in pool for subsequent projections and elements
            resolutionPool[final.id] = final;
        }

        // 2 - select from the projection elements the current screen and eyes
        let screenProjection = this.getScreenProjection(resolutionPool, state);
        // let eyeProjection = this.getEyeProjection(resolutionPool, state);

        //  3 - define the render queue based in the scene screen
        // Optimized Painter's Algorithm: Sort far-to-near
        const renderQueue = Array.from(this.elementRegistry.all())
            .map(element => ({
                element,
                distance: graphicProcessor.dist(
                    screenProjection.position,
                    this.elementResolver.resolveProperty(element.dynamic.position, state)
                )
            }))
            .sort((a, b) => b.distance - a.distance)
            .map(
                pair => pair.element
            );

        // 4 - resolve elements

        let resolvedElements = renderQueue.map(
            bundle => {
                return {
                    id: bundle.id,
                    bundle: this.elementResolver.resolve(bundle, state) as BundleResolvedElement<ResolvedElement, TGraphicBundle>,
                }
            }
        );

        // 5 - create the elements map

        const resolvedMapElements = new Map(
            resolvedElements.map(
                pair => [pair.id, pair.bundle.resolved]
            )
        );

        const stateBeforeEffect = {
            ...state,
            elements: resolvedMapElements
        } as SceneState;

        // 6 - apply the effect in the elements

        const finalElements = resolvedElements.map(
            pair => {
                return {
                    id: pair.id,
                    bundle: this.elementResolver.effect(pair.bundle, stateBeforeEffect),
                }
            }
        )

        // 7 - apply the effects in the projection elements

        const finalState: SceneState = {
            ...stateBeforeEffect,
            elements: new Map(finalElements.map(p => [p.id, p.bundle.resolved])),
        };

        finalElements.map(
            pair => {
                this.elementResolver.render(pair.bundle,graphicProcessor, finalState)
            }
        )

        this.lastFrameState = finalState;

        return finalState;
    }

    private getScreenProjection(
        resolutionPool: Record<string, ResolvedProjection>,
        _state: SceneState
    ): ResolvedProjection & {type: typeof PROJECTION_TYPES.SCREEN } {
        const resolvedProjectionsMap = new Map(Object.entries(resolutionPool));
        if (!resolvedProjectionsMap.has('screen')) {
            throw new Error(`Resolution 'screen' not found.`);
        }
        const screenProjection = resolvedProjectionsMap.get('screen');
        if (!screenProjection) {
            throw new Error(`Projection 'screen' for screen not found`);
        }
        if(!projectionIsType(screenProjection, PROJECTION_TYPES.SCREEN)) {
            throw new Error(`ScreenProjection 'screen' is not type screen`);
        }
        return screenProjection;
    }

    getCurrentState() {
        return this.lastFrameState ?? this.initialState()
    }

    setEye(blueprint: BlueprintProjection & { type: typeof PROJECTION_TYPES.EYE, id: 'eye' }) {
        this.replaceProjection(
            blueprint
        );
    }

    setScreen(blueprint: BlueprintProjection & { type: typeof PROJECTION_TYPES.SCREEN, id: 'screen' }) {
        this.replaceProjection(
            blueprint
        );
    }
}