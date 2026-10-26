/* Tide City · life */
/* ---------- city life: ground plazas and parks, low-rise homes, roof gardens, street trees, ring-road traffic, people, boats, signs ---------- */
const lows=[],parks=[];
const ROAD_IN=.88,ROAD_OUT=.97;
const lifeQ=coarse?.6:1;
function freeOf(x,z,rad){
  if(Math.hypot(x-SPEAR.x,z-SPEAR.z)<SPEAR.clear-20+rad)return false;   // the Spear's plinth
  for(const T of towers){const d=Math.hypot(x-T.x,z-T.z);if(d<T.fp*.72+rad)return false;}
  for(const L of lows){const d=Math.hypot(x-L.x,z-L.z);if(d<L.rad+rad+4)return false;}
  for(const K of parks){const d=Math.hypot(x-K.x,z-K.z);if(d<K.r+rad)return false;}
  return true;
}
// parks first, then homes around them
for(const P of PLATS){
  const n=P.tier===0?6:P.tier===1?4:3;
  for(let k=0,tries=0;k<n&&tries<300;tries++){
    const a=rng()*6.283,d=Math.sqrt(rng())*P.r*.78,x=P.x+Math.cos(a)*d,z=P.z+Math.sin(a)*d,r=R(22,P.tier===0?62:48);
    if(d+r>P.r*ROAD_IN-6||!freeOf(x,z,r))continue;parks.push({x,z,r,P});k++;}
}
const lowCols=[0xf2e8d8,0xe8d8bf,0xd9b89a,0xd49a7a,0xcfe3d2,0xf6f1e8,0xc9d3dc,0xe6c9a8].map(C);
for(const P of PLATS){
  const tries=Math.floor(P.r*8*lifeQ);
  for(let t=0;t<tries;t++){
    const a=rng()*6.283,d=Math.sqrt(rng())*P.r*ROAD_IN,x=P.x+Math.cos(a)*d,z=P.z+Math.sin(a)*d;
    const w=R(10,24),dd=R(10,24),rad=Math.hypot(w,dd)*.5;
    if(d+rad>P.r*ROAD_IN-4||!freeOf(x,z,rad))continue;
    const mid=rng()<.12,h=mid?R(50,95):R(9,42);
    lows.push({x,z,w,d:dd,h,rad,rot:rng()*Math.PI,c:pick(lowCols),roof:rng()});
  }
}
function residentialMaterial(){
  const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.75,metalness:.05});
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
      .replace('#include <project_vertex>','#include <project_vertex>\nvec4 wpp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nwpp=instanceMatrix*wpp;\nvWN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*objectNormal);\n#else\nvWN=normalize(mat3(modelMatrix)*objectNormal);\n#endif\nvWP=(modelMatrix*wpp).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        float side=1.0-step(.7,abs(vWN.y));
        float fl=fract((vWP.y-3.0)/3.3);
        float col=fract((vWP.x+vWP.z)/4.2);
        float win=step(.32,fl)*(1.0-step(.78,fl))*step(.18,col)*(1.0-step(.82,col));
        float slab=1.0-step(.1,fl);
        float fade=smoothstep(350.0,1800.0,length(vWP-cameraPosition));
        win=mix(win,.3,fade)*side;slab=mix(slab,.1,fade)*side;
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.10,.13,.17),win*.85);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0),slab*.35);`)
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.18,win);');
  };
  return m;
}
const resMat=residentialMaterial();
{
  const lm=new THREE.InstancedMesh(unitBox,resMat,lows.length),M4=new THREE.Matrix4();
  lows.forEach((L,i)=>{lm.setMatrixAt(i,mat4(L.x,3,L.z,L.w,L.h,L.d,0,L.rot,0));lm.setColorAt(i,L.c);});
  lm.castShadow=lm.receiveShadow=true;scene.add(lm);
  // rooftops: gardens, plant rooms, solar arrays
  const gardens=[],plant=[],solar=[];
  for(const L of lows){const top=3+L.h;
    if(L.roof<.42)gardens.push(mat4(L.x,top,L.z,L.w*.88,1.6,L.d*.88,0,L.rot,0));
    else if(L.roof<.7)plant.push(mat4(L.x+R(-2,2),top,L.z+R(-2,2),L.w*R(.3,.5),R(2.5,5),L.d*R(.3,.5),0,L.rot,0));
    else if(L.roof<.86)solar.push(mat4(L.x,top+.6,L.z,L.w*.8,.5,L.d*.8,R(-.25,-.15),L.rot,0));}
  const gm=instanced(unitBox,new THREE.MeshStandardMaterial({color:C(0x5f8f45),roughness:.95}),gardens);gm.receiveShadow=true;
  const pm=instanced(unitBox,new THREE.MeshStandardMaterial({color:C(0x9aa3ad),roughness:.6,metalness:.3}),plant);pm.castShadow=true;
  instanced(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:C(0x1d2a44),roughness:.25,metalness:.6}),solar);
  lifeTrees(gardens);
}
// street trees, park trees, roof-garden trees
function lifeTrees(gardens){
  const con=[],brd=[],cc=[],bc=[],greens=[0x3d6b30,0x4f7d36,0x5a8a3b,0x46742f,0x6a9442,0x7d9a3a].map(C);
  const addT=(x,y,z,s)=>{if(rng()<.35){con.push(mat4(x,y,z,4*s,R(10,16)*s,4*s,0,0,0));cc.push(pick(greens));}else{brd.push(mat4(x,y+R(4,6)*s,z,R(6,9)*s,R(6,8)*s,R(6,9)*s,0,rng()*3,0));bc.push(pick(greens));}};
  for(const K of parks){const n=Math.floor(K.r*K.r/90*lifeQ);for(let i=0;i<n;i++){const a=rng()*6.283,d=Math.sqrt(rng())*K.r*.92;addT(K.x+Math.cos(a)*d,3,K.z+Math.sin(a)*d,R(.8,1.4));}}
  for(const P of PLATS){const rr=P.r*(ROAD_IN-.025),n=Math.floor(rr*6.283/26);
    for(let i=0;i<n;i++){const a=i/n*6.283,x=P.x+Math.cos(a)*rr,z=P.z+Math.sin(a)*rr;if(freeOf(x,z,3))addT(x,3,z,R(.7,1));}}
  for(const g of gardens){if(rng()<.5){const p=new THREE.Vector3().setFromMatrixPosition(g);addT(p.x+R(-3,3),p.y+1.6,p.z+R(-3,3),R(.4,.6));}}
  const cm=new THREE.InstancedMesh(new THREE.ConeGeometry(.5,1,7).translate(0,.5,0),new THREE.MeshStandardMaterial({roughness:.9}),con.length);
  con.forEach((m,i)=>{cm.setMatrixAt(i,m);cm.setColorAt(i,cc[i]);});cm.castShadow=true;scene.add(cm);
  const bm=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.5,1),new THREE.MeshStandardMaterial({roughness:.9,flatShading:true}),brd.length);
  brd.forEach((m,i)=>{bm.setMatrixAt(i,m);bm.setColorAt(i,bc[i]);});bm.castShadow=true;scene.add(bm);
}
// painted ground for every platform: plaza paving, parks, the ring road, foam where it meets the sea
const groundMats=[];
for(const P of PLATS){
  const S=coarse?256:512,cv=document.createElement('canvas');cv.width=cv.height=S;const x2=cv.getContext('2d');
  const to=(x,z)=>[((x-P.x)/(2*P.r)+.5)*S,(1-((z-P.z)/(2*P.r)+.5))*S],px=r=>r/(2*P.r)*S;
  x2.fillStyle='#8e8a83';x2.fillRect(0,0,S,S);
  for(let i=0;i<S*S/90;i++){const v=110+(rng()*50|0);x2.fillStyle=`rgba(${v},${v-4},${v-12},.35)`;x2.fillRect(rng()*S,rng()*S,1+rng()*2,1+rng()*2);}
  x2.strokeStyle='rgba(120,112,100,.35)';x2.lineWidth=1;const step=px(12);
  for(let g=0;g<S;g+=step){x2.beginPath();x2.moveTo(g,0);x2.lineTo(g,S);x2.stroke();x2.beginPath();x2.moveTo(0,g);x2.lineTo(S,g);x2.stroke();}
  const [cx,cy]=to(P.x,P.z);
  x2.lineWidth=px(P.r*(ROAD_OUT-ROAD_IN));x2.strokeStyle='#2f3337';x2.beginPath();x2.arc(cx,cy,px(P.r*(ROAD_IN+ROAD_OUT)/2),0,6.283);x2.stroke();
  x2.lineWidth=Math.max(1,px(.6));x2.strokeStyle='#e8d48a';x2.setLineDash([px(5),px(5)]);x2.beginPath();x2.arc(cx,cy,px(P.r*(ROAD_IN+ROAD_OUT)/2),0,6.283);x2.stroke();x2.setLineDash([]);
  for(const K of parks){if(K.P!==P)continue;const [kx,ky]=to(K.x,K.z);
    x2.fillStyle='#6e9a4c';x2.beginPath();x2.arc(kx,ky,px(K.r),0,6.283);x2.fill();
    x2.strokeStyle='#d9cfb5';x2.lineWidth=Math.max(1,px(2.2));x2.beginPath();x2.arc(kx,ky,px(K.r*.55),0,6.283);x2.stroke();
    x2.beginPath();x2.moveTo(kx-px(K.r),ky);x2.lineTo(kx+px(K.r),ky);x2.stroke();
    x2.fillStyle='#5f93b8';x2.beginPath();x2.arc(kx+px(K.r*.35),ky-px(K.r*.3),px(K.r*.16),0,6.283);x2.fill();}
  const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const geo=new THREE.CircleGeometry(P.r*.995,72);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/(2*P.r)+.5,1-(pos.getZ(i)/(2*P.r)+.5));
  const mat=new THREE.MeshStandardMaterial({map:tex,roughness:.92});groundMats.push(mat);
  const g=new THREE.Mesh(geo,mat);g.position.set(P.x,3.06,P.z);g.receiveShadow=true;scene.add(g);
  const foam=new THREE.Mesh(new THREE.CylinderGeometry(P.r*1.07,P.r*1.07,.4,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.28,depthWrite:false}));
  foam.position.set(P.x,.3,P.z);foam.rotation.y=P.rot;foam.renderOrder=1;scene.add(foam);P.foam=foam;
}
// ring-road traffic
const carGeo=(()=>{const m=new Merger(),w=C(0xffffff);m.add(boxUV(2,1.1,4.6,4),M(0,.55,0),w);m.add(boxUV(1.7,.8,2.4,4),M(0,1.4,.2),C(0x30363e));return m.build();})();
const carCols=[0xe8eaec,0x1c2026,0xb3241f,0x2f5f9e,0xd9b44a,0x8a9199,0x3f7f5a,0xf2f2f2].map(C);
const cars=[];for(const P of PLATS){const n=Math.floor(P.r/(P.tier===0?11:15)*lifeQ);
  for(let i=0;i<n;i++){const lane=rng()<.5?0:1;cars.push({P,a:rng()*6.283,r:P.r*(ROAD_IN+.02+lane*.045),w:(lane?1:-1)*R(12,22)/P.r});}}
const carMesh=new THREE.InstancedMesh(carGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.5}),cars.length);
cars.forEach((c,i)=>carMesh.setColorAt(i,pick(carCols)));carMesh.castShadow=true;scene.add(carMesh);
// people on plazas: small figures that wander around a spot
const peeps=[],PN=Math.floor((coarse?260:600));
for(let t=0;t<PN*8&&peeps.length<PN;t++){const P=rng()<.5?PLATS[0]:pick(PLATS),a=rng()*6.283,d=Math.sqrt(rng())*P.r*.85,x=P.x+Math.cos(a)*d,z=P.z+Math.sin(a)*d;
  if(!freeOf(x,z,2))continue;peeps.push({cx:x,cz:z,x,z,dir:rng()*6.283,sp:R(1,1.6),ph:rng()*6});}
const peepGeo=(()=>{const m=new Merger();m.add(new THREE.CylinderGeometry(.24,.3,1.15,6),M(0,.58,0),C(0xffffff));m.add(new THREE.SphereGeometry(.17,6,5),M(0,1.42,0),C(0xe3b896));m.add(boxUV(.42,.6,.3,1),M(0,.95,0),C(0xffffff));return m.build();})();
const peepMesh=new THREE.InstancedMesh(peepGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}),peeps.length);
const clothes=[0x2b4c7e,0xc0392b,0xf2f2f2,0x27ae60,0xf1c40f,0x34495e,0x8e44ad,0xe67e22,0x1abc9c].map(C);
peeps.forEach((p,i)=>peepMesh.setColorAt(i,pick(clothes)));scene.add(peepMesh);
// Oct 25: the plaza crowds wear Bryce's Keeper civilian, baked standing in its smallest version (about 800 triangles), the clothes colours kept as a light tint
if(typeof MODELS!=='undefined'&&MODELS.statue){const cl=clothes.map(c=>c.clone().lerp(C(0xffffff),.55));peeps.forEach((p,i)=>peepMesh.setColorAt(i,pick(cl)));
  MODELS.statue('keepers-civilian',{h:1.65,aim:0,unarmed:true,lod:'far'}).then(S=>{peepMesh.geometry=S.geometry;peepMesh.material=S.material;if(peepMesh.instanceColor)peepMesh.instanceColor.needsUpdate=true;}).catch(e=>console.warn('civilian statue',e&&e.message));}
// boats: ferries and yachts circling the districts, with white wakes; moored boats at small piers
function boatGeo(){const m=new Merger(),wht=C(0xf4f6f8),navy=C(0x22344d),dk=C(0x1a1f26);
  m.add(boxUV(6,2.2,20,4),M(0,1.1,0),wht);const bow=new THREE.CylinderGeometry(.2,3,7,4,1);bow.rotateY(Math.PI/4);bow.rotateX(-Math.PI/2);m.add(bow,M(0,1.1,-13.4),wht);
  m.add(boxUV(6.1,.6,20.2,4),M(0,.3,0),navy);m.add(boxUV(4.4,2,8,4),M(0,3.2,1.5),wht);m.add(boxUV(4.5,.7,8.1,4),M(0,3.4,1.5),dk);return m.build();}
const wakeTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;
  x.beginPath();x.moveTo(26,0);x.lineTo(38,0);x.lineTo(64,256);x.lineTo(0,256);x.closePath();x.fill();return new THREE.CanvasTexture(c);})();
const boats=[],BG=boatGeo(),boatMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.2});
const wakeMat=new THREE.MeshBasicMaterial({map:wakeTex,transparent:true,opacity:.6,depthWrite:false});
for(let i=0;i<(coarse?12:20);i++){const P=pick(PLATS),s=R(.9,2.6),g=new THREE.Group();
  g.add(new THREE.Mesh(BG,boatMat));const wk=new THREE.Mesh(new THREE.PlaneGeometry(1,1),wakeMat);wk.rotation.x=-Math.PI/2;wk.position.set(0,.2,10+40);wk.scale.set(16,80,1);g.add(wk);
  g.scale.setScalar(s);scene.add(g);boats.push({g,P,r:P.r*1.07+R(30,140),a:rng()*6.283,w:(rng()<.5?1:-1)*R(7,16)/(P.r+80),bob:rng()*6});}
{const piers=[],moored=[];
 for(const P of PLATS){for(let k=0;k<(P.tier===0?4:2);k++){const a=rng()*6.283,x=P.x+Math.cos(a)*P.r*.9,z=P.z+Math.sin(a)*P.r*.9;
   piers.push(mat4(x+Math.cos(a)*35,1.2,z+Math.sin(a)*35,6,1.6,80,0,Math.atan2(Math.cos(a),Math.sin(a)),0));
   for(const s of[-1,1]){const ox=-Math.sin(a)*s*10,oz=Math.cos(a)*s*10,d=R(18,60);moored.push(mat4(x+Math.cos(a)*d+ox,0,z+Math.sin(a)*d+oz,R(.6,1.2),R(.6,1.2),R(.6,1.2),0,Math.atan2(Math.cos(a),Math.sin(a)),0));}}}
 instanced(new THREE.BoxGeometry(1,1,1),baseMat,piers);
 const mm=new THREE.InstancedMesh(BG,boatMat,moored.length);moored.forEach((m,i)=>mm.setMatrixAt(i,m));scene.add(mm);}
// lit signs on tower faces
{const signs=[],sc=[];const cols=[0xff4fa3,0x4fe3ff,0xffb347,0x7dff9a,0xb48cff].map(c=>C(c).multiplyScalar(1.8));
 for(const T of towers){if(T.kind!=='box'||rng()>.22)continue;const face=(rng()*4)|0,ang=T.rot+face*Math.PI/2,h=3+T.h*R(.08,.5),w=T.fp*R(.4,.7),hh=R(6,18);
   signs.push(mat4(T.x+Math.sin(ang)*(T.fp/2+.6),h,T.z+Math.cos(ang)*(T.fp/2+.6),w,hh,.6,0,ang,0));sc.push(pick(cols));}
 const sm=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff}),signs.length);
 signs.forEach((m,i)=>{sm.setMatrixAt(i,m);sm.setColorAt(i,sc[i]);});scene.add(sm);}
const _lm=new THREE.Matrix4(),_lq=new THREE.Quaternion(),_le=new THREE.Euler(),_lp=new THREE.Vector3(),_ls=new THREE.Vector3(1,1,1);
let lifeFrame=0;
function updateLife(dt,t){
  lifeFrame++;
  for(let i=0;i<cars.length;i++){const c=cars[i];c.a+=c.w*dt;const x=c.P.x+Math.cos(c.a)*c.r,z=c.P.z+Math.sin(c.a)*c.r;
    {const sg=Math.sign(c.w);_le.set(0,Math.atan2(Math.sin(c.a)*sg,-Math.cos(c.a)*sg),0);}_lq.setFromEuler(_le);
    carMesh.setMatrixAt(i,_lm.compose(_lp.set(x,3.1,z),_lq,_ls));}
  carMesh.instanceMatrix.needsUpdate=true;
  const near=Math.hypot(camera.position.x,camera.position.z)<3500&&camera.position.y<900;
  if(near||lifeFrame%6===0){
    for(let i=0;i<peeps.length;i++){const p=peeps[i];p.dir+=Math.sin(t*.7+p.ph)*.9*dt;
      p.x+=Math.sin(p.dir)*p.sp*dt*(near?1:6);p.z+=Math.cos(p.dir)*p.sp*dt*(near?1:6);
      const dx=p.x-p.cx,dz=p.z-p.cz;if(dx*dx+dz*dz>196){p.dir=Math.atan2(-dx,-dz);}
      _le.set(0,p.dir,0);_lq.setFromEuler(_le);peepMesh.setMatrixAt(i,_lm.compose(_lp.set(p.x,3.06+Math.abs(Math.sin(t*6+p.ph))*.05,p.z),_lq,_ls.set(1,1,1)));}
    peepMesh.instanceMatrix.needsUpdate=true;}
  for(const b of boats){b.a+=b.w*dt;const x=b.P.x+Math.cos(b.a)*b.r,z=b.P.z+Math.sin(b.a)*b.r,sg=Math.sign(b.w);
    b.g.position.set(x,Math.sin(t*1.3+b.bob)*.25,z);b.g.rotation.set(Math.sin(t*1.1+b.bob)*.02,Math.atan2(Math.sin(b.a)*sg,-Math.cos(b.a)*sg),0);}
  for(const P of PLATS)P.foam.material.opacity=.22+.08*Math.sin(t*1.4+P.x*.01);
}
