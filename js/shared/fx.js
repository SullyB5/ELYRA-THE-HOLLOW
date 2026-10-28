/* Elyra shared effects: energy bolts, flashes, smoke-trail particles, smoke puffs.
   Needs core.js plus page globals `scene`, `renderer`, `glow` defined before this script loads. */
const UP=new THREE.Vector3(0,1,0),_bv=new THREE.Vector3(),_bw=new THREE.Vector3();
const boltGeo=new THREE.CylinderGeometry(1,1,1,6,1,true).translate(0,.5,0);
const BK={enemy:{len:240,w:6,head:110,col:0xff7a5a,bc:0xff3a24},hollow:{len:240,w:6,head:110,col:0xd8a0ff,bc:0xa45cff},hbolt:{len:60,w:2.6,head:26,col:0xd8a0ff,bc:0xa45cff},friend:{len:200,w:6,head:100,col:0xffc878,bc:0xffb347},flak:{len:70,w:2.2,head:30,col:0xfff0b0,bc:0xffe6a0},fbolt:{len:60,w:2.6,head:26,col:0xff3a3a,bc:0xff2020},player:{len:90,w:2.4,head:34,col:0x9ff4ff,bc:0x6fe0ff},zeal:{len:90,w:2.4,head:30,col:0xffe2a0,bc:0xffd27a}};
const boltMats={};for(const k in BK)boltMats[k]=new THREE.MeshBasicMaterial({color:C(BK[k].bc).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const bolts=[];
function fire(from,to,speed,kind,onHit){
  let b=bolts.find(b=>!b.on);
  if(!b){if(bolts.length>=(coarse?180:320))return;
    const mesh=new THREE.Mesh(boltGeo,boltMats.enemy),head=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));
    mesh.frustumCulled=false;scene.add(mesh,head);b={mesh,head};bolts.push(b);}
  const K=BK[kind];
  b.on=true;b.from=from.clone();b.to=to.clone();b.t=0;b.dur=Math.max(.2,from.distanceTo(to)/speed);b.onHit=onHit;
  b.mesh.material=boltMats[kind];b.head.material.color.copy(C(K.col)).multiplyScalar(2.5);
  b.len=K.len;b.mesh.scale.set(K.w,b.len,K.w);b.head.scale.setScalar(K.head);
  b.dir=to.clone().sub(from).normalize();b.mesh.quaternion.setFromUnitVectors(UP,b.dir);b.mesh.visible=b.head.visible=true;
}
function updateBolts(dt){
  for(const b of bolts){if(!b.on)continue;b.t+=dt;const k=Math.min(b.t/b.dur,1);
    _bv.lerpVectors(b.from,b.to,k);b.head.position.copy(_bv);
    b.mesh.position.copy(_bv).addScaledVector(b.dir,-Math.min(b.len,b.from.distanceTo(_bv)));
    if(k>=1){b.on=false;b.mesh.visible=b.head.visible=false;if(b.onHit)b.onHit(b.to);}}
}
const booms=[];
function boom(pos,size,hex,life){
  let s=booms.find(b=>!b.on);
  if(!s){if(booms.length>=(coarse?140:240))return;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));scene.add(sp);s={sp};booms.push(s);}
  s.on=true;s.t=0;s.life=life||1.2;s.size=size;s.sp.position.copy(pos);s.sp.material.color.copy(C(hex)).multiplyScalar(3);s.sp.visible=true;
}
function updateBooms(dt){for(const s of booms){if(!s.on)continue;s.t+=dt;const k=s.t/s.life;if(k>=1){s.on=false;s.sp.visible=false;continue;}
  s.sp.scale.setScalar(s.size*(.35+Math.sqrt(k)));s.sp.material.opacity=(1-k)*(1-k);}}
const TRAIL=coarse?1800:3600;
const trPos=new Float32Array(TRAIL*3),trSize=new Float32Array(TRAIL),trAlpha=new Float32Array(TRAIL),trAge=new Float32Array(TRAIL).fill(99),trLife=new Float32Array(TRAIL).fill(1),trBase=new Float32Array(TRAIL);
for(let i=0;i<TRAIL;i++)trPos[i*3+1]=-9999;
const trGeo=new THREE.BufferGeometry();
trGeo.setAttribute('position',new THREE.BufferAttribute(trPos,3));trGeo.setAttribute('aSize',new THREE.BufferAttribute(trSize,1));trGeo.setAttribute('aAlpha',new THREE.BufferAttribute(trAlpha,1));
const trMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{map:{value:glow},col:{value:C(0xd6d2cc)},scale:{value:400}},
  vertexShader:'attribute float aSize;attribute float aAlpha;varying float vA;uniform float scale;void main(){vA=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*scale/max(-mv.z,1.0);gl_Position=projectionMatrix*mv;}',
  fragmentShader:`uniform sampler2D map;uniform vec3 col;varying float vA;void main(){float a=texture2D(map,gl_PointCoord).a*vA;if(a<0.01)discard;gl_FragColor=vec4(col,a);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`});
