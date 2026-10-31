/* Elyra · TakeOver · the map kit (Oct 31, Bryce: four more small maps at once — Midnight Market, Vigil Harbour, Beached Freighter,
   Fallen Spire — "go all out"). What every one of them needs, so each map file is only its own plan and look:

     the frame       renderer, scene, camera, the bloom pass and the quality switch, the corner menu, the screen flash
     the contract    terrH / groundY / floorY3 / playD3 / losBlock / ... for js/origin/03-play.js and js/mp/03-match.js, built from
                     what the map puts into S3 (as in js/mp/husk-world.js): walls (solid boxes in any direction, stopping walking
                     across your body's height, shots and sight), surfs (floors you stand on, flat or sloped: roofs, decks, stairs,
                     planks) and floors (slabs shots don't pass through). The map gives the ground (CITY.ground) and its edge
                     (CITY.edge: distance outside, negative inside)
     the pieces      KIT.block (a solid box with a roof you can stand on), KIT.deck (a tilted or flat plate, any rotation),
                     KIT.ramp (stairs and planks, with a solid underside where it's too low to walk under, and rails),
                     KIT.wall (a thin wall), KIT.rail (a railing you can see and shoot over), KIT.post (a round obstacle)
     the bots' map   KIT.nav(): a spot every couple of metres on every floor anyone can stand on (the ground, every roof and deck),
                     more along every ramp, joined where you can walk from one to the next without a step over half a metre or a
                     wall in the way. The same shape js/mp/03-match.js reads (nodes, NEXT, nearest, clear, clear3, perches)
     the weather     KIT.rain (streaks in a box round the camera, the hiss), KIT.sound (a looped noise bed and one-shots)
     the look        KIT.env (a painted reflection cube), KIT.neon (signs on canvases), materials that share one set of settings

   Everything here is used by one map at a time (each page loads this, then its own world file). Units are metres; north is -z. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.5:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
window.ELYRA_RENDERER=renderer;
$('app').appendChild(renderer.domElement);
MODELS.preload(['chars/keeper-footsoldier','rifle']);
window.WARM_TEAMS=[];window.WARM_POOL=.01;
window.HERALD_LIFT=null;
window.PLAYER_KIND='keeper-footsoldier';window.PLAYER_OPTS={tint:0x9ab8ff};
const scene=new THREE.Scene();
let HAZE_HEX=0x101420;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),.02);scene.background=scene.fog.color.clone();
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,9000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();
const lerp=(a,b,u)=>a+(b-a)*u;
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const mir=p=>[-p[0],-p[1]];
const TEAM_COLS={blue:{c:0x3f8cff,tint:0x9ab8ff,name:'BLUE'},red:{c:0xff4a3a,tint:0xffa496,name:'RED'},yellow:{c:0xffc83a,tint:0xffe39a,name:'YELLOW'},green:{c:0x3fe07a,tint:0xa8f0bc,name:'GREEN'}};
// what the map fills in: its ground, its edge (distance outside the play area, negative inside), its box for the bots' grid
const CITY={ground:(x,z)=>0,edge:(x,z)=>Math.max(Math.abs(x),Math.abs(z))-60,box:[-60,-40,60,40],step:2.2,ticks:[],skies:[]};

/* ---------- S3: walls, surfs and floors in a 6 m grid (the shape of js/mp/01-world.js and js/mp/husk-world.js) ---------- */
const OBST=[],BARS=[];
const S3={walls:[],surfs:[],floors:[],G:{},C:6,st:0};
function s3Put(o,x0,z0,x1,z1){o.st=0;const Cc=S3.C;for(let i=Math.floor(x0/Cc);i<=Math.floor(x1/Cc);i++)for(let j=Math.floor(z0/Cc);j<=Math.floor(z1/Cc);j++){const k=i+','+j;(S3.G[k]||(S3.G[k]={w:[],s:[],f:[]}))[o.k3].push(o);}}
// a solid box standing on the segment a→b, th thick, from y0 up to y1
function s3Wall(ax,az,bx,bz,y0,y1,th,walk,los){const L=Math.hypot(bx-ax,bz-az);if(L<.05||y1-y0<.02)return null;const ux=(bx-ax)/L,uz=(bz-az)/L;
  const Rr={k3:'w',x:(ax+bx)/2,z:(az+bz)/2,ux,uz,hw:L/2,hd:th/2,y0,y1,walk:walk!==false,los:los!==false};
  const ex=Math.abs(ux)*Rr.hw+Math.abs(uz)*Rr.hd+1,ez=Math.abs(uz)*Rr.hw+Math.abs(ux)*Rr.hd+1;S3.walls.push(Rr);s3Put(Rr,Rr.x-ex,Rr.z-ez,Rr.x+ex,Rr.z+ez);return Rr;}
