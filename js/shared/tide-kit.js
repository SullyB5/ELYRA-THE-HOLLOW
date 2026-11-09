/* Elyra · Tide City round the Spear's foot, as one kit (Nov 9 2026). Moved out of the menu's backdrop (js/menu/halo-scene.js, where it
   was built Nov 8 the way the level builds it, js/tide/02-city.js) so the prologue's Tide City shots and the command deck's windows show
   the same city as the menu and the level, instead of their own boxes (Bryce: the cutscene "does not fit").
   A core platform round the Spear and two rings of districts, each dense with towers of three stepped tiers in pale tints (their look:
   js/shared/towers.js), spires, decks with blue light under them, sky-bridges, sea causeways, the transit rings on their pylons,
   Bryce's great spire towers (models/tower.glb) on the outer platforms, red warning lights blinking on the tallest. Seeded: the same
   city every time.
   TIDE_KIT.build(parent, {SP, low, phone, env, keepPlat(P,wx,wz), keepTower(lx,lz,P), ringPylon(x,z), CS, tries, rim, night})
     → {beacons:[Vector3], tick(t), mats}. SP: the Spear's foot (world). keepPlat/keepTower/ringPylon return false to leave one out.
   Needs three.js r128 and TOWER_LOOK (js/shared/towers.js); MODELS (js/shared/models.js) for the spire towers when it's there. */
