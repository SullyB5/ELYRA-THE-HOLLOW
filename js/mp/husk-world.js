/* Elyra · Multiplayer · Husk — the world (Oct 30, Bryce: "two more maps ... another on something else"; picked from the ideas: the
   inside of a gutted Hollow ship, a breached hull with the nebula showing through, low gravity in the breached part; "try to go all out
   on the first try").

   A Voidclass cruiser of the Hollow, gutted and drifting over Astraea. Indoors, on two decks (the lower at 0, the upper at 7 m), the
   same turned half way round (x,z → -x,-z) so neither side has the better ground. 160 m long (x), 52 m across (z):
     the bays       blue's at the west end, red's at the east: tall rooms with a viewport onto space, a ramp up to a balcony and the
                    upper deck; the dome over each
     the spine      the upper deck's long corridor along the hull (blue's on the north side, red's on the south), windows onto Astraea
     the reactor    a tall round room each side with the ship's core still glowing in it, a ramp up to a ring round it
     the hold       the lower deck's cargo hold (blue's south, red's north): rows of Hollow pods, tight aisles
     the hangar     the middle: 44 by 48 m and 24 high, its roof torn open to space, its gravity plating gone (you jump four times as
                    high and fall slowly), galleries along both long walls, a gantry and catwalks across at the upper deck's height,
                    containers to jump onto, two of the ship's own fighters wrecked on the floor
   On foot only; eight a side.

   The plan is a 1 m grid of cells, each with what air it has: the lower deck from 0 up to its ceiling, the upper deck from 7 up to its
   ceiling, or one tall room all the way up. Every wall, doorway, railing, deck and ceiling is worked out from it, for walking and shots
   (S3, as in js/mp/01-world.js) and for what you see, and the bots' graph walks it on both decks. Units are metres; north is -z. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(1408);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.5:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
window.ELYRA_RENDERER=renderer;
$('app').appendChild(renderer.domElement);
MODELS.preload(['chars/keeper-footsoldier','rifle']);
window.WARM_TEAMS=[];window.WARM_POOL=.01;
window.HERALD_LIFT=null;
window.PLAYER_KIND='keeper-footsoldier';window.PLAYER_OPTS={tint:0x9ab8ff};

const scene=new THREE.Scene();
const HAZE_HEX=0x120e1c;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),.0085);scene.background=C(0x020205);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,30000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();
const lerp=(a,b,u)=>a+(b-a)*u;
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const mir=p=>[-p[0],-p[1]];
// the star (Astraea's sun), high over the hull: its light comes in through the breach and the windows
const starDir=new THREE.Vector3(.36,.8,-.48).normalize();

/* ---------- the plan ---------- */
const GS=(()=>{
  const HALF=82;
  const TEAMS={blue:{c:0x3f8cff,tint:0x9ab8ff,name:'BLUE'},red:{c:0xff4a3a,tint:0xffa496,name:'RED'},yellow:{c:0xffc83a,tint:0xffe39a,name:'YELLOW'},green:{c:0x3fe07a,tint:0xa8f0bc,name:'GREEN'}};
  const BASE_R=12;
  const BASES=[{team:'blue',x:-68,z:0},{team:'red',x:68,z:0}].map(B=>{B.fx=-Math.sign(B.x);B.fz=0;B.r=BASE_R;B.shieldR=12.8;B.spawnR=4;B.spawnStep=2.4;B.y=0;return B;});
  const CFG={id:'mphusk',name:'HUSK',sub:'Team deathmatch · derelict',air:false,vehicles:false,bots:8,score:50,time:10*60,see:75,range:72,hold:16,flashlights:false,beacon:false,domeK:.24,domeFog:false,
    brief:'TakeOver · team deathmatch. A Hollow cruiser, gutted and drifting over Astraea, two decks of it. Its hangar is open to space and its gravity there is gone: you jump four times as high and come down slowly. The rest of the ship still pulls you down.',
    objective:'Down the other side. Your bay has guns and ammo; nothing crosses its dome.'};
  return{HALF,HALFZ:26,SEA:-99,TEAMS,BASES,BASE_R,CFG,NAME:CFG.name};})();
const LZ={x:GS.BASES[0].x,z:GS.BASES[0].z,r:12};
function edgeD(x,z){return Math.max(Math.abs(x)-80,Math.abs(z)-24)+GS.HALF;}   // (the hull's box, given as the other maps give it: edgeD - HALF < 0 inside)

/* ---------- the floorplan: 1 m cells over x -82..82, z -28..28 ---------- */
const HX0=-82,HZ0=-28,HNX=164,HNZ=56,HN=HNX*HNZ,DECK=7,DECK_T=.4,UP_TOP=11.6;
const L0=new Uint8Array(HN),TOP0=new Float32Array(HN),L1=new Uint8Array(HN),TOP1=new Float32Array(HN),TALL=new Float32Array(HN),RAMP=new Int8Array(HN).fill(-1),ZONE=new Uint8Array(HN);
const hCell=(x,z)=>{const i=Math.floor(x-HX0),j=Math.floor(z-HZ0);return(i<0||j<0||i>=HNX||j>=HNZ)?-1:j*HNX+i;};
const hCx=c=>HX0+c%HNX+.5,hCz=c=>HZ0+Math.floor(c/HNX)+.5;
function hRect(r,fn){const [x0,x1,z0,z1]=r;for(let j=0;j<HNZ;j++){const cz=HZ0+j+.5;if(cz<z0||cz>=z1)continue;for(let i=0;i<HNX;i++){const cx=HX0+i+.5;if(cx<x0||cx>=x1)continue;fn(j*HNX+i,cx,cz);}}}
const hMirR=r=>[-r[1],-r[0],-r[3],-r[2]];
const hBoth=(r,fn)=>{hRect(r,fn);hRect(hMirR(r),fn);};
// zones (for colour, light and sound): 1 bay, 2 corridor, 3 reactor, 4 hangar, 5 hold, 6 spine
const H_ROOMS=[[[-80,-56,-13,13],14,1],[[-42,-24,-10,10],14,3],[[-22,22,-24,24],24,4]];
const H_CORR=[[[-56,-42,-3,3],4.6,2],[[-52,-48,3,6],4.6,2],[[-24,-22,-3,3],6.6,2],[[-54,-26,11,24],6,5],[[-56,-54,9,13],4.6,5],[[-36,-31,10,11],4.6,5],[[-26,-22,15,21],4.6,5]];
const H_DECKS=[[[-66,-56,-13,-8],1],[[-64,-60,-16,-13],6],[[-66,-22,-21,-15],6],[[-36,-30,-15,-10],6],[[-24,-22,-2,2],2],[[-22,22,-24,-18],4],[[-18,-14,-18,-15],4],[[-22,22,-2,2],4],[[-2,2,-18,-2],4]];
// ramps: rect, the axis they climb along, where their foot (0) and head (the deck, 7) are on it
const H_RAMPS=(()=>{const L=[{r:[-78,-66,-13,-10],a:-78,b:-66},{r:[-41,-29,7,10],a:-29,b:-41},{r:[-14,0,-18,-15],a:0,b:-14}];
  return[...L,...L.map(R=>({r:hMirR(R.r),a:-R.a,b:-R.b}))].map((R,k)=>Object.assign(R,{id:k,ax:'x'}));})();
const H_CORE=[{x:-33,z:0},{x:33,z:0}];
for(const [r,H,zn] of H_ROOMS)hBoth(r,c=>{L0[c]=1;TOP0[c]=H;TALL[c]=H;ZONE[c]=zn;});
for(const [r,top,zn] of H_CORR)hBoth(r,c=>{if(TALL[c])return;L0[c]=1;TOP0[c]=top;ZONE[c]=zn;});
for(const [r,zn] of H_DECKS)hBoth(r,c=>{L1[c]=1;TOP1[c]=TALL[c]||UP_TOP;if(!ZONE[c])ZONE[c]=zn;});
// the reactors' rings: the room's floor plan less the core's well and the hole the ramp comes up through
for(const K of H_CORE)hRect(K.x<0?[-42,-24,-10,10]:[24,42,-10,10],(c,cx,cz)=>{const X=K.x<0?cx:-cx,Z=K.x<0?cz:-cz;if(Math.hypot(cx-K.x,cz-K.z)<5)return;if(X>=-41&&X<-37&&Z>=7&&Z<10)return;L1[c]=1;TOP1[c]=TALL[c];});
for(const R of H_RAMPS)hRect(R.r,c=>{RAMP[c]=R.id;});
const hRampH=(R,x,z)=>DECK*clamp(((R.ax==='x'?x:z)-R.a)/(R.b-R.a),0,1);
const H_GRAV=(x,y,z)=>Math.abs(x)<22&&Math.abs(z)<24;

/* ---------- the contract for js/origin/03-play.js ---------- */
const OBST=[],BARS=[];
const H_STEP=.85;
const S3={walls:[],surfs:[],floors:[],G:{},C:6,st:0};
function s3Put(o,x0,z0,x1,z1){o.st=0;const Cc=S3.C;for(let i=Math.floor(x0/Cc);i<=Math.floor(x1/Cc);i++)for(let j=Math.floor(z0/Cc);j<=Math.floor(z1/Cc);j++){const k=i+','+j;(S3.G[k]||(S3.G[k]={w:[],s:[],f:[]}))[o.k3].push(o);}}
function s3Wall(ax,az,bx,bz,y0,y1,th,walk,los){const L=Math.hypot(bx-ax,bz-az);if(L<.05||y1-y0<.02)return null;const ux=(bx-ax)/L,uz=(bz-az)/L;
  const Rr={k3:'w',x:(ax+bx)/2,z:(az+bz)/2,ux,uz,hw:L/2,hd:th/2,y0,y1,walk:walk!==false,los:los!==false};
  const ex=Math.abs(ux)*Rr.hw+Math.abs(uz)*Rr.hd+1,ez=Math.abs(uz)*Rr.hw+Math.abs(ux)*Rr.hd+1;S3.walls.push(Rr);s3Put(Rr,Rr.x-ex,Rr.z-ez,Rr.x+ex,Rr.z+ez);return Rr;}
function s3Surf(inside,h,box){const S={k3:'s',inside,h};S3.surfs.push(S);s3Put(S,box[0],box[1],box[2],box[3]);return S;}
function s3Floor(inside,y,box){const F={k3:'f',inside,y0:y,gx:0,gz:0};S3.floors.push(F);s3Put(F,box[0],box[1],box[2],box[3]);return F;}
const s3Cell=(x,z)=>S3.G[Math.floor(x/S3.C)+','+Math.floor(z/S3.C)];
function rectLocal(Rr,x,z){const dx=x-Rr.x,dz=z-Rr.z;return[dx*Rr.ux+dz*Rr.uz,-dx*Rr.uz+dz*Rr.ux];}
function rectSD(Rr,x,z){const l=rectLocal(Rr,x,z),dx=Math.abs(l[0])-Rr.hw,dz=Math.abs(l[1])-Rr.hd;return Math.hypot(Math.max(dx,0),Math.max(dz,0))+Math.min(Math.max(dx,dz),0);}
function rectSeg(Rr,a,b){const la=rectLocal(Rr,a.x,a.z),lb=rectLocal(Rr,b.x,b.z);let t0=0,t1=1;
  for(const [p,q,h] of[[la[0],lb[0],Rr.hw],[la[1],lb[1],Rr.hd],[a.y,b.y,null]]){const d=q-p;let lo,hi;if(h===null){lo=Rr.y0;hi=Rr.y1;}else{lo=-h;hi=h;}
    if(Math.abs(d)<1e-9){if(p<lo||p>hi)return-1;continue;}let u=(lo-p)/d,v=(hi-p)/d;if(u>v){const w=u;u=v;v=w;}t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return-1;}
  return t0;}
function s3Frac(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,L=Math.hypot(dx,dz),st=++S3.st;let best=1;
  const n=Math.max(1,Math.ceil(L/(S3.C/3)));
  for(let k=0;k<=n;k++){const t=k/n,c=s3Cell(a.x+dx*t,a.z+dz*t);if(!c)continue;
    for(const Rr of c.w){if(Rr.st===st||!Rr.los)continue;Rr.st=st;const f=rectSeg(Rr,a,b);if(f>=0&&f<best)best=f;}
    for(const F of c.f){if(F.st===st)continue;F.st=st;if((a.y-F.y0)*(b.y-F.y0)>=0)continue;const f=(F.y0-a.y)/dy;if(f>=0&&f<best&&F.inside(a.x+dx*f,a.z+dz*f))best=f;}}
  return best;}
function s3Top(x,z){const c=s3Cell(x,z);let t=-1e9;if(!c)return t;for(const S of c.s)if(S.inside(x,z))t=Math.max(t,S.h(x,z)+.2);for(const Rr of c.w)if(rectSD(Rr,x,z)<0)t=Math.max(t,Rr.y1);return t;}
// the lower deck is the ground: 0 everywhere in the ship
function terrH(x,z){return 0;}
function groundY(x,z){return 0;}
function meshY(x,z){return 0;}
// the floor under someone standing at height y: the lower deck, a ramp, the upper deck, a container's top
function floorY3(x,z,y){let best=0;const c=hCell(x,z);
  if(c>=0){if(RAMP[c]>=0){const h=hRampH(H_RAMPS[RAMP[c]],x,z);if(h<=y+H_STEP&&h>best)best=h;}if(L1[c]&&DECK<=y+H_STEP&&DECK>best)best=DECK;}
  const s=s3Cell(x,z);if(s)for(const S of s.s)if(S.inside(x,z)){const h=S.h(x,z);if(h<=y+H_STEP&&h>best)best=h;}
  return best;}
// distance outside where you can be at height y (negative inside): the hull's box and every wall, railing and wedge in S3
function playD3(x,z,y){const yb=Math.max(y==null?-1e9:y,0);let d=Math.max(Math.abs(x)-79.6,Math.abs(z)-23.6);
  const c=s3Cell(x,z);if(c)for(const Rr of c.w){if(!Rr.walk||Rr.y0>yb+1.75||Rr.y1<yb+.35)continue;d=Math.max(d,-rectSD(Rr,x,z));}
  if(y==null){const k=hCell(x,z);if(k<0||!L0[k])d=Math.max(d,.5);}
  return d;}
