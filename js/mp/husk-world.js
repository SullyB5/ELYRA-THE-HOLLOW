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
// wreckage outside: plates and beams tumbling slowly round the hull
const H_DEBRIS=(()=>{const N=coarse?60:140,g=new THREE.BoxGeometry(1,1,1);g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(g.attributes.position.count*3).fill(1),3));
  const m=new THREE.InstancedMesh(g,hDarkMat,N),D=[],o=new THREE.Object3D();
  for(let i=0;i<N;i++){const a=R(0,6.28),r=R(70,420),y=R(-140,160);D.push({p:new THREE.Vector3(Math.cos(a)*r*1.4,y,Math.sin(a)*r),s:new THREE.Vector3(R(1,9),R(.2,1.2),R(1,6)),r:new THREE.Euler(R(0,6),R(0,6),R(0,6)),w:new THREE.Vector3(R(-.1,.1),R(-.1,.1),R(-.1,.1)),v:new THREE.Vector3(R(-.4,.4),R(-.15,.15),R(-.4,.4))});
    if(Math.abs(D[i].p.x)<95&&Math.abs(D[i].p.z)<40&&Math.abs(D[i].p.y)<30)D[i].p.y+=60*Math.sign(D[i].p.y||1);}
  m.userData.dyn=1;m.frustumCulled=false;m.castShadow=false;scene.add(m);
  function update(dt){for(let i=0;i<N;i++){const d=D[i];d.p.addScaledVector(d.v,dt);d.r.x+=d.w.x*dt;d.r.y+=d.w.y*dt;d.r.z+=d.w.z*dt;o.position.copy(d.p);o.rotation.copy(d.r);o.scale.copy(d.s);o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.instanceMatrix.needsUpdate=true;}
  update(0);return{update};})();

/* ---------- light: the star through the breach and the windows (the hull's walls and ceilings throw its shadows), a dim violet
   ambience, the cores, the bays' own colour, the hangar's red emergency lamps ---------- */
const hemi=new THREE.HemisphereLight(C(0x7a6a9c),C(0x2c2636),1.55);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(C(0xffdcb0),2.2);scene.add(keyLight,keyLight.target);
keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
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
 for(const [mg,mat,sh] of[[FL,hFloorMat,true],[WL,hWallMat,true],[DK,hDarkMat,true],[BN,hDarkMat,true]])hMesh(mg.build(),mat,sh,true);
 hMesh(LM.build(),hLampMat,false,false);{const g=hMesh(GL.build(),hGlassMat,false,false);g.renderOrder=2;}}

