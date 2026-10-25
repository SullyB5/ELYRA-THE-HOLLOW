/* Elyra lean HUD (Oct 25 2026): on every level the screen only carries what you play with —
   shield, health, Zeal, ammo, the objective ping, abilities, and the pause button.
   Gone: the chapter title (it lives in the pause menu now), the objective/score/challenge panel and toasts,
   the compass and heading, altitude/speed/distance readouts, threat and objective banners, enemy name and
   health tags, and the friendly ship bars. Threats are called on the radio (PG.say), so those stay.
   The banner still shows when it's an action prompt (press E, hold to cut, boarding, reviving).
   Load last on each level page, after pause.js. */
(()=>{
  const st=document.createElement('style');st.textContent=`
.brand,.compass,.deg,.readout,.hud.wave,.hud.ships,.hint,
.shiptag,.dogtag,.pgpop,
.pg .sc,.pg .obj,.pg .ch,.pg .toasts,
.shud .sub .sp,.shud .sub .ex,.shud .city{display:none!important}
.hud.banner.lh-off{display:none!important}
.pz .card .lh-title{margin:-2px 0 6px;display:flex;flex-direction:column;gap:3px}
.pz .card .lh-title b{font:700 15px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.22em;color:#eef4ff}
.pz .card .lh-title span{font:500 10px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:rgba(220,232,255,.62)}
@media (max-height:540px){.pz .card .lh-title{grid-column:1/-1;margin:0}}`;
  document.head.appendChild(st);

  // banners: only action prompts get through (what to press / hold, boarding, reviving); objectives and threats don't
  const PROMPT=/press [A-Z]\b|tap [A-Z]+\b|· hold\b|…|Boarding|Reviving|You are down/i;
  function gate(b){b.classList.toggle('lh-off',!PROMPT.test(b.textContent||''));}
  function watchBanner(){const b=document.getElementById('banner');if(!b)return;gate(b);
    // the chapters rewrite className as well as the text, so re-check on both
    new MutationObserver(()=>{const off=b.classList.contains('lh-off'),want=!PROMPT.test(b.textContent||'');if(off!==want)gate(b);})
      .observe(b,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});}

  // the chapter title moves into the pause menu, under PAUSED
  function titleToPause(){const br=document.querySelector('.brand'),card=document.querySelector('.pz .card');
    if(!br||!card||card.querySelector('.lh-title'))return;const h=card.querySelector('h2');
    const t=document.createElement('div');t.className='lh-title';
    t.innerHTML='<b></b><span></span>';t.querySelector('b').textContent=(br.querySelector('b')||br).textContent.trim();
    const sub=br.querySelector('span');if(sub)t.querySelector('span').textContent=sub.textContent.trim();else t.querySelector('span').remove();
    if(h)h.after(t);else card.prepend(t);}

  const go=()=>{watchBanner();titleToPause();};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',go,{once:true});else go();
})();
