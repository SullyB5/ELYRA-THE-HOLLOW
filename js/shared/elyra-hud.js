/* Elyra shared · the campaign HUD (Nov 9 2026, Bryce: "make the HUD just like Halo Reach, but health on top and the Zeal bar on the
   bottom"; grenades top left like Halo 3, the gun top right like Reach; simple reticles, no add-on sights; vehicles and ships special).
   On foot, in every campaign level that runs js/origin/03-play.js. Load after js/shared/visor.js; needs js/shared/reticles.js.

     top middle   Reach's vitals, flipped: health as a row of segments on top, the shield as the long bar under it (both drain from the
                  ends toward the middle), Zeal as a thin gold line at the bottom. Shield gone: the bar's frame flashes red.
     top left     grenades, Halo 3's box: the count and the grenade. Red and dim when you have none.
     top right    the gun, Reach's way: the ammo you carry beside the gun's outline, a tick for every round in the magazine under it, and
                  the other gun smaller beneath with its ammo. "RELOAD" shows under the reticle when the magazine is low or empty.
     middle       one simple reticle per gun (js/shared/reticles.js). Aiming zooms the view (no sight on the gun) and the reticle stays.
     bottom left  the motion tracker (25 m): Keepers yellow, anything of theirs that moves red. PC only; on/off in the pause menu's Settings.
   TakeOver (Nov 9 2026) runs this same HUD: the match's clock and kill feed sit under the gun box (js/mp/03-match.js).
   Vehicles and ships (Nov 9 2026, Bryce: "make all vehicles and ships have the same HUD above the screen, the only thing that changes is
   the reticle"): in a Warthog, a mech, the Site K dropship or The Last Signal's interceptor the top of the screen stays exactly as on foot
   (vitals, grenades, your guns). The shield bar shows what is covering you (the vehicle's armour, the ship's shields), the health
   segments what dies with you (you, or the ship's hull). Only the reticle changes, to the vehicle's or ship's. The old hull strip
   (js/shared/shiphud.js) and the flight bars (.dogbar) are hidden while this HUD runs.
   The Heralds and Tide City (all flight, no guns on foot) load this file too: the same vitals and box, drawn from what the page gives
   the old strip (SHUD.last); the box carries your missiles, there are no guns top right, and the page's own ship reticle stays.
   Reads the chapter's state itself every frame (P, GUNS, VEH, FLY...), so the chapters don't call it. Global `EHUD`. */