const trails=new THREE.Points(trGeo,trMat);trails.frustumCulled=false;scene.add(trails);
let trNext=0;
function puff(p,size,life){const i=trNext;trNext=(trNext+1)%TRAIL;trPos.set([p.x,p.y,p.z],i*3);trBase[i]=size;trAge[i]=0;trLife[i]=life;}
function updateTrails(dt){
  trMat.uniforms.scale.value=renderer.domElement.height/2;
  for(let i=0;i<TRAIL;i++){if(trAge[i]>=trLife[i]){trAlpha[i]=0;continue;}
    trAge[i]+=dt;const k=trAge[i]/trLife[i];trPos[i*3+1]+=6*dt;
    trSize[i]=trBase[i]*(.45+1.7*k);trAlpha[i]=.6*(1-k)*Math.min(1,k*10);}
  trGeo.attributes.position.needsUpdate=true;trGeo.attributes.aSize.needsUpdate=true;trGeo.attributes.aAlpha.needsUpdate=true;
}

const smokes=[];
function smoke(pos,size,life){
  let s=smokes.find(b=>!b.on);
  if(!s){if(smokes.length>=160)return;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x2f2a28),transparent:true,depthWrite:false}));scene.add(sp);s={sp};smokes.push(s);}
  s.on=true;s.t=0;s.life=life;s.size=size;s.sp.position.copy(pos);s.sp.visible=true;s.rise=R(20,50);
}
function updateSmoke(dt){for(const s of smokes){if(!s.on)continue;s.t+=dt;const k=s.t/s.life;if(k>=1){s.on=false;s.sp.visible=false;continue;}
  s.sp.position.y+=s.rise*dt;s.sp.scale.setScalar(s.size*(.45+k*1.4));s.sp.material.opacity=.75*(1-k)*Math.min(1,k*6);}}
/* Oct 25 (lag spikes mid-fight): the bolt, flash and smoke pools are filled up front and hidden, so the loading screen's warm-up frame
   (warmDraw in js/shared/progress.js shows every hidden thing once) builds their shaders and buffers. They used to be made on the first
   shot of a fight, which stalled that frame. */
{const NB=coarse?40:64,NF=coarse?48:80;
 for(let i=0;i<NB;i++){const mesh=new THREE.Mesh(boltGeo,boltMats.enemy),head=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));
   mesh.frustumCulled=false;mesh.visible=head.visible=false;scene.add(mesh,head);bolts.push({mesh,head,on:false});}
 for(let i=0;i<NF;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.visible=false;scene.add(sp);booms.push({sp,on:false});}
 for(let i=0;i<24;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x2f2a28),transparent:true,depthWrite:false}));sp.visible=false;scene.add(sp);smokes.push({sp,on:false});}
 // and one hidden bolt of every kind (Oct 25, found testing the White City's barrier: the pool above only warmed the enemy bolt, so the
 // squad's first shot, each Herald side's, the rover's and the walker's each compiled a new shader mid-fight). BOLT_WARM: for kinds
 // added later (the rover's chaingun, js/shared/vehicles.js)
 window.BOLT_WARM=k=>{if(!boltMats[k])return;const m=new THREE.Mesh(boltGeo,boltMats[k]);m.visible=false;m.frustumCulled=false;scene.add(m);};
 for(const k in boltMats)BOLT_WARM(k);}
/* Oct 27 (lag as fights start): the bolts and flashes a fight uses are made up front, hidden, so the loading screen draws them once and
   the first burst of fire makes nothing new. (They still grow past this on demand, up to the caps above.) */
{const nb=coarse?48:96,nf=coarse?60:120;
 for(let i=0;i<nb;i++){const mesh=new THREE.Mesh(boltGeo,boltMats.enemy),head=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));
   mesh.frustumCulled=false;mesh.visible=head.visible=false;scene.add(mesh,head);bolts.push({mesh,head,on:false});}
 for(let i=0;i<nf;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.visible=false;scene.add(sp);booms.push({sp,on:false});}}
