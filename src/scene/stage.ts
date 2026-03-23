import {
    type AssetLoader,
    type BlueprintProjection,
    type BundleDynamicElement,
    type BundleResolvedElement,
    type DataProviderTickContext,
    type DataProviderLib,
    type DynamicProjection,
    type DynamicSceneState,
    type EffectLib,
    type GraphicProcessor,
    type GraphicsBundle,
    type CarModifier,
    type NudgeModifier,
    type StickModifier,
    type ProjectionEffectLib,
    type ResolutionContext,
    type ResolvedElement,
    type ResolvedProjection,
    type ResolvedProjectionWithGlobals,
    type ResolvedSceneState,
    type Rotation3,
    type ScenePlaybackState,
    type SceneSettings,
    type Vector3,
    WindowConfig,
    DEFAULT_EYE_LOOK_AT,
    DEFAULT_SCREEN_ROTATION,
    LOOK_MODES,
    STANDARD_PROJECTION_IDS,
    PROJECTION_TYPES,
} from "./types.ts";
import {ElementResolver} from "./resolver/element_resolver.ts";
import {ProjectionResolver} from "./projection/projection_resolver.ts";
import {ProjectionAssetRegistry} from "./registry/projection_asset_registry.ts";
import {ElementAssetRegistry} from "./registry/element_asset_registry.ts";
import {computeGlobalTransform} from "./utils/projection_utils.ts";
import {HierarchyTools, type HierarchySource, type HierarchyTreeNode} from "./utils/hierarchy.ts";
import type { RenderTreeNode, ProjectionTreeNode } from "./types.ts";

export class Stage<
    TGraphicBundle extends GraphicsBundle,
    TElementEffectLib extends EffectLib,
    TProjectionEffectLib extends ProjectionEffectLib,
    TDataProviderLib extends DataProviderLib = {},
