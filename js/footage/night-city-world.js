/* Elyra · Recovered Footage 08 · Night Market — the city round the market (Nov 17 2026, Bryce: "copy that map … over and then for
   each section I wanna have something else … the lower grounds of the city … go up or down with staircases or elevators … more of an
   open exploration map like Halo 3: ODST"; then "make it 8ish"). Midnight Market (js/mp/market-world.js, loaded first) stays in the
   middle, roofs on top and the covered street under them; round it, about eight times its ground, four districts:

     THE LOWER STREETS (west)   ordinary Tide City at street level: blocks of shops and flats, avenues, a square with a fountain,
                                cars left where the battle caught them
     THE PLAZA (east)           the open square that faces the Spear: the Keepers' monument, planters, barricades, a Keeper dropship
                                down on its side and still burning
     THE DOCKS (south)          the old waterfront, 9 m under the city: quays, warehouses, container stacks, cranes, piers over black
                                water. Down by two broad stairs off the promenade, or the freight lift
     THE HEIGHTS (north)        two terraces of flats over the avenue, at 6 m and 12 m, up by stairs or the lift tower, whose top
                                crosses a skywalk to the upper terrace; its east end is a lookout toward the Spear
   A promenade along the seawall and an avenue under the terrace wall join them all round the market. The bases' roofs at each end of
   the market get a broad stair down to the city (NIGHT_CITY.preRamps, called by the market file before it lays its parapets).

   Levels are the ground itself (CITY.ground): the docks at -9, the terraces at 6 and 12, the stairs between them slopes, so the
   Hollow walk them too. Walls stand along every drop. The lifts are floors that move (a surf whose height is the cabin's).
   Rain and fog close the view at about 100 m: the phone draws what's near, the rest of Tide City is towers on the skyline. Units are
   metres; north is -z; the Spear is far to the east. */
