import{D as c,S as d,a as n,c as p,P as h,W as u,b as m,E as g}from"../../tutorial.template-Do_7rQcW.js";/* empty css                     */import{i as f,a as w}from"../../tutorial_shared-C50Y8UXo.js";f();const E=`
<div class="concept">
<p>Everything in a parallax scene is an <strong>element</strong> - 3D shapes like boxes, spheres, and panels that live in virtual space. Elements are transformed and projected onto your screen. The <code>world.addBox()</code> function registers an element with the scene, defining its position, color, and rotation. <strong>Projections</strong> define how this 3D world maps to your 2D screen - enabling default perspective is what creates the foundation for parallax effects.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Create a World</strong> - The World object is the container for all your 3D elements and projections. It manages rendering, updates, and the projection pipeline.</li>
<li><strong>Enable Perspective</strong> - Call <code>enableDefaultPerspective()</code> to set up how 3D space maps to your 2D screen. This creates the camera and projection matrix.</li>
<li><strong>Add Elements</strong> - Use <code>world.addBox()</code> (and similar functions) to place shapes in the scene. Each element has properties like position, color, and rotation.</li>
<li><strong>Render Loop</strong> - In p5's <code>draw()</code> function, call <code>world.step()</code> to render one frame of your scene.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">World</span>
<span class="key-term">Element</span>
<span class="key-term">Projection</span>
<span class="key-term">Perspective</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-2">Animation Over Time</a>
<a href="#tutorial-3">Orbital Motion</a>
<a href="#tutorial-4">Camera Control</a>
</div>
`;async function y(t,o=c,i){let r,e;const l=o.clock??new d({...n,startPaused:o.paused,playback:{...n.playback,duration:5e3,isLoop:!0}}),s=new h(t);return r=i?.graphicProcessor??new p(t,s),e=new u(m.fromLibs({clock:l,loader:s})),e.startLoading(),e.enableDefaultPerspective(o.width,o.height),o.paused&&e.pause(),e.addBox({type:g.BOX,id:"box",width:100,rotate:a=>({pitch:-.25*Math.PI,yaw:.25*Math.PI+Math.PI*2*a.playback.progress,roll:0}),position:{x:0,y:0,z:0},fillColor:{red:100,green:100,blue:255},strokeColor:{red:255,green:255,blue:255},strokeWidth:1}),e.complete(),t.setup=()=>{t.createCanvas(o.width,o.height,t.WEBGL)},t.draw=async()=>{o.paused&&!e.isPaused()?e.pause():!o.paused&&e.isPaused()&&e.resume(),t.background(20),(await e.step(r)).running},e}const P=`import p5 from 'p5';
import {World} from "../../../scene/world.ts";
import {P5GraphicProcessor} from "../../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig, type P5SketchExtraArgs} from "./../sketch_engine.types.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";

/**
 * TUTORIAL: Adding Elements
 * 
 * Register 3D elements to the scene.
 */
export const adding_elements_explanation = \`
<div class="concept">
<p>Everything in a parallax scene is an <strong>element</strong> - 3D shapes like boxes, spheres, and panels that live in virtual space. Elements are transformed and projected onto your screen. The <code>world.addBox()</code> function registers an element with the scene, defining its position, color, and rotation. <strong>Projections</strong> define how this 3D world maps to your 2D screen - enabling default perspective is what creates the foundation for parallax effects.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Create a World</strong> - The World object is the container for all your 3D elements and projections. It manages rendering, updates, and the projection pipeline.</li>
<li><strong>Enable Perspective</strong> - Call <code>enableDefaultPerspective()</code> to set up how 3D space maps to your 2D screen. This creates the camera and projection matrix.</li>
<li><strong>Add Elements</strong> - Use <code>world.addBox()</code> (and similar functions) to place shapes in the scene. Each element has properties like position, color, and rotation.</li>
<li><strong>Render Loop</strong> - In p5's <code>draw()</code> function, call <code>world.step()</code> to render one frame of your scene.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">World</span>
<span class="key-term">Element</span>
<span class="key-term">Projection</span>
<span class="key-term">Perspective</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-2">Animation Over Time</a>
<a href="#tutorial-3">Orbital Motion</a>
<a href="#tutorial-4">Camera Control</a>
</div>
\`;

export async function tutorial_adding_elements(
    p: p5, 
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: P5SketchExtraArgs
): Promise<World<P5Bundler, any, any>> {
    let graphicProcessor: P5GraphicProcessor;
    let world: World<P5Bundler, any, any>;

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

    world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );

    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height);

    if (config.paused) {
        world.pause();
    }

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'box',
        width: 100,

        rotate: (context: ResolutionContext) => ({
            pitch: -0.25 * Math.PI,
            yaw: 0.25 * Math.PI + Math.PI * 2 * context.playback.progress,
            roll: 0
        }),

        position: {x: 0, y: 0, z: 0},
        fillColor: {red: 100, green: 100, blue: 255},
        strokeColor: {red: 255, green: 255, blue: 255},
        strokeWidth: 1,
    });

    world.complete();
    
    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
    };

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
`;w("tutorial-1","1. Adding Elements",y,P,E);
//# sourceMappingURL=tutorial-1-CHm236I_.js.map
