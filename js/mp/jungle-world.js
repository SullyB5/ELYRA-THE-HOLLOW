/* Elyra · Multiplayer · Rainveil — the world (Oct 30, Bryce: "a new multiplayer map ... copy a jungle and make it a jungle vibe ...
   a small map so it's only gun fights, no flying or vehicles. Congested foliage, dark, raining, gloomy, and we need to add a flashlight
   so it's easier to see").

   A square of rainforest 144 m across (HALF 72), the night side of a storm: dense fog under the canopy, rain the whole time, lightning
   now and then. Blue's outpost in the west, red's in the east, each a ring of old stone under a small dome. Between them three trails
   (north, middle, south) through the trees, a creek running north to south down the middle, and the ruins of whoever was here before
   the Keepers: a stepped temple on a mound in the north-east, its twin shrine in the south-west, broken walls along the trails. The map
   is the same turned half way round (x,z → -x,-z), so neither side has the better ground.
   No craft, no hogs: the match (js/mp/03-match.js) reads GS.CFG. Your flashlight is on F (phone: LIGHT); the soldiers carry theirs.

   Same contract as js/mp/01-world.js for js/origin/03-play.js (playD, groundY, OBST, LZ, the road stand-ins ...), S3 walls for the
   ruins (walking, shots, sight), and a walking grid for the bots (GS.nav). Units are metres; north is -z. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(7171);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.5:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
window.ELYRA_RENDERER=renderer;
$('app').appendChild(renderer.domElement);
MODELS.preload(['chars/keeper-footsoldier','rifle']);
window.WARM_TEAMS=[];window.WARM_POOL=.01;
window.HERALD_LIFT=null;
window.PLAYER_KIND='keeper-footsoldier';window.PLAYER_OPTS={tint:0x9ab8ff};

const scene=new THREE.Scene();
const HAZE_HEX=0x111c19;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),.03);scene.background=scene.fog.color.clone();
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,700);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();
const lerp=(a,b,u)=>a+(b-a)*u;
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const mir=p=>[-p[0],-p[1]];   // the map's symmetry: half a turn about the middle

/* ---------- the plan ---------- */
const GS=(()=>{
  const HALF=72;
  const TEAMS={blue:{c:0x3f8cff,tint:0x9ab8ff,name:'BLUE'},red:{c:0xff4a3a,tint:0xffa496,name:'RED'},yellow:{c:0xffc83a,tint:0xffe39a,name:'YELLOW'},green:{c:0x3fe07a,tint:0xa8f0bc,name:'GREEN'}};
  // the outposts: small, so the spawns sit inside the dome (spawnR, spawnStep: js/mp/03-match.js lays its spawn points with them)
  const BASE_R=10;
  const BASES=[{team:'blue',x:-57,z:0},{team:'red',x:57,z:0}].map(B=>{B.fx=-Math.sign(B.x);B.fz=0;B.r=BASE_R;B.shieldR=12.5;B.spawnR=3;B.spawnStep=2.6;return B;});
  // (the match's settings for this map: js/mp/03-match.js)
  const CFG={id:'mpjungle',name:'RAINVEIL',sub:'Team deathmatch · night rain',air:false,vehicles:false,bots:8,score:50,time:10*60,see:52,range:60,hold:20,flashlights:true,beacon:false,domeK:.4,domeFog:true,
    brief:'TakeOver · team deathmatch. Rainforest at night, a storm on it, the ruins of whoever came before the Keepers under the trees. No craft, no hogs: just what you carry. Your flashlight is on F (phone: LIGHT), and theirs give them away.',
    objective:'Down the other side. Your outpost has guns and ammo; nothing crosses its dome.'};
  return{HALF,SEA:-99,TEAMS,BASES,BASE_R,CFG,NAME:CFG.name};})();
const LZ={x:GS.BASES[0].x,z:GS.BASES[0].z,r:12};

/* ---------- the ground: low rolling forest floor, the creek's bed down the middle, the temple and shrine mounds, the outposts levelled,
   and a bank rising past the edge where the trees close in ---------- */
function edgeD(x,z){return Math.max(Math.abs(x),Math.abs(z));}
function rawH(x,z){return(fbm(x*.034+3.1,z*.034-5.7)-.5)*4.4;}
function symH(x,z){return(rawH(x,z)+rawH(-x,-z))/2;}
function creekX(z){return 6*Math.sin(z*.045)+3*Math.sin(z*.11);}
const MOUNDS=[{x:20,z:-41,hs:6.5,lift:3}].flatMap(T=>[T,{x:-T.x,z:-T.z,hs:T.hs,lift:T.lift}]);
for(const T of MOUNDS)T.y=symH(T.x,T.z)+T.lift;
for(const B of GS.BASES)B.y=symH(B.x,B.z);
function terrH(x,z){let h=symH(x,z);
  const cd=Math.abs(x-creekX(z));h-=2.3*(1-sstep(2.4,7,cd));
  for(const T of MOUNDS){const d=Math.max(Math.abs(x-T.x),Math.abs(z-T.z));if(d<T.hs+5)h=lerp(h,T.y,1-sstep(T.hs,T.hs+4.5,d));}
  for(const B of GS.BASES){const d=Math.hypot(x-B.x,z-B.z);if(d<19)h=lerp(h,B.y,1-sstep(12,18,d));}
  const e=edgeD(x,z)-GS.HALF+4;if(e>0)h+=e*e*.05;
  return h;}
const CREEK_W=(z,x)=>Math.abs(x-creekX(z));

/* ---------- the trails: three ways across, worn mud through the undergrowth (and kept clear of the big trunks) ---------- */
const TRAILS=(()=>{const north=[[-46,-4],[-38,-22],[-24,-36],[-6,-44],[10,-46],[20,-41],[32,-34],[42,-18],[47,-3]],mid=[[-46,0],[-30,6],[-14,4],[0,0],[14,-4],[30,-6],[46,0]];
  return[north,mid,north.map(mir).reverse()];})();
function trailD(x,z){let d=1e9;for(const L of TRAILS)for(let i=0;i<L.length-1;i++)d=Math.min(d,segDist(x,z,L[i][0],L[i][1],L[i+1][0],L[i+1][1]));return d;}

/* ---------- the contract for js/origin/03-play.js ---------- */
const OBST=[],BARS=[];
/* S3: what stands up off the ground (here: the ruins' walls and the fallen logs), in a 6 m grid. Same shape as js/mp/01-world.js:
   walls {x,z,ux,uz,hw,hd,y0,y1,walk,los} block walking across your body's height and stop shots and sight lines */
