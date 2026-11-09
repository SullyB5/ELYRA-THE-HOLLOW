/* Elyra shared · the campaign HUD (Nov 9 2026, Bryce: "make the HUD just like Halo Reach, but health on top and the Zeal bar on the
   bottom"; grenades top left like Halo 3, the gun top right like Reach; simple reticles, no add-on sights; vehicles and ships special).
   On foot, in every campaign level that runs js/origin/03-play.js. Load after js/shared/visor.js; needs js/shared/reticles.js.

     top middle   Reach's vitals, flipped: health as a row of segments on top, the shield as the long bar under it (both drain from the
                  ends toward the middle), Zeal as a thin gold line at the bottom. Shield gone: the bar's frame flashes red.
     top left     grenades, Halo 3's box: the count and the grenade. Red and dim when you have none.
     top right    the gun, Reach's way: the ammo you carry beside the gun's outline, a tick for every round in the magazine under it, and
                  the other gun smaller beneath with its ammo. "RELOAD" shows under the reticle when the magazine is low or empty.
     middle       one simple reticle per gun (js/shared/reticles.js). Aiming zooms the view (no sight on the gun) and the reticle stays.
     bottom left  the motion tracker (25 m): Keepers yellow, anything of theirs that moves red. PC only; on/off in the pause menu.
   In a vehicle the gun and grenades step aside and the reticle becomes the vehicle's (with its reload or heat on it); the vehicle's
   own hull strip (js/shared/shiphud.js) shows as before. Flying (The Last Signal's valley) shows the ship reticle.
   Reads the chapter's state itself every frame (P, GUNS, VEH, FLY...), so the chapters don't call it. Global `EHUD`. */
