/* Elyra · Multiplayer · Gilded Shore — the world (Oct 30, Bryce: "an island settlement with the white city elements ... a square,
   about 1.5 the size of the white city ... water past the city all along the horizon, islands or continents super small in the
   distance, during the day, elevations (only 2 stories for now, but hillish too), and a city with an arrow structure: instead of
   straight blocks, triangles, more arrowheaded. A beachside city, water all around, daytime, a warm vibe").

   The island: a square, the playable ground ±750 m (the White City is 1,040 m across; this is ~1.5× that), a sand beach all round
   and the sea past it to the horizon. Streets run three ways, 60° apart, on a triangular lattice (S = 64 m between crossings,
   14 m wide), so every block is a triangle: a white-stone building (one or two storeys) cut as a plain triangle or an arrowhead
   (a triangle with a notch out of one side, pointing the other way), a raised terrace (a triangle whose floor ramps up to 6.5 m at
   one corner, walled on its two high sides), a small plaza, or a park on one of four low hills. The White City's stone and its gold
   (woven bands, lattices; never one lone cross) dress everything. The two teams' bases stand in opposite corners (js/mp/03-match.js
   furnishes them).

   Same contract as js/pathfinder3/01-world.js for js/origin/03-play.js (playD, groundY, the road stand-ins, OBST, LZ ...), and a
   navigation graph on the lattice for the bots (GS.nav). Units are metres; north is -z. Global `GS` holds the map's own data. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(3030);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.6:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.86;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
window.ELYRA_RENDERER=renderer;
$('app').appendChild(renderer.domElement);
MODELS.preload(['chars/keeper-footsoldier','rifle','wraith','raven','interceptor']);MODELS.preloadScenes&&MODELS.preloadScenes(['warthog']);
window.WARM_TEAMS=[];window.WARM_POOL=.01;   // (no Host or Herald soldiers on this map: js/origin/03-play.js warms one of each side otherwise)
window.HERALD_LIFT=null;
window.PLAYER_KIND='keeper-footsoldier';window.PLAYER_OPTS={tint:0x9ab8ff};   // you: a Keeper of the blue team (GS.TEAMS.blue.tint)

const scene=new THREE.Scene();
const HAZE_HEX=0xcfe0ea;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),.00012);scene.background=scene.fog.color;
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,16000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();
const lerp=(a,b,u)=>a+(b-a)*u;
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}

/* ---------- the plan ----------
   Oct 30 (Bryce, after playing it: "make the playable area half or maybe a third of the size"): the island is 640 m across now
   (HALF 320; it was 1,500), a little over half the White City's width. Every distance on the map is set from HALF. */
const GS=(()=>{
  const HALF=320,S=56,SH=S*Math.sqrt(3)/2,SEA=0,STREET=6;
  // the four hills (parks on their crowns) and the two bases (blue south-west, red north-east)
  const HILLS=[{x:-118,z:-112,r:70,h:10},{x:128,z:120,r:74,h:11},{x:-182,z:28,r:46,h:6.5},{x:40,z:-184,r:46,h:7}];
  const BASE_R=62,BASE_Y=1.6,BD=HALF-82;
  const BASES=[{team:'blue',x:-BD,z:BD},{team:'red',x:BD,z:-BD}].map(B=>{const L=Math.hypot(B.x,B.z);B.fx=-B.x/L;B.fz=-B.z/L;B.r=BASE_R;B.y=BASE_Y;B.shieldR=BASE_R+5;return B;});
  /* the teams' colours (Oct 30, Bryce: "Keeper versus Keeper, with colours: red, blue, yellow, green"). Two play now; yellow and green
     are ready for more teams. c: lights, marks and domes; tint: multiplies the Keepers' white armour and the craft */
  const TEAMS={blue:{c:0x3f8cff,tint:0x9ab8ff,name:'BLUE'},red:{c:0xff4a3a,tint:0xffa496,name:'RED'},yellow:{c:0xffc83a,tint:0xffe39a,name:'YELLOW'},green:{c:0x3fe07a,tint:0xa8f0bc,name:'GREEN'}};
  return{S,SH,HALF,SEA,STREET,HILLS,BASES,BASE_R,BASE_Y,TEAMS};})();
const ROOF_COLS=[0xd9cfbc,0xc9bca6,0xb9c2c8,0xd8a888,0xe6dcc8,0xc4b49a];

/* ---------- the ground's height: low rolling ground, four hills, the bases levelled, the beach falling into the sea ---------- */
function edgeD(x,z){return Math.max(Math.abs(x),Math.abs(z));}
function terrH(x,z){
  let h=1.6+2.2*(fbm(x*.0032+3,z*.0032-5)-.5)*2;
  for(const H of GS.HILLS){const d=Math.hypot(x-H.x,z-H.z);if(d<H.r)h+=H.h*(.5+.5*Math.cos(Math.PI*d/H.r));}
  for(const B of GS.BASES){const d=Math.hypot(x-B.x,z-B.z);if(d<B.r+40)h=lerp(B.y,h,sstep(B.r+6,B.r+40,d));}
  {const d=Math.hypot(x,z);if(d<64)h=lerp(1.8,h,sstep(42,64,d));}   // the spire's plaza, level
  const e=edgeD(x,z);return lerp(h,-5,sstep(GS.HALF-38,GS.HALF+95,e));}

/* ---------- the lattice, and what stands on it ----------
   Oct 30 (Bryce: "more designs to the buildings instead of copy and paste in every direction, a lot of difference"). The city is
   in quarters now, each with its own mix: the CIVIC heart round the spire (domes, colonnades, lantern towers, fountains), the
   GARDENS to the north-west (terraces, roof gardens, pergolas, sloped wedges), the MARKET to the south-east (stalls under coloured
   awnings, open pavilions, arcades), the SHORE ring (beach bars, low pavilions with sails, wedges facing the sea), and the WARDS
   by the bases (stepped blocks, halls, towers, team banners on the walls). Two boulevards cross the city through the spire, a row
   of triangles left open with palms and lamps, so the streets aren't all one width. Now and then a whole cell (two triangles)
   is one long hall. Each building picks its own stone, trim (gold, sea-teal tile, terracotta, copper or blue), window style
   (bands, tall slits, round ports, fins, or blank walls with the gold lattice), glass tint and roof (plain, garden, sails,
   a pyramid cap, tanks). Everything is picked by a hash of where it stands, so the city is the same every time. */
const LP=(i,j)=>[i*GS.S+j*GS.S/2,j*GS.SH];
// a convex polygon with its edges as outward half-planes: sd < 0 inside
function mkPoly(P){let cx=0,cz=0;for(const p of P){cx+=p[0];cz+=p[1];}cx/=P.length;cz/=P.length;const E=[];
  for(let k=0;k<P.length;k++){const p=P[k],q=P[(k+1)%P.length];let nx=q[1]-p[1],nz=-(q[0]-p[0]);const L=Math.hypot(nx,nz);nx/=L;nz/=L;let off=nx*p[0]+nz*p[1];if(nx*cx+nz*cz-off>0){nx=-nx;nz=-nz;off=-off;}E.push([nx,nz,off]);}
  return{P,E,cx,cz};}
const mkTri=(a,b,c)=>mkPoly([a,b,c]);
function triSD(T,x,z){let d=-1e9;for(const e of T.E){const v=e[0]*x+e[1]*z-e[2];if(v>d)d=v;}return d;}
const BUILD=[],TERR=[],PLAZA=[],PARK=[],OPENB=[],BGRID={},GC=48;
function gridAdd(o,P){const xs=P.map(p=>p[0]),zs=P.map(p=>p[1]),x0=Math.min(...xs)-2,x1=Math.max(...xs)+2,z0=Math.min(...zs)-2,z1=Math.max(...zs)+2;
  for(let i=Math.floor(x0/GC);i<=Math.floor(x1/GC);i++)for(let j=Math.floor(z0/GC);j<=Math.floor(z1/GC);j++)(BGRID[i+','+j]||(BGRID[i+','+j]=[])).push(o);}
function cityQuarter(x,z){const r=Math.hypot(x,z),e=edgeD(x,z);
  if(r<128)return'civic';if(e>GS.HALF-92)return'shore';if(x<0&&z<0)return'garden';if(x>0&&z>0)return'market';return'ward';}
const QMIX={
  civic:[['dome',26],['colonnade',22],['stepped',16],['lantern',14],['hall',0],['fountain',10],['plaza',8],['wedge',4]],
  garden:[['terrace',22],['slab',18],['pergola',14],['wedge',16],['stepped',12],['dome',8],['lantern',4],['fountain',6]],
  market:[['market',26],['pavilion',14],['colonnade',14],['stepped',16],['slab',10],['wedge',10],['fountain',4],['plaza',6]],
  shore:[['pavilion',24],['wedge',20],['slab',16],['stepped',14],['terrace',10],['market',8],['plaza',8]],
  ward:[['stepped',26],['wedge',18],['terrace',14],['lantern',10],['colonnade',8],['slab',12],['dome',6],['plaza',6]]};
function pickKind(q,h){const L=QMIX[q];let tot=0;for(const [,w] of L)tot+=w;let r=h*tot;for(const [k,w] of L){if(r<w)return k;r-=w;}return L[0][0];}
const STONES=[0xf4efe4,0xeae1cd,0xf2e2c8,0xe6eaeb,0xf2e4d9,0xece3cf,0xf7f4ee];
const TRIMS={gold:null,teal:0x2b8f8c,terra:0xbe6440,copper:0xb57a44,blue:0x3a6cc0};
const TRIM_BY={civic:['gold','gold','gold','teal','copper'],garden:['gold','copper','teal','terra'],market:['terra','teal','gold','blue','copper'],shore:['teal','blue','gold','terra'],ward:['gold','gold','copper','blue','teal']};
const WIN_STYLES=['band','band','slit','port','fin','glyph'];
const ROOFS={civic:['plain','pyramid','garden','plain'],garden:['garden','garden','sail','plain'],market:['sail','sail','tanks','plain'],shore:['sail','sail','plain','garden'],ward:['plain','tanks','pyramid','plain','sail']};
const GLASS=[[1,1,1],[1.12,1.02,.84],[.86,1,1.08],[.72,.8,.88],[1.05,.96,.92]];
// boulevards: one row of triangles each side of two lattice lines through the spire is left open
function isBlvd(x,z){const r=Math.hypot(x,z);if(r<60)return false;return(z>0&&z<GS.SH*.5)||((.866*x+.5*z)>0&&(.866*x+.5*z)<GS.SH*.5);}
const hk=(x,z,k)=>hash((x*7.13|0)+k*131,(z*5.71|0)-k*17);
function newBuilding(kind,I,q,seed,N,poly){const o={kind,I,N:N||null,poly:poly||I.P,q,seed,cx:I.cx,cz:I.cz};
  o.col=C(STONES[Math.floor(hk(I.cx,I.cz,1)*STONES.length)]);o.roofC=C(ROOF_COLS[Math.floor(hk(I.cx,I.cz,6)*ROOF_COLS.length)]);
  const tl=TRIM_BY[q];o.trim=tl[Math.floor(hk(I.cx,I.cz,2)*tl.length)];
  o.style=WIN_STYLES[Math.floor(hk(I.cx,I.cz,3)*WIN_STYLES.length)];
  const rl=ROOFS[q];o.roof=rl[Math.floor(hk(I.cx,I.cz,4)*rl.length)];
  const g=GLASS[Math.floor(hk(I.cx,I.cz,5)*GLASS.length)];o.glassC=new THREE.Color(g[0],g[1],g[2]);
  o.y0=Math.min(...I.P.map(p=>terrH(p[0],p[1])),terrH(I.cx,I.cz))-.2;
  o.sd=(x,z)=>{let d=triSD(o.I,x,z);if(o.N)d=Math.max(d,-triSD(o.N,x,z));return d;};
  o.topAt=()=>o.top;
  return o;}
// an arrowhead: a notch cut from one side, the point toward the far corner
function arrowOf(I,side,dep){const A=I.P[side],B=I.P[(side+1)%3],Cc=I.P[(side+2)%3],mx=(B[0]+Cc[0])/2,mz=(B[1]+Cc[1])/2;
  const Np=[mx+(A[0]-mx)*dep,mz+(A[1]-mz)*dep];return{N:mkTri(B,Cc,Np),poly:[A,B,Np,Cc],core:[(Np[0]+A[0])/2,(Np[1]+A[1])/2]};}
