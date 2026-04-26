import{D as E,S as w,a as g,H as m,p as k,W as T,b as C,P as S,E as d,g as p,c as y}from"../../tutorial.template-PYpWsMkT.js";/* empty css                     */import{i as I,a as _}from"../../tutorial_shared-CSHlWac9.js";import{W as z}from"../../web_cam_data_provider-CPizDBqv.js";I();class B{type="video";p;video;source;status="IDLE";sceneId=-1;playRequested=!1;constructor(a,n,s={}){if(typeof document>"u")throw new Error("VideoDataProvider requires a browser-like document");this.p=a,this.video=this.p.createVideo(n),this.video.hide(),s.loop??!0?this.video.loop():this.video.noLoop(),this.video.autoplay(s.autoplay??!0),this.video.volume(s.muted??!0?0:1),this.video.elt.playsInline=s.playsInline??!0,this.video.elt.preload=s.preload??"auto",this.source={kind:"video",node:this.video},this.video.elt.addEventListener("canplay",()=>{this.status!=="ERROR"&&(this.status="READY",this.ensurePlaying())}),this.video.elt.addEventListener("error",()=>{this.status="ERROR"})}tick(a){this.sceneId!==a&&(this.sceneId=a,this.status==="IDLE"&&(this.status="INITIALIZING"))}getStatus(){return this.video.elt.readyState>=2?(this.status="READY",this.ensurePlaying(),this.status):this.video.src?(this.status=this.status==="READY"?"READY":"INITIALIZING",this.status):(this.status="ERROR",this.status)}getData(){return this.getStatus()==="ERROR"?null:this.source}getDataResult(){return this.getStatus()==="ERROR"?{success:!1,error:"Video is not ready [ERROR]"}:{success:!0,value:this.source}}async ensurePlaying(){if(!this.playRequested&&!(this.video.elt.readyState<2)&&this.video.elt.paused){this.playRequested=!0;try{await this.video.play()}catch{this.playRequested=!1;return}this.playRequested=!1}}}const L="/parallax/video/heads.mp4",b=["webCam","video"];function R(i,a){for(const n of a){const s=i[n];if(s)return s}return null}const O=`
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
`;async function D(i,a=E,n){const s=a.clock??new w({...g,startPaused:a.paused,debug:!1,playback:{...g.playback,duration:1e5,isLoop:!0}});var v=n?.faceConfig;let u=n?.webCamProvider;u=u??new z(i,1920,1080);const x=new B(i,L,{loop:!0,autoplay:!0,muted:!0,playsInline:!0});let l=n?.faceDataProvider;l=l??new m(i,180,650,!1,{x:0,y:0,z:0},{x:0,y:-100,z:200},v,b);const h=new S(i);let c;i.setup=()=>{i.createCanvas(a.width,a.height,k.WEBGL),c=new y(i,h)};const P={webCam:u,video:x,headTracker:l},t=new T(C.fromLibs({clock:s,loader:h,dataProviderLib:P}));t.startLoading(),t.enableDefaultPerspective(a.width,a.height,Math.PI/2),a.paused&&t.pause(),t.addBox({type:d.BOX,id:"camera-square",width:50,position:{x:0,y:0,z:300},fillColor:{red:255,green:255,blue:255},strokeColor:{red:0,green:0,blue:255},strokeWidth:1}),t.addCylinder({id:"camera-front",type:d.CYLINDER,parentId:"camera-square",radius:10,rotate:{pitch:Math.PI/2,roll:0,yaw:0},height:20,position:{x:0,y:0,z:-40},fillColor:{red:255,green:255,blue:255},strokeColor:{red:0,green:0,blue:255},strokeWidth:1});const r=15;t.addBox({type:d.BOX,id:"bigBox",width:500,position:{x:0,y:0,z:-10}}),t.addBox({type:d.BOX,id:"faceBox",parentId:"bigBox",width:150,height:180,depth:100,position:o=>{const e=o.dataProviders.headTracker;return e?{x:e.midpoint.x,y:e.midpoint.y,z:e.midpoint.z}:{x:0,y:0,z:0}},rotate:o=>{const e=o.dataProviders.headTracker;return e?{yaw:e.stick.yaw,pitch:e.stick.pitch,roll:e.stick.roll}:{pitch:0,yaw:0,roll:0}},strokeWidth:2,strokeColor:{red:255,green:0,blue:0}}),t.addBox({type:d.BOX,id:"debug_nose",parentId:"faceBox",width:r,height:r,depth:r,position:o=>{const e=o.dataProviders.headTracker;return e?e.nose:{x:0,y:0,z:0}},fillColor:p.red,strokeWidth:1}),t.addBox({type:d.BOX,id:"debug_leftEye",parentId:"faceBox",width:r,height:r,depth:r,position:o=>{const e=o.dataProviders.headTracker;return e?{x:e.eyes.left.x,y:e.eyes.left.y,z:e.eyes.left.z}:{x:0,y:0,z:0}},fillColor:{red:0,green:255,blue:0},strokeWidth:1}),t.addBox({type:d.BOX,id:"debug_rightEye",parentId:"faceBox",width:r,height:r,depth:r,position:o=>{const e=o.dataProviders.headTracker;return e?e.eyes.right:{x:0,y:0,z:0}},fillColor:{red:0,green:0,blue:255},strokeWidth:1}),t.addBox({type:d.BOX,id:"debug_boundsLeft",parentId:"faceBox",width:r,height:r,depth:r,position:o=>{const e=o.dataProviders.headTracker;return e?e.bounds.left:{x:0,y:0,z:0}},fillColor:{red:255,green:255,blue:0},strokeWidth:1}),t.addBox({type:d.BOX,id:"debug_boundsRight",parentId:"faceBox",width:r,height:r,depth:r,position:o=>{const e=o.dataProviders.headTracker;return e?e.bounds.right:{x:0,y:0,z:0}},fillColor:{red:0,green:255,blue:255},strokeWidth:1}),t.addBox({type:d.BOX,id:"debug_boundsTop",parentId:"faceBox",width:r,height:r,depth:r,position:o=>{const e=o.dataProviders.headTracker;return e?e.bounds.top:{x:0,y:0,z:0}},fillColor:{red:255,green:0,blue:255},strokeWidth:1}),t.addBox({type:d.BOX,id:"debug_boundsBottom",parentId:"faceBox",width:r,height:r,depth:r,position:o=>{const e=o.dataProviders.headTracker;return e?e.bounds.bottom:{x:0,y:0,z:0}},fillColor:{red:255,green:165,blue:0},strokeWidth:1}),t.addPyramid({type:d.PYRAMID,id:"nose",parentId:"faceBox",baseSize:20,height:20,position:{x:0,y:0,z:50},rotate:{roll:0,pitch:-Math.PI/2,yaw:0},strokeWidth:4,fillColor:p.pink,strokeColor:{red:255,green:0,blue:255}}),t.addSphere({type:d.SPHERE,id:"left-eye",parentId:"faceBox",radius:20,position:{x:-25,y:-25,z:25},alpha:.5,fillColor:{red:255,green:255,blue:255}}),t.addSphere({type:d.SPHERE,id:"right-eye",parentId:"faceBox",radius:20,position:{x:25,y:-25,z:25},alpha:.5,fillColor:{red:255,green:255,blue:255}}),i.setup=()=>{i.createCanvas(a.width,a.height,i.WEBGL),c=new y(i,h)};let f=!1;return i.draw=async()=>{if(!c)return;if(!f){await l.init(),t.addPanel({type:d.PANEL,parentId:"bigBox",id:"videoPanel",width:1920*2,mirrorTextureHorizontal:!0,height:1080*2,position:{x:0,y:-50,z:-500*2},video:e=>R(e.dataProviders,b),fillColor:p.blue}),t.complete(),f=!0;return}a.paused&&!t.isPaused()?t.pause():!a.paused&&t.isPaused()&&t.resume(),i.background(20),(await t.step(c)).running},t}const W=`import p5 from 'p5';
import { World } from "../../../scene/world.ts";
import { P5GraphicProcessor } from "../../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../../scene/scene_clock.ts";
import { HeadTrackingDataProvider, type ObserverDataProviderLib } from "../../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../../scene/providers/web_cam_data_provider.ts";
import { VideoDataProvider } from "../../../scene/providers/video_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES,
    type ResolutionContext,
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

function resolvePreferredSource<T>(
    dataProviders: Record<string, T | null | undefined>,
    preferredIds: readonly string[],
): T | null {
    for (const id of preferredIds) {
        const value = dataProviders[id];
        if (value) return value;
    }
    return null;
}

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

    // const faceConfig = {
    //     throttleThreshold: 0,
    //     videoWidth: 640,
    //     videoHeight: 480,
    //     physicalHeadWidth: 180,
    //     focalLength: 0.5,
    //     mirror: false,
    // };
    var faceConfig =extraArgs?.faceConfig;

    let webCamProvider = extraArgs?.webCamProvider;
    webCamProvider = webCamProvider ?? new WebCamDataProvider(p, 1920, 1080);
    const fallbackVideoProvider = new VideoDataProvider(p, FALLBACK_VIDEO_URL, {
        loop: true,
        autoplay: true,
        muted: true,
        playsInline: true,
    });

    let faceDataProvider = extraArgs?.faceDataProvider;
    faceDataProvider = faceDataProvider ?? new HeadTrackingDataProvider(
        p,
        180,
        650,
        false,
        { x: 0, y: 0, z: 0 },
        { x: 0, y: -100, z: 200 },
        faceConfig,
        VIDEO_SOURCE_ORDER,
    );

    const loader = new P5AssetLoader(p);
    let gp: P5GraphicProcessor;
    
    p.setup = () => {
        p.createCanvas(config.width, config.height, p5.WEBGL);
        gp = new P5GraphicProcessor(p, loader);
    };
    const dataProviderLib: ObserverDataProviderLib = {
        webCam: webCamProvider,
        video: fallbackVideoProvider,
        headTracker: faceDataProvider,
    };
    const world = new World<P5Bundler, any, any, ObserverDataProviderLib>(
        WorldSettings.fromLibs({clock, loader, dataProviderLib})
    );
    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 2);

    if (config.paused) {
        world.pause();
    }

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
        parentId: 'camera-square',
        radius: 10,
        rotate: {pitch: Math.PI/2, roll: 0, yaw: 0},
        height: 20,
        position:  { x:0, y:0, z: -40 },
        fillColor: { red: 255, green: 255, blue: 255 },
        strokeColor: { red: 0, green: 0, blue: 255 },
        strokeWidth: 1
    });

    // world.setScreen({
    //     id: STANDARD_PROJECTION_IDS.SCREEN,
    //     type: PROJECTION_TYPES.SCREEN,
    //     lookMode: LOOK_MODES.ROTATION,
    //     modifiers: {
    //         carModifiers: [],
    //         stickModifiers: []
    //     }
    // });

    const boxSize = 15;

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'bigBox',
        width: 500,
        position: { x:0, y:0, z: -10},
        // rotate: {pitch: 0, roll: 0, yaw: Math.PI/4},
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
            await faceDataProvider.init();
            world.addPanel({
                type: ELEMENT_TYPES.PANEL,
                parentId: 'bigBox',
                id: 'videoPanel',
                width: 1920  * 2,
                mirrorTextureHorizontal: true,
                height: 1080 * 2,
                position: { x: 0, y: -50, z: -500 * 2 },
                video: (ctx: ResolutionContext<ObserverDataProviderLib>) => resolvePreferredSource(ctx.dataProviders, VIDEO_SOURCE_ORDER),
                fillColor:  COLORS.blue,
            });

            world.complete();
            initialized = true;
            return;
        }
        
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }
        
        p.background(20);
        const result = await world.step(gp);
        
        if (!result.running) return;
    };

    return world;
}
`,N=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0,M=N?void 0:{throttleThreshold:0,videoWidth:640,videoHeight:480};_("tutorial-8","8. The Observer",D,W,O,{},M);
//# sourceMappingURL=tutorial-8-BdyAdUF5.js.map
