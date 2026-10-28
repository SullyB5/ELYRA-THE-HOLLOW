/* Elyra shared · STORE: the Hollow's store rooms (Oct 27, Bryce's model: "Low poly - Sci-Fi Storage room" by TRUTH_319 on Sketchfab,
   CC-BY 4.0; models/storage-room.glb, PC set in models/pc/). Bryce: they go in the Hollow's bases and prisons, not the White City, and
   "make the corners line up to the corners of the place you put them".

   The model is the corner of a room, a 5.6 m cube: a floor, two walls (a door in one, screens and crates against the other) and a roof
   the code adds; the other two sides are open. In model space the walls are on -x and -z. STORE never puts one in the open: it looks for
   wall of the level and sits the room's back wall flush against it, its closed corner tucked into the tightest spot the place has
   (a real corner, both walls against the level's, wins wherever there is one; the Hollow's rooms are mostly round, so most rooms sit
   back-flush on a curve), its open sides facing into the place.

   Each level lists its rooms once (STORE.plan(fn), run after every script is in) as STORE.place([[x,z,ry,zone],...]): spots found
   beforehand with STORE.auto, which is too slow to run on a phone at load (4 s below the Hollow, a minute at Site K in the test browser).
   To find them again after a level's layout changes: in the browser console, STORE.auto({x,z,r},n,opts) on each place, then
   JSON.stringify(STORE.all.map(c=>[c.x,c.z,c.ry,c.zone])). STORE.auto({x,z,r},n,opts) searches the circle for up to n spots. opts.clear(x,z): metres from the route's middle (a room keeps 3.5 m of it clear, so the way through stays open);
   opts.angles: wall directions to try (radians; each also turned by quarter turns), else every 7.5 degrees; opts.zone groups rooms for
   drawing. A room is solid: its two walls are RECTS (walking, sight, shots, the camera) and three OBST points are cover for the AI.
   The rooms are drawn instanced, one set per zone (a few draw calls each, culled per zone); plain dark boxes stand in until the file is in.
   The file's cyan and green lights are the Host's purple. STORE.all lists them ({x,y,z,ry,inn,front}). */
