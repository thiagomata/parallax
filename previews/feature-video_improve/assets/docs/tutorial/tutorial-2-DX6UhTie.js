import{D as p,S as d,a as i,P as u,c as m,W as f,b as h,T as a,E as g}from"../../tutorial.template-DfAWeqR7.js";/* empty css                     */import{i as y,a as k}from"../../tutorial_shared-CoO0eFCZ.js";y();const E=`
<div class="concept">
<p>The parallax engine includes a built-in <strong>playback timeline</strong> that loops over a configurable duration. Properties can be <em>dynamic functions</em> that receive the current playback state and return computed values. This enables smooth, synchronized animations without manual timing.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>SceneClock</strong> - The clock manages the playback timeline. Configure it with <code>duration</code> (in ms) and <code>isLoop</code> to create repeating animations.</li>
<li><strong>ResolutionContext</strong> - Every dynamic property receives a context object containing <code>playback.progress</code>, a value from 0 to 1 representing position in the timeline.</li>
<li><strong>Property Functions</strong> - Instead of static values, pass functions that compute properties each frame. Use sine/cosine waves for smooth oscillation.</li>
<li><strong>Effects</strong> - Effects run after transformations, allowing you to modify computed properties based on other values (like inverting colors dynamically).</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">SceneClock</span>
<span class="key-term">ResolutionContext</span>
<span class="key-term">Playback Progress</span>
<span class="key-term">Effect</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1"> Adding Elements</a>
<a href="#tutorial-3">Orbital Motion</a>
<a href="#tutorial-6">Dynamic Properties</a>
</div>
`;async function b(r,o=p,l){let s;const c=o.clock??new d({...i,startPaused:o.paused,playback:{...i.playback,duration:5e3,isLoop:!0}}),n=o.loader??new u(r);s=l?.graphicProcessor??new m(r,n);const t=new f(h.fromLibs({clock:c,loader:n,elementEffectLib:{[a.type]:a}}));return t.startLoading(),t.enableDefaultPerspective(o.width,o.height),o.paused&&t.pause(),r.setup=()=>{r.createCanvas(o.width,o.height,r.WEBGL),t.addBox({type:g.BOX,id:"pulsing-box",position:{x:0,y:0,z:0},width:e=>100+Math.sin(e.playback.progress*Math.PI*2)*50,rotate:e=>({pitch:0,yaw:Math.PI*2*e.playback.progress,roll:Math.PI*2*e.playback.progress}),fillColor:{red:255,green:100,blue:e=>127+127*Math.cos(Math.PI*2*e.playback.progress),alpha:1},strokeWidth:5,effects:[{type:a.type,settings:{transform:(e,T)=>({...e,strokeColor:{red:255-(e.fillColor?.red??0),green:255-(e.fillColor?.green??0),blue:255-(e.fillColor?.blue??0),alpha:1}})}}]})},t.complete(),r.draw=async()=>{o.paused&&!t.isPaused()?t.pause():!o.paused&&t.isPaused()&&t.resume(),r.background(20),(await t.step(s)).running},t}const P=`import p5 from 'p5';
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext, type Uint8, type Alpha} from "../../../scene/types.ts";
import {World} from "../../../scene/world.ts";
import {P5GraphicProcessor} from "../../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig, type P5SketchExtraArgs} from "../sketch_engine.types.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";
import {TransformEffect, type TransformEffectConfig} from "../../../scene/effects/transform_effect.ts";

/**
 * TUTORIAL: Animation Over Time
 * 
 * Animate element properties using the playback timeline.
 */
export const animation_explanation = \`
<div class="concept">
<p>The parallax engine includes a built-in <strong>playback timeline</strong> that loops over a configurable duration. Properties can be <em>dynamic functions</em> that receive the current playback state and return computed values. This enables smooth, synchronized animations without manual timing.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>SceneClock</strong> - The clock manages the playback timeline. Configure it with <code>duration</code> (in ms) and <code>isLoop</code> to create repeating animations.</li>
<li><strong>ResolutionContext</strong> - Every dynamic property receives a context object containing <code>playback.progress</code>, a value from 0 to 1 representing position in the timeline.</li>
<li><strong>Property Functions</strong> - Instead of static values, pass functions that compute properties each frame. Use sine/cosine waves for smooth oscillation.</li>
<li><strong>Effects</strong> - Effects run after transformations, allowing you to modify computed properties based on other values (like inverting colors dynamically).</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">SceneClock</span>
<span class="key-term">ResolutionContext</span>
<span class="key-term">Playback Progress</span>
<span class="key-term">Effect</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1"> Adding Elements</a>
<a href="#tutorial-3">Orbital Motion</a>
<a href="#tutorial-6">Dynamic Properties</a>
</div>
\`;

export async function tutorial_animation(
    p: p5, 
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: P5SketchExtraArgs
): Promise<World<P5Bundler, any, any>> {
    let graphicProcessor: P5GraphicProcessor;

    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 5000,
            isLoop: true,
        }
    });

    const loader = config.loader ?? new P5AssetLoader(p);
    graphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader, elementEffectLib: {
                [TransformEffect.type]: TransformEffect
        }})
    );
    
    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height);

    if (config.paused) {
        world.pause();
    }

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'pulsing-box',
            position: {x: 0, y: 0, z: 0},

            width: (context: ResolutionContext) => {
                return 100 + Math.sin(context.playback.progress * Math.PI * 2) * 50;
            },

            rotate: (context: ResolutionContext) => ({
                pitch: 0,
                yaw: Math.PI * 2 * context.playback.progress,
                roll: Math.PI * 2 * context.playback.progress,
            }),

            fillColor: {
                red: 255 as Uint8,
                green: 100 as Uint8,
                blue: (context: ResolutionContext): Uint8 => {
                    return (127 + 127 * Math.cos(Math.PI * 2 * context.playback.progress)) as Uint8;
                },
                alpha: 1.0 as Alpha
            },
            strokeWidth: 5,
            effects: [
                {
                    type: TransformEffect.type,
                    settings: {
                        transform: (element, _) => {
                            return {
                                ...element,
                                strokeColor: {
                                    red:   (255 - (element.fillColor?.red   ?? 0)) as Uint8,
                                    green: (255 - (element.fillColor?.green ?? 0)) as Uint8,
                                    blue:  (255 - (element.fillColor?.blue  ?? 0)) as Uint8,
                                    alpha: 1.0 as Alpha
                                }
                            }
                        }
                    }  as TransformEffectConfig
                }
            ]
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
`;k("tutorial-2","2. Animation Over Time",b,P,E);
//# sourceMappingURL=tutorial-2-DX6UhTie.js.map