const S3={walls:[],surfs:[],floors:[],G:{},C:6,st:0};
function s3Put(o,x0,z0,x1,z1){o.st=0;const Cc=S3.C;for(let i=Math.floor(x0/Cc);i<=Math.floor(x1/Cc);i++)for(let j=Math.floor(z0/Cc);j<=Math.floor(z1/Cc);j++){const k=i+','+j;(S3.G[k]||(S3.G[k]={w:[],s:[],f:[]}))[o.k3].push(o);}}
function s3Wall(ax,az,bx,bz,y0,y1,th,walk,los){const L=Math.hypot(bx-ax,bz-az);if(L<.05||y1-y0<.02)return null;const ux=(bx-ax)/L,uz=(bz-az)/L;
  const Rr={k3:'w',x:(ax+bx)/2,z:(az+bz)/2,ux,uz,hw:L/2,hd:th/2,y0,y1,walk:walk!==false,los:los!==false};
  const ex=Math.abs(ux)*Rr.hw+Math.abs(uz)*Rr.hd+1,ez=Math.abs(uz)*Rr.hw+Math.abs(ux)*Rr.hd+1;S3.walls.push(Rr);s3Put(Rr,Rr.x-ex,Rr.z-ez,Rr.x+ex,Rr.z+ez);return Rr;}
const s3Cell=(x,z)=>S3.G[Math.floor(x/S3.C)+','+Math.floor(z/S3.C)];
function rectLocal(Rr,x,z){const dx=x-Rr.x,dz=z-Rr.z;return[dx*Rr.ux+dz*Rr.uz,-dx*Rr.uz+dz*Rr.ux];}
function rectSD(Rr,x,z){const l=rectLocal(Rr,x,z),dx=Math.abs(l[0])-Rr.hw,dz=Math.abs(l[1])-Rr.hd;return Math.hypot(Math.max(dx,0),Math.max(dz,0))+Math.min(Math.max(dx,dz),0);}
function rectSeg(Rr,a,b){const la=rectLocal(Rr,a.x,a.z),lb=rectLocal(Rr,b.x,b.z);let t0=0,t1=1;
  for(const [p,q,h] of[[la[0],lb[0],Rr.hw],[la[1],lb[1],Rr.hd],[a.y,b.y,null]]){const d=q-p;let lo,hi;if(h===null){lo=Rr.y0;hi=Rr.y1;}else{lo=-h;hi=h;}
    if(Math.abs(d)<1e-9){if(p<lo||p>hi)return-1;continue;}let u=(lo-p)/d,v=(hi-p)/d;if(u>v){const w=u;u=v;v=w;}t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return-1;}
  return t0;}
function s3Frac(a,b){const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz),st=++S3.st;let best=1;
  const n=Math.max(1,Math.ceil(L/(S3.C/3)));
  for(let k=0;k<=n;k++){const t=k/n,c=s3Cell(a.x+dx*t,a.z+dz*t);if(!c)continue;
    for(const Rr of c.w){if(Rr.st===st||!Rr.los)continue;Rr.st=st;const f=rectSeg(Rr,a,b);if(f>=0&&f<best)best=f;}}
  return best;}
function s3Top(x,z){const c=s3Cell(x,z);let t=-1e9;if(!c)return t;for(const Rr of c.w)if(rectSD(Rr,x,z)<0)t=Math.max(t,Rr.y1);return t;}
// distance outside the walkable area at height y (negative inside): the edge of the map and the ruins' walls across your body
function playD3(x,z,y){const g=terrH(x,z),yb=Math.max(y==null?-1e9:y,g);let d=edgeD(x,z)-GS.HALF;
  const c=s3Cell(x,z);if(c)for(const Rr of c.w){if(!Rr.walk||Rr.y0>yb+1.75||Rr.y1<yb+.35)continue;d=Math.max(d,-rectSD(Rr,x,z));}
  return d;}
function playD(x,z){return playD3(x,z,null);}
function floorY3(x,z,y){return terrH(x,z);}
function groundY(x,z){return terrH(x,z);}
function meshY(x,z){return terrH(x,z);}
function camClamp(head){const c=camera.position,g=terrH(c.x,c.z)+.3;if(c.y<g)c.y=g;}
const ROAD_LEN=1,SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0,BARRIERS=[],BLOCKS=[];
const _rp=new THREE.Vector3();
function roadS(x,z){return 0;}function roadPt(s,out){return(out||_rp).set(LZ.x,0,LZ.z);}function roadN(s){return{x:1,z:0};}
function latOf(x,z){return 0;}function laneC(s){return 0;}function laneHalf(s){return 400;}function spineAt(s){return false;}function barrier(id){return null;}
const BLEN=0;function belowD(){return 1;}function belowS(){return 0;}function belowPt(s,o){return(o||new THREE.Vector3());}function belowFloor(){return 0;}
const HOLLOW_GLOW=0xff6a5a,HOST_GLOW=0xa45cff;
function inDome(B,p){return Math.hypot(p.x-B.x,(p.y||0)-B.y,p.z-B.z)<B.shieldR;}
function losBlock(a,b){for(const B of GS.BASES)if(inDome(B,a)!==inDome(B,b))return true;return s3Frac(a,b)<1;}
GS.terrH=terrH;GS.playD=playD;GS.edgeD=edgeD;GS.inDome=(B,p)=>inDome(B,p);GS.s3Frac=s3Frac;GS.s3Top=s3Top;GS.floorY3=(x,z,y)=>floorY3(x,z,y);GS.TERR=[];

/* ---------- materials: wet, dark, mossy ---------- */
const barkMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:0});
const leafMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:0,side:THREE.DoubleSide,flatShading:true});
const fernMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:0,side:THREE.DoubleSide});
const stoneMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:.02});
const glyphMat=new THREE.MeshStandardMaterial({color:C(0x0d1c1a),emissive:C(0x4fe8c8),emissiveIntensity:1.1,roughness:.4});
const K_BARK=C(0x3a3128),K_BARK2=C(0x4a4034),K_BARK3=C(0x2c2a22),K_MOSS=C(0x2f4a24),K_MOSS2=C(0x3d5a2a);
const K_LEAF=[0x1a3a1c,0x204824,0x153016,0x2a5226,0x1e4020].map(C);
const K_STONE=C(0x4f5650),K_STONE2=C(0x434a42),K_STONE3=C(0x5e655a);
const tmpC=new THREE.Color();
const mossy=(base,k)=>tmpC.copy(base).lerp(K_MOSS,Math.min(1,k*1.3+.1)).clone();