window.NIGHT_CITY=window.NIGHT_CITY||{};
const NC=(()=>{
const inR=(r,x,z,m)=>{m=m||0;return x>=r[0]-m&&x<=r[1]+m&&z>=r[2]-m&&z<=r[3]+m;};
const MARKET=[-58,58,-38,38],MK_GROUND=CITY.ground;
const rnd=(()=>{let a=81723;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();
const RR=(a,b)=>a+rnd()*(b-a);

/* ---------- the plan: where you can walk, how high the ground is ---------- */
const WALK=[[-178,170,-74,50],[-178,170,50,88],[-150,110,-130,-74],
  [-152,-140,88,110],[-40,-28,88,110],[60,72,88,110],[150,162,88,110]];   // the city, the quays, the terraces, the four piers
// stairs as slopes: [rect, z where it starts, z where it ends, y there, y here]
const SLOPES=[[[-128,-120,50,72],50,72,0,-9],[[96,104,50,72],50,72,0,-9],
  [[-92,-84,-86,-74],-74,-86,0,6],[[34,42,-86,-74],-74,-86,0,6],
  [[-34,-26,-112,-100],-100,-112,6,12],[[76,84,-112,-100],-100,-112,6,12]];
const LIFTS=[
  {name:'freight lift',r:[-14,-10,50,54],yb:-9,yt:0,top:3},     // the promenade down to the docks: in from the quay (south), out north
  {name:'lift tower',r:[-2,2,-80,-74],yb:0,yt:12,top:4}];       // the avenue up to the skywalk: in from the avenue (south), out north
for(const L of LIFTS){L.y=L.yb;L.target=null;L.wait=0;L.rider=false;L.lid=true;}
function ground(x,z){
  if(inR(MARKET,x,z))return MK_GROUND(x,z);
  for(const L of LIFTS)if(inR(L.r,x,z))return L.yb;
  for(const [r,z0,z1,y0,y1] of SLOPES)if(inR(r,x,z))return y0+(y1-y0)*clamp((z-z0)/(z1-z0),0,1);
  if(z>50)return -9;
  if(x>=-150&&x<=110){if(z<-100)return 12;if(z<-74)return 6;}
  return 0;}
const sdR=(r,x,z)=>{const dx=Math.max(r[0]-x,x-r[1]),dz=Math.max(r[2]-z,z-r[3]);return dx>0||dz>0?Math.hypot(Math.max(dx,0),Math.max(dz,0)):Math.max(dx,dz);};
CITY.ground=ground;
CITY.edge=(x,z)=>{let d=1e9;for(const r of WALK)d=Math.min(d,sdR(r,x,z));return d+.4;};
CITY.box=[-178,-130,170,110];CITY.hilly=true;
scene.fog.density=.0145;

/* ---------- materials of its own (the rest are the market's: facades, shopfronts, paving, roofs, steel) ---------- */
const concMat=new THREE.MeshStandardMaterial({vertexColors:true,map:KIT.tex('rock',true),normalMap:KIT.tex('rock-n'),roughness:.92,metalness:.12,envMap:MK_ENV,envMapIntensity:.5});
const rustMat=new THREE.MeshStandardMaterial({vertexColors:true,map:KIT.tex('metal020',true),normalMap:KIT.tex('metal020-n'),roughness:.7,metalness:.6,envMap:MK_ENV,envMapIntensity:.7});
const waterMat=new THREE.MeshStandardMaterial({color:C(0x03060c),roughness:.12,metalness:.95,envMap:MK_ENV,envMapIntensity:1.4});
const CONC=C(0x6a6e78),DARK=C(0x3a3d46);

/* ---------- helpers: a building (any base height), a wall that is also a collision, the ground's planes ---------- */
function bld(r,y0,h,o){o=o||{};const [x0,x1,z0,z1]=r,uo=hash(x0*3|0,z0*5|0)*4|0,col=o.col||K_CONC[(hash(x0|0,z1|0)*K_CONC.length)|0];
  for(const [ax,az,bx,bz] of[[x1,z0,x0,z0],[x0,z1,x1,z1],[x0,z0,x0,z1],[x1,z1,x1,z0]]){const L=Math.hypot(bx-ax,bz-az);
    if(o.shops){facePlane(ax,az,bx,bz,y0,y0+3.4,shopMat,C(0xffffff),uo*.25,L>9?8:L);facePlane(ax,az,bx,bz,y0+3.4,y0+h,facMat,col,uo*.5,8);}
    else facePlane(ax,az,bx,bz,y0,y0+h,facMat,col,uo*.5,8);}
  const w=x1-x0,d=z1-z0;KIT.mg(trimMat).add(boxUV(w+.3,.35,d+.3,2),M((x0+x1)/2,y0+h-.2,(z0+z1)/2),K_TRIM);
  if(o.shops)KIT.mg(trimMat).add(boxUV(w+.5,.25,d+.5,2),M((x0+x1)/2,y0+3.5,(z0+z1)/2),C(0x1c1e26));
  KIT.mg(roofMat,{shadow:false}).add(roofPlane(w,d),M((x0+x1)/2,y0+h+.01,(z0+z1)/2),C(0xffffff));
  if(!o.far)KIT.block(r,y0-.3,y0+h);
  // now and then a neon sign down a corner
  if(o.neon&&rnd()<o.neon){const col2=NEON[(rnd()*NEON.length)|0],t=KIT.neonTex(KIT.glyphWord(4,(x0*7+z0)|0),col2,{w:96,h:384,size:52}),
    mat=new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(1.6,1.6,1.6),side:THREE.DoubleSide}),m=new THREE.Mesh(new THREE.PlaneGeometry(1.6,6.4),mat);
    const side=rnd()<.5;m.position.set(side?x0-.15:x1+.15,y0+Math.min(h-4,RR(6,10)),z0+RR(2,d-2));m.rotation.y=Math.PI/2;m.userData.dyn=1;scene.add(m);}}
function wallV(ax,az,bx,bz,y0,y1,th,col,mat){const L=Math.hypot(bx-ax,bz-az);if(L<.05)return;const ry=Math.atan2(-(bz-az),bx-ax);
  KIT.mg(mat||concMat).add(boxUV(L,y1-y0,th,4),M((ax+bx)/2,(y0+y1)/2,(az+bz)/2,0,ry,0),col||CONC);KIT.wall(ax,az,bx,bz,y0,y1,th);}
// a wall along x (at z) from x0 to x1, leaving the gaps [[a,b],...]
function wallX(z,x0,x1,gaps,y0,y1,th,col){let cur=x0;for(const [a,b] of gaps.slice().sort((p,q)=>p[0]-q[0])){if(a>cur)wallV(cur,z,a,z,y0,y1,th,col);cur=Math.max(cur,b);}if(x1>cur)wallV(cur,z,x1,z,y0,y1,th,col);}
function plane(r,y,mat,unit){const [x0,x1,z0,z1]=r,w=x1-x0,d=z1-z0,g=new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),U=g.attributes.uv;
  for(let i=0;i<U.count;i++)U.setXY(i,U.getX(i)*w/(unit||7),U.getY(i)*d/(unit||7));KIT.mg(mat,{shadow:false}).add(g,M((x0+x1)/2,y,(z0+z1)/2),C(0xffffff));}
// a stair drawn on a slope: a step every 0.3 m of rise, a rail down each side
function steps([r,z0,z1,y0,y1]){const n=Math.round(Math.abs(y1-y0)/.3),[x0,x1]=r,dz=(z1-z0)/n;
  for(let k=0;k<n;k++){const za=z0+dz*k,y=y0+(y1-y0)*(k+.5)/n;KIT.mg(concMat).add(boxUV(x1-x0,.3,Math.abs(dz)+.02,2),M((x0+x1)/2,y-.15+(y1>y0?.15:.15),za+dz/2),C(0x80848e));}
  for(const x of[x0+.15,x1-.15])rod([x,y0+1,z0],[x,y1+1,z1],.04,metalMat,K_TRIM);}
const clearOf=(x,z)=>!SLOPES.some(S=>inR(S[0],x,z,1.5))&&!LIFTS.some(L=>inR(L.r,x,z,1.5));
const lampAt=(x,y,z,col)=>{if(!clearOf(x,z))return;KIT.mg(metalMat).add(new THREE.CylinderGeometry(.08,.12,5,8),M(x,y+2.5,z),K_TRIM);
  KIT.mg(KIT.lampMat).add(boxUV(.7,.12,.3,1),M(x,y+5,z),C(col||0xffd9a0).multiplyScalar(2.2));KIT.post(x,z,.14,y,5,false);};
// cover: a crate stack, a barrier, a car left in the street
const crate=(x,y,z,s,h)=>{KIT.mg(metalMat).add(boxUV(s,h,s,1),M(x,y+h/2,z,0,rnd()*.5,0),C(0x6a5a44));KIT.block({cx:x,cz:z,ry:0,l:s*.95,w:s*.95},y-.1,y+h);};
const barrier=(x,y,z,ry)=>{KIT.mg(concMat).add(boxUV(3,1.05,.6,2),M(x,y+.52,z,0,ry,0),C(0x9a9890));KIT.block({cx:x,cz:z,ry,l:3,w:.6},y-.1,y+1.05);};
function car(x,y,z,ry,burnt){const g=new THREE.Group(),col=burnt?C(0x3a3632):C([0x6a8aaa,0xaa4a4a,0xd0d0d4,0x8a8c90,0x8a9a6a][(rnd()*5)|0]);
  KIT.mg(metalMat).add(boxUV(4.2,.8,1.9,1),M(x,y+.65,z,0,ry,0),col);KIT.mg(metalMat).add(boxUV(2.3,.65,1.7,1),M(x,y+1.35,z,0,ry,0).multiply(M(-.2,0,0)),burnt?col:C(0x1a2230));
  KIT.block({cx:x,cz:z,ry,l:4.2,w:1.9},y-.1,y+1.6);}
const containers=(x,y,z,ry,n)=>{for(let k=0;k<n;k++){const c=C([0x8a3a2a,0x2a5a8a,0x3a6a3a,0x9a7a2a,0x5a5a62][(rnd()*5)|0]);
  KIT.mg(rustMat).add(boxUV(6,2.6,2.5,3),M(x,y+1.3+k*2.6,z,0,ry,0),c);}KIT.block({cx:x,cz:z,ry,l:6,w:2.5},y-.1,y+2.6*n);};


/* ---------- the ground everywhere, the water, the walls along every drop ---------- */
plane([-178,170,-74,50],0,groundMat);
plane([-178,170,50,88],-9,groundMat);
plane([-150,110,-100,-74],6,groundMat);plane([-150,110,-130,-100],12,groundMat);
{const w=new THREE.Mesh(new THREE.PlaneGeometry(1400,700).rotateX(-Math.PI/2),waterMat);w.position.set(0,-11,440);w.userData.dyn=1;scene.add(w);
 // the quay's face down to the water, and the piers on their legs
 wallV(-178,88,170,88,-11.5,-9,.8,DARK);
 for(const [x0,x1,z0,z1] of WALK.slice(3)){KIT.mg(metalMat).add(boxUV(x1-x0,.35,z1-z0,2),M((x0+x1)/2,-9.17,(z0+z1)/2),C(0x5a4a3a));
   for(let z=z0+3;z<z1;z+=5)for(const x of[x0+.4,x1-.4])KIT.mg(metalMat).add(new THREE.CylinderGeometry(.22,.22,3,8),M(x,-10.5,z),K_RUST);
   for(const x of[x0+.2,x1-.2])KIT.rail(x,88,x,z1,-9);KIT.rail(x0,z1,x1,z1,-9);}}
for(const S of SLOPES){const [r,z0,z1,y0,y1]=S;plane(r,Math.max(y0,y1)+.001,groundMat);steps(S);}
// the seawall: the promenade's edge over the docks, gaps for the two stairs and the freight lift
wallX(50,-178,170,[[-128,-120],[96,104],[-14,-10]],-9.3,1,.6);
for(const x of[-128,-120,96,104])wallV(x,50,x,72,-9.3,1,.4);
// the terraces: the lower wall over the avenue, the upper wall over the lower terrace, the sides of their stairs
wallX(-74,-150,110,[[-92,-84],[34,42],[-2,2]],-.3,7,.8);
for(const x of[-92,-84,34,42])wallV(x,-86,x,-74,-.3,7,.4);
wallX(-100,-150,110,[[-34,-26],[76,84],[-1.6,1.6]],5.7,13,.8);wallV(-1.6,-100,1.6,-100,5.7,11.95,.8);   // (the skywalk lands through its gap)
for(const x of[-34,-26,76,84])wallV(x,-112,x,-100,5.7,13,.4);
// the terraces' open ends: a rail
for(const x of[110,-150]){KIT.rail(x,-130,x,-100,12);KIT.rail(x,-100,x,-74,6);}

/* ---------- the lifts: a shaft, a cabin that carries you, a lid over the hole while the cabin's away ---------- */
for(const L of LIFTS){const [x0,x1,z0,z1]=L.r,box=[x0,z0,x1,z1],ins=(x,z)=>x>x0+.05&&x<x1-.05&&z>z0+.05&&z<z1-.05;
  s3Surf(ins,()=>L.y,box);s3Surf(ins,()=>L.lid?L.yt:-999,box);
  wallV(x0,z0,x0,z1,L.yb-.3,L.yt+L.top,.3,C(0x4a4e58),metalMat);wallV(x1,z0,x1,z1,L.yb-.3,L.yt+L.top,.3,C(0x4a4e58),metalMat);
  // the far end, closed up to the top door; the near end, closed over the bottom door
  wallV(x0,z0,x1,z0,L.yb-.3,L.yt-.15,.3,C(0x4a4e58),metalMat);wallV(x0,z0,x1,z0,L.yt+3,L.yt+L.top,.3,C(0x4a4e58),metalMat);
  wallV(x0,z1,x1,z1,L.yb+3,L.yt+L.top,.3,C(0x4a4e58),metalMat);
  const g=new THREE.Group();g.userData.dyn=1;scene.add(g);L.g=g;
  g.add(new THREE.Mesh(boxUV(x1-x0-.2,.25,z1-z0-.2,1),metalMat));g.children[0].position.set((x0+x1)/2,-.13,(z0+z1)/2);g.children[0].material=new THREE.MeshStandardMaterial({color:0x5a606c,roughness:.4,metalness:.7});
  const strip=new THREE.Mesh(new THREE.BoxGeometry(x1-x0-.3,.05,.1),new THREE.MeshBasicMaterial({color:C(0xffc860).multiplyScalar(2),toneMapped:false}));strip.position.set((x0+x1)/2,2.6,z0+.25);g.add(strip);
  for(const [x,z] of[[x0+.1,z0+.1],[x1-.1,z0+.1],[x0+.1,z1-.1],[x1-.1,z1-.1]]){const p=new THREE.Mesh(new THREE.BoxGeometry(.12,2.7,.12),new THREE.MeshStandardMaterial({color:0x3a3e48,metalness:.7,roughness:.4}));p.position.set(x,1.35,z);g.add(p);}
  g.position.y=L.y;
  // a sign at each door
  for(const [y,z,f] of[[L.yb+3.3,z1+.2,0],[L.yt+3.3,z0-.2,Math.PI]]){const t=KIT.neonTex('LIFT',0xffc860,{w:192,h:64,size:40}),m=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.6),new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(1.5,1.5,1.5)}));
    m.position.set((x0+x1)/2,y,z);m.rotation.y=f;m.userData.dyn=1;scene.add(m);}}
