/* Elyra shared cutscenes: camera moves between keyframes, letterbox bars, a title card, subtitles, and a skip button.
   Dialogue is paced by the voices: a line never starts until the one before it has finished speaking, and a shot holds
   until its last line is done, so nothing is shown that is not also said. Used by all three chapters.

   CUTS.play(shots,{done(skipped),skip:true})   then call CUTS.update(dt) every frame while CUTS.on (it places the camera).
   A shot: {dur, cam:[[x,y,z],[x,y,z]] | camAt(u,t,out), look:[[x,y,z],[x,y,z]] | lookAt(u,t,out), fov:[a,b],
            small, cap (title card), say:[[at,who,text,tone,shown]], fn(t,dt,u), black:true (hold on black), fade:[in,out] seconds} */
const CUTS=(()=>{
  const css=document.createElement('style');css.textContent=`
.cs-layer{position:fixed;inset:0;z-index:7;pointer-events:none;opacity:0;transition:opacity .5s}
.cs-layer.on{opacity:1}
.cs-bar{position:absolute;left:0;right:0;height:11vh;background:#000;transition:transform .6s ease}
.cs-bar.t{top:0;transform:translateY(-100%)}.cs-bar.b{bottom:0;transform:translateY(100%)}
.cs-layer.on .cs-bar{transform:none}
.cs-black{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .9s}
.cs-card{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);width:min(680px,calc(100vw - 48px));text-align:center;color:#f3eef8;
  font:700 clamp(22px,4.4vw,40px)/1.2 'Chakra Petch','Arial Narrow',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;text-shadow:0 2px 10px #000;opacity:0;transition:opacity .7s}
.cs-card.on{opacity:1}
.cs-card small{display:block;font:400 clamp(11px,1.6vw,13px) 'JetBrains Mono',ui-monospace,Menlo,monospace;letter-spacing:.26em;color:rgba(236,226,246,.75);margin-bottom:8px}
.cs-sub{position:absolute;left:50%;bottom:calc(11vh + 14px);transform:translateX(-50%);width:min(720px,calc(100vw - 40px));text-align:center;color:#fff;
  font:500 clamp(14px,2.2vw,19px)/1.4 'Chakra Petch','Arial Narrow',system-ui,sans-serif;letter-spacing:.02em;text-shadow:0 2px 6px #000,0 0 2px #000;opacity:0;transition:opacity .25s}
.cs-sub.on{opacity:1}
.cs-sub b{display:block;font:700 11px 'JetBrains Mono',ui-monospace,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:#7fe3ff;margin-bottom:3px}
.cs-sub.enemy b{color:#c98aff}.cs-sub.alert b{color:#ff8a7a}
.cs-skip{position:absolute;right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 12px);pointer-events:auto;padding:8px 14px;border-radius:3px;
  border:1px solid rgba(255,255,255,.45);background:rgba(0,0,0,.5);color:#fff;font:700 11px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}
.cs-skip:focus-visible{outline:2px solid #7fe3ff;outline-offset:2px}
body.incut #app~*:not(.cs-layer):not(.flash):not(.fade):not(.pgend):not(.pz){visibility:hidden!important}
@media (prefers-reduced-motion:reduce){.cs-layer,.cs-bar,.cs-card,.cs-sub,.cs-black{transition:none}}`;
  document.head.appendChild(css);
  const L=document.createElement('div');L.className='cs-layer';
  L.innerHTML='<div class="cs-black"></div><div class="cs-bar t"></div><div class="cs-bar b"></div><div class="cs-card"></div><div class="cs-sub"><b></b><span></span></div><button class="cs-skip" type="button">Skip ›</button>';
  document.body.appendChild(L);
  const blackEl=L.querySelector('.cs-black'),card=L.querySelector('.cs-card'),sub=L.querySelector('.cs-sub'),skipBtn=L.querySelector('.cs-skip');
  const S={on:false,shots:null,i:0,t:0,opts:null,lines:null,shotDur:0,subT:0};
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_la=new THREE.Vector3(),_lb=new THREE.Vector3();
  const ease=k=>{k=Math.min(1,Math.max(0,k));return k*k*(3-2*k);};
  // how long a line takes to say (the shared audio knows each character's speaking rate)
  const est=(who,txt)=>typeof sfx!=='undefined'&&sfx.estimate?sfx.estimate(who,txt):txt.split(/\s+/).length/2.6+.4;
  const baseFov=camera.fov;
  // shots are framed for a wide screen; on a tall one (a phone held upright) widen the view so the sides of the shot stay in
  function fit(f){const a=camera.aspect||1;if(a>=1.4)return f;const h=2*Math.atan(Math.tan(f*Math.PI/360)*1.4)/Math.PI*180;return Math.min(115,2*Math.atan(Math.tan(h*Math.PI/360)/a)/Math.PI*180);}

  function showCard(sh){if(sh&&sh.cap){card.innerHTML=(sh.small?`<small>${sh.small}</small>`:'')+sh.cap;card.classList.add('on');}else card.classList.remove('on');}
  function startShot(){
    const sh=S.shots[S.i];S.t=0;
    S.lines=(sh.say||[]).map(([at,who,txt,tone,shown])=>({at:Math.min(at,.8),who,txt,tone,shown,   /* shown: what the subtitle says, when it isn't the words (a language nobody knows) */   /* no long silences before the first line */est:est(who,txt),start:-1,H:null}));
    // the camera move is stretched to fit the dialogue, so it never stalls mid-move waiting on a voice
    let t=0;for(const l of S.lines){t=Math.max(t,l.at)+l.est+.3;}
    S.shotDur=Math.max(sh.dur||3,t+.6);
    showCard(sh);
    if(sh.black&&S.i===0){blackEl.style.transition='none';blackEl.style.opacity=1;void blackEl.offsetWidth;blackEl.style.transition='';}   // open on black with no fade-in
    else blackEl.style.opacity=sh.black?1:0;
    camera.fov=fit(sh.fov?sh.fov[0]:S.fov0);camera.updateProjectionMatrix();
  }
  function play(shots,opts){
    S.on=true;S.shots=shots;S.i=0;S.opts=opts||{};skipBtn.hidden=S.opts.skip===false;S.fov0=S.opts.fov||baseFov;
    document.body.classList.add('incut');L.classList.add('on');
    try{if(document.exitPointerLock)document.exitPointerLock();}catch(_){}
    if(S.opts.hush&&typeof sfx!=='undefined'&&sfx.hush)sfx.hush();
    startShot();
    /* iPhone: Safari only lets a page start speaking inside a tap. The Heralds and The Empty Sky start their opening cutscene from the
       briefing's Start tap, but its first line waited a second or two, so it fell outside the tap and the whole cutscene stayed
       silent. While the tap is still live, start the first line now. */
    try{if(S.lines.length&&navigator.userActivation&&navigator.userActivation.isActive){S.lines[0].at=0;update(0);}}catch(_){}
  }
  function end(skipped){
    if(!S.on)return;S.on=false;L.classList.remove('on');document.body.classList.remove('incut');card.classList.remove('on');sub.classList.remove('on');blackEl.style.opacity=0;
    camera.fov=S.opts.fov||baseFov;camera.updateProjectionMatrix();
    if(skipped&&typeof sfx!=='undefined'&&sfx.hush)sfx.hush();
    const d=S.opts.done;S.opts={};if(d)d(!!skipped);
  }
  function lineDone(l){
    if(l.start<0)return false;
    const el=S.t-l.start;
    if(l.H&&l.H.voiced)return l.H.done||el>l.est*2.2+3;   // the voice is speaking: wait for it (with a safety cap)
    return el>=l.est;                                     // muted or no speech: wait as long as it would take to say
  }
  function update(dt){
    if(!S.on)return false;
    if(typeof fpLayers==='function')fpLayers(false);   // first-person chapters: cutscenes show the player's body, not the viewmodel
    const sh=S.shots[S.i];S.t+=dt;
    // dialogue: each line waits for its cue and for the line before it
    let all=true,prev=null;
    for(const l of S.lines){
      if(l.start<0){
        if(S.t>=l.at&&(!prev||lineDone(prev)&&S.t-prev.start>=.25)){l.start=S.t;
          // the subtitle appears when the voice actually starts (a line from before the cutscene may still be finishing)
          const show=()=>{if(!S.on||S.lines!==lines)return;l.start=S.t;sub.querySelector('b').textContent=l.who;sub.querySelector('span').textContent=l.shown||l.txt;sub.className='cs-sub on'+(l.tone?' '+l.tone:'');S.subT=0;if(typeof sfx!=='undefined'&&sfx.radio)sfx.radio();};
          const lines=S.lines;
          if(typeof sfx!=='undefined'&&sfx.speak){l.H=sfx.speak(l.who,l.txt,show,l.tone,true);}else show();}
        else all=false;}
      else if(!lineDone(l))all=false;
      prev=l;}
    if(S.lines.length&&all){S.subT+=dt;if(S.subT>.6)sub.classList.remove('on');}
    // camera
    const u=ease(S.t/S.shotDur);
    if(sh.camAt)sh.camAt(u,S.t,camera.position);else if(sh.cam){_a.set(...sh.cam[0]);_b.set(...(sh.cam[1]||sh.cam[0]));camera.position.lerpVectors(_a,_b,u);}
    if(sh.lookAt){sh.lookAt(u,S.t,_la);camera.lookAt(_la);}else if(sh.look){_la.set(...sh.look[0]);_lb.set(...(sh.look[1]||sh.look[0]));camera.lookAt(_la.lerp(_lb,u));}
    if(sh.fov&&sh.fov[1]!==undefined){camera.fov=fit(sh.fov[0]+(sh.fov[1]-sh.fov[0])*u);camera.updateProjectionMatrix();}
    if(sh.fn)sh.fn(S.t,dt,u);
    if(S.t>=S.shotDur&&all){S.i++;if(S.i>=S.shots.length)end(false);else{sub.classList.remove('on');startShot();}}
    return true;
  }
  skipBtn.addEventListener('click',()=>end(true));
  addEventListener('keydown',e=>{if(S.on&&skipBtn.hidden===false&&(e.code==='Enter'||e.code==='Escape'||e.code==='Space')&&!(typeof PG!=='undefined'&&PG.paused)){e.preventDefault();end(true);}});
  // testing: go straight to shot i of the cutscene that is playing
  function jump(i){if(!S.on||i<0||i>=S.shots.length)return;S.i=i;sub.classList.remove('on');startShot();}
  return{play,update,end,ease,jump,get on(){return S.on;},get shot(){return S.on?S.i:-1;}};
})();