function s3Surf(inside,h,box){const S={k3:'s',inside,h};S3.surfs.push(S);s3Put(S,box[0],box[1],box[2],box[3]);return S;}
function s3Floor(inside,y,box,hf){const F={k3:'f',inside,y0:y,hf:hf||null};S3.floors.push(F);s3Put(F,box[0],box[1],box[2],box[3]);return F;}
const s3Cell=(x,z)=>S3.G[Math.floor(x/S3.C)+','+Math.floor(z/S3.C)];
function rectLocal(Rr,x,z){const dx=x-Rr.x,dz=z-Rr.z;return[dx*Rr.ux+dz*Rr.uz,-dx*Rr.uz+dz*Rr.ux];}
function rectSD(Rr,x,z){const l=rectLocal(Rr,x,z),dx=Math.abs(l[0])-Rr.hw,dz=Math.abs(l[1])-Rr.hd;return Math.hypot(Math.max(dx,0),Math.max(dz,0))+Math.min(Math.max(dx,dz),0);}
function rectSeg(Rr,a,b){const la=rectLocal(Rr,a.x,a.z),lb=rectLocal(Rr,b.x,b.z);let t0=0,t1=1;
  for(const [p,q,h] of[[la[0],lb[0],Rr.hw],[la[1],lb[1],Rr.hd],[a.y,b.y,null]]){const d=q-p;let lo,hi;if(h===null){lo=Rr.y0;hi=Rr.y1;}else{lo=-h;hi=h;}
    if(Math.abs(d)<1e-9){if(p<lo||p>hi)return-1;continue;}let u=(lo-p)/d,v=(hi-p)/d;if(u>v){const w=u;u=v;v=w;}t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return-1;}
  return t0;}
// how far along a→b (0..1) a shot or a look gets before a wall, a floor slab or a sloped deck stops it (the ground too)
function s3Frac(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,L=Math.hypot(dx,dz),st=++S3.st;let best=1;
  const n=Math.max(1,Math.ceil(L/(S3.C/3)));
  for(let k=0;k<=n;k++){const t=k/n,c=s3Cell(a.x+dx*t,a.z+dz*t);if(!c)continue;
    for(const Rr of c.w){if(Rr.st===st||!Rr.los)continue;Rr.st=st;const f=rectSeg(Rr,a,b);if(f>=0&&f<best)best=f;}
    for(const F of c.f){if(F.st===st)continue;F.st=st;
      if(!F.hf){if((a.y-F.y0)*(b.y-F.y0)>=0)continue;const f=(F.y0-a.y)/dy;if(f>=0&&f<best&&F.inside(a.x+dx*f,a.z+dz*f))best=f;}
      else{// a sloped slab: march along the segment for the crossing
        let pv=null;const m=Math.max(4,Math.ceil(Math.hypot(dx,dy,dz)/.6));for(let i=0;i<=m;i++){const u=i/m,x=a.x+dx*u,z=a.z+dz*u;if(!F.inside(x,z)){pv=null;continue;}const s=a.y+dy*u-F.hf(x,z);
          if(pv!==null&&pv*s<0){const f=(i-1+pv/(pv-s))/m;if(f<best)best=f;break;}pv=s;}}}}
  // the ground (dunes and banks): sample under the line
  if(CITY.hilly){const m=Math.max(4,Math.ceil(L/2));for(let i=1;i<=m;i++){const u=i/m;if(u>=best)break;if(a.y+dy*u<CITY.ground(a.x+dx*u,a.z+dz*u)-.05){best=Math.max(0,(i-.5)/m);break;}}}
  return best;}
function s3Top(x,z){const c=s3Cell(x,z);let t=-1e9;if(!c)return t;for(const S of c.s)if(S.inside(x,z))t=Math.max(t,S.h(x,z)+.2);for(const Rr of c.w)if(rectSD(Rr,x,z)<0)t=Math.max(t,Rr.y1);return t;}

