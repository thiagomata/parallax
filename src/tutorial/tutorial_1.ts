import p5 from 'p5';
import {World} from "../scene/world.ts";
import {P5GraphicProcessor} from "../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../scene/scene_manager.ts";
import {P5AssetLoader} from "../scene/p5/p5_asset_loader.ts";
import {toProps} from "../scene/create_renderable.ts";
import {type BoxProps, ELEMENT_TYPES} from "../scene/types.ts";

export const tutorial_1 = (p: p5) => {
    let world: World;
    let gp:
        P5GraphicProcessor;

    p.setup = async () => {
        p.createCanvas(500, 400, p.WEBGL);
        world = new World(new SceneManager());
        gp = new P5GraphicProcessor(p, new P5AssetLoader(p));

        world.addElement('box', toProps({
            type: ELEMENT_TYPES.BOX,
            size: 100,
            rotate: {x: -0.25 * Math.PI, y: 0.25 * Math.PI, z: 0},
            position: { x: 0, y: 0, z: 0 },
            fillColor: { red: 100, green: 100, blue: 255 },
            strokeColor: { red: 255, green: 255, blue: 255 },
        }) as BoxProps);
    };

    p.draw = () => {
        p.background(20);
        world.step(gp);
    };
};