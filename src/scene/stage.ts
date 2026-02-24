import {
    type AssetLoader,
    type BlueprintProjection,
    type BundleDynamicElement,
    type BundleResolvedElement, DEFAULT_EYE_LOOK_AT, DEFAULT_SCREEN_ROTATION,
    type DynamicProjection,
    type DynamicSceneState,
    type EffectLib,
    type GraphicProcessor,
    type GraphicsBundle,
    type MapToBlueprint,
    PROJECTION_TYPES,
    type ProjectionEffectLib,
    projectionIsType,
    type ResolutionContext,
    type ResolvedElement,
    type ResolvedProjection,
    type ResolvedSceneState,
    type ScenePlaybackState,
    type SceneSettings,
    WindowConfig
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
    private cachedDynamicState: DynamicSceneState | null = null;

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
        this.projectionRegistry.register(DEFAULT_SCREEN_ROTATION);
        this.projectionRegistry.register(DEFAULT_EYE_LOOK_AT);
    }

    public getSettings(): SceneSettings {
        return this.settings;
    }

    public updateWindowConfig(config: WindowConfig): void {
        this.settings.window = config;
    }

    /**
     * Lazy builder - builds DynamicSceneState once and caches it.
     * Invalidated when elements/projections are added/removed.
     */
    private getOrBuildDynamicState(): DynamicSceneState {
        if (this.cachedDynamicState) {
            return this.cachedDynamicState;
        }

        const dynamicProjections = new Map<string, DynamicProjection>();
        for (const projection of this.projectionRegistry.all()) {
            dynamicProjections.set(projection.id, projection);
        }

        const dynamicElements = new Map<string, any>();
        for (const element of this.elementRegistry.all()) {
            dynamicElements.set(element.id, element);
        }

        this.cachedDynamicState = {
            sceneId: 0,
            settings: this.settings,
            playback: { now: 0, delta: 0, frameCount: 0, progress: 0 },
            elements: dynamicElements,
            projections: dynamicProjections,
            previousResolved: null,
        } as DynamicSceneState;

        return this.cachedDynamicState;
    }

    public addElement<T extends ResolvedElement>(blueprint: MapToBlueprint<T>): void {
        if (this.elementRegistry.get(blueprint.id) !== undefined) {
            return; // Idempotent: ignore duplicate element add
        }
        if (this.projectionRegistry.get(blueprint.id) !== undefined) {
            throw new Error(`ID collision: Cannot add element '${blueprint.id}' - a projection with the same ID already exists.`);
        }
        this.elementRegistry.register<T>(blueprint);
        this.cachedDynamicState = null; // invalidate cache
    }

    public removeElement(id: string): void {
        this.elementRegistry.remove(id);
        this.cachedDynamicState = null; // invalidate cache
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
        this.cachedDynamicState = null; // invalidate cache
    }

    public replaceProjection(blueprint: BlueprintProjection): void {
        if (this.projectionRegistry.get(blueprint.id) !== undefined) {
            this.projectionRegistry.delete(blueprint.id);
        }
        this.addProjection(blueprint);
    }

    /**
     * Render a frame.
     * @param graphicProcessor - The graphics processor
     * @param frameParams - Frame-specific params (playback from clock, previousResolved from last frame)
     */
    public render(
        graphicProcessor: GraphicProcessor<TGraphicBundle>, 
        frameParams: { 
            playback: ScenePlaybackState; 
            previousResolved: ResolvedSceneState | null;
            sceneId?: number;
        }
    ): ResolvedSceneState {

        // Get cached dynamic state and merge with frame params
        const cached = this.getOrBuildDynamicState();
        const state: DynamicSceneState = {
            ...cached,
            playback: frameParams.playback,
            previousResolved: frameParams.previousResolved,
            sceneId: frameParams.sceneId ?? 0,
        };

        // ==========================================================
        // STEP 0: Tick all projection modifiers
        // ==========================================================
        for (const dynamicProjection of this.projectionRegistry.all()) {
            const modifiers = dynamicProjection.modifiers;
            if (modifiers) {
                for (const carMod of modifiers.carModifiers ?? []) {
                    carMod.tick(state.sceneId);
                }
                for (const nudgeMod of modifiers.nudgeModifiers ?? []) {
                    nudgeMod.tick(state.sceneId);
                }
                for (const stickMod of modifiers.stickModifiers ?? []) {
                    stickMod.tick(state.sceneId);
                }
            }
        }

        // ==========================================================
        // STEP 1: Resolve ALL Projections (Local Space)
        // ==========================================================
        const localProjectionPool: Record<string, ResolvedProjection> = {};

        for (const dynamicProjection of this.projectionRegistry.all()) {
            const resolved = this.projectionResolver.resolve(dynamicProjection, state, localProjectionPool);
            localProjectionPool[resolved.id] = resolved;
        }

        // ==========================================================
        // STEP 2: Transform to Global Space (Apply Hierarchy)
        // ==========================================================
        const globalProjectionPool: Record<string, ResolvedProjection> = {};

        for (const id in localProjectionPool) {
            const local = localProjectionPool[id];
            globalProjectionPool[id] = this.projectionResolver.applyHierarchyTransform(
                local,
                localProjectionPool,
                state.previousResolved
            );
        }

        // ==========================================================
        // STEP 3: Apply Projection Effects
        // ==========================================================

        // ==========================================================
        // STEP 4: Resolve Elements (can see resolved projections)
        // ==========================================================
        const screenProjection = this.getScreenProjection(globalProjectionPool);
        
        // Create context for element resolution - uses GLOBAL projections
        const elementResolutionContext: ResolutionContext = {
            previousResolved: state.previousResolved,
            playback: state.playback,
            settings: state.settings,
            projectionPool: globalProjectionPool,
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
            projectionPool: globalProjectionPool,
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
            projections: new Map(Object.entries(globalProjectionPool)),
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

    setEye(blueprintEye: BlueprintProjection & { type: typeof PROJECTION_TYPES.EYE }) {
        this.replaceProjection(
            blueprintEye
        );
    }

    setScreen(blueprintScreen: Partial<BlueprintProjection> & { type: typeof PROJECTION_TYPES.SCREEN }) {
        this.replaceProjection({
            ...DEFAULT_SCREEN_ROTATION,
            ...blueprintScreen
        } as BlueprintProjection);
    }
}