/* ---------- the ruins: the temple and shrine on their mounds, broken walls along the trails, fallen logs ---------- */
const RUIN=new Merger(),GLYPH=new Merger();
// a broken wall: stone blocks along the line, their tops ragged; one S3 wall at the lower height so shots skim the gaps a little
function ruinWall(ax,az,bx,bz,h,th){th=th||.9;const L=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/L,uz=(bz-az)/L,ry=Math.atan2(-uz,ux),n=Math.max(1,Math.round(L/1.3));
  let hmin=h;for(let k=0;k<n;k++){const t=(k+.5)/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,y=terrH(x,z),hh=h*(.72+hash(x*13|0,z*7|0)*.4);hmin=Math.min(hmin,hh);
    RUIN.add(boxUV(L/n+.05,hh+.6,th,1.5),M(x,y-.3+(hh+.6)/2,z,0,ry,R(-.03,.03)),mossy(hash(k,n)<.5?K_STONE:K_STONE2,R(.15,.55)));
    if(hash(k*3,n)<.35)RUIN.add(boxUV(R(.5,.9),R(.3,.5),R(.5,.8),1),M(x+R(-1,1)*th,y+.15,z+R(-1,1)*th,R(-.3,.3),R(0,3),R(-.3,.3)),mossy(K_STONE3,.4));}
  const y0=Math.min(terrH(ax,az),terrH(bx,bz),terrH((ax+bx)/2,(az+bz)/2))-.3;s3Wall(ax,az,bx,bz,y0,y0+.3+hmin,th,true,true);}
function pillar(x,z,h,r,broken){const y=terrH(x,z);RUIN.add(new THREE.CylinderGeometry(r*.88,r,h,10,2),M(x,y+h/2-.2,z),mossy(K_STONE3,.3));
  RUIN.add(boxUV(r*2.4,.5,r*2.4,1),M(x,y+.05,z),mossy(K_STONE2,.5));if(!broken)RUIN.add(boxUV(r*2.3,.45,r*2.3,1),M(x,y+h-.2,z),mossy(K_STONE,.3));
  OBST.push({x,z,r:r+.1,h});}
function log(ax,az,bx,bz,r){const L=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/L,uz=(bz-az)/L,ry=Math.atan2(-uz,ux),mx=(ax+bx)/2,mz=(az+bz)/2,y=Math.max(terrH(ax,az),terrH(bx,bz),terrH(mx,mz))*.5+Math.min(terrH(ax,az),terrH(bx,bz))*.5;
  const g=new THREE.CylinderGeometry(r,r*1.1,L,9,3).rotateZ(Math.PI/2);RUIN.add(g,M(mx,y+r*.7,mz,0,ry,0),mossy(K_BARK2,.45));
  // the root plate at the thick end
  RUIN.add(new THREE.CylinderGeometry(r*2.2,r*1.8,.5,9).rotateZ(Math.PI/2),M(bx+ux*.2,y+r*1.1,bz+uz*.2,0,ry,0),mossy(K_BARK3,.3));
  s3Wall(ax,az,bx,bz,y-.4,y+r*1.6,r*2,true,true);}
// the temple (north-east) and the shrine (south-west, its twin): a stepped platform on the mound, broken walls round its top with a way
// up each side, four pillars, and the old glyph-stone in the middle still glowing
function temple(T,s){const y=T.y,hs=T.hs;
  // (three tiers, the top one level with the mound's crown; the lower two step out down its slopes)
  for(let k=0;k<3;k++){const w=(hs+3.4-k*1.2)*2,top=y+.05-(2-k)*.6;RUIN.add(boxUV(w,2.4,w,2),M(T.x,top-1.2,T.z),mossy(k%2?K_STONE:K_STONE2,.35+k*.1));}
  const e=hs-.6;
  for(const [a,b] of[[[-e,-e],[-2.4,-e]],[[2.4,-e],[e,-e]],[[e,-e],[e,-2.6]],[[e,2.6],[e,e]],[[e,e],[1.2,e]],[[-e,e],[-e,1.8]],[[-e,-1.6],[-e,-e]]]){
    const A=[a[0]*s,a[1]*s],B=[b[0]*s,b[1]*s];ruinWall(T.x+A[0],T.z+A[1],T.x+B[0],T.z+B[1],R(2,3.1),.8);}
  for(const [px,pz] of[[-e,-e],[e,-e],[e,e],[-e,e]])pillar(T.x+px*s,T.z+pz*s,R(4.5,6.5),.55,hash(px*9|0,pz*7|0)<.5);
  // the glyph-stone: a black obelisk, cracked, the old script lit in its faces
  const ox=T.x,oz=T.z,oy=y;RUIN.add(boxUV(1.2,4.2,1.2,1),M(ox,oy+2,oz,0,.4*s,.05),C(0x1c2420));RUIN.add(boxUV(2.6,.6,2.6,1),M(ox,oy+.2,oz,0,.4*s,0),mossy(K_STONE2,.3));
  for(let k=0;k<4;k++){const a=.4*s+k*Math.PI/2;for(let j=0;j<5;j++)GLYPH.add(boxUV(.42-(j%2)*.16,.08,.04,1),M(ox+Math.sin(a)*.62,oy+.9+j*.55,oz+Math.cos(a)*.62,0,a,0),C(0xffffff));}
  OBST.push({x:ox,z:oz,r:1,h:4.2});
  const L=new THREE.PointLight(C(0x4fe8c8),1.1,14,2);L.position.set(ox,oy+2.4,oz);scene.add(L);}
for(const [i,T] of MOUNDS.entries())temple(T,i?-1:1);
// the broken walls along the trails and in the middle, and the fallen logs: one half laid out by hand, the other its mirror
{const half=[
  // the middle: a ruined gatehouse either side of the creek
  ['w',-9,-6,-9,-1,2.6],['w',-9,3,-7,7,2.2],['w',-4,10,1,11,1.4],
  ['w',-22,-9,-17,-12,2.4],['w',-26,12,-21,14,1.3],['w',-34,-6,-34,-1,1.2],
  // north trail
  ['w',-30,-30,-26,-33,2.5],['w',-14,-38,-9,-36,1.3],['w',-4,-52,2,-53,2.8],['w',4,-35,8,-33,1.2],
  // by the outposts' mouths
  ['w',-44,-13,-40,-15,1.2],['w',-44,13,-40,15,1.2],
  // logs
  ['l',-19,20,-12,24,.55],['l',-38,-26,-32,-21,.6],['l',-2,-24,5,-21,.65],['l',-50,-30,-46,-36,.55],['l',-28,32,-24,26,.5],
];
 for(const H of half)for(const s of[1,-1]){const [k,ax,az,bx,bz,v]=H;if(k==='w')ruinWall(ax*s,az*s,bx*s,bz*s,v);else log(ax*s,az*s,bx*s,bz*s,v);}
 // lone pillars and their fallen drums
 for(const [x,z,h] of[[-12,-17,4.2],[-27,23,3.4],[-40,-40,5],[-6,30,3]])for(const s of[1,-1])pillar(x*s,z*s,h,.5,true);}
