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
import type { ColorRGBA, VideoPixels } from "../../../scene/types.ts";
import { EMOTIONS, type Emotion, type FaceExpressions } from "../../../scene/drivers/mediapipe/face_expressions.ts";
import { VideoDataProvider } from "../../../scene/providers/video_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES, LOOK_MODES, PROJECTION_TYPES,
    type SceneUnits,
} from "../../../scene/types.ts";
import {
    DEFAULT_SKETCH_CONFIG,
    type SketchConfig
} from "../sketch_config.ts";
import type { FaceConfig } from "../sketch_engine.types.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";
import {COLORS} from "../../../scene/colors.ts";
import {appAssetPath} from "../../../utils/app_paths.ts";
import {createVideoSelector} from "../tutorial-8/tutorial_observer.ts";

const FALLBACK_VIDEO_URL = appAssetPath("video/heads.mp4");
const VIDEO_SOURCE_ORDER = ["webCam", "video"] as const;

/**
 * TUTORIAL: Facial Expressions
 *
 * A face that copies yours: blinking eyes, an opening mouth and a smile, with the head
 * colored by the emotion the face tracker reads.
 */
export const expressions_explanation = `
<div class="concept">
<p>Besides <em>where</em> your head is, MediaPipe also reports <strong>what your face is doing</strong>: 52 expression scores (blendshapes) such as how open each eye is, how open the mouth is, or how much you smile. This tutorial draws a simple face on your head that copies them - blink, open your mouth, smile - and colors the head by the emotion it reads. Like the observer in tutorial 8, it falls back to a prerecorded clip when the camera is not available.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Normalized expressions</strong> - <code>ctx.dataProviders['headTracker'].expressions</code> gives each value from 0 to 1, where a neutral face is the start: <code>leftEyeOpen</code> / <code>rightEyeOpen</code> (1 open, 0 closed), <code>mouthOpen</code> (0 closed, 1 open) and <code>smile</code>.</li>
<li><strong>Raw scores</strong> - <code>headTracker.faceExpressions</code> keeps the scores exactly as MediaPipe gives them. They are 0..1 too, but a neutral face is not 0 (relaxed eyes already read a bit "blinked"), so <code>normalize()</code> stretches each one from its resting value to its full value. <code>score('browInnerUp')</code> reads any of the 52 by name.</li>
<li><strong>Emotions</strong> - <code>happy</code>, <code>sad</code>, <code>angry</code>, <code>surprised</code> and <code>sleepy</code> (0..1), and <code>emotion</code>, the strongest one or <code>'neutral'</code>. They read deliberate faces - make a face at the camera - not what someone feels. The head takes the emotion's color.</li>
<li><strong>Readout</strong> - the corner panel shows each value raw and normalized, so you can see what the scene receives.</li>
</ol>

<p>Single frames are noisy - a blink reads as sleepy for a moment - and everyone's resting face is a little different. The <a href="../../showroom/emotion-game/index.html">Emotion Game</a> in the showroom builds on this: it calibrates on your own neutral face, smooths over time, and draws the face as an emoji.</p>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Blendshapes</span>
<span class="key-term">Expressions</span>
<span class="key-term">Normalize</span>
<span class="key-term">Emotion</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-8">The Observer</a>
</div>
`;

/** Eye height: a thin line when closed, 50 when fully open. */
export function eyeHeight(open: number): number {
    return 4 + 46 * open;
}

/** Mouth: wider with the smile, taller as it opens. */
export function mouthSize(expressions: FaceExpressions | null | undefined): { width: number; height: number } {
    const smile = expressions?.smile ?? 0;
    const open = expressions?.mouthOpen ?? 0;
    return { width: 90 + 90 * smile, height: 8 + 100 * open };
}

/** Head color for each emotion; silver when neutral. */
export const EMOTION_COLORS: Record<Emotion | 'neutral', ColorRGBA> = {
    neutral: COLORS.silver as ColorRGBA,
    happy: COLORS.lime as ColorRGBA,
    sad: { red: 60, green: 110, blue: 255 } as ColorRGBA,
    angry: COLORS.red as ColorRGBA,
    surprised: COLORS.magenta as ColorRGBA,
    sleepy: COLORS.purple as ColorRGBA,
};

