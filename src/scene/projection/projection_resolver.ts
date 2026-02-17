import {
    type BlueprintProjection,
    DEFAULT_PROJECTION_ELEMENT,
    type DynamicProjection,
    type DynamicProperty,
    type FlexibleSpec, type ProjectionEffectBlueprint, type ProjectionEffectLib, type ProjectionEffectResolutionGroup,
    type ProjectionType, type ResolvedProjection, type Rotation3,
    type SceneState,
    SPEC_KINDS,
    type Vector3
} from "../types.ts";

export class ProjectionResolver<
    TProjectionEffectLib extends ProjectionEffectLib
> {
    private readonly effectLib: TProjectionEffectLib;

    constructor(effectLib: TProjectionEffectLib) {
        this.effectLib = effectLib;
    }

    /**
     * Prepare converts a BlueprintProjection into a DynamicProjection.
     */
    prepare(
        blueprint: Partial<BlueprintProjection> & {id: string, type: ProjectionType}
    ): DynamicProjection {
        return {
            type: blueprint.type,
            id: blueprint.id,
            position:  this.compileProperty(blueprint.position  ?? DEFAULT_PROJECTION_ELEMENT.position),
            rotation:  this.compileProperty(blueprint.rotation  ?? DEFAULT_PROJECTION_ELEMENT.rotation),
            lookAt:    this.compileProperty(blueprint.lookAt    ?? DEFAULT_PROJECTION_ELEMENT.lookAt),
            direction: this.compileProperty(blueprint.direction ?? DEFAULT_PROJECTION_ELEMENT.direction),

            // Sort once during preparation to optimize the resolve loop
            carModifiers:   this.sortMods(blueprint.carModifiers),
            nudgeModifiers: blueprint.nudgeModifiers ?? [],
            stickModifiers: this.sortMods(blueprint.stickModifiers),
            effects: this.bundleBehaviors(blueprint.effects),
        };
    }

    /**
     * Resolves dynamic properties, then runs the modifier stack.
     */
    resolve(dynamic: DynamicProjection, state: SceneState): ResolvedProjection {

        const resolved = this.loopResolve(dynamic, state) as ResolvedProjection;
        const initialDistance = this.getDistance(resolved);

        let currentPosition = { ...resolved.position };

        for (const carModifier of resolved.carModifiers ?? []) {
            const res = carModifier.getCarPosition(currentPosition, state);
            if (res.success) {
                currentPosition = res.value.position;
                break;
            }
        }

        const votes = { x: [] as number[], y: [] as number[], z: [] as number[] };
        for (const nudgeModifier of resolved.nudgeModifiers ?? []) {
            const res = nudgeModifier.getNudge(currentPosition, state);
            if (res.success) {
                const { x, y, z } = res.value;
                if (x !== undefined) votes.x.push(x);
                if (y !== undefined) votes.y.push(y);
                if (z !== undefined) votes.z.push(z);
            }
        }

        const avg = (v: number[]) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
        const votedNudge = {
            x: avg(votes.x),
            y: avg(votes.y),
            z: avg(votes.z),
        };
        currentPosition = {
            x: currentPosition.x + votedNudge.x,
            y: currentPosition.y + votedNudge.y,
            z: currentPosition.z + votedNudge.z,
        }

        // 3. Stick Modifiers (Highest priority winner)
        let currentRotation = { ...resolved.rotation };
        let distanceModifier = 0;

        for (const stickModifier of resolved.stickModifiers ?? []) {
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
     * Step 3: Effects
     * Now strictly operates on the ResolvedProjection using its internal effect list.
     */
    applyEffects(resolved: ResolvedProjection, state: SceneState): ResolvedProjection {
        const effects = resolved.effects;
        if (!effects) return resolved;

        let result = { ...resolved };
        for (const group of effects) {
            if (group.settings?.enabled) {
                // We use the specialized ProjectionEffectLib here
                const effectBundle = this.effectLib[group.type];
                if (effectBundle) {
                    result = effectBundle.apply(result, state, group.settings);
                }
            }
        }
        return result;
    }

    private bundleBehaviors<K extends keyof TProjectionEffectLib & string>(
        instructions?: ProjectionEffectBlueprint<K, any>[]
    ): ProjectionEffectResolutionGroup[] {
        if (!instructions) return [];

        return instructions.map(instruction => {
            const bundle = this.effectLib[instruction.type];

            if (!bundle) {
                // This is now mathematically impossible at compile time if
                // types are set up correctly, but good for runtime safety.
                throw new Error(`Invalid projection effect type: ${instruction.type}`);
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

    private sortMods<T extends { priority: number }>(mods?: T[]): T[] {
        if (!mods) return [];
        return [...mods].sort((a, b) => b.priority - a.priority);
    }

    private getDistance(base: ResolvedProjection): number {
        const dx = base.lookAt.x - base.position.x;
        const dy = base.lookAt.y - base.position.y;
        const dz = base.lookAt.z - base.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // --- Core Resolution Logic (Synced with SceneResolver Pattern) ---

    private isStaticData(val: any): boolean {
        if (typeof val === 'function') return false;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            return Object.values(val).every((v) => this.isStaticData(v));
        }
        return true;
    }

    private compileProperty<V>(value: FlexibleSpec<V>): DynamicProperty<V> {
        if (typeof value === 'function') {
            return { kind: SPEC_KINDS.COMPUTED, compute: value as any };
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Check if the whole object is static (like a Vector3)
            if (this.isStaticData(value)) {
                return { kind: SPEC_KINDS.STATIC, value: value as V };
            }

            // Otherwise, recursively compile its children into a branch
            const branch: any = {};
            for (const key in value) {
                branch[key] = this.compileProperty((value as any)[key]);
            }
            return { kind: SPEC_KINDS.BRANCH, value: branch };
        }
        return { kind: SPEC_KINDS.STATIC, value: value as V };
    }

    private loopResolve<T>(src: any, state: SceneState): T {
        if (this.isDynamicProperty(src)) {
            switch (src.kind) {
                case SPEC_KINDS.STATIC: return src.value as T;
                case SPEC_KINDS.BRANCH: return this.loopResolve(src.value, state);
                case SPEC_KINDS.COMPUTED: return this.loopResolve(src.compute(state), state);
            }
        }

        if (src && typeof src === 'object' && !Array.isArray(src)) {
            const res: any = {};
            for (const key in src) {
                if (Object.prototype.hasOwnProperty.call(src, key)) {
                    res[key] = this.loopResolve(src[key], state);
                }
            }
            return res;
        }
        return src;
    }

    private isDynamicProperty<T>(obj: unknown): obj is DynamicProperty<T> {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            'kind' in obj &&
            Object.values(SPEC_KINDS).includes((obj as any).kind)
        );
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