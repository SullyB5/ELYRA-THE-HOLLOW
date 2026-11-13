/* ELYRA: The Hollow · "Believe" (Nov 13 2026, Bryce: a short clip like Halo 3's, "short and sweet": one Keeper jumping into the fight,
   throwing up a shield, killing a Hollow heavy, and one word, BELIEVE). Not part of the game: trailer-believe.html drives it and
   tools/trailer/drive.py records it (see tools/trailer/ACTION.md). Built on the action trailer's world and effects (js/trailer/action.js,
   copied in, with the capital ship left in the sky). Music: Epic Hybrid (tools/trailer/hybrid.py), cut by tools/trailer/mix.py.

   0.9–2.75   the dropship over the burning dunes       2.75–5.6   Michael drops, jets, lands on one knee
   5.6–7.85   the run at the Hollow line under fire       7.85–10.25 the shield goes up and takes their fire
   10.25–13.45 the Hollow heavy charges; the kill in slow motion (on the music's first big hit, 11.8)
   13.45–15.6 the dome dies; the camera rises to the Spear   15.95–19  BELIEVE, in the music's silence
   19.1–21.95 the squad on the ridge                        22–24.6   the logo, the site */
(()=>{
  let _s=77031;Math.random=()=>{_s=(_s*16807)%2147483647;return(_s-1)/2147483646;};
  const W=1920,H=1080,$=id=>document.getElementById(id);
  const R=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true,preserveDrawingBuffer:true});
  R.setPixelRatio(1);R.setSize(W,H,false);R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;
  R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;window.ELYRA_RENDERER=R;
  const WD=WORLD(R),{scene,cam,V,C,SP,GLOW,PUFF}=WD;cam.aspect=W/H;cam.near=.3;cam.updateProjectionMatrix();
  const GH=(x,z)=>WD.H(x,z);
  const cl=(x,a,b)=>Math.max(a,Math.min(b,x)),sm=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);},lerp=(a,b,k)=>a+(b-a)*k;
  const eo=x=>1-Math.pow(1-cl(x,0,1),3),ei=x=>Math.pow(cl(x,0,1),3);
  const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const add=(c,sc,op,p)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:c,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false,opacity:op==null?1:op,fog:false}));s.scale.setScalar(sc);if(p)s.position.copy(p);return s;};
  const puff=(c)=>new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF,color:c,transparent:true,depthWrite:false,opacity:0}));
  const glbL=new THREE.GLTFLoader();glbL.setMeshoptDecoder(MeshoptDecoder);
  const glb=n=>MeshoptDecoder.ready.then(()=>new Promise((ok,no)=>glbL.load('models/pc/'+n+'.glb',ok,undefined,()=>glbL.load('models/'+n+'.glb',ok,undefined,no))));
  const loads=[],_f=V(),_g=V();
  const GU=WD.FX&&WD.FX.grade&&WD.FX.grade.uniforms;const sat0=GU?GU.sat.value:1,con0=GU?GU.contrast.value:1;

  /* ======================= the war over the city (always there) ======================= */
  // the city half dark, burning; the sky red with the Heralds' fleet
  const OUT={value:.45},SPU={value:SP.clone()};
  {const tm=WD.CITY.mats.towerMat,ob=tm.onBeforeCompile;
    tm.onBeforeCompile=sh=>{ob(sh);sh.uniforms.uOut=OUT;sh.uniforms.uSP=SPU;
      sh.fragmentShader='uniform float uOut;uniform vec3 uSP;\n'+sh.fragmentShader.replace(/totalEmissiveRadiance\+=winGlow\*([0-9.]+);/,(m,g)=>
        `{float dd=clamp(length(vWP.xz-uSP.xz)/3000.,0.,1.);float k=fract(sin(dot(floor(vWP.xz/38.)+floor(vWP.y/30.)*.37,vec2(12.9898,78.233)))*43758.5453);
          float alive=smoothstep(uOut-.02,uOut+.02,1.03-dd*.62-k*.38);totalEmissiveRadiance+=winGlow*${g}*alive;}`);};
    tm.customProgramCacheKey=()=>'tower-action';tm.needsUpdate=true;}
  WD.TRAF.forEach(T=>{if(T.g){T.g.visible=false;T.f=()=>[V(0,-9e4,0),V(1,0,0)];}if(T.fl)T.on=false;});WD.drop.visible=false;
  const RED=0xff3a24;
  // the Herald ships holding over the city. HER[0] is the capital ship the Keepers bring down at the end
  const HER=[{p:V(-2300,1650,-4300),len:2400,d:V(.35,-.02,1)},{p:V(1900,2500,-5200),len:1700,d:V(-.3,-.05,1)},{p:V(300,3300,-6900),len:2300,d:V(0,-.04,1)},
    {p:V(-4200,2100,-6200),len:1300,d:V(.45,0,1)},{p:V(4100,1900,-3900),len:1100,d:V(-.5,0,1)}];
  for(const S of HER){S.d.normalize();S.g=WD.ship('harrower',S.len,{});scene.add(S.g);
    S.eng=add(0xff5a3a,S.len*.4,.9);S.eng.position.z=S.len*.5;S.g.add(S.eng);
    for(let i=0;i<7;i++){const s=add(RED,S.len*(.05+.05*hash(i+S.len)),.7);s.position.set((hash(i*3+S.len)-.5)*S.len*.18,-S.len*.05,(i/6-.5)*S.len*.8);S.g.add(s);}}
  const CAP=HER[0];
  // the capital ship's death: hits along its hull from 17.65, listing from 18.6, nose down into the sea, the sea hit at 21.3
  const CAP_FALL0=1e4,CAP_HIT=1e4+3;
  function capPose(t){const u=cl((t-CAP_FALL0)/(CAP_HIT-CAP_FALL0),0,1),k=ei(u)*.85+u*.15;
    const p=CAP.p.clone().addScaledVector(CAP.d,t*2);p.y=lerp(CAP.p.y,-260,k);p.x+=k*500;p.z+=k*700;
    CAP.g.position.copy(p);CAP.g.lookAt(_f.copy(p).sub(CAP.d));CAP.g.rotateX(-.55*sm(0,1,u));CAP.g.rotateZ(.25*sm(0,1,u));return p;}
  function heralds(t){for(const S of HER){if(S===CAP)continue;const p=S.p.clone().addScaledVector(S.d,t*3);S.g.position.copy(p);S.g.lookAt(_f.copy(p).sub(S.d));S.eng.material.opacity=.7+.2*Math.sin(t*9+S.len);}
    CAP.g.visible=t<CAP_HIT+.1;capPose(t);}

  // beams from the Herald bellies into the districts
  const beamM=()=>new THREE.MeshBasicMaterial({color:0xff4a2a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false});
  const unitCyl=new THREE.CylinderGeometry(1,1,1,12,1,true).translate(0,.5,0).rotateX(Math.PI/2);
  const BEAMS=[];
  function beam(from,to,t0,t1,w){const g=new THREE.Group(),o=new THREE.Mesh(unitCyl,beamM()),c=new THREE.Mesh(unitCyl,beamM());c.material.color.set(0xfff0e0);g.add(o,c);
    const hit=add(0xff7a3a,w*14,0),hot=add(0xffffff,w*5,0);scene.add(g,hit,hot);const B={g,o,c,hit,hot,from,to,t0,t1,w};BEAMS.push(B);return B;}
  function beams(t){for(const B of BEAMS){const live=t>B.t0&&t<B.t1;B.g.visible=B.hit.visible=B.hot.visible=live;if(!live)continue;
    const f=typeof B.from==='function'?B.from(t):B.from,to=typeof B.to==='function'?B.to(t):B.to,u=t-B.t0,k=sm(0,.1,u)*(1-sm(B.t1-.12-B.t0,B.t1-B.t0,u)),pulse=.8+.2*Math.sin(t*60+B.w);
    const len=f.distanceTo(to),grow=Math.min(1,u/.07);B.g.position.copy(f);B.g.lookAt(to);
    B.o.scale.set(B.w*pulse,B.w*pulse,len*grow);B.c.scale.set(B.w*.32,B.w*.32,len*grow);B.o.material.opacity=.55*k;B.c.material.opacity=.95*k;
    B.hit.position.copy(to);B.hit.material.opacity=k*grow*.9;B.hit.scale.setScalar(B.w*(16+8*Math.sin(t*31)));B.hot.position.copy(to);B.hot.material.opacity=k*grow;}}
  const belly=i=>()=>HER[i].g.position.clone().add(V(0,-HER[i].len*.06,0));
  const BT=WD.CITY.towers.filter(T=>Math.hypot(T.x-SP.x,T.z-SP.z)>700);
  const towerAt=k=>{const T=BT[(hash(k*5.1+2)*BT.length)|0];return V(T.x,3+T.h*.6,T.z);};

  // fires and smoke over the districts
  const FIRE=[],SMK=[];
  {const tw=WD.CITY.towers.filter(T=>Math.hypot(T.x-SP.x,T.z-SP.z)>450);
    for(let i=0;i<54;i++){const T=tw[(hash(i*7.3)*tw.length)|0];if(!T)continue;const y=3+T.h*(.35+.6*hash(i));const p=V(T.x+(hash(i+2)-.5)*T.fp,y,T.z+(hash(i+5)-.5)*T.fp);
      const a=add(0xff6a20,1,0,p),b=add(0xffc070,1,0,p),c=add(0xff5010,1,0,p);scene.add(a,b,c);FIRE.push({p,a,b,c,s:30+hash(i+9)*70,ph:hash(i)*20});
      if(i%2===0)for(let j=0;j<6;j++){const s=puff(0x2a2228);scene.add(s);SMK.push({s,p,j,ph:hash(i*3+j)});}}}
  const cityFireL=new THREE.PointLight(0xff6a30,2.2,6000,1.3);cityFireL.position.set(SP.x+300,500,SP.z+900);scene.add(cityFireL);
  function fires(t){for(const F of FIRE){const k=.75+.25*Math.sin(t*9+F.ph)*Math.sin(t*5.1+F.ph*2);
      F.a.scale.set(F.s*1.4*k,F.s*2*k,1);F.a.position.copy(F.p).setY(F.p.y+F.s*.5);F.a.material.opacity=.85;
      F.b.scale.set(F.s*.7*k,F.s*1.1*k,1);F.b.position.copy(F.p).setY(F.p.y+F.s*.3);F.b.material.opacity=.9;
      F.c.scale.setScalar(F.s*5);F.c.material.opacity=.18*k;}
    for(const S of SMK){const u=((S.ph+t*.05+S.j/6)%1);S.s.position.set(S.p.x+u*u*500,S.p.y+40+u*900,S.p.z-u*200);S.s.scale.setScalar(80+u*500);S.s.material.opacity=Math.sin(u*Math.PI)*.5;}}

  /* ======================= effects: explosions, bolts, missiles, muzzle flashes ======================= */
  // every effect is scheduled on a clock (tau): normal shots run tau = t, the slow-motion shot runs its own slow tau
  const BOOMS=[];
  const sparkM=new THREE.PointsMaterial({map:GLOW,color:0xffc890,size:1,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,fog:false});
  function boom(p,t0,s,o){o=o||{};const B={p:p.clone(),t0,s,life:o.life||3.4,sm:[],o};
    const col=o.purple?0xb070ff:0xff7a30,col2=o.purple?0x7a3aff:0xff4a10,hot=o.purple?0xf0e0ff:0xfff2d0;
    B.core=add(hot,1,0);B.f1=add(col,1,0);B.f2=add(col2,1,0);B.halo=add(col,1,0);B.f3=add(0xffb060,1,0);scene.add(B.core,B.f1,B.f2,B.halo,B.f3);
    const ns=o.smoke==null?7:o.smoke;for(let i=0;i<ns;i++){const s=puff(o.water?0xb8c4d8:o.dust?0x5a4c40:0x1e1a1e);scene.add(s);B.sm.push({s,a:hash(i+t0*7)*6.283,r:.3+hash(i*3+t0)*.8,v:.6+hash(i*5+t0)*.8});}
    const n=o.sparks==null?36:o.sparks;if(n){const P=new Float32Array(n*3),D=[];for(let i=0;i<n;i++){const a=hash(i*1.7+t0)*6.283,e=.2+hash(i*2.3+t0)*1.2;D.push(V(Math.cos(a)*Math.cos(e),Math.sin(e),Math.sin(a)*Math.cos(e)).multiplyScalar(s*(1.4+hash(i*4.1+t0)*2.6)));}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));const m=sparkM.clone();m.size=Math.max(.25,s*.09);m.color.set(o.purple?0xe0c0ff:0xffc890);
      B.sp=new THREE.Points(g,m);B.sp.frustumCulled=false;B.D=D;scene.add(B.sp);}
    BOOMS.push(B);return B;}
  const BL=[];for(let i=0;i<6;i++){const l=new THREE.PointLight(0xff8a40,0,100,1.6);scene.add(l);BL.push(l);}
  function booms(tau){const act=[];
    for(const B of BOOMS){const u=tau-B.t0,on=u>=0&&u<B.life,s=B.s;
      B.core.visible=B.f1.visible=B.f2.visible=B.halo.visible=B.f3.visible=on;for(const q of B.sm)q.s.visible=on;if(B.sp)B.sp.visible=on;if(!on)continue;
      const up=V(0,1,0);
      B.core.position.copy(B.p);B.core.scale.setScalar(s*(.8+2.6*eo(u/.1)));B.core.material.opacity=Math.exp(-u*12);
      B.f1.position.copy(B.p).addScaledVector(up,s*.5*eo(u/.8));B.f1.scale.setScalar(s*(1.2+2.8*eo(u/.45)));B.f1.material.opacity=(1-sm(.12,.95,u))*.95;
      B.f3.position.copy(B.p).addScaledVector(up,s*.9*eo(u/.9)).add(V(s*.4,0,0));B.f3.scale.setScalar(s*(.8+2.2*eo(u/.5)));B.f3.material.opacity=(1-sm(.1,.7,u))*.9;
      B.f2.position.copy(B.p).addScaledVector(up,s*.3);B.f2.scale.setScalar(s*(1.8+2.6*eo(u/.7)));B.f2.material.opacity=(1-sm(.2,1.4,u))*.75;
      B.halo.position.copy(B.p);B.halo.scale.setScalar(s*(B.o.halo||10)*(.6+.4*eo(u/.3)));B.halo.material.opacity=.45*Math.exp(-u*3);
      for(const q of B.sm){const k=eo(u/1.8);q.s.position.set(B.p.x+Math.cos(q.a)*q.r*s*1.8*k,B.p.y+s*(.4+u*1.1*q.v),B.p.z+Math.sin(q.a)*q.r*s*1.8*k);
        q.s.scale.setScalar(s*(1.4+3.2*eo(u/2.2)));q.s.material.opacity=sm(.04,.35,u)*(1-sm(B.life*.45,B.life,u))*(B.o.water?.85:.75);}
      if(B.sp){const P=B.sp.geometry.attributes.position;for(let i=0;i<P.count;i++){const d=B.D[i];P.setXYZ(i,B.p.x+d.x*u,B.p.y+d.y*u-4.9*u*u*(s>20?.2:1),B.p.z+d.z*u);}P.needsUpdate=true;B.sp.material.opacity=1-sm(.25,1.1,u);}
      if(B.o.nofire){B.core.visible=B.f1.visible=B.f2.visible=B.f3.visible=B.halo.visible=false;}
      act.push({B,k:s*Math.exp(-u*3.2)});}
    act.sort((a,b)=>b.k-a.k);
    BL.forEach((l,i)=>{const A=act[i];if(!A){l.intensity=0;return;}const u=tau-A.B.t0;l.color.set(A.B.o.purple?0xb070ff:0xff8a40);
      l.position.copy(A.B.p).add(V(0,A.B.s*.8,0));l.distance=A.B.s*(A.B.o.reach||22);l.intensity=(A.B.o.bright||5)*Math.exp(-u*2.6)*(.85+.15*Math.sin(u*40));});}

  // bolts: a streak of light from a to b at speed sp (m/s), launched at t0; o.hit puts a small burst where it lands
  const BOLTS=[],unitBox=new THREE.BoxGeometry(1,1,1);
  function bolt(a,b,t0,o){o=o||{};const col=o.col||0x9fe8ff;
    const m=new THREE.Mesh(unitBox,new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false}));
    const h=add(col,(o.w||.4)*7,.85);scene.add(m,h);m.visible=h.visible=false;
    const B={a:a.clone(),b:b.clone(),t0,sp:o.sp||380,len:o.len||12,w:o.w||.35,m,h,dist:a.distanceTo(b)};
    if(o.hit)boom(B.b,t0+B.dist/B.sp,o.hit,{sparks:16,smoke:o.hitSmoke||1,life:.9,purple:o.purple,bright:2,reach:14,halo:3});
    BOLTS.push(B);return B;}
  function bolts(tau){for(const B of BOLTS){const d=(tau-B.t0)*B.sp,on=d>0&&d<B.dist+B.len;B.m.visible=B.h.visible=on;if(!on)continue;
    const f=Math.min(d,B.dist),bk=Math.max(0,d-B.len),dir=_f.subVectors(B.b,B.a).normalize();
    B.m.position.copy(B.a).addScaledVector(dir,(f+bk)/2);B.m.lookAt(_g.copy(B.b));B.m.scale.set(B.w,B.w,Math.max(.01,f-bk));
    B.h.visible=d<B.dist;B.h.position.copy(B.a).addScaledVector(dir,f);}}
  // a stream of bolts from fa to fb (functions of tau or vectors), jittered, between t0 and t1 at rate per second
  const fnv=v=>typeof v==='function'?v:()=>v;
  function stream(fa,fb,t0,t1,rate,o){o=o||{};const A=fnv(fa),B=fnv(fb),n=Math.floor((t1-t0)*rate);
    for(let i=0;i<n;i++){const t=t0+i/rate+(hash(i*9.1+t0)-.5)*.4/rate,j=o.jit||0;
      const b=B(t).clone().add(V((hash(i+t0*3)-.5)*j,(hash(i*2+t0)-.5)*j,(hash(i*3+t0*5)-.5)*j));bolt(A(t),b,t,o);}}

  // missiles: an arcing run from a to b over dur seconds, a smoke trail behind, a blast on arrival
  const MISS=[];
  function missile(a,b,t0,dur,o){o=o||{};const M={a:a.clone(),b:b.clone(),t0,dur,arc:o.arc==null?a.distanceTo(b)*.08:o.arc,wob:o.wob==null?2:o.wob,seed:hash(t0*13+a.x),tr:[]};
    M.body=add(0xffffff,o.size?o.size*.35:2.2,1);M.fl=add(0xffa050,o.size||6,.9);scene.add(M.body,M.fl);
    for(let i=0;i<22;i++){const s=puff(0x8a8a90);scene.add(s);M.tr.push(s);}
    if(o.boom!==0)boom(b,t0+dur,o.boom||10,{sparks:30,smoke:5,life:2.4,bright:6});
    MISS.push(M);return M;}
  function mpos(M,k){const p=V().lerpVectors(M.a,M.b,k);p.y+=Math.sin(k*Math.PI)*M.arc;const side=V(-(M.b.z-M.a.z),0,M.b.x-M.a.x).normalize();
    p.addScaledVector(side,Math.sin(k*11+M.seed*20)*M.wob*(1-k));p.y+=Math.cos(k*9+M.seed*30)*M.wob*.6*(1-k);return p;}
  function missiles(tau){for(const M of MISS){const u=tau-M.t0,k=u/M.dur,fly=u>0&&k<1,any=u>0&&u<M.dur+2;M.body.visible=M.fl.visible=fly;
    if(fly){const p=mpos(M,k);M.body.position.copy(p);M.fl.position.copy(p);M.fl.material.opacity=.7+.3*Math.sin(u*90);}
    M.tr.forEach((s,i)=>{const q=i/M.tr.length;s.visible=any&&u>0&&cl(k,0,1)>q;if(!s.visible)return;const age=(cl(k,0,1)-q)*M.dur+Math.max(0,u-M.dur);
      s.position.copy(mpos(M,q));s.scale.setScalar(1.5+age*7);s.material.opacity=.26*Math.exp(-age*1.1);});}}

  // muzzle flashes: a flickering burst at pos(tau) between t0 and t1, rate shots a second
  const FLASHES=[];
  function muzzle(pos,t0,t1,rate,o){o=o||{};const s=add(o.col||0xffd28a,o.size||1.6,1),s2=add(0xffffff,(o.size||1.6)*.4,1);scene.add(s,s2);
    const L=o.light?new THREE.PointLight(o.col||0xffc070,0,o.light,1.8):null;if(L)scene.add(L);
    const M={pos,t0,t1,rate,s,s2,L,o};FLASHES.push(M);return M;}
  function flashes(tau){for(const M of FLASHES){const on=tau>=M.t0&&tau<M.t1;let lit=false;
    if(on){const ph=((tau-M.t0)*M.rate)%1,n=Math.floor((tau-M.t0)*M.rate);lit=ph<.5;if(lit){const p=M.pos(tau);const k=(.6+.8*hash(n+M.t0))*(1-ph*1.4);
      M.s.position.copy(p);M.s2.position.copy(p);M.s.scale.setScalar((M.o.size||1.6)*k*1.4);M.s2.scale.setScalar((M.o.size||1.6)*.5*k);
      if(M.L){M.L.position.copy(p);M.L.intensity=(M.o.li||3)*k;}}}
    M.s.visible=M.s2.visible=lit;if(M.L&&!lit)M.L.intensity=0;}}

  // embers and ash drifting through the air near the camera
  const EMB=(()=>{const n=700,p=new Float32Array(n*3),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const o=new THREE.Points(g,new THREE.PointsMaterial({map:GLOW,color:0xffa060,size:.22,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    o.frustumCulled=false;o.userData.s=[...Array(n)].map((_,i)=>[hash(i*1.3),hash(i*2.1+1),hash(i*3.7+2),hash(i*5.3+3)]);scene.add(o);return o;})();
  function embers(tau,at,size,amt){EMB.visible=amt>0;if(!amt)return;const P=EMB.geometry.attributes.position,S=EMB.userData.s;
    for(let i=0;i<P.count;i++){const s=S[i];if(s[3]>amt){P.setXYZ(i,0,-9999,0);continue;}const y=((s[1]*size+tau*(1.2+s[2]*2.4))%size+size)%size;
      P.setXYZ(i,at.x+(s[0]-.5)*size*2+Math.sin(tau*.9+i)*1.5,at.y-size*.3+y,at.z+(s[2]-.5)*size*2+Math.cos(tau*.7+i*1.3)*1.5);}P.needsUpdate=true;}
  // smoke drifting low over the ground (ground shots)
  const HAZE=[];for(let i=0;i<26;i++){const s=puff(0x3a3036);s.material.opacity=0;scene.add(s);HAZE.push({s,a:hash(i*3.3),b:hash(i*7.7),c:hash(i*1.9)});}
  function haze(tau,at,r,op,col){for(const Hz of HAZE){Hz.s.visible=op>0;if(!op)continue;const x=at.x+(Hz.a-.5)*r*2+tau*3*(Hz.c+.3),z=at.z+(Hz.b-.5)*r*2;
    Hz.s.position.set(x,GH(x,z)+2+Hz.c*6,z);Hz.s.scale.set(18+Hz.c*30,8+Hz.a*8,1);Hz.s.material.opacity=op*(.35+.4*Hz.c);if(col)Hz.s.material.color.set(col);}}
  // ground fires (the battlefield on the dunes)
  const GF=[];for(let i=0;i<14;i++){const a=add(0xff6a20,1,0),b=add(0xffc070,1,0),c=add(0xff5010,1,0);scene.add(a,b,c);GF.push({a,b,c,ph:hash(i)*9});}
  const gfL=new THREE.PointLight(0xff7a30,0,140,1.5);scene.add(gfL);
  function groundFires(tau,list){GF.forEach((F,i)=>{const P=list&&list[i];F.a.visible=F.b.visible=F.c.visible=!!P;if(!P)return;
      const k=.75+.25*Math.sin(tau*9+F.ph)*Math.sin(tau*5.3+F.ph*2),s=P[3]||5,y=GH(P[0],P[2])+(P[1]||0);
      F.a.position.set(P[0],y+s*.6,P[2]);F.a.scale.set(s*1.3*k,s*1.9*k,1);F.a.material.opacity=.9;F.b.position.set(P[0],y+s*.35,P[2]);F.b.scale.set(s*.7,s*1.1*k,1);F.b.material.opacity=.9;
      F.c.position.set(P[0],y+s,P[2]);F.c.scale.setScalar(s*8);F.c.material.opacity=.22*k;});
    if(list&&list.L){gfL.position.copy(list.L);gfL.intensity=(list.Li||3)*(.85+.15*Math.sin(tau*13)*Math.sin(tau*5));gfL.distance=list.Ld||140;}else gfL.intensity=0;}

  /* ======================= actors ======================= */
  const SKU=THREE.SkeletonUtils,RIG={};const rigged=n=>RIG[n]||(RIG[n]=glb('chars/rigged/'+n));
  const ACT=[];
  function human(name,h,o){o=o||{};const A={g:new THREE.Group(),mx:null,acts:{},dur:{},h};A.g.visible=false;scene.add(A.g);ACT.push(A);
    loads.push(rigged(name).then(G=>{const m=SKU.clone(G.scene);m.traverse(q=>{if(q.isMesh){q.castShadow=true;q.receiveShadow=true;q.frustumCulled=false;
        if(q.material){q.material=q.material.clone();q.material.metalness=Math.min(q.material.metalness,.45);if(o.glow){q.material.emissive=C(o.glow);q.material.emissiveIntensity=o.gi||.12;}}}});
      const b=new THREE.Box3().setFromObject(m),k=h/(b.max.y-b.min.y);m.scale.setScalar(k);m.position.y=-b.min.y*k;A.g.add(m);A.m=m;
      if(o.eyes){const e=add(o.eyes,.7,.95);e.position.set(0,h*.9,.14);A.g.add(e);}
      A.mx=new THREE.AnimationMixer(m);for(const c of G.animations){A.acts[c.name]=A.mx.clipAction(c);A.dur[c.name]=c.duration;}}).catch(e=>console.warn('human',name,e)));
    return A;}
  // stand A at p facing toward dir, playing clip at time ct
  function pose(A,p,dir,clip,ct){A.g.visible=true;A.g.position.copy(p);A.g.lookAt(_f.copy(p).add(dir));if(!A.mx)return;
    for(const k in A.acts){const a=A.acts[k];if(k===clip){if(!a.isRunning())a.play();a.weight=1;}else a.stop();}
    A.mx.setTime(((ct%A.dur[clip])+A.dur[clip])%A.dur[clip]);}
  // the Pathfinder squad, Michael, and the Hollow
  const SQ=[human('michael-hall',1.9),human('keeper-pathfinder',1.9),human('keeper-footsoldier',1.82),human('keeper-pathfinder',1.88),human('keeper-footsoldier',1.84)];
  const HOL=[];for(let i=0;i<22;i++)HOL.push(human(i%3===0?'hollow-heavy':'hollow-commander',i%3===0?2.35:2.15,{glow:0x9a45ff,gi:.12,eyes:0xc070ff}));

  // ships: Keeper interceptors, Hollow fighters, the Hollow bomber, Keeper dropships and the big Keeper ships for the launch
  const ship=(n,len,o)=>{const g=WD.ship(n,len,o);g.visible=false;scene.add(g);return g;};
  const RAV=[];for(let i=0;i<16;i++){const g=ship('raven',22,{glow:0x9fe4ff,gs:1.1});RAV.push(g);}
  const WRA=[];for(let i=0;i<5;i++)WRA.push(ship('wraith',24,{glow:0xb070ff,gs:1}));
  const VAN=[ship('vanguard',240,{glow:0x9fe4ff,gs:.5}),ship('vanguard',200,{glow:0x9fe4ff,gs:.5})];
  const BOMB=ship('ship_hollow_bomber',58,{glow:0xb070ff,gs:.6});
  const DROP=ship('dropship',62,{glow:0x9fe4ff,gs:.5,shadow:true});
  const engGlow=[];RAV.concat(VAN).forEach(g=>{const s=add(0x8fdcff,1,0);g.add(s);g.userData.ign=s;});
  const fly=(g,p,d,roll)=>{g.visible=true;g.position.copy(p);g.lookAt(_f.copy(p).sub(d));if(roll)g.rotateZ(roll);};
  // the rocket hog and the Keeper mech (Bryce's Meshy models; the hog's nose is -z, the mech faces -z)
  const HOG={g:new THREE.Group()};HOG.g.visible=false;scene.add(HOG.g);
  loads.push(MODELS.copy('hog-rocket').then(({scene:s})=>{MODELS.tame(s,.45);const {o}=MODELS.fit(s,{size:5.6,axis:'z',floor:true});
    o.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});HOG.g.add(o);
    for(const x of[-.85,.85]){const l=add(0xfff0d0,1.4,.9);l.position.set(x,1.1,-2.85);HOG.g.add(l);}}).catch(e=>console.warn('hog',e)));
  const MECH={g:new THREE.Group(),rig:null};MECH.g.visible=false;scene.add(MECH.g);
  loads.push(MODELS.copy('mech').then(({scene:s})=>{MODELS.tame(s,.5);
    s.traverse(c=>{if(c.isMesh&&c.material.map){c.material=c.material.clone();c.material.emissive=C(0xffffff);c.material.emissiveMap=c.material.map;c.material.emissiveIntensity=.08;}});
    MECH.rig=MODELS.mechRig(s);s.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(s),k=8.4/(bb.max.y-bb.min.y);s.scale.setScalar(k);s.position.y=-bb.min.y*k;
    s.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;c.frustumCulled=false;}});MECH.g.add(s);
    const lamp=add(0x7fe3ff,1.6,1);lamp.position.set(0,8.4*.78,-1.6);MECH.g.add(lamp);}).catch(e=>console.warn('mech',e)));
  const mechMuz=(i,fw)=>{const g=MECH.g,b=MECH.rig&&MECH.rig.mz[i?'gunB':'gunA'];const p=V();
    if(b){b.getWorldPosition(p);}else{p.set(i?2.6:-2.6,5.6,-1.5);g.localToWorld(p);}
    const d=V(0,0,-1).applyQuaternion(g.quaternion);return p.addScaledVector(d,fw||1.2);};

  const shakeV=V();function shake(a,t,f){f=f||1;shakeV.set(Math.sin(t*37*f)*a+Math.sin(t*61*f)*a*.4,Math.sin(t*41*f+1)*a+Math.sin(t*67*f)*a*.4,Math.sin(t*29*f+2)*a*.6);cam.position.add(shakeV);}
  function lens(fov){if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix();}}
  const rimL=new THREE.PointLight(0x7fc8ff,0,30,1.6);scene.add(rimL);
  function world(t,o){o=o||{};OUT.value=o.out==null?.45:o.out;WD.skyU.hor.value.setHex(0x16284c).lerp(C(0x52161a),o.red==null?.8:o.red);scene.fog.color.copy(WD.skyU.hor.value);
    heralds(t);fires(t);beams(t);
    for(const A of ACT)A.g.visible=false;for(const g of RAV.concat(WRA,VAN,[BOMB,DROP]))g.visible=false;for(const g of RAV.concat(VAN))g.userData.ign.material.opacity=0;
    HOG.g.visible=MECH.g.visible=false;rimL.intensity=0;if(GU){GU.sat.value=o.sat==null?sat0:o.sat;GU.contrast.value=o.con==null?con0:o.con;}}
  function fx(tau){booms(tau);bolts(tau);missiles(tau);flashes(tau);}
  function draw(t){WD.update(t);R.shadowMap.needsUpdate=true;WD.render();}
  /* ======================= BELIEVE: one Keeper, one fight ======================= */
  const M=V(240,0,470);M.y=GH(M.x,M.z);const LAND=V(240,0,486);LAND.y=GH(LAND.x,LAND.z);
  const MI=SQ[0],HV=HOL[0];
  const FWD=V(0,0,-1);
  // Michael's kit: the jetpack on his back and a rifle in his hands, placed on his bones every frame
  const KIT={jet:new THREE.Group(),gun:new THREE.Group()};KIT.jet.visible=KIT.gun.visible=false;scene.add(KIT.jet,KIT.gun);
  loads.push(MODELS.copy('jetpack').then(({scene:s})=>{MODELS.tame(s,.5);const {o}=MODELS.fit(s,{size:.6,axis:'y'});KIT.jet.add(o);}).catch(e=>console.warn('jet',e)));
  loads.push(MODELS.copy('gun-m254').then(({scene:s})=>{MODELS.tame(s,.5);const {o}=MODELS.fit(s,{size:.95,axis:'z'});KIT.gun.add(o);}).catch(e=>console.warn('gun',e)));
  const JF=[add(0x7fd8ff,1,0),add(0x7fd8ff,1,0),add(0xffffff,1,0),add(0xffffff,1,0)];JF.forEach(f=>scene.add(f));
  const jetL=new THREE.PointLight(0x7fd8ff,0,12,1.6);scene.add(jetL);
  const bone=(A,n)=>A.m&&(A.m.getObjectByName('mixamorig'+n)||A.m.getObjectByName('mixamorig:'+n));
  const wp=(A,n)=>{const b=bone(A,n);return b?b.getWorldPosition(V()):A.g.position.clone().add(V(0,1.3,0));};
  // point a limb (bone a, its child b) at a world point: turn the bone so its child lies on the line to the target
  const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion();
  function aimLimb(A,a,b,target,mix){const A1=bone(A,a),B1=bone(A,b);if(!A1||!B1)return;A.g.updateMatrixWorld(true);
    const pa=A1.getWorldPosition(V()),pb=B1.getWorldPosition(V()),d0=pb.sub(pa).normalize(),d1=target.clone().sub(pa).normalize();
    _q.setFromUnitVectors(d0,d1);if(mix<1)_q.slerp(new THREE.Quaternion(),1-mix);
    A1.getWorldQuaternion(_q2);const pq=A1.parent.getWorldQuaternion(new THREE.Quaternion());
    A1.quaternion.copy(pq.invert().multiply(_q).multiply(_q2));A1.updateMatrixWorld(true);}
  // rifle up at a target: right arm and forearm onto the line, left hand reaching under the barrel
  function aim(A,target,k){if(!A.m||k<=0)return;
    const sh=wp(A,'RightShoulder'),fw=target.clone().sub(sh).normalize();
    const reach=sh.clone().addScaledVector(fw,.45).add(V(0,-.12,0));
    aimLimb(A,'RightArm','RightForeArm',reach,k);aimLimb(A,'RightForeArm','RightHand',target,k);
    const sup=sh.clone().addScaledVector(fw,.5).add(V(0,-.16,0)).add(V().crossVectors(fw,V(0,1,0)).multiplyScalar(-.08));
    aimLimb(A,'LeftArm','LeftForeArm',sup.clone().addScaledVector(fw,-.25).add(V(0,-.12,0)),k);aimLimb(A,'LeftForeArm','LeftHand',sup,k);}
  let muzP=V();
  function kit(A,t,o){o=o||{};A.g.updateMatrixWorld(true);
    // jetpack between the shoulder blades
    const sp=wp(A,'Spine2'),fw=V(0,0,1).applyQuaternion(A.g.quaternion);
    KIT.jet.visible=true;KIT.jet.position.copy(sp).addScaledVector(fw,-.24).add(V(0,-.05,0));KIT.jet.quaternion.copy(A.g.quaternion);KIT.jet.rotateY(Math.PI);
    const thr=o.thrust||0;JF.forEach((f,i)=>{f.visible=thr>0;if(!thr)return;const side=V(1,0,0).applyQuaternion(A.g.quaternion).multiplyScalar(i%2?.13:-.13);
      const p=KIT.jet.position.clone().add(side).add(V(0,-.42-(i>1?.05:.35*thr),0));f.position.copy(p);
      const fl=.85+.15*Math.sin(t*70+i*2);f.scale.set((i>1?.25:.55)*thr*fl,(i>1?.5:1.6)*thr*fl,1);f.material.opacity=i>1?1:.9;});
    jetL.intensity=thr*4;jetL.position.copy(KIT.jet.position).add(V(0,-.6,0));
    // the rifle in the right hand, along the line to the target (or the forearm when not aiming)
    const hand=wp(A,'RightHand'),fore=wp(A,'RightForeArm');KIT.gun.visible=true;
    const dir=o.target?o.target.clone().sub(hand).normalize():hand.clone().sub(fore).normalize();
    KIT.gun.position.copy(hand).addScaledVector(dir,.1);KIT.gun.lookAt(_f.copy(KIT.gun.position).add(dir));
    muzP=KIT.gun.position.clone().addScaledVector(dir,.62);}
  // the shield: a dome of Keeper light, hex-cut, rippling where it's hit
  const HITS=[];for(let i=0;i<8;i++)HITS.push(new THREE.Vector4(0,1,0,99));
  const SHM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false,fog:false,
    uniforms:{t:{value:0},op:{value:0},hits:{value:HITS},fl:{value:1}},
    vertexShader:'varying vec3 vN,vV,vL;void main(){vL=normalize(position);vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`uniform float t,op,fl;uniform vec4 hits[8];varying vec3 vN,vV,vL;
      float hex(vec2 p){p*=vec2(1.,1.1547);p.x+=mod(floor(p.y),2.)*.5;vec2 f=fract(p)-.5;return smoothstep(.40,.47,max(abs(f.x),abs(f.y)*1.2));}
      void main(){float fr=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.2);
        vec2 uv=vec2(atan(vL.z,vL.x)*4.,vL.y*7.);float hx=hex(uv*1.6+vec2(0.,t*.15));
        float rip=0.;for(int i=0;i<8;i++){float a=hits[i].w;if(a<1.2){float d=acos(clamp(dot(vL,hits[i].xyz),-1.,1.));rip+=exp(-d*6.)*(1.-a/1.2)*1.6+smoothstep(.06,0.,abs(d-a*1.1))*(1.-a/1.2)*1.2;}}
        float scan=smoothstep(.97,1.,sin(vL.y*40.-t*6.))*.25;
        vec3 c=vec3(.25,.75,1.)*(.08+fr*.9+hx*(.12+fr*.3)+scan)+vec3(.6,.85,1.)*min(rip*.3,.8);
        gl_FragColor=vec4(min(c*op*fl,vec3(.9)),1.);}`});
  const DOME=new THREE.Mesh(new THREE.SphereGeometry(1,64,32,0,Math.PI*2,0,Math.PI/2),SHM);DOME.visible=false;scene.add(DOME);
  const domeRing=add(0x9fe8ff,1,0);scene.add(domeRing);const domeL=new THREE.PointLight(0x7fd0ff,0,30,1.4);scene.add(domeL);
  const DR=4.2,DOME_T=7.92,DOME_OFF=13.9;
  const DC=V(M.x,M.y,M.z);
  // the Hollow line, firing; the bolts that strike the dome
  const HL=[];for(let i=0;i<9;i++){const x=M.x+(i-4)*5.2+(hash(i)-.5)*2,z=M.z-46-hash(i+3)*10;HL.push(V(x,GH(x,z),z));}
  const DH=[];   // dome hits: {dir, t}
  {// on the run in: fire around him
    for(let i=0;i<34;i++){const t0=5.5+i*.065,src=HL[i%9].clone().add(V(.4,1.3,0));const runP=V(M.x+(hash(i)-.5)*5,0,lerp(LAND.z,M.z,cl((t0-5.6)/2.2,0,1))-2);runP.y=GH(runP.x,runP.z)+.3+hash(i*3)*2.2;
      bolt(src,runP.add(V((hash(i*5)-.5)*6,0,(hash(i*7)-.5)*6)),t0,{col:0xb46cff,sp:150,len:6,w:.2,hit:hash(i*9)<.6?.8:0,purple:1});}
    // on the shield
    for(let i=0;i<64;i++){const t0=7.85+i*.036,src=HL[(i*7)%9].clone().add(V(.4,1.3,0));
      const dir=V((hash(i*3.3)-.5)*1.5,.25+hash(i*1.7)*.8,1).normalize();const hp=DC.clone().addScaledVector(V(dir.x,dir.y,-dir.z).normalize(),DR);
      const tt=t0+src.distanceTo(hp)/150;if(tt>DOME_T+.05&&tt<11.4){bolt(src,hp,t0,{col:0xb46cff,sp:150,len:6,w:.2});DH.push({d:hp.clone().sub(DC).normalize(),t:tt});boom(hp,tt,.28,{purple:1,sparks:8,smoke:0,life:.3,bright:.6,reach:8,halo:2});}
      else bolt(src,DC.clone().add(V((hash(i)-.5)*30,0,(hash(i+1)-.5)*14)).setY(M.y+.4),t0,{col:0xb46cff,sp:150,len:6,w:.2});}}
  for(const P of HL)muzzle(t=>P.clone().add(V(.5,1.3,.6)),5.4,11.2,7+hash(P.x)*4,{col:0xc080ff,size:1});
  function dome(t){const on=t>DOME_T&&t<DOME_OFF+.4;DOME.visible=on;domeRing.visible=t>DOME_T&&t<DOME_T+.6;domeL.intensity=0;if(!on)return;
    const u=t-DOME_T,k=eo(u/.32),off=sm(DOME_OFF-.3,DOME_OFF+.35,t);
    DOME.position.copy(DC);DOME.scale.set(DR*k,DR*k*.92,DR*k);SHM.uniforms.t.value=t;SHM.uniforms.op.value=(1-off)*(.8+1.2*Math.exp(-u*5));
    SHM.uniforms.fl.value=t>DOME_OFF-.6?(hash(Math.floor(t*24))>.45?1:.25):1;
    const live=DH.filter(h=>t>=h.t&&t-h.t<1.2).slice(-8);for(let i=0;i<8;i++){const h=live[i];if(h)HITS[i].set(h.d.x,h.d.y,h.d.z,t-h.t);else HITS[i].w=99;}
    domeRing.position.copy(DC).add(V(0,.3,0));domeRing.scale.setScalar(DR*2.4*eo(u/.5));domeRing.material.opacity=.5*(1-sm(0,.6,u));
    domeL.position.copy(DC).add(V(0,3,0));domeL.intensity=(1-off)*(2+4*Math.exp(-u*4));}

  // the Hollow heavy's charge and its end
  const HV_A=V(M.x+1.5,0,M.z-26),HV_B=V(M.x+.6,0,M.z-6.2);
  const KILL=11.8,SLR=.24,slowK=t=>t<KILL?t:KILL+(t-KILL)*SLR;
  const hvAt=tau=>{const k=cl((tau-10.15)/(KILL+.05-10.15),0,1);const p=V().lerpVectors(HV_A,HV_B,k);p.y=GH(p.x,p.z);return p;};
  const miAt=tau=>{const k=sm(10.2,11.7,tau);const p=V(M.x,0,lerp(M.z,M.z-3.2,k));p.y=GH(p.x,p.z);return p;};
  {const tg=()=>hvAt(KILL).add(V(0,1.5,0));
    [11.5,11.6,11.68,11.75,11.8,11.82,11.84].forEach((t0,i)=>{const from=miAt(t0).add(V(.25,1.42,-.6));bolt(from,tg().add(V((hash(i)-.5)*.5,(hash(i+2)-.5)*.6,0)),t0,{col:0x9fe8ff,sp:240,len:3.5,w:.12,hit:.35});});
    boom(hvAt(KILL).add(V(0,1.4,.3)),KILL+.02,.55,{purple:1,sparks:90,smoke:3,life:3,bright:3,reach:12,halo:4});}
  muzzle(()=>muzP,11.45,11.86,12,{col:0xbff4ff,size:.9,light:10,li:4});

  /* ---- the shots ---- */
  const SHOTS=[];const bshot=(a,b,fn)=>SHOTS.push({a,b,fn});
  // hide the kit unless a shot shows it
  const dropL=new THREE.PointLight(0xbfe4ff,0,160,1.2);scene.add(dropL);
  const hideKit=()=>{dropL.intensity=0;KIT.jet.visible=KIT.gun.visible=false;JF.forEach(f=>f.visible=false);jetL.intensity=0;DOME.visible=false;domeRing.visible=false;domeL.intensity=0;};
  const fireField=(t,c,L)=>groundFires(t,Object.assign([[c.x-9,0,c.z-30,6],[c.x+12,0,c.z-38,8],[c.x-20,0,c.z-52,9],[c.x+3,0,c.z-60,11],[c.x+24,0,c.z-20,5],[c.x-26,0,c.z-14,5]],{L:L||V(c.x,GH(c.x,c.z-30)+4,c.z-30),Li:4,Ld:90}));

  // the Keeper dropship over the burning dunes, its ramp toward the fight
  const dropP=t=>V(M.x+.5,GH(M.x,M.z)+46,M.z+150-(t-.8)*44);
  const fallP=t=>{const t0=2.75,t1=4.55,a=dropP(t0).add(V(0,-2.5,0));if(t<t0)return a;const k=cl((t-t0)/(t1-t0),0,1);
    const p=V(lerp(a.x,LAND.x,k),0,lerp(a.z,LAND.z,eo(k)));p.y=lerp(a.y,LAND.y,1-Math.pow(1-k,1.6))+(1-k)*(1-k)*0;return p;};
  // 1 · 0.0–2.75 · out of the dark: the dropship comes in low over the fires
  bshot(.9,2.75,(t,u)=>{world(t,{out:.5,red:.7});hideKit();fly(DROP,dropP(t),V(0,0,-1),Math.sin(t*1.3)*.04);dropL.position.copy(dropP(t)).add(V(0,-8,0));dropL.intensity=4;
    const c=V(M.x+14,0,M.z+215);cam.position.set(c.x,GH(c.x,c.z)+34,c.z);cam.lookAt(dropP(t).add(V(0,-16,-90)));lens(40);shake(.05,t,.8);
    fireField(t,M);haze(t,V(M.x,0,M.z),50,.45,0x2e2630);embers(t,cam.position,12,.4);fx(t);draw(t);});
  // 2 · 2.75–4.45 · he steps off the ramp; the jets light and he comes down hard
  bshot(2.75,4.45,(t,u)=>{world(t,{out:.5,red:.7});hideKit();fly(DROP,dropP(t),V(0,0,-1),0);dropL.position.copy(dropP(t)).add(V(0,-8,0));dropL.intensity=4;
    const p=fallP(t);pose(MI,p,V(0,0,-1),'Running',.35);MI.g.rotateX(.18);kit(MI,t,{thrust:t>3.05?1:sm(2.85,3.05,t)});
    cam.position.set(M.x+9,GH(M.x+9,LAND.z+16)+7,LAND.z+16);cam.lookAt(p.clone().add(V(0,1,0)));lens(26);shake(.06,t,1);
    fireField(t,M);haze(t,V(M.x,0,M.z),50,.4,0x2e2630);embers(t,cam.position,12,.4);fx(t);draw(t);});
  boom(LAND.clone().add(V(0,.1,0)),4.5,3.2,{dust:1,nofire:1,sparks:30,smoke:10,life:2.5,bright:1.5,reach:10});
  // 3 · 4.45–5.6 · the landing: down on one knee in a ring of sand, then up
  bshot(4.45,5.6,(t,u)=>{world(t,{out:.5,red:.7});hideKit();
    const k=sm(4.5,4.62,t)*(1-sm(4.95,5.45,t)),p=LAND.clone().add(V(0,-.42*k,0));pose(MI,p,V(0,0,-1),'Running',.35+sm(5.0,5.6,t)*.3);MI.g.rotateX(.42*k);kit(MI,t,{thrust:1-sm(4.45,4.62,t)});
    cam.position.set(LAND.x-2.2,LAND.y+.45,LAND.z-4.2);cam.lookAt(LAND.x,LAND.y+1.0-.3*k,LAND.z);lens(34);shake(.03+.35*Math.exp(-Math.max(0,t-4.5)*7)*(t>4.5?1:0),t,1.4);
    fireField(t,M);haze(t,V(M.x,0,M.z),40,.4,0x2e2630);embers(t,cam.position,10,.5);fx(t);draw(t);});
  // 4 · 5.6–7.85 · the run at their line under fire
  const runP=t=>{const k=cl((t-5.5)/2.3,0,1);const p=V(M.x,0,lerp(LAND.z,M.z,k));p.y=GH(p.x,p.z);return p;};
  bshot(5.6,7.85,(t,u)=>{world(t,{out:.5,red:.7});hideKit();const p=runP(t);
    if(t<7.75)pose(MI,p,V(0,0,-1),'Running',t*1.05);else pose(MI,p,V(0,0,-1),'Walking',.1);kit(MI,t,{});
    for(let i=0;i<9;i++)pose(HOL[i],HL[i],V(0,0,1),'Walking',.2+i*.13);
    cam.position.set(p.x-1.6,p.y+1.35,p.z+4.4);cam.lookAt(p.x+.3,p.y+1.2,p.z-12);lens(46);shake(.06,t,1.5);
    fireField(t,M);haze(t,V(M.x,0,M.z-25),40,.45,0x2e2630);embers(t,cam.position,10,.4);fx(t);draw(t);});
  // 5 · 7.85–9.15 · the shield goes up and takes their fire
  bshot(7.85,9.15,(t,u)=>{world(t,{out:.5,red:.7});hideKit();pose(MI,M,V(0,0,-1),'Walking',.1+sm(7.85,8.05,t)*.15);kit(MI,t,{});dome(t);
    for(let i=0;i<9;i++)pose(HOL[i],HL[i],V(0,0,1),'Walking',.2+i*.13);
    cam.position.set(M.x+7.5-u*1,M.y+.8,M.z-6.5+u*.6);cam.lookAt(M.x,M.y+1.5,M.z);lens(38);shake(.03+.25*Math.exp(-Math.max(0,t-DOME_T)*6)*(t>DOME_T?1:0),t,1.3);
    fireField(t,M);haze(t,V(M.x,0,M.z-25),40,.4,0x2e2630);embers(t,cam.position,10,.4);fx(t);draw(t);});
  // 6 · 9.15–10.25 · inside the dome, over his shoulder: the fire breaking on the light
  bshot(9.15,10.25,(t,u)=>{world(t,{out:.5,red:.7});hideKit();pose(MI,M,V(0,0,-1),'Walking',.25);aim(MI,V(M.x,M.y+1.4,M.z-30),1);kit(MI,t,{target:V(M.x,M.y+1.4,M.z-30)});dome(t);
    for(let i=0;i<9;i++)pose(HOL[i],HL[i],V(0,0,1),'Walking',.2+i*.13);
    cam.position.set(M.x+1.3,M.y+1.9,M.z+6.5-u*.6);cam.lookAt(M.x-.3,M.y+1.5,M.z-20);lens(40);SHM.uniforms.op.value*=.3;shake(.03,t,1);
    fireField(t,M);haze(t,V(M.x,0,M.z-25),40,.4,0x2e2630);fx(t);draw(t);});
  // 7 · 10.25–11.8 · the heavy comes out of the smoke; he walks out of the dome to meet it
  bshot(10.25,11.8,(t,u)=>{world(t,{out:.5,red:.7});hideKit();const mp=miAt(t),hp=hvAt(t);
    pose(MI,mp,V(0,0,-1),'Walking',t*.9);const tg=hp.clone().add(V(0,1.5,0));aim(MI,tg,sm(10.9,11.4,t));kit(MI,t,{target:t>11.1?tg:null});dome(t);
    pose(HV,hp,V(0,0,1),'Running',t*.95);for(let i=1;i<9;i++)pose(HOL[i],HL[i],V(0,0,1),'Walking',.2+i*.13);
    cam.position.set(M.x+12-u*1.5,GH(M.x+12,M.z-12)+2.0,M.z-12);cam.lookAt(M.x+.5,GH(M.x,M.z-9)+1.3,M.z-9);lens(32);shake(.03,t,1);
    fireField(t,M);haze(t,V(M.x,0,M.z-20),30,.55,0x2e2630);embers(t,V(M.x,M.y+1,M.z-8),8,.6);fx(t);draw(t);});
  // 8 · 11.8–13.45 · the kill, in slow motion: the heavy goes over backwards in a burst of the Hollow's light
  bshot(11.8,13.45,(t,u)=>{const tau=slowK(t);world(tau,{out:.5,red:.7,sat:.85,con:1.12});hideKit();const mp=miAt(tau),hp=hvAt(tau);
    const tg=hvAt(KILL).add(V(0,1.5,0));pose(MI,mp,V(0,0,-1),'Walking',11.7*.9);aim(MI,tg,1);kit(MI,tau,{target:tg});dome(tau);
    const fall=sm(KILL,KILL+.38,tau);pose(HV,hp.clone().add(V(0,0,-fall*1.2)),V(0,0,1),'Running',KILL*.95+(tau-KILL)*.4);HV.g.rotateX(-fall*1.45);
    cam.position.set(M.x+2.6,M.y+.9,M.z-1.2);cam.lookAt(M.x+.2,M.y+1.3,M.z-6.5);lens(32);shake(.05*Math.exp(-(t-KILL)*3),t,1);
    fireField(tau,M);haze(tau,V(M.x,0,M.z-20),30,.5,0x2e2630);embers(tau,V(M.x,M.y+1,M.z-6),8,.8);fx(tau);draw(tau);});
  // 9 · 13.45–15.6 · it's over. The dome dies; the camera rises over him to the Spear, still burning gold
  const TAU9=t=>slowK(KILL+.62/SLR*.0)+(t-13.45)+.0;
  bshot(13.45,15.6,(t,u)=>{const tau=12.2+(t-13.45);world(tau,{out:.5,red:.7});hideKit();const mp=miAt(13),hp=hvAt(KILL).add(V(0,0,-1.2));
    pose(MI,mp,V(0,0,-1),'Walking',10.3);kit(MI,tau,{});DOME.visible=false;if(t<14.4){dome(DOME_OFF-.6+(t-13.45)*.9);}
    pose(HV,hp,V(0,0,1),'Running',KILL*.95+.15);HV.g.rotateX(-1.45);
    const k=sm(.18,1,u);cam.position.set(M.x+.8+k*2,M.y+1.2+k*7,M.z+3.5+k*5);cam.lookAt(V().lerpVectors(V(mp.x,mp.y+1.5,mp.z),V(SP.x+200,600,SP.z),k*.85));lens(40+k*-6);
    fireField(tau,M);haze(tau,V(M.x,0,M.z-20),40,.45,0x2e2630);embers(tau,V(M.x,M.y+2,M.z),14,.5);fx(tau);draw(tau);});
  // 10 · 19.1–21.95 · the squad on the ridge with him, the Spear across the water
  bshot(19.1,21.95,(t,u)=>{world(t,{out:.4,red:.55});hideKit();const c=V(-150,0,330);
    [[0,0],[-2.6,.9],[2.5,.7],[-5,1.8],[4.9,1.6]].forEach(([dx,dz],i)=>{const p=V(c.x+dx,0,c.z+dz);p.y=GH(p.x,p.z);pose(SQ[i],p,V(.3,0,-1).normalize(),'Walking',.1+i*.37);});
    kit(SQ[0],t,{});
    cam.position.set(c.x-1+u*1.5,Math.max(GH(c.x,c.z+12),GH(c.x,c.z))+1.9+u*.4,c.z+12-u*1.5);cam.lookAt(c.x+250,40,c.z-900);lens(36);
    embers(t,V(c.x,GH(c.x,c.z)+1,c.z),10,.3);fx(t);draw(t);});

  /* ======================= overlays ======================= */
  const ov=$('ov');function el(html,cls){const d=document.createElement('div');d.className=cls||'';d.innerHTML=html;ov.appendChild(d);return d;}
  const LBX=el('<i></i><i></i>','layer lbx');
  const BEL=el('<h2>BELIEVE</h2><i></i>','layer card gold bel');
  const LOGO=el('<h1>ELYRA</h1><div class="lsub">THE HOLLOW</div><div class="url">ELYRATHEHOLLOW.COM</div>','layer logo'),LOGOh=LOGO.querySelector('h1'),URL=LOGO.querySelector('.url');
  const FLASH=el('','layer flash'),BLACK=el('','layer black');
  const LOGO_T=22.0,END=24.6,BEL_A=15.95,BEL_B=19.0;
  function overlays(t){
    const bo=t>=BEL_A&&t<BEL_B;BEL.style.opacity=bo?sm(BEL_A,BEL_A+.9,t)*(1-sm(BEL_B-.5,BEL_B,t)):0;
    if(bo){const h=BEL.querySelector('h2');h.style.letterSpacing=(.6+.25*eo((t-BEL_A)/3))+'em';BEL.querySelector('i').style.transform=`scaleX(${eo((t-BEL_A-.4)/1.4)})`;}
    const lg=t>=LOGO_T;LOGO.style.opacity=lg?1-sm(END-.6,END-.05,t):0;
    if(lg){const g=1-sm(LOGO_T,LOGO_T+.6,t),j=Math.floor(t*30);LOGO.style.transform=`translateX(${g*(hash(j)-.5)*50}px) scale(${1+.14*Math.exp(-(t-LOGO_T)*9)-.03*sm(LOGO_T,END,t)})`;
      LOGO.style.filter=g>.02?`drop-shadow(${g*14}px 0 0 rgba(255,60,40,.7)) drop-shadow(${-g*14}px 0 0 rgba(60,200,255,.7))`:'none';
      LOGOh.style.setProperty('--sw',(sm(22.4,23.8,t)*160-30)+'%');URL.style.opacity=sm(22.9,23.4,t);}
    let fl=0;const hit=(a,d,k)=>{if(t>=a&&t<a+d)fl=Math.max(fl,(k||1)*(1-(t-a)/d));};
    hit(4.5,.12,.4);hit(DOME_T,.15,.55);hit(KILL,.2,.8);hit(LOGO_T,.35,1);FLASH.style.opacity=fl;
    let bl=0;if(t<.9)bl=1;else if(t<1.6)bl=1-sm(.9,1.6,t);if(t>15.2&&t<19.1)bl=sm(15.2,15.6,t);if(t>19.0&&t<19.1)bl=1;if(t>19.1&&t<19.8)bl=1-sm(19.1,19.8,t);if(t>21.55)bl=sm(21.55,21.95,t);
    BLACK.style.opacity=bl;}

  function frame(t){overlays(t);const S=SHOTS.find(s=>t>=s.a&&t<s.b);
    for(const Hz of HAZE)Hz.s.visible=false;EMB.visible=false;groundFires(t,null);
    if(S)S.fn(t,(t-S.a)/(S.b-S.a));else{R.setRenderTarget(null);R.setClearColor(0x000000);R.clear();}
    return true;}
  window.TRAILER={ready:false,frame,SHOTS,WD,GH,LOGO_T,END};
  Promise.all(loads).then(()=>MODELS.idle(30000)).then(()=>{for(const s of SHOTS)s.fn((s.a+s.b)/2,.5);setTimeout(()=>{window.TRAILER.ready=true;},300);});
})();