function playD(x,z){return playD3(x,z,null);}
function camClamp(head){const c=camera.position,g=floorY3(c.x,c.z,c.y)+.3;if(c.y<g)c.y=g;}
function gravAt(x,y,z){return H_GRAV(x,y,z)?.3:1;}
const ROAD_LEN=1,SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0,BARRIERS=[],BLOCKS=[];
const _rp=new THREE.Vector3();
function roadS(x,z){return 0;}function roadPt(s,out){return(out||_rp).set(LZ.x,0,LZ.z);}function roadN(s){return{x:1,z:0};}
function latOf(x,z){return 0;}function laneC(s){return 0;}function laneHalf(s){return 400;}function spineAt(s){return false;}function barrier(id){return null;}
const BLEN=0;function belowD(){return 1;}function belowS(){return 0;}function belowPt(s,o){return(o||new THREE.Vector3());}function belowFloor(){return 0;}
const HOLLOW_GLOW=0xff6a5a,HOST_GLOW=0xa45cff;
function inDome(B,p){return Math.hypot(p.x-B.x,(p.y||0)-B.y,p.z-B.z)<B.shieldR;}
function losBlock(a,b){for(const B of GS.BASES)if(inDome(B,a)!==inDome(B,b))return true;return s3Frac(a,b)<1;}
GS.terrH=terrH;GS.playD=playD;GS.edgeD=edgeD;GS.inDome=(B,p)=>inDome(B,p);GS.s3Frac=s3Frac;GS.s3Top=s3Top;GS.floorY3=(x,z,y)=>floorY3(x,z,y);GS.TERR=[];GS.gravAt=gravAt;

/* ---------- the walls, from the plan: along every edge between two cells, the heights where one side has air and the other doesn't
   become wall. Runs of edges with the same heights are merged into one wall. Railings where a deck looks out over a tall room's air
   (not where a ramp comes up to it) ---------- */
function hAir(c){const L=[];if(c<0)return L;if(L0[c])L.push([0,TOP0[c]]);if(L1[c]&&!TALL[c])L.push([DECK,TOP1[c]]);return L;}
function hXor(A,B){const pts=new Set([0]);for(const [a,b] of A.concat(B)){pts.add(a);pts.add(b);}const P=[...pts].sort((p,q)=>p-q),out=[];
  const inn=(L,y)=>L.some(([a,b])=>y>a&&y<b);
  for(let k=0;k<P.length-1;k++){const m=(P[k]+P[k+1])/2;const ia=inn(A,m),ib=inn(B,m);if(ia!==ib){const side=ia?0:1;if(out.length&&out[out.length-1][1]===P[k]&&out[out.length-1][2]===side)out[out.length-1][1]=P[k+1];else out.push([P[k],P[k+1],side]);}}
  return out;}
const H_WALLS=[],H_RAILS=[];   // {ax,az,bx,bz,y0,y1,side, zone, along}
{const key=L=>L.map(q=>q.join(':')).join('|');
 // edges along x (between rows j-1 and j): wall line z = HZ0+j, running in x
 for(let j=0;j<=HNZ;j++){let run=null;const flush=()=>{if(run){for(const [y0,y1,side] of run.L)H_WALLS.push({ax:run.x0,az:HZ0+j,bx:run.x1,bz:HZ0+j,y0,y1,side,zone:run.zone,dir:'x'});run=null;}};
   for(let i=0;i<HNX;i++){const a=j>0?(j-1)*HNX+i:-1,b=j<HNZ?j*HNX+i:-1,L=hXor(hAir(a),hAir(b)),k=key(L),zone=Math.max(a>=0?ZONE[a]:0,b>=0?ZONE[b]:0);
     if(!L.length){flush();continue;}if(run&&run.k===k){run.x1=HX0+i+1;continue;}flush();run={k,L,x0:HX0+i,x1:HX0+i+1,zone};}
   flush();}
 for(let i=0;i<=HNX;i++){let run=null;const flush=()=>{if(run){for(const [y0,y1,side] of run.L)H_WALLS.push({ax:HX0+i,az:run.z0,bx:HX0+i,bz:run.z1,y0,y1,side,zone:run.zone,dir:'z'});run=null;}};
   for(let j=0;j<HNZ;j++){const a=i>0?j*HNX+i-1:-1,b=i<HNX?j*HNX+i:-1,L=hXor(hAir(a),hAir(b)),k=key(L),zone=Math.max(a>=0?ZONE[a]:0,b>=0?ZONE[b]:0);
     if(!L.length){flush();continue;}if(run&&run.k===k){run.z1=HZ0+j+1;continue;}flush();run={k,L,z0:HZ0+j,z1:HZ0+j+1,zone};}
   flush();}
 // railings: a deck cell next to a tall room's cell that has no deck (and isn't a ramp's top)
 const rail=(a,b)=>{if(a<0||b<0)return false;if(!(L1[a]&&!L1[b]&&TALL[b]))return false;if(RAMP[b]>=0&&hRampH(H_RAMPS[RAMP[b]],hCx(b),hCz(b))>5.6)return false;return true;};
 for(let j=1;j<HNZ;j++){let r0=null;for(let i=0;i<=HNX;i++){const a=(j-1)*HNX+i,b=j*HNX+i,on=i<HNX&&(rail(a,b)||rail(b,a));if(on&&r0==null)r0=i;if(!on&&r0!=null){H_RAILS.push({ax:HX0+r0,az:HZ0+j,bx:HX0+i,bz:HZ0+j});r0=null;}}}
 for(let i=1;i<HNX;i++){let r0=null;for(let j=0;j<=HNZ;j++){const a=j*HNX+i-1,b=j*HNX+i,on=j<HNZ&&(rail(a,b)||rail(b,a));if(on&&r0==null)r0=j;if(!on&&r0!=null){H_RAILS.push({ax:HX0+i,az:HZ0+r0,bx:HX0+i,bz:HZ0+j});r0=null;}}}}
for(const W of H_WALLS)s3Wall(W.ax,W.az,W.bx,W.bz,W.y0-.02,W.y1+.02,.4,true,true);
for(const R of H_RAILS)s3Wall(R.ax,R.az,R.bx,R.bz,DECK-.05,DECK+1.1,.12,true,false);
// the decks: you stand on them, shots don't go through them
{const ins=(x,z)=>{const c=hCell(x,z);return c>=0&&L1[c]===1;};s3Floor(ins,DECK-.2,[-82,-28,82,28]);}
// the ramps' solid undersides: a wedge you can walk up but not under (in steps, each a little under the ramp above it)
for(const R of H_RAMPS){const [x0,x1,z0,z1]=R.r,n=8;for(let k=0;k<n;k++){const u0=k/n,u1=(k+1)/n,xa=lerp(x0,x1,u0),xb=lerp(x0,x1,u1),h=Math.min(hRampH(R,xa,0),hRampH(R,xb,0));if(h<.5)continue;
  s3Wall(xa,(z0+z1)/2,xb,(z0+z1)/2,-.2,h-.5,z1-z0-.1,true,true);}}

/* ---------- the furniture of the fight: containers in the hangar (their tops are floors, for the low gravity), a platform under the
   gantry's crossing, the hold's pods, crates and a half-shut blast door in the corridors, the cores. One half laid out, the other its
   twin ---------- */
const H_BOXES=[];   // {x,z,ry,l,w,h,top,kind}
function hBox(x,z,ry,l,w,h,kind,standable){for(const q of[1,-1]){const X=x*q,Z=z*q,c=Math.cos(ry),s=Math.sin(ry),ux=c,uz=-s;
  s3Wall(X-ux*l/2,Z-uz*l/2,X+ux*l/2,Z+uz*l/2,-.1,h,w,true,true);
  if(standable)s3Surf((px,pz)=>{const dx=px-X,dz=pz-Z,a=dx*ux+dz*uz,b=-dx*uz+dz*ux;return Math.abs(a)<=l/2+.05&&Math.abs(b)<=w/2+.05;},()=>h,[X-l,Z-l,X+l,Z+l]);
  H_BOXES.push({x:X,z:Z,ry,l,w,h,kind});}}
// the hangar: containers (some stacked two high), the lift platform
for(const [x,z,ry,st] of[[-16,-9,0,2],[-10,9,Math.PI/2,1],[-17,13,0,1],[-7,-11,Math.PI/2,1],[-19,4,Math.PI/2,1],[-12,20,0,2],[-4,15,.3,1]])hBox(x,z,ry,6,2.6,2.6*st,'container',true);
hBox(0,0,0,6,6,3.2,'platform',true);
// the hold's pods in rows, gaps for the cross aisles
for(const [x0,x1] of[[-52,-46],[-42,-38],[-34,-28]])for(const z of[14.5,19.5])hBox((x0+x1)/2,z,0,x1-x0,2.2,2.6,'pods',false);
// the corridors: crates, the bay's own crates, the half-shut blast door in the main corridor, the spine's fallen beam and crates
for(const [x,z,ry,l,w,h] of[[-45,-1.6,.2,1.6,1.4,1.2],[-61,9,.4,1.6,1.4,1.2],[-74,8,0,2,1.6,1.4],[-73,-5,.3,1.6,1.4,1.2],[-30,22,0,1.6,1.6,1.4],[-50,22.5,0,2,1.4,1.2]])hBox(x,z,ry,l,w,h,'crate',false);
hBox(-48.2,-1.6,0,.5,2.8,4.6,'door',false);
for(const [x,z,ry,l,w,h] of[[-56,-18,0,1.6,1.4,1.2],[-44,-16.2,.2,2,1.4,1.2],[-28,-19.8,0,1.6,1.4,1.2]]){for(const q of[1,-1]){const X=x*q,Z=z*q,ux=Math.cos(ry),uz=-Math.sin(ry);s3Wall(X-ux*l/2,Z-uz*l/2,X+ux*l/2,Z+uz*l/2,DECK-.1,DECK+h,w,true,true);H_BOXES.push({x:X,z:Z,ry,l,w,h,kind:'crate',y:DECK});}}
for(const K of H_CORE)OBST.push({x:K.x,z:K.z,r:3,h:14});
// the hangar's tanks (round, chest-high to head-high)
for(const [x,z,r,h] of[[-20,-14,1.1,2.2],[-20,-16.5,1.1,2.2],[-14,-21,1.3,3],[ -3,21.5,1.1,2.2]])for(const q of[1,-1]){OBST.push({x:x*q,z:z*q,r:r+.05,h});H_BOXES.push({x:x*q,z:z*q,r,h,kind:'tank'});}

/* ---------- materials ---------- */
const TEXL=new THREE.TextureLoader(),TSUF=coarse?'phone':'pc';
function ldTex(n,srgb,rep){const t=TEXL.load('img/tex/'+n+'-'+TSUF+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=coarse?2:8;if(srgb)t.encoding=THREE.sRGBEncoding;return t;}
// what the metal reflects: a dark cube of the nebula's colours, the star bright on one side (painted on canvases, mipmapped)
const ENV=(()=>{const N=64,faces=[];
  const col=(x,y,z)=>{const l=Math.hypot(x,y,z);x/=l;y/=l;z/=l;let r=.03+.06*sstep(-.2,.8,y),g=.025+.035*sstep(-.2,.8,y),b=.05+.07*sstep(-.2,.8,y);
    const n=.5+.5*Math.sin(x*3.1+z*2.3)*Math.cos(y*2.7);r+=.1*n*sstep(0,.6,y);g+=.06*n*sstep(0,.6,y);
    const s0=Math.max(0,x*starDir.x+y*starDir.y+z*starDir.z);r+=Math.pow(s0,8)*.7+Math.pow(s0,120)*3;g+=Math.pow(s0,8)*.5+Math.pow(s0,120)*2.6;b+=Math.pow(s0,8)*.3+Math.pow(s0,120)*2.2;
    return[r,g,b].map(v=>Math.round(255*Math.pow(clamp(v,0,1),1/2.2)));};
  for(let f=0;f<6;f++){const cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d'),im=x.createImageData(N,N);
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=(i+.5)/N*2-1,v=(j+.5)/N*2-1;let d;
      switch(f){case 0:d=[1,-v,-u];break;case 1:d=[-1,-v,u];break;case 2:d=[u,1,v];break;case 3:d=[u,-1,-v];break;case 4:d=[u,-v,1];break;default:d=[-u,-v,-1];}
      const c=col(d[0],d[1],d[2]),o=(j*N+i)*4;im.data[o]=c[0];im.data[o+1]=c[1];im.data[o+2]=c[2];im.data[o+3]=255;}
    x.putImageData(im,0,0);faces.push(cv);}
  const t=new THREE.CubeTexture(faces);t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;return t;})();
const M015=ldTex('metal015',true),M015N=ldTex('metal015-n'),M039=ldTex('metal039',true),M039N=ldTex('metal039-n');
const hWallMat=new THREE.MeshStandardMaterial({vertexColors:true,map:M015,normalMap:M015N,normalScale:new THREE.Vector2(.8,.8),roughness:.5,metalness:.28,envMap:ENV,envMapIntensity:1.3});
const hFloorMat=new THREE.MeshStandardMaterial({vertexColors:true,map:M039,normalMap:M039N,normalScale:new THREE.Vector2(.9,.9),roughness:.48,metalness:.32,envMap:ENV,envMapIntensity:1.2});
const hDarkMat=new THREE.MeshStandardMaterial({vertexColors:true,map:M015,normalMap:M015N,roughness:.56,metalness:.3,envMap:ENV,envMapIntensity:1});
const hDebrisMat=hDarkMat.clone();   // (instanced: no panel pass, its world position isn't the instance's)
/* the panelling (Nov 8, "only needs better graphics"): a painted height field of plates, seams, rivets, vents, insets and (on the
   floors) tread and grating, turned into a normal map (rgb) and a seam/grime shade (a), laid over Bryce's metals in the shader; walls
   also darken toward their feet and the decks (contact grime) */
