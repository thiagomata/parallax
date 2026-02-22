import p5 from 'p5';
import {DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState} from "../../scene/types.ts";
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";

export function tutorial_5(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;

    // Scene Orchestration
    const manager = config.manager ?? new SceneClock({
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
    const world = new World<P5Bundler, any, any>(manager, loader);

    p.setup = async () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // REGISTRATION
        // Hydration starts automatically when the element is added

        // Textured Box
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'textured-box',
            width: 150,
            position: {x: 0, y: 0, z: -100},
            strokeWidth: 0,
            rotate: (state: SceneState) => ({
                x: 0,
                y: Math.PI * 2 * state.playback.progress,
                z: Math.PI * 2 * state.playback.progress,
            }),
            texture: {
                path: '/parallax/img/red.png',
                width: 100,
                height: 100,
            },
        });

        // 3D Text with Custom Font
        world.addText({
            type: ELEMENT_TYPES.TEXT,
            id: 'title',
            text: "TEXTURES",
            size: 30,
            position: {x: -30, y: 0, z: 50},
            font: {
                name: 'Roboto',
                path: '/parallax/fonts/Roboto-Regular.ttf'
            },
            fillColor: {red: 0, green: 229, blue: 255}
        });

        // HYDRATION (Optional Wait)
        // By awaiting this, we ensure the first frame isn't "blank"
        await loader.waitForAllAssets();
    };

    p.draw = () => {
        if (config.paused && !manager.isPaused()) manager.pause();
        if (!config.paused && manager.isPaused()) manager.resume();

        p.background(15);
        world.step(graphicProcessor);
    };

    return world;
}