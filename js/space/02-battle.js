/* Elyra · Archive 02 · The Heralds — over Astraea: the Keeper fleet, the Heralds (the red aliens the Pathfinder named), three waves, the loss of the Covenant.
   The Heralds are not invading: they are running from something. The dialogue lets that show without saying what. */
trMat.uniforms.col.value=C(0xb4cfff);
const ease=k=>{k=clamp(k,0,1);return k*k*(3-2*k);};
const angLerp=(a,b,k)=>{let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*k;};

/* ---------- materials and geometry (built in a fixed order so the random detailing stays the same) ---------- */
const capitalMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.5,metalness:.55,color:C(0x8a8f96)});
const windowMat=new THREE.MeshBasicMaterial({vertexColors:true});
// the aliens of Astraea are red (the Hollow King's ships, seen in Tide City, are purple)
const alienMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.5,metalness:.55,color:new THREE.Color(1.2,.55,.5),emissive:0x2a0604});
const alienWinMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.3,.6,.55)});
const FG=flagshipGeo(),VAR=[capitalShip(0),capitalShip(1),capitalShip(2)],FIGG=fighterGeo(),ITC=interceptorGeo({...interceptorGeo.KEEPER,glass:true}),PITC=interceptorGeo(PG.paint());
const figMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.6});
const figGlowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.4,2.4,2.4)});
const bomberMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.6,color:C(0x6a5a5a)});
const itcMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.5});
const itcGlowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.3,1.3,1.3)});
function sprite(hex,size,mult){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(hex).multiplyScalar(mult||2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s.scale.setScalar(size);return s;}
const _v1=new THREE.Vector3(),_v2=new THREE.Vector3(),_v3=new THREE.Vector3();
// hulls for collision, hit tests and fire placement
const FHULL=buildHull(FG.geo,30,.9,18),VHULL=VAR.map(V=>buildHull(V.geo,12,.9));
// the aliens fly the design sheet's ships: Harrower warships, Wraith-pattern fighters and Void Lancer bombers (js/shared/fleets.js)
const HARR=SHIPKIT.harrower(),HHULL=buildHull(HARR.geo,12,.9),WRA=SHIPKIT.wraith(),LAN=SHIPKIT.lancer();
const alienHullMat=fleetHullMat(panelTex),alienGlowMat=fleetGlowMat(FLEET_RED,2);
let T=0;

/* ---------- the Keeper flagships ---------- */
const FS=3.2;   // (Oct 22: the capital ships read small next to you; about half again bigger)
function makeFlagship(name,pos,tintHex){
  const grp=new THREE.Group();grp.rotation.order='YXZ';
  const mat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.35,metalness:.5,color:C(tintHex)});
  grp.add(new THREE.Mesh(FG.geo,mat),new THREE.Mesh(FG.glow,new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.8,1.8,1.8)})));
  const eg=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-280,-6,470),new THREE.Vector3(280,-6,470),new THREE.Vector3(0,0,520)]);
  const engMat=new THREE.PointsMaterial({size:300,map:glow,color:C(0x7fe6ff).multiplyScalar(2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  grp.add(new THREE.Points(eg,engMat));grp.scale.setScalar(FS);grp.position.copy(pos);scene.add(grp);
  const engPts=grp.children.find(o=>o.isPoints);
  MODELS.swapShip(grp,'vanguard',{ref:FG.geo,tint:tintHex,glow:.12,k:name==='Covenant'?1.15:1}).then(m=>{MODELS.sternGlow(m,[engPts]);engMat.size=140;if(m)refitCollider(F.col,m,30,10);});   // Bryce's Vanguard: the Vigil (the Covenant a little bigger)
  const F={name,grp,mat,engMat,home:pos.clone(),hp:100,alive:true,gun:R(0,1),ph:rng()*6,dead:false,flagship:true};
  F.col=collider(grp,FHULL,()=>F.alive);return F;
}
const vigil=makeFlagship('Vigil',new THREE.Vector3(-1100,0,700),0xffffff);
const covenant=makeFlagship('Covenant',new THREE.Vector3(1400,280,1500),0xd8e4ff);
const FLEET=[vigil,covenant];
function flagPoint(F){return F.grp.localToWorld(hullPoint(F.col));}
const FRIENDLY=[vigil.col,covenant.col];

/* ---------- the Pathfinder debris field: two broken hull halves, wreckage, the lost crew, a flight recorder ---------- */
const DEBRIS_C=new THREE.Vector3(800,-150,-4300);
const wreckParts=[],WRECK=[];
{const V=VAR[2];const wreckG=[];
 // the Pathfinder: one Vanguard-class hull broken in two (Bryce's model, burned dark), once the model is in
 MODELS.swapShip(new THREE.Group(),'vanguard',{ref:V.geo,tint:0x6a645e}).then(m=>{if(!m)return;const hs=MODELS.halves(m,.45);
   wreckG.forEach((g,i)=>{g.children.forEach(o=>o.visible=false);g.add(hs[i]);refitCollider(WRECK[i],hs[i],16,6);});});
 for(const half of[0,1]){const g=new THREE.Group();wreckG.push(g);g.add(new THREE.Mesh(V.geo,capitalMat));
  g.scale.setScalar(.34);g.position.copy(DEBRIS_C).add(new THREE.Vector3(-220+half*520,-90+half*160,-half*320));g.rotation.set(R(-.5,.5),R(0,6),R(-.8,.8));scene.add(g);
  g.userData.spin=new THREE.Vector3(R(-.02,.02),R(-.03,.03),R(-.02,.02));wreckParts.push(g);WRECK.push(collider(g,VHULL[2]));}}
// hull chunks drifting through a field about three kilometres wide
const DEB_N=coarse?70:130;
const debMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({map:panelTex,color:C(0x7a7f88),roughness:.6,metalness:.5}),DEB_N);
const debris=[];
for(let i=0;i<DEB_N;i++){const r=Math.pow(rng(),.6)*1700,a=rng()*6.283,b=R(-.6,.6);
  debris.push({p:DEBRIS_C.clone().add(new THREE.Vector3(Math.cos(a)*Math.cos(b)*r,Math.sin(b)*r*.6,Math.sin(a)*Math.cos(b)*r)),
    s:new THREE.Vector3(R(6,70),R(2,14),R(8,90)),r:new THREE.Euler(rng()*6,rng()*6,rng()*6),w:new THREE.Vector3(R(-.12,.12),R(-.12,.12),R(-.12,.12)),v:new THREE.Vector3(R(-3,3),R(-2,2),R(-3,3))});}
debMesh.frustumCulled=false;scene.add(debMesh);
// the crew: suited bodies tumbling slowly
const bodyGeo=(()=>{const m=new Merger(),suit=C(0xe8ecf1),blue=C(0x2a5a96),visor=C(0xd9b25a),dark=C(0x30363e);
  m.add(boxUV(.9,1.1,.55,2),M(0,.35,0),suit);m.add(boxUV(.95,.25,.6,2),M(0,.05,0),blue);
  m.add(new THREE.SphereGeometry(.34,10,8),M(0,1.15,0),suit);m.add(boxUV(.42,.22,.12,2),M(0,1.17,-.3),visor);
  m.add(boxUV(.7,.6,.35,2),M(0,.45,.42),dark);
  for(const s of[-1,1]){m.add(boxUV(.24,.85,.24,2),M(s*.6,.35,0,0,0,s*.5),suit);m.add(boxUV(.3,1,.3,2),M(s*.24,-.6,0,s*.2,0,0),suit);m.add(boxUV(.32,.22,.4,2),M(s*.24,-1.15,-.05),dark);}
  return m.build();})();
const BODY_N=coarse?14:22;
const bodyMesh=new THREE.InstancedMesh(bodyGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.1}),BODY_N);
const bodies=[];
for(let i=0;i<BODY_N;i++){const h=wreckParts[i%2].position;
  bodies.push({p:h.clone().add(new THREE.Vector3(R(-500,500),R(-200,240),R(-500,500))),r:new THREE.Euler(rng()*6,rng()*6,rng()*6),w:new THREE.Vector3(R(-.3,.3),R(-.3,.3),R(-.3,.3)),v:new THREE.Vector3(R(-2,2),R(-1,1),R(-2,2)),s:R(1.6,2)});}
bodyMesh.frustumCulled=false;scene.add(bodyMesh);
const _dm=new THREE.Matrix4(),_dq=new THREE.Quaternion(),_ds=new THREE.Vector3();
function updateDebris(dt){
  for(let i=0;i<DEB_N;i++){const d=debris[i];d.p.addScaledVector(d.v,dt);d.r.x+=d.w.x*dt;d.r.y+=d.w.y*dt;d.r.z+=d.w.z*dt;debMesh.setMatrixAt(i,_dm.compose(d.p,_dq.setFromEuler(d.r),d.s));}
  debMesh.instanceMatrix.needsUpdate=true;
  for(let i=0;i<BODY_N;i++){const b=bodies[i];b.p.addScaledVector(b.v,dt);b.r.x+=b.w.x*dt;b.r.y+=b.w.y*dt;b.r.z+=b.w.z*dt;bodyMesh.setMatrixAt(i,_dm.compose(b.p,_dq.setFromEuler(b.r),_ds.setScalar(b.s)));}
  bodyMesh.instanceMatrix.needsUpdate=true;
}
// the flight recorder: an orange box with a blinking beacon, somewhere in the field
const recorder=new THREE.Group();
recorder.add(new THREE.Mesh(boxUV(3,2,4,2),new THREE.MeshStandardMaterial({color:C(0xff7a1a),roughness:.5,metalness:.3})));
const recBeacon=sprite(0xff4030,20,3);recorder.add(recBeacon);
recorder.position.copy(DEBRIS_C).add(new THREE.Vector3(R(500,800)*(rng()<.5?-1:1),R(-150,250),R(400,700)));recorder.scale.setScalar(3);scene.add(recorder);
let recorderTaken=false;

