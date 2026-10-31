/* Elyra · TakeOver · Beached Freighter — the world (Oct 31, Bryce: "Beached Freighter: a huge Keeper cargo ship run aground and
   tilted about 20°. You fight on slanted decks, in the holds, and in containers spilled across the sand").

   A Keeper freighter, 72 m long, run up a beach on Elyra in the last of the afternoon and rolled over 20° toward the sea:
     the deck      one long slope from the high side (north, 10.7 m over the dunes) down to the low side (south, 4.6 m over the beach);
                   containers slid down it and fetched up against the low rail, two deck cranes, the hatch coamings for cover
     the holds     three of them, tilted the same way inside: drop in through a hatch (or walk in through the tear in the middle
                   hold's side, from the beach); a steep stair in each hatch back up to the deck
     the sand      dunes behind the high side, the beach and the shallows on the low side; the containers that went over the side
                   lie all over both, some stacked, two open at the ends so you can run through them
     the ways up   the stern doors down onto the sand at both ends (each side's straight run from its base onto the deck), two
                   stairs up the high side from the dunes, two accommodation ladders up the low side from the beach
   Blue at the west end, red at the east: the ship rolls toward the sea, so this map is the same mirrored (x → -x), not turned round.
   The sun low over the sea to the south, long shadows up the dunes.

   Built on js/mp/kit.js. Units are metres; north is -z. */
setSeed(7373);
renderer.toneMappingExposure=1.0;
HAZE_HEX=0xd6b89a;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),.0055);scene.background=C(HAZE_HEX);

/* ---------- the ship's frame: x along her, s across (south +), v up from the pivot; rolled PHI toward the sea ---------- */
const PHI=20*Math.PI/180,CP=Math.cos(PHI),SP=Math.sin(PHI),TP=Math.tan(PHI),Y0=2;
const SW=(s,v)=>({z:s*CP+v*SP,y:Y0+v*CP-s*SP});   // ship → world (z, y)
const SHIP_X=36,BEAM=9,VK=-4,VD=6,VF=1;            // half length, half beam, keel, deck, the holds' floor
const deckY=z=>Y0+VD/CP-z*TP,floorYh=z=>Y0+VF/CP-z*TP;
const ZN=SW(-BEAM,VD).z,ZS=SW(BEAM,VD).z;            // the deck's edges in the world (north -6.4, south 10.5)
const HOLDS=[[-31,-19],[-6,6],[19,31]],HATCH=[[-29,-21],[-4,4],[21,29]],HS=5;   // holds' x, hatches' x, hatch half width (s)
const FOOT=[-SHIP_X,SHIP_X,-9.7,8.9];            // where the hull sits in the sand (inside it, the hull is the floor)

/* ---------- the plan ---------- */
const GS=(()=>{
  const HALF=60,BASE_R=7;
  const BASES=[{team:'blue',x:-53,z:1},{team:'red',x:53,z:1}].map(B=>{B.fx=-Math.sign(B.x);B.fz=0;B.r=BASE_R;B.shieldR=10.5;B.spawnR=2.5;B.spawnStep=2;return B;});
  const CFG={id:'mpfreighter',name:'BEACHED FREIGHTER',sub:'Team deathmatch · a wreck on the beach',air:false,vehicles:false,bots:8,score:50,time:10*60,see:120,range:80,hold:20,flashlights:false,beacon:false,domeK:.5,domeFog:false,
    brief:'TakeOver · team deathmatch. A Keeper freighter run aground on an Elyra beach, rolled 20° toward the sea. Fight up and down her slanted deck, down in her holds, and among the containers that spilled across the sand. The stern doors at each end run straight up onto the deck from your side.',
    objective:'Down the other side. Your camp has guns and ammo; nothing crosses its dome.'};
  return{HALF,HALFZ:36,SEA:-99,TEAMS:TEAM_COLS,BASES,BASE_R,CFG,NAME:CFG.name};})();
// the sand: dunes behind the high side, the beach falling into the sea on the low side, the ends levelled round each camp
function sandH(x,z){const ax=Math.abs(x);let h;
  if(z<0){const d=Math.max(0,-z-9);h=2.2+d*.06+(fbm(ax*.05+3,z*.06)-.45)*3.2*sstep(2,10,d);}
  else{h=.95-Math.max(0,z-9)*.07+(fbm(ax*.08,z*.08+5)-.5)*.5;}
  for(const B of GS.BASES){const d=Math.hypot(x-B.x,z-B.z);h=lerp(h,1.6,1-sstep(9,15,d));}
  return h;}
const inFoot=(x,z)=>Math.abs(x)<FOOT[1]&&z>FOOT[2]&&z<FOOT[3];
CITY.ground=(x,z)=>inFoot(x,z)?-6:sandH(x,z);
CITY.edge=(x,z)=>Math.max(Math.abs(x)-59.6,Math.abs(z)-35.6);
CITY.box=[-60,-36,60,36];CITY.step=2.2;CITY.hilly=true;
kitContract();
const both=(fn)=>{fn(1);fn(-1);};   // (the map is mirrored across x = 0)

/* ---------- the hull in the world: solid sections as horizontal bands of the rolled cross-section, the holds' sides as bands of
   plate, the deck and the holds' floors as tilted plates ---------- */
