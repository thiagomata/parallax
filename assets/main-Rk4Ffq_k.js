import{$ as M,N as b,U as k,z as S,j as I,f as N,d as T,V as R,I as q,L as z,a as D,B as H,G as c,M as F}from"./tutorial-DguxYj_u-dU-97lk8.js";/* empty css                          */const W=`
<div class="concept">
<p>This demo showcases various 3D element types available in the parallax engine, with a camera that orbits around the scene center.</p>
</div>

<h3>Key Features</h3>
<ul>
<li><strong>Element Types</strong> - Pyramids, cylinders, cones, tori, elliptical, and text</li>
<li><strong>Presets</strong> - Using <code>CenterOrbit</code> for automatic camera movement</li>
<li><strong>Dynamic Properties</strong> - Rotation based on playback timeline</li>
</ul>
`;function B(a,i=k){let g;const d=i.clock??new N({...T,startPaused:i.paused,playback:{...T.playback,duration:1e4,isLoop:!0}}),p=i.loader??new R(a),o=new q(z.fromLibs({clock:d,loader:p}));return o.loadPreset(D(a,{radius:500})),o.enableDefaultPerspective(i.width,i.height),o.complete(),a.setup=()=>{a.createCanvas(i.width,i.height,a.WEBGL),g=new H(a,p),o.addPyramid({id:"back-pyramid",type:c.PYRAMID,baseSize:200,height:150,position:{x:-100,y:0,z:-200},fillColor:{red:0,green:255,blue:0,alpha:1},strokeColor:{red:255,green:255,blue:255}}),o.addCylinder({id:"mid-cylinder",type:c.CYLINDER,radius:10,height:100,rotate:u=>({pitch:0,yaw:u.playback.progress*2*Math.PI,roll:u.playback.progress*2*Math.PI}),position:{x:-100,y:-100,z:0},fillColor:{red:255,green:0,blue:0,alpha:.5},strokeColor:{red:255,green:255,blue:255},strokeWidth:1}),o.addCone({id:"front-cone",type:c.CONE,radius:60,height:120,position:{x:100,y:0,z:200},fillColor:{red:0,green:0,blue:255,alpha:1},strokeColor:{red:255,green:255,blue:255},strokeWidth:1}),o.addTorus({id:"ring-torus",type:c.TORUS,radius:80,tubeRadius:20,position:{x:0,y:50,z:-50},fillColor:{red:255,green:255,blue:0,alpha:.8},strokeColor:{red:0,green:0,blue:0}}),o.addElliptical({id:"egg-elliptical",type:c.ELLIPTICAL,rx:50,ry:30,rz:70,position:{x:-50,y:50,z:50},fillColor:{red:255,green:0,blue:255,alpha:.6},strokeColor:{red:255,green:255,blue:255}}),o.addText({id:"title-text",type:c.TEXT,text:"PARALLAX",size:40,position:{x:50,y:100,z:0},font:{name:"Roboto",path:F("fonts/Roboto-Regular.ttf")},fillColor:{red:255,green:0,blue:255},strokeColor:{red:255,green:255,blue:255}})},a.draw=async()=>{i.paused&&!o.isPaused()?o.pause():!i.paused&&o.isPaused()&&o.resume(),a.background(15),await o.step(g)},o}const G=`import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "../tutorial/sketch_config.ts";
import {WorldSettings} from "../../scene/world_settings.ts";
import {CenterOrbit} from "../../scene/presets.ts";
import {appAssetPath} from "../../utils/app_paths.ts";

/**
 * HERO EXAMPLE: First Steps
 * 
 * A tour of different element types with orbital camera.
 */
export const heroExample1_explanation = \`
<div class="concept">
<p>This demo showcases various 3D element types available in the parallax engine, with a camera that orbits around the scene center.</p>
</div>

<h3>Key Features</h3>
<ul>
<li><strong>Element Types</strong> - Pyramids, cylinders, cones, tori, elliptical, and text</li>
<li><strong>Presets</strong> - Using <code>CenterOrbit</code> for automatic camera movement</li>
<li><strong>Dynamic Properties</strong> - Rotation based on playback timeline</li>
</ul>
\`;

export function heroExample1(p: p5, config: SketchConfig = DEFAULT_SKETCH_CONFIG): World<P5Bundler, any, any> {
    let graphicProcessor: P5GraphicProcessor;

    // Scene Orchestration
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 10000,
            isLoop: true
        }
    });

    // Asset Pipeline & World
    const loader = config.loader ?? new P5AssetLoader(p);
    const world = new World<P5Bundler, any, any>(
        WorldSettings.fromLibs({clock, loader})
    );

    world.loadPreset(CenterOrbit(p, {radius: 500}));
    world.enableDefaultPerspective(config.width, config.height);
    world.complete();

    p.setup = () => {
        p.createCanvas(config.width, config.height, p.WEBGL);
        graphicProcessor = new P5GraphicProcessor(p, loader);

        // Shape Registration
        world.addPyramid({
            id: 'back-pyramid',
            type: ELEMENT_TYPES.PYRAMID,
            baseSize: 200,
            height: 150,
            position: { x: -100, y: 0, z: -200 },
            fillColor: { red: 0, green: 255, blue: 0, alpha: 1.0 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addCylinder({
            id: 'mid-cylinder',
            type: ELEMENT_TYPES.CYLINDER,
            radius: 10,
            height: 100,
            rotate: (ctx: ResolutionContext) => ({
                pitch: 0,
                yaw: ctx.playback.progress * 2 * Math.PI,
                roll: ctx.playback.progress * 2 * Math.PI,
            }),
            position: {
                x: -100,
                y: -100,
                z: 0
            },
            fillColor: { red: 255, green: 0, blue: 0, alpha: 0.5 },
            strokeColor: { red: 255, green: 255, blue: 255 },
            strokeWidth: 1,
        });

        world.addCone({
            id: 'front-cone',
            type: ELEMENT_TYPES.CONE,
            radius: 60,
            height: 120,
            position: { x: 100, y: 0, z: 200 },
            fillColor: { red: 0, green: 0, blue: 255, alpha: 1.0 },
            strokeColor: { red: 255, green: 255, blue: 255 },
            strokeWidth: 1,
        });

        world.addTorus({
            id: 'ring-torus',
            type: ELEMENT_TYPES.TORUS,
            radius: 80,
            tubeRadius: 20,
            position: { x: 0, y: 50, z: -50 },
            fillColor: { red: 255, green: 255, blue: 0, alpha: 0.8 },
            strokeColor: { red: 0, green: 0, blue: 0 }
        });

        world.addElliptical({
            id: 'egg-elliptical',
            type: ELEMENT_TYPES.ELLIPTICAL,
            rx: 50,
            ry: 30,
            rz: 70,
            position: { x: -50, y: 50, z: 50 },
            fillColor: { red: 255, green: 0, blue: 255, alpha: 0.6 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });

        world.addText({
            id: 'title-text',
            type: ELEMENT_TYPES.TEXT,
            text: "PARALLAX",
            size: 40,
            position: { x: 50, y: 100, z: 0 },
            font: {
                name: 'Roboto',
                path: appAssetPath("fonts/Roboto-Regular.ttf")
            },
            fillColor: { red: 255, green: 0, blue: 255 },
            strokeColor: { red: 255, green: 255, blue: 255 }
        });
    };

    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }

        p.background(15);
        await world.step(graphicProcessor);
    };

    return world;
}
`;async function O(a,i,g,d,p="",o={}){const u=document.getElementById("tutorial-root");if(!u)return;let r=document.getElementById(`step-${a}`);if(!r)r=M({containerId:a,title:i,source:d,explanation:p}),u.appendChild(r);else{const t=r.querySelector('[data-content="preview"]'),e=r.querySelector('[data-content="code"]'),s=r.querySelector('[data-content="learn"]');if(t){const l=t.querySelector(".step-anchor");l&&(l.innerHTML=`<span>${i}</span>`)}if(e){const l=e.querySelector(".step-anchor");l&&(l.innerHTML=`<div class="status-dot"></div><span>${i}</span>`);const C=e.querySelector(".editor-box code");C&&(C.innerHTML=b.highlight(d,b.languages.typescript,"typescript"))}if(s){const l=s.querySelector(".learn-content");l&&(l.innerHTML=p)}}const E=r.querySelector(".editor-box"),h=r.querySelector(".canvas-box"),f=r.querySelector(".console-panel"),w=r.querySelector(".play-btn"),x=r.querySelector(".reset-btn"),v=r.querySelector(".copy-btn"),n=r.querySelector(".pause-btn"),y={...k,...o,width:h?.clientWidth||500,height:h?.clientHeight||400,paused:!1};let{currentP5:m}=await S.createSketchInstance(g,y,h,a);const L=r.querySelectorAll(".tab-btn"),A=r.querySelectorAll(".step-content");L.forEach(t=>{t.addEventListener("click",()=>{const e=t.getAttribute("data-tab");L.forEach(s=>s.classList.remove("active")),t.classList.add("active"),A.forEach(s=>{s.getAttribute("data-content")===e?s.classList.add("active"):s.classList.remove("active")})})});const P=async()=>{f.style.display="block",f.innerHTML="";try{const{fn:t}=I(E.innerText);m=(await S.createSketchInstance(t,y,h,a)).currentP5,y.paused=!1,n.dataset.paused="false",n.innerHTML='<i class="fas fa-pause"></i>';const e=document.createElement("div");e.className="log-entry info",e.textContent="[Engine] Hydration successful.",f.appendChild(e)}catch(t){console.error("executeUpdate error:",t);const e=document.createElement("div");e.className="log-entry info",e.style.color="var(--error)",e.textContent=t instanceof Error?`Error: ${t.message}

Stack:
${t.stack}`:String(t),e.style.whiteSpace="pre-wrap",e.style.fontSize="11px",f.appendChild(e)}};w.addEventListener("click",P),x.addEventListener("click",()=>{const t=r.querySelector(".editor-box code");t&&(t.innerHTML=b.highlight(d,b.languages.typescript,"typescript")),P()}),v.addEventListener("click",()=>navigator.clipboard.writeText(E.innerText));const _=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0&&window.innerWidth<769;r.querySelectorAll(".fullscreen-btn").forEach(t=>{if(_()){t.style.display="none";return}t.addEventListener("click",()=>{const e=r.querySelector(".canvas-box");e&&(document.fullscreenElement||document.webkitFullscreenElement?document.exitFullscreen?.()||document.webkitExitFullscreen?.():(e.requestFullscreen?.bind(e)||e.webkitRequestFullscreen?.bind(e))?.())})}),n.addEventListener("click",()=>{m&&(n.dataset.paused==="true"?(m.loop(),y.paused=!1,n.dataset.paused="false",n.innerHTML='<i class="fas fa-pause"></i>'):(m.noLoop(),y.paused=!0,n.dataset.paused="true",n.innerHTML='<i class="fas fa-play"></i>'))})}O("hero-demo-1","Hero Demo",B,G,W);
//# sourceMappingURL=main-Rk4Ffq_k.js.map
