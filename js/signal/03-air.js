/* Elyra · The Last Signal — the valley, by air (Oct 26). Michael's interceptor follows the signal up Elyra's southern valley (VAL in
   js/signal/01-world.js): two Empty Host fighter engagements in the valley's two basins, then the concealed transfer pad on the summit
   at its head. Built on Pathfinder Arc 03's flight (js/pathfinder3/02-air.js): the same stick (the mouse or your right thumb points
   her, the left thumb turns her too, hold fire for the guns, Shift to boost), with The Heralds' damage scale for the craft and the
   fighters (js/shared/damage.js: playerCraft 100 + 25 that recovers together after a quiet spell, the fighters 100 + 25, the guns 35 a
   hit at DMG.CRAFT_GUN_CD, the fighters' guns DMG.npcAir('turret') with the threat level's hit chance).
     run1   → follow the signal up the valley (ELYRA: the voice is Rhen's, and the recording is older than the carrier)
     fight1 → the first basin: two Host fighters off the ridge
     run2   → on up the valley
     fight2 → the second basin: three more, one of them from behind
     pad    → the transfer pad's lights: fly to it
   Controls (Oct 26, Bryce: "use the controls we have from The Heralds"): js/space/02-battle.js's flight, scaled to the valley. The mouse
   or your right thumb points her nose straight where you aim (no lag); the left stick / W-S is throttle and A-D slides; Space/Q up and
   down; arrows turn; Shift or BOOST boosts from a meter that drains and refills; the camera sits behind level, not rolled with her.
   Missiles as in The Heralds: MSL (phone) or left-click / F (PC; guns move to right-click) fires a homing missile, unlimited, one
   every 1.5 s, locked on the fighter nearest the crosshair (gold marker), DMG.AIR.rocket (80) a hit.
   FLY.start(ship,{done,crash}) · FLY.update(dt) every frame while FLY.on. */
BK.ibolt={len:30,w:1.1,head:12,col:0x9ff4ff,bc:0x6fe0ff};boltMats.ibolt=new THREE.MeshBasicMaterial({color:C(BK.ibolt.bc).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});

/* Michael's interceptor: the Raven-pattern ship (js/shared/ships.js, his paint), about 14 m, nose toward -z */
function makeInterceptor(){const ITC=interceptorGeo(PG.paint()),g=new THREE.Group();
  const a=new THREE.Mesh(ITC.geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.5})),b=new THREE.Mesh(ITC.glow,new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)}));
  a.castShadow=true;g.add(a,b);ITC.geo.computeBoundingBox();const L=ITC.geo.boundingBox.max.z-ITC.geo.boundingBox.min.z;g.scale.setScalar(14/L);scene.add(g);
  MODELS.swapShip(g,'interceptor',{ref:ITC.geo});
  const eng=[];for(const s of[-1,1]){const e=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x7fe6ff).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.9}));e.scale.setScalar(3.4/(14/L));e.position.set(s*1.55,-.15,11.2);g.add(e);eng.push(e);}
  g.userData.eng=eng;g.userData.k=14/L;return g;}
/* a Host fighter: the Wraith hull in the Host's purple */
function makeHostFighter(){const K=SHIPKIT.wraith(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat()),new THREE.Mesh(K.glow,fleetGlowMat(FLEET_PURPLE,2)));
  g.scale.setScalar(.6);scene.add(g);MODELS.swapShip(g,'wraith',{ref:K.geo});
  const e=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(FLEET_PURPLE).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.9}));
  K.geo.computeBoundingBox();e.position.set(0,0,K.geo.boundingBox.max.z*.95);e.scale.setScalar(9);g.add(e);return g;}