const POLY=[SW(-BEAM,VK),SW(BEAM,VK),SW(BEAM,VD),SW(-BEAM,VD)];   // the cross-section (z, y): keel north, keel south, deck south, deck north
function zRange(y){let lo=1e9,hi=-1e9;for(let i=0;i<4;i++){const a=POLY[i],b=POLY[(i+1)%4];if((a.y-y)*(b.y-y)>0)continue;if(Math.abs(b.y-a.y)<1e-6){lo=Math.min(lo,a.z,b.z);hi=Math.max(hi,a.z,b.z);continue;}
  const t=(y-a.y)/(b.y-a.y),z=a.z+(b.z-a.z)*t;lo=Math.min(lo,z);hi=Math.max(hi,z);}return lo<hi?[lo,hi]:null;}
const BAND=.6,YMAX=SW(-BEAM,VD).y;
function solidSection(x0,x1){for(let y=-6;y<YMAX;y+=BAND){const y1=Math.min(YMAX,y+BAND),r=zRange(y1-.001)||zRange(y+.001);if(!r)continue;KIT.block([x0,x1,r[0],r[1]],y,y1,{top:false});}
  KIT.deck((x0+x1)/2,(ZN+ZS)/2,0,x1-x0,ZS-ZN,deckY((ZN+ZS)/2),0,-TP);}
// a plate of the hull's side (or anything flat in the ship's frame across s0..s1, v0..v1), as stepped bands in the world
function plate(x0,x1,s0,s1,v0,v1,skip){const n=Math.max(1,Math.ceil((v1-v0)/.7));for(let k=0;k<n;k++){const va=v0+(v1-v0)*k/n,vb=v0+(v1-v0)*(k+1)/n;
  const P=[SW(s0,va),SW(s1,va),SW(s0,vb),SW(s1,vb)],z0=Math.min(...P.map(p=>p.z)),z1=Math.max(...P.map(p=>p.z)),y0=Math.min(...P.map(p=>p.y)),y1=Math.max(...P.map(p=>p.y));
  if(skip){const r=skip(va,vb);if(r){if(r[0]>x0)KIT.block([x0,r[0],z0,z1],y0,y1,{top:false});if(r[1]<x1)KIT.block([r[1],x1,z0,z1],y0,y1,{top:false});continue;}}
  KIT.block([x0,x1,z0,z1],y0,y1,{top:false});}}
// the solid sections: the ends and between the holds
for(const [a,b] of[[-SHIP_X,-31],[-19,-6],[6,19],[31,SHIP_X]])solidSection(a,b);
// the holds: the floor, the two sides (the middle one torn open at the floor on the beach side), the deck round the hatch
const BREACH=[-3,3];
HOLDS.forEach(([h0,h1],hi)=>{const mid=h0<0&&h1>0;
  const zf0=SW(-BEAM+.6,VF).z,zf1=SW(BEAM-.6,VF).z;KIT.deck((h0+h1)/2,(zf0+zf1)/2,0,h1-h0,zf1-zf0,floorYh((zf0+zf1)/2),0,-TP);
  // (under the floor: solid to the keel)
  for(let y=-6;y<SW(BEAM,VF).y;y+=BAND){const r=zRange(y+BAND);if(r)KIT.block([h0,h1,r[0],r[1]],y,y+BAND,{top:false});}
  for(let y=SW(BEAM,VF).y;y<SW(-BEAM,VF).y;y+=BAND){const r=zRange(y+BAND);if(!r)continue;const zc=(floorYh(0)-(y+BAND))/TP;   // (the wedge under the tilted floor)
    if(zc>r[0])KIT.block([h0,h1,r[0],Math.min(r[1],zc)],y,y+BAND,{top:false});}
  plate(h0,h1,-BEAM,-BEAM+.6,VF,VD);
  plate(h0,h1,BEAM-.6,BEAM,VF,VD,mid?(va,vb)=>vb<=VF+2.8?BREACH:null:null);
  const [c0,c1]=HATCH[hi];
  const zh0=SW(-HS,VD).z,zh1=SW(HS,VD).z,dk=(xa,xb,za,zb)=>KIT.deck((xa+xb)/2,(za+zb)/2,0,xb-xa,zb-za,deckY((za+zb)/2),0,-TP);
  dk(h0,h1,ZN,zh0);dk(h0,h1,zh1,ZS);dk(h0,c0,zh0,zh1);dk(c1,h1,zh0,zh1);});
// the tear in the middle hold's side: torn plating bent down onto the sand, a way in from the beach
KIT.ramp([0,SW(BEAM-.6,VF).z-.6],0,1,3.6,5.6,floorYh(SW(BEAM-.6,VF).z-.6)+.02,sandH(0,SW(BEAM-.6,VF).z+3)+.02,{rails:[false,false],slab:false});

/* ---------- the hatches' stairs, coamings, the deck's rails ---------- */
const HOLD_RAMPS=[];
{const zl=-1.6;
 // the middle hold's stair climbs west; the end holds' climb toward the ship's ends (away from the middle)
 HOLD_RAMPS.push(KIT.ramp([4,zl],-1,0,8.2,1.4,floorYh(zl),deckY(zl),{rails:[true,false]}));
 both(s=>HOLD_RAMPS.push(KIT.ramp([21*s,zl],s,0,8.2,1.4,floorYh(zl),deckY(zl),{rails:[true,false]})));}
