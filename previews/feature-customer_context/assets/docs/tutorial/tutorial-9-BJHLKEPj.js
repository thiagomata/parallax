import{D as w,S as C,a as y,H as T,W as P,b as E,P as m,h as z,E as n,f as r,c as b}from"../../colors-D2Px9Duz.js";import{H as k}from"../../tutorial.template-C5cztY7z.js";import{W as S}from"../../web_cam_data_provider-C5UDx82S.js";import{i as v,a as D}from"../../tutorial_nav-DvoFyc47.js";const L=`
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
`;async function O(s,o=w,l){const f=o.clock??new C({...y,startPaused:o.paused,debug:!1,playback:{...y.playback,duration:1e4,isLoop:!0}}),u=l?.faceConfig;let p=l?.webCamProvider;p=p??new S(s,640,480);let c=l?.faceDataProvider;c=c??new T(s,{...u,baselineHeadPixels:120,baselineHeadSceneUnits:180,baseline:{x:0,y:0,z:0},cameraPosition:{x:0,y:0,z:300}});const g=new m(s),x={webCam:p,headTracker:c},t=new P(E.fromLibs({clock:f,loader:g,dataProviderLib:x}));t.startLoading(),t.enableDefaultPerspective(o.width,o.height,Math.PI/4,!0),o.paused&&t.pause(),t.loadPreset(z),t.addModifierToProjection("head",new k({disableRotation:!1,damping:.1}),"car");const d=200;for(let i=0;i<25;i++)t.addBox({id:`tunnel-${i}`,type:n.BOX,width:o.width,height:o.height,depth:10,strokeWidth:4,strokeColor:{red:255-i*10,green:255-i*10,blue:255-i*10},position:{x:0,y:50,z:-60*i}});var a=0;function e(i){a++,t.addBox({id:`target-${a}`,type:n.BOX,position:i,width:100}),t.addCylinder({id:`target-circle-${a}`,parentId:`target-${a}`,type:n.CYLINDER,radius:10/10,height:1,position:{x:0,y:50,z:-50},fillColor:r.red,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-circle-1-${a}`,parentId:`target-${a}`,type:n.CYLINDER,radius:80/10,height:1,position:{x:0,y:50,z:-49.9},fillColor:r.white,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-circle-2-${a}`,parentId:`target-${a}`,type:n.CYLINDER,radius:60/10,height:1,position:{x:0,y:50,z:-49.8},fillColor:r.red,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-circle-3-${a}`,parentId:`target-${a}`,type:n.CYLINDER,radius:40/10,height:1,position:{x:0,y:50,z:-49.7},fillColor:r.white,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-circle-4-${a}`,parentId:`target-${a}`,type:n.CYLINDER,radius:20/10,height:1,position:{x:0,y:50,z:-49.6},fillColor:r.red,rotate:{pitch:Math.PI/2,yaw:0,roll:0}}),t.addCylinder({id:`target-stick-${a}`,parentId:`target-${a}`,type:n.CYLINDER,height:100,radius:20/10,position:{x:0,y:50,z:-100.1},fillColor:{red:100,green:0,blue:0},rotate:{pitch:Math.PI/2,yaw:0,roll:0}})}e({x:0,y:0,z:0}),e({x:-70,y:-10,z:50}),e({x:50,y:10,z:80}),e({x:10,y:-80,z:30}),e({x:10,y:-200,z:10}),e({x:-30,y:30,z:90}),e({x:50,y:-50,z:70}),e({x:-30,y:-20,z:20}),e({x:-130,y:-120,z:200}),e({x:130,y:120,z:250}),e({x:200,y:200,z:400}),e({x:-200,y:-200,z:500}),e({x:-150,y:0,z:100}),e({x:150,y:0,z:120}),e({x:0,y:150,z:150}),e({x:0,y:-150,z:180}),e({x:-100,y:100,z:200}),e({x:100,y:-100,z:220}),e({x:-180,y:-50,z:300}),e({x:180,y:50,z:320}),e({x:50,y:180,z:350}),e({x:-50,y:-180,z:380}),e({x:-220,y:100,z:450}),e({x:220,y:-100,z:480}),e({x:100,y:200,z:520}),e({x:-100,y:-200,z:550}),e({x:60,y:0,z:-50}),e({x:-80,y:50,z:-30}),e({x:80,y:-50,z:-40}),e({x:0,y:-100,z:-20}),e({x:0,y:100,z:-10}),t.addBox({id:"center-cube",type:n.BOX,width:50,strokeWidth:1,strokeColor:r.white,position:{x:0,y:d,z:0},fillColor:r.red}),t.addBox({id:"left-cube",type:n.BOX,width:40,strokeWidth:1,strokeColor:r.white,position:{x:-150,y:d,z:-100},fillColor:r.blue}),t.addBox({id:"right-cube",type:n.BOX,width:40,strokeWidth:.1,strokeColor:r.white,position:{x:150,y:d,z:-100},fillColor:r.orange}),t.addBox({id:"far-cube",type:n.BOX,width:30,strokeWidth:1,strokeColor:r.white,position:{x:0,y:d,z:-300},fillColor:r.cyan}),t.addBox({id:"front-cube",type:n.BOX,width:30,strokeWidth:1,strokeColor:r.white,position:{x:0,y:d,z:-30},fillColor:r.purple});let h;return s.setup=()=>{s.createCanvas(o.width,o.height,s.WEBGL)},t.complete(),s.draw=async()=>{o.paused&&!t.isPaused()?t.pause():!o.paused&&t.isPaused()&&t.resume(),s.background(20),h&&(await t.step(h)).running},await c.init(),h=l?.graphicProcessor??new b(s,g),t}const _=`import p5 from 'p5';
import { World } from "../../../scene/world.ts";
import { P5GraphicProcessor } from "../../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../../scene/providers/web_cam_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type Vector3, type DampingValue, type SceneUnits, type VideoPixels} from "../../../scene/types.ts";
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

    world.addModifierToProjection('head', new HeadTrackingModifier({
        disableRotation: false,
        damping: 0.1 as DampingValue,
    }), 'car');

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
        p.createCanvas(config.width, config.height, p.WEBGL);
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

    await faceDataProvider.init();
    gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    return world;
}
`,I=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0,R=I?void 0:{throttleThreshold:0,videoWidth:640,videoHeight:480};v("tutorial-9","9. 3D Parallax Depth",O,_,L,{},R);D();
//# sourceMappingURL=tutorial-9-BJHLKEPj.js.map