/* ---------- player interceptor ---------- */
const pShip=new THREE.Group();pShip.rotation.order='YXZ';
pShip.add(new THREE.Mesh(PITC.geo,itcMat),new THREE.Mesh(PITC.glow,itcGlowMat));MODELS.swapShip(pShip,'interceptor',{ref:PITC.geo,glow:.15});
const pEngine=sprite(PG.paint().glow,5,1.6);pEngine.position.set(0,0,11);pShip.add(pEngine);
const zealAura=sprite(0xffd27a,46,1.1);zealAura.visible=false;pShip.add(zealAura);
pShip.scale.setScalar(1.6);scene.add(pShip);
const P={pos:pShip.position,vel:new THREE.Vector3(),yaw:0,pitch:0,hull:100,shield:100,lastHit:-99,zeal:0,zealT:0,boost:100,alive:true,respawnT:0,cool:0,barrel:0,trail:0,
  msl:6,mslT:0,mslCool:0,zeals:0,waveHurt:false};
function spawnPlayer(){P.pos.copy(vigil.grp.position).add(new THREE.Vector3(0,140,2500));P.vel.set(0,0,-120);P.yaw=0;P.pitch=0;P.hull=100;P.shield=100;P.alive=true;P.msl=6;pShip.visible=true;}
spawnPlayer();

/* ---------- wingmen ---------- */
const wing=[];
for(let i=0;i<7;i++){const g=new THREE.Group();const m0=new THREE.Mesh(ITC.geo,itcMat),m1=new THREE.Mesh(ITC.glow,itcGlowMat);g.add(m0,m1);MODELS.swapShip(g,'raven',{ref:ITC.geo,glow:.15,hide:[m0,m1]});addPilot(g);const e=sprite(0x8ae8ff,5,1.6);e.position.set(0,0,11);g.add(e);
  g.scale.setScalar(3.2);g.position.copy(vigil.grp.position).add(new THREE.Vector3((i-3)*200,90+R(-30,30),2500+Math.abs(i-3)*80));scene.add(g);   // (twice the size they were)
  wing.push({g,pos:g.position,vel:new THREE.Vector3(0,0,-150),tgt:null,cool:R(0,1),call:['Sable','Wren','Kestrel','Ashe','Vesper','Rook','Tamsin'][i]});}

