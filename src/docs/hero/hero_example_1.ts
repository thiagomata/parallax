import {DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState, type Vector3} from "../../scene/types.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {World} from "../../scene/world.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import p5 from "p5";
import type {SketchConfig} from "./hero.demo.ts";

    export const heroExample1 = (p: p5, config: SketchConfig): World<P5Bundler> => {
    let gp: P5GraphicProcessor;

    const manager = new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: { ...DEFAULT_SETTINGS.playback, duration: 10000, isLoop: true }
    });

    manager.setDebug(true);
    manager.setStickDistance(1000);
    manager.addCarModifier(new OrbitModifier(p, 1000));
    manager.addStickModifier(new CenterFocusModifier());

    const loader = config?.loader ?? new P5AssetLoader(p);
    const world = new World<P5Bundler>(manager, loader);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);

        // ==== REGISTRATION WITH NEW SHAPES ====

        world.addPyramid('back', {
            type: 'pyramid',
            baseSize: 200,
            height: 150,
            position: { x: -100, y: 0, z: -200 },
            fillColor: { red: 0, green: 255, blue: 0, alpha: 1.0 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addCylinder('mid', {
            type: ELEMENT_TYPES.CYLINDER,
            radius: (state: SceneState) => 50 + 50 * Math.cos(2 * Math.PI * state.playback.progress),
            height: 100,
            rotate: (state: SceneState) => ({
                x: 0,
                y: 0,
                z: state.playback.progress * 2 * Math.PI
            }),
            position: (state: SceneState): Vector3 => ({
                x: 0,
                y: (Math.cos(2 * Math.PI * state.playback.progress) * 100) - 100,
                z: 0
            }),
            fillColor: { red: 255, green: 0, blue: 0, alpha: 0.5 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addCone('front', {
            type: ELEMENT_TYPES.CONE,
            radius: 60,
            height: 120,
            position: { x: 100, y: 0, z: 200 },
            fillColor: { red: 0, green: 0, blue: 255, alpha: 1.0 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addTorus('ring', {
            type: ELEMENT_TYPES.TORUS,
            radius: 80,
            tubeRadius: 20,
            position: { x: 0, y: 50, z: -50 },
            fillColor: { red: 255, green: 255, blue: 0, alpha: 0.8 },
            strokeColor: { red: 0, green: 0, blue: 0 }
        });

        world.addElliptical('egg', {
            type: ELEMENT_TYPES.ELLIPTICAL,
            rx: 50,
            ry: 30,
            rz: 70,
            position: { x: -50, y: 50, z: 50 },
            fillColor: { red: 255, green: 0, blue: 255, alpha: 0.6 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addText('title', {
            type: ELEMENT_TYPES.TEXT,
            text: "PARALLAX",
            size: 40,
            position: { x: 50, y: 0, z: 0 },
            font: {
                name: 'Roboto',
                path: '/parallax/fonts/Roboto-Regular.ttf'
            },
            fillColor: { red: 255, green: 0, blue: 255 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });
    };

    p.draw = () => {
        p.background(15);
        world.step(gp);
    };

    return world;
};
