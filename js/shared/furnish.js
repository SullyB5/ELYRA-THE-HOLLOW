/* Elyra shared · FURN: Bryce's Nov 10 prop batch (Sketchfab models, prepared offline: metres, origin centred on x/z, floor at y 0,
   WebP textures, meshopt-compressed; models/<name>.glb). Loaded through MODELS (GLTFLoader + MeshoptDecoder, the same cached loader).

   Bryce: keep prop counts low so the game stays smooth (about 7-8 in a Hollow area, about half that elsewhere). So each level lists a
   handful, once, with FURN.place([...]) and they are drawn instanced: one draw call per material per prop per zone (a 140 m cell),
   each zone culled on its own.

   Packs (several props in one file, joined per material: chairs-set, medbay-pack, floor-section, floor-section-b) are split here,
   at load: PIECES holds each prop's box in the pack (found offline: triangle islands welded by position, islands whose footprints
   overlap merged into one prop), and a piece keeps only the triangles whose middle is in its box, moved to stand on its own origin.
   The pack downloads once however many of its pieces a level uses.

   Entry: {f: file, p: piece (packs), x, z, y (default the ground there), ry (turn; models face +z as authored unless FACE says),
           s (scale), solid (true: a box the player, shots and sight can't pass; 'r': a round post), zone}
   FURN.obj(f, p) resolves to a single Group of one prop (for cutscene sets, and things that are picked up and hidden).
   FURN.auto(area, foot, n, opts) finds spots against the level's walls (testing only, the way STORE.auto is: run it in the console,
   paste the spots into the level's list). */
