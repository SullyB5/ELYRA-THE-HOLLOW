/* Tide City · battle */
/* ---------- battle: projectiles, flashes, shield, sea cannons ---------- */


// shield dome
const SHIELD_R=2600;
const hitsU=Array.from({length:8},()=>new THREE.Vector4(0,-99999,0,-99));let hitIdx=0;
const shieldMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,
  uniforms:{uOp:{value:0},uTime:{value:0},hits:{value:hitsU}},
  vertexShader:'varying vec3 vW;varying vec3 vN;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uOp,uTime;uniform vec4 hits[8];varying vec3 vW;varying vec3 vN;
  void main(){vec3 V=normalize(cameraPosition-vW);float fr=pow(1.0-abs(dot(normalize(vN),V)),2.2);
    vec3 p=normalize(vW);float a=atan(p.z,p.x)*60.0,b=asin(clamp(p.y,-1.0,1.0))*60.0;
    float hx=max(smoothstep(.94,1.0,abs(sin(a+b*.5))),max(smoothstep(.94,1.0,abs(sin(a-b*.5))),smoothstep(.94,1.0,abs(sin(b)))));
    float rip=0.0;
    for(int i=0;i<8;i++){float age=uTime-hits[i].w;if(age>0.0&&age<2.2){float d=distance(vW,hits[i].xyz);float rr=age*700.0;
      rip+=(smoothstep(rr-140.0,rr,d)-smoothstep(rr,rr+30.0,d))*(1.0-age/2.2)*1.5+exp(-d/90.0)*max(0.0,1.0-age*1.5)*3.0;}}
    float sweep=smoothstep(.97,1.0,sin(vW.y*.01-uTime*2.0))*.25;
    vec3 col=vec3(.3,.8,1.0)*(fr*1.2+.05+hx*(.16+fr*.5)+sweep)+vec3(.85,.95,1.0)*rip*(.45+hx);
    gl_FragColor=vec4(col*uOp,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`});
const shield=new THREE.Mesh(new THREE.SphereGeometry(SHIELD_R,96,48,0,Math.PI*2,0,Math.PI/2),shieldMat);
shield.visible=false;shield.renderOrder=5;shield.frustumCulled=false;scene.add(shield);
function shieldPointToward(target){
  _bw.set(target.x,0,target.z).normalize();
  const d=new THREE.Vector3(_bw.x+R(-.35,.35),R(.25,.75),_bw.z+R(-.35,.35)).normalize();
  return d.multiplyScalar(SHIELD_R);
}

// sea cannons
const CANNON_R=3400,NC=8,cannons=[];
/* the sea guns in Keeper colours: pearl armour over Keeper-blue machinery, gold trim, cyan light. Rebuilt (Oct 21) with sloped,
   faceted armour instead of stacked boxes, a rounded mantlet, sleeved barrels, and light strips so they read at night.
   Static parts are merged per material, so a gun is about a dozen draw calls instead of seventy. */
const cannonDark=new THREE.MeshStandardMaterial({map:typeof panelTex!=='undefined'?panelTex:null,color:C(0x34476a),roughness:.38,metalness:.6,emissive:C(0x0b1626)});
const cannonLight=new THREE.MeshStandardMaterial({map:typeof panelTex!=='undefined'?panelTex:null,color:C(0xeeeae0),roughness:.32,metalness:.3,emissive:C(0x2a2b31)});
const cannonGold=new THREE.MeshStandardMaterial({color:C(0xe0b860),roughness:.25,metalness:.9,emissive:C(0x3a2606)});
const cannonGlow=new THREE.MeshBasicMaterial({color:C(0x7fe8ff).multiplyScalar(1.6),fog:false});
const cannonRed=new THREE.MeshBasicMaterial({color:C(0xff4a3a).multiplyScalar(1.6)});
const HIDE_Y=-580;
const addPart=(parent,geo,mat,px,py,pz,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.rotation.set(rx,ry,rz);parent.add(m);return m;};
// collect parts, then merge them into one mesh per material (the gun's moving groups each get their own merge)
function cannonParts(){const L=[];L.add=(geo,mat,px,py,pz,rx=0,ry=0,rz=0)=>{L.push({geo,mat,m:M(px,py,pz,rx,ry,rz)});return L;};return L;}
function bakeParts(group,L){const by=new Map();for(const p of L){if(!by.has(p.mat))by.set(p.mat,[]);by.get(p.mat).push(p);}
  for(const [mat,ps] of by){const P=[],N=[],U=[];
    for(const {geo,m} of ps){const g=(geo.index?geo.toNonIndexed():geo.clone());g.applyMatrix4(m);const a=g.attributes;
      P.push(...a.position.array);N.push(...a.normal.array);if(a.uv)U.push(...a.uv.array);else for(let i=0;i<a.position.count;i++)U.push(0,0);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
    g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);group.add(mesh);}}
// a side profile (z forward = -z, y up) pushed out to a width: sloped armour that a box can't give
function slab(profile,width,uvK){const sh=new THREE.Shape();profile.forEach(([z,y],i)=>i?sh.lineTo(z,y):sh.moveTo(z,y));
  const g=new THREE.ExtrudeGeometry(sh,{depth:width,bevelEnabled:true,bevelThickness:4,bevelSize:4,bevelSegments:1});
  g.rotateY(-Math.PI/2);g.translate(width/2,0,0);g.computeVertexNormals();
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/(uvK||160),uv.getY(i)/(uvK||160));return g;}
const CG={   // shared geometry for all eight guns
  column:new THREE.CylinderGeometry(150,190,480,8),band:new THREE.CylinderGeometry(196,196,14,8),rib:new THREE.BoxGeometry(40,320,36),
  ring:new THREE.CylinderGeometry(200,212,40,32),ringGap:new THREE.CylinderGeometry(186,186,10,32),ringTrim:new THREE.TorusGeometry(206,5,6,32),
  // the turret: low sloped glacis at the front, flat roof, a raked back with a bustle
  hull:slab([[-210,20],[-150,150],[40,175],[170,150],[205,60],[190,20]],300),
  cheek:slab([[-170,30],[-120,120],[120,140],[175,100],[180,30]],22),
  roofPlate:slab([[-120,0],[-80,26],[80,26],[110,0]],200),
  stripL:new THREE.BoxGeometry(6,6,200),seam:new THREE.BoxGeometry(306,4,6),stripF:new THREE.BoxGeometry(240,5,5),
  remnant:new THREE.TorusGeometry(46,7,8,6),remnantCore:new THREE.CircleGeometry(30,6),
  mast:new THREE.CylinderGeometry(6,8,120,6),dish:new THREE.SphereGeometry(34,12,6,0,Math.PI*2,0,Math.PI/2.6),lamp:new THREE.SphereGeometry(9,8,6),
  flood:new THREE.BoxGeometry(46,26,20),floodLens:new THREE.PlaneGeometry(38,18),
  // missile pods: armoured, with a sloped cap, six launch cells
  pod:slab([[-90,-58],[-90,40],[-40,62],[90,62],[90,-58]],100),podFace:new THREE.BoxGeometry(92,96,10),cell:new THREE.CylinderGeometry(13,13,6,10),cellRim:new THREE.TorusGeometry(14,2.4,5,12),
  // mantlet and barrels
  mantlet:new THREE.CylinderGeometry(66,66,236,20),mantletCap:new THREE.CylinderGeometry(72,72,8,20),
  sleeve:new THREE.CylinderGeometry(50,46,240,16),barrel:new THREE.CylinderGeometry(32,26,560,16),fin:new THREE.CylinderGeometry(40,40,7,16),
  band2:new THREE.CylinderGeometry(35,35,18,16),brake:new THREE.CylinderGeometry(44,38,120,8),slot:new THREE.BoxGeometry(92,22,24),
  muzzleRing:new THREE.TorusGeometry(31,5,6,20),bore:new THREE.CircleGeometry(20,16),conduit:new THREE.CylinderGeometry(6,6,300,6),
};
for(let i=0;i<NC;i++){
  const a=Math.PI/2+i/NC*Math.PI*2,x=Math.cos(a)*CANNON_R,z=Math.sin(a)*CANNON_R;
  const root=new THREE.Group();root.position.set(x,HIDE_Y,z);
  // armoured octagonal column with buttress ribs and glowing bands
  const base=cannonParts();
  base.add(CG.column,cannonDark,0,-200,0,0,Math.PI/8,0);
  for(const y of[-70,-230])base.add(CG.band,accentMat,0,y,0,0,Math.PI/8,0);
  for(let k=0;k<8;k++){const aa=k/8*Math.PI*2;base.add(CG.rib,cannonLight,Math.cos(aa)*176,-160,Math.sin(aa)*176,0,-aa,0);}
  bakeParts(root,base);
  const yawG=new THREE.Group();yawG.position.y=40;root.add(yawG);
  const T=cannonParts();
  // the bearing ring the turret turns on
  T.add(CG.ring,cannonLight,0,0,0).add(CG.ringGap,cannonGlow,0,-24,0).add(CG.ringTrim,cannonGold,0,20,0,Math.PI/2,0,0);
  // the sloped turret, dark side cheeks, a raised roof plate
  T.add(CG.hull,cannonLight,0,0,30);
  for(const s of[-1,1])T.add(CG.cheek,cannonDark,s*161,0,30);
  T.add(CG.roofPlate,cannonDark,0,175,40);
  for(const zz of[-60,40,120])T.add(CG.seam,cannonDark,0,166+(zz<0?-6:0),zz);
  // cyan light strips along the roof edges and across the glacis, gold trim on the roof plate
  for(const s of[-1,1]){T.add(CG.stripL,cannonGlow,s*146,178,70,-.08,0,0);T.add(CG.stripL,cannonGlow,s*168,70,30);}
  T.add(CG.stripF,cannonGlow,0,98,-152,.0,0,0).add(CG.stripF,cannonGold,0,176,-118,0,0,0);
  // the Remnant ring on the glacis (above the mantlet)
  T.add(CG.remnant,cannonGold,0,128,-176,-.85,0,Math.PI/6).add(CG.remnantCore,accentMat,0,128,-177,-.85+Math.PI,0,0);
  // sensor mast with a dish and a red beacon; two floodlights on the roof
  T.add(CG.mast,cannonDark,90,250,120).add(CG.dish,cannonLight,90,300,120,-.5,0,0).add(CG.lamp,cannonRed,90,312,120);
  for(const s of[-1,1])T.add(CG.flood,cannonDark,s*70,214,-40).add(CG.floodLens,cannonGlow,s*70,214,-50.5,0,Math.PI,0);
  // missile pods on the flanks, angled up
  const pods=[];
  for(const s of[-1,1]){
    const pod=new THREE.Group();pod.position.set(s*205,120,90);pod.rotation.x=.5;pod.scale.setScalar(.72);yawG.add(pod);
    const PP=cannonParts();PP.add(CG.pod,cannonLight,0,0,0).add(CG.podFace,cannonDark,0,0,-92);
    for(let r=0;r<2;r++)for(let q=0;q<3;q++){const px=-28+q*28,py=-22+r*44;
      PP.add(CG.cell,cannonDark,px,py,-97,Math.PI/2,0,0).add(CG.cellRim,accentMat,px,py,-98);
      const lp=new THREE.Object3D();lp.position.set(px,py,-110);pod.add(lp);pods.push(lp);}
    bakeParts(pod,PP);
  }
  bakeParts(yawG,T);
  // the mantlet and the twin heavy barrels
  const pitchG=new THREE.Group();pitchG.position.set(0,108,-150);yawG.add(pitchG);
  const MG=cannonParts();
  MG.add(CG.mantlet,cannonDark,0,0,-10,0,0,Math.PI/2).add(CG.mantletCap,cannonGold,-128,0,-10,0,0,Math.PI/2).add(CG.mantletCap,cannonGold,128,0,-10,0,0,Math.PI/2);
  bakeParts(pitchG,MG);
  const muzzles=[],barrels=[];
  for(const s of[-1,1]){
    const bg=new THREE.Group();bg.position.set(s*66,0,0);pitchG.add(bg);barrels.push(bg);
    const B=cannonParts(),X=Math.PI/2;
    B.add(CG.sleeve,cannonLight,0,0,-150,X,0,0).add(CG.barrel,cannonDark,0,0,-520,X,0,0);
    // cooling fins, gold bands, a coolant line along the top, a slotted muzzle brake with a cyan charge ring and a glowing bore
    for(let f=0;f<6;f++)B.add(CG.fin,cannonLight,0,0,-290-f*24,X,0,0);
    for(const zz of[-460,-640])B.add(CG.band2,cannonGold,0,0,zz,X,0,0);
    B.add(CG.conduit,accentMat,0,40,-380,X,0,0);
    B.add(CG.brake,cannonLight,0,0,-850,X,Math.PI/8,0);   // the octagon turns about its own axis (a z turn tilted the brake off the barrel's line)
    for(const zz of[-825,-875])B.add(CG.slot,cannonDark,0,0,zz);
    B.add(CG.muzzleRing,accentMat,0,0,-912).add(CG.bore,cannonGlow,0,0,-911,0,Math.PI,0);
    bakeParts(bg,B);
    const mz=new THREE.Object3D();mz.position.set(0,0,-915);bg.add(mz);muzzles.push(mz);
  }
  root.traverse(o=>{if(o.isMesh&&o.material!==cannonGlow&&o.material!==cannonRed)o.castShadow=true;});
  const foam=new THREE.Mesh(new THREE.RingGeometry(200,260,56),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
  foam.rotation.x=-Math.PI/2;foam.position.set(x,1.2,z);scene.add(foam,root);
  const rest=Math.atan2(-x,-z);
  yawG.rotation.y=rest;
  cannons.push({root,yawG,pitchG,muzzles,pods,barrels,foam,x,z,rest,cool:R(.2,1.4),barrel:0,recoil:0,target:null,misCool:R(.5,2.5),queue:0,qT:0});
}
/* ---------- Bryce's sea guns (Oct 24): the railgun (models/sea-rail.glb) and the missile battery (models/sea-missile.glb), alternating
   round the ring. Each file is split offline into base / head / gun, a unit wide, floor at y = 0, weapons toward -z: the base sits on the
   column, the head turns with yawG, the railgun's barrel rides barrels[0] under pitchG (so a broken gun still throws it into the sea).
   The code-built turret stays until the file arrives, and stays for good if it fails. ---------- */
const SEA_K=460;   // model units to world units: about as wide as the old turret with its pods
function seaGunModel(g,kind){
  if(typeof MODELS==='undefined')return;
  MODELS.copy(kind==='rail'?'sea-rail':'sea-missile').then(({scene:s})=>{MODELS.tame(s,.5);
    // lifted a little from their own paint so they read at night
    s.traverse(o=>{if(o.isMesh&&o.material.map){o.material=o.material.clone();o.material.emissive=new THREE.Color(1,1,1);o.material.emissiveMap=o.material.map;o.material.emissiveIntensity=.16;}});
    const base=s.getObjectByName('base'),head=s.getObjectByName('head'),gun=s.getObjectByName('gun');if(!base||!head)return;
    // the code-built turret goes (the column stays: the new base sits on top of it)
    const hide=o=>o.traverse(m=>{if(m.isMesh)m.visible=false;});
    for(const o of g.yawG.children)if(o.isMesh)o.visible=false;
    for(const lp of g.pods)if(lp.parent)hide(lp.parent);
    for(const o of g.pitchG.children)if(o.isMesh)o.visible=false;
    for(const b of g.barrels)hide(b);
    const wrap=(o,parent,y)=>{const w=new THREE.Group();w.scale.setScalar(SEA_K);w.position.y=y||0;o.position.set(0,0,0);parent.add(w);w.add(o);return w;};
    const hp=head.position.clone();if(gun)head.remove(gun);
    const bw=wrap(base,g.root,40);
    const hw=wrap(head,g.yawG,hp.y*SEA_K);g.headM=hw;
    const mz=g.muzzles,launch=[];
    const lp=(x,y,z,up)=>{const o=new THREE.Object3D();o.position.set(x,y,z);o.rotation.x=up;g.yawG.add(o);launch.push(o);};
    if(kind==='rail'&&gun){
      const gp=gun.position.clone().add(hp);   // the barrel's trunnion, floor-relative
      g.pz=gp.z*SEA_K;g.pitchG.position.set(0,gp.y*SEA_K,g.pz);
      for(const b of g.barrels){b.position.set(0,0,0);b.rotation.set(0,0,0);}g.b0x=0;
      wrap(gun,g.barrels[0]);
      // the twin rails meet at the tip: both rounds leave from there
      mz[0].position.set(-10,4,-352);mz[1].position.set(10,4,-352);
      for(const s2 of[-1,1])lp(s2*92,300,10,.6);   // the two boxes on the roof fire the missiles
    }else{
      // the battery: the main rounds and the missiles both leave the two tube racks
      g.pz=-193;g.pitchG.position.set(0,271,g.pz);
      g.barrels.forEach((b,i)=>{b.position.set(i?156:-156,0,0);b.rotation.set(0,0,0);});g.b0x=-156;
      mz[0].position.set(0,0,-10);mz[1].position.set(0,0,-10);
      for(const s2 of[-1,1])for(const yy of[230,300])lp(s2*156,yy,-200,.35);
    }
    g.pods=launch;g.kind=kind;
  }).catch(()=>{});
}
cannons.forEach((g,i)=>seaGunModel(g,i%2?'missile':'rail'));

// spray particles thrown up as the guns break the surface
const SPRAY=coarse?700:1400,sprayPos=new Float32Array(SPRAY*3),sprayVel=new Float32Array(SPRAY*3),sprayLife=new Float32Array(SPRAY);
for(let i=0;i<SPRAY;i++)sprayPos[i*3+1]=-9999;
const sprayGeo=new THREE.BufferGeometry();sprayGeo.setAttribute('position',new THREE.BufferAttribute(sprayPos,3));
const spray=new THREE.Points(sprayGeo,new THREE.PointsMaterial({size:46,map:glow,color:0xffffff,transparent:true,opacity:.85,depthWrite:false}));
spray.frustumCulled=false;scene.add(spray);let sprayNext=0;
function emitSpray(c,n){for(let k=0;k<n;k++){const i=sprayNext;sprayNext=(sprayNext+1)%SPRAY;const a=rng()*6.283,r=R(170,260);
  sprayPos.set([c.x+Math.cos(a)*r,2,c.z+Math.sin(a)*r],i*3);sprayVel.set([Math.cos(a)*R(10,50),R(50,150),Math.sin(a)*R(10,50)],i*3);sprayLife[i]=R(2,3.5);}}
function updateSpray(dt){for(let i=0;i<SPRAY;i++){if(sprayLife[i]<=0)continue;sprayLife[i]-=dt;const o=i*3;
  sprayVel[o+1]-=70*dt;sprayPos[o]+=sprayVel[o]*dt;sprayPos[o+1]+=sprayVel[o+1]*dt;sprayPos[o+2]+=sprayVel[o+2]*dt;
  if(sprayPos[o+1]<0||sprayLife[i]<=0){sprayLife[i]=0;sprayPos[o+1]=-9999;}}
  sprayGeo.attributes.position.needsUpdate=true;}
const angLerp=(a,b,k)=>{let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*k;};

/* ---------- smoke trail particles (missile exhaust, flak puffs) ---------- */

/* ---------- missiles ---------- */
const misGeo=new THREE.CylinderGeometry(.5,.5,1,8).rotateX(Math.PI/2);
const misMat=new THREE.MeshStandardMaterial({color:C(0xe3e6ea),roughness:.45,metalness:.3});
const missiles=[];
function launchMissile(from,dir,target,big){
  if(!target)return;
  let m=missiles.find(m=>!m.on);
  if(!m){if(missiles.length>=(coarse?50:90))return;
    const mesh=new THREE.Mesh(misGeo,misMat),flare=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffb050).multiplyScalar(3),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    scene.add(mesh,flare);m={mesh,flare};missiles.push(m);}
  m.on=true;m.big=big;m.t=0;m.pt=0;m.target=target;
  m.off=new THREE.Vector3(R(-target.W*.4,target.W*.4),R(-30,60),R(-380,420));
  m.pos=from.clone();m.vel=dir.clone().normalize().multiplyScalar(big?140:110);
  m.len=big?40:16;m.mesh.scale.set(big?5:2.2,big?5:2.2,m.len);m.flare.scale.setScalar(big?70:34);
  m.mesh.visible=m.flare.visible=true;
}
const _mt=new THREE.Vector3(),_md=new THREE.Vector3();
function explodeMissile(m){m.on=false;m.mesh.visible=m.flare.visible=false;
  boom(m.pos,m.big?520:260,0xfff1c8,.4);boom(m.pos,m.big?1300:620,0xff8a2a,1.3);for(let i=0;i<4;i++)puff(m.pos,m.big?220:110,3);}
function updateMissiles(dt){
  for(const m of missiles){if(!m.on)continue;m.t+=dt;
    const tg=m.target;
    if(!tg.grp.visible||(tg.crash&&tg.crash.impact)||m.t>11){explodeMissile(m);continue;}
    tg.grp.localToWorld(_mt.copy(m.off));
    _md.subVectors(_mt,m.pos);const dist=_md.length();_md.normalize();
    const spd=Math.min(m.big?1000:820,m.vel.length()+(m.t>.35?620:60)*dt);
    const turn=m.t>.35?1-Math.exp(-dt*3.2):0;
    m.vel.normalize().lerp(_md,turn).normalize().multiplyScalar(spd);
    m.pos.addScaledVector(m.vel,dt);
    m.mesh.position.copy(m.pos);m.mesh.lookAt(_mt.copy(m.pos).add(m.vel));
    m.flare.position.copy(m.pos).addScaledVector(m.vel,-m.len*.6/spd);
    m.pt-=dt;if(m.pt<=0){m.pt=m.big?.03:.045;puff(m.flare.position,m.big?60:26,m.big?2.6:1.8);}
    if(dist<m.len*2+30){tg.grp.localToWorld(_mt.copy(m.off));m.pos.copy(_mt);explodeMissile(m);}
  }
}

/* ---------- city point-defense: roof turrets on lift pads, and gun platforms that slide out of tower walls ---------- */
const turretMat=new THREE.MeshStandardMaterial({color:C(0x6b7581),roughness:.42,metalness:.55});
const turretDark=new THREE.MeshStandardMaterial({color:C(0x2c3239),roughness:.4,metalness:.6});
const padMat=new THREE.MeshStandardMaterial({color:C(0x8d97a2),roughness:.6,metalness:.35});
const hazardMat=new THREE.MeshStandardMaterial({color:C(0xf2b632),roughness:.5,emissive:C(0x3a2600)});
const cityGuns=[];
const roofCands=towers.filter(T=>!T.spire&&T.h>90).sort(()=>rng()-.5).slice(0,coarse?20:32);
for(const T of roofCands){const sz=clamp(T.fp*.2,6,11),ry=3+T.h;
  cityGuns.push({T,hid:new THREE.Vector3(T.x,ry-sz*3.4,T.z),out:new THREE.Vector3(T.x,ry+sz*.5,T.z),sz,yaw:rng()*6,pitch:0,cool:R(0,2),burst:0,bT:0,target:null,wall:false,lag:rng()*.25,barrel:0});}
const wallCands=towers.filter(T=>T.kind==='box'&&T.h>120&&!roofCands.includes(T)).sort(()=>rng()-.5).slice(0,coarse?10:16);
for(const T of wallCands){const sz=clamp(T.fp*.15,5,8),y=3+T.h*R(.3,.5),ang=T.rot+((rng()*4)|0)*Math.PI/2,nx=Math.sin(ang),nz=Math.cos(ang),half=T.fp/2;
  cityGuns.push({T,hid:new THREE.Vector3(T.x+nx*(half-sz*3),y,T.z+nz*(half-sz*3)),out:new THREE.Vector3(T.x+nx*(half+sz*2.3),y,T.z+nz*(half+sz*2.3)),
    wallPt:new THREE.Vector3(T.x+nx*half,y,T.z+nz*half),ang,sz,yaw:ang+Math.PI,pitch:0,cool:R(0,2),burst:0,bT:0,target:null,wall:true,lag:rng()*.25,barrel:0});}
const NG=cityGuns.length,NW=wallCands.length;
const unitCyl=new THREE.CylinderGeometry(.5,.5,1,14),unitBoxG=new THREE.BoxGeometry(1,1,1);
const IM=(geo,mat,n)=>{const m=new THREE.InstancedMesh(geo,mat,Math.max(1,n));scene.add(m);return m;};
const gPad=IM(unitBoxG,padMat,NG),gStripe=IM(unitBoxG,hazardMat,NG),gPed=IM(new THREE.CylinderGeometry(.5,.62,1,16),turretDark,NG),
  gHouse=IM(unitBoxG,turretMat,NG),gGlacis=IM(unitBoxG,turretDark,NG),gAmmo=IM(unitBoxG,turretDark,NG),
  gBar=IM(misGeo,turretDark,NG*2),gSleeve=IM(misGeo,turretMat,NG*2),gBrake=IM(unitBoxG,turretMat,NG*2),
  gEye=IM(new THREE.SphereGeometry(.5,10,8),accentMat,NG),gStrut=IM(unitBoxG,turretDark,NW*2);
const _H=new THREE.Matrix4(),_Q=new THREE.Quaternion(),_E=new THREE.Euler(),_V=new THREE.Vector3(),_S=new THREE.Vector3(),_F=new THREE.Matrix4(),_B=new THREE.Matrix4(),_O=new THREE.Matrix4(),ZAX=new THREE.Vector3(0,0,1);
function local(base,x,y,z,rx,sx,sy,sz,out){_E.set(rx,0,0);_Q.setFromEuler(_E);_H.compose(_V.set(x,y,z),_Q,_S.set(sx,sy,sz));return out.multiplyMatrices(base,_H);}
const _gp=new THREE.Vector3(),_fw=new THREE.Vector3(),_te=new THREE.Euler(0,0,0,'YXZ');
function updateCityGuns(dt,rise,aim,shoot,live){
  let wi=0;
  for(let i=0;i<NG;i++){const g=cityGuns[i],s=g.sz;
    if(g.T.down){_O.makeScale(0,0,0);for(const m of[gPad,gStripe,gPed,gHouse,gGlacis,gAmmo,gEye])m.setMatrixAt(i,_O);for(let b=0;b<2;b++){gBar.setMatrixAt(i*2+b,_O);gSleeve.setMatrixAt(i*2+b,_O);gBrake.setMatrixAt(i*2+b,_O);}
      if(g.wall){gStrut.setMatrixAt(wi++,_O);gStrut.setMatrixAt(wi++,_O);}continue;}
    const r=ease((rise-g.lag)/(1-g.lag));
    _gp.lerpVectors(g.hid,g.out,r);
    if(aim&&live.length&&r>.6){
      if(!g.target||g.target.crash||rng()<dt*.05)g.target=pick(live);
      const tp=g.target.grp.position,dx=tp.x-_gp.x,dz=tp.z-_gp.z;
      g.yaw=angLerp(g.yaw,Math.atan2(-dx,-dz),1-Math.exp(-dt*3));
      g.pitch+=(Math.atan2(tp.y-_gp.y,Math.hypot(dx,dz))-g.pitch)*(1-Math.exp(-dt*3));
    }else{g.pitch*=Math.exp(-dt*2);if(g.wall)g.yaw=angLerp(g.yaw,g.ang+Math.PI,1-Math.exp(-dt*2));}
    // pad / deck
    _te.set(0,g.wall?g.ang:0,0);_Q.setFromEuler(_te);
    _F.compose(_gp,_Q,_S.set(1,1,1));
    gPad.setMatrixAt(i,local(_F,0,-s*.25,0,0,s*(g.wall?4.6:4.2),s*.5,s*(g.wall?4.6:4.2),_O));
    gStripe.setMatrixAt(i,local(_F,0,-s*.2,0,0,s*(g.wall?4.7:4.3),s*.32,s*(g.wall?4.7:4.3),_O));
    gPed.setMatrixAt(i,local(_F,0,s*.55,0,0,s*1.7,s*1.1,s*1.7,_O));
    if(g.wall){
      // two diagonal support struts from the wall to the deck's outer edge
      for(let k=0;k<2;k++){const off=(k?1:-1)*s*1.6,nx=Math.sin(g.ang),nz=Math.cos(g.ang),tx=Math.cos(g.ang),tz=-Math.sin(g.ang);
        const a=_V.set(g.wallPt.x+tx*off,g.wallPt.y-s*3.2,g.wallPt.z+tz*off),b=new THREE.Vector3(_gp.x+nx*s*1.8+tx*off,_gp.y-s*.5,_gp.z+nz*s*1.8+tz*off);
        const len=a.distanceTo(b),mid=a.clone().add(b).multiplyScalar(.5),dir=b.clone().sub(a).normalize();
        _Q.setFromUnitVectors(ZAX,dir);gStrut.setMatrixAt(wi++,_O.compose(mid,_Q,_S.set(s*.45,s*.45,Math.max(.1,len))));}
    }
    // turret
    _te.set(0,g.yaw,0);_Q.setFromEuler(_te);
    _F.compose(_V.set(_gp.x,_gp.y+s*1.75,_gp.z),_Q,_S.set(1,1,1));
    gHouse.setMatrixAt(i,local(_F,0,0,s*.2,0,s*2.3,s*1.3,s*2.7,_O));
    gGlacis.setMatrixAt(i,local(_F,0,s*.15,-s*1.2,.65,s*2.3,s*.9,s*1.1,_O));
    gAmmo.setMatrixAt(i,local(_F,s*1.55,-s*.1,s*.3,0,s*.8,s*1.0,s*1.9,_O));
    gEye.setMatrixAt(i,local(_F,-s*.6,s*.85,s*.7,0,s*.55,s*.55,s*.55,_O));
    _B.copy(local(_F,0,s*.1,-s*1.1,g.pitch,1,1,1,_O));
    for(let b=0;b<2;b++){const bx=(b?1:-1)*s*.48;
      gSleeve.setMatrixAt(i*2+b,local(_B,bx,0,-s*.5,0,s*.62,s*.62,s*1.2,_O));
      gBar.setMatrixAt(i*2+b,local(_B,bx,0,-s*2.1,0,s*.36,s*.36,s*3.4,_O));
      gBrake.setMatrixAt(i*2+b,local(_B,bx,0,-s*3.9,0,s*.62,s*.5,s*.8,_O));}
    if(shoot&&g.target&&!g.target.crash&&r>.97){g.cool-=dt;
      if(g.cool<=0){g.cool=R(1.1,2.3);g.burst=4;g.bT=0;}
      if(g.burst>0){g.bT-=dt;if(g.bT<=0){g.bT=.08;g.burst--;g.barrel^=1;
        const from=new THREE.Vector3((g.barrel?1:-1)*s*.48,0,-s*4.4).applyMatrix4(_B);
        const to=shipLocalPoint(g.target,false).add(new THREE.Vector3(R(-160,160),R(-120,160),R(-160,160)));
        boom(from,s*7,0xffe08a,.12);
        fire(from,to,1700,'flak',p=>{boom(p,R(160,300),0xffe0a0,.4);puff(p,R(90,160),2.6);});}}
    }
  }
  for(const m of[gPad,gStripe,gPed,gHouse,gGlacis,gAmmo,gBar,gSleeve,gBrake,gEye,gStrut])m.instanceMatrix.needsUpdate=true;
}
// vertical missile launchers on the tallest roofs
const launchers=towers.filter(T=>!T.spire&&!roofCands.includes(T)).sort((a,b)=>b.h-a.h).slice(0,coarse?6:10).map(T=>({T,x:T.x,y:3+T.h,z:T.z,fp:T.fp,cool:R(.5,3),queue:0,qT:0}));
for(const L of launchers){const hatch=new THREE.Mesh(new THREE.BoxGeometry(L.fp*.3,2,L.fp*.3),turretMat);hatch.position.set(L.x,L.y+1,L.z);scene.add(hatch);L.hatch=hatch;}
function updateLaunchers(dt,shoot,live){
  if(!shoot||!live.length)return;
  for(const L of launchers){L.hatch.visible=!L.T.down;if(L.T.down)continue;L.cool-=dt;if(L.cool<=0){L.cool=R(2.5,5);L.queue=3;L.qT=0;}
    if(L.queue>0){L.qT-=dt;if(L.qT<=0){L.qT=.22;L.queue--;
      const from=new THREE.Vector3(L.x+R(-L.fp*.1,L.fp*.1),L.y+4,L.z+R(-L.fp*.1,L.fp*.1));
      launchMissile(from,new THREE.Vector3(R(-.1,.1),1,R(-.1,.1)),pick(live),false);
      boom(from,60,0xffd27a,.25);puff(from,50,2.5);}}}
}