function hPanelTex(N,floor){const H=new Float32Array(N*N),A=new Float32Array(N*N),D=new Uint8Array(N*N*4);
  const P=floor?[[0,.5,0,.5,'tread'],[.5,1,0,.5,'plain'],[0,.5,.5,1,'plain'],[.5,1,.5,1,'grate']]
    :[[0,.5,0,.18,'vent'],[.5,1,0,.18,'plain'],[0,.5,.18,.62,'inset'],[.5,1,.18,.62,'plain'],[0,1,.62,.665,'band'],[0,.5,.665,1,'plain'],[.5,1,.665,1,'inset']];
  const k=N/512,bev=5*k,rv=(x,y,sp,ins)=>{const d=x-ins;return Math.hypot(d,((y+sp/2)%sp)-sp/2);};
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=(i+.5)/N,v=(j+.5)/N;let pi=0;for(;pi<P.length-1;pi++){const p=P[pi];if(u>=p[0]&&u<p[1]&&v>=p[2]&&v<p[3])break;}
    const [u0,u1,v0,v1,ty]=P[pi],du=Math.min(u-u0,u1-u)*N,dv=Math.min(v-v0,v1-v)*N,e=Math.min(du,dv);
    let h=sstep(1.5*k,1.5*k+bev,e),a=.5+.5*sstep(.5*k,3.5*k,e);
    if(ty==='inset'){const e2=e-20*k;h-=.55*sstep(0,3*k,e2);if(e2>-1.5*k&&e2<1.5*k)a*=.82;}
    else if(ty==='vent'&&e>9*k){const s=(j%Math.max(3,Math.round(9*k)))/Math.max(3,Math.round(9*k));h*=s<.45?.15:1;a*=s<.45?.4:1;}
    else if(ty==='band'){h=.35+.3*sstep(1.5*k,3*k,e);a*=.78;}
    else if(ty==='grate'&&e>7*k){const gi=i%Math.round(12*k),gj=j%Math.round(26*k);if(gi<Math.round(6*k)&&gj>Math.round(4*k)){h=.05;a*=.28;}}
    else if(ty==='tread'&&e>6*k){const s=16*k,x=(i%s)-s/2,y=(j%s)-s/2,dr=((Math.floor(i/s)+Math.floor(j/s))&1)?1:-1,dd=Math.abs(x*.7071+dr*y*.7071),ll=Math.abs(x*.7071-dr*y*.7071);
      h+=.4*sstep(1.8*k,.7*k,dd)*sstep(5*k,3.5*k,ll);}
    // rivets along the edges
    if(ty!=='band'){const ins=7*k,sp=40*k;let r=Math.min(rv(du,v*N,sp,ins),rv(dv,u*N,sp,ins));if(r<2.6*k){h+=.5*Math.sqrt(1-r*r/(6.76*k*k));a*=1.12;}}
    a*=.9+.12*hash(pi,floor?11:5);a*=.9+.13*vnoise(u*22,v*22);
    if(!floor)a*=1-.2*sstep(16*k,0,(v-v0)*N)*vnoise(u*45,v*3+pi);   // streaks of grime pooled at each plate's foot
    else a*=1-.12*sstep(.55,.85,vnoise(u*9+3,v*9));
    H[j*N+i]=h;A[j*N+i]=a;}
  const s=1.4/k;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const l=H[j*N+(i+N-1)%N],r=H[j*N+(i+1)%N],d=H[((j+N-1)%N)*N+i],u=H[((j+1)%N)*N+i];
    let nx=(l-r)*s,ny=(d-u)*s,nz=1;const L=Math.hypot(nx,ny,nz);nx/=L;ny/=L;nz/=L;const o=(j*N+i)*4;
    D[o]=Math.round((nx*.5+.5)*255);D[o+1]=Math.round((ny*.5+.5)*255);D[o+2]=Math.round((nz*.5+.5)*255);D[o+3]=Math.round(clamp(A[j*N+i],0,1)*255);}
  const t=new THREE.DataTexture(D,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;
  t.generateMipmaps=true;t.anisotropy=coarse?2:8;t.needsUpdate=true;return t;}