// the lift tower's skywalk: from its top door north over the lower terrace to the upper one
KIT.deck(0,-90,Math.PI/2,20,3,12,0,0);KIT.mg(metalMat).add(boxUV(3,.3,20,2),M(0,11.85,-90),K_METAL);
for(const x of[-1.5,1.5]){KIT.rail(x,-80,x,-100,12);KIT.mg(metalMat).add(boxUV(.06,.06,20,1),M(x,13,-90),K_TRIM);KIT.mg(KIT.lampMat).add(boxUV(.05,.05,20,1),M(x,12.1,-90),C(0x7fe8ff).multiplyScalar(1.6));}
for(const z of[-84,-96])KIT.mg(metalMat).add(boxUV(.5,6,.5,1),M(0,9,z),K_TRIM);
KIT.post(0,-84,.3,6,5.7);KIT.post(0,-96,.3,6,5.7);
// the tower's frame up the outside
KIT.mg(metalMat).add(boxUV(4.6,.4,6.6,1),M(0,16.2,-77),K_TRIM);
function liftTick(dt){if(typeof P==='undefined')return;for(const L of LIFTS){const inside=inR(L.r,P.pos.x,P.pos.z,-.25),atTop=Math.abs(L.y-L.yt)<.03,atBot=Math.abs(L.y-L.yb)<.03;
  if(L.target==null){
    const on=inside&&Math.abs(P.pos.y-L.y)<.7,below=inside&&P.pos.y<L.y-1,above=inside&&P.pos.y>L.y+1;
    if(on||below||above){L.wait+=dt;if(L.wait>(on?.9:.5)){L.wait=0;L.rider=on;L.target=on?(atTop?L.yb:L.yt):below?L.yb:L.yt;if(L.target===L.y)L.target=null;else if(typeof sfx!=='undefined'&&sfx.swap)try{sfx.swap();}catch(_){}}}
    else L.wait=0;}
  else{const d=L.target-L.y,s=Math.sign(d)*Math.min(Math.abs(d),dt*3.2);L.y+=s;if(L.target===L.y||Math.abs(L.target-L.y)<.01){L.y=L.target;L.target=null;L.rider=false;}}
  L.lid=!(Math.abs(L.y-L.yt)<.03)&&!(L.target!=null&&L.rider&&L.target<L.y);
  L.g.position.y=L.y;}}
