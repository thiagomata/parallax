import type {
    AssetLoader,
    EffectLib,
    GraphicProcessor,
    GraphicsBundle,
    MapToBlueprint,
    BundleDynamicElement,
    ResolvedElement,
    SceneState, BundleResolvedElement
} from "./types.ts";
import {AssetRegistry} from "./asset_registry.ts";
import {SceneResolver} from "./resolver/resolver.ts";

export class Stage<
    TGraphicBundle extends GraphicsBundle,
    TEffectLib extends EffectLib
> {
    private readonly registry: AssetRegistry<TGraphicBundle, {}>;
    private readonly resolver: SceneResolver<TGraphicBundle, TEffectLib>;

    constructor(loader: AssetLoader<TGraphicBundle>, effectLib?: TEffectLib) {
        this.resolver = new SceneResolver<TGraphicBundle, TEffectLib>(effectLib ?? {} as TEffectLib);
        this.registry = new AssetRegistry<TGraphicBundle, TEffectLib>(loader, this.resolver);
    }

    public add<T extends ResolvedElement>(blueprint: MapToBlueprint<T>): void {
        this.registry.register<T>(blueprint);
    }

    public remove(id: string): void {
        this.registry.remove(id);
    }

    public getElement(id: string): BundleDynamicElement<any, TGraphicBundle> | undefined {
        return this.registry.get(id);
    }

    public render(graphicProcessor: GraphicProcessor<TGraphicBundle>, state: SceneState): SceneState {

        if (state.projection.kind !== "camera" ) {
            // @fixme do the projection screen
            return state;
        }
        let camera = state.projection.camera;
        // Optimized Painter's Algorithm: Sort far-to-near
        const renderQueue = Array.from(this.registry.all())
            .map(element => ({
                element,
                distance: graphicProcessor.dist(
                    camera.position,
                    this.resolver.resolveProperty(element.dynamic.position, state)
                )
            }))
            .sort((a, b) => b.distance - a.distance)
            .map(
                pair => pair.element
            );

        let resolvedElements = renderQueue.map(
            bundle => {
                return {
                    id: bundle.id,
                    bundle: this.resolver.resolve(bundle, state) as BundleResolvedElement<ResolvedElement, TGraphicBundle>,
                }
            }
        );

        const resolvedMapElements = new Map(
            resolvedElements.map(
                pair => [pair.id, pair.bundle.resolved]
            )
        );

        const stateBeforeEffect = {
            ...state,
            elements: resolvedMapElements
        } as SceneState;

        const finalElements = resolvedElements.map(
            pair => {
                return {
                    id: pair.id,
                    bundle: this.resolver.effect(pair.bundle, stateBeforeEffect),
                }
            }
        )

        const finalElementsMap = new Map(
            finalElements.map(pair => [pair.id, pair.bundle.resolved])
        );

        const finalState = {
            ...stateBeforeEffect,
            elements: finalElementsMap
        } as SceneState;

        finalElements.map(
            pair => {
                this.resolver.render(pair.bundle,graphicProcessor, finalState)
            }
        )

        return finalState;
    }
}