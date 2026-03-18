import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type Vector3} from "../../scene/types.ts";
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
    world.addModifierToProjection('head', new HeadTrackingModifier({
        disableRotation: false,
        damping: 0.1,
    }), 'car');

    // Add some cubes on a floor
    const floorY = 200;

    for (let i = 0; i < 25; i++) {
        world.addBox({
            id: `tunnel-${i}`,
            type: ELEMENT_TYPES.BOX,
            width: config.width,
            height: config.height,
            depth: 10,
            strokeWidth: 4,
            strokeColor: {red: (255 - i * 10), green: (255 - i * 10), blue: (255 - i * 10)},
            position: { x: 0, y: 50, z: -60 * i },
        });
    }

    var counter = 0;
    function createTarget(pos: Vector3) {
        counter++;
        world.addBox({
            id: `target-${counter}`,
            type: ELEMENT_TYPES.BOX,
            position: pos,
            width: 100
        });
        world.addCylinder({
            id: `target-circle-${counter}`,
            targetId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 10,
            height: 1,
            position: {x: 0, y: 50, z: -50},
            fillColor: COLORS.red,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-circle-1-${counter}`,
            targetId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 8,
            height: 1,
            position: {x: 0, y: 50, z: -49.9},
            fillColor: COLORS.white,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-circle-2-${counter}`,
            targetId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 6,
            height: 1,
            position: {x: 0, y: 50, z: -49.8},
            fillColor: COLORS.red,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-circle-3-${counter}`,
            targetId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 4,
            height: 1,
            position: {x: 0, y: 50, z: -49.7},
            fillColor: COLORS.white,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-circle-4-${counter}`,
            targetId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 2,
            height: 1,
            position: {x: 0, y: 50, z: -49.6},
            fillColor: COLORS.red,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-stick-${counter}`,
            targetId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            height: 100,
            radius: 2,
            position: {x: 0, y: 50, z: -100.1},
            fillColor: {red: 100, green: 0, blue: 0},
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
    }
    createTarget({x: 0, y: 0, z: 0});
    createTarget({x: -70, y: -10, z: 50});
    createTarget({x: 50, y: 10, z: 80});
    createTarget({x: 10, y: -80, z: 30});
    createTarget({x: 10, y: -200, z: 10});
    createTarget({x: -30, y: 30, z: 90});
    createTarget({x: 50, y: -50, z: 70});
    createTarget({x: -30, y: -20, z: 20});
    createTarget({x: -130, y: -120, z: 200});
    createTarget({x: 130, y: 120, z: 250});
    createTarget({x: 200, y: 200, z: 400});
    createTarget({x: -200, y: -200, z: 500});
    
    // Additional targets spread across the region
    createTarget({x: -150, y: 0, z: 100});
    createTarget({x: 150, y: 0, z: 120});
    createTarget({x: 0, y: 150, z: 150});
    createTarget({x: 0, y: -150, z: 180});
    createTarget({x: -100, y: 100, z: 200});
    createTarget({x: 100, y: -100, z: 220});
    createTarget({x: -180, y: -50, z: 300});
    createTarget({x: 180, y: 50, z: 320});
    createTarget({x: 50, y: 180, z: 350});
    createTarget({x: -50, y: -180, z: 380});
    createTarget({x: -220, y: 100, z: 450});
    createTarget({x: 220, y: -100, z: 480});
    createTarget({x: 100, y: 200, z: 520});
    createTarget({x: -100, y: -200, z: 550});
    createTarget({x: 60, y: 0, z: -50});
    createTarget({x: -80, y: 50, z: -30});
    createTarget({x: 80, y: -50, z: -40});
    createTarget({x: 0, y: -100, z: -20});
    createTarget({x: 0, y: 100, z: -10});
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

    // Right cube
    world.addBox({
        id: 'right-cube',
        type: ELEMENT_TYPES.BOX,
        width: 40,
        strokeWidth: 0.1,
        strokeColor: COLORS.white,
        position: { x: 150, y: floorY, z: -100 },
        fillColor: COLORS.orange,
    });

    // Far cube
    world.addBox({
        id: 'far-cube',
        type: ELEMENT_TYPES.BOX,
        width: 30,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: -300 },
        fillColor: COLORS.cyan,
    });


    // Front (towards negative Z - in front of camera)
    world.addBox({
        id: 'front-cube',
        type: ELEMENT_TYPES.BOX,
        width: 30,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: -30 },
        fillColor: COLORS.purple,
    });

    p.setup = async () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        await faceDataProvider.init();
        gp = new P5GraphicProcessor(p, loader);
    };

    p.draw = () => {
        p.background(20);
        world.step(gp);
    };

    return world;
}
