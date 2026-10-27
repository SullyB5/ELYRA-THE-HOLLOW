/* Elyra · Pathfinder · Arc 03 · The White City — the way in, by air.
   Landry keeps Dropship Two's core alive; Rhen flies (the same stick as Arc 01's chase: the mouse or your right thumb points her,
   the left thumb turns her too, hold fire for the two nose guns). The Herald war is over the city: red fighters bringing it down,
   amber fighters and the guns on the wall defending it, and both sides will shoot at you. Then the Empty Host's fighters, already
   here. The opening in the wall is sealed with light until the case opens it.
     approach → get to the city, down six fighters (or get close)
     guns     → silence the three amber guns on the wall crown either side of the opening
     host     → the Host's fighters come in off the desert
     gate     → the case opens the opening: fly through it
   AIR.start(ds,{done,crash}) · AIR.update(dt) every frame while AIR.on. */
BK.pfgun={len:22,w:.8,head:8,col:0xffd08a,bc:0xffb347};BK.rbolt={len:48,w:2.2,head:22,col:0xff9a7a,bc:0xff4a2a};BK.abolt={len:48,w:2.2,head:22,col:0xffd08a,bc:0xffa030};
BK.aflak={len:30,w:2.6,head:26,col:0xffe8b0,bc:0xffc060};BK.wbeam={len:400,w:6,head:60,col:0xffb0a0,bc:0xff3a1a};
for(const k of['pfgun','rbolt','abolt','aflak','wbeam'])boltMats[k]=new THREE.MeshBasicMaterial({color:C(BK[k].bc).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});

/* the dropship (Dropship Two, as Arc 02 left her: patched, one engine dark) */
function makeDropship(){const g=new THREE.Group(),m=new Merger(),gl=new Merger(),hc=C(0x8e96a2),dk=C(0x2c3340),bl=C(0x2a5a96),gd=C(0xd9b25a);
  m.add(boxUV(9.6,5.8,22,3),M(0,1.8,-1.6),hc);m.add(boxUV(7.6,1.4,20,3),M(0,5.2,-1),dk);
  const nose=new THREE.CylinderGeometry(.8,4.6,6,4,1);nose.rotateY(Math.PI/4);nose.rotateX(-Math.PI/2);nose.scale(1,.75,1);m.add(nose,M(0,1.9,-15.6),hc);
  gl.add(new THREE.BoxGeometry(4.2,.9,2.4),M(0,3.4,-13.6,-.35,0,0),C(0x9ff0ff));
  for(const s of[-1,1]){m.add(boxUV(.2,1.1,21,3),M(s*4.85,2.4,-1.6),bl);m.add(boxUV(.22,.25,21,3),M(s*4.86,3.1,-1.6),gd);m.add(boxUV(4.4,.5,7,3),M(s*6.8,3,-3),dk);
    for(const z of[-6,4]){m.add(boxUV(2.6,2.6,6,3),M(s*7.2,1.4,z),dk);m.add(cylZ(1.1,1.2,1.2,10),M(s*7.2,1.4,z+3.4),hc);gl.add(new THREE.CircleGeometry(.9,12),M(s*7.2,1.4,z+4.05),C(0x7fe6ff));}}
  const geo=m.build();g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.45,metalness:.55})),new THREE.Mesh(gl.build(),new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)})));
  MODELS.swapShip(g,'dropship',{ref:geo,glow:.1}).then(m=>{if(m&&g.userData.eng)MODELS.sternSprites(m,g.userData.eng,{spread:.24,size:.16});});scene.add(g);g.userData.ref=geo;   // (Oct 27: the glows go on the model's stern)
  // engine glow behind her (four, one of them dead)
  const eng=[];for(const [x,z,on] of[[-7.2,8.2,1],[7.2,8.2,1],[-7.2,-1.6,1],[7.2,-1.6,0]]){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x7fe6ff).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:on?.9:0}));s.scale.setScalar(2.6);s.position.set(x,1.4,z+1.5);g.add(s);eng.push(s);}
  g.userData.eng=eng;return g;}

