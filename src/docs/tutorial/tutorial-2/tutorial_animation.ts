import p5 from 'p5';
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../../scene/types.ts";
import {World} from "../../../scene/world.ts";
import {P5GraphicProcessor} from "../../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "../sketch_config.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";
import {TransformEffect, type TransformEffectConfig} from "../../../scene/effects/transform_effect.ts";

/**
 * TUTORIAL: Animation Over Time
 * 
 * Animate element properties using the playback timeline.
 */
export const animation_explanation = `
<div class="concept">
<p>The parallax engine includes a built-in <strong>playback timeline</strong> that loops over a configurable duration. Properties can be <em>dynamic functions</em> that receive the current playback state and return computed values. This enables smooth, synchronized animations without manual timing.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>SceneClock</strong> - The clock manages the playback timeline. Configure it with <code>duration</code> (in ms) and <code>isLoop</code> to create repeating animations.</li>
<li><strong>ResolutionContext</strong> - Every dynamic property receives a context object containing <code>playback.progress</code>, a value from 0 to 1 representing position in the timeline.</li>
<li><strong>Property Functions</strong> - Instead of static values, pass functions that compute properties each frame. Use sine/cosine waves for smooth oscillation.</li>
<li><strong>Effects</strong> - Effects run after transformations, allowing you to modify computed properties based on other values (like inverting colors dynamically).</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">SceneClock</span>
<span class="key-term">ResolutionContext</span>
<span class="key-term">Playback Progress</span>
<span class="key-term">Effect</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1">Adding Elements</a>
<a href="#tutorial-3">Orbital Motion</a>
<a href="#tutorial-6">Dynamic Properties</a>
</div>
`;

export function tutorial_animation(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;

    // Scene Orchestration with a custom 5s loop
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 5000,
            isLoop: true,
        }
    });

    // Asset Pipeline & World
    const loader = config.loader ?? new P5AssetLoader(p);
    graphicProcessor = new P5GraphicProcessor(p, loader);

    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader, elementEffectLib: {
                [TransformEffect.type]: TransformEffect
        }})
    );
    world.enableDefaultPerspective(config.width, config.height);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);

        // Registration
        // We use the blueprint functions to define effect over time
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'pulsing-box',
            position: {x: 0, y: 0, z: 0},

            // Dynamic Size: Pulse between 50 and 150
            width: (context: ResolutionContext) => {
                return 100 + Math.sin(context.playback.progress * Math.PI * 2) * 50;
            },

            // Dynamic Rotation: Full 360 degree spin per loop
            rotate: (context: ResolutionContext) => ({
                pitch: 0,
                yaw: Math.PI * 2 * context.playback.progress,
                roll: Math.PI * 2 * context.playback.progress,
            }),

            // Dynamic Color: Shift blue channel based on progress
            fillColor: {
                red: 255,
                green: 100,
                blue: (context: ResolutionContext) => {
                    return 127 + 127 * Math.cos(Math.PI * 2 * context.playback.progress);
                },
                alpha: 1.0
            },
            strokeWidth: 5,
            // effects run after all transformations just before the rendering, allowing us to interact with computed info
            effects: [
                {
                    type: TransformEffect.type,
                    settings: {
                        transform: (element, _) => {
                            // in this case, we are using the computed fill color to define the stroke color
                            return {
                                ...element,
                                strokeColor: {
                                    red:   255 - (element.fillColor?.red   ?? 0),
                                    green: 255 - (element.fillColor?.green ?? 0),
                                    blue:  255 - (element.fillColor?.blue  ?? 0),
                                    alpha: 1.0
                                }
                            }
                        }
                    }  as TransformEffectConfig
                }
            ]
        });
    };

    p.draw = () => {
        if (config.paused && !clock.isPaused()) clock.pause();
        if (!config.paused && clock.isPaused()) clock.resume();

        p.background(20);
        world.step(graphicProcessor);
    };

    return world;
}