// boulders, moss on their tops
const ROCKS=[];
{const geo=new THREE.DodecahedronGeometry(1,1),P=geo.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),n=.85+hash(i*7+3,i)*.3;P.setXYZ(i,x*n,y*n,z*n);}
 const pts=[[-15,-28,1.6],[-36,8,1.4],[-48,-22,1.8],[-24,-46,1.3],[-5,-14,1.1],[-31,40,1.5],[-12,46,1.2],[-42,30,1.6],[-20,4,1],[-55,-40,2]];
 for(const [x,z,r] of pts)for(const s of[1,-1]){const X=x*s,Z=z*s,y=terrH(X,Z);RUIN.add(geo,mat4(X,y+r*.35,Z,r*1.2,r*.8,r,0,hash(X|0,Z|0)*6,0),mossy(K_STONE2,.5));OBST.push({x:X,z:Z,r:r*1.05,h:r*1.1});ROCKS.push([X,Z,r]);}}

/* ---------- the outposts: a ring of old Keeper stone, sandbagged walls toward the trees, lamps in the side's colour ---------- */
for(const B of GS.BASES){const s=Math.sign(B.x),y=B.y;
  RUIN.add(new THREE.CylinderGeometry(B.r+.5,B.r+1.2,.6,32),M(B.x,y-.25,B.z),mossy(K_STONE2,.25));
  RUIN.add(new THREE.CylinderGeometry(B.r-3,B.r-2.6,.25,28),M(B.x,y+.05,B.z),mossy(K_STONE3,.15));
  // low walls in arcs on the jungle side, with gaps for the three trails
  for(const [a0,a1] of[[-1.25,-.62],[-.32,.32],[.62,1.25]]){
    const ax=B.x+Math.cos(a0)*-s*(B.r+3.5),az=B.z+Math.sin(a0)*(B.r+3.5),bx=B.x+Math.cos(a1)*-s*(B.r+3.5),bz=B.z+Math.sin(a1)*(B.r+3.5);
    // (sandbags: stacked rounded boxes)
    const L=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/L,uz=(bz-az)/L,ry=Math.atan2(-uz,ux);
    for(let k=0;k<Math.round(L/.9);k++)for(let j=0;j<2;j++){const t=(k+.5+j*.5)/Math.round(L/.9),x=ax+(bx-ax)*t,z=az+(bz-az)*t;RUIN.add(boxUV(.95,.42,.62,1),M(x,terrH(x,z)+.21+j*.42,z,0,ry+R(-.1,.1),0),C(j?0x5a5440:0x4e4a38));}
    s3Wall(ax,az,bx,bz,terrH(ax,az)-.3,terrH(ax,az)+.95,.7,true,true);}
  // two lamp posts, the side's light
  for(const dz of[-6,6]){const x=B.x-s*2,z=B.z+dz;RUIN.add(new THREE.CylinderGeometry(.08,.12,3.4,8),M(x,y+1.7,z),C(0x2a2e30));
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(GS.TEAMS[B.team].c).multiplyScalar(2.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.set(x,y+3.5,z);sp.scale.setScalar(1.8);sp.userData.dyn=1;scene.add(sp);
    OBST.push({x,z,r:.2,h:3.4});}
  const L=new THREE.PointLight(C(GS.TEAMS[B.team].c),1.6,26,1.8);L.position.set(B.x-s*2,y+3.6,B.z);scene.add(L);}

/* ---------- the trees: tall buttressed trunks up into a canopy you never see the top of, the understory palms, the lianas ---------- */
const TREES=[];
const OG={},OGC=6;function ogAdd(o){const k=Math.floor(o.x/OGC)+','+Math.floor(o.z/OGC);(OG[k]||(OG[k]=[])).push(o);}
function freeAt(x,z,pad){const gx=Math.floor(x/OGC),gz=Math.floor(z/OGC);for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const L=OG[(gx+i)+','+(gz+j)];if(L)for(const o of L)if(Math.hypot(o.x-x,o.z-z)<o.r+pad)return false;}return true;}
for(const o of OBST)ogAdd(o);
function treeOK(x,z,r,pad){if(edgeD(x,z)>GS.HALF-1.5)return false;for(const B of GS.BASES)if(Math.hypot(x-B.x,z-B.z)<B.shieldR+3)return false;
  for(const T of MOUNDS)if(Math.max(Math.abs(x-T.x),Math.abs(z-T.z))<T.hs+1.5)return false;
  if(CREEK_W(z,x)<3.2+r)return false;if(trailD(x,z)<2.4+r)return false;if(playD(x,z)>-r-.6)return false;return freeAt(x,z,r+pad);}
{// the big ones first, then the middle-sized; each is placed in the north half and mirrored
  const tries=[[34,.95,1.45,3.5],[70,.5,.9,2.2]];
  for(const [n,r0,r1,pad] of tries){let made=0;for(let k=0;k<n*30&&made<n;k++){const x=R(-GS.HALF+2,GS.HALF-2),z=R(-GS.HALF+2,0),r=R(r0,r1);
    if(!treeOK(x,z,r,pad)||!treeOK(-x,-z,r,pad))continue;const h=r>.9?R(24,32):R(15,24),lean=R(-.04,.04);
    for(const [X,Z] of[[x,z],[-x,-z]]){const t={x:X,z:Z,r,h,lean,big:r>.9};TREES.push(t);const o={x:X,z:Z,r:r+.15,h};OBST.push(o);ogAdd(o);}made++;}}}
// the wall of trees past the edge (outside the play area: no collision needed, they close the view)
const EDGE_TREES=[];{for(let a=-GS.HALF-8;a<=GS.HALF+8;a+=3.4)for(const s of[1,-1])for(const side of[0,1]){const d=GS.HALF+R(1.5,9);const x=side?a+R(-1,1):s*d,z=side?s*d:a+R(-1,1);EDGE_TREES.push({x,z,r:R(.6,1.4),h:R(18,30),lean:R(-.05,.05),big:true,edge:true});}}
const PALMS=[];{let made=0;for(let k=0;k<1600&&made<44;k++){const x=R(-GS.HALF+2,GS.HALF-2),z=R(-GS.HALF+2,0);if(!treeOK(x,z,.25,1.2)||!treeOK(-x,-z,.25,1.2))continue;
  for(const [X,Z] of[[x,z],[-x,-z]]){PALMS.push({x:X,z:Z,h:R(3.5,7)});const o={x:X,z:Z,r:.3,h:3};OBST.push(o);ogAdd(o);}made++;}}
