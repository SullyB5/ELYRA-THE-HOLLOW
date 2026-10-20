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
troopMesh.frustumCulled=false;troopMesh.castShadow=true;scene.add(troopMesh);
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

/* ---------- the Spear's charge and shot ---------- */
let charge=0,fired=false,fireT=0,beamQ=[],hostClock=0,spearClock=0,capFireT=2,said=new Set(),hyperK=0;
const beamMat2=new THREE.MeshBasicMaterial({color:C(0xffe2a0).multiplyScalar(3),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const beam2=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,16,1,true).translate(0,.5,0),beamMat2);beam2.frustumCulled=false;scene.add(beam2);
let beamT=-1,beamTo=new THREE.Vector3();
function spearCharge(){return charge;}
function spearFired(){return fired;}
const HOST_DROPS=[3,6,9,15,19,25,31],SPEAR_DROPS=[3,6,9,12];
// seconds for the Spear to charge with nobody at its base (troopers at the plinth slow it by up to 40%)
const SPEAR_CHARGE=15;
function hostOver(){return hostClock>HOST_DROPS[HOST_DROPS.length-1]+1&&drops.every(D=>D.state==='idle'||D.state==='out')&&!troops.some(t=>t.state==='walk');}
let spearKills=[];
function spearOver(){return fired&&fireT>beamQ.length*.9+5;}
function shootBeam(c){beamT=0;beamTo.copy(c.grp.position);boom(SPEAR_TOP,900,0xfff2d0,.6);flashScreen(.35);if(typeof sfx!=='undefined')sfx.beam(c.grp.position);
  spearKills.push({at:fireT+.25,c});}
