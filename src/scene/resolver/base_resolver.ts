import {
    type DynamicProperty,
    type FlexibleSpec,
    type ResolutionContext,
    SPEC_KINDS, type Unwrapped
} from "../types.ts";

/**
 * BaseResolver
 * * Centralizes the Recursive Resolution Engine and Property Compilation.
 * Follows the Architectural Manifest: Single Source of Truth & Type Respect.
 */
export abstract class BaseResolver<
    TLib extends Record<string, any>,
    // TResolutionGroup extends { type: string, bundle: any, settings?: any },
    TResolutionGroup extends {
        type: string,
        bundle: {
            defaults: any,
            apply(
                current: TResolved,
                context: ResolutionContext,
                settings: any,
                resolutionPool: Record<string, TResolved>
            ): TResolved;
        },
        settings?: any
    },
    TResolved = unknown,
>{
    protected readonly effectLib: TLib;

    /**
     * Properties that must remain static (IDs, Assets, Types, Modifiers).
     * This prevents the engine from attempting to wrap them as DynamicProperties.
     */
    protected abstract readonly staticKeys: string[];

    protected constructor(effectLib: TLib) {
        this.effectLib = effectLib;
    }

    /**
     * Converts a Blueprint into a Dynamic structure by selectively
     * compiling properties based on the staticKeys registry.
     */
    public toDynamic<B extends object, D>(blueprint: B): D {
        const dynamic = {} as any; // Internal construction cast only

        for (const key in blueprint) {
            if (Object.prototype.hasOwnProperty.call(blueprint, key)) {
                const value = (blueprint as any)[key];

                if (this.staticKeys.includes(key)) {
                    // We wrap it so loopResolve knows it's a leaf node
                    dynamic[key] = value;
                } else {
                    // compileProperty already returns a DynamicProperty
                    dynamic[key] = this.compileProperty(value);
                }
            }
        }

        return dynamic as D;
    }

    /**
     * Prepares the resolution groups for behaviors/effects.
     */
    protected abstract bundleBehaviors(instructions?: any[]): TResolutionGroup[];

    /**
     * Resolves a property tree recursively.
     * The return type is Unwrapped<T>, representing the raw data after
     * all computations and branches are flattened.
     */
    loopResolve<T>(
        src: T,
        context: ResolutionContext,
        resolutionPool: Record<string, TResolved> = {} as Record<string, TResolved>
    ): Unwrapped<T> {
        // 1. Handle the DynamicProperty Container
        if (this.isDynamicProperty(src)) {
            switch (src.kind) {
                case SPEC_KINDS.STATIC:
                    return src.value as Unwrapped<T>;
                case SPEC_KINDS.BRANCH:
                    return this.loopResolve(src.value, context, resolutionPool) as Unwrapped<T>;
                case SPEC_KINDS.COMPUTED:
                    return this.loopResolve(src.compute(context, resolutionPool), context, resolutionPool) as Unwrapped<T>;
            }
        }

        // 2. Handle Objects (Branches in the tree)
        if (src && typeof src === 'object' && !Array.isArray(src)) {
            const result: any = {};
            for (const key in src) {
                if (Object.prototype.hasOwnProperty.call(src, key)) {
                    if (this.staticKeys.includes(key)) {
                        result[key] = src[key];
                    } else {
                        result[key] = this.loopResolve(src[key], context, resolutionPool);
                    }
                }
            }
            return result as Unwrapped<T>;
        }

        // 3. Leaf/Primitive identity
        return src as Unwrapped<T>;
    }

    /**
     * Compiles a value or function into a DynamicProperty.
     */
    public compileProperty<V>(value: FlexibleSpec<V> | V): DynamicProperty<V, TResolved> {
        // Function -> Computed
        if (typeof value === 'function') {
            return {
                kind: SPEC_KINDS.COMPUTED,
                compute: value as (context: ResolutionContext, pool: Record<string, TResolved>) => V
            };
        }

        // Objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Check if the object is "Pure Data" (like a Vector3) to avoid Static Inception
            if (this.isStaticData(value)) {
                return { kind: SPEC_KINDS.STATIC, value: value as V };
            }

            // Recursive compilation for branches
            const dynamicBranch: any = {};
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    dynamicBranch[key] = this.compileProperty((value as any)[key]);
                }
            }

            return { kind: SPEC_KINDS.BRANCH, value: dynamicBranch };
        }

        // Primitives
        return { kind: SPEC_KINDS.STATIC, value: value as V };
    }

    /**
     * Checks if an object contains only static primitives.
     */
    protected isStaticData(val: any): boolean {
        if (typeof val === 'function') return false;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            return Object.values(val).every((v) => this.isStaticData(v));
        }
        return true;
    }

    /**
     * Internal Type Guard
     */
    protected isDynamicProperty<T>(obj: unknown): obj is DynamicProperty<T> {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            'kind' in obj &&
            Object.values(SPEC_KINDS).includes((obj as any).kind)
        );
    }

    /**
     * Shared Execution Loop for Effects/Behaviors.
     * Takes a resolved object and runs its attached effects library sequentially.
     */
    protected applyEffects<TInput extends TResolved>(
        resolved: TInput,
        effects: ReadonlyArray<TResolutionGroup> | undefined,
        context: ResolutionContext,
    ): TInput {
        if (!effects || effects.length === 0) return resolved;

        let result: TResolved = { ...resolved };
        const resolutionPool: Record<string, TResolved> = {};

        for (const group of effects) {
            const settings = group.settings ?? {enabled: true};
            if (settings.enabled !== false) {
                result = group.bundle.apply(result, context, settings, resolutionPool);
            }
        }

        return result as TInput;
    }
}