import{f as c,O as l,D as d,S as p,a as m,W as h,b as u,P as f,C as g,E as w,c as C}from"../../tutorial.template-BtbKL_rn.js";/* empty css                     */import{i as P,a as b}from"../../tutorial_shared-oNg0pm32.js";P();Object.assign(window,{OrbitModifier:l,CenterFocusModifier:c});const y=`
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
`;async function E(o,r=d){let s;const i=r.clock??new p({...m,startPaused:r.paused}),a=new f(o),e=new h(u.fromLibs({clock:i,loader:a}));return e.startLoading(),e.loadPreset(g(o,{radius:500})),e.enableDefaultPerspective(r.width,r.height),r.paused&&e.pause(),o.setup=()=>{o.createCanvas(r.width,r.height,o.WEBGL),s=new C(o,a);for(let n=0;n<5;n++)for(let t=0;t<5;t++)e.addBox({type:w.BOX,id:`box-${n}-${t}`,width:40,position:{x:(n-2)*100,y:0,z:200-t*100},fillColor:{red:n*50,green:255-n*50,blue:200}})},e.complete(),o.draw=async()=>{r.paused&&!e.isPaused()?e.pause():!r.paused&&e.isPaused()&&e.resume(),o.background(20),(await e.step(s)).running},e}const T=`import p5 from 'p5';
import {World} from "../../../scene/world.ts";
import {P5GraphicProcessor} from "../../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {OrbitModifier} from "../../../scene/modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../../../scene/modifiers/center_focus_modifier.ts";
import {P5AssetLoader, type P5Bundler} from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES} from "../../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "../sketch_config.ts";
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

export async function tutorial_camera_control(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): Promise<World<P5Bundler, any, any>> {
    let graphicProcessor: P5GraphicProcessor;

    const clock = config.clock ?? new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            startPaused: config.paused
        });

    const loader = new P5AssetLoader(p);
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
        graphicProcessor = new P5GraphicProcessor(p, loader);

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
`;b("tutorial-4","4. Camera Control",E,T,y);
//# sourceMappingURL=tutorial-4-CzUU8wBA.js.map
