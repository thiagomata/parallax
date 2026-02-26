import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, LOOK_MODES, PROJECTION_TYPES} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";
import {WorldSettings} from "../../scene/world_settings.ts";

/**
 * TUTORIAL 7: THE OBSERVER
 * Demonstrating 1:1 head-to-camera mapping using MediaPipe.
 * Simplified version with simple colored boxes for easy debugging.
 */
export function tutorial_7(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }> {
    let gp: P5GraphicProcessor;

    // Create the clock
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        debug: false
    });

    // Camera Logic: Use injected or create default
    const headTracker = config.cameraModifier ?? new HeadTrackingModifier(p);

    // Data Provider for face elements
    const faceDataProvider = new HeadTrackingDataProvider(p, 150, 150, 150, true);

    // Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const dataProviderLib: { headTracker: HeadTrackingDataProvider } = { headTracker: faceDataProvider };
    const world = new World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }>(
        WorldSettings.fromLibs({clock, loader, dataProviderLib})
    );

    // Wide FOV to see more of the scene
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 2);

    // Set eye very close to fill screen with 90 degree FOV
    world.setEye({
        id: 'eye',
        type: PROJECTION_TYPES.EYE,
        lookMode: LOOK_MODES.LOOK_AT,
        position: { x: 0, y: 0, z: 100 },
        lookAt: { x: 0, y: 0, z: 0 },
    });

    // // Apply head tracking to screen position (moves the "window" we're looking through)
    // world.setScreen({
    //     id: 'screen',
    //     type: PROJECTION_TYPES.SCREEN,
    //     lookMode: LOOK_MODES.LOOK_AT,
    //     modifiers: {
    //         carModifiers: [headTracker]
    //     }
    // });
    //
    // // Apply head tracking to eye (adds parallax/rotation)
    // world.setEye({
    //     id: 'eye',
    //     type: PROJECTION_TYPES.EYE,
    //     lookMode: LOOK_MODES.ROTATION,
    //     modifiers: {
    //         nudgeModifiers: [headTracker],
    //         stickModifiers: [headTracker]
    //     }
    // });

    headTracker.init().catch(console.error);

    p.setup = async () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        
        await faceDataProvider.init();
        
        gp = new P5GraphicProcessor(p, loader);

        // Boxes at different Z depths for parallax effect
        // Closer = more floating out effect
        // z positive = in front of camera, z negative = behind

        // Closest (z = 50) - should appear to float out
        // world.addBox({
        //     type: ELEMENT_TYPES.BOX,
        //     id: 'close-right',
        //     position: { x: 100, y: 0, z: 50 },
        //     width: 30,
        //     fillColor: { red: 255, green: 0, blue: 0 },    // Red
        // });
        //
        // world.addBox({
        //     type: ELEMENT_TYPES.BOX,
        //     id: 'close-center',
        //     position: { x: 0, y: 0, z: 50 },
        //     width: 30,
        //     fillColor: { red: 0, green: 255, blue: 0 },  // Green
        // });
        //
        // world.addBox({
        //     type: ELEMENT_TYPES.BOX,
        //     id: 'close-left',
        //     position: { x: -100, y: 0, z: 50 },
        //     width: 30,
        //     fillColor: { red: 0, green: 0, blue: 255 },  // Blue
        // });
        //
        // // Middle (z = -100)
        // world.addBox({
        //     type: ELEMENT_TYPES.BOX,
        //     id: 'mid-right',
        //     position: { x: 100, y: 0, z: -100 },
        //     width: 30,
        //     fillColor: { red: 255, green: 255, blue: 0 }, // Yellow
        // });
        //
        // world.addBox({
        //     type: ELEMENT_TYPES.BOX,
        //     id: 'mid-center',
        //     position: { x: 0, y: 0, z: -100 },
        //     width: 30,
        //     fillColor: { red: 255, green: 0, blue: 255 }, // Magenta
        // });
        //
        // world.addBox({
        //     type: ELEMENT_TYPES.BOX,
        //     id: 'mid-left',
        //     position: { x: -100, y: 0, z: -100 },
        //     width: 30,
        //     fillColor: { red: 0, green: 255, blue: 255 }, // Cyan
        // });
        //
        // // Far (z = -300)
        // world.addBox({
        //     type: ELEMENT_TYPES.BOX,
        //     id: 'far-right',
        //     position: { x: 100, y: 0, z: -300 },
        //     width: 30,
        //     fillColor: { red: 255, green: 128, blue: 0 }, // Orange
        // });
        //
        // world.addBox({
        //     type: ELEMENT_TYPES.BOX,
        //     id: 'far-center',
        //     position: { x: 0, y: 0, z: -300 },
        //     width: 30,
        //     fillColor: { red: 128, green: 0, blue: 255 }, // Purple
        // });
        //
        // world.addBox({
        //     type: ELEMENT_TYPES.BOX,
        //     id: 'far-left',
        //     position: { x: -100, y: 0, z: -300 },
        //     width: 30,
        //     fillColor: { red: 255, green: 255, blue: 255 }, // White
        // });

        // Face tracking elements - spheres for eyes and nose
        // Position them closer to camera (-50) so they pop out from the box
        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: 'nose',
            radius: 30,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: -50 };
                return { x: face.nose.x, y: face.nose.y, z: face.nose.z - 50 };
            },
            fillColor: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                return face ? { red: 0, green: 255, blue: 0 } : { red: 100, green: 100, blue: 100 };
            },
        });

        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: 'leftEye',
            radius: 40,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: -30, y: 0, z: -50 };
                return { x: face.leftEye.x, y: face.leftEye.y, z: face.leftEye.z - 50 };
            },
            fillColor: { red: 255, green: 0, blue: 0 },
        });

        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: 'rightEye',
            radius: 40,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 30, y: 0, z: -50 };
                return { x: face.rightEye.x, y: face.rightEye.y, z: face.rightEye.z - 50 };
            },
            fillColor: { red: 0, green: 0, blue: 255 },
        });

        // Full face box
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'faceBox',
            width: 150,
            height: 180,
            depth: 100,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: 0 };
                return { 
                    x: face.midpoint.x * 3, 
                    y: face.midpoint.y * 3, 
                    z: face.midpoint.z 
                };
            },
            rotate: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: 0 };
                return {
                    y: face.stick.yaw,
                    x: face.stick.pitch * -7 - 2.8,
                    z: -face.stick.roll,
                };
            },

            strokeColor: { red: 255, green: 255, blue: 255 },
            strokeWidth: 2,
        });

        // Video panel - use exact video dimensions
        const videoEl = faceDataProvider.getVideo();
        world.addPanel({
            type: ELEMENT_TYPES.PANEL,
            id: 'videoPanel',
            width: 640,
            height: 480,
            position: { x: 0, y: 0, z: 0 },
            video: videoEl,
            fillColor: videoEl ? undefined : { red: 50, green: 50, blue: 50 },
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
