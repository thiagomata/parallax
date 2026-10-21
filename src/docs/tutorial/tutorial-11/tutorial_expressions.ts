import p5 from 'p5';
import { World } from "../../../scene/world.ts";
import { P5GraphicProcessor } from "../../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../../scene/scene_clock.ts";
import {
    HeadTrackingDataProvider,
    type FaceWorldData,
    type HeadTrackingDataProviderConfig,
    type ObserverDataProviderLib
} from "../../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../../scene/providers/web_cam_data_provider.ts";
import type { ColorRGBA, VideoPixels } from "../../../scene/types.ts";
import {
    EMOTIONS, FaceExpressions, calibratedRanges, type Emotion, type ExpressionRanges, type FaceMeasures,
} from "../../../scene/drivers/mediapipe/face_expressions.ts";
import { VideoDataProvider } from "../../../scene/providers/video_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES, LOOK_MODES, PROJECTION_TYPES,
    type ResolutionContext,
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
 * A face that copies yours: blinking eyes, an opening mouth, a smile and raised brows,
 * all driven by the expression data of the face tracker.
 */
export const expressions_explanation = `
<div class="concept">
<p>Besides <em>where</em> your head is, MediaPipe also reports <strong>what your face is doing</strong>: 52 expression scores (blendshapes) such as how open each eye is, how open the mouth is, or how much you smile. This tutorial draws a simple face on your head that copies them - blink, open your mouth, smile and raise your brows. Like the observer in tutorial 8, it falls back to a prerecorded clip when the camera is not available.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Normalized expressions</strong> - <code>ctx.dataProviders['headTracker'].expressions</code> gives each value from 0 to 1, where a neutral face is the start: <code>leftEyeOpen</code> / <code>rightEyeOpen</code> (1 open, 0 closed), <code>mouthOpen</code> (0 closed, 1 open) and <code>smile</code>.</li>
<li><strong>Raw scores</strong> - <code>headTracker.faceExpressions</code> keeps the scores exactly as MediaPipe gives them. They are 0..1 too, but a neutral face is not 0 (relaxed eyes already read a bit "blinked"), so <code>normalize()</code> stretches each one from its resting value to its full value.</li>
<li><strong>Emotions</strong> - <code>happy</code>, <code>sad</code>, <code>angry</code> and <code>surprised</code> (0..1), and <code>emotion</code> names the strongest one, or <code>'neutral'</code>. The head takes its color. The eyes and brows say which emotion - brows drawn down for angry, white showing above the iris for surprised, inner brows raised for sad - and an open mouth (or, for sad, mouth corners pulled down) only makes it stronger; the smile is the exception that defines happy, and only counts with the mouth open wide when the corners go up. Disgust and fear are not modeled: they read as their nearest emotion, angry and surprised. Some of these come from the landmarks rather than the 52 scores (<code>browsLow</code>, <code>eyesWide</code>, <code>lipsApart</code>), because MediaPipe reads an angry mouth as a smile and barely reports wide eyes. They read deliberate faces - make a face at the camera - not what someone feels.</li>
<li><strong>Calibration</strong> - press <kbd>N</kbd> with a relaxed face: the tutorial averages a few frames into your neutral face (<code>FaceExpressions.average</code>) and from then on reads the expressions with <code>calibratedRanges(neutral)</code>, counting from your own face instead of from ranges wide enough for everyone's - which catches the small movements of a real frown.</li>
<li><strong>Every score by name</strong> - <code>expressions.score('browInnerUp')</code> reads any of the 52 scores; this tutorial lifts the brows with it.</li>
<li><strong>Readout</strong> - the corner panel shows each value raw and normalized, so you can see what the scene receives.</li>
</ol>

<p>Looking down also lowers the eyelids, so the eyes can read half closed while you look at the bottom of the screen.</p>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Blendshapes</span>
<span class="key-term">Expressions</span>
<span class="key-term">Normalize</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-8">The Observer</a>
</div>
`;

const NEUTRAL = {
    leftEyeOpen: 1, rightEyeOpen: 1, mouthOpen: 0,
    happy: 0, sad: 0, angry: 0, surprised: 0,
};

export type FaceShape = typeof NEUTRAL;

/**
 * The expression values this face shows: the normalized expressions of the tracked face,
 * or a neutral face (eyes open, mouth closed) when there is none.
 */
export function faceShape(expressions: FaceExpressions | null | undefined): FaceShape {
    if (!expressions) return NEUTRAL;
    return {
        leftEyeOpen: expressions.leftEyeOpen,
        rightEyeOpen: expressions.rightEyeOpen,
        // Bared teeth part the lips without dropping the jaw, so take whichever is more open.
        mouthOpen: Math.max(expressions.mouthOpen, expressions.lipsApart),
        happy: expressions.happy,
        sad: expressions.sad,
        angry: expressions.angry,
        surprised: expressions.surprised,
    };
}

/** Eye height: a thin line when closed, 50 when fully open. */
export function eyeHeight(open: number): number {
    return 4 + 46 * open;
}

