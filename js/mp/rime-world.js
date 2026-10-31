/* Elyra · Multiplayer · Rime — the world (Oct 30, Bryce: "one of a frozen landscape, maybe on a glacier ... try to go all out on the
   first try"). Elyra's far south: a glacier tongue between two ridges, the sun a hand above the horizon, the pack ice of a frozen sea
   past the glacier's front.

   A square 220 m across (HALF 110), medium: smaller than Gilded Shore, bigger than Rainveil. The same turned half way round
   (x,z → -x,-z), so neither side has the better ground. Blue's outpost on a rock outcrop in the west, red's in the east, each with one
   warthog (CFG.baseHogs). Between them:
     the Rift        a crevasse 6 m wide and 5 m deep from the north edge to the south, ramps down at both ends, two snow bridges
                     over it; you drop into it anywhere and walk its floor out of sight
     the station     a Keeper research station across the Rift in the middle, its middle fallen into it: each half tilts down to the
                     break, and its broken floor slab leans down into the Rift floor. Windows you shoot through, doors, a gun rack in
                     each half, roofs you reach up the snow drifted against their sides
     the ice caves   one by each base (blue's south-west, red's north-east): an entrance ramp down, then a tunnel under the ice with
                     blue light through its roof and three holes you can drop through, out into the Rift
     the Teeth       two open trenches across the approaches (north-west and south-east), a snow bridge over each
   Seracs and pressure ridges for cover, frozen Hollow skimmers half sunk in the ice. Blowing snow the whole time and a whiteout now
   and then that pulls the fog in (and the bots' sight with it), so the long lanes don't belong to the snipers.

   Same contract as js/mp/jungle-world.js for js/origin/03-play.js (playD, playD3, groundY, floorY3, OBST, LZ, the road stand-ins ...),
   S3 for the station's walls and roofs, the seracs and wrecks, and the bridges' and caves' slabs (shots, sight), and a walking graph
   for the bots on every level (GS.nav). Units are metres; north is -z. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(2237);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.5:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.86;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
window.ELYRA_RENDERER=renderer;
$('app').appendChild(renderer.domElement);
MODELS.preload(['chars/keeper-footsoldier','rifle']);
window.WARM_TEAMS=[];window.WARM_POOL=.01;
window.HERALD_LIFT=null;
window.PLAYER_KIND='keeper-footsoldier';window.PLAYER_OPTS={tint:0x9ab8ff};

const scene=new THREE.Scene();
const HAZE_HEX=0xc2d5e4,RM_FOG0=.0062;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),RM_FOG0);scene.background=scene.fog.color.clone();
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,16000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();
const lerp=(a,b,u)=>a+(b-a)*u;
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const mir=p=>[-p[0],-p[1]];   // the map's symmetry: half a turn about the middle
// the sun: low in the south-west, a hand above the horizon (long shadows on the ice)
const sunDir=new THREE.Vector3(-.62,.3,.74).normalize();

/* ---------- the plan ---------- */
const GS=(()=>{
  const HALF=110;
  const TEAMS={blue:{c:0x3f8cff,tint:0x9ab8ff,name:'BLUE'},red:{c:0xff4a3a,tint:0xffa496,name:'RED'},yellow:{c:0xffc83a,tint:0xffe39a,name:'YELLOW'},green:{c:0x3fe07a,tint:0xa8f0bc,name:'GREEN'}};
  const BASE_R=12;
  const BASES=[{team:'blue',x:-92,z:0},{team:'red',x:92,z:0}].map(B=>{B.fx=-Math.sign(B.x);B.fz=0;B.r=BASE_R;B.shieldR=15;B.spawnR=5;B.spawnStep=2.5;return B;});
  // (the match's settings for this map: js/mp/03-match.js reads them)
  const CFG={id:'mprime',name:'RIME',sub:'Team deathmatch · glacier',air:false,vehicles:true,baseHogs:1,aiHogs:0,bots:10,score:50,time:12*60,see:95,range:88,hold:30,flashlights:false,beacon:true,domeK:.75,domeFog:true,
    brief:'Multiplayer · team deathmatch. A glacier at the bottom of Elyra, the sun low over the ice and the wind never stopping. A crevasse runs the length of it, an old Keeper station has broken its back across it, and ice caves run under the glacier from each outpost into the crevasse. When a whiteout comes through, you won\'t see far, and neither will they.',
    objective:'Down the other side. Your outpost has guns, ammo and a warthog; nothing crosses its dome.'};
  return{HALF,SEA:-99,TEAMS,BASES,BASE_R,CFG,NAME:CFG.name};})();
const LZ={x:GS.BASES[0].x,z:GS.BASES[0].z,r:14};

/* ---------- the ice: the glacier's surface, levelled round the station, the outcrops under the outposts, banks at the edge ---------- */
function edgeD(x,z){return Math.max(Math.abs(x),Math.abs(z));}
function rmRaw(x,z){return(fbm(x*.016+3.1,z*.016-5.7)-.5)*3.4+(fbm(x*.05-2.3,z*.05+7.1)-.5)*.7;}
function rmSym(x,z){return(rmRaw(x,z)+rmRaw(-x,-z))/2;}
const RM_S0=rmSym(0,0),RM_SEA=-48;
for(const B of GS.BASES)B.y=rmSym(B.x,B.z)+3.2;
// the station (east half; the west is the same turned half way round): x 7..19, z -6..6, the floor tilting down 0.15 m a metre
// toward the break in the middle, its roof 4.2 m over the floor. The Rift's floor is 5.2 m down
const RM_ST={k:.15,x0:7,x1:19,hz:6,roofH:4.2,dep:5.2};
const rmStFloor=X=>RM_S0+.2-RM_ST.k*(RM_ST.x1-X);
const rmStRoof=X=>rmStFloor(X)+RM_ST.roofH;
const rmRampY=X=>X<=2?RM_S0-RM_ST.dep:lerp(RM_S0-RM_ST.dep,rmStFloor(RM_ST.x0),(X-2)/(RM_ST.x0-2));
const rmInSt=(X,Z)=>X>=RM_ST.x0&&X<=RM_ST.x1&&Z>=-RM_ST.hz&&Z<=RM_ST.hz;
const rmInGap=(X,Z)=>X>=1.8&&X<RM_ST.x0&&Z>=-5&&Z<=5;
// the snow drifted against the north side of each half, right up to its roof (the way up), and the snow dug back to the floor's
// level round its doors
function rmDrift(X,Z){if(X<8||X>20||Z<-20.5||Z>-5.9)return-1e9;const top=rmStRoof(clamp(X,9.5,18.5))+.05,u=clamp((Z+19.5)/13.5,0,1),side=sstep(8,11,X)*sstep(20,17.6,X);
  return RM_S0+(top-RM_S0)*Math.pow(u,1.3)*side+.25*Math.sin(X*.9)*u*(1-u)*side;}
function rmMoat(X,Z,h){if(X<RM_ST.x0)return h;const dx=Math.max(0,X-RM_ST.x1),dz=Math.max(0,Math.abs(Z)-RM_ST.hz),d=Math.hypot(dx,dz);if(d>4.6||(dx===0&&dz===0))return h;
  return lerp(rmStFloor(clamp(X,RM_ST.x0,RM_ST.x1)),h,sstep(.25,4.6,d));}
function rmSurf(x,z){let h=rmSym(x,z);
  {const d=Math.max(Math.abs(x)/27,Math.abs(z)/19);if(d<1.2)h=lerp(RM_S0,h,sstep(.72,1.15,d));}
  {const q=x<0?-1:1,X=x*q,Z=z*q;h=rmMoat(X,Z,h);const dr=rmDrift(X,Z);if(dr>h)h=dr;}
  for(const B of GS.BASES){const d=Math.hypot(x-B.x,z-B.z);if(d<23)h=lerp(h,B.y,1-sstep(13,21,d));}
  const e=edgeD(x,z)-GS.HALF+8;if(e>0)h+=Math.min(e,8)**2*.055+Math.max(0,e-8)*.88;
  return h;}

/* ---------- the crevasses: each a centreline (a Catmull-Rom curve through its points, sampled every metre), a half width, a depth,
   and how long the ramp is at each end (0: it ends against something, here only where a cave runs into the Rift). Covers are the
   stretches with snow or ice over them (bridges, the caves' roofs), with holes you can drop through ---------- */
const RM_CREV=[],RM_CG={},RM_CGC=4;
function rmCatmull(pts,step){const out=[],n=pts.length;
  for(let i=0;i<n-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(n-1,i+2)],L=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),m=Math.max(1,Math.ceil(L/step));
    for(let k=0;k<m;k++){const t=k/m,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);out.push({x:f(p0[0],p1[0],p2[0],p3[0]),z:f(p0[1],p1[1],p2[1],p3[1])});}}
  out.push({x:pts[n-1][0],z:pts[n-1][1]});return out;}
function rmAddCrev(pts,o){const P=rmCatmull(pts,1);let s=0;
  for(let i=0;i<P.length;i++){if(i)s+=Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z);P[i].s=s;}
  for(let i=0;i<P.length;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],L=Math.hypot(b.x-a.x,b.z-a.z)||1;P[i].tx=(b.x-a.x)/L;P[i].tz=(b.z-a.z)/L;}
  const c={id:RM_CREV.length,P,L:s,hw:o.hw,dep:o.dep,rA:o.rA||0,rB:o.rB||0,covers:[],name:o.name,wob:o.wob==null?.07:o.wob};RM_CREV.push(c);
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],m=c.hw*(1+c.wob)+5;
    for(let gx=Math.floor((Math.min(a.x,b.x)-m)/RM_CGC);gx<=Math.floor((Math.max(a.x,b.x)+m)/RM_CGC);gx++)for(let gz=Math.floor((Math.min(a.z,b.z)-m)/RM_CGC);gz<=Math.floor((Math.max(a.z,b.z)+m)/RM_CGC);gz++){
      const k=gx+','+gz;(RM_CG[k]||(RM_CG[k]=[])).push(c.id*100000+i);}}
  return c;}
const rmHw=(c,s)=>c.hw*(1+c.wob*Math.sin(s*.21+c.id*1.7)+c.wob*.6*Math.sin(s*.57+c.id*4.1));
const rmTap=(c,s)=>(c.rA>0?sstep(0,c.rA,s):1)*(c.rB>0?sstep(c.L,c.L-c.rB,s):1);
// one crevasse's own answer at a spot: the box distance in its (along, across) frame (negative inside), along, across
const RM_CB=new Float64Array(16),RM_CBI=new Int32Array(16);
function rmCrevQ(c,x,z,out){out=out||{};const L=RM_CG[Math.floor(x/RM_CGC)+','+Math.floor(z/RM_CGC)];out.sd=99;out.s=0;out.d=0;if(!L)return out;let bd=1e18,bi=-1;
  for(const e of L){if(((e/100000)|0)!==c.id)continue;const i=e%100000,a=c.P[i],b=c.P[i+1],ux=b.x-a.x,uz=b.z-a.z,l2=ux*ux+uz*uz,t=clamp(((x-a.x)*ux+(z-a.z)*uz)/l2,0,1),px=a.x+ux*t-x,pz=a.z+uz*t-z,d2=px*px+pz*pz;if(d2<bd){bd=d2;bi=i;}}
  if(bi<0)return out;return rmFrame(c,bi,x,z,out);}
function rmFrame(c,i,x,z,out){const a=c.P[i],b=c.P[i+1],sl=Math.hypot(b.x-a.x,b.z-a.z)||1,ux=(b.x-a.x)/sl,uz=(b.z-a.z)/sl;let t=((x-a.x)*ux+(z-a.z)*uz)/sl;
  if(i>0)t=Math.max(t,0);if(i<c.P.length-2)t=Math.min(t,1);
  const s=a.s+t*sl,d=-(x-a.x)*uz+(z-a.z)*ux,ax=Math.max(-s,s-c.L),ay=Math.abs(d)-rmHw(c,clamp(s,0,c.L));
  out.sd=ax>0||ay>0?Math.hypot(Math.max(ax,0),Math.max(ay,0)):Math.max(ax,ay);out.s=s;out.d=d;return out;}
// every crevasse near a spot, together: the nearest wall (bd, negative inside any), the deepest floor among those you're inside,
// and which one you're nearest the middle of
const RM_CI={bd:9,floor:0,deep:0,ndep:0,c:null,s:0,d:0},RM_CQ={};
function rmCrev(x,z){const L=RM_CG[Math.floor(x/RM_CGC)+','+Math.floor(z/RM_CGC)];RM_CI.bd=9;RM_CI.c=null;RM_CI.deep=0;RM_CI.floor=1e9;if(!L)return RM_CI;
  const n=RM_CREV.length;for(let k=0;k<n;k++){RM_CB[k]=1e18;RM_CBI[k]=-1;}
  for(const e of L){const id=(e/100000)|0,i=e%100000,c=RM_CREV[id],a=c.P[i],b=c.P[i+1],ux=b.x-a.x,uz=b.z-a.z,l2=ux*ux+uz*uz,t=clamp(((x-a.x)*ux+(z-a.z)*uz)/l2,0,1),px=a.x+ux*t-x,pz=a.z+uz*t-z,d2=px*px+pz*pz;
    if(d2<RM_CB[id]){RM_CB[id]=d2;RM_CBI[id]=i;}}
  let sf=0;
  for(let k=0;k<n;k++){if(RM_CBI[k]<0)continue;const c=RM_CREV[k];rmFrame(c,RM_CBI[k],x,z,RM_CQ);
    if(RM_CQ.sd<RM_CI.bd){RM_CI.bd=RM_CQ.sd;RM_CI.c=c;RM_CI.s=RM_CQ.s;RM_CI.d=RM_CQ.d;RM_CI.ndep=c.dep*rmTap(c,clamp(RM_CQ.s,0,c.L));}
    if(RM_CQ.sd<0){const dp=c.dep*rmTap(c,RM_CQ.s);if(!sf)sf=rmSurf(x,z);const f=sf-dp+.16*(vnoise(x*.45+c.id*9,z*.45)-.5);if(f<RM_CI.floor)RM_CI.floor=f;if(dp>RM_CI.deep)RM_CI.deep=dp;}}
  return RM_CI;}