const nearHR=(x,z,m)=>KIT.PAIRS.some(R=>{const q=R.loc(x,z);return q[0]>-m&&q[0]<R.L+m&&Math.abs(q[1])<R.w/2+m;});
// a low wall on the deck from (xa,za) to (xb,zb), its height following the slope (in 1 m pieces), with gaps where a stair meets it
const COAM=[];
function deckWall(xa,za,xb,zb,h,th,gapM){const L=Math.hypot(xb-xa,zb-za),n=Math.ceil(L/.5);let s0=null;
  for(let k=0;k<=n;k++){const t=k/n,x=xa+(xb-xa)*t,z=za+(zb-za)*t,ok=k<n&&!nearHR(x,z,gapM||.4);
    if(ok&&s0===null)s0=t;if(!ok&&s0!==null){const m=Math.max(1,Math.ceil((t-s0)*L));for(let j=0;j<m;j++){const u0=s0+(t-s0)*j/m,u1=s0+(t-s0)*(j+1)/m,ax=xa+(xb-xa)*u0,az=za+(zb-za)*u0,bx=xa+(xb-xa)*u1,bz=za+(zb-za)*u1;
        const y=Math.min(deckY(az),deckY(bz));KIT.wall(ax,az,bx,bz,y-.15,Math.max(deckY(az),deckY(bz))+h,th);COAM.push([ax,az,bx,bz,h]);}s0=null;}}}
for(const [c0,c1] of HATCH){const zh0=SW(-HS,VD).z,zh1=SW(HS,VD).z;deckWall(c0,zh0,c1,zh0,.9,.3,.5);deckWall(c0,zh1,c1,zh1,.9,.3,.5);deckWall(c0,zh0,c0,zh1,.9,.3,.5);deckWall(c1,zh0,c1,zh1,.9,.3,.5);}
// stairs up the high side from the dunes, ladders up the low side from the beach, the stern doors down onto the sand
const SIDE_ST=[];
both(s=>{const x=14*s,zA=-19.5,yA=sandH(x,zA);SIDE_ST.push(KIT.ramp([x,zA],0,1,13.3,1.8,yA,deckY(zA+13.3),{rails:[true,true]}));
  const xl=24*s,zB=17,yB=sandH(xl,zB);SIDE_ST.push(KIT.ramp([xl,zB],0,-1,6.8,1.5,yB,deckY(zB-6.8),{rails:[true,true]}));
  const zr=1.6,xs=-49*s,ys=sandH(xs,zr);SIDE_ST.push(KIT.ramp([xs,zr],s,0,14.2,3,ys,deckY(zr),{rails:[true,true]}));});
// the rails along both edges of the deck (the high one a long drop; the low one where the containers fetched up), gaps at the stairs
const RAIL_GAP=(x,z)=>nearHR(x,z,.6);
for(const z of[ZN+.15,ZS-.15]){const L=SHIP_X*2,n=Math.ceil(L/.5);let s0=null;
  for(let k=0;k<=n;k++){const x=-SHIP_X+L*k/n,ok=k<n&&!RAIL_GAP(x,z)&&!(z>0&&hash(Math.floor(x/7),3)<.22);   // (the low rail is broken in places)
    if(ok&&s0===null)s0=x;if(!ok&&s0!==null){KIT.rail(s0,z,x,z,deckY(z));COAM.push([s0,z,x,z,-1]);s0=null;}}}
// across the ends (the stern doors' gaps)
both(s=>{const x=SHIP_X*s-.15*s;const segs=[[ZN,-.2],[3.4,ZS]];for(const [a,b] of segs){const m=Math.ceil(b-a);for(let j=0;j<m;j++){const za=a+(b-a)*j/m,zb=a+(b-a)*(j+1)/m;KIT.rail(x,za,x,zb,Math.min(deckY(za),deckY(zb)));COAM.push([x,za,x,zb,-1]);}}});

/* ---------- on deck: the cranes, containers slid against the low rail ---------- */
const DECK_CONT=[];   // {x,s,ry,n}
both(s=>{KIT.post(12.5*s,SW(-2,VD).z,1.2,deckY(SW(-2,VD).z)-.3,4.4);
  for(const [x,sv,ry,n] of[[-33.5,6.4,0,1],[-25,7.2,.05,1],[-16,6.8,-.06,2],[-12.5,2.6,.4,1],[-10,7,0,1],[-23,-6.6,0,1]]){const X=x*s,ZC=SW(sv,VD).z;
    for(let k=0;k<n;k++){const yb=deckY(ZC)+k*2.6/CP;const bx=[X-3*Math.cos(ry),X+3*Math.cos(ry)];
      KIT.block({cx:X,cz:ZC,ry:ry*s,l:6,w:2.5},deckY(ZC+1.5)-.15+k*2.77,deckY(ZC-1.5)+(k+1)*2.77,{top:false});}
    KIT.deck(X,ZC,ry*s,6,2.5,deckY(ZC)+n*2.77,0,-TP);DECK_CONT.push({x:X,sv,ry:ry*s,n});}});

