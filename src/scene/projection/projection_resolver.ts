import {
    type BlueprintProjection, DEFAULT_PROJECTION_ELEMENT,
    type DynamicProjection,
    type ProjectionEffectBlueprint,
    type ProjectionEffectLib,
    type ProjectionEffectResolutionGroup,
    type ProjectionType,
    type ResolvedProjection,
    type ResolvedSceneState,
    type ResolutionContext,
    type DynamicSceneState,
    type Vector3, LOOK_MODES,
} from "../types.ts";
import {BaseResolver} from "../resolver/base_resolver.ts";
import {ProjectionAssetRegistry} from "../registry/projection_asset_registry.ts";
import {HierarchyTools, type HierarchySource} from "../utils/hierarchy.ts";
import {rotateVector} from "../utils/projection_utils.ts";

export class ProjectionResolver<
    TProjectionEffectLib extends ProjectionEffectLib,
> extends BaseResolver<TProjectionEffectLib, ProjectionEffectResolutionGroup, ResolvedProjection> {

    /**
     * Static Sanctuary:
     * We protect IDs and the Modifier lists from being wrapped as dynamic.
     */
    protected readonly staticKeys = [
        "id", "type", "parentId", "effects", "modifiers"
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
            { ...DEFAULT_PROJECTION_ELEMENT, ...blueprint} as Partial<BlueprintProjection>
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
        const source: HierarchySource<{ id: string; parentId?: string }> = {
            get: (id: string) => {
                if (id === blueprint.id) {
                    return { id: blueprint.id, parentId: blueprint.parentId };
                }

                const parent = registry.get(id);
                return parent ? { id: parent.id, parentId: parent.parentId } : undefined;
            },
            all: function* () {
                yield { id: blueprint.id, parentId: blueprint.parentId };
                for (const parent of registry.all()) {
                    yield { id: parent.id, parentId: parent.parentId };
                }
            },
        };

        const hierarchy = new HierarchyTools(source);
        try {
            hierarchy.validate(blueprint);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            if (message.includes('Self-Reference: Node')) {
                throw new Error(`Self-Reference: Projection "${blueprint.id}" cannot target itself.`);
            }

            if (message.includes('not found')) {
                throw new Error(
                    `Hierarchy Violation: Parent "${blueprint.parentId}" not found. ` +
                    `Parent must be registered before their followers.`
                );
            }

            if (message.includes('recursive reference')) {
                throw new Error(
                    `Hierarchy Violation: Parent "${blueprint.parentId}" has recursive reference.`
                );
            }

            throw error;
        }
    }

    /**
     * The Frame Loop (Resolution + Math Stack)
     */
    resolve(
        dynamic: DynamicProjection,
        state: DynamicSceneState,
        projectionPool: Record<string, ResolvedProjection> = {},
        dataProviders: Record<string, unknown> = {}
    ): ResolvedProjection {

        const resolutionContext: ResolutionContext = {
            previousResolved: state.previousResolved,
            playback: state.playback,
            settings: state.settings,
            projectionPool,
            elementPool: {},
            dataProviders,
            previousStore: { global: {} },
            nextStore: { global: {} },
            element: {},
        };

        // Resolve Dynamic Properties (local space)
        const resolved = this.loopResolve(dynamic, resolutionContext);

        const modifierContext: ResolutionContext = {
            previousResolved: state.previousResolved,
            playback: state.playback,
            settings: state.settings,
            projectionPool,
            elementPool: {},
            dataProviders,
            previousStore: { global: {} },
            nextStore: { global: {} },
            element: {},
        };

        // Apply Modifiers in Local Space
        let currentPosition = { ...resolved.position };
        let currentRotation = { ...resolved.rotation };

        // Car Modifiers
        for (const carModifier of dynamic.modifiers?.carModifiers ?? []) {
            const res = carModifier.getCarPosition(currentPosition, modifierContext);
            if (res.success) {
                currentPosition = res.value.position;
                if (res.value.rotation) {
                    currentRotation = res.value.rotation;
                }
                break;
            }
        }

        // Nudge Modifiers (Averaging/Voting)
        const votes = { x: [] as number[], y: [] as number[], z: [] as number[] };
        for (const nudgeModifier of dynamic.modifiers?.nudgeModifiers ?? []) {
            const res = nudgeModifier.getNudge(currentPosition, modifierContext);
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

        // Compute global position for modifiers that need it (like CenterFocus)
        let globalPosition = { ...currentPosition };

        // Update global position after car/nudge modifiers
        if (resolved.parentId) {
            const parentResolved = projectionPool[resolved.parentId];
            if (parentResolved) {
                globalPosition = {
                    x: parentResolved.position.x + currentPosition.x,
                    y: parentResolved.position.y + currentPosition.y,
                    z: parentResolved.position.z + currentPosition.z,
                };
            } else {
                globalPosition = { ...currentPosition };
            }
        } else {
            globalPosition = { ...currentPosition };
        }

    // Stick Modifiers (rotation adjustments allowed, but lookAt remains authority)
        let stickRotation = { pitch: 0, yaw: 0, roll: 0 };
        for (const stickModifier of dynamic.modifiers?.stickModifiers ?? []) {
            const res = stickModifier.getStick(globalPosition, modifierContext);
            if (res.success) {
                stickRotation = {
                    pitch: res.value.pitch,
                    yaw: res.value.yaw,
                    roll: res.value.roll,
                };
                break;
            }
        }

    // ==========================================================
    // HANDLE LOOK MODE
    // ==========================================================
    
        const lookMode = dynamic.lookMode ?? LOOK_MODES.LOOK_AT;
        let distance: number;
        let direction: Vector3;
        let finalLookAt: Vector3;
        let finalRotation = currentRotation;
        
        if (lookMode === LOOK_MODES.ROTATION) {
            // rotation mode: compute lookAt from position + rotation + distance
            // Get distance from stick modifier or use default
            const stickDistance = dynamic.modifiers?.stickModifiers?.[0]?.getStick(currentPosition, modifierContext);
            distance = stickDistance?.success ? stickDistance.value.distance : 1000;

            // Compute direction from rotation angles
            const cosY = Math.cos(currentRotation.yaw);
            const sinY = Math.sin(currentRotation.yaw);
            const cosP = Math.cos(currentRotation.pitch);
            const sinP = Math.sin(currentRotation.pitch);

            // Default direction: -Z forward
            let dirX = 0;
            let dirY = 0;
            let dirZ = -1;
            
            // Apply yaw (Y rotation)
            const x1 = dirX * cosY - dirZ * sinY;
            const z1 = dirX * sinY + dirZ * cosY;
            
            // Apply pitch (X rotation)
            const y2 = dirY * cosP - z1 * sinP;
            const z2 = dirY * sinP + z1 * cosP;
            
            direction = { x: x1, y: y2, z: z2 };
            
            // Normalize
            const len = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
            if (len > 0) {
                direction = { x: direction.x / len, y: direction.y / len, z: direction.z / len };
            }
            
            // Calculate lookAt from position + direction * distance
            finalLookAt = {
                x: currentPosition.x + direction.x * distance,
                y: currentPosition.y + direction.y * distance,
                z: currentPosition.z + direction.z * distance,
            };
        } else {
            // lookAt mode (default): compute direction from lookAt position
            const dx = resolved.lookAt.x - currentPosition.x;
            const dy = resolved.lookAt.y - currentPosition.y;
            const dz = resolved.lookAt.z - currentPosition.z;
            
            distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0;
            
            const inv = distance !== 0 ? 1 / distance : 0;
            
            direction = {
                x: dx * inv,
                y: dy * inv,
                z: dz * inv
            };
            
            finalLookAt = resolved.lookAt;
            
            // Apply stick rotation in LOOK_AT mode too
            if (stickRotation.yaw !== 0 || stickRotation.pitch !== 0 || stickRotation.roll !== 0) {
                const cosYS = Math.cos(stickRotation.yaw);
                const sinYS = Math.sin(stickRotation.yaw);
                const cosPS = Math.cos(stickRotation.pitch);
                const sinPS = Math.sin(stickRotation.pitch);
                
                const x1s = direction.x * cosYS - direction.z * sinYS;
                const z1s = direction.x * sinYS + direction.z * cosYS;
                const y2s = direction.y * cosPS - z1s * sinPS;
                const z2s = direction.y * sinPS + z1s * cosPS;
                
                direction = { x: x1s, y: y2s, z: z2s };
                
                const lenS = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
                if (lenS > 0) {
                    direction = { x: direction.x / lenS, y: direction.y / lenS, z: direction.z / lenS };
                }
                
                // Recalculate lookAt with rotated direction
                finalLookAt = {
                    x: currentPosition.x + direction.x * distance,
                    y: currentPosition.y + direction.y * distance,
                    z: currentPosition.z + direction.z * distance,
                };
            }
            
            // In lookAt mode, keep the original rotation for hierarchy transforms.
            // Don't derive new rotation from direction - use what modifiers set.
        }

        // Return LOCAL space resolved projection (hierarchy transform not applied)
        return {
            ...resolved,
            effects: dynamic.effects ?? [],
            position: currentPosition,
            rotation: finalRotation,
            distance,
            direction,
            lookAt: finalLookAt
        };
    }

    /**
     * Pass 2: Apply hierarchy transform to convert local space to global space
     * This runs AFTER all projections are resolved in local space
     */
    applyHierarchyTransform(
        resolved: ResolvedProjection,
        projectionPool: Record<string, ResolvedProjection>,
        previousResolved: ResolvedSceneState | null
    ): ResolvedProjection {
        if (!resolved.parentId) {
            return resolved; // No parent, already in global space
        }

        // Find parent in current frame pool or previous frame
        let target: ResolvedProjection | undefined = projectionPool[resolved.parentId];
        
        if (!target && previousResolved?.projections) {
            target = previousResolved.projections.get(resolved.parentId);
        }

        if (!target) {
            return resolved; // Parent not found, keep local space
        }

        // Apply parent transform: rotate child's local position by parent's rotation, then add parent's position
        const rotatedPosition = rotateVector(resolved.position, target.rotation);

        return {
            ...resolved,
            position: {
                x: rotatedPosition.x + target.position.x,
                y: rotatedPosition.y + target.position.y,
                z: rotatedPosition.z + target.position.z,
            },
            rotation: {
                yaw: resolved.rotation.yaw + target.rotation.yaw,
                pitch: resolved.rotation.pitch + target.rotation.pitch,
                roll: resolved.rotation.roll + target.rotation.roll,
            },
        };
    }

    /**
     * Phase: The Frame Loop (Effects)
     * Using parent's applyEffects logic.
     */
    apply(
        resolved: ResolvedProjection,
        state: DynamicSceneState,
        projectionPool: Record<string, ResolvedProjection>
    ): ResolvedProjection {
        const resolutionContext: ResolutionContext = {
            previousResolved: state.previousResolved,
            playback: state.playback,
            settings: state.settings,
            projectionPool,
            elementPool: {},
            dataProviders: {},
            previousStore: { global: {} },
            nextStore: { global: {} },
            element: {},
        };
        return this.applyEffects(resolved, resolved.effects, resolutionContext);
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
            if (!bundle) {
                // impossible, only to make TS happy
                throw new Error(`Invalid projection effect: ${instruction.type}`);
            }

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

    // private getDistance(base: {
    //     position: Vector3;
    //     rotation: Rotation3;
    //     lookAt: Vector3;
    //     direction: Vector3;
    // }): number {
    //     const dx = base.lookAt.x - base.position.x;
    //     const dy = base.lookAt.y - base.position.y;
    //     const dz = base.lookAt.z - base.position.z;
    //     return Math.sqrt(dx * dx + dy * dy + dz * dz);
    // }
    //
    // private calculateDirection(rot: Rotation3): Vector3 {
    //     const cosP = Math.cos(rot.pitch);
    //     return {
    //         x: (Math.sin(rot.yaw) * cosP) || 0,
    //         y: (-Math.sin(rot.pitch)) || 0,
    //         z: (Math.cos(rot.yaw) * cosP) || 0
    //     };
    // }
}
