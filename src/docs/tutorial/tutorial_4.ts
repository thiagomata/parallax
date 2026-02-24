import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";
import {WorldSettings} from "../../scene/world_settings.ts";

Object.assign(window, {
    OrbitModifier,
    CenterFocusModifier,
});

export function tutorial_4(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
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

    world.setScreen(
        {
            modifiers: {
                carModifiers: [
                    new OrbitModifier(p, 800, -400),
                ],
                stickModifiers: [
                    new CenterFocusModifier()
                ]
            }
        }
    );
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