const TIDE_KIT=(()=>{
  let GLOW=null;
  function glow(){if(GLOW)return GLOW;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return GLOW=new THREE.CanvasTexture(c);}
  function build(parent,o){o=o||{};
    const V=(x,y,z)=>new THREE.Vector3(x,y,z),C=h=>new THREE.Color(h),SP=o.SP||V(0,0,0),low=!!o.low,phone=!!o.phone,ENV=o.env||null;
    const keepPlat=o.keepPlat||(()=>true),keepTower=o.keepTower||(()=>true),ringPylon=o.ringPylon||(()=>true);
    const rnd=(()=>{let s=o.seed||2237;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};})();
    const Rn=(a,b)=>a+rnd()*(b-a),pick=a=>a[(rnd()*a.length)|0];
    const _q=new THREE.Quaternion(),_e=new THREE.Euler();
    const M4=(x,y,z,sx,sy,sz,ry)=>new THREE.Matrix4().compose(V(x,y,z),_q.setFromEuler(_e.set(0,ry||0,0)),V(sx,sy,sz));
    const towerMat=typeof TOWER_LOOK==='function'?TOWER_LOOK(new THREE.MeshStandardMaterial({color:0xffffff}),{far:o.far||[900,4200],glow:o.glow||1,lin:!!o.srgb}):new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.15});
    const metalMat=new THREE.MeshStandardMaterial({color:0xcfd6e2,roughness:.35,metalness:.35}),
      baseMat=new THREE.MeshStandardMaterial({color:0x4c5662,roughness:.85,metalness:.1}),
      accentMat=new THREE.MeshStandardMaterial({color:0xdff7ff,emissive:0x39c6ff,emissiveIntensity:1.1,roughness:.3}),
      rimM=new THREE.MeshStandardMaterial({color:0x1a1408,emissive:0xd9a548,emissiveIntensity:.6});
    if(ENV){towerMat.envMap=ENV;towerMat.envMapIntensity=.45;metalMat.envMap=ENV;metalMat.envMapIntensity=.9;}
    if(o.night){towerMat.color.setHex(o.night===true?0x5d6880:o.night);}
    // a scene drawn in linear light with sRGB output (the prologue): every colour here was picked as sRGB, so convert them
    if(o.srgb){for(const m of[towerMat,metalMat,baseMat,accentMat,rimM]){m.color.convertSRGBToLinear();if(m.emissive)m.emissive.convertSRGBToLinear();}}
    const CS=o.CS||1.65,TRY=o.tries||(low?.8:phone?1.1:1.5),CORE_CLEAR=240;
    const PL=[{x:0,z:0,r:340*CS,tier:0}];
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3;PL.push({x:Math.cos(a)*650*CS,z:Math.sin(a)*650*CS,r:Rn(170,240)*CS,tier:1});}
    for(let k=1;k<7;k++){const a=Math.PI*1.5+k/7*Math.PI*2,d=Rn(1050,1250)*CS;PL.push({x:Math.cos(a)*d,z:Math.sin(a)*d,r:Rn(130,200)*CS,tier:2});}
    const PLATS=PL.filter(P=>!P.tier||keepPlat(P,SP.x+P.x,SP.z+P.z));
    {let k=0;for(const P of PLATS)if(P.tier===2&&(k++%2===0))P.spire=true;}
    const tw={box:[],cyl:[],hex:[]},spires=[],decks=[],bridges=[],plats=[],towers=[],tints=[0xffffff,0xeef3f7,0xe2ebf2,0xd7e6ee,0xf3efe6,0xcfe0e8,0xe9dcc9,0xd8e4dc,0xc3d3e3,0xe6d2bd].map(h=>o.srgb?C(h).convertSRGBToLinear():C(h));
    for(const P of PLATS){P.rot=rnd();plats.push(M4(SP.x+P.x,0,SP.z+P.z,P.r,6,P.r,P.rot));
      if(P.spire)continue;
      const hMax=(P.tier===0?560:P.tier===1?460:260)*1.3,hMin=(P.tier===0?120:P.tier===1?70:45)*1.3,placed=[];
      for(let t=0;t<Math.round((P.tier===0?560:300)*TRY);t++){
        const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*(P.r*.84-30),lx=P.x+Math.cos(a)*d,lz=P.z+Math.sin(a)*d,fp=Rn(16,P.tier===0?60:46);
        if(placed.some(q=>Math.hypot(q.x-lx,q.z-lz)<q.fp/2+fp/2+10))continue;
        const centr=1-d/P.r;let h=hMin+Math.pow(rnd(),1.7)*(hMax-hMin)*(.45+.55*centr);
        const T={x:SP.x+lx,z:SP.z+lz,fp,h,kind:pick(['box','box','cyl','hex']),tint:pick(tints),rot:rnd()*Math.PI};placed.push({x:lx,z:lz,fp});
        if(P.tier===0&&Math.hypot(lx,lz)<CORE_CLEAR+fp/2)continue;
        const kt=keepTower(lx,lz,P,fp);if(kt===false)continue;if(typeof kt==='number')T.h=Math.min(T.h,kt);
        towers.push(T);}}
    for(const T of towers){const h1=T.h*Rn(.55,.8),h2=T.h*Rn(.82,.95),{x,z,fp,kind,rot}=T;
      tw[kind].push({m:M4(x,3,z,fp,h1,fp,rot),c:T.tint},{m:M4(x,3+h1,z,fp*.76,h2-h1,fp*.76,rot),c:T.tint},{m:M4(x,3+h2,z,fp*.5,T.h-h2,fp*.5,rot),c:T.tint});
      if(rnd()<.5){T.top=3+T.h+T.h*Rn(.1,.28);spires.push(M4(x,3+T.h,z,fp*.1,T.top-3-T.h,fp*.1,rot));}else T.top=3+T.h;
      const nd=rnd()<.45?(rnd()<.4?2:1):0;for(let i=0;i<nd;i++){const s=Rn(.75,1.05);decks.push(M4(x,3+T.h*Rn(.25,.85),z,fp*s,Rn(2,4),fp*s,0));}}
    for(const A of towers){if(rnd()>.32)continue;let best=null,bd=1e9;
      for(const B of towers){if(B===A)continue;const d=Math.hypot(A.x-B.x,A.z-B.z);if(d<bd&&d<110){bd=d;best=B;}}if(!best)continue;
      const nb=rnd()<.35?2:1;for(let k=0;k<nb;k++)bridges.push(M4((A.x+best.x)/2,Math.min(A.h,best.h)*Rn(.2,.75),(A.z+best.z)/2,Rn(4,7),Rn(3,5),bd,Math.atan2(best.x-A.x,best.z-A.z)));}
    const inner=PLATS.filter(p=>p.tier===1);
    for(const P of PLATS){if(!P.tier)continue;const Q=P.tier===1?PLATS[0]:inner.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0];if(!Q)continue;
      bridges.push(M4(SP.x+(P.x+Q.x)/2,Rn(18,40),SP.z+(P.z+Q.z)/2,Rn(16,26),5,Math.hypot(P.x-Q.x,P.z-Q.z),Math.atan2(P.x-Q.x,P.z-Q.z)));}
    function inst(geo,mat,list,shadow){const m=new THREE.InstancedMesh(geo,mat,Math.max(1,list.length));m.count=list.length;
      list.forEach((it,i)=>{if(it.m){m.setMatrixAt(i,it.m);m.setColorAt(i,it.c);}else m.setMatrixAt(i,it);});if(shadow)m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
    const unitBox=new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
    inst(unitBox,towerMat,tw.box,!low);inst(new THREE.CylinderGeometry(.5,.5,1,10).translate(0,.5,0),towerMat,tw.cyl,!low);inst(new THREE.CylinderGeometry(.5,.5,1,6).translate(0,.5,0),towerMat,tw.hex,!low);
    inst(new THREE.ConeGeometry(.5,1,6).translate(0,.5,0),metalMat,spires);
    inst(new THREE.CylinderGeometry(.5,.5,1,28),metalMat,decks);
    inst(new THREE.CylinderGeometry(.5,.5,1,28),accentMat,decks.map(m=>m.clone().multiply(new THREE.Matrix4().makeTranslation(0,-.6,0)).multiply(new THREE.Matrix4().makeScale(1.03,.25,1.03))));
    inst(new THREE.BoxGeometry(1,1,1),metalMat,bridges);
    inst(new THREE.CylinderGeometry(1,1.04,1,64),baseMat,plats).receiveShadow=true;
    if(o.rim!==false)for(const P of PLATS){const e=new THREE.Mesh(new THREE.TorusGeometry(P.r*1.02,1.4,4,96),rimM);e.rotation.x=Math.PI/2;e.position.set(SP.x+P.x,3.2,SP.z+P.z);parent.add(e);}
    for(const Rg of[{r:520*CS,y:170},{r:900*CS,y:310},{r:380*CS,y:520}]){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(Rg.r,5,8,180),metalMat);ring.rotation.x=Math.PI/2;ring.position.set(SP.x,Rg.y,SP.z);parent.add(ring);
      const glowR=new THREE.Mesh(new THREE.TorusGeometry(Rg.r,1.6,6,180),accentMat);glowR.rotation.x=Math.PI/2;glowR.position.set(SP.x,Rg.y-5,SP.z);parent.add(glowR);
      const py=[];for(let i=0;i<14;i++){const a=i/14*Math.PI*2,x=SP.x+Math.cos(a)*Rg.r,z=SP.z+Math.sin(a)*Rg.r;if(!ringPylon(x,z))continue;py.push(M4(x,0,z,1,Rg.y,1,0));}
      inst(new THREE.CylinderGeometry(3,5,1,6).translate(0,.5,0),baseMat,py);}
    const BEACONS=[];
    function spireMaterial(src){const m=src.material.clone();m.map=null;m.color=C(0xe9e4d8);if(o.srgb)m.color.convertSRGBToLinear().multiplyScalar(.7);m.roughness=.5;m.metalness=.2;
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
      m.customProgramCacheKey=()=>'tidekit-spire';return m;}
    if(typeof MODELS!=='undefined')MODELS.load('tower').then(src=>{const g=src.geometry;g.computeBoundingBox();const b=g.boundingBox,mat=spireMaterial(src);
      for(const P of PLATS){if(!P.spire)continue;const h=P.r*1.7,k=h/(b.max.y-b.min.y);
        const m=new THREE.Mesh(g,mat);m.scale.setScalar(k);m.position.set(SP.x+P.x,3-b.min.y*k,SP.z+P.z);m.rotation.y=P.rot*6.28;m.castShadow=m.receiveShadow=!low;parent.add(m);
        BEACONS.push(V(SP.x+P.x,3+h+8,SP.z+P.z));}}).catch(()=>{});
    for(const T of towers.slice().sort((a,b)=>b.top-a.top).slice(0,phone?24:40))BEACONS.push(V(T.x,T.top+3,T.z));
    const beacon=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({map:glow(),color:0xff5a4a,size:phone?7:6,sizeAttenuation:false,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    beacon.frustumCulled=false;parent.add(beacon);
    function tick(t){const n=BEACONS.length;if(!n)return;let g=beacon.geometry;
      if(!g.attributes.position||g.attributes.position.count!==n){g.dispose();g=beacon.geometry=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));}
      const P=g.attributes.position;for(let i=0;i<n;i++){const on=Math.sin(t*2.2+i*1.7)>.2;P.setXYZ(i,BEACONS[i].x,on?BEACONS[i].y:-1e5,BEACONS[i].z);}P.needsUpdate=true;}
    return{beacons:BEACONS,tick,towers,plats:PLATS,mats:{towerMat,metalMat,baseMat,accentMat,rimM}};}
  return{build};
})();