function addBlock(kind,T,I,q,h0,seed){
  if(kind==='plaza'){PLAZA.push({T,I});return;}
  if(['fountain','market','pavilion','pergola'].includes(kind)){OPENB.push({kind,T,I,q,seed});return;}
  if(kind==='terrace'){const hi=Math.floor(hash(seed,7)*3)%3,A=I.P[hi],opp=I.E[(hi+1)%3],hA=-(opp[0]*A[0]+opp[1]*A[1]-opp[2]);
    const o={I,hi,opp,hA,H:5.5+hash(seed,9)*2};TERR.push(o);gridAdd(o,I.P);return;}
  let o;
  if(kind==='dome'){o=newBuilding(kind,I,q,seed);const rin=Math.min(...I.E.map(e=>-(e[0]*I.cx+e[1]*I.cz-e[2])));o.R=rin*.9;o.drum=5+hash(seed,3)*1.6;
    o.shape=['hemi','saucer','tall','onion'][Math.floor(hash(seed,5)*4)];o.domeH=o.R*{hemi:1,saucer:.55,tall:1.35,onion:1.55}[o.shape];o.top=o.y0+o.drum+o.domeH;
    o.sd=(x,z)=>Math.hypot(x-o.cx,z-o.cz)-(o.R+.25);o.topAt=(x,z)=>{const d=Math.hypot(x-o.cx,z-o.cz)/o.R;return o.y0+o.drum+o.domeH*Math.sqrt(Math.max(0,1-d*d));};}
  else if(kind==='colonnade'){o=newBuilding(kind,I,q,seed);o.top=o.y0+6.6+hash(seed,3)*1.2;const k=.56;o.core=mkPoly(I.P.map(p=>[I.cx+(p[0]-I.cx)*k,I.cz+(p[1]-I.cz)*k]));
    o.sd=(x,z)=>triSD(o.core,x,z);}
  else if(kind==='wedge'){o=newBuilding(kind,I,q,seed);const k=Math.floor(hash(seed,3)*3)%3,e=I.E[k],opp=I.P[(k+2)%3];o.hiE=k;o.alt=-(e[0]*opp[0]+e[1]*opp[1]-e[2]);
    o.hHi=10.6+hash(seed,4)*2.2;o.hLo=4.6+hash(seed,6)*1.2;o.top=o.y0+o.hHi;
    o.topAt=(x,z)=>{const inD=-(e[0]*x+e[1]*z-e[2]);return o.y0+o.hHi-(o.hHi-o.hLo)*clamp(inD/o.alt,0,1);};}
  else{   // stepped, slab, lantern, hall: one storey or two, plain or an arrowhead
    let N=null,poly=I.P,core=[I.cx,I.cz];
    if(kind!=='hall'&&hash(seed,11)<.55){const A=arrowOf(I,Math.floor(hash(seed,13)*3)%3,.34+.14*hash(seed,15));N=A.N;poly=A.poly;core=A.core;}
    o=newBuilding(kind,I,q,seed,N,poly);o.core=core;o.storeys=kind==='slab'?1:kind==='stepped'?(hash(seed,17)<.3?1:2):2;
    o.fl=5.2+hash(seed,19)*.9;o.top=o.y0+(o.storeys===1?o.fl:o.fl*2-.4);}
  BUILD.push(o);gridAdd(o,I.P);}
{const inset=(T,k)=>T.P.map(p=>[T.cx+(p[0]-T.cx)*k,T.cz+(p[1]-T.cz)*k]);
 const rIn=GS.S/(2*Math.sqrt(3));
 const skip=(x,z)=>edgeD(x,z)>GS.HALF-40||GS.BASES.some(B=>Math.hypot(x-B.x,z-B.z)<B.r+26);
 const hillAt=(x,z)=>GS.HILLS.find(H=>Math.hypot(x-H.x,z-H.z)<H.r*.62);
 for(let j=-9;j<=9;j++)for(let i=-16;i<=16;i++){
  const p00=LP(i,j),p10=LP(i+1,j),p01=LP(i,j+1),p11=LP(i+1,j+1),tris=[[p00,p10,p01],[p10,p11,p01]].map(t=>mkPoly(t));
  // a hall over the whole cell (both triangles): its street-to-street sides are equal, so it insets evenly
  const okT=T=>!skip(T.cx,T.cz)&&Math.hypot(T.cx,T.cz)>70&&!isBlvd(T.cx,T.cz)&&!hillAt(T.cx,T.cz);
  if(okT(tris[0])&&okT(tris[1])&&!skip(p00[0],p00[1])&&!skip(p11[0],p11[1])&&hash(i*5+3,j*9-1)<.16&&['ward','civic','garden'].includes(cityQuarter(tris[0].cx,tris[0].cz))){
    const Q=mkPoly([p00,p10,p11,p01]),k=(GS.SH/2-GS.STREET-1)/(GS.SH/2);addBlock('hall',Q,mkPoly(inset(Q,k)),cityQuarter(Q.cx,Q.cz),0,i*97+j*13);continue;}
  for(let t=0;t<2;t++){const T=tris[t];if(skip(T.cx,T.cz))continue;
    const h0=hash(i*7+t,j*13),seed=i*61+j*37+t*11;
    if(Math.hypot(T.cx,T.cz)<60){PLAZA.push({T,spire:true});continue;}
    if(isBlvd(T.cx,T.cz)){OPENB.push({kind:'blvd',T,I:T,q:cityQuarter(T.cx,T.cz),seed});continue;}
    const hill=hillAt(T.cx,T.cz);if(hill){PARK.push({T,hill});continue;}
    const q=cityQuarter(T.cx,T.cz),kind=pickKind(q,hash(i*3+t*7,j*5+11)),I=mkPoly(inset(T,(rIn-GS.STREET-h0*1.4)/rIn));
    addBlock(kind,T,I,q,h0,seed);}}}
// a terrace: how far up its ramp a point is (0 on the low side .. 1 at the high corner)
function terrLam(o,x,z){return clamp(-(o.opp[0]*x+o.opp[1]*z-o.opp[2])/o.hA,0,1);}
function terrFloor(o,x,z){return terrH(x,z)+o.H*terrLam(o,x,z);}
const PAR_W=.7;   // a terrace's parapet: this thick, on its two high sides wherever the floor is up off the street
function terrWall(o,x,z){let w=-1e9;for(const k of[o.hi,(o.hi+2)%3]){const e=o.I.E[k],inD=-(e[0]*x+e[1]*z-e[2]);if(inD<PAR_W&&terrLam(o,x,z)>.12)w=Math.max(w,PAR_W-inD);}return w;}

/* ---------- the base walls: a ring with three gates toward the city ---------- */
const WALL_H=7,BWALL_T=1.2,GATE_HALF=10;
function baseWallD(B,x,z){const dx=x-B.x,dz=z-B.z,d=Math.hypot(dx,dz),band=BWALL_T-Math.abs(d-B.r);if(band<=-2)return -1e9;
  const a=Math.atan2(dx,dz),f=Math.atan2(B.fx,B.fz);for(const g of[0,-.95,.95]){let da=Math.abs(((a-f-g)+Math.PI*3)%(Math.PI*2)-Math.PI);if(da*B.r<GATE_HALF)return -1e9;}return band;}

/* ---------- the contract for js/origin/03-play.js ---------- */
const OBST=[],BARS=[];
const LZ={x:GS.BASES[0].x,z:GS.BASES[0].z,r:30};
// distance outside the walkable area (negative inside): the island's edge, the buildings, the terraces' parapets, the base walls
function playD(x,z){
  let d=edgeD(x,z)-GS.HALF;
  const L=BGRID[Math.floor(x/GC)+','+Math.floor(z/GC)];
  if(L)for(const o of L){if(o.hA){if(triSD(o.I,x,z)<0)d=Math.max(d,terrWall(o,x,z));}else d=Math.max(d,-o.sd(x,z));}
  for(const B of GS.BASES)d=Math.max(d,baseWallD(B,x,z));
  return d;}
function terrAt(x,z){const L=BGRID[Math.floor(x/GC)+','+Math.floor(z/GC)];if(L)for(const o of L)if(o.hA&&triSD(o.I,x,z)<0)return o;return null;}
function floorAt(x,z){const t=terrAt(x,z);return t?terrFloor(t,x,z):terrH(x,z);}
// what stands here, for shots and sight lines: a building's roof, a parapet's top, a wall's top; else the floor
function groundY(x,z){
  const L=BGRID[Math.floor(x/GC)+','+Math.floor(z/GC)];
  if(L)for(const o of L){if(o.hA){if(triSD(o.I,x,z)<0){const f=terrFloor(o,x,z);return terrWall(o,x,z)>0?f+1.15:f;}}else if(o.sd(x,z)<0)return o.topAt(x,z);}
  for(const B of GS.BASES)if(baseWallD(B,x,z)>0)return B.y+WALL_H;
  return terrH(x,z);}
function meshY(x,z){return terrH(x,z);}
GS.terrH=terrH;GS.playD=playD;GS.edgeD=edgeD;GS.inDome=(B,p)=>inDome(B,p);
function camClamp(head){const c=camera.position,g=groundY(c.x,c.z)+.4;if(c.y<g)c.y=g;}
// the road stand-ins: this map has no road; bots find their way on the lattice instead (GS.nav, used by navToward in js/mp/03-match.js)
const ROAD_LEN=1,SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0,BARRIERS=[],BLOCKS=[];
const _rp=new THREE.Vector3();
function roadS(x,z){return 0;}function roadPt(s,out){return(out||_rp).set(LZ.x,0,LZ.z);}function roadN(s){return{x:1,z:0};}
function latOf(x,z){return 0;}function laneC(s){return 0;}function laneHalf(s){return 400;}function spineAt(s){return false;}function barrier(id){return null;}
const BLEN=0;function belowD(){return 1;}function belowS(){return 0;}function belowPt(s,o){return(o||new THREE.Vector3());}function belowFloor(){return 0;}
const HOLLOW_GLOW=0xff6a5a,HOST_GLOW=0xa45cff;
/* the bases' domes stop every shot that crosses them, either way (Bryce: "protected, so you can't just shoot the people that spawn in").
   js/origin/03-play.js asks losBlock() in its sight and shot tests; js/mp/03-match.js wraps your own aim and the rockets with it too */
function inDome(B,p){return Math.hypot(p.x-B.x,(p.y||0)-B.y,p.z-B.z)<B.shieldR;}
function losBlock(a,b){for(const B of GS.BASES)if(inDome(B,a)!==inDome(B,b))return true;return false;}

/* ---------- the sky: a warm afternoon. Deep blue overhead, pale and hazy at the sea's edge, the sun low in the west-south-west,
   high thin cloud and a band of fair-weather cumulus over the horizon, and Astraea's pale moon by day. It rides with the camera ---------- */
const skyGroup=new THREE.Group();skyGroup.userData.dyn=1;scene.add(skyGroup);
const sunDir=new THREE.Vector3(-.62,.5,.6).normalize();
const skyU={sunDir:{value:sunDir},hor:{value:C(0xe4eef2)},mid:{value:C(0x8fc0ea)},zen:{value:C(0x3a78cc)},uT:{value:0},hazeC:{value:scene.fog.color}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(14000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,mid,zen,hazeC;uniform float uT;
  float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.0,a=.5;for(int i=0;i<5;i++){s+=ns(p)*a;p=p*2.03+vec2(17.0,-9.0);a*=.5;}return s;}
  void main(){vec3 d=normalize(vDir);float y=d.y;
    vec3 c=mix(hor,mid,smoothstep(0.0,.22,y));c=mix(c,zen,smoothstep(.18,.85,y));
    float s=max(dot(d,sunDir),0.0);
    c+=vec3(1.0,.78,.5)*pow(s,8.0)*.35+vec3(1.0,.86,.62)*pow(s,64.0)*.6;   // the warm glow round the sun
    // high thin cloud: streaks drifting slowly
    vec2 cp=d.xz/(y+.08);float hi=smoothstep(.55,.85,fbm(cp*vec2(.9,2.4)+vec2(uT*.004,0.0)))*smoothstep(.05,.3,y)*(1.0-smoothstep(.6,.95,y));
    c=mix(c,vec3(1.0,.98,.95),hi*.38);
    // fair-weather cumulus over the horizon: lit from the sun's side, warm, their undersides a little grey
    vec2 lp=d.xz/(y+.035)*.42;float cu=fbm(lp+vec2(3.0,uT*.002))*1.15+fbm(lp*2.7)*.35-.82;cu=smoothstep(.0,.28,cu)*smoothstep(.0,.035,y)*(1.0-smoothstep(.12,.26,y));
    vec3 cc=mix(vec3(.82,.84,.88),vec3(1.0,.95,.86),clamp(.55+.5*dot(normalize(vec3(d.x,0.0,d.z)),normalize(vec3(sunDir.x,0.0,sunDir.z))),0.0,1.0));
    c=mix(c,cc,cu*.92);
    c+=vec3(1.0,.95,.82)*smoothstep(.99955,.9998,s)*4.0;                 // the sun's disc
    float hb=1.0-smoothstep(-.02,.06,y);c=mix(c,hazeC,hb);                 // below the horizon: the sea haze
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
sky.renderOrder=-3;sky.frustumCulled=false;skyGroup.add(sky);
// Astraea's moon by day: pale, half lit, high in the east
{const m=new THREE.Mesh(new THREE.SphereGeometry(1,40,24),new THREE.ShaderMaterial({uniforms:{sd:{value:sunDir}},fog:false,depthWrite:false,transparent:true,
  vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(mat3(modelMatrix)*normal);vP=position;gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vN;varying vec3 vP;uniform vec3 sd;float hs(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float ns(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}
    void main(){vec3 p=normalize(vP);float n=ns(p*4.0)*.5+ns(p*9.0)*.3+ns(p*22.0)*.2;float l=smoothstep(-.15,.35,dot(normalize(vN),sd));
      vec3 c=mix(vec3(.78,.8,.86),vec3(.98,.97,.95),n);gl_FragColor=vec4(c,.18+.5*l);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`}));
 m.position.set(1,.42,-.55).normalize().multiplyScalar(12000);m.scale.setScalar(620);m.renderOrder=-2;skyGroup.add(m);}
function skyFollow(){skyGroup.position.copy(camera.position);}

/* ---------- light: the sun, warm and low enough to throw long shadows, and the sky's fill ---------- */
const hemi=new THREE.HemisphereLight(C(0xb8d4ff),C(0xc9b28c),.5);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(C(0xffe9c8),1.45);scene.add(keyLight,keyLight.target);
keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(keyLight.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:1600});keyLight.shadow.bias=-.0008;keyLight.shadow.normalBias=.14;
const rim=new THREE.DirectionalLight(C(0xffc8a0),.18);rim.position.set(-sunDir.x,.3,-sunDir.z).multiplyScalar(500);scene.add(rim);
const keyDir=sunDir.clone();
function followSun(p){keyLight.position.copy(p).addScaledVector(keyDir,700);keyLight.target.position.copy(p);}
let lookName='day';function setLook(){}

/* ---------- materials: the White City's stone in daylight, its gold, dark glass ---------- */
const CITY={t:{value:0}};
function whiteMat(o){o=o||{};const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:o.rough||.42,metalness:.04,emissive:C(0xc89a44),emissiveIntensity:o.em==null?.035:o.em,side:o.side||THREE.FrontSide});
  m.onBeforeCompile=sh=>{sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      // the gold undertone (the White City's): warmest low down and where the stone turns away from the sun
      float turn=1.0-clamp(dot(normalize(vWN),vec3(${sunDir.x.toFixed(3)},${sunDir.y.toFixed(3)},${sunDir.z.toFixed(3)})),0.0,1.0);
      diffuseColor.rgb*=mix(vec3(1.0),vec3(1.0,.93,.8),.16*turn+.1*(1.0-smoothstep(0.0,4.0,vWP.y)));
      // a faint grime line at the foot of every wall
      diffuseColor.rgb*=1.0-.12*(1.0-smoothstep(.0,1.2,vWP.y-${'0.0'}))*step(.2,abs(vWN.y-1.0));`);};
  return m;}
const stoneMat=whiteMat(),stoneDS=whiteMat({side:THREE.DoubleSide});
const goldMat=new THREE.MeshStandardMaterial({vertexColors:true,color:C(0xe8b04a),roughness:.32,metalness:.35,emissive:C(0x8a5a12),emissiveIntensity:.55});
const glassMat=new THREE.MeshStandardMaterial({vertexColors:true,color:C(0x4e7288),roughness:.08,metalness:.55,emissive:C(0x16303e),emissiveIntensity:.8,side:THREE.DoubleSide});
const K_W=C(0xf4efe4),K_W2=C(0xeae1cd),K_W3=C(0xd8cdb6),K_GOLD=new THREE.Color(1,1,1),K_GLASS=new THREE.Color(1,1,1);
/* static geometry is merged by kind into 300 m chunks, so the camera and the sun's shadow can skip the ones out of view */
// (Oct 30) trim tiles and metals in their own colours; awnings, sails and banners; plants on roofs and in gardens; fountain water
const trimMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.36,metalness:.2});
const clothMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0,side:THREE.DoubleSide});
const leafMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,metalness:0,flatShading:true});
const waterMat=new THREE.MeshStandardMaterial({color:C(0x5fc4d4),roughness:.06,metalness:.3,emissive:C(0x14404c),emissiveIntensity:.7});
const CLOTHS=[0xc8643c,0xe8a83a,0x2f9a9a,0xf2ede2,0x3a7ac8,0xd8707e,0x6a9a4a].map(h=>C(h));
const K_WOOD=C(0x8a6240),K_GRASS=C(0x5f9440),K_GRASS2=C(0x4a7c34),K_DOOR=new THREE.Color(.3,.32,.36),K_STEEL=C(0x9aa0a4);
const PROPS=new Merger(),PROPG=new Merger();   // the plazas' benches, planters and pillars (merged once, at the end)
const CH={};const CHS=200;
function chunk(x,z){const k=Math.floor(x/CHS)+','+Math.floor(z/CHS);return CH[k]||(CH[k]={w:new Merger(),g:new Merger(),gl:new Merger(),ds:new Merger(),t:new Merger(),cl:new Merger(),pl:new Merger(),wa:new Merger(),n:0});}
const _ga=new THREE.Vector3(),_gb=new THREE.Vector3(),_gm=new THREE.Matrix4(),_gq=new THREE.Quaternion(),_gz=new THREE.Vector3(0,0,1),_gs=new THREE.Vector3(1,1,1);
function goldSeg(mg,a,b,t){_ga.subVectors(b,a);const L=_ga.length();if(L<1e-3)return;_gq.setFromUnitVectors(_gz,_ga.multiplyScalar(1/L));
  _gb.addVectors(a,b).multiplyScalar(.5);_gm.compose(_gb,_gq,_gs.set(1,1,1));mg.add(new THREE.BoxGeometry(t,t,L+t),_gm.clone(),K_GOLD);}
