import {
    ASSET_STATUS,
    type AssetLoader,
    type BehaviorBundle,
    type BehaviorBlueprint, type BehaviorResolutionGroup,
    type DynamicElement,
    type DynamicProperty,
    ELEMENT_TYPES,
    type ElementAssets,
    type GraphicProcessor,
    type GraphicsBundle,
    type MapToBlueprint,
    type MapToDynamic,
    type RenderableElement,
    type ResolvedElement,
    type SceneState,
    SPEC_KINDS,
    type Unwrapped,
} from "./types";

export type UnwrappedElement<E> = E extends RenderableElement<infer T, any> ? T : never;

export class SceneResolver<
    TBundle extends GraphicsBundle,
    TBehaviourLib extends Record<string, BehaviorBundle<any, any, any>>
> {

    private readonly behaviorLib: TBehaviourLib;

    constructor(behaviorLib: TBehaviourLib= {} as TBehaviourLib) {
        this.behaviorLib = behaviorLib;
    }

    createRenderable<T extends ResolvedElement>(
        id: string,
        blueprint: MapToBlueprint<T>,
        loader: AssetLoader<TBundle>
    ): RenderableElement<T, TBundle> {

        const dynamic = this.toDynamic(blueprint) as DynamicElement<T>;
        const behaviorsBundles = this.bundleBehaviors(blueprint.behaviors);

        const assets: ElementAssets<TBundle> = {
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

        const element: RenderableElement<T, TBundle> = {
            id,
            dynamic,
            assets,
            behaviors: behaviorsBundles,
            // 2. Placeholder or just define it after
            render: () => {}
        };

        element.render = (gp, state) => {
            this.render(element, gp, state);
        };

        return element;
    };

    render<E extends ResolvedElement>(
        element: RenderableElement<E, TBundle>,
        gp: GraphicProcessor<TBundle>,
        state: SceneState
    ) {
        const resolved = this.resolve(element, state);
        const distance = gp.dist(resolved.position, state.camera.position);
        const far = state.settings.camera.far ?? 5000;

        if (distance < far) {

            switch (resolved.type) {
                case ELEMENT_TYPES.BOX:
                    gp.drawBox(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.PANEL:
                    gp.drawPanel(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.SPHERE:
                    gp.drawSphere(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.CONE:
                    gp.drawCone(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.PYRAMID:
                    gp.drawPyramid(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.ELLIPTICAL:
                    gp.drawElliptical(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.CYLINDER:
                    gp.drawCylinder(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.TORUS:
                    gp.drawTorus(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.FLOOR:
                    gp.drawFloor(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.BILLBOARD:
                    gp.drawBillboard(resolved, element.assets, state);
                    break;
                case ELEMENT_TYPES.TEXT:
                    gp.drawText(resolved, element.assets, state);
                    break;
                default:
                    const strange = resolved as unknown;
                    throw new Error(`Unknown type ${strange?.constructor?.name} ` + JSON.stringify(strange));
            }
        }
    }

    toDynamic<T extends ResolvedElement>(
        blueprint: MapToBlueprint<T>
    ): MapToDynamic<T> {
        const {type, texture, font, behaviors, ...rest} = blueprint;

        const dynamicProps: any = {};
        for (const key in rest) {
            dynamicProps[key] = this.compileProperty((rest as any)[key]);
        }
        return {
            type,
            texture,
            font,
            behaviors,
            ...dynamicProps
        } as MapToDynamic<T>;
    }

    bundleBehaviors<K extends keyof TBehaviourLib & string>(
        instructions?: BehaviorBlueprint<K, TBehaviourLib[K]['defaults']>[]
    ): BehaviorResolutionGroup[] {
        if (!instructions) return [];

        return instructions.map( instruction => {

            const bundle = this.behaviorLib[instruction.type]

            if (!bundle) {
                // should never happen
                throw new Error(`invalid behavior ${instruction.type}`)
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

    resolve<E extends RenderableElement<any, any>>(
        element: E,
        state: SceneState
    ): UnwrappedElement<E> {
        // We unwrap the 'dynamic' property, which is DynamicElement<T>
        // The result is T, which matches UnwrappedElement<E>
        let resolved = this.loopResolve(element.dynamic, state) as UnwrappedElement<E>;

        for (const id in element.behaviors) {
            const behavior = element.behaviors[id];
            if (behavior.settings.enabled) {
                resolved = behavior.bundle.apply(
                    resolved,
                    state,
                    behavior.settings
                )
            }
        }

        return resolved;
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

    /**
     * THE RESOLUTION SIEVE
     * A pure function that recursively unwraps the Dynamic execution plan into Resolved data.
     */
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