export async function tutorial_expressions(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: {
        faceConfig?: FaceConfig;
        faceDataProvider?: HeadTrackingDataProvider;
        webCamProvider?: WebCamDataProvider;
        graphicProcessor?: P5GraphicProcessor;
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

    const videoWidthPixels = 1920 as VideoPixels;
    const videoHeightPixels = 1080 as VideoPixels;
    const headWidthPercent = 1 / 4;
    const headWidthPixels = (headWidthPercent * videoWidthPixels) as VideoPixels;
    const panelPosition = { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits };
    const screenPosition = { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 1500 as SceneUnits };
    const baselineHeadSceneUnits = 300 as SceneUnits;

    const headTrackingConfig: Partial<HeadTrackingDataProviderConfig> = {
        ...( extraArgs?.faceConfig ?? {} ),
        videoWidthPixels: videoWidthPixels,
        videoHeightPixels: videoHeightPixels,
        mirror: false,
        baseline: panelPosition,
        cameraPosition: screenPosition,
        baselineHeadPixels: headWidthPixels,
        baselineHeadSceneUnits: baselineHeadSceneUnits,
        sceneScreenWidth: baselineHeadSceneUnits / headWidthPercent as SceneUnits,
        depthScale: 1,
    }

    const webCamProvider = extraArgs?.webCamProvider ?? new WebCamDataProvider(p, videoWidthPixels, videoHeightPixels);

    const fallbackVideoProvider = new VideoDataProvider(p, FALLBACK_VIDEO_URL, {
        loop: true,
        // Only when the camera is not delivering: the clip waits, and the draw loop starts
        // and stops it as the camera comes and goes.
        autoplay: false,
        muted: true,
        playsInline: true,
    });
    const fallbackVideo = (fallbackVideoProvider as any).video;

    const faceDataProvider = extraArgs?.faceDataProvider ?? new HeadTrackingDataProvider(
        p,
        headTrackingConfig,
        VIDEO_SOURCE_ORDER,
    );

    const loader = new P5AssetLoader(p);
    let gp: P5GraphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

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

    world.startLoading();

    if (config.paused) {
        world.pause();
    }

    // The expressions of the face the head turned by this frame, for the readout (see below).
    let readoutExpressions: { raw: FaceExpressions; normalized: FaceExpressions } | null = null;

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'bigBox',
        width: 500,
        position: { x:0, y:0, z: 0 },  // screen position
    });

    // The head: follows the tracked head like the faceBox of tutorial 8, colored by the emotion.
    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'head',
        parentId: 'bigBox',
        width: baselineHeadSceneUnits,
        height: baselineHeadSceneUnits * 1.4,
        depth: baselineHeadSceneUnits * 0.6,
        position: (ctx) => ctx.dataProviders['headTracker']?.worldPosition ?? { x: 0, y: 0, z: 0 },
        rotate: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            readoutExpressions = face?.faceExpressions && face.expressions
                ? { raw: face.faceExpressions, normalized: face.expressions }
                : null;
            if (!face) return { pitch: 0, yaw: 0, roll: 0 };
            return { yaw: face.stick.yaw, pitch: face.stick.pitch, roll: face.stick.roll };
        },
        alpha: 0.35,
        fillColor: (ctx) => EMOTION_COLORS[ctx.dataProviders['headTracker']?.expressions?.emotion ?? 'neutral'],
        strokeColor: COLORS.white,
        strokeWidth: 2,
    });

    // The features sit on the front of the head (z = depth / 2), drawn from the expressions.
    const front = baselineHeadSceneUnits * 0.3 + 6;

    for (const side of ['left', 'right'] as const) {
        const x = side === 'left' ? -65 : 65;
        const open = (expressions: FaceExpressions | null | undefined) =>
            !expressions ? 1 : side === 'left' ? expressions.leftEyeOpen : expressions.rightEyeOpen;

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: `${side}-eye`,
            parentId: 'head',
            width: 70,
            height: (ctx) => eyeHeight(open(ctx.dataProviders['headTracker']?.expressions)),
            depth: 6,
            position: { x, y: -55, z: front },
            fillColor: COLORS.white,
            strokeColor: COLORS.black,
            strokeWidth: 2,
        });

        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: `${side}-pupil`,
            parentId: `${side}-eye`,
            // Shrinks away as the eye closes.
            radius: (ctx) => 14 * open(ctx.dataProviders['headTracker']?.expressions),
            position: { x: 0, y: 0, z: 4 },
            fillColor: COLORS.navy,
        });
    }

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'mouth',
        parentId: 'head',
        width: (ctx) => mouthSize(ctx.dataProviders['headTracker']?.expressions).width,
        height: (ctx) => mouthSize(ctx.dataProviders['headTracker']?.expressions).height,
        depth: 6,
        position: { x: 0, y: 95, z: front },
        fillColor: COLORS.red,
        strokeColor: COLORS.black,
        strokeWidth: 2,
    });

    // Readout of the expressions over the canvas's top-right corner: each value raw (as
    // MediaPipe gives it) and normalized (neutral face 0 / full expression 1, what the face
    // above reads from headTracker.expressions). It shows the face the head turned by this
    // frame (kept by its rotate function above) - not faceDataProvider.getData(), which runs
    // detection again.
    let readoutElement: HTMLElement | undefined;
    const updateReadout = () => {
        if (!readoutElement) return;
        const expressions = readoutExpressions;
        const row = (label: string, value: (e: FaceExpressions) => number) => expressions
            ? `${label.padEnd(10)} ${value(expressions.raw).toFixed(2)} -> ${value(expressions.normalized).toFixed(2)}`
            : '';
        const text = expressions
            ? [
                '           raw  -> norm',
                row('left eye', e => e.leftEyeOpen),
                row('right eye', e => e.rightEyeOpen),
                row('mouth', e => e.mouthOpen),
                row('smile', e => e.smile),
                ...EMOTIONS.map(emotion => row(emotion, e => e[emotion])),
                `emotion    ${expressions.normalized.emotion}`,
            ].join('\n')
            : 'expressions: no face';
        if (readoutElement.textContent !== text) readoutElement.textContent = text;
    };

    p.setup = () => {
        const canvas = p.createCanvas(config.width, config.height, p.WEBGL);
        gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);
        const box = (canvas as { elt?: HTMLElement } | undefined)?.elt?.parentElement;
        if (box) {
            box.querySelector('.expressions-readout')?.remove(); // from a previous run of this sketch
            readoutElement = document.createElement('pre');
            readoutElement.className = 'expressions-readout';
            readoutElement.style.cssText = 'position:absolute;top:8px;right:8px;z-index:2;margin:0;padding:6px 10px;border-radius:6px;background:rgba(0,0,0,0.65);color:#fff;font:600 13px/1.35 ui-monospace,Menlo,monospace;pointer-events:none';
            box.appendChild(readoutElement);
        }
    };

    let initialized = false;
    let rendering = false;
    p.draw = async () => {
        if (rendering) return;
        rendering = true;
        try {
        if (!gp) {
            return;
        }

        if (!initialized) {
            // Set fallback video capture for face tracking when webcam is not available
            if (typeof (faceDataProvider as any).setFallbackCapture === 'function') {
                (faceDataProvider as any).setFallbackCapture(fallbackVideo);
            }

            await faceDataProvider.init();
            world.complete();

            world.addPanel({
                type: ELEMENT_TYPES.PANEL,
                alpha: 0.5,
                parentId: 'bigBox',
                id: 'videoPanel',
                width: 1920,
                height: 1080,
                mirrorTextureHorizontal: true,
                position: panelPosition,
                video: createVideoSelector(fallbackVideo),
                fillColor: COLORS.white,
            });

            initialized = true;
            return;
        }

        if (config.paused && !world.isPaused()) {
            world.pause();
            fallbackVideoProvider.pause();
            // Don't clear background - keep last frame visible
            return;
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }

        // The replacement clip runs only while the camera is not delivering: behind a working
        // webcam it must not keep playing (not even without a sound, and not on a phone).
        if (webCamProvider.getStatus() === 'READY') {
            fallbackVideoProvider.pause();
        } else {
            fallbackVideoProvider.play();
        }

        p.background(20);
        const result = await world.step(gp);
        updateReadout();
        if (!result.running) return;
        } finally {
            rendering = false;
        }
    };

    return world;
}