CITY.ticks.push(liftTick);

/* ---------- THE LOWER STREETS (west): blocks of shops and flats, a square with a fountain ---------- */
const COLS=[[-178,-152],[-138,-106],[-92,-72]],ROWS=[[-60,-38],[-30,-10],[10,36]];
for(const [x0,x1] of COLS)for(const [z0,z1] of ROWS){
  if(x0===-138&&z0===10){   // the square: the fountain, benches, planters
    KIT.mg(concMat).add(new THREE.CylinderGeometry(4,4.3,.8,24),M(-122,.4,23),C(0x8a8c94));KIT.post(-122,23,4.1,0,.8);
    KIT.mg(concMat).add(new THREE.CylinderGeometry(.6,.8,3,12),M(-122,1.5,23),C(0x9a9ca4));
    KIT.mg(KIT.lampMat).add(new THREE.CylinderGeometry(3.6,3.6,.05,24),M(-122,.82,23),C(0x2a6a9a).multiplyScalar(1.4));
    for(const [x,z] of[[-132,14],[-112,14],[-132,32],[-112,32]]){KIT.mg(concMat).add(boxUV(4,.9,1.6,2),M(x,.45,z),C(0x7a7c84));KIT.block({cx:x,cz:z,ry:0,l:4,w:1.6},-.1,.9);}
    continue;}
  // one or two buildings to the block, an alley between
  if(x1-x0>24&&rnd()<.7){const m=RR(x0+10,x1-10);bld([x0,m-1.5,z0,z1],0,RR(12,26),{shops:true,neon:.5});bld([m+1.5,x1,z0,z1],0,RR(12,26),{shops:true,neon:.5});}
  else bld([x0,x1,z0,z1],0,RR(14,28),{shops:true,neon:.6});}
