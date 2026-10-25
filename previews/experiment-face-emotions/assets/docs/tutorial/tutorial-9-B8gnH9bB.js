import"../../tutorial-BXGzkH4k.js";import{D as I,S as R,a as z,W,H as N,b as A,c as K,P as Y,d as S,e as H,f as B,E as s,C as o,h as $}from"../../tutorial.template-CqcBS6fj.js";import{i as j,a as U}from"../../tutorial_nav-CNdwgRV1.js";import"../../tutorial_index_meta-CaOd1-g9.js";const F=`
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

<p>If face tracking is unavailable, move the mouse over the preview to look around and scroll to change depth. The keyboard works too, with or without a camera: the arrow keys turn the view and W / S zoom in and out.</p>

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
`;async function X(d,c=I,h){const p=c.clock??new R({...z,startPaused:c.paused,debug:!1,playback:{...z.playback,duration:1e4,isLoop:!0}}),L=h?.faceConfig;let m=h?.webCamProvider;m=m??new W(d,640,480);let v=h?.faceDataProvider;v=v??new N(d,{...L,baselineHeadPixels:120,baselineHeadSceneUnits:180,baseline:{x:0,y:0,z:0},cameraPosition:{x:0,y:0,z:300}});const k=new Y(d),O={webCam:m,headTracker:v},n=new A(K.fromLibs({clock:p,loader:k,dataProviderLib:O}));n.startLoading(),n.enableDefaultPerspective(c.width,c.height,Math.PI/4,!0),c.paused&&n.pause(),n.loadPreset({...S,projectors:S.projectors.map(e=>e.id==="head"?{id:e.id,type:e.type,position:e.position,direction:e.direction,lookMode:H.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}:e)});const g={x:0,y:0,z:0};let f,x=!1,T="";const C=e=>{e!==T&&(T=e,f?.dispatchEvent(new CustomEvent("observerstatus",{bubbles:!0,detail:e})))},b=new B({disableRotation:!1,damping:.1}),l={},r={yaw:0,pitch:0,zoom:0},D=()=>{const e=(a,y)=>Math.max(-.1,Math.min(.1,a+y));l.ArrowLeft&&(r.yaw=e(r.yaw,-.005)),l.ArrowRight&&(r.yaw=e(r.yaw,.005)),l.ArrowUp&&(r.pitch=e(r.pitch,-.005)),l.ArrowDown&&(r.pitch=e(r.pitch,.005)),l.KeyW&&(r.zoom=Math.max(-300,r.zoom-8)),l.KeyS&&(r.zoom=Math.min(150,r.zoom+8))},P=(e,a)=>({position:{...e,z:e.z+r.zoom},rotation:{yaw:(a?.yaw??0)+r.yaw,pitch:(a?.pitch??0)+r.pitch,roll:a?.roll??0}}),M={name:"Head tracking with pointer fallback",active:!0,priority:10,requiredDataProviders:[],tick:e=>b.tick(e),getCarPosition:(e,a)=>{if(D(),a.dataProviders.headTracker){C("Head tracking active.");const u=b.getCarPosition(e,a);return u.success?{success:!0,value:{...u.value,...P(u.value.position,u.value.rotation)}}:u}const y=m?.getStatus?.()==="READY";return C(y?"No face detected. Move the mouse to look around and scroll to change depth, or use the arrow keys and W / S.":x?"Camera unavailable. Move the mouse to look around and scroll to change depth, or use the arrow keys and W / S.":"Starting camera. Mouse, scroll, arrow keys and W / S are active."),{success:!0,value:{name:"Pointer fallback",...P(g)}}}};n.addModifierToProjection("head",M,"car");const w=200;for(let e=0;e<25;e++)n.addBox({id:`tunnel-${e}`,type:s.BOX,width:c.width,height:c.height,depth:10,strokeWidth:4,strokeColor:{red:255-e*10,green:255-e*10,blue:255-e*10},position:{x:0,y:50,z:-60*e}});var i=0;function t(e){i++,n.addBox({id:`target-${i}`,type:s.BOX,position:e,width:100}),n.addCylinder({id:`target-circle-${i}`,parentId:`target-${i}`,type:s.CYLINDER,radius:10/10,height:1,position:{x:0,y:50,z:-50},fillColor:o.red,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),n.addCylinder({id:`target-circle-1-${i}`,parentId:`target-${i}`,type:s.CYLINDER,radius:80/10,height:1,position:{x:0,y:50,z:-49.9},fillColor:o.white,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),n.addCylinder({id:`target-circle-2-${i}`,parentId:`target-${i}`,type:s.CYLINDER,radius:60/10,height:1,position:{x:0,y:50,z:-49.8},fillColor:o.red,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),n.addCylinder({id:`target-circle-3-${i}`,parentId:`target-${i}`,type:s.CYLINDER,radius:40/10,height:1,position:{x:0,y:50,z:-49.7},fillColor:o.white,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),n.addCylinder({id:`target-circle-4-${i}`,parentId:`target-${i}`,type:s.CYLINDER,radius:20/10,height:1,position:{x:0,y:50,z:-49.6},fillColor:o.red,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),n.addCylinder({id:`target-stick-${i}`,parentId:`target-${i}`,type:s.CYLINDER,height:100,radius:20/10,position:{x:0,y:50,z:-100.1},fillColor:{red:100,green:0,blue:0},rotate:{pitch:Math.PI/2,yaw:0,roll:0}})}t({x:0,y:0,z:0}),t({x:-70,y:-10,z:50}),t({x:50,y:10,z:80}),t({x:10,y:-80,z:30}),t({x:10,y:-200,z:10}),t({x:-30,y:30,z:90}),t({x:50,y:-50,z:70}),t({x:-30,y:-20,z:20}),t({x:-130,y:-120,z:200}),t({x:130,y:120,z:250}),t({x:200,y:200,z:400}),t({x:-200,y:-200,z:500}),t({x:-150,y:0,z:100}),t({x:150,y:0,z:120}),t({x:0,y:150,z:150}),t({x:0,y:-150,z:180}),t({x:-100,y:100,z:200}),t({x:100,y:-100,z:220}),t({x:-180,y:-50,z:300}),t({x:180,y:50,z:320}),t({x:50,y:180,z:350}),t({x:-50,y:-180,z:380}),t({x:-220,y:100,z:450}),t({x:220,y:-100,z:480}),t({x:100,y:200,z:520}),t({x:-100,y:-200,z:550}),t({x:60,y:0,z:-50}),t({x:-80,y:50,z:-30}),t({x:80,y:-50,z:-40}),t({x:0,y:-100,z:-20}),t({x:0,y:100,z:-10}),n.addBox({id:"center-cube",type:s.BOX,width:50,strokeWidth:1,strokeColor:o.white,position:{x:0,y:w,z:0},fillColor:o.red}),n.addBox({id:"left-cube",type:s.BOX,width:40,strokeWidth:1,strokeColor:o.white,position:{x:-150,y:w,z:-100},fillColor:o.blue}),n.addBox({id:"right-cube",type:s.BOX,width:40,strokeWidth:.1,strokeColor:o.white,position:{x:150,y:w,z:-100},fillColor:o.orange}),n.addBox({id:"far-cube",type:s.BOX,width:30,strokeWidth:1,strokeColor:o.white,position:{x:0,y:w,z:-300},fillColor:o.cyan}),n.addBox({id:"front-cube",type:s.BOX,width:30,strokeWidth:1,strokeColor:o.white,position:{x:0,y:w,z:-30},fillColor:o.purple});let E;d.setup=()=>{f=d.createCanvas(c.width,c.height,d.WEBGL)?.elt,f?.addEventListener("pointermove",a=>{const y=f.getBoundingClientRect(),u=a;g.x=Math.max(-150,Math.min(150,((u.clientX-y.left)/y.width-.5)*300)),g.y=Math.max(-100,Math.min(100,((u.clientY-y.top)/y.height-.5)*200))}),f?.addEventListener("wheel",a=>{a.preventDefault(),g.z=Math.max(-50,Math.min(100,g.z+a.deltaY*.25))},{passive:!1})},n.complete();const _=e=>{const a=e.target;return!!a&&(a.isContentEditable||["INPUT","TEXTAREA","SELECT"].includes(a.tagName))};window.addEventListener("keydown",e=>{_(e)||(e.key.startsWith("Arrow")&&e.preventDefault(),l[e.key]=!0,l[e.code]=!0)}),window.addEventListener("keyup",e=>{l[e.key]=!1,l[e.code]=!1}),d.draw=async()=>{c.paused&&!n.isPaused()?n.pause():!c.paused&&n.isPaused()&&n.resume(),d.background(20),E&&(await n.step(E)).running};try{await v.init()}catch(e){console.warn("Camera unavailable; pointer controls remain active.",e)}return x=!0,E=h?.graphicProcessor??new $(d,k),n}const G=`import p5 from 'p5';
import { World } from "../../../scene/world.ts";
import { P5GraphicProcessor } from "../../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../../scene/providers/web_cam_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, LOOK_MODES, type CarModifier, type Vector3, type DampingValue, type SceneUnits, type VideoPixels} from "../../../scene/types.ts";
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

<p>If face tracking is unavailable, move the mouse over the preview to look around and scroll to change depth. The keyboard works too, with or without a camera: the arrow keys turn the view and W / S zoom in and out.</p>

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

    // The head-tracked camera rig, with 'head' in ROTATION mode (instead of the preset's
    // LOOK_AT) so turning - head rotation and the arrow keys - pivots the view.
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

    // Keyboard alternative: arrow keys turn the view, W / S zoom. It adds on top of head
    // tracking or the mouse. Keys held right now (see the listeners below) are read once per
    // frame. The turn is limited to 0.1 rad - about what head tracking reaches (face angle x
    // damping 0.1). W flies into the tunnel at the hero's speed, down to -300: the rings are as
    // wide as the screen and fade with depth, so any further in, the near rings fall outside
    // the view and the far ones are too dark to see. S backs out to +150.
    const pressedKeys: Record<string, boolean> = {};
    const keys = { yaw: 0, pitch: 0, zoom: 0 };
    const updateKeys = () => {
        const turn = (value: number, delta: number) => Math.max(-0.1, Math.min(0.1, value + delta));
        if (pressedKeys.ArrowLeft) keys.yaw = turn(keys.yaw, -0.005);
        if (pressedKeys.ArrowRight) keys.yaw = turn(keys.yaw, 0.005);
        if (pressedKeys.ArrowUp) keys.pitch = turn(keys.pitch, -0.005);
        if (pressedKeys.ArrowDown) keys.pitch = turn(keys.pitch, 0.005);
        if (pressedKeys.KeyW) keys.zoom = Math.max(-300, keys.zoom - 8);
        if (pressedKeys.KeyS) keys.zoom = Math.min(150, keys.zoom + 8);
    };
    const withKeys = (position: Vector3, rotation?: { yaw: number; pitch: number; roll: number }) => ({
        position: { ...position, z: position.z + keys.zoom },
        rotation: {
            yaw: (rotation?.yaw ?? 0) + keys.yaw,
            pitch: (rotation?.pitch ?? 0) + keys.pitch,
            roll: rotation?.roll ?? 0,
        },
    });

    const observerModifier: CarModifier<typeof dataProviderLib> = {
        name: 'Head tracking with pointer fallback',
        active: true,
        priority: 10,
        requiredDataProviders: [],
        tick: sceneId => headModifier.tick(sceneId),
        getCarPosition: (position, context) => {
            updateKeys();
            if (context.dataProviders.headTracker) {
                announceStatus('Head tracking active.');
                const result = headModifier.getCarPosition(position, context);
                if (!result.success) return result;
                return { success: true, value: { ...result.value, ...withKeys(result.value.position, result.value.rotation) } };
            }
            const cameraReady = webCamProvider?.getStatus?.() === 'READY';
            announceStatus(cameraReady
                ? 'No face detected. Move the mouse to look around and scroll to change depth, or use the arrow keys and W / S.'
                : initialized
                    ? 'Camera unavailable. Move the mouse to look around and scroll to change depth, or use the arrow keys and W / S.'
                    : 'Starting camera. Mouse, scroll, arrow keys and W / S are active.');
            return { success: true, value: { name: 'Pointer fallback', ...withKeys(pointer) } };
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

    // Keyboard: record which keys are held. Keys typed into text fields (like the Code tab
    // editor) are ignored; physical codes (KeyW / KeyS) ignore Shift and keyboard layout, so a
    // key can't stay stuck when its key-up arrives as a different event.key.
    const isTyping = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        return !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    };
    window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (isTyping(event)) return;
        if (event.key.startsWith('Arrow')) event.preventDefault();
        pressedKeys[event.key] = true;
        pressedKeys[event.code] = true;
    });
    window.addEventListener('keyup', (event: KeyboardEvent) => {
        pressedKeys[event.key] = false;
        pressedKeys[event.code] = false;
    });

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
`,V=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0,q=V?void 0:{throttleThreshold:0,videoWidth:640,videoHeight:480};document.addEventListener("observerstatus",d=>{const h=d.target.closest(".canvas-side");if(!h)return;let p=h.querySelector(".observer-status");p||(p=document.createElement("p"),p.className="observer-status",p.setAttribute("role","status"),p.style.cssText="margin:8px 0;color:var(--text-secondary);font-size:13px",h.querySelector(".controls")?.before(p)),p.textContent=d.detail});j("tutorial-9","9. 3D Parallax Depth",X,G,F,{},q);U();
//# sourceMappingURL=tutorial-9-B8gnH9bB.js.map
