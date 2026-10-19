/* Tide City · fleet */
/* ---------- city flagship: a different breed from the raiders — pearl twin-hull carrier with ring engines ---------- */

const FS=3.0,FG=flagshipGeo();
const flag={grp:new THREE.Group(),W:260,state:'hidden',t:0,fx:0,pt:0};
flag.grp.rotation.order='YXZ';
flag.grp.add(new THREE.Mesh(FG.geo,new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.35,metalness:.45})));
flag.grp.add(new THREE.Mesh(FG.glow,new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.8,1.8,1.8)})));
{const eg=new THREE.BufferGeometry();eg.setFromPoints([new THREE.Vector3(-280,-6,470),new THREE.Vector3(280,-6,470),new THREE.Vector3(0,0,520)]);
 flag.engMat=new THREE.PointsMaterial({size:420,map:glow,color:C(0x7fe6ff).multiplyScalar(2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 flag.grp.add(new THREE.Points(eg,flag.engMat));}
flag.grp.scale.setScalar(FS);flag.grp.visible=false;scene.add(flag.grp);
const FLY_T=34,LAND_T=54,flagLandY=YARD.top+105*FS;
const FP={P0:new THREE.Vector3(0,3100,-11000),C1:new THREE.Vector3(0,2700,-6500),C2:new THREE.Vector3(0,1900,-900),P2:new THREE.Vector3(0,1300,4200),
  H:new THREE.Vector3(YARD.x,flagLandY+520,YARD.z),L:new THREE.Vector3(YARD.x,flagLandY,YARD.z)};
function bez3(a,b,c,d,u,out){const v=1-u;return out.set(0,0,0).addScaledVector(a,v*v*v).addScaledVector(b,3*v*v*u).addScaledVector(c,3*v*u*u).addScaledVector(d,u*u*u);}
function flagPos(t,out){
  if(t<=FLY_T)return bez3(FP.P0,FP.C1,FP.C2,FP.P2,clamp(t/FLY_T,0,1),out);
  if(t<=FLY_T+10){const k=(t-FLY_T)/10;return out.lerpVectors(FP.P2,FP.H,k*(2-k));}
  return out.lerpVectors(FP.H,FP.L,ease((t-FLY_T-10)/(LAND_T-FLY_T-10)));
}
function flagPoint(){return flag.grp.localToWorld(new THREE.Vector3(R(-300,300),R(-40,90),R(-400,450)));}
function resetFlag(){flag.state='hidden';flag.grp.visible=false;flag.t=0;}
function updateFlag(dt,escT){
  if(flag.state==='hidden')return;
  if(flag.state==='flying'){
    flagPos(escT,flag.grp.position);
    // level out before touchdown so the ship sits square in its cradle
    flag.grp.rotation.set(escT<FLY_T?-.05:escT<FLY_T+10?-.025*(1-ease((escT-FLY_T-6)/4)):0,Math.PI,Math.sin(escT*.9)*.03*(1-ease((escT-FLY_T-6)/8)));
    flag.fx-=dt;if(flag.fx<=0){flag.fx=.2;const p=flagPoint();boom(p,R(260,520),pick([0xff7a1a,0xff4a10,0xffb040]),R(.4,.8));smoke(p,R(500,900),R(4,6));}
    flag.pt-=dt;if(flag.pt<=0){flag.pt=.12;puff(flagPoint(),R(120,200),5);}
    flag.engMat.opacity=escT<FLY_T+10?1:.6;
    // the flagship's heavy turrets fire back at the closest raider
    flag.gun=(flag.gun||0)-dt;
    if(flag.gun<=0&&escT<PEEL_T+3){flag.gun=1.1;const tg=PURS.filter(P=>P.grp.visible&&!P.dead);
      if(tg.length){tg.sort((a,b)=>a.grp.position.distanceToSquared(flag.grp.position)-b.grp.position.distanceToSquared(flag.grp.position));
        const P=tg[0],from=flag.grp.localToWorld(pick(FG.tps).clone()),to=P.grp.localToWorld(new THREE.Vector3(R(-60,60),R(-20,40),R(-300,300)));
        boom(from,200,0x9ff4ff,.25);
        fire(from,to,3400,'player',p=>{if(P.hp>8)damagePursuer(P,2,p,null);else{boom(p,420,0xfff1c8,.4);boom(p,700,0xff7a26,1.1);}});}}
    if(escT>=LAND_T){flag.state='landed';flag.grp.position.copy(FP.L);flag.grp.rotation.set(0,Math.PI,0);
      emitSprayAt(YARD.x,YARD.z-1200,700,200,.6);for(let i=0;i<10;i++)puff(flag.grp.position.clone().add(_bw.set(R(-1200,1200),-280,R(-1800,1800))),R(300,500),6);
      for(let i=0;i<3;i++)burners.push({p:flagPoint().clone(),t:0,s:2.2});}
  }else if(flag.state==='landed'){flag.engMat.opacity=Math.max(.15,flag.engMat.opacity-dt*.2);}
}

/* ---------- pursuers: raider frigates chasing the flagship in ---------- */
const PURS=[],PURS_HP=40;
for(let i=0;i<5;i++){
  const V=variants[i%3],grp=new THREE.Group();grp.rotation.order='YXZ';
  grp.add(new THREE.Mesh(V.geo,capitalMat),new THREE.Mesh(V.glowGeo,windowMat));
  const eg=new THREE.BufferGeometry();eg.setFromPoints(V.eng);
  grp.add(new THREE.Points(eg,new THREE.PointsMaterial({size:120,map:glow,color:C(0xff8a5a).multiplyScalar(2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
  grp.scale.setScalar(R(.36,.46));grp.visible=false;scene.add(grp);
  PURS.push({grp,hp:PURS_HP,lastHit:-99,dead:false,spin:0,fx:0,W:V.W,lag:2.6+i*1.1,off:new THREE.Vector3((i%2?1:-1)*R(1700,2400),R(-200,600),0),cool:R(.3,1),peel:false,v:new THREE.Vector3()});
}
const PEEL_T=16;
function resetPursuers(){for(const p of PURS){p.grp.visible=false;p.peel=false;p.hp=PURS_HP;p.dead=false;p.lastHit=-99;p.grp.rotation.set(0,0,0);}}
// player (or Vigil) damage to a raider frigate chasing the flagship
function damagePursuer(P,dmg,p,how){
  boom(p,dmg>1?600:260,0xfff1c8,.35);boom(p,dmg>1?1000:480,0xff7a26,1.1);
  if(P.dead)return;P.hp-=dmg;P.lastHit=performance.now()/1000;
  if(how){score.hull++;PG.add(10,null,false);}
  if(P.hp<=0){killPursuer(P);if(how){score.frigates++;PG.kill(1200,P.grp.position,how);PG.done('tfrig');flashBanner('Frigate destroyed');}else flashBanner('Flagship guns down a raider');}
}
function killPursuer(P){P.dead=true;P.spin=R(.4,.8)*(rng()<.5?-1:1);P.v.y-=40;
  boom(P.grp.position,1600,0xfff0c0,.6);for(let i=0;i<4;i++){const p=P.grp.localToWorld(new THREE.Vector3(R(-80,80),R(-30,60),R(-400,400)));boom(p,R(600,1000),0xff6a1a,R(1,1.6));smoke(p,R(600,1000),5);}
}
function updatePursuers(dt,escT,active){
  for(const P of PURS){
    if(P.dead){if(!P.grp.visible)continue;
      P.v.y-=90*dt;P.grp.position.addScaledVector(P.v,dt);P.grp.rotation.z+=P.spin*dt;P.grp.rotation.x-=.15*dt;
      P.fx-=dt;if(P.fx<=0){P.fx=.07;const p=P.grp.localToWorld(new THREE.Vector3(R(-60,60),R(0,60),R(-350,350)));boom(p,R(300,600),pick([0xff7a1a,0xff4a10]),.8);smoke(p,R(500,900),5);}
      if(P.grp.position.y<40){P.grp.visible=false;const p=P.grp.position.clone().setY(20);boom(p,2600,0xfff2d0,1);boom(p,2000,0xff7a20,2.2);emitSprayAt(p.x,p.z,260,180,1.2);spawnDebris(p,10,15,60,200,3);}
      continue;}
    if(!active||escT<P.lag*.5){P.grp.visible=false;continue;}
    P.grp.visible=true;
    if(escT<PEEL_T){
      flagPos(Math.max(0,escT-P.lag),P.grp.position).add(P.off);P.grp.rotation.set(-.04,Math.PI,0);P.v.set(0,0,600);
      P.cool-=dt;
      if(P.cool<=0&&flag.state==='flying'){P.cool=R(.6,1.3);
        const from=P.grp.localToWorld(new THREE.Vector3(0,-20,-520)),to=flagPoint();boom(from,140,ALIEN_GLOW,.3);
        fire(from,to,3000,'enemy',p=>{if(rng()<.75){boom(p,700,0x7fe6ff,.45);boom(p,380,0xffffff,.2);}else{boom(p,400,0xfff2d0,.35);boom(p,650,0xff6a1a,1);smoke(p,R(400,700),4);}});}
    }else{
      P.peel=true;
      P.v.lerp(_bw.set(P.off.x*.3,120,-520),1-Math.exp(-dt*.6));
      P.grp.position.addScaledVector(P.v,dt);
      P.grp.rotation.y=angLerp(P.grp.rotation.y,Math.atan2(-P.v.x,-P.v.z),1-Math.exp(-dt*1.2));
      P.grp.rotation.z=Math.sin(Math.min(1,(escT-PEEL_T)/3)*Math.PI)*.35*(P.off.x>0?1:-1);
      if(P.grp.position.z<-16000||escT>PEEL_T+40)P.grp.visible=false;
    }
  }
}

/* ---------- wreckage that stays: floating hull chunks with fires ---------- */
const DEB_N=coarse?90:150;
const debMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:C(0x3a3f46),roughness:.7,metalness:.4}),DEB_N);
debMesh.frustumCulled=false;scene.add(debMesh);
const debs=[];let debNext=0;
const _dm=new THREE.Matrix4(),_dq=new THREE.Quaternion(),_de=new THREE.Euler(),_ds=new THREE.Vector3(),_dp=new THREE.Vector3();
for(let i=0;i<DEB_N;i++){debs.push({on:false,p:new THREE.Vector3(),v:new THREE.Vector3(),r:new THREE.Vector3(),w:new THREE.Vector3(),s:new THREE.Vector3(),ph:rng()*6});
  debMesh.setMatrixAt(i,_dm.makeScale(0,0,0));}
function spawnDebris(p,n,smin,smax,spd,fires){
  for(let k=0;k<n;k++){const d=debs[debNext];debNext=(debNext+1)%DEB_N;
    d.on=true;d.p.copy(p);d.s.set(R(smin,smax),R(smin,smax)*.4,R(smin,smax)*.8);
    d.v.set(R(-1,1),R(.4,1.2),R(-1,1)).normalize().multiplyScalar(R(.4,1)*spd);
    d.r.set(rng()*6,rng()*6,rng()*6);d.w.set(R(-2,2),R(-2,2),R(-2,2));d.settled=false;d.fire=k<fires;}
}
function clearDebris(){for(let i=0;i<DEB_N;i++){debs[i].on=false;debMesh.setMatrixAt(i,_dm.makeScale(0,0,0));}debMesh.instanceMatrix.needsUpdate=true;}
function updateDebrisField(dt,t){
  for(let i=0;i<DEB_N;i++){const d=debs[i];if(!d.on)continue;
    if(!d.settled){d.v.y-=110*dt;d.p.addScaledVector(d.v,dt);d.r.addScaledVector(d.w,dt);
      const floatY=-d.s.y*.25;
      if(d.v.y<0&&d.p.y<=floatY){d.settled=true;d.p.y=floatY;emitSprayAt(d.p.x,d.p.z,d.s.x*.6,12,.5);if(d.fire)burners.push({p:d.p.clone().setY(d.s.y*.5),t:0,s:.8});}}
    else{d.p.y=-d.s.y*.25+Math.sin(t*.8+d.ph)*1.2;d.r.x+=Math.sin(t*.5+d.ph)*.0008;}
    _de.set(d.r.x,d.r.y,d.r.z);_dq.setFromEuler(_de);debMesh.setMatrixAt(i,_dm.compose(d.p,_dq,d.s));
  }
  debMesh.instanceMatrix.needsUpdate=true;
}

const yardPads=[-750,-250,250,750].map(x=>new THREE.Vector3(YARD.x+x,YARD.top,5530));
/* ---------- shipyard on the southern grassland ---------- */
(function(){
  const S=YARD,top=S.top;
  const concrete=new THREE.MeshStandardMaterial({map:panelTex,color:C(0x7d848b),roughness:.85,metalness:.05});
  const steel=new THREE.MeshStandardMaterial({color:C(0x59626c),roughness:.5,metalness:.55});
  const darkS=new THREE.MeshStandardMaterial({color:C(0x2a3037),roughness:.6,metalness:.4});
  const hazard=new THREE.MeshStandardMaterial({color:C(0xf2b632),emissive:C(0x4a3000),roughness:.5});
  const add=(geo,mat,x,y,z,ry=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);return m;};
  add(boxUV(2*S.hx-260,8,2*S.hz-160,140),concrete,S.x,top-4,S.z);
  // landing guides
  for(const s of[-1,1])add(new THREE.BoxGeometry(12,2,4200),accentMat,S.x+s*1180,top+1,S.z);
  for(let k=-8;k<=8;k++)add(new THREE.BoxGeometry(300,2,16),hazard,S.x,top+1,S.z+k*240);
  // cradle pylons under the ship's landing legs (ship faces south, so local x/z flip)
  for(const s of[-1,1])for(const lz of[-200,150,380]){const x=S.x-s*280*FS,z=S.z-lz*FS;
    add(new THREE.BoxGeometry(150,20,150),steel,x,top+10,z);add(new THREE.BoxGeometry(160,4,160),accentMat,x,top+22,z);}
  // gantry cranes at each end
  for(const gz of[S.z-2200,S.z+2200]){
    for(const s of[-1,1]){add(new THREE.BoxGeometry(70,900,70),steel,S.x+s*1400,top+450,gz);add(new THREE.BoxGeometry(110,40,110),darkS,S.x+s*1400,top+20,gz);}
    add(new THREE.BoxGeometry(2880,60,90),steel,S.x,top+900,gz);
    add(new THREE.BoxGeometry(2700,6,20),accentMat,S.x,top+866,gz);
    add(new THREE.BoxGeometry(160,90,140),darkS,S.x+R(-600,600),top+840,gz);
  }
  // hangars along both sides, doors facing the pad
  for(const s of[-1,1])for(const hz of[S.z-1200,S.z+1100]){
    add(new THREE.BoxGeometry(460,260,820),darkS,S.x+s*1640,top+130,hz);
    add(new THREE.BoxGeometry(8,200,640),new THREE.MeshStandardMaterial({color:C(0x161a1e),roughness:.6}),S.x+s*1408,top+100,hz);
    add(new THREE.BoxGeometry(6,8,660),accentMat,S.x+s*1404,top+206,hz);
    add(new THREE.BoxGeometry(480,10,840),steel,S.x+s*1640,top+265,hz);
  }
  // fuel farm and control tower near the shore
  for(let k=0;k<6;k++)add(new THREE.CylinderGeometry(70,70,170,20),new THREE.MeshStandardMaterial({color:C(0xd9dde1),roughness:.5,metalness:.3}),S.x-1550+(k%3)*170,top+85,S.z-2250+((k/3)|0)*170);
  add(new THREE.CylinderGeometry(26,34,320,12),steel,S.x+1500,top+160,S.z-2200);
  add(new THREE.CylinderGeometry(80,60,50,16),towerMat,S.x+1500,top+345,S.z-2200);
  add(new THREE.CylinderGeometry(82,82,8,16),accentMat,S.x+1500,top+322,S.z-2200);
  for(const p of yardPads){add(new THREE.BoxGeometry(240,2,440),darkS,p.x,top+1,p.z);for(const s of[-1,1])add(new THREE.BoxGeometry(4,1,440),accentMat,p.x+s*118,top+2.2,p.z);}
  // perimeter beacons
  const pts=[];for(let k=0;k<=24;k++){const u=k/24;pts.push(new THREE.Vector3(S.x-S.hx+140,top+12,S.z-S.hz+100+u*(2*S.hz-200)),new THREE.Vector3(S.x+S.hx-140,top+12,S.z-S.hz+100+u*(2*S.hz-200)));}
  const bg=new THREE.BufferGeometry().setFromPoints(pts);
  scene.add(new THREE.Points(bg,new THREE.PointsMaterial({size:60,map:glow,color:C(0x7fe6ff).multiplyScalar(2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
})();

/* ---------- smoke puffs (normal blending so they darken the sky) ---------- */

function emitSprayAt(x,z,rad,n,vs){for(let k=0;k<n;k++){const i=sprayNext;sprayNext=(sprayNext+1)%SPRAY;const a=rng()*6.283,r=R(0,rad);
  sprayPos.set([x+Math.cos(a)*r,2,z+Math.sin(a)*r],i*3);sprayVel.set([Math.cos(a)*R(20,90)*vs,R(80,220)*vs,Math.sin(a)*R(20,90)*vs],i*3);sprayLife[i]=R(3,6);}}

/* ---------- raider fighters: small black darts with red glow, launched when the shield drops ---------- */

const FIG=fighterGeo(),FN=coarse?28:48,fighters=[];
const figMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.6});
const figGlowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.4,2.4,2.4)});
for(let i=0;i<FN;i++){
  const g=new THREE.Group();g.add(new THREE.Mesh(FIG.geo,figMat),new THREE.Mesh(FIG.glow,figGlowMat));
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff3030).multiplyScalar(3),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
  sp.position.set(0,0,9);sp.scale.setScalar(16);g.add(sp);
  g.scale.setScalar(2.2);g.visible=false;scene.add(g);
  fighters.push({g,sp,pos:g.position,v:new THREE.Vector3(),state:'idle',t:0,tgt:new THREE.Vector3(),cool:0,home:null,spin:0,fx:0});
}
const strikeTowers=towers.filter(T=>T.h>220);
function pickStrikeTarget(f){
  f.chase=mode==='pilot'&&typeof tideP!=='undefined'&&tideP.alive&&rng()<(f.ace?.3:.18)&&f.pos.distanceTo(player)<9000;
  if(f.chase){f.tgt.copy(player);return;}
  const k=rng();
  if(k<.45){const up=strikeTowers.filter(T=>!T.down),T=up.length?pick(up):pick(strikeTowers);f.tgt.set(T.x,3+T.h*R(.45,.95),T.z);}
  else if(k<.7){const g=pick(cannons);f.tgt.set(g.x,g.root.position.y+160,g.z);}
  else{const a=rng()*6.283,r=R(300,1800);f.tgt.set(Math.cos(a)*r,R(200,700),Math.sin(a)*r);}
}
function launchFighters(n,from){
  const lv=(from||capitals).filter(c=>!c.crash&&c.grp.visible);if(!lv.length)return 0;
  const idle=fighters.filter(f=>f.state==='idle').slice(0,Math.max(1,Math.round((n||FN)*DIFF.tide.mob)));
  idle.forEach((f,i)=>{const c=lv[i%lv.length];f.home=c;f.ace=(from&&from!==capitals);
    f.hollow=c.wave===2;f.sp.material.color.copy(C(f.hollow?HOLLOW_GLOW:0xff3030)).multiplyScalar(3);   // the Hollow King's fighters burn purple
    f.pos.copy(shipLocalPoint(c,true));
    const fwd=_bw.set(-Math.sin(c.grp.rotation.y),0,-Math.cos(c.grp.rotation.y));
    f.v.copy(fwd).multiplyScalar(260).add(new THREE.Vector3(R(-60,60),-180,R(-60,60)));
    f.state='launch';f.t=-i*.12;f.cool=R(.5,1.5);f.g.visible=false;});
  return idle.length;
}
function resetFighters(){fighters.forEach(f=>{f.state='idle';f.g.visible=false;});}
const _fd=new THREE.Vector3();
function killFighter(f,byPlayer){
  if(f.state==='dead'||f.state==='idle')return;
  f.state='dead';f.spin=R(4,8)*(rng()<.5?-1:1);f.fx=0;
  boom(f.pos,260,0xfff0c0,.35);boom(f.pos,420,0xff3a1a,.9);puff(f.pos,90,3);
  if(byPlayer){score.fighters++;PG.kill(100,f.pos,byPlayer==='missile'?'missile':'gun');PG.prog('tfighters');if(score.fighters>=10)PG.ach('skyguard');if(byPlayer==='missile')PG.done('tmsl');}
}
function updateFighters(dt,id,phT){
  const retreat=id==='retreat'||id==='calm'||id==='victory'||id==='fallen';
  for(const f of fighters){
    if(f.state==='idle')continue;
    f.t+=dt;
    if(f.state==='launch'){if(f.t<0)continue;f.g.visible=true;f.v.y+=60*dt;f.pos.addScaledVector(f.v,dt);if(f.t>1.1){f.state='attack';pickStrikeTarget(f);}}
    else if(f.state==='attack'||f.state==='return'){
      if(retreat&&f.state==='attack'){f.state='return';f.t=0;}
      if(f.state==='return'){const h=f.home&&f.home.grp.visible&&!f.home.crash?f.home.grp.position:_fd.set(f.pos.x,4000,f.pos.z-8000);f.tgt.copy(h);
        if(f.pos.distanceTo(f.tgt)<400||f.t>14){f.state='idle';f.g.visible=false;continue;}}
      if(f.chase&&f.state==='attack'){if(mode!=='pilot'||!tideP.alive)pickStrikeTarget(f);else f.tgt.copy(player);}
      _fd.subVectors(f.tgt,f.pos);const dist=_fd.length();_fd.normalize();
      if(f.pos.y<80)_fd.y=Math.max(_fd.y,.6);
      const spd=f.state==='return'?720:f.ace?760:620;
      f.v.normalize().lerp(_fd,1-Math.exp(-dt*2.4)).normalize().multiplyScalar(spd);
      f.pos.addScaledVector(f.v,dt);
      if(f.state==='attack'){
        f.cool-=dt;
        if(dist<900&&f.cool<=0&&_fd.dot(_bw.copy(f.v).normalize())>.8){f.cool=(f.ace?R(.12,.24):R(.18,.35))/DIFF.tide.rof;
          const from=f.pos.clone().addScaledVector(f.v,.02),to=f.tgt.clone().add(_bw.set(R(-30,30),R(-20,20),R(-30,30))),chase=f.chase,ace=f.ace;
          if(chase)to.addScaledVector(vel,from.distanceTo(to)/2200*.6);   // lead you a little
          fire(from,to,2200,f.hollow?'hbolt':'fbolt',p=>{boom(p,R(90,160),0xff6a3a,.45);if(rng()<.4)puff(p,R(60,110),3);if(chase&&p.distanceTo(player)<40)hurtTide(ace?4.5:3.2,p);});}
        if(dist<(f.chase?220:160)){
          if(f.chase){f.chase=false;f.tgt.copy(f.pos).addScaledVector(_bw.copy(f.v).normalize(),R(1200,1800));f.tgt.y=Math.max(f.tgt.y+R(-100,300),250);}   // overshoot, then come round again
          else{pickStrikeTarget(f);if(!f.chase)f.tgt.y+=R(150,400);}}
        if((id==='counter'||id==='reinf'||id==='host'||id==='spear')&&Math.hypot(f.pos.x,f.pos.z)<3000&&rng()<dt*(f.ace?.022:.045))killFighter(f,false);
      }
    }else if(f.state==='dead'){
      f.v.y-=160*dt;f.pos.addScaledVector(f.v,dt);f.g.rotation.z+=f.spin*dt;
      f.fx-=dt;if(f.fx<=0){f.fx=.06;boom(f.pos,R(60,120),pick([0xff7a1a,0xffb040]),.5);puff(f.pos,R(40,80),2.5);}
      if(f.pos.y<0){f.state='idle';f.g.visible=false;emitSprayAt(f.pos.x,f.pos.z,30,40,.6);boom(f.pos.clone().setY(4),260,0xffffff,1.1);}
      continue;
    }
    f.g.lookAt(_fd.copy(f.pos).sub(f.v));
  }
}

/* ---------- player weapons: ray hits against capital ships and fighters ---------- */
const score={hull:0,fighters:0,capitals:0,frigates:0};
const _inv=new THREE.Matrix4(),_ro=new THREE.Vector3(),_re=new THREE.Vector3();
function rayHit(o,d,maxD){
  let best=null,bd=maxD;
  for(const c of capitals){
    if(!c.grp.visible||(c.crash&&c.crash.impact))continue;
    const tt=hullRay(c.col,o,d,bd);if(tt>=0&&tt<bd){bd=tt;best={type:'ship',obj:c,dist:bd};}
  }
  for(const P of PURS){if(P.dead||!P.grp.visible)continue;const tt=hullRay(P.col,o,d,bd);if(tt>=0&&tt<bd){bd=tt;best={type:'frigate',obj:P,dist:bd};}}
  {const hh=hostRayHit(o,d,bd);if(hh){bd=hh.dist;best=hh;}}
  for(const f of fighters){
    if(f.state!=='attack'&&f.state!=='return'&&f.state!=='launch')continue;
    _ro.subVectors(f.pos,o);const tca=_ro.dot(d);if(tca<0||tca>bd)continue;
    const d2=_ro.lengthSq()-tca*tca,Rr=55;if(d2<Rr*Rr){bd=tca-Math.sqrt(Rr*Rr-d2);best={type:'fighter',obj:f,dist:bd};}
  }
  if(best)best.point=o.clone().addScaledVector(d,best.dist);
  return best;
}
function playerShot(from,dir,speed,kind,dmg){
  const near=kind==='player'||kind==='zeal',hit=rayHit(from,dir,near?7000:12000);
  const to=hit?hit.point:from.clone().addScaledVector(dir,near?7000:12000);
  fire(from,to,speed,kind,p=>{
    if(!hit){if(p.y<30){emitSprayAt(p.x,p.z,30,30,.6);boom(p.clone().setY(5),300,0xffffff,1);}return;}
    if(hit.type==='fighter'){killFighter(hit.obj,true);return;}
    if(hit.type==='host'){hostHit(hit,p,dmg,kind==='friend'?'cannon':'gun');return;}
    if(hit.type==='frigate'){damagePursuer(hit.obj,dmg,p,kind==='friend'?'cannon':'gun');return;}
    damageCapital(hit.obj,dmg,p,kind==='friend'?'cannon':'gun');
  });
}
// the city's own sea guns wear the capital ships down too (no points for the player)
function aiDamageCapital(c,dmg){
  if(c.crash||!c.grp.visible)return;c.hp=(c.hp==null?c.maxHp:c.hp)-dmg;damageFires(c,c.col,c.hp/c.maxHp);
  if(c.hp<=0){startCrash(c);flashBanner('Sea guns bring down a capital ship');}
}
// player damage to a capital ship: hull tag, fires as it weakens, points, and the kill
function damageCapital(c,dmg,p,how){
  boom(p,dmg>1?700:300,0xfff1c8,.4);boom(p,dmg>1?1300:600,0xff7a26,1.2);if(dmg>1)smoke(p,R(500,900),4);
  if(c.crash)return;
  score.hull++;c.hp=(c.hp==null?c.maxHp:c.hp)-dmg;c.lastHit=performance.now()/1000;PG.add(10,null,false);
  if(how==='cannon'){PG.done('tgun');PG.ach('gunner');}
  damageFires(c,c.col,c.hp/c.maxHp);
  if(c.hp<=0){score.capitals++;startCrash(c);flashBanner('Capital ship destroyed');PG.kill(2500,c.grp.position,how);PG.done('tcap');PG.ach('shipkiller');}
}

/* ---------- city interceptor the player can fly ---------- */

const ITC=interceptorGeo(PG.paint());
const pShip=new THREE.Group();pShip.rotation.order='YXZ';
pShip.add(new THREE.Mesh(ITC.geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.5})),new THREE.Mesh(ITC.glow,new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.2,2.2,2.2)})));
{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x8ae8ff).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.set(0,0,11);sp.scale.setScalar(5);pShip.add(sp);}
pShip.scale.setScalar(1.6);pShip.visible=false;scene.add(pShip);
