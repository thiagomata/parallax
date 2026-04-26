import{e as d,O as p,D as h,S as m,a as u,c,P as b,W as f,b as P,C as g,E as w}from"./colors-DVKk-YNe.js";Object.assign(window,{OrbitModifier:p,CenterFocusModifier:d});const y=`
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
`;async function k(s,a=h,n){let o;const l=a.clock??new m({...u,startPaused:a.paused}),i=new b(s);o=n?.graphicProcessor??new c(s,i);const e=new f(P.fromLibs({clock:l,loader:i}));return e.startLoading(),e.loadPreset(g(s,{radius:500})),e.enableDefaultPerspective(a.width,a.height),a.paused&&e.pause(),s.setup=()=>{s.createCanvas(a.width,a.height,s.WEBGL),n?.graphicProcessor||(o=new c(s,i));for(let r=0;r<5;r++)for(let t=0;t<5;t++)e.addBox({type:w.BOX,id:`box-${r}-${t}`,width:40,position:{x:(r-2)*100,y:0,z:200-t*100},fillColor:{red:r*50,green:255-r*50,blue:200}})},e.complete(),s.draw=async()=>{a.paused&&!e.isPaused()?e.pause():!a.paused&&e.isPaused()&&e.resume(),s.background(20),(await e.step(o)).running},e}export{y as c,k as t};
//# sourceMappingURL=tutorial_camera_control-CJ2TBhvF.js.map
