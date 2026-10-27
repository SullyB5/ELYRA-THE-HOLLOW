/* Elyra shared · SOLID: what you can see stops a shot (Oct 26, Bryce: "cover must fully block enemy shots", "enemies shoot through
   walls, and I can shoot through some walls").
   Every map used to describe its walls for shots by hand: circles (OBST), boxes (RECTS) and the ground's height (groundY). Wherever the
   drawn thing was bigger than its stand-in, shots went through it: barricades are one long box but were a chain of circles with gaps,
   houses, rock models, pods, the facility's own pillars and parapets. A wall audit (every level, rays through the rendered meshes)
   found 20 to 40% of the chest-high sight lines that hit something you can see went straight through it.

   This is the fix at the root: the static meshes you can see are voxelised once into a sparse grid (0.5 m across, 0.25 m tall), and a
   shot or a sight line that crosses a filled voxel is stopped. People, vehicles, mechs, turrets, dropships, pickups and anything else
   marked userData.dyn are left out; so is glass, glow and anything see-through. Anything else that moves or hides after the grid is
   built is noticed (a slow round-robin check), dropped from the grid for good and the grid rebuilt.

   SOLID.hit(a,b,skipA,skipB)   true if the segment a→b crosses solid (skipA/skipB metres at either end are ignored: a muzzle beside a wall)
   SOLID.first(o,d,maxD,skip)   distance along the unit ray to the first solid voxel, or -1
   SOLID.build()                rebuild now (otherwise it builds itself on first use and keeps itself current)
   SOLID.stats                  {bricks, meshes, ms, builds}
   Needs THREE and the page's `scene`. Global `SOLID`. */
