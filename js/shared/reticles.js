/* Elyra shared · reticles (Nov 9 2026, Bryce: "make all gun reticles simple, like Halo", "vehicle/ship special").
   No sight on the gun: the reticle is drawn on the visor and stays put when you zoom. One shape per kind of gun, after Halo 3 and
   Halo Reach, all in the visor's cyan with a dark edge so it reads on sand and in the dark, red over a target.

   Guns
     ar      Keeper assault rifle (Pulse rifle, Red Carbine): Halo 3's AR, a wide ring broken at the four points, a tick in each gap
     har     Hollow assault rifle: two curved brackets either side and a dot (the alien rifle)
     smg     Keeper SMG: a small ring with four short ticks outside it
     hsmg    Hollow SMG: three short arcs round a dot
     pistol  Keeper sidearm: Reach's DMR, a ring with a small broken cross inside it
     fang    Red Fang (Hollow pistol): Reach's plasma pistol, three chevrons pointing in
     sniper  hip-fire on the snipers: four short dashes and a dot (the scope takes over when you aim)
     rocket  Breaker: a big thin ring, short ticks inside it, a dot
     heavy   the alien heavies: a big triangle of chevrons
   Vehicles and ships (the moving parts update with RETICLE.set)
     hog     Warthog chaingun: a wide ring of four arcs, a small inner ring, heat as an arc under it
     rhog    rocket hog: Reach's diamond, ticks inside, and three pips under it that fill as the pod reloads
     lhog    laser hog: a ring with long side bars, the charge as an arc under it
     walker  mech: corner brackets, a dot, heat as an arc under it
     ship    interceptor / fighter (Reach's Sabre): a broken outer ring, a thin inner ring, a dot, the missile reload as an arc

   RETICLE.markup(kind) → svg string (viewBox -40 -40 80 80) · RETICLE.mount(el, kind) puts it in an element (and keeps the kind)
   RETICLE.set(el, {charge, heat, target, hit}) · RETICLE.css is added once. Global `RETICLE`. */