/* ---------- the rooms' own things ---------- */
{const DK=new Merger(),WL=new Merger(),LM=new Merger(),CT=new Merger();
 // containers: Hollow cargo boxes, dark plate with ribs and a violet seam; the platform; pods; crates; the half-shut blast door; tanks
 for(const B of H_BOXES){const y0=B.y||0;
   if(B.kind==='container'){const n=Math.round(B.h/2.6);for(let s=0;s<n;s++){const y=y0+s*2.6+1.3,col=tmpC.copy(hash(B.x|0,s)<.5?C(0x7a6c88):C(0x627080)).clone();
       CT.add(hbx(B.l,2.5,B.w,2),M(B.x,y,B.z,0,B.ry,0),col);for(let k=-2;k<=2;k++){const c=Math.cos(B.ry),sn=Math.sin(B.ry),o=k*B.l/5;DK.add(hbx(.12,2.56,B.w+.06,1),M(B.x+c*o,y,B.z-sn*o,0,B.ry,0),K_TRIM);}
       LM.add(hbx(B.l-.4,.05,.05,1),M(B.x,y+1.1,B.z,0,B.ry,0),s%2?G_VIO:G_RED);}}
   else if(B.kind==='platform'){CT.add(hbx(B.l,B.h,B.w,2),M(B.x,B.h/2,B.z),K_WALL2);LM.add(hbx(B.l+.02,.06,B.w+.02,1),M(B.x,B.h-.1,B.z),G_VIO);
     for(const [dx,dz] of[[-1,-1],[1,-1],[1,1],[-1,1]])DK.add(hbx(.4,DECK-B.h,.4,1),M(B.x+dx*(B.l/2-.4),B.h+(DECK-B.h)/2,B.z+dz*(B.w/2-.4)),K_TRIM);}
   else if(B.kind==='pods'){const n=Math.round(B.l/2.1);for(let k=0;k<n;k++){const x=B.x-B.l/2+(k+.5)*B.l/n;CT.add(new THREE.SphereGeometry(1,16,10),mat4(x,1.3,B.z,.95,1.35,1.05,0,0,0),C(0x2e2834));LM.add(hbx(.06,1.6,.06,1),M(x,1.35,B.z+(B.z>0?-1:1)*1.02),G_AMB);}
     DK.add(hbx(B.l,.3,B.w,1),M(B.x,.15,B.z),K_TRIM);DK.add(hbx(B.l,.2,.2,1),M(B.x,2.55,B.z),K_TRIM);}
   else if(B.kind==='crate'){CT.add(hbx(B.l,B.h,B.w,1),M(B.x,y0+B.h/2,B.z,0,B.ry,0),C(0x4e4a40));DK.add(hbx(B.l+.04,.12,B.w+.04,1),M(B.x,y0+B.h*.7,B.z,0,B.ry,0),K_TRIM);}
   else if(B.kind==='door'){WL.add(hbx(B.l,B.h,B.w,1),M(B.x,B.h/2,B.z),K_WALL2);LM.add(hbx(B.l+.02,.08,B.w,1),M(B.x,B.h-.5,B.z),G_RED);for(let k=0;k<5;k++)DK.add(hbx(B.l+.06,.14,B.w,1),M(B.x,.6+k*.9,B.z,0,0,.35),K_TRIM);}
   else if(B.kind==='tank'){CT.add(new THREE.CylinderGeometry(B.r,B.r,B.h,18),M(B.x,B.h/2,B.z),C(0x5a5048));DK.add(new THREE.CylinderGeometry(B.r+.05,B.r+.05,.18,18),M(B.x,B.h*.8,B.z),K_TRIM);LM.add(new THREE.CylinderGeometry(B.r+.02,B.r+.02,.05,18),M(B.x,B.h*.3,B.z),G_AMB);}}
 // the cores: a column floor to roof, rings round it, the glowing heart split open
 for(const K of H_CORE){DK.add(new THREE.CylinderGeometry(2.4,2.8,4.3,20),M(K.x,2.15,K.z),K_WALLD);DK.add(new THREE.CylinderGeometry(2.2,2.5,5.3,20),M(K.x,11.35,K.z),K_WALLD);DK.add(new THREE.CylinderGeometry(1.1,1.1,4.4,12),M(K.x,6.5,K.z),C(0x1a1424));
   for(const y of[1,3.2,9.8,12.4])DK.add(new THREE.CylinderGeometry(3.1,3.1,.5,24),M(K.x,y,K.z),K_TRIM);
   LM.add(new THREE.CylinderGeometry(1.7,1.7,4.2,20,6,true),M(K.x,6.5,K.z),C(0x9a50ff).multiplyScalar(1.25));for(let k=0;k<5;k++)LM.add(new THREE.TorusGeometry(1.85,.05,6,24),M(K.x,4.7+k*.9,K.z,Math.PI/2,0,0),C(0xd8a0ff).multiplyScalar(1.6));
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
// drifting in the hangar: loose plates, bolts and dust, slowly turning (there's nothing to pull them down)
const H_FLOAT=(()=>{const N=coarse?24:48,g=new THREE.BoxGeometry(1,1,1);g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(g.attributes.position.count*3).fill(1),3));
  const m=new THREE.InstancedMesh(g,hDarkMat,N),D=[],o=new THREE.Object3D();
  for(let i=0;i<N;i++)D.push({p:new THREE.Vector3(R(-20,20),R(2.5,21),R(-22,22)),s:new THREE.Vector3(R(.2,1.4),R(.04,.25),R(.2,1.1)),r:new THREE.Euler(R(0,6),R(0,6),R(0,6)),w:new THREE.Vector3(R(-.4,.4),R(-.4,.4),R(-.4,.4)),v:new THREE.Vector3(R(-.15,.15),R(-.06,.06),R(-.15,.15))});
  m.userData.dyn=1;m.frustumCulled=false;m.castShadow=true;scene.add(m);
  function update(dt){for(let i=0;i<N;i++){const d=D[i];d.p.addScaledVector(d.v,dt);if(Math.abs(d.p.x)>21)d.v.x*=-1;if(Math.abs(d.p.z)>23)d.v.z*=-1;if(d.p.y<2.5||d.p.y>22)d.v.y*=-1;
    d.r.x+=d.w.x*dt;d.r.y+=d.w.y*dt;d.r.z+=d.w.z*dt;o.position.copy(d.p);o.rotation.copy(d.r);o.scale.copy(d.s);o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.instanceMatrix.needsUpdate=true;}
  update(0);return{update};})();
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
function updateLights(dt,T,pos){H_DEBRIS.update(dt);H_FLOAT.update(dt);
  for(const H of H_LIGHTS){if(H.kind==='core')H.L.intensity=H.base*(.85+.15*Math.sin(T*2.1)+.05*Math.sin(T*13.7));else H.L.intensity=H.base*(.35+.65*Math.max(0,Math.sin(T*2.2+H.ph)));}
  H_GT-=dt;if(H_GT<=0){H_GT=R(14,30);H_SND.groan();}}
// dust in the air (here: motes in the light)
const DUST_N=coarse?120:260,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,12),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.06,color:C(0xd8c8ff),transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending}));dust.userData.dyn=1;scene.add(dust);

/* ---------- the bots' map: a spot every 2 m on each deck, the feet and heads of the ramps, joined where you can walk from one to the
   next on its level (the ramps are the only ways between the decks, for them). NEXT[t*N+a] is the next spot on the way from a to t ---------- */
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
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,stencilBuffer:true});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.55,.45,.8));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
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
