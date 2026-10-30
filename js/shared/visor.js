/* Elyra shared · the visor (Oct 30, Bryce: "make the HUD look overall like you're a sci-fi superhuman fighting on a different planet",
   Halo Reach and Halo 3 for the feel). On foot only; js/origin/03-play.js calls VISOR.frame(dt, state) from its HUD update.
     the glass       the helmet's edge: the corners of the view darken a little and curve, with thin lit brackets in each corner
     low health      under 30% HP the edges pulse red with your heartbeat (faster the lower you are), and you hear it
     shield break    the moment the shield empties: a cyan crack of light across the glass, a glitch, and a sound
     crosshairs      one per kind of gun (assault rifle, SMG, pistol, rocket, sniper), the same shapes as the reticles on the gun sights
                     (js/shared/sights.js); red on a target
     ammo panel      the weapon readout as an angled plate with a tick for every round in the magazine
     sniper scope    the scope opens like an iris with a moment of blur; a clear crosshair is the main thing, with the zoom and the
                     range to whatever is under it in small print; 4x, and 7x with Z (PC) or the ZOOM button (phone).
                     The Red Longshot's scope is the Hollow's: purple, with a chevron in place of the plain centre.
   Load after js/shared/lean-hud.js on every on-foot page. Global `VISOR`. */