const RETICLE=(()=>{
  const st=document.createElement('style');st.textContent=`
.rtc{position:fixed;left:50%;top:50%;width:80px;height:80px;margin:-40px 0 0 -40px;pointer-events:none;z-index:2}
.rtc svg{width:100%;height:100%;overflow:visible}
.rtc .k{fill:none;stroke:rgba(0,8,16,.55);stroke-linecap:round;stroke-linejoin:round}
.rtc .c{fill:none;stroke:var(--rc,#8fe4ff);stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 2px rgba(110,210,255,.55))}
.rtc .f{fill:var(--rc,#8fe4ff);stroke:none}
.rtc .fk{fill:rgba(0,8,16,.55);stroke:none}
.rtc .m{fill:none;stroke:var(--rc,#8fe4ff);stroke-linecap:butt;opacity:.95;transition:stroke-dasharray .12s linear}
.rtc .mt{fill:none;stroke:rgba(143,228,255,.18);stroke-linecap:butt}
.rtc .pip{fill:rgba(143,228,255,.16);stroke:var(--rc,#8fe4ff);stroke-width:1}
.rtc .pip.on{fill:var(--rc,#8fe4ff)}
.rtc .pip.next{animation:rtcPip .5s infinite alternate}
.rtc.tgt{--rc:#ff4a3a}.rtc.tgt .c{filter:drop-shadow(0 0 2px rgba(255,70,50,.7))}
.rtc.hot .m{stroke:#ff8a5a}
.rtc .hm{opacity:0;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round}
.rtc.hit .hm{opacity:1}
@keyframes rtcPip{from{opacity:1}to{opacity:.35}}`;document.head.appendChild(st);

  const rad=d=>d*Math.PI/180,pt=(r,d)=>[+(Math.sin(rad(d))*r).toFixed(2),+(-Math.cos(rad(d))*r).toFixed(2)];
  // an arc from a0 to a1 degrees (0 = straight up, clockwise)
  const arc=(r,a0,a1)=>{const [x0,y0]=pt(r,a0),[x1,y1]=pt(r,a1);return `M${x0} ${y0}A${r} ${r} 0 ${a1-a0>180?1:0} 1 ${x1} ${y1}`;};
  const line=(r0,r1,d)=>{const [x0,y0]=pt(r0,d),[x1,y1]=pt(r1,d);return `M${x0} ${y0}L${x1} ${y1}`;};
  // a chevron at distance r on bearing d, its point toward the centre
  const chev=(r,d,w,h)=>{const [cx,cy]=pt(r,d),[tx,ty]=pt(r-h,d),a=rad(d+90),ox=Math.sin(a)*w,oy=-Math.cos(a)*w;
    return `M${(cx+ox).toFixed(2)} ${(cy+oy).toFixed(2)}L${tx} ${ty}L${(cx-ox).toFixed(2)} ${(cy-oy).toFixed(2)}`;};
  const quad=f=>[0,90,180,270].map(f).join('');
  const dot=r=>`<circle class="fk" r="${r+1}"/><circle class="f" r="${r}"/>`;
  // every stroke drawn twice: a dark one under, the colour over
  const S=(d,w)=>`<path class="k" d="${d}" stroke-width="${w+2.2}"/><path class="c" d="${d}" stroke-width="${w}"/>`;
  // a meter: an arc (or line) with pathLength 100, filled by stroke-dasharray
  const meter=(d,w)=>`<path class="mt" d="${d}" stroke-width="${w}"/><path class="m" d="${d}" pathLength="100" stroke-width="${w}" stroke-dasharray="0 200"/>`;
  // a hit marker: four short slashes, shown for a moment when a shot lands
  const hm=`<path class="hm" d="M-9 -9L-5 -5M9 -9L5 -5M-9 9L-5 5M9 9L5 5"/>`;

  const K={
    ar:()=>S(quad(d=>arc(17,d+12,d+78)),1.6)+S(quad(d=>line(13,19,d)),1.6)+dot(1.3),
    har:()=>S(arc(13,205,335)+arc(13,25,155),1.8)+S(line(16,20,0)+line(16,20,180),1.4)+dot(1.6),
    smg:()=>S(`M12 0A12 12 0 1 1 -12 0A12 12 0 1 1 12 0`,1.4)+S(quad(d=>line(14,19,d)),1.6)+dot(1.2),
    hsmg:()=>S([0,120,240].map(d=>arc(11,d-35,d+35)).join(''),1.8)+dot(1.6),
    pistol:()=>S(`M9 0A9 9 0 1 1 -9 0A9 9 0 1 1 9 0`,1.5)+S(quad(d=>line(3,6.5,d)),1.4)+dot(.9),
    fang:()=>S([0,120,240].map(d=>chev(13,d,5,5)).join(''),1.8)+dot(1.4),
    sniper:()=>S(quad(d=>line(5,10,d)),1.4)+dot(1.2),
    rocket:()=>S(`M24 0A24 24 0 1 1 -24 0A24 24 0 1 1 24 0`,1.2)+S(quad(d=>line(17,22,d)),1.6)+dot(1.8),
    heavy:()=>S([0,120,240].map(d=>chev(22,d,8,7)).join(''),2)+S(`M8 0A8 8 0 1 1 -8 0A8 8 0 1 1 8 0`,1.1)+dot(1.6),
    hog:()=>S(quad(d=>arc(27,d+18,d+72)),1.8)+S(`M7 0A7 7 0 1 1 -7 0A7 7 0 1 1 7 0`,1.3)+dot(1.3)+meter(arc(33,140,220),3),
    rhog:()=>S('M0 -24L24 0L0 24L-24 0Z',1.8)+S('M-11 -4h22M-8 3h16M-5 10h10',1.3)+dot(1.4)+
      [-9,0,9].map((x,i)=>`<circle class="pip" data-i="${i}" cx="${x}" cy="33" r="2.6"/>`).join(''),
    lhog:()=>S(`M10 0A10 10 0 1 1 -10 0A10 10 0 1 1 10 0`,1.4)+S('M-30 0h14M16 0h14',1.6)+dot(1.3)+meter(arc(18,130,230),3),
    walker:()=>S('M-22 -14v-8h8M14 -22h8v8M22 14v8h-8M-14 22h-8v-8',1.8)+S(quad(d=>line(4,9,d)),1.3)+dot(1.2)+meter(arc(30,140,220),3),
    ship:()=>S(arc(30,8,82)+arc(30,98,172)+arc(30,188,262)+arc(30,278,352),1.6)+S(arc(14,20,160)+arc(14,200,340),1.1)+
      S(quad(d=>line(33,38,d)),1.6)+dot(1.6)+meter(arc(36,200,250),3.2)};
  function markup(kind){return `<svg viewBox="-40 -40 80 80" aria-hidden="true">${(K[kind]||K.ar)()}${hm}</svg>`;}
  function mount(el,kind){if(typeof el==='string')el=document.getElementById(el);if(!el)return null;
    if(el._rk!==kind){el._rk=kind;el.innerHTML=markup(kind);el._m=el.querySelector('.m');el._p=[...el.querySelectorAll('.pip')];}
    el.classList.add('rtc');return el;}
  function set(el,o){if(!el)return;o=o||{};
    if('target' in o)el.classList.toggle('tgt',!!o.target);
    if('hit' in o)el.classList.toggle('hit',!!o.hit);
    const v=o.heat!=null?o.heat:o.charge;
    if(el._m&&v!=null){el._m.setAttribute('stroke-dasharray',(Math.max(0,Math.min(1,v))*100).toFixed(1)+' 200');el.classList.toggle('hot',o.heat!=null&&o.heat>.85);}
    if(el._p.length&&o.charge!=null){const n=el._p.length,c=Math.max(0,Math.min(1,o.charge)),lit=c>=1?n:Math.floor(c*n);
      el._p.forEach((p,i)=>{p.classList.toggle('on',i<lit);p.classList.toggle('next',i===lit&&c<1);});}}
  // which reticle a weapon (WEAPONS entry in js/origin/03-play.js) gets
  const BY_ID={rifle:'ar',herald:'ar',heraldr:'ar',host:'har',smg:'smg',hersmg:'smg',hersmgr:'smg',hsmg:'hsmg',side:'pistol',hfang:'fang',
    lance:'sniper',hlong:'sniper',breaker:'rocket',hheavy:'heavy',herheavy:'heavy'};
  function ofGun(W){if(!W)return'ar';if(BY_ID[W.id])return BY_ID[W.id];return W.rocket?'rocket':W.scope?'sniper':W.type==='SMG'?'smg':W.type==='Pistol'?'pistol':'ar';}
  /* flight pages (The Heralds, Tide City): RETICLE.flight(id, kindFn) turns the page's plain ring into the ship's reticle (or the
     walker's on Tide City's streets) and fills its missile arc from what the page already gives the cockpit strip (SHUD.update mslReady).
     A hit (the page's 'hit' class on the element) shows the hit marker. */
  function flight(id,kindFn){const el=document.getElementById(id);if(!el)return;el.classList.remove('cross','reticle');el.style.border='none';el.style.background='none';
    let charge=1;const tick=()=>{requestAnimationFrame(tick);const k=(kindFn&&kindFn())||'ship';mount(el,k);set(el,{charge,hit:el.classList.contains('hit')});};tick();
    if(typeof SHUD!=='undefined'){const up=SHUD.update;SHUD.update=function(o){if(o&&o.mslReady!=null)charge=o.mslReady;return up.apply(this,arguments);};}}
  return{markup,mount,set,ofGun,flight};
})();
window.RETICLE=RETICLE;
