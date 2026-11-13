/* ELYRA: The Hollow · the action trailer (Nov 13 2026, Bryce: a completely new trailer, "less about the story, more about the action",
   20-30 seconds, story second: action, adventure, loss, retribution). Not part of the game: trailer-action.html drives it and
   tools/trailer/drive.py steps it frame by frame (see tools/trailer/ACTION.md). Every frame is a pure function of the clock t:
   TRAILER.frame(t) poses everything and draws it. Cut to the beats of drive-total-war (from 38.96 s in the track = t 1.0).

   0–1        black, the war under it
   1–10.6     ACTION: the charge, the dogfight, the rocket hog, the Hollow out of the smoke, the Herald fleet, the mech, the bomber run
   10.6–13.8  LOSS: the music drops out; slow motion; a Keeper dropship goes down in flames. "THEY TOOK EVERYTHING"
   13.8–21.7  RETRIBUTION: the Keeper fleet launches, Michael walks out of the fire ("NOW WE TAKE IT BACK"), missiles into a Herald
              capital ship, the hog off a dune, the mech's shells on the Hollow lines, the Herald ship comes down into the sea
   21.7–26.5  the logo, the site */
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
  const CAP_FALL0=18.6,CAP_HIT=21.3;
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
    if(o.hit)boom(B.b,t0+B.dist/B.sp,o.hit,{sparks:16,smoke:o.hitSmoke||1,life:.9,purple:o.purple,bright:2,reach:14});
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

  /* ======================= the shots ======================= */
  const shakeV=V();function shake(a,t,f){f=f||1;shakeV.set(Math.sin(t*37*f)*a+Math.sin(t*61*f)*a*.4,Math.sin(t*41*f+1)*a+Math.sin(t*67*f)*a*.4,Math.sin(t*29*f+2)*a*.6);cam.position.add(shakeV);}
  function lens(fov){if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix();}}
  const rimL=new THREE.PointLight(0x7fc8ff,0,30,1.6);scene.add(rimL);
  function world(t,o){o=o||{};OUT.value=o.out==null?.45:o.out;WD.skyU.hor.value.setHex(0x16284c).lerp(C(0x52161a),o.red==null?.8:o.red);scene.fog.color.copy(WD.skyU.hor.value);
    heralds(t);fires(t);beams(t);
    for(const A of ACT)A.g.visible=false;for(const g of RAV.concat(WRA,VAN,[BOMB,DROP]))g.visible=false;for(const g of RAV.concat(VAN))g.userData.ign.material.opacity=0;
    HOG.g.visible=MECH.g.visible=false;rimL.intensity=0;if(GU){GU.sat.value=o.sat==null?sat0:o.sat;GU.contrast.value=o.con==null?con0:o.con;}}
  function fx(tau){booms(tau);bolts(tau);missiles(tau);flashes(tau);}
  function draw(t){WD.update(t);R.shadowMap.needsUpdate=true;WD.render();}
  const SHOTS=[];const shot=(a,b,fn)=>SHOTS.push({a,b,fn});

  /* ---- 1 · 1.00–2.98 · THE CHARGE: the squad sprints across the dunes under fire, a blast behind them ---- */
  const C1={z:150,x0:-60,v:6.4,d:V(1,0,0)};
  const SQ1=[[0,0],[-3.2,-2.4],[-5.6,1.6],[-8.6,-1.2],[-11,-3.4]];
  {const at=t=>V(C1.x0+(t-1)*C1.v,0,C1.z);
    // Hollow fire from the sea side crossing the squad's line
    for(let i=0;i<26;i++){const t0=.9+i*.075,a=at(t0+.3);const src=V(a.x+(hash(i)-.3)*140,GH(a.x,a.z-260)+3+hash(i+4)*8,C1.z-260),
      dst=V(a.x+(hash(i*2)-.5)*26,GH(a.x,C1.z)+.6+hash(i*3)*2.4,C1.z+(hash(i*5)-.6)*12);bolt(src,dst,t0,{col:0xb46cff,sp:300,len:16,w:.32,hit:hash(i*7)<.5?.7:0,purple:1});}
    boom(V(at(1.68).x+16,0,C1.z-11).setY(GH(at(1.68).x+16,C1.z-11)),1.68,6.5,{dust:1,sparks:50,bright:9,reach:20});
    boom(V(at(2.4).x+34,0,C1.z-24).setY(GH(at(2.4).x+34,C1.z-24)),2.42,8,{dust:1,sparks:40,bright:7});
    boom(V(at(1.1).x-10,0,C1.z-30).setY(GH(at(1.1).x-10,C1.z-30)),1.12,7,{dust:1,sparks:30,bright:5});}
  shot(1.0,2.98,(t,u)=>{world(t);const lead=C1.x0+(t-1)*C1.v;
    SQ1.forEach(([dx,dz],i)=>{const x=lead+dx,z=C1.z+dz;pose(SQ[i],V(x,GH(x,z),z),C1.d,'Running',t*1.05+i*.23);});
    const cx=lead-4.5+u*2.2,cz=C1.z+8.5;cam.position.set(cx,GH(cx,cz)+1.05,cz);cam.lookAt(lead-2.5,GH(lead,C1.z)+1.6,C1.z-6);lens(42);shake(.07,t,1.6);
    haze(t,V(lead,0,C1.z-10),70,.5);groundFires(t,Object.assign([[lead+20,0,C1.z-40,6],[lead-15,0,C1.z-55,8],[lead+45,0,C1.z-30,4],[lead+5,0,C1.z-80,9]],{L:V(lead+16,GH(lead,C1.z)+6,C1.z-30),Li:3.2}));
    embers(t,cam.position,14,.5);fx(t);draw(t);});

  /* ---- 2 · 2.98–4.28 · THE DOGFIGHT: on an interceptor's tail through the burning city; the Hollow fighter blows apart ---- */
  const C2={c:V(SP.x,0,SP.z),r:1150,y:330};
  const c2p=(t,lag)=>{const a=.9+(t-lag)*.115;return V(C2.c.x+Math.cos(a)*C2.r,C2.y+Math.sin((t-lag)*2.1)*26,C2.c.z+Math.sin(a)*C2.r);};
  const c2d=t=>c2p(t+.02,0).sub(c2p(t,0)).normalize();
  const C2_KILL=4.02;
  {for(let i=0;i<30;i++){const t0=3.0+i*.035;bolt(c2p(t0,1.0).add(V((i%2?1:-1)*2.4,-1,0)),c2p(t0+.12,0).add(V((hash(i)-.5)*10,(hash(i+1)-.5)*6,0)),t0,{col:0x9fe8ff,sp:900,len:24,w:.45});}
    boom(c2p(C2_KILL,0),C2_KILL,14,{purple:1,sparks:70,smoke:6,life:2.6,bright:14,reach:30});boom(c2p(C2_KILL+.08,0).add(V(4,2,0)),C2_KILL+.08,10,{sparks:40,smoke:3,bright:6});
    // the other dogfights round the Spear
    for(let i=0;i<14;i++){const t0=2.95+i*.09,a=V(SP.x-700+hash(i)*1400,260+hash(i+3)*300,SP.z+300+hash(i+5)*600);bolt(a,a.clone().add(V((hash(i+8)-.5)*400,(hash(i+9)-.5)*80,-300)),t0,{col:i%3?0x9fe8ff:0xb46cff,sp:800,len:30,w:.8});}
    boom(V(SP.x-420,380,SP.z+520),3.35,22,{purple:1,sparks:40,smoke:4,bright:3});}
  shot(2.98,4.28,(t,u)=>{world(t);
    const pp=c2p(t,0),pd=c2d(t);if(t<C2_KILL+.03)fly(WRA[0],pp,pd,Math.sin(t*5)*.9);
    const me=c2p(t,1.0);const md=c2d(t-1.0);fly(RAV[0],me,md,Math.sin(t*3.2)*.4-.2);RAV[0].userData.ign.material.opacity=.9;RAV[0].userData.ign.scale.setScalar(9);RAV[0].userData.ign.position.z=11;
    fly(RAV[1],c2p(t,1.25).add(V(18,6,10)),c2d(t-1.25),-.3);
    // other fighters crossing
    fly(WRA[1],V(SP.x-500+t*120,300,SP.z+700-t*40),V(1,0,-.3).normalize(),.6);fly(RAV[2],V(SP.x-560+t*120,296,SP.z+712-t*40),V(1,0,-.3).normalize(),.5);
    cam.position.copy(me).addScaledVector(md,-24).add(V(0,6.5,0));cam.lookAt(V().copy(me).addScaledVector(md,60).add(V(0,2,0)));lens(58);
    const kk=t>C2_KILL?Math.exp(-(t-C2_KILL)*4)*2.2:0;shake(.18+kk,t,1.3);fx(t);draw(t);});

  /* ---- 3 · 4.28–5.51 · THE ROCKET HOG: flat out along the beach, rockets off the rack into a Hollow drop pod ---- */
  const C3={z:-905,x0:-70,v:30};
  const hogAt=t=>{const x=C3.x0+(t-4.28)*C3.v,z=C3.z+Math.sin(t*.8)*3;return V(x,GH(x,z),z);};
  {const tgt=V(C3.x0+150,0,C3.z-20);tgt.y=GH(tgt.x,tgt.z)+2;
    [[4.62,-.6],[4.7,.6],[4.86,-.6],[4.94,.6]].forEach(([t0,s],i)=>{const a=hogAt(t0).add(V(-.4,2.4,s));missile(a,tgt.clone().add(V(i*3-4,0,i%2*4)),t0,.38+i*.02,{arc:2,wob:.6,size:4,boom:i===3?16:9});});
    boom(V(C3.x0+168,GH(C3.x0+168,C3.z-30)+1,C3.z-30),5.36,12,{bright:8});}
  shot(4.28,5.51,(t,u)=>{world(t);const p=hogAt(t),q=hogAt(t+.05),d=q.clone().sub(p).normalize();
    HOG.g.visible=true;HOG.g.position.copy(p).add(V(0,.05+Math.abs(Math.sin(t*23))*.06,0));HOG.g.lookAt(_f.copy(p).sub(d));HOG.g.rotateZ(Math.sin(t*17)*.02);
    const cx=C3.x0+28,cz=C3.z+9;cam.position.set(cx-u*3,GH(cx,cz)+.85,cz);cam.lookAt(p.x+3,p.y+1.2,p.z-2);lens(38);shake(.04+.25*Math.exp(-Math.abs(t-4.95)*6),t,1.4);
    haze(t,V(cx+30,0,cz-15),60,.35,0x5a4a42);
    // the dust thrown off the wheels
    groundFires(t,Object.assign([[C3.x0+150,0,C3.z-20,6],[C3.x0+90,0,C3.z+40,4]],{L:V(C3.x0+150,GH(C3.x0+150,C3.z)+5,C3.z-20),Li:2}));
    embers(t,cam.position,12,.25);fx(t);draw(t);});
  const DUST=[];for(let i=0;i<18;i++){const s=puff(0x8a7a66);scene.add(s);DUST.push(s);}
  function hogDust(t,pFn,t0){DUST.forEach((s,i)=>{const age=(i/DUST.length)*1.2,tt=t-age;s.visible=tt>t0;if(!s.visible)return;const p=pFn(tt);s.position.set(p.x+(hash(i)-.5)*1.5,p.y+.5+age*1.6,p.z+1.2+(hash(i+3)-.5)*2);
    s.scale.setScalar(2+age*7);s.material.opacity=.45*(1-age/1.2);});}
  SHOTS[SHOTS.length-1].dust=1;

  /* ---- 4 · 5.51–6.51 · THE HOLLOW out of the smoke, firing; a Keeper round takes the lead in the chest ---- */
  const C4={x:-300,z:300};
  const holAt=(i,t)=>{const col=[0,-1,1,-2,2][i],row=[0,1,1,2,2][i];const z=C4.z-15-row*3.5+(t-5.51)*4.2,x=C4.x+col*3.2+(hash(i)-.5);return V(x,GH(x,z),z);};
  {const camP=V(C4.x+1,0,C4.z);
    for(let i=0;i<5;i++){const gun=t=>holAt(i,t).add(V(.45,1.25,.6));
      muzzle(gun,5.51+i*.05,6.6,9+i,{col:0xc080ff,size:1.1,light:i===0?14:0,li:2});
      for(let k=0;k<7;k++){const t0=5.55+k*.12+i*.03;bolt(gun(t0),camP.clone().add(V((hash(i*7+k)-.5)*9,GH(C4.x,C4.z)+.6+hash(k+i)*3,(hash(k*3+i)-.5)*2)),t0,{col:0xb46cff,sp:180,len:7,w:.18});}}
    bolt(V(C4.x+.6,GH(C4.x,C4.z)+1.3,C4.z+2),holAt(0,6.32).add(V(0,1.4,0)),6.25,{col:0x9fe8ff,sp:420,len:10,w:.22,hit:1.4});}
  shot(5.51,6.51,(t,u)=>{world(t);
    for(let i=0;i<5;i++)pose(HOL[i],holAt(i,t),V(0,0,1),'Running',t*.95+i*.31);
    cam.position.set(C4.x+1.2,GH(C4.x,C4.z)+1.0,C4.z);cam.lookAt(C4.x+.4,GH(C4.x,C4.z-20)+1.9,C4.z-20);lens(36+u*-4);shake(.06+(t>6.3?.3:0),t,1.5);
    haze(t,V(C4.x,0,C4.z-24),26,.75,0x2e2630);
    groundFires(t,Object.assign([[C4.x-8,0,C4.z-36,5],[C4.x+9,0,C4.z-40,6],[C4.x+2,0,C4.z-48,8]],{L:V(C4.x,GH(C4.x,C4.z-38)+4,C4.z-38),Li:4.5,Ld:70}));
    embers(t,V(C4.x,GH(C4.x,C4.z)+2,C4.z-14),12,.6);fx(t);draw(t);});

  /* ---- 5 · 6.51–7.50 · THE FLEET: the Herald ships burning the districts; a Keeper wing tears past the camera into them ---- */
  [[1,6.4,7.6,50],[2,6.45,7.6,60],[3,6.55,7.6,40],[4,6.6,7.6,36],[1,6.9,7.6,46]].forEach(([i,a,b,w],k)=>beam(belly(i),towerAt(k+3),a,b,w));
  {for(let i=0;i<10;i++)boom(V(SP.x-1400+hash(i*3)*2800,700+hash(i*5)*900,SP.z-600-hash(i*7)*1400),6.52+i*.09,34+hash(i)*30,{sparks:20,smoke:2,life:1.6,bright:1.5,reach:8});}
  const C5={cam:V(1300,140,-760)};
  shot(6.51,7.5,(t,u)=>{world(t);
    for(let k=0;k<5;k++){const d=V(-.55,.22,-1).normalize(),p0=C5.cam.clone().add(V(10+k*9,-4+(k%2)*5,40+k*22)),p=p0.addScaledVector(d,(t-6.51-k*.06)*230);fly(RAV[k],p,d,-.5);RAV[k].userData.ign.material.opacity=.9;RAV[k].userData.ign.scale.setScalar(10);RAV[k].userData.ign.position.z=11;}
    cam.position.copy(C5.cam).add(V(-u*20,u*6,0));cam.lookAt(SP.x-500,900+u*60,SP.z-1600);lens(46);shake(.5*Math.exp(-Math.abs(t-6.66)*5),t,1.2);fx(t);draw(t);});

  /* ---- 6 · 7.50–8.34 · THE MECH: planted on the dunes, both guns open ---- */
  const C6={x:620,z:420};
  {const mp=V(C6.x,0,C6.z);mp.y=GH(mp.x,mp.z);
    for(const i of[0,1]){muzzle(t=>mechMuz(i,1.6),7.5,8.4,12,{col:0x9ff4ff,size:3.2,light:i?0:40,li:6});
      for(let k=0;k<11;k++){const t0=7.5+k*.083+i*.04;bolt(V(mp.x+(i?2.6:-2.6),mp.y+5.6,mp.z-3),V(mp.x+(hash(k+i*9)-.5)*120,GH(mp.x,mp.z-260)+(hash(k*3)*10),mp.z-260),t0,{col:0x9ff4ff,sp:520,len:22,w:.5});}}
    for(let k=0;k<4;k++)boom(V(mp.x+(hash(k*4)-.5)*80,0,mp.z-150-hash(k)*80).setY(GH(mp.x,mp.z-170)),7.75+k*.16,9,{dust:1,sparks:25,bright:3});}
  shot(7.5,8.34,(t,u)=>{world(t);const mp=V(C6.x,GH(C6.x,C6.z),C6.z);
    MECH.g.visible=true;MECH.g.position.copy(mp);MECH.g.rotation.set(0,0,0);if(MECH.rig)MODELS.mechPose(MECH.rig,.4,.15,.5+.5*Math.sin(t*75));
    cam.position.set(C6.x+11-u*1.5,mp.y+1.5,C6.z+9);cam.lookAt(C6.x-1,mp.y+4.6,C6.z-5);lens(42);rimL.position.set(C6.x+6,mp.y+7,C6.z+6);rimL.intensity=3;rimL.distance=40;shake(.12,t,2.2);
    haze(t,V(C6.x,0,C6.z-30),50,.4);groundFires(t,Object.assign([[C6.x-30,0,C6.z-60,7],[C6.x+25,0,C6.z-90,9]],{L:V(C6.x,mp.y+3,C6.z-40),Li:3}));
    embers(t,V(C6.x,mp.y+3,C6.z),12,.5);fx(t);draw(t);});

  /* ---- 7 · 8.34–10.60 · THE BOMBER RUN: the squad runs for it as a Hollow bomber walks its bombs up the beach to the camera ---- */
  const C7={x:-1200,z:-120};
  const bombAt=t=>{const z=C7.z-560+(t-8.34)*255;return V(C7.x+6,GH(C7.x,C7.z)+34+(t-8.34)*3,z);};
  {const BT7=[8.7,8.98,9.24,9.48,9.7,9.9,10.08,10.24,10.4,10.53];
    BT7.forEach((t0,i)=>{const z=C7.z-330+i*(330/(BT7.length-1))*1.02,x=C7.x+(i%2?5:-5)+(hash(i)-.5)*8;boom(V(x,GH(x,z),z),t0,7+i*.9,{purple:i%3===0,dust:1,sparks:50,bright:8+i,reach:26});});}
  shot(8.34,10.6,(t,u)=>{world(t);
    const bp=bombAt(t);fly(BOMB,bp,V(0,0,1),Math.sin(t*2)*.05);
    for(let i=0;i<3;i++){const z=C7.z-22+(t-8.34)*6.6+i*2.4,x=C7.x+(i-1)*3.4;pose(SQ[i+1],V(x,GH(x,z),z),V(0,0,1),'Running',t*1.05+i*.4);}
    cam.position.set(C7.x+1.2,GH(C7.x,C7.z)+1.5,C7.z+8);cam.lookAt(C7.x,GH(C7.x,C7.z)+8+u*22,C7.z-80);lens(44);
    const bk=BOOMS.reduce((m,B)=>{const a=t-B.t0;return a>0&&a<.6&&B.s>6?Math.max(m,(1-a/.6)*B.s/12):m;},0);shake(.06+bk*.5,t,1.6);
    haze(t,V(C7.x,0,C7.z-60),60,.45,0x3a2e2c);
    embers(t,cam.position,14,.6);fx(t);draw(t);});

  /* ---- 8 · 10.60–13.79 · LOSS: slow motion. Three of them stand on the dunes as a Keeper dropship burns and falls into the sea ---- */
  const SL0=10.62,SLR=.19;const slow=t=>SL0+(t-SL0)*SLR;   // tau 10.62 → 11.21
  const C8={x:-150,z:330};
  const dropAt=tau=>{const k=cl((tau-10.55)/.9,0,1);return V(lerp(230,430,k),lerp(250,20,ei(k)*.6+k*.4),lerp(-330,-560,k));};
  {beam(belly(4),()=>dropAt(10.6),10.5,10.7,22);
    boom(dropAt(10.66),10.66,20,{sparks:60,smoke:6,life:4,bright:6,reach:40});
    for(let i=0;i<5;i++)boom(dropAt(10.75+i*.09).add(V((hash(i)-.5)*20,(hash(i+2)-.5)*10,0)),10.75+i*.09,8+i*2,{sparks:20,smoke:3,life:3,bright:3});}
  const TRAIL=[];for(let i=0;i<26;i++){const f=add(0xff7a30,1,0),s=puff(0x262026);scene.add(f,s);TRAIL.push({f,s});}
  shot(10.6,13.79,(t,u)=>{const tau=slow(t);world(tau,{out:.55,sat:.55,con:1.15,red:.65});
    const dp=dropAt(tau),dd=dropAt(tau+.01).sub(dp).normalize();fly(DROP,dp,V(1,0,.2).normalize(),.3+(tau-10.6)*.6);DROP.rotateX(-(tau-10.6)*.5);
    TRAIL.forEach((T,i)=>{const back=i*.025,q=dropAt(tau-back);const on=tau-back>10.66;T.f.visible=T.s.visible=on;if(!on)return;
      T.f.position.copy(q);T.f.scale.setScalar(40*(1-i/26)+8);T.f.material.opacity=.8*(1-i/26);T.s.position.copy(q).add(V(0,i*2,0));T.s.scale.setScalar(20+i*4);T.s.material.opacity=.5*(1-i/26);});
    for(let i=0;i<3;i++){const x=C8.x+(i-1)*2.6+(i===1?0:.4),z=C8.z-3-(i===1?1.2:0)-(t-10.6)*.35;pose(SQ[i],V(x,GH(x,z),z),V(.32,0,-1).normalize(),'Walking',tau*.9+i*.5);}
    cam.position.set(C8.x+1.6-u*.6,GH(C8.x,C8.z)+1.75,C8.z+3.6-u*1.4);cam.lookAt(C8.x+330,GH(C8.x,C8.z)+95-u*25,C8.z-640);lens(34);
    haze(tau,V(C8.x,0,C8.z-40),70,.35,0x3a3238);embers(tau*1.5,V(C8.x,GH(C8.x,C8.z)+2,C8.z-6),10,.45);fx(tau);draw(tau);});
  SHOTS[SHOTS.length-1].trail=1;

  /* ---- 9 · 13.79–15.00 · THE KEEPERS RISE: the fleet lights its engines and climbs out of Tide City ---- */
  const LAUNCH=[];{for(let i=0;i<14;i++){LAUNCH.push({p:V(SP.x+420+(hash(i*3.1)-.5)*520,30+hash(i)*50,SP.z+1500-120-hash(i*5.3)*420),ti:13.82+hash(i*7.7)*.7,g:RAV[i]});}
    LAUNCH.push({p:V(SP.x+180,80,SP.z+900),ti:13.95,g:VAN[0],big:1},{p:V(SP.x+700,70,SP.z+800),ti:14.25,g:VAN[1],big:1});}
  const C9={cam:V(SP.x+420,14,SP.z+1500)};
  shot(13.79,15.0,(t,u)=>{world(t,{out:.4,red:.75});
    for(const L of LAUNCH){const a=Math.max(0,t-L.ti),acc=L.big?60:220;const p=L.p.clone().add(V(0,a*a*acc*.5+a*(L.big?10:30),-a*a*acc*.25));
      const d=L.big?V(0,.3,-1).normalize():V(0,.75,-.35).normalize();fly(L.g,p,d,0);
      const ig=L.g.userData.ign,on=t>L.ti;ig.position.z=L.big?130:11;ig.scale.setScalar((L.big?160:14)*(on?1+Math.exp(-a*5)*2:.25));ig.material.opacity=on?.95:.25;}
    cam.position.copy(C9.cam).add(V(-u*30,u*10,-u*40));cam.lookAt(SP.x+420,130+u*200,SP.z+1100);lens(56);shake(.15+.4*Math.exp(-(t-13.82)*6),t,1.2);fx(t);draw(t);});

  /* ---- 10 · 15.00–17.00 · MICHAEL walks out of the fire, the squad behind him. "NOW WE TAKE IT BACK" ---- */
  const C10={x:240,z:520};
  shot(15.0,17.0,(t,u)=>{world(t,{out:.5,red:.7});const zz=C10.z-12+(t-15)*1.25;
    pose(SQ[0],V(C10.x,GH(C10.x,zz),zz),V(0,0,1),'Walking',t*.92);rimL.position.set(C10.x+2,GH(C10.x,zz)+2.5,zz+4);rimL.intensity=2.2;rimL.distance=14;
    pose(SQ[1],V(C10.x-3.2,GH(C10.x-3.2,zz-3.5),zz-3.5),V(0,0,1),'Walking',t*.92+.4);pose(SQ[2],V(C10.x+3.4,GH(C10.x+3.4,zz-4.2),zz-4.2),V(0,0,1),'Walking',t*.92+.7);
    cam.position.set(C10.x+.4,GH(C10.x,zz+5)+1.05,zz+5.2-u*.5);cam.lookAt(C10.x,GH(C10.x,zz)+1.75,zz-2);lens(30);shake(.02,t,.6);
    groundFires(t,Object.assign([[C10.x-6,0,zz-12,6],[C10.x+5,0,zz-14,7],[C10.x-1,0,zz-22,11],[C10.x+12,0,zz-18,5],[C10.x-13,0,zz-17,5]],{L:V(C10.x,GH(C10.x,zz)+3,zz-10),Li:6,Ld:60}));
    haze(t,V(C10.x,0,zz-16),24,.6,0x2a2226);embers(t,V(C10.x,GH(C10.x,zz)+1,zz-3),8,1);fx(t);draw(t);});

  /* ---- 11 · 17.00–17.51 · INTERCEPTORS rip past, missiles off the rails toward the capital ship ---- */
  const C11={cam:V(-300,240,-1250)};
  const capAim=k=>CAP.p.clone().add(V((k-3)*120,-80+(k%3)*40,(k%2)*100));
  {for(let k=0;k<3;k++){for(let m=0;m<3;m++){const t0=17.08+k*.07+m*.06;const p=V(C11.cam.x-30+k*16,C11.cam.y-6+k*4,C11.cam.z+30).addScaledVector(V(-.35,.25,-1).normalize(),(t0-17)*260);
      missile(p,capAim(k*3+m),t0,.95+m*.05+k*.03,{arc:120,wob:6,size:7,boom:0});}}}
  shot(17.0,17.51,(t,u)=>{world(t);
    for(let k=0;k<3;k++){const d=V(-.35,.25,-1).normalize(),p=V(C11.cam.x-30+k*16,C11.cam.y-6+k*4,C11.cam.z+30).addScaledVector(d,(t-17)*260);fly(RAV[k],p,d,-.35+k*.1);RAV[k].userData.ign.material.opacity=.9;RAV[k].userData.ign.scale.setScalar(12);RAV[k].userData.ign.position.z=11;}
    cam.position.copy(C11.cam).add(V(0,0,-u*30));cam.lookAt(CAP.p.x*.3+C11.cam.x*.7,C11.cam.y+90,C11.cam.z-400);lens(52);shake(.35*Math.exp(-(t-17.05)*6),t,1.4);fx(t);draw(t);});

  /* ---- 12 · 17.51–18.51 · the missiles walk down the capital ship's hull ---- */
  {for(let k=0;k<9;k++){const t1=17.62+k*.085;boom(capAim(k).clone().add(V(300,0,460)),t1,170+hash(k)*110,{sparks:50,smoke:4,life:3,bright:2,reach:30});}
    for(let k=0;k<5;k++)boom(CAP.p.clone().addScaledVector(CAP.d,(k-2)*CAP.len*.18).add(V(300,-CAP.len*.04,460)),18.25+k*.1,240+k*30,{sparks:40,smoke:5,life:3,bright:3,reach:30});}
  shot(17.51,18.51,(t,u)=>{world(t);
    cam.position.set(CAP.p.x+1500-u*120,CAP.p.y-360+u*30,CAP.p.z+2300);cam.lookAt(CAP.p.x+100,CAP.p.y-60,CAP.p.z);lens(36);shake(.6*sm(17.6,17.7,t)+.9*sm(18.2,18.3,t),t,.8);fx(t);draw(t);});
  // the capital ship burning as it goes down (fires along the hull, a smoke trail)
  const CF=[];for(let i=0;i<12;i++){const f=add(0xff7a30,1,0),s=puff(0x221c22);scene.add(f,s);CF.push({f,s,o:V((hash(i)-.5)*.16,-.05,(i/11-.5)*.85)});}
  function capFire(t){const on=t>17.7&&t<CAP_HIT+.05;CF.forEach((F,i)=>{F.f.visible=F.s.visible=on&&t>17.7+i*.05;if(!F.f.visible)return;
    const w=V(F.o.x*CAP.len,F.o.y*CAP.len,F.o.z*CAP.len);CAP.g.localToWorld(w);const k=.75+.25*Math.sin(t*9+i);
    F.f.position.copy(w);F.f.scale.setScalar(CAP.len*.09*k);F.f.material.opacity=.9;F.s.position.copy(w).add(V(0,CAP.len*.05,0));F.s.scale.setScalar(CAP.len*.16);F.s.material.opacity=.55;});}

  /* ---- 13 · 18.51–19.51 · the hog off a dune crest, over the camera ---- */
  const C13={x:860,z:180};
  const jumpAt=t=>{const k=cl((t-18.62)/.78,0,1),a=V(C13.x,0,C13.z-34),b=V(C13.x,0,C13.z+12);const p=V().lerpVectors(a,b,k);
    p.y=lerp(GH(a.x,a.z),GH(b.x,b.z),k)+Math.sin(k*Math.PI)*7.5+(t<18.62?0:0);if(t<18.62){p.z=a.z-(18.62-t)*28;p.y=GH(p.x,p.z);}return p;};
  {boom(V(C13.x+16,0,C13.z-60).setY(GH(C13.x+16,C13.z-60)),18.56,9,{dust:1,bright:5});boom(jumpAt(19.4).add(V(0,0,0)),19.41,4,{dust:1,sparks:10,smoke:6,bright:1});}
  shot(18.51,19.51,(t,u)=>{world(t);const p=jumpAt(t),q=jumpAt(t+.03),d=q.clone().sub(p).normalize();
    HOG.g.visible=true;HOG.g.position.copy(p);HOG.g.lookAt(_f.copy(p).sub(d));
    cam.position.set(C13.x+5.5,GH(C13.x+5.5,C13.z+4)+.7,C13.z+4);cam.lookAt(V().lerpVectors(V(C13.x,GH(C13.x,C13.z-20)+3,C13.z-20),p.clone().add(V(0,1,0)),.7));lens(34);
    shake(.04+.5*Math.exp(-Math.max(0,t-19.41)*8)*(t>19.41?1:0),t,1.6);
    haze(t,V(C13.x,0,C13.z-30),40,.3,0x5a4a42);groundFires(t,Object.assign([[C13.x-20,0,C13.z-70,8],[C13.x+30,0,C13.z-90,10]],{L:V(C13.x,GH(C13.x,C13.z)+8,C13.z-60),Li:3}));
    embers(t,cam.position,10,.3);fx(t);draw(t);});
  SHOTS[SHOTS.length-1].dust=2;

  /* ---- 14 · 19.51–20.51 · the mech's cannons land in the Hollow ranks ---- */
  const C14={x:-560,z:420};
  const ranks=(i,t)=>{const col=i%6-2.5,row=Math.floor(i/6);const z=C14.z-90-row*5+(t-19.5)*2.4,x=C14.x+col*4.2+(hash(i)-.5)*1.4;return V(x,GH(x,z),z);};
  {const mp=V(C14.x+9,0,C14.z);mp.y=GH(mp.x,mp.z);
    [19.58,19.8,20.02,20.2,20.36].forEach((t0,k)=>{const tg=ranks(k*4+1,t0+.15);bolt(V(mp.x+(k%2?2.6:-2.6),mp.y+5.6,mp.z-3),tg,t0,{col:0xbff8ff,sp:700,len:30,w:1.1});boom(tg,t0+mp.distanceTo(tg)/700,9,{sparks:60,smoke:5,bright:8,reach:24,purple:k%2===1});});
    for(const i of[0,1])muzzle(t=>mechMuz(i,1.8),19.55,20.5,5.5,{col:0xbff8ff,size:5,light:i?0:50,li:8});}
  shot(19.51,20.51,(t,u)=>{world(t);
    for(let i=0;i<18;i++){const T=HOL[i%HOL.length];pose(T,ranks(i,t),V(0,0,1),'Walking',t+i*.27);}
    const mp=V(C14.x+9,GH(C14.x+9,C14.z),C14.z);MECH.g.visible=true;MECH.g.position.copy(mp);MECH.g.rotation.set(0,.06,0);if(MECH.rig)MODELS.mechPose(MECH.rig,.2,.1,Math.max(0,Math.sin((t-19.55)*5.5*6.283)));
    cam.position.set(mp.x+5.5,mp.y+7.4,mp.z+12-u*2);cam.lookAt(C14.x,GH(C14.x,C14.z-95)+2,C14.z-95);lens(38);
    const bk=BOOMS.reduce((m,B)=>{const a=t-B.t0;return a>0&&a<.4&&B.s>8&&B.s<12?Math.max(m,1-a/.4):m;},0);shake(.05+bk*.35,t,1.6);
    haze(t,V(C14.x,0,C14.z-90),40,.45,0x2e2630);groundFires(t,Object.assign([[C14.x-14,0,C14.z-110,7],[C14.x+15,0,C14.z-120,9]],{L:V(C14.x,GH(C14.x,C14.z-100)+5,C14.z-100),Li:3}));
    fx(t);draw(t);});

  /* ---- 15 · 20.51–21.67 · the capital ship comes down into the sea ---- */
  {const hp=()=>capPose(CAP_HIT);boom(V(-1800,10,-3620),CAP_HIT,520,{water:1,sparks:80,smoke:12,life:5,bright:10,reach:40});boom(V(-1650,30,-3500),CAP_HIT+.12,380,{sparks:40,smoke:8,life:5,bright:5,reach:40});}
  shot(20.51,21.67,(t,u)=>{world(t,{red:.85});capFire(t);
    cam.position.set(-2500+u*60,60+u*8,-1150);cam.lookAt(-1750,560-u*260,-3700);lens(44);shake(.08+1.4*sm(CAP_HIT,CAP_HIT+.08,t)*Math.exp(-Math.max(0,t-CAP_HIT)*2),t,1);fx(t);draw(t);});
  // the capital ship burns in every shot from its first hit
  const _cf=SHOTS.map(s=>s.fn);SHOTS.forEach((s,i)=>{if(s.a>=17.5){const f=_cf[i];s.fn=(t,u)=>{capFire(t);f(t,u);};}});

  /* ======================= overlays ======================= */
  const ov=$('ov');function el(html,cls){const d=document.createElement('div');d.className=cls||'';d.innerHTML=html;ov.appendChild(d);return d;}
  const LBX=el('<i></i><i></i>','layer lbx');
  const C1D=el('<h2>THEY TOOK EVERYTHING</h2><i></i>','layer card'),C2D=el('<h2>NOW WE TAKE IT BACK</h2><i></i>','layer card gold');
  const LOGO=el('<h1>ELYRA</h1><div class="lsub">THE HOLLOW</div><div class="url">ELYRATHEHOLLOW.COM</div>','layer logo'),LOGOh=LOGO.querySelector('h1'),URL=LOGO.querySelector('.url');
  const EMBC=el('<canvas width="1920" height="1080"></canvas>','layer emb'),EX=EMBC.querySelector('canvas').getContext('2d');
  const REDV=el('','layer red'),FLASH=el('','layer flash'),BLACK=el('','layer black');
  function card(D,a,b,t){const on=t>=a&&t<=b;D.style.opacity=on?sm(a,a+.35,t)*(1-sm(b-.35,b,t)):0;if(!on)return;const h=D.querySelector('h2'),i=D.querySelector('i');
    h.style.letterSpacing=(.34+.1*(1-eo((t-a)/(b-a))))+'em';D.style.filter=t-a<.35?`blur(${(1-(t-a)/.35)*8}px)`:'none';i.style.transform=`scaleX(${eo((t-a-.1)/.8)})`;}
  const LOGO_T=21.67,URL_T=24.29,END=26.5;
  function overlays(t){
    card(C1D,11.55,13.45,t);card(C2D,15.35,16.95,t);
    // the logo slams in on the hit, shakes out of the noise, a light runs across the metal; the site under it
    const lg=t>=LOGO_T;LOGO.style.opacity=lg?1-sm(END-.6,END-.05,t):0;
    if(lg){const g=1-sm(LOGO_T,LOGO_T+.7,t),j=Math.floor(t*30);LOGO.style.transform=`translateX(${g*(hash(j)-.5)*60}px) scale(${1+.18*Math.exp(-(t-LOGO_T)*9)-.03*sm(LOGO_T,END,t)})`;
      LOGO.style.filter=g>.02?`drop-shadow(${g*16}px 0 0 rgba(255,60,40,.75)) drop-shadow(${-g*16}px 0 0 rgba(60,200,255,.7))`:'none';
      LOGOh.style.setProperty('--sw',(sm(22.3,24.0,t)*160-30)+'%');URL.style.opacity=sm(URL_T,URL_T+.5,t);URL.style.letterSpacing=(.55+.2*(1-eo((t-URL_T)/1.4)))+'em';}
    // embers rising behind the logo
    EMBC.style.opacity=lg?1-sm(END-.6,END,t):0;if(lg){EX.clearRect(0,0,1920,1080);for(let i=0;i<180;i++){const s=hash(i*1.31),r=hash(i*2.71),y=1080-((r*1080+(t-LOGO_T)*(40+s*140))%1180),x=s*1920+Math.sin(t*.9+i)*30;
      const a=.25+.6*hash(i*5.1);EX.fillStyle=`rgba(255,${120+(i%5)*20},60,${a})`;EX.beginPath();EX.arc(x,y,1+s*2.4,0,6.283);EX.fill();}}
    // red bloom at the edges in the battle, off for the loss
    REDV.style.opacity=t>1&&t<10.6?.35:t>13.79&&t<LOGO_T?.3:0;
    // flashes: hard white frames on the big hits and the cuts
    let fl=0;const hit=(a,d,k)=>{if(t>=a&&t<a+d)fl=Math.max(fl,(k||1)*(1-(t-a)/d));};
    hit(1.0,.12,.9);hit(1.68,.1,.5);hit(C2_KILL,.12,.6);hit(4.28,.06,.5);hit(5.51,.06,.6);hit(6.51,.06,.5);hit(7.5,.06,.6);hit(8.34,.05,.4);hit(10.5,.5,1);
    hit(13.79,.1,.7);hit(15.0,.06,.5);hit(17.51,.06,.5);hit(18.25,.12,.5);hit(19.51,.06,.5);hit(20.51,.06,.5);hit(CAP_HIT,.3,.85);hit(LOGO_T,.35,1);
    FLASH.style.opacity=fl;
    let bl=0;if(t<1)bl=1;if(t>13.2&&t<13.79)bl=sm(13.2,13.7,t);if(t>=21.55)bl=1;
    if(t>10.55&&t<10.95)bl=Math.max(bl,0);BLACK.style.opacity=bl;
    LBX.style.opacity=1;}

  /* ======================= the clock ======================= */
  function frame(t){overlays(t);const S=SHOTS.find(s=>t>=s.a&&t<s.b);
    for(const s of DUST)s.visible=false;for(const T of TRAIL){T.f.visible=T.s.visible=false;}EMB.visible=false;for(const Hz of HAZE)Hz.s.visible=false;groundFires(t,null);
    if(S){if(S.dust===1)hogDust(t,hogAt,4.28);if(S.dust===2)hogDust(t,jumpAt,18.51);S.fn(t,(t-S.a)/(S.b-S.a));}
    else{R.setRenderTarget(null);R.setClearColor(0x000000);R.clear();}
    return true;}
  window.TRAILER={ready:false,frame,SHOTS,WD,HER,GH,LOGO_T,END};
  Promise.all(loads).then(()=>MODELS.idle(30000)).then(()=>{
    for(const s of SHOTS)s.fn((s.a+s.b)/2,.5);
    setTimeout(()=>{window.TRAILER.ready=true;},300);});
})();
