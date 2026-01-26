import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";

Object.assign(window, {
    OrbitModifier,
    CenterFocusModifier,
});

export function tutorial_4(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler> {
    let graphicProcessor: P5GraphicProcessor;

    // 1. Scene Orchestration
    const activeManager = config.manager ?? new SceneManager(DEFAULT_SETTINGS);

    // 2. Camera Logic: Adding Modifiers to the SceneManager
    // Note: These affect the SceneState.camera property during calculation
    activeManager.addCarModifier(new OrbitModifier(p, 800));
    activeManager.addStickModifier(new CenterFocusModifier());

    // 3. Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const world = new World<P5Bundler>(activeManager, loader);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // 4. REGISTRATION
        // Creating a "Gallery" of boxes to visualize the camera orbit
        for (let i = 0; i < 5; i++) {
            world.addBox(`box-${i}`, {
                type: ELEMENT_TYPES.BOX,
                size: 40,
                position: {x: (i - 2) * 100, y: 0, z: 0},
                fillColor: {
                    red: i * 50,
                    green: 255 - (i * 50),
                    blue: 200
                }
            });
        }
    };

    p.draw = () => {
        if (config.paused && !activeManager.isPaused()) activeManager.pause();
        if (!config.paused && activeManager.isPaused()) activeManager.resume();

        p.background(20);
        world.step(graphicProcessor);
    };

    return world;
};