/* Elyra · TakeOver · Vigil Harbour — the world (Oct 31, Bryce: picked from the ideas, "Vigil Harbour Docks ... go all out"). Tide
   City's waterfront at night, under the Vigil's light:

     the quays     concrete all round a basin (2.2 m over the water), warehouses with walkable roofs, container stacks, sodium lamps
     the basin     dark water, waist deep: you can wade it (slowly, and loudly), or keep to the piers at the water's edge. Steps up
                   out of it at the piers' ends and the slipways in the middle of each end wall
     the ship      a freighter moored down the middle of the basin, its deck 5.5 m up: gangways from both quays, two open holds you
                   can drop into (steep stairs back up), the bridge house amidships with a stair up to its roof
     the cranes    one on each long quay, a stair up to its machinery deck (8.2 m): the long look over the basin
     the light     the lighthouse out past the harbour mouth: its beam comes round every twelve seconds and lights up whoever it
                   crosses
   Blue's pad at the west end of the quays, red's at the east. Same turned half way round (x,z → -x,-z).

   Built on js/mp/kit.js. Units are metres; north is -z. */
setSeed(6262);
renderer.toneMappingExposure=1.15;
HAZE_HEX=0x0a1018;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),.014);scene.background=C(0x04070c);

/* ---------- the plan ---------- */
const QY=2.2,WATER_FLOOR=-1,DECK_Y=5.5;
const GS=(()=>{
  const HALF=58,BASE_R=8;
  const BASES=[{team:'blue',x:-51,z:0},{team:'red',x:51,z:0}].map(B=>{B.fx=-Math.sign(B.x);B.fz=0;B.r=BASE_R;B.shieldR=11.5;B.spawnR=2.5;B.spawnStep=2.2;B.y=QY;return B;});
  const CFG={id:'mpharbour',name:'VIGIL HARBOUR',sub:'Team deathmatch · docks at night',air:false,vehicles:false,bots:8,score:50,time:10*60,see:85,range:72,hold:20,flashlights:false,beacon:false,domeK:.3,domeFog:true,
    brief:'TakeOver · team deathmatch. Tide City\'s harbour at night. Cranes, the freighter\'s deck and the warehouse roofs up top; the piers and the dark water under them. The basin is waist deep: wade it if you must, slowly. The lighthouse beam comes round every twelve seconds and lights up whoever it finds.',
    objective:'Down the other side. Your pad has guns and ammo, the quays have more; nothing crosses your dome.'};
  return{HALF,HALFZ:36,SEA:-99,TEAMS:TEAM_COLS,BASES,BASE_R,CFG,NAME:CFG.name};})();
const BASIN=[-34,34,-14,14];
const inBasin=(x,z)=>x>BASIN[0]&&x<BASIN[1]&&z>BASIN[2]&&z<BASIN[3];
CITY.ground=(x,z)=>inBasin(x,z)?WATER_FLOOR:QY;
CITY.edge=(x,z)=>Math.max(Math.abs(x)-57.6,Math.abs(z)-35.6);
CITY.box=[-58,-36,58,36];CITY.step=2.2;
kitContract();
const mirR=r=>[-r[1],-r[0],-r[3],-r[2]];

/* ---------- the quay walls round the basin (with the slipways' gaps) ---------- */
{const gap=(x,z)=>Math.abs(Math.abs(x)-34)<.5&&Math.abs(z)<1.6;
 const seg=(ax,az,bx,bz)=>{const L=Math.hypot(bx-ax,bz-az),n=Math.ceil(L/.5);let s0=null;for(let k=0;k<=n;k++){const t=k/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,ok=k<n&&!gap(x,z);
   if(ok&&s0===null)s0=t;if(!ok&&s0!==null){KIT.wall(ax+(bx-ax)*s0,az+(bz-az)*s0,ax+(bx-ax)*t,az+(bz-az)*t,-1.6,QY,.5);s0=null;}}};
 const [x0,x1,z0,z1]=BASIN;seg(x0,z0+.25,x1,z0+.25);seg(x0,z1-.25,x1,z1-.25);seg(x0+.25,z0,x0+.25,z1);seg(x1-.25,z0,x1-.25,z1);}

/* ---------- the ship: a freighter down the middle of the basin ---------- */
// solid sections (engine room amidships, the ends, the tapered bow and stern) stand from the basin floor to the deck; the holds are
// open boxes under the deck, the hatch over each one open
const SHIP={holds:[[-18,-8],[8,18]],hatch:[[-16,-10],[10,16]],hw:4.5};
KIT.block([-8,8,-4.5,4.5],-1.6,DECK_Y);
for(const s of[1,-1]){KIT.block(s>0?[18,20,-4.5,4.5]:[-20,-18,-4.5,4.5],-1.6,DECK_Y);
  // the tapered ends: three narrowing blocks
  for(const [a0,a1,w] of[[20,21.6,3.8],[21.6,23,2.8],[23,24.2,1.6]])KIT.block(s>0?[a0,a1,-w,w]:[-a1,-a0,-w,w],-1.6,DECK_Y);}
for(const [h0,h1] of SHIP.holds){
  // the hull's sides along the hold, the hold's floor, the deck round the hatch, the coaming
  KIT.wall(h0,-4.35,h1,-4.35,-1.6,DECK_Y,.3);KIT.wall(h0,4.35,h1,4.35,-1.6,DECK_Y,.3);
  KIT.deck((h0+h1)/2,0,0,h1-h0,8.4,.5,0,0);
  const hc=h0<0?SHIP.hatch[0]:SHIP.hatch[1];
  KIT.deck((h0+h1)/2,-3.35,0,h1-h0,2.3,DECK_Y,0,0);KIT.deck((h0+h1)/2,3.35,0,h1-h0,2.3,DECK_Y,0,0);
  KIT.deck((h0+hc[0])/2,0,0,hc[0]-h0,4.4,DECK_Y,0,0);KIT.deck((hc[1]+h1)/2,0,0,h1-hc[1],4.4,DECK_Y,0,0);}
