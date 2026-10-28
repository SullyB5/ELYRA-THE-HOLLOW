/* Elyra lean HUD (Oct 25 2026): on every level the screen only carries what you play with —
   shield, health, Zeal, ammo, the objective ping, abilities, and the pause button.
   Gone: the chapter title (it lives in the pause menu now), the objective/score/challenge panel and toasts,
   the compass and heading, altitude/speed/distance readouts, threat and objective banners, enemy name and
   health tags, and the friendly ship bars. Threats are called on the radio (PG.say), so those stay.
   The banner still shows action prompts and Tide City's integrity %, and major threats pop up briefly (see below).
   Load last on each level page, after pause.js. */
(()=>{
  const st=document.createElement('style');st.textContent=`
.brand,.compass,.deg,.readout,.hud.wave,.hud.ships,.hint,
.shiptag,.tbar,.dogtag,
.pg .sc,.pg .obj,.pg .ch,.pg .toasts,
.shud .sub .sp,.shud .sub .ex,.shud .city{display:none!important}
/* (Oct 26) kill points stay: the "+100" that floats up where an enemy goes down shows on every level, over the HUD, under the pause menu */
body>.pgpop{z-index:3}
.hud.banner.lh-off{display:none!important}
.pz .card .lh-title{margin:-2px 0 6px;display:flex;flex-direction:column;gap:3px}
.pz .card .lh-title b{font:700 15px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.22em;color:#eef4ff}
.pz .card .lh-title span{font:500 10px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:rgba(220,232,255,.62)}
@media (max-height:540px){.pz .card .lh-title{grid-column:1/-1;margin:0}}`;
  document.head.appendChild(st);

  // banners: action prompts always show (what to press / hold, boarding, reviving) and so does Tide City's integrity
  // (a tower down, or each 10% lost). Major threats pop up for a few seconds when they first appear, then clear;
  // a running count ("1 in the sky", "0.8 km") doesn't bring the same one back. Objectives and everything else stay hidden.
  const PROMPT=/press [A-Z]\b|tap [A-Z]+\b|· hold\b|…|Boarding|Reviving|You are down|city integrity/i;
  const MAJOR=/inbound|incoming|dropping out|new contacts|Hollow King|Hollow carriers|carrier|coming up behind|a trap|enemy fleet|Empty Host (landing|fighters)|Vigil is falling|pushing up the canyon|Last push|fleet sighted|opened fire|Spear is waking/i;
  const POP_MS=3500;let majKey='',majUntil=0,majTimer=0;
  const keyOf=t=>t.replace(/[\d.,%]+/g,'#').trim();
  function gate(b){const t=b.textContent||'';let show=PROMPT.test(t);
    if(!show&&MAJOR.test(t)){const k=keyOf(t),now=performance.now();
      if(k!==majKey){majKey=k;majUntil=now+POP_MS;clearTimeout(majTimer);majTimer=setTimeout(()=>gate(b),POP_MS+20);}
      show=now<majUntil;}
    b.classList.toggle('lh-off',!show);}
  function watchBanner(){const b=document.getElementById('banner');if(!b)return;gate(b);
    // the chapters rewrite className as well as the text, so re-check on both (gate only changes the class when it has to)
    new MutationObserver(()=>gate(b)).observe(b,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});}

  // Tide City: the integrity bar is gone, so each 10% the city loses pops up as a banner instead
  function cityPops(){if(typeof SHUD==='undefined'||typeof flashBanner!=='function')return;const up=SHUD.update;let step=10;
    SHUD.update=function(o){if(o&&o.city!=null){const s=Math.ceil(Math.max(0,o.city)/10);
      if(s<step&&o.city>0)flashBanner('City integrity '+Math.ceil(o.city)+'%');step=s;}return up.apply(this,arguments);};}

  // the chapter title moves into the pause menu, under PAUSED
  function titleToPause(){const br=document.querySelector('.brand'),card=document.querySelector('.pz .card');
    if(!br||!card||card.querySelector('.lh-title'))return;const h=card.querySelector('h2');
    const t=document.createElement('div');t.className='lh-title';
    t.innerHTML='<b></b><span></span>';t.querySelector('b').textContent=(br.querySelector('b')||br).textContent.trim();
    const sub=br.querySelector('span');if(sub)t.querySelector('span').textContent=sub.textContent.trim();else t.querySelector('span').remove();
    if(h)h.after(t);else card.prepend(t);}

  // the corner Menu (quality, back to the menu) folds into the pause menu on PC too, as it already does on phones
  function menuToPause(){const card=document.querySelector('.pz .card');if(!card)return;const before=card.querySelector('[data-a=restart]');
    const vw=document.getElementById('views'),mb=document.getElementById('menuBtn');
    if(vw){for(const b of[...vw.querySelectorAll('button')])card.insertBefore(b,before);vw.style.display='none';}if(mb)mb.style.display='none';
    for(const b of[...document.querySelectorAll('body>button.menu')])card.insertBefore(b,before);for(const a of document.querySelectorAll('body>a.menu'))a.style.display='none';}

  /* Oct 27 (Bryce: "make the objective pop up at the start of each round to show where to go"): window.goalPop(text, sub) shows the
     new objective big in the middle of the screen for a few seconds, then it's gone (the objective ping still marks the place).
     The chapters call it when a stage starts; the same text twice in a row doesn't show again. */
  {const cs=document.createElement('style');cs.textContent=`
.goalpop{position:fixed;left:50%;top:24%;transform:translate(-50%,-50%);z-index:3;pointer-events:none;text-align:center;opacity:0;transition:opacity .45s;max-width:86vw}
.goalpop.on{opacity:1}
.goalpop small{display:block;font:600 10px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.3em;color:rgba(255,214,140,.8);margin-bottom:6px;text-transform:uppercase}
.goalpop b{display:block;font:700 clamp(18px,3.4vw,30px) 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.14em;color:#ffe6b0;text-transform:uppercase;text-shadow:0 2px 14px rgba(0,0,0,.85),0 0 22px rgba(255,190,90,.35)}
.goalpop span{display:block;margin-top:6px;font:500 12px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.12em;color:rgba(235,242,255,.85);text-shadow:0 1px 6px #000}
.goalpop.alert b{color:#ffd0a0;animation:gpPulse .7s ease-in-out infinite alternate}
@keyframes gpPulse{from{text-shadow:0 2px 14px rgba(0,0,0,.85),0 0 10px rgba(255,170,80,.3)}to{text-shadow:0 2px 14px rgba(0,0,0,.85),0 0 30px rgba(255,190,90,.95)}}`;
   document.head.appendChild(cs);
   let el=null,last='',hideT=0,offT=0;
   window.goalPop=(text,sub,o)=>{o=o||{};if(!text||(text===last&&!o.again))return;last=text;
     if(!el){el=document.createElement('div');el.className='goalpop';document.body.appendChild(el);}
     el.innerHTML='<small></small><b></b><span></span>';el.querySelector('small').textContent=o.kicker||'Objective';el.querySelector('b').textContent=text;
     const sp=el.querySelector('span');if(sub)sp.textContent=sub;else sp.remove();
     el.classList.toggle('alert',!!o.alert);clearTimeout(hideT);clearTimeout(offT);el.style.display='';requestAnimationFrame(()=>el.classList.add('on'));
     hideT=setTimeout(()=>{el.classList.remove('on');offT=setTimeout(()=>{el.style.display='none';},500);},o.ms||4200);};}
  const go=()=>{watchBanner();titleToPause();menuToPause();cityPops();};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',go,{once:true});else go();
})();
