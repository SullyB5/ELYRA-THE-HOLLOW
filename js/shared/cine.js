/* Elyra · the cutscene kit (Nov 9 2026, Bryce: bring every cutscene up to the menu's and The Mountain's opening, "nothing should
   be left behind looking bad"). The pieces the prologue (js/shared/prologue.js) was built from, shared, plus the interiors and effects
   more than one mission needs. Loaded by the pages whose cutscenes use it; needs three.js and js/shared/core.js (C, coarse).
   - CINE.tx(name, rep, ry)          a photo texture from img/tex (metal015, metal039, metal020, rock, sand, soil, pebbles; '-n' = normal map)
                                     each (name, repeat) is its own load: a texture must not be cloned before it has loaded (the clone stays blank)
   - CINE.pbr(name, rep, o)          a standard material on that texture and its normal map
   - CINE.shipM(name, len, o)        a ship model sized to len (nose toward -z), swapped in when its file arrives
   - CINE.shock / burst / sunFlare / sprite / rockGeo   as in the prologue
   - CINE.holoMat(col, k)            additive hologram with scanlines and a rim
   - CINE.sheath(len, rad)           the fire of an atmospheric entry, round a ship's nose and streaming back along her
   - CINE.puffTex()                  a soft lit cloud puff for billboards
   - CINE.screen(w, h, draw)         a canvas screen texture (draw(ctx, w, h, t) on tick)
   - CINE.keeperBay(o)               a Keeper dropship's troop bay (photo metal, ribs, jump seats, holotable, ramp); o.wreck tears the roof
   - CINE.keeperCockpit(o)           a Keeper cockpit: canopy frame and glass, a dash of screens, seats, overhead switches
   Phones get smaller canvases and fewer pieces; lights are kept to the counts the old sets had (so nothing recompiles mid-scene). */
const CINE=(()=>{
const PH=typeof coarse!=='undefined'?coarse:matchMedia('(pointer:coarse)').matches;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const lin=h=>new THREE.Color(h).convertSRGBToLinear();
const TX={};
function tx(n,rep,ry){const k=n+'|'+rep+'|'+ry;if(TX[k])return TX[k];const t=new THREE.TextureLoader().load('img/tex/'+n+'-'+(PH?'phone':'pc')+'.jpg');
  t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep,ry||rep);t.anisotropy=PH?4:8;if(!/-n$/.test(n))t.encoding=THREE.sRGBEncoding;return TX[k]=t;}
function pbr(n,rep,o){o=o||{};const m=new THREE.MeshStandardMaterial({color:lin(o.color==null?0xffffff:o.color),map:tx(n,rep,o.ry),roughness:o.rough==null?.55:o.rough,metalness:o.metal==null?.5:o.metal});
  if(o.normal!==false){m.normalMap=tx(n+'-n',rep,o.ry);const s=o.ns==null?.8:o.ns;m.normalScale.set(s,s);}
  if(o.vc)m.vertexColors=true;if(o.side)m.side=o.side;if(o.emissive){m.emissive=lin(o.emissive);m.emissiveIntensity=o.ei==null?1:o.ei;}return m;}
function canvas(w,h,fn,srgb){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb!==false)t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
function screen(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
  const S={tex:t,ctx:x,w,h,last:-1,tick(time,force){if(!force&&time-S.last<(PH?.12:.06))return;S.last=time;draw(x,w,h,time);t.needsUpdate=true;}};S.tick(0,true);return S;}
let gT=null;const glowT=()=>gT||(gT=canvas(64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.45)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);}));
const sprite=(col,s,k,op)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT(),color:lin(col).multiplyScalar(k||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op==null?1:op,fog:false}));m.scale.setScalar(s);return m;};
let pT=null;
function puffTex(){if(pT)return pT;const N=PH?96:160;return pT=canvas(N,N,(g,w,h)=>{const img=g.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=x/w-.5,v=y/h-.5,d=Math.sqrt(u*u+v*v)*2;const n=fb2(x/w*5+3,y/h*5,5);
    const a=Math.max(0,Math.min(1,(1-d*1.15)*1.6+(n-.5)*1.4))*Math.max(0,1-d);const lit=.62+.38*Math.max(0,Math.min(1,.5-v*1.4+(n-.5)*.6));const k=(y*w+x)*4;
    img.data[k]=255*lit;img.data[k+1]=250*lit;img.data[k+2]=246*lit;img.data[k+3]=255*a*a;}
  g.putImageData(img,0,0);});}
function n2(x,y){const h=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s);};const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fb2(x,y,o){let s=0,a=.5,f=1;for(let i=0;i<(o||5);i++){s+=a*n2(x*f,y*f);f*=2.03;a*=.5;}return s;}
let hzT=null;function hazard(){return hzT||(hzT=canvas(256,32,(g,w,h)=>{g.fillStyle='#141210';g.fillRect(0,0,w,h);g.fillStyle='#d9a521';for(let x=-32;x<w+32;x+=32){g.beginPath();g.moveTo(x,h);g.lineTo(x+16,0);g.lineTo(x+32,0);g.lineTo(x+16,h);g.fill();}
  g.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<60;i++)g.fillRect(Math.random()*w,Math.random()*h,Math.random()*12,1);}));}
const SHIPM={};
function shipM(name,len,o){o=o||{};const g=new THREE.Group();
  if(typeof MODELS!=='undefined')MODELS.load(name).then(src=>{const G=src.geometry;if(!G.boundingBox)G.computeBoundingBox();const b=G.boundingBox,k=len/(b.max.z-b.min.z),c=b.getCenter(V3());
    const key=name+'|'+(o.tint||'')+'|'+(o.lift||0)+'|'+(o.metal==null?'':o.metal);let m=SHIPM[key];
    if(!m){m=src.material.clone();m.side=THREE.DoubleSide;m.transparent=false;m.depthWrite=true;if(o.tint)m.color=new THREE.Color(o.tint);
      if(o.lift){m.emissive=new THREE.Color(1,1,1);m.emissiveMap=m.map;m.emissiveIntensity=o.lift;}
      if(o.metal!=null){m.metalness=o.metal;m.metalnessMap=null;}if(o.rough!=null){m.roughness=o.rough;m.roughnessMap=null;}m.needsUpdate=true;SHIPM[key]=m;}
    const mesh=new THREE.Mesh(G,o.fresh?m.clone():m);mesh.scale.setScalar(k);mesh.position.copy(c).multiplyScalar(-k);mesh.castShadow=mesh.receiveShadow=!!o.shadow;g.add(mesh);g.userData.mesh=mesh;
    if(o.cb)o.cb(mesh);}).catch(()=>{});
  return g;}
function shock(G,col){const m=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    uniforms:{c:{value:lin(col).multiplyScalar(2)},o:{value:0}},vertexShader:'varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 c;uniform float o;varying vec2 vU;void main(){float d=length(vU);float e=exp(-pow((d-.86)/.05,2.))+.25*exp(-pow((d-.7)/.18,2.));gl_FragColor=vec4(c*o*e*(1.-smoothstep(.97,1.,d)),1.);}'}));G.add(m);m.visible=false;return m;}
function burst(G,n,col,sz){const p=new Float32Array(n*3),v=[];for(let i=0;i<n;i++){const d=V3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(.3+Math.random());v.push(d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  const o=new THREE.Points(g,new THREE.PointsMaterial({map:glowT(),color:lin(col).multiplyScalar(2),size:sz||3,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));o.frustumCulled=false;o.visible=false;G.add(o);
  return{o,set(at,k,spd){o.visible=k>0&&k<1;const P=g.attributes.position;for(let i=0;i<n;i++)P.setXYZ(i,at.x+v[i].x*k*spd,at.y+v[i].y*k*spd,at.z+v[i].z*k*spd);P.needsUpdate=true;o.material.opacity=Math.max(0,1-k);}};}
function sunFlare(G,dir,dist,col){const at=dir.clone().normalize().multiplyScalar(dist);
  const a=sprite(col||0xfff0d8,dist*.035,2.4);a.position.copy(at);const b=sprite(col||0xffe0b0,dist*.12,.4);b.position.copy(at);b.material.opacity=.35;
  const c=sprite(0xbfd8ff,1,.25);c.scale.set(dist*.4,dist*.006,1);c.position.copy(at);for(const s of[a,b,c])G.add(s);return{a,b,c};}
function rockGeo(r,seed,flat){const g=new THREE.IcosahedronGeometry(r,PH?2:3),P=g.attributes.position,v=V3();
  for(let k=0;k<P.count;k++){v.fromBufferAttribute(P,k);const n=v.clone().normalize(),d=.7+.6*fb2(n.x*1.6+seed+n.z*.7,n.y*1.6-seed+n.z*1.1,4);v.multiplyScalar(d);v.y*=flat||1;P.setXYZ(k,v.x,v.y,v.z);}
  g.computeVertexNormals();const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,P.getX(k)/r*1.2+P.getZ(k)/r*.5,P.getY(k)/r*1.2);return g;}
// a hologram: additive, brighter at the rim, scanlines that crawl upward, flicker
function holoMat(col,k){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,
  uniforms:{c:{value:lin(col).multiplyScalar(k||1.6)},t:{value:0},op:{value:1}},
  vertexShader:'varying vec3 vW;varying vec3 vN;varying vec3 vV;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform vec3 c;uniform float t,op;varying vec3 vW;varying vec3 vN;varying vec3 vV;void main(){float rim=1.-abs(dot(normalize(vN),vV));float sl=.55+.45*step(.5,fract(vW.y*38.-t*1.6));float fl=.86+.14*sin(t*31.+vW.y*7.);gl_FragColor=vec4(c*(.28+rim*rim*1.3)*sl*fl*op,1.);}'});}
