import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES,
} from "../../scene/types.ts";
import {
    P5AssetLoader,
    type P5Bundler
} from "../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SKETCH_CONFIG,
    type SketchConfig
} from "./tutorial_main_page.demo.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { LookAtEffect } from "../../scene/effects/look_at_effect.ts";
import {COLORS} from "../../scene/colors.ts";
import {CenterOrbit} from "../../scene/presets.ts";

/**
 * TUTORIAL 9: LOOK AT THE OBJECT
 * Demonstrating how to make one object look at another object.
 */
export function tutorial_9(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
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
    world.loadPreset(CenterOrbit(p, {radius: 300, verticalBaseline: 100}));

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // REGISTRATION
        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: 'obj',
            radius: 20,
            position: (currentState) => {
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
                pitch: 0,
                roll: 0,
                yaw: 0,
            },
            fillColor: COLORS.green,
            strokeColor: COLORS.white,
            strokeWidth: 1,
        });

        world.addCylinder({
            type: ELEMENT_TYPES.CYLINDER,
            id: 'look-to-obj',
            radius: 20,
            height: 50,
            rotate: {
                yaw: 0,
                roll: 0,
                pitch: Math.PI / 2,
            },
            strokeWidth: 2,
            position: {x: 0, y: 0, z: 100},
            fillColor: {red: 0, green: 255, blue: 0,},
            strokeColor: {red: 0, green: 0, blue: 255},
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
        if (config.paused && !clock.isPaused()) clock.pause();
        if (!config.paused && clock.isPaused()) clock.resume();

        p.background(20);
        world.step(graphicProcessor);
    };

    return world;
}