const FURN=(()=>{
  // pieces of the packs: [centre x, centre z, width x, depth z] in the pack's own layout (metres)
  const PIECES={
    'chairs-set':{'table-long':[-8.01,-5.94,3.04,1.19],'table-round':[1,-5.92,1.52,1.52],'table-disc':[5.41,-5.88,1.61,1.62],'bench':[7.75,-3.55,2.99,.75],
      'captain':[-3.68,-1.11,.74,1],'swivel':[1.69,-1.11,.62,.58],'stool-a':[2.5,.81,.42,.42],'stool-b':[3.56,.82,.4,.39],'table-oct':[9.33,1.38,1.16,1.16],
      'command':[-7.96,3.69,.61,.7],'crew':[-2.15,3.67,.71,.79],'bridge':[-3.84,6.19,.71,.72],'sofa':[-3.77,-3.55,1.63,1.2]},
    'medbay-pack':{'kit':[5.84,-1.37,.72,.32],'drip':[-4.27,-.74,.83,.93],'tanks':[-2.51,-.33,1.53,.79],'gurney':[-.18,.19,1.74,2.7],'cart':[1.2,-.91,.52,.8],
      'surgery':[3.33,.19,2.92,2.7],'chair':[5.89,-.22,.73,.84],'cabinet':[-6.74,.05,2.38,.46]},
    'floor-section':{'a':[10.98,0,12.04,21.93],'b':[-10.98,0,12.04,10.96]},
    'floor-modular':{'hatch':[2.95,-.65,1,1],'vent':[0.05,.35,.8,.8],'grille':[-.85,.35,.8,.8],'plate':[0.95,1.25,.8,.8]},
    'floor-section-b':{'a':[-3.74,-4.16,3.27,4.16],'b':[3.74,0,3.27,12.48]}};
  // footprint and height (metres, before any turn): what a solid prop blocks
  const SIZE={'wall-a':[4,.18,2.6],'stasis-capsule':[.68,1.57,1.83],'server-rack':[1.27,.82,2],'server-tower':[.6,.6,2.09],'locker':[.76,1.33,1.73],
    'gas-bottle':[.39,.41,1.44],'fuel-cell':[.66,.64,.75],'computer-console':[1.48,1.21,1.16],'wall-4':[.39,1.43,2],'wall-b':[4.49,2.41,3.83],'wall-2':[11.27,1.02,5.63],
    'keypad-panel':[2,.18,2],'wall-screen':[2.99,.13,2.01],'glyph-panel':[4.17,.64,3.47],'greek-pillar':[.75,.75,3.45],'stone-pillar':[1.39,1.39,3.66],'statue':[3.02,4.49,7.79],
    'stone-arch-ruins':[17.55,4.1,4.95],'treasure-chest':[4.77,4.69,2.38],'nav-table':[2.71,2.37,.91],'hologram-table':[2.62,3.34,1.15],'table-chairs':[1.52,1.75,.49],
    'dj-stage':[3.27,1.87,1.4],'hardware-display':[6.05,7.82,3.21],'catwalk-bridge':[6.46,3,.77],'corridor':[2.6,8.15,2.08],'starship-bridge':[9.72,9.67,4],'chairs-x4':[2.72,.61,.88],
    'medbay-pack#surgery':[2.92,2.7,3.2],'medbay-pack#gurney':[1.74,2.7,1.2],'medbay-pack#cabinet':[2.38,.46,2.61],'medbay-pack#cart':[.52,.8,.86],'medbay-pack#tanks':[1.53,.79,1.35],
    'chairs-set#table-round':[1.52,1.52,.63],'chairs-set#table-oct':[1.16,1.16,.8],'chairs-set#table-long':[3.04,1.19,.48],'chairs-set#bench':[2.99,.75,.75]};
  // turn added so the prop's face (screen, door, carving) is toward +z
  const FACE={'stasis-capsule':Math.PI};
  const ALL=[],ZONES={};let built=false;
  const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_p=new THREE.Vector3(),_Y=new THREE.Vector3(0,1,0);
  const keyOf=e=>e.f+(e.p?'#'+e.p:'');
  // the file's meshes merged per material (MODELS.prop), or a pack's piece cut out of them
  const parts={};
  /* the Host's colour (Bryce, Nov 10: "maybe recolor"): in a Hollow level (API.hue, a hex) the props that came lit in someone else's
     colours take the Host's: whatever glows (screens, strips, lamps) and anything coloured green or cyan (the capsules' fluid)
     turns to that colour, keeping its brightness. Only the files in HUE_FILES; marble, stone and the Keepers' kit keep theirs. */
  const HUE_FILES=new Set(['stasis-capsule','wall-a','server-rack','server-tower','wall-screen','computer-console','wall-4','fuel-cell','medbay-pack']);
  function hue(f,P){if(!API.hue||P.hued||!HUE_FILES.has(f))return;P.hued=1;const H=new THREE.Color(API.hue),hsl={};H.getHSL(hsl);
    const turn=c=>{const q={};c.getHSL(q);if(q.s<.18)return;c.setHSL(hsl.h,Math.max(q.s,.55),q.l);};
    for(const q of P.parts){const m=q.m;if(m.emissive&&(m.emissiveMap||m.emissive.getHex()!==0)&&m.emissiveMap!==m.map){turn(m.emissive);if(m.emissiveMap&&m.emissive.getHex()===0xffffff)m.emissive.copy(H);}
      if(m.color){const c=m.color;if(c.g>c.r*1.25||(c.b>c.r*1.3&&c.g>c.r*1.1))turn(c);}m.needsUpdate=true;}}
  /* a dark level's props read as black shapes under its few lights: API.lift (0..1, set by the level before it places anything) lets
     each surface give off that much of its own texture, as if lit by the room. Screens and lamps already glow and are left alone. */
  function lift(P){const k=API.lift||0;if(!k||P.lifted)return;P.lifted=1;for(const q of P.parts){const m=q.m;if(!m.emissive||!m.map)continue;
    if(m.emissiveMap||m.emissive.getHex()!==0)continue;m.emissive.setRGB(k,k,k);m.emissiveMap=m.map;m.needsUpdate=true;}}
  function partsOf(f,p){const k=f+(p?'#'+p:'');if(parts[k])return parts[k];
    return parts[k]=MODELS.prop(f).then(P=>{
      // MODELS.prop keeps positions, normals and UVs only: a material that asked for the file's vertex colours would draw black
      for(const q of P.parts)if(q.m.vertexColors){q.m.vertexColors=false;q.m.needsUpdate=true;}
      // and their normal maps on the unpacked geometry turn the lighting to NaN (black: the bridge, the tables, the capsules came out
      // as silhouettes in the test shots), so the surfaces are lit from their own normals
      for(const q of P.parts)if(q.m.normalMap){q.m.normalMap=null;q.m.needsUpdate=true;}
      lift(P);hue(f,P);if(!p)return P.parts.map(q=>({g:q.g,m:q.m}));
      const b=PIECES[f]&&PIECES[f][p];if(!b)throw new Error('no piece '+k);const [cx,cz,w,d]=b,x0=cx-w/2-.01,x1=cx+w/2+.01,z0=cz-d/2-.01,z1=cz+d/2+.01;
      const out=[];let y0=1e9;
      for(const q of P.parts){const g=q.g,pos=g.attributes.position.array,I=g.index.array,keep=[];
        for(let t=0;t<I.length;t+=3){let mx=0,mz=0;for(let k=0;k<3;k++){mx+=pos[I[t+k]*3];mz+=pos[I[t+k]*3+2];}mx/=3;mz/=3;
          if(mx>x0&&mx<x1&&mz>z0&&mz<z1)keep.push(I[t],I[t+1],I[t+2]);}
        if(!keep.length)continue;
        // compact: only the vertices the piece uses
        const map=new Map(),idx=new Uint32Array(keep.length);let n=0;for(let i=0;i<keep.length;i++){let v=map.get(keep[i]);if(v==null){v=n++;map.set(keep[i],v);}idx[i]=v;}
        const ng=new THREE.BufferGeometry();
        for(const a of['position','normal','uv']){const A=g.attributes[a];if(!A)continue;const s=A.itemSize,arr=new Float32Array(n*s);for(const [o,v] of map)for(let j=0;j<s;j++)arr[v*s+j]=A.array[o*s+j];ng.setAttribute(a,new THREE.BufferAttribute(arr,s));}
        ng.setIndex(new THREE.BufferAttribute(idx,1));const pa=ng.attributes.position.array;for(let i=1;i<pa.length;i+=3)y0=Math.min(y0,pa[i]);out.push({g:ng,m:q.m});}
      for(const o of out){o.g.translate(-cx,-y0,-cz);o.g.computeBoundingSphere();}
      return out;});}
  function obj(f,p){return partsOf(f,p).then(L=>{const G=new THREE.Group();for(const q of L){const m=new THREE.Mesh(q.g,q.m);m.castShadow=m.receiveShadow=true;G.add(m);}return G;});}
  function gy(x,z){return API.floor?API.floor(x,z):typeof groundY==='function'?groundY(x,z):0;}
  // collision: a solid prop is a box in RECTS (walking, sight, shots, the camera) and a circle of cover in OBST for the AI
  function solidify(e){const ry=e.ry||0;
    // TakeOver's maps keep their walls in S3 (walking, shots, sight and the bots' map all read it): a prop there is an S3 wall
    if(typeof s3Wall==='function'){const ux=Math.cos(ry),uz=-Math.sin(ry);
      if(e.solid==='r'){const r=e.r||.5;s3Wall(e.x-r*.7,e.z,e.x+r*.7,e.z,e.y,e.y+(e.h||2),r*1.4,true,true);return;}
      s3Wall(e.x-ux*e.hw,e.z-uz*e.hw,e.x+ux*e.hw,e.z+uz*e.hw,e.y,e.y+(e.h||2),e.hd*2,true,true);return;}
    if(e.solid==='r'){if(typeof OBST!=='undefined')OBST.push({x:e.x,z:e.z,r:e.r||.5,h:e.h||2});return;}
    window.RECTS=window.RECTS||[];RECTS.push({x:e.x,z:e.z,hw:e.hw,hd:e.hd,ry,y0:e.y-.3,h:(e.h||2)+.3,furn:1});
    if(typeof OBST!=='undefined'&&e.h>1)OBST.push({x:e.x,z:e.z,r:Math.min(e.hw,e.hd)+.2,h:e.h,ghost:true});}
  function add(e){e=Object.assign({},e);const sz=SIZE[keyOf(e)]||SIZE[e.f];if(sz&&e.solid&&e.hw==null){const k=e.s||1;e.hw=sz[0]/2*k*(e.sx||1);e.hd=sz[1]/2*k*(e.sz||1);e.h=e.h||sz[2]*k*(e.sy||1);if(e.solid==='r'&&!e.r)e.r=Math.max(sz[0],sz[1])/2*k;}if(e.y==null)e.y=gy(e.x,e.z);e.ry=(e.ry||0)+(FACE[e.f]||0);
    e.zone=e.zone||(Math.round(e.x/140)+','+Math.round(e.z/140));ALL.push(e);(ZONES[e.zone]||(ZONES[e.zone]={}));
    (ZONES[e.zone][keyOf(e)]||(ZONES[e.zone][keyOf(e)]=[])).push(e);
    if(e.solid&&e.hw)solidify(e);else if(e.solid==='r')solidify(e);
    if(built)drawZone(e.zone);return e;}
  const drawn=new Set();
  function drawZone(z){const Z=ZONES[z];
    for(const k in Z){const dk=z+'|'+k;if(drawn.has(dk))continue;drawn.add(dk);const L=Z[k];const [f,p]=k.split('#');
      partsOf(f,p).then(Ps=>{const cen=new THREE.Vector3();L.forEach(e=>cen.add(_p.set(e.x,e.y,e.z)));cen.divideScalar(L.length);let r=0;
        for(const q of Ps){if(!q.g.boundingSphere)q.g.computeBoundingSphere();r=Math.max(r,q.g.boundingSphere.radius+q.g.boundingSphere.center.length());}
        let R=0;L.forEach(e=>{R=Math.max(R,cen.distanceTo(_p.set(e.x,e.y,e.z))+r*(e.s||1));});const sph=new THREE.Sphere(cen,R);
        for(const q of Ps){const v=new THREE.BufferGeometry();for(const a in q.g.attributes)v.setAttribute(a,q.g.attributes[a]);v.setIndex(q.g.index);v.boundingSphere=sph;
          const im=new THREE.InstancedMesh(v,q.m,L.length);L.forEach((e,i)=>{const s=e.s||1;_m.compose(_p.set(e.x,e.y,e.z),_q.setFromAxisAngle(_Y,e.ry),_s.set(s*(e.sx||1),s*(e.sy||1),s*(e.sz||1)));im.setMatrixAt(i,_m);});
          im.instanceMatrix.needsUpdate=true;im.castShadow=!L[0].noShadow;im.receiveShadow=true;im.userData.furn=k;(L[0].parent||scene).add(im);}}).catch(err=>console.warn('FURN',k,err&&err.message));}}
  function build(){if(built)return;built=true;for(const z in ZONES)drawZone(z);}
  function place(list){for(const e of list)add(e);if(document.readyState==='complete')build();}
  addEventListener('load',()=>setTimeout(build,0));
  /* spots against the level's walls (testing only): foot {w, d} the prop's footprint (its back on -z after its turn); the back must be
     against the level's wall (playD > 0 or a RECT just behind it), the footprint and a metre in front open, and opts.clear(x,z) (the
     route's middle, metres) at least opts.keep. Returns up to n spots [x, z, ry], best first, each kept apart from the others. */
  function auto(area,foot,n,o){o=o||{};const out=[],W=foot.w,D=foot.d,inR=(x,z)=>(window.RECTS||[]).some(R=>{if(R.air)return false;const c=Math.cos(R.ry||0),s=Math.sin(R.ry||0),dx=x-R.x,dz=z-R.z;return Math.abs(dx*c-dz*s)<R.hw&&Math.abs(dx*s+dz*c)<R.hd;});
    const solid=(x,z)=>playD(x,z)>0||inR(x,z),open=(x,z)=>playD(x,z)<-.1&&!inR(x,z)&&!(typeof OBST!=='undefined'&&OBST.some(q=>!q.ghost&&Math.hypot(q.x-x,q.z-z)<q.r+.2));
    const loc=(x,z,ry,lx,lz)=>[x+lx*Math.cos(ry)+lz*Math.sin(ry),z-lx*Math.sin(ry)+lz*Math.cos(ry)];
    const cand=[];
    for(let gx=-area.r;gx<=area.r;gx+=.5)for(let gz=-area.r;gz<=area.r;gz+=.5){if(gx*gx+gz*gz>area.r*area.r)continue;const x=area.x+gx,z=area.z+gz;if(!open(x,z))continue;
      for(let a=0;a<48;a++){const ry=a*Math.PI/24;let back=0;for(const u of[-.4,0,.4]){const b=loc(x,z,ry,u*W,-D/2-.35);if(solid(b[0],b[1]))back++;}if(back<3)continue;
        let ok=true;for(const u of[-.45,0,.45])for(const v of[-.4,0,.4,.5+1/D]){const q=loc(x,z,ry,u*W,v*D);if(!open(q[0],q[1])){ok=false;break;}}if(!ok)continue;
        if(o.clear&&o.clear(x,z)<(o.keep||3))continue;const y=gy(x,z);if([[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]].some(([u,v])=>{const q=loc(x,z,ry,u*W,v*D);return Math.abs(gy(q[0],q[1])-y)>.25;}))continue;
        // pull it back until it touches
        let px=x,pz=z;for(let k=0;k<6;k++){const t=loc(px,pz,ry,0,-.05);const e=[-.45,0,.45].map(u=>loc(t[0],t[1],ry,u*W,-D/2-.03));if(e.some(q=>!open(q[0],q[1])))break;px=t[0];pz=t[1];}
        cand.push({x:+px.toFixed(2),z:+pz.toFixed(2),ry:+ry.toFixed(4),sc:o.clear?-Math.abs(o.clear(px,pz)-(o.want||o.keep||3)):0});}}
    cand.sort((a,b)=>b.sc-a.sc);const gap=o.gap||Math.max(W,D)*1.5;
    for(const c of cand){if(out.length>=n)break;if(out.some(q=>Math.hypot(q[0]-c.x,q[1]-c.z)<gap)||ALL.some(e=>Math.hypot(e.x-c.x,e.z-c.z)<gap*.8))continue;out.push([c.x,c.z,c.ry]);}
    return out;}

  /* ---------- the interceptor's cockpit, from the inside (Bryce, Nov 10: first-person, interior only; the file is a well-known
     film fighter's nose and cockpit, so its outside is never shown). The hull is cut down to the tub round the seat (nothing ahead
     of the dash or behind the seat back is kept), the glass made clear. Resolves to a Group with the pilot's eye at its origin,
     looking down -z (a camera's forward). ---------- */
  let cockP=null;
  function cockpit(){return cockP||(cockP=partsOf('fighter-cockpit').then(Ps=>{const G=new THREE.Group(),inner=new THREE.Group();G.add(inner);inner.rotation.y=Math.PI;
    for(const q of Ps){let g=q.g;const nm=(q.m.name||'').toLowerCase();
      if(/hull/.test(nm)){const pos=g.attributes.position.array,I=g.index.array,keep=[];for(let t=0;t<I.length;t+=3){let ok=true;for(let k=0;k<3;k++){const z=pos[I[t+k]*3+2];if(z<-2.6||z>.7)ok=false;}if(ok)keep.push(I[t],I[t+1],I[t+2]);}
        if(!keep.length)continue;g=g.clone();g.setIndex(keep);}
      let m=q.m;if(/glass|canopy_front|canopy_back/.test(nm)&&/glass/.test(nm)){m=m.clone();m.transparent=true;m.opacity=.1;m.depthWrite=false;m.map=null;m.color.setRGB(.6,.75,.9);}
      const mesh=new THREE.Mesh(g,m);mesh.position.set(0,-1.95,1.6);mesh.frustumCulled=false;mesh.renderOrder=/glass/.test(nm)?2:1;inner.add(mesh);}
    return G;}));}
  /* the first-person cockpit view for a level's interceptor: V toggles it (and a VIEW button on phones). Each frame, after the level
     has placed its chase camera, call view.update(camera, ship, active): in cockpit the camera sits at the pilot's seat (eye, in the
     ship's own frame) turned with the ship, the ship's own model is hidden, and the cockpit is drawn round the camera. */
  function cockpitView(o){o=o||{};const V={on:false,eye:o.eye||new THREE.Vector3(0,.9,-2),G:null,ship:null,act:false};
    cockpit().then(G=>{V.G=G;G.visible=false;(o.scene||scene).add(G);}).catch(()=>{});
    const flip=()=>{if(!V.act)return;V.on=!V.on;if(!V.on&&V.ship)V.ship.visible=true;if(btn)btn.textContent=V.on?'CHASE':'COCKPIT';};
    addEventListener('keydown',e=>{if((e.key==='v'||e.key==='V')&&!e.repeat&&!(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName)))flip();});
    let btn=null;if(matchMedia('(pointer: coarse)').matches){btn=document.createElement('button');btn.textContent='COCKPIT';
      btn.style.cssText='position:fixed;right:14px;top:50%;z-index:6;padding:7px 10px;font:600 11px sans-serif;letter-spacing:.1em;color:#dfe8ff;background:rgba(10,20,40,.55);border:1px solid rgba(160,200,255,.5);border-radius:6px;display:none';
      btn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();flip();});document.body.appendChild(btn);}
    const _e=new THREE.Vector3();
    // (when a level stops calling update, its flight is over: put the ship back and hide the cockpit)
    const watch=()=>{requestAnimationFrame(watch);if(V.last&&performance.now()-V.last>400){V.last=0;V.act=false;if(V.G)V.G.visible=false;if(V.ship)V.ship.visible=true;if(btn)btn.style.display='none';}};requestAnimationFrame(watch);
    V.update=(cam,ship,active)=>{V.last=performance.now();V.act=!!active;if(btn)btn.style.display=active?'block':'none';
      if(V.ship&&V.ship!==ship)V.ship.visible=true;V.ship=ship;
      const on=V.on&&active&&ship;if(V.G)V.G.visible=!!on;if(!on){if(ship&&V.wasOn)ship.visible=true;V.wasOn=false;return false;}
      V.wasOn=true;ship.updateMatrixWorld(true);ship.getWorldQuaternion(cam.quaternion);ship.getWorldPosition(_e);cam.position.copy(V.eye).multiplyScalar(o.k||1).applyQuaternion(cam.quaternion).add(_e);if(o.turn)cam.quaternion.multiply(o.turn);
      cam.updateMatrixWorld(true);ship.visible=false;if(V.G){V.G.position.copy(cam.position);V.G.quaternion.copy(cam.quaternion);V.G.scale.setScalar(o.k||1);}return true;};
    return V;}
  /* ---------- the Vigil's bridge (starship-bridge) with the hologram table in the middle (Bryce, Nov 10): Elias in the ending where
     the device rises, and Rhen's briefing before Site K. Built once, hidden; a cutscene shows it. It carries no lights of its own: its
     surfaces are self-lit off their own textures (so nothing in the level recompiles when it appears), its screens and the table glow.
     The viewport is toward -z; the table stands in front of the captain's platform (TABLE); STAND are spots round it, [x, z, facing]. ---------- */
  function bridgeSet(o){o=o||{};const G=new THREE.Group();G.visible=false;(o.parent||scene).add(G);
    // (the bridge's file glows only through a screens map: it reads black under a level's night light, so its colour map glows instead,
    // and its material, saved as see-through at full opacity, is drawn solid)
    const lit=(Gr,k)=>Gr.traverse(m=>{if(!m.isMesh)return;m.material=m.material.clone();const M=m.material;if(M.opacity>=.99){M.transparent=false;M.depthWrite=true;}
      if(M.map&&M.emissive&&(M.emissive.getHex()===0||!M.emissiveMap||M.emissiveMap!==M.map&&k>.4)){M.emissive.setRGB(k,k,k);M.emissiveMap=M.map;M.emissiveIntensity=1;}M.needsUpdate=true;});
    const P=Promise.all([obj('starship-bridge').then(b=>{lit(b,o.lit!=null?o.lit:.55);closeBridge(b);G.add(b);}),
      obj('hologram-table').then(t=>{
        /* (Nov 11) the table's two map sheets are glass in the file (see-through, the map glowing in them); drawn solid, they came out
           as paper-white boards. Kept see-through */
        t.traverse(m=>{if(!m.isMesh)return;m.material=m.material.clone();const M=m.material;M.transparent=true;M.depthWrite=true;M.emissiveIntensity=.8;M.needsUpdate=true;});
        t.scale.setScalar(.85);t.position.set(BRIDGE.table[0],BRIDGE.table[1],BRIDGE.table[2]);t.rotation.y=Math.PI/2;G.add(t);})]);
    /* (Nov 11, Bryce) what the table projects: the hardware-display file that hung here was somebody's web dashboard, its middle a blank
       white sheet. Now the table draws the job itself: the ground, the target's spires, a gold pin on the spot, and a panel of lines
       over it (o.holo: [title, target, the gold line, two lines under], or the Vigil's own). Turns by itself, so a set that's shown
       needs nothing ticked. */
    const holo=bridgeHolo(o.holo||['THE VIGIL · BRIDGE','TGT: TIDE CITY · THE SPEAR','DEVICE IN TRANSIT','CLEAR THE PLINTH · HOLD THE SKY','ORDER: ELIAS VEYR'],o.terrain);
    holo.G.position.set(BRIDGE.table[0],BRIDGE.table[1],BRIDGE.table[2]);G.add(holo.G);
    return{G,ready:P,holo,TABLE:new THREE.Vector3(...BRIDGE.table),STAND:BRIDGE.stand};}
  /* the file is a cutaway: walls and ceiling round its back half only, so the front of the room stood open to the sky. Its back half,
     turned about, closes it: kept are the walls (everything out at the edge, off the floor) and the ceiling (everything up high), not
     the floor or what stands in the middle of the room (the captain's platform). The front-half consoles that would stand inside the
     new walls are taken out of the original. */
  const BR_CUT=-.55,BR_EDGE=3.35,BR_HIGH=2.85;
  function closeBridge(b){const add=[];
    const R=(x,z)=>Math.max(Math.abs(x),Math.abs(z),(Math.abs(x)+Math.abs(z))*.7071);
    b.traverse(m=>{if(!m.isMesh||m.userData.closed)return;const g=m.geometry,pos=g.attributes.position.array,I=g.index?g.index.array:null,nT=I?I.length/3:pos.length/9;
      const vi=(t,k)=>I?I[t*3+k]:t*3+k,keep=[],orig=[];
      for(let t=0;t<nT;t++){let zc=0,front=true,edge=true,high=true,floor=true;
        for(let k=0;k<3;k++){const j=vi(t,k),x=pos[j*3],y=pos[j*3+1],z=pos[j*3+2];zc+=z/3;if(z<-BR_CUT)front=false;if(R(x,z)<BR_EDGE)edge=false;if(y<BR_HIGH)high=false;if(y>.12)floor=false;}
        const a=vi(t,0),c=vi(t,1),d=vi(t,2);
        if(zc<BR_CUT&&!floor&&(edge||high))keep.push(a,c,d);   // (by its middle: a big wall panel across the cut stays whole)
        if(!(front&&!floor&&edge))orig.push(a,c,d);}
      if(orig.length<nT*3){const g1=g.clone();g1.setIndex(orig);m.geometry=g1;}   // (a copy: the loaded file is shared)
      if(keep.length){const g2=g.clone();g2.setIndex(keep);const c=new THREE.Mesh(g2,m.material);c.userData.closed=1;c.castShadow=c.receiveShadow=true;add.push(c);}});
    const half=new THREE.Group();half.rotation.y=Math.PI;for(const c of add)half.add(c);b.add(half);
    // the file's ceiling has an open well over the middle of the room (the sky showed through it): a dark plated cap over it
    const cap=new THREE.Mesh(new THREE.CircleGeometry(3.6,8),new THREE.MeshStandardMaterial({color:0x14171d,roughness:.7,metalness:.6,emissive:0x05070a,side:THREE.DoubleSide}));
    cap.rotation.set(Math.PI/2,0,Math.PI/8);cap.position.y=3.97;b.add(cap);}
  function bridgeHolo(lines,terrain){const G=new THREE.Group();const HM=typeof CINE!=='undefined'&&CINE.holoMat;
    const mat=(col,k)=>HM?CINE.holoMat(col,k):new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(k*.35),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
    const hm=mat(0x7fe3ff,.9),dm=mat(0x7fe3ff,.3),gm=mat(0xffd27a,2.2),rm=mat(0xb070ff,1.2);
    // the beam up off the table's eye, and the map floating in it
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.55,.12,.5,32,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(0x7fe3ff).multiplyScalar(.035),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false}));
    beam.position.y=1.12;beam.scale.set(.25,1,.25);G.add(beam);
    const mg=new THREE.Group();mg.position.y=1.42;G.add(mg);let seed=7;const rnd=(a,b)=>{seed=(seed*16807)%2147483647;return a+(seed/2147483647)*(b-a);};
    {const ground=new THREE.Mesh(new THREE.CircleGeometry(.56,40),dm);ground.rotation.x=-Math.PI/2;mg.add(ground);
     const ring=new THREE.Mesh(new THREE.RingGeometry(.56,.6,48),hm);ring.rotation.x=-Math.PI/2;mg.add(ring);
     // the installation: low blocks in a yard, a road out, the spires round it (in the Host's violet)
     for(let i=0;i<20;i++){const w=rnd(.04,.11),h=rnd(.02,.12),d=rnd(.04,.11),bx=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),hm);const a=rnd(0,6.28),r=Math.sqrt(rnd(0,1))*.3;bx.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);mg.add(bx);}
     const road=new THREE.Mesh(new THREE.PlaneGeometry(.02,.34),hm);road.rotation.x=-Math.PI/2;road.position.set(.38,.004,.1);road.rotation.z=.5;mg.add(road);
     for(let i=0;i<(terrain==='city'?3:6);i++){const h=rnd(.2,.42),c=new THREE.Mesh(new THREE.ConeGeometry(.014,h,5),terrain==='city'?hm:rm);const a=i/6*6.28+.3,r=rnd(.2,.34);c.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);mg.add(c);}}
    const pin=new THREE.Mesh(new THREE.OctahedronGeometry(.045,0),gm);pin.position.set(.08,.34,-.06);mg.add(pin);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.3,4),gm);stem.position.set(.08,.17,-.06);mg.add(stem);
    // the panel over it, readable from both sides of the table
    const cv=document.createElement('canvas');cv.width=512;cv.height=256;const x=cv.getContext('2d'),tx=new THREE.CanvasTexture(cv);
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.5),new THREE.MeshBasicMaterial({map:tx,transparent:true,opacity:.9,toneMapped:false,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
    panel.scale.setScalar(.85);panel.position.set(0,1.98,0);G.add(panel);
    const draw=t=>{x.clearRect(0,0,512,256);x.strokeStyle='rgba(127,227,255,.85)';x.lineWidth=3;x.strokeRect(6,6,500,244);
      x.fillStyle='rgba(127,227,255,.85)';x.font='bold 24px monospace';x.fillText(lines[0],24,44);x.font='22px monospace';x.fillText(lines[1],24,80);
      const p=.6+.4*Math.sin(t*5);x.fillStyle=`rgba(255,210,122,${p})`;x.fillRect(24,100,464,52);x.fillStyle='#1a1206';x.font='bold 28px monospace';x.fillText(lines[2],40,136);
      x.fillStyle='rgba(127,227,255,.7)';x.font='19px monospace';x.fillText(lines[3],24,190);x.fillText(lines[4],24,222);tx.needsUpdate=true;};
    let last=-1;const tick=()=>{const t=performance.now()/1000;mg.rotation.y=t*.3;pin.rotation.y=t*2;pin.position.y=.34+.03*Math.sin(t*3);
      for(const m of[hm,dm,gm,rm])if(m.uniforms)m.uniforms.t.value=t;
      // the panel turns to whoever's looking (the camera), upright
      const cam=typeof camera!=='undefined'?camera:null;if(cam){G.updateMatrixWorld();const p=panel.getWorldPosition(new THREE.Vector3()),c=cam.position;panel.rotation.y=Math.atan2(c.x-p.x,c.z-p.z)-(G.parent?G.parent.rotation.y:0);}
      if(t-last>.1){last=t;draw(t);}};
    beam.onBeforeRender=tick;draw(0);
    return{G,set(L){lines=L;draw(performance.now()/1000);}};}
  // (people face -z at a turn of 0: the head of the table faces the room (+z), the others face in from the sides and the foot)
  const BRIDGE={table:[0,.2,1.7],stand:[[0,.15,Math.PI],[-1.6,1.9,-Math.PI/2],[1.6,1.9,Math.PI/2],[0,3.25,0]]};
  const API={floor:null,lift:0,hue:0,cockpit,cockpitView,bridgeSet,BRIDGE,place,add,obj,parts:partsOf,auto,PIECES,FACE,SIZE,get all(){return ALL;},build};return API;})();