const SOLID=(()=>{
  const VX=.5,VY=.25,ivx=1/VX,ivy=1/VY;
  /* a brick is 4×4×4 voxels = 64 bits (two words). Bricks are found by their coordinates packed into one key (x and z ±2048
     bricks = ±4 km, y -384..127 bricks = -384..128 m; see BK) in an open-addressed hash table of typed arrays (a Map with number keys was most
     of the build's time) */
  function grid(){return{HK:new Float64Array(1<<16),HV:new Int32Array(1<<16),cap:1<<16,cnt:0,W:new Uint32Array(1<<14),nb:0};}
  let G=grid();
  /* Oct 27 (Bryce: a roof gun and the rifleman beside it that shots "did nothing" to): the key used to be packed into 32 bits with only
     8 for the height, but the height takes 9 (every brick above -128 m set the 9th), and that bit landed on the lowest bit of z: each
     brick shared its storage with its neighbour 2 m along z, so every wall stood a ghost copy up to 2 m north or south of itself.
     The ghost of a roof's upper tier stood over the gun and the rifleman in front of it and stopped every shot. Now the key has
     room for all of it (a whole number up to 2^33, kept in a Float64Array: exact) */
  const BK=(bx,by,bz)=>(bx<-2048||bx>2047||bz<-2048||bz>2047||by<-384||by>127)?0:((bx+2048)*4096+(bz+2048))*512+(by+384)+1;   // 0: empty / out of range
  const hsh=(k,m)=>(Math.imul((k>>>0)^Math.imul((k/4294967296)|0,0x85EBCA6B),0x9E3779B1)>>>0)&m;
  function grow(g){const oK=g.HK,oV=g.HV,cap=g.cap*2,m=cap-1;g.HK=new Float64Array(cap);g.HV=new Int32Array(cap);g.cap=cap;
    for(let i=0;i<oK.length;i++){const k=oK[i];if(!k)continue;let h=hsh(k,m);while(g.HK[h])h=(h+1)&m;g.HK[h]=k;g.HV[h]=oV[i];}}
  function slot(g,k,make){const m=g.cap-1;let h=hsh(k,m);while(true){const kk=g.HK[h];if(kk===k)return g.HV[h];if(!kk)break;h=(h+1)&m;}
    if(!make)return -1;if(g.cnt*2>=g.cap){grow(g);return slot(g,k,true);}
    const i=g.nb++;if(i*2+2>g.W.length){const n=new Uint32Array(g.W.length*2);n.set(g.W);g.W=n;}g.HK[h]=k;g.HV[h]=i;g.cnt++;return i;}
  let B=G;   // the grid being written (a build's own, until it is done)
  function setV(vx,vy,vz){stats.sets++;if(window.SOLID_DEBUG){const H=stats.hist||(stats.hist={});const k=Math.floor(vy*VY/5)*5;H[k]=(H[k]||0)+1;}const k=BK(vx>>2,vy>>2,vz>>2);if(!k)return;const i=slot(B,k,true);const b=((vy&3)<<4)|((vz&3)<<2)|(vx&3);B.W[i*2+(b>>5)]|=1<<(b&31);}
  let lastK=-1,lastI=-1;
  function getV(vx,vy,vz){const k=BK(vx>>2,vy>>2,vz>>2);if(!k)return false;let i;if(k===lastK)i=lastI;else{i=slot(G,k,false);lastK=k;lastI=i;}
    if(i<0)return false;const b=((vy&3)<<4)|((vz&3)<<2)|(vx&3);return(G.W[i*2+(b>>5)]&(1<<(b&31)))!==0;}
  // a top face sits a little low in its voxel, so a rifle held a hand's width over a wall's top still clears it (VY_BIAS)
  const VY_BIAS=.12,YMIN=-380;
  const YMAX=()=>window.SOLID_YMAX!=null?window.SOLID_YMAX:75;

  /* which meshes count */
  const movers=new Set();   // ids of meshes seen moving or hiding after a build: never solid again
  function solidMat(m){if(!m)return false;if(Array.isArray(m))return m.some(solidMat);
    if(m.blending===THREE.AdditiveBlending||m.depthWrite===false||m.side===THREE.BackSide||m.alphaTest>0)return false;
    if(m.transparent&&m.opacity<.7)return false;if(m.visible===false||m.colorWrite===false)return false;return true;}
  function collect(){const out=[],cam=typeof camera!=='undefined'?camera:null;
    (function walk(o){if(!o.visible||o===cam||(o.userData&&o.userData.dyn)||o.renderOrder<0)return;   // (renderOrder < 0: sky and backdrop)
      if(o.isMesh&&!o.isSkinnedMesh&&!movers.has(o.id)&&solidMat(o.material)){const g=o.geometry,P=g&&g.attributes&&g.attributes.position;
        if(P){const n=(g.index?g.index.count:P.count)/3*(o.isInstancedMesh?o.count:1);if(n>0&&n<300000)out.push(o);}}   // (past that it is a terrain mesh: groundY already is the terrain)
      for(const c of o.children)walk(c);})(scene);
    return out;}
  /* how far a point is from anywhere a person can stand, with every door and gate open (so what is behind a closed gate is built too).
     The maps' playD is a distance field (1 m away changes it by at most 1 m), so a triangle whose middle is further than its own size
     plus a margin can be skipped whole: no shot between two people can touch it without crossing the ground or a wall first. */
  function openAll(on){const B=typeof BARRIERS!=='undefined'?BARRIERS:null,V=typeof VAULT!=='undefined'?VAULT:null;
    if(on){const was={b:B?B.map(b=>b.open):null,v:V?V.open:null};if(B)for(const b of B)b.open=true;if(V)V.open=true;return was;}
    return null;}
  function restore(was){const B=typeof BARRIERS!=='undefined'?BARRIERS:null,V=typeof VAULT!=='undefined'?VAULT:null;if(!was)return;
    if(B&&was.b)B.forEach((b,i)=>{b.open=was.b[i];});if(V&&was.v!=null)V.open=was.v;}
  const reach=(x,z)=>!(Math.abs(x)<2e4&&Math.abs(z)<2e4)?1e9:typeof playD==='function'?playD(x,z):0;   // (a stray vertex far out is never near anyone)
  /* fill the voxels a triangle passes through. It is sampled across (in plan) finer than a voxel, and from each sample a column of
     voxels is filled down to its neighbours' heights, so a tall wall costs a row of columns, not a dense grid of points */
  /* every shot test already marches the ground, and off the walkable area the maps' ground stands in for the walls (groundY answers the
     wall's top there): a voxel under the ground adds nothing. Per 2 m column nothing is filled below the lowest ground at its corners
     (buried footings, the sunk bottoms of walls, the mass of a facility under its floor). Cut per build, with every door open */
  let CUT=null;const gnd=(x,z)=>typeof shotG==='function'?shotG(x,z):typeof groundY==='function'?groundY(x,z):-1e9;
  function colCut(bx,bz){const k=(bx+2048)*4096+(bz+2048);let c=CUT.get(k);if(c!==undefined)return c;
    const x=(bx+.5)*4*VX,z=(bz+.5)*4*VX,h=2*VX*1.42;c=-1e9;
    {const r=reach(x,z);if(r>FAR+h)c=1e9;
     else if(r<-h-1)c=gnd(x,z)-.8;           // well inside the walk: its floor, a little below
     else if(r>h+2)c=gnd(x,z)-1.6;           // well outside: the stand-in ground (it can slope across the column)
     else{const e=2*VX;c=Math.min(gnd(x-e,z-e),gnd(x+e,z-e),gnd(x-e,z+e),gnd(x+e,z+e),gnd(x,z))-.6;}}   // at the edge: the lowest of five
    CUT.set(k,c);return c;}
  function fillCol(vx,vz,ya,yb){const ymax=YMAX();if(ya>yb){const t=ya;ya=yb;yb=t;}ya=Math.max(ya,YMIN);yb=Math.min(yb,ymax);if(yb<ya)return;
    if(CUT){const c=colCut(vx>>2,vz>>2);if(yb<=c)return;if(ya<c)ya=c;}
    // a brick at a time: the column's bits in one brick are (vz&3,vx&3) at each of its four heights
    const v0=Math.floor((ya-VY_BIAS)*ivy),v1=Math.floor((yb-VY_BIAS)*ivy),base=((vz&3)<<2)|(vx&3),bx=vx>>2,bz=vz>>2;
    for(let by=v0>>2;by<=(v1>>2);by++){const k=BK(bx,by,bz);if(!k)continue;let i;if(k===wK)i=wI;else{i=slot(B,k,true);wK=k;wI=i;}
      const a0=Math.max(v0,by<<2)&3,a1=Math.min(v1,(by<<2)+3)&3;let m0=0,m1=0;for(let q=a0;q<=a1;q++){if(q<2)m0|=1<<(base+(q<<4));else m1|=1<<(base+((q-2)<<4));}
      if(m0)B.W[i*2]|=m0;if(m1)B.W[i*2+1]|=m1;stats.sets++;}}
  let wK=-1,wI=-1;
  /* a triangle: far from anywhere a person can stand, dropped; big, split in four and each piece judged again (a backdrop hill is
     hundreds of metres across, only a sliver of it near the walk); small enough, sampled across finer than a voxel */
  const FAR=40;
  function tri(a,b,c){return tri9(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z,0);}
  function tri9(ax,ay,az,bx,by,bz,cx,cy,cz,dep){const ymax=YMAX();if(!isFinite(ax+ay+az+bx+by+bz+cx+cy+cz))return 0;if(Math.min(ay,by,cy)>ymax||Math.max(ay,by,cy)<YMIN)return 0;
    const L=Math.max(Math.hypot(ax-bx,ay-by,az-bz),Math.hypot(bx-cx,by-cy,bz-cz),Math.hypot(cx-ax,cy-ay,cz-az));
    // (past 600 m a triangle is a backdrop or a model's stray vertex: some files have vertices kilometres out)
    stats.tris++;if(L>600||reach((ax+bx+cx)/3,(az+bz+cz)/3)>L*.67+FAR){stats.skipped++;return 0;}
    if(L>36&&dep<10){const mx=(ax+bx)/2,my=(ay+by)/2,mz=(az+bz)/2,nx=(bx+cx)/2,ny=(by+cy)/2,nz=(bz+cz)/2,ox=(cx+ax)/2,oy=(cy+ay)/2,oz=(cz+az)/2;
      tri9(ax,ay,az,mx,my,mz,ox,oy,oz,dep+1);tri9(mx,my,mz,bx,by,bz,nx,ny,nz,dep+1);tri9(ox,oy,oz,nx,ny,nz,cx,cy,cz,dep+1);tri9(mx,my,mz,nx,ny,nz,ox,oy,oz,dep+1);return 0;}
    // steep (a wall): cut into vertical strips .45 m apart along its run, and fill each strip's height once
    {const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az,Nx=uy*vz-uz*vy,Ny=uz*vx-ux*vz,Nz=ux*vy-uy*vx,NL=Math.hypot(Nx,Ny,Nz)||1;
     if(Math.abs(Ny)/NL<.3){const hl=Math.hypot(Nx,Nz)||1,dx=Nz/hl,dz=-Nx/hl,P=[[ax,ay,az],[bx,by,bz],[cx,cy,cz]],T=P.map(p=>p[0]*dx+p[2]*dz),t0=Math.min(...T),t1=Math.max(...T);
       const m=Math.max(1,Math.ceil((t1-t0)/.45));
       for(let k=0;k<=m;k++){const t=t0+(t1-t0)*Math.min(1,Math.max(0,(k===0?.001:k===m?.999:k/m)));const X=[];
         for(let e=0;e<3;e++){const p=P[e],q=P[(e+1)%3],tp=T[e],tq=T[(e+1)%3];if((tp-t)*(tq-t)>0||tp===tq)continue;const f=(t-tp)/(tq-tp);X.push([p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f,p[2]+(q[2]-p[2])*f]);}
         if(X.length<2){if(X.length===1)fillCol(Math.floor(X[0][0]*ivx),Math.floor(X[0][2]*ivx),X[0][1],X[0][1]);continue;}
         const p=X[0],q=X[X.length-1],sl=Math.hypot(q[0]-p[0],q[2]-p[2]),r=Math.max(1,Math.ceil(sl/.45));
         for(let j=0;j<r;j++){const f0=j/r,f1=(j+1)/r,fm=(f0+f1)/2;fillCol(Math.floor((p[0]+(q[0]-p[0])*fm)*ivx),Math.floor((p[2]+(q[2]-p[2])*fm)*ivx),p[1]+(q[1]-p[1])*f0,p[1]+(q[1]-p[1])*f1);}}
       return m;}}
    const h=(px,pz,qx,qz)=>Math.hypot(px-qx,pz-qz),n=Math.max(1,Math.ceil(Math.max(h(ax,az,bx,bz),h(bx,bz,cx,cz),h(cx,cz,ax,az))/.45));
    for(let i=0;i<=n;i++)for(let j=0;j<=n-i;j++){const u=i/n,v=j/n,w=1-u-v,x=ax*w+bx*u+cx*v,z=az*w+bz*u+cz*v,y=ay*w+by*u+cy*v;
      let lo=y,hi=y;if(i+1+j<=n){const q=y+(by-ay)/n;if(q<lo)lo=q;if(q>hi)hi=q;}if(i+j+1<=n){const q=y+(cy-ay)/n;if(q<lo)lo=q;if(q>hi)hi=q;}
      fillCol(Math.floor(x*ivx),Math.floor(z*ivx),lo,hi);}
    return n;}
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3(),_m=new THREE.Matrix4(),_im=new THREE.Matrix4();
  const seen=new Map();   // mesh id -> its world matrix when built (to notice movers)
  const sig=o=>{const e=o.matrixWorld.elements;return(e[12]*7.1+e[13]*3.3+e[14]*5.7+e[0]*11+e[2]*13+e[5]*17).toFixed(2);};
  const stats={bricks:0,meshes:0,ms:0,builds:0,sets:0,tris:0,skipped:0};
  /* building, a slice at a time: the new grid fills beside the old one (the old one keeps answering) and replaces it when done */
  let job=null,built=false,dirtyAt=0;
  function begin(){scene.updateMatrixWorld(true);const list=collect(),work=[];
    for(const o of list){if(o.isInstancedMesh)for(let k=0;k<o.count;k++){o.getMatrixAt(k,_im);work.push({o,m:new THREE.Matrix4().multiplyMatrices(o.matrixWorld,_im)});}else work.push({o,m:o.matrixWorld.clone()});}
    job={work,wi:0,t:0,g:grid(),cut:new Map(),ms:0,list,sigs:list.map(o=>[o,sig(o)])};}
  function step(budget){if(!job)begin();const t0=performance.now(),was=openAll(true);
    B=job.g;CUT=job.cut;wK=-1;   // write into the job's grid
    try{while(job.wi<job.work.length){const w=job.work[job.wi],g=w.o.geometry,P=g.attributes.position.array,I=g.index?g.index.array:null,cnt=I?I.length:P.length/3,e=w.m.elements;
        const tx=(i,v)=>{const x=P[i*3],y=P[i*3+1],z=P[i*3+2];v.set(e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]);return v;};
        while(job.t<cnt){const i0=I?I[job.t]:job.t,i1=I?I[job.t+1]:job.t+1,i2=I?I[job.t+2]:job.t+2;tri(tx(i0,_a),tx(i1,_b),tx(i2,_c));job.t+=3;
          if((job.t&63)===0&&performance.now()-t0>budget)break;}
        if(job.t>=cnt){job.wi++;job.t=0;}
        if(performance.now()-t0>budget)break;}}
    finally{B=G;CUT=null;restore(was);}
    job.ms+=performance.now()-t0;
    if(job.wi>=job.work.length){G=B=job.g;lastK=-1;seen.clear();for(const [o,sg] of job.sigs)seen.set(o.id,{o,s:sg});
      stats.bricks=G.nb;stats.meshes=job.list.length;stats.ms=Math.round(job.ms);stats.builds++;built=true;dirtyAt=0;job=null;return true;}
    return false;}
  function build(){job=null;while(!step(1e9));}
  function ensure(){if(!built&&!job)build();else if(!built)while(!step(1e9));}
  // the loading screen builds it in slices before Begin unlocks (js/shared/progress.js PG.warm)
  /* Oct 27: until it is done (it was 40 slices: on a slower machine the rest was finished in one go by the first sight line after Begin,
     the first time an enemy looked for you) */
  if(typeof PG!=='undefined'&&PG.warm)PG.warm(()=>{if(built)return false;step(60);return !built;});
  /* keeping current: a few meshes a frame are checked against how they were; one that moved or hid leaves the grid for good, and the
     grid is rebuilt in the background a moment later (several changes together make one rebuild). New meshes (models arriving) too. */
  let it=null,chkT=0,countT=0,lastCount=-1;
  function tick(dt){if(!built)return;
    if(job){step(4);return;}
    chkT+=dt;if(chkT>.05){chkT=0;if(!it)it=seen.values();for(let k=0;k<40;k++){let r=it.next();if(r.done){it=null;break;}const s=r.value,o=s.o;
      let vis=!!o.parent;for(let q=o;q&&vis;q=q.parent)if(!q.visible||(q.userData&&q.userData.dyn))vis=false;
      if(!vis||sig(o)!==s.s){movers.add(o.id);if(!dirtyAt)dirtyAt=performance.now();}}}
    countT+=dt;if(countT>1.5){countT=0;const n=collect().length;if(lastCount>=0&&n!==lastCount&&!dirtyAt)dirtyAt=performance.now();lastCount=n;}
    if(dirtyAt&&performance.now()-dirtyAt>900){it=null;lastCount=-1;begin();dirtyAt=0;}}
  (function loop(){let t=performance.now();const f=()=>{const n=performance.now();try{tick(Math.min(.1,(n-t)/1000));}catch(e){console.warn('solid',e);}t=n;requestAnimationFrame(f);};requestAnimationFrame(f);})();

  /* the tests: march the line a quarter voxel at a time */
  const STEP=.2;
  function first(o,d,maxD,skip){ensure();const s0=skip||0;lastK=-1;
    for(let t=s0;t<maxD;t+=STEP){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(getV(Math.floor(x*ivx),Math.floor((y)*ivy),Math.floor(z*ivx)))return t;}
    return -1;}
  function hit(a,b,skipA,skipB){ensure();const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,L=Math.hypot(dx,dy,dz);if(L<1e-3)return false;
    const e=L-(skipB==null?.4:skipB);lastK=-1;
    for(let t=(skipA==null?.6:skipA);t<e;t+=STEP){const k=t/L;if(getV(Math.floor((a.x+dx*k)*ivx),Math.floor((a.y+dy*k)*ivy),Math.floor((a.z+dz*k)*ivx)))return true;}
    return false;}
  // where a→b first meets solid, as a fraction of the way (or -1)
  function frac(a,b,skipA,skipB){ensure();const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,L=Math.hypot(dx,dy,dz);if(L<1e-3)return -1;
    const e=L-(skipB==null?.4:skipB);lastK=-1;
    for(let t=(skipA==null?.6:skipA);t<e;t+=STEP){const k=t/L;if(getV(Math.floor((a.x+dx*k)*ivx),Math.floor((a.y+dy*k)*ivy),Math.floor((a.z+dz*k)*ivx)))return k;}
    return -1;}
  function at(x,y,z){ensure();return getV(Math.floor(x*ivx),Math.floor(y*ivy),Math.floor(z*ivx));}
  return{build,step,hit,first,frac,at,stats,movers,get ready(){return built;},
    // mark an object (and everything under it) as moving: never solid. Safe to call before or after a build
    dyn(o){if(o&&o.userData){o.userData.dyn=1;if(built&&!dirtyAt)dirtyAt=performance.now();}return o;}};
})();