/* ---------- the aliens of Astraea (unknown, destructive; the Hollow King cheers them on from Elyra) ---------- */
const host=[];   // every live enemy: fighters, bombers, warships
const WNAMES=['Maw','Thorn','Gorge','Lurker','Ravager','Shroud'];let wCount=0;
function makeFighter(pos,vel,bomber){
  const K=bomber?LAN:WRA,g=new THREE.Group();g.add(new THREE.Mesh(K.geo,alienHullMat),new THREE.Mesh(K.glow,alienGlowMat));if(!bomber)MODELS.swapShip(g,'wraith',{ref:K.geo,tint:0xff6a5a,glow:.2});   // the Heralds fly a red copy of the Wraith
  const e=sprite(FLEET_RED,bomber?28:16,3);e.position.set(0,0,9);g.add(e);
  g.scale.setScalar(bomber?10.4:4.4);g.position.copy(pos);scene.add(g);   // (twice the size they were)
  const E={type:bomber?'bomber':'fighter',g,pos:g.position,vel:vel.clone(),hp:bomber?7:2,rad:bomber?220:92,tgt:null,cool:R(.5,1.5),state:'arrive',t:0,spin:0,fx:0,dead:false,lastHit:-99};
  host.push(E);return E;
}
function makeWarship(pos,vi){
  const V=HARR,g=new THREE.Group();g.rotation.order='YXZ';
  g.add(new THREE.Mesh(V.geo,alienHullMat),new THREE.Mesh(V.glowGeo,alienGlowMat));
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(V.lights,3));lg.setAttribute('color',new THREE.Float32BufferAttribute(V.lc,3));
  const lp=new THREE.Points(lg,new THREE.PointsMaterial({size:22,map:glow,vertexColors:true,color:C(FLEET_RED),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));g.add(lp);
  const eg=new THREE.BufferGeometry().setFromPoints(V.eng);
  const ep=new THREE.Points(eg,new THREE.PointsMaterial({size:200,map:glow,color:C(FLEET_RED).multiplyScalar(2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));g.add(ep);
  MODELS.swapShip(g,'harrower',{ref:V.geo,glow:.18,hide:g.children.filter(o=>o.isMesh)}).then(m=>{MODELS.sternGlow(m,[ep],[lp]);if(m&&E.col)refitCollider(E.col,m,16,6);});
  g.scale.setScalar(1.7);g.position.copy(pos);scene.add(g);
  const E={type:'warship',g,pos:g.position,vel:new THREE.Vector3(),hp:260,max:260,W:V.W,vi,cool:R(1,2),launch:R(4,8),state:'arrive',t:0,fx:0,dead:false,station:null,lastHit:-99,
    name:'Harrower “'+WNAMES[wCount++%WNAMES.length]+'”'};
  E.col=collider(g,HHULL,()=>!E.gone);host.push(E);return E;
}
const FLEET_C=new THREE.Vector3(150,140,1100);
function planetSpawn(spread){
  const d=_v1.subVectors(FLEET_C,PLANET.c).normalize();
  const side=_v2.set(0,1,0).cross(d).normalize(),up=_v3.crossVectors(d,side).normalize();
  const a=R(-spread,spread),b=R(-spread,spread);
  return PLANET.c.clone().addScaledVector(new THREE.Vector3().copy(d).addScaledVector(side,a).addScaledVector(up,b).normalize(),PLANET.r+250);
}
const PTS={fighter:100,bomber:250,warship:2000};
function killEnemy(E,byPlayer,how){
  if(E.dead)return;E.dead=true;
  if(byPlayer){PG.kill(PTS[E.type],E.pos,how);if(E.type==='fighter')PG.prog('fighters40');}
  if(E.type==='warship'){E.state='dying';E.t=0;E.fx=0;E.spin=R(-.08,.08);boom(E.pos,2600,0xfff0c0,.7);if(waveIdx>=0)wKills[waveIdx]++;
    if(byPlayer){stats.warships++;addZeal(25);PG.ach('warbreaker');if(how==='missile')PG.done('warship_m');}flash(.35);return;}
  E.state='dying';E.t=0;E.spin=R(4,9)*(rng()<.5?-1:1);
  boom(E.pos,E.type==='bomber'?900:380,0xfff0c0,.35);boom(E.pos,E.type==='bomber'?1500:650,0xff4a1a,.9);puff(E.pos,E.type==='bomber'?260:120,3);
  if(byPlayer){if(E.type==='bomber'){stats.bombers++;addZeal(14);}else{stats.fighters++;addZeal(8);}}
}
function damageEnemy(E,dmg,byPlayer,at,how){
  if(E.dead)return;E.hp-=dmg;
  if(byPlayer){E.lastHit=T;if(E.type==='warship')PG.add(8,null,false);}
  if(at)boom(at,E.type==='warship'?420:160,0xfff1c8,.3);
  if(E.type==='warship')damageFires(E,E.col,E.hp/E.max);
  if(E.hp<=0)killEnemy(E,byPlayer,how);
}

/* ---------- player weapons: shots converge on the crosshair ---------- */
function rayHit(o,d,maxD){
  let best=null,bd=maxD;
  for(const E of host){if(E.dead)continue;
    if(E.type==='warship'){const t=hullRay(E.col,o,d,bd);if(t>=0&&t<bd){bd=t;best=E;}continue;}
    _v3.subVectors(E.pos,o);const tca=_v3.dot(d);if(tca<0||tca>bd)continue;const d2=_v3.lengthSq()-tca*tca,Rr=E.rad*1.25;
    if(d2<Rr*Rr){bd=tca-Math.sqrt(Rr*Rr-d2);best=E;}
  }
  for(const C of FRIENDLY){const t=hullRay(C,o,d,bd);if(t>=0&&t<bd){bd=t;best='friend';}}
  return best?{E:best==='friend'?null:best,dist:bd,point:o.clone().addScaledVector(d,bd)}:null;
}
const BOLT_SPEED=5200;
function leadPoint(E,from){const d=E.pos.distanceTo(from),t=d/BOLT_SPEED;return E.pos.clone().addScaledVector(E.vel,t);}
function aimDir(){const cp=Math.cos(P.pitch);return new THREE.Vector3(-Math.sin(P.yaw)*cp,Math.sin(P.pitch),-Math.cos(P.yaw)*cp);}
// where the crosshair points: the first thing under it, or 2.6 km out
function crosshairPoint(){const r=crosshairRay(),h=rayHit(r.o,r.d,9000);return h?h.point:r.o.addScaledVector(r.d,2600);}
function playerFire(){
  const zeal=P.zealT>0,side=(P.barrel^=1)?1:-1,from=pShip.localToWorld(new THREE.Vector3(side*4.6,-.55,-3));
  let dir=crosshairPoint().sub(from).normalize();
  // aim assist: if the lead marker sits close to the crosshair, the shot goes to the lead point
  if(curTarget&&curTarget.type!=='warship'){const want=leadPoint(curTarget,from).sub(from);const dist=want.length();want.normalize();
    if(dist<3200&&want.dot(dir)>Math.cos(.05))dir=want;}
  const hit=rayHit(from,dir,6500),to=hit?hit.point:from.clone().addScaledVector(dir,6500);
  boom(from,8,zeal?0xffd27a:0x9ff4ff,.06);
  fire(from,to,BOLT_SPEED,zeal?'zeal':'player',()=>{if(hit&&hit.E&&!hit.E.dead){stats.hits++;addZeal(.6);damageEnemy(hit.E,zeal?2:1,true,to,'gun');}else if(hit)boom(to,60,0x9ff4ff,.2);});
}
BK.player.len=70;BK.player.w=1.8;BK.player.head=22;
BK.zeal={len:90,w:2.4,head:30,col:0xffe2a0,bc:0xffd27a};
boltMats.zeal=new THREE.MeshBasicMaterial({color:C(0xffd27a).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
BK.torp={len:160,w:14,head:240,col:0xff5040,bc:0xff3020};
boltMats.torp=new THREE.MeshBasicMaterial({color:C(0xff3020).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
// missiles: lock the enemy nearest the crosshair, home in, heavy damage
let lockT=null;
function pickLock(){let best=null,bs=Math.cos(.3);for(const E of host){if(E.dead||E.state==='arrive')continue;if(E.pos.distanceTo(P.pos)>7000)continue;
  const s=aimDot(E.pos)+(E===curTarget?.02:0);if(s>bs){bs=s;best=E;}}return best;}
function missileTarget(E){return{pos:()=>E.dead?null:E.pos,hit:p=>E.type==='warship'?hullContains(E.col,p,30):p.distanceTo(E.pos)<E.rad+30};}
function playerMissile(){
  if(!P.alive||P.mslCool>0)return;P.mslCool=MSL_CD;   // unlimited missiles, one every 1.5 s
  const side=(P.barrel^=1)?1:-1,from=pShip.localToWorld(new THREE.Vector3(side*3,-1.4,0)),E=lockT;
  const dir=E?_v1.subVectors(E.pos,from).normalize().lerp(aimDir(),.5).normalize():crosshairPoint().sub(from).normalize();
  fireMissile(from,dir.clone(),2400,E?missileTarget(E):null,p=>{if(E&&!E.dead)damageEnemy(E,E.type==='warship'?32:9,true,p,'missile');});
}
const MSL_CD=1.5;
function addZeal(n){if(P.zealT>0)return;P.zeal=Math.min(100,P.zeal+n);}
function hurtPlayer(dmg,at){if(CUTS.on)return;
  if(!P.alive)return;if(P.zealT>0){boom(at||P.pos,120,0xffd27a,.3);return;}
  P.lastHit=T;const s=Math.min(P.shield,dmg);P.shield-=s;P.hull-=dmg-s;if(dmg-s>0)P.waveHurt=true;
  boom(at||P.pos,s>=dmg?90:160,s>=dmg?0x7fb6ff:0xff7a3a,.3);shake=Math.min(1,shake+.35);
  if(P.hull<=0)playerDown();
}

/* ---------- waves and story ---------- */
const stats={fighters:0,bombers:0,warships:0,hits:0,deaths:0,t0:0};
// difficulty (js/shared/progress.js): Hard is a third fewer enemies and a quarter less damage than the original waves; Insane is the original
const MOB=(coarse?.75:1)*.68*DIFF.space.mob;
const EDMG=DIFF.space.dmg;
const WAVES=[
  {title:'WAVE 1 / 3',sub:'Heralds · fighters',obj:'Defend the fleet',fighters:Math.round(32*MOB),bombers:0,warships:0},
  {title:'WAVE 2 / 3',sub:'Bombers inbound · protect the flagships',obj:'Stop the bombers reaching the flagships',fighters:Math.round(24*MOB),bombers:Math.round(8*MOB),warships:0},
  {title:'WAVE 3 / 3',sub:'Herald warships rising',obj:'Destroy the Herald warships',fighters:Math.round(20*MOB),bombers:Math.round(6*MOB),warships:2},
];
PG.init('astraea',{challenges:[
  {id:'recorder',text:'Recover the Pathfinder flight recorder',pts:1500},
  {id:'fighters40',text:'Down 40 fighters',pts:2000,goal:40},
  {id:'untouched',text:'Clear a wave without losing hull',pts:1000},
  {id:'warship_m',text:'Finish a warship with a missile',pts:1000},
  {id:'vigil60',text:'Keep the Vigil above 60%',pts:2000},
  {id:'nodeath',text:'No interceptor losses',pts:2500},
]});
const SCRIPT={
  // the arrival, the wreck and the order to go are in the opening cutscene (introCut below)
  intro:[],
  found:[[0,'Lt. Michael','I’m in the debris field. She’s broken in two... and the crew. Word keep them.'],
         [6,'Elias Veyr','Her flight recorder is still pinging! Grab it, Michael. We need to know what did this.']],
  rec:[[0,'Lt. Michael','Flight recorder secured!'],[3,'Elias Veyr','Good. Now get back to the fleet, fast. The surface readings are climbing.']],
  late:[[0,'Elias Veyr','Out of time, Michael! Something on the surface is waking. Back to the fleet, now!','alert']],
  wake:[[0,'Covenant Command','Energy spike on Astraea! The whole surface is igniting!','alert'],[3.5,'Elias Veyr','Contacts rising off the surface. The Pathfinder’s Heralds. Keepers, guard the flagships. Interceptor wing, weapons free!','alert']],
  break1:[[0,'Elias Veyr','Good work. Reform on me, fast. They won’t stop at one wave.'],[5,'Lt. Michael','Master, half of those fighters were already damaged when they came up. Scorch marks, missing plates.']],
  w2:[[1,'Covenant Command','Bombers on approach! Keep them off our hull!','alert']],
  break2:[[0,'Lt. Michael','More coming, Master! Bigger signatures rising off the surface!','alert'],[5,'Covenant Command','Their flight paths are all wrong. They are not forming up on us. They are climbing out, toward open space.']],
  w3:[[1,'Elias Veyr','Herald warships! Those hulls are burned black, Michael. Something has been fighting them already. Use your missiles, and call on your Zeal!','alert']],
  fall:[[0,'Covenant Command','Massive charge building on the surface! It’s targeting the Covenant! Brace, brace!','alert'],[7,'Elias Veyr','Covenant, no! All ships, prepare to jump! Michael, back to the Vigil, now!','alert'],
        [12,'The Hollow King','Signal from Elyra, Keepers. I watched your Covenant burn. The Heralds will run to your sky next. They have nowhere else to go.']],
};
let phase='intro',phT=0,waveIdx=-1,waveSnap=null,said=new Set(),found=false,foundT=0,recT=-1,ended=false;
let commsT=0,bannerT=0;
function say(who,txt,dur){$('commsWho').textContent=who;$('commsTxt').textContent=txt;commsT=Math.max(dur||0,who==='The Hollow King'?9:6.5);const c=$('comms');c.classList.toggle('enemy',who==='The Hollow King');c.classList.add('on');}
function banner(t,s){$('banner').innerHTML=t+(s?'<small>'+s+'</small>':'');$('banner').classList.add('on');bannerT=3.2;}
function runScript(key,t){t=t==null?phT:t;for(const [at,who,txt,tone] of SCRIPT[key]||[]){const id=key+at;if(t>=at&&!said.has(id)){said.add(id);say(who,txt,0,tone);}}}
function setPhase(p){phase=p;phT=0;}
let spawnQueue=[];const wKills=[0,0,0];   // warships destroyed in a wave stay destroyed if the wave restarts
function startWave(i){
  waveIdx=i;const W=WAVES[i];setPhase('w'+(i+1));banner(W.title,W.sub);PG.objective(W.obj);
  waveSnap={vigil:vigil.hp,covenant:covenant.hp,score:PG.run.score};P.waveHurt=false;
  spawnQueue=[];for(let k=0;k<W.fighters;k++)spawnQueue.push({t:k*.22,type:'f'});
  for(let k=0;k<W.bombers;k++)spawnQueue.push({t:2+k*.8,type:'b'});
  for(let k=0;k<W.warships-wKills[i];k++)spawnQueue.push({t:1+k*4,type:'w'});
}
function processSpawns(){
  for(const s of spawnQueue){if(s.done||phT<s.t)continue;s.done=true;
    if(s.type==='w'){const E=makeWarship(planetSpawn(.08),(rng()*3)|0);E.vel.copy(FLEET_C).sub(E.pos).normalize().multiplyScalar(900);
      const slot=wCount%3;   // each warship gets its own station so they never park inside one another
      E.station=FLEET_C.clone().add(new THREE.Vector3([-4800,4800,0][slot]+R(-500,500),[0,600,1800][slot]+R(-300,300),-R(6800,8200)));}
    else{const p=planetSpawn(.14),v=FLEET_C.clone().sub(p).normalize().multiplyScalar(s.type==='b'?900:1300);makeFighter(p,v,s.type==='b');boom(p,800,0xff5a2a,1);}}
}
function waveClear(){return spawnQueue.every(s=>s.done)&&!host.some(E=>!E.dead);}
function clearHost(){for(const E of host)scene.remove(E.g);host.length=0;}
function restartWave(){clearHost();vigil.hp=Math.max(vigil.hp,waveSnap?waveSnap.vigil:100);covenant.hp=Math.max(covenant.hp,waveSnap?waveSnap.covenant:100);
  if(waveSnap){PG.run.score=waveSnap.score;PG.add(0,null,false);}
  spawnPlayer();startWave(waveIdx);banner('WAVE '+(waveIdx+1)+' / 3','Back in the fight');}
function playerDown(){P.alive=false;P.respawnT=3.5;stats.deaths++;pShip.visible=false;PG.fail('nodeath');
  boom(P.pos,520,0xfff0c0,.5);boom(P.pos,900,0xff6a1a,1.2);puff(P.pos,160,3);flash(.4);
  banner('INTERCEPTOR DOWN',/^w\d$/.test(phase)?'Returning to the Vigil · the wave restarts':'Returning to the Vigil');}
function flash(a){const f=$('flash');f.style.transition='none';f.style.opacity=a;requestAnimationFrame(()=>{f.style.transition='opacity .9s';f.style.opacity=0;});}

/* ---------- enemy behaviour ---------- */
function pickFighterTarget(){const k=rng();if(k<.5&&P.alive)return'player';if(k<.75)return pick(wing);return pick(FLEET.filter(F=>F.alive));}
function targetPos(t){return t==='player'?P.pos:t.flagship?t.grp.position:t.pos;}
function updateHost(dt){
  for(const E of host){
    if(E.state==='dying'){E.t+=dt;
      if(E.type==='warship'){E.g.rotation.z+=E.spin*dt;E.g.rotation.x+=E.spin*.5*dt;E.pos.addScaledVector(E.vel,dt);E.vel.multiplyScalar(Math.exp(-dt*.3));
        E.fx-=dt;if(E.fx<=0){E.fx=.12;const p=E.g.localToWorld(hullPoint(E.col));boom(p,R(500,1100),pick([0xff7a1a,0xff4a10,0xffb040]),R(.7,1.3));puff(p,R(200,380),5);}
        if(E.t>5&&!E.gone){E.gone=true;boom(E.pos,5200,0xfff2d0,1.1);boom(E.pos,4200,0xff7a20,2.6);for(let i=0;i<8;i++)boom(E.pos.clone().add(_v1.set(R(-900,900),R(-500,500),R(-900,900))),R(1500,2600),0xff5a14,R(1.6,3));
          for(let i=0;i<14;i++)puff(E.pos.clone().add(_v1.set(R(-700,700),R(-400,400),R(-700,700))),R(500,900),8);scene.remove(E.g);flash(.25);}
      }else{E.vel.multiplyScalar(Math.exp(-dt*.4));E.pos.addScaledVector(E.vel,dt);E.g.rotation.z+=E.spin*dt;E.fx-=dt;
        if(E.fx<=0){E.fx=.06;boom(E.pos,E.type==='bomber'?200:90,pick([0xff7a1a,0xffb040]),.5);puff(E.pos,E.type==='bomber'?120:60,2.5);}
        if(E.t>1.6&&!E.gone){E.gone=true;boom(E.pos,E.type==='bomber'?1200:500,0xff6a2a,.7);scene.remove(E.g);}}
      continue;}
    E.t+=dt;
    if(E.type==='warship'){
      // keep clear of the other warships on the way in and at station
      for(const O of host){if(O===E||O.type!=='warship'||O.gone)continue;_v2.subVectors(E.pos,O.pos);const L=_v2.length();if(L<2600&&L>1)E.pos.addScaledVector(_v2.divideScalar(L),(2600-L)*dt*.9);}
      const to=_v1.subVectors(E.station,E.pos),d=to.length();
      const spd=d>4000?Math.max(120,E.vel.length()*Math.exp(-dt*.25)):Math.max(0,d*.06);
      E.vel.copy(to).normalize().multiplyScalar(spd);E.pos.addScaledVector(E.vel,dt);
      const face=_v2.subVectors(FLEET_C,E.pos);E.g.rotation.y=angLerp(E.g.rotation.y,Math.atan2(-face.x,-face.z),1-Math.exp(-dt*.5));
      if(d<5000){E.cool-=dt;
        if(E.cool<=0){E.cool=R(.35,.8);const from=E.g.localToWorld(hullPoint(E.col));
          if(P.alive&&P.pos.distanceTo(E.pos)<3200&&rng()<.35){const aim=P.pos.clone().addScaledVector(P.vel,P.pos.distanceTo(from)/3000).add(_v3.set(R(-40,40),R(-40,40),R(-40,40)));
            boom(from,240,0xff3a2a,.3);fire(from,aim,3000,'enemy',p=>{if(P.alive&&p.distanceTo(P.pos)<55)hurtPlayer(9*EDMG,p);});}
          else{const tgtF=pick(FLEET.filter(F=>F.alive))||vigil,to2=flagPoint(tgtF);
            boom(from,240,0xff3a2a,.3);fire(from,to2,3200,'enemy',p=>{boom(p,420,0x7fe6ff,.4);if(tgtF.alive)tgtF.hp-=.55*EDMG;});}}
        // the warship launches its fighters: a red flare under the hull, and three Wraiths drop out of the bay before they turn to fight
        E.launch-=dt;if(E.launch<=0){E.launch=R(9,13);const bay=E.g.localToWorld(new THREE.Vector3(0,-90,40)),down=E.g.localToWorld(new THREE.Vector3(0,-1,0)).sub(E.g.localToWorld(new THREE.Vector3())).normalize();
          boom(bay,260,0xff5a3a,.5);
          for(let k=0;k<3;k++){const p=bay.clone().add(new THREE.Vector3(R(-60,60),R(-20,20),R(-60,60)));
            const F=makeFighter(p,down.clone().multiplyScalar(220).add(new THREE.Vector3(R(-40,40),0,R(-40,40))),false);F.state='launch';F.lt=1.6+k*.3;F.tgt=pickFighterTarget();}}}
      continue;}
    // fighters and bombers
    if(E.state==='launch'){E.lt-=dt;E.pos.addScaledVector(E.vel,dt);E.vel.multiplyScalar(1+dt*.6);E.g.lookAt(_v1.copy(E.pos).sub(E.vel));if(E.lt<=0)E.state='attack';continue;}
    if(E.state==='arrive'){const d=E.pos.distanceTo(FLEET_C);if(d<7500){E.state='attack';E.tgt=E.type==='bomber'?pick(FLEET.filter(F=>F.alive))||vigil:pickFighterTarget();}
      E.pos.addScaledVector(E.vel,dt);E.g.lookAt(_v1.copy(E.pos).sub(E.vel));continue;}
    if(!E.tgt||(E.tgt.flagship&&!E.tgt.alive)||(E.tgt==='player'&&!P.alive))E.tgt=E.type==='bomber'?pick(FLEET.filter(F=>F.alive))||vigil:pickFighterTarget();
    const tp=targetPos(E.tgt);
    if(E.type==='bomber'){
      if(!E.run||E.pos.distanceTo(E.run)<300)E.run=tp.clone().add(_v1.set(R(-1,1),R(-.4,.6),R(-1,1)).normalize().multiplyScalar(R(1600,2400)));
      _v1.subVectors(E.run,E.pos).normalize();
      E.vel.normalize().lerp(_v1,1-Math.exp(-dt*1.2)).normalize().multiplyScalar(330);E.pos.addScaledVector(E.vel,dt);
      E.cool-=dt;const dT=E.pos.distanceTo(tp);
      if(E.cool<=0&&dT<3200){E.cool=R(3.5,5);const F=E.tgt,to=flagPoint(F);
        fire(E.pos.clone(),to,700,'torp',p=>{if(!F.alive)return;F.hp-=2.2*EDMG;boom(p,900,0xfff0c0,.4);boom(p,1500,0xff5a1a,1.3);puff(p,240,4);shake=Math.min(1,shake+.15);});}
    }else{
      if(!E.pass||E.t>E.passT){E.pass=null;}
      const goal=E.pass||tp;_v1.subVectors(goal,E.pos);const dist=_v1.length();_v1.normalize();
      const spd=E.tgt==='player'?520:460;
      E.vel.normalize().lerp(_v1,1-Math.exp(-dt*2.2)).normalize().multiplyScalar(spd);E.pos.addScaledVector(E.vel,dt);
      E.cool-=dt;
      if(!E.pass&&dist<1700&&E.cool<=0&&_v1.dot(_v2.copy(E.vel).normalize())>.9){E.cool=R(.35,.7);
        const from=E.pos.clone().addScaledVector(E.vel,.03),tgt=E.tgt;
        if(tgt==='player'){const aim=P.pos.clone().addScaledVector(P.vel,dist/2600).add(_v3.set(R(-25,25),R(-25,25),R(-25,25)));
          fire(from,aim,2600,'fbolt',p=>{if(P.alive&&p.distanceTo(P.pos)<52)hurtPlayer(7*EDMG,p);});}
        else if(tgt.flagship){fire(from,flagPoint(tgt),2600,'fbolt',p=>{boom(p,160,0x7fe6ff,.3);if(tgt.alive)tgt.hp-=.12*EDMG;});}
        else fire(from,tgt.pos.clone(),2600,'fbolt',()=>{});}
      if(!E.pass&&dist<220){E.pass=E.pos.clone().addScaledVector(E.vel.clone().normalize(),R(1200,2000)).add(_v3.set(R(-600,600),R(-600,600),R(-600,600)));E.passT=E.t+R(2.5,4);}
    }
    collideHulls(E.pos,E.vel,E.rad*.5,FRIENDLY);
    E.g.lookAt(_v1.copy(E.pos).sub(E.vel));
  }
  for(let i=host.length-1;i>=0;i--)if(host[i].gone)host.splice(i,1);
}

/* ---------- wingmen and flagship guns ---------- */
function liveSmall(){return host.filter(E=>!E.dead&&E.type!=='warship'&&E.state!=='arrive');}
function updateAllies(dt){
  const smalls=liveSmall();
  for(const W of wing){
    if(!W.tgt||W.tgt.dead||rng()<dt*.1)W.tgt=smalls.length?pick(smalls):null;
    const goal=W.tgt?W.tgt.pos:_v1.copy(vigil.grp.position).add(_v2.set(Math.sin(T*.2+W.call.length)*1600,300,Math.cos(T*.2+W.call.length)*1600+900));
    _v1.subVectors(goal,W.pos);const dist=_v1.length();_v1.normalize();
    W.vel.normalize().lerp(_v1,1-Math.exp(-dt*1.8)).normalize().multiplyScalar(W.tgt?480:260);W.pos.addScaledVector(W.vel,dt);
    collideHulls(W.pos,W.vel,20,FRIENDLY);
    W.g.lookAt(_v2.copy(W.pos).sub(W.vel));
    W.cool-=dt;
    if(W.tgt&&dist<1600&&W.cool<=0&&_v1.dot(_v2.copy(W.vel).normalize())>.92){W.cool=R(.3,.5);const T0=W.tgt,from=W.pos.clone();
      fire(from,T0.pos.clone(),4200,'player',()=>{if(!T0.dead&&rng()<(T0.type==='bomber'?.15:.25))damageEnemy(T0,2,false,T0.pos);});}
  }
  for(const F of FLEET){if(!F.alive)continue;F.gun-=dt;
    if(F.gun<=0){F.gun=R(.22,.36);let best=null,bd=4200;for(const E of host){if(E.dead||E.state==='arrive')continue;const d=E.pos.distanceTo(F.grp.position);if(d<bd){bd=d;best=E;}}
      if(best){const from=F.grp.localToWorld(pick(FG.tps).clone()),T0=best;
        fire(from,best.pos.clone().add(_v1.set(R(-80,80),R(-80,80),R(-80,80))),3600,'friend',p=>{boom(p,140,0xffd27a,.3);if(!T0.dead&&rng()<(T0.type==='warship'?.6:.1))damageEnemy(T0,1,false,null);});}}
    // close-in defence: flak turrets along the hull hit anything small inside 2 km hard and often
    F.pd=(F.pd||0)-dt;
    if(F.pd<=0){F.pd=R(.1,.18);const near=host.filter(E=>!E.dead&&E.type!=='warship'&&E.state!=='arrive'&&E.pos.distanceTo(F.grp.position)<2000);
      if(near.length){const T0=pick(near),from=F.grp.localToWorld(pick(FG.tps).clone());
        fire(from,T0.pos.clone().add(_v1.set(R(-40,40),R(-40,40),R(-40,40))),4000,'flak',p=>{boom(p,110,0xffe0a0,.3);puff(p,60,1.6);if(!T0.dead&&rng()<(T0.type==='bomber'?.22:.35))damageEnemy(T0,2,false,null);});}}}
}

/* ---------- the fall of the Covenant ---------- */
const beamMat=new THREE.MeshBasicMaterial({color:C(0xff3a1a).multiplyScalar(3),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
const beamMesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,16,1,true).translate(0,.5,0),beamMat);beamMesh.frustumCulled=false;scene.add(beamMesh);
const hulks=[],_away=new THREE.Vector3();
function updateFall(dt){
  runScript('fall');
  const src=PLANET.c.clone().add(_v1.subVectors(covenant.grp.position,PLANET.c).normalize().multiplyScalar(PLANET.r));
  if(phT<1.5){planetU.uLight.value=1+phT;}
  if(phT>1.5&&phT<5.5){const k=Math.min(1,(phT-1.5)/.4)*(phT>5?1-(phT-5)/.5:1);beamMat.opacity=k;
    const to=covenant.grp.position,d=src.distanceTo(to);beamMesh.position.copy(src);beamMesh.quaternion.setFromUnitVectors(UP,_v2.subVectors(to,src).normalize());beamMesh.scale.set(260+Math.sin(T*40)*40,d,260);
    if(rng()<dt*14){const p=flagPoint(covenant);boom(p,R(900,1800),pick([0xff7a1a,0xff4a10,0xfff0c0]),R(.6,1.2));puff(p,R(300,500),5);}
    covenant.hp=Math.max(0,covenant.hp-dt*22);shake=Math.min(1,shake+dt);}
  else beamMat.opacity=0;
  // the dying Covenant drifts AWAY from the Vigil (never into it)
  const away=_away.subVectors(covenant.grp.position,vigil.grp.position).setY(0).normalize();
  if(phT>4&&phT<8.5){covenant.grp.rotation.z+=dt*.05;covenant.grp.rotation.x+=dt*.02;covenant.grp.position.y-=dt*30;covenant.grp.position.addScaledVector(away,dt*70);
    if(rng()<dt*10){const p=flagPoint(covenant);boom(p,R(1200,2200),pick([0xff7a1a,0xff4a10]),R(.8,1.4));puff(p,R(400,700),6);}}
  if(phT>=8.5&&covenant.alive){covenant.alive=false;covenant.hp=0;const c=covenant.grp.position.clone();
    boom(c,9000,0xffffff,1.2);boom(c,7000,0xfff0c0,2);boom(c,5600,0xff7a20,3.4);flash(.85);shake=1;
    // the secondary blasts are spread over a second and a half (all at once they stalled the game for a moment)
    for(let i=0;i<10;i++)setTimeout(()=>boom(c.clone().add(_v1.set(R(-1500,1500),R(-700,700),R(-1500,1500))),R(2200,3600),0xff5a14,R(2,3.6)),80+i*140);
    for(let i=0;i<10;i++)setTimeout(()=>puff(c.clone().add(_v1.set(R(-1200,1200),R(-600,600),R(-1200,1200))),R(700,1200),10),120+i*150);
    // she breaks in two: bow and stern blown apart on the far side of the blast from the Vigil
    const side=new THREE.Vector3(-away.z,0,away.x),model=covenant.grp.userData.model,parts=model?MODELS.halves(model):null;
    for(const s of[-1,1]){let g;
      if(parts){g=new THREE.Group();g.rotation.copy(covenant.grp.rotation);g.scale.copy(covenant.grp.scale);g.add(parts[s<0?0:1]);}
      else{g=covenant.grp.clone();g.scale.setScalar(FS*.62);}
      g.position.copy(c).addScaledVector(away,300).addScaledVector(side,s*200).add(_v1.set(0,R(-100,100),0));scene.add(g);
      const v=away.clone().multiplyScalar(R(150,190)).addScaledVector(side,s*R(55,75));v.y=R(-40,-10);
      hulks.push({g,v,w:new THREE.Vector3(R(-.06,.06),R(-.05,.05),s*.07),fx:0});FRIENDLY.push(collider(g,FHULL));}
    covenant.grp.visible=false;}
  for(const H of hulks){H.g.position.addScaledVector(H.v,dt);H.g.rotation.x+=H.w.x*dt;H.g.rotation.y+=H.w.y*dt;H.g.rotation.z+=H.w.z*dt;
    H.fx-=dt;if(H.fx<=0){H.fx=.18;const p=H.g.localToWorld(new THREE.Vector3(R(-260,260),R(-30,80),R(-420,460)));boom(p,R(500,900),pick([0xff7a1a,0xff4a10]),.9);puff(p,R(300,500),6);}}
  for(const E of host)if(!E.dead&&phT>9)E.state='attack';
  if(phT>23){setPhase('outro');PG.objective('Jumping for Elyra');outroCut();}
}
const HYPER=makeHyper();
function updateJump(dt){
  camera.fov=70+ease(phT/3)*55;camera.updateProjectionMatrix();HYPER.update(ease(phT/2.4),dt);
  if(phT>2.6&&!said.has('jumpflash')){said.add('jumpflash');flash(1);}
  if(phT>3.2&&!ended)showEnd();
}
/* ---------- cutscenes (js/shared/cutscene.js): the drop into Astraea orbit, and the jump home ---------- */
function introCut(){
  const V=vigil.grp.position;let flashed=false;
  CUTS.play([
    {dur:6,cam:[[V.x-3000,620,V.z+400],[V.x-2500,480,V.z-300]],look:[[V.x,0,V.z-500]],fov:[112,70],small:'Last Transmission · Astraea',cap:'The Heralds',
      say:[[1.8,'Covenant Command','Drop complete! Vigil, Covenant, all wings accounted for. We’re in orbit over Astraea.']],
      fn:(t,dt)=>{if(!flashed){flashed=true;flash(.85);if(typeof sfx!=='undefined')sfx.jump(V);}HYPER.update(Math.max(0,1-t/1.6),dt);}},
    {dur:7,cam:[[V.x+400,1500,V.z+5400],[V.x+300,1100,V.z+4300]],look:[[DEBRIS_C.x,-1500,-16000],[DEBRIS_C.x,-1200,-14000]],
      say:[[.4,'Elias Veyr','Scan everything. The Pathfinder’s last message came from this orbit.'],
           [0,'Covenant Command','Debris field dead ahead, Master! Big pieces... that’s Keeper hull plating.','alert']],fn:(t,dt)=>HYPER.update(0,dt)},
    {dur:7,cam:[[DEBRIS_C.x+1500,DEBRIS_C.y+380,DEBRIS_C.z+1700],[DEBRIS_C.x+950,DEBRIS_C.y+260,DEBRIS_C.z+1150]],look:[[DEBRIS_C.x,DEBRIS_C.y,DEBRIS_C.z]],
      say:[[.4,'Lt. Michael','That’s a hull broken in two... Master, I think that’s the Pathfinder.'],
           [0,'Elias Veyr','Get out there and confirm it, Michael. Stay close to the Vigil. Whatever did this could still be here.']]},
    // the launch climbs up and over the Vigil, however long the shot runs (it used to fly straight into her hull if you watched it through)
    {dur:4,camAt:(u,t,o)=>o.copy(P.pos).add(_v1.set(26-u*10,12,64-u*14)),lookAt:(u,t,o)=>o.copy(P.pos).add(_v1.set(0,0,-260)),
      say:[[.3,'Lt. Michael','Launching! Moving to the wreck now.']],fn:(t,dt)=>{if(t<dt*1.5)spawnPlayer();const up=Math.min(1,t/1.2),hy=P.pos.y-vigil.grp.position.y;
        // climb over the Vigil and level out smoothly before control comes back (it used to snap level at the end)
        P.vel.set(0,330*up*(1-sstep(500,800,hy)),-260);P.pos.addScaledVector(P.vel,dt);pShip.rotation.set(Math.atan2(P.vel.y,260)*.8,0,0);}},
  ],{done:sk=>{HYPER.update(0,0);P.yaw=0;P.pitch=0;pShip.rotation.set(0,0,0);if(sk&&P.pos.y<vigil.grp.position.y+700)P.pos.y=vigil.grp.position.y+700;P.vel.set(0,0,-260);}});
}
function outroCut(){
  const V=vigil.grp.position;let vz=0,jumped=false;const yaw0=FLEET.map(F=>F.grp.rotation.y);
  const turn=u=>FLEET.forEach((F,i)=>{if(F.alive)F.grp.rotation.y=yaw0[i]+Math.PI*ease(u);});
  // the player's interceptor is back aboard the Vigil for this: hide it so it can't park itself in front of the camera,
  // and make sure no hyperspace streaks are left over from the arrival
  const drift=dt=>{pShip.visible=false;HYPER.update(0,dt);for(const H of hulks){H.g.position.addScaledVector(H.v,dt);H.g.rotation.z+=H.w.z*dt;}};
  CUTS.play([
    {dur:12,cam:[[V.x+3300,800,V.z-2600],[V.x+2800,650,V.z-1900]],look:[[V.x,0,V.z]],
      say:[[.4,'Lt. Michael','The Covenant’s gone. All those people, Master... they never had a chance.'],
           [0,'Lt. Michael','And Master, the Heralds never pressed us. Every one of them was climbing for open space. They were running.'],
           [0,'Elias Veyr','Then we need to know from what. But first we warn Elyra, before they lead it to our door.'],
           [0,'Lt. Michael','Master, the Pathfinder’s recorder is still transmitting. I switched it off an hour ago.'],
           [0,'Elias Veyr','Then it isn’t finished talking. Seal it as evidence. We open it together, at home.']],fn:(t,dt)=>drift(dt)},
    // the fleet comes about, nose away from Astraea, while the order is given
    {dur:6,cam:[[V.x-900,400,V.z-2400],[V.x-1300,250,V.z-3000]],look:[[PLANET.c.x,PLANET.c.y+PLANET.r*.6,PLANET.c.z]],
      say:[[.3,'Lt. Michael','Warships breaking orbit! They’re coming after us!','alert'],
           [0,'Elias Veyr','All ships, come about! Jump on my mark! Tide City, raise every gun you have. Mark!','alert']],fn:(t,dt,u)=>{drift(dt);turn(u);}},
    // then they jump away from the planet (toward +z), seen from behind as they go
    {dur:3.4,camAt:(u,t,o)=>o.set(V.x-260,V.y+520,V.z-4300),lookAt:(u,t,o)=>o.set(V.x,V.y+80,V.z+1800),fov:[70,125],
      fn:(t,dt)=>{turn(1);if(!jumped){jumped=true;if(typeof sfx!=='undefined')sfx.jump(V);}vz+=dt*t*2600;for(const F of FLEET)if(F.alive)F.grp.position.z+=vz*dt;
        HYPER.update(ease(t/2.4),dt);if(t>2.6&&!said.has('jumpflash')){said.add('jumpflash');flash(1);}}},
    {dur:3.5,black:true,small:'Next',cap:'The Empty Sky',cam:[[V.x,V.y,V.z+5000]],look:[[V.x,V.y,V.z]],fn:(t,dt)=>HYPER.update(0,dt)},
  ],{done:()=>{if(!ended)showEnd();}});
}
function showEnd(){
  ended=true;
  if(vigil.hp>60){PG.done('vigil60');PG.ach('shepherd');}else PG.fail('vigil60');
  if(!stats.deaths)PG.done('nodeath');
  PG.ach('astraea');
  const mins=Math.floor((T-stats.t0)/60),secs=Math.floor((T-stats.t0)%60);
  PG.finish({title:'THE HERALDS',text:`The Covenant is lost. The Heralds were not attacking: they were running, and now the Vigil jumps for Elyra with them on its heels. Fighters ${stats.fighters} · bombers ${stats.bombers} · warships ${stats.warships} · time ${mins}:${String(secs).padStart(2,'0')}.`,
    buttons:[{text:'Cross the threshold',href:'tide-city.html',primary:true},{text:'Play again',onClick:()=>location.reload()},{text:'Menu',href:'index.html'}]});
}

/* ---------- director ---------- */
function wake(){setPhase('wake');PG.objective('Return to the fleet');}
function director(dt){
  phT+=dt;
  if(phase==='intro'){
    runScript('intro');
    if(!found){PG.objective('Fly to the Pathfinder wreck');if(P.pos.distanceTo(DEBRIS_C)<1500){found=true;foundT=T;PG.add(500,null,'Wreck found');}}
    else{runScript('found',T-foundT);if(!recorderTaken)PG.objective('Recover the flight recorder (optional)');}
    if(recorderTaken&&recT<0)recT=T;
    if(recT>=0)runScript('rec',T-recT);
    if((found&&T-foundT>40)||(recT>=0&&T-recT>7)||(!found&&phT>70)){if(!found)runScript('late',0);wake();}
  }
  else if(phase==='wake'){runScript('wake');planetU.uLight.value=ease(phT/4);if(phT>7){stats.t0=T;startWave(0);}}
  else if(/^w\d$/.test(phase)){
    processSpawns();if(phase==='w2')runScript('w2');if(phase==='w3'){runScript('w3');const w=host.filter(E=>E.type==='warship'&&!E.dead).length+spawnQueue.filter(s=>s.type==='w'&&!s.done).length;PG.objective('Destroy the alien warships · '+w+' left');}
    const done=P.alive&&(waveClear()||(phase==='w3'&&phT>240));
    if(done){PG.add(1000*(waveIdx+1),null,'Wave clear');PG.add(Math.round(vigil.hp)*10,null,false);
      if(!P.waveHurt){PG.done('untouched');PG.ach('untouchable');}
      if(waveIdx<2){setPhase('break'+(waveIdx+1));PG.objective('Reform on the Vigil');}else{setPhase('fall');banner('THE COVENANT','');PG.objective('Protect the Covenant');}}}
  else if(phase==='break1'||phase==='break2'){runScript(phase);if(phT>9)startWave(waveIdx+1);}
  else if(phase==='fall')updateFall(dt);
  else if(phase==='jump')updateJump(dt);
  for(const F of FLEET){if(!F.alive)continue;F.grp.position.y=F.home.y+Math.sin(T*.3+F.ph)*12;
    damageFires(F,F.col,F.hp/100);
    if(F===covenant&&phase!=='fall')F.hp=Math.max(F.hp,6);}
  if(vigil.hp<60&&phase!=='fall'&&phase!=='jump')PG.fail('vigil60');
  if(vigil.hp<=0&&!ended&&phase!=='jump'){vigil.hp=0;banner('THE VIGIL IS FALLING','The wave restarts');restartWave();}
  // the waking planet colours the fill light
  const L=Math.min(1,planetU.uLight.value);planetFill.color.setRGB(.35+.65*L,.42-.12*L,1-.85*L);planetFill.intensity=.5+.9*L;
}

/* ---------- controls ---------- */
const keys={},joy={x:0,y:0,bx:0,by:0};let fireHeld=false,boostHeld=false,shake=0;
addEventListener('keydown',e=>{keys[e.code]=true;if(/^(Arrow|Space)/.test(e.code))e.preventDefault();if(e.code==='KeyZ')useZeal();if(e.code==='KeyF')playerMissile();dismissHint();});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;fireHeld=boostHeld=false;});
const cv=renderer.domElement,ptrs=new Map(),joyEl=$('joy'),knob=$('knob');let joyId=null,lookId=null,locked=false;
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;try{cv.setPointerCapture(e.pointerId);}catch(_){}dismissHint();
  if(joyId===null&&e.clientX<innerWidth*.45){joyId=e.pointerId;joy.bx=e.clientX;joy.by=e.clientY;joyEl.style.left=e.clientX+'px';joyEl.style.top=e.clientY+'px';knob.style.transform='';joyEl.hidden=false;}
  else if(lookId===null)lookId=e.pointerId;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(e.pointerId===joyId){let jx=e.clientX-joy.bx,jy=e.clientY-joy.by;const L=Math.hypot(jx,jy),mx=52;if(L>mx){jx*=mx/L;jy*=mx/L;}joy.x=jx/mx;joy.y=-jy/mx;knob.style.transform=`translate(${jx}px,${jy}px)`;}
  else if(e.pointerId===lookId){P.yaw-=dx*.005;P.pitch=clamp(P.pitch-dy*.005,-1.45,1.45);}});
const endPtr=e=>{if(e.pointerId===joyId){joyId=null;joy.x=joy.y=0;joyEl.hidden=true;}if(e.pointerId===lookId)lookId=null;ptrs.delete(e.pointerId);};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('click',e=>{dismissHint();if(coarse||locked||!cv.requestPointerLock)return;try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(_){}});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===cv;cv.style.cursor=locked?'none':'';});
cv.addEventListener('mousemove',e=>{const k=locked?.0021:.0028;P.yaw-=(e.movementX||0)*k;P.pitch=clamp(P.pitch-(e.movementY||0)*k,-1.45,1.45);});
cv.addEventListener('mousedown',e=>{if(e.button===2){e.preventDefault();fireHeld=true;}else if(e.button===0&&locked)playerMissile();});
addEventListener('mouseup',e=>{if(e.button===2)fireHeld=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
function hold(el,set){const on=e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}set(true);el.classList.add('on');};const off=()=>{set(false);el.classList.remove('on');};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);el.addEventListener('contextmenu',e=>e.preventDefault());}
hold($('fire'),v=>fireHeld=v);hold($('boost'),v=>boostHeld=v);
$('zeal').addEventListener('click',()=>{useZeal();$('zeal').blur();});
SHUD.zealTap(()=>useZeal());   // on a phone, tap the gold shield gem
$('msl').addEventListener('pointerdown',e=>{e.preventDefault();playerMissile();});
function useZeal(){if(P.zeal<100||P.zealT>0||!P.alive)return;P.zealT=8;P.zeal=0;P.shield=100;zealAura.visible=true;banner('ZEAL','The Word burns bright');flash(.2);
  if(++P.zeals>=3)PG.ach('zealot');}