> {
    private readonly elementRegistry: ElementAssetRegistry<TGraphicBundle, {}>;
    private readonly projectionRegistry: ProjectionAssetRegistry<TProjectionEffectLib>;
    private readonly elementResolver: ElementResolver<TGraphicBundle, TElementEffectLib>;
    private readonly projectionResolver: ProjectionResolver<TProjectionEffectLib>;
    private readonly settings: SceneSettings;
    private readonly dataProviderLib: TDataProviderLib;

    private lastFrameState: ResolvedSceneState | null = null;
    private cachedDynamicState: DynamicSceneState | null = null;
    
    // Cache for distance calculations to reduce per-frame computation
    private distanceCache = new Map<string, number>();
    private lastCacheUpdate = 0;
    private readonly cacheValidityMs = 100;

    constructor(
        settings: SceneSettings,
        loader: AssetLoader<TGraphicBundle>,
        elementEffectLib: TElementEffectLib = {} as TElementEffectLib,
        projectionEffectLib: TProjectionEffectLib = {} as TProjectionEffectLib,
        dataProviderLib: TDataProviderLib = {} as TDataProviderLib,
    ) {
        this.settings = settings;
        this.dataProviderLib = dataProviderLib;

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

    public addElement(blueprint: { id: string } & Record<string, unknown>): void {
        if (this.elementRegistry.get(blueprint.id) !== undefined) {
            return; // Idempotent: ignore duplicate element add
        }
        if (this.projectionRegistry.get(blueprint.id) !== undefined) {
            throw new Error(`ID collision: Cannot add element '${blueprint.id}' - a projection with the same ID already exists.`);
        }
        this.elementRegistry.register(blueprint as any);
        this.cachedDynamicState = null;
        this.distanceCache.clear();
    }

    public removeElement(id: string): void {
        this.elementRegistry.remove(id);
        this.cachedDynamicState = null;
        this.distanceCache.delete(id);
    }

    public removeProjection(id: string): void {
        this.projectionRegistry.delete(id);
        this.cachedDynamicState = null;
        this.distanceCache.clear();
    }

    public getElement(id: string): BundleDynamicElement<any, TGraphicBundle> | undefined {
        return this.elementRegistry.get(id);
    }

    public addProjection(blueprint: BlueprintProjection): void {
        if (this.elementRegistry.get(blueprint.id) !== undefined) {
            throw new Error(`ID collision: Cannot add projection '${blueprint.id}' - an element with the same ID already exists.`);
        }

        const registry = this.projectionRegistry;
        const hierarchy = new HierarchyTools<{ id: string; parentId?: string }>({
            get: (id: string) => {
                if (id === blueprint.id) {
                    return { id: blueprint.id, parentId: blueprint.parentId };
                }
                const projection = registry.get(id);
                return projection ? { id: projection.id, parentId: projection.parentId } : undefined;
            },
            all: function* () {
                yield { id: blueprint.id, parentId: blueprint.parentId };
                for (const projection of registry.all()) {
                    yield { id: projection.id, parentId: projection.parentId };
                }
            },
        });

        try {
            hierarchy.validate(blueprint);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            if (message.includes('Self-Reference: Node')) {
                throw new Error(`Circular dependency: ${blueprint.id} targets its own descendant.`);
            }

            if (message.includes('not found')) {
                const parentId = blueprint.parentId ?? 'unknown';
                throw new Error(`Parent ${parentId} not found for projection ${blueprint.id}`);
            }

            if (message.includes('recursive reference')) {
                throw new Error(`Circular dependency: ${blueprint.id} targets its own descendant.`);
            }

            throw error;
        }

        this.projectionRegistry.register(blueprint);
        this.cachedDynamicState = null; // invalidate cache
    }

    public addModifierToProjection(
        projectionId: string,
        modifier: CarModifier | NudgeModifier | StickModifier,
        modifierType: 'car' | 'nudge' | 'stick'
    ): void {
        const projection = this.projectionRegistry.get(projectionId);
        if (!projection) {
            throw new Error(`Projection '${projectionId}' not found`);
        }

        // Validate modifier type based on lookMode
        const lookMode = projection.lookMode;
        
        if (lookMode === LOOK_MODES.LOOK_AT) {
            // LOOK_AT mode only allows carModifiers and nudgeModifiers
            if (modifierType === 'stick') {
                throw new Error(`Cannot add stickModifier to projection '${projectionId}' with lookMode LOOK_AT`);
            }
        }

        // Create new modifiers object with the new modifier
        const existingModifiers = projection.modifiers ?? {};
        
        let newModifiers: {
            carModifiers?: readonly CarModifier[];
            nudgeModifiers?: readonly NudgeModifier[];
            stickModifiers?: readonly StickModifier[];
        };

        if (modifierType === 'car') {
            const existing = existingModifiers.carModifiers ?? [];
            newModifiers = { ...existingModifiers, carModifiers: [...existing, modifier as CarModifier] };
        } else if (modifierType === 'nudge') {
            const existing = existingModifiers.nudgeModifiers ?? [];
            newModifiers = { ...existingModifiers, nudgeModifiers: [...existing, modifier as NudgeModifier] };
        } else {
            const existing = existingModifiers.stickModifiers ?? [];
            newModifiers = { ...existingModifiers, stickModifiers: [...existing, modifier as StickModifier] };
        }

        // Create new projection with updated modifiers (immutable update)
        const updatedProjection: DynamicProjection = {
            ...projection,
            modifiers: newModifiers,
        };

        // Update the registry
        this.projectionRegistry.update(updatedProjection);
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

        // Tick projection modifiers (per-frame)
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

        // Tick providers in hierarchy order and snapshot their data for this frame
        const dataProvidersMap = this.tickDataProviders(state.sceneId);

        // Resolve projections (local space) - with access to dataProviders for modifiers
        const localProjectionPool: Record<string, ResolvedProjection> = {};

        for (const dynamicProjection of this.projectionRegistry.all()) {
            const resolved = this.projectionResolver.resolve(dynamicProjection, state, localProjectionPool, dataProvidersMap);
            localProjectionPool[resolved.id] = resolved;
        }

        // Build projection tree with global positions computed
        const { tree: projectionTree, flatMap: projectionLookup } = 
            this.buildProjectionTree(localProjectionPool);

        // Convert Map to Record for context (effects need Record with global positions)
        const projectionLookupRecord: Record<string, ResolvedProjection> = {};
        for (const [id, proj] of projectionLookup) {
            projectionLookupRecord[id] = proj;
        }

        // Resolve elements (distance-sorted, can see resolved projections)
        const screenProjection = projectionLookup.get(STANDARD_PROJECTION_IDS.SCREEN);
        if (!screenProjection) {
            throw new Error(`Screen projection '${STANDARD_PROJECTION_IDS.SCREEN}' not found`);
        }
        
        // Uses GLOBAL projections
        const elementResolutionContext: ResolutionContext<TDataProviderLib> = {
            previousResolved: state.previousResolved,
            playback: state.playback,
            settings: state.settings,
            projectionPool: projectionLookupRecord,
            elementPool: {},
            dataProviders: dataProvidersMap,
        };

        const renderQueue = Array.from(this.elementRegistry.all())
            .map(element => {
                const cachedDist = this.distanceCache.get(element.id);
                if (cachedDist !== undefined) {
                    return { element, distance: cachedDist };
                }
                const distance = graphicProcessor.dist(
                    screenProjection.position,
                    this.elementResolver.resolveProperty(element.dynamic.position, elementResolutionContext)
                );
                this.distanceCache.set(element.id, distance);
                return { element, distance };
            })
            .sort((a, b) => b.distance - a.distance)
            .map(pair => pair.element);
        
        // Invalidate cache periodically to handle dynamic elements
        const now = performance.now();
        if (now - this.lastCacheUpdate > this.cacheValidityMs) {
            this.distanceCache.clear();
            this.lastCacheUpdate = now;
        }

        const resolvedElements = renderQueue.map(bundle => ({
            id: bundle.id,
            bundle: this.elementResolver.resolve(bundle, elementResolutionContext) as BundleResolvedElement<ResolvedElement, TGraphicBundle>,
        }));

        // Build element pool for effects and lookups
        const elementPool: Record<string, ResolvedElement> = {};
        for (const pair of resolvedElements) {
            elementPool[pair.id] = pair.bundle.resolved;
        }

        const resolvedMapElements = new Map(
            resolvedElements.map(pair => [pair.id, pair.bundle.resolved])
        );

        // Apply element effects (context has both pools)
        const effectContext: ResolutionContext<TDataProviderLib> = {
            previousResolved: state.previousResolved,
            playback: state.playback,
            settings: state.settings,
            projectionPool: projectionLookupRecord,
            elementPool: Object.fromEntries(resolvedMapElements),
            dataProviders: dataProvidersMap,
        };

        const finalElements = resolvedElements.map(pair => ({
            id: pair.id,
            bundle: this.elementResolver.effect(pair.bundle, effectContext),
        }));

        const finalMapElements = new Map(finalElements.map(p => [p.id, p.bundle.resolved]));
        
        const finalState: ResolvedSceneState = {
            sceneId: state.sceneId,
            settings: state.settings,
            playback: state.playback,
            elements: finalMapElements,
            projections: projectionLookup,
        };

        // Build render tree and draw
        let renderTree: RenderTreeNode | null;
        renderTree = this.buildRenderTree(finalElements);

        // Build projection tree for camera
        graphicProcessor.setCameraTree(projectionTree);

        graphicProcessor.drawTree(renderTree, finalState);

        this.lastFrameState = finalState;

        return finalState;
    }

    private tickDataProviders(sceneId: number): {
        [K in keyof TDataProviderLib]: ReturnType<TDataProviderLib[K]['getData']>;
    } {
        type ProviderNode = {
            readonly id: string;
            readonly parentId?: string;
            readonly key: keyof TDataProviderLib;
            readonly provider: TDataProviderLib[keyof TDataProviderLib];
        };

        const nodes: ProviderNode[] = [];
        const keys = Object.keys(this.dataProviderLib) as Array<keyof TDataProviderLib>;
        for (const key of keys) {
            const provider = this.dataProviderLib[key];
            nodes.push({
                id: String(key),
                parentId: provider.parentId,
                key,
                provider,
            });
        }

        const nodeMap = new Map<string, ProviderNode>();
        for (const node of nodes) {
            nodeMap.set(node.id, node);
        }

        const hierarchy = new HierarchyTools<ProviderNode>({
            get: (id: string) => nodeMap.get(id),
            all: function* () {
                yield* nodes;
            },
        });

        try {
            hierarchy.validateAll();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            if (message.includes('Parent "webCam" not found') && nodes.length === 1 && nodes[0]?.parentId) {
                throw new Error(`${String(nodes[0].key)} requires parent provider ${nodes[0].parentId}, but it was not registered.`);
            }

            throw error;
        }

        const dataProvidersMap = {} as {
            [K in keyof TDataProviderLib]: ReturnType<TDataProviderLib[K]['getData']>;
        };

        hierarchy.walk((node, context) => {
            const tickContext: DataProviderTickContext = {
                parent: context.parent?.provider ?? null,
                ancestorsById: new Map(
                    Array.from(context.ancestorsById.entries()).map(([id, ancestor]) => [id, ancestor.provider])
                ),
            };

            node.provider.tick(sceneId, tickContext);
            dataProvidersMap[node.key] = node.provider.getData() as ReturnType<TDataProviderLib[typeof node.key]['getData']>;
        });

        return dataProvidersMap;
    }

    /**
     * Builds a render tree from flat list based on parentId relationships.
     */
    private buildRenderTree(elements: Array<{ id: string; bundle: BundleResolvedElement<ResolvedElement, TGraphicBundle> }>): RenderTreeNode | null {
        const nodeMap = new Map<string, { props: ResolvedElement; assets: BundleResolvedElement<ResolvedElement, TGraphicBundle>["assets"] }>();
        for (const pair of elements) {
            nodeMap.set(pair.id, {
                props: pair.bundle.resolved,
                assets: pair.bundle.assets,
            });
        }

        const source: HierarchySource<ResolvedElement> = {
            get: (id: string) => nodeMap.get(id)?.props,
            all: function* () {
                for (const pair of elements) {
                    yield pair.bundle.resolved;
                }
            },
        };

        const hierarchy = new HierarchyTools(source);
        hierarchy.validateAll({ requireParentExists: false });
        const forest = hierarchy.buildForest();
        const roots = forest.map(node => this.toRenderTreeNode(node, nodeMap));

        // If only one root, return it; otherwise wrap in a container
        if (roots.length === 1) {
            return roots[0];
        } else if (roots.length > 1) {
            // Multiple roots - create a virtual root
            return {
                props: { id: '__root__', type: 'box' as any, position: { x: 0, y: 0, z: 0 } },
                assets: { texture: { status: 'READY', value: null } },
                children: roots
            };
        }

        return null;
    }

    private toRenderTreeNode(
        node: HierarchyTreeNode<ResolvedElement>,
        nodeMap: Map<string, { props: ResolvedElement; assets: BundleResolvedElement<ResolvedElement, TGraphicBundle>["assets"] }>
    ): RenderTreeNode {
        const entry = nodeMap.get(node.value.id);

        if (!entry) {
            throw new Error(`Render tree node '${node.value.id}' missing from lookup map`);
        }

        return {
            props: entry.props,
            assets: entry.assets,
            children: node.children.map(child => this.toRenderTreeNode(child, nodeMap)),
        };
    }

    /**
     * Builds a projection tree from flat pool based on parentId relationships.
     * Computes global position/rotation for each node during tree traversal.
     * Returns both the tree and a flat map for lookup.
     */
    private buildProjectionTree(
        projectionPool: Record<string, ResolvedProjection>
    ): { tree: ProjectionTreeNode | null; flatMap: Map<string, ResolvedProjectionWithGlobals> } {
        const nodeMap = new Map<string, ResolvedProjectionWithGlobals>();
        const projections = Object.values(projectionPool);
        const flatMap = new Map<string, ResolvedProjectionWithGlobals>();

        for (const projection of projections) {
            nodeMap.set(projection.id, projection as ResolvedProjectionWithGlobals);
        }

        const source: HierarchySource<ResolvedProjection> = {
            get: (id: string) => projectionPool[id],
            all: function* () {
                yield* projections;
            },
        };

        const hierarchy = new HierarchyTools(source);
        const forest = hierarchy.buildForest();

        const virtualRootPos = { x: 0, y: 0, z: 0 };
        const virtualRootRot = { yaw: 0, pitch: 0, roll: 0 };
        const roots = forest.map(node => this.toProjectionTreeNode(node, nodeMap));

        if (roots.length === 1) {
            this.computeGlobals(roots[0], virtualRootPos, virtualRootRot, flatMap);
            return { tree: roots[0], flatMap };
        } else if (roots.length > 1) {
            const virtualRoot: ProjectionTreeNode = {
                props: {
                    id: '__root__',
                    type: PROJECTION_TYPES.SCREEN,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 0 },
                    distance: 0,
                    effects: [],
                    parentId: undefined,
                    globalPosition: { x: 0, y: 0, z: 0 },
                    globalRotation: { yaw: 0, pitch: 0, roll: 0 },
                },
                children: roots
            };

            for (const root of roots) {
                this.computeGlobals(root, virtualRootPos, virtualRootRot, flatMap);
            }
            return { tree: virtualRoot, flatMap };
        }

        return { tree: null, flatMap };
    }

    private toProjectionTreeNode(
        node: HierarchyTreeNode<ResolvedProjection>,
        nodeMap: Map<string, ResolvedProjectionWithGlobals>
    ): ProjectionTreeNode {
        const props = nodeMap.get(node.value.id);

        if (!props) {
            throw new Error(`Projection tree node '${node.value.id}' missing from lookup map`);
        }

        return {
            props,
            children: node.children.map(child => this.toProjectionTreeNode(child, nodeMap)),
        };
    }

    private computeGlobals(
        node: ProjectionTreeNode,
        parentGlobalPos: Vector3,
        parentGlobalRot: Rotation3,
        flatMap: Map<string, ResolvedProjectionWithGlobals>
    ): void {
        const { globalPosition, globalRotation } = computeGlobalTransform(
            node.props.position,
            node.props.rotation,
            parentGlobalPos,
            parentGlobalRot
        );

        node.props.globalPosition = globalPosition;
        node.props.globalRotation = globalRotation;
        flatMap.set(node.props.id, node.props);

        for (const child of node.children) {
            this.computeGlobals(child, globalPosition, globalRotation, flatMap);
        }
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