// what's over a crevasse here: the top of a bridge or a cave's roof (flush with the ice round it), or null
function rmCover(x,z){const I=rmCrev(x,z);if(I.bd>.45||!I.c)return null;const c=I.c,s=I.s,d=I.d;
  for(const K of c.covers){if(s<K.s0||s>K.s1)continue;for(const H of K.holes)if(Math.hypot(s-H.s,d-H.d)<H.r)return null;
    return rmSurf(x,z)+.06+(K.arch?K.arch*Math.cos(clamp(d/(c.hw+1),-1,1)*Math.PI/2):0);}
  return null;}

/* ---------- the layout ---------- */
// the Rift: north edge to south edge, wandering, dead straight under the station (so its break sits square across it)
const rmRiftX=z=>(7*Math.sin(z*.035)+3*Math.sin(z*.09))*sstep(9,22,Math.abs(z));
const RM_RIFT=rmAddCrev((()=>{const p=[];for(let z=-90;z<=90;z+=6)p.push([rmRiftX(z),z]);return p;})(),{hw:3,dep:RM_ST.dep,rA:15,rB:15,name:'rift',wob:.06});
// the ice caves, blue's (south-west) and red's (north-east, the same turned half way round): a ramp down from the ice, then the
// tunnel under it into the Rift (its far end runs into the Rift's floor, so there's no wall there)
const RM_CAVE_PTS=[[-76,34],[-68,42],[-56,49],[-43,55],[-29,59.5],[-16,61.5],[-5,61],[rmRiftX(60)-.5,60]];
const RM_CAVES=[RM_CAVE_PTS,RM_CAVE_PTS.map(mir)].map((p,k)=>rmAddCrev(p,{hw:2.6,dep:RM_ST.dep,rA:13,rB:0,name:'cave'+k,wob:.1}));
// the Teeth: open trenches across the approaches (north-west, and the same in the south-east)
const RM_TEETH_PTS=[[-62,-78],[-55,-61],[-48,-44],[-44,-28],[-42,-12]];
const RM_TEETH=[RM_TEETH_PTS,RM_TEETH_PTS.map(mir)].map(p=>rmAddCrev(p,{hw:2.2,dep:3.4,rA:9,rB:9,name:'teeth',wob:.12}));
// covers: two snow bridges over the Rift, one over each trench, and the caves' roofs (holes in them to drop through)
{const sAt=(c,x,z)=>rmCrevQ(c,x,z).s;
 for(const zz of[-38,38]){const s=sAt(RM_RIFT,rmRiftX(zz),zz);RM_RIFT.covers.push({s0:s-3.4,s1:s+3.4,holes:[],arch:.28,kind:'bridge'});}
 for(const c of RM_TEETH){const s=c.L*.52;c.covers.push({s0:s-3,s1:s+3,holes:[],arch:.22,kind:'bridge'});}
 for(const c of RM_CAVES){const s0=c.rA+1.5,s1=c.L-4.5;c.covers.push({s0,s1,kind:'roof',holes:[.26,.55,.82].map((u,k)=>({s:lerp(s0,s1,u),d:(k%2?.6:-.5),r:1.25}))});}}
const RM_COVERS=RM_CREV.flatMap(c=>c.covers.map(K=>({c,K})));

/* ---------- the contract for js/origin/03-play.js ---------- */
const OBST=[],BARS=[];
const RM_STEP=.85;
/* S3: what stands up off the ice (the station's walls, roofs and furniture, the seracs, the wrecks, the outposts' walls) in a 6 m grid,
   plus the slabs that stop shots (the station's roofs, the bridges and the caves' roofs). Same shape as js/mp/01-world.js; a slab here
   may tilt (y = y0 + gx·x + gz·z), for the station's roofs */
const S3={walls:[],surfs:[],floors:[],G:{},C:6,st:0};
function s3Put(o,x0,z0,x1,z1){o.st=0;const Cc=S3.C;for(let i=Math.floor(x0/Cc);i<=Math.floor(x1/Cc);i++)for(let j=Math.floor(z0/Cc);j<=Math.floor(z1/Cc);j++){const k=i+','+j;(S3.G[k]||(S3.G[k]={w:[],s:[],f:[]}))[o.k3].push(o);}}
function s3Wall(ax,az,bx,bz,y0,y1,th,walk,los){const L=Math.hypot(bx-ax,bz-az);if(L<.05||y1-y0<.02)return null;const ux=(bx-ax)/L,uz=(bz-az)/L;
  const Rr={k3:'w',x:(ax+bx)/2,z:(az+bz)/2,ux,uz,hw:L/2,hd:th/2,y0,y1,walk:walk!==false,los:los!==false};
  const ex=Math.abs(ux)*Rr.hw+Math.abs(uz)*Rr.hd+1,ez=Math.abs(uz)*Rr.hw+Math.abs(ux)*Rr.hd+1;S3.walls.push(Rr);s3Put(Rr,Rr.x-ex,Rr.z-ez,Rr.x+ex,Rr.z+ez);return Rr;}
function s3Surf(inside,h,box){const S={k3:'s',inside,h};S3.surfs.push(S);s3Put(S,box[0],box[1],box[2],box[3]);return S;}
function s3Floor(inside,y0,gx,gz,box){const F={k3:'f',inside,y0,gx:gx||0,gz:gz||0};S3.floors.push(F);s3Put(F,box[0],box[1],box[2],box[3]);return F;}
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
    for(const F of c.f){if(F.st===st)continue;F.st=st;const ya=F.y0+F.gx*a.x+F.gz*a.z,yb=F.y0+F.gx*b.x+F.gz*b.z;if((a.y-ya)*(b.y-yb)>=0)continue;
      const f=(ya-a.y)/((b.y-a.y)-(yb-ya));if(f>=0&&f<best&&F.inside(a.x+dx*f,a.z+dz*f))best=f;}}
  return best;}
function s3Top(x,z){const c=s3Cell(x,z);let t=-1e9;if(!c)return t;for(const S of c.s)if(S.inside(x,z))t=Math.max(t,S.h(x,z)+.2);for(const Rr of c.w)if(rectSD(Rr,x,z)<0)t=Math.max(t,Rr.y1);return t;}
// the floor: the station's tilted floor, the broken slab down into the Rift, a crevasse's floor, or the ice
function terrH(x,z){const q=x<0?-1:1,X=x*q,Z=z*q;if(rmInSt(X,Z))return rmStFloor(X);if(rmInGap(X,Z))return rmRampY(X);
  const I=rmCrev(x,z);if(I.bd<0)return I.floor;return rmSurf(x,z);}
// the top of the ground: a bridge or a cave's roof where there is one (the warthogs drive on this, the racks stand on it)
function groundY(x,z){const cv=rmCover(x,z);return cv!=null?cv:terrH(x,z);}
// shots and sight lines stop on the floor (the bridges and roofs stop them as S3 slabs, so you can fire along a cave)
function shotGroundY(x,z){return terrH(x,z);}
function meshY(x,z){return terrH(x,z);}
// the floor under someone standing at height y: the floor, a bridge or roof once they're up on it, the station's roofs
function floorY3(x,z,y){let best=terrH(x,z);const cv=rmCover(x,z);if(cv!=null&&cv<=y+RM_STEP&&cv>best)best=cv;
  const c=s3Cell(x,z);if(c)for(const S of c.s)if(S.inside(x,z)){const h=S.h(x,z);if(h<=y+RM_STEP&&h>best)best=h;}
  return best;}
/* distance outside the walkable area at height y (negative inside). On foot, down in a crevasse, its walls hold you in (you get out up
   its ramps, the station's slabs, or not at all); up on the ice you can walk off its edge and drop in. Without a height (spawns, racks,
   the bots' picks) and for a warthog, an open crevasse is somewhere you can't be, and a hog keeps out of the station */
function playD3(x,z,y){const q=x<0?-1:1,X=x*q,Z=z*q,tf=terrH(x,z),yb=Math.max(y==null?-1e9:y,tf);let d=edgeD(x,z)-GS.HALF;
  const drive=typeof moveBody!=='undefined'&&moveBody.drive,strict=y==null||drive,st=rmInSt(X,Z),gap=rmInGap(X,Z);
  if(!st&&!gap){const I=rmCrev(x,z),bd=I.bd,deep=I.deep;if(bd<4){
    if(strict){if(bd<0&&deep>1.1&&rmCover(x,z)==null)d=Math.max(d,-bd);}
    else if(yb<rmSurf(x,z)-.6)d=Math.max(d,bd);}}
  else if(drive)d=Math.max(d,.1);
  const c=s3Cell(x,z);if(c)for(const Rr of c.w){if(!Rr.walk||Rr.y0>yb+1.75||Rr.y1<yb+.35)continue;d=Math.max(d,-rectSD(Rr,x,z));}
  return d;}
function playD(x,z){return playD3(x,z,null);}
function camClamp(head){const c=camera.position,g=floorY3(c.x,c.z,c.y)+.3;if(c.y<g)c.y=g;}
const ROAD_LEN=1,SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0,BARRIERS=[],BLOCKS=[];
const _rp=new THREE.Vector3();
function roadS(x,z){return 0;}function roadPt(s,out){return(out||_rp).set(LZ.x,0,LZ.z);}function roadN(s){return{x:1,z:0};}
function latOf(x,z){return 0;}function laneC(s){return 0;}function laneHalf(s){return 400;}function spineAt(s){return false;}function barrier(id){return null;}
const BLEN=0;function belowD(){return 1;}function belowS(){return 0;}function belowPt(s,o){return(o||new THREE.Vector3());}function belowFloor(){return 0;}
const HOLLOW_GLOW=0xff6a5a,HOST_GLOW=0xa45cff;
function inDome(B,p){return Math.hypot(p.x-B.x,(p.y||0)-B.y,p.z-B.z)<B.shieldR;}
function losBlock(a,b){for(const B of GS.BASES)if(inDome(B,a)!==inDome(B,b))return true;return s3Frac(a,b)<1;}
GS.terrH=terrH;GS.playD=playD;GS.edgeD=edgeD;GS.inDome=(B,p)=>inDome(B,p);GS.s3Frac=s3Frac;GS.s3Top=s3Top;GS.floorY3=(x,z,y)=>floorY3(x,z,y);GS.TERR=[];
// a wall in the world and its twin turned half way round
function s3Wall2(ax,az,bx,bz,y0,y1,th,walk,los){s3Wall(ax,az,bx,bz,y0,y1,th,walk,los);s3Wall(-ax,-az,-bx,-bz,y0,y1,th,walk,los);}
// the bridges' and caves' slabs, cut every 6 m along so each sits level with the ice there
for(const {c,K} of RM_COVERS){for(let s=K.s0;s<K.s1;s+=6){const s1=Math.min(K.s1,s+6),pm=c.P[Math.min(c.P.length-1,Math.round((s+s1)/2))],y=rmSurf(pm.x,pm.z)-.45;
  const ins=(x,z)=>{const q=rmCrevQ(c,x,z);return q.s>=s&&q.s<=s1&&q.sd<.6&&!K.holes.some(H=>Math.hypot(q.s-H.s,q.d-H.d)<H.r);};
  const pts=c.P.slice(Math.max(0,Math.floor(s)),Math.min(c.P.length,Math.ceil(s1)+1));let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const p of pts){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);}
  const m=c.hw+2;s3Floor(ins,y,0,0,[x0-m,z0-m,x1+m,z1+m]);}}

/* ---------- materials: snow (wind-carved, glinting where the sun catches it), ice (glassy, blue in its depth), rock, the station ---------- */
const TEXL=new THREE.TextureLoader(),TSUF=coarse?'phone':'pc';
function ldTex(n,srgb){const t=TEXL.load('img/tex/'+n+'-'+TSUF+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=coarse?2:8;if(srgb)t.encoding=THREE.sRGBEncoding;return t;}
// tileable value noise, for the normal maps drawn here
function rmTn(u,v,P,sd){const x=u*P,y=v*P,xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,a=(i,j)=>hash(((i%P)+P)%P+sd*131,((j%P)+P)%P-sd*71),uu=xf*xf*(3-2*xf),vv=yf*yf*(3-2*yf);
  return lerp(lerp(a(xi,yi),a(xi+1,yi),uu),lerp(a(xi,yi+1),a(xi+1,yi+1),uu),vv);}
function rmNormalTex(N,f,amp){const cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d'),im=x.createImageData(N,N),H=new Float32Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++)H[j*N+i]=f(i/N,j/N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const hx=H[j*N+(i+1)%N]-H[j*N+(i-1+N)%N],hz=H[((j+1)%N)*N+i]-H[((j-1+N)%N)*N+i],nx=-hx*amp,nz=-hz*amp,l=Math.hypot(nx,1,nz),o=(j*N+i)*4;
    im.data[o]=(nx/l*.5+.5)*255;im.data[o+1]=(nz/l*.5+.5)*255;im.data[o+2]=(1/l*.5+.5)*255;im.data[o+3]=255;}
  x.putImageData(im,0,0);const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=coarse?2:8;return t;}
