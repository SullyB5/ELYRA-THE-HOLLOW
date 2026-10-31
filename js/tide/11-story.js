/* Tide City · story: the Spear of Destiny, arriving out of hyperspace with the Vigil, the Empty Host's ground strike,
   the Spear's charge and shot, and the radio that talks you through it. Uses Math.random only, so the seeded city never shifts. */
try{document.documentElement.style.setProperty('--tbar-top',coarse?'112px':'184px');}catch(_){}   // below the cockpit strip, compass and banner
const rnd=(a,b)=>a+Math.random()*(b-a),rpick=a=>a[(Math.random()*a.length)|0];

/* ---------- the Spear of Destiny: an ancient lance standing over the city core ---------- */
const SPEAR_H=1560,SPEAR_TOP=new THREE.Vector3(SPEAR.x,SPEAR_H,SPEAR.z);
const spear=new THREE.Group();spear.position.set(SPEAR.x,0,SPEAR.z);scene.add(spear);
const spStone=new THREE.MeshStandardMaterial({color:C(0x4d463d),roughness:.9,metalness:.05});
const spGold=new THREE.MeshStandardMaterial({color:C(0xd9b25a),roughness:.3,metalness:.85});
const spShaft=new THREE.MeshStandardMaterial({color:C(0xe9e4d6),roughness:.35,metalness:.55});
const spGlow=new THREE.MeshStandardMaterial({color:C(0x2a2418),emissive:C(0xffc860),emissiveIntensity:.5,roughness:.4});
{const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;spear.add(m);return m;};
  // plinth: three stepped octagons of old stone with gold bands
  add(new THREE.CylinderGeometry(98,112,22,8),spStone,0,14,0,0,Math.PI/8);
  add(new THREE.CylinderGeometry(84,96,22,8),spStone,0,36,0,0,Math.PI/8);
  add(new THREE.CylinderGeometry(70,82,22,8),spStone,0,58,0,0,Math.PI/8);
  for(const y of[25,47,69])add(new THREE.CylinderGeometry(y===25?99:y===47?85:71,y===25?99:y===47?85:71,3,8),spGold,0,y,0,0,Math.PI/8);
  // eight buttress blades leaning in against the shaft
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2,b=new THREE.Group();b.rotation.y=-a;spear.add(b);
    const fin=new THREE.Mesh(new THREE.BoxGeometry(8,300,46),spStone);fin.position.set(56,210,0);fin.rotation.z=.16;fin.castShadow=true;b.add(fin);
    const edge=new THREE.Mesh(new THREE.BoxGeometry(3,290,4),spGlow);edge.position.set(80,205,0);edge.rotation.z=.16;b.add(edge);}
  // the shaft: a tapering hexagonal column with glowing veins and gold collars
  add(new THREE.CylinderGeometry(12,34,1240,6),spShaft,0,70+620,0);
  const tilt=Math.atan((34-12)/1240);
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2+Math.PI/6,r=(34+12)/2*.9,g=new THREE.Group();g.rotation.y=-a;spear.add(g);
    const v=new THREE.Mesh(new THREE.BoxGeometry(2.4,1240,2.4),spGlow);v.position.set(r,690,0);v.rotation.z=tilt;g.add(v);}
  for(const [y,r] of[[300,32],[620,27],[940,22],[1250,16]]){add(new THREE.TorusGeometry(r+3,3,6,24),spGold,0,y,0,Math.PI/2);add(new THREE.TorusGeometry(r+7,1.5,6,24),spGlow,0,y+6,0,Math.PI/2);}
  // the lance head: a long gold blade with a crossguard
  const head=new THREE.OctahedronGeometry(1,0);head.scale(26,150,26);add(head,spGold,0,1310+150,0);
  const core=new THREE.OctahedronGeometry(1,0);core.scale(10,110,10);add(core,spGlow,0,1310+150,0);
  for(const s of[-1,1]){add(new THREE.BoxGeometry(90,8,10),spGold,s*40,1316,0,0,0,s*.18);add(new THREE.ConeGeometry(6,40,4),spGold,s*86,1330,0,0,0,-s*1.2);}
}
const spearTip=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd890).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
spearTip.position.copy(SPEAR_TOP);spearTip.scale.setScalar(90);scene.add(spearTip);
const spearCol={obj:spear,boxes:[{c:new THREE.Vector3(0,36,0),h:new THREE.Vector3(100,36,100)},{c:new THREE.Vector3(0,700,0),h:new THREE.Vector3(30,640,30)},{c:new THREE.Vector3(0,1420,0),h:new THREE.Vector3(30,150,30)}],R:1600,on:null};
SOLIDS.push(spearCol);

/* ---------- the Empty Host: dropships and troopers ---------- */
const DROPG=hostDropshipGeo(),TROOPG=hostTrooperGeo();
const dropMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.6});
const dropGlowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.2,2.2,2.2)});
const DROP_HP=24,drops=[],hostStats={drops:0,troops:0};
// landing zones on the core plaza: spots clear of towers and homes, spread around the Spear
const LZ=[];
for(const r of[260,340,420,480,220])for(let k=0;k<24;k++){const a=k/24*Math.PI*2+r*.01,x=SPEAR.x+Math.cos(a)*r,z=SPEAR.z+Math.sin(a)*r;
  if(Math.hypot(x,z)>PLATS[0].r-60)continue;
  if(towers.some(T=>Math.hypot(x-T.x,z-T.z)<T.fp*.75+42))continue;
  if(lows.some(L=>Math.hypot(x-L.x,z-L.z)<L.rad+38))continue;
  if(LZ.some(p=>Math.hypot(p.x-x,p.z-z)<130))continue;LZ.push(new THREE.Vector3(x,3,z));}
