import"../../tutorial-BXGzkH4k.js";import{E as I,C as ue,r as Ge,u as He,m as tt,v as nt,D as at,S as ot,a as ke,W as rt,H as it,h as Oe,P as st,b as lt,c as ct,e as Le,l as Pe}from"../../tutorial.template-Dw7s1PrT.js";import{r as ht}from"../../showcase_step-Dl78muXZ.js";const dt={leftEyeOpen:1,rightEyeOpen:1,mouthOpen:0,happy:0,sad:0,angry:0,surprised:0,sleepy:0};function ze(t,e=t.sleepy){let n="neutral",r=nt;for(const s of tt){const b=s==="sleepy"?e:t[s];b>=r&&(n=s,r=b)}return n}function mt(t,e){if(!t)return dt;const n=e??t.sleepy,r=ze(t,n),s=b=>r!==b?0:b==="sleepy"?n:t[b];return{leftEyeOpen:t.leftEyeOpen,rightEyeOpen:t.rightEyeOpen,mouthOpen:Math.max(t.mouthOpen,t.lipsApart),happy:s("happy"),sad:s("sad"),angry:s("angry"),surprised:s("surprised"),sleepy:s("sleepy")}}const J={rx:150,ry:170,rz:125};function X(t,e){return J.rz*Math.sqrt(Math.max(0,1-(t/J.rx)**2-(e/J.ry)**2))}function Me(t){const e=Math.max(0,Math.min(1,(t.angry-.3)/.6)),n=(r,s)=>Math.round(r+(s-r)*e);return{red:n(255,235),green:n(204,80),blue:n(77,55)}}function pe(t,e){return{rx:16+6*e,ry:Math.max(1.5,26*t*(1+.4*e))}}function Ae(t,e){const n=.45*t.angry-.4*t.sad;return{y:-80-30*t.surprised-8*t.sad+12*t.angry,roll:e==="left"?n:-n}}const fe=15,pt=.8;function M(t){const e=t.mouthOpen,n=e>.3&&t.happy>=pt,r=!n&&e>.3&&t.happy<Math.max(t.surprised,t.angry,.35),s=n?30+30*e:8+70*e+30*t.surprised-4*t.angry;return{mode:n?"grin":r?"oval":"curve",width:Math.max(30,80+50*t.happy+30*t.angry-40*t.surprised-30*t.sleepy),curve:26*t.happy-18*t.sad,thickness:8+18*t.happy*e,height:s,teeth:n?s*.3:r&&t.angry>0?s*.35:0}}function ge(t,e){const n=t.width/2,r=-1+2*e/(fe-1),s=r*n,b=-2*t.curve*r/n;return{x:s,y:t.curve*(1-r*r),roll:Math.atan(b),rx:Math.max(t.width/(fe-1)*Math.hypot(1,b)*.8,t.thickness*.8)}}function Y(t){const e=Math.max(.01,t*.2);return[{x:0,y:-t/2,width:t,height:e,roll:0},{x:0,y:0,width:t*Math.SQRT2,height:e,roll:-Math.PI/4},{x:0,y:t/2,width:t,height:e,roll:0}].map(n=>t>0?n:{...n,width:.01,height:.01})}function ne(t){return t.sad>.5?6+16*(t.sad-.5):0}const Ie={red:70,green:40,blue:20},Ne={red:110,green:40,blue:20};function gt(t,e){const n=e.shapeOf;t.addElliptical({type:I.ELLIPTICAL,id:"head",parentId:e.parentId,...J,position:e.position,rotate:e.rotate,fillColor:i=>Me(n(i)),strokeWidth:0});for(const i of["left","right"]){const u=50*(i==="left"?-1:1),N=-30,G=v=>i==="left"?v.leftEyeOpen:v.rightEyeOpen;t.addElliptical({type:I.ELLIPTICAL,id:`${i}-eye`,parentId:"head",rx:v=>{const C=n(v);return pe(G(C),C.surprised).rx},ry:v=>{const C=n(v);return pe(G(C),C.surprised).ry},rz:8,position:{x:u,y:N,z:X(u,N)+4},fillColor:Ie,strokeWidth:0}),t.addSphere({type:I.SPHERE,id:`${i}-eye-shine`,parentId:`${i}-eye`,radius:v=>5*G(n(v)),position:v=>{const C=n(v);return{x:-5,y:-pe(G(C),C.surprised).ry*.4,z:5}},fillColor:ue.white,strokeWidth:0}),t.addBox({type:I.BOX,id:`${i}-brow`,parentId:"head",width:50,height:10,depth:6,position:v=>{const C=Ae(n(v),i).y;return{x:u,y:C,z:X(u,C)+6}},rotate:v=>({yaw:0,pitch:0,roll:Ae(n(v),i).roll}),fillColor:Ie,strokeWidth:0})}const r=70,s=.01,b=X(0,r)+4;t.addElliptical({type:I.ELLIPTICAL,id:"mouth",parentId:"head",rx:i=>{const d=M(n(i));return d.mode==="curve"?s:d.width/2},ry:i=>{const d=M(n(i));return d.mode==="curve"?s:d.mode==="grin"?d.height:d.height/2},rz:10,position:{x:0,y:r,z:b},fillColor:Ne,strokeWidth:0}),t.addElliptical({type:I.ELLIPTICAL,id:"teeth",parentId:"head",rx:i=>{const d=M(n(i));return d.teeth>0?d.width*(d.mode==="grin"?.4:.36):s},ry:i=>Math.max(s,M(n(i)).teeth/2),rz:4,position:i=>{const d=M(n(i));return{x:0,y:d.mode==="grin"?r+d.teeth/4:r-d.height/2+d.teeth/2+4,z:b+10}},fillColor:ue.white,strokeWidth:0}),t.addBox({type:I.BOX,id:"grin-cover",parentId:"head",width:i=>{const d=M(n(i));return d.mode==="grin"?d.width+12:s},height:i=>{const d=M(n(i));return d.mode==="grin"?d.height+4:s},depth:2,position:i=>({x:0,y:r-(M(n(i)).height+4)/2,z:b+16}),fillColor:i=>Me(n(i)),strokeWidth:0});for(let i=0;i<fe;i++)t.addElliptical({type:I.ELLIPTICAL,id:`mouth-curve-${i}`,parentId:"head",rx:d=>{const u=M(n(d));return u.mode==="curve"?ge(u,i).rx:s},ry:d=>{const u=M(n(d));return u.mode==="curve"?u.thickness/2:s},rz:6,position:d=>{const u=ge(M(n(d)),i),N=r+u.y;return{x:u.x,y:N,z:X(u.x,N)+6}},rotate:d=>({yaw:0,pitch:0,roll:ge(M(n(d)),i).roll}),fillColor:Ne,strokeWidth:0});[{x:120,y:-130,size:28},{x:160,y:-185,size:40}].forEach((i,d)=>{for(let u=0;u<3;u++)t.addBox({type:I.BOX,id:`sleepy-z-${d}-${u}`,parentId:"head",width:N=>Y(n(N).sleepy>0?i.size:0)[u].width,height:N=>Y(n(N).sleepy>0?i.size:0)[u].height,depth:4,position:{x:i.x+Y(i.size)[u].x,y:i.y+Y(i.size)[u].y,z:J.rz*.6},rotate:{yaw:0,pitch:0,roll:Y(i.size)[u].roll},fillColor:{red:70,green:110,blue:200},strokeWidth:0})});const L=58,$=8;t.addElliptical({type:I.ELLIPTICAL,id:"tear",parentId:"head",rx:i=>Math.max(s,ne(n(i))),ry:i=>Math.max(s,ne(n(i))*1.4),rz:i=>Math.max(s,ne(n(i))),position:i=>({x:L,y:$,z:X(L,$)+ne(n(i))+6}),fillColor:{red:90,green:180,blue:255},strokeWidth:0})}class ae{static CALIBRATION_FRAMES=20;static SLEEPY_SECONDS=.8;calibration=null;calibrationFrames=null;lastRaw=null;lastCalibrated=null;smoothedSleepy=0;lastSleepyFrame=null;lastSleepyTime=null;startCalibration(){this.calibrationFrames=[]}setCalibration(e){this.calibration=e,this.calibrationFrames=null,this.lastRaw=null,this.lastCalibrated=null}get isCalibrated(){return this.calibration!==null}get status(){return this.calibration?"calibrated (N: again)":this.calibrationFrames?"calibrating: relax...":"N: calibrate, relaxed"}get sleepy(){return this.smoothedSleepy}update(e,n=performance.now()){const r=e?.faceExpressions;this.calibrationFrames&&r&&!this.calibrationFrames.includes(r)&&(this.calibrationFrames.push(r),this.calibrationFrames.length>=ae.CALIBRATION_FRAMES&&(this.calibration=Ge(He.average(this.calibrationFrames)),this.calibrationFrames=null,this.lastRaw=null));const s=this.expressionsOf(e);if(!s||s===this.lastSleepyFrame)return;this.lastSleepyFrame=s;const b=this.lastSleepyTime===null?0:(n-this.lastSleepyTime)/1e3;this.lastSleepyTime=n,this.smoothedSleepy+=(s.sleepy-this.smoothedSleepy)*(1-Math.exp(-b/ae.SLEEPY_SECONDS))}expressionsOf(e){const n=e?.faceExpressions;return n?this.calibration?(n!==this.lastRaw&&(this.lastRaw=n,this.lastCalibrated=n.withRanges(this.calibration).normalize()),this.lastCalibrated):e.expressions:null}shapeOf(e){return mt(this.expressionsOf(e),this.smoothedSleepy)}emotionOf(e){const n=this.expressionsOf(e);return n?ze(n,this.smoothedSleepy):"neutral"}}const ut="😐",ye=3,ft=20,yt=2,bt=10,wt=60,xt=.09,vt=.12,Ue=["eyeBlinkLeft","eyeBlinkRight"],St=.35;function Et(t){const e=t.faceExpressions;return{position:t.worldPosition,rotation:t.sceneFace.localRotation,scores:e?{...e.scores}:{}}}function _e(t,e){return Math.hypot(e.position.x-t.position.x,e.position.y-t.position.y,e.position.z-t.position.z)}function Ct(t,e){return Math.max(Math.abs(e.rotation.yaw-t.rotation.yaw),Math.abs(e.rotation.pitch-t.rotation.pitch),Math.abs(e.rotation.roll-t.rotation.roll))}function Tt(t,e){let n=0;for(const[r,s]of Object.entries(t.scores))Ue.includes(r)||(n=Math.max(n,Math.abs(s-(e.scores[r]??s))));return n}function kt(t,e){return Ue.some(n=>(e.scores[n]??0)>(t.scores[n]??0)+St)}class Ot{state="waiting";anchor=null;previous=null;stillSince=0;lastNow=0;frames=[];ranges=null;get phaseState(){return this.state}get isDone(){return this.state==="done"}get progress(){return this.state==="done"?1:this.state==="waiting"?0:Math.max(0,Math.min(1,(this.lastNow-this.stillSince)/ye))}get neutralRanges(){return this.ranges}reset(){this.state="waiting",this.anchor=null,this.previous=null,this.frames=[],this.ranges=null}update(e,n){if(this.state==="done")return;if(this.lastNow=n,!e){this.state="waiting",this.anchor=null,this.previous=null,this.frames=[];return}const r=Et(e),s=this.previous;if(this.previous=r,!s){this.anchor=r,this.stillSince=n,this.state="holding",this.collect(e,r);return}const b=_e(s,r)>bt||Ct(s,r)>xt||Tt(s,r)>vt,L=this.anchor!==null&&_e(this.anchor,r)>wt;(b||L)&&(this.anchor=r,this.stillSince=n,this.frames=[]),this.state="holding",this.collect(e,r),n-this.stillSince>=ye&&this.frames.length>=yt&&(this.ranges=Ge(He.average(this.frames)),this.state="done")}collect(e,n){const r=e.faceExpressions;!r||!this.anchor||kt(this.anchor,n)||this.frames.length>=ft||this.frames.push(r)}}const Lt=`
<div class="concept">
<p>A game built on the face expressions of tutorial 11. Every round shows an emoji - make that face and hold it for half a second to score. A round lasts ten seconds, a missed one costs one of your three lives, and the whole game lasts at most a minute and a half. Your webcam is on the left, and on the right the emoji face copies yours, so you can see what the game sees. The game needs your camera: there is no prerecorded clip to fall back on, and without the camera there is no game.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>The face cam</strong> - the webcam panel shows the whole camera frame, kept in the camera's own aspect so nothing is cut off.</li>
<li><strong>The face</strong> - <code>addEmojiFace</code> (<code>emoji_face.ts</code>) draws the emoji, here beside the webcam, turning with your head and leaning with it too.</li>
<li><strong>The calibration</strong> - before the first round the game asks for the neutral face (😐): make it and hold it still, and the game counts the still seconds (<code>CalibrationPhase</code>, <code>emotion_game_calibration.ts</code>). Three still seconds and the frames of that relaxed face are averaged into <em>your</em> neutral face (<code>calibratedRanges</code>), which the reader then uses - that is what makes the hard faces (😠 😮) read right. The head may not move, turn or blink while the seconds run; the game waits for the calibration, and its clock does not run. The <em>🎯 Calibrate</em> button on the screen - there is no keyboard on a phone - or <kbd>N</kbd> does it again whenever you want.</li>
<li><strong>Reading the expressions</strong> - <code>ExpressionReader</code> (<code>emoji_face.ts</code>) reads the face with those ranges; it smooths sleepy over time, so a blink is not a nap.</li>
<li><strong>Matching</strong> - <code>matchesTarget</code> checks the face against the round's emoji: the strongest emotion for 😢 😠 😮 😴, a smile that is not the open grin for 🙂, the open grin for 😃, one eye closed for 😉.</li><li><strong>The ring</strong> - every round also puts a ring somewhere around the emoji (one of the <code>GAME_SPOTS</code>): lean so the emoji gets into it (<code>inSpot</code>, within <code>SPOT_RADIUS</code>) and the ring turns green. Only the face made inside the ring counts.</li>
<li><strong>The rounds</strong> - <code>EmotionGame</code> keeps the score, the lives, the target and the clock: hold the face in the ring for <code>HOLD_SECONDS</code> to score; a round that runs out after <code>ROUND_SECONDS</code> costs one of the <code>LIVES</code>. The game is over with none left, or after <code>GAME_SECONDS</code> however well it goes (<kbd>R</kbd> or space plays again).</li><li><strong>The pictures</strong> - every round ends with a snapshot of the canvas, you and your emoji side by side, stamped with the target and ✅ / ❌. At the end they show together, and <em>Save picture</em> puts them in one collage (<code>collageLayout</code>). <em>Share</em> opens the system share sheet with the collage attached where the browser has one; otherwise it copies the collage and opens a post on X (<code>postIntentUrl</code>) to paste it into. They stay on your device until you share them.</li>
<li><strong>The parade</strong> - a match sends its emoji flying across behind the scene: plain page emoji under the canvas, which is cleared transparent, so the 3D face and the webcam pass in front of them.</li>
</ol>

<p>Angry is the hard one: the calibration is what makes it work, so make the 😐 face at the start of the game - and calibrate again if you change how you sit.</p>

<div class="related">
<h3>Related Tutorials</h3>
<a href="../../tutorial/tutorial-11/index.html">Tutorial 11: Facial Expressions</a>
</div>
`,Pt=[{id:"smile",emoji:"🙂",label:"Smile (lips closed)"},{id:"grin",emoji:"😃",label:"Big open grin"},{id:"wink",emoji:"😉",label:"Wink"},{id:"sad",emoji:"😢",label:"Sad"},{id:"angry",emoji:"😠",label:"Angry"},{id:"surprised",emoji:"😮",label:"Surprised"},{id:"sleepy",emoji:"😴",label:"Sleepy"}];function Mt(t,e){switch(t){case"smile":return e.happy>0&&M(e).mode!=="grin";case"grin":return M(e).mode==="grin";case"wink":{const[n,r]=[Math.min(e.leftEyeOpen,e.rightEyeOpen),Math.max(e.leftEyeOpen,e.rightEyeOpen)];return n<.3&&r>.6}default:return e[t]>0}}const Re=.6,De=260;function je(t,e){if(!t)return e;const n=r=>Math.max(-De,Math.min(De,r));return{x:e.x+n(t.worldPosition.x*Re),y:e.y+n(t.worldPosition.y*Re),z:e.z}}const At=[{x:0,y:0},{x:-240,y:0},{x:130,y:0},{x:-150,y:-120},{x:110,y:-120},{x:-150,y:120},{x:110,y:120}],It={red:255,green:255,blue:255,alpha:.7},Nt={red:74,green:222,blue:128,alpha:.9},_t={red:255,green:255,blue:255,alpha:0},Rt=80;function Dt(t,e,n){return Math.hypot(t.x-e.x-n.x,t.y-e.y-n.y)<=Rt}class _{static ROUND_SECONDS=10;static GAME_SECONDS=90;static LIVES=3;static HOLD_SECONDS=.5;static CELEBRATE_SECONDS=1;score=0;lives=_.LIVES;timeUp=!1;target;spot;gameStart;roundStart;holdStart=null;celebrateUntil=null;pausedAt=null;random;constructor(e,n=Math.random){this.random=n,this.target=this.pickTarget(null),this.spot=this.pickSpot(null),this.gameStart=e,this.roundStart=e}get over(){return this.lives<=0||this.timeUp}pause(e){this.pausedAt===null&&(this.pausedAt=e,this.holdStart=null)}resume(e){if(this.pausedAt===null)return;const n=e-this.pausedAt;this.gameStart+=n,this.roundStart+=n,this.holdStart!==null&&(this.holdStart+=n),this.celebrateUntil!==null&&(this.celebrateUntil+=n),this.pausedAt=null}running(e,n){const r=this.pausedAt===null?0:e-this.pausedAt;return e-n-r}gameSecondsLeft(e){return Math.max(0,_.GAME_SECONDS-this.running(e,this.gameStart))}restart(e){this.score=0,this.lives=_.LIVES,this.timeUp=!1,this.gameStart=e,this.roundStart=e,this.pausedAt=null,this.celebrateUntil=null,this.nextRound(e)}secondsLeft(e){return Math.max(0,_.ROUND_SECONDS-this.running(e,this.roundStart))}celebrating(e){return this.celebrateUntil!==null&&e<this.celebrateUntil}holdProgress(e){return this.holdStart===null?0:Math.min(1,(e-this.holdStart)/_.HOLD_SECONDS)}update(e,n){if(this.over)return null;if(this.gameSecondsLeft(e)<=0)return this.timeUp=!0,this.celebrateUntil=null,"time-up";if(this.celebrateUntil!==null)return e<this.celebrateUntil||(this.celebrateUntil=null,this.nextRound(e)),null;if(n){if(this.holdStart??=e,e-this.holdStart>=_.HOLD_SECONDS)return this.score++,this.holdStart=null,this.celebrateUntil=e+_.CELEBRATE_SECONDS,"scored"}else this.holdStart=null;return this.secondsLeft(e)<=0?(this.lives--,this.over||this.nextRound(e),"timeout"):null}nextRound(e){this.target=this.pickTarget(this.target),this.spot=this.pickSpot(this.spot),this.roundStart=e,this.holdStart=null}pickTarget(e){const n=Pt.filter(r=>r!==e);return n[Math.min(n.length-1,Math.floor(this.random()*n.length))]}pickSpot(e){const n=At.filter(r=>r!==e);return n[Math.min(n.length-1,Math.floor(this.random()*n.length))]}}const Be=[{offset:0,color:"#2e1a5c"},{offset:.55,color:"#9b3d8f"},{offset:1,color:"#f28c6b"}];function jt(){return`linear-gradient(180deg, ${Be.map(t=>`${t.color} ${t.offset*100}%`).join(", ")})`}const Gt=3,Ht=70,zt=8;function Ut(t,e,n=Gt,r=Ht){const s=Math.max(1,Math.min(n,t)),b=Math.max(1,Math.ceil(t/s)),L=zt;return{width:s*e.width+(s+1)*L,height:r+b*e.height+(b+1)*L,cells:Array.from({length:t},($,i)=>({x:L+i%s*(e.width+L),y:r+L+Math.floor(i/s)*(e.height+L)}))}}function Bt(t,e){return`I scored ${t} in the Emotion Game 😃 Make the faces, your emoji copies you: ${e}`}function Ft(t){return`https://x.com/intent/tweet?text=${encodeURIComponent(t)}`}async function Wt(t,e=at,n){const r=e.clock??new ot({...ke,startPaused:e.paused,debug:!1,playback:{...ke.playback,duration:1e5,isLoop:!0}}),s=1920,b=1080,L=1/4,$=L*s,i={x:0,y:0,z:0},d={x:0,y:0,z:1500},u=300,N={...n?.faceConfig??{},videoWidthPixels:s,videoHeightPixels:b,mirror:!1,baseline:i,cameraPosition:d,baselineHeadPixels:$,baselineHeadSceneUnits:u,sceneScreenWidth:u/L,depthScale:1},G=n?.webCamProvider??new rt(t,s,b),v=n?.faceDataProvider??new it(t,N,["webCam"]),C=new st(t);let oe=n?.graphicProcessor??new Oe(t,C);const Fe={webCam:G,headTracker:v},E=new lt(ct.fromLibs({clock:r,loader:C,dataProviderLib:Fe}));E.setScreen({id:"screen",type:Pe.SCREEN,position:d,direction:{x:0,y:0,z:1},lookMode:Le.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),E.setEye({id:"eye",type:Pe.EYE,parentId:"screen",position:{x:0,y:0,z:10},direction:{x:0,y:0,z:-1},lookMode:Le.ROTATION,rotation:{yaw:0,pitch:0,roll:0}}),E.enableDefaultPerspective(e.width,e.height,50*Math.PI/180),E.startLoading(),e.paused&&E.pause();const be={width:600,height:750},we=440;E.addBox({type:I.BOX,id:"bigBox",width:1,position:{x:0,y:0,z:0}});const H=new ae;let re=null,ie=null;const z={x:we*.95,y:0,z:300};gt(E,{parentId:"bigBox",position:o=>je(o.dataProviders.headTracker,z),rotate:o=>{const a=o.dataProviders.headTracker;return H.update(a),ie=a,re=a?H.shapeOf(a):null,a?{yaw:a.stick.yaw,pitch:a.stick.pitch,roll:a.stick.roll}:{pitch:0,yaw:0,roll:0}},shapeOf:o=>H.shapeOf(o.dataProviders.headTracker)});let l=null,se=!1;E.addTorus({type:I.TORUS,id:"spot",parentId:"bigBox",radius:190,tubeRadius:10,position:()=>l?{x:z.x+l.spot.x,y:z.y+l.spot.y,z:z.z}:z,fillColor:()=>!l||l.over?_t:se?Nt:It});const U=new Ot;let V=!1,xe=!1,R,K,le;const ce=o=>{U.reset(),V=!0,l?.pause(o),R&&(R.style.display="flex")},We=o=>{const a=U.neutralRanges;a&&H.setCalibration(a),V=!1,R&&(R.style.display="none"),l?.resume(o)},$e=o=>{xe=!0,V=!1,R&&(R.style.display="none"),l?.resume(o)},Ve=()=>{if(!R)return;R.style.display="flex";const o=Math.max(0,Math.ceil(ye*(1-U.progress))),a=U.phaseState==="waiting"?"We cannot see your face yet - look at the camera.":`Hold still... ${o}`;K&&K.textContent!==a&&(K.textContent=a),le&&(le.style.width=`${Math.round(U.progress*100)}%`)};let A,q;const he=o=>{q&&(q.textContent!==o&&(q.textContent=o),q.style.display=o?"flex":"none")},Z=o=>{if(!A||!l)return;const a=l.celebrating(o),c=(h,m)=>{h.textContent!==m&&(h.textContent=m)},p="❤️".repeat(Math.max(0,l.lives))+"🤍".repeat(_.LIVES-Math.max(0,l.lives));if(c(A.score,`Score ${l.score}   ${p}   ⏱ ${Math.ceil(l.gameSecondsLeft(o))}s`),l.over){c(A.target,l.timeUp?"⏱":"🏁"),c(A.label,`${l.timeUp?"Time's up":"Game over"} - score ${l.score}`),c(A.time,"R or space: play again"),c(A.status,H.status),A.target.style.transform="";return}c(A.target,a?"✓":l.target.emoji),c(A.label,a?"Nice!":`${l.target.label} - in the ring`),c(A.time,a?"":`${Math.ceil(l.secondsLeft(o))}s${l.holdProgress(o)>0?"  hold...":""}`),c(A.status,H.status),A.target.style.transform=`scale(${1+.3*l.holdProgress(o)})`};let B;const qe=16,Xe=o=>{if(B)for(let a=0;a<qe;a++){const c=document.createElement("span");c.textContent=o;const p=1.6+Math.random()*1.2;c.style.cssText=`position:absolute;left:0;top:${8+Math.random()*80}%;font-size:${32+Math.random()*48}px;animation:emotion-game-parade ${p}s linear ${Math.random()*.9}s both`,c.addEventListener("animationend",()=>c.remove()),B.appendChild(c)}},ve=480,de={top:.21,bottom:.8};let j=[],T,P;const Ye=(o,a)=>{if(!T||!T.width)return null;const c=T.height*de.top,p=T.height*(de.bottom-de.top),h=document.createElement("canvas");h.width=ve,h.height=Math.round(ve*p/T.width);const m=h.getContext("2d");if(!m)return null;const x=h.width/T.width,S=m.createLinearGradient(0,-c*x,0,(T.height-c)*x);return Be.forEach(w=>S.addColorStop(w.offset,w.color)),m.fillStyle=S,m.fillRect(0,0,h.width,h.height),m.drawImage(T,0,c,T.width,p,0,0,h.width,h.height),m.font="44px system-ui, sans-serif",m.textBaseline="top",m.fillText(o.emoji,10,8),m.fillText(a?"✅":"❌",h.width-52,8),h},Je=(o,a)=>{const c=Ye(o,a);c&&j.push({image:c.toDataURL("image/jpeg",.85),target:o,scored:a})},Se=async()=>{if(!j.length||!l)return null;const a=(await Promise.all(j.map(m=>new Promise(x=>{const S=new Image;S.onload=()=>x(S),S.onerror=()=>x(null),S.src=m.image})))).filter(m=>m!==null);if(!a.length)return null;const c=Ut(a.length,{width:a[0].width,height:a[0].height}),p=document.createElement("canvas");p.width=c.width,p.height=c.height;const h=p.getContext("2d");return h?(h.fillStyle="#0a0a0a",h.fillRect(0,0,p.width,p.height),h.fillStyle="#fff",h.font="700 30px system-ui, sans-serif",h.textBaseline="middle",h.fillText(`😃 Emotion Game - score ${l.score}`,16,36),a.forEach((m,x)=>h.drawImage(m,c.cells[x].x,c.cells[x].y)),p):null},Ke=async()=>{const o=await Se();if(!o||!l)return;const a=document.createElement("a");a.download=`emotion-game-${l.score}.jpg`,a.href=o.toDataURL("image/jpeg",.9),a.click()},Ee=(o,a)=>new Promise(c=>o.toBlob(c,a,.9));let k=null;const g=(...o)=>console.log("[share]",...o),Ze=async()=>{g("prepareShare: start",{snapshots:j.length,hasGame:!!l}),k=null;const o=await Se();if(g("prepareShare: collage",o?`${o.width}x${o.height}`:null),!o||!l){g("prepareShare: no collage or no game, nothing to share");return}const[a,c]=await Promise.all([Ee(o,"image/jpeg"),Ee(o,"image/png")]);if(g("prepareShare: blobs",{jpeg:a?.size??null,png:c?.size??null}),!a||!c){g("prepareShare: a blob is missing, nothing to share");return}k={text:Bt(l.score,location.href),file:new File([a],`emotion-game-${l.score}.jpg`,{type:"image/jpeg"}),png:c,jpegUrl:o.toDataURL("image/jpeg",.9)},g("prepareShare: ready",{file:k.file.name,size:k.file.size,text:k.text})},Q=()=>{if(g("downloadPrepared",{prepared:!!k,hasGame:!!l}),!k||!l)return;const o=document.createElement("a");o.download=k.file.name,o.href=k.jpegUrl,o.click()},Qe=o=>{g("shareCollage: clicked",{prepared:!!k,secureContext:window.isSecureContext,share:typeof navigator.share,canShare:typeof navigator.canShare,clipboardWrite:typeof navigator.clipboard?.write,clipboardItem:typeof ClipboardItem,userActivation:navigator.userActivation?.isActive,userAgent:navigator.userAgent});try{if(!k){o("The picture is still being made - try again in a moment.");return}const{text:a,file:c,png:p}=k,h=window.matchMedia?.("(pointer: coarse)").matches??!1;g("shareCollage: touchDevice",h);let m=!1;if(h&&typeof navigator.share=="function")try{m=navigator.canShare?navigator.canShare({files:[c]}):!0}catch(f){g("shareCollage: canShare threw",f),m=!1}if(g("shareCollage: canShareFiles",m),m){const f=()=>{Q(),o("Sharing did not open - the picture is saved, attach it to your post.")};try{g("shareCollage: calling navigator.share"),navigator.share({files:[c],text:a}).then(()=>{g("shareCollage: navigator.share resolved"),o("Shared.")}).catch(y=>{if(g("shareCollage: navigator.share rejected",y?.name,y?.message,y),y.name==="AbortError"){o("Share cancelled.");return}f()}),g("shareCollage: navigator.share called, waiting for the share sheet")}catch(y){g("shareCollage: navigator.share threw",y),f()}return}let x;try{g("shareCollage: writing the picture to the clipboard",{png:p.size}),x=navigator.clipboard.write([new ClipboardItem({"image/png":p})])}catch(f){x=Promise.reject(f)}const S=/Mac|iPhone|iPad/.test(navigator.userAgent)?"⌘V":"Ctrl+V",w={label:"𝕏 Open the post",run:()=>{const f=Ft(a);g("shareCollage: opening post",f);const y=window.open(f,"_blank");g("shareCollage: window.open returned",y&&"a window"),y||o("The post did not open - allow pop-ups for this page and try again.",w)}};x.then(()=>{g("shareCollage: clipboard written"),o(`✅ Picture copied. In the X post, press ${S} to add it.`,w)}).catch(f=>{g("shareCollage: clipboard failed",f),Q(),o("📥 Picture saved to your downloads. In the X post, attach it with the 🖼 button.",w)})}catch(a){g("shareCollage: unexpected error",a);try{Q(),o("Share failed - the picture is saved to your downloads.")}catch{o("Share is not available. Try taking a screenshot instead.")}console.error("Share button error:",a)}};let ee=0;const et=async()=>{if(g("showGallery: start",{hasGallery:!!P,hasGame:!!l}),!P||!l)return;const o=++ee;if(await Ze().catch(w=>g("showGallery: prepareShare threw",w)),o!==ee||!P||!l){g("showGallery: dropped",{request:o,galleryRequest:ee,hasGallery:!!P,hasGame:!!l});return}P.innerHTML="";const a=document.createElement("div");a.textContent=`${l.timeUp?"⏱ Time's up":"🏁 Game over"} - score ${l.score}`,a.style.cssText="font-size:24px;margin-bottom:10px";const c=document.createElement("div");c.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;width:100%";for(const w of j){const f=document.createElement("img");f.src=w.image,f.alt=`${w.target.label}: ${w.scored?"made it":"missed"}`,f.style.cssText="width:100%;border-radius:6px",c.appendChild(f)}const p=document.createElement("div");p.className="emotion-game-buttons";const h=(w,f)=>{const y=document.createElement("button");y.type="button",y.className="emotion-game-button",y.textContent=w,y.addEventListener("click",f),p.appendChild(y)},m=document.createElement("div");m.style.cssText="font-size:16px;min-height:1.3em;text-align:center;display:flex;flex-direction:column;align-items:center";const x=(w,f)=>{if(g("say:",w,f?.label),m.textContent=w,!f)return;const y=document.createElement("div");y.className="emotion-game-buttons";const D=document.createElement("button");D.type="button",D.className="emotion-game-button",D.textContent=f.label,D.addEventListener("click",f.run),y.appendChild(D),m.appendChild(y)};j.length&&(h("📤 Share",()=>{g("Share button: click"),Qe(x)}),h("📸 Save picture",()=>{k?Q():Ke()})),h("▶ Play again",()=>Ce());const S=document.createElement("div");S.textContent="The pictures stay on this device until you share them - nothing is uploaded.",S.style.cssText="font-size:12px;opacity:0.7;margin-top:4px",P.append(a,p,m,c,S),P.style.display="flex",g("showGallery: shown",{snapshots:j.length,prepared:!!k})},Ce=()=>{l&&(j=[],ee++,k=null,P&&(P.style.display="none"),l.restart(performance.now()/1e3))};t.setup=()=>{const o=t.createCanvas(e.width,e.height,t.WEBGL);e.preserveDrawingBuffer!==!1&&t.setAttributes?.("preserveDrawingBuffer",!0),oe=n?.graphicProcessor??new Oe(t,C),T=o?.elt;const a=T?.parentElement;if(a&&T){if(a.querySelector(".emotion-game-parade")?.remove(),a.querySelector(".emotion-game-gallery")?.remove(),P=document.createElement("div"),P.className="emotion-game-gallery",P.style.cssText="position:absolute;inset:0;z-index:3;display:none;flex-direction:column;align-items:center;overflow:auto;padding:16px;background:rgba(10,10,10,0.92);color:#fff;font:700 16px/1.3 system-ui,sans-serif;box-sizing:border-box",a.appendChild(P),a.addEventListener("pointerdown",O=>{if(P?.style.display!=="flex")return;const F=O.target;g("gallery pointerdown",{target:F?.tagName,className:F?.className,text:F?.textContent?.slice(0,20)})},!0),!document.getElementById("emotion-game-parade-style")){const O=document.createElement("style");O.id="emotion-game-parade-style",O.textContent="@keyframes emotion-game-parade { from { transform: translateX(-120px) } to { transform: translateX(var(--parade-width, 1200px)) } }",document.head.appendChild(O)}if(!document.getElementById("emotion-game-gallery-style")){const O=document.createElement("style");O.id="emotion-game-gallery-style",O.textContent=".emotion-game-buttons { display:flex; gap:10px; margin:14px 0 10px; flex-wrap:wrap; justify-content:center; width:100%; max-width:440px; }.emotion-game-buttons .emotion-game-button { font:700 16px/1 system-ui,sans-serif; padding:14px 22px; min-height:44px; flex:1 1 auto; border:0; border-radius:8px; cursor:pointer; background:#38bdf8; color:#0f172a; }.emotion-game-buttons .emotion-game-button:active { transform: scale(0.97); }@media (max-width: 520px) { .emotion-game-buttons { flex-direction:column; max-width:none; } .emotion-game-buttons .emotion-game-button { width:100%; } }",document.head.appendChild(O)}B=document.createElement("div"),B.className="emotion-game-parade",B.style.cssText=`position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:${jt()}`,B.style.setProperty("--parade-width",`${a.clientWidth+120}px`),a.insertBefore(B,T),T.style.position="relative",T.style.zIndex="1",a.querySelector(".emotion-game-hud")?.remove();const c=document.createElement("div");c.className="emotion-game-hud",c.style.cssText="position:absolute;top:8px;left:0;right:0;z-index:2;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;color:#fff;font:700 18px/1.2 system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,0.8)";const p=O=>{const F=document.createElement("div");return F.style.cssText=O,c.appendChild(F),F};A={root:c,score:p("font-size:22px"),target:p("font-size:72px;line-height:1.1;transition:transform 0.1s"),label:p("font-size:16px"),time:p("font-size:14px;opacity:0.85"),status:p("font-size:12px;opacity:0.7")},a.appendChild(c),a.querySelector(".emotion-game-calibration")?.remove();const h=document.createElement("div");h.className="emotion-game-calibration",h.style.cssText="position:absolute;top:0;left:0;right:0;z-index:4;display:none;flex-direction:column;align-items:center;gap:8px;color:#fff;font:700 17px/1.35 system-ui,sans-serif;text-align:center;padding:14px 20px 30px;background:linear-gradient(180deg, rgba(10,10,10,0.94) 55%, rgba(10,10,10,0))";const m=document.createElement("div");m.className="emotion-game-calibration-emoji",m.textContent=ut;const x=document.createElement("div");x.className="emotion-game-calibration-title",x.textContent="Make this face";const S=document.createElement("div");S.className="emotion-game-calibration-message";const w=document.createElement("div");w.className="emotion-game-calibration-bar";const f=document.createElement("div");f.className="emotion-game-calibration-fill",w.appendChild(f);const y=document.createElement("button");if(y.type="button",y.className="emotion-game-calibration-skip",y.textContent="Play without calibrating",y.addEventListener("click",()=>$e(performance.now()/1e3)),h.append(m,x,S,w,y),a.appendChild(h),R=h,K=S,le=f,!document.getElementById("emotion-game-calibration-style")){const O=document.createElement("style");O.id="emotion-game-calibration-style",O.textContent=".emotion-game-calibration-emoji { font-size:72px; line-height:1.1; }.emotion-game-calibration-title { font-size:20px; }.emotion-game-calibration-message { font-size:15px; opacity:0.9; max-width:340px; min-height:1.4em; }.emotion-game-calibration-bar { width:min(320px, 80%); height:10px; border-radius:999px; background:rgba(255,255,255,0.25); overflow:hidden; }.emotion-game-calibration-fill { height:100%; width:0; background:#38bdf8; transition:width 0.1s linear; }.emotion-game-calibration-skip { font:600 14px/1 system-ui,sans-serif; padding:10px 16px; min-height:40px; border:0; border-radius:999px; background:rgba(15,23,42,0.6); color:#fff;opacity:0.85;cursor:pointer;text-decoration:underline; }@media (max-width: 520px) { .emotion-game-calibration-emoji { font-size:56px; } .emotion-game-calibration-title { font-size:18px; } }.emotion-game-actions { position:absolute;left:0;right:0;bottom:12px;z-index:2;display:flex;justify-content:center;pointer-events:none; }.emotion-game-actions .emotion-game-calibrate-btn { pointer-events:auto; font:700 15px/1 system-ui,sans-serif; padding:12px 18px; min-height:44px; border:1px solid rgba(255,255,255,0.3); border-radius:999px; background:rgba(15,23,42,0.65); color:#e2e8f0; cursor:pointer; }.emotion-game-actions .emotion-game-calibrate-btn:active { transform:scale(0.97); }",document.head.appendChild(O)}a.querySelector(".emotion-game-actions")?.remove();const D=document.createElement("div");D.className="emotion-game-actions";const W=document.createElement("button");W.type="button",W.className="emotion-game-calibrate-btn",W.textContent="🎯 Calibrate",W.setAttribute("aria-label","Calibrate to your neutral face"),W.addEventListener("click",()=>ce(performance.now()/1e3)),D.appendChild(W),a.appendChild(D),a.querySelector(".emotion-game-camera")?.remove();const te=document.createElement("div");te.className="emotion-game-camera",te.style.cssText="position:absolute;inset:0;z-index:2;display:none;align-items:center;justify-content:center;pointer-events:none;color:#fff;font:700 20px/1.4 system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,0.8);text-align:center;padding:0 24px",a.appendChild(te),q=te}},t.keyPressed=()=>{(t.key==="n"||t.key==="N")&&ce(performance.now()/1e3),l?.over&&(t.key==="r"||t.key==="R"||t.key===" ")&&Ce()};let Te=!1,me=!1;return t.draw=async()=>{if(!me){me=!0;try{if(!oe)return;if(!Te){await v.init(),E.complete(),E.addPanel({type:I.PANEL,parentId:"bigBox",id:"videoPanel",width:be.width,height:be.height,mirrorTextureHorizontal:!0,position:{x:-we,y:0,z:0},video:m=>({kind:"webCam",data:{node:m.dataProviders.webCam?.node}}),fillColor:ue.white}),Te=!0;return}if(e.paused&&!E.isPaused()){E.pause();return}else!e.paused&&E.isPaused()&&E.resume();t.clear();const o=await E.step(oe),a=performance.now()/1e3,c=G.getStatus();if(c==="ERROR"){he(l?"📷 The camera is gone - the game stops here.":"📷 No camera - the game needs your camera, and it is not available."),Z(a);return}if(c!=="READY"){he("📷 Waiting for the camera…"),Z(a);return}if(he(""),!l&&!xe&&!H.isCalibrated&&!V&&ce(a),V){if(U.update(ie,a),Ve(),!U.isDone){Z(a);return}We(a)}l||(l=new _(a));const p=l?.target;se=!!l&&Dt(je(ie,z),z,l.spot);const h=l?.update(a,se&&re!==null&&Mt(l.target.id,re));if((h==="scored"||h==="timeout")&&p&&Je(p,h==="scored"),h==="scored"&&p&&Xe(p.emoji),h&&l?.over&&et(),Z(a),!o.running)return}finally{me=!1}}},E}const $t=`import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import {
    FaceWorldData,
    HeadTrackingDataProvider,
    type HeadTrackingDataProviderConfig,
    type ObserverDataProviderLib
} from "../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../scene/providers/web_cam_data_provider.ts";
import type { VideoPixels } from "../../scene/types.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES, LOOK_MODES, PROJECTION_TYPES,
    type ColorRGBA,
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
import {
    addEmojiFace, ExpressionReader, mouthPose, type FaceShape,
} from "./emoji_face.ts";
import {
    CALIBRATION_SECONDS, CalibrationPhase, NEUTRAL_EMOJI,
} from "./emotion_game_calibration.ts";
import type { Emotion } from "../../scene/drivers/mediapipe/face_expressions.ts";
import type { VideoSource } from "../../scene/video/types.ts";

/**
 * SHOWROOM: Emotion Game
 *
 * Make the face the game asks for: your webcam on the left, your emoji on the right.
 */
export const emotionGameExplanation = \`
<div class="concept">
<p>A game built on the face expressions of tutorial 11. Every round shows an emoji - make that face and hold it for half a second to score. A round lasts ten seconds, a missed one costs one of your three lives, and the whole game lasts at most a minute and a half. Your webcam is on the left, and on the right the emoji face copies yours, so you can see what the game sees. The game needs your camera: there is no prerecorded clip to fall back on, and without the camera there is no game.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>The face cam</strong> - the webcam panel shows the whole camera frame, kept in the camera's own aspect so nothing is cut off.</li>
<li><strong>The face</strong> - <code>addEmojiFace</code> (<code>emoji_face.ts</code>) draws the emoji, here beside the webcam, turning with your head and leaning with it too.</li>
<li><strong>The calibration</strong> - before the first round the game asks for the neutral face (😐): make it and hold it still, and the game counts the still seconds (<code>CalibrationPhase</code>, <code>emotion_game_calibration.ts</code>). Three still seconds and the frames of that relaxed face are averaged into <em>your</em> neutral face (<code>calibratedRanges</code>), which the reader then uses - that is what makes the hard faces (😠 😮) read right. The head may not move, turn or blink while the seconds run; the game waits for the calibration, and its clock does not run. The <em>🎯 Calibrate</em> button on the screen - there is no keyboard on a phone - or <kbd>N</kbd> does it again whenever you want.</li>
<li><strong>Reading the expressions</strong> - <code>ExpressionReader</code> (<code>emoji_face.ts</code>) reads the face with those ranges; it smooths sleepy over time, so a blink is not a nap.</li>
<li><strong>Matching</strong> - <code>matchesTarget</code> checks the face against the round's emoji: the strongest emotion for 😢 😠 😮 😴, a smile that is not the open grin for 🙂, the open grin for 😃, one eye closed for 😉.</li><li><strong>The ring</strong> - every round also puts a ring somewhere around the emoji (one of the <code>GAME_SPOTS</code>): lean so the emoji gets into it (<code>inSpot</code>, within <code>SPOT_RADIUS</code>) and the ring turns green. Only the face made inside the ring counts.</li>
<li><strong>The rounds</strong> - <code>EmotionGame</code> keeps the score, the lives, the target and the clock: hold the face in the ring for <code>HOLD_SECONDS</code> to score; a round that runs out after <code>ROUND_SECONDS</code> costs one of the <code>LIVES</code>. The game is over with none left, or after <code>GAME_SECONDS</code> however well it goes (<kbd>R</kbd> or space plays again).</li><li><strong>The pictures</strong> - every round ends with a snapshot of the canvas, you and your emoji side by side, stamped with the target and ✅ / ❌. At the end they show together, and <em>Save picture</em> puts them in one collage (<code>collageLayout</code>). <em>Share</em> opens the system share sheet with the collage attached where the browser has one; otherwise it copies the collage and opens a post on X (<code>postIntentUrl</code>) to paste it into. They stay on your device until you share them.</li>
<li><strong>The parade</strong> - a match sends its emoji flying across behind the scene: plain page emoji under the canvas, which is cleared transparent, so the 3D face and the webcam pass in front of them.</li>
</ol>

<p>Angry is the hard one: the calibration is what makes it work, so make the 😐 face at the start of the game - and calibrate again if you change how you sit.</p>

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

/** How much of the face's movement the emoji follows: enough to reach every ring by leaning. */
const EMOJI_FOLLOW_SCALE = 0.6;
/** Maximum distance the emoji may move from its place, in scene units. */
const EMOJI_FOLLOW_LIMIT = 260;

/**
 * Where the emoji sits: beside the webcam, but leaning with the head, the way the head box
 * follows the face in tutorial 11. The face's place in the frame (its offset from the middle)
 * moves it - a fraction at a time, the same up and down as across, and never off the screen.
 */
export function emojiFollowPosition(
    face: { worldPosition: { x: number; y: number; z: number } } | null | undefined,
    home: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
    if (!face) return home;
    const cap = (value: number) => Math.max(-EMOJI_FOLLOW_LIMIT, Math.min(EMOJI_FOLLOW_LIMIT, value));
    return {
        x: home.x + cap(face.worldPosition.x * EMOJI_FOLLOW_SCALE),
        y: home.y + cap(face.worldPosition.y * EMOJI_FOLLOW_SCALE),
        z: home.z,
    };
}

/**
 * Where the emoji has to be: a place around its home, in scene units. The right side reaches
 * less far, since the emoji sits on the right of the canvas already.
 */
export interface GameSpot {
    readonly x: number;
    readonly y: number;
}

export const GAME_SPOTS: readonly GameSpot[] = [
    { x: 0, y: 0 },
    { x: -240, y: 0 },
    { x: 130, y: 0 },
    { x: -150, y: -120 },
    { x: 110, y: -120 },
    { x: -150, y: 120 },
    { x: 110, y: 120 },
];

/** The ring: white to get into, green once the emoji is in it, and gone between games. */
const RING_COLOR = { red: 255, green: 255, blue: 255, alpha: 0.7 } as ColorRGBA;
const RING_REACHED = { red: 74, green: 222, blue: 128, alpha: 0.9 } as ColorRGBA;
const RING_HIDDEN = { red: 255, green: 255, blue: 255, alpha: 0 } as ColorRGBA;

/** How near the emoji's middle must be to the ring's middle to be in it, in scene units. */
export const SPOT_RADIUS = 80;

/** Whether the emoji is in the ring: its place, from its home, near enough to the spot. */
export function inSpot(
    position: { x: number; y: number },
    home: { x: number; y: number },
    spot: GameSpot,
): boolean {
    return Math.hypot(position.x - home.x - spot.x, position.y - home.y - spot.y) <= SPOT_RADIUS;
}

/**
 * The game: a target and a spot per round, the score, the lives and the clocks (seconds, from update's now).
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
    /** Where the emoji has to be to score this round. */
    spot: GameSpot;
    private gameStart: number;
    private roundStart: number;
    private holdStart: number | null = null;
    private celebrateUntil: number | null = null;
    /** When the clock was stopped (the player is calibrating), null while it runs. */
    private pausedAt: number | null = null;

    private readonly random: () => number;

    constructor(now: number, random: () => number = Math.random) {
        this.random = random;
        this.target = this.pickTarget(null);
        this.spot = this.pickSpot(null);
        this.gameStart = now;
        this.roundStart = now;
    }

    /** Whether the game is over: no lives left, or its time ran out. */
    public get over(): boolean {
        return this.lives <= 0 || this.timeUp;
    }

    /** Stops the clock: the player is calibrating, and that time is not the game's. */
    public pause(now: number): void {
        if (this.pausedAt !== null) return;
        this.pausedAt = now;
        // A hold that was running is dropped: the player was not making the face any more.
        this.holdStart = null;
    }

    /** The clock goes on: the time spent calibrating does not count against the game. */
    public resume(now: number): void {
        if (this.pausedAt === null) return;
        const paused = now - this.pausedAt;
        this.gameStart += paused;
        this.roundStart += paused;
        if (this.holdStart !== null) this.holdStart += paused;
        if (this.celebrateUntil !== null) this.celebrateUntil += paused;
        this.pausedAt = null;
    }

    /** The time that passed since a moment, without the time the clock was stopped. */
    private running(now: number, since: number): number {
        const paused = this.pausedAt === null ? 0 : now - this.pausedAt;
        return now - since - paused;
    }

    /** Seconds left in this game. */
    public gameSecondsLeft(now: number): number {
        return Math.max(0, EmotionGame.GAME_SECONDS - this.running(now, this.gameStart));
    }

    /** A new game: score 0, all the lives, the full time, a new target. */
    public restart(now: number): void {
        this.score = 0;
        this.lives = EmotionGame.LIVES;
        this.timeUp = false;
        this.gameStart = now;
        this.roundStart = now;
        this.pausedAt = null;
        this.celebrateUntil = null;
        this.nextRound(now);
    }

    /** Seconds left in this round. */
    public secondsLeft(now: number): number {
        return Math.max(0, EmotionGame.ROUND_SECONDS - this.running(now, this.roundStart));
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
        this.spot = this.pickSpot(this.spot);
        this.roundStart = now;
        this.holdStart = null;
    }

    /** A random target, never the same twice in a row. */
    private pickTarget(previous: GameTarget | null): GameTarget {
        const choices = GAME_TARGETS.filter(target => target !== previous);
        return choices[Math.min(choices.length - 1, Math.floor(this.random() * choices.length))];
    }

    /** A random spot, never the same twice in a row: every round the player moves. */
    private pickSpot(previous: GameSpot | null): GameSpot {
        const choices = GAME_SPOTS.filter(spot => spot !== previous);
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
const COLLAGE_COLUMNS = 3;
const COLLAGE_TITLE_HEIGHT = 70;
const COLLAGE_GAP = 8;

export function collageLayout(count: number, cell: { width: number; height: number }, columns = COLLAGE_COLUMNS, titleHeight = COLLAGE_TITLE_HEIGHT): {
    width: number; height: number; cells: { x: number; y: number }[];
} {
    const used = Math.max(1, Math.min(columns, count));
    const rows = Math.max(1, Math.ceil(count / used));
    const gap = COLLAGE_GAP;
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

    const faceDataProvider = extraArgs?.faceDataProvider ?? new HeadTrackingDataProvider(
        p,
        headTrackingConfig,
        ["webCam"],
    );

    const loader = new P5AssetLoader(p);
    let gp: P5GraphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    const dataProviderLib: ObserverDataProviderLib = {
        webCam: webCamProvider, // needed as parent dependency for headTracker
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
    /** The tracked face of this frame: the calibration reads it. */
    let currentFace: FaceWorldData | null = null;

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
            currentFace = face;
            currentShape = face ? reader.shapeOf(face) : null;
            if (!face) return { pitch: 0, yaw: 0, roll: 0 };
            return { yaw: face.stick.yaw, pitch: face.stick.pitch, roll: face.stick.roll };
        },
        shapeOf: (ctx) => reader.shapeOf(ctx.dataProviders['headTracker']),
    });

    // Starts once the scene is ready, so the first round does not run down while it loads.
    let game: EmotionGame | null = null;
    /** Whether the emoji is in the round's ring (last frame's): the ring shows it in green. */
    let spotReached = false;

    // The ring the emoji has to get into: around the emoji's head, at the round's spot.
    world.addTorus({
        type: ELEMENT_TYPES.TORUS,
        id: 'spot',
        parentId: 'bigBox',
        radius: 190,
        tubeRadius: 10,
        position: () => game
            ? { x: emojiHome.x + game.spot.x, y: emojiHome.y + game.spot.y, z: emojiHome.z }
            : emojiHome,
        fillColor: () => !game || game.over ? RING_HIDDEN : spotReached ? RING_REACHED : RING_COLOR,
    });

    // The calibration: the player makes the neutral face and holds it still. The frames of that
    // still face become their own neutral face, so the game counts from their face.
    const calibration = new CalibrationPhase();
    /** Whether the calibration overlay is up (the game waits for it). */
    let calibrationOpen = false;
    /** Whether the player gave up on the first calibration: the game plays without it. */
    let calibrationSkipped = false;
    /** The overlay with the face to make and the progress of the still time. */
    let calibrationOverlay: HTMLElement | undefined;
    let calibrationMessage: HTMLElement | undefined;
    let calibrationFill: HTMLElement | undefined;

    /** Opens the calibration: the neutral face, held still. The game waits for it. */
    const startCalibration = (now: number) => {
        calibration.reset();
        calibrationOpen = true;
        // The clock of a game in progress stops: calibrating is not playing.
        game?.pause(now);
        if (calibrationOverlay) calibrationOverlay.style.display = 'flex';
    };

    /** The calibration is done: the player's own neutral face is known. */
    const finishCalibration = (now: number) => {
        const ranges = calibration.neutralRanges;
        if (ranges) reader.setCalibration(ranges);
        calibrationOpen = false;
        if (calibrationOverlay) calibrationOverlay.style.display = 'none';
        game?.resume(now);
    };

    /** Without the calibration: the game counts from everybody else's neutral face. */
    const skipCalibration = (now: number) => {
        calibrationSkipped = true;
        calibrationOpen = false;
        if (calibrationOverlay) calibrationOverlay.style.display = 'none';
        game?.resume(now);
    };

    /** What the overlay says: the face to make, and how long it is held still. */
    const updateCalibrationOverlay = () => {
        if (!calibrationOverlay) return;
        calibrationOverlay.style.display = 'flex';
        const left = Math.max(0, Math.ceil(CALIBRATION_SECONDS * (1 - calibration.progress)));
        const text = calibration.phaseState === 'waiting'
            ? 'We cannot see your face yet - look at the camera.'
            : \`Hold still... \${left}\`;
        if (calibrationMessage && calibrationMessage.textContent !== text) calibrationMessage.textContent = text;
        if (calibrationFill) calibrationFill.style.width = \`\${Math.round(calibration.progress * 100)}%\`;
    };

    // The game's panel over the canvas: score, the target emoji, the time left and the hold.
    let hud: { root: HTMLElement; score: HTMLElement; target: HTMLElement; label: HTMLElement; time: HTMLElement; status: HTMLElement } | undefined;
    /** The note over the scene while the camera is missing or still coming up. */
    let cameraMessageElement: HTMLElement | undefined;
    const updateCameraMessage = (text: string) => {
        if (!cameraMessageElement) return;
        if (cameraMessageElement.textContent !== text) cameraMessageElement.textContent = text;
        cameraMessageElement.style.display = text ? 'flex' : 'none';
    };
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
        set(hud.label, celebrating ? 'Nice!' : \`\${game.target.label} - in the ring\`);
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
    // Everything the Share button does goes to the console under this tag, to see where it stops.
    const shareLog = (...args: unknown[]) => console.log('[share]', ...args);
    const prepareShare = async () => {
        shareLog('prepareShare: start', { snapshots: snapshots.length, hasGame: !!game });
        prepared = null;
        const collage = await buildCollage();
        shareLog('prepareShare: collage', collage ? \`\${collage.width}x\${collage.height}\` : null);
        if (!collage || !game) { shareLog('prepareShare: no collage or no game, nothing to share'); return; }
        const [jpeg, png] = await Promise.all([toBlob(collage, 'image/jpeg'), toBlob(collage, 'image/png')]);
        shareLog('prepareShare: blobs', { jpeg: jpeg?.size ?? null, png: png?.size ?? null });
        if (!jpeg || !png) { shareLog('prepareShare: a blob is missing, nothing to share'); return; }
        prepared = {
            text: shareText(game.score, location.href),
            file: new File([jpeg], \`emotion-game-\${game.score}.jpg\`, { type: 'image/jpeg' }),
            png,
            jpegUrl: collage.toDataURL('image/jpeg', 0.9),
        };
        shareLog('prepareShare: ready', { file: prepared.file.name, size: prepared.file.size, text: prepared.text });
    };

    const downloadPrepared = () => {
        shareLog('downloadPrepared', { prepared: !!prepared, hasGame: !!game });
        if (!prepared || !game) return;
        const link = document.createElement('a');
        link.download = prepared.file.name;
        link.href = prepared.jpegUrl;
        link.click();
    };

    /**
     * Shares the collage, on the player's click and without waiting for anything before: the
     * system share sheet with the picture attached where the browser has one (phones, Safari...);
     * otherwise the picture goes to the clipboard first and X's post page opens from a second
     * button, after the player has read that the picture is to be pasted there.
     * Nothing in here may throw: the button has to end with a message, whatever the browser does.
     */
    type ShareAction = { label: string; run: () => void };
    const shareCollage = (say: (message: string, action?: ShareAction) => void) => {
        shareLog('shareCollage: clicked', {
            prepared: !!prepared,
            secureContext: window.isSecureContext,
            share: typeof navigator.share,
            canShare: typeof navigator.canShare,
            clipboardWrite: typeof navigator.clipboard?.write,
            clipboardItem: typeof ClipboardItem,
            userActivation: navigator.userActivation?.isActive,
            userAgent: navigator.userAgent,
        });
        try {
            if (!prepared) {
                say('The picture is still being made - try again in a moment.');
                return;
            }
            const { text, file, png } = prepared;
            // Share natively on phones and tablets; the canShare check is optional, so on browsers
            // without canShare we try share and fall back if it fails. Computers are left out: their
            // browsers can take the share and report it done without ever showing a sheet.
            const touchDevice = window.matchMedia?.('(pointer: coarse)').matches ?? false;
            shareLog('shareCollage: touchDevice', touchDevice);
            let canShareFiles = false;
            if (touchDevice && typeof navigator.share === 'function') {
                try {
                    // canShare might not exist (older Safari) or might throw
                    canShareFiles = navigator.canShare ? navigator.canShare({ files: [file] }) : true;
                } catch (error) {
                    // If canShare throws, we don't know - fall back to X + clipboard
                    shareLog('shareCollage: canShare threw', error);
                    canShareFiles = false;
                }
            }
            shareLog('shareCollage: canShareFiles', canShareFiles);
            if (canShareFiles) {
                const failed = () => {
                    downloadPrepared();
                    say('Sharing did not open - the picture is saved, attach it to your post.');
                };
                try {
                    shareLog('shareCollage: calling navigator.share');
                    navigator.share({ files: [file], text })
                        .then(() => { shareLog('shareCollage: navigator.share resolved'); say('Shared.'); })
                        .catch((error: Error) => {
                            shareLog('shareCollage: navigator.share rejected', error?.name, error?.message, error);
                            if (error.name === 'AbortError') { say('Share cancelled.'); return; }
                            failed();
                        });
                    shareLog('shareCollage: navigator.share called, waiting for the share sheet');
                } catch (error) {
                    shareLog('shareCollage: navigator.share threw', error);
                    failed();
                }
                return;
            }
            // The picture is copied on this click, and X opens on the next one: the player reads how to
            // add the picture before leaving for X, where this page cannot tell them anymore.
            let copied: Promise<void>;
            try {
                shareLog('shareCollage: writing the picture to the clipboard', { png: png.size });
                copied = navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
            } catch (error) {
                copied = Promise.reject(error);
            }
            const paste = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘V' : 'Ctrl+V';
            const openPost: ShareAction = {
                label: '𝕏 Open the post',
                run: () => {
                    const intent = postIntentUrl(text);
                    shareLog('shareCollage: opening post', intent);
                    const post = window.open(intent, '_blank');
                    shareLog('shareCollage: window.open returned', post ? 'a window' : post);
                    if (!post) say('The post did not open - allow pop-ups for this page and try again.', openPost);
                },
            };
            copied
                .then(() => {
                    shareLog('shareCollage: clipboard written');
                    say(\`✅ Picture copied. In the X post, press \${paste} to add it.\`, openPost);
                })
                .catch((error: unknown) => {
                    shareLog('shareCollage: clipboard failed', error);
                    downloadPrepared();
                    say('📥 Picture saved to your downloads. In the X post, attach it with the 🖼 button.', openPost);
                });
        } catch (error) {
            shareLog('shareCollage: unexpected error', error);
            // Last resort: if anything unexpected happens, at least try to download
            try {
                downloadPrepared();
                say('Share failed - the picture is saved to your downloads.');
            } catch {
                // If even this fails, show a basic message
                say('Share is not available. Try taking a screenshot instead.');
            }
            console.error('Share button error:', error);
        }
    };

    // The gallery is shown once the game is over, but making the collage takes a moment: a
    // gallery asked for twice (or asked for and then restarted) must not fight over the screen.
    let galleryRequest = 0;
    const showGallery = async () => {
        shareLog('showGallery: start', { hasGallery: !!gallery, hasGame: !!game });
        if (!gallery || !game) return;
        const request = ++galleryRequest;
        // The collage is made before the gallery appears, so the Share button works on the
        // first click: the browser only allows the share sheet, a new tab and the clipboard
        // during the click itself.
        await prepareShare().catch(error => shareLog('showGallery: prepareShare threw', error));
        if (request !== galleryRequest || !gallery || !game) {
            shareLog('showGallery: dropped', { request, galleryRequest, hasGallery: !!gallery, hasGame: !!game });
            return;
        }
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
        buttons.className = 'emotion-game-buttons';
        const button = (label: string, onClick: () => void) => {
            const element = document.createElement('button');
            element.type = 'button';
            element.className = 'emotion-game-button';
            element.textContent = label;
            element.addEventListener('click', onClick);
            buttons.appendChild(element);
        };
        const message = document.createElement('div');
        message.style.cssText = 'font-size:16px;min-height:1.3em;text-align:center;display:flex;flex-direction:column;align-items:center';
        const say = (text: string, action?: ShareAction) => {
            shareLog('say:', text, action?.label);
            message.textContent = text;
            if (!action) return;
            const next = document.createElement('div');
            next.className = 'emotion-game-buttons';
            const element = document.createElement('button');
            element.type = 'button';
            element.className = 'emotion-game-button';
            element.textContent = action.label;
            element.addEventListener('click', action.run);
            next.appendChild(element);
            message.appendChild(next);
        };
        if (snapshots.length) {
            button('📤 Share', () => { shareLog('Share button: click'); shareCollage(say); });
            button('📸 Save picture', () => { if (prepared) downloadPrepared(); else void saveCollage(); });
        }
        button('▶ Play again', () => restart());
        const note = document.createElement('div');
        note.textContent = 'The pictures stay on this device until you share them - nothing is uploaded.';
        note.style.cssText = 'font-size:12px;opacity:0.7;margin-top:4px';
        gallery.append(title, buttons, message, grid, note);
        gallery.style.display = 'flex';
        shareLog('showGallery: shown', { snapshots: snapshots.length, prepared: !!prepared });
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
        if (config.preserveDrawingBuffer !== false) {
            // Keep the last frame readable, for the snapshots (WebGL clears it once shown otherwise).
            p.setAttributes?.('preserveDrawingBuffer', true);
        }
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
            // A click on the gallery that never reaches its buttons (something on top of them) shows up here.
            box.addEventListener('pointerdown', event => {
                if (gallery?.style.display !== 'flex') return;
                const target = event.target as HTMLElement | null;
                shareLog('gallery pointerdown', { target: target?.tagName, className: target?.className, text: target?.textContent?.slice(0, 20) });
            }, true);
            if (!document.getElementById('emotion-game-parade-style')) {
                const style = document.createElement('style');
                style.id = 'emotion-game-parade-style';
                style.textContent = '@keyframes emotion-game-parade { from { transform: translateX(-120px) } to { transform: translateX(var(--parade-width, 1200px)) } }';
                document.head.appendChild(style);
            }
            if (!document.getElementById('emotion-game-gallery-style')) {
                const style = document.createElement('style');
                style.id = 'emotion-game-gallery-style';
                // The buttons come first and take a finger-sized target: on a phone they were
                // below every picture, small, and hard to hit.
                style.textContent = '.emotion-game-buttons { display:flex; gap:10px; margin:14px 0 10px; flex-wrap:wrap; justify-content:center; width:100%; max-width:440px; }'
                    + '.emotion-game-buttons .emotion-game-button { font:700 16px/1 system-ui,sans-serif; padding:14px 22px; min-height:44px; flex:1 1 auto; border:0; border-radius:8px; cursor:pointer; background:#38bdf8; color:#0f172a; }'
                    + '.emotion-game-buttons .emotion-game-button:active { transform: scale(0.97); }'
                    + '@media (max-width: 520px) { .emotion-game-buttons { flex-direction:column; max-width:none; } .emotion-game-buttons .emotion-game-button { width:100%; } }';
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
            // The calibration overlay: the face to make, and how long it is held still. It is up
            // before the first round and whenever the player asks to calibrate again. It sits at
            // the top of the scene and fades out, so the player keeps seeing their own face.
            box.querySelector('.emotion-game-calibration')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'emotion-game-calibration';
            overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;z-index:4;display:none;flex-direction:column;align-items:center;gap:8px;color:#fff;font:700 17px/1.35 system-ui,sans-serif;text-align:center;padding:14px 20px 30px;'
                + 'background:linear-gradient(180deg, rgba(10,10,10,0.94) 55%, rgba(10,10,10,0))';
            const overlayEmoji = document.createElement('div');
            overlayEmoji.className = 'emotion-game-calibration-emoji';
            overlayEmoji.textContent = NEUTRAL_EMOJI;
            const overlayTitle = document.createElement('div');
            overlayTitle.className = 'emotion-game-calibration-title';
            overlayTitle.textContent = 'Make this face';
            const overlayMessage = document.createElement('div');
            overlayMessage.className = 'emotion-game-calibration-message';
            const overlayBar = document.createElement('div');
            overlayBar.className = 'emotion-game-calibration-bar';
            const overlayFill = document.createElement('div');
            overlayFill.className = 'emotion-game-calibration-fill';
            overlayBar.appendChild(overlayFill);
            const overlaySkip = document.createElement('button');
            overlaySkip.type = 'button';
            overlaySkip.className = 'emotion-game-calibration-skip';
            overlaySkip.textContent = 'Play without calibrating';
            overlaySkip.addEventListener('click', () => skipCalibration(performance.now() / 1000));
            overlay.append(overlayEmoji, overlayTitle, overlayMessage, overlayBar, overlaySkip);
            box.appendChild(overlay);
            calibrationOverlay = overlay;
            calibrationMessage = overlayMessage;
            calibrationFill = overlayFill;
            if (!document.getElementById('emotion-game-calibration-style')) {
                const style = document.createElement('style');
                style.id = 'emotion-game-calibration-style';
                style.textContent = '.emotion-game-calibration-emoji { font-size:72px; line-height:1.1; }'
                    + '.emotion-game-calibration-title { font-size:20px; }'
                    + '.emotion-game-calibration-message { font-size:15px; opacity:0.9; max-width:340px; min-height:1.4em; }'
                    + '.emotion-game-calibration-bar { width:min(320px, 80%); height:10px; border-radius:999px; background:rgba(255,255,255,0.25); overflow:hidden; }'
                    + '.emotion-game-calibration-fill { height:100%; width:0; background:#38bdf8; transition:width 0.1s linear; }'
                    + '.emotion-game-calibration-skip { font:600 14px/1 system-ui,sans-serif; padding:10px 16px; min-height:40px; border:0; border-radius:999px; background:rgba(15,23,42,0.6); color:#fff;opacity:0.85;cursor:pointer;text-decoration:underline; }'
                    + '@media (max-width: 520px) { .emotion-game-calibration-emoji { font-size:56px; } .emotion-game-calibration-title { font-size:18px; } }'
                    + '.emotion-game-actions { position:absolute;left:0;right:0;bottom:12px;z-index:2;display:flex;justify-content:center;pointer-events:none; }'
                    + '.emotion-game-actions .emotion-game-calibrate-btn { pointer-events:auto; font:700 15px/1 system-ui,sans-serif; padding:12px 18px; min-height:44px; border:1px solid rgba(255,255,255,0.3); border-radius:999px; background:rgba(15,23,42,0.65); color:#e2e8f0; cursor:pointer; }'
                    + '.emotion-game-actions .emotion-game-calibrate-btn:active { transform:scale(0.97); }';
                document.head.appendChild(style);
            }
            // The calibration on the screen: on a phone there is no keyboard to press N on.
            box.querySelector('.emotion-game-actions')?.remove();
            const actions = document.createElement('div');
            actions.className = 'emotion-game-actions';
            const calibrateButton = document.createElement('button');
            calibrateButton.type = 'button';
            calibrateButton.className = 'emotion-game-calibrate-btn';
            calibrateButton.textContent = '🎯 Calibrate';
            calibrateButton.setAttribute('aria-label', 'Calibrate to your neutral face');
            calibrateButton.addEventListener('click', () => startCalibration(performance.now() / 1000));
            actions.appendChild(calibrateButton);
            box.appendChild(actions);
            box.querySelector('.emotion-game-camera')?.remove(); // from a previous run
            const cameraNote = document.createElement('div');
            cameraNote.className = 'emotion-game-camera';
            cameraNote.style.cssText = 'position:absolute;inset:0;z-index:2;display:none;align-items:center;justify-content:center;pointer-events:none;color:#fff;font:700 20px/1.4 system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,0.8);text-align:center;padding:0 24px';
            box.appendChild(cameraNote);
            cameraMessageElement = cameraNote;
        }
    };

    p.keyPressed = () => {
        if (p.key === 'n' || p.key === 'N') {
            // The same calibration the button on the screen starts.
            startCalibration(performance.now() / 1000);
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
                // The camera only: the game needs your camera, there is no video fallback.
                video: (ctx: ResolutionContext<ObserverDataProviderLib>): VideoSource => {
                    const webcamNode = ctx.dataProviders['webCam']?.node;
                    return { kind: 'webCam', data: { node: webcamNode } };
                },
                fillColor: COLORS.white,
            });

            initialized = true;
            // The game itself waits for the camera: no camera, no game (no video fallback).
            return;
        }

        if (config.paused && !world.isPaused()) {
            world.pause();
            // Don't clear background - keep last frame visible
            return;
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }

        // Transparent, so the parade behind the canvas shows where nothing is drawn.
        p.clear();
        const result = await world.step(gp);
        const now = performance.now() / 1000;

        // No camera, no game: the camera is the only source of the face - there is no clip to
        // fall back on. The game starts when the camera is ready, and says so when the browser
        // does not give us one.
        const cameraStatus = webCamProvider.getStatus();
        if (cameraStatus === 'ERROR') {
            updateCameraMessage(game
                ? '📷 The camera is gone - the game stops here.'
                : '📷 No camera - the game needs your camera, and it is not available.');
            updateHud(now);
            return;
        }
        if (cameraStatus !== 'READY') {
            updateCameraMessage('📷 Waiting for the camera…');
            updateHud(now);
            return;
        }
        updateCameraMessage('');

        // The calibration phase: the neutral face, held still. It comes before the first round,
        // and the player can ask for it again while the game runs.
        if (!game && !calibrationSkipped && !reader.isCalibrated && !calibrationOpen) {
            startCalibration(now);
        }
        if (calibrationOpen) {
            calibration.update(currentFace, now);
            updateCalibrationOverlay();
            if (!calibration.isDone) {
                // The game waits for the calibration: its clock does not run yet.
                updateHud(now);
                return;
            }
            finishCalibration(now);
        }

        if (!game) {
            game = new EmotionGame(now);
        }

        const target = game?.target;
        spotReached = !!game && inSpot(emojiFollowPosition(currentFace, emojiHome), emojiHome, game.spot);
        const event = game?.update(now, spotReached && currentShape !== null && matchesTarget(game.target.id, currentShape));
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
`;ht("showroom-emotion-game","Emotion Game",Wt,$t,Lt,{preserveDrawingBuffer:!0},"img/loading/emotion-game.jpg");
//# sourceMappingURL=emotion-game-zzi94hql.js.map
