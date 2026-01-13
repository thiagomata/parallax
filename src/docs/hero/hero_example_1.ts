import p5 from 'p5';
import {type AssetLoader, DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState, type Vector3} from "../../scene/types.ts";
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";

export const heroExample1 = (p: p5, loader: AssetLoader<P5Bundler> | null = null): World<P5Bundler> => {
    let gp: P5GraphicProcessor;

    // 1. Initialize Temporal Phase (SceneManager)
    const manager = new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {
            ...DEFAULT_SETTINGS.playback,
            duration: 10000,
            isLoop: true
        }
    });

    manager.setDebug(true);
    manager.setStickDistance(1000);
    manager.addCarModifier(new OrbitModifier(p, 1000));
    manager.addStickModifier(new CenterFocusModifier());

    // 2. Initialize World with the Bridge Loader
    // We create the loader here so we can pass it to the World/Stage
    loader = loader ?? new P5AssetLoader(p);
    const world = new World<P5Bundler>(manager, loader);

    p.setup = () => {
        p.createCanvas(500, 400, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);

        // 3. PHASE 1: REGISTRATION (Using Extreme Typing)

        world.addBox('back', {
            type: ELEMENT_TYPES.BOX,
            size: 200,
            position: {x: -100, y: 0, z: -200},
            fillColor: {red: 0, green: 255, blue: 0, alpha: 1.0},
            strokeColor: {red: 255, green: 255, blue: 255}
        });

        world.addBox('mid', {
            type: ELEMENT_TYPES.BOX,
            size: (state: SceneState) => (Math.cos(2 * Math.PI * state.playback.progress) * 50) + 100,
            rotate: (state: SceneState) => ({
                x: 0,
                y: 0,
                z: state.playback.progress * 2 * Math.PI,
            }),
            position: (state: SceneState): Vector3 => ({
                x: 0,
                y: (Math.cos(2 * Math.PI * state.playback.progress) * 100) - 100,
                z: 0
            }),
            fillColor: {red: 255, green: 0, blue: 0, alpha: 0.5},
            strokeColor: {red: 255, green: 255, blue: 255}
        });

        world.addBox('front', {
            type: ELEMENT_TYPES.BOX,
            size: 100,
            position: {x: 100, y: 0, z: 200},
            fillColor: {red: 0, green: 0, blue: 255, alpha: 1.0},
            strokeColor: {red: 255, green: 255, blue: 255}
        });

        world.addText('title', {
            type: ELEMENT_TYPES.TEXT,
            text: "PARALLAX",
            size: 40,
            position: {x: 50, y: 0, z: 0},
            font: {name: 'Roboto', path: '/parallax/fonts/Roboto-Regular.ttf'},
            fillColor: {red: 255, green: 0, blue: 255},
            strokeColor: {red: 255, green: 255, blue: 255}
        });

        // Hydration happens automatically as soon as elements are added!
    };

    p.draw = () => {
        p.background(15);
        // Advancing physics, camera, and sorted rendering in one step
        world.step(gp);
    };

    return world;
};