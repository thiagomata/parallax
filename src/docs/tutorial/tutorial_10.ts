import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import { DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES } from "../../scene/types.ts";
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "./tutorial_main_page.demo.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { HEAD_TRACKED_PRESET } from "../../scene/presets.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import {COLORS} from "../../scene/colors.ts";

/**
 * TUTORIAL 10: HEAD-TRACKED VR VIEW
 * Demonstrates using the HEAD_TRACKED preset with head tracking.
 * User's head movement controls the camera view of a scene with cubes.
 */
export function tutorial_10(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    faceDataProvider?: HeadTrackingDataProvider,
): World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }> {
    let gp: P5GraphicProcessor;

    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        debug: false,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 10000,
            isLoop: true
        },
    });

    faceDataProvider = faceDataProvider ?? new HeadTrackingDataProvider(p);

    const loader = new P5AssetLoader(p);
    const dataProviderLib: { headTracker: HeadTrackingDataProvider } = { headTracker: faceDataProvider };
    const world = new World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }>(
        WorldSettings.fromLibs({ clock, loader, dataProviderLib })
    );

    world.enableDefaultPerspective(config.width, config.height, Math.PI / 4, true);

    // Load HEAD_TRACKED preset: SCREEN → HEAD → EYE
    world.loadPreset(HEAD_TRACKED_PRESET);

    // Add head tracking modifier to HEAD projection
    world.addModifierToProjection('head', new HeadTrackingModifier(), 'car');

    // Add some cubes on a floor
    const floorY = 200;

    // Center cube
    world.addBox({
        id: 'center-cube',
        type: ELEMENT_TYPES.BOX,
        width: 50,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: 0 },
        fillColor: COLORS.red,
    });

    // // Left cube
    world.addBox({
        id: 'left-cube',
        type: ELEMENT_TYPES.BOX,
        width: 40,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: -150, y: floorY, z: -100 },
        fillColor: COLORS.blue,
    });

    // // Right cube
    world.addBox({
        id: 'right-cube',
        type: ELEMENT_TYPES.BOX,
        width: 40,
        strokeWidth: 0.1,
        strokeColor: COLORS.white,
        position: { x: 150, y: floorY, z: -100 },
        fillColor: COLORS.orange,
    });
    //
    // // Far cube
    world.addBox({
        id: 'far-cube',
        type: ELEMENT_TYPES.BOX,
        width: 30,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: -300 },
        fillColor: COLORS.cyan,
    });

    // Floor plane for reference
    world.addFloor({
        type: ELEMENT_TYPES.FLOOR,
        id: 'floor',
        width: 800,
        depth: 800,
        strokeWidth: 0.1,
        strokeColor: COLORS.white,
        position: { x: 0, y: 250, z: -200 },
        fillColor: COLORS.gray,
    });

    // // Debug elements in ALL directions
    // // Front (towards negative Z - in front of camera)
    world.addBox({
        id: 'front-cube',
        type: ELEMENT_TYPES.BOX,
        width: 30,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: -30 },
        fillColor: COLORS.purple,
    });

    // // Back (toward positive Z - behind camera)
    world.addSphere({
        id: 'back-sphere',
        type: ELEMENT_TYPES.SPHERE,
        radius: 25,
        position: { x: 0, y: floorY, z: 200 },
        strokeWidth: 0.1,
        strokeColor: COLORS.white,
        fillColor: COLORS.brown,
    });
    //
    // // Up
    // world.addBox({
    //     id: 'up-cube',
    //     type: ELEMENT_TYPES.BOX,
    //     width: 30,
    //     position: { x: 200, y: 0, z: 0 },
    //     fillColor: COLORS.pink,
    // });
    //
    // // Down (below floor)
    // world.addBox({
    //     id: 'down-cube',
    //     type: ELEMENT_TYPES.BOX,
    //     width: 30,
    //     position: { x: -200, y: 400, z: 0 },
    //     fillColor: { red: 128, green: 0, blue: 255, alpha: 255 },
    // });
    //
    // // Far left
    // world.addSphere({
    //     id: 'far-left-sphere',
    //     type: ELEMENT_TYPES.SPHERE,
    //     radius: 25,
    //     position: { x: -300, y: floorY, z: -200 },
    //     fillColor: { red: 0, green: 255, blue: 128, alpha: 255 },
    // });
    //
    // // Far right
    // world.addSphere({
    //     id: 'far-right-sphere',
    //     type: ELEMENT_TYPES.SPHERE,
    //     radius: 25,
    //     position: { x: 300, y: floorY, z: -200 },
    //     fillColor: { red: 128, green: 128, blue: 0, alpha: 255 },
    // });
    //
    // // Center floating
    world.addSphere({
        id: 'center-sphere',
        type: ELEMENT_TYPES.SPHERE,
        radius: 30,
        position: { x: 0, y: 100, z: -100 },
        strokeWidth: 0.1,
        strokeColor: COLORS.white,
        fillColor: COLORS.white,
    });

    // Out of screen effect - small sphere between camera (z=50) and screen (z=-50)
    world.addSphere({
        id: 'out-of-screen',
        type: ELEMENT_TYPES.SPHERE,
        radius: 5,
        position: { x: 0, y: 10, z: -10 },
        strokeColor: COLORS.blue,
        strokeWidth: 0.1,
        fillColor: COLORS.yellow,
    });

    p.setup = async () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        await faceDataProvider.init();
        gp = new P5GraphicProcessor(p, loader);
    };

    p.draw = () => {
        p.background(20);
        world.step(gp);
        
        // Debug: log camera position once per second
        if (p.frameCount % 60 === 0) {
            const state = world.getCurrenState();
            if (state) {
                const eye = state.projections.get('eye');
                const screen = state.projections.get('screen');
                const head = state.projections.get('head');
                console.log('head:', head?.position, 'rot:', head?.rotation);
                console.log('eye:', eye?.globalPosition, 'rot:', eye?.globalRotation);
                console.log('screen:', screen?.globalPosition);
            }
        }
    };

    return world;
}