/* ---------- the contract for js/origin/03-play.js ---------- */
const STEP=.85;
function terrH(x,z){return CITY.ground(x,z);}
function groundY(x,z){return CITY.ground(x,z);}
function meshY(x,z){return CITY.ground(x,z);}
function edgeD(x,z){return CITY.edge(x,z)+GS.HALF;}
// the floor under someone standing at height y: the ground, or the highest roof, deck, stair or plank under them they can step onto
function floorY3(x,z,y){let best=CITY.ground(x,z);const c=s3Cell(x,z);if(c)for(const S of c.s)if(S.inside(x,z)){const h=S.h(x,z);if(h<=y+STEP&&h>best)best=h;}return best;}
// distance outside where you can be at height y (negative inside): the map's edge and every wall across your body
// (a wall whose top is within 0.6 m over your feet is a step you take, not a wall: a stair's last tread onto a roof, a kerb)
function playD3(x,z,y){const g=CITY.ground(x,z),yb=Math.max(y==null?-1e9:y,g);let d=CITY.edge(x,z);
  const c=s3Cell(x,z);if(c)for(const Rr of c.w){if(!Rr.walk||Rr.y0>yb+1.75||Rr.y1<yb+.6)continue;d=Math.max(d,-rectSD(Rr,x,z));}
  return d;}
function playD(x,z){return playD3(x,z,null);}
function camClamp(head){const c=camera.position,g=floorY3(c.x,c.z,c.y)+.3;if(c.y<g)c.y=g;}
const ROAD_LEN=1,SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0,BARRIERS=[],BLOCKS=[];
const _rp=new THREE.Vector3();
let LZ={x:0,z:0,r:12};
function roadS(x,z){return 0;}function roadPt(s,out){return(out||_rp).set(LZ.x,0,LZ.z);}function roadN(s){return{x:1,z:0};}
function latOf(x,z){return 0;}function laneC(s){return 0;}function laneHalf(s){return 400;}function spineAt(s){return false;}function barrier(id){return null;}
const BLEN=0;function belowD(){return 1;}function belowS(){return 0;}function belowPt(s,o){return(o||new THREE.Vector3());}function belowFloor(){return 0;}
const HOLLOW_GLOW=0xff6a5a,HOST_GLOW=0xa45cff;
function inDome(B,p){return Math.hypot(p.x-B.x,(p.y||0)-B.y,p.z-B.z)<B.shieldR;}
function losBlock(a,b){for(const B of GS.BASES)if(inDome(B,a)!==inDome(B,b))return true;return s3Frac(a,b)<1;}
function followSun(p){if(KIT.sunFollow)KIT.sunFollow(p);}
function skyFollow(){for(const g of CITY.skies)g.position.copy(camera.position);}
let lookName='night';function setLook(){}
const hemi=new THREE.HemisphereLight(C(0x6a7a9a),C(0x1a1c22),.6);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(C(0x9ab4cc),.4);scene.add(keyLight,keyLight.target);
const helmLamp=new THREE.PointLight(C(0xffffff),0,10,1.5);scene.add(helmLamp);
function updateLights(dt,T,pos){for(const f of CITY.ticks)f(dt,T,pos);}
const tmpC=new THREE.Color();
let stoneMat=null;   // (js/mp/03-match.js: the beacon, which these maps don't have)

