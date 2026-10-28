/* Elyra · The Heralds' flight, shared (Oct 27, Bryce: "add the same damage, health, missiles, mobility and control" as The Heralds
   to the White City's way in and The Last Signal's valley; "the fighting is too hard, and different from The Heralds").
   Every number here is The Heralds' own (js/space/02-battle.js: stepPlayer, playerFire, playerMissile, updateHost), so the three
   air fights play the same. The Heralds is fought over tens of kilometres with 48 m interceptors; a level passes k, the scale of its
   world against Astraea's (k = .5: half the distances and half the speeds, so every turn, pass and burst takes the same time).
     craft     your craft's pool: The Heralds' 100 hull + 25 shield, recovering together 5 s after the latest hit (DMG.craftTick)
     steer     the stick: the nose goes where you aim, left stick / W-S throttle (cruise 190, forward 430, slow 40), A-D slide,
               Space/Q up/down (170), Shift or BOOST from a meter that drains 32/s and refills 16/s (boost 820)
     gun       one bolt per DMG.CRAFT_GUN_CD (.22 s), alternating barrels, DMG.AIR.turret (35) a hit. A fighter is hit inside
               1.25× its radius (The Heralds' rayHit), and a shot that would pass close to the lead mark goes to it (aim assist .05 rad)
     missile   unlimited, one every 1.5 s, locks the target nearest the crosshair (within 17°), DMG.AIR.rocket (80) a hit
     fighter   The Heralds' attack run: closes on its target at 460 (520 when it's you), fires every .35–.7 s while lined up inside
               1.7 km, then breaks off at 220 m on a 1.2–2 km pass for 2.5–4 s and comes round again. Half of them are on you at
               a time (The Heralds: half pick you, the rest pick your wingmen and the fleet); the others hold off until their next run.
               DMG.pool('fighter') (100 + 25), their guns DMG.npcAir('turret') with the threat level's chance to hit (DMG.rolls) */
