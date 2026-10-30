/* Elyra · Multiplayer · the air (Oct 30, Bryce: "add the air vehicles, Herald fighter, Keeper fighter and interceptor ... both teams get
   all vehicles in their spawn areas").
   Each base has three pads, one craft on each: the Herald fighter (the Wraith hull), the Keeper fighter (the Raven) and the interceptor.
   Walk up to one of your side's and press E (phone: USE) to take it up; E again low and slow sets you down and lets you out (higher
   up, you jump out and the craft goes down). A craft that is lost comes back on its pad after a while.
   The flight is The Heralds' own (js/shared/hflight.js), scaled to the island (AIR_K): the nose goes where you aim, W/S or the left
   stick is throttle, A/D slide, Space/Q up and down, Shift (BOOST) burns the boost meter. Guns: right-click on PC (FIRE on a phone),
   35 a hit, with The Heralds' lead assist on anything in the air; low over the ground they strafe whatever is under the crosshair.
   Missiles: left-click or F (MSL), unlimited, one every 1.5 s, homing on the craft nearest the crosshair, or straight into the ground
   to burst there. Each kind flies a little differently (KINDS). Each side also keeps AI fighters up (MPAIR.ai), on The Heralds'
   attack runs: other craft first, then the enemy on the ground.
   MPAIR.update(dt) every frame; MPAIR.use() is tried first on E; MPAIR.flying() while you have the stick. */