/**
 * A brow: raised high when surprised, a little when sad, lowered when angry; tilted with the
 * inner end down when angry and up when sad. roll turns the brow on the face (the head's
 * local frame, y down), so the side decides which way lifts the inner end.
 */
export function browPose(shape: FaceShape, side: 'left' | 'right'): { y: number; roll: number } {
    const innerEndDown = 0.45 * shape.angry - 0.4 * shape.sad;
    return {
        y: -105 - 40 * shape.surprised - 10 * shape.sad + 15 * shape.angry,
        // The left brow's inner end points to +x, which a positive roll turns down (y grows).
        roll: side === 'left' ? innerEndDown : -innerEndDown,
    };
}

/**
 * The mouth: a center piece and two corners. The corners turn up with happy and down with
 * sad; surprised makes a narrow, tall O; angry a wide, flat line. Opening the mouth makes it taller.
 */
export function mouthPose(shape: FaceShape): { width: number; height: number; cornerWidth: number; cornerY: number; cornerRoll: number } {
    const cornersUp = shape.happy - shape.sad;
    return {
        // The corners fold away into the O of surprise.
        cornerWidth: Math.max(1, 30 * (1 - shape.surprised)),
        width: Math.max(30, 70 + 40 * shape.happy + 30 * shape.angry - 40 * shape.surprised),
        height: 8 + 70 * shape.mouthOpen + 30 * shape.surprised - 4 * shape.angry,
        cornerY: -14 * cornersUp,
        // The left corner's outer end points to -x, which a positive roll turns up (y falls).
        cornerRoll: 0.6 * cornersUp,
    };
}

/** Head color for each emotion; silver when neutral. */
export const EMOTION_COLORS: Record<Emotion | 'neutral', ColorRGBA> = {
    neutral: COLORS.silver as ColorRGBA,
    happy: COLORS.lime as ColorRGBA,
    sad: { red: 60, green: 110, blue: 255 } as ColorRGBA,
    angry: COLORS.red as ColorRGBA,
    surprised: COLORS.magenta as ColorRGBA,
};