// the street lamps, the cars, the barriers
for(let x=-170;x<-62;x+=16){lampAt(x,0,-9.2);lampAt(x+8,0,9.2);}
for(let z=-58;z<36;z+=18){lampAt(-145,0,z);lampAt(-98,0,z+9);}
for(const [x,z,ry,b] of[[-80,-4,.2,1],[-112,5,-.4,0],[-146,-2,1.4,1],[-160,6,.1,0],[-98,-48,1.6,0],[-143,-20,1.5,1],[-99,22,1.7,0],[-165,-68,.3,1],[-120,-66,-.2,0],[-70,-68,.1,1]])car(x,0,z,ry,b);
for(const [x,z,ry] of[[-86,0,1.57],[-128,-3,1.2],[-104,-34,0],[-150,-34,0],[-64,30,1.57],[-140,44,0]])barrier(x,0,z,ry);

/* ---------- THE AVENUE under the terraces, and the promenade along the seawall ---------- */
for(let x=-150;x<110;x+=14)lampAt(x,0,-72.4,0xbfe8ff);
for(let x=-170;x<170;x+=16)lampAt(x,0,48.6,0xffd9a0);
for(const [x,z,ry,b] of[[-30,-66,.1,1],[22,-62,-.3,0],[60,-68,.2,0],[-48,44,0,1],[36,42,.1,0]])car(x,0,z,ry,b);
for(const [x,z,ry] of[[-10,-60,0],[10,-56,.3],[0,44,0],[-80,44,0]])barrier(x,0,z,ry);