const CH={};function chunk(x,z){const k=Math.floor(x/48)+','+Math.floor(z/48);return CH[k]||(CH[k]={bark:new Merger(),leaf:new Merger()});}
const _ta=new THREE.Vector3(),_tb=new THREE.Vector3(),_tq=new THREE.Quaternion(),_tz=new THREE.Vector3(0,1,0);
function branchSeg(mg,a,b,r0,r1,col){_ta.subVectors(b,a);const L=_ta.length();if(L<.05)return;_tq.setFromUnitVectors(_tz,_ta.normalize());
  const g=new THREE.CylinderGeometry(r1,r0,L,6,1);g.translate(0,L/2,0);const m=new THREE.Matrix4().compose(a,_tq,new THREE.Vector3(1,1,1));mg.add(g,m,col);}
function buildTree(t){const c=chunk(t.x,t.z),y=terrH(t.x,t.z)-.4,h=t.h,r=t.r,hs=hash(t.x*11|0,t.z*13|0);
  // the trunk: tapering, a little lean, moss up its lower half
  const tg=new THREE.CylinderGeometry(r*.55,r,h,t.edge?7:10,6,true),P=tg.attributes.position,cols=[];
  for(let i=0;i<P.count;i++){const vy=P.getY(i)/h+.5;P.setX(i,P.getX(i)+vy*vy*t.lean*h);P.setZ(i,P.getZ(i)+vy*vy*t.lean*.6*h);}
  c.bark.add(tg,M(t.x,y+h/2,t.z),hs<.5?mossy(K_BARK,.35):mossy(K_BARK2,.25));
  if(t.big&&!t.edge){// buttress roots: thin fins out round the foot
    const n=4+(hs*3|0);for(let k=0;k<n;k++){const a=k/n*Math.PI*2+hs*3,L=r*R(2.2,3.2),H=r*R(2.4,3.6);
      const fin=new THREE.BufferGeometry(),pa=[0,0,0,L,0,0,0,H,0, 0,0,.12,L,0,.12,0,H,.12];fin.setAttribute('position',new THREE.Float32BufferAttribute(pa,3));
      fin.setIndex([0,1,2,3,5,4,0,3,4,0,4,1,1,4,5,1,5,2,2,5,3,2,3,0]);const fg=fin.toNonIndexed();fg.computeVertexNormals();fg.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(fg.attributes.position.count*2).fill(0),2));
      c.bark.add(fg,M(t.x+Math.cos(a)*r*.6,y,t.z-Math.sin(a)*r*.6,0,a,0),mossy(K_BARK3,.5));}}
  // the crown: a spread of dark leaf masses on short limbs
  const top=V3w(t.x+t.lean*h,y+h,t.z+t.lean*.6*h),nL=t.edge?3:4+(hs*3|0);
  for(let k=0;k<nL;k++){const a=k/nL*Math.PI*2+hs*5,d=R(2,5.5)*(t.big?1:.7),e=V3w(top.x+Math.cos(a)*d,top.y+R(-1.5,2.5),top.z+Math.sin(a)*d);
    if(!t.edge)branchSeg(c.bark,V3w(top.x,top.y-2.5,top.z),e,r*.35,r*.15,K_BARK);
    const s=R(3,5.5)*(t.big?1:.75);c.leaf.add(new THREE.IcosahedronGeometry(1,0),mat4(e.x,e.y+.5,e.z,s,s*R(.35,.55),s,0,R(0,3),0),K_LEAF[(k+(hs*5|0))%K_LEAF.length]);}
  c.leaf.add(new THREE.IcosahedronGeometry(1,0),mat4(top.x,top.y+1,top.z,R(4,6),R(1.6,2.4),R(4,6),0,hs*3,0),K_LEAF[(hs*5|0)%K_LEAF.length]);}
const V3w=(x,y,z)=>new THREE.Vector3(x,y,z);
for(const t of TREES)buildTree(t);for(const t of EDGE_TREES)buildTree(t);
// the understory palms: a thin ringed stem and a fan of arching fronds
function frondGeo(L,W,droop){const segs=6,P=[],I=[];for(let i=0;i<=segs;i++){const t=i/segs,w=W*Math.sin(Math.PI*Math.min(1,t*1.1))*(1-t*.4),y=-droop*t*t*L,z=-t*L;P.push(-w,y+w*.15,z, 0,y,z, w,y+w*.15,z);}
  for(let i=0;i<segs;i++){const a=i*3;I.push(a,a+3,a+1,a+1,a+3,a+4,a+1,a+4,a+2,a+2,a+4,a+5);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);const ng=g.toNonIndexed();ng.computeVertexNormals();
  ng.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(ng.attributes.position.count*2).fill(0),2));return ng;}
for(const p of PALMS){const c=chunk(p.x,p.z),y=terrH(p.x,p.z),lean=R(-.12,.12),tx=p.x+lean*p.h,tz=p.z+R(-.12,.12)*p.h;
  branchSeg(c.bark,V3w(p.x,y-.2,p.z),V3w(tx,y+p.h,tz),.16,.11,K_BARK2);
  const n=7+(hash(p.x*5|0,p.z|0)*4|0);for(let k=0;k<n;k++){const a=k/n*Math.PI*2+R(-.2,.2),tilt=R(-.5,.2);c.leaf.add(frondGeo(R(2.4,3.4),R(.35,.5),R(.25,.5)),M(tx,y+p.h,tz,tilt,a,0),K_LEAF[k%K_LEAF.length]);}}
// lianas: hanging from the crowns in loose curves (no collision: you walk through them)
{const vine=new Merger(),VC=C(0x1f3418);for(const t of TREES){if(hash(t.x*3|0,t.z*5|0)>.55)continue;const y0=terrH(t.x,t.z)+t.h*.85,n=1+(hash(t.x|0,t.z*2|0)*2|0);
  for(let k=0;k<n;k++){const a=R(0,6.28),d=R(1.5,4),x=t.x+Math.cos(a)*d,z=t.z+Math.sin(a)*d,yb=terrH(x,z)+R(.8,4),sw=R(.4,1.2);let prev=V3w(x,y0,z);
    for(let j=1;j<=6;j++){const u=j/6,p=V3w(x+Math.sin(u*3)*sw*.4,lerp(y0,yb,u),z+Math.cos(u*2.4)*sw*.4);branchSeg(vine,prev,p,.05,.04,VC);prev=p;}}}
 const m=new THREE.Mesh(vine.build(),barkMat);m.userData.dyn=1;scene.add(m);}
