import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "../tutorial/sketch_config.ts";
import {WorldSettings} from "../../scene/world_settings.ts";
import {CenterOrbit} from "../../scene/presets.ts";
import {appAssetPath} from "../../utils/app_paths.ts";

/**
 * HERO EXAMPLE: First Steps
 * 
 * A tour of different element types with orbital camera.
 */
export const heroExample1_explanation = `
<div class="concept">
<p>This demo showcases various 3D element types available in the parallax engine, with a camera that orbits around the scene center.</p>
</div>

<h3>Key Features</h3>
<ul>
<li><strong>Element Types</strong> - Pyramids, cylinders, cones, tori, elliptical, and text</li>
<li><strong>Presets</strong> - Using <code>CenterOrbit</code> for automatic camera movement</li>
<li><strong>Dynamic Properties</strong> - Rotation based on playback timeline</li>
</ul>
`;

export function heroExample1(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;

    // Scene Orchestration
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 10000,
            isLoop: true
        }
    });

    // Asset Pipeline & World
    const loader = config.loader ?? new P5AssetLoader(p);
    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );

    world.loadPreset(CenterOrbit(p, {radius: 500}));
    world.enableDefaultPerspective(config.width, config.height);
    world.complete();

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // Shape Registration
        world.addPyramid({
            id: 'back-pyramid',
            type: ELEMENT_TYPES.PYRAMID,
            baseSize: 200,
            height: 150,
            position: { x: -100, y: 0, z: -200 },
            fillColor: { red: 0, green: 255, blue: 0, alpha: 1.0 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addCylinder({
            id: 'mid-cylinder',
            type: ELEMENT_TYPES.CYLINDER,
            radius: 10,
            height: 100,
            rotate: (ctx: ResolutionContext) => ({
                pitch: 0,
                yaw: ctx.playback.progress * 2 * Math.PI,
                roll: ctx.playback.progress * 2 * Math.PI,
            }),
            position: {
                x: -100,
                y: -100,
                z: 0
            },
            fillColor: { red: 255, green: 0, blue: 0, alpha: 0.5 },
            strokeColor: { red: 255, green: 255, blue: 255 },
            strokeWidth: 1,
        });

        world.addCone({
            id: 'front-cone',
            type: ELEMENT_TYPES.CONE,
            radius: 60,
            height: 120,
            position: { x: 100, y: 0, z: 200 },
            fillColor: { red: 0, green: 0, blue: 255, alpha: 1.0 },
            strokeColor: { red: 255, green: 255, blue: 255 },
            strokeWidth: 1,
        });

        world.addTorus({
            id: 'ring-torus',
            type: ELEMENT_TYPES.TORUS,
            radius: 80,
            tubeRadius: 20,
            position: { x: 0, y: 50, z: -50 },
            fillColor: { red: 255, green: 255, blue: 0, alpha: 0.8 },
            strokeColor: { red: 0, green: 0, blue: 0 }
        });

        world.addElliptical({
            id: 'egg-elliptical',
            type: ELEMENT_TYPES.ELLIPTICAL,
            rx: 50,
            ry: 30,
            rz: 70,
            position: { x: -50, y: 50, z: 50 },
            fillColor: { red: 255, green: 0, blue: 255, alpha: 0.6 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addText({
            id: 'title-text',
            type: ELEMENT_TYPES.TEXT,
            text: "PARALLAX",
            size: 40,
            position: { x: 50, y: 100, z: 0 },
            font: {
                name: 'Roboto',
                path: appAssetPath("fonts/Roboto-Regular.ttf")
            },
            fillColor: { red: 255, green: 0, blue: 255 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });
    };

    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }

        p.background(15);
        await world.step(graphicProcessor);
    };

    return world;
}