// the holds' stairs (steep, inside the hatch, up to the deck at the hatch's end) and the coamings round the hatches with a gap at
// the stair's head
const HOLD_ST=[KIT.ramp([-10.3,-1.2],-1,0,6,1.4,.5,DECK_Y,{rails:[false,true]}),KIT.ramp([10.3,1.2],1,0,6,1.4,.5,DECK_Y,{rails:[false,true]})];
for(const [a,b] of SHIP.hatch){const s=a<0?1:-1;
  KIT.wall(a,-2.2,b,-2.2,DECK_Y-.1,DECK_Y+.85,.25);KIT.wall(a,2.2,b,2.2,DECK_Y-.1,DECK_Y+.85,.25);
  // the end the stair comes up at keeps a gap for it
  if(s>0){KIT.wall(a,-2.2,a,-2.2+.25,DECK_Y-.1,DECK_Y+.85,.25);KIT.wall(a,-.2,a,2.2,DECK_Y-.1,DECK_Y+.85,.25);KIT.wall(b,-2.2,b,2.2,DECK_Y-.1,DECK_Y+.85,.25);}
  else{KIT.wall(b,2.2,b,2.2-.25,DECK_Y-.1,DECK_Y+.85,.25);KIT.wall(b,.2,b,-2.2,DECK_Y-.1,DECK_Y+.85,.25);KIT.wall(a,-2.2,a,2.2,DECK_Y-.1,DECK_Y+.85,.25);}}
// the bulwarks round the deck's edge (waist high: cover, and you can't walk off by accident), gaps for the gangways
const GANG=[[-19,-1],[12,-1]];   // [x, side z sign] on the north side; their twins on the south
const gangGap=(x,z)=>GANG.some(([gx,sz])=>(Math.abs(x-gx)<1.4&&Math.sign(z)===sz)||(Math.abs(x+gx)<1.4&&Math.sign(z)===-sz));
{const pts=[[-24.2,-1.6],[-23,-2.8],[-21.6,-3.8],[-20,-4.5],[20,-4.5],[21.6,-3.8],[23,-2.8],[24.2,-1.6],[24.2,1.6],[23,2.8],[21.6,3.8],[20,4.5],[-20,4.5],[-21.6,3.8],[-23,2.8],[-24.2,1.6],[-24.2,-1.6]];
 for(let i=0;i<pts.length-1;i++){const [ax,az]=pts[i],[bx,bz]=pts[i+1],L=Math.hypot(bx-ax,bz-az),n=Math.ceil(L/.5);let s0=null;
   for(let k=0;k<=n;k++){const t=k/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,ok=k<n&&!gangGap(x,z);if(ok&&s0===null)s0=t;if(!ok&&s0!==null){KIT.wall(ax+(bx-ax)*s0,az+(bz-az)*s0,ax+(bx-ax)*t,az+(bz-az)*t,DECK_Y-.1,DECK_Y+1,.25);s0=null;}}}}
// the bridge house amidships (its roof at 8.8, walkable), the wheelhouse on it (cover), the stairs up the house's sides
KIT.block([-5,5,-3,3],DECK_Y-.1,8.8);KIT.block([-1.8,1.8,-1.2,1.2],8.7,11.4);
KIT.ramp([7,-3.65],-1,0,6,1.3,DECK_Y,8.8,{rails:[false,true],base:DECK_Y});KIT.ramp([-7,3.65],1,0,6,1.3,DECK_Y,8.8,{rails:[false,true],base:DECK_Y});
// the roof's rails, open where each stair comes up
KIT.rail(-5,-3,.6,-3,8.8,.9);KIT.rail(-.6,3,5,3,8.8,.9);KIT.rail(-5,-3,-5,3,8.8,.9);KIT.rail(5,-3,5,3,8.8,.9);
// deck clutter: hatch covers stacked aside, winches, bollards
for(const [x,z,l,w,h] of[[-21.5,1.6,1.8,1.4,1.1],[-6.4,-3.8,1.1,.9,.9],[-16.6,3.6,2.4,1,.8]])for(const s of[1,-1])KIT.block({cx:x*s,cz:z*s,ry:0,l,w},DECK_Y-.1,DECK_Y+h);
for(const [x,z] of[[-17,3.9],[-9.5,-3.9],[19,3.6]])for(const s of[1,-1])KIT.post(x*s,z*s,.3,DECK_Y,.8);

/* ---------- the gangways, the piers, the steps out of the water ---------- */
for(const [gx] of GANG)for(const s of[1,-1])KIT.ramp([gx*s,-14.9*s],0,s,10.6,2,QY,DECK_Y,{rails:[true,true]});
const PIERS=[[-28,-14,-6,3.2],[22,-14,-7,3.2]];   // [x, z from the quay, z out to, width]
for(const [x,z0,z1,w] of PIERS)for(const s of[1,-1]){const X=x*s,r=s>0?[x-w/2,x+w/2,z0,z1]:mirR([x-w/2,x+w/2,z0,z1]);KIT.block(r,-1.6,.9);
  // the steps down from the quay onto it, and the ladder-steps at its end up out of the water
  KIT.ramp([X+(w/2-1)*s,-14*s],0,s,3.2,1.6,QY,.9,{rails:[false,true]});
  KIT.ramp([X,z1*s],0,s,2.6,1.6,.9,WATER_FLOOR,{rails:[true,true]});}
// the slipways in the end walls: from the basin's floor up to the quay
for(const s of[1,-1])KIT.ramp([-29.6*s,0],-s,0,4.6,2.6,WATER_FLOOR,QY,{rails:[true,true]});
// boats moored at the piers: their decks just over the water (cover, and somewhere to stand)
const BOATS=[[-24,-9,.2,6,2.4],[18,-10.5,-.15,5.4,2.2],[-31,6,1.4,5,2]];
for(const [x,z,ry,l,w] of BOATS)for(const s of[1,-1])KIT.block({cx:x*s,cz:z*s,ry,l,w},-1.6,.55);

/* ---------- the cranes: legs either side of the quay's edge, a machinery deck at 8.2, its stair ---------- */
const CRANES=[[-6,-1]];   // [x, north]
const CR_Y=8.2;
for(const [cx] of CRANES)for(const s of[1,-1]){const X=cx*s,zq=-14*s;
  for(const dx of[-3.6,3.6])for(const dz of[-4.6,-.8]){KIT.post(X+dx*s,(-14+dz)*s+0,.45,QY,30);}
  KIT.deck(X,(-14-2.7)*s,0,8.6,5.2,CR_Y,0,0);
  for(const [ax,az,bx,bz] of[[-4.3,-5.3,4.3,-5.3],[-4.3,-.1,4.3,-.1],[4.3,-5.3,4.3,-.1]])KIT.rail(X+ax*s,(-14+az)*s,X+bx*s,(-14+bz)*s,CR_Y);
  KIT.ramp([X+(-12)*s,-16.7*s],s,0,7.7,1.5,QY,CR_Y,{rails:[true,true]});}

