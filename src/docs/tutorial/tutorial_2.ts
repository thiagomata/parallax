import p5 from 'p5';
import {DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState} from "../../scene/types.ts";
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";

export function tutorial_2(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;

    // Scene Orchestration with a custom 5s loop
    const activeManager = config.manager ?? new SceneClock({
        ...DEFAULT_SETTINGS,
        startPaused: config.paused,
        playback: {
            ...DEFAULT_SETTINGS.playback,
            duration: 5000,
            isLoop: true
        }
    });

    // Asset Pipeline & World
    const loader = config.loader ?? new P5AssetLoader(p);
    const world = new World<P5Bundler, any, any>(activeManager, loader);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // Registration
        // We use the blueprint functions to define effect over time
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'pulsing-box',
            position: {x: 0, y: 0, z: 0},

            // Dynamic Size: Pulse between 50 and 150
            width: (state: SceneState) => {
                return 100 + Math.sin(state.playback.progress * Math.PI * 2) * 50;
            },

            // Dynamic Rotation: Full 360 degree spin per loop
            rotate: (state: SceneState) => ({
                x: 0,
                y: Math.PI * 2 * state.playback.progress,
                z: Math.PI * 2 * state.playback.progress,
            }),

            // Dynamic Color: Shift blue channel based on progress
            fillColor: {
                red: 255,
                green: 100,
                blue: (state: SceneState) => {
                    return 127 + 127 * Math.cos(Math.PI * 2 * state.playback.progress);
                },
                alpha: 1.0
            },
            strokeColor: {red: 0, green: 0, blue: 0, alpha: 1.0},
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