import{D as _,S as B,a as m,H as L,c as P,P as D,p as R,W,b as N,h as S,i as T,E as s,g as v}from"../../tutorial.template-DfAWeqR7.js";/* empty css                     */import{i as M,a as V}from"../../tutorial_shared-CoO0eFCZ.js";import{W as A}from"../../web_cam_data_provider-C9hix6B8.js";M();class H{type="video";p;video;source;status="IDLE";sceneId=-1;playRequested=!1;constructor(i,d,n={}){if(typeof document>"u")throw new Error("VideoDataProvider requires a browser-like document");this.p=i,this.video=this.p.createVideo(d),this.video.hide(),n.loop??!0?this.video.loop():this.video.noLoop(),this.video.autoplay(n.autoplay??!0),this.video.volume(n.muted??!0?0:1),this.video.elt.playsInline=n.playsInline??!0,this.video.elt.preload=n.preload??"auto",this.source={kind:"video",node:this.video},this.video.elt.addEventListener("canplay",()=>{this.status!=="ERROR"&&(this.status="READY",this.ensurePlaying())}),this.video.elt.addEventListener("error",()=>{this.status="ERROR"})}tick(i){this.sceneId!==i&&(this.sceneId=i,this.status==="IDLE"&&(this.status="INITIALIZING"))}getStatus(){return this.video.elt.readyState>=2?(this.status="READY",this.ensurePlaying(),this.status):this.video.src?(this.status=this.status==="READY"?"READY":"INITIALIZING",this.status):(this.status="ERROR",this.status)}getData(){return this.getStatus()==="ERROR"?null:this.source}getDataResult(){return this.getStatus()==="ERROR"?{success:!1,error:"Video is not ready [ERROR]"}:{success:!0,value:this.source}}seekTo(i){this.video.elt.readyState>=1&&(this.video.elt.currentTime=i)}getDuration(){return this.video.elt.duration??0}play(){this.ensurePlaying()}load(){typeof this.video.elt.load=="function"&&this.video.elt.load()}async ensurePlaying(){if(!this.playRequested&&!(this.video.elt.readyState<2)&&this.video.elt.paused){this.playRequested=!0;try{this.video.play()}catch{this.playRequested=!1;return}this.playRequested=!1}}}const F="/parallax/video/heads.mp4",U=["webCam","video"],Y=`
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
`;function G(r){return i=>{const d=i.dataProviders.webCam;return d?.node?{kind:"webCam",data:{node:d.node}}:{kind:"video",data:{node:r}}}}async function X(r,i=_,d){const n=i.clock??new B({...m,startPaused:i.paused,debug:!1,playback:{...m.playback,duration:1e5,isLoop:!0}}),y=1920,x=1080,w=1/4,C=w*y,p={x:0,y:0,z:0},g={x:0,y:0,z:1500},O=0,c=300;let z={...d?.faceConfig??{},videoWidthPixels:y,videoHeightPixels:x,mirror:!1,baseline:p,cameraPosition:g,baselineHeadPixels:C,baselineHeadSceneUnits:c,sceneScreenWidth:c/w,depthScale:1},b=d?.webCamProvider;b=b??new A(r,y,x);const E=new H(r,F,{loop:!0,autoplay:!0,muted:!0,playsInline:!0}),h=E.video;let l=d?.faceDataProvider;l=l??new L(r,z,U);const u=new D(r);let f=d?.graphicProcessor??new P(r,u);r.setup=()=>{r.createCanvas(i.width,i.height,R.WEBGL),d?.graphicProcessor||(f=new P(r,u))};const I={webCam:b,video:E,headTracker:l},t=new W(N.fromLibs({clock:n,loader:u,dataProviderLib:I}));t.setScreen({id:"screen",type:T.SCREEN,position:g,direction:{x:0,y:0,z:1},lookMode:S.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),t.setEye({id:"eye",type:T.EYE,parentId:"screen",position:{x:0,y:0,z:10},direction:{x:0,y:0,z:-1},lookMode:S.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),t.startLoading(),i.paused&&t.pause(),t.addBox({type:s.BOX,id:"camera-square",width:50,position:g,fillColor:{red:255,green:255,blue:255},strokeColor:{red:0,green:0,blue:255},strokeWidth:1}),t.addCylinder({id:"camera-front",type:s.CYLINDER,parentId:"camera-square",radius:10,rotate:{pitch:Math.PI/2,roll:0,yaw:0},height:20,position:{x:0,y:0,z:-40},fillColor:{red:255,green:255,blue:255},strokeColor:{red:0,green:0,blue:255},strokeWidth:1});const a=15;t.addBox({type:s.BOX,id:"bigBox",width:500,position:{x:0,y:0,z:0}}),t.addBox({type:s.BOX,id:"faceBox",parentId:"bigBox",width:c,height:c*1.8,depth:c,position:o=>{const e=o.dataProviders.headTracker;return e?{x:e.worldPosition.x,y:e.worldPosition.y,z:e.worldPosition.z}:{x:0,y:0,z:0}},rotate:o=>{const e=o.dataProviders.headTracker;return e?{yaw:e.stick.yaw,pitch:e.stick.pitch,roll:e.stick.roll}:{pitch:0,yaw:0,roll:0}},strokeWidth:10,strokeColor:{red:255,green:0,blue:0}}),t.addBox({type:s.BOX,id:"debug_nose",parentId:"faceBox",width:a,height:a,depth:a,position:o=>{const e=o.dataProviders.headTracker;return e?e.nose:{x:0,y:0,z:0}},fillColor:v.red,strokeWidth:1}),t.addBox({type:s.BOX,id:"debug_leftEye",parentId:"faceBox",width:a,height:a,depth:a,position:o=>{const e=o.dataProviders.headTracker;return e?{x:e.eyes.left.x,y:e.eyes.left.y,z:e.eyes.left.z}:{x:0,y:0,z:0}},fillColor:{red:0,green:255,blue:0},strokeWidth:1}),t.addBox({type:s.BOX,id:"debug_rightEye",parentId:"faceBox",width:a,height:a,depth:a,position:o=>{const e=o.dataProviders.headTracker;return e?e.eyes.right:{x:0,y:0,z:0}},fillColor:{red:0,green:0,blue:255},strokeWidth:1}),t.addBox({type:s.BOX,id:"debug_boundsLeft",parentId:"faceBox",width:a,height:a,depth:a,position:o=>{const e=o.dataProviders.headTracker;return e?e.bounds.left:{x:0,y:0,z:0}},fillColor:{red:255,green:255,blue:0},strokeWidth:1}),t.addBox({type:s.BOX,id:"debug_boundsRight",parentId:"faceBox",width:a,height:a,depth:a,position:o=>{const e=o.dataProviders.headTracker;return e?e.bounds.right:{x:0,y:0,z:0}},fillColor:{red:0,green:255,blue:255},strokeWidth:1}),t.addBox({type:s.BOX,id:"debug_boundsTop",parentId:"faceBox",width:a,height:a,depth:a,position:o=>{const e=o.dataProviders.headTracker;return e?e.bounds.top:{x:0,y:0,z:0}},fillColor:{red:255,green:0,blue:255},strokeWidth:1}),t.addBox({type:s.BOX,id:"debug_boundsBottom",parentId:"faceBox",width:a,height:a,depth:a,position:o=>{const e=o.dataProviders.headTracker;return e?e.bounds.bottom:{x:0,y:0,z:0}},fillColor:{red:255,green:165,blue:0},strokeWidth:1}),t.addPyramid({type:s.PYRAMID,id:"nose",parentId:"faceBox",baseSize:50,height:50,position:{x:0,y:0,z:50},rotate:{roll:0,pitch:-Math.PI/2,yaw:0},strokeWidth:4,fillColor:v.pink,strokeColor:{red:255,green:0,blue:255}}),t.addSphere({type:s.SPHERE,id:"left-eye",parentId:"faceBox",radius:40,position:{x:-50,y:-50,z:50},alpha:.5,fillColor:{red:255,green:255,blue:255}}),t.addSphere({type:s.SPHERE,id:"right-eye",parentId:"faceBox",radius:40,position:{x:50,y:-50,z:50},alpha:.5,fillColor:{red:255,green:255,blue:255}}),r.setup=()=>{r.createCanvas(i.width,i.height,r.WEBGL),f=new P(r,u)};let k=!1;return r.draw=async()=>{if(!f)return;if(!k){typeof l.setFallbackCapture=="function"&&l.setFallbackCapture(h),await l.init(),t.complete();const e=G(h);t.addPanel({type:s.PANEL,alpha:.5,parentId:"bigBox",id:"videoPanel",width:1920,height:1080,mirrorTextureHorizontal:!0,position:{x:p.x,y:p.y,z:p.z+O},video:e,fillColor:v.blue}),k=!0;return}if(i.paused&&!t.isPaused()){t.pause(),h.pause();return}else!i.paused&&t.isPaused()&&(t.resume(),h.loop());r.background(20),(await t.step(f)).running},t}const K=`import p5 from 'p5';
import { World } from "../../../scene/world.ts";
import { P5GraphicProcessor } from "../../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../../scene/scene_clock.ts";
import {
    HeadTrackingDataProvider,
    type HeadTrackingDataProviderConfig,
    type ObserverDataProviderLib
} from "../../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../../scene/providers/web_cam_data_provider.ts";
import type { VideoPixels } from "../../../scene/types.ts";
import { VideoDataProvider } from "../../../scene/providers/video_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import type { VideoSource } from "../../../scene/video/types.ts";
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

const FALLBACK_VIDEO_URL = "/parallax/video/heads.mp4";
const VIDEO_SOURCE_ORDER = ["webCam", "video"] as const;

/**
 * TUTORIAL: The Observer
 * 
 * Visualize how the engine tracks your face using MediaPipe face mesh.
 */
export const observer_explanation = \`
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
\`;


export function createVideoSelector(
    fallbackVideo: p5.MediaElement<HTMLVideoElement>
): (ctx: ResolutionContext<ObserverDataProviderLib>) => VideoSource {
    return (ctx) => {
        const webcamData = ctx.dataProviders.webCam;
        
        if (webcamData?.node) {
            return { kind: 'webCam', data: { node: webcamData.node } };
        }
        return { kind: 'video', data: { node: fallbackVideo } };
    };
}


export async function tutorial_observer(
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
    const panelScreenZDistance = 0;
    const baselineHeadSceneUnits = 300 as SceneUnits;

    let headTrackingConfig: Partial<HeadTrackingDataProviderConfig> = {
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
    let gp: P5GraphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);
    
    p.setup = () => {
        p.createCanvas(config.width, config.height, p5.WEBGL);
        if (!extraArgs?.graphicProcessor) {
            gp = new P5GraphicProcessor(p, loader);
        }
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
        width: baselineHeadSceneUnits,
        height: baselineHeadSceneUnits * 1.8,
        depth: baselineHeadSceneUnits,
        position: (ctx) => {
            const face = ctx.dataProviders['headTracker'];
            if (!face) return { x: 0, y: 0, z: 0 };
            return {
                x: face.worldPosition.x,
                y: face.worldPosition.y,
                z: face.worldPosition.z
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
        strokeWidth: 10,
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
        baseSize: 50,
        height: 50,
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
        radius: 40,
        position: { x: -50, y: -50, z: 50 },
        alpha: 0.5,
        fillColor: { red: 255, green: 255, blue: 255 },
    });

    world.addSphere({
        type: ELEMENT_TYPES.SPHERE,
        id: 'right-eye',
        parentId: 'faceBox',
        radius: 40,
        position: { x: 50, y: -50, z: 50 },
        alpha: 0.5,
        fillColor: { red: 255, green: 255, blue: 255 },
    });

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        gp = new P5GraphicProcessor(p, loader);
    };

    let initialized = false;
    p.draw = async () => {
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

            // Add video panel after world.complete()
            // Always show fallback video in panel (webcam is used for face tracking)
            const videoSelector = createVideoSelector(fallbackVideo);

            world.addPanel({
                type: ELEMENT_TYPES.PANEL,
                alpha: 0.5,
                parentId: 'bigBox',
                id: 'videoPanel',
                width: 1920,
                height: 1080,
                mirrorTextureHorizontal: true,
                position: {
                    x: panelPosition.x,
                    y: panelPosition.y,
                    z: panelPosition.z + panelScreenZDistance,
                },
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
}`,q=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0,Z=q?void 0:{throttleThreshold:0,videoWidth:640,videoHeight:480};V("tutorial-8","8. The Observer",X,K,Y,{},Z);
//# sourceMappingURL=tutorial-8-BJN4EvVL.js.map
