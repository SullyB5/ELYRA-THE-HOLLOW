/* Elyra pause: a pause button at the top left, plus Esc or P on PC. On PC, Esc first releases the mouse
   (the browser keeps that key press to itself), so releasing the mouse mid-fight pauses too, and so does
   switching tabs. While paused the chapter stands still (PG.paused), sound and voices hold, and nothing reacts.
   It never pauses over a cutscene (Esc skips those), the briefing, or an end screen. Load after audio.js. */
(()=>{
  const st=document.createElement('style');st.textContent=`
.pz-btn{position:fixed;left:calc(env(safe-area-inset-left,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 10px);z-index:5;width:40px;height:40px;
  display:grid;place-items:center;padding:0;border-radius:4px;border:1px solid rgba(140,200,255,.45);background:rgba(6,10,22,.6);color:#eef4ff;cursor:pointer;
  -webkit-tap-highlight-color:transparent;touch-action:manipulation}
.pz-btn svg{width:14px;height:16px;fill:currentColor}
.pz-btn:focus-visible,.pz button:focus-visible,.pz a:focus-visible{outline:2px solid #7fe3ff;outline-offset:2px}
.pz-btn[hidden],.pz[hidden]{display:none}
.pz{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:rgba(0,0,0,.62);padding:20px}
.pz .card{width:min(360px,100%);display:flex;flex-direction:column;gap:10px;padding:22px;background:rgba(6,10,22,.9);border:1px solid rgba(140,200,255,.32);border-radius:4px;color:#eef4ff;
  font:500 14px/1.45 'Chakra Petch','Arial Narrow',system-ui,sans-serif;text-align:center}
.pz h2{margin:0 0 4px;font:700 22px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.3em}
.pz p{margin:0 0 6px;color:rgba(220,232,255,.7);font-size:13px}
.pz button,.pz a{display:block;padding:12px;border-radius:3px;border:1px solid rgba(140,200,255,.4);background:rgba(20,34,60,.7);color:#eef4ff;text-decoration:none;
  font:700 13px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}
.pz button.primary{background:#2d6fd6;border-color:#5aa0ff}
.pz-vol{display:grid;gap:6px;padding:4px 2px}.pz-vol label{display:grid;grid-template-columns:56px 1fr;align-items:center;gap:10px;font:700 11px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.16em;text-transform:uppercase;text-align:left}
.pz-vol input{width:100%;accent-color:#7fe3ff}.pz .card .pz-vol{grid-column:1/-1}
/* (Oct 26) this level's challenges: what's done, what's left, the Remnant Marks each pays on this threat level */
.pz-ch{text-align:left;display:flex;flex-direction:column;gap:3px;padding:8px 10px;border:1px solid rgba(255,210,122,.28);background:rgba(255,210,122,.05);border-radius:3px}
.pz-ch b{font:700 10px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.22em;color:#ffd27a;margin-bottom:2px}
.pz-ch div{display:grid;grid-template-columns:14px 1fr auto;gap:6px;font:400 11px/1.35 'JetBrains Mono',ui-monospace,monospace;color:rgba(220,232,255,.8)}
.pz-ch div.done{color:#8cf0b0}.pz-ch div.fail{color:rgba(255,130,120,.6)}.pz-ch div.fail span:nth-child(2){text-decoration:line-through}.pz-ch i{font-style:normal;color:#ffd27a;white-space:nowrap}
.pz-ch div.got i{color:rgba(220,232,255,.4)}.pz .card .pz-ch{grid-column:1/-1}
body.incut .pz-btn{visibility:hidden}
.brand{left:calc(env(safe-area-inset-left,0px) + 62px)!important}   /* the chapter title moves over to make room */
/* a phone on its side: everything fits on one screen (two columns of buttons, no hint line), and it scrolls if it still doesn't */
@media (max-height:540px){.pz{padding:8px;overflow:auto;align-items:start}.pz .card{width:min(640px,100%);display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px 12px;margin:auto}
  .pz .card h2{grid-column:1/-1;font-size:15px;margin:0}.pz .card p{display:none}.pz button,.pz a{padding:9px 8px;font-size:12px}.pz .card .primary{grid-column:1/-1}}`;
  document.head.appendChild(st);

  const btn=document.createElement('button');btn.type='button';btn.className='pz-btn';btn.setAttribute('aria-label','Pause');
  btn.innerHTML='<svg viewBox="0 0 14 16" aria-hidden="true"><rect x="0" y="0" width="5" height="16"/><rect x="9" y="0" width="5" height="16"/></svg>';
  const el=document.createElement('div');el.className='pz';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','Paused');
  const touch=matchMedia('(pointer:coarse)').matches;
  el.innerHTML=`<div class="card"><h2>PAUSED</h2><p>${touch?'Tap Resume to keep fighting.':'Esc or P to resume. Click the game to take the mouse back.'}</p>
    <button type="button" class="primary" data-a="resume">Resume</button>
    <button type="button" data-a="view" hidden>View: first person</button>
    <div class="pz-ch" hidden></div>
    <div class="pz-vol"><label>SFX<input type="range" min="0" max="100" step="5" data-vol="sfx" aria-label="SFX volume"></label><label>Music<input type="range" min="0" max="100" step="5" data-vol="music" aria-label="Music volume"></label></div>
    <button type="button" data-a="keys" ${touch?'hidden':''}>Controls</button>
    <button type="button" data-a="layout" ${touch?'':'hidden'}>Button layout</button>
    <button type="button" data-a="restart">Restart chapter</button>
    <a href="index.html">Menu</a></div>`;
  // on a phone the chapter's top-right Menu crowds the HUD: its buttons (sound, quality, views) move in here instead
  const mount=()=>{document.body.appendChild(btn);document.body.appendChild(el);
    st.textContent+='.pz .card button.menu{position:static!important;width:auto;height:auto}';
    if(touch){const card=el.querySelector('.card'),before=card.querySelector('[data-a=restart]'),vw=document.getElementById('views'),mb=document.getElementById('menuBtn');
      if(vw){for(const b of[...vw.querySelectorAll("button")])card.insertBefore(b,before);vw.style.display="none";}if(mb)mb.style.display="none";
      // chapters with their own corner links (The Heralds): the sound button moves in here too, and the link hides (Archives is here)
      for(const b of[...document.querySelectorAll('button.menu')])card.insertBefore(b,before);for(const a of document.querySelectorAll('a.menu'))a.style.display='none';}};
  if(document.body)mount();else addEventListener('DOMContentLoaded',mount,{once:true});

  let mine=false,at=0,wasLocked=false;
  // the prologue counts as a cutscene: Esc there skips it. (It used to pause the game hidden behind the prologue, which froze the
  // next cutscene on its black title card and held every voice silent.)
  const inCut=()=>(typeof CUTS!=='undefined'&&CUTS.on)||(typeof PROLOGUE!=='undefined'&&PROLOGUE.on);
  // not over the briefing (it uses PG.paused itself), a cutscene, or an end screen
  const canPause=()=>!mine&&!PG.paused&&!inCut()&&!document.querySelector('.pgend');
  const hold=on=>{if(typeof sfx!=='undefined'&&sfx.hold)sfx.hold(on);};

  function pause(){
    if(!canPause())return;
    mine=true;at=performance.now();PG.paused=true;el.hidden=false;btn.hidden=true;hold(true);drawView();drawVol();drawChal();
    try{if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock();}catch(_){}
    const r=el.querySelector('[data-a=resume]');if(r)r.focus({preventScroll:true});
  }
  function resume(){
    if(!mine)return;
    mine=false;PG.paused=false;el.hidden=true;btn.hidden=false;hold(false);
  }

  // the button lives above the game: keep its taps from reaching the controls underneath
  for(const ev of['pointerdown','touchstart','mousedown'])btn.addEventListener(ev,e=>e.stopPropagation(),{passive:true});
  btn.addEventListener('click',e=>{e.stopPropagation();pause();});
  for(const ev of['pointerdown','touchstart','mousedown'])el.addEventListener(ev,e=>e.stopPropagation(),{passive:true});
  el.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;
    if(a.dataset.a==='resume')resume();else if(a.dataset.a==='restart')location.reload();
    else if(a.dataset.a==='view'&&window.ELYRA_VIEW){window.ELYRA_VIEW.toggle();drawView();}
    // (Oct 27) the Controls panel (keys, PC) and the touch button layout (phone): the pause card steps aside while they are up
    else if(a.dataset.a==='keys'&&typeof KEYS!=='undefined'){el.hidden=true;KEYS.open(()=>{if(mine){el.hidden=false;const b=el.querySelector('[data-a=keys]');if(b)b.focus();}});}
    else if(a.dataset.a==='layout'&&typeof TOUCHLAYOUT!=='undefined'){el.hidden=true;TOUCHLAYOUT.edit(()=>{if(mine)el.hidden=false;});}});
  function drawChal(){const box=el.querySelector('.pz-ch');if(!box)return;const L=PG.chalList?PG.chalList():[];box.hidden=!L.length;if(!L.length)return;
    const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    box.innerHTML='<b>CHALLENGES</b>'+L.map(c=>`<div class="${c.state}${c.got&&c.state!=='done'?' got':''}"><span>${c.state==='done'?'✓':c.state==='fail'?'✗':'○'}</span><span>${esc(c.text)}${c.goal>1&&!c.state?` ${c.n}/${c.goal}`:''}</span><i>${c.state==='done'?(c.paid?'+'+c.paid+' mk':'cleared'):c.got?'cleared':'+'+c.marks+' mk'}</i></div>`).join('');}
  // SFX and Music volume (the same settings as the menu's)
  function drawVol(){if(typeof sfx==='undefined'||!sfx.vol)return;const V=sfx.vol;el.querySelectorAll('[data-vol]').forEach(r=>{r.value=Math.round(V[r.dataset.vol]*100);});}
  el.addEventListener('input',e=>{const r=e.target.closest&&e.target.closest('[data-vol]');if(r&&typeof sfx!=='undefined'&&sfx.setVol)sfx.setVol(r.dataset.vol,r.value/100);});
  // ground chapters (The Mountain, Pathfinder): first or third person, switched here mid-game
  function drawView(){const b=el.querySelector('[data-a=view]');if(!b)return;b.hidden=!window.ELYRA_VIEW;if(window.ELYRA_VIEW)b.textContent='View: '+(window.ELYRA_VIEW.get()==='third'?'third person':'first person');}

  addEventListener('keydown',e=>{
    if(e.code!=='Escape'&&e.code!=='KeyP')return;
    if(mine){if(performance.now()-at>250){e.preventDefault();e.stopImmediatePropagation();resume();}return;}
    if(canPause()){e.preventDefault();e.stopImmediatePropagation();pause();}
  },true);
  // while paused, game keys do nothing
  addEventListener('keydown',e=>{if(mine&&!(e.target instanceof Node&&el.contains(e.target))){e.stopImmediatePropagation();}},true);
  document.addEventListener('pointerlockchange',()=>{const L=!!document.pointerLockElement;if(wasLocked&&!L)pause();wasLocked=L;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.PAUSE={pause,resume,get on(){return mine;}};
})();