if(!coarse){$('fire').hidden=true;$('boost').hidden=true;$('msl').hidden=true;}

/* ---------- player flight ---------- */
const _f=new THREE.Vector3(),_r=new THREE.Vector3(),_u=new THREE.Vector3(),_cam=new THREE.Vector3(),_camT=new THREE.Vector3();
let solids=[];
function stepPlayer(dt){
  if(!P.alive){P.respawnT-=dt;if(P.respawnT<=0){if(/^w\d$/.test(phase))restartWave();else spawnPlayer();}return;}
  let f=0,s=0,u=0;
  if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD)s+=1;if(keys.KeyA)s-=1;if(keys.Space||keys.KeyE)u+=1;if(keys.KeyQ||keys.KeyC)u-=1;
  if(keys.ArrowLeft)P.yaw+=1.6*dt;if(keys.ArrowRight)P.yaw-=1.6*dt;
  f+=joy.y;s+=joy.x;
  const boosting=(keys.ShiftLeft||keys.ShiftRight||boostHeld)&&P.boost>1;
  P.boost=clamp(P.boost+(boosting?-32:16)*dt,0,100);
  const cp=Math.cos(P.pitch);_f.set(-Math.sin(P.yaw)*cp,Math.sin(P.pitch),-Math.cos(P.yaw)*cp);_r.set(Math.cos(P.yaw),0,-Math.sin(P.yaw));_u.crossVectors(_r,_f);
  const fwd=boosting?820:f>0?430:f<0?40:190;
  const tgt=_v1.copy(_f).multiplyScalar(fwd).addScaledVector(_r,s*170).addScaledVector(_u,u*170);
  P.vel.lerp(tgt,1-Math.exp(-dt*2.4));P.pos.addScaledVector(P.vel,dt);
  const fromC=P.pos.distanceTo(FLEET_C);if(fromC>26000){P.pos.lerp(FLEET_C,dt*.05);if(bannerT<=0)banner('RETURN TO THE FLEET','');}
  // solid hulls: flagships, warships and the wreck push you out; a hard knock costs shield
  const imp=collideHulls(P.pos,P.vel,14,solids);
  if(imp>140)hurtPlayer(Math.min(40,imp*.04),P.pos.clone());
  const bank=clamp(-(P.vel.dot(_r))*.004+s*-.3,-.8,.8);
  pShip.rotation.set(P.pitch,P.yaw,bank);
  P.cool-=dt;if(fireHeld&&P.cool<=0){P.cool=P.zealT>0?.06:.11;playerFire();}
  P.mslCool=Math.max(0,P.mslCool-dt);
  if(T-P.lastHit>3)P.shield=Math.min(100,P.shield+14*dt);
  if(P.zealT>0){P.zealT-=dt;if(P.zealT<=0)zealAura.visible=false;}
  pEngine.scale.setScalar(boosting?10:5);
  P.trail-=dt;if(P.trail<=0){P.trail=boosting?.025:.05;puff(pShip.localToWorld(_v2.set(0,0,12)),boosting?8:5,1.1);}
  if(!recorderTaken&&P.pos.distanceTo(recorder.position)<90){recorderTaken=true;recorder.visible=false;PG.done('recorder');PG.ach('recorder');banner('FLIGHT RECORDER','Recovered');}
}
function stepCamera(dt){
  _camT.copy(P.pos).addScaledVector(_f,-48).addScaledVector(_u,13);
  _cam.lerp(_camT,1-Math.exp(-dt*10));if(_cam.lengthSq()===0)_cam.copy(_camT);
  collideHulls(_cam,null,8,solids);
  camera.position.copy(_cam);
  if(shake>0){camera.position.add(_v1.set(R(-1,1),R(-1,1),R(-1,1)).multiplyScalar(shake*6));shake=Math.max(0,shake-dt*1.5);}
  camera.quaternion.setFromEuler(new THREE.Euler(P.pitch-.06,P.yaw,pShip.rotation.z*.25,'YXZ'));
  camera.updateMatrixWorld();
}