if(LZ.length<3)for(let k=LZ.length;k<6;k++){const a=k/6*Math.PI*2;LZ.push(new THREE.Vector3(Math.cos(a)*300,3,Math.sin(a)*300));}
let lzNext=0;
function makeDrop(){
  const g=new THREE.Group();g.add(new THREE.Mesh(DROPG.geo,dropMat),new THREE.Mesh(DROPG.glow,dropGlowMat));
  const e=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xb46aff).multiplyScalar(2.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));e.position.set(0,0,30);e.scale.setScalar(40);g.add(e);
  g.scale.setScalar(1.25);g.visible=false;scene.add(g);
  return{g,pos:g.position,vel:new THREE.Vector3(),hp:DROP_HP,dead:true,state:'idle',t:0,lastHit:-99,fx:0,spin:0};
}
for(let i=0;i<10;i++)drops.push(makeDrop());
function launchDrop(){
  const D=drops.find(D=>D.state==='idle');if(!D)return;
  const lz=LZ[lzNext++%LZ.length],out=new THREE.Vector3(lz.x,0,lz.z).normalize();
  if(out.lengthSq()<.5)out.set(1,0,0);
  out.applyAxisAngle(UP,rnd(-.5,.5));
  D.lz=lz;D.S=lz.clone().addScaledVector(out,8500).setY(950);D.Cc=lz.clone().addScaledVector(out,1800).setY(520);D.H=lz.clone().setY(160);
  D.state='in';D.t=0;D.hp=DROP_HP;D.dead=false;D.g.visible=true;D.g.rotation.set(0,0,0);D.pos.copy(D.S);D.deployed=0;D.fireT=rnd(1,2);
}
const _shv=new THREE.Vector3(),_shw=new THREE.Vector3();
function killDrop(D,how,byPlayer){
  if(D.dead)return;D.dead=true;D.state='fall';D.t=0;D.spin=rnd(1.5,3)*(Math.random()<.5?-1:1);D.vel.set(rnd(-60,60),-20,rnd(-60,60));
  boom(D.pos,500,0xfff0c0,.4);boom(D.pos,900,0xb46aff,1);boom(D.pos,700,0xff6a1a,1.2);puff(D.pos,140,4);
  if(byPlayer){hostStats.drops++;PG.kill(600,D.pos,how);PG.prog('tdrop');}
}
function updateDrops(dt){
  for(const D of drops){
    if(D.state==='idle')continue;D.t+=dt;
    if(D.state==='in'){const u=Math.min(1,D.t/11);bez2(D.S,D.Cc,D.H,u,_shv);_shw.subVectors(_shv,D.pos);D.pos.copy(_shv);
      if(_shw.lengthSq()>.01){_shw.y*=.3;D.g.lookAt(_shv.copy(D.pos).sub(_shw));}
      D.fireT-=dt;if(D.fireT<=0&&u<.9){D.fireT=rnd(.6,1.4);const T=rpick(strikeTowers),to=new THREE.Vector3(T.x,3+T.h*rnd(.3,.9),T.z);
        fire(D.pos.clone(),to,1800,'host',p=>{boom(p,160,0xc080ff,.5);boom(p,240,0xff6a1a,.9);puff(p,80,3);});}
      if(u>=1){D.state='land';D.t=0;}}
    else if(D.state==='land'){const k=ease(D.t/3);D.pos.lerpVectors(D.H,_shv.copy(D.lz).setY(13),k);
      if(D.t>2.4&&Math.random()<dt*20)puff(_shv.copy(D.lz).add(_shw.set(rnd(-40,40),2,rnd(-40,40))),rnd(20,40),2);
      if(D.t>=3){D.state='deploy';D.t=0;}}
    else if(D.state==='deploy'){
      while(D.deployed<8&&D.t>D.deployed*.3){D.deployed++;spawnTrooper(D);}
      if(D.t>3.2){D.state='out';D.t=0;D.outDir=_shv.copy(D.S).sub(D.lz).setY(0).normalize().clone();}}
    else if(D.state==='out'){D.pos.y+=Math.min(220,D.t*80)*dt;D.pos.addScaledVector(D.outDir,Math.min(500,D.t*90)*dt);
      D.g.lookAt(_shv.copy(D.pos).sub(D.outDir));if(D.t>14){D.state='idle';D.dead=true;D.g.visible=false;}}
    else if(D.state==='fall'){D.vel.y-=120*dt;D.pos.addScaledVector(D.vel,dt);D.g.rotation.z+=D.spin*dt;D.g.rotation.x+=D.spin*.3*dt;
      D.fx-=dt;if(D.fx<=0){D.fx=.06;boom(D.pos,rnd(80,160),rpick([0xff7a1a,0xb46aff,0xffb040]),.5);puff(D.pos,rnd(60,100),3);}
      const gy=groundAt(D.pos.x,D.pos.z)??0;
      if(D.pos.y<gy+6){D.state='idle';D.g.visible=false;const p=D.pos.clone().setY(gy+4);boom(p,900,0xfff0c0,.5);boom(p,1300,0xff6a1a,1.6);boom(p,900,0xb46aff,1.2);
        for(let i=0;i<5;i++)puff(p.clone().add(_shw.set(rnd(-40,40),rnd(0,30),rnd(-40,40))),rnd(120,200),6);if(gy<=0)emitSprayAt(p.x,p.z,60,120,1);
        for(const tr of troops)if(tr.state!=='dead'&&tr.pos.distanceTo(p)<40)killTrooper(tr,null);}}
  }
}
// troopers: march from the landing zone to the Spear's plinth along a path around the buildings; at the plinth they slow its charge
const TROOP_N=140,TROOP_S=5,troopMesh=new THREE.InstancedMesh(TROOPG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.5,emissive:C(0x2a0f44),emissiveIntensity:.6}),TROOP_N);
troopMesh.frustumCulled=false;troopMesh.castShadow=false;scene.add(troopMesh);   // (Oct 28: no shadow: the city's sun map is 1.6-3.2 m a texel, so a trooper's was a one-texel smudge that cost drawing all 140 again)
// Oct 25: the troopers wear Bryce's Empty Host foot soldier, baked rifle up in the light crowd version (3k triangles: 140 of them on a phone),
// glowing faintly purple from their own paint so they read at night from the air
MODELS.statue('hollow-footsoldier',{h:2.6,aim:1,lod:'far',lift:{c:0x9a6ad0,k:.45}}).then(S=>{troopMesh.geometry=S.geometry;troopMesh.material=S.material;}).catch(e=>console.warn('trooper statue',e&&e.message));
const troops=[];for(let i=0;i<TROOP_N;i++){troops.push({state:'dead',pos:new THREE.Vector3(),tgt:new THREE.Vector3(),dir:new THREE.Vector3(),ph:Math.random()*6,yaw:0,fireT:0});}
const _trm=new THREE.Matrix4(),_trq=new THREE.Quaternion(),_trs=new THREE.Vector3(),_tre=new THREE.Euler();
for(let i=0;i<TROOP_N;i++)troopMesh.setMatrixAt(i,_trm.makeScale(0,0,0));
// a purple beacon over every trooper so squads read from the air (fixed pixel size, so it shows from any distance)
const tbPos=new Float32Array(TROOP_N*3),tbGeo=new THREE.BufferGeometry();tbGeo.setAttribute('position',new THREE.BufferAttribute(tbPos,3));tbGeo.setDrawRange(0,0);
// the beacon is a white-edged purple marker pointing down at the trooper, big enough to read on a phone, and it pulses
const TB_SIZE=coarse?34:26,tbTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  x.beginPath();x.moveTo(32,60);x.lineTo(7,24);x.lineTo(20,6);x.lineTo(44,6);x.lineTo(57,24);x.closePath();
  x.fillStyle='#b04cff';x.fill();x.lineWidth=5;x.strokeStyle='#ffffff';x.lineJoin='round';x.stroke();
  x.beginPath();x.moveTo(32,44);x.lineTo(20,25);x.lineTo(44,25);x.closePath();x.fillStyle='#2a0846';x.fill();
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;})();
const troopBeacons=new THREE.Points(tbGeo,new THREE.PointsMaterial({size:TB_SIZE,sizeAttenuation:false,map:tbTex,alphaTest:.1,transparent:true,depthWrite:false,depthTest:false,fog:false,toneMapped:false}));
troopBeacons.frustumCulled=false;troopBeacons.renderOrder=6;scene.add(troopBeacons);   // shows through buildings, like a targeting overlay

