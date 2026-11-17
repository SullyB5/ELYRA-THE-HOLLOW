/* Elyra shared · LANDSCAPE: the land around the walk (Nov 17 2026, Bryce: "the area around needs a complete 1,000,000% overhaul. It is
   just flat ground" — the White City's approach, The Last Signal's outside, Site K's outside, Dead Ground ("cool if it's a desert, but
   it needs to have life ... make it look like maybe it wasn't a desert at one point"), and The Mountain's outside. The skies stay.)

   What it builds, around a level's walk, from the walk's edge out to the horizon:
     landforms   mesas, buttes, hoodoo clusters, needles and stone arches (desert); jagged crags (mountains); scarps and crater walls (moon)
     outcrops    big weathered rocks, banded on Astraea, standing off the walk; boulders lining the walk's edges so it has natural sides
     scatter     stones and pebbles on and beside the walk; on the living worlds grass, shrubs, succulents, pines, ferns, flowers
     the past    Astraea was wet once: dry riverbeds wind across the land (cracked silt, river stones on the banks, dead reeds), dry
                 lakebeds with their old shorelines in rings, petrified trees, the bones of very large animals, ruins of whoever lived here
     the moon    craters with raised rims and ejecta, dust, violet crystals where the Hollow has been
   None of it is solid: the walk is the level's (playD), and nothing large is put on it. Small things (grass, pebbles) may lie on it.
   Everything is merged into a few meshes per 320 m square (rock, plants, solid, glow, ground patches), so it costs a few draw calls a
   square, and js/shared/perf.js culls the squares out of view and makes lighter copies of the far ones. Phones get about half.

   LANDSCAPE.build(o) → {G, update(t)}
     o.scene        the scene
     o.biome        'astraea' | 'moon' | 'elyra'
     o.groundY(x,z) the drawn ground's height (what things stand on)
     o.walkD(x,z)   distance outside the walk (negative on it): the level's playD
     o.path         [[x,z],...] the line the player follows outside (things are spread along it)
     o.keep(x,z)    optional: false where nothing may go (inside a city wall, over a pit)
     o.reach        how far out from the path the land is dressed (default 900)
     o.seed, o.phone, o.night (glowing lichen and flowers), o.k (density multiplier, default 1), o.tex (img/tex name for rock grain)
     o.colors       optional palette overrides */
