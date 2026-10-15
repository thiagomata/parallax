import"./tutorial-BEflRuS4.js";import{D as I,S as $,a as R,W as j,H as Z,b as K,c as X,P as V,d as O,e as J,E as H,f as N,g as Q,t as ee,h as A,s as W,i as te}from"./tutorial.template-Ca7-wuEw.js";const re=`
<p>The original FigCraft layers form this scene, preserving their page positions at the reference viewpoint. Move your head to see the layers shift with perspective. If no face is tracked, move the pointer over the canvas and scroll to change depth.</p>
`;async function ae(n,d=I,b){const k=d.clock??new $({...R,startPaused:d.paused,debug:!1,playback:{...R.playback,duration:1e4,isLoop:!0}}),c=1600,h=c/1.18-c,i=-3500,w=e=>Math.max(i,Math.min(h,e)),m=b?.faceConfig;let g=b?.webCamProvider;g=g??new j(n,640,480);let f=b?.faceDataProvider;f=f??new Z(n,{...m,baselineHeadPixels:120,baselineHeadSceneUnits:180,baseline:{x:0,y:0,z:0},cameraPosition:{x:0,y:0,z:c}});const x=new V(n),C={webCam:g,headTracker:f},r=new K(X.fromLibs({clock:k,loader:x,dataProviderLib:C}));r.startLoading(),r.enableDefaultPerspective(d.width,d.height,Math.PI/4,!0),d.paused&&r.pause(),r.loadPreset({...O,projectors:O.projectors.map(e=>e.id==="eye"?{...e,position:{x:0,y:0,z:c}}:e)});const l={x:0,y:0,z:h};let y=h,D=null;const T=()=>document.fullscreenElement||document.webkitFullscreenElement?60:150,P=e=>Math.max(-T(),Math.min(T(),e)),v=()=>Math.max(0,Math.min(1,(h-y)/(h-i))),t=e=>{y=e,D?.dispatchEvent(new CustomEvent("observerchange",{detail:{zoom:c/(c+e),closeness:v()}}))},a=new J({disableRotation:!0,offsetMode:!0,damping:.1}),o=a.getCarPosition.bind(a),p={name:"Demo observer",active:!0,priority:10,requiredDataProviders:[],tick:e=>a.tick(e),getCarPosition:(e,u)=>{if(u.dataProviders.headTracker){const s=o(e,u);if(s.success){const S=s.value.position;return t(w(h+S.z*2)),{...s,value:{...s.value,position:{x:P(S.x*3),y:Math.max(-250,Math.min(250,S.y*3)),z:w(h+S.z*2)}}}}}return t(l.z),{success:!0,value:{name:"Pointer fallback",position:{...l,x:P(l.x)},rotation:{yaw:0,pitch:0,roll:0}}}}};r.addModifierToProjection("head",p,"car");const M=1,z=217,_=1920/1641,U=[{id:304,name:"layer6",width:1653.238,height:983,x:-819,y:-424,z:-3e3},{id:309,name:"layer 5",width:1700.5,height:1098.904,x:-900,y:-227,z:-2300},{id:357,name:"layer4",width:1268,height:750.378,x:-732,y:-0,z:-2e3},{id:403,name:"layer3-left-land",width:719.197,height:506.5,x:-827,y:239,z:-900},{id:434,name:"layer3-right-house",width:907.76,height:564.037,x:-104.76,y:215,z:-900},{id:466,name:"layer2-Left House",width:1482,height:711.433,x:-808,y:141,z:-350},{id:497,name:"layer2-right land",width:871.486,height:301.008,x:-60.989999999999995,y:575,z:-350},{id:508,name:"layer2-Tree",width:221,height:813,x:150,y:-117,z:-650},{id:517,name:"layer2-Right House",width:298,height:494.088,x:424,y:191,z:-350},{id:559,name:"layer2-post",width:69.5,height:309,x:181,y:336,z:-350},{id:565,name:"Layer1",width:1699,height:1212,x:-814,y:-131,z:0}],Y=new Set([304,309]);U.forEach(e=>{const u=Y.has(e.id),s=_*(c-e.z)/c;r.addPanel({id:`figcraft-layer-${e.id}`,type:H.PANEL,width:e.width*s,height:e.height*s,position:u?(S=>({x:(e.x+e.width/2-M)*s,y:(e.y+e.height/2-z)*s,z:(S.projectionPool.head?.position.z??0)+e.z})):{x:(e.x+e.width/2-M)*s,y:(e.y+e.height/2-z)*s,z:e.z},texture:{path:N(`img/figcraft/layer-${e.id}.png`),width:e.width,height:e.height}})}),r.addFloor({id:"scene-floor",type:H.FLOOR,width:1e4,depth:7e3,position:{x:0,y:(900-z)*_,z:-1e3},fillColor:{red:158,green:195,blue:209},strokeWidth:0});const F=-1500,E=_*(c-F)/c;r.addPanel({id:"parallax-title",fillColor:()=>({red:255,green:Math.round(255-v()*25),blue:Math.round(255-v()*225)}),type:H.PANEL,width:700*E,height:130*E,position:{x:0,y:(210-z)*E,z:F},texture:{path:N("img/figcraft/parallax-title.png"),width:700,height:130}}),r.addPanel({id:"parallax-title-outline",type:H.PANEL,width:700*E,height:130*E,position:{x:0,y:(210-z)*E,z:F+1},texture:{path:N("img/figcraft/parallax-outline.png"),width:700,height:130},fillColor:()=>({red:Math.round(v()*139),green:Math.round(v()*69),blue:Math.round(v()*19)})});const G=b?.graphicProcessor??new Q(n,x);n.setup=()=>{const e=n.createCanvas(d.width,d.height,n.WEBGL);D=e.elt.parentElement,e.elt.addEventListener("pointermove",u=>{const s=e.elt.getBoundingClientRect();l.x=P(((u.clientX-s.left)/s.width-.5)*T()*2),l.y=Math.max(-250,Math.min(250,((u.clientY-s.top)/s.height-.5)*500))}),e.elt.addEventListener("wheel",u=>{u.preventDefault(),l.z=w(l.z+u.deltaY*.25)},{passive:!1})},r.complete();let B=!1;n.draw=async()=>{if(!(B||d.paused)){B=!0;try{r.isPaused()&&r.resume(),n.background(20),await r.step(G)}finally{B=!1}}};try{await f.init()}catch(e){console.warn("Head tracking unavailable; using pointer controls.",e)}return r}const ie=`import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../scene/providers/web_cam_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type CarModifier, type ColorRGBA, type DampingValue, type SceneUnits, type VideoPixels} from "../../scene/types.ts";
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "../tutorial/sketch_config.ts";
import type { FaceConfig, P5SketchExtraArgs } from "../tutorial/sketch_engine.types.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { HEAD_TRACKED_PRESET } from "../../scene/presets.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import {appAssetPath} from "../../utils/app_paths.ts";

/**
 * MAIN DEMO: 3D Parallax Depth
 * 
 * Experience depth through head movement.
 */
export const heroParallaxExplanation = \`
<p>The original FigCraft layers form this scene, preserving their page positions at the reference viewpoint. Move your head to see the layers shift with perspective. If no face is tracked, move the pointer over the canvas and scroll to change depth.</p>
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

    const observerDistance = 1600;
    const minimumZoom = 1.18;
    const farthestObserverDepth = observerDistance / minimumZoom - observerDistance;
    const nearestObserverDepth = -3500;
    const clampDepth = (depth: number) => Math.max(nearestObserverDepth, Math.min(farthestObserverDepth, depth));
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
            cameraPosition: {x: 0 as SceneUnits, y: 0 as SceneUnits, z: observerDistance as SceneUnits},
        }
    );

    const loader = new P5AssetLoader(p);
    const dataProviderLib: { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider } = {
        webCam: webCamProvider,
        headTracker: faceDataProvider,
    };
    const world = new World<P5Bundler, any, any, { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider }>(
        WorldSettings.fromLibs({ clock, loader, dataProviderLib })
    );
    
    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 4, true);

    if (config.paused) {
        world.pause();
    }

    world.loadPreset({
        ...HEAD_TRACKED_PRESET,
        projectors: HEAD_TRACKED_PRESET.projectors.map(projector =>
            projector.id === 'eye'
                ? { ...projector, position: { x: 0, y: 0, z: observerDistance } }
                : projector
        ),
    });

    const pointer = { x: 0, y: 0, z: farthestObserverDepth };
    let observerDepth = farthestObserverDepth;
    let sceneBox: HTMLElement | null = null;
    const horizontalLimit = () => document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ? 60 : 150;
    const clampHorizontal = (x: number) => Math.max(-horizontalLimit(), Math.min(horizontalLimit(), x));
    const closeness = () => Math.max(0, Math.min(1,
        (farthestObserverDepth - observerDepth) / (farthestObserverDepth - nearestObserverDepth)
    ));
    const updateObserver = (depth: number) => {
        observerDepth = depth;
        sceneBox?.dispatchEvent(new CustomEvent('observerchange', {
            detail: { zoom: observerDistance / (observerDistance + depth), closeness: closeness() },
        }));
    };
    const headModifier = new HeadTrackingModifier({
        disableRotation: true,
        offsetMode: true,
        damping: 0.1 as DampingValue,
    });
    const trackHead = headModifier.getCarPosition.bind(headModifier);
    const observerModifier: CarModifier<{ webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider }> = {
        name: 'Demo observer',
        active: true,
        priority: 10,
        requiredDataProviders: [],
        tick: sceneId => headModifier.tick(sceneId),
        getCarPosition: (initialPosition: Parameters<typeof trackHead>[0], context: Parameters<typeof trackHead>[1]): ReturnType<typeof trackHead> => {
        if (context.dataProviders.headTracker) {
            const result = trackHead(initialPosition, context);
            if (result.success) {
                const position = result.value.position;
                updateObserver(clampDepth(farthestObserverDepth + position.z * 2));
                return {
                    ...result,
                    value: {
                        ...result.value,
                        position: {
                            x: clampHorizontal(position.x * 3),
                            y: Math.max(-250, Math.min(250, position.y * 3)),
                            z: clampDepth(farthestObserverDepth + position.z * 2),
                        },
                    },
                };
            }
        }
        updateObserver(pointer.z);
        return {
            success: true,
            value: { name: "Pointer fallback", position: { ...pointer, x: clampHorizontal(pointer.x) }, rotation: { yaw: 0, pitch: 0, roll: 0 } },
        };
        },
    };
    world.addModifierToProjection('head', observerModifier, 'car');

    // Separate image panels create depth with the head-tracked camera.
    const centerX = 1;
    const centerY = 217;
    const sceneScale = 1920 / 1641;
    // Full export bounds, including artwork outside component boxes.
    const layers = [
        {"id": 304, "name": "layer6", "width": 1653.238, "height": 983.0, "x": -819.0, "y": -424.0, "z": -3000},
        {"id": 309, "name": "layer 5", "width": 1700.5, "height": 1098.904, "x": -900.0, "y": -227.0, "z": -2300},
        {"id": 357, "name": "layer4", "width": 1268.0, "height": 750.378, "x": -732.0, "y": -0.0, "z": -2000},
        {"id": 403, "name": "layer3-left-land", "width": 719.197, "height": 506.5, "x": -827.0, "y": 239.0, "z": -900},
        {"id": 434, "name": "layer3-right-house", "width": 907.76, "height": 564.037, "x": -104.76, "y": 215.0, "z": -900},
        {"id": 466, "name": "layer2-Left House", "width": 1482.0, "height": 711.433, "x": -808.0, "y": 141.0, "z": -350},
        {"id": 497, "name": "layer2-right land", "width": 871.486, "height": 301.008, "x": -60.989999999999995, "y": 575.0, "z": -350},
        {"id": 508, "name": "layer2-Tree", "width": 221.0, "height": 813.0, "x": 150.0, "y": -117.0, "z": -650},
        {"id": 517, "name": "layer2-Right House", "width": 298.0, "height": 494.088, "x": 424.0, "y": 191.0, "z": -350},
        {"id": 559, "name": "layer2-post", "width": 69.5, "height": 309.0, "x": 181.0, "y": 336.0, "z": -350},
        {"id": 565, "name": "Layer1", "width": 1699.0, "height": 1212.0, "x": -814.0, "y": -131.0, "z": 0},
    ];
    // The sky and mountains (304, 309) are the backdrop: they recede with the camera so
    // their distance from the eye - and therefore their apparent size - never changes,
    // no matter how far you zoom. Reading the head projection's resolved z keeps this
    // tied to the engine's actual camera position instead of a second tracked variable.
    const recedingLayerIds = new Set([304, 309]);
    layers.forEach(layer => {
        const recedes = recedingLayerIds.has(layer.id);
        // Computed once at setup from the layer's fixed reference z - not re-derived per frame.
        const scale = sceneScale * (observerDistance - layer.z) / observerDistance;
        world.addPanel({
            id: \`figcraft-layer-\${layer.id}\`,
            type: ELEMENT_TYPES.PANEL,
            width: layer.width * scale,
            height: layer.height * scale,
            position: recedes
                ? (context => ({
                    x: (layer.x + layer.width / 2 - centerX) * scale,
                    y: (layer.y + layer.height / 2 - centerY) * scale,
                    z: (context.projectionPool['head']?.position.z ?? 0) + layer.z,
                }))
                : {
                    x: (layer.x + layer.width / 2 - centerX) * scale,
                    y: (layer.y + layer.height / 2 - centerY) * scale,
                    z: layer.z,
                },
            texture: {
                path: appAssetPath(\`img/figcraft/layer-\${layer.id}.png\`),
                width: layer.width,
                height: layer.height,
            },
        });
    });

    world.addFloor({
        id: 'scene-floor',
        type: ELEMENT_TYPES.FLOOR,
        width: 10000,
        depth: 7000,
        position: { x: 0, y: (900 - centerY) * sceneScale, z: -1000 },
        fillColor: { red: 158, green: 195, blue: 209 },
        strokeWidth: 0,
    });

    const titleZ = -1500;
    const titleScale = sceneScale * (observerDistance - titleZ) / observerDistance;
    world.addPanel({
        id: 'parallax-title',
        fillColor: () => ({ red: 255, green: Math.round(255 - closeness() * 25), blue: Math.round(255 - closeness() * 225) } as ColorRGBA),
        type: ELEMENT_TYPES.PANEL,
        width: 700 * titleScale,
        height: 130 * titleScale,
        position: { x: 0, y: (210 - centerY) * titleScale, z: titleZ },
        texture: { path: appAssetPath('img/figcraft/parallax-title.png'), width: 700, height: 130 },
    });

    world.addPanel({
        id: 'parallax-title-outline',
        type: ELEMENT_TYPES.PANEL,
        width: 700 * titleScale,
        height: 130 * titleScale,
        // Nudged 1 unit closer than the fill so the two coplanar panels don't z-fight.
        position: { x: 0, y: (210 - centerY) * titleScale, z: titleZ + 1 },
        texture: { path: appAssetPath('img/figcraft/parallax-outline.png'), width: 700, height: 130 },
        fillColor: () => ({ red: Math.round(closeness() * 139), green: Math.round(closeness() * 69), blue: Math.round(closeness() * 19) } as ColorRGBA),
    });
    const gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    p.setup = () => {
        const canvas = p.createCanvas(config.width, config.height, p.WEBGL);
        sceneBox = canvas.elt.parentElement;
        canvas.elt.addEventListener('pointermove', (event: PointerEvent) => {
            const bounds = canvas.elt.getBoundingClientRect();
            pointer.x = clampHorizontal(((event.clientX - bounds.left) / bounds.width - 0.5) * horizontalLimit() * 2);
            pointer.y = Math.max(-250, Math.min(250, ((event.clientY - bounds.top) / bounds.height - 0.5) * 500));
        });
        canvas.elt.addEventListener('wheel', (event: WheelEvent) => {
            event.preventDefault();
            pointer.z = clampDepth(pointer.z + event.deltaY * 0.25);
        }, { passive: false });
    };

    world.complete();
    
    let rendering = false;
    p.draw = async () => {
        if (rendering || config.paused) return;
        rendering = true;
        try {
            if (world.isPaused()) world.resume();
            p.background(20);
            await world.step(gp);
        } finally {
            rendering = false;
        }
    };

    // Camera or model failure must leave the pointer-controlled scene usable.
    try {
        await faceDataProvider.init();
    } catch (error) {
        console.warn('Head tracking unavailable; using pointer controls.', error);
    }
    return world;
}
`;function L(n){return n?'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4v16l13-8z"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>'}async function oe(n,d,b,k,c="",q={}){const h=document.getElementById("tutorial-root");if(!h)return;let i=document.getElementById(`step-${n}`);if(!i)i=ee({containerId:n,title:d,source:k,explanation:c}),h.appendChild(i);else{const t=i.querySelector('[data-content="preview"]'),a=i.querySelector('[data-content="code"]'),o=i.querySelector('[data-content="learn"]');if(t){const p=t.querySelector(".step-anchor");p&&(p.innerHTML=`<span>${d}</span>`)}if(a){const p=a.querySelector(".step-anchor");p&&(p.innerHTML=`<div class="status-dot"></div><span>${d}</span>`);const M=a.querySelector(".editor-box code");M&&(M.innerHTML=A.highlight(k,A.languages.typescript,"typescript"))}if(o){const p=o.querySelector(".learn-content");p&&(p.innerHTML=c)}}const w=i.querySelector(".editor-box"),m=i.querySelector(".canvas-box");m.dataset.aspectRatio=String(1654/1323);const g=i.querySelector(".console-panel"),f=i.querySelector(".play-btn"),x=i.querySelector(".reset-btn"),C=i.querySelector(".copy-btn"),r=i.querySelector(".pause-btn");f.innerHTML=L(!0),f.setAttribute("aria-label","Run code"),x.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg>',x.setAttribute("aria-label","Reset code"),C.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 4H4v11" fill="none" stroke="currentColor" stroke-width="2"/></svg>',C.setAttribute("aria-label","Copy code"),r.innerHTML=L(!1),r.setAttribute("aria-label","Pause"),i.querySelectorAll(".fullscreen-btn").forEach(t=>{t.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg>',t.setAttribute("aria-label","Fullscreen")});const l={...I,...q,width:m?.clientWidth||500,height:m?.clientHeight||400,paused:!1};m.addEventListener("observerchange",t=>{const{closeness:a}=t.detail,o=Math.round(a*255);m.style.borderColor=`rgb(${o}, ${o}, ${o})`});let{currentP5:y}=await W.createSketchInstance(b,l,m,n);const D=i.querySelectorAll(".tab-btn"),T=i.querySelectorAll(".step-content");D.forEach(t=>{t.addEventListener("click",()=>{const a=t.getAttribute("data-tab");D.forEach(o=>o.classList.remove("active")),t.classList.add("active"),T.forEach(o=>{o.getAttribute("data-content")===a?o.classList.add("active"):o.classList.remove("active")})})});const P=async()=>{g.style.display="block",g.innerHTML="";try{const{fn:t}=te(w.innerText);y=(await W.createSketchInstance(t,l,m,n)).currentP5,l.paused=!1,r.dataset.paused="false",r.innerHTML=L(!1),r.setAttribute("aria-label","Pause");const o=document.createElement("div");o.className="log-entry info",o.textContent="[Engine] Hydration successful.",g.appendChild(o)}catch(t){console.error("executeUpdate error:",t);const a=document.createElement("div");a.className="log-entry info",a.style.color="var(--error)",a.textContent=t instanceof Error?`Error: ${t.message}

Stack:
${t.stack}`:String(t),a.style.whiteSpace="pre-wrap",a.style.fontSize="11px",g.appendChild(a)}};f.addEventListener("click",P),x.addEventListener("click",()=>{const t=i.querySelector(".editor-box code");t&&(t.innerHTML=A.highlight(k,A.languages.typescript,"typescript")),P()}),C.addEventListener("click",()=>navigator.clipboard.writeText(w.innerText));const v=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0&&window.innerWidth<769;i.querySelectorAll(".fullscreen-btn").forEach(t=>{if(v()){t.style.display="none";return}t.addEventListener("click",()=>{const a=i.querySelector(".canvas-box");a&&(document.fullscreenElement||document.webkitFullscreenElement?document.exitFullscreen?.()||document.webkitExitFullscreen?.():(a.requestFullscreen?.bind(a)||a.webkitRequestFullscreen?.bind(a))?.())})}),r.addEventListener("click",()=>{if(!y)return;r.dataset.paused==="true"?(y.loop(),l.paused=!1,r.dataset.paused="false",r.innerHTML=L(!1),r.setAttribute("aria-label","Pause")):(y.noLoop(),l.paused=!0,r.dataset.paused="true",r.innerHTML=L(!0),r.setAttribute("aria-label","Resume"))})}oe("hero-demo-1","Living Parallax",ae,ie,re);
//# sourceMappingURL=main-CEcOsbCX.js.map
