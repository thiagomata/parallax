import"../../tutorial-BXGzkH4k.js";import{E as C,C as Q,r as Me,u as Ie,m as _e,v as Ae,g as Re,D as Ne,S as je,a as le,W as Ue,H as He,h as ce,P as ze,b as Ge,c as We,e as de,l as he}from"../../tutorial.template-ahFItfn2.js";import{V as Fe,c as $e}from"../../tutorial_observer-DTMziWvZ.js";import{r as Be}from"../../showcase_step-BWu14-sK.js";const Ve={leftEyeOpen:1,rightEyeOpen:1,mouthOpen:0,happy:0,sad:0,angry:0,surprised:0,sleepy:0};function we(e,t=e.sleepy){let n="neutral",l=Ae;for(const s of _e){const g=s==="sleepy"?t:e[s];g>=l&&(n=s,l=g)}return n}function Xe(e,t){if(!e)return Ve;const n=t??e.sleepy,l=we(e,n),s=g=>l!==g?0:g==="sleepy"?n:e[g];return{leftEyeOpen:e.leftEyeOpen,rightEyeOpen:e.rightEyeOpen,mouthOpen:Math.max(e.mouthOpen,e.lipsApart),happy:s("happy"),sad:s("sad"),angry:s("angry"),surprised:s("surprised"),sleepy:s("sleepy")}}const H={rx:150,ry:170,rz:125};function j(e,t){return H.rz*Math.sqrt(Math.max(0,1-(e/H.rx)**2-(t/H.ry)**2))}function me(e){const t=Math.max(0,Math.min(1,(e.angry-.3)/.6)),n=(l,s)=>Math.round(l+(s-l)*t);return{red:n(255,235),green:n(204,80),blue:n(77,55)}}function Z(e,t){return{rx:16+6*t,ry:Math.max(1.5,26*e*(1+.4*t))}}function pe(e,t){const n=.45*e.angry-.4*e.sad;return{y:-80-30*e.surprised-8*e.sad+12*e.angry,roll:t==="left"?n:-n}}const ee=15,Ye=.8;function v(e){const t=e.mouthOpen,n=t>.3&&e.happy>=Ye,l=!n&&t>.3&&e.happy<Math.max(e.surprised,e.angry,.35),s=n?30+30*t:8+70*t+30*e.surprised-4*e.angry;return{mode:n?"grin":l?"oval":"curve",width:Math.max(30,80+50*e.happy+30*e.angry-40*e.surprised-30*e.sleepy),curve:26*e.happy-18*e.sad,thickness:8+18*e.happy*t,height:s,teeth:n?s*.3:l&&e.angry>0?s*.35:0}}function J(e,t){const n=e.width/2,l=-1+2*t/(ee-1),s=l*n,g=-2*e.curve*l/n;return{x:s,y:e.curve*(1-l*l),roll:Math.atan(g),rx:Math.max(e.width/(ee-1)*Math.hypot(1,g)*.8,e.thickness*.8)}}function U(e){const t=Math.max(.01,e*.2);return[{x:0,y:-e/2,width:e,height:t,roll:0},{x:0,y:0,width:e*Math.SQRT2,height:t,roll:-Math.PI/4},{x:0,y:e/2,width:e,height:t,roll:0}].map(n=>e>0?n:{...n,width:.01,height:.01})}function W(e){return e.sad>.5?6+16*(e.sad-.5):0}const ue={red:70,green:40,blue:20},ge={red:110,green:40,blue:20};function qe(e,t){const n=t.shapeOf;e.addElliptical({type:C.ELLIPTICAL,id:"head",parentId:t.parentId,...H,position:t.position,rotate:t.rotate,fillColor:a=>me(n(a)),strokeWidth:0});for(const a of["left","right"]){const u=50*(a==="left"?-1:1),k=-30,I=f=>a==="left"?f.leftEyeOpen:f.rightEyeOpen;e.addElliptical({type:C.ELLIPTICAL,id:`${a}-eye`,parentId:"head",rx:f=>{const y=n(f);return Z(I(y),y.surprised).rx},ry:f=>{const y=n(f);return Z(I(y),y.surprised).ry},rz:8,position:{x:u,y:k,z:j(u,k)+4},fillColor:ue,strokeWidth:0}),e.addSphere({type:C.SPHERE,id:`${a}-eye-shine`,parentId:`${a}-eye`,radius:f=>5*I(n(f)),position:f=>{const y=n(f);return{x:-5,y:-Z(I(y),y.surprised).ry*.4,z:5}},fillColor:Q.white,strokeWidth:0}),e.addBox({type:C.BOX,id:`${a}-brow`,parentId:"head",width:50,height:10,depth:6,position:f=>{const y=pe(n(f),a).y;return{x:u,y,z:j(u,y)+6}},rotate:f=>({yaw:0,pitch:0,roll:pe(n(f),a).roll}),fillColor:ue,strokeWidth:0})}const l=70,s=.01,g=j(0,l)+4;e.addElliptical({type:C.ELLIPTICAL,id:"mouth",parentId:"head",rx:a=>{const c=v(n(a));return c.mode==="curve"?s:c.width/2},ry:a=>{const c=v(n(a));return c.mode==="curve"?s:c.mode==="grin"?c.height:c.height/2},rz:10,position:{x:0,y:l,z:g},fillColor:ge,strokeWidth:0}),e.addElliptical({type:C.ELLIPTICAL,id:"teeth",parentId:"head",rx:a=>{const c=v(n(a));return c.teeth>0?c.width*(c.mode==="grin"?.4:.36):s},ry:a=>Math.max(s,v(n(a)).teeth/2),rz:4,position:a=>{const c=v(n(a));return{x:0,y:c.mode==="grin"?l+c.teeth/4:l-c.height/2+c.teeth/2+4,z:g+10}},fillColor:Q.white,strokeWidth:0}),e.addBox({type:C.BOX,id:"grin-cover",parentId:"head",width:a=>{const c=v(n(a));return c.mode==="grin"?c.width+12:s},height:a=>{const c=v(n(a));return c.mode==="grin"?c.height+4:s},depth:2,position:a=>({x:0,y:l-(v(n(a)).height+4)/2,z:g+16}),fillColor:a=>me(n(a)),strokeWidth:0});for(let a=0;a<ee;a++)e.addElliptical({type:C.ELLIPTICAL,id:`mouth-curve-${a}`,parentId:"head",rx:c=>{const u=v(n(c));return u.mode==="curve"?J(u,a).rx:s},ry:c=>{const u=v(n(c));return u.mode==="curve"?u.thickness/2:s},rz:6,position:c=>{const u=J(v(n(c)),a),k=l+u.y;return{x:u.x,y:k,z:j(u.x,k)+6}},rotate:c=>({yaw:0,pitch:0,roll:J(v(n(c)),a).roll}),fillColor:ge,strokeWidth:0});[{x:120,y:-130,size:28},{x:160,y:-185,size:40}].forEach((a,c)=>{for(let u=0;u<3;u++)e.addBox({type:C.BOX,id:`sleepy-z-${c}-${u}`,parentId:"head",width:k=>U(n(k).sleepy>0?a.size:0)[u].width,height:k=>U(n(k).sleepy>0?a.size:0)[u].height,depth:4,position:{x:a.x+U(a.size)[u].x,y:a.y+U(a.size)[u].y,z:H.rz*.6},rotate:{yaw:0,pitch:0,roll:U(a.size)[u].roll},fillColor:{red:70,green:110,blue:200},strokeWidth:0})});const T=58,N=8;e.addElliptical({type:C.ELLIPTICAL,id:"tear",parentId:"head",rx:a=>Math.max(s,W(n(a))),ry:a=>Math.max(s,W(n(a))*1.4),rz:a=>Math.max(s,W(n(a))),position:a=>({x:T,y:N,z:j(T,N)+W(n(a))+6}),fillColor:{red:90,green:180,blue:255},strokeWidth:0})}class F{static CALIBRATION_FRAMES=20;static SLEEPY_SECONDS=.8;calibration=null;calibrationFrames=null;lastRaw=null;lastCalibrated=null;smoothedSleepy=0;lastSleepyFrame=null;lastSleepyTime=null;startCalibration(){this.calibrationFrames=[]}get status(){return this.calibration?"calibrated (N: again)":this.calibrationFrames?"calibrating: relax...":"N: calibrate, relaxed"}get sleepy(){return this.smoothedSleepy}update(t,n=performance.now()){const l=t?.faceExpressions;this.calibrationFrames&&l&&!this.calibrationFrames.includes(l)&&(this.calibrationFrames.push(l),this.calibrationFrames.length>=F.CALIBRATION_FRAMES&&(this.calibration=Me(Ie.average(this.calibrationFrames)),this.calibrationFrames=null,this.lastRaw=null));const s=this.expressionsOf(t);if(!s||s===this.lastSleepyFrame)return;this.lastSleepyFrame=s;const g=this.lastSleepyTime===null?0:(n-this.lastSleepyTime)/1e3;this.lastSleepyTime=n,this.smoothedSleepy+=(s.sleepy-this.smoothedSleepy)*(1-Math.exp(-g/F.SLEEPY_SECONDS))}expressionsOf(t){const n=t?.faceExpressions;return n?this.calibration?(n!==this.lastRaw&&(this.lastRaw=n,this.lastCalibrated=n.withRanges(this.calibration).normalize()),this.lastCalibrated):t.expressions:null}shapeOf(t){return Xe(this.expressionsOf(t),this.smoothedSleepy)}emotionOf(t){const n=this.expressionsOf(t);return n?we(n,this.smoothedSleepy):"neutral"}}const Ke=Re("video/heads.mp4"),Ze=["webCam","video"],Je=`
<div class="concept">
<p>A game built on the face expressions of tutorial 11. Every round shows an emoji - make that face and hold it for half a second to score. A round lasts ten seconds, a missed one costs one of your three lives, and the whole game lasts at most a minute and a half. Your webcam is on the left, and on the right the emoji face copies yours, so you can see what the game sees.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>The face cam</strong> - the webcam panel shows the whole camera frame, kept in the camera's own aspect so nothing is cut off.</li>
<li><strong>The face</strong> - <code>addEmojiFace</code> (<code>emoji_face.ts</code>) draws the emoji, here beside the webcam, turning with your head and leaning with it too.</li>
<li><strong>Reading the expressions</strong> - <code>ExpressionReader</code> (<code>emoji_face.ts</code>) calibrates on <kbd>N</kbd> and smooths sleepy over time, so a blink is not a nap.</li>
<li><strong>Matching</strong> - <code>matchesTarget</code> checks the face against the round's emoji: the strongest emotion for 😢 😠 😮 😴, a smile that is not the open grin for 🙂, the open grin for 😃, one eye closed for 😉.</li>
<li><strong>The rounds</strong> - <code>EmotionGame</code> keeps the score, the lives, the target and the clock: hold the face for <code>HOLD_SECONDS</code> to score; a round that runs out after <code>ROUND_SECONDS</code> costs one of the <code>LIVES</code>. The game is over with none left, or after <code>GAME_SECONDS</code> however well it goes (<kbd>R</kbd> or space plays again).</li>
<li><strong>The pictures</strong> - every round ends with a snapshot of the canvas, you and your emoji side by side, stamped with the target and ✅ / ❌. At the end they show together, and <em>Save picture</em> puts them in one collage (<code>collageLayout</code>). <em>Share</em> opens the system share sheet with the collage attached where the browser has one; otherwise it copies the collage and opens a post on X (<code>postIntentUrl</code>) to paste it into. They stay on your device until you share them.</li>
<li><strong>The parade</strong> - a match sends its emoji flying across behind the scene: plain page emoji under the canvas, which is cleared transparent, so the 3D face and the webcam pass in front of them.</li>
</ol>

<p>Angry is the hard one: press <kbd>N</kbd> with a relaxed face first, so the game counts from your own face.</p>

<div class="related">
<h3>Related Tutorials</h3>
<a href="../../tutorial/tutorial-11/index.html">Tutorial 11: Facial Expressions</a>
</div>
`,Qe=[{id:"smile",emoji:"🙂",label:"Smile (lips closed)"},{id:"grin",emoji:"😃",label:"Big open grin"},{id:"wink",emoji:"😉",label:"Wink"},{id:"sad",emoji:"😢",label:"Sad"},{id:"angry",emoji:"😠",label:"Angry"},{id:"surprised",emoji:"😮",label:"Surprised"},{id:"sleepy",emoji:"😴",label:"Sleepy"}];function et(e,t){switch(e){case"smile":return t.happy>0&&v(t).mode!=="grin";case"grin":return v(t).mode==="grin";case"wink":{const[n,l]=[Math.min(t.leftEyeOpen,t.rightEyeOpen),Math.max(t.leftEyeOpen,t.rightEyeOpen)];return n<.3&&l>.6}default:return t[e]>0}}const fe=1/4,ye=120;function tt(e,t){if(!e)return t;const n=l=>Math.max(-ye,Math.min(ye,l));return{x:t.x+n(e.worldPosition.x*fe),y:t.y+n(e.worldPosition.y*fe*(9/16)),z:t.z}}class L{static ROUND_SECONDS=10;static GAME_SECONDS=90;static LIVES=3;static HOLD_SECONDS=.5;static CELEBRATE_SECONDS=1;score=0;lives=L.LIVES;timeUp=!1;target;gameStart;roundStart;holdStart=null;celebrateUntil=null;random;constructor(t,n=Math.random){this.random=n,this.target=this.pickTarget(null),this.gameStart=t,this.roundStart=t}get over(){return this.lives<=0||this.timeUp}gameSecondsLeft(t){return Math.max(0,L.GAME_SECONDS-(t-this.gameStart))}restart(t){this.score=0,this.lives=L.LIVES,this.timeUp=!1,this.gameStart=t,this.celebrateUntil=null,this.nextRound(t)}secondsLeft(t){return Math.max(0,L.ROUND_SECONDS-(t-this.roundStart))}celebrating(t){return this.celebrateUntil!==null&&t<this.celebrateUntil}holdProgress(t){return this.holdStart===null?0:Math.min(1,(t-this.holdStart)/L.HOLD_SECONDS)}update(t,n){if(this.over)return null;if(this.gameSecondsLeft(t)<=0)return this.timeUp=!0,this.celebrateUntil=null,"time-up";if(this.celebrateUntil!==null)return t<this.celebrateUntil||(this.celebrateUntil=null,this.nextRound(t)),null;if(n){if(this.holdStart??=t,t-this.holdStart>=L.HOLD_SECONDS)return this.score++,this.holdStart=null,this.celebrateUntil=t+L.CELEBRATE_SECONDS,"scored"}else this.holdStart=null;return this.secondsLeft(t)<=0?(this.lives--,this.over||this.nextRound(t),"timeout"):null}nextRound(t){this.target=this.pickTarget(this.target),this.roundStart=t,this.holdStart=null}pickTarget(t){const n=Qe.filter(l=>l!==t);return n[Math.min(n.length-1,Math.floor(this.random()*n.length))]}}const be=[{offset:0,color:"#2e1a5c"},{offset:.55,color:"#9b3d8f"},{offset:1,color:"#f28c6b"}];function nt(){return`linear-gradient(180deg, ${be.map(e=>`${e.color} ${e.offset*100}%`).join(", ")})`}function at(e,t,n=3,l=70){const s=Math.max(1,Math.min(n,e)),g=Math.max(1,Math.ceil(e/s)),T=8;return{width:s*t.width+(s+1)*T,height:l+g*t.height+(g+1)*T,cells:Array.from({length:e},(N,a)=>({x:T+a%s*(t.width+T),y:l+T+Math.floor(a/s)*(t.height+T)}))}}function ot(e,t){return`I scored ${e} in the Emotion Game 😃 Make the faces, your emoji copies you: ${t}`}function rt(e){return`https://x.com/intent/tweet?text=${encodeURIComponent(e)}`}async function it(e,t=Ne,n){const l=t.clock??new je({...le,startPaused:t.paused,debug:!1,playback:{...le.playback,duration:1e5,isLoop:!0}}),s=1920,g=1080,T=1/4,N=T*s,a={x:0,y:0,z:0},c={x:0,y:0,z:1500},u=300,k={...n?.faceConfig??{},videoWidthPixels:s,videoHeightPixels:g,mirror:!1,baseline:a,cameraPosition:c,baselineHeadPixels:N,baselineHeadSceneUnits:u,sceneScreenWidth:u/T,depthScale:1},I=n?.webCamProvider??new Ue(e,s,g),f=new Fe(e,Ke,{loop:!0,autoplay:!0,muted:!0,playsInline:!0}),y=f.video,z=n?.faceDataProvider??new He(e,k,Ze),$=new ze(e);let B=n?.graphicProcessor??new ce(e,$);const xe={webCam:I,video:f,headTracker:z},w=new Ge(We.fromLibs({clock:l,loader:$,dataProviderLib:xe}));w.setScreen({id:"screen",type:he.SCREEN,position:c,direction:{x:0,y:0,z:1},lookMode:de.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),w.setEye({id:"eye",type:he.EYE,parentId:"screen",position:{x:0,y:0,z:10},direction:{x:0,y:0,z:-1},lookMode:de.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),w.enableDefaultPerspective(t.width,t.height,50*Math.PI/180),w.startLoading(),t.paused&&w.pause();const te={width:600,height:750},ne=440;w.addBox({type:C.BOX,id:"bigBox",width:1,position:{x:0,y:0,z:0}});const _=new F;let V=null;const ve={x:ne*.95,y:0,z:300};qe(w,{parentId:"bigBox",position:i=>tt(i.dataProviders.headTracker,ve),rotate:i=>{const o=i.dataProviders.headTracker;return _.update(o),V=o?_.shapeOf(o):null,o?{yaw:o.stick.yaw,pitch:o.stick.pitch,roll:o.stick.roll}:{pitch:0,yaw:0,roll:0}},shapeOf:i=>_.shapeOf(i.dataProviders.headTracker)});let h=null,E;const Ee=i=>{if(!E||!h)return;const o=h.celebrating(i),r=(d,p)=>{d.textContent!==p&&(d.textContent=p)},m="❤️".repeat(Math.max(0,h.lives))+"🤍".repeat(L.LIVES-Math.max(0,h.lives));if(r(E.score,`Score ${h.score}   ${m}   ⏱ ${Math.ceil(h.gameSecondsLeft(i))}s`),h.over){r(E.target,h.timeUp?"⏱":"🏁"),r(E.label,`${h.timeUp?"Time's up":"Game over"} - score ${h.score}`),r(E.time,"R or space: play again"),r(E.status,_.status),E.target.style.transform="";return}r(E.target,o?"✓":h.target.emoji),r(E.label,o?"Nice!":h.target.label),r(E.time,o?"":`${Math.ceil(h.secondsLeft(i))}s${h.holdProgress(i)>0?"  hold...":""}`),r(E.status,_.status),E.target.style.transform=`scale(${1+.3*h.holdProgress(i)})`};let M;const Se=16,Te=i=>{if(M)for(let o=0;o<Se;o++){const r=document.createElement("span");r.textContent=i;const m=1.6+Math.random()*1.2;r.style.cssText=`position:absolute;left:0;top:${8+Math.random()*80}%;font-size:${32+Math.random()*48}px;animation:emotion-game-parade ${m}s linear ${Math.random()*.9}s both`,r.addEventListener("animationend",()=>r.remove()),M.appendChild(r)}},ae=480,X={top:.21,bottom:.8};let A=[],b,O;const Pe=(i,o)=>{if(!b||!b.width)return null;const r=b.height*X.top,m=b.height*(X.bottom-X.top),d=document.createElement("canvas");d.width=ae,d.height=Math.round(ae*m/b.width);const p=d.getContext("2d");if(!p)return null;const S=d.width/b.width,x=p.createLinearGradient(0,-r*S,0,(b.height-r)*S);return be.forEach(P=>x.addColorStop(P.offset,P.color)),p.fillStyle=x,p.fillRect(0,0,d.width,d.height),p.drawImage(b,0,r,b.width,m,0,0,d.width,d.height),p.font="44px system-ui, sans-serif",p.textBaseline="top",p.fillText(i.emoji,10,8),p.fillText(o?"✅":"❌",d.width-52,8),d},Ce=(i,o)=>{const r=Pe(i,o);r&&A.push({image:r.toDataURL("image/jpeg",.85),target:i,scored:o})},oe=async()=>{if(!A.length||!h)return null;const o=(await Promise.all(A.map(p=>new Promise(S=>{const x=new Image;x.onload=()=>S(x),x.onerror=()=>S(null),x.src=p.image})))).filter(p=>p!==null);if(!o.length)return null;const r=at(o.length,{width:o[0].width,height:o[0].height}),m=document.createElement("canvas");m.width=r.width,m.height=r.height;const d=m.getContext("2d");return d?(d.fillStyle="#0a0a0a",d.fillRect(0,0,m.width,m.height),d.fillStyle="#fff",d.font="700 30px system-ui, sans-serif",d.textBaseline="middle",d.fillText(`😃 Emotion Game - score ${h.score}`,16,36),o.forEach((p,S)=>d.drawImage(p,r.cells[S].x,r.cells[S].y)),m):null},ke=async()=>{const i=await oe();if(!i||!h)return;const o=document.createElement("a");o.download=`emotion-game-${h.score}.jpg`,o.href=i.toDataURL("image/jpeg",.9),o.click()},re=(i,o)=>new Promise(r=>i.toBlob(r,o,.9));let D=null;const Oe=async()=>{D=null;const i=await oe();if(!i||!h)return;const[o,r]=await Promise.all([re(i,"image/jpeg"),re(i,"image/png")]);!o||!r||(D={text:ot(h.score,location.href),file:new File([o],`emotion-game-${h.score}.jpg`,{type:"image/jpeg"}),png:r,jpegUrl:i.toDataURL("image/jpeg",.9)})},Y=()=>{if(!D||!h)return;const i=document.createElement("a");i.download=D.file.name,i.href=D.jpegUrl,i.click()},Le=i=>{if(!D){i("The picture is still being made - try again in a moment.");return}const{text:o,file:r,png:m}=D;let d=!1;try{d=!!navigator.canShare?.({files:[r]})}catch{d=!1}if(d){const x=()=>{Y(),i("Sharing did not open - the picture is saved, attach it to your post.")};try{navigator.share({files:[r],text:o}).catch(P=>{if(P.name==="AbortError"){i("Share cancelled.");return}x()})}catch{x()}return}const p=window.open(rt(o),"_blank"),S=()=>{Y(),i(p?"Picture saved - attach it to the post.":"Picture saved - allow pop-ups to open the post.")};try{navigator.clipboard.write([new ClipboardItem({"image/png":m})]).then(()=>i(p?"Picture copied - paste it into the post (Ctrl / Cmd + V).":"Picture copied - allow pop-ups to open the post, or paste it into a new post on X.")).catch(S)}catch{S()}};let q=0;const De=async()=>{if(!O||!h)return;const i=++q;if(await Oe(),i!==q||!O||!h)return;O.innerHTML="";const o=document.createElement("div");o.textContent=`${h.timeUp?"⏱ Time's up":"🏁 Game over"} - score ${h.score}`,o.style.cssText="font-size:24px;margin-bottom:10px";const r=document.createElement("div");r.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;width:100%";for(const P of A){const R=document.createElement("img");R.src=P.image,R.alt=`${P.target.label}: ${P.scored?"made it":"missed"}`,R.style.cssText="width:100%;border-radius:6px",r.appendChild(R)}const m=document.createElement("div");m.style.cssText="display:flex;gap:10px;margin-top:12px";const d=(P,R)=>{const G=document.createElement("button");G.textContent=P,G.style.cssText="font:700 15px system-ui,sans-serif;padding:8px 16px;border:0;border-radius:6px;cursor:pointer;background:#38bdf8;color:#0f172a",G.addEventListener("click",R),m.appendChild(G)},p=document.createElement("div");p.style.cssText="font-size:14px;margin-top:8px;min-height:1.3em";const S=P=>{p.textContent=P};A.length&&(d("📤 Share",()=>Le(S)),d("📸 Save picture",()=>{D?Y():ke()})),d("▶ Play again (R)",()=>ie());const x=document.createElement("div");x.textContent="The pictures stay on this device until you share them - nothing is uploaded.",x.style.cssText="font-size:12px;opacity:0.7;margin-top:4px",O.append(o,r,m,p,x),O.style.display="flex"},ie=()=>{h&&(A=[],q++,D=null,O&&(O.style.display="none"),h.restart(performance.now()/1e3))};e.setup=()=>{const i=e.createCanvas(t.width,t.height,e.WEBGL);e.setAttributes?.("preserveDrawingBuffer",!0),B=n?.graphicProcessor??new ce(e,$),b=i?.elt;const o=b?.parentElement;if(o&&b){if(o.querySelector(".emotion-game-parade")?.remove(),o.querySelector(".emotion-game-gallery")?.remove(),O=document.createElement("div"),O.className="emotion-game-gallery",O.style.cssText="position:absolute;inset:0;z-index:3;display:none;flex-direction:column;align-items:center;overflow:auto;padding:16px;background:rgba(10,10,10,0.92);color:#fff;font:700 16px/1.3 system-ui,sans-serif;box-sizing:border-box",o.appendChild(O),!document.getElementById("emotion-game-parade-style")){const d=document.createElement("style");d.id="emotion-game-parade-style",d.textContent="@keyframes emotion-game-parade { from { transform: translateX(-120px) } to { transform: translateX(var(--parade-width, 1200px)) } }",document.head.appendChild(d)}M=document.createElement("div"),M.className="emotion-game-parade",M.style.cssText=`position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:${nt()}`,M.style.setProperty("--parade-width",`${o.clientWidth+120}px`),o.insertBefore(M,b),b.style.position="relative",b.style.zIndex="1",o.querySelector(".emotion-game-hud")?.remove();const r=document.createElement("div");r.className="emotion-game-hud",r.style.cssText="position:absolute;top:8px;left:0;right:0;z-index:2;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;color:#fff;font:700 18px/1.2 system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,0.8)";const m=d=>{const p=document.createElement("div");return p.style.cssText=d,r.appendChild(p),p};E={root:r,score:m("font-size:22px"),target:m("font-size:72px;line-height:1.1;transition:transform 0.1s"),label:m("font-size:16px"),time:m("font-size:14px;opacity:0.85"),status:m("font-size:12px;opacity:0.7")},o.appendChild(r)}},e.keyPressed=()=>{(e.key==="n"||e.key==="N")&&_.startCalibration(),h?.over&&(e.key==="r"||e.key==="R"||e.key===" ")&&ie()};let se=!1,K=!1;return e.draw=async()=>{if(!K){K=!0;try{if(!B)return;if(!se){typeof z.setFallbackCapture=="function"&&z.setFallbackCapture(y),await z.init(),w.complete(),w.addPanel({type:C.PANEL,parentId:"bigBox",id:"videoPanel",width:te.width,height:te.height,mirrorTextureHorizontal:!0,position:{x:-ne,y:0,z:0},video:$e(y),fillColor:Q.white}),se=!0,h=new L(performance.now()/1e3);return}if(t.paused&&!w.isPaused()){w.pause(),y.pause();return}else!t.paused&&w.isPaused()&&(w.resume(),y.loop());e.clear();const i=await w.step(B),o=performance.now()/1e3,r=h?.target,m=h?.update(o,V!==null&&et(h.target.id,V));if((m==="scored"||m==="timeout")&&r&&Ce(r,m==="scored"),m==="scored"&&r&&Te(r.emoji),m&&h?.over&&De(),Ee(o),!i.running)return}finally{K=!1}}},w}const st=`import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import {
    HeadTrackingDataProvider,
    type HeadTrackingDataProviderConfig,
    type ObserverDataProviderLib
} from "../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../scene/providers/web_cam_data_provider.ts";
import type { VideoPixels } from "../../scene/types.ts";
import { VideoDataProvider } from "../../scene/providers/video_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES, LOOK_MODES, PROJECTION_TYPES,
    type ResolutionContext,
    type SceneUnits,
} from "../../scene/types.ts";
import {
    DEFAULT_SKETCH_CONFIG,
    type SketchConfig
} from "../tutorial/sketch_config.ts";
import type { FaceConfig } from "../tutorial/sketch_engine.types.ts";
import {WorldSettings} from "../../scene/world_settings.ts";
import {COLORS} from "../../scene/colors.ts";
import {appAssetPath} from "../../utils/app_paths.ts";
import {createVideoSelector} from "../tutorial/tutorial-8/tutorial_observer.ts";
import {
    addEmojiFace, ExpressionReader, mouthPose, type FaceShape,
} from "./emoji_face.ts";
import type { Emotion } from "../../scene/drivers/mediapipe/face_expressions.ts";

const FALLBACK_VIDEO_URL = appAssetPath("video/heads.mp4");
const VIDEO_SOURCE_ORDER = ["webCam", "video"] as const;

/**
 * SHOWROOM: Emotion Game
 *
 * Make the face the game asks for: your webcam on the left, your emoji on the right.
 */
export const emotionGameExplanation = \`
<div class="concept">
<p>A game built on the face expressions of tutorial 11. Every round shows an emoji - make that face and hold it for half a second to score. A round lasts ten seconds, a missed one costs one of your three lives, and the whole game lasts at most a minute and a half. Your webcam is on the left, and on the right the emoji face copies yours, so you can see what the game sees.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>The face cam</strong> - the webcam panel shows the whole camera frame, kept in the camera's own aspect so nothing is cut off.</li>
<li><strong>The face</strong> - <code>addEmojiFace</code> (<code>emoji_face.ts</code>) draws the emoji, here beside the webcam, turning with your head and leaning with it too.</li>
<li><strong>Reading the expressions</strong> - <code>ExpressionReader</code> (<code>emoji_face.ts</code>) calibrates on <kbd>N</kbd> and smooths sleepy over time, so a blink is not a nap.</li>
<li><strong>Matching</strong> - <code>matchesTarget</code> checks the face against the round's emoji: the strongest emotion for 😢 😠 😮 😴, a smile that is not the open grin for 🙂, the open grin for 😃, one eye closed for 😉.</li>
<li><strong>The rounds</strong> - <code>EmotionGame</code> keeps the score, the lives, the target and the clock: hold the face for <code>HOLD_SECONDS</code> to score; a round that runs out after <code>ROUND_SECONDS</code> costs one of the <code>LIVES</code>. The game is over with none left, or after <code>GAME_SECONDS</code> however well it goes (<kbd>R</kbd> or space plays again).</li>
<li><strong>The pictures</strong> - every round ends with a snapshot of the canvas, you and your emoji side by side, stamped with the target and ✅ / ❌. At the end they show together, and <em>Save picture</em> puts them in one collage (<code>collageLayout</code>). <em>Share</em> opens the system share sheet with the collage attached where the browser has one; otherwise it copies the collage and opens a post on X (<code>postIntentUrl</code>) to paste it into. They stay on your device until you share them.</li>
<li><strong>The parade</strong> - a match sends its emoji flying across behind the scene: plain page emoji under the canvas, which is cleared transparent, so the 3D face and the webcam pass in front of them.</li>
</ol>

<p>Angry is the hard one: press <kbd>N</kbd> with a relaxed face first, so the game counts from your own face.</p>

<div class="related">
<h3>Related Tutorials</h3>
<a href="../../tutorial/tutorial-11/index.html">Tutorial 11: Facial Expressions</a>
</div>
\`;

export type GameTargetId = 'smile' | 'grin' | 'wink' | Exclude<Emotion, 'happy'>;

export interface GameTarget {
    readonly id: GameTargetId;
    readonly emoji: string;
    readonly label: string;
}

export const GAME_TARGETS: readonly GameTarget[] = [
    { id: 'smile', emoji: '🙂', label: 'Smile (lips closed)' },
    { id: 'grin', emoji: '😃', label: 'Big open grin' },
    { id: 'wink', emoji: '😉', label: 'Wink' },
    { id: 'sad', emoji: '😢', label: 'Sad' },
    { id: 'angry', emoji: '😠', label: 'Angry' },
    { id: 'surprised', emoji: '😮', label: 'Surprised' },
    { id: 'sleepy', emoji: '😴', label: 'Sleepy' },
];

/** Whether the face shows the target: the shape the emoji face draws, so what you see is what counts. */
export function matchesTarget(target: GameTargetId, shape: FaceShape): boolean {
    switch (target) {
        // A smile that is not the open grin: 🙂 and 😃 are two different faces to make.
        case 'smile': return shape.happy > 0 && mouthPose(shape).mode !== 'grin';
        case 'grin': return mouthPose(shape).mode === 'grin';
        case 'wink': {
            const [closed, open] = [Math.min(shape.leftEyeOpen, shape.rightEyeOpen), Math.max(shape.leftEyeOpen, shape.rightEyeOpen)];
            return closed < 0.3 && open > 0.6;
        }
        default: return shape[target] > 0;
    }
}

/** How much of the face's movement the emoji follows: a quarter of the frame's width. */
const FOLLOW = 1 / 4;
/** How far the emoji may go from its place, so it stays on the screen. */
const FOLLOW_LIMIT = 120;

/**
 * Where the emoji sits: beside the webcam, but leaning with the head, the way the head box
 * follows the face in tutorial 11. The face's place in the frame (its offset from the middle)
 * moves it - a fraction at a time, and never off the screen.
 */
export function emojiFollowPosition(
    face: { worldPosition: { x: number; y: number; z: number } } | null | undefined,
    home: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
    if (!face) return home;
    const cap = (value: number) => Math.max(-FOLLOW_LIMIT, Math.min(FOLLOW_LIMIT, value));
    return {
        x: home.x + cap(face.worldPosition.x * FOLLOW),
        // The face's height is measured in frame widths, and the frame is 16:9.
        y: home.y + cap(face.worldPosition.y * FOLLOW * (9 / 16)),
        z: home.z,
    };
}

/**
 * The game: a target per round, the score, the lives and the clocks (seconds, from update's now).
 * Hold the target for HOLD_SECONDS to score; a round that runs out (ROUND_SECONDS) costs a life.
 * The game is over with no lives left, or after GAME_SECONDS however well it goes (restart plays again).
 */
export class EmotionGame {
    static readonly ROUND_SECONDS = 10;
    static readonly GAME_SECONDS = 90;
    static readonly LIVES = 3;
    static readonly HOLD_SECONDS = 0.5;
    /** How long the ✓ shows before the next round. */
    static readonly CELEBRATE_SECONDS = 1;

    score = 0;
    lives = EmotionGame.LIVES;
    /** Whether the game ended because its time ran out (rather than the lives). */
    timeUp = false;
    target: GameTarget;
    private gameStart: number;
    private roundStart: number;
    private holdStart: number | null = null;
    private celebrateUntil: number | null = null;

    private readonly random: () => number;

    constructor(now: number, random: () => number = Math.random) {
        this.random = random;
        this.target = this.pickTarget(null);
        this.gameStart = now;
        this.roundStart = now;
    }

    /** Whether the game is over: no lives left, or its time ran out. */
    public get over(): boolean {
        return this.lives <= 0 || this.timeUp;
    }

    /** Seconds left in this game. */
    public gameSecondsLeft(now: number): number {
        return Math.max(0, EmotionGame.GAME_SECONDS - (now - this.gameStart));
    }

    /** A new game: score 0, all the lives, the full time, a new target. */
    public restart(now: number): void {
        this.score = 0;
        this.lives = EmotionGame.LIVES;
        this.timeUp = false;
        this.gameStart = now;
        this.celebrateUntil = null;
        this.nextRound(now);
    }

    /** Seconds left in this round. */
    public secondsLeft(now: number): number {
        return Math.max(0, EmotionGame.ROUND_SECONDS - (now - this.roundStart));
    }

    /** Whether the ✓ for a scored round is showing. */
    public celebrating(now: number): boolean {
        return this.celebrateUntil !== null && now < this.celebrateUntil;
    }

    /** How far the current hold is, 0..1 (1 scores). */
    public holdProgress(now: number): number {
        return this.holdStart === null ? 0 : Math.min(1, (now - this.holdStart) / EmotionGame.HOLD_SECONDS);
    }

    /**
     * Advances the game to now with whether the face matches the target.
     * @returns 'scored', 'timeout' (a life lost; a new round, or the game over), 'time-up' (the
     *     game's time ran out: it is over) or null
     */
    public update(now: number, matching: boolean): 'scored' | 'timeout' | 'time-up' | null {
        if (this.over) return null;
        if (this.gameSecondsLeft(now) <= 0) {
            this.timeUp = true;
            this.celebrateUntil = null;
            return 'time-up';
        }
        if (this.celebrateUntil !== null) {
            if (now < this.celebrateUntil) return null;
            this.celebrateUntil = null;
            this.nextRound(now);
            return null;
        }
        if (matching) {
            this.holdStart ??= now;
            if (now - this.holdStart >= EmotionGame.HOLD_SECONDS) {
                this.score++;
                this.holdStart = null;
                this.celebrateUntil = now + EmotionGame.CELEBRATE_SECONDS;
                return 'scored';
            }
        } else {
            this.holdStart = null;
        }
        if (this.secondsLeft(now) <= 0) {
            this.lives--;
            if (!this.over) this.nextRound(now);
            return 'timeout';
        }
        return null;
    }

    private nextRound(now: number): void {
        this.target = this.pickTarget(this.target);
        this.roundStart = now;
        this.holdStart = null;
    }

    /** A random target, never the same twice in a row. */
    private pickTarget(previous: GameTarget | null): GameTarget {
        const choices = GAME_TARGETS.filter(target => target !== previous);
        return choices[Math.min(choices.length - 1, Math.floor(this.random() * choices.length))];
    }
}

/** The game's background, top to bottom: a sunset the yellow emoji stands out on. */
export const BACKGROUND_STOPS: readonly { offset: number; color: string }[] = [
    { offset: 0, color: '#2e1a5c' },
    { offset: 0.55, color: '#9b3d8f' },
    { offset: 1, color: '#f28c6b' },
];

/** The background as CSS, for the page behind the (transparent) canvas. */
export function backgroundCss(): string {
    return \`linear-gradient(180deg, \${BACKGROUND_STOPS.map(stop => \`\${stop.color} \${stop.offset * 100}%\`).join(', ')})\`;
}

/** One round's picture: the canvas (webcam and emoji) when the round ended. */
export interface Snapshot {
    readonly image: string;
    readonly target: GameTarget;
    readonly scored: boolean;
}

/** Where each snapshot goes in the collage: a grid of columns, under a title row. */
export function collageLayout(count: number, cell: { width: number; height: number }, columns = 3, titleHeight = 70): {
    width: number; height: number; cells: { x: number; y: number }[];
} {
    const used = Math.max(1, Math.min(columns, count));
    const rows = Math.max(1, Math.ceil(count / used));
    const gap = 8;
    return {
        width: used * cell.width + (used + 1) * gap,
        height: titleHeight + rows * cell.height + (rows + 1) * gap,
        cells: Array.from({ length: count }, (_, i) => ({
            x: gap + (i % used) * (cell.width + gap),
            y: titleHeight + gap + Math.floor(i / used) * (cell.height + gap),
        })),
    };
}

/** The post that goes with the collage: the score and a link to play. */
export function shareText(score: number, link: string): string {
    return \`I scored \${score} in the Emotion Game 😃 Make the faces, your emoji copies you: \${link}\`;
}

/** X's page to write a post, with the text filled in (it cannot attach a picture: that is pasted). */
export function postIntentUrl(text: string): string {
    return \`https://x.com/intent/tweet?text=\${encodeURIComponent(text)}\`;
}

export async function emotionGame(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: {
        faceConfig?: FaceConfig;
        faceDataProvider?: HeadTrackingDataProvider;
        webCamProvider?: WebCamDataProvider;
        graphicProcessor?: P5GraphicProcessor;
    },
): Promise<World<P5Bundler, any, any, ObserverDataProviderLib>> {
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        debug: false,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 100000,
            isLoop: true
        },
    });

    const videoWidthPixels = 1920 as VideoPixels;
    const videoHeightPixels = 1080 as VideoPixels;
    const headWidthPercent = 1 / 4;
    const headWidthPixels = (headWidthPercent * videoWidthPixels) as VideoPixels;
    const panelPosition = { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits };
    const screenPosition = { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 1500 as SceneUnits };
    const baselineHeadSceneUnits = 300 as SceneUnits;

    const headTrackingConfig: Partial<HeadTrackingDataProviderConfig> = {
        ...( extraArgs?.faceConfig ?? {} ),
        videoWidthPixels: videoWidthPixels,
        videoHeightPixels: videoHeightPixels,
        mirror: false,
        baseline: panelPosition,
        cameraPosition: screenPosition,
        baselineHeadPixels: headWidthPixels,
        baselineHeadSceneUnits: baselineHeadSceneUnits,
        sceneScreenWidth: baselineHeadSceneUnits / headWidthPercent as SceneUnits,
        depthScale: 1,
    }

    const webCamProvider = extraArgs?.webCamProvider ?? new WebCamDataProvider(p, videoWidthPixels, videoHeightPixels);

    const fallbackVideoProvider = new VideoDataProvider(p, FALLBACK_VIDEO_URL, {
        loop: true,
        autoplay: true,
        muted: true,
        playsInline: true,
    });
    const fallbackVideo = (fallbackVideoProvider as any).video;

    const faceDataProvider = extraArgs?.faceDataProvider ?? new HeadTrackingDataProvider(
        p,
        headTrackingConfig,
        VIDEO_SOURCE_ORDER,
    );

    const loader = new P5AssetLoader(p);
    let gp: P5GraphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    const dataProviderLib: ObserverDataProviderLib = {
        webCam: webCamProvider, // needed as parent dependency for headTracker
        video: fallbackVideoProvider,
        headTracker: faceDataProvider,
    };
    const world = new World<P5Bundler, any, any, ObserverDataProviderLib>(
        WorldSettings.fromLibs({clock, loader, dataProviderLib})
    );
    world.setScreen({
        id: 'screen',
        type: PROJECTION_TYPES.SCREEN,
        position: screenPosition,
        direction: {x: 0, y: 0, z: 1},
        lookMode: LOOK_MODES.ROTATION,
        rotation: {yaw: 0, pitch: 0, roll: 0},
    });
    world.setEye({
        id: 'eye',
        type: PROJECTION_TYPES.EYE,
        parentId: 'screen',
        position: { x: 0, y: 0, z: 10 },
        direction: { x: 0, y: 0, z: -1 },
        lookMode: LOOK_MODES.ROTATION,
        rotation: { yaw: 0, pitch: 0, roll: 0 },
    })

    // A fixed field of view, so the scene keeps its proportions at any canvas size (otherwise
    // a small window draws it bigger and the emoji runs off the side).
    world.enableDefaultPerspective(config.width, config.height, 50 * Math.PI / 180);

    world.startLoading();

    if (config.paused) {
        world.pause();
    }

    // Side by side: the webcam on the left, the emoji on the right (in the 50 degree view, the
    // canvas spans about -880..880 across and -700..700 down at the webcam's depth).
    // The panel's box is 600 wide and up to 750 tall; the video keeps its own aspect inside it
    // (the default "contain" fit), so the whole frame shows, whatever the camera's shape.
    const VIDEO = { width: 600, height: 750 };
    const SIDE = 440;

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'bigBox',
        width: 1,
        position: { x: 0, y: 0, z: 0 },
    });

    const reader = new ExpressionReader();
    let currentShape: FaceShape | null = null;

    // The emoji stays beside the webcam, but it follows the head: as you lean, it leans with
    // you, the way the head box follows the face in tutorial 11.
    const emojiHome = { x: SIDE * 0.95, y: 0, z: 300 };

    addEmojiFace(world, {
        parentId: 'bigBox',
        // Forward of the video, so the emoji shows about as tall as the webcam beside it.
        position: (ctx: ResolutionContext<ObserverDataProviderLib>) =>
            emojiFollowPosition(ctx.dataProviders['headTracker'], emojiHome),
        rotate: (ctx: ResolutionContext<ObserverDataProviderLib>) => {
            const face = ctx.dataProviders['headTracker'];
            reader.update(face);
            currentShape = face ? reader.shapeOf(face) : null;
            if (!face) return { pitch: 0, yaw: 0, roll: 0 };
            return { yaw: face.stick.yaw, pitch: face.stick.pitch, roll: face.stick.roll };
        },
        shapeOf: (ctx) => reader.shapeOf(ctx.dataProviders['headTracker']),
    });

    // Starts once the scene is ready, so the first round does not run down while it loads.
    let game: EmotionGame | null = null;

    // The game's panel over the canvas: score, the target emoji, the time left and the hold.
    let hud: { root: HTMLElement; score: HTMLElement; target: HTMLElement; label: HTMLElement; time: HTMLElement; status: HTMLElement } | undefined;
    const updateHud = (now: number) => {
        if (!hud || !game) return;
        const celebrating = game.celebrating(now);
        const set = (element: HTMLElement, text: string) => { if (element.textContent !== text) element.textContent = text; };
        const hearts = '❤️'.repeat(Math.max(0, game.lives)) + '🤍'.repeat(EmotionGame.LIVES - Math.max(0, game.lives));
        set(hud.score, \`Score \${game.score}   \${hearts}   ⏱ \${Math.ceil(game.gameSecondsLeft(now))}s\`);
        if (game.over) {
            set(hud.target, game.timeUp ? '⏱' : '🏁');
            set(hud.label, \`\${game.timeUp ? "Time's up" : 'Game over'} - score \${game.score}\`);
            set(hud.time, 'R or space: play again');
            set(hud.status, reader.status);
            hud.target.style.transform = '';
            return;
        }
        set(hud.target, celebrating ? '✓' : game.target.emoji);
        set(hud.label, celebrating ? 'Nice!' : game.target.label);
        set(hud.time, celebrating ? '' : \`\${Math.ceil(game.secondsLeft(now))}s\${game.holdProgress(now) > 0 ? '  hold...' : ''}\`);
        set(hud.status, reader.status);
        hud.target.style.transform = \`scale(\${1 + 0.3 * game.holdProgress(now)})\`;
    };

    // A match sends a parade of its emoji flying across behind the scene: plain emoji in the page
    // under the canvas, which is cleared transparent, so the 3D face and the webcam hide them.
    let parade: HTMLElement | undefined;
    const PARADE_SIZE = 16;
    const startParade = (emoji: string) => {
        if (!parade) return;
        for (let i = 0; i < PARADE_SIZE; i++) {
            const flyer = document.createElement('span');
            flyer.textContent = emoji;
            const seconds = 1.6 + Math.random() * 1.2;
            flyer.style.cssText = \`position:absolute;left:0;top:\${8 + Math.random() * 80}%;font-size:\${32 + Math.random() * 48}px;\`
                + \`animation:emotion-game-parade \${seconds}s linear \${Math.random() * 0.9}s both\`;
            flyer.addEventListener('animationend', () => flyer.remove());
            parade.appendChild(flyer);
        }
    };

    // Every round's picture - you and your emoji when it ended - shown together at the end. They
    // stay in the page: nothing is uploaded.
    const SNAPSHOT_WIDTH = 480;
    // The webcam and the emoji sit in this band of the canvas's height.
    const SNAPSHOT_BAND = { top: 0.21, bottom: 0.8 };
    let snapshots: Snapshot[] = [];
    let canvasElement: HTMLCanvasElement | undefined;
    let gallery: HTMLElement | undefined;

    /** A small copy of the canvas, stamped with the target emoji and ✓ / ✗. */
    const drawSnapshot = (target: GameTarget, scored: boolean): HTMLCanvasElement | null => {
        if (!canvasElement || !canvasElement.width) return null;
        // Only the band with the webcam and the emoji, not the empty canvas above and below.
        const bandTop = canvasElement.height * SNAPSHOT_BAND.top;
        const bandHeight = canvasElement.height * (SNAPSHOT_BAND.bottom - SNAPSHOT_BAND.top);
        const picture = document.createElement('canvas');
        picture.width = SNAPSHOT_WIDTH;
        picture.height = Math.round(SNAPSHOT_WIDTH * bandHeight / canvasElement.width);
        const g = picture.getContext('2d');
        if (!g) return null;
        // The background is the page's, behind the canvas, so the picture paints it again - the
        // same gradient over the whole canvas height, of which the picture shows the band.
        const scale = picture.width / canvasElement.width;
        const background = g.createLinearGradient(0, -bandTop * scale, 0, (canvasElement.height - bandTop) * scale);
        BACKGROUND_STOPS.forEach(stop => background.addColorStop(stop.offset, stop.color));
        g.fillStyle = background;
        g.fillRect(0, 0, picture.width, picture.height);
        g.drawImage(canvasElement, 0, bandTop, canvasElement.width, bandHeight, 0, 0, picture.width, picture.height);
        g.font = '44px system-ui, sans-serif';
        g.textBaseline = 'top';
        g.fillText(target.emoji, 10, 8);
        g.fillText(scored ? '✅' : '❌', picture.width - 52, 8);
        return picture;
    };

    const takeSnapshot = (target: GameTarget, scored: boolean) => {
        const picture = drawSnapshot(target, scored);
        if (picture) snapshots.push({ image: picture.toDataURL('image/jpeg', 0.85), target, scored });
    };

    /** All the snapshots in one picture, to save and share. */
    const buildCollage = async (): Promise<HTMLCanvasElement | null> => {
        if (!snapshots.length || !game) return null;
        // A picture that never loads must not hold the collage back: the wait ends either way.
        const images = await Promise.all(snapshots.map(snapshot => new Promise<HTMLImageElement | null>(resolve => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = snapshot.image;
        })));
        const loaded = images.filter((image): image is HTMLImageElement => image !== null);
        if (!loaded.length) return null;
        const layout = collageLayout(loaded.length, { width: loaded[0].width, height: loaded[0].height });
        const collage = document.createElement('canvas');
        collage.width = layout.width;
        collage.height = layout.height;
        const g = collage.getContext('2d');
        if (!g) return null;
        g.fillStyle = '#0a0a0a';
        g.fillRect(0, 0, collage.width, collage.height);
        g.fillStyle = '#fff';
        g.font = '700 30px system-ui, sans-serif';
        g.textBaseline = 'middle';
        g.fillText(\`😃 Emotion Game - score \${game.score}\`, 16, 36);
        loaded.forEach((image, i) => g.drawImage(image, layout.cells[i].x, layout.cells[i].y));
        return collage;
    };

    const saveCollage = async () => {
        const collage = await buildCollage();
        if (!collage || !game) return;
        const link = document.createElement('a');
        link.download = \`emotion-game-\${game.score}.jpg\`;
        link.href = collage.toDataURL('image/jpeg', 0.9);
        link.click();
    };

    const toBlob = (canvas: HTMLCanvasElement, type: string) =>
        new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.9));

    // The collage, ready before the player clicks Share: browsers only allow the share sheet, a
    // new tab and the clipboard during the click itself, so the click must not wait for it.
    let prepared: { text: string; file: File; png: Blob; jpegUrl: string } | null = null;
    const prepareShare = async () => {
        prepared = null;
        const collage = await buildCollage();
        if (!collage || !game) return;
        const [jpeg, png] = await Promise.all([toBlob(collage, 'image/jpeg'), toBlob(collage, 'image/png')]);
        if (!jpeg || !png) return;
        prepared = {
            text: shareText(game.score, location.href),
            file: new File([jpeg], \`emotion-game-\${game.score}.jpg\`, { type: 'image/jpeg' }),
            png,
            jpegUrl: collage.toDataURL('image/jpeg', 0.9),
        };
    };

    const downloadPrepared = () => {
        if (!prepared || !game) return;
        const link = document.createElement('a');
        link.download = prepared.file.name;
        link.href = prepared.jpegUrl;
        link.click();
    };

    /**
     * Shares the collage, on the player's click and without waiting for anything before: the
     * system share sheet with the picture attached where the browser has one (phones, Safari...);
     * otherwise X's post page opens with the text and the picture goes to the clipboard, to paste.
     * Nothing in here may throw: the button has to end with a message, whatever the browser does.
     */
    const shareCollage = (say: (message: string) => void) => {
        if (!prepared) {
            say('The picture is still being made - try again in a moment.');
            return;
        }
        const { text, file, png } = prepared;
        // canShare and share can throw (a browser may refuse a combination): the player must
        // always get an answer, so every step is guarded.
        let canShareFiles = false;
        try {
            canShareFiles = !!navigator.canShare?.({ files: [file] });
        } catch {
            canShareFiles = false;
        }
        if (canShareFiles) {
            const failed = () => {
                downloadPrepared();
                say('Sharing did not open - the picture is saved, attach it to your post.');
            };
            try {
                navigator.share({ files: [file], text }).catch((error: Error) => {
                    if (error.name === 'AbortError') { say('Share cancelled.'); return; }
                    failed();
                });
            } catch {
                failed();
            }
            return;
        }
        const post = window.open(postIntentUrl(text), '_blank');
        const notCopied = () => {
            downloadPrepared();
            say(post ? 'Picture saved - attach it to the post.' : 'Picture saved - allow pop-ups to open the post.');
        };
        try {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
                .then(() => say(post
                    ? 'Picture copied - paste it into the post (Ctrl / Cmd + V).'
                    : 'Picture copied - allow pop-ups to open the post, or paste it into a new post on X.'))
                .catch(notCopied);
        } catch {
            notCopied();
        }
    };

    // The gallery is shown once the game is over, but making the collage takes a moment: a
    // gallery asked for twice (or asked for and then restarted) must not fight over the screen.
    let galleryRequest = 0;
    const showGallery = async () => {
        if (!gallery || !game) return;
        const request = ++galleryRequest;
        // The collage is made before the gallery appears, so the Share button works on the
        // first click: the browser only allows the share sheet, a new tab and the clipboard
        // during the click itself.
        await prepareShare();
        if (request !== galleryRequest || !gallery || !game) return;
        gallery.innerHTML = '';
        const title = document.createElement('div');
        title.textContent = \`\${game.timeUp ? "⏱ Time's up" : '🏁 Game over'} - score \${game.score}\`;
        title.style.cssText = 'font-size:24px;margin-bottom:10px';
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;width:100%';
        for (const snapshot of snapshots) {
            const image = document.createElement('img');
            image.src = snapshot.image;
            image.alt = \`\${snapshot.target.label}: \${snapshot.scored ? 'made it' : 'missed'}\`;
            image.style.cssText = 'width:100%;border-radius:6px';
            grid.appendChild(image);
        }
        const buttons = document.createElement('div');
        buttons.style.cssText = 'display:flex;gap:10px;margin-top:12px';
        const button = (label: string, onClick: () => void) => {
            const element = document.createElement('button');
            element.textContent = label;
            element.style.cssText = 'font:700 15px system-ui,sans-serif;padding:8px 16px;border:0;border-radius:6px;cursor:pointer;background:#38bdf8;color:#0f172a';
            element.addEventListener('click', onClick);
            buttons.appendChild(element);
        };
        const message = document.createElement('div');
        message.style.cssText = 'font-size:14px;margin-top:8px;min-height:1.3em';
        const say = (text: string) => { message.textContent = text; };
        if (snapshots.length) {
            button('📤 Share', () => shareCollage(say));
            button('📸 Save picture', () => { if (prepared) downloadPrepared(); else void saveCollage(); });
        }
        button('▶ Play again (R)', () => restart());
        const note = document.createElement('div');
        note.textContent = 'The pictures stay on this device until you share them - nothing is uploaded.';
        note.style.cssText = 'font-size:12px;opacity:0.7;margin-top:4px';
        gallery.append(title, grid, buttons, message, note);
        gallery.style.display = 'flex';
    };

    const restart = () => {
        if (!game) return;
        snapshots = [];
        // A gallery still being made belongs to the game that is over: it must not show up
        // over the new one.
        galleryRequest++;
        prepared = null;
        if (gallery) gallery.style.display = 'none';
        game.restart(performance.now() / 1000);
    };

    p.setup = () => {
        const canvas = p.createCanvas(config.width, config.height, p.WEBGL);
        // Keep the last frame readable, for the snapshots (WebGL clears it once shown otherwise).
        p.setAttributes?.('preserveDrawingBuffer', true);
        gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);
        canvasElement = (canvas as { elt?: HTMLCanvasElement } | undefined)?.elt;
        const box = canvasElement?.parentElement;
        if (box && canvasElement) {
            box.querySelector('.emotion-game-parade')?.remove(); // from a previous run of this sketch
            box.querySelector('.emotion-game-gallery')?.remove();
            gallery = document.createElement('div');
            gallery.className = 'emotion-game-gallery';
            gallery.style.cssText = 'position:absolute;inset:0;z-index:3;display:none;flex-direction:column;align-items:center;overflow:auto;padding:16px;'
                + 'background:rgba(10,10,10,0.92);color:#fff;font:700 16px/1.3 system-ui,sans-serif;box-sizing:border-box';
            box.appendChild(gallery);
            if (!document.getElementById('emotion-game-parade-style')) {
                const style = document.createElement('style');
                style.id = 'emotion-game-parade-style';
                style.textContent = '@keyframes emotion-game-parade { from { transform: translateX(-120px) } to { transform: translateX(var(--parade-width, 1200px)) } }';
                document.head.appendChild(style);
            }
            parade = document.createElement('div');
            parade.className = 'emotion-game-parade';
            parade.style.cssText = \`position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:\${backgroundCss()}\`;
            parade.style.setProperty('--parade-width', \`\${box.clientWidth + 120}px\`);
            box.insertBefore(parade, canvasElement);
            canvasElement.style.position = 'relative';
            canvasElement.style.zIndex = '1';
            box.querySelector('.emotion-game-hud')?.remove(); // from a previous run of this sketch
            const root = document.createElement('div');
            root.className = 'emotion-game-hud';
            root.style.cssText = 'position:absolute;top:8px;left:0;right:0;z-index:2;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;color:#fff;font:700 18px/1.2 system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,0.8)';
            const element = (css: string) => { const el = document.createElement('div'); el.style.cssText = css; root.appendChild(el); return el; };
            hud = {
                root,
                score: element('font-size:22px'),
                target: element('font-size:72px;line-height:1.1;transition:transform 0.1s'),
                label: element('font-size:16px'),
                time: element('font-size:14px;opacity:0.85'),
                status: element('font-size:12px;opacity:0.7'),
            };
            box.appendChild(root);
        }
    };

    p.keyPressed = () => {
        if (p.key === 'n' || p.key === 'N') {
            reader.startCalibration();
        }
        if (game?.over && (p.key === 'r' || p.key === 'R' || p.key === ' ')) {
            restart();
        }
    };

    let initialized = false;
    let rendering = false;
    p.draw = async () => {
        if (rendering) return;
        rendering = true;
        try {
        if (!gp) {
            return;
        }

        if (!initialized) {
            // Set fallback video capture for face tracking when webcam is not available
            if (typeof (faceDataProvider as any).setFallbackCapture === 'function') {
                (faceDataProvider as any).setFallbackCapture(fallbackVideo);
            }

            await faceDataProvider.init();
            world.complete();

            world.addPanel({
                type: ELEMENT_TYPES.PANEL,
                parentId: 'bigBox',
                id: 'videoPanel',
                width: VIDEO.width,
                height: VIDEO.height,
                mirrorTextureHorizontal: true,
                position: { x: -SIDE, y: 0, z: 0 },
                // The whole camera frame, straight from the camera: the panel keeps the video's
                // own aspect (the default "contain" fit), so nothing is cut off.
                video: createVideoSelector(fallbackVideo),
                fillColor: COLORS.white,
            });

            initialized = true;
            game = new EmotionGame(performance.now() / 1000);
            return;
        }

        if (config.paused && !world.isPaused()) {
            world.pause();
            fallbackVideo.pause();
            // Don't clear background - keep last frame visible
            return;
        } else if (!config.paused && world.isPaused()) {
            world.resume();
            fallbackVideo.loop();
        }

        // Transparent, so the parade behind the canvas shows where nothing is drawn.
        p.clear();
        const result = await world.step(gp);
        const now = performance.now() / 1000;
        const target = game?.target;
        const event = game?.update(now, currentShape !== null && matchesTarget(game.target.id, currentShape));
        if ((event === 'scored' || event === 'timeout') && target) takeSnapshot(target, event === 'scored');
        if (event === 'scored' && target) startParade(target.emoji);
        if (event && game?.over) void showGallery();
        updateHud(now);
        if (!result.running) return;
        } finally {
            rendering = false;
        }
    };

    return world;
}
`;Be("showroom-emotion-game","Emotion Game",it,st,Je,{},"img/loading/emotion-game.jpg");
//# sourceMappingURL=emotion-game-C2_CF-Cw.js.map
