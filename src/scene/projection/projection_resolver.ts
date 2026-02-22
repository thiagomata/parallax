import {
    type BlueprintProjection, DEFAULT_PROJECTION_ELEMENT,
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
import {ProjectionAssetRegistry} from "../registry/projection_asset_registry.ts";

export class ProjectionResolver<
    TProjectionEffectLib extends ProjectionEffectLib,
> extends BaseResolver<TProjectionEffectLib, ProjectionEffectResolutionGroup, ResolvedProjection> {

    /**
     * Static Sanctuary:
     * We protect IDs and the Modifier lists from being wrapped as dynamic.
     */
    protected readonly staticKeys = [
        "id", "type", "effects", "modifiers"
    ];

    constructor(effectLib: TProjectionEffectLib) {
        super(effectLib);
    }

    /**
     * Phase: Registration
     */
    prepare(
        blueprint: Partial<BlueprintProjection> & { id: string, type: ProjectionType },
        registry: ProjectionAssetRegistry<TProjectionEffectLib>,
    ): DynamicProjection {

        // validate
        this.validateBlueprint(blueprint, registry);

        // Use parent engine to wrap standard properties (position, rotation, etc.)
        const dynamic = this.toDynamic<Partial<BlueprintProjection>, DynamicProjection>(
            {...DEFAULT_PROJECTION_ELEMENT, ...blueprint}
        );

        // Enhance with defaults and sorted modifiers
        return {
            ...dynamic,
            modifiers: {
                carModifiers:   this.sortMods(blueprint.modifiers?.carModifiers),
                nudgeModifiers: blueprint.modifiers?.nudgeModifiers ?? [],
                stickModifiers: this.sortMods(blueprint.modifiers?.stickModifiers),
            },
            effects: this.bundleBehaviors(blueprint.effects),
        };
    }

    private validateBlueprint(
        blueprint: Partial<BlueprintProjection> & {
            id: string;
            type: ProjectionType
        },
        registry: ProjectionAssetRegistry<TProjectionEffectLib>
    ) {
        if (!blueprint.targetId) return;

        if (blueprint.targetId === blueprint.id) {
            throw new Error(`Self-Reference: Projection "${blueprint.id}" cannot target itself.`);
        }

        const target = registry.get(blueprint.targetId);

        if (!target) {
            throw new Error(
                `Hierarchy Violation: Target "${blueprint.targetId}" not found. ` +
                `Targets must be registered before their followers.`
            );
        }

        if (!this.validateHierarchy(blueprint.id, blueprint.targetId, registry)){
            throw new Error(
                `Hierarchy Violation: Target "${blueprint.targetId}" has recursive reference.`
            )
        }
    }

    private validateHierarchy(
        id: string,
        targetId: string,
        registry: ProjectionAssetRegistry<TProjectionEffectLib>
    ): boolean {
        let currentId: string | undefined = targetId;
        const visited = new Set<string>([id]);

        while (currentId) {
            if (visited.has(currentId)) return false; // Loop detected
            visited.add(currentId);

            const next = registry.get(currentId);
            currentId = next?.targetId;
        }
        return true;
    }

    /**
     * The Frame Loop (Resolution + Math Stack)
     */
    resolve(
        dynamic: DynamicProjection,
        state: SceneState,
        resolutionPool: Record<string, ResolvedProjection> = {} as Record<string, ResolvedProjection>
    ): ResolvedProjection {

        // 1. Resolve Dynamic Properties via parent (incorporates resolutionPool context)
        const resolved = this.loopResolve(dynamic, state, resolutionPool);

        // 2. THE HIERARCHY ANCHOR (World Space Origin Shift)
        let currentPosition = { ...resolved.position };
        let currentRotation = { ...resolved.rotation };

        if (dynamic.targetId) {
            // Find our parent in the current frame pool or the previous state
            // const target = resolutionPool[dynamic.targetId];
            let target: ResolvedProjection | null = null;
            if (dynamic.targetId in resolutionPool) {
                target = resolutionPool[dynamic.targetId];
            }
            if (target == null && state.projections && state.projections.has(dynamic.targetId)) {
                target = state.projections.get(dynamic.targetId) ?? target;
            }
            if (target) {
                // Shift Position relative to parent
                currentPosition.x += target.position.x;
                currentPosition.y += target.position.y;
                currentPosition.z += target.position.z;

                // Shift Rotation (YXZ inheritance)
                currentRotation.yaw += target.rotation.yaw;
                currentRotation.pitch += target.rotation.pitch;
                currentRotation.roll += target.rotation.roll;
            }
        }

    // 3. Car Modifiers (UNCHANGED)
        for (const carModifier of dynamic.modifiers?.carModifiers ?? []) {
            const res = carModifier.getCarPosition(currentPosition, state);
            if (res.success) {
                currentPosition = res.value.position;
                break;
            }
        }

        // 4. Nudge Modifiers (Averaging/Voting)
        const votes = { x: [] as number[], y: [] as number[], z: [] as number[] };
        for (const nudgeModifier of dynamic.modifiers?.nudgeModifiers ?? []) {
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

    // 5. Stick Modifiers (rotation adjustments allowed, but lookAt remains authority)
        for (const stickModifier of dynamic.modifiers?.stickModifiers ?? []) {
            const res = stickModifier.getStick(currentPosition, state);
            if (res.success) {
                currentRotation.pitch += res.value.pitch;
                currentRotation.yaw   += res.value.yaw;
                currentRotation.roll  += res.value.roll;
                break;
            }
        }

    // ==========================================================
    // LOOKAT IS AUTHORITATIVE FROM HERE
    // ==========================================================

    const dx = resolved.lookAt.x - currentPosition.x;
    const dy = resolved.lookAt.y - currentPosition.y;
    const dz = resolved.lookAt.z - currentPosition.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0;

    const inv = distance !== 0 ? 1 / distance : 0;

    const direction = {
        x: dx * inv,
        y: dy * inv,
        z: dz * inv
    };

    // Derive yaw/pitch from direction (−Z forward convention)
    const yaw = Math.atan2(direction.x, -direction.z);
    const pitch = Math.asin(-direction.y);

    const finalRotation = {
        ...currentRotation,
        yaw,
        pitch
    };

        return {
            ...resolved,
            effects: dynamic.effects ?? [],
            position: currentPosition,
            rotation: finalRotation,
            distance,
            direction,
            lookAt: resolved.lookAt // preserved — never rebuilt
        };
    }

    /**
     * Phase: The Frame Loop (Effects)
     * Using parent's applyEffects logic.
     */
    apply(
        resolved: ResolvedProjection,
        state: SceneState,
        resolutionPool: Record<string, ResolvedProjection> = {} as Record<string, ResolvedProjection>
    ): ResolvedProjection {
        return this.applyEffects(resolved, resolved.effects, state, resolutionPool);
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