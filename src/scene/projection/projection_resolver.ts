import {
    type BlueprintProjection,
    DEFAULT_PROJECTION_ELEMENT,
    type DynamicProjection,
    type ProjectionEffectBlueprint,
    type ProjectionEffectLib,
    type ProjectionEffectResolutionGroup,
    type ProjectionType,
    type ResolvedProjection,
    type Rotation3,
    type SceneState,
    type Vector3
} from "../types.ts";
import {BaseResolver} from "../resolver/base_resolver.ts";

export class ProjectionResolver<
    TProjectionEffectLib extends ProjectionEffectLib
> extends BaseResolver<TProjectionEffectLib, ProjectionEffectResolutionGroup> {

    /**
     * Static Sanctuary:
     * We protect IDs and the Modifier lists from being wrapped as dynamic.
     */
    protected readonly staticKeys = [
        "id", "type", "effects",
        "carModifiers", "nudgeModifiers", "stickModifiers"
    ];

    constructor(effectLib: TProjectionEffectLib) {
        super(effectLib);
    }

    /**
     * Phase: Registration
     */
    prepare(
        blueprint: Partial<BlueprintProjection> & { id: string, type: ProjectionType }
    ): DynamicProjection {
        // Use parent engine to wrap standard properties (position, rotation, etc.)
        const dynamic = this.toDynamic<Partial<BlueprintProjection>, DynamicProjection>(blueprint);

        // Enhance with defaults and sorted modifiers
        return {
            ...dynamic,
            position:  this.compileProperty(blueprint.position  ?? DEFAULT_PROJECTION_ELEMENT.position),
            rotation:  this.compileProperty(blueprint.rotation  ?? DEFAULT_PROJECTION_ELEMENT.rotation),
            lookAt:    this.compileProperty(blueprint.lookAt    ?? DEFAULT_PROJECTION_ELEMENT.lookAt),
            direction: this.compileProperty(blueprint.direction ?? DEFAULT_PROJECTION_ELEMENT.direction),

            // Identity-based properties remain static via toDynamic + staticKeys
            carModifiers:   this.sortMods(blueprint.carModifiers),
            nudgeModifiers: blueprint.nudgeModifiers ?? [],
            stickModifiers: this.sortMods(blueprint.stickModifiers),
            effects:        this.bundleBehaviors(blueprint.effects),
        };
    }

    /**
     * Phase: The Frame Loop (Resolution + Math Stack)
     */
    resolve(dynamic: DynamicProjection, state: SceneState): ResolvedProjection {
        // 1. Resolve Dynamic Properties via parent
        const resolved = this.loopResolve<DynamicProjection>(dynamic, state);
        const initialDistance = this.getDistance(resolved);

        // 2. Car Modifiers (Sequential priority)
        let currentPosition = { ...resolved.position };
        for (const carModifier of dynamic.carModifiers ?? []) {
            const res = carModifier.getCarPosition(currentPosition, state);
            if (res.success) {
                currentPosition = res.value.position;
                break;
            }
        }

        // 3. Nudge Modifiers (Averaging/Voting)
        const votes = { x: [] as number[], y: [] as number[], z: [] as number[] };
        for (const nudgeModifier of dynamic.nudgeModifiers ?? []) {
            const res = nudgeModifier.getNudge(currentPosition, state);
            if (res.success) {
                const { x, y, z } = res.value;
                if (x !== undefined) votes.x.push(x);
                if (y !== undefined) votes.y.push(y);
                if (z !== undefined) votes.z.push(z);
            }
        }

        const avg = (v: number[]) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
        currentPosition = {
            x: currentPosition.x + avg(votes.x),
            y: currentPosition.y + avg(votes.y),
            z: currentPosition.z + avg(votes.z),
        };

        // 4. Stick Modifiers (Priority winner)
        let currentRotation = { ...resolved.rotation };
        let distanceModifier = 0;

        for (const stickModifier of dynamic.stickModifiers ?? []) {
            const res = stickModifier.getStick(currentPosition, state);
            if (res.success) {
                currentRotation.pitch += res.value.pitch;
                currentRotation.yaw   += res.value.yaw;
                currentRotation.roll  += res.value.roll;
                distanceModifier = res.value.distance;
                break;
            }
        }

        const direction = this.calculateDirection(currentRotation);
        const finalDistance = initialDistance + distanceModifier;

        return {
            ...resolved,
            carModifiers: dynamic.carModifiers,
            nudgeModifiers: dynamic.nudgeModifiers,
            stickModifiers: dynamic.stickModifiers,
            effects: dynamic.effects ?? [],
            position: currentPosition,
            rotation: currentRotation,
            distance: finalDistance,
            direction,
            lookAt: {
                x: (currentPosition.x + (direction.x * finalDistance)) || 0,
                y: (currentPosition.y + (direction.y * finalDistance)) || 0,
                z: (currentPosition.z + (direction.z * finalDistance)) || 0,
            }
        };
    }

    /**
     * Phase: The Frame Loop (Effects)
     * Using parent's applyEffects logic.
     */
    apply(resolved: ResolvedProjection, state: SceneState): ResolvedProjection {
        return this.applyEffects(resolved, resolved.effects, state);
    }

    /**
     * Implementation of Abstract Behavior Bundling
     */
    protected bundleBehaviors<K extends keyof TProjectionEffectLib & string>(
        instructions?: ProjectionEffectBlueprint<K, any>[]
    ): ProjectionEffectResolutionGroup[] {
        if (!instructions) return [];

        return instructions.map(instruction => {
            const bundle = this.effectLib[instruction.type];
            if (!bundle) throw new Error(`Invalid projection effect: ${instruction.type}`);

            return {
                type: instruction.type,
                bundle: bundle,
                settings: {
                    ...bundle.defaults,
                    ...(instruction.settings || {})
                }
            };
        });
    }

    // --- Math Utilities ---

    private sortMods<T extends { priority: number }>(mods?: ReadonlyArray<T> | undefined): ReadonlyArray<T> {
        if (!mods) return [] as ReadonlyArray<T>;
        return [...mods].sort((a, b) => b.priority - a.priority);
    }

    private getDistance(base: {
        position: Vector3;
        rotation: Rotation3;
        lookAt: Vector3;
        direction: Vector3;
    }): number {
        const dx = base.lookAt.x - base.position.x;
        const dy = base.lookAt.y - base.position.y;
        const dz = base.lookAt.z - base.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    private calculateDirection(rot: Rotation3): Vector3 {
        const cosP = Math.cos(rot.pitch);
        return {
            x: (Math.sin(rot.yaw) * cosP) || 0,
            y: (-Math.sin(rot.pitch)) || 0,
            z: (Math.cos(rot.yaw) * cosP) || 0
        };
    }
}