const LANDSCAPE=(()=>{
  const TAU=Math.PI*2;
  const sm=t=>t*t*(3-2*t),cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,u)=>a+(b-a)*u,ss=(a,b,x)=>sm(cl((x-a)/(b-a),0,1));
  function h3(x,y,z){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(z|0,1440662683))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
  function n3(x,y,z){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=sm(x-xi),yf=sm(y-yi),zf=sm(z-zi);
    const a=lerp(lerp(h3(xi,yi,zi),h3(xi+1,yi,zi),xf),lerp(h3(xi,yi+1,zi),h3(xi+1,yi+1,zi),xf),yf),b=lerp(lerp(h3(xi,yi,zi+1),h3(xi+1,yi,zi+1),xf),lerp(h3(xi,yi+1,zi+1),h3(xi+1,yi+1,zi+1),xf),yf);
    return lerp(a,b,zf);}
  const f3=(x,y,z)=>n3(x,y,z)*.6+n3(x*2.1+7,y*2.1,z*2.1-3)*.28+n3(x*4.3,y*4.3+5,z*4.3)*.12;
  function n2(x,z){return n3(x,0.5,z);}
  function mkRng(s){s=s>>>0||1;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

  /* ---------- prototypes: small indexed meshes in their own space, with a shade (light/dark), a band (0..1 between two colours) and a
     sway (0 at the root, 1 at the tips) per vertex ---------- */
  function proto(pos,idx,shade,band,sway){const g={pos:new Float32Array(pos),idx:idx,shade:shade?new Float32Array(shade):null,band:band?new Float32Array(band):null,sway:sway?new Float32Array(sway):null};
    g.nor=normals(g.pos,idx);return g;}
  function normals(P,I){const N=new Float32Array(P.length);for(let i=0;i<I.length;i+=3){const a=I[i]*3,b=I[i+1]*3,c=I[i+2]*3;
      const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
      for(const k of[a,b,c]){N[k]+=nx;N[k+1]+=ny;N[k+2]+=nz;}}
    for(let i=0;i<N.length;i+=3){const l=Math.hypot(N[i],N[i+1],N[i+2])||1;N[i]/=l;N[i+1]/=l;N[i+2]/=l;}return N;}
  function fromThree(g){const p=g.attributes.position.array;let idx=g.index?Array.from(g.index.array):null;if(!idx){idx=[];for(let i=0;i<p.length/3;i++)idx.push(i);}return{pos:Array.from(p),idx};}
  function icosphere(det){const t=(1+Math.sqrt(5))/2;let V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(v=>{const l=Math.hypot(...v);return v.map(c=>c/l);});
    let F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    for(let d=0;d<det;d++){const cache={},mid=(a,b)=>{const k=a<b?a+'_'+b:b+'_'+a;if(cache[k]!=null)return cache[k];const v=[(V[a][0]+V[b][0])/2,(V[a][1]+V[b][1])/2,(V[a][2]+V[b][2])/2],l=Math.hypot(...v);V.push(v.map(c=>c/l));return cache[k]=V.length-1;};
      const NF=[];for(const [a,b,c] of F){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);NF.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);}F=NF;}
    return{V,F};}
  // a weathered rock: a lumpy sphere, its foot flattened into the ground; strata: ledges and colour bands across it
  function rockProto(sd,o){const {V,F}=icosphere(o.det||2),pos=[],shade=[],band=[];
    for(const v of V){let [x,y,z]=v;const n=f3(x*1.3+sd,y*1.3,z*1.3-sd)-.5,n2_=f3(x*3.2-sd,y*3.2+sd,z*3.2);let r=1+n*(o.jag||.8)+(n2_-.5)*.25;
      if(o.strata){const s=y*(o.bands||3.2)+sd*.37;r*=1-.09*(s-Math.floor(s)<.28?1:0);}
      x*=r;y*=r;z*=r;if(o.flat)y*=o.flat;if(y<-.25)y=-.25+(y+.25)*.25;
      if(o.top&&y>o.top)y=o.top+(y-o.top)*.15;   // a flat top (a slab)
      pos.push(x,y,z);shade.push(.78+.42*n2_+(y>.3?.06:0));band.push(cl(.5+.5*Math.sin(y*(o.bands||3.2)*2.4+sd),0,1));}
    return proto(pos,F.flat(),shade,band);}
  // a turned form (mesas, buttes, hoodoos, needles, crater walls): a profile [[r,y],...] round an axis, roughened, with a cap
  function latheProto(sd,prof,o){o=o||{};const seg=o.seg||28,pos=[],shade=[],band=[],idx=[],R=prof.length;
    for(let i=0;i<R;i++){const [r0,y]=prof[i];for(let j=0;j<seg;j++){const a=j/seg*TAU,cx=Math.cos(a),sz=Math.sin(a);
      const n=f3(cx*1.4+sd,y*(o.vk||2.2),sz*1.4-sd)-.5,fine=f3(cx*4+sd,y*7,sz*4)-.5;let r=r0*(1+n*(o.amp==null?.32:o.amp)+fine*.1);
      if(o.strata){const s=y*(o.bands||5)+sd;if(s-Math.floor(s)<.22)r*=.95;}
      pos.push(cx*r,y+(o.yj||0)*fine,sz*r);shade.push(.8+.4*(fine+.5)+(o.hole&&i===0?-.3:0));band.push(cl(.5+.5*Math.sin(y*(o.bands||5)*TAU*.5+sd+fine),0,1));}}
    for(let i=0;i<R-1;i++)for(let j=0;j<seg;j++){const a=i*seg+j,b=i*seg+(j+1)%seg,c=a+seg,d=b+seg;idx.push(a,c,b,b,c,d);}
    if(!o.open){const top=prof[R-1][1],c0=pos.length/3;pos.push(0,top+(o.dome||0),0);shade.push(.95);band.push(.5);for(let j=0;j<seg;j++){const a=(R-1)*seg+j,b=(R-1)*seg+(j+1)%seg;idx.push(a,b,c0);}}
    return proto(pos,idx,shade,band);}
  // a crag: a broken peak. A lumpy sphere stretched up and narrowed toward a ragged top, leaning, with facets (its noise is coarse)
  function cragProto(sd){const {V,F}=icosphere(3),pos=[],shade=[],band=[];
    for(const v of V){let [x,y,z]=v;const u=(y+1)/2,n=f3(x*1.1+sd,y*1.6,z*1.1-sd)-.5,n2_=f3(x*2.7-sd,y*3.3+sd,z*2.7)-.5,fac=Math.round(n2_*5)/5;
      const w=(1-u*.82)*(1+n*.9+fac*.35);x*=w;z*=w;y=u*(1+n*.25)+(u>.75?(n2_)*.25:0);x+=u*u*(.18+.1*Math.sin(sd));
      if(y<.02)y=.02*(y/.02)-.06;pos.push(x,y,z);shade.push(.72+.5*(n2_+.5)+(u>.6?.08:0));band.push(cl(.5+.5*Math.sin(y*14+sd),0,1));}
    return proto(pos,F.flat(),shade,band);}
  // a stone arch: a roughened tube along a half ellipse, its feet in the ground
  function archProto(sd){const pos=[],shade=[],band=[],idx=[],N=26,S=10;
    for(let i=0;i<=N;i++){const u=i/N,a=lerp(-.08,Math.PI+.08,u),cx=Math.cos(a),cy=Math.sin(a)*1.25,th=.24+.16*Math.pow(Math.abs(cx),2);
      const tx=-Math.sin(a),ty=Math.cos(a)*1.25,tl=Math.hypot(tx,ty);const nx=ty/tl,ny=-tx/tl;
      for(let j=0;j<S;j++){const b=j/S*TAU,n=f3(cx*3+sd,cy*3,Math.cos(b)*2)-.5,r=th*(1+n*.7);
        pos.push(cx+(nx*Math.cos(b))*r*(-1),cy+ny*Math.cos(b)*r*(-1)-(i===0||i===N?.4:0),Math.sin(b)*r*1.4);shade.push(.8+.4*(n+.5));band.push(cl(.5+.5*Math.sin(cy*9+sd),0,1));}}
    for(let i=0;i<N;i++)for(let j=0;j<S;j++){const a=i*S+j,b=i*S+(j+1)%S,c=a+S,d=b+S;idx.push(a,b,c,b,d,c);}
    return proto(pos,idx,shade,band);}
  // ---- plants ----
  function tuftProto(sd,o){const r=mkRng(sd*977+3),pos=[],idx=[],sh=[],bd=[],sw=[],n=o.n||9;
    for(let i=0;i<n;i++){const a=r()*TAU,lean=.15+r()*.55,h=(.55+r()*.6)*(o.h||1),w=(o.w||.05)*(.7+r()*.6),ox=Math.cos(a)*r()*.12,oz=Math.sin(a)*r()*.12,px=-Math.sin(a)*w,pz=Math.cos(a)*w,k=pos.length/3;
      const tx=ox+Math.cos(a)*lean*h,tz=oz+Math.sin(a)*lean*h,mx=ox+Math.cos(a)*lean*h*.35,mz=oz+Math.sin(a)*lean*h*.35;
      pos.push(ox+px,0,oz+pz, ox-px,0,oz-pz, mx+px*.6,h*.55,mz+pz*.6, mx-px*.6,h*.55,mz-pz*.6, tx,h*(1-lean*.25),tz);
      idx.push(k,k+1,k+2,k+1,k+3,k+2,k+2,k+3,k+4);sh.push(.55,.55,.85,.85,1.15);const b=r();bd.push(b,b,b,b,b);sw.push(0,0,.4,.4,1);}
    return proto(pos,idx,sh,bd,sw);}
  function shrubProto(sd,o){const r=mkRng(sd*733+5),pos=[],idx=[],sh=[],bd=[],sw=[],n=o.n||22;
    for(let i=0;i<n;i++){const a=r()*TAU,up=.35+r()*.9,L=(.5+r()*.6)*(o.h||1),w=.035,k=pos.length/3,dx=Math.cos(a)*Math.cos(up),dz=Math.sin(a)*Math.cos(up),dy=Math.sin(up);
      const bx=dx*.08,bz=dz*.08,px=-Math.sin(a)*w,pz=Math.cos(a)*w,tx=dx*L,ty=dy*L,tz=dz*L;
      pos.push(bx+px,0,bz+pz,bx-px,0,bz-pz,tx,ty,tz, bx,w,bz);idx.push(k,k+1,k+2,k,k+3,k+2);sh.push(.5,.5,1.05,.6);const b=r();bd.push(b,b,b,b);sw.push(0,0,.6,0);
      // a leafy tuft at the tip
      if(o.leaf&&r()<o.leaf){const k2=pos.length/3,s=(.04+r()*.05)*(o.h||1);pos.push(tx-s,ty,tz,tx+s,ty+s*.4,tz,tx,ty+s*.2,tz+s,tx,ty-s*.3,tz-s);idx.push(k2,k2+1,k2+2,k2,k2+3,k2+1);sh.push(1,1.1,1,1);bd.push(1,1,1,1);sw.push(.6,.6,.6,.6);}}
    return proto(pos,idx,sh,bd,sw);}
  function rosetteProto(sd,o){const r=mkRng(sd*419+7),pos=[],idx=[],sh=[],bd=[],sw=[],n=o.n||16;
    for(let i=0;i<n;i++){const a=i/n*TAU+r()*.3,up=lerp(.35,1.2,(i%3)/2)+r()*.15,L=(.6+r()*.35)*(o.h||1),w=.09*(o.h||1),k=pos.length/3;
      const dx=Math.cos(a),dz=Math.sin(a),px=-dz*w,pz=dx*w,mx=dx*L*.45*Math.cos(up*.8),my=L*.45*Math.sin(up),mz=dz*L*.45*Math.cos(up*.8),tx=dx*L*Math.cos(up*.75)*1.05,ty=L*Math.sin(up)*.85,tz=dz*L*Math.cos(up*.75)*1.05;
      pos.push(px,0,pz,-px,0,-pz,mx+px*1.1,my,mz+pz*1.1,mx-px*1.1,my,mz-pz*1.1,mx,my+w*.6,mz,tx,ty,tz);
      idx.push(k,k+2,k+4,k+1,k+4,k+3,k+2,k+5,k+4,k+4,k+5,k+3,k,k+1,k+3,k,k+3,k+2);sh.push(.55,.55,.85,.85,1.1,1.2);bd.push(0,0,.3,.3,.3,1);sw.push(0,0,.15,.15,.15,.35);}
    return proto(pos,idx,sh,bd,sw);}
  function mergeInto(dst,g,m,shadeK,bandV,swayV){const P=g.pos||g.attributes.position.array,I=g.idx||(g.index?Array.from(g.index.array):null),o=dst.pos.length/3,v=new THREE.Vector3();
    for(let i=0;i<P.length;i+=3){v.set(P[i],P[i+1],P[i+2]).applyMatrix4(m);dst.pos.push(v.x,v.y,v.z);dst.sh.push(shadeK==null?1:typeof shadeK==='function'?shadeK(P[i],P[i+1],P[i+2]):shadeK);
      dst.bd.push(typeof bandV==='function'?bandV(P[i],P[i+1],P[i+2]):bandV||0);dst.sw.push(typeof swayV==='function'?swayV(P[i],P[i+1],P[i+2]):swayV||0);}
    if(I)for(const k of I)dst.idx.push(k+o);else for(let i=0;i<P.length/3;i++)dst.idx.push(i+o);}
  const MB=()=>({pos:[],sh:[],bd:[],sw:[],idx:[]});
  function cactusProto(sd,o){const r=mkRng(sd*211+9),d=MB();const col=(h,rad)=>{const g=new THREE.CylinderGeometry(rad*.85,rad,h,12,6);const P=g.attributes.position;
      for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i),a=Math.atan2(z,x),k=1+.12*Math.cos(a*8);P.setX(i,x*k);P.setZ(i,z*k);if(P.getY(i)>h/2-.01){P.setX(i,x*.6);P.setZ(i,z*.6);P.setY(i,h/2+rad*.4);}}return g;};
    const H=(1.6+r()*2.4)*(o.h||1),rad=.22+r()*.1;mergeInto(d,col(H,rad),new THREE.Matrix4().makeTranslation(0,H/2,0),1,.2,y=>0);
    const arms=1+Math.floor(r()*2.5);for(let i=0;i<arms;i++){const a=r()*TAU,y0=H*(.35+r()*.3),h2=H*(.25+r()*.25),rr=rad*.75;
      const elbow=new THREE.CylinderGeometry(rr,rr,rad*2.2,10);mergeInto(d,elbow,new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a)*rad*1.1,y0,Math.sin(a)*rad*1.1),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-a,Math.PI/2)),new THREE.Vector3(1,1,1)),.95,.3,0);
      mergeInto(d,col(h2,rr),new THREE.Matrix4().makeTranslation(Math.cos(a)*rad*2.1,y0+h2/2,Math.sin(a)*rad*2.1),1,.3,0);}
    return proto(d.pos,d.idx,d.sh,d.bd,d.sw);}
  // a dead (or petrified) tree: a twisted trunk and forking limbs, no leaves
  function treeProto(sd,o){const r=mkRng(sd*577+11),d=MB();const v=new THREE.Vector3(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
    const limb=(p,dir,L,rad,depth)=>{const g=new THREE.CylinderGeometry(rad*.62,rad,L,depth>1?6:5,1);g.translate(0,L/2,0);q.setFromUnitVectors(up,dir);
      mergeInto(d,g,new THREE.Matrix4().compose(p,q,new THREE.Vector3(1,1,1)),.8+r()*.3,o.band==null?.3:o.band,(x,y)=>cl(depth===0?0:.2+depth*.2,0,1));
      const e=p.clone().addScaledVector(dir,L);if(depth>=(o.depth||3)||rad<.04)return;const n=depth===0?2+Math.floor(r()*2):1+Math.floor(r()*2.2);
      for(let i=0;i<n;i++){const nd=dir.clone().add(v.set(r()-.5,r()*.3,r()-.5).multiplyScalar(1.5)).normalize();if(nd.y<.05)nd.y=.05;nd.normalize();limb(e,nd,L*(.55+r()*.25),rad*.62,depth+1);}};
    limb(new THREE.Vector3(0,-.3,0),new THREE.Vector3(r()*.2-.1,1,r()*.2-.1).normalize(),(2.4+r()*2)*(o.h||1),(.22+r()*.12)*(o.h||1),0);
    return proto(d.pos,d.idx,d.sh,d.bd,d.sw);}
  // a pine (Elyra): a trunk and stacked, ragged cones
  function pineProto(sd,o){const r=mkRng(sd*317+13),d=MB(),H=(7+r()*7)*(o.h||1);
    const tr=new THREE.CylinderGeometry(.12*H/10,.3*H/10,H*.5,6);tr.translate(0,H*.25,0);mergeInto(d,tr,new THREE.Matrix4(),.5,0,0);
    const L=5+Math.floor(r()*3);for(let i=0;i<L;i++){const u=i/L,rad=H*.22*(1-u*.8)*(.85+r()*.3),h=H*.32*(1-u*.4),y=H*(.18+u*.68);
      const g=new THREE.ConeGeometry(rad,h,9,2,true);const P=g.attributes.position;for(let k=0;k<P.count;k++){if(P.getY(k)<-h/2+.01){const a=Math.atan2(P.getZ(k),P.getX(k));const j=1+.22*Math.sin(a*5+sd+i);P.setX(k,P.getX(k)*j);P.setZ(k,P.getZ(k)*j);P.setY(k,P.getY(k)-.25*rad*(r()));}}
      g.translate(0,h/2,0);mergeInto(d,g,new THREE.Matrix4().compose(new THREE.Vector3(0,y,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,r()*TAU,0)),new THREE.Vector3(1,1,1)),(x,y2)=>.7+.4*u+(y2>0?.2:-.1),.4+u*.4,(x,y2)=>cl(.1+u*.6+(y2<0?.3:0),0,1));}
    return proto(d.pos,d.idx,d.sh,d.bd,d.sw);}
  function fernProto(sd,o){const r=mkRng(sd*91+17),pos=[],idx=[],sh=[],bd=[],sw=[],n=o.n||7;
    for(let i=0;i<n;i++){const a=i/n*TAU+r()*.5,L=(.8+r()*.6)*(o.h||1),k0=pos.length/3,S=5;
      for(let s=0;s<=S;s++){const u=s/S,dx=Math.cos(a)*L*u,dz=Math.sin(a)*L*u,dy=L*(.9*u-.75*u*u)+.05,w=(.2*(1-u)+.03)*(o.h||1)*Math.sin(Math.PI*(u*.85+.15)),px=-Math.sin(a)*w,pz=Math.cos(a)*w;
        pos.push(dx+px,dy-w*.3,dz+pz,dx,dy+w*.2,dz,dx-px,dy-w*.3,dz-pz);sh.push(.75,1.1,.75);bd.push(u,u,u);sw.push(u,u,u);}
      for(let s=0;s<S;s++){const a0=k0+s*3,b0=a0+3;idx.push(a0,b0,a0+1,a0+1,b0,b0+1,a0+1,b0+1,a0+2,a0+2,b0+1,b0+2);}}
    return proto(pos,idx,sh,bd,sw);}
  // bones of something very large: a spine, ribs arching up out of the sand, a skull
  function bonesProto(sd){const r=mkRng(sd*653+19),d=MB(),N=9+Math.floor(r()*5),len=1;
    const spineP=[];for(let i=0;i<=12;i++){const u=i/12;spineP.push(new THREE.Vector3(lerp(-.6,.6,u),.18+.08*Math.sin(u*Math.PI)-(u>.85?.2*(u-.85)/.15:0),.03*Math.sin(u*9)));}
    mergeInto(d,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spineP),24,.035,6),new THREE.Matrix4(),1,0,0);
    for(let i=0;i<N;i++){const u=i/(N-1),x=lerp(-.4,.35,u),H=.55*Math.sin(Math.PI*lerp(.12,.95,u))+.12,W=.32*Math.sin(Math.PI*lerp(.15,.95,u))+.08;
      for(const s of[-1,1]){if(r()<.12)continue;const brk=r()<.3?.5+r()*.4:1,pts=[];for(let k=0;k<=8;k++){const t=k/8*brk;pts.push(new THREE.Vector3(x+.04*t,.18+Math.sin(t*Math.PI*.62)*H,s*(W*Math.sin(t*Math.PI*.5)+.02)-s*Math.max(0,t-.8)*W*.3));}
        pts.forEach(p=>{p.y-=.18*(1-Math.min(1,pts[0].distanceTo(p)*4))*0;});mergeInto(d,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.022*(1.2-u*.4),5),new THREE.Matrix4(),.95+r()*.1,0,0);}}
    const sk=icosphere(1);const sp=[];for(const v of sk.V)sp.push(v[0]*.16,v[1]*.08+(v[1]<0?v[1]*.02:0),v[2]*.1);mergeInto(d,{pos:sp,idx:sk.F.flat()},new THREE.Matrix4().makeTranslation(.72,.1,0),.9,0,0);
    for(const s of[-1,1])mergeInto(d,new THREE.ConeGeometry(.03,.32,6),new THREE.Matrix4().compose(new THREE.Vector3(.86,.09,s*.06),new THREE.Quaternion().setFromEuler(new THREE.Euler(s*.3,0,-1.25)),new THREE.Vector3(1,1,1)),1,0,0);
    return proto(d.pos,d.idx,d.sh,d.bd,d.sw);}
  // ruins: a broken wall of big dressed blocks, or a stump of a fluted column, or an aqueduct's arches
  function ruinProto(sd,kind){const r=mkRng(sd*271+23),d=MB();
    if(kind===0){const L=6+Math.floor(r()*6);for(let i=0;i<L;i++){const hgt=Math.max(1,Math.round((1-Math.abs(i/L-.4)*1.6)*4*r()+1));for(let k=0;k<hgt;k++){if(r()<.08)continue;
        const g=new THREE.BoxGeometry(.95,.5,.6,1,1,1);mergeInto(d,g,new THREE.Matrix4().compose(new THREE.Vector3(i-L/2+(k%2)*.5,k*.5+.25,(r()-.5)*.05),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,(r()-.5)*.06,(r()-.5)*.05)),new THREE.Vector3(1,1,1)),.8+r()*.35,r(),0);}}
      for(let i=0;i<5;i++){const g=new THREE.BoxGeometry(.95,.5,.6);mergeInto(d,g,new THREE.Matrix4().compose(new THREE.Vector3((r()-.5)*L,.2,.8+r()*1.5),new THREE.Quaternion().setFromEuler(new THREE.Euler(r()*.5,r()*3,r()*.5)),new THREE.Vector3(1,1,1)),.75+r()*.3,r(),0);}}
    else if(kind===1){const H=1.5+r()*4;const g=new THREE.CylinderGeometry(.5,.55,H,16,4);const P=g.attributes.position;for(let i=0;i<P.count;i++){const a=Math.atan2(P.getZ(i),P.getX(i)),k=1-.06*Math.max(0,Math.cos(a*16)),top=P.getY(i)>H/2-.01;P.setX(i,P.getX(i)*k);P.setZ(i,P.getZ(i)*k);if(top)P.setY(i,P.getY(i)-r()*.6);}
      mergeInto(d,g,new THREE.Matrix4().makeTranslation(0,H/2,0),.95,.5,0);mergeInto(d,new THREE.BoxGeometry(1.5,.4,1.5),new THREE.Matrix4().makeTranslation(0,.2,0),.85,.2,0);
      for(let i=0;i<2;i++){const g2=new THREE.CylinderGeometry(.5,.5,1.2+r(),14);mergeInto(d,g2,new THREE.Matrix4().compose(new THREE.Vector3(1.5+r()*2,.45,(r()-.5)*3),new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,r()*3,0)),new THREE.Vector3(1,1,1)),.85,.5,0);}}
    else{const N=3+Math.floor(r()*3);for(let i=0;i<N;i++){const x=i*4;if(r()<.2)continue;mergeInto(d,new THREE.BoxGeometry(1,6,1.4),new THREE.Matrix4().makeTranslation(x,3,0),.85+r()*.2,r(),0);
        if(i<N-1&&r()<.75){const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(4,0);sh.lineTo(4,1.8);sh.lineTo(3.5,1.8);sh.absarc(2,1.8,1.5,0,Math.PI,false);sh.lineTo(0,1.8);sh.lineTo(0,0);
          const eg=new THREE.ExtrudeGeometry(sh,{depth:1.4,bevelEnabled:false,curveSegments:8});eg.rotateX(Math.PI);eg.translate(0,6+1.8,.7);
          // (upside down: the arch's opening faces the ground)
          mergeInto(d,eg,new THREE.Matrix4().makeTranslation(x+.5-4.5+4,0,0).multiply(new THREE.Matrix4().makeTranslation(-.5,0,0)),.9,.5,0);
          mergeInto(d,new THREE.BoxGeometry(4.6,.9,1.6),new THREE.Matrix4().makeTranslation(x+2,8.25,0),.95,.3,0);}}}
    return proto(d.pos,d.idx,d.sh,d.bd,d.sw);}
  // a cluster of crystals (the moon, where the Hollow has been)
  function crystalProto(sd){const r=mkRng(sd*157+29),d=MB(),n=4+Math.floor(r()*5);
    for(let i=0;i<n;i++){const h=.6+r()*1.8,rad=.08+r()*.14,g=new THREE.CylinderGeometry(0,rad,h,6,1);g.translate(0,h/2,0);
      mergeInto(d,g,new THREE.Matrix4().compose(new THREE.Vector3((r()-.5)*.6,-.1,(r()-.5)*.6),new THREE.Quaternion().setFromEuler(new THREE.Euler((r()-.5)*1,r()*3,(r()-.5)*1)),new THREE.Vector3(1,1,1)),.8+r()*.4,(x,y)=>cl(y/h,0,1),0);}
    return proto(d.pos,d.idx,d.sh,d.bd,d.sw);}
  function podProto(sd){const r=mkRng(sd*37+31),d=MB(),n=3+Math.floor(r()*5);
    for(let i=0;i<n;i++){const h=.15+r()*.45,st=new THREE.CylinderGeometry(.008,.012,h,3);st.translate(0,h/2,0);const x=(r()-.5)*.5,z=(r()-.5)*.5;mergeInto(d,st,new THREE.Matrix4().makeTranslation(x,0,z),.4,0,.5);
      const b=new THREE.SphereGeometry(.035+r()*.03,6,4);mergeInto(d,b,new THREE.Matrix4().makeTranslation(x,h,z),1.2,1,.5);}
    return proto(d.pos,d.idx,d.sh,d.bd,d.sw);}

  /* ---------- palettes ---------- */
  const PAL={
    astraea:{rockA:0x8e4a2c,rockB:0xb27a4c,rockC:0x5e2e1e,landA:0x9a5434,landB:0xc08a58,boulder:0x7a3e26,peb:0x6a3a28,
      grassA:0xd8b062,grassB:0x9a8a48,shrubA:0x4e4430,shrubB:0x7a7a48,leaf:0x6e7c4a,agaveA:0x5e7258,agaveB:0x9aa070,cactA:0x4f6a48,cactB:0x7a8a58,
      deadA:0x8a7a66,deadB:0xd2c4aa,bone:0xe6d8bc,ruinA:0xa06a4a,ruinB:0xc89a70,silt:0x8a5e40,silt2:0x5e3624,salt:0xa07e60,shore:0x6e4430,soilA:0x5a2c1c,soilB:0xa0683e,gravel:0x4a3428,lichen:0x3ae0c0,flower:0xff7a3a},
    moon:{rockA:0x6a6662,rockB:0x8e8984,rockC:0x3e3b3a,landA:0x5a5652,landB:0x86817a,boulder:0x5e5a56,peb:0x4a4744,dust:0x9a958e,crater:0x3a3836,crystal:0x9a5aff,crystalB:0x3a1a6a},
    elyra:{rockA:0x5c646c,rockB:0x8a9096,rockC:0x3c4248,landA:0x56606a,landB:0x7c848a,boulder:0x5a6066,peb:0x4c5258,
      grassA:0x4e7a46,grassB:0x2e5a4a,shrubA:0x2a4a3a,shrubB:0x4a6a3a,leaf:0x3e7a4a,pineA:0x1c3a30,pineB:0x2e5a46,trunk:0x3a2e26,fernA:0x2e6a4e,fernB:0x5a9a5a,
      deadA:0x5a5048,deadB:0x8a8074,moss:0x3e6a3a,lichenY:0xb0a040,glowA:0x46e8ff,glowB:0xe060ff}};

  /* ---------- materials ---------- */
  function rockMat(tex,phone){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:.02});
    if(tex){const t=new THREE.TextureLoader().load('img/tex/'+tex+'-'+(phone?'phone':'pc')+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=phone?2:8;
      m.onBeforeCompile=sh=>{sh.uniforms.tR={value:t};
        sh.vertexShader='varying vec3 vLW;varying vec3 vLN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLW=(modelMatrix*vec4(transformed,1.0)).xyz;vLN=normalize(mat3(modelMatrix)*objectNormal);');
        sh.fragmentShader='uniform sampler2D tR;varying vec3 vLW;varying vec3 vLN;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          {vec3 bw=pow(abs(normalize(vLN)),vec3(4.0));bw/=(bw.x+bw.y+bw.z);float k=.11;
           vec3 tc=pow(texture2D(tR,vLW.zy*k).rgb,vec3(2.2))*bw.x+pow(texture2D(tR,vLW.xz*k).rgb,vec3(2.2))*bw.y+pow(texture2D(tR,vLW.xy*k).rgb,vec3(2.2))*bw.z;
           vec3 tc2=pow(texture2D(tR,vLW.zy*.023+.3).rgb,vec3(2.2))*bw.x+pow(texture2D(tR,vLW.xz*.023+.3).rgb,vec3(2.2))*bw.y+pow(texture2D(tR,vLW.xy*.023+.3).rgb,vec3(2.2))*bw.z;
           float l=dot(tc,vec3(.33))*.6+dot(tc2,vec3(.33))*.4;diffuseColor.rgb*=clamp(.45+l*2.3,.35,1.6);
           diffuseColor.rgb*=mix(1.0,1.12,smoothstep(.55,.9,vLN.y));}`);};}
    return m;}
  function plantMat(T){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0,side:THREE.DoubleSide});
    m.onBeforeCompile=sh=>{sh.uniforms.uT=T;sh.vertexShader='attribute float sway;uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      {vec4 wp0=modelMatrix*vec4(transformed,1.0);float ph=wp0.x*.13+wp0.z*.11;float s=sin(uT*1.7+ph)*.6+sin(uT*2.9+ph*1.7)*.4;transformed.x+=s*sway*.12;transformed.z+=s*sway*.08;}`);};
    return m;}

  /* ---------- the build ---------- */
  function build(o){
    const scene=o.scene,phone=!!o.phone,K=(o.k||1)*(phone?.38:1),rnd=mkRng(o.seed||7),R=(a,b)=>a+rnd()*(b-a),P=Object.assign({},PAL[o.biome]||PAL.astraea,o.colors||{});
    const col=h=>new THREE.Color(h).convertSRGBToLinear();const COL={};for(const k in P)COL[k]=col(P[k]);
    const EDGE=o.edge==null?60:o.edge,gy=o.groundY,wd=o.walkD,keep=o.keep||(()=>true),reach=o.reach||900,G=new THREE.Group();G.name='landscape';scene.add(G);
    const T={value:0};
    const MATS={rock:rockMat(o.tex||'rock',phone),plant:plantMat(T),solid:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:.02}),
      glow:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}),
      crystal:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.25,metalness:.2,emissive:col(P.crystal||0x9a5aff),emissiveIntensity:.35,transparent:false})};
    // the path, measured
    const PTH=(o.path||[[0,0]]).map(p=>({x:p[0],z:p[1]}));const PL=[0];for(let i=1;i<PTH.length;i++)PL.push(PL[i-1]+Math.hypot(PTH[i].x-PTH[i-1].x,PTH[i].z-PTH[i-1].z));const PLEN=PL[PL.length-1]||1;const KK=K*cl(PLEN/900,1,phone?1.8:3.2);
    const pathAt=s=>{for(let i=1;i<PTH.length;i++)if(PL[i]>=s){const u=(s-PL[i-1])/Math.max(1e-6,PL[i]-PL[i-1]),a=PTH[i-1],b=PTH[i];const l=Math.hypot(b.x-a.x,b.z-a.z)||1;return{x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,nx:-(b.z-a.z)/l,nz:(b.x-a.x)/l};}const e=PTH[PTH.length-1];return{x:e.x,z:e.z,nx:1,nz:0};};
    const pathD=(x,z)=>{let d=1e9;for(let i=1;i<PTH.length;i++){const a=PTH[i-1],b=PTH[i],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=l2<1e-9?0:cl(((x-a.x)*dx+(z-a.z)*dz)/l2,0,1);d=Math.min(d,Math.hypot(x-a.x-dx*t,z-a.z-dz*t));}return d;};
    // the big things already placed (so landforms and outcrops don't stand in each other)
    const BIG=[],bigFree=(x,z,r)=>{for(const b of BIG)if(Math.hypot(x-b.x,z-b.z)<r+b.r)return false;return true;};
    // a spot: along the path, out to one side, by a distance (from the path line) between d0 and d1
    const spot=(d0,d1,minW,maxW)=>{for(let t=0;t<14;t++){const s=R(-PLEN*.08,PLEN*1.08),p=pathAt(cl(s,0,PLEN)),sd=rnd()<.5?-1:1,d=lerp(d0,d1,Math.pow(rnd(),1.3));
        let x=p.x+p.nx*sd*d,z=p.z+p.nz*sd*d;if(s<0||s>PLEN){const e=s<0?PTH[0]:PTH[PTH.length-1],a=R(0,TAU);x=e.x+Math.cos(a)*d;z=e.z+Math.sin(a)*d;}
        if(!keep(x,z))continue;const w=wd(x,z);if(w<0&&o.lane&&o.lane(x,z))continue;if(w<minW||(maxW!=null&&w>maxW))continue;return{x,z,w};}return null;};
    // chunks
    const CH=320,CHUNKS={};const chunk=(x,z,key)=>{const k=Math.floor(x/CH)+','+Math.floor(z/CH)+','+key;return CHUNKS[k]||(CHUNKS[k]={key,b:MB(),c:[]});};
    const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3();
    // put a prototype down: (x,z) its foot, sunk a little; colours from two palette entries by its band, times its shade
    // (nothing small sits on a cliff face: on ground steeper than ~40 degrees it would hang off the wall)
    const steep=(x,z,r)=>{r=Math.max(1.5,r);const a=gy(x+r,z),b=gy(x-r,z),c=gy(x,z+r),d=gy(x,z-r);return Math.max(Math.abs(a-b),Math.abs(c-d))/(2*r)>(o.maxSlope||.85);};
    function put(key,pr,x,z,sx,sy,sz,ry,cA,cB,o2){o2=o2||{};if(!o2.steepOK&&o2.y==null&&wd(x,z)>0&&steep(x,z,Math.max(sx,sz)*.6))return false;const y=o2.y!=null?o2.y:(o2.foot?footY(x,z,Math.max(sx,sz)*o2.foot):gy(x,z))-(o2.sink||0);
      _e.set(o2.rx||0,ry,o2.rz||0);_q.setFromEuler(_e);_m.compose(_v.set(x,y,z),_q,_s.set(sx,sy,sz));const C=chunk(x,z,key),b=C.b,off=b.pos.length/3,pp=pr.pos;
      for(let i=0;i<pp.length;i+=3){_v.set(pp[i],pp[i+1],pp[i+2]).applyMatrix4(_m);b.pos.push(_v.x,_v.y,_v.z);const bd=pr.band?pr.band[i/3]:0,sh=(pr.shade?pr.shade[i/3]:1)*(o2.shade||1);
        b.sh.push(lerp(cA.r,cB.r,bd)*sh,lerp(cA.g,cB.g,bd)*sh,lerp(cA.b,cB.b,bd)*sh);b.sw.push(pr.sway?pr.sway[i/3]*(o2.sway==null?1:o2.sway):0);}
      for(const k of pr.idx)b.idx.push(k+off);
      // normals: rotate the prototype's (non-uniform scale: close enough for rocks and plants)
      C.c.push([off,pr,_q.clone(),sx,sy,sz]);}
    const footY=(x,z,r)=>Math.min(gy(x,z),gy(x+r*.7,z),gy(x-r*.7,z),gy(x,z+r*.7),gy(x,z-r*.7));
    const mixC=(a,b,u)=>a.clone().lerp(b,u);

    /* ---- prototypes for this land ---- */
    const PR={rock:[],strata:[],slab:[],mesa:[],butte:[],hoodoo:[],needle:[],arch:[],crag:[],tuft:[],tuftS:[],shrub:[],rosette:[],cactus:[],tree:[],pine:[],fern:[],bones:[],ruin:[],crystal:[],pod:[],crater:[]};
    for(let i=0;i<6;i++){PR.rock.push(rockProto(i*3.1+1,{det:1,jag:.75}));PR.strata.push(rockProto(i*2.3+5,{det:2,jag:.6,strata:o.biome==='astraea',bands:3+i*.4}));}
    for(let i=0;i<4;i++)PR.slab.push(rockProto(i*4.7+9,{det:2,jag:.5,flat:.55,top:.35,strata:o.biome==='astraea'}));
    if(o.biome==='astraea'){
      for(let i=0;i<4;i++)PR.mesa.push(latheProto(i*1.9+2,[[1.5,-.08],[1.3,.06],[1.1,.16],[1.02,.32],[.98,.55],[.95,.8],[.9,.96],[.86,1]],{seg:36,amp:.26,strata:true,bands:6,vk:3}));
      for(let i=0;i<4;i++)PR.butte.push(latheProto(i*2.7+4,[[1.6,-.05],[1.2,.1],[.85,.22],[.78,.45],[.74,.75],[.7,.95],[.62,1]],{seg:28,amp:.3,strata:true,bands:7,vk:3}));
      for(let i=0;i<4;i++)PR.hoodoo.push(latheProto(i*3.3+6,[[.55,-.05],[.42,.15],[.3,.4],[.36,.5],[.24,.7],[.2,.82],[.5,.86],[.55,.93],[.42,1]],{seg:16,amp:.25,strata:true,bands:9,vk:4}));
      for(let i=0;i<3;i++)PR.needle.push(latheProto(i*5.1+8,[[.6,-.05],[.42,.2],[.3,.5],[.2,.8],[.08,1]],{seg:14,amp:.35,strata:true,bands:8,vk:4}));
      for(let i=0;i<2;i++)PR.arch.push(archProto(i*7+3));
      for(let i=0;i<4;i++){PR.tuft.push(tuftProto(i+1,{n:11,h:1}));PR.tuftS.push(tuftProto(i+21,{n:6,h:.6,w:.04}));PR.shrub.push(shrubProto(i+3,{n:26,leaf:i%2?.35:0}));PR.rosette.push(rosetteProto(i+5,{n:18}));PR.cactus.push(cactusProto(i+7,{}));PR.tree.push(treeProto(i+9,{depth:3}));}
      for(let i=0;i<3;i++){PR.bones.push(bonesProto(i+11));PR.ruin.push(ruinProto(i+13,i));PR.ruin.push(ruinProto(i+31,i));}
      for(let i=0;i<3;i++)PR.pod.push(podProto(i+15));}
    if(o.biome==='moon'){
      for(let i=0;i<5;i++)PR.crag.push(cragProto(i*2.1+3));
      for(let i=0;i<3;i++)PR.crater.push(latheProto(i*3+2,[[.6,-.06],[.78,.0],[.9,.07],[.97,.12],[1.04,.1],[1.18,.03],[1.45,-.03]],{seg:48,amp:.08,open:true,vk:6,hole:true}));
      for(let i=0;i<4;i++)PR.crystal.push(crystalProto(i+3));}
    if(o.biome==='elyra'){
      for(let i=0;i<5;i++)PR.crag.push(cragProto(i*3.7+5));
      for(let i=0;i<4;i++){PR.tuft.push(tuftProto(i+41,{n:12,h:.9}));PR.tuftS.push(tuftProto(i+51,{n:7,h:.5,w:.035}));PR.shrub.push(shrubProto(i+61,{n:30,leaf:.8,h:.9}));PR.pine.push(pineProto(i+71,{}));PR.fern.push(fernProto(i+81,{}));PR.tree.push(treeProto(i+91,{depth:3}));PR.pod.push(podProto(i+95));}}

    /* ---- landforms: the far skyline of rock ---- */
    const fN=n=>Math.max(1,Math.round(n*(o.k||1)*(phone?.75:1)));
    if(o.biome==='astraea'){
      const forms=[['mesa',fN(7),260,reach,90,180,40,90],['butte',fN(12),160,reach,30,70,40,110],['hoodoo',fN(22),60,reach*.7,0,0,10,26],['needle',fN(12),90,reach*.8,6,14,30,70],['arch',fN(3),110,reach*.6,0,0,0,0]];
      for(const [kind,n,d0,d1,r0,r1,h0,h1] of forms)for(let i=0;i<n;i++){const s=spot(d0,d1,kind==='hoodoo'?18:40);if(!s)continue;
        if(kind==='hoodoo'){const m=2+Math.floor(rnd()*5);for(let j=0;j<m;j++){const x=s.x+R(-14,14),z=s.z+R(-14,14);if(wd(x,z)<10||!keep(x,z))continue;const h=R(h0,h1),w=h*R(.22,.35);
            put('rock',PR.hoodoo[j%PR.hoodoo.length],x,z,w,h,w,R(0,TAU),COL.rockA,COL.rockB,{foot:.6,sink:.5,steepOK:true});}BIG.push({x:s.x,z:s.z,r:20});continue;}
        if(kind==='arch'){const w=R(18,34);if(!bigFree(s.x,s.z,w))continue;put('rock',PR.arch[i%2],s.x,s.z,w,w*R(.8,1.1),w*.5,R(0,TAU),COL.rockA,COL.rockB,{foot:.4,sink:1,steepOK:true});BIG.push({x:s.x,z:s.z,r:w});continue;}
        const r=R(r0,r1),h=R(h0,h1);if(!bigFree(s.x,s.z,r*1.3)||s.w<r*1.2+10)continue;const pr=PR[kind][i%PR[kind].length];
        put('rock',pr,s.x,s.z,r,h,r*R(.7,1.2),R(0,TAU),COL.rockA,COL.rockB,{foot:.8,sink:2,steepOK:true});BIG.push({x:s.x,z:s.z,r:r*1.4});
        // talus: fallen blocks round its foot
        for(let j=0;j<(phone?6:12);j++){const a=R(0,TAU),rr=r*R(1.1,1.6),x=s.x+Math.cos(a)*rr,z=s.z+Math.sin(a)*rr;if(wd(x,z)<6||!keep(x,z))continue;const k=R(2,7);put('rock',PR.strata[j%6],x,z,k,k*R(.6,1),k,R(0,TAU),COL.rockA,COL.rockC,{sink:k*.2});}}}
    if(o.biome==='moon'||o.biome==='elyra'){
      for(let i=0;i<fN(o.biome==='moon'?34:30);i++){const s=spot(90,reach,30);if(!s)continue;const r=R(20,70),h=r*R(.9,1.8)*(o.biome==='elyra'?1.4:1);if(!bigFree(s.x,s.z,r)||s.w<r)continue;
        put('rock',PR.crag[i%5],s.x,s.z,r,h,r*R(.6,1.1),R(0,TAU),COL.rockA,COL.rockB,{foot:.7,sink:2,steepOK:true});BIG.push({x:s.x,z:s.z,r});
        for(let j=0;j<(phone?4:9);j++){const a=R(0,TAU),rr=r*R(.9,1.4),x=s.x+Math.cos(a)*rr,z=s.z+Math.sin(a)*rr;if(wd(x,z)<5||!keep(x,z))continue;const k=R(2,8);put('rock',PR.rock[j%6],x,z,k,k*R(.5,.9),k,R(0,TAU),COL.boulder,COL.rockB,{sink:k*.25});}}}
    // craters (the moon): a raised rim, ejecta round it, a dark floor (a ground patch, below)
    const CRATERS=[];
    if(o.biome==='moon'){for(let i=0;i<fN(40);i++){const big=i<10,s=spot(big?60:14,big?reach:reach*.5,big?30:4);if(!s)continue;const r=big?R(30,90):R(5,22);if(!bigFree(s.x,s.z,r*.8))continue;
        if(s.w<r*1.5)continue;CRATERS.push({x:s.x,z:s.z,r});put('rock',PR.crater[i%3],s.x,s.z,r,r*R(.14,.24),r,R(0,TAU),COL.landA,COL.landB,{y:gy(s.x,s.z)-r*.06});BIG.push({x:s.x,z:s.z,r:r*1.2});
        for(let j=0;j<Math.min(phone?10:22,4+r*.4);j++){const a=R(0,TAU),rr=r*R(1.15,2.2),x=s.x+Math.cos(a)*rr,z=s.z+Math.sin(a)*rr;if(wd(x,z)<2||!keep(x,z))continue;const k=R(.4,2.4)*(r/30+.4);put('rock',PR.rock[j%6],x,z,k,k*R(.5,.9),k*R(.8,1.2),R(0,TAU),COL.boulder,COL.rockB,{sink:k*.3});}}}

    /* ---- outcrops: big weathered rocks off the walk ---- */
    for(let i=0;i<fN(140);i++){const s=spot(25,reach*.5,10);if(!s)continue;const k=R(5,20)*(s.w<40?.6:1);if(!bigFree(s.x,s.z,k*.8)||s.w<k+4)continue;
      const pr=rnd()<.4?PR.slab[i%4]:PR.strata[i%6];put('rock',pr,s.x,s.z,k*R(1,1.6),k*R(.5,1),k*R(.8,1.3),R(0,TAU),COL.rockA,rnd()<.5?COL.rockB:COL.rockC,{foot:.6,sink:k*.15});BIG.push({x:s.x,z:s.z,r:k*.9});
      for(let j=0;j<(phone?2:5);j++){const x=s.x+R(-k*2,k*2),z=s.z+R(-k*2,k*2);if(wd(x,z)<3||!keep(x,z))continue;const q=R(.6,3);put('rock',PR.rock[j%6],x,z,q,q*R(.5,.9),q,R(0,TAU),COL.boulder,COL.rockC,{sink:q*.25});}}
    /* ---- boulders along the walk's edges: the walk gets natural sides ---- */
    for(let i=0;i<Math.round(520*KK);i++){const s=spot(0,70,1.5,40);if(!s)continue;const k=R(.8,3.5)*(1+s.w*.04);if(s.w<k*.9+.6)continue;
      put('rock',(rnd()<.5?PR.rock:PR.strata)[i%6],s.x,s.z,k*R(.9,1.4),k*R(.5,.95),k,R(0,TAU),COL.boulder,rnd()<.5?COL.rockB:COL.rockC,{sink:k*.22});}
    /* ---- rubble along the walk's sides, on it: fallen rock you take cover behind (solid: o.obst gets a circle for each) ---- */
    if(o.obst)for(let i=0;i<Math.round((o.rubble||140)*KK);i++){const s=spot(0,40,-7,.5);if(!s)continue;if(s.w<-7)continue;const k=R(.7,1.9);if(o.lane&&o.lane(s.x,s.z))continue;
      const n0=put('rock',(rnd()<.5?PR.rock:PR.strata)[i%6],s.x,s.z,k*R(1,1.5),k*R(.6,1),k,R(0,TAU),COL.boulder,rnd()<.5?COL.rockB:COL.rockC,{sink:k*.2});
      if(n0!==false)o.obst.push({x:s.x,z:s.z,r:k*1.05,h:k*.8});}
    /* ---- stones and pebbles: on the walk too (small enough to walk over) ---- */
    for(let i=0;i<Math.round(2400*KK);i++){const s=spot(0,45,-EDGE,30);if(!s)continue;const on=s.w<.5,k=on?R(.08,.3):R(.15,.9);put('rock',PR.rock[i%6],s.x,s.z,k*R(1,1.5),k*R(.4,.8),k,R(0,TAU),COL.peb,COL.boulder,{sink:k*.2});}

    /* ---- the living things ---- */
    const patchy=(x,z,sc,th)=>n2(x*sc+11,z*sc-7)>th;
    if(o.biome==='astraea'){
      // dry grass in drifts (it grows where the old water ran: thicker near the riverbeds, added below)
      for(let i=0;i<Math.round(6000*KK);i++){const s=spot(0,90,-EDGE,60);if(!s||!patchy(s.x,s.z,.025,.4))continue;const on=s.w<.5,pr=on?PR.tuftS[i%4]:PR.tuft[i%4],h=on?R(.5,.9):R(.7,1.5);
        put('plant',pr,s.x,s.z,h,h,h,R(0,TAU),mixC(COL.grassA,COL.grassB,rnd()*.6),COL.grassA,{sink:.05,sway:.9});}
      for(let i=0;i<Math.round(1800*KK);i++){const s=spot(0,130,-EDGE);if(!s)continue;const h=s.w<0?R(.5,1.3):R(.7,2.3);put('plant',PR.shrub[i%4],s.x,s.z,h,h*R(.8,1.1),h,R(0,TAU),COL.shrubA,rnd()<.5?COL.shrubB:COL.leaf,{sink:.05,sway:.4});}
      for(let i=0;i<Math.round(380*KK);i++){const s=spot(0,110,-EDGE);if(!s)continue;const h=R(.5,1.3);put('plant',PR.rosette[i%4],s.x,s.z,h,h*R(.8,1.2),h,R(0,TAU),COL.agaveA,COL.agaveB,{sink:.05,sway:.15});
        if(rnd()<.25){const t=R(1.8,3.2);put('plant',PR.shrub[0],s.x,s.z,.12,t,.12,0,COL.deadA,COL.agaveB,{sway:.3});}}   // a flower stalk
      // clumps: islands of scrub round a rock, where a little water still collects (they're what makes the walk read as land, not floor)
      for(let i=0;i<Math.round(420*KK);i++){const s=spot(0,60,-EDGE);if(!s)continue;const n=3+Math.floor(rnd()*6);
        if(rnd()<.6){const k=R(.6,1.8);put('rock',PR.strata[i%6],s.x,s.z,k*1.3,k*.7,k,R(0,TAU),COL.boulder,COL.rockC,{sink:k*.2});}
        for(let j=0;j<n;j++){const a=R(0,TAU),r=R(.6,3.5),x=s.x+Math.cos(a)*r,z=s.z+Math.sin(a)*r;if(o.lane&&o.lane(x,z))continue;const t=rnd(),h=R(.8,2);
          if(t<.45)put('plant',PR.shrub[j%4],x,z,h,h*R(.8,1.1),h,R(0,TAU),COL.shrubA,rnd()<.6?COL.shrubB:COL.leaf,{sink:.05,sway:.4});
          else if(t<.75)put('plant',PR.tuft[j%4],x,z,h*.9,h*1.1,h*.9,R(0,TAU),mixC(COL.grassA,COL.grassB,rnd()*.5),COL.grassA,{sink:.05,sway:.9});
          else put('plant',PR.rosette[j%4],x,z,h*.7,h*.7,h*.7,R(0,TAU),COL.agaveA,COL.agaveB,{sink:.05,sway:.15});}}
      for(let i=0;i<Math.round(110*KK);i++){const s=spot(3,150,3);if(!s)continue;const h=R(.7,1.4);put('solid',PR.cactus[i%4],s.x,s.z,h,h,h,R(0,TAU),COL.cactA,COL.cactB,{sink:.1});}
      for(let i=0;i<Math.round(70*KK);i++){const s=spot(4,200,4);if(!s)continue;const h=R(.8,1.6),pet=rnd()<.5;put('solid',PR.tree[i%4],s.x,s.z,h,h,h,R(0,TAU),pet?COL.rockA:COL.deadA,pet?COL.rockB:COL.deadB,{sink:.2,rx:R(-.12,.12),rz:R(-.12,.12)});}
      // bones of the great animals
      for(let i=0;i<fN(8);i++){const s=spot(12,260,14);if(!s)continue;const L=R(18,40);if(!bigFree(s.x,s.z,L*.5)||s.w<L*.55)continue;put('solid',PR.bones[i%3],s.x,s.z,L,L,L,R(0,TAU),COL.bone,COL.bone,{sink:L*.06,rz:R(-.06,.06)});BIG.push({x:s.x,z:s.z,r:L*.5});}
      // ruins of the people who lived by the water
      for(let i=0;i<fN(14);i++){const s=spot(10,320,10);if(!s)continue;const kind=i%3,sc=kind===2?R(1.3,2):R(1.4,2.4);if(!bigFree(s.x,s.z,10*sc)||s.w<12*sc)continue;BIG.push({x:s.x,z:s.z,r:10*sc});
        const n=kind===2?1:2+Math.floor(rnd()*3);for(let j=0;j<n;j++){const x=s.x+R(-8,8)*sc,z=s.z+R(-8,8)*sc;if(wd(x,z)<6||!keep(x,z))continue;put('solid',PR.ruin[(i*2+j)%PR.ruin.length%6],x,z,sc,sc,sc,R(0,TAU),COL.ruinA,COL.ruinB,{foot:.4*sc,sink:.3*sc});}}
      if(o.night)for(let i=0;i<Math.round(260*KK);i++){const s=spot(1,60,1);if(!s)continue;const h=R(.6,1.2);put('glow',PR.pod[i%3],s.x,s.z,h,h,h,R(0,TAU),COL.lichen.clone().multiplyScalar(.15),COL.lichen.clone().multiplyScalar(1.4),{sink:.02});}}
    if(o.biome==='elyra'){
      // pines in stands, grass, ferns, flowers that glow at night, dead trees
      for(let i=0;i<Math.round(420*KK*(o.pineN||1));i++){const s=spot(8,reach*.45,8);if(!s||!patchy(s.x,s.z,.012,.42))continue;const h=R(.8,1.8)*(1+Math.min(1,s.w/120))*(o.pineK||1);
        put('plant',PR.pine[i%4],s.x,s.z,h,h,h,R(0,TAU),COL.pineA,COL.pineB,{sink:.4,sway:.25});}
      for(let i=0;i<Math.round(4200*KK);i++){const s=spot(0,90,-EDGE,60);if(!s||!patchy(s.x,s.z,.03,.4))continue;const on=s.w<.5,pr=on?PR.tuftS[i%4]:PR.tuft[i%4],h=on?R(.5,.85):R(.7,1.4);
        put('plant',pr,s.x,s.z,h,h,h,R(0,TAU),mixC(COL.grassA,COL.grassB,rnd()),COL.grassA,{sink:.05,sway:1});}
      for(let i=0;i<Math.round(520*KK);i++){const s=spot(1,70,.8);if(!s)continue;const h=R(.6,1.4);put('plant',PR.fern[i%4],s.x,s.z,h,h,h,R(0,TAU),COL.fernA,COL.fernB,{sink:.05,sway:.6});}
      for(let i=0;i<Math.round(380*KK);i++){const s=spot(1,120,1);if(!s)continue;const h=R(.6,1.5);put('plant',PR.shrub[i%4],s.x,s.z,h,h,h,R(0,TAU),COL.shrubA,COL.shrubB,{sink:.05,sway:.5});}
      for(let i=0;i<Math.round(50*KK);i++){const s=spot(5,200,5);if(!s)continue;const h=R(1,1.8);put('solid',PR.tree[i%4],s.x,s.z,h,h,h,R(0,TAU),COL.deadA,COL.deadB,{sink:.2,rx:R(-.15,.15),rz:R(-.15,.15)});}
      for(let i=0;i<Math.round(320*KK);i++){const s=spot(.8,60,.8);if(!s)continue;const h=R(.7,1.5),c=rnd()<.6?COL.glowA:COL.glowB;put('glow',PR.pod[i%4],s.x,s.z,h,h,h,R(0,TAU),c.clone().multiplyScalar(.12),c.clone().multiplyScalar(o.night?1.5:.7),{sink:.02});}}
    if(o.biome==='moon'){
      for(let i=0;i<Math.round(160*KK);i++){const s=spot(3,o.crystalReach||260,3);if(!s)continue;const h=R(.8,3.2);put('crystal',PR.crystal[i%4],s.x,s.z,h,h,h,R(0,TAU),COL.crystalB,COL.crystal,{sink:.1,rx:R(-.2,.2),rz:R(-.2,.2)});}}

    /* ---- ground patches: riverbeds and lakebeds (Astraea), moss (Elyra), crater floors and dust (the moon) ---- */
    const patchB=MB(),patchA=[],patchCrack=[];
    const ribbon=(pts,wf,cf,crack)=>{for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],l=Math.hypot(b.x-a.x,b.z-a.z)||1,nx=-(b.z-a.z)/l,nz=(b.x-a.x)/l,w=wf(i/(pts.length-1)),off=patchB.pos.length/3;
        for(let j=0;j<=6;j++){const u=j/6*2-1,x=pts[i].x+nx*u*w,z=pts[i].z+nz*u*w,c=cf(u,x,z);patchB.pos.push(x,gy(x,z)+.14,z);patchB.sh.push(c.r,c.g,c.b);patchA.push(c.a);patchCrack.push(crack?crack(u):0);patchB.sw.push(0);}
        if(i>0)for(let j=0;j<6;j++){const p=off-7+j,q=off+j;patchB.idx.push(p,p+1,q,p+1,q+1,q);}}};
    const disc=(cx,cz,r,cf,crack,segs)=>{segs=segs||40;const rings=12,off=patchB.pos.length/3;const wob=a=>1+.22*(n2(Math.cos(a)*2+cx*.01,Math.sin(a)*2+cz*.01)-.5)*2;
      for(let i=0;i<=rings;i++){const u=i/rings;for(let j=0;j<segs;j++){const a=j/segs*TAU,rr=r*u*wob(a),x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr,c=cf(u,x,z);patchB.pos.push(x,gy(x,z)+.15,z);patchB.sh.push(c.r,c.g,c.b);patchA.push(c.a);patchCrack.push(crack?crack(u):0);patchB.sw.push(0);}}
      for(let i=0;i<rings;i++)for(let j=0;j<segs;j++){const a=off+i*segs+j,b=off+i*segs+(j+1)%segs,c=a+segs,d=b+segs;patchB.idx.push(a,c,b,b,c,d);}};
    const ca=(c,a)=>({r:c.r,g:c.g,b:c.b,a});
    if(o.biome==='astraea'){
      // the riverbeds: long winding channels across the land, crossing the walk
      const RIV=[];for(let i=0;i<fN(5);i++){const s=pathAt(R(.05,.95)*PLEN),ang=Math.atan2(s.nz,s.nx)+R(-.7,.7),L=R(700,1600),W=R(7,18),pts=[];let x=s.x-Math.cos(ang)*L/2,z=s.z-Math.sin(ang)*L/2,a=ang;
        for(let k=0;k<=L/6;k++){a+=(n2(k*.05+i*9,i*3)-.5)*.35;x+=Math.cos(a)*6;z+=Math.sin(a)*6;pts.push({x,z});}
        const ok=pts.filter(p=>keep(p.x,p.z));if(ok.length<20)continue;
        // cut it where it leaves the keep area (a channel can stop and start: it was buried by sand)
        let run=[];const flush=()=>{if(run.length>6){RIV.push({pts:run,W});ribbon(run,u=>W*(.75+.35*Math.sin(u*9+i)),(u,x2,z2)=>{const e=Math.abs(u),k2=n2(x2*.08,z2*.08);return ca(e>.7?mixC(COL.silt2,COL.shore,k2):mixC(COL.silt,COL.salt,k2*.35),.85*(1-ss(.75,1,e)));},u=>1-ss(.45,.8,Math.abs(u)));}run=[];};
        for(const p of pts){if(keep(p.x,p.z))run.push(p);else flush();}flush();}
      // the old water's life along them: river stones on the banks, dead reeds, grass, petrified trees
      for(const Rv of RIV)for(let k=0;k<Rv.pts.length;k+=phone?3:2){const p=Rv.pts[k];for(let j=0;j<2;j++){const a=R(0,TAU),r=Rv.W*R(.6,1.3),x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(!keep(x,z))continue;const q=R(.2,.9);
          put('rock',PR.rock[j%6],x,z,q*1.3,q*.55,q,R(0,TAU),COL.silt2,COL.silt,{sink:q*.15});}
        if(rnd()<.55){const a=R(0,TAU),r=Rv.W*R(.9,1.8),x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(keep(x,z)&&wd(x,z)>-60){const h=R(.9,1.8);put('plant',PR.tuft[k%4],x,z,h*.8,h*1.4,h*.8,R(0,TAU),COL.deadA,COL.grassA,{sway:.8});}}
        if(rnd()<.05){const a=R(0,TAU),r=Rv.W*R(1.2,3),x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(keep(x,z)&&wd(x,z)>3){const h=R(1,2);put('solid',PR.tree[k%4],x,z,h,h,h,R(0,TAU),COL.deadA,COL.deadB,{sink:.3,rx:R(-.2,.2)});}}}
      // dry lakes: salt in the middle, the old shorelines in rings, dead trees and a few hulls of reed boats at the edge
      for(let i=0;i<fN(3);i++){const s=spot(180,reach*.8,60);if(!s)continue;const r=Math.min(R(100,230),s.w-15);if(r<50||!bigFree(s.x,s.z,r*.6))continue;BIG.push({x:s.x,z:s.z,r:r*.8});
        disc(s.x,s.z,r,(u,x,z)=>{const ring=Math.sin(u*38)*.5+.5,k=n2(x*.05,z*.05);const c=u<.6?mixC(COL.salt,COL.silt,k*.6):mixC(COL.silt,COL.shore,ring*.7);return ca(c,.8*(1-ss(.82,1,u)));},u=>1-ss(.5,.8,u),56);}}
    if(o.biome==='astraea')for(let i=0;i<fN(phone?60:130);i++){const s=spot(0,reach*.6,-200);if(!s)continue;const kind=rnd();
        disc(s.x,s.z,R(18,70),(u,x,z)=>ca(kind<.4?mixC(COL.gravel,COL.soilA,n2(x*.12,z*.12)):kind<.75?mixC(COL.soilB,COL.silt,n2(x*.08,z*.08)):mixC(COL.soilA,COL.rockC,n2(x*.1,z*.1)),.75*(1-ss(.3,1,u))),kind>.8?(u=>.6*(1-u)):null,28);}
    if(o.biome==='moon'){for(const c of CRATERS)disc(c.x,c.z,c.r*.92,(u,x,z)=>ca(mixC(COL.crater,COL.landA,n2(x*.1,z*.1)*.5+u*.3),1-ss(.75,1,u)),null,32);
      for(let i=0;i<fN(24);i++){const s=spot(0,reach*.5,-80);if(!s)continue;disc(s.x,s.z,R(15,50),(u,x,z)=>ca(mixC(COL.dust,COL.landB,n2(x*.07,z*.07)),.55*(1-ss(.4,1,u))),null,28);}}
    if(o.biome==='elyra'){for(let i=0;i<fN(40);i++){const s=spot(0,reach*.4,-80);if(!s)continue;disc(s.x,s.z,R(10,40),(u,x,z)=>ca(mixC(COL.moss,COL.grassB,n2(x*.09,z*.09)),.7*(1-ss(.35,1,u))),null,28);}}

    /* ---- turn the chunks into meshes ---- */
    let draws=0,tris=0;
    for(const k in CHUNKS){const C=CHUNKS[k],b=C.b;if(!b.idx.length)continue;const g=new THREE.BufferGeometry(),nv=b.pos.length/3;
      g.setAttribute('position',new THREE.Float32BufferAttribute(b.pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.sh,3));
      // normals: each prototype's, turned by its own rotation and scale
      const N=new Float32Array(nv*3),v=new THREE.Vector3();for(const [off,pr,q,sx,sy,sz] of C.c){const pn=pr.nor;for(let i=0;i<pn.length;i+=3){v.set(pn[i]/sx,pn[i+1]/sy,pn[i+2]/sz).normalize().applyQuaternion(q);const j=off*3+i;N[j]=v.x;N[j+1]=v.y;N[j+2]=v.z;}}
      g.setAttribute('normal',new THREE.BufferAttribute(N,3));if(C.key==='plant')g.setAttribute('sway',new THREE.Float32BufferAttribute(b.sw,1));
      g.setIndex(nv>65535?new THREE.Uint32BufferAttribute(b.idx,1):new THREE.Uint16BufferAttribute(b.idx,1));g.computeBoundingSphere();
      const m=new THREE.Mesh(g,MATS[C.key]);m.castShadow=!phone&&(C.key==='rock'||C.key==='solid');m.receiveShadow=C.key!=='glow';m.matrixAutoUpdate=false;m.updateMatrix();G.add(m);draws++;tris+=b.idx.length/3;}
    if(patchB.idx.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(patchB.pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(patchB.sh,3));
      g.setAttribute('pa',new THREE.Float32BufferAttribute(patchA,1));g.setAttribute('crk',new THREE.Float32BufferAttribute(patchCrack,1));g.setIndex(patchB.pos.length/3>65535?new THREE.Uint32BufferAttribute(patchB.idx,1):new THREE.Uint16BufferAttribute(patchB.idx,1));
      g.computeVertexNormals();g.computeBoundingSphere();
      const pm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
      pm.onBeforeCompile=sh=>{sh.vertexShader='attribute float pa;attribute float crk;varying float vPA;varying float vCrk;varying vec3 vPW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPA=pa;vCrk=crk;vPW=(modelMatrix*vec4(transformed,1.0)).xyz;');
        sh.fragmentShader='varying float vPA;varying float vCrk;varying vec3 vPW;\nvec2 h22(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}\nfloat vor(vec2 x){vec2 n=floor(x),f=fract(x);float d1=8.0,d2=8.0;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=vec2(float(i),float(j)),o=h22(n+g),r=g+o-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}return sqrt(d2)-sqrt(d1);}\n'+
          sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          {float cd=length(vPW-cameraPosition);float fade=1.0-smoothstep(40.0,160.0,cd);
           vec2 wq=vPW.xz+vec2(sin(vPW.z*.37),sin(vPW.x*.41))*.35;float c1=vor(wq*.9),c2=vor(wq*2.6);float crack=(1.0-smoothstep(.0,.05,c1))*.7+(1.0-smoothstep(.0,.04,c2))*.3;
           diffuseColor.rgb*=1.0-crack*vCrk*mix(.35,.75,fade);diffuseColor.rgb*=1.0+.08*vCrk*smoothstep(.1,.5,c1);
           diffuseColor.a*=vPA;}`);};
      const pmesh=new THREE.Mesh(g,pm);pmesh.receiveShadow=true;pmesh.renderOrder=1;G.add(pmesh);draws++;}
    {const first=G.children[0];if(first)first.onBeforeRender=()=>{T.value=performance.now()/1000;};}
    window.ELYRA_LANDSCAPE={draws,tris:Math.round(tris)};
    return{G,update(t){T.value=t;}};}
  return{build};
})();
