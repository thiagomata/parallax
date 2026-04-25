import{D as p,S as d,a as n,c,P as g,W as h,b as u,E as m}from"../../tutorial.template-XQYDx-t7.js";/* empty css                     */import{i as y,a as b}from"../../tutorial_shared-BUZHywJH.js";y();const f=`
<div class="concept">
<p>Objects can orbit around a point by using <strong>sin</strong> and <strong>cos</strong> functions. These trigonometric functions map a circular path where the progress value (0 to 1) becomes an angle, and the sine/cosine produce x and y coordinates on the circle.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Circle Math</strong> - For an orbit: <code>x = cos(angle) * radius</code> and <code>y = sin(angle) * radius</code>. As the angle increases from 0 to 2π, the object traces a circle.</li>
<li><strong>Mapping Progress</strong> - Multiply <code>progress</code> by 2π to convert the 0-1 timeline into a full rotation (0 to 360 degrees).</li>
<li><strong>Multi-axis Orbits</strong> - Add different sine/cosine waves to x, y, and z for complex 3D orbital paths.</li>
<li><strong>Synchronized Rotation</strong> - Apply the same angle to rotation properties so the object tumbles as it orbits, creating natural-looking motion.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Trigonometry</span>
<span class="key-term">Sine Wave</span>
<span class="key-term">Cosine Wave</span>
<span class="key-term">Orbit</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1"> Adding Elements</a>
<a href="#tutorial-2">Animation Over Time</a>
</div>
`;async function P(t,o=p,i){let s;const l=o.clock??new d({...n,startPaused:o.paused,playback:{...n.playback,duration:5e3,isLoop:!0}}),a=new g(t);s=i?.graphicProcessor??new c(t,a);const e=new h(u.fromLibs({clock:l,loader:a}));return e.startLoading(),e.enableDefaultPerspective(o.width,o.height),o.paused&&e.pause(),e.addBox({type:m.BOX,id:"orbit-box",width:50,position:r=>({x:Math.cos(r.playback.progress*Math.PI*2)*50,y:Math.sin(r.playback.progress*Math.PI*2)*50,z:-100}),rotate:r=>({pitch:r.playback.progress*Math.PI,yaw:r.playback.progress*Math.PI*2,roll:0}),fillColor:{red:0,green:255,blue:150,alpha:1},strokeColor:{red:0,green:0,blue:255},strokeWidth:5}),t.setup=()=>{t.createCanvas(o.width,o.height,t.WEBGL),i?.graphicProcessor||(s=new c(t,a))},e.complete(),t.draw=async()=>{o.paused&&!e.isPaused()?e.pause():!o.paused&&e.isPaused()&&e.resume(),t.background(20),(await e.step(s)).running},e}const k=`import p5 from 'p5';
import {World} from "../../../scene/world.ts";
import {P5GraphicProcessor} from "../../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES, type ResolutionContext, type Vector3, type Rotation3,
} from "../../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig, type P5SketchExtraArgs} from "../sketch_engine.types.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";

/**
 * TUTORIAL: Orbital Motion
 * 
 * Move elements in circular paths using trigonometry.
 */
export const orbital_motion_explanation = \`
<div class="concept">
<p>Objects can orbit around a point by using <strong>sin</strong> and <strong>cos</strong> functions. These trigonometric functions map a circular path where the progress value (0 to 1) becomes an angle, and the sine/cosine produce x and y coordinates on the circle.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Circle Math</strong> - For an orbit: <code>x = cos(angle) * radius</code> and <code>y = sin(angle) * radius</code>. As the angle increases from 0 to 2π, the object traces a circle.</li>
<li><strong>Mapping Progress</strong> - Multiply <code>progress</code> by 2π to convert the 0-1 timeline into a full rotation (0 to 360 degrees).</li>
<li><strong>Multi-axis Orbits</strong> - Add different sine/cosine waves to x, y, and z for complex 3D orbital paths.</li>
<li><strong>Synchronized Rotation</strong> - Apply the same angle to rotation properties so the object tumbles as it orbits, creating natural-looking motion.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Trigonometry</span>
<span class="key-term">Sine Wave</span>
<span class="key-term">Cosine Wave</span>
<span class="key-term">Orbit</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1"> Adding Elements</a>
<a href="#tutorial-2">Animation Over Time</a>
</div>
\`;

export async function tutorial_orbital_motion(
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
            isLoop: true
        }
    });

    const loader = new P5AssetLoader(p);
    graphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);
    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );
    
    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height);

    if (config.paused) {
        world.pause();
    }

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'orbit-box',
        width: 50,
        position: (context: ResolutionContext): Vector3 => ({
            x: Math.cos(context.playback.progress * Math.PI * 2) * 50,
            y: Math.sin(context.playback.progress * Math.PI * 2) * 50,
            z: -100
        }),

        rotate: (context: ResolutionContext): Rotation3 => ({
            pitch: context.playback.progress * Math.PI,
            yaw: context.playback.progress * Math.PI * 2,
            roll: 0,
        }),

        fillColor: {red: 0, green: 255, blue: 150, alpha: 1.0},
        strokeColor: {red: 0, green: 0, blue: 255},
        strokeWidth: 5,
    });

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        if (!extraArgs?.graphicProcessor) {
            graphicProcessor = new P5GraphicProcessor(p, loader);
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
`;b("tutorial-3","3. Orbital Motion",P,k,f);
//# sourceMappingURL=tutorial-3-BTIMHCY5.js.map
