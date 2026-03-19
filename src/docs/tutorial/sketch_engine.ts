import { transform } from 'sucrase';
import { World } from "../../scene/world.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { ElementResolver } from "../../scene/resolver/element_resolver.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { 
    ASSET_STATUS,
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES,
    PROJECTION_TYPES,
    STANDARD_PROJECTION_IDS,
    LOOK_MODES,
    type DataProviderLib,
    type EffectLib, 
    type ProjectionEffectLib
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
import p5 from 'p5';

// Global map to store p5 instances by container ID for fullscreen support
const p5Instances: Map<string, p5> = new Map();
const containerElements: Map<string, HTMLElement> = new Map();
const worldInstances: Map<string, World<any, any, any, any>> = new Map();

const isMobileDevice = () => 
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 0;

// Global fullscreen change handler
const handleFullscreenChange = () => {
    const isFullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement
    );
    
    p5Instances.forEach((instance, containerId) => {
        if (!instance) return;
        
        const world = worldInstances.get(containerId);
        const canvasBox = containerElements.get(containerId);
        
        let w: number, h: number;
        
        if (isMobileDevice()) {
            w = visualViewport?.width || window.innerWidth;
            h = visualViewport?.height || window.innerHeight;
        } else if (isFullscreen) {
            w = window.innerWidth;
            h = window.innerHeight;
        } else {
            w = canvasBox?.clientWidth || window.innerWidth;
            h = canvasBox?.clientHeight || window.innerHeight;
        }
        
        if (w > 0 && h > 0) {
            instance.resizeCanvas(w, h, true);
            if (world) {
                (world as any).enableDefaultPerspective(w, h);
            }
            instance.redraw();
        }
    });
};

if (isMobileDevice()) {
    visualViewport?.addEventListener('resize', handleFullscreenChange);
} else {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleFullscreenChange);
}

export function getP5Instance(containerId: string): p5 | undefined {
    return p5Instances.get(containerId);
}

export function setP5Instance(containerId: string, instance: p5 | undefined): void {
    if (instance) {
        p5Instances.set(containerId, instance);
    } else {
        p5Instances.delete(containerId);
    }
}

export function cleanupP5Instance(containerId: string): void {
    const instance = p5Instances.get(containerId);
    if (!instance) return;
    
    try {
        instance.noLoop();
        const canvas = (instance as any)?.canvas;
        if (canvas) {
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (gl) {
                const loseExt = gl.getExtension('WEBGL_lose_context');
                if (loseExt) loseExt.loseContext();
            }
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
        instance.remove();
    } catch (e) {
        console.warn(`[${containerId}] Cleanup error:`, e);
    }
    
    p5Instances.delete(containerId);
    containerElements.delete(containerId);
    worldInstances.delete(containerId);
}

export { DEFAULT_SKETCH_CONFIG };
export type { SketchConfig };
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "./sketch_config.ts";

export type P5SketchExtraArgs = {
    faceConfig?: any;
};

export type P5Sketch = (
    p: p5, 
    config: SketchConfig,
    extraArgs?: P5SketchExtraArgs
) => World<P5Bundler, EffectLib, ProjectionEffectLib, DataProviderLib> 
  | Promise<World<P5Bundler, EffectLib, ProjectionEffectLib, DataProviderLib>>;

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

const moduleExports: Record<string, Record<string, any>> = {
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
        World: (window as any).World,
    },
    'world_settings': {
        WorldSettings: (window as any).WorldSettings,
    },
    'scene_clock': {
        SceneClock: (window as any).SceneClock,
    },
    'p5_asset_loader': {
        P5AssetLoader: (window as any).P5AssetLoader,
        P5Bundler: undefined,
    },
    'p5_graphic_processor': {
        P5GraphicProcessor: (window as any).P5GraphicProcessor,
    },
    'presets': {
        CenterOrbit: (window as any).CenterOrbit,
        HEAD_TRACKED_PRESET: (window as any).HEAD_TRACKED_PRESET,
    },
    'sketch_config': {
        DEFAULT_SKETCH_CONFIG: (window as any).DEFAULT_SKETCH_CONFIG,
        SketchConfig: undefined,
    },
    'orbit_modifier': {
        OrbitModifier: (window as any).OrbitModifier,
    },
    'center_focus_modifier': {
        CenterFocusModifier: (window as any).CenterFocusModifier,
    },
    'center_foucs_modifier': {
        CenterFocusModifier: (window as any).CenterFocusModifier,
    },
    'look_at_effect': {
        LookAtEffect: (window as any).LookAtEffect,
    },
    'transform_effect': {
        TransformEffect: (window as any).TransformEffect,
    },
    'head_tracking_data_provider': {
        HeadTrackingDataProvider: (window as any).HeadTrackingDataProvider,
    },
    'head_tracking_modifier': {
        HeadTrackingModifier: (window as any).HeadTrackingModifier,
    },
    'colors': {
        COLORS: (window as any).COLORS,
    },
    'p5': {
        default: (window as any).p5,
    },
};