// a wall panel from (ax,az) to (bx,bz), y0..y1, facing out (n: outward normal)
function wallQuad(mg,ax,az,bx,bz,y0,y1,col){const g=new THREE.BufferGeometry(),P=[ax,y0,az,bx,y0,bz,bx,y1,bz,ax,y0,az,bx,y1,bz,ax,y1,az],L=Math.hypot(bx-ax,bz-az);
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,L/4,0,L/4,(y1-y0)/4,0,0,L/4,(y1-y0)/4,0,(y1-y0)/4],2));g.computeVertexNormals();mg.add(g,new THREE.Matrix4(),col);}
// a flat polygon (convex fan) at height y, facing up
function capPoly(mg,pts,y,col,down){const P=[];for(let k=1;k<pts.length-1;k++){const a=pts[0],b=pts[k],c=pts[k+1];if(down)P.push(a[0],y,a[1],b[0],y,b[1],c[0],y,c[1]);else P.push(a[0],y,a[1],c[0],y,c[1],b[0],y,b[1]);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(P.length/3*2).fill(0),2));g.computeVertexNormals();
  if(g.attributes.normal.getY(0)<0===!down){/* wound the wrong way: flip */const a=g.attributes.position.array;for(let i=0;i<a.length;i+=9){for(let k=0;k<3;k++){const t=a[i+3+k];a[i+3+k]=a[i+6+k];a[i+6+k]=t;}}g.computeVertexNormals();}
  mg.add(g,new THREE.Matrix4(),col);}
// wind a polygon so its outline runs anticlockwise seen from above (walls then face outward)
function ccw(pts){let a=0;for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];a+=p[0]*q[1]-q[0]*p[1];}return a>0?pts.slice().reverse():pts.slice();}

/* ---------- the buildings (Oct 30, the variety pass) ---------- */
function pip(pts,x,z){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
function shrink(pts,cx,cz,k){return pts.map(p=>[cx+(p[0]-cx)*k,cz+(p[1]-cz)*k]);}
const V3w=(x,y,z)=>new THREE.Vector3(x,y,z);
// a bar of trim from a to b ([x,y,z]): gold into the gold, any other trim in its own colour
function trimBar(c,o,a,b,t){const A=V3w(a[0],a[1],a[2]),B=V3w(b[0],b[1],b[2]);if(!o.trim||o.trim==='gold'){goldSeg(c.g,A,B,t);return;}
  _ga.subVectors(B,A);const L=_ga.length();if(L<1e-3)return;_gq.setFromUnitVectors(_gz,_ga.multiplyScalar(1/L));_gb.addVectors(A,B).multiplyScalar(.5);_gm.compose(_gb,_gq,_gs.set(1,1,1));
  c.t.add(new THREE.BoxGeometry(t*1.6,t*1.6,L+t),_gm.clone(),o.trimC||(o.trimC=C(TRIMS[o.trim])));}
function anyBar(mg,a,b,t,col){const A=V3w(a[0],a[1],a[2]);_ga.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const L=_ga.length();if(L<1e-3)return;_gq.setFromUnitVectors(_gz,_ga.multiplyScalar(1/L));
  _gb.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);_gm.compose(_gb,_gq,_gs.set(1,1,1));mg.add(new THREE.BoxGeometry(t,t,L),_gm.clone(),col);}
// a wall from (ax,az) to (bx,bz), from y0 up to ya at a and yb at b (a sloped top for the wedges)
function wallSlope(mg,ax,az,bx,bz,y0,ya,yb,col){const g=new THREE.BufferGeometry(),L=Math.hypot(bx-ax,bz-az);
  g.setAttribute('position',new THREE.Float32BufferAttribute([ax,y0,az,bx,y0,bz,bx,yb,bz,ax,y0,az,bx,yb,bz,ax,ya,az],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,L/4,0,L/4,(yb-y0)/4,0,0,L/4,(yb-y0)/4,0,(ya-y0)/4],2));g.computeVertexNormals();mg.add(g,new THREE.Matrix4(),col);}
// a roof over a polygon with a height at each corner (a fan from the first corner; flat or planar tops only)
function capH(mg,pts,hf,col){const P=[];for(let k=1;k<pts.length-1;k++){const a=pts[0],b=pts[k],c=pts[k+1];P.push(a[0],hf(a),a[1],c[0],hf(c),c[1],b[0],hf(b),b[1]);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();
  if(g.attributes.normal.getY(0)<0){const a=g.attributes.position.array;for(let i=0;i<a.length;i+=9)for(let k=0;k<3;k++){const t=a[i+3+k];a[i+3+k]=a[i+6+k];a[i+6+k]=t;}g.computeVertexNormals();}
  g.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(P.length/3*2).fill(0),2));mg.add(g,new THREE.Matrix4(),col);}
function edgeOf(pts,k){const a=pts[k],b=pts[(k+1)%pts.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;let nx=uz,nz=-ux;
  if(pip(pts,(a[0]+b[0])/2+nx*.5,(a[1]+b[1])/2+nz*.5)){nx=-nx;nz=-nz;}return{a,b,L,ux,uz,nx,nz,ry:Math.atan2(nx,nz)};}
/* the walls of one tier: pts (the outline), from y0 up to topF(x,z); the windows of each floor in fys, in the building's style */
function dressWalls(c,o,pts,y0,topF,fys,door){const n=pts.length;let longest=-1,ll=0;for(let k=0;k<n;k++){const L=Math.hypot(pts[(k+1)%n][0]-pts[k][0],pts[(k+1)%n][1]-pts[k][1]);if(L>ll){ll=L;longest=k;}}
  for(let k=0;k<n;k++){const E=edgeOf(pts,k),{a,b,L,ux,uz,nx,nz,ry}=E,ta=topF(a[0],a[1]),tb=topF(b[0],b[1]);
    wallSlope(c.ds,a[0],a[1],b[0],b[1],y0-1.5,ta,tb,o.col);
    trimBar(c,o,[a[0]+nx*.12,ta-.32,a[1]+nz*.12],[b[0]+nx*.12,tb-.32,b[1]+nz*.12],.2);
    if(L<6)continue;
    const at=(t,y,off)=>[a[0]+ux*t+nx*(off==null?.06:off),y,a[1]+uz*t+nz*(off==null?.06:off)],topAt=t=>lerp(ta,tb,t/L),inn=2;
    const glassQ=(t0,t1,y1,y2,col)=>{const p=at(t0,0),q=at(t1,0);wallQuad(c.gl,p[0],p[2],q[0],q[2],y1,y2,col||o.glassC);};
    // a door at the middle of the longest wall, a dark recess with its frame
    if(door&&k===longest){const tm=L/2,gy=terrH(a[0]+ux*tm,a[1]+uz*tm);glassQ(tm-1.4,tm+1.4,gy,gy+3.3,K_DOOR);
      trimBar(c,o,at(tm-1.55,gy,.12),at(tm-1.55,gy+3.45,.12),.12);trimBar(c,o,at(tm+1.55,gy,.12),at(tm+1.55,gy+3.45,.12),.12);trimBar(c,o,at(tm-1.6,gy+3.45,.12),at(tm+1.6,gy+3.45,.12),.12);}
    const skipDoor=t=>door&&k===longest&&Math.abs(t-L/2)<2.4;
    if(o.style==='slit'){const nW=Math.max(1,Math.floor((L-inn*2)/2.8)),yA=fys[0]+1;
      for(let w=0;w<nW;w++){const tm=inn+(w+.5)*(L-inn*2)/nW;if(skipDoor(tm))continue;const yB=Math.min(topAt(tm-.45),topAt(tm+.45))-1.5;if(yB-yA<2)continue;glassQ(tm-.45,tm+.45,yA,yB);}
      for(const fy of fys.slice(1))if(fy<Math.min(ta,tb)-1)trimBar(c,o,at(0,fy,.1),at(L,fy,.1),.1);continue;}
    for(const fy of fys){
      if(o.style==='fin'){if(fy+4.2>Math.min(ta,tb))continue;glassQ(inn,L-inn,fy+.8,fy+4);
        for(let t=inn;t<=L-inn+.01;t+=1.5){const p=at(t,fy+2.4,.45);c.w.add(boxUV(.22,3.4,.9,2),M(p[0],p[1],p[2],0,ry,0),o.col);}continue;}
      if(o.style==='port'){const nW=Math.max(1,Math.floor((L-inn*2)/3.4));for(let w=0;w<nW;w++){const tm=inn+(w+.5)*(L-inn*2)/nW;if(skipDoor(tm)&&fy===fys[0])continue;if(fy+3.6>topAt(tm))continue;
          const p=at(tm,fy+2.4,.07),mm=new THREE.Matrix4().makeTranslation(p[0],p[1],p[2]).multiply(new THREE.Matrix4().makeRotationY(ry));
          c.gl.add(new THREE.CircleGeometry(.85,18),mm,o.glassC);const ring=new THREE.RingGeometry(.85,1.08,18);if(o.trim==='gold')c.g.add(ring,mm.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,.03)),K_GOLD);else c.t.add(ring,mm.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,.03)),o.trimC||(o.trimC=C(TRIMS[o.trim])));}continue;}
      if(o.style==='glyph'){if(fy+3.8>Math.min(ta,tb))continue;   // blank stone, the gold lattice woven across it (never one lone cross)
        for(const dy of[1.6,2.4,3.2])trimBar(c,o,at(inn,fy+dy,.1),at(L-inn,fy+dy,.1),.08);
        for(let t=inn+.8;t<L-inn;t+=1.7){if(skipDoor(t))continue;trimBar(c,o,at(t,fy+1.1,.1),at(t,fy+3.7,.1),.08);}continue;}
      // band: a row of windows with mullions between
      const nW=Math.max(1,Math.floor((L-inn*2)/4.6));
      for(let w=0;w<nW;w++){const t0=inn+(L-inn*2)*w/nW+.35,t1=inn+(L-inn*2)*(w+1)/nW-.35;if(fy+3.8>Math.min(topAt(t0),topAt(t1)))continue;if(skipDoor((t0+t1)/2)&&fy===fys[0])continue;
        glassQ(t0,t1,fy+1.1,fy+3.6);if(w>0)trimBar(c,o,at(t0-.35,fy+.95,.1),at(t0-.35,fy+3.75,.1),.07);}
      if(fy+3.8<Math.min(ta,tb))trimBar(c,o,at(0,fy+.9,.12),at(L,fy+.9,.12),.1);}}}
