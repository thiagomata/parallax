import {
    type ResolvedBaseVisual, type ResolutionContext, type EffectBundle, type BaseModifierSettings,
    ALL_ELEMENT_TYPES
} from "../types.ts";

// Config that accepts a transform function
export interface TransformEffectConfig extends BaseModifierSettings {
    transform: (item: ResolvedBaseVisual, context: ResolutionContext) => ResolvedBaseVisual;
}

// The EffectBundle
export const TransformEffect: EffectBundle<
    'transform',
    TransformEffectConfig,
    ResolvedBaseVisual
> = {
    type: 'transform',
    targets: ALL_ELEMENT_TYPES,
    defaults: {
        transform: (item: ResolvedBaseVisual) => item,
    },
    apply(
        current,
        context,
        settings,
        _
    ) {
        return settings.transform(current, context);
    },
};