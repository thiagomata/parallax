import"../../tutorial-BXGzkH4k.js";import{g as H,C as s,D as W,S as U,a as C,W as M,H as F,h as L,P as V,b as G,c as Y,e as _,l as R,E as c,m as $}from"../../tutorial.template-ahFItfn2.js";import{V as K,c as X}from"../../tutorial_observer-DMJOnhqM.js";import{i as j,a as J}from"../../tutorial_nav-CuQDZxaW.js";import"../../tutorial_index_meta-CaOd1-g9.js";const q=H("video/heads.mp4"),Q=["webCam","video"],Z=`
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
`;function ee(r){return 4+46*r}function D(r){const i=r?.smile??0,n=r?.mouthOpen??0;return{width:90+90*i,height:8+100*n}}const oe={neutral:s.silver,happy:s.lime,sad:{red:60,green:110,blue:255},angry:s.red,surprised:s.magenta,sleepy:s.purple};async function te(r,i=W,n){const z=i.clock??new U({...C,startPaused:i.paused,debug:!1,playback:{...C.playback,duration:1e5,isLoop:!0}}),f=1920,v=1080,w=1/4,I=w*f,P={x:0,y:0,z:0},E={x:0,y:0,z:1500},l=300,N={...n?.faceConfig??{},videoWidthPixels:f,videoHeightPixels:v,mirror:!1,baseline:P,cameraPosition:E,baselineHeadPixels:I,baselineHeadSceneUnits:l,sceneScreenWidth:l/w,depthScale:1},b=n?.webCamProvider??new M(r,f,v),p=new K(r,q,{loop:!0,autoplay:!1,muted:!0,playsInline:!0,preload:"none"}),k=p.video,m=n?.faceDataProvider??new F(r,N,Q),y=new V(r);let x=n?.graphicProcessor??new L(r,y);const B={webCam:b,video:p,headTracker:m},a=new G(Y.fromLibs({clock:z,loader:y,dataProviderLib:B}));a.setScreen({id:"screen",type:R.SCREEN,position:E,direction:{x:0,y:0,z:1},lookMode:_.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),a.setEye({id:"eye",type:R.EYE,parentId:"screen",position:{x:0,y:0,z:10},direction:{x:0,y:0,z:-1},lookMode:_.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),a.startLoading(),i.paused&&a.pause();let O=null;a.addBox({type:c.BOX,id:"bigBox",width:500,position:{x:0,y:0,z:0}}),a.addBox({type:c.BOX,id:"head",parentId:"bigBox",width:l,height:l*1.4,depth:l*.6,position:e=>e.dataProviders.headTracker?.worldPosition??{x:0,y:0,z:0},rotate:e=>{const o=e.dataProviders.headTracker;return O=o?.faceExpressions&&o.expressions?{raw:o.faceExpressions,normalized:o.expressions}:null,o?{yaw:o.stick.yaw,pitch:o.stick.pitch,roll:o.stick.roll}:{pitch:0,yaw:0,roll:0}},alpha:.35,fillColor:e=>oe[e.dataProviders.headTracker?.expressions?.emotion??"neutral"],strokeColor:s.white,strokeWidth:2});const T=l*.3+6;for(const e of["left","right"]){const o=e==="left"?-65:65,h=t=>t?e==="left"?t.leftEyeOpen:t.rightEyeOpen:1;a.addBox({type:c.BOX,id:`${e}-eye`,parentId:"head",width:70,height:t=>ee(h(t.dataProviders.headTracker?.expressions)),depth:6,position:{x:o,y:-55,z:T},fillColor:s.white,strokeColor:s.black,strokeWidth:2}),a.addSphere({type:c.SPHERE,id:`${e}-pupil`,parentId:`${e}-eye`,radius:t=>14*h(t.dataProviders.headTracker?.expressions),position:{x:0,y:0,z:4},fillColor:s.navy})}a.addBox({type:c.BOX,id:"mouth",parentId:"head",width:e=>D(e.dataProviders.headTracker?.expressions).width,height:e=>D(e.dataProviders.headTracker?.expressions).height,depth:6,position:{x:0,y:95,z:T},fillColor:s.red,strokeColor:s.black,strokeWidth:2});let d;const A=()=>{if(!d)return;const e=O,o=(t,u)=>e?`${t.padEnd(10)} ${u(e.raw).toFixed(2)} -> ${u(e.normalized).toFixed(2)}`:"",h=e?["           raw  -> norm",o("left eye",t=>t.leftEyeOpen),o("right eye",t=>t.rightEyeOpen),o("mouth",t=>t.mouthOpen),o("smile",t=>t.smile),...$.map(t=>o(t,u=>u[t])),`emotion    ${e.normalized.emotion}`].join(`
`):"expressions: no face";d.textContent!==h&&(d.textContent=h)};r.setup=()=>{const e=r.createCanvas(i.width,i.height,r.WEBGL);x=n?.graphicProcessor??new L(r,y);const o=e?.elt?.parentElement;o&&(o.querySelector(".expressions-readout")?.remove(),d=document.createElement("pre"),d.className="expressions-readout",d.style.cssText="position:absolute;top:8px;right:8px;z-index:2;margin:0;padding:6px 10px;border-radius:6px;background:rgba(0,0,0,0.65);color:#fff;font:600 13px/1.35 ui-monospace,Menlo,monospace;pointer-events:none",o.appendChild(d))};let S=!1,g=!1;return r.draw=async()=>{if(!g){g=!0;try{if(!x)return;if(!S){typeof m.setFallbackCapture=="function"&&m.setFallbackCapture(k),await m.init(),a.complete(),a.addPanel({type:c.PANEL,alpha:.5,parentId:"bigBox",id:"videoPanel",width:1920,height:1080,mirrorTextureHorizontal:!0,position:P,video:X(k),fillColor:s.white}),S=!0;return}if(i.paused&&!a.isPaused()){a.pause(),p.pause();return}else!i.paused&&a.isPaused()&&a.resume();b.getStatus()==="READY"?p.pause():p.play(),r.background(20);const e=await a.step(x);if(A(),!e.running)return}finally{g=!1}}},a}const ae=`import p5 from 'p5';
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
export const expressions_explanation = \`
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
\`;

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
        // And it is not even downloaded until it plays: preloading 'none' keeps the camera's
        // page from fetching a movie it may never show.
        muted: true,
        playsInline: true,
        preload: "none",
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
            id: \`\${side}-eye\`,
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
            id: \`\${side}-pupil\`,
            parentId: \`\${side}-eye\`,
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
            ? \`\${label.padEnd(10)} \${value(expressions.raw).toFixed(2)} -> \${value(expressions.normalized).toFixed(2)}\`
            : '';
        const text = expressions
            ? [
                '           raw  -> norm',
                row('left eye', e => e.leftEyeOpen),
                row('right eye', e => e.rightEyeOpen),
                row('mouth', e => e.mouthOpen),
                row('smile', e => e.smile),
                ...EMOTIONS.map(emotion => row(emotion, e => e[emotion])),
                \`emotion    \${expressions.normalized.emotion}\`,
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
`,re=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0,se=re?void 0:{throttleThreshold:0,videoWidth:640,videoHeight:480};j("tutorial-11","11. Facial Expressions",te,ae,Z,{},se);J();
//# sourceMappingURL=tutorial-11-D5g43gml.js.map
