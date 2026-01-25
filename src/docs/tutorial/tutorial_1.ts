import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";


export function tutorial_1(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler> {
    let graphicProcessor: P5GraphicProcessor;
    let world: World<P5Bundler>;

    // 1. Scene Orchestration (5s rotating loop)
    const activeManager = config.manager ?? new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {
            ...DEFAULT_SETTINGS.playback,
            duration: 5000,
            isLoop: true
        }
    });

    // 2. Asset Pipeline
    // We create the loader here to pass it to the World/Stage
    const loader = new P5AssetLoader(p);

    // 3. World Initialization
    world = new World<P5Bundler>(activeManager, loader);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);

        // 4. Bridge Initialization
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // 5. PHASE 1: REGISTRATION
        // Using the "Extreme Typed" addBox method (no manual toProps/casting)
        world.addBox('box', {
            type: ELEMENT_TYPES.BOX,
            size: 100,
            
            // Dynamic Rotation: Continuous rotation
            rotate: (state: SceneState) => ({
                x: -0.25 * Math.PI,
                y: 0.25 * Math.PI + Math.PI * 2 * state.playback.progress,
                z: 0
            }),
            
            position: {x: 0, y: 0, z: 0},
            fillColor: {red: 100, green: 100, blue: 255},
            strokeColor: {red: 255, green: 255, blue: 255},
        });
    };

    p.draw = () => {
        if (config.paused && !activeManager.isPaused()) activeManager.pause();
        if (!config.paused && activeManager.isPaused()) activeManager.resume();

        p.background(20);
        world.step(graphicProcessor);
    };
    return world;
}