/* ---------- THE PLAZA (east): the monument, the planters, the downed dropship ---------- */
for(const r of[[150,170,-60,-34],[150,170,-26,2],[150,170,10,36],[112,128,-74,-60],[132,148,-74,-60]])bld(r,0,RR(16,32),{shops:true,neon:.5});
{// the Keepers' monument: a stepped plinth, a white needle with a gold ring and a light at its tip
 KIT.mg(concMat).add(boxUV(10,1.2,10,2),M(110,.6,-10),C(0xb8b4aa));KIT.block([105,115,-15,-5],-.1,1.2);
 KIT.mg(concMat).add(boxUV(6,1.2,6,2),M(110,1.8,-10),C(0xc8c4ba));KIT.block([107,113,-13,-7],1.1,2.4);
 KIT.mg(concMat).add(new THREE.CylinderGeometry(.5,1.4,22,6),M(110,13.4,-10),C(0xe6e2d8));KIT.post(110,-10,1.3,2.4,22);
 KIT.mg(KIT.lampMat).add(new THREE.TorusGeometry(2.2,.12,8,40).rotateX(Math.PI/2),M(110,20,-10),C(0xffd27a).multiplyScalar(2));
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x9fe8ff).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s.position.set(110,24.6,-10);s.scale.setScalar(6);s.userData.dyn=1;scene.add(s);
 const L=new THREE.PointLight(C(0x9fd8ff),1.4,40,1.6);L.position.set(110,8,-10);scene.add(L);}
for(const [x,z] of[[88,-34],[98,-34],[122,-34],[132,-34],[88,14],[132,14],[78,-12],[142,-12]]){KIT.mg(concMat).add(boxUV(5,.95,1.8,2),M(x,.47,z),C(0x7e7a72));KIT.block({cx:x,cz:z,ry:0,l:5,w:1.8},-.1,.95);
  KIT.mg(KIT.lampMat).add(boxUV(4.6,.05,1.4,1),M(x,.98,z),C(0x1a3a1a).multiplyScalar(1.2));}
