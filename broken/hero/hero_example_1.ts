import p5 from 'p5';
import {type BoxProps, DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState, type TextProps, type Vector3} from "../../scene/types.ts";
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import {toProps} from "../../scene/create_renderable.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";

export const heroExample1 = (p: p5): World => {
    let gp: P5GraphicProcessor;

    const manager = new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {
            startTime: 0,
            timeSpeed: 1.0,
            duration: 10000,
            isLoop: true
        }
    });

    // Setup Engine State
    manager.setDebug(true);
    manager.setStickDistance(1000);
    manager.addCarModifier(new OrbitModifier(p, 1000));
    manager.addStickModifier(new CenterFocusModifier());

    const world = new World(manager);

    p.setup = async () => {
        p.createCanvas(500, 400, p.WEBGL);

        const loader = new P5AssetLoader(p);
        gp = new P5GraphicProcessor(p, loader);

        // 1. Back Static Box
        world.addElement('back', toProps({
            type: ELEMENT_TYPES.BOX,
            size: 200,
            position: { x: -100, y: 0, z: -200 },
            fillColor: { red: 0, green: 255, blue: 0, alpha: 1.0 }
        }) as BoxProps);

        // 2. Middle Animated Box
        world.addElement('mid', toProps({
            type: ELEMENT_TYPES.BOX,
            size: (state: SceneState) => (Math.cos(2 * Math.PI * state.playback.progress) * 50) + 100,
            rotate: {
                x: 0,
                y: 0,
                z: (state: SceneState) => state.playback.progress * 2 * Math.PI,
            },
            position: ((state: SceneState): Vector3 => {
                let y = (Math.cos(2 * Math.PI * state.playback.progress) * 100) - 100;
                return { x: 0, y: y, z: 0 };
            }),
            fillColor: { red: 255, green: 0, blue: 0, alpha: 0.5 }
        }) as BoxProps);

        // 3. Front Static Box
        world.addElement('front', toProps({
            type: ELEMENT_TYPES.BOX,
            size: 100,
            position: { x: 100, y: 0, z: 200 },
            fillColor: { red: 0, green: 0, blue: 255, alpha: 1.0 }
        }) as BoxProps);

        // 4. Text Label
        world.addElement('title', toProps({
            type: ELEMENT_TYPES.TEXT,
            text: "PARALLAX",
            size: 40,
            position: { x: 50, y: 0, z: 0 },
            font: { name: 'Roboto', path: '/parallax/fonts/Roboto-Regular.ttf' },
            fillColor: { red: 255, green: 0, blue: 255 }
        }) as TextProps);

        await world.hydrate(loader);
    };

    p.draw = () => {
        p.background(15);
        world.step(gp);
    };

    return world;
};