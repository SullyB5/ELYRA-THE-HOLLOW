/* ELYRA: The Hollow · the trailer (Nov 12 2026, Bryce: keep the original trailer's cut, beats and lines, "just the graphics needs a
   complete change"). Not part of the game: trailer.html drives it, tools/trailer/drive.py steps it frame by frame and records it.
   Every frame is a pure function of the trailer's clock t (seconds): TRAILER.frame(t) poses everything and draws it.
   The night world is the main menu's (js/trailer/world.js, from js/menu/halo-scene.js: the Spear, Tide City round it, the shore);
   the Hollow King's chamber is built here; the White City and its dome are frames recorded from the level itself (pathfinder-3.html),
   shown here behind the overlays. Text in Vanguard type (fonts/vanguard.css). */
(()=>{
  let _s=20371;Math.random=()=>{_s=(_s*16807)%2147483647;return(_s-1)/2147483646;};
  const W=1920,H=1080,$=id=>document.getElementById(id);
  const R=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true,preserveDrawingBuffer:true});
  R.setPixelRatio(1);R.setSize(W,H,false);R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.12;
  R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;window.ELYRA_RENDERER=R;
  const WD=WORLD(R),{scene,cam,V,C,SP,GLOW,PUFF}=WD;cam.aspect=W/H;cam.updateProjectionMatrix();
  const cl=(x,a,b)=>Math.max(a,Math.min(b,x)),sm=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);},lerp=(a,b,k)=>a+(b-a)*k;
  const eo=x=>1-Math.pow(1-cl(x,0,1),3),ei=x=>Math.pow(cl(x,0,1),3);
  const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const add=(c,sc,op,p)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:c,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false,opacity:op==null?1:op,fog:false}));s.scale.setScalar(sc);if(p)s.position.copy(p);return s;};
  const glbL=new THREE.GLTFLoader();
  const glb=(n)=>MeshoptDecoder.ready.then(()=>new Promise((ok,no)=>glbL.load('models/pc/'+n+'.glb',ok,undefined,()=>glbL.load('models/'+n+'.glb',ok,undefined,no))));
  glbL.setMeshoptDecoder(MeshoptDecoder);
  const loads=[];

  /* ======================= the night world: what changes over the trailer ======================= */
  // the city's lights going out ("one by one, we are losing ourselves"): rooms die from the outer districts in toward the Spear,
  // each block on its own beat; at 1 only the core's last few remain. The Spear never goes dark.
  const OUT={value:0},SPU={value:SP.clone()};
  {const tm=WD.CITY.mats.towerMat,ob=tm.onBeforeCompile;
    tm.onBeforeCompile=sh=>{ob(sh);sh.uniforms.uOut=OUT;sh.uniforms.uSP=SPU;
      sh.fragmentShader='uniform float uOut;uniform vec3 uSP;\n'+sh.fragmentShader.replace(/totalEmissiveRadiance\+=winGlow\*([0-9.]+);/,(m,g)=>
        `{float dd=clamp(length(vWP.xz-uSP.xz)/3000.,0.,1.);float k=fract(sin(dot(floor(vWP.xz/38.)+floor(vWP.y/30.)*.37,vec2(12.9898,78.233)))*43758.5453);
          float alive=smoothstep(uOut-.02,uOut+.02,1.03-dd*.62-k*.38);totalEmissiveRadiance+=winGlow*${g}*alive;}`);};
    tm.customProgramCacheKey=()=>'tower-trailer';tm.needsUpdate=true;}
  const accent=WD.CITY.mats.accentMat,rim=WD.CITY.mats.rimM,acc0=accent.emissiveIntensity,rim0=rim.emissiveIntensity;
  // the far Herald ships the menu keeps on the horizon belong to after; the trailer brings its own in
  WD.TRAF.slice(1,4).forEach(T=>{T.g.visible=false;T.f=()=>[V(0,-9e4,0),V(1,0,0)];});
  WD.wreck.visible=false;

  /* ---------- the Heralds: red hulls out of Slipscape over the city ---------- */
  const RED=0xff3a24;
  const HER=[
    // end place, length, arrival time (trailer s), heading
    {p:V(-1500,2350,-4300),len:2100,ta:15.55,d:V(.25,-.05,1)},
    {p:V(1900,2750,-4900),len:1700,ta:16.15,d:V(-.3,-.05,1)},
    {p:V(250,3500,-6600),len:2600,ta:16.85,d:V(0,-.04,1)},
    {p:V(-3700,2050,-5600),len:1300,ta:17.35,d:V(.45,0,1)},
    {p:V(3800,1950,-3600),len:1150,ta:17.7,d:V(-.5,0,1)}];
  const fleetL=new THREE.PointLight(RED,0,9000,1.2);fleetL.position.set(0,2400,-4000);scene.add(fleetL);
  for(const S of HER){S.d.normalize();S.g=WD.ship('harrower',S.len,{});scene.add(S.g);S.g.visible=false;
    // engines astern and a run of red lights under the hull
    S.eng=add(0xff5a3a,S.len*.4,.9);S.eng.position.z=S.len*.5;S.g.add(S.eng);
    for(let i=0;i<7;i++){const s=add(RED,S.len*(.05+.05*hash(i+S.len)),.7);s.position.set((hash(i*3+S.len)-.5)*S.len*.18,-S.len*.05,(i/6-.5)*S.len*.8);S.g.add(s);}
    S.flash=add(0xd8ecff,1,0);scene.add(S.flash);S.flash2=add(RED,1,0);scene.add(S.flash2);
    S.ring=new THREE.Mesh(new THREE.TorusGeometry(1,.035,6,96),new THREE.MeshBasicMaterial({color:0xffc8b0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false}));scene.add(S.ring);
    S.streak=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,10,1,true).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:0xffd0c0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false}));scene.add(S.streak);}
  const _f=V();
  function heralds(t,on){let lit=0;
    for(const S of HER){const u=t-S.ta;S.g.visible=on&&u>-.05;S.flash.visible=S.flash2.visible=S.ring.visible=S.streak.visible=on;if(!on)continue;
      // out of Slipscape: a long white streak along its line, a flash, then the hull, braking hard from far out
      const k=eo(u/1.1),from=S.p.clone().addScaledVector(S.d,-S.len*6);
      const p=u<0?from:from.lerp(S.p,k);if(u>1.1)p.addScaledVector(S.d,(u-1.1)*S.len*.004).y-=(u-1.1)*6;
      S.g.position.copy(p);S.g.lookAt(_f.copy(p).sub(S.d));S.g.scale.set(1,1,1+3.5*(1-sm(0,.5,u)));
      const fl=u<0?0:Math.exp(-u*4.5);S.flash.position.copy(S.p);S.flash.scale.setScalar(S.len*(1.4+u*1.2));S.flash.material.opacity=fl;
      S.flash2.position.copy(S.p);S.flash2.scale.setScalar(S.len*3.2);S.flash2.material.opacity=fl*.55+(u>0?.08*sm(0,1,u):0);
      S.ring.position.copy(S.p);S.ring.lookAt(_f.copy(S.p).add(S.d));const rr=S.len*(.3+eo(u/1.4)*1.6);S.ring.scale.set(rr,rr,rr);S.ring.material.opacity=u<0?0:.9*Math.exp(-u*2.2);
      S.streak.position.copy(S.p).addScaledVector(S.d,-S.len*3);S.streak.lookAt(_f.copy(S.p));S.streak.scale.set(S.len*.03,S.len*.03,S.len*6);S.streak.material.opacity=u<-.25?0:u<0?.6*sm(-.25,0,u):.6*Math.exp(-u*7);
      S.eng.material.opacity=.7+.2*Math.sin(t*9+S.len);lit+=u>0?1:0;}
    fleetL.intensity=on?lit*.35:0;}

  /* ---------- the battle: beams from the hulls, the city burning, the sky full of fire ---------- */
  const beamM=()=>new THREE.MeshBasicMaterial({color:0xff4a2a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false});
  const unitCyl=new THREE.CylinderGeometry(1,1,1,12,1,true).translate(0,.5,0).rotateX(Math.PI/2);   // from 0 to +z
  const BEAMS=[];
  function beam(from,to,t0,t1,w){const g=new THREE.Group(),o=new THREE.Mesh(unitCyl,beamM()),c=new THREE.Mesh(unitCyl,beamM());c.material.color.set(0xfff0e0);g.add(o,c);
    const hit=add(0xff7a3a,w*14,0),hot=add(0xffffff,w*5,0);scene.add(g,hit,hot);const B={g,o,c,hit,hot,from,to,t0,t1,w};BEAMS.push(B);return B;}
  function beams(t,on){for(const B of BEAMS){const live=on&&t>B.t0&&t<B.t1;B.g.visible=B.hit.visible=B.hot.visible=live;if(!live)continue;
    const f=typeof B.from==='function'?B.from(t):B.from,u=t-B.t0,k=sm(0,.12,u)*(1-sm(B.t1-.15-B.t0,B.t1-B.t0,u)),pulse=.8+.2*Math.sin(t*60+B.w);
    const len=f.distanceTo(B.to),grow=Math.min(1,u/.08);B.g.position.copy(f);B.g.lookAt(B.to);
    B.o.scale.set(B.w*pulse,B.w*pulse,len*grow);B.c.scale.set(B.w*.32,B.w*.32,len*grow);B.o.material.opacity=.55*k;B.c.material.opacity=.95*k;
    B.hit.position.copy(B.to);B.hit.material.opacity=k*grow*.9;B.hit.scale.setScalar(B.w*(16+8*Math.sin(t*31)));B.hot.position.copy(B.to);B.hot.material.opacity=k*grow;}}
  // fires and smoke over the districts: lit once the Heralds start firing (fire 0..1)
  const FIRE=[],SMK=[];
  {const tw=WD.CITY.towers.filter(T=>Math.hypot(T.x-SP.x,T.z-SP.z)>500);
    for(let i=0;i<46;i++){const T=tw[(hash(i*7.3)*tw.length)|0];if(!T)continue;const y=3+T.h*(.35+.6*hash(i));const p=V(T.x+(hash(i+2)-.5)*T.fp,y,T.z+(hash(i+5)-.5)*T.fp);
      const a=add(0xff6a20,1,0,p),b=add(0xffc070,1,0,p),c=add(0xff5010,1,0,p);scene.add(a,b,c);FIRE.push({p,a,b,c,s:30+hash(i+9)*70,ph:hash(i)*20,at:hash(i+11)});
      if(i%2===0)for(let j=0;j<6;j++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,color:0x2a2228,transparent:true,depthWrite:false,opacity:0}));scene.add(s);SMK.push({s,p,j,ph:hash(i*3+j)});}}}
  const cityFireL=new THREE.PointLight(0xff6a30,0,6000,1.3);cityFireL.position.set(SP.x+300,500,SP.z+900);scene.add(cityFireL);
  function fires(t,amt){for(const F of FIRE){const on=amt>F.at*.9;const k=on?(.75+.25*Math.sin(t*9+F.ph)*Math.sin(t*5.1+F.ph*2)):0;
      F.a.scale.set(F.s*1.4*k,F.s*2*k,1);F.a.position.copy(F.p).setY(F.p.y+F.s*.5);F.a.material.opacity=on?.85:0;
      F.b.scale.set(F.s*.7*k,F.s*1.1*k,1);F.b.position.copy(F.p).setY(F.p.y+F.s*.3);F.b.material.opacity=on?.9:0;
      F.c.scale.setScalar(F.s*5);F.c.material.opacity=on?.18*k:0;}
    for(const S of SMK){const on=amt>.2;const u=((S.ph+t*.05+S.j/6)%1);S.s.position.set(S.p.x+u*u*500,S.p.y+40+u*900,S.p.z-u*200);S.s.scale.setScalar(80+u*500);S.s.material.opacity=on?Math.sin(u*Math.PI)*.5*amt:0;}
    cityFireL.intensity=amt*2.2;}

  /* ---------- the Keepers in the air: interceptors and their fire; a Hollow fighter in front of them ---------- */
  const KEEP=[];for(let k=0;k<3;k++){const g=WD.ship('raven',22,{glow:0x9fe4ff,gs:.9});scene.add(g);g.visible=false;KEEP.push(g);}
  const PREY=WD.ship('wraith',26,{glow:0xb070ff,gs:.9});scene.add(PREY);PREY.visible=false;
  const BOLTS=[];for(let i=0;i<24;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,14),new THREE.MeshBasicMaterial({color:0x9fe8ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));m.visible=false;scene.add(m);BOLTS.push(m);}
  const preyBoom=[add(0xffffff,1,0),add(0xb070ff,1,0),add(0xff8a40,1,0)];preyBoom.forEach(s=>scene.add(s));

  /* ---------- the Spear answers: its blade gathers light, then a column of gold into the sky ---------- */
  const spearTop=V(SP.x,WD.spear.top-40,SP.z);
  const sBeam=new THREE.Group(),sb1=new THREE.Mesh(unitCyl,beamM()),sb2=new THREE.Mesh(unitCyl,beamM());sb1.material.color.set(0xffc860);sb2.material.color.set(0xfffbe8);sBeam.add(sb1,sb2);scene.add(sBeam);
  const sCharge=add(0xffd890,1,0,spearTop),sCharge2=add(0xffffff,1,0,spearTop),sHit=add(0xffe0a0,1,0),sHit2=add(0xff6a30,1,0);scene.add(sCharge,sCharge2,sHit,sHit2);
  const spearL=new THREE.PointLight(0xffc870,0,5000,1.2);spearL.position.copy(spearTop);scene.add(spearL);
  function spearFire(t,on,t0){const u=t-t0;sBeam.visible=sCharge.visible=sCharge2.visible=sHit.visible=sHit2.visible=on;if(!on){spearL.intensity=0;return;}
    const ch=sm(-.5,0,u),fire=sm(0,.06,u);sCharge.scale.setScalar(160+420*ch+260*fire);sCharge.material.opacity=.35+.5*ch;sCharge2.scale.setScalar(80+300*ch);sCharge2.material.opacity=ch;
    const to=HER[2].p.clone().add(V(0,-80,300)),len=spearTop.distanceTo(to)*fire;sBeam.position.copy(spearTop);sBeam.lookAt(to);
    const w=22*(1+.15*Math.sin(t*70));sb1.scale.set(w,w,Math.max(1,len));sb2.scale.set(w*.35,w*.35,Math.max(1,len));sb1.material.opacity=.7*fire;sb2.material.opacity=fire;
    sHit.position.copy(to);sHit.scale.setScalar(1500*sm(.03,.2,u));sHit.material.opacity=sm(.03,.1,u);sHit2.position.copy(to);sHit2.scale.setScalar(3000*sm(.05,.5,u));sHit2.material.opacity=.45*sm(.05,.15,u);
    spearL.intensity=(ch*1.5+fire*3.5);}

  /* ---------- the Hollow on the march: Bryce's rigged Hollow, coming over the dunes in their ranks ---------- */
  const ARMY=[],armyG=new THREE.Group();armyG.visible=false;scene.add(armyG);
  const MARCH0=V(150,0,250),MARCH_D=V(-.08,0,-1).normalize();   // they walk toward the city (-z), the camera ahead of them
  loads.push(Promise.all([glb('chars/rigged/hollow-commander'),glb('chars/rigged/hollow-heavy')]).then(src=>{
    const SKU=THREE.SkeletonUtils;let n=0;
    for(let row=0;row<9;row++)for(let col=-6;col<=6;col++){const which=(row+col+20)%3===0?0:1,G=src[which];
      const o=SKU.clone(G.scene);o.traverse(q=>{if(q.isMesh){q.castShadow=true;q.frustumCulled=false;if(q.material){q.material=q.material.clone();q.material.metalness=Math.min(q.material.metalness,.5);q.material.emissive=C(0x9a45ff);q.material.emissiveIntensity=.12;}}});
      const b=new THREE.Box3().setFromObject(o),k=(which?2.3:2.1)/(b.max.y-b.min.y);o.scale.setScalar(k);
      const mx=new THREE.AnimationMixer(o),clip=G.animations.find(a=>/walk/i.test(a.name))||G.animations[0];const act=mx.clipAction(clip);act.play();
      const side=V(-MARCH_D.z,0,MARCH_D.x);const off=V().addScaledVector(side,col*4.2+(hash(n)-.5)*1.6).addScaledVector(MARCH_D,-row*5.2+(hash(n+3)-.5)*2);
      const eye=add(0xc070ff,.9,.9);eye.position.set(0,1.62/k,.12/k);o.add(eye);
      armyG.add(o);ARMY.push({o,mx,off,ph:hash(n+7)*clip.duration,dur:clip.duration});n++;}}).catch(e=>console.warn('army',e)));
  const armyFire=[];for(let i=0;i<10;i++){const p=V(MARCH0.x+(hash(i+40)-.5)*160,0,MARCH0.z-40-hash(i+41)*160);p.y=WD.H(p.x,p.z)+1;const a=add(0xff6a20,1,.9,p),b=add(0xff4a10,1,.25,p);scene.add(a,b);armyFire.push({p,a,b,ph:hash(i)*9});}
  const armyL=new THREE.PointLight(0xff7a3a,0,500,1.5);scene.add(armyL);const armyL2=new THREE.PointLight(0x9a45ff,0,400,1.5);scene.add(armyL2);
  function army(t,on,speed){armyG.visible=on;for(const F of armyFire){F.a.visible=F.b.visible=on;const k=.75+.25*Math.sin(t*9+F.ph);F.a.scale.set(14*k,22*k,1);F.a.position.y=F.p.y+8;F.b.scale.setScalar(70);}
    armyL.intensity=armyL2.intensity=on?2.4:0;if(!on)return;
    for(const A of ARMY){const p=MARCH0.clone().add(A.off).addScaledVector(MARCH_D,t*speed);p.y=WD.H(p.x,p.z)-.05;A.o.position.copy(p);A.o.lookAt(_f.copy(p).add(MARCH_D));
      A.mx.setTime(((t*1.0+A.ph)%A.dur+A.dur)%A.dur);}
    armyL.position.copy(MARCH0).add(V(0,14,-40)).addScaledVector(MARCH_D,t*speed);armyL2.position.copy(MARCH0).add(V(0,6,10)).addScaledVector(MARCH_D,t*speed);}

  /* ======================= the Hollow King's chamber: the door that was never meant to open ======================= */
  const KS=new THREE.Scene(),KC=new THREE.PerspectiveCamera(34,W/H,.1,600);KS.fog=new THREE.FogExp2(0x07030e,.022);KS.background=C(0x030106);
  const tx=n=>{const t=new THREE.TextureLoader().load('img/tex/'+n+'-pc.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;};
  const hullT=tx('metal039'),hullN=tx('metal039-n');
  const wallM=new THREE.MeshStandardMaterial({color:0x4a4458,map:hullT,normalMap:hullN,roughness:.55,metalness:.6});wallM.normalScale.set(1.6,1.6);
  const seamM=new THREE.MeshStandardMaterial({color:0x0a0410,emissive:0xa860ff,emissiveIntensity:1.1});
  const DOOR_Z=-30,DW=20,DH=32;
  // the floor: dark wet metal that mirrors the light from the door
  let mirror=null;
  if(THREE.Reflector){mirror=new THREE.Reflector(new THREE.PlaneGeometry(120,120),{clipBias:.003,textureWidth:W/2,textureHeight:H/2,color:0x6a6280});mirror.rotation.x=-Math.PI/2;mirror.position.y=-.02;KS.add(mirror);}
  {const fT=tx('metal015'),fN=tx('metal015-n');fT.repeat.set(14,14);fN.repeat.set(14,14);
    const f=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:0x2a2634,map:fT,normalMap:fN,roughness:.32,metalness:.7,transparent:true,opacity:.72}));f.rotation.x=-Math.PI/2;f.receiveShadow=true;KS.add(f);}
  // the hall: two rows of great ribbed pillars leading to the door, a vault lost in the dark above
  for(const s of[-1,1])for(let i=0;i<8;i++){const z=DOOR_Z+7+i*9,x=s*(16+i*.3);
    const p=new THREE.Mesh(new THREE.BoxGeometry(2.6,60,3.2),wallM);p.position.set(x,30,z);p.castShadow=p.receiveShadow=true;KS.add(p);
    const fin=new THREE.Mesh(new THREE.BoxGeometry(.9,60,5),wallM);fin.position.set(x-s*1.4,30,z);KS.add(fin);
    const sm1=new THREE.Mesh(new THREE.BoxGeometry(.06,30,.06),seamM);sm1.position.set(x-s*1.36,15,z+1.65);KS.add(sm1);
    const rib=new THREE.Mesh(new THREE.BoxGeometry(32+i*.6,1.4,1.6),wallM);rib.position.set(0,38+i*.2,z);if(s>0)KS.add(rib);}
  for(const s of[-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(2,60,90),wallM);w.position.set(s*21,30,DOOR_Z+42);KS.add(w);}
  // the door: a frame cut into the end wall, two leaves drawn back, and what's behind it
  const doorG=new THREE.Group();doorG.position.z=DOOR_Z;KS.add(doorG);
  {const end=new THREE.Shape();end.moveTo(-60,0);end.lineTo(60,0);end.lineTo(60,90);end.lineTo(-60,90);end.lineTo(-60,0);
    const hole=new THREE.Path();hole.moveTo(-DW/2,0);hole.lineTo(DW/2,0);hole.lineTo(DW/2,DH-6);hole.lineTo(DW/2-6,DH);hole.lineTo(-DW/2+6,DH);hole.lineTo(-DW/2,DH-6);hole.lineTo(-DW/2,0);end.holes.push(hole);
    const g=new THREE.ExtrudeGeometry(end,{depth:3,bevelEnabled:false});const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/8,uv.getY(i)/8);
    const m=new THREE.Mesh(g,wallM);m.position.z=-3;m.receiveShadow=true;doorG.add(m);
    // the frame's lit edge
    const pts=[[-DW/2,0],[-DW/2,DH-6],[-DW/2+6,DH],[DW/2-6,DH],[DW/2,DH-6],[DW/2,0]];
    for(let i=0;i<pts.length-1;i++){const a=V(pts[i][0]*1.08,pts[i][1]*1.04,.15),b=V(pts[i+1][0]*1.08,pts[i+1][1]*1.04,.15),e=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,a.distanceTo(b)),seamM);e.position.copy(a).add(b).multiplyScalar(.5);e.lookAt(b.x,b.y,b.z+0);e.lookAt(b);doorG.add(e);}
    // the leaves, drawn back into the wall on both sides, glyphs glowing down their faces
    for(const s of[-1,1]){const L=new THREE.Mesh(new THREE.BoxGeometry(DW/2+.6,DH-.4,1.4),wallM);L.position.set(s*(DW*.5+DW*.3),(DH-.4)/2,-1.6);L.castShadow=true;doorG.add(L);
      for(let k=0;k<9;k++){const gl=new THREE.Mesh(new THREE.BoxGeometry(.3+hash(k+s*9)*1.4,.16,.1),seamM);gl.position.set(s*(DW*.5+DW*.3)+(hash(k*3+s)-.5)*6,2+k*3.2,-.85);doorG.add(gl);}}
    // beyond: the light the Hollow lives in
    const glowM=new THREE.ShaderMaterial({transparent:false,toneMapped:false,fog:false,uniforms:{t:{value:0}},
      vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform float t;varying vec2 vU;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}'+
        'void main(){vec2 p=vU-vec2(.5,.35);float r=length(p*vec2(1.,1.4));float sw=n(vec2(atan(p.y,p.x)*3.,r*6.-t*.6))*.5+n(p*9.+t*.2)*.5;'+
        'vec3 c=mix(vec3(.07,.02,.16),vec3(.42,.22,.8),exp(-r*3.4))*(.5+.8*sw);c+=vec3(.75,.6,1.)*exp(-r*r*140.);gl_FragColor=vec4(c,1.);}'});
    const back=new THREE.Mesh(new THREE.PlaneGeometry(60,50),glowM);back.position.set(0,20,-16);doorG.add(back);KS.userData.glowM=glowM;}
  // light: the door's violet flood behind him, a cold shaft from far above, a faint fill so the hall reads
  const kDoor=new THREE.PointLight(0xb070ff,6,120,1.3);kDoor.position.set(0,9,DOOR_Z-5);KS.add(kDoor);
  const kSpot=new THREE.SpotLight(0x9fb8ff,5,90,.32,.6,1.2);kSpot.position.set(0,70,DOOR_Z+16);kSpot.target.position.set(0,0,DOOR_Z+14);kSpot.castShadow=true;kSpot.shadow.mapSize.set(2048,2048);KS.add(kSpot,kSpot.target);
  const kRim=new THREE.DirectionalLight(0xc89cff,1.6);kRim.position.set(0,10,DOOR_Z-30);KS.add(kRim);
  KS.add(new THREE.HemisphereLight(0x3a2a60,0x05020a,.35));
  // god rays: soft cones of light out of the doorway along the floor, dust drifting in them
  const rayM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false,fog:false,uniforms:{op:{value:.5},col:{value:C(0xa870ff)}},
    vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-(modelViewMatrix*vec4(position,1.)).xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform float op;uniform vec3 col;varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){float along=clamp(vP.y,0.,1.);float edge=pow(abs(dot(vN,vV)),1.6);gl_FragColor=vec4(col*op*edge*(1.-along)*(1.-along),1.);}'});
  const RAYS=[];for(let i=0;i<5;i++){const g=new THREE.ConeGeometry(1,1,32,1,true).translate(0,-.5,0).rotateX(Math.PI);const m=new THREE.Mesh(g,rayM.clone());
    m.position.set((i-2)*3,DH*.42+(i%2)*3,DOOR_Z-1);m.rotation.x=-Math.PI/2-.14-(i%3)*.05;m.rotation.z=(i-2)*.08;m.scale.set(9+i%2*3,70,6+i%3*3);m.material.uniforms.op.value=.16;KS.add(m);RAYS.push(m);}
  // dust and ash in the light, and sparks of the Hollow coming off him
  const kDust=(()=>{const n=1400,p=new Float32Array(n*3);for(let i=0;i<n;i++){p[i*3]=(Math.random()-.5)*34;p[i*3+1]=Math.random()*30;p[i*3+2]=DOOR_Z+Math.random()*50;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const o=new THREE.Points(g,new THREE.PointsMaterial({map:GLOW,color:0xd0b8ff,size:.11,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));
    o.userData.p0=p.slice();KS.add(o);return o;})();
  const kSpark=(()=>{const n=420,p=new Float32Array(n*3);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const o=new THREE.Points(g,new THREE.PointsMaterial({map:GLOW,color:0xe8d8ff,size:.09,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));o.frustumCulled=false;KS.add(o);
    o.userData.seed=[...Array(n)].map((_,i)=>[hash(i*1.3),hash(i*2.7+1),hash(i*4.1+2),hash(i*5.9+3)]);return o;})();
  const kMist=[];for(let i=0;i<14;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,color:0x6a3ab0,transparent:true,depthWrite:false,opacity:.16,fog:false}));
    s.position.set((hash(i)-.5)*30,.8+hash(i+1)*1.5,DOOR_Z+2+hash(i+2)*36);s.scale.set(14+hash(i+3)*10,2.5,1);KS.add(s);kMist.push(s);}
  // the King himself
  let KING=null;
  loads.push(glb('chars/rigged/hollow-king').then(G=>{const o=G.scene;o.traverse(q=>{if(q.isMesh){q.castShadow=true;q.frustumCulled=false;q.material.emissive=C(0xa050ff);q.material.emissiveIntensity=.08;}});
    const b=new THREE.Box3().setFromObject(o),k=3.1/(b.max.y-b.min.y);o.scale.setScalar(k);const mx=new THREE.AnimationMixer(o),clip=G.animations.find(a=>/walk/i.test(a.name));mx.clipAction(clip).play();
    KS.add(o);KING={o,mx,dur:clip.duration};}).catch(e=>console.warn('king',e)));
  const KFX=GRADE.composer(R,KS,KC,{bloom:[.8,.55,.72],grade:{gam:1,contrast:1.14,sat:1.05,vig:.62,grain:.04,shadow:[.01,-.004,.024],high:[.03,0,.04],lift:.004}});
  function kingFrame(u,t){   // u: seconds into the shot
    KS.userData.glowM.uniforms.t.value=t;
    const walk=u*.42;   // he comes out of the light at a slow, sure pace
    if(KING){KING.o.position.set(0,0,DOOR_Z+5+walk*1.55);KING.o.rotation.y=0;KING.mx.setTime((walk*1.1)%KING.dur);}
    const kz=DOOR_Z+5+walk*1.55;
    KC.position.set(Math.sin(u*.16)*1.4-.6,1.5+u*.03,kz+15-u*.95);KC.lookAt(0,5.2+u*.1,kz-8);KC.fov=34-u*.8;KC.updateProjectionMatrix();
    {const P=kDust.geometry.attributes.position,D=kDust.userData.p0;for(let i=0;i<P.count;i++){P.setXYZ(i,D[i*3]+Math.sin(t*.3+i)*.4,(D[i*3+1]+t*.25*(.3+(i%5)*.2))%30,D[i*3+2]+Math.cos(t*.2+i*.7)*.3);}P.needsUpdate=true;}
    {const P=kSpark.geometry.attributes.position,S=kSpark.userData.seed;for(let i=0;i<P.count;i++){const s=S[i],a=(s[0]+t*(.15+s[1]*.3))%1,ang=s[2]*6.283+t*.4;
        P.setXYZ(i,Math.cos(ang)*(.4+a*1.6)*(s[3]+.3),.4+s[1]*2.6+a*2.2,kz+Math.sin(ang)*(.3+a*1.2)*.6);}P.needsUpdate=true;kSpark.material.opacity=.9;}
    for(const s of kMist){s.position.x+=0;s.material.rotation=t*.02;}
    kDoor.intensity=5+1*Math.sin(t*2.3)*Math.sin(t*3.1);
    KFX.render();}

  /* ======================= shots ======================= */
  // camera helper: from/to positions and targets over a shot, eased
  function camAt(p0,p1,t0,t1,u,fov,ease){const k=ease?ease(u):sm(0,1,u);cam.position.lerpVectors(p0,p1,k);cam.position.y=Math.max(cam.position.y,WD.H(cam.position.x,cam.position.z)+14);cam.lookAt(V().lerpVectors(t0,t1,k));if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix();}}
  const shakeV=V();function shake(a,t){shakeV.set(Math.sin(t*37)*a,Math.sin(t*41+1)*a,Math.sin(t*29+2)*a);cam.position.add(shakeV);}
  function worldState(t,o){OUT.value=o.out||0;accent.emissiveIntensity=acc0*(1-.85*(o.out||0));rim.emissiveIntensity=rim0*(1-.7*(o.out||0));
    heralds(t,!!o.heralds);beams(t,!!o.beams);fires(t,o.fire||0);army(t,!!o.army,o.armySpeed||1.4);spearFire(t,!!o.spear,o.spearT||0);
    for(const g of KEEP)g.visible=false;PREY.visible=false;for(const b of BOLTS)b.visible=false;for(const s of preyBoom)s.material.opacity=0;
    WD.TRAF.forEach((T,i)=>{if(T.fl)T.on=!o.noTraffic;});WD.drop.visible=!o.noTraffic;
    // the sky goes red over the city when the fleet is in
    WD.skyU.hor.value.setHex(0x16284c).lerp(C(0x4a1a24),o.redSky||0);scene.fog.color.copy(WD.skyU.hor.value);}
  function worldDraw(t){WD.update(t);R.shadowMap.needsUpdate=true;WD.render();}

  // the beams of the montage: from the Heralds' bellies into the districts
  const BT=WD.CITY.towers.filter(T=>Math.hypot(T.x-SP.x,T.z-SP.z)>700);
  const herBelly=(i)=>t=>HER[i].g.position.clone().add(V(0,-HER[i].len*.06,0));
  [[0,19.6,21.0,46],[1,19.75,21.2,52],[2,19.9,21.2,64],[3,20.05,21.0,38],[4,20.2,21.2,36],[0,23.9,25.1,46],[2,24.0,25.2,60],[1,24.15,25.2,50],[3,24.3,25.2,38]].forEach(([i,a,b,w],k)=>{
    const T=BT[(hash(k*5.1+2)*BT.length)|0];beam(herBelly(i),V(T.x,3+T.h*.6,T.z),a,b,w);});

  const SHOTS=[];const shot=(a,b,fn)=>SHOTS.push({a,b,fn});
  // 4.4 → 9.8 · the King
  shot(4.3,9.85,(t,u)=>kingFrame(u+.6,t));
  // 9.8 → 15.0 · Tide City from above, its lights going out; then the Spear's head, its light still burning
  shot(9.85,12.55,(t,u)=>{worldState(t,{out:sm(10.4,12.9,t)*.9,noTraffic:1});
    const a=-.55+u*.11,r=5200-u*260;cam.position.set(SP.x+Math.sin(a)*r,2300-u*120,SP.z+Math.cos(a)*r);cam.lookAt(SP.x,250,SP.z);cam.fov=38;cam.updateProjectionMatrix();worldDraw(t);});
  shot(12.55,15.05,(t,u)=>{worldState(t,{out:.9+.06*sm(12.6,14.5,t),noTraffic:1});
    camAt(V(SP.x+2300,420,SP.z+2500),V(SP.x+2050,470,SP.z+2250),V(SP.x,820,SP.z),V(SP.x,860,SP.z),u,36);WD.tip.scale.setScalar(380+60*Math.sin(t*1.6));worldDraw(t);});
  // 15.0 → 19.75 · then they came: from the water's edge, looking up past the Spear as the sky tears open
  shot(15.05,19.8,(t,u)=>{worldState(t,{out:.75,heralds:1,noTraffic:1,redSky:sm(15.5,18.5,t)*.7});
    camAt(V(SP.x+1150,30,SP.z+1900),V(SP.x+1050,40,SP.z+1760),V(SP.x-150,1350,SP.z-1400),V(SP.x-150,1480,SP.z-1400),u,50);
    const k=HER.reduce((m,S)=>Math.max(m,Math.exp(-Math.max(0,t-S.ta)*5)*(t>S.ta?1:0)),0);shake(k*4,t);worldDraw(t);});
  // montage · the beams come down on the districts
  shot(19.8,20.8,(t,u)=>{worldState(t,{out:.6,heralds:1,beams:1,fire:sm(19.8,20.4,t),redSky:.75,noTraffic:1});
    camAt(V(SP.x-2600,420,SP.z+1500),V(SP.x-2450,440,SP.z+1350),V(SP.x-400,700,SP.z-900),V(SP.x-380,760,SP.z-900),u,44);shake(3,t);worldDraw(t);});
  // the Hollow on the march over the dunes
  shot(20.8,22.35,(t,u)=>{worldState(t,{out:.6,heralds:1,fire:1,redSky:.75,army:1,armySpeed:1.6,noTraffic:1});
    const lead=MARCH0.clone().addScaledVector(MARCH_D,t*1.6);const gy=WD.H(lead.x,lead.z+0);
    cam.position.copy(lead).addScaledVector(MARCH_D,9-u*1.2).add(V(2.2,0,0));cam.position.y=WD.H(cam.position.x,cam.position.z)+1.1;
    cam.lookAt(lead.x-1,gy+2.6,lead.z+8);cam.fov=46;cam.updateProjectionMatrix();worldDraw(t);});
  // a Keeper flight through the smoke, guns on a Hollow fighter
  shot(22.35,23.35,(t,u)=>{worldState(t,{out:.6,heralds:1,fire:1,redSky:.75,noTraffic:1});
    const A=V(SP.x+2600,620,SP.z+600),B=V(SP.x-900,560,SP.z-200),d=V().subVectors(B,A).normalize(),p=V().lerpVectors(A,B,u*.4+.1);
    PREY.visible=true;const pp=p.clone().addScaledVector(d,140+u*10).add(V(Math.sin(t*5)*8,Math.sin(t*3)*5,0));PREY.position.copy(pp);PREY.lookAt(_f.copy(pp).sub(d));PREY.rotateZ(Math.sin(t*4)*.5);
    KEEP.forEach((g,k)=>{g.visible=true;const side=V(-d.z,0,d.x);const q=p.clone().addScaledVector(side,(k-1)*16).addScaledVector(d,-Math.abs(k-1)*14).add(V(0,(k===1?0:-4),0));g.position.copy(q);g.lookAt(_f.copy(q).sub(d));g.rotateZ(-.25+.1*Math.sin(t*3+k));});
    BOLTS.forEach((b,i)=>{const src=KEEP[i%3].position,ph=((t*9+i*.37)%1);b.visible=true;b.position.copy(src).addScaledVector(d,10+ph*160);b.lookAt(_f.copy(b.position).add(d));});
    const bu=sm(.72,.8,u),be=1-sm(.8,1,u);if(u>.7){PREY.visible=u<.76;preyBoom[0].position.copy(pp);preyBoom[0].scale.setScalar(60+200*bu);preyBoom[0].material.opacity=bu*be;
      preyBoom[1].position.copy(pp);preyBoom[1].scale.setScalar(120+260*bu);preyBoom[1].material.opacity=.8*bu*be;preyBoom[2].position.copy(pp);preyBoom[2].scale.setScalar(90+300*bu);preyBoom[2].material.opacity=.7*bu*be;}
    cam.position.copy(p).addScaledVector(d,-58).add(V(-d.z*26,9,d.x*26));cam.lookAt(p.clone().addScaledVector(d,90));cam.fov=56;cam.updateProjectionMatrix();shake(.8,t);worldDraw(t);});
  // the march under the fleet, the city burning ahead of them
  shot(24.1,25.0,(t,u)=>{worldState(t,{out:.55,heralds:1,beams:1,fire:1,redSky:.8,army:1,armySpeed:1.6,noTraffic:1});
    const lead=MARCH0.clone().addScaledVector(MARCH_D,t*1.6);cam.position.copy(lead).addScaledVector(MARCH_D,-48-u*3).add(V(6,0,0));cam.position.y=WD.H(cam.position.x,cam.position.z)+3.2+u*.6;
    cam.lookAt(SP.x,520,SP.z);cam.fov=48;cam.updateProjectionMatrix();worldDraw(t);});
  // the Spear answers
  shot(25.0,25.6,(t,u)=>{worldState(t,{out:.55,heralds:1,fire:1,redSky:.8,spear:1,spearT:25.12,noTraffic:1});
    camAt(V(SP.x+1500,240,SP.z+1900),V(SP.x+1460,230,SP.z+1860),V(SP.x-250,1700,SP.z-1300),V(SP.x-260,1760,SP.z-1300),u,52);shake(sm(25.1,25.2,t)*6,t);worldDraw(t);});
  // the White City through the ring, then its dome (js/trailer/whitecity.js)
  const WCT=WCITY(R);
  shot(26.75,30.0,(t,u)=>WCT.render(t,0,u));
  shot(30.0,35.9,(t,u)=>WCT.render(t,1,u));
  // the logo and end card: the Spear at night as the menu shows it, slow
  shot(39.4,50.1,(t,u)=>{worldState(t,{out:0});const k=(t-39.4)/10.7;
    camAt(V(-560,50,560),V(-470,64,480),V(-60,720,-2600),V(-40,760,-2600),k,40,x=>x);worldDraw(t);});

  /* ======================= overlays (DOM) ======================= */
  const ov=$('ov');
  function el(html,cls){const d=document.createElement('div');d.className=cls||'';d.innerHTML=html;ov.appendChild(d);return d;}
  const TX=el('<div class="tl"></div><div class="tl2"></div><canvas width="640" height="90"></canvas><div class="cur"></div>','layer tx'),
    TXl=TX.querySelector('.tl'),TXl2=TX.querySelector('.tl2'),TXc=TX.querySelector('canvas'),TXcx=TXc.getContext('2d');
  const SUB=el('<span></span>','layer sub'),SUBs=SUB.querySelector('span');
  const CARD=el('<h2></h2><i></i>','layer card'),CARDh=CARD.querySelector('h2'),CARDi=CARD.querySelector('i');
  const WHISPER=el('DON&#8217;T LET IT IN','layer wh');
  const LOGO=el('<h1>ELYRA</h1><div class="lsub">THE HOLLOW</div>','layer logo'),LOGOh=LOGO.querySelector('h1');
  const END=el('<div class="eline">PATHFINDER<b></b>LAST TRANSMISSION</div><div class="edev">IN DEVELOPMENT</div><div class="eurl">ELYRATHEHOLLOW.COM</div>','layer end');
  const RING=el('','layer ring');
  const VEIN=el('<canvas width="1920" height="1080"></canvas>','layer'),VC=VEIN.querySelector('canvas').getContext('2d');
  const FLASH=el('','layer flash'),BARS=el('<i></i><i></i><i></i><i></i>','layer bars'),BLACK=el('','layer black');
  const LINES=[[5.9,9.45,'THE DOOR WAS NEVER MEANT TO OPEN'],[10.45,12.4,'ONE BY ONE, WE ARE LOSING OURSELVES'],[12.85,14.85,'ONE LIGHT STILL BURNS'],
    [17.05,19.45,'THEN THEY CAME'],[27.5,29.85,'SOMEONE WAS HERE BEFORE US']];
  const CARDS=[[23.35,24.12,'THE LAST OUTPOST'],[25.55,26.5,'HOLDS THE LINE']];
  // the corruption's veins for "don't let it in": seeded branching paths in from the frame's edges, drawn as far as t allows
  const VEINS=[];{let s=99;const r=()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};
    function grow(x,y,a,len,w,t0,depth){const pts=[[x,y]];for(let i=0;i<len;i++){a+=(r()-.5)*.7;x+=Math.cos(a)*14;y+=Math.sin(a)*14;pts.push([x,y]);
        if(depth<3&&r()<.06)grow(x,y,a+(r()-.5)*1.8,(len-i)*.6|0,w*.6,t0+i*.025,depth+1);}VEINS.push({pts,w,t0});}
    for(let i=0;i<14;i++){const e=i%4,u=r();const x=e===0?0:e===1?1920:u*1920,y=e===2?0:e===3?1080:u*1080;const a=Math.atan2(540-y,960-x)+(r()-.5)*.8;grow(x,y,a,40+r()*30|0,5+r()*4,i*.12,0);}}
  function drawVeins(k,t){VC.clearRect(0,0,1920,1080);if(k<=0)return;VC.lineCap='round';
    for(const v of VEINS){const n=Math.floor(cl((k*3.2-v.t0)/1.6,0,1)*v.pts.length);if(n<2)continue;
      for(const [col,wk,al] of[['rgba(140,60,255,',3.2,.10],['rgba(170,90,255,',1.4,.35],['rgba(235,215,255,',.45,.8]]){VC.beginPath();VC.moveTo(v.pts[0][0],v.pts[0][1]);for(let i=1;i<n;i++)VC.lineTo(v.pts[i][0],v.pts[i][1]);
        VC.strokeStyle=col+(al*(.75+.25*Math.sin(t*14+v.t0*9)))+')';VC.lineWidth=v.w*wk;VC.stroke();}}}
  function typed(s,a,b,t){const n=Math.floor(cl((t-a)/(b-a),0,1)*s.length);return s.slice(0,n);}
  function overlays(t){
    // transmission
    const txOn=t<4.45;TX.style.opacity=txOn?(t<.15?t/.15:1):0;
    if(txOn){TXl.textContent=typed('// INCOMING TRANSMISSION',.25,1.15,t);TXl2.textContent=typed('SOURCE: UNKNOWN  ·  SIGNAL 1 OF ?',1.45,2.55,t);
      TX.querySelector('.cur').style.opacity=Math.floor(t*3.3)%2?1:0;
      TXcx.clearRect(0,0,640,90);TXcx.strokeStyle='rgba(120,220,255,.85)';TXcx.lineWidth=1.6;TXcx.beginPath();const amp=sm(.9,2.8,t)*(t>3.6?2.4:1);
      for(let x=0;x<640;x++){const q=x/640,env=Math.sin(q*Math.PI),y=45+env*amp*(Math.sin(q*41+t*9)*9+Math.sin(q*13-t*4)*7+(hash(Math.floor(q*120)+Math.floor(t*24)*7)-.5)*10*sm(2.4,3.6,t));x?TXcx.lineTo(x,y):TXcx.moveTo(x,y);}TXcx.stroke();
      const gl=sm(3.55,3.7,t)*(1-sm(4.25,4.45,t));TX.style.transform=`translateX(${gl*(hash(Math.floor(t*30))-.5)*40}px)`;TX.style.filter=gl?`drop-shadow(${gl*6}px 0 0 rgba(255,40,60,.8)) drop-shadow(${-gl*6}px 0 0 rgba(40,200,255,.8))`:'none';}
    // the red interference bars as the signal breaks up
    const bk=sm(3.55,3.65,t)*(1-sm(4.3,4.45,t));BARS.style.opacity=bk;[...BARS.children].forEach((b,i)=>{b.style.top=(8+hash(i*7+Math.floor(t*20))*80)+'%';b.style.height=(2+hash(i*3+Math.floor(t*20))*9)+'px';});
    // subtitles
    let line=null;for(const L of LINES)if(t>=L[0]&&t<=L[1])line=L;
    if(line){const a=sm(line[0],line[0]+.5,t)*(1-sm(line[1]-.45,line[1],t));SUBs.textContent=line[2];SUB.style.opacity=a;SUBs.style.letterSpacing=(.42+.06*(1-sm(line[0],line[1],t)))+'em';SUBs.style.filter=`blur(${(1-sm(line[0],line[0]+.5,t))*6}px)`;}else SUB.style.opacity=0;
    // title cards
    let cd=null;for(const L of CARDS)if(t>=L[0]&&t<=L[1])cd=L;
    if(cd){const a=sm(cd[0],cd[0]+.12,t)*(1-sm(cd[1]-.12,cd[1],t));CARD.style.opacity=a;CARDh.textContent=cd[2];CARDh.style.transform=`scale(${1.06-.06*eo((t-cd[0])/(cd[1]-cd[0]))})`;
      CARDi.style.transform=`scaleX(${eo((t-cd[0]-.05)/.5)})`;}else CARD.style.opacity=0;
    // the White City, seen through the ring, then the dome (frames from the level)
    const rg=t>=26.75&&t<30.15;RING.style.opacity=rg?sm(26.75,27.3,t)*(1-sm(29.9,30.15,t)):0;if(rg)RING.style.transform=`translate(-50%,-50%) scale(${.62+.25*eo((t-26.75)/3.2)})`;
    // don't let it in
    const vk=sm(36.1,39.3,t)*(1-sm(39.35,39.55,t));drawVeins(t>36&&t<39.6?sm(36.1,39.3,t):0,t);VEIN.style.opacity=t>36&&t<39.6?1:0;
    const wh=sm(37.35,37.9,t)*(1-sm(39.2,39.45,t));WHISPER.style.opacity=wh*(.82+.18*Math.sin(t*23)*Math.sin(t*7));WHISPER.style.letterSpacing=(.5+.15*sm(37.3,39.4,t))+'em';
    WHISPER.style.textShadow=`${2+3*hash(Math.floor(t*24))}px 0 rgba(255,40,80,.55),-${2+3*hash(Math.floor(t*24)+3)}px 0 rgba(80,160,255,.55),0 0 24px rgba(160,80,255,.6)`;
    // the logo: tears in through the signal's noise, settles, a light runs across the metal
    const lg=t>=39.45&&t<45.1;LOGO.style.opacity=lg?Math.min(1,sm(39.45,39.6,t)*(1-sm(44.7,45.05,t))):0;
    if(lg){const g=1-sm(39.5,40.5,t),j=Math.floor(t*30);LOGO.style.transform=`translate(-50%,-50%) translateX(${g*(hash(j)-.5)*70}px) scale(${1.04-.04*eo((t-39.45)/5.5)})`;
      LOGO.style.filter=g>.02?`drop-shadow(${g*14}px 0 0 rgba(255,50,90,.7)) drop-shadow(${-g*14}px 0 0 rgba(60,200,255,.7)) blur(${g*1.5}px)`:'none';
      LOGOh.style.setProperty('--sw',(sm(40.6,42.6,t)*160-30)+'%');LOGO.style.clipPath=g>.02?`inset(${hash(j+1)*30*g}% 0 ${hash(j+2)*30*g}% 0)`:'none';}
    const en=t>=45.0;END.style.opacity=en?sm(45.0,45.7,t)*(1-sm(49.2,49.95,t)):0;
    // flashes and cuts to black
    let fl=0;fl=Math.max(fl,1-sm(4.3,4.75,t)>0&&t>4.25?1-sm(4.3,4.75,t):0);fl=Math.max(fl,t>20.72&&t<21.1?1-sm(20.74,21.05,t):0);
    fl=Math.max(fl,t>26.4&&t<27.4?sm(26.4,26.55,t)*(1-sm(26.65,27.35,t)):0);fl=Math.max(fl,t>39.45&&t<39.9?1-sm(39.47,39.85,t):0);
    fl=Math.max(fl,t>15.5&&t<18?HER.reduce((m,S)=>Math.max(m,t>S.ta?Math.exp(-(t-S.ta)*9)*.35:0),0):0);
    fl=Math.max(fl,t>25.1&&t<25.5?.3*(1-sm(25.12,25.4,t)):0);
    FLASH.style.opacity=fl;
    // black: the transmission, dips between shots, the cards, don't let it in, the very end
    let bl=0;if(t<4.4)bl=1;if(t>9.62&&t<10.05)bl=Math.max(bl,1-Math.abs(t-9.84)/.21);if(t>14.85&&t<15.35)bl=Math.max(bl,1-Math.abs(t-15.08)/.25);
    if(t>19.62&&t<19.95)bl=Math.max(bl,1-Math.abs(t-19.8)/.17);
    if(t>23.3&&t<24.15)bl=1;if(t>25.55&&t<26.42)bl=1;if(t>35.0&&t<35.9)bl=Math.max(bl,sm(35.0,35.85,t));if(t>35.85&&t<39.47)bl=1;if(t>49.9)bl=1;
    BLACK.style.opacity=cl(bl,0,1);}

  /* ======================= the clock ======================= */
  function frame(t){overlays(t);const S=SHOTS.find(s=>t>=s.a&&t<s.b);
    if(S)S.fn(t,(t-S.a)/(S.b-S.a));else{R.setRenderTarget(null);R.setClearColor(0x000000);R.clear();}
    return true;}
  window.TRAILER={ready:false,frame,SHOTS,WD,HER};
  Promise.all(loads).then(()=>MODELS.idle(20000)).then(()=>{
    // warm every shot once so the first real frame of each isn't the one that compiles its shaders
    for(const s of SHOTS)s.fn((s.a+s.b)/2,.5);
    setTimeout(()=>{window.TRAILER.ready=true;},300);});
})();