const RM_N=coarse?128:256;
// sastrugi: ridges the wind carves, long one way and short the other
const snowN=rmNormalTex(RM_N,(u,v)=>rmTn(u,v,2,1)*.55+rmTn(u,v,6,2)*.25+Math.abs(rmTn(u,v,14,3)-.5)*.22+rmTn(u,v,48,4)*.06,4);
const iceN=rmNormalTex(RM_N,(u,v)=>rmTn(u,v,4,5)*.6+rmTn(u,v,16,6)*.25+Math.abs(rmTn(u,v,40,7)-.5)*.3,4);
// the sky, blurred for what the ice and the station's panels reflect
const ENV=(()=>{const N=64,faces=[],dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const col=(x,y,z)=>{const l=Math.hypot(x,y,z);x/=l;y/=l;z/=l;let r,g,b;const t1=sstep(0,.3,y),t2=sstep(.3,.95,y);
    r=lerp(lerp(.92,.55,t1),.2,t2);g=lerp(lerp(.95,.72,t1),.38,t2);b=lerp(lerp(1,.92,t1),.72,t2);const gr=1-sstep(-.05,.02,y);r=lerp(r,.84,gr);g=lerp(g,.88,gr);b=lerp(b,.92,gr);
    const s0=Math.max(0,x*sunDir.x+y*sunDir.y+z*sunDir.z);r+=Math.pow(s0,6)*.9+Math.pow(s0,90)*3;g+=Math.pow(s0,6)*.7+Math.pow(s0,90)*2.6;b+=Math.pow(s0,6)*.45+Math.pow(s0,90)*2;
    return[r,g,b].map(v=>Math.round(255*Math.pow(clamp(v,0,1),1/2.2)));};
  for(let f=0;f<6;f++){const cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d'),im=x.createImageData(N,N);
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=(i+.5)/N*2-1,v=(j+.5)/N*2-1;let d;
      switch(f){case 0:d=[1,-v,-u];break;case 1:d=[-1,-v,u];break;case 2:d=[u,1,v];break;case 3:d=[u,-1,-v];break;case 4:d=[u,-v,1];break;default:d=[-u,-v,-1];}
      const c=col(d[0],d[1],d[2]),o=(j*N+i)*4;im.data[o]=c[0];im.data[o+1]=c[1];im.data[o+2]=c[2];im.data[o+3]=255;}
    x.putImageData(im,0,0);faces.push(cv);}
  const t=new THREE.CubeTexture(faces);t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;return t;})();
// the glints: now and then a crystal in the snow catches the light as you move
function rmGlint(mat,k){mat.onBeforeCompile=sh=>{
  sh.vertexShader='varying vec3 vWPg;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvWPg=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader='varying vec3 vWPg;\nfloat rmGh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\n'+sh.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
    'float gr=rmGh(floor(vWPg*34.0));float gs=step(.9958,fract(gr*7.13+dot(floor(cameraPosition*1.6),vec3(.0131,.0071,.0113))));float gd=length(cameraPosition-vWPg);'+
    'outgoingLight+=vec3(1.0,.96,.88)*gs*'+k.toFixed(2)+'*smoothstep(42.0,3.0,gd)*clamp(dot(outgoingLight,vec3(.33)),0.0,1.0);\ngl_FragColor = vec4( outgoingLight, diffuseColor.a );');};
  mat.customProgramCacheKey=()=>'rmglint'+k;}
const snowMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0,normalMap:snowN,normalScale:new THREE.Vector2(.32,.32),envMap:ENV,envMapIntensity:.35});rmGlint(snowMat,2.4);
const lipMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:0,normalMap:snowN,normalScale:new THREE.Vector2(.3,.3),envMap:ENV,envMapIntensity:.35,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});rmGlint(lipMat,2.4);
// ice: a little of its own colour given back as light, so the walls of a crevasse glow blue where the sun can't reach
function rmIce(o){const m=new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.12,metalness:.04,envMap:ENV,envMapIntensity:1.2,normalMap:iceN,normalScale:new THREE.Vector2(.35,.35),side:THREE.DoubleSide,emissive:C(0xffffff),emissiveIntensity:.22},o||{}));
  const k=m.emissiveIntensity;m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance=vColor*emissive*vec3(.55,.85,1.15);\n#endif');};
  m.customProgramCacheKey=()=>'rmice';return m;}
const iceMat=rmIce(),iceGlowMat=rmIce({emissiveIntensity:.62,roughness:.24,normalScale:new THREE.Vector2(.9,.9)}),seracMat=rmIce({emissiveIntensity:.16,roughness:.22,envMapIntensity:.8,normalScale:new THREE.Vector2(.8,.8)});
const rockMat=new THREE.MeshStandardMaterial({vertexColors:true,color:C(0xb8c2d0),map:ldTex('rock',true),normalMap:ldTex('rock-n'),normalScale:new THREE.Vector2(.9,.9),roughness:.9,metalness:.02});
const panelMat=new THREE.MeshStandardMaterial({vertexColors:true,map:panelTex,roughness:.48,metalness:.18,envMap:ENV,envMapIntensity:.55});
const darkMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.45,envMap:ENV,envMapIntensity:.5});
const stoneMat=new THREE.MeshStandardMaterial({color:C(0xe8edf2),roughness:.5,metalness:.15,envMap:ENV,envMapIntensity:.5});   // (the outposts' beacon pylons: js/mp/03-match.js)
const winMat=new THREE.MeshStandardMaterial({color:C(0x1a1410),emissive:C(0xffc27a),emissiveIntensity:.9,roughness:.08,metalness:.3,envMap:ENV,envMapIntensity:1.2});
const lampMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
// geometry made here: positions, colours and (world-scale) UVs, indexed; normals worked out at the end
class RmGB{constructor(){this.p=[];this.c=[];this.u=[];this.i=[];}
  v(x,y,z,col,u,w){this.p.push(x,y,z);this.c.push(col.r,col.g,col.b);this.u.push(u==null?x/6:u,w==null?z/6:w);return this.p.length/3-1;}
  q(a,b,c,d){this.i.push(a,b,c,b,d,c);}
  build(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));g.setIndex(this.i);g.computeVertexNormals();g.computeBoundingSphere();return g;}}
function rmMesh(g,mat,shadow,recv){const m=new THREE.Mesh(g,mat);m.castShadow=!!shadow;m.receiveShadow=recv!==false;m.userData.dyn=1;scene.add(m);return m;}
const tmpC=new THREE.Color(),tmpC2=new THREE.Color();
class RmMerger extends Merger{add(g,m,col){if(col)return super.add(g,m,col);const ng=g.index?g.toNonIndexed():g.clone();ng.applyMatrix4(m);
  const P=ng.attributes.position.array,Nn=ng.attributes.normal.array,U=ng.attributes.uv?ng.attributes.uv.array:null,Cc=ng.attributes.color.array;
  for(let i=0;i<P.length;i++){this.p.push(P[i]);this.n.push(Nn[i]);this.c.push(Cc[i]);}if(U)for(let i=0;i<U.length;i++)this.u.push(U[i]);else for(let i=0;i<P.length/3;i++)this.u.push(P[i*3]/4,P[i*3+1]/4);}}
const K_SNOW=C(0xe0e9f1),K_SNOW2=C(0xd2deea),K_BLUE=C(0xa6c6e2),K_ICE_T=C(0xcfe9f6),K_ICE_M=C(0x5fb1dc),K_ICE_D=C(0x0e4a7c),K_ICE_X=C(0x062644),K_ROCK=C(0x4c525c),K_ROCK2=C(0x32363e);

/* ---------- the sky: polar evening. Pale gold low in the south-west where the sun is, cold cyan round the rest of the horizon, deep
   blue overhead with Elyra's alien sky showing faintly through the thin air; ice crystals in the air make a halo round the sun and two
   sun dogs beside it. Astraea hangs pale in the north-east. It rides with the camera ---------- */