/* ---------- on the sand: the containers that went over the side, stacked, scattered, two open at the ends ---------- */
const SAND_CONT=[];   // {x,z,ry,n,open,tilt}
both(s=>{for(const [x,z,ry,n,open,tilt] of[
    [-42,-16,.5,1],[-31,-14.5,-.2,2],[-20,-22,1.2,1,true],[-8,-15.2,.15,1],[-26,-30,.3,1],[-38,-27,-.6,2],[-12,-28,.9,1],[-3.5,-23,1.57,1],[-46,-30,.1,1],
    [-40,14,-.35,1],[-30,22.5,.4,1,true],[-17,14.2,-.1,1],[-11,24,.8,1,false,.18],[-36,28,1.3,1],[-21,29,-.4,1,false,-.15],[-6.5,15.5,1.3,1],[-45,21,.2,2]]){
    const X=x*s,RY=ry*s,F=KIT.frame(X,z,RY),P=[F.at(-3,-1.25),F.at(3,-1.25),F.at(3,1.25),F.at(-3,1.25)],g=Math.min(...P.map(p=>sandH(p[0],p[1]))),gm=Math.max(...P.map(p=>sandH(p[0],p[1])));
    if(open){// an open box: two long walls and its roof, both ends gone: run through it
      for(const b of[-1.18,1.18]){const a=F.at(-3,b),c=F.at(3,b);KIT.wall(a[0],a[1],c[0],c[1],g-.3,gm+2.6,.15);}
      KIT.deck(X,z,RY,6,2.5,gm+2.6,0,0,{});
      // its floor: a plate over the sand
      KIT.deck(X,z,RY,6,2.3,gm+.12,0,0,{los:false});}
    else KIT.block({cx:X,cz:z,ry:RY,l:6,w:2.5},g-.3,gm+2.6*n-.25*(tilt?1:0));
    SAND_CONT.push({x:X,z,ry:RY,n,open:!!open,tilt:(tilt||0),g,gm});}});
// driftwood, hull plates, crates, barrels
const DEBRIS=[];
both(s=>{for(const [x,z,l,w,h,ry] of[[-34,-11.5,2.6,.5,1,.3],[-27,12.5,1.2,1.2,1,0],[-14,11.5,3.4,.4,1.2,1.4],[-49,9,1.2,1.2,1.1,.4],[-8,-12,1.1,1.1,1,.7],[-44,-6,2.4,.6,1,.9],[-28,17,1.4,1.4,1.2,.2],[-2,20.5,2.8,.5,.9,.6]]){
  const X=x*s,g=sandH(X,z);KIT.block({cx:X,cz:z,ry:ry*s,l,w},g-.3,g+h);DEBRIS.push({x:X,z,l,w,h,ry:ry*s,g});}
  for(const [x,z] of[[-36,-20],[-18,-22],[-26,16],[-9,27]])KIT.post(x*s,z,.4,sandH(x*s,z),1);});

/* ---------- materials ---------- */
const SUN=new THREE.Vector3(.12,.26,1).normalize();
const FR_ENV=KIT.env((x,y,z)=>{const hz=1-Math.abs(y),sk=[.42+.2*hz,.48+.14*hz,.6-.04*hz];const sd=Math.max(0,x*SUN.x+y*SUN.y+z*SUN.z);sk[0]+=Math.pow(sd,6)*.8;sk[1]+=Math.pow(sd,6)*.55;sk[2]+=Math.pow(sd,6)*.25;
  if(y<0){return[.55,.45,.32].map(v=>v*(.7+.3*(1+y)));}return sk;});
const sandT=KIT.tex('sand',true),sandN=KIT.tex('sand-n');
const sandMat=new THREE.MeshStandardMaterial({vertexColors:true,map:sandT,normalMap:sandN,normalScale:new THREE.Vector2(.8,.8),roughness:.95,metalness:0});
const rustT=KIT.tex('metal020',true),rustN=KIT.tex('metal020-n'),m015=KIT.tex('metal015',true),m015n=KIT.tex('metal015-n');
const hullMat=new THREE.MeshStandardMaterial({vertexColors:true,map:rustT,normalMap:rustN,roughness:.62,metalness:.45,envMap:FR_ENV,envMapIntensity:.7});
const deckMat=new THREE.MeshStandardMaterial({vertexColors:true,map:m015,normalMap:m015n,roughness:.55,metalness:.5,envMap:FR_ENV,envMapIntensity:.7});
const paintMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.3,envMap:FR_ENV,envMapIntensity:.6});
const corrT=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');for(let x=0;x<256;x++){const v=150+70*Math.sin(x/256*Math.PI*20);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,0,1,256);}
  for(let i=0;i<220;i++){g.fillStyle=`rgba(${90+Math.random()*50|0},${50+Math.random()*30|0},${20},${Math.random()*.3})`;g.fillRect(Math.random()*256,Math.random()*256,2+Math.random()*5,10+Math.random()*90);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;return t;})();
const contMat=new THREE.MeshStandardMaterial({vertexColors:true,map:corrT,roughness:.5,metalness:.55,envMap:FR_ENV,envMapIntensity:.7,side:THREE.DoubleSide});
const woodMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,metalness:0});
stoneMat=paintMat;
const K_HULL=C(0x2c3a4a),K_BOOT=C(0x8a2a22),K_DECK=C(0x8a8478),K_WHITE=C(0xe4e0d4),K_YEL=C(0xd8a630),K_DARK=C(0x2a2c30);
const CC=[0xc0442e,0x2a6ab0,0x2a8a5a,0xd88a2a,0x7a7a82,0x8a2a6a,0x3ab0b0].map(C);

