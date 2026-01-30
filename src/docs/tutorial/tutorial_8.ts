import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";

/**
 * TUTORIAL 8: THE BILLBOARD
 * Demonstrating billboard elements that always face the camera.
 */
export function tutorial_8(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler> {
    let graphicProcessor: P5GraphicProcessor;
    let world: World<P5Bundler>;

    // 1. Scene Orchestration
    const activeManager = config.manager ?? new SceneManager(DEFAULT_SETTINGS);

    // 2. Camera Logic: Adding orbit to showcase billboard effect
    activeManager.addCarModifier(new OrbitModifier(p, 800));
    activeManager.addStickModifier(new CenterFocusModifier());

    // 2. Asset Pipeline
    const loader = new P5AssetLoader(p);

    // 3. World Initialization
    world = new World<P5Bundler>(activeManager, loader);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);

        // 4. Graphic Processor Initialization
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // 5. REGISTRATION
        
        // Add reference objects to show camera movement
        world.addBox('reference-cube', {
            type: ELEMENT_TYPES.BOX,
            size: 50,
            position: {x: -150, y: 0, z: 0},
            fillColor: {red: 100, green: 100, blue: 255},
            strokeColor: {red: 255, green: 255, blue: 255},
        });

        world.addSphere('reference-sphere', {
            type: ELEMENT_TYPES.SPHERE,
            radius: 30,
            position: {x: 150, y: 0, z: 0},
            fillColor: {red: 255, green: 100, blue: 100},
        });

        // Full billboard - always faces camera completely
        world.addBillboard('full-billboard', {
            type: ELEMENT_TYPES.BILLBOARD,
            width: 80,
            height: 80,
            position: {x: 0, y: -100, z: 100},
            fillColor: {red: 100, green: 255, blue: 100},
            strokeColor: {red: 255, green: 255, blue: 255},
        });

        // Y-axis locked billboard - only follows camera pitch
        world.addBillboard('y-locked-billboard', {
            type: ELEMENT_TYPES.BILLBOARD,
            width: 60,
            height: 60,
            position: {x: 0, y: 0, z: -100},
            fillColor: {red: 255, green: 255, blue: 100},
            strokeColor: {red: 255, green: 255, blue: 255},
            lockRotation: { y: true } // Lock Y-axis rotation
        });

        // X and Y locked billboard - only follows camera roll
        world.addBillboard('xy-locked-billboard', {
            type: ELEMENT_TYPES.BILLBOARD,
            width: 40,
            height: 40,
            position: {x: 0, y: 100, z: 50},
            fillColor: {red: 255, green: 100, blue: 255},
            strokeColor: {red: 255, green: 255, blue: 255},
            lockRotation: { x: true, y: true } // Lock X and Y-axis rotation
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