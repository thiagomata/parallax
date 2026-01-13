import p5 from 'p5';
import {DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState} from "../../scene/types.ts";
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";

export const tutorial_2 = (p: p5, manager?: SceneManager): World<P5Bundler> => {
    let gp: P5GraphicProcessor;

    // 1. Scene Orchestration with a custom 5s loop
    const activeManager = manager ?? new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {
            ...DEFAULT_SETTINGS.playback,
            duration: 5000,
            isLoop: true
        }
    });

    // 2. Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const world = new World<P5Bundler>(activeManager, loader);

    p.setup = () => {
        p.createCanvas(500, 400, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);

        // 3. PHASE 1: REGISTRATION
        // We use the blueprint functions to define behavior over time
        world.addBox('pulsing-box', {
            type: ELEMENT_TYPES.BOX,
            position: {x: 0, y: 0, z: 0},

            // Dynamic Size: Pulse between 50 and 150
            size: (state: SceneState) => {
                return 100 + Math.sin(state.playback.progress * Math.PI * 2) * 50;
            },

            // Dynamic Rotation: Full 360 degree spin per loop
            rotate: (state: SceneState) => ({
                x: 0,
                y: Math.PI * 2 * state.playback.progress,
                z: Math.PI * 2 * state.playback.progress,
            }),

            // Dynamic Color: Shift blue channel based on progress
            fillColor: {
                red: 255,
                green: 100,
                blue: (state: SceneState) => {
                    return 127 + 127 * Math.cos(Math.PI * 2 * state.playback.progress);
                },
                alpha: 1.0
            },
            strokeColor: {red: 0, green: 0, blue: 0, alpha: 1.0},
        });
    };

    p.draw = () => {
        p.background(20);

        // 4. PHASE 3: THE FRAME LOOP
        // world.step calculates the state, resolves the functions above, and draws
        world.step(gp);
    };

    return world;
};