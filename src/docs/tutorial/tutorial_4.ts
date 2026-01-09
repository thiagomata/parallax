import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {OrbitModifier} from "../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../scene/modifiers/center_focus_modifier.ts";
import {P5AssetLoader} from "../../scene/p5/p5_asset_loader.ts";
import {toProps} from "../../scene/create_renderable.ts";
import {type BoxProps, ELEMENT_TYPES} from "../../scene/types.ts";
import p5 from "p5";

export const tutorial_4 = (p: p5) => {
    let world: World;
    let gp: P5GraphicProcessor;

    p.setup = async () => {
        p.createCanvas(500, 400, p.WEBGL);

        const manager = new SceneManager();

        // 1. Add Camera Modifiers
        // OrbitModifier(p5, distance) moves the camera in a circle
        manager.addCarModifier(new OrbitModifier(p, 800));
        // CenterFocusModifier ensures the camera always points at {0,0,0}
        manager.addStickModifier(new CenterFocusModifier());

        world = new World(manager);
        gp = new P5GraphicProcessor(p, new P5AssetLoader(p));

        // 2. Add some static objects to see the camera movement
        for (let i = 0; i < 5; i++) {
            world.addElement(`box-${i}`, toProps({
                type: ELEMENT_TYPES.BOX,
                size: 40,
                position: { x: (i - 2) * 100, y: 0, z: 0 },
                fillColor: { red: 255, green: 255, blue: 255 }
            }) as BoxProps);
        }
    };

    p.draw = () => {
        p.background(20);
        world.step(gp);
    };
};