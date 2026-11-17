/* Tide City · the Keeper outposts in the foothills (Nov 16 2026, Bryce: "more buildings and structures on the outside of the city near
   the mountains like the command post"). Six of them round the bay (OUTPOSTS, js/tide/02-city.js, which levels a terrace for each into
   the slope), every one facing the city:
   - a concrete terrace with a stone skirt down into the hillside, slab paving on top (js/shared/ground-detail.js)
   - a three-tier command block with lit windows (the towers' facades) and Keeper-blue light lines at each level
   - a comm mast with a dish and a red light, a radar dish turning on the roof
   - three hangars facing the city, two landing pads with their markings and edge lights, a Keeper dropship on one
   - a perimeter wall with a gate toward the city, watchtowers with lit cabs and searchlights, flood masts
   - fuel tanks, crate stacks and parked trucks
   - a lit road down the hill to the shore
   All instanced: a couple of dozen draw calls for the six. Its own random numbers, so nothing else in the level moves. */
const OUTPOST_TICK=(()=>{
  let s=40411;const rnd=()=>((s=(s*16807)%2147483647)-1)/2147483646,RR=(a,b)=>a+(b-a)*rnd(),PK=a=>a[(rnd()*a.length)|0];
  const T=window.TIDE_TERRAIN;
  // terrain height at any point (bilinear on the ring grid of js/tide/02-city.js)
  function hAt(x,z){if(!T)return 0;const{hs,A,RN}=T,r=Math.hypot(x,z);if(r<5000)return 0;
    let a=Math.atan2(z,x);if(a<0)a+=Math.PI*2;const fi=a/(Math.PI*2)*A,jt=Math.pow(Math.min(1,(r-5000)/7000),.8),fj=jt*RN;
    const i0=Math.floor(fi),j0=Math.min(RN-1,Math.floor(fj)),u=fi-i0,v=fj-j0,k=(i,j)=>hs[(((i%A)+A)%A)*(RN+1)+j];
    return (k(i0,j0)*(1-u)+k(i0+1,j0)*u)*(1-v)+(k(i0,j0+1)*(1-u)+k(i0+1,j0+1)*u)*v;}

  const L={};   // lists by name: {geo, mat, items:[{m,c}]}
  function add(name,geo,mat,m,c,shadow){(L[name]=L[name]||{geo,mat,items:[],shadow}).items.push({m,c});}
  const box=unitBox,cyl8=new THREE.CylinderGeometry(.5,.5,1,12).translate(0,.5,0);
  const concrete=GROUND_DETAIL(new THREE.MeshStandardMaterial({color:C(0x9a978f),roughness:.9}));
  const wallMat=new THREE.MeshStandardMaterial({color:C(0x7d7f80),roughness:.85,metalness:.05});
  const bldMat=TOWER_LOOK(new THREE.MeshStandardMaterial({color:0xffffff}),{far:[600,4000]});
  const steel=new THREE.MeshStandardMaterial({color:C(0x59616b),roughness:.45,metalness:.65});
  const darkM=new THREE.MeshStandardMaterial({color:C(0x1f252c),roughness:.6,metalness:.3});
  const keeper=new THREE.MeshStandardMaterial({color:C(0xdff7ff),emissive:C(0x39c6ff),emissiveIntensity:1.2,roughness:.3});
  const padMat=new THREE.MeshStandardMaterial({color:C(0x2b3036),roughness:.75,metalness:.2});
  const yellow=new THREE.MeshStandardMaterial({color:C(0xf2b632),emissive:C(0x4a3000),roughness:.5});
  const hangarMat=new THREE.MeshStandardMaterial({color:C(0x8f969d),roughness:.5,metalness:.55});
  const crateMat=new THREE.MeshStandardMaterial({roughness:.8});
  const crateCols=[0x5b6340,0x6b6f74,0x8a5a2b,0x3f4a3a,0x9a8f6a,0xb2652a].map(C);
  const lights=[],lightC=[],reds=[],dishes=[],small=[],smallC=[];
  const warm=C(0xffd9a0),blue=C(0x8fdcff),white=C(0xe8f2ff);
  const light=(x,y,z,c)=>{lights.push(x,y,z);lightC.push(c.r,c.g,c.b);};

  for(const O of OUTPOSTS){
    const ang=Math.atan2(-O.x,-O.z),ca=Math.cos(ang),sa=Math.sin(ang),y0=O.y+1.2;
    const W=(lx,lz)=>[O.x+lx*ca+lz*sa,O.z-lx*sa+lz*ca];
    const P=(lx,y,lz,sx,sy,sz,ry)=>{const[x,z]=W(lx,lz);return mat4(x,y,z,sx,sy,sz,0,ang+(ry||0),0);};
    // the terrace, its skirt into the hill
    add('slab',new THREE.CylinderGeometry(1,1.18,1,8).translate(0,-.5,0),concrete,mat4(O.x,y0,O.z,O.r,90,O.r,0,ang+Math.PI/8,0),null,true);
    // the command block: three tiers, Keeper light lines, a roof radar
    const cb=[[0,22,84,58],[22,16,58,40],[38,12,32,24]],cx=50,cz=-70;
    for(const[y,h,w,d]of cb){add('bld',box,bldMat,P(cx,y0+y,cz,w,h,d),C(0xdfe4ea),true);
      add('cap',box,wallMat,P(cx,y0+y+h-.3,cz,w+1.6,1.2,d+1.6),null,true);
      add('blue',box,keeper,P(cx,y0+y+h-1.6,cz,w+.4,.5,d+.4));}
    add('steel',cyl8,steel,P(cx,y0+50,cz,3,6,3),null);
    {const[x,z]=W(cx,cz);dishes.push({x,y:y0+57,z,ph:O.i});}
    // comm mast with dish
    {const mx=150,mz=-150,[x,z]=W(mx,mz);
      add('mast',new THREE.CylinderGeometry(.35,1,1,4).translate(0,.5,0),steel,mat4(x,y0,z,6,120,6,0,ang,0),null,true);
      for(let k=1;k<6;k++)add('steel',box,steel,mat4(x,y0+k*20,z,7-k*.8,.6,7-k*.8,0,ang,0));
      add('dish',new THREE.SphereGeometry(1,18,8,0,Math.PI*2,0,Math.PI*.35).rotateX(Math.PI/2),hangarMat,mat4(x+Math.sin(ang)*4,y0+78,z+Math.cos(ang)*4,14,14,10,-.3,ang,0));
      add('bld',box,bldMat,P(mx+16,y0,mz+10,22,7,14),C(0xc9cfd6),true);
      reds.push(x,y0+123,z);}
    // hangars facing the city, their doors dark with a lit slit
    for(let k=0;k<3;k++){const hx=-150+k*58,hz=-110;
      add('hangar',new THREE.CylinderGeometry(1,1,1,20,1,false,0,Math.PI).rotateZ(Math.PI/2).rotateY(Math.PI/2),hangarMat,P(hx,y0,hz,26,26,74),null,true);
      add('dark',box,darkM,P(hx,y0,hz+36.5,38,20,1.2));add('blue',box,keeper,P(hx,y0+21,hz+37,30,.6,.6));
      const[x,z]=W(hx,hz+44);light(x,y0+24,z,warm);}
    // landing pads, markings, edge lights
    const pads=[[-70,90],[70,80]];
    for(const[px,pz]of pads){add('pad',new THREE.CylinderGeometry(1,1,1,6).translate(0,.5,0),padMat,P(px,y0,pz,48,.8,48,Math.PI/6));
      add('yel',new THREE.TorusGeometry(1,.035,4,6).rotateX(Math.PI/2),yellow,P(px,y0+.85,pz,38,1,38,Math.PI/6));
      add('yel',box,yellow,P(px,y0+.8,pz,3,.12,22));add('yel',box,yellow,P(px,y0+.8,pz,12,.12,3));
      for(let k=0;k<12;k++){const a=k/12*Math.PI*2+Math.PI/6,[x,z]=W(px+Math.cos(a)*46,pz+Math.sin(a)*46),c=k%2?blue:white;small.push(x,y0+1.6,z);smallC.push(c.r,c.g,c.b);}}
    // a Keeper dropship on the first pad
    {const[x,z]=W(pads[0][0],pads[0][1]);O.ship={x,y:y0+.8,z,ang};}
    // perimeter wall with the gate toward the city, watchtowers with lit cabs and searchlights
    const WR=O.r*.9-10,NS=28;
    for(let k=0;k<NS;k++){const a0=k/NS*Math.PI*2,a1=(k+1)/NS*Math.PI*2,am=(a0+a1)/2;if(Math.abs(Math.atan2(Math.sin(am-Math.PI/2),Math.cos(am-Math.PI/2)))<.16)continue;   // the gate (local +z)
      const lx=Math.cos(am)*WR,lz=Math.sin(am)*WR,len=2*WR*Math.sin(Math.PI/NS)+1;
      const[x,z]=W(lx,lz);add('wall',box,wallMat,mat4(x,y0,z,len,9,3.2,0,ang-am+Math.PI/2,0),null,true);
      add('blue',box,keeper,mat4(x,y0+8.4,z,len,.35,3.4,0,ang-am+Math.PI/2,0));}
    for(let k=0;k<6;k++){const am=Math.PI/2+.34+k/6*(Math.PI*2-.68),lx=Math.cos(am)*WR,lz=Math.sin(am)*WR;
      add('wall',box,wallMat,P(lx,y0,lz,10,26,10),null,true);add('bld',box,bldMat,P(lx,y0+26,lz,14,7,14),C(0xd5dbe2),true);add('cap',box,wallMat,P(lx,y0+33,lz,15.5,1.2,15.5));
      const[x,z]=W(lx,lz);light(x,y0+36,z,white);}
    for(const s of[-1,1]){add('wall',box,wallMat,P(s*20,y0,WR,8,18,8),null,true);add('blue',box,keeper,P(s*20,y0+18,WR,8.6,1.2,8.6));const[x,z]=W(s*20,WR);light(x,y0+21,z,blue);}
    // barracks rows behind the pads, lit windows, Keeper light over each door
    for(let k=0;k<4;k++){const bx=-175+k*42,bz=-20;add('bld',box,bldMat,P(bx,y0,bz,30,9,16),C(k%2?0xcfd5db:0xe3e6ea),true);add('cap',box,wallMat,P(bx,y0+9,bz,31.5,1,17.5));add('blue',box,keeper,P(bx,y0+7.5,bz+8.3,6,.5,.4));}
    // painted taxi lines from the gate to the pads and the hangars
    for(const[x0,z0,x1,z1]of[[0,WR,-70,90],[0,WR,70,80],[-70,90,-92,-70],[70,80,50,-40]]){const len=Math.hypot(x1-x0,z1-z0);
      add('yel',box,yellow,P((x0+x1)/2,y0+.05,(z0+z1)/2,.8,.12,len,Math.atan2(x1-x0,z1-z0)));}
    // flood masts
    for(const[fx,fz]of[[-120,10],[0,30],[120,-20],[-20,-160]]){add('steel',box,steel,P(fx,y0,fz,.9,28,.9));const[x,z]=W(fx,fz);light(x,y0+29,z,warm);}
    // fuel tanks, crates, trucks
    for(let k=0;k<4;k++){add('tank',cyl8,hangarMat,P(165+(k%2)*16,y0,30+((k/2)|0)*16,13,11,13),null,true);add('dark',cyl8,darkM,P(165+(k%2)*16,y0+11,30+((k/2)|0)*16,13.4,.8,13.4));}
    for(let k=0;k<26;k++){const hx=-170+RR(0,150),hz=RR(-60,-35),sz=RR(2.4,4),st=(rnd()*3)|0;
      for(let q=0;q<=st;q++)add('crate',box,crateMat,P(hx,y0+q*sz,hz,sz*RR(1,1.6),sz,sz),PK(crateCols),true);}
    for(let k=0;k<6;k++){const tx=RR(-30,40),tz=RR(-10,40),r=RR(0,Math.PI*2),c=PK([C(0x4a5440),C(0x5a5f66),C(0xd8dcdf)]);
      add('crate',box,crateMat,P(tx,y0+1,tz,4.2,3.4,9,r),c,true);add('crate',box,crateMat,P(tx+Math.sin(ang+r)*0,y0+4.4,tz,3.8,2.2,3.4,r),c.clone().multiplyScalar(.8),true);}
    // the road down to the shore, lamps along it
    {let lx=0,lz=WR+10;const dx=0,dz=1;let prev=null;
      for(let n=0;n<60;n++){const[x,z]=W(lx,lz),h=Math.max(hAt(x,z),1)+.6;
        if(prev){const len=Math.hypot(x-prev[0],h-prev[1],z-prev[2]),pitch=Math.atan2(h-prev[1],Math.hypot(x-prev[0],z-prev[2]));
          add('road',box,padMat,new THREE.Matrix4().makeTranslation((x+prev[0])/2,(h+prev[1])/2-1.2,(z+prev[2])/2).multiply(new THREE.Matrix4().makeRotationY(ang)).multiply(new THREE.Matrix4().makeRotationX(-pitch)).multiply(new THREE.Matrix4().makeScale(14,1.4,len+2)),null);
          if(n%3===0){const[sx,sz]=W(lx+9,lz);light(sx,h+8,sz,warm);}}
        prev=[x,h,z];if(h<4)break;lz+=45;}}
  }
  // build the lists
  for(const k in L){const g=L[k];const mat=g.mat||new THREE.MeshStandardMaterial({roughness:.8});
    const im=new THREE.InstancedMesh(g.geo,mat,g.items.length);g.items.forEach((it,i)=>{im.setMatrixAt(i,it.m);if(it.c)im.setColorAt(i,it.c);});
    if(g.items.some(it=>!it.c)&&g.items.some(it=>it.c))g.items.forEach((it,i)=>{if(!it.c)im.setColorAt(i,C(0xffffff));});
    if(g.shadow){im.castShadow=im.receiveShadow=true;}scene.add(im);}
  {const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lights,3));g.setAttribute('color',new THREE.Float32BufferAttribute(lightC,3));
   scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:26,map:glow,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));}
  {const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(small,3));g.setAttribute('color',new THREE.Float32BufferAttribute(smallC,3));
   scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:7,map:glow,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));}
  const redG=new THREE.BufferGeometry();redG.setAttribute('position',new THREE.Float32BufferAttribute(reds,3));
  const redM=new THREE.PointsMaterial({size:34,map:glow,color:C(0xff4a3a).multiplyScalar(1.6),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});scene.add(new THREE.Points(redG,redM));
  // the roof radars turn
  const radar=new THREE.InstancedMesh(new THREE.BoxGeometry(18,4,1.2).translate(0,0,0),steel,dishes.length);scene.add(radar);
  // Bryce's Keeper dropship on a pad at every post
  if(typeof MODELS!=='undefined')MODELS.load('dropship').then(src=>{const g=src.geometry;g.computeBoundingBox();const b=g.boundingBox,k=70/(b.max.z-b.min.z);
    for(const O of OUTPOSTS){if(!O.ship)continue;const m=new THREE.Mesh(g,src.material);m.scale.setScalar(k);m.position.set(O.ship.x,O.ship.y-b.min.y*k,O.ship.z);m.rotation.y=O.ship.ang+.6;m.castShadow=m.receiveShadow=true;scene.add(m);}}).catch(()=>{});
  const _m=new THREE.Matrix4();
  return function(t){for(let i=0;i<dishes.length;i++){const d=dishes[i];radar.setMatrixAt(i,mat4(d.x,d.y,d.z,1,1,1,0,t*.8+d.ph,0));}radar.instanceMatrix.needsUpdate=true;
    redM.opacity=Math.sin(t*2.4)>0?1:.15;};
})();
