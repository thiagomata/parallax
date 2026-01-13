import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";

export const tutorial_4 = (p: p5, manager?: SceneManager): World<P5Bundler> => {
    let gp: P5GraphicProcessor;

    // 1. Scene Orchestration
    const activeManager = manager ?? new SceneManager(DEFAULT_SETTINGS);

    // 2. Camera Logic: Adding Modifiers to the SceneManager
    // Note: These affect the SceneState.camera property during calculation
    activeManager.addCarModifier(new OrbitModifier(p, 800));
    activeManager.addStickModifier(new CenterFocusModifier());

    // 3. Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const world = new World<P5Bundler>(activeManager, loader);

    p.setup = () => {
        p.createCanvas(500, 400, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);

        // 4. PHASE 1: REGISTRATION
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
        p.background(20);

        // 5. PHASE 3: THE FRAME LOOP
        // The manager calculates the camera orbit, then the world renders
        world.step(gp);
    };

    return world;
};