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
  const FLAT=[{x:1150,z:-260,r:105,y:30},{x:620,z:-760,r:60,y:22},{x:-2650,z:-880,r:60,y:22},{x:-180,z:-20,r:26,y:0}];
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
  const moonL=new THREE.DirectionalLight(0xa6c0ff,1.6),hemi=new THREE.HemisphereLight(0x4a6cb4,0x101830,.85);scene.add(moonL,moonL.target,hemi);
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
    const m=new THREE.MeshStandardMaterial({color:0x4a587e,map:tx('sand'),normalMap:tx('sand-n'),vertexColors:true,roughness:1,metalness:0});m.normalScale.set(1.1,1.1);
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
  /* ---------- Tide City round the Spear's foot, built the way the level builds it (js/tide/02-city.js) ----------
     Nov 8 (Bryce: "make the city look like the Tide City mission"): the same city in place of the seven plain discs. A core platform
     round the Spear and two rings of districts, each dense with towers of three stepped tiers in pale tints, glass in bands with
     windows lit warm and Keeper blue, spires, decks with blue light strips under them, sky-bridges, sea causeways, the transit
     rings on their pylons, and Bryce's great spire towers on the outer platforms. Same scale as the level (CS 1.65 round the
     same 1560 m Spear). Seeded, so the city is the same every visit. Differences, for the menu's shots: no district on the beach
     or the wreck, a clear avenue in the core from the shore to the Spear's foot, and the core's towers kept under its rings. */
  const rnd=(()=>{let s=2237;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};})();
  const Rn=(a,b)=>a+rnd()*(b-a),pick=a=>a[(rnd()*a.length)|0];
  const _q=new THREE.Quaternion(),_e=new THREE.Euler();
  const M4=(x,y,z,sx,sy,sz,ry)=>new THREE.Matrix4().compose(V(x,y,z),_q.setFromEuler(_e.set(0,ry||0,0)),V(sx,sy,sz));
  function bandedMaterial(){const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.15});
    m.onBeforeCompile=sh=>{
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;')
        .replace('#include <project_vertex>','#include <project_vertex>\nvec4 wpp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nwpp=instanceMatrix*wpp;\n#endif\nvWP=(modelMatrix*wpp).xyz;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;')
        .replace('#include <color_fragment>',`#include <color_fragment>
          float fl=fract(vWP.y/4.4);
          float glass=smoothstep(.06,.1,fl)*(1.0-smoothstep(.66,.7,fl));
          float fade=smoothstep(900.0,4200.0,length(vWP-cameraPosition));
          float cell=fract((vWP.x+vWP.z)/3.6);
          glass*=1.0-step(cell,.08)*(1.0-fade);
          glass=mix(glass,.6,fade);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.16,.34,.48)+vec3(.02,.05,.08),glass*.9);
          // lit windows; far off the floors merge (one cell per three floors) so they read as lit bands instead of shimmering
          float big=step(.5,fade);vec3 wc=floor(vec3(vWP.x/(3.6+10.0*big),vWP.y/(4.4*(1.0+2.0*big)),vWP.z/(3.6+10.0*big)));
          float hsh=fract(sin(dot(wc,vec3(12.9898,78.233,37.719)))*43758.5453);
          winGlow=glass*step(.74,hsh)*mix(1.0,.7,fade)*mix(vec3(1.0,.78,.45),vec3(.45,.8,1.0),step(.86,hsh));`)
        .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=winGlow*.95;')
        .replace('void main() {','vec3 winGlow=vec3(0.0);\nvoid main() {')
        .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.22,glass);');};
    return m;}
  const towerMat=bandedMaterial(),metalMat=new THREE.MeshStandardMaterial({color:0xcfd6e2,roughness:.35,metalness:.35}),
    baseMat=new THREE.MeshStandardMaterial({color:0x4c5662,roughness:.85,metalness:.1}),
    accentMat=new THREE.MeshStandardMaterial({color:0xdff7ff,emissive:0x39c6ff,emissiveIntensity:1.1,roughness:.3});
  const CS=1.65,TRY=low?.8:phone?1.1:1.5,CORE_CLEAR=240;
  // the platforms, relative to the Spear (as in the level): the core, six districts round it, six further out
  const PL=[{x:0,z:0,r:340*CS,tier:0}];
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3;PL.push({x:Math.cos(a)*650*CS,z:Math.sin(a)*650*CS,r:Rn(170,240)*CS,tier:1});}
  for(let k=1;k<7;k++){const a=Math.PI*1.5+k/7*Math.PI*2,d=Rn(1050,1250)*CS;PL.push({x:Math.cos(a)*d,z:Math.sin(a)*d,r:Rn(130,200)*CS,tier:2});}
  // none on the beach or the shallows, none on the wreck, none between the beach and the Spear's foot
  const PLATS=PL.filter(P=>{if(!P.tier)return true;const wx=SP.x+P.x,wz=SP.z+P.z;
    if(wz+P.r>shoreZ(wx)-420)return false;if(Math.hypot(wx-WRECK.x,wz-WRECK.z)<P.r+380)return false;
    if(P.z>0&&Math.abs(P.x-P.z*.15)<P.r+260)return false;return true;});
  {let k=0;for(const P of PLATS)if(P.tier===2&&(k++%2===0))P.spire=true;}
  const tw={box:[],cyl:[],hex:[]},spires=[],decks=[],bridges=[],plats=[],towers=[],tints=[0xffffff,0xeef3f7,0xe2ebf2,0xd7e6ee,0xf3efe6,0xcfe0e8,0xe9dcc9,0xd8e4dc,0xc3d3e3,0xe6d2bd].map(C);
  for(const P of PLATS){P.rot=rnd();plats.push(M4(SP.x+P.x,0,SP.z+P.z,P.r,6,P.r,P.rot));
    if(P.spire)continue;   // one of Bryce's spire towers instead (below)
    const hMax=(P.tier===0?560:P.tier===1?460:260)*1.3,hMin=(P.tier===0?120:P.tier===1?70:45)*1.3,placed=[];
    for(let t=0;t<Math.round((P.tier===0?560:300)*TRY);t++){
      const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*(P.r*.84-30),lx=P.x+Math.cos(a)*d,lz=P.z+Math.sin(a)*d,fp=Rn(16,P.tier===0?60:46);
      if(placed.some(o=>Math.hypot(o.x-lx,o.z-lz)<o.fp/2+fp/2+10))continue;
      const centr=1-d/P.r;let h=hMin+Math.pow(rnd(),1.7)*(hMax-hMin)*(.45+.55*centr);
      const T={x:SP.x+lx,z:SP.z+lz,fp,h,kind:pick(['box','box','cyl','hex']),tint:pick(tints),rot:rnd()*Math.PI};placed.push({x:lx,z:lz,fp});
      if(P.tier===0){if(Math.hypot(lx,lz)<CORE_CLEAR+fp/2)continue;
        if(lz>0&&Math.abs(lx-lz*.15)<150+fp/2)continue;          // the avenue up from the shore
        if(lz>0)T.h=Math.min(T.h,90+lz*.45);}                     // lower toward the shore, so the plinth shows over them
      towers.push(T);}}
  for(const T of towers){const h1=T.h*Rn(.55,.8),h2=T.h*Rn(.82,.95),{x,z,fp,kind,rot}=T;
    tw[kind].push({m:M4(x,3,z,fp,h1,fp,rot),c:T.tint},{m:M4(x,3+h1,z,fp*.76,h2-h1,fp*.76,rot),c:T.tint},{m:M4(x,3+h2,z,fp*.5,T.h-h2,fp*.5,rot),c:T.tint});
    if(rnd()<.5){T.top=3+T.h+T.h*Rn(.1,.28);spires.push(M4(x,3+T.h,z,fp*.1,T.top-3-T.h,fp*.1,rot));}else T.top=3+T.h;
    const nd=rnd()<.45?(rnd()<.4?2:1):0;for(let i=0;i<nd;i++){const s=Rn(.75,1.05);decks.push(M4(x,3+T.h*Rn(.25,.85),z,fp*s,Rn(2,4),fp*s,0));}}
  for(const A of towers){if(rnd()>.32)continue;let best=null,bd=1e9;
    for(const B of towers){if(B===A)continue;const d=Math.hypot(A.x-B.x,A.z-B.z);if(d<bd&&d<110){bd=d;best=B;}}if(!best)continue;
    const nb=rnd()<.35?2:1;for(let k=0;k<nb;k++)bridges.push(M4((A.x+best.x)/2,Math.min(A.h,best.h)*Rn(.2,.75),(A.z+best.z)/2,Rn(4,7),Rn(3,5),bd,Math.atan2(best.x-A.x,best.z-A.z)));}
  // sea causeways: inner districts to the core, outer ones to their nearest inner one
  const inner=PLATS.filter(p=>p.tier===1);
  for(const P of PLATS){if(!P.tier)continue;const Q=P.tier===1?PLATS[0]:inner.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0];if(!Q)continue;
    bridges.push(M4(SP.x+(P.x+Q.x)/2,Rn(18,40),SP.z+(P.z+Q.z)/2,Rn(16,26),5,Math.hypot(P.x-Q.x,P.z-Q.z),Math.atan2(P.x-Q.x,P.z-Q.z)));}
  function inst(geo,mat,list,shadow){const m=new THREE.InstancedMesh(geo,mat,Math.max(1,list.length));m.count=list.length;
    list.forEach((it,i)=>{if(it.m){m.setMatrixAt(i,it.m);m.setColorAt(i,it.c);}else m.setMatrixAt(i,it);});if(shadow)m.castShadow=m.receiveShadow=true;scene.add(m);return m;}
  const unitBox=new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
  inst(unitBox,towerMat,tw.box,!low);inst(new THREE.CylinderGeometry(.5,.5,1,10).translate(0,.5,0),towerMat,tw.cyl,!low);inst(new THREE.CylinderGeometry(.5,.5,1,6).translate(0,.5,0),towerMat,tw.hex,!low);
  inst(new THREE.ConeGeometry(.5,1,6).translate(0,.5,0),metalMat,spires);
  inst(new THREE.CylinderGeometry(.5,.5,1,28),metalMat,decks);
  inst(new THREE.CylinderGeometry(.5,.5,1,28),accentMat,decks.map(m=>m.clone().multiply(new THREE.Matrix4().makeTranslation(0,-.6,0)).multiply(new THREE.Matrix4().makeScale(1.03,.25,1.03))));
  inst(new THREE.BoxGeometry(1,1,1),metalMat,bridges);
  inst(new THREE.CylinderGeometry(1,1.04,1,64),baseMat,plats).receiveShadow=true;
  // a gold rim of light round each platform (the menu's own touch, kept)
  for(const P of PLATS){const e=new THREE.Mesh(new THREE.TorusGeometry(P.r*1.02,1.4,4,96),rimM);e.rotation.x=Math.PI/2;e.position.set(SP.x+P.x,3.2,SP.z+P.z);scene.add(e);}
  // the transit rings, as in the level; the widest one would cross the beach, so it isn't built, and no pylon stands on land
  for(const Rg of[{r:520*CS,y:170},{r:900*CS,y:310},{r:380*CS,y:520}]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(Rg.r,5,8,180),metalMat);ring.rotation.x=Math.PI/2;ring.position.set(SP.x,Rg.y,SP.z);scene.add(ring);
    const glowR=new THREE.Mesh(new THREE.TorusGeometry(Rg.r,1.6,6,180),accentMat);glowR.rotation.x=Math.PI/2;glowR.position.set(SP.x,Rg.y-5,SP.z);scene.add(glowR);
    const py=[];for(let i=0;i<14;i++){const a=i/14*Math.PI*2,x=SP.x+Math.cos(a)*Rg.r,z=SP.z+Math.sin(a)*Rg.r;if(z>shoreZ(x)-300)continue;py.push(M4(x,0,z,1,Rg.y,1,0));}
    inst(new THREE.CylinderGeometry(3,5,1,6).translate(0,.5,0),baseMat,py);}
  // Bryce's spire towers: pearl stone, Keeper-blue glass in bands, gold toward the crowns, windows lit at night (the level's material)
  function spireMaterial(src){const m=src.material.clone();m.map=null;m.color=C(0xe9e4d8);m.roughness=.5;m.metalness=.2;
    m.onBeforeCompile=sh=>{
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOP=position;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;\nvec3 sGlow=vec3(0.0);')
        .replace('#include <color_fragment>',`#include <color_fragment>
          float hy=vOP.y+.5;
          float band=smoothstep(.35,.45,fract(hy*38.0))*(1.0-smoothstep(.7,.8,fract(hy*38.0)));
          vec3 glassC=vec3(.12,.3,.5);vec3 gold=vec3(.85,.66,.3);
          diffuseColor.rgb=mix(diffuseColor.rgb,glassC,band*.75*(1.0-smoothstep(.75,.9,hy)));
          diffuseColor.rgb=mix(diffuseColor.rgb,gold,smoothstep(.72,.92,hy)*.6);
          float cell=fract(sin(dot(floor(vec3(vOP.x*90.0,hy*38.0,vOP.z*90.0)),vec3(12.9898,78.233,37.719)))*43758.5453);
          sGlow=band*step(.55,cell)*mix(vec3(1.0,.8,.5),vec3(.5,.85,1.0),step(.8,cell))*(1.0-smoothstep(.8,.95,hy))+vec3(.3,.8,1.0)*smoothstep(.97,1.0,hy)*2.0;`)
        .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=sGlow;');};
    return m;}
  if(typeof MODELS!=='undefined')MODELS.load('tower').then(src=>{const g=src.geometry;g.computeBoundingBox();const b=g.boundingBox,mat=spireMaterial(src);
    for(const P of PLATS){if(!P.spire)continue;const h=P.r*1.7,k=h/(b.max.y-b.min.y);
      const m=new THREE.Mesh(g,mat);m.scale.setScalar(k);m.position.set(SP.x+P.x,3-b.min.y*k,SP.z+P.z);m.rotation.y=P.rot*6.28;m.castShadow=m.receiveShadow=!low;scene.add(m);
      BEACONS.push(V(SP.x+P.x,3+h+8,SP.z+P.z));}}).catch(()=>{});
  // red warning lights on the tallest towers, blinking slowly out of step
  const BEACONS=[];for(const T of towers.slice().sort((a,b)=>b.top-a.top).slice(0,phone?24:40))BEACONS.push(V(T.x,T.top+3,T.z));
  const beacon=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({map:GLOW,color:0xff5a4a,size:phone?7:6,sizeAttenuation:false,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  beacon.frustumCulled=false;scene.add(beacon);
  function beaconTick(t){const n=BEACONS.length;if(!n)return;let g=beacon.geometry;
    if(!g.attributes.position||g.attributes.position.count!==n){g.dispose();g=beacon.geometry=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));}
    const P=g.attributes.position;for(let i=0;i<n;i++){const on=Math.sin(t*2.2+i*1.7)>.2;P.setXYZ(i,BEACONS[i].x,on?BEACONS[i].y:-1e5,BEACONS[i].z);}P.needsUpdate=true;}

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
    high:{p:[V(2600,1000,1100),V(2100,1100,800)],t:[V(0,620,-2600),V(0,640,-2600)],fov:48}};
  const SETS={main:['wide','post','low','wreck','crown','high'],campaign:['crown','low','wide'],level:['wreck','city'],takeover:['high','post','city']};
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
    spear.tick(clock,1);beaconTick(clock);landTick(clock);tip.scale.setScalar(150+Math.sin(clock*1.3)*14);
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
    R.render(scene,cam);if(snapNow){snapNow=false;snapAndCut();}requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
  return{setTime(){},focus,jump,get time(){return 'night';}};
})();
