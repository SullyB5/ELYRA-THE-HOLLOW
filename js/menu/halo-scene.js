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
  R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.12;R.shadowMap.enabled=!low;R.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(46,1,2,40000);
  const V=(x,y,z)=>new THREE.Vector3(x,y,z),C=h=>new THREE.Color(h);
  const tx=n=>{const t=new THREE.TextureLoader().load('img/tex/'+n+'-'+(phone?'phone':'pc')+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;};
  // the night (the blue of Halo 3's menu): sky, fog and the moon low behind the Spear
  const N={top:0x01040c,hor:0x16284c,low:0x080f22,moon:V(-.12,.2,-.97).normalize(),moonC:0x9fbaff,fog:.0001};
  const SP=V(0,0,-2600);   // the Spear's foot
  const WRECK=V(-1650,10,-1350);   // the Hollow warship down in the shallows

  /* ---------- noise ---------- */
  const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};
  const sm=t=>t*t*(3-2*t);
  function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi),a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);
    return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf;}
  function fbm(x,y,o){let s=0,a=.5,f=1;for(let i=0;i<(o||4);i++){s+=a*vn(x*f,y*f);f*=2.03;a*=.5;}return s;}
  const smst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  // the shore: dunes where the camera stands, a beach, then the sea floor falling away under the water toward the city
  const shoreZ=x=>-1150+260*Math.sin(x/900)+140*Math.sin(x/370+1);
  // Nov 8: flat ground cut into the dunes for the Keeper post on the shore (the landing pad, the gun battery, the mast)
  const FLAT=[{x:1150,z:-260,r:105,y:30},{x:620,z:-760,r:60,y:22},{x:-2650,z:-880,r:60,y:22},{x:-180,z:-20,r:26,y:0},{x:-470,z:470,r:12,y:0}];   // (Nov 10: the last, the nav table's overlook)
  function H0(x,z){const d=z-shoreZ(x),land=12+fbm(x/900,z/900)*70+fbm(x/250,z/250,3)*14;
    return -45+(land+45)*smst(-520,260,d);}
  for(const f of FLAT)if(!f.y)f.y=H0(f.x,f.z);
  function H(x,z){let h=H0(x,z);for(const f of FLAT){const d=Math.hypot(x-f.x,z-f.z);if(d<f.r*2.2)h+=(f.y-h)*(1-smst(f.r,f.r*2.2,d));}return h;}

  /* ---------- the sky ---------- */
  // Nov 4 (Bryce: "a better skybox... doesn't need to be crazy, just cleaner"): a smooth night gradient, a faint band of the galaxy
  // across it with dark lanes, the moon as a clean disc with a soft halo, and the stars as points (below)
  const skyU={top:{value:C(N.top)},hor:{value:C(N.hor)},low:{value:C(N.low)},sun:{value:N.moon.clone()},sunC:{value:C(N.moonC)},band:{value:V(.35,.82,.45).normalize()}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(30000,48,24),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 top,hor,low,sunC,sun,band;varying vec3 vD;'+
      'float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}'+
      'float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),'+
        'mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}'+
      'float fb(vec3 p){return .5*n3(p)+.25*n3(p*2.03)+.125*n3(p*4.1)+.0625*n3(p*8.3);}'+
      'void main(){vec3 d=normalize(vD);float h=d.y;'+
      'vec3 c=h>0.?mix(hor,top,pow(clamp(h*1.5,0.,1.),.55)):mix(hor,low,clamp(-h*6.,0.,1.));'+
      // the galaxy: a soft band on a great circle, brightest along its middle, broken by darker lanes, faded out low in the haze
      'float off=dot(d,band),bd=exp(-off*off/.022);float cl=fb(d*5.)*.7+fb(d*13.)*.3;float lane=smoothstep(.45,.7,fb(d*9.+3.));'+
      'c+=vec3(.42,.5,.75)*bd*(.06+.09*cl)*(1.-.75*lane)*smoothstep(.02,.3,h);'+
      'float s=max(dot(d,normalize(sun)),0.);'+
      // the moon: a halo, a crisp disc with a little shading toward its edge
      'c+=sunC*(pow(s,8.)*.14+pow(s,90.)*.28);float disc=smoothstep(.99955,.99968,s);float limb=smoothstep(.99955,.99995,s);'+
      'c=mix(c,vec3(.86,.9,1.)*(.78+.22*limb)*(.92+.08*fb(d*900.)),disc);'+
      'gl_FragColor=vec4(c,1.);}'}));
  sky.renderOrder=-10;scene.add(sky);
  // stars: three layers. Many faint, some brighter, a few bright ones that twinkle; all fade toward the hazy horizon
  const starL=[];
  [[phone?1400:2600,1.1,.55],[phone?260:420,1.8,.8],[phone?40:60,2.8,1]].forEach(([n,sz,op],L)=>{const p=new Float32Array(n*3),c=new Float32Array(n*3);
    for(let i=0;i<n;i++){const u=Math.random()*Math.PI*2,y=.06+Math.pow(Math.random(),.8)*.94,r=Math.sqrt(1-y*y),R0=28000;
      p[i*3]=r*Math.cos(u)*R0;p[i*3+1]=y*R0;p[i*3+2]=r*Math.sin(u)*R0;
      const k=Math.min(1,y*4),t=Math.random();c[i*3]=k*(t<.15?1:.82+.18*t);c[i*3+1]=k*(.88+.12*t);c[i*3+2]=k;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
    const m=new THREE.PointsMaterial({size:(phone?1.25:1)*sz,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:op,fog:false,depthWrite:false,blending:THREE.AdditiveBlending});
    const o=new THREE.Points(g,m);o.renderOrder=-9;scene.add(o);starL.push(o);});
  const stars={position:{copy(v){for(const o of starL)o.position.copy(v);}}};
  function blob(sz,soft,noisy){const c=document.createElement('canvas');c.width=c.height=sz;const x=c.getContext('2d');
    if(!noisy){const g=x.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(soft,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,sz,sz);}
    else for(let i=0;i<26;i++){const r=sz*(.12+Math.random()*.2),px=sz*(.25+Math.random()*.5),py=sz*(.35+Math.random()*.3),g=x.createRadialGradient(px,py,0,px,py,r);
      g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,sz,sz);}
    return new THREE.CanvasTexture(c);}
  const GLOW=blob(64,.25),PUFF=blob(128,0,true);
  for(const o of starL.slice(2))o.material.map=GLOW;   // the brightest stars get a soft glow
  const moonSp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:N.moonC,fog:false,depthWrite:false,transparent:true,blending:THREE.AdditiveBlending,toneMapped:false}));
  moonSp.scale.setScalar(2200);moonSp.material.opacity=.35;moonSp.renderOrder=-8;scene.add(moonSp);

  /* ---------- light: the moon behind the Spear (it stands in silhouette, rimmed), and a cold fill ---------- */
  const moonL=new THREE.DirectionalLight(0xa6c0ff,1.6),hemi=new THREE.HemisphereLight(0x4a6cb4,0x0c1226,.6);scene.add(moonL,moonL.target,hemi);
  moonL.target.position.copy(SP);moonL.position.copy(SP).addScaledVector(N.moon,6000);
  moonL.castShadow=!low;{const s=moonL.shadow;s.mapSize.set(phone?1024:2048,phone?1024:2048);const c=s.camera;c.left=c.bottom=-2700;c.right=c.top=2700;c.near=100;c.far=12000;s.bias=-.0004;s.normalBias=2;}
  if(!phone&&!low)moonL.shadow.mapSize.set(4096,4096);
  scene.fog=new THREE.FogExp2(N.hor,N.fog);R.setClearColor(N.hor);

  /* ---------- the shore ---------- */
  (()=>{const n=phone?170:230,g=new THREE.PlaneGeometry(2,2,n,n);g.rotateX(-Math.PI/2);
    const P=g.attributes.position,uv=g.attributes.uv,col=new Float32Array(P.count*3);
    for(let i=0;i<P.count;i++){const u=P.getX(i),w=P.getZ(i),x=Math.sign(u)*Math.pow(Math.abs(u),2.3)*26000,z=-600+Math.sign(w)*Math.pow(Math.abs(w),2.3)*26000,y=H(x,z);
      P.setXYZ(i,x,y,z);uv.setXY(i,x/55,z/55);
      // Nov 8: the land in layers: wet dark sand at the waterline, pale beach, then dune grass and darker soil up on the dunes
      const k=.78+.3*fbm(x/600+40,z/600-9,3),wet=1-smst(1,7,y),gr=smst(20,42,y)*smst(.35,.6,fbm(x/420+7,z/420+3,3));
      let r=k,gg=k,b=k;r*=1-.45*wet;gg*=1-.45*wet;b*=1-.35*wet;
      r=r*(1-gr)+gr*.32*k;gg=gg*(1-gr)+gr*.46*k;b=b*(1-gr)+gr*.42*k;
      col[i*3]=r;col[i*3+1]=gg;col[i*3+2]=b;}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
    const m=new THREE.MeshStandardMaterial({color:0x2c3550,map:tx('sand'),normalMap:tx('sand-n'),vertexColors:true,roughness:1,metalness:0});m.normalScale.set(1.1,1.1);
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
  /* Nov 9 (Bryce: "increase the quality from the menu screen, complete overhaul"): the sea now mirrors the scene. A second camera under
     the water renders the Spear, the city's lights, the ships and the sky into a texture (a third of the screen's size, half on a
     phone, none on Low), clipped at the waterline so nothing under the sea shows; the waves bend it, so the city's lights lie on the
     water in long broken streaks the way they would on a real night sea. */
  const REFL=!low;const rq=phone?.4:.5;
  const reflRT=REFL?new THREE.WebGLRenderTarget(4,4,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat}):null;
  const reflCam=new THREE.PerspectiveCamera(),texM=new THREE.Matrix4();
  const seaU=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{deep:{value:C(0x020610)},skyc:{value:C(N.hor)},moon:{value:N.moon.clone()},moonC:{value:C(0xc8d8ff)},t:{value:0},
    tRefl:{value:null},texM:{value:new THREE.Matrix4()},hasRefl:{value:REFL?1:0}}]);
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(60000,60000,1,1).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:seaU,fog:true,toneMapped:false,
    vertexShader:'uniform mat4 texM;varying vec3 vW;varying vec4 vR;\n#include <fog_pars_vertex>\nvoid main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vR=texM*vec4(position,1.);vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader:'uniform vec3 deep,skyc,moon,moonC;uniform float t,hasRefl;uniform sampler2D tRefl;varying vec3 vW;varying vec4 vR;\n#include <common>\n#include <fog_pars_fragment>\n'+
      'void main(){vec3 V=normalize(cameraPosition-vW);vec2 p=vW.xz;float dd=length(cameraPosition-vW);'+
      'float nx=sin(p.x*.021+t*.6)*.05+sin(p.y*.031-t*.4+p.x*.01)*.05+sin(p.x*.11+p.y*.07+t*1.3)*.03+sin(p.x*.41-p.y*.23+t*2.1)*.015+sin(p.x*1.3+p.y*.9+t*3.)*.012*exp(-dd*.0008);'+
      'float nz=cos(p.y*.023+t*.5)*.05+sin(p.x*.017+p.y*.013-t*.7)*.05+cos(p.y*.13-p.x*.05+t*1.1)*.03+cos(p.y*.37+p.x*.29-t*1.9)*.015+cos(p.y*1.1-p.x*1.4+t*2.7)*.012*exp(-dd*.0008);'+
      'vec3 Nn=normalize(vec3(nx,1.,nz));float fr=pow(1.-max(dot(Nn,V),0.),4.);vec3 Rr=reflect(-V,Nn);float s=max(dot(Rr,moon),0.);'+
      'vec3 c=mix(deep,skyc,.12+.7*fr);'+
      'if(hasRefl>.5){vec4 q=vR;q.xy+=vec2(nx,nz)*q.w*vec2(.05,.16);vec3 rf=texture2DProj(tRefl,q).rgb;c=mix(c,rf*.92+deep*.2,.22+.62*fr)+rf*smoothstep(.35,1.,max(rf.r,max(rf.g,rf.b)))*.35;}'+
      'c+=moonC*(pow(s,220.)*2.2+pow(s,30.)*.1);gl_FragColor=vec4(c,1.);\n#include <fog_fragment>\n}'}));
  // the mirror camera (the same sums as three.js's Reflector): the view reflected in the water's plane, its near plane tilted onto the
  // water (an oblique clip) so the sea floor never shows in the reflection
  const _rp=V(0,0,-1400),_n=V(0,1,0),_cw=V(),_rm=new THREE.Matrix4(),_la=V(),_tg=V(),_vw=V(),_pl=new THREE.Plane(),_cp=new THREE.Vector4(),_q4=new THREE.Vector4();
  let rfc=0;
  function renderRefl(){if(!REFL)return;if(phone&&(rfc++&1))return;   // a phone redraws the reflection every other frame
   const w=Math.max(4,Math.round(cv.width*rq)),h=Math.max(4,Math.round(cv.height*rq));if(reflRT.width!==w||reflRT.height!==h)reflRT.setSize(w,h);
    _cw.setFromMatrixPosition(cam.matrixWorld);_vw.subVectors(_rp,_cw);if(_vw.dot(_n)>0)return;
    _vw.reflect(_n).negate().add(_rp);_rm.extractRotation(cam.matrixWorld);_la.set(0,0,-1).applyMatrix4(_rm).add(_cw);
    _tg.subVectors(_rp,_la).reflect(_n).negate().add(_rp);
    reflCam.position.copy(_vw);reflCam.up.set(0,1,0).applyMatrix4(_rm).reflect(_n);reflCam.lookAt(_tg);reflCam.far=cam.far;
    reflCam.updateMatrixWorld();reflCam.projectionMatrix.copy(cam.projectionMatrix);
    texM.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(reflCam.projectionMatrix).multiply(reflCam.matrixWorldInverse).multiply(sea.matrixWorld);
    seaU.texM.value.copy(texM);
    _pl.setFromNormalAndCoplanarPoint(_n,_rp.clone().setY(1.5));_pl.applyMatrix4(reflCam.matrixWorldInverse);
    _cp.set(_pl.normal.x,_pl.normal.y,_pl.normal.z,_pl.constant);const pm=reflCam.projectionMatrix;
    _q4.x=(Math.sign(_cp.x)+pm.elements[8])/pm.elements[0];_q4.y=(Math.sign(_cp.y)+pm.elements[9])/pm.elements[5];_q4.z=-1;_q4.w=(1+pm.elements[10])/pm.elements[14];
    _cp.multiplyScalar(2/_cp.dot(_q4));pm.elements[2]=_cp.x;pm.elements[6]=_cp.y;pm.elements[10]=_cp.z+1;pm.elements[14]=_cp.w;
    sea.visible=false;const su=R.shadowMap.autoUpdate;R.shadowMap.autoUpdate=false;const rt=R.getRenderTarget();
    sky.position.copy(reflCam.position);
    R.setRenderTarget(reflRT);R.clear();R.render(scene,reflCam);R.setRenderTarget(rt);
    sky.position.copy(cam.position);R.shadowMap.autoUpdate=su;sea.visible=true;seaU.tRefl.value=reflRT.texture;}
  sea.position.set(0,0,-1400);scene.add(sea);

  /* ---------- the Spear of Destiny, and Tide City round its foot ---------- */
  const spear=SPEAR_KIT.build();spear.group.position.copy(SP);scene.add(spear.group);
  // Nov 8: the night sky baked into reflections (PMREM), for the Spear's gold and the city's glass, so the metal catches the moon
  // and sky instead of going flat; and still a little of the gold's own warmth, so it reads at night
  // (the bake renders into an RGBE target, so it uses a copy of the sky's shader that encodes its output; the sky itself is unchanged)
  let ENV=null;try{const pm=new THREE.PMREMGenerator(R),es=new THREE.Scene(),sm=sky.material.clone();
    sm.fragmentShader=sm.fragmentShader.replace(/gl_FragColor=vec4\(c,1\.\);\}$/,'gl_FragColor=vec4(c,1.);\n#include <encodings_fragment>\n}');
    es.add(new THREE.Mesh(new THREE.SphereGeometry(100,48,24),sm));ENV=pm.fromScene(es,0,.1,1000).texture;pm.dispose();sm.dispose();}catch(e){ENV=null;}
  if(ENV&&spear.setEnv)spear.setEnv(ENV,2.2);
  for(const m of[spear.mats.gold,spear.mats.blade])if(m){m.emissive.set(0x3a2608);}
  if(!ENV){spear.mats.gold.metalness=.35;spear.mats.gold.roughness=.4;spear.mats.gold.emissive.set(0x5a3c10);spear.mats.shaft.metalness=.25;}
  const tip=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffd890,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false}));
  tip.position.copy(SP).setY(spear.top-40);tip.scale.setScalar(160);scene.add(tip);
  /* ---------- Tide City round the Spear's foot: the same city as the level (Nov 9: built by js/shared/tide-kit.js, shared with the
     prologue and the command deck). Differences, for the menu's shots: no district on the beach or the wreck, a clear avenue in the
     core from the shore to the Spear's foot, the core's towers kept low toward the shore so the plinth shows over them. */
  const _q=new THREE.Quaternion(),_e=new THREE.Euler();
  const M4=(x,y,z,sx,sy,sz,ry)=>new THREE.Matrix4().compose(V(x,y,z),_q.setFromEuler(_e.set(0,ry||0,0)),V(sx,sy,sz));
  const CITY=TIDE_KIT.build(scene,{SP,low,phone,env:ENV,night:true,glow:2.4,far:[450,2400],
    keepPlat:(P,wx,wz)=>!(wz+P.r>shoreZ(wx)-420||Math.hypot(wx-WRECK.x,wz-WRECK.z)<P.r+380||(P.z>0&&Math.abs(P.x-P.z*.15)<P.r+260)),
    keepTower:(lx,lz,P,fp)=>{if(P.tier)return true;if(lz>0&&Math.abs(lx-lz*.15)<150+fp/2)return false;return lz>0?90+lz*.45:true;},
    ringPylon:(x,z)=>z<=shoreZ(x)-300});
  const beaconTick=CITY.tick;
  // Nov 9: the city's own light in the air over it (warm haze low over the districts, Keeper blue nearer the Spear), so the night has
  // more than one colour, and mist lying on the water between the platforms
  for(let i=0;i<(phone?7:11);i++){const a=i/11*Math.PI*2+.4,d=i<3?300:900+Math.random()*900,x=SP.x+Math.cos(a)*d,z=SP.z+Math.sin(a)*d*.8;if(z>shoreZ(x)-300)continue;
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:i<3?0x4aa8ff:0xff9a50,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:i<3?.07:.09,fog:false}));
    s.position.set(x,i<3?260:140,z);s.scale.set(i<3?2400:2600,i<3?900:520,1);scene.add(s);}
  {const mist=new THREE.SpriteMaterial({map:PUFF,color:0x6a7ea8,transparent:true,depthWrite:false,opacity:.13});
    for(let i=0;i<(phone?10:18);i++){const a=Math.random()*Math.PI*2,d=500+Math.random()*1900,x=SP.x+Math.cos(a)*d,z=SP.z+Math.sin(a)*d;if(z>shoreZ(x)-200)continue;
      const s=new THREE.Sprite(mist);s.position.set(x,30+Math.random()*30,z);s.scale.set(900+Math.random()*900,90+Math.random()*60,1);scene.add(s);}}

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
  const wreck=ship('voidclass',1100,{tint:0x9a94a6,shadow:true});wreck.position.copy(WRECK);wreck.rotation.order='YXZ';wreck.rotation.set(.5,.95,.26);scene.add(wreck);
  const smoke=[];for(let i=0;i<(phone?18:30);i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,color:0x262a36,transparent:true,depthWrite:false,opacity:0}));s.userData.t=i/(phone?18:30);scene.add(s);smoke.push(s);}
  const SMOKE_AT=V(WRECK.x+60,140,WRECK.z-80);
  // Nov 9: the wreck still burns inside: violet light through its torn plating and a low fire along its back, so it reads at night
  {const wl=new THREE.PointLight(0xa45cff,2.6,520,1.6);wl.position.set(WRECK.x+80,120,WRECK.z+60);scene.add(wl);
    const fl=new THREE.PointLight(0xff7a30,2.4,600,1.5);fl.position.set(WRECK.x+200,40,WRECK.z+160);scene.add(fl);
    for(let i=0;i<4;i++){const p=V(WRECK.x-120+i*130,25+Math.random()*30,WRECK.z+40+i*70);
      const g=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:i%2?0xb070ff:0xff8a40,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.4,toneMapped:false}));
      g.position.copy(p);g.scale.set(160,70,1);scene.add(g);}}
  /* ---------- the land (Nov 8, Bryce: "up the graphics and objects on the land") ---------- */
  // rocks along the beach: shaped by noise on their position (the old per-corner random tore the faces apart into black shards),
  // with the rock texture's normal map, half sunk in the sand
  const rockM=new THREE.MeshStandardMaterial({color:0x6e7898,map:tx('rock'),normalMap:tx('rock-n'),roughness:.95});rockM.normalScale.set(1.4,1.4);
  function rockGeo(r,seed,flat){const g=new THREE.IcosahedronGeometry(r,2),P=g.attributes.position,v=V();
    for(let k=0;k<P.count;k++){v.fromBufferAttribute(P,k);const n=v.clone().normalize(),d=.72+.55*fbm(n.x*1.7+seed,n.y*1.7+n.z*1.3-seed,3);
      v.multiplyScalar(d);v.y*=flat;P.setXYZ(k,v.x,v.y,v.z);}
    g.computeVertexNormals();const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,P.getX(k)/r*1.5,(P.getY(k)+P.getZ(k))/r*1.5);return g;}
  {const near=(x,z)=>Math.min(Math.hypot(x+460,z-500),Math.hypot(x-600,z+700));
    for(let i=0;i<(phone?60:95);i++){const close=i<30;let x,z;
      if(close){x=-900+Math.random()*2600;z=-900+Math.random()*1500;}else{x=(Math.random()-.5)*6000;z=shoreZ(x)+(Math.random()-.3)*520;}
      if(FLAT.some(f=>Math.hypot(x-f.x,z-f.z)<f.r*1.6))continue;
      const r=close?2+Math.pow(Math.random(),2)*14:6+Math.pow(Math.random(),2)*48,m=new THREE.Mesh(rockGeo(r,i*3.1,.5+Math.random()*.4),rockM);
      m.position.set(x,H(x,z)-r*.12,z);m.rotation.set(Math.random()*.4,Math.random()*6,Math.random()*.3);m.castShadow=m.receiveShadow=near(x,z)<2500;scene.add(m);}}

  // dune grass: tufts of thin blades over the dunes, thickest round where the cameras stand, swaying in the sea wind
  const windU={value:0};
  {const blades=[],B=7;for(let b=0;b<B;b++){const a=b/B*Math.PI*2+Math.random(),lean=.25+Math.random()*.35,h=.7+Math.random()*.5,w=.08;
      const cx=Math.cos(a),cz=Math.sin(a),tx=cx*lean,tz=cz*lean,px=-cz*w,pz=cx*w;
      blades.push(px,0,pz,-px,0,-pz,tx,h,tz);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(blades,3));g.computeVertexNormals();
    const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);   // lit from above like the ground, not edge-on
    const m=new THREE.MeshStandardMaterial({color:0x7f9c90,roughness:.9,side:THREE.DoubleSide});
    m.onBeforeCompile=sh=>{sh.uniforms.uWind=windU;sh.vertexShader='uniform float uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec2 ip=instanceMatrix[3].xz;\n#else\nvec2 ip=vec2(0.);\n#endif\n'+
      'float sw=sin(uWind*1.6+ip.x*.05+ip.y*.03)*.5+sin(uWind*3.1+ip.x*.13)*.18;transformed.x+=sw*position.y*position.y*.35;transformed.z+=sw*position.y*position.y*.12;');};
    m.customProgramCacheKey=()=>'dunegrass';
    const N=low?3000:phone?7000:16000,list=[],cols=[],c1=C(0x6f8c78),c2=C(0x9a9a7a),c3=C(0x4c6a66);
    for(let t=0;t<N*4&&list.length<N;t++){
      // half of them near the beach cameras, the rest over the dunes
      let x,z;if(t%2){const cx=[-460,1350,-400,900][t%4],cz=[500,-60,-150,-300][t%4],r=Math.pow(Math.random(),.7)*700,a=Math.random()*6.283;x=cx+Math.cos(a)*r;z=cz+Math.sin(a)*r;}
      else{x=(Math.random()-.5)*7000;z=-1100+Math.random()*2400;}
      const y=H(x,z);if(y<9||z<shoreZ(x)+150)continue;
      if(fbm(x/140+3,z/140-8,2)<.38)continue;                                          // in clumps, with bare sand between
      if(FLAT.some(f=>Math.hypot(x-f.x,z-f.z)<f.r*1.25))continue;
      const dc=Math.min(Math.hypot(x+460,z-500),Math.hypot(x-1350,z+60)),s=(1.6+Math.random()*2.4)*(dc<250?1.5:1);list.push(M4(x,y-.2,z,s,s*(.8+Math.random()*.6),s,Math.random()*6.283));
      const q=Math.random();cols.push(c1.clone().lerp(q<.5?c2:c3,Math.random()));}
    const o=new THREE.InstancedMesh(g,m,list.length);list.forEach((mm,i)=>{o.setMatrixAt(i,mm);o.setColorAt(i,cols[i]);});o.receiveShadow=true;scene.add(o);}

  // things standing on the land load as models, each placed when its file arrives
  const placeModel=(name,size,axis,at,ry,o)=>{if(typeof MODELS==='undefined'||!MODELS.copy)return;o=o||{};
    MODELS.copy(name).then(({scene:s})=>{if(MODELS.tame)MODELS.tame(s,.5);
      if(o.lift)s.traverse(q=>{if(q.isMesh&&q.material&&q.material.map){q.material=q.material.clone();q.material.emissive=C(0xffffff);q.material.emissiveMap=q.material.map;q.material.emissiveIntensity=o.lift;}});
      const {o:g}=MODELS.fit(s,{size,axis:axis||'z',floor:true});g.position.copy(at);g.rotation.y=ry||0;
      g.traverse(q=>{if(q.isMesh){q.castShadow=true;q.receiveShadow=true;}});scene.add(g);}).catch(()=>{});};
  const lightSprite=(p,col,sc,op)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false,opacity:op||1}));s.position.copy(p);s.scale.setScalar(sc);scene.add(s);return s;};
  const concrete=new THREE.MeshStandardMaterial({color:0x6a7180,roughness:.85,metalness:.1,map:tx('metal015'),normalMap:tx('metal015-n')});
  const dark=new THREE.MeshStandardMaterial({color:0x2a3038,roughness:.6,metalness:.4});
  const keeperBlue=new THREE.MeshStandardMaterial({color:0x0c1a22,emissive:0x5ad2ff,emissiveIntensity:1.4});
  const amber=new THREE.MeshStandardMaterial({color:0x2a1a08,emissive:0xffb040,emissiveIntensity:1.2});
  const BLINK=[];   // lights that pulse (frame)

  // the Keeper landing pad on the dunes: an eight-sided deck, its lit edge and markings, two flood masts, and a dropship set down on it
  {const f=FLAT[0],y=f.y,P=V(f.x,y,f.z);
    const deck=new THREE.Mesh(new THREE.CylinderGeometry(f.r*.82,f.r*.9,8,8),concrete);deck.position.set(f.x,y-2,f.z);deck.rotation.y=Math.PI/8;deck.receiveShadow=deck.castShadow=true;scene.add(deck);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(f.r*.8,.7,4,8),keeperBlue);ring.rotation.set(Math.PI/2,0,Math.PI/8);ring.position.set(f.x,y+2.3,f.z);scene.add(ring);
    const ring2=new THREE.Mesh(new THREE.TorusGeometry(f.r*.42,.5,4,48),amber);ring2.rotation.x=Math.PI/2;ring2.position.set(f.x,y+2.3,f.z);scene.add(ring2);
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2+Math.PI/8;lightSprite(V(f.x+Math.cos(a)*f.r*.86,y+3,f.z+Math.sin(a)*f.r*.86),0x8fe6ff,14);}
    for(const s of[-1,1]){const mx=f.x+s*f.r*.9,mz=f.z-f.r*.5;
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(.8,1.3,34,6),dark);mast.position.set(mx,y+17,mz);mast.castShadow=true;scene.add(mast);
      const head=new THREE.Mesh(new THREE.BoxGeometry(6,2.4,2),amber);head.position.set(mx,y+34,mz);head.lookAt(f.x,y,f.z);scene.add(head);
      lightSprite(V(mx,y+34,mz),0xffc070,46,.8);}
    const fl=new THREE.PointLight(0xffc27a,2.2,420,1.6);fl.position.set(f.x,y+60,f.z+20);scene.add(fl);
    placeModel('dropship',76,'z',V(f.x+8,y+2,f.z+6),-.55,{lift:.12});
    // crates and a buggy by the pad
    for(let k=0;k<5;k++)placeModel('ammo-crate',2.4+Math.random(),'x',V(f.x-f.r*.6+k*3.4,y+2,f.z+f.r*.55+(k%2)*2.6),Math.random()*.6);
    placeModel('hog-chain',5.4,'z',V(f.x-f.r*1.25,H(f.x-f.r*1.25,f.z+40),f.z+40),.9,{lift:.1});}

  // two sea-gun batteries on the shore, facing out over the water
  [[FLAT[1],'sea-rail',-.25],[FLAT[2],'sea-missile',.35]].forEach(([f,name,ry])=>{
    const base=new THREE.Mesh(new THREE.CylinderGeometry(f.r*.62,f.r*.78,10,10),concrete);base.position.set(f.x,f.y-1,f.z);base.castShadow=base.receiveShadow=true;scene.add(base);
    const band=new THREE.Mesh(new THREE.CylinderGeometry(f.r*.63,f.r*.63,1.2,10,1,true),keeperBlue);band.position.set(f.x,f.y+3,f.z);scene.add(band);
    placeModel(name,f.r*.9,'x',V(f.x,f.y+4,f.z),ry,{lift:.16});
    BLINK.push(lightSprite(V(f.x,f.y+f.r*.9,f.z),0xff5a4a,22));});

  // the comm mast: a lattice tower with a dish, guy lines and a slow red light, a bunker at its foot
  {const f=FLAT[3],y=f.y,h=78,g=new THREE.Group();g.position.set(f.x,y,f.z);scene.add(g);
    for(const [sx,sz] of[[-1,-1],[1,-1],[1,1],[-1,1]]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,h,5),dark);leg.position.set(sx*2.2,h/2,sz*2.2);leg.rotation.set(-sz*.025,0,sx*.025);g.add(leg);}
    for(let k=0;k<12;k++){const yy=k*h/12+3,w=4.6-k*.25;for(const r of[0,Math.PI/2]){const b=new THREE.Mesh(new THREE.BoxGeometry(w,.25,.25),dark);b.position.set(0,yy,0);b.rotation.y=r;
      const b2=b.clone();b.position.z=w/2-.2;b2.position.z=-(w/2-.2);if(r){b.position.set(w/2-.2,yy,0);b2.position.set(-(w/2-.2),yy,0);}g.add(b,b2);}}
    const dish=new THREE.Mesh(new THREE.SphereGeometry(6,16,8,0,Math.PI*2,0,Math.PI*.32),new THREE.MeshStandardMaterial({color:0xc8ccd4,roughness:.5,side:THREE.DoubleSide}));
    dish.position.set(0,h*.72,-3);dish.rotation.x=-1.9;g.add(dish);
    const bunker=new THREE.Mesh(new THREE.BoxGeometry(14,5,9),concrete);bunker.position.set(9,2,6);bunker.castShadow=bunker.receiveShadow=true;g.add(bunker);
    const win=new THREE.Mesh(new THREE.BoxGeometry(8,.8,.2),keeperBlue);win.position.set(9,3.2,10.6);g.add(win);
    g.traverse(q=>{if(q.isMesh)q.castShadow=true;});
    BLINK.push(lightSprite(V(f.x,y+h+2,f.z),0xff4a3a,30));}

  // a line of Keeper lamps along the track from the mast down to the pad
  {const a=V(FLAT[3].x+20,0,FLAT[3].z-10),b=V(FLAT[0].x-110,0,FLAT[0].z+60);
    for(let k=0;k<=9;k++){const p=V().lerpVectors(a,b,k/9);p.x+=Math.sin(k*1.3)*14;const y=H(p.x,p.z);
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.25,.35,7,5),dark);post.position.set(p.x,y+3.5,p.z);scene.add(post);
      const cap=new THREE.Mesh(new THREE.BoxGeometry(1.2,.4,1.2),keeperBlue);cap.position.set(p.x,y+7.1,p.z);scene.add(cap);
      lightSprite(V(p.x,y+7.3,p.z),0x8fe6ff,13,.9);}}

  // the wreck's debris thrown up the beach: torn hull plates in the Hollow's dark metal, some with purple light still in them, and fires
  const FIRES=[];
  {const hullM=new THREE.MeshStandardMaterial({color:0x4a4656,map:tx('metal039'),normalMap:tx('metal039-n'),roughness:.6,metalness:.5,side:THREE.DoubleSide});
    const seam=new THREE.MeshStandardMaterial({color:0x12081a,emissive:0xa45cff,emissiveIntensity:1.2});
    for(let i=0;i<(phone?26:44);i++){const a=Math.random()*Math.PI*2,d=160+Math.pow(Math.random(),.6)*900,x=WRECK.x+Math.cos(a)*d*.9+250,z=WRECK.z+Math.abs(Math.sin(a))*d*.5+120;
      const y=H(x,z);if(y<-6)continue;const s=3+Math.pow(Math.random(),2)*24;
      const g=new THREE.BoxGeometry(s,s*.08,s*(.4+Math.random()*.7),3,1,2),P=g.attributes.position;
      for(let k=0;k<P.count;k++)P.setY(k,P.getY(k)+Math.sin(P.getX(k)/s*3+i)*s*.08+(Math.random()-.5)*s*.03);g.computeVertexNormals();
      const m=new THREE.Mesh(g,hullM);m.position.set(x,y+s*.08,z);m.rotation.set((Math.random()-.5)*1.1,Math.random()*6,(Math.random()-.5)*.9);m.castShadow=m.receiveShadow=true;scene.add(m);
      if(Math.random()<.4){const e=new THREE.Mesh(new THREE.BoxGeometry(s*.8,s*.02,.3),seam);e.position.set(0,s*.05,s*.15);m.add(e);}
      if(i%5===0&&FIRES.length<(phone?5:8)){FIRES.push({p:V(x,y+1,z),s:22+s*1.4,ph:Math.random()*9,
        a:lightSprite(V(x,y+2,z),0xff7a28,10),b:lightSprite(V(x,y+4,z),0xffc060,6),c:lightSprite(V(x,y+3,z),0xff6a20,90,.35)});}}
    const fireL=new THREE.PointLight(0xff8a3a,2.4,700,1.4);fireL.position.set(WRECK.x+260,60,WRECK.z+220);scene.add(fireL);FIRES.light=fireL;}
  function landTick(t){windU.value=t;
    for(const b of BLINK)b.material.opacity=Math.max(0,Math.sin(t*1.8+b.position.x))*.95;
    for(const f of FIRES){const k=.75+.25*Math.sin(t*9+f.ph)*Math.sin(t*5.3+f.ph*2);f.a.scale.set(f.s*1.3*k,f.s*1.8*k,1);f.a.position.y=f.p.y+f.s*.6;
      f.b.scale.set(f.s*.7,f.s*1.1*k,1);f.b.position.y=f.p.y+f.s*.4;}
    if(FIRES.light)FIRES.light.intensity=2.1+.6*Math.sin(t*11)*Math.sin(t*4.7);}

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
  const clouds=[];{const n=low?14:phone?18:26;for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,color:0x5a78b0,transparent:true,depthWrite:false,opacity:.28}));
      const sc=2400+Math.random()*3000;s.scale.set(sc*3.2,sc*.45,1);s.position.set((Math.random()-.5)*26000,1900+Math.random()*900,-9000-Math.random()*9000);s.material.rotation=(Math.random()-.5)*.3;
      s.userData.v=.7+Math.random()*.6;scene.add(s);clouds.push(s);}}
  const dust=(()=>{const n=phone?260:520,p=new Float32Array(n*3);for(let i=0;i<n*3;i++)p[i]=(Math.random()-.5)*600;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const o=new THREE.Points(g,new THREE.PointsMaterial({color:0xbcd2ff,map:GLOW,size:phone?3:2.4,sizeAttenuation:false,transparent:true,opacity:.45,depthWrite:false}));o.frustumCulled=false;scene.add(o);return o;})();

  /* ---------- the centrepiece (Nov 10, Bryce: the nav table "as the centrepiece the camera circles while the menu items pop up"):
     Bryce's star-map navigation table (models/nav-table.glb) on a Keeper overlook on the shore, its map lit, a faint column of light
     over it. The main menu opens circling it close, the Spear standing across the bay behind it, then cuts to the wide shots. ---------- */
  const NAV=(()=>{const f=FLAT[4],y=Math.max(H(f.x,f.z),3),c=V(f.x,y,f.z),G=new THREE.Group();G.position.copy(c);scene.add(G);
    const pad=new THREE.Mesh(new THREE.CylinderGeometry(4.6,5.2,.5,40),new THREE.MeshStandardMaterial({color:0x1a2232,roughness:.55,metalness:.4}));pad.position.y=-.2;pad.receiveShadow=true;G.add(pad);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(4.62,.05,6,80),new THREE.MeshBasicMaterial({color:C(0x7fe3ff).multiplyScalar(1.8),toneMapped:false}));rim.rotation.x=Math.PI/2;rim.position.y=.06;G.add(rim);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.2,6,24,1,true),new THREE.MeshBasicMaterial({color:0x7fe3ff,transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=3.9;G.add(beam);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:C(0x7fe3ff).multiplyScalar(1.4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.setScalar(6);halo.position.y=1.2;G.add(halo);
    const lamp=new THREE.PointLight(0x9fe4ff,2.2,14,1.6);lamp.position.set(0,2.4,0);G.add(lamp);
    if(typeof MODELS!=='undefined'&&MODELS.propObj)MODELS.propObj('nav-table',1).then(o=>{o.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true;}});o.rotation.y=Math.atan2(SP.x-c.x,SP.z-c.z);G.add(o);}).catch(()=>{});
    return{c,top:V(c.x,c.y+.95,c.z),tick(t){halo.material.opacity=.4+.12*Math.sin(t*1.7);beam.material.opacity=.03+.012*Math.sin(t*2.3);}};})();
  /* ---------- the camera: slow drifts, cut through a dip to black. Each part of the menu has its own set ---------- */
  const SHOTS={
    // from the beach: the Spear right of centre, the menu on the left, the moon beside it
    wide:{p:[V(-560,50,560),V(-360,62,440)],t:[V(-480,700,-2600),V(-400,740,-2600)],fov:42,center:1},
    // the water's edge, looking up the shaft
    low:{p:[V(1050,22,-800),V(820,28,-960)],t:[V(0,1080,-2600),V(0,1200,-2600)],fov:52},
    // close on the crown: the rings turning, the gold head
    crown:{p:[V(520,1150,-1700),V(360,1220,-1820)],t:[V(0,1060,-2600),V(0,1120,-2600)],fov:48},
    // the Keeper post on the dunes: the pad and its dropship, the city past them
    post:{p:[V(1330,46,90),V(1270,52,10)],t:[V(-640,230,-2250),V(-560,210,-2300)],fov:44},
    wreck:{p:[V(-400,70,-150),V(-640,95,-370)],t:[V(-1650,240,-1400),V(-1650,300,-1400)],fov:44},
    city:{p:[V(-1700,240,-1100),V(-1420,280,-1300)],t:[V(0,420,-2600),V(0,460,-2600)],fov:46},
    high:{p:[V(2600,1000,1100),V(2100,1100,800)],t:[V(0,620,-2600),V(0,640,-2600)],fov:48},
    // round the nav table, close (orbit: the camera circles it; the Spear stands behind it across the bay)
    table:{orbit:{r:6.6,y:2.4,a0:.35,w:.07},fov:50}};
  const SETS={main:['table','wide','post','low','wreck','crown','high'],campaign:['crown','low','wide'],level:['wreck','city'],takeover:['high','post','city']};
  let set='main',si=0,st=0,fading=false,want=null,hold=false;const SHOT_LEN=still?1e9:17;
  // a cut (Nov 4, Bryce: "when it's changing POV it goes black for a second"): no more dip to black. Right after a frame is drawn,
  // that frame is copied onto a canvas laid over the scene, the shot changes underneath, and the copy fades out: a dissolve
  const snap=document.getElementById('bgSnap'),sx=snap&&snap.getContext('2d');let snapNow=false;
  function cut(){if(fading)return;fading=true;snapNow=true;}
  function doCut(){if(want&&want!==set){set=want;si=0;}else si=(si+1)%SETS[set].length;want=null;st=0;}
  function snapAndCut(){if(sx){const q=phone?.6:1,w=snap.width=Math.round(cv.width*q),h=snap.height=Math.round(cv.height*q);sx.drawImage(cv,0,0,w,h);
      snap.style.transition='none';snap.style.opacity='1';void snap.offsetWidth;snap.style.transition='opacity 1.6s ease';
      requestAnimationFrame(()=>{snap.style.opacity='0';});}
    doCut();setTimeout(()=>{fading=false;},1700);}
  function focus(k){if(!SETS[k]||(k===set&&!want))return;want=k;hold=false;cut();}
  function jump(name,u){const k=Object.keys(SETS).find(q=>SETS[q].includes(name));if(!k)return;set=k;si=SETS[k].indexOf(name);st=(u||0)*SHOT_LEN;hold=true;}
  let clock=0;
  function shot(dt){if(!hold){st+=dt;if(st>SHOT_LEN)cut();}
    const S=SHOTS[SETS[set][si]],u=sm(Math.min(1,st/SHOT_LEN)),k=still?.5:.25+.75*u;
    const near=S.orbit?.25:2;if(cam.near!==near){cam.near=near;cam.updateProjectionMatrix();}
    if(S.orbit){const O=S.orbit,a=Math.atan2(NAV.c.x-SP.x,NAV.c.z-SP.z)+O.a0+(still?0:st*O.w);cam.position.set(NAV.c.x+Math.sin(a)*O.r,NAV.c.y+O.y+Math.sin(st*.3)*.25,NAV.c.z+Math.cos(a)*O.r);
      // the table sits right of centre (the menu panel is on the left): look past its left side
      const tg=V().copy(NAV.top),side=V(Math.cos(a),0,-Math.sin(a));tg.addScaledVector(side,-1.7);tg.y-=.35;cam.lookAt(tg);if(cam.fov!==S.fov){cam.fov=S.fov;cam.updateProjectionMatrix();}return;}
    cam.position.lerpVectors(S.p[0],S.p[1],k);cam.position.y=Math.max(cam.position.y,H(cam.position.x,cam.position.z)+20,14);
    const tg=V().lerpVectors(S.t[0],S.t[1],k);
    // a tall phone: the panel covers the lower part and the sides are close, so the opening view centres the Spear and lifts it
    if(S.center&&cam.aspect<1){tg.x=SP.x+(tg.x-SP.x)*.12;tg.y*=.55;}if(!still)tg.add(V(Math.sin(clock*.31)*6,Math.sin(clock*.23)*4,0));cam.lookAt(tg);
    if(cam.fov!==S.fov){cam.fov=S.fov;cam.updateProjectionMatrix();}}

  /* ---------- running it ---------- */
  // Nov 9: the finishing pass (js/shared/grade.js): bloom on the lights, a cold night grade, vignette and fine grain
  const FX=typeof GRADE!=='undefined'?GRADE.composer(R,scene,cam,{low,bloom:[phone?.7:.85,.6,.78],grade:{gam:1,contrast:1.1,sat:.9,vig:.5,grain:.03,
    shadow:[-.006,.002,.014],high:[.05,.03,-.006],lift:.006}}):null;
  function size(){const w=innerWidth,h=innerHeight;if(FX)FX.setSize(w,h);else R.setSize(w,h,false);cam.aspect=w/h;cam.zoom=w/h<.8?.62:w/h<1.2?.8:1;cam.updateProjectionMatrix();}
  addEventListener('resize',size);size();
  let last=performance.now(),run=true,held=false;
  document.addEventListener('visibilitychange',()=>{const was=run;run=!document.hidden&&!held;last=performance.now();if(run&&!was)requestAnimationFrame(frame);});
  // Nov 8: stop drawing while recovered footage plays over the menu (it has its own 3D scene)
  function pause(on){held=!!on;const was=run;run=!document.hidden&&!held;last=performance.now();if(run&&!was)requestAnimationFrame(frame);}
  const tmp=V(),fw=V(),side=V();
  function frame(now){if(!run)return;const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;
    shot(dt);sky.position.copy(cam.position);stars.position.copy(cam.position);moonSp.position.copy(cam.position).addScaledVector(N.moon,24000);seaU.t.value=clock;
    spear.tick(clock,1);beaconTick(clock);NAV.tick(clock);landTick(clock);tip.scale.setScalar(150+Math.sin(clock*1.3)*14);
    for(const T of TRAF){
      if(T.fl){const F=T.fl,per=F.T+18,u=((clock+F.o)%per)/F.T,dir=tmp.subVectors(F.b,F.a).normalize();side.set(-dir.z,0,dir.x).normalize();
        T.grp.forEach((g,k)=>{g.visible=u<=1;if(!g.visible)return;const off=k===0?V():V().addScaledVector(side,(k===1?-1:1)*34).addScaledVector(dir,-30);
          const p=V().lerpVectors(F.a,F.b,u).add(off);p.y-=Math.sin(u*Math.PI)*140;g.position.copy(p);g.lookAt(fw.copy(p).sub(dir));g.rotateZ(Math.sin(u*Math.PI*2)*.35);});
        continue;}
      const [p,d]=T.f(clock);T.g.position.copy(p);T.g.lookAt(fw.copy(p).sub(d));}
    // the dropship: round the Spear, nose first (a model looks down -z, so it faces away from where lookAt points it)
    {const a=clock*.05;drop.position.set(SP.x+Math.cos(a)*620,240+Math.sin(clock*.6)*6,SP.z+Math.sin(a)*620);
      drop.lookAt(fw.set(SP.x+Math.cos(a-.1)*620,240,SP.z+Math.sin(a-.1)*620));}
    for(const c of clouds){c.position.x+=c.userData.v*60*dt;if(c.position.x>13000)c.position.x-=26000;}
    for(const s of smoke){const t=(s.userData.t+clock*.035)%1;s.position.set(SMOKE_AT.x+t*t*1400,SMOKE_AT.y+t*1300,SMOKE_AT.z+Math.sin(t*5+s.userData.t*9)*60);
      s.scale.setScalar(60+t*650);s.material.opacity=Math.pow(Math.sin(t*Math.PI),1.5)*.34;}
    {const P=dust.geometry.attributes.position;for(let i=0;i<P.count;i++){let x=P.getX(i)+dt*(26+(i%7)*3);if(x>300)x-=600;P.setX(i,x);P.setY(i,P.getY(i)+Math.sin(clock+i)*dt*2);}P.needsUpdate=true;dust.position.copy(cam.position);}
    cam.updateMatrixWorld();renderRefl();if(FX)FX.render();else R.render(scene,cam);if(snapNow){snapNow=false;snapAndCut();}requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
  return{setTime(){},focus,jump,pause,get time(){return 'night';}};
})();
