import p5 from 'p5';
import {type BoxProps, type TextProps, ELEMENT_TYPES, DEFAULT_SETTINGS, type SceneState} from "../scene/types.ts";
import { World } from "../scene/world.ts";
import {P5GraphicProcessor} from "../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../scene/scene_manager.ts";
import {P5AssetLoader} from "../scene/p5/p5_asset_loader.ts";
import {toProps} from "../scene/create_renderable.ts";

export const tutorial_5 = (p: p5) => {
    let world: World;
    let gp: P5GraphicProcessor;
    const manager = new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {
            startTime: 0,
            timeSpeed: 1.0,
            duration: 5000, // 5 second loop
            isLoop: true
        }
    });

    p.setup = async () => {
        p.createCanvas(500, 400, p.WEBGL);
        world = new World(manager);

        const loader = new P5AssetLoader(p);
        gp = new P5GraphicProcessor(p, loader);

        // 1. Textures: Apply an image to a 3D Box
        world.addElement('textured-box', toProps({
            type: ELEMENT_TYPES.BOX,
            size: 150,
            position: { x: 0, y: 0, z: -100 },
            strokeWidth: 0,
            fillColor: { red: 0, green: 0, blue: 200 },
            rotate: {
                x: 0,
                y: (state: SceneState) => Math.PI * 2 * state.playback.progress,
                z: (state: SceneState) => Math.PI * 2 * state.playback.progress,
            },
            texture: { path: '/parallax/img/red.png' },
        }) as BoxProps);

        // 2. Fonts: Render 3D Text
        world.addElement('title', toProps({
            type: ELEMENT_TYPES.TEXT,
            text: "TEXTURES",
            size: 30,
            position: { x: -30, y: 0, z: 50 },
            // Specify the font path for the loader to fetch
            font: { name: 'Roboto', path: '/parallax/fonts/Roboto-Regular.ttf' },
            fillColor: { red: 0, green: 229, blue: 255 }
        }) as TextProps);

        // CRITICAL: We must wait for the images and fonts to download
        // before we start the draw loop.
        await world.hydrate(loader);
    };

    p.draw = () => {
        p.background(15);
        world.step(gp);
    };
};