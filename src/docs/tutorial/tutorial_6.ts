import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneManager} from "../../scene/scene_manager.ts";
import {DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState} from "../../scene/types.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {World} from "../../scene/world.ts";
import p5 from "p5";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "./tutorial_main_page.demo.ts";

export function tutorial_6(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler> {
    let gp: P5GraphicProcessor;
    const manager = config.manager ?? new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {...DEFAULT_SETTINGS.playback, duration: 5000, isLoop: true}
    });

    const loader = config.loader ?? new P5AssetLoader(p);
    const world = new World<P5Bundler>(manager, loader);

    p.setup = async () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);

        // Just one static floor to check coordinate space
        world.addFloor('floor', {
            type: ELEMENT_TYPES.FLOOR,
            width: 500,
            depth: 500,
            position: {x: 0, y: 100, z: 0},
            fillColor: {red: 100, green: 100, blue: 100},
            texture: {
                path: '/parallax/img/stars.jpg',
                width: 100,
                height: 100,
            },
        });

        // The Hero: Testing Hybrid Props (Atomic Position + Granular Color)
        world.addSphere('hero-sphere', {
            type: ELEMENT_TYPES.SPHERE,
            position: (s: SceneState) => ({
                x: Math.sin(s.playback.progress * Math.PI * 2) * 100,
                y: 0,
                z: -200
            }),
            radius: 40,
            fillColor: {
                red: 255,
                green: 150,
                blue: (s: SceneState) => 127 + 127 * Math.sin(s.playback.progress * Math.PI * 2)
            }
        });
    };

    p.draw = () => {
        p.background(15);
        world.step(gp);
    };

    return world;
};
export default tutorial_6