/* ---------- the warehouses (walkable roofs) and the container yard ---------- */
const WARE=[[-31,-15,-35,-24,9.7],[2,17,-35,-25,11],[22,33,-35,-26,8.4]];
for(const W of WARE)for(const s of[1,-1]){const r=s>0?W.slice(0,4):mirR(W);KIT.block(r,QY-.3,W[4]);}
const WARE_ST=[[[-30.2,-23.1],[1,0],13,1.6,QY,9.7,[false,true]],[[1.2,-23.6],[0,-1],11,1.6,QY,11,[true,false]],[[16.4,-30],[1,0],6.2,1.6,11,8.4,[true,true]],[[23.5,-25.1],[1,0],8.6,1.6,QY,8.4,[false,true]]];
for(const [P0,u,L,w,a,b,rails] of WARE_ST)for(const s of[1,-1])KIT.ramp([P0[0]*s,P0[1]*s],u[0]*s,u[1]*s,L,w,a,b,{rails});
// parapets round the roofs, gaps where the stairs come up
const nearRampH=(x,z,y,m)=>{for(const R of KIT.PAIRS){const q=R.loc(x,z);if(q[0]>-m-.4&&q[0]<R.L+m+.4&&Math.abs(q[1])<R.w/2+m&&Math.abs(R.hAt(q[0])-y)<3.5)return true;}return false;};
const HB_PARA=[];
for(const W of WARE)for(const s of[1,-1]){const [x0,x1,z0,z1]=s>0?W.slice(0,4):mirR(W),h=W[4];
  for(const [ax,az,bx,bz] of[[x0,z0,x1,z0],[x1,z0,x1,z1],[x1,z1,x0,z1],[x0,z1,x0,z0]]){const L=Math.hypot(bx-ax,bz-az),n=Math.ceil(L/.5);let s0=null;
    for(let k=0;k<=n;k++){const t=k/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,ok=k<n&&!nearRampH(x,z,h,.35);if(ok&&s0===null)s0=t;if(!ok&&s0!==null){if((t-s0)*L>.6){const p0=[ax+(bx-ax)*s0,az+(bz-az)*s0],p1=[ax+(bx-ax)*t,az+(bz-az)*t];KIT.wall(p0[0],p0[1],p1[0],p1[1],h-.1,h+.8,.3);HB_PARA.push([p0,p1,h]);}s0=null;}}}}
// the container yard behind the crane: stacks one and two high, a loading ramp up onto one; and singles along the quays
const BOXES=[];   // {cx,cz,ry,n}
for(const [x,z,ry,n] of[[-11,-24,0,2],[-11,-21,0,1],[-4.5,-27,Math.PI/2,2],[-1.5,-27,Math.PI/2,1],[-7.5,-33.5,0,1],[-13,-29.6,0,1],[28,-19.5,0,1],[-38,-24,Math.PI/2,1],[-44,-26,0,2],[36,-31,Math.PI/2,1],[-24,-18,0,1],[40,-18,0,1]]){
  for(const s of[1,-1]){KIT.block({cx:x*s,cz:z*s,ry,l:6,w:2.5},QY-.1,QY+2.6*n);BOXES.push({cx:x*s,cz:z*s,ry,n});}}
for(const s of[1,-1])KIT.ramp([-17.6*s,-21*s],s,0,3.5,2,QY,QY+2.6,{rails:[true,true]});
// bollards on the quay's edge, a few crates
for(let x=-32;x<=32;x+=8)for(const s of[1,-1]){if(Math.abs(x+6)<5||Math.abs(x+19)<2||Math.abs(x-12)<2||Math.abs(x+28)<3||Math.abs(x-22)<3)continue;KIT.post(x*s,-15*s,.3,QY,.7);}
for(const [x,z,l,h] of[[-36,-17,1.2,1.1],[-42,-31,1.2,1],[31,-16.4,1.1,1],[6,-19,1.2,1.2],[-26,-21,1.1,1.1],[44,-12.6,1.2,1.2]])for(const s of[1,-1])KIT.block({cx:x*s,cz:z*s,ry:hash(x|0,z|0),l,w:l},QY-.1,QY+h);

/* ---------- materials ---------- */
const HB_ENV=KIT.env((x,y,z)=>{const hz=1-Math.abs(y);let r=.02+.04*hz*hz,g=.03+.05*hz*hz,b=.05+.07*hz*hz;const a=Math.atan2(z,x);
  const city=sstep(.6,.98,hz)*(.5+.5*Math.sin(a*11))*(.6+.4*Math.sin(a*3+1));r+=city*.5;g+=city*.32;b+=city*.18;   // sodium orange along the shore
  const lh=Math.pow(Math.max(0,-z*.4+x*.2-y*.1),6)*.6;r+=lh;g+=lh;b+=lh*1.1;return[r,g,b];});
const concTex=KIT.tex('pebbles',true),concN=KIT.tex('pebbles-n');concTex.repeat.set(1,1);
const quayMat=new THREE.MeshStandardMaterial({vertexColors:true,map:concTex,normalMap:concN,normalScale:new THREE.Vector2(.5,.5),roughness:.55,metalness:.15,envMap:HB_ENV,envMapIntensity:1.3});
const corrTex=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');for(let x=0;x<256;x++){const v=120+60*Math.sin(x/256*Math.PI*16);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,0,1,256);}
  for(let i=0;i<160;i++){g.fillStyle=`rgba(${80+Math.random()*60|0},${40+Math.random()*30|0},20,${Math.random()*.25})`;g.fillRect(Math.random()*256,Math.random()*256,2+Math.random()*4,10+Math.random()*80);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;return t;})();
const corrMat=new THREE.MeshStandardMaterial({vertexColors:true,map:corrTex,roughness:.45,metalness:.6,envMap:HB_ENV,envMapIntensity:1});
const rustTex=KIT.tex('metal020',true),rustN=KIT.tex('metal020-n');
const hullMat=new THREE.MeshStandardMaterial({vertexColors:true,map:rustTex,normalMap:rustN,roughness:.55,metalness:.45,envMap:HB_ENV,envMapIntensity:1});
const steelMat=new THREE.MeshStandardMaterial({vertexColors:true,map:panelTex,roughness:.4,metalness:.7,envMap:HB_ENV,envMapIntensity:1.1});
const paintMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.3,envMap:HB_ENV,envMapIntensity:.8});
const woodMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0});
stoneMat=paintMat;
const K_HULL=C(0x8a3a2c),K_HULL2=C(0x2c3640),K_DECK=C(0x6a6458),K_STEEL=C(0x9aa2ac),K_DARK=C(0x2a2e34),K_YEL=C(0xd8a630),K_QUAY=C(0x9a968c);
const SODIUM=0xffa04a;