function updateSpear(dt,id){
  if(id==='spear'&&!fired){
    const b=spearBreachers();charge=Math.min(1,charge+dt/SPEAR_CHARGE*(1-Math.min(.4,b*.04)));
    if(charge>=1){fired=true;fireT=0;beamQ=liveShips();
      PG.say('Elias Veyr','Now. Let it fly.','',4);
      if(typeof sfx!=='undefined')sfx.spearFire();
      // fighters, dropships and frigates in the air are swept away by the blast, a few at a time
      spearKills=[];for(const f of fighters)if(f.state==='attack'||f.state==='return'||f.state==='launch')spearKills.push({at:rnd(.4,3.5),f});
      for(const D of drops)if(!D.dead)spearKills.push({at:rnd(.3,2),D});
      for(const P of PURS)if(!P.dead&&P.grp.visible)spearKills.push({at:rnd(.5,2.5),P});
      // the shockwave clears the plaza
      for(const tr of troops)if(tr.state!=='dead'){boom(tr.pos.clone().setY(8),80,0xffe2a0,.6);killTrooper(tr,null);}
      for(let k=0;k<12;k++){const a=k/12*Math.PI*2;boom(new THREE.Vector3(SPEAR.x+Math.cos(a)*160,20,SPEAR.z+Math.sin(a)*160),260,0xffe2a0,1.2);}}}
  if(fired){const prev=fireT;fireT+=dt;beamQ.forEach((c,i)=>{const at=.6+i*.9;if(prev<at&&fireT>=at)shootBeam(c);});
    for(const K of spearKills)if(prev<K.at&&fireT>=K.at){if(K.c){if(!K.c.crash)startCrash(K.c);boom(K.c.grp.position,3000,0xfff2d0,1);boom(K.c.grp.position,2400,0xffc860,1.8);continue;}
      const p=K.f?K.f.pos:K.D?K.D.pos:K.P.grp.position;boom(p,600,0xffe2a0,.6);
      if(K.f)killFighter(K.f,false);else if(K.D)killDrop(K.D,null,false);else{K.P.dead=false;killPursuer(K.P);}}}
  const glowK=fired?Math.max(.6,3.5-fireT*.4):.5+charge*3;
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
  setMode('pilot');player.set(520,3380,-12900);yaw=Math.PI;pitch=-.03;vel.set(0,0,650);glide=400;
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
  counter:[[.5,'Elias Veyr','Shield’s down, guns up! Bring them down!','alert'],[9,'Tide City Command','One of them is coming down on the sea guns! Clear the water!','alert'],
    [16,'Lt. Michael','Second ship breaking up! The rest are holding over the city!'],[24,'Elias Veyr','Two left. We need one more down, Michael, and they’ll break. The sea guns can’t do it alone!','alert']],
  rout:[[.5,'Tide City Command','The alien flagships are breaking off! They’re running!'],
    [4,'Lt. Michael','They’re jumping out. We did it... we actually did it.'],
    [8,'Elias Veyr','Not yet! Keep the guns up, Michael. The Hollow King has been watching all of this.','alert']],
  reinf:[[.5,'Tide City Command','New contacts! Five ships dropping out of hyperspace on every side of the city! Purple hulls... that’s the Harbinger! The Hollow King’s flagship!','alert'],
    [5,'The Hollow King','Keepers. The beasts of Astraea broke your wall for me, and ran. Now I walk through it. Tide City is mine.','enemy',8],
    [11,'Elias Veyr','He waited for the aliens to bleed us! Voidclass cruisers and the Harbinger itself. Hit them with everything you have!','alert'],
    [15,'Tide City Command','Wraith fighters and Devourer bombers launching! The bombers are going for the towers!','alert'],
    [19,'Tide City Command','His heavy guns are turning on the sea cannons! We need cover out there!','alert']],
  host:[[.5,'The Hollow King','Tide City. My fleet holds your sky, and my Host comes for the Spear. Kneel, and be emptied.','enemy',9],
    [9,'Tide City Command','Ground forces landing on the core platform! It’s the Empty Host! Look for the purple markers!','alert'],
    [16,'Elias Veyr','They’re going for the Spear! Hit those dropships before they unload, and strafe the troopers on the plaza!','alert'],
    [22,'Keeper Sergeant','Keeper guard at the plinth! We hold here! Nobody touches the Spear!','alert']],
  spear:[[.5,'Tide City Command','The Spear of Destiny is waking! It needs time to charge. Keep the Host off its base!','alert'],
    [3,'Tide City Command','Another wave of fighters! Every ship is launching!','alert'],
    [6,'Elias Veyr','When the Spear fires it will take every ship left in our sky. We need to keep it alive until then!','alert'],
    [9.5,'Keeper Sergeant','Guard posts are falling at the plinth! We need help down here, now!','alert'],
    [12.5,'Elias Veyr','The Word left us this weapon for a reason. Hold, Michael. Hold!']],
  // the ending is a cutscene (endingCut); the victory radio stays empty so nothing talks over it
  victory:[],
};
function runRadio(id,pT){for(const [at,who,txt,tone,dur] of RADIO[id]||[]){const k=id+at;if(pT>=at&&!said.has(k)){said.add(k);PG.say(who,txt,tone,dur);}}}

/* ---------- per-frame story update (called by the director) ---------- */
function updateStory(dt,id,pT){
  const now=performance.now()/1000;
  updateArrival(dt,id,pT);runRadio(id,pT);
  if(id==='host'){hostClock+=dt;for(const at of HOST_DROPS)if(hostClock>=at&&hostClock-dt<at)launchDrop();}
  if(id==='spear'){spearClock+=dt;for(const at of SPEAR_DROPS)if(spearClock>=at&&spearClock-dt<at&&!fired)launchDrop();}
  updateDrops(dt);updateTroops(dt,now);updateGuards(dt,id==='host'||id==='spear');updateSpear(dt,id);
}
function resetStory(){
  charge=0;fired=false;fireT=0;beamQ=[];hostClock=0;spearClock=0;spearBreached=false;said=new Set();beamT=-1;
  for(const D of drops){D.state='idle';D.dead=true;D.g.visible=false;}for(const t of troops)t.state='dead';for(const g of guards)g.alive=true;spearKills=[];
}