function hDetail(mat,tex,scale,grime,str){
  mat.onBeforeCompile=sh=>{sh.uniforms.pdMap={value:tex};sh.uniforms.pdK={value:new THREE.Vector3(scale,grime,str)};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPdW;varying float vPdN;')
      .replace('#include <project_vertex>','#include <project_vertex>\nvPdW=(modelMatrix*vec4(transformed,1.0)).xyz;vPdN=abs(normalize((modelMatrix*vec4(objectNormal,0.0)).xyz).y);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D pdMap;uniform vec3 pdK;varying vec3 vPdW;varying float vPdN;')
      .replace('#include <map_fragment>','#include <map_fragment>\nvec4 pdT=texture2D(pdMap,vUv*pdK.x);float pdFy=vPdW.y<6.9?vPdW.y:vPdW.y-7.0;float pdG=mix(1.0,mix(.38,1.0,smoothstep(0.0,1.2,pdFy)),pdK.y*(1.0-vPdN));float pdOn=step(.001,pdK.x);diffuseColor.rgb*=mix(1.0,pdT.a,pdOn)*pdG;')
      .replace('vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;','vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;vec3 pdN=pdT.xyz*2.0-1.0;mapN=vec3(mapN.xy*.55+pdN.xy*pdK.z,mapN.z);')
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor*mix(1.0,1.45-pdT.a*.5,pdOn),.06,1.0);');};}
const PANEL_W=hPanelTex(coarse?256:512,false),PANEL_F=hPanelTex(coarse?256:512,true);
hDetail(hWallMat,PANEL_W,1,1,1.15);hDetail(hFloorMat,PANEL_F,1,0,1.1);hDetail(hDarkMat,PANEL_W,0,.8,0);
// pipes and conduits: glossier metal; the Hollow's bone ribs: smoother, a little sheen
const hPipeMat=new THREE.MeshStandardMaterial({vertexColors:true,map:M015,normalMap:M039N,normalScale:new THREE.Vector2(.35,.35),roughness:.3,metalness:.78,envMap:ENV,envMapIntensity:1.7});
const hBoneMat=new THREE.MeshStandardMaterial({vertexColors:true,map:M015,normalMap:M015N,normalScale:new THREE.Vector2(.5,.5),roughness:.38,metalness:.12,envMap:ENV,envMapIntensity:1.1});
const hLampMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
const hGlassMat=new THREE.MeshStandardMaterial({color:C(0x1c2638),transparent:true,opacity:.22,roughness:.04,metalness:.9,envMap:ENV,envMapIntensity:2.2,depthWrite:false,side:THREE.DoubleSide});
const stoneMat=hDarkMat;   // (js/mp/03-match.js: the beacon, which this map doesn't have)
const tmpC=new THREE.Color();
const K_WALL=C(0xbab2ca),K_WALL2=C(0x988fab),K_WALLD=C(0x625b70),K_FLOOR=C(0xb4b4c0),K_TRIM=C(0x423d4e),K_BONE=C(0xcabfb2),K_HULL=C(0x8e889c);
const G_VIO=C(0xa45cff).multiplyScalar(1.7),G_RED=C(0xff5a4a).multiplyScalar(1.6),G_AMB=C(0xffb060).multiplyScalar(1.15),G_WHITE=C(0xdfe6ff).multiplyScalar(1.5);
function hMesh(g,mat,shadow,recv){const m=new THREE.Mesh(g,mat);m.castShadow=!!shadow;m.receiveShadow=recv!==false;m.userData.dyn=1;scene.add(m);return m;}
const hbx=(w,h,d,u)=>boxUV(w,h,d,u||2.5);

/* ---------- space: the nebula all round, Astraea below and to the north, the star, two of the Hollow's cruisers holding off, and
   wreckage tumbling past outside ---------- */
const skyGroup=new THREE.Group();skyGroup.userData.dyn=1;scene.add(skyGroup);
SKIES.dome(skyGroup,15000,'astraea',{full:true,exp:1.25});
{// the star
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xfff0d8).multiplyScalar(5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));sp.position.copy(starDir).multiplyScalar(12000);sp.scale.setScalar(900);sp.renderOrder=-2;skyGroup.add(sp);
 const sp2=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffc890).multiplyScalar(1.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));sp2.position.copy(sp.position);sp2.scale.setScalar(3800);sp2.renderOrder=-2;skyGroup.add(sp2);}
{// Astraea: ochre and rust continents, dark seas, cloud, a thin blue rim of atmosphere, lit from the star's side
 const U={sd:{value:starDir}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.ShaderMaterial({uniforms:U,fog:false,depthWrite:false,
  vertexShader:'varying vec3 vN;varying vec3 vP;varying vec3 vV;void main(){vN=normalize(mat3(modelMatrix)*normal);vP=position;vec4 w=modelMatrix*vec4(position,1.0);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`varying vec3 vN;varying vec3 vP;varying vec3 vV;uniform vec3 sd;
    float hs(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float ns(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fb(vec3 p){float s=0.0,a=.5;for(int i=0;i<6;i++){s+=ns(p)*a;p=p*2.07+vec3(1.7,-3.1,2.3);a*=.5;}return s;}
    void main(){vec3 p=normalize(vP),n=normalize(vN);float land=smoothstep(.47,.53,fb(p*2.2));float rid=fb(p*9.0);
      vec3 c=mix(vec3(.05,.09,.14),mix(vec3(.62,.38,.2),vec3(.82,.66,.42),rid),land);c=mix(c,vec3(.92,.9,.86),smoothstep(.75,.9,abs(p.y))*.85);
      float cl=smoothstep(.55,.75,fb(p*4.0+vec3(3.0,0.0,1.0)));c=mix(c,vec3(.95,.94,.92),cl*.75);
      float l=dot(n,sd),lit=smoothstep(-.08,.25,l);float rim=pow(1.0-max(dot(n,vV),0.0),3.0);
      vec3 col=c*lit*1.25+vec3(.35,.55,1.0)*rim*smoothstep(-.3,.3,l)*.9+vec3(.6,.25,.08)*smoothstep(.05,-.05,l)*smoothstep(-.25,0.0,l)*.4;
      gl_FragColor=vec4(col,1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`}));
 m.position.set(.25,-.5,-.83).normalize().multiplyScalar(11000);m.scale.setScalar(4200);m.rotation.set(.3,.8,.1);m.renderOrder=-2;skyGroup.add(m);}
function skyFollow(){skyGroup.position.copy(camera.position);}
// the Hollow's cruisers, holding off the derelict (their own models when they arrive)
{for(const [x,y,z,yaw,len] of[[-1400,-180,-2200,.6,700],[1900,260,-1600,2.4,560],[-900,420,2600,-1.2,620]]){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=yaw;g.userData.dyn=1;scene.add(g);
  MODELS.swapShip(g,'voidclass',{len,glow:.06,fog:false,hide:[]}).then(m=>{if(m){m.traverse(o=>{o.userData.dyn=1;if(o.material)o.material.fog=false;});}});
  for(const k of[-1,1]){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(HOST_GLOW).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));sp.position.set(k*len*.1,0,len*.48);sp.scale.setScalar(len*.12);g.add(sp);}}}
// wreckage outside: plates, beams and chunks tumbling slowly round the hull (Nov 8: twice as many, three shapes)
function hColG(g){g=g.index?g.toNonIndexed():g;g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(g.attributes.position.count*3).fill(1),3));return g;}
// an I-beam (1 long on x): web and two flanges
const H_IBEAM=(()=>{const mg=new Merger(),w=C(0xffffff);mg.add(new THREE.BoxGeometry(1,.7,.12),M(0,0,0),w);mg.add(new THREE.BoxGeometry(1,.1,.6),M(0,.35,0),w);mg.add(new THREE.BoxGeometry(1,.1,.6),M(0,-.35,0),w);return mg.build();})();
// a ribbed plate (1 x 1 on x/z): a skin and three stiffeners under it
const H_RPLATE=(()=>{const mg=new Merger(),w=C(0xffffff);mg.add(boxUV(1,.25,1,1),M(0,0,0),w);for(const z of[-.33,0,.33])mg.add(new THREE.BoxGeometry(1,.6,.06),M(0,-.35,z),w);return mg.build();})();
function hTumblers(specs,box,keep){const all=[],ms=[],o=new THREE.Object3D();
  for(const [geo,n,mk] of specs){const m=new THREE.InstancedMesh(hColG(geo),hDebrisMat,n);m.userData.dyn=1;m.frustumCulled=false;scene.add(m);const D=[];
    for(let i=0;i<n;i++){const d=mk(i);D.push(d);const c=.55+.5*hash(i,n);m.setColorAt(i,tmpC.setRGB(c,c*.97,c*1.03));}if(m.instanceColor)m.instanceColor.needsUpdate=true;ms.push([m,D]);}
  function update(dt){for(const [m,D] of ms){for(let i=0;i<D.length;i++){const d=D[i];d.p.addScaledVector(d.v,dt);if(keep)keep(d);d.r.x+=d.w.x*dt;d.r.y+=d.w.y*dt;d.r.z+=d.w.z*dt;
    o.position.copy(d.p);o.rotation.copy(d.r);o.scale.copy(d.s);o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.instanceMatrix.needsUpdate=true;}}
  update(0);return{update,meshes:ms.map(q=>q[0])};}
const H_DEBRIS=(()=>{const N=coarse?90:300;
  const out=()=>{const a=R(0,6.28),r=R(70,460),y=R(-160,180),p=new THREE.Vector3(Math.cos(a)*r*1.4,y,Math.sin(a)*r);if(Math.abs(p.x)<95&&Math.abs(p.z)<40&&Math.abs(p.y)<30)p.y+=60*Math.sign(p.y||1);return p;};
  const mk=sc=>()=>({p:out(),s:sc(),r:new THREE.Euler(R(0,6),R(0,6),R(0,6)),w:new THREE.Vector3(R(-.1,.1),R(-.1,.1),R(-.1,.1)),v:new THREE.Vector3(R(-.4,.4),R(-.15,.15),R(-.4,.4))});
  return hTumblers([[new THREE.BoxGeometry(1,1,1),Math.round(N*.45),mk(()=>new THREE.Vector3(R(1,9),R(.2,1.2),R(1,6)))],
    [H_RPLATE.clone(),Math.round(N*.3),mk(()=>{const k=R(2,10);return new THREE.Vector3(k,R(.6,1.4),k*R(.4,.9));})],
    [H_IBEAM.clone(),Math.round(N*.25),mk(()=>{const k=R(.6,2.2);return new THREE.Vector3(R(5,24),k,k);})]]);})();

/* ---------- light: the star through the breach and the windows (the hull's walls and ceilings throw its shadows), a dim violet
   ambience, the cores, the bays' own colour, the hangar's red emergency lamps ---------- */
const hemi=new THREE.HemisphereLight(C(0x7a6a9c),C(0x2c2636),1.55);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(C(0xffdcb0),2.2);scene.add(keyLight,keyLight.target);
keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:4096,coarse?1024:4096);
Object.assign(keyLight.shadow.camera,{left:-95,right:95,top:95,bottom:-95,near:10,far:700});keyLight.shadow.bias=-.0008;keyLight.shadow.normalBias=.08;
keyLight.position.copy(starDir).multiplyScalar(300);keyLight.target.position.set(0,0,0);
function followSun(p){}
let lookName='space';function setLook(){}
const helmLamp=new THREE.PointLight(C(0xffffff),0,10,1.5);scene.add(helmLamp);
const H_LIGHTS=[];
for(const K of H_CORE){const L=new THREE.PointLight(C(0xb46aff),2.6,30,1.6);L.position.set(K.x,6,K.z);scene.add(L);H_LIGHTS.push({L,base:2.6,kind:'core'});}
for(const B of GS.BASES){const L=new THREE.PointLight(C(GS.TEAMS[B.team].c),1.8,26,1.6);L.position.set(B.x-B.fx*4,9,B.z);scene.add(L);}
for(const q of[1,-1]){const L=new THREE.PointLight(C(0xff3a2a),1.6,34,1.7);L.position.set(-12*q,16,16*q);scene.add(L);H_LIGHTS.push({L,base:1.6,kind:'alarm',ph:q>0?0:Math.PI});}
for(const q of[1,-1]){const L=new THREE.PointLight(C(0xd8e0ff),1.5,44,1.4);L.position.set(-16*q,12,-20*q);scene.add(L);}
if(!coarse)for(const q of[1,-1]){const a=new THREE.PointLight(C(0xb090ff),1.1,30,1.6);a.position.set(-44*q,10.5,-18*q);scene.add(a);const b=new THREE.PointLight(C(0xffb070),.9,26,1.6);b.position.set(-40*q,4.6,17.5*q);scene.add(b);}

/* ---------- building it: floors, decks, ceilings, walls with their trim and ribs, railings, ramps, windows ---------- */
// windows: cut out of a wall's look (it still stops you and your shots): bays' viewports, the spine's ports, the hangar's breached hull
const H_WIN=[];
const hWin=(dir,line,a0,a1,y0,y1,kind)=>{H_WIN.push({dir,line,a0,a1,y0,y1,kind});H_WIN.push({dir,line:-line,a0:-a1,a1:-a0,y0,y1,kind});};
hWin('z',-80,-9,9,3,11.5,'view');
for(let x=-62;x<-26;x+=6)hWin('x',-21,x,x+4,8.1,10.6,'port');
hWin('x',-24,4,20,10,21,'breach');
{const FL=new Merger(),WL=new Merger(),DK=new Merger(),LM=new Merger(),GL=new Merger(),BN=new Merger();
 // the lower deck's floor and the upper deck's slabs, in runs along x
 const runs=(test,emit)=>{for(let j=0;j<HNZ;j++){let i0=-1;for(let i=0;i<=HNX;i++){const on=i<HNX&&test(j*HNX+i);if(on&&i0<0)i0=i;if(!on&&i0>=0){emit(HX0+i0,HX0+i,HZ0+j,j*HNX+i0);i0=-1;}}}};
 runs(c=>L0[c]&&RAMP[c]<0,(x0,x1,z,c)=>{FL.add(hbx(x1-x0,.3,1,2),M((x0+x1)/2,-.15,z+.5),tmpC.copy(K_FLOOR).multiplyScalar(.85+.15*hash(c,7)).clone());});
 runs(c=>L1[c],(x0,x1,z,c)=>{FL.add(hbx(x1-x0,DECK_T,1,2),M((x0+x1)/2,DECK-DECK_T/2,z+.5),tmpC.copy(K_FLOOR).multiplyScalar(.8+.15*hash(c,3)).clone());});
 // ceilings: the lower deck's (where there's no deck or tall room over it), the upper corridors', the tall rooms' roofs (the hangar's
 // torn open over the middle)
 const hole=(x,z)=>{const r=Math.hypot(x/15,z/13.5);return r<1+.16*(vnoise(x*.25,z*.25)-.5)+.08*Math.sin(Math.atan2(z,x)*7);};
 runs(c=>L0[c]&&!TALL[c]&&!L1[c],(x0,x1,z,c)=>{WL.add(hbx(x1-x0,.3,1),M((x0+x1)/2,TOP0[c]+.15,z+.5),K_WALLD);});
 runs(c=>L1[c]&&!TALL[c],(x0,x1,z,c)=>{WL.add(hbx(x1-x0,.3,1),M((x0+x1)/2,TOP1[c]+.15,z+.5),K_WALLD);});
 runs(c=>TALL[c]>0&&!(ZONE[c]===4&&hole(hCx(c),hCz(c))),(x0,x1,z,c)=>{WL.add(hbx(x1-x0,.6,1),M((x0+x1)/2,TALL[c]+.3,z+.5),K_HULL);});
 // light strips down the middle of the corridors' ceilings
 runs(c=>L0[c]&&!TALL[c]&&!L1[c]&&(Math.floor(c/HNX)+HZ0)%4===0,(x0,x1,z,c)=>{if(x1-x0<2)return;LM.add(hbx(x1-x0-1,.05,.18),M((x0+x1)/2,TOP0[c]-.03,z+.5),ZONE[c]===5?G_AMB:G_VIO);});
 runs(c=>L1[c]&&!TALL[c]&&(Math.floor(c/HNX)+HZ0)%3===0,(x0,x1,z,c)=>{if(x1-x0<2)return;LM.add(hbx(x1-x0-1,.05,.18),M((x0+x1)/2,TOP1[c]-.03,z+.5),G_VIO);});
 // the walls: each piece a slab, its windows cut out; a glowing line along its foot where it stands on a floor; ribs every 3 m
 // down the corridors (the Hollow build like bone)
 const winOn=(W)=>H_WIN.filter(o=>o.dir===W.dir&&Math.abs(o.line-(W.dir==='x'?W.az:W.ax))<.01&&o.a1>(W.dir==='x'?W.ax:W.az)&&o.a0<(W.dir==='x'?W.bx:W.bz)&&o.y1>W.y0&&o.y0<W.y1);
 const slab=(W,a0,a1,y0,y1,col)=>{if(a1-a0<.02||y1-y0<.02)return;const L=a1-a0,m=(a0+a1)/2,yc=(y0+y1)/2;
   if(W.dir==='x')WL.add(hbx(L,y1-y0,.4),M(m,yc,W.az),col);else WL.add(hbx(.4,y1-y0,L),M(W.ax,yc,m),col);};
 for(const W of H_WALLS){const a0=W.dir==='x'?W.ax:W.az,a1=W.dir==='x'?W.bx:W.bz,col=tmpC.copy(W.zone===4?K_HULL:K_WALL).lerp(K_WALL2,hash(a0|0,(W.y0*3)|0)*.6).clone();
   const ws=winOn(W);
   if(!ws.length)slab(W,a0,a1,W.y0,W.y1,col);
   else{// the wall round its windows: below, above, and the piers between
     let cur=a0;const S=ws.slice().sort((p,q)=>p.a0-q.a0);
     for(const o of S){const b0=Math.max(a0,o.a0),b1=Math.min(a1,o.a1);slab(W,cur,b0,W.y0,W.y1,col);slab(W,b0,b1,W.y0,Math.max(W.y0,o.y0),col);slab(W,b0,b1,Math.min(W.y1,o.y1),W.y1,col);
       // the pane and its frame (the breach: no pane, the hull's torn edge)
       const m=(b0+b1)/2,yc=(o.y0+o.y1)/2,L=b1-b0,h=o.y1-o.y0;
       if(o.kind!=='breach'){const g=new THREE.PlaneGeometry(L,h);GL.add(g,W.dir==='x'?M(m,yc,W.az):M(W.ax,yc,m,0,Math.PI/2,0),C(0xffffff));
         for(const [dy,hh] of[[o.y0,.18],[o.y1,.18]])slab(W,b0,b1,dy-hh/2,dy+hh/2,K_TRIM);if(o.kind==='view')for(let k=1;k<4;k++){const a=lerp(b0,b1,k/4);slab(W,a-.1,a+.1,o.y0,o.y1,K_TRIM);}
         const lc=o.kind==='view'?G_VIO:G_RED;if(W.dir==='x')LM.add(hbx(L,.04,.5),M(m,o.y0+.1,W.az),lc);else LM.add(hbx(.5,.04,L),M(W.ax,o.y0+.1,m),lc);}
       else{for(let k=0;k<14;k++){const a=lerp(b0,b1,k/13),hh=R(.5,3.5),up=hash(k,9)<.5;const y=up?o.y1-hh/2+R(-.5,.5):o.y0+hh/2+R(-.5,.5);slab(W,a-R(.3,.9),a+R(.3,.9),y-hh/2,y+hh/2,K_HULL);}}
       cur=b1;}
     slab(W,cur,a1,W.y0,W.y1,col);}
   // the glow along the foot (both faces), where the piece stands on a floor and is tall enough to be a wall
   const foot=W.y0<.05?0:Math.abs(W.y0-DECK)<.05?DECK:null;
   if(foot!=null&&W.y1-W.y0>2&&a1-a0>.9){const L=a1-a0-.2,m=(a0+a1)/2,lc=W.zone===1?null:(W.zone===5?G_AMB:G_VIO);
     if(lc){if(W.dir==='x')LM.add(hbx(L,.06,.46),M(m,foot+.14,W.az),lc);else LM.add(hbx(.46,.06,L),M(W.ax,foot+.14,m),lc);}
     DK.add(W.dir==='x'?hbx(a1-a0,.32,.5):hbx(.5,.32,a1-a0),M(W.dir==='x'?m:W.ax,foot+.16+.06,W.dir==='x'?W.az:m),K_TRIM);}
   // ribs: in the corridors and the spine, every 3 m, floor to ceiling, standing a little proud of the wall
   if((W.zone===2||W.zone===6||W.zone===5)&&W.y1-W.y0>2.5&&W.y1-W.y0<7)for(let a=Math.ceil(a0/3)*3;a<a1-.5;a+=3){const h=W.y1-W.y0,yc=(W.y0+W.y1)/2;
     BN.add(W.dir==='x'?hbx(.34,h,.85,1):hbx(.85,h,.34,1),M(W.dir==='x'?a:W.ax,yc,W.dir==='x'?W.az:a),tmpC.copy(K_BONE).multiplyScalar(.75+.25*hash(a|0,yc|0)).clone());
     BN.add(W.dir==='x'?hbx(.22,.5,1.05,1):hbx(1.05,.5,.22,1),M(W.dir==='x'?a:W.ax,W.y0+h*.62,W.dir==='x'?W.az:a),K_BONE);}}
 // railings: posts and a top rail, a glowing line under it
 for(const Rl of H_RAILS){const L=Math.hypot(Rl.bx-Rl.ax,Rl.bz-Rl.az),dx=(Rl.bx-Rl.ax)/L,dz=(Rl.bz-Rl.az)/L,ry=Math.atan2(-dz,dx),mx=(Rl.ax+Rl.bx)/2,mz=(Rl.az+Rl.bz)/2;
   DK.add(hbx(L,.1,.14,1),M(mx,DECK+1.05,mz,0,ry,0),K_TRIM);DK.add(hbx(L,.06,.1,1),M(mx,DECK+.55,mz,0,ry,0),K_TRIM);LM.add(hbx(L,.03,.03,1),M(mx,DECK+.98,mz,0,ry,0),G_VIO);
   for(let k=0;k<=Math.floor(L/1.5);k++){const t=Math.min(L,k*1.5);DK.add(hbx(.08,1.1,.08,1),M(Rl.ax+dx*t,DECK+.55,Rl.az+dz*t),K_TRIM);}}
 // the ramps: a tilted plate, its sides closed down to the floor, a lit edge
 for(const R of H_RAMPS){const [x0,x1,z0,z1]=R.r,L=x1-x0,a=Math.atan2(DECK,R.b-R.a),hl=Math.hypot(L,DECK),xm=(x0+x1)/2,zm=(z0+z1)/2;
   FL.add(hbx(hl,.3,z1-z0,2),M(xm,DECK/2-.12,zm,0,0,a),K_FLOOR);
   for(const zz of[z0+.12,z1-.12]){const sg=new THREE.BufferGeometry(),ya=0,P=[R.a,0,zz,R.b,0,zz,R.b,DECK-.25,zz];sg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));sg.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1],2));sg.computeVertexNormals();
     const s2=new THREE.BufferGeometry();s2.setAttribute('position',new THREE.Float32BufferAttribute([R.a,0,zz,R.b,DECK-.25,zz,R.b,0,zz],3));s2.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,1,1,0],2));s2.computeVertexNormals();
     DK.add(sg,M(0,0,0),K_WALLD);DK.add(s2,M(0,0,0),K_WALLD);
     LM.add(hbx(hl,.04,.06,1),M(xm,DECK/2+.06,zz,0,0,a),G_VIO);}}
 for(const [mg,mat,sh] of[[FL,hFloorMat,true],[WL,hWallMat,true],[DK,hDarkMat,true],[BN,hBoneMat,true]])hMesh(mg.build(),mat,sh,true);
 hMesh(LM.build(),hLampMat,false,false);{const g=hMesh(GL.build(),hGlassMat,false,false);g.renderOrder=2;}}

// the pod's shape: an egg, widest a third of the way up
const H_PODR=t=>.98*Math.pow(Math.sin(Math.PI*clamp(t,.001,.999)),.72)*(1-.14*t)+.02;
const H_PODN=coarse?12:22,H_POD=new THREE.LatheGeometry(Array.from({length:H_PODN},(_,i)=>{const t=i/(H_PODN-1);return new THREE.Vector2(H_PODR(t)*(t>.99?0:1),.3+2.3*t);}),coarse?14:26);
/* ---------- the rooms' own things ---------- */
{const DK=new Merger(),WL=new Merger(),LM=new Merger(),CT=new Merger();
 // containers: Hollow cargo boxes, dark plate with ribs and a violet seam; the platform; pods; crates; the half-shut blast door; tanks
 for(const B of H_BOXES){const y0=B.y||0;
   if(B.kind==='container'){const n=Math.round(B.h/2.6);for(let s=0;s<n;s++){const y=y0+s*2.6+1.3,col=tmpC.copy(hash(B.x|0,s)<.5?C(0x7a6c88):C(0x627080)).clone();
       CT.add(hbx(B.l,2.5,B.w,2),M(B.x,y,B.z,0,B.ry,0),col);for(let k=-2;k<=2;k++){const c=Math.cos(B.ry),sn=Math.sin(B.ry),o=k*B.l/5;DK.add(hbx(.12,2.56,B.w+.06,1),M(B.x+c*o,y,B.z-sn*o,0,B.ry,0),K_TRIM);}
       LM.add(hbx(B.l-.4,.05,.05,1),M(B.x,y+1.1,B.z,0,B.ry,0),s%2?G_VIO:G_RED);}}
   else if(B.kind==='platform'){CT.add(hbx(B.l,B.h,B.w,2),M(B.x,B.h/2,B.z),K_WALL2);LM.add(hbx(B.l+.02,.06,B.w+.02,1),M(B.x,B.h-.1,B.z),G_VIO);
     for(const [dx,dz] of[[-1,-1],[1,-1],[1,1],[-1,1]])DK.add(hbx(.4,DECK-B.h,.4,1),M(B.x+dx*(B.l/2-.4),B.h+(DECK-B.h)/2,B.z+dz*(B.w/2-.4)),K_TRIM);}
   else if(B.kind==='pods'){// Hollow pods: a ribbed egg in a clawed cradle, a slit of amber light down the side to the aisle, hoses up to the rail
     const n=Math.round(B.l/2.1),fz=B.z>0?-1:1;
     for(let k=0;k<n;k++){const x=B.x-B.l/2+(k+.5)*B.l/n,tw=hash(k,B.x|0)*6.28,pc=tmpC.copy(C(0x2e2834)).lerp(C(0x3e3036),hash(k,3)).clone();
       CT.add(H_POD,M(x,0,B.z,0,tw,0),pc);
       for(const t of[.2,.42,.66,.86]){const y=.3+2.3*t;DK.add(new THREE.TorusGeometry(H_PODR(t)+.025,.04,6,coarse?16:28),M(x,y,B.z,Math.PI/2,0,0),K_TRIM);}
       const rf=H_PODR(.45);LM.add(new THREE.SphereGeometry(1,10,8),mat4(x,1.35,B.z+fz*(rf-.02),.17,.72,.05),tmpC.copy(G_AMB).multiplyScalar(.75).clone());
       LM.add(hbx(.05,1.7,.05,1),M(x,1.38,B.z+fz*(rf+.02)),G_AMB);
       for(let c=0;c<4;c++){const a=c/4*Math.PI*2+Math.PI/4;DK.add(hbx(.16,1.1,.22,1),M(x+Math.cos(a)*.86,.62,B.z+Math.sin(a)*.86,Math.sin(a)*.32,0,-Math.cos(a)*.32),K_TRIM);}
       DK.add(new THREE.CylinderGeometry(.95,1.05,.22,coarse?12:24),M(x,.36,B.z),K_WALLD);
       if(!coarse){const cv=new THREE.CatmullRomCurve3([new THREE.Vector3(x,2.58,B.z),new THREE.Vector3(x+.25,3.4,B.z+fz*.3),new THREE.Vector3(x+.1,4.6,B.z+fz*.15),new THREE.Vector3(x,5.95,B.z)]);
         DK.add(new THREE.TubeGeometry(cv,10,.07,6),M(0,0,0),C(0x24202a));}}
     DK.add(hbx(B.l,.3,B.w,1),M(B.x,.15,B.z),K_TRIM);DK.add(hbx(B.l,.2,.2,1),M(B.x,2.55,B.z),K_TRIM);}
   else if(B.kind==='crate'){CT.add(hbx(B.l,B.h,B.w,1),M(B.x,y0+B.h/2,B.z,0,B.ry,0),C(0x4e4a40));DK.add(hbx(B.l+.04,.12,B.w+.04,1),M(B.x,y0+B.h*.7,B.z,0,B.ry,0),K_TRIM);}
   else if(B.kind==='door'){WL.add(hbx(B.l,B.h,B.w,1),M(B.x,B.h/2,B.z),K_WALL2);LM.add(hbx(B.l+.02,.08,B.w,1),M(B.x,B.h-.5,B.z),G_RED);for(let k=0;k<5;k++)DK.add(hbx(B.l+.06,.14,B.w,1),M(B.x,.6+k*.9,B.z,0,0,.35),K_TRIM);}
   else if(B.kind==='tank'){CT.add(new THREE.CylinderGeometry(B.r,B.r,B.h,18),M(B.x,B.h/2,B.z),C(0x5a5048));DK.add(new THREE.CylinderGeometry(B.r+.05,B.r+.05,.18,18),M(B.x,B.h*.8,B.z),K_TRIM);LM.add(new THREE.CylinderGeometry(B.r+.02,B.r+.02,.05,18),M(B.x,B.h*.3,B.z),G_AMB);}}
 // the cores: a column floor to roof, rings round it, the glowing heart split open
 for(const K of H_CORE){DK.add(new THREE.CylinderGeometry(2.4,2.8,4.3,20),M(K.x,2.15,K.z),K_WALLD);DK.add(new THREE.CylinderGeometry(2.2,2.5,5.3,20),M(K.x,11.35,K.z),K_WALLD);DK.add(new THREE.CylinderGeometry(1.1,1.1,4.4,12),M(K.x,6.5,K.z),C(0x1a1424));
   for(const y of[1,3.2,9.8,12.4])DK.add(new THREE.CylinderGeometry(3.1,3.1,.5,24),M(K.x,y,K.z),K_TRIM);
   for(let k=0;k<5;k++)LM.add(new THREE.TorusGeometry(1.85,.05,6,24),M(K.x,4.7+k*.9,K.z,Math.PI/2,0,0),C(0xd8a0ff).multiplyScalar(1.6));
   for(let k=0;k<8;k++){if(k%3===1)continue;const a=k/8*Math.PI*2;DK.add(hbx(.4,4.8,.7,1),M(K.x+Math.cos(a)*2.3,6.5,K.z+Math.sin(a)*2.3,0,-a,0),K_WALL2);}
   for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.3;DK.add(new THREE.CylinderGeometry(.18,.18,7,6),M(K.x+Math.cos(a)*4.6,10.5,K.z+Math.sin(a)*4.6,Math.sin(a)*.5,0,-Math.cos(a)*.5),K_TRIM);}}
 // the bays: spawn rings, the side's colour on the walls, a big Keeper chevron on the floor
 for(const B of GS.BASES){const TC=C(GS.TEAMS[B.team].c).multiplyScalar(2.4),s=Math.sign(B.x);
   for(const z of[-12.7,12.7])LM.add(hbx(22,.12,.06,1),M(B.x,2.2,z),TC);LM.add(hbx(.06,.12,24,1),M(B.x+s*11.7,2.2,0),TC);
   for(const z of[-12.7,12.7])LM.add(hbx(22,.06,.06,1),M(B.x,12.8,z),TC);
   LM.add(new THREE.RingGeometry(3.6,4,3).rotateX(-Math.PI/2),M(B.x+s*4,.03,B.z,0,s>0?Math.PI/2:-Math.PI/2,0),TC);}
 // the hangar: the ship's fighters wrecked on the floor (their models), cables down from the roof, the crane's rail over the breach
 for(const [x,z,yaw,pitch,roll,len] of[[-9,4,.35,-.08,.32,15]]){for(const q of[1,-1]){const X=x*q,Z=z*q,g=new THREE.Group();g.position.set(X,1.1,Z);g.rotation.set(pitch,yaw+(q<0?Math.PI:0),roll,'YXZ');g.userData.dyn=1;scene.add(g);
   MODELS.swapShip(g,'wraith',{len,tint:0x6a5878,glow:.05,metal:.3,shadow:true,hide:[]}).then(m=>{if(m)m.traverse(o=>{o.userData.dyn=1;});});
   const yw=yaw+(q<0?Math.PI:0),ux=-Math.sin(yw),uz=-Math.cos(yw);s3Wall(X-ux*len*.4,Z-uz*len*.4,X+ux*len*.4,Z+uz*len*.4,-.1,2.8,4.2,true,true);}}
 for(let k=0;k<(coarse?10:18);k++){const x=R(-20,20),z=R(-22,22),L=R(4,14);if(Math.hypot(x/15,z/13.5)<1.1)continue;DK.add(new THREE.CylinderGeometry(.05,.05,L,5),M(x,24-L/2,z,R(-.1,.1),0,R(-.1,.1)),K_TRIM);}
 for(const z of[-16,-8,0,8,16]){const broken=Math.abs(z)<9;if(broken){DK.add(hbx(14,.8,.8,1),M(-15,23.4,z,0,0,-.18),K_WALL2);DK.add(hbx(12,.8,.8,1),M(16,23.2,z,0,0,.25),K_WALL2);}else DK.add(hbx(44,.8,.8,1),M(0,23.6,z),K_WALL2);}
 // the breach's torn edge: plates bent up and out round the hole
 for(let k=0;k<40;k++){const a=k/40*Math.PI*2,x=Math.cos(a)*15.5,z=Math.sin(a)*14;DK.add(hbx(R(2,4),.3,R(1.4,2.6),1),M(x,24.4+R(0,1.5),z,R(-.5,.5)+Math.sin(a)*.7,-a,R(-.5,.5)-Math.cos(a)*.7),K_HULL);}
 hMesh(CT.build(),hWallMat,true,true);hMesh(DK.build(),hDarkMat,true,true);hMesh(WL.build(),hWallMat,true,true);hMesh(LM.build(),hLampMat,false,false);}
/* ---------- the detail pass (Nov 8, Bryce: "Is great, only needs better graphics", and "bring the detail up by 2x"). Nothing here is
   solid or moves the fight: panelling trim, dado rails, battens, pipe runs on brackets, sagging cables, vents, junction boxes, the
   Hollow's ribs with knuckles and ceiling gussets, crossbeams under the corridor ceilings; light pooling on the floors under the
   strips, shafts of starlight through the breach and the spine's ports, floodlights and beacons in the hangar, the cores' plasma,
   turning rings and arcs, the bays' light rigs, the hold's pendant lamps, the hull's torn layers round the breach, scorched and
   scattered wreckage round the fighters, embers, and big wrecks drifting outside. Phones get a lighter cut ---------- */
const H_ANIM=[];
{let _s=90210;const hr=()=>{_s=(_s+0x6D2B79F5)|0;let t=Math.imul(_s^_s>>>15,1|_s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;},HR=(a,b)=>a+hr()*(b-a);
 const HQX=!coarse,SEG=HQX?12:7;
 const DK=new Merger(),PP=new Merger(),LM=new Merger(),PL=new Merger(),BAR=new Merger(),SH=new Merger(),BN=new Merger(),WL=new Merger();
 const K_PIPE=[C(0x4a4656),C(0x6e4e3c),C(0x3e5662),C(0x5c5a64),C(0x2e2c34)],K_CAB=C(0x1a181e),K_HAZ=C(0xd09a1c),K_DARK=C(0x141218);
 const TEAMC=x=>C(GS.TEAMS[x<0?'blue':'red'].c);
 const softTex=(stops,w,h,radial)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
   const g=radial?x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2):x.createLinearGradient(0,0,0,h);for(const [o,a] of stops)g.addColorStop(o,'rgba(255,255,255,'+a+')');x.fillStyle=g;x.fillRect(0,0,w,h);return new THREE.CanvasTexture(c);};
 const POOLT=softTex([[0,1],[.3,.55],[.65,.16],[1,0]],128,128,true),BART=softTex([[0,0],[.5,1],[1,0]],4,64,false),SCORT=softTex([[0,.95],[.45,.7],[1,0]],128,128,true);
 const addM=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2},o||{},{map:c}));
 const pool=(x,y,z,r,col,k,sx)=>PL.add(new THREE.PlaneGeometry(r*2*(sx||1),r*2).rotateX(-Math.PI/2),M(x,y+.035,z),tmpC.copy(col).multiplyScalar(k).clone());
 const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
 const orient=(a,b)=>{const d=new THREE.Vector3().subVectors(b,a),L=d.length();return[new THREE.Matrix4().compose(new THREE.Vector3().addVectors(a,b).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(V3(0,1,0),d.normalize()),V3(1,1,1)),L];};
 const cone=(a,b,r0,r1,col,seg)=>{const [m,L]=orient(a,b);SH.add(new THREE.CylinderGeometry(r1,r0,L,seg||16,1,true),m,col);};
 const winsOn=W=>H_WIN.filter(o=>o.dir===W.dir&&Math.abs(o.line-(W.dir==='x'?W.az:W.ax))<.01&&o.a1>(W.dir==='x'?W.ax:W.az)&&o.a0<(W.dir==='x'?W.bx:W.bz)&&o.y1>W.y0&&o.y0<W.y1);

 /* the walls: everything is laid out in the wall's own frame (x along it, y up, z out of the face into the room) */
 for(const W of H_WALLS){const foot=W.y0<.05?0:Math.abs(W.y0-DECK)<.05?DECK:null;if(foot==null)continue;
   const a0=W.dir==='x'?W.ax:W.az,a1=W.dir==='x'?W.bx:W.bz,L=a1-a0,top=W.y1,h=top-foot;if(h<2.2||L<1.1)continue;
   const n=W.side===0?-1:1,rot=W.dir==='x'?(n>0?0:Math.PI):(n>0?Math.PI/2:-Math.PI/2),z=W.zone,tall=h>8,ribbed=z===2||z===5||z===6,ws=winsOn(W);
   const F=(a,y,out)=>W.dir==='x'?M(a,y,W.az+n*(.2+out),0,rot,0):M(W.ax+n*(.2+out),y,a,0,rot,0);
   const spans=(y0,y1,m)=>{let S=[[a0+m,a1-m]];for(const o of ws){if(o.y1<=y0||o.y0>=y1)continue;const nx=[];for(const [p,q] of S){if(o.a1<=p||o.a0>=q){nx.push([p,q]);continue;}if(o.a0-.15>p)nx.push([p,o.a0-.15]);if(o.a1+.15<q)nx.push([o.a1+.15,q]);}S=nx;}return S.filter(([p,q])=>q-p>.3);};
   const free=(p,q,y0,y1)=>p>a0+.1&&q<a1-.1&&!ws.some(o=>o.a1>p-.15&&o.a0<q+.15&&o.y1>y0&&o.y0<y1);
   const box=(mg,a,y,out,la,hh,dd,col,rx,rz)=>{const g=hbx(la,hh,dd,1);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);mg.add(g,F(a,y,out),col);};
   const run=(mg,y,out,hh,dd,col,m)=>{for(const [p,q] of spans(y-hh/2,y+hh/2,m==null?.05:m))box(mg,(p+q)/2,y,out,q-p,hh,dd,col);};
   const pipe=(y,out,r,col,brk)=>{for(const [p,q] of spans(y-r-.06,y+r+.06,.12)){PP.add(new THREE.CylinderGeometry(r,r,q-p,SEG,1,true).rotateZ(Math.PI/2),F((p+q)/2,y,out),col);
       for(let a=Math.ceil(p/brk)*brk;a<q-.1;a+=brk){if(a<p+.1)continue;box(DK,a,y,out/2,.07,.1,out,K_TRIM);PP.add(new THREE.CylinderGeometry(r*1.3,r*1.3,.09,SEG).rotateZ(Math.PI/2),F(a,y,out),K_TRIM);}}};
   const hk=(k)=>hash((a0*7)|0,((top+k)*13)|0);
   // dado rails and a cap rail
   run(DK,foot+1.1,.035,.09,.07,K_TRIM);run(DK,foot+1.21,.015,.035,.03,K_WALLD);run(DK,foot+(tall?2.9:Math.min(2.45,h-.4)),.03,.14,.06,K_TRIM);
   // battens: vertical strips standing off the face (between the ribs in the corridors), a team-coloured inset strip in the bays
   const bs=ribbed?3:(tall?2.5:2),bo=ribbed?1.5:0,bt=Math.min(top-.3,foot+(tall?6.6:h));
   for(let a=Math.ceil((a0-bo)/bs)*bs+bo;a<a1-.4;a+=bs){if(!free(a-.1,a+.1,foot+.3,bt))continue;box(DK,a,(foot+.3+bt)/2,.03,.14,bt-foot-.3,.06,K_TRIM);
     if(z===1)box(LM,a,foot+4.4,.065,.035,3.2,.02,tmpC.copy(TEAMC(W.ax)).multiplyScalar(1.9).clone());}
   // pipe runs on brackets near the top (in the tall rooms: under the decks' height, and under the roof)
   if(!tall){if(ribbed||z===3||z===4||z===1){pipe(top-.3,.2,.11,K_PIPE[(hk(1)*5)|0],1.5);pipe(top-.58,.4,.075,K_PIPE[(hk(2)*5)|0],1.5);if(HQX)pipe(top-.42,.6,.05,K_PIPE[(hk(3)*5)|0],3);}}
   else{pipe(foot+6.3,.28,.15,K_PIPE[(hk(1)*5)|0],2);if(HQX)pipe(foot+5.95,.55,.08,K_PIPE[(hk(2)*5)|0],2);if(top>13)pipe(top-.55,.3,.17,K_PIPE[(hk(3)*5)|0],2.5);}
   // cables sagging between the brackets (PC)
   if(HQX&&ribbed&&!tall)for(let a=Math.ceil(a0/3)*3;a+3<a1;a+=3){if(hash(a|0,(top*7)|0)<.4)continue;const y=top-.22;if(!free(a,a+3,y-.9,y+.1))continue;
     for(const [sg,o,r] of[[HR(.25,.55),.78,.035],[HR(.4,.8),.88,.025]]){const cv=new THREE.CatmullRomCurve3([V3(-1.5,0,0),V3(-.8,-sg*.8,0),V3(0,-sg,0),V3(.8,-sg*.8,0),V3(1.5,0,0)]);
       DK.add(new THREE.TubeGeometry(cv,12,r,5),F(a+1.5,y,o),K_CAB);}}
   // low vents and junction boxes with a lit screen and status lights
   if(!tall)for(let a=Math.ceil(a0/2.5)*2.5+1.25;a<a1-1;a+=2.5){const hv=hash(a*4|0,(foot*3+z)|0);
     if(hv<.22&&free(a-.6,a+.6,foot+.1,foot+.8)){box(DK,a,foot+.45,.03,1.1,.52,.06,K_DARK);for(let k=0;k<6;k++)box(DK,a,foot+.25+k*.08,.06,1.0,.035,.07,K_TRIM,.5);}
     else if(hv>.82&&free(a-.45,a+.45,foot+1,foot+2.1)){box(DK,a,foot+1.55,.08,.8,1.0,.16,K_WALLD);box(DK,a,foot+1.55,.17,.84,.08,.04,K_TRIM);
       box(LM,a-.05,foot+1.62,.165,.52,.3,.01,tmpC.copy(z===5?G_AMB:C(0x58c8ff)).multiplyScalar(.55).clone());
       for(let k=0;k<3;k++)box(LM,a-.3+k*.12,foot+1.28,.165,.05,.05,.01,k===2?G_RED:C(0x60ff90).multiplyScalar(1.4));}}
   // the Hollow's ribs: a knuckle at the band, a flared foot, a gusset up into the ceiling
   if(ribbed&&h>2.5&&h<7)for(let a=Math.ceil(a0/3)*3;a<a1-.5;a+=3){const bc=tmpC.copy(K_BONE).multiplyScalar(.7+.25*hash(a|0,top|0)).clone();
     BN.add(new THREE.SphereGeometry(.2,SEG,8).scale(1.1,1.5,.75),F(a,foot+h*.62,.24),bc);
     BN.add(new THREE.CylinderGeometry(.2,.32,.55,SEG),F(a,foot+.28,.2),bc);
     box(BN,a,top-.42,.32,.26,.75,.6,bc,.75);
     if(HQX)BN.add(new THREE.SphereGeometry(.16,8,6).scale(1,1.4,1),F(a,foot+h*.3,.3),bc);}
   // tall rooms: I-beam buttresses up the walls (round the windows), girders across; hazard paint at the hangar's foot
   if(tall){const sp=z===4?4:3;for(let a=Math.ceil(a0/sp)*sp+sp/2;a<a1-.6;a+=sp){let y1=top-.2;const blk=ws.filter(o=>o.a1>a-.5&&o.a0<a+.5);if(blk.length)y1=Math.min(...blk.map(o=>o.y0))-.2;if(y1-foot<3)continue;
       const yc=(foot+y1)/2,hb=y1-foot;box(DK,a,yc,.26,.16,hb,.52,K_TRIM);box(DK,a,yc,.56,.6,hb,.09,K_WALLD);box(DK,a,yc,.02,.6,hb,.05,K_WALLD);box(DK,a,foot+.2,.4,.9,.4,.8,K_TRIM);}
     if(z===4){run(DK,14.5,.3,.7,.6,K_TRIM,.1);run(DK,top-1.3,.3,.7,.6,K_TRIM,.1);run(DK,.6,.012,.58,.024,K_DARK);
       for(const [p,q] of spans(.3,.9,.2))for(let a=p+.3;a<q-.3;a+=.55)box(DK,a,.6,.03,.16,.62,.02,K_HAZ,0,.7);}}}

 /* ceilings: crossbeams under the corridors' ceilings every 3 m (across the narrow way), gussets where they meet the walls */
 const beams=(test,topOf,along)=>{const NA=along==='z'?HNX:HNZ,NB=along==='z'?HNZ:HNX;
   for(let i=0;i<NA;i++){const coord=(along==='z'?HX0:HZ0)+i;if(((coord%3)+3)%3!==0)continue;let j0=-1,t0=0;
     const emit=(j)=>{const len=j-j0;if(len>=2&&len<=9){const c0=(along==='z'?HZ0:HX0)+j0,mid=c0+len/2,y=t0-.24,cc=coord+.5;
         const g=along==='z'?hbx(.34,.48,len,1):hbx(len,.48,.34,1);DK.add(g,along==='z'?M(cc,y,mid):M(mid,y,cc),K_TRIM);
         if(HQX)for(const e of[c0+.45,c0+len-.45])DK.add(along==='z'?hbx(.2,.5,.5,1).rotateX(e<mid?.75:-.75):hbx(.5,.5,.2,1).rotateZ(e<mid?-.75:.75),along==='z'?M(cc,t0-.55,e):M(e,t0-.55,cc),K_TRIM);
         LM.add(along==='z'?hbx(.06,.03,len-.6,1):hbx(len-.6,.03,.06,1),along==='z'?M(cc,t0-.49,mid):M(mid,t0-.49,cc),tmpC.copy(G_VIO).multiplyScalar(.55).clone());}j0=-1;};
     for(let j=0;j<=NB;j++){const c=along==='z'?j*HNX+i:i*HNX+j,on=j<NB&&test(c),t=on?topOf(c):0;
       if(j0>=0&&(!on||t!==t0))emit(j);if(on&&j0<0){j0=j;t0=t;}}}};
 const lowC=c=>L0[c]&&!TALL[c]&&!L1[c]&&RAMP[c]<0,upC=c=>L1[c]&&!TALL[c];
 beams(lowC,c=>TOP0[c],'z');beams(lowC,c=>TOP0[c],'x');beams(upC,c=>TOP1[c],'z');beams(upC,c=>TOP1[c],'x');

 /* light on the floors under the ceiling strips, and a soft halo round each strip */
 {const strips=(test,topOf,floorY,every,zoneCol)=>{for(let j=0;j<HNZ;j++){const zz=HZ0+j;if(((zz%every)+every)%every!==0)continue;let i0=-1;
     for(let i=0;i<=HNX;i++){const c=j*HNX+i,on=i<HNX&&test(c);if(on&&i0<0)i0=i;if(!on&&i0>=0){const x0=HX0+i0,x1=HX0+i;if(x1-x0>=2){const c0=j*HNX+i0,col=zoneCol(c0),t=topOf(c0);
         for(let x=x0+1.2;x<x1-.6;x+=2.6)pool(x,floorY,zz+.5,2.3,col,.12);
         BAR.add(new THREE.PlaneGeometry(x1-x0-1,.9).rotateX(Math.PI/2),M((x0+x1)/2,t-.07,zz+.5),tmpC.copy(col).multiplyScalar(.35).clone());}i0=-1;}}}};
  strips(c=>L0[c]&&!TALL[c]&&!L1[c],c=>TOP0[c],0,4,c=>ZONE[c]===5?G_AMB:G_VIO);
  strips(c=>L1[c]&&!TALL[c],c=>TOP1[c],DECK,3,()=>G_VIO);
  // the glow at every wall's foot spills a little onto the floor
  for(const W of H_WALLS){const foot=W.y0<.05?0:Math.abs(W.y0-DECK)<.05?DECK:null;if(foot==null||W.y1-W.y0<2||W.zone===1)continue;const a0=W.dir==='x'?W.ax:W.az,a1=W.dir==='x'?W.bx:W.bz,L=a1-a0;if(L<1)continue;
    const n=W.side===0?-1:1,col=W.zone===5?G_AMB:G_VIO,m=(a0+a1)/2;
    BAR.add(W.dir==='x'?new THREE.PlaneGeometry(L-.2,1.1).rotateX(-Math.PI/2):new THREE.PlaneGeometry(1.1,L-.2).rotateX(-Math.PI/2),W.dir==='x'?M(m,foot+.04,W.az+n*.75):M(W.ax+n*.75,foot+.04,m),tmpC.copy(col).multiplyScalar(.16).clone());}}

 /* starlight: shafts through the spine's ports (blue's look toward the star) and down through the breach */
 for(const o of H_WIN){if(o.kind!=='port'||o.line>0)continue;const zf=o.line+.25,d=starDir.clone().negate(),C4=[[o.a0+.1,o.y0],[o.a1-.1,o.y0],[o.a1-.1,o.y1],[o.a0+.1,o.y1]].map(([x,y])=>V3(x,y,zf));
   const E4=C4.map(p=>p.clone().addScaledVector(d,(p.y-DECK)/starDir.y));const P=[],U=[];
   for(let k=0;k<4;k++){const a=C4[k],b=C4[(k+1)%4],ea=E4[k],eb=E4[(k+1)%4];P.push(a.x,a.y,a.z,b.x,b.y,b.z,eb.x,eb.y,eb.z,a.x,a.y,a.z,eb.x,eb.y,eb.z,ea.x,ea.y,ea.z);U.push(0,1,1,1,1,0,0,1,1,0,0,0);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeVertexNormals();
   SH.add(g,M(0,0,0),C(0xffd9a8).multiplyScalar(.2));}
 for(const [sx,sz,r] of[[-2,-8,3.2],[6,-4,2.4],[-6,-1,2],[10,-10,2.6],[1,-12,1.8],[12,-2,1.6],[-8,-6,1.4],[4,2,2.2]]){if(!HQX&&r<2)continue;const top=V3(sx,25.5,sz),bot=top.clone().addScaledVector(starDir,-25.5/starDir.y);
   cone(bot,top,r*1.12,r,C(0xffd2a0).multiplyScalar(.025+.005*r));}   // (Nov 9: fainter; overlapping, they read as a solid wedge)

 /* the hangar: floodlights on the galleries' walls with their cones and pools, red beacons by the alarm lamps, floor markings,
    loose plates and bolts on the floor, the hull's torn layers round the breach */
 for(const q of[1,-1]){const fx=-16*q,fz=-23.3*q,tgt=V3(-9*q,0,-7*q),src=V3(fx,12.6,fz+.6*q);
   DK.add(hbx(1.8,.9,1.1,1),M(fx,13,fz,-.5*q,0,0),K_TRIM);DK.add(hbx(.2,1.4,.2,1),M(fx-.7,13.6,fz-.2*q),K_TRIM);DK.add(hbx(.2,1.4,.2,1),M(fx+.7,13.6,fz-.2*q),K_TRIM);
   LM.add(hbx(1.5,.05,.8,1),M(fx,12.6,fz+.3*q,-.5*q,0,0),C(0xf2f4ff).multiplyScalar(3));
   cone(tgt,src,6,.7,C(0xd8e0ff).multiplyScalar(.05),20);pool(tgt.x,0,tgt.z,7,C(0xd8e0ff),.16);
   // beacons
   const bx=-12*q,bz=23.5*q;DK.add(new THREE.CylinderGeometry(.35,.4,.3,12),M(bx,16,bz),K_TRIM);LM.add(new THREE.SphereGeometry(.26,12,8),M(bx,16.3,bz),C(0xff3020).multiplyScalar(2.2));}
 // floor markings: a box round the lift platform, lanes across, chevrons toward each side
 {const mk=(x,z,l,w,ry)=>LM.add(hbx(l,.012,w,1),M(x,.012,z,0,ry||0,0),tmpC.copy(G_AMB).multiplyScalar(.32).clone());
  for(const s of[-1,1]){mk(0,s*5.2,10.4,.14);mk(s*5.2,0,.14,10.4);for(let x=-19;x<=19;x+=3){if(Math.abs(x)<6)continue;mk(x,s*12,1.6,.12);}
    for(let k=0;k<3;k++){mk(s*(8.5+k*1.2),0,.9,.12,.7);mk(s*(8.5+k*1.2),.55,.9,.12,-.7);}}}
 for(let k=0;k<(HQX?90:36);k++){const x=HR(-21,21),z=HR(-23,23),s=HR(.15,1),t=hr();
   if(t<.55)DK.add(hbx(s,HR(.02,.06),s*HR(.4,1),1),M(x,.03,z,HR(-.08,.08),HR(0,6.28),HR(-.08,.08)),tmpC.copy(K_TRIM).multiplyScalar(HR(.7,1.4)).clone());
   else if(t<.8)DK.add(new THREE.CylinderGeometry(.04,.04,s*.6,6).rotateZ(Math.PI/2),M(x,.04,z,0,HR(0,6.28),0),K_PIPE[(hr()*5)|0]);
   else DK.add(new THREE.IcosahedronGeometry(s*.18,0),M(x,s*.1,z,HR(0,6),HR(0,6),0),K_WALLD);}
 {const NR=HQX?44:24;for(let k=0;k<NR;k++){const a=k/NR*Math.PI*2+HR(-.05,.05),ca=Math.cos(a),sa=Math.sin(a),rr=1.02+.06*hr(),x=ca*15*rr,z=sa*13.5*rr,len=HR(1.6,4.6),tilt=HR(.35,1.1);
    // exposed ribs bent up and out where the hull tore
    const g=hbx(.45,len,.5,1);g.translate(0,len/2,0);g.rotateX(-tilt);DK.add(g,M(x,24.6,z,0,-a+Math.PI/2,0),K_HULL);
    // the outer skin, in pieces, a little higher and further out
    if(hr()<.75){const r2=HR(1.18,1.45),px=ca*15*r2,pz=sa*13.5*r2;if(Math.abs(px)<21.5&&Math.abs(pz)<23.5)DK.add(hbx(HR(2.4,4.2),.3,HR(1.8,3.2),1),M(px,26.1+HR(-.2,.4),pz,HR(-.2,.2),-a,HR(-.25,.25)),K_HULL);}
    if(HQX&&hr()<.6){const r3=HR(1.1,1.35);DK.add(hbx(.3,1.6,.3,1),M(ca*15*r3,25.4,sa*13.5*r3),K_TRIM);}}}

 /* the fighters: a scorched blot under each, gouges behind, torn panels and bits strewn round, embers drifting up */
 const SCOR=new Merger(),EMB=[];
 for(const q of[1,-1]){const X=-9*q,Z=4*q,yw=.35+(q<0?Math.PI:0),ux=-Math.sin(yw),uz=-Math.cos(yw);
   SCOR.add(new THREE.PlaneGeometry(16,10).rotateX(-Math.PI/2),M(X,.025,Z,0,yw+Math.PI/2,0),C(0xffffff));
   for(const o of[-1.4,0,1.2]){const L=HR(7,11),cx=X-ux*(7.5+L/2)+uz*o,cz=Z-uz*(7.5+L/2)-ux*o;SCOR.add(new THREE.PlaneGeometry(.5,L).rotateX(-Math.PI/2),M(cx,.028,cz,0,yw,0),C(0xffffff));}
   for(let k=0;k<(HQX?16:7);k++){const a=HR(0,6.28),r=HR(3,8),x=X+Math.cos(a)*r,z=Z+Math.sin(a)*r;if(Math.abs(x)<3.4&&Math.abs(z)<3.4)continue;
     if(hr()<.6)DK.add(hbx(HR(.4,1.6),.06,HR(.3,1.1),1),M(x,.05,z,HR(-.2,.2),HR(0,6),HR(-.2,.2)),C(0x4a4052));
     else DK.add(new THREE.IcosahedronGeometry(HR(.15,.35),0),M(x,.15,z,HR(0,6),HR(0,6),0),C(0x3a3440));}
   // a sheared wing panel leaning on the hull, cables hanging out of the wound
   DK.add(hbx(3.6,.14,1.6,1),M(X+uz*3.3,1,Z-ux*3.3,0,yw,.55*q),C(0x5a4c66));
   if(HQX)for(let k=0;k<4;k++){const sx=X+ux*HR(-2,2)+uz*1.4,sz=Z+uz*HR(-2,2)-ux*1.4,cv=new THREE.CatmullRomCurve3([V3(sx,2.2,sz),V3(sx+HR(-.3,.3),1.2,sz+HR(-.3,.3)),V3(sx+HR(-.6,.6),.05,sz+HR(-.6,.6))]);DK.add(new THREE.TubeGeometry(cv,8,.03,4),M(0,0,0),K_CAB);}
   EMB.push([X,Z]);}
 {const m=new THREE.MeshBasicMaterial({map:SCORT,vertexColors:true,color:C(0x000000),transparent:true,opacity:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
  const sm=hMesh(SCOR.build(),m,false,false);sm.renderOrder=1;}
 {const N=HQX?70:24,pos=new Float32Array(N*3),D=[];for(let i=0;i<N;i++){const E=EMB[i%EMB.length];D.push({x:E[0]+HR(-2.5,2.5),z:E[1]+HR(-2.5,2.5),y:HR(.3,6),v:HR(.25,.9),ph:HR(0,6),E});}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(g,new THREE.PointsMaterial({size:.09,color:C(0xff8a3a).multiplyScalar(3),transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));pts.userData.dyn=1;pts.frustumCulled=false;scene.add(pts);
  const sp=EMB.map(E=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff7a30).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s.position.set(E[0],1.6,E[1]);s.scale.setScalar(2.2);s.userData.dyn=1;scene.add(s);return s;});
  H_ANIM.push((dt,T)=>{for(let i=0;i<N;i++){const d=D[i];d.y+=d.v*dt*.5;d.x+=Math.sin(T*.7+d.ph)*dt*.15;if(d.y>7){d.y=.3;d.x=d.E[0]+HR(-2.5,2.5);d.z=d.E[1]+HR(-2.5,2.5);}pos[i*3]=d.x;pos[i*3+1]=d.y;pos[i*3+2]=d.z;}g.attributes.position.needsUpdate=true;
    sp.forEach((s,k)=>{s.material.opacity=.45+.35*Math.sin(T*9.3+k*2)*Math.sin(T*3.1+k);});});}

 /* the reactors: the core's plasma, rings turning round it, arcs jumping to the cage, a pool of violet on the floor, conduits out
    across it and up the column */
 const plasma=new THREE.ShaderMaterial({uniforms:{t:{value:0}},
   vertexShader:'varying vec2 vU;varying vec3 vN;varying vec3 vV;void main(){vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float t;varying vec2 vU;varying vec3 vN;varying vec3 vV;void main(){float a=vU.x*6.2832;float w=sin(vU.y*20.0-t*2.6+sin(a*3.0+t*1.3)*1.8)*.5+.5;float w2=sin(vU.y*7.0+t*1.7+a*2.0+sin(a*5.0-t)*1.2)*.5+.5;float f=pow(1.0-abs(dot(vN,vV)),1.6);vec3 c=mix(vec3(.42,.14,1.0),vec3(1.0,.78,1.0),w*w2);gl_FragColor=vec4(c*(1.0+1.7*w*w2+1.3*f),1.0);}'});
 H_ANIM.push((dt,T)=>{plasma.uniforms.t.value=T;});
 for(const K of H_CORE){const pm=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.7,4.2,coarse?20:40,1,true),plasma);pm.position.set(K.x,6.5,K.z);pm.userData.dyn=1;scene.add(pm);
   pool(K.x,0,K.z,8,C(0xb46aff),.22);pool(K.x,DECK,K.z,7.5,C(0xb46aff),.12);
   // the turning rings
   const rg=new THREE.Group();rg.position.set(K.x,6.5,K.z);rg.userData.dyn=1;scene.add(rg);const rings=[];
   for(const [rr,y,tx,sp] of[[2.75,-1.3,.12,.35],[3.15,0,-.1,-.22],[2.75,1.3,.08,.5]]){const mg=new Merger(),lm=new Merger();
     mg.add(new THREE.TorusGeometry(rr,.12,8,coarse?32:64),M(0,0,0,Math.PI/2,0,0),K_TRIM);
     for(let k=0;k<(coarse?6:12);k++){const a=k/(coarse?6:12)*Math.PI*2;mg.add(hbx(.36,.36,.5,1),M(Math.cos(a)*rr,0,Math.sin(a)*rr,0,-a,0),K_WALLD);lm.add(hbx(.1,.1,.52,1),M(Math.cos(a)*rr,.19,Math.sin(a)*rr,0,-a,0),C(0xd8a0ff).multiplyScalar(2));}
     const ring=new THREE.Group();ring.position.y=y;ring.rotation.x=tx;const m1=new THREE.Mesh(mg.build(),hPipeMat),m2=new THREE.Mesh(lm.build(),hLampMat);m1.castShadow=true;m1.receiveShadow=true;ring.add(m1,m2);rg.add(ring);rings.push([ring,sp]);}
   // arcs
   const NA=coarse?3:6,SEGS=7,ap=new Float32Array(NA*SEGS*2*3),ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.BufferAttribute(ap,3));
   const arcs=new THREE.LineSegments(ag,new THREE.LineBasicMaterial({color:C(0xe8c8ff).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));arcs.userData.dyn=1;arcs.frustumCulled=false;scene.add(arcs);
   let at=0;H_ANIM.push((dt,T)=>{for(const [r,s] of rings)r.rotation.y+=s*dt;at-=dt;if(at>0)return;at=HR(.05,.12);let o=0;
     for(let k=0;k<NA;k++){const a=HR(0,6.28),y=HR(4.6,8.4),b=a+HR(-.5,.5),y2=y+HR(-1,1),r2=hr()<.5?2.3:2.75;let px=K.x+Math.cos(a)*1.72,py=y,pz=K.z+Math.sin(a)*1.72;
       for(let s=1;s<=SEGS;s++){const t=s/SEGS,rr=1.72+(r2-1.72)*t,aa=a+(b-a)*t,nx=K.x+Math.cos(aa)*rr+(s<SEGS?HR(-.15,.15):0),ny=y+(y2-y)*t+(s<SEGS?HR(-.2,.2):0),nz=K.z+Math.sin(aa)*rr+(s<SEGS?HR(-.15,.15):0);
         ap.set([px,py,pz,nx,ny,nz],o);o+=6;px=nx;py=ny;pz=nz;}}
     ag.attributes.position.needsUpdate=true;arcs.visible=hr()<.75;});
   // conduits along the floor out from the base, and up the column
   for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.5,dx=Math.cos(a),dz=Math.sin(a),L=3.4,cx=K.x+dx*(2.9+L/2),cz=K.z+dz*(2.9+L/2);
     const pcol=K_PIPE[k%3+1];PP.add(new THREE.CylinderGeometry(.14,.14,L,SEG,1,true).rotateZ(Math.PI/2),M(cx,.16,cz,0,-a,0),pcol);
     PP.add(new THREE.CylinderGeometry(.2,.2,.12,SEG).rotateZ(Math.PI/2),M(K.x+dx*(2.95+L),.16,K.z+dz*(2.95+L),0,-a,0),K_TRIM);
     LM.add(hbx(L,.02,.04,1),M(cx,.31,cz,0,-a,0),tmpC.copy(G_VIO).multiplyScalar(.8).clone());
     PP.add(new THREE.CylinderGeometry(.09,.09,3.6,SEG),M(K.x+Math.cos(a+.26)*2.98,2.2,K.z+Math.sin(a+.26)*2.98),pcol);}
   for(let k=0;k<(coarse?12:24);k++){const a=k/(coarse?12:24)*Math.PI*2;DK.add(hbx(.1,.06,.7,1),M(K.x+Math.cos(a)*2.95,4.33,K.z+Math.sin(a)*2.95,0,-a,0),K_TRIM);}}

 /* the bays: a light rig over each, its pools on the floor, the hull's struts outside the viewport, consoles by the window */
 for(const B of GS.BASES){const s=Math.sign(B.x),TC=C(GS.TEAMS[B.team].c);
   for(const zz of[-5,5]){DK.add(hbx(20,.3,.3,1),M(B.x,13.1,zz),K_TRIM);DK.add(hbx(20,.3,.3,1),M(B.x,12.4,zz),K_TRIM);
     for(let k=0;k<10;k++)DK.add(hbx(.08,.95,.08,1),M(B.x-9.5+k*2.1,12.75,zz,0,0,k%2?.7:-.7),K_TRIM);
     for(const dx of[-7,-2.5,2.5,7]){DK.add(new THREE.CylinderGeometry(.35,.45,.4,14),M(B.x+dx,12.05,zz),K_WALLD);LM.add(new THREE.CircleGeometry(.32,14).rotateX(Math.PI/2),M(B.x+dx,11.84,zz),C(0xeef2ff).multiplyScalar(2.4));
       pool(B.x+dx,0,zz,3.4,C(0xdde4ff),.13);}}
   pool(B.x,0,B.z,9,TC,.12);
   // outside the viewport: the hull's frame and a lip of plating
   const vx=B.x+s*13;for(const zz of[-9.4,-4.7,0,4.7,9.4])DK.add(hbx(1.4,10,.5,1),M(vx+s*.6,7,zz,0,0,s*.15),K_HULL);DK.add(hbx(4,.8,20,1),M(vx+s*1.8,2.4,0,0,0,-s*.4),K_HULL);DK.add(hbx(3.4,.8,20,1),M(vx+s*1.6,12.1,0,0,0,s*.35),K_HULL);
   for(const zz of[-6.5,6.5]){const cx=B.x+s*11.4;DK.add(hbx(.6,1.1,1.6,1),M(cx,.95,zz,0,0,s*.25),K_WALLD);LM.add(hbx(.02,.6,1.2,1),M(cx-s*.32,1.2,zz,0,0,s*.25),tmpC.copy(TC).multiplyScalar(1.2).clone());}}

 /* the hold: pendant lamps in cages over the aisles, and their pools */
 for(const q of[1,-1])for(const zz of[12.2,17,21.9])for(let x=-51;x<=-29;x+=5.5){const X=x*q,Z=zz*q;
   DK.add(new THREE.CylinderGeometry(.025,.025,.9,4),M(X,5.55,Z),K_CAB);DK.add(new THREE.CylinderGeometry(.18,.32,.3,10),M(X,5.05,Z),K_TRIM);
   for(let k=0;k<4;k++){const a=k/4*Math.PI*2;DK.add(hbx(.03,.4,.03,1),M(X+Math.cos(a)*.2,4.75,Z+Math.sin(a)*.2),K_TRIM);}
   LM.add(new THREE.SphereGeometry(.13,10,8),M(X,4.78,Z),C(0xffb060).multiplyScalar(2.6));pool(X,0,Z,2.4,G_AMB,.2);}

 /* the blast door: hazard stripes along its foot, a frame round it */
 for(const B of H_BOXES){if(B.kind!=='door')continue;const face=[B.x-B.l/2-.012,B.x+B.l/2+.012];
   for(const fx of face){DK.add(hbx(.02,.62,B.w-.1,1),M(fx,.55,B.z),K_DARK);for(let z=B.z-B.w/2+.35;z<B.z+B.w/2-.3;z+=.42)DK.add(hbx(.025,.6,.14,1),M(fx,.55,z,.7,0,0),K_HAZ);
     LM.add(hbx(.02,.08,B.w-.2,1),M(fx,B.h-.25,B.z),G_RED);}
   for(const zz of[B.z-B.w/2-.1,B.z+B.w/2+.1])DK.add(hbx(.9,B.h+.4,.25,1),M(B.x,(B.h+.4)/2,zz),K_TRIM);}

 /* the containers: corner castings, a stencil band, door bars (PC) */
 if(HQX)for(const B of H_BOXES){if(B.kind!=='container')continue;const n2=Math.round(B.h/2.6),c=Math.cos(B.ry),sn=Math.sin(B.ry);
   for(let st=0;st<n2;st++){const y=st*2.6;for(const [i,j] of[[-1,-1],[1,-1],[1,1],[-1,1]])for(const yy of[y+.12,y+2.48]){const lx=i*(B.l/2-.1),lz=j*(B.w/2-.1);DK.add(hbx(.26,.24,.26,1),M(B.x+c*lx+sn*lz,yy,B.z-sn*lx+c*lz),K_WALLD);}
     for(const j of[-1,1]){const lz=j*(B.w/2+.02);DK.add(hbx(B.l*.8,.32,.02,1),M(B.x+sn*lz,y+1.8,B.z+c*lz,0,B.ry,0),tmpC.copy(K_HAZ).multiplyScalar(.6).clone());}
     for(const i of[-1,1]){const lx=i*(B.l/2+.03);for(const o of[-.45,.45])DK.add(new THREE.CylinderGeometry(.04,.04,2.3,6),M(B.x+c*lx+sn*o,y+1.3,B.z-sn*lx+c*o),K_TRIM);}}}

 /* big wrecks drifting outside: ribbed hull sections, slowly turning */
 {const wm=hDebrisMat.clone();wm.fog=false;
  for(const [x,y,z,sc,sp] of[[40,150,-70,1,.02],[-320,30,90,1.4,-.015],[140,10,-300,1.2,.012],[-120,200,160,.9,.018]].slice(0,HQX?4:2)){const mg=new Merger(),ribs=HQX?9:5,R0=22;
    for(let k=0;k<ribs;k++){mg.add(new THREE.TorusGeometry(R0,.9,6,24,Math.PI*HR(.45,.8)),M(k*4.2-ribs*2.1,0,0,0,Math.PI/2,HR(-.2,.2)),K_HULL);}
    for(let k=0;k<(HQX?16:8);k++){const a=HR(.1,1.4),r=R0+.6;mg.add(hbx(HR(3,4.2),.5,HR(5,9),1),M(HR(-ribs*2.1,ribs*2.1),Math.sin(a)*r,Math.cos(a)*r,-a+Math.PI/2,0,0),C(0x6a6478));}
    mg.add(H_IBEAM,mat4(0,R0*.6,0,ribs*5,3,3),K_TRIM);
    const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(sc);g.rotation.set(HR(0,6),HR(0,6),HR(0,6));const m=new THREE.Mesh(mg.build(),wm);g.add(m);g.userData.dyn=1;scene.add(g);
    H_ANIM.push(dt=>{g.rotation.x+=sp*dt;g.rotation.y+=sp*.6*dt;});}}

 hMesh(DK.build(),hDarkMat,true,true);hMesh(PP.build(),hPipeMat,true,true);hMesh(BN.build(),hBoneMat,true,true);hMesh(LM.build(),hLampMat,false,false);
 {const m=hMesh(PL.build(),addM(POOLT),false,false);m.renderOrder=3;const b=hMesh(BAR.build(),addM(BART),false,false);b.renderOrder=3;}
 {const m=hMesh(SH.build(),new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
   vertexShader:'varying vec2 vU;varying float vF;varying vec3 vC;void main(){vU=uv;vC=color;vec4 mv=modelViewMatrix*vec4(position,1.0);vF=abs(dot(normalize(normalMatrix*normal),normalize(-mv.xyz)));gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying vec2 vU;varying float vF;varying vec3 vC;void main(){float a=smoothstep(0.0,.45,vU.y)*smoothstep(1.0,.93,vU.y)*pow(vF,1.4);gl_FragColor=vec4(vC*a,1.0);}'}),false,false);m.renderOrder=4;}}
// drifting in the hangar: loose plates, beams, chunks and bolts, slowly turning (there's nothing to pull them down); a few big torn hull
// sections drift high up under the breach (Nov 8: about twice as many as before, in four shapes)
const H_FLOAT=(()=>{const N=coarse?40:110;
  const mk=(sc,y0,y1,vk)=>()=>({p:new THREE.Vector3(R(-20,20),R(y0,y1),R(-22,22)),s:sc(),r:new THREE.Euler(R(0,6),R(0,6),R(0,6)),w:new THREE.Vector3(R(-.4,.4),R(-.4,.4),R(-.4,.4)).multiplyScalar(vk),v:new THREE.Vector3(R(-.15,.15),R(-.06,.06),R(-.15,.15)).multiplyScalar(vk),y0,y1});
  const keep=d=>{if(Math.abs(d.p.x)>21)d.v.x=-Math.sign(d.p.x)*Math.abs(d.v.x);if(Math.abs(d.p.z)>23)d.v.z=-Math.sign(d.p.z)*Math.abs(d.v.z);if(d.p.y<d.y0||d.p.y>d.y1)d.v.y=(d.p.y<d.y0?1:-1)*Math.abs(d.v.y);};
  const T=hTumblers([[new THREE.BoxGeometry(1,1,1),Math.round(N*.45),mk(()=>new THREE.Vector3(R(.2,1.4),R(.04,.25),R(.2,1.1)),2.5,21,1)],
    [new THREE.IcosahedronGeometry(.5,0),Math.round(N*.2),mk(()=>{const k=R(.12,.5);return new THREE.Vector3(k*R(.7,1.4),k,k*R(.7,1.3));},2.5,21,1.2)],
    [H_IBEAM.clone(),Math.round(N*.2),mk(()=>{const k=R(.18,.4);return new THREE.Vector3(R(1.2,4),k,k);},3,20,.7)],
    [H_RPLATE.clone(),Math.round(N*.15),mk(()=>{const k=R(1.2,4.5);return new THREE.Vector3(k,R(.4,.8),k*R(.5,.9));},12,22.5,.35)]],null,keep);
  for(const m of T.meshes)m.castShadow=true;return T;})();
// the hum of what's still running in her, and now and then the hull groaning (a little synth)
const H_SND=(()=>{let ctx=null,g=null;
  function start(){if(ctx)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(_){return;}
    g=ctx.createGain();g.gain.value=0;g.connect(ctx.destination);
    for(const [f,v] of[[46,.5],[46.7,.4],[92.3,.18],[138,.06]]){const o=ctx.createOscillator();o.type='sine';o.frequency.value=f;const og=ctx.createGain();og.gain.value=v;o.connect(og);og.connect(g);o.start();}
    const len=ctx.sampleRate*3,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);let b=0;for(let i=0;i<len;i++){b=.995*b+(Math.random()*2-1)*.05;d[i]=b;}
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;const ng=ctx.createGain();ng.gain.value=.9;src.connect(lp);lp.connect(ng);ng.connect(g);src.start();
    g.gain.linearRampToValueAtTime(.09,ctx.currentTime+3);}
  function groan(){if(!ctx)return;const t=ctx.currentTime,o=ctx.createOscillator(),og=ctx.createGain(),f=R(38,70);o.type='sawtooth';o.frequency.setValueAtTime(f,t);o.frequency.linearRampToValueAtTime(f*R(.6,.85),t+2.4);
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;og.gain.setValueAtTime(0,t);og.gain.linearRampToValueAtTime(R(.05,.11),t+.5);og.gain.exponentialRampToValueAtTime(.001,t+3);o.connect(lp);lp.connect(og);og.connect(ctx.destination);o.start(t);o.stop(t+3.1);}
  const go=()=>{start();if(ctx&&ctx.state==='suspended')ctx.resume();};addEventListener('pointerdown',go);addEventListener('keydown',go);
  document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden)ctx.suspend();else ctx.resume();});
  return{groan};})();
let H_GT=R(10,20);
GS.indoorAt=()=>{const c=camera.position;return H_GRAV(c.x,c.y,c.z)?.55:1;};
function updateLights(dt,T,pos){H_DEBRIS.update(dt);H_FLOAT.update(dt);for(const f of H_ANIM)f(dt,T);
  for(const H of H_LIGHTS){if(H.kind==='core')H.L.intensity=H.base*(.85+.15*Math.sin(T*2.1)+.05*Math.sin(T*13.7));else H.L.intensity=H.base*(.35+.65*Math.max(0,Math.sin(T*2.2+H.ph)));}
  H_GT-=dt;if(H_GT<=0){H_GT=R(14,30);H_SND.groan();}}
// dust in the air (here: motes in the light)
const DUST_N=coarse?160:520,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,12),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.06,color:C(0xd8c8ff),transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending}));dust.userData.dyn=1;scene.add(dust);

/* ---------- the bots' map: a spot every 2 m on each deck, the feet and heads of the ramps, joined where you can walk from one to the
   next on its level (the ramps are the only ways between the decks, for them). NEXT[t*N+a] is the next spot on the way from a to t ---------- */
/* (Nov 10, Bryce's props, js/shared/furnish.js) the Hollow's own kit, a few each half (the twin turned round): two of its black wall
   panels with the red seams in blue's end of the ship, two dark server towers by them, and the greebled deck plating laid on the
   hangar's floor (a piece of the floor-section pack, sunk so only its ribs stand proud) */
if(typeof FURN!=='undefined'){FURN.lift=.15;const L=[];for(const s of[1,-1]){const P=(x,z)=>s>0?[x,z]:[-x,-z],r0=s>0?0:Math.PI,put=(e,x,z)=>{const p=P(x,z);L.push(Object.assign({},e,{x:p[0],z:p[1],ry:(e.ry||0)+r0}));};
    put({f:'wall-a',ry:5.6287},-54.5,10.5);put({f:'wall-a',ry:0},-51,-2.5);
    put({f:'server-tower',ry:Math.PI,solid:'r',r:.4},-50,13);put({f:'server-tower',ry:0,solid:'r',r:.4},-44.5,-.4);
    put({f:'floor-section',p:'b',ry:Math.PI/2,y:-.95,noShadow:true},-17,-13);}
  FURN.place(L);}
const NAV=(()=>{const t0=performance.now(),nodes=[];
  const add=(x,z,y,f)=>{nodes.push(Object.assign({x,z,y,nb:[],up:true,r:1.5},f||{}));return nodes.length-1;};
  function walk(ax,az,ay,bx,bz,by,m){m=m==null?.35:m;const L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(L/.4));let cy=ay;
    for(let k=1;k<=n;k++){const t=k/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,y=floorY3(x,z,cy+.2);if(Math.abs(y-cy)>.5)return false;if(playD3(x,z,y)>-m)return false;cy=y;}
    return by==null||Math.abs(cy-by)<.6;}
  const ok=(x,z,y)=>playD3(x,z,y)<-.55&&Math.abs(floorY3(x,z,y+.3)-y)<.2;
  for(let c=0;c<HN;c++){const i=c%HNX,j=Math.floor(c/HNX);if(i%2||j%2)continue;const x=hCx(c)+.5,z=hCz(c)+.5;const k=hCell(x,z);if(k<0)continue;
    if(L0[k]&&RAMP[k]<0&&ok(x,z,0))add(x,z,0);
    if(L1[k]&&ok(x,z,DECK))add(x,z,DECK,{perch:ZONE[k]===4||ZONE[k]===6?1:0});}
  for(const R of H_RAMPS){const [x0,x1,z0,z1]=R.r,zm=(z0+z1)/2,ft=R.a+(R.b>R.a?-1.2:1.2),hd=R.b+(R.b>R.a?1.2:-1.2);
    const a=add(ft,zm,0,{r:1.2}),m=add((R.a+R.b)/2,zm,DECK/2,{r:1.2}),b=add(hd,zm,DECK,{r:1.2});nodes[a].ramp=nodes[m].ramp=nodes[b].ramp=1;}
  const BK={},bk=(x,z)=>Math.floor(x/4)+','+Math.floor(z/4);nodes.forEach((n,k)=>{(BK[bk(n.x,n.z)]||(BK[bk(n.x,n.z)]=[])).push(k);});
  const link=(a,b)=>{if(a===b||nodes[a].nb.includes(b))return;nodes[a].nb.push(b);nodes[b].nb.push(a);};
  for(let a=0;a<nodes.length;a++){const A=nodes[a],gx=Math.floor(A.x/4),gz=Math.floor(A.z/4);
    for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const L=BK[(gx+i)+','+(gz+j)];if(!L)continue;for(const b of L){if(b<=a)continue;const B=nodes[b],d=Math.hypot(B.x-A.x,B.z-A.z),lim=A.ramp||B.ramp?7.5:2.9;
      if(d>lim||Math.abs(B.y-A.y)>(A.ramp||B.ramp?4:.3))continue;if(walk(A.x,A.z,A.y,B.x,B.z,B.y)&&walk(B.x,B.z,B.y,A.x,A.z,A.y))link(a,b);}}}
  for(const B of GS.BASES)B.node=nodes.reduce((best,n,k)=>n.y===0&&Math.hypot(n.x-B.x,n.z-B.z)<Math.hypot(nodes[best].x-B.x,nodes[best].z-B.z)?k:best,0);
  const perches=[];nodes.forEach((n,k)=>{if(n.perch&&n.nb.length&&(k*7)%4===0)perches.push(k);});
  const N=nodes.length,NEXT=new Int16Array(N*N).fill(-1),q=new Int32Array(N);
  for(let t=0;t<N;t++){const base=t*N;NEXT[base+t]=t;let h=0,e=0;q[e++]=t;while(h<e){const a=q[h++];for(const b of nodes[a].nb)if(NEXT[base+b]<0){NEXT[base+b]=a;q[e++]=b;}}}
  const memo=new Map();
  function nearest(x,z,y){if(y==null)y=0;const mk=(Math.round(x)*1000+Math.round(z))*16+(y>3.5?1:0);const hit=memo.get(mk);if(hit!==undefined)return hit;
    const gx=Math.floor(x/4),gz=Math.floor(z/4),c=[];for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const L=BK[(gx+i)+','+(gz+j)];if(L)for(const k of L){const n=nodes[k],dy=Math.abs(n.y-y);c.push([Math.hypot(n.x-x,n.z-z)+(dy>1.4?40+dy*8:0),k]);}}
    c.sort((p,q)=>p[0]-q[0]);let best=c.length?c[0][1]:-1;for(let k=0;k<Math.min(8,c.length);k++){const n=nodes[c[k][1]];if(walk(x,z,y,n.x,n.z,n.y,.25)){best=c[k][1];break;}}
    if(memo.size>60000)memo.clear();memo.set(mk,best);return best;}
  const clear3=(ax,az,ay,bx,bz,by,m)=>walk(ax,az,ay,bx,bz,by,m==null?.4:m);
  const clear=(ax,az,bx,bz,m)=>walk(ax,az,0,bx,bz,null,m==null?.5:m);
  return{nodes,N,NEXT,nearest,clear,clear3,perches,ms:performance.now()-t0};})();
GS.nav=NAV;
// where the bots go looking: the hangar's floor and galleries, the reactors, the hold, the spine, the main corridor
GS.HILLS=[{x:0,z:8},{x:0,z:-8},{x:-12,z:0},{x:12,z:0},{x:-33,z:-7},{x:33,z:7},{x:-40,z:17},{x:40,z:-17},{x:-44,z:-18},{x:44,z:18},{x:-48,z:0},{x:48,z:0},{x:-16,z:-20},{x:16,z:20}];
GS.INTRO=[[[0,58,4],[0,8,0]],[[2,20,6],[-8,6,-4]],[[-14,8.6,0],[-34,7,0]],[[-46,1.7,0],[-70,1.6,0]]];

let composer=null,HQ=true;
/* Nov 9 2026 (the graphics overhaul): the finishing pass the campaign uses (js/shared/grade.js): antialiased, bloom after the tone
   mapping, the filmic grade, vignette, grain; 24-bit depth (its target has a stencil, as the old one here did). Low skips it. */
try{if(typeof GRADE!=='undefined'){const F=GRADE.composer(renderer,scene,camera,{phone:coarse,bloom:[.55,.45,.8],grade:{gam:2.2,contrast:1.07,sat:1.05,vig:.36,grain:coarse?.02:.026,fringe:coarse?0:.0012}});if(F.on){composer=F;}}}catch(e){composer=null;}
if(!composer)try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,stencilBuffer:true});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.55,.45,.8));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
try{const q=localStorage.getItem('elyra.quality');if(q)HQ=q!=='low';}catch(_){}
function setQuality(hq){HQ=hq;try{localStorage.setItem('elyra.quality',hq?'high':'low');}catch(_){}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,hq?(coarse?1.5:1.75):(coarse?1.1:1)));renderer.shadowMap.enabled=true;
  if(composer&&composer.on)composer.setSize(innerWidth,innerHeight);else{renderer.setSize(innerWidth,innerHeight);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);}}$('quality').textContent=hq?'Quality: high':'Quality: low';}
$('quality').addEventListener('click',()=>{setQuality(!HQ);$('quality').blur();});
setQuality(HQ);
function renderFrame(){if(composer&&HQ){try{composer.render();return;}catch(e){composer=null;}}renderer.render(scene,camera);}
addEventListener('resize',()=>{if(composer&&composer.on)composer.setSize(innerWidth,innerHeight);else{renderer.setSize(innerWidth,innerHeight);if(composer)composer.setSize(innerWidth,innerHeight);}camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
{const mb=$('menuBtn'),vw=$('views');const set=o=>{vw.classList.toggle('open',o);mb.setAttribute('aria-expanded',o?'true':'false');};
 mb.addEventListener('click',e=>{e.stopPropagation();set(!vw.classList.contains('open'));mb.blur();});
 vw.addEventListener('click',e=>{if(e.target.closest('button,a'))setTimeout(()=>set(false),250);});
 renderer.domElement.addEventListener('pointerdown',()=>set(false));addEventListener('keydown',e=>{if(e.code==='Escape')set(false);});}
function flashScreen(a){const f=$('flash');f.style.transition='none';f.style.opacity=a;requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity=0;});}
