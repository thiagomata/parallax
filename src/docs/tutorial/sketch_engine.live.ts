import { transform } from 'sucrase';
import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { ElementResolver } from "../../scene/resolver/element_resolver.ts";
import { P5AssetLoader } from "../../scene/p5/p5_asset_loader.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { 
    ASSET_STATUS,
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES,
    PROJECTION_TYPES,
    STANDARD_PROJECTION_IDS,
    LOOK_MODES,
} from "../../scene/types.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { OrbitModifier } from "../../scene/modifiers/orbit_modifier.ts";
import { CenterFocusModifier } from "../../scene/modifiers/center_focus_modifier.ts";
import { CenterOrbit } from "../../scene/presets.ts";
import { LookAtEffect } from "../../scene/effects/look_at_effect.ts";
import { TransformEffect } from "../../scene/effects/transform_effect.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import { HEAD_TRACKED_PRESET } from "../../scene/presets.ts";
import { COLORS } from "../../scene/colors.ts";
import { DEFAULT_SKETCH_CONFIG, type P5Sketch } from "./sketch_engine.types.ts";

/**
 * ARCHITECTURAL EXPOSURE
 * We bind the engine classes to window so the transpiled code can find them.
 */
Object.assign(window, {
    p5,
    World,
    WorldSettings,
    SceneClock: SceneClock,
    CenterFocusModifier: CenterFocusModifier,
    P5AssetLoader,
    P5GraphicProcessor,
    OrbitModifier,
    LookAtEffect,
    TransformEffect,
    ELEMENT_TYPES,
    PROJECTION_TYPES,
    STANDARD_PROJECTION_IDS,
    LOOK_MODES,
    DEFAULT_SETTINGS: DEFAULT_SCENE_SETTINGS,
    ASSET_STATUS,
    DEFAULT_SKETCH_CONFIG,
    DEFAULT_SCENE_SETTINGS,
    resolver: new ElementResolver({}),
    CenterOrbit,
    HEAD_TRACKED_PRESET,
    HeadTrackingDataProvider,
    HeadTrackingModifier,
    COLORS,
});

const moduleExports: Record<string, Record<string, unknown>> = {
    'types': {
        DEFAULT_SCENE_SETTINGS: DEFAULT_SCENE_SETTINGS,
        DEFAULT_SETTINGS: DEFAULT_SCENE_SETTINGS,
        ELEMENT_TYPES: ELEMENT_TYPES,
        PROJECTION_TYPES: PROJECTION_TYPES,
        STANDARD_PROJECTION_IDS: STANDARD_PROJECTION_IDS,
        LOOK_MODES: LOOK_MODES,
        ASSET_STATUS: ASSET_STATUS,
        WindowConfig: undefined,
        ResolutionContext: undefined,
        Vector3: undefined,
    },
    'world': {
        World: (window as Window & typeof globalThis & { World: typeof World }).World,
    },
    'world_settings': {
        WorldSettings: (window as Window & typeof globalThis & { WorldSettings: typeof WorldSettings }).WorldSettings,
    },
    'scene_clock': {
        SceneClock: (window as Window & typeof globalThis & { SceneClock: typeof SceneClock }).SceneClock,
    },
    'p5_asset_loader': {
        P5AssetLoader: (window as Window & typeof globalThis & { P5AssetLoader: typeof P5AssetLoader }).P5AssetLoader,
        P5Bundler: undefined,
    },
    'p5_graphic_processor': {
        P5GraphicProcessor: (window as Window & typeof globalThis & { P5GraphicProcessor: typeof P5GraphicProcessor }).P5GraphicProcessor,
    },
    'presets': {
        CenterOrbit: (window as Window & typeof globalThis & { CenterOrbit: typeof CenterOrbit }).CenterOrbit,
        HEAD_TRACKED_PRESET: (window as Window & typeof globalThis & { HEAD_TRACKED_PRESET: typeof HEAD_TRACKED_PRESET }).HEAD_TRACKED_PRESET,
    },
    'sketch_config': {
        DEFAULT_SKETCH_CONFIG: (window as Window & typeof globalThis & { DEFAULT_SKETCH_CONFIG: typeof DEFAULT_SKETCH_CONFIG }).DEFAULT_SKETCH_CONFIG,
        SketchConfig: undefined,
    },
    'orbit_modifier': {
        OrbitModifier: (window as Window & typeof globalThis & { OrbitModifier: typeof OrbitModifier }).OrbitModifier,
    },
    'center_focus_modifier': {
        CenterFocusModifier: (window as Window & typeof globalThis & { CenterFocusModifier: typeof CenterFocusModifier }).CenterFocusModifier,
    },
    'center_foucs_modifier': {
        CenterFocusModifier: (window as Window & typeof globalThis & { CenterFocusModifier: typeof CenterFocusModifier }).CenterFocusModifier,
    },
    'look_at_effect': {
        LookAtEffect: (window as Window & typeof globalThis & { LookAtEffect: typeof LookAtEffect }).LookAtEffect,
    },
    'transform_effect': {
        TransformEffect: (window as Window & typeof globalThis & { TransformEffect: typeof TransformEffect }).TransformEffect,
    },
    'head_tracking_data_provider': {
        HeadTrackingDataProvider: (window as Window & typeof globalThis & { HeadTrackingDataProvider: typeof HeadTrackingDataProvider }).HeadTrackingDataProvider,
    },
    'head_tracking_modifier': {
        HeadTrackingModifier: (window as Window & typeof globalThis & { HeadTrackingModifier: typeof HeadTrackingModifier }).HeadTrackingModifier,
    },
    'colors': {
        COLORS: (window as Window & typeof globalThis & { COLORS: typeof COLORS }).COLORS,
    },
    'p5': {
        default: (window as Window & typeof globalThis & { p5: typeof p5 }).p5,
    },
};

export function getModule(path: string): Record<string, unknown> {
    const baseName = path.split('/').pop()!
        .replace('.ts', '')
        .replace(/_ts$/, '');
    
    let result = moduleExports[baseName];
    
    if (!result) {
        const lowerName = baseName.toLowerCase();
        for (const key of Object.keys(moduleExports)) {
            if (key.toLowerCase() === lowerName) {
                result = moduleExports[key];
                break;
            }
        }
    }
    
    if (!result) {
        console.warn(`Module not found: ${path} (tried ${baseName})`);
        return { default: undefined };
    }
    
    return { default: result, ...result };
}

export function extractSketchFunction(code: string): { fn: P5Sketch; fnName: string } {
    const compiledCode = transform(code, { transforms: ['typescript', 'imports'] }).code;

    let fnMatch = code.match(/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/);
    
    if (!fnMatch) {
        fnMatch = compiledCode.match(/module\.exports\.[a-zA-Z0-9_]+/);
        if (fnMatch) {
            fnMatch = fnMatch[0].match(/module\.exports\.([a-zA-Z0-9_]+)/);
        }
    }
    
    if (!fnMatch) throw new Error('No exported function found.');

    const factory = new Function('require', 'exports', compiledCode);
    const fakeExports: Record<string, unknown> = {};
    factory(getModule, fakeExports);
    
    const fnName = fnMatch[1];
    const sketchFn = fnName.startsWith('module.exports.') 
        ? fakeExports 
        : fakeExports[fnName];
    
    if (typeof sketchFn !== 'function') {
        throw new Error(`'${fnName}' is not a function`);
    }
    
    return { fn: sketchFn as P5Sketch, fnName };
}
