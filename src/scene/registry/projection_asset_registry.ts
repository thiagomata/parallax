import {
    type BlueprintProjection,
    type DynamicProjection,
    type ProjectionEffectLib
} from "../types.ts";
import {ProjectionResolver} from "../projection/projection_resolver.ts";

export class ProjectionAssetRegistry<
    TProjectionEffectLib extends ProjectionEffectLib> {

    private readonly projections: Map<string, DynamicProjection> = new Map();
    private readonly resolver: ProjectionResolver<TProjectionEffectLib>;

    constructor(resolver?: ProjectionResolver<TProjectionEffectLib>) {
        this.resolver = resolver ?? new ProjectionResolver({} as TProjectionEffectLib);
    }

    public register(
        blueprint: BlueprintProjection
    ): DynamicProjection {
        // Check if we already have this instance
        const existing = this.projections.get(blueprint.id);

        if (existing) {
            // Return the existing Single Source of Truth
            // We cast because the Map stores 'any' to support multiple element types
            return existing;
        }

        // Only create a new one if it doesn't exist
        // This triggers the createRenderable factory
        // exactly once.
        const renderable = this.resolver.prepare(blueprint, this);

        // Store the instance
        this.projections.set(blueprint.id, renderable);

        return renderable;
    }

    public get(id: string): DynamicProjection | undefined {
        return this.projections.get(id);
    }

    public has(id: string): boolean {
        return this.projections.has(id);
    }

    /**
     * For the Frame Loop
     */
    public all(): IterableIterator<DynamicProjection> {
        return this.projections.values();
    }

    public delete(id: string): boolean {
        return this.projections.delete(id);
    }
}