for(const k in CH){const c=CH[k];const b=new THREE.Mesh(c.bark.build(),barkMat),l=new THREE.Mesh(c.leaf.build(),leafMat);b.castShadow=true;b.receiveShadow=true;l.castShadow=!coarse;l.receiveShadow=true;b.userData.dyn=l.userData.dyn=1;scene.add(b,l);}
{const r=new THREE.Mesh(RUIN.build(),stoneMat);r.castShadow=true;r.receiveShadow=true;r.userData.dyn=1;scene.add(r);
 const g=new THREE.Mesh(GLYPH.build(),glyphMat);g.userData.dyn=1;scene.add(g);}

/* ---------- the ground: dark wet earth and leaf litter, moss in the hollows, the trails worn to mud, the creek's bed ---------- */
{const S=GS.HALF*2+40,N=coarse?110:170,g=new THREE.PlaneGeometry(S,S,N,N).rotateX(-Math.PI/2),P=g.attributes.position,cols=[],c=new THREE.Color();
  const MUD=C(0x2a2219),LITTER=C(0x33291c),MOSS=C(0x26381c),WET=C(0x1a1a16),BED=C(0x232620);
  for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i);P.setY(i,terrH(x,z));const n=fbm(x*.12,z*.12),cd=CREEK_W(z,x),td=trailD(x,z);
    c.copy(LITTER).lerp(MOSS,sstep(.45,.65,n)).lerp(MUD,(1-sstep(1.2,3.2,td))*.85).lerp(BED,1-sstep(2,5.5,cd)).lerp(WET,(1-sstep(3,6,cd))*.35);
    for(const B of GS.BASES){const d=Math.hypot(x-B.x,z-B.z);c.lerp(MUD,(1-sstep(B.r+2,B.r+6,d))*.6);}
    cols.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.05}));m.receiveShadow=true;m.userData.dyn=1;scene.add(m);}