// what stands on a roof: pts the roof's outline, y its height, inside(x,z) says where on it is roof
function dressRoof(c,o,pts,y,ctr){const kind=o.roof,cx=ctr[0],cz=ctr[1],h=s=>hk(cx,cz,s);
  // a low lip round every roof
  for(let k=0;k<pts.length;k++){const E=edgeOf(pts,k),mx=(E.a[0]+E.b[0])/2-E.nx*.18,mz=(E.a[1]+E.b[1])/2-E.nz*.18;c.w.add(boxUV(E.L,.5,.32,2),M(mx,y+.25,mz,0,Math.atan2(-E.uz,E.ux),0),o.col);}
  const inner=shrink(pts,cx,cz,.82),spots=[];for(let k=0;k<14&&spots.length<4;k++){const u=h(20+k),v=h(40+k),A=inner[Math.floor(u*inner.length)],B=inner[(Math.floor(u*inner.length)+1)%inner.length],t=v,x=lerp(lerp(A[0],B[0],t),cx,.35),z=lerp(lerp(A[1],B[1],t),cz,.35);if(pip(pts,x,z))spots.push([x,z]);}
  if(kind==='garden'){capH(c.pl,shrink(pts,cx,cz,.88),()=>y+.14,K_GRASS);
    for(const [x,z] of spots){const s=.8+h(x|0)*.9;c.pl.add(new THREE.IcosahedronGeometry(s,0),M(x,y+.2+s*.8,z,0,x,0),hk(x,z,1)<.5?K_GRASS:K_GRASS2);c.w.add(new THREE.CylinderGeometry(s*.9,s,.6,10),M(x,y+.3,z),o.col);}}
  else if(kind==='sail'){for(let k=0;k<Math.min(2,spots.length);k++){const [x,z]=spots[k],r=3.4+h(k+3)*2,a0=h(k+5)*6.28,P3=[0,1,2].map(i=>{const a=a0+i*2.094;return[x+Math.sin(a)*r,z+Math.cos(a)*r];}).filter(q=>pip(pts,q[0],q[1])||true);
      const hs=[3.4,2.4,3.0].map(v=>y+v+h(k+v)*.8);for(let i=0;i<3;i++)anyBar(c.t,[P3[i][0],y,P3[i][1]],[P3[i][0],hs[i],P3[i][1]],.12,K_STEEL);
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([P3[0][0],hs[0],P3[0][1],P3[1][0],hs[1],P3[1][1],P3[2][0],hs[2],P3[2][1]],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1],2));g.computeVertexNormals();
      c.cl.add(g,new THREE.Matrix4(),CLOTHS[Math.floor(h(k+9)*CLOTHS.length)]);}}
  else if(kind==='pyramid'&&!o.N){const ap=[cx,y+2.6+h(3)*2.2,cz];for(let k=0;k<pts.length;k++){const a=pts[k],b=pts[(k+1)%pts.length],g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute([a[0],y,a[1],b[0],y,b[1],ap[0],ap[1],ap[2]],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));g.computeVertexNormals();
      if(g.attributes.normal.getY(0)<0){const q=g.attributes.position.array;for(let i=0;i<3;i++){const t=q[3+i];q[3+i]=q[6+i];q[6+i]=t;}g.computeVertexNormals();}c.w.add(g,new THREE.Matrix4(),K_W3);
      trimBar(c,o,[a[0],y+.05,a[1]],ap,.16);}
    goldSeg(c.g,V3w(ap[0],ap[1],ap[2]),V3w(ap[0],ap[1]+2.2,ap[2]),.22);}
  else if(kind==='tanks'){for(let k=0;k<Math.min(2,spots.length);k++){const [x,z]=spots[k];c.t.add(new THREE.CylinderGeometry(1.15,1.15,2.1,14),M(x,y+1.05,z),K_STEEL);c.t.add(new THREE.CylinderGeometry(1.2,1.2,.12,14),M(x,y+2.15,z),C(0x7a8086));}
    if(spots[2]){const [x,z]=spots[2];c.w.add(boxUV(2.6,2.4,2.6,2),M(x,y+1.2,z,0,h(7)*3,0),o.col);}}}
// a lamp post: a white pole, a gold arm, a lamp
const LAMPS=[];
function lamp(c,x,z){const y=terrH(x,z);c.w.add(new THREE.CylinderGeometry(.1,.16,5.2,8),M(x,y+2.6,z),K_W);goldSeg(c.g,V3w(x,y+5.1,z),V3w(x+.9,y+5.3,z),.08);c.g.add(new THREE.BoxGeometry(.5,.5,.5),M(x+.9,y+5,z),K_GOLD);OBST.push({x,z,r:.25,h:5});LAMPS.push([x,z]);}
// the side's banners hang on the walls near each base
function banners(c,o,pts,y1,yb){let B=null,bd=1e9;for(const b of GS.BASES){const d=Math.hypot(o.cx-b.x,o.cz-b.z);if(d<bd){bd=d;B=b;}}if(bd>175||o.q!=='ward')return;
  const col=C(GS.TEAMS[B.team].c);for(let k=0;k<pts.length;k++){const E=edgeOf(pts,k);if(E.L<12||hk(o.cx,o.cz,30+k)>.55)continue;const tm=E.L*(.3+.4*hk(o.cx,o.cz,40+k)),x=E.a[0]+E.ux*tm+E.nx*.2,z=E.a[1]+E.uz*tm+E.nz*.2,hh=Math.min(7.5,y1-yb-.8);
    if(hh<3)continue;const g=new THREE.PlaneGeometry(1.8,hh);g.translate(0,-hh/2,0);c.cl.add(g,new THREE.Matrix4().makeTranslation(x,y1-.5,z).multiply(new THREE.Matrix4().makeRotationY(E.ry)),col);
    goldSeg(c.g,V3w(x-E.ux*1.1,y1-.45,z-E.uz*1.1),V3w(x+E.ux*1.1,y1-.45,z+E.uz*1.1),.08);}}
function tierBlock(c,o,pts,y0,y1,fys,door,ctr){dressWalls(c,o,pts,y0,()=>y1,fys,door);const rc=o.roofC||K_W3;if(o.N&&pts.length===4){capPoly(c.w,[pts[0],pts[1],pts[2]],y1,rc);capPoly(c.w,[pts[0],pts[2],pts[3]],y1,rc);}else capPoly(c.w,pts,y1,rc);}
const BUILDERS={
  // one storey or two; a two-storey steps back at the upper floor, a balcony with a rail round the lower roof
  stepped(c,o){const full=o.poly,mid=o.y0+o.fl,ctr=o.core;
    if(o.storeys===2){const up=shrink(full,ctr[0],ctr[1],.8);tierBlock(c,o,full,o.y0,mid,[o.y0+.2],true);tierBlock(c,o,up,mid,o.top,[mid-.6],false);
      for(let k=0;k<full.length;k++){const a=full[k],b=full[(k+1)%full.length],ax=lerp(a[0],ctr[0],.03),az=lerp(a[1],ctr[1],.03),bx=lerp(b[0],ctr[0],.03),bz=lerp(b[1],ctr[1],.03);
        trimBar(c,o,[ax,mid+1.05,az],[bx,mid+1.05,bz],.07);c.w.add(boxUV(Math.hypot(bx-ax,bz-az),.5,.35,2),M((ax+bx)/2,mid+.25,(az+bz)/2,0,Math.atan2(-(bz-az),bx-ax),0),o.col);}
      dressRoof(c,o,up,o.top,ctr);banners(c,o,up,o.top,mid);}
    else{tierBlock(c,o,full,o.y0,o.top,[o.y0+.2],true);dressRoof(c,o,full,o.top,ctr);banners(c,o,full,o.top,o.y0+1);}
    BUILDERS.blade(c,o);},
  // one storey, all roof: gardens, sails or tanks up top
  slab(c,o){tierBlock(c,o,o.poly,o.y0,o.top,[o.y0+.2],true);dressRoof(c,o,o.poly,o.top,o.core);BUILDERS.blade(c,o);banners(c,o,o.poly,o.top,o.y0+1);},
  // a stepped block with a slim tower rising from its roof: a white shaft, gold rings, a gold crown
  lantern(c,o){o.storeys=2;o.roof='plain';BUILDERS.stepped(c,o);const [x,z]=o.core,y=o.top,h1=6+hk(x,z,3)*3,h2=7+hk(x,z,4)*5,r0=1.7;
    c.w.add(new THREE.CylinderGeometry(r0*.75,r0,h1,8),M(x,y+h1/2,z),o.col);c.w.add(new THREE.CylinderGeometry(.35,r0*.7,h2,8),M(x,y+h1+h2/2,z),o.col);
    for(const yy of[y+h1-.4,y+h1*.5])for(let k=0;k<8;k++){const a=k/8*6.283,b=(k+1)/8*6.283,r=lerp(r0,r0*.75,(yy-y)/h1)+.06;trimBar(c,o,[x+Math.sin(a)*r,yy,z+Math.cos(a)*r],[x+Math.sin(b)*r,yy,z+Math.cos(b)*r],.12);}
    c.g.add(new THREE.ConeGeometry(.6,2.4,8),M(x,y+h1+h2+1,z),K_GOLD);
    // slits of glass up the shaft
    for(let k=0;k<4;k++){const a=k/4*6.283+.4;const p=[x+Math.sin(a)*(r0*.86+.02),z+Math.cos(a)*(r0*.86+.02)];c.gl.add(new THREE.PlaneGeometry(.35,h1*.7),new THREE.Matrix4().makeTranslation(p[0],y+h1*.5,p[1]).multiply(new THREE.Matrix4().makeRotationY(a)),o.glassC);}},
  // a whole cell: a long two-storey hall, its upper floor stepped back, a glass ridge along its roof
  hall(c,o){o.style=o.style==='fin'?'band':o.style;const full=o.poly,mid=o.y0+o.fl,ctr=o.core,up=shrink(full,ctr[0],ctr[1],.78);
    tierBlock(c,o,full,o.y0,mid,[o.y0+.2],true);tierBlock(c,o,up,mid,o.top,[mid-.6],false);
    const A=up[0],B=up[2],d=[B[0]-A[0],B[1]-A[1]],L=Math.hypot(d[0],d[1]),ux=d[0]/L,uz=d[1]/L,nx=-uz,nz=ux,P0=[lerp(A[0],B[0],.18),lerp(A[1],B[1],.18)],P1=[lerp(A[0],B[0],.82),lerp(A[1],B[1],.82)],w=1.7,rh=o.top+1.8;
    for(const sgn of[-1,1]){const g=new THREE.BufferGeometry(),q=[P0[0]+nx*w*sgn,o.top,P0[1]+nz*w*sgn,P1[0]+nx*w*sgn,o.top,P1[1]+nz*w*sgn,P1[0],rh,P1[1],P0[0]+nx*w*sgn,o.top,P0[1]+nz*w*sgn,P1[0],rh,P1[1],P0[0],rh,P0[1]];
      g.setAttribute('position',new THREE.Float32BufferAttribute(q,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(12).fill(0),2));g.computeVertexNormals();c.gl.add(g,new THREE.Matrix4(),o.glassC);}
    goldSeg(c.g,V3w(P0[0],rh,P0[1]),V3w(P1[0],rh,P1[1]),.18);for(let t=0;t<=1.001;t+=.125){const x=lerp(P0[0],P1[0],t),z=lerp(P0[1],P1[1],t);for(const sgn of[-1,1])goldSeg(c.g,V3w(x+nx*w*sgn,o.top,z+nz*w*sgn),V3w(x,rh,z),.06);}
    banners(c,o,up,o.top,mid);},
  // the roof slopes from two storeys on one side down to one at the far corner, the tall side all glass behind fins
  wedge(c,o){o.style=hk(o.cx,o.cz,8)<.5?'fin':o.style;const pts=o.I.P;dressWalls(c,o,pts,o.y0,o.topAt,[o.y0+.2,o.y0+o.hLo+.2],true);
    capH(c.w,pts,p=>o.topAt(p[0],p[1]),o.roofC);
    // the roof's edge: a gold rail up the slope
    for(let k=0;k<3;k++){const a=pts[k],b=pts[(k+1)%3];trimBar(c,o,[a[0],o.topAt(a[0],a[1])+.4,a[1]],[b[0],o.topAt(b[0],b[1])+.4,b[1]],.12);}
},
  // a round drum under a dome (four profiles), arched openings round it, gold ribs up it, a small lantern on top; planters in the corners
  dome(c,o){const x=o.cx,z=o.cz,y=o.y0,R=o.R,dh=o.drum;
    c.ds.add(new THREE.CylinderGeometry(R,R*1.02,dh+1.5,32,1,true),M(x,y+dh/2-.75,z),o.col);
    const nA=8;for(let k=0;k<nA;k++){const a=k/nA*6.283+.2,px=x+Math.sin(a)*(R+.04),pz=z+Math.cos(a)*(R+.04),gy=terrH(px,pz);
      c.gl.add(new THREE.PlaneGeometry(1.9,dh-1.6),new THREE.Matrix4().makeTranslation(px,gy+(dh-1.6)/2+.3,pz).multiply(new THREE.Matrix4().makeRotationY(a)),k%2?K_DOOR:o.glassC);
      c.gl.add(new THREE.CircleGeometry(.95,12,0,Math.PI),new THREE.Matrix4().makeTranslation(px,gy+dh-1.3,pz).multiply(new THREE.Matrix4().makeRotationY(a)),k%2?K_DOOR:o.glassC);}
    for(let k=0;k<32;k++){const a=k/32*6.283,b=(k+1)/32*6.283;for(const yy of[y+dh-.15,y+dh-.6])trimBar(c,o,[x+Math.sin(a)*(R+.1),yy,z+Math.cos(a)*(R+.1)],[x+Math.sin(b)*(R+.1),yy,z+Math.cos(b)*(R+.1)],.12);}
    const prof=t=>{const H=o.domeH;if(o.shape==='onion'){const r=R*(1+.16*Math.sin(t*Math.PI*1.25))*Math.pow(1-t,.75);return[Math.max(.01,r),H*t];}
      const th=t*Math.PI/2;return[Math.max(.01,R*Math.cos(th)),H*Math.sin(th)];};
    const ptsL=[];for(let i=0;i<=16;i++){const [r,yy]=prof(i/16);ptsL.push(new THREE.Vector2(r,yy));}
    c.w.add(new THREE.LatheGeometry(ptsL,32),M(x,y+dh,z),o.col);
    for(let k=0;k<8;k++){const a=k/8*6.283;let prev=null;for(let i=0;i<=8;i++){const [r,yy]=prof(i/8*.96),p=[x+Math.sin(a)*(r+.06),y+dh+yy,z+Math.cos(a)*(r+.06)];if(prev)goldSeg(c.g,V3w(...prev),V3w(...p),.14);prev=p;}}
    const ty=y+dh+o.domeH;c.w.add(new THREE.CylinderGeometry(.7,.9,1.8,10),M(x,ty+.8,z),o.col);c.g.add(new THREE.ConeGeometry(.75,2,10),M(x,ty+2.6,z),K_GOLD);
    for(const p of o.I.P){const px=lerp(p[0],x,.28),pz=lerp(p[1],z,.28);if(Math.hypot(px-x,pz-z)>R+1.8){const gy=terrH(px,pz);c.w.add(new THREE.CylinderGeometry(1.1,1.2,1,12),M(px,gy+.5,pz),o.col);c.pl.add(new THREE.IcosahedronGeometry(1.1,0),M(px,gy+1.6,pz),K_GRASS);OBST.push({x:px,z:pz,r:1.3,h:1});}}},
  // a hall under a roof on columns all round it (an arcade you can walk under), a stone core in the middle
  colonnade(c,o){const pts=o.I.P,y=o.y0,top=o.top,slab=.8,cpts=o.core.P;
    capPoly(c.w,pts,top,o.roofC);capPoly(c.w,pts,top-slab,K_W2,true);
    for(let k=0;k<3;k++){const E=edgeOf(pts,k);wallQuad(c.ds,E.a[0],E.a[1],E.b[0],E.b[1],top-slab,top,o.col);
      trimBar(c,o,[E.a[0]+E.nx*.1,top-slab+.2,E.a[1]+E.nz*.1],[E.b[0]+E.nx*.1,top-slab+.2,E.b[1]+E.nz*.1],.12);
      const n=Math.max(2,Math.round(E.L/4.2));for(let i=0;i<=n;i++){if(i===n)continue;const t=E.L*i/n,px=E.a[0]+E.ux*t-E.nx*.9,pz=E.a[1]+E.uz*t-E.nz*.9,gy=terrH(px,pz),hh=top-slab-gy;
        c.w.add(new THREE.CylinderGeometry(.4,.46,hh,12),M(px,gy+hh/2,pz),o.col);c.w.add(boxUV(1.1,.35,1.1,2),M(px,gy+.17,pz),K_W3);c.w.add(boxUV(1.1,.3,1.1,2),M(px,top-slab-.15,pz),K_W3);
        OBST.push({x:px,z:pz,r:.55,h:hh});}}
    const co={...o,style:hk(o.cx,o.cz,9)<.5?'glyph':'band'};dressWalls(c,co,cpts,y,()=>top-slab,[y+.2],true);
    dressRoof(c,o,pts,top,[o.cx,o.cz]);}};
