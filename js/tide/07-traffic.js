/* Tide City · traffic */
/* ---------- traffic flyers in altitude layers ---------- */
const LAYERS=[{name:'Harbor lane',y:45},{name:'Low traffic',y:120},{name:'Mid traffic',y:230},{name:'Skyway',y:380},{name:'High corridor',y:600},{name:'Upper corridor',y:900}];
const fm=new Merger(),white=C(0xf4f8fb),grey=C(0x6c7884),cyan=C(0x7fdfff);
fm.add(boxUV(3,1.6,12,10),M(0,0,0),white);
fm.add(boxUV(14,.4,3.6,10),M(0,-.2,2),white);
fm.add(boxUV(1.8,1,3,10),M(0,1.1,-1.5),grey);
fm.add(boxUV(.4,2.4,2.2,10),M(0,1.5,4.6),cyan);
for(const s of[-1,1])fm.add(boxUV(1.6,1.2,4,10),M(s*6.4,-.2,3),grey);
const FLY=coarse?160:260;
const flyMesh=new THREE.InstancedMesh(fm.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.3}),FLY);
const flyers=[];
for(let i=0;i<FLY;i++){
  const L=pick(LAYERS),P=rng()<.55?PLATS[0]:pick(PLATS),wide=rng()<.35;
  flyers.push({cx:wide?0:P.x,cz:wide?0:P.z,r:wide?R(900,1700)*CS:R(P.r*.7,P.r+260),y:L.y+R(-12,12),th:rng()*6.283,
    w:(rng()<.5?1:-1)*R(45,110)/(wide?1300:300),s:R(1.6,2.8),bob:rng()*6});
}
scene.add(flyMesh);
const flyGlowPos=new Float32Array(FLY*3),flyGlowGeo=new THREE.BufferGeometry();flyGlowGeo.setAttribute('position',new THREE.BufferAttribute(flyGlowPos,3));
const flyGlow=new THREE.Points(flyGlowGeo,new THREE.PointsMaterial({size:16,map:glow,color:C(0x8ae8ff).multiplyScalar(2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
flyGlow.frustumCulled=false;scene.add(flyGlow);
const _m=new THREE.Matrix4(),_back=new THREE.Vector3();
function updateFlyers(t,dt){
  for(let i=0;i<FLY;i++){const f=flyers[i];f.th+=f.w*dt;
    const x=f.cx+Math.cos(f.th)*f.r,z=f.cz+Math.sin(f.th)*f.r,y=f.y+Math.sin(t*.7+f.bob)*3;
    const sg=Math.sign(f.w),tx=-Math.sin(f.th)*sg,tz=Math.cos(f.th)*sg,yaw=Math.atan2(-tx,-tz);
    _m.copy(mat4(x,y,z,f.s,f.s,f.s,0,yaw,-sg*.22));flyMesh.setMatrixAt(i,_m);
    _back.set(x+tx*-6*f.s,y,z+tz*-6*f.s);flyGlowPos.set([_back.x,_back.y,_back.z],i*3);}
  flyMesh.instanceMatrix.needsUpdate=true;flyGlowGeo.attributes.position.needsUpdate=true;
}

/* ---------- civilian freighters: dark hulls, cyan running lights, coming in over the northern ridge ---------- */

const FRG=freighter();
const civMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.55});
const civGlowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.8,1.8,1.8)});
const civs=[];
for(let i=0;i<8;i++){
  const m=new THREE.Group(),sc=i===0?5.4:R(4.3,5);
  m.add(new THREE.Mesh(FRG.geo,civMat),new THREE.Mesh(FRG.glow,civGlowMat));
  const glowS=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x8ae8ff).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
  glowS.position.set(0,0,60);glowS.scale.setScalar(34);m.add(glowS);
  m.scale.setScalar(sc);m.visible=false;scene.add(m);
  civs.push({m,sc,glowS,S:new THREE.Vector3(),Cc:new THREE.Vector3(),H:new THREE.Vector3(),pad:new THREE.Vector3(),dir:new THREE.Vector3(0,0,1),t0:0,dur:1,state:'idle',pt:0,vel:new THREE.Vector3(),spin:0,fx:0,straggler:i===0});
}
function launchCivs(){
  civs.forEach((c,i)=>{
    const b=c.straggler?-.3:R(-.55,.55),pt=(r,y)=>new THREE.Vector3(Math.sin(b)*r,y,-Math.cos(b)*r);
    c.S.copy(pt(13000,3300));c.Cc.copy(pt(6800,3900));
    if(c.straggler)c.H.copy(pt(3000,420));
    else{c.pad.copy(i<4?pads[i-1]:yardPads[i-4]);c.pad.y+=13*c.sc;c.H.copy(c.pad).setY(c.pad.y+420);}
    c.t0=c.straggler?12:i<4?R(3,7):R(4,9);c.dur=c.straggler?34:i<4?R(26,30):R(30,33);
    c.state='wait';c.m.visible=false;c.pt=0;c.m.rotation.set(0,0,0);c.glowS.visible=true;
  });
}
function bez2(a,b,c,u,out){const v=1-u;return out.set(0,0,0).addScaledVector(a,v*v).addScaledVector(b,2*v*u).addScaledVector(c,u*u);}
const _cv=new THREE.Vector3(),_cv2=new THREE.Vector3();
function civPos(c,u,out){
  if(c.straggler)return bez2(c.S,c.Cc,c.H,u,out);
  if(u<.85)return bez2(c.S,c.Cc,c.H,u/.85,out);
  return out.lerpVectors(c.H,c.pad,ease((u-.85)/.15));
}
function updateCivs(dt,clock){
  for(const c of civs){
    if(c.state==='wait'&&clock>=c.t0){c.state='fly';c.m.visible=true;}
    if(c.state==='fly'){
      const u=Math.min((clock-c.t0)/c.dur,1);
      civPos(c,u,c.m.position);
      if(c.straggler||u<.85){civPos(c,Math.min(u+.004,1),_cv);_cv2.subVectors(_cv,c.m.position);if(_cv2.lengthSq()>1){_cv2.y*=.4;c.dir.copy(_cv2).normalize();}}
      c.m.lookAt(_cv.copy(c.m.position).sub(c.dir));
      c.pt-=dt;if(c.pt<=0&&u<.85){c.pt=.05;puff(_cv2.copy(c.dir).multiplyScalar(-60*c.sc).add(c.m.position),14*c.sc,1.8);}
      if(u>=1&&!c.straggler){c.state='parked';c.glowS.visible=false;}
    }else if(c.state==='fall'||c.state==='slide'){
      c.vel.y-=(c.state==='fall'?50:80)*dt;c.m.position.addScaledVector(c.vel,dt);c.m.rotation.z+=c.spin*dt;
      c.fx-=dt;if(c.fx<=0){c.fx=.05;boom(c.m.position,R(150,300),pick([0xff7a1a,0xffb040]),.6);puff(c.m.position,R(100,180),4);}
      if(c.state==='fall'&&shield.visible&&c.m.position.length()<SHIELD_R+25){
        c.state='slide';const p=c.m.position.clone();
        hitsU[hitIdx].set(p.x,p.y,p.z,shieldMat.uniforms.uTime.value+0.0001);hitIdx=(hitIdx+1)%8;
        boom(p,1500,0xfff2d0,.7);boom(p,2000,0xff6a1a,2);boom(p,1100,0xbff4ff,1);for(let i=0;i<6;i++)puff(p,R(200,340),6);
        spawnDebris(p,8,10,40,180,0);
        c.vel.copy(p).setY(0).normalize().multiplyScalar(40).setY(-20);c.spin*=.4;
      }
      if(c.m.position.y<0){c.state='done';c.m.visible=false;const p=c.m.position.clone().setY(5);
        emitSprayAt(p.x,p.z,140,240,1.3);boom(p,1200,0xffffff,1.8);boom(p,700,0xff8a2a,.8);for(let i=0;i<5;i++)puff(p,R(200,320),6);
        spawnDebris(p,14,12,60,140,4);}
    }
  }
}
function resetCivs(){civs.forEach(c=>{c.state='idle';c.m.visible=false;});}
function shootStraggler(){
  const c=civs[0];if(c.state!=='fly')return;
  const shooter=liveShips().slice().sort((a,b)=>a.grp.position.distanceToSquared(c.m.position)-b.grp.position.distanceToSquared(c.m.position))[0];
  if(!shooter)return;
  const from=shipLocalPoint(shooter,true),to=c.m.position.clone().addScaledVector(c.dir,120*from.distanceTo(c.m.position)/2600);
  boom(from,180,0xff4d88,.35);
  fire(from,to,2600,'enemy',p=>{
    if(c.state!=='fly')return;
    c.state='fall';c.m.position.copy(p);c.glowS.visible=false;
    c.vel.copy(c.dir).setY(0).normalize().multiplyScalar(290).setY(25);c.spin=R(.8,1.4)*(rng()<.5?-1:1);c.fx=0;
    boom(p,900,0xfff2d0,.5);boom(p,1400,0xff6a1a,1.4);
  });
}

