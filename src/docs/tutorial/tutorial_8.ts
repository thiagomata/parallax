import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SETTINGS, ELEMENT_TYPES} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";
import {Stage} from "../../scene/stage.ts";
import {LookAtEffect} from "../../scene/effects/look_at_effect.ts";
import {DEFAULT_EFFECTS} from "../../scene/effects/effects.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";

/**
 * TUTORIAL 8: THE BILLBOARD
 * Demonstrating billboard elements that always face the camera.
 */
export function tutorial_8(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, typeof DEFAULT_EFFECTS> {
    let graphicProcessor: P5GraphicProcessor;
    let world: World<P5Bundler, any>;

    // Scene Orchestration
    const activeManager = config.manager ?? new SceneManager(
        {
            ...DEFAULT_SETTINGS,
            startPaused: config.paused,
            camera: {
                lookAt: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                position: {
                    x: 0,
                    y: 0,
                    z: 500,
                }
            }
        }
    );

    // Camera Logic: Adding orbit to showcase billboard effect
    activeManager.addCarModifier(new OrbitModifier(p, 800));
    activeManager.addStickModifier(new CenterFocusModifier());

    // Asset Pipeline
    const loader = new P5AssetLoader(p);

    const effects = {
        'look_at': LookAtEffect,
    };

    const stage = new Stage<P5Bundler, typeof effects>(loader, effects);

    // World Initialization
    world = new World<P5Bundler, any>(activeManager, loader, stage);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);

        // Graphic Processor Initialization
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // REGISTRATION
        
        // Add reference objects to show camera movement
        world.addBox('reference-cube', {
            type: ELEMENT_TYPES.BOX,
            width: 50,
            position: {x: 150, y: 0, z: 0},
            fillColor: {red: 100, green: 100, blue: 255},
            strokeColor: {red: 255, green: 255, blue: 255},
        });

        world.addPanel('ref-panel', {
            type: ELEMENT_TYPES.PANEL,
            position: {x: 50, y: 0, z: 0},
            fillColor: {red: 100, green: 100, blue: 255},
            strokeColor: {red: 255, green: 255, blue: 255},
            width: 50,
            height: 50,
        });

        world.addBox('billboard-cube', {
            type: ELEMENT_TYPES.BOX,
            width: 50,
            position: {x: -150, y: 0, z: 0},
            fillColor: {red: 100, green: 100, blue: 255},
            strokeColor: {red: 255, green: 255, blue: 255},
            effects: [
                {
                    type: 'look_at',
                }
            ],
            rotate: {
                y: Math.PI,
                x: Math.PI / 2,
                z: Math.PI / 4,
            }
        });

        world.addPanel('billboard-panel', {
            type: ELEMENT_TYPES.PANEL,
            width: 50,
            height: 50,
            position: {x: -50, y: 0, z: 0},
            fillColor: {red: 100, green: 100, blue: 255},
            strokeColor: {red: 255, green: 255, blue: 255},
            effects: [
                {
                    type: 'look_at',
                }
            ]
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