const STORE=(()=>{const S=5.6,ALL=[],ZONES={},PLANS=[];
  const loc=(c,lx,lz)=>({x:c.x+lx*Math.cos(c.ry)+lz*Math.sin(c.ry),z:c.z-lx*Math.sin(c.ry)+lz*Math.cos(c.ry)});
  function inRect(x,z){if(!window.RECTS)return false;for(const R of RECTS){if(R.air||R.store)continue;const c=Math.cos(R.ry||0),s=Math.sin(R.ry||0),dx=x-R.x,dz=z-R.z;
    if(Math.abs(dx*c-dz*s)<R.hw&&Math.abs(dx*s+dz*c)<R.hd)return true;}return false;}
  const solidAt=(x,z)=>playD(x,z)>0||inRect(x,z)||(typeof OBST!=='undefined'&&OBST.some(o=>!o.ghost&&o.h>2&&Math.hypot(o.x-x,o.z-z)<o.r));
  const openAt=(x,z)=>playD(x,z)<-.05&&!inRect(x,z)&&!(typeof OBST!=='undefined'&&OBST.some(o=>!o.ghost&&Math.hypot(o.x-x,o.z-z)<o.r+.3));
  const F=[-.45,-.25,0,.25,.45];
  // how much of what is just behind each wall is the level's own wall: {b: the back wall, s: the side wall}, 0..1
  function hits(c,off){let nb=0,ns=0;for(const a of F){const b=loc(c,a*S,-S/2-off),w=loc(c,-S/2-off,a*S);if(solidAt(b.x,b.z))nb++;if(solidAt(w.x,w.z))ns++;}return{b:nb/F.length,s:ns/F.length};}
  function fits(c,o){for(const a of[-.42,-.15,.15,.42])for(const b of[-.42,-.15,.15,.42]){const p=loc(c,a*S,b*S);if(!openAt(p.x,p.z))return false;if(o.clear&&o.clear(p.x,p.z)<(o.keep||3))return false;}
    for(const a of[-.3,0,.3]){const f=loc(c,S/2+1.2,a*S),g=loc(c,a*S,S/2+1.2);if(!openAt(f.x,f.z)||!openAt(g.x,g.z))return false;}
    const y=groundY(c.x,c.z);for(const [a,b] of[[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]]){const p=loc(c,a*S,b*S);if(Math.abs(groundY(p.x,p.z)-y)>.45)return false;}
    return !ALL.some(q=>Math.hypot(q.x-c.x,q.z-c.z)<S*1.7);}
  // slide the box back until its back wall touches the level's wall, then sideways until its side wall does (or there is nothing there)
  function seat(c){for(const ax of[0,1,0,1]){if(ax&&hits(c,1.6).s<.2)continue;
      for(let k=0;k<16;k++){const t={x:c.x,z:c.z,ry:c.ry},d=loc({x:0,z:0,ry:c.ry},ax?-.1:0,ax?0:-.1);t.x+=d.x;t.z+=d.z;
        const e=ax?[-.45,0,.45].map(a=>loc(t,-S/2+.15,a*S)):[-.45,0,.45].map(a=>loc(t,a*S,-S/2+.15));if(e.some(p=>!openAt(p.x,p.z)))break;c.x=t.x;c.z=t.z;}}}
  /* every spot in the circle and every turn: the back wall must end up flush against the level (80% of it); then the spots where the side
     wall meets the level too (a real corner) win, best first. opts.minSide: how much of the side wall must touch (default 0: Bryce, Oct 27, chose back-flush in the round rooms, since the
     Hollow's bases have almost no square corners; a real corner still wins wherever there is one) */
  function auto(area,n,o){o=o||{};const angs=[],ok=[];
    for(const a of(o.angles||[...Array(12)].map((_,i)=>i*Math.PI/24)))for(let q=0;q<4;q++)angs.push(a+q*Math.PI/2);
    for(let x=-area.r;x<=area.r;x+=1.25)for(let z=-area.r;z<=area.r;z+=1.25){if(x*x+z*z>area.r*area.r)continue;const cx=area.x+x,cz=area.z+z;if(!openAt(cx,cz))continue;
      for(const ry of angs){const c={x:cx,z:cz,ry};if(hits(c,1.6).b<.6){continue;}if(!fits(c,o)){continue;}seat(c);if(!fits(c,o)){continue;}
        const h=hits(c,.3);if(h.b<.8||h.s<(o.minSide!=null?o.minSide:0)){continue;}c.score=h.s+h.b;ok.push(c);}}
    ok.sort((a,b)=>b.score-a.score);const found=[];
    for(const c of ok){if(found.length>=n)break;if(ALL.some(q=>Math.hypot(q.x-c.x,q.z-c.z)<S*1.7))continue;add(c,o.zone||((Math.round(c.x/160))+','+Math.round(c.z/160)));found.push(c);}
    return found;}
  function add(c,zone){if(c.y==null)c.y=groundY(c.x,c.z);c.zone=zone;c.inn=loc(c,S*.1,S*.08);c.front=loc(c,S*.62,S*.62);ALL.push(c);(ZONES[zone]||(ZONES[zone]=[])).push(c);
    window.RECTS=window.RECTS||[];const bw=loc(c,0,-S/2+.28),sw=loc(c,-S/2+.28,0);
    RECTS.push({x:bw.x,z:bw.z,hw:S/2,hd:.34,ry:c.ry,y0:c.y-.5,h:S+.5,store:1},{x:sw.x,z:sw.z,hw:.34,hd:S/2,ry:c.ry,y0:c.y-.5,h:S+.5,store:1});
    if(typeof OBST!=='undefined')for(const [a,b] of[[-.25,-.42],[.25,-.42],[-.42,.22]]){const p=loc(c,a*S,b*S);OBST.push({x:p.x,z:p.z,r:.6,h:S,ghost:true});}}
  // drawing
  const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(1,1,1),_p=new THREE.Vector3(),_Y=new THREE.Vector3(0,1,0);
  const modM=c=>new THREE.Matrix4().compose(_p.set(c.x,c.y,c.z),_q.setFromAxisAngle(_Y,c.ry),_s);
  const view=(g,sph)=>{const v=new THREE.BufferGeometry();for(const k in g.attributes)v.setAttribute(k,g.attributes[k]);if(g.index)v.setIndex(g.index);v.boundingSphere=sph;return v;};
  function inst(geo,mat,list,local,sph){const im=new THREE.InstancedMesh(view(geo,sph),mat,list.length);
    list.forEach((c,i)=>{_m.multiplyMatrices(modM(c),local);im.setMatrixAt(i,_m);});im.instanceMatrix.needsUpdate=true;im.castShadow=true;im.receiveShadow=true;scene.add(im);return im;}
  function build(){if(!ALL.length)return;const tex=typeof panelTex!=='undefined'?panelTex:null;
    const standM=new THREE.MeshStandardMaterial({color:new THREE.Color(0x1c1a22),map:tex,roughness:.55,metalness:.4}),roofM=new THREE.MeshStandardMaterial({color:new THREE.Color(0x24222c),map:tex,roughness:.5,metalness:.45});
    const stripM=new THREE.MeshBasicMaterial({color:new THREE.Color(FLEET_PURPLE).multiplyScalar(2.2),toneMapped:false}),stand=[],gl=typeof glow!=='undefined'?glow:null;
    for(const z in ZONES){const L=ZONES[z],cen=new THREE.Vector3();L.forEach(c=>cen.add(_p.set(c.x,c.y,c.z)));cen.divideScalar(L.length);
      let r=0;L.forEach(c=>{r=Math.max(r,cen.distanceTo(_p.set(c.x,c.y,c.z)));});const sph=new THREE.Sphere(cen,r+S*1.2);L.sph=sph;
      // the roof: a dark plate over the whole cube (flush with its walls), a purple strip along its two open edges, a lamp over the open corner
      inst(new THREE.BoxGeometry(S,.3,S),roofM,L,new THREE.Matrix4().makeTranslation(0,S+.15,0),sph);
      const st=new THREE.BoxGeometry(S,.08,.1);inst(st,stripM,L,new THREE.Matrix4().makeTranslation(0,S-.02,S/2-.05),sph).castShadow=false;
      inst(st,stripM,L,new THREE.Matrix4().compose(_p.set(S/2-.05,S-.02,0),_q.setFromAxisAngle(_Y,Math.PI/2),_s),sph).castShadow=false;
      if(gl){const pos=new Float32Array(L.length*3);L.forEach((c,i)=>{const f=loc(c,S*.42,S*.42);pos.set([f.x,c.y+S-.4,f.z],i*3);});
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.boundingSphere=sph;
        const pts=new THREE.Points(g,new THREE.PointsMaterial({map:gl,color:new THREE.Color(FLEET_PURPLE).multiplyScalar(2),size:2.6,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));pts.userData.dyn=1;scene.add(pts);}
      for(const [w,h,d,x,y,zz] of[[S,S,.5,0,S/2,-S/2+.25],[.5,S,S,-S/2+.25,S/2,0],[S,.2,S,0,.1,0]]){const im=inst(new THREE.BoxGeometry(w,h,d),standM,L,new THREE.Matrix4().makeTranslation(x,y,zz),sph);im.userData.dyn=1;stand.push(im);}}
    if(typeof MODELS==='undefined')return;
    MODELS.copy('storage-room').then(({scene:s})=>{MODELS.tame(s,.5);
      const {o}=MODELS.fit(s,{size:S,axis:'x',floor:true});o.updateMatrixWorld(true);const mats={};
      const host=m=>mats[m.uuid]||(mats[m.uuid]=(()=>{const c=m.clone(),e=c.emissive?c.emissive.getHex():0;
        if(c.emissiveMap){c.emissive=new THREE.Color(0xc8a8ff);c.emissiveIntensity=1.1;}
        else if(e){const g=c.emissive.g>c.emissive.b;c.emissive=new THREE.Color(g?0xd09aff:FLEET_PURPLE);c.emissiveIntensity=g?1.8:2.4;}
        else if(c.color){const l=Math.max(c.color.r,c.color.g,c.color.b);if(l<.2)c.color.multiplyScalar(1.9);}
        return c;})());
      const parts=[];s.traverse(m=>{if(m.isMesh)parts.push(m);});
      for(const z in ZONES)for(const m of parts)inst(m.geometry,host(m.material),ZONES[z],m.matrixWorld,ZONES[z].sph);
      for(const im of stand)im.visible=false;}).catch(()=>{});}
  let ran=false,ms=0;
  function run(){if(ran)return;ran=true;const t0=performance.now();for(const f of PLANS){try{f();}catch(e){console.error('STORE plan',e);}}try{build();}catch(e){console.error('STORE build',e);}ms=Math.round(performance.now()-t0);}
  if(document.readyState==='complete')setTimeout(run,0);else addEventListener('load',run);
  return{get ms(){return ms;},S,auto,place:L=>{for(const [x,z,ry,zone,y] of L)add({x,z,ry,y},zone);},plan:f=>{PLANS.push(f);if(ran){try{f();build();}catch(e){}}},run,get all(){return ALL;},zones:ZONES};})();
