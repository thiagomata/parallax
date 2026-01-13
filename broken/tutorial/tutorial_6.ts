import p5 from 'p5';
import { DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState } from "../../scene/types.ts";
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneManager } from "../../scene/scene_manager.ts";
import { P5AssetLoader } from "../../scene/p5/p5_asset_loader.ts";
import { toProps } from "../../scene/create_renderable.ts";

export const tutorial_6 = (p: p5): World => {
    let gp: P5GraphicProcessor;
    const manager = new SceneManager({
        ...DEFAULT_SETTINGS,
        playback: {
            startTime: 0,
            duration: 10000,
            isLoop: true
        }
    });
    const world = new World(manager);

    p.setup = async () => {
        p.createCanvas(800, 600, p.WEBGL);
        const loader = new P5AssetLoader(p);
        gp = new P5GraphicProcessor(p, loader);

        // 1. THE MAIN FLOOR (Static)
        world.addElement('stage-floor', toProps({
            type: ELEMENT_TYPES.FLOOR,
            width: 1000,
            depth: 100,
            position: { x: 0, y: 200, z: 0 },
            fillColor: { red: 40, green: 40, blue: 50 }
        }));

        // 2. BACKDROP PANEL (With Texture)
        world.addElement('back-wall', toProps({
            type: ELEMENT_TYPES.PANEL,
            width: 1000,
            height: 600,
            position: { x: 0, y: -100, z: -500 },
            fillColor: { red: 255, green: 255, blue: 255 },
            texture: { width: 100, height: 100, path: '/parallax/img/grid.png' }
        }));

        // 3. THE CENTER-PIECE SPHERE (Atomic & Granular Hybrid)
        world.addElement('hero-sphere', toProps({
            type: ELEMENT_TYPES.SPHERE,
            // Atomic Function: The entire position moves in a vertical loop
            position: (s: SceneState) => ({
                x: 0,
                y: Math.sin(s.playback.progress * Math.PI * 2) * 50,
                z: -100
            }),
            // Granular Object: Only the radius and blue channel are dynamic
            radius: (s: SceneState) => 60 + Math.sin(s.playback.now * 0.002) * 20,
            fillColor: {
                red: 200,
                green: 100,
                blue: (s: SceneState) => 150 + Math.sin(s.playback.now * 0.005) * 105
            }
        }));

        // 4. FLOATING WING (Panel used for depth)
        world.addElement('side-panel', toProps({
            type: ELEMENT_TYPES.PANEL,
            width: 200,
            height: 600,
            position: { x: 350, y: -100, z: -300 },
            // Static rotation to create an angled "wing"
            rotate: { x: 0, y: -Math.PI / 4, z: 0 },
            fillColor: { red: 60, green: 60, blue: 70 }
        }));

        await world.hydrate(loader);
    };

    p.draw = () => {
        p.background(15);
        world.step(gp);
    };

    return world;
};