/* ---------- drawing: the quays and their faces down to the water, the ship, the gangways, the piers ---------- */
{// the quay: one slab with the basin cut out (a ring of four pieces), its face, a yellow edge line, rust streaks
 const mg=KIT.mg(quayMat),[x0,x1,z0,z1]=BASIN,E=70,addSlab=(a,b,c,d)=>{const w=b-a,dd=d-c,g=boxUV(w,1.2,dd,6);mg.add(g,M((a+b)/2,QY-.6,(c+d)/2),K_QUAY);};
 addSlab(-E,E,-E,z0);addSlab(-E,E,z1,E);addSlab(-E,x0,z0,z1);addSlab(x1,E,z0,z1);
 // the faces down to the water (dark, wet, weed at the waterline)
 for(const [ax,az,bx,bz] of[[x0,z0,x1,z0],[x0,z1,x1,z1],[x0,z0,x0,z1],[x1,z0,x1,z1]]){const L=Math.hypot(bx-ax,bz-az);const g=boxUV(Math.abs(bx-ax)||.4,2.4,Math.abs(bz-az)||.4,3);mg.add(g,M((ax+bx)/2,-.1,(az+bz)/2),C(0x55524c));
   KIT.mg(paintMat).add(boxUV(Math.abs(bx-ax)+.02||.42,.35,Math.abs(bz-az)+.02||.42,1),M((ax+bx)/2,.1,(az+bz)/2),C(0x1c2a20));
   KIT.mg(paintMat).add(boxUV(Math.abs(bx-ax)||.2,.04,Math.abs(bz-az)||.2,1),M((ax+bx)/2+(ax===bx?(ax<0?-.6:.6):0),QY+.01,(az+bz)/2+(az===bz?(az<0?-.6:.6):0)),K_YEL);}
 // tyres hung on the face as fenders
 for(let x=-30;x<=30;x+=5)for(const s of[1,-1])KIT.mg(woodMat).add(new THREE.TorusGeometry(.42,.16,8,14),M(x*s,QY-.9,-13.8*s),C(0x101010));
 // the basin's floor (seen through the water)
 KIT.mg(quayMat,{}).add(boxUV(68,.2,28,6),M(0,WATER_FLOOR-.1,0),C(0x2a3028));}
{// the ship: hull plates (rust red below, dark grey above), the deck, the holds' insides, the house, the wheelhouse, masts and derricks
 const hm=KIT.mg(hullMat),dm=KIT.mg(steelMat),pm=KIT.mg(paintMat);
 const prof=[[-24.2,1.6],[-23,2.8],[-21.6,3.8],[-20,4.5],[20,4.5],[21.6,3.8],[23,2.8],[24.2,1.6]];
 for(const s of[1,-1])for(let i=0;i<prof.length-1;i++){const [ax,az]=prof[i],[bx,bz]=prof[i+1],L=Math.hypot(bx-ax,bz-az),ry=Math.atan2(-(bz-az)*s,(bx-ax)),mx=(ax+bx)/2,mz=(az+bz)/2*s;
   hm.add(boxUV(L+.1,3.6,.25,3),M(mx,.6,mz,0,ry,0),K_HULL);hm.add(boxUV(L+.1,3.4,.25,3),M(mx,4.1,mz,0,ry,0),K_HULL2);pm.add(boxUV(L+.1,.12,.27,1),M(mx,2.45,mz,0,ry,0),C(0xd8d4c8));}
 for(const x of[-24.2,24.2])hm.add(boxUV(.25,7,3.2,3),M(x,2.1,0),K_HULL2);
 // the deck plating: everywhere but the hatches (drawn as the deck pieces)
 const deckPiece=(x0,x1,z0,z1)=>dm.add(boxUV(x1-x0,.2,z1-z0,2),M((x0+x1)/2,DECK_Y-.1,(z0+z1)/2),K_DECK);
 deckPiece(-20,-18,-4.5,4.5);deckPiece(18,20,-4.5,4.5);deckPiece(-8,8,-4.5,4.5);for(const [a,b,w] of[[20,21.6,3.8],[21.6,23,2.8],[23,24.2,1.6]]){deckPiece(a,b,-w,w);deckPiece(-b,-a,-w,w);}
 for(const [h0,h1] of SHIP.holds){const hc=h0<0?SHIP.hatch[0]:SHIP.hatch[1];deckPiece(h0,h1,-4.5,-2.2);deckPiece(h0,h1,2.2,4.5);deckPiece(h0,hc[0],-2.2,2.2);deckPiece(hc[1],h1,-2.2,2.2);
   // the hold: its floor, its sides and ends (inside faces, darker), the coaming
   dm.add(boxUV(h1-h0,.2,8.6,2),M((h0+h1)/2,.4,0),C(0x4a4640));for(const z of[-4.2,4.2])hm.add(boxUV(h1-h0,5,.1,3),M((h0+h1)/2,3,z),C(0x5a3a30));for(const x of[h0+.05,h1-.05])hm.add(boxUV(.1,5,8.6,3),M(x,3,0),C(0x5a3a30));
   for(const z of[-2.2,2.2])pm.add(boxUV(hc[1]-hc[0]+.25,.95,.25,1),M((hc[0]+hc[1])/2,DECK_Y+.37,z),K_YEL);for(const x of hc)pm.add(boxUV(.25,.95,4.6,1),M(x,DECK_Y+.37,0),K_YEL);
   // cargo left in the hold: crates, a fallen container (walls of the hold's own clutter, drawn only)
   for(let k=0;k<4;k++){const x=lerp(h0+1.5,h1-1.5,hash(k,Math.abs(h0)|0)),z=(k%2?1:-1)*(h0<0?1:-1)*(2.9+hash(k*3,Math.abs(h1)|0)*.6);KIT.block({cx:x,cz:z,ry:hash(k,7)*1.4,l:1.3,w:1.3},.4,1.6);pm.add(boxUV(1.3,1.2,1.3,1),M(x,1,z,0,hash(k,7)*1.4,0),C(0x5a4a34));}}
 // the bulwarks
 for(const W of S3.walls)if(W.y0>DECK_Y-.2&&W.y0<DECK_Y&&W.y1>DECK_Y+.8&&W.y1<DECK_Y+1.1){const ry=Math.atan2(-W.uz,W.ux);hm.add(boxUV(W.hw*2,1.1,.22,2),M(W.x,DECK_Y+.45,W.z,0,ry,0),K_HULL2);pm.add(boxUV(W.hw*2+.02,.08,.3,1),M(W.x,DECK_Y+1.02,W.z,0,ry,0),C(0xd8d4c8));}
 // the house: white, rows of portholes lit, the wheelhouse with its windows all round, a funnel behind it
 pm.add(boxUV(10,3.3,6,2),M(0,DECK_Y+1.6,0),C(0xd8d4cc));pm.add(boxUV(10.3,.2,6.3,1),M(0,8.85,0),C(0x7a7a78));pm.add(boxUV(3.6,2.7,2.4,2),M(0,10.05,0),C(0xe4e0d8));
 for(let x=-4;x<=4;x+=1.6)for(const z of[-3.02,3.02])KIT.mg(KIT.lampMat).add(new THREE.CircleGeometry(.22,10),M(x,DECK_Y+2.1,z,0,z<0?Math.PI:0,0),C(0xffd8a0).multiplyScalar(1.6));
 for(const [x,z,ry,w] of[[0,-1.22,Math.PI,3],[0,1.22,0,3],[1.82,0,Math.PI/2,2],[-1.82,0,-Math.PI/2,2]])KIT.mg(KIT.lampMat).add(new THREE.PlaneGeometry(w,.8),M(x,10.6,z,0,ry,0),C(0x9fe8ff).multiplyScalar(.9));
 pm.add(new THREE.CylinderGeometry(1,1.2,4,14),M(0,13.2,0),C(0x2a2e34));pm.add(new THREE.CylinderGeometry(1.05,1.05,.6,14),M(0,14.5,0),C(0xc83a2a));OBST.push({x:0,z:0,r:1.2,h:4,y0:11.4});
 // masts and derricks fore and aft
 for(const x of[-13,13]){dm.add(new THREE.CylinderGeometry(.22,.3,12,10),M(x,DECK_Y+6,x<0?-3.2:3.2),K_STEEL);OBST.push({x,z:x<0?-3.2:3.2,r:.32,h:12,y0:DECK_Y});
   dm.add(new THREE.CylinderGeometry(.12,.16,9,8),M(x+(x<0?3:-3),DECK_Y+4.5,x<0?-1:1,0,0,(x<0?-1:1)*.62),K_STEEL);
   KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.15,8,6),M(x,DECK_Y+12.1,x<0?-3.2:3.2),C(x<0?0x40ff60:0xff4040).multiplyScalar(2.5));}
 // the ship's name on its bows
 for(const s of[1,-1]){const t=KIT.neonTex('KEEPER STAR',0xe8e4d8,{w:384,h:64,frame:false,bg:'rgba(0,0,0,0)'});const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,.7),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.6}));
   m.position.set(-19*s,4.3,-4.62*s);m.rotation.y=s>0?Math.PI:0;m.userData.dyn=1;scene.add(m);}}