// the creek: a ribbon of dark water following its bed, ringed by the rain
const WATER=(()=>{const P=[],I=[],U=[];let n=0;for(let z=-GS.HALF-14;z<=GS.HALF+14;z+=1.5){const cx=creekX(z),y=symH(cx,z)-2.3+.62,e=edgeD(cx,z)-GS.HALF+4,yy=e>0?y+e*e*.05:y;
    for(const s of[-1,1]){P.push(cx+s*4.6,yy,z);U.push(s<0?0:1,z/4);}if(n){const a=(n-1)*2;I.push(a,a+2,a+1,a+1,a+2,a+3);}n++;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();
  const U2={uT:{value:0},fogColor:{value:scene.fog.color},fogDensity:{value:scene.fog.density},flash:{value:0}};
  const mat=new THREE.ShaderMaterial({uniforms:U2,transparent:true,depthWrite:false,fog:false,
    vertexShader:'varying vec2 vU;varying vec3 vW;varying float vD;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`varying vec2 vU;varying vec3 vW;varying float vD;uniform float uT,fogDensity,flash;uniform vec3 fogColor;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){vec2 p=vW.xz*1.3;vec2 c=floor(p);float r=0.0;for(int i=0;i<4;i++){vec2 o=vec2(float(i/2),float(i-(i/2)*2));vec2 q=c+o;float t=fract(uT*.9+h(q));float d=length(p-q-vec2(h(q+3.1),h(q+7.7)));r+=smoothstep(.06,0.0,abs(d-t*.55))*(1.0-t);}
        float edge=smoothstep(0.0,.18,vU.x)*smoothstep(1.0,.82,vU.x);vec3 col=vec3(.03,.05,.05)+r*vec3(.12,.15,.16)+flash*vec3(.25,.3,.35);
        float f=1.0-exp(-fogDensity*fogDensity*vD*vD);gl_FragColor=vec4(mix(col,fogColor,f),.82*edge);}`});
  const m=new THREE.Mesh(g,mat);m.renderOrder=1;m.userData.dyn=1;scene.add(m);return{U:U2};})();

/* ---------- the undergrowth (instanced, one draw each): ferns everywhere, bushes, broad leaves; thinner on the trails ---------- */
function scatter(n,minSep,ok){const out=[];for(let k=0;k<n*6&&out.length<n;k++){const x=R(-GS.HALF-6,GS.HALF+6),z=R(-GS.HALF-6,GS.HALF+6);if(!ok(x,z))continue;out.push([x,z]);}return out;}
const growOK=(x,z,trail)=>{for(const B of GS.BASES)if(Math.hypot(x-B.x,z-B.z)<B.r+1.5)return false;for(const T of MOUNDS)if(Math.max(Math.abs(x-T.x),Math.abs(z-T.z))<T.hs-.5&&rng()<.85)return false;
  if(CREEK_W(z,x)<2.6)return false;const td=trailD(x,z);if(td<trail&&rng()<.85)return false;const c=s3Cell(x,z);if(c)for(const Rr of c.w)if(rectSD(Rr,x,z)<.4)return false;
  for(const o of OBST)if(Math.abs(o.x-x)<o.r+.3&&Math.abs(o.z-z)<o.r+.3&&Math.hypot(o.x-x,o.z-z)<o.r+.2)return false;return true;};
function inst(geo,mat,list,fn,shadow){const m=new THREE.InstancedMesh(geo,mat,list.length),d=new THREE.Object3D(),col=new THREE.Color();
  list.forEach((p,i)=>{fn(p,d,col);d.updateMatrix();m.setMatrixAt(i,d.matrix);m.setColorAt(i,col);});m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
  m.receiveShadow=true;m.castShadow=!!shadow;m.userData.dyn=1;m.frustumCulled=false;scene.add(m);return m;}
{const fernG=(()=>{const mg=new Merger(),W=C(0xffffff);for(let k=0;k<7;k++){const a=k/7*Math.PI*2;mg.add(frondGeo(1.3,.28,.55),M(0,.05,0,-.35,a,0),W);}return mg.build();})();
 const greens=[0x2c5a26,0x3a6a2c,0x24481f,0x335f28,0x416f30].map(C);
 inst(fernG,fernMat,scatter(coarse?900:2200,0,(x,z)=>growOK(x,z,1.6)),(p,d,col)=>{d.position.set(p[0],terrH(p[0],p[1])-.05,p[1]);d.rotation.set(0,R(0,6.3),0);const s=R(.7,1.6);d.scale.set(s,s*R(.8,1.2),s);col.copy(greens[(rng()*greens.length)|0]).multiplyScalar(R(.7,1.1));});
 const bushG=(()=>{const g=new THREE.IcosahedronGeometry(1,1),P=g.attributes.position;for(let i=0;i<P.count;i++){const n=.75+hash(i*13,i*7)*.5;P.setXYZ(i,P.getX(i)*n,P.getY(i)*n,P.getZ(i)*n);}g.computeVertexNormals();g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(P.count*3).fill(1),3));return g;})();
 inst(bushG,leafMat,scatter(coarse?260:520,0,(x,z)=>growOK(x,z,2.6)),(p,d,col)=>{d.position.set(p[0],terrH(p[0],p[1])+.3,p[1]);d.rotation.set(0,R(0,6.3),0);d.scale.set(R(1,2),R(.7,1.3),R(1,2));col.copy(K_LEAF[(rng()*K_LEAF.length)|0]).multiplyScalar(R(.9,1.4));});
 // broad leaves (elephant ears) on curving stalks
 const earG=(()=>{const mg=new Merger(),W=C(0xffffff);for(let k=0;k<4;k++){const a=k/4*Math.PI*2+.4;const g=frondGeo(1.4,.65,.25);mg.add(g,M(Math.sin(a)*.2,.9+k*.12,Math.cos(a)*.2,-.6,a,0),W);mg.add(new THREE.CylinderGeometry(.03,.04,1,5),M(Math.sin(a)*.12,.45,Math.cos(a)*.12,Math.cos(a)*.2,0,-Math.sin(a)*.2),C(0x3a5a26));}return mg.build();})();
 inst(earG,fernMat,scatter(coarse?160:340,0,(x,z)=>growOK(x,z,2.2)),(p,d,col)=>{d.position.set(p[0],terrH(p[0],p[1])-.05,p[1]);d.rotation.set(0,R(0,6.3),0);const s=R(.8,1.5);d.scale.set(s,s,s);col.copy(greens[(rng()*greens.length)|0]).multiplyScalar(R(.8,1.2));});}

/* ---------- light: storm night. A low cold sky glow, the creek and the ruins glinting, lightning now and then; your flashlight ---------- */
const hemi=new THREE.HemisphereLight(C(0x5a7a8a),C(0x1a1c12),.62);scene.add(hemi);
const moonDir=new THREE.Vector3(.35,.8,-.45).normalize();
const keyLight=new THREE.DirectionalLight(C(0x9ab4cc),.32);scene.add(keyLight,keyLight.target);
function followSun(p){keyLight.position.copy(p).addScaledVector(moonDir,200);keyLight.target.position.copy(p);}
function skyFollow(){}
let lookName='night';function setLook(){}
const helmLamp=new THREE.PointLight(C(0xffffff),0,10,1.5);scene.add(helmLamp);
/* the flashlight (Oct 30, Bryce: "we need to add a flashlight so it's easier to see"): a spot from just under your eye along your aim,
   on from the start; F toggles it (phone: LIGHT). It casts shadows on PC, so the trunks throw long shapes across the undergrowth */
const LIGHT=(()=>{const sp=new THREE.SpotLight(C(0xfff1d8),3.2,52,.5,.5,1.4);sp.castShadow=!coarse;if(sp.castShadow){sp.shadow.mapSize.set(1024,1024);sp.shadow.camera.near=.4;sp.shadow.camera.far=52;sp.shadow.bias=-.0008;}
  scene.add(sp,sp.target);const fill=new THREE.PointLight(C(0xfff1d8),.45,7,2);scene.add(fill);
  let on=true;const _f=new THREE.Vector3();
  function set(v){on=v;const b=$('light');if(b){b.classList.toggle('lit',on);b.setAttribute('aria-pressed',String(on));}if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();}
  addEventListener('keydown',e=>{if(e.code==='KeyF'&&!e.repeat&&!(typeof PG!=='undefined'&&PG.paused)){set(!on);if(typeof banner==='function')banner(on?'Flashlight on':'Flashlight off');}});
  {const b=$('light');if(b){b.hidden=!coarse;b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();set(!on);});}}
  function update(){const live=on&&typeof P!=='undefined'&&P.alive&&typeof phase!=='undefined'&&(phase==='play'||phase==='end');sp.visible=fill.visible=live;if(!live)return;
    camera.getWorldDirection(_f);sp.position.copy(camera.position).addScaledVector(_f,.3);sp.position.y-=.18;sp.target.position.copy(camera.position).addScaledVector(_f,20);fill.position.copy(camera.position).addScaledVector(_f,1.2);}
  return{update,set,get on(){return on;}};})();
// lightning: a double flash, the sky and the creek lit for a moment, thunder a second or two later
const STORM={next:R(6,12),t:-1,seq:[]};
function stormStep(dt){STORM.next-=dt;if(STORM.next<=0){STORM.next=R(10,24);STORM.t=0;STORM.seq=[[0,.08,1],[.14,.24,.6],[.32,.5,.85]];if(rng()<.4)STORM.seq.length=2;
    STORM.dist=R(.3,1);setTimeout(()=>RAINSND.thunder(STORM.dist),(400+STORM.dist*2400));}
  let f=0;if(STORM.t>=0){STORM.t+=dt;for(const [a,b,k] of STORM.seq)if(STORM.t>a&&STORM.t<b)f=Math.max(f,k*(1-(STORM.t-a)/(b-a)*.5));if(STORM.t>.6)STORM.t=-1;}
  f*=lerp(1,.45,STORM.dist||0);hemi.intensity=.62+f*3.2;keyLight.intensity=.32+f*2.4;scene.background.copy(scene.fog.color).lerp(tmpC.set(0x8a9cae).convertSRGBToLinear(),f*.5);WATER.U.flash.value=f;}

/* ---------- rain: streaks in a box round the camera, falling at a slant; the hiss and the thunder from a little synthesiser ---------- */
const RAIN=(()=>{const N=coarse?900:2400,B=26,H=22,pos=new Float32Array(N*6),v=new Float32Array(N);
  for(let i=0;i<N;i++){const x=R(-B,B),y=R(-4,H),z=R(-B,B),l=R(.5,.9);pos.set([x,y,z,x+.06,y+l,z+.03],i*6);v[i]=R(16,22);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:C(0xa8bccb),transparent:true,opacity:.48,depthWrite:false,fog:true}));m.frustumCulled=false;m.userData.dyn=1;scene.add(m);
  let cx=0,cz=0;
  function update(dt){const c=camera.position,a=g.attributes.position.array;const dx=c.x-cx,dz=c.z-cz;cx=c.x;cz=c.z;
    for(let i=0;i<N;i++){const o=i*6;let y=a[o+1]-v[i]*dt,x=a[o]+dt*1.1,z=a[o+2]+dt*.5;
      // keep each drop in the box round the camera (wrapping), and back up top once it's under the ground
      if(x-c.x>B)x-=2*B;else if(c.x-x>B)x+=2*B;if(z-c.z>B)z-=2*B;else if(c.z-z>B)z+=2*B;
      if(y<terrH(x,z)||y<c.y-8){y=c.y+R(8,H);}const l=a[o+4]-a[o+1];a[o]=x;a[o+1]=y;a[o+2]=z;a[o+3]=x+.06;a[o+4]=y+l;a[o+5]=z+.03;}
    g.attributes.position.needsUpdate=true;}
  return{update};})();
const RAINSND=(()=>{let ctx=null,gain=null;
  function start(){if(ctx)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(_){return;}
    const len=ctx.sampleRate*3,buf=ctx.createBuffer(2,len,ctx.sampleRate);for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);let b0=0,b1=0,b2=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0527;d[i]=(b0+b1+b2+w*.1848)*.11;}}
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=380;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;
    gain=ctx.createGain();gain.gain.value=0;src.connect(hp);hp.connect(lp);lp.connect(gain);gain.connect(ctx.destination);src.start();gain.gain.linearRampToValueAtTime(.16,ctx.currentTime+2);}
  function thunder(dist){if(!ctx)return;const t=ctx.currentTime,len=ctx.sampleRate*4,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);let b=0;for(let i=0;i<len;i++){b=.985*b+(Math.random()*2-1)*.15;d[i]=b;}
    const s=ctx.createBufferSource();s.buffer=buf;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=lerp(320,140,dist);const g=ctx.createGain();
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lerp(1.1,.45,dist),t+.08+dist*.3);g.gain.exponentialRampToValueAtTime(.001,t+3.8);s.connect(lp);lp.connect(g);g.connect(ctx.destination);s.start(t);}
  const go=()=>{start();if(ctx&&ctx.state==='suspended')ctx.resume();};addEventListener('pointerdown',go);addEventListener('keydown',go);
  document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden)ctx.suspend();else ctx.resume();});
  return{thunder};})();
function updateLights(dt,T,pos){WATER.U.uT.value=T;stormStep(dt);RAIN.update(dt);LIGHT.update();}
// fireflies: a few pale green motes drifting low among the ferns (js/origin/03-play.js updateDust keeps them round the camera)
const DUST_N=coarse?40:90,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(.4,3.5),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.13,color:C(0xc8ff8a).multiplyScalar(2),transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));dust.userData.dyn=1;scene.add(dust);

/* ---------- the bots' map: a walking grid every NS m wherever there's room to stand, each spot joined to its eight neighbours when the
   way between is clear of walls, logs and trunks. NEXT[t*N+a] is the next node from a on the way to t (same shape as js/mp/01-world.js) ---------- */
const NAV=(()=>{const NS=4.5,nodes=[],t0=performance.now();
  const obstAt=(x,z,m)=>{const gx=Math.floor(x/OGC),gz=Math.floor(z/OGC);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=OG[(gx+i)+','+(gz+j)];if(L)for(const o of L)if(Math.hypot(o.x-x,o.z-z)<o.r+m)return true;}return false;};
  const clear=(ax,az,bx,bz,m)=>{m=m==null?.6:m;const L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(L/1.2));for(let k=0;k<=n;k++){const t=k/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;if(playD(x,z)>-m||obstAt(x,z,m*.8))return false;}return true;};
  const clear3=(ax,az,ay,bx,bz,by,m)=>clear(ax,az,bx,bz,m);
  const n0=Math.ceil(GS.HALF/NS),id={};
  for(let i=-n0;i<=n0;i++)for(let j=-n0;j<=n0;j++){const x=i*NS,z=j*NS;if(edgeD(x,z)>GS.HALF-2||playD(x,z)>-1||obstAt(x,z,.9))continue;id[i+','+j]=nodes.length;nodes.push({x,z,i,j,y:terrH(x,z),h:0,nb:[]});}
  const link=(a,b)=>{if(a===b||nodes[a].nb.includes(b))return;nodes[a].nb.push(b);nodes[b].nb.push(a);};
  for(let a=0;a<nodes.length;a++){const n=nodes[a];for(const [di,dj] of[[1,0],[0,1],[1,1],[1,-1]]){const b=id[(n.i+di)+','+(n.j+dj)];if(b!=null&&clear(n.x,n.z,nodes[b].x,nodes[b].z,.55))link(a,b);}}
  for(const B of GS.BASES)B.node=nodes.reduce((best,n,k)=>Math.hypot(n.x-B.x,n.z-B.z)<Math.hypot(nodes[best].x-B.x,nodes[best].z-B.z)?k:best,0);
  const N=nodes.length,NEXT=new Int16Array(N*N).fill(-1),q=new Int32Array(N);
  for(let t=0;t<N;t++){const base=t*N;NEXT[base+t]=t;let h=0,e=0;q[e++]=t;while(h<e){const a=q[h++];for(const b of nodes[a].nb)if(NEXT[base+b]<0){NEXT[base+b]=a;q[e++]=b;}}}
  const memo=new Map();
  function nearest(x,z){const mk=Math.round(x/1.5)*10000+Math.round(z/1.5);const hit=memo.get(mk);if(hit!==undefined)return hit;
    const gi=Math.round(x/NS),gj=Math.round(z/NS),c=[];for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){const k=id[(gi+i)+','+(gj+j)];if(k!=null)c.push([Math.hypot(nodes[k].x-x,nodes[k].z-z),k]);}
    c.sort((p,q)=>p[0]-q[0]);let best=c.length?c[0][1]:-1;for(let k=0;k<Math.min(6,c.length);k++){const n=nodes[c[k][1]];if(clear(x,z,n.x,n.z,.35)){best=c[k][1];break;}}
    if(memo.size>40000)memo.clear();memo.set(mk,best);return best;}
  return{nodes,N,NEXT,nearest,clear,clear3,perches:[],ms:performance.now()-t0};})();
GS.nav=NAV;
// where the bots go looking when they've nothing in sight: the ruins, the creek's crossings, the trails' bends (js/mp/03-match.js HIGH)
GS.HILLS=[...MOUNDS.map(T=>({x:T.x,z:T.z})),{x:0,z:0},{x:creekX(-22),z:-22},{x:creekX(22),z:22},...TRAILS.flatMap(L=>L.filter((p,i)=>i%2===1).map(p=>({x:p[0],z:p[1]})))];
// the opening: low under the trees along the middle trail, the rain in the lamps
GS.INTRO=[[[-30,6,26],[-8,2,4]],[[-14,4,8],[6,2,-6]],[[12,7,-30],[20,4,-41]],[[30,4,-12],[56,3,0]]];

let composer=null,HQ=true;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,stencilBuffer:true});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.55,.5,.8));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
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
