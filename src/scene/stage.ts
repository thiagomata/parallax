import type {
    AssetLoader,
    EffectLib,
    GraphicProcessor,
    GraphicsBundle,
    MapToBlueprint,
    BundleDynamicElement,
    ResolvedElement,
    SceneState, BundleResolvedElement, ProjectionEffectLib, BlueprintProjection, ResolvedProjection, DynamicProjection
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

    constructor(
        loader: AssetLoader<TGraphicBundle>,
        elementEffectLib: TElementEffectLib = {} as TElementEffectLib,
        projectionEffectLib: TProjectionEffectLib = {} as TProjectionEffectLib,
    ) {
        this.elementResolver = new ElementResolver<TGraphicBundle, TElementEffectLib>(elementEffectLib);
        this.projectionResolver = new ProjectionResolver<TProjectionEffectLib>(projectionEffectLib);

        this.elementRegistry = new ElementAssetRegistry<TGraphicBundle, TElementEffectLib>(loader, this.elementResolver);
        this.projectionRegistry = new ProjectionAssetRegistry<TProjectionEffectLib>(this.projectionResolver);
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
        const resolvedProjectionsMap = new Map(Object.entries(resolutionPool));

        //  3 - define the render queue based in the scene screen
        // Optimized Painter's Algorithm: Sort far-to-near
        const renderQueue = Array.from(this.elementRegistry.all())
            .map(element => ({
                element,
                distance: graphicProcessor.dist(
                    screen.position,
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

        const finalElementsMap = new Map(
            finalElements.map(pair => [pair.id, pair.bundle.resolved])
        );

        // 7 - apply the effects in the projection elements
        // MISSING

        const finalState = {
            ...stateBeforeEffect,
            elements: finalElementsMap
        } as SceneState;

        finalElements.map(
            pair => {
                this.elementResolver.render(pair.bundle,graphicProcessor, finalState)
            }
        )

        //

        return finalState;
    }
}