/* ---------- briefing, then straight into the arrival ---------- */
PG.briefing({title:'TIDE CITY',text:'Chapter 3, the final chapter. The Vigil drops out of hyperspace over Elyra with the red alien fleet right behind it, and the Hollow King has been waiting for the city to bleed. Difficulty: '+DIFF.name+'.',
  objective:'Keep the frigates off the Vigil, then hold the city until the Spear of Destiny fires. If city integrity reaches zero, Tide City falls.',
  pc:[['Mouse','Look / aim (click to lock, Esc releases)'],['W A S D','Fly'],['Space / Q','Up / down'],['Shift','Boost'],['Right-click','Fire'],['Left-click / F','Homing missile'],['Z','Zeal when the meter is full'],['G','Crew the nearest sea gun, G again to fly']],
  phone:[['Left thumb','Fly'],['Right thumb','Look / aim'],['UP / DOWN','Altitude'],['FIRE','Fire'],['MSL','Homing missile'],['ZEAL','Zeal when the meter is full'],['GUN','Crew the nearest sea gun, FLY to go back']],
  onStart:()=>openingCut()});

/* ---------- cutscenes (js/shared/cutscene.js): the city braces for the Vigil, and the ending once the Spear has fired ---------- */
function openingCut(){
  if(battles>0){callFleet();return;}
  const ST=SPEAR_TOP;
  CUTS.play([
    {dur:8,cam:[[0,2700,10800],[0,2100,8200]],look:[[0,900,-2500],[0,700,-1500]],small:'Level 1 · Chapter 3',cap:'Tide City',
      say:[[1.2,'Tide City Command','All stations, the Vigil is inbound from Astraea with hostiles on her tail! Battle stations! Every gun crew to the sea cannons, now!','alert']]},
    {dur:7,cam:[[SPEAR.x+700,700,SPEAR.z+1100],[SPEAR.x+420,1150,SPEAR.z+560]],look:[[ST.x,ST.y*.55,ST.z],[ST.x,ST.y,ST.z]],
      say:[[.4,'Keeper Sergeant','Guard posts manned at the plinth, Command! Nobody gets near the Spear!'],
           [0,'Tide City Command','Shipyard cradle is clear for the Vigil. Civilians, get below. This is not a drill!','alert']]},
    {dur:6,cam:[[520,3380,-12900]],look:[[520,3360,-11900]],
      say:[[.6,'Elias Veyr','Michael, the moment we drop out those frigates will be all over us. Keep them off the Vigil!'],
           [0,'Lt. Michael','Understood, Master. They won’t touch her.']],fn:()=>{hyperK=1;}},
  ],{done:()=>callFleet()});
}
function endingCut(){
  const ST=SPEAR_TOP;
  CUTS.play([
    {dur:8,cam:[[2600,1400,6200],[1800,1100,4400]],look:[[0,700,0],[0,800,0]],
      say:[[.6,'Tide City Command','The Hollow fleet is breaking apart! The sky is clear... Tide City holds! Tide City holds!']]},
    {dur:7,cam:[[SPEAR.x-500,260,SPEAR.z+620],[SPEAR.x-320,420,SPEAR.z+420]],look:[[ST.x,ST.y*.7,ST.z]],
      say:[[.4,'Elias Veyr','Well flown, Lieutenant. You held the line when it mattered most.'],
           [0,'Lt. Michael','The aliens ran, and the Hollow King lost his fleet. But Master... they’ll be back. Both of them.']]},
    {dur:6,cam:[[0,520,3600],[0,620,3000]],look:[[0,1500,-4000]],
      say:[[.4,'The Hollow King','Enjoy your little victory, Keepers. The Codex is already where you cannot follow. This war has only begun.','enemy']]},
    {dur:5,cam:[[SPEAR.x+300,180,SPEAR.z-420],[SPEAR.x+420,240,SPEAR.z-560]],look:[[ST.x,ST.y,ST.z]],
      say:[[.3,'Elias Veyr','Then we take the fight to him. Rest tonight, Michael. Tomorrow, we hunt.']]},
    {dur:4,black:true,small:'End of Level 1',cap:'Elyra',cam:[[0,2600,10500]],look:[[0,900,-2500]]},
  ],{done:()=>tideResults(true)});
}