// an arrowhead's blade: a white fin up from the point, trimmed on its leading edge (on the blocks with a notch)
BUILDERS.blade=(c,o)=>{if(!o.N)return;const A=o.poly[0],ax=A[0]-o.cx,az=A[1]-o.cz,L=Math.hypot(ax,az),ux=ax/L,uz=az/L,h=o.top-o.y0+3+hk(A[0],A[1],7)*4,ry=Math.atan2(ux,uz);
  const bx=A[0]-ux*2.2,bz=A[1]-uz*2.2;c.w.add(boxUV(.55,h,4.2,2),M(bx,o.y0+h/2-1,bz,0,ry,0),o.col);
  trimBar(c,o,[A[0]-ux*.1,o.y0,A[1]-uz*.1],[A[0]-ux*.1,o.y0+h-1.2,A[1]-uz*.1],.2);
  for(const dy of[.55,.62,.69])trimBar(c,o,[bx-ux*2.2+uz*.32,o.y0+h*dy,bz-uz*2.2-ux*.32],[bx+ux*2.1+uz*.32,o.y0+h*dy,bz+uz*2.1-ux*.32],.08);};
for(const o of BUILD){const c=chunk(o.cx,o.cz);c.n++;BUILDERS[o.kind](c,o);
  // a street lamp on one corner of some blocks, out on the pavement
  if(hk(o.cx,o.cz,50)<.35){const p=o.I.P[Math.floor(hk(o.cx,o.cz,51)*o.I.P.length)%o.I.P.length],dx=p[0]-o.cx,dz=p[1]-o.cz,L=Math.hypot(dx,dz),x=p[0]+dx/L*2.2,z=p[1]+dz/L*2.2;if(playD(x,z)<-1)lamp(c,x,z);}}

/* ---------- the open blocks: fountains, market stalls, beach bars, pergola gardens, the boulevards ---------- */
const BLVD_PALMS=[];
function stall(c,x,z,ry,cl){const y=terrH(x,z),fw=[Math.sin(ry),Math.cos(ry)],rt=[Math.cos(ry),-Math.sin(ry)];
  for(const sx of[-1,1])for(const sz of[-1,1]){const px=x+rt[0]*sx*1.9+fw[0]*sz*1.2,pz=z+rt[1]*sx*1.9+fw[1]*sz*1.2;anyBar(c.t,[px,terrH(px,pz),pz],[px,y+(sz>0?2.4:2.9),pz],.1,K_WOOD);}
  const g=new THREE.PlaneGeometry(4.4,3.1);g.rotateX(-Math.PI/2+.2);c.cl.add(g,new THREE.Matrix4().makeTranslation(x,y+2.72,z).multiply(new THREE.Matrix4().makeRotationY(ry)),cl);
  c.t.add(boxUV(3.8,1,1,1),M(x+fw[0]*.9,y+.5,z+fw[1]*.9,0,ry,0),K_WOOD);c.cl.add(new THREE.BoxGeometry(3.6,.05,.9),M(x+fw[0]*.9,y+1.03,z+fw[1]*.9,0,ry,0),cl);
  for(let k=0;k<3;k++){const px=x-fw[0]*.6+rt[0]*(k-1)*1.2,pz=z-fw[1]*.6+rt[1]*(k-1)*1.2,s=.5+hk(px,pz,1)*.3;c.t.add(boxUV(s,s,s,1),M(px,terrH(px,pz)+s/2,pz,0,hk(px,pz,2)*2,0),K_WOOD);}
  OBST.push({x:x+fw[0]*.9+rt[0]*1,z:z+fw[1]*.9+rt[1]*1,r:1.05,h:1.05},{x:x+fw[0]*.9-rt[0]*1,z:z+fw[1]*.9-rt[1]*1,r:1.05,h:1.05});}
function parasol(c,x,z,cl){const y=terrH(x,z);anyBar(c.t,[x,y,z],[x,y+2.6,z],.08,K_STEEL);c.cl.add(new THREE.ConeGeometry(1.9,.7,10,1,true),M(x,y+2.6,z),cl);OBST.push({x,z,r:.2,h:2.6,low:true});}
function lounger(c,x,z,ry){const y=terrH(x,z);c.w.add(boxUV(.8,.3,2,1),M(x,y+.3,z,0,ry,0),K_W);c.w.add(boxUV(.8,.1,.8,1),M(x+Math.sin(ry)*-.7,y+.6,z+Math.cos(ry)*-.7,.6,ry,0),K_W);}
for(const B of OPENB){const T=B.T,I=B.I,c=chunk(T.cx,T.cz),x=I.cx,z=I.cz,h=s=>hk(x,z,s),o={trim:TRIM_BY[B.q||'civic'][Math.floor(h(2)*3)],col:K_W2};
  if(B.kind==='fountain'){const rin=Math.min(...I.E.map(e=>-(e[0]*x+e[1]*z-e[2]))),R=rin*.62,y=terrH(x,z);
    c.w.add(new THREE.CylinderGeometry(R+.5,R+.6,.8,36),M(x,y+.4,z),K_W2);c.wa.add(new THREE.CircleGeometry(R,36).rotateX(-Math.PI/2),M(x,y+.62,z),new THREE.Color(1,1,1));
    for(let k=0;k<36;k++){const a=k/36*6.283,b=(k+1)/36*6.283;trimBar(c,o,[x+Math.sin(a)*(R+.55),y+.82,z+Math.cos(a)*(R+.55)],[x+Math.sin(b)*(R+.55),y+.82,z+Math.cos(b)*(R+.55)],.08);}
    c.w.add(new THREE.CylinderGeometry(.6,.9,2.6,14),M(x,y+1.3,z),K_W);c.w.add(new THREE.CylinderGeometry(2.2,.6,.6,20),M(x,y+2.8,z),K_W);c.wa.add(new THREE.CircleGeometry(2,20).rotateX(-Math.PI/2),M(x,y+3.08,z),new THREE.Color(1,1,1));
    goldSeg(c.g,V3w(x,y+3,z),V3w(x,y+4.6,z),.18);OBST.push({x,z,r:R+.6,h:.8});
    for(let k=0;k<3;k++){const v=I.P[k],px=lerp(x,v[0],.62),pz=lerp(z,v[1],.62);bench(px,pz,Math.atan2(v[0]-x,v[1]-z)+Math.PI/2,3.6);}}
  else if(B.kind==='market'){for(let k=0;k<3;k++){const E=edgeOf(I.P,k);if(E.L<9)continue;const n=E.L>20?2:1;
      for(let s=0;s<n;s++){const t=E.L*(n===1?.5:s?.72:.28),px=E.a[0]+E.ux*t-E.nx*2.4,pz=E.a[1]+E.uz*t-E.nz*2.4;stall(c,px,pz,Math.atan2(-E.nx,-E.nz),CLOTHS[Math.floor(hk(px,pz,3)*CLOTHS.length)]);}}
    parasol(c,x,z,CLOTHS[Math.floor(h(4)*CLOTHS.length)]);}
  else if(B.kind==='pavilion'){const y=terrH(x,z)+3.9,roof=shrink(I.P,x,z,.9),posts=[];for(let k=0;k<3;k++){const a=roof[k],b=roof[(k+1)%3];posts.push(lerp(a[0],x,.06),lerp(a[1],z,.06));posts.push(lerp((a[0]+b[0])/2,x,.06),lerp((a[1]+b[1])/2,z,.06));}
    for(let k=0;k<posts.length;k+=2){const px=posts[k],pz=posts[k+1],gy=terrH(px,pz);c.w.add(new THREE.CylinderGeometry(.22,.26,y-gy,8),M(px,(y+gy)/2,pz),K_W);OBST.push({x:px,z:pz,r:.32,h:y-gy});}
    capPoly(c.w,roof,y+.45,K_W3);capPoly(c.w,roof,y,K_W2,true);for(let k=0;k<3;k++){const E=edgeOf(roof,k);wallQuad(c.ds,E.a[0],E.a[1],E.b[0],E.b[1],y,y+.45,K_W);trimBar(c,o,[E.a[0]+E.nx*.08,y+.22,E.a[1]+E.nz*.08],[E.b[0]+E.nx*.08,y+.22,E.b[1]+E.nz*.08],.1);}
    const po={...o,roof:'sail',col:K_W,N:null};dressRoof(c,po,roof,y+.45,[x,z]);
    // the bar in the middle, stools round it; loungers and parasols out front
    for(let k=0;k<3;k++){const a=k/3*6.283+h(5)*2,px=x+Math.sin(a)*1.6,pz=z+Math.cos(a)*1.6;c.t.add(boxUV(2.8,1.1,.7,1),M(px,terrH(px,pz)+.55,pz,0,a,0),K_WOOD);OBST.push({x:px,z:pz,r:1.1,h:1.1});}
    for(let k=0;k<3;k++){const v=I.P[k],px=lerp(x,v[0],.55),pz=lerp(z,v[1],.55);parasol(c,px,pz,CLOTHS[Math.floor(hk(px,pz,6)*CLOTHS.length)]);lounger(c,px+1.4,pz,Math.atan2(v[0]-x,v[1]-z));}}
  else if(B.kind==='pergola'){const gpts=shrink(I.P,x,z,.95);capH(c.pl,gpts,p=>terrH(p[0],p[1])+.1,K_GRASS);
    const L2=6+h(3)*4,ry=h(4)*3.14,fw=[Math.sin(ry),Math.cos(ry)],rt=[Math.cos(ry),-Math.sin(ry)],y=terrH(x,z)+3.4;
    for(const sx of[-1,1])for(const sz of[-1,0,1]){const px=x+rt[0]*sx*1.8+fw[0]*sz*L2/2,pz=z+rt[1]*sx*1.8+fw[1]*sz*L2/2;c.w.add(new THREE.CylinderGeometry(.18,.2,y-terrH(px,pz),8),M(px,(y+terrH(px,pz))/2,pz),K_W);OBST.push({x:px,z:pz,r:.25,h:3.4});}
    for(const sx of[-1,1])c.t.add(boxUV(.22,.3,L2+1,1),M(x+rt[0]*sx*1.8,y+.15,z+rt[1]*sx*1.8,0,ry,0),K_WOOD);
    for(let t=-L2/2;t<=L2/2;t+=.8){c.pl.add(boxUV(4.4,.14,.32,1),M(x+fw[0]*t,y+.38,z+fw[1]*t,0,ry,0),hk(x+t,z,7)<.5?K_GRASS:K_GRASS2);}
    for(const sx of[-1,1])bench(x+rt[0]*sx*.9,z+rt[1]*sx*.9,ry+Math.PI/2,Math.max(3,L2-2));
    for(let k=0;k<3;k++){const v=I.P[k],px=lerp(x,v[0],.6),pz=lerp(z,v[1],.6),gy=terrH(px,pz),s=1.4+hk(px,pz,8);c.t.add(new THREE.CylinderGeometry(.14,.2,2.4,6),M(px,gy+1.2,pz),K_WOOD);c.pl.add(new THREE.IcosahedronGeometry(s,1),M(px,gy+2.4+s*.6,pz),K_GRASS2);OBST.push({x:px,z:pz,r:.3,h:3});}}
  else if(B.kind==='blvd'){BLVD_PALMS.push([x,z]);if(h(5)<.5){const E=edgeOf(T.P,Math.floor(h(6)*3)%3);bench(lerp(E.a[0],E.b[0],.5)-E.nx*7,lerp(E.a[1],E.b[1],.5)-E.nz*7,Math.atan2(-E.uz,E.ux),4);}
    const v=T.P[Math.floor(h(7)*3)%3];lamp(c,lerp(x,v[0],.5),lerp(z,v[1],.5));}}

