import p5 from 'p5';
import {DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState} from "../../scene/types.ts";
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";

export const tutorial_5 = (p: p5): World<P5Bundler> => {
    let gp: P5GraphicProcessor;

    // 1. Scene Orchestration
    const manager = new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {
            ...DEFAULT_SETTINGS.playback,
            duration: 5000,
            isLoop: true
        }
    });

    // 2. Asset Pipeline & World
    const loader = new P5AssetLoader(p);
    const world = new World<P5Bundler>(manager, loader);

    p.setup = async () => {
        p.createCanvas(500, 400, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);

        // 3. PHASE 1: REGISTRATION
        // Hydration starts automatically when the element is added

        // Textured Box
        world.addBox('textured-box', {
            type: ELEMENT_TYPES.BOX,
            size: 150,
            position: {x: 0, y: 0, z: -100},
            strokeWidth: 0,
            rotate: (state: SceneState) => ({
                x: 0,
                y: Math.PI * 2 * state.playback.progress,
                z: Math.PI * 2 * state.playback.progress,
            }),
            texture: {
                path: '/parallax/img/red.png',
                width: 100,
                height: 100,
            },
        });

        // 3D Text with Custom Font
        world.addText('title', {
            type: ELEMENT_TYPES.TEXT,
            text: "TEXTURES",
            size: 30,
            position: {x: -30, y: 0, z: 50},
            font: {
                name: 'Roboto',
                path: '/parallax/fonts/Roboto-Regular.ttf'
            },
            fillColor: {red: 0, green: 229, blue: 255}
        });

        // 4. PHASE 2: HYDRATION (Optional Wait)
        // By awaiting this, we ensure the first frame isn't "blank"
        await loader.waitForAllAssets();
    };

    p.draw = () => {
        p.background(15);

        // 5. PHASE 3: THE FRAME LOOP
        world.step(gp);
    };

    return world;
};