// the fire of an entry: a bow shock round the nose (white-hot), a sheath streaming back along the hull (orange to deep red), flowing
function sheath(len,rad){const pts=[];const N=PH?14:22;for(let i=0;i<=N;i++){const u=i/N,y=u*len;pts.push(new THREE.Vector2(rad*(.18+.95*Math.sqrt(u))*(1+.12*u),y));}
  const g=new THREE.LatheGeometry(pts,PH?20:32);g.rotateX(Math.PI/2);   // the nose at z 0, opening toward +z (back along a ship whose nose is -z)
  const U={t:{value:0},k:{value:1}};
  const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,
    vertexShader:'varying vec2 vU;varying vec3 vN;varying vec3 vV;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`uniform float t,k;varying vec2 vU;varying vec3 vN;varying vec3 vV;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){float y=vU.y;float a=vU.x*6.2831;vec2 q=vec2(vU.x*9.,y*5.-t*6.);float f=n(q)*.6+n(q*2.3+3.)*.3+n(q*5.1-7.)*.1;
        float rim=pow(1.-abs(dot(normalize(vN),vV)),1.4);
        vec3 c=mix(vec3(1.,.95,.8),vec3(1.,.55,.18),smoothstep(.0,.25,y));c=mix(c,vec3(.75,.16,.06),smoothstep(.25,.8,y));
        float al=(1.-smoothstep(.15,1.,y))*(.3+rim*.8)*(.4+f*.9)*k;al*=smoothstep(.0,.03,y)+.6;
        gl_FragColor=vec4(c*al*.9,1.);}`});
  const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;
  // embers peeling off the hull
  const EN=PH?60:140,ep=new Float32Array(EN*3),ev=[];for(let i=0;i<EN;i++){ev.push({a:Math.random()*6.28,r:rad*(.4+Math.random()*.7),z:Math.random()*len*1.4,s:.5+Math.random()});}
  const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.BufferAttribute(ep,3));
  const em=new THREE.Points(eg,new THREE.PointsMaterial({map:glowT(),color:lin(0xffa050).multiplyScalar(1.6),size:rad*.09,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));em.frustumCulled=false;
  const G=new THREE.Group();G.add(mesh,em);
  function tick(t,dt,kk){U.t.value=t;U.k.value=kk==null?1:kk;const P=eg.attributes.position;for(let i=0;i<EN;i++){const e=ev[i];e.z+=dt*len*1.6*e.s;if(e.z>len*1.5){e.z=Math.random()*len*.2;e.a=Math.random()*6.28;}
      const rr=e.r*(1+e.z/len*.5);P.setXYZ(i,Math.cos(e.a)*rr,Math.sin(e.a)*rr,e.z);}P.needsUpdate=true;em.material.opacity=Math.min(1,kk==null?1:kk);}
  return{group:G,mesh,tick,U};}

/* ---------- a Keeper dropship's troop bay ----------
   The old drop bay's frame, so the shots built on it still work: floor at y 0, 6.4 m wide (x ±3.2), 14.4 long (z -7.2 at the cockpit
   door, +7.2 at the rear ramp), 3.6 high. Lower walls straight, upper walls chamfered in to the ceiling, a rib every 1.2 m. Photo metal
   (Metal039 walls, Metal015 deck) with their normal maps, jump seats with harnesses down both walls, stowage and racks at the front,
   light strips and red beacons overhead, a holotable in the middle with the target drawn in light over it, and the ramp at the back.
   o.wreck: the roof torn open over the right side, plates bent down into the hole, cables hanging, sand blown in.
   Returns {G, ramp, holo (the text panel), drawHolo(t, glitch), holo3d, lamps[2], fill, ped, tick(t,dt)} like the old buildBay. */
function keeperBay(o){o=o||{};const G=new THREE.Group(),W=o.wreck;
  const wallM=pbr('metal039',2,{color:0x8c939e,rough:.62,metal:.55,ns:.9}),deckM=pbr('metal015',3,{color:0x9aa0aa,rough:.5,metal:.6}),
    darkM=pbr('metal039',1,{color:0x3a4048,rough:.55,metal:.6}),frameM=pbr('metal015',1,{color:0x5a626e,rough:.42,metal:.7}),
    seatM=new THREE.MeshStandardMaterial({color:lin(0x2a3442),roughness:.85,metalness:.1}),strapM=new THREE.MeshStandardMaterial({color:lin(0x5a3a1c),roughness:.85}),
    blueM=new THREE.MeshStandardMaterial({color:lin(0x1a3a66),roughness:.75,metalness:.25}),goldM=new THREE.MeshStandardMaterial({color:lin(0xd9b25a),emissive:lin(0x3a2808),metalness:.85,roughness:.3}),
    stripM=new THREE.MeshBasicMaterial({color:lin(0xdff0ff).multiplyScalar(W?.25:1.6),toneMapped:false}),redM=new THREE.MeshBasicMaterial({color:lin(0xff2a1a).multiplyScalar(2),toneMapped:false}),
    cyanM=new THREE.MeshBasicMaterial({color:lin(0x7fe3ff).multiplyScalar(1.6),toneMapped:false}),hzM=new THREE.MeshStandardMaterial({map:hazard(),roughness:.7});
  const add=(geo,m,x,y,z,rx,ry,rz,sh)=>{const b=new THREE.Mesh(geo,m);b.position.set(x,y,z);b.rotation.set(rx||0,ry||0,rz||0);if(sh!==false){b.castShadow=true;b.receiveShadow=true;}G.add(b);return b;};
  const box=(w,h,d,m,x,y,z,rx,ry,rz,sh)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,rx,ry,rz,sh);
  const L=14.4,HW=3.2,LW=2.4,CH=3.6,CW=2.4,ch=Math.hypot(HW-CW,CH-LW),ca=Math.atan2(CH-LW,HW-CW);
  // the deck: plates, a grating strip down the middle, tie-down rings, the hazard band at the ramp
  box(6.4,.2,L,deckM,0,-.1,0);box(1.3,.02,L-1.4,darkM,0,.011,-.4,0,0,0,false);
  for(let z=-6.4;z<6.4;z+=1.6)for(const x of[-1.6,1.6]){const r=add(new THREE.TorusGeometry(.08,.018,6,12),frameM,x,.02,z,Math.PI/2,0,0,false);}
  box(6.2,.012,.55,hzM,0,.006,6.85,0,0,0,false);
  // the walls: lower (straight), upper (chamfered), ceiling; the right side of the roof is gone on a wreck
  const ceilHole=W?[-2.2,2.2]:null;   // z range of the hole (on the +x side)
  for(const s of[-1,1]){
    const segs=W&&s>0?[[-7.2,ceilHole[0]],[ceilHole[1],7.2]]:[[-7.2,7.2]];
    box(.16,LW,L,wallM,s*HW,LW/2,0);
    for(const [z0,z1] of segs)box(.16,ch,z1-z0,wallM,s*(HW+CW)/2,(LW+CH)/2,(z0+z1)/2,0,0,s*(Math.PI/2-ca));
    // a band of the Keepers' blue along the wall at shoulder height with a gold line over it, and the light strip under the chamfer
    box(.04,.5,L-.6,blueM,s*(HW-.1),1.55,0,0,0,0,false);box(.04,.035,L-.6,goldM,s*(HW-.11),1.83,0,0,0,0,false);
    box(.05,.05,L-.8,W?redM:stripM,s*(HW-.14),LW-.02,0,0,0,0,false);
    // pipes and conduit along the chamfer
    for(const k of[.3,.62]){const p=add(new THREE.CylinderGeometry(.045,.045,L-.4,8),frameM,s*(HW-(HW-CW)*k-.08),LW+(CH-LW)*k-.08,0,Math.PI/2,0,0,false);}
  }
  if(W){box(CW,.16,L,wallM,-CW/2,CH,0);box(CW,.16,7.2+ceilHole[0],wallM,CW/2,CH,(-7.2+ceilHole[0])/2);box(CW,.16,7.2-ceilHole[1],wallM,CW/2,CH,(7.2+ceilHole[1])/2);
    // torn plates hanging into the hole, a few cables
    for(const [x,z,rx,rz] of[[1.6,-1.8,.9,.2],[2.2,1.6,-.7,-.3],[.9,.6,.3,.8]])box(1.4,.06,1.1,wallM,x,CH-.4,z,rx,0,rz);
    for(let i=0;i<5;i++){const h=.6+Math.random()*1.3,c=add(new THREE.CylinderGeometry(.02,.02,h,5),darkM,.6+Math.random()*1.8,CH-h/2,-1.8+Math.random()*3.6,(Math.random()-.5)*.4,0,(Math.random()-.5)*.4,false);}
  }else box(CW*2,.16,L,wallM,0,CH,0);
  // ceiling: light strips, panel seams
  for(const x of[-1.1,1.1]){if(W&&x>0)continue;box(.12,.03,L-1,W?redM:stripM,x,CH-.09,0,0,0,0,false);}
  // ribs every 1.2 m: posts up the lower wall, struts up the chamfer, a beam across (the ribs over the hole are broken off)
  for(let z=-6.6;z<=6.61;z+=1.2){for(const s of[-1,1]){box(.22,LW,.2,frameM,s*(HW-.12),LW/2,z);
      if(!(W&&s>0&&z>ceilHole[0]-.1&&z<ceilHole[1]+.1))box(.2,ch,.2,frameM,s*((HW+CW)/2-.1),(LW+CH)/2-.06,z,0,0,s*(Math.PI/2-ca));}
    if(!(W&&z>ceilHole[0]-.1&&z<ceilHole[1]+.1))box(CW*2,.2,.2,frameM,0,CH-.14,z);else box(CW,.2,.2,frameM,-CW/2,CH-.14,z);}
  // jump seats with harnesses down both walls (the crew stand clear of them)
  const seatAt=[];for(let z=-5.4;z<=5.5;z+=1.2)for(const s of[-1,1])seatAt.push([s,z]);
  // o.open: [[side, zFrom, zTo]] seats left without backs (a camera sits against the wall there)
  const openAt=(sd,z)=>(o.open||[]).some(([os,z0,z1])=>os===sd&&z>=z0&&z<=z1);
  for(const [s,z] of seatAt){box(.5,.07,.5,seatM,s*(HW-.42),.5,z);if(openAt(s,z)){box(.04,.04,.4,frameM,s*(HW-.42),.44,z-.22);continue;}box(.07,.86,.48,seatM,s*(HW-.2),.98,z);box(.07,.24,.3,seatM,s*(HW-.2),1.55,z);
    box(.04,.04,.4,frameM,s*(HW-.42),.44,z-.22);box(.04,.04,.4,frameM,s*(HW-.42),.44,z+.22);box(.4,.04,.04,frameM,s*(HW-.42),.25,z+.22,0,0,s*.6);
    for(const k of[-.12,.12])box(.02,.75,.035,strapM,s*(HW-.25),1.05,z+k,0,0,s*-.08,false);}
  // the front: a bulkhead with the doorway through to the cockpit, a gold Keeper seal over it, lockers both sides with status lights
  for(const s of[-1,1])box(2.4,CH,.2,wallM,s*2,CH/2,-7.2);box(1.6,1.2,.2,wallM,0,CH-.6,-7.2);
  box(1.5,.05,.05,stripM,0,2.42,-7.08,0,0,0,false);for(const s of[-1,1])box(.05,2.3,.05,cyanM,s*.78,1.2,-7.08,0,0,0,false);
  for(const r of[.32,.22]){const t=add(new THREE.TorusGeometry(r,.025,8,40),goldM,0,3.0,-7.08,0,0,0,false);}
  for(const s of[-1,1]){box(.85,2.1,.5,darkM,s*2.4,1.05,-6.85);for(let k=0;k<3;k++)box(.04,.04,.01,k?cyanM:redM,s*2.4+(k-1)*.12,1.95,-6.59,0,0,0,false);
    box(.75,.03,.02,frameM,s*2.4,1.05,-6.59,0,0,0,false);}
  // a door console beside the doorway
  const cons=screen(PH?128:192,PH?80:120,(x,w,h,t)=>{x.fillStyle='#03121c';x.fillRect(0,0,w,h);x.strokeStyle='rgba(127,227,255,.5)';x.strokeRect(2,2,w-4,h-4);x.fillStyle='#7fe3ff';x.font=(h*.12|0)+'px monospace';
    x.fillText(W?'HULL BREACH':'RAMP · ARMED',8,h*.22);for(let i=0;i<5;i++){const v=W?Math.random()*.3:.5+.45*Math.sin(t*1.3+i);x.fillStyle=W?'#ff5a4a':'#7fe3ff';x.fillRect(8,h*(.34+i*.12),(w-16)*v,h*.06);}});
  const cm=add(new THREE.PlaneGeometry(.5,.32),new THREE.MeshBasicMaterial({map:cons.tex,toneMapped:false}),-1.35,1.55,-7.08,0,0,0,false);
  // racks and crates at the front corners
  if(typeof MODELS!=='undefined'&&MODELS.copy&&!o.noProps){
    MODELS.copy('weapon-rack').then(({scene:s})=>{if(MODELS.tame)MODELS.tame(s,.5);const f=MODELS.fit(s,{size:1.9,axis:'y',floor:true});f.o.position.set(-2.85,0,-5.95);f.o.rotation.y=Math.PI/2;f.o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});G.add(f.o);}).catch(()=>{});
    MODELS.copy('ammo-crate').then(({scene:s})=>{if(MODELS.tame)MODELS.tame(s,.5);for(const [x,z,y,r] of[[2.55,-5.9,0,.1],[2.55,-5.15,0,-.08],[2.55,-5.5,.55,.3]]){const c=s.clone();const f=MODELS.fit(c,{size:.7,axis:'x',floor:true});f.o.position.set(x,y,z);f.o.rotation.y=Math.PI/2+r;G.add(f.o);}}).catch(()=>{});}
  // the holotable: a pedestal, a lit ring, the target drawn in light over it (the installation's blocks and spires, the objective
  // pinned in gold), and the text panel above it
  const ped=new THREE.Group();ped.position.set(0,0,-1.2);G.add(ped);
  {const a=new THREE.Mesh(new THREE.CylinderGeometry(.42,.6,.95,24),darkM);a.position.y=.475;a.castShadow=true;ped.add(a);
   const top=new THREE.Mesh(new THREE.CylinderGeometry(.72,.62,.12,32),frameM);top.position.y=1.0;ped.add(top);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(.66,.02,8,48),cyanM);ring.rotation.x=Math.PI/2;ring.position.y=1.065;ped.add(ring);
   const disc=new THREE.Mesh(new THREE.CircleGeometry(.6,40),new THREE.MeshBasicMaterial({color:lin(0x7fe3ff).multiplyScalar(.22),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));disc.rotation.x=-Math.PI/2;disc.position.y=1.062;ped.add(disc);}
  const holo3d=new THREE.Group();holo3d.position.set(0,1.18,-1.2);G.add(holo3d);const hm=holoMat(0x7fe3ff,1.2),gm=holoMat(0xffd27a,2.2);
  {const mg=new THREE.Group();holo3d.add(mg);const rnd=(a,b)=>a+Math.random()*(b-a);
   const ground=new THREE.Mesh(new THREE.CircleGeometry(.52,32),hm);ground.rotation.x=-Math.PI/2;mg.add(ground);
   for(let i=0;i<22;i++){const w=rnd(.04,.12),h=rnd(.03,.16),d=rnd(.04,.12),b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),hm);const a=Math.random()*6.28,r=Math.sqrt(Math.random())*.4;b.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);mg.add(b);}
   for(let i=0;i<5;i++){const h=rnd(.22,.4),c=new THREE.Mesh(new THREE.ConeGeometry(.014,h,5),hm);const a=i/5*6.28+.4,r=rnd(.18,.36);c.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);mg.add(c);}
   const pin=new THREE.Mesh(new THREE.OctahedronGeometry(.045,0),gm);pin.position.set(.12,.34,-.08);mg.add(pin);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.3,4),gm);beam.position.set(.12,.17,-.08);mg.add(beam);
   holo3d.userData={mg,pin};}
  const hc=document.createElement('canvas');hc.width=256;hc.height=160;const hx=hc.getContext('2d'),ht=new THREE.CanvasTexture(hc);
  const holo=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.8),new THREE.MeshBasicMaterial({map:ht,transparent:true,opacity:.85,toneMapped:false,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  holo.position.set(0,1.75,-1.2);holo.rotation.y=Math.PI;G.add(holo);
  const lines=o.holo||['PATHFINDER · STRIKE TEAM 1','TGT: HOST INSTALLATION · SITE K','UNKNOWN ARTIFACT','RECOVER · EXTRACT · NO ENGAGEMENT BRIEF','SOURCE: TIDE CITY COMMAND'];
  const drawHolo=(t,glitch)=>{hx.clearRect(0,0,256,160);hx.strokeStyle='rgba(127,227,255,.8)';hx.strokeRect(4,4,248,152);hx.font='11px monospace';hx.fillStyle='rgba(127,227,255,.7)';
    hx.fillText(lines[0],12,22);hx.fillText(lines[1],12,38);
    const pulse=.6+.4*Math.sin(t*6);hx.fillStyle=`rgba(255,210,122,${pulse})`;hx.fillRect(12,62,232,30);hx.fillStyle='#1a1206';hx.font='bold 15px monospace';hx.fillText(lines[2],44,83);
    hx.fillStyle='rgba(127,227,255,.6)';hx.font='10px monospace';hx.fillText(lines[3],12,116);hx.fillText(lines[4],12,132);
    if(glitch)for(let i=0;i<12;i++){hx.fillStyle='rgba(255,90,74,.6)';hx.fillRect(Math.random()*256,Math.random()*160,Math.random()*80,2);}ht.needsUpdate=true;};drawHolo(0);
  // red beacons in the ceiling (each with its own lamp), and the cool fill over the table: three lights, as the old bay had
  const lamps=[],beacons=[];for(const z of[-4,3]){const l=new THREE.PointLight(lin(0xff2a1a),2,12,1.4);l.position.set(0,3.1,z);G.add(l);lamps.push(l);
    const bh=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,.12,16),frameM);bh.position.set(0,CH-.14,z);G.add(bh);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.11,16,8,0,Math.PI*2,0,Math.PI/2),redM);dome.rotation.x=Math.PI;dome.position.set(0,CH-.2,z);G.add(dome);beacons.push(dome);}
  const fill=new THREE.PointLight(lin(0x9fc8ff),.5,10,1.6);fill.position.set(0,2.4,-1.2);G.add(fill);
  // the ramp: hinged at the floor at +z; plates and ribs inside, a hazard band along its lip, lights down its edges
  const ramp=new THREE.Group();ramp.position.set(0,0,7.2);G.add(ramp);
  {const rp=new THREE.Mesh(new THREE.BoxGeometry(6.4,3.6,.2),deckM);rp.position.y=1.8;rp.castShadow=rp.receiveShadow=true;ramp.add(rp);
   for(let y=.4;y<3.4;y+=.8){const r=new THREE.Mesh(new THREE.BoxGeometry(6,.08,.08),frameM);r.position.set(0,y,-.14);ramp.add(r);}
   const hz=new THREE.Mesh(new THREE.PlaneGeometry(6.2,.35),hzM);hz.position.set(0,3.35,-.111);hz.rotation.y=Math.PI;ramp.add(hz);
   const rs=new THREE.Mesh(new THREE.BoxGeometry(5.6,.06,.05),redM);rs.position.set(0,3.4,-.12);ramp.add(rs);
   for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.BoxGeometry(.05,3.2,.05),W?redM:cyanM);e.position.set(s*3.05,1.7,-.12);ramp.add(e);}}
  scene.add(G);
  function tick(t,dt){hm.uniforms.t.value=gm.uniforms.t.value=t;const u=holo3d.userData;if(u.mg)u.mg.rotation.y=t*.25;if(u.pin){u.pin.rotation.y=t*2;u.pin.position.y=.34+.03*Math.sin(t*3);}
    cons.tick(t);beacons.forEach((b,i)=>{b.material.color.copy(lin(0xff2a1a)).multiplyScalar(.6+1.8*Math.max(0,Math.sin(t*4+i*2)));});}
  return{G,ramp,holo,drawHolo,holo3d,lamps,fill,ped,tick,hm,beacons};}

/* ---------- a Keeper cockpit ----------
   The old cockpit's frame: floor at y 0, x ±2.5, z ±2.5; the pilot's seat at x -1.1, the co-pilot's at +1.1, both at z .2; the canopy
   in front (-z), sill at y ~1.05. A curved canopy of struts and faintly reflecting glass, a dash of live screens under it, a centre
   console with the throttles, two seats with headrests, side consoles, an overhead panel of switches. Lights: lamp + red (as before).
   o.disp: the size of the pilot's own display (returned as disp/dx/dt so the mission can draw on it). */
function keeperCockpit(o){o=o||{};const G=new THREE.Group();
  const shellM=pbr('metal039',1.5,{color:0x4a525e,rough:.6,metal:.55}),dashM=pbr('metal015',1,{color:0x2c323a,rough:.5,metal:.6}),
    frameM=pbr('metal015',1,{color:0x6a727e,rough:.4,metal:.75}),seatM=new THREE.MeshStandardMaterial({color:lin(0x22282f),roughness:.85,metalness:.1}),
    padM=new THREE.MeshStandardMaterial({color:lin(0x1f4c86),roughness:.8,metalness:.05}),goldM=new THREE.MeshStandardMaterial({color:lin(0xd9b25a),emissive:lin(0x2a1a04),metalness:.85,roughness:.3}),
    cyanM=new THREE.MeshBasicMaterial({color:lin(0x7fe3ff).multiplyScalar(1.4),toneMapped:false});
  const add=(geo,m,x,y,z,rx,ry,rz)=>{const b=new THREE.Mesh(geo,m);b.position.set(x,y,z);b.rotation.set(rx||0,ry||0,rz||0);b.receiveShadow=true;G.add(b);return b;};
  const box=(w,h,d,m,x,y,z,rx,ry,rz)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,rx,ry,rz);
  // floor, back wall with the doorway, roof, side walls
  box(5,.2,5,shellM,0,-.1,0);for(const s of[-1,1])box(1.7,3,.2,shellM,s*1.65,1.5,2.5);box(1.6,.8,.2,shellM,0,2.6,2.5);
  for(const s of[-1,1]){box(.2,3,5,shellM,s*2.5,1.5,.4);}
  box(5,.16,3.2,shellM,0,3,1.0);
  // the canopy: an arc of glass from the sill (y 1.05, out at z -2.1) up and back to the roof (y 2.95, z -.6)
  const N=PH?10:16,arc=(u,yy,zz,ww)=>{const a=(u-.5)*2.1;return V3(Math.sin(a)*ww,yy,zz-Math.cos(a)*.75+.75);};
  const sill=u=>arc(u,1.05,-2.15,2.55),top=u=>arc(u,2.95,-.75,2.4);
  {const p=[],ix=[],uv=[];const R=6;for(let j=0;j<=R;j++)for(let i=0;i<=N;i++){const u=i/N,v=j/R,a=sill(u),b=top(u);const q=a.clone().lerp(b,v);q.z-=Math.sin(v*Math.PI)*.35;p.push(q.x,q.y,q.z);uv.push(u,v);}
   for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;ix.push(a,b,a+1,b,b+1,a+1);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
   const glass=new THREE.Mesh(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,uniforms:{t:{value:0}},
     vertexShader:'varying vec2 vU;varying vec3 vN;varying vec3 vV;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
     fragmentShader:'varying vec2 vU;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(normalize(vN),vV)),3.);float sm=.5+.5*sin(vU.x*23.+vU.y*7.)*sin(vU.y*11.-vU.x*5.);vec3 c=vec3(.25,.42,.55)*(f*.35+.025+sm*.012);gl_FragColor=vec4(c,1.);}'}));
   G.add(glass);G.userData.glass=glass;
   // struts up the canopy, and the arcs at the sill, the middle and the top
   const tube=(pts,r)=>{const c=new THREE.CatmullRomCurve3(pts);const m=new THREE.Mesh(new THREE.TubeGeometry(c,24,r,6,false),frameM);m.castShadow=true;G.add(m);};
   for(const u of[0,.22,.5,.78,1]){const ps=[];for(let j=0;j<=6;j++){const v=j/6,q=sill(u).lerp(top(u),v);q.z-=Math.sin(v*Math.PI)*.35;ps.push(q);}tube(ps,u%1===0?.09:.045);}
   for(const v of[0,.55,1]){const ps=[];for(let i=0;i<=N;i++){const u=i/N,q=sill(u).lerp(top(u),v);q.z-=Math.sin(v*Math.PI)*.35;ps.push(q);}tube(ps,v===0?.07:.04);}}
  // the dash: a deep shelf under the sill sloping toward the crew, its face full of screens and keys
  box(5,1.05,.6,dashM,0,.52,-2.25);
  const dash=box(4.6,.12,1.0,dashM,0,1.0,-1.72,-.38,0,0);
  const scr=[];const mkS=(w,h,x,y,z,rx,ry,draw)=>{const S=screen(PH?128:256,PH?80:160,draw);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:S.tex,toneMapped:false}));m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,0);G.add(m);scr.push(S);return m;};
  const radar=(x,w,h,t)=>{x.fillStyle='#021018';x.fillRect(0,0,w,h);x.strokeStyle='rgba(127,227,255,.35)';for(let r=1;r<=3;r++){x.beginPath();x.arc(w/2,h/2,r*h/7,0,6.3);x.stroke();}
    const a=t*2.2;x.strokeStyle='rgba(127,227,255,.9)';x.beginPath();x.moveTo(w/2,h/2);x.lineTo(w/2+Math.cos(a)*h*.45,h/2+Math.sin(a)*h*.45);x.stroke();
    x.fillStyle='#c98aff';for(let i=0;i<5;i++){const b=i*1.3+t*.2;x.fillRect(w/2+Math.cos(b)*h*(.15+i*.05)-2,h/2+Math.sin(b*1.7)*h*(.12+i*.04)-2,4,4);}};
  const bars=(x,w,h,t)=>{x.fillStyle='#03101a';x.fillRect(0,0,w,h);x.font=(h*.1|0)+'px monospace';const L=['DRIVE','SHLD','HULL','PWR','NAV'];
    L.forEach((l,i)=>{const v=.4+.4*Math.abs(Math.sin(t*.7+i*1.9));x.fillStyle='rgba(127,227,255,.75)';x.fillText(l,6,h*(.17+i*.18));x.fillStyle=v<.5?'#ff6a5a':'#7fe3ff';x.fillRect(w*.32,h*(.1+i*.18),w*.62*v,h*.07);});};
  const nav=(x,w,h,t)=>{x.fillStyle='#020c12';x.fillRect(0,0,w,h);x.strokeStyle='rgba(255,210,122,.6)';x.beginPath();x.arc(w*.3,h*1.6,h*1.4,-1.35,-.2);x.stroke();
    x.strokeStyle='rgba(127,227,255,.6)';x.setLineDash([4,4]);x.beginPath();x.moveTo(w*.1,h*.8);x.quadraticCurveTo(w*.5,h*.1,w*.9,h*.35);x.stroke();x.setLineDash([]);
    x.fillStyle='#ffd27a';x.fillRect(w*(.1+.8*((t*.05)%1))-2,h*.5-2,4,4);x.fillStyle='rgba(127,227,255,.7)';x.font=(h*.09|0)+'px monospace';x.fillText('VECTOR '+(271+Math.round(Math.sin(t)*3))+'°',6,h*.92);};
  mkS(.62,.38,1.2,1.12,-1.72,-.38-Math.PI/2+Math.PI/2,0,radar);mkS(.6,.36,.25,1.1,-1.95,-.25,0,nav);mkS(.55,.34,1.85,1.06,-1.62,-.38,-.3,bars);mkS(.5,.3,-2.0,1.06,-1.62,-.38,.3,bars);
  // the pilot's own display (the mission draws on it)
  const dc=document.createElement('canvas');dc.width=256;dc.height=160;const dx=dc.getContext('2d'),dt=new THREE.CanvasTexture(dc);dt.encoding=THREE.sRGBEncoding;
  const disp=new THREE.Mesh(new THREE.PlaneGeometry(.9,.56),new THREE.MeshBasicMaterial({map:dt,toneMapped:false}));disp.position.set(-1.1,1.18,-1.66);disp.rotation.x=-.38;G.add(disp);
  // keys: rows of small lit squares across the dash (one instanced mesh)
  {const n=PH?60:140,km=new THREE.InstancedMesh(new THREE.BoxGeometry(.035,.012,.03),new THREE.MeshBasicMaterial({toneMapped:false}),n),M4=new THREE.Matrix4(),col=new THREE.Color();
   const dq=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.38,0,0));let k=0;
   for(let i=0;i<n;i++){const x=-2.1+Math.random()*4.2;if(Math.abs(x+1.1)<.5||Math.abs(x-1.2)<.35||Math.abs(x-.25)<.32)continue;const z=-1.45-Math.random()*.4,y=1.0+(-1.72-z)*Math.tan(.38)*.55+.07;
     M4.compose(V3(x,y,z),dq,V3(1,1,1));km.setMatrixAt(k,M4);const r=Math.random();col.copy(lin(r<.55?0x7fe3ff:r<.75?0xffd27a:r<.85?0xff5a4a:0x8cf0b0)).multiplyScalar(.6+Math.random());km.setColorAt(k,col);k++;}
   km.count=k;G.add(km);G.userData.keys=km;}
  // the centre console between the seats with the throttles
  box(.5,.85,1.3,dashM,0,.42,-.6);for(const s of[-1,1]){box(.05,.32,.05,frameM,s*.1,1.0,-.75,.3,0,0);box(.09,.07,.09,goldM,s*.1,1.17,-.8);}
  mkS(.36,.22,0,.86,-.08,-1.0,0,bars);
  // the seats: a shell, a pad, a headrest, side wings
  for(const s of[-1,1]){const x=s*1.1;box(.62,.14,.6,seatM,x,.5,.25);box(.62,.95,.14,seatM,x,1.05,.62,.12,0,0);box(.46,.8,.04,padM,x,1.05,.54,.12,0,0);box(.38,.26,.12,seatM,x,1.68,.7,.12,0,0);
    for(const w of[-1,1])box(.08,.6,.4,seatM,x+w*.33,.95,.55,.12,0,0);box(.12,.42,.12,frameM,x,.21,.25);}
  // side consoles, ribs on the walls
  for(const s of[-1,1]){box(.5,.9,1.6,dashM,s*2.2,.45,-1.1);mkS(.42,.28,s*2.0,.98,-1.1,-Math.PI/2,s*-1.1,s<0?nav:radar);
    for(const z of[-1.6,-.2,1.2])box(.12,3,.18,frameM,s*2.38,1.5,z);}
  // overhead panel: switches in rows and two strips of light
  box(1.8,.08,1.1,dashM,0,2.88,.4);{const n=PH?24:48,sm=new THREE.InstancedMesh(new THREE.BoxGeometry(.03,.04,.06),new THREE.MeshBasicMaterial({toneMapped:false}),n),M4=new THREE.Matrix4(),col=new THREE.Color();
    for(let i=0;i<n;i++){M4.setPosition(-.8+(i%12)*.145,2.83,-.05+((i/12)|0)*.22);sm.setMatrixAt(i,M4);col.copy(lin(i%5===0?0xffd27a:i%7===0?0xff5a4a:0x7fe3ff)).multiplyScalar(.8);sm.setColorAt(i,col);}G.add(sm);}
  for(const s of[-1,1])box(.04,.02,1.0,cyanM,s*.95,2.9,.4);
  const gmesh=new THREE.Group();G.add(gmesh);
  const lamp=new THREE.PointLight(lin(0x9fc8ff),.9,8,1.5);lamp.position.set(0,2.4,0);G.add(lamp);const red=new THREE.PointLight(lin(0xff2a1a),0,8,1.5);red.position.set(0,2.6,.6);G.add(red);
  function tick(t,dt,off){for(const S of scr)if(!off)S.tick(t);}
  return{G,disp,dx,dt,lamp,red,gmesh:G.userData.keys||gmesh,tick,screens:scr};}

/* ---------- the white stone (the White City, the stones on Astraea) ----------
   whiteTower(h, w, kind, mats): a tower of the white city as seen from far off or nearby: a lathed profile (kind 'heart': the great
   tower, a flared foot, a long waisted shaft, a crown and a needle; 'spire': a slender needle on a stepped base; 'tier': stepped
   drums; 'bulb': a shaft with a swelling crown), gold rings at its joints. mats: {stone, gold}. Its axis is y, its foot at y 0. */
function whiteTower(h,w,kind,mats){const G=new THREE.Group(),pts=[],P=(r,y)=>pts.push(new THREE.Vector2(Math.max(0,r)*w,y*h));
  if(kind==='heart'){P(1,0);P(.92,.03);P(.62,.08);P(.5,.16);P(.42,.4);P(.38,.62);P(.46,.7);P(.5,.74);P(.36,.78);P(.3,.86);P(.12,.92);P(.05,1);P(0,1);}
  else if(kind==='tier'){P(1,0);P(1,.18);P(.82,.2);P(.8,.42);P(.62,.44);P(.6,.66);P(.44,.68);P(.4,.86);P(.2,.9);P(.06,1);P(0,1);}
  else if(kind==='bulb'){P(.6,0);P(.5,.1);P(.34,.5);P(.36,.64);P(.62,.74);P(.6,.84);P(.3,.92);P(.04,1);P(0,1);}
  else{P(1,0);P(.8,.06);P(.42,.1);P(.3,.4);P(.2,.7);P(.1,.9);P(.02,1);P(0,1);}
  const seg=PH?10:16,g=new THREE.LatheGeometry(pts,seg);g.computeVertexNormals();const m=new THREE.Mesh(g,mats.stone);m.castShadow=!!mats.shadow;G.add(m);
  const ys=kind==='heart'?[.08,.16,.7,.78,.86]:kind==='tier'?[.2,.44,.68,.88]:kind==='bulb'?[.5,.74,.84]:[.1,.4,.7];
  for(const y of ys){let r=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];if((a.y-y*h)*(b.y-y*h)<=0){const k=(y*h-a.y)/((b.y-a.y)||1);r=a.x+(b.x-a.x)*k;break;}}
    const t=new THREE.Mesh(new THREE.TorusGeometry(r*1.01+w*.01,w*.025,6,seg*2),mats.gold);t.rotation.x=Math.PI/2;t.position.y=y*h;G.add(t);}
  return G;}
/* a white growth (Astraea's dunes): a twisted crystal of the white stone, three blades round a core, thin at the tip; one geometry,
   1 unit tall (scale it), its foot at y 0 */
let GG=null;function growthGeo(){if(GG)return GG;const N=PH?7:10,pts=[];for(let i=0;i<=N;i++){const u=i/N;pts.push(new THREE.Vector2(.5*(1-u)*(1-u)+.04*(1-u)+.008,u));}
  const g=new THREE.LatheGeometry(pts,6),P=g.attributes.position,v=new THREE.Vector3();
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const a=Math.atan2(v.z,v.x),r=Math.hypot(v.x,v.z),tw=v.y*2.2,k=1+.55*Math.max(0,Math.cos(a*3));const r2=r*k;P.setXYZ(i,Math.cos(a+tw)*r2,v.y,Math.sin(a+tw)*r2);}
  g.computeVertexNormals();return GG=g;}

/* ---------- a Keeper starship's bridge (Nov 17 2026, Bryce: the Site K briefing room "looks terrible") ----------
   Replaces the scanned starship-bridge file, whose single 1024 px texture smeared across the whole room and whose phone copy was cut
   from 150k to 37k triangles (the crumpled, blotchy walls in his screenshot). Built here from clean pieces in the same photo metals as
   the drop bay, on the old file's frame (FURN.BRIDGE): the hologram table at (0, 1.7), the crew round it, the viewport toward -z.
   An eight-sided room: the viewport wall in front (a painted view: o.view 'moon' = the dead moon and Astraea, 'elyra' = over Tide City),
   the helm under it, consoles and wall screens round the sides, the doorway and the Keeper seal at the back, a ring of light over the
   table. It carries no lights (nothing in the level recompiles when it's shown): every surface has its lighting baked into its vertex
   colours (the ring over the table, the screens, the viewport's cold light, darker at the foot of the walls), and glows by it. */
function keeperBridge(o){o=o||{};const G=new THREE.Group(),CX=0,CZ=1.7,A=4.3,H=3.2,TOP=4.1,VIEW=o.view||'moon';
  const tmp=V3(),nm=V3(),RING=V3(CX,TOP-.25,CZ),WIN=-(A-CZ);
  const sst=(a,b,x)=>{const k=Math.min(1,Math.max(0,(x-a)/(b-a)));return k*k*(3-2*k);};
  // the light a point gets: the ring over the table, the viewport, the consoles' glow; darker low against the walls
  const light=(p,n)=>{const dx=RING.x-p.x,dy=RING.y-p.y,dz=RING.z-p.z,d=Math.hypot(dx,dy,dz)||1,face=Math.max(0,(n.x*dx+n.y*dy+n.z*dz)/d);
    const ring=1.25/(1+(d/2.6)*(d/2.6))*(.35+.65*face);
    const wz=p.z-WIN,win=.55*Math.exp(-wz/2.2)*(.4+.6*Math.max(0,n.z))*sst(.4,1.6,p.y)*(1-sst(1.9,3.4,Math.abs(p.x)));
    const rr=Math.hypot(p.x-CX,p.z-CZ),ao=.45+.55*sst(0,1.1,p.y)*1+.0,edge=1-.35*sst(A-1.2,A,rr)*(1-sst(.2,2.4,p.y));
    const scr=.22*Math.exp(-Math.pow((p.y-1.3)/.6,2))*sst(A-1.6,A-.3,rr);
    const k=.42+ring;return[(k*.98+win*.62+scr*.5)*ao*edge,(k*1.0+win*.78+scr*.9)*ao*edge,(k*1.04+win*1.0+scr*1.0)*ao*edge];};
  const bake=m=>{m.updateMatrixWorld(true);const g=m.geometry,P=g.attributes.position,N=g.attributes.normal,c=new Float32Array(P.count*3),nmx=new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    const inv=new THREE.Matrix4().copy(G.matrixWorld).invert(),mw=new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld);
    for(let i=0;i<P.count;i++){tmp.fromBufferAttribute(P,i).applyMatrix4(mw);nm.fromBufferAttribute(N,i).applyMatrix3(nmx).normalize();const L=light(tmp,nm);c[i*3]=L[0];c[i*3+1]=L[1];c[i*3+2]=L[2];}
    g.setAttribute('color',new THREE.BufferAttribute(c,3));};
  // a material that glows by its own baked light (emissive = colour map x vertex colour), and still takes the level's light on top
  const BM=(m,k)=>{m.vertexColors=true;if(m.map){m.emissiveMap=m.map;}m.emissive=m.color.clone().multiplyScalar(2.1*(k==null?1:k));m.emissiveIntensity=1;
    m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance*=vColor;\n#endif');};
    m.customProgramCacheKey=()=>'bridgebake';return m;};
  const pt=panelTex(),wallM=BM(new THREE.MeshStandardMaterial({map:pt,color:lin(0x98a1ae),roughness:.55,metalness:.35})),ceilM=BM(new THREE.MeshStandardMaterial({map:pt,color:lin(0x6a7380),roughness:.6,metalness:.35}),.8),panelM=BM(new THREE.MeshStandardMaterial({map:pt,color:lin(0xaab2bd),roughness:.45,metalness:.4})),
    deckM=BM(pbr('metal015',2.5,{color:0x8a919c,rough:.5,metal:.6})),darkM=BM(pbr('metal039',1,{color:0x343a44,rough:.55,metal:.6})),
    frameM=BM(pbr('metal015',1,{color:0x535b67,rough:.4,metal:.7})),blueM=BM(new THREE.MeshStandardMaterial({color:lin(0x1c3e6c),roughness:.7,metalness:.25}),.7),
    goldM=BM(new THREE.MeshStandardMaterial({color:lin(0xd9b25a),metalness:.85,roughness:.3}),.75),seatM=BM(new THREE.MeshStandardMaterial({color:lin(0x262d36),roughness:.85,metalness:.1}),.7),
    stripM=new THREE.MeshBasicMaterial({color:lin(0xe8f4ff).multiplyScalar(1.5),toneMapped:false}),cyanM=new THREE.MeshBasicMaterial({color:lin(0x7fe3ff).multiplyScalar(1.5),toneMapped:false}),
    amberM=new THREE.MeshBasicMaterial({color:lin(0xffc46a).multiplyScalar(1.4),toneMapped:false}),redM=new THREE.MeshBasicMaterial({color:lin(0xff4a3a).multiplyScalar(1.6),toneMapped:false});
  const meshes=[];
  const add=(geo,m,x,y,z,rx,ry,rz,par)=>{const b=new THREE.Mesh(geo,m);b.position.set(x,y,z);b.rotation.set(rx||0,ry||0,rz||0,'YXZ');(par||G).add(b);if(m.vertexColors)meshes.push(b);return b;};
  const seg=v=>Math.max(1,Math.min(PH?6:10,Math.ceil(v/.5)));
  const box=(w,h,d,m,x,y,z,rx,ry,rz,par)=>add(new THREE.BoxGeometry(w,h,d,seg(w),seg(h),seg(d)),m,x,y,z,rx,ry,rz,par);
  // the eight walls' frames: outward direction of wall i (0 = the viewport, -z; 4 = the door, +z), and a group set on each wall
  const side=2*A*Math.tan(Math.PI/8),walls=[];
  for(let i=0;i<8;i++){const th=i*Math.PI/4,ox=Math.sin(th),oz=-Math.cos(th),W=new THREE.Group();W.position.set(CX+ox*A,0,CZ+oz*A);W.rotation.y=Math.atan2(-ox,-oz);G.add(W);walls.push(W);}
  // in a wall's group: x along the wall, y up, +z into the room
  // the floor: plated deck, darker round the table, a lit ring inlaid round it, grating lanes out to the helm and the door
  {const R0=A/Math.cos(Math.PI/8);
   // the shape is too coarse to carry baked light: re-tessellate it as a grid clipped to the octagon instead
   const NX=PH?18:28,pos=[],ix=[],uv=[];const inside=(x,z)=>{for(let i=0;i<8;i++){const th=i*Math.PI/4;if((x-CX)*Math.sin(th)-(z-CZ)*Math.cos(th)>A)return false;}return true;};
   const span=R0*2,st=span/NX,id={};let n=0;
   for(let j=0;j<=NX;j++)for(let i=0;i<=NX;i++){const x=CX-R0+i*st,z=CZ-R0+j*st;id[j*(NX+1)+i]=n++;pos.push(x,0,z);uv.push(x/2.4,z/2.4);}
   for(let j=0;j<NX;j++)for(let i=0;i<NX;i++){const x=CX-R0+(i+.5)*st,z=CZ-R0+(j+.5)*st;if(!inside(x,z))continue;const a=j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;ix.push(a,c,b,b,c,d);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
   add(g,deckM,0,0,0);
   add(new THREE.CircleGeometry(1.45,40,0),darkM,CX,.006,CZ,-Math.PI/2);
   add(new THREE.RingGeometry(1.45,1.5,64),cyanM,CX,.01,CZ,-Math.PI/2);add(new THREE.RingGeometry(1.95,1.98,64),cyanM,CX,.01,CZ,-Math.PI/2);
   for(const z0 of[-1,1]){const L=A-2.0;box(.9,.02,L,darkM,CX,.01,CZ+z0*(2.0+L/2));for(const s of[-1,1])box(.03,.012,L,z0<0?cyanM:amberM,CX+s*.5,.02,CZ+z0*(2.0+L/2));}}
  // walls: on each, a dark plinth, the plated wall, the Keepers' blue band with its gold line, a light strip under the chamfer
  for(let i=0;i<8;i++){const W=walls[i],w=side+.02;
    if(i===0){// the viewport: plinth and header, posts, mullions; the view painted on a plane just beyond the glass
      box(w,.95,.2,wallM,0,.475,-.1,0,0,0,W);box(w,H-3.05,.2,wallM,0,(H+3.05)/2,-.1,0,0,0,W);
      for(const s of[-1,1])box(.28,H,.3,frameM,s*(w/2-.14),H/2,-.05,0,0,0,W);
      for(const x of[-w/6,w/6])box(.07,2.1,.12,frameM,x,2.0,0,0,0,0,W);box(w-.4,.08,.14,frameM,0,.98,0,0,0,0,W);box(w-.4,.08,.14,frameM,0,3.02,0,0,0,0,W);
      box(w-.4,.025,.04,stripM,0,.94,.06,0,0,0,W);
      const vt=viewTex(VIEW);const vm=new THREE.Mesh(new THREE.PlaneGeometry(w*1.9,4.2),new THREE.MeshBasicMaterial({map:vt,toneMapped:false,fog:false}));vm.position.set(0,2.0,-1.6);W.add(vm);
      // the glass: a faint cold sheen, brighter at a glancing angle
      const gl=new THREE.Mesh(new THREE.PlaneGeometry(w-.4,2.04),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
        vertexShader:'varying vec3 vN;varying vec3 vV;varying vec2 vU;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
        fragmentShader:'varying vec3 vN;varying vec3 vV;varying vec2 vU;void main(){float f=pow(1.-abs(dot(vN,vV)),3.);float s=smoothstep(.0,.02,abs(fract(vU.x*.7+vU.y*.35)-.5)-.44);vec3 c=vec3(.2,.32,.42)*(f*.5+.03+s*.05);gl_FragColor=vec4(c,1.);}'}));
      gl.position.set(0,2.0,.02);W.add(gl);continue;}
    if(i===4){// the door: panels round a doorway, the door itself shut and lit round its edge, the Keeper seal over it
      const dw=1.5,dh=2.5,sw=(w-dw)/2;for(const s of[-1,1])box(sw,H,.2,wallM,s*(dw/2+sw/2),H/2,-.1,0,0,0,W);box(dw,H-dh,.2,wallM,0,(H+dh)/2,-.1,0,0,0,W);
      box(dw,dh,.1,darkM,0,dh/2,-.25,0,0,0,W);box(.02,dh-.2,.04,frameM,0,dh/2,-.18,0,0,0,W);
      for(const s of[-1,1]){box(.08,dh,.16,frameM,s*(dw/2+.04),dh/2,0,0,0,0,W);box(.03,dh-.1,.04,cyanM,s*(dw/2+.1),dh/2,.04,0,0,0,W);}box(dw+.24,.1,.16,frameM,0,dh+.05,0,0,0,0,W);box(dw,.03,.04,cyanM,0,dh+.12,.05,0,0,0,W);
      for(const r of[.3,.2])add(new THREE.TorusGeometry(r,.025,8,40),goldM,0,dh+.45,.02,0,0,0,W);add(new THREE.CircleGeometry(.12,24),amberM,0,dh+.45,.02,0,0,0,W);
      continue;}
    box(w,.5,.32,darkM,0,.25,.04,0,0,0,W);box(w,H-.5,.16,wallM,0,(H+.5)/2,-.08,0,0,0,W);
    // panel seams: inset plates in two rows
    for(const [y,h] of[[1.05,.9],[2.55,.95]])for(const x of[-w/4,w/4])box(w/2-.18,h,.03,panelM,x,y,.01,0,0,0,W);
    box(w,.42,.05,blueM,0,1.72,.02,0,0,0,W);box(w,.035,.07,goldM,0,1.95,.03,0,0,0,W);box(w-.3,.04,.05,stripM,0,H-.12,.04,0,0,0,W);}
  // the corners: a pillar at each, with a thin light down its face
  for(let i=0;i<8;i++){const th=i*Math.PI/4+Math.PI/8,R0=A/Math.cos(Math.PI/8)-.12,x=CX+Math.sin(th)*R0,z=CZ-Math.cos(th)*R0;
    box(.34,H,.34,frameM,x,H/2,z,0,-th,0);if(i!==7&&i!==0){const lx=CX+Math.sin(th)*(R0-.18),lz=CZ-Math.cos(th)*(R0-.18);box(.04,H-1.2,.02,i===3||i===4?amberM:cyanM,lx,H/2+.2,lz,0,-th,0);}}
  // the ceiling: a chamfer from the walls up to a flat plate, eight beams to a ring of light over the table
  {const R1=A/Math.cos(Math.PI/8),R2=R1-1.3;const pos=[],ix=[],uv=[];let n=0;
   for(let i=0;i<8;i++){const a0=i*Math.PI/4+Math.PI/8,a1=a0+Math.PI/4;const q=[[R1,a0,H],[R1,a1,H],[R2,a1,TOP],[R2,a0,TOP]];
     for(const [r,a,y] of q){pos.push(CX+Math.sin(a)*r,y,CZ-Math.cos(a)*r);}uv.push(0,0,side/1.5,0,side/1.5,1,0,1);ix.push(n,n+2,n+1,n,n+3,n+2);n+=4;}
   const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));cg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));cg.setIndex(ix);
   const tg=cg.toNonIndexed();tg.computeVertexNormals();
   // subdivide each quad into strips so the baked light runs smoothly over it
   const sub=new THREE.BufferGeometry(),P=[],U=[],S=PH?3:5;
   for(let i=0;i<8;i++){const a0=i*Math.PI/4+Math.PI/8,a1=a0+Math.PI/4;for(let j=0;j<S;j++){const v0=j/S,v1=(j+1)/S,r0=R1+(R2-R1)*v0,r1=R1+(R2-R1)*v1,y0=H+(TOP-H)*v0,y1=H+(TOP-H)*v1;
     const p=(r,a,y)=>[CX+Math.sin(a)*r,y,CZ-Math.cos(a)*r];const A0=p(r0,a0,y0),B0=p(r0,a1,y0),A1=p(r1,a0,y1),B1=p(r1,a1,y1);P.push(...A0,...B0,...A1,...B0,...B1,...A1);{const su=side/2.6,sv=1.65/2.6;U.push(0,v0*sv,su,v0*sv,0,v1*sv,su,v0*sv,su,v1*sv,0,v1*sv);}}}
   sub.setAttribute('position',new THREE.Float32BufferAttribute(P,3));sub.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));sub.computeVertexNormals();
   add(sub,ceilM,0,0,0);
   const cp=new THREE.CircleGeometry(R2+.05,8,Math.PI/8+Math.PI/2);add(cp,ceilM,CX,TOP+.01,CZ,Math.PI/2);
   for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8,r=(R1+1.6)/2-.2,L=R1-1.6+.4;box(.2,.18,L,frameM,CX+Math.sin(a)*r,TOP-.12-(R1-r)/1.3*.0,CZ-Math.cos(a)*r,0,-a,0);}
   add(new THREE.TorusGeometry(1.5,.08,10,64),frameM,CX,TOP-.12,CZ,Math.PI/2);
   add(new THREE.TorusGeometry(1.5,.035,8,64),stripM,CX,TOP-.2,CZ,Math.PI/2);add(new THREE.TorusGeometry(.9,.025,8,48),cyanM,CX,TOP-.06,CZ,Math.PI/2);}
  // the helm under the viewport: a low console across, two seats, screens; the side consoles on walls 2 and 6; wall screens on 1, 3, 5, 7
  const scr=[];const mkS=(w,h,draw,x,y,z,rx,ry,par,res)=>{const S=screen(Math.round((PH?192:320)*(res||1)),Math.round((PH?120:200)*(res||1)),draw);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:S.tex,toneMapped:false}));m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,0,'YXZ');(par||G).add(m);scr.push(S);return m;};
  const D=drawers(VIEW);
  {const hz=WIN+1.05;box(3.4,.82,.6,darkM,CX,.41,hz);box(3.5,.1,.85,frameM,CX,.86,hz+.1,-.28);box(3.3,.02,.04,cyanM,CX,.8,hz+.42);
   mkS(.95,.42,D.nav,CX-1.05,.98,hz+.12,-1.3,0,null,.8);mkS(.95,.42,D.bars,CX+1.05,.98,hz+.12,-1.3,0,null,.8);mkS(.7,.36,D.radar,CX,.98,hz+.12,-1.3,0,null,.8);
   for(const s of[-1,1]){const x=CX+s*.95,z=hz+1.0;box(.55,.1,.55,seatM,x,.52,z);box(.55,.75,.1,seatM,x,.95,z+.27,-.12);box(.36,.22,.08,blueM,x,1.38,z+.31,-.12);box(.12,.48,.12,frameM,x,.24,z);box(.5,.04,.5,frameM,x,.05,z);
     for(const k of[-1,1])box(.06,.06,.4,frameM,x+k*.3,.72,z-.02);}}
  for(const i of[2,6]){const W=walls[i];box(side-.8,.9,.7,darkM,0,.45,.45,0,0,0,W);box(side-.7,.1,.8,frameM,0,.93,.5,.32,0,0,W);box(side-.9,.02,.04,cyanM,0,.88,.88,0,0,0,W);
    mkS(side-1.2,.5,i===2?D.bars:D.nav,0,1.0,.42,-1.25,0,W,.9);mkS(1.3,.75,i===2?D.radar:D.sched,-.75,2.45,.04,0,0,W);mkS(1.3,.75,i===2?D.sched:D.radar,.75,2.45,.04,0,0,W);}
  for(const i of[1,7]){const W=walls[i];mkS(side-.7,1.15,i===1?D.orbit:D.crew,0,2.45,.06,0,0,W,1.2);box(side-.5,1.3,.06,frameM,0,2.45,.0,0,0,0,W);
    box(side-.6,.85,.55,darkM,0,.43,.3,0,0,0,W);box(side-.5,.08,.62,frameM,0,.9,.32,0,0,0,W);mkS(side-1.0,.42,D.bars,0,.93,.36,-1.35,0,W,.7);}
  for(const i of[3,5]){const W=walls[i];for(const x of[-.8,0,.8]){box(.7,2.1,.4,darkM,x,1.05,.22,0,0,0,W);box(.6,.03,.02,frameM,x,1.05,.43,0,0,0,W);for(let k=0;k<3;k++)box(.04,.04,.01,k?cyanM:amberM,x-.15+k*.12,1.9,.43,0,0,0,W);}
    mkS(side-.8,.6,D.sched,0,2.6,.06,0,0,W,.8);}
  G.updateMatrixWorld(true);for(const m of meshes)bake(m);
  // the screens move while the set is drawn (ticked from a screen's draw, so a hidden set costs nothing)
  if(scr.length){const first=G.children.find(c=>c.isMesh&&c.material&&c.material.map===scr[0].tex)||null;let lt=0;
    const tk=()=>{const t=performance.now()/1000;if(t-lt<(PH?.12:.06))return;lt=t;for(const S of scr)S.tick(t,true);};
    G.traverse(c=>{if(c.isMesh&&c.material&&c.material.map&&scr.some(S=>S.tex===c.material.map))c.onBeforeRender=tk;});}
  return{G,screens:scr};}
// painted hull plating for the bridge walls: two plates by two, seams, bevels, a few vents and stencils (one texture, repeated)
let PNT=null;function panelTex(){if(PNT)return PNT;const N=PH?256:512;PNT=canvas(N,N,(x,w,h)=>{x.fillStyle='#8a929c';x.fillRect(0,0,w,h);
  const img=x.getImageData(0,0,w,h),d=img.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*10+(fb2((i/4%w)/w*8,(i/4/w|0)/h*8,4)-.5)*22;d[i]+=n;d[i+1]+=n;d[i+2]+=n*1.05;}x.putImageData(img,0,0);
  const q=w/2;for(let j=0;j<2;j++)for(let i=0;i<2;i++){const X=i*q,Y=j*q;x.fillStyle=`rgba(${(i+j)%2?255:0},${(i+j)%2?255:0},${(i+j)%2?255:0},.05)`;x.fillRect(X+3,Y+3,q-6,q-6);
    x.strokeStyle='rgba(20,24,30,.85)';x.lineWidth=3;x.strokeRect(X+1.5,Y+1.5,q-3,q-3);x.strokeStyle='rgba(255,255,255,.22)';x.lineWidth=1;x.beginPath();x.moveTo(X+4,Y+q-4);x.lineTo(X+4,Y+4);x.lineTo(X+q-4,Y+4);x.stroke();
    x.fillStyle='rgba(30,34,40,.7)';for(const [a,b] of[[8,8],[q-12,8],[8,q-12],[q-12,q-12]])x.fillRect(X+a,Y+b,4,4);}
  x.fillStyle='rgba(28,32,38,.75)';for(let k=0;k<6;k++)x.fillRect(w*.58,h*.12+k*h*.025,w*.3,h*.01);
  x.fillStyle='rgba(217,178,90,.55)';x.fillRect(w*.08,h*.62,w*.05,h*.3);x.fillStyle='rgba(20,24,30,.6)';x.font=(h*.03|0)+'px monospace';x.fillText('KPR-07  CL.2',w*.16,h*.66);x.fillText('DECK 1 · BRIDGE',w*.16,h*.7);});
  PNT.wrapS=PNT.wrapT=THREE.RepeatWrapping;return PNT;}
// the view out of the bridge's viewport, painted once
function viewTex(kind){return canvas(PH?1024:2048,PH?512:1024,(x,w,h)=>{
  const st=(n,b)=>{for(let i=0;i<n;i++){const a=Math.random();x.fillStyle=`rgba(${220+Math.random()*35|0},${225+Math.random()*30|0},255,${a*a*b})`;const s=Math.random()<.04?2.2:1.1;x.fillRect(Math.random()*w,Math.random()*h*.7,s,s);}};
  if(kind==='elyra'){// over Tide City at dawn: the alien sky's blues, a band of cloud far below, the city's lights through the breaks
    let g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#030818');g.addColorStop(.42,'#0b2650');g.addColorStop(.6,'#2a6a9a');g.addColorStop(.66,'#7cc4e0');g.addColorStop(.7,'#203a58');g.addColorStop(1,'#0a1422');x.fillStyle=g;x.fillRect(0,0,w,h);st(500,.6);
    for(let i=0;i<260;i++){const cx=Math.random()*w,cy=h*(.68+Math.random()*.3),r=w*(.02+Math.random()*.06);const gg=x.createRadialGradient(cx,cy,0,cx,cy,r);gg.addColorStop(0,'rgba(170,205,230,.22)');gg.addColorStop(1,'rgba(170,205,230,0)');x.fillStyle=gg;x.fillRect(cx-r,cy-r,r*2,r*2);}
    for(let i=0;i<500;i++){x.fillStyle=`rgba(255,${190+Math.random()*50|0},120,${.3+Math.random()*.6})`;const cx=w*.5+(Math.random()-.5)*w*.5,cy=h*(.74+Math.random()*.16);x.fillRect(cx,cy,1.5,1.5);}
    const sg=x.createRadialGradient(w*.78,h*.62,0,w*.78,h*.62,w*.25);sg.addColorStop(0,'rgba(255,240,210,.55)');sg.addColorStop(1,'rgba(255,240,210,0)');x.fillStyle=sg;x.fillRect(0,0,w,h);return;}
  // the dead moon below, Astraea rising over its rim
  x.fillStyle='#010207';x.fillRect(0,0,w,h);st(1400,.9);
  {const neb=x.createRadialGradient(w*.2,h*.2,0,w*.2,h*.2,w*.5);neb.addColorStop(0,'rgba(60,40,110,.25)');neb.addColorStop(1,'rgba(60,40,110,0)');x.fillStyle=neb;x.fillRect(0,0,w,h);}
  {const cx=w*.3,cy=h*.38,r=h*.3;const g=x.createRadialGradient(cx+r*.35,cy-r*.3,r*.1,cx,cy,r);g.addColorStop(0,'#f0a070');g.addColorStop(.55,'#b0482c');g.addColorStop(1,'#3a1008');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();
   x.save();x.beginPath();x.arc(cx,cy,r,0,7);x.clip();for(let i=0;i<40;i++){x.fillStyle=`rgba(255,${200+Math.random()*40|0},170,${Math.random()*.12})`;x.fillRect(cx-r,cy-r+Math.random()*r*2,r*2,2+Math.random()*6);}
   const sh=x.createLinearGradient(cx+r,cy,cx-r,cy);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(.7,'rgba(0,0,0,.75)');x.fillStyle=sh;x.fillRect(cx-r,cy-r,r*2,r*2);x.restore();
   const hz=x.createRadialGradient(cx,cy,r*.96,cx,cy,r*1.12);hz.addColorStop(0,'rgba(255,150,100,.35)');hz.addColorStop(1,'rgba(255,150,100,0)');x.fillStyle=hz;x.beginPath();x.arc(cx,cy,r*1.12,0,7);x.fill();}
  {const cy=h*3.15,R=h*2.55;const g=x.createLinearGradient(0,cy-R,0,h);g.addColorStop(0,'#8e8a98');g.addColorStop(.05,'#5a5664');g.addColorStop(.3,'#2a2830');g.addColorStop(1,'#0c0b10');x.fillStyle=g;x.beginPath();x.arc(w*.55,cy,R,0,7);x.fill();
   x.save();x.beginPath();x.arc(w*.55,cy,R,0,7);x.clip();
   for(let i=0;i<420;i++){const px=Math.random()*w,py=cy-R+Math.pow(Math.random(),1.6)*(h-(cy-R)),rr=(2+Math.random()*16)*(.4+(py-(cy-R))/(h*.5));x.strokeStyle=`rgba(0,0,0,${.15+Math.random()*.25})`;x.lineWidth=1.2;x.beginPath();x.ellipse(px,py,rr,rr*.35,0,0,7);x.stroke();
     x.strokeStyle=`rgba(200,195,215,${Math.random()*.12})`;x.beginPath();x.ellipse(px,py-1,rr,rr*.35,0,Math.PI,7);x.stroke();}
   // Site K: violet lights in a cluster on the surface
   for(let i=0;i<70;i++){const px=w*.62+(Math.random()-.5)*w*.08,py=h*.82+(Math.random()-.5)*h*.05;x.fillStyle=`rgba(190,120,255,${.4+Math.random()*.6})`;x.fillRect(px,py,1.6,1.6);}
   const gl=x.createRadialGradient(w*.62,h*.82,0,w*.62,h*.82,w*.06);gl.addColorStop(0,'rgba(180,106,255,.4)');gl.addColorStop(1,'rgba(180,106,255,0)');x.fillStyle=gl;x.fillRect(0,0,w,h);x.restore();
   x.strokeStyle='rgba(220,215,235,.6)';x.lineWidth=2;x.beginPath();x.arc(w*.55,cy,R,Math.PI*1.25,Math.PI*1.75);x.stroke();}});}
// the bridge's screens
function drawers(kind){const font=(x,h,k)=>x.font=(h*k|0)+'px monospace';
  const bg=(x,w,h)=>{x.fillStyle='#03101a';x.fillRect(0,0,w,h);x.strokeStyle='rgba(127,227,255,.35)';x.lineWidth=2;x.strokeRect(2,2,w-4,h-4);};
  return{
    nav(x,w,h,t){bg(x,w,h);x.strokeStyle='rgba(127,227,255,.25)';x.lineWidth=1;for(let i=1;i<6;i++){x.beginPath();x.moveTo(i*w/6,0);x.lineTo(i*w/6,h);x.stroke();x.beginPath();x.moveTo(0,i*h/6);x.lineTo(w,i*h/6);x.stroke();}
      x.strokeStyle='#ffd27a';x.lineWidth=2;x.beginPath();for(let i=0;i<=40;i++){const u=i/40;x.lineTo(w*.1+u*w*.8,h*.7-Math.sin(u*2.6)*h*.4);}x.stroke();
      const u=(t*.05)%1;x.fillStyle='#7fe3ff';x.fillRect(w*.1+u*w*.8-3,h*.7-Math.sin(u*2.6)*h*.4-3,6,6);font(x,h,.11);x.fillStyle='rgba(127,227,255,.8)';x.fillText(kind==='elyra'?'TIDE CITY · HOLD':'SITE K · DESCENT',8,h*.14);},
    bars(x,w,h,t){bg(x,w,h);font(x,h,.1);const L=['DRIVE','SHLD','HULL','PWR','COMMS'];L.forEach((l,i)=>{const v=.55+.35*Math.abs(Math.sin(t*.5+i*1.9));x.fillStyle='rgba(127,227,255,.75)';x.fillText(l,8,h*(.2+i*.17));x.fillStyle='#7fe3ff';x.fillRect(w*.34,h*(.12+i*.17),w*.58*v,h*.07);});},
    radar(x,w,h,t){x.fillStyle='#021018';x.fillRect(0,0,w,h);x.strokeStyle='rgba(127,227,255,.35)';x.lineWidth=1;for(let r=1;r<=3;r++){x.beginPath();x.arc(w/2,h/2,r*h/7,0,6.3);x.stroke();}
      const a=t*1.6;x.strokeStyle='rgba(127,227,255,.9)';x.lineWidth=2;x.beginPath();x.moveTo(w/2,h/2);x.lineTo(w/2+Math.cos(a)*h*.45,h/2+Math.sin(a)*h*.45);x.stroke();
      x.fillStyle='#c98aff';for(let i=0;i<5;i++){const b=i*1.3;x.fillRect(w/2+Math.cos(b)*h*(.15+i*.05)-2,h/2+Math.sin(b*1.7)*h*(.12+i*.04)-2,4,4);}},
    sched(x,w,h,t){bg(x,w,h);font(x,h,.085);const R=kind==='elyra'?['VIGIL · STATION KEEPING','SPEAR · CHARGE CYCLE','PLINTH · CONTESTED','DEVICE · IN TRANSIT','ORDER · ELIAS VEYR']:['DROP BAY · ARMED','RAMP · SEALED','STRIKE TEAM · 4','LZ · CRATER RIM','EXTRACT · ON CALL'];
      R.forEach((r,i)=>{x.fillStyle=i===((t*.6|0)%R.length)?'#ffd27a':'rgba(127,227,255,.75)';x.fillText(r,10,h*(.18+i*.17));});},
    orbit(x,w,h,t){x.fillStyle='#02080f';x.fillRect(0,0,w,h);const cx=w*.42,cy=h*.55;x.strokeStyle='rgba(127,227,255,.3)';x.lineWidth=1;
      for(const r of[.18,.3,.42]){x.beginPath();x.ellipse(cx,cy,h*r*1.6,h*r*.7,-.2,0,7);x.stroke();}x.fillStyle=kind==='elyra'?'#3a7ab0':'#8a8698';x.beginPath();x.arc(cx,cy,h*.13,0,7);x.fill();
      const a=t*.4;x.fillStyle='#ffd27a';x.beginPath();x.arc(cx+Math.cos(a)*h*.48,cy+Math.sin(a)*h*.21,4,0,7);x.fill();font(x,h,.07);x.fillStyle='rgba(127,227,255,.8)';x.fillText(kind==='elyra'?'ELYRA · LOW ORBIT':'DEAD MOON · ORBIT 2',w*.62,h*.18);x.fillText('ALT '+(312+Math.sin(t)*3|0)+' KM',w*.62,h*.3);},
    crew(x,w,h,t){bg(x,w,h);font(x,h,.075);const N=kind==='elyra'?['VEYR','VIGIL CMD','HELM','GUNNERY','COMMS']:['RHEN','MARSH','THORNE','OKAFOR','LANDRY'];
      N.forEach((n,i)=>{const y=h*(.12+i*.18);x.fillStyle='rgba(127,227,255,.8)';x.fillText(n,10,y+h*.07);x.strokeStyle='rgba(127,227,255,.6)';x.beginPath();for(let k=0;k<60;k++){const u=k/60,v=Math.sin(u*30+t*4+i)*Math.exp(-Math.pow((u*6+t*2+i)%6-3,2));x.lineTo(w*.4+u*w*.55,y+h*.05-v*h*.06);}x.stroke();});}};}

return{keeperBridge,whiteTower,growthGeo,tx,pbr,canvas,screen,sprite,glowT,puffTex,hazard,shipM,shock,burst,sunFlare,rockGeo,holoMat,sheath,keeperBay,keeperCockpit,fb2,lin,V3};
})();
