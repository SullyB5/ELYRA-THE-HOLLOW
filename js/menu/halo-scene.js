/* Elyra · the menu backdrop. Nov 4 2026 (Bryce): a menu that moves like Halo 3's (a slow camera, a landmark, things passing through
   the sky, the view cutting between angles), and then, the same day: night only, and not Halo's ring but our own symmetrical landmark.
   So: the Spear of Destiny (js/shared/spear.js, the same build Tide City stands round) seen at night from Elyra's shore, Tide City's
   platforms lit round its foot out on the water, the moon low behind it and its path on the sea, a Hollow warship crashed in the
   shallows and still smoking, a Keeper cruiser crossing high up, interceptors sweeping through, a dropship circling the Spear, and the
   Hollow fleet far off over the horizon.
   API: MENU3D.focus('main'|'campaign'|'level'|'takeover'): each part of the menu has its own shots. MENU3D.jump(shot,u) holds one (tests).
   three.js r128 (global); models through MODELS (js/shared/models.js), each swapping in when its file arrives. */
const MENU3D=(()=>{
  const NOOP={setTime(){},focus(){},jump(){}};
  const cv=document.getElementById('bg');
  if(typeof THREE==='undefined'||typeof SPEAR_KIT==='undefined'||!cv)return NOOP;
  const LS={get(k,d){try{return localStorage.getItem(k)||d;}catch(_){return d;}}};
  const phone=matchMedia('(pointer: coarse)').matches,low=LS.get('elyra.quality','high')==='low';
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let R;try{R=new THREE.WebGLRenderer({canvas:cv,antialias:!low,powerPreference:'high-performance'});}catch(e){return NOOP;}
  R.setPixelRatio(Math.min(devicePixelRatio||1,low?1:phone?1.6:1.75));
  R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.3;R.shadowMap.enabled=!low;R.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(46,1,2,40000);
  const V=(x,y,z)=>new THREE.Vector3(x,y,z),C=h=>new THREE.Color(h);
  const tx=n=>{const t=new THREE.TextureLoader().load('img/tex/'+n+'-'+(phone?'phone':'pc')+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;};
  // the night (the blue of Halo 3's menu): sky, fog and the moon low behind the Spear
  const N={top:0x020713,hor:0x1d3d72,low:0x0c1730,moon:V(-.12,.2,-.97).normalize(),moonC:0x9fbaff,fog:.0001};
  const SP=V(0,0,-2600);   // the Spear's foot

  /* ---------- noise ---------- */
  const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};
  const sm=t=>t*t*(3-2*t);
  function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi),a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);
    return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf;}
  function fbm(x,y,o){let s=0,a=.5,f=1;for(let i=0;i<(o||4);i++){s+=a*vn(x*f,y*f);f*=2.03;a*=.5;}return s;}
  const smst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  // the shore: dunes where the camera stands, a beach, then the sea floor falling away under the water toward the city
  const shoreZ=x=>-1150+260*Math.sin(x/900)+140*Math.sin(x/370+1);
  function H(x,z){const d=z-shoreZ(x),land=12+fbm(x/900,z/900)*70+fbm(x/250,z/250,3)*14;
    return -45+(land+45)*smst(-520,260,d);}

  /* ---------- the sky ---------- */
  const skyU={top:{value:C(N.top)},hor:{value:C(N.hor)},low:{value:C(N.low)},sun:{value:N.moon.clone()},sunC:{value:C(N.moonC)}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(30000,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 top,hor,low,sunC,sun;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=d.y;'+
      'vec3 c=h>0.?mix(hor,top,pow(clamp(h*1.6,0.,1.),.62)):mix(hor,low,clamp(-h*6.,0.,1.));float s=max(dot(d,normalize(sun)),0.);'+
      'c+=sunC*(pow(s,6.)*.25+pow(s,60.)*.32+smoothstep(.9993,.9997,s)*1.5);gl_FragColor=vec4(c,1.);}'}));
  sky.renderOrder=-10;scene.add(sky);
  const stars=(()=>{const n=phone?900:1600,p=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*Math.PI*2,v=Math.acos(Math.random()*.92+.08),r=28000;
      p[i*3]=Math.sin(v)*Math.cos(u)*r;p[i*3+1]=Math.cos(v)*r;p[i*3+2]=Math.sin(v)*Math.sin(u)*r;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const s=new THREE.Points(g,new THREE.PointsMaterial({color:0xdfe8ff,size:phone?2.2:1.8,sizeAttenuation:false,transparent:true,opacity:.85,fog:false,depthWrite:false}));s.renderOrder=-9;scene.add(s);return s;})();
  function blob(sz,soft,noisy){const c=document.createElement('canvas');c.width=c.height=sz;const x=c.getContext('2d');
    if(!noisy){const g=x.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(soft,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,sz,sz);}
    else for(let i=0;i<26;i++){const r=sz*(.12+Math.random()*.2),px=sz*(.25+Math.random()*.5),py=sz*(.35+Math.random()*.3),g=x.createRadialGradient(px,py,0,px,py,r);
      g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,sz,sz);}
    return new THREE.CanvasTexture(c);}
  const GLOW=blob(64,.25),PUFF=blob(128,0,true);
  const moonSp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:N.moonC,fog:false,depthWrite:false,transparent:true,blending:THREE.AdditiveBlending,toneMapped:false}));
  moonSp.scale.setScalar(1500);moonSp.renderOrder=-8;scene.add(moonSp);

  /* ---------- light: the moon behind the Spear (it stands in silhouette, rimmed), and a cold fill ---------- */
  const moonL=new THREE.DirectionalLight(0xa6c0ff,1.6),hemi=new THREE.HemisphereLight(0x4a6cb4,0x101830,.85);scene.add(moonL,moonL.target,hemi);
  moonL.target.position.copy(SP);moonL.position.copy(SP).addScaledVector(N.moon,6000);
  moonL.castShadow=!low;{const s=moonL.shadow;s.mapSize.set(phone?1024:2048,phone?1024:2048);const c=s.camera;c.left=c.bottom=-1900;c.right=c.top=1900;c.near=100;c.far=12000;s.bias=-.0004;s.normalBias=2;}
  scene.fog=new THREE.FogExp2(N.hor,N.fog);R.setClearColor(N.hor);

  /* ---------- the shore ---------- */
  (()=>{const n=phone?170:230,g=new THREE.PlaneGeometry(2,2,n,n);g.rotateX(-Math.PI/2);
    const P=g.attributes.position,uv=g.attributes.uv,col=new Float32Array(P.count*3);
    for(let i=0;i<P.count;i++){const u=P.getX(i),w=P.getZ(i),x=Math.sign(u)*Math.pow(Math.abs(u),2.3)*26000,z=-600+Math.sign(w)*Math.pow(Math.abs(w),2.3)*26000,y=H(x,z);
      P.setXYZ(i,x,y,z);uv.setXY(i,x/55,z/55);const k=(.78+.3*fbm(x/600+40,z/600-9,3))*(y<4?.55:1);col[i*3]=col[i*3+1]=col[i*3+2]=k;}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
    const m=new THREE.MeshStandardMaterial({color:0x5a6a96,map:tx('sand'),normalMap:tx('sand-n'),vertexColors:true,roughness:1,metalness:0});m.normalScale.set(.8,.8);
    const o=new THREE.Mesh(g,m);o.receiveShadow=true;scene.add(o);})();
  // headlands and islands round the horizon
  {const seg=phone?160:260,rows=6,p=[],ix=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,r=12500+j*650,v=j/rows,
        ht=(Math.pow(fbm(Math.cos(a)*6+11,Math.sin(a)*6-4,5),2.2)*2600)*Math.sin(v*Math.PI)*(.6+.4*fbm(a*9,j));
      p.push(Math.cos(a)*r,ht-140,Math.sin(a)*r-1400);}
    for(let j=0;j<rows;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+seg+1;ix.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();
    scene.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x2c3b60,roughness:1,flatShading:true})));}

  /* ---------- the sea: small waves, the sky in it at a glance, and the moon's path toward the camera ---------- */
  const seaU=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{deep:{value:C(0x040a18)},skyc:{value:C(N.hor)},moon:{value:N.moon.clone()},moonC:{value:C(0xc8d8ff)},t:{value:0}}]);
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(60000,60000,1,1).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:seaU,fog:true,toneMapped:false,
    vertexShader:'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader:'uniform vec3 deep,skyc,moon,moonC;uniform float t;varying vec3 vW;\n#include <common>\n#include <fog_pars_fragment>\n'+
      'void main(){vec3 V=normalize(cameraPosition-vW);vec2 p=vW.xz;'+
      'float nx=sin(p.x*.021+t*.6)*.05+sin(p.y*.031-t*.4+p.x*.01)*.05+sin(p.x*.11+p.y*.07+t*1.3)*.03+sin(p.x*.41-p.y*.23+t*2.1)*.015;'+
      'float nz=cos(p.y*.023+t*.5)*.05+sin(p.x*.017+p.y*.013-t*.7)*.05+cos(p.y*.13-p.x*.05+t*1.1)*.03+cos(p.y*.37+p.x*.29-t*1.9)*.015;'+
      'vec3 Nn=normalize(vec3(nx,1.,nz));float fr=pow(1.-max(dot(Nn,V),0.),4.);vec3 Rr=reflect(-V,Nn);float s=max(dot(Rr,moon),0.);'+
      'vec3 c=mix(deep,skyc,.12+.7*fr)+moonC*(pow(s,220.)*2.2+pow(s,30.)*.1);gl_FragColor=vec4(c,1.);\n#include <fog_fragment>\n}'}));
  sea.position.set(0,0,-1400);scene.add(sea);

  /* ---------- the Spear of Destiny, and Tide City round its foot ---------- */
  const spear=SPEAR_KIT.build();spear.group.position.copy(SP);scene.add(spear.group);
  // no reflections to catch out here, so the gold would go black: less metal, and a little of its own warmth
  spear.mats.gold.metalness=.35;spear.mats.gold.roughness=.4;spear.mats.gold.emissive.set(0x5a3c10);spear.mats.shaft.metalness=.25;
  const tip=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffd890,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false}));
  tip.position.copy(SP).setY(spear.top-40);tip.scale.setScalar(160);scene.add(tip);
  const platM=new THREE.MeshStandardMaterial({color:0x2a3040,roughness:.8,metalness:.3}),rimM=new THREE.MeshStandardMaterial({color:0x1a1408,emissive:0xd9a548,emissiveIntensity:.6});
  function plat(x,z,r,h){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.04,h,8),platM);m.position.set(x,h/2-6,z);m.rotation.y=Math.PI/8;m.receiveShadow=m.castShadow=true;scene.add(m);
    const e=new THREE.Mesh(new THREE.CylinderGeometry(r*1.005,r*1.005,1.5,8,1,true),rimM);e.position.set(x,h-6,z);e.rotation.y=Math.PI/8;scene.add(e);}
  plat(SP.x,SP.z,330,18);
  // seven districts round the core; one standing straight between the shore and the Spear would hide its foot, so that one isn't built
  const DIST=[];for(let k=0;k<7;k++){const a=k/7*Math.PI*2+.3,d=1050+(k%2)*260,r=260+(k*53%120),x=SP.x+Math.cos(a)*d,z=SP.z+Math.sin(a)*d;
    if(z>SP.z+600&&Math.abs(x-SP.x)<500)continue;DIST.push([x,z,r]);}
  for(const [x,z,r] of DIST){plat(x,z,r,14);
    const L=Math.hypot(x-SP.x,z-SP.z)-330-r,cw=new THREE.Mesh(new THREE.BoxGeometry(18,4,L),platM);cw.position.set((x+SP.x)/2,6,(z+SP.z)/2);cw.lookAt(x,6,z);scene.add(cw);}
  // its towers (each model a cluster of spires) keep their own textures, cooled for the night
  let towerM=null;
  function tower(x,z,h){const g=new THREE.Group();g.position.set(x,8,z);g.rotation.y=Math.random()*6;scene.add(g);
    if(typeof MODELS!=='undefined')MODELS.load('tower').then(src=>{const G=src.geometry;if(!G.boundingBox)G.computeBoundingBox();const b=G.boundingBox,k=h/(b.max.y-b.min.y);
      if(!towerM){towerM=src.material.clone();towerM.color.set(0x8da2cc);}const m=new THREE.Mesh(G,towerM);m.scale.setScalar(k);m.position.set(-(b.min.x+b.max.x)/2*k,-b.min.y*k,-(b.min.z+b.max.z)/2*k);m.castShadow=m.receiveShadow=true;g.add(m);}).catch(()=>{});}
  for(const [x,z,r] of DIST)tower(x,z,240+r*.9);
  // the city's lights: windows and decks, warm, with a few Keeper-blue ones
  {const n=phone?1600:3200,p=new Float32Array(n*3),c=new Float32Array(n*3),W=C(0xffc878),B=C(0x9fe4ff),per=Math.floor(n/DIST.length);let i=0;
    for(const [x,z,r] of DIST)for(let k=0;k<per;k++,i++){const a=Math.random()*Math.PI*2,d=Math.sqrt(Math.random())*r*.95,up=Math.random()>=.82,hh=up?20+Math.pow(Math.random(),2)*(180+r*.5):9+Math.random()*4;
      p[i*3]=x+Math.cos(a)*d*(up?.22:1);p[i*3+1]=hh;p[i*3+2]=z+Math.sin(a)*d*(up?.22:1);const q=Math.random()<.18?B:W;c[i*3]=q.r;c[i*3+1]=q.g;c[i*3+2]=q.b;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p.subarray(0,i*3),3));g.setAttribute('color',new THREE.BufferAttribute(c.subarray(0,i*3),3));
    scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:phone?3.2:2.6,sizeAttenuation:false,map:GLOW,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));}

  /* ---------- ships: a hull from boxes now, the real model when its file arrives. Stern at +z, flying -z ---------- */
  const shipMats={};
  function ship(name,len,o){o=o||{};const g=new THREE.Group(),stand=new THREE.Mesh(new THREE.BoxGeometry(len*.22,len*.08,len),new THREE.MeshStandardMaterial({color:o.tint||0x8a8c90,roughness:.7}));
    g.add(stand);stand.castShadow=!!o.shadow;
    if(o.glow){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:o.glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false}));
      s.position.z=len*.5;s.scale.setScalar(len*(o.gs||.3));g.add(s);}
    if(typeof MODELS!=='undefined')MODELS.load(name).then(src=>{const G=src.geometry;if(!G.boundingBox)G.computeBoundingBox();const b=G.boundingBox,k=len/(b.max.z-b.min.z),c=b.getCenter(V());
      let m=shipMats[name];if(!m){m=src.material.clone();m.side=THREE.DoubleSide;m.transparent=false;m.depthWrite=true;if(o.tint)m.color=C(o.tint);m.needsUpdate=true;shipMats[name]=m;}
      const mesh=new THREE.Mesh(G,m);mesh.scale.setScalar(k);mesh.position.copy(c).multiplyScalar(-k);mesh.castShadow=mesh.receiveShadow=!!o.shadow;g.add(mesh);stand.visible=false;}).catch(()=>{});
    return g;}
  // the Hollow warship that came down in the battle: nose up in the shallows, still smoking
  const WRECK=V(-1650,10,-1350);
  const wreck=ship('voidclass',1100,{tint:0x9a94a6,shadow:true});wreck.position.copy(WRECK);wreck.rotation.order='YXZ';wreck.rotation.set(.5,.95,.26);scene.add(wreck);
  const smoke=[];for(let i=0;i<(phone?18:30);i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,color:0x262a36,transparent:true,depthWrite:false,opacity:0}));s.userData.t=i/(phone?18:30);scene.add(s);smoke.push(s);}
  const SMOKE_AT=V(WRECK.x+60,140,WRECK.z-80);
  // rocks along the beach
  {const rock=new THREE.MeshStandardMaterial({color:0x56607e,map:tx('rock'),roughness:.95});
    for(let i=0;i<40;i++){const r=6+Math.pow(Math.random(),2)*55,g=new THREE.IcosahedronGeometry(r,1),P=g.attributes.position;
      for(let k=0;k<P.count;k++)P.setXYZ(k,P.getX(k)*(.7+Math.random()*.6),P.getY(k)*(.45+Math.random()*.4),P.getZ(k)*(.7+Math.random()*.6));g.computeVertexNormals();
      const x=(Math.random()-.5)*5000,z=shoreZ(x)+(Math.random()-.3)*500,m=new THREE.Mesh(g,rock);m.position.set(x,H(x,z)+r*.1,z);m.rotation.set(Math.random(),Math.random()*6,Math.random()*.5);m.castShadow=m.receiveShadow=true;scene.add(m);}}

  /* ---------- the sky's traffic ---------- */
  const TRAF=[];
  {const g=ship('vanguard',460,{glow:0x9fe4ff,gs:.42});scene.add(g);TRAF.push({g,f:t=>{const u=((t*36)%22000)-11000;return[V(u,2100+Math.sin(t*.05)*40,-6200),V(1,0,0)];}});}
  [[-6000,3300,-15000,2200,.4],[2500,3800,-17000,2600,.6],[8000,2900,-14500,1800,.2]].forEach(([x,y,z,len,ph])=>{const g=ship('harrower',len,{tint:0x3a3440,glow:0xff4a3c,gs:.25});scene.add(g);
    TRAF.push({g,f:t=>[V(x+Math.sin(t*.01+ph)*600,y+Math.sin(t*.03+ph)*60,z),V(1,0,.15)]});});
  // interceptor flights: three in a vee, each on its own line past the Spear
  const FLIGHTS=[{a:V(-7000,620,-700),b:V(7000,900,-3300),T:34,o:0},{a:V(6000,480,-5200),b:V(-6000,700,-1200),T:41,o:15},{a:V(-5000,1300,-6800),b:V(4500,520,-600),T:47,o:29}];
  for(const F of FLIGHTS){const grp=[];for(let k=0;k<3;k++){const g=ship('raven',22,{glow:0x9fe4ff,gs:.9});scene.add(g);grp.push(g);}TRAF.push({fl:F,grp});}
  // a Keeper dropship circling the Spear's foot
  const drop=ship('dropship',70,{glow:0x9fe4ff,gs:.5,shadow:true});scene.add(drop);

  /* ---------- clouds and sea spray ---------- */
  const clouds=[];{const n=low?40:phone?60:96;for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,color:0x2d4a80,transparent:true,depthWrite:false,opacity:.6}));
      const sc=1800+Math.random()*3200;s.scale.set(sc*1.9,sc*.75,1);s.position.set((Math.random()-.5)*26000,2900+Math.random()*1800,-1400+(Math.random()-.5)*24000);s.material.rotation=(Math.random()-.5)*.3;
      s.userData.v=.7+Math.random()*.6;scene.add(s);clouds.push(s);}}
  const dust=(()=>{const n=phone?260:520,p=new Float32Array(n*3);for(let i=0;i<n*3;i++)p[i]=(Math.random()-.5)*600;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const o=new THREE.Points(g,new THREE.PointsMaterial({color:0xbcd2ff,map:GLOW,size:phone?3:2.4,sizeAttenuation:false,transparent:true,opacity:.45,depthWrite:false}));o.frustumCulled=false;scene.add(o);return o;})();

  /* ---------- the camera: slow drifts, cut through a dip to black. Each part of the menu has its own set ---------- */
  const SHOTS={
    // from the beach: the Spear right of centre, the menu on the left, the moon beside it
    wide:{p:[V(-560,50,560),V(-360,62,440)],t:[V(-480,700,-2600),V(-400,740,-2600)],fov:42,center:1},
    // the water's edge, looking up the shaft
    low:{p:[V(1050,22,-800),V(820,28,-960)],t:[V(0,1080,-2600),V(0,1200,-2600)],fov:52},
    // close on the crown: the rings turning, the gold head
    crown:{p:[V(520,1150,-1700),V(360,1220,-1820)],t:[V(0,1060,-2600),V(0,1120,-2600)],fov:48},
    wreck:{p:[V(-400,70,-150),V(-640,95,-370)],t:[V(-1650,240,-1400),V(-1650,300,-1400)],fov:44},
    city:{p:[V(-1700,240,-1100),V(-1420,280,-1300)],t:[V(0,420,-2600),V(0,460,-2600)],fov:46},
    high:{p:[V(2600,1000,1100),V(2100,1100,800)],t:[V(0,620,-2600),V(0,640,-2600)],fov:48}};
  const SETS={main:['wide','low','wreck','crown','high'],campaign:['crown','low','wide'],level:['wreck','city'],takeover:['high','city']};
  let set='main',si=0,st=0,fading=false,want=null,hold=false;const SHOT_LEN=still?1e9:17;
  const fadeEl=document.getElementById('bgFade');
  // a cut: dip to black, change the shot underneath, come back up. A focus asked for mid-dip lands on the next one
  function cut(){if(fading)return;fading=true;if(fadeEl)fadeEl.classList.add('on');
    setTimeout(()=>{if(want&&want!==set){set=want;si=0;}else si=(si+1)%SETS[set].length;want=null;st=0;if(fadeEl)fadeEl.classList.remove('on');fading=false;},fadeEl?560:0);}
  function focus(k){if(!SETS[k]||(k===set&&!want))return;want=k;hold=false;cut();}
  function jump(name,u){const k=Object.keys(SETS).find(q=>SETS[q].includes(name));if(!k)return;set=k;si=SETS[k].indexOf(name);st=(u||0)*SHOT_LEN;hold=true;}
  let clock=0;
  function shot(dt){if(!hold){st+=dt;if(st>SHOT_LEN)cut();}
    const S=SHOTS[SETS[set][si]],u=sm(Math.min(1,st/SHOT_LEN)),k=still?.5:.25+.75*u;
    cam.position.lerpVectors(S.p[0],S.p[1],k);cam.position.y=Math.max(cam.position.y,H(cam.position.x,cam.position.z)+20,14);
    const tg=V().lerpVectors(S.t[0],S.t[1],k);
    // a tall phone: the panel covers the lower part and the sides are close, so the opening view centres the Spear and lifts it
    if(S.center&&cam.aspect<1){tg.x=SP.x+(tg.x-SP.x)*.12;tg.y*=.55;}if(!still)tg.add(V(Math.sin(clock*.31)*6,Math.sin(clock*.23)*4,0));cam.lookAt(tg);
    if(cam.fov!==S.fov){cam.fov=S.fov;cam.updateProjectionMatrix();}}

  /* ---------- running it ---------- */
  function size(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.zoom=w/h<.8?.62:w/h<1.2?.8:1;cam.updateProjectionMatrix();}
  addEventListener('resize',size);size();
  let last=performance.now(),run=true;
  document.addEventListener('visibilitychange',()=>{run=!document.hidden;last=performance.now();if(run)requestAnimationFrame(frame);});
  const tmp=V(),fw=V(),side=V();
  function frame(now){if(!run)return;const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;
    shot(dt);sky.position.copy(cam.position);stars.position.copy(cam.position);moonSp.position.copy(cam.position).addScaledVector(N.moon,24000);seaU.t.value=clock;
    spear.tick(clock,1);tip.scale.setScalar(150+Math.sin(clock*1.3)*14);
    for(const T of TRAF){
      if(T.fl){const F=T.fl,per=F.T+18,u=((clock+F.o)%per)/F.T,dir=tmp.subVectors(F.b,F.a).normalize();side.set(-dir.z,0,dir.x).normalize();
        T.grp.forEach((g,k)=>{g.visible=u<=1;if(!g.visible)return;const off=k===0?V():V().addScaledVector(side,(k===1?-1:1)*34).addScaledVector(dir,-30);
          const p=V().lerpVectors(F.a,F.b,u).add(off);p.y-=Math.sin(u*Math.PI)*140;g.position.copy(p);g.lookAt(fw.copy(p).sub(dir));g.rotateZ(Math.sin(u*Math.PI*2)*.35);});
        continue;}
      const [p,d]=T.f(clock);T.g.position.copy(p);T.g.lookAt(fw.copy(p).sub(d));}
    // the dropship: round the Spear, nose first (a model looks down -z, so it faces away from where lookAt points it)
    {const a=clock*.05;drop.position.set(SP.x+Math.cos(a)*620,240+Math.sin(clock*.6)*6,SP.z+Math.sin(a)*620);
      drop.lookAt(fw.set(SP.x+Math.cos(a-.1)*620,240,SP.z+Math.sin(a-.1)*620));}
    for(const c of clouds){c.position.x+=c.userData.v*140*dt;if(c.position.x>13000)c.position.x-=26000;}
    for(const s of smoke){const t=(s.userData.t+clock*.035)%1;s.position.set(SMOKE_AT.x+t*t*1400,SMOKE_AT.y+t*1300,SMOKE_AT.z+Math.sin(t*5+s.userData.t*9)*60);
      s.scale.setScalar(60+t*650);s.material.opacity=Math.pow(Math.sin(t*Math.PI),1.5)*.34;}
    {const P=dust.geometry.attributes.position;for(let i=0;i<P.count;i++){let x=P.getX(i)+dt*(26+(i%7)*3);if(x>300)x-=600;P.setX(i,x);P.setY(i,P.getY(i)+Math.sin(clock+i)*dt*2);}P.needsUpdate=true;dust.position.copy(cam.position);}
    R.render(scene,cam);requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
  return{setTime(){},focus,jump,get time(){return 'night';}};
})();
