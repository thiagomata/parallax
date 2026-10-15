import"../../tutorial-BEflRuS4.js";import{D as S,S as D,a as T,W as L,H as O,b as M,c as _,P as I,d as R,e as N,E as o,k as n,g as Y}from"../../tutorial.template-Ca7-wuEw.js";import{i as H,a as W}from"../../tutorial_nav-B5ZdmuVV.js";const B=`
<div class="concept">
<p><strong>3D Parallax</strong> creates the illusion of depth by shifting objects at different speeds based on their distance from the camera. Objects closer to you move more than distant objects when you shift your head, mimicking how real 3D vision works.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Perspective Projection</strong> - Enable <code>enableDefaultPerspective()</code> with <code>wideFov: true</code>. This creates a wide-angle view that exaggerates parallax.</li>
<li><strong>Head Tracking</strong> - Head position data is applied to the camera via <code>HeadTrackingModifier</code>, creating responsive parallax based on your actual head position.</li>
<li><strong>Object Depth</strong> - Objects at different Z positions shift differently as the camera moves. Close objects shift more; distant objects shift less.</li>
<li><strong>The Pop-Out Effect</strong> - With sufficient head movement and wide FOV, objects near the camera can appear to "pop out" of the screen toward you.</li>
</ol>

<p>If face tracking is unavailable, move the mouse over the preview to look around and scroll to change depth.</p>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Parallax</span>
<span class="key-term">Depth</span>
<span class="key-term">Wide FOV</span>
<span class="key-term">Head Tracking</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-8">The Observer</a>
</div>
`;async function $(i,s=S,c){const d=s.clock??new D({...T,startPaused:s.paused,debug:!1,playback:{...T.playback,duration:1e4,isLoop:!0}}),b=c?.faceConfig;let y=c?.webCamProvider;y=y??new L(i,640,480);let f=c?.faceDataProvider;f=f??new O(i,{...b,baselineHeadPixels:120,baselineHeadSceneUnits:180,baseline:{x:0,y:0,z:0},cameraPosition:{x:0,y:0,z:300}});const v=new I(i),z={webCam:y,headTracker:f},t=new M(_.fromLibs({clock:d,loader:v,dataProviderLib:z}));t.startLoading(),t.enableDefaultPerspective(s.width,s.height,Math.PI/4,!0),s.paused&&t.pause(),t.loadPreset(R);const h={x:0,y:0,z:0};let g,x=!1,w="";const C=a=>{a!==w&&(w=a,g?.dispatchEvent(new CustomEvent("observerstatus",{bubbles:!0,detail:a})))},E=new N({disableRotation:!1,damping:.1}),k={name:"Head tracking with pointer fallback",active:!0,priority:10,requiredDataProviders:[],tick:a=>E.tick(a),getCarPosition:(a,l)=>{if(l.dataProviders.headTracker)return C("Head tracking active."),E.getCarPosition(a,l);const p=y?.getStatus?.()==="READY";return C(p?"No face detected. Move the mouse to look around and scroll to change depth.":x?"Camera unavailable. Move the mouse to look around and scroll to change depth.":"Starting camera. Mouse and scroll controls are active."),{success:!0,value:{name:"Pointer fallback",position:{...h},rotation:{yaw:0,pitch:0,roll:0}}}}};t.addModifierToProjection("head",k,"car");const u=200;for(let a=0;a<25;a++)t.addBox({id:`tunnel-${a}`,type:o.BOX,width:s.width,height:s.height,depth:10,strokeWidth:4,strokeColor:{red:255-a*10,green:255-a*10,blue:255-a*10},position:{x:0,y:50,z:-60*a}});var r=0;function e(a){r++,t.addBox({id:`target-${r}`,type:o.BOX,position:a,width:100}),t.addCylinder({id:`target-circle-${r}`,parentId:`target-${r}`,type:o.CYLINDER,radius:10/10,height:1,position:{x:0,y:50,z:-50},fillColor:n.red,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-circle-1-${r}`,parentId:`target-${r}`,type:o.CYLINDER,radius:80/10,height:1,position:{x:0,y:50,z:-49.9},fillColor:n.white,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-circle-2-${r}`,parentId:`target-${r}`,type:o.CYLINDER,radius:60/10,height:1,position:{x:0,y:50,z:-49.8},fillColor:n.red,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-circle-3-${r}`,parentId:`target-${r}`,type:o.CYLINDER,radius:40/10,height:1,position:{x:0,y:50,z:-49.7},fillColor:n.white,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-circle-4-${r}`,parentId:`target-${r}`,type:o.CYLINDER,radius:20/10,height:1,position:{x:0,y:50,z:-49.6},fillColor:n.red,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-stick-${r}`,parentId:`target-${r}`,type:o.CYLINDER,height:100,radius:20/10,position:{x:0,y:50,z:-100.1},fillColor:{red:100,green:0,blue:0},rotate:{pitch:Math.PI/2,yaw:0,roll:0}})}e({x:0,y:0,z:0}),e({x:-70,y:-10,z:50}),e({x:50,y:10,z:80}),e({x:10,y:-80,z:30}),e({x:10,y:-200,z:10}),e({x:-30,y:30,z:90}),e({x:50,y:-50,z:70}),e({x:-30,y:-20,z:20}),e({x:-130,y:-120,z:200}),e({x:130,y:120,z:250}),e({x:200,y:200,z:400}),e({x:-200,y:-200,z:500}),e({x:-150,y:0,z:100}),e({x:150,y:0,z:120}),e({x:0,y:150,z:150}),e({x:0,y:-150,z:180}),e({x:-100,y:100,z:200}),e({x:100,y:-100,z:220}),e({x:-180,y:-50,z:300}),e({x:180,y:50,z:320}),e({x:50,y:180,z:350}),e({x:-50,y:-180,z:380}),e({x:-220,y:100,z:450}),e({x:220,y:-100,z:480}),e({x:100,y:200,z:520}),e({x:-100,y:-200,z:550}),e({x:60,y:0,z:-50}),e({x:-80,y:50,z:-30}),e({x:80,y:-50,z:-40}),e({x:0,y:-100,z:-20}),e({x:0,y:100,z:-10}),t.addBox({id:"center-cube",type:o.BOX,width:50,strokeWidth:1,strokeColor:n.white,position:{x:0,y:u,z:0},fillColor:n.red}),t.addBox({id:"left-cube",type:o.BOX,width:40,strokeWidth:1,strokeColor:n.white,position:{x:-150,y:u,z:-100},fillColor:n.blue}),t.addBox({id:"right-cube",type:o.BOX,width:40,strokeWidth:.1,strokeColor:n.white,position:{x:150,y:u,z:-100},fillColor:n.orange}),t.addBox({id:"far-cube",type:o.BOX,width:30,strokeWidth:1,strokeColor:n.white,position:{x:0,y:u,z:-300},fillColor:n.cyan}),t.addBox({id:"front-cube",type:o.BOX,width:30,strokeWidth:1,strokeColor:n.white,position:{x:0,y:u,z:-30},fillColor:n.purple});let m;i.setup=()=>{g=i.createCanvas(s.width,s.height,i.WEBGL)?.elt,g?.addEventListener("pointermove",l=>{const p=g.getBoundingClientRect(),P=l;h.x=Math.max(-150,Math.min(150,((P.clientX-p.left)/p.width-.5)*300)),h.y=Math.max(-100,Math.min(100,((P.clientY-p.top)/p.height-.5)*200))}),g?.addEventListener("wheel",l=>{l.preventDefault(),h.z=Math.max(-50,Math.min(100,h.z+l.deltaY*.25))},{passive:!1})},t.complete(),i.draw=async()=>{s.paused&&!t.isPaused()?t.pause():!s.paused&&t.isPaused()&&t.resume(),i.background(20),m&&(await t.step(m)).running};try{await f.init()}catch(a){console.warn("Camera unavailable; pointer controls remain active.",a)}return x=!0,m=c?.graphicProcessor??new Y(i,v),t}const A=`import p5 from 'p5';
import { World } from "../../../scene/world.ts";
import { P5GraphicProcessor } from "../../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../../scene/providers/web_cam_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type CarModifier, type Vector3, type DampingValue, type SceneUnits, type VideoPixels} from "../../../scene/types.ts";
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "../sketch_config.ts";
import type { FaceConfig, P5SketchExtraArgs } from "../sketch_engine.types.ts";
import { WorldSettings } from "../../../scene/world_settings.ts";
import { HEAD_TRACKED_PRESET } from "../../../scene/presets.ts";
import { HeadTrackingModifier } from "../../../scene/modifiers/head_tracking_modifier.ts";
import {COLORS} from "../../../scene/colors.ts";

/**
 * TUTORIAL: 3D Parallax Depth
 * 
 * Experience depth through head movement.
 */
export const parallax_explanation = \`
<div class="concept">
<p><strong>3D Parallax</strong> creates the illusion of depth by shifting objects at different speeds based on their distance from the camera. Objects closer to you move more than distant objects when you shift your head, mimicking how real 3D vision works.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Perspective Projection</strong> - Enable <code>enableDefaultPerspective()</code> with <code>wideFov: true</code>. This creates a wide-angle view that exaggerates parallax.</li>
<li><strong>Head Tracking</strong> - Head position data is applied to the camera via <code>HeadTrackingModifier</code>, creating responsive parallax based on your actual head position.</li>
<li><strong>Object Depth</strong> - Objects at different Z positions shift differently as the camera moves. Close objects shift more; distant objects shift less.</li>
<li><strong>The Pop-Out Effect</strong> - With sufficient head movement and wide FOV, objects near the camera can appear to "pop out" of the screen toward you.</li>
</ol>

<p>If face tracking is unavailable, move the mouse over the preview to look around and scroll to change depth.</p>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Parallax</span>
<span class="key-term">Depth</span>
<span class="key-term">Wide FOV</span>
<span class="key-term">Head Tracking</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-8">The Observer</a>
</div>
\`;

export async function tutorial_parallax(
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
        WorldSettings.fromLibs({ clock, loader, dataProviderLib })
    );
    
    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 4, true);

    if (config.paused) {
        world.pause();
    }

    world.loadPreset(HEAD_TRACKED_PRESET);

    const pointer = { x: 0, y: 0, z: 0 };
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
    const observerModifier: CarModifier<typeof dataProviderLib> = {
        name: 'Head tracking with pointer fallback',
        active: true,
        priority: 10,
        requiredDataProviders: [],
        tick: sceneId => headModifier.tick(sceneId),
        getCarPosition: (position, context) => {
            if (context.dataProviders.headTracker) {
                announceStatus('Head tracking active.');
                return headModifier.getCarPosition(position, context);
            }
            const cameraReady = webCamProvider?.getStatus?.() === 'READY';
            announceStatus(cameraReady
                ? 'No face detected. Move the mouse to look around and scroll to change depth.'
                : initialized
                    ? 'Camera unavailable. Move the mouse to look around and scroll to change depth.'
                    : 'Starting camera. Mouse and scroll controls are active.');
            return { success: true, value: { name: 'Pointer fallback', position: { ...pointer }, rotation: { yaw: 0, pitch: 0, roll: 0 } } };
        },
    };
    world.addModifierToProjection('head', observerModifier, 'car');

    const floorY = 200;

    for (let i = 0; i < 25; i++) {
        world.addBox({
            id: \`tunnel-\${i}\`,
            type: ELEMENT_TYPES.BOX,
            width: config.width,
            height: config.height,
            depth: 10,
            strokeWidth: 4,
            strokeColor: {red: (255 - i * 10), green: (255 - i * 10), blue: (255 - i * 10)},
            position: { x: 0, y: 50, z: -60 * i },
        });
    }

    var counter = 0;
    function createTarget(pos: Vector3) {

        const targetSize = 10;

        counter++;
        world.addBox({
            id: \`target-\${counter}\`,
            type: ELEMENT_TYPES.BOX,
            position: pos,
            width: 100
        });
        world.addCylinder({
            id: \`target-circle-\${counter}\`,
            parentId: \`target-\${counter}\`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -50},
            fillColor: COLORS.red,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: \`target-circle-1-\${counter}\`,
            parentId: \`target-\${counter}\`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 8 * targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -49.9},
            fillColor: COLORS.white,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: \`target-circle-2-\${counter}\`,
            parentId: \`target-\${counter}\`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 6 * targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -49.8},
            fillColor: COLORS.red,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: \`target-circle-3-\${counter}\`,
            parentId: \`target-\${counter}\`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 4 * targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -49.7},
            fillColor: COLORS.white,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: \`target-circle-4-\${counter}\`,
            parentId: \`target-\${counter}\`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 2 * targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -49.6},
            fillColor: COLORS.red,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: \`target-stick-\${counter}\`,
            parentId: \`target-\${counter}\`,
            type: ELEMENT_TYPES.CYLINDER,
            height: 100,
            radius: 2 * targetSize / 10,
            position: {x: 0, y: 50, z: -100.1},
            fillColor: {red: 100, green: 0, blue: 0},
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
    }
    createTarget({x: 0, y: 0, z: 0});
    createTarget({x: -70, y: -10, z: 50});
    createTarget({x: 50, y: 10, z: 80});
    createTarget({x: 10, y: -80, z: 30});
    createTarget({x: 10, y: -200, z: 10});
    createTarget({x: -30, y: 30, z: 90});
    createTarget({x: 50, y: -50, z: 70});
    createTarget({x: -30, y: -20, z: 20});
    createTarget({x: -130, y: -120, z: 200});
    createTarget({x: 130, y: 120, z: 250});
    createTarget({x: 200, y: 200, z: 400});
    createTarget({x: -200, y: -200, z: 500});
    
    createTarget({x: -150, y: 0, z: 100});
    createTarget({x: 150, y: 0, z: 120});
    createTarget({x: 0, y: 150, z: 150});
    createTarget({x: 0, y: -150, z: 180});
    createTarget({x: -100, y: 100, z: 200});
    createTarget({x: 100, y: -100, z: 220});
    createTarget({x: -180, y: -50, z: 300});
    createTarget({x: 180, y: 50, z: 320});
    createTarget({x: 50, y: 180, z: 350});
    createTarget({x: -50, y: -180, z: 380});
    createTarget({x: -220, y: 100, z: 450});
    createTarget({x: 220, y: -100, z: 480});
    createTarget({x: 100, y: 200, z: 520});
    createTarget({x: -100, y: -200, z: 550});
    createTarget({x: 60, y: 0, z: -50});
    createTarget({x: -80, y: 50, z: -30});
    createTarget({x: 80, y: -50, z: -40});
    createTarget({x: 0, y: -100, z: -20});
    createTarget({x: 0, y: 100, z: -10});

    world.addBox({
        id: 'center-cube',
        type: ELEMENT_TYPES.BOX,
        width: 50,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: 0 },
        fillColor: COLORS.red,
    });

    world.addBox({
        id: 'left-cube',
        type: ELEMENT_TYPES.BOX,
        width: 40,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: -150, y: floorY, z: -100 },
        fillColor: COLORS.blue,
    });

    world.addBox({
        id: 'right-cube',
        type: ELEMENT_TYPES.BOX,
        width: 40,
        strokeWidth: 0.1,
        strokeColor: COLORS.white,
        position: { x: 150, y: floorY, z: -100 },
        fillColor: COLORS.orange,
    });

    world.addBox({
        id: 'far-cube',
        type: ELEMENT_TYPES.BOX,
        width: 30,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: -300 },
        fillColor: COLORS.cyan,
    });

    world.addBox({
        id: 'front-cube',
        type: ELEMENT_TYPES.BOX,
        width: 30,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: -30 },
        fillColor: COLORS.purple,
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
            pointer.z = Math.max(-50, Math.min(100, pointer.z + (event as WheelEvent).deltaY * 0.25));
        }, { passive: false });
    };

    world.complete();
    
    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }
        
        p.background(20);
        if (gp) {
            const result = await world.step(gp);
            if (!result.running) return;
        }
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
`,j=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0,F=j?void 0:{throttleThreshold:0,videoWidth:640,videoHeight:480};document.addEventListener("observerstatus",i=>{const c=i.target.closest(".canvas-side");if(!c)return;let d=c.querySelector(".observer-status");d||(d=document.createElement("p"),d.className="observer-status",d.setAttribute("role","status"),d.style.cssText="margin:8px 0;color:var(--text-secondary);font-size:13px",c.querySelector(".controls")?.before(d)),d.textContent=i.detail});H("tutorial-9","9. 3D Parallax Depth",$,A,B,{},F);W();
//# sourceMappingURL=tutorial-9-BUch3HDQ.js.map