/* ---------- HUD ---------- */
let curTarget=null;const hint=$('hint');
hint.textContent=coarse?'Left stick flies · right thumb aims · hold FIRE · MSL fires a homing missile · ZEAL when charged':'Mouse aims (click to lock) · W/S throttle · A/D strafe · Space/Q up/down · Shift boost · right-click guns · left-click or F missiles · Z Zeal';
let hintGone=false;function dismissHint(){if(hintGone)return;hintGone=true;setTimeout(()=>hint.classList.add('gone'),2500);}
setTimeout(dismissHint,8000);   // on PC it fades by itself too, even if you haven't touched anything
setTimeout(dismissHint,9000);
const _pr=new THREE.Vector3(),lockEl=document.createElement('div');lockEl.className='lockbox';lockEl.hidden=true;document.body.appendChild(lockEl);
function place(el,x,y){el.style.left=x+'px';el.style.top=y+'px';}
function toScreen(p){_pr.copy(p).project(camera);return _pr.z<1&&Math.abs(_pr.x)<1&&Math.abs(_pr.y)<1;}
function placeEdge(el,k){let x=_pr.x,y=_pr.y;if(_pr.z>1){x=-x;y=-y;}const a=Math.atan2(y,x),m=Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));place(el,(Math.cos(a)/m*k+.5)*innerWidth,(-Math.sin(a)/m*k+.5)*innerHeight);return a;}
let hudT=0;
function waypoint(){if(phase!=='intro')return null;if(!found)return DEBRIS_C;if(!recorderTaken)return recorder.position;return vigil.grp.position;}
function updateHUD(dt){
  if(commsT>0){commsT-=dt;if(commsT<=0)$('comms').classList.remove('on');}
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').classList.remove('on');}
  const fwd=aimDir();let best=null,bs=-2;
  for(const E of host){if(E.dead||E.state==='dying')continue;_v1.subVectors(E.pos,P.pos);const d=_v1.length();const dot=_v1.normalize().dot(fwd)-d/60000;if(dot>bs){bs=dot;best=E;}}
  curTarget=best;lockT=P.alive?pickLock():null;
  const br=$('bracket'),ld=$('lead'),ed=$('edge');
  if(best&&P.alive){
    if(toScreen(best.pos)){br.hidden=best.type==='warship';place(br,(_pr.x*.5+.5)*innerWidth,(-_pr.y*.5+.5)*innerHeight);ed.hidden=true;
      if(best.type!=='warship'){_pr.copy(leadPoint(best,P.pos)).project(camera);ld.hidden=!(_pr.z<1);place(ld,(_pr.x*.5+.5)*innerWidth,(-_pr.y*.5+.5)*innerHeight);}else ld.hidden=true;}
    else{br.hidden=ld.hidden=true;ed.hidden=false;const a=placeEdge(ed,.44);ed.style.transform=`rotate(${-a+Math.PI/2}rad)`;}
  }else br.hidden=ld.hidden=ed.hidden=true;
  if(lockT&&toScreen(lockT.pos)){lockEl.hidden=false;place(lockEl,(_pr.x*.5+.5)*innerWidth,(-_pr.y*.5+.5)*innerHeight);}else lockEl.hidden=true;
  // objective waypoint
  const wp=waypoint(),wpEl=$('wp');
  if(wp&&P.alive){$('wpD').textContent=(wp.distanceTo(P.pos)/1000).toFixed(1)+' km';
    if(toScreen(wp))place(wpEl,(_pr.x*.5+.5)*innerWidth,(-_pr.y*.5+.5)*innerHeight);else placeEdge(wpEl,.42);
    wpEl.hidden=false;}else wpEl.hidden=true;
  // ship tags: warships you're shooting or aiming at show name and hull; flagships and wingmen show when you look at them
  // PC: the ship you are hitting (or aiming at) gets the big hull bar at the top centre
  let tb=null;
  for(const E of host)if(!E.dead&&(E.type==='warship'||E.type==='bomber')&&T-E.lastHit<3&&(!tb||E.lastHit>tb.lastHit))tb=E;
  if(!tb&&curTarget&&curTarget.type==='warship'&&aimDot(curTarget.pos)>.96)tb=curTarget;
  const fF=!tb&&FLEET.find(F=>F.alive&&aimDot(F.grp.position)>.985);
  const pc=targetBar(tb?{key:tb,name:tb.type==='warship'?tb.name:'Bomber',kind:'Hostile '+tb.type,frac:tb.hp/(tb.max||7),hostile:true,sub:(tb.pos.distanceTo(P.pos)/1000).toFixed(1)+' km'}:
    fF?{key:fF,name:'The '+fF.name,kind:'Keeper flagship',frac:fF.hp/100,hostile:false,sub:(fF.grp.position.distanceTo(P.pos)/1000).toFixed(1)+' km'}:null,dt);
  tagsBegin();
  for(const E of host){if(E.dead)continue;
    if(E.type==='warship'&&(E===curTarget||T-E.lastHit<4||aimDot(E.pos)>.985))tagShip(E,_v1.copy(E.pos).add(_v2.set(0,330,0)),E.name,E.hp/E.max,true,!pc,T-E.lastHit<.12);
    else if(E.type==='bomber'&&(E===curTarget||T-E.lastHit<2)&&E.pos.distanceTo(P.pos)<5000)tagShip(E,_v1.copy(E.pos).add(_v2.set(0,140,0)),'Bomber',E.hp/7,true,false);}
  for(const F of FLEET)if(F.alive&&aimDot(F.grp.position)>.95)tagShip(F,_v1.copy(F.grp.position).add(_v2.set(0,480,0)),F.name,F.hp/100,false,!pc);
  for(const W of wing)if(aimDot(W.pos)>.997&&W.pos.distanceTo(P.pos)<4000)tagShip(W,_v1.copy(W.pos).add(_v2.set(0,30,0)),W.call,1,false,false);
  if(aimDot(DEBRIS_C)>.97&&P.pos.distanceTo(DEBRIS_C)<9000)tagShip('pf',_v1.copy(wreckParts[0].position).add(_v2.set(0,220,0)),'Pathfinder · lost',1,false,false);
  if(!recorderTaken&&P.pos.distanceTo(recorder.position)<3000)tagShip('rec',_v1.copy(recorder.position).add(_v2.set(0,30,0)),'Flight recorder',1,false,false);
  tagsEnd();
  hudT+=dt;if(hudT<.12)return;hudT=0;
  PG.combat(/^w\d$/.test(phase)||phase==='fall');
  SHUD.update({shield:P.shield,hull:P.hull,zeal:P.zealT>0?P.zealT/8*100:P.zeal,zealText:P.zealT>0?'burning':P.zeal>=100?(coarse?'ready':'ready · Z'):'charging',zealReady:P.zeal>=100&&P.zealT<=0,
    mslReady:1-P.mslCool/MSL_CD,speed:P.vel.length(),unit:'M/S',extra:'BOOST '+Math.round(P.boost)+'%',down:!P.alive});
  $('zeal').disabled=!(P.zeal>=100&&P.zealT<=0);$('msl').disabled=P.mslCool>0;
  for(const [F,b,t,p] of[[vigil,'hpV','barV','pctV'],[covenant,'hpC','barC','pctC']]){$(b).style.width=Math.max(0,F.hp)+'%';$(p).textContent=F.alive?Math.max(0,Math.round(F.hp))+'%':'LOST';$(t).classList.toggle('lost',!F.alive);}
  const left=host.filter(E=>!E.dead).length+spawnQueue.filter(s=>!s.done).length;
  if(/^w\d$/.test(phase)){$('waveT').textContent=WAVES[waveIdx].title;$('waveS').textContent=left+' hostile'+(left===1?'':'s')+' · '+WAVES[waveIdx].sub;}
  else if(phase==='intro'){$('waveT').textContent='ASTRAEA ORBIT';$('waveS').textContent=found?'The Pathfinder debris field':'The Pathfinder wreck is ahead';}
  else if(phase==='wake'){const k=Math.floor(phT*2.2);$('waveT').textContent=phT<4.5?'ASTRAEA':phT<5.5?(k%2?'ASTRAEA':'ASTR∆EA'):'ASTRAEA IS NOT EMPTY';$('waveT').classList.toggle('corrupt',phT>4);
    $('waveS').textContent=(3+Math.min(9,Math.floor(Math.max(0,phT-1.5)/.7)))+' UNKNOWN CONTACTS';}
  else if(phase.startsWith('break')){$('waveT').textContent='REFORM';$('waveS').textContent='Next wave rising';}
  else if(phase==='fall'){$('waveT').textContent='THE COVENANT';$('waveS').textContent=covenant.alive?'Under fire from the surface':'Lost with all hands';}
  else if(phase==='jump'){$('waveT').textContent='JUMP';$('waveS').textContent='Course: Elyra';}
}

