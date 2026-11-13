/* ELYRA trailer · the White City (Pathfinder Arc 03) and its dome, built for the trailer's two shots after the level's plan
   (js/pathfinder3/01-world.js): Astraea at night under the alien sky, a city nobody built in the middle of the red desert, smooth
   jointless white stone with gold threads in it, a wall 520 m out and 110 m high with one round opening facing south, streets
   climbing to a tower 300 m high at the heart, the Herald war burning in it. The dome is the level's own shader.
   WCITY(R) → {render(t, shot, u)}  shot 0: the city through the ring;  shot 1: the dome rising, holding, its first flicker. */
const WCITY=(R=>{
  const V=(x,y,z)=>new THREE.Vector3(x,y,z),C=h=>new THREE.Color(h);
  const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  const S=new THREE.Scene(),cam=new THREE.PerspectiveCamera(36,16/9,2,30000);
  const WR=520,WH=110,WT=14,GATE={y:58,r:34},TW={r:70,h:300};
  S.fog=new THREE.FogExp2(0x232c46,.00036);
  const tx=(n,rep)=>{const t=new THREE.TextureLoader().load('img/tex/'+n+'-pc.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(rep)t.repeat.set(rep,rep);return t;};
  const glow=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  const add=(c,sc,op,p)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:c,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,toneMapped:false,opacity:op==null?1:op}));s.scale.setScalar(sc);if(p)s.position.copy(p);S.add(s);return s;};
  const U={t:{value:0},wake:{value:0}};

  /* ---------- the sky: Bryce's alien sky (the blue one) over the city, a dark horizon under it ---------- */
  const skyU={photo:{value:null},hor:{value:C(0x2c3352)},mid:{value:C(0x0e1430)},zen:{value:C(0x02030c)},domeK:{value:0}};
  new THREE.TextureLoader().load('img/sky/nebula-green-pc.jpg',t=>{skyU.photo.value=t;});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(20000,64,32),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D photo;uniform vec3 hor,mid,zen;uniform float domeK;varying vec3 vD;
      void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(hor,mid,smoothstep(-.02,.2,y));c=mix(c,zen,smoothstep(.15,.75,y));
        vec2 pu=vec2(atan(d.z,d.x)/6.2831853+.5+.3,asin(clamp(y,-1.,1.))/3.1415927*.5+.75);vec3 pc=pow(texture2D(photo,pu).rgb,vec3(2.2))*.62;pc=pc/(1.+pc*.8);
        c=mix(c,c*.4+pc,smoothstep(-.05,.3,y));
        c=mix(c,c+vec3(.25,.32,.5)*.35,domeK*smoothstep(.5,-.1,y));
        gl_FragColor=vec4(c,1.);}`}));
  S.add(sky);

  /* ---------- light ---------- */
  const key=new THREE.DirectionalLight(0xb8c8f0,1.35);key.position.set(-900,1400,-600);S.add(key);
  key.castShadow=true;key.shadow.mapSize.set(4096,4096);{const c=key.shadow.camera;c.left=c.bottom=-800;c.right=c.top=800;c.near=100;c.far=4000;key.shadow.bias=-.0005;key.shadow.normalBias=1.5;}
  const hemi=new THREE.HemisphereLight(0x6a7ab0,0x3a2a2a,.62);S.add(hemi);
  const domeL=new THREE.PointLight(0xb8d0ff,0,3000,1.1);domeL.position.set(0,420,0);S.add(domeL);

  /* ---------- the stone ---------- */
  const grainT=tx('rock');
  function stone(o){o=o||{};const m=new THREE.MeshStandardMaterial({color:o.color||0xd2cec6,roughness:.32,metalness:.05,emissive:C(0xc89a44),emissiveIntensity:o.em==null?.07:o.em,side:o.side||THREE.FrontSide});
    m.onBeforeCompile=sh=>{sh.uniforms.uT=U.t;sh.uniforms.uWake=U.wake;sh.uniforms.tG={value:grainT};
      sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 wq=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nwq=instanceMatrix*wq;\n#endif\nvWP=(modelMatrix*wq).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
      sh.fragmentShader='uniform float uT,uWake;uniform sampler2D tG;varying vec3 vWP;varying vec3 vWN;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        {vec3 bw=pow(abs(normalize(vWN)),vec3(4.));bw/=(bw.x+bw.y+bw.z);vec3 gr=texture2D(tG,vWP.zy*.05).rgb*bw.x+texture2D(tG,vWP.xz*.05).rgb*bw.y+texture2D(tG,vWP.xy*.05).rgb*bw.z;
         diffuseColor.rgb*=mix(1.,clamp(.75+dot(gr,vec3(.33))*.6,.7,1.15),.35);}`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        float hk=clamp(vWP.y/160.,0.,1.);totalEmissiveRadiance*=(.75+.5*hk);
        float lowK=1.-smoothstep(0.,60.,vWP.y);float turn=1.-clamp(dot(normalize(vWN),vec3(-.55,.62,-.3)),0.,1.);
        totalEmissiveRadiance+=vec3(.62,.42,.12)*(.03+.05*lowK)*(.5+.5*turn);
        // the gold threads: thin lines running round the stone, a few climbing it
        float th=smoothstep(.985,1.,sin(vWP.y*.55+sin(vWP.x*.02+vWP.z*.017)*3.))*step(.5,fract(sin(dot(floor(vWP.xz/30.),vec2(12.9898,78.233)))*43758.5453));
        totalEmissiveRadiance+=vec3(1.,.72,.3)*th*(.35+1.1*uWake);
        float wv=uWake*(.5+.5*sin(vWP.y*.06-uT*1.6));totalEmissiveRadiance+=vec3(.55,.66,.9)*wv*.14;`);};
    m.customProgramCacheKey=()=>'wc-stone'+(o.key||'');return m;}
  const stoneM=stone(),wallM=stone({key:'w'});
  // the wall: a ring 110 m high, its round opening cut out of the face that looks south
  wallM.onBeforeCompile=(ob=>sh=>{ob(sh);sh.fragmentShader=sh.fragmentShader.replace('void main() {',`void main() {
      {float a=atan(vWP.x,vWP.z);float s=a*${WR.toFixed(1)};if(length(vec2(s,vWP.y-${GATE.y.toFixed(1)}))<${GATE.r.toFixed(1)}&&abs(a)<.2)discard;}`);})(wallM.onBeforeCompile);
  for(const [r,side] of[[WR+WT/2,THREE.FrontSide],[WR-WT/2,THREE.BackSide]]){const g=new THREE.CylinderGeometry(r,r*(side===THREE.FrontSide?1.012:1),WH,256,24,true).translate(0,WH/2,0);
    const m=new THREE.Mesh(g,wallM);m.material=wallM;if(side===THREE.BackSide){const mm=wallM.clone();mm.side=THREE.BackSide;mm.onBeforeCompile=wallM.onBeforeCompile;mm.customProgramCacheKey=()=>'wc-stone-wb';m.material=mm;}
    m.castShadow=m.receiveShadow=true;S.add(m);}
  {const top=new THREE.Mesh(new THREE.RingGeometry(WR-WT/2,WR+WT/2+1.3,256,1).rotateX(-Math.PI/2),stoneM);top.position.y=WH;S.add(top);
    // the opening's rim and its tunnel through the wall
    const rimM=new THREE.MeshBasicMaterial({color:0xffd890,toneMapped:false});
    const rr=new THREE.Mesh(new THREE.TorusGeometry(GATE.r,.9,8,96),rimM);rr.position.set(0,GATE.y,WR+WT/2+.6);S.add(rr);
    const tun=new THREE.Mesh(new THREE.CylinderGeometry(GATE.r,GATE.r,WT+2,96,1,true).rotateX(Math.PI/2),stone({side:THREE.BackSide,key:'t',color:0x6a6660,em:.02}));tun.position.set(0,GATE.y,WR);S.add(tun);
    // buttresses round the outside of the wall, a lip along its top
    const bl=[];for(let i=0;i<120;i++){const a=i/120*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.1)continue;
      bl.push(new THREE.Matrix4().compose(V(Math.sin(a)*(WR+WT/2+2.5),0,Math.cos(a)*(WR+WT/2+2.5)),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,a,0)),V(6,1,5)));}
    const bg=new THREE.LatheGeometry([[0,0],[1,0],[1,.08],[.7,.3],[.55,.92],[.8,1],[0,1]].map(([r,y])=>new THREE.Vector2(r,y*WH)),4).rotateY(Math.PI/4);
    const bo=new THREE.InstancedMesh(bg,stoneM,bl.length);bl.forEach((m,i)=>bo.setMatrixAt(i,m));bo.castShadow=bo.receiveShadow=true;S.add(bo);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(WR+WT/2+1,2.2,6,256),stoneM);lip.rotation.x=Math.PI/2;lip.position.y=WH+1;S.add(lip);
    const band=new THREE.Mesh(new THREE.TorusGeometry(WR+WT/2+.4,.5,4,256),rimM);band.rotation.x=Math.PI/2;band.position.y=WH-6;S.add(band);}
  // the ground inside the wall: pale stone; outside, the red desert in long dunes
  {const g=new THREE.CircleGeometry(WR,128).rotateX(-Math.PI/2);const m=new THREE.Mesh(g,stone({color:0xb9b3a8,em:.03,key:'g'}));m.position.y=.3;m.receiveShadow=true;S.add(m);}
  {const n=260,g=new THREE.PlaneGeometry(2,2,n,n).rotateX(-Math.PI/2),P=g.attributes.position,uv=g.attributes.uv;
    for(let i=0;i<P.count;i++){const u=P.getX(i),w=P.getZ(i),x=Math.sign(u)*Math.pow(Math.abs(u),2)*16000,z=Math.sign(w)*Math.pow(Math.abs(w),2)*16000,d=Math.hypot(x,z);
      const dune=(Math.sin(x*.004+Math.sin(z*.0021)*2.)*.5+.5)*28+Math.sin(z*.011+x*.003)*6+Math.sin(x*.023)*2;const y=d<WR+30?-.2:dune*sm(WR+30,WR+400,d)+(d>4000?(d-4000)*.03:0);
      P.setXYZ(i,x,y,z);uv.setXY(i,x/60,z/60);}
    g.computeVertexNormals();const st=tx('sand'),sn=tx('sand-n');
    const m=new THREE.MeshStandardMaterial({color:0x8a4a34,map:st,normalMap:sn,roughness:.95});m.normalScale.set(1.3,1.3);const o=new THREE.Mesh(g,m);o.receiveShadow=true;S.add(o);}

  /* ---------- the city: smooth white forms, lower toward the wall, climbing toward the tower ---------- */
  const PROF=[[[1,0],[1,.1],[.78,.4],[.52,.75],[.24,.95],[0,1]],
    [[1,0],[1,.55],[.95,.7],[.76,.85],[.42,.97],[0,1]],
    [[1,0],[1,.32],[.82,.34],[.8,.6],[.62,.62],[.6,.84],[.32,.9],[0,1]],
    [[1,0],[.74,.15],[.56,.6],[.44,.94],[0,1]],
    [[1,0],[1.05,.2],[.9,.5],[1.0,.62],[.7,.8],[.15,.97],[0,1]]];
  const lists=PROF.map(()=>[]),_q=new THREE.Quaternion(),_e=new THREE.Euler();
  for(let i=0,n=0;i<4000&&n<520;i++){const a=hash(i*1.31)*Math.PI*2,r=110+Math.sqrt(hash(i*2.17))*(WR-150),x=Math.sin(a)*r,z=Math.cos(a)*r;
    if(z>60&&Math.abs(x-Math.sin(z*.02)*14)<26)continue;                 // the street north from the plaza
    if(Math.hypot(x,z-452)<70)continue;                                 // the plaza inside the opening
    const k=1-(r-110)/(WR-150),h=24+Math.pow(k,1.5)*170*(.5+hash(i*3.7))+hash(i*5.3)*20,w=7+hash(i*4.1)*16+(1-k)*6;
    if(lists.some(L=>L.some(q=>Math.hypot(q.x-x,q.z-z)<q.w+w+3)))continue;
    const v=(hash(i*9.1)*PROF.length)|0;lists[v].push({x,z,w,h,m:new THREE.Matrix4().compose(V(x,0,z),_q.setFromEuler(_e.set(0,hash(i)*6,0)),V(w,h,w))});n++;}
  PROF.forEach((pf,v)=>{const g=new THREE.LatheGeometry(pf.map(([r,y])=>new THREE.Vector2(r,y)),28);const L=lists[v];if(!L.length)return;
    const o=new THREE.InstancedMesh(g,stoneM,L.length);L.forEach((q,i)=>o.setMatrixAt(i,q.m));o.castShadow=o.receiveShadow=true;S.add(o);});
  // arches over the climbing streets, and a broken colonnade before the tower
  for(let i=0;i<9;i++){const z=400-i*40,x=Math.sin(z*.02)*14,ar=new THREE.Mesh(new THREE.TorusGeometry(18,1.6,10,40,Math.PI),stoneM);ar.position.set(x,0,z);ar.castShadow=true;S.add(ar);}
  // the tower at the heart
  const tower=new THREE.Mesh(new THREE.LatheGeometry([[1.35,0],[1.05,.05],[.82,.24],[.64,.55],[.5,.8],[.64,.86],[.66,.88],[.36,.94],[.12,.985],[0,1]].map(([r,y])=>new THREE.Vector2(r*TW.r,y*TW.h)),96),stoneM);
  tower.castShadow=tower.receiveShadow=true;S.add(tower);
  const crown=add(0xffe6b0,160,.55,V(0,TW.h+4,0)),crown2=add(0xffffff,40,.8,V(0,TW.h+2,0));
  // the war in it: fires in the streets, smoke going up, amber and red light in the haze, two Herald hulls over the north quarter
  const FIRES=[];for(let i=0;i<34;i++){const a=hash(i*7.7)*6.283,r=140+hash(i*3.3)*(WR-180),p=V(Math.sin(a)*r,2,Math.cos(a)*r);
    FIRES.push({p,a:add(0xff6a20,1,.9,p),b:add(0xffc070,1,.9,p),c:add(i%3?0xff5010:0xffb040,1,.2,p),s:10+hash(i)*16,ph:hash(i+3)*9});}
  const SMOKE=[];{const puff=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');let s=7;const r=()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};
      for(let i=0;i<26;i++){const rr=128*(.12+r()*.2),px=128*(.25+r()*.5),py=128*(.35+r()*.3),g=x.createRadialGradient(px,py,0,px,py,rr);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);}return new THREE.CanvasTexture(c);})();
    FIRES.filter((_,i)=>i%3===0).forEach((F,j)=>{for(let k=0;k<7;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puff,color:0x2a262c,transparent:true,depthWrite:false,opacity:0}));S.add(s);SMOKE.push({s,F,k,ph:hash(j*5+k)});}});}
  const warL=new THREE.PointLight(0xff8a40,1.6,1400,1.4);warL.position.set(-120,80,-60);S.add(warL);
  const HULLS=[];if(typeof MODELS!=='undefined')[[V(-560,560,-1000),900,.4],[V(700,640,-1300),1200,-.5]].forEach(([p,len,ry])=>{const g=new THREE.Group();g.position.copy(p);g.rotation.y=ry;S.add(g);HULLS.push(g);
    MODELS.load('harrower').then(src=>{const G=src.geometry;if(!G.boundingBox)G.computeBoundingBox();const b=G.boundingBox,k=len/(b.max.z-b.min.z),c=b.getCenter(V());
      const m=new THREE.Mesh(G,src.material);m.scale.setScalar(k);m.position.copy(c).multiplyScalar(-k);g.add(m);}).catch(()=>{});
    const e=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xff4a30,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,toneMapped:false}));e.scale.setScalar(len*.35);e.position.z=len*.5;g.add(e);
    for(let i=0;i<5;i++){const s=new THREE.Sprite(e.material);s.scale.setScalar(len*.06);s.position.set(0,-len*.05,(i/4-.5)*len*.7);g.add(s);}});

  /* ---------- the dome: the level's shader (js/pathfinder3/01-world.js), rising off the wall and closing over the tower ---------- */
  const DU={uT:{value:0},rise:{value:0},hold:{value:1},flick:{value:0}};const R0=WR+60;
  const dome=new THREE.Mesh(new THREE.SphereGeometry(R0,128,64,0,Math.PI*2,0,Math.PI/2),new THREE.ShaderMaterial({uniforms:DU,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,
    vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=normalize(w.xyz-cameraPosition);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`varying vec3 vP;varying vec3 vN;varying vec3 vW;uniform float uT,rise,hold,flick;
    float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){float h=vP.y/${R0.toFixed(1)};if(h>rise)discard;
      vec2 q=vec2(atan(vP.z,vP.x)*30.0,h*40.0);vec2 g=vec2(q.x,q.y+mod(floor(q.x),2.0)*.5);vec2 f=abs(fract(g)-.5);float cell=smoothstep(.42,.5,max(f.x,f.y));
      float fres=pow(1.0-abs(dot(normalize(vN),-vW)),2.2);
      float front=smoothstep(rise-.06,rise,h)*step(h,rise)*(1.0-step(.999,rise));
      float lines=smoothstep(.97,1.0,sin(atan(vP.z,vP.x)*24.0))*(.5+.5*sin(h*30.0-uT*3.0));
      float gone=step(hold,hs(floor(g)+floor(uT*6.0)*.13));
      float fl=1.0-flick*step(.5,hs(vec2(floor(uT*14.0),3.0)));
      float rip=.5+.5*sin(h*60.0-uT*2.4+sin(atan(vP.z,vP.x)*5.0+uT*.7)*2.0);
      vec3 c=vec3(.55,.72,1.0)*(cell*.2+fres*.42+lines*.22+.05+rip*.05*(1.0-cell))+vec3(1.0,.86,.55)*cell*fres*.25+vec3(1.0,.95,.85)*front*1.6+vec3(.7,.85,1.0)*smoothstep(.04,0.0,h)*.9;
      gl_FragColor=vec4(c*(1.0-gone)*fl*min(1.0,hold+.15),1.0);}`}));
  dome.renderOrder=2;S.add(dome);
  // the pillar of light out of the crown that raises it
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(9,9,1,24,1,true).translate(0,.5,0),new THREE.MeshBasicMaterial({color:0xc8d8ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  beam.position.y=TW.h-10;S.add(beam);

  const FX=GRADE.composer(R,S,cam,{bloom:[.9,.6,.7],grade:{gam:1,contrast:1.12,sat:.95,vig:.55,grain:.035,shadow:[-.004,.004,.02],high:[.04,.02,-.01],lift:.004}});
  function render(t,shot,u){U.t.value=t;DU.uT.value=t;
    for(const F of FIRES){const k=.75+.25*Math.sin(t*9+F.ph)*Math.sin(t*5.3+F.ph*2);F.a.scale.set(F.s*1.4*k,F.s*2*k,1);F.a.position.y=F.p.y+F.s*.6;F.b.scale.set(F.s*.7,F.s*1.1*k,1);F.b.position.y=F.p.y+F.s*.4;F.c.scale.setScalar(F.s*7);}
    for(const M of SMOKE){const v=(M.ph+t*.04+M.k/7)%1;M.s.position.set(M.F.p.x+v*v*160,M.F.p.y+20+v*260,M.F.p.z-v*60);M.s.scale.setScalar(30+v*180);M.s.material.opacity=Math.sin(v*Math.PI)*.42;}
    warL.intensity=1.4+.4*Math.sin(t*7)*Math.sin(t*3.1);
    let p,q,fov,rise=0,hold=1,fl=0;
    if(shot===0){p=V(-240+u*70,330-u*50,1180-u*230);q=V(0,55,-40);fov=40;}
    else{const tt=u*5.85;rise=sm(.15,3.0,tt);fl=sm(4.0,4.4,tt)*(.6+.4*Math.sin(tt*29));hold=1-.4*sm(3.9,5.6,tt);
      p=V(1250-u*140,85+u*150,980-u*90);q=V(0,120+u*45,0);fov=44;
      beam.material.opacity=.55*sm(0,.4,tt)*(1-.6*sm(2.6,3.6,tt));beam.scale.set(1,1400*sm(0,.5,tt),1);}
    if(shot===0)beam.material.opacity=0;
    dome.visible=rise>0;DU.rise.value=rise;DU.hold.value=hold;DU.flick.value=fl;U.wake.value=rise*hold;skyU.domeK.value=rise*hold;
    domeL.intensity=rise*hold*1.4*(1-fl*.7);hemi.color.setHex(0x6a7ab0).lerp(C(0x9ab0e0),rise*.7);S.fog.color.setHex(0x232c46).lerp(C(0x2a3658),rise);
    crown.material.opacity=.55+.4*rise;
    cam.position.copy(p);cam.lookAt(q);cam.fov=fov;cam.aspect=16/9;cam.updateProjectionMatrix();sky.position.copy(cam.position);
    FX.render();}
  return{render,scene:S,cam};
});
