import{d as i,D as u,S as m,a as l,c as n,P as g,W as P,b as w,f as h,E as p}from"./colors-BrCD1jrD.js";const y=i("img/depth/skull.jpg"),T=i("img/depth/skull-depth.png"),b=i("fonts/Roboto-Regular.ttf"),E=`
<div class="concept">
<p><strong>Depth maps</strong> turn image brightness into geometry. A panel can use one image as its visible <code>texture</code> and a second image as its <code>depthMap</code>, so the rendered surface follows the depth implied by the artwork.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>Pair Texture and Depth</strong> - Add a visible <code>texture</code> and a matching <code>depthMap</code>. Both load through the same asset pipeline.</li>
<li><strong>Set Mesh Resolution</strong> - <code>segments</code> (inside the <code>depthMap</code> object) controls how finely the panel is subdivided. More segments reveal more image detail.</li>
<li><strong>Shape the Relief</strong> - <code>strength</code> controls Z displacement, while <code>midpoint</code> chooses which brightness value stays flat.</li>
<li><strong>Combine With Motion</strong> - Rotate the panel slowly so the raised and recessed areas are visible from different angles.</li>
</ol>

<h3>Key Terms</h3>
<div class="key-terms">
<span class="key-term">depthMap</span>
<span class="key-term">Height Field</span>
<span class="key-term">Mesh Segments</span>
<span class="key-term">Displacement</span>
</div>

<div class="related">
<h3>Related Tutorials</h3>
<a href="#tutorial-5">Loading Textures</a>
<a href="#tutorial-9">3D Parallax Depth</a>
</div>
`;async function f(s,t=u,r){let o;const c=t.clock??new m({...l,startPaused:t.paused,playback:{...l.playback,duration:7e3,isLoop:!0}}),a=new g(s);o=r?.graphicProcessor??new n(s,a);const e=new P(w.fromLibs({clock:c,loader:a}));return e.startLoading(),e.enableDefaultPerspective(t.width,t.height,Math.PI/4,!0),t.paused&&e.pause(),e.addPanel({type:p.PANEL,id:"skull-depth-panel",width:240,height:360,position:{x:0,y:-10,z:-120},rotate:d=>({pitch:-.12*Math.PI,yaw:-.3+Math.sin(d.playback.progress*Math.PI*2)*.6,roll:0}),depthMap:{sampleMode:"max",path:T,width:256,height:256,strength:150,segments:44,midpoint:0,invert:!1},texture:{path:y,width:512,height:512},strokeColor:h.white,strokeWidth:0}),e.addText({type:p.TEXT,id:"depth-map-label",text:"DEPTH MAP PANEL",size:22,position:{x:0,y:170,z:-80},font:{name:"Roboto",path:b},fillColor:h.cyan}),e.complete(),s.setup=async()=>{s.createCanvas(t.width,t.height,s.WEBGL),r?.graphicProcessor||(o=new n(s,a)),await a.waitForAllAssets()},s.draw=async()=>{t.paused&&!e.isPaused()?e.pause():!t.paused&&e.isPaused()&&e.resume(),s.background(8),(await e.step(o)).running},e}export{E as d,f as t};
//# sourceMappingURL=tutorial_depth_map-DyWdxFcf.js.map