const HFLY=(()=>{
  const H={cruise:190,fwd:430,slow:40,boost:820,slide:170,drain:32,fill:16,
    fSpd:460,fSpdMe:520,fTurn:2.2,fRange:1700,fCool:[.35,.7],fDot:.9,passAt:220,pass:[1200,2000],passSpread:600,passT:[2.5,4],aggro:.5,
    eBolt:2600,bolt:5200,gunRange:6500,msl:2400,mslCD:1.5,lockCos:Math.cos(MSL_CONE),lockRange:7000,assist:.05,assistRange:3200,mslPad:30};
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3();
  const rr=(a)=>a[0]+(a[1]-a[0])*(typeof rng==='function'?rng():Math.random());
  function craft(){const c=DMG.CLASS.playerCraft;return{hull:c.hp,maxHull:c.hp,shield:c.shield,maxShield:c.shield,lastHit:-99};}
  // a hit on your craft: the shield first, the rest into the hull. exact: spec damage; otherwise The Heralds' old units (bumps, flak)
  function hurt(c,n,t,exact){if(!exact)n*=(c.maxHull+c.maxShield)/200;c.lastHit=t;const s=Math.min(c.shield,n);c.shield-=s;c.hull-=n-s;return{shield:s>=n,dead:c.hull<=0};}
  // the stick, one frame. D: {yaw,pitch,vel,meter,boost}; inp: {f,s,up,boost}; o.cap: a top speed for this moment (a gate, a pad)
  function steer(D,dt,k,inp,o){o=o||{};
    const boosting=!!inp.boost&&D.meter>1;D.meter=clamp(D.meter+(boosting?-H.drain:H.fill)*dt,0,100);D.boost+=((boosting?1:0)-D.boost)*(1-Math.exp(-dt*4));
    const cp=Math.cos(D.pitch),fwd=new THREE.Vector3(-Math.sin(D.yaw)*cp,Math.sin(D.pitch),-Math.cos(D.yaw)*cp),rt=new THREE.Vector3(Math.cos(D.yaw),0,-Math.sin(D.yaw)),upv=new THREE.Vector3().crossVectors(rt,fwd);
    let spd=(boosting?H.boost:inp.f>0?H.fwd:inp.f<0?H.slow:H.cruise)*k;if(o.cap)spd=Math.min(spd,o.cap);
    _a.copy(fwd).multiplyScalar(spd).addScaledVector(rt,inp.s*H.slide*k).addScaledVector(upv,inp.up*H.slide*k);D.vel.lerp(_a,1-Math.exp(-dt*2.4));
    // bank: The Heralds' (.004 a metre per second of slide at Astraea's scale)
    const bank=clamp(-(D.vel.dot(rt))*.004/k+inp.s*-.3,-.8,.8);D.bank=(D.bank||0)+(bank-(D.bank||0))*(1-Math.exp(-dt*5));
    return{fwd,rt,upv,boosting};}
  // the lead mark: where a target will be when a bolt from `from` gets there
  function lead(t,from,k){const d=t.pos.distanceTo(from),tt=d/(H.bolt*k);return _b.copy(t.pos).addScaledVector(t.vel||_c.set(0,0,0),tt);}
  /* your guns: the first target on the line from the camera, inside 1.25× its radius; the aim assist first bends the line onto the
     lead mark of the target nearest the crosshair if it is within .05 rad. list: [{pos,vel,r,ref}]. Returns {ref,dist,dir} or null */
  function aim(o,dir,list,k){let d=dir.clone(),bestA=Math.cos(H.assist),pick=null;
    for(const t of list){const L=lead(t,o,k),v=_a.subVectors(L,o),dist=v.length();if(dist>H.assistRange*k)continue;v.normalize();const a=v.dot(dir);if(a>bestA){bestA=a;pick=v.clone();}}
    if(pick)d=pick;
    let best=null,bd=H.gunRange*k;
    for(const t of list){const oc=_a.subVectors(t.pos,o),tc=oc.dot(d);if(tc<0||tc>bd)continue;const R2=(t.r*1.25)*(t.r*1.25),d2=oc.lengthSq()-tc*tc;if(d2<R2){bd=tc-Math.sqrt(R2-d2);best=t;}}
    return{hit:best?best.ref:null,dist:best?bd:1800*k,dir:d};}
  // missiles: the target nearest the crosshair, within 17° and 7 km (× k). cur keeps the old lock a little longer
  function lock(o,dir,list,k,cur){let best=null,bs=H.lockCos;for(const t of list){const oc=_a.subVectors(t.pos,o),d=oc.length();if(d>H.lockRange*k)continue;const s=oc.dot(dir)/d+(t.ref===cur?MSL_KEEP:0);if(s>bs){bs=s;best=t.ref;}}return best;}
  function missileHit(t,k){return p=>p.distanceTo(t.pos)<t.r+H.mslPad*k;}
  /* one enemy fighter, one frame. f: {g,v,cool,t,pass,passT,me} (me: this run is on you). c: {k, tgt(f): its target's position this
     run, floor(x,z): the lowest it may fly (or null), reroll(f): pick the next run's target, shoot(f,dist): fire on the target now,
     passFix(p): keep a pass point inside the level (optional), passAt: break off this close instead of H.passAt (optional)} */
  function fighter(f,dt,c){const k=c.k;f.t=(f.t||0)+dt;
    if(f.pass&&f.t>f.passT){f.pass=null;if(c.reroll)c.reroll(f);}
    const tp=c.tgt(f);if(!tp)return;
    const goal=f.pass||tp,v1=_a.subVectors(goal,f.g.position),dist=v1.length();v1.normalize();
    const spd=(f.me?H.fSpdMe:H.fSpd)*k*(f.slow||1);
    if(f.v.lengthSq()<1e-6)f.v.copy(v1);f.v.normalize().lerp(v1,1-Math.exp(-dt*H.fTurn)).normalize();
    if(c.floor){const fy=c.floor(f.g.position.x,f.g.position.z);if(f.g.position.y<fy+40){f.v.y=Math.max(f.v.y,.35);f.v.normalize();}}
    f.v.multiplyScalar(spd);f.g.position.addScaledVector(f.v,dt);
    if(c.floor){const fy=c.floor(f.g.position.x,f.g.position.z)+14;if(f.g.position.y<fy)f.g.position.y=fy;}
    f.cool-=dt;
    if(!f.pass&&dist<H.fRange*k&&f.cool<=0&&v1.dot(_b.copy(f.v).normalize())>H.fDot){f.cool=rr(H.fCool);c.shoot(f,dist);}
    if(!f.pass&&dist<(c.passAt||H.passAt)*k){const p=f.g.position.clone().addScaledVector(_b.copy(f.v).normalize(),rr(H.pass)*k).add(_c.set(rr([-1,1]),rr([-1,1]),rr([-1,1])).multiplyScalar(H.passSpread*k));
      f.pass=c.passFix?c.passFix(p):p;f.passT=f.t+rr(H.passT);}
    _c.copy(f.g.position).add(f.v);f.g.lookAt(_c);f.g.rotateY(Math.PI);}
  // a fresh run: on you half the time (The Heralds' pickFighterTarget), always when you're the only thing close
  const onMe=()=>(typeof rng==='function'?rng():Math.random())<H.aggro;
  return{H,craft,hurt,steer,aim,lock,lead,missileHit,fighter,onMe};
})();
