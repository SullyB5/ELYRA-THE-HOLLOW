/* Elyra · Chapter 2 · Astraea — the Keeper fleet, the Empty Host, three waves, the loss of the Covenant. */
trMat.uniforms.col.value=C(0xb4cfff);
const ease=k=>{k=clamp(k,0,1);return k*k*(3-2*k);};
const angLerp=(a,b,k)=>{let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*k;};

/* ---------- materials and geometry (built in a fixed order so the random detailing stays the same) ---------- */
const capitalMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.5,metalness:.55,color:C(0x8a8f96)});
const windowMat=new THREE.MeshBasicMaterial({vertexColors:true});
const FG=flagshipGeo(),VAR=[capitalShip(0),capitalShip(1),capitalShip(2)],FIGG=fighterGeo(),ITC=interceptorGeo();
const figMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.6});
const figGlowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.4,2.4,2.4)});
const bomberMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.6,color:C(0x6a5a5a)});
const itcMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.5});
const itcGlowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.2,2.2,2.2)});
function sprite(hex,size,mult){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(hex).multiplyScalar(mult||2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s.scale.setScalar(size);return s;}
const _v1=new THREE.Vector3(),_v2=new THREE.Vector3(),_v3=new THREE.Vector3();

/* ---------- the Keeper flagships ---------- */
const FS=2.2;
function makeFlagship(name,pos,tintHex){
  const grp=new THREE.Group();grp.rotation.order='YXZ';
  const mat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.35,metalness:.5,color:C(tintHex)});
  grp.add(new THREE.Mesh(FG.geo,mat),new THREE.Mesh(FG.glow,new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.8,1.8,1.8)})));
  const eg=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-280,-6,470),new THREE.Vector3(280,-6,470),new THREE.Vector3(0,0,520)]);
  const engMat=new THREE.PointsMaterial({size:300,map:glow,color:C(0x7fe6ff).multiplyScalar(2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  grp.add(new THREE.Points(eg,engMat));grp.scale.setScalar(FS);grp.position.copy(pos);scene.add(grp);
  return{name,grp,mat,engMat,home:pos.clone(),hp:100,alive:true,gun:R(0,1),ph:rng()*6,dead:false,flagship:true};
}
const vigil=makeFlagship('Vigil',new THREE.Vector3(-1100,0,700),0xffffff);
const covenant=makeFlagship('Covenant',new THREE.Vector3(1400,280,1500),0xd8e4ff);
const FLEET=[vigil,covenant];
function flagPoint(F){return F.grp.localToWorld(new THREE.Vector3(R(-300,300),R(-40,90),R(-450,480)));}

/* ---------- the Pathfinder: the lost search ship, broken in two ---------- */
const wreckFires=[];
{const V=VAR[2];for(const half of[0,1]){const g=new THREE.Group();g.add(new THREE.Mesh(V.geo,capitalMat));
  g.scale.setScalar(.22);g.position.set(700+half*260,-220+half*90,-4200-half*180);g.rotation.set(R(-.5,.5),R(0,6),R(-.8,.8));scene.add(g);
  for(let k=0;k<3;k++)wreckFires.push(g.localToWorld(new THREE.Vector3(R(-80,80),R(0,60),R(-400,400))));
  g.userData.spin=new THREE.Vector3(R(-.02,.02),R(-.03,.03),R(-.02,.02));wreckFires.push(g);}}
const wreckParts=wreckFires.filter(o=>o.isObject3D),wreckPts=wreckFires.filter(o=>!o.isObject3D);

/* ---------- player interceptor ---------- */
const pShip=new THREE.Group();pShip.rotation.order='YXZ';
pShip.add(new THREE.Mesh(ITC.geo,itcMat),new THREE.Mesh(ITC.glow,itcGlowMat));
const pEngine=sprite(0x8ae8ff,16);pEngine.position.set(0,0,10);pShip.add(pEngine);
const zealAura=sprite(0xffd27a,60,1.4);zealAura.visible=false;pShip.add(zealAura);
pShip.scale.setScalar(1.6);scene.add(pShip);
const P={pos:pShip.position,vel:new THREE.Vector3(),yaw:0,pitch:0,hull:100,shield:100,lastHit:-99,zeal:0,zealT:0,boost:100,alive:true,respawnT:0,cool:0,barrel:0,trail:0};
function spawnPlayer(){P.pos.copy(vigil.grp.position).add(new THREE.Vector3(0,90,1700));P.vel.set(0,0,-120);P.yaw=0;P.pitch=0;P.hull=100;P.shield=100;P.alive=true;pShip.visible=true;}
spawnPlayer();

/* ---------- wingmen ---------- */
const wing=[];
for(let i=0;i<4;i++){const g=new THREE.Group();g.add(new THREE.Mesh(ITC.geo,itcMat),new THREE.Mesh(ITC.glow,itcGlowMat));const e=sprite(0x8ae8ff,14);e.position.set(0,0,10);g.add(e);
  g.scale.setScalar(1.6);g.position.copy(vigil.grp.position).add(new THREE.Vector3((i-1.5)*140,60+R(-30,30),1900));scene.add(g);
  wing.push({g,pos:g.position,vel:new THREE.Vector3(0,0,-150),tgt:null,cool:R(0,1),call:['Sable','Wren','Kestrel','Ashe'][i]});}

/* ---------- the Empty Host ---------- */
const host=[];   // every live enemy: fighters, bombers, warships
function makeFighter(pos,vel,bomber){
  const g=new THREE.Group();g.add(new THREE.Mesh(FIGG.geo,bomber?bomberMat:figMat),new THREE.Mesh(FIGG.glow,figGlowMat));
  const e=sprite(0xff3030,bomber?28:16,3);e.position.set(0,0,9);g.add(e);
  g.scale.setScalar(bomber?5.2:2.2);g.position.copy(pos);scene.add(g);
  const E={type:bomber?'bomber':'fighter',g,pos:g.position,vel:vel.clone(),hp:bomber?7:2,rad:bomber?110:46,tgt:null,cool:R(.5,1.5),aim:new THREE.Vector3(),state:'arrive',t:0,spin:0,fx:0,dead:false};
  host.push(E);return E;
}
function makeWarship(pos,vi){
  const V=VAR[vi],g=new THREE.Group();g.rotation.order='YXZ';
  g.add(new THREE.Mesh(V.geo,capitalMat),new THREE.Mesh(V.glowGeo,windowMat));
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(V.lights,3));lg.setAttribute('color',new THREE.Float32BufferAttribute(V.lc,3));
  g.add(new THREE.Points(lg,new THREE.PointsMaterial({size:22,map:glow,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
  const eg=new THREE.BufferGeometry().setFromPoints(V.eng);
  g.add(new THREE.Points(eg,new THREE.PointsMaterial({size:200,map:glow,color:C(0xff6a4a).multiplyScalar(2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
  g.scale.setScalar(1.15);g.position.copy(pos);scene.add(g);
  const E={type:'warship',g,pos:g.position,vel:new THREE.Vector3(),hp:150,max:150,W:V.W,cool:R(1,2),launch:R(4,8),state:'arrive',t:0,fx:0,dead:false,station:null};
  host.push(E);return E;
}
const FLEET_C=new THREE.Vector3(150,140,1100);
function planetSpawn(spread){
  const d=_v1.subVectors(FLEET_C,PLANET.c).normalize();
  const side=_v2.set(0,1,0).cross(d).normalize(),up=_v3.crossVectors(d,side).normalize();
  const a=R(-spread,spread),b=R(-spread,spread);
  return PLANET.c.clone().addScaledVector(new THREE.Vector3().copy(d).addScaledVector(side,a).addScaledVector(up,b).normalize(),PLANET.r+250);
}
function killEnemy(E,byPlayer){
  if(E.dead)return;E.dead=true;
  if(E.type==='warship'){E.state='dying';E.t=0;E.fx=0;E.spin=R(-.08,.08);boom(E.pos,2600,0xfff0c0,.7);if(byPlayer){stats.warships++;addZeal(25);}flash(.35);return;}
  E.state='dying';E.t=0;E.spin=R(4,9)*(rng()<.5?-1:1);
  boom(E.pos,E.type==='bomber'?900:380,0xfff0c0,.35);boom(E.pos,E.type==='bomber'?1500:650,0xff4a1a,.9);puff(E.pos,E.type==='bomber'?260:120,3);
  if(byPlayer){if(E.type==='bomber'){stats.bombers++;addZeal(14);}else{stats.fighters++;addZeal(8);}}
}
function damageEnemy(E,dmg,byPlayer,at){
  if(E.dead)return;E.hp-=dmg;
  if(at)boom(at,E.type==='warship'?420:160,0xfff1c8,.3);
  if(E.hp<=0)killEnemy(E,byPlayer);
}

/* ---------- player weapons: aim assist toward the lead point, hits resolved by ray ---------- */
const _inv=new THREE.Matrix4(),_ro=new THREE.Vector3(),_re=new THREE.Vector3();
function rayHit(o,d,maxD){
  let best=null,bd=maxD;
  for(const E of host){if(E.dead)continue;
    if(E.type==='warship'){_inv.copy(E.g.matrixWorld).invert();_ro.copy(o).applyMatrix4(_inv);_re.copy(o).addScaledVector(d,maxD).applyMatrix4(_inv).sub(_ro);
      const hx=E.W*.6+70,hy=120,hz=580;let t0=0,t1=1,ok=true;
      for(const [oa,da,h] of[[_ro.x,_re.x,hx],[_ro.y,_re.y,hy],[_ro.z,_re.z,hz]]){if(Math.abs(da)<1e-9){if(Math.abs(oa)>h){ok=false;break;}continue;}
        let a=(-h-oa)/da,b=(h-oa)/da;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1){ok=false;break;}}
      if(ok&&t0*maxD<bd){bd=t0*maxD;best=E;}continue;}
    _ro.subVectors(E.pos,o);const tca=_ro.dot(d);if(tca<0||tca>bd)continue;const d2=_ro.lengthSq()-tca*tca,Rr=E.rad*1.25;
    if(d2<Rr*Rr){bd=tca-Math.sqrt(Rr*Rr-d2);best=E;}
  }
  return best?{E:best,dist:bd,point:o.clone().addScaledVector(d,bd)}:null;
}
const BOLT_SPEED=5200;
function leadPoint(E,from){const d=E.pos.distanceTo(from),t=d/BOLT_SPEED;return E.pos.clone().addScaledVector(E.vel,t);}
function aimDir(){const cp=Math.cos(P.pitch);return new THREE.Vector3(-Math.sin(P.yaw)*cp,Math.sin(P.pitch),-Math.cos(P.yaw)*cp);}
function playerFire(){
  const zeal=P.zealT>0,side=(P.barrel^=1)?1:-1,from=pShip.localToWorld(new THREE.Vector3(side*6,0,-8));
  let dir=aimDir();
  if(curTarget&&curTarget.type!=='warship'){const lp=leadPoint(curTarget,from),want=lp.clone().sub(from);const dist=want.length();want.normalize();
    if(dist<3200&&want.dot(dir)>Math.cos(.06))dir=want;}
  const hit=rayHit(from,dir,6500),to=hit?hit.point:from.clone().addScaledVector(dir,6500);
  boom(from,zeal?26:18,zeal?0xffd27a:0x9ff4ff,.08);
  fire(from,to,BOLT_SPEED,zeal?'zeal':'player',()=>{if(hit&&!hit.E.dead){stats.hits++;addZeal(.6);damageEnemy(hit.E,zeal?2:1,true,to);}});
}
BK.zeal={len:120,w:3.2,head:46,col:0xffe2a0,bc:0xffd27a};
boltMats.zeal=new THREE.MeshBasicMaterial({color:C(0xffd27a).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
BK.torp={len:160,w:14,head:240,col:0xff5040,bc:0xff3020};
boltMats.torp=new THREE.MeshBasicMaterial({color:C(0xff3020).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
function addZeal(n){if(P.zealT>0)return;P.zeal=Math.min(100,P.zeal+n);}
function hurtPlayer(dmg,at){
  if(!P.alive)return;if(P.zealT>0){boom(at||P.pos,120,0xffd27a,.3);return;}
  P.lastHit=T;const s=Math.min(P.shield,dmg);P.shield-=s;P.hull-=dmg-s;
  boom(at||P.pos,s>=dmg?90:160,s>=dmg?0x7fb6ff:0xff7a3a,.3);shake=Math.min(1,shake+.35);
  if(P.hull<=0)playerDown();
}

/* ---------- waves and story ---------- */
const stats={fighters:0,bombers:0,warships:0,hits:0,deaths:0,t0:0};
const MOB=coarse?.7:1;
const WAVES=[
  {title:'WAVE 1 / 3',sub:'The Empty Host · fighters',fighters:Math.round(16*MOB),bombers:0,warships:0},
  {title:'WAVE 2 / 3',sub:'Bombers inbound · protect the flagships',fighters:Math.round(12*MOB),bombers:Math.round(6*MOB),warships:0},
  {title:'WAVE 3 / 3',sub:'Warships of the Hollow King',fighters:Math.round(10*MOB),bombers:Math.round(4*MOB),warships:2},
];
const SCRIPT={
  intro:[[.5,'Elias Veyr','Michael, form up on the Vigil. The search ships went silent above this world three days ago.'],
         [6.5,'Lt. Michael','Copy, Master Veyr. Scanners show wreckage ahead. It’s the Pathfinder, or what’s left of her.'],
         [12,'Elias Veyr','Then the Word was right to send us. Stay sharp. Something down there is listening.']],
  wake:[[0,'Covenant Command','Energy spike on Astraea! The whole surface is igniting!'],[3.5,'Elias Veyr','The Empty Host. Keepers, guard the flagships. Interceptor wing, weapons free.']],
  break1:[[0,'Elias Veyr','Well flown. Reform. They will not stop at one wave.']],
  w2:[[1,'Covenant Command','Bombers on approach vector! Keep them off our hull!']],
  break2:[[0,'Lt. Michael','They’re still coming, Master. Bigger signatures rising off the surface.']],
  w3:[[1,'Elias Veyr','Warships of the Hollow King. Michael, call on your Zeal. Burn bright.']],
  fall:[[0,'Covenant Command','Massive charge on the surface. It’s targeting the Covenant. Brace!'],[7,'Elias Veyr','Covenant... no. All ships, prepare to jump. Michael, back to the Vigil, now!'],
        [12,'The Hollow King','Run, little Keepers. Run home. We will follow your light.'],[17,'Lt. Michael','Jump drive spooling. Word keep them.']],
};
let phase='intro',phT=0,waveIdx=-1,waveSnap=null,beam=null,said=new Set();
function say(who,txt){$('commsWho').textContent=who;$('commsTxt').textContent=txt;const c=$('comms');c.classList.toggle('enemy',who==='The Hollow King');c.classList.add('on');commsT=6.5;}
let commsT=0,bannerT=0;
function banner(t,s){$('banner').innerHTML=t+(s?'<small>'+s+'</small>':'');$('banner').classList.add('on');bannerT=3.2;}
function runScript(key){for(const [at,who,txt] of SCRIPT[key]||[]){const id=key+at;if(phT>=at&&!said.has(id)){said.add(id);say(who,txt);}}}
function setPhase(p){phase=p;phT=0;}
function startWave(i){
  waveIdx=i;const W=WAVES[i];setPhase('w'+(i+1));banner(W.title,W.sub);
  waveSnap={vigil:vigil.hp,covenant:covenant.hp};
  spawnQueue=[];for(let k=0;k<W.fighters;k++)spawnQueue.push({t:k*.35,type:'f'});
  for(let k=0;k<W.bombers;k++)spawnQueue.push({t:2+k*.9,type:'b'});
  for(let k=0;k<W.warships;k++)spawnQueue.push({t:1+k*4,type:'w'});
}
let spawnQueue=[];
function processSpawns(){
  for(const s of spawnQueue){if(s.done||phT<s.t)continue;s.done=true;
    if(s.type==='w'){const E=makeWarship(planetSpawn(.08),s.vi!=null?s.vi:(rng()*3)|0);E.vel.copy(FLEET_C).sub(E.pos).normalize().multiplyScalar(900);
      E.station=FLEET_C.clone().add(new THREE.Vector3(R(-5000,5000),R(-1200,1800),-R(6500,8500)));}
    else{const p=planetSpawn(.14),v=FLEET_C.clone().sub(p).normalize().multiplyScalar(s.type==='b'?900:1300);makeFighter(p,v,s.type==='b');boom(p,800,0xff5a2a,1);}}
}
function waveClear(){return spawnQueue.every(s=>s.done)&&!host.some(E=>!E.dead);}
function clearHost(){for(const E of host)scene.remove(E.g);host.length=0;}
function restartWave(){clearHost();vigil.hp=Math.max(vigil.hp,waveSnap?waveSnap.vigil:100);covenant.hp=Math.max(covenant.hp,waveSnap?waveSnap.covenant:100);
  spawnPlayer();startWave(waveIdx);banner('WAVE '+(waveIdx+1)+' / 3','Back in the fight');}
function playerDown(){P.alive=false;P.respawnT=3.5;stats.deaths++;pShip.visible=false;
  boom(P.pos,520,0xfff0c0,.5);boom(P.pos,900,0xff6a1a,1.2);puff(P.pos,160,3);flash(.4);
  banner('INTERCEPTOR DOWN',/^w\d$/.test(phase)?'Returning to the Vigil · the wave restarts':'Returning to the Vigil');}
function flashScreen(a){const f=$('flash');f.style.transition='none';f.style.opacity=a;requestAnimationFrame(()=>{f.style.transition='opacity .9s';f.style.opacity=0;});}
function flash(a){flashScreen(a);}

/* ---------- enemy behaviour ---------- */
function pickFighterTarget(){const k=rng();if(k<.5&&P.alive)return'player';if(k<.75)return pick(wing);return pick(FLEET.filter(F=>F.alive));}
function targetPos(t){return t==='player'?P.pos:t.flagship?t.grp.position:t.pos;}
function updateHost(dt){
  for(const E of host){
    if(E.state==='dying'){E.t+=dt;
      if(E.type==='warship'){E.g.rotation.z+=E.spin*dt;E.g.rotation.x+=E.spin*.5*dt;E.pos.addScaledVector(E.vel,dt);E.vel.multiplyScalar(Math.exp(-dt*.3));
        E.fx-=dt;if(E.fx<=0){E.fx=.12;const p=E.g.localToWorld(new THREE.Vector3(R(-E.W*.5,E.W*.5),R(-60,80),R(-450,450)));boom(p,R(500,1100),pick([0xff7a1a,0xff4a10,0xffb040]),R(.7,1.3));puff(p,R(200,380),5);}
        if(E.t>5&&!E.gone){E.gone=true;boom(E.pos,5200,0xfff2d0,1.1);boom(E.pos,4200,0xff7a20,2.6);for(let i=0;i<8;i++)boom(E.pos.clone().add(_v1.set(R(-900,900),R(-500,500),R(-900,900))),R(1500,2600),0xff5a14,R(1.6,3));
          for(let i=0;i<14;i++)puff(E.pos.clone().add(_v1.set(R(-700,700),R(-400,400),R(-700,700))),R(500,900),8);scene.remove(E.g);flash(.25);}
      }else{E.vel.multiplyScalar(Math.exp(-dt*.4));E.pos.addScaledVector(E.vel,dt);E.g.rotation.z+=E.spin*dt;E.fx-=dt;
        if(E.fx<=0){E.fx=.06;boom(E.pos,E.type==='bomber'?200:90,pick([0xff7a1a,0xffb040]),.5);puff(E.pos,E.type==='bomber'?120:60,2.5);}
        if(E.t>1.6&&!E.gone){E.gone=true;boom(E.pos,E.type==='bomber'?1200:500,0xff6a2a,.7);scene.remove(E.g);}}
      continue;}
    E.t+=dt;
    if(E.type==='warship'){
      const to=_v1.subVectors(E.station,E.pos),d=to.length();
      const spd=d>4000?Math.max(120,E.vel.length()*Math.exp(-dt*.25)):Math.max(0,d*.06);
      E.vel.copy(to).normalize().multiplyScalar(spd);E.pos.addScaledVector(E.vel,dt);
      const face=_v2.subVectors(FLEET_C,E.pos);E.g.rotation.y=angLerp(E.g.rotation.y,Math.atan2(-face.x,-face.z),1-Math.exp(-dt*.5));
      if(d<5000){E.cool-=dt;
        if(E.cool<=0){E.cool=R(.35,.8);const tgtF=pick(FLEET.filter(F=>F.alive))||vigil,from=E.g.localToWorld(new THREE.Vector3(R(-E.W*.4,E.W*.4),R(20,90),R(-300,300))),to=flagPoint(tgtF);
          boom(from,240,0xff4d88,.3);fire(from,to,3200,'enemy',p=>{boom(p,420,0x7fe6ff,.4);if(tgtF.alive)tgtF.hp-=.55;});}
        E.launch-=dt;if(E.launch<=0){E.launch=R(9,13);for(let k=0;k<2;k++){const p=E.g.localToWorld(new THREE.Vector3(R(-60,60),-110,R(-200,200)));
          const F=makeFighter(p,_v2.subVectors(FLEET_C,p).normalize().multiplyScalar(500),false);F.state='attack';F.tgt=pickFighterTarget();}}}
      continue;}
    // fighters and bombers
    if(E.state==='arrive'){const d=E.pos.distanceTo(FLEET_C);if(d<7500){E.state='attack';E.tgt=E.type==='bomber'?pick(FLEET.filter(F=>F.alive))||vigil:pickFighterTarget();}
      E.pos.addScaledVector(E.vel,dt);E.g.lookAt(_v1.copy(E.pos).sub(E.vel));continue;}
    if(!E.tgt||(E.tgt.flagship&&!E.tgt.alive)||(E.tgt==='player'&&!P.alive))E.tgt=E.type==='bomber'?pick(FLEET.filter(F=>F.alive))||vigil:pickFighterTarget();
    const tp=targetPos(E.tgt);
    if(E.type==='bomber'){
      // run in to torpedo range, launch, swing wide, repeat
      if(!E.run||E.pos.distanceTo(E.run)<300)E.run=tp.clone().add(_v1.set(R(-1,1),R(-.4,.6),R(-1,1)).normalize().multiplyScalar(R(1600,2400)));
      _v1.subVectors(E.run,E.pos).normalize();
      E.vel.normalize().lerp(_v1,1-Math.exp(-dt*1.2)).normalize().multiplyScalar(330);E.pos.addScaledVector(E.vel,dt);
      E.cool-=dt;const dT=E.pos.distanceTo(tp);
      if(E.cool<=0&&dT<3200){E.cool=R(3.5,5);const F=E.tgt,to=flagPoint(F);
        fire(E.pos.clone(),to,700,'torp',p=>{if(!F.alive)return;F.hp-=3.2;boom(p,900,0xfff0c0,.4);boom(p,1500,0xff5a1a,1.3);puff(p,240,4);shake=Math.min(1,shake+.15);});}
    }else{
      if(!E.pass||E.t>E.passT){E.pass=null;}
      const goal=E.pass||tp;_v1.subVectors(goal,E.pos);const dist=_v1.length();_v1.normalize();
      const spd=E.tgt==='player'?520:460;
      E.vel.normalize().lerp(_v1,1-Math.exp(-dt*2.2)).normalize().multiplyScalar(spd);E.pos.addScaledVector(E.vel,dt);
      E.cool-=dt;
      if(!E.pass&&dist<1700&&E.cool<=0&&_v1.dot(_v2.copy(E.vel).normalize())>.9){E.cool=R(.35,.7);
        const from=E.pos.clone().addScaledVector(E.vel,.03),tgt=E.tgt;
        if(tgt==='player'){const aim=P.pos.clone().addScaledVector(P.vel,dist/2600).add(_v3.set(R(-25,25),R(-25,25),R(-25,25)));
          fire(from,aim,2600,'fbolt',p=>{if(P.alive&&p.distanceTo(P.pos)<55)hurtPlayer(7,p);});}
        else if(tgt.flagship){fire(from,flagPoint(tgt),2600,'fbolt',p=>{boom(p,160,0x7fe6ff,.3);if(tgt.alive)tgt.hp-=.12;});}
        else fire(from,tgt.pos.clone(),2600,'fbolt',()=>{});}
      if(!E.pass&&dist<220){E.pass=E.pos.clone().addScaledVector(E.vel.clone().normalize(),R(1200,2000)).add(_v3.set(R(-600,600),R(-600,600),R(-600,600)));E.passT=E.t+R(2.5,4);}
    }
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
    W.g.lookAt(_v2.copy(W.pos).sub(W.vel));
    W.cool-=dt;
    if(W.tgt&&dist<1600&&W.cool<=0&&_v1.dot(_v2.copy(W.vel).normalize())>.92){W.cool=R(.25,.45);const T0=W.tgt,from=W.pos.clone();
      fire(from,T0.pos.clone(),4200,'player',()=>{if(!T0.dead&&rng()<(T0.type==='bomber'?.18:.32))damageEnemy(T0,T0.type==='bomber'?2:2,false,T0.pos);});}
  }
  for(const F of FLEET){if(!F.alive)continue;F.gun-=dt;
    if(F.gun<=0){F.gun=R(.18,.32);let best=null,bd=4200;for(const E of host){if(E.dead||E.state==='arrive')continue;const d=E.pos.distanceTo(F.grp.position);if(d<bd){bd=d;best=E;}}
      if(best){const from=F.grp.localToWorld(pick(FG.tps).clone()),T0=best;
        fire(from,best.pos.clone().add(_v1.set(R(-80,80),R(-80,80),R(-80,80))),3600,'friend',p=>{boom(p,140,0xffd27a,.3);if(!T0.dead&&rng()<(T0.type==='warship'?.6:.12))damageEnemy(T0,T0.type==='warship'?1:1,false,null);});}}}
}

/* ---------- the fall of the Covenant ---------- */
const beamMat=new THREE.MeshBasicMaterial({color:C(0xff3a1a).multiplyScalar(3),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
const beamMesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,16,1,true).translate(0,.5,0),beamMat);beamMesh.frustumCulled=false;scene.add(beamMesh);
const hulks=[];
function updateFall(dt){
  runScript('fall');
  const src=PLANET.c.clone().add(_v1.subVectors(covenant.grp.position,PLANET.c).normalize().multiplyScalar(PLANET.r));
  if(phT<1.5){planetU.uLight.value=1+phT;}
  if(phT>1.5&&phT<5.5){const k=Math.min(1,(phT-1.5)/.4)*(phT>5?1-(phT-5)/.5:1);beamMat.opacity=k;
    const to=covenant.grp.position,d=src.distanceTo(to);beamMesh.position.copy(src);beamMesh.quaternion.setFromUnitVectors(UP,_v2.subVectors(to,src).normalize());beamMesh.scale.set(260+Math.sin(T*40)*40,d,260);
    if(rng()<dt*14){const p=flagPoint(covenant);boom(p,R(900,1800),pick([0xff7a1a,0xff4a10,0xfff0c0]),R(.6,1.2));puff(p,R(300,500),5);}
    covenant.hp=Math.max(0,covenant.hp-dt*22);shake=Math.min(1,shake+dt);}
  else beamMat.opacity=0;
  if(phT>4&&phT<8.5){covenant.grp.rotation.z+=dt*.05;covenant.grp.rotation.x+=dt*.02;covenant.grp.position.y-=dt*30;
    if(rng()<dt*10){const p=flagPoint(covenant);boom(p,R(1200,2200),pick([0xff7a1a,0xff4a10]),R(.8,1.4));puff(p,R(400,700),6);}}
  if(phT>=8.5&&covenant.alive){covenant.alive=false;covenant.hp=0;const c=covenant.grp.position.clone();
    boom(c,9000,0xffffff,1.2);boom(c,7000,0xfff0c0,2);boom(c,5600,0xff7a20,3.4);flash(.85);shake=1;
    for(let i=0;i<10;i++)boom(c.clone().add(_v1.set(R(-1500,1500),R(-700,700),R(-1500,1500))),R(2200,3600),0xff5a14,R(2,3.6));
    for(let i=0;i<24;i++)puff(c.clone().add(_v1.set(R(-1200,1200),R(-600,600),R(-1200,1200))),R(700,1200),10);
    // two burning halves drift apart
    for(const s of[-1,1]){const g=covenant.grp.clone();g.scale.setScalar(FS*.62);g.position.copy(c).add(_v1.set(s*700,R(-200,200),s*500));scene.add(g);
      hulks.push({g,v:new THREE.Vector3(s*90,R(-40,-10),s*60),w:new THREE.Vector3(R(-.06,.06),R(-.05,.05),s*.07),fx:0});}
    covenant.grp.visible=false;}
  for(const H of hulks){H.g.position.addScaledVector(H.v,dt);H.g.rotation.x+=H.w.x*dt;H.g.rotation.y+=H.w.y*dt;H.g.rotation.z+=H.w.z*dt;
    H.fx-=dt;if(H.fx<=0){H.fx=.18;const p=H.g.localToWorld(new THREE.Vector3(R(-260,260),R(-30,80),R(-420,460)));boom(p,R(500,900),pick([0xff7a1a,0xff4a10]),.9);puff(p,R(300,500),6);}}
  for(const E of host)if(!E.dead&&phT>9)E.state='attack';
  if(phT>20){setPhase('jump');}
}
function updateJump(dt){
  // star-streak: widen the view and rush forward, then white out
  camera.fov=70+ease(phT/3)*55;camera.updateProjectionMatrix();
  if(phT>2.6&&!said.has('jumpflash')){said.add('jumpflash');flash(1);}
  if(phT>3.2&&$('end').hidden){showEnd(true);}
}
function showEnd(win){
  const mins=Math.floor((T-stats.t0)/60),secs=Math.floor((T-stats.t0)%60);
  $('endT').textContent=win?'CHAPTER COMPLETE':'MISSION FAILED';
  $('endP').textContent=win?`The Covenant is lost, but the Vigil jumps for Elyra with the Host on its heels. Fighters downed ${stats.fighters} · bombers ${stats.bombers} · warships ${stats.warships} · time ${mins}:${String(secs).padStart(2,'0')}.`:'The Vigil has fallen.';
  $('end').hidden=false;if(document.exitPointerLock)try{document.exitPointerLock();}catch(_){}
}
$('endRetry').addEventListener('click',()=>location.reload());

/* ---------- director ---------- */
function director(dt){
  phT+=dt;
  if(phase==='intro'){runScript('intro');if(phT>16)setPhase('wake');}
  else if(phase==='wake'){runScript('wake');planetU.uLight.value=ease(phT/4);if(phT>7){stats.t0=T;startWave(0);}}
  else if(/^w\d$/.test(phase)){
    processSpawns();if(phase==='w2')runScript('w2');if(phase==='w3')runScript('w3');
    const done=P.alive&&(waveClear()||(phase==='w3'&&phT>150));
    if(done){if(waveIdx<2)setPhase('break'+(waveIdx+1));else{setPhase('fall');banner('THE COVENANT','');}}}
  else if(phase==='break1'||phase==='break2'){runScript(phase);if(phT>9)startWave(waveIdx+1);}
  else if(phase==='fall')updateFall(dt);
  else if(phase==='jump')updateJump(dt);
  // flagships: slow bob, damage smoke, the Vigil can be lost
  for(const F of FLEET){if(!F.alive)continue;F.grp.position.y=F.home.y+Math.sin(T*.3+F.ph)*12;
    if(F.hp<60&&rng()<dt*(60-F.hp)*.05){const p=flagPoint(F);boom(p,R(200,400),pick([0xff7a1a,0xff4a10]),.6);puff(p,R(200,320),4);}
    if(F===covenant&&phase!=='fall')F.hp=Math.max(F.hp,6);}
  if(vigil.hp<=0&&$('end').hidden&&phase!=='jump'){vigil.hp=0;banner('THE VIGIL IS FALLING','The wave restarts');restartWave();}
}

/* ---------- controls ---------- */
const keys={},joy={x:0,y:0,bx:0,by:0};let fireHeld=false,boostHeld=false,shake=0;
addEventListener('keydown',e=>{keys[e.code]=true;if(/^(Arrow|Space)/.test(e.code))e.preventDefault();if(e.code==='KeyZ')useZeal();dismissHint();});
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
cv.addEventListener('mousedown',e=>{if(e.button===2){e.preventDefault();fireHeld=true;}});
addEventListener('mouseup',e=>{if(e.button===2)fireHeld=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
function hold(el,set){const on=e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}set(true);el.classList.add('on');};const off=()=>{set(false);el.classList.remove('on');};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);el.addEventListener('contextmenu',e=>e.preventDefault());}
hold($('fire'),v=>fireHeld=v);hold($('boost'),v=>boostHeld=v);
$('zeal').addEventListener('click',()=>{useZeal();$('zeal').blur();});
function useZeal(){if(P.zeal<100||P.zealT>0||!P.alive)return;P.zealT=8;P.zeal=0;P.shield=100;zealAura.visible=true;banner('ZEAL','The Word burns bright');flash(.2);}
if(!coarse){$('fire').hidden=true;$('boost').hidden=true;}

/* ---------- player flight ---------- */
const _f=new THREE.Vector3(),_r=new THREE.Vector3(),_u=new THREE.Vector3(),_cam=new THREE.Vector3(),_camT=new THREE.Vector3();
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
  // keep clear of the flagships' hulls
  for(const F of FLEET){if(!F.alive)continue;_inv.copy(F.grp.matrixWorld).invert();_ro.copy(P.pos).applyMatrix4(_inv);
    if(Math.abs(_ro.x)<360&&Math.abs(_ro.y)<120&&Math.abs(_ro.z)<720){const push=_v2.copy(P.pos).sub(F.grp.position).normalize();P.pos.addScaledVector(push,400*dt);P.vel.addScaledVector(push,200*dt);}}
  const bank=clamp(-(P.vel.dot(_r))*.004+s*-.3,-.8,.8);
  pShip.rotation.set(P.pitch,P.yaw,bank);
  P.cool-=dt;if(fireHeld&&P.cool<=0){P.cool=P.zealT>0?.06:.11;playerFire();}
  if(T-P.lastHit>3)P.shield=Math.min(100,P.shield+14*dt);
  if(P.zealT>0){P.zealT-=dt;if(P.zealT<=0)zealAura.visible=false;}
  pEngine.scale.setScalar(boosting?30:16);
  P.trail-=dt;if(P.trail<=0){P.trail=boosting?.025:.05;puff(pShip.localToWorld(_v2.set(0,0,12)),boosting?10:6,1.2);}
}
function stepCamera(dt){
  _camT.copy(P.pos).addScaledVector(_f,-48).addScaledVector(_u,13);
  _cam.lerp(_camT,1-Math.exp(-dt*10));if(_cam.lengthSq()===0)_cam.copy(_camT);
  camera.position.copy(_cam);
  if(shake>0){camera.position.add(_v1.set(R(-1,1),R(-1,1),R(-1,1)).multiplyScalar(shake*6));shake=Math.max(0,shake-dt*1.5);}
  camera.quaternion.setFromEuler(new THREE.Euler(P.pitch-.06,P.yaw,pShip.rotation.z*.25,'YXZ'));
}

/* ---------- HUD ---------- */
let curTarget=null;const hint=$('hint');
hint.textContent=coarse?'Left stick flies · right thumb aims · hold FIRE · BOOST to sprint · ZEAL when charged':'Mouse aims (click to lock) · W/S throttle · A/D strafe · Space/Q up/down · Shift boost · right-click fire · Z for Zeal';
let hintGone=false;function dismissHint(){if(hintGone)return;hintGone=true;setTimeout(()=>hint.classList.add('gone'),2500);}
setTimeout(dismissHint,9000);
const _pr=new THREE.Vector3();
function place(el,x,y){el.style.left=x+'px';el.style.top=y+'px';}
function updateHUD(dt){
  if(commsT>0){commsT-=dt;if(commsT<=0)$('comms').classList.remove('on');}
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').classList.remove('on');}
  // target: enemy closest to the crosshair, else nearest
  const fwd=aimDir();let best=null,bs=-2;
  for(const E of host){if(E.dead||E.state==='dying')continue;_v1.subVectors(E.pos,P.pos);const d=_v1.length();const dot=_v1.normalize().dot(fwd)-d/60000;if(dot>bs){bs=dot;best=E;}}
  curTarget=best;
  const br=$('bracket'),ld=$('lead'),ed=$('edge');
  if(best&&P.alive){
    _pr.copy(best.pos).project(camera);const on=_pr.z<1&&Math.abs(_pr.x)<1&&Math.abs(_pr.y)<1;
    if(on){br.hidden=false;br.classList.toggle('big',best.type==='warship');place(br,(_pr.x*.5+.5)*innerWidth,(-_pr.y*.5+.5)*innerHeight);ed.hidden=true;
      if(best.type!=='warship'){_pr.copy(leadPoint(best,P.pos)).project(camera);ld.hidden=!(_pr.z<1);place(ld,(_pr.x*.5+.5)*innerWidth,(-_pr.y*.5+.5)*innerHeight);}else ld.hidden=true;}
    else{br.hidden=ld.hidden=true;ed.hidden=false;let x=_pr.x,y=_pr.y;if(_pr.z>1){x=-x;y=-y;}const a=Math.atan2(y,x),m=Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));
      place(ed,(Math.cos(a)/m*.44+.5)*innerWidth,(-Math.sin(a)/m*.44+.5)*innerHeight);ed.style.transform=`rotate(${-a+Math.PI/2}rad)`;}
  }else br.hidden=ld.hidden=ed.hidden=true;
  hudT+=dt;if(hudT<.12)return;hudT=0;
  $('shB').style.width=P.shield+'%';$('huB').style.width=Math.max(0,P.hull)+'%';$('zeB').style.width=(P.zealT>0?P.zealT/8*100:P.zeal)+'%';
  $('zealT').textContent=P.zealT>0?'burning':P.zeal>=100?'ready · Z':'charging';$('zeal').disabled=!(P.zeal>=100&&P.zealT<=0);
  $('spd').textContent=Math.round(P.vel.length())+' m/s · boost '+Math.round(P.boost)+'%';
  for(const [F,b,t,p] of[[vigil,'hpV','barV','pctV'],[covenant,'hpC','barC','pctC']]){$(b).style.width=Math.max(0,F.hp)+'%';$(p).textContent=F.alive?Math.max(0,Math.round(F.hp))+'%':'LOST';$(t).classList.toggle('lost',!F.alive);}
  const left=host.filter(E=>!E.dead).length+spawnQueue.filter(s=>!s.done).length;
  if(/^w\d$/.test(phase)){$('waveT').textContent=WAVES[waveIdx].title;$('waveS').textContent=left+' hostile'+(left===1?'':'s')+' · '+WAVES[waveIdx].sub;}
  else if(phase==='intro'){$('waveT').textContent='ASTRAEA ORBIT';$('waveS').textContent='Form up on the Vigil · the Pathfinder wreck is ahead';}
  else if(phase==='wake'){$('waveT').textContent='ASTRAEA IS WAKING';$('waveS').textContent='Energy rising across the surface';}
  else if(phase.startsWith('break')){$('waveT').textContent='REFORM';$('waveS').textContent='Next wave rising';}
  else if(phase==='fall'){$('waveT').textContent='THE COVENANT';$('waveS').textContent=covenant.alive?'Under fire from the surface':'Lost with all hands';}
  else if(phase==='jump'){$('waveT').textContent='JUMP';$('waveS').textContent='Course: Elyra';}
}
let hudT=0;

/* ---------- bloom ---------- */
let composer=null;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader&&THREE.RenderPass&&THREE.ShaderPass){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),gl2=renderer.capabilities.isWebGL2;
  const opts={type:gl2&&renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType};
  const rt=gl2&&THREE.WebGLMultisampleRenderTarget?new THREE.WebGLMultisampleRenderTarget(sz.x,sz.y,opts):new THREE.WebGLRenderTarget(sz.x,sz.y,opts);
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.85,.5,.62));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
function renderFrame(){if(composer){try{composer.render();return;}catch(e){composer=null;}}renderer.render(scene,camera);}

/* ---------- loop ---------- */
function resize(){renderer.setSize(innerWidth,innerHeight);if(composer)composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
let last=performance.now(),T=0;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  planetU.uTime.value=T;
  director(dt);stepPlayer(dt);updateHost(dt);updateAllies(dt);
  updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);
  for(const g of wreckParts){g.rotation.x+=g.userData.spin.x*dt;g.rotation.y+=g.userData.spin.y*dt;g.rotation.z+=g.userData.spin.z*dt;}
  if(rng()<dt*6){const p=pick(wreckPts);boom(p,R(60,140),pick([0xff7a1a,0xffb040]),.6);puff(p,R(60,120),4);}
  stepCamera(dt);
  nebula.position.copy(camera.position);
  sunFlare.position.copy(camera.position).addScaledVector(sunDir,200000);
  updateHUD(dt);
  renderFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
