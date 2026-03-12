import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES, LOOK_MODES,
    STANDARD_PROJECTION_IDS,
    PROJECTION_TYPES
} from "../../scene/types.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SKETCH_CONFIG,
    type SketchConfig
} from "./tutorial_main_page.demo.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { LookAtEffect } from "../../scene/effects/look_at_effect.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {COLORS} from "../../scene/colors.ts";

/**
 * TUTORIAL 8: THE BILLBOARD
 * Demonstrating billboard elements that always face the camera.
 */
export function tutorial_8(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;

    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: { ...DEFAULT_SCENE_SETTINGS.playback, duration: 10000, isLoop: true }
    });

    const loader = new P5AssetLoader(p);
    
    const effects = {
        'look_at': LookAtEffect,
    };

    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({
            clock,
            loader,
            elementEffectLib: effects
        })
    );

    world.enableDefaultPerspective(config.width, config.height);

    // // Set up screen with default rotation mode
    // world.setScreen({
    //     id: 'screen',
    //     type: PROJECTION_TYPES.SCREEN,
    //     lookMode: LOOK_MODES.ROTATION,
    // });

    world.setScreen({
        id: STANDARD_PROJECTION_IDS.SCREEN,
        type: PROJECTION_TYPES.SCREEN,
        lookMode: LOOK_MODES.ROTATION,
        modifiers: {
            carModifiers: [
                new OrbitModifier(p, 300, 0),
            ],
            stickModifiers: [
                new CenterFocusModifier()
            ]
        }
    });

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // Reference objects to show camera movement
        world.addBox({
            id: 'reference-cube',
            type: ELEMENT_TYPES.BOX,
            width: 50,
            position: { x: 150, y: 0, z: 0 },
            fillColor: { red: 100, green: 100, blue: 255 },
            strokeColor: { red: 255, green: 255, blue: 255 },
            strokeWidth: 3,
        });

        world.addPanel({
            id: 'ref-panel',
            type: ELEMENT_TYPES.PANEL,
            position: { x: 50, y: 0, z: 0 },
            fillColor: { red: 100, green: 100, blue: 255 },
            strokeColor: { red: 255, green: 255, blue: 255 },
            width: 50,
            height: 50,
            strokeWidth: 3,
        });

        // Billboard box - always faces camera
        world.addBox({
            id: 'billboard-cube',
            type: ELEMENT_TYPES.BOX,
            width: 50,
            position: { x: -150, y: 0, z: 0 },
            fillColor: COLORS.orange,
            strokeColor: { red: 255, green: 255, blue: 255 },
            effects: [
                { type: 'look_at' }
            ],
            rotate: {
                // yaw: Math.PI / 4,
                pitch: Math.PI / 4,
                roll: Math.PI / 4,
            },
            strokeWidth: 3,
        });

        // Billboard panel - always faces camera
        world.addPanel({
            id: 'billboard-panel',
            type: ELEMENT_TYPES.PANEL,
            width: 50,
            height: 50,
            position: { x: -50, y: 0, z: 0 },
            fillColor: COLORS.orange,
            strokeColor: { red: 255, green: 255, blue: 255 },
            effects: [
                { type: 'look_at' }
            ],
            strokeWidth: 3,
        });
    };

    p.draw = () => {
        if (config.paused && !clock.isPaused()) clock.pause();
        if (!config.paused && clock.isPaused()) clock.resume();

        p.background(20);
        world.step(graphicProcessor);
    };

    return world;
}
