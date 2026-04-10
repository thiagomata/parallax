import p5 from 'p5';
import { World } from "../../../scene/world.ts";
import { P5GraphicProcessor } from "../../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../../scene/scene_clock.ts";
import {
    HeadTrackingDataProvider,
    type HeadTrackingDataProviderConfig,
    type ObserverDataProviderLib
} from "../../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../../scene/providers/web_cam_data_provider.ts";
import { VideoDataProvider } from "../../../scene/providers/video_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES, LOOK_MODES, PROJECTION_TYPES,
    type ResolutionContext,
} from "../../../scene/types.ts";
import {
    DEFAULT_SKETCH_CONFIG,
    type SketchConfig
} from "../sketch_config.ts";
import type { FaceConfig } from "../sketch_engine.types.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";
import {COLORS} from "../../../scene/colors.ts";
// import {CenterOrbit} from "../../../scene/presets.ts";

const FALLBACK_VIDEO_URL = "/parallax/video/heads.mp4";
const VIDEO_SOURCE_ORDER = ["webCam", "video"] as const;

/**
 * TUTORIAL: The Observer
 * 
 * Visualize how the engine tracks your face using MediaPipe face mesh.
 */
export const observer_explanation = `
<div class="concept">
<p>The parallax engine uses <strong>MediaPipe Face Mesh</strong> to detect 468 facial landmarks in real-time from your webcam. This tutorial visualizes all the tracked data including the face bounding box, nose position, eye positions, and face orientation (yaw, pitch, roll). If camera access is blocked, it can fall back to a prerecorded demo clip so the panel and face-following behavior still make sense.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>HeadTrackingDataProvider</strong> - Initializes MediaPipe and processes video frames to extract face landmarks.</li>
<li><strong>Fallback Video</strong> - If the webcam is unavailable, the tutorial can switch to a looping MP4 demo source instead of leaving a blank panel.</li>
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
    extraArgs?: {
        faceConfig?: FaceConfig;
        faceDataProvider?: HeadTrackingDataProvider;
        webCamProvider?: WebCamDataProvider
    },
): Promise<World<P5Bundler, any, any, ObserverDataProviderLib>> {
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        debug: false,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 100000,
            isLoop: true
        },
    });


    const videoWidthPixels = 1920;
    const videoHeightPixels = 1080;
    const headWidthPercent = 60 / 100;
    const headWidthPixels = headWidthPercent * videoWidthPixels;
    const panelPosition = { x: 0, y: 0, z: 0 };
    const screenPosition = { x: 0, y: 0, z: 950 };

    let headTrackingConfig: Partial<HeadTrackingDataProviderConfig> = {
        ...( extraArgs?.faceConfig ?? {} ),
        videoWidthPixels: videoWidthPixels,
        videoHeightPixels: videoHeightPixels,
        mirror: false,
        panelPosition: panelPosition,
        cameraPosition: screenPosition,
        sceneHeadWidthPixels: headWidthPixels,
    }

    let webCamProvider = extraArgs?.webCamProvider;
    webCamProvider = webCamProvider ?? new WebCamDataProvider(p, videoWidthPixels, videoHeightPixels);
    
    // Create video via VideoDataProvider - this is the ONE video element we use
    const fallbackVideoProvider = new VideoDataProvider(p, FALLBACK_VIDEO_URL, {
        loop: true,
        autoplay: true,
        muted: true,
        playsInline: true,
    });
    
    // Get the p5 video element from provider for panel display and face tracking
    const fallbackVideo = (fallbackVideoProvider as any).video;

    let faceDataProvider = extraArgs?.faceDataProvider;
    faceDataProvider = faceDataProvider ?? new HeadTrackingDataProvider(
        p,
        headTrackingConfig,
        VIDEO_SOURCE_ORDER,
    );

    const loader = new P5AssetLoader(p);
    let gp: P5GraphicProcessor;
    
    p.setup = () => {
        p.createCanvas(config.width, config.height, p5.WEBGL);
        gp = new P5GraphicProcessor(p, loader);
    };
    const dataProviderLib: ObserverDataProviderLib = {
        webCam: webCamProvider, // needed as parent dependency for headTracker
        video: fallbackVideoProvider,
        headTracker: faceDataProvider,
    };
    const world = new World<P5Bundler, any, any, ObserverDataProviderLib>(
        WorldSettings.fromLibs({clock, loader, dataProviderLib})
    );
    world.setScreen({
        id: 'screen',
        type: PROJECTION_TYPES.SCREEN,
        position: screenPosition,
        direction: {x: 0, y: 0, z: 1},
        lookMode: LOOK_MODES.ROTATION,
        rotation: {yaw: 0, pitch: 0, roll: 0},
    });
    world.setEye({
        id: 'eye',
        type: PROJECTION_TYPES.EYE,
        parentId: 'screen',
        position: { x: 0, y: 0, z: 10 },
        direction: { x: 0, y: 0, z: -1 },
        lookMode: LOOK_MODES.ROTATION,
        rotation: { yaw: 0, pitch: 0, roll: 0 },
    })
    // world.loadPreset(
    //     CenterOrbit(p,{eyeScreenDistance: 2000, verticalBaseline:-10})
    // );

    world.startLoading();
    // world.enableDefaultPerspective(config.width, config.height, Math.PI / 2);


    if (config.paused) {
        world.pause();
    }

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'camera-square',
        width: 50,
        position:  screenPosition,
        fillColor: { red: 255, green: 255, blue: 255 },
        strokeColor: { red: 0, green: 0, blue: 255 },
        strokeWidth: 1,
    });
    world.addCylinder({
        id: 'camera-front',
        type: ELEMENT_TYPES.CYLINDER,
        parentId: 'camera-square',
        radius: 10,
        rotate: {pitch: Math.PI/2, roll: 0, yaw: 0},
        height: 20,
        position:  { x:0, y:0, z: -40 },
        fillColor: { red: 255, green: 255, blue: 255 },
        strokeColor: { red: 0, green: 0, blue: 255 },
        strokeWidth: 1
    });

    const boxSize = 15;

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'bigBox',
        width: 500,
        position: { x:0, y:0, z: 0 },  // screen position
    });

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'faceBox',
        parentId: 'bigBox',
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
        parentId: 'faceBox',
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
        parentId: 'faceBox',
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
        parentId: 'faceBox',
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
        parentId: 'faceBox',
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
        parentId: 'faceBox',
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
        parentId: 'faceBox',
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
        parentId: 'faceBox',
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

    world.addPyramid({
        type: ELEMENT_TYPES.PYRAMID,
        id: 'nose',
        parentId: 'faceBox',
        baseSize: 20,
        height: 20,
        position: { x: 0, y: 0, z: 50 },
        rotate: {roll: 0, pitch: - Math.PI / 2, yaw: 0,},
        strokeWidth: 4,
        fillColor: COLORS.pink,
        strokeColor: { red: 255, green: 0, blue: 255 },
    });

    world.addSphere({
        type: ELEMENT_TYPES.SPHERE,
        id: 'left-eye',
        parentId: 'faceBox',
        radius: 20,
        position: { x: -25, y: -25, z: 25 },
        alpha: 0.5,
        fillColor: { red: 255, green: 255, blue: 255 },
    });

    world.addSphere({
        type: ELEMENT_TYPES.SPHERE,
        id: 'right-eye',
        parentId: 'faceBox',
        radius: 20,
        position: { x: 25, y: -25, z: 25 },
        alpha: 0.5,
        fillColor: { red: 255, green: 255, blue: 255 },
    });

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);
    };

    let initialized = false;
    p.draw = async () => {
        if (!gp) return;

        if (!initialized) {
            // Set fallback video capture for face tracking when webcam is not available
            if (typeof (faceDataProvider as any).setFallbackCapture === 'function') {
                (faceDataProvider as any).setFallbackCapture(fallbackVideo);
            }

            await faceDataProvider.init();
            world.complete();

            // Add video panel after world.complete()
            // Always show fallback video in panel (webcam is used for face tracking)
            const videoSelector = (ctx: ResolutionContext<ObserverDataProviderLib>) => {
                // Use webcam if available and has a valid node
                const webcamData = ctx.dataProviders.webCam;
                if (webcamData?.node) {
                    return webcamData.node;
                }
                // Fallback to video
                return fallbackVideo;
            };

            world.addPanel({
                type: ELEMENT_TYPES.PANEL,
                parentId: 'bigBox',
                id: 'videoPanel',
                width: 1920,
                height: 1080,
                mirrorTextureHorizontal: true,
                position: { x: 0, y: 0, z: -5000 },
                video: videoSelector,
                fillColor:  COLORS.blue,
            });

            initialized = true;
            return;
        }

        // Simple pause/resume - let video play naturally
        if (config.paused && !world.isPaused()) {
            world.pause();
            fallbackVideo.pause();
            // Don't clear background - keep last frame visible
            return;
        } else if (!config.paused && world.isPaused()) {
            world.resume();
            fallbackVideo.loop();
        }

        // Let video play naturally - just render
        p.background(20);
        const result = await world.step(gp);
        if (!result.running) return;
    };

    return world;
}