import p5 from 'p5';
import {World} from '../world';
import {P5GraphicProcessor} from './p5_graphic_processor';
import {P5AssetLoader, type P5Bundler} from './p5_asset_loader';
import {DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState, type Vector3} from "../types.ts";
import {SceneClock} from "../scene_clock.ts";
import {OrbitModifier} from "../modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../modifiers/center_focus_modifier.ts";

new p5((p: p5) => {
    let world: World<P5Bundler, any, any>;
    let gp: P5GraphicProcessor;

    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);

        // Scene Orchestration
        const manager = new SceneClock({
            ...DEFAULT_SETTINGS,
            playback: {
                ...DEFAULT_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            },
        });

        manager.setDebug(true);
        // Using modifiers as per your design
        manager.addCarModifier(new OrbitModifier(p, 1000));
        manager.addStickModifier(new CenterFocusModifier());

        // Bridge & Loader
        const loader = new P5AssetLoader(p);
        gp = new P5GraphicProcessor(p, loader);

        // World & Stage initialization
        // Note: World creates its own internal Stage if one isn't passed
        world = new World(manager, loader);

        // REGISTRATION (Adding Blueprints)
        // We use world.add (which delegates to stage.add)
        // No more manual 'toProps'—the Registry handles that!

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'back',
            width: 200,
            position: {x: -100, y: 0, z: -200},
            fillColor: {red: 0, green: 255, blue: 0, alpha: 1.0},
            strokeColor: {red: 0, green: 0, blue: 0, alpha: 1.0},
            strokeWidth: 1,
        });

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'mid',
            width: (state: SceneState) => (Math.cos(2 * Math.PI * state.playback.progress) * 50) + 100,
            rotate: (state: SceneState) => ({
                x: 0,
                y: 0,
                z: state.playback.progress * 2 * Math.PI
            }),
            position: (state: SceneState): Vector3 => ({
                x: 0,
                y: (Math.cos(2 * Math.PI * state.playback.progress) * 100) - 100,
                z: 0,
            }),
            fillColor: {red: 255, green: 0, blue: 0, alpha: 0.5},
            strokeColor: {red: 0, green: 0, blue: 0, alpha: 1.0},
            strokeWidth: 1,
        });

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'front',
            width: 100,
            position: {x: 100, y: 0, z: 200},
            fillColor: {red: 0, green: 0, blue: 255, alpha: 1.0},
            strokeColor: {red: 0, green: 0, blue: 0, alpha: 1.0},
            strokeWidth: 1,
        });

        world.addText({
            type: ELEMENT_TYPES.TEXT,
            id: 'title-label',
            text: "HELLO WORLD",
            size: 40,
            position: {x: 50, y: 0, z: 0},
            font: {name: 'Roboto', path: '/parallax/fonts/Roboto-Regular.ttf'},
            fillColor: {red: 255, green: 0, blue: 255, alpha: 1}
        });
    };

    p.draw = () => {
        p.background(220);
        // THE FRAME LOOP
        // Advancing physics, setting camera, and rendering sorted elements
        world.step(gp);
    };
});