/* ---------- the ship, drawn in her own frame (a group rolled PHI about x): hull, deck, holds, coamings, cranes, deck containers ---------- */
const SHIPG=new THREE.Group();SHIPG.position.set(0,Y0,0);SHIPG.rotation.x=PHI;SHIPG.userData.dyn=1;scene.add(SHIPG);
const SB_M=new Map(),sm=mat=>{let m=SB_M.get(mat);if(!m){m=new Merger();SB_M.set(mat,m);}return m;};
{const H=sm(hullMat),D=sm(deckMat),Pm=sm(paintMat);
 // the hull's sides (the black topsides, the red boot top under them), the transoms, the bottom; a bow flare's worth of shape at the ends
 for(const s of[-BEAM,BEAM]){H.add(boxUV(SHIP_X*2,VD-VK-3.5,.3,3),M(0,VK+3.5+(VD-VK-3.5)/2,s),K_HULL);H.add(boxUV(SHIP_X*2,3.5,.3,3),M(0,VK+1.75,s),K_BOOT);Pm.add(boxUV(SHIP_X*2+.02,.2,.34,1),M(0,VD-.6,s),K_WHITE);}
 for(const x of[-SHIP_X,SHIP_X])H.add(boxUV(.3,VD-VK,BEAM*2,3),M(x,(VD+VK)/2,0),K_HULL);
 H.add(boxUV(SHIP_X*2,.3,BEAM*2,3),M(0,VK,0),K_BOOT);
 // the deck plating (the holds' hatches left open)
 const dp=(x0,x1,s0,s1)=>D.add(boxUV(x1-x0,.25,s1-s0,3),M((x0+x1)/2,VD-.12,(s0+s1)/2),K_DECK);
 dp(-SHIP_X,-31,-BEAM,BEAM);dp(-19,-6,-BEAM,BEAM);dp(6,19,-BEAM,BEAM);dp(31,SHIP_X,-BEAM,BEAM);
 HOLDS.forEach(([h0,h1],i)=>{const [c0,c1]=HATCH[i];dp(h0,h1,-BEAM,-HS);dp(h0,h1,HS,BEAM);dp(h0,c0,-HS,HS);dp(c1,h1,-HS,HS);
   // inside: the floor, the sides, the bulkheads, the ribs; darker
   D.add(boxUV(h1-h0,.25,BEAM*2-1.2,3),M((h0+h1)/2,VF-.12,0),C(0x6a645a));for(const s of[-BEAM+.62,BEAM-.62])H.add(boxUV(h1-h0,VD-VF,.06,3),M((h0+h1)/2,(VD+VF)/2,s),C(0x5a4038));
   for(const x of[h0+.02,h1-.02])H.add(boxUV(.06,VD-VF,BEAM*2-1.2,3),M(x,(VD+VF)/2,0),C(0x5a4a40));
   for(let x=h0+1.5;x<h1;x+=1.5)for(const s of[-BEAM+.75,BEAM-.75])H.add(boxUV(.18,VD-VF,.3,1),M(x,(VD+VF)/2,s),C(0x3a3430));
   // the coaming, yellow
   for(const s of[-HS,HS])Pm.add(boxUV(c1-c0+.3,.9,.3,1),M((c0+c1)/2,VD+.45,s),K_YEL);for(const x of[c0,c1])Pm.add(boxUV(.3,.9,HS*2,1),M(x,VD+.45,0),K_YEL);});
 // the tear in the middle hold's side: the hole, the plate edges bent out and down
 for(let k=0;k<12;k++){const x=lerp(BREACH[0]-.6,BREACH[1]+.6,k/11),hh=R(.8,2);H.add(boxUV(R(.4,.9),hh,.25,1),M(x,VF+2.8+hh/2-R(0,.6),BEAM+.15,R(-.3,.3),0,R(-.4,.4)),K_HULL);}
 // the ship's name, both sides at both ends
 for(const [x,s,ry] of[[-24,BEAM+.17,0],[24,BEAM+.17,0],[-24,-BEAM-.17,Math.PI],[24,-BEAM-.17,Math.PI]]){const t=KIT.neonTex('KEEPER TIDEWARD',0xe8e4d8,{w:512,h:72,frame:false,bg:'rgba(0,0,0,0)',size:44});
   const m=new THREE.Mesh(new THREE.PlaneGeometry(9,1.3),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.7}));m.position.set(x,VD-1.6,s);m.rotation.y=ry;m.userData.dyn=1;SHIPG.add(m);}
 // the deck cranes: pedestal, cab, jib swung out over the low side
 for(const s of[1,-1]){const x=12.5*s;Pm.add(new THREE.CylinderGeometry(1.2,1.4,4.4,16),M(x,VD+2.2,-2),K_YEL);Pm.add(boxUV(3,2.4,3,1),M(x,VD+5.6,-2),K_WHITE);
   Pm.add(boxUV(1,1,14,1),M(x,VD+6.5,4.5,-.35,0,0),K_YEL);Pm.add(new THREE.CylinderGeometry(.04,.04,6,4),M(x,VD+5.5,10.8),K_DARK);}
 // the stern doors at both ends, let down onto the sand (drawn in the world below), their hinges here
 for(const x of[-SHIP_X,SHIP_X])Pm.add(boxUV(.6,.6,3.6,1),M(x,VD-.2,SW(1.6,VD).z),K_DARK);
 // deck containers
 for(const C0 of DECK_CONT){const sv=C0.sv,local=new THREE.Vector3(C0.x,VD,sv);for(let k=0;k<C0.n;k++){const col=CC[(hash(C0.x*3|0,k+sv|0)*CC.length)|0];
   sm(contMat).add(boxUV(6,2.55,2.45,3),M(C0.x,VD+1.3+k*2.6,sv,0,C0.ry,0),col);}}
 for(const [mat,m] of SB_M){const mesh=new THREE.Mesh(m.build(),mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.dyn=1;SHIPG.add(mesh);}}
