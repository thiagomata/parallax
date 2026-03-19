import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./sketch_config.ts";
import {WorldSettings} from "../../scene/world_settings.ts";
import {CenterOrbit} from "../../scene/presets.ts";

Object.assign(window, {
    OrbitModifier,
    CenterFocusModifier,
});

/**
 * TUTORIAL: Camera Control
 * 
 * Use modifiers to control camera movement and focus.
 */
export const camera_control_explanation = `
<div class="concept">
<p><strong>Modifiers</strong> are components that alter how the camera or projection behaves. They can orbit the camera around a point, focus on specific objects, or respond to head tracking data. Modifiers chain together to create complex camera behaviors.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Presets</strong> - The engine includes camera presets like <code>CenterOrbit</code> that set up common camera movements with sensible defaults.</li>
<li><strong>Load Preset</strong> - Call <code>world.loadPreset(CenterOrbit(p, {...}))</code> to apply a preset modifier to the camera.</li>
<li><strong>Modifier Chain</strong> - Presets typically compose multiple modifiers: orbit the camera position, focus on center, apply perspective projection.</li>
<li><strong>Parameters</strong> - Configure presets with parameters like <code>radius</code> (orbit distance) and <code>verticalBaseline</code> (camera height).</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Modifier</span>
<span class="key-term">Preset</span>
<span class="key-term">Camera</span>
<span class="key-term">Orbit</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1">Adding Elements</a>
<a href="#tutorial-9">Real-Time Camera Control</a>
</div>
`;

export function tutorial_camera_control(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;

    // Scene Orchestration
    const clock = config.clock ?? new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            startPaused: config.paused
        });

    // Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );

    world.loadPreset(CenterOrbit(p,{radius: 500}))
    // world.loadPreset(CenterOrbit(p,{radius: 500, eyeScreenDistance: 10}))
    world.enableDefaultPerspective(config.width, config.height);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // REGISTRATION
        // Creating a "Gallery" of boxes to visualize the camera orbit
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                world.addBox({
                    type: ELEMENT_TYPES.BOX,
                    id: `box-${i}-${j}`,
                    width: 40,
                    position: {x: (i - 2) * 100, y: 0, z: 200 - j * 100},
                    fillColor: {
                        red: i * 50,
                        green: 255 - (i * 50),
                        blue: 200
                    }
                });
            }
        }
    };

    p.draw = () => {
        if (config.paused && !clock.isPaused()) clock.pause();
        if (!config.paused && clock.isPaused()) clock.resume();

        p.background(20);
        world.step(graphicProcessor);
    };

    return world;
}
