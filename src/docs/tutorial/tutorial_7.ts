import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneManager } from "../../scene/scene_manager.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts"; // Our new class
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import { DEFAULT_SETTINGS, ELEMENT_TYPES } from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";

/**
 * TUTORIAL 7: THE OBSERVER
 * Demonstrating 1:1 head-to-camera mapping using MediaPipe.
 */
export function tutorial_7(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any> {
    let gp: P5GraphicProcessor;

    // Create the manager
    const activeManager = config.manager ?? new SceneManager({
        ...DEFAULT_SETTINGS,
        debug: false
    });

    // Camera Logic: Use injected or create default
    const headTracker = config.cameraModifier ?? new HeadTrackingModifier(p);

    activeManager.addCarModifier(headTracker);
    activeManager.addNudgeModifier(headTracker);
    activeManager.addStickModifier(headTracker);

    // Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const world = new World<P5Bundler, any>(activeManager, loader);

    headTracker.init().catch(console.error);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);

        // REGISTRATION
        // We create a deep corridor of spheres to test the Z-depth and X/Y parallax
        for (let z = 200; z > -2000; z -= 200) {
            for (let x = -500; x <= 500; x += 200) {
                const id = `sphere-${x}-${z}`;
                world.addSphere(id, {
                    type: ELEMENT_TYPES.SPHERE,
                    radius: 20,
                    position: { x, y: 50, z },
                    fillColor: {
                        red: p.map(z, 0, -2000, 255, 50),
                        green: 100,
                        blue: 255
                    }
                });
            }
        }

        world.addBox(`cube-middle`, {
            type: ELEMENT_TYPES.BOX,
            position: { x: 0, y: -30, z: -300 },
            width: 30,
            fillColor: { red: 30, green: 30, blue: 235 },
            strokeColor: { red: 230, green: 230, blue: 235 }
        });

        // // Add a floating cubes to make the headtracking projection easier to be noticed
        for (let z = 600; z > -600; z -= 60) {
            world.addBox(`cube-${z}`, {
                type: ELEMENT_TYPES.BOX,
                position: { x: z, y: -100, z: -600 },
                width: 10,
                depth: 10,
                height: 600,
                fillColor: { red: 100, green: 100, blue: 100 },
                strokeColor: { red: 255, green: 255, blue: 235 }
            });
        }
    };

    p.draw = () => {
        p.background(10);

        /* frame loop */
        // World.step calls Manager.update, which triggers our headTracker.tick()
        // and then resolves the camera state based on our face position.
        world.step(gp);
    };

    return world;
}