const EHUD=(()=>{
  const touch=typeof coarse!=='undefined'?coarse:matchMedia('(pointer:coarse)').matches;
  const css=`
body.eh-on #wpanel,body.eh-on #cross,body.eh-on .vz-ticks{display:none!important}
body.eh-on.eh-foot #shud{display:none!important}
body.eh-on .vz-glass .vzA,body.eh-on .vz-glass .vzB{display:none}
.eh{position:fixed;z-index:2;pointer-events:none;font-family:'VG Label','Arial Narrow',sans-serif;color:#dff6ff;
  filter:drop-shadow(0 1px 2px rgba(0,0,0,.65));transition:opacity .25s}
.eh.off{opacity:0}
/* ---- vitals ---- */
.eh-vit{left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);width:min(440px,52vw);display:flex;flex-direction:column;align-items:center;gap:4px}
.eh-hp{display:flex;gap:3px;width:52%}
.eh-hp i{flex:1;height:7px;background:rgba(143,228,255,.12);transform:skewX(-28deg);transition:background .15s}
.eh-hp i.on{background:linear-gradient(180deg,#f2fdff,#9fe6ff);box-shadow:0 0 5px rgba(140,225,255,.7)}
.eh-vit.low .eh-hp i.on{background:linear-gradient(180deg,#ffd6cc,#ff4a3a);box-shadow:0 0 6px rgba(255,70,50,.85);animation:ehPulse .45s infinite alternate}
.eh-vit.mid .eh-hp i.on{background:linear-gradient(180deg,#fff4cc,#ffc24a);box-shadow:0 0 5px rgba(255,190,70,.75)}
.eh-sh{position:relative;width:100%;height:16px;clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 100%,0 100%);background:rgba(6,18,34,.42);border-top:1px solid rgba(143,228,255,.5)}
.eh-sh::before{content:"";position:absolute;inset:2px 10px;border:1px solid rgba(143,228,255,.28);clip-path:polygon(6px 0,calc(100% - 6px) 0,100% 100%,0 100%)}
.eh-sh u{position:absolute;top:3px;bottom:3px;left:50%;width:calc(100% - 26px);transform:translateX(-50%);
  background:linear-gradient(180deg,#e6f9ff 0,#8fe4ff 35%,#3fa8e8 100%);box-shadow:0 0 10px rgba(110,210,255,.9) inset;transition:width .15s ease-out}
.eh-sh u::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 14px,rgba(4,14,28,.35) 14px 15px)}
.eh-vit.hit .eh-sh u{filter:brightness(1.7)}
.eh-vit.sout .eh-sh{background:rgba(70,8,8,.45);border-top-color:#ff4a3a;animation:ehFlash .35s infinite alternate}
.eh-vit.sout .eh-sh::before{border-color:rgba(255,80,60,.7)}
.eh-ze{position:relative;width:70%;height:3px;background:rgba(255,210,122,.14)}
.eh-ze u{position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#ffb84a,#ffe8a8,#ffb84a);box-shadow:0 0 6px rgba(255,200,90,.9);transition:width .2s linear}
.eh-ze b{position:absolute;left:50%;top:6px;transform:translateX(-50%);font:700 8px 'VG Display','Arial Narrow',sans-serif;letter-spacing:.26em;color:#ffd27a;white-space:nowrap;opacity:0;transition:opacity .2s}
.eh-vit.zready .eh-ze u{animation:ehPulse .45s infinite alternate}.eh-vit.zready .eh-ze b{opacity:1}
.eh-vit.zburn .eh-ze u{background:#fff3c8;box-shadow:0 0 10px #ffd27a}
.eh-vit.down{opacity:.4}
/* ---- grenades (Halo 3) ---- */
.eh-nd{left:calc(env(safe-area-inset-left,0px) + 62px);top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;align-items:center;gap:6px;height:40px;padding:0 10px 0 8px;
  border:1.5px solid rgba(143,228,255,.75);border-radius:7px;background:rgba(6,18,34,.32);box-shadow:0 0 8px rgba(110,210,255,.35) inset}
.eh-nd b{font:600 22px/1 'VG Label','Arial Narrow',sans-serif;color:#eafcff;font-variant-numeric:tabular-nums;min-width:12px;text-align:center}
.eh-nd svg{width:24px;height:28px}
.eh-nd svg *{fill:rgba(143,228,255,.22);stroke:#8fe4ff;stroke-width:1.4;stroke-linejoin:round}
.eh-nd svg .g{fill:#ffd27a;stroke:none;filter:drop-shadow(0 0 3px #ffb84a)}
.eh-nd.out{border-color:rgba(255,110,90,.55)}.eh-nd.out b{color:#ff8a7a}.eh-nd.out svg{opacity:.35}
.eh-nd.pop{animation:ehPop .3s}
/* ---- the gun (Reach) ---- */
.eh-wp{right:calc(env(safe-area-inset-right,0px) + 16px);top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.eh-wp .row{display:flex;align-items:center;gap:8px}
.eh-wp .res{font:500 17px/1 'VG Label','Arial Narrow',sans-serif;color:#cdefff;font-variant-numeric:tabular-nums;letter-spacing:.02em}
.eh-wp .ic{width:132px;height:40px}
.eh-wp .ic path{fill:rgba(143,228,255,.2);stroke:#8fe4ff;stroke-width:1.3;stroke-linejoin:round;filter:drop-shadow(0 0 3px rgba(110,210,255,.6))}
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
  .eh-vit{width:min(270px,44vw);top:calc(env(safe-area-inset-top,0px) + 8px);gap:3px}.eh-hp i{height:5px}.eh-sh{height:12px}
  .eh-nd{left:calc(env(safe-area-inset-left,0px) + 58px);top:calc(env(safe-area-inset-top,0px) + 10px);height:32px;padding:0 7px}.eh-nd b{font-size:17px}.eh-nd svg{width:18px;height:22px}
  .eh-wp{top:calc(env(safe-area-inset-top,0px) + 8px)}.eh-wp .ic{width:96px;height:30px}.eh-wp .res{font-size:14px}.eh-wp .tk i{width:2px;height:7px}.eh-wp .tk.big i{width:6px;height:9px}
  .eh-wp .sec .ic{width:58px;height:18px}.eh-mt{display:none}}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  /* ---------- gun outlines (viewBox 0 0 132 40, muzzle to the right as Halo draws them) ---------- */
  const ICON={
    ar:'M4 19L14 14H40L44 10H70L73 7H86L88 12H120L124 15V19H100V22H74L71 33H61L63 22H44L40 30H31L33 22H12Z',
    har:'M6 20Q24 7 60 9L84 6Q106 9 126 18Q104 23 82 23L74 33H64L67 24Q38 27 6 20Z',
    smg:'M22 17L30 13H70L74 9H88L90 13H112V17H96V21H76L74 34H64L65 21H48L46 28H38L39 21H24Z',
    hsmg:'M20 21Q38 9 70 12Q96 12 114 19Q94 24 76 23L70 33H60L63 24Q42 26 20 21Z',
    pistol:'M38 12H98V19H72L68 33H55L58 19H42Z',
    fang:'M36 20Q54 7 86 12Q100 15 104 19Q90 23 72 22L66 33H55L58 23Q46 24 36 20Z',
    sniper:'M2 20L14 15H48L52 9H74L76 15H128V18H86V22H62L58 31H49L51 22H30L22 27H12L14 22Z',
    rocket:'M6 10H108L118 13V27L108 30H6ZM44 30L48 37H58L56 30Z',
    heavy:'M10 20Q26 4 64 8Q100 8 124 16Q120 30 92 30L80 36H66L70 30Q30 34 10 20Z'};
  const NADE='<svg viewBox="0 0 24 28" aria-hidden="true"><path d="M8 3h8v4h-8z"/><path d="M12 7c5.5 0 9 4.2 9 9.5S17 26 12 26s-9-4.2-9-9.5S6.5 7 12 7z"/><circle class="g" cx="12" cy="16.5" r="3.6"/></svg>';
  const icon=k=>`<svg class="ic" viewBox="0 0 132 40" aria-hidden="true"><path d="${ICON[k]||ICON.ar}"/></svg>`;

  /* ---------- build ---------- */
  const mk=(cls,html)=>{const d=document.createElement('div');d.className='eh '+cls;d.innerHTML=html||'';document.body.appendChild(d);return d;};
  const vit=mk('eh-vit','<div class="eh-hp">'+'<i></i>'.repeat(10)+'</div><div class="eh-sh"><u></u></div><div class="eh-ze"><u></u><b></b></div>');
  const hpI=[...vit.querySelectorAll('.eh-hp i')],shU=vit.querySelector('.eh-sh u'),zeU=vit.querySelector('.eh-ze u'),zeB=vit.querySelector('.eh-ze b');
  const nd=mk('eh-nd','<b>3</b>'+NADE),ndB=nd.querySelector('b');
  const wp=mk('eh-wp',`<div class="gun"><div class="row"><span class="res"></span><span class="pi"></span></div><div class="tk"></div>
    <div class="row sec"><span class="res"></span><span class="si"></span></div></div><div class="vrow"><span class="vn"></span><span class="vs"></span></div>`);
  const W={res:wp.querySelector('.gun>.row .res'),pi:wp.querySelector('.pi'),tk:wp.querySelector('.tk'),sres:wp.querySelector('.sec .res'),si:wp.querySelector('.si'),vn:wp.querySelector('.vn'),vs:wp.querySelector('.vs')};
  const warn=mk('eh-warn');
  const zm=document.createElement('div');zm.className='eh-zm';zm.innerHTML='<b></b>';document.body.appendChild(zm);
  const ret=document.createElement('div');document.body.appendChild(ret);RETICLE.mount(ret,'ar');
  const mt=mk('eh-mt','<canvas width="300" height="300"></canvas><b>25m</b>'),mtC=mt.querySelector('canvas').getContext('2d');
  document.body.classList.add('eh-on');
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
    if(typeof P==='undefined'||typeof GUNS==='undefined')return;
    if(switchTries<200&&!addSwitch())switchTries++;
    const inCut=g(()=>CUTS.on,false)||g(()=>PROLOGUE.on,false),brief=!!document.querySelector('.pghq'),paused=g(()=>PG.paused,false)&&!document.querySelector('.pz:not([hidden])');
    const flying=g(()=>FLY.on,false),Vh=g(()=>inVeh()?VEH.cur:null,null),third=g(()=>window.ELYRA_VIEW.get()==='third',false);
    const show=!inCut&&!brief&&!paused,arm=P.alive&&P.input;
    const foot=!Vh&&!flying;
    document.body.classList.toggle('eh-foot',foot);
    vit.classList.toggle('off',!show||!foot);nd.classList.toggle('off',!show||!foot);wp.classList.toggle('off',!show||flying);
    // vitals: health on top, the shield under it, Zeal under that
    const hf=Math.max(0,Math.min(1,P.hp/P.maxHp)),sf=Math.max(0,Math.min(1,P.shield/P.maxShield));
    const lit=Math.ceil(hf*10-.001);{const a=5-Math.ceil(lit/2);hpI.forEach((el,i)=>el.classList.toggle('on',i>=a&&i<a+lit));}
    vit.classList.toggle('low',hf<.3);vit.classList.toggle('mid',hf>=.3&&hf<.6);
    shU.style.width=`calc((100% - 26px) * ${sf.toFixed(3)})`;
    if(sf<lastSh-.005)hitT=now;lastSh=sf;vit.classList.toggle('hit',now-hitT<200);vit.classList.toggle('sout',sf<.01&&P.alive);vit.classList.toggle('down',!P.alive);
    const ZT=g(()=>ZEAL_T,10),zb=P.zealT>0,zv=zb?P.zealT/ZT:Math.min(1,(P.zeal||0)/100),zr=!zb&&(P.zeal||0)>=100;
    zeU.style.width=(zv*100).toFixed(1)+'%';vit.classList.toggle('zready',zr);if(touch)vit.style.pointerEvents=zr&&show&&foot?'auto':'none';vit.classList.toggle('zburn',zb);
    if(zr){const t=touch?'ZEAL · TAP THE SHIELD':'ZEAL · '+g(()=>keyName('Digit4'),'4');if(zeB.textContent!==t)zeB.textContent=t;}
    // grenades
    if(P.nades!==nadeN){if(nadeN>=0&&P.nades>nadeN){nd.classList.remove('pop');void nd.offsetWidth;nd.classList.add('pop');}nadeN=P.nades;ndB.textContent=P.nades;nd.classList.toggle('out',P.nades<=0);}
    // the gun, or the vehicle's weapon
    wp.classList.toggle('veh',!!Vh);
    if(Vh){W.vn.textContent=(Vh.label||'').toUpperCase();W.vs.textContent=Vh.gunName||'';}
    else{const G=GUNS[P.gun],A=P.ammo[P.gun],j=P.gun?0:1,G2=GUNS[j],A2=P.ammo[j];
      const k1=RETICLE.ofGun(G),k2=G2?RETICLE.ofGun(G2):'';
      if(k1+G.id!==pKey){pKey=k1+G.id;W.pi.innerHTML=icon(k1);}if(k2+(G2&&G2.id)!==sKey){sKey=k2+(G2&&G2.id);W.si.innerHTML=G2?icon(k2):'';}
      W.res.textContent=G.inf?'∞':A.res;W.sres.textContent=G2?(G2.inf?'∞':A2.mag+A2.res):'';
      ticks(A.mag,G.mag,P.reloadT>0);wp.classList.toggle('rl',P.reloadT>0);
      const low=P.reloadT<=0&&A.mag<=Math.ceil(G.mag*.2);warn.textContent=A.mag<=0&&A.res<=0&&!G.inf?'NO AMMO':'RELOAD';
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
    mt.classList.toggle('hide',!trackerOn||!show||!foot);
    mtT-=dt;if(mtT<=0&&trackerOn&&show&&foot){mtT=.1;drawTracker(.1);}
  }
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
    for(const E of (typeof ENEMIES!=='undefined'?ENEMIES:[])){if(E.H.dead||E.warm)continue;seen.add(E);
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
