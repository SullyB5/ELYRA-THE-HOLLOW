/* Tide City · city */
/* ---------- city ---------- */
function bandedMaterial(){
  const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.15});
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>','#include <project_vertex>\nvec4 wpp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nwpp=instanceMatrix*wpp;\n#endif\nvWP=(modelMatrix*wpp).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        float fl=fract(vWP.y/4.4);
        float glass=smoothstep(.06,.1,fl)*(1.0-smoothstep(.66,.7,fl));
        float fade=smoothstep(500.0,2800.0,length(vWP-cameraPosition));
        float cell=fract((vWP.x+vWP.z)/3.6);
        glass*=1.0-step(cell,.08)*(1.0-fade);
        glass=mix(glass,.6,fade);
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.16,.34,.48)+vec3(.02,.05,.08),glass*.9);`)
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.22,glass);');
  };
  return m;
}
const towerMat=bandedMaterial();
const metalMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35,metalness:.35});
const baseMat=new THREE.MeshStandardMaterial({color:C(0x7c8792),roughness:.85,metalness:.1});
const accentMat=new THREE.MeshStandardMaterial({color:C(0xdff7ff),emissive:C(0x39c6ff),emissiveIntensity:.9,roughness:.3});

const CS=1.65,CS_TRY=coarse?1.25:1.5;   // city scale; more towers per district so the bigger platforms stay dense
const PLATS=[{x:0,z:0,r:340*CS,tier:0}];
for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3;PLATS.push({x:Math.cos(a)*650*CS,z:Math.sin(a)*650*CS,r:R(170,240)*CS,tier:1});}
for(let k=1;k<7;k++){const a=Math.PI*1.5+k/7*Math.PI*2;const d=R(1050,1250)*CS;PLATS.push({x:Math.cos(a)*d,z:Math.sin(a)*d,r:R(130,200)*CS,tier:2});}

const towers=[],tw={box:[],cyl:[],hex:[]},spires=[],decks=[],bridges=[],plats=[];
// the Spear of Destiny stands at the centre of the core; towers there are generated (so the random layout of the rest stays put) but never built
const SPEAR={x:0,z:0,clear:150};const _nope=[];
const tints=[0xffffff,0xeef3f7,0xe2ebf2,0xd7e6ee,0xf3efe6,0xcfe0e8,0xe9dcc9,0xd8e4dc,0xc3d3e3,0xe6d2bd].map(C);


for(const P of PLATS){
  P.rot=R(0,1);plats.push(mat4(P.x,0,P.z,P.r,6,P.r,0,P.rot,0));
  const hMax=(P.tier===0?880:P.tier===1?460:260)*1.3,hMin=(P.tier===0?120:P.tier===1?70:45)*1.3;
  const placed=[];
  for(let t=0;t<Math.round((P.tier===0?560:300)*CS_TRY);t++){
    const a=rng()*Math.PI*2,d=Math.sqrt(rng())*(P.r*.84-30),x=P.x+Math.cos(a)*d,z=P.z+Math.sin(a)*d;
    const fp=R(16,P.tier===0?60:46);
    if(placed.some(o=>Math.hypot(o.x-x,o.z-z)<o.fp/2+fp/2+10))continue;
    const centr=1-d/P.r,h=hMin+Math.pow(rng(),1.7)*(hMax-hMin)*(.45+.55*centr);
    const T={x,z,fp,h,kind:pick(['box','box','cyl','hex']),tint:pick(tints),rot:rng()*Math.PI};
    if(P.tier===0&&Math.hypot(x-SPEAR.x,z-SPEAR.z)<SPEAR.clear+fp/2)T.hidden=true;
    placed.push(T);towers.push(T);
  }
}
for(const T of towers){
  const h1=T.h*R(.55,.8),h2=T.h*R(.82,.95),{x,z,fp,kind,rot}=T;
  const kindArr=T.hidden?_nope:tw[kind];
  T.parts=[];
  for(const it of[{m:mat4(x,3,z,fp,h1,fp,0,rot,0),c:T.tint},{m:mat4(x,3+h1,z,fp*.76,h2-h1,fp*.76,0,rot,0),c:T.tint},{m:mat4(x,3+h2,z,fp*.5,T.h-h2,fp*.5,0,rot,0),c:T.tint}]){
    if(!T.hidden)T.parts.push({list:kind,i:kindArr.length,m:it.m});kindArr.push(it);}
  if(rng()<.5){T.spire=true;const sm=mat4(x,3+T.h,z,fp*.1,T.h*R(.1,.28),fp*.1,0,rot,0);if(!T.hidden)T.parts.push({list:'spire',i:spires.length,m:sm});(T.hidden?_nope:spires).push(sm);}
  const nd=rng()<.45?(rng()<.4?2:1):0;
  for(let i=0;i<nd;i++){const dh=T.h*R(.25,.85),dm=mat4(x,3+dh,z,fp*R(.75,1.05),R(2,4),fp*R(.75,1.05),0,0,0);if(!T.hidden)T.parts.push({list:'deck',i:decks.length,m:dm});(T.hidden?_nope:decks).push(dm);}
}
// skybridges between nearby towers: the in-between layers
for(let i=0;i<towers.length;i++){const A=towers[i];if(rng()>.32)continue;
  let best=null,bd=1e9;for(const B of towers){if(B===A)continue;const d=Math.hypot(A.x-B.x,A.z-B.z);if(d<bd&&d<110){bd=d;best=B;}}
  if(!best)continue;
  const nb=rng()<.35?2:1;
  for(let k=0;k<nb;k++){const y=Math.min(A.h,best.h)*R(.2,.75),mx=(A.x+best.x)/2,mz=(A.z+best.z)/2,ang=Math.atan2(best.x-A.x,best.z-A.z);
    (A.hidden||best.hidden?_nope:bridges).push(mat4(mx,y,mz,R(4,7),R(3,5),bd,0,ang,0));}
}
for(let i=towers.length-1;i>=0;i--)if(towers[i].hidden)towers.splice(i,1);
// long sea causeways between platforms
const causeways=[];
for(let i=1;i<PLATS.length;i++){const P=PLATS[i];const Q=P.tier===1?PLATS[0]:PLATS.filter(p=>p.tier===1).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0];
  const d=Math.hypot(P.x-Q.x,P.z-Q.z),ang=Math.atan2(P.x-Q.x,P.z-Q.z);
  causeways.push(mat4((P.x+Q.x)/2,R(18,40),(P.z+Q.z)/2,R(16,26),5,d,0,ang,0));}

function instanced(geo,material,list,cast){
  const mesh=new THREE.InstancedMesh(geo,material,list.length);
  list.forEach((it,i)=>{if(it.m){mesh.setMatrixAt(i,it.m);mesh.setColorAt(i,it.c);}else mesh.setMatrixAt(i,it);});
  scene.add(mesh);return mesh;
}
const unitBox=new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
const TWM={box:instanced(unitBox,towerMat,tw.box),cyl:instanced(new THREE.CylinderGeometry(.5,.5,1,10).translate(0,.5,0),towerMat,tw.cyl),hex:instanced(new THREE.CylinderGeometry(.5,.5,1,6).translate(0,.5,0),towerMat,tw.hex)};
for(const tm of Object.values(TWM))tm.castShadow=tm.receiveShadow=true;
TWM.spire=instanced(new THREE.ConeGeometry(.5,1,6).translate(0,.5,0),metalMat,spires);
TWM.deck=instanced(new THREE.CylinderGeometry(.5,.5,1,28),metalMat,decks);
instanced(new THREE.BoxGeometry(1,1,1),metalMat,bridges.concat(causeways));
instanced(new THREE.CylinderGeometry(1,1.04,1,64),baseMat,plats).receiveShadow=true;
// accent light strip under every deck
TWM.deckGlow=instanced(new THREE.CylinderGeometry(.5,.5,1,28),accentMat,decks.map(m=>m.clone().multiply(new THREE.Matrix4().makeTranslation(0,-.6,0)).multiply(new THREE.Matrix4().makeScale(1.03,.25,1.03))));

// transit rings circling the city at several altitudes
const RINGS=[{r:520*CS,y:170},{r:900*CS,y:310},{r:1400*CS,y:110},{r:380*CS,y:520}];
for(const Rg of RINGS){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(Rg.r,5,8,180),metalMat);ring.rotation.x=Math.PI/2;ring.position.y=Rg.y;scene.add(ring);
  const glowR=new THREE.Mesh(new THREE.TorusGeometry(Rg.r,1.6,6,180),accentMat);glowR.rotation.x=Math.PI/2;glowR.position.y=Rg.y-5;scene.add(glowR);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2,x=Math.cos(a)*Rg.r,z=Math.sin(a)*Rg.r;
    const pylon=new THREE.Mesh(new THREE.CylinderGeometry(3,5,Rg.y,6),baseMat);pylon.position.set(x,Rg.y/2,z);scene.add(pylon);}
}

/* ---------- spaceport: the landing platform on the city's north side ---------- */
const PORT={x:0,z:-1960,r:480,top:10};
const pads=[];
(function(){
  const deck=new THREE.Mesh(new THREE.CylinderGeometry(PORT.r,PORT.r*1.03,16,8),baseMat);deck.position.set(PORT.x,PORT.top-8,PORT.z);deck.rotation.y=Math.PI/8;scene.add(deck);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(PORT.r*.99,3,6,64),accentMat);rim.rotation.x=Math.PI/2;rim.position.set(PORT.x,PORT.top+1,PORT.z);scene.add(rim);
  const padTop=new THREE.MeshStandardMaterial({color:C(0x2a3037),roughness:.7,metalness:.2});
  const padLine=new THREE.MeshStandardMaterial({color:C(0xf2b632),emissive:C(0x5a3a00),roughness:.5});
  for(const q of[-1,0,1]){
    const x=PORT.x+q*285,z=PORT.z-50;
    const p=new THREE.Mesh(new THREE.BoxGeometry(250,2,440),padTop);p.position.set(x,PORT.top+1,z);scene.add(p);
    for(const s of[-1,1]){const edge=new THREE.Mesh(new THREE.BoxGeometry(4,1,440),accentMat);edge.position.set(x+s*123,PORT.top+2.2,z);scene.add(edge);}
    for(let k=-2;k<=2;k++){const bar=new THREE.Mesh(new THREE.BoxGeometry(150,1,6),padLine);bar.position.set(x,PORT.top+2.3,z+k*80);scene.add(bar);}
    pads.push(new THREE.Vector3(x,PORT.top+2,z));
  }
  // hangars facing the city, control tower, beacon masts
  for(let k=-1;k<=1;k++){const h=new THREE.Mesh(new THREE.CylinderGeometry(48,48,120,16,1,false,0,Math.PI),metalMat);
    h.rotation.z=Math.PI/2;h.rotation.y=Math.PI/2;h.position.set(PORT.x+k*150,PORT.top,PORT.z+330);scene.add(h);
    const door=new THREE.Mesh(new THREE.BoxGeometry(80,38,2),new THREE.MeshStandardMaterial({color:C(0x1d2329),roughness:.6}));door.position.set(PORT.x+k*150,PORT.top+19,PORT.z+269);scene.add(door);}
  const tx=PORT.x+360,tz=PORT.z+260;
  const tw=new THREE.Mesh(new THREE.CylinderGeometry(16,22,170,12),metalMat);tw.position.set(tx,PORT.top+85,tz);scene.add(tw);
  const cab=new THREE.Mesh(new THREE.CylinderGeometry(46,36,26,16),towerMat);cab.position.set(tx,PORT.top+182,tz);scene.add(cab);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(47,47,5,16),accentMat);band.position.set(tx,PORT.top+170,tz);scene.add(band);
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2+Math.PI/8,m=new THREE.Mesh(new THREE.CylinderGeometry(2,3,60,6),metalMat);
    m.position.set(PORT.x+Math.cos(a)*(PORT.r-20),PORT.top+30,PORT.z+Math.sin(a)*(PORT.r-20));scene.add(m);
    const b=new THREE.Mesh(new THREE.SphereGeometry(5,8,6),accentMat);b.position.set(m.position.x,PORT.top+62,m.position.z);scene.add(b);}
  // causeway back to the nearest district
  const Q=PLATS.slice(1).sort((a,b)=>Math.hypot(a.x-PORT.x,a.z-PORT.z)-Math.hypot(b.x-PORT.x,b.z-PORT.z))[0];
  const d=Math.hypot(PORT.x-Q.x,PORT.z-Q.z),cw=new THREE.Mesh(new THREE.BoxGeometry(30,6,d),metalMat);
  cw.position.set((PORT.x+Q.x)/2,24,(PORT.z+Q.z)/2);cw.rotation.y=Math.atan2(PORT.x-Q.x,PORT.z-Q.z);scene.add(cw);
})();
// the city flagship's shipyard sits on flattened grassland south of the city, past the water
const YARD={x:0,z:7600,hx:1900,hz:2500,top:14};
function inYard(x,z,m){return Math.abs(x-YARD.x)<YARD.hx+(m||0)&&Math.abs(z-YARD.z)<YARD.hz+(m||0);}

/* ---------- mountains: a ring of ridges, tallest behind the city, with grassland, forests and towns on the low ground ---------- */
(function(){
  const A=360,RN=52,rin=5000,rout=12000;
  const pos=new Float32Array((A+1)*(RN+1)*3),col=new Float32Array((A+1)*(RN+1)*3),hs=new Float32Array((A+1)*(RN+1));
  for(let i=0;i<=A;i++){const a=i/A*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),north=-sa;
    const amp=0.1+0.9*sstep(-0.35,0.75,north);
    for(let j=0;j<=RN;j++){const jt=j/RN,r=rin+(rout-rin)*Math.pow(jt,1.25),x=ca*r,z=sa*r;
      const prof=sstep(0,.28,jt)*(0.75+0.25*sstep(.4,1,jt));
      let h=(ridged(x*.00042,z*.00042)*1.15+fbm(x*.0011,z*.0011)*.35)*2500*prof*amp-30;
      {const d=Math.max(Math.abs(x-YARD.x)-YARD.hx,Math.abs(z-YARD.z)-YARD.hz);if(d<600)h+=(12-h)*(1-sstep(0,600,d));}
      const k=(i*(RN+1)+j);pos.set([x,h,z],k*3);hs[k]=h;}}
  const idx=[];for(let i=0;i<A;i++)for(let j=0;j<RN;j++){const a=i*(RN+1)+j,b=a+RN+1;idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const nrm=g.attributes.normal.array,sand=C(0xcdb98c),grass=C(0x5a8a3c),grass2=C(0x3f6e33),rock=C(0x6f747c),rock2=C(0x4c545e),snow=C(0xf4f7fa),c=new THREE.Color();
  for(let k=0;k<hs.length;k++){const h=hs[k],ny=nrm[k*3+1],x=pos[k*3],z=pos[k*3+2];
    c.copy(grass).lerp(grass2,fbm(x*.004,z*.004));
    c.lerp(sand,1-sstep(4,22,h));
    c.lerp(rock,sstep(260,800,h)).lerp(rock2,sstep(.9,.6,ny)*.6);
    const sl=1350+fbm(x*.003,z*.003)*500;if(h>sl&&ny>.55)c.lerp(snow,sstep(sl,sl+180,h));
    col.set([c.r,c.g,c.b],k*3);}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  scene.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0})));

  // bilinear sample of the terrain grid at cell (i,j) + fraction (u,v)
  const vtx=(i,j)=>(((i%A)+A)%A)*(RN+1)+clamp(j,0,RN);
  function sample(i,j,u,v,out){
    const k00=vtx(i,j),k10=vtx(i+1,j),k01=vtx(i,j+1),k11=vtx(i+1,j+1);
    for(let d=0;d<3;d++){const p=(k)=>pos[k*3+d];out[d]=(p(k00)*(1-u)+p(k10)*u)*(1-v)+(p(k01)*(1-u)+p(k11)*u)*v;}
    out[3]=((nrm[k00*3+1]+nrm[k10*3+1]+nrm[k01*3+1]+nrm[k11*3+1])/4);return out;}
  const S=[0,0,0,0];

  // towns on gentle low ground near the shore
  const towns=[];
  for(let t=0;t<4000&&towns.length<(coarse?12:18);t++){
    const i=(rng()*A)|0,j=1+((rng()*14)|0);sample(i,j,.5,.5,S);
    if(S[1]<14||S[1]>160||S[3]<.95||inYard(S[0],S[2],900))continue;
    if(towns.some(o=>Math.hypot(o.x-S[0],o.z-S[2])<1400))continue;
    towns.push({i,j,x:S[0],z:S[2],size:R(.6,1.4)});
  }
  const homes=[],homeCols=[],roofs=[];
  const wall=[0xf3efe7,0xe8e0d2,0xdfe7ee,0xf2e4d0,0xd8dee6,0xefe9df].map(C),roofC=[0x8a4b3a,0x4f5d6c,0x6b6f74,0x9a6a4a].map(C);
  for(const T of towns){
    const n=Math.floor((coarse?30:55)*T.size);
    for(let b=0;b<n;b++){
      const i=T.i+((rng()*7-3)|0),j=clamp(T.j+((rng()*5-2)|0),1,RN-1);sample(i,j,rng(),rng(),S);
      if(S[1]<8||S[3]<.9||Math.hypot(S[0]-T.x,S[2]-T.z)>520*T.size||inYard(S[0],S[2],80))continue;
      const tall=rng()<.08,w=R(14,34),d=R(14,34),h=tall?R(70,150):R(10,34),ry=rng()*Math.PI;
      homes.push(mat4(S[0],S[1]-2,S[2],w,h,d,0,ry,0));homeCols.push(pick(wall));
      if(!tall)roofs.push({m:mat4(S[0],S[1]-2+h,S[2],w*.75,R(4,9),d*1.02,0,ry,0),c:pick(roofC)});
    }
  }
  const hm=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1).translate(0,.5,0),new THREE.MeshStandardMaterial({roughness:.7,metalness:.05}),homes.length);
  homes.forEach((m,i)=>{hm.setMatrixAt(i,m);hm.setColorAt(i,homeCols[i]);});scene.add(hm);
  const roofGeo=new THREE.CylinderGeometry(0,.72,1,4,1).rotateY(Math.PI/4).translate(0,.5,0);
  const rm=new THREE.InstancedMesh(roofGeo,new THREE.MeshStandardMaterial({roughness:.8}),roofs.length);
  roofs.forEach((r,i)=>{rm.setMatrixAt(i,r.m);rm.setColorAt(i,r.c);});scene.add(rm);

  // forests: conifers on slopes, broadleaf in the lowlands, kept out of towns and above the beach
  const NT=coarse?4500:9000,con=[],con_c=[],brd=[],brd_c=[];
  const greens=[0x2f5a2c,0x355f2a,0x3d6b30,0x284f27,0x456f32].map(C),leafy=[0x4f7d36,0x5a8a3b,0x46742f,0x6a9442].map(C);
  for(let t=0;t<NT*3&&con.length+brd.length<NT;t++){
    const i=(rng()*A)|0,j=1+((rng()*30)|0);sample(i,j,rng(),rng(),S);
    if(S[1]<20||S[1]>950||S[3]<.8||inYard(S[0],S[2],120))continue;
    const clump=fbm(S[0]*.0016,S[2]*.0016);if(clump<.42)continue;
    if(towns.some(o=>Math.hypot(o.x-S[0],o.z-S[2])<600*o.size))continue;
    const sc=R(.8,1.5);
    if(S[1]>180||rng()<.45){con.push(mat4(S[0],S[1]-4,S[2],14*sc,R(34,52)*sc,14*sc,0,rng()*3,0));con_c.push(pick(greens));}
    else{brd.push(mat4(S[0],S[1]+10*sc,S[2],R(18,26)*sc,R(16,22)*sc,R(18,26)*sc,0,rng()*3,0));brd_c.push(pick(leafy));}
  }
  const cm=new THREE.InstancedMesh(new THREE.ConeGeometry(.5,1,7).translate(0,.5,0),new THREE.MeshStandardMaterial({roughness:.9}),con.length);
  con.forEach((m,i)=>{cm.setMatrixAt(i,m);cm.setColorAt(i,con_c[i]);});scene.add(cm);
  const bm=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.5,0),new THREE.MeshStandardMaterial({roughness:.9,flatShading:true}),brd.length);
  brd.forEach((m,i)=>{bm.setMatrixAt(i,m);bm.setColorAt(i,brd_c[i]);});scene.add(bm);
})();

/* ---------- glow sprite texture ---------- */
const glow=makeGlowTex();

/* ---------- capital ships that fill the sky ---------- */
const panelTex=makePanelTex();



// two enemies, one look: black hulls with thick glowing highlights. The aliens of Astraea glow red, the Hollow King's fleet purple.
// Models come from js/shared/fleets.js (the design sheet): aliens fly Harrower flagships, the Hollow King a Harbinger and Voidclass cruisers.
const ALIEN_GLOW=FLEET_RED,HOLLOW_GLOW=FLEET_PURPLE;
const capitalMat=fleetHullMat(panelTex),hollowMat=capitalMat;
const windowMat=fleetGlowMat(ALIEN_GLOW),hollowWindowMat=fleetGlowMat(HOLLOW_GLOW);
const variants=[capitalShip(0),capitalShip(1),capitalShip(2)];
const CAPS=[
  // wave 1, the aliens: four Harrower flagships
  {v:0,model:'harrower',len:3200,home:[-3106,3400,-11591],atk:[-1216,2000,-4540]},
  {v:1,model:'harrower',len:3800,home:[5283,4000,-11329],atk:[2240,2500,-4803]},
  {v:2,model:'harrower',len:2600,home:[-8426,2800,-7071],atk:[-3294,1800,-2764]},
  {v:0,model:'harrower',len:3000,home:[9011,3000,-6309],atk:[3195,2000,-2237]},
  // wave 2, the Hollow King: four Voidclass cruisers on every side of the city and his Harbinger flagship to the north
  {v:1,model:'voidclass',len:3200,wave:2,home:[-12500,3600,-1200],atk:[-4700,2300,-500]},
  {v:2,model:'voidclass',len:3000,wave:2,home:[12500,3400,1400],atk:[4700,2100,700]},
  {v:0,model:'voidclass',len:3200,wave:2,home:[-8800,3800,9200],atk:[-3300,2500,3500]},
  {v:1,model:'voidclass',len:3000,wave:2,home:[8800,3600,9200],atk:[3300,2200,3500]},
  {v:2,model:'harbinger',len:4600,wave:2,home:[0,4400,-13000],atk:[0,2800,-4900]}
];
const capitals=CAPS.map(cfg=>{
  const V=SHIPKIT[cfg.model](),grp=new THREE.Group(),s=cfg.len/1000,hol=cfg.wave===2;
  grp.add(new THREE.Mesh(V.geo,hol?hollowMat:capitalMat),new THREE.Mesh(V.glowGeo,hol?hollowWindowMat:windowMat));
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(V.lights,3));lg.setAttribute('color',new THREE.Float32BufferAttribute(V.lc,3));
  grp.add(new THREE.Points(lg,new THREE.PointsMaterial({size:28,map:glow,vertexColors:true,color:C(hol?HOLLOW_GLOW:ALIEN_GLOW),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
  const eg=new THREE.BufferGeometry();eg.setFromPoints(V.eng);
  const engMat=new THREE.PointsMaterial({size:260,map:glow,color:C(hol?HOLLOW_GLOW:ALIEN_GLOW).multiplyScalar(2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  grp.add(new THREE.Points(eg,engMat));
  grp.scale.setScalar(s);grp.position.set(...cfg.home);grp.rotation.y=Math.atan2(cfg.home[0],cfg.home[2]);
  scene.add(grp);
  return{grp,home:new THREE.Vector3(...cfg.home),atk:new THREE.Vector3(...cfg.atk),W:V.W,ph:rng()*6,engMat,wave:cfg.wave||1,maxHp:Math.round((cfg.model==='harbinger'?260:cfg.wave===2?190:90)*DIFF.tide.ehp),hollow:hol,model:cfg.model,t:0,on:false};
});
// the Harbinger wears the new model once it has downloaded (same size and facing; the code-built hull stays for collisions)
MODELS.harbinger((g,m)=>{for(const c of capitals)if(c.model==='harbinger'){c.grp.children[0].visible=c.grp.children[1].visible=false;const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;c.grp.add(mesh);}});