// in the world: the stairs and ladders, the stern doors (ramps), the rails, the hold stairs
for(const R of KIT.PAIRS){const ry=Math.atan2(-R.uz,R.ux),mx=R.P0[0]+R.ux*R.L/2,mz=R.P0[1]+R.uz*R.L/2,ym=(R.yA+R.yB)/2,pitch=Math.atan2(R.yB-R.yA,R.L),hl=Math.hypot(R.L,R.yB-R.yA);
  const door=R.w>2.9,breach=R.w>5;
  if(breach){KIT.mg(hullMat).add(boxUV(hl,.25,R.w,3),M(mx,ym-.1,mz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_HULL);continue;}
  if(door){KIT.mg(deckMat).add(boxUV(hl,.4,R.w+.4,3),M(mx,ym-.2,mz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_DARK);for(let k=0;k<Math.floor(hl/1.2);k++){const a=(k+.5)*1.2/hl*R.L,y=R.hAt(a);KIT.mg(paintMat).add(boxUV(.12,.08,R.w,1),M(R.P0[0]+R.ux*a,y+.02,R.P0[1]+R.uz*a,0,ry,0),K_YEL);}}
  else{const n=Math.max(3,Math.round(Math.abs(R.yB-R.yA)/.24));for(let k=0;k<n;k++){const a=(k+.5)/n*R.L,y=R.hAt(a);KIT.mg(deckMat).add(boxUV(R.L/n+.02,.06,R.w-.1,1),M(R.P0[0]+R.ux*a,y-.03,R.P0[1]+R.uz*a,0,ry,0),C(0x9aa2ac));}}
  for(const s of[-1,1]){const ox=R.nx*s*(R.w/2-.05),oz=R.nz*s*(R.w/2-.05);KIT.mg(paintMat).add(boxUV(hl,.3,.07,1),M(mx+ox,ym-.18,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_DARK);
    KIT.mg(paintMat).add(boxUV(hl,.05,.05,1),M(mx+ox,ym+1,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_WHITE);
    for(let k=0;k<=Math.floor(R.L/1.5);k++){const a=Math.min(R.L,k*1.5),y=R.hAt(a);KIT.mg(paintMat).add(boxUV(.05,1,.05,1),M(R.P0[0]+R.ux*a+ox,y+.5,R.P0[1]+R.uz*a+oz),K_DARK);}}}
for(const [ax,az,bx,bz,h] of COAM){if(h>0)continue;const L=Math.hypot(bx-ax,bz-az),ry=Math.atan2(-(bz-az),bx-ax),ya=deckY(az),yb=deckY(bz),pitch=Math.atan2(yb-ya,L);
  KIT.mg(paintMat).add(boxUV(L,.06,.06,1),M((ax+bx)/2,(ya+yb)/2+1.02,(az+bz)/2,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_WHITE);
  for(let x=0;x<=L;x+=1.5){const px=ax+(bx-ax)*x/L,pz=az+(bz-az)*x/L;KIT.mg(paintMat).add(boxUV(.06,1.05,.06,1),M(px,deckY(pz)+.5,pz),K_DARK);}}
// sand containers (some sunk at an angle), debris, barrels
for(const S of SAND_CONT){const col=CC[(hash(S.x*7|0,S.z*3|0)*CC.length)|0];for(let k=0;k<S.n;k++){const y=S.g+1.25+k*2.6;
    if(S.open){const g=new THREE.Group();const mk=(geo,m)=>{const o=new THREE.Mesh(geo,contMat);o.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(o.geometry.attributes.position.count).fill([col.r,col.g,col.b]).flat(),3));o.applyMatrix4(m);o.castShadow=o.receiveShadow=true;o.userData.dyn=1;g.add(o);};
      for(const b of[-1.2,1.2])mk(boxUV(6,2.6,.08,3),M(0,1.3,b));mk(boxUV(6,.08,2.5,3),M(0,2.6,0));mk(boxUV(6,.08,2.5,3),M(0,.1,0));g.position.set(S.x,S.gm,S.z);g.rotation.y=S.ry;g.userData.dyn=1;scene.add(g);}
    else KIT.mg(contMat).add(boxUV(6,2.55,2.45,3),M(S.x,y+(S.gm-S.g)*.5-(S.tilt?.4:0),S.z,S.tilt,S.ry,0).multiply(M(0,0,0,0,0,(S.tilt?S.tilt*.6:0))),col);}}
for(const D of DEBRIS)KIT.mg(D.l>2?woodMat:paintMat).add(boxUV(D.l,D.h,D.w,1),M(D.x,D.g+D.h/2-.1,D.z,0,D.ry,0),D.l>2?C(0x8a7458):C(0x6a5a40));
for(const o of OBST)if(o.r<.5&&o.h<1.5)KIT.mg(paintMat).add(new THREE.CylinderGeometry(o.r,o.r,o.h,12),M(o.x,o.y0+o.h/2,o.z,.1,0,.08),C(hash(o.x|0,o.z|0)<.5?0x2a6a9a:0xb8502a));
// the camps: a ring of the side's light on the sand, a tarp shelter, crates
for(const B of GS.BASES){const TC=C(GS.TEAMS[B.team].c).multiplyScalar(2.2),y=sandH(B.x,B.z);KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(B.r-.3,B.r,48).rotateX(-Math.PI/2),M(B.x,y+.04,B.z),TC);
  KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(2.6,3,3).rotateX(-Math.PI/2),M(B.x,y+.05,B.z,0,B.fx>0?-Math.PI/2:Math.PI/2,0),TC);
  const sx=B.x-B.fx*5.5;for(const dz of[-3,3])KIT.mg(paintMat).add(new THREE.CylinderGeometry(.06,.06,3,6),M(sx,y+1.5,B.z+dz),K_DARK);
  KIT.mg(paintMat).add(new THREE.PlaneGeometry(4,7).rotateX(-Math.PI/2).rotateZ(.2*B.fx),M(sx,y+3,B.z),tmpC.copy(C(GS.TEAMS[B.team].c)).multiplyScalar(.7).clone());}

/* ---------- the ground: sand, wet and dark toward the sea, beach grass on the dunes ---------- */
{const S=170,N=coarse?130:200,g=new THREE.PlaneGeometry(S,S*.7,N,Math.round(N*.7)).rotateX(-Math.PI/2),P=g.attributes.position,U=g.attributes.uv,cols=[],c=new THREE.Color();
 const DRY=C(0xe6cfa4),DUNE=C(0xd8bc8a),WET=C(0x8a7458),GRASSY=C(0xa8a070);
 for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i);let h=sandH(x,z);if(inFoot(x,z))h=Math.min(h,SW(BEAM,VK).y+1);P.setY(i,h);U.setXY(i,x/6,z/6);
   c.copy(DRY).lerp(DUNE,sstep(-6,-20,z)*.6).lerp(WET,sstep(14,24,z)).lerp(GRASSY,sstep(-14,-24,z)*sstep(.45,.7,fbm(x*.1,z*.1))*.6);cols.push(c.r,c.g,c.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();const m=new THREE.Mesh(g,sandMat);m.receiveShadow=true;m.userData.dyn=1;scene.add(m);
 // grass tufts on the dunes (instanced)
 const blade=(()=>{const mg=new Merger(),W=C(0xffffff);for(let k=0;k<6;k++){const a=k/6*Math.PI*2,gg=new THREE.PlaneGeometry(.08,.9).translate(0,.45,0);mg.add(gg,M(0,0,0,R(-.4,.4),a,R(-.3,.3)),W);}return mg.build();})();
 const pts=[];for(let k=0;k<(coarse?500:1400);k++){const x=R(-62,62),z=R(-36,-12);if(inFoot(x,z)||KIT.PAIRS.some(R2=>{const q=R2.loc(x,z);return q[0]>-1&&q[0]<R2.L+1&&Math.abs(q[1])<R2.w;}))continue;if(fbm(x*.1,z*.1)<.45)continue;pts.push([x,z]);}
 const im=new THREE.InstancedMesh(blade,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,side:THREE.DoubleSide}),pts.length),d=new THREE.Object3D(),col=new THREE.Color();
 pts.forEach((p,i)=>{d.position.set(p[0],sandH(p[0],p[1])-.05,p[1]);d.rotation.set(0,R(0,6),0);d.scale.setScalar(R(.7,1.4));d.updateMatrix();im.setMatrixAt(i,d.matrix);im.setColorAt(i,col.set(0x9a9858).convertSRGBToLinear().multiplyScalar(R(.7,1.1)));});
 im.userData.dyn=1;im.frustumCulled=false;scene.add(im);}