// gangways, the stairs (steel), piers (old timber on piles), the cranes, the warehouses, containers
for(const R of KIT.PAIRS){const flat=Math.abs(R.yB-R.yA)<.05,ry=Math.atan2(-R.uz,R.ux),mx=R.P0[0]+R.ux*R.L/2,mz=R.P0[1]+R.uz*R.L/2,ym=(R.yA+R.yB)/2,pitch=Math.atan2(R.yB-R.yA,R.L),hl=Math.hypot(R.L,R.yB-R.yA);
  const steep=Math.abs(R.yB-R.yA)/R.L>.35;
  if(steep){const n=Math.max(3,Math.round(Math.abs(R.yB-R.yA)/.24));for(let k=0;k<n;k++){const a=(k+.5)/n*R.L,y=R.hAt(a);KIT.mg(steelMat).add(boxUV(R.L/n+.02,.06,R.w-.1,1),M(R.P0[0]+R.ux*a,y-.03,R.P0[1]+R.uz*a,0,ry,0),K_STEEL);}}
  else KIT.mg(steelMat).add(boxUV(hl,.1,R.w,1),M(mx,ym-.05,mz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_STEEL);
  for(const s of[-1,1]){const ox=R.nx*s*(R.w/2-.05),oz=R.nz*s*(R.w/2-.05);KIT.mg(steelMat).add(boxUV(hl,.3,.06,1),M(mx+ox,ym-.18,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_DARK);
    KIT.mg(steelMat).add(boxUV(hl,.05,.05,1),M(mx+ox,ym+1,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_YEL);
    for(let k=0;k<=Math.floor(R.L/1.5);k++){const a=Math.min(R.L,k*1.5),y=R.hAt(a);KIT.mg(steelMat).add(boxUV(.05,1,.05,1),M(R.P0[0]+R.ux*a+ox,y+.5,R.P0[1]+R.uz*a+oz),K_DARK);}}}
for(const [x,z0,z1,w] of PIERS)for(const s of[1,-1]){const r=s>0?[x-w/2,x+w/2,z0,z1]:mirR([x-w/2,x+w/2,z0,z1]),cx=(r[0]+r[1])/2,cz=(r[2]+r[3])/2,L=r[3]-r[2];
  for(let k=0;k<Math.round(L/.3);k++)KIT.mg(woodMat).add(boxUV(w,.12,.27,1),M(cx,.84,r[2]+.15+k*.3),C(0x4a3a2a).multiplyScalar(.8+.4*hash(k,x|0)));
  for(let k=0;k<=Math.round(L/2.2);k++)for(const dx of[-w/2+.2,w/2-.2])KIT.mg(woodMat).add(new THREE.CylinderGeometry(.18,.2,2.6,8),M(cx+dx,-.4,r[2]+k*2.2+.1),C(0x2a2018));}
const BOATS_G=[];
for(const [x,z,ry,l,w] of BOATS)for(const s of[1,-1]){const g=new THREE.Group();g.position.set(x*s,0,z*s);g.rotation.y=-ry+(s<0?Math.PI:0);g.userData.dyn=1;scene.add(g);
  const sh=new THREE.Shape();sh.moveTo(-l/2,-w/2);sh.lineTo(l*.25,-w/2);sh.quadraticCurveTo(l*.45,-w*.35,l/2,0);sh.quadraticCurveTo(l*.45,w*.35,l*.25,w/2);sh.lineTo(-l/2,w/2);sh.lineTo(-l/2,-w/2);
  const hg=new THREE.ExtrudeGeometry(sh,{depth:1.1,bevelEnabled:false}).rotateX(-Math.PI/2);hg.translate(0,-.55,0);const col=hash(x|0,z|0)<.5?[.6,.15,.1]:[.12,.25,.4];
  hg.setAttribute('color',new THREE.Float32BufferAttribute(new Array(hg.attributes.position.count).fill(col).flat(),3));
  const hull=new THREE.Mesh(hg,paintMat),cab=new THREE.Mesh(boxUV(l*.3,1,w*.6,1),paintMat);cab.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(cab.geometry.attributes.position.count*3).fill(.85),3));cab.position.set(-l*.15,1.05,0);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),KIT.lampMat);lamp.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(lamp.geometry.attributes.position.count).fill([2.5,2,1.2]).flat(),3));lamp.position.set(-l*.15,1.7,0);
  g.add(hull,cab,lamp);for(const o of[hull,cab]){o.castShadow=true;o.receiveShadow=true;o.userData.dyn=1;}g.userData.bob=hash(x|0,z|0)*6;BOATS_G.push(g);}