for(const [x,z,ry] of[[74,-40,.4],[80,26,-.3],[140,30,.6],[100,22,0],[146,-46,1.2],[118,-52,.1]])barrier(x,0,z,ry);
for(const [x,z,ry,b] of[[96,-52,.3,1],[144,-4,1.4,0],[70,-60,.2,1]])car(x,0,z,ry,b);
{// a Keeper dropship down on its side, burning: the hull, a wing in the air, a wing in the ground, fire and smoke
 const x=126,z=26,ry=.5,F=KIT.frame(x,z,ry);
 KIT.mg(metalMat).add(boxUV(14,3.6,4.6,2),M(x,1.6,z,.25,ry,0),C(0x5a5e66));KIT.block({cx:x,cz:z,ry,l:14,w:4.6},-.1,3.4);
 const a=F.at(-1,4.5),b=F.at(-1,-4.2);KIT.mg(metalMat).add(boxUV(4,.35,7,2),M(a[0],3.6,a[1],.9,ry,0),C(0x4a4e56));KIT.mg(metalMat).add(boxUV(4,.35,6,2),M(b[0],.4,b[1],-.2,ry,0),C(0x2a2c30));
 KIT.block({cx:b[0],cz:b[1],ry,l:4,w:6},-.1,.8);
 const c=F.at(6,0);KIT.mg(KIT.lampMat).add(boxUV(.3,1.6,3.4,1),M(c[0],1.8,c[1],0,ry,0),C(0xffd27a).multiplyScalar(1.2));
 const fire=[];for(let k=0;k<(coarse?4:8);k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff7a2a).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
   const p=F.at(RR(-6,4),RR(-1.5,1.5));s.position.set(p[0],RR(1,3.5),p[1]);s.userData.dyn=1;s.userData.b=s.position.y;s.userData.ph=rnd()*9;scene.add(s);fire.push(s);}
 const L=new THREE.PointLight(C(0xff7a30),2.2,26,1.6);L.position.set(x,3.5,z);scene.add(L);
 CITY.ticks.push((dt,T)=>{for(const s of fire){const u=(T*.9+s.userData.ph)%1;s.position.y=s.userData.b+u*2.2;s.scale.setScalar(2.6*(1-u)+.6);s.material.opacity=1-u;}L.intensity=2+Math.sin(T*13)*.3+Math.sin(T*7.3)*.25;});}
for(let z=-40;z<36;z+=15)lampAt(146,0,z,0xffd9a0);

/* ---------- THE DOCKS (south, 9 m down): warehouses, containers, cranes, the piers ---------- */
for(const r of[[-170,-142,58,80],[-104,-76,58,78],[-58,-26,60,80],[4,34,58,80],[46,78,60,80],[120,152,58,80]])bld(r,-9,RR(9,14),{col:C(0x5a5e66)});
for(const [x,z,ry,n] of[[-136,62,0,2],[-112,84,1.57,1],[-66,84,0,2],[-16,64,1.57,1],[-8,82,0,3],[40,84,1.57,2],[88,64,0,1],[112,82,0,2],[160,70,1.57,2],[-160,84,0,1],[94,84,1.57,1]])containers(x,-9,z,ry,n);
for(const [x,z] of[[-70,70],[-20,72],[40,70],[100,74],[-150,70]])crate(x,-9,z,1.4,1.2);
for(const x of[-90,20,140]){// a crane: legs over the quay edge, the boom out over the water, a lamp on it
  for(const [dx,dz] of[[-3,-3],[3,-3],[-3,3],[3,3]]){KIT.mg(rustMat).add(boxUV(.6,18,.6,2),M(x+dx,0,84+dz),C(0xaa6a2a));KIT.post(x+dx,84+dz,.4,-9,18);}
  KIT.mg(rustMat).add(boxUV(7,1.2,30,3),M(x,9.4,92),C(0xaa6a2a));KIT.mg(KIT.lampMat).add(boxUV(.5,.2,.5,1),M(x,8.6,104),C(0xff4a3a).multiplyScalar(2.4));}
