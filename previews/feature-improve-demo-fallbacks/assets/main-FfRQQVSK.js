import"./tutorial-BEflRuS4.js";import{D as I,S as j,a as N,W as Z,H as K,b as X,c as V,P as J,d as R,e as Q,E as H,f as B,g as ee,t as te,h as A,s as W,i as re}from"./tutorial.template-CQT5E5k7.js";const ae=`
<p>The original FigCraft layers form this scene, preserving their page positions at the reference viewpoint. Move your head to see the layers shift with perspective. If no face is tracked, move the pointer over the canvas and scroll to change depth.</p>
`;async function ie(n,l=I,w){const k=l.clock??new j({...N,startPaused:l.paused,debug:!1,playback:{...N.playback,duration:1e4,isLoop:!0}}),s=1600,p=s/1.18-s,i=-3500,x=e=>Math.max(i,Math.min(p,e)),g=w?.faceConfig;let f=w?.webCamProvider;f=f??new Z(n,640,480);let v=w?.faceDataProvider;v=v??new K(n,{...g,baselineHeadPixels:120,baselineHeadSceneUnits:180,baseline:{x:0,y:0,z:0},cameraPosition:{x:0,y:0,z:s}});const P=new J(n),T={webCam:f,headTracker:v},r=new X(V.fromLibs({clock:k,loader:P,dataProviderLib:T}));r.startLoading(),r.enableDefaultPerspective(l.width,l.height,Math.PI/4,!0),l.paused&&r.pause(),r.loadPreset({...R,projectors:R.projectors.map(e=>e.id==="eye"?{...e,position:{x:0,y:0,z:s}}:e)});const c={x:0,y:0,z:p};let b=p,C=null;const D=()=>document.fullscreenElement||document.webkitFullscreenElement?60:150,E=e=>Math.max(-D(),Math.min(D(),e)),y=()=>Math.max(0,Math.min(1,(p-b)/(p-i))),t=e=>{b=e,C?.dispatchEvent(new CustomEvent("observerchange",{detail:{zoom:s/(s+e),closeness:y()}}))},a=new Q({disableRotation:!0,offsetMode:!0,damping:.1}),o=a.getCarPosition.bind(a),u={name:"Demo observer",active:!0,priority:10,requiredDataProviders:[],tick:e=>a.tick(e),getCarPosition:(e,m)=>{if(m.dataProviders.headTracker){const d=o(e,m);if(d.success){const h=d.value.position;return t(x(p+h.z*2)),{...d,value:{...d.value,position:{x:E(h.x*3),y:Math.max(-250,Math.min(250,h.y*3)),z:x(p+h.z*2)}}}}}return t(c.z),{success:!0,value:{name:"Pointer fallback",position:{...c,x:E(c.x)},rotation:{yaw:0,pitch:0,roll:0}}}}};r.addModifierToProjection("head",u,"car");const M=1,z=217,_=1920/1641,U=[{id:304,name:"layer6",width:1653.238,height:983,x:-819,y:-424,z:-3e3},{id:309,name:"layer 5",width:1700.5,height:1098.904,x:-900,y:-227,z:-2300},{id:357,name:"layer4",width:1268,height:750.378,x:-732,y:-0,z:-2e3},{id:403,name:"layer3-left-land",width:719.197,height:506.5,x:-827,y:239,z:-900},{id:434,name:"layer3-right-house",width:907.76,height:564.037,x:-104.76,y:215,z:-900},{id:466,name:"layer2-Left House",width:1482,height:711.433,x:-808,y:141,z:-350},{id:497,name:"layer2-right land",width:871.486,height:301.008,x:-60.989999999999995,y:575,z:-350},{id:508,name:"layer2-Tree",width:221,height:813,x:150,y:-117,z:-650},{id:517,name:"layer2-Right House",width:298,height:494.088,x:424,y:191,z:-350},{id:559,name:"layer2-post",width:69.5,height:309,x:181,y:336,z:-350},{id:565,name:"Layer1",width:1699,height:1212,x:-814,y:-131,z:0}],Y=new Set([304,309]);U.forEach((e,m)=>{const d=Y.has(e.id),h=_*(s-e.z)/s;r.addPanel({id:`figcraft-layer-${e.id}`,renderOrder:e.id===508?14.5:10+m,depthTest:!1,type:H.PANEL,width:e.width*h,height:e.height*h,position:d?($=>({x:(e.x+e.width/2-M)*h,y:(e.y+e.height/2-z)*h,z:($.projectionPool.head?.position.z??0)+e.z})):{x:(e.x+e.width/2-M)*h,y:(e.y+e.height/2-z)*h,z:e.z},texture:{path:B(`img/figcraft/layer-${e.id}.png`),width:e.width,height:e.height}})}),r.addFloor({id:"scene-floor",renderOrder:0,type:H.FLOOR,width:1e4,depth:7e3,position:{x:0,y:(900-z)*_,z:-1e3},fillColor:{red:158,green:195,blue:209},strokeWidth:0});const O=-1500,S=_*(s-O)/s;r.addPanel({id:"parallax-title",renderOrder:13.5,depthTest:!1,fillColor:()=>({red:255,green:Math.round(255-y()*25),blue:Math.round(255-y()*225)}),type:H.PANEL,width:700*S,height:130*S,position:{x:0,y:(210-z)*S,z:O},texture:{path:B("img/figcraft/parallax-title.png"),width:700,height:130}}),r.addPanel({id:"parallax-title-outline",type:H.PANEL,renderOrder:13.6,depthTest:!1,width:700*S,height:130*S,position:{x:0,y:(210-z)*S,z:O},texture:{path:B("img/figcraft/parallax-outline.png"),width:700,height:130},fillColor:()=>({red:Math.round(y()*139),green:Math.round(y()*69),blue:Math.round(y()*19)})});const G=w?.graphicProcessor??new ee(n,P);n.setup=()=>{const e=n.createCanvas(l.width,l.height,n.WEBGL);C=e.elt.parentElement,e.elt.addEventListener("pointermove",m=>{const d=e.elt.getBoundingClientRect();c.x=E(((m.clientX-d.left)/d.width-.5)*D()*2),c.y=Math.max(-250,Math.min(250,((m.clientY-d.top)/d.height-.5)*500))}),e.elt.addEventListener("wheel",m=>{m.preventDefault(),c.z=x(c.z+m.deltaY*.25)},{passive:!1})},r.complete();let F=!1;n.draw=async()=>{if(!(F||l.paused)){F=!0;try{r.isPaused()&&r.resume(),n.background(20),await r.step(G)}finally{F=!1}}};try{await v.init()}catch(e){console.warn("Head tracking unavailable; using pointer controls.",e)}return r}const oe=`import p5 from 'p5';
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
    layers.forEach((layer, index) => {
        const recedes = recedingLayerIds.has(layer.id);
        // Computed once at setup from the layer's fixed reference z - not re-derived per frame.
        const scale = sceneScale * (observerDistance - layer.z) / observerDistance;
        world.addPanel({
            id: \`figcraft-layer-\${layer.id}\`,
            renderOrder: layer.id === 508 ? 14.5 : 10 + index,
            depthTest: false,
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
        renderOrder: 0,
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
        renderOrder: 13.5,
        depthTest: false,
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
        renderOrder: 13.6,
        depthTest: false,
        width: 700 * titleScale,
        height: 130 * titleScale,
        position: { x: 0, y: (210 - centerY) * titleScale, z: titleZ },
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
`;function L(n){return n?'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4v16l13-8z"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>'}async function ne(n,l,w,k,s="",q={}){const p=document.getElementById("tutorial-root");if(!p)return;let i=document.getElementById(`step-${n}`);if(!i)i=te({containerId:n,title:l,source:k,explanation:s}),p.appendChild(i);else{const t=i.querySelector('[data-content="preview"]'),a=i.querySelector('[data-content="code"]'),o=i.querySelector('[data-content="learn"]');if(t){const u=t.querySelector(".step-anchor");u&&(u.innerHTML=`<span>${l}</span>`)}if(a){const u=a.querySelector(".step-anchor");u&&(u.innerHTML=`<div class="status-dot"></div><span>${l}</span>`);const M=a.querySelector(".editor-box code");M&&(M.innerHTML=A.highlight(k,A.languages.typescript,"typescript"))}if(o){const u=o.querySelector(".learn-content");u&&(u.innerHTML=s)}}const x=i.querySelector(".editor-box"),g=i.querySelector(".canvas-box");g.dataset.aspectRatio=String(1654/1323);const f=i.querySelector(".console-panel"),v=i.querySelector(".play-btn"),P=i.querySelector(".reset-btn"),T=i.querySelector(".copy-btn"),r=i.querySelector(".pause-btn");v.innerHTML=L(!0),v.setAttribute("aria-label","Run code"),P.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg>',P.setAttribute("aria-label","Reset code"),T.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 4H4v11" fill="none" stroke="currentColor" stroke-width="2"/></svg>',T.setAttribute("aria-label","Copy code"),r.innerHTML=L(!1),r.setAttribute("aria-label","Pause"),i.querySelectorAll(".fullscreen-btn").forEach(t=>{t.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg>',t.setAttribute("aria-label","Fullscreen")});const c={...I,...q,width:g?.clientWidth||500,height:g?.clientHeight||400,paused:!1};g.addEventListener("observerchange",t=>{const{closeness:a}=t.detail,o=Math.round(a*255);g.style.borderColor=`rgb(${o}, ${o}, ${o})`});let{currentP5:b}=await W.createSketchInstance(w,c,g,n);const C=i.querySelectorAll(".tab-btn"),D=i.querySelectorAll(".step-content");C.forEach(t=>{t.addEventListener("click",()=>{const a=t.getAttribute("data-tab");C.forEach(o=>o.classList.remove("active")),t.classList.add("active"),D.forEach(o=>{o.getAttribute("data-content")===a?o.classList.add("active"):o.classList.remove("active")})})});const E=async()=>{f.style.display="block",f.innerHTML="";try{const{fn:t}=re(x.innerText);b=(await W.createSketchInstance(t,c,g,n)).currentP5,c.paused=!1,r.dataset.paused="false",r.innerHTML=L(!1),r.setAttribute("aria-label","Pause");const o=document.createElement("div");o.className="log-entry info",o.textContent="[Engine] Hydration successful.",f.appendChild(o)}catch(t){console.error("executeUpdate error:",t);const a=document.createElement("div");a.className="log-entry info",a.style.color="var(--error)",a.textContent=t instanceof Error?`Error: ${t.message}

Stack:
${t.stack}`:String(t),a.style.whiteSpace="pre-wrap",a.style.fontSize="11px",f.appendChild(a)}};v.addEventListener("click",E),P.addEventListener("click",()=>{const t=i.querySelector(".editor-box code");t&&(t.innerHTML=A.highlight(k,A.languages.typescript,"typescript")),E()}),T.addEventListener("click",()=>navigator.clipboard.writeText(x.innerText));const y=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0&&window.innerWidth<769;i.querySelectorAll(".fullscreen-btn").forEach(t=>{if(y()){t.style.display="none";return}t.addEventListener("click",()=>{const a=i.querySelector(".canvas-box");a&&(document.fullscreenElement||document.webkitFullscreenElement?document.exitFullscreen?.()||document.webkitExitFullscreen?.():(a.requestFullscreen?.bind(a)||a.webkitRequestFullscreen?.bind(a))?.())})}),r.addEventListener("click",()=>{if(!b)return;r.dataset.paused==="true"?(b.loop(),c.paused=!1,r.dataset.paused="false",r.innerHTML=L(!1),r.setAttribute("aria-label","Pause")):(b.noLoop(),c.paused=!0,r.dataset.paused="true",r.innerHTML=L(!0),r.setAttribute("aria-label","Resume"))})}ne("hero-demo-1","Living Parallax",ie,oe,ae);
//# sourceMappingURL=main-FfRQQVSK.js.map