const FLY=(()=>{
  const css=document.createElement('style');css.textContent='body.dog #wpanel,body.dog #gear,body.dog #nade,body.dog #rld,body.dog #wpn,body.dog #shld,body.dog #jump,body.dog #crch,body.dog #use,body.dog #ads,body.dog .shud{display:none!important}'+
    '.dogbar{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 14px);transform:translateX(-50%);width:min(320px,70vw);z-index:3;pointer-events:none;font:700 10px "Chakra Petch",sans-serif;letter-spacing:.18em;color:#bff0ff;text-align:center;text-shadow:0 1px 4px #000}'+
    '.dogbar i{display:block;height:6px;margin-top:4px;border:1px solid rgba(127,227,255,.5);border-radius:2px;overflow:hidden}.dogbar u{display:block;height:100%;background:linear-gradient(90deg,#7fe3ff,#e9fbff);transition:width .2s}'+
    '.dogbar i.hull{border-color:rgba(255,210,122,.5)}.dogbar i.hull u{background:linear-gradient(90deg,#ffb347,#ffe6a0)}.dogbar.low{color:#ff8a7a}.dogbar.low i.hull u{background:#ff6a5a}'+
    '.dogtag{position:fixed;z-index:3;pointer-events:none;transform:translate(-50%,-140%);font:700 10px "Chakra Petch",sans-serif;letter-spacing:.16em;color:#ffd27a;text-shadow:0 1px 4px #000;white-space:nowrap}'+
    '.dogtag.sig{color:#ff9a8a}.dogtag.sig::after{content:"";display:block;margin:4px auto 0;width:14px;height:14px;border:2px solid #ff9a8a;border-radius:50%;animation:sigP 1.2s infinite}@keyframes sigP{50%{transform:scale(1.5);opacity:.4}}'+
    '.dogtag.pad{color:#eaf2ff}.dogtag.pad::after{content:"";display:block;margin:4px auto 0;width:16px;height:16px;border:2px solid #eaf2ff;transform:rotate(45deg)}'+
    '.btn.dogboost{right:calc(var(--sr) + 104px);bottom:calc(var(--sb) + 26px);width:58px;height:58px;border-color:var(--accent);color:#bff0ff}.btn.dogboost.on{background:rgba(127,227,255,.4)}'+
    '.btn.dogmsl{right:calc(var(--sr) + 108px);bottom:calc(var(--sb) + 98px);width:52px;height:52px;border-color:rgba(255,210,122,.85);background:rgba(90,60,10,.5);color:#ffd27a}'+
    '.dogmk.lock{border-color:#ffd27a;box-shadow:0 0 12px #ffd27a;width:16px;height:16px;margin:-8px 0 0 -8px}'+
    '.dogmk{position:fixed;z-index:3;pointer-events:none;width:10px;height:10px;margin:-5px 0 0 -5px;border:2px solid #c98aff;transform:rotate(45deg);box-shadow:0 0 8px #c98aff}';
  document.head.appendChild(css);
  let A=null;
  const _v=new THREE.Vector3(),_w=new THREE.Vector3(),_e=new THREE.Euler(0,0,0,'YXZ');
  const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  const U_FIGHT=[polyD(VAL,BASINS[0].x,BASINS[0].z).u,polyD(VAL,BASINS[1].x,BASINS[1].z).u];
  // the floor a craft must stay above: the land, and the facility's mass (on the shelf)
  function floorY(x,z){let y=landY(x,z);if(z<520&&Math.abs(x)<300&&footD(x,z)<12)y=Math.max(y,60);if(Math.hypot(x-LZ.x,z-LZ.z)<LZ.r+20)y=Math.max(y,4);return y;}
  function start(ship,o){
    o=o||{};const u0=VAL_FLY_U,p=valPt(u0),q=valPt(u0+200);let yaw=Math.atan2(-(q.x-p.x),-(q.z-p.z));
    if(o.keep){yaw=ship.rotation.y;}else ship.position.set(p.x,RIVER_Y+34,p.z);   // keep: carry on from the opening shot's last frame, no jump
    ship.visible=true;ship.rotation.set(0,yaw,0);
    P.input=true;P.alive=true;P.yaw=yaw;P.pitch=.02;fireHeld=false;document.body.classList.add('dog');
    const bar=document.createElement('div');bar.className='dogbar';bar.innerHTML='SHIELDS<i><u style="width:100%"></u></i><span style="display:block;margin-top:5px">HULL</span><i class="hull"><u style="width:100%"></u></i>';document.body.appendChild(bar);
    const tags=[0,1].map(()=>{const d=document.createElement('div');d.className='dogtag';d.style.display='none';document.body.appendChild(d);return d;});
    const mks=[];for(let i=0;i<4;i++){const d=document.createElement('div');d.className='dogmk';d.style.display='none';document.body.appendChild(d);mks.push(d);}
    let bbtn=null;if(coarse){bbtn=document.createElement('button');bbtn.type='button';bbtn.className='btn dogboost';bbtn.textContent='BOOST';document.body.appendChild(bbtn);
      const on=e=>{e.preventDefault();try{bbtn.setPointerCapture(e.pointerId);}catch(_){}if(A)A.boostHeld=true;bbtn.classList.add('on');},off=()=>{if(A)A.boostHeld=false;bbtn.classList.remove('on');};
      bbtn.addEventListener('pointerdown',on);bbtn.addEventListener('pointerup',off);bbtn.addEventListener('pointercancel',off);bbtn.addEventListener('lostpointercapture',off);bbtn.addEventListener('contextmenu',e=>e.preventDefault());}
    let mbtn=null;if(coarse){mbtn=document.createElement('button');mbtn.type='button';mbtn.className='btn dogmsl';mbtn.textContent='MSL';document.body.appendChild(mbtn);
      mbtn.addEventListener('pointerdown',e=>{e.preventDefault();missile();});mbtn.addEventListener('contextmenu',e=>e.preventDefault());}
    const N=200,sp=new Float32Array(N*3);for(let i=0;i<N;i++)sp.set([R(-90,90),R(-60,60),R(-160,160)],i*3);
    const streaks=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({size:.28,color:C(0xcfe6ff),transparent:true,opacity:.4,depthWrite:false}));streaks.geometry.setAttribute('position',new THREE.BufferAttribute(sp,3));streaks.frustumCulled=false;scene.add(streaks);
    A={ship,o,bar,tags,mks,streaks,sp,t:0,stage:'run1',stT:0,c:{hull:DMG.CLASS.playerCraft.hp,maxHull:DMG.CLASS.playerCraft.hp,shield:DMG.CLASS.playerCraft.shield,maxShield:DMG.CLASS.playerCraft.shield,lastHit:-99},
      cool:0,gunL:true,yaw,pitch:.02,roll:0,shake:0,kills:0,said:new Set(),F:[],dead:false,outT:0,u:u0,boost:0,bbtn,mbtn,mslCool:0,barrel:0,lock:null,boostHeld:false,meter:100,vel:new THREE.Vector3(0,0,-96).applyAxisAngle(V3(0,1,0),yaw),cam:null,bank:0};
    banner(coarse?'You have the stick · right thumb aims · left stick throttle · hold FIRE · MSL · BOOST':'You have the stick · mouse aims (click to lock) · W/S throttle · A/D slide · Space/Q up/down · Shift boost · right-click guns · left-click or F missiles','alert');
  }
  function addFighter(pos,vel){const g=makeHostFighter();g.position.copy(pos);const f={g,v:vel||V3(0,0,1).multiplyScalar(120),...DMG.pool('fighter'),dead:0,ret:0,cool:R(1.2,2.4),off:V3(),gone:false,fb:0};A.F.push(f);return f;}
  const live=()=>A.F.filter(f=>!f.dead&&!f.gone);
  function radio(key,who,txt,tone,dur){if(A.said.has(key))return;A.said.add(key);PG.say(who,txt,tone,dur);}
  function hurtShip(n,exact){if(!A||A.dead)return;if(!exact)n*=(OD.dmg||1);A.c.lastHit=T;A.shake=Math.max(A.shake,.35);
    const s=Math.min(A.c.shield,n);A.c.shield-=s;A.c.hull-=n-s;if(typeof sfx!=='undefined')sfx.hit(s>=n);if(A.c.hull<=0)crash();}
  function crash(){if(A.dead)return;A.dead=true;const p=A.ship.position.clone();boom(p,26,0xfff0d0,.8);boom(p,36,0x7fd0ff,1.2);flashScreen(.6);if(typeof sfx!=='undefined')sfx.crash(camera.position);
    PG.say('ELYRA','Lieutenant! Hull failure, eject, eject!','alert');const o=A.o;setTimeout(()=>{stop();if(o.crash)o.crash();},1800);}
  function stop(){if(!A)return;A.bar.remove();A.tags.forEach(t=>t.remove());A.mks.forEach(t=>t.remove());if(A.bbtn)A.bbtn.remove();if(A.mbtn)A.mbtn.remove();for(const m of PMS){m.on=false;m.mesh.visible=false;}scene.remove(A.streaks);document.body.classList.remove('dog');
    for(const f of A.F)scene.remove(f.g);camera.fov=62;camera.updateProjectionMatrix();fireHeld=false;A=null;}
  function update(dt){if(!A)return;const D=A,sh=D.ship;D.t+=dt;D.stT+=dt;
    if(!D.dead){
      // The Heralds' flight: the nose goes exactly where you aim (P.yaw/P.pitch, set by the mouse or right thumb); the left stick is throttle and slide
      let f=0,s=0,up=0;if(P.input){if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD)s+=1;if(keys.KeyA)s-=1;if(keys.Space||keys.KeyE)up+=1;if(keys.KeyQ||keys.KeyC)up-=1;
        if(keys.ArrowLeft)P.yaw+=1.6*dt;if(keys.ArrowRight)P.yaw-=1.6*dt;f+=joy.y;s+=joy.x;}
      f=clamp(f,-1,1);s=clamp(s,-1,1);P.pitch=clamp(P.pitch,-.9,.7);D.yaw=P.yaw;D.pitch=P.pitch;
      const boosting=P.input&&(keys.ShiftLeft||keys.ShiftRight||D.boostHeld)&&D.meter>1;D.meter=clamp(D.meter+(boosting?-32:16)*dt,0,100);D.boost+=((boosting?1:0)-D.boost)*(1-Math.exp(-dt*4));
      const cp=Math.cos(D.pitch),fwd=V3(-Math.sin(D.yaw)*cp,Math.sin(D.pitch),-Math.cos(D.yaw)*cp),rt=V3(Math.cos(D.yaw),0,-Math.sin(D.yaw)),upv=new THREE.Vector3().crossVectors(rt,fwd);
      const cruise=D.stage==='pad'?78:96,spd=boosting?190:f>0?lerp(cruise,150,f):lerp(cruise,40,-f);
      const tgt=fwd.clone().multiplyScalar(spd).addScaledVector(rt,s*55).addScaledVector(upv,up*55);D.vel.lerp(tgt,1-Math.exp(-dt*2.4));sh.position.addScaledVector(D.vel,dt);
      D.bank+=(clamp(-D.vel.dot(rt)*.012+s*-.3,-.8,.8)-D.bank)*(1-Math.exp(-dt*5));D.roll=D.bank;
      _e.set(D.pitch,D.yaw,D.bank);sh.quaternion.setFromEuler(_e);
      if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.interceptor','you',null,1,.95+D.boost*.15);
      // the ground and the cliffs: pushed back up, and it hurts
      const fy=floorY(sh.position.x,sh.position.z)+7;if(sh.position.y<fy){sh.position.y=fy;D.vel.y=Math.max(D.vel.y,0);P.pitch=Math.max(P.pitch,.18);
        if(T-(D.bumpT||-9)>.6){D.bumpT=T;hurtShip(14,true);boom(sh.position.clone().addScaledVector(fwd,6),5,0xfff0d0,.3);radio('bump'+Math.floor(D.t/20),'ELYRA','Terrain! Pull up, Lieutenant!','alert');}}
      // too far from the valley, or too high (their sensors are looking up there): ELYRA turns you back
      const v=polyD(VAL,sh.position.x,sh.position.z);D.u=Math.max(D.u,v.u);
      if(v.d>valHalf(sh.position.x,sh.position.z)+300||sh.position.y>300){D.outT+=dt;if(D.outT>.3){const c=valPt(Math.min(VAL_LEN,v.u+120)),want=Math.atan2(-(c.x-sh.position.x),-(c.z-sh.position.z));P.yaw=angLerp(P.yaw,want,1-Math.exp(-dt*1.6));if(sh.position.y>300)P.pitch=Math.min(P.pitch,-.2);
        radio('out'+Math.floor(D.t/12),'ELYRA','Lieutenant, you’re climbing out of the valley. Their sensors on that peak are looking for anything up high. Stay low, stay in it.','alert');}}else D.outT=0;
      // the camera: The Heralds' chase cam, behind and above, easing after her, level (only a quarter of her bank)
      const camT=sh.position.clone().addScaledVector(fwd,-24-D.boost*4).addScaledVector(upv,6.5);if(!D.cam)D.cam=camT.clone();D.cam.lerp(camT,1-Math.exp(-dt*10));
      {const cy=floorY(D.cam.x,D.cam.z)+3;if(D.cam.y<cy)D.cam.y=cy;}camera.position.copy(D.cam);
      camera.quaternion.setFromEuler(new THREE.Euler(D.pitch-.06,D.yaw,D.bank*.25,'YXZ'));camera.fov=68+D.boost*8;camera.updateProjectionMatrix();
      if(D.shake>0){D.shake-=dt;camera.position.x+=R(-1,1)*D.shake*.6;camera.position.y+=R(-1,1)*D.shake*.6;}
      DMG.craftTick(D.c,dt,T);
      // your guns: the two nose guns, alternating, down the line you're looking
      D.cool-=dt;if((coarse?fireHeld:P.adsHeld)&&P.input&&D.cool<=0){D.cool=DMG.CRAFT_GUN_CD*.5;D.gunL=!D.gunL;const dir=camera.getWorldDirection(_w).clone();
        let best=null,bt=1100;for(const f of D.F){if(f.dead||f.gone)continue;const oc=f.g.position.clone().sub(camera.position),t=oc.dot(dir);if(t<0||t>bt)continue;if(oc.lengthSq()-t*t<12*12){bt=t;best=f;}}
        const to=camera.position.clone().addScaledVector(dir,best?bt:900),from=sh.position.clone().add(V3(D.gunL?-1.4:1.4,-.2,-8).applyQuaternion(sh.quaternion));
        if(typeof sfx!=='undefined'&&sfx.next)sfx.next('gun.pilot');
        fire(from,to,1400,'ibolt',q=>{if(!best)return;boom(q,4,0x9ff4ff,.2);$('cross').classList.add('hit');clearTimeout(update.t);update.t=setTimeout(()=>$('cross').classList.remove('hit'),90);hitFighter(best,DMG.AIR.turret*.5);});}   // (two guns at half the cadence each: 35 a hit, as in The Heralds)
    }else{camera.position.y+=dt*2;}
    // the fighters: they come round onto your tail and fire when they're lined up
    for(const f of D.F){if(f.gone)continue;if(f.dead){f.dead-=dt;f.g.position.y-=dt*34;f.g.rotation.z+=dt*4;if(rng()<.4)puff(f.g.position.clone(),R(3,6),2.5);if(f.dead<=0||f.g.position.y<landY(f.g.position.x,f.g.position.z)){if(!f.hitG){f.hitG=1;boom(f.g.position.clone(),18,0xff9a5a,1);}f.gone=true;f.g.visible=false;}continue;}
      f.ret-=dt;if(f.ret<=0){f.ret=R(2.5,5);f.off.set(R(-60,60),R(-20,30),R(50,130));}
      const tp=sh.position,want=tp.clone().add(f.off.clone().applyQuaternion(sh.quaternion).multiplyScalar(f.ret>2?1:.2)).sub(f.g.position);
      const fy=floorY(f.g.position.x,f.g.position.z);if(f.g.position.y<fy+40)want.y+=80;
      f.v.lerp(want.normalize().multiplyScalar(118),1-Math.exp(-dt*1.3));f.g.position.addScaledVector(f.v,dt);if(f.g.position.y<fy+14)f.g.position.y=fy+14;
      _w.copy(f.g.position).add(f.v);f.g.lookAt(_w);f.g.rotateY(Math.PI);
      f.cool-=dt;const to=tp.clone().sub(f.g.position),d=to.length();
      f.fb-=dt;if(!D.dead&&f.fb<=0&&typeof sfx!=='undefined'&&sfx.flyby&&d<70){f.fb=6;sfx.flyby(1.6,.14,f.g.position);}
      if(!D.dead&&f.cool<=0&&d<340&&to.normalize().dot(f.v.clone().normalize())>.82){f.cool=R(1.1,2.2)/(OD.rof||1);const hit=DMG.rolls();
        fire(f.g.position.clone(),sh.position.clone().add(V3(R(-3,3),R(-2,2),R(-3,3)).multiplyScalar(hit?1:4)),420,'hbolt',q=>{boom(q,R(4,7),FLEET_PURPLE,.3);if(hit&&A)hurtShip(DMG.npcAir('turret'),true);});}}
    {const a=D.sp;for(let i=0;i<a.length;i+=3){a[i+2]+=dt*90;if(a[i+2]>160){a[i]=R(-90,90);a[i+1]=R(-60,60);a[i+2]=-160;}}D.streaks.position.copy(sh.position);D.streaks.quaternion.copy(sh.quaternion);D.streaks.geometry.attributes.position.needsUpdate=true;}
    const eng=sh.userData.eng;if(eng)eng.forEach((e,i)=>{e.material.opacity=.6+.25*Math.sin(T*30+i)+D.boost*.2;});
    D.mslCool=Math.max(0,D.mslCool-dt);D.lock=D.dead?null:pickLock();
    if(D.mbtn){D.mbtn.style.setProperty('--cd',(D.mslCool/1.5*100)+'%');D.mbtn.disabled=D.mslCool>0;}
    updateMissilesP(dt,null);for(const m of PMS)if(m.on&&m.pos.y<floorY(m.pos.x,m.pos.z))m.t=99;   // into the valley walls: they burst
    stages(dt);if(A)hud();}
  // missiles: lock the fighter nearest the crosshair (within ~17° and 1.2 km) and home in
  function pickLock(){const D=A,dir=camera.getWorldDirection(_w).clone();let best=null,bs=Math.cos(.3);
    for(const f of D.F){if(f.dead||f.gone)continue;const oc=f.g.position.clone().sub(camera.position),d=oc.length();if(d>1200)continue;const s=oc.dot(dir)/d+(f===D.lock?.02:0);if(s>bs){bs=s;best=f;}}return best;}
  function missile(){const D=A;if(!D||D.dead||!P.input||D.mslCool>0||PG.paused)return;D.mslCool=1.5;const sh=D.ship,f=D.lock,k=sh.userData.k||1;
    const from=sh.localToWorld(V3(((D.barrel^=1)?1:-1)*3/k,-1.4/k,0)),aim=camera.getWorldDirection(_w).clone();
    const dir=f?f.g.position.clone().sub(from).normalize().lerp(aim,.5).normalize():aim;
    fireMissile(from,dir,520,f?{pos:()=>f.dead||f.gone?null:f.g.position,hit:p=>p.distanceTo(f.g.position)<14}:null,()=>{if(f&&!f.dead)hitFighter(f,DMG.AIR.rocket);});}
  function hitFighter(f,n){if(f.dead)return;DMG.hit(f,n,T);if(f.hp>0)return;f.dead=3;const p=f.g.position.clone();boom(p,22,0xfff0d0,.6);boom(p,32,FLEET_PURPLE,1.1);if(typeof sfx!=='undefined')sfx.explosion(p,600);
    A.kills++;P.kills++;PG.kill(250,p,'gun');PG.prog('lsair');const left=live().length;
    if(left)PG.say('ELYRA',left===1?'One left.':left+' left.');}
  // fighters come in from ahead of you, off the ridge (and one from behind, the second time)
  function wave(n,behind){const sh=A.ship,u=A.u;for(let k=0;k<n;k++){const back=behind&&k===n-1,p=valPt(clamp(u+(back?-600:700+k*80),0,VAL_LEN));
    const w=valHalf(p.x,p.z);p.x+=R(-w,w)*.5;p.z+=R(-w,w)*.5;p.y=floorY(p.x,p.z)+R(120,200);addFighter(p,sh.position.clone().sub(p).normalize().multiplyScalar(118));}}
  function stages(dt){const D=A,sh=D.ship;
    const dLZ=Math.hypot(sh.position.x-LZ.x,sh.position.z-LZ.z);
    if(D.stage==='run1'){PG.objective('Follow the signal up the valley');
      if(D.t>2)radio('r1','ELYRA','Signal holding, Lieutenant. It’s coming from the head of this valley. Thirty kilometres south of the mountain.');
      if(D.t>10)radio('r2','Lt. Michael','Is it them?');
      if(D.t>13)radio('r3','ELYRA','Voice match: Captain A. Rhen. But the recording is older than the carrier it rides on. Someone is broadcasting it again, now.',null,7);
      if(D.t>21)radio('r4','Lt. Michael','Or he is.');
      if(D.u>U_FIGHT[0]-260){D.stage='fight1';D.stT=0;wave(2,false);banner('Host fighters','alert');PG.say('ELYRA','Two contacts! Host fighters, coming off the ridge!','alert');}}
    else if(D.stage==='fight1'){const n=live().length;PG.objective('Host fighters down · '+(2-n)+' / 2');
      if(D.stT>5)radio('f1','Lt. Michael','So much for quiet.');
      if(!n&&D.stT>1.5){D.stage='run2';D.stT=0;PG.say('ELYRA','Clear. They didn’t call it in, as far as I can hear. Keep going.');}}
    else if(D.stage==='run2'){PG.objective('Follow the signal up the valley');
      if(D.stT>6)radio('r5','ELYRA','The signal is strengthening. Lieutenant, there are words under the static now.',null,6);
      if(D.stT>11)radio('r6','Captain Rhen (signal)','…Tide City… this is Pathfinder… if anyone hears this… don’t…','enemy',6);
      if(D.stT>18)radio('r7','ELYRA','The same eleven seconds, over and over. And something else on the carrier I can’t read.',null,6);
      if(D.u>U_FIGHT[1]-260){D.stage='fight2';D.stT=0;wave(3,true);banner('Host fighters','alert');PG.say('ELYRA','Three more! One of them is behind you!','alert');}}
    else if(D.stage==='fight2'){const n=live().length;PG.objective('Host fighters down · '+(3-n)+' / 3');
      if(!n&&D.stT>1.5){D.stage='pad';D.stT=0;PG.say('ELYRA','That’s the last of them. Lieutenant… the peak ahead. Something built right over the top of it. A landing pad on its shoulder, lights off.',null,7);
        setTimeout(()=>{if(A)PG.say('Lt. Michael','A transfer station. On top of the mountain.');},5200);banner('The transfer pad');}}
    else if(D.stage==='pad'){PG.objective('Land on the transfer pad · '+Math.round(dLZ)+' m');
      if(dLZ<320){const o=D.o;stop();if(o.done)o.done();}}}
  function hud(){const D=A;if(!D)return;const b=D.bar;b.children[0].firstChild.style.width=(D.c.shield/D.c.maxShield*100)+'%';b.querySelector('i.hull u').style.width=Math.max(0,D.c.hull/D.c.maxHull*100)+'%';b.classList.toggle('low',D.c.hull<D.c.maxHull*.35);
    const items=[];if(D.stage==='pad')items.push({p:V3(LZ.x,12,LZ.z),t:'TRANSFER PAD · '+Math.round(Math.hypot(D.ship.position.x-LZ.x,D.ship.position.z-LZ.z))+' M',c:'pad'});
    else if(D.stage==='run1'||D.stage==='run2'){const p=valPt(Math.min(VAL_LEN,D.u+700));p.y=floorY(p.x,p.z)+60;items.push({p,t:'SIGNAL · '+(Math.max(0,VAL_LEN-D.u)/1000).toFixed(1)+' KM',c:'sig'});}
    D.tags.forEach((el,i)=>{const it=items[i];if(!it){el.style.display='none';return;}_w.copy(it.p).project(camera);const on=_w.z<1;
      const x=clamp((_w.x*.5+.5)*innerWidth,30,innerWidth-30),y=clamp((-_w.y*.5+.5)*innerHeight,60,innerHeight-60);
      el.style.display='';el.className='dogtag '+it.c;el.textContent=it.t;el.style.left=(on?x:innerWidth-x)+'px';el.style.top=(on?y:innerHeight-60)+'px';el.style.opacity=on?1:.5;});
    const hf=live();D.mks.forEach((el,i)=>{const f=hf[i];if(!f){el.style.display='none';return;}_w.copy(f.g.position).project(camera);if(_w.z>1){el.style.display='none';return;}
      el.style.display='';el.classList.toggle('lock',f===D.lock);el.style.left=((_w.x*.5+.5)*innerWidth)+'px';el.style.top=((-_w.y*.5+.5)*innerHeight)+'px';});}
  return{start,update,stop,missile:()=>{if(A)missile();},get on(){return!!A;},get state(){return A;}};
})();
// PC missiles while flying: left-click (mouse locked) or F
renderer.domElement.addEventListener('mousedown',e=>{if(FLY.on&&e.button===0&&document.pointerLockElement)FLY.missile();});
addEventListener('keydown',e=>{if(FLY.on&&e.code==='KeyF'&&!e.repeat)FLY.missile();});
// while you fly, the on-foot keys do nothing
for(const k of['dropWall','launchSentry','throwNade','jump','useZeal','toggleCrouch','startReload','useAction','switchGun'])((name)=>{const f=window[name];if(typeof f!=='function')return;window[name]=function(){if(FLY.on)return;return f.apply(this,arguments);};})(k);
