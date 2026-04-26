import{D as m,S as x,a as g,c as k,P as v,W as S,b,f as a,E as l,t as E}from"../../colors-Dsms1QZb.js";import"../../tutorial.template-zTd5bYdO.js";import{i as A,a as C}from"../../tutorial_nav-C4cqp1PQ.js";function d(n){const t=n.previousStore.global.keys??{};return t.ArrowUp||t.w||t.W?"up":t.ArrowDown||t.s||t.S?"down":t.ArrowLeft||t.a||t.A?"left":t.ArrowRight||t.d||t.D?"right":"idle"}function L(n){switch(n){case"up":return a.yellow;case"down":return a.pink;case"right":return a.orange;case"left":return a.lime;default:return a.white}}const P=`
<div class="concept">
<p>Now that you know how to add elements and create animations, let's make them <strong>interactive</strong>. This tutorial introduces the <strong>ExternalStore</strong> - a way to read input (like keyboard keys) and store state that persists between frames. You'll control a box with arrow keys and see it change color based on movement direction!</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>ExternalStore</strong> - A data store that lives outside the scene engine. It has two parts: <code>previousStore</code> (read-only, from last frame) and <code>nextStore</code> (writable, for next frame).</li>
<li><strong>Global Input</strong> - Store keys in <code>externalStore.global.keys</code>. This persists across frames so you can read the current key state.</li>
<li><strong>Element State</strong> - Each element has its own state in <code>externalStore[elementId]</code>. Use <code>ctx.element</code> as a shortcut to access your element's state.</li>
<li><strong>Key Handlers</strong> - Set up keydown/keyup listeners that update the external store. These changes apply to the <strong>next frame</strong>.</li>
<li><strong>Texture Variants</strong> - Preload multiple texture refs up front, then select which one to draw during the frame using a small selector function.</li>
</ol>

<h3>Color Mapping</h3>
<p>The box carries the arrow indicator, so when you move the box, the arrow moves with it and only needs to rotate and tint based on keyboard-driven movement direction:</p>
<ul>
<li><strong>Yellow</strong> - Up, the box and arrow move upward together</li>
<li><strong>Pink</strong> - Down, the box and arrow move downward together</li>
<li><strong>Orange</strong> - Right, the box and arrow move right together</li>
<li><strong>Lime</strong> - Left, the box and arrow move left together</li>
<li><strong>White</strong> - Stationary, the box and arrow stay neutral</li>
</ul>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">ExternalStore</span>
<span class="key-term">previousStore</span>
<span class="key-term">nextStore</span>
<span class="key-term">ctx.element</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1">Adding Elements</a>
<a href="#tutorial-2">Animation Over Time</a>
</div>
`;async function T(n,t=m,w){let c,s,p=!1;const f=t.clock??new x({...g,startPaused:t.paused,playback:{...g.playback,duration:5e3,isLoop:!0}}),y=new v(n);c=w?.graphicProcessor??new k(n,y),s=new S(b.fromLibs({clock:f,loader:y})),s.startLoading(),s.enableDefaultPerspective(t.width,t.height),t.paused&&s.pause(),s.addBox({type:l.BOX,id:"box",width:60,height:60,depth:60,internal:{position:{x:0,y:0,z:-100},velocity:{x:0,y:0},speed:0},position:o=>{const e=o.element;e.position||(e.position={x:0,y:0,z:-100}),e.velocity||(e.velocity={x:0,y:0}),e.speed||(e.speed=0);const r=o.previousStore.global.keys??{},i=.4,h=.92;return(r.ArrowUp||r.w||r.W)&&(e.velocity.y-=i),(r.ArrowDown||r.s||r.S)&&(e.velocity.y+=i),(r.ArrowLeft||r.a||r.A)&&(e.velocity.x-=i),(r.ArrowRight||r.d||r.D)&&(e.velocity.x+=i),e.velocity.x*=h,e.velocity.y*=h,e.position.x+=e.velocity.x,e.position.y+=e.velocity.y,e.speed=Math.sqrt(e.velocity.x**2+e.velocity.y**2),{x:e.position.x,y:e.position.y,z:e.position.z}},fillColor:o=>L(d(o)),strokeColor:a.red,strokeWidth:2}),s.addText({type:l.TEXT,id:"title",text:"Use the keyboard arrows.",size:10,position:{x:0,y:-50,z:0},font:{name:"Roboto",path:"/parallax/fonts/Roboto-Regular.ttf"},fillColor:a.lime}),s.addPanel({type:l.PANEL,id:"arrow",parentId:"box",width:10,height:10,rotate:{pitch:0,yaw:0,roll:o=>{const e=d(o);return e==="up"?0:e==="down"?Math.PI:e==="left"?-Math.PI/2:e==="right"?Math.PI/2:0}},position:{x:0,y:0,z:31},texture:E({default:"target",variants:{target:{path:"/parallax/img/target.png",width:100,height:100},arrow:{path:"/parallax/img/arrow.png",width:100,height:100}},select:o=>d(o)==="idle"?"target":"arrow"})}),s.complete();const u=(o,e)=>{const r=s.getExternalStore();r.global=r.global??{},r.global.keys=r.global.keys??{},r.global.keys[o]=e};return typeof window<"u"&&(window.addEventListener("keydown",o=>{["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Spacebar"].includes(o.key)&&(o.preventDefault(),o.stopPropagation()),u(o.key,!0)},{passive:!1}),window.addEventListener("keyup",o=>{["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Spacebar"].includes(o.key)&&(o.preventDefault(),o.stopPropagation()),u(o.key,!1)},{passive:!1})),n.setup=()=>{n.createCanvas(t.width,t.height,n.WEBGL),p=!0},n.draw=async()=>{if(t.paused&&!s.isPaused()?s.pause():!t.paused&&s.isPaused()&&s.resume(),n.background(20),p){if(n.push(),n.translate(0,0,100),!(await s.step(c)).running)return;n.pop()}},s}const R=`import p5 from 'p5';
import {World} from "../../../scene/world.ts";
import {P5GraphicProcessor} from "../../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, textureSet, type ColorRGBA, type ResolutionContext} from "../../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig, type P5SketchExtraArgs} from "./../sketch_engine.types.ts";
import {WorldSettings} from "../../../scene/world_settings.ts";
import {COLORS} from "../../../scene/colors.ts";

export type Direction = 'up' | 'down' | 'left' | 'right' | 'idle';

export function getDirection(ctx: ResolutionContext): Direction {
    const keys = (ctx.previousStore as any).global.keys ?? {};
    if (keys.ArrowUp || keys.w || keys.W) return 'up';
    if (keys.ArrowDown || keys.s || keys.S) return 'down';
    if (keys.ArrowLeft || keys.a || keys.A) return 'left';
    if (keys.ArrowRight || keys.d || keys.D) return 'right';
    return 'idle';
}

export function getDirectionColor(direction: Direction): ColorRGBA {
    switch (direction) {
        case 'up': return COLORS.yellow as ColorRGBA;
        case 'down': return COLORS.pink as ColorRGBA;
        case 'right': return COLORS.orange as ColorRGBA;
        case 'left': return COLORS.lime as ColorRGBA;
        default: return COLORS.white as ColorRGBA;
    }
}

export const tutorial_interactive_box_explanation = \`
<div class="concept">
<p>Now that you know how to add elements and create animations, let's make them <strong>interactive</strong>. This tutorial introduces the <strong>ExternalStore</strong> - a way to read input (like keyboard keys) and store state that persists between frames. You'll control a box with arrow keys and see it change color based on movement direction!</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>ExternalStore</strong> - A data store that lives outside the scene engine. It has two parts: <code>previousStore</code> (read-only, from last frame) and <code>nextStore</code> (writable, for next frame).</li>
<li><strong>Global Input</strong> - Store keys in <code>externalStore.global.keys</code>. This persists across frames so you can read the current key state.</li>
<li><strong>Element State</strong> - Each element has its own state in <code>externalStore[elementId]</code>. Use <code>ctx.element</code> as a shortcut to access your element's state.</li>
<li><strong>Key Handlers</strong> - Set up keydown/keyup listeners that update the external store. These changes apply to the <strong>next frame</strong>.</li>
<li><strong>Texture Variants</strong> - Preload multiple texture refs up front, then select which one to draw during the frame using a small selector function.</li>
</ol>

<h3>Color Mapping</h3>
<p>The box carries the arrow indicator, so when you move the box, the arrow moves with it and only needs to rotate and tint based on keyboard-driven movement direction:</p>
<ul>
<li><strong>Yellow</strong> - Up, the box and arrow move upward together</li>
<li><strong>Pink</strong> - Down, the box and arrow move downward together</li>
<li><strong>Orange</strong> - Right, the box and arrow move right together</li>
<li><strong>Lime</strong> - Left, the box and arrow move left together</li>
<li><strong>White</strong> - Stationary, the box and arrow stay neutral</li>
</ul>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">ExternalStore</span>
<span class="key-term">previousStore</span>
<span class="key-term">nextStore</span>
<span class="key-term">ctx.element</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-1">Adding Elements</a>
<a href="#tutorial-2">Animation Over Time</a>
</div>
\`;

export async function tutorial_interactive_box(
    p: p5, 
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: P5SketchExtraArgs
): Promise<World<P5Bundler, any, any>> {
    let graphicProcessor: P5GraphicProcessor;
    let world: World<P5Bundler, any, any>;
    let setupDone = false;

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
        width: 60,
        height: 60,
        depth: 60,
        internal: {
            position: { x: 0, y: 0, z: -100 },
            velocity: { x: 0, y: 0 },
            speed: 0
        },
        position: (ctx: ResolutionContext) => {
            const elem = ctx.element as any;
            
            if (!elem.position) {
                elem.position = { x: 0, y: 0, z: -100 };
            }
            if (!elem.velocity) {
                elem.velocity = { x: 0, y: 0 };
            }
            if (!elem.speed) {
                elem.speed = 0;
            }
            
            const keys = (ctx.previousStore as any).global.keys ?? {};
            const ACCEL = 0.4;
            const FRICTION = 0.92;
            
            if (keys.ArrowUp || keys.w || keys.W) {
                elem.velocity.y -= ACCEL;
            }
            if (keys.ArrowDown || keys.s || keys.S) {
                elem.velocity.y += ACCEL;
            }
            if (keys.ArrowLeft || keys.a || keys.A) {
                elem.velocity.x -= ACCEL;
            }
            if (keys.ArrowRight || keys.d || keys.D) {
                elem.velocity.x += ACCEL;
            }
            
            elem.velocity.x *= FRICTION;
            elem.velocity.y *= FRICTION;
            
            elem.position.x += elem.velocity.x;
            elem.position.y += elem.velocity.y;
            
            elem.speed = Math.sqrt(elem.velocity.x ** 2 + elem.velocity.y ** 2);
            
            return {
                x: elem.position.x,
                y: elem.position.y,
                z: elem.position.z
            };
        },
        fillColor: (ctx: ResolutionContext) => getDirectionColor(getDirection(ctx)),
        strokeColor: COLORS.red,
        strokeWidth: 2,
    });

    world.addText({
        type: ELEMENT_TYPES.TEXT,
        id: 'title',
        text: "Use the keyboard arrows.",
        size: 10,
        position: {x: 0, y: -50, z: 0},
        font: {
            name: 'Roboto',
            path: '/parallax/fonts/Roboto-Regular.ttf'
        },
        fillColor: COLORS.lime,
    })

    world.addPanel({
        type: ELEMENT_TYPES.PANEL,
        id: 'arrow',
        parentId: "box",
        width: 10,
        height: 10,
        rotate: {
            pitch: 0,
            yaw: 0,
            roll: (ctx: ResolutionContext) => {
                const direction = getDirection(ctx);
                if (direction === 'up') {
                    return 0;
                }
                if (direction === 'down') {
                    return Math.PI;
                }
                if (direction === 'left') {
                    return -Math.PI / 2;
                }
                if (direction === 'right') {
                    return Math.PI / 2;
                }
                return 0;
            },
        },
        position: {x: 0, y: 0, z: 31},
        texture: textureSet({
            default: 'target',
            variants: {
                target: {
                    path: '/parallax/img/target.png',
                    width: 100,
                    height: 100,
                },
                arrow: {
                    path: '/parallax/img/arrow.png',
                    width: 100,
                    height: 100,
                },
            },
            select: (ctx: ResolutionContext) => {
                return getDirection(ctx) === 'idle' ? 'target' : 'arrow';
            },
        }),
    });

    world.complete();

    const syncGlobalKeys = (key: string, pressed: boolean) => {
        const store = world.getExternalStore() as any;
        store.global = store.global ?? {};
        store.global.keys = store.global.keys ?? {};
        store.global.keys[key] = pressed;
    };

    const keyHandlers = () => {
        window.addEventListener('keydown', (e) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }
            syncGlobalKeys(e.key, true);
        }, { passive: false });

        window.addEventListener('keyup', (e) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }
            syncGlobalKeys(e.key, false);
        }, { passive: false });
    };
    
    if (typeof window !== 'undefined') {
        keyHandlers();
    }

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        setupDone = true;
    };

    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }
        
        p.background(20);
        
        if (setupDone) {
            p.push();
            p.translate(0, 0, 100);
            const result = await world.step(graphicProcessor);
            if (!result.running) return;
            p.pop();
        }
    };

    return world;
}
`;A("tutorial-10","10. Interactive Box Control",T,R,P);C();
//# sourceMappingURL=tutorial-10-D91mmJkG.js.map
