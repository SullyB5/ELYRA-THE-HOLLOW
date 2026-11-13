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
  /* (Nov 13, Bryce: "people running in the ground, vehicles hovering above it, clean it up A LOT") the ground a shot stands things on
     is the ground as drawn: the shore mesh's own triangles (its grid gets coarse away from the middle, so H() could be a metre or
     more off it), and Tide City's platform decks (flat, y = 3) wherever a point is on a platform */
  const GRD=WD.GROUND,GN=GRD.userData.n,GP=GRD.geometry.attributes.position;
  const inv=v=>Math.sign(v)*Math.pow(Math.min(1,Math.abs(v)/26000),1/2.3);
  const PLATW=WD.CITY.plats.map(P=>({x:SP.x+P.x,z:SP.z+P.z,r:P.r}));
  const _ta=V(),_tb=V(),_tc=V();
  function meshH(x,z){const fu=(inv(x)+1)/2*GN,fw=(inv(z+600)+1)/2*GN;const ix=cl(Math.floor(fu),0,GN-1),iy=cl(Math.floor(fw),0,GN-1),r=GN+1;
    const ia=ix+r*iy,ib=ix+r*(iy+1),ic=ix+1+r*(iy+1),id=ix+1+r*iy;
    const tri=(i,j,k)=>{_ta.fromBufferAttribute(GP,i);_tb.fromBufferAttribute(GP,j);_tc.fromBufferAttribute(GP,k);
      const d=(_tb.z-_tc.z)*(_ta.x-_tc.x)+(_tc.x-_tb.x)*(_ta.z-_tc.z);if(Math.abs(d)<1e-9)return null;
      const l1=((_tb.z-_tc.z)*(x-_tc.x)+(_tc.x-_tb.x)*(z-_tc.z))/d,l2=((_tc.z-_ta.z)*(x-_tc.x)+(_ta.x-_tc.x)*(z-_tc.z))/d,l3=1-l1-l2;
      return l1>=-1e-4&&l2>=-1e-4&&l3>=-1e-4?l1*_ta.y+l2*_tb.y+l3*_tc.y:null;};
    let h=tri(ia,ib,id);if(h==null)h=tri(ib,ic,id);if(h==null)h=WD.H(x,z);return h;}
  function onPlat(x,z){for(const P of PLATW)if((x-P.x)*(x-P.x)+(z-P.z)*(z-P.z)<P.r*P.r*.995)return true;return false;}
  const GH=(x,z)=>onPlat(x,z)?3:meshH(x,z);
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
  // stand A at p facing toward dir, playing clip at time ct; then set down so the lower foot's sole is on the ground under it
  const BN=n=>'mixamorig'+n;
  function bone(A,n){if(!A.m)return null;A.bn=A.bn||{};return A.bn[n]||(A.bn[n]=A.m.getObjectByName(BN(n))||A.m.getObjectByName('mixamorig:'+n));}
  const _fp=V();
  function sole(A,side){const t=bone(A,side+'ToeBase'),f=bone(A,side+'Foot');if(!t||!f)return null;const k=A.h/1.85;
    t.getWorldPosition(_fp);const ty=_fp.y-.035*k,tx=_fp.x,tz=_fp.z;f.getWorldPosition(_fp);const fy=_fp.y-.085*k;
    return fy<ty?{y:fy,x:_fp.x,z:_fp.z}:{y:ty,x:tx,z:tz};}
  function plant(A){A.g.updateMatrixWorld(true);const L=sole(A,'Left'),Rr=sole(A,'Right');if(!L||!Rr)return;
    const dl=GH(L.x,L.z)-L.y,dr=GH(Rr.x,Rr.z)-Rr.y;A.g.position.y+=Math.max(dl,dr);A.g.updateMatrixWorld(true);}
  function pose(A,p,dir,clip,ct,o){A.g.visible=true;A.g.position.copy(p);A.g.lookAt(_f.copy(p).add(dir));if(!A.mx)return;
    for(const k in A.acts){const a=A.acts[k];if(k===clip){if(!a.isRunning())a.play();a.weight=1;}else a.stop();}
    A.mx.setTime(((ct%A.dur[clip])+A.dur[clip])%A.dur[clip]);if(!(o&&o.noPlant))plant(A);}
  // each clip's own ground speed, measured off its feet (how fast the planted foot slides back under the body), so a figure's
  // stride matches how far it moves and its feet don't skate: poseD(A, p, dir, clip, metres travelled)
  function gait(A,clip){A.sp=A.sp||{};if(A.sp[clip])return A.sp[clip];if(!A.mx)return clip==='Running'?5:1.4;
    const p0=A.g.position.clone(),q0=A.g.quaternion.clone(),vis=A.g.visible;A.g.position.set(0,0,0);A.g.quaternion.identity();
    for(const k in A.acts){const a=A.acts[k];if(k===clip){a.play();a.weight=1;}else a.stop();}
    const N=90,d=A.dur[clip],S={Left:[],Right:[]};
    for(let i=0;i<=N;i++){A.mx.setTime(i/N*d);A.g.updateMatrixWorld(true);for(const sd of['Left','Right']){const b=bone(A,sd+'ToeBase');b.getWorldPosition(_fp);S[sd].push([_fp.y,_fp.z]);}}
    let sum=0,n=0;for(const sd of['Left','Right']){const ys=S[sd].map(v=>v[0]),mn=Math.min(...ys),mx=Math.max(...ys),lim=mn+(mx-mn)*.12;
      for(let i=0;i<N;i++)if(S[sd][i][0]<lim&&S[sd][i+1][0]<lim){sum+=-(S[sd][i+1][1]-S[sd][i][1])/(d/N);n++;}}
    let v=n?sum/n:0;if(!(v>.4&&v<12))v=clip==='Running'?5:1.4;
    A.g.position.copy(p0);A.g.quaternion.copy(q0);A.g.visible=vis;return A.sp[clip]=v;}
  const poseD=(A,p,dir,clip,dist,ph)=>pose(A,p,dir,clip,dist/gait(A,clip)+(ph||0));
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


  /* ======================= Tide City at street level (Nov 13, Bryce: "not all right outside the city, maybe in the city for some") =======================
     The platforms' decks are flat at y = 3 with the towers standing on them. lane() finds a street: a straight run across a deck
     that stays clear of every tower by W metres (its walls close on both sides), preferring ones that look toward the Spear. */
  const TW=WD.CITY.towers;
  const clearAt=(x,z)=>{let m=1e9;for(const T of TW){const d=Math.hypot(x-T.x,z-T.z)-T.fp*.72;if(d<m)m=d;}return m;};
  let _ls=9137;const lr=()=>{_ls=(_ls*16807)%2147483647;return(_ls-1)/2147483646;};
  const LANES=[];
  function lane(o){let best=null,bs=-1e9;
    for(let k=0;k<2500;k++){const P=PLATW[(lr()*PLATW.length)|0],a0=lr()*6.283,rr=Math.sqrt(lr())*P.r*.85,ox=P.x+Math.cos(a0)*rr,oz=P.z+Math.sin(a0)*rr;
      const an=lr()*6.283,d=V(Math.cos(an),0,Math.sin(an));let ok=true,sum=0,n=0;
      for(let s=0;s<=o.L;s+=5){const x=ox+d.x*s,z=oz+d.z*s,sp=Math.hypot(x-SP.x,z-SP.z);
        if(sp<(o.minSp||210)||sp>(o.maxSp||2600)||(o.inner&&s===0&&!onPlat(x-d.x*o.inner,z-d.z*o.inner))||!onPlat(x-d.z*o.W,z+d.x*o.W)||!onPlat(x+d.z*o.W,z-d.x*o.W)){ok=false;break;}
        const c=clearAt(x,z);if(c<o.W){ok=false;break;}sum+=Math.min(c,o.W+60);n++;}
      if(!ok)continue;const mean=sum/n,mid=V(ox+d.x*o.L/2,3,oz+d.z*o.L/2);
      if(LANES.some(Q=>Q.mid.distanceTo(mid)<240))continue;
      const toS=V(SP.x-ox,0,SP.z-oz).normalize();
      const sc=-Math.abs(mean-(o.W+10))+(o.toward||0)*30*d.dot(toS)-(o.far||0)*Math.hypot(mid.x-SP.x,mid.z-SP.z)*.01;
      if(sc>bs){bs=sc;best={o:V(ox,3,oz),d,s:V(-d.z,0,d.x),L:o.L,W:o.W,mid,mean,name:o.name};}}
    if(!best)console.warn('no lane '+o.name);else LANES.push(best);return best;}
  const LH=lane({name:'hog',L:180,W:9,toward:1,far:1,inner:120}),LB=lane({name:'hollow',L:110,W:7,toward:1,far:1}),
    LM=lane({name:'mech',L:130,W:10,toward:1,far:1}),LW=lane({name:'walk',L:90,W:7,toward:1,far:1});
  const at=(Ln,a,s,y)=>Ln.o.clone().addScaledVector(Ln.d,a).addScaledVector(Ln.s,s||0).add(V(0,y==null?0:y,0));
  window.__lanes=LANES.map(L=>({name:L.name,o:L.o.toArray().map(v=>v|0),d:L.d.toArray().map(v=>+v.toFixed(2)),mean:L.mean|0}));

  // a street dressed for the war: wrecked cars, barricades, crates, rubble, lamps; each lane's set is only shown in its shot
  const concM=new THREE.MeshStandardMaterial({color:0x6a7080,roughness:.85,metalness:.15}),stripeM=new THREE.MeshStandardMaterial({color:0x0c1a22,emissive:0x5ad2ff,emissiveIntensity:1.2});
  const darkM=new THREE.MeshStandardMaterial({color:0x2a2c34,roughness:.6,metalness:.5}),seamM=new THREE.MeshStandardMaterial({color:0x12081a,emissive:0xa45cff,emissiveIntensity:1.3});
  const burntM=new THREE.MeshStandardMaterial({color:0x1c1a1c,roughness:.9,metalness:.3});
  function propModel(name,size,axis,G,p,ry,o){o=o||{};loads.push(MODELS.copy(name).then(({scene:s})=>{MODELS.tame(s,.45);
      if(o.burnt)s.traverse(q=>{if(q.isMesh){q.material=q.material.clone();q.material.color.multiplyScalar(.35);q.material.emissive=C(0);}});
      const {o:g}=MODELS.fit(s,{size,axis:axis||'z',floor:true});g.position.copy(p);g.rotation.set(o.rx||0,ry||0,o.rz||0);g.traverse(q=>{if(q.isMesh){q.castShadow=q.receiveShadow=true;}});G.add(g);}).catch(()=>{}));}
  function box(G,m,w,h,d,p,ry,rx,rz){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.copy(p).add(V(0,h/2,0));b.rotation.set(rx||0,ry||0,rz||0);b.castShadow=b.receiveShadow=true;G.add(b);return b;}
  function dress(Ln,o){o=o||{};const G=new THREE.Group();G.visible=false;scene.add(G);const yaw=Math.atan2(Ln.d.x,Ln.d.z),FI=[];if(!Ln)return{G,FI};
    const r=(i)=>hash(i*3.7+Ln.o.x*.01);
    // cars wrecked against the walls, some burning
    for(let i=0;i<(o.cars||5);i++){const a=10+i*(Ln.L-20)/Math.max(1,(o.cars||5)-1)+(r(i)-.5)*10,sd=(i%2?1:-1)*(Ln.W-2.5-r(i+1)*2),p=at(Ln,a,sd);
      propModel('tide-hovercar',5.2,'z',G,p,yaw+(r(i+2)-.5)*2.4,{burnt:1,rx:(r(i+3)-.5)*.12,rz:(r(i+4)-.5)*.5});if(i%2===0)FI.push([p.x,.8,p.z,3.5+r(i)*2]);}
    // Keeper barricades: concrete blocks with a blue band, set across part of the street
    for(let i=0;i<(o.bars||4);i++){const a=18+r(i+9)*(Ln.L-30),sd=(r(i+10)-.5)*Ln.W*1.4,p=at(Ln,a,sd),ry=yaw+Math.PI/2+(r(i+11)-.5)*.6;
      box(G,concM,3.6,1.1,.7,p,ry);const s=box(G,stripeM,3.62,.12,.72,p.clone().add(V(0,.75,0)),ry);}
    // crates and rubble
    for(let i=0;i<(o.crates||6);i++){const a=r(i+20)*Ln.L,sd=(i%2?1:-1)*(Ln.W-1.2-r(i+21)*3);propModel('ammo-crate',1.1+r(i)*.6,'x',G,at(Ln,a,sd),r(i+22)*6);}
    for(let i=0;i<(o.rubble||14);i++){const a=r(i+30)*Ln.L,sd=(i%2?1:-1)*(2.5+r(i+31)*(Ln.W-2)),s=.5+Math.pow(r(i+32),2)*1.4;box(G,i%3?concM:burntM,s,s*.45,s*.8,at(Ln,a,sd,-.1),r(i+33)*6,(r(i+34)-.5)*.5,(r(i+35)-.5)*.5);}
    // Hollow hull plates thrown into the street, violet light in their seams
    for(let i=0;i<(o.plates||3);i++){const a=20+r(i+40)*(Ln.L-30),sd=(r(i+41)-.5)*Ln.W,p=at(Ln,a,sd),b=box(G,darkM,4+r(i)*3,.25,2.5+r(i+1)*2,p,r(i+42)*6,(r(i+43)-.5)*.4,(r(i+44)-.5)*.3);
      const e=new THREE.Mesh(new THREE.BoxGeometry(3,.06,.15),seamM);e.position.set(0,.15,.4);b.add(e);}
    // street lamps along both walls
    for(let a=6;a<Ln.L;a+=24)for(const sd of[-1,1]){const p=at(Ln,a,sd*(Ln.W+4));box(G,darkM,.25,7,.25,p,0);const l=add(0x8fe6ff,3.2,.85);l.position.copy(p).add(V(0,7.2,0));G.add(l);}
    // the street itself: dark worn paving over the deck, Keeper guide lines down its middle
    {const t=new THREE.TextureLoader().load('img/tex/metal015-pc.jpg'),n=new THREE.TextureLoader().load('img/tex/metal015-n-pc.jpg');
      for(const q of[t,n]){q.wrapS=q.wrapT=THREE.RepeatWrapping;q.repeat.set((Ln.W*2+40)/7,(Ln.L+60)/7);q.anisotropy=8;}
      const pm=new THREE.Mesh(new THREE.PlaneGeometry(Ln.W*2+40,Ln.L+60),new THREE.MeshStandardMaterial({color:0x34373e,map:t,normalMap:n,roughness:.8,metalness:.25}));
      pm.rotation.x=-Math.PI/2;pm.rotation.z=yaw;pm.position.copy(at(Ln,Ln.L/2,0,.03));pm.receiveShadow=true;G.add(pm);
      for(let a=4;a<Ln.L;a+=9){const l=new THREE.Mesh(new THREE.PlaneGeometry(.25,4.5),stripeM);l.rotation.x=-Math.PI/2;l.rotation.z=yaw;l.position.copy(at(Ln,a,0,.05));G.add(l);}}
    return{G,FI};}
  WD.CITY.mats.baseMat.color.setHex(0x2a2e36);WD.CITY.mats.baseMat.roughness=.95;
  const SETH=dress(LH,{cars:6,bars:3}),SETB=dress(LB,{cars:4,bars:3,plates:4}),SETM=dress(LM,{cars:5,bars:4}),SETW=dress(LW,{cars:5,bars:2,crates:4});
  const SETS=[SETH,SETB,SETM,SETW];const SETS_=SETS;
  // a vehicle set down on its four wheels on the ground under them (pitch and roll from the wheel heights), nose toward dir
  function placeVeh(G,p,dir,o){o=o||{};const f=V(dir.x,0,dir.z).normalize(),r=V(-f.z,0,f.x),wb=o.wb||1.6,tr=o.tr||.9;
    const h=(a,b)=>GH(p.x+f.x*a+r.x*b,p.z+f.z*a+r.z*b);const fl=h(wb,-tr),fr=h(wb,tr),bl=h(-wb,-tr),br=h(-wb,tr);
    const y=(fl+fr+bl+br)/4;G.visible=true;G.position.set(p.x,y+(o.lift||0),p.z);G.lookAt(_f.copy(G.position).sub(f));
    G.rotateX(Math.atan2((fl+fr)/2-(bl+br)/2,wb*2));G.rotateZ(Math.atan2((fr+br)/2-(fl+bl)/2,tr*2));return y;}

  /* ======================= the shots ======================= */
  const shakeV=V();function shake(a,t,f){f=f||1;shakeV.set(Math.sin(t*37*f)*a+Math.sin(t*61*f)*a*.4,Math.sin(t*41*f+1)*a+Math.sin(t*67*f)*a*.4,Math.sin(t*29*f+2)*a*.6);cam.position.add(shakeV);}
  function lens(fov){if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix();}}
  const rimL=new THREE.PointLight(0x7fc8ff,0,30,1.6);scene.add(rimL);
  function world(t,o){o=o||{};OUT.value=o.out==null?.45:o.out;WD.skyU.hor.value.setHex(0x16284c).lerp(C(0x52161a),o.red==null?.8:o.red);scene.fog.color.copy(WD.skyU.hor.value);
    heralds(t);fires(t);beams(t);
    for(const A of ACT)A.g.visible=false;for(const g of RAV.concat(WRA,VAN,[BOMB,DROP]))g.visible=false;for(const g of RAV.concat(VAN))g.userData.ign.material.opacity=0;
    HOG.g.visible=MECH.g.visible=false;rimL.intensity=0;for(const S of SETS)S.G.visible=false;if(typeof SETA!=='undefined')SETA.G.visible=false;if(GU){GU.sat.value=o.sat==null?sat0:o.sat;GU.contrast.value=o.con==null?con0:o.con;}}
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
    SQ1.forEach(([dx,dz],i)=>{const x=lead+dx,z=C1.z+dz;poseD(SQ[i],V(x,GH(x,z),z),C1.d,'Running',(t-1)*C1.v,i*.23);});
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

  /* ---- 3 · 4.28–5.51 · THE ROCKET HOG: flat out down a Tide City street, rockets into the Hollow barricade at its end ---- */
  const H3={a0:28,v:31};
  const hogAt=t=>at(LH,H3.a0+(t-4.28)*H3.v,-1.5);
  {const tgt=at(LH,LH.L-6,0,1.6);
    [[4.6,-.6],[4.68,.6],[4.84,-.6],[4.92,.6]].forEach(([t0,s2],i)=>{const a=hogAt(t0).add(V(0,2.3,0)).addScaledVector(LH.s,s2);missile(a,tgt.clone().addScaledVector(LH.s,i*2-3),t0,.42+i*.02,{arc:3,wob:.5,size:4,boom:i===3?16:9});});
    boom(at(LH,LH.L-2,4,1),5.34,12,{bright:8,reach:30});}
  // the Hollow barricade the rockets hit: dark plates and violet seams across the street's end
  {const G=SETH.G,yaw=Math.atan2(LH.d.x,LH.d.z);for(let i=-2;i<=2;i++){const b=box(G,darkM,3.4,2.6,.5,at(LH,LH.L-6,i*3.3),yaw+Math.PI/2+(hash(i)-.5)*.3);
    const e=new THREE.Mesh(new THREE.BoxGeometry(2.8,.08,.1),seamM);e.position.set(0,.5,.28);b.add(e);}}
  shot(4.28,5.51,(t,u)=>{world(t);SETH.G.visible=true;const p=hogAt(t);placeVeh(HOG.g,p,LH.d);HOG.g.position.y+=Math.abs(Math.sin(t*19))*.03;
    const c=at(LH,64,LH.W-3.2,1.0);cam.position.copy(c).addScaledVector(LH.d,-u*2);cam.lookAt(V().lerpVectors(p.clone().add(V(0,1.2,0)),at(LH,LH.L,0,4),sm(4.85,5.35,t)*.75));lens(36);
    shake(.03+.22*Math.exp(-Math.abs(t-4.9)*6),t,1.4);
    groundFires(t,Object.assign(SETH.FI.concat([[at(LH,LH.L-6).x,1,at(LH,LH.L-6).z,7]]),{L:at(LH,LH.L-10,0,6),Li:3,Ld:90}));
    haze(t,at(LH,LH.L-25),30,.4,0x3a3036);embers(t,cam.position,12,.35);fx(t);draw(t);});
  const DUST=[];for(let i=0;i<18;i++){const s=puff(0x6a6470);scene.add(s);DUST.push(s);}
  function hogDust(t,pFn,t0){DUST.forEach((s,i)=>{const age=(i/DUST.length)*1.2,tt=t-age;s.visible=tt>t0;if(!s.visible)return;const p=pFn(tt);s.position.set(p.x+(hash(i)-.5)*1.5,p.y+.4+age*1.4,p.z+(hash(i+3)-.5)*1.5);
    s.scale.setScalar(1.5+age*6);s.material.opacity=.38*(1-age/1.2);});}
  SHOTS[SHOTS.length-1].dust=1;

  /* ---- 4 · 5.51–6.51 · THE HOLLOW come down a street out of the smoke, firing; a Keeper round takes the lead in the chest ---- */
  const H4={v:4.4};
  const holAt=(i,t)=>{const col=[0,-1,1,-2,2][i],row=[0,1,1,2,2][i];return at(LB,17+row*3.4-(t-5.51)*H4.v,col*2.6+(hash(i)-.5)*.8);};
  {const camP=at(LB,1,.6,0);
    for(let i=0;i<5;i++){const gun=t=>holAt(i,t).add(V(0,1.3,0)).addScaledVector(LB.d,-.6).addScaledVector(LB.s,.35);
      muzzle(gun,5.51+i*.05,6.6,9+i,{col:0xc080ff,size:1.1,light:i===0?14:0,li:2});
      for(let k=0;k<7;k++){const t0=5.55+k*.12+i*.03;bolt(gun(t0),camP.clone().add(V(0,.6+hash(k+i)*3,0)).addScaledVector(LB.s,(hash(i*7+k)-.5)*9).addScaledVector(LB.d,-4),t0,{col:0xb46cff,sp:180,len:7,w:.18});}}
    bolt(at(LB,-1,.6,1.3),holAt(0,6.32).add(V(0,1.4,0)),6.25,{col:0x9fe8ff,sp:420,len:10,w:.22,hit:1.4});}
  shot(5.51,6.51,(t,u)=>{world(t);SETB.G.visible=true;
    for(let i=0;i<5;i++)poseD(HOL[i],holAt(i,t),V(0,0,0).sub(LB.d),'Running',(t-5.51)*H4.v,i*.31);
    cam.position.copy(at(LB,-1.5,1.2,1.05));cam.lookAt(at(LB,22,.3,2.3));lens(36-u*4);shake(.05+(t>6.3?.3:0),t,1.5);
    haze(t,at(LB,22),16,.7,0x2e2630);
    groundFires(t,Object.assign(SETB.FI.concat([[at(LB,30,-3).x,1,at(LB,30,-3).z,5],[at(LB,34,4).x,1,at(LB,34,4).z,6]]),{L:at(LB,30,0,4),Li:4.5,Ld:70}));
    embers(t,at(LB,12,0,2),12,.6);fx(t);draw(t);});

  /* ---- 5 · 6.51–7.50 · THE FLEET: the Herald ships burning the districts; a Keeper wing tears past the camera into them ---- */
  [[1,6.4,7.6,50],[2,6.45,7.6,60],[3,6.55,7.6,40],[4,6.6,7.6,36],[1,6.9,7.6,46]].forEach(([i,a,b,w],k)=>beam(belly(i),towerAt(k+3),a,b,w));
  {for(let i=0;i<10;i++)boom(V(SP.x-1400+hash(i*3)*2800,700+hash(i*5)*900,SP.z-600-hash(i*7)*1400),6.52+i*.09,34+hash(i)*30,{sparks:20,smoke:2,life:1.6,bright:1.5,reach:8});}
  const C5={cam:V(1300,140,-760)};
  shot(6.51,7.5,(t,u)=>{world(t);
    for(let k=0;k<5;k++){const d=V(-.55,.22,-1).normalize(),p0=C5.cam.clone().add(V(10+k*9,-4+(k%2)*5,40+k*22)),p=p0.addScaledVector(d,(t-6.51-k*.06)*230);fly(RAV[k],p,d,-.5);RAV[k].userData.ign.material.opacity=.9;RAV[k].userData.ign.scale.setScalar(10);RAV[k].userData.ign.position.z=11;}
    cam.position.copy(C5.cam).add(V(-u*20,u*6,0));cam.lookAt(SP.x-500,900+u*60,SP.z-1600);lens(46);shake(.5*Math.exp(-Math.abs(t-6.66)*5),t,1.2);fx(t);draw(t);});

  /* ---- 6 · 7.50–8.34 · THE MECH: planted in a Tide City street, both guns open down it ---- */
  const MA=26;
  {const mp=at(LM,MA);
    for(const i of[0,1]){muzzle(t=>mechMuz(i,1.6),7.5,8.4,12,{col:0x9ff4ff,size:3.2,light:i?0:40,li:6});
      for(let k=0;k<11;k++){const t0=7.5+k*.083+i*.04;bolt(at(LM,MA+2,i?2.6:-2.6,5.6),at(LM,LM.L,(hash(k+i*9)-.5)*LM.W*1.4,1+hash(k*3)*6),t0,{col:0x9ff4ff,sp:520,len:22,w:.5});}}
    for(let k=0;k<4;k++)boom(at(LM,LM.L-10-hash(k)*30,(hash(k*4)-.5)*LM.W*1.2,.5),7.75+k*.16,7,{sparks:25,bright:3});}
  shot(7.5,8.34,(t,u)=>{world(t);SETM.G.visible=true;const mp=at(LM,MA);
    MECH.g.visible=true;MECH.g.position.copy(mp);MECH.g.lookAt(_f.copy(mp).sub(LM.d));if(MECH.rig)MODELS.mechPose(MECH.rig,.4,.15,.5+.5*Math.sin(t*75));
    cam.position.copy(at(LM,MA-9+u*1.2,6.5,1.4));cam.lookAt(at(LM,MA+6,-1,4.8));lens(42);
    rimL.position.copy(at(LM,MA-4,4,7));rimL.intensity=3;rimL.distance=40;shake(.12,t,2.2);
    haze(t,at(LM,MA+40),30,.4);groundFires(t,Object.assign(SETM.FI,{L:at(LM,MA+30,0,3),Li:3}));
    embers(t,at(LM,MA,0,3),12,.5);fx(t);draw(t);});

  /* ---- 7 · 8.34–10.60 · THE BOMBER RUN: the squad runs for it as a Hollow bomber walks its bombs up the beach to the camera ---- */
  const C7={x:-1200,z:-120};
  const bombAt=t=>{const z=C7.z-560+(t-8.34)*255;return V(C7.x+6,GH(C7.x,C7.z)+34+(t-8.34)*3,z);};
  {const BT7=[8.7,8.98,9.24,9.48,9.7,9.9,10.08,10.24,10.4,10.53];
    BT7.forEach((t0,i)=>{const z=C7.z-330+i*(330/(BT7.length-1))*1.02,x=C7.x+(i%2?5:-5)+(hash(i)-.5)*8;boom(V(x,GH(x,z),z),t0,7+i*.9,{purple:i%3===0,dust:1,sparks:50,bright:8+i,reach:26});});}
  shot(8.34,10.6,(t,u)=>{world(t);
    const bp=bombAt(t);fly(BOMB,bp,V(0,0,1),Math.sin(t*2)*.05);
    for(let i=0;i<3;i++){const z=C7.z-22+(t-8.34)*6.6+i*2.4,x=C7.x+(i-1)*3.4;poseD(SQ[i+1],V(x,GH(x,z),z),V(0,0,1),'Running',(t-8.34)*6.6,i*.4);}
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
    for(let i=0;i<3;i++){const x=C8.x+(i-1)*2.6+(i===1?0:.4),z=C8.z-3-(i===1?1.2:0)-(t-10.6)*.35;poseD(SQ[i],V(x,GH(x,z),z),V(0,0,-1),'Walking',(t-10.6)*.35,i*.5);}
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

  /* ---- 10 · 15.00–17.00 · MICHAEL walks down a burning street toward us, the squad behind him. "NOW WE TAKE IT BACK" ---- */
  const W10=1.25;
  shot(15.0,17.0,(t,u)=>{world(t,{out:.5,red:.7});SETW.G.visible=true;const a=16-(t-15)*W10,back=V(0,0,0).sub(LW.d),dist=(t-15)*W10;
    poseD(SQ[0],at(LW,a,0),back,'Walking',dist);const mp=at(LW,a,0);rimL.position.copy(mp).add(V(0,2.5,0)).addScaledVector(LW.d,-4);rimL.intensity=2.2;rimL.distance=14;
    poseD(SQ[1],at(LW,a+3.5,-3),back,'Walking',dist,.4);poseD(SQ[2],at(LW,a+4.2,3.2),back,'Walking',dist,.7);
    cam.position.copy(at(LW,a-5.4+u*.4,.4,1.05));cam.lookAt(at(LW,a+2,0,1.75));lens(30);shake(.02,t,.6);
    groundFires(t,Object.assign(SETW.FI.concat([[at(LW,a+12,-4).x,1,at(LW,a+12,-4).z,6],[at(LW,a+14,5).x,1,at(LW,a+14,5).z,7],[at(LW,a+22,0).x,1,at(LW,a+22,0).z,10],[at(LW,a+17,-6).x,1,at(LW,a+17,-6).z,5]]),{L:at(LW,a+10,0,3),Li:6,Ld:60}));
    haze(t,at(LW,a+16),16,.6,0x2a2226);embers(t,at(LW,a+3,0,1),8,1);fx(t);draw(t);});

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
  const JA=V(C13.x,0,C13.z-34),JB=V(C13.x,0,C13.z+12),JT0=18.62,JT1=19.4,JV=(JB.z-JA.z)/(JT1-JT0);
  const jumpAt=t=>{if(t<JT0){const z=JA.z-(JT0-t)*JV;return V(C13.x,GH(C13.x,z),z);}if(t>JT1){const z=JB.z+(t-JT1)*JV*.6;return V(C13.x,GH(C13.x,z),z);}
    const k=(t-JT0)/(JT1-JT0),p=V().lerpVectors(JA,JB,k);p.y=lerp(GH(JA.x,JA.z),GH(JB.x,JB.z),k)+Math.sin(k*Math.PI)*7.5;return p;};
  {boom(V(C13.x+16,0,C13.z-60).setY(GH(C13.x+16,C13.z-60)),18.56,9,{dust:1,bright:5});boom(jumpAt(19.4).add(V(0,0,0)),19.41,4,{dust:1,sparks:10,smoke:6,bright:1});}
  shot(18.51,19.51,(t,u)=>{world(t);const p=jumpAt(t),q=jumpAt(t+.03),d=q.clone().sub(p).normalize();
    if(t<JT0||t>JT1)placeVeh(HOG.g,p,V(0,0,1));else{HOG.g.visible=true;HOG.g.position.copy(p);HOG.g.lookAt(_f.copy(p).sub(d));}
    cam.position.set(C13.x+5.5,GH(C13.x+5.5,C13.z+4)+.7,C13.z+4);cam.lookAt(V().lerpVectors(V(C13.x,GH(C13.x,C13.z-20)+3,C13.z-20),p.clone().add(V(0,1,0)),.7));lens(34);
    shake(.04+.5*Math.exp(-Math.max(0,t-19.41)*8)*(t>19.41?1:0),t,1.6);
    haze(t,V(C13.x,0,C13.z-30),40,.3,0x5a4a42);groundFires(t,Object.assign([[C13.x-20,0,C13.z-70,8],[C13.x+30,0,C13.z-90,10]],{L:V(C13.x,GH(C13.x,C13.z)+8,C13.z-60),Li:3}));
    embers(t,cam.position,10,.3);fx(t);draw(t);});
  SHOTS[SHOTS.length-1].dust=2;

  /* ---- 14 · 19.51–20.51 · the Hollow come up the great avenue to the Spear; the mech's cannons land in their ranks ---- */
  // the avenue: the clear way from the shore to the Spear's foot (world.js keeps it free of towers), on the line x = SP.x + 0.15 z
  const AV=(lz,lx)=>{const z=SP.z+lz,x=SP.x+lz*.15+(lx||0);return V(x,3,z);};const AVD=V(.15,0,1).normalize();
  const ranks=(i,t)=>{const col=i%6-2.5,row=Math.floor(i/6);return AV(300+row*5-(t-19.5)*1.6,col*4.2+(hash(i)-.5)*1.4);};
  const M14=AV(255,9);
  const SETA=dress({o:AV(200),d:AVD,s:V(-AVD.z,0,AVD.x),L:200,W:40,mid:AV(300),name:'avenue'},{cars:8,bars:6,crates:6,rubble:20,plates:5});
  {[19.58,19.8,20.02,20.2,20.36].forEach((t0,k)=>{const tg=ranks(k*4+1,t0+.15);const from=M14.clone().add(V(k%2?2.6:-2.6,5.6,0)).addScaledVector(AVD,3);bolt(from,tg,t0,{col:0xbff8ff,sp:700,len:30,w:1.1});boom(tg,t0+from.distanceTo(tg)/700,6,{sparks:60,smoke:5,bright:3,reach:20,purple:k%2===1,halo:5});});
    for(const i of[0,1])muzzle(t=>mechMuz(i,1.8),19.55,20.5,5.5,{col:0xbff8ff,size:3.4,light:i?0:40,li:4});}
  shot(19.51,20.51,(t,u)=>{world(t);SETA.G.visible=true;
    for(let i=0;i<18;i++){const T=HOL[i%HOL.length];poseD(T,ranks(i,t),V(0,0,0).sub(AVD),'Walking',(t-19.5)*1.6,i*.27);}
    MECH.g.visible=true;MECH.g.position.copy(M14);MECH.g.lookAt(_f.copy(M14).sub(AVD));MECH.g.rotateY(-.05);if(MECH.rig)MODELS.mechPose(MECH.rig,.2,.1,Math.max(0,Math.sin((t-19.55)*5.5*6.283)));
    cam.position.copy(AV(326-u*2,7)).add(V(0,1.7,0));cam.lookAt(AV(255,6).add(V(0,9,0)));lens(34);
    const bk=BOOMS.reduce((m,B)=>{const a=t-B.t0;return a>0&&a<.4&&B.s>8&&B.s<12?Math.max(m,1-a/.4):m;},0);shake(.05+bk*.35,t,1.6);
    haze(t,AV(310),30,.28,0x2e2630);groundFires(t,Object.assign([[AV(318,-16).x,1,AV(318,-16).z,7],[AV(326,15).x,1,AV(326,15).z,9],[AV(285,-25).x,1,AV(285,-25).z,6]],{L:AV(310,0).add(V(0,5,0)),Li:3}));
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
  const LOGO=el('<h1>ELYRA</h1><div class="lsub"><b>THE HOLLOW</b></div><div class="url">ELYRATHEHOLLOW.COM</div>','layer logo'),LOGOh=LOGO.querySelector('h1'),URL=LOGO.querySelector('.url');
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
      LOGOh.style.setProperty('--sw',(sm(22.3,24.0,t)*160-30)+'%');URL.style.opacity=sm(URL_T,URL_T+.5,t);{const ls=(.55+.2*(1-eo((t-URL_T)/1.4)))+'em';URL.style.letterSpacing=ls;URL.style.paddingLeft=ls;}}
    // embers rising behind the logo
    EMBC.style.opacity=lg?1-sm(END-.6,END,t):0;if(lg){EX.clearRect(0,0,1920,1080);for(let i=0;i<180;i++){const s=hash(i*1.31),r=hash(i*2.71),y=1080-((r*1080+(t-LOGO_T)*(40+s*140))%1180),x=(i%2?1920-s*1920:s*1920)+Math.sin(t*.9+i)*30;
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