/** Mouth color: red, turning pink as the smile grows. */
export function mouthColor(smile: number): ColorRGBA {
    smile = Math.max(0, Math.min(1, smile));
    const mix = (from: number, to: number) => Math.round(from + (to - from) * smile) as ColorRGBA['red'];
    return { red: mix(200, 255), green: mix(30, 120), blue: mix(40, 180) };
}

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
        autoplay: true,
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

    // Calibration: N with a relaxed face averages the next CALIBRATION_FRAMES frames into this
    // person's neutral face; from then on the expressions count from it (calibratedRanges)
    // instead of from ranges that have to fit everyone's resting face.
    const CALIBRATION_FRAMES = 20;
    let calibration: ExpressionRanges | null = null;
    let calibrationFrames: FaceExpressions[] | null = null;
    let lastRaw: FaceExpressions | null = null;
    let lastCalibrated: FaceExpressions | null = null;

    /** The normalized expressions of the tracked face - calibrated once N has been pressed. */
    const expressionsOf = (face: FaceWorldData | null | undefined): FaceExpressions | null => {
        const raw = face?.faceExpressions;
        if (!raw) return null;
        if (!calibration) return face.expressions;
        if (raw !== lastRaw) {
            lastRaw = raw;
            lastCalibrated = raw.withRanges(calibration).normalize();
        }
        return lastCalibrated;
    };

    const collectCalibrationFrame = (raw: FaceExpressions | null | undefined) => {
        if (!calibrationFrames || !raw || calibrationFrames.includes(raw)) return;
        calibrationFrames.push(raw);
        if (calibrationFrames.length >= CALIBRATION_FRAMES) {
            calibration = calibratedRanges(FaceExpressions.average(calibrationFrames));
            calibrationFrames = null;
            lastRaw = null;
        }
    };

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'bigBox',
        width: 500,
        position: { x:0, y:0, z: 0 },  // screen position
    });

    // The head: follows the tracked head like the faceBox of tutorial 8.
    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'head',
        parentId: 'bigBox',
        width: baselineHeadSceneUnits,
        height: baselineHeadSceneUnits * 1.4,
        depth: baselineHeadSceneUnits * 0.6,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return face.worldPosition;
        },
        rotate: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            collectCalibrationFrame(face?.faceExpressions);
            const normalized = expressionsOf(face);
            readoutExpressions = face?.faceExpressions && normalized
                ? { raw: face.faceExpressions, normalized }
                : null;
            if (!face) return { pitch: 0, yaw: 0, roll: 0 };
            return {
                yaw:   face.stick.yaw,
                pitch: face.stick.pitch,
                roll:  face.stick.roll,
            };
        },
        alpha: 0.35,
        fillColor: (ctx) => EMOTION_COLORS[expressionsOf(ctx.dataProviders['headTracker'])?.emotion ?? 'neutral'],
        strokeColor: COLORS.white,
        strokeWidth: 2,
    });

    // The features sit on the front of the head (z = depth / 2), drawn from the expressions.
    const front = baselineHeadSceneUnits * 0.3 + 6;

    for (const side of ['left', 'right'] as const) {
        const x = side === 'left' ? -65 : 65;
        const open = (shape: FaceShape) => side === 'left' ? shape.leftEyeOpen : shape.rightEyeOpen;

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: `${side}-eye`,
            parentId: 'head',
            width: 70,
            height: (ctx) => eyeHeight(open(faceShape(expressionsOf(ctx.dataProviders['headTracker'])))),
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
            radius: (ctx) => 14 * open(faceShape(expressionsOf(ctx.dataProviders['headTracker']))),
            position: { x: 0, y: 0, z: 4 },
            fillColor: COLORS.navy,
        });

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: `${side}-brow`,
            parentId: 'head',
            width: 80,
            height: 12,
            depth: 6,
            position: (ctx) => ({
                x,
                y: browPose(faceShape(expressionsOf(ctx.dataProviders['headTracker'])), side).y,
                z: front,
            }),
            rotate: (ctx) => ({
                yaw: 0,
                pitch: 0,
                roll: browPose(faceShape(expressionsOf(ctx.dataProviders['headTracker'])), side).roll,
            }),
            // Dark, so the brows read on every emotion color of the head.
            fillColor: { red: 40, green: 25, blue: 20 },
            strokeWidth: 0,
        });
    }

    world.addPyramid({
        type: ELEMENT_TYPES.PYRAMID,
        id: 'nose',
        parentId: 'head',
        baseSize: 40,
        height: 40,
        position: { x: 0, y: 15, z: front + 20 },
        rotate: {roll: 0, pitch: - Math.PI / 2, yaw: 0,},
        fillColor: COLORS.pink,
        strokeWidth: 1,
    });

    const mouth = (ctx: ResolutionContext<ObserverDataProviderLib>) =>
        faceShape(expressionsOf(ctx.dataProviders['headTracker']));

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'mouth',
        parentId: 'head',
        width: (ctx) => mouthPose(mouth(ctx)).width,
        height: (ctx) => mouthPose(mouth(ctx)).height,
        depth: 6,
        position: { x: 0, y: 95, z: front },
        fillColor: (ctx) => mouthColor(mouth(ctx).happy),
        strokeColor: COLORS.black,
        strokeWidth: 2,
    });

    // The corners hang off the ends of the mouth and tilt with happy (up) and sad (down).
    for (const side of ['left', 'right'] as const) {
        const sign = side === 'left' ? -1 : 1;
        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: `mouth-${side}-corner`,
            parentId: 'mouth',
            width: (ctx) => mouthPose(mouth(ctx)).cornerWidth,
            height: 8,
            depth: 6,
            position: (ctx) => {
                const pose = mouthPose(mouth(ctx));
                return { x: sign * (pose.width + pose.cornerWidth) / 2, y: pose.cornerY, z: 0 };
            },
            rotate: (ctx) => ({ yaw: 0, pitch: 0, roll: -sign * mouthPose(mouth(ctx)).cornerRoll }),
            fillColor: (ctx) => mouthColor(mouth(ctx).happy),
            strokeColor: COLORS.black,
            strokeWidth: 2,
        });
    }

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
        // The landmark measures show their raw distance (a fraction of the face width), so the
        // ranges in DEFAULT_EXPRESSION_RANGES can be checked against a live face.
        const measureRow = (label: string, measure: keyof FaceMeasures, value: (e: FaceExpressions) => number) => expressions
            ? `${label.padEnd(10)} ${expressions.raw.measures?.[measure]?.toFixed(3) ?? ' n/a '} -> ${value(expressions.normalized).toFixed(2)}`
            : '';
        const status = calibration
            ? 'calibrated (N: again)'
            : calibrationFrames ? 'calibrating: relax...' : 'N: calibrate, relaxed';
        const text = expressions
            ? [
                status,
                '           raw  -> norm',
                row('left eye', e => e.leftEyeOpen),
                row('right eye', e => e.rightEyeOpen),
                row('mouth', e => e.mouthOpen),
                row('smile', e => e.smile),
                row('brows up', e => e.score('browInnerUp')),
                row('brows down', e => (e.score('browDownLeft') + e.score('browDownRight')) / 2),
                measureRow('brows low', 'browInnerToOuter', e => e.browsLow),
                measureRow('brows rais', 'browInnerToOuter', e => e.browsRaised),
                measureRow('eyes wide', 'whiteAboveIris', e => e.eyesWide),
                measureRow('lips apart', 'lipGap', e => e.lipsApart),
                measureRow('mouth wide', 'lipGap', e => e.mouthWideOpen),
                measureRow('corners', 'cornerLift', e => e.cornersUp - e.cornersDown),
                measureRow('head tilt', 'headPitch', e => e.headTiltedAway),
                ...EMOTIONS.map(emotion => row(emotion, e => e[emotion])),
                `emotion    ${expressions.normalized.emotion}`,
            ].join('\n')
            : `${status}\nexpressions: no face`;
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

    p.keyPressed = () => {
        if (p.key === 'n' || p.key === 'N') {
            calibrationFrames = [];
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
            fallbackVideo.pause();
            // Don't clear background - keep last frame visible
            return;
        } else if (!config.paused && world.isPaused()) {
            world.resume();
            fallbackVideo.loop();
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