/* ---------- terraces: a ramped floor, stone skirts down to the street, parapets on the two high sides ---------- */
for(const o of TERR){const c=chunk(o.I.cx,o.I.cz),P=o.I.P,n=9,top=[];c.n++;
  const pt=(u,v)=>{const w=1-u-v,x=P[0][0]*w+P[1][0]*u+P[2][0]*v,z=P[0][1]*w+P[1][1]*u+P[2][1]*v;return[x,terrFloor(o,x,z),z];};
  const g=new THREE.BufferGeometry(),pos=[];
  for(let a=0;a<n;a++)for(let b=0;b<n-a;b++){const p0=pt(a/n,b/n),p1=pt((a+1)/n,b/n),p2=pt(a/n,(b+1)/n);pos.push(...p0,...p2,...p1);
    if(b<n-a-1){const p3=pt((a+1)/n,(b+1)/n);pos.push(...p1,...p2,...p3);}}
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();if(g.attributes.normal.getY(0)<0){const A=g.attributes.position.array;for(let i=0;i<A.length;i+=9)for(let k=0;k<3;k++){const t=A[i+3+k];A[i+3+k]=A[i+6+k];A[i+6+k]=t;}g.computeVertexNormals();}
  g.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(pos.length/3*2).fill(0),2));c.w.add(g,new THREE.Matrix4(),K_W2);
  // the skirts (each edge, the floor down past the street) and the parapets
  for(let k=0;k<3;k++){const a=P[k],b=P[(k+1)%3],high=k===o.hi||k===(o.hi+2)%3,N2=10;
    for(let s=0;s<N2;s++){const ax=lerp(a[0],b[0],s/N2),az=lerp(a[1],b[1],s/N2),bx=lerp(a[0],b[0],(s+1)/N2),bz=lerp(a[1],b[1],(s+1)/N2),fa=terrFloor(o,ax,az),fb=terrFloor(o,bx,bz);
      if(Math.max(fa,fb)-terrH(ax,az)<.15)continue;
      const g2=new THREE.BufferGeometry(),y0=Math.min(terrH(ax,az),terrH(bx,bz))-1;g2.setAttribute('position',new THREE.Float32BufferAttribute([ax,y0,az,bx,y0,bz,bx,fb,bz,ax,y0,az,bx,fb,bz,ax,fa,az],3));
      g2.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(12).fill(0),2));g2.computeVertexNormals();c.ds.add(g2,new THREE.Matrix4(),K_W);
      if(high){const lam=terrLam(o,(ax+bx)/2,(az+bz)/2);if(lam>.12){const e=o.I.E[k],ix=-e[0]*PAR_W/2,iz=-e[1]*PAR_W/2,mx=(ax+bx)/2+ix,mz=(az+bz)/2+iz,L=Math.hypot(bx-ax,bz-az),fy=(fa+fb)/2;
        c.w.add(boxUV(L+.05,1.15,PAR_W,2),M(mx,fy+.57,mz,0,Math.atan2(-(bz-az),bx-ax),0),K_W);
        _ga.set(ax+ix,fa+1.17,az+iz);goldSeg(c.g,_ga.clone(),_gb.set(bx+ix,fb+1.17,bz+iz).clone(),.16);}}}}}

/* ---------- the ground: one mesh over the island and its beach, fine in the middle, coarser at the shore. Paving in the city (pale
   slabs with seams, the gold glints of the White City between them), grass on the hills' parks, sand on the beach ---------- */
const groundMat=(()=>{const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:.03});
  m.onBeforeCompile=sh=>{sh.vertexShader='attribute float pave;attribute float bsh;varying float vPave;varying float vBsh;varying vec3 vWP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPave=pave;vBsh=bsh;vWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='varying float vPave;varying float vBsh;varying vec3 vWP;\nfloat h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 q=vWP.xz/3.2;vec2 f=abs(fract(q)-.5);float seam=smoothstep(.465,.5,max(f.x,f.y));float slab=h21(floor(q));
      diffuseColor.rgb*=mix(1.0,(.88+.16*slab)*(1.0-seam*.5),vPave);
      diffuseColor.rgb*=mix(1.0,vBsh,smoothstep(55.0,85.0,length(vWP.xz-cameraPosition.xz)));   // baked shade past the shadow map's reach
      float sand=h21(floor(vWP.xz*7.0));diffuseColor.rgb*=mix(1.0,.94+.08*sand,1.0-vPave);
      float gn=h21(floor(vWP.xz*1.3))*.5+h21(floor(vWP.xz*.31))*.5;diffuseColor.rgb*=mix(1.0,.86+.24*gn,(1.0-vPave)*step(diffuseColor.r*1.2,diffuseColor.g));   // tufts and patches in the grass`).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=mix(.92,.5,vPave);`);};return m;})();
{const EXT=GS.HALF+140,steps=(a,b,fine,cs)=>{const o=[];let v=a;while(v<b){o.push(v);v+=Math.abs(v)<GS.HALF+85?fine:cs;}o.push(b);return o;};
 const f=coarse?4:3,xs=steps(-EXT,EXT,f,8),zs=steps(-EXT,EXT,f,8);
 const NX=xs.length,NZ=zs.length,pos=new Float32Array(NX*NZ*3),col=new Float32Array(NX*NZ*3),pv=new Float32Array(NX*NZ),bs=new Float32Array(NX*NZ);
 const sh=new THREE.Vector2(sunDir.x,sunDir.z).normalize(),tanE=sunDir.y/Math.hypot(sunDir.x,sunDir.z);
 const PAVE=C(0xd6cab2),SAND=C(0xe6cf9c),WET=C(0xb09060),GRASS=C(0x6f9a44),GRASS2=C(0x4e7e34),tmp=new THREE.Color();
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=xs[i],z=zs[j],k=j*NX+i,y=terrH(x,z);pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;
   const e=edgeD(x,z),city=1-sstep(GS.HALF-56,GS.HALF-34,e);let park=0;for(const H of GS.HILLS){const d=Math.hypot(x-H.x,z-H.z);park=Math.max(park,1-sstep(H.r*.5,H.r*.72,d));}
   pv[k]=city*(1-park);
   tmp.copy(SAND).lerp(WET,sstep(GS.HALF-15,GS.HALF+20,e)*.9);tmp.lerp(PAVE,city);tmp.lerp(GRASS.clone().lerp(GRASS2,vnoise(x*.03,z*.03)),park*city);tmp.multiplyScalar(.93+.1*vnoise(x*.05,z*.05));
   // baked: the buildings' shadows (used beyond the sun's real shadow map, which only covers the ground round you) and a little
   // darkening at the foot of every wall
   let shd=1;if(e<GS.HALF){for(const sd of[1.5,3,5,8,12,17,23]){const qx=x+sh.x*sd,qz=z+sh.y*sd;if(groundY(qx,qz)-y>sd*tanE+.2){shd=.58;break;}}
     const pd=playD(x,z);if(pd>-3.5&&pd<.5)tmp.multiplyScalar(.8+.2*sstep(-.2,-3.5,pd));}
   bs[k]=shd;
   col[k*3]=tmp.r;col[k*3+1]=tmp.g;col[k*3+2]=tmp.b;}
 const idx=new Uint32Array((NX-1)*(NZ-1)*6);let q=0;
 for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const p=j*NX+i,r=p+1,c=p+NX,d=c+1;idx[q++]=p;idx[q++]=c;idx[q++]=r;idx[q++]=r;idx[q++]=c;idx[q++]=d;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('pave',new THREE.BufferAttribute(pv,1));g.setAttribute('bsh',new THREE.BufferAttribute(bs,1));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
 const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;m.userData.dyn=1;scene.add(m);}

/* ---------- the sea: all round, to the horizon. Turquoise over the sand near the beach, deep blue further out, the sun's glitter on
   the swell, and foam where it breaks on the beach ---------- */
