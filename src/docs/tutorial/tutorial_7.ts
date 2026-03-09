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
// import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";

/**
 * TUTORIAL 7: THE OBSERVER
 * Demonstrating 1:1 h ead-to-camera mapping using MediaPipe.
 * Simplified version with simple colored boxes for easy debugging.
 */
export function tutorial_7(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }> {
    let gp: P5GraphicProcessor;

    // Create the clock
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        debug: false,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 10000,
            isLoop: true
        },
    });

    // Camera Logic: Use injected or create default
    const headTracker = config.cameraModifier ?? new HeadTrackingModifier(p);

    // Data Provider for face elements
    const faceDataProvider = new HeadTrackingDataProvider(p);

    // Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const dataProviderLib: { headTracker: HeadTrackingDataProvider } = { headTracker: faceDataProvider };
    const world = new World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }>(
        WorldSettings.fromLibs({clock, loader, dataProviderLib})
    );

    // Wide FOV to see more of the scene
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 2);

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'camera-square',
        width: 50,
        position:  { x:0, y:0, z: 300 },
        fillColor: { red: 255, green: 255, blue: 255 },
        strokeColor: { red: 0, green: 0, blue: 255 },
        strokeWidth: 1,
    });
    world.addCylinder({
        id: 'camera-front',
        type: ELEMENT_TYPES.CYLINDER,
        targetId: 'camera-square',
        radius: 10,
        rotate: {pitch: Math.PI/2, roll: 0, yaw: 0},
        height: 20,
        position:  { x:0, y:0, z: -40 },
        fillColor: { red: 255, green: 255, blue: 255 },
        strokeColor: { red: 0, green: 0, blue: 255 },
        strokeWidth: 1
    });

    // Apply head tracking to screen position (moves the "window" we're looking through)
    world.setScreen({
        id: 'screen',
        type: PROJECTION_TYPES.SCREEN,
        lookMode: LOOK_MODES.ROTATION,
        modifiers: {
            carModifiers: [
                // new OrbitModifier(p, 300, 0),
            ],
            stickModifiers: [
                new CenterFocusModifier()
            ]
        }
    });


    headTracker.init().catch(console.error);

    p.setup = async () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        
        await faceDataProvider.init();
        
        gp = new P5GraphicProcessor(p, loader);


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
                    x: face.midpoint.x,
                    y: face.midpoint.y,
                    z: face.midpoint.z
                };
            },
            rotate: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { pitch: 0, yaw: 0, roll: 0 };
                return {
                    yaw:   face.stick.yaw,
                    pitch: face.stick.pitch,
                    roll:  face.stick.roll,
                };
            },

            // fillColor: { red: 255, green: 255, blue: 255 },
            strokeWidth: 2,
            strokeColor: {red:255, green: 0, blue: 0},
        });

        // Debug boxes for face landmarks
        const boxSize = 15;
        
        // Nose box - red
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'debug_nose',
            targetId: 'faceBox',
            width: boxSize,
            height: boxSize,
            depth: boxSize,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: 0 };
                return face.nose;
            },
            fillColor: { red: 255, green: 0, blue: 0 },
            strokeWidth: 1,
        });

        // Left eye box - green
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'debug_leftEye',
            targetId: 'faceBox',
            width: boxSize,
            height: boxSize,
            depth: boxSize,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: 0 };
                // return face.eyes.left;
                return {
                    x: face.eyes.left.x,
                    y: face.eyes.left.y,
                    z: face.eyes.left.z,
                }
            },
            fillColor: { red: 0, green: 255, blue: 0 },
            strokeWidth: 1,
        });

        // Right eye box - blue
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'debug_rightEye',
            targetId: 'faceBox',
            width: boxSize,
            height: boxSize,
            depth: boxSize,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: 0 };
                return face.eyes.right;
            },
            fillColor: { red: 0, green: 0, blue: 255 },
            strokeWidth: 1,
        });

        // Bounds left box - yellow
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'debug_boundsLeft',
            targetId: 'faceBox',
            width: boxSize,
            height: boxSize,
            depth: boxSize,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: 0 };
                return face.bounds.left;
            },
            fillColor: { red: 255, green: 255, blue: 0 },
            strokeWidth: 1,
        });

        // Bounds right box - cyan
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'debug_boundsRight',
            targetId: 'faceBox',
            width: boxSize,
            height: boxSize,
            depth: boxSize,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: 0 };
                return face.bounds.right;
            },
            fillColor: { red: 0, green: 255, blue: 255 },
            strokeWidth: 1,
        });

        // Bounds top box - magenta
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'debug_boundsTop',
            targetId: 'faceBox',
            width: boxSize,
            height: boxSize,
            depth: boxSize,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: 0 };
                return face.bounds.top;
            },
            fillColor: { red: 255, green: 0, blue: 255 },
            strokeWidth: 1,
        });

        // Bounds bottom box - orange
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'debug_boundsBottom',
            targetId: 'faceBox',
            width: boxSize,
            height: boxSize,
            depth: boxSize,
            position: (ctx) => {
                const face = ctx.dataProviders['headTracker'];
                if (!face) return { x: 0, y: 0, z: 0 };
                return face.bounds.bottom;
            },
            fillColor: { red: 255, green: 165, blue: 0 },
            strokeWidth: 1,
        });

        // Nose sphere - child of faceBox
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'nose',
            targetId: 'faceBox',
            width: 50,
            position: { x: 0, y: 0, z: 50 },
            strokeWidth: 4,
            strokeColor: { red: 255, green: 0, blue: 255 },
        });

        // Nose sphere - child of faceBox
        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: 'left-eye',
            targetId: 'faceBox',
            radius: 20,
            position: { x: -25, y: -25, z: 25 },
            // position: (ctx) => {
            //     const face = ctx.dataProviders['headTracker'];
            //     if (!face) return { x: 0, y: 0, z: 0 };
            //     return {
            //         x: face.eyes.left.x,
            //         y: face.eyes.left.y,
            //         z: face.eyes.left.z,
            //     };
            // },
            alpha: 0.5,
            fillColor: { red: 255, green: 255, blue: 255 },
        });

        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: 'right-eye',
            targetId: 'faceBox',
            radius: 20,
            position: { x: 25, y: -25, z: 25 },
            // position: (ctx) => {
            //     const face = ctx.dataProviders['headTracker'];
            //     if (!face) return { x: 0, y: 0, z: 0 };
            //     return {
            //         x: face.eyes.right.x,
            //         y: face.eyes.right.y,
            //         z: face.eyes.right.z,
            //     };
            // },
            alpha: 0.5,
            fillColor: { red: 255, green: 255, blue: 255 },
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
            alpha: 0.5,
            fillColor: videoEl ? undefined : { red: 50, green: 50, blue: 50 },
        });

        // world.addPanel({
        //     type: ELEMENT_TYPES.PANEL,
        //     id: 'white',
        //     width: 640,
        //     height: 480,
        //     position: { x: 0, y: 0, z: -100 },
        //     fillColor: { red: 255, green: 255, blue: 255 },
        // });
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