/* ---------- bloom ---------- */
let composer=null;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader&&THREE.RenderPass&&THREE.ShaderPass){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),gl2=renderer.capabilities.isWebGL2;
  const opts={type:gl2&&renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType};
  const rt=gl2&&THREE.WebGLMultisampleRenderTarget?new THREE.WebGLMultisampleRenderTarget(sz.x,sz.y,opts):new THREE.WebGLRenderTarget(sz.x,sz.y,opts);
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.75,.45,.7));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
function renderFrame(){if(composer){try{composer.render();return;}catch(e){composer=null;}}renderer.render(scene,camera);}

/* ---------- loop ---------- */
function resize(){renderer.setSize(innerWidth,innerHeight);if(composer)composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
let last=performance.now();
// the loop schedules its next frame before doing any work, so one error can never freeze the game (it is reported once)
let frameErr=0;function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=PG.paused?0:Math.min(.05,(now-last)/1000);last=now;T+=dt;
  planetU.uTime.value=T;
  solids=FRIENDLY.concat(WRECK);for(const E of host)if(E.col)solids.push(E.col);
  const cut=CUTS.update(dt);
  if(!cut){director(dt);stepPlayer(dt);}updateHost(dt);updateAllies(dt);
  updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);updateMissilesP(dt,null);
  updateFires(dt,host.filter(E=>E.type==='warship'&&!E.gone).concat(FLEET.filter(F=>F.alive)),s=>s.col);
  for(const g of wreckParts){g.rotation.x+=g.userData.spin.x*dt;g.rotation.y+=g.userData.spin.y*dt;g.rotation.z+=g.userData.spin.z*dt;}
  if(rng()<dt*6){const i=rng()<.5?0:1,p=wreckParts[i].localToWorld(hullPoint(WRECK[i]));boom(p,R(60,140),pick([0xff7a1a,0xffb040]),.6);puff(p,R(60,120),4);}
  updateDebris(dt);recBeacon.material.opacity=(T*2%1)<.5?1:.15;
  if(!cut)stepCamera(dt);
  nebula.position.copy(camera.position);
  sunFlare.position.copy(camera.position).addScaledVector(sunDir,200000);
  PG.tick(dt);updateHUD(dt);
  renderFrame();
  
}
requestAnimationFrame(frame);
PG.briefing({title:'THE HERALDS',text:'They didn’t come for us. Escort the Vigil to the Pathfinder’s wreck over Astraea, then hold the line when the planet wakes and the Heralds rise. Threat level: '+DIFF.name+'.',objective:'Fly to the Pathfinder wreck (follow the gold marker).',
  pc:[['Mouse','Aim (click the screen to lock the mouse, Esc releases)'],['W / S','Throttle up / down'],['A / D','Slide left / right'],['Space / Q','Up / down'],['Shift','Boost'],['Right-click','Guns (hold)'],['Left-click / F','Homing missile'],['Z','Zeal when the meter is full']],
  phone:[['Left thumb','Fly'],['Right thumb','Aim'],['FIRE','Guns (hold)'],['MSL','Homing missile'],['BOOST','Boost (hold)'],['ZEAL','Zeal when the meter is full']],
  onStart:()=>introCut()});