const VISOR=(()=>{
  const touchUI=typeof coarse!=='undefined'?coarse:matchMedia('(pointer:coarse)').matches;
  const st=document.createElement('style');st.textContent=`
.vz-glass{position:fixed;inset:0;z-index:1;pointer-events:none;transition:opacity .3s}
.vz-glass .ed{position:absolute;inset:0;background:
  radial-gradient(ellipse 120% 110% at 50% 48%,transparent 62%,rgba(6,16,28,.32) 82%,rgba(2,8,16,.62) 100%)}
.vz-glass .rim{position:absolute;left:8%;right:8%;top:0;height:18px;border-bottom:1px solid rgba(127,227,255,.14);border-radius:0 0 50% 50%/0 0 100% 100%}
.vz-glass .br{position:absolute;width:44px;height:44px;border:0 solid rgba(127,227,255,.55);filter:drop-shadow(0 0 3px rgba(127,227,255,.6))}
.vz-glass .br::after{content:"";position:absolute;width:5px;height:5px;background:rgba(127,227,255,.75)}
.vz-glass .vzA{left:calc(env(safe-area-inset-left,0px) + 66px);top:calc(env(safe-area-inset-top,0px) + 12px);border-left-width:1.5px;border-top-width:1.5px}
.vz-glass .vzB{right:calc(env(safe-area-inset-right,0px) + 16px);top:calc(env(safe-area-inset-top,0px) + 12px);border-right-width:1.5px;border-top-width:1.5px}
.vz-glass .vzC{left:calc(env(safe-area-inset-left,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 16px);border-left-width:1.5px;border-bottom-width:1.5px}
.vz-glass .vzD{right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 16px);border-right-width:1.5px;border-bottom-width:1.5px}
.vz-glass .vzA::after{left:-3px;top:-3px}.vz-glass .vzB::after{right:-3px;top:-3px}.vz-glass .vzC::after{left:-3px;bottom:-3px}.vz-glass .vzD::after{right:-3px;bottom:-3px}
.vz-glass .tk{position:absolute;top:50%;width:10px;height:120px;margin-top:-60px;background:repeating-linear-gradient(180deg,rgba(127,227,255,.4) 0 1px,transparent 1px 12px)}
.vz-glass .tk.l{left:calc(env(safe-area-inset-left,0px) + 10px)}.vz-glass .tk.r{right:calc(env(safe-area-inset-right,0px) + 10px)}
.vz-glass.off{opacity:0}
@media (pointer:coarse){.vz-glass .br{width:30px;height:30px}.vz-glass .vzA,.vz-glass .vzB{top:calc(env(safe-area-inset-top,0px) + 10px)}.vz-glass .vzC,.vz-glass .vzD{display:none}.vz-glass .tk{display:none}}
.vz-low{position:fixed;inset:0;z-index:2;pointer-events:none;opacity:0;
  background:radial-gradient(ellipse 110% 100% at 50% 50%,transparent 48%,rgba(255,30,20,.28) 74%,rgba(190,0,0,.62) 100%);box-shadow:inset 0 0 60px rgba(255,40,30,.5)}
.vz-crack{position:fixed;inset:0;z-index:2;pointer-events:none;opacity:0}
.vz-crack.go{animation:vzCrack .5s ease-out}
.vz-crack svg{position:absolute;inset:0;width:100%;height:100%}
.vz-crack i{position:absolute;left:0;right:0;height:3px;background:rgba(160,240,255,.55);mix-blend-mode:screen}
@keyframes vzCrack{0%{opacity:1;filter:brightness(1.8)}15%{opacity:.4}25%{opacity:.95}100%{opacity:0}}
/* crosshairs: the page's own two-line cross is replaced by a drawn one per gun */
.cross.vz::before,.cross.vz::after{display:none!important}
.cross.vz{width:56px;height:56px;margin:-28px 0 0 -28px}
.cross.vz svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 1.5px rgba(0,0,0,.9))}
.cross.vz svg *{stroke:rgba(235,250,255,.95);fill:none;stroke-width:1.6;stroke-linecap:round}
.cross.vz svg .f{fill:rgba(235,250,255,.95);stroke:none}
.cross.vz.tgt svg *{stroke:#ff4a3a}.cross.vz.tgt svg .f{fill:#ff4a3a}
.cross.vz.hit svg *{stroke:#ff8a7a}
/* the ammo panel */
.wpanel.vz{padding:7px 14px 8px 22px;background:linear-gradient(100deg,rgba(6,14,30,.0),rgba(6,14,30,.55) 22%,rgba(8,18,36,.62));
  clip-path:polygon(16px 0,100% 0,100% 100%,0 100%);border-right:2px solid rgba(127,227,255,.65)}
.wpanel.vz .ct b{color:#eafcff;text-shadow:0 0 10px rgba(127,227,255,.55)}
.wpanel.vz .nm{color:rgba(170,230,255,.82)}
.vz-ticks{display:grid;gap:2px 2px;justify-content:end;margin:3px 0 2px}
.vz-ticks i{display:block;width:3px;height:9px;background:rgba(127,227,255,.92);box-shadow:0 0 4px rgba(127,227,255,.7);transform:skewX(-14deg)}
.vz-ticks i.x{background:rgba(127,227,255,.13);box-shadow:none}
.vz-ticks.low i:not(.x){background:#ff8a7a;box-shadow:0 0 4px rgba(255,90,70,.8)}
.vz-ticks.big i{width:9px;height:12px}
@media (pointer:coarse){.wpanel.vz{padding:4px 10px 4px 16px}.vz-ticks i{width:2px;height:6px}.vz-ticks.big i{width:6px;height:8px}}
/* the sniper scope */
.scope.vz{background:none!important}
.scope.vz::before,.scope.vz::after{display:none!important}
.scope.vz .lens{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 220vmax rgba(1,3,6,.985),inset 0 0 40px 10px rgba(0,0,0,.55)}
.scope.vz .lens::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid var(--sc,#7fe3ff);opacity:.55;box-shadow:0 0 10px var(--sc,#7fe3ff)}
.scope.vz svg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);overflow:visible}
.scope.vz svg .k{stroke:rgba(0,0,0,.85);fill:none}
.scope.vz svg .c{stroke:var(--sc,#7fe3ff);fill:none}
.scope.vz svg .d{fill:var(--sc,#7fe3ff)}
.scope.vz.tgt svg .c{stroke:#ff4a3a}.scope.vz.tgt svg .d{fill:#ff4a3a}
.scope.vz .ro{position:absolute;font:600 11px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em;color:var(--sc,#7fe3ff);text-shadow:0 0 6px rgba(0,0,0,.9);opacity:.85;white-space:nowrap}
.scope.vz .ro b{font-weight:700;color:#fff}
.scope.vz .zm{transition:transform .15s}.scope.vz .zm.pop{transform:scale(1.35)}
.vz-zoom{position:fixed;z-index:3;right:calc(var(--sr,0px) + 30px);bottom:calc(var(--sb,0px) + 192px);width:54px;height:54px;border-radius:50%;
  border:1px solid #7fe3ff;background:rgba(10,40,60,.6);color:#eafcff;font:700 12px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.06em;touch-action:none}
.vz-zoom[hidden]{display:none}`;
  document.head.appendChild(st);

  /* ---------- the glass, the low-health edges, the shield crack ---------- */
  const glass=document.createElement('div');glass.className='vz-glass';
  glass.innerHTML='<div class="ed"></div><div class="rim"></div><i class="br vzA"></i><i class="br vzB"></i><i class="br vzC"></i><i class="br vzD"></i><i class="tk l"></i><i class="tk r"></i>';
  const low=document.createElement('div');low.className='vz-low';
  const crack=document.createElement('div');crack.className='vz-crack';
  // a few jagged lines across the glass from a point near the edge, and two glitch bars
  function crackArt(){const W=innerWidth,H=innerHeight,s=Math.random()<.5?-1:1,x0=W*(.5+s*.42),y0=H*(.2+Math.random()*.6);let d='';
    for(let k=0;k<5;k++){let x=x0,y=y0,a=Math.atan2(H/2-y0,W/2-x0)+(Math.random()-.5)*1.6;d+=`M${x|0} ${y|0}`;
      for(let j=0;j<6;j++){a+=(Math.random()-.5)*.8;const L=(40+Math.random()*90)*(1-j*.1);x+=Math.cos(a)*L;y+=Math.sin(a)*L;d+=`L${x|0} ${y|0}`;}}
    crack.innerHTML=`<svg viewBox="0 0 ${W} ${H}"><path d="${d}" stroke="rgba(170,240,255,.9)" stroke-width="1.6" fill="none" style="filter:drop-shadow(0 0 4px #7fe3ff)"/></svg>`+
      `<i style="top:${(20+Math.random()*60)|0}%"></i><i style="top:${(20+Math.random()*60)|0}%;height:1px"></i>`;}
  function shieldBreak(){crackArt();crack.classList.remove('go');void crack.offsetWidth;crack.classList.add('go');if(typeof sfx!=='undefined'&&sfx.shieldBreak)sfx.shieldBreak();}

  /* ---------- crosshairs ---------- */
  const XH={
    ar:'<circle cx="28" cy="28" r="11"/><path d="M28 12v-5M28 44v5M12 28h-5M44 28h5"/><circle class="f" cx="28" cy="28" r="1.4"/>',
    smg:'<path d="M20.2 18.6A12 12 0 0 1 35.8 18.6M37.4 20.2A12 12 0 0 1 37.4 35.8M35.8 37.4A12 12 0 0 1 20.2 37.4M18.6 35.8A12 12 0 0 1 18.6 20.2"/><circle class="f" cx="28" cy="28" r="1.4"/>',
    pistol:'<circle cx="28" cy="28" r="7"/><path d="M24 36.5l4-3 4 3"/><circle class="f" cx="28" cy="28" r="1.3"/>',
    rocket:'<path d="M15 20v-5h5M36 15h5v5M41 36v5h-5M20 41h-5v-5"/><path d="M23 33h10M25 37h6"/><circle class="f" cx="28" cy="28" r="1.6"/>',
    sniper:'<path d="M28 21v-4M28 35v4M21 28h-4M35 28h4"/><circle class="f" cx="28" cy="28" r="1.5"/>'};
  let cross=null,crossCls='',crossTgt=null;
  function setCross(cls,tgt){if(!cross){cross=document.getElementById('cross');if(!cross)return;cross.classList.add('vz');}
    if(cls!==crossCls){crossCls=cls;cross.innerHTML=`<svg viewBox="0 0 56 56">${XH[cls]||XH.ar}</svg>`;}
    if(tgt!==crossTgt){crossTgt=tgt;cross.classList.toggle('tgt',!!tgt);}}

  /* ---------- the ammo panel: a tick per round ---------- */
  let wp=null,ticks=null,tickN=-1,tickLit=-1;
  function setTicks(mag,max,reloading){if(!wp){wp=document.getElementById('wpanel');if(!wp)return;wp.classList.add('vz');
      ticks=document.createElement('div');ticks.className='vz-ticks';const ct=wp.querySelector('.ct');(ct&&ct.nextSibling?wp.insertBefore(ticks,ct.nextSibling):wp.appendChild(ticks));}
    const n=Math.max(1,Math.min(60,max|0));
    if(n!==tickN){tickN=n;tickLit=-1;const per=n>30?Math.ceil(n/2):n;ticks.style.gridTemplateColumns=`repeat(${per},auto)`;ticks.classList.toggle('big',n<=4);
      ticks.innerHTML='<i></i>'.repeat(n);}
    const lit=reloading?0:Math.max(0,Math.min(n,mag|0));
    if(lit!==tickLit){tickLit=lit;const L=ticks.children;
      // the rounds fire from the end of the bottom row backward, so the last ones left sit at the start
      for(let i=0;i<L.length;i++)L[i].classList.toggle('x',i>=lit);ticks.classList.toggle('low',lit<=Math.ceil(n*.2));}}

  /* ---------- the sniper scope ---------- */
  let scope=null,lens=null,svg=null,roZ=null,roR=null,scopeCol='',scopeKind='',zoomBtn=null;
  function buildScope(){scope=document.getElementById('scope');if(!scope)return;scope.classList.add('vz');
    scope.innerHTML='<div class="lens"></div><svg></svg><div class="ro zm"></div><div class="ro rg"></div>';
    lens=scope.querySelector('.lens');svg=scope.querySelector('svg');roZ=scope.querySelector('.zm');roR=scope.querySelector('.rg');
    if(touchUI){zoomBtn=document.createElement('button');zoomBtn.type='button';zoomBtn.className='vz-zoom';zoomBtn.hidden=true;zoomBtn.textContent='ZOOM';document.body.appendChild(zoomBtn);
      zoomBtn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(typeof window.scopeZoom==='function')window.scopeZoom();});}}
  // the crosshair: thin lines across the whole lens with a gap at the middle, heavier posts from the edge, small mil dots;
  // each line drawn twice (dark under, colour over) so it reads on bright sand and in the dark alike
  function drawScope(R,hollow){const g=R*.06,dots=[.18,.32,.46,.6].map(k=>k*R);
    const line=(x1,y1,x2,y2,w)=>`<path class="k" d="M${x1} ${y1}L${x2} ${y2}" stroke-width="${w+2}"/><path class="c" d="M${x1} ${y1}L${x2} ${y2}" stroke-width="${w}"/>`;
    let s='';
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){s+=line(dx*g,dy*g,dx*R*.72,dy*R*.72,1.1);s+=line(dx*R*.72,dy*R*.72,dx*R,dy*R,dy>0&&!hollow?4:3.2);
      for(const d of dots)s+=`<circle class="d" cx="${dx*d}" cy="${dy*d}" r="1.8"/>`;}
    if(hollow)s+=`<path class="k" d="M${-R*.05} ${R*.07}L0 ${R*.02}L${R*.05} ${R*.07}" stroke-width="3.6"/><path class="c" d="M${-R*.05} ${R*.07}L0 ${R*.02}L${R*.05} ${R*.07}" stroke-width="1.6"/>`;
    s+=`<circle class="d" cx="0" cy="0" r="${hollow?1.6:2}"/>`;
    // a faint inner ring for range at 7x
    s+=`<circle class="c" cx="0" cy="0" r="${R*.25}" stroke-width=".8" opacity=".35"/>`;
    svg.setAttribute('width',2*R);svg.setAttribute('height',2*R);svg.setAttribute('viewBox',`${-R} ${-R} ${2*R} ${2*R}`);svg.innerHTML=s;}
  let wasScoped=false,scopeT=0,lastR=0,zoomPop=0;
  function zoomed(z){zoomPop=.18;scopeT=Math.min(scopeT,.12);if(roZ){roZ.classList.add('pop');setTimeout(()=>roZ&&roZ.classList.remove('pop'),150);}}
  const canvas=()=>typeof renderer!=='undefined'&&renderer.domElement;

  /* ---------- each frame ---------- */
  let beatT=0,lowK=0;
  let lastNow=0;
  function frame(dt,s){const now=performance.now()/1000;dt=lastNow?Math.min(.1,now-lastNow):dt;lastNow=now;
    const inCut=(typeof CUTS!=='undefined'&&CUTS.on)||(typeof PROLOGUE!=='undefined'&&PROLOGUE.on);
    const third=typeof window.ELYRA_VIEW!=='undefined'&&window.ELYRA_VIEW.get()==='third';
    const on=s.arm&&!s.veh&&!inCut;
    if(!glass.parentNode){document.body.appendChild(glass);document.body.appendChild(low);document.body.appendChild(crack);}
    glass.classList.toggle('off',!on||third||s.scoped);
    // low health: below 30% the edges pulse with the heartbeat, faster the lower you are
    const f=s.maxHp?s.hp/s.maxHp:1,isLow=s.alive&&f<.3&&!inCut;
    lowK+=((isLow?1:0)-lowK)*Math.min(1,dt*4);
    if(isLow){const bpm=70+(1-f/.3)*70;beatT-=dt;if(beatT<=0){beatT=60/bpm;if(typeof sfx!=='undefined'&&sfx.heartbeat)sfx.heartbeat(1-f/.3);}}else beatT=0;
    const ph=isLow?Math.max(0,1-((60/(70+(1-f/.3)*70))-beatT)*3.2):0;
    low.style.opacity=(lowK*(.45+.55*ph)).toFixed(3);
    if(!s.alive)low.style.opacity=0;
    // crosshair and ammo
    setCross(s.cls||'ar',!!s.target);
    setTicks(s.mag,s.magMax,s.reloading);
    // the scope
    if(!scope)buildScope();
    if(scope){const sc=s.scoped&&on;
      if(sc){const hollow=!!(s.gun&&s.gun.flash);const col=hollow&&typeof SIGHTS!=='undefined'?SIGHTS.colourOf(s.gun):'#7fe3ff';
        if(!wasScoped){scopeT=0;if(typeof sfx!=='undefined'&&sfx.scopeIn)sfx.scopeIn();}
        scopeT+=dt;
        const R=Math.round(Math.min(innerWidth,innerHeight)*.42),u=Math.min(1,scopeT/.22),e=1-Math.pow(1-u,3);
        if(col!==scopeCol||hollow!==(scopeKind==='h')||R!==lastR){scopeCol=col;scopeKind=hollow?'h':'k';lastR=R;scope.style.setProperty('--sc',col);drawScope(R,hollow);}
        const r=Math.max(6,R*e);lens.style.width=lens.style.height=(2*r)+'px';svg.style.opacity=u<.6?0:(u-.6)/.4;svg.style.transform=`translate(-50%,-50%) scale(${.96+.04*e})`;
        // the blur as it opens (and a short one when the zoom steps)
        zoomPop=Math.max(0,zoomPop-dt);const blur=Math.max((1-u)*7,zoomPop*18);const cv=canvas();if(cv)cv.style.filter=blur>.2?`blur(${blur.toFixed(1)}px)`:'';
        scope.classList.toggle('tgt',!!s.target);
        roZ.innerHTML=`<b>${(s.zoom||4).toFixed(1)}×</b>`;roZ.style.left=`calc(50% + ${R*.62}px)`;roZ.style.top=`calc(50% - ${R*.7}px)`;
        roR.innerHTML=`RNG <b>${s.aim>=890?'---':Math.round(s.aim||0)}</b> M`;roR.style.left=`calc(50% + ${R*.3}px)`;roR.style.top=`calc(50% + ${R*.12}px)`;
        if(zoomBtn){zoomBtn.hidden=false;const t=(s.zoom||4)>=7?'4×':'7×';if(zoomBtn.textContent!==t)zoomBtn.textContent=t;}}
      else if(wasScoped){const cv=canvas();if(cv)cv.style.filter='';if(zoomBtn)zoomBtn.hidden=true;}
      wasScoped=sc;}
  }
  return{frame,shieldBreak,zoomed};
})();
window.VISOR=VISOR;