const SEA=(()=>{const U={uT:{value:0},sunDir:{value:sunDir},hazeC:{value:scene.fog.color},HF:{value:GS.HALF}};
  const m=new THREE.Mesh(new THREE.PlaneGeometry(40000,40000,160,160).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:U,fog:false,transparent:false,
    vertexShader:'varying vec3 vWP;void main(){vec4 w=modelMatrix*vec4(position,1.0);vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`varying vec3 vWP;uniform float uT,HF;uniform vec3 sunDir,hazeC;
      float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
      void main(){vec3 V=cameraPosition-vWP;float dist=length(V);V/=dist;
        // the swell: a few long waves and chop, as a normal
        vec2 p=vWP.xz;float t=uT;
        vec2 g=vec2(0.0);
        g+=vec2(.8,.6)*cos(dot(p,vec2(.8,.6))*.045+t*.9+ns(p*.004)*6.0)*.12;g+=vec2(-.4,.9)*cos(dot(p,vec2(-.4,.9))*.07+t*1.2+ns(p*.006+3.0)*6.0)*.09;
        g+=vec2(.95,-.3)*cos(dot(p,vec2(.95,-.3))*.16+t*1.9)*.05;g+=vec2(ns(p*.35+t*.3)-.5,ns(p*.35-t*.25+7.0)-.5)*.22+vec2(ns(p*1.3-t*.5)-.5,ns(p*1.3+t*.45+3.0)-.5)*.12;
        float fade=1.0-smoothstep(120.0,1600.0,dist);vec3 N=normalize(vec3(-g.x*fade*.6,1.0,-g.y*fade*.6));
        float e=max(abs(vWP.x),abs(vWP.z));
        vec3 deep=vec3(.03,.16,.34),mid=vec3(.06,.34,.5),shal=vec3(.25,.72,.72);
        vec3 c=mix(shal,mid,smoothstep(HF+30.0,HF+230.0,e));c=mix(c,deep,smoothstep(HF+150.0,HF+1050.0,e));
        float fr=pow(1.0-max(dot(N,V),0.0),4.0);vec3 R=reflect(-V,N);
        vec3 skyR=mix(vec3(.86,.92,.95),vec3(.35,.6,.88),smoothstep(0.0,.5,R.y));
        c=mix(c,skyR,.12+.55*fr);
        float sp=pow(max(dot(R,sunDir),0.0),220.0)*3.0+pow(max(dot(R,sunDir),0.0),18.0)*.12;c+=vec3(1.0,.9,.72)*sp;
        // foam where it breaks on the beach, pulsing up and down the sand
        float fl=sin(e*.35-t*1.6+ns(p*.05)*6.0)*.5+.5;float foam=(1.0-smoothstep(0.0,7.0,abs(e-(HF+22.0+4.0*sin(t*.5+ns(p*.01)*6.0)))))*(.4+.6*fl)*smoothstep(.75,.45,ns(p*.25+t*.15));
        c=mix(c,vec3(.97,.98,.96),foam*.85);
        c=mix(c,hazeC,smoothstep(1500.0,9000.0,dist)*.85);
        gl_FragColor=vec4(c,1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`}));m.position.y=GS.SEA;m.userData.dyn=1;m.renderOrder=-1;scene.add(m);return{m,U};})();

/* ---------- the far side of the sea: small islands, continents with ranges, a skyline at the edge (js/shared/vista.js) ---------- */
const FAR=VISTA.build({seed:41,sun:sunDir,haze:HAZE_HEX,rock:0x9c8e7e,rock2:0x7d7670,green:0x5f8a46,sand:0xead8aa,snow:0xf4f6fa,
  // the big ones: a snow-capped massif with sea cliffs, waterfalls and a white tower beyond the red side's corner, and a lower one
  // behind the blue side's, so each team looks out at one
  massifs:[{a:.78,r:4300,rad:1800,h:1350,falls:5,tower:true},{a:3.92,r:5000,rad:1500,h:880,falls:3},{a:-1.0,r:6400,rad:1300,h:760,falls:2}],
  islands:{n:coarse?9:14,r0:2300,r1:6500,h0:40,h1:220},
  coasts:[{a0:-2.55,a1:-1.75,r:9800,depth:3200,h:820},{a0:-.4,a1:.35,r:11500,depth:3600,h:1250},{a0:1.55,a1:2.6,r:9000,depth:2800,h:700},{a0:4.4,a1:5.0,r:10200,depth:3000,h:980}],
  skyline:{r:13600,h:260}});
scene.add(FAR.G);

/* ---------- palms (warm vibe): the beach, the promenade, the parks ---------- */
const PALM=(()=>{const tr=new Merger(),fr=new Merger(),TRK=C(0x8a6a48),TRK2=C(0x6e5238),LEAF=C(0x4f8a3a),LEAF2=C(0x6aa046);
  function palm(x,z,h,lean,ry){const y=terrH(x,z),seg=6;let px=x,py=y,pz=z;const lx=Math.sin(ry)*lean,lz=Math.cos(ry)*lean;
    for(let s=0;s<seg;s++){const u=(s+1)/seg,nx=x+lx*u*u*h,ny=y+h*u,nz=z+lz*u*u*h,L=Math.hypot(nx-px,ny-py,nz-pz),g=new THREE.CylinderGeometry(.2-.06*u,.26-.06*u,L,7);
      _gq.setFromUnitVectors(new THREE.Vector3(0,1,0),_ga.set(nx-px,ny-py,nz-pz).normalize());_gm.compose(_gb.set((px+nx)/2,(py+ny)/2,(pz+nz)/2),_gq,_gs.set(1,1,1));tr.add(g,_gm.clone(),s%2?TRK:TRK2);px=nx;py=ny;pz=nz;}
    const nf=8;for(let k=0;k<nf;k++){const a=k/nf*Math.PI*2+ry,len=3.6+hash(x|0,k)*1.2,g=new THREE.PlaneGeometry(len,1.1,6,1),P=g.attributes.position;
      for(let i=0;i<P.count;i++){const u=(P.getX(i)+len/2)/len;P.setY(i,P.getY(i)*(1-u*.7)-u*u*1.8);P.setZ(i,0);}g.translate(len/2,0,0);g.computeVertexNormals();
      fr.add(g,new THREE.Matrix4().makeRotationY(a).premultiply(new THREE.Matrix4().makeTranslation(px,py,pz)).multiply(new THREE.Matrix4().makeRotationX(.15+hash(k,z|0)*.3)),k%2?LEAF:LEAF2);}
    OBST.push({x,z,r:.45,h:h});}
  // along the beach, just outside the playable edge and on the promenade
  const W=GS.HALF-24;for(let k=0;k<(coarse?40:60);k++){const side=k%4,u=hash(k,7)*1.9-.95,d=GS.HALF-12-hash(k,3)*26;const x=side===0?u*W:side===1?d:side===2?u*W:-d,z=side===0?-d:side===1?u*W:side===2?d:u*W;
    if(GS.BASES.some(B=>Math.hypot(x-B.x,z-B.z)<B.r+20))continue;palm(x,z,6+hash(k,11)*4,.12+hash(k,5)*.18,hash(k,9)*6.28);}
  for(const [x,z] of BLVD_PALMS)palm(x,z,7+hash(x|0,z|0)*3,.06,hash(z|0,3)*6.28);
  for(const P of PARK){if(hash(P.T.cx|0,P.T.cz|0)<.35)continue;const n=1+Math.floor(hash(P.T.cz|0,5)*3);for(let k=0;k<n;k++){const a=hash(k,P.T.cx|0)*6.28,r=4+hash(P.T.cz|0,k)*8;palm(P.T.cx+Math.cos(a)*r,P.T.cz+Math.sin(a)*r,5+hash(k,2)*4,.08+hash(k,4)*.12,a);}}
  const lm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,side:THREE.DoubleSide}),tm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});
  const t=new THREE.Mesh(tr.build(),tm),f=new THREE.Mesh(fr.build(),lm);t.castShadow=f.castShadow=true;t.userData.dyn=f.userData.dyn=1;scene.add(t,f);return{t,f};})();

/* ---------- rock (Bryce's references: Forge World's grey cliffs with grass on their tops, the Cartographer's boulders on the sand):
   faceted stones of many sizes, strata in the rock, moss and grass on whatever faces the sky. Boulders on the beach and the parks,
   outcrops round the hills' crowns, big stacks on the two open corners of the island ---------- */
const ROCKS=(()=>{const mg=new Merger(),R1=C(0x8c857a),R2=C(0xa89f8e),R3=C(0x6c665e),MOSS=C(0x5f8a3e),tmp=new THREE.Color();let n=0;
  function rock(x,z,size,sq,seed,sink,obst){const g=new THREE.IcosahedronGeometry(1,size>4?2:1),P=g.attributes.position,sy=sq||.7;
    for(let i=0;i<P.count;i++){const vx=P.getX(i),vy=P.getY(i),vz=P.getZ(i),k=1+.38*(vnoise(vx*1.8+seed,vz*1.8+vy*1.3)-.5)+.18*(vnoise(vx*4+seed*3,vy*4)-.5);
      P.setXYZ(i,vx*k*size*(1+.25*Math.sin(seed)),Math.max(vy*k,-.35)*size*sy,vz*k*size);}
    g.computeVertexNormals();const N=g.attributes.normal,cols=[];
    for(let i=0;i<P.count;i++){const y=P.getY(i);tmp.copy(R1).lerp(R2,.5+.5*Math.sin(y*1.7+seed)).lerp(R3,clamp(-y/(size*sy)*.8,0,.6));if(N.getY(i)>.72&&size>1.2)tmp.lerp(MOSS,.75);cols.push(tmp.r,tmp.g,tmp.b);}
    g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
    const ry=seed*2.1,y=terrH(x,z)-size*sy*(sink==null?.25:sink);const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1));
    const ng=g.toNonIndexed?g:g;ng.applyMatrix4(m);mg.p.push(...ng.attributes.position.array);mg.n.push(...ng.attributes.normal.array);for(let i=0;i<ng.attributes.position.count;i++)mg.u.push(0,0);mg.c.push(...ng.attributes.color.array);n++;
    if(obst!==false&&size>.9&&edgeD(x,z)<GS.HALF+2)OBST.push({x,z,r:size*.85,h:size*sy*(1-(sink==null?.25:sink))*1.6,low:size<1.4});}
  // the beach: boulders along the sand, some in the shallows
  const RW=GS.HALF-8;for(let k=0;k<(coarse?40:64);k++){const side=k%4,u=hash(k,17)*1.84-.92,d=GS.HALF-22+hash(k,23)*60,x=side===0?u*RW:side===1?d:side===2?u*RW:-d,z=side===0?-d:side===1?u*RW:side===2?d:u*RW;
    if(GS.BASES.some(B=>Math.hypot(x-B.x,z-B.z)<B.r+26))continue;const sz=.5+Math.pow(hash(k,29),2.2)*3.2;rock(x,z,sz,.6+hash(k,31)*.3,k*1.37,.3);}
  // the parks: outcrops round each hill's crown, and stones in the grass
  for(const H of GS.HILLS){for(let k=0;k<7;k++){const a=k/9*Math.PI*2+hash(H.x|0,k)*.5,r=H.r*(.38+hash(k,H.z|0)*.18),x=H.x+Math.sin(a)*r,z=H.z+Math.cos(a)*r;
      rock(x,z,2.4+hash(k,5)*3.6,.75+hash(k,9)*.35,k*2.3+H.x,.3);}
    for(let k=0;k<8;k++){const a=hash(k,H.x|0)*6.28,r=H.r*(.15+hash(H.z|0,k)*.5);rock(H.x+Math.sin(a)*r,H.z+Math.cos(a)*r,.5+hash(k,3)*1.2,.6,k*.7,.35);}}
  // the open corners: big stacks of rock, half in the sea (Forge World's cliffs, the Cartographer's headland)
  for(const [cx,cz] of[[-(GS.HALF-6),-(GS.HALF-6)],[GS.HALF-6,GS.HALF-6]]){for(let k=0;k<10;k++){const a=hash(k,cx|0)*6.28,r=8+hash(cz|0,k)*40,x=cx+Math.sin(a)*r,z=cz+Math.cos(a)*r;
      rock(x,z,5+hash(k,41)*9,.9+hash(k,43)*.7,k*3.1+cx,.15);}}
  const m=new THREE.Mesh(mg.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:.02,flatShading:true}));m.castShadow=m.receiveShadow=true;m.userData.dyn=1;scene.add(m);return{n};})();

/* ---------- pines on the hills (Forge World), a few on the corners ---------- */
const PINES=(()=>{const mg=new Merger(),TR=C(0x5a4232),N1=C(0x2e5430),N2=C(0x3d6a3a),N3=C(0x284a2c);
  function pine(x,z,h){const y=terrH(x,z);mg.add(new THREE.CylinderGeometry(.22,.38,h*.45,6),M(x,y+h*.22,z),TR);
    for(let k=0;k<4;k++){const u=k/4,r=h*(.3-u*.06),ch=h*.36;mg.add(new THREE.ConeGeometry(r,ch,8),M(x,y+h*(.28+u*.19)+ch/2,z,0,k*.6,0),k%3===0?N1:k%3===1?N2:N3);}
    OBST.push({x,z,r:.5,h});}
  for(const H of GS.HILLS){const n=coarse?7:11;for(let k=0;k<n;k++){const a=hash(k,H.z|0)*6.28,r=H.r*(.45+hash(H.x|0,k)*.4),x=H.x+Math.sin(a)*r,z=H.z+Math.cos(a)*r;
    if(playD(x,z)>-2)continue;pine(x,z,7+hash(k,11)*7);}}
  for(const [cx,cz] of[[-(GS.HALF-34),-(GS.HALF-34)],[GS.HALF-34,GS.HALF-34]])for(let k=0;k<7;k++){const x=cx+(hash(k,cx|0)-.5)*60,z=cz+(hash(cz|0,k)-.5)*60;if(edgeD(x,z)<GS.HALF-4)pine(x,z,8+hash(k,2)*6);}
  const m=new THREE.Mesh(mg.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true}));m.castShadow=true;m.receiveShadow=true;m.userData.dyn=1;scene.add(m);})();

/* ---------- the shore structures (the Silent Cartographer's): grey Keeper-era stone and metal reaching out over the water from the
   beach, a long slab on a stepped pillar standing in the sea, a drum under it, light running along its edges ---------- */
const PIERS=(()=>{const mg=new Merger(),lg=new Merger(),S1=C(0xcfd2d0),S2=C(0xb2b6b6),S3=C(0x8e9294),Lc=C(0x9ff4ff);
  for(const [x0,z0,ox,oz] of[[-(GS.HALF-4),-52,-1,0],[26,-(GS.HALF-4),0,-1],[GS.HALF-4,74,1,0],[52,GS.HALF-4,0,1]]){const ry=Math.atan2(ox,oz),at=(u,v,y)=>new THREE.Vector3(x0+ox*u+oz*v,y,z0+oz*u-ox*v);
    const box=(u,v,y,w,h,d,col)=>{const p=at(u,v,y);mg.add(boxUV(w,h,d,3),M(p.x,p.y,p.z,0,ry,0),col);};
    // the landward block on the beach
    box(-2,0,3,14,9,14,S2);box(-2,0,8.2,15,1.4,15.5,S1);
    // the long slab, three layers stepped, out over the water
    box(28,0,11.6,64,3.2,12,S1);box(29,0,9.4,58,1.4,10,S2);box(30,0,13.8,50,1.2,9,S3);
    {const p=at(60,0,11.6);mg.add(new THREE.CylinderGeometry(6,6,3.2,20,1,false,0,Math.PI),M(p.x,p.y,p.z,0,ry,0),S1);}
    // the drum under it, and the stepped pillar in the sea
    {const p=at(20,0,5);mg.add(new THREE.CylinderGeometry(5.5,5.5,9,24),new THREE.Matrix4().makeTranslation(p.x,p.y,p.z).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(new THREE.Matrix4().makeRotationZ(Math.PI/2)),S1);}
    for(let k=0;k<5;k++){const w=k%2?7.5:9;box(48,0,-4+k*2.9,w,2.9,w,k%2?S3:S2);}
    // light along its edges
    for(const v of[-6.1,6.1]){const a=at(-4,v,12.6),b=at(58,v,12.6);_ga.subVectors(b,a);const L=_ga.length();_gq.setFromUnitVectors(_gz,_ga.normalize());_gb.addVectors(a,b).multiplyScalar(.5);_gm.compose(_gb,_gq,_gs.set(1,1,1));lg.add(new THREE.BoxGeometry(.18,.18,L),_gm.clone(),Lc);}
    const q=at(-2,0,0);OBST.push({x:q.x,z:q.z,r:9,h:9});}
  const m=new THREE.Mesh(mg.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.25,emissive:C(0x1c2024),emissiveIntensity:.5}));m.castShadow=m.receiveShadow=true;m.userData.dyn=1;scene.add(m);
  const l=new THREE.Mesh(lg.build(),new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.6,1.6,1.6),toneMapped:false}));l.userData.dyn=1;scene.add(l);})();

/* ---------- plazas: benches and planters (low cover you can shoot over), pillars (cover you can't); the spire at the heart ---------- */
function bench(x,z,ry,w){const y=terrH(x,z);PROPS.add(boxUV(w,1.1,1,2),M(x,y+.55,z,0,ry,0),K_W2);_ga.set(x-Math.cos(ry)*w*.46,y+1.12,z+Math.sin(ry)*w*.46);goldSeg(PROPG,_ga.clone(),_gb.set(x+Math.cos(ry)*w*.46,y+1.12,z-Math.sin(ry)*w*.46).clone(),.06);
  const n=Math.max(1,Math.round(w/1.4));for(let i=0;i<n;i++){const u=(i+.5)/n-.5;OBST.push({x:x+Math.cos(ry)*u*w,z:z-Math.sin(ry)*u*w,r:.7,h:1.2,bar:true});}
  BARS.push({ax:x-Math.cos(ry)*w/2,az:z+Math.sin(ry)*w/2,bx:x+Math.cos(ry)*w/2,bz:z-Math.sin(ry)*w/2,r:.7});}
function planter(x,z,r){const y=terrH(x,z);PROPS.add(new THREE.CylinderGeometry(r,r*1.08,1.1,18),M(x,y+.55,z),K_W2);PROPS.add(new THREE.CylinderGeometry(r*.92,r*.92,.12,18),M(x,y+1.08,z),C(0x5e8a3a));OBST.push({x,z,r:r+.1,h:1.1,low:true});}
function pillar(x,z,r,h){const y=terrH(x,z);const g=new THREE.CylinderGeometry(r*.82,r,h,16,3);PROPS.add(g,M(x,y+h/2,z),K_W);
  for(const yy of[h*.32,h*.36,h*.4]){const P=[];for(let k=0;k<=16;k++){const a=k/16*Math.PI*2,rr=lerp(r,r*.82,yy/h)+.08;P.push(new THREE.Vector3(x+Math.sin(a)*rr,y+yy,z+Math.cos(a)*rr));}for(let k=0;k<16;k++)goldSeg(PROPG,P[k],P[k+1],.1);}
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;goldSeg(PROPG,new THREE.Vector3(x+Math.sin(a)*(r+.05),y+h*.27,z+Math.cos(a)*(r+.05)),new THREE.Vector3(x+Math.sin(a)*(r*.95+.05),y+h*.45,z+Math.cos(a)*(r*.95+.05)),.08);}
  OBST.push({x,z,r:r+.1,h});}
for(const P of PLAZA){if(P.spire)continue;const T=P.T;for(let k=0;k<3;k++){const v=T.P[k],x=lerp(T.cx,v[0],.42),z=lerp(T.cz,v[1],.42),r=hash(k,x|0);
  if(r<.45)planter(x,z,1.2+r);else if(r<.8)bench(x,z,Math.atan2(v[0]-T.cx,v[1]-T.cz)+Math.PI/2,4+r*2);else pillar(x,z,.8,4.5);}}
// planters at some street crossings, out of the middle so the hogs get through
for(let j=-13;j<=13;j++)for(let i=-24;i<=24;i++){const [x,z]=LP(i,j);if(edgeD(x,z)>GS.HALF-60||hash(i+3,j-5)>.18)continue;if(Math.hypot(x,z)<70||GS.BASES.some(B=>Math.hypot(x-B.x,z-B.z)<B.r+40))continue;
  const a=hash(i,j)*6.28;planter(x+Math.cos(a)*5.2,z+Math.sin(a)*5.2,1.1);}
// the spire: a swelling white column with woven gold bands, a ring of pillars round its plaza
const SPIRE=(()=>{const y=terrH(0,0),h=46,n=24,g=new THREE.CylinderGeometry(4.2,9,h,n,10),P=g.attributes.position;
  for(let i=0;i<P.count;i++){const v=P.getY(i)/h+.5,k=1+.1*Math.sin(v*Math.PI);P.setX(i,P.getX(i)*k);P.setZ(i,P.getZ(i)*k);}g.computeVertexNormals();PROPS.add(g,M(0,y+h/2,0),K_W);
  const R=(yy)=>{const v=yy/h;return lerp(9,4.2,v)*(1+.1*Math.sin(v*Math.PI))+.12;};
  for(const yc of[8,22,36])for(const dy of[-1.2,0,1.2]){const yy=yc+dy,Q=[];for(let k=0;k<=n;k++){const a=k/n*Math.PI*2;Q.push(new THREE.Vector3(Math.sin(a)*R(yy),y+yy,Math.cos(a)*R(yy)));}for(let k=0;k<n;k++)goldSeg(PROPG,Q[k],Q[k+1],.26);}
  for(const yc of[8,22,36])for(let k=0;k<n;k+=2){const a=k/n*Math.PI*2;goldSeg(PROPG,new THREE.Vector3(Math.sin(a)*R(yc-2.6),y+yc-2.6,Math.cos(a)*R(yc-2.6)),new THREE.Vector3(Math.sin(a)*R(yc+2.6),y+yc+2.6,Math.cos(a)*R(yc+2.6)),.2);}
  OBST.push({x:0,z:0,r:10,h});
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2+Math.PI/6;pillar(Math.sin(a)*34,Math.cos(a)*34,1.1,7);}
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;bench(Math.sin(a)*22,Math.cos(a)*22,a+Math.PI/2,6);}
  return{h};})();
// hills: a low stone ring round each park's crown, a little cover up there
for(const H of GS.HILLS)for(let k=0;k<5;k++){const a=k/5*Math.PI*2+hash(H.x|0,k),r=H.r*.22;bench(H.x+Math.sin(a)*r,H.z+Math.cos(a)*r,a,5);}

/* ---------- the bases' walls (js/mp/03-match.js colours and furnishes them) ---------- */
for(const B of GS.BASES){const N=64,c=chunk(B.x,B.z),f=Math.atan2(B.fx,B.fz);
  for(let k=0;k<N;k++){const a=(k+.5)/N*Math.PI*2,x=B.x+Math.sin(a)*B.r,z=B.z+Math.cos(a)*B.r;if(baseWallD(B,x,z)<0)continue;
    const w=2*Math.PI*B.r/N+.4;c.w.add(boxUV(w,WALL_H+1.5,BWALL_T*2,3),M(x,B.y+(WALL_H-1.5)/2,z,0,a,0),k%2?K_W:K_W2);
    _ga.set(x+Math.sin(a)*(BWALL_T+.05),B.y+WALL_H-.6,z+Math.cos(a)*(BWALL_T+.05));goldSeg(c.g,_ga.clone().addScaledVector(_gb.set(Math.cos(a),0,-Math.sin(a)),-w/2),_ga.clone().addScaledVector(_gb.set(Math.cos(a),0,-Math.sin(a)),w/2),.2);}
  // the gates' pylons
  for(const g of[0,-.95,.95])for(const s of[-1,1]){const a=f+g+s*(GATE_HALF+1.6)/B.r,x=B.x+Math.sin(a)*B.r,z=B.z+Math.cos(a)*B.r;
    c.w.add(boxUV(3.2,WALL_H+4,3.2,3),M(x,B.y+(WALL_H+4)/2-.5,z,0,a,0),K_W);OBST.push({x,z,r:2,h:WALL_H+4});
    for(const dy of[-1,0,1])goldSeg(c.g,new THREE.Vector3(x-Math.cos(a)*1.65,B.y+WALL_H+1.5+dy*.7,z+Math.sin(a)*1.65),new THREE.Vector3(x+Math.cos(a)*1.65,B.y+WALL_H+1.5+dy*.7,z-Math.sin(a)*1.65),.14);}}

/* ---------- build the chunks ---------- */
for(const k in CH){const c=CH[k];
  for(const [mg,mat,sh] of[[c.w,stoneMat,true],[c.g,goldMat,false],[c.gl,glassMat,false],[c.ds,stoneDS,true],[c.t,trimMat,true],[c.cl,clothMat,true],[c.pl,leafMat,true],[c.wa,waterMat,false]]){if(!mg.p.length)continue;const m=new THREE.Mesh(mg.build(),mat);m.castShadow=sh;m.receiveShadow=true;m.userData.dyn=1;scene.add(m);}}
{const a=new THREE.Mesh(PROPS.build(),stoneMat),b=new THREE.Mesh(PROPG.build(),goldMat);a.castShadow=a.receiveShadow=true;a.userData.dyn=b.userData.dyn=1;scene.add(a,b);}

/* ---------- the bots' map: a graph on the street crossings (the lattice's points), each joined to its six neighbours where the street
   between them is clear, plus each base's middle and its three gates. NEXT[t*N+a] is the next node from a on the way to t. ---------- */
const NAV=(()=>{const nodes=[],nid={};
  const clear=(ax,az,bx,bz,m)=>{const L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(L/2));for(let k=0;k<=n;k++){const t=k/n;if(playD(ax+(bx-ax)*t,az+(bz-az)*t)>-(m==null?.6:m))return false;}return true;};
  for(let j=-14;j<=14;j++)for(let i=-26;i<=26;i++){const [x,z]=LP(i,j);if(edgeD(x,z)>GS.HALF-6||playD(x,z)>-1.5)continue;nid[i+','+j]=nodes.length;nodes.push({x,z,i,j,nb:[]});}
  const link=(a,b)=>{if(a===b||nodes[a].nb.includes(b))return;nodes[a].nb.push(b);nodes[b].nb.push(a);};
  for(const n of nodes)for(const [di,dj] of[[1,0],[0,1],[-1,1]]){const m=nid[(n.i+di)+','+(n.j+dj)];if(m!=null&&clear(n.x,n.z,nodes[m].x,nodes[m].z))link(nodes.indexOf(n),m);}
  for(const B of GS.BASES){const c=nodes.length;nodes.push({x:B.x,z:B.z,nb:[],base:B.team});B.node=c;const f=Math.atan2(B.fx,B.fz);
    for(const g of[0,-.95,.95]){const a=f+g,ix=B.x+Math.sin(a)*(B.r-14),iz=B.z+Math.cos(a)*(B.r-14),ox=B.x+Math.sin(a)*(B.r+14),oz=B.z+Math.cos(a)*(B.r+14);
      const gi=nodes.length;nodes.push({x:ix,z:iz,nb:[]});const go=nodes.length;nodes.push({x:ox,z:oz,nb:[]});link(c,gi);link(gi,go);
      const near=nodes.slice(0,c).map((n,k)=>[Math.hypot(n.x-ox,n.z-oz),k]).filter(q=>q[0]<110).sort((p,q)=>p[0]-q[0]);let made=0;
      for(const [,k] of near){if(clear(ox,oz,nodes[k].x,nodes[k].z)){link(go,k);if(++made>=3)break;}}}}
  // the islands of the graph that a terrace or a building cut off from the rest (none, usually) are left as they are
  const N=nodes.length,NEXT=new Int16Array(N*N).fill(-1),q=new Int32Array(N);
  for(let t=0;t<N;t++){const base=t*N;NEXT[base+t]=t;let h=0,e=0;q[e++]=t;while(h<e){const a=q[h++];for(const b of nodes[a].nb)if(NEXT[base+b]<0){NEXT[base+b]=a;q[e++]=b;}}}
  // nearest node with a clear walk to it, remembered on a 4 m grid
  const NG={};for(let k=0;k<N;k++){const key=Math.floor(nodes[k].x/64)+','+Math.floor(nodes[k].z/64);(NG[key]||(NG[key]=[])).push(k);}
  const memo=new Map();
  function nearest(x,z){const mk=Math.round(x/4)*100000+Math.round(z/4);const hit=memo.get(mk);if(hit!==undefined)return hit;
    const gx=Math.floor(x/64),gz=Math.floor(z/64),c=[];for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=NG[(gx+i)+','+(gz+j)];if(L)for(const k of L)c.push([Math.hypot(nodes[k].x-x,nodes[k].z-z),k]);}
    c.sort((p,q)=>p[0]-q[0]);let best=c.length?c[0][1]:-1;for(let k=0;k<Math.min(5,c.length);k++){if(clear(x,z,nodes[c[k][1]].x,nodes[c[k][1]].z,.3)){best=c[k][1];break;}}
    if(memo.size>40000)memo.clear();memo.set(mk,best);return best;}
  return{nodes,N,NEXT,nearest,clear};})();
GS.nav=NAV;GS.terrH=terrH;GS.playD=playD;GS.inDome=inDome;GS.BUILD=BUILD;GS.TERR=TERR;GS.edgeD=edgeD;GS.WALL_H=WALL_H;

/* ---------- light, dust (here: drifting pollen and sea spray in the sun) ---------- */
const helmLamp=new THREE.PointLight(C(0xffffff),0,10,1.5);scene.add(helmLamp);
function updateLights(dt,T,pos){CITY.t.value=T;skyU.uT.value=T;SEA.U.uT.value=T;FAR.update(T);}
const DUST_N=coarse?160:360,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,14),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.08,color:C(0xfff4dc),transparent:true,opacity:.35,depthWrite:false}));dust.userData.dyn=1;scene.add(dust);

let composer=null,HQ=true;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,stencilBuffer:true});   // (Oct 30: stencil gives the buffer 24-bit depth; at 16-bit, with the far plane out at 16 km for the mountains, the ground drew over the roofs and through the sea)
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.35,.4,.92));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
try{const q=localStorage.getItem('elyra.quality');if(q)HQ=q!=='low';}catch(_){}
function setQuality(hq){HQ=hq;try{localStorage.setItem('elyra.quality',hq?'high':'low');}catch(_){}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,hq?(coarse?1.6:1.75):(coarse?1.15:1)));renderer.shadowMap.enabled=true;
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
