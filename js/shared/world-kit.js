/* WORLD_KIT: the land round Tide City from Bryce's concept paintings (Nov 16 2026, "I like the depth then the mountains"), for the
   menu backdrop (js/menu/halo-scene.js). The level builds the same world in js/tide/02b-world.js on its own coastal hills; this is the
   menu's version, with nothing taken from the level's globals (the menu does not load js/shared/core.js):
   - a great range of snow-capped peaks over green lower slopes, then a far range fading into the night: the land in layers
   - waterfalls down the great range's face into the sea, with spray at their feet
   - cloud banks lying along the mountainsides (banks on the mountains, not a haze over the scene)
   - a great moon over the mountains (riding with the sky, so it stays on the horizon)
   - lit coastal towns and lights along the shore at the mountains' feet
   WORLD_KIT.build(scene, {cx, cz, rin, phone, sky, skyR, time, haze, self, moon}) → {}. cx/cz: the centre the rings stand round;
   rin: where the land leaves the water; linearOut: the renderer has no sRGB output; sky: the mesh that follows the camera (the moon is put on it); time: a {value} uniform. */
const WORLD_KIT=(()=>{
  const TAU=Math.PI*2;
  const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};
  const sm=t=>t*t*(3-2*t);
  function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi),a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);
    return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf;}
  function fbm(x,y){let s=0,a=.5,f=1;for(let i=0;i<5;i++){s+=a*vn(x*f+31,y*f-17);f*=2.1;a*=.5;}return s;}
  function ridged(x,y){let s=0,a=.55,f=1;for(let i=0;i<5;i++){let n=1-Math.abs(vn(x*f,y*f)*2-1);n*=n;s+=n*a;f*=2.05;a*=.5;}return s;}
  const sst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

  function build(scene,o){
    let s=70117;const rnd=()=>((s=(s*16807)%2147483647)-1)/2147483646,RR=(a,b)=>a+(b-a)*rnd();
    const phone=!!o.phone,cx=o.cx||0,cz=o.cz||0,rin=o.rin||14000,lin=!!o.linearOut,C=h=>lin?new THREE.Color(h):new THREE.Color(h).convertSRGBToLinear(),ENC=lin?THREE.LinearEncoding:THREE.sRGBEncoding;   // (linearOut: a renderer without sRGB output, like the menu's)
    const sand=C(0xb9a77e),lush=C(0x37803a),lush2=C(0x245a2a),rock=C(0x4a515d),rock2=C(0x2a303a),snow=C(0xffffff),haze=C(o.haze||0x24365a);

    function range(q){
      const{A,RN,r0,r1}=q,N=(A+1)*(RN+1),pos=new Float32Array(N*3),col=new Float32Array(N*3),hs=new Float32Array(N);
      for(let i=0;i<=A;i++){const a=i/A*TAU,ca=Math.cos(a),sa=Math.sin(a);
        for(let j=0;j<=RN;j++){const jt=j/RN,r=r0+(r1-r0)*jt,x=ca*r,z=sa*r,h=q.h(x,z,jt,-sa);const k=i*(RN+1)+j;pos.set([cx+x,h,cz+z],k*3);hs[k]=h;}}
      const idx=[];for(let i=0;i<A;i++)for(let j=0;j<RN;j++){const a=i*(RN+1)+j,b=a+RN+1;idx.push(a,b,a+1,b,b+1,a+1);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
      const nrm=g.attributes.normal.array,c=new THREE.Color();
      for(let k=0;k<N;k++){q.paint(c,hs[k],nrm[k*3+1],pos[k*3]-cx,pos[k*3+2]-cz);col.set([c.r,c.g,c.b],k*3);}
      g.setAttribute('color',new THREE.BufferAttribute(col,3));
      // Nov 17: coloured per pixel by the shape of the land: rock on the steep, snow where it can lie, strata, haze (js/shared/mountain-look.js)
      const mt=typeof MOUNTAIN_LOOK==='function'?MOUNTAIN_LOOK(new THREE.MeshStandardMaterial({vertexColors:true,fog:false,roughness:1,metalness:0,emissive:C(q.fill||0x070d18)}),Object.assign({lin,self:q.self,haze:o.haze||0x24365a},q.look)):new THREE.MeshLambertMaterial({vertexColors:true,fog:false,emissive:C(q.fill||0x070d18)});
      const m=new THREE.Mesh(g,mt);m.matrixAutoUpdate=false;scene.add(m);return{pos,hs,A,RN};}

    const r1=rin+9000,self=o.self||.18;
    const BIG=range({A:phone?380:720,RN:phone?50:96,r0:rin,r1,self,look:{snow:4000,snowVar:900,tree:1700,rock1:0x5e6470,rock2:0x30353e,hazeNear:9000,hazeFar:30000,hazeK:.35},
      h(x,z,jt,north){const amp=.32+.68*sst(-.6,.7,north);
        const ridge=fbm(x*.00016+3.2,z*.00016-1.4)*.85+Math.pow(ridged(x*.00022+7.1,z*.00022-3.3),1.6)*1.05+fbm(x*.0012,z*.0012)*.08;
        return (ridge*5600*sst(0,.38,jt)*(.7+.3*sst(.45,1,jt))*amp-60)*(1-sst(.86,1,jt))-200*sst(.86,1,jt);},
      paint(c,h,ny,x,z){const r=Math.hypot(x,z);
        c.copy(lush).lerp(lush2,fbm(x*.002,z*.002));c.lerp(sand,1-sst(0,30,h));
        c.lerp(rock,sst(1100,2100,h)).lerp(rock2,sst(.85,.5,ny)*.7);
        const sl=4100+fbm(x*.0016,z*.0016)*900;c.lerp(snow,sst(sl,sl+350,h)*sst(.4,.7,ny));
        c.lerp(haze,sst(rin,r1+2000,r)*.25+(o.baseHaze||0)*(1-sst(200,1600,h)));}});
    range({A:phone?240:480,RN:phone?18:36,r0:r1-1000,r1:r1+13500,fill:0x0b1424,self:self*.6,look:{snow:5200,snowVar:900,tree:2600,rock1:0x3a4250,rock2:0x232a36,snowC:0xd6e0ee,hazeNear:16000,hazeFar:36000,hazeK:.55},
      h(x,z,jt,north){const amp=.55+.45*sst(-.4,.6,north);
        return ((fbm(x*.00009-4,z*.00009+9)*.9+Math.pow(ridged(x*.00011-4,z*.00011+9),1.5)*.8)*7600*sst(0,.45,jt)*amp-200)*(1-sst(.9,1,jt)*.85);},
      paint(c,h,ny){c.copy(rock2).lerp(snow,sst(5000,6000,h)*sst(.35,.65,ny)*.8).lerp(haze,.55);}});
    const at=(G,i,j)=>{const k=(((i%G.A)+G.A)%G.A)*(G.RN+1)+j;return[G.pos[k*3],G.hs[k],G.pos[k*3+2]];};
    const dirTo=(x,z)=>{const dx=x-cx,dz=z-cz,l=Math.hypot(dx,dz)||1;return[dx/l,dz/l];};

    /* waterfalls (Nov 17): only where the great range really drops away, white water down the drop and a river to the sea */
    const feet=typeof MOUNTAIN_FALLS==='function'?MOUNTAIN_FALLS(scene,BIG,{cx,cz,time:o.time,count:phone?3:5,span:1.1,steep:.75,maxTop:(o.fallTop||2600)+900,minDrop:300,maxDrop:1100,wMin:110,wMax:200,sep:.03,seed:9091}).feet:[];

    /* cloud banks on the mountainsides and spray at the falls' feet: one draw call */
    const cloudTex=(()=>{const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x=cv.getContext('2d');
      for(let n=0;n<44;n++){const px=RR(30,226),py=RR(58,84)-Math.sin((px-30)/196*Math.PI)*14,r=RR(26,52);
        const gr=x.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,'rgba(255,255,255,.22)');gr.addColorStop(.6,'rgba(255,255,255,.1)');gr.addColorStop(1,'rgba(255,255,255,0)');
        x.fillStyle=gr;x.beginPath();x.arc(px,py,r,0,TAU);x.fill();}
      const t=new THREE.CanvasTexture(cv);t.encoding=ENC;return t;})();
    const cP=[],cU=[],cC=[],cI=[];
    const banks=[];function cloud(x,y,z,w,h,col){banks.push({x,y,z,w,h,col});}   // (Nov 17: built from camera-facing puffs: MOUNTAIN_CLOUDS)
    const cloudC=C(0x7286aa),sprayC=C(0x7d90b0);
    // the falls' spray stays put; the cloud banks drift over the city with the wind (Nov 17: they sat in the mountains, reading as snow)
    for(const f of feet)for(let n=0;n<2;n++)cloud(f[0]+RR(-60,60),f[1]+RR(50,120),f[2]+RR(-60,60),f[3]*RR(3,4.5),RR(140,220),sprayC);
    MOUNTAIN_CLOUDS(scene,banks,{cx,cz,opacity:.6});
    MOUNTAIN_CLOUDS(scene,SKY_CLOUD_BANKS(phone?18:32,{cx,cz,R:rin*.9,y:[2400,4400],w:[1800,4600],h:[450,950],col:cloudC,seed:7071}),
      {cx,cz,opacity:.42,seed:7072,wind:{dir:[1,.3],speed:28,R:rin*.9,time:o.time||{value:0}}});


    /* the great moon, on the sky (which follows the camera) */
    if(o.sky&&o.moon!==false){const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;const x=cv.getContext('2d'),R=S/2-4;
      x.save();x.beginPath();x.arc(S/2,S/2,R,0,TAU);x.clip();x.fillStyle='#a8bfd9';x.fillRect(0,0,S,S);
      for(let n=0;n<22;n++){x.fillStyle=`rgba(210,225,240,${RR(.04,.16)})`;x.fillRect(0,RR(0,S),S,RR(4,30));}
      for(let n=0;n<360;n++){const px=RR(0,S),py=RR(0,S),r=RR(6,68),g=x.createRadialGradient(px,py,0,px,py,r),dk=rnd()<.6;
        g.addColorStop(0,dk?`rgba(25,35,55,${RR(.06,.16)})`:`rgba(235,242,255,${RR(.04,.1)})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2);}
      const g=x.createRadialGradient(S*.78,S*.72,R*.2,S*.62,S*.6,R*1.55);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.45,'rgba(4,8,18,.25)');g.addColorStop(.8,'rgba(4,8,18,.85)');g.addColorStop(1,'rgba(4,8,18,.97)');
      x.fillStyle=g;x.fillRect(0,0,S,S);x.restore();
      x.strokeStyle='rgba(200,225,255,.5)';x.lineWidth=3;x.beginPath();x.arc(S/2,S/2,R-1,-.35,1.9);x.stroke();
      const t=new THREE.CanvasTexture(cv);t.encoding=ENC;
      const d=(o.skyR||30000)*.9,az=o.moonAz??-.95,el=o.moonEl??.36,size=d*.3;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,fog:false,color:C(0x9fb2cc)}));
      const ce=Math.cos(el);m.position.set(Math.sin(az)*ce*d,Math.sin(el)*d,-Math.cos(az)*ce*d);m.lookAt(0,0,0);m.renderOrder=-1;o.sky.add(m);}

    /* the coast: lights where the land leaves the water, and two lit towns on it */
    {const lights=[],lc=[],warm=C(0xffc27a),cool=C(0xbfe2ff),G=BIG;
      for(let i=0;i<G.A;i+=phone?3:2){for(let j=0;j<G.RN;j++){const p=at(G,i,j);if(p[1]>3){lights.push(p[0],p[1]+8,p[2]);const c=rnd()<.8?warm:cool;lc.push(c.r,c.g,c.b);break;}}}
      const homes=[];
      for(const a0 of(o.towns||[Math.PI*1.32,Math.PI*1.7])){const ic=Math.round(a0/TAU*G.A);
        for(let t=0,n=0;t<1200&&n<(phone?80:140);t++){const i=ic+Math.round(RR(-6,6)),j=Math.floor(RR(0,6)),p=at(G,i,j);if(p[1]<6||p[1]>160)continue;
          const x=p[0]+RR(-40,40),z=p[2]+RR(-40,40),tall=rnd()<.25,h=tall?RR(90,320):RR(25,90),w=RR(20,44);n++;
          homes.push(new THREE.Matrix4().compose(new THREE.Vector3(x,p[1]-4,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rnd()*3),new THREE.Vector3(w,h,w*RR(.7,1.3))));
          if(rnd()<.5){lights.push(x,p[1]+h+6,z);lc.push(warm.r,warm.g,warm.b);}}}
      if(homes.length){const mat=typeof TOWER_LOOK==='function'?TOWER_LOOK(new THREE.MeshStandardMaterial({color:0xffffff}),{far:[450,2400],glow:2}):new THREE.MeshStandardMaterial({color:0x8a94a8,emissive:0x2a2418});
        const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1).translate(0,.5,0),mat,homes.length);const tc=new THREE.Color(0xffffff);
        homes.forEach((m,i)=>{im.setMatrixAt(i,m);im.setColorAt(i,tc);});scene.add(im);}
      if(o.glow){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lights,3));g.setAttribute('color',new THREE.Float32BufferAttribute(lc,3));
        scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:90,map:o.glow,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})));}}
    return{};}
  return{build};
})();
