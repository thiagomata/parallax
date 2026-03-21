import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES, LOOK_MODES,
    STANDARD_PROJECTION_IDS,
    PROJECTION_TYPES,
} from "../../scene/types.ts";
import {
    DEFAULT_SKETCH_CONFIG,
    type SketchConfig
} from "./sketch_config.ts";
import {WorldSettings} from "../../scene/world_settings.ts";
import {COLORS} from "../../scene/colors.ts";

/**
 * TUTORIAL: The Observer
 * 
 * Visualize how the engine tracks your face using MediaPipe face mesh.
 */
export const observer_explanation = `
<div class="concept">
<p>The parallax engine uses <strong>MediaPipe Face Mesh</strong> to detect 468 facial landmarks in real-time from your webcam. This tutorial visualizes all the tracked data including the face bounding box, nose position, eye positions, and face orientation (yaw, pitch, roll).</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>HeadTrackingDataProvider</strong> - Initializes MediaPipe and processes video frames to extract face landmarks.</li>
<li><strong>Face Position</strong> - The face midpoint (between eyes) is tracked as x, y, z coordinates. Use <code>ctx.dataProviders['headTracker']</code> to access face data.</li>
<li><strong>Face Rotation</strong> - Head orientation is calculated as yaw (turning left/right), pitch (nodding up/down), and roll (tilting sideways).</li>
<li><strong>Debug Visualization</strong> - Colored boxes show nose (red), left eye (green), right eye (blue), and face bounds (yellow, cyan, magenta, orange).</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Face Mesh</span>
<span class="key-term">Landmarks</span>
<span class="key-term">Face Bounds</span>
<span class="key-term">Yaw/Pitch/Roll</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-5">Loading Textures</a>
<a href="#tutorial-7">Always Face Camera</a>
</div>
`;

