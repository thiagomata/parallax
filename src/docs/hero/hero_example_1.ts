import p5 from "p5";
import {
    PROJECTION_TYPES,
    ELEMENT_TYPES,
    DEFAULT_SETTINGS,
    WindowConfig,
    type ResolutionContext,
    type Vector3
} from "../../scene/types.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import { World } from "../../scene/world.ts";
import { SceneClock } from "../../scene/scene_clock.ts";

// Modifiers
// import { CenterFocusModifier } from "../../scene/modifiers/center_focus_modifier.ts";
// import { OrbitModifier } from "../../scene/modifiers/orbit_modifier.ts";

import type { SketchConfig } from "./hero.demo.ts";

export const heroExample1 = (p: p5, config: SketchConfig): World<P5Bundler, any, any> => {
    let gp: P5GraphicProcessor;

    // 1. Temporal & Spatial Orchestration
    const clock = new SceneClock(DEFAULT_SETTINGS);

    const settings = {
        ...DEFAULT_SETTINGS,
        window: WindowConfig.create({
            width: config.width,
            height: config.height,
        }),
        playback: {
            ...DEFAULT_SETTINGS.playback,
            duration: 10000,
            isLoop: true
        },
        debug: true
    };

    const loader = config?.loader ?? new P5AssetLoader(p);
    const world = new World<P5Bundler, any, any>(clock, loader, settings);

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);

        // 2. The Projection Rig
        // Modifiers are now properties of the Eye projection itself.
        world.stage.setEye({
            id: 'eye',
            type: PROJECTION_TYPES.EYE as typeof PROJECTION_TYPES.EYE,
            position: { x: 0, y: 0, z: 1000 },
            lookAt: { x: 0, y: 0, z: 0 },
            modifiers: {
                // carModifiers: [new OrbitModifier(p, 1000)],
                // stickModifiers: [new CenterFocusModifier()]
            }
        });

        // 3. Shape Registration
        world.addPyramid({
            id: 'back-pyramid',
            type: ELEMENT_TYPES.PYRAMID,
            baseSize: 200,
            height: 150,
            position: { x: -100, y: 0, z: -200 },
            fillColor: { red: 0, green: 255, blue: 0, alpha: 1.0 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addCylinder({
            id: 'mid-cylinder',
            type: ELEMENT_TYPES.CYLINDER,
            radius: (ctx: ResolutionContext) => 50 + 50 * Math.cos(2 * Math.PI * ctx.playback.progress),
            height: 100,
            rotate: (ctx: ResolutionContext) => ({
                x: 0,
                y: 0,
                z: ctx.playback.progress * 2 * Math.PI
            }),
            position: (ctx: ResolutionContext): Vector3 => ({
                x: 0,
                y: (Math.cos(2 * Math.PI * ctx.playback.progress) * 100) - 100,
                z: 0
            }),
            fillColor: { red: 255, green: 0, blue: 0, alpha: 0.5 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addCone({
            id: 'front-cone',
            type: ELEMENT_TYPES.CONE,
            radius: 60,
            height: 120,
            position: { x: 100, y: 0, z: 200 },
            fillColor: { red: 0, green: 0, blue: 255, alpha: 1.0 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addTorus({
            id: 'ring-torus',
            type: ELEMENT_TYPES.TORUS,
            radius: 80,
            tubeRadius: 20,
            position: { x: 0, y: 50, z: -50 },
            fillColor: { red: 255, green: 255, blue: 0, alpha: 0.8 },
            strokeColor: { red: 0, green: 0, blue: 0 }
        });

        world.addElliptical({
            id: 'egg-elliptical',
            type: ELEMENT_TYPES.ELLIPTICAL,
            rx: 50,
            ry: 30,
            rz: 70,
            position: { x: -50, y: 50, z: 50 },
            fillColor: { red: 255, green: 0, blue: 255, alpha: 0.6 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addText({
            id: 'title-text',
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