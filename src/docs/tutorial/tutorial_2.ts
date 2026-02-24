import p5 from 'p5';
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../scene/types.ts";
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";
import {WorldSettings} from "../../scene/world_settings.ts";

export function tutorial_2(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;

    // Scene Orchestration with a custom 5s loop
    const clock = config.manager ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 5000,
            isLoop: true
        }
    });

    // Asset Pipeline & World
    const loader = config.loader ?? new P5AssetLoader(p);
    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );

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
            width: (context: ResolutionContext) => {
                return 100 + Math.sin(context.playback.progress * Math.PI * 2) * 50;
            },

            // Dynamic Rotation: Full 360 degree spin per loop
            rotate: (context: ResolutionContext) => ({
                x: 0,
                y: Math.PI * 2 * context.playback.progress,
                z: Math.PI * 2 * context.playback.progress,
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
            strokeWidth: 1,
            strokeColor: (ctx) => {
                const previousMe = ctx.previousResolved?.elements.get('pulsing-box');
                if (!previousMe || !previousMe.fillColor) return {red: 0, green: 0, blue: 0, alpha: 1.0};
                return {
                    red:   255 - previousMe.fillColor.red,
                    green: 255 - previousMe.fillColor.green,
                    blue:  255 - previousMe.fillColor.blue,
                    alpha: 1.0
                }
            },
            effects: [

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