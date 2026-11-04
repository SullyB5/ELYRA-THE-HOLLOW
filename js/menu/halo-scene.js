/* Elyra · the menu backdrop (Nov 4 2026, Bryce: "overhaul the menu to match Halo 3's": a slow camera over a desolate plain, a vast
   broken structure arcing out of the ground, clouds rolling over, things moving in the sky, and the view cutting between angles).
   Elyra's version: a broken Herald arch rising out of the dust, a Hollow warship crashed nose-up and still smoking, Tide City's spires on
   the horizon under a mountain range, a Keeper cruiser crossing high up, interceptor flights sweeping through, a dropship holding by
   the arch, and the Hollow fleet far off in the haze. Two lights to compare: DAY (pale, hazy, bright) and NIGHT (the blue Halo 3 look).
   API: MENU3D.setTime('day'|'night'), MENU3D.focus('main'|'campaign'|'level'|'takeover'): each part of the menu has its own shots.
   three.js r128 (global), models through MODELS (js/shared/models.js). Built from code first; each model swaps in when it arrives. */
const MENU3D=(()=>{
  const cv=document.getElementById('bg');
  if(typeof THREE==='undefined'||!cv)return{setTime(){},focus(){}};
  const LS={get(k,d){try{return localStorage.getItem(k)||d;}catch(_){return d;}}};
  const phone=matchMedia('(pointer: coarse)').matches,low=LS.get('elyra.quality','high')==='low';
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let R;try{R=new THREE.WebGLRenderer({canvas:cv,antialias:!low,powerPreference:'high-performance'});}catch(e){return{setTime(){},focus(){}};}
  R.setPixelRatio(Math.min(devicePixelRatio||1,low?1:phone?1.6:1.75));
  R.toneMapping=THREE.ACESFilmicToneMapping;R.shadowMap.enabled=!low;R.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(46,1,2,40000);
  const V=(x,y,z)=>new THREE.Vector3(x,y,z),C=h=>new THREE.Color(h);
  const tx=n=>{const t=new THREE.TextureLoader().load('img/tex/'+n+'-'+(phone?'phone':'pc')+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;};

  /* ---------- noise for the ground and the mountains ---------- */
  const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};
  const sm=t=>t*t*(3-2*t);
  function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi),a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);
    return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf;}
  function fbm(x,y,o){let s=0,a=.5,f=1;for(let i=0;i<(o||4);i++){s+=a*vn(x*f,y*f);f*=2.03;a*=.5;}return s;}
  const smst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  // the plain: long low dunes near, rising into broken ridges far off
  function H(x,z){const d=Math.hypot(x,z+1400),near=.35+.65*smst(1200,4000,d);
    return (fbm(x/1700,z/1700)*150-75+fbm(x/320,z/320,3)*22)*near+smst(4500,16000,d)*Math.pow(fbm(x/2600+7,z/2600-3),1.6)*1400;}

  /* ---------- the sky: a gradient dome with the sun (or moon) glowing in it; its horizon is the fog's colour ---------- */
  const skyU={top:{value:C(0)},hor:{value:C(0)},low:{value:C(0)},sun:{value:V(0,1,0)},sunC:{value:C(0)},glow:{value:1}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(30000,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 top,hor,low,sunC,sun;uniform float glow;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=d.y;'+
      'vec3 c=h>0.?mix(hor,top,pow(clamp(h*1.6,0.,1.),.62)):mix(hor,low,clamp(-h*6.,0.,1.));float s=max(dot(d,normalize(sun)),0.);'+
      'c+=sunC*(pow(s,6.)*.28*glow+pow(s,60.)*.35*glow+smoothstep(.9993,.9997,s)*1.6);gl_FragColor=vec4(c,1.);}'}));
  sky.renderOrder=-10;scene.add(sky);
  // stars, night only
  const stars=(()=>{const n=phone?900:1600,p=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*Math.PI*2,v=Math.acos(Math.random()*.92+.08),r=28000;
      p[i*3]=Math.sin(v)*Math.cos(u)*r;p[i*3+1]=Math.cos(v)*r;p[i*3+2]=Math.sin(v)*Math.sin(u)*r;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const m=new THREE.PointsMaterial({color:0xdfe8ff,size:phone?2.2:1.8,sizeAttenuation:false,transparent:true,opacity:.8,fog:false,depthWrite:false});
    const s=new THREE.Points(g,m);s.renderOrder=-9;scene.add(s);return s;})();
  // soft round textures, drawn once: a glow and a cloud puff
  function blob(sz,soft,noisy){const c=document.createElement('canvas');c.width=c.height=sz;const x=c.getContext('2d');
    if(!noisy){const g=x.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(soft,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,sz,sz);}
    else for(let i=0;i<26;i++){const r=sz*(.12+Math.random()*.2),px=sz*(.25+Math.random()*.5),py=sz*(.35+Math.random()*.3),g=x.createRadialGradient(px,py,0,px,py,r);
      g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,sz,sz);}
    const t=new THREE.CanvasTexture(c);return t;}
  const GLOW=blob(64,.25),PUFF=blob(128,0,true);
  const sunSp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffffff,fog:false,depthWrite:false,transparent:true,blending:THREE.AdditiveBlending,toneMapped:false}));
  sunSp.scale.setScalar(2600);sunSp.renderOrder=-8;scene.add(sunSp);

  /* ---------- light ---------- */
  const sunL=new THREE.DirectionalLight(0xffffff,2),hemi=new THREE.HemisphereLight(0xffffff,0x444444,.8);scene.add(sunL,sunL.target,hemi);
  sunL.castShadow=!low;{const s=sunL.shadow;s.mapSize.set(phone?1024:2048,phone?1024:2048);const c=s.camera;c.left=c.bottom=-1700;c.right=c.top=1700;c.near=100;c.far=9000;s.bias=-.0004;s.normalBias=2;}
  sunL.target.position.set(100,0,-1500);
  scene.fog=new THREE.FogExp2(0xffffff,.0001);

  /* ---------- the ground: one grid, dense where the camera is, stretched out toward the horizon ---------- */
  const ground=(()=>{const N=phone?170:230,g=new THREE.PlaneGeometry(2,2,N,N);g.rotateX(-Math.PI/2);
    const P=g.attributes.position,uv=g.attributes.uv,col=new Float32Array(P.count*3);
    for(let i=0;i<P.count;i++){const u=P.getX(i),w=P.getZ(i),x=Math.sign(u)*Math.pow(Math.abs(u),2.3)*26000,z=-1400+Math.sign(w)*Math.pow(Math.abs(w),2.3)*26000,y=H(x,z);
      P.setXYZ(i,x,y,z);uv.setXY(i,x/55,z/55);const k=.78+.3*fbm(x/600+40,z/600-9,3)+Math.min(.18,Math.max(-.2,y/900));col[i*3]=col[i*3+1]=col[i*3+2]=k;}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
    const m=new THREE.MeshStandardMaterial({map:tx('sand'),normalMap:tx('sand-n'),vertexColors:true,roughness:1,metalness:0});m.normalScale.set(.8,.8);
    const o=new THREE.Mesh(g,m);o.receiveShadow=true;scene.add(o);return o;})();
  // the mountains round the world: a ring of ridges past the haze line
  const mtns=(()=>{const seg=phone?160:260,rows=6,p=[],ix=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,r=11800+j*650,v=j/rows,
        ht=(Math.pow(fbm(Math.cos(a)*6+11,Math.sin(a)*6-4,5),1.7)*2600+250)*Math.sin(v*Math.PI)*(.6+.4*fbm(a*9,j));
      p.push(Math.cos(a)*r,ht-120,Math.sin(a)*r-1400);}
    for(let j=0;j<rows;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+seg+1;ix.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();
    const o=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x8a8478,roughness:1,flatShading:true}));scene.add(o);return o;})();

  /* ---------- the arch: a broken Herald ring, rising out of the dust on the right and breaking off high on the left ---------- */
  const ARCH={c:V(560,-400,-1650),R:1080,a0:.2,a1:2.18,yaw:-.42};
  const metal=tx('metal039'),metalN=tx('metal039-n');metal.repeat.set(.012,.012);metalN.repeat.set(.012,.012);
  const hull=new THREE.MeshStandardMaterial({color:0xb8b4ae,map:metal,normalMap:metalN,roughness:.62,metalness:.35});
  const hullDark=new THREE.MeshStandardMaterial({color:0x6c6a68,map:metal,roughness:.75,metalness:.3});
  const glowM=new THREE.MeshBasicMaterial({color:0x7fe9ff,toneMapped:false});
  const arch=new THREE.Group();arch.position.copy(ARCH.c);arch.rotation.y=ARCH.yaw;scene.add(arch);
  class Arc extends THREE.Curve{constructor(r,a0,a1){super();this.r=r;this.a0=a0;this.a1=a1;}getPoint(t,o){const a=this.a0+(this.a1-this.a0)*t;return(o||V()).set(Math.cos(a)*this.r,Math.sin(a)*this.r,0);}}
  function band(r,w,d,a0,a1,mat,steps){const s=new THREE.Shape();s.moveTo(-d/2,-w/2);s.lineTo(d/2,-w/2);s.lineTo(d/2*.8,w/2);s.lineTo(-d/2*.8,w/2);s.lineTo(-d/2,-w/2);
    const g=new THREE.ExtrudeGeometry(s,{steps:steps||140,bevelEnabled:false,extrudePath:new Arc(r,a0,a1)});const m=new THREE.Mesh(g,mat);m.castShadow=m.receiveShadow=true;arch.add(m);return m;}
  band(ARCH.R,130,170,ARCH.a0,ARCH.a1,hull);                      // the outer spine
  band(ARCH.R-200,60,96,ARCH.a0,ARCH.a1-.16,hull);                // the inner rail
  band(ARCH.R-150,8,10,ARCH.a0,ARCH.a1-.2,glowM,100).castShadow=false;   // the light along its inside
  band(ARCH.R+72,14,186,ARCH.a0,ARCH.a1-.04,hullDark);
  band(ARCH.R+20,26,40,ARCH.a0,ARCH.a1-.02,hullDark).position.z=96;band(ARCH.R+20,26,40,ARCH.a0,ARCH.a1-.02,hullDark).position.z=-96;   // ridges down both faces            // a lip on the outside
  {const rib=new THREE.BoxGeometry(200,44,130),n=30;for(let i=0;i<n;i++){const a=ARCH.a0+(ARCH.a1-.2-ARCH.a0)*i/(n-1),m=new THREE.Mesh(rib,i%3?hullDark:hull);
      m.position.set(Math.cos(a)*(ARCH.R-100),Math.sin(a)*(ARCH.R-100),0);m.rotation.z=a;m.castShadow=m.receiveShadow=true;arch.add(m);
      if(i%4===1){const l=new THREE.Mesh(new THREE.BoxGeometry(24,10,136),glowM);l.position.copy(m.position).multiplyScalar(1.12);l.rotation.z=a;arch.add(l);}}}
  // the broken end: torn plates and cables hanging off it
  {const a=ARCH.a1,e=V(Math.cos(a)*ARCH.R,Math.sin(a)*ARCH.R,0);
    for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(50+Math.random()*120,18+Math.random()*40,40+Math.random()*110),i%2?hull:hullDark);
      m.position.copy(e).add(V((Math.random()-.5)*120,(Math.random()-.5)*120,(Math.random()-.5)*100));m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);m.castShadow=true;arch.add(m);}
    const cab=new THREE.MeshStandardMaterial({color:0x1e1f22,roughness:.8});
    for(let i=0;i<7;i++){const s=e.clone().add(V((Math.random()-.5)*80,-20,(Math.random()-.5)*60)),L=120+Math.random()*300,sw=(Math.random()-.5)*60;
      const c=new THREE.CatmullRomCurve3([s,s.clone().add(V(sw*.3,-L*.4,8)),s.clone().add(V(sw,-L,-6))]);const m=new THREE.Mesh(new THREE.TubeGeometry(c,16,1.6+Math.random()*2.4,5),cab);
      m.userData.sw=Math.random()*6;arch.add(m);}}
  // a second, smaller piece fallen on the plain to the left
  const frag=new THREE.Group();frag.position.set(-2300,-470,-3900);frag.rotation.set(0,1.1,.12);scene.add(frag);
  {const s=new THREE.Shape();s.moveTo(-50,-40);s.lineTo(50,-40);s.lineTo(40,40);s.lineTo(-40,40);
    const g=new THREE.ExtrudeGeometry(s,{steps:60,bevelEnabled:false,extrudePath:new Arc(560,.3,1.5)});const m=new THREE.Mesh(g,hullDark);m.castShadow=m.receiveShadow=true;frag.add(m);}
  // rocks and wreckage round the arch's foot
  {const rock=new THREE.MeshStandardMaterial({color:0x8d8a84,map:tx('rock'),roughness:.95});const D=new THREE.Group();scene.add(D);
    for(let i=0;i<46;i++){const r=8+Math.pow(Math.random(),2)*70,g=new THREE.IcosahedronGeometry(r,1),P=g.attributes.position;
      for(let k=0;k<P.count;k++)P.setXYZ(k,P.getX(k)*(.7+Math.random()*.6),P.getY(k)*(.45+Math.random()*.4),P.getZ(k)*(.7+Math.random()*.6));g.computeVertexNormals();
      const a=Math.random()*Math.PI*2,d=Math.random()<.6?200+Math.random()*900:1200+Math.random()*2600,x=ARCH.c.x+Math.cos(a)*d,z=ARCH.c.z+Math.sin(a)*d*.8;
      const m=new THREE.Mesh(g,i%5?rock:hullDark);m.position.set(x,H(x,z)+r*.15,z);m.rotation.set(Math.random(),Math.random()*6,Math.random()*.5);m.castShadow=m.receiveShadow=true;D.add(m);}}

  /* ---------- models: a hull built from boxes now, swapped for the real ship when its file arrives. Stern at +z, flying -z ---------- */
  const shipMats={};
  function ship(name,len,o){o=o||{};const g=new THREE.Group(),stand=new THREE.Mesh(new THREE.BoxGeometry(len*.22,len*.08,len),new THREE.MeshStandardMaterial({color:o.tint||0x8a8c90,roughness:.7}));
    g.add(stand);stand.castShadow=!!o.shadow;
    if(o.glow){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:o.glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false}));
      s.position.z=len*.5;s.scale.setScalar(len*(o.gs||.3));g.add(s);g.userData.glow=s;}
    if(typeof MODELS!=='undefined')MODELS.load(name).then(src=>{const G=src.geometry;if(!G.boundingBox)G.computeBoundingBox();const b=G.boundingBox,k=len/(b.max.z-b.min.z),c=b.getCenter(V());
      let m=shipMats[name];if(!m){m=src.material.clone();m.side=THREE.DoubleSide;m.transparent=false;m.depthWrite=true;if(o.tint)m.color=C(o.tint);m.needsUpdate=true;shipMats[name]=m;}
      const mesh=new THREE.Mesh(G,m);mesh.scale.setScalar(k);mesh.position.copy(c).multiplyScalar(-k);mesh.castShadow=mesh.receiveShadow=!!o.shadow;
      g.add(mesh);stand.visible=false;}).catch(()=>{});
    return g;}
  // props keep their own textures, tinted per time of day (PROPM[key].color)
  const PROPM={};
  function prop(name,h,key){const g=new THREE.Group();
    if(typeof MODELS!=='undefined')MODELS.load(name).then(src=>{const G=src.geometry;if(!G.boundingBox)G.computeBoundingBox();const b=G.boundingBox,k=h/(b.max.y-b.min.y);
      if(!PROPM[key]){PROPM[key]=src.material.clone();PROPM[key].color.set(TIMES[time][key]);}
      const m=new THREE.Mesh(G,PROPM[key]);m.scale.setScalar(k);m.position.set(-(b.min.x+b.max.x)/2*k,-b.min.y*k,-(b.min.z+b.max.z)/2*k);m.castShadow=m.receiveShadow=true;g.add(m);}).catch(()=>{});
    return g;}
  // the crashed Hollow warship: nose up, a third of it in the ground, smoke still rising
  const wreck=ship('voidclass',1300,{tint:0x9a94a6,shadow:true});wreck.position.set(-1350,120,-2900);wreck.rotation.order='YXZ';wreck.rotation.set(.58,.85,.28);scene.add(wreck);
  const smoke=[];{for(let i=0;i<(phone?18:30);i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,color:0x55504c,transparent:true,depthWrite:false,opacity:0}));
      s.userData.t=i/(phone?18:30);scene.add(s);smoke.push(s);}}
  const SMOKE_AT=V(-1300,160,-2900);
  // Tide City's spires on the horizon, and red sandstone needles standing out of the plain
  [[-3400,-11500,1500],[-600,-12800,2000],[2600,-12200,1300]].forEach(([x,z,h])=>{const t=prop('tower',h,'spire');t.position.set(x,H(x,z)-30,z);t.rotation.y=Math.random()*6;scene.add(t);});
  [[2600,-4200,620],[3300,-5200,880],[-3600,-5600,700],[-4800,-3600,520],[4600,-2600,430],[1800,-6900,950]].forEach(([x,z,h])=>{const n=prop('cliff',h,'needle');n.position.set(x,H(x,z)-20,z);n.rotation.y=Math.random()*6;scene.add(n);});

  /* ---------- the sky's traffic ---------- */
  const TRAF=[];
  // the Keeper cruiser, high and slow, crossing left to right
  {const g=ship('vanguard',460,{glow:0x9fe4ff,gs:.42});scene.add(g);TRAF.push({g,f:t=>{const u=((t*36)%22000)-11000;return[V(u,1250+Math.sin(t*.05)*40,-5200),V(1,0,0)];}});}
  // the Hollow fleet, far off in the haze, barely moving
  [[-6000,3300,-15000,2200,.4],[2500,3800,-17000,2600,.6],[8000,2900,-14500,1800,.2]].forEach(([x,y,z,len,ph])=>{const g=ship('harrower',len,{tint:0x3a3440,glow:0xff4a3c,gs:.25});scene.add(g);
    TRAF.push({g,f:t=>[V(x+Math.sin(t*.01+ph)*600+t*6%4000,y+Math.sin(t*.03+ph)*60,z),V(1,0,.15)]});});
  // interceptor flights: three in a vee, one pass every so often, each on its own line across the arch
  const FLIGHTS=[{a:V(-7000,520,-300),b:V(7000,760,-2800),T:34,o:0},{a:V(6000,380,-4200),b:V(-6000,600,-400),T:41,o:15},{a:V(-5000,950,-6000),b:V(4500,420,200),T:47,o:29}];
  for(const F of FLIGHTS){const grp=[];for(let k=0;k<3;k++){const g=ship('raven',22,{glow:0x9fe4ff,gs:.9});scene.add(g);grp.push(g);}
    TRAF.push({fl:F,grp});}
  // a Keeper dropship holding near the arch's foot, turning slowly
  const drop=ship('dropship',70,{glow:0x9fe4ff,gs:.5,shadow:true});scene.add(drop);

  /* ---------- clouds rolling over, and dust in the air ---------- */
  const clouds=[];{const n=low?40:phone?60:96;for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,color:0xffffff,transparent:true,depthWrite:false,opacity:.6}));
      const sc=1800+Math.random()*3200;s.scale.set(sc*1.9,sc*.75,1);s.position.set((Math.random()-.5)*26000,2600+Math.random()*1800,-1400+(Math.random()-.5)*24000);s.material.rotation=(Math.random()-.5)*.3;
      s.userData.v=.7+Math.random()*.6;scene.add(s);clouds.push(s);}}
  const dust=(()=>{const n=phone?260:520,p=new Float32Array(n*3);for(let i=0;i<n*3;i++)p[i]=(Math.random()-.5)*600;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const o=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,map:GLOW,size:phone?3:2.4,sizeAttenuation:false,transparent:true,opacity:.5,depthWrite:false}));o.frustumCulled=false;scene.add(o);return o;})();

  /* ---------- day and night ---------- */
  const TIMES={
    day:{top:0x5f95d4,hor:0xd9e3ec,low:0xc9c4b8,sun:V(.62,.42,.42),sunC:0xfff1d6,glow:1,sunI:2.7,sunCol:0xfff0dc,hs:0xc4dbff,hg:0x9c8d76,hI:.95,fog:.000085,
      ground:0xd6c8ae,mtn:0xa59d90,expo:1.0,cloud:0xffffff,cloudO:.78,stars:0,glowC:0x5ac8d8,dust:0xfff6e6,dustO:.35,smoke:0x6a645e,sunScale:2600,spire:0xe6eaee,needle:0xb48a72,hull:0xc9c5bf},
    night:{top:0x020713,hor:0x1d3d72,low:0x0c1730,sun:V(-.12,.2,-.97),sunC:0x9fbaff,glow:.9,sunI:1.6,sunCol:0xa6c0ff,hs:0x4a6cb4,hg:0x101830,hI:.85,fog:.000105,
      ground:0x7083b0,mtn:0x2c3b60,expo:1.3,cloud:0x2d4a80,cloudO:.6,stars:.85,glowC:0x7fe9ff,dust:0xbcd2ff,dustO:.45,smoke:0x262a36,sunScale:1500,spire:0x8da2cc,needle:0x56607e,hull:0x9aa6c4}};
  let time='day';
  function setTime(k){if(!TIMES[k])return;time=k;const T=TIMES[k];
    skyU.top.value.set(T.top);skyU.hor.value.set(T.hor);skyU.low.value.set(T.low);skyU.sun.value.copy(T.sun).normalize();skyU.sunC.value.set(T.sunC);skyU.glow.value=T.glow;
    scene.fog.color.set(T.hor);scene.fog.density=T.fog;sunL.color.set(T.sunCol);sunL.intensity=T.sunI;hemi.color.set(T.hs);hemi.groundColor.set(T.hg);hemi.intensity=T.hI;
    ground.material.color.set(T.ground);mtns.material.color.set(T.mtn);R.toneMappingExposure=T.expo;stars.visible=T.stars>0;stars.material.opacity=T.stars;
    for(const c of clouds){c.material.color.set(T.cloud);c.material.opacity=T.cloudO;}glowM.color.set(T.glowC);dust.material.color.set(T.dust);dust.material.opacity=T.dustO;
    for(const s of smoke)s.material.color.set(T.smoke);for(const q in PROPM)PROPM[q].color.set(T[q]);hull.color.set(T.hull);
    sunSp.material.color.set(T.sunC);sunSp.scale.setScalar(T.sunScale);
    sunL.position.copy(sunL.target.position).addScaledVector(T.sun.clone().normalize(),5000);
    R.setClearColor(T.hor);}

  /* ---------- the camera: shots that drift slowly, cut through a quick fade. Each part of the menu has its own set ---------- */
  const SHOTS={
    // the opening view: low over the plain, the arch filling the right of the frame, the menu on the left
    wide:{p:[V(-560,60,700),V(-240,80,560)],t:[V(320,420,-1650),V(420,450,-1650)],fov:46},
    under:{p:[V(1250,40,-900),V(1000,55,-1100)],t:[V(260,820,-1800),V(160,880,-1850)],fov:52},
    wreck:{p:[V(-150,70,-1450),V(-420,110,-1720)],t:[V(-1350,300,-2950),V(-1350,380,-2930)],fov:44},
    horizon:{p:[V(-300,520,-900),V(250,560,-1250)],t:[V(-500,700,-9000),V(200,820,-9500)],fov:40},
    high:{p:[V(1800,900,600),V(1300,1000,200)],t:[V(300,300,-1600),V(200,300,-1700)],fov:48},
    breaker:{p:[V(-900,700,-1000),V(-760,760,-1150)],t:[V(-260,640,-2050),V(-200,700,-2150)],fov:50}};
  const SETS={main:['wide','under','wreck','horizon','high'],campaign:['under','breaker','wide'],level:['wreck','horizon'],takeover:['high','horizon']};
  let set='main',si=0,st=0,fading=false,want=null;const SHOT_LEN=still?1e9:17;
  const fadeEl=document.getElementById('bgFade');
  // a cut: dip to black (or white by day), change the shot underneath, come back up. A focus asked for mid-dip lands on the next one
  function cut(){if(fading)return;fading=true;if(fadeEl)fadeEl.classList.add('on');
    setTimeout(()=>{if(want&&want!==set){set=want;si=0;}else si=(si+1)%SETS[set].length;want=null;st=0;if(fadeEl)fadeEl.classList.remove('on');fading=false;},fadeEl?560:0);}
  function focus(k){if(!SETS[k]||(k===set&&!want))return;want=k;cut();}
  let hold=false;
  function shot(dt){if(!hold)st+=dt;if(st>SHOT_LEN&&!hold)cut();
    const S=SHOTS[SETS[set][si]],u=sm(Math.min(1,st/SHOT_LEN)),k=.25+.75*u;
    cam.position.lerpVectors(S.p[0],S.p[1],still?.5:k);cam.position.y=Math.max(cam.position.y,H(cam.position.x,cam.position.z)+35);const tg=V().lerpVectors(S.t[0],S.t[1],still?.5:k);
    // a slow handheld breathing on top
    if(!still)tg.add(V(Math.sin(clock*.31)*6,Math.sin(clock*.23)*4,0));cam.lookAt(tg);
    if(cam.fov!==S.fov){cam.fov=S.fov;cam.updateProjectionMatrix();}}

  /* ---------- running it ---------- */
  function size(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;
    // a tall phone sees less across: widen the lens so the arch still fits
    cam.zoom=w/h<.8?.62:w/h<1.2?.8:1;cam.updateProjectionMatrix();}
  addEventListener('resize',size);size();
  let clock=0,last=performance.now(),run=true;
  document.addEventListener('visibilitychange',()=>{run=!document.hidden;last=performance.now();if(run)requestAnimationFrame(frame);});
  const tmp=V(),fw=V(),side=V();
  function frame(now){if(!run)return;const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;
    shot(dt);sky.position.copy(cam.position);stars.position.copy(cam.position);sunSp.position.copy(cam.position).addScaledVector(skyU.sun.value,24000);
    for(const T of TRAF){
      if(T.fl){const F=T.fl,per=F.T+18,u=((clock+F.o)%per)/F.T,dir=tmp.subVectors(F.b,F.a).normalize();
        side.set(-dir.z,0,dir.x).normalize();
        T.grp.forEach((g,k)=>{g.visible=u<=1;if(!g.visible)return;const off=k===0?V():V().addScaledVector(side,(k===1?-1:1)*34).addScaledVector(dir,-30);
          const p=V().lerpVectors(F.a,F.b,u).add(off);p.y+=Math.sin(u*Math.PI)*-140;g.position.copy(p);g.lookAt(fw.copy(p).sub(dir));g.rotateZ(Math.sin(u*Math.PI*2)*.35);});
        continue;}
      const [p,d]=T.f(clock);T.g.position.copy(p);T.g.lookAt(fw.copy(p).sub(d));}
    drop.position.set(260+Math.sin(clock*.07)*60,150+Math.sin(clock*.6)*6,-980+Math.cos(clock*.07)*40);drop.rotation.set(0,clock*.07+Math.PI*.5,Math.sin(clock*.5)*.03);
    for(const c of arch.children)if(c.userData.sw!=null)c.rotation.z=Math.sin(clock*.4+c.userData.sw)*.006;
    for(const c of clouds){c.position.x+=c.userData.v*140*dt;if(c.position.x>13000)c.position.x-=26000;}
    for(const s of smoke){const t=(s.userData.t+clock*.035)%1;s.position.set(SMOKE_AT.x+t*t*1400,SMOKE_AT.y+t*1300,SMOKE_AT.z+Math.sin(t*5+s.userData.t*9)*60);
      s.scale.setScalar(60+t*650);s.material.opacity=Math.pow(Math.sin(t*Math.PI),1.5)*(time==="day"?.16:.34);}
    {const P=dust.geometry.attributes.position;for(let i=0;i<P.count;i++){let x=P.getX(i)+dt*(26+(i%7)*3),y=P.getY(i)+Math.sin(clock+i)*dt*2,z=P.getZ(i);
        if(x>300)x-=600;P.setXYZ(i,x,y,z);}P.needsUpdate=true;dust.position.copy(cam.position);}
    R.render(scene,cam);requestAnimationFrame(frame);}
  setTime(LS.get('elyra.menu.time','day'));requestAnimationFrame(frame);
  // (for testing a view: MENU3D.jump('wreck', 0.5) holds that shot at that point)
  function jump(name,u){const k=Object.keys(SETS).find(q=>SETS[q].includes(name));if(!k)return;set=k;si=SETS[k].indexOf(name);st=(u||0)*SHOT_LEN;hold=true;}
  return{setTime,focus,jump,get time(){return time;}};
})();
