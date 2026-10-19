/* Elyra shared cockpit HUD: the interceptor's instruments in a strip at the top centre of the screen.
   Shield on the left wing, hull on the right, speed in the core, zeal and missiles below, and an optional
   wide bar for something you are defending (Tide City). Builds its own markup and styles; pages call SHUD.update(). */
const SHUD=(()=>{
  const css=`
.shud{position:fixed;z-index:2;left:50%;top:var(--shud-top,calc(env(safe-area-inset-top,0px) + 12px));transform:translateX(-50%);width:min(600px,calc(100vw - 24px));pointer-events:none;
  font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;color:#eef4ff;display:flex;flex-direction:column;align-items:center;gap:4px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.45))}
.shud .nm{font:700 9px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.32em;color:rgba(190,230,255,.75);text-transform:uppercase}
.shud .main{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:0;width:100%}
.shud .wing{position:relative;height:30px;background:linear-gradient(180deg,rgba(8,16,34,.78),rgba(4,8,20,.62));border:1px solid rgba(127,227,255,.35);display:flex;flex-direction:column;justify-content:center;padding:0 12px;gap:3px}
.shud .wing.l{clip-path:polygon(14px 0,100% 0,100% 100%,0 100%,0 14px);border-right:none;align-items:flex-end}
.shud .wing.r{clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%);border-left:none;align-items:flex-start}
.shud .wing label{display:flex;gap:8px;font:700 9px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.24em;color:rgba(200,225,255,.8)}
.shud .wing label b{font:600 10px 'JetBrains Mono',monospace;letter-spacing:.04em;color:#fff;font-variant-numeric:tabular-nums}
.shud .seg{position:relative;width:100%;height:7px;background:rgba(255,255,255,.08)}
.shud .seg u{position:absolute;top:0;bottom:0;width:100%;transition:width .18s ease-out}
.shud .seg::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 9px,rgba(4,8,20,.95) 9px 11px)}
.shud .wing.l .seg u{right:0}.shud .wing.r .seg u{left:0}
.shud u.sh{background:linear-gradient(180deg,#bfe0ff,#5f9dff);box-shadow:0 0 8px rgba(110,170,255,.8)}
.shud u.hu{background:linear-gradient(180deg,#c6ffd9,#3fd07c);box-shadow:0 0 8px rgba(90,230,140,.7)}
.shud.low u.hu{background:linear-gradient(180deg,#ffd0c0,#ff4a3a);box-shadow:0 0 10px rgba(255,80,60,.9);animation:shudPulse .6s infinite alternate}
.shud .core{position:relative;min-width:118px;height:46px;padding:0 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:linear-gradient(180deg,rgba(14,30,56,.9),rgba(4,10,24,.85));border:1px solid rgba(127,227,255,.6);clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%,0 50%)}
.shud .core::before{content:"";position:absolute;left:14px;right:14px;top:0;height:2px;background:linear-gradient(90deg,transparent,#7fe3ff,transparent)}
.shud .core b{font:700 24px/1 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.06em;font-variant-numeric:tabular-nums;text-shadow:0 0 10px rgba(127,227,255,.6)}
.shud .core small{font:600 8px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.3em;color:rgba(190,230,255,.7);margin-top:2px}
.shud .sub{display:flex;align-items:center;justify-content:center;gap:14px;width:min(420px,100%);font:700 9px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.22em;color:rgba(200,225,255,.8)}
.shud .sub .ze{flex:1;display:flex;align-items:center;gap:8px}.shud .sub .ze .seg{height:4px;flex:1}
.shud .sub .ze .seg u{left:0;background:linear-gradient(90deg,#ffb84a,#ffe08a);box-shadow:0 0 8px rgba(255,200,90,.8)}
.shud .sub .ze span{color:#ffd27a;letter-spacing:.12em;min-width:64px;text-align:right}
.shud.zready .sub .ze span{animation:shudPulse .5s infinite alternate}
.shud .sub .ms{display:flex;align-items:center;gap:6px}.shud .sub .ms span{color:#ffd27a;letter-spacing:.14em;font-size:11px}
.shud .sub .ex{color:#eef4ff;letter-spacing:.12em;font-family:'JetBrains Mono',monospace;font-weight:500}
.shud .city{width:min(420px,100%);display:flex;align-items:center;gap:8px;font:700 9px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.22em;color:rgba(200,225,255,.85)}
.shud .city .seg{flex:1;height:6px}
.shud .city .seg u{left:0;background:linear-gradient(90deg,#7fe3ff,#e9fbff);box-shadow:0 0 8px rgba(127,227,255,.7)}
.shud .city.warn .seg u{background:linear-gradient(90deg,#ff4a3a,#ffb08a);box-shadow:0 0 10px rgba(255,90,60,.9)}
.shud .city.warn{color:#ff9a8a}.shud .city b{font:600 10px 'JetBrains Mono',monospace;color:#fff;min-width:34px;text-align:right}
.shud.hit .wing{border-color:rgba(255,120,100,.9)}
.shud.down{opacity:.45}
@keyframes shudPulse{from{opacity:1}to{opacity:.45}}
.shud.phone{top:auto!important;left:calc(env(safe-area-inset-left,0px) + 10px);bottom:calc(env(safe-area-inset-bottom,0px) + 10px);transform:none;width:min(300px,58vw)!important;align-items:stretch;gap:3px}
.shud.phone .nm{display:none}.shud.phone .core{min-width:72px;height:34px;padding:0 8px}.shud.phone .core b{font-size:17px}.shud.phone .core small{font-size:7px}
.shud.phone .wing{height:24px;padding:0 7px}.shud.phone .wing label{font-size:8px;letter-spacing:.12em}.shud.phone .sub,.shud.phone .city{font-size:8px;letter-spacing:.1em;gap:8px;width:100%}
.shud.phone .sub .ex{display:none}
  .shud .wing{height:26px;padding:0 8px}.shud .wing label{font-size:8px;letter-spacing:.14em}.shud .nm{display:none}.shud .sub,.shud .city{font-size:8px;letter-spacing:.12em}}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const el=document.createElement('div');el.className='shud';el.id='shud';
  el.innerHTML=`<div class="nm" id="shudName">LT. MICHAEL · INTERCEPTOR WING</div>
<div class="main">
  <div class="wing l"><label>SHIELD <b id="shP">100</b></label><div class="seg"><u class="sh" id="shB"></u></div></div>
  <div class="core"><b id="spdN">0</b><small id="spdU">M/S</small></div>
  <div class="wing r"><label><b id="huP">100</b> HULL</label><div class="seg"><u class="hu" id="huB"></u></div></div>
</div>
<div class="sub"><div class="ze" id="zeRow">ZEAL<div class="seg"><u id="zeB" style="width:0"></u></div><span id="zealT">charging</span></div>
  <div class="ms">MSL <span id="mslT"></span></div><div class="ex" id="spd"></div></div>
<div class="city" id="cityRow" hidden><span id="cityName">TIDE CITY</span><div class="seg"><u id="cityB"></u></div><b id="cityP">100%</b></div>`;
  document.body.appendChild(el);
  if(coarse)el.classList.add('phone');
  const g=id=>document.getElementById(id);
  let lastShield=100,lastHull=100,hitT=0;
  function update(o){
    if(o.shield!=null){const v=Math.max(0,o.shield);g('shB').style.width=v+'%';g('shP').textContent=Math.round(v);if(v<lastShield-.5)hitT=performance.now();lastShield=v;}
    if(o.hull!=null){const v=Math.max(0,o.hull);g('huB').style.width=v+'%';g('huP').textContent=Math.round(v);if(v<lastHull-.5)hitT=performance.now();lastHull=v;el.classList.toggle('low',v<30);}
    el.classList.toggle('hit',performance.now()-hitT<220);
    if(o.speed!=null)g('spdN').textContent=Math.round(o.speed);
    if(o.unit)g('spdU').textContent=o.unit;
    if(o.extra!=null)g('spd').textContent=o.extra;
    if(o.zeal===null)g('zeRow').style.display='none';
    else if(o.zeal!=null){g('zeRow').style.display='';g('zeB').style.width=o.zeal+'%';g('zealT').textContent=o.zealText||'';el.classList.toggle('zready',!!o.zealReady);}
    if(o.mslReady!=null){const n=Math.round(clamp(o.mslReady,0,1)*5);g('mslT').textContent=o.mslReady>=1?'READY':'◆'.repeat(n)+'◇'.repeat(5-n);}
    else if(o.msl!=null){const m=o.mslMax||6;g('mslT').textContent='◆'.repeat(o.msl)+'◇'.repeat(Math.max(0,m-o.msl));}
    if(o.city!=null){const r=g('cityRow');r.hidden=false;const v=Math.max(0,o.city);g('cityB').style.width=v+'%';g('cityP').textContent=Math.ceil(v)+'%';r.classList.toggle('warn',v<35);}
    if(o.down!=null)el.classList.toggle('down',!!o.down);
    if(o.visible!=null)el.style.display=o.visible?'':'none';
  }
  return{update,el};
})();
