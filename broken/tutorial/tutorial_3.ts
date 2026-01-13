// tutorial_3.ts
import {SceneManager} from "../../scene/scene_manager.ts";
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {type BoxProps, DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState, type Vector3} from "../../scene/types.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import {toProps} from "../../scene/create_renderable.ts";
import p5 from "p5";

export const tutorial_3 = (p: p5, manager?: SceneManager): World => {
    let world: World;
    let gp: P5GraphicProcessor;

    const activeManager = manager ?? new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {
            startTime: 0,
            timeSpeed: 1.0,
            duration: 5000,
            isLoop: true
        }
    });

    world = new World(activeManager);

    p.setup = async () => {
        p.createCanvas(500, 400, p.WEBGL);
        gp = new P5GraphicProcessor(p, new P5AssetLoader(p));

        world.addElement('orbit-box', toProps({
            type: ELEMENT_TYPES.BOX,
            size: 50,
            position: (state: SceneState): Vector3 => ({
                x: Math.cos(state.playback.progress * Math.PI * 2) * 40,
                y: Math.sin(state.playback.progress * Math.PI * 2) * 40,
                z: 0
            }),
            fillColor: { red: 0, green: 255, blue: 150 }
        }) as BoxProps);
    };

    p.draw = () => {
        p.background(20);
        world.step(gp);
    };

    return world;
};