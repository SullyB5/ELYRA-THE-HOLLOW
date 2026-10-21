/* Elyra shared 3D models: the Keeper characters, the rifle and the Harbinger, made outside the game and slimmed down for phones
   (models/*.glb, meshopt-compressed, WebP textures). Loaded in the background: a chapter builds its people from code first,
   and each one is swapped for its model when the file arrives, so nothing waits on a download and a failed download changes nothing.

   The character models come unrigged, so they are rigged here: the code rig's joints (hip, torso, head, shoulders, elbows,
   hips, knees from js/origin/02-people.js) are moved to where each model's joints are and used as its bones, and every vertex
   is weighted to the nearest limb segments. poseHuman() keeps posing the same joints, so walking, aiming and falling carry over.
   Models face +x, stand 1 unit tall from y -0.5 to 0.5, right hand toward +z; the game faces -z with feet at y = 0. */
const MODELS=(()=>{
  const BASE='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
  const scriptP={};
  function script(src){return scriptP[src]||(scriptP[src]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s);}));}
  let loaderP=null;
  function loader(){
    return loaderP||(loaderP=Promise.all([THREE.GLTFLoader?0:script(BASE+'loaders/GLTFLoader.js'),window.MeshoptDecoder?0:script(BASE+'libs/meshopt_decoder.js')])
      .then(()=>MeshoptDecoder.ready).then(()=>{const L=new THREE.GLTFLoader();L.setMeshoptDecoder(MeshoptDecoder);return L;}));}
  const cache={};
  // the files are compressed: positions, normals and UVs are stored as small integers with the node carrying the scale.
  // Unpack them to plain floats in the model's own space (r128 does not un-normalize when reading), so they can be rigged and reshaped.
  function unpack(mesh){
    mesh.updateWorldMatrix(true,false);const src=mesh.geometry,g=new THREE.BufferGeometry();
    const div=a=>!a.normalized?1:a.array instanceof Int8Array?127:a.array instanceof Uint8Array?255:a.array instanceof Int16Array?32767:a.array instanceof Uint16Array?65535:1;
    for(const k of['position','normal','uv']){const a=src.attributes[k];if(!a)continue;const n=a.count,s=a.itemSize,d=div(a),out=new Float32Array(n*s);
      for(let i=0;i<n;i++)for(let j=0;j<s;j++)out[i*s+j]=(j===0?a.getX(i):j===1?a.getY(i):a.getZ(i))/d;g.setAttribute(k,new THREE.BufferAttribute(out,s));}
    if(src.index)g.setIndex(new THREE.BufferAttribute(Uint32Array.from(src.index.array),1));
    g.applyMatrix4(mesh.matrixWorld);   // also turns and renormalizes the normals
    if(!g.attributes.normal)g.computeVertexNormals();
    return{geometry:g,material:mesh.material};
  }
  /* model detail (Settings on the menu, localStorage elyra.assets): 'auto' (default), 'light' or 'full'.
     Two sets of files: models/<name>.glb is the phone set (small, always there); models/pc/<name>.glb is an optional sharper PC set.
     auto: PCs use the pc file when one exists, phones the phone set. full: the pc file everywhere. light: the smallest file everywhere
     (Michael drops from marine-hi to marine). To add a PC version of a model, drop it in models/pc/ and add its name to PC_FILES. */
  const PC_FILES=new Set(['michael','elias','hollow-king','host-trooper','watcher','interceptor','raven','vanguard','voidclass','wraith','harrower','dropship','cliff','tower']);
  let TIER='auto';try{TIER=localStorage.getItem('elyra.assets')||'auto';}catch(_){}
  const touch=matchMedia('(pointer: coarse)').matches;
  function file(name){if(TIER==='light'&&name==='marine-hi')return'marine';
    if(PC_FILES.has(name)&&(TIER==='full'||(TIER==='auto'&&!touch)))return'pc/'+name;return name;}
  // the first mesh in a file (each file holds one)
  function load(name){name=file(name);
    return cache[name]||(cache[name]=loader().then(L=>new Promise((ok,no)=>L.load('models/'+name+'.glb?v=3',g=>{let mesh=null;g.scene.traverse(o=>{if(!mesh&&o.isMesh)mesh=o;});mesh?ok(unpack(mesh)):no(new Error('empty '+name));},undefined,no))));}

  /* ---------- characters ---------- */
  // joints measured off each model (model units): shoulder, elbow, wrist, hip joint, knee, ankle as [sideways, height];
  // pelvis and neck heights; h = height in metres in the game; file = which model
  const RIGS={
    marine:  {file:'marine',  h:1.9, pelvis:.03,  neck:.37, sh:[.14,.29],  el:[.228,.15], wr:[.244,.016],hp:[.063,.03],kn:[.075,-.22],an:[.08,-.43]},
    hero:    {file:'michael', h:1.85,pelvis:-.01, neck:.34, sh:[.12,.27],  el:[.145,.1],  wr:[.165,-.03], hp:[.06,-.01], kn:[.062,-.2], an:[.07,-.42]},   // Lt. Michael Hall (Bryce's model, Oct 20)
    elias:   {file:'elias',   h:1.86,pelvis:-.02, neck:.35, sh:[.12,.29],  el:[.15,.12],   wr:[.16,-.02],   hp:[.05,-.02], kn:[.06,-.22], an:[.075,-.43],cape:-.06,armIn:.1},   // Master Elias Veyr: robe and cape, he stands
    // the Empty Host trooper: his rifle is part of the model, hanging along his right forearm, so he aims by pointing the arm (gunAlong)
    host:    {file:'host-trooper',h:2.2,pelvis:0,  neck:.35, sh:[.135,.29], el:[.17,.13],   wr:[.205,-.02],  hp:[.05,0],    kn:[.085,-.2], an:[.09,-.43],gunAlong:true},
    king:    {file:'hollow-king',h:4.4,pelvis:-.02,neck:.36, sh:[.14,.3],   el:[.2,.19],    wr:[.29,.08],    hp:[.07,-.02], kn:[.1,-.2],   an:[.11,-.42]},
    engineer:{file:'engineer',h:1.88,pelvis:.03,  neck:.34, sh:[.134,.275],el:[.205,.14], wr:[.2,.01],   hp:[.07,.03], kn:[.095,-.2],an:[.1,-.425]},
    // Bryce's Keeper civilian (Tripo, Oct 20). The crate standing by her left boot was cut out of the mesh; her arms hang close to her
    // thighs, so armIn keeps the arm bones off the legs below the waist, and cape keeps the scarf on her back with the trunk.
    // Her legs were generated pressed together (one fused surface), so they tear when they swing: use her standing or working, not walking.
    // (R.split, below, drops faces that bridge two limbs; it helps a little on fused models.)
    civilian:{file:'civilian',h:1.7, pelvis:-.015,neck:.31, sh:[.105,.245],el:[.125,.095],wr:[.13,-.04],  hp:[.045,-.015],kn:[.052,-.215],an:[.035,-.43],cape:-.08,armIn:.097},
    robot:   {file:'robot',   h:1.3, pelvis:-.126,neck:.245,sh:[.165,.165],el:[.25,.024], wr:[.25,-.11], hp:[.08,-.126],kn:[.08,-.27],an:[.08,-.41]},
  };
  const geoCache={};
  // model space -> game space (metres): forward +x becomes -z, right +z becomes +x, feet to y = 0
  function toGame(R,lat,y){return new THREE.Vector3(lat*R.h,(y+.5)*R.h,0);}
  function segDist3(p,a,b){const ab=_t1.subVectors(b,a),t=Math.max(0,Math.min(1,_t2.subVectors(p,a).dot(ab)/Math.max(1e-9,ab.lengthSq())));return _t2.copy(a).addScaledVector(ab,t).distanceTo(p);}
  const _t1=new THREE.Vector3(),_t2=new THREE.Vector3(),_t3=new THREE.Vector3();
  // bone order: 0 hip, 1 torso, 2 head, 3 left shoulder, 4 left elbow, 5 right shoulder, 6 right elbow, 7 left thigh, 8 left knee, 9 right thigh, 10 right knee
  function joints(R){
    const J={};const H=R.h;
    J.pelvis=new THREE.Vector3(0,(R.pelvis+.5)*H,0);J.spine=new THREE.Vector3(0,(R.pelvis+.58)*H,0);J.neck=new THREE.Vector3(0,(R.neck+.5)*H,0);J.top=new THREE.Vector3(0,H,0);
    for(const s of[-1,1]){const k=s<0?'L':'R';
      J['sh'+k]=toGame(R,s*R.sh[0],R.sh[1]);J['el'+k]=toGame(R,s*R.el[0],R.el[1]);J['wr'+k]=toGame(R,s*R.wr[0],R.wr[1]);
      J['hand'+k]=J['wr'+k].clone().add(J['wr'+k].clone().sub(J['el'+k]).multiplyScalar(.55));
      J['hp'+k]=toGame(R,s*R.hp[0],R.hp[1]);J['kn'+k]=toGame(R,s*R.kn[0],R.kn[1]);J['an'+k]=toGame(R,s*R.an[0],R.an[1]);
      J['toe'+k]=J['an'+k].clone().add(new THREE.Vector3(0,-.05*H,-.09*H));}
    return J;}
  function buildGeo(kind,src){
    if(geoCache[kind])return geoCache[kind];
    const R=RIGS[kind],J=joints(R);let g=src.geometry.clone();
    if(R.cut&&g.index){   // drop whole triangles that belong to a prop (tested in model space)
      const P=g.attributes.position,idx=g.index.array,keep=[];
      for(let i=0;i<idx.length;i+=3){let x=0,y=0,z=0;for(let k=0;k<3;k++){const v=idx[i+k];x+=P.getX(v)/3;y+=P.getY(v)/3;z+=P.getZ(v)/3;}if(!R.cut(x,y,z))keep.push(idx[i],idx[i+1],idx[i+2]);}
      g.setIndex(keep);}
    // into game space: turn the model to face -z, size it, stand it on y = 0
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI/2));
    g.scale(R.h,R.h,R.h);g.translate(0,R.h*.5,0);
    const pos=g.attributes.position,n=pos.count,si=new Uint16Array(n*4),sw=new Float32Array(n*4),p=new THREE.Vector3();
    const legY=J.pelvis.y+.05*R.h,trunkW=Math.abs(J.shR.x)*.78;
    const segs=[
      [0,J.pelvis.clone().setY(J.pelvis.y-.06*R.h),J.spine,0],[1,J.spine,J.neck,0],[2,J.neck,J.top,0],
      [3,J.shL,J.elL,-1],[4,J.elL,J.handL,-1],[5,J.shR,J.elR,1],[6,J.elR,J.handR,1],
      [7,J.hpL,J.knL,-1],[8,J.knL,J.anL,-1],[8,J.anL,J.toeL,-1],[9,J.hpR,J.knR,1],[10,J.knR,J.anR,1],[10,J.anR,J.toeR,1]];
    const w=new Float32Array(11);
    const capeZ=R.cape!=null?-R.cape*R.h:null;   // behind the back (game +z) past this, only the trunk moves it
    for(let i=0;i<n;i++){p.fromBufferAttribute(pos,i);w.fill(0);
      const side=p.x<0?-1:1,cape=capeZ!=null&&p.z>capeZ&&p.y>J.knR.y-.05*R.h;
      for(const [b,a,c,s] of segs){
        if(cape&&b>2)continue;
        if(s){if(s!==side&&Math.abs(p.x)>.012*R.h)continue;
          const arm=b>=3&&b<=6,leg=b>=7;
          if(arm&&Math.abs(p.x)<trunkW&&p.y>J.elR.y)continue;   // the chest belongs to the torso, not the arms
          if(arm&&R.armIn&&Math.abs(p.x)<R.armIn*R.h&&p.y<J.pelvis.y+.06*R.h)continue;   // arms hanging by the thighs: the legs keep their own skin
          if(leg&&p.y>legY)continue;}
        else if(b===0&&p.y<J.knR.y)continue;
        if(R.armIn&&b<=1&&!cape&&p.y<J.hpR.y-.01*R.h)continue;   // slim legs close together: below the hip joints only the legs move the skin
        const d=segDist3(p,a,c)/R.h+.004;const v=1/Math.pow(d,5);if(v>w[b])w[b]=v;}
      // keep the four strongest bones
      const top=[];for(let b=0;b<11;b++)if(w[b]>0)top.push(b);top.sort((a,b)=>w[b]-w[a]);top.length=Math.min(4,top.length);
      let sum=0;for(const b of top)sum+=w[b];if(!top.length){top.push(1);w[1]=1;sum=1;}
      top.forEach((b,k)=>{si[i*4+k]=b;sw[i*4+k]=w[b]/sum;});}
    g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
    // R.split: a model generated with its legs (or a hand and a thigh) touching has faces bridging them, which tear into sheets when
    // they move apart. Drop every face whose corners belong to different limbs (left leg / right leg / left arm / right arm).
    if(R.split&&g.index){const limb=b=>b===7||b===8?1:b===9||b===10?2:b===3||b===4?3:b===5||b===6?4:0,idx=g.index.array,keep=[];
      for(let i=0;i<idx.length;i+=3){const a=limb(si[idx[i]*4]),b=limb(si[idx[i+1]*4]),c=limb(si[idx[i+2]*4]);
        const L=[a,b,c].filter(x=>x),cross=L.some(x=>x!==L[0]);if(!cross)keep.push(idx[i],idx[i+1],idx[i+2]);}
      g.setIndex(keep);}
    g.computeBoundingSphere();
    return geoCache[kind]={g,J,R};
  }
  const matCache={};
  function material(kind,src,tint){const k=kind+(tint||'');if(matCache[k])return matCache[k];
    const m=src.material.clone();m.skinning=true;if(tint)m.color.copy(C(tint));m.needsUpdate=true;return matCache[k]=m;}

  // turn a code-built person into their model. kind: hero, marine, engineer, robot. opts.tint darkens a squadmate's armour.
  function dress(H,kind,opts){opts=opts||{};
    if((opts.unarmed||kind==='robot')&&H&&H.gun){H.gun.parent.remove(H.gun);H.gun=null;}   // drop the code rifle now, not when the file arrives
    if(!H||H.glb||H.dressing)return Promise.resolve(H);H.dressing=true;
    return load(RIGS[kind].file).then(src=>{
      if(!H.root)return H;
      const {g,J,R}=buildGeo(kind,src),mat=material(kind,src,opts.tint);
      // hide the box people, keep their joints as bones
      const keep=new Set([H.hip,H.torso,H.head,...H.arms.flatMap(a=>[a.sh,a.el]),...H.legs.flatMap(l=>[l.hp,l.kn])]);
      H.root.traverse(o=>{if(o.isMesh&&!o.userData.keep)o.visible=false;});
      H.body.scale.setScalar(1);H.body.rotation.set(0,0,0);H.body.position.set(0,0,0);
      // the joints move to the model's joints (each relative to its parent), every rotation at rest for binding
      const set=(o,v,par)=>{o.position.copy(v).sub(par);o.rotation.set(0,0,0);};
      set(H.hip,J.pelvis,new THREE.Vector3());set(H.torso,J.spine,J.pelvis);set(H.head,J.neck,J.spine);
      [['L',0],['R',1]].forEach(([k,i])=>{set(H.arms[i].sh,J['sh'+k],J.spine);set(H.arms[i].el,J['el'+k],J['sh'+k]);
        set(H.legs[i].hp,J['hp'+k],J.pelvis);set(H.legs[i].kn,J['kn'+k],J['hp'+k]);});
      H.hipY=J.pelvis.y;H.glb=kind;H.R=R;H.J=J;
      const bones=[H.hip,H.torso,H.head,H.arms[0].sh,H.arms[0].el,H.arms[1].sh,H.arms[1].el,H.legs[0].hp,H.legs[0].kn,H.legs[1].hp,H.legs[1].kn];
      const sk=new THREE.SkinnedMesh(g,mat);sk.castShadow=true;sk.frustumCulled=false;sk.userData.keep=true;
      H.body.add(sk);H.root.updateMatrixWorld(true);
      sk.bind(new THREE.Skeleton(bones),sk.matrixWorld.clone());
      H.skin=sk;
      // the hand: where the rifle sits, relative to the right elbow
      H.hand=J.wrR.clone().sub(J.elR);
      if((opts.unarmed||kind==='robot')&&H.gun){H.gun.parent.remove(H.gun);H.gun=null;}
      if(!opts.unarmed&&kind!=='robot'&&!R.gunAlong)attachRifle(H,J);
      if(R.gunAlong){if(H.gun){H.gun.parent.remove(H.gun);H.gun=null;}H.gunAlong=true;const d=J.wrR.clone().sub(J.elR);H.muzzleL=d.clone().add(d.clone().normalize().multiplyScalar(.62*R.h/2.2));}
      // a robot carries an arm cannon instead of a rifle
      if(kind==='robot'&&!opts.unarmed){const c=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,.55,8),new THREE.MeshStandardMaterial({color:C(0x2e3a40),metalness:.6,roughness:.4}));
        c.rotation.x=Math.PI/2;c.position.copy(H.hand).add(new THREE.Vector3(0,0,-.2));c.userData.keep=true;H.arms[1].el.add(c);H.muzzleL=H.hand.clone().add(new THREE.Vector3(0,0,-.5));}
      H.dressing=false;return H;
    }).catch(e=>{H.dressing=false;console.warn('model',kind,e&&e.message);return H;});
  }
  // the rifle: the sci-fi assault rifle model, held along the forearm, muzzle toward -z when the forearm hangs straight down
  let rifleGeo=null,rifleMat=null;
  function attachRifle(H,J){
    load('rifle').then(src=>{
      if(!rifleGeo){rifleGeo=src.geometry.clone();rifleGeo.computeBoundingBox();const b=rifleGeo.boundingBox,len=b.max.z-b.min.z,s=.86/len;
        rifleGeo.translate(-(b.max.x+b.min.x)/2,-(b.max.y+b.min.y)/2,-(b.max.z+b.min.z)/2);rifleGeo.scale(s,s,s);rifleGeo.computeVertexNormals();
        rifleMat=new THREE.MeshStandardMaterial({color:C(0x3a4250),metalness:.7,roughness:.35,emissive:C(0x0a1a28)});}
      const m=new THREE.Mesh(rifleGeo,rifleMat);m.castShadow=true;m.userData.keep=true;
      // the rifle sits in the shoulder and both hands reach for it (gunRig in js/origin/02-people.js); muzzle toward -z
      const o=new THREE.Group();o.add(m);o.userData.grip={R:new THREE.Vector3(0,-.07,.1),L:new THREE.Vector3(0,-.06,-.16),muzzle:new THREE.Vector3(0,.03,-.45),butt:.4};
      if(typeof gunRig==='function')gunRig(H,o,{handPt:[J.handL.clone().sub(J.elL),J.handR.clone().sub(J.elR)]});
      else{m.position.copy(H.hand).add(new THREE.Vector3(0,.02,-.18));H.arms[1].el.add(m);H.muzzleL=m.position.clone().add(new THREE.Vector3(0,.03,-.45));}
      H.rifle=m;
    }).catch(()=>{});
  }

  /* ---------- the Harbinger: the Hollow King's flagship. Same size and facing as the code model (about 1000 units, bow toward -z) ---------- */
  function harbinger(cb){
    load('harbinger').then(src=>{const g=src.geometry.clone();g.computeBoundingBox();const b=g.boundingBox,s=1000/(b.max.z-b.min.z);
      g.translate(-(b.max.x+b.min.x)/2,-(b.max.y+b.min.y)/2,-(b.max.z+b.min.z)/2);g.scale(s,s,s);
      const m=src.material.clone();m.emissive=C(0x9a45ff);m.emissiveMap=m.map;m.emissiveIntensity=.55;m.metalness=.7;m.roughness=.35;
      cb(g,m);}).catch(()=>{});
  }
  /* ---------- Bryce's ships and structures (models/<name>.glb: centred, bow toward -z, longest side 1 unit) ----------
     swapShip(grp,name,opts) loads the model, sizes it to the code-built ship it replaces (opts.ref: that ship's geometry, matched on
     length along z, or opts.len), centres it on it, hides the code meshes (opts.hide, default every mesh in grp), adds it.
     opts.tint multiplies the paint (a red Wraith for the aliens), opts.glow lifts the texture a little in dark space (0..1),
     opts.k scales on top, opts.ground puts its underside where the code ship's was. Returns a promise of the added mesh; a missing file changes nothing. */
  const shipMats={};
  function swapShip(grp,name,opts){opts=opts||{};
    return load(name).then(src=>{
      const g=src.geometry;if(!g.boundingBox)g.computeBoundingBox();const bm=g.boundingBox,lm=bm.max.z-bm.min.z,cm=bm.getCenter(new THREE.Vector3());
      let len=opts.len||1,cc=new THREE.Vector3(),br=null;
      if(opts.ref){if(!opts.ref.boundingBox)opts.ref.computeBoundingBox();br=opts.ref.boundingBox;len=br.max.z-br.min.z;br.getCenter(cc);}
      const k=len/lm*(opts.k||1);
      const key=name+'|'+(opts.tint||'')+'|'+(opts.glow||0);let mat=shipMats[key];
      if(!mat){mat=src.material.clone();if(opts.tint)mat.color=C(opts.tint);if(opts.glow){mat.emissive=new THREE.Color(1,1,1);mat.emissiveMap=mat.map;mat.emissiveIntensity=opts.glow;}
        if(opts.fog===false)mat.fog=false;mat.needsUpdate=true;shipMats[key]=mat;}
      const mesh=new THREE.Mesh(g,mat);mesh.scale.setScalar(k);mesh.position.copy(cc).addScaledVector(cm,-k);
      if(opts.ground&&br)mesh.position.y=br.min.y-bm.min.y*k;   // stand it where the code ship stood (landing gear on the pad)mesh.castShadow=!!opts.shadow;mesh.receiveShadow=!!opts.shadow;
      if(opts.yaw)mesh.rotation.y=opts.yaw;
      for(const o of(opts.hide||grp.children.filter(c=>c.isMesh)))o.visible=false;
      grp.add(mesh);grp.userData.model=mesh;return mesh;
    }).catch(e=>{console.warn('ship',name,e&&e.message);return null;});
  }
  // a model mesh cut in two across its length (bow and stern), with a jagged break: for ships that are blown in half
  const halfCache={};
  function halves(mesh,cut){const g=mesh.geometry,key=g.uuid+(cut||.5);if(!halfCache[key]){if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox,zc=b.min.z+(b.max.z-b.min.z)*(cut||.5),span=b.max.z-b.min.z;
      const P=g.attributes.position,I=g.index?g.index.array:null,n=I?I.length:P.count,A=[],B=[];
      for(let t=0;t<n;t+=3){const a=I?I[t]:t,b2=I?I[t+1]:t+1,c=I?I[t+2]:t+2,z=(P.getZ(a)+P.getZ(b2)+P.getZ(c))/3,x=(P.getX(a)+P.getX(b2)+P.getX(c))/3,y=(P.getY(a)+P.getY(b2)+P.getY(c))/3;
        const jag=Math.sin(x*37.1+y*21.7)*span*.06;(z<zc+jag?A:B).push(a,b2,c);}
      const mk=idx=>{const h=g.clone();h.setIndex(idx);return h;};halfCache[key]=[mk(A),mk(B)];}
    return halfCache[key].map(h=>{const m=new THREE.Mesh(h,mesh.material);m.scale.copy(mesh.scale);m.position.copy(mesh.position);m.rotation.copy(mesh.rotation);return m;});}
  // after a swap: move a ship's engine glows (THREE.Points) to the model's stern, and hide the old window lights that floated off it
  function sternGlow(mesh,points,hide){if(!mesh)return;const g=mesh.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox,k=mesh.scale.x,p=mesh.position;
    const z=p.z+b.max.z*k*.96,y=p.y+(b.min.y+b.max.y)/2*k,w=(b.max.x-b.min.x)*k;
    for(const P of points||[]){if(!P)continue;const pts=[new THREE.Vector3(-w*.18,y,z),new THREE.Vector3(w*.18,y,z),new THREE.Vector3(0,y,z)];P.geometry.setFromPoints(pts);}
    for(const h of hide||[])if(h)h.visible=false;}
  // start downloading early (a chapter calls this with what it needs)
  function preload(names){for(const n of names)load(n).catch(()=>{});}
  return{load,dress,harbinger,swapShip,sternGlow,halves,preload,RIGS,get tier(){return TIER;}};
})();