/* ---------- early strike: the fleet fires before the shield is up ---------- */
const burners=[];
const coreTowers=towers.filter(T=>Math.hypot(T.x,T.z)<PLATS[0].r-15&&T.h>260).sort((a,b)=>b.h-a.h);
function earlyShot(n){
  const shooter=capitals[0];if(shooter.crash)return;
  const from=shipLocalPoint(shooter,true);let to,onHit;
  if(n<2&&coreTowers[n*2]){const T=coreTowers[n*2];to=new THREE.Vector3(T.x+R(-T.fp*.3,T.fp*.3),3+T.h*R(.62,.9),T.z+R(-T.fp*.3,T.fp*.3));
    onHit=p=>{boom(p,700,0xfff2d0,.5);boom(p,1300,0xff6a1a,1.8);for(let i=0;i<5;i++)puff(p,R(120,220),5);burners.push({p:p.clone(),t:0});};}
  else{const a=rng()*6.283,r=R(PLATS[0].r+20,PLATS[0].r+220);to=new THREE.Vector3(Math.cos(a)*r,2,Math.sin(a)*r);
    onHit=p=>{boom(p,500,0xffffff,1.2);boom(p,600,0xff8a2a,.7);emitSprayAt(p.x,p.z,50,90,1);};}
  boom(from,200,0xff4d88,.35);
  fire(from,to,2400,'enemy',onHit);
}
function updateBurners(dt){
  for(const b of burners){b.t+=dt;const s=b.s||1;
    if(rng()<dt*9)puff(b.p.clone().add(_cv.set(R(-15,15)*s,R(0,20)*s,R(-15,15)*s)),R(110,200)*s,R(5,8)*(s>1?1.5:1));
    if(rng()<dt*5)boom(b.p.clone().add(_cv.set(R(-12,12)*s,R(-8,8)*s,R(-12,12)*s)),R(50,110)*s,pick([0xff7a1a,0xff4a10,0xffb040]),R(.4,.8));}
}