export async function tutorial_observer(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: { faceConfig?: any; faceDataProvider?: HeadTrackingDataProvider },
): Promise<World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }>> {
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

    const faceConfig = extraArgs?.faceConfig;
    let faceDataProvider = extraArgs?.faceDataProvider;
    faceDataProvider = faceDataProvider ?? new HeadTrackingDataProvider(p, 120, 650, false, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 300 }, faceConfig);

    const loader = new P5AssetLoader(p);
    const gp = new P5GraphicProcessor(p, loader);
    const dataProviderLib: { headTracker: HeadTrackingDataProvider } = { headTracker: faceDataProvider };
    const world = new World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }>(
        WorldSettings.fromLibs({clock, loader, dataProviderLib})
    );

    world.enableDefaultPerspective(config.width, config.height, Math.PI / 2);

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'camera-square',
        width: 50,
        position:  { x:0, y:0, z: 300 },
        fillColor: { red: 255, green: 255, blue: 255 },
        strokeColor: { red: 0, green: 0, blue: 255 },
        strokeWidth: 1,
    });
    world.addCylinder({
        id: 'camera-front',
        type: ELEMENT_TYPES.CYLINDER,
        targetId: 'camera-square',
        radius: 10,
        rotate: {pitch: Math.PI/2, roll: 0, yaw: 0},
        height: 20,
        position:  { x:0, y:0, z: -40 },
        fillColor: { red: 255, green: 255, blue: 255 },
        strokeColor: { red: 0, green: 0, blue: 255 },
        strokeWidth: 1
    });

    world.setScreen({
        id: STANDARD_PROJECTION_IDS.SCREEN,
        type: PROJECTION_TYPES.SCREEN,
        lookMode: LOOK_MODES.ROTATION,
        modifiers: {
            carModifiers: [],
            stickModifiers: []
        }
    });

    const boxSize = 15;

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'bigBox',
        width: 500,
        position: { x:0, y:0, z: -200},
        rotate: {pitch: 0, roll: 0, yaw: Math.PI/4},
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'faceBox',
        targetId: 'bigBox',
        width: 150,
        height: 180,
        depth: 100,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return {
                x: face.midpoint.x,
                y: face.midpoint.y,
                z: face.midpoint.z
            };
        },
        rotate: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { pitch: 0, yaw: 0, roll: 0 };
            return {
                yaw:   face.stick.yaw,
                pitch: face.stick.pitch,
                roll:  face.stick.roll,
            };
        },
        strokeWidth: 2,
        strokeColor: {red:255, green: 0, blue: 0},
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'debug_nose',
        targetId: 'faceBox',
        width: boxSize,
        height: boxSize,
        depth: boxSize,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return face.nose;
        },
        fillColor: COLORS.red,
        strokeWidth: 1,
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'debug_leftEye',
        targetId: 'faceBox',
        width: boxSize,
        height: boxSize,
        depth: boxSize,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return {
                x: face.eyes.left.x,
                y: face.eyes.left.y,
                z: face.eyes.left.z,
            }
        },
        fillColor: { red: 0, green: 255, blue: 0 },
        strokeWidth: 1,
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'debug_rightEye',
        targetId: 'faceBox',
        width: boxSize,
        height: boxSize,
        depth: boxSize,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return face.eyes.right;
        },
        fillColor: { red: 0, green: 0, blue: 255 },
        strokeWidth: 1,
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'debug_boundsLeft',
        targetId: 'faceBox',
        width: boxSize,
        height: boxSize,
        depth: boxSize,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return face.bounds.left;
        },
        fillColor: { red: 255, green: 255, blue: 0 },
        strokeWidth: 1,
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'debug_boundsRight',
        targetId: 'faceBox',
        width: boxSize,
        height: boxSize,
        depth: boxSize,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return face.bounds.right;
        },
        fillColor: { red: 0, green: 255, blue: 255 },
        strokeWidth: 1,
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'debug_boundsTop',
        targetId: 'faceBox',
        width: boxSize,
        height: boxSize,
        depth: boxSize,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return face.bounds.top;
        },
        fillColor: { red: 255, green: 0, blue: 255 },
        strokeWidth: 1,
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'debug_boundsBottom',
        targetId: 'faceBox',
        width: boxSize,
        height: boxSize,
        depth: boxSize,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return face.bounds.bottom;
        },
        fillColor: { red: 255, green: 165, blue: 0 },
        strokeWidth: 1,
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'nose',
        targetId: 'faceBox',
        width: 50,
        position: { x: 0, y: 0, z: 50 },
        strokeWidth: 4,
        strokeColor: { red: 255, green: 0, blue: 255 },
    });

    world.addSphere({
        type: ELEMENT_TYPES.SPHERE,
        id: 'left-eye',
        targetId: 'faceBox',
        radius: 20,
        position: { x: -25, y: -25, z: 25 },
        alpha: 0.5,
        fillColor: { red: 255, green: 255, blue: 255 },
    });

    world.addSphere({
        type: ELEMENT_TYPES.SPHERE,
        id: 'right-eye',
        targetId: 'faceBox',
        radius: 20,
        position: { x: 25, y: -25, z: 25 },
        alpha: 0.5,
        fillColor: { red: 255, green: 255, blue: 255 },
    });

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
    };

    p.draw = () => {
        if (config.paused && !clock.isPaused()) clock.pause();
        if (!config.paused && clock.isPaused()) clock.resume();

        p.background(20);
        world.step(gp);
    };

    await faceDataProvider.init();

    // Wait for video to be ready
    let videoEl = faceDataProvider.getVideo();
    let waitCount = 0;
    while (!videoEl.success && waitCount < 100) {
        await new Promise(resolve => setTimeout(resolve, 50));
        videoEl = faceDataProvider.getVideo();
        waitCount++;
    }

    world.addPanel({
        type: ELEMENT_TYPES.PANEL,
        targetId: 'bigBox',
        id: 'videoPanel',
        width: 640,
        height: 480,
        position: { x: 0, y: 0, z: 0 },
        video: videoEl.success ? videoEl.value : undefined,
        alpha: 0.5,
        fillColor: videoEl.success ? undefined : { red: 50, green: 50, blue: 50 },
    });
    return world;
}