export function getModule(path: string): Record<string, any> {
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
    const fakeExports: any = {};
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

export function createSketchInstance(
    sketchFn: P5Sketch,
    sketchConfig: SketchConfig,
    canvasBox: HTMLElement,
    containerId: string,
    previousP5?: p5 | null,
    extraArgs?: P5SketchExtraArgs
): { currentP5: p5 | null; currentWorld: World<any, any, any, any> | null } {
    let currentP5: p5 | null = previousP5 || null;
    let currentWorld: World<any, any, any, any> | null = null;

    const cleanupSketch = () => {
        if (!currentP5) return;
        
        try {
            currentP5.noLoop();
            
            const canvas = (currentP5 as any)?.canvas;
            if (canvas) {
                const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                if (gl) {
                    const loseExt = gl.getExtension('WEBGL_lose_context');
                    if (loseExt) {
                        loseExt.loseContext();
                    }
                }
                // Remove canvas from DOM
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
            }
            
            currentP5.remove();
        } catch (e) {
            console.warn(`[${containerId}] Error during cleanup:`, e);
        }
        
        currentP5 = null;
        currentWorld = null;
    };

    cleanupSketch();
    
    // Remove old instance from global map
    p5Instances.delete(containerId);
    containerElements.delete(containerId);
    worldInstances.delete(containerId);

    let worldReady = false;

    currentP5 = new p5((p: p5) => {
        p.setup = () => {
            if (isMobileDevice()) {
                p.pixelDensity(1);
                p.frameRate(30);
            }
            p.noLoop();
        };

        const worldOrPromise = sketchFn(p, sketchConfig, extraArgs);
        
        const wrapDraw = () => {
            const tutorialDraw = p.draw;
            if (typeof tutorialDraw !== 'function') return;
            
            p.draw = function(this: any, ...args: unknown[]) {
                if (!worldReady) return;
                try {
                    return tutorialDraw.call(this, ...args as []);
                } catch (e) {
                    console.error(`[${containerId}] Error in draw:`, e);
                    p.noLoop();
                }
            };
        };
        
        if (worldOrPromise instanceof Promise) {
            (worldOrPromise as Promise<World<any, any, any, any>>).then((world) => {
                currentWorld = world;
                worldInstances.set(containerId, world);
                worldReady = true;
                wrapDraw();
                p.loop();
            });
        } else {
            currentWorld = worldOrPromise as World<any, any, any, any>;
            worldInstances.set(containerId, currentWorld);
            worldReady = true;
            wrapDraw();
        }
    }, canvasBox);

    // Store instance for fullscreen resize
    p5Instances.set(containerId, currentP5);
    containerElements.set(containerId, canvasBox);

    // Initial resize - use requestAnimationFrame to ensure element is rendered
    const doResize = () => {
        if (currentP5 && !(currentP5 as any)._setupDone) {
            requestAnimationFrame(doResize);
            return;
        }
        if (currentP5) {
            const w = canvasBox.clientWidth;
            const h = canvasBox.clientHeight;
            if (w > 0 && h > 0) {
                currentP5.resizeCanvas(w, h, true);
                sketchConfig.width = w;
                sketchConfig.height = h;
            }
        }
    };
    requestAnimationFrame(doResize);

    return { currentP5, currentWorld };
}