const EHUD=(()=>{
  const touch=typeof coarse!=='undefined'?coarse:matchMedia('(pointer:coarse)').matches;
  const css=`
body.eh-on #wpanel,body.eh-on #cross,body.eh-on .vz-ticks{display:none!important}
body.eh-on #shud,body.eh-on .dogbar,body.eh-ship #shud{display:none!important}
.eh-nd .fl{position:absolute;left:0;bottom:0;height:2px;width:0;background:#9fe8ff;box-shadow:0 0 5px rgba(110,210,255,.8)}
body.eh-on .vz-glass .vzA,body.eh-on .vz-glass .vzB{display:none}
.eh{position:fixed;z-index:2;pointer-events:none;font-family:'VG Label','Arial Narrow',sans-serif;color:#dff6ff;
  filter:drop-shadow(0 1px 2px rgba(0,0,0,.65));transition:opacity .25s}
.eh.off{opacity:0}
/* ---- vitals ---- */
.eh-vit{left:50%;top:calc(env(safe-area-inset-top,0px) + 10px);transform:translateX(-50%);width:min(352px,42vw)}
.eh-vit svg{display:block;width:100%;height:auto;overflow:visible}
.eh-vit .tr{fill:none;stroke-linecap:butt}
.eh-vit .hp-t{stroke:rgba(143,228,255,.13)}.eh-vit .hp{stroke:#bff0ff;filter:drop-shadow(0 0 2.5px rgba(140,225,255,.8));transition:stroke-dasharray .15s}
.eh-vit.mid .hp{stroke:#ffc24a;filter:drop-shadow(0 0 2.5px rgba(255,190,70,.8))}
.eh-vit.low .hp{stroke:#ff4a3a;filter:drop-shadow(0 0 3px rgba(255,70,50,.9));animation:ehPulse .45s infinite alternate}
.eh-vit .sh-t{stroke:rgba(6,18,34,.5)}.eh-vit .sh-o{fill:none;stroke:rgba(143,228,255,.45);stroke-width:.8}
.eh-vit .sh{stroke:url(#ehShG);filter:drop-shadow(0 0 3px rgba(110,210,255,.85));transition:stroke-dasharray .15s ease-out}
.eh-vit.hit .sh{filter:drop-shadow(0 0 5px #fff) brightness(1.6)}
.eh-vit.sout .sh-t{stroke:rgba(90,10,8,.55)}.eh-vit.sout .sh-o{stroke:#ff4a3a;animation:ehFlash .35s infinite alternate}
.eh-vit .ze-t{stroke:rgba(255,210,122,.16)}.eh-vit .ze{stroke:#ffd27a;filter:drop-shadow(0 0 3px rgba(255,190,80,.95));transition:stroke-dasharray .2s linear}
.eh-vit.zready .ze{stroke:#ffe8a8;animation:ehPulse .45s infinite alternate}.eh-vit.zburn .ze{stroke:#fff3c8}
.eh-vit>b{position:absolute;left:50%;top:100%;margin-top:2px;transform:translateX(-50%);font:700 8px 'VG Display','Arial Narrow',sans-serif;letter-spacing:.26em;color:#ffd27a;white-space:nowrap;opacity:0;transition:opacity .2s}
.eh-vit.zready>b{opacity:1}
.eh-vit.down{opacity:.4}
/* ---- grenades (Halo 3) ---- */
.eh-nd{left:calc(env(safe-area-inset-left,0px) + 62px);top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;align-items:center;gap:6px;height:40px;padding:0 10px 0 8px;
  border:1.5px solid rgba(143,228,255,.75);border-radius:7px;background:rgba(6,18,34,.32);box-shadow:0 0 8px rgba(110,210,255,.35) inset}
.eh-nd b{font:600 22px/1 'VG Label','Arial Narrow',sans-serif;color:#eafcff;font-variant-numeric:tabular-nums;min-width:12px;text-align:center}
.eh-nd svg{width:24px;height:28px}
.eh-nd svg{overflow:visible}
.eh-nd svg path{fill:none;stroke-linejoin:round;stroke-linecap:round}
.eh-nd svg .k{stroke:rgba(0,8,16,.6);stroke-width:3.4}
.eh-nd svg .c{stroke:#9fe8ff;stroke-width:1.5}
.eh-nd.out{border-color:rgba(255,110,90,.55)}.eh-nd.out b{color:#ff8a7a}.eh-nd.out svg{opacity:.35}
.eh-nd.pop{animation:ehPop .3s}
/* ---- the gun (Reach) ---- */
.eh-wp{right:calc(env(safe-area-inset-right,0px) + 16px);top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.eh-wp .row{display:flex;align-items:center;gap:8px}
.eh-wp .res{font:500 17px/1 'VG Label','Arial Narrow',sans-serif;color:#cdefff;font-variant-numeric:tabular-nums;letter-spacing:.02em}
.eh-wp .ic{width:132px;height:40px}
.eh-wp .ic{overflow:visible}
.eh-wp .ic path{stroke-linejoin:round;stroke-linecap:round}
.eh-wp .ic .k{fill:none;stroke:rgba(0,8,16,.6);stroke-width:3.6}
.eh-wp .ic .b{fill:rgba(143,228,255,.1);stroke:#9fe8ff;stroke-width:1.5}
.eh-wp .ic .dk{fill:none;stroke:rgba(0,8,16,.35);stroke-width:2.4}
.eh-wp .ic .dl{fill:none;stroke:rgba(175,236,255,.85);stroke-width:1}
.eh-wp .tk{display:grid;gap:2px 2px;justify-content:end}
.eh-wp .tk i{display:block;width:3px;height:10px;background:#9fe8ff;box-shadow:0 0 4px rgba(110,210,255,.75);transform:skewX(-14deg)}
.eh-wp .tk i.x{background:rgba(143,228,255,.13);box-shadow:none}
.eh-wp .tk.big i{width:9px;height:13px}
.eh-wp .tk.low i:not(.x){background:#ff8a7a;box-shadow:0 0 4px rgba(255,90,70,.8)}
.eh-wp.rl .tk{animation:ehPulse .3s infinite alternate}
.eh-wp .sec{opacity:.5;margin-top:4px}
.eh-wp .sec .ic{width:78px;height:24px}.eh-wp .sec .res{font-size:12px}
.eh-wp .vn{font:700 10px 'VG Display','Arial Narrow',sans-serif;letter-spacing:.22em;color:#bfeaff}
.eh-wp .vs{font:600 14px 'VG Label','Arial Narrow',sans-serif;color:#eafcff;letter-spacing:.06em}
.eh-wp.veh .gun{display:none}.eh-wp .vrow{display:none}.eh-wp.veh .vrow{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
/* ---- under the reticle ---- */
.eh-warn{left:50%;top:calc(50% + 46px);transform:translateX(-50%);font:700 10px 'VG Display','Arial Narrow',sans-serif;letter-spacing:.3em;color:#ff8a7a;opacity:0}
.eh-warn.on{opacity:1;animation:ehPulse .4s infinite alternate}
.eh-zm{position:fixed;left:50%;top:50%;z-index:1;pointer-events:none;border-radius:50%;transform:translate(-50%,-50%);border:1px solid rgba(143,228,255,.22);
  box-shadow:0 0 0 1px rgba(0,0,0,.18),0 0 40px rgba(110,210,255,.08) inset;opacity:0;transition:opacity .15s}
.eh-zm.on{opacity:1}
.eh-zm b{position:absolute;right:12%;bottom:12%;font:600 11px 'VG Label','Arial Narrow',sans-serif;color:rgba(190,240,255,.8);letter-spacing:.08em}
/* ---- motion tracker ---- */
.eh-mt{left:calc(env(safe-area-inset-left,0px) + 18px);bottom:calc(env(safe-area-inset-bottom,0px) + 18px);width:150px;height:150px}
.eh-mt canvas{width:100%;height:100%}
.eh-mt b{position:absolute;right:-4px;bottom:-2px;font:600 13px 'VG Label','Arial Narrow',sans-serif;color:#9fe8ff;font-style:italic}
.eh-mt.hide{display:none}
@keyframes ehPulse{from{opacity:1}to{opacity:.4}}
@keyframes ehFlash{from{opacity:1}to{opacity:.55}}
@keyframes ehPop{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
/* ---- phones ---- */
@media (pointer:coarse){
  .eh-vit{width:min(216px,36vw);top:calc(env(safe-area-inset-top,0px) + 8px)}
  .eh-nd{left:calc(env(safe-area-inset-left,0px) + 58px);top:calc(env(safe-area-inset-top,0px) + 10px);height:32px;padding:0 7px}.eh-nd b{font-size:17px}.eh-nd svg{width:18px;height:22px}
  .eh-wp{top:calc(env(safe-area-inset-top,0px) + 8px)}.eh-wp .ic{width:96px;height:30px}.eh-wp .res{font-size:14px}.eh-wp .tk i{width:2px;height:7px}.eh-wp .tk.big i{width:6px;height:9px}
  .eh-wp .sec .ic{width:58px;height:18px}.eh-mt{display:none}}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  /* ---------- gun outlines (viewBox 0 0 132 40, muzzle to the right as Halo draws them) ----------
     Nov 9 2026 (Bryce: "make the guns top right and the grenades top left look better quality"): each gun is its outline (o) plus
     the inner lines that make it read as that gun (d): ejection port, rails, magazine ribs, trigger guard, scope mounts. Drawn like the
     reticles: a dark edge under a crisp cyan line, so they hold up on sand and in the dark, no blur filter. */
  const ICON={
    ar:{o:'M3 15L8 12H28L31 14H40V10H58L61 7H83L86 10H104V13H122L126 14.5V17.5L122 19H104V22H84L81 24H76L73 34H63L65.5 24H52L48.5 32H40.5L43 24H31L27 23H8L3 20Z',
      d:'M10 15.5H26M10 19.5H26M64 12H76V16H64ZM88 10V13M93 10V13M98 10V13M104 16H121M66.6 27.5H73.4M65.7 31H72.5M52 24V27.5H43'},
    har:{o:'M5 21Q16 12 36 10L60 9Q70 4 86 6Q108 8 127 18Q110 22 88 23L80 24L74 34H64L67 25Q40 28 5 21Z',
      d:'M24 18Q60 13 98 14.5M84 9.5Q102 10.5 116 16M70 17A2.2 2.2 0 1 0 74.4 17A2.2 2.2 0 1 0 70 17M67.5 28H75.5'},
    smg:{o:'M20 15L26 12H42V9H70L73 7H86L88 10H104V13H114V17H104V20H88L86 22H78L76 35H67L68.5 22H58L55 31H47L49.5 22H40L36 21H26L20 19Z',
      d:'M28 15.5H39M74 11H84V14H74ZM104 15H113M69.6 26H76M69.1 30H75.5M46 13V18M50 13V18'},
    hsmg:{o:'M18 21Q30 10 56 11Q66 6 80 9Q100 11 116 19Q98 24 80 23L72 34H62L65 24Q40 26 18 21Z',
      d:'M32 18Q60 14 94 15.5M70 12Q86 12 100 16.5M64.5 28H73M58 17A2 2 0 1 0 62 17A2 2 0 1 0 58 17'},
    pistol:{o:'M38 11L41 9H96L99 11V19H77L75 22H70L66 34H54L58 21H44L40 20L38 18Z',
      d:'M42 15.5H95M45 10V13.5M48 10V13.5M51 10V13.5M70 11H80V13.5H70ZM60 24L58 31M63.5 24L61.5 31'},
    fang:{o:'M34 20Q48 8 76 10Q94 11 106 19Q92 23 74 22L66 34H55L59 23Q46 24 34 20Z',
      d:'M44 17.5Q66 13 94 16.5M80 13.5L84.5 16.5L80 19.5M60 26.5H67.5'},
    sniper:{o:'M2 19L10 14H40L44 13H96V15H128V18H96V21H74L72 23H67L64 32H56L58.5 23H48L44 22H36L30 26H20L18 22H10L2 21ZM50 6.5L52 5H90L92 6.5V9H50Z',
      d:'M60 9V13M82 9V13M12 17.5H34M53 5V9M89 5V9M100 16.5H120M122 14.5V18.5M125 14.5V18.5'},
    rocket:{o:'M6 11L10 9H104L110 11L118 12V28L110 29L104 31H10L6 29ZM52 9V5H66V9ZM44 31L47 37H57L55 31ZM74 31L76 35H83L82 31Z',
      d:'M10 20H110M30 9V31M84 9V31M114 13V27M58 5V9'},
    heavy:{o:'M8 20Q22 6 60 8Q98 7 125 16Q121 30 92 30L82 36H67L71 30Q30 34 8 20Z',
      d:'M24 19Q60 12 104 15M40 25Q70 24 100 24.5M107 20A3 3 0 1 0 113 20A3 3 0 1 0 107 20M74 33H85'}};
  // the grenade: a frag, drawn the same way (cap, pin ring, spoon, the band round the body), nothing in the middle
  const NADE_D='M9.5 3H14.5V6.6H9.5ZM14.5 4.2H17.6Q19.4 4.2 19 6.6L17.6 12M8.4 5.2H9.5M4 5.2A2.2 2.2 0 1 0 8.4 5.2A2.2 2.2 0 1 0 4 5.2M12 6.6C17 6.6 20.6 11 20.6 16.5S17 26.2 12 26.2S3.4 22 3.4 16.5S7 6.6 12 6.6ZM3.6 15.6H20.4';
  const NADE=`<svg viewBox="0 0 24 28" aria-hidden="true"><path class="k" d="${NADE_D}"/><path class="c" d="${NADE_D}"/></svg>`;
  const icon=k=>{const I=ICON[k]||ICON.ar;return `<svg class="ic" viewBox="0 0 132 40" aria-hidden="true"><path class="k" d="${I.o}"/><path class="b" d="${I.o}"/><path class="dk" d="${I.d}"/><path class="dl" d="${I.d}"/></svg>`;};

  /* ---------- build ---------- */
  const mk=(cls,html)=>{const d=document.createElement('div');d.className='eh '+cls;d.innerHTML=html||'';document.body.appendChild(d);return d;};
  /* (Nov 9, Bryce) the strip is a shallow wing: each half rises a little from the middle out (health segments on top, the shield
     under them), 1/5 smaller than before; Zeal is a curve right under it that dips below the middle and climbs to a peak at each side.
     Every bar fills from the middle outward, so it drains from the ends in */
  const vit=mk('eh-vit','<svg viewBox="0 -2 360 42" aria-hidden="true"><defs><linearGradient id="ehShG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f9ff"/><stop offset=".45" stop-color="#8fe4ff"/><stop offset="1" stop-color="#3fa8e8"/></linearGradient><mask id="ehHpM" maskUnits="userSpaceOnUse" x="-10" y="-10" width="380" height="60"><path class="tr " d="M180 9 L82 3" pathLength="100" stroke-width="8" stroke="#fff" stroke-dasharray="0 1.2 18.8 1.2"/><path class="tr " d="M180 9 L278 3" pathLength="100" stroke-width="8" stroke="#fff" stroke-dasharray="0 1.2 18.8 1.2"/></mask><mask id="ehShM" maskUnits="userSpaceOnUse" x="-10" y="-10" width="380" height="60"><path class="tr " d="M180 21 L8 11" pathLength="100" stroke-width="12" stroke="#fff" stroke-dasharray="0 .35 6.4 .35"/><path class="tr " d="M180 21 L352 11" pathLength="100" stroke-width="12" stroke="#fff" stroke-dasharray="0 .35 6.4 .35"/></mask></defs><g mask="url(#ehHpM)"><path class="tr hp-t" d="M180 9 L82 3" pathLength="100" stroke-width="5"/><path class="tr hp-t" d="M180 9 L278 3" pathLength="100" stroke-width="5"/><path class="tr hp" d="M180 9 L82 3" pathLength="100" stroke-width="5" stroke-dasharray="100 200"/><path class="tr hp" d="M180 9 L278 3" pathLength="100" stroke-width="5" stroke-dasharray="100 200"/></g><path class="sh-o" d="M180 15.5 L6 5.5 L6 16.5 L180 26.5 L354 16.5 L354 5.5 Z"/><g mask="url(#ehShM)"><path class="tr sh-t" d="M180 21 L8 11" pathLength="100" stroke-width="9"/><path class="tr sh-t" d="M180 21 L352 11" pathLength="100" stroke-width="9"/><path class="tr sh" d="M180 21 L8 11" pathLength="100" stroke-width="7" stroke-dasharray="100 200"/><path class="tr sh" d="M180 21 L352 11" pathLength="100" stroke-width="7" stroke-dasharray="100 200"/></g><path class="tr ze-t" d="M180 36 Q96 36 14 18" pathLength="100" stroke-width="2.4"/><path class="tr ze-t" d="M180 36 Q264 36 346 18" pathLength="100" stroke-width="2.4"/><path class="tr ze" d="M180 36 Q96 36 14 18" pathLength="100" stroke-width="2.4" stroke-dasharray="0 200"/><path class="tr ze" d="M180 36 Q264 36 346 18" pathLength="100" stroke-width="2.4" stroke-dasharray="0 200"/></svg><b></b>');
  const hpP=[...vit.querySelectorAll('.hp')],shP=[...vit.querySelectorAll('.sh')],zeP=[...vit.querySelectorAll('.ze')],zeB=vit.querySelector(':scope>b');
  const dash=(L,f)=>{const d=(Math.max(0,Math.min(1,f))*100).toFixed(1)+' 200';for(const p of L)if(p.getAttribute('stroke-dasharray')!==d)p.setAttribute('stroke-dasharray',d);};
  const nd=mk('eh-nd','<b>3</b>'+NADE);let ndB=nd.querySelector('b');
  const wp=mk('eh-wp',`<div class="gun"><div class="row"><span class="res"></span><span class="pi"></span></div><div class="tk"></div>
    <div class="row sec"><span class="res"></span><span class="si"></span></div></div><div class="vrow"><span class="vn"></span><span class="vs"></span></div>`);
  const W={res:wp.querySelector('.gun>.row .res'),pi:wp.querySelector('.pi'),tk:wp.querySelector('.tk'),sres:wp.querySelector('.sec .res'),si:wp.querySelector('.si'),vn:wp.querySelector('.vn'),vs:wp.querySelector('.vs')};
  const warn=mk('eh-warn');
  const zm=document.createElement('div');zm.className='eh-zm';zm.innerHTML='<b></b>';document.body.appendChild(zm);
  const ret=document.createElement('div');document.body.appendChild(ret);RETICLE.mount(ret,'ar');
  const mt=mk('eh-mt','<canvas width="300" height="300"></canvas><b>25m</b>'),mtC=mt.querySelector('canvas').getContext('2d');
  // a flight level (The Heralds, Tide City): no foot soldier, so no guns, tracker or reticle of ours; the box carries missiles
  const SHIP=typeof GUNS==='undefined'&&typeof SHUD!=='undefined';
  if(SHIP){const MSL='M10 9V21H14V9Q14 4 12 1.8Q10 4 10 9ZM10 10.5H14M10 17L6.5 22V25.5L10 23.5M14 17L17.5 22V25.5L14 23.5M11 21V24.5M13 21V24.5';
    nd.innerHTML=`<b>1</b><svg viewBox="0 0 24 28" aria-hidden="true"><path class="k" d="${MSL}"/><path class="c" d="${MSL}"/></svg><s class="fl"></s>`;nd.style.overflow='hidden';
    ndB=nd.querySelector('b');wp.style.display='none';ret.style.display='none';mt.style.display='none';document.body.classList.add('eh-ship');}
  else document.body.classList.add('eh-on');
  // phones: Zeal is a tap on the shield (the old gem's job); the tap is handed to the gem's own handler (js/shared/shiphud.js)
  if(touch){vit.addEventListener('pointerdown',e=>{if(!vit.classList.contains('zready'))return;const c=document.querySelector('#shud .core');
    if(c){e.preventDefault();e.stopPropagation();c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));}});}

  /* ---------- the tracker's switch in the pause menu ---------- */
  const TK='elyra.tracker';let trackerOn=(()=>{try{return localStorage.getItem(TK)!=='off';}catch(_){return true;}})();
  function addSwitch(){const card=document.querySelector('.pz .card');if(!card||card.querySelector('[data-eh=mt]')||touch)return!!card;
    const b=document.createElement('button');b.type='button';b.dataset.eh='mt';const draw=()=>{b.textContent='Motion tracker: '+(trackerOn?'on':'off');};draw();
    b.addEventListener('click',e=>{e.stopPropagation();trackerOn=!trackerOn;try{localStorage.setItem(TK,trackerOn?'on':'off');}catch(_){}draw();});
    card.insertBefore(b,card.querySelector('[data-a=restart]'));return true;}
  let switchTries=0;

  /* ---------- no sight fitted on the guns: strip any that went on before this file loaded ---------- */
  function stripSights(){if(typeof ARMS==='undefined')return;for(const o of ARMS.vm){if(!o||!o.userData.sight)continue;const s=o.userData.sight;if(s.parent)s.parent.remove(s);o.userData.sight=null;}}

  /* ---------- each frame ---------- */
  const g=(n,d)=>{try{return n();}catch(_){return d;}};
  let lastSh=1,hitT=0,nadeN=-1,tickN=-1,tickLit=-1,pKey='',sKey='',rk='',hitUntil=0,last=performance.now(),mtT=0;
  const prev=new Map();
  function ticks(mag,max,rl){const n=Math.max(1,Math.min(60,max|0));
    if(n!==tickN){tickN=n;tickLit=-1;const per=n>30?Math.ceil(n/2):n;W.tk.style.gridTemplateColumns=`repeat(${per},auto)`;W.tk.classList.toggle('big',n<=4);W.tk.innerHTML='<i></i>'.repeat(n);}
    const lit=rl?0:Math.max(0,Math.min(n,mag|0));if(lit!==tickLit){tickLit=lit;const L=W.tk.children;for(let i=0;i<L.length;i++)L[i].classList.toggle('x',i>=lit);W.tk.classList.toggle('low',lit<=Math.ceil(n*.2));}}
  function frame(){requestAnimationFrame(frame);
    const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;
    if(SHIP){shipFrame();return;}
    if(typeof P==='undefined'||typeof GUNS==='undefined')return;
    if(switchTries<200&&!addSwitch())switchTries++;
    const inCut=g(()=>CUTS.on,false)||g(()=>PROLOGUE.on,false),brief=!!document.querySelector('.pghq'),paused=g(()=>PG.paused,false)&&!document.querySelector('.pz:not([hidden])');
    // what you're flying, if anything: The Last Signal's interceptor (FLY.on, FLY.state.c) or the Site K dropship (FLY.ds, FLY.shields)
    const FS=g(()=>FLY&&FLY.on&&FLY.state?{sh:FLY.state.c.shield/FLY.state.c.maxShield,hp:FLY.state.c.hull/FLY.state.c.maxHull}:
      FLY&&FLY.ds&&FLY.shields!=null?{sh:FLY.shields/100,hp:FLY.broken>3?FLY.shields/100:1}:null,null);
    const flying=!!FS,Vh=flying?null:g(()=>inVeh()?VEH.cur:null,null),third=g(()=>window.ELYRA_VIEW.get()==='third',false);
    const show=!inCut&&!brief&&!paused,arm=P.alive&&P.input;
    const foot=!Vh&&!flying;
    document.body.classList.toggle('eh-foot',foot);
    vit.classList.toggle('off',!show);nd.classList.toggle('off',!show);wp.classList.toggle('off',!show);
    // vitals: health on top, the shield under it, Zeal under that
    const cl=v=>Math.max(0,Math.min(1,v||0)),hf=cl(FS?FS.hp:P.hp/P.maxHp),sf=cl(FS?FS.sh:Vh?Vh.hp/Vh.max:P.shield/P.maxShield);
    dash(hpP,Math.ceil(hf*5-.001)/5);
    vit.classList.toggle('low',hf<.3);vit.classList.toggle('mid',hf>=.3&&hf<.6);
    dash(shP,sf);
    if(sf<lastSh-.005)hitT=now;lastSh=sf;vit.classList.toggle('hit',now-hitT<200);vit.classList.toggle('sout',sf<.01&&P.alive);vit.classList.toggle('down',!P.alive);
    const ZT=g(()=>ZEAL_T,10),zb=P.zealT>0,zv=zb?P.zealT/ZT:Math.min(1,(P.zeal||0)/100),zr=!zb&&(P.zeal||0)>=100;
    dash(zeP,zv);vit.classList.toggle('zready',zr);if(touch)vit.style.pointerEvents=zr&&show&&foot?'auto':'none';vit.classList.toggle('zburn',zb);
    if(zr){const t=touch?'ZEAL · TAP THE SHIELD':'ZEAL · '+g(()=>keyName('Digit4'),'4');if(zeB.textContent!==t)zeB.textContent=t;}
    // grenades
    if(P.nades!==nadeN){if(nadeN>=0&&P.nades>nadeN){nd.classList.remove('pop');void nd.offsetWidth;nd.classList.add('pop');}nadeN=P.nades;ndB.textContent=P.nades;nd.classList.toggle('out',P.nades<=0);}
    // the gun, or the vehicle's weapon
    {const G=GUNS[P.gun],A=P.ammo[P.gun],j=P.gun?0:1,G2=GUNS[j],A2=P.ammo[j];
      const k1=RETICLE.ofGun(G),k2=G2?RETICLE.ofGun(G2):'';
      if(k1+G.id!==pKey){pKey=k1+G.id;W.pi.innerHTML=icon(k1);}if(k2+(G2&&G2.id)!==sKey){sKey=k2+(G2&&G2.id);W.si.innerHTML=G2?icon(k2):'';}
      W.res.textContent=G.inf?'∞':A.res;W.sres.textContent=G2?(G2.inf?'∞':A2.mag+A2.res):'';
      ticks(A.mag,G.mag,P.reloadT>0);wp.classList.toggle('rl',P.reloadT>0);
      /* (Nov 9 fix, Bryce: "when the rocket is reloaded, it still asks to be reloaded again"): the Breaker holds one rocket, so
         ceil(1×.2) = 1 called a loaded launcher low. Low now means below a full magazine AND at or under a fifth of it, and only
         with something left to load (an empty reserve with rounds still in the gun has nothing to reload) */
      const low=P.reloadT<=0&&A.mag<G.mag&&A.mag<=Math.ceil(G.mag*.2)&&(A.res>0||G.inf||A.mag<=0);warn.textContent=A.mag<=0&&A.res<=0&&!G.inf?'NO AMMO':'RELOAD';
      warn.classList.toggle('on',show&&arm&&low&&!flying);}
    if(Vh||flying)warn.classList.remove('on');
    // the reticle
    const scoped=!!g(()=>document.getElementById('scope').classList.contains('on'),false);
    let kind;if(flying)kind='ship';else if(Vh)kind=Vh.kind==='walker'?'walker':Vh.weap==='rocket'?'rhog':Vh.weap==='laser'?'lhog':'hog';else kind=RETICLE.ofGun(GUNS[P.gun]);
    if(kind!==rk){rk=kind;RETICLE.mount(ret,kind);}
    ret.style.display=show&&(arm||flying)&&!scoped?'':'none';
    const cr=document.getElementById('cross');if(cr&&cr.classList.contains('hit'))hitUntil=now+110;
    const o={target:!Vh&&!flying&&!!P.onTarget,hit:now<hitUntil};
    if(Vh){if(Vh.weap&&Vh.weap!=='chain'&&Vh.kind==='rover')o.charge=1-Math.max(0,Math.min(1,Vh.heat||0));else if(Vh.kind==='rover')o.heat=Vh.over>0?1:Vh.heat||0;else o.heat=Vh.heat!=null?Vh.heat:0;}
    if(flying)o.charge=g(()=>1-Math.max(0,FLY.state.mslCool)/HFLY.H.mslCD,1);
    RETICLE.set(ret,o);
    // zoom without a sight: the reticle stays, a faint ring and the zoom level
    const G=GUNS[P.gun],zOn=show&&arm&&foot&&!scoped&&!third&&P.ads>.6&&!G.scope;zm.classList.toggle('on',zOn);
    if(zOn){const R=Math.round(Math.min(innerWidth,innerHeight)*.36);zm.style.width=zm.style.height=2*R+'px';zm.querySelector('b').textContent=(G.zoom||2).toFixed(1).replace('.0','')+'×';}
    // the motion tracker, ten times a second
    mt.classList.toggle('hide',!trackerOn||!show||flying);
    mtT-=dt;if(mtT<=0&&trackerOn&&show&&!flying){mtT=.1;drawTracker(.1);}
  }
  // the flight levels: the same vitals and box, from the values the page gives the old strip
  let shipHit=0,shipSh=1;
  function shipFrame(){const L=SHUD.last,now=performance.now();
    const show=!g(()=>CUTS.on,false)&&!document.querySelector('.pghq')&&!(g(()=>PG.paused,false)&&!document.querySelector('.pz:not([hidden])'))&&L.visible!==false&&L.hull!=null;
    vit.classList.toggle('off',!show);nd.classList.toggle('off',!show);if(!show)return;
    const cl=v=>Math.max(0,Math.min(1,(v||0)/100)),hf=cl(L.hull),sf=cl(L.shield);
    dash(hpP,Math.ceil(hf*5-.001)/5);vit.classList.toggle('low',hf<.3);vit.classList.toggle('mid',hf>=.3&&hf<.6);
    dash(shP,sf);if(sf<shipSh-.005)shipHit=now;shipSh=sf;vit.classList.toggle('hit',now-shipHit<200);vit.classList.toggle('sout',sf<.01&&!L.down);vit.classList.toggle('down',!!L.down);
    const zr=!!L.zealReady;dash(zeP,L.zeal==null?0:cl(L.zeal));vit.classList.toggle('zready',zr);vit.classList.toggle('zburn',L.zealText==='burning');
    if(touch)vit.style.pointerEvents=zr?'auto':'none';
    if(zr){const t=touch?'ZEAL · TAP THE SHIELD':'ZEAL · '+(L.zealKey||'Z');if(zeB.textContent!==t)zeB.textContent=t;}
    const f=nd.querySelector('.fl');
    if(L.mslReady!=null){const r=Math.max(0,Math.min(1,L.mslReady)),t=r>=1?'1':'0';if(ndB.textContent!==t)ndB.textContent=t;nd.classList.toggle('out',r<1);f.style.width=(r>=1?0:r*100)+'%';}
    else if(L.msl!=null){if(ndB.textContent!==String(L.msl))ndB.textContent=L.msl;nd.classList.toggle('out',L.msl<=0);f.style.width='0';}}
  function drawTracker(dt){const c=mtC,S=300,R=140,RANGE=25,k=R/RANGE;c.clearRect(0,0,S,S);c.save();c.translate(S/2,S/2);
    // the disc: Reach's tinted glass, rings at 5 m steps, the cone of your view
    c.fillStyle='rgba(30,90,140,.28)';c.beginPath();c.arc(0,0,R,0,7);c.fill();
    c.strokeStyle='rgba(143,228,255,.5)';c.lineWidth=2;c.beginPath();c.arc(0,0,R,0,7);c.stroke();
    c.strokeStyle='rgba(143,228,255,.16)';c.lineWidth=1.5;for(const r of[.33,.66]){c.beginPath();c.arc(0,0,R*r,0,7);c.stroke();}
    c.beginPath();c.moveTo(0,-R);c.lineTo(0,R);c.moveTo(-R,0);c.lineTo(R,0);c.stroke();
    c.fillStyle='rgba(143,228,255,.07)';c.beginPath();c.moveTo(0,0);c.arc(0,0,R,-Math.PI/2-.55,-Math.PI/2+.55);c.closePath();c.fill();
    const yaw=P.yaw,cs=Math.cos(yaw),sn=Math.sin(yaw),px=P.pos.x,pz=P.pos.z;
    // world (dx, dz) → tracker: forward (-sin yaw, -cos yaw) is up
    const plot=(x,z,col,r)=>{const dx=x-px,dz=z-pz;const fx=-(dx*sn+dz*cs),rx=dx*cs-dz*sn;const d=Math.hypot(fx,rx);if(d>RANGE)return;
      c.fillStyle=col;c.shadowColor=col;c.shadowBlur=10;c.beginPath();c.arc(rx*k,-fx*k,r,0,7);c.fill();c.shadowBlur=0;};
    const seen=new Set();
    for(const A of (typeof ALLIES!=='undefined'?ALLIES:[])){if(!A.on||A.downT>0)continue;plot(A.pos.x,A.pos.z,'#ffd84a',8);}
    // TakeOver (js/mp/03-match.js): your side's bots are the yellow ones
    if(typeof BOTS!=='undefined'&&typeof TEAM_YOU!=='undefined')for(const B of BOTS){if(B.team!==TEAM_YOU||B.H.dead||B.respT>0)continue;plot(B.pos.x,B.pos.z,'#ffd84a',8);}
    for(const E of (typeof ENEMIES!=='undefined'?ENEMIES:[])){if(E.H.dead||E.warm||E.respT>0)continue;seen.add(E);
      const p=prev.get(E),v=p?Math.hypot(E.pos.x-p.x,E.pos.z-p.z)/dt:0;prev.set(E,{x:E.pos.x,z:E.pos.z});
      // Halo's rule: only what moves (faster than a creep) shows
      if(v>.8)plot(E.pos.x,E.pos.z,'#ff3b30',9);}
    for(const k2 of prev.keys())if(!seen.has(k2))prev.delete(k2);
    c.restore();}
  stripSights();setTimeout(stripSights,1500);setTimeout(stripSights,6000);
  requestAnimationFrame(frame);
  return{stripSights};
})();
window.EHUD=EHUD;
