import{D as d,S as p,a as l,W as f,b as h,L as u,P as m,C as g,E as a,g as i,c as E}from"../../tutorial.template-PYpWsMkT.js";/* empty css                     */import{i as y,a as k}from"../../tutorial_shared-CSHlWac9.js";y();const w=`
<div class="concept">
<p><strong>Billboarding</strong> is a technique where an element always faces the camera, regardless of camera movement. This is commonly used for sprites, particle effects, and UI elements that need to stay readable. In parallax, we use LookAtEffect with a special camera target.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Effect Setup</strong> - Apply <code>LookAtEffect</code> without specifying a <code>lookAt</code> target. The effect will automatically target the camera.</li>
<li><strong>Automatic Rotation</strong> - Each frame, the element calculates the direction to the camera and rotates to face it.</li>
<li><strong>Preserve Initial Rotation</strong> - Set an initial <code>rotate</code> value. The LookAtEffect computes the final orientation, which may override your initial rotation.</li>
<li><strong>Use Cases</strong> - Billboards are ideal for flat panels (PANEL elements), sprites, and any element that should always face the viewer.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Billboard</span>
<span class="key-term">LookAtEffect</span>
<span class="key-term">Camera Target</span>
<span class="key-term">Sprite</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-7">Objects Looking at Each Other</a>
</div>
`;async function b(o,t=d){let r;const n=t.clock??new p({...l,startPaused:t.paused,playback:{...l.playback,duration:1e4,isLoop:!0}}),s=new m(o),c={look_at:u},e=new f(h.fromLibs({clock:n,loader:s,elementEffectLib:c}));return e.startLoading(),e.enableDefaultPerspective(t.width,t.height),e.loadPreset(g(o,{radius:300,verticalBaseline:100})),t.paused&&e.pause(),o.setup=()=>{o.createCanvas(t.width,t.height,o.WEBGL),r=new E(o,s),e.addBox({id:"reference-cube",type:a.BOX,width:50,position:{x:150,y:0,z:0},fillColor:{red:100,green:100,blue:255},strokeColor:{red:255,green:255,blue:255},strokeWidth:3}),e.addPanel({id:"ref-panel",type:a.PANEL,position:{x:50,y:0,z:0},fillColor:{red:100,green:100,blue:255},strokeColor:{red:255,green:255,blue:255},width:50,height:50,strokeWidth:3}),e.addBox({id:"billboard-cube",type:a.BOX,width:50,position:{x:-150,y:0,z:0},fillColor:i.orange,strokeColor:{red:255,green:255,blue:255},effects:[{type:"look_at"}],rotate:{pitch:Math.PI/4,roll:Math.PI/4},strokeWidth:3}),e.addPanel({id:"billboard-panel",type:a.PANEL,width:50,height:50,position:{x:-50,y:0,z:0},fillColor:i.orange,strokeColor:{red:255,green:255,blue:255},effects:[{type:"look_at"}],strokeWidth:3})},e.complete(),o.draw=async()=>{t.paused&&!e.isPaused()?e.pause():!t.paused&&e.isPaused()&&e.resume(),o.background(20),(await e.step(r)).running},e}const P=`import p5 from 'p5';
import { World } from "../../../scene/world.ts";
import { P5GraphicProcessor } from "../../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../../scene/scene_clock.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES,
} from "../../../scene/types.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SKETCH_CONFIG,
    type SketchConfig
} from "../sketch_config.ts";
import { WorldSettings } from "../../../scene/world_settings.ts";
import { LookAtEffect } from "../../../scene/effects/look_at_effect.ts";
import {COLORS} from "../../../scene/colors.ts";
import {CenterOrbit} from "../../../scene/presets.ts";

/**
 * TUTORIAL: Always Face Camera
 * 
 * Elements that always rotate to face the camera.
 */
export const billboard_explanation = \`
<div class="concept">
<p><strong>Billboarding</strong> is a technique where an element always faces the camera, regardless of camera movement. This is commonly used for sprites, particle effects, and UI elements that need to stay readable. In parallax, we use LookAtEffect with a special camera target.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Effect Setup</strong> - Apply <code>LookAtEffect</code> without specifying a <code>lookAt</code> target. The effect will automatically target the camera.</li>
<li><strong>Automatic Rotation</strong> - Each frame, the element calculates the direction to the camera and rotates to face it.</li>
<li><strong>Preserve Initial Rotation</strong> - Set an initial <code>rotate</code> value. The LookAtEffect computes the final orientation, which may override your initial rotation.</li>
<li><strong>Use Cases</strong> - Billboards are ideal for flat panels (PANEL elements), sprites, and any element that should always face the viewer.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Billboard</span>
<span class="key-term">LookAtEffect</span>
<span class="key-term">Camera Target</span>
<span class="key-term">Sprite</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-7">Objects Looking at Each Other</a>
</div>
\`;

export async function tutorial_billboard(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): Promise<World<P5Bundler, any, any>> {
    let graphicProcessor: P5GraphicProcessor;

    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: { ...DEFAULT_SCENE_SETTINGS.playback, duration: 10000, isLoop: true }
    });

    const loader = new P5AssetLoader(p);
    
    const effects = {
        'look_at': LookAtEffect,
    };

    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({
            clock,
            loader,
            elementEffectLib: effects
        })
    );
    
    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height);
    world.loadPreset(CenterOrbit(p, {radius: 300, verticalBaseline: 100}));

    if (config.paused) {
        world.pause();
    }

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        world.addBox({
            id: 'reference-cube',
            type: ELEMENT_TYPES.BOX,
            width: 50,
            position: { x: 150, y: 0, z: 0 },
            fillColor: { red: 100, green: 100, blue: 255 },
            strokeColor: { red: 255, green: 255, blue: 255 },
            strokeWidth: 3,
        });

        world.addPanel({
            id: 'ref-panel',
            type: ELEMENT_TYPES.PANEL,
            position: { x: 50, y: 0, z: 0 },
            fillColor: { red: 100, green: 100, blue: 255 },
            strokeColor: { red: 255, green: 255, blue: 255 },
            width: 50,
            height: 50,
            strokeWidth: 3,
        });

        world.addBox({
            id: 'billboard-cube',
            type: ELEMENT_TYPES.BOX,
            width: 50,
            position: { x: -150, y: 0, z: 0 },
            fillColor: COLORS.orange,
            strokeColor: { red: 255, green: 255, blue: 255 },
            effects: [
                { type: 'look_at' }
            ],
            rotate: {
                pitch: Math.PI / 4,
                roll: Math.PI / 4,
            },
            strokeWidth: 3,
        });

        world.addPanel({
            id: 'billboard-panel',
            type: ELEMENT_TYPES.PANEL,
            width: 50,
            height: 50,
            position: { x: -50, y: 0, z: 0 },
            fillColor: COLORS.orange,
            strokeColor: { red: 255, green: 255, blue: 255 },
            effects: [
                { type: 'look_at' }
            ],
            strokeWidth: 3,
        });
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
`;k("tutorial-7","7. Always Face Camera",b,P,w);
//# sourceMappingURL=tutorial-7-B_elp62_.js.map
