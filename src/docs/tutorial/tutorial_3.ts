import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneManager } from "../../scene/scene_manager.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SETTINGS,
    ELEMENT_TYPES,
    type SceneState,
    type Vector3
} from "../../scene/types.ts";

export const tutorial_3 = (p: p5, manager?: SceneManager): World<P5Bundler> => {
    let gp: P5GraphicProcessor;

    // 1. Scene Orchestration (5s circular loop)
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
        // Defining the Orbit as a function of the Engine Progress
        world.addBox('orbit-box', {
            type: ELEMENT_TYPES.BOX,
            size: 50,

            // Orbital Position Logic: x = cos(t), y = sin(t)
            position: (state: SceneState): Vector3 => ({
                x: Math.cos(state.playback.progress * Math.PI * 2) * 50,
                y: Math.sin(state.playback.progress * Math.PI * 2) * 50,
                z: -100
            }),

            // Rotation can also follow the orbit path
            rotate: (state: SceneState): Vector3 => ({
                x: state.playback.progress * Math.PI,
                y: state.playback.progress * Math.PI * 2,
                z: 0,
            }),

            fillColor: { red: 0, green: 255, blue: 150, alpha: 1.0 },
            strokeColor: { red: 0, green: 0, blue: 255 }
       });
    };

    p.draw = () => {
        p.background(20);

        // 4. PHASE 3: THE FRAME LOOP
        // The World calculates state, resolves the orbit, and draws via GP
        world.step(gp);
    };

    return world;
};