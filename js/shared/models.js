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
  const PC_FILES=new Set(['michael','elias','hollow-king','host-trooper','watcher','interceptor','raven','vanguard','voidclass','wraith','harrower','dropship','cliff','tower',
    // Oct 24: Bryce's guns and props (both sets: 512 px textures for phones, 1024 px for PCs)
    'pistol','pistol-custom','pistol-custom-2','sniper','launcher','turret','mech','keeper-door','supercomputer','dome',
    // Oct 24 (second set): doors, the display terminal, the Herald mech, and the Herald/Hollow guns and heavies for the Armory
    'hollow-door','herald-door','keeper-door-2','terminal','herald-mech','herald-rifle','hollow-gun','heavy','hollow-heavy','herald-heavy','fp-arms',
    // Oct 24 (third set): Tide City's sea guns, the railgun and the missile battery, alternating round the ring
    'sea-rail','sea-missile',
    // Oct 25: the Meshy characters (models/pc/chars/: 100k triangles, 2048 px)
    'chars/michael-hall','chars/keeper-footsoldier','chars/herald-footsoldier','chars/herald-heavy','chars/herald-engineer','chars/herald-sniper',
    'jetpack',   // the Pathfinders' jetpack (Oct 25 evening)
    'chars/herald-general','chars/herald-commander','chars/hollow-footsoldier','chars/hollow-heavy','chars/hollow-commander','chars/hollow-king','chars/elias-veyr','chars/keepers-civilian','chars/keeper-pathfinder']);
  let TIER='auto';try{TIER=localStorage.getItem('elyra.assets')||'auto';}catch(_){}
  const touch=matchMedia('(pointer: coarse)').matches;
  /* crowd versions of the Meshy characters (Oct 25), for scenes with a lot of people at once:
     models/chars/lod/<name>.glb  about 7.5-12k triangles, 512 px (the old models' weight): crowds, and everyone on Model detail: light
     models/chars/far/<name>.glb  about 3k triangles, 256 px: Tide City's instanced Host and guards, seen from the air
     dress(H,kind,{lod:'lod'|'far'|'phone'}): 'phone' is the lod file on phones and the normal file on PCs. A kind with no such file uses the next size up. */
  const LODS={lod:new Set(['hollow-footsoldier','hollow-heavy','hollow-commander','keeper-footsoldier','herald-footsoldier','herald-heavy']),
    far:new Set(['hollow-footsoldier','hollow-commander','keeper-footsoldier','keepers-civilian'])};   // (the civilian's far file is about 800 triangles: Tide City's plaza crowds)
  function lodOf(kind,q){if(q==='phone')q=touch?'lod':null;if(q===true)q='lod';
    if(!q&&TIER==='light')q='lod';
    if(q==='far'&&!LODS.far.has(kind))q='lod';
    return q&&LODS[q]&&LODS[q].has(kind)?q:null;}
  function file(name){if(TIER==='light'&&name==='marine-hi')return'marine';
    // the Keeper marines: the detailed marine (marine-hi, the same figure at higher detail) wherever the PC set is used
    if(name==='marine'&&(TIER==='full'||(TIER==='auto'&&!touch)))return'marine-hi';
    if(PC_FILES.has(name)&&(TIER==='full'||(TIER==='auto'&&!touch)))return'pc/'+name;return name;}
  // the first mesh in a file (each file holds one)
  let pending=0;const idleW=[];
  function settle(){pending--;if(pending<=0)setTimeout(()=>{if(pending>0)return;while(idleW.length)idleW.shift()();},80);}   // (after the callbacks waiting on the file)
  function load(name){name=file(name);
    if(cache[name])return cache[name];pending++;
    const P=cache[name]=loader().then(L=>new Promise((ok,no)=>L.load('models/'+name+'.glb?v=5',g=>{let mesh=null;g.scene.traverse(o=>{if(!mesh&&o.isMesh)mesh=o;});mesh?ok(unpack(mesh)):no(new Error('empty '+name));},undefined,no)));
    P.then(settle,settle);return P;}
  // resolves once every model asked for so far has arrived and been put on (or ms have passed): the loading screen waits on it
  function idle(ms){return new Promise(ok=>{if(pending<=0){setTimeout(ok,30);return;}idleW.push(ok);if(ms)setTimeout(ok,ms);});}

  /* ---------- characters ---------- */
  // joints measured off each model (model units): shoulder, elbow, wrist, hip joint, knee, ankle as [sideways, height];
  // pelvis and neck heights; h = height in metres in the game; file = which model
  const RIGS={
    marine:  {file:'marine',  h:1.9, pelvis:.03,  neck:.37, sh:[.14,.29],  el:[.228,.15], wr:[.244,.016],hp:[.063,.03],kn:[.075,-.22],an:[.08,-.43]},
    hero:    {file:'michael', h:1.85,pelvis:-.01, neck:.34, sh:[.12,.27],  el:[.145,.1],  wr:[.165,-.03], hp:[.06,-.01], kn:[.062,-.2], an:[.07,-.42]},   // Lt. Michael Hall (Bryce's model, Oct 20)
    elias:   {file:'elias',   h:1.86,pelvis:-.02, neck:.35, sh:[.12,.29],  el:[.15,.12],   wr:[.16,-.02],   hp:[.05,-.02], kn:[.06,-.22], an:[.075,-.43],cape:-.06,armIn:.1},   // Master Elias Veyr: robe and cape, he stands
    // the Empty Host trooper: his rifle is part of the model, hanging along his right forearm, so he aims by pointing the arm (gunAlong)
    host:    {file:'host-trooper',h:2.2,pelvis:0,  neck:.35, sh:[.135,.29], el:[.17,.13],   wr:[.205,-.02],  hp:[.05,0],    kn:[.085,-.2], an:[.09,-.43],gunAlong:true},
    king:    {file:'hollow-king',h:4.4,pelvis:-.02,neck:.36, sh:[.14,.3],   el:[.2,.19],    wr:[.29,.08],    hp:[.07,-.02], kn:[.1,-.2],   an:[.11,-.42],hand:1.1,split:true},   // claws: the hand bone reaches their tips, and no faces bridge arm and body
    engineer:{file:'engineer',h:1.88,pelvis:.03,  neck:.34, sh:[.134,.275],el:[.205,.14], wr:[.2,.01],   hp:[.07,.03], kn:[.095,-.2],an:[.1,-.425]},
    // Bryce's Keeper civilian (Tripo, Oct 20). The crate standing by her left boot was cut out of the mesh; her arms hang close to her
    // thighs, so armIn keeps the arm bones off the legs below the waist, and cape keeps the scarf on her back with the trunk.
    // Her legs were generated pressed together (one fused surface), so they tear when they swing: use her standing or working, not walking.
    // (R.split, below, drops faces that bridge two limbs; it helps a little on fused models.)
    civilian:{file:'civilian',h:1.7, pelvis:-.015,neck:.31, sh:[.105,.245],el:[.125,.095],wr:[.13,-.04],  hp:[.045,-.015],kn:[.052,-.215],an:[.035,-.43],cape:-.08,armIn:.097},
    /* Oct 25: Bryce's Meshy characters (models/chars/<name>.glb: 30k triangles, 1024 px textures for phones; models/pc/chars/: 100k
       triangles, 2048 px, for PCs; both with normal maps baked from the 1.3M-face masters). They were made in a T-pose, so down
       brings the arms most of the way to the sides at rest (poseHuman's relax; the older A-pose models use .55).
       capeLow: the cape hanging further back than that below the knees stays with the trunk too, instead of stretching between the legs. Heights are the
       masters' own (1.8 to 2.5 m), except the King, kept at the old King's 4.4 m. Swapped into every chapter Oct 25 (Michael, Elias,
       the King, the Keeper marines and officers, the Empty Host and the Heralds; civilians and Keeper engineers keep their models).
       gun: the enemy's own weapon in its hands instead of the Keeper rifle (GUNFIT below); the Hollow heavy carries his in the model. */
    // Lt. Michael Hall (Meshy, Oct 25) (1.9 m)
    'michael-hall':{file:'chars/michael-hall',h:1.9,pelvis:0.03,neck:0.365,sh:[0.133,0.22],el:[0.248,0.179],wr:[0.342,0.118],hp:[0.067,0.03],kn:[0.092,-0.215],an:[0.115,-0.455],down:.9,hand:.7},
    // Keeper foot soldier (1.8 m)
    'keeper-footsoldier':{file:'chars/keeper-footsoldier',h:1.8,pelvis:0.03,neck:0.365,sh:[0.127,0.288],el:[0.284,0.279],wr:[0.412,0.272],hp:[0.072,0.03],kn:[0.102,-0.215],an:[0.133,-0.455],down:.9,hand:.7},
    // Herald foot soldier (2 m)
    'herald-footsoldier':{file:'chars/herald-footsoldier',gun:'herald-rifle',h:2,pelvis:0.03,neck:0.365,sh:[0.124,0.27],el:[0.286,0.266],wr:[0.417,0.261],hp:[0.073,0.03],kn:[0.1,-0.215],an:[0.12,-0.455],down:.9,hand:.7},
    // Herald heavy soldier (2.1 m)
    'herald-heavy':{file:'chars/herald-heavy',gun:'herald-heavy',h:2.1,pelvis:0.03,neck:0.365,sh:[0.124,0.285],el:[0.294,0.28],wr:[0.432,0.264],hp:[0.067,0.03],kn:[0.104,-0.215],an:[0.137,-0.455],down:.9,hand:.7},
    // Herald engineer: the staff in his left hand is cut out (it would bend with his leg); the grip stays in the hand (2.1 m)
    'herald-engineer':{file:'chars/herald-engineer',gun:'herald-rifle',h:2.1,pelvis:0.03,neck:0.365,sh:[0.112,0.274],el:[0.274,0.267],wr:[0.405,0.26],hp:[0.068,0.03],kn:[0.105,-0.215],an:[0.13,-0.455],down:.9,hand:.7,cut:(x,y,z)=>-z>.33&&(y>.31||y<.215)},
    // Herald sniper: hooded, cape, rifle slung on the back (1.9 m)
    'herald-sniper':{file:'chars/herald-sniper',gun:'herald-rifle',h:1.9,pelvis:0.03,neck:0.365,sh:[0.135,0.257],el:[0.287,0.266],wr:[0.409,0.261],hp:[0.075,0.03],kn:[0.132,-0.215],an:[0.1,-0.455],down:.9,hand:.7,cape:-.07,capeLow:.03},
    // Herald general: cape (2 m)
    'herald-general':{file:'chars/herald-general',gun:'herald-rifle',h:2,pelvis:0.03,neck:0.365,sh:[0.135,0.27],el:[0.289,0.278],wr:[0.413,0.273],hp:[0.075,0.03],kn:[0.085,-0.215],an:[0.108,-0.455],down:.9,hand:.7,cape:-.07,capeLow:.03},
    // Herald commander: long cape (2.2 m)
    'herald-commander':{file:'chars/herald-commander',gun:'herald-rifle',h:2.2,pelvis:0.03,neck:0.365,sh:[0.135,0.259],el:[0.276,0.268],wr:[0.391,0.258],hp:[0.075,0.03],kn:[0.12,-0.215],an:[0.148,-0.455],down:.9,hand:.7,cape:-.07,capeLow:.03},
    // Empty Host foot soldier (2.1 m)
    'hollow-footsoldier':{file:'chars/hollow-footsoldier',gun:'hollow-gun',h:2.1,pelvis:0.03,neck:0.365,sh:[0.12,0.238],el:[0.255,0.218],wr:[0.392,0.195],hp:[0.051,0.03],kn:[0.08,-0.215],an:[0.081,-0.455],down:.9,hand:.7},
    // Empty Host heavy (Bryce's remake, Oct 25 evening: arms hanging free, no gun in the model, so he carries the Armory's Hollow heavy gun) (2.1 m)
    'hollow-heavy':{file:'chars/hollow-heavy',gun:'hollow-heavy',split:true,hardArms:true,h:2.1,pelvis:.02,neck:.36,sh:[.15,.27],el:[.19,.1],wr:[.2,-.02],hp:[.075,.02],kn:[.1,-.2],an:[.12,-.44],hand:.5,down:.4,armIn:.14},
    // Empty Host commander: cape (2.2 m)
    'hollow-commander':{file:'chars/hollow-commander',gun:'hollow-gun',h:2.2,pelvis:0.03,neck:0.365,sh:[0.135,0.257],el:[0.292,0.26],wr:[0.419,0.259],hp:[0.075,0.03],kn:[0.092,-0.215],an:[0.116,-0.455],down:.9,hand:.7,cape:-.07,capeLow:.03},
    // the Hollow King (giant in the game, like the old one)
    'hollow-king':{file:'chars/hollow-king',h:4.4,pelvis:0.03,neck:0.365,sh:[0.1,0.206],el:[0.242,0.211],wr:[0.363,0.198],hp:[0.055,0.03],kn:[0.047,-0.215],an:[0.027,-0.455],down:.9,hand:.9,split:true},
    // Keeper civilian (Bryce's Meshy remake, Oct 25 evening, T-pose; 1.6 m): every civilian in the game
    'keepers-civilian':{file:'chars/keepers-civilian',h:1.6,pelvis:0,neck:.36,sh:[.095,.285],el:[.255,.285],wr:[.42,.28],hp:[.05,0],kn:[.055,-.225],an:[.055,-.455],down:.9,hand:.55},
    // the Pathfinder soldier (Bryce's, Oct 25 evening; 2 m, arms hanging, no rifle in the model): Rhen's strike team
    'keeper-pathfinder':{file:'chars/keeper-pathfinder',split:true,hardArms:true,pack:{name:'jetpack',k:.82,y:-.16,z:.09},h:2,pelvis:.03,neck:.36,sh:[.15,.29],el:[.18,.13],wr:[.2,-.01],hp:[.07,.03],kn:[.085,-.22],an:[.1,-.45],hand:.45,down:.4,armIn:.142},
    // Master Elias Veyr (Meshy, Oct 25; 1.9 m): long robe and cape, so the cape rules keep it with his trunk; best standing or walking slowly
    'elias-veyr':{file:'chars/elias-veyr',h:1.9,pelvis:0.03,neck:0.365,sh:[0.135,0.267],el:[0.285,0.274],wr:[0.406,0.278],hp:[0.075,0.03],kn:[0.1,-0.215],an:[0.11,-0.455],down:.9,hand:.7,cape:-.07,capeLow:.03},
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
      const A=R.arms&&R.arms[k]||R;   // R.arms.L / .R: arms hanging differently (the Hollow heavy's left hangs at his hip, the right holds the gun down by his knee)
      J['sh'+k]=toGame(R,s*A.sh[0],A.sh[1]);J['el'+k]=toGame(R,s*A.el[0],A.el[1]);J['wr'+k]=toGame(R,s*A.wr[0],A.wr[1]);
      J['hand'+k]=J['wr'+k].clone().add(J['wr'+k].clone().sub(J['el'+k]).multiplyScalar(R.hand||.55));   // R.hand: long hands or claws reach further past the wrist
      const G=R.legs&&R.legs[k]||R;   // R.legs.L / .R: a model standing with its feet apart unevenly gets each leg's own joints
      J['hp'+k]=toGame(R,s*G.hp[0],G.hp[1]);J['kn'+k]=toGame(R,s*G.kn[0],G.kn[1]);J['an'+k]=toGame(R,s*G.an[0],G.an[1]);
      J['toe'+k]=J['an'+k].clone().add(new THREE.Vector3(0,-.05*H,-.09*H));}
    return J;}
  function buildGeo(kind,src,q){const gk=kind+'|'+(q||'');
    if(geoCache[gk])return geoCache[gk];
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
      const side=p.x<0?-1:1,cape=capeZ!=null&&p.z>capeZ&&(p.y>J.knR.y-.05*R.h||(R.capeLow!=null&&p.z>capeZ+R.capeLow*R.h));
      // R.held: a weapon that is part of the model, hanging from the right hand beside the thigh: past this sideways distance and
      // below the elbow it follows only the right forearm (not the leg it hangs next to)
      // (a function gets the model-space sideways, forward and up position: the heavy stands turned, his gun close by his right leg)
      if(R.held&&p.y<J.elR.y&&(typeof R.held==='function'?R.held(p.x/R.h,-p.z/R.h,p.y/R.h-.5):p.x>R.held*R.h)){w.fill(0);w[6]=1;}
      else for(const [b,a,c,s] of segs){
        if(cape&&b>2)continue;
        if(R.armsFixed&&b>=3&&b<=6)continue;   // arms (and what they hold) ride the torso
        if(s){if(s!==side&&Math.abs(p.x)>.012*R.h)continue;
          const arm=b>=3&&b<=6,leg=b>=7;
          if(arm&&Math.abs(p.x)<trunkW&&p.y>J.elR.y)continue;   // the chest belongs to the torso, not the arms
          if(arm&&R.armIn&&Math.abs(p.x)<R.armIn*R.h&&p.y<J.pelvis.y+.06*R.h)continue;   // arms hanging by the thighs: the legs keep their own skin
          if(arm&&R.handsAbove&&p.y<J.knR.y)continue;
          if(arm&&R.armLow!=null&&p.y<(R.armLow+.5)*R.h)continue;   // nothing below the fingertips (model height armLow) follows an arm: the hand hangs by a holster or thigh plate   // nothing below the knees follows an arm (the heavy's feet stand right under his gun)
          if(leg&&p.y>legY)continue;}
        else if(b===0&&p.y<J.knR.y)continue;
        if(R.armIn&&b<=1&&!cape&&p.y<J.hpR.y-.01*R.h)continue;   // slim legs close together: below the hip joints only the legs move the skin
        const d=segDist3(p,a,c)/R.h+.004;const v=1/Math.pow(d,5);if(v>w[b])w[b]=v;}
      // keep the four strongest bones
      const top=[];for(let b=0;b<11;b++)if(w[b]>0)top.push(b);top.sort((a,b)=>w[b]-w[a]);top.length=Math.min(4,top.length);
      // R.hardArms: no blending between an arm and the rest (hands that hang against the hips smeared into sheets when the arm came up)
      if(R.hardArms&&top.length){const isA=b=>b>=3&&b<=6,pa=isA(top[0]);for(let k=top.length-1;k>0;k--)if(isA(top[k])!==pa||(pa&&(top[k]<5)!==(top[0]<5)))top.splice(k,1);}
      let sum=0;for(const b of top)sum+=w[b];if(!top.length){top.push(1);w[1]=1;sum=1;}
      top.forEach((b,k)=>{si[i*4+k]=b;sw[i*4+k]=w[b]/sum;});}
    g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
    // R.split: a model generated with its legs (or a hand and a thigh) touching has faces bridging them, which tear into sheets when
    // they move apart. Drop every face whose corners belong to different limbs (left leg / right leg / left arm / right arm).
    // (and the trunk below the elbows counts as a limb of its own, so a hand hanging against the belt tears free of it too)
    if(R.split&&g.index){const lowY=J.elR.y,limb=(b,v)=>b===7||b===8?1:b===9||b===10?2:b===3||b===4?3:b===5||b===6?4:pos.getY(v)<lowY?5:0,idx=g.index.array,keep=[];
      for(let i=0;i<idx.length;i+=3){const a=limb(si[idx[i]*4],idx[i]),b=limb(si[idx[i+1]*4],idx[i+1]),c=limb(si[idx[i+2]*4],idx[i+2]);
        const L=[a,b,c].filter(x=>x),arm=L.some(x=>x===3||x===4),cross=arm?L.some(x=>x!==L[0]):L.filter(x=>x<5).some((x,_,A)=>x!==A[0]);if(!cross)keep.push(idx[i],idx[i+1],idx[i+2]);}
      g.setIndex(keep);}
    g.computeBoundingSphere();
    return geoCache[gk]={g,J,R};
  }
  const matCache={};
  /* lift (Oct 22, enemies you couldn't see): {c,k} makes the armour glow faintly from its own texture in colour c at strength k, so
     a trooper still reads against dark walls, in the dark below the Hollow, and against Astraea's red sand */
  /* hue 'amber' (Oct 25): the Heralds' amber side. The Herald models are painted red and black, and a tint only multiplies, so it can't
     turn red to amber: this swaps the texture's saturated reds for amber in the shader (greys, blacks and the other colours stay). */
  const AMBER='vec3 _c=diffuseColor.rgb;float _s=clamp((_c.r-max(_c.g,_c.b))*2.5,0.,1.);diffuseColor.rgb=mix(_c,vec3(_c.r,_c.r*.66,_c.r*.1)*1.2,_s);';
  function hueShift(m,hue){if(hue!=='amber')return;
    m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+AMBER)
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{vec3 _e=totalEmissiveRadiance;float _t=clamp((_e.r-max(_e.g,_e.b))*2.5/max(_e.r,.001),0.,1.);totalEmissiveRadiance=mix(_e,vec3(_e.r,_e.r*.66,_e.r*.1)*1.2,_t);}');};
    m.customProgramCacheKey=()=>'amber';}
  function material(kind,src,tint,lift,hue){const k=kind+(tint||'')+(lift?'|'+lift.c+'|'+lift.k+'|'+!!lift.flat:'')+(hue||'');if(matCache[k])return matCache[k];
    const m=src.material.clone();m.skinning=true;if(tint)m.color.copy(C(tint));hueShift(m,hue);
    // the Meshy files are fully metallic, painted by their metal map: with nothing to reflect (no scene.environment: The Mountain, the
    // Pathfinder arcs) metal reads near black, so it is eased off there, as the props are; Tide City and the space battle keep it
    if(m.metalness>.55&&!(typeof scene!=='undefined'&&scene&&scene.environment))m.metalness=.55;
    const RG=RIGS[kind.replace(/(lod|far)$/,'')];if(RG&&RG.split)m.side=THREE.DoubleSide;
    if(RG&&RG.bright)m.color.multiplyScalar(RG.bright);   // a model painted near black (the Pathfinder soldier): lifted so the armour's shapes read under the game's lights   // where R.split tore a limb free, the inside of the shell shows instead of a hole
    if(lift){m.emissive=C(lift.c);m.emissiveIntensity=lift.k;if(m.map&&!lift.flat)m.emissiveMap=m.map;}   // flat: an even glow, not the texture's own colours (pale armour from a dark model)
    m.needsUpdate=true;return matCache[k]=m;}

  // turn a code-built person into their model. kind: hero, marine, engineer, elias, host, king, civilian, or one of the Oct 25 characters
  // (michael-hall, keeper-footsoldier, herald-footsoldier/-heavy/-engineer/-sniper/-general/-commander, hollow-footsoldier/-heavy/-commander/-king, elias-veyr). opts.tint darkens a squadmate's armour.
  // opts.gun: a GUNFIT gun instead of the rig's own (or the Keeper rifle); opts.lod: a crowd version (see LODS)
  function dress(H,kind,opts){opts=opts||{};
    if(!RIGS[kind]){console.warn('no rig',kind);return Promise.resolve(H);}
    if(opts.unarmed&&H&&H.gun){H.gun.parent.remove(H.gun);H.gun=null;}   // drop the code rifle now, not when the file arrives
    if(!H||H.glb||H.dressing)return Promise.resolve(H);H.dressing=true;
    const q=lodOf(kind,opts.lod);
    return load(q?'chars/'+q+'/'+kind:RIGS[kind].file).then(src=>{
      if(!H.root)return H;
      const {g,J,R}=buildGeo(kind,src,q),mat=material(kind+(q||''),src,opts.tint,opts.lift,opts.hue);
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
      if(opts.unarmed&&H.gun){H.gun.parent.remove(H.gun);H.gun=null;}
      if(!opts.unarmed&&!R.gunAlong&&!R.armsFixed)H.armedP=attachRifle(H,J,opts.gun||R.gun);
      if(R.armsFixed){if(H.gun){H.gun.parent.remove(H.gun);H.gun=null;}H.armsFixed=true;const m=R.muzzleAt||[.2,0,0];
        H.muzzleL=new THREE.Vector3(m[2]*R.h,(m[1]+.5)*R.h,-m[0]*R.h).sub(J.elR);}
      if(R.gunAlong){if(H.gun){H.gun.parent.remove(H.gun);H.gun=null;}H.gunAlong=true;const d=J.wrR.clone().sub(J.elR);H.muzzleL=d.clone().add(d.clone().normalize().multiplyScalar(R.muzzle||.62*R.h/2.2));}
      if(H.gun&&typeof poseGun==='function')poseGun(H,H._aim||0,false);   // the new joints start at rest: put the hands back on the rifle
      // R.pack: gear on the back (the Pathfinders' jetpack, Bryce's model): on the torso, flat face to the back. Its file stands on y = 0
      // with the flat face toward +z, so it's turned round; H.packNoz are its two nozzles (torso space) for the thruster glows
      if(R.pack&&!opts.noPack){const K=R.pack;propObj(K.name,K.k).then(o=>{if(!H.root)return;o.traverse(c=>{c.userData.keep=true;c.castShadow=true;});o.rotation.y=Math.PI;o.position.set(0,K.y,K.z+.17*K.k);H.torso.add(o);H.pack=o;
        H.packNoz=[-1,1].map(x=>new THREE.Vector3(x*.2*K.k,K.y+.02,K.z+.22*K.k));}).catch(()=>{});}
      H.dressing=false;return H;
    }).catch(e=>{H.dressing=false;console.warn('model',kind,e&&e.message);return H;});
  }
  /* ---------- the enemy (Oct 25): one place that picks an Empty Host or Herald soldier's model and how it's lit.
     side: 'host' (the Empty Host), 'red' or 'amber' (the two Herald sides). unit: 'footsoldier', 'heavy', 'commander' (both),
     'sniper', 'engineer', 'general' (Heralds only); unit() picks one for a regular spawn: mostly foot soldiers, some heavies,
     now and then a leader. The lift keeps them reading in the dark without hiding the paint: the Host glows faintly purple from its own
     texture; red keeps its own red and black; amber has its reds turned amber (hue) so the two sides can be told apart. ---------- */
  const HOST_UNITS=new Set(['footsoldier','heavy','commander']),HERALD_UNITS=new Set(['footsoldier','heavy','commander','sniper','engineer','general']);
  function enemyKind(side,unit){const herald=side==='red'||side==='amber';unit=unit||'footsoldier';
    if(!(herald?HERALD_UNITS:HOST_UNITS).has(unit))unit=unit==='general'?'commander':'footsoldier';
    return(herald?'herald-':'hollow-')+unit;}
  function enemyLook(side,k){if(side==='red')return{lift:{c:0x9a1808,k:k!=null?k:.22}};
    if(side==='amber')return{hue:'amber',lift:{c:0xe0a040,k:k!=null?k:.2}};
    return{lift:{c:0x9a6ad0,k:k!=null?k:.32}};}
  function unit(side,r){r=r==null?Math.random():r;const herald=side==='red'||side==='amber';
    if(herald)return r<.13?'heavy':r<.22?'engineer':r<.27?'sniper':r<.3?'commander':r<.32?'general':'footsoldier';
    return r<.15?'heavy':r<.2?'commander':'footsoldier';}
  // dress H as an enemy: o.unit, o.k (lift strength), o.lod, o.unarmed. Resolves like dress(); H.unit and H.kind say what it became
  function enemy(H,side,o){o=o||{};const kind=enemyKind(side,o.unit);H.kind=kind;H.unit=kind.replace(/^(hollow|herald)-/,'');
    return dress(H,kind,Object.assign(enemyLook(side,o.k),{lod:o.lod,unarmed:o.unarmed}));}
  // the rifle: the sci-fi assault rifle model, held along the forearm, muzzle toward -z when the forearm hangs straight down
  // the rifle model as a ready object (muzzle toward -z, with its grip points), for anyone to hold
  // the standard Keeper rifle: since Oct 24 Bryce's Assault Rifle Default 2 (the Armory's 'vigil' file, models/gun-vigil.glb).
  // (The first sci-fi rifle and the robot were removed on Oct 25, Bryce's call: untextured, never placed.)
  function rifleObj(){return gunObj('vigil');}
  /* ---------- the Armory's guns (Bryce's models, Oct 24; PG.arms in js/shared/progress.js picks them).
     models/gun-<id>.glb (phone) and models/pc/gun-<id>.glb: every file is already centred, muzzle toward -z, top up, exactly 1 unit long,
     so nothing has to be measured here (r128 can't measure compressed files). len: metres in the game (the standard rifle is .86);
     R, L, mz: the trigger hand, the fore hand and the muzzle as [z, y] in the file's units, read off a side view. ---------- */
  const GUNDEF={
    m254:    {len:.86,R:[.16,-.07],  L:[-.19,-.015],mz:[-.495,.08]},
    vigil:   {len:.86,R:[.10,-.055], L:[-.25,-.055],mz:[-.48,.075]},
    night:   {len:.8, R:[.195,-.045],L:[-.15,.025], mz:[-.5,.077]},
    carbine: {len:.88,R:[.19,-.005], L:[-.17,.06],  mz:[-.495,.09]},
    smg:     {len:.68,R:[.08,.005],  L:[-.12,-.015],mz:[-.495,.155]},
    desert:  {len:.92,R:[.21,-.065], L:[-.17,-.045],mz:[-.51,-.025]},
    longshot:{len:1.1,R:[.14,.005],  L:[-.15,.02],  mz:[-.495,.053]},
    // a sidearm skin: held out at arm's length like the pistols in GUNM (butt in metres, side: both hands on the grip)
    revolver:{len:.34,R:[.28,.005],  L:[.30,-.12],  mz:[-.49,.17],butt:.46,side:true},
  };
  const gunScenes={};
  function gunObj(id){const D=GUNDEF[id]||GUNDEF.vigil;if(!GUNDEF[id])id='vigil';
    const f=(TIER==='full'||(TIER==='auto'&&!touch))?'pc/gun-'+id:'gun-'+id;
    if(!gunScenes[f]){pending++;gunScenes[f]=loader().then(L=>new Promise((ok,no)=>L.load('models/'+f+'.glb?v=1',g=>ok(g.scene),undefined,no)));gunScenes[f].then(settle,settle);}
    return gunScenes[f].then(sc=>{const k=D.len,o=new THREE.Group(),m=sc.clone(true);m.scale.multiplyScalar(k);
      m.traverse(c=>{if(c.isMesh){c.castShadow=true;c.frustumCulled=false;if(c.material&&!c.material._armed){c.material.envMapIntensity=1.2;c.material._armed=true;}}});o.add(m);
      const v=a=>new THREE.Vector3(0,a[1]*k,a[0]*k);
      o.userData.grip={R:v(D.R),L:v(D.L).setX(D.side?-.02:0),muzzle:v(D.mz),butt:D.butt||.5*k,side:!!D.side};o.userData.gunId=id;return o;});}
  // the gun for a weapon slot as the Armory has it equipped ('rifle' or 'lance'): the standard rifle unless something was bought
  // (merged Oct 24: the Lance's standard issue is Bryce's sniper model, the Breaker always the launcher, and the 'side' slot the sidearm's
  //  skins, all built by gun() below; GUNDEF's skins stay as they were)
  function slotGun(slot){const id=typeof PG!=='undefined'&&PG.arms?PG.arms.equipped(slot):'standard';
    if(GUNFIT[id])return propGun(id);   // the Herald and Hollow guns (Pulse rifle and Breaker skins)
    if(slot==='breaker')return gun('breaker');
    if(slot==='side')return GUNDEF[id]?gunObj(id):gun(id==='standard'?'pistol':id);
    if(id==='standard')return slot==='lance'?gun('lance'):rifleObj();
    return gunObj(id);}
  function attachRifle(H,J,gunName){
    return(gunName&&GUNFIT[gunName]?propGun(gunName):rifleObj()).then(o=>{o.traverse(c=>{c.userData.keep=true;});
      // the rifle sits in the shoulder and both hands reach for it (gunRig in js/origin/02-people.js); muzzle toward -z
      if(typeof gunRig==='function')gunRig(H,o,{handPt:[J.handL.clone().sub(J.elL),J.handR.clone().sub(J.elR)]});
      else{o.position.copy(H.hand).add(new THREE.Vector3(0,.02,-.18));H.arms[1].el.add(o);H.muzzleL=o.position.clone().add(o.userData.grip.muzzle);}
      H.rifle=o;
    }).catch(()=>{});
  }

  /* ---------- the Harbinger: the Hollow King's flagship. Same size and facing as the code model (about 1000 units, bow toward -z) ---------- */
  function harbinger(cb){
    load('harbinger').then(src=>{const g=src.geometry.clone();g.computeBoundingBox();const b=g.boundingBox,s=1000/(b.max.z-b.min.z);
      g.translate(-(b.max.x+b.min.x)/2,-(b.max.y+b.min.y)/2,-(b.max.z+b.min.z)/2);g.scale(s,s,s);
      const m=src.material.clone();m.emissive=C(0x9a45ff);m.emissiveMap=m.map;m.emissiveIntensity=.55;m.metalness=.7;m.roughness=.35;m.side=THREE.DoubleSide;
      cb(g,m);}).catch(()=>{});
  }
  /* ---------- Bryce's ships and structures (models/<name>.glb: centred, bow toward -z, longest side 1 unit) ----------
     swapShip(grp,name,opts) loads the model, sizes it to the code-built ship it replaces (opts.ref: that ship's geometry, matched on
     length along z, or opts.len), centres it on it, hides the code meshes (opts.hide, default every mesh in grp), adds it.
     opts.tint multiplies the paint (a red Wraith for the aliens), opts.glow lifts the texture a little in dark space (0..1),
     opts.metal sets its metalness (and drops the metalness map): a full-metal hull with nothing to reflect renders black, so ships
     down on a planet without an environment map (the Dead Ground graveyard) pass a low one. opts.k scales on top, opts.ground puts
     its underside where the code ship's was. Returns a promise of the added mesh; a missing file changes nothing. */
  const shipMats={};
  function swapShip(grp,name,opts){opts=opts||{};
    return load(name).then(src=>{
      const g=src.geometry;if(!g.boundingBox)g.computeBoundingBox();const bm=g.boundingBox,lm=bm.max.z-bm.min.z,cm=bm.getCenter(new THREE.Vector3());
      let len=opts.len||1,cc=new THREE.Vector3(),br=null;
      if(opts.ref){if(!opts.ref.boundingBox)opts.ref.computeBoundingBox();br=opts.ref.boundingBox;len=br.max.z-br.min.z;br.getCenter(cc);}
      const k=len/lm*(opts.k||1);
      const key=name+'|'+(opts.tint||'')+'|'+(opts.glow||0)+'|'+(opts.metal==null?'':opts.metal);let mat=shipMats[key];
      if(!mat){mat=src.material.clone();if(opts.tint)mat.color=C(opts.tint);if(opts.glow){mat.emissive=new THREE.Color(1,1,1);mat.emissiveMap=mat.map;mat.emissiveIntensity=opts.glow;}
        if(opts.metal!=null){mat.metalness=opts.metal;mat.metalnessMap=null;}
        if(opts.fog===false)mat.fog=false;
        // the ship files are single-sided and slimmed, so some faces point inward or are missing: drawn from one side only, a hull
        // seen side-on showed straight through to the stars. Both sides drawn, it reads as solid.
        mat.side=THREE.DoubleSide;mat.transparent=false;mat.depthWrite=true;mat.needsUpdate=true;shipMats[key]=mat;}
      const mesh=new THREE.Mesh(g,mat);mesh.scale.setScalar(k);mesh.position.copy(cc).addScaledVector(cm,-k);
      if(opts.ground&&br)mesh.position.y=br.min.y-bm.min.y*k;   // stand it where the code ship stood (landing gear on the pad)
      mesh.castShadow=!!opts.shadow;mesh.receiveShadow=!!opts.shadow;
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
  /* ---------- whole models (Oct 24): the guns, the turret, the Keeper door, the Tide City mech, the supercomputer, the Codex dome.
     These keep their own materials and several meshes (and some are animated), so they load as a whole scene instead of one mesh.
     scene(name) resolves to the loaded {scene,animations}; copy(name) to a fresh copy you can add (skinned ones through SkeletonUtils,
     so each copy has its own bones). A failed download rejects, and the code-built stand-in stays. */
  let skelP=null;
  function skel(){return skelP||(skelP=THREE.SkeletonUtils?Promise.resolve():script(BASE+'utils/SkeletonUtils.js'));}
  const sceneCache={};
  function scene(name){name=file(name);
    if(sceneCache[name])return sceneCache[name];pending++;
    const P=sceneCache[name]=loader().then(L=>new Promise((ok,no)=>L.load('models/'+name+'.glb?v=4',g=>ok({scene:g.scene,animations:g.animations||[]}),undefined,no)));
    P.then(settle,settle);return P;}
  function copy(name){return Promise.all([scene(name),skel()]).then(([g])=>{let sk=false;g.scene.traverse(o=>{if(o.isSkinnedMesh)sk=true;});
    const s=sk?THREE.SkeletonUtils.clone(g.scene):g.scene.clone(true);
    s.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.isSkinnedMesh)o.frustumCulled=false;}});   // (a skinned mesh's box is its bind pose, not where it stands)
    return{scene:s,animations:g.animations};});}
  // fit a model into a box: turned by ry (and rx), centred on the origin, scaled so its size along `axis` is `size` metres.
  // opts.floor stands it on y = 0 instead of centring it vertically. Returns {o (a group holding it), size (Vector3 after scaling)}.
  function fit(s,opts){const o=new THREE.Group(),inner=new THREE.Group();o.add(inner);inner.add(s);s.rotation.set(opts.rx||0,opts.ry||0,0);inner.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(s),sz=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
    s.position.set(-c.x,opts.floor?-b.min.y:-c.y,-c.z);const k=opts.size/sz[opts.axis||'z'];inner.scale.setScalar(k);
    return{o,size:sz.multiplyScalar(k)};}
  // models made for a scene with reflections look black under plain lights: keep the metal from going dark where there's nothing to reflect
  function tame(s,max){s.traverse(o=>{if(!o.isMesh)return;for(const m of[].concat(o.material)){if(m&&m.metalness>(max==null?.55:max)){m.metalness=max==null?.55:max;m.needsUpdate=true;}}});return s;}
  /* Bryce's supercomputer as a wall console (Oct 25): the file is a tall cabinet with a long bank of computers beside it.
     Resolves to a Group standing on y = 0 with its back on z = 0 and its screens toward +z, the bank's middle on x = 0 (so whoever
     works it stands at x = 0) and the cabinet off toward -x. len = the whole length in metres (cabinet and bank).
     The cabinet's material is saved as see-through (alpha .99), which sorts it with the glass and the holograms: drawn solid here.
     opts.dim (0..1) darkens it, for a room whose power is gone. */
  function supercomputer(len,opts){opts=opts||{};return copy('supercomputer').then(({scene:s})=>{tame(s,.5);
    s.traverse(m=>{if(!m.isMesh)return;m.material=m.material.clone();m.material.transparent=false;m.material.opacity=1;m.material.depthWrite=true;
      if(opts.dim!=null)m.material.color.multiplyScalar(opts.dim);m.material.needsUpdate=true;});
    const {o,size}=fit(s,{size:len,axis:'x',floor:true});o.updateMatrixWorld(true);
    let bank=null;s.traverse(m=>{if(m.isMesh&&/computers/i.test(m.name))bank=m;});   // (the cabinet's mesh is named "...Supercomputer by JJ...", the bank's "...Computers by JJ...")
    const bc=bank?new THREE.Box3().setFromObject(bank).getCenter(new THREE.Vector3()):new THREE.Vector3();
    const g=new THREE.Group();g.add(o);o.position.set(-bc.x,0,size.z/2);g.userData.size=size;return g;});}

  /* ---------- the guns in your hands (Oct 24): the Lance is the sniper model, the Breaker the launcher, and the sidearm has three skins.
     Each becomes a held object like the rifle's (muzzle toward -z, userData.grip R, L, muzzle, butt), so gunRig in js/origin/02-people.js
     can put it in anyone's hands. ry turns the file's barrel onto -z; len is its length in metres. Grips are fractions of the gun:
     [along (-.5 muzzle .. .5 back), up (-.5 bottom .. .5 top)]. butt: how far from the centre the gun sits forward of the shoulder
     (half its length for a shouldered gun; a pistol is held out at arm's length, so its butt is longer than the pistol). ---------- */
  const GUNM={
    lance:            {file:'sniper',         ry:-Math.PI/2,len:1.2, R:[.15,.04], L:[-.12,.17],M:[-.5,.26],butt:.52},
    breaker:          {file:'launcher',       ry:Math.PI,   len:1.15,R:[.03,-.1], L:[-.21,.08],M:[-.5,.26],butt:.5},
    pistol:           {file:'pistol',         ry:Math.PI/2, len:.27, R:[.36,-.2], L:[.3,-.3],  M:[-.5,.15],butt:.44,side:true},
    'pistol-custom':  {file:'pistol-custom',  ry:-Math.PI/2,len:.34, R:[.4,-.18], L:[.34,-.28],M:[-.5,.35],butt:.46,side:true},
    'pistol-custom-2':{file:'pistol-custom-2',ry:-Math.PI/2,len:.32, R:[.38,-.12],L:[.32,-.24],M:[-.5,.4], butt:.46,side:true}};
  function gun(id){const S=GUNM[id];if(!S)return rifleObj();
    return copy(S.file).then(({scene:s})=>{tame(s);const {o,size}=fit(s,{ry:S.ry,size:S.len,axis:'z'}),h=size.y;
      const at=(a,x)=>new THREE.Vector3(x||0,a[1]*h,a[0]*S.len);
      o.userData.grip={R:at(S.R),L:at(S.L,S.side?-.02:0),muzzle:at(S.M),butt:S.butt,side:!!S.side};o.userData.gunId=id;return o;});}

  /* ---------- Bryce's props (Oct 24): doors, the terminal, the weapons. Files with several meshes and materials (the loader above
     takes only the first mesh). raw(name) is the whole glTF (scene, animations); prop(name) is the file's meshes merged per material,
     unpacked to plain floats in the file's own space (baked offline: centred, the weapons a unit long with the muzzle toward -z,
     the doors and the terminal standing on y = 0 facing +z), as [{g, m}] with a box around all of them. ---------- */
  function raw(name){name=file(name);const k='raw:'+name;if(cache[k])return cache[k];pending++;
    const P=cache[k]=loader().then(L=>new Promise((ok,no)=>L.load('models/'+name+'.glb?v=4',ok,undefined,no)));P.then(settle,settle);return P;}
  function mergeGeos(list){let nv=0,ni=0;for(const g of list){nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
    const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),uv=new Float32Array(nv*2),idx=new Uint32Array(ni);let ov=0,oi=0;
    for(const g of list){const n=g.attributes.position.count;pos.set(g.attributes.position.array,ov*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,ov*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,ov*2);
      if(g.index)for(let i=0;i<g.index.count;i++)idx[oi++]=g.index.array[i]+ov;else for(let i=0;i<n;i++)idx[oi++]=i+ov;ov+=n;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(new THREE.BufferAttribute(idx,1));
    g.computeBoundingBox();g.computeBoundingSphere();return g;}
  const propP={};
  function prop(name){const key=file(name);if(propP[key])return propP[key];
    return propP[key]=raw(name).then(G=>{const by=new Map();G.scene.updateMatrixWorld(true);
      G.scene.traverse(o=>{if(!o.isMesh)return;const u=unpack(o),m=o.material;if(!by.has(m))by.set(m,[]);by.get(m).push(u.geometry);});
      const parts=[],box=new THREE.Box3();
      for(const [m,gs] of by){const g=mergeGeos(gs);box.union(g.boundingBox);
        // no environment map in these scenes: a fully metallic surface reads as black, so the metal is eased off and the colour kept
        const mm=m.clone();if(mm.metalness>.55)mm.metalness=.55;if(mm.roughness<.3)mm.roughness=.3;mm.aoMap=null;mm.needsUpdate=true;parts.push({g,m:mm});}
      return{parts,box,size:box.getSize(new THREE.Vector3())};});}
  // a ready Group of a prop (one Mesh per material), scaled by k
  function propObj(name,k){return prop(name).then(P=>{const o=new THREE.Group();for(const p of P.parts){const m=new THREE.Mesh(p.g,p.m);m.castShadow=true;m.receiveShadow=true;o.add(m);}if(k)o.scale.setScalar(k);o.userData.prop=P;return o;});}
  /* instances of a prop: list of {x,y,z,ry,s,sx,sy,sz} (sx/sy/sz multiply the scale per axis); k: model units to metres.
     opts.dim (0..1) scales the glow of the instances marked dim (a dead panel). Returns the InstancedMeshes once they're added. */
  function propInstances(name,parent,list,k,opts){opts=opts||{};if(!list.length)return Promise.resolve([]);
    return prop(name).then(P=>{const out=[],M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(),T=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0);
      for(const dim of[false,true]){const L=list.filter(e=>!!e.dim===dim);if(!L.length)continue;
        for(const p of P.parts){let m=p.m;if(dim&&m.emissive&&(m.emissiveMap||m.emissive.getHex()!==0)){m=m.clone();m.emissiveIntensity*=opts.dim!=null?opts.dim:.15;}
          const im=new THREE.InstancedMesh(p.g,m,L.length);im.castShadow=im.receiveShadow=!opts.noShadow;
          L.forEach((e,i)=>{const s=(e.s||1)*k;T.set(e.x,e.y,e.z);Q.setFromAxisAngle(Y,e.ry||0);S.set(s*(e.sx||1),s*(e.sy||1),s*(e.sz||1));M4.compose(T,Q,S);im.setMatrixAt(i,M4);});
          im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;parent.add(im);out.push(im);}}
      return out;});}
  /* the Herald and Hollow guns (Bryce's models, Oct 24, second set) as ready objects for gunRig: muzzle toward -z, L = length in metres,
     grips measured on each model (a unit long, centre at 0): R the trigger hand, Lf the fore hand, mz the muzzle. The Armory's
     Pulse rifle and Breaker skins (slotGun above) use them. (Merged Oct 24: named propGun so it doesn't clash with gunObj.) */
  const GUNFIT={
    'herald-rifle':{L:.95,R:[0,-.08,.22],Lf:[0,-.1,.02],mz:[0,0,-.5]},
    'hollow-gun':  {L:.82,R:[0,-.11,.18],Lf:[0,-.07,-.15],mz:[0,0,-.5]},
    'heavy':       {L:1.25,R:[0,.02,.17],Lf:[0,.02,.03],mz:[0,.1,-.5],ride:.1},
    'hollow-heavy':{L:1.3,R:[0,-.15,.18],Lf:[0,-.15,.03],mz:[0,0,-.5]},
    'herald-heavy':{L:1.35,R:[0,-.2,.075],Lf:[0,-.2,-.03],mz:[0,0,-.5]}};
  function propGun(f){if(!GUNFIT[f])return rifleObj();const F=GUNFIT[f];
    return propObj(f,F.L).then(o=>{const g=new THREE.Group();g.add(o);const v=a=>new THREE.Vector3(a[0]*F.L,a[1]*F.L,a[2]*F.L);
      o.traverse(m=>{if(m.isMesh)m.castShadow=true;});
      g.userData.grip={R:v(F.R),L:v(F.Lf),muzzle:v(F.mz),butt:.5*F.L*(1-(F.ride||0))};g.userData.file=f;g.userData.gunId=f;return g;});}
  // put a gun object (gunObj / rifleObj) in someone's hands: on a model, the hands reach for it from the model's palms
  function hold(H,o){if(!H||!o||typeof gunRig!=='function')return;const J=H.J;
    gunRig(H,o,J?{handPt:[J.handL.clone().sub(J.elL),J.handR.clone().sub(J.elR)]}:{});
    o.traverse(m=>{if(m.isMesh)m.castShadow=true;});if(typeof poseGun==='function')poseGun(H,H._aim||0,false);}
  /* ---------- statues (Oct 25): a character baked in one pose into a plain mesh, for InstancedMesh crowds (Tide City's Host and
     guards). statue(kind,{h, aim, speed, lod, lift, tint, unarmed}) resolves to {geometry, material}: the skinned model and the gun in its
     hands, posed by poseHuman, merged into one geometry in game space (feet on y = 0, facing -z, h tall; groups per material, so
     material is an array). Needs the code rig (js/origin/02-people.js). ---------- */
  const statueP={};
  function statue(kind,o){o=o||{};const key=kind+'|'+JSON.stringify(o);if(statueP[key])return statueP[key];
    if(typeof makeHuman!=='function')return Promise.reject(new Error('no rig'));
    const H=makeHuman('marine');
    return statueP[key]=dress(H,kind,{lod:o.lod,unarmed:o.unarmed,gun:o.gun}).then(()=>H.armedP).then(()=>{if(!H.glb)throw new Error('no model '+kind);
      if(H.gun&&typeof poseGun==='function')poseGun(H,0,false);
      for(let i=0;i<30;i++)poseHuman(H,.05,o.speed||0,o.aim!=null?o.aim:1,false);
      H.root.updateMatrixWorld(true);
      const sk=H.skin,sg=sk.geometry,P=sg.attributes.position,n=P.count,pos=new Float32Array(n*3),v=new THREE.Vector3();
      for(let i=0;i<n;i++){v.fromBufferAttribute(P,i);sk.boneTransform(i,v);v.applyMatrix4(sk.matrixWorld);pos[i*3]=v.x;pos[i*3+1]=v.y;pos[i*3+2]=v.z;}
      const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.BufferAttribute(pos,3));body.setAttribute('uv',sg.attributes.uv);body.setIndex(sg.index);body.computeVertexNormals();
      const bm=sk.material.clone();bm.skinning=false;if(o.tint)bm.color=C(o.tint);
      if(o.lift){bm.emissive=C(o.lift.c);bm.emissiveIntensity=o.lift.k;if(bm.map)bm.emissiveMap=bm.map;}bm.needsUpdate=true;
      const parts=[{g:body,m:bm}];
      if(H.gun)H.gun.traverse(m=>{if(!m.isMesh||!m.visible)return;const u=unpack(m),mm=(Array.isArray(m.material)?m.material[0]:m.material).clone();mm.skinning=false;parts.push({g:u.geometry,m:mm});});
      // merge, one group per part
      const gs=parts.map(p=>{const g=p.g;if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;});
      const geo=mergeGeos(gs);let at=0;gs.forEach((g,i)=>{const c=g.index?g.index.count:g.attributes.position.count;geo.addGroup(at,c,i);at+=c;});
      const k=(o.h||H.R.h)/H.R.h;geo.scale(k,k,k);geo.computeBoundingBox();geo.computeBoundingSphere();
      if(H.root.parent)H.root.parent.remove(H.root);
      return{geometry:geo,material:parts.map(p=>p.m)};});}
  // a skinned, animated model of its own (the Herald mech): a fresh copy of the scene with its own skeleton, and the clips
  function rigged(name){return raw(name).then(G=>(THREE.SkeletonUtils?Promise.resolve():script(BASE+'utils/SkeletonUtils.js')).then(()=>({scene:THREE.SkeletonUtils.clone(G.scene),clips:G.animations})));}
  // start downloading early (a chapter calls this with what it needs)
  function preload(names){for(const n of names)(n==='rifle'?rifleObj():load(n)).catch(()=>{});}
  function preloadScenes(names){for(const n of names)scene(n).catch(()=>{});}
  return{load,raw,prop,propObj,propInstances,rigged,propGun,GUNFIT,hold,idle,dress,statue,LODS,enemy,enemyKind,enemyLook,unit,rifleObj,gunObj,slotGun,GUNDEF,harbinger,swapShip,sternGlow,halves,preload,preloadScenes,scene,copy,fit,tame,supercomputer,gun,GUNM,RIGS,get tier(){return TIER;}};
})();
