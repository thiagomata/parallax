import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";
import {WorldSettings} from "../../scene/world_settings.ts";


export function tutorial_1(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;
    let world: World<P5Bundler, any, any>;

    // Scene Orchestration (5s rotating loop)
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 5000,
            isLoop: true
        }
    });

    // Asset Pipeline
    // We create the loader here to pass it to the World/Stage
    const loader = new P5AssetLoader(p);

    // World Initialization
    world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );

    // Enable default off-axis perspective projection
    // This uses calculateOffAxisMatrix which was previously unused
    // Call this to verify the custom projection pipeline works
    world.enableDefaultPerspective(config.width, config.height);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);

        // Graphic Processor Initialization
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // REGISTRATION
        // Using the "Extreme Typed" addBox method (no manual toProps/casting)
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'box',
            width: 100,
            
            // Dynamic Rotation: Continuous rotation
            rotate: (context: ResolutionContext) => ({
                x: -0.25 * Math.PI,
                y: 0.25 * Math.PI + Math.PI * 2 * context.playback.progress,
                z: 0
            }),
            
            position: {x: 0, y: 0, z: 0},
            fillColor: {red: 100, green: 100, blue: 255},
            strokeColor: {red: 255, green: 255, blue: 255},
            strokeWidth: 1,
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