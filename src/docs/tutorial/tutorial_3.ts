import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState, type Vector3} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";

export function tutorial_3(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any> {
    let graphicProcessor: P5GraphicProcessor;

    // Scene Orchestration (5s circular loop)
    const activeManager = config.manager ?? new SceneManager({
        ...DEFAULT_SETTINGS,
        startPaused: config.paused,
        playback: {
            ...DEFAULT_SETTINGS.playback,
            duration: 5000,
            isLoop: true
        }
    });

    // Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const world = new World<P5Bundler, any>(activeManager, loader);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // REGISTRATION
        // Defining the Orbit as a function of the Engine Progress
        world.addBox('orbit-box', {
            type: ELEMENT_TYPES.BOX,
            width: 50,

            // Orbital Position Logic: x = cos(t), y = sin(t)
            position: (state: SceneState): Vector3 => ({
                x: Math.cos(state.playback.progress * Math.PI * 2) * 50,
                y: Math.sin(state.playback.progress * Math.PI * 2) * 50,
                z: -100
            }),

            // Rotation can also follow the orbit path
            rotate: (state: SceneState): Vector3 => ({
                x: state.playback.progress * Math.PI,
                y: state.playback.progress * Math.PI * 2,
                z: 0,
            }),

            fillColor: {red: 0, green: 255, blue: 150, alpha: 1.0},
            strokeColor: {red: 0, green: 0, blue: 255}
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