const skyGroup=new THREE.Group();skyGroup.userData.dyn=1;scene.add(skyGroup);
const skyU={sunDir:{value:sunDir},hor:{value:C(0xe9f0f4)},mid:{value:C(0x9cc4e2)},zen:{value:C(0x2c5a9c)},uT:{value:0},hazeC:{value:scene.fog.color},photo:{value:null},pk:{value:0},veil:{value:0}};
{const sky=new THREE.Mesh(new THREE.SphereGeometry(14000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,mid,zen,hazeC;uniform float uT,pk,veil;uniform sampler2D photo;
  float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.0,a=.5;for(int i=0;i<5;i++){s+=ns(p)*a;p=p*2.03+vec2(17.0,-9.0);a*=.5;}return s;}
  void main(){vec3 d=normalize(vDir);float y=d.y;
    float sh=clamp(.5+.5*dot(normalize(vec3(d.x,0.0,d.z)),normalize(vec3(sunDir.x,0.0,sunDir.z))),0.0,1.0);
    vec3 h2=mix(hor,vec3(1.0,.86,.62),pow(sh,3.0)*.75);
    vec3 c=mix(h2,mid,smoothstep(0.0,.2,y));c=mix(c,zen,smoothstep(.16,.8,y));
    // Elyra's sky through the thin air, high up
    if(pk>0.0){vec2 pu=vec2(atan(d.z,d.x)/6.2831853+.5,asin(clamp(y,-1.0,1.0))/3.1415927+.5);vec3 p=pow(texture2D(photo,pu).rgb,vec3(2.2));c+=p*pk*.55*smoothstep(.25,.9,y);}
    float s=max(dot(d,sunDir),0.0),a=acos(clamp(dot(d,sunDir),-1.0,1.0));
    c+=vec3(1.0,.74,.45)*pow(s,6.0)*.42+vec3(1.0,.86,.6)*pow(s,60.0)*.7;
    // the 22-degree halo, red on its inside edge, and the sun dogs either side at the sun's own height
    float hl=exp(-pow((a-.384)/.016,2.0));c+=mix(vec3(1.0,.55,.35),vec3(.9,.95,1.0),smoothstep(.37,.40,a))*hl*.16;
    vec3 sR=normalize(cross(sunDir,vec3(0,1,0)));for(int k=0;k<2;k++){vec3 dg=normalize(sunDir*cos(.4)+sR*sin(.4)*(k==0?1.0:-1.0));float g=max(dot(d,dg),0.0);c+=vec3(1.0,.9,.75)*pow(g,1800.0)*1.4+vec3(1.0,.7,.5)*pow(g,300.0)*.18;}
    // high thin cirrus, combed by the wind
    vec2 cp=d.xz/(y+.08);float ci=smoothstep(.5,.85,fbm(cp*vec2(.7,2.8)+vec2(uT*.006,0.0)))*smoothstep(.04,.3,y)*(1.0-smoothstep(.6,.95,y));
    c=mix(c,mix(vec3(1.0,.97,.93),vec3(1.0,.86,.7),pow(sh,4.0)),ci*.32);
    c+=vec3(1.0,.95,.85)*smoothstep(.99962,.99985,s)*5.0;   // the sun's disc
    // blowing snow low along the horizon all round, and below it the haze
    float bl=fbm(vec2(atan(d.z,d.x)*14.0+uT*.05,y*40.0))*(1.0-smoothstep(.0,.07,y));c=mix(c,hazeC,bl*.5);
    c=mix(c,hazeC,1.0-smoothstep(-.02,.05,y));
    c=mix(c,hazeC*1.02,veil);
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
 sky.renderOrder=-3;sky.frustumCulled=false;skyGroup.add(sky);
 SKIES.load('elyra',t=>{skyU.photo.value=t;skyU.pk.value=.32;});
 // Astraea: big and pale, a thin crescent lit from the sun's side
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.ShaderMaterial({uniforms:{sd:{value:sunDir}},fog:false,depthWrite:false,transparent:true,
  vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(mat3(modelMatrix)*normal);vP=position;gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vN;varying vec3 vP;uniform vec3 sd;float hs(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float ns(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}
    void main(){vec3 p=normalize(vP);float n=ns(p*3.0)*.5+ns(p*8.0)*.3+ns(p*20.0)*.2;float band=sin(p.y*14.0+n*3.0)*.5+.5;float l=smoothstep(-.1,.4,dot(normalize(vN),sd));
      vec3 c=mix(vec3(.82,.72,.6),vec3(.98,.9,.78),n)*mix(.85,1.08,band);gl_FragColor=vec4(c,.12+.62*l);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`}));
 m.position.set(.55,.3,-.78).normalize().multiplyScalar(12000);m.scale.setScalar(1150);m.renderOrder=-2;skyGroup.add(m);}
function skyFollow(){skyGroup.position.copy(camera.position);}

/* ---------- light: the low sun (warm, long shadows), the sky's cold fill, the snow throwing light back up ---------- */
const hemi=new THREE.HemisphereLight(C(0x8cb4e4),C(0xd4dee8),.78);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(C(0xffdcae),2.5);scene.add(keyLight,keyLight.target);
keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(keyLight.shadow.camera,{left:-75,right:75,top:75,bottom:-75,near:10,far:1600});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.12;
{const rim=new THREE.DirectionalLight(C(0x9cc4ff),.22);rim.position.set(-sunDir.x,.5,-sunDir.z).multiplyScalar(500);scene.add(rim);}
function followSun(p){keyLight.position.copy(p).addScaledVector(sunDir,700);keyLight.target.position.copy(p);}
let lookName='day';function setLook(){}
const helmLamp=new THREE.PointLight(C(0xffffff),0,10,1.5);scene.add(helmLamp);

/* ---------- past the edge: the ranges round the glacier (shared js/shared/vista.js, coloured for ice), the frozen sea to the south
   with bergs locked in it, and the glacier's own front, an ice cliff down to the sea ---------- */
const FAR=VISTA.build({seed:83,center:{x:0,z:0},seaY:RM_SEA,sun:sunDir,haze:HAZE_HEX,rock:0x5c6372,rock2:0x464d5c,green:0xe4ecf3,sand:0xb7d3e2,snow:0xf8fbfd,dry:.3,
  massifs:[{a:.3,r:3300,rad:1500,h:1650},{a:5.75,r:3900,rad:1300,h:1250},{a:1.7,r:4300,rad:1600,h:1150},{a:4.55,r:4600,rad:1400,h:1350}],
  islands:{n:coarse?7:12,r0:2200,r1:7200,h0:30,h1:150},
  coasts:[{a0:-1.35,a1:1.35,r:6800,depth:3600,h:1800},{a0:1.55,a1:2.25,r:7400,depth:3000,h:900},{a0:4.05,a1:4.75,r:7200,depth:3000,h:1000}],
  skyline:{r:13600,h:220}});
scene.add(FAR.G);
{// the sea: plates of pack ice, dark leads between them, hazing out to the horizon
 const g=new THREE.CircleGeometry(12000,64).rotateX(-Math.PI/2);
 const m=new THREE.Mesh(g,new THREE.ShaderMaterial({fog:false,uniforms:{haze:{value:C(HAZE_HEX)},veil:skyU.veil},
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`varying vec3 vW;uniform vec3 haze;uniform float veil;
    vec2 h2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
    float hs(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
    void main(){vec2 p=vW.xz/38.0;vec2 i=floor(p),f=fract(p);float d1=9.0,d2=9.0;vec2 id=vec2(0);
      for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y)),r=o+h2(i+o)-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;id=i+o;}else if(d<d2)d2=d;}
      float lead=smoothstep(.0,.06,sqrt(d2)-sqrt(d1));float k=hs(id);
      vec3 c=mix(vec3(.05,.13,.2),mix(vec3(.82,.88,.93),vec3(.95,.97,.99),k),lead);if(k<.12)c=mix(c,vec3(.12,.24,.32),.6*lead);
      float dist=length(vW.xz-cameraPosition.xz);c=mix(c,haze,clamp(pow(dist/9000.0,.6),0.0,.95));c=mix(c,haze,veil);
      gl_FragColor=vec4(c,1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`}));
 m.position.y=RM_SEA;m.renderOrder=-1;m.userData.dyn=1;m.frustumCulled=false;scene.add(m);
 // bergs: tabular blocks frozen into the sea to the south, light and haze baked in (no lights, one draw)
 const bg=new RmGB(),hz=C(HAZE_HEX);
 for(let k=0;k<(coarse?26:44);k++){const a=Math.PI+R(-1.25,1.25),d=R(320,5200),cx=Math.sin(a)*d,cz=-Math.cos(a)*d,w=R(30,140)*(d/2000+.4),h=R(8,30)*(d/2500+.5),n=7,ry=R(0,6.3);
   const fade=clamp(Math.pow(d/7000,.7),0,.9),top=tmpC.copy(K_SNOW).lerp(hz,fade).clone(),side=tmpC.copy(K_ICE_M).lerp(K_BLUE,.5).lerp(hz,fade).clone(),dark=tmpC.copy(K_ICE_D).lerp(hz,fade*1.05).clone();
   const ring=[];for(let i=0;i<n;i++){const aa=i/n*6.283+ry,rr=w*(.7+.3*hash(k,i));ring.push([cx+Math.cos(aa)*rr,cz+Math.sin(aa)*rr*(.5+.5*hash(i,k))]);}
   const b0=bg.p.length/3;for(const [x,z] of ring)bg.v(x,RM_SEA-2,z,dark);for(const [x,z] of ring)bg.v(x,RM_SEA+h,z,side);const c0=bg.v(cx,RM_SEA+h+R(0,4),cz,top);for(const [x,z] of ring)bg.v(x,RM_SEA+h+.01,z,top);
   for(let i=0;i<n;i++){const j=(i+1)%n;bg.q(b0+i,b0+j,b0+n+i,b0+n+j);bg.i.push(c0,c0+1+j,c0+1+i);}}
 const bm=new THREE.Mesh(bg.build(),new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));bm.userData.dyn=1;bm.frustumCulled=false;scene.add(bm);}

/* ---------- the ground mesh: the glacier, out past the edge (rock ridges north, icefalls east and west, the ice cliff south). Snow,
   blue where the wind has scoured it to ice, rock where it's too steep for snow. Cut away over the crevasses and the station, whose own
   meshes fill those places ---------- */
function rmVisH(x,z){const cx=clamp(x,-GS.HALF,GS.HALF),cz=clamp(z,-GS.HALF,GS.HALF);let h=rmSurf(cx,cz);if(cx===x&&cz===z)return h;
  const un=Math.max(0,-z-GS.HALF),us=Math.max(0,z-GS.HALF),ux=Math.max(0,Math.abs(x)-GS.HALF);
  h+=un*.25+46*sstep(0,55,un)*(.45+.75*ridged(x*.021+3,z*.021-1));
  h+=ux*.2+28*sstep(0,62,ux)*(.55+.6*fbm(x*.03,z*.03))+3*Math.sin(z*.4+x*.1)*sstep(0,20,ux);
  if(us>0)h=h-62*sstep(9,22,us)*(.88+.24*vnoise(x*.05,3.3))+1.2*sstep(0,6,us)*(1-sstep(8,10,us));
  return Math.max(RM_SEA-4,h);}
const RM_CUT=(x,z)=>{const q=x<0?-1:1,X=x*q,Z=z*q;if(X>=RM_ST.x0-1.1&&X<=RM_ST.x1+1.1&&Math.abs(Z)<=RM_ST.hz+1.1)return true;if(X>=1&&X<RM_ST.x0&&Math.abs(Z)<=6.2)return true;
  const I=rmCrev(x,z);return I.bd<1.05&&I.ndep>.05;};
{const S=GS.HALF*2+120,N=coarse?210:330,g=new RmGB(),stp=S/N,H=new Float32Array((N+1)*(N+1)),cut=new Uint8Array((N+1)*(N+1));
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-S/2+i*stp,z=-S/2+j*stp,k=j*(N+1)+i;H[k]=rmVisH(x,z);cut[k]=Math.abs(x)<GS.HALF+2&&Math.abs(z)<GS.HALF+2&&RM_CUT(x,z)?1:0;}
  const c=new THREE.Color();
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-S/2+i*stp,z=-S/2+j*stp,k=j*(N+1)+i,h=H[k];
    const hx=H[j*(N+1)+Math.min(N,i+1)]-H[j*(N+1)+Math.max(0,i-1)],hz=H[Math.min(N,j+1)*(N+1)+i]-H[Math.max(0,j-1)*(N+1)+i],sl=Math.hypot(hx,hz)/(2*stp);
    const n=fbm(x*.045,z*.045),n2=vnoise(x*.2,z*.2);
    c.copy(K_SNOW).lerp(K_SNOW2,sstep(.35,.75,n)*.8).lerp(K_BLUE,sstep(.62,.78,fbm(x*.022+9,z*.022-4))*.55);
    // scoured blue ice in the hollows and on the open glacier, a little darker by the bases' rock
    if(h<rmSym(x,z)-.2)c.lerp(K_BLUE,.3);
    // rock on the steep: the ridges past the north edge, the outcrops' flanks; the ice cliff to the south
    const rk=sstep(.9,1.6,sl);if(rk>0){if(z>GS.HALF+4)c.lerp(tmpC.copy(K_ICE_M).lerp(K_BLUE,.4),rk);else c.lerp(tmpC.copy(K_ROCK).lerp(K_ROCK2,n2),rk*.92);}
    for(const B of GS.BASES){const d=Math.hypot(x-B.x,z-B.z);if(d<22&&d>12.5)c.lerp(tmpC.copy(K_ROCK).lerp(K_SNOW2,.35+.4*n2),sstep(12.5,15,d)*(1-sstep(17,21.5,d))*.75);}
    c.multiplyScalar(.94+.08*n2);
    g.v(x,h,z,c,x/13,z/13);}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,cc=a+N+1,d=cc+1;if(cut[a]||cut[b]||cut[cc]||cut[d])continue;g.q(a,cc,b,d);}
  const m=rmMesh(g.build(),snowMat,false,true);}

/* ---------- the crevasses: walls of banded blue ice, snow on their floors, a cornice of snow along every lip, the bridges and the
   caves' roofs, icicles under them, and light coming down through the holes ---------- */
{const W=new RmGB(),F=new RmGB(),Lp=new RmGB(),CT=new RmGB(),CU=new RmGB(),_q={};
 const other=(c,x,z)=>{const I=rmCrev(x,z);return I.bd<-.05&&I.c&&I.c!==c;};
 const stOrGap=(x,z)=>{const q=x<0?-1:1,X=x*q,Z=z*q;return(X>=1.5&&X<=RM_ST.x1+.5&&Math.abs(Z)<=RM_ST.hz+.4);};
 const covered=(c,s)=>c.covers.some(K=>s>=K.s0-.2&&s<=K.s1+.2);
 for(const c of RM_CREV){const P=c.P,R8=coarse?6:9;
   // the walls, both sides: rows from the lip down to the floor, pushed in and out a little, the ice banded by its years
   for(const sg of[-1,1]){let prev=null;
     for(let i=0;i<P.length;i++){const p=P[i],nx=-p.tz*sg,nz=p.tx*sg,hw=rmHw(c,p.s),tp=rmTap(c,p.s);
       const ox=p.x+nx*(hw+.9),oz=p.z+nz*(hw+.9);
       if(tp<.03||other(c,ox,oz)||stOrGap(p.x+nx*hw,p.z+nz*hw)){prev=null;continue;}
       const top=rmSurf(p.x+nx*hw,p.z+nz*hw),flo=rmSurf(p.x,p.z)-c.dep*tp,col=[];
       for(let j=0;j<=R8;j++){const v=j/R8,y=lerp(top+.03,flo-.3,v),jag=.24*(vnoise(p.s*.5+c.id*17+(sg>0?50:0),v*2.6)-.5)*2+.1*(vnoise(p.s*1.9+3,v*7)-.5)*2,
         off=hw+(j===0?-.28:jag+.22*Math.sin(Math.PI*v)),x=p.x+nx*off,z=p.z+nz*off,
         band=.88+.12*Math.sin(y*5.3+vnoise(p.s*.3,y)*4);
         tmpC.copy(K_ICE_T).lerp(K_ICE_M,sstep(0,.35,v)).lerp(K_ICE_D,sstep(.3,.85,v)).lerp(K_ICE_X,sstep(.85,1,v)*.6).multiplyScalar(band);if(j===0)tmpC.copy(K_SNOW);
         col.push(W.v(x,y,z,tmpC,p.s/4,y/4));}
       if(prev)for(let j=0;j<R8;j++)W.q(prev[j],col[j],prev[j+1],col[j+1]);prev=col;}}
   // the floor: snow, bluer the deeper it lies
   {let prev=null;const K=4;
    for(let i=0;i<P.length;i++){const p=P[i],tp=rmTap(c,p.s),hw=rmHw(c,p.s)+.45;if(tp<.02||stOrGap(p.x,p.z)||(c.name!=='rift'&&other(c,p.x,p.z))){prev=null;continue;}
      const row=[];for(let k=-K;k<=K;k++){const u=k/K,x=p.x-p.tz*u*hw,z=p.z+p.tx*u*hw,f=rmSurf(x,z)-c.dep*tp+.16*(vnoise(x*.45+c.id*9,z*.45)-.5)+.05*Math.abs(u)**3;
        tmpC.copy(K_SNOW2).lerp(K_BLUE,sstep(1,5,c.dep*tp)*.7).multiplyScalar(lerp(1,.72,sstep(1,5,c.dep*tp)));row.push(F.v(x,f,z,tmpC,x/13,z/13));}
      if(prev)for(let k=0;k<2*K;k++)F.q(prev[k],prev[k+1],row[k],row[k+1]);prev=row;}}
   // the lips: a band of snow over the cut edge of the ground, a rim of cornice at the edge
   for(const sg of[-1,1]){let prev=null;
     for(let i=0;i<P.length;i++){const p=P[i],nx=-p.tz*sg,nz=p.tx*sg,hw=rmHw(c,p.s);
       if(covered(c,p.s)||other(c,p.x+nx*(hw+.9),p.z+nz*(hw+.9))||stOrGap(p.x+nx*hw,p.z+nz*hw)||rmTap(c,p.s)<.02){prev=null;continue;}
       const row=[];for(const [o,dy,w] of[[-.3,.1,0],[0,.13,.1],[.6,.07,.3],[1.4,.05,.6],[2.8,.05,1]]){const x=p.x+nx*(hw+o),z=p.z+nz*(hw+o);tmpC.copy(K_SNOW).lerp(K_ICE_T,(1-w)*.25);row.push(Lp.v(x,rmSurf(x,z)+dy,z,tmpC,x/13,z/13));}
       if(prev)for(let k=0;k<4;k++)Lp.q(prev[k],row[k],prev[k+1],row[k+1]);prev=row;}}
   // the covers: a snow top flush with the ice, an ice underside (thin in the middle, light coming through it), holes
   for(const K of c.covers){const n=Math.ceil((K.s1-K.s0)/1),M=coarse?8:12,w=c.hw+2.8,TI={},UI={};
     const hole=(s,d)=>K.holes.some(H=>Math.hypot(s-H.s,d-H.d)<H.r+(vnoise(s*2,d*2)-.5)*.35);
     for(let a=0;a<=n;a++){const s=lerp(K.s0,K.s1,a/n),i0=clamp(Math.floor(s),0,P.length-2),p=P[i0];
       for(let b=0;b<=M;b++){const u=b/M*2-1,d=u*w,x=p.x-p.tz*d,z=p.z+p.tx*d,top=rmSurf(x,z)+.06+(K.arch||0)*Math.cos(clamp(d/(c.hw+1),-1,1)*Math.PI/2),
         th=.45+1.1*Math.pow(Math.min(1,Math.abs(d)/(c.hw+1.3)),1.6)+.25*vnoise(s*.7,u*3)+sstep(c.hw+1,c.hw+2.8,Math.abs(d))*1.2,bot=top-th;
         if(hole(s,d)){TI[a+','+b]=-1;UI[a+','+b]=-1;continue;}
         tmpC.copy(K_SNOW).lerp(K_SNOW2,vnoise(x*.3,z*.3)*.5);TI[a+','+b]=CT.v(x,top,z,tmpC,x/13,z/13);
         {const nn=vnoise(s*.35+c.id*7,d*.6),hn=K.holes.reduce((m,H)=>Math.min(m,Math.hypot(s-H.s,d-H.d)),99);tmpC.copy(K_ICE_M).lerp(K_ICE_D,.15+.45*nn*(1-Math.abs(u)*.4)).lerp(K_ICE_T,sstep(4,1.3,hn)*.8);if(K.kind!=='roof')tmpC.lerp(K_ICE_T,.35);}UI[a+','+b]=CU.v(x,bot,z,tmpC,s/3,d/3);}}
     for(let a=0;a<n;a++)for(let b=0;b<M;b++){const t=[TI[a+','+b],TI[(a+1)+','+b],TI[a+','+(b+1)],TI[(a+1)+','+(b+1)]],u=[UI[a+','+b],UI[(a+1)+','+b],UI[a+','+(b+1)],UI[(a+1)+','+(b+1)]];
       if(t.every(v=>v>=0)){CT.q(t[0],t[2],t[1],t[3]);CU.q(u[0],u[1],u[2],u[3]);}}
     // the ends (where you look up from inside at the edge of the bridge or the cave's mouth)
     for(const a of[0,n]){for(let b=0;b<M;b++){const t0=TI[a+','+b],t1=TI[a+','+(b+1)],u0=UI[a+','+b],u1=UI[a+','+(b+1)];if(t0<0||t1<0)continue;
       const P2=CT.p,mk=(i,col)=>CU.v(P2[i*3],P2[i*3+1],P2[i*3+2],col,P2[i*3]/3,P2[i*3+1]/3),A=mk(t0,K_SNOW),B=mk(t1,K_SNOW);
       const CU2=CU.p,mk2=(i)=>CU.v(CU2[i*3],CU2[i*3+1],CU2[i*3+2],K_ICE_M,CU2[i*3]/3,CU2[i*3+1]/3),A2=mk2(u0),B2=mk2(u1);CU.q(A,B,A2,B2);}}}}
 rmMesh(W.build(),iceMat,true,true);rmMesh(F.build(),snowMat,false,true);rmMesh(Lp.build(),lipMat,false,true);rmMesh(CT.build(),lipMat,true,true);rmMesh(CU.build(),iceGlowMat,false,true);}
// icicles under the covers and along the lips (instanced cones), and the light coming down through the caves' holes
{const pts=[];
 for(const {c,K} of RM_COVERS){for(let s=K.s0+.6;s<K.s1-.4;s+=K.kind==='roof'?.9:.6){const p=c.P[clamp(Math.round(s),0,c.P.length-1)];
   for(let k=0;k<(K.kind==='roof'?2:3);k++){const d=R(-c.hw-.6,c.hw+.6),x=p.x-p.tz*d,z=p.z+p.tx*d,th=.45+1.1*Math.pow(Math.abs(d/(c.hw+1.3)),1.6);if(K.holes.some(H=>Math.hypot(s-H.s,d-H.d)<H.r+.4))continue;
     pts.push([x,rmSurf(x,z)+.06-th+.05,z,R(.25,1.1)*(K.kind==='roof'?1.3:1),R(.05,.12)]);}}}
 for(const c of RM_CREV)for(let i=2;i<c.P.length-2;i+=2)for(const sg of[-1,1]){if(rng()<.55)continue;const p=c.P[i],hw=rmHw(c,p.s)-.25,x=p.x-p.tz*hw*sg,z=p.z+p.tx*hw*sg;if(rmTap(c,p.s)<.4||c.covers.some(K=>p.s>K.s0&&p.s<K.s1))continue;
   const q=x<0?-1:1;if(rmInSt(x*q+.5,z*q)||rmInGap(x*q,z*q))continue;pts.push([x,rmSurf(x,z)-.05,z,R(.3,.9),R(.04,.09)]);}
 const cone=new THREE.ConeGeometry(1,1,5,1).rotateX(Math.PI).translate(0,-.5,0);cone.setAttribute('color',new THREE.Float32BufferAttribute(new Array(cone.attributes.position.count*3).fill(1),3));
 const m=new THREE.InstancedMesh(cone,iceMat,pts.length),d=new THREE.Object3D();pts.forEach((p,i)=>{d.position.set(p[0],p[1],p[2]);d.scale.set(p[4],p[3],p[4]);d.rotation.set(R(-.08,.08),R(0,6),R(-.08,.08));d.updateMatrix();m.setMatrixAt(i,d.matrix);});
 m.instanceMatrix.needsUpdate=true;m.userData.dyn=1;m.frustumCulled=false;scene.add(m);
 // shafts of light down through the caves' holes (soft additive cones), and a cold blue light in each cave
 const shaftMat=new THREE.MeshBasicMaterial({color:C(0xd8f0ff),transparent:true,opacity:.11,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:true});
 for(const c of RM_CAVES){const K=c.covers[0];for(const H of K.holes){const p=c.P[clamp(Math.round(H.s),0,c.P.length-1)],x=p.x-p.tz*H.d,z=p.z+p.tx*H.d,top=rmSurf(x,z),flo=terrH(x,z),h=top-flo;
   const sm=new THREE.Mesh(new THREE.CylinderGeometry(H.r*.8,H.r*1.6,h,14,1,true),shaftMat);sm.position.set(x+sunDir.x*.6,flo+h/2,z+sunDir.z*.6);sm.userData.dyn=1;scene.add(sm);}
   const n=coarse?1:2;for(let k=0;k<n;k++){const p=c.P[Math.round(lerp(K.s0+6,K.s1-6,(k+.5)/n))],L=new THREE.PointLight(C(0x6ec4ff),1.3,20,1.6);L.position.set(p.x,terrH(p.x,p.z)+2.6,p.z);scene.add(L);}}}

/* ---------- the station: built once in its own frame (floor at 0, length along x, the outer door at +6, the break at -6), sheared so
   its floor tilts down toward the break while its walls stay upright, and stood twice, the west half turned half way round ---------- */
{const k=RM_ST.k,MX=13,Y0=rmStFloor(MX);
 const SH=new THREE.Matrix4().set(1,0,0,MX, k,1,0,Y0, 0,0,1,0, 0,0,0,1);
 const PN=new Merger(),DK=new Merger(),WN=new Merger(),LM=new Merger(),SN=new Merger();
 const WHITE=C(0xe9edf0),WHITE2=C(0xd4dade),ORANGE=C(0xe8732a),STEEL=C(0x5a6068),DARKS=C(0x2a2e34),GRATE=C(0x3c4248),SNOWC=C(0xf2f6fa),LAMP=C(0xfff1d6).multiplyScalar(2.4),RED=C(0xff3a2a).multiplyScalar(3),CYAN=C(0x8ff4ff).multiplyScalar(2.2);
 const H=RM_ST.roofH,bx=(w,h,d)=>boxUV(w,h,d,1.2);
 // the floor slab, the roof slab (snow on it), the parapet, and the ceiling's light panels
 DK.add(bx(12.2,.35,12.2),M(0,-.17,0),GRATE);
 PN.add(bx(11.2,.36,12.6),M(.6,H+.18,0),WHITE2);PN.add(bx(11.4,.5,.2),M(.6,H+.55,6.2),WHITE);PN.add(bx(2.2,.5,.2),M(-3.9,H+.55,-6.2),WHITE);PN.add(bx(.6,.5,.2),M(5.8,H+.55,-6.2),WHITE);PN.add(bx(.2,.5,12.6),M(6.1,H+.55,0),WHITE);
 SN.add(bx(10.4,.12,11.4),M(.9,H+.42,0),SNOWC);
 // the torn end of the roof: plates bent down over the break
 for(let i=0;i<5;i++){const z=-5+i*2.5+R(-.4,.4);PN.add(bx(R(1.2,2.2),.12,R(1.6,2.4)),M(-5.4-R(0,.6),H-R(0,.5),z,R(-.2,.2),R(-.2,.2),R(-.5,-.15)),WHITE2);}
 for(let i=0;i<3;i++)for(let j=0;j<2;j++)LM.add(bx(1.6,.06,.5),M(-2.5+i*3.2,H-.05,-2.5+j*5),LAMP);
 // the walls: window bays along both sides (2 m each), a door in the south side's second bay; the outer end with its door; the
 // north side's windows look into the drift banked against it
 const bay=(x0,z,door,north)=>{const xc=x0+1,s=Math.sign(z);
   if(!door)PN.add(bx(1.75,1.0,.24),M(xc,.5,z),WHITE);
   PN.add(bx(1.75,H-2.3,.24),M(xc,2.3+(H-2.3)/2,z),WHITE);PN.add(bx(1.75,.22,.26),M(xc,3.55,z),ORANGE);
   if(!door){WN.add(new THREE.PlaneGeometry(1.7,1.3),M(xc,1.65,z+s*.01,0,s>0?0:Math.PI,0),north?C(0x9aa8b6):WHITE);}
   else{DK.add(bx(1.9,.18,.3),M(xc,2.3,z),STEEL);for(const dx of[-.9,.9])DK.add(bx(.12,2.3,.3),M(xc+dx,1.15,z),STEEL);LM.add(bx(1.2,.06,.06),M(xc,2.45,z+s*.18),C(0xffa040).multiplyScalar(2.5));}
   DK.add(bx(.26,H,.3),M(x0,H/2,z),STEEL);};
 for(let b=0;b<6;b++){const x0=-6+b*2;bay(x0,-6,false,true);bay(x0,6,b===1,false);}
 DK.add(bx(.26,H,.3),M(6,H/2,-6),STEEL);DK.add(bx(.26,H,.3),M(6,H/2,6),STEEL);
 for(const s of[-1,1]){PN.add(bx(.24,H,4.6),M(6,H/2,s*3.7),WHITE);PN.add(bx(.26,.22,4.6),M(6,3.55,s*3.7),ORANGE);WN.add(new THREE.PlaneGeometry(1.2,1.1),M(6.13,1.8,s*3.7,0,Math.PI/2,0),WHITE);}
 PN.add(bx(.24,H-2.4,2.8),M(6,2.4+(H-2.4)/2,0),WHITE);DK.add(bx(.3,.2,3),M(6,2.4,0),STEEL);for(const s of[-1,1])DK.add(bx(.3,2.4,.14),M(6,1.2,s*1.42),STEEL);
 LM.add(bx(.08,.08,1.8),M(6.2,2.55,0),C(0xffa040).multiplyScalar(2.5));
 // the broken end: stubs of wall at the corners with ragged tops, a beam fallen across, cables hanging into the gap
 for(const s of[-1,1]){PN.add(bx(.24,H*.8,1.2),M(-6,H*.4,s*5.4),WHITE);PN.add(bx(.24,H*.35,.8),M(-6,H*.8+.2,s*5.6,0,0,.3),WHITE2);}
 DK.add(bx(.35,.35,9),M(-5.2,H-.9,.3,.18,.1,.08),STEEL);
 {const cab=new Merger();for(let i=0;i<7;i++){const z=R(-4.5,4.5),x=-5.6+R(-.3,.3),L=R(1.5,3.6);cab.add(new THREE.CylinderGeometry(.04,.04,L,5),M(x,H-L/2,z,R(-.2,.2),0,R(-.25,.25)),DARKS);}const g=cab.build();DK.add(g,M(0,0,0),DARKS);}
 // a sensor dome, a mast with its red light, solar racks under snow
 PN.add(new THREE.SphereGeometry(1.5,20,12,0,Math.PI*2,0,Math.PI/2),M(3.4,H+.6,3.2),WHITE);DK.add(new THREE.CylinderGeometry(1.6,1.6,.3,20),M(3.4,H+.55,3.2),STEEL);
 DK.add(new THREE.CylinderGeometry(.07,.12,7.5,6),M(4.2,H+4.2,-3.6),STEEL);for(const y of[2.5,4.5,6.2])DK.add(bx(1.4,.06,.06),M(4.2,H+.5+y,-3.6),STEEL);LM.add(new THREE.SphereGeometry(.14,8,6),M(4.2,H+8,-3.6),RED);
 for(let i=0;i<3;i++){DK.add(bx(2.4,.08,1.4),M(-2.4+i*2.6,H+1,-3.4,-.5,0,0),C(0x223044));SN.add(bx(2.4,.1,.9),M(-2.4+i*2.6,H+1.2,-3.6,-.5,0,0),SNOWC);DK.add(bx(.08,.9,.08),M(-2.4+i*2.6,H+.75,-3,0,0,0),STEEL);}
 // inside: consoles under the north windows (screens lit), a lab bench down the middle, the ice-core tank glowing, lockers, a fallen
 // shelf by the break
 for(let i=0;i<4;i++){const x=-3.5+i*2.4;DK.add(bx(1.8,1.0,.8),M(x,.5,-5.4),C(0x4a5058));LM.add(bx(1.2,.5,.04),M(x,1.25,-5.62,-.25,0,0),C(0x6ae0ff).multiplyScalar(1.4));}
 DK.add(bx(5,.95,1.6),M(1,.48,0),C(0x5a6068));PN.add(bx(5.2,.08,1.8),M(1,.98,0),WHITE);
 DK.add(new THREE.CylinderGeometry(.75,.75,3.2,16),M(-3.4,1.6,3.8),C(0x3a4248));LM.add(new THREE.CylinderGeometry(.62,.62,2.6,16,1,true),M(-3.4,1.6,3.8),CYAN);
 for(let i=0;i<3;i++)PN.add(bx(.7,2.1,.55),M(3+i*.75,1.05,5.55),C(0xb8c0c8));
 PN.add(bx(2.4,.2,.6),M(-4.6,.45,-2.6,0,.4,1.15),C(0xb8c0c8));
 // snow blown in through the break
 for(let i=0;i<6;i++)SN.add(new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),mat4(-5.3+R(0,1.5),-.05,R(-4.5,4.5),R(.8,1.6),R(.15,.35),R(.8,1.4),0,R(0,3),0),SNOWC);
 const meshes=[[PN,panelMat,true],[DK,darkMat,true],[WN,winMat,false],[LM,lampMat,false],[SN,snowMat,true]].map(([mg,mat,sh])=>{const g=mg.build();g.applyMatrix4(SH);
   const a=rmMesh(g,mat,sh,true),b=rmMesh(g,mat,sh,true);b.rotation.y=Math.PI;return a;});
 // the broken floor slab, leaning from the floor's edge down into the Rift, rubble at its foot (world frame, then its twin)
 const SL=new Merger(),y7=rmStFloor(7),y2=rmRampY(2),L=Math.hypot(5,y7-y2),ang=Math.atan2(y7-y2,5);
 SL.add(boxUV(L+.4,.4,10,1.2),M(4.5,(y7+y2)/2-.2,0,0,0,ang),GRATE);
 for(let i=0;i<9;i++)SL.add(new THREE.CylinderGeometry(.025,.025,R(.6,1.4),4),M(2.1+R(-.2,.2),y2+.3,R(-4.6,4.6),R(-.4,.4),0,R(.6,1.2)),C(0x6a4a3a));
 for(let i=0;i<12;i++)SL.add(boxUV(R(.6,1.6),R(.08,.14),R(.5,1.2),1),M(R(.4,2.6),y2+R(.05,.35),R(-4.5,4.5),R(-.5,.5),R(0,3),R(-.5,.5)),i%3?WHITE2:GRATE);
 for(let i=0;i<7;i++)SL.add(new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),mat4(R(.3,2.4),y2-.05,R(-4.6,4.6),R(.6,1.2),R(.15,.35),R(.6,1.2),0,R(0,3),0),SNOWC);
 for(const s of[-1,1]){SL.add(boxUV(4.6,RM_S0+.25-(y2-.4),.3,1.2),M(4.9,(RM_S0+.25+y2-.4)/2,s*5.2),C(0x8c9298));SL.add(boxUV(4.7,.25,.36,1),M(4.9,RM_S0-1.4,s*5.2),ORANGE);for(let i=0;i<2;i++)SL.add(boxUV(.18,RM_S0-y2,.22,1),M(3.3+i*2.6,(RM_S0+y2)/2,s*5.0),STEEL);}
 {const g=SL.build(),a=rmMesh(g,darkMat,true,true),b=rmMesh(g,darkMat,true,true);b.rotation.y=Math.PI;}
 {const SC=new Merger();for(const s of[-1,1])SC.add(boxUV(4.4,.5,1.5,1.2),M(4.9,RM_S0-.18,s*5.95),SNOWC);const g=SC.build(),a=rmMesh(g,snowMat,false,true),b=rmMesh(g,snowMat,false,true);b.rotation.y=Math.PI;}
 // the warm light inside each half
 for(const s of[1,-1]){const L=new THREE.PointLight(C(0xffd2a0),1.15,16,1.8);L.position.set(s*12,rmStFloor(12)+3.4,0);scene.add(L);}}
// its walls, roofs and furniture for walking, shots and sight (east half in the world; s3Wall2 adds the west's)
{const k=RM_ST.k,H=RM_ST.roofH,fy=rmStFloor;
 // a wall along x between x0 and x1 at z, from h0 to h1 over the floor, cut in 2 m pieces so each follows the tilt
 const wx=(x0,x1,z,h0,h1,th,los)=>{for(let x=x0;x<x1-.01;x+=2){const xe=Math.min(x1,x+2);s3Wall2(x,z,xe,z,fy(x)+h0-.3,fy(xe)+h1,th||.3,true,los!==false);}};
 for(const z of[-6,6]){const door=z>0?[9,11]:null;
   for(let b=0;b<6;b++){const x0=7+b*2,x1=x0+2,isDoor=door&&x0===door[0];
     if(!isDoor)wx(x0,x1,z,0,1.0,.3);wx(x0,x1,z,2.3,H,.3);s3Wall2(x0-.13,z,x0+.13,z,fy(x0)-.3,fy(x0)+H,.32,true,true);}}
 s3Wall2(19,-6,19,-1.4,fy(19)-.3,fy(19)+H,.3);s3Wall2(19,1.4,19,6,fy(19)-.3,fy(19)+H,.3);s3Wall2(19,-1.4,19,1.4,fy(19)+2.4,fy(19)+H,.3);
 for(const s of[-1,1])s3Wall2(7,s*4.8,7,s*6,fy(7)-.3,fy(7)+H*.8,.3);
 // the inner ends of the long walls where the floor's broken off (you can't walk round the stub into the Rift's wall)
 for(const s of[-1,1])s3Wall2(3,s*5.05,7,s*5.05,RM_S0-RM_ST.dep-.5,RM_S0+.5,.3,true,false);
 // furniture
 for(let i=0;i<4;i++){const x=9.5+i*2.4;s3Wall2(x-.9,-5.4,x+.9,-5.4,fy(x)-.2,fy(x)+1.0,.8);}
 s3Wall2(11.5,0,16.5,0,fy(11.5)-.2,fy(16.5)+1.0,1.6);
 for(const q of[1,-1])OBST.push({x:q*9.6,z:q*3.8,r:.85,h:3.2,y0:fy(9.6)});
 s3Wall2(15.6,5.55,18.1,5.55,fy(15.6)-.2,fy(18.1)+2.1,.55);
 // the roofs you can walk on, and their slabs for shots (tilted with the floor)
 for(const q of[1,-1]){const ins=(x,z)=>{const X=x*q,Z=z*q;return X>=6.8&&X<=19.2&&Math.abs(Z)<=6.3;};
   s3Surf(ins,(x,z)=>rmStRoof(x*q)+.36,q>0?[6.5,-6.5,19.5,6.5]:[-19.5,-6.5,-6.5,6.5]);
   s3Floor(ins,rmStRoof(0)+.18,q*k,0,q>0?[6.5,-6.5,19.5,6.5]:[-19.5,-6.5,-6.5,6.5]);}
 // the parapet round the roof's edge (knee high: stops you walking off, not shots)
 wx(7.2,19.2,6.2,H+.3,H+.8,.2,false);wx(7.2,9.2,-6.2,H+.3,H+.8,.2,false);s3Wall2(19.2,-6.2,19.2,6.2,fy(19)+H+.3,fy(19)+H+.8,.2,true,false);}
// (the north side of each roof has no parapet past its first bay: the drift comes up to it there)

/* ---------- seracs (towers of broken ice), pressure ridges (walls of blocks pushed up where the ice meets), boulders through the ice,
   and Hollow skimmers frozen where they came down. One half laid out, the other its twin ---------- */
const RM_CLEAR=(x,z,r)=>{const q=x<0?-1:1,X=x*q,Z=z*q;if(X>RM_ST.x0-3&&X<RM_ST.x1+5&&Math.abs(Z)<RM_ST.hz+5)return false;if(rmDrift(X,Z)>-1e8&&X>6&&X<21&&Z>-22&&Z<-4)return false;
  if(rmCrev(x,z).bd<r+1.6)return false;for(const B of GS.BASES)if(Math.hypot(x-B.x,z-B.z)<B.shieldR+4+r)return false;return edgeD(x,z)<GS.HALF-2-r;};
{const SR=new RmMerger(),RK=new RmMerger(),SNW=new Merger();
 const seracGeo=(w,h,d,sd)=>{const g=new THREE.BoxGeometry(w,h,d,3,5,3),P=g.attributes.position,cols=[];
   for(let i=0;i<P.count;i++){let x=P.getX(i),y=P.getY(i),z=P.getZ(i);const v=y/h+.5,tw=1-.38*v*v;x*=tw*(1+.18*(vnoise(y*.8+sd,z*.9)-.5));z*=tw*(1+.18*(vnoise(x*.9,y*.7+sd)-.5));
     if(v>.98){x+=(hash(i,sd|0)-.5)*.6;z+=(hash(sd|0,i)-.5)*.6;y+=(hash(i*3,sd|0)-.5)*.8;}P.setXYZ(i,x,y,z);
     const nn=vnoise(x*1.3+sd,y*.9+z);tmpC.copy(K_ICE_T).lerp(K_ICE_M,sstep(.95,.1,v)*.85).lerp(K_ICE_D,sstep(.5,0,v)*.35+nn*.2).lerp(K_SNOW,sstep(.8,1,v)*.9);cols.push(tmpC.r,tmpC.g,tmpC.b);}
   g.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));const ng=g.index?g.toNonIndexed():g;ng.computeVertexNormals();return ng;};
 const serac=(x,z,w,d,h,ry)=>{if(!RM_CLEAR(x,z,Math.max(w,d)*.6))return false;const y=terrH(x,z),sd=x*3.1+z;
   for(const q of[1,-1]){const X=x*q,Z=z*q,Y=terrH(X,Z),rr=ry+(q<0?Math.PI:0);SR.add(seracGeo(w,h,d,sd),M(X,Y+h/2-.6,Z,R(-.06,.06),rr,R(-.06,.06)),null);
     SNW.add(new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),mat4(X,Y-.1,Z,w*.85,.7,d*.85,0,rr,0),K_SNOW);
     const ux=Math.cos(rr),uz=-Math.sin(rr);s3Wall(X-ux*w*.42,Z-uz*w*.42,X+ux*w*.42,Z+uz*w*.42,Y-.6,Y+h*.92,d*.78);}
   return true;};
 const cluster=(cx,cz,n,big)=>{let made=0;for(let k=0;k<n*6&&made<n;k++){const a=R(0,6.3),r=R(0,big?7:5),w=R(2.2,4.2)*(big?1.2:1),d=R(1.8,3.2),h=R(3.2,7.5)*(big?1.15:1);if(serac(cx+Math.cos(a)*r,cz+Math.sin(a)*r,w,d,h,R(0,3.1)))made++;}};
 cluster(-62,-24,3,true);cluster(-27,-62,3,true);cluster(-34,26,2,false);cluster(-72,-60,3,false);cluster(-18,-32,2,false);cluster(-84,48,3,true);cluster(-6,-86,3,true);cluster(-58,72,2,false);cluster(-30,-88,2,false);cluster(-86,-30,2,false);
 // pressure ridges: a line of tilted blocks, chest high (cover, not walls)
 const ridge=(ax,az,bx,bz,h)=>{const L=Math.hypot(bx-ax,bz-az),n=Math.round(L/1.5),ry=Math.atan2(-(bz-az),bx-ax);if(!RM_CLEAR((ax+bx)/2,(az+bz)/2,L/2-1)&&!(RM_CLEAR(ax,az,1)&&RM_CLEAR(bx,bz,1)))return;
   for(const q of[1,-1]){const X0=ax*q,Z0=az*q,X1=bx*q,Z1=bz*q;let hm=h;
     for(let k=0;k<n;k++){const t=(k+.5)/n,x=lerp(X0,X1,t),z=lerp(Z0,Z1,t),y=terrH(x,z),hh=h*(.7+.5*hash(k,(x*7)|0));hm=Math.min(hm,hh);
       SR.add(seracGeo(R(1.3,2),hh+.6,R(.9,1.5),k*3+q),M(x+R(-.3,.3),y+hh/2-.3,z+R(-.3,.3),R(-.35,.35),ry+(q<0?Math.PI:0)+R(-.4,.4),R(-.3,.3)),null);}
     const y0=Math.min(terrH(X0,Z0),terrH(X1,Z1))-.3;s3Wall(X0,Z0,X1,Z1,y0,y0+.3+hm,1.1);}};
 ridge(-54,8,-45,15,1.4);ridge(-31,-15,-24,-24,1.5);ridge(-77,-44,-70,-35,1.3);ridge(-21,42,-12,46,1.4);ridge(-58,-90,-48,-92,1.6);ridge(-40,-4,-34,4,1.2);ridge(-66,24,-60,30,1.3);ridge(-10,26,-4,34,1.2);
 // boulders: nunataks of dark rock through the ice, snow on their tops
 const rockGeo=(r,sd)=>{const g=new THREE.IcosahedronGeometry(1,3),P=g.attributes.position,cols=[];for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),n=.8+.32*vnoise(x*1.3+sd,z*1.3+y*1.1)+.08*vnoise(x*4+sd,y*4+z);P.setXYZ(i,x*n,y*n,z*n);
     tmpC.copy(K_ROCK).lerp(K_ROCK2,vnoise(x*3+sd,y*3)).lerp(K_SNOW,sstep(.35,.7,y*n));cols.push(tmpC.r,tmpC.g,tmpC.b);}
   g.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));const ng=g.index?g.toNonIndexed():g;ng.computeVertexNormals();return ng;};
 for(const [x,z,r,h] of[[-14,-56,3.6,4.6],[-46,-6,2.2,2.6],[-74,64,3,3.4],[-40,80,2.4,3],[-22,10,1.8,2]]){if(!RM_CLEAR(x,z,r))continue;
   for(const q of[1,-1]){const X=x*q,Z=z*q,Y=terrH(X,Z);RK.add(rockGeo(r,X),mat4(X,Y+h*.3,Z,r*1.15,h*.85,r,0,R(0,6),0),null);OBST.push({x:X,z:Z,r:r*1.05,h:h*1.1});}}
 rmMesh(SR.build(),seracMat,true,true);rmMesh(RK.build(),rockMat,true,true);rmMesh(SNW.build(),snowMat,false,true);}
// Hollow skimmers that came down in the ice (the Hollow's own craft, violet), half sunk and frosted
{const W=[[-34,-42,.7,.22,.18,15],[-50,22,-1.15,-.12,.26,13],[-8,-70,2.2,.3,-.12,12]];
 for(const [x,z,yaw,pitch,roll,len] of W){if(!RM_CLEAR(x,z,3))continue;
   for(const q of[1,-1]){const X=x*q,Z=z*q,Y=terrH(X,Z),yw=yaw+(q<0?Math.PI:0),g=new THREE.Group();g.position.set(X,Y+.4,Z);g.rotation.set(pitch,yw,roll,'YXZ');g.userData.dyn=1;scene.add(g);
     MODELS.swapShip(g,'wraith',{len,tint:0x9a78d0,glow:.08,metal:.25,shadow:true,hide:[]}).then(m=>{if(m)m.traverse(o=>{o.userData.dyn=1;});});
     // the ice it ploughed up, and frost drifts over it
     const S=new Merger();for(let i=0;i<5;i++){const a=yw+R(-.5,.5)+(i%2?Math.PI:0),d=R(2,len*.45);S.add(new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),mat4(X-Math.sin(a)*d,Y-.2,Z-Math.cos(a)*d,R(1.6,3),R(.5,1.1),R(1.6,3),0,R(0,3),0),K_SNOW);}
     rmMesh(S.build(),snowMat,false,true);
     const ux=-Math.sin(yw),uz=-Math.cos(yw);s3Wall(X-ux*len*.42,Z-uz*len*.42,X+ux*len*.42,Z+uz*len*.42,Y-.5,Y+2.6,len*.32);}}}

/* ---------- the outposts: a rock outcrop, its rim broken by three ways down (front and both shoulders), the Keepers' prefab wall round
   the back, light masts in the side's colour, a dish, crates, and the warthog's pad out front ---------- */
for(const B of GS.BASES){const f=Math.atan2(B.fx,B.fz),pt=(a,r)=>({x:B.x+Math.sin(f+a)*r,z:B.z+Math.cos(f+a)*r}),TC=C(GS.TEAMS[B.team].c);
  const RK=new RmMerger(),PN=new Merger(),DK=new Merger(),LM=new Merger();
  const rk=(x,z,r,h,low)=>{const y=terrH(x,z),g=new THREE.IcosahedronGeometry(1,2),P=g.attributes.position,sd=x*1.3+z;for(let i=0;i<P.count;i++){const px=P.getX(i),py=P.getY(i),pz=P.getZ(i),n=.72+.42*vnoise(px*1.4+sd,pz*1.4+py)+.1*vnoise(px*4,py*4+sd);P.setXYZ(i,px*n,py*n,pz*n);}
    const cols=[];for(let i=0;i<P.count;i++){tmpC.copy(K_ROCK).lerp(K_ROCK2,hash(i,(x*3)|0)).lerp(K_SNOW,sstep(.3,.8,P.getY(i)));cols.push(tmpC.r,tmpC.g,tmpC.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
    const ng=g.index?g.toNonIndexed():g;ng.computeVertexNormals();RK.add(ng,mat4(x,y+h*.25,z,r,h,r*R(.8,1.2),R(-.2,.2),R(0,6),R(-.2,.2)),null);if(!low)OBST.push({x,z,r:r*.95,h:h*1.2});};
  // the rim: boulders round the edge except the three ways down
  for(let a=-Math.PI;a<Math.PI;a+=.2){const gate=[0,-.95,.95].some(g=>Math.abs(((a-g+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI)<.27);if(gate)continue;
    const p=pt(a,R(15,17.5));if(edgeD(p.x,p.z)>GS.HALF-1.5)continue;rk(p.x,p.z,R(1.4,2.6),R(1.6,3.2));}
  // the prefab wall round the back: panels in white with the side's stripe, posts between them
  const wall=[];for(let a=Math.PI-1.15;a<=Math.PI+1.15+1e-6;a+=.23){wall.push(pt(a,11.6));}
  for(let i=0;i<wall.length-1;i++){const p=wall[i],q=wall[i+1],mx=(p.x+q.x)/2,mz=(p.z+q.z)/2,L=Math.hypot(q.x-p.x,q.z-p.z),ry=Math.atan2(-(q.z-p.z),q.x-p.x);
    PN.add(boxUV(L,3,.35,1.2),M(mx,B.y+1.5,mz,0,ry,0),C(0xe6ebef));PN.add(boxUV(L+.02,.32,.37,1.2),M(mx,B.y+2.4,mz,0,ry,0),TC);DK.add(boxUV(.3,3.4,.5,1),M(p.x,B.y+1.7,p.z,0,ry,0),C(0x4a5058));
    s3Wall(p.x,p.z,q.x,q.z,B.y-.3,B.y+3,.4);}
  // the light masts in the side's colour
  for(const a of[Math.PI-.62,Math.PI+.62]){const p=pt(a,10);DK.add(new THREE.CylinderGeometry(.1,.16,7,8),M(p.x,B.y+3.5,p.z),C(0x3a4048));DK.add(boxUV(1.2,.4,.5,1),M(p.x,B.y+7,p.z,0,f,0),C(0x2a2e34));
    LM.add(boxUV(1,.12,.06,1),M(p.x+Math.sin(f)*.27,B.y+6.95,p.z+Math.cos(f)*.27,0,f,0),tmpC.copy(TC).multiplyScalar(3).clone());OBST.push({x:p.x,z:p.z,r:.25,h:7});
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(GS.TEAMS[B.team].c).multiplyScalar(2.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.set(p.x,B.y+7,p.z);sp.scale.setScalar(2.4);sp.userData.dyn=1;scene.add(sp);}
  {const L=new THREE.PointLight(TC,1.4,30,1.8);const p=pt(Math.PI,6);L.position.set(p.x,B.y+5,p.z);scene.add(L);}
  // a dish, crates, the hog's pad with its markings
  {const p=pt(Math.PI+1.42,9.5);DK.add(new THREE.CylinderGeometry(.18,.25,2.4,8),M(p.x,B.y+1.2,p.z),C(0x4a5058));PN.add(new THREE.SphereGeometry(1.5,18,10,0,Math.PI*2,0,Math.PI*.42),M(p.x,B.y+2.6,p.z,-.9,f+2.2,0),C(0xe6ebef));OBST.push({x:p.x,z:p.z,r:.5,h:2.6});}
  for(const [a,r] of[[Math.PI-1.4,9.5],[Math.PI-1.62,8.2],[2.1,9]]){const p=pt(a,r);DK.add(boxUV(1.4,1,1,1),M(p.x,B.y+.5,p.z,0,R(0,3),0),C(0x5a5a46));s3Wall(p.x-.6,p.z,p.x+.6,p.z,B.y-.2,B.y+1,1);}
  {const p=pt(0,7);LM.add(new THREE.RingGeometry(2.4,2.6,32).rotateX(-Math.PI/2),M(p.x,B.y+.04,p.z),tmpC.copy(TC).multiplyScalar(1.4).clone());}
  // the outcrop's flanks: broken rock down the slopes between the ways down
  for(let a=-Math.PI;a<Math.PI;a+=.32){const gate=[0,-.95,.95].some(g=>Math.abs(((a-g+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI)<.34);if(gate)continue;const p=pt(a,R(18.5,20.5));if(edgeD(p.x,p.z)>GS.HALF+6)continue;rk(p.x,p.z,R(1.8,3.2),R(1,2),true);}
  rmMesh(RK.build(),rockMat,true,true);rmMesh(PN.build(),panelMat,true,true);rmMesh(DK.build(),darkMat,true,true);rmMesh(LM.build(),lampMat,false,false);}

/* ---------- weather: snow blowing past in streaks, spindrift snaking over the ice, and now and then a whiteout that pulls everything
   in close (the fog thickens, the far view goes white, the bots can't see as far, the wind rises). Wind sound from a little synth ---------- */
const RM_WIND=new THREE.Vector2(.94,.34).normalize();
const RM_GUST={g:0,t:R(30,50),ph:0,hold:0};   // g: 0 calm .. 1 whiteout
const RM_SNOW=(()=>{const N=coarse?900:2200,B=30,H=16,pos=new Float32Array(N*6),v=new Float32Array(N);
  for(let i=0;i<N;i++){const x=R(-B,B),y=R(-2,H),z=R(-B,B);pos.set([x,y,z,x,y,z],i*6);v[i]=R(.7,1.3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:C(0xffffff),transparent:true,opacity:.55,depthWrite:false,fog:true}));m.frustumCulled=false;m.userData.dyn=1;scene.add(m);
  function update(dt,T){const c=camera.position,a=g.attributes.position.array,sp=9+RM_GUST.g*16,l=.25+RM_GUST.g*.5;m.material.opacity=.38+RM_GUST.g*.4;
    for(let i=0;i<N;i++){const o=i*6,vv=v[i]*sp;let x=a[o]+RM_WIND.x*vv*dt+Math.sin(T*1.7+i)*dt*.6,y=a[o+1]-dt*(.9+v[i]*.6)+Math.sin(T*2.3+i*.7)*dt*.5,z=a[o+2]+RM_WIND.y*vv*dt;
      if(x-c.x>B)x-=2*B;else if(c.x-x>B)x+=2*B;if(z-c.z>B)z-=2*B;else if(c.z-z>B)z+=2*B;if(y<c.y-6)y=c.y+R(4,H);else if(y>c.y+H)y=c.y-4;
      a[o]=x;a[o+1]=y;a[o+2]=z;a[o+3]=x-RM_WIND.x*l*v[i];a[o+4]=y+.02;a[o+5]=z-RM_WIND.y*l*v[i];}
    g.attributes.position.needsUpdate=true;}
  return{update};})();
// spindrift: a skin just over the ice, streaks of snow snaking downwind
const RM_DRIFT=(()=>{const S=GS.HALF*2+30,N=coarse?70:110,g=new RmGB(),stp=S/N,ids=new Int32Array((N+1)*(N+1)).fill(-1);
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-S/2+i*stp,z=-S/2+j*stp;const ok=!(Math.abs(x)<GS.HALF+2&&Math.abs(z)<GS.HALF+2&&RM_CUT(x,z));if(!ok)continue;ids[j*(N+1)+i]=g.v(x,rmVisH(x,z)+.18,z,K_SNOW,x,z);}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=ids[j*(N+1)+i],b=ids[j*(N+1)+i+1],c=ids[(j+1)*(N+1)+i],d=ids[(j+1)*(N+1)+i+1];if(a<0||b<0||c<0||d<0)continue;g.q(a,c,b,d);}
  const U={uT:{value:0},uG:{value:0},uW:{value:RM_WIND},fogC:{value:scene.fog.color},fogD:{value:RM_FOG0}};
  const m=new THREE.Mesh(g.build(),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`varying vec3 vW;varying float vD;uniform float uT,uG,fogD;uniform vec2 uW;uniform vec3 fogC;
      float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
      void main(){vec2 w=normalize(uW),q=vec2(dot(vW.xz,w),dot(vW.xz,vec2(-w.y,w.x)));float sp=uT*(5.0+uG*9.0);
        float a=ns(vec2((q.x-sp)*.09,q.y*.55))*.6+ns(vec2((q.x-sp*1.3)*.25,q.y*1.6))*.4;a=smoothstep(.48,.82,a)*(.32+uG*.45);
        a*=smoothstep(2.0,6.0,vD);float f=1.0-exp(-fogD*fogD*vD*vD);gl_FragColor=vec4(mix(vec3(.97,.98,1.0),fogC,f),a*(1.0-f*.6));}`}));
  m.renderOrder=1;m.userData.dyn=1;m.frustumCulled=false;scene.add(m);return{U};})();
// the whiteout's veil over everything far: a shell round the camera (the far ranges are drawn without fog, so this is what hides them)
const RM_VEIL=(()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(420,24,12),new THREE.MeshBasicMaterial({color:scene.fog.color,transparent:true,opacity:0,side:THREE.BackSide,depthWrite:false,fog:false}));
  m.renderOrder=3;m.userData.dyn=1;m.frustumCulled=false;scene.add(m);return m;})();
const RM_SND=(()=>{let ctx=null,g=null,bp=null,lp=null;
  function start(){if(ctx)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(_){return;}
    const len=ctx.sampleRate*4,buf=ctx.createBuffer(2,len,ctx.sampleRate);for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);let b=0;for(let i=0;i<len;i++){b=.992*b+(Math.random()*2-1)*.08;d[i]=b*1.6;}}
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=420;bp.Q.value=1.4;lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;
    g=ctx.createGain();g.gain.value=0;src.connect(bp);bp.connect(lp);lp.connect(g);g.connect(ctx.destination);src.start();}
  function update(T,gust,inside){if(!ctx||!g)return;const t=ctx.currentTime,k=(.07+gust*.26)*(1-inside*.7);g.gain.setTargetAtTime(k,t,.4);bp.frequency.setTargetAtTime(330+180*Math.sin(T*.37)+120*Math.sin(T*1.13)+gust*260,t,.3);lp.frequency.setTargetAtTime(inside?700:2600,t,.5);}
  const go=()=>{start();if(ctx&&ctx.state==='suspended')ctx.resume();};addEventListener('pointerdown',go);addEventListener('keydown',go);
  document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden)ctx.suspend();else ctx.resume();});
  return{update};})();
// where the camera is under something (a station half, a cave's roof, a bridge): the reverb (js/origin/05-audio.js) and the wind
GS.indoorAt=()=>{const c=camera.position,q=c.x<0?-1:1,X=c.x*q,Z=c.z*q;if(rmInSt(X,Z)&&c.y<rmStRoof(X))return 1;const cv=rmCover(c.x,c.z);if(cv!=null&&c.y<cv-.3)return 1;
  const I=rmCrev(c.x,c.z);return I.bd<0&&c.y<rmSurf(c.x,c.z)-2?.45:0;};
function rmGustStep(dt){const G=RM_GUST;G.t-=dt;
  if(G.ph===0&&G.t<=0){G.ph=1;G.hold=R(7,12);if(typeof banner==='function'&&typeof phase!=='undefined'&&phase==='play')banner('Whiteout coming through');}
  if(G.ph===1){G.g=Math.min(1,G.g+dt/3.5);if(G.g>=1){G.hold-=dt;if(G.hold<=0)G.ph=2;}}
  if(G.ph===2){G.g=Math.max(0,G.g-dt/5);if(G.g<=0){G.ph=0;G.t=R(40,75);}}
  if(G.ph===0)G.g=Math.max(0,G.g-dt*.3);
  const g=sstep(0,1,G.g);scene.fog.density=RM_FOG0+g*.021;RM_DRIFT.U.fogD.value=scene.fog.density;RM_DRIFT.U.uG.value=g;RM_VEIL.material.opacity=g*.92;skyU.veil.value=g*.85;
  if(typeof CFG!=='undefined'&&CFG.id==='mprime')CFG.see=95*(1-.55*g);   // (the bots: js/mp/03-match.js reads CFG.see each time they look)
  return g;}
function updateLights(dt,T,pos){RM_VEIL.position.copy(camera.position);skyU.uT.value=T;FAR.update(T);RM_DRIFT.U.uT.value=T;const g=rmGustStep(dt);RM_SNOW.update(dt,T);let ins=0;try{ins=GS.indoorAt();}catch(_){}RM_SND.update(T,g,ins);}
// diamond dust: ice crystals hanging in the air, catching the light
const DUST_N=coarse?110:260,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,12),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.07,color:C(0xffffff).multiplyScalar(1.6),transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));dust.userData.dyn=1;scene.add(dust);

/* ---------- the bots' map: a grid of spots on the ice every 5.5 m (on a bridge or a cave's roof where there is one, down on the floor
   where a crevasse is open), spots along every crevasse's floor (under the bridges and roofs too), the station's roofs, and the bridges'
   tops. Two spots are joined where you can walk from one to the other without a climb or a drop (so into and out of a crevasse only by
   its ramps or the station's slabs). NEXT[t*N+a] is the next spot from a on the way to t (same shape as js/mp/01-world.js) ---------- */
const NAV=(()=>{const t0=performance.now(),nodes=[],SP=5.5;
  const add=(x,z,y,f)=>{nodes.push(Object.assign({x,z,y,nb:[],up:true,r:2.3},f||{}));return nodes.length-1;};
  // walking from a to b at height: the floor under each step no more than 0.6 m up or down from the last, nothing in the way
  function walk(ax,az,ay,bx,bz,by,m){m=m==null?.4:m;const L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(L/.5));let cy=ay;
    for(let k=1;k<=n;k++){const t=k/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,y=floorY3(x,z,cy+.25);if(Math.abs(y-cy)>.62)return false;if(playD3(x,z,y)>-m)return false;cy=y;}
    return by==null||Math.abs(cy-by)<.75;}
  const ok=(x,z,y)=>playD3(x,z,y)<-.8&&Math.abs(floorY3(x,z,y+.3)-y)<.3;
  const n0=Math.ceil(GS.HALF/SP);
  for(let i=-n0;i<=n0;i++)for(let j=-n0;j<=n0;j++){const x=i*SP+(j%2?SP*.25:0),z=j*SP;if(edgeD(x,z)>GS.HALF-2.5)continue;const y=groundY(x,z);if(ok(x,z,y))add(x,z,y);}
  for(const c of RM_CREV)for(let s=1.5;s<c.L-1;s+=4){const p=c.P[Math.round(s)],y=terrH(p.x,p.z);if(rmTap(c,s)>.15&&ok(p.x,p.z,y))add(p.x,p.z,y,{trench:1});}
  for(const {c,K} of RM_COVERS)if(K.kind==='bridge'){const p=c.P[Math.round((K.s0+K.s1)/2)];const y=rmCover(p.x,p.z);if(y!=null)add(p.x,p.z,y,{perch:1});}
  for(const q of[1,-1])for(let X=9;X<=18;X+=3)for(let Z=-4.5;Z<=4.5;Z+=3){const x=X*q,z=Z*q,y=rmStRoof(X)+.36;if(Math.abs(floorY3(x,z,y+.2)-y)<.2)add(x,z,y,{perch:1,roof:1});}
  for(const q of[1,-1])for(let X=8.5;X<=18;X+=3)for(let Z=-4;Z<=4;Z+=4){const x=X*q,z=Z*q,y=rmStFloor(X);if(ok(x,z,y))add(x,z,y,{inside:1});}
  // links: every pair within 8 m that you can walk between (both ways)
  const BK={},bk=(x,z)=>Math.floor(x/8)+','+Math.floor(z/8);nodes.forEach((n,k)=>{(BK[bk(n.x,n.z)]||(BK[bk(n.x,n.z)]=[])).push(k);});
  const link=(a,b)=>{if(a===b||nodes[a].nb.includes(b))return;nodes[a].nb.push(b);nodes[b].nb.push(a);};
  for(let a=0;a<nodes.length;a++){const A=nodes[a],gx=Math.floor(A.x/8),gz=Math.floor(A.z/8);
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=BK[(gx+i)+','+(gz+j)];if(!L)continue;for(const b of L){if(b<=a)continue;const B=nodes[b],d=Math.hypot(B.x-A.x,B.z-A.z);if(d>8.2||Math.abs(B.y-A.y)>6)continue;
      if(walk(A.x,A.z,A.y,B.x,B.z,B.y,.35)&&walk(B.x,B.z,B.y,A.x,A.z,A.y,.35))link(a,b);}}}
  for(const B of GS.BASES)B.node=nodes.reduce((best,n,k)=>Math.hypot(n.x-B.x,n.z-B.z)<Math.hypot(nodes[best].x-B.x,nodes[best].z-B.z)?k:best,0);
  const perches=[];nodes.forEach((n,k)=>{if(n.perch&&n.nb.length)perches.push(k);});
  const N=nodes.length,NEXT=new Int16Array(N*N).fill(-1),q=new Int32Array(N);
  for(let t=0;t<N;t++){const base=t*N;NEXT[base+t]=t;let h=0,e=0;q[e++]=t;while(h<e){const a=q[h++];for(const b of nodes[a].nb)if(NEXT[base+b]<0){NEXT[base+b]=a;q[e++]=b;}}}
  const memo=new Map();
  // the nearest spot on your own level that you can walk straight to
  function nearest(x,z,y){if(y==null)y=groundY(x,z);const mk=(Math.round(x/2)*100000+Math.round(z/2))*64+(Math.round(y)&63);const hit=memo.get(mk);if(hit!==undefined)return hit;
    const gx=Math.floor(x/8),gz=Math.floor(z/8),c=[];for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const L=BK[(gx+i)+','+(gz+j)];if(L)for(const k of L){const n=nodes[k],dy=Math.abs(n.y-y);c.push([Math.hypot(n.x-x,n.z-z)+(dy>1.4?60+dy*10:0),k]);}}
    c.sort((p,q)=>p[0]-q[0]);let best=c.length?c[0][1]:-1;for(let k=0;k<Math.min(7,c.length);k++){const n=nodes[c[k][1]];if(walk(x,z,y,n.x,n.z,n.y,.3)){best=c[k][1];break;}}
    if(memo.size>60000)memo.clear();memo.set(mk,best);return best;}
  const clear3=(ax,az,ay,bx,bz,by,m)=>walk(ax,az,ay,bx,bz,by,m==null?.45:m);
  const clear=(ax,az,bx,bz,m)=>walk(ax,az,groundY(ax,az),bx,bz,null,m==null?.6:m);
  return{nodes,N,NEXT,nearest,clear,clear3,perches,ms:performance.now()-t0};})();
GS.nav=NAV;
// where the bots go looking when they've nothing in sight: the station's doors and roofs, the bridges, the caves' mouths, the wrecks,
// the Teeth (js/mp/03-match.js HIGH)
GS.HILLS=[{x:20,z:0},{x:-20,z:0},{x:10,z:7.5},{x:-10,z:-7.5},{x:rmRiftX(38),z:38},{x:rmRiftX(-38),z:-38},...RM_CAVES.map(c=>({x:c.P[6].x,z:c.P[6].z})),
  {x:-34,z:-38},{x:34,z:38},{x:-50,z:18},{x:50,z:-18},...RM_TEETH.map(c=>{const p=c.P[Math.round(c.L*.5)];return{x:p.x+3,z:p.z};}),{x:-62,z:-24},{x:62,z:24},{x:0,z:-60},{x:0,z:60}];
// a gun rack inside each half of the station (the sniper's up for grabs in the middle)
GS.RACKS=[{x:15,z:3.2},{x:-15,z:-3.2}];
// the opening: in from over the sea, along the Rift, through the break in the station, to blue's outpost
GS.INTRO=[[[40,46,250],[0,0,40]],[[16,9,60],[-2,-3,6]],[[-4,3,22],[2,-3,-8]],[[-30,10,-6],[-88,5,0]]];

let composer=null,HQ=true;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,stencilBuffer:true});   // (stencil: 24-bit depth, for the far ranges)
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.32,.45,.88));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
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
