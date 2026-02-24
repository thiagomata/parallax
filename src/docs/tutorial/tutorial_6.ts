import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../scene/types.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {World} from "../../scene/world.ts";
import p5 from "p5";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";
import {WorldSettings} from "../../scene/world_settings.ts";

export function tutorial_6(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;
    const clock = config.manager ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: {...DEFAULT_SCENE_SETTINGS.playback, duration: 5000, isLoop: true}
    });

    const loader = config.loader ?? new P5AssetLoader(p);
    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );

    p.setup = async () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // Just one static floor to check coordinate space
        world.addFloor({
            type: ELEMENT_TYPES.FLOOR,
            id: 'floor',
            width: 500,
            depth: 500,
            position: {x: 0, y: 100, z: 0},
            fillColor: {red: 100, green: 100, blue: 100},
            texture: {
                path: '/parallax/img/stars.jpg',
                width: 100,
                height: 100,
            },
        });

        // The Hero: Testing Hybrid Props (Atomic Position + Granular Color)
        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: 'hero-sphere',
            position: (context: ResolutionContext) => ({
                x: Math.sin(context.playback.progress * Math.PI * 2) * 100,
                y: 0,
                z: -200
            }),
            radius: 40,
            fillColor: {
                red: 255,
                green: 150,
                blue: (context: ResolutionContext) => 127 + 127 * Math.sin(context.playback.progress * Math.PI * 2)
            }
        });
    };

    p.draw = () => {
        if (config.paused && !clock.isPaused()) clock.pause();
        if (!config.paused && clock.isPaused()) clock.resume();

        p.background(15);
        world.step(graphicProcessor);
    };
    return world;
}