/* ---------- the kit ---------- */
const KIT=(()=>{
  const PAIRS=[];   // (for the bots: every ramp's line, so narrow stairs and planks get spots of their own)
  // an oriented frame: centre, yaw ry (the long axis a along (cos ry, -sin ry)), so a box can stand any way round
  const frame=(cx,cz,ry)=>{const ux=Math.cos(ry),uz=-Math.sin(ry);return{cx,cz,ux,uz,loc(x,z){const dx=x-cx,dz=z-cz;return[dx*ux+dz*uz,-dx*uz+dz*ux];},at(a,b){return[cx+ux*a-uz*b,cz+uz*a+ux*b];}};};
  const bboxOf=(F,l,w)=>{const P=[F.at(-l/2,-w/2),F.at(l/2,-w/2),F.at(l/2,w/2),F.at(-l/2,w/2)];return[Math.min(...P.map(p=>p[0])),Math.min(...P.map(p=>p[1])),Math.max(...P.map(p=>p[0])),Math.max(...P.map(p=>p[1]))];};
  /* a solid box: rect [x0,x1,z0,z1] (or {cx,cz,ry,l,w}) from y0 to y1. top:false for no floor on it (it's under something);
     o.los false lets shots through (a fence of bars); o.walk false lets you walk through (a hologram) */
  function block(r,y0,y1,o){o=o||{};let cx,cz,ry,l,w;
    if(Array.isArray(r)){cx=(r[0]+r[1])/2;cz=(r[2]+r[3])/2;l=r[1]-r[0];w=r[3]-r[2];ry=0;}else{({cx,cz,ry,l,w}=r);}
    const F=frame(cx,cz,ry),a=F.at(-l/2,0),b=F.at(l/2,0);const W=s3Wall(a[0],a[1],b[0],b[1],y0,y1,w,o.walk!==false,o.los!==false);
    if(o.top!==false){const ins=(x,z)=>{const q=F.loc(x,z);return Math.abs(q[0])<=l/2+.04&&Math.abs(q[1])<=w/2+.04;},bx=bboxOf(F,l,w);s3Surf(ins,()=>y1,bx);if(o.slab!==false)s3Floor(ins,y1-.15,bx);}
    return{W,F,cx,cz,ry,l,w,y0,y1};}
  /* a deck: an oriented plate whose height is a plane: y = y0 + a*ga + b*gb in its own frame (a along, b across). You stand on it;
     shots don't pass it (unless o.los is false: a grating). o.under: a solid skirt under it down to the ground, so nobody walks under
     a low deck */
  function deck(cx,cz,ry,l,w,y0,ga,gb,o){o=o||{};ga=ga||0;gb=gb||0;const F=frame(cx,cz,ry),bx=bboxOf(F,l,w);
    const ins=(x,z)=>{const q=F.loc(x,z);return Math.abs(q[0])<=l/2+.03&&Math.abs(q[1])<=w/2+.03;},hf=(x,z)=>{const q=F.loc(x,z);return y0+q[0]*ga+q[1]*gb;};
    const S=s3Surf(ins,hf,bx);if(o.los!==false){if(ga||gb)s3Floor(ins,y0,bx,(x,z)=>hf(x,z)-.12);else s3Floor(ins,y0-.12,bx);}
    return{S,F,ins,hf,l,w};}
  /* stairs or a plank: from P0 along (ux,uz), L long, w wide, rising yA → yB. A solid underside where it's lower than you can walk
     under (o.clear, 2.1 m over the ground under it); rails along the open sides (o.rails: [left,right], seen and shot over) */
  function ramp(P0,ux,uz,L,w,yA,yB,o){o=o||{};const n0=Math.hypot(ux,uz);ux/=n0;uz/=n0;const nx=-uz,nz=ux,hAt=a=>yA+(yB-yA)*clamp(a/L,0,1);
    const loc=(x,z)=>{const dx=x-P0[0],dz=z-P0[1];return[dx*ux+dz*uz,dx*nx+dz*nz];};
    const cs=[[0,-w/2],[L,-w/2],[L,w/2],[0,w/2]].map(([a,b])=>[P0[0]+ux*a+nx*b,P0[1]+uz*a+nz*b]);
    const bx=[Math.min(...cs.map(p=>p[0])),Math.min(...cs.map(p=>p[1])),Math.max(...cs.map(p=>p[0])),Math.max(...cs.map(p=>p[1]))];
    const ins=(x,z)=>{const q=loc(x,z);return q[0]>=-.05&&q[0]<=L+.05&&Math.abs(q[1])<=w/2+.03;};
    s3Surf(ins,(x,z)=>hAt(loc(x,z)[0])+.02,bx);
    if(o.slab!==false)s3Floor(ins,0,bx,(x,z)=>hAt(loc(x,z)[0])-.1);
    // the underside, in steps: solid where the ramp is less than the clearance over the ground under it
    const clr=o.clear==null?2.1:o.clear,n=Math.max(2,Math.ceil(L/.9));
    for(let k=0;k<n;k++){const a0=k/n*L,a1=(k+1)/n*L,h=Math.min(hAt(a0),hAt(a1)),mx=P0[0]+ux*(a0+a1)/2,mz=P0[1]+uz*(a0+a1)/2,g=o.base!=null?o.base:CITY.ground(mx,mz);
      if(h-g<clr&&h-g>.45)s3Wall(P0[0]+ux*a0,P0[1]+uz*a0,P0[0]+ux*a1,P0[1]+uz*a1,g-.3,h-.35,w-.05,true,true);}
    const rails=o.rails||[true,true];
    for(const [s,on] of[[-1,rails[0]],[1,rails[1]]]){if(!on)continue;const b=s*(w/2-.05);
      for(let k=0;k<n;k++){const a0=k/n*L,a1=(k+1)/n*L,h=Math.min(hAt(a0),hAt(a1));s3Wall(P0[0]+ux*a0+nx*b,P0[1]+uz*a0+nz*b,P0[0]+ux*a1+nx*b,P0[1]+uz*a1+nz*b,h-.1,h+1.05,.1,true,false);}}
    const R={P0,ux,uz,nx,nz,L,w,yA,yB,hAt,loc,ins};PAIRS.push(R);return R;}
  // a thin wall (with its own height band): blocks walking and shots
  function wall(ax,az,bx,bz,y0,y1,th,los){return s3Wall(ax,az,bx,bz,y0,y1,th||.3,true,los!==false);}
  // a railing: blocks walking, not shots or sight
  function rail(ax,az,bx,bz,y,h){return s3Wall(ax,az,bx,bz,y-.05,y+(h||1.05),.12,true,false);}
  // a round obstacle standing from y0 (a tank, a bollard, a pillar): OBST for walking, a wall box for shots
  function post(x,z,r,y0,h,los){OBST.push({x,z,r,h,y0});if(los!==false)s3Wall(x-r*.7,z,x+r*.7,z,y0,y0+h,r*1.4,false,true);}
  /* ---------- the bots' map ---------- */
  function nav(opt){opt=opt||{};const t0=performance.now(),G=opt.step||CITY.step,nodes=[],[X0,Z0,X1,Z1]=CITY.box;
    const add=(x,z,y,f)=>{nodes.push(Object.assign({x,z,y,nb:[],up:true,r:1.3},f||{}));return nodes.length-1;};
    function walk(ax,az,ay,bx,bz,by,m){m=m==null?.35:m;const L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(L/.4));let cy=ay;
      for(let k=1;k<=n;k++){const t=k/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,y=floorY3(x,z,cy+.2);if(Math.abs(y-cy)>.75)return false;if(playD3(x,z,y)>-m)return false;cy=y;}
      return by==null||Math.abs(cy-by)<.6;}
    const levels=(x,z)=>{const L=[CITY.ground(x,z)];const c=s3Cell(x,z);if(c)for(const S of c.s)if(S.inside(x,z))L.push(S.h(x,z));return L;};
    const ok=(x,z,y)=>playD3(x,z,y)<-.5&&Math.abs(floorY3(x,z,y+.3)-y)<.12;
    const tryAt=(x,z,f)=>{const seen=[];for(const y of levels(x,z)){if(seen.some(v=>Math.abs(v-y)<.4))continue;seen.push(y);if(ok(x,z,y))add(x,z,y,f);}};
    // the grid: a spot in each cell on every level, nudged off the cell's centre when the centre is too close to a wall (a narrow deck
    // or corridor whose middle falls between two grid lines still gets its spots)
    const NUDGE=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].map(([a,b])=>[a*G*.33,b*G*.33]);
    for(let x=X0+G/2;x<X1;x+=G)for(let z=Z0+G/2;z<Z1;z+=G){const seen=[];for(const y of levels(x,z)){if(seen.some(v=>Math.abs(v-y)<.4))continue;seen.push(y);
      for(const [dx,dz] of NUDGE){const px=x+dx,pz=z+dz;if(Math.abs(floorY3(px,pz,y+.3)-y)>.12)continue;if(ok(px,pz,y)){add(px,pz,y);break;}}}}
    for(const R of PAIRS){const n=Math.max(2,Math.ceil(R.L/1.4));for(let k=0;k<=n;k++){const a=k/n*R.L,x=R.P0[0]+R.ux*a,z=R.P0[1]+R.uz*a,y=R.hAt(a)+.02;if(ok(x,z,y))add(x,z,y,{ramp:1,r:1});}
      for(const a of[-1.2,R.L+1.2]){const x=R.P0[0]+R.ux*a,z=R.P0[1]+R.uz*a;tryAt(x,z,{r:1});}}
    if(opt.extra)for(const p of opt.extra)tryAt(p[0],p[1],{r:1});
    const BK={},bk=(x,z)=>Math.floor(x/4)+','+Math.floor(z/4);nodes.forEach((n,k)=>{(BK[bk(n.x,n.z)]||(BK[bk(n.x,n.z)]=[])).push(k);});
    const link=(a,b)=>{if(a===b||nodes[a].nb.includes(b))return;nodes[a].nb.push(b);nodes[b].nb.push(a);};
    const lim=G*1.72;
    for(let a=0;a<nodes.length;a++){const A=nodes[a],gx=Math.floor(A.x/4),gz=Math.floor(A.z/4);
      for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=BK[(gx+i)+','+(gz+j)];if(!L)continue;for(const b of L){if(b<=a)continue;const B=nodes[b],d=Math.hypot(B.x-A.x,B.z-A.z);
        if(d>lim||d<.3&&Math.abs(B.y-A.y)<.4)continue;if(Math.abs(B.y-A.y)>Math.max(.45,d*1.05))continue;if(walk(A.x,A.z,A.y,B.x,B.z,B.y)&&walk(B.x,B.z,B.y,A.x,A.z,A.y))link(a,b);}}}
    // drop the islands: only what joins up with the bases (a spot the bots can't get to is a spot they'd stand stuck on)
    const keep=new Uint8Array(nodes.length);{const near=(B)=>{let best=-1,bd=1e9;nodes.forEach((n,k)=>{const d=Math.hypot(n.x-B.x,n.z-B.z)+Math.abs(n.y-B.y)*3;if(d<bd&&n.nb.length){bd=d;best=k;}});return best;};
      const q=[];for(const B of GS.BASES){const k=near(B);if(k>=0&&!keep[k]){keep[k]=1;q.push(k);}}while(q.length){const a=q.pop();for(const b of nodes[a].nb)if(!keep[b]){keep[b]=1;q.push(b);}}}
    const dropped=nodes.filter((n,k)=>!keep[k]);const remap=new Int32Array(nodes.length).fill(-1),kept=[];nodes.forEach((n,k)=>{if(keep[k]){remap[k]=kept.length;kept.push(n);}});
    for(const n of kept)n.nb=n.nb.map(b=>remap[b]).filter(b=>b>=0);
    nodes.length=0;nodes.push(...kept);
    for(const k in BK)delete BK[k];nodes.forEach((n,k)=>{(BK[bk(n.x,n.z)]||(BK[bk(n.x,n.z)]=[])).push(k);});
    for(const B of GS.BASES)B.node=nodes.reduce((best,n,k)=>Math.hypot(n.x-B.x,n.z-B.z)+Math.abs(n.y-B.y)*3<Math.hypot(nodes[best].x-B.x,nodes[best].z-B.z)+Math.abs(nodes[best].y-B.y)*3?k:best,0);
    // perches: high places the bots go and hold a while (roofs, the tops of things), away from the bases' domes
    const perches=[];const hmin=opt.perchY==null?3.5:opt.perchY;nodes.forEach((n,k)=>{if(n.y-CITY.ground(n.x,n.z)>hmin&&n.nb.length>=3&&!n.ramp&&(k*7)%5===0&&!GS.BASES.some(B=>Math.hypot(n.x-B.x,n.z-B.z)<B.shieldR+3))perches.push(k);});
    const N=nodes.length,NEXT=new Int16Array(N*N).fill(-1),q=new Int32Array(N);
    for(let t=0;t<N;t++){const base=t*N;NEXT[base+t]=t;let h=0,e=0;q[e++]=t;while(h<e){const a=q[h++];for(const b of nodes[a].nb)if(NEXT[base+b]<0){NEXT[base+b]=a;q[e++]=b;}}}
    const memo=new Map();
    function nearest(x,z,y){if(y==null)y=floorY3(x,z,CITY.ground(x,z)+.3);const mk=(Math.round(x)*1000+Math.round(z))*64+Math.round(y*2);const hit=memo.get(mk);if(hit!==undefined)return hit;
      const gx=Math.floor(x/4),gz=Math.floor(z/4),c=[];for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const L=BK[(gx+i)+','+(gz+j)];if(L)for(const k of L){const n=nodes[k],dy=Math.abs(n.y-y);c.push([Math.hypot(n.x-x,n.z-z)+(dy>1.2?40+dy*8:dy),k]);}}
      c.sort((p,q)=>p[0]-q[0]);let best=c.length?c[0][1]:-1;for(let k=0;k<Math.min(8,c.length);k++){const n=nodes[c[k][1]];if(walk(x,z,y,n.x,n.z,n.y,.25)){best=c[k][1];break;}}
      if(memo.size>60000)memo.clear();memo.set(mk,best);return best;}
    const clear3=(ax,az,ay,bx,bz,by,m)=>walk(ax,az,ay,bx,bz,by,m==null?.4:m);
    const clear=(ax,az,bx,bz,m)=>walk(ax,az,floorY3(ax,az,CITY.ground(ax,az)+.3),bx,bz,null,m==null?.5:m);
    const out={nodes,N,NEXT,nearest,clear,clear3,perches,dropped,walk,ms:performance.now()-t0};GS.nav=out;return out;}

  /* ---------- the look ---------- */
  const TEXL=new THREE.TextureLoader(),TSUF=coarse?'phone':'pc';
  function tex(n,srgb,rep){const t=TEXL.load('img/tex/'+n+'-'+TSUF+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=coarse?2:8;if(srgb)t.encoding=THREE.sRGBEncoding;if(rep)t.repeat.set(rep,rep);return t;}
  /* a reflection cube painted from a function of direction → [r,g,b] (0..1, linear-ish): what wet stone and metal show */
  function env(fn,N){N=N||64;const faces=[];
    for(let f=0;f<6;f++){const cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d'),im=x.createImageData(N,N);
      for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=(i+.5)/N*2-1,v=(j+.5)/N*2-1;let d;
        switch(f){case 0:d=[1,-v,-u];break;case 1:d=[-1,-v,u];break;case 2:d=[u,1,v];break;case 3:d=[u,-1,-v];break;case 4:d=[u,-v,1];break;default:d=[-u,-v,-1];}
        const l=Math.hypot(...d),c=fn(d[0]/l,d[1]/l,d[2]/l),o=(j*N+i)*4;for(let q=0;q<3;q++)im.data[o+q]=Math.round(255*Math.pow(clamp(c[q],0,1),1/2.2));im.data[o+3]=255;}
      x.putImageData(im,0,0);faces.push(cv);}
    const t=new THREE.CubeTexture(faces);t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;return t;}
  /* a neon sign on a canvas: words in a made-up Keeper script (and plain ones), a glowing tube outline; returned as a texture */
  const GLYPHS='ΛΞΠΣΦΨΩ⟁⟐⧫◊∆∇⊕⊗';
  function neonTex(text,col,o){o=o||{};const W=o.w||256,H=o.h||96,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
    g.fillStyle=o.bg||'rgba(6,8,14,1)';g.fillRect(0,0,W,H);const hex='#'+col.toString(16).padStart(6,'0');
    g.strokeStyle=hex;g.lineWidth=3;g.shadowColor=hex;g.shadowBlur=10;if(o.frame!==false){g.strokeRect(6,6,W-12,H-12);}
    g.fillStyle=hex;g.font=`700 ${o.size||Math.round(H*.48)}px ui-sans-serif,system-ui,Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';
    for(let k=0;k<2;k++)g.fillText(text,W/2,H/2+2);
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
  const glyphWord=(n,seed)=>{let s='';for(let i=0;i<n;i++)s+=GLYPHS[Math.floor(hash(seed,i*7)*GLYPHS.length)];return s;};
  // a merged-geometry bucket per material, built in one go at the end (KIT.flush)
  const BUCKETS=new Map();
  function mg(mat,o){let b=BUCKETS.get(mat);if(!b){b={M:new Merger(),mat,o:o||{}};BUCKETS.set(mat,b);}return b.M;}
  function flush(){for(const b of BUCKETS.values()){if(!b.M.p.length)continue;const m=new THREE.Mesh(b.M.build(),b.mat);m.castShadow=b.o.shadow!==false;m.receiveShadow=b.o.recv!==false;m.userData.dyn=1;if(b.o.order)m.renderOrder=b.o.order;scene.add(m);}BUCKETS.clear();}
  const lampMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  /* ---------- the weather: rain in a box round the camera, at a slant ---------- */
  function rain(o){o=o||{};const N=o.n||(coarse?900:2400),B=o.box||26,Hh=o.h||22,pos=new Float32Array(N*6),v=new Float32Array(N),sl=o.slant||[1.1,.5];
    for(let i=0;i<N;i++){const x=R(-B,B),y=R(-4,Hh),z=R(-B,B),l=R(.5,.9);pos.set([x,y,z,x+.06,y+l,z+.03],i*6);v[i]=R(16,22);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:C(o.col||0xa8bccb),transparent:true,opacity:o.op||.45,depthWrite:false,fog:true}));m.frustumCulled=false;m.userData.dyn=1;scene.add(m);
    const under=o.under||((x,z)=>floorY3(x,z,200));
    CITY.ticks.push(dt=>{const c=camera.position,a=g.attributes.position.array;
      for(let i=0;i<N;i++){const o6=i*6;let y=a[o6+1]-v[i]*dt,x=a[o6]+dt*sl[0],z=a[o6+2]+dt*sl[1];
        if(x-c.x>B)x-=2*B;else if(c.x-x>B)x+=2*B;if(z-c.z>B)z-=2*B;else if(c.z-z>B)z+=2*B;
        if(y<c.y-8||(i%3===0&&y<under(x,z))){y=c.y+R(8,Hh);}const l=a[o6+4]-a[o6+1];a[o6]=x;a[o6+1]=y;a[o6+2]=z;a[o6+3]=x+.06;a[o6+4]=y+l;a[o6+5]=z+.03;}
      g.attributes.position.needsUpdate=true;});
    return m;}
  /* ---------- sound: a looped noise bed (rain, surf, wind) and little one-shots (thunder, a horn, a groan), from a tiny synth ---------- */
  function sound(beds){let ctx=null;const api={ctx:null,one(f){if(ctx)try{f(ctx)}catch(_){}}};
    function start(){if(ctx)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(_){return;}api.ctx=ctx;
      for(const b of beds){const len=ctx.sampleRate*3,buf=ctx.createBuffer(2,len,ctx.sampleRate);for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);let b0=0,b1=0,b2=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0527;d[i]=(b0+b1+b2+w*.1848)*.11;}}
        const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;let node=src;for(const [type,f] of b.f||[]){const q=ctx.createBiquadFilter();q.type=type;q.frequency.value=f;node.connect(q);node=q;}
        const gn=ctx.createGain();gn.gain.value=0;node.connect(gn);gn.connect(ctx.destination);src.start();gn.gain.linearRampToValueAtTime(b.v||.12,ctx.currentTime+2);b.gain=gn;
        if(b.swell)CITY.ticks.push((dt,T)=>{if(ctx&&b.gain)b.gain.gain.value=(b.v||.12)*(1+b.swell*Math.sin(T*(b.rate||.4)));});}
      if(api.onStart)api.onStart(ctx);}
    const go=()=>{start();if(ctx&&ctx.state==='suspended')ctx.resume();};addEventListener('pointerdown',go);addEventListener('keydown',go);
    document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden)ctx.suspend();else ctx.resume();});
    api.thunder=(dist)=>api.one(c=>{const t=c.currentTime,len=c.sampleRate*4,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);let b=0;for(let i=0;i<len;i++){b=.985*b+(Math.random()*2-1)*.15;d[i]=b;}
      const s=c.createBufferSource();s.buffer=buf;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=lerp(320,140,dist);const g=c.createGain();
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lerp(1.1,.45,dist),t+.08+dist*.3);g.gain.exponentialRampToValueAtTime(.001,t+3.8);s.connect(lp);lp.connect(g);g.connect(c.destination);s.start(t);});
    api.tone=(f0,f1,dur,vol,type)=>api.one(c=>{const t=c.currentTime,o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type=type||'sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+dur);
      lp.type='lowpass';lp.frequency.value=420;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.6,dur*.2));g.gain.setValueAtTime(vol,t+dur*.7);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(lp);lp.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.1);});
    return api;}
  // a soft dust/mote field (js/origin/03-play.js keeps it round the camera through dust/dustG)
  return{frame,block,deck,ramp,wall,rail,post,nav,tex,env,neonTex,glyphWord,mg,flush,lampMat,rain,sound,PAIRS,sunFollow:null};})();
const DUST_N=coarse?60:140,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(.3,6),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.06,color:C(0xd8e4ff),transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}));dust.userData.dyn=1;scene.add(dust);

/* ---------- the frame: bloom, quality, the corner menu ---------- */
let composer=null,HQ=true,BLOOM=null;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,stencilBuffer:true});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  BLOOM=new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.6,.5,.8);composer.addPass(BLOOM);composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
try{const q=localStorage.getItem('elyra.quality');if(q)HQ=q!=='low';}catch(_){}
function setQuality(hq){HQ=hq;try{localStorage.setItem('elyra.quality',hq?'high':'low');}catch(_){}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,hq?(coarse?1.5:1.75):(coarse?1.1:1)));renderer.shadowMap.enabled=true;
  renderer.setSize(innerWidth,innerHeight);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);}$('quality').textContent=hq?'Quality: high':'Quality: low';}
$('quality').addEventListener('click',()=>{setQuality(!HQ);$('quality').blur();});
setQuality(HQ);
function renderFrame(){if(composer&&HQ){try{composer.render();return;}catch(e){composer=null;}}renderer.render(scene,camera);}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);if(composer)composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
{const mb=$('menuBtn'),vw=$('views');const set=o=>{vw.classList.toggle('open',o);mb.setAttribute('aria-expanded',o?'true':'false');};
 mb.addEventListener('click',e=>{e.stopPropagation();set(!vw.classList.contains('open'));mb.blur();});
 vw.addEventListener('click',e=>{if(e.target.closest('button,a'))setTimeout(()=>set(false),250);});
 renderer.domElement.addEventListener('pointerdown',()=>set(false));addEventListener('keydown',e=>{if(e.code==='Escape')set(false);});}
function flashScreen(a){const f=$('flash');f.style.transition='none';f.style.opacity=a;requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity=0;});}
// the map calls this once its GS is set: the hooks js/mp/03-match.js reads off GS
function kitContract(){GS.terrH=terrH;GS.playD=playD;GS.edgeD=edgeD;GS.inDome=(B,p)=>inDome(B,p);GS.s3Frac=s3Frac;GS.s3Top=s3Top;GS.floorY3=(x,z,y)=>floorY3(x,z,y);GS.TERR=GS.TERR||[];
  LZ={x:GS.BASES[0].x,z:GS.BASES[0].z,r:12};for(const B of GS.BASES){if(B.y==null)B.y=CITY.ground(B.x,B.z);}}
