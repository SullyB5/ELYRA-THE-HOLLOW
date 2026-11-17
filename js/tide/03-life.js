/* Tide City · life */
/* ---------- city life: ground plazas and parks, low-rise homes, roof gardens, street trees, ring-road traffic, people, boats, signs ---------- */
const lows=[],parks=[];
const ROAD_IN=.88,ROAD_OUT=.97;
const lifeQ=coarse?.6:1;
function freeOf(x,z,rad){
  if(Math.hypot(x-SPEAR.x,z-SPEAR.z)<SPEAR.clear-20+rad)return false;   // the Spear's plinth
  for(const T of towers){const d=Math.hypot(x-T.x,z-T.z);if(d<T.fp*.72+rad)return false;}
  for(const T of towersGone){const d=Math.hypot(x-T.x,z-T.z);if(d<T.fp*.72+rad)return false;}   // (Nov 8) a left-out tower's ground stays open
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
const resMat=TOWER_LOOK(new THREE.MeshStandardMaterial({color:0xffffff}),{far:[400,2200]});   // Nov 16: the same facades as the towers
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
// painted ground for every platform (Nov 16 2026, rebuilt: Bryce said the ground looked flat, one colour). City blocks now: every tower
// and building stands on its own sidewalk inside a street that runs round it, the streets joining wherever buildings stand close;
// open ground left between them is lawn; parks with paths and ponds; a paved plaza round the Spear; the ring road with its lines.
// The paint is the layout; js/shared/ground-detail.js puts slabs, asphalt grit and grass on it up close. Its own random numbers,
// so the city's layout (seeded) does not move.
const groundMats=[],GROUND_PAINT=[];
{let gs=55117;const gr=()=>((gs=(gs*16807)%2147483647)-1)/2147483646,GR=(a,b)=>a+(b-a)*gr();
 for(const P of PLATS){
  const S=P.tier===0?(coarse?1024:2048):(coarse?512:1024),cv=document.createElement('canvas');cv.width=cv.height=S;const x2=cv.getContext('2d');
  const to=(x,z)=>[((x-P.x)/(2*P.r)+.5)*S,(1-((z-P.z)/(2*P.r)+.5))*S],px=r=>r/(2*P.r)*S;
  const on=(o,pad)=>Math.hypot(o.x-P.x,o.z-P.z)<P.r+pad;
  // lawn under everything, in soft patches of greens
  x2.fillStyle='#4f6e3a';x2.fillRect(0,0,S,S);
  for(let i=0;i<S*1.2;i++){const [cx,cy]=[gr()*S,gr()*S],r=GR(4,40)*S/1024,g=x2.createRadialGradient(cx,cy,0,cx,cy,r),c=gr()<.5?'88,118,60':gr()<.5?'60,92,48':'110,120,70';
    g.addColorStop(0,`rgba(${c},.35)`);g.addColorStop(1,`rgba(${c},0)`);x2.fillStyle=g;x2.fillRect(cx-r,cy-r,r*2,r*2);}
  const shape=(o,grow,fill)=>{const [cx,cy]=to(o.x,o.z);x2.save();x2.translate(cx,cy);x2.rotate(o.rot||0);x2.fillStyle=fill;
    if(o.round){x2.beginPath();x2.arc(0,0,px(o.w/2+grow),0,6.283);x2.fill();}
    else{const w=px(o.w+grow*2),d=px(o.d+grow*2),rr=Math.min(px(grow*.8),w/2,d/2);x2.beginPath();
      if(x2.roundRect)x2.roundRect(-w/2,-d/2,w,d,rr);else x2.rect(-w/2,-d/2,w,d);x2.fill();}
    x2.restore();};
  const blocks=[];
  for(const T of towers)if(on(T,60))blocks.push({x:T.x,z:T.z,w:T.fp,d:T.fp,rot:T.rot,round:T.kind!=='box',st:15,sw:6});
  for(const L of lows)if(on(L,30))blocks.push({x:L.x,z:L.z,w:L.w,d:L.d,rot:L.rot,st:10,sw:4});
  // streets (the union of a band round every building), their kerbs, then the sidewalks, then the buildings' footings
  for(const B of blocks)shape(B,B.st+B.sw+.6,'#8d8a83');
  for(const B of blocks)shape(B,B.st+B.sw,'#2f3236');
  for(const B of blocks)shape(B,B.sw+.5,'#b9b3a6');
  for(const B of blocks)shape(B,B.sw,'#a39e93');
  for(const B of blocks)shape(B,.8,'#55534f');
  // lane lines: a dashed line half way out in each street band (where streets meet the lines simply run on)
  x2.strokeStyle='rgba(230,214,150,.55)';x2.lineWidth=Math.max(1,px(.35));x2.setLineDash([px(3),px(4)]);
  for(const B of blocks){if(B.st<12)continue;const [cx,cy]=to(B.x,B.z),g=B.sw+B.st*.5;x2.save();x2.translate(cx,cy);x2.rotate(B.rot||0);x2.beginPath();
    if(B.round)x2.arc(0,0,px(B.w/2+g),0,6.283);else x2.rect(-px(B.w/2+g),-px(B.d/2+g),px(B.w+g*2),px(B.d+g*2));x2.stroke();x2.restore();}
  x2.setLineDash([]);
  // crosswalks at the corners of the bigger blocks
  x2.fillStyle='rgba(225,225,215,.7)';
  for(const B of blocks){if(B.round||B.st<12||gr()<.5)continue;const [cx,cy]=to(B.x,B.z),g=B.sw+B.st*.5;x2.save();x2.translate(cx,cy);x2.rotate(B.rot||0);
    for(const sx of[-1,1]){const x0=B.w/2+B.sw+1;for(let k=0;k*1.3<B.st-2;k++){const xx=sx>0?x0+k*1.3:-(x0+k*1.3)-.7;x2.fillRect(px(xx),-px(2),px(.7),px(4));}}
    x2.restore();}
  // the Spear's plaza: rings of paving and a mosaic of Keeper gold
  if(P.tier===0){const [cx,cy]=to(SPEAR.x,SPEAR.z);
    x2.fillStyle='#b8b1a2';x2.beginPath();x2.arc(cx,cy,px(SPEAR.clear-8),0,6.283);x2.fill();
    for(let k=1;k<9;k++){x2.strokeStyle=k%3?'rgba(120,110,95,.5)':'rgba(205,165,80,.7)';x2.lineWidth=px(k%3?.6:1.6);x2.beginPath();x2.arc(cx,cy,px(SPEAR.clear*k/9.5),0,6.283);x2.stroke();}
    for(let k=0;k<24;k++){const a=k/24*6.283;x2.strokeStyle='rgba(120,110,95,.45)';x2.lineWidth=px(.6);x2.beginPath();x2.moveTo(cx+Math.cos(a)*px(40),cy+Math.sin(a)*px(40));x2.lineTo(cx+Math.cos(a)*px(SPEAR.clear-10),cy+Math.sin(a)*px(SPEAR.clear-10));x2.stroke();}
    for(let k=0;k<6;k++){const a=k/6*6.283+.26;x2.fillStyle='#2f3236';x2.save();x2.translate(cx,cy);x2.rotate(a);x2.fillRect(px(SPEAR.clear-14),-px(9),px(P.r*.9-SPEAR.clear),px(18));x2.restore();}}   // avenues out to the ring road
  // the parks: lawn, a loop path and a cross path, a pond, flower beds
  for(const K of parks){if(K.P!==P)continue;const [kx,ky]=to(K.x,K.z);
    x2.fillStyle='#b9b3a6';x2.beginPath();x2.arc(kx,ky,px(K.r+3),0,6.283);x2.fill();
    x2.fillStyle='#5b8442';x2.beginPath();x2.arc(kx,ky,px(K.r),0,6.283);x2.fill();
    for(let i=0;i<40;i++){const a=gr()*6.283,d=Math.sqrt(gr())*K.r,r=GR(1.5,5);x2.fillStyle=gr()<.5?'rgba(70,110,50,.6)':'rgba(120,150,70,.5)';x2.beginPath();x2.arc(kx+Math.cos(a)*px(d),ky+Math.sin(a)*px(d),px(r),0,6.283);x2.fill();}
    x2.strokeStyle='#cfc4a8';x2.lineWidth=Math.max(1,px(2.6));x2.beginPath();x2.arc(kx,ky,px(K.r*.58),0,6.283);x2.stroke();
    x2.beginPath();x2.moveTo(kx-px(K.r),ky);x2.lineTo(kx+px(K.r),ky);x2.moveTo(kx,ky-px(K.r));x2.lineTo(kx,ky+px(K.r));x2.stroke();
    for(let i=0;i<4;i++){const a=i/4*6.283+.78;x2.fillStyle=['#c86a8a','#e0b84a','#b05ad0','#e07a4a'][i];x2.beginPath();x2.arc(kx+Math.cos(a)*px(K.r*.3),ky+Math.sin(a)*px(K.r*.3),px(2.4),0,6.283);x2.fill();}
    x2.fillStyle='#3d6f8e';x2.beginPath();x2.ellipse(kx+px(K.r*.35),ky-px(K.r*.3),px(K.r*.18),px(K.r*.13),.4,0,6.283);x2.fill();
    x2.strokeStyle='rgba(200,190,160,.8)';x2.lineWidth=px(.8);x2.stroke();}
  // the ring road: kerbs, two lanes each way, the centre line
  {const [cx,cy]=to(P.x,P.z),mid=P.r*(ROAD_IN+ROAD_OUT)/2,wd=P.r*(ROAD_OUT-ROAD_IN);
   x2.lineWidth=px(wd+5);x2.strokeStyle='#a39e93';x2.beginPath();x2.arc(cx,cy,px(mid),0,6.283);x2.stroke();
   x2.lineWidth=px(wd);x2.strokeStyle='#2c2f33';x2.beginPath();x2.arc(cx,cy,px(mid),0,6.283);x2.stroke();
   x2.lineWidth=Math.max(1,px(.4));x2.strokeStyle='rgba(240,240,230,.6)';x2.setLineDash([px(4),px(6)]);
   for(const f of[-.25,.25]){x2.beginPath();x2.arc(cx,cy,px(mid+wd*f),0,6.283);x2.stroke();}
   x2.setLineDash([]);x2.strokeStyle='#e8c860';x2.lineWidth=Math.max(1,px(.5));x2.beginPath();x2.arc(cx,cy,px(mid-.4),0,6.283);x2.stroke();x2.beginPath();x2.arc(cx,cy,px(mid+.4),0,6.283);x2.stroke();
   // the sea wall: a stone promenade outside the road
   x2.lineWidth=px(P.r*(1-ROAD_OUT)+2);x2.strokeStyle='#bdb6a8';x2.beginPath();x2.arc(cx,cy,px(P.r*(1+ROAD_OUT)/2+1),0,6.283);x2.stroke();}
  GROUND_PAINT.push({P,x2,S,to});
  const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const geo=new THREE.CircleGeometry(P.r*.995,96);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/(2*P.r)+.5,1-(pos.getZ(i)/(2*P.r)+.5));
  const mat=GROUND_DETAIL(new THREE.MeshStandardMaterial({map:tex,roughness:.92}));groundMats.push(mat);
  const g=new THREE.Mesh(geo,mat);g.position.set(P.x,3.06,P.z);g.receiveShadow=true;scene.add(g);
  const foam=new THREE.Mesh(new THREE.CylinderGeometry(P.r*1.07,P.r*1.07,.4,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.28,depthWrite:false}));
  foam.position.set(P.x,.3,P.z);foam.rotation.y=P.rot;foam.renderOrder=1;scene.add(foam);P.foam=foam;
 }
 // what the paint says is lawn gets bushes, hedges and grass tufts; the sidewalks get street lamps
 const bush=[],bushC=[],tuft=[],lamps=[],lampTop=[];const greens=[0x3d6b30,0x4f7d36,0x5a8a3b,0x46742f,0x2f5a2c].map(C);
 for(const G of GROUND_PAINT){const {P,x2,S}=G,img=x2.getImageData(0,0,S,S).data,nB=Math.round((P.tier===0?1600:420)*lifeQ),nT=Math.round((P.tier===0?2600:700)*lifeQ);
   const pix=(x,z)=>{const u=Math.round(((x-P.x)/(2*P.r)+.5)*S),v=Math.round((1-((z-P.z)/(2*P.r)+.5))*S);if(u<0||v<0||u>=S||v>=S)return null;const k=(v*S+u)*4;return[img[k],img[k+1],img[k+2]];};
   const isLawn=c=>c&&c[1]>c[0]+10&&c[1]>c[2]+10;
   for(let t=0,n=0;t<nB*6&&n<nB;t++){const a=gr()*6.283,d=Math.sqrt(gr())*P.r*.93,x=P.x+Math.cos(a)*d,z=P.z+Math.sin(a)*d;if(!isLawn(pix(x,z)))continue;
     const s=GR(1.2,3.2);bush.push(mat4(x,3+s*.35,z,s*GR(1,1.6),s*.8,s*GR(1,1.6),0,gr()*3,0));bushC.push(pick(greens));n++;}
   for(let t=0,n=0;t<nT*5&&n<nT;t++){const a=gr()*6.283,d=Math.sqrt(gr())*P.r*.93,x=P.x+Math.cos(a)*d,z=P.z+Math.sin(a)*d;if(!isLawn(pix(x,z)))continue;
     const s=GR(.6,1.3);tuft.push(mat4(x,3.05,z,s,s*GR(.7,1.4),s,0,gr()*3,0));n++;}}
 for(const T of towers){if(T.kind!=='box')continue;const g=T.fp/2+4.5,c=Math.cos(T.rot),sn=Math.sin(T.rot);
   for(const[lx,lz]of[[g,g],[-g,g],[g,-g],[-g,-g]]){const x=T.x+lx*c+lz*sn,z=T.z-lx*sn+lz*c;lamps.push(mat4(x,3,z,.35,9,.35,0,0,0));lampTop.push(x,12.3,z);}}
 if(bush.length){const bm=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.5,1),new THREE.MeshStandardMaterial({roughness:.95,flatShading:true}),bush.length);
   bush.forEach((m,i)=>{bm.setMatrixAt(i,m);bm.setColorAt(i,bushC[i]);});bm.castShadow=true;bm.receiveShadow=true;scene.add(bm);}
 if(tuft.length){const tg=new THREE.BufferGeometry(),tp=[];   // a tuft: three crossed blades
   for(let k=0;k<3;k++){const a=k/3*Math.PI,cx=Math.cos(a)*.5,cz=Math.sin(a)*.5;tp.push(-cx,0,-cz, cx,0,cz, 0,1,0);}
   tg.setAttribute('position',new THREE.Float32BufferAttribute(tp,3));tg.computeVertexNormals();
   const tm=new THREE.InstancedMesh(tg,new THREE.MeshStandardMaterial({color:C(0x5f8a3e),roughness:1,side:THREE.DoubleSide}),tuft.length);tuft.forEach((m,i)=>tm.setMatrixAt(i,m));scene.add(tm);}
 if(lamps.length){const lm=new THREE.InstancedMesh(unitBox,new THREE.MeshStandardMaterial({color:C(0x3a4048),roughness:.5,metalness:.6}),lamps.length);lamps.forEach((m,i)=>lm.setMatrixAt(i,m));scene.add(lm);
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lampTop,3));
   scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:9,map:glow,color:C(0xffd9a0).multiplyScalar(1.5),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));}
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
