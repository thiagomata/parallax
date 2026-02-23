import {
    type AssetLoader,
    type EffectLib,
    type GraphicProcessor,
    type GraphicsBundle,
    type MapToBlueprint,
    type BundleDynamicElement,
    type ResolvedElement,
    type BundleResolvedElement,
    type ProjectionEffectLib,
    type BlueprintProjection,
    type ResolvedProjection,
    type DynamicProjection,
    type DynamicSceneState,
    type ResolvedSceneState,
    type ResolutionContext,
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

    private lastFrameState: ResolvedSceneState | null = null;

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
     * Returns DynamicSceneState with DynamicProjection from registries.
     */
    public initialState(): DynamicSceneState {

        const defaultProjections = new Map<string, DynamicProjection>();
        defaultProjections.set("screen", this.projectionRegistry.get('screen')!);
        defaultProjections.set("eye", this.projectionRegistry.get('eye')!);

        return {
            sceneId: 0,
            settings: this.settings,
            playback: {
                now: 0,
                delta: 0,
                frameCount: 0,
                progress: 0,
            } as ScenePlaybackState,
            elements: new Map(),
            projections: defaultProjections,
            previousResolved: null,
        };
    }

    public addElement<T extends ResolvedElement>(blueprint: MapToBlueprint<T>): void {
        if (this.elementRegistry.get(blueprint.id) !== undefined) {
            throw new Error(`ID collision: Cannot add element '${blueprint.id}' - a projection with the same ID already exists.`);
        }
        this.elementRegistry.register<T>(blueprint);
    }

    public removeElement(id: string): void {
        this.elementRegistry.remove(id);
    }

    public getElement(id: string): BundleDynamicElement<any, TGraphicBundle> | undefined {
        return this.elementRegistry.get(id);
    }

    public addProjection(blueprint: BlueprintProjection): void {
        if (this.elementRegistry.get(blueprint.id) !== undefined) {
            throw new Error(`ID collision: Cannot add projection '${blueprint.id}' - an element with the same ID already exists.`);
        }

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

    public render(
        graphicProcessor: GraphicProcessor<TGraphicBundle>, 
        state: DynamicSceneState
    ): ResolvedSceneState {

        // ==========================================================
        // STEP 1: Resolve ALL Projections
        // ==========================================================
        const projectionPool: Record<string, ResolvedProjection> = {};
        
        for (const dynamicProjection of this.projectionRegistry.all()) {
            const resolved = this.projectionResolver.resolve(dynamicProjection, state, projectionPool);
            projectionPool[resolved.id] = resolved;
        }

        // ==========================================================
        // STEP 2: Apply Projection Modifiers
        // (Already applied inside resolve() via ResolutionContext)
        // ==========================================================

        // ==========================================================
        // STEP 3: Resolve Elements (can see resolved projections)
        // ==========================================================
        const screenProjection = this.getScreenProjection(projectionPool);
        
        // Create context for element resolution - has access to projectionPool
        const elementResolutionContext: ResolutionContext = {
            previousResolved: state.previousResolved,
            playback: state.playback,
            settings: state.settings,
            projectionPool,
            elementPool: {},
        };

        const renderQueue = Array.from(this.elementRegistry.all())
            .map(element => ({
                element,
                distance: graphicProcessor.dist(
                    screenProjection.position,
                    this.elementResolver.resolveProperty(element.dynamic.position, elementResolutionContext)
                )
            }))
            .sort((a, b) => b.distance - a.distance)
            .map(pair => pair.element);

        const resolvedElements = renderQueue.map(bundle => ({
            id: bundle.id,
            bundle: this.elementResolver.resolve(bundle, elementResolutionContext) as BundleResolvedElement<ResolvedElement, TGraphicBundle>,
        }));

        // ==========================================================
        // STEP 4: Apply Element Modifiers
        // (Need to implement - for now, elements are resolved without modifiers)
        // ==========================================================

        // Create intermediate state with resolved elements + projections
        const resolvedMapElements = new Map(
            resolvedElements.map(pair => [pair.id, pair.bundle.resolved])
        );

        // Create context for effects - has both pools
        const effectContext: ResolutionContext = {
            previousResolved: state.previousResolved,
            playback: state.playback,
            settings: state.settings,
            projectionPool,
            elementPool: Object.fromEntries(resolvedMapElements),
        };

        // ==========================================================
        // STEP 5: Apply Effects to Elements
        // ==========================================================
        const finalElements = resolvedElements.map(pair => ({
            id: pair.id,
            bundle: this.elementResolver.effect(pair.bundle, effectContext),
        }));

        // ==========================================================
        // STEP 6: Apply Effects to Projections
        // ==========================================================
        const finalMapElements = new Map(finalElements.map(p => [p.id, p.bundle.resolved]));
        
        const finalState: ResolvedSceneState = {
            sceneId: state.sceneId,
            settings: state.settings,
            playback: state.playback,
            elements: finalMapElements,
            projections: new Map(Object.entries(projectionPool)),
        };

        // Render elements
        finalElements.map(pair => {
            this.elementResolver.render(pair.bundle, graphicProcessor, finalState);
        });

        this.lastFrameState = finalState;

        return finalState;
    }

    private getScreenProjection(
        resolutionPool: Record<string, ResolvedProjection>
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

    getCurrentState(): ResolvedSceneState | null {
        return this.lastFrameState;
    }

    getInitialState(): DynamicSceneState {
        return this.initialState();
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