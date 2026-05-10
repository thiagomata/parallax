import"../../colors-BrCD1jrD.js";import"../../tutorial.template-Dr9HL9hP.js";import{d as e,t}from"../../tutorial_depth_map-DyWdxFcf.js";import{i as o,a as s}from"../../tutorial_nav-Cg9FdBg2.js";const r=`import p5 from 'p5';
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../../scene/types.ts";
import {World} from "../../../scene/world.ts";
import {P5GraphicProcessor} from "../../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig, type P5SketchExtraArgs} from "../sketch_engine.types.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";
import {COLORS} from "../../../scene/colors.ts";
import {appAssetPath} from "../../../utils/app_paths.ts";
// import {CenterOrbit, SIMPLE_PRESET} from "../../../scene/presets.ts";

const SKULL_TEXTURE_PATH = appAssetPath("img/depth/skull.jpg");
const SKULL_DEPTH_MAP_PATH = appAssetPath("img/depth/skull-depth.png");
const ROBOTO_FONT_PATH = appAssetPath("fonts/Roboto-Regular.ttf");

/**
 * TUTORIAL: Depth Map Panels
 *
 * Use an image as a height field for panel geometry.
 */
export const depth_map_explanation = \`
<div class="concept">
<p><strong>Depth maps</strong> turn image brightness into geometry. A panel can use one image as its visible <code>texture</code> and a second image as its <code>depthMap</code>, so the rendered surface follows the depth implied by the artwork.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Pair Texture and Depth</strong> - Add a visible <code>texture</code> and a matching <code>depthMap</code>. Both load through the same asset pipeline.</li>
<li><strong>Set Mesh Resolution</strong> - <code>segments</code> (inside the <code>depthMap</code> object) controls how finely the panel is subdivided. More segments reveal more image detail.</li>
<li><strong>Shape the Relief</strong> - <code>strength</code> controls Z displacement, while <code>midpoint</code> chooses which brightness value stays flat.</li>
<li><strong>Combine With Motion</strong> - Rotate the panel slowly so the raised and recessed areas are visible from different angles.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">depthMap</span>
<span class="key-term">Height Field</span>
<span class="key-term">Mesh Segments</span>
<span class="key-term">Displacement</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-5">Loading Textures</a>
<a href="#tutorial-9">3D Parallax Depth</a>
</div>
\`;

export async function tutorial_depth_map(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: P5SketchExtraArgs
): Promise<World<P5Bundler, any, any>> {
    let graphicProcessor: P5GraphicProcessor;

    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 7000,
            isLoop: true,
        },
    });

    const loader = new P5AssetLoader(p);
    graphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);
    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );

    world.startLoading();
    // world.loadPreset(CenterOrbit(p, {}));
    // world.loadPreset(SIMPLE_PRESET);
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 4, true);

    if (config.paused) {
        world.pause();
    }

    world.addPanel({
        type: ELEMENT_TYPES.PANEL,
        id: 'skull-depth-panel',
        width: 240,
        height: 360,
        position: {x: 0, y: -10, z: -120},
        rotate: (context: ResolutionContext) => ({
            pitch: -0.12 * Math.PI,
            yaw: -0.3 + Math.sin(context.playback.progress * Math.PI * 2) * 0.6,
            roll: 0,
        }),
        depthMap: {
            sampleMode: 'max',
            path: SKULL_DEPTH_MAP_PATH,
            width: 256,
            height: 256,
            strength: 150,
            segments: 44,
            midpoint: 0,
            invert: false,
        },
        texture: {
            path: SKULL_TEXTURE_PATH,
            width: 512,
            height: 512,
        },
        strokeColor: COLORS.white,
        strokeWidth: 0,
    });
    //
    // world.addPanel({
    //     type: ELEMENT_TYPES.PANEL,
    //     id: 'depth-map-backdrop',
    //     width: 300,
    //     height: 420,
    //     position: {x: 0, y: -10, z: -170},
    //     fillColor: {red: 10, green: 15, blue: 22, alpha: 0.72},
    //     strokeWidth: 0,
    // });

    world.addText({
        type: ELEMENT_TYPES.TEXT,
        id: 'depth-map-label',
        text: "DEPTH MAP PANEL",
        size: 22,
        position: {x: 0, y: 170, z: -80},
        font: {
            name: 'Roboto',
            path: ROBOTO_FONT_PATH,
        },
        fillColor: COLORS.cyan,
    });

    world.complete();

    p.setup = async () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        if (!extraArgs?.graphicProcessor) {
            graphicProcessor = new P5GraphicProcessor(p, loader);
        }

        await loader.waitForAllAssets();
    };

    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }

        p.background(8);
        const result = await world.step(graphicProcessor);
        if (!result.running) return;
    };

    return world;
}
`;o("tutorial-11","11. Depth Map Panels",t,r,e);s();
//# sourceMappingURL=tutorial-11-D4dSdrUy.js.map
