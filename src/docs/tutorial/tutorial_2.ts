import p5 from 'p5';
import {type BoxProps, DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState} from "../../scene/types.ts";
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import {toProps} from "../../scene/create_renderable.ts";

export const tutorial_2 = (p: p5, manager?: SceneManager): World => {
    let world: World;
    let gp: P5GraphicProcessor;
    manager = manager ?? new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {
            startTime: 0,
            timeSpeed: 1.0,
            duration: 5000, // 5 second loop
            isLoop: true
        }
    });
    world = new World(manager);

    p.setup = async () => {
        p.createCanvas(500, 400, p.WEBGL);

        gp = new P5GraphicProcessor(p, new P5AssetLoader(p));

        world.addElement('pulsing-box', toProps({
            type: ELEMENT_TYPES.BOX,
            position: { x: 0, y: 0, z: 0},
            size: (state: SceneState) => {
                return 100 + Math.sin(state.playback.progress * Math.PI * 2) * 50;
            },
            rotate: {
                x: 0,
                y: (state: SceneState) => Math.PI * 2 * state.playback.progress,
                z: (state: SceneState) => Math.PI * 2 * state.playback.progress,
            },
            fillColor: {
                red: 255,
                green: 100,
                blue: (state: SceneState) => {
                    return 255 * Math.cos(
                        Math.PI * 2 * state.playback.progress
                    )
                },
            },
        }) as BoxProps);
    };

    p.draw = () => {
        p.background(20);
        world.step(gp);
    };

    return world;
};