/* the path: a distance field over the core platform, computed once, that every trooper walks downhill on */
const FF=(()=>{
  const cell=4,HE=PLATS[0].r,n=Math.ceil(2*HE/cell),ox=SPEAR.x-HE,oz=SPEAR.z-HE,N=n*n,block=new Uint8Array(N),dist=new Float64Array(N).fill(Infinity);
  const ci=(x,z)=>{const i=Math.floor((x-ox)/cell),j=Math.floor((z-oz)/cell);return i<0||j<0||i>=n||j>=n?-1:j*n+i;};
  const mark=(x,z,r)=>{const i0=Math.max(0,Math.floor((x-r-ox)/cell)),i1=Math.min(n-1,Math.floor((x+r-ox)/cell)),j0=Math.max(0,Math.floor((z-r-oz)/cell)),j1=Math.min(n-1,Math.floor((z+r-oz)/cell));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const cx=ox+(i+.5)*cell-x,cz=oz+(j+.5)*cell-z;if(cx*cx+cz*cz<r*r)block[j*n+i]=1;}};
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=ox+(i+.5)*cell,z=oz+(j+.5)*cell,d=Math.hypot(x-PLATS[0].x,z-PLATS[0].z),ds=Math.hypot(x-SPEAR.x,z-SPEAR.z);
    if(d>PLATS[0].r*.955||ds<108)block[j*n+i]=1;}
  // a rotated rectangle footprint (box towers and homes), padded by m
  const markRect=(x,z,hw,hd,rot,m)=>{const r=Math.hypot(hw,hd)+m,c=Math.cos(rot),s=Math.sin(rot);
    const i0=Math.max(0,Math.floor((x-r-ox)/cell)),i1=Math.min(n-1,Math.floor((x+r-ox)/cell)),j0=Math.max(0,Math.floor((z-r-oz)/cell)),j1=Math.min(n-1,Math.floor((z+r-oz)/cell));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const wx=ox+(i+.5)*cell-x,wz=oz+(j+.5)*cell-z,lx=wx*c-wz*s,lz=wx*s+wz*c;if(Math.abs(lx)<hw+m&&Math.abs(lz)<hd+m)block[j*n+i]=1;}};
  const P0=PLATS[0];
  for(const T of towers)if(Math.hypot(T.x-P0.x,T.z-P0.z)<P0.r+80){if(T.kind==='box')markRect(T.x,T.z,T.fp/2,T.fp/2,T.rot,2);else mark(T.x,T.z,T.fp/2+2);}
  for(const L of lows)if(Math.hypot(L.x-P0.x,L.z-P0.z)<P0.r+60)markRect(L.x,L.z,L.w/2,L.d/2,L.rot,1.5);
  // Dijkstra out from the ring around the plinth
  const heap=[],push=(k,d)=>{heap.push([d,k]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}},
    pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=j*n+i;if(block[k])continue;const ds=Math.hypot(ox+(i+.5)*cell-SPEAR.x,oz+(j+.5)*cell-SPEAR.z);if(ds<126){dist[k]=0;push(k,0);}}
  const NB=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  while(heap.length){const [d,k]=pop();if(d>dist[k])continue;const i=k%n,j=(k/n)|0;
    for(const [di,dj,w] of NB){const a=i+di,b=j+dj;if(a<0||b<0||a>=n||b>=n)continue;const q=b*n+a;if(block[q])continue;
      if(di&&dj&&block[j*n+a]&&block[b*n+i])continue;   // no squeezing between two corners
      const nd=d+w;if(nd<dist[q]){dist[q]=nd;push(q,nd);}}}
  // best next step from a cell, looking two cells ahead so the walk is smooth
  function step(x,z,out){const k=ci(x,z);if(k<0||!isFinite(dist[k]))return null;if(dist[k]===0)return 0;
    let bk=k;for(let s=0;s<2;s++){const i=bk%n,j=(bk/n)|0;let best=bk;
      for(const [di,dj] of NB){const a=i+di,b=j+dj;if(a<0||b<0||a>=n||b>=n)continue;const q=b*n+a;if(dist[q]<dist[best]&&!(di&&dj&&block[j*n+a]&&block[b*n+i]))best=q;}bk=best;}
    out.set(ox+(bk%n+.5)*cell,3,oz+(((bk/n)|0)+.5)*cell);return 1;}
  function free(x,z){const k=ci(x,z);return k>=0&&!block[k];}
  return{step,free,dist,ci};
})();

LZ.length=0;
{const P0=PLATS[0],cand=[];
  for(let k=0;k<40;k++){const a=k/40*Math.PI*2;cand.push(new THREE.Vector3(P0.x+Math.cos(a)*P0.r*.915,3,P0.z+Math.sin(a)*P0.r*.915));}
  for(const K of parks)if(K.P===P0&&K.r>26)cand.push(new THREE.Vector3(K.x,3,K.z));
  const clear=(x,z,r)=>{if(!FF.free(x,z))return false;for(let k=0;k<8;k++){const a=k/8*Math.PI*2;if(!FF.free(x+Math.cos(a)*r,z+Math.sin(a)*r))return false;}return true;};
  for(const c of cand.sort(()=>Math.random()-.5)){const k=FF.ci(c.x,c.z);if(k<0||!isFinite(FF.dist[k])||!clear(c.x,c.z,12))continue;
    if(LZ.some(p=>Math.hypot(p.x-c.x,p.z-c.z)<150))continue;LZ.push(c);}
  if(!LZ.length)LZ.push(new THREE.Vector3(P0.x+P0.r*.9,3,P0.z));}
// a free, connected spot near p (troopers spill out of the dropship around it)
function walkableNear(p,spread,out){for(let k=0;k<10;k++){out.copy(p).add(_shw.set(rnd(-spread,spread),0,rnd(-spread,spread)));out.y=3;const c=FF.ci(out.x,out.z);if(c>=0&&isFinite(FF.dist[c]))return out;}return out.copy(p).setY(3);}

/* Keeper guards: city soldiers holding posts around the plinth; they trade fire with the Host */
function keeperGeo(){
  const m=new Merger(),wht=C(0xe9eef4),blu=C(0x2f6fb8),dk=C(0x26303a),gl=C(0x7fe6ff),U=2;
  m.add(boxUV(.7,1,.45,U),M(0,1.55,0),blu);m.add(boxUV(.82,.28,.5,U),M(0,1.95,0),wht);
  m.add(boxUV(.48,.48,.48,U),M(0,2.33,0),wht);m.add(boxUV(.38,.16,.08,U),M(0,2.36,-.26),gl);
  for(const s of[-1,1]){m.add(boxUV(.22,1,.22,U),M(s*.48,1.45,0,0,0,s*.12),blu);m.add(boxUV(.26,1.05,.26,U),M(s*.2,.55,0),dk);m.add(boxUV(.3,.25,.5,U),M(s*.2,.06,-.05),dk);}
  m.add(boxUV(.12,.12,1.2,U),M(.5,1.25,-.5),dk);m.add(boxUV(.14,.14,.14,U),M(.5,1.25,-1.1),gl);
  return m.build();
}
const GUARD_N=coarse?10:12,guardMesh=new THREE.InstancedMesh(keeperGeo(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.35}),GUARD_N);
guardMesh.frustumCulled=false;guardMesh.castShadow=true;scene.add(guardMesh);
// the Keeper guards wear Bryce's Keeper soldier (Oct 25), baked rifle up in the light crowd version (same height as before, facing -z)
MODELS.statue('keeper-footsoldier',{h:2.55,aim:1,lod:'far'}).then(S=>{guardMesh.geometry=S.geometry;guardMesh.material=S.material;}).catch(e=>console.warn('guard statue',e&&e.message));
const guards=[];
for(let k=0,tries=0;guards.length<GUARD_N&&tries<600;tries++){const a=Math.random()*Math.PI*2,r=rnd(135,200),x=SPEAR.x+Math.cos(a)*r,z=SPEAR.z+Math.sin(a)*r;
  if(!FF.free(x,z)||guards.some(g=>Math.hypot(g.x-x,g.z-z)<22))continue;guards.push({x,z,a,alive:true,fireT:rnd(0,2),yaw:Math.atan2(-Math.cos(a),-Math.sin(a))+Math.PI});}
