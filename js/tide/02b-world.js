/* Tide City · the world round the city (Nov 16 2026, from Bryce's four concept paintings: "I like the depth then the mountains")
   - a second and third range behind the coastal hills: great snow-capped peaks over green lower slopes, then a far range
     fading into the night, so the land steps back in layers
   - waterfalls down the big range, with spray at their feet; cloud banks lying along the mountainsides (not a haze over the scene)
   - a ringed planet-sized moon and a small moon over the mountains
   - two lit coastal towns across the water, and lights along the shore
   - warm lights round every district's rim (the water picks them up: js/tide/01-scene.js)
   Everything here draws in a handful of draw calls and uses its own random numbers, so the city's layout (seeded) does not move. */
(function(){
  let s=91611;const rnd=()=>((s=(s*16807)%2147483647)-1)/2147483646,RR=(a,b)=>a+(b-a)*rnd();
  const TAU=Math.PI*2,phone=coarse;

  /* ---------- the great range (r 10.5k-19k) and the far range (r 19k-33k) ---------- */
  function range(o){
    const{A,RN,rin,rout}=o,N=(A+1)*(RN+1),pos=new Float32Array(N*3),col=new Float32Array(N*3),hs=new Float32Array(N);
    for(let i=0;i<=A;i++){const a=i/A*TAU,ca=Math.cos(a),sa=Math.sin(a);
      for(let j=0;j<=RN;j++){const jt=j/RN,r=rin+(rout-rin)*jt,x=ca*r,z=sa*r,h=o.h(x,z,jt,-sa);const k=i*(RN+1)+j;pos.set([x,h,z],k*3);hs[k]=h;}}
    const idx=[];for(let i=0;i<A;i++)for(let j=0;j<RN;j++){const a=i*(RN+1)+j,b=a+RN+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
    const nrm=g.attributes.normal.array,c=new THREE.Color();
    for(let k=0;k<N;k++){o.paint(c,hs[k],nrm[k*3+1],pos[k*3],pos[k*3+2]);col.set([c.r,c.g,c.b],k*3);}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));
    // Nov 17: coloured per pixel by the shape of the land (rock on the steep, snow where it can lie, strata, haze): js/shared/mountain-look.js
    const mt=MOUNTAIN_LOOK(new THREE.MeshStandardMaterial({vertexColors:true,fog:false,roughness:1,metalness:0,emissive:C(o.fill||0x070d18)}),o.look);
    const m=new THREE.Mesh(g,mt);
    m.matrixAutoUpdate=false;scene.add(m);return{pos,hs,A,RN,rin,rout};}

  const sand=C(0xb9a77e),lush=C(0x37803a),lush2=C(0x245a2a),rock=C(0x4a515d),rock2=C(0x2a303a),snow=C(0xffffff),haze=C(0x24365a),haze2=C(0x2f4570);
  // the great range: tallest to the north, behind the Spear, and still a wall of peaks all round
  const BIG=range({A:phone?380:720,RN:phone?50:96,rin:10500,rout:19500,
    look:{snow:4000,snowVar:900,tree:1700,rock1:0x5e6470,rock2:0x30353e,haze:0x24365a,hazeNear:9000,hazeFar:30000,hazeK:.35,self:.12},
    h(x,z,jt,north){const amp=.32+.68*sstep(-.6,.7,north);
      const ridge=fbm(x*.00016+3.2,z*.00016-1.4)*.85+Math.pow(ridged(x*.00022+7.1,z*.00022-3.3),1.6)*1.05+fbm(x*.0012,z*.0012)*.08;
      return (ridge*5600*sstep(0,.38,jt)*(.7+.3*sstep(.45,1,jt))*amp-60)*(1-sstep(.86,1,jt))-200*sstep(.86,1,jt);},   // (Nov 17: its back edge falls away under the far range, no raw edge in the air)
    paint(c,h,ny,x,z){const r=Math.hypot(x,z);
      c.copy(lush).lerp(lush2,fbm(x*.002,z*.002));c.lerp(sand,1-sstep(0,30,h));
      c.lerp(rock,sstep(1100,2100,h)).lerp(rock2,sstep(.85,.5,ny)*.7);
      const sl=4100+fbm(x*.0016,z*.0016)*900;c.lerp(snow,sstep(sl,sl+350,h)*sstep(.4,.7,ny));
      c.lerp(haze,sstep(11000,21000,r)*.22);}});
  // the far range: pale snow on dark slopes, fading toward the sky
  range({A:phone?240:480,RN:phone?18:36,rin:18500,rout:33000,fill:0x0b1424,
    look:{snow:5200,snowVar:900,tree:2600,rock1:0x3a4250,rock2:0x232a36,snowC:0xd6e0ee,haze:0x2f4570,hazeNear:16000,hazeFar:36000,hazeK:.55,self:.1},
    h(x,z,jt,north){const amp=.55+.45*sstep(-.4,.6,north);
      return ((fbm(x*.00009-4,z*.00009+9)*.9+Math.pow(ridged(x*.00011-4,z*.00011+9),1.5)*.8)*7600*sstep(0,.45,jt)*amp-200)*(1-sstep(.9,1,jt)*.85);},
    paint(c,h,ny,x,z){c.copy(rock2).lerp(snow,sstep(5000,6000,h)*sstep(.35,.65,ny)*.8).lerp(haze2,.5);}});


  /* ---------- waterfalls (Nov 17): only where the coastal hills really drop away, white water down the drop and a river from its foot
     to the sea (js/shared/mountain-look.js MOUNTAIN_FALLS); before, white ribbons lay on any slope and read as roads ---------- */
  const NEAR=window.TIDE_TERRAIN||BIG;
  const feet=MOUNTAIN_FALLS(scene,NEAR,{time:ocean.material.uniforms.time,count:phone?3:5,span:1.25,steep:.62,maxTop:1600,minDrop:220,maxDrop:650,wMin:60,wMax:120,sep:.035}).feet;
  const gridAt=(G,i,j)=>{const k=(((i%G.A)+G.A)%G.A)*(G.RN+1)+j;return[G.pos[k*3],G.hs[k],G.pos[k*3+2]];};

  /* ---------- cloud banks along the mountainsides and spray at the waterfalls' feet: one draw call ---------- */
  const cloudTex=(()=>{const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x=cv.getContext('2d');
    for(let n=0;n<44;n++){const px=RR(30,226),py=RR(58,84)-Math.sin((px-30)/196*Math.PI)*14,r=RR(26,52);
      const gr=x.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,'rgba(255,255,255,.22)');gr.addColorStop(.6,'rgba(255,255,255,.1)');gr.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=gr;x.beginPath();x.arc(px,py,r,0,TAU);x.fill();}
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t;})();
  const cP=[],cU=[],cC=[],cI=[];
  const banks=[];function cloud(x,y,z,w,h,col){banks.push({x,y,z,w,h,col});}   // (Nov 17: built from camera-facing puffs: MOUNTAIN_CLOUDS)
  const cloudC=C(0x7286aa),sprayC=C(0x7d90b0);
  // a bank where the big range's slope crosses the bank's height, pulled out in front of it
  // half low on the coastal hills, half high on the great range, above the hills so they show
  for(let n=0,N=phone?22:38;n<N;n++){const G=n%2?BIG:NEAR,low=G===NEAR;
    const north=rnd()<.7,a=north?Math.PI*1.5+RR(-1.15,1.15):RR(0,TAU),i=Math.round(a/TAU*G.A),y=low?RR(450,1300):RR(2600,4200);
    let j=0;while(j<G.RN&&gridAt(G,i,j)[1]<y)j++;if(j>=G.RN)continue;
    const p=gridAt(G,i,j),k=1-RR(low?150:300,low?400:800)/Math.hypot(p[0],p[2]);
    cloud(p[0]*k,y,p[2]*k,low?RR(2200,3800):RR(4000,7000),low?RR(380,620):RR(800,1300),cloudC);}
  for(const f of feet)for(let n=0;n<2;n++)cloud(f[0]+RR(-60,60),f[1]+RR(50,120),f[2]+RR(-60,60),f[3]*RR(3,4.5),RR(140,220),sprayC);
  MOUNTAIN_CLOUDS(scene,banks,{opacity:.6});

  /* ---------- a great moon and a small one over the mountains (they ride with the sky, so they stay on the horizon) ---------- */
  function moonTex(o){const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;const x=cv.getContext('2d'),R=S/2-4;
    x.save();x.beginPath();x.arc(S/2,S/2,R,0,TAU);x.clip();
    x.fillStyle=o.base;x.globalAlpha=1;x.fillRect(0,0,S,S);
    for(let n=0;n<o.bands;n++){x.fillStyle=`rgba(${o.band},${RR(.04,.16)})`;const y=RR(0,S);x.fillRect(0,y,S,RR(4,30));}
    // mottled ground: many soft dark and light patches rather than drawn circles
    for(let n=0;n<o.craters*4;n++){const cx=RR(0,S),cy=RR(0,S),r=RR(6,o.big*2),g=x.createRadialGradient(cx,cy,0,cx,cy,r),dk=rnd()<.6;
      g.addColorStop(0,dk?`rgba(25,35,55,${RR(.06,.16)})`:`rgba(235,242,255,${RR(.04,.1)})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);}
    // night side: lit from the lower right, a soft terminator
    const g=x.createRadialGradient(S*.78,S*.72,R*.2,S*.62,S*.6,R*1.55);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.45,'rgba(4,8,18,.25)');g.addColorStop(.8,'rgba(4,8,18,.85)');g.addColorStop(1,'rgba(4,8,18,.97)');
    x.fillStyle=g;x.fillRect(0,0,S,S);x.restore();
    // a thin bright rim on the lit edge
    x.strokeStyle='rgba(200,225,255,.5)';x.lineWidth=3;x.beginPath();x.arc(S/2,S/2,R-1,-.35,1.9);x.stroke();
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t;}
  function moon(tex,az,el,size,dist){const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,fog:false,color:C(0x9fb2cc)}));
    const ce=Math.cos(el);m.position.set(Math.sin(az)*ce*dist,Math.sin(el)*dist,-Math.cos(az)*ce*dist);m.lookAt(0,0,0);m.renderOrder=-1;sky.add(m);return m;}
  moon(moonTex({base:'#a8bfd9',band:'210,225,240',bands:22,craters:90,big:34}),-.95,.36,11000,36000);
  moon(moonTex({base:'#b8c2cc',band:'240,240,240',bands:4,craters:60,big:22}),-.42,.5,1500,36000);

  /* ---------- the coast: two lit towns across the water, and lights along the shore ---------- */
  const T=window.TIDE_TERRAIN;
  if(T){const{pos,hs,nrm,A,RN}=T,at=(i,j)=>(((i%A)+A)%A)*(RN+1)+j;
    const lights=[],lc=[],warm=C(0xffc27a),cool=C(0xbfe2ff);
    // shore lights: every few steps round the ring, where the land first rises out of the water
    for(let i=0;i<A;i+=phone?3:2){for(let j=0;j<RN;j++){const k=at(i,j);if(hs[k]>3){const p=k*3;
      if(!inYard(pos[p],pos[p+2],200)){lights.push(pos[p],hs[k]+8,pos[p+2]);const c=rnd()<.8?warm:cool;lc.push(c.r,c.g,c.b);}break;}}}
    // the towns: low-ground cells near the shore at two headings (west, and north-east toward the big falls)
    const homes=[];
    for(const[a0,n0] of[[Math.PI*1.02,phone?90:160],[Math.PI*1.82,phone?70:120]]){const ic=Math.round(a0/TAU*A),sa=A/360,sr=RN/52;
      for(let t=0;t<n0*6&&homes.length<9999;t++){const i=ic+Math.round(RR(-9,9)*sa),j=1+Math.floor(RR(0,7)*sr),k=at(i,j);
        if(hs[k]<6||hs[k]>140||nrm[k*3+1]<.93)continue;const p=k*3,x=pos[p]+RR(-14,14),z=pos[p+2]+RR(-14,14);if(inYard(x,z,300)||inPost(x,z,300))continue;
        const tall=rnd()<.25,h=tall?RR(90,320):RR(25,90),w=RR(18,40);homes.push(mat4(x,hs[k]-4,z,w,h,w*RR(.7,1.3),0,rnd()*3,0));
        if(rnd()<.5){lights.push(x,hs[k]+h+6,z);lc.push(warm.r,warm.g,warm.b);}
        if(homes.length%n0===0)break;}}
    if(homes.length){const im=new THREE.InstancedMesh(unitBox,towerMat,homes.length);const tint=[0xffffff,0xeef3f7,0xe2ebf2,0xd7e6ee,0xf3efe6].map(C);homes.forEach((m,i)=>{im.setMatrixAt(i,m);im.setColorAt(i,tint[i%5]);});scene.add(im);}   // (setColorAt: the tower look is shared with the city's towers, which carry a colour each)
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lights,3));g.setAttribute('color',new THREE.Float32BufferAttribute(lc,3));
    scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:55,map:glow,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})));}

  /* ---------- the districts' warm rims, and the lights the water reflects ---------- */
  {const rimMat=new THREE.MeshBasicMaterial({color:C(0xffc888).multiplyScalar(1.6),fog:false});
   const rim=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.03,1.035,1,96,1,true),rimMat,PLATS.length);
   PLATS.forEach((P,i)=>rim.setMatrixAt(i,mat4(P.x,1.2,P.z,P.r,1.8,P.r)));scene.add(rim);
   const lp=[];for(const P of PLATS){const n=Math.round(TAU*P.r/48);for(let k=0;k<n;k++){const a=k/n*TAU;lp.push(P.x+Math.cos(a)*P.r*1.045,5,P.z+Math.sin(a)*P.r*1.045);}}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));
   scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:22,map:glow,color:C(0xffd29a).multiplyScalar(1.4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
   const U=ocean.material.uniforms.plats.value;PLATS.slice(0,16).forEach((P,i)=>U[i].set(P.x,P.z,P.r*1.04,1));}
})();
