import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import { DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES } from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";
import {WorldSettings} from "../../scene/world_settings.ts";

/**
 * TUTORIAL 7: THE OBSERVER
 * Demonstrating 1:1 head-to-camera mapping using MediaPipe.
 * Simplified version with simple colored boxes for easy debugging.
 */
export function tutorial_7(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let gp: P5GraphicProcessor;

    // Create the clock
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        debug: false
    });

    // Camera Logic: Use injected or create default
    const headTracker = config.cameraModifier ?? new HeadTrackingModifier(p);

    // Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );
    
    // Wide FOV to see more of the scene
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 2);

    // Apply head tracking to screen position (moves the "window" we're looking through)
    world.setScreen({
        modifiers: {
            carModifiers: [headTracker]
        }
    });

    // Apply head tracking to eye (adds parallax/rotation)
    world.setEye({
        modifiers: {
            nudgeModifiers: [headTracker],
            stickModifiers: [headTracker]
        }
    });

    headTracker.init().catch(console.error);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);

        // Boxes at different Z depths for parallax effect
        // Closer = more floating out effect
        // z positive = in front of camera, z negative = behind
        
        // Closest (z = 50) - should appear to float out
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'close-right',
            position: { x: 100, y: 0, z: 50 },
            width: 30,
            fillColor: { red: 255, green: 0, blue: 0 },    // Red
        });
        
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'close-center',
            position: { x: 0, y: 0, z: 50 },
            width: 30,
            fillColor: { red: 0, green: 255, blue: 0 },  // Green
        });
        
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'close-left',
            position: { x: -100, y: 0, z: 50 },
            width: 30,
            fillColor: { red: 0, green: 0, blue: 255 },  // Blue
        });

        // Middle (z = -100)
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'mid-right',
            position: { x: 100, y: 0, z: -100 },
            width: 30,
            fillColor: { red: 255, green: 255, blue: 0 }, // Yellow
        });
        
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'mid-center',
            position: { x: 0, y: 0, z: -100 },
            width: 30,
            fillColor: { red: 255, green: 0, blue: 255 }, // Magenta
        });
        
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'mid-left',
            position: { x: -100, y: 0, z: -100 },
            width: 30,
            fillColor: { red: 0, green: 255, blue: 255 }, // Cyan
        });

        // Far (z = -300)
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'far-right',
            position: { x: 100, y: 0, z: -300 },
            width: 30,
            fillColor: { red: 255, green: 128, blue: 0 }, // Orange
        });
        
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'far-center',
            position: { x: 0, y: 0, z: -300 },
            width: 30,
            fillColor: { red: 128, green: 0, blue: 255 }, // Purple
        });
        
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'far-left',
            position: { x: -100, y: 0, z: -300 },
            width: 30,
            fillColor: { red: 255, green: 255, blue: 255 }, // White
        });
    };

    p.draw = () => {
        if (config.paused && !clock.isPaused()) clock.pause();
        if (!config.paused && clock.isPaused()) clock.resume();

        p.background(20);

        /* frame loop */
        world.step(gp);
    };

    return world;
}