for(const [cx] of CRANES)for(const s of[1,-1]){const X=cx*s,mgS=KIT.mg(paintMat),col=K_YEL;
  for(const dx of[-3.6,3.6])for(const dz of[-4.6,-.8]){mgS.add(boxUV(.9,30,.9,2),M(X+dx*s,QY+15,(-14+dz)*s),col);}
  for(const dz of[-4.6,-.8])mgS.add(boxUV(8.2,.8,.8,2),M(X,QY+12,(-14+dz)*s),col);for(const dx of[-3.6,3.6])mgS.add(boxUV(.8,.8,4.6,2),M(X+dx*s,QY+20,(-14-2.7)*s),col);
  mgS.add(boxUV(8.6,.2,5.2,1),M(X,CR_Y-.1,(-14-2.7)*s),K_DARK);mgS.add(boxUV(4,3,3.2,2),M(X+1.8*s,CR_Y+1.5,(-14-3.4)*s),C(0xc8c0a8));KIT.block({cx:X+1.8*s,cz:(-14-3.4)*s,ry:0,l:4,w:3.2},CR_Y-.1,CR_Y+3,{top:false});
  // the boom: out over the basin to the ship and back over the quay, the cab under it, the cables and the hook with a container on it
  mgS.add(boxUV(1.6,1.6,46,2),M(X,QY+28,(-14+6)*s),col);mgS.add(boxUV(3.2,2.4,3.2,2),M(X,QY+25.6,(4)*s),C(0xc8c0a8));
  for(const dx of[-.4,.4])mgS.add(new THREE.CylinderGeometry(.03,.03,14,4),M(X+dx,QY+19,4*s),K_DARK);mgS.add(boxUV(6,2.6,2.5,2),M(X,QY+10.7,4*s,0,.3,0),C(0x2a6a9a));
  KIT.mg(KIT.lampMat).add(boxUV(.5,.15,.5,1),M(X,QY+26.8,4*s),C(0xffd080).multiplyScalar(2));
  for(const z of[-14,6,26])KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.2,8,6),M(X,QY+29,(z-14+14)*s*0+((-14+6)+(z-6))*s*1),C(0xff3030).multiplyScalar(3));}
for(const W of WARE)for(const s of[1,-1]){const [x0,x1,z0,z1]=s>0?W.slice(0,4):mirR(W),h=W[4],w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
  const g=boxUV(w,h-QY,d,4);KIT.mg(corrMat).add(g,M(cx,(h+QY)/2,cz),C(hash(x0|0,z0|0)<.5?0x6a7a86:0x8a6a5a));KIT.mg(steelMat).add(boxUV(w+.3,.25,d+.3,2),M(cx,h,cz),K_DARK);
  // the roller doors on the quay side, numbers painted, a strip of high windows lit
  const zf=s>0?z1:z0,o=s>0?.02:-.02;for(let k=0;k<Math.floor(w/7);k++){const x=x0+3.5+k*7;KIT.mg(corrMat).add(boxUV(4.6,4.2,.1,2),M(x,QY+2.1,zf+o*3),C(0x9a9284));
    KIT.mg(KIT.lampMat).add(boxUV(4.8,.12,.1,1),M(x,QY+4.35,zf+o*4),C(SODIUM).multiplyScalar(1.4));}
  for(let x=x0+1;x<x1-1;x+=2)KIT.mg(KIT.lampMat).add(boxUV(1.4,.5,.06,1),M(x,h-1.4,zf+o*3),hash(x|0,z0|0)<.6?C(0xffc080).multiplyScalar(1.2):C(0x202830));
  const t=KIT.neonTex('NO. '+(10+(hash(x0|0,s+2)*80|0)),0xe8e4d8,{w:256,h:96,frame:false,bg:'rgba(0,0,0,0)'});const m=new THREE.Mesh(new THREE.PlaneGeometry(4,1.5),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.7}));
  m.position.set(x0+3,h-2.8,zf+o*5);m.rotation.y=s>0?0:Math.PI;m.userData.dyn=1;scene.add(m);}
for(const [p0,p1,h] of HB_PARA){const L=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),ry=Math.atan2(-(p1[1]-p0[1]),p1[0]-p0[0]);KIT.mg(paintMat).add(boxUV(L,.8,.25,2),M((p0[0]+p1[0])/2,h+.4,(p0[1]+p1[1])/2,0,ry,0),C(0x5a5e64));}
{const CC=[0xb83a2a,0x2a6ab0,0x2a8a5a,0xd88a2a,0x6a6a72,0x8a2a6a].map(C);
 for(const B of BOXES)for(let k=0;k<B.n;k++){const y=QY+k*2.6+1.3,col=CC[(hash(B.cx*3|0,B.cz*5|0+k)*CC.length)|0];KIT.mg(corrMat).add(boxUV(6,2.55,2.45,3),M(B.cx,y,B.cz,0,B.ry,0),col);
   for(let j=-2;j<=2;j++){const c=Math.cos(B.ry),sn=Math.sin(B.ry);KIT.mg(steelMat).add(boxUV(.1,2.6,2.5,1),M(B.cx+c*j*1.45,y,B.cz-sn*j*1.45,0,B.ry,0),tmpC.copy(col).multiplyScalar(.6).clone());}}}
for(const W of S3.walls)if(W.y0===QY-.1&&W.y1<QY+1.3&&W.hw<.7&&W.hd<.7){const ry=Math.atan2(-W.uz,W.ux);KIT.mg(woodMat).add(boxUV(W.hw*2,W.y1-W.y0,W.hd*2,1),M(W.x,(W.y0+W.y1)/2,W.z,0,ry,0),C(0x6a5034));}
for(const o of OBST)if(o.r<.35&&o.h<1)KIT.mg(steelMat).add(new THREE.CylinderGeometry(o.r*.8,o.r,o.h,10),M(o.x,o.y0+o.h/2,o.z),C(0x1a1c20));
// the bases' pads: a ring of the side's light on the concrete, a harbour master's hut behind
for(const B of GS.BASES){const TC=C(GS.TEAMS[B.team].c).multiplyScalar(2.2);KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(B.r-.3,B.r,48).rotateX(-Math.PI/2),M(B.x,QY+.02,B.z),TC);
  KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(2.6,3,3).rotateX(-Math.PI/2),M(B.x,QY+.03,B.z,0,B.fx>0?-Math.PI/2:Math.PI/2,0),TC);
  const hx=B.x-B.fx*6.3,hz=-5.6*B.fx;KIT.block([hx-1.6,hx+1.6,hz-1.6,hz+1.6],QY-.1,QY+3);KIT.mg(paintMat).add(boxUV(3.2,3,3.2,1),M(hx,QY+1.5,hz),C(0xd8d0c0));
  KIT.mg(KIT.lampMat).add(boxUV(3.3,.15,3.3,1),M(hx,QY+3.05,hz),TC);}

