/* Elyra shared cockpit HUD: a compact strip at the top centre of the screen.
   Zeal on the left wing, the shield as the centre gem (it drains downward, no number: read it at a glance),
   hull on the right wing; below that missiles, speed and an extra readout, and an optional wide bar for
   something you are defending (Tide City). Builds its own markup and styles; pages call SHUD.update(). */
const SHUD=(()=>{
  const css=`
.shud{position:fixed;z-index:2;left:50%;top:var(--shud-top,calc(env(safe-area-inset-top,0px) + 10px));transform:translateX(-50%);width:min(420px,calc(100vw - 24px));pointer-events:none;
  font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;color:#eef4ff;display:flex;flex-direction:column;align-items:center;gap:3px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.45))}
.shud .main{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;width:100%}
.shud .wing{position:relative;height:22px;background:linear-gradient(180deg,rgba(8,16,34,.72),rgba(4,8,20,.58));border:1px solid rgba(127,227,255,.3);display:flex;flex-direction:column;justify-content:center;padding:0 9px;gap:2px}
.shud .wing.l{clip-path:polygon(10px 0,100% 0,100% 100%,0 100%,0 10px);border-right:none;align-items:flex-end}
.shud .wing.r{clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%);border-left:none;align-items:flex-start}
.shud .wing label{display:flex;gap:6px;font:700 8px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.2em;color:rgba(200,225,255,.78)}
.shud .wing label b{font:600 9px 'JetBrains Mono',monospace;letter-spacing:.02em;color:#fff;font-variant-numeric:tabular-nums}
.shud .wing.l label b{color:#ffd27a;font:700 8px 'Chakra Petch',sans-serif;letter-spacing:.14em}
.shud .seg{position:relative;width:100%;height:5px;background:rgba(255,255,255,.08)}
.shud .seg u{position:absolute;top:0;bottom:0;width:100%;transition:width .18s ease-out}
.shud .seg::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 8px,rgba(4,8,20,.95) 8px 10px)}
.shud .wing.l .seg u{right:0}.shud .wing.r .seg u{left:0}
.shud u.ze{background:linear-gradient(180deg,#ffe08a,#ffb84a);box-shadow:0 0 7px rgba(255,200,90,.8)}
.shud.zready u.ze{animation:shudPulse .5s infinite alternate}.shud.zready .wing.l{border-color:rgba(255,210,122,.8)}
.shud.zburn .wing.l{border-color:#ffd27a;box-shadow:inset 0 0 10px rgba(255,210,122,.45)}
.shud u.hu{background:linear-gradient(180deg,#c6ffd9,#3fd07c);box-shadow:0 0 7px rgba(90,230,140,.7)}
.shud.low u.hu{background:linear-gradient(180deg,#ffd0c0,#ff4a3a);box-shadow:0 0 9px rgba(255,80,60,.9);animation:shudPulse .6s infinite alternate}
/* the shield gem: a hexagon that empties from the top down */
.shud .core{position:relative;width:66px;height:38px;clip-path:polygon(14px 0,calc(100% - 14px) 0,100% 50%,calc(100% - 14px) 100%,14px 100%,0 50%);
  background:linear-gradient(180deg,rgba(14,28,52,.88),rgba(4,10,24,.82));overflow:hidden}
.shud .core i{position:absolute;left:0;right:0;bottom:0;height:100%;background:linear-gradient(180deg,#d8ecff,#5f9dff 55%,#2f62d8);box-shadow:0 0 14px rgba(110,170,255,.9) inset;transition:height .2s ease-out}
.shud .core::after{content:"";position:absolute;inset:0;clip-path:inherit;border:1px solid rgba(160,205,255,.75);
  background:linear-gradient(90deg,transparent 0 47%,rgba(255,255,255,.12) 50%,transparent 53%)}
.shud .core small{position:absolute;left:0;right:0;bottom:2px;text-align:center;font:700 6px 'Chakra Petch',sans-serif;letter-spacing:.3em;color:rgba(6,14,30,.7);z-index:1}
.shud.sout .core i{height:0!important}.shud.sout .core small{color:rgba(255,140,120,.85)}
.shud.hit .core{filter:brightness(1.6)}.shud.hit .wing{border-color:rgba(255,120,100,.9)}
.shud .sub{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;font:700 8px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.2em;color:rgba(200,225,255,.78)}
.shud .sub span{color:#ffd27a;letter-spacing:.12em;font-size:9px}
.shud .sub .sp b{font:600 10px 'JetBrains Mono',monospace;color:#fff;letter-spacing:0;font-variant-numeric:tabular-nums;margin-right:3px}
.shud .sub .ex{color:#eef4ff;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;font-weight:500}
.shud .city{width:100%;display:flex;align-items:center;gap:7px;font:700 8px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.2em;color:rgba(200,225,255,.85)}
.shud .city .seg{flex:1;height:4px}
.shud .city .seg u{left:0;background:linear-gradient(90deg,#7fe3ff,#e9fbff);box-shadow:0 0 7px rgba(127,227,255,.7)}
.shud .city.warn .seg u{background:linear-gradient(90deg,#ff4a3a,#ffb08a);box-shadow:0 0 9px rgba(255,90,60,.9)}
.shud .city.warn{color:#ff9a8a}.shud .city b{font:600 9px 'JetBrains Mono',monospace;color:#fff;min-width:30px;text-align:right}
.shud.down{opacity:.45}
/* (Oct 26, Bryce) under 1 HP (it can read 0 while you still have half a point): the number and the bar flash red */
.shud.crit .wing.r label b{animation:shudCrit .3s infinite alternate}.shud.crit u.hu{min-width:3px;animation:shudCrit .3s infinite alternate}
@keyframes shudCrit{from{color:#ff4a3a;opacity:1;filter:brightness(1.6)}to{color:#fff;opacity:.25}}
@keyframes shudPulse{from{opacity:1}to{opacity:.45}}
.shud.phone{top:auto;left:calc(env(safe-area-inset-left,0px) + 10px);bottom:calc(env(safe-area-inset-bottom,0px) + 10px);transform:none;width:min(280px,54vw);align-items:stretch;gap:2px}
.shud.phone .core{width:54px;height:32px}.shud.phone .wing{height:20px;padding:0 6px}.shud.phone .wing label{letter-spacing:.1em}
.shud.phone .sub .ex{display:none}
/* Zeal ready: the shield gem turns gold, and on a phone tapping it burns Zeal (there is no separate Zeal button) */
.shud.zready .core i{background:linear-gradient(180deg,#fff6d0,#ffd27a 55%,#d9962a);box-shadow:0 0 16px rgba(255,210,122,.95) inset;height:100%!important}
.shud.zready .core{animation:shudPulse .5s infinite alternate}.shud.zready .core small{color:rgba(60,36,0,.85)}
.shud.ztap .core{pointer-events:auto;cursor:pointer;touch-action:manipulation}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const el=document.createElement('div');el.className='shud';el.id='shud';
  el.innerHTML=`<div class="main">
  <div class="wing l" id="zeRow"><label><b id="zealT">charging</b> ZEAL</label><div class="seg"><u class="ze" id="zeB" style="width:0"></u></div></div>
  <div class="core" title="Shield"><i id="shF"></i><small>SHIELD</small></div>
  <div class="wing r"><label><b id="huP">100</b> HULL</label><div class="seg"><u class="hu" id="huB"></u></div></div>
</div>
<div class="sub"><div class="ms">MSL <span id="mslT"></span></div><div class="sp"><b id="spdN">0</b><i id="spdU" style="font-style:normal">M/S</i></div><div class="ex" id="spd"></div></div>
<div class="city" id="cityRow" hidden><span id="cityName">TIDE CITY</span><div class="seg"><u id="cityB"></u></div><b id="cityP">100%</b></div>`;
  document.body.appendChild(el);
  if(coarse)el.classList.add('phone');
  const g=id=>document.getElementById(id);
  let lastShield=100,lastHull=100,hitT=0;
  function update(o){
    if(o.shield!=null){const v=Math.max(0,o.shield);g('shF').style.height=v+'%';el.classList.toggle('sout',v<1);if(v<lastShield-.5)hitT=performance.now();lastShield=v;}
    if(o.hull!=null){const v=Math.max(0,o.hull);g('huB').style.width=v+'%';g('huP').textContent=Math.round(v);if(v<lastHull-.5)hitT=performance.now();lastHull=v;el.classList.toggle('low',v<30);el.classList.toggle('crit',v>0&&v<1);}
    el.classList.toggle('hit',performance.now()-hitT<220);
    if(o.hullLabel){const lb=g('huP').parentNode;lb.lastChild.nodeValue=' '+o.hullLabel;}   // on foot it reads HP, not HULL
    if(o.speed!=null)g('spdN').textContent=Math.round(o.speed);
    if(o.unit)g('spdU').textContent=o.unit;
    if(o.extra!=null)g('spd').textContent=o.extra;
    if(o.zeal===null)g('zeRow').style.visibility='hidden';
    else if(o.zeal!=null){g('zeRow').style.visibility='';g('zeB').style.width=o.zeal+'%';g('zealT').textContent=o.zealText||'';
      el.classList.toggle('zready',!!o.zealReady);el.classList.toggle('zburn',o.zealText==='burning');
      el.querySelector('.core small').textContent=o.zealReady?(coarse?'TAP · ZEAL':'ZEAL · Z'):'SHIELD';}
    if(o.mslReady!=null){const n=Math.round(clamp(o.mslReady,0,1)*5);g('mslT').textContent=o.mslReady>=1?'READY':'◆'.repeat(n)+'◇'.repeat(5-n);}
    else if(o.msl!=null){const m=o.mslMax||6;g('mslT').textContent='◆'.repeat(o.msl)+'◇'.repeat(Math.max(0,m-o.msl));}
    if(o.city!=null){const r=g('cityRow');r.hidden=false;const v=Math.max(0,o.city);g('cityB').style.width=v+'%';g('cityP').textContent=Math.ceil(v)+'%';r.classList.toggle('warn',v<35);}
    if(o.sub!=null)el.querySelector('.sub').style.display=o.sub?'':'none';
    if(o.down!=null)el.classList.toggle('down',!!o.down);
    if(o.visible!=null)el.style.display=o.visible?'':'none';
  }
  // a chapter hands over its Zeal function; tapping the gold gem calls it
  function zealTap(fn){el.classList.add('ztap');const core=el.querySelector('.core');
    core.addEventListener('pointerdown',e=>{if(!el.classList.contains('zready'))return;e.preventDefault();e.stopPropagation();fn();});}
  return{update,el,zealTap};
})();