for(let x=-170;x<170;x+=20)lampAt(x,-9,86.2,0xffc070);
for(let x=-160;x<170;x+=40){KIT.mg(metalMat).add(new THREE.CylinderGeometry(.3,.35,.7,10),M(x,-8.65,87.4),C(0x2a2c30));KIT.post(x,87.4,.35,-9,.7);}

/* ---------- THE HEIGHTS (north): flats on the two terraces, a lookout toward the Spear ---------- */
for(const [x0,x1] of[[-148,-118],[-110,-96],[-80,-44],[-22,-8],[8,30],[48,70],[92,108]])bld([x0,x1,-99,-89],6,RR(8,16),{shops:x0%2===0,neon:.4});
for(const [x0,x1] of[[-150,-122],[-112,-84],[-66,-42],[10,40],[50,72]])bld([x0,x1,-130,-118],12,RR(10,20),{neon:.4});
for(let x=-140;x<100;x+=18){lampAt(x,6,-76.5,0xbfe8ff);lampAt(x+9,12,-102.5,0xbfe8ff);}
for(const [x,z] of[[-60,-82],[20,-84],[-120,-80],[96,-110],[100,-122],[-10,-110]]){KIT.mg(concMat).add(boxUV(4,.9,1.6,2),M(x,ground(x,z)+.45,z),C(0x7a7c84));KIT.block({cx:x,cz:z,ry:0,l:4,w:1.6},ground(x,z)-.1,ground(x,z)+.9);}
// the lookout: a railed platform at the east end of the upper terrace, a pair of viewers on posts
KIT.mg(KIT.lampMat).add(boxUV(.05,.05,56,1),M(110,13.05,-102),C(0xffd27a).multiplyScalar(1.6));
for(const z of[-108,-116])KIT.mg(metalMat).add(boxUV(.4,1.3,.4,1),M(107,12.65,z),K_TRIM);

/* ---------- the city beyond the edges: tall dark blocks close the view; Tide City's towers far off ---------- */
for(let x=-200;x<=190;x+=17)bld([x-6,x+6,-160+RR(-4,4),-146],0,RR(40,80),{far:true,neon:.3});
for(let z=-140;z<=40;z+=16){bld([-206,-192,z-6,z+6],0,RR(30,60),{far:true,neon:.3});bld([184,198,z-6,z+6],0,RR(30,60),{far:true,neon:.3});}
if(typeof SKYLINE!=='undefined'){const N=coarse?40:100,S=SKYLINE.build({n:N,seed:31,h:300,w:50,water:-40,lit:.5,rings:false,traffic:coarse?14:50,place:(i,r)=>{const a=i/N*Math.PI*2+r()*.1,d=320+r()*500;return[Math.cos(a)*d,Math.sin(a)*d*.8-60,1-(d-320)/500];}});
  S.G.traverse(o=>{o.userData.dyn=1;});scene.add(S.G);CITY.ticks.push((dt,T)=>S.update&&S.update(T));}

/* ---------- light: the moon's shadows follow you round the city ---------- */
KIT.sunFollow=p=>{keyLight.position.set(p.x-60,140,p.z-80);keyLight.target.position.set(p.x,0,p.z);};

KIT.flush();
// the lattice for the whole city at once (no all-pairs table: the footage routes its own way, js/footage/tide-night.js)
KIT.nav({step:coarse?3.2:2.8,table:false});
GS.HALF=170;
// the districts, for the footage: where each is, and its name
// (each district's ground, as rects; the long ones in two halves, so a patrol comes in near you, not 300 m off)
const DISTRICTS=[
  {id:'market',name:'Midnight Market',rs:[[-58,58,-38,38]]},
  {id:'lower',name:'The Lower Streets',rs:[[-178,-58,-74,50]]},
  {id:'plaza',name:'The Plaza',rs:[[58,170,-74,50]]},
  {id:'docksW',name:'The Docks',rs:[[-178,-6,50,110]]},
  {id:'docksE',name:'The Docks',rs:[[-6,170,50,110]]},
  {id:'heightsW',name:'The Heights',rs:[[-150,-20,-130,-74]]},
  {id:'heightsE',name:'The Heights',rs:[[-20,110,-130,-74]]}];
for(const D of DISTRICTS)D.d=(x,z)=>Math.min(...D.rs.map(r=>sdR(r,x,z)));
return{LIFTS,DISTRICTS,ground,inR};})();