/* ---------- the water: a dark swell, the lights' long reflections on it, rings where the rain hits ---------- */
const HB_WATER=(()=>{const g=new THREE.PlaneGeometry(1600,1600,1,1).rotateX(-Math.PI/2);
  const U={uT:{value:0},fogColor:{value:scene.fog.color},fogDensity:{value:scene.fog.density},beam:{value:new THREE.Vector3(1,0,0)},env:{value:HB_ENV}};
  const mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`varying vec3 vW;varying float vD;uniform float uT,fogDensity;uniform vec3 fogColor,beam;uniform samplerCube env;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){vec2 p=vW.xz;float e=.12;
        float w1=n(p*.35+vec2(uT*.25,uT*.12))+n(p*.9-vec2(uT*.4,-uT*.2))*.5+n(p*2.3+uT*.7)*.25;
        float wx=n((p+vec2(e,0.0))*.35+vec2(uT*.25,uT*.12))+n((p+vec2(e,0.0))*.9-vec2(uT*.4,-uT*.2))*.5;float wz=n((p+vec2(0.0,e))*.35+vec2(uT*.25,uT*.12))+n((p+vec2(0.0,e))*.9-vec2(uT*.4,-uT*.2))*.5;
        vec3 N=normalize(vec3((w1-wx)*1.6,1.0,(w1-wz)*1.6));
        // rain rings
        vec2 q=p*1.6;vec2 c=floor(q);float r=0.0;for(int i=0;i<4;i++){vec2 o=vec2(float(i/2),float(i-(i/2)*2));vec2 k=c+o;float t=fract(uT*1.1+h(k));float d=length(q-k-vec2(h(k+3.1),h(k+7.7)));r+=smoothstep(.05,0.0,abs(d-t*.5))*(1.0-t);}
        vec3 V=normalize(cameraPosition-vW);vec3 Rf=reflect(-V,N);vec3 refl=textureCube(env,Rf).rgb;float fr=.04+.96*pow(1.0-max(dot(N,V),0.0),5.0);
        vec3 col=vec3(.004,.01,.016)+refl*(.06+fr*.55)+r*vec3(.03,.035,.04);
        // the lighthouse's beam where it crosses the water
        vec2 bd=normalize(beam.xz);vec2 rel=vW.xz-vec2(150.0,-260.0);float along=dot(rel,bd);float across=abs(rel.x*bd.y-rel.y*bd.x);col+=vec3(.5,.55,.6)*smoothstep(28.0,0.0,across-along*.08)*step(0.0,along)*exp(-along*.004)*.5;
        float f=1.0-exp(-fogDensity*fogDensity*vD*vD);gl_FragColor=vec4(mix(col,fogColor,f),.93);}`});
  const m=new THREE.Mesh(g,mat);m.renderOrder=1;m.userData.dyn=1;scene.add(m);return{U};})();

/* ---------- the far side: the harbour's other quays, Tide City over it, the Vigil's lighthouse out on the breakwater, the sky ---------- */
{const ring=[];for(let x=-80;x<=80;x+=16)for(const z of[-46,46])ring.push([x+R(-3,3),z+R(-3,3),R(10,16),R(8,12),R(7,14)]);for(let z=-30;z<=30;z+=15)for(const x of[-70,70])ring.push([x+R(-3,3),z,R(8,12),R(10,14),R(8,18)]);
 for(const [x,z,w,d,h] of ring){KIT.mg(corrMat).add(boxUV(w,h,d,4),M(x,QY+h/2,z),C(hash(x|0,z|0)<.5?0x4a5660:0x5a4a44));for(let k=0;k<3;k++)KIT.mg(KIT.lampMat).add(boxUV(w*.8,.3,.1,1),M(x,QY+h*.5+k*1.2,z+(z<0?d/2+.06:-d/2-.06)),hash(x|0,k)<.4?C(0xffc080).multiplyScalar(1.3):C(0x182028));}
 if(typeof SKYLINE!=='undefined'){const S=SKYLINE.build({n:coarse?30:54,seed:77,h:240,w:44,water:0,lit:.55,rings:true,traffic:coarse?10:24,place:(i,r)=>{const a=Math.PI*(.15+.7*(i/(coarse?30:54)))+r()*.05,d=230+r()*380;return[Math.cos(a)*d,-Math.sin(a)*d-40,1-(d-230)/380];}});
   S.G.traverse(o=>{o.userData.dyn=1;});scene.add(S.G);CITY.ticks.push((dt,T)=>S.update&&S.update(T));}
 const sky=new THREE.Mesh(new THREE.SphereGeometry(3000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uT:{value:0}},
   vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`varying vec3 vD;uniform float uT;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
     void main(){float y=vD.y;vec2 p=vD.xz/(y+.2)*2.0+vec2(uT*.015,0.0);float c=n(p)*.55+n(p*2.3)*.3+n(p*5.1)*.15;vec3 col=mix(vec3(.11,.07,.05),vec3(.01,.015,.03),smoothstep(-.05,.5,y));
       col+=vec3(.06,.05,.05)*c*smoothstep(.0,.3,y);float st=step(.997,h(floor(vD.xz*300.0+vD.y*77.0)))*smoothstep(.2,.6,y)*(1.0-c);col+=vec3(st*.6);gl_FragColor=vec4(col,1.0);}`}));
 sky.renderOrder=-5;sky.userData.dyn=1;const sg=new THREE.Group();sg.add(sky);scene.add(sg);CITY.skies.push(sg);CITY.ticks.push((dt,T)=>{sky.material.uniforms.uT.value=T;});}
