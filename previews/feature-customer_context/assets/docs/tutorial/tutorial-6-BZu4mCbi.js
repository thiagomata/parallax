import{D as E,S as y,a as l,c as d,P as w,W as P,b as C,C as L,f as p,E as f}from"../../colors-DVKk-YNe.js";import{L as S}from"../../tutorial.template-CuDnZY33.js";import{i as T}from"../../tutorial_shared-C01X7iNz.js";const _=`
<div class="concept">
<p><strong>LookAtEffect</strong> is an effect that rotates an element to face another element in the scene. This creates "eyes following" behaviors where one object always points toward another, even as both move independently.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Register the Effect</strong> - Add <code>LookAtEffect</code> to the world's <code>elementEffectLib</code> so elements can use it.</li>
<li><strong>Apply to Element</strong> - Add the effect to an element's <code>effects</code> array with <code>type: 'look_at'</code>.</li>
<li><strong>Configure Target</strong> - Set <code>settings.lookAt</code> to the ID of the element to face. The element will rotate to point at its target.</li>
<li><strong>Axis Control</strong> - The <code>axis</code> setting lets you control which axes can rotate. Set unused axes to <code>false</code> for constrained rotation.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">LookAtEffect</span>
<span class="key-term">Effect</span>
<span class="key-term">Target</span>
<span class="key-term">Axis Control</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-8">Always Face Camera</a>
</div>
`;async function A(t,o=E,n){let s;const h=o.clock??new y({...l,startPaused:o.paused,playback:{...l.playback,duration:1e4,isLoop:!0}}),r=new w(t);s=n?.graphicProcessor??new d(t,r);const u={look_at:S},e=new P(C.fromLibs({clock:h,loader:r,elementEffectLib:u}));return e.startLoading(),e.enableDefaultPerspective(o.width,o.height),e.loadPreset(L(t,{radius:300,verticalBaseline:100})),o.paused&&e.pause(),t.setup=()=>{t.createCanvas(o.width,o.height,t.WEBGL),n?.graphicProcessor||(s=new d(t,r)),e.addSphere({type:f.SPHERE,id:"obj",radius:20,position:c=>{const a=c.playback.progress*4*Math.PI,i=200,g=Math.sin(a)*i,k=Math.cos(a)*i,m=100+Math.sin(a*.5)*100;return{x:g,y:m,z:k}},rotate:{pitch:0,roll:0,yaw:0},fillColor:p.green,strokeColor:p.white,strokeWidth:1}),e.addCylinder({type:f.CYLINDER,id:"look-to-obj",radius:20,height:50,rotate:{yaw:0,roll:0,pitch:Math.PI/2},strokeWidth:2,position:{x:0,y:0,z:100},fillColor:{red:0,green:255,blue:0},strokeColor:{red:0,green:0,blue:255},effects:[{type:"look_at",settings:{lookAt:"obj",axis:{x:!0,y:!0,z:!0}}}]})},e.complete(),t.draw=async()=>{o.paused&&!e.isPaused()?e.pause():!o.paused&&e.isPaused()&&e.resume(),t.background(20),(await e.step(s)).running},e}const b=`import p5 from 'p5';
import { World } from "../../../scene/world.ts";
import { P5GraphicProcessor } from "../../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../../scene/scene_clock.ts";
import { P5AssetLoader, type P5Bundler } from "../../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES,
} from "../../../scene/types.ts";
import { DEFAULT_SKETCH_CONFIG, type SketchConfig, type P5SketchExtraArgs } from "../sketch_engine.types.ts";
import { WorldSettings } from "../../../scene/world_settings.ts";
import { LookAtEffect } from "../../../scene/effects/look_at_effect.ts";
import {COLORS} from "../../../scene/colors.ts";
import {CenterOrbit} from "../../../scene/presets.ts";

/**
 * TUTORIAL: Objects Looking at Each Other
 * 
 * Make elements that always face another element.
 */
export const look_at_explanation = \`
<div class="concept">
<p><strong>LookAtEffect</strong> is an effect that rotates an element to face another element in the scene. This creates "eyes following" behaviors where one object always points toward another, even as both move independently.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Register the Effect</strong> - Add <code>LookAtEffect</code> to the world's <code>elementEffectLib</code> so elements can use it.</li>
<li><strong>Apply to Element</strong> - Add the effect to an element's <code>effects</code> array with <code>type: 'look_at'</code>.</li>
<li><strong>Configure Target</strong> - Set <code>settings.lookAt</code> to the ID of the element to face. The element will rotate to point at its target.</li>
<li><strong>Axis Control</strong> - The <code>axis</code> setting lets you control which axes can rotate. Set unused axes to <code>false</code> for constrained rotation.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">LookAtEffect</span>
<span class="key-term">Effect</span>
<span class="key-term">Target</span>
<span class="key-term">Axis Control</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-8">Always Face Camera</a>
</div>
\`;

export async function tutorial_look_at(
    p: p5, 
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: P5SketchExtraArgs
): Promise<World<P5Bundler, any, any>> {
    let graphicProcessor: P5GraphicProcessor;

    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: { ...DEFAULT_SCENE_SETTINGS.playback, duration: 10000, isLoop: true }
    });

    const loader = new P5AssetLoader(p);
    graphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);
    
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
        if (!extraArgs?.graphicProcessor) {
            graphicProcessor = new P5GraphicProcessor(p, loader);
        }

        world.addSphere({
            type: ELEMENT_TYPES.SPHERE,
            id: 'obj',
            radius: 20,
            position: (currentState) => {
                const circularProgress = currentState.playback.progress * 4 * Math.PI;
                const radius = 200;
                const x = Math.sin(circularProgress) * radius;
                const z = Math.cos(circularProgress) * radius;
                const y = 100 + Math.sin(circularProgress * 0.5) * 100;
                return { x, y, z };
            },
            rotate: { pitch: 0, roll: 0, yaw: 0 },
            fillColor: COLORS.green,
            strokeColor: COLORS.white,
            strokeWidth: 1,
        });

        world.addCylinder({
            type: ELEMENT_TYPES.CYLINDER,
            id: 'look-to-obj',
            radius: 20,
            height: 50,
            rotate: { yaw: 0, roll: 0, pitch: Math.PI / 2 },
            strokeWidth: 2,
            position: {x: 0, y: 0, z: 100},
            fillColor: {red: 0, green: 255, blue: 0},
            strokeColor: {red: 0, green: 0, blue: 255},
            effects: [{
                type: 'look_at',
                settings: {
                    lookAt: 'obj',
                    axis: { x: true, y: true, z: true },
                }
            }]
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
`;T("tutorial-6","6. Objects Looking at Each Other",A,b,_);
//# sourceMappingURL=tutorial-6-BZu4mCbi.js.map