/* a fighter: the Wraith hull in its side's colours */
const SIDE_COL={red:0xff3a1a,amber:0xffa030,host:FLEET_PURPLE},SIDE_TINT={red:0x8a4a44,amber:0xd8ccb4,host:null};
function makeFighter(team){const K=SHIPKIT.wraith(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat()),new THREE.Mesh(K.glow,fleetGlowMat(SIDE_COL[team],2)));
  g.scale.setScalar(.6);scene.add(g);MODELS.swapShip(g,'wraith',{ref:K.geo,tint:SIDE_TINT[team]||undefined});
  const e=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(SIDE_COL[team]).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.9}));
  K.geo.computeBoundingBox();e.position.set(0,0,K.geo.boundingBox.max.z*.95);e.scale.setScalar(9);g.add(e);return g;}

const AIR=(()=>{
  const css=document.createElement('style');css.textContent='body.dog #wpanel,body.dog #gear,body.dog #nade,body.dog #rld,body.dog #wpn,body.dog #shld,body.dog #jump,body.dog #crch,body.dog #use,body.dog #ads,body.dog .shud{display:none!important}'+
    '.dogbar{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 14px);transform:translateX(-50%);width:min(320px,70vw);z-index:3;pointer-events:none;font:700 10px "Chakra Petch",sans-serif;letter-spacing:.18em;color:#bff0ff;text-align:center;text-shadow:0 1px 4px #000}'+
    'body:has(.dogbar) #banner{top:calc(env(safe-area-inset-top,0px) + 84px)!important}'+   /* (Oct 27) the hint line under the shield and hull bars, not on them */
    '.dogbar i{display:block;height:6px;margin-top:4px;border:1px solid rgba(127,227,255,.5);border-radius:2px;overflow:hidden}.dogbar u{display:block;height:100%;background:linear-gradient(90deg,#7fe3ff,#e9fbff);transition:width .2s}'+
    '.dogbar i.hull{border-color:rgba(255,210,122,.5)}.dogbar i.hull u{background:linear-gradient(90deg,#ffb347,#ffe6a0)}.dogbar.low{color:#ff8a7a}.dogbar.low i.hull u{background:#ff6a5a}'+
    '.dogtag{position:fixed;z-index:3;pointer-events:none;transform:translate(-50%,-140%);font:700 10px "Chakra Petch",sans-serif;letter-spacing:.16em;color:#ffd27a;text-shadow:0 1px 4px #000;white-space:nowrap}'+
    '.dogtag.gun{color:#ffc040}.dogtag.gun::after{content:"";display:block;margin:4px auto 0;width:12px;height:12px;border:2px solid #ffc040;transform:rotate(45deg)}'+
    '.dogtag.gate{color:#eaf2ff}.dogtag.gate::after{content:"";display:block;margin:4px auto 0;width:16px;height:16px;border:2px solid #eaf2ff;border-radius:50%}'+
    '.dogmk{position:fixed;z-index:3;pointer-events:none;width:10px;height:10px;margin:-5px 0 0 -5px;border:2px solid #ff5a4a;transform:rotate(45deg)}';
  document.head.appendChild(css);
  let A=null;
  const _v=new THREE.Vector3(),_w=new THREE.Vector3(),_e=new THREE.Euler(0,0,0,'YXZ');
  const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  // the amber guns on the wall crown, either side of the opening
  function makeGun(a){const g=new THREE.Group(),x=Math.sin(a)*(WR+WT/2),z=Math.cos(a)*(WR+WT/2);g.position.set(x,WH+3,z);scene.add(g);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(2.2,3.2,2.4,8),new THREE.MeshStandardMaterial({color:C(0x8a8478),map:panelTex,metalness:.6,roughness:.4}));base.position.y=1.2;g.add(base);
    const head=new THREE.Group();head.position.y=3.2;g.add(head);
    const hb=new THREE.Mesh(boxUV(3.4,2,3.6,2),new THREE.MeshStandardMaterial({color:C(0xd8ccb4),map:panelTex,metalness:.5,roughness:.4}));head.add(hb);
    for(const s of[-1,1]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,6,8),new THREE.MeshStandardMaterial({color:C(0x6a6458),metalness:.8,roughness:.3}));b.rotation.x=Math.PI/2;b.position.set(s*.9,.3,-4);head.add(b);}
    const lamp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffb030).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));lamp.scale.setScalar(6);lamp.position.y=1.4;head.add(lamp);
    // (Oct 24) Bryce's mounted gun model, the same one the Hollow turrets use, scaled up for the wall and lit amber; the code head hides
    if(typeof MODELS!=='undefined')MODELS.copy('turret').then(({scene:s})=>{MODELS.tame(s,.5);
      s.traverse(o=>{if(o.isMesh&&o.material.emissive){o.material=o.material.clone();o.material.emissive=C(0xffb030);o.material.emissiveIntensity=1.8;}});
      const {o}=MODELS.fit(s,{ry:Math.PI,size:9,axis:'z'});o.position.set(0,.2,-1.2);head.children.forEach(c=>{if(c!==lamp)c.visible=false;});head.add(o);}).catch(()=>{});
    return{g,head,lamp,hp:16,dead:false,cool:R(1,3),smoke:0};}
  function start(ds,o){
    o=o||{};const start=V3(0,150,1350);ds.position.copy(start);ds.rotation.set(0,0,0);ds.visible=true;
    P.input=true;P.alive=true;P.yaw=0;P.pitch=-.04;fireHeld=false;document.body.classList.add('dog');
    const bar=document.createElement('div');bar.className='dogbar';bar.innerHTML='SHIELDS<i><u style="width:100%"></u></i><span style="display:block;margin-top:5px">HULL</span><i class="hull"><u style="width:100%"></u></i>';document.body.appendChild(bar);
    const tags=[0,1,2,3].map(i=>{const d=document.createElement('div');d.className='dogtag';d.style.display='none';document.body.appendChild(d);return d;});
    const mks=[];for(let i=0;i<4;i++){const d=document.createElement('div');d.className='dogmk';d.style.display='none';document.body.appendChild(d);mks.push(d);}
    // streaks of dust going past (speed)
    const N=200,sp=new Float32Array(N*3);for(let i=0;i<N;i++)sp.set([R(-90,90),R(-60,60),R(-160,160)],i*3);
    const streaks=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({size:.28,color:C(0xcfe6ff),transparent:true,opacity:.45,depthWrite:false}));streaks.geometry.setAttribute('position',new THREE.BufferAttribute(sp,3));streaks.frustumCulled=false;scene.add(streaks);
    A={ds,o,bar,tags,mks,streaks,sp,t:0,stage:'approach',stT:0,shields:DMG.CLASS.dropship.shield,hull:DMG.CLASS.dropship.hp,lastHit:-99,cool:0,gunL:true,yaw:0,pitch:-.04,roll:0,shake:0,kills:0,hostKills:0,said:new Set(),F:[],guns:[],warT:2,dead:false,outT:0,checked:0};
    // the war: red and amber fighters already at it over the city; a few break off for you
    for(let i=0;i<5;i++)addFighter('red',V3(R(-500,500),R(110,260),R(-200,500)));
    for(let i=0;i<5;i++)addFighter('amber',V3(R(-500,500),R(110,260),R(-300,400)));
    A.guns=[-.075,.075,-.16].map(a=>makeGun(a));
    banner(coarse?'You have the stick · drag to steer, hold FIRE':'You have the stick · mouse steers, click to fire','alert');
  }
  function addFighter(team,pos){const g=makeFighter(team);g.position.copy(pos);const f={g,team,v:V3(R(-1,1),0,-1).normalize().multiplyScalar(110),hp:team==='host'?5:4,dead:0,tgt:null,ret:0,cool:R(1,3),off:V3(),gone:false};A.F.push(f);return f;}
  const live=team=>A.F.filter(f=>!f.dead&&!f.gone&&(!team||f.team===team));
  function radio(key,who,txt,tone){if(A.said.has(key))return;A.said.add(key);PG.say(who,txt,tone);}
  /* Oct 25 (js/shared/damage.js): Dropship Two is the dropship class, 300 HP and no shield, no recovery. exact: spec damage (the Herald
   and Host fighters' guns: the aircraft turret × threat level × 75%); otherwise old units (bumps, flak), the same share of 300 as of the old 200 */
  function hurtShip(n,from,exact){if(!A||A.dead)return;if(!exact)n*=(OD.dmg||1)*DMG.CLASS.dropship.hp/200;A.lastHit=T;A.shake=Math.max(A.shake,.35);const s=Math.min(A.shields,n);A.shields-=s;A.hull-=n-s;
    if(typeof sfx!=='undefined')sfx.hit(s>=n);if(A.hull<=0)crash();}
  function crash(){if(A.dead)return;A.dead=true;const p=A.ds.position.clone();boom(p,30,0xfff0d0,.8);boom(p,40,0xff8a3a,1.2);flashScreen(.6);if(typeof sfx!=='undefined')sfx.crash(camera.position);
    PG.say('Ensign Landry','We’re hit! We’re going down!','alert');const o=A.o;setTimeout(()=>{stop();if(o.crash)o.crash();},1800);}
  function stop(){if(!A)return;A.bar.remove();A.tags.forEach(t=>t.remove());A.mks.forEach(t=>t.remove());scene.remove(A.streaks);document.body.classList.remove('dog');
    for(const f of A.F)scene.remove(f.g);for(const G of A.guns)scene.remove(G.g);camera.fov=62;camera.updateProjectionMatrix();fireHeld=false;A=null;}
  // is a point inside something solid (the ground, a building, the tower, the wall)? returns the push-out, or null
  function solidAt(p){const gy=Math.max(0,meshY(p.x,p.z));   /* (the drawn floor: the buildings are FLY circles below) */if(p.y<gy+6)return V3(0,gy+6-p.y,0);
    const rr=Math.hypot(p.x,p.z),wr=WR+WT/2;
    /* the wall, and over it: the city will not be flown into except through its opening (Oct 22 test: the dropship went over the
       wall, or straight through it at speed, and then could never fly the opening). It pushes her back to the side she came from */
    if(Math.abs(rr-wr)<WT/2+7&&(p.y<WH+5||!(A&&A.through))){
      const inHole=p.y<WH+5&&Math.hypot(p.x-GATE.x,p.y-GATE.y)<GATE.r-6&&p.z>0&&WALL.open>.9;
      if(!inHole){const k=A&&A.wside?A.wside:(rr<wr?-1:1);if(p.y>=WH+5&&A)radio('over'+Math.floor(A.t/15),'Ensign Landry','Something’s pushing us off the city, Captain. We go in by the front, or not at all.','alert');
        return V3(p.x/rr*k,0,p.z/rr*k).multiplyScalar(Math.max(1,WT/2+8-k*(rr-wr)));}}
    else if(A)A.wside=rr<wr?-1:1;
    for(const o of FLY){if(p.y>o.h+4)continue;const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz);if(d<o.r+5){const k=(o.r+5-d)/Math.max(d,.01);return V3(dx*k,0,dz*k);}}
    return null;}
  function update(dt){if(!A)return;const D=A,ds=D.ds;D.t+=dt;D.stT+=dt;
    if(!D.dead){
    // steering
    P.yaw-=joy.x*dt*1.3;P.pitch=clamp(P.pitch+joy.y*dt*.9,-.8,.6);
    const dy=((P.yaw-D.yaw+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;D.yaw+=dy*(1-Math.exp(-dt*2.4));   /* (the short way round: a yaw that wrapped past ±π used to send her the long way, off into the desert) */D.pitch+=(P.pitch-D.pitch)*(1-Math.exp(-dt*2.4));D.roll+=(clamp(-dy*1.6,-1,1)-D.roll)*(1-Math.exp(-dt*3));
    _e.set(D.pitch,D.yaw,D.roll);ds.quaternion.setFromEuler(_e);
    const fwd=_v.set(0,0,-1).applyQuaternion(ds.quaternion).clone(),spd=D.stage==='gate'&&Math.hypot(ds.position.x,ds.position.z-WR)<500?55:72;
    ds.position.addScaledVector(fwd,spd*dt);
    if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.dropship','you',null,1,spd>60?1.08:.96);   // Dropship Two's engines (you're flying her)
    // hitting things: pushed back out, and it hurts
    const push=solidAt(ds.position);if(push){ds.position.add(push);if(push.y>0){P.pitch=Math.max(P.pitch,.15);}else{const n=push.clone().normalize();P.yaw=Math.atan2(-(fwd.x+n.x*1.6),-(fwd.z+n.z*1.6));}
      if(T-(D.bumpT||-9)>.6){D.bumpT=T;hurtShip(push.y>0?6:12);boom(ds.position.clone().addScaledVector(fwd,8),6,0xfff0d0,.3);radio('bump','Ensign Landry','Pull up! Pull up!','alert');}}
    // too far out: Landry turns you back
    const rr=Math.hypot(ds.position.x,ds.position.z);if(rr>1700||ds.position.y>480){D.outT+=dt;if(D.outT>.3){const want=Math.atan2(ds.position.x,ds.position.z);P.yaw=angLerp(P.yaw,want,1-Math.exp(-dt*1.5));if(ds.position.y>480)P.pitch=Math.min(P.pitch,-.2);radio('out'+Math.floor(D.t/12),'Ensign Landry','Captain, the city’s behind us. Turn her round.','alert');}}else D.outT=0;
    // the camera: behind and a little above
    const back=fwd.clone().multiplyScalar(-28).add(V3(0,9,0).applyQuaternion(ds.quaternion));camera.position.copy(ds.position).add(back);
    camera.quaternion.copy(ds.quaternion);camera.rotateZ(-D.roll*.6);camera.rotateX(-.12);camera.fov=68;camera.updateProjectionMatrix();
    if(D.shake>0){D.shake-=dt;camera.position.x+=R(-1,1)*D.shake*.6;camera.position.y+=R(-1,1)*D.shake*.6;}
    // shields come back after three quiet seconds
    // (no shield on a dropship, so nothing comes back)
    // your guns
    D.cool-=dt;if(fireHeld&&P.input&&D.cool<=0){D.cool=.1;D.gunL=!D.gunL;const dir=camera.getWorldDirection(_w).clone();
      let best=null,bt=900;
      for(const f of D.F){if(f.dead||f.gone)continue;const oc=f.g.position.clone().sub(camera.position),t=oc.dot(dir);if(t<0||t>bt)continue;if(oc.lengthSq()-t*t<13*13){bt=t;best={f};}}
      for(const G of D.guns){if(G.dead)continue;const c=G.head.getWorldPosition(new THREE.Vector3()),oc=c.sub(camera.position),t=oc.dot(dir);if(t<0||t>bt)continue;if(oc.lengthSq()-t*t<6*6){bt=t;best={G};}}
      const to=camera.position.clone().addScaledVector(dir,best?bt:700),from=ds.position.clone().add(V3(D.gunL?-2.6:2.6,.4,-14).applyQuaternion(ds.quaternion));
      if(typeof sfx!=='undefined'&&sfx.next)sfx.next('gun.pf.nose.own');
      fire(from,to,1100,'pfgun',q=>{if(!best)return;boom(q,4,0xffd08a,.2);$('cross').classList.add('hit');clearTimeout(update.t);update.t=setTimeout(()=>$('cross').classList.remove('hit'),90);
        if(best.f)hitFighter(best.f,DMG.AIR.turret*(best.f.team==='host'?5:4)/(DMG.CLASS.fighter.hp+DMG.CLASS.fighter.shield),true);else hitGun(best.G,1);});}   // fighters: 125 (4 or 5 old points), the turret 35
    }else{camera.position.y+=dt*2;}
    // the fighters
    for(const f of D.F){if(f.gone)continue;if(f.dead){f.dead-=dt;f.g.position.y-=dt*30;f.g.rotation.z+=dt*4;if(rng()<.4)puff(f.g.position.clone(),R(3,6),2.5);if(f.dead<=0){f.gone=true;f.g.visible=false;}continue;}
      f.ret-=dt;if(f.ret<=0||!f.tgt||f.tgt.dead||f.tgt.gone){f.ret=R(3,6);
        // pick a target: you (more often the closer you are and the further the fight has gone), or a fighter of another side
        const dP=f.g.position.distanceTo(ds.position),want=f.team==='host'?.75:.3+(D.stage!=='approach'?.25:0);
        if(!D.dead&&(rng()<want||dP<220)){f.tgt={me:true};}else{const o=D.F.filter(g=>!g.dead&&!g.gone&&g.team!==f.team);f.tgt=o.length?pick(o):{me:true};}
        f.off.set(R(-80,80),R(-30,40),R(60,160));}
      const tp=f.tgt.me?ds.position:f.tgt.g.position;const want=tp.clone().add(f.tgt.me?f.off.clone().applyQuaternion(ds.quaternion).multiplyScalar(f.ret>2?1:.2):_w.set(0,0,0)).sub(f.g.position);
      // keep out of the ground and buildings
      if(f.g.position.y<80)want.y+=60;
      f.v.lerp(want.normalize().multiplyScalar(f.team==='host'?140:120),1-Math.exp(-dt*1.2));f.g.position.addScaledVector(f.v,dt);
      if(f.g.position.y<40)f.g.position.y=40;
      _w.copy(f.g.position).add(f.v);f.g.lookAt(_w);f.g.rotateY(Math.PI);
      f.cool-=dt;const to=tp.clone().sub(f.g.position),d=to.length();
      f.fb=(f.fb||0)-dt;if(!D.dead&&f.fb<=0&&typeof sfx!=='undefined'&&sfx.flyby&&f.g.position.distanceTo(ds.position)<70){f.fb=6;sfx.flyby(1.6,.14,f.g.position);}   // one screaming past
      if(f.cool<=0&&d<320&&to.normalize().dot(f.v.clone().normalize())>.82){f.cool=R(1.2,2.6);
        const kind=f.team==='red'?'rbolt':f.team==='amber'?'abolt':'hbolt',col=SIDE_COL[f.team];
        if(f.tgt.me){if(D.dead)continue;const hit=DMG.rolls();fire(f.g.position.clone(),ds.position.clone().add(V3(R(-3,3),R(-2,2),R(-3,3)).multiplyScalar(hit?1:4)),380,kind,q=>{boom(q,R(4,7),col,.3);if(hit&&A)hurtShip(DMG.npcAir('turret'),null,true);});}
        else{const g2=f.tgt;fire(f.g.position.clone(),g2.g.position.clone().add(V3(R(-4,4),R(-3,3),R(-4,4))),380,kind,q=>{boom(q,R(4,7),col,.3);if(rng()<.3&&!g2.dead)hitFighter(g2,1,false);});}}}
    // the guns on the wall: flak at you once you are close
    for(const G of D.guns){if(G.dead){G.smoke-=dt;if(G.smoke<=0){G.smoke=.2;puff(G.head.getWorldPosition(new THREE.Vector3()).add(V3(R(-1,1),2,R(-1,1))),R(3,6),3);}continue;}
      const c=G.head.getWorldPosition(new THREE.Vector3()),d=c.distanceTo(ds.position);G.lamp.material.opacity=.6+.4*Math.sin(T*6);
      G.head.lookAt(ds.position);G.head.rotateY(Math.PI);
      if(D.dead||d>820||(D.stage==='approach'&&d>520))continue;G.cool-=dt;if(G.cool<=0){G.cool=R(1,1.8)/(OD.rof||1);
        const lead=ds.position.clone().add(_v.set(0,0,-1).applyQuaternion(ds.quaternion).multiplyScalar(d/500*70)),hit=rng()<.35;   // (Oct 26: 5 points less accurate)
        const aim=lead.add(V3(R(-12,12),R(-8,8),R(-12,12)).multiplyScalar(hit?.3:1.4));
        fire(c,aim,500,'aflak',q=>{boom(q,R(9,14),0xffd08a,.45);puff(q,R(4,7),2);if(A&&q.distanceTo(A.ds.position)<16)hurtShip(R(7,11));});}}
    // the red warship: beams down into the city, now and then
    // (it winds up audibly half a second before each beam: the Herald charge-up)
    D.warT-=dt;if(D.warT<.55&&!D.warC&&WARSHIP.on&&typeof sfx!=='undefined'&&sfx.charge){D.warC=1;sfx.charge(WARSHIP.g.position);}
    if(D.warT<=0&&WARSHIP.on){D.warT=R(3,6);D.warC=0;const f=WARSHIP.g.position.clone(),to=V3(R(-300,300),0,R(-320,250));fire(f,to,900,'wbeam',q=>{boom(q,R(18,30),0xff8a3a,1.2);boom(q,12,0xfff0d0,.4);puff(q,R(12,20),6);});}
    // dust going past
    {const a=D.sp;for(let i=0;i<a.length;i+=3){a[i+2]+=dt*80;if(a[i+2]>160){a[i]=R(-90,90);a[i+1]=R(-60,60);a[i+2]=-160;}}D.streaks.position.copy(ds.position);D.streaks.quaternion.copy(ds.quaternion);D.streaks.geometry.attributes.position.needsUpdate=true;}
    // keep the war going: fighters come back in from the edges
    for(const team of['red','amber']){if(live(team).length<(D.stage==='gate'?2:4)&&rng()<dt*.6){const a=R(0,6.28);addFighter(team,V3(Math.sin(a)*900,R(160,300),Math.cos(a)*900-200));}}
    stages(dt);hud();
    // engines flicker; the dead one smokes
    const eng=ds.userData.eng;if(eng){eng.forEach((e,i)=>{if(i<3)e.material.opacity=.55+.2*Math.sin(T*30+i);});if(rng()<.3)puff(ds.localToWorld(eng[3].position.clone()),R(1.5,3),1.5);}
  }
  function hitFighter(f,n,mine){f.hp-=n;if(f.hp>0||f.dead)return;f.dead=2.5;const p=f.g.position.clone();boom(p,22,0xfff0d0,.6);boom(p,32,SIDE_COL[f.team],1.1);if(typeof sfx!=='undefined')sfx.explosion(p,600);
    if(mine){A.kills++;P.kills++;if(f.team==='host')A.hostKills++;PG.kill(f.team==='host'?300:250,p,'gun');PG.prog('p3air');}}
  function hitGun(G,n){if(G.dead)return;G.hp-=n;if(G.hp>0)return;G.dead=true;const c=G.head.getWorldPosition(new THREE.Vector3());boom(c,16,0xfff0c0,.6);boom(c,24,0xff8a3a,1.2);if(typeof sfx!=='undefined')sfx.blast(c);
    G.head.rotation.x=.6;G.lamp.visible=false;P.kills++;PG.kill(500,c,'gun');const left=A.guns.filter(g=>!g.dead).length;
    PG.say(left?'Thorne':'Sergeant Marsh',left?'Gun’s down. '+left+' left on the wall.':'That’s the last gun on the wall.',null);}
  function stages(dt){const D=A,ds=D.ds,rr=Math.hypot(ds.position.x,ds.position.z);
    if(D.stage==='approach'){PG.objective('Get to the city · fighters down: '+D.kills+' / 6');
      if(D.t>2)radio('a1','Ensign Landry','You fly, Captain. I’m keeping the core alive. One flight, remember.','alert');
      if(D.t>9)radio('a2','Thorne','Both sides are up there. Red’s hitting the city. Amber’s defending it.');
      if(D.t>16)radio('a3','Sergeant Marsh','And both of them have just noticed us.','alert');
      if(D.kills>=6||(D.t>75&&rr<900)){D.stage='guns';D.stT=0;banner('Silence the guns on the wall','alert');
        PG.say('Ensign Landry','Guns on the wall, either side of the opening! Amber’s! They’ll tear us apart going in!','alert');}}
    else if(D.stage==='guns'){const left=D.guns.filter(g=>!g.dead).length;PG.objective('Silence the guns on the wall · '+(3-left)+' / 3');
      if(D.stT>14)radio('g1','Okafor','Get in close and low, Captain! Under their arc!','alert');
      if(!left){D.stage='host';D.stT=0;
        // the Empty Host, already here: their fighters come in off the desert from the north-west
        for(let i=0;i<5;i++)addFighter('host',V3(-900+R(-100,100),R(160,260),-600+R(-100,100)));
        setTimeout(()=>PG.say('Okafor','New contacts! North-west! Purple!','alert'),400);setTimeout(()=>PG.say('Captain Rhen','The Host. Here?','alert'),2600);
        setTimeout(()=>PG.say('Thorne','They’re not after the Heralds. They’re after us.','alert'),5000);banner('Empty Host fighters','alert');}}
    else if(D.stage==='host'){PG.objective('Host fighters down: '+D.hostKills+' / 3');
      if(D.hostKills>=3||D.stT>45){D.stage='gate';D.stT=0;opening=0;banner('The opening','alert');
        PG.say('Ensign Landry','Captain, there’s no way in! That opening’s sealed!','alert');
        setTimeout(()=>PG.say('Sergeant Marsh','The case. It’s waking up again.'),3200);
        setTimeout(()=>{PG.say('Thorne','The opening. Look at the opening!','alert');if(typeof sfx!=='undefined'){sfx.wake();if(sfx.door)sfx.door(new THREE.Vector3(GATE.x,GATE.y,WR),'big',4);}if(typeof CASE!=='undefined')CASE.pulse=1;},6200);}}
    else if(D.stage==='gate'){if(D.stT>6.5)WALL.open=Math.min(1,WALL.open+dt*.3);WALL.skinU.open.value=sstep(0,1,WALL.open);
      PG.objective(WALL.open<.9?'The opening is clearing…':'Fly through the opening');
      if(WALL.open>=.9)radio('gt','Captain Rhen','Landry. Take us in.',null);
      if(WALL.open>=.9)radio('gt2','Ensign Landry','No, sir. You take us in. I’m holding her together.','alert');
      // through: past the wall's middle, inside the round hole
      const p=ds.position;if(WALL.open>.9&&p.z<WR+WT/2&&p.z>WR-WT&&Math.hypot(p.x-GATE.x,p.y-GATE.y)<GATE.r-4){const o=D.o;stop();if(o.done)o.done();}}}
  let opening=0;
  function hud(){const D=A;if(!D)return;const b=D.bar;b.children[0].firstChild.style.width=(DMG.CLASS.dropship.shield?D.shields/DMG.CLASS.dropship.shield*100:0)+'%';b.querySelector('i.hull u').style.width=Math.max(0,D.hull/DMG.CLASS.dropship.hp*100)+'%';b.classList.toggle('low',D.hull<DMG.CLASS.dropship.hp*.35);
    // tags: the guns while they are the job; the opening at the end
    const items=[];if(D.stage==='guns'||D.stage==='host')for(const G of D.guns)if(!G.dead)items.push({p:G.head.getWorldPosition(new THREE.Vector3()),t:'GUN',c:'gun'});
    if(D.stage==='gate')items.push({p:V3(GATE.x,GATE.y,WR+WT),t:WALL.open<.9?'THE OPENING':'THE OPENING · '+Math.round(D.ds.position.distanceTo(V3(GATE.x,GATE.y,WR+WT)))+' M',c:'gate'});
    D.tags.forEach((el,i)=>{const it=items[i];if(!it){el.style.display='none';return;}_w.copy(it.p).project(camera);const on=_w.z<1;
      const x=clamp((_w.x*.5+.5)*innerWidth,30,innerWidth-30),y=clamp((-_w.y*.5+.5)*innerHeight,60,innerHeight-60);
      el.style.display='';el.className='dogtag '+it.c;el.textContent=it.t;el.style.left=(on?x:innerWidth-x)+'px';el.style.top=(on?y:innerHeight-60)+'px';el.style.opacity=on?1:.5;});
    // markers on the Host fighters (they matter: they're the ones hunting you)
    const hf=D.stage==='host'?live('host'):[];D.mks.forEach((el,i)=>{const f=hf[i];if(!f){el.style.display='none';return;}_w.copy(f.g.position).project(camera);if(_w.z>1){el.style.display='none';return;}
      el.style.display='';el.style.borderColor='#c98aff';el.style.left=((_w.x*.5+.5)*innerWidth)+'px';el.style.top=((-_w.y*.5+.5)*innerHeight)+'px';});}
  return{start,update,stop,get on(){return!!A;},get state(){return A;}};
})();
// while you fly, the on-foot keys do nothing
for(const k of['dropWall','launchSentry','throwNade','jump','useZeal','toggleCrouch','startReload'])((name)=>{const f=window[name];if(typeof f!=='function')return;window[name]=function(){if(AIR.on)return;return f.apply(this,arguments);};})(k);
