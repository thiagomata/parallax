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
    type MapToDynamic,
    type BundleDynamicElement,
    type ResolvedElement,
    type SceneState,
    SPEC_KINDS,
    type Unwrapped, type BundleResolvedElement,
} from "./types";

export type UnwrappedElement<E> = E extends BundleDynamicElement<infer T, any> ? T : never;

export class SceneResolver<
    TGraphicBundle extends GraphicsBundle,
    TEffectLib extends EffectLib
> {

    private readonly effectLib: TEffectLib;

    constructor(effectLib: TEffectLib= {} as TEffectLib) {
        this.effectLib = effectLib;
    }

    prepare<T extends ResolvedElement>(
        id: string,
        blueprint: MapToBlueprint<T>,
        loader: AssetLoader<TGraphicBundle>
    ): BundleDynamicElement<T, TGraphicBundle> {

        const dynamic = this.toDynamic(blueprint) as DynamicElement<T>;
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

        if (blueprint.texture) {
            loader.hydrateTexture(blueprint.texture)
                .then(asset => assets.texture = asset);
        }

        if (blueprint.font) {
            loader.hydrateFont(blueprint.font)
                .then(asset => {
                    assets.font = asset
                });
        }

        return {
            id,
            dynamic,
            assets,
            effects: effectsBundles,
        };
    };

    resolve<
        T extends ResolvedElement
    >(
        element: BundleDynamicElement<T, TGraphicBundle>,
        state: SceneState
    ): BundleResolvedElement {
        const unwrapped:  Unwrapped<DynamicElement<T>> =  this.loopResolve(element.dynamic, state);
        const resolved = unwrapped as T;
        return {
            id: element.id,
            assets: element.assets ?? [],
            effects: element.effects ?? [],
            resolved: resolved,
        };
    }

    effect<
        E extends ResolvedElement
    >(
        bundle: BundleResolvedElement<E, TGraphicBundle>,
        state: SceneState
    ): BundleResolvedElement<E, TGraphicBundle> {
        if (!bundle.effects || bundle.effects.length === 0) {
            return bundle;
        }

        let resolved = bundle.resolved;
        for (const effectBlueprint of bundle.effects ) {
            if (effectBlueprint.settings?.enabled) {
                const effectBundle = this.effectLib[effectBlueprint.type];
                resolved = effectBundle.apply(
                    resolved,
                    state,
                    effectBlueprint.settings,
                    // bundle.assets
                )
            }
        }
        return {
            ...bundle,
            resolved: resolved,
        }
    }

    render<E extends ResolvedElement>(
        bundle: BundleResolvedElement<E, TGraphicBundle>,
        graphicProcessor: GraphicProcessor<TGraphicBundle>,
        state: SceneState
    ) {

        switch (bundle.resolved.type) {
            case ELEMENT_TYPES.BOX:
                graphicProcessor.drawBox(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.PANEL:
                graphicProcessor.drawPanel(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.SPHERE:
                graphicProcessor.drawSphere(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.CONE:
                graphicProcessor.drawCone(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.PYRAMID:
                graphicProcessor.drawPyramid(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.ELLIPTICAL:
                graphicProcessor.drawElliptical(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.CYLINDER:
                graphicProcessor.drawCylinder(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.TORUS:
                graphicProcessor.drawTorus(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.FLOOR:
                graphicProcessor.drawFloor(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.BILLBOARD:
                graphicProcessor.drawBillboard(bundle.resolved, bundle.assets, state);
                break;
            case ELEMENT_TYPES.TEXT:
                graphicProcessor.drawText(bundle.resolved, bundle.assets, state);
                break;
            default:
                const strange = bundle.resolved as unknown;
                throw new Error(`Unknown type ${strange?.constructor?.name} ` + JSON.stringify(strange));
        }
    }

    toDynamic<T extends ResolvedElement>(
        blueprint: MapToBlueprint<T>
    ): MapToDynamic<T> {
        const {type, texture, font, effects, ...rest} = blueprint;

        const dynamicProps: any = {};
        for (const key in rest) {
            dynamicProps[key] = this.compileProperty((rest as any)[key]);
        }
        return {
            type,
            texture,
            font,
            effects: effects,
            ...dynamicProps
        } as MapToDynamic<T>;
    }

    bundleBehaviors<K extends keyof TEffectLib & string>(
        instructions?: EffectBlueprint<K, TEffectLib[K]['defaults']>[]
    ): EffectResolutionGroup[] {
        if (!instructions) return [];

        return instructions.map( instruction => {

            const bundle = this.effectLib[instruction.type]

            if (!bundle) {
                // should never happen
                throw new Error(`invalid effect ${instruction.type}`)
            }

            return {
                type: instruction.type,
                bundle: bundle,
                settings: {
                    ...bundle.defaults,
                    ...instruction.settings || {enable: true},
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

    compileProperty<V>(value: V): DynamicProperty<V> {
        // 1. Function -> Computed
        if (typeof value === 'function') {
            return {
                kind: SPEC_KINDS.COMPUTED,
                compute: value as (state: SceneState) => any
            };
        }

        // 2. Objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            // SHORT-CIRCUIT: If the whole object is static (like a Vector3),
            // wrap it once and stop. No "Static Inception."
            if (this.isStaticData(value)) {
                return {kind: SPEC_KINDS.STATIC, value};
            }

            // Otherwise, it's a Branch: recursively compile its children
            const dynamicBranch: any = {};
            for (const key in value) {
                dynamicBranch[key] = this.compileProperty(value[key]);
            }

            return {kind: SPEC_KINDS.BRANCH, value: dynamicBranch};
        }

        // 3. Leaf Primitives
        return {kind: SPEC_KINDS.STATIC, value};
    }

    loopResolve<T>(src: T, state: SceneState): Unwrapped<T> {
        // 1. Handle DynamicProperty (The Container)
        if (this.isDynamicProperty(src)) {
            switch (src.kind) {
                case SPEC_KINDS.STATIC:
                    return src.value as Unwrapped<T>;
                case SPEC_KINDS.BRANCH:
                    return this.loopResolve(src.value, state) as Unwrapped<T>;
                case SPEC_KINDS.COMPUTED:
                    // Recursive call handles computed functions that return objects or other properties
                    return this.loopResolve(src.compute(state), state) as Unwrapped<T>;
            }
        }

        // 2. Handle Objects (The Branch)
        if (src && typeof src === 'object' && !Array.isArray(src)) {
            const result = {} as any;
            for (const key in src) {
                if (Object.prototype.hasOwnProperty.call(src, key)) {
                    result[key] = this.loopResolve(src[key], state);
                }
            }
            return result as Unwrapped<T>;
        }

        // 3. Leaf / Primitive identity
        return src as Unwrapped<T>;
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