import{D as x,S as M,a as T,P as N,W as q,b as R,C as F,E as c,c as I,t as z,d as m,s as k,e as D}from"./tutorial.template-Di1W94te.js";/* empty css                 */const W=`
<div class="concept">
<p>This demo showcases various 3D element types available in the parallax engine, with a camera that orbits around the scene center.</p>
</div>

<h3>Key Features</h3>
<ul>
<li><strong>Element Types</strong> - Pyramids, cylinders, cones, tori, elliptical, and text</li>
<li><strong>Presets</strong> - Using <code>CenterOrbit</code> for automatic camera movement</li>
<li><strong>Dynamic Properties</strong> - Rotation based on playback timeline</li>
</ul>
`;function H(s,a=x){let y;const d=a.clock??new M({...T,startPaused:a.paused,playback:{...T.playback,duration:1e4,isLoop:!0}}),p=a.loader??new N(s),o=new q(R.fromLibs({clock:d,loader:p}));return o.loadPreset(F(s,{radius:500})),o.enableDefaultPerspective(a.width,a.height),o.complete(),s.setup=()=>{s.createCanvas(a.width,a.height,s.WEBGL),y=new I(s,p),o.addPyramid({id:"back-pyramid",type:c.PYRAMID,baseSize:200,height:150,position:{x:-100,y:0,z:-200},fillColor:{red:0,green:255,blue:0,alpha:1},strokeColor:{red:255,green:255,blue:255}}),o.addCylinder({id:"mid-cylinder",type:c.CYLINDER,radius:10,height:100,rotate:u=>({pitch:0,yaw:u.playback.progress*2*Math.PI,roll:u.playback.progress*2*Math.PI}),position:{x:-100,y:-100,z:0},fillColor:{red:255,green:0,blue:0,alpha:.5},strokeColor:{red:255,green:255,blue:255},strokeWidth:1}),o.addCone({id:"front-cone",type:c.CONE,radius:60,height:120,position:{x:100,y:0,z:200},fillColor:{red:0,green:0,blue:255,alpha:1},strokeColor:{red:255,green:255,blue:255},strokeWidth:1}),o.addTorus({id:"ring-torus",type:c.TORUS,radius:80,tubeRadius:20,position:{x:0,y:50,z:-50},fillColor:{red:255,green:255,blue:0,alpha:.8},strokeColor:{red:0,green:0,blue:0}}),o.addElliptical({id:"egg-elliptical",type:c.ELLIPTICAL,rx:50,ry:30,rz:70,position:{x:-50,y:50,z:50},fillColor:{red:255,green:0,blue:255,alpha:.6},strokeColor:{red:255,green:255,blue:255}}),o.addText({id:"title-text",type:c.TEXT,text:"PARALLAX",size:40,position:{x:50,y:100,z:0},font:{name:"Roboto",path:"/parallax/fonts/Roboto-Regular.ttf"},fillColor:{red:255,green:0,blue:255},strokeColor:{red:255,green:255,blue:255}})},s.draw=async()=>{a.paused&&!o.isPaused()?o.pause():!a.paused&&o.isPaused()&&o.resume(),s.background(15),await o.step(y)},o}const B=`import p5 from 'p5';
import {World} from "../../scene/world.ts";
import {P5GraphicProcessor} from "../../scene/p5/p5_graphic_processor.ts";
import {SceneClock} from "../../scene/scene_clock.ts";
import {P5AssetLoader, type P5Bundler} from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type ResolutionContext} from "../../scene/types.ts";
import {DEFAULT_SKETCH_CONFIG, type SketchConfig} from "../tutorial/sketch_config.ts";
import {WorldSettings} from "../../scene/world_settings.ts";
import {CenterOrbit} from "../../scene/presets.ts";

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
                path: '/parallax/fonts/Roboto-Regular.ttf'
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
`;async function O(s,a,y,d,p="",o={}){const u=document.getElementById("tutorial-root");if(!u)return;let r=document.getElementById(`step-${s}`);if(!r)r=z({containerId:s,title:a,source:d,explanation:p}),u.appendChild(r);else{const e=r.querySelector('[data-content="preview"]'),t=r.querySelector('[data-content="code"]'),n=r.querySelector('[data-content="learn"]');if(e){const l=e.querySelector(".step-anchor");l&&(l.innerHTML=`<span>${a}</span>`)}if(t){const l=t.querySelector(".step-anchor");l&&(l.innerHTML=`<div class="status-dot"></div><span>${a}</span>`);const P=t.querySelector(".editor-box code");P&&(P.innerHTML=m.highlight(d,m.languages.typescript,"typescript"))}if(n){const l=n.querySelector(".learn-content");l&&(l.innerHTML=p)}}const b=r.querySelector(".editor-box"),g=r.querySelector(".canvas-box"),E=r.querySelector(".console-panel"),L=r.querySelector(".play-btn"),w=r.querySelector(".reset-btn"),v=r.querySelector(".copy-btn"),i=r.querySelector(".pause-btn"),h={...x,...o,width:g?.clientWidth||500,height:g?.clientHeight||400,paused:!1};let{currentP5:f}=await k.createSketchInstance(y,h,g,s);const S=r.querySelectorAll(".tab-btn"),_=r.querySelectorAll(".step-content");S.forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-tab");S.forEach(n=>n.classList.remove("active")),e.classList.add("active"),_.forEach(n=>{n.getAttribute("data-content")===t?n.classList.add("active"):n.classList.remove("active")})})});const C=async()=>{E.style.display="block",E.innerHTML="";try{const{fn:e}=D(b.innerText);f=(await k.createSketchInstance(e,h,g,s)).currentP5,h.paused=!1,i.dataset.paused="false",i.innerHTML='<i class="fas fa-pause"></i>';const n=document.createElement("div");n.className="log-entry info",n.textContent="[Engine] Hydration successful.",E.appendChild(n)}catch(e){console.error("executeUpdate error:",e);const t=document.createElement("div");t.className="log-entry info",t.style.color="var(--error)",t.textContent=e instanceof Error?`Error: ${e.message}

Stack:
${e.stack}`:String(e),t.style.whiteSpace="pre-wrap",t.style.fontSize="11px",E.appendChild(t)}};L.addEventListener("click",C),w.addEventListener("click",()=>{const e=r.querySelector(".editor-box code");e&&(e.innerHTML=m.highlight(d,m.languages.typescript,"typescript")),C()}),v.addEventListener("click",()=>navigator.clipboard.writeText(b.innerText));const A=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>0&&window.innerWidth<769;r.querySelectorAll(".fullscreen-btn").forEach(e=>{if(A()){e.style.display="none";return}e.addEventListener("click",()=>{const t=r.querySelector(".canvas-box");t&&(document.fullscreenElement||document.webkitFullscreenElement?document.exitFullscreen?.()||document.webkitExitFullscreen?.():(t.requestFullscreen?.bind(t)||t.webkitRequestFullscreen?.bind(t))?.())})}),i.addEventListener("click",()=>{if(!f)return;i.dataset.paused==="true"?(f.loop(),h.paused=!1,i.dataset.paused="false",i.innerHTML='<i class="fas fa-pause"></i>'):(f.noLoop(),h.paused=!0,i.dataset.paused="true",i.innerHTML='<i class="fas fa-play"></i>')})}O("hero-demo-1","Hero Demo",H,B,W);
//# sourceMappingURL=main-BZ80akCt.js.map
