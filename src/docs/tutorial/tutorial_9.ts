import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {ELEMENT_TYPES} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";
import {Stage} from "../../scene/stage.ts";
import {LookAtEffect} from "../../scene/effects/look_at_effect.ts";
import {DEFAULT_EFFECTS} from "../../scene/effects/effects.ts";



/**
 * TUTORIAL 9: LOOK AT THE OBJECT
 * Demonstrating how to make one object look to the other
 */
export function tutorial_9(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, typeof DEFAULT_EFFECTS> {
    let graphicProcessor: P5GraphicProcessor;
    let world: World<P5Bundler, any>;

    // Scene Orchestration
    const activeManager = config.manager ?? new SceneManager(
        {
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
        world.addBox('obj', {
            type: ELEMENT_TYPES.BOX,
            width: 50,
            position: (currentState) => {
                document.title = JSON.stringify( currentState.camera.position);
                const circularProgress = currentState.playback.progress * 4 * Math.PI;

                const radius = 200;
                // Exactly the same math as the dummy
                const x = Math.sin(circularProgress) * radius;
                const z = Math.cos(circularProgress) * radius;
                const y = 100 + Math.sin(circularProgress * 0.5) * 100;
                return {
                    x: x,
                    y: y,
                    z: z,
                };
            },
            rotate: {
                x: 0,
                y: 0,
                z: 0,
            },
            fillColor: {red: 255, green: 0, blue: 0,},
            strokeColor: {red: 255, green: 255, blue: 255},
        });

        world.addBox('look-to-obj', {
            type: ELEMENT_TYPES.BOX,
            width: 50,
            position: {x: 100, y: 100, z: 100},
            fillColor: {red: 0, green: 255, blue: 0,},
            strokeColor: {red: 255, green: 255, blue: 255},
            effects: [
                {
                    type: 'look_at',
                    settings: {
                        lookAt: 'obj',
                        axis: {
                            x: true,
                            y: true,
                            z: true,
                        },
                    }
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