/* ---------- the sea: waves running up the beach, foam at the edge, the sun's glitter ---------- */
const FR_SEA=(()=>{const g=new THREE.PlaneGeometry(9000,9000,1,1).rotateX(-Math.PI/2);
  const U={uT:{value:0},sun:{value:SUN},haze:{value:C(HAZE_HEX)},env:{value:FR_ENV}};
  const mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`varying vec3 vW;varying float vD;uniform float uT;uniform vec3 sun,haze;uniform samplerCube env;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float W(vec2 p){return n(p*.18+vec2(0.0,uT*.18))+n(p*.5+vec2(uT*.1,uT*.3))*.5+n(p*1.4-uT*.4)*.25;}
      void main(){vec2 p=vW.xz;float e=.2,w=W(p);vec3 N=normalize(vec3((w-W(p+vec2(e,0.0)))*2.2,1.0,(w-W(p+vec2(0.0,e)))*2.2));
        vec3 V=normalize(cameraPosition-vW);float fr=.03+.97*pow(1.0-max(dot(N,V),0.0),5.0);vec3 refl=textureCube(env,reflect(-V,N)).rgb;
        vec3 deep=vec3(.04,.16,.2),shal=vec3(.16,.34,.32);float dist=vW.z-22.0;vec3 col=mix(shal,deep,smoothstep(0.0,40.0,dist));col=mix(col,refl,fr*.8);
        col+=vec3(1.0,.8,.55)*pow(max(dot(reflect(-sun,N),V),0.0),220.0)*3.0;
        // the surf: lines of foam running in toward the beach, and the wash at its edge
        float surf=sin(vW.z*.9-uT*1.6+n(p*.3)*3.0)*(.6+.4*n(p*.15+uT*.05));float foam=smoothstep(.9,1.0,surf)*smoothstep(25.0,2.0,dist)+smoothstep(3.5,-1.5,dist)*(.55+.45*n(p*2.0+uT));col=mix(col,vec3(.86,.86,.82),clamp(foam,0.0,1.0)*.5);
        float a=mix(.55,.95,smoothstep(-2.0,6.0,dist));
        float f=1.0-exp(-.0055*.0055*vD*vD);gl_FragColor=vec4(mix(col,haze,f),a);}`});
  const m=new THREE.Mesh(g,mat);m.position.y=-.05;m.renderOrder=1;m.userData.dyn=1;scene.add(m);return{U};})();

