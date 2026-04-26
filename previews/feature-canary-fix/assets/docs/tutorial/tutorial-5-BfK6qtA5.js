import{D as h,S as u,a as i,c as d,P as g,W as m,b as y,E as l,d as c}from"../../tutorial.template-Do_7rQcW.js";/* empty css                     */import{i as w,a as T}from"../../tutorial_shared-C50Y8UXo.js";w();const f=`
<div class="concept">
<p>The parallax engine supports <strong>textures</strong> and <strong>fonts</strong> as assets. Textures are images mapped onto 3D surfaces, while fonts render 3D text. The <code>P5AssetLoader</code> manages async loading of these assets and provides a <code>waitForAllAssets()</code> function to ensure they're ready before rendering.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Texture Object</strong> - Add a <code>texture</code> property to an element with <code>path</code>, <code>width</code>, and <code>height</code>. The engine will load the image and map it to the element.</li>
<li><strong>Font Object</strong> - For text elements, provide a <code>font</code> property with <code>name</code> and <code>path</code> to load a TTF/OTF font file.</li>
<li><strong>Async Setup</strong> - Since asset loading is async, wrap <code>p.setup()</code> in <code>async</code> and await <code>loader.waitForAllAssets()</code> to prevent showing blank frames.</li>
<li><strong>Hydration</strong> - Elements with textures are "hydrated" when their assets load. This happens automatically when you add the element.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Texture</span>
<span class="key-term">Font</span>
<span class="key-term">Asset Loader</span>
<span class="key-term">Hydration</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1"> Adding Elements</a>
<a href="#tutorial-5">Loading Textures</a>
</div>
`;async function x(s,t=h,n){let a;const p=t.clock??new u({...i,startPaused:t.paused,playback:{...i.playback,duration:5e3,isLoop:!0}}),o=new g(s);a=n?.graphicProcessor??new d(s,o);const e=new m(y.fromLibs({clock:p,loader:o}));return e.startLoading(),e.enableDefaultPerspective(t.width,t.height),t.paused&&e.pause(),s.setup=async()=>{s.createCanvas(t.width,t.height,s.WEBGL),n?.graphicProcessor||(a=new d(s,o)),e.addBox({type:l.BOX,id:"textured-box",width:150,position:{x:0,y:0,z:-100},strokeWidth:0,rotate:r=>({pitch:0,yaw:Math.PI*2*r.playback.progress,roll:Math.PI*2*r.playback.progress}),texture:{path:c("img/target.png"),width:100,height:100}}),e.addText({type:l.TEXT,id:"title",text:"TEXTURES",size:30,position:{x:0,y:0,z:50},font:{name:"Roboto",path:c("fonts/Roboto-Regular.ttf")},fillColor:{red:0,green:229,blue:255}}),await o.waitForAllAssets()},e.complete(),s.draw=async()=>{t.paused&&!e.isPaused()?e.pause():!t.paused&&e.isPaused()&&e.resume(),s.background(15),(await e.step(a)).running},e}const E=`import p5 from 'p5';
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../../scene/types.ts";
import {World} from "../../../scene/world.ts";
import {P5GraphicProcessor} from "../../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig, type P5SketchExtraArgs} from "../sketch_engine.types.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";
import {appAssetPath} from "../../../utils/app_paths.ts";

/**
 * TUTORIAL: Loading Textures
 * 
 * Apply images and fonts to 3D elements.
 */
export const textures_explanation = \`
<div class="concept">
<p>The parallax engine supports <strong>textures</strong> and <strong>fonts</strong> as assets. Textures are images mapped onto 3D surfaces, while fonts render 3D text. The <code>P5AssetLoader</code> manages async loading of these assets and provides a <code>waitForAllAssets()</code> function to ensure they're ready before rendering.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Texture Object</strong> - Add a <code>texture</code> property to an element with <code>path</code>, <code>width</code>, and <code>height</code>. The engine will load the image and map it to the element.</li>
<li><strong>Font Object</strong> - For text elements, provide a <code>font</code> property with <code>name</code> and <code>path</code> to load a TTF/OTF font file.</li>
<li><strong>Async Setup</strong> - Since asset loading is async, wrap <code>p.setup()</code> in <code>async</code> and await <code>loader.waitForAllAssets()</code> to prevent showing blank frames.</li>
<li><strong>Hydration</strong> - Elements with textures are "hydrated" when their assets load. This happens automatically when you add the element.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">Texture</span>
<span class="key-term">Font</span>
<span class="key-term">Asset Loader</span>
<span class="key-term">Hydration</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1"> Adding Elements</a>
<a href="#tutorial-5">Loading Textures</a>
</div>
\`;

export async function tutorial_textures(
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

    p.setup = async () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        if (!extraArgs?.graphicProcessor) {
            graphicProcessor = new P5GraphicProcessor(p, loader);
        }

        world.addBox({
            type: ELEMENT_TYPES.BOX,
            id: 'textured-box',
            width: 150,
            position: {x: 0, y: 0, z: -100},
            strokeWidth: 0,
            rotate: (context: ResolutionContext) => ({
                pitch: 0,
                yaw: Math.PI * 2 * context.playback.progress,
                roll: Math.PI * 2 * context.playback.progress,
            }),
            texture: {
                path: appAssetPath("img/target.png"),
                width: 100,
                height: 100,
            },
        });

        world.addText({
            type: ELEMENT_TYPES.TEXT,
            id: 'title',
            text: "TEXTURES",
            size: 30,
            position: {x: 0, y: 0, z: 50},
            font: {
                name: 'Roboto',
                path: appAssetPath("fonts/Roboto-Regular.ttf")
            },
            fillColor: {red: 0, green: 229, blue: 255}
        });

        await loader.waitForAllAssets();
    };

    world.complete();
    
    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }
        
        p.background(15);
        const result = await world.step(graphicProcessor);
        if (!result.running) return;
    };

    return world;
}
`;T("tutorial-5","5. Loading Textures",x,E,f);
//# sourceMappingURL=tutorial-5-BfK6qtA5.js.map
