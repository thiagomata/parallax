import"../../tutorial-BpTRhyr7.js";import{g as W,D as H,S as M,a as L,W as F,H as V,h as _,P as G,b as Y,c as $,e as R,p as z,E as d,C as i}from"../../tutorial.template-CtS8vNKm.js";import{V as K,c as X}from"../../tutorial_observer-C5VRf4_Z.js";import{i as J,a as j}from"../../tutorial_nav-3xZ5Mjb8.js";import"../../tutorial_index_meta-CaOd1-g9.js";const q=W("video/heads.mp4"),Q=["webCam","video"],Z=`
<div class="concept">
<p>Besides <em>where</em> your head is, MediaPipe also reports <strong>what your face is doing</strong>: 52 expression scores (blendshapes) such as how open each eye is, how open the mouth is, or how much you smile. This tutorial draws a simple face on your head that copies them - blink, open your mouth, smile and raise your brows. Like the observer in tutorial 8, it falls back to a prerecorded clip when the camera is not available.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Normalized expressions</strong> - <code>ctx.dataProviders['headTracker'].expressions</code> gives each value from 0 to 1, where a neutral face is the start: <code>leftEyeOpen</code> / <code>rightEyeOpen</code> (1 open, 0 closed), <code>mouthOpen</code> (0 closed, 1 open) and <code>smile</code>.</li>
<li><strong>Raw scores</strong> - <code>headTracker.faceExpressions</code> keeps the scores exactly as MediaPipe gives them. They are 0..1 too, but a neutral face is not 0 (relaxed eyes already read a bit "blinked"), so <code>normalize()</code> stretches each one from its resting value to its full value.</li>
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
`,ee={leftEyeOpen:1,rightEyeOpen:1,mouthOpen:0,smile:0,browsUp:0};function p(e){return e?{leftEyeOpen:e.leftEyeOpen,rightEyeOpen:e.rightEyeOpen,mouthOpen:e.mouthOpen,smile:e.smile,browsUp:e.score("browInnerUp")}:ee}function oe(e){return 4+46*e}function I(e){return{width:90+90*e.smile,height:8+100*e.mouthOpen}}function te(e){const a=(n,x)=>Math.round(n+(x-n)*e);return{red:a(200,255),green:a(30,120),blue:a(40,180)}}async function re(e,a=H,n){const x=a.clock??new M({...L,startPaused:a.paused,debug:!1,playback:{...L.playback,duration:1e5,isLoop:!0}}),y=1920,g=1080,b=1/4,D=b*y,v={x:0,y:0,z:0},k={x:0,y:0,z:1500},c=300,U={...n?.faceConfig??{},videoWidthPixels:y,videoHeightPixels:g,mirror:!1,baseline:v,cameraPosition:k,baselineHeadPixels:D,baselineHeadSceneUnits:c,sceneScreenWidth:c/b,depthScale:1},N=n?.webCamProvider??new F(e,y,g),T=new K(e,q,{loop:!0,autoplay:!0,muted:!0,playsInline:!0}),u=T.video,f=n?.faceDataProvider??new V(e,U,Q),w=new G(e);let E=n?.graphicProcessor??new _(e,w);const A={webCam:N,video:T,headTracker:f},s=new Y($.fromLibs({clock:x,loader:w,dataProviderLib:A}));s.setScreen({id:"screen",type:z.SCREEN,position:k,direction:{x:0,y:0,z:1},lookMode:R.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),s.setEye({id:"eye",type:z.EYE,parentId:"screen",position:{x:0,y:0,z:10},direction:{x:0,y:0,z:-1},lookMode:R.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),s.startLoading(),a.paused&&s.pause();let O=null;s.addBox({type:d.BOX,id:"bigBox",width:500,position:{x:0,y:0,z:0}}),s.addBox({type:d.BOX,id:"head",parentId:"bigBox",width:c,height:c*1.4,depth:c*.6,position:o=>{const t=o.dataProviders.headTracker;return t?t.worldPosition:{x:0,y:0,z:0}},rotate:o=>{const t=o.dataProviders.headTracker;return O=t?.faceExpressions&&t.expressions?{raw:t.faceExpressions,normalized:t.expressions}:null,t?{yaw:t.stick.yaw,pitch:t.stick.pitch,roll:t.stick.roll}:{pitch:0,yaw:0,roll:0}},alpha:.35,fillColor:i.silver,strokeColor:i.white,strokeWidth:2});const m=c*.3+6;for(const o of["left","right"]){const t=o==="left"?-65:65,h=r=>o==="left"?r.leftEyeOpen:r.rightEyeOpen;s.addBox({type:d.BOX,id:`${o}-eye`,parentId:"head",width:70,height:r=>oe(h(p(r.dataProviders.headTracker?.expressions))),depth:6,position:{x:t,y:-55,z:m},fillColor:i.white,strokeColor:i.black,strokeWidth:2}),s.addSphere({type:d.SPHERE,id:`${o}-pupil`,parentId:`${o}-eye`,radius:r=>14*h(p(r.dataProviders.headTracker?.expressions)),position:{x:0,y:0,z:4},fillColor:i.navy}),s.addBox({type:d.BOX,id:`${o}-brow`,parentId:"head",width:80,height:10,depth:6,position:r=>({x:t,y:-105-40*p(r.dataProviders.headTracker?.expressions).browsUp,z:m}),fillColor:i.brown,strokeWidth:0})}s.addPyramid({type:d.PYRAMID,id:"nose",parentId:"head",baseSize:40,height:40,position:{x:0,y:15,z:m+20},rotate:{roll:0,pitch:-Math.PI/2,yaw:0},fillColor:i.pink,strokeWidth:1}),s.addBox({type:d.BOX,id:"mouth",parentId:"head",width:o=>I(p(o.dataProviders.headTracker?.expressions)).width,height:o=>I(p(o.dataProviders.headTracker?.expressions)).height,depth:6,position:{x:0,y:95,z:m},fillColor:o=>te(p(o.dataProviders.headTracker?.expressions).smile),strokeColor:i.black,strokeWidth:2});let l;const B=()=>{if(!l)return;const o=O,t=(r,C)=>o?`${r.padEnd(10)} ${C(o.raw).toFixed(2)} -> ${C(o.normalized).toFixed(2)}`:"",h=o?["           raw  -> norm",t("left eye",r=>r.leftEyeOpen),t("right eye",r=>r.rightEyeOpen),t("mouth",r=>r.mouthOpen),t("smile",r=>r.smile),t("brows up",r=>r.score("browInnerUp"))].join(`
`):"expressions: no face";l.textContent!==h&&(l.textContent=h)};e.setup=()=>{const o=e.createCanvas(a.width,a.height,e.WEBGL);E=n?.graphicProcessor??new _(e,w);const t=o?.elt?.parentElement;t&&(t.querySelector(".expressions-readout")?.remove(),l=document.createElement("pre"),l.className="expressions-readout",l.style.cssText="position:absolute;top:8px;right:8px;z-index:2;margin:0;padding:6px 10px;border-radius:6px;background:rgba(0,0,0,0.65);color:#fff;font:600 13px/1.35 ui-monospace,Menlo,monospace;pointer-events:none",t.appendChild(l))};let S=!1,P=!1;return e.draw=async()=>{if(!P){P=!0;try{if(!E)return;if(!S){typeof f.setFallbackCapture=="function"&&f.setFallbackCapture(u),await f.init(),s.complete(),s.addPanel({type:d.PANEL,alpha:.5,parentId:"bigBox",id:"videoPanel",width:1920,height:1080,mirrorTextureHorizontal:!0,position:v,video:X(u),fillColor:i.white}),S=!0;return}if(a.paused&&!s.isPaused()){s.pause(),u.pause();return}else!a.paused&&s.isPaused()&&(s.resume(),u.loop());e.background(20);const o=await s.step(E);if(B(),!o.running)return}finally{P=!1}}},s}const se=`import p5 from 'p5';
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
import type { FaceExpressions } from "../../../scene/drivers/mediapipe/face_expressions.ts";
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
 * A face that copies yours: blinking eyes, an opening mouth, a smile and raised brows,
 * all driven by the expression data of the face tracker.
 */
export const expressions_explanation = \`
<div class="concept">
<p>Besides <em>where</em> your head is, MediaPipe also reports <strong>what your face is doing</strong>: 52 expression scores (blendshapes) such as how open each eye is, how open the mouth is, or how much you smile. This tutorial draws a simple face on your head that copies them - blink, open your mouth, smile and raise your brows. Like the observer in tutorial 8, it falls back to a prerecorded clip when the camera is not available.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Normalized expressions</strong> - <code>ctx.dataProviders['headTracker'].expressions</code> gives each value from 0 to 1, where a neutral face is the start: <code>leftEyeOpen</code> / <code>rightEyeOpen</code> (1 open, 0 closed), <code>mouthOpen</code> (0 closed, 1 open) and <code>smile</code>.</li>
<li><strong>Raw scores</strong> - <code>headTracker.faceExpressions</code> keeps the scores exactly as MediaPipe gives them. They are 0..1 too, but a neutral face is not 0 (relaxed eyes already read a bit "blinked"), so <code>normalize()</code> stretches each one from its resting value to its full value.</li>
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
\`;

const NEUTRAL = { leftEyeOpen: 1, rightEyeOpen: 1, mouthOpen: 0, smile: 0, browsUp: 0 };

/**
 * The expression values this face shows: the normalized expressions of the tracked face,
 * or a neutral face (eyes open, mouth closed) when there is none.
 */
export function faceShape(expressions: FaceExpressions | null | undefined): typeof NEUTRAL {
    if (!expressions) return NEUTRAL;
    return {
        leftEyeOpen: expressions.leftEyeOpen,
        rightEyeOpen: expressions.rightEyeOpen,
        mouthOpen: expressions.mouthOpen,
        smile: expressions.smile,
        browsUp: expressions.score('browInnerUp'),
    };
}

/** Eye height: a thin line when closed, 50 when fully open. */
export function eyeHeight(open: number): number {
    return 4 + 46 * open;
}

/** Mouth: wider with the smile, taller as it opens. */
export function mouthSize(shape: typeof NEUTRAL): { width: number; height: number } {
    return { width: 90 + 90 * shape.smile, height: 8 + 100 * shape.mouthOpen };
}

/** Mouth color: red, turning pink as the smile grows. */
export function mouthColor(smile: number): ColorRGBA {
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
            readoutExpressions = face?.faceExpressions && face.expressions
                ? { raw: face.faceExpressions, normalized: face.expressions }
                : null;
            if (!face) return { pitch: 0, yaw: 0, roll: 0 };
            return {
                yaw:   face.stick.yaw,
                pitch: face.stick.pitch,
                roll:  face.stick.roll,
            };
        },
        alpha: 0.35,
        fillColor: COLORS.silver,
        strokeColor: COLORS.white,
        strokeWidth: 2,
    });

    // The features sit on the front of the head (z = depth / 2), drawn from the expressions.
    const front = baselineHeadSceneUnits * 0.3 + 6;

    for (const side of ['left', 'right'] as const) {
        const x = side === 'left' ? -65 : 65;
        const open = (shape: typeof NEUTRAL) => side === 'left' ? shape.leftEyeOpen : shape.rightEyeOpen;

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: \`\${side}-eye\`,
            parentId: 'head',
            width: 70,
            height: (ctx) => eyeHeight(open(faceShape(ctx.dataProviders['headTracker']?.expressions))),
            depth: 6,
            position: { x, y: -55, z: front },
            fillColor: COLORS.white,
            strokeColor: COLORS.black,
            strokeWidth: 2,
        });

        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: \`\${side}-pupil\`,
            parentId: \`\${side}-eye\`,
            // Shrinks away as the eye closes.
            radius: (ctx) => 14 * open(faceShape(ctx.dataProviders['headTracker']?.expressions)),
            position: { x: 0, y: 0, z: 4 },
            fillColor: COLORS.navy,
        });

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: \`\${side}-brow\`,
            parentId: 'head',
            width: 80,
            height: 10,
            depth: 6,
            position: (ctx) => ({
                x,
                y: -105 - 40 * faceShape(ctx.dataProviders['headTracker']?.expressions).browsUp,
                z: front,
            }),
            fillColor: COLORS.brown,
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

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'mouth',
        parentId: 'head',
        width: (ctx) => mouthSize(faceShape(ctx.dataProviders['headTracker']?.expressions)).width,
        height: (ctx) => mouthSize(faceShape(ctx.dataProviders['headTracker']?.expressions)).height,
        depth: 6,
        position: { x: 0, y: 95, z: front },
        fillColor: (ctx) => mouthColor(faceShape(ctx.dataProviders['headTracker']?.expressions).smile),
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
            ? \`\${label.padEnd(10)} \${value(expressions.raw).toFixed(2)} -> \${value(expressions.normalized).toFixed(2)}\`
            : '';
        const text = expressions
            ? [
                '           raw  -> norm',
                row('left eye', e => e.leftEyeOpen),
                row('right eye', e => e.rightEyeOpen),
                row('mouth', e => e.mouthOpen),
                row('smile', e => e.smile),
                row('brows up', e => e.score('browInnerUp')),
            ].join('\\n')
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
`,ae=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0,ie=ae?void 0:{throttleThreshold:0,videoWidth:640,videoHeight:480};J("tutorial-11","11. Facial Expressions",re,se,Z,{},ie);j();
//# sourceMappingURL=tutorial-11-ce4RpquE.js.map