const HB_LIGHTHOUSE=(()=>{const LP=new THREE.Vector3(150,0,-260),H=46;const mg=KIT.mg(paintMat);
  mg.add(new THREE.CylinderGeometry(3,4.4,H,16),M(LP.x,H/2,LP.z),C(0xe8e4dc));for(let k=0;k<4;k++)mg.add(new THREE.CylinderGeometry(3.05+(.35*(4-k)/4),3.1+(.35*(4-k)/4),3,16),M(LP.x,6+k*10,LP.z),C(0xb8302a));
  mg.add(new THREE.CylinderGeometry(3.6,3.6,.6,16),M(LP.x,H,LP.z),K_DARK);mg.add(new THREE.CylinderGeometry(2.2,2.2,3.2,12),M(LP.x,H+1.9,LP.z),C(0x1a1c22));mg.add(new THREE.ConeGeometry(2.6,2,12),M(LP.x,H+4.4,LP.z),C(0xb8302a));
  // the breakwater it stands on
  mg.add(boxUV(14,3,180,6),M(LP.x-30,1,LP.z+80,0,.35,0),C(0x5a5a56));
  const lamp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xfff4e0).multiplyScalar(6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));lamp.position.set(LP.x,H+1.9,LP.z);lamp.scale.setScalar(16);lamp.userData.dyn=1;scene.add(lamp);
  // the beam: a long cone you can see in the haze, and the light it throws onto whatever it crosses
  const beamG=new THREE.CylinderGeometry(.6,22,520,24,1,true).rotateZ(-Math.PI/2).translate(260,0,0),cols=[];const P=beamG.attributes.position;for(let i=0;i<P.count;i++){const k=1-clamp(P.getX(i)/520,0,1);cols.push(k,k,k);}beamG.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  const beam=new THREE.Mesh(beamG,new THREE.MeshBasicMaterial({vertexColors:true,color:C(0xeef4ff),transparent:true,opacity:.09,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));beam.position.set(LP.x,H+1.9,LP.z);beam.userData.dyn=1;scene.add(beam);
  const sp=new THREE.SpotLight(C(0xf4f8ff),coarse?7:10,700,.07,.6,1.0);sp.position.set(LP.x,H+1.9,LP.z);scene.add(sp,sp.target);
  const PERIOD=12;CITY.ticks.push((dt,T)=>{const a=T/PERIOD*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a);beam.rotation.set(0,-a,-.045);sp.target.position.set(LP.x+dx*400,-10,LP.z+dz*400);HB_WATER.U.beam.value.set(dx,0,dz);
    // the beam is only worth the light on the map when it's turned toward it
    const toward=Math.max(0,(dx*(-LP.x)+dz*(-LP.z))/LP.length());sp.intensity=(coarse?7:10)*Math.pow(toward,6)*1.4;});return{LP};})();

/* ---------- light: sodium lamps on the quays, the crane and ship lights, a pale moon through haze ---------- */
hemi.color.copy(C(0x3a4a6a));hemi.groundColor.copy(C(0x2a1a10));hemi.intensity=.7;
keyLight.color.copy(C(0x9ab0d8));keyLight.intensity=.45;keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(keyLight.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:400});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.05;
keyLight.position.set(80,150,60);keyLight.target.position.set(0,0,0);
{const LAMPS=[[-40,-15],[-30,-15.6],[-2,-19],[16,-15.6],[30,-15.6],[-22,-30],[10,-21],[-50,-14],[40,-25]];
 for(const [x,z] of LAMPS)for(const s of[1,-1]){const X=x*s,Z=z*s;KIT.post(X,Z,.15,QY,9,false);KIT.mg(steelMat).add(new THREE.CylinderGeometry(.1,.16,9,8),M(X,QY+4.5,Z),K_DARK);KIT.mg(steelMat).add(boxUV(1.2,.12,.4,1),M(X,QY+9,Z),K_DARK);
   KIT.mg(KIT.lampMat).add(boxUV(.9,.08,.3,1),M(X,QY+8.92,Z),C(SODIUM).multiplyScalar(2.4));}
 const LL=coarse?LAMPS.slice(0,4):LAMPS;for(const [x,z] of LL)for(const s of(coarse?[1]:[1,-1])){const L=new THREE.PointLight(C(SODIUM),1.7,24,1.6);L.position.set(x*s,QY+8.4,z*s);scene.add(L);}
 for(const s of[1,-1]){const L=new THREE.PointLight(C(0xfff0d8),1.3,18,1.7);L.position.set(-14*s,DECK_Y+4,0);scene.add(L);}
 for(const B of GS.BASES){const L=new THREE.PointLight(C(GS.TEAMS[B.team].c),1.6,22,1.6);L.position.set(B.x-B.fx*3,QY+4,B.z);scene.add(L);}}

/* ---------- the weather, the water's sounds; wading slows you ---------- */
KIT.rain({n:coarse?600:1500,col:0x9ab0c8,op:.32,slant:[.6,1.4]});
const HB_SND=KIT.sound([{f:[['highpass',500],['lowpass',4200]],v:.08},{f:[['lowpass',420]],v:.12,swell:.55,rate:.35}]);
{let next=R(16,30);CITY.ticks.push(dt=>{next-=dt;if(next<=0){next=R(35,70);HB_SND.tone(110,108,4.5,.07,'sawtooth');setTimeout(()=>HB_SND.tone(82,80,5,.06,'sawtooth'),1200);}});}   // a ship's horn somewhere out in the harbour
{const prev=new Map(),slow=(o,p)=>{const q=prev.get(o);if(q&&p.y<WATER_FLOOR+.6&&inBasin(p.x,p.z)){p.x=q.x+(p.x-q.x)*.55;p.z=q.z+(p.z-q.z)*.55;}prev.set(o,{x:p.x,z:p.z});};
 CITY.ticks.push(()=>{if(typeof P!=='undefined'&&P.pos)slow(P,P.pos);if(typeof BOTS!=='undefined')for(const B of BOTS)slow(B,B.pos);
   for(const g of BOATS_G){g.position.y=Math.sin(performance.now()/1000*.8+g.userData.bob)*.06;g.rotation.z=Math.sin(performance.now()/1000*.6+g.userData.bob)*.03;}});}
CITY.ticks.push((dt,T)=>{HB_WATER.U.uT.value=T;});
GS.indoorAt=()=>{const c=camera.position;for(const [h0,h1] of SHIP.holds)if(c.x>h0&&c.x<h1&&Math.abs(c.z)<4.3&&c.y<DECK_Y-.3)return 1;return 0;};

KIT.flush();

/* ---------- the bots' map ---------- */
const NAV=KIT.nav({step:2.2,perchY:2.5});
GS.HILLS=[{x:0,z:-6},{x:0,z:6},{x:-13,z:0},{x:13,z:0},{x:-6,z:-17},{x:6,z:17},{x:-28,z:-10},{x:28,z:10},{x:-8,z:-28},{x:8,z:28},{x:-24,z:-29},{x:24,z:29}];
GS.RACKS=[{x:-2,z:-20},{x:2,z:20}];
GS.INTRO=[[[-30,3.2,-10],[0,6,0]],[[-10,9,-18],[12,5,2]],[[0,10.5,6],[24,6,0]],[[30,11,-26],[50,3,0]]];