/* ---------- the far side: Elyra's coast round the bay, the sky ---------- */
{const FAR=VISTA.build({seed:41,center:{x:0,z:0},seaY:0,sun:SUN,haze:HAZE_HEX,rock:0x8a6a52,rock2:0x6a5a4e,green:0x6a7a44,sand:0xe0c898,snow:0xf4f2ee,dry:.5,
   massifs:[{a:2.6,r:2600,rad:1100,h:900,falls:1},{a:3.7,r:3000,rad:1300,h:1200},{a:.3,r:3800,rad:1600,h:1500,tower:true},{a:5.6,r:3400,rad:1300,h:1000}],
   islands:{n:coarse?5:9,r0:1500,r1:5200,h0:30,h1:140},coasts:[{a0:-1.4,a1:1.4,r:4200,depth:3000,h:1400},{a0:4.2,a1:5.1,r:5600,depth:2600,h:900}],skyline:{r:11000,h:180}});
 FAR.G.traverse(o=>{o.userData.dyn=1;});scene.add(FAR.G);CITY.ticks.push((dt,T)=>FAR.update&&FAR.update(T));
 const sky=new THREE.Group();const bc=document.createElement('canvas');bc.width=16;bc.height=256;{const g=bc.getContext('2d'),r=g.createLinearGradient(0,0,0,256);r.addColorStop(0,'#3a5a8a');r.addColorStop(.38,'#9ab4cc');r.addColorStop(.48,'#f0c89a');r.addColorStop(.5,'#e8b88a');r.addColorStop(1,'#806048');g.fillStyle=r;g.fillRect(0,0,16,256);}
 const bt=new THREE.CanvasTexture(bc);bt.encoding=THREE.sRGBEncoding;SKIES.dome(sky,8000,'elyra',{base:bt,exp:.55});sky.traverse(o=>{o.userData.dyn=1;});scene.add(sky);CITY.skies.push(sky);
 // the sun, low over the sea
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xfff0d0).multiplyScalar(4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));sp.position.copy(SUN).multiplyScalar(7000);sp.scale.setScalar(700);sky.add(sp);
 const sp2=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffb070).multiplyScalar(1.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));sp2.position.copy(sp.position);sp2.scale.setScalar(2600);sky.add(sp2);}

/* ---------- light: the low sun, the sky's fill, the sand's bounce ---------- */
hemi.color.copy(C(0x9ab4d8));hemi.groundColor.copy(C(0xc8a070));hemi.intensity=.85;
keyLight.color.copy(C(0xffc890));keyLight.intensity=2.3;keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(keyLight.shadow.camera,{left:-75,right:75,top:60,bottom:-60,near:10,far:500});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.06;
keyLight.position.copy(SUN).multiplyScalar(220);keyLight.target.position.set(0,0,0);
for(const B of GS.BASES){const L=new THREE.PointLight(C(GS.TEAMS[B.team].c),1.2,18,1.6);L.position.set(B.x,sandH(B.x,B.z)+3,B.z);scene.add(L);}
if(BLOOM){BLOOM.strength=.35;BLOOM.threshold=.9;}

/* ---------- the sounds: the surf, the wind, gulls, the hull groaning ---------- */
const FR_SND=KIT.sound([{f:[['lowpass',700]],v:.16,swell:.6,rate:.45},{f:[['highpass',900],['lowpass',3000]],v:.04,swell:.5,rate:.13}]);
{let g=R(6,12),c=R(20,40);CITY.ticks.push(dt=>{g-=dt;c-=dt;if(g<=0){g=R(8,20);const f=R(1400,2200);FR_SND.tone(f,f*.7,.35,.02,'triangle');setTimeout(()=>FR_SND.tone(f*.95,f*.6,.4,.018,'triangle'),380);}
  if(c<=0){c=R(25,50);FR_SND.tone(R(40,60),R(28,40),3,.08,'sawtooth');}});}
// the shallows slow you
{const prev=new Map(),slow=(o,p)=>{const q=prev.get(o);if(q&&p.z>22&&sandH(p.x,p.z)<.1&&p.y<.5){const k=clamp(.55+sandH(p.x,p.z)*1.5,.4,1);p.x=q.x+(p.x-q.x)*k;p.z=q.z+(p.z-q.z)*k;}prev.set(o,{x:p.x,z:p.z});};
 CITY.ticks.push(()=>{if(typeof P!=='undefined'&&P.pos)slow(P,P.pos);if(typeof BOTS!=='undefined')for(const B of BOTS)slow(B,B.pos);});}
CITY.ticks.push((dt,T)=>{FR_SEA.U.uT.value=T;});
// spray and sand blowing along the beach
dust.material.color.copy(C(0xf0dcb8));dust.material.size=.05;dust.material.opacity=.5;
GS.indoorAt=()=>{const c=camera.position;for(const [h0,h1] of HOLDS)if(c.x>h0&&c.x<h1&&c.z>SW(-BEAM,VF).z&&c.z<SW(BEAM,VF).z&&c.y<deckY(c.z)-.4&&c.y>floorYh(c.z)-1)return 1;return 0;};

KIT.flush();

/* ---------- the bots' map ---------- */
const NAV=KIT.nav({step:2.2,perchY:4});
GS.HILLS=[{x:0,z:2},{x:-12.5,z:0},{x:12.5,z:0},{x:-25,z:1},{x:25,z:1},{x:0,z:14},{x:-20,z:-20},{x:20,z:-20},{x:-30,z:20},{x:30,z:20},{x:-14,z:-14},{x:14,z:-14}];
GS.RACKS=[{x:-6,z:-17},{x:6,z:18}];
GS.INTRO=[[[-58,14,24],[-20,6,2]],[[-30,12,-6],[0,7,4]],[[0,6,16],[0,3,2]],[[30,14,-22],[52,3,1]]];
