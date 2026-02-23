import type { FailableResult, ResolutionContext, StickModifier, StickResult, Vector3, StickRotationLimits } from './types';

export interface CompositeStickConfig {
    strategy: 'sum' | 'weighted_average';
    weights?: number[];
    limits?: StickRotationLimits;
    distanceStrategy?: 'average' | 'min' | 'max';
}

/**
 * Combines multiple StickModifier results additively.
 * 
 * Use cases:
 * - Traditional input + head tracking enrichment
 * - Multiple rotation sources working together
 * - Animation + optional head tracking
 * 
 * Examples:
 * ```typescript
 * // Gamepad + head tracking (80/20 split)
 * const composite = new CompositeStick(50, [
 *     gamepadStickModifier,
 *     headTrackingModifier
 * ], {
 *     strategy: 'weighted_average',
 *     weights: [0.8, 0.2]
 * });
 * 
 * // Animation + head enrichment
 * const cinematic = new CompositeStick(50, [
 *     animationStickModifier,
 *     headTrackingModifier
 * ], {
 *     strategy: 'weighted_average',
 *     weights: [0.9, 0.1]
 * });
 * ```
 */
export class CompositeStick implements StickModifier {
    public readonly priority: number;
    public readonly name: string;
    public readonly sources: StickModifier[];
    public readonly config: CompositeStickConfig;

    constructor(
        priority: number,
        sources: StickModifier[],
        config: CompositeStickConfig = { strategy: 'sum' }
    ) {
        this.priority = priority;
        this.sources = sources;
        this.config = config;
        this.name = `CompositeStick(${sources.map(m => m.name).join("+")})`;
    }

    active = true;

    tick(sceneId: number): void {
        for (const source of this.sources) {
            source.tick(sceneId);
        }
    }

    getStick(finalPos: Vector3, context: ResolutionContext): FailableResult<StickResult> {
        const activeResults: Array<{ result: StickResult; weight: number }> = [];
        
        // Collect all successful stick results
        for (let i = 0; i < this.sources.length; i++) {
            const source = this.sources[i];
            if (!source.active) continue;
            
            const sourceResult = source.getStick(finalPos, context);
            if (sourceResult.success) {
                const weight = this.config.weights?.[i] ?? 1.0;
                activeResults.push({ 
                    result: sourceResult.value, 
                    weight 
                });
            }
        }
        
        if (activeResults.length === 0) {
            return { 
                success: false, 
                error: "No active stick sources in " + this.name 
            };
        }

        // Apply combination strategy
        const combined = this.combineResults(activeResults);
        
        // Apply rotation limits if specified
        let limitedCombined = combined;
        if (this.config.limits) {
            limitedCombined = {
                ...combined,
                yaw: Math.max(this.config.limits.yaw.min, 
                             Math.min(this.config.limits.yaw.max, combined.yaw)),
                pitch: Math.max(this.config.limits.pitch.min, 
                              Math.min(this.config.limits.pitch.max, combined.pitch)),
                roll: Math.max(this.config.limits.roll.min, 
                             Math.min(this.config.limits.roll.max, combined.roll))
            };
        }

        return { success: true, value: limitedCombined };
    }

    private combineResults(activeResults: Array<{ result: StickResult; weight: number }>): StickResult {
        const strategy = this.config.strategy;
        
        let yaw: number;
        let pitch: number;
        let roll: number;
        let distance: number;

        if (strategy === 'sum') {
            // Simple sum of all rotations
            yaw = activeResults.reduce((sum, { result }) => sum + result.yaw, 0);
            pitch = activeResults.reduce((sum, { result }) => sum + result.pitch, 0);
            roll = activeResults.reduce((sum, { result }) => sum + result.roll, 0);
        } else if (strategy === 'weighted_average') {
            // Weighted average of all rotations
            const totalWeight = activeResults.reduce((sum, { weight }) => sum + weight, 0);
            yaw = activeResults.reduce((sum, { result, weight }) => sum + result.yaw * weight, 0) / totalWeight;
            pitch = activeResults.reduce((sum, { result, weight }) => sum + result.pitch * weight, 0) / totalWeight;
            roll = activeResults.reduce((sum, { result, weight }) => sum + result.roll * weight, 0) / totalWeight;
        } else {
            // Fallback to simple sum for unknown strategies
            yaw = activeResults.reduce((sum, { result }) => sum + result.yaw, 0);
            pitch = activeResults.reduce((sum, { result }) => sum + result.pitch, 0);
            roll = activeResults.reduce((sum, { result }) => sum + result.roll, 0);
        }

        // Handle distance based on distanceStrategy
        const distanceStrategy = this.config.distanceStrategy ?? 'average';
        if (distanceStrategy === 'average') {
            const totalWeight = activeResults.reduce((sum, { weight }) => sum + weight, 0);
            distance = activeResults.reduce((sum, { result, weight }) => sum + result.distance * weight, 0) / totalWeight;
        } else if (distanceStrategy === 'min') {
            distance = Math.min(...activeResults.map(({ result }) => result.distance));
        } else if (distanceStrategy === 'max') {
            distance = Math.max(...activeResults.map(({ result }) => result.distance));
        } else {
            distance = activeResults[0].result.distance; // Fallback
        }

        return {
            yaw,
            pitch,
            roll,
            distance,
            priority: this.priority
        };
    }
}