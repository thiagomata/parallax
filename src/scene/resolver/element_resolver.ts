import {
    ASSET_STATUS,
    type AssetLoader,
    type DataProviderLib,
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
    type ResolutionContext,
    type ResolvedSceneState,
    type Rotation3,
    SPEC_KINDS,
    type BundleResolvedElement,
} from "../types.ts";
import {BaseResolver} from "./base_resolver.ts";
import {rotateVector} from "../utils/projection_utils.ts";

export class ElementResolver<
    TGraphicBundle extends GraphicsBundle,
    TEffectLib extends EffectLib,
> extends BaseResolver<TEffectLib, EffectResolutionGroup, ResolvedElement>{

    /**
     * Properties protected from the Dynamic Engine.
     * These remain static IDs or metadata used by the Loader/Processor.
     */
    readonly staticKeys: string[] = ["texture", "video", "font", "id", "type", "effects"];

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
            },
            video: blueprint.video
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
     * @param context - ResolutionContext containing playback, settings, and pools
     */
    resolve<T extends ResolvedElement>(
        element: BundleDynamicElement<T, TGraphicBundle>,
        context: ResolutionContext
    ): BundleResolvedElement {
        // Parent loopResolve performs the recursive unwrapping
        const resolved = this.loopResolve<DynamicElement<T>>(element.dynamic, context) as T;

        return {
            id: element.id,
            assets: element.assets,
            effects: element.effects ?? [],
            resolved: resolved,
        };
    }

    /**
     * Applies hierarchy transform.
     * 
     * Computes world position = parentWorldPos + rotate(childLocalPos by parentRotation)
     * Computes world rotation = parentWorldRot + childLocalRot
     * 
     * Keeps local position/rotation for proper rendering (rotate then translate).
     * Stores worldPosition/worldRotation for cases needing world coordinates.
     */
    applyHierarchyTransform(
        resolved: ResolvedElement,
        elementPool: Record<string, ResolvedElement>
    ): ResolvedElement {
        const targetId = (resolved as any).targetId;
        if (!targetId) {
            // No parent - world = local
            return {
                ...resolved,
                worldPosition: resolved.position,
                worldRotation: resolved.rotate,
            };
        }

        const parent = elementPool[targetId];
        if (!parent) {
            // Parent not found - treat as root
            return {
                ...resolved,
                worldPosition: resolved.position,
                worldRotation: resolved.rotate,
            };
        }

        // Get parent's world transform (recursive)
        const parentWorld = this.applyHierarchyTransform(parent, elementPool);
        
        const parentPos = (parentWorld as any).worldPosition ?? parentWorld.position;
        const parentRot: Rotation3 = { 
            pitch: ((parentWorld as any).worldRotation?.x ?? parentWorld.rotate?.x) ?? 0, 
            yaw: ((parentWorld as any).worldRotation?.y ?? parentWorld.rotate?.y) ?? 0, 
            roll: ((parentWorld as any).worldRotation?.z ?? parentWorld.rotate?.z) ?? 0 
        };

        const childLocalPos = resolved.position;
        const localRot: Rotation3 = { 
            pitch: resolved.rotate?.x ?? 0, 
            yaw: resolved.rotate?.y ?? 0, 
            roll: resolved.rotate?.z ?? 0 
        };

        // Rotate child's local position by parent's rotation
        const rotatedPos = rotateVector(childLocalPos, parentRot);
        
        // World position = parentPos + rotated child position
        const worldPos = {
            x: parentPos.x + rotatedPos.x,
            y: parentPos.y + rotatedPos.y,
            z: parentPos.z + rotatedPos.z,
        };

        // Combined rotations
        const combinedRot: Rotation3 = {
            pitch: parentRot.pitch + localRot.pitch,
            yaw: parentRot.yaw + localRot.yaw,
            roll: parentRot.roll + localRot.roll,
        };

        return {
            ...resolved,
            // Keep local position/rotation for proper rendering (rotate then translate)
            // Add world position/rotation for world-space calculations
            worldPosition: worldPos,
            worldRotation: {
                x: combinedRot.pitch,
                y: combinedRot.yaw,
                z: combinedRot.roll,
            },
        };
    }

    /**
     * Phase: The Frame Loop (Behavioral Application)
     */
    effect<E extends ResolvedElement>(
        bundle: BundleResolvedElement<E, TGraphicBundle>,
        context: ResolutionContext
    ): BundleResolvedElement<E, TGraphicBundle> {
        return {
            ...bundle,
            // Centralized execution logic from BaseResolver
            resolved: this.applyEffects(bundle.resolved, bundle.effects, context) as E
        };
    }

    /**
     * Phase: The Frame Loop (Graphic Processing)
     */
    render<E extends ResolvedElement>(
        bundle: BundleResolvedElement<E, TGraphicBundle>,
        graphicProcessor: GraphicProcessor<TGraphicBundle>,
        state: ResolvedSceneState
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


    resolveProperty<V, TDataProviderLib extends DataProviderLib = DataProviderLib>(
        prop: DynamicProperty<V, any, TDataProviderLib>,
        context: ResolutionContext<TDataProviderLib>
    ): V {
        return this.loopResolve(prop, context) as V;
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