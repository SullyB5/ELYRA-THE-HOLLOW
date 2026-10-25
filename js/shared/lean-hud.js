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
.shiptag,.tbar,.dogtag,.pgpop,
.pg .sc,.pg .obj,.pg .ch,.pg .toasts,
.shud .sub .sp,.shud .sub .ex,.shud .city{display:none!important}
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

  const go=()=>{watchBanner();titleToPause();cityPops();};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',go,{once:true});else go();
})();