const MPAIR=(()=>{
  const AIR_K=.36;
  const KINDS={
    herald:{name:'HERALD FIGHTER',model:'wraith',len:15,spd:1.12,hp:.9,turn:1,glow:0xff6a3a},
    keeper:{name:'KEEPER FIGHTER',model:'raven',len:13,spd:1,hp:1.1,turn:1,glow:0x9ff4ff},
    interceptor:{name:'INTERCEPTOR',model:'interceptor',len:14,spd:1.05,hp:1,turn:1.1,glow:0x9ff4ff}};
  const TEAMC=GS.TEAMS;
  BK.mbolt={len:9,w:.32,head:4,col:0xbff8ff,bc:0x7fe0ff};boltMats.mbolt=new THREE.MeshBasicMaterial({color:C(0x7fe0ff).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
  BK.mboltR={len:9,w:.32,head:4,col:0xffc8b8,bc:0xff5a3a};boltMats.mboltR=new THREE.MeshBasicMaterial({color:C(0xff5a3a).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
  const css=document.createElement('style');css.textContent='body.mpfly #wpanel,body.mpfly #gear,body.mpfly #nade,body.mpfly #rld,body.mpfly #wpn,body.mpfly #shld,body.mpfly #jump,body.mpfly #crch,body.mpfly #ads,body.mpfly .shud{display:none!important}'+
    '.mpbar{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 14px);transform:translateX(-50%);width:min(320px,70vw);z-index:3;pointer-events:none;font:700 10px "Chakra Petch",sans-serif;letter-spacing:.18em;color:#bff0ff;text-align:center;text-shadow:0 1px 4px #000}'+
    '.mpbar i{display:block;height:6px;margin-top:4px;border:1px solid rgba(127,227,255,.5);border-radius:2px;overflow:hidden}.mpbar u{display:block;height:100%;background:linear-gradient(90deg,#7fe3ff,#e9fbff);transition:width .2s}'+
    '.mpbar i.hull{border-color:rgba(255,210,122,.5)}.mpbar i.hull u{background:linear-gradient(90deg,#ffb347,#ffe6a0)}.mpbar i.bst{height:3px;border-color:rgba(200,255,200,.4)}.mpbar i.bst u{background:#bfffcf}.mpbar.low{color:#ff8a7a}'+
    '.mplock{position:fixed;z-index:3;pointer-events:none;width:18px;height:18px;margin:-9px 0 0 -9px;border:2px solid #ffd27a;transform:rotate(45deg);box-shadow:0 0 12px #ffd27a;display:none}'+
    '.btn.mpboost{right:calc(var(--sr) + 104px);bottom:calc(var(--sb) + 26px);width:58px;height:58px;border-color:var(--accent);color:#bff0ff}.btn.mpboost.on{background:rgba(127,227,255,.4)}'+
    '.btn.mpmsl{right:calc(var(--sr) + 108px);bottom:calc(var(--sb) + 98px);width:52px;height:52px;border-color:rgba(255,210,122,.85);background:rgba(90,60,10,.5);color:#ffd27a}';
  document.head.appendChild(css);
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_e=new THREE.Euler(0,0,0,'YXZ'),V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  const CRAFTS=[],PADS=[],AI=[],MIS=[];let D=null,you='blue';
  const floorY=(x,z)=>Math.max(GS.SEA,groundY(x,z));
  /* ---------- a craft: the model in its own look, team lamps on the wingtips and a team-coloured engine glow ---------- */
  function makeCraft(kind,team){const K=KINDS[kind],g=new THREE.Group();g.userData.dyn=1;
    let ref;if(kind==='herald'){const W=SHIPKIT.wraith();ref=W.geo;g.add(new THREE.Mesh(W.geo,fleetHullMat()),new THREE.Mesh(W.glow,fleetGlowMat(TEAMC[team].c,2)));}
    else{const I=interceptorGeo(PG.paint());ref=I.geo;g.add(new THREE.Mesh(I.geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.4})));}
    ref.computeBoundingBox();const L=ref.boundingBox.max.z-ref.boundingBox.min.z;g.children.forEach(m=>m.scale.setScalar(K.len/L));
    MODELS.swapShip(g,K.model,{len:K.len,metal:.35,tint:TEAMC[team].tint,shadow:true});
    const col=C(TEAMC[team].c).multiplyScalar(2.6);
    for(const s of[-1,1]){const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.position.set(s*K.len*.36,.2,K.len*.12);l.scale.setScalar(1.6);g.add(l);}
    const eng=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(K.glow).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.0}));eng.position.set(0,0,K.len*.52);eng.scale.setScalar(K.len*.35);g.add(eng);g.userData.eng=eng;
    scene.add(g);return g;}
  function newCraft(kind,team,pad){const K=KINDS[kind],g=makeCraft(kind,team),cr={kind,K,team,g,pos:g.position,vel:new THREE.Vector3(),yaw:pad?pad.yaw:0,pitch:0,bank:0,meter:100,boost:0,
      ...DMG.pool({hp:Math.round(DMG.CLASS.fighter.hp*K.hp),shield:DMG.CLASS.fighter.shield},DMG.REGEN.craft),dead:0,gone:false,pilot:null,pad,landed:true,idleT:0};
    if(pad){g.position.set(pad.x,pad.y+1.8,pad.z);g.rotation.set(0,pad.yaw,0);}
    CRAFTS.push(cr);
    // shots and rockets find it (js/origin/03-play.js aimRay, updateRockets): the other side's craft only
    AIR_TARGETS.push({spheres:()=>[{c:cr.pos,r:K.len*.42}],hit:(p,how,dmg)=>hurtCraft(cr,dmg,you),off:()=>cr.dead||cr.gone||cr.team===you||cr.pilot==='you',blast:(p,r,dmg,mine)=>{if(mine&&cr.team!==you&&p.distanceTo(cr.pos)<r+K.len*.4)hurtCraft(cr,dmg*DMG.LEGACY*.4,you);}});
    return cr;}
  function addPad(B,x,z,yaw,kind){const pad={x,z,y:GS.terrH(x,z),yaw,kind,team:B.team,base:B};PADS.push(pad);
    // the pad: a ring of light in the team's colour on the stone
    const ring=new THREE.Mesh(new THREE.RingGeometry(7.4,8.2,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:C(TEAMC[B.team].c).multiplyScalar(1.6),toneMapped:false,transparent:true,opacity:.75,depthWrite:false}));
    ring.position.set(x,pad.y+.06,z);ring.userData.dyn=1;scene.add(ring);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(7.4,48).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:C(0x8e8a80),roughness:.5,metalness:.3}));disc.position.set(x,pad.y+.04,z);disc.receiveShadow=true;disc.userData.dyn=1;scene.add(disc);
    pad.cr=newCraft(kind,B.team,pad);return pad;}
  /* ---------- damage ---------- */
  function hurtCraft(cr,dmg,byTeam){if(cr.dead||cr.gone||!(dmg>0))return;DMG.hit(cr,dmg,T);cr.lastHitBy=byTeam;
    if(cr.pilot==='you'){D.shake=Math.max(D.shake,.3);$('hurt').style.opacity=.3;setTimeout(()=>$('hurt').style.opacity=0,140);if(typeof sfx!=='undefined')sfx.hit(cr.shield>0);}
    else if(byTeam===you){$('cross').classList.add('hit');clearTimeout(hurtCraft.t);hurtCraft.t=setTimeout(()=>$('cross').classList.remove('hit'),90);if(typeof sfx!=='undefined'&&sfx.hitConfirm)sfx.hitConfirm(true);}
    if(cr.hp<=0)downCraft(cr,byTeam);}
  function downCraft(cr,byTeam){cr.dead=3;const p=cr.pos.clone();boom(p,10,0xfff0d0,.6);boom(p,16,0xff8a3a,1.1);puff(p,8,3);if(typeof sfx!=='undefined')sfx.explosion&&sfx.explosion(p,500);
    const wasYou=cr.pilot==='you',ai=cr.pilot==='ai';
    if(wasYou){stopFlying(true);hurtPlayer(9999,null,true);}
    if(ai&&MPAIR.onKill)MPAIR.onKill(byTeam,cr.team,'craft');
    if(byTeam===you&&!wasYou&&cr.team!==you){P.kills++;PG.kill(ai?250:150,p.clone().add(V3(0,3,0)),'gun');}
    cr.pilot=null;}
  /* ---------- your flight ---------- */
  function near(){if(D||!P.alive||!P.input||(typeof VEH!=='undefined'&&VEH.cur))return null;let best=null,bd=1e9;
    for(const cr of CRAFTS){if(cr.dead||cr.gone||cr.pilot||cr.team!==you)continue;const d=Math.hypot(P.pos.x-cr.pos.x,P.pos.z-cr.pos.z);if(d<cr.K.len*.55+3&&Math.abs(P.pos.y-cr.pos.y)<6&&d<bd){bd=d;best=cr;}}return best;}
  function use(){if(D){leave();return true;}const cr=near();if(!cr)return false;startFlying(cr);return true;}
  function startFlying(cr){cr.pilot='you';cr.landed=false;cr.idleT=0;VEH.flying=true;P.H.root.visible=false;P.crouch=false;P.adsHeld=false;fireHeld=false;P.reloadT=0;
    P.yaw=cr.yaw;P.pitch=.32;document.body.classList.add('mpfly');
    const bar=document.createElement('div');bar.className='mpbar';bar.innerHTML=cr.K.name+'<i><u></u></i><span style="display:block;margin-top:5px">HULL</span><i class="hull"><u></u></i><i class="bst"><u></u></i>';document.body.appendChild(bar);
    const lk=document.createElement('div');lk.className='mplock';document.body.appendChild(lk);
    let bb=null,mb=null;if(coarse){bb=document.createElement('button');bb.type='button';bb.className='btn mpboost';bb.textContent='BOOST';document.body.appendChild(bb);
      const on=e=>{e.preventDefault();try{bb.setPointerCapture(e.pointerId);}catch(_){}if(D)D.boostHeld=true;bb.classList.add('on');},off=()=>{if(D)D.boostHeld=false;bb.classList.remove('on');};
      bb.addEventListener('pointerdown',on);bb.addEventListener('pointerup',off);bb.addEventListener('pointercancel',off);bb.addEventListener('lostpointercapture',off);
      mb=document.createElement('button');mb.type='button';mb.className='btn mpmsl';mb.textContent='MSL';document.body.appendChild(mb);mb.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();missile();});}
    D={cr,bar,lk,bb,mb,cool:0,mslCool:0,gunL:false,lock:null,shake:0,lift:1.3,cam:null,fireWas:false,boostHeld:false,barrel:0,lowT:0};
    cr.vel.set(0,9,0);
    banner(coarse?cr.K.name+' · right thumb aims · left stick throttle · FIRE guns · MSL · USE to land and get out':cr.K.name+' · mouse aims · W/S throttle · A/D slide · Space/Q up/down · Shift boost · right-click guns · left-click or F missiles · E out','alert');
    if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();}
  function stopFlying(destroyed){if(!D)return;const cr=D.cr;D.bar.remove();D.lk.remove();if(D.bb)D.bb.remove();if(D.mb)D.mb.remove();document.body.classList.remove('mpfly');
    VEH.flying=false;P.H.root.visible=true;camera.fov=62;camera.updateProjectionMatrix();fireHeld=false;P.adsHeld=false;
    if(!destroyed){cr.pilot=null;}D=null;}
  // E in the air: low and slow, she settles and you climb out beside her; otherwise you jump and she goes down
  function leave(){const cr=D.cr,p=cr.pos,gy=floorY(p.x,p.z),low=p.y-gy<14&&cr.vel.length()<40;
    const fx=-Math.sin(cr.yaw),fz=-Math.cos(cr.yaw),rx=Math.cos(cr.yaw),rz=-Math.sin(cr.yaw);
    let x=p.x-rx*(cr.K.len*.5+2),z=p.z-rz*(cr.K.len*.5+2);if(playD(x,z)>-.6){x=p.x+rx*(cr.K.len*.5+2);z=p.z+rz*(cr.K.len*.5+2);}if(playD(x,z)>-.6){x=p.x-fx*(cr.K.len*.6+2);z=p.z-fz*(cr.K.len*.6+2);}
    if(playD(x,z)>-.6){const B=GS.BASES.find(b=>b.team===you);x=B.x;z=B.z;}
    stopFlying(false);
    if(low){cr.landed=true;cr.vel.set(0,0,0);cr.pos.y=gy+1.8;cr.pitch=0;cr.bank=0;P.pos.set(x,groundY(x,z),z);banner('Out · walk up and press '+(coarse?'USE':'E')+' to take her up again');}
    else{P.pos.set(x,p.y-2,z);P.vy=0;cr.dive=true;banner('Bailed out','alert');}}
  // you: once a frame while flying
  function fly(dt){const cr=D.cr,K=cr.K,sh=cr.g;
    let f=0,s=0,up=0;if(P.input){if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD)s+=1;if(keys.KeyA)s-=1;if(keys.Space)up+=1;if(keys.KeyQ||keys.KeyC||keys.ControlLeft)up-=1;
      if(keys.ArrowLeft)P.yaw+=1.6*dt;if(keys.ArrowRight)P.yaw-=1.6*dt;f+=joy.y;s+=joy.x;}
    f=clamp(f,-1,1);s=clamp(s,-1,1);P.pitch=clamp(P.pitch,-1,.9);
    if(D.lift>0){D.lift-=dt;up=Math.max(up,1);}
    cr.yaw=P.yaw;cr.pitch=P.pitch;
    const st=HFLY.steer(cr,dt,AIR_K*K.spd,{f,s,up,boost:P.input&&(keys.ShiftLeft||keys.ShiftRight||D.boostHeld)});
    if(D.lift>0)cr.vel.y=Math.max(cr.vel.y,10);
    cr.pos.addScaledVector(cr.vel,dt);
    _e.set(cr.pitch,cr.yaw,cr.bank);sh.quaternion.setFromEuler(_e);
    if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.interceptor','you',null,.8,.95+cr.boost*.15);
    // the ground, the roofs and the sea: low and slow settles her; faster scrapes and hurts
    const fy=floorY(cr.pos.x,cr.pos.z)+1.8;if(cr.pos.y<fy){const v=cr.vel.length();cr.pos.y=fy;cr.vel.y=Math.max(cr.vel.y,0);
      if(v>34&&T-(D.bumpT||-9)>.6){D.bumpT=T;hurtCraft(cr,10+v*.08,null);boom(cr.pos.clone(),3,0xfff0d0,.3);if(typeof sfx!=='undefined')sfx.crash&&sfx.crash(cr.pos);}
      if(v>34)P.pitch=Math.max(P.pitch,.15);}
    D.lowT=cr.pos.y-fy<4&&cr.vel.length()<30?D.lowT+dt:0;if(D.lowT>.6&&!D.landSaid){D.landSaid=true;banner(coarse?'Low and slow · USE to climb out':'Low and slow · E to climb out');}if(D.lowT===0)D.landSaid=false;
    // the other side's dome turns her away; too far out to sea or too high, she's turned back
    for(const B of GS.BASES){if(B.team===you)continue;const dx=cr.pos.x-B.x,dy=cr.pos.y-B.y,dz=cr.pos.z-B.z,d=Math.hypot(dx,dy,dz);if(d<B.shieldR+K.len*.3){const k=(B.shieldR+K.len*.3)/d;cr.pos.set(B.x+dx*k,B.y+dy*k,B.z+dz*k);cr.vel.multiplyScalar(-.3);
      if(T-(D.domeT||-9)>1.5){D.domeT=T;banner('Their dome · nothing gets through it','alert');boom(cr.pos.clone(),4,TEAMC[B.team].c,.4);}}}
    if(GS.edgeD(cr.pos.x,cr.pos.z)>1600||cr.pos.y>520){const want=Math.atan2(cr.pos.x,cr.pos.z);P.yaw=angLerp(P.yaw,want,1-Math.exp(-dt*1.6));if(cr.pos.y>520)P.pitch=Math.min(P.pitch,-.15);
      if(T-(D.outT||-9)>5){D.outT=T;banner('Turning you back over the island','alert');}}
    // the camera: behind and above, easing after her, level (a quarter of her bank)
    const camT=cr.pos.clone().addScaledVector(st.fwd,-(K.len*1.7+6)-cr.boost*3).addScaledVector(st.upv,K.len*.42+2);if(!D.cam)D.cam=camT.clone();D.cam.lerp(camT,1-Math.exp(-dt*10));
    {const cy=groundY(D.cam.x,D.cam.z)+2;if(D.cam.y<cy)D.cam.y=cy;}camera.position.copy(D.cam);
    camera.quaternion.setFromEuler(new THREE.Euler(cr.pitch-.08,cr.yaw,cr.bank*.25,'YXZ'));camera.fov=66+cr.boost*8;camera.updateProjectionMatrix();
    if(D.shake>0){D.shake-=dt;camera.position.x+=R(-1,1)*D.shake*.4;camera.position.y+=R(-1,1)*D.shake*.4;}
    DMG.tick(cr,dt,T);
    // you are where she is (the bots aim at you there)
    P.pos.set(cr.pos.x,cr.pos.y-1.2,cr.pos.z);P.H.root.visible=false;if(typeof VM!=='undefined')VM.root.visible=false;
    // guns: PC right-click (phone FIRE), alternating barrels
    D.cool-=dt;const gunOn=coarse?fireHeld:P.adsHeld;
    if(gunOn&&P.input&&D.cool<=0){D.cool=DMG.CRAFT_GUN_CD;D.gunL=!D.gunL;camera.updateMatrixWorld(true);
      const dir=camera.getWorldDirection(_a).clone(),a=HFLY.aim(camera.position,dir,airList(cr.team),AIR_K),from=sh.localToWorld(V3((D.gunL?-1:1)*K.len*.18,-.3,-K.len*.45));
      if(typeof sfx!=='undefined'&&sfx.next)sfx.next('gun.pilot');
      if(a.hit){const t=a.hit,to=camera.position.clone().addScaledVector(a.dir,a.dist);fire(from,to,900,'mbolt',q=>{boom(q,1.6,0x9ff4ff,.2);hurtCraft(t,DMG.AIR.turret,cr.team);});}
      else{const A=aimRay(900,.004);fire(from,A.p,900,'mbolt',q=>{boom(q,1.1,0x9ff4ff,.2);if(A.hit&&A.hit.E)hurtEnemy(A.hit.E,DMG.AIR.turret*1.3,'gun','torso');else if(A.hit&&A.hit.AT)A.hit.AT.hit(q,'gun',DMG.AIR.turret);else puff(q,.8,.8);});}}
    // missiles: PC left-click or F (phone MSL)
    if(!coarse){if(fireHeld&&!D.fireWas)missile();D.fireWas=fireHeld;}
    D.mslCool=Math.max(0,D.mslCool-dt);D.lock=HFLY.lock(camera.position,camera.getWorldDirection(_a).clone(),airList(cr.team),AIR_K,D.lock);
    if(D.mb){D.mb.style.opacity=D.mslCool>0?.45:1;}
    // the bars, and the lock diamond over what a missile would chase
    D.bar.querySelector('i u').style.width=(cr.shield/cr.maxShield*100)+'%';D.bar.querySelector('i.hull u').style.width=(cr.hp/cr.maxHp*100)+'%';D.bar.querySelector('i.bst u').style.width=cr.meter+'%';D.bar.classList.toggle('low',cr.hp<cr.maxHp*.3);
    if(D.lock){_b.copy(D.lock.pos).project(camera);if(_b.z<1){D.lk.style.display='block';D.lk.style.left=((_b.x+1)/2*innerWidth)+'px';D.lk.style.top=((1-_b.y)/2*innerHeight)+'px';}else D.lk.style.display='none';}else D.lk.style.display='none';}
  function airList(team){const L=[];for(const c of CRAFTS){if(c.team===team||c.dead||c.gone||c.landed&&!c.pilot)continue;L.push({pos:c.pos,vel:c.vel,r:c.K.len*.55,ref:c});}return L;}
  window.addEventListener('keydown',e=>{if(e.code==='KeyF'&&D&&!e.repeat)missile();});
  /* ---------- missiles: homing on a locked craft, else straight on and into the ground ---------- */
  const mslGeo=new THREE.CylinderGeometry(.14,.2,1.5,8).rotateX(Math.PI/2),mslMat=new THREE.MeshStandardMaterial({color:C(0xe8ecf2),roughness:.4,metalness:.4});
  function missile(){if(!D||!P.input||D.mslCool>0||PG.paused)return;D.mslCool=1.5;const cr=D.cr,sh=cr.g;D.barrel^=1;
    const from=sh.localToWorld(V3((D.barrel?1:-1)*cr.K.len*.22,-.6,-cr.K.len*.2)),dir=camera.getWorldDirection(_a).clone();launch(from,dir,D.lock,cr.team,cr.vel);}
  function launch(from,dir,tgt,team,base){let M=MIS.find(m=>!m.on);if(!M){if(MIS.length>=20)return;const mesh=new THREE.Mesh(mslGeo,mslMat),fl=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffc070).multiplyScalar(3),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
      fl.scale.setScalar(2.4);fl.position.z=1;mesh.add(fl);mesh.userData.dyn=1;scene.add(mesh);M={mesh,pos:mesh.position,vel:new THREE.Vector3()};MIS.push(M);}
    M.on=true;M.t=0;M.mesh.visible=true;M.pos.copy(from);M.vel.copy(dir).normalize().multiplyScalar(140).add(base||_b.set(0,0,0));M.tgt=tgt;M.team=team;M.pt=0;boom(from,2,0xffd27a,.15);if(typeof sfx!=='undefined')(sfx.missile||sfx.breaker||(()=>{}))(from);}
  function updateMissiles(dt){for(const M of MIS){if(!M.on)continue;M.t+=dt;const t=M.tgt&&!M.tgt.dead&&!M.tgt.gone?M.tgt:null;
    const spd=Math.min(300,M.vel.length()+260*dt);if(t){_a.subVectors(t.pos,M.pos).normalize();M.vel.normalize().lerp(_a,1-Math.exp(-dt*(M.t<.1?2:5.5))).normalize();}else M.vel.normalize();M.vel.multiplyScalar(spd);
    const prev=M.pos.clone();M.pos.addScaledVector(M.vel,dt);M.mesh.lookAt(_a.copy(M.pos).sub(M.vel));M.pt-=dt;if(M.pt<=0){M.pt=.03;puff(M.pos.clone(),R(.8,1.4),1.2);}
    let hit=false,air=null;
    if(t&&M.pos.distanceTo(t.pos)<t.K.len*.55+3){hit=true;air=t;}
    if(!hit)for(const c of CRAFTS){if(c.team===M.team||c.dead||c.gone)continue;if(M.pos.distanceTo(c.pos)<c.K.len*.5){hit=true;air=c;break;}}
    if(!hit&&(M.pos.y<floorY(M.pos.x,M.pos.z)+.3||losBlock(prev,M.pos)))hit=true;
    if(!hit&&M.t>5)hit=true;
    if(hit){M.on=false;M.mesh.visible=false;const p=prev;boom(p,5,0xfff0c0,.4);boom(p,8,0xff8a3a,.8);puff(p,4,2.2);if(typeof sfx!=='undefined')sfx.blast&&sfx.blast(p);
      if(air)hurtCraft(air,DMG.AIR.rocket,M.team);else if(MPAIR.onBlast)MPAIR.onBlast(p,M.team,8,120);}}}
  /* ---------- the AI fighters: The Heralds' attack runs. Another side's craft in the air first; else whoever of theirs is on the ground ---------- */
  function addAI(team,kind){const B=GS.BASES.find(b=>b.team===team),cr=newCraft(kind,team,null);cr.pilot='ai';cr.landed=false;cr.pos.set(B.x+R(-30,30),140,B.z+R(-30,30));
    cr.v=new THREE.Vector3(B.fx,0,B.fz);cr.cool=R(.5,1.5);cr.t=0;cr.pass=null;cr.me=true;cr.aiKind=kind;AI.push(cr);return cr;}
  function aiTarget(cr){let best=null,bd=1e9;
    for(const c of CRAFTS){if(c.team===cr.team||c.dead||c.gone||(c.landed&&!c.pilot))continue;const d=c.pos.distanceTo(cr.pos)*(c.pilot==='you'?.5:1);if(d<bd){bd=d;best={pos:c.pos,cr:c};}}
    if(best&&(bd<450||rng()<.35))return best;   // (a craft close by, or now and then one further off; otherwise they work the ground)
    const g=MPAIR.groundFoe?MPAIR.groundFoe(cr.team,cr.pos):null;return g;}
  function updateAI(dt){for(const cr of AI){if(cr.gone)continue;
    if(cr.dead)continue;
    cr.retarget=(cr.retarget||0)-dt;if(cr.retarget<=0||!cr.tg||(cr.tg.cr&&(cr.tg.cr.dead||cr.tg.cr.gone))){cr.retarget=R(2,4);cr.tg=aiTarget(cr);}
    const tg=cr.tg;
    HFLY.fighter(cr,dt,{k:AIR_K*.85*cr.K.spd,floor:(x,z)=>floorY(x,z)+(tg&&!tg.cr?6:30),
      passFix:p=>{const e=GS.edgeD(p.x,p.z);if(e>900){p.x*=900/e;p.z*=900/e;}p.y=clamp(p.y,floorY(p.x,p.z)+50,320);for(const B of GS.BASES)if(B.team!==cr.team&&Math.hypot(p.x-B.x,p.z-B.z)<B.shieldR+40){p.x=B.x+(p.x-B.x)*1.8;p.z=B.z+(p.z-B.z)*1.8;}return p;},
      reroll:f=>{f.retarget=0;},
      tgt:f=>f.tg?f.tg.pos:_b.set(0,120,0),
      shoot:(f,d)=>{const t=f.tg;if(!t)return;const hit=rng()<(t.cr?(t.cr.pilot==='you'?DMG.hitChance()*DMG_AIR_K():.4):.45),aim=t.pos.clone().add(hit?V3(0,t.cr?0:1.2,0):V3(R(-1,1),R(-.3,1),R(-1,1)).setLength(R(3,8)));
        const from=f.g.position.clone();if(losBlock(from,aim))return;
        fire(from,aim,700,f.team==='red'?'mboltR':'mbolt',q=>{boom(q,1.2,TEAMC[f.team].c,.25);if(!hit)return;if(t.cr)hurtCraft(t.cr,t.cr.pilot==='you'?DMG.npcAir('turret'):DMG.AIR.turret,f.team);else if(MPAIR.onStrafe)MPAIR.onStrafe(t,f.team);});}});
    // her own dome is no shelter for the other side; theirs turns her
    for(const B of GS.BASES){if(B.team===cr.team)continue;const dx=cr.pos.x-B.x,dz=cr.pos.z-B.z,d=Math.hypot(dx,cr.pos.y-B.y,dz);if(d<B.shieldR+10){const k=(B.shieldR+10)/d;cr.pos.x=B.x+dx*k;cr.pos.z=B.z+dz*k;cr.pass=null;}}
    // low over the island, where the ground can see them (Oct 30: left alone they climbed to ~500 m and fought out of sight)
    {const top=tg&&tg.cr?260:150,fy=floorY(cr.pos.x,cr.pos.z);if(cr.pos.y>top){cr.pos.y=lerp(cr.pos.y,top,1-Math.exp(-dt*1.5));if(cr.v.y>0)cr.v.y*=.5;}if(cr.pos.y<fy+18)cr.pos.y=fy+18;
     const e=GS.edgeD(cr.pos.x,cr.pos.z);if(e>1100){cr.pass=null;}}
    cr.vel.copy(cr.v);cr.yaw=Math.atan2(-cr.v.x,-cr.v.z);}}
  const DMG_AIR_K=()=>.75;
  /* ---------- every frame ---------- */
  function update(dt){
    if(D&&!D.cr.dead)fly(dt);
    updateAI(dt);updateMissiles(dt);
    for(const cr of CRAFTS){
      const eng=cr.g.userData.eng;if(eng)eng.material.opacity=cr.landed&&!cr.pilot?0:.55+.25*Math.sin(T*30)+cr.boost*.25;
      if(cr.dead){cr.dead-=dt;if(!cr.gone){cr.pos.y-=dt*30;cr.g.rotation.z+=dt*3;if(rng()<.5)puff(cr.pos.clone(),R(2,4),2);
          if(cr.dead<=0||cr.pos.y<floorY(cr.pos.x,cr.pos.z)+1){cr.gone=true;cr.g.visible=false;boom(cr.pos.clone(),9,0xff9a5a,1);cr.backT=cr.pad?22:30;}}
        if(cr.gone){cr.backT-=dt;if(cr.backT<=0)respawn(cr);}continue;}
      if(cr.pilot)continue;
      // a craft you jumped out of goes down; one left out on the island goes back to its pad after a minute
      if(cr.dive){cr.pos.addScaledVector(cr.vel,dt);cr.vel.y-=14*dt;cr.g.rotation.x-=dt*.4;if(cr.pos.y<floorY(cr.pos.x,cr.pos.z)+1){cr.dive=false;downCraft(cr,null);}continue;}
      if(cr.pad&&cr.landed){const off=Math.hypot(cr.pos.x-cr.pad.x,cr.pos.z-cr.pad.z)>4;if(off){cr.idleT+=dt;if(cr.idleT>60){cr.idleT=0;cr.pos.set(cr.pad.x,cr.pad.y+1.8,cr.pad.z);cr.g.rotation.set(0,cr.pad.yaw,0);cr.yaw=cr.pad.yaw;}}}
      if(!cr.landed){const gy=floorY(cr.pos.x,cr.pos.z)+1.8;cr.pos.y=Math.max(gy,cr.pos.y-dt*8);if(cr.pos.y<=gy+.01)cr.landed=true;}
      DMG.tick(cr,dt,T);}}
  function respawn(cr){cr.gone=false;cr.dead=0;cr.g.visible=true;DMG.refill(cr);cr.g.rotation.set(0,0,0);cr.vel.set(0,0,0);cr.boost=0;cr.meter=100;cr.dive=false;
    if(cr.pad){cr.pos.set(cr.pad.x,cr.pad.y+1.8,cr.pad.z);cr.g.rotation.set(0,cr.pad.yaw,0);cr.yaw=cr.pad.yaw;cr.landed=true;cr.pilot=null;}
    else{const B=GS.BASES.find(b=>b.team===cr.team);cr.pos.set(B.x+R(-30,30),140,B.z+R(-30,30));cr.v=new THREE.Vector3(B.fx,0,B.fz);cr.pilot='ai';cr.landed=false;cr.pass=null;cr.tg=null;}}
  // a hit meant for you while you fly lands on your craft (the bots' rifles, a rocket's blast)
  function hurtYou(dmg,from,exact){if(!D)return false;hurtCraft(D.cr,exact?dmg:dmg*1.2,null);return true;}
  function canUse(){return !!(D||near());}
  return{KINDS,CRAFTS,PADS,AI,addPad,addAI,update,use,canUse,flying:()=>!!D,cur:()=>D&&D.cr,hurtYou,hurtCraft,setTeam:t=>{you=t;},onKill:null,onStrafe:null,onBlast:null,groundFoe:null};
})();