BK.keeper={len:34,w:2,head:18,col:0x9ff4ff,bc:0x6fe0ff};
boltMats.keeper=new THREE.MeshBasicMaterial({color:C(0x6fe0ff).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const _gdp=new THREE.Vector3();
function updateGuards(dt,active){
  guards.forEach((g,i)=>{
    if(!g.alive){guardMesh.setMatrixAt(i,_trm.makeScale(0,0,0));return;}
    if(active){g.fireT-=dt;
      let best=null,bd=170*170;for(const tr of troops){if(tr.state==='dead')continue;const d=(tr.pos.x-g.x)**2+(tr.pos.z-g.z)**2;if(d<bd){bd=d;best=tr;}}
      if(best){g.yaw=Math.atan2(-(best.pos.x-g.x),-(best.pos.z-g.z));
        if(g.fireT<=0){g.fireT=rnd(1.1,2.2);const from=_gdp.set(g.x,3+TROOP_S*1.25,g.z).clone(),tr=best,to=tr.pos.clone().setY(3+TROOP_S*1.4);
          fire(from,to,1100,'keeper',p=>{boom(p,24,0x9ff4ff,.25);if(tr.state!=='dead'&&Math.random()<.22)killTrooper(tr,null);});}}}
    _tre.set(0,g.yaw,0);guardMesh.setMatrixAt(i,_trm.compose(_trs.set(g.x,3,g.z),_trq.setFromEuler(_tre),_shw.setScalar(TROOP_S)));
  });
  guardMesh.instanceMatrix.needsUpdate=true;
}
/* ---------- Keeper mechs (Oct 24, Bryce's Tide City Mech): three walkers holding the plinth round the Spear, on their idle loop,
   turning to the nearest Host trooper and firing heavy bolts. They hold the line (they don't go down). A failed download leaves none. ---------- */
const MECH_H=TROOP_S*2.55*2.6,mechs=[];
BK.mech={len:48,w:3.2,head:24,col:0xbff8ff,bc:0x6fe0ff};
boltMats.mech=new THREE.MeshBasicMaterial({color:C(0x6fe0ff).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
if(typeof MODELS!=='undefined')for(const a0 of[.5,2.6,4.7]){
  let x=0,z=0;for(let k=0;k<12;k++){const a=a0+k*.12,r=112+k*3;x=SPEAR.x+Math.cos(a)*r;z=SPEAR.z+Math.sin(a)*r;if(FF.free(x,z))break;}
  const M={x,z,yaw:Math.atan2(x-SPEAR.x,z-SPEAR.z)+Math.PI,fireT:rnd(1,3),g:null,mix:null,ph:rnd(0,10)};mechs.push(M);
  MODELS.copy('mech').then(({scene:s,animations:an})=>{MODELS.tame(s,.5);
    // lifted a little from its own paint so the white armour reads at night (it was a dark shape against the towers)
    s.traverse(o=>{if(o.isMesh&&o.material.map){o.material=o.material.clone();o.material.emissive=new THREE.Color(1,1,1);o.material.emissiveMap=o.material.map;o.material.emissiveIntensity=.22;}});
    // (Oct 30: Bryce's Meshy Keeper mech: one piece per limb, facing -z, feet on y = 0; it stands its guard, turning to its targets)
    s.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(s);
    const h=bb.max.y-bb.min.y||1,k=MECH_H/h,inner=new THREE.Group();inner.add(s);inner.scale.setScalar(k);
    s.position.set(0,-bb.min.y,0);
    const g=new THREE.Group();g.add(inner);g.position.set(M.x,3,M.z);g.rotation.y=M.yaw;scene.add(g);M.g=g;
    if(an[0]){M.mix=new THREE.AnimationMixer(s);const act=M.mix.clipAction(an[0]);act.play();act.time=M.ph%an[0].duration;}}).catch(()=>{});}
function updateMechs(dt,active){for(const M of mechs){if(!M.g)continue;if(M.mix)M.mix.update(dt*.8);
  if(!active)continue;let best=null,bd=260*260;for(const tr of troops){if(tr.state==='dead')continue;const d=(tr.pos.x-M.x)**2+(tr.pos.z-M.z)**2;if(d<bd){bd=d;best=tr;}}
  if(!best)continue;const want=Math.atan2(-(best.pos.x-M.x),-(best.pos.z-M.z));let d=((want-M.yaw+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;M.yaw+=d*(1-Math.exp(-dt*1.5));M.g.rotation.y=M.yaw;
  M.fireT-=dt;if(M.fireT<=0&&Math.abs(d)<.2){M.fireT=rnd(1.4,2.4);const fx=-Math.sin(M.yaw),fz=-Math.cos(M.yaw),from=new THREE.Vector3(M.x+fx*MECH_H*.25+fz*MECH_H*.12,3+MECH_H*.5,M.z+fz*MECH_H*.25-fx*MECH_H*.12),tr=best;
    boom(from,30,0x9ff4ff,.12);fire(from,tr.pos.clone().setY(3+TROOP_S*1.2),1200,'mech',p=>{boom(p,40,0x9ff4ff,.3);puff(p,18,1.2);if(tr.state!=='dead'&&Math.random()<.5)killTrooper(tr,null);});}}}
function guardsLeft(){let n=0;for(const g of guards)if(g.alive)n++;return n;}
function nearestGuard(p,maxD){let best=null,bd=maxD*maxD;for(const g of guards){if(!g.alive)continue;const d=(g.x-p.x)**2+(g.z-p.z)**2;if(d<bd){bd=d;best=g;}}return best;}

let spearBreached=false;
function spawnTrooper(D){const tr=troops.find(t=>t.state==='dead');if(!tr)return;
  tr.state='walk';walkableNear(D.lz,22,tr.pos);
  const a=Math.atan2(tr.pos.z-SPEAR.z,tr.pos.x-SPEAR.x)+rnd(-.2,.2);tr.tgt.set(SPEAR.x+Math.cos(a)*116,3,SPEAR.z+Math.sin(a)*116);tr.dir.set(0,0,0);tr.sp=rnd(8,11);tr.fireT=rnd(1,3);}
function killTrooper(tr,how){if(tr.state==='dead')return;tr.state='dead';boom(tr.pos.clone().setY(10),70,0xc080ff,.45);puff(tr.pos.clone().setY(8),26,1.6);
  if(typeof sfx!=='undefined')sfx.trooperDown(tr.pos);
  if(how){hostStats.troops++;PG.kill(60,tr.pos,how);}}
function troopsLeft(){let n=0;for(const t of troops)if(t.state!=='dead')n++;return n;}
function spearBreachers(){let n=0;for(const t of troops)if(t.state==='breach')n++;return n;}
const _strp=new THREE.Vector3(),_stn=new THREE.Vector3();
function updateTroops(dt,now){
  let nb=0;   // beacons are packed at the front of the buffer and only those are drawn (a parked beacon would still show, since they draw through everything)
  for(let i=0;i<TROOP_N;i++){const tr=troops[i];
    if(tr.state==='dead'){troopMesh.setMatrixAt(i,_trm.makeScale(0,0,0));continue;}
    if(tr.state==='walk'){
      const st=FF.step(tr.pos.x,tr.pos.z,_stn);
      if(st===0){tr.state='breach';if(!spearBreached){spearBreached=true;PG.fail('tspear');PG.say('Tide City Command','Troopers at the base of the Spear! The charge is slowing!','alert',5);}}
      else{if(st===null)_stn.copy(tr.tgt);   // off the field: walk straight in
        _strp.subVectors(_stn,tr.pos).setY(0);const L=_strp.length();if(L>.01)_strp.divideScalar(L);
        tr.dir.lerp(_strp,1-Math.exp(-dt*6));if(tr.dir.lengthSq()>1e-4)tr.dir.normalize();
        const nx=tr.pos.x+tr.dir.x*tr.sp*dt,nz=tr.pos.z+tr.dir.z*tr.sp*dt;
        // never walk into a building: slide along whichever axis is clear
        if(st===null||FF.free(nx,nz)){tr.pos.x=nx;tr.pos.z=nz;}else if(FF.free(nx,tr.pos.z))tr.pos.x=nx;else if(FF.free(tr.pos.x,nz))tr.pos.z=nz;else{tr.pos.x+=_strp.x*tr.sp*dt;tr.pos.z+=_strp.z*tr.sp*dt;}
        tr.yaw=Math.atan2(-tr.dir.x,-tr.dir.z);}}
    else{tr.yaw=Math.atan2(-(SPEAR.x-tr.pos.x),-(SPEAR.z-tr.pos.z));}
    tr.fireT-=dt;if(tr.fireT<=0){tr.fireT=rnd(1.5,3.2);const from=tr.pos.clone().setY(3+TROOP_S*1.3);
      const G=tr.state==='walk'?nearestGuard(tr.pos,240):null;
      if(G){tr.yaw=Math.atan2(-(G.x-tr.pos.x),-(G.z-tr.pos.z));fire(from,new THREE.Vector3(G.x,3+TROOP_S*1.4,G.z),900,'host',p=>{boom(p,30,0xc080ff,.3);if(G.alive&&Math.random()<.16){G.alive=false;boom(p,60,0xffffff,.4);puff(p,20,1.4);}});}
      else{const to=tr.state==='breach'?new THREE.Vector3(SPEAR.x+rnd(-20,20),rnd(40,120),SPEAR.z+rnd(-20,20)):from.clone().add(_shw.set(rnd(-300,300),rnd(40,200),rnd(-300,300)));
        fire(from,to,900,'host',p=>boom(p,30,0xc080ff,.3));}}
    const bob=tr.state==='walk'?Math.abs(Math.sin(now*7+tr.ph))*.9:0;
    _tre.set(0,tr.yaw,tr.state==='walk'?Math.sin(now*7+tr.ph)*.06:0);
    troopMesh.setMatrixAt(i,_trm.compose(_trs.set(tr.pos.x,tr.pos.y+bob,tr.pos.z),_trq.setFromEuler(_tre),_shw.setScalar(TROOP_S)));
    tbPos[nb*3]=tr.pos.x;tbPos[nb*3+1]=tr.pos.y+TROOP_S*3.6;tbPos[nb*3+2]=tr.pos.z;nb++;
  }
  tbGeo.setDrawRange(0,nb);
  troopMesh.instanceMatrix.needsUpdate=true;tbGeo.attributes.position.needsUpdate=true;
  troopBeacons.material.size=TB_SIZE*(1+.16*Math.sin(now*7));
  updateHostCue();
}
/* a cue that points at the Empty Host on the plaza: a label over the squads when they're on screen, an arrow on the screen edge when not */
const hostCue=document.createElement('div');hostCue.className='hud hostcue';hostCue.innerHTML='<i></i><span></span>';document.body.appendChild(hostCue);
{const st=document.createElement('style');st.textContent=`.hostcue{position:fixed;z-index:3;left:0;top:0;display:none;align-items:center;gap:6px;pointer-events:none;transform:translate(-50%,-50%);
  padding:5px 9px;border-radius:3px;background:rgba(40,8,70,.78);border:1.5px solid #e2b8ff;color:#fff;font:700 12px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.12em;white-space:nowrap;
  box-shadow:0 0 14px rgba(176,76,255,.75);text-shadow:0 1px 3px #000;animation:hcPulse 1s ease-in-out infinite}
.hostcue i{display:none;width:0;height:0;border-top:9px solid transparent;border-bottom:9px solid transparent;border-left:14px solid #e2b8ff}
.hostcue.edge i{display:block}
@keyframes hcPulse{50%{box-shadow:0 0 22px rgba(196,110,255,1)}}
@media (pointer:coarse){.hostcue{font-size:14px;padding:7px 11px}}
@media (prefers-reduced-motion:reduce){.hostcue{animation:none}}`;document.head.appendChild(st);}
const _hc=new THREE.Vector3();
function updateHostCue(){
  let n=0;_hc.set(0,0,0);for(const t of troops)if(t.state!=='dead'){n++;_hc.add(t.pos);}
  const show=n>0&&!CUTS.on&&(mode==='pilot'||mode==='cannon');
  if(!show){hostCue.style.display='none';return;}
  _hc.divideScalar(n).setY(3+TROOP_S*4.5).project(camera);
  let x=_hc.x,y=_hc.y;const behind=_hc.z>1;if(behind){x=-x;y=-y;}
  const on=!behind&&Math.abs(x)<.9&&Math.abs(y)<.85;
  hostCue.style.display='flex';hostCue.classList.toggle('edge',!on);
  hostCue.querySelector('span').textContent='EMPTY HOST \u00d7'+n;
  if(on){hostCue.style.left=(x*.5+.5)*innerWidth+'px';hostCue.style.top=(-y*.5+.5)*innerHeight-28+'px';hostCue.querySelector('i').style.transform='';return;}
  // off screen: pin to the edge in the direction of the squads, arrow pointing at them
  const a=Math.atan2(y,x),m=Math.max(Math.abs(Math.cos(a))/.8,Math.abs(Math.sin(a))/.72);
  hostCue.style.left=(Math.cos(a)/m*.5+.5)*innerWidth+'px';hostCue.style.top=(-Math.sin(a)/m*.5+.5)*innerHeight+'px';
  hostCue.querySelector('i').style.transform=`rotate(${-a}rad)`;
}
BK.host={len:40,w:2.2,head:22,col:0xd8a0ff,bc:0xb46aff};
boltMats.host=new THREE.MeshBasicMaterial({color:C(0xb46aff).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
// player shots: dropships and troopers, plus the core plaza itself so strafing a squad works
function hostRayHit(o,d,maxD){
  let best=null,bd=maxD;
  for(const D of drops){if(D.dead||!D.g.visible)continue;_shv.subVectors(D.pos,o);const tc=_shv.dot(d);if(tc<0||tc>bd)continue;const d2=_shv.lengthSq()-tc*tc;
    if(d2<45*45){bd=tc-Math.sqrt(45*45-d2);best={type:'host',kind:'drop',obj:D,dist:bd};}}
  for(const tr of troops){if(tr.state==='dead')continue;_shv.copy(tr.pos).setY(tr.pos.y+TROOP_S*1.4).sub(o);const tc=_shv.dot(d);if(tc<0||tc>bd)continue;const d2=_shv.lengthSq()-tc*tc;
    if(d2<196){bd=tc-Math.sqrt(196-d2);best={type:'host',kind:'troop',obj:tr,dist:bd};}}
  if(d.y<-1e-3&&troopsLeft()){const t=(3-o.y)/d.y;if(t>0&&t<bd){const x=o.x+d.x*t,z=o.z+d.z*t;if(Math.hypot(x-SPEAR.x,z-SPEAR.z)<PLATS[0].r){bd=t;best={type:'host',kind:'ground',obj:null,dist:t};}}}
  return best;
}
function hostHit(hit,p,dmg,how){
  if(hit.kind==='drop'){const D=hit.obj;if(D.dead)return;D.hp-=dmg;D.lastHit=performance.now()/1000;boom(p,dmg>1?220:90,0xfff1c8,.3);if(D.hp<=0)killDrop(D,how,true);return;}
  // a hit on a trooper or the ground near a squad: small blast that drops anyone close
  const R2=hit.kind==='troop'?16:how==='cannon'?50:22;boom(p,hit.kind==='ground'?50:30,0xffe0b0,.3);
  for(const tr of troops)if(tr.state!=='dead'&&tr.pos.distanceTo(_shv.copy(p).setY(tr.pos.y))<R2)killTrooper(tr,how);
}

/* ---------- the order to fire (Oct 26, Bryce: a fire / don't-fire choice on the Spear, tied to the secret ending of not killing the
   Heralds). The first time the Spear reaches full charge it does not fire on its own: the choice is Michael's.
     FIRE  (Y, or the button): the Spear fires as it always has, every charge, one ship at a time (the destructive route, js/tide/11-story.js
           endingCut: it kills everyone aboard and under its light; nothing about that is softened). Asked once.
     HOLD  (N, or the button): the Spear stays at full charge and silent. The Hollow King's fleet has to come down to your guns and the
           sea guns. The order is asked again, once each, if the city falls to 40% and to 20% integrity. Holding to the end still wins the
           battle when his fleet is down (spearOver needs his fleet down, not a shot), and the ending says the Spear never fired.
   The choice is saved (localStorage 'elyra.spear': {held, shots}) for the secret ending, which is NOT built: its triggers (Bryce's
   lore: the Spear's charge prevented, the King's flagship and the main Herald ship preserved) must be audited against this playable
   ending first (docs/CANON-NOTES.md #33). Holding the Spear does not deliver it, and neither does the suppressor. */
const SPEAR_ORDER=(()=>{
  let order=null,open=null,offered=0,said=false;
  const css=document.createElement('style');css.textContent=`.spq{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 22%);transform:translateX(-50%);z-index:5;width:min(460px,calc(100vw - 32px));
    padding:14px 16px;background:rgba(14,10,6,.86);border:1px solid rgba(255,210,122,.75);border-radius:4px;color:#f6eedd;text-align:center;font:12px/1.45 'JetBrains Mono',ui-monospace,monospace;
    box-shadow:0 0 30px rgba(255,200,90,.25);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:spqIn .35s ease-out}
    .spq b{display:block;font:700 13px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.2em;color:#ffd27a;margin-bottom:6px}
    .spq .r{display:flex;gap:10px;justify-content:center;margin-top:12px}
    .spq button{flex:1;min-height:52px;padding:8px 10px;border-radius:3px;border:1px solid rgba(255,210,122,.6);background:rgba(90,60,10,.55);color:#fff3d6;font:700 13px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;touch-action:manipulation}
    .spq button.h{border-color:rgba(127,227,255,.7);background:rgba(10,50,80,.55);color:#dff6ff}
    .spq small{display:block;margin-top:2px;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.1em;opacity:.7}
    @keyframes spqIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translateX(-50%)}}`;document.head.appendChild(css);
  function close(){if(open){open.remove();open=null;}removeEventListener('keydown',key,true);}
  function decide(o){if(!open)return;close();order=o;
    try{localStorage.setItem('elyra.spear',JSON.stringify({held:o==='hold',at:Date.now()}));}catch(_){}
    if(o==='fire'){PG.say('Lt. Michael','Fire the Spear.','alert',3);}
    else{PG.say('Lt. Michael','Hold the Spear. We bring them down ourselves.','',4);
      setTimeout(()=>PG.say('Elias Veyr','Then every gun we have goes on his ships. Sea guns, all of you, on the Harbinger’s escorts!','alert'),4200);}}
  function key(e){if(!open)return;if(e.code==='KeyY'){e.preventDefault();e.stopPropagation();decide('fire');}else if(e.code==='KeyN'){e.preventDefault();e.stopPropagation();decide('hold');}}
  function show(tn){offered++;const el=document.createElement('div');el.className='spq';
    el.innerHTML=`<b>THE SPEAR OF DESTINY · FULL CHARGE</b>Target locked: ${tn}. If it fires, everyone aboard, and everything under its light, dies with the ship.
      <div class="r"><button type="button" class="f" id="spqF">Fire the Spear${coarse?'':'<small>Y</small>'}</button><button type="button" class="h" id="spqH">Hold${coarse?'':'<small>N</small>'}</button></div>`;
    document.body.appendChild(el);open=el;
    el.querySelector('#spqF').addEventListener('click',()=>decide('fire'));el.querySelector('#spqH').addEventListener('click',()=>decide('hold'));
    addEventListener('keydown',key,true);if(typeof sfx!=='undefined'&&sfx.moment)try{sfx.moment('spear');}catch(_){}
    PG.say('Tide City Command',offered===1?'The Spear is at full charge, Master. It’s waiting on an order.':'Master, the city is breaking up! The Spear is still at full charge!','alert',6);
    if(offered===1)setTimeout(()=>{if(open)PG.say('Elias Veyr','Michael. You’re closest to it. Your call.','',6);},3600);}
  // true = fire now. Called each frame while the Spear is full and has a target
  function ask(tg,tn){if(order==='fire')return true;if(open)return false;
    if(order===null){if(!CUTS.on)show(tn);return false;}
    // holding: asked again, once each, as the city falls past 40% and 20%
    const want=cityHP<=20?3:cityHP<=40?2:1;if(want>offered&&!CUTS.on){show(tn);return false;}
    if(!said){said=true;PG.say('Tide City Command','Spear holding at full charge. It won’t fire without an order.','',5);}
    return false;}
  function reset(){close();order=null;offered=0;said=false;}
  return{ask,reset,get order(){return order;},get held(){return order==='hold';}};
})();
/* ---------- the Spear's charge and shot ---------- */
let charge=0,fired=false,fireT=0,hostClock=0,spearClock=0,capFireT=2,said=new Set(),hyperK=0;
const beamMat2=new THREE.MeshBasicMaterial({color:C(0xffe2a0).multiplyScalar(3),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const beam2=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,16,1,true).translate(0,.5,0),beamMat2);beam2.frustumCulled=false;scene.add(beam2);
let beamT=-1,beamTo=new THREE.Vector3();
function spearCharge(){return charge;}
// the battle is won once the Spear (with your help) has brought down the whole Hollow fleet
function spearFired(){return fired;}
const HOST_DROPS=[3,6,9,15,19,25,31],SPEAR_DROPS=[3,6,9,12];
// the Spear starts charging the moment the Hollow King's fleet arrives. Each charge takes SPEAR_CHARGE seconds with nobody at its base
// (troopers at the plinth slow it by up to 40%), then it fires one beam at the smallest ship left (his cruisers first, the Harbinger last) and charges again.
const SPEAR_CHARGE=30;
let shots=0,cycleSaid=new Set();
function hollowDown(){return WAVE2.every(c=>c.crash);}
function hostOver(){return hostClock>HOST_DROPS[HOST_DROPS.length-1]+1&&drops.every(D=>D.state==='idle'||D.state==='out')&&!troops.some(t=>t.state==='walk');}
let spearKills=[];
function spearOver(){return hollowDown()&&beamT<0&&!spearKills.length;}
// the smallest ship left first (his Voidclass escorts, the most damaged of them first), the Harbinger last: the flagship is yours to wear down
function spearTarget(){return WAVE2.filter(c=>!c.crash&&c.grp.visible).sort((a,b)=>(a.maxHp-b.maxHp)||((a.hp==null?a.maxHp:a.hp)-(b.hp==null?b.maxHp:b.hp)))[0]||null;}
const SPEAR_NAME={harbinger:'the Harbinger',voidclass:'a Voidclass cruiser'};
function shootBeam(c){beamT=0;beamTo.copy(c.grp.position);boom(SPEAR_TOP,900,0xfff2d0,.6);flashScreen(.35);if(typeof sfx!=='undefined'){sfx.spearFire();sfx.beam(c.grp.position);}
  spearKills.push({at:fireT+.25,c});}
function spearSay(key,who,txt,tone){if(cycleSaid.has(key))return;cycleSaid.add(key);PG.say(who,txt,tone);}
function updateSpear(dt,id){
  fireT+=dt;fired=hollowDown();
  const on=(id==='reinf'||id==='host'||id==='spear')&&!fired;
  if(on){
    const b=spearBreachers();charge=Math.min(1,charge+dt/SPEAR_CHARGE*(1-Math.min(.4,b*.04)));
    const tg=spearTarget(),tn=tg?SPEAR_NAME[tg.model]||'the largest ship':'';
    // the radio follows the charge, so what is said matches what the Spear is doing
    if(charge>.02)spearSay('wake','Tide City Command',shots?'The Spear is recharging! Keep the Host off its base!':'The Spear of Destiny is waking! Thirty seconds to charge. Keep the Host off its base!','alert');
    if(charge>.5)spearSay('half',shots?'Tide City Command':'Elias Veyr',shots?'Spear at half charge!':'The Spear takes his cruisers first. The Harbinger is ours to break, Michael. Keep the Host off its base!','alert');
    if(charge>.86&&tg)spearSay('lock','Tide City Command','Spear at full charge in seconds! Target locked: '+tn+'!','alert');
    if(charge>=1&&tg&&SPEAR_ORDER.ask(tg,tn)){shots++;shootBeam(tg);charge=0;
      PG.say(shots===1?'Elias Veyr':'Tide City Command',shots===1?'Now. Let it fly.':'Spear firing! '+tn[0].toUpperCase()+tn.slice(1)+' is breaking up!',shots===1?'':'alert',4);cycleSaid=new Set(['wake']);}}
  for(let i=spearKills.length-1;i>=0;i--){const K=spearKills[i];if(fireT<K.at)continue;spearKills.splice(i,1);
    if(!K.c.crash)startCrash(K.c);boom(K.c.grp.position,3000,0xfff2d0,1);boom(K.c.grp.position,2400,0xffc860,1.8);
    if(hostStats)hostStats.spear=(hostStats.spear||0)+1;}
  const glowK=(beamT>=0&&beamT<1.2?3.5-beamT*2:.5+charge*3);
  spGlow.emissiveIntensity=glowK*(1+.15*Math.sin(performance.now()*.008));
  spearTip.scale.setScalar(90+charge*520+(beamT>=0&&beamT<.9?400:0));
  if(beamT>=0){beamT+=dt;const k=beamT<.1?beamT/.1:1-ease((beamT-.1)/.8);beamMat2.opacity=Math.max(0,k);
    const d=SPEAR_TOP.distanceTo(beamTo);beam2.position.copy(SPEAR_TOP);beam2.quaternion.setFromUnitVectors(UP,_shv.subVectors(beamTo,SPEAR_TOP).normalize());beam2.scale.set(60+Math.sin(beamT*60)*12,d,60);
    if(beamT>1)beamT=-1;}else beamMat2.opacity=0;
}

/* ---------- arriving out of hyperspace ---------- */
const HYPER=makeHyper();
const flashEl=document.createElement('div');flashEl.className='flash';flashEl.style.cssText='position:fixed;inset:0;z-index:4;background:#fff;opacity:0;pointer-events:none';document.body.appendChild(flashEl);
function flashScreen(a){flashEl.style.transition='none';flashEl.style.opacity=a;requestAnimationFrame(()=>{flashEl.style.transition='opacity .9s';flashEl.style.opacity=0;});}
function startArrival(){
  setMode('pilot');player.set(1900,3750,-12300);yaw=Math.PI;pitch=-.03;vel.set(0,0,430);glide=400;   // off the Vigil's wing and above it (her new hull is much bigger; you used to drop out inside it)
  for(const v of Object.values($('views').children||{}))if(v.classList)v.classList.remove('on');
}
function dropOut(){flashScreen(.85);hyperK=1;if(mode==='pilot')glide=400;}
function updateArrival(dt,id,pT){
  if(id==='arrive')hyperK=Math.min(1,pT/.3);
  else if(hyperK>0)hyperK=Math.max(0,hyperK-dt/1.4);
  HYPER.update(hyperK,dt);
  camera.fov=68+40*hyperK*hyperK;camera.updateProjectionMatrix();
}

/* ---------- radio ---------- */
const RADIO={
  arrive:[[.2,'Elias Veyr','Hold together... dropping out now!']],
  escape:[[1,'Elias Veyr','Tide City, this is the Vigil! We are coming in hot with hostiles right on our tail!','alert'],
    [7,'Tide City Command','Vigil, we see you! The shipyard cradle is clear. Interceptor, get those frigates off her, now!','alert'],
    [16,'Lt. Michael','Frigates breaking off! She’s clear, Master!'],
    [22,'Elias Veyr','Bring her down. Then we turn and fight. Everyone to your guns!']],
  approach:[[2,'Tide City Command','Capital ships over the northern ridge! They followed you home!','alert'],
    [9,'Elias Veyr','Then this is where we stop them. The sea guns need time to surface, Michael. Buy it, whatever it takes!']],
  bombard:[[.5,'Tide City Command','Raising the shield! All civilians below, now!','alert'],[7,'Tide City Command','Shield is holding, but not for long! Sea guns surfacing!','alert']],
  counter:[[.5,'Elias Veyr','Shield’s down, guns up! Bring them down!','alert'],[9,'Tide City Command',()=>capitals[CRASH_A].crash&&capitals[CRASH_A].crash.guide?'One of them is coming down on the sea guns! Clear the water!':'You dropped it before it reached the sea guns! The guns are still up! Keep firing!','alert'],
    [16,'Lt. Michael',()=>capitals[CRASH_B].crash?null:'Second ship breaking up! The rest are holding over the city!'],[24,'Elias Veyr',()=>{const n=WAVE1.filter(c=>!c.crash).length;return n===2?'Two left. We need one more down, Michael, and they’ll break. The sea guns can’t do it alone!':n>2?'They’re still holding over the city! We need more of them down, Michael, now!':null;},'alert']],
  // Oct 26 (The First Word): the Heralds' fleet fight is The Heralds' now; the ones that followed the Vigil home show themselves and scatter
  rout:[[.5,'Tide City Command','Herald capital ships dropping out over the northern ridge! They followed the Vigil all the way home!','alert'],
    [5,'Lt. Michael','They’re not forming up, Master. They’re breaking off. Scattering.'],
    [10,'Elias Veyr','They came this far just to run again? Raise the sea guns. The Hollow King has been watching all of this.','alert']],
  reinf:[[.5,'Tide City Command','New contacts! Five ships dropping out of Slipscape on every side of the city! Purple hulls... that’s the Harbinger! The Hollow King’s flagship!','alert'],
    [5,'The Hollow King','Keepers. You led the Heralds home, and they ran from you. Now I walk in behind them. Tide City is mine.','enemy',8],
    [11,'Elias Veyr','He waited for us to come home! Voidclass cruisers and the Harbinger itself. Hit them with everything you have!','alert'],
    [15,'Tide City Command','Wraith fighters and Devourer bombers launching! The bombers are going for the towers!','alert'],
    [19,'Tide City Command','His heavy guns are turning on the sea cannons! We need cover out there!','alert']],
  host:[[.5,'The Hollow King','Tide City. My fleet holds your sky, and my Host comes for the Spear. Kneel, and be emptied.','enemy',9],
    [9,'Tide City Command','Ground forces landing on the core platform! It’s the Empty Host! Look for the purple markers!','alert'],
    [16,'Elias Veyr','They’re going for the Spear! Hit those dropships before they unload, and strafe the troopers on the plaza!','alert'],
    [22,'Keeper Sergeant','Keeper guard at the plinth! We hold here, whatever comes down!','alert']],
  // the Spear's own lines follow its charge (updateSpear)
  spear:[[3,'Tide City Command','Another wave of fighters! Every ship is launching!','alert'],
    [11,'Keeper Sergeant','Guard posts are falling at the plinth! We need help down here, now!','alert'],
    [20,'Elias Veyr','The Word left us this weapon for a reason. Hold, Michael. Hold!']],
  // the ending is a cutscene (endingCut); the victory radio stays empty so nothing talks over it
  victory:[],
};
// a line's text can be a function: it is checked when the line comes up, so the radio matches what actually happened (null = say nothing)
function runRadio(id,pT){for(const [at,who,txt,tone,dur] of RADIO[id]||[]){const k=id+at;if(pT>=at&&!said.has(k)){said.add(k);const s=typeof txt==='function'?txt():txt;if(s)PG.say(who,s,tone,dur);}}}

/* ---------- per-frame story update (called by the director) ---------- */
function updateStory(dt,id,pT){
  const now=performance.now()/1000;
  updateArrival(dt,id,pT);runRadio(id,pT);
  if(id==='host'){hostClock+=dt;for(const at of HOST_DROPS)if(hostClock>=at&&hostClock-dt<at)launchDrop();}
  if(id==='spear'){spearClock+=dt;for(const at of SPEAR_DROPS)if(spearClock>=at&&spearClock-dt<at&&!fired)launchDrop();}
  updateDrops(dt);updateTroops(dt,now);updateGuards(dt,id==='host'||id==='spear');updateMechs(dt,id==='host'||id==='spear');updateSpear(dt,id);
}
function resetStory(){
  SPEAR_ORDER.reset();charge=0;fired=false;fireT=0;shots=0;cycleSaid=new Set();hostClock=0;spearClock=0;spearBreached=false;said=new Set();beamT=-1;
  for(const D of drops){D.state='idle';D.dead=true;D.g.visible=false;}for(const t of troops)t.state='dead';for(const g of guards)g.alive=true;spearKills=[];
}

/* ---------- briefing, then straight into the arrival ---------- */
PG.briefing({title:'THE FIRST WORD',text:(TIDE_PART==='sky'?'Tide City. The Vigil is coming home from Astraea, and the Heralds are right behind her. The streets are smoking from the Hollow King’s carriers. Beneath the city, the Spear of Destiny has begun to wake.'
    :'Tide City, while the Vigil is still out at Astraea. Something comes down over the harbor: the Hollow King’s carriers, putting the Empty Host on the streets. Beneath the city, the Spear of Destiny has begun to wake.')+' Threat level: '+DIFF.name+'.',
  objective:TIDE_PART==='streets'?'On the streets, as Warden Six: bring down the Hollow carriers and the Host they land, before anything reaches the Spear.'
    :TIDE_PART==='sky'?'As Michael: keep the frigates off the Vigil, then the evacuation shuttles. When the Hollow King comes, the Spear charges, and the order to fire it is yours. If city integrity reaches zero, Tide City falls.'
    :'On the streets, as Warden Six: bring down the Hollow carriers and the Host they land. Then, as Michael: keep the frigates off the Vigil, and hold the city. When the Hollow King comes, the Spear charges, and the order to fire it is yours. If city integrity reaches zero, Tide City falls.',
  pc:[['Mouse','Look / aim (click to lock, Esc releases)'],['W A S D','Fly · on the streets: drive'],['F / left-click','On the streets: rockets (walker) or missiles (skiff)'],['Space / Q','Up / down'],['Shift','Boost'],['Right-click','Fire'],['Left-click / F','Homing missile'],['4 or middle click','Zeal when the meter is full'],['G','Crew the nearest sea gun, G again to fly'],['Y / N','Fire / hold the Spear (when it asks)']],
  phone:[['Left thumb','Fly · on the streets: drive'],['RKT / MSL','On the streets: rockets or missiles'],['Right thumb','Look / aim'],['UP / DOWN','Altitude'],['FIRE','Fire'],['MSL','Homing missile'],['ZEAL','Zeal when the meter is full'],['GUN','Crew the nearest sea gun, FLY to go back'],['FIRE / HOLD','The Spear’s order (when it asks)']],
  onStart:()=>openingCut()});

/* ---------- cutscenes (js/shared/cutscene.js): the city braces for the Vigil, and the ending once the Spear has fired ---------- */
function openingCut(){
  if(battles>0){callFleet();return;}
  const ST=SPEAR_TOP;
  CUTS.play([
    // (Oct 26 · The First Word: on its own page, part 3 opens here, on a location caption, not a level title; the Slipscape flash moved here from the streets)
    {dur:8,cam:[[0,2700,10800],[0,2100,8200]],look:[[0,900,-2500],[0,700,-1500]],small:openingCut.sky?'Elyra':openingCut.noTitle?undefined:'Last Transmission · Level 06 · Tide City',cap:openingCut.sky?'Tide City':openingCut.noTitle?undefined:'The First Word',
      say:openingCut.sky?[[1.2,'Tide City Command','Slipscape flash! North-east! It’s the Vigil... and she’s not alone!','alert'],[0,'Tide City Command','All stations, the Vigil is home from Astraea with Heralds on her tail! Battle stations! Every gun crew to the sea cannons, now!','alert']]
        :[[1.2,'Tide City Command','All stations, the Vigil is inbound from Astraea with Heralds on her tail! Battle stations! Every gun crew to the sea cannons, now!','alert']]},
    {dur:7,cam:[[SPEAR.x+700,700,SPEAR.z+1100],[SPEAR.x+420,1150,SPEAR.z+560]],look:[[ST.x,ST.y*.55,ST.z],[ST.x,ST.y,ST.z]],
      say:[[.4,'Keeper Sergeant','Guard posts manned at the plinth, Command! Nobody gets near the Spear!'],
           [0,'Tide City Command','Shipyard cradle is clear for the Vigil. Civilians, get below. This is not a drill!','alert']]},
    // the Spear wakes: for the first time in anyone's memory, light at its tip (the ending pays for this)
    {dur:7,cam:[[ST.x+260,ST.y-120,ST.z+380],[ST.x+170,ST.y-40,ST.z+260]],look:[[ST.x,ST.y,ST.z]],
      say:[[.6,'Keeper Sergeant','Command... the Spear is lit. Up at the tip. It hasn’t done that in my lifetime.'],
           [0,'Tide City Command','We see it. Log it, and keep your people clear of the plinth.']],
      fn:(t,dt)=>{if(!openingCut.tip){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd890).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.copy(ST);scene.add(sp);openingCut.tip=sp;}
        const sp=openingCut.tip;sp.visible=true;sp.scale.setScalar(60+50*Math.max(0,Math.sin(t*1.7)));sp.material.opacity=Math.min(1,t/1.5)*(.6+.4*Math.sin(t*2.3));}},
    {dur:6,cam:[[2600,6400,-15500],[2200,6000,-14800]],look:[[0,1200,0]],
      say:[[.6,'Elias Veyr','Michael, the moment we drop out those frigates will be all over us. Keep them off the Vigil!'],
           [0,'Lt. Michael','Understood, Master. They won’t touch her.']],fn:()=>{hyperK=1;}},
  ],{score:'tense',done:()=>{if(openingCut.tip)openingCut.tip.visible=false;callFleet();}});
}
function endingCut(){
  const ST=SPEAR_TOP;
  CUTS.play([
    {dur:8,cam:[[2600,1400,6200],[1800,1100,4400]],look:[[0,700,0],[0,800,0]],
      say:[[.6,'Tide City Command','The Hollow fleet is breaking apart! The sky is clear... Tide City holds! Tide City holds!']]},
    {dur:12,cam:[[SPEAR.x-610,260,SPEAR.z+512],[SPEAR.x-495,420,SPEAR.z+302]],look:[[ST.x,ST.y*.7,ST.z]],   // (Oct 26: swung 11 deg round; the old arc ran 10 m past a pylon of the top transit ring, a bare column across half the frame)
      say:shots?[[.4,'Lt. Michael','Master... the Spear didn’t stop at the ships. Everyone aboard them. Everything under that light. It’s all gone.'],
           [0,'Elias Veyr','I know, Michael. The city stands. We will carry what it cost.'],
           [0,'Lt. Michael','His fleet is gone, and the Heralds ran. But whatever they were running from is still out there.']]
        // the Spear held to the end (SPEAR_ORDER): his fleet came down to the guns alone
        :[[.4,'Lt. Michael','Master... the Spear never fired. We brought them down with our own guns.'],
           [0,'Elias Veyr','And the city paid for every one of them. The towers, the names. We will carry that too.'],
           [0,'Lt. Michael','His fleet is gone, and the Heralds ran. But whatever they were running from is still out there.']]},
    {dur:6,cam:[[0,520,3600],[0,620,3000]],look:[[0,1500,-4000]],
      say:[[.4,'The Hollow King','Enjoy your little victory, Keepers. You still do not know what humanity did.','enemy']],fn:t=>{if(t>.3&&!endingCut.k){endingCut.k=1;if(typeof sfx!=='undefined'&&sfx.moment)sfx.moment('king');}}},
    {dur:10,cam:[[SPEAR.x+300,180,SPEAR.z-420],[SPEAR.x+420,240,SPEAR.z-560]],look:[[ST.x,ST.y,ST.z]],
      say:[[.3,'Tide City Command',shots?'Master, deep sonar logged something under the bay every time the Spear fired. Something very large, moving away from the city.':'Master, deep sonar logged something under the bay tonight. Something very large, moving away from the city.'],
           [0,'Elias Veyr','Rest tonight, Michael. Tomorrow, we hunt.']]},
    {dur:4,black:true,small:'Keeper Archive // Clearance: black',cap:'If this file has reached you, the warning failed.',cam:[[0,2600,10500]],look:[[0,900,-2500]]},
  ],{hush:true,score:'sorrow',duck:.18,done:()=>tideResults(true)});   // hush: the battle radio still queued would hold the ending's voices back
}
