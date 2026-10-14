import{D as U,S as Y,a as L,W as G,H as B,b as I,c as Z,P as j,d as _,E as u,e as T,f as K}from"./colors-DuGZ_M5y.js";import{H as X}from"./tutorial.template-D871Iewy.js";const Q=`
<p>The original FigCraft layers form this scene, preserving their page positions at the reference viewpoint. Move your head to see the layers shift with perspective. If no face is tracked, move the pointer over the canvas and scroll to change depth.</p>
`;async function ee(o,s=U,p){const H=s.clock??new Y({...L,startPaused:s.paused,debug:!1,playback:{...L.playback,duration:1e4,isLoop:!0}}),a=1600,d=a/1.18-a,z=-1400,v=e=>Math.max(z,Math.min(d,e)),A=p?.faceConfig;let y=p?.webCamProvider;y=y??new G(o,640,480);let m=p?.faceDataProvider;m=m??new B(o,{...A,baselineHeadPixels:120,baselineHeadSceneUnits:180,baseline:{x:0,y:0,z:0},cameraPosition:{x:0,y:0,z:a}});const k=new j(o),O={webCam:y,headTracker:m},t=new I(Z.fromLibs({clock:H,loader:k,dataProviderLib:O}));t.startLoading(),t.enableDefaultPerspective(s.width,s.height,Math.PI/4,!0),s.paused&&t.pause(),t.loadPreset({..._,projectors:_.projectors.map(e=>e.id==="eye"?{...e,position:{x:0,y:0,z:a}}:e)});const c={x:0,y:0,z:d};let b=d,S=null;const w=()=>document.fullscreenElement||document.webkitFullscreenElement?60:150,P=e=>Math.max(-w(),Math.min(w(),e)),l=()=>Math.max(0,Math.min(1,(d-b)/(d-z))),M=e=>{b=e,S?.dispatchEvent(new CustomEvent("observerchange",{detail:{zoom:a/(a+e),closeness:l()}}))},x=new X({disableRotation:!0,offsetMode:!0,damping:.1}),N=x.getCarPosition.bind(x),F={name:"Demo observer",active:!0,priority:10,requiredDataProviders:[],tick:e=>x.tick(e),getCarPosition:(e,i)=>{if(i.dataProviders.headTracker){const r=N(e,i);if(r.success){const n=r.value.position;return M(v(d+n.z*2)),{...r,value:{...r.value,position:{x:P(n.x*3),y:Math.max(-250,Math.min(250,n.y*3)),z:v(d+n.z*2)}}}}}return M(c.z),{success:!0,value:{name:"Pointer fallback",position:{...c,x:P(c.x)},rotation:{yaw:0,pitch:0,roll:0}}}}};t.addModifierToProjection("head",F,"car");const W=1,f=217,E=1920/1641;[{id:304,name:"layer6",width:1653.238,height:983,x:-819,y:-424,z:-3e3},{id:309,name:"layer 5",width:1700.5,height:1098.904,x:-900,y:-227,z:-2300},{id:357,name:"layer4",width:1268,height:750.378,x:-832,y:-10,z:-1600},{id:403,name:"layer3-left-land",width:719.197,height:506.5,x:-827,y:239,z:-900},{id:434,name:"layer3-right-house",width:907.76,height:564.037,x:-104.76,y:215,z:-900},{id:466,name:"layer2-Left House",width:1482,height:711.433,x:-808,y:141,z:-350},{id:497,name:"layer2-right land",width:871.486,height:301.008,x:-60.989999999999995,y:575,z:-350},{id:508,name:"layer2-Tree",width:221,height:813,x:300,y:-117,z:-750},{id:517,name:"layer2-Right House",width:298,height:494.088,x:424,y:191,z:-350},{id:559,name:"layer2-post",width:69.5,height:309,x:381,y:336,z:-350},{id:565,name:"Layer1",width:1699,height:1212,x:-814,y:-131,z:0}].forEach((e,i)=>{const r=e.id===304||e.id===309?1.2:1,n=E*r*(a-e.z)/a,g=()=>e.id===304||e.id===309?(a-e.z+b*.9)/(a-e.z):1;t.addPanel({id:`figcraft-layer-${e.id}`,renderOrder:e.id===508?14.5:10+i,depthTest:!1,type:u.PANEL,width:()=>e.width*n*g(),height:()=>e.height*n*g(),position:()=>({x:(e.x+e.width/2-W)*n*g(),y:(e.y+e.height/2-f)*n*g(),z:e.z}),texture:{path:T(`img/figcraft/layer-${e.id}.png`),width:e.width,height:e.height}})}),t.addFloor({id:"scene-floor",renderOrder:0,type:u.FLOOR,width:1e4,depth:7e3,position:{x:0,y:(900-f)*E,z:-1e3},fillColor:{red:158,green:195,blue:209},strokeWidth:0});const D=-1500,h=E*(a-D)/a;t.addPanel({id:"parallax-title",renderOrder:13.5,depthTest:!1,fillColor:()=>({red:255,green:Math.round(255-l()*25),blue:Math.round(255-l()*225)}),type:u.PANEL,width:700*h,height:130*h,position:{x:0,y:(210-f)*h,z:D},texture:{path:T("img/figcraft/parallax-title.png"),width:700,height:130}}),t.addPanel({id:"parallax-title-outline",type:u.PANEL,renderOrder:13.6,depthTest:!1,width:700*h,height:130*h,position:{x:0,y:(210-f)*h,z:D},texture:{path:T("img/figcraft/parallax-outline.png"),width:700,height:130},fillColor:()=>({red:Math.round(l()*139),green:Math.round(l()*69),blue:Math.round(l()*19)})});const R=p?.graphicProcessor??new K(o,k);o.setup=()=>{const e=o.createCanvas(s.width,s.height,o.WEBGL);S=e.elt.parentElement,e.elt.addEventListener("pointermove",i=>{const r=e.elt.getBoundingClientRect();c.x=P(((i.clientX-r.left)/r.width-.5)*w()*2),c.y=Math.max(-250,Math.min(250,((i.clientY-r.top)/r.height-.5)*500))}),e.elt.addEventListener("wheel",i=>{i.preventDefault(),c.z=v(c.z+i.deltaY*.25)},{passive:!1})},t.complete();let C=!1;o.draw=async()=>{if(!(C||s.paused)){C=!0;try{t.isPaused()&&t.resume(),o.background(20),await t.step(R)}finally{C=!1}}};try{await m.init()}catch(e){console.warn("Head tracking unavailable; using pointer controls.",e)}return t}const te=`import p5 from 'p5';
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
export const figcraftExplanation = \`
<p>The original FigCraft layers form this scene, preserving their page positions at the reference viewpoint. Move your head to see the layers shift with perspective. If no face is tracked, move the pointer over the canvas and scroll to change depth.</p>
\`;

export async function figcraftParallax(
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
    const nearestObserverDepth = -1400;
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
        {"id": 357, "name": "layer4", "width": 1268.0, "height": 750.378, "x": -832.0, "y": -10.0, "z": -1600},
        {"id": 403, "name": "layer3-left-land", "width": 719.197, "height": 506.5, "x": -827.0, "y": 239.0, "z": -900},
        {"id": 434, "name": "layer3-right-house", "width": 907.76, "height": 564.037, "x": -104.76, "y": 215.0, "z": -900},
        {"id": 466, "name": "layer2-Left House", "width": 1482.0, "height": 711.433, "x": -808.0, "y": 141.0, "z": -350},
        {"id": 497, "name": "layer2-right land", "width": 871.486, "height": 301.008, "x": -60.989999999999995, "y": 575.0, "z": -350},
        {"id": 508, "name": "layer2-Tree", "width": 221.0, "height": 813.0, "x": 300.0, "y": -117.0, "z": -750},
        {"id": 517, "name": "layer2-Right House", "width": 298.0, "height": 494.088, "x": 424.0, "y": 191.0, "z": -350},
        {"id": 559, "name": "layer2-post", "width": 69.5, "height": 309.0, "x": 381.0, "y": 336.0, "z": -350},
        {"id": 565, "name": "Layer1", "width": 1699.0, "height": 1212.0, "x": -814.0, "y": -131.0, "z": 0},
    ];
    layers.forEach((layer, index) => {
        const backdropScale = layer.id === 304 || layer.id === 309 ? 1.2 : 1;
        const scale = sceneScale * backdropScale * (observerDistance - layer.z) / observerDistance;
        const compensation = () => layer.id === 304 || layer.id === 309
            ? (observerDistance - layer.z + observerDepth * 0.9) / (observerDistance - layer.z)
            : 1;
        world.addPanel({
            id: \`figcraft-layer-\${layer.id}\`,
            renderOrder: layer.id === 508 ? 14.5 : 10 + index,
            depthTest: false,
            type: ELEMENT_TYPES.PANEL,
            width: () => layer.width * scale * compensation(),
            height: () => layer.height * scale * compensation(),
            position: () => ({
                x: (layer.x + layer.width / 2 - centerX) * scale * compensation(),
                y: (layer.y + layer.height / 2 - centerY) * scale * compensation(),
                z: layer.z,
            }),
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
`;export{ee as a,Q as f,te as h};
//# sourceMappingURL=figcraft_parallax-BYPeq0Ba.js.map
