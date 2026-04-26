import{g as d,O as p,D as m,S as h,a as u,c,P as f,W as g,b as P,C as w,E as C}from"../../tutorial.template-BDmswzOV.js";/* empty css                     */import{i as b,a as y}from"../../tutorial_shared-DEZC48XV.js";b();Object.assign(window,{OrbitModifier:p,CenterFocusModifier:d});const E=`
<div class="concept">
<p><strong>Modifiers</strong> are components that alter how the camera or projection behaves. They can orbit the camera around a point, focus on specific objects, or respond to head tracking data. Modifiers chain together to create complex camera behaviors.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Presets</strong> - The engine includes camera presets like <code>CenterOrbit</code> that set up common camera movements with sensible defaults.</li>
<li><strong>Load Preset</strong> - Call <code>world.loadPreset(CenterOrbit(p, {...}))</code> to apply a preset modifier to the camera.</li>
<li><strong>Modifier Chain</strong> - Presets typically compose multiple modifiers: orbit the camera position, focus on center, apply perspective projection.</li>
<li><strong>Parameters</strong> - Configure presets with parameters like <code>radius</code> (orbit distance) and <code>verticalBaseline</code> (camera height).</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Modifier</span>
<span class="key-term">Preset</span>
<span class="key-term">Camera</span>
<span class="key-term">Orbit</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1"> Adding Elements</a>
<a href="#tutorial-9">Real-Time Camera Control</a>
</div>
`;async function T(r,o=m,i){let s;const l=o.clock??new h({...u,startPaused:o.paused}),a=new f(r);s=i?.graphicProcessor??new c(r,a);const e=new g(P.fromLibs({clock:l,loader:a}));return e.startLoading(),e.loadPreset(w(r,{radius:500})),e.enableDefaultPerspective(o.width,o.height),o.paused&&e.pause(),r.setup=()=>{r.createCanvas(o.width,o.height,r.WEBGL),i?.graphicProcessor||(s=new c(r,a));for(let n=0;n<5;n++)for(let t=0;t<5;t++)e.addBox({type:C.BOX,id:`box-${n}-${t}`,width:40,position:{x:(n-2)*100,y:0,z:200-t*100},fillColor:{red:n*50,green:255-n*50,blue:200}})},e.complete(),r.draw=async()=>{o.paused&&!e.isPaused()?e.pause():!o.paused&&e.isPaused()&&e.resume(),r.background(20),(await e.step(s)).running},e}const k=`import p5 from 'p5';
import {World} from "../../../scene/world.ts";
import {P5GraphicProcessor} from "../../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {OrbitModifier} from "../../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../../scene/modifiers/center_focus_modifier.ts";
import {P5AssetLoader, type P5Bundler} from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES} from "../../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig, type P5SketchExtraArgs} from "../sketch_engine.types.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";
import {CenterOrbit} from "../../../scene/presets.ts";

Object.assign(window, {
    OrbitModifier,
    CenterFocusModifier,
});

/**
 * TUTORIAL: Camera Control
 * 
 * Use modifiers to control camera movement and focus.
 */
export const camera_control_explanation = \`
<div class="concept">
<p><strong>Modifiers</strong> are components that alter how the camera or projection behaves. They can orbit the camera around a point, focus on specific objects, or respond to head tracking data. Modifiers chain together to create complex camera behaviors.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Presets</strong> - The engine includes camera presets like <code>CenterOrbit</code> that set up common camera movements with sensible defaults.</li>
<li><strong>Load Preset</strong> - Call <code>world.loadPreset(CenterOrbit(p, {...}))</code> to apply a preset modifier to the camera.</li>
<li><strong>Modifier Chain</strong> - Presets typically compose multiple modifiers: orbit the camera position, focus on center, apply perspective projection.</li>
<li><strong>Parameters</strong> - Configure presets with parameters like <code>radius</code> (orbit distance) and <code>verticalBaseline</code> (camera height).</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Modifier</span>
<span class="key-term">Preset</span>
<span class="key-term">Camera</span>
<span class="key-term">Orbit</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1"> Adding Elements</a>
<a href="#tutorial-9">Real-Time Camera Control</a>
</div>
\`;

export async function tutorial_camera_control(
    p: p5, 
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: P5SketchExtraArgs
): Promise<World<P5Bundler, any, any>> {
    let graphicProcessor: P5GraphicProcessor;

    const clock = config.clock ?? new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            startPaused: config.paused
        });

    const loader = new P5AssetLoader(p);
    graphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);
    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );
    
    world.startLoading();
    world.loadPreset(CenterOrbit(p,{radius: 500}))
    world.enableDefaultPerspective(config.width, config.height);

    if (config.paused) {
        world.pause();
    }

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        if (!extraArgs?.graphicProcessor) {
            graphicProcessor = new P5GraphicProcessor(p, loader);
        }

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                world.addBox({
                    type: ELEMENT_TYPES.BOX,
                    id: \`box-\${i}-\${j}\`,
                    width: 40,
                    position: {x: (i - 2) * 100, y: 0, z: 200 - j * 100},
                    fillColor: {
                        red: i * 50,
                        green: 255 - (i * 50),
                        blue: 200
                    }
                });
            }
        }
    };

    world.complete();
    
    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }
        
        p.background(20);
        const result = await world.step(graphicProcessor);
        if (!result.running) return;
    };

    return world;
}
`;y("tutorial-4","4. Camera Control",T,k,E);
//# sourceMappingURL=tutorial-4-T2mESEI0.js.map
