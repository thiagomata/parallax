import"./tutorial-BEflRuS4.js";import{D as q,S as R,a as F,W as U,H as I,b as G,c as $,P as Z,d as B,e as j,E as L,f as _,g as K,t as V,h as z,s as X,i as J}from"./tutorial.template-CQT5E5k7.js";const Q=`
<p>The original FigCraft layers form this scene, preserving their page positions at the reference viewpoint. Move your head to see the layers shift with perspective. If no face is tracked, move the pointer over the canvas and scroll to change depth.</p>
`;async function ee(o,l=q,b){const k=l.clock??new R({...F,startPaused:l.paused,debug:!1,playback:{...F.playback,duration:1e4,isLoop:!0}}),d=1600,c=d/1.18-d,i=-3500,w=e=>Math.max(i,Math.min(c,e)),u=b?.faceConfig;let m=b?.webCamProvider;m=m??new U(o,640,480);let f=b?.faceDataProvider;f=f??new I(o,{...u,baselineHeadPixels:120,baselineHeadSceneUnits:180,baseline:{x:0,y:0,z:0},cameraPosition:{x:0,y:0,z:d}});const P=new Z(o),T={webCam:m,headTracker:f},a=new G($.fromLibs({clock:k,loader:P,dataProviderLib:T}));a.startLoading(),a.enableDefaultPerspective(l.width,l.height,Math.PI/4,!0),l.paused&&a.pause(),a.loadPreset({...B,projectors:B.projectors.map(e=>e.id==="eye"?{...e,position:{x:0,y:0,z:d}}:e)});const s={x:0,y:0,z:c};let y=c,C=null;const D=()=>document.fullscreenElement||document.webkitFullscreenElement?60:150,E=e=>Math.max(-D(),Math.min(D(),e)),v=()=>Math.max(0,Math.min(1,(c-y)/(c-i))),t=e=>{y=e,C?.dispatchEvent(new CustomEvent("observerchange",{detail:{zoom:d/(d+e),closeness:v()}}))},r=new j({disableRotation:!0,offsetMode:!0,damping:.1}),n=r.getCarPosition.bind(r),h={name:"Demo observer",active:!0,priority:10,requiredDataProviders:[],tick:e=>r.tick(e),getCarPosition:(e,p)=>{if(p.dataProviders.headTracker){const g=n(e,p);if(g.success){const M=g.value.position;return t(w(c+M.z*2)),{...g,value:{...g.value,position:{x:E(M.x*3),y:Math.max(-250,Math.min(250,M.y*3)),z:w(c+M.z*2)}}}}}return t(s.z),{success:!0,value:{name:"Pointer fallback",position:{...s,x:E(s.x)},rotation:{yaw:0,pitch:0,roll:0}}}}};a.addModifierToProjection("head",h,"car");const x=217,O=1920/1641;[{id:304,name:"layer6",width:1653.238,height:983,z:-3e3,panelWidth:5561.166215722121,panelHeight:3306.617915904936,panelX:22.26500914076792,panelY:-502.8884826325411},{id:309,name:"layer 5",width:1700.5,height:1098.904,z:-2300,panelWidth:4849.6892138939675,panelHeight:3133.9858135283366,panelX:-144.7349177330896,panelY:300.7406215722121},{id:357,name:"layer4",width:1268,height:750.378,z:-1600,panelWidth:2967.166361974406,panelHeight:1755.9119561243147,panelX:-465.6672760511883,panelY:346.7676782449726},{id:403,name:"layer3-left-land",width:719.197,height:506.5,z:-900,panelWidth:1314.8025594149908,panelHeight:925.9597806215721,panelX:-856.3098720292504,panelY:503.199268738574},{id:434,name:"layer3-right-house",width:907.76,height:564.037,z:-900,panelWidth:1659.5246800731259,panelHeight:1031.1462522851918,panelX:636.416819012797,panelY:511.9168190127971},{id:466,name:"layer2-Left House",width:1482,height:711.433,z:-350,panelWidth:2113.27239488117,panelHeight:1014.474844606947,panelX:-96.96526508226691,panelY:398.864478976234},{id:497,name:"layer2-right land",width:871.486,height:301.008,z:-350,panelWidth:1242.7039853747715,panelHeight:429.2253016453382,panelX:532.9567458866545,panelY:725.106252285192},{id:508,name:"layer2-Tree",width:221,height:813,z:-750,panelWidth:379.7806215722121,panelHeight:1397.111517367459,panelX:703.7111517367459,panelY:124.58866544789764},{id:517,name:"layer2-Right House",width:298,height:494.088,z:-350,panelWidth:424.93601462522855,panelHeight:704.5496160877515,panelX:815.6489945155394,panelY:315.19985374771477},{id:559,name:"layer2-post",width:69.5,height:309,z:-350,panelWidth:99.10420475319927,panelHeight:440.6215722120658,panelX:591.4168190127971,panelY:390},{id:565,name:"Layer1",width:1699,height:1212,z:0,panelWidth:1987.8610603290676,panelHeight:1418.0621572212067,panelX:40.36563071297989,panelY:301.86471663619744}].forEach((e,p)=>{a.addPanel({id:`figcraft-layer-${e.id}`,renderOrder:e.id===508?14.5:10+p,depthTest:!1,type:L.PANEL,width:e.panelWidth,height:e.panelHeight,position:{x:e.panelX,y:e.panelY,z:e.z},texture:{path:_(`img/figcraft/layer-${e.id}.png`),width:e.width,height:e.height}})}),a.addFloor({id:"scene-floor",renderOrder:0,type:L.FLOOR,width:1e4,depth:7e3,position:{x:0,y:(900-x)*O,z:-1e3},fillColor:{red:158,green:195,blue:209},strokeWidth:0});const A=-1500,S=O*(d-A)/d;a.addPanel({id:"parallax-title",renderOrder:13.5,depthTest:!1,fillColor:()=>({red:255,green:Math.round(255-v()*25),blue:Math.round(255-v()*225)}),type:L.PANEL,width:700*S,height:130*S,position:{x:0,y:(210-x)*S,z:A},texture:{path:_("img/figcraft/parallax-title.png"),width:700,height:130}}),a.addPanel({id:"parallax-title-outline",type:L.PANEL,renderOrder:13.6,depthTest:!1,width:700*S,height:130*S,position:{x:0,y:(210-x)*S,z:A},texture:{path:_("img/figcraft/parallax-outline.png"),width:700,height:130},fillColor:()=>({red:Math.round(v()*139),green:Math.round(v()*69),blue:Math.round(v()*19)})});const N=b?.graphicProcessor??new K(o,P);o.setup=()=>{const e=o.createCanvas(l.width,l.height,o.WEBGL);C=e.elt.parentElement,e.elt.addEventListener("pointermove",p=>{const g=e.elt.getBoundingClientRect();s.x=E(((p.clientX-g.left)/g.width-.5)*D()*2),s.y=Math.max(-250,Math.min(250,((p.clientY-g.top)/g.height-.5)*500))}),e.elt.addEventListener("wheel",p=>{p.preventDefault(),s.z=w(s.z+p.deltaY*.25)},{passive:!1})},a.complete();let W=!1;o.draw=async()=>{if(!(W||l.paused)){W=!0;try{a.isPaused()&&a.resume(),o.background(20),await a.step(N)}finally{W=!1}}};try{await f.init()}catch(e){console.warn("Head tracking unavailable; using pointer controls.",e)}return a}const te=`import p5 from 'p5';
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
    const centerY = 217;
    const sceneScale = 1920 / 1641;
    // Full export bounds, including artwork outside component boxes.
    // panelWidth/panelHeight/panelX/panelY are the real world-space size and position each
    // layer needs at its z so it reads at its original composed size once perspective is
    // applied - baked ahead of time instead of recomputed from scratch on every load.
    // width/height (raw export pixels) stay separate: they describe the source texture, not
    // the panel geometry.
    const layers = [
        {"id": 304, "name": "layer6", "width": 1653.238, "height": 983.0, "z": -3000, "panelWidth": 5561.166215722121, "panelHeight": 3306.617915904936, "panelX": 22.26500914076792, "panelY": -502.8884826325411},
        {"id": 309, "name": "layer 5", "width": 1700.5, "height": 1098.904, "z": -2300, "panelWidth": 4849.6892138939675, "panelHeight": 3133.9858135283366, "panelX": -144.7349177330896, "panelY": 300.7406215722121},
        {"id": 357, "name": "layer4", "width": 1268.0, "height": 750.378, "z": -1600, "panelWidth": 2967.166361974406, "panelHeight": 1755.9119561243147, "panelX": -465.6672760511883, "panelY": 346.7676782449726},
        {"id": 403, "name": "layer3-left-land", "width": 719.197, "height": 506.5, "z": -900, "panelWidth": 1314.8025594149908, "panelHeight": 925.9597806215721, "panelX": -856.3098720292504, "panelY": 503.199268738574},
        {"id": 434, "name": "layer3-right-house", "width": 907.76, "height": 564.037, "z": -900, "panelWidth": 1659.5246800731259, "panelHeight": 1031.1462522851918, "panelX": 636.416819012797, "panelY": 511.9168190127971},
        {"id": 466, "name": "layer2-Left House", "width": 1482.0, "height": 711.433, "z": -350, "panelWidth": 2113.27239488117, "panelHeight": 1014.474844606947, "panelX": -96.96526508226691, "panelY": 398.864478976234},
        {"id": 497, "name": "layer2-right land", "width": 871.486, "height": 301.008, "z": -350, "panelWidth": 1242.7039853747715, "panelHeight": 429.2253016453382, "panelX": 532.9567458866545, "panelY": 725.106252285192},
        {"id": 508, "name": "layer2-Tree", "width": 221.0, "height": 813.0, "z": -750, "panelWidth": 379.7806215722121, "panelHeight": 1397.111517367459, "panelX": 703.7111517367459, "panelY": 124.58866544789764},
        {"id": 517, "name": "layer2-Right House", "width": 298.0, "height": 494.088, "z": -350, "panelWidth": 424.93601462522855, "panelHeight": 704.5496160877515, "panelX": 815.6489945155394, "panelY": 315.19985374771477},
        {"id": 559, "name": "layer2-post", "width": 69.5, "height": 309.0, "z": -350, "panelWidth": 99.10420475319927, "panelHeight": 440.6215722120658, "panelX": 591.4168190127971, "panelY": 390},
        {"id": 565, "name": "Layer1", "width": 1699.0, "height": 1212.0, "z": 0, "panelWidth": 1987.8610603290676, "panelHeight": 1418.0621572212067, "panelX": 40.36563071297989, "panelY": 301.86471663619744},
    ];
    layers.forEach((layer, index) => {
        world.addPanel({
            id: \`figcraft-layer-\${layer.id}\`,
            renderOrder: layer.id === 508 ? 14.5 : 10 + index,
            depthTest: false,
            type: ELEMENT_TYPES.PANEL,
            width: layer.panelWidth,
            height: layer.panelHeight,
            position: {
                x: layer.panelX,
                y: layer.panelY,
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
`;function H(o){return o?'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4v16l13-8z"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>'}async function ae(o,l,b,k,d="",Y={}){const c=document.getElementById("tutorial-root");if(!c)return;let i=document.getElementById(`step-${o}`);if(!i)i=V({containerId:o,title:l,source:k,explanation:d}),c.appendChild(i);else{const t=i.querySelector('[data-content="preview"]'),r=i.querySelector('[data-content="code"]'),n=i.querySelector('[data-content="learn"]');if(t){const h=t.querySelector(".step-anchor");h&&(h.innerHTML=`<span>${l}</span>`)}if(r){const h=r.querySelector(".step-anchor");h&&(h.innerHTML=`<div class="status-dot"></div><span>${l}</span>`);const x=r.querySelector(".editor-box code");x&&(x.innerHTML=z.highlight(k,z.languages.typescript,"typescript"))}if(n){const h=n.querySelector(".learn-content");h&&(h.innerHTML=d)}}const w=i.querySelector(".editor-box"),u=i.querySelector(".canvas-box");u.dataset.aspectRatio=String(1654/1323);const m=i.querySelector(".console-panel"),f=i.querySelector(".play-btn"),P=i.querySelector(".reset-btn"),T=i.querySelector(".copy-btn"),a=i.querySelector(".pause-btn");f.innerHTML=H(!0),f.setAttribute("aria-label","Run code"),P.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg>',P.setAttribute("aria-label","Reset code"),T.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 4H4v11" fill="none" stroke="currentColor" stroke-width="2"/></svg>',T.setAttribute("aria-label","Copy code"),a.innerHTML=H(!1),a.setAttribute("aria-label","Pause"),i.querySelectorAll(".fullscreen-btn").forEach(t=>{t.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg>',t.setAttribute("aria-label","Fullscreen")});const s={...q,...Y,width:u?.clientWidth||500,height:u?.clientHeight||400,paused:!1};u.addEventListener("observerchange",t=>{const{closeness:r}=t.detail,n=Math.round(r*255);u.style.borderColor=`rgb(${n}, ${n}, ${n})`});let{currentP5:y}=await X.createSketchInstance(b,s,u,o);const C=i.querySelectorAll(".tab-btn"),D=i.querySelectorAll(".step-content");C.forEach(t=>{t.addEventListener("click",()=>{const r=t.getAttribute("data-tab");C.forEach(n=>n.classList.remove("active")),t.classList.add("active"),D.forEach(n=>{n.getAttribute("data-content")===r?n.classList.add("active"):n.classList.remove("active")})})});const E=async()=>{m.style.display="block",m.innerHTML="";try{const{fn:t}=J(w.innerText);y=(await X.createSketchInstance(t,s,u,o)).currentP5,s.paused=!1,a.dataset.paused="false",a.innerHTML=H(!1),a.setAttribute("aria-label","Pause");const n=document.createElement("div");n.className="log-entry info",n.textContent="[Engine] Hydration successful.",m.appendChild(n)}catch(t){console.error("executeUpdate error:",t);const r=document.createElement("div");r.className="log-entry info",r.style.color="var(--error)",r.textContent=t instanceof Error?`Error: ${t.message}

Stack:
${t.stack}`:String(t),r.style.whiteSpace="pre-wrap",r.style.fontSize="11px",m.appendChild(r)}};f.addEventListener("click",E),P.addEventListener("click",()=>{const t=i.querySelector(".editor-box code");t&&(t.innerHTML=z.highlight(k,z.languages.typescript,"typescript")),E()}),T.addEventListener("click",()=>navigator.clipboard.writeText(w.innerText));const v=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0&&window.innerWidth<769;i.querySelectorAll(".fullscreen-btn").forEach(t=>{if(v()){t.style.display="none";return}t.addEventListener("click",()=>{const r=i.querySelector(".canvas-box");r&&(document.fullscreenElement||document.webkitFullscreenElement?document.exitFullscreen?.()||document.webkitExitFullscreen?.():(r.requestFullscreen?.bind(r)||r.webkitRequestFullscreen?.bind(r))?.())})}),a.addEventListener("click",()=>{if(!y)return;a.dataset.paused==="true"?(y.loop(),s.paused=!1,a.dataset.paused="false",a.innerHTML=H(!1),a.setAttribute("aria-label","Pause")):(y.noLoop(),s.paused=!0,a.dataset.paused="true",a.innerHTML=H(!0),a.setAttribute("aria-label","Resume"))})}ae("hero-demo-1","Living Parallax",ee,te,Q);
//# sourceMappingURL=main-YhU_eeUx.js.map
