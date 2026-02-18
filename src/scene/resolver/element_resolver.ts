import {
    ASSET_STATUS,
    type AssetLoader,
    type DynamicElement,
    type DynamicProperty,
    type EffectBlueprint,
    type EffectLib,
    type EffectResolutionGroup,
    ELEMENT_TYPES,
    type ElementAssets,
    type GraphicProcessor,
    type GraphicsBundle,
    type MapToBlueprint,
    type BundleDynamicElement,
    type ResolvedElement,
    type SceneState,
    SPEC_KINDS,
    type BundleResolvedElement,
} from "../types";
import {BaseResolver} from "./base_resolver.ts";

export class ElementResolver<
    TGraphicBundle extends GraphicsBundle,
    TEffectLib extends EffectLib
> extends BaseResolver<TEffectLib, EffectResolutionGroup>{

    /**
     * Properties protected from the Dynamic Engine.
     * These remain static IDs or metadata used by the Loader/Processor.
     */
    readonly staticKeys: string[] = ["texture", "font", "id", "type", "effects"];

    constructor(effectLib: TEffectLib= {} as TEffectLib) {
        super(effectLib);
    }

    /**
     * Phase: Registration & Hydration
     * Orchestrates the transition from Blueprint to a Hydrated Dynamic Element.
     */
    prepare<T extends ResolvedElement>(
        blueprint: MapToBlueprint<T>,
        loader: AssetLoader<TGraphicBundle>
    ): BundleDynamicElement<T, TGraphicBundle> {

        // Use parent engine to wrap properties while respecting staticKeys
        const dynamic = this.toDynamic<MapToBlueprint<T>, DynamicElement<T>>(blueprint);
        const effectsBundles = this.bundleBehaviors(blueprint.effects);

        const assets: ElementAssets<TGraphicBundle> = {
            texture: blueprint.texture ? {status: ASSET_STATUS.PENDING, value: null} : {
                status: ASSET_STATUS.READY,
                value: null
            },
            font: blueprint.font ? {status: ASSET_STATUS.PENDING, value: null} : {
                status: ASSET_STATUS.READY,
                value: null
            }
        };

        // Side-effects (Async Loading) are explicitly handled during preparation
        if (blueprint.texture) {
            loader.hydrateTexture(blueprint.texture)
                .then(asset => assets.texture = asset);
        }

        if (blueprint.font) {
            loader.hydrateFont(blueprint.font)
                .then(asset => assets.font = asset);
        }

        return {
            id: blueprint.id,
            dynamic,
            assets,
            effects: effectsBundles,
        };
    };

    /**
     * Phase: The Frame Loop (Structural Resolution)
     */
    resolve<T extends ResolvedElement>(
        element: BundleDynamicElement<T, TGraphicBundle>,
        state: SceneState
    ): BundleResolvedElement {
        // Parent loopResolve performs the recursive unwrapping
        const resolved = this.loopResolve<DynamicElement<T>>(element.dynamic, state) as T;

        return {
            id: element.id,
            assets: element.assets,
            effects: element.effects ?? [],
            resolved: resolved,
        };
    }

    /**
     * Phase: The Frame Loop (Behavioral Application)
     */
    effect<E extends ResolvedElement>(
        bundle: BundleResolvedElement<E, TGraphicBundle>,
        state: SceneState
    ): BundleResolvedElement<E, TGraphicBundle> {
        return {
            ...bundle,
            // Centralized execution logic from BaseResolver
            resolved: this.applyEffects(bundle.resolved, bundle.effects, state)
        };
    }

    /**
     * Phase: The Frame Loop (Graphic Processing)
     */
    render<E extends ResolvedElement>(
        bundle: BundleResolvedElement<E, TGraphicBundle>,
        graphicProcessor: GraphicProcessor<TGraphicBundle>,
        state: SceneState
    ) {
        const { resolved, assets } = bundle;

        switch (resolved.type) {
            case ELEMENT_TYPES.BOX:        graphicProcessor.drawBox(resolved, assets, state); break;
            case ELEMENT_TYPES.PANEL:      graphicProcessor.drawPanel(resolved, assets, state); break;
            case ELEMENT_TYPES.SPHERE:     graphicProcessor.drawSphere(resolved, assets, state); break;
            case ELEMENT_TYPES.CONE:       graphicProcessor.drawCone(resolved, assets, state); break;
            case ELEMENT_TYPES.PYRAMID:    graphicProcessor.drawPyramid(resolved, assets, state); break;
            case ELEMENT_TYPES.ELLIPTICAL: graphicProcessor.drawElliptical(resolved, assets, state); break;
            case ELEMENT_TYPES.CYLINDER:   graphicProcessor.drawCylinder(resolved, assets, state); break;
            case ELEMENT_TYPES.TORUS:      graphicProcessor.drawTorus(resolved, assets, state); break;
            case ELEMENT_TYPES.FLOOR:      graphicProcessor.drawFloor(resolved, assets, state); break;
            case ELEMENT_TYPES.TEXT:       graphicProcessor.drawText(resolved, assets, state); break;
            default:
                const strange = bundle.resolved as unknown;
                throw new Error(`Unknown type ${strange?.constructor?.name} ` + JSON.stringify(strange));
        }
    }

    /**
     * Logic for transforming Effect Blueprints into Resolution Groups.
     */
    protected bundleBehaviors<K extends keyof TEffectLib & string>(
        instructions?: EffectBlueprint<K, TEffectLib[K]['defaults']>[]
    ): EffectResolutionGroup[] {
        if (!instructions) return [];

        return instructions.map( instruction => {
            const bundle = this.effectLib[instruction.type];
            if (!bundle) throw new Error(`Invalid effect: ${instruction.type}`);

            return {
                type: instruction.type,
                bundle: bundle,
                settings: {
                    ...bundle.defaults,
                    ...(instruction.settings || { enabled: true }),
                }
            };
        });
    }


    resolveProperty<V>(
        prop: DynamicProperty<V>,
        state: SceneState
    ): V {
        return this.loopResolve(prop, state) as V;
    }

    isStaticData(val: any): boolean {
        if (typeof val === 'function') return false;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            return Object.values(val).every((v) => this.isStaticData(v));
        }
        return true;
    }

    /**
     * Internal Type Guard for DynamicProperty
     */
    isDynamicProperty<T>(obj: unknown): obj is DynamicProperty<T> {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            'kind' in obj &&
            Object.values(SPEC_KINDS).includes((obj as any).kind)
        );
    }
}