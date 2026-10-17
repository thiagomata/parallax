import"./tutorial-BEflRuS4.js";import{D as ne,S as ue,a as ae,W as fe,H as ge,b as me,c as ye,L as we,F as ve,P as Ee,d as ie,e as be,f as xe,E as a,g as s,C as ke,h as Pe,i as Me,t as Se,j as G,s as re,k as Ae}from"./tutorial.template-dFC36ztV.js";const Ce=`
<p>3D parallax depth, head-tracked. If no camera is available, move the pointer over the canvas and scroll to change depth, or use the arrow keys to look around.</p>
`;async function Le(h,p=ne,L){const _=p.clock??new ue({...ae,startPaused:p.paused,debug:!1,playback:{...ae.playback,duration:1e4,isLoop:!0}}),W=L?.faceConfig;let T=L?.webCamProvider;T=T??new fe(h,640,480);let x=L?.faceDataProvider;x=x??new ge(h,{...W,baselineHeadPixels:120,baselineHeadSceneUnits:180,baseline:{x:0,y:0,z:0},cameraPosition:{x:0,y:0,z:300}});const n=new Ee(h),K={webCam:T,headTracker:x},e=new me(ye.fromLibs({clock:_,loader:n,dataProviderLib:K,elementEffectLib:{follow:ve,look_at:we}}));e.startLoading(),e.enableDefaultPerspective(p.width,p.height,Math.PI/4,!0),p.paused&&e.pause(),e.loadPreset({...ie,projectors:ie.projectors.map(t=>t.id==="head"?{id:t.id,type:t.type,position:t.position,direction:t.direction,lookMode:be.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}:t)});const g={x:0,y:0,z:0};let k=!1;["localhost","127.0.0.1"].includes(window.location.hostname)&&(window.heroDebug={setHead:t=>{k=!0,Object.assign(g,t)},release:()=>{k=!1},projections:()=>Object.fromEntries([...(e.getCurrenState()?.projections??new Map).entries()].map(([t,r])=>{const{x:d,y:f,z:v}=r.globalPosition??r.position;return[t,{x:Math.round(d),y:Math.round(f),z:Math.round(v)}]}))});let y,z=!1,c="";const E=t=>{t!==c&&(c=t,y?.dispatchEvent(new CustomEvent("observerstatus",{bubbles:!0,detail:t})))},P=new xe({disableRotation:!1,damping:.1}),m={},M=.005,H=.1,O=.26;let S=0,o=0;const i=()=>(m.ArrowLeft&&(S=Math.max(-H,S-M)),m.ArrowRight&&(S=Math.min(H,S+M)),m.ArrowUp&&(o=Math.max(-H,o-M)),m.ArrowDown&&(o=Math.min(H,o+M)),{yaw:S,pitch:o,roll:0}),l={x:0,y:60,z:50},u=2,I=150,se=-1200,V=t=>{const r=Math.min(I,Math.max(se,l.z+t.z*u)),f=825-(r+100+300)*1.23;return{x:Math.max(-f,Math.min(f,t.x+l.x)),y:t.y+l.y,z:r}},le=t=>Math.max(-O,Math.min(O,t)),de={name:"Head tracking with pointer fallback",active:!0,priority:10,requiredDataProviders:[],tick:t=>P.tick(t),getCarPosition:(t,r)=>{const d=i();if(r.dataProviders.headTracker&&!k){E("Head tracking active.");const v=P.getCarPosition(t,r);return v.success?{success:!0,value:{...v.value,position:V(v.value.position),rotation:{yaw:le((v.value.rotation?.yaw??0)+d.yaw),pitch:(v.value.rotation?.pitch??0)+d.pitch,roll:v.value.rotation?.roll??0}}}:v}const f=T?.getStatus?.()==="READY";return E(f?"No face detected. Move the mouse to look around and scroll to change depth.":z?"Camera unavailable. Move the mouse to look around and scroll to change depth.":"Starting camera. Mouse and scroll controls are active."),{success:!0,value:{name:"Pointer fallback",position:V(g),rotation:d}}}};e.addModifierToProjection("head",de,"car");const A=1603,C=847,Y=4e3,w=Y*C/A,D=-2500,b={max:{z:D*.8-D*.9-100}};e.addPanel({id:"mountain-backdrop-01",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:Y,height:w,position:{x:0,y:0,z:D},texture:{path:s("img/hero/layer-01.png"),width:A,height:C},effects:[{type:"follow",settings:{follow:"CAMERA",targetBounds:b}}]}),e.addPanel({id:"mountain-backdrop-02",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:Y*.9,height:w*.9,position:{x:400,y:-400,z:D*.9},texture:{path:s("img/hero/layer-02.png"),width:A,height:C},effects:[{type:"follow",settings:{follow:"CAMERA",targetBounds:b}}]});const J=3e3,he=Y/2,q=Math.PI/4,Q=20,N=J+Q,ee=(J-Q)/2,R=he+ee*Math.cos(q),B=D+ee*Math.sin(q),j=q-Math.PI,Z=Math.PI-q;e.addPanel({id:"mountain-backdrop-01-left",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:N,height:w,position:{x:-R,y:0,z:B},rotate:{pitch:0,yaw:j,roll:0},mirrorTextureHorizontal:!1,texture:{path:s("img/hero/layer-01.png"),width:A,height:C},effects:[{type:"follow",settings:{follow:"CAMERA",targetBounds:b}}]}),e.addPanel({id:"mountain-backdrop-02-left",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:N*.9,height:w*.9,position:{x:-R*.9,y:0,z:B*.9},rotate:{pitch:0,yaw:j,roll:0},mirrorTextureHorizontal:!1,texture:{path:s("img/hero/layer-02.png"),width:A,height:C},effects:[{type:"follow",settings:{follow:"CAMERA",targetBounds:b}}]}),e.addPanel({id:"mountain-backdrop-01-right",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:N,height:w,position:{x:R,y:0,z:B},rotate:{pitch:0,yaw:Z,roll:0},mirrorTextureHorizontal:!1,texture:{path:s("img/hero/layer-01.png"),width:A,height:C},effects:[{type:"follow",settings:{follow:"CAMERA",targetBounds:b}}]}),e.addPanel({id:"mountain-backdrop-02-right",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:N*.9,height:w*.9,position:{x:R*.9,y:0,z:B*.9},rotate:{pitch:0,yaw:Z,roll:0},mirrorTextureHorizontal:!1,texture:{path:s("img/hero/layer-02.png"),width:A,height:C},effects:[{type:"follow",settings:{follow:"CAMERA",targetBounds:b}}]});const U=1234,$=669;e.addPanel({id:"mountain-backdrop-03",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:Y*.8,height:w*.8,position:{x:-100,y:-400,z:D*.8},texture:{path:s("img/hero/layer-03.png"),width:U,height:$},effects:[{type:"follow",settings:{follow:"CAMERA",axis:{x:!0,y:!0,z:!1}}}]}),e.addPanel({id:"mountain-backdrop-03-left",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:N*.8,height:w*.8,position:{x:-100+-R*.8,y:-200,z:B*.8},rotate:{pitch:0,yaw:j,roll:0},mirrorTextureHorizontal:!1,texture:{path:s("img/hero/layer-03.png"),width:U,height:$},effects:[{type:"follow",settings:{follow:"CAMERA",axis:{x:!0,y:!0,z:!1}}}]}),e.addPanel({id:"mountain-backdrop-03-right",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:N*.8,height:w*.8,position:{x:R*.8,y:0,z:B*.8},rotate:{pitch:0,yaw:Z,roll:0},mirrorTextureHorizontal:!1,texture:{path:s("img/hero/layer-03.png"),width:U,height:$},effects:[{type:"follow",settings:{follow:"CAMERA",axis:{x:!0,y:!0,z:!1}}}]}),e.addPanel({id:"layer-04",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:696,height:507,position:{x:-350,y:50,z:-800},texture:{path:s("img/hero/layer-04.png"),width:696,height:507}}),e.addPanel({id:"layer-04-mirror",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:696,height:507,mirrorTextureHorizontal:!0,position:{x:-1046,y:50,z:-810},texture:{path:s("img/hero/layer-04.png"),width:696,height:507}}),e.addPanel({id:"layer-05",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:908,height:565,position:{x:550,y:50,z:-1200},texture:{path:s("img/hero/layer-05.png"),width:908,height:565}}),e.addPanel({id:"layer-05-mirror",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:908,height:565,mirrorTextureHorizontal:!0,position:{x:1458,y:50,z:-1210},texture:{path:s("img/hero/layer-05.png"),width:908,height:565}}),e.addPanel({id:"layer-06",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:221,height:813,position:{x:250,y:180,z:-650},texture:{path:s("img/hero/layer-06.png"),width:221,height:813}}),e.addPanel({id:"layer-07",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:674,height:594,position:{x:-250,y:50,z:-420},texture:{path:s("img/hero/layer-07.png"),width:674,height:594}}),e.addPanel({id:"layer-08",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:872,height:302,position:{x:470,y:200,z:-400},texture:{path:s("img/hero/layer-08.png"),width:872,height:302}}),e.addPanel({id:"layer-09",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:299,height:495,position:{x:460,y:100,z:-680},texture:{path:s("img/hero/layer-09.png"),width:299,height:495}}),e.addPanel({id:"layer-10",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:70,height:309,mirrorTextureHorizontal:!0,position:{x:-140,y:0,z:-380},texture:{path:s("img/hero/layer-10.png"),width:70,height:309}});const ce=t=>{const r=.5*Math.sin(t*11)+.3*Math.sin(t*23.7)+.2*Math.sin(t*4.3),d=Math.sin(t*1.7)*Math.sin(t*2.9)>.92?.35:0;return .875+.125*r-d};e.addPanel({id:"post-light",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,fillColor:t=>{const r=ce(t.playback.now/1e3);return{red:Math.round(255*r),green:Math.round(240*r),blue:Math.round(210*r)}},width:48,height:41,mirrorTextureHorizontal:!0,position:{x:-132,y:-141,z:-377},texture:{path:s("img/hero/post-light.png"),width:255,height:219}}),e.addPanel({id:"layer-11",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:1650,height:1177,position:{x:0,y:-100,z:-300},texture:{path:s("img/hero/layer-11.png"),width:1699,height:1212}}),e.addPanel({id:"parallax-title",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:820,height:152,position:{x:0,y:-270,z:-1e3},texture:{path:s("img/hero/parallax-title.png"),width:700,height:130}}),e.addPanel({id:"parallax-title-outline",type:a.PANEL,fitMode:"fill",alphaCutoff:.5,width:820,height:152,position:{x:0,y:-270,z:-997},fillColor:{red:0,green:0,blue:0},texture:{path:s("img/hero/parallax-outline.png"),width:700,height:130}});const te=-600;e.addFloor({id:"ground-floor",type:a.FLOOR,width:6e3,depth:6e3,position:{x:0,y:400,z:te},fillColor:ke.cyan,effects:[{type:"follow",settings:{follow:"CAMERA",followRotation:!0,targetBounds:b}}]}),e.addFloor({id:"roof",type:a.FLOOR,width:12e3,depth:12e3,position:{x:0,y:-2500,z:te},fillColor:{red:100*1.5,green:68*1.5,blue:97*1.5},effects:[{type:"follow",settings:{follow:"CAMERA",targetBounds:b}}]});let X;h.setup=()=>{y=h.createCanvas(p.width,p.height,h.WEBGL)?.elt,y?.addEventListener("pointermove",r=>{const d=y.getBoundingClientRect(),f=r;g.x=Math.max(-150,Math.min(150,((f.clientX-d.left)/d.width-.5)*300)),g.y=Math.max(-100,Math.min(100,((f.clientY-d.top)/d.height-.5)*200))}),y?.addEventListener("wheel",r=>{r.preventDefault(),g.z=Math.max(-700,Math.min(100,g.z+r.deltaY*.25))},{passive:!1})},e.complete(),window.addEventListener("keydown",t=>{t.key.startsWith("Arrow")&&t.preventDefault(),m[t.key]=!0}),window.addEventListener("keyup",t=>{m[t.key]=!1}),h.draw=async()=>{if(p.paused&&!e.isPaused()?e.pause():!p.paused&&e.isPaused()&&e.resume(),h.background(145,101,148),X){if(!(await e.step(X)).running)return;pe()}};let oe="";const pe=()=>{const t=e.getCurrenState()?.projections.get(Me.EYE);if(!t)return;const r=t.globalPosition??t.position,d={x:Math.round(r.x),y:Math.round(r.y),z:Math.round(r.z)},f=`${d.x},${d.y},${d.z}`;f!==oe&&(oe=f,y?.dispatchEvent(new CustomEvent("observerchange",{detail:d,bubbles:!0})))};try{await x.init()}catch(t){console.warn("Camera unavailable; pointer controls remain active.",t)}return z=!0,X=L?.graphicProcessor??new Pe(h,n),e}const Te=`import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../scene/providers/web_cam_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, LOOK_MODES, STANDARD_PROJECTION_IDS, type CarModifier, type ColorRGBA, type Vector3, type DampingValue, type SceneUnits, type VideoPixels} from "../../scene/types.ts";
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "../tutorial/sketch_config.ts";
import type { FaceConfig, P5SketchExtraArgs } from "../tutorial/sketch_engine.types.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { HEAD_TRACKED_PRESET } from "../../scene/presets.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import { COLORS } from "../../scene/colors.ts";
import { appAssetPath } from "../../utils/app_paths.ts";
import { FollowEffect } from "../../scene/effects/follow_effect.ts";
import { LookAtEffect } from "../../scene/effects/look_at_effect.ts";

/**
 * MAIN DEMO: 3D Parallax Depth
 *
 * Layered parallax scene (camera-following mountain boxes, fixed artwork layers, title,
 * floor and roof) seen through tutorial-9's head-tracked camera, with keyboard-driven
 * camera rotation always on, additive on top of head tracking.
 */
export const heroParallaxExplanation = \`
<p>3D parallax depth, head-tracked. If no camera is available, move the pointer over the canvas and scroll to change depth, or use the arrow keys to look around.</p>
\`;

export async function heroParallax(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: { faceConfig?: FaceConfig; faceDataProvider?: HeadTrackingDataProvider; webCamProvider?: WebCamDataProvider } & P5SketchExtraArgs,
): Promise<World<P5Bundler, any, any, { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider }>> {
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
    let webCamProvider = extraArgs?.webCamProvider;
    webCamProvider = webCamProvider ?? new WebCamDataProvider(p, 640, 480);

    let faceDataProvider = extraArgs?.faceDataProvider;
    faceDataProvider = faceDataProvider ?? new HeadTrackingDataProvider(p,
        {
            ...faceConfig,
            baselineHeadPixels: 120 as VideoPixels,
            baselineHeadSceneUnits: 180 as SceneUnits,
            baseline: {x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits},
            cameraPosition: {x: 0 as SceneUnits, y: 0 as SceneUnits, z: 300 as SceneUnits},
        }
    );

    const loader = new P5AssetLoader(p);
    const dataProviderLib: { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider } = {
        webCam: webCamProvider,
        headTracker: faceDataProvider,
    };
    const world = new World<P5Bundler, any, any, { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider }>(
        WorldSettings.fromLibs({
            clock,
            loader,
            dataProviderLib,
            elementEffectLib: { follow: FollowEffect, look_at: LookAtEffect },
        })
    );

    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 4, true);

    if (config.paused) {
        world.pause();
    }

    // Same preset as tutorial-9, except 'head' switches to ROTATION mode (from the preset's
    // default LOOK_AT) so the keyboard-driven rotation below actually pivots the camera
    // instead of being ignored in favor of a fixed lookAt target.
    world.loadPreset({
        ...HEAD_TRACKED_PRESET,
        projectors: HEAD_TRACKED_PRESET.projectors.map(projector =>
            projector.id === 'head'
                ? {
                    id: projector.id,
                    type: projector.type,
                    position: projector.position,
                    direction: projector.direction,
                    lookMode: LOOK_MODES.ROTATION,
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                }
                : projector
        ),
    });

    const pointer = { x: 0, y: 0, z: 0 };
    // Local-dev-only debug hook: place the head exactly (no clamping), e.g. from the console
    // \`heroDebug.setHead({ x: 0, y: 10, z: 515 })\`, to reproduce views that head tracking
    // reaches but the mouse/wheel ranges can't. While set it overrides head tracking (the
    // on-canvas readout shows the resulting eye position); \`heroDebug.release()\` hands
    // control back to the camera.
    let debugHeadOverride = false;
    // A hostname check, not import.meta.env.DEV: this source also runs as the Code tab's
    // editable sketch (compiled via new Function), where import.meta is a syntax error.
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        (window as Window & { heroDebug?: unknown }).heroDebug = {
            setHead: (position: Partial<Vector3>) => {
                debugHeadOverride = true;
                Object.assign(pointer, position);
            },
            release: () => { debugHeadOverride = false; },
            // Resolved global positions of the camera rig, e.g. to see where the render
            // camera (eye -> looking at screen) actually is.
            projections: () => Object.fromEntries(
                [...(world.getCurrenState()?.projections ?? new Map()).entries()].map(([id, projection]) => {
                    const { x, y, z } = projection.globalPosition ?? projection.position;
                    return [id, { x: Math.round(x), y: Math.round(y), z: Math.round(z) }];
                }),
            ),
        };
    }
    let canvasElement: HTMLElement | undefined;
    let initialized = false;
    let lastStatus = '';
    const announceStatus = (message: string) => {
        if (message === lastStatus) return;
        lastStatus = message;
        canvasElement?.dispatchEvent(new CustomEvent('observerstatus', { bubbles: true, detail: message }));
    };
    const headModifier = new HeadTrackingModifier({
        disableRotation: false,
        damping: 0.1 as DampingValue,
    });
    // Keyboard rotation - plain closure state, NOT routed through the engine's
    // ExternalStore (previousStore/nextStore). Car/nudge/stick modifiers are resolved
    // in projection_resolver.ts with a hardcoded \`{ global: {} }\` store on every call
    // (see \`resolve()\` there), so anything written to the real ExternalStore via
    // getExternalStore() is invisible to a CarModifier's context - it never carries
    // keyboard (or any other externally-synced) state. Tracking it here directly
    // sidesteps that engine bug for this one modifier.
    const pressedKeys: Record<string, boolean> = {};
    // Arrow keys turn only as far as head tracking can: the tracker turns the camera by the
    // face's angle x damping (0.1), so even a ~1 rad (60deg) head turn moves it ~0.1 rad.
    const keyRotationSpeed = 0.005;
    const maxKeyRotation = 0.1;
    // Max look left/right (15deg), for the face rotation and arrow keys combined: layer-11
    // (the foreground frame) only covers the view up to this turn - see the side limit below.
    const maxYaw = 0.26;
    let keyYaw = 0;
    let keyPitch = 0;
    const resolveKeyRotation = () => {
        if (pressedKeys.ArrowLeft) keyYaw = Math.max(-maxKeyRotation, keyYaw - keyRotationSpeed);
        if (pressedKeys.ArrowRight) keyYaw = Math.min(maxKeyRotation, keyYaw + keyRotationSpeed);
        if (pressedKeys.ArrowUp) keyPitch = Math.max(-maxKeyRotation, keyPitch - keyRotationSpeed);
        if (pressedKeys.ArrowDown) keyPitch = Math.min(maxKeyRotation, keyPitch + keyRotationSpeed);
        return { yaw: keyYaw, pitch: keyPitch, roll: 0 };
    };
    // Starting camera: offset added to the tracked/pointer head position, so the resting
    // view starts lower than the raw tracker origin and a bit in front of the max zoom-out.
    // The eye sits 100 in front of the head, so the resting eye is at (0, 60, 150).
    const startHeadOffset = { x: 0, y: 60, z: 50 };
    // Zoom limits on the head's z (after the offset). Nothing else limits head tracking.
    // Applies to head tracking, the pointer fallback and heroDebug.
    // - Zoom out: layer-11 (the foreground frame) is sized to frame the view from eye z
    //   250; any further back shows its edges, so the head stops at z 150. From the start
    //   that leaves 100 of lean-back room (50 of real head movement with headDepthGain).
    // - Zoom in: fly through the layers, like the earlier layered version - each panel
    //   grows huge as you approach and vanishes as you pass it. Stops with the eye at
    //   z -1100, just past the title (z -1000) and before layer-05 (z -1200).
    // Leaning moves the head twice as far in depth (headDepthGain), so the fly-through is
    // reachable with real head movement.
    const headDepthGain = 2;
    const maxZoomOutHeadZ = 150;
    const maxZoomInHeadZ = -1200;
    // Side limit, only restrictive when far back: layer-11's edges are 825 either side of
    // center at z -300, and the view (35.8deg half-width) turned up to maxYaw reaches
    // distance * 1.23 sideways (tan(35.8deg + 15deg)). So the head may move sideways
    // 825 - distance * 1.23: ~150 at the start (distance 550), ~640 at max zoom-in (150).
    const placeHead = (position: Vector3): Vector3 => {
        const z = Math.min(maxZoomOutHeadZ, Math.max(maxZoomInHeadZ, startHeadOffset.z + position.z * headDepthGain));
        const distanceToLayer11 = z + 100 + 300;
        const maxSide = 825 - distanceToLayer11 * 1.23;
        return {
            x: Math.max(-maxSide, Math.min(maxSide, position.x + startHeadOffset.x)),
            y: position.y + startHeadOffset.y,
            z,
        };
    };
    const clampYaw = (yaw: number) => Math.max(-maxYaw, Math.min(maxYaw, yaw));
    const observerModifier: CarModifier<typeof dataProviderLib> = {
        name: 'Head tracking with pointer fallback',
        active: true,
        priority: 10,
        requiredDataProviders: [],
        tick: sceneId => headModifier.tick(sceneId),
        getCarPosition: (position, context) => {
            // Read every frame regardless of branch, so arrow-key rotation always works
            // (including on top of head tracking) - makes debugging the scene much easier
            // than having to disable the camera first.
            const keyRotation = resolveKeyRotation();
            if (context.dataProviders.headTracker && !debugHeadOverride) {
                announceStatus('Head tracking active.');
                const result = headModifier.getCarPosition(position, context);
                if (!result.success) return result;
                return {
                    success: true,
                    value: {
                        ...result.value,
                        position: placeHead(result.value.position),
                        rotation: {
                            yaw: clampYaw((result.value.rotation?.yaw ?? 0) + keyRotation.yaw),
                            pitch: (result.value.rotation?.pitch ?? 0) + keyRotation.pitch,
                            roll: result.value.rotation?.roll ?? 0,
                        },
                    },
                };
            }
            const cameraReady = webCamProvider?.getStatus?.() === 'READY';
            announceStatus(cameraReady
                ? 'No face detected. Move the mouse to look around and scroll to change depth.'
                : initialized
                    ? 'Camera unavailable. Move the mouse to look around and scroll to change depth.'
                    : 'Starting camera. Mouse and scroll controls are active.');
            return { success: true, value: { name: 'Pointer fallback', position: placeHead(pointer), rotation: keyRotation } };
        },
    };
    world.addModifierToProjection('head', observerModifier, 'car');

    const mountainWidth = 1603;
    const mountainHeight = 847;

    // Mountain backdrop - a big distant panel of the same mountain artwork.
    // Plain \`follow\` (position only, no rotation tracking) keeps it a fixed
    // distance away as the observer moves, like real distant scenery, but it
    // does NOT re-center on wherever the camera is looking: panning/tilting
    // the view slides it toward the edge and out of frame like an actual
    // fixed landmark, instead of staying glued to the center of your gaze.
    const mountainBackdropWidth = 4000;
    const mountainBackdropHeight = mountainBackdropWidth * mountainHeight / mountainWidth;
    const mountainBackdropDistance = -2500;
    // Layers 01/02 follow the camera's z, but layer 03 sits at a fixed world z. Left
    // unbounded, moving back (+z) slides layer 02 onto layer 03's plane (observer z ~250)
    // and they z-fight. Bounding the followed camera z stops both following boxes - rigidly,
    // walls included - at least mountainMinGap behind layer 03. The floor and roof share the
    // same bounds: if they kept following while the boxes stopped, the roof's far edge would
    // drift below the backdrop's top and open a black band of sky between them.
    const mountainMinGap = 100;
    const mountainFollowBounds = {
        max: { z: mountainBackdropDistance * 0.8 - mountainBackdropDistance * 0.9 - mountainMinGap },
    };
    world.addPanel({
        id: 'mountain-backdrop-01',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainBackdropWidth,
        height: mountainBackdropHeight,
        position: { x: 0, y: 0, z: mountainBackdropDistance },
        texture: { path: appAssetPath('img/hero/layer-01.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });
    world.addPanel({
        id: 'mountain-backdrop-02',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainBackdropWidth * 0.9,
        height: mountainBackdropHeight * 0.9,
        position: { x: 400, y: -400, z: mountainBackdropDistance * 0.9 },
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth , height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    // Side walls - same mountain artwork, folded 90 degrees off the backdrop's left/right
    // edges so they read as the side faces of a box around the observer. Each is mirrored
    // horizontally, so the edge touching the backdrop reflects it like a fold in a mirror,
    // instead of abruptly restarting the image. Same plain \`follow\` as the backdrop, so the
    // whole box stays rigidly together as the observer moves.
    const mountainSideDepth = 3000;
    const mountainBackdropHalfWidth = mountainBackdropWidth / 2;
    // Fold angle of each wall off the backdrop's edge: 0 = flat continuation of the
    // backdrop, PI/2 = square box. 45 degrees splays the walls outward like an open stage
    // set. Each wall hinges on the backdrop's edge, so its center sits half a wall along the
    // folded direction from that edge (yaw is p5's rotateY: local +x -> (cos, -sin) in x/z).
    const mountainSideFold = Math.PI / 4;
    // Walls extend mountainSeamOverlap past the hinge, tucked behind the backdrop: two quads
    // that merely share an edge leave a sub-pixel crack (separate transforms round
    // differently), and with nothing behind layer 01 that crack shows as a black line in
    // the sky. The outer end stays where it was; only the hidden end grows.
    const mountainSeamOverlap = 20;
    const mountainSideLength = mountainSideDepth + mountainSeamOverlap;
    const mountainSideCenterOffset = (mountainSideDepth - mountainSeamOverlap) / 2;
    const mountainSideX = mountainBackdropHalfWidth + mountainSideCenterOffset * Math.cos(mountainSideFold);
    const mountainSideZ = mountainBackdropDistance + mountainSideCenterOffset * Math.sin(mountainSideFold);
    const mountainSideLeftYaw = mountainSideFold - Math.PI;
    const mountainSideRightYaw = Math.PI - mountainSideFold;

    world.addPanel({
        id: 'mountain-backdrop-01-left',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength,
        height: mountainBackdropHeight,
        position: { x: -mountainSideX, y: 0, z: mountainSideZ },
        rotate: { pitch: 0, yaw: mountainSideLeftYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-01.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-02-left',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength * 0.9,
        height: mountainBackdropHeight * 0.9,
        position: { x: -mountainSideX * 0.9, y: 0, z: mountainSideZ * 0.9 },
        rotate: { pitch: 0, yaw: mountainSideLeftYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-01-right',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength,
        height: mountainBackdropHeight,
        position: { x: mountainSideX, y: 0, z: mountainSideZ },
        rotate: { pitch: 0, yaw: mountainSideRightYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-01.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-02-right',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength * 0.9,
        height: mountainBackdropHeight * 0.9,
        position: { x: mountainSideX * 0.9, y: 0, z: mountainSideZ * 0.9 },
        rotate: { pitch: 0, yaw: mountainSideRightYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    // Layer 03 - third box, in front of layer 02 at 0.8 scale, with the same splayed
    // side walls (origin-anchored scaling keeps them hinged on its backdrop's edges).
    // Unlike layers 01/02 it follows the camera on x/y only, not z: it keeps a fixed world
    // depth, so leaning in/out brings it closer/further - nearer scenery that has parallax.
    const layer03Width = 1234;
    const layer03Height = 669;

    world.addPanel({
        id: 'mountain-backdrop-03',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainBackdropWidth * 0.8,
        height: mountainBackdropHeight * 0.8,
        position: { x: -100, y: -400, z: mountainBackdropDistance * 0.8 },
        texture: { path: appAssetPath('img/hero/layer-03.png'), width: layer03Width, height: layer03Height },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', axis: { x: true, y: true, z: false } } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-03-left',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength * 0.8,
        height: mountainBackdropHeight * 0.8,
        position: { x: -100 + -mountainSideX * 0.8, y: -200, z: mountainSideZ * 0.8 },
        rotate: { pitch: 0, yaw: mountainSideLeftYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-03.png'), width: layer03Width, height: layer03Height },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', axis: { x: true, y: true, z: false } } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-03-right',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength * 0.8,
        height: mountainBackdropHeight * 0.8,
        position: { x: mountainSideX * 0.8, y: 0, z: mountainSideZ * 0.8 },
        rotate: { pitch: 0, yaw: mountainSideRightYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-03.png'), width: layer03Width, height: layer03Height },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', axis: { x: true, y: true, z: false } } },
        ],
    });

    // Layer 04 - a plain panel fixed in 3D space (no follow effect), at the image's own size
    // and proportions, left of the view axis, with a mirrored copy extending it further left.
    world.addPanel({
        id: 'layer-04',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 696,
        height: 507,
        position: { x:  -350, y: 50, z: -800 },
        texture: { path: appAssetPath('img/hero/layer-04.png'), width: 696, height: 507 },
    });
    world.addPanel({
        id: 'layer-04-mirror',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 696,
        height: 507,
        mirrorTextureHorizontal: true,
        position: { x:  -350 - 696, y: 50, z: -810 },
        texture: { path: appAssetPath('img/hero/layer-04.png'), width: 696, height: 507 },
    });

    world.addPanel({
        id: 'layer-05',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 908,
        height: 565,
        position: { x: 550, y: 50, z: -1200 },
        texture: { path: appAssetPath('img/hero/layer-05.png'), width: 908, height: 565 },
    });
    world.addPanel({
        id: 'layer-05-mirror',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 908,
        height: 565,
        mirrorTextureHorizontal: true,
        position: { x: 550 + 908, y: 50, z: -1210 },
        texture: { path: appAssetPath('img/hero/layer-05.png'), width: 908, height: 565 },
    });

    // Layer 06 - the tall tree: plain fixed panel at the image's own size, right of center
    // and in front of the layer 04/05 land, as it stood in the original artwork.
    world.addPanel({
        id: 'layer-06',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 221,
        height: 813,
        position: { x: 250, y: 180, z: -650 },
        texture: { path: appAssetPath('img/hero/layer-06.png'), width: 221, height: 813 },
    });

    // // Layers 07/08 - the nearest foreground pieces (in front of the tree), plain fixed panels
    // // at the images' own sizes, both resting on roughly the same ground line (bottom ~y 350):
    // // 07 is the dark cliff house on the left, 08 the waterfall land strip on the right.
    // // They overlap on screen, so they must NOT share a z: equal depths z-fight (flicker as
    // // the observer moves). 07 sits slightly behind, as the land was drawn over the house
    // // in the original artwork.
    world.addPanel({
        id: 'layer-07',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 674,
        height: 594,
        position: { x: -250, y: 50, z: -420 },
        texture: { path: appAssetPath('img/hero/layer-07.png'), width: 674, height: 594 },
    });

    world.addPanel({
        id: 'layer-08',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 872,
        height: 302,
        position: { x: 470, y: 200, z: -400 },
        texture: { path: appAssetPath('img/hero/layer-08.png'), width: 872, height: 302 },
    });

    // // Layers 09/10 - the crooked house and the lamp post beside it, from the same nearest
    // // group as 07/08: plain fixed panels at the images' own sizes on the same ground line
    // // (bottom ~y 347), each at its own z so nothing overlapping shares a depth.
    world.addPanel({
        id: 'layer-09',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 299,
        height: 495,
        position: { x: 460, y: 100, z: -680 },
        texture: { path: appAssetPath('img/hero/layer-09.png'), width: 299, height: 495 },
    });

    world.addPanel({
        id: 'layer-10',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 70,
        height: 309,
        mirrorTextureHorizontal: true,
        position: { x: -140, y: 0, z: -380 },
        texture: { path: appAssetPath('img/hero/layer-10.png'), width: 70, height: 309 },
    });

    // Post light - the lamp post's lit lantern, laid over layer-10's own lantern head:
    // scaled down to match it (~0.19x the image), mirrored like the post, 3 in front of it.
    // It flickers through its tint (brightness), not its alpha - with alphaCutoff, an alpha
    // below 0.5 would make it vanish. Sines at unrelated speeds on the scene clock give a
    // never-repeating shimmer (0.75-1.0) plus an occasional deeper dip (~0.5); it pauses
    // with the scene.
    const postLightBrightness = (seconds: number) => {
        const shimmer = 0.5 * Math.sin(seconds * 11) + 0.3 * Math.sin(seconds * 23.7) + 0.2 * Math.sin(seconds * 4.3);
        const dip = Math.sin(seconds * 1.7) * Math.sin(seconds * 2.9) > 0.92 ? 0.35 : 0;
        return 0.875 + 0.125 * shimmer - dip;
    };
    world.addPanel({
        id: 'post-light',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        fillColor: context => {
            const brightness = postLightBrightness(context.playback.now / 1000);
            return { red: Math.round(255 * brightness), green: Math.round(240 * brightness), blue: Math.round(210 * brightness) } as ColorRGBA;
        },
        width: 48,
        height: 41,
        mirrorTextureHorizontal: true,
        position: { x: -132, y: -141, z: -377 },
        texture: { path: appAssetPath('img/hero/post-light.png'), width: 255, height: 219 },
    });

    // Layer 11 - the nearest layer, the foreground frame (ground across the bottom, tower on
    // the right), at the image's proportions. Wide enough (edges at +-825) that, with the
    // head's side limit and the 15deg turn cap above, its edges never come into view.
    // Bottom at y ~400, below the view's bottom from the starting eye.
    world.addPanel({
        id: 'layer-11',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 1650,
        height: 1177,
        position: { x: 0, y: -100, z: -300 },
        texture: { path: appAssetPath('img/hero/layer-11.png'), width: 1699, height: 1212 },
    });

    // Parallax title - restored from the earlier layered version: between the village
    // (layer-05, z -1200) and the far mountains (layer-03, z -2000), near the view center.
    // The outline is white strokes tinted black, 3 in front of the fill: enough that the two
    // overlapping panels never share a depth (no z-fighting), too little to notice.
    world.addPanel({
        id: 'parallax-title',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 820,
        height: 152,
        position: { x: 0, y: -270, z: -1000 },
        texture: { path: appAssetPath('img/hero/parallax-title.png'), width: 700, height: 130 },
    });

    world.addPanel({
        id: 'parallax-title-outline',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 820,
        height: 152,
        position: { x: 0, y: -270, z: -997 },
        fillColor: { red: 0, green: 0, blue: 0 },
        texture: { path: appAssetPath('img/hero/parallax-outline.png'), width: 700, height: 130 },
    });

    // Ground floor - \`position\` is its local offset from the camera's own
    // view (forward + down), rotated by the camera's current orientation via
    // \`followRotation\`, so it always reads as "the ground ahead of you":
    // mostly underfoot when looking down, ahead and below when looking
    // forward. Far enough to feel distant, never receding out of view since
    // it's rigidly tied to wherever the observer is looking.
    const floorForward = -600;
    const floorDrop = 400;
    world.addFloor({
        id: 'ground-floor',
        type: ELEMENT_TYPES.FLOOR,
        width: 6000,
        depth: 6000,
        position: { x: 0, y: floorDrop, z: floorForward },
        fillColor: COLORS.cyan,
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', followRotation: true, targetBounds: mountainFollowBounds } }
        ],
    });

    // Roof - a level sky ceiling above the observer (negative y is up in p5). It must stay
    // matched to the mountain backdrops, which never tilt: with \`followRotation\` the roof
    // pitched up with the head-tracked camera, its far edge swung above the backdrop's top
    // and opened a black band of sky between them. So it follows position only (bounded
    // like the boxes) and is wide enough to also cover above the splayed walls.
    // 2500 above the eye so it doesn't crop the mountain tops; still low enough that its far
    // edge (~20.7deg up) stays hidden behind the backdrop's top (~23.8deg up).
    world.addFloor({
        id: 'roof',
        type: ELEMENT_TYPES.FLOOR,
        width: 12000,
        depth: 12000,
        position: { x: 0, y: -2500, z: floorForward },
        fillColor: {red: 100 * 1.5, green: 68 * 1.5  , blue: 97 * 1.5 },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } }
        ],
    });

    let gp: P5GraphicProcessor;

    p.setup = () => {
        const canvas = p.createCanvas(config.width, config.height, p.WEBGL);
        canvasElement = canvas?.elt;
        canvasElement?.addEventListener('pointermove', event => {
            const bounds = canvasElement!.getBoundingClientRect();
            const pointerEvent = event as PointerEvent;
            pointer.x = Math.max(-150, Math.min(150, ((pointerEvent.clientX - bounds.left) / bounds.width - 0.5) * 300));
            pointer.y = Math.max(-100, Math.min(100, ((pointerEvent.clientY - bounds.top) / bounds.height - 0.5) * 200));
        });
        canvasElement?.addEventListener('wheel', event => {
            event.preventDefault();
            // Wheel range reaches the full fly-through (x headDepthGain): -700 -> eye past the title.
            pointer.z = Math.max(-700, Math.min(100, pointer.z + (event as WheelEvent).deltaY * 0.25));
        }, { passive: false });
    };

    world.complete();

    // Keyboard controls - see the note above resolveKeyRotation for why these land in
    // a plain closure object (pressedKeys) rather than the engine's ExternalStore.
    window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key.startsWith('Arrow')) event.preventDefault();
        pressedKeys[event.key] = true;
    });
    window.addEventListener('keyup', (event: KeyboardEvent) => {
        pressedKeys[event.key] = false;
    });

    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }

        // Clear to layer-01's sky color, not black: any view that slips past the scene's
        // edges (e.g. between the roof's far edge and the mountain tops) reads as sky.
        p.background(145, 101, 148);
        if (gp) {
            const result = await world.step(gp);
            if (!result.running) return;
            announceObserver();
        }
    };

    // Debug readout: report the observer's (eye's) global position to the page, which
    // shows it in the title. Only fires when the rounded position actually changes.
    let lastObserverKey = '';
    const announceObserver = () => {
        const eye = world.getCurrenState()?.projections.get(STANDARD_PROJECTION_IDS.EYE);
        if (!eye) return;
        const position = eye.globalPosition ?? eye.position;
        const observer = { x: Math.round(position.x), y: Math.round(position.y), z: Math.round(position.z) };
        const key = \`\${observer.x},\${observer.y},\${observer.z}\`;
        if (key === lastObserverKey) return;
        lastObserverKey = key;
        canvasElement?.dispatchEvent(new CustomEvent('observerchange', { detail: observer, bubbles: true }));
    };

    try {
        await faceDataProvider.init();
    } catch (error) {
        console.warn('Camera unavailable; pointer controls remain active.', error);
    }
    initialized = true;
    gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    return world;
}
`;function F(h){return h?'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4v16l13-8z"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>'}async function ze(h,p,L,_,W="",T={}){const x=document.getElementById("tutorial-root");if(!x)return;let n=document.getElementById(`step-${h}`);if(!n)n=Se({containerId:h,title:p,source:_,explanation:W}),x.appendChild(n);else{const o=n.querySelector('[data-content="preview"]'),i=n.querySelector('[data-content="code"]'),l=n.querySelector('[data-content="learn"]');if(o){const u=o.querySelector(".step-anchor");u&&(u.innerHTML=`<span>${p}</span>`)}if(i){const u=i.querySelector(".step-anchor");u&&(u.innerHTML=`<div class="status-dot"></div><span>${p}</span>`);const I=i.querySelector(".editor-box code");I&&(I.innerHTML=G.highlight(_,G.languages.typescript,"typescript"))}if(l){const u=l.querySelector(".learn-content");u&&(u.innerHTML=W)}}const K=n.querySelector(".editor-box"),e=n.querySelector(".canvas-box");e.dataset.aspectRatio=String(1654/1323);const g=n.querySelector(".console-panel"),k=n.querySelector(".play-btn"),y=n.querySelector(".reset-btn"),z=n.querySelector(".copy-btn"),c=n.querySelector(".pause-btn");k.innerHTML=F(!0),k.setAttribute("aria-label","Run code"),y.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg>',y.setAttribute("aria-label","Reset code"),z.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 4H4v11" fill="none" stroke="currentColor" stroke-width="2"/></svg>',z.setAttribute("aria-label","Copy code"),c.innerHTML=F(!1),c.setAttribute("aria-label","Pause"),n.querySelectorAll(".fullscreen-btn").forEach(o=>{o.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg>',o.setAttribute("aria-label","Fullscreen")});const E={...ne,...T,width:e?.clientWidth||500,height:e?.clientHeight||400,paused:!1},P=document.createElement("div");P.className="observer-readout",e.addEventListener("observerchange",o=>{const{x:i,y:l,z:u}=o.detail;P.isConnected||e.appendChild(P),P.textContent=`observer  x ${i}  y ${l}  z ${u}`});let{currentP5:m}=await re.createSketchInstance(L,E,e,h);const M=n.querySelectorAll(".tab-btn"),H=n.querySelectorAll(".step-content");M.forEach(o=>{o.addEventListener("click",()=>{const i=o.getAttribute("data-tab");M.forEach(l=>l.classList.remove("active")),o.classList.add("active"),H.forEach(l=>{l.getAttribute("data-content")===i?l.classList.add("active"):l.classList.remove("active")})})});const O=async()=>{g.style.display="block",g.innerHTML="";try{const{fn:o}=Ae(K.innerText);m=(await re.createSketchInstance(o,E,e,h)).currentP5,E.paused=!1,c.dataset.paused="false",c.innerHTML=F(!1),c.setAttribute("aria-label","Pause");const l=document.createElement("div");l.className="log-entry info",l.textContent="[Engine] Hydration successful.",g.appendChild(l)}catch(o){console.error("executeUpdate error:",o);const i=document.createElement("div");i.className="log-entry info",i.style.color="var(--error)",i.textContent=o instanceof Error?`Error: ${o.message}

Stack:
${o.stack}`:String(o),i.style.whiteSpace="pre-wrap",i.style.fontSize="11px",g.appendChild(i)}};k.addEventListener("click",O),y.addEventListener("click",()=>{const o=n.querySelector(".editor-box code");o&&(o.innerHTML=G.highlight(_,G.languages.typescript,"typescript")),O()}),z.addEventListener("click",()=>navigator.clipboard.writeText(K.innerText));const S=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0&&window.innerWidth<769;n.querySelectorAll(".fullscreen-btn").forEach(o=>{if(S()){o.style.display="none";return}o.addEventListener("click",()=>{const i=n.querySelector(".canvas-box");i&&(document.fullscreenElement||document.webkitFullscreenElement?document.exitFullscreen?.()||document.webkitExitFullscreen?.():(i.requestFullscreen?.bind(i)||i.webkitRequestFullscreen?.bind(i))?.())})}),c.addEventListener("click",()=>{if(!m)return;c.dataset.paused==="true"?(m.loop(),E.paused=!1,c.dataset.paused="false",c.innerHTML=F(!1),c.setAttribute("aria-label","Pause")):(m.noLoop(),E.paused=!0,c.dataset.paused="true",c.innerHTML=F(!0),c.setAttribute("aria-label","Resume"))})}ze("hero-demo-1","Living Parallax",Le,Te,Ce);
//# sourceMappingURL=main-DTN1wBrg.js.map
