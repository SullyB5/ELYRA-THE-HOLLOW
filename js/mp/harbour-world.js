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
const HB_RAILS=[KIT.rail(-5,-3,.6,-3,8.8,.9),KIT.rail(-.6,3,5,3,8.8,.9),KIT.rail(-5,-3,-5,3,8.8,.9),KIT.rail(5,-3,5,3,8.8,.9)];
// deck clutter: hatch covers stacked aside, winches, bollards
const DECK_CLUT=[[-21.5,1.6,1.8,1.4,1.1],[-6.4,-3.8,1.1,.9,.9],[-16.6,3.6,2.4,1,.8]];
for(const [x,z,l,w,h] of DECK_CLUT)for(const s of[1,-1])KIT.block({cx:x*s,cz:z*s,ry:0,l,w},DECK_Y-.1,DECK_Y+h);
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
  for(const [ax,az,bx,bz] of[[-4.3,-5.3,4.3,-5.3],[-4.3,-.1,4.3,-.1],[4.3,-5.3,4.3,-.1]])HB_RAILS.push(KIT.rail(X+ax*s,(-14+az)*s,X+bx*s,(-14+bz)*s,CR_Y));
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
const CRATES=[[-36,-17,1.2,1.1],[-42,-31,1.2,1],[31,-16.4,1.1,1],[6,-19,1.2,1.2],[-26,-21,1.1,1.1],[44,-12.6,1.2,1.2]];
for(const [x,z,l,h] of CRATES)for(const s of[1,-1])KIT.block({cx:x*s,cz:z*s,ry:hash(x|0,z|0),l,w:l},QY-.1,QY+h);

/* ---------- the new solid props (Nov 8 graphics pass): pallet stacks you step onto, oil drums, rooftop plant, the crane bogies ---------- */
const PALLETS=[[-14.2,-33,0,.45],[12,-23.6,.3,.3],[-46,-32.4,.1,.45],[-33.4,-30.2,1.57,.3],[19,-27.6,0,.3]];   // [x,z,ry,h]
for(const [x,z,ry,h] of PALLETS)for(const s of[1,-1])KIT.block({cx:x*s,cz:z*s,ry,l:1.25,w:1.05},QY-.1,QY+h);
const DRUMS=[[19.6,-34.5],[20.3,-33.9],[19.4,-33.7],[-32.2,-33.2],[-32.9,-33.8],[34.5,-24.6],[35.2,-24.1],[-45.6,-29.6]];
for(const [x,z] of DRUMS)for(const s of[1,-1])KIT.post(x*s,z*s,.3,QY,.9);
const BOGIES=[];for(const [cx] of CRANES)for(const s of[1,-1])for(const dx of[-3.6,3.6])for(const dz of[-4.6,-.8]){const x=(cx+dx)*s,z=(-14+dz)*s;KIT.block({cx:x,cz:z,ry:0,l:2.2,w:.9},QY,QY+1.1,{top:false});BOGIES.push([x,z]);}
// rooftop plant: an air handler on each warehouse roof in the corner furthest from the stairs, two turbine vents
const ROOF_PLANT=[];
for(const W of WARE)for(const s of[1,-1]){const [x0,x1,z0,z1]=s>0?W.slice(0,4):mirR(W),h=W[4];let best=null,bd=-1;
  for(const [cx,cz] of[[x0+1.6,z0+1.4],[x1-1.6,z0+1.4],[x0+1.6,z1-1.4],[x1-1.6,z1-1.4]]){let d=1e9;for(const R of KIT.PAIRS)for(const a of[0,R.L]){if(Math.abs(R.hAt(a)-h)>1)continue;d=Math.min(d,Math.hypot(R.P0[0]+R.ux*a-cx,R.P0[1]+R.uz*a-cz));}if(d>bd){bd=d;best=[cx,cz];}}
  if(bd>5){KIT.block({cx:best[0],cz:best[1],ry:0,l:2,w:1.4},h-.1,h+1.1);ROOF_PLANT.push([best[0],best[1],h]);}
  const vx=lerp(x0,x1,.5),vz=lerp(z0,z1,.5);for(const k of[-1,1]){const x=vx+k*(x1-x0)*.22;if(!nearRampH(x,vz,h,1.2)){KIT.post(x,vz,.32,h,.9);ROOF_PLANT.push([x,vz,h,1]);}}}

/* ---------- textures: painted on canvases at load ---------- */
const TQ=coarse?256:512;
let _ts=91;const tr=()=>(_ts=_ts*16807%2147483647)/2147483647,trr=(a,b)=>a+tr()*(b-a);
function canv(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);return c;}
function ctex(c,srgb){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb)t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;return t;}
// a normal map from a height canvas (red channel, white = high)
function nmapOf(c,str){const w=c.width,h=c.height,s=c.getContext('2d').getImageData(0,0,w,h).data,H=(x,y)=>s[((((y%h)+h)%h)*w+(((x%w)+w)%w))*4]/255;
  return ctex(canv(w,h,g=>{const im=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(H(x+1,y)-H(x-1,y))*str,dy=(H(x,y+1)-H(x,y-1))*str,l=Math.hypot(dx,dy,1),o=(y*w+x)*4;
    im.data[o]=(-dx/l*.5+.5)*255;im.data[o+1]=(dy/l*.5+.5)*255;im.data[o+2]=(1/l*.5+.5)*255;im.data[o+3]=255;}g.putImageData(im,0,0);}),false);}
function blot(g,w,h,n,col,a0,a1,r0,r1){g.fillStyle=col;for(let i=0;i<n;i++){g.globalAlpha=trr(a0,a1);g.beginPath();g.ellipse(tr()*w,tr()*h,trr(r0,r1),trr(r0,r1),tr()*3,0,7);g.fill();}g.globalAlpha=1;}
function grit(g,w,h,n,a){for(let i=0;i<n;i++){const v=tr()<.5?0:255;g.fillStyle=`rgba(${v},${v},${v},${a*tr()})`;g.fillRect(tr()*w,tr()*h,1+tr()*1.5,1+tr()*1.5);}}
function streaks(g,w,h,n,col,a,len){for(let i=0;i<n;i++){const x=tr()*w,y=tr()*h*.6,l=len*trr(.3,1),wd=Math.max(1,trr(.6,2.5)*w/256),gr=g.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,col.replace('A',a*trr(.4,1)));gr.addColorStop(1,col.replace('A',0));g.fillStyle=gr;g.fillRect(x,y,wd,l);}}
// the quay: 2 m cast slabs, joints, oil, grit, tyre scuffs (a tile is 4 m)
const QUAY_T=(()=>{const S=TQ,j=S/2;
  const col=canv(S,S,(g)=>{g.fillStyle='#7f7c75';g.fillRect(0,0,S,S);for(let a=0;a<2;a++)for(let b=0;b<2;b++){const v=trr(-14,14)|0;g.fillStyle=`rgba(${v>0?255:0},${v>0?250:0},${v>0?240:0},${Math.abs(v)/120})`;g.fillRect(a*j,b*j,j,j);}
    blot(g,S,S,S*1.5,'#4a4843',.04,.14,S*.01,S*.07);blot(g,S,S,S,'#a8a49a',.03,.1,S*.005,S*.03);
    for(let i=0;i<5;i++){const x=tr()*S,y=tr()*S,r=trr(.03,.1)*S,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(18,16,14,.55)');gr.addColorStop(1,'rgba(18,16,14,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r,r*trr(.5,1),tr()*3,0,7);g.fill();}
    g.strokeStyle='rgba(20,20,20,.12)';g.lineWidth=S*.025;for(let i=0;i<3;i++){g.beginPath();const y=tr()*S;g.moveTo(0,y);g.bezierCurveTo(S*.3,y+trr(-40,40),S*.6,y+trr(-40,40),S,y);g.stroke();}
    grit(g,S,S,S*S/40,.25);
    g.fillStyle='#2b2a27';for(const p of[0,j]){g.fillRect(p,0,Math.max(2,S/170),S);g.fillRect(0,p,S,Math.max(2,S/170));}
    g.strokeStyle='rgba(30,28,26,.6)';g.lineWidth=1;for(let i=0;i<10;i++){g.beginPath();let x=tr()*S,y=tr()*S;g.moveTo(x,y);for(let k=0;k<6;k++){x+=trr(-14,14);y+=trr(-14,14);g.lineTo(x,y);}g.stroke();}});
  const hgt=canv(S,S,(g)=>{g.fillStyle='#b0b0b0';g.fillRect(0,0,S,S);blot(g,S,S,S*2,'#808080',.1,.3,S*.004,S*.02);grit(g,S,S,S*S/30,.5);g.fillStyle='#202020';for(const p of[0,j]){g.fillRect(p-1,0,Math.max(3,S/120),S);g.fillRect(0,p-1,S,Math.max(3,S/120));}});
  return{map:ctex(col,true),n:nmapOf(hgt,coarse?2.5:4)};})();
// the quay's face: big dressed blocks, wet and stained
const FACE_T=(()=>{const S=TQ/2;const col=canv(S,S,(g)=>{g.fillStyle='#5c5850';g.fillRect(0,0,S,S);const rows=4,bh=S/rows;
    for(let r=0;r<rows;r++){const off=(r%2)*S/4;for(let k=-1;k<3;k++){const v=trr(-18,18)|0;g.fillStyle=`rgb(${92+v},${88+v},${80+v})`;g.fillRect(off+k*S/2+2,r*bh+2,S/2-4,bh-4);}}
    blot(g,S,S,S,'#2a2a26',.05,.2,S*.01,S*.05);streaks(g,S,S,30,'rgba(40,30,20,A)',.35,S*.5);grit(g,S,S,S*S/30,.3);});
  const hgt=canv(S,S,(g)=>{g.fillStyle='#202020';g.fillRect(0,0,S,S);const rows=4,bh=S/rows;g.fillStyle='#c0c0c0';for(let r=0;r<rows;r++){const off=(r%2)*S/4;for(let k=-1;k<3;k++)g.fillRect(off+k*S/2+3,r*bh+3,S/2-6,bh-6);}grit(g,S,S,S*S/20,.4);});
  return{map:ctex(col,true),n:nmapOf(hgt,3)};})();
// corrugated cladding (warehouses): ribs every 25 cm, streaks and rust (a tile is 4 m)
const CORR_T=(()=>{const S=256,rib=x=>{const t=(x/S*16)%1;return t<.35?1:t<.5?1-(t-.35)/.15:t<.85?0:(t-.85)/.15;};
  const col=canv(S,S,(g)=>{for(let x=0;x<S;x++){const v=150+70*rib(x)-25*(1-rib(x+2));g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,0,1,S);}
    streaks(g,S,S,60,'rgba(60,40,20,A)',.4,S*.8);streaks(g,S,S,30,'rgba(20,20,20,A)',.35,S);blot(g,S,S,40,'#6a4020',.05,.2,2,8);grit(g,S,S,3000,.2);});
  const hgt=canv(S,S,(g)=>{for(let x=0;x<S;x++){const v=255*rib(x);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,0,1,S);}});
  return{map:ctex(col,true),n:nmapOf(hgt,1.6)};})();
// roller doors: horizontal slats, the bottom kicked and dirty, a painted number
const ROLL_T=(()=>{const S=256;const col=canv(S,S,(g)=>{for(let y=0;y<S;y++){const t=(y/S*28)%1,v=165+40*Math.sin(t*Math.PI)-(t>.9?50:0);g.fillStyle=`rgb(${v},${v-2},${v-6})`;g.fillRect(0,y,S,1);}
    const gr=g.createLinearGradient(0,S*.7,0,S);gr.addColorStop(0,'rgba(40,30,20,0)');gr.addColorStop(1,'rgba(40,30,20,.7)');g.fillStyle=gr;g.fillRect(0,0,S,S);streaks(g,S,S,20,'rgba(80,50,30,A)',.3,S*.4);grit(g,S,S,2000,.25);
    g.fillStyle='#d8a630';g.fillRect(0,S-10,S,10);g.fillStyle='#1a1a1a';for(let x=-10;x<S;x+=24){g.beginPath();g.moveTo(x,S);g.lineTo(x+12,S-10);g.lineTo(x+22,S-10);g.lineTo(x+10,S);g.fill();}});
  const hgt=canv(S,S,(g)=>{for(let y=0;y<S;y++){const t=(y/S*28)%1,v=255*Math.sin(t*Math.PI);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(0,y,S,1);}});
  const t=ctex(col,true);return{map:t,n:nmapOf(hgt,2)};})();
// tar roofs: membrane sheets, lapped seams, patches, ponding
const ROOF_T=(()=>{const S=TQ/2;const col=canv(S,S,(g)=>{g.fillStyle='#34363a';g.fillRect(0,0,S,S);for(let k=0;k<4;k++){const v=trr(-8,8)|0;g.fillStyle=`rgb(${52+v},${54+v},${58+v})`;g.fillRect(0,k*S/4+2,S,S/4-2);}
    g.fillStyle='rgba(15,15,16,.6)';for(let k=0;k<4;k++)g.fillRect(0,k*S/4,S,2);blot(g,S,S,10,'#22242a',.3,.6,S*.02,S*.1);blot(g,S,S,60,'#50504c',.05,.2,S*.01,S*.03);grit(g,S,S,S*S/20,.3);
    for(let i=0;i<4;i++){g.fillStyle='rgba(70,70,68,.6)';g.fillRect(tr()*S,tr()*S,trr(12,40),trr(10,30));}});
  const hgt=canv(S,S,(g)=>{g.fillStyle='#808080';g.fillRect(0,0,S,S);g.fillStyle='#ffffff';for(let k=0;k<4;k++)g.fillRect(0,k*S/4,S,3);grit(g,S,S,S*S/10,.5);});
  return{map:ctex(col,true),n:nmapOf(hgt,1.5)};})();
// the ship's deck: green non-slip paint on welded plates, worn to rust along the walkways (a tile is 4 m)
const DECK_T=(()=>{const S=TQ,pp=S*1.5/4;const col=canv(S,S,(g)=>{g.fillStyle='#4f5a4b';g.fillRect(0,0,S,S);blot(g,S,S,S/2,'#3c4439',.1,.3,S*.01,S*.06);blot(g,S,S,S/3,'#6a6f5c',.05,.18,S*.01,S*.04);
    blot(g,S,S,S/4,'#6a3c22',.15,.5,S*.003,S*.02);grit(g,S,S,S*S/16,.3);g.fillStyle='rgba(20,22,18,.7)';for(let k=0;k*pp<S;k++){g.fillRect(k*pp,0,2,S);g.fillRect(0,k*pp*.66,S,2);}
    g.fillStyle='rgba(120,70,40,.35)';for(let k=0;k*pp<S;k++)g.fillRect(k*pp+2,0,1,S);});
  const hgt=canv(S,S,(g)=>{g.fillStyle='#909090';g.fillRect(0,0,S,S);grit(g,S,S,S*S/6,.6);g.fillStyle='#ffffff';for(let k=0;k*pp<S;k++){g.fillRect(k*pp-1,0,3,S);g.fillRect(0,k*pp*.66-1,S,3);}});
  return{map:ctex(col,true),n:nmapOf(hgt,3)};})();
// the house's white paint: plate seams, rust run from the welds and portholes (a tile is 2 m)
const HOUSE_T=(()=>{const S=256;const col=canv(S,S,(g)=>{g.fillStyle='#dcd8ce';g.fillRect(0,0,S,S);blot(g,S,S,60,'#c4bfb2',.1,.3,4,20);g.fillStyle='rgba(90,85,75,.5)';g.fillRect(0,S/2,S,1);g.fillRect(S*.6,0,1,S);
    streaks(g,S,S,30,'rgba(120,70,40,A)',.45,S*.6);streaks(g,S,S,20,'rgba(60,60,60,A)',.2,S);grit(g,S,S,3000,.15);});
  const hgt=canv(S,S,(g)=>{g.fillStyle='#808080';g.fillRect(0,0,S,S);g.fillStyle='#ffffff';g.fillRect(0,S/2-1,S,3);g.fillRect(S*.6-1,0,3,S);});
  return{map:ctex(col,true),n:nmapOf(hgt,2)};})();
// crates: planks in a frame, a stencil
const CRATE_T=(()=>{const S=TQ/2;const col=canv(S,S,(g)=>{g.fillStyle='#8a6a44';g.fillRect(0,0,S,S);const n=6;for(let k=0;k<n;k++){const v=trr(-20,20)|0;g.fillStyle=`rgb(${138+v},${106+v},${68+v})`;g.fillRect(0,k*S/n+1,S,S/n-2);
      g.strokeStyle='rgba(60,40,20,.25)';for(let i=0;i<8;i++){g.beginPath();const y=k*S/n+tr()*S/n;g.moveTo(0,y);g.bezierCurveTo(S*.3,y+trr(-3,3),S*.7,y+trr(-3,3),S,y);g.stroke();}}
    const b=S*.1;g.fillStyle='#a07a4c';g.fillRect(0,0,S,b);g.fillRect(0,S-b,S,b);g.fillRect(0,0,b,S);g.fillRect(S-b,0,b,S);g.save();g.translate(S/2,S/2);g.rotate(Math.PI/4);g.fillRect(-S*.7,-b/2,S*1.4,b);g.restore();
    g.strokeStyle='rgba(40,25,10,.6)';g.lineWidth=2;g.strokeRect(b,b,S-2*b,S-2*b);g.fillStyle='rgba(20,20,20,.75)';g.font=`700 ${S*.09}px monospace`;g.textAlign='center';g.fillText('KEEPER · SUPPLY',S/2,S*.32);g.fillText('▲ THIS WAY UP ▲',S/2,S*.74);
    for(const [x,y] of[[b/2,b/2],[S-b/2,b/2],[b/2,S-b/2],[S-b/2,S-b/2]]){g.fillStyle='#3a3a3a';g.beginPath();g.arc(x,y,S*.012,0,7);g.fill();}grit(g,S,S,2000,.2);});
  const hgt=canv(S,S,(g)=>{g.fillStyle='#808080';g.fillRect(0,0,S,S);const n=6;g.fillStyle='#202020';for(let k=0;k<=n;k++)g.fillRect(0,k*S/n-1,S,2);const b=S*.1;g.fillStyle='#e0e0e0';g.fillRect(0,0,S,b);g.fillRect(0,S-b,S,b);g.fillRect(0,0,b,S);g.fillRect(S-b,0,b,S);g.save();g.translate(S/2,S/2);g.rotate(Math.PI/4);g.fillRect(-S*.7,-b/2,S*1.4,b);g.restore();});
  return{map:ctex(col,true),n:nmapOf(hgt,2.5)};})();
// shipping containers: one painted sheet per livery (the long side on the left three quarters, the door end on the right), one shared normal map
const CONT_W=coarse?512:1024,CONT_H=CONT_W/2,CONT_SX=.75;
function contRibs(g,W,H,shade){const sw=W*CONT_SX,n=22,pw=sw/n;
  for(let x=0;x<sw;x++){const t=(x/pw)%1,v=t<.15?t/.15:t<.5?1:t<.65?1-(t-.5)/.15:0;shade(g,x,.5+.5*Math.sin((v-.5)*Math.PI));}
  const dw=W-sw;for(let x=0;x<dw;x++){const t=(x/(dw/12))%1,v=t<.2?.6+t*2:t<.5?1:t<.7?1-(t-.5)*2:.6;shade(g,sw+x,v*.8);}}
const CONT_N=(()=>{const W=CONT_W,H=CONT_H;const c=canv(W,H,(g)=>{contRibs(g,W,H,(g,x,v)=>{g.fillStyle=`rgb(${v*255|0},0,0)`;g.fillRect(x,0,1,H);});
    g.fillStyle='#808080';g.fillRect(0,0,W*CONT_SX,H*.06);g.fillRect(0,H*.94,W*CONT_SX,H*.06);g.fillRect(0,0,W*.012,H);g.fillRect(W*CONT_SX-W*.012,0,W*.012,H);
    g.fillRect(W*CONT_SX,0,W,H*.06);g.fillRect(W*CONT_SX,H*.94,W,H*.06);g.fillStyle='#ffffff';const dw=W*(1-CONT_SX);for(const f of[.18,.36,.64,.82])g.fillRect(W*CONT_SX+dw*f-2,H*.06,4,H*.88);g.fillStyle='#202020';g.fillRect(W*CONT_SX+dw*.5-1,0,2,H);});
  return nmapOf(c,2.2);})();
const CONT_LIV=[[0xa8382a,'KEEPER LINE'],[0x2a5a9a,'TIDEWARD'],[0x2a7450,'HALCYON'],[0xc8742a,'VIGIL FREIGHT'],[0x5e6268,'MERIDIAN'],[0x6e2a38,'ASTRAEA'],[0xc4bfb2,'NORTHGATE'],[0x2a6a74,'SOLACE']];
const CONT_MATS=CONT_LIV.slice(0,coarse?6:8).map(([hex,name],li)=>{const W=CONT_W,H=CONT_H,k=W/1024,base=new THREE.Color(hex),css=a=>`rgb(${base.r*255*a|0},${base.g*255*a|0},${base.b*255*a|0})`;
  const c=canv(W,H,(g)=>{contRibs(g,W,H,(g,x,v)=>{g.fillStyle=css(.84+.2*v);g.fillRect(x,0,1,H);});const sw=W*CONT_SX;
    g.fillStyle=css(.55);g.fillRect(0,0,W,H*.06);g.fillRect(0,H*.94,W,H*.06);g.fillRect(0,0,W*.012,H);g.fillRect(sw-W*.012,0,W*.012,H);
    // the door end: two leaves, four locking bars with their handles, the seal plate
    const dw=W-sw;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(sw+dw*.5-2,H*.06,4,H*.88);for(const f of[.18,.36,.64,.82]){g.fillStyle='#9a9c9e';g.fillRect(sw+dw*f-3*k,H*.06,6*k,H*.88);g.fillStyle='#4a4c4e';g.fillRect(sw+dw*f-7*k,H*(.5+(f>.5?.04:-.04)),14*k,5*k);
      for(const y of[.12,.86]){g.fillStyle='#6a6c6e';g.fillRect(sw+dw*f-6*k,H*y,12*k,10*k);}}
    g.fillStyle='rgba(240,240,236,.9)';g.font=`700 ${20*k}px monospace`;g.textAlign='left';g.fillText(name.slice(0,4).toUpperCase().replace(/\s/g,'X')+'U '+(100000+hash(li,9)*899999|0)+' '+(li%9),sw+dw*.06,H*.17);
    g.font=`${11*k}px monospace`;['MAX GR 30480 KG','TARE 3750 KG','NET 26730 KG','CU.CAP 33.2 M³'].forEach((t,i)=>g.fillText(t,sw+dw*.56,H*(.27+i*.04)));
    // the side: the line's name big, the box number, a data panel, the odd hazard diamond
    g.save();g.scale(1,1.4);g.fillStyle='rgba(244,242,236,.92)';g.font=`800 ${66*k}px ui-sans-serif,Arial,sans-serif`;g.textAlign='center';g.fillText(name,sw*.5,H*.48/1.4);g.restore();
    g.fillStyle='rgba(244,242,236,.85)';g.font=`700 ${22*k}px monospace`;g.textAlign='right';g.fillText(name.slice(0,4).toUpperCase().replace(/\s/g,'X')+'U '+(100000+hash(li,3)*899999|0),sw-W*.03,H*.16);
    g.fillStyle='rgba(20,20,20,.5)';g.fillRect(W*.03,H*.7,W*.09,H*.16);g.fillStyle='rgba(230,230,230,.7)';for(let i=0;i<4;i++)g.fillRect(W*.035,H*(.72+i*.035),W*.08*trr(.5,1),H*.012);
    if(li%3===1){g.save();g.translate(sw*.84,H*.72);g.rotate(Math.PI/4);g.fillStyle='#e8c030';g.fillRect(-22*k,-22*k,44*k,44*k);g.strokeStyle='#202020';g.lineWidth=2*k;g.strokeRect(-19*k,-19*k,38*k,38*k);g.restore();}
    // weather: rust from the top rail and the corners, scuffs, dirt from the bottom
    streaks(g,sw,H,70,'rgba(110,55,25,A)',.22,H*.5);streaks(g,W,H,30,'rgba(30,25,20,A)',.14,H);blot(g,W,H,90,'#6a3a1c',.1,.4,1.5*k,5*k);
    for(let i=0;i<40;i++){g.strokeStyle=`rgba(220,220,210,${trr(.1,.35)})`;g.lineWidth=1;g.beginPath();const x=tr()*W,y=tr()*H;g.moveTo(x,y);g.lineTo(x+trr(-30,30)*k,y+trr(-4,4)*k);g.stroke();}
    const gr=g.createLinearGradient(0,H*.75,0,H);gr.addColorStop(0,'rgba(30,25,20,0)');gr.addColorStop(1,'rgba(30,25,20,.55)');g.fillStyle=gr;g.fillRect(0,0,W,H);grit(g,W,H,W*H/60,.25);});
  const t=ctex(c,true);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  return new THREE.MeshStandardMaterial({vertexColors:true,map:t,normalMap:CONT_N,normalScale:new THREE.Vector2(1,1),roughness:.62,metalness:.35,envMap:null});});
function contGeo(l,h,w){const g=new THREE.BoxGeometry(l,h,w),uv=g.attributes.uv;for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i,u=uv.getX(k),v=uv.getY(k);uv.setXY(k,f<2?CONT_SX+u*(1-CONT_SX)+.002:u*CONT_SX*.996,f===2||f===3?.08+v*.84:v);}return g;}
// painted steel: faint plate seams, chipped edges, rust runs (a tile is 2 m)
const PAINT_T=(()=>{const S=256;const col=canv(S,S,(g)=>{g.fillStyle='#d0d0d0';g.fillRect(0,0,S,S);blot(g,S,S,80,'#b8b8b8',.1,.3,4,20);blot(g,S,S,40,'#e8e8e8',.05,.15,3,12);g.fillStyle='rgba(60,60,60,.45)';g.fillRect(0,S*.5,S,1);g.fillRect(S*.5,0,1,S);
    streaks(g,S,S,26,'rgba(110,60,30,A)',.4,S*.5);blot(g,S,S,30,'#5a3a24',.2,.55,1,3);grit(g,S,S,2500,.18);});
  const hgt=canv(S,S,(g)=>{g.fillStyle='#808080';g.fillRect(0,0,S,S);g.fillStyle='#303030';g.fillRect(0,S*.5-1,S,3);g.fillRect(S*.5-1,0,3,S);grit(g,S,S,4000,.3);});
  return{map:ctex(col,true),n:nmapOf(hgt,1.8)};})();
// hazard stripes, a crane's truss panels (cut out), soft shadow and light decals, the light cones
const HAZ_T=ctex(canv(128,128,(g)=>{g.fillStyle='#d8a630';g.fillRect(0,0,128,128);g.fillStyle='#16161a';for(let x=-128;x<256;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x+16,0);g.lineTo(x+16+128,128);g.lineTo(x+128,128);g.fill();}grit(g,128,128,1200,.4);}),true);
const TRUSS_T=ctex(canv(256,64,(g)=>{g.clearRect(0,0,256,64);g.strokeStyle='#fff';g.lineCap='square';g.lineWidth=7;g.beginPath();g.moveTo(0,4);g.lineTo(256,4);g.moveTo(0,60);g.lineTo(256,60);g.stroke();g.lineWidth=5;g.beginPath();
  for(const x of[0,128,256]){g.moveTo(x,0);g.lineTo(x,64);}g.moveTo(0,60);g.lineTo(128,4);g.lineTo(256,60);g.stroke();}),true);
const AO_T=ctex(canv(64,64,(g)=>{g.filter='blur(7px)';g.fillStyle='#000';g.fillRect(14,14,36,36);}),false);
const POOL_T=glow;
const CONE_T=ctex(canv(4,64,(g)=>{const gr=g.createLinearGradient(0,0,0,64);gr.addColorStop(0,'#fff');gr.addColorStop(.3,'#555');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,4,64);}),false);
const PUDDLE_T=ctex(canv(128,128,(g)=>{g.filter='blur(5px)';g.fillStyle='#fff';for(let i=0;i<5;i++){g.beginPath();g.ellipse(64+trr(-22,22),64+trr(-22,22),trr(14,34),trr(10,24),tr()*3,0,7);g.fill();}}),false);

/* ---------- materials ---------- */
const HB_ENV=KIT.env((x,y,z)=>{const hz=1-Math.abs(y);let r=.02+.04*hz*hz,g=.03+.05*hz*hz,b=.05+.07*hz*hz;const a=Math.atan2(z,x);
  const city=sstep(.6,.98,hz)*(.5+.5*Math.sin(a*11))*(.6+.4*Math.sin(a*3+1));r+=city*.5;g+=city*.32;b+=city*.18;   // sodium orange along the shore
  const lh=Math.pow(Math.max(0,-z*.4+x*.2-y*.1),6)*.6;r+=lh;g+=lh;b+=lh*1.1;return[r,g,b];},coarse?64:128);
const std=(o)=>new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,envMap:HB_ENV,envMapIntensity:1},o));
const quayMat=std({map:QUAY_T.map,normalMap:QUAY_T.n,normalScale:new THREE.Vector2(.8,.8),roughness:.72,metalness:.05,envMapIntensity:1.4});
const faceMat=std({map:FACE_T.map,normalMap:FACE_T.n,roughness:.42,metalness:.05,envMapIntensity:1.6});
const corrMat=std({map:CORR_T.map,normalMap:CORR_T.n,normalScale:new THREE.Vector2(1.2,1.2),roughness:.48,metalness:.55});
const rollMat=std({map:ROLL_T.map,normalMap:ROLL_T.n,roughness:.5,metalness:.5});
const roofMat=std({map:ROOF_T.map,normalMap:ROOF_T.n,roughness:.55,metalness:.05,envMapIntensity:1.5});
const deckMat=std({map:DECK_T.map,normalMap:DECK_T.n,normalScale:new THREE.Vector2(.9,.9),roughness:.5,metalness:.3,envMapIntensity:1.2});
const houseMat=std({map:HOUSE_T.map,normalMap:HOUSE_T.n,roughness:.45,metalness:.15,envMapIntensity:.9});
const crateMat=std({map:CRATE_T.map,normalMap:CRATE_T.n,roughness:.85,metalness:0,envMapIntensity:.4});
const hazMat=std({map:HAZ_T,roughness:.6,metalness:.2});
const craneMat=std({map:PAINT_T.map,normalMap:PAINT_T.n,roughness:.5,metalness:.35});
for(const m of CONT_MATS)m.envMap=HB_ENV;
const rustTex=KIT.tex('metal020',true),rustN=KIT.tex('metal020-n');
const hullMat=std({map:rustTex,normalMap:rustN,roughness:.5,metalness:.45});
const steelMat=std({map:panelTex,roughness:.4,metalness:.7,envMapIntensity:1.1});
const paintMat=std({roughness:.5,metalness:.3,envMapIntensity:.8});
const woodMat=std({roughness:.85,metalness:0,envMap:null});
const rubberMat=std({roughness:.7,metalness:0,envMapIntensity:.5});
const glassMat=std({roughness:.05,metalness:.6,envMapIntensity:2.2});
const trussMat=std({map:TRUSS_T,alphaTest:.5,side:THREE.DoubleSide,roughness:.5,metalness:.35});
const aoMat=new THREE.MeshBasicMaterial({map:AO_T,color:0x000000,transparent:true,opacity:.62,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
const poolMat=new THREE.MeshBasicMaterial({map:POOL_T,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
const coneMat=new THREE.MeshBasicMaterial({map:CONE_T,vertexColors:true,transparent:true,opacity:coarse?.05:.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
const puddleMat=new THREE.MeshStandardMaterial({color:0x07090c,alphaMap:PUDDLE_T,transparent:true,roughness:.03,metalness:.2,envMap:HB_ENV,envMapIntensity:3,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-3});
stoneMat=paintMat;
const K_HULL=C(0x8a3a2c),K_HULL2=C(0x262e36),K_DECK=C(0xffffff),K_STEEL=C(0x9aa2ac),K_DARK=C(0x2a2e34),K_YEL=C(0xd8a630),K_QUAY=C(0xffffff);
const SODIUM=0xffa04a;
const flatQ=(w,d)=>new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2);
// glows (one Points cloud), light pools and contact shadows on the ground, the lamps' cones of haze
const GLOWS=[],GLINTS=[];
const glowAt=(x,y,z,col,sz)=>GLOWS.push([x,y,z,col,sz||1]);
const poolAt=(x,y,z,r,col,a)=>KIT.mg(poolMat,{shadow:false,recv:false,order:3}).add(flatQ(r*2,r*2),M(x,y+.03,z),C(col).multiplyScalar(a==null?.5:a));
const aoAt=(x,y,z,w,d,ry,m)=>{m=m==null?1.4:m;KIT.mg(aoMat,{shadow:false,recv:false,order:2}).add(flatQ(w+m*2,d+m*2),M(x,y+.02,z,0,ry||0,0),C(0));};
const coneAt=(x,yTop,z,h,r0,r1,col,a)=>KIT.mg(coneMat,{shadow:false,recv:false,order:4}).add(new THREE.CylinderGeometry(r0,r1,h,coarse?10:18,1,true),M(x,yTop-h/2,z),C(col).multiplyScalar(a==null?1:a));
const groundAt=(x,z)=>inBasin(x,z)?0:QY;   // what's under a light: the water or the quay
const glintAt=(x,y,z,col,k)=>GLINTS.push([x,y,z,C(col).multiplyScalar(k||1)]);
// a rope between two points that sags in the middle
function rope(a,b,sag,r,col,mat){const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new THREE.Vector3(lerp(a[0],b[0],t),lerp(a[1],b[1],t)-sag*4*t*(1-t),lerp(a[2],b[2],t)));}
  KIT.mg(mat||rubberMat).add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),coarse?10:20,r||.035,coarse?4:6,false),new THREE.Matrix4(),C(col||0xb8a888));}
// a bollard: a cast mushroom (lathe)
const BOLLARD_G=(r,h)=>new THREE.LatheGeometry([[0,0],[r*1.15,0],[r*1.1,.08*h],[r*.82,.14*h],[r*.78,.72*h],[r*1.15,.8*h],[r*1.2,.9*h],[r*1.05,h],[0,h]].map(([a,b])=>new THREE.Vector2(a,b)),coarse?10:16);

/* ---------- drawing: the quays, their faces, the coping, fenders, ladders, rails, puddles ---------- */
{const mg=KIT.mg(quayMat),[x0,x1,z0,z1]=BASIN,E=70,addSlab=(a,b,c,d)=>{const g=boxUV(b-a,1.2,d-c,4);mg.add(g,M((a+b)/2,QY-.6,(c+d)/2),K_QUAY);};
 addSlab(-E,E,-E,z0);addSlab(-E,E,z1,E);addSlab(-E,x0,z0,z1);addSlab(x1,E,z0,z1);
 const fm=KIT.mg(faceMat),slip=(x,z)=>Math.abs(Math.abs(x)-34)<.6&&Math.abs(z)<1.7;
 for(const [ax,az,bx,bz] of[[x0,z0,x1,z0],[x0,z1,x1,z1],[x0,z0,x0,z1],[x1,z0,x1,z1]]){const along=ax===bx?'z':'x',L=along==='x'?bx-ax:bz-az,out=along==='x'?(az<0?-1:1):(ax<0?-1:1);
   fm.add(boxUV(along==='x'?L:.4,3.4,along==='x'?.4:L,3),M((ax+bx)/2+(along==='z'?out*.2:0),.5,(az+bz)/2+(along==='x'?out*.2:0)),C(0xffffff));
   // the wet line and weed at the water, a pale tide mark over it
   KIT.mg(paintMat).add(boxUV(along==='x'?L:.02,.45,along==='x'?.02:L,1),M((ax+bx)/2-(along==='z'?out*.01:0),.12,(az+bz)/2-(along==='x'?out*.01:0)),C(0x17241a));
   KIT.mg(paintMat).add(boxUV(along==='x'?L:.015,.1,along==='x'?.015:L,1),M((ax+bx)/2-(along==='z'?out*.012:0),.55,(az+bz)/2-(along==='x'?out*.012:0)),C(0x6a6e64));
   // the coping: granite kerb blocks along the edge, each its own shade
   for(let a=0;a<L-.01;a+=1.2){const l=Math.min(1.2,L-a)-.03,px=along==='x'?ax+a+l/2:ax+out*.27,pz=along==='x'?az+out*.27:az+a+l/2;if(slip(px,pz))continue;const v=.75+.3*hash(a*7|0,(ax+az)|0);
     KIT.mg(faceMat).add(boxUV(along==='x'?l:.62,.26,along==='x'?.62:l,1),M(px,QY-.05,pz),C(0xc8c4bc).multiplyScalar(v));}
   // the yellow safety line, a hatched band where the gangways and pier steps land
   KIT.mg(paintMat).add(boxUV(along==='x'?L:.12,.02,along==='x'?.12:L,1),M((ax+bx)/2+(along==='z'?out*.85:0),QY+.012,(az+bz)/2+(along==='x'?out*.85:0)),K_YEL);}
 for(const [gx] of GANG)for(const s of[1,-1])KIT.mg(hazMat).add(boxUV(3,.02,1.2,1.2),M(gx*s,QY+.014,-15.9*s),C(0xffffff));
 for(const [x,,,w] of PIERS)for(const s of[1,-1])KIT.mg(hazMat).add(boxUV(w,.02,.8,1.2),M((x+w/2-1)*s,QY+.014,-14.9*s),C(0xffffff));
 // fenders: old tyres hung on chains down the face; steel ladders down to the water
 const fenderSkip=(x)=>[-28,22].some(p=>Math.abs(x-p)<2.4)||GANG.some(([g])=>Math.abs(x-g)<1.8);
 for(let x=-32.5;x<=32.5;x+=coarse?3.5:2.5)for(const s of[1,-1]){if(fenderSkip(x))continue;const X=x*s,Z=-13.72*s;KIT.mg(rubberMat).add(new THREE.TorusGeometry(.42,.17,coarse?6:10,coarse?12:18),M(X,QY-1.15,Z),C(0x121212));
   KIT.mg(steelMat).add(new THREE.CylinderGeometry(.02,.02,.85,4),M(X-.25,QY-.5,Z,0,0,.35),C(0x3a3430));KIT.mg(steelMat).add(new THREE.CylinderGeometry(.02,.02,.85,4),M(X+.25,QY-.5,Z,0,0,-.35),C(0x3a3430));}
 for(let z=-11;z<=11;z+=coarse?4:3)for(const s of[1,-1]){if(Math.abs(z)<2.6)continue;KIT.mg(rubberMat).add(new THREE.TorusGeometry(.42,.17,coarse?6:10,coarse?12:18),M(-33.72*s,QY-1.15,z*s,0,Math.PI/2,0),C(0x121212));}
 for(const x of[-14,4,30])for(const s of[1,-1]){const X=x*s,Z=-13.85*s;for(const dx of[-.22,.22])KIT.mg(steelMat).add(boxUV(.05,3.2,.05,1),M(X+dx,.7,Z),C(0x8a8478));for(let y=-.6;y<QY;y+=.3)KIT.mg(steelMat).add(boxUV(.44,.03,.03,1),M(X,y,Z),C(0x8a8478));
   for(const dx of[-.22,.22])KIT.mg(steelMat).add(new THREE.TorusGeometry(.3,.025,4,10,Math.PI),M(X+dx,QY,Z-.3*s,0,Math.PI/2,0),C(0x8a8478));}
 // the crane rails along the north and south quays
 for(const s of[1,-1])for(const dz of[-4.6,-.8])KIT.mg(steelMat).add(boxUV(30,.06,.14,1),M(-4*s,QY+.02,(-14+dz)*s),C(0x8a8e94));
 // the basin's floor (seen through the water)
 KIT.mg(quayMat).add(boxUV(68,.2,28,6),M(0,WATER_FLOOR-.1,0),C(0x2a3028));
 // puddles in the low spots, drains, manhole covers
 const cover=new THREE.CylinderGeometry(.38,.38,.03,coarse?10:16);
 for(let i=0;i<(coarse?24:46);i++){const x=trr(-56,56),z=(tr()<.5?-1:1)*trr(15,35);if(Math.abs(x)<34&&Math.abs(z)<14.5)continue;const r=trr(.8,2.4);KIT.mg(puddleMat,{shadow:false,recv:true,order:2}).add(flatQ(r*2,r*1.4),M(x,QY+.015,z,0,tr()*3,0),C(0xffffff));}
 for(let i=0;i<14;i++){const x=trr(-50,50),z=(i%2?1:-1)*trr(16,22);KIT.mg(steelMat).add(cover,M(x,QY+.005,z),C(0x2a2826));}
 for(let x=-30;x<=30;x+=12)for(const s of[1,-1])KIT.mg(steelMat).add(boxUV(.9,.02,.35,.2),M(x*s+3,QY+.006,-16.6*s),C(0x1a1a1a));}

/* ---------- the ship ---------- */
{const hm=KIT.mg(hullMat),dm=KIT.mg(deckMat),pm=KIT.mg(paintMat),sm=KIT.mg(steelMat),hs=KIT.mg(houseMat);
 const prof=[[-24.2,1.6],[-23,2.8],[-21.6,3.8],[-20,4.5],[20,4.5],[21.6,3.8],[23,2.8],[24.2,1.6]];
 for(const s of[1,-1])for(let i=0;i<prof.length-1;i++){const [ax,az]=prof[i],[bx,bz]=prof[i+1],L=Math.hypot(bx-ax,bz-az),ry=Math.atan2(-(bz-az)*s,(bx-ax)),mx=(ax+bx)/2,mz=(az+bz)/2*s,nz=Math.cos(ry)*s,nx=Math.sin(ry)*s,o=.13;
   hm.add(boxUV(L+.1,1.9,.25,3),M(mx,-.25,mz,0,ry,0),K_HULL);hm.add(boxUV(L+.1,5.2,.25,3),M(mx,3.2,mz,0,ry,0),K_HULL2);
   pm.add(boxUV(L+.1,.1,.27,1),M(mx,.72,mz,0,ry,0),C(0xd8d4c8));pm.add(boxUV(L+.1,.14,.29,1),M(mx,5.62,mz,0,ry,0),C(0xd8d4c8));
   // the plating: weld seams standing proud, a rubbing strake
   for(const y of[1.9,3.6])sm.add(boxUV(L+.08,.035,.3,1),M(mx,y,mz,0,ry,0),C(0x3a424a));
   sm.add(new THREE.CylinderGeometry(.11,.11,L+.1,8).rotateZ(Math.PI/2),M(mx+nx*o,4.7,mz+nz*o,0,ry,0),C(0x20262c));
   const n=Math.max(1,Math.round(L/2.4));for(let k=1;k<n;k++){const t=k/n-.5;sm.add(boxUV(.035,5.6,.3,1),M(mx+Math.cos(ry)*t*L,2.9,mz-Math.sin(ry)*t*L,0,ry,0),C(0x2e363e));}
   // portholes along the long sides, lit here and there
   if(ax===-20&&bx===20)for(let x=-17;x<=17;x+=2.2){if(Math.abs(x)>6&&hash(x*5|0,s+4)<.5)continue;const z=4.62*s;sm.add(new THREE.TorusGeometry(.2,.05,6,14),M(x,4.2,z),C(0x8a8a86));
     KIT.mg(KIT.lampMat).add(new THREE.CircleGeometry(.17,12),M(x,4.2,z+.01*s,0,s>0?0:Math.PI,0),hash(x*3|0,s+9)<.45?C(0xffd8a0).multiplyScalar(1.5):C(0x0a0e12));}}
 for(const x of[-24.2,24.2]){hm.add(boxUV(.25,1.9,3.2,3),M(x,-.25,0),K_HULL);hm.add(boxUV(.25,5.2,3.2,3),M(x,3.2,0),K_HULL2);pm.add(boxUV(.27,.1,3.22,1),M(x,.72,0),C(0xd8d4c8));}
 // anchors in their hawse pipes, the draft marks, fairleads
 for(const s of[1,-1])for(const e of[-1,1]){const x=e*21.9,z=4.05*s,ry=Math.atan2(.7*s*e,1.6);
   sm.add(new THREE.CylinderGeometry(.42,.48,.15,14).rotateX(Math.PI/2),M(x,4.9,z+.08*s,0,ry,0),C(0x14181c));
   const am=M(x,4.15,z+.2*s,0,ry,0);sm.add(boxUV(.16,1.3,.14,1),am.clone().multiply(M(0,0,0)),C(0x1a1c1e));sm.add(new THREE.TorusGeometry(.42,.09,6,12,Math.PI),am.clone().multiply(M(0,-.62,0,0,0,Math.PI)),C(0x1a1c1e));
   for(let k=0;k<4;k++)KIT.mg(KIT.lampMat).add(boxUV(.12,.08,.02,1),M(e*23.2+(k%2?.1:0)*e,.9+k*.9,(2.6+.06)*s,0,ry*0+(s>0?0:Math.PI),0),C(0xd8d4c8).multiplyScalar(.6));}
 // the deck plating: everywhere but the hatches
 const deckPiece=(x0,x1,z0,z1)=>dm.add(boxUV(x1-x0,.2,z1-z0,4),M((x0+x1)/2,DECK_Y-.1,(z0+z1)/2),K_DECK);
 deckPiece(-20,-18,-4.5,4.5);deckPiece(18,20,-4.5,4.5);deckPiece(-8,8,-4.5,4.5);for(const [a,b,w] of[[20,21.6,3.8],[21.6,23,2.8],[23,24.2,1.6]]){deckPiece(a,b,-w,w);deckPiece(-b,-a,-w,w);}
 for(const [h0,h1] of SHIP.holds){const hc=h0<0?SHIP.hatch[0]:SHIP.hatch[1];deckPiece(h0,h1,-4.5,-2.2);deckPiece(h0,h1,2.2,4.5);deckPiece(h0,hc[0],-2.2,2.2);deckPiece(hc[1],h1,-2.2,2.2);
   // the hold: floor, sides with their frames, ends, a strip light down each side
   dm.add(boxUV(h1-h0,.2,8.6,4),M((h0+h1)/2,.4,0),C(0x8a8478));for(const z of[-4.2,4.2])hm.add(boxUV(h1-h0,5,.1,3),M((h0+h1)/2,3,z),C(0x5a3a30));for(const x of[h0+.05,h1-.05])hm.add(boxUV(.1,5,8.6,3),M(x,3,0),C(0x5a3a30));
   for(let x=h0+.8;x<h1-.4;x+=1.1)for(const z of[-4.1,4.1])sm.add(boxUV(.12,4.9,.14,1),M(x,3,z),C(0x4a3028));
   for(const z of[-4.05,4.05]){KIT.mg(KIT.lampMat).add(boxUV(h1-h0-2,.06,.04,1),M((h0+h1)/2,4.6,z),C(0xfff0d0).multiplyScalar(1.1));glowAt((h0+h1)/2,4.6,z,0xffe0b0,1.2);}
   poolAt((h0+h1)/2,.5,0,4.5,0xffe0b0,.35);
   // the coaming: yellow, its top flange, the hatch's rollers
   for(const z of[-2.2,2.2]){pm.add(boxUV(hc[1]-hc[0]+.25,.95,.25,1),M((hc[0]+hc[1])/2,DECK_Y+.37,z),K_YEL);pm.add(boxUV(hc[1]-hc[0]+.4,.06,.42,1),M((hc[0]+hc[1])/2,DECK_Y+.86,z),C(0xb88a28));
     for(let x=hc[0]+.6;x<hc[1];x+=1.5)pm.add(boxUV(.08,.7,.32,1),M(x,DECK_Y+.3,z+(z<0?-.2:.2)),C(0xb88a28));}
   for(const x of hc){pm.add(boxUV(.25,.95,4.6,1),M(x,DECK_Y+.37,0),K_YEL);pm.add(boxUV(.42,.06,4.8,1),M(x,DECK_Y+.86,0),C(0xb88a28));}
   // cargo left in the hold: crates (walls of the hold's own clutter)
   for(let k=0;k<4;k++){const x=lerp(h0+1.5,h1-1.5,hash(k,Math.abs(h0)|0)),z=(k%2?1:-1)*(h0<0?1:-1)*(2.9+hash(k*3,Math.abs(h1)|0)*.6),ry=hash(k,7)*1.4;KIT.block({cx:x,cz:z,ry,l:1.3,w:1.3},.4,1.6);
     KIT.mg(crateMat).add(new THREE.BoxGeometry(1.3,1.2,1.3),M(x,1,z,0,ry,0),C(0xd0c8b8));aoAt(x,.5,z,1.3,1.3,ry,.5);}}
 // the bulwarks: the plate, a cap rail, stays every metre and a half on the inside, life rings
 for(const W of S3.walls)if(W.y0>DECK_Y-.2&&W.y0<DECK_Y&&W.y1>DECK_Y+.8&&W.y1<DECK_Y+1.1){const ry=Math.atan2(-W.uz,W.ux),L=W.hw*2;hm.add(boxUV(L,1.1,.22,2),M(W.x,DECK_Y+.45,W.z,0,ry,0),K_HULL2);
   pm.add(boxUV(L+.02,.08,.32,1),M(W.x,DECK_Y+1.02,W.z,0,ry,0),C(0xd8d4c8));const cx=-W.x,cz=-W.z,l=Math.hypot(cx,cz)||1,ix=cx/l*.2,iz=cz/l*.2;
   for(let t=-W.hw+.6;t<W.hw;t+=1.5)sm.add(boxUV(.06,.8,.25,1),M(W.x+W.ux*t+Math.sign(cx)*0+(-W.uz)*0,DECK_Y+.45,W.z+W.uz*t,0,ry,0).multiply(M(0,0,Math.sign((-W.uz)*cx+W.ux*cz)*.2)),C(0x2a323a));}
 for(const [x,z] of[[-11,4.3],[3,4.3],[15,4.3]])for(const s of[1,-1]){KIT.mg(paintMat).add(new THREE.TorusGeometry(.33,.09,8,16),M(x*s,DECK_Y+.55,(z-.05)*s),C(0xe8601e));for(let k=0;k<4;k++)KIT.mg(paintMat).add(boxUV(.1,.2,.2,1),M(x*s+Math.cos(k*Math.PI/2)*.33,DECK_Y+.55+Math.sin(k*Math.PI/2)*.33,(z-.05)*s),C(0xf0f0e8));}
 // pipes along both sides of the deck, open at the gangways
 for(const s of[1,-1]){const cuts=[...GANG.map(([g])=>[g*s-1.5,g*s+1.5]),[-8,8]].sort((p,q)=>p[0]-q[0]);let a=-19.5;for(const [c0,c1] of[...cuts,[19.5,99]]){const b=Math.min(19.5,c0);if(b-a>.3)for(const [dz,r,col] of[[.2,.09,0x6a7a5a],[.45,.06,0x8a4a2a]])sm.add(new THREE.CylinderGeometry(r,r,b-a,8).rotateZ(Math.PI/2),M((a+b)/2,DECK_Y+.15+r,-(4.2-dz)*s),C(col));a=Math.max(a,c1);}}
 // the deck's clutter: a windlass, a locker, stacked hatch boards; double bitts; mushroom vents
 for(const s of[1,-1]){const [w0,w1,w2]=DECK_CLUT;
   {const [x,z,l,w,h]=w0;pm.add(boxUV(l,.3,w,1),M(x*s,DECK_Y+.15,z*s),C(0x3a4a3a));for(const dz of[-.42,.42])pm.add(new THREE.CylinderGeometry(.38,.38,.45,16).rotateX(Math.PI/2),M(x*s,DECK_Y+.65,(z+dz)*s),C(0x2a3a2c));
     pm.add(new THREE.CylinderGeometry(.5,.5,.1,16).rotateX(Math.PI/2),M(x*s,DECK_Y+.65,(z-.68)*s),C(0x8a2a22));pm.add(boxUV(.6,.7,w*.8,1),M((x+.55)*s,DECK_Y+.45,z*s),C(0x4a5a4a));aoAt(x*s,DECK_Y,z*s,l,w,0,.4);
     rope([(x+.2)*s,DECK_Y+.9,(z+.42)*s],[-23.5*s,DECK_Y+1,(z+.6)*s],.25,.05,0x9a8a68);}
   {const [x,z,l,w,h]=w1;pm.add(boxUV(l,h,w,1),M(x*s,DECK_Y-.1+h/2,z*s),C(0x7a8a76));pm.add(boxUV(l+.06,.06,w+.06,1),M(x*s,DECK_Y-.1+h,z*s),C(0x5a6a56));aoAt(x*s,DECK_Y,z*s,l,w,0,.3);}
   {const [x,z,l,w,h]=w2;for(let k=0;k<3;k++)KIT.mg(craneMat).add(boxUV(l-k*.05,.22,w-.04,1),M(x*s+(k-1)*.03,DECK_Y+.02+k*.26,z*s),C(k%2?0xb08a2a:0xc89a30));aoAt(x*s,DECK_Y,z*s,l,w,0,.4);}}
 for(const o of OBST)if(o.y0===DECK_Y&&o.r<.35){for(const d of[-.17,.17])sm.add(BOLLARD_G(.14,.75),M(o.x+d,o.y0-.05,o.z),C(0x1a1c1e));sm.add(boxUV(.75,.08,.36,1),M(o.x,o.y0-.05,o.z),C(0x1a1c1e));}
 for(const [x,z] of[[6.2,-1.8],[6.2,1.8]])for(const s of[1,-1]){KIT.post(x*s,z*s,.25,DECK_Y,1.2);pm.add(new THREE.CylinderGeometry(.16,.18,1,12),M(x*s,DECK_Y+.45,z*s),C(0xd8d4cc));pm.add(new THREE.SphereGeometry(.34,14,8,0,Math.PI*2,0,Math.PI/2),M(x*s,DECK_Y+.95,z*s),C(0xd8d4cc));pm.add(new THREE.CylinderGeometry(.35,.35,.1,14),M(x*s,DECK_Y+.92,z*s),C(0x2a2e34));}
 // the house: white plate, two rows of portholes, doors in its ends, bulkhead lamps
 hs.add(boxUV(10,3.3,6,2),M(0,DECK_Y+1.6,0),C(0xffffff));pm.add(boxUV(10.3,.2,6.3,1),M(0,8.85,0),C(0x7a7a78));hs.add(boxUV(3.6,2.7,2.4,2),M(0,10.05,0),C(0xffffff));
 for(let x=-4;x<=4;x+=1.6)for(const z of[-3.02,3.02])for(const y of[DECK_Y+1.15,DECK_Y+2.35]){const lit=hash(x*5|0,(y*3|0)+(z>0?1:0))<.6;sm.add(new THREE.TorusGeometry(.24,.05,6,16),M(x,y,z),C(0x6a6a66));
   KIT.mg(KIT.lampMat).add(new THREE.CircleGeometry(.21,14),M(x,y,z+(z<0?-.01:.01),0,z<0?Math.PI:0,0),lit?C(0xffd8a0).multiplyScalar(1.6):C(0x0c1014));}
 for(const s of[1,-1]){const x=5.02*s;pm.add(boxUV(.06,2.1,1,1),M(x,DECK_Y+1,0),C(0x6a7068));KIT.mg(KIT.lampMat).add(boxUV(.07,.4,.5,1),M(x,DECK_Y+1.5,0),C(0xffd8a0).multiplyScalar(1.2));
   KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.09,8,6),M(x+.08*s,DECK_Y+2.3,0),C(0xfff0d0).multiplyScalar(3));glowAt(x+.12*s,DECK_Y+2.3,0,0xffe8c0,1.1);poolAt(x+1.6*s,DECK_Y,0,2.2,0xffe0b0,.4);
   for(const z of[-2,2]){KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.08,8,6),M(x,DECK_Y+2.7,z),C(0xfff0d0).multiplyScalar(3));glowAt(x+.08*s,DECK_Y+2.7,z,0xffe8c0,.9);}}
 // the wheelhouse: framed windows all round, a visor, the radar mast with its scanner, whips, a searchlight
 for(const [x,z,ry,w] of[[0,-1.22,Math.PI,3],[0,1.22,0,3],[1.82,0,Math.PI/2,2],[-1.82,0,-Math.PI/2,2]]){const n=w>2.5?5:3;KIT.mg(KIT.lampMat).add(new THREE.PlaneGeometry(w,.8),M(x,10.6,z,0,ry,0),C(0x9fe8ff).multiplyScalar(.75));
   const sn=Math.sin(ry),cs=Math.cos(ry);for(let k=0;k<=n;k++){const t=(k/n-.5)*w;sm.add(boxUV(.07,.9,.06,1),M(x+cs*t+sn*.02,10.6,z-sn*t+cs*.02,0,ry,0),C(0x1a1c20));}
   sm.add(boxUV(w+.1,.08,.08,1),M(x+sn*.03,11.02,z+cs*.03,0,ry,0),C(0x1a1c20));sm.add(boxUV(w+.1,.08,.08,1),M(x+sn*.03,10.18,z+cs*.03,0,ry,0),C(0x1a1c20));}
 pm.add(boxUV(4.2,.12,3,1),M(0,11.46,0),C(0x7a7a78));pm.add(boxUV(.25,2.6,.25,1),M(-.8,12.8,0),C(0xd8d4cc));pm.add(boxUV(1.4,.1,.5,1),M(-.8,13.6,0),C(0xd8d4cc));
 for(const [x,h] of[[.9,2.4],[1.3,1.8],[-1.5,2]])sm.add(new THREE.CylinderGeometry(.02,.03,h,4),M(x,11.5+h/2,-.8),C(0x2a2a2a));
 const radar=new THREE.Mesh(boxUV(2.2,.14,.22,1),new THREE.MeshStandardMaterial({color:C(0x2a2e34),roughness:.4,metalness:.6}));radar.position.set(-.8,13.85,0);radar.userData.dyn=1;radar.castShadow=true;scene.add(radar);CITY.ticks.push((dt,T)=>{radar.rotation.y=T*2.2;});
 KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.1,8,6),M(-.8,14.15,0),C(0xffffff).multiplyScalar(3));glowAt(-.8,14.2,0,0xffffff,1.4);
 // the funnel: its band, the company mark, a black rim, a little exhaust heat
 pm.add(new THREE.CylinderGeometry(1,1.2,4,coarse?14:24),M(0,13.2,0),C(0x2a2e34));pm.add(new THREE.CylinderGeometry(1.05,1.05,.9,coarse?14:24),M(0,14.4,0),C(0xc83a2a));pm.add(new THREE.CylinderGeometry(1.08,1.08,.12,coarse?14:24),M(0,13.92,0),C(0xe8e4d8));pm.add(new THREE.CylinderGeometry(1.08,1.08,.12,coarse?14:24),M(0,14.88,0),C(0xe8e4d8));
 pm.add(new THREE.CylinderGeometry(.98,1.02,.25,coarse?14:24),M(0,15.25,0),C(0x0e0e10));for(const d of[-.35,.35])sm.add(new THREE.CylinderGeometry(.18,.18,.8,10),M(d,15.5,0),C(0x2a2a2a));OBST.push({x:0,z:0,r:1.2,h:4,y0:11.4});
 // masts: crosstrees, floodlights down onto the deck, the derricks, rigging, the nav lights
 for(const x of[-13,13]){const mz=x<0?-3.2:3.2;sm.add(new THREE.CylinderGeometry(.22,.3,12,coarse?10:16),M(x,DECK_Y+6,mz),K_STEEL);OBST.push({x,z:mz,r:.32,h:12,y0:DECK_Y});
   sm.add(boxUV(.2,.2,3.2,1),M(x,DECK_Y+9,mz),K_STEEL);for(let y=DECK_Y+.6;y<DECK_Y+11;y+=.4)sm.add(boxUV(.4,.03,.03,1),M(x,y,mz+(x<0?.3:-.3)),C(0x6a6e72));
   sm.add(new THREE.CylinderGeometry(.12,.16,9,8),M(x+(x<0?3:-3),DECK_Y+4.5,x<0?-1:1,0,0,(x<0?-1:1)*.62),K_STEEL);
   for(const [tx,tz] of[[x-2,mz<0?-4.3:4.3],[x+2,mz<0?-4.3:4.3],[x,mz<0?4.2:-4.2]])rope([x,DECK_Y+11.5,mz],[tx,DECK_Y+1,tz],.05,.015,0x2a2a2a,steelMat);
   for(const dz of[-1.3,1.3]){sm.add(boxUV(.4,.3,.3,1),M(x,DECK_Y+8.75,mz+dz,-.6,0,0),C(0x2a2e34));KIT.mg(KIT.lampMat).add(new THREE.CircleGeometry(.12,10).rotateX(Math.PI/2),M(x,DECK_Y+8.58,mz+dz),C(0xfff4e0).multiplyScalar(3));glowAt(x,DECK_Y+8.55,mz+dz,0xfff0d8,1.5);}
   poolAt(x,DECK_Y,mz*.2,5.5,0xfff0d8,.35);coneAt(x,DECK_Y+8.5,0,8.4,.4,4.5,0xfff0d8,.6);
   KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.15,8,6),M(x,DECK_Y+12.1,mz),C(x<0?0x40ff60:0xff4040).multiplyScalar(2.5));glowAt(x,DECK_Y+12.1,mz,x<0?0x40ff60:0xff4040,1.6);}
 // the ship's name on its bows, its port on its sterns
 for(const s of[1,-1])for(const [txt,x] of[['KEEPER STAR',-19],['TIDE CITY',18.5]]){const t=KIT.neonTex(txt,0xe8e4d8,{w:384,h:64,frame:false,bg:'rgba(0,0,0,0)'});const m=new THREE.Mesh(new THREE.PlaneGeometry(txt.length>9?4.2:3.4,.7),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.6,depthWrite:false}));
   m.position.set(x*s,4.5,-4.64*s);m.rotation.y=s>0?Math.PI:0;m.userData.dyn=1;scene.add(m);}
 // the mooring lines: bow and stern, out to the bollards on both quays
 for(const s of[1,-1])for(const [sx,sz,bx] of[[-23,3,-32],[-21,4.2,-16],[23,3,32],[21,4.2,16]]){rope([sx*s,DECK_Y+.9,-sz*s],[bx*s,QY+.55,-15*s],1.6,.045,0xb8a888);
   KIT.mg(steelMat).add(boxUV(.5,.3,.3,1),M(sx*s,DECK_Y+.9,-sz*s),C(0x1a1c1e));}}
// gangways, stairs (steel), piers (old timber on piles)
for(const R of KIT.PAIRS){const ry=Math.atan2(-R.uz,R.ux),mx=R.P0[0]+R.ux*R.L/2,mz=R.P0[1]+R.uz*R.L/2,ym=(R.yA+R.yB)/2,pitch=Math.atan2(R.yB-R.yA,R.L),hl=Math.hypot(R.L,R.yB-R.yA);
  const steep=Math.abs(R.yB-R.yA)/R.L>.35,sm=KIT.mg(steelMat);
  if(steep){const n=Math.max(3,Math.round(Math.abs(R.yB-R.yA)/.24));for(let k=0;k<n;k++){const a=(k+.5)/n*R.L,y=R.hAt(a),px=R.P0[0]+R.ux*a,pz=R.P0[1]+R.uz*a;sm.add(boxUV(R.L/n+.02,.05,R.w-.1,1),M(px,y-.03,pz,0,ry,0),K_STEEL);
      sm.add(boxUV(.05,.05,R.w-.1,1),M(px+R.ux*(R.L/n/2),y-.02,pz+R.uz*(R.L/n/2),0,ry,0),K_YEL);}}
  else{sm.add(boxUV(hl,.1,R.w,1),M(mx,ym-.05,mz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_STEEL);const n=Math.floor(hl/.4);for(let k=0;k<n;k++){const a=(k+.5)/n*R.L;sm.add(boxUV(.04,.03,R.w-.1,1),M(R.P0[0]+R.ux*a,R.hAt(a)+.01,R.P0[1]+R.uz*a,0,ry,0),C(0x5a5e64));}}
  for(const s of[-1,1]){const ox=R.nx*s*(R.w/2-.05),oz=R.nz*s*(R.w/2-.05);sm.add(boxUV(hl,.3,.06,1),M(mx+ox,ym-.18,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_DARK);
    sm.add(new THREE.CylinderGeometry(.03,.03,hl,6).rotateZ(Math.PI/2),M(mx+ox,ym+1,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_YEL);sm.add(new THREE.CylinderGeometry(.02,.02,hl,5).rotateZ(Math.PI/2),M(mx+ox,ym+.55,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_YEL);
    for(let k=0;k<=Math.floor(R.L/1.5);k++){const a=Math.min(R.L,k*1.5),y=R.hAt(a);sm.add(new THREE.CylinderGeometry(.025,.025,1,6),M(R.P0[0]+R.ux*a+ox,y+.5,R.P0[1]+R.uz*a+oz),K_DARK);}}}
// the drawn railings: the house roof, the cranes' decks
for(const W of HB_RAILS){const ry=Math.atan2(-W.uz,W.ux),L=W.hw*2,y=W.y0+.05,h=W.y1-y,sm=KIT.mg(steelMat);sm.add(new THREE.CylinderGeometry(.03,.03,L,6).rotateZ(Math.PI/2),M(W.x,y+h,W.z,0,ry,0),K_YEL);sm.add(new THREE.CylinderGeometry(.02,.02,L,5).rotateZ(Math.PI/2),M(W.x,y+h*.5,W.z,0,ry,0),K_YEL);
  for(let t=-W.hw;t<=W.hw+.01;t+=Math.max(.8,L/Math.ceil(L/1.2)))sm.add(new THREE.CylinderGeometry(.025,.025,h,6),M(W.x+W.ux*t,y+h/2,W.z+W.uz*t),K_DARK);sm.add(boxUV(L,.1,.02,1),M(W.x,y+.05,W.z,0,ry,0),K_YEL);}
for(const [x,z0,z1,w] of PIERS)for(const s of[1,-1]){const r=s>0?[x-w/2,x+w/2,z0,z1]:mirR([x-w/2,x+w/2,z0,z1]),cx=(r[0]+r[1])/2,cz=(r[2]+r[3])/2,L=r[3]-r[2],wm=KIT.mg(woodMat);
  for(let k=0;k<Math.round(L/.3);k++)wm.add(boxUV(w-.04*hash(k,3),.1,.27,1),M(cx+(hash(k,5)-.5)*.06,.85,r[2]+.15+k*.3),C(0x5a4632).multiplyScalar(.7+.5*hash(k,x|0)));
  for(const dx of[-w/2+.06,w/2-.06])wm.add(boxUV(.12,.3,L,1),M(cx+dx,.68,cz),C(0x3a2c20));
  for(let k=0;k<=Math.round(L/2.2);k++){const zz=r[2]+k*2.2+.1;for(const dx of[-w/2+.2,w/2-.2]){wm.add(new THREE.CylinderGeometry(.18,.2,2.6,10),M(cx+dx,-.4,zz),C(0x2a2018));wm.add(new THREE.CylinderGeometry(.205,.205,.5,10),M(cx+dx,-.05,zz),C(0x1a2a1c));}
    wm.add(boxUV(w-.2,.22,.18,1),M(cx,.55,zz),C(0x3a2c20));if(k%2===0&&k*2.2<L-1.5)for(const sg of[-1,1])wm.add(boxUV(Math.hypot(w-.4,1.6),.12,.1,1),M(cx,-.25,zz,0,0,sg*Math.atan2(1.6,w-.4)),C(0x2a2018));
    KIT.mg(rubberMat).add(new THREE.TorusGeometry(.3,.13,6,12),M(cx+(w/2+.05)*(k%2?1:-1),.25,zz+1.1,0,Math.PI/2,0),C(0x121212));}
  for(const dx of[-w/2+.3,w/2-.3]){KIT.mg(steelMat).add(boxUV(.5,.1,.14,1),M(cx+dx,.97,cz+L*.25),C(0x2a2a2a));KIT.mg(steelMat).add(boxUV(.12,.1,.12,1),M(cx+dx,.93,cz+L*.25),C(0x2a2a2a));}}
// the boats: hull, gunwale, cabin with lit windows, a mast and lamps, tyres down the sides; lines to the piers
const BOATS_G=[];
for(const [x,z,ry,l,w] of BOATS)for(const s of[1,-1]){const g=new THREE.Group();g.position.set(x*s,0,z*s);g.rotation.y=-ry+(s<0?Math.PI:0);g.userData.dyn=1;scene.add(g);
  const sh=new THREE.Shape();sh.moveTo(-l/2,-w/2);sh.lineTo(l*.25,-w/2);sh.quadraticCurveTo(l*.45,-w*.35,l/2,0);sh.quadraticCurveTo(l*.45,w*.35,l*.25,w/2);sh.lineTo(-l/2,w/2);sh.lineTo(-l/2,-w/2);
  const hg=new THREE.ExtrudeGeometry(sh,{depth:1.1,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:2,curveSegments:coarse?6:12}).rotateX(-Math.PI/2);hg.translate(0,-.55,0);const col=hash(x|0,z|0)<.5?C(0x9a2a1c):C(0x1e3c62);
  const bm=new Merger();bm.add(hg,new THREE.Matrix4(),col);
  const gw=new THREE.ExtrudeGeometry(sh,{depth:.08,bevelEnabled:false,curveSegments:coarse?6:12}).rotateX(-Math.PI/2);bm.add(gw,M(0,.58,0),C(0xd8d4c8));bm.add(new THREE.ExtrudeGeometry(sh,{depth:.12,bevelEnabled:false,curveSegments:6}).rotateX(-Math.PI/2),M(0,-.12,0).multiply(mat4(0,0,0,1.01,1,1.01)),C(0xe8e4d8));
  bm.add(boxUV(l*.3,1,w*.6,1),M(-l*.15,1.05,0),C(0xd8d4cc));bm.add(boxUV(l*.34,.08,w*.68,1),M(-l*.15,1.58,0),C(0x3a3a3a));bm.add(boxUV(.6,.08,w*.92,1),M(l*.2,.63,0),C(0x6a5034));
  bm.add(new THREE.CylinderGeometry(.04,.05,1.6,6),M(-l*.15,2.4,0),C(0x2a2a2a));bm.add(boxUV(.5,.04,.04,1),M(-l*.15,2.9,0),C(0x2a2a2a));
  for(let k=0;k<3;k++)for(const sd of[-1,1])bm.add(new THREE.TorusGeometry(.2,.08,6,10),M(-l*.3+k*l*.25,.25,sd*(w/2+.05)),C(0x111111));
  const hull=new THREE.Mesh(bm.build(),paintMat);const lm=new Merger();for(const sd of[-1,1])lm.add(new THREE.PlaneGeometry(l*.24,.4),M(-l*.15,1.2,sd*(w*.3+.01),0,sd>0?0:Math.PI,0),C(hash(x|0,sd+5)<.6?0xffd090:0x0a0e12).multiplyScalar(1.4));
  lm.add(new THREE.SphereGeometry(.1,8,6),M(-l*.15,3.25,0),C(0xffffff).multiplyScalar(2.5));lm.add(new THREE.SphereGeometry(.08,8,6),M(l*.3,.8,-w/2),C(0xff3030).multiplyScalar(2.5));lm.add(new THREE.SphereGeometry(.08,8,6),M(l*.3,.8,w/2),C(0x30ff50).multiplyScalar(2.5));
  const lamp=new THREE.Mesh(lm.build(),KIT.lampMat);
  g.add(hull,lamp);hull.castShadow=true;hull.receiveShadow=true;hull.userData.dyn=1;lamp.userData.dyn=1;g.userData.bob=hash(x|0,z|0)*6;BOATS_G.push(g);
  const c=Math.cos(-ry+(s<0?Math.PI:0)),sn=Math.sin(-ry+(s<0?Math.PI:0)),at=(a,b,y)=>[x*s+c*a+sn*b,y,z*s-sn*a+c*b];glowAt(...at(-l*.15,0,3.3),0xfff4e0,1.3);glintAt(...at(-l*.15,0,3.3),0xfff0d8,.8);
  // a line from the bow and the stern to the nearest bit of pier or quay
  for(const a of[l*.42,-l*.45]){const p=at(a,0,.65);let best=null,bd=1e9;for(const [px,pz0,pz1,pw] of PIERS)for(const ss of[1,-1])for(const sd of[-1,1]){const qx=(px+sd*pw/2)*ss,qz=clamp(p[2],Math.min(pz0*ss,pz1*ss),Math.max(pz0*ss,pz1*ss)),d=Math.hypot(qx-p[0],qz-p[2]);if(d<bd){bd=d;best=[qx,.95,qz];}}
    const qz=p[2]<0?-14.2:14.2,dq=Math.abs(p[2]-qz);if(dq<bd||Math.abs(p[0])>31){best=Math.abs(p[0])>31?[Math.sign(p[0])*34.2,QY+.1,p[2]]:[p[0],QY+.1,qz];}rope(p,best,.5,.03,0xc8b898);}}
// a bar or a beam between two points
const _up=new THREE.Vector3(0,1,0);
function strut(a,b,geo,col,mat){const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length(),q=new THREE.Quaternion().setFromUnitVectors(_up,d.normalize());
  KIT.mg(mat||paintMat).add(geo(L),new THREE.Matrix4().compose(new THREE.Vector3((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),q,new THREE.Vector3(1,1,1)),C(col));}
const barG=r=>L=>new THREE.CylinderGeometry(r,r,L,coarse?5:8),boxG=t=>L=>boxUV(t,L,t,1);
/* ---------- the cranes: braced legs on bogies, the A-frame and its stays, a lattice boom with its trolley, cab, spreader and floodlights ---------- */
for(const [cx] of CRANES)for(const s of[1,-1]){const X=cx*s,mgS=KIT.mg(craneMat),col=K_YEL,col2=C(0xb88a28),XX=dx=>X+dx*s,Z=z=>z*s;
  for(const dx of[-3.6,3.6])for(const dz of[-4.6,-.8]){const x=XX(dx),z=Z(-14+dz);mgS.add(boxUV(.9,30,.9,2),M(x,QY+15,z),col);for(let y=QY+3;y<QY+30;y+=3)mgS.add(boxUV(1.02,.12,1.02,1),M(x,y,z),col2);
    KIT.mg(hazMat).add(boxUV(.94,1.4,.94,1.4),M(x,QY+1.8,z),C(0xffffff));mgS.add(boxUV(2.2,.5,.9,1),M(x,QY+.85,z),C(0x3a3e44));
    for(const wx of[-.7,0,.7])KIT.mg(steelMat).add(new THREE.CylinderGeometry(.3,.3,.7,coarse?10:16).rotateX(Math.PI/2),M(x+wx,QY+.32,z),C(0x1e2024));aoAt(x,QY,z,2.2,.9,0,.6);}
  for(const dz of[-4.6,-.8]){const z=Z(-14+dz);mgS.add(boxUV(8.2,.8,.8,2),M(X,QY+12,z),col);mgS.add(boxUV(8.2,.7,.7,2),M(X,QY+30,z),col);
    strut([XX(-3.6),QY+12.4,z],[XX(3.6),QY+19.6,z],boxG(.32),0xd8a630,craneMat);strut([XX(3.6),QY+12.4,z],[XX(-3.6),QY+19.6,z],boxG(.32),0xd8a630,craneMat);
    for(const e of[-1,1])strut([XX(3.6*e),QY+9.4,z],[XX(1.6*e),QY+11.6,z],boxG(.3),0xd8a630,craneMat);}
  for(const dx of[-3.6,3.6]){const x=XX(dx);mgS.add(boxUV(.8,.8,4.6,2),M(x,QY+20,Z(-16.7)),col);mgS.add(boxUV(.7,.7,4.6,2),M(x,QY+12.2,Z(-16.7)),col);
    strut([x,QY+12.6,Z(-18.6)],[x,QY+19.6,Z(-14.8)],boxG(.28),0xd8a630,craneMat);strut([x,QY+12.6,Z(-14.8)],[x,QY+19.6,Z(-18.6)],boxG(.28),0xd8a630,craneMat);
    // the A-frame over the legs, and its stays out along the boom and back
    for(const zz of[-18.6,-14.8])strut([x,QY+30,Z(zz)],[x,QY+38,Z(-16.7)],boxG(.55),0xd8a630,craneMat);
    for(const [tz,ty] of[[13.5,28.8],[4,28.8],[-30,28.8],[-24,28.8]])strut([x,QY+38,Z(-16.7)],[XX(dx*.22),QY+ty,Z(tz)],barG(.07),0x2a2a2a,steelMat);}
  mgS.add(boxUV(8,.6,.6,2),M(X,QY+38,Z(-16.7)),col);
  // the machinery deck (grating), the machine house: windows, a door, louvres, its sign
  KIT.mg(steelMat).add(boxUV(8.6,.2,5.2,1),M(X,CR_Y-.1,Z(-16.7)),C(0x4a4e54));
  {const hx=X+1.8*s,hz=Z(-17.4);KIT.mg(houseMat).add(boxUV(4,3,3.2,2),M(hx,CR_Y+1.5,hz),C(0xf0ecd8));KIT.mg(paintMat).add(boxUV(4.2,.15,3.4,1),M(hx,CR_Y+3.05,hz),C(0x5a5a58));
    const fz=hz+1.61*s;KIT.mg(KIT.lampMat).add(boxUV(2.4,.6,.02,1),M(hx+.4*s,CR_Y+2.1,fz),C(0xffe0a8).multiplyScalar(1.1));KIT.mg(paintMat).add(boxUV(.9,2,.04,1),M(hx-1.3*s,CR_Y+1,fz),C(0x5a6068));
    for(let k=0;k<5;k++)KIT.mg(steelMat).add(boxUV(.05,.8,.06,1),M(hx-.2*s+k*.25*s,CR_Y+1,fz+.01*s),C(0x3a3e44));glowAt(hx-1.3*s,CR_Y+2.3,fz+.15*s,0xffe0b0,1);poolAt(hx-1.3*s,CR_Y,fz+1.2*s,2,0xffe0b0,.45);
    for(const dx of[-1,1])KIT.mg(steelMat).add(new THREE.CylinderGeometry(.25,.25,.5,10),M(hx+dx*1.1,CR_Y+3.35,hz),C(0x8a8e94));}
  // the boom: a top chord with a walkway and rails, two bottom chords, truss sides; the trolley; red lights at its ends
  const bz=Z(-8),by=QY+28;mgS.add(boxUV(1.6,.4,46,2),M(X,by+.6,bz),col);for(const e of[-.65,.65])mgS.add(boxUV(.32,.32,46,2),M(X+e,by-.6,bz),col);
  {const tg=new THREE.PlaneGeometry(46,1.2);const uv=tg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*46/2.4);for(const e of[-.72,.72])KIT.mg(trussMat).add(tg.clone(),M(X+e,by,bz,0,Math.PI/2,0),C(0xd8a630));
    for(let k=-11;k<=11;k++)mgS.add(boxUV(1.5,.08,.08,1),M(X,by-.6,bz+k*2*s),col2);}
  KIT.mg(steelMat).add(boxUV(1,.04,46,1),M(X,by+.82,bz),C(0x5a5e64));for(const e of[-.75,.75]){KIT.mg(steelMat).add(new THREE.CylinderGeometry(.025,.025,46,5).rotateX(Math.PI/2),M(X+e,by+1.8,bz),col);for(let k=-23;k<=23;k+=2)KIT.mg(steelMat).add(new THREE.CylinderGeometry(.02,.02,1,5),M(X+e,by+1.3,bz+k),col);}
  KIT.mg(paintMat).add(boxUV(2.4,.9,2.6,1),M(X,by+1.3,Z(4)),C(0xc8c0a8));for(const e of[-1,1])for(const f of[-1,1])KIT.mg(steelMat).add(new THREE.CylinderGeometry(.2,.2,.2,10).rotateZ(Math.PI/2),M(X+e*1.25,by+.95,Z(4)+f*.9),C(0x2a2a2a));
  for(const tz of[15,-31,-16.7]){const y=tz===-16.7?QY+38.4:by+.9;KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.2,8,6),M(X,y,Z(tz)),C(0xff3030).multiplyScalar(3));glowAt(X,y,Z(tz),0xff3020,2.2);}
  // the cab under the boom: glass on three sides, lit inside
  KIT.mg(paintMat).add(boxUV(3.2,2.4,3.2,2),M(X,QY+25.6,Z(4)),C(0xc8c0a8));for(const [dx,dz,ry,w] of[[0,1.62,0,2.8],[1.62,0,Math.PI/2,2.8],[-1.62,0,-Math.PI/2,2.8]])KIT.mg(KIT.lampMat).add(new THREE.PlaneGeometry(w,1.2),M(X+dx*s,QY+25.5,Z(4)+dz*s,0,ry+(s<0?Math.PI:0),0),C(0xbfe8ff).multiplyScalar(.7));
  KIT.mg(KIT.lampMat).add(new THREE.PlaneGeometry(2.8,2.8).rotateX(Math.PI/2),M(X,QY+24.39,Z(4)),C(0x8fb8d0).multiplyScalar(.5));
  // the hoist ropes, the spreader and the box it holds
  for(const dx of[-.4,.4])for(const dz of[-.4,.4])KIT.mg(steelMat).add(new THREE.CylinderGeometry(.025,.025,14.6,4),M(X+dx,QY+19.3,Z(4)+dz),K_DARK);
  KIT.mg(craneMat).add(boxUV(6.2,.35,2.5,1),M(X,QY+12.2,Z(4),0,.3,0),C(0xd8a630));KIT.mg(paintMat).add(boxUV(1.2,.6,1.2,1),M(X,QY+12.6,Z(4)),C(0x3a3e44));
  KIT.mg(CONT_MATS[1]).add(contGeo(6,2.55,2.45),M(X,QY+10.7,Z(4),0,.3,0),C(0xffffff));
  // floodlights under the boom, down onto the water and the quay
  for(const tz of[11,-2,-25]){const x=X,z=Z(tz),g=groundAt(x,z);KIT.mg(steelMat).add(boxUV(.7,.25,.5,1),M(x,by-.9,z),C(0x2a2e34));KIT.mg(KIT.lampMat).add(boxUV(.6,.02,.4,1),M(x,by-1.03,z),C(0xfff0d8).multiplyScalar(3));
    glowAt(x,by-1.1,z,0xfff0d8,2.2);poolAt(x,g,z,7,0xffe8c8,g>1?.45:.3);coneAt(x,by-1.1,z,by-1.1-g,.35,6,0xffe8c8,.35);glintAt(x,by-1.1,z,0xfff0d8,1.4);}}
/* ---------- the warehouses: a concrete plinth, ribbed cladding between steel columns, roller doors in frames, gutters and downpipes,
   framed high windows, wall lamps over the doors; tar roofs with skylights, plant, vents ---------- */
for(const W of WARE)for(const s of[1,-1]){const [x0,x1,z0,z1]=s>0?W.slice(0,4):mirR(W),h=W[4],w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2,tint=hash(x0|0,z0|0)<.5?C(0x8a9aa6):C(0xa88672);
  KIT.mg(corrMat).add(boxUV(w,h-QY-.9,d,4),M(cx,(h+QY+.9)/2,cz),tint);KIT.mg(faceMat).add(boxUV(w+.12,1.2,d+.12,3),M(cx,QY+.3,cz),C(0xb8b4aa));
  KIT.mg(steelMat).add(boxUV(w+.3,.25,d+.3,2),M(cx,h,cz),K_DARK);aoAt(cx,QY,cz,w,d,0,1.3);
  const zf=s>0?z1:z0,o=s>0?1:-1;
  // columns on every face, at the corners and every 7 m
  for(const [ax,az,bx,bz,nx,nz] of[[x0,zf,x1,zf,0,o],[x0,z0,x0,z1,-1,0],[x1,z0,x1,z1,1,0],[x0,s>0?z0:z1,x1,s>0?z0:z1,0,-o]]){const L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.round(L/7));
    for(let k=0;k<=n;k++){const t=k/n,px=lerp(ax,bx,t)+nx*.08,pz=lerp(az,bz,t)+nz*.08;KIT.mg(steelMat).add(boxUV(nx?.16:.35,h-QY-.9,nx?.35:.16,1),M(px,(h+QY+.9)/2,pz),C(0x3a4048));}
    KIT.mg(steelMat).add(boxUV(nx?.14:L,.14,nx?L:.14,1),M((ax+bx)/2+nx*.07,QY+.95,(az+bz)/2+nz*.07),C(0x3a4048));}
  // the gutter and downpipes on the facade
  KIT.mg(steelMat).add(boxUV(w+.4,.2,.24,1),M(cx,h-.3,zf+o*.2),C(0x5a6068));for(const x of[x0+.5,x1-.5,cx]){KIT.mg(steelMat).add(new THREE.CylinderGeometry(.07,.07,h-QY-.6,8),M(x,(h+QY)/2,zf+o*.18),C(0x5a6068));KIT.mg(steelMat).add(boxUV(.2,.12,.35,1),M(x,QY+.12,zf+o*.3),C(0x5a6068));}
  // the roller doors, framed, a housing over each, a wall lamp over that
  for(let k=0;k<Math.floor(w/7);k++){const x=x0+3.5+k*7;KIT.mg(rollMat).add(new THREE.BoxGeometry(4.6,4.2,.1),M(x,QY+2.1,zf+o*.06),C(0xffffff).multiplyScalar(.8+.3*hash(k,x0|0)));
    for(const e of[-1,1]){KIT.mg(steelMat).add(boxUV(.22,4.5,.22,1),M(x+e*2.42,QY+2.25,zf+o*.11),C(0x3a4048));KIT.mg(hazMat).add(boxUV(.24,.9,.24,.9),M(x+e*2.42,QY+.45,zf+o*.11),C(0xffffff));}
    KIT.mg(steelMat).add(boxUV(5.1,.55,.45,1),M(x,QY+4.5,zf+o*.22),C(0x4a5058));KIT.mg(KIT.lampMat).add(boxUV(4.8,.1,.1,1),M(x,QY+4.18,zf+o*.4),C(SODIUM).multiplyScalar(1.2));
    KIT.mg(steelMat).add(boxUV(.5,.3,.35,1),M(x,QY+5.6,zf+o*.2),C(0x2a2e34));KIT.mg(KIT.lampMat).add(boxUV(.42,.04,.26,1),M(x,QY+5.44,zf+o*.24),C(SODIUM).multiplyScalar(3));glowAt(x,QY+5.4,zf+o*.3,SODIUM,1.6);
    poolAt(x,QY,zf+o*2.6,3.6,SODIUM,.55);coneAt(x,QY+5.4,zf+o*1.2,3.2,.2,2.4,SODIUM,.5);if(Math.abs(zf)<26)glintAt(x,QY+5.4,zf+o*.3,SODIUM,.7);}
  // the high windows: framed panes, lit or dark, on the facade and the ends
  const winRow=(ax,az,bx,bz,nx,nz)=>{const L=Math.hypot(bx-ax,bz-az),ry=nx?(nx>0?Math.PI/2:-Math.PI/2):(nz>0?0:Math.PI);for(let t=1;t<L-1;t+=2){const px=lerp(ax,bx,t/L)+nx*.06,pz=lerp(az,bz,t/L)+nz*.06,lit=hash(px*3|0,pz*3|0)<.55;
      KIT.mg(KIT.lampMat).add(new THREE.PlaneGeometry(1.4,.6),M(px,h-1.4,pz,0,ry,0),lit?C(0xffc080).multiplyScalar(1.1+.4*hash(px|0,7)):C(0x161c24));
      for(const e of[-.72,0,.72])KIT.mg(steelMat).add(boxUV(.06,.7,.06,1),M(px+(nz?e:0),h-1.4,pz+(nx?e:0)),C(0x2a2e34));}
    KIT.mg(steelMat).add(boxUV(nx?.12:L-1.4,.08,nx?L-1.4:.12,1),M((ax+bx)/2+nx*.08,h-1.73,(az+bz)/2+nz*.08),C(0x6a6e72));KIT.mg(steelMat).add(boxUV(nx?.1:L-1.4,.06,nx?L-1.4:.1,1),M((ax+bx)/2+nx*.08,h-1.07,(az+bz)/2+nz*.08),C(0x2a2e34));};
  winRow(x0,zf,x1,zf,0,o);winRow(x0,z0,x0,z1,-1,0);winRow(x1,z0,x1,z1,1,0);
  const t=KIT.neonTex('NO. '+(10+(hash(x0|0,s+2)*80|0)),0xe8e4d8,{w:256,h:96,frame:false,bg:'rgba(0,0,0,0)'});const m=new THREE.Mesh(new THREE.PlaneGeometry(4,1.5),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.7,depthWrite:false}));
  m.position.set(x0+3,h-2.9,zf+o*.12);m.rotation.y=s>0?0:Math.PI;m.userData.dyn=1;scene.add(m);
  // the roof: membrane, skylights (dim light under them), plant and vents
  KIT.mg(roofMat).add(boxUV(w-.2,.04,d-.2,6),M(cx,h,cz),C(0xffffff));
  for(let x=x0+2.5;x<x1-2;x+=4){if(ROOF_PLANT.some(p=>p[2]===h&&Math.abs(p[0]-x)<2.2&&p[1]>z0&&p[1]<z1))continue;const L=d-3.4;KIT.mg(glassMat).add(boxUV(1.2,.06,L,1),M(x,h+.02,cz),C(0x1a2a3a));KIT.mg(KIT.lampMat).add(flatQ(1.1,L-.1),M(x,h+.056,cz),C(0x3a2a1a));
    KIT.mg(steelMat).add(boxUV(1.36,.1,.1,1),M(x,h+.05,cz-L/2),C(0x5a5e64));KIT.mg(steelMat).add(boxUV(1.36,.1,.1,1),M(x,h+.05,cz+L/2),C(0x5a5e64));for(const e of[-.64,.64])KIT.mg(steelMat).add(boxUV(.08,.1,L,1),M(x+e,h+.05,cz),C(0x5a5e64));}}
for(const [x,z,h,vent] of ROOF_PLANT){if(vent){KIT.mg(steelMat).add(new THREE.CylinderGeometry(.22,.26,.55,12),M(x,h+.28,z),C(0x9aa0a6));KIT.mg(steelMat).add(new THREE.SphereGeometry(.34,14,8,0,Math.PI*2,0,Math.PI/2),M(x,h+.55,z),C(0xb0b6bc));for(let k=0;k<8;k++)KIT.mg(steelMat).add(boxUV(.02,.3,.08,1),M(x+Math.cos(k*.785)*.3,h+.66,z+Math.sin(k*.785)*.3,0,-k*.785,0),C(0x6a7076));continue;}
  KIT.mg(paintMat).add(boxUV(2,1.15,1.4,1),M(x,h+.5,z),C(0xa8aca8));for(const e of[-.5,.5]){KIT.mg(steelMat).add(new THREE.CylinderGeometry(.4,.4,.06,16),M(x+e,h+1.1,z),C(0x2a2e34));KIT.mg(steelMat).add(boxUV(.7,.02,.04,1),M(x+e,h+1.14,z,0,e*2,0),C(0x6a6e72));}
  for(let k=0;k<6;k++)KIT.mg(steelMat).add(boxUV(.03,.7,.02,1),M(x-.8+k*.32,h+.5,z+.71),C(0x4a4e52));KIT.mg(steelMat).add(new THREE.CylinderGeometry(.06,.06,1.6,6).rotateZ(Math.PI/2),M(x-1.6,h+.2,z),C(0x6a6e72));aoAt(x,h,z,2,1.4,0,.5);}
// the parapets: a concrete upstand with a metal cap
for(const [p0,p1,h] of HB_PARA){const L=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),ry=Math.atan2(-(p1[1]-p0[1]),p1[0]-p0[0]),mx=(p0[0]+p1[0])/2,mz=(p0[1]+p1[1])/2;KIT.mg(faceMat).add(boxUV(L,.8,.25,2),M(mx,h+.4,mz,0,ry,0),C(0x9a968e));KIT.mg(steelMat).add(boxUV(L+.02,.06,.33,1),M(mx,h+.82,mz,0,ry,0),C(0x6a6e74));}
// containers: per-livery sheets, the odd one turned round, corner castings, a contact shadow under each stack
for(const B of BOXES){aoAt(B.cx,QY,B.cz,6,2.45,B.ry,.8);const c=Math.cos(B.ry),sn=Math.sin(B.ry);
  for(let k=0;k<B.n;k++){const y=QY+k*2.6+1.3,li=(hash(B.cx*3|0,(B.cz*5|0)+k*11)*CONT_MATS.length)|0,v=.85+.25*hash(B.cx*7|0,k+(B.cz|0));
    KIT.mg(CONT_MATS[li]).add(contGeo(6,2.55,2.45),M(B.cx,y,B.cz,0,B.ry+(hash(k+3,B.cz*9|0)<.5?0:Math.PI),0),C(0xffffff).multiplyScalar(v));
    for(const a of[-2.96,2.96])for(const b of[-1.19,1.19])for(const e of[-1.24,1.24])KIT.mg(steelMat).add(boxUV(.18,.12,.18,1),M(B.cx+c*a+sn*b,y+e,B.cz-sn*a+c*b),C(0x2a2a2a));}}
// crates, pallets, drums, rope coils
for(const [x,z,l,h] of CRATES)for(const s of[1,-1]){const ry=hash(x|0,z|0);KIT.mg(crateMat).add(new THREE.BoxGeometry(l,h,l),M(x*s,QY-.1+h/2+.05,z*s,0,ry,0),C(0xffffff).multiplyScalar(.8+.3*hash(z|0,s+3)));aoAt(x*s,QY,z*s,l,l,ry,.5);
  for(const e of[-.3,.3])KIT.mg(steelMat).add(boxUV(l+.02,h+.02,.05,1),M(x*s,QY-.1+h/2+.05,z*s,0,ry,0).multiply(M(0,0,e*l)),C(0x1a1c20));}
for(const [x,z,ry,h] of PALLETS)for(const s of[1,-1]){const n=Math.round(h/.15),wm=KIT.mg(woodMat);aoAt(x*s,QY,z*s,1.25,1.05,ry,.4);
  for(let k=0;k<n;k++){const y=QY-.1+k*.15,mm=(a,b,c)=>M(x*s,0,z*s,0,ry,0).multiply(M(a,y+b,c)),tint=C(0xa88a60).multiplyScalar(.7+.3*hash(k,x|0));
    for(let j=0;j<5;j++)wm.add(boxUV(1.2,.022,.15,1),mm(0,.138,-.45+j*.225),tint);for(const b of[-.45,0,.45])wm.add(boxUV(1.2,.09,.1,1),mm(0,.08,b),tint.clone().multiplyScalar(.8));for(const a of[-.55,0,.55])wm.add(boxUV(.12,.022,1.05,1),mm(a,.02,0),tint);}}
for(const [x,z] of DRUMS)for(const s of[1,-1]){const col=[0x2a4a8a,0x8a2a1a,0x5a5a3a,0x3a6a4a][(hash(x*9|0,z*9|0)*4)|0],X=x*s,Z=z*s;KIT.mg(steelMat).add(new THREE.CylinderGeometry(.29,.29,.88,coarse?12:20),M(X,QY+.44,Z),C(col));
  for(const y of[.3,.6])KIT.mg(steelMat).add(new THREE.TorusGeometry(.295,.02,4,coarse?12:20).rotateX(Math.PI/2),M(X,QY+y,Z),C(col).multiplyScalar(.7));KIT.mg(steelMat).add(new THREE.CylinderGeometry(.27,.27,.02,coarse?12:20),M(X,QY+.885,Z),C(0x3a3a3a));aoAt(X,QY,Z,.6,.6,0,.3);}
for(const [x,z] of[[-31,-16.3],[-15,-16.4],[9,-16.3],[33,-16.2],[-46,-15.5]])for(const s of[1,-1])for(let k=0;k<4;k++)KIT.mg(rubberMat).add(new THREE.TorusGeometry(.42-k*.06,.045,5,coarse?14:22).rotateX(Math.PI/2),M(x*s,QY+.05+k*.07,z*s),C(0xb8a888).multiplyScalar(.8+.1*k));
// the quay's bollards (cast mushrooms, a line out from some), the base pads and the harbour masters' huts
for(const o of OBST)if(o.y0===QY&&o.r<.35&&o.h<.8)KIT.mg(steelMat).add(BOLLARD_G(o.r*.85,o.h),M(o.x,o.y0,o.z),C(0x18191c));
for(const B of GS.BASES){const TC=C(GS.TEAMS[B.team].c).multiplyScalar(2.2);KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(B.r-.3,B.r,64).rotateX(-Math.PI/2),M(B.x,QY+.02,B.z),TC);
  KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(2.6,3,3).rotateX(-Math.PI/2),M(B.x,QY+.03,B.z,0,B.fx>0?-Math.PI/2:Math.PI/2,0),TC);poolAt(B.x,QY,B.z,B.r+1,GS.TEAMS[B.team].c,.18);
  const hx=B.x-B.fx*6.3,hz=-5.6*B.fx;KIT.block([hx-1.6,hx+1.6,hz-1.6,hz+1.6],QY-.1,QY+3);KIT.mg(houseMat).add(boxUV(3.2,3,3.2,2),M(hx,QY+1.5,hz),C(0xe8e0d0));KIT.mg(paintMat).add(boxUV(3.7,.18,3.7,1),M(hx,QY+3.05,hz),C(0x3a3e44));
  KIT.mg(KIT.lampMat).add(boxUV(3.3,.08,3.3,1),M(hx,QY+2.92,hz),TC);aoAt(hx,QY,hz,3.2,3.2,0,.8);
  for(const [dx,dz,ry] of[[1.61,0,Math.PI/2],[-1.61,0,-Math.PI/2],[0,1.61,0],[0,-1.61,Math.PI]]){KIT.mg(KIT.lampMat).add(new THREE.PlaneGeometry(1.8,.8),M(hx+dx*1.005,QY+1.9,hz+dz*1.005,0,ry,0),C(0xffe0b0).multiplyScalar(.9));KIT.mg(steelMat).add(boxUV(Math.abs(dz)?1.9:.06,.08,Math.abs(dx)?1.9:.06,1),M(hx+dx*1.01,QY+1.46,hz+dz*1.01),C(0x2a2e34));}
  KIT.mg(steelMat).add(new THREE.CylinderGeometry(.03,.03,2.4,5),M(hx+1.2,QY+4.3,hz+1.2),C(0x2a2a2a));KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.08,8,6),M(hx+1.2,QY+5.5,hz+1.2),C(0xff3030).multiplyScalar(3));glowAt(hx+1.2,QY+5.5,hz+1.2,0xff3020,1);}

/* ---------- light: sodium lamps on the quays (poles, arms, heads; a pool of light and a cone of haze under each), the ship and crane
   lights, a pale moon through haze ---------- */
hemi.color.copy(C(0x3a4a6a));hemi.groundColor.copy(C(0x2a1a10));hemi.intensity=.62;
keyLight.color.copy(C(0x9ab0d8));keyLight.intensity=.42;keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:4096,coarse?1024:4096);
Object.assign(keyLight.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:400});keyLight.shadow.bias=-.0005;keyLight.shadow.normalBias=.04;
keyLight.position.set(80,150,60);keyLight.target.position.set(0,0,0);
{const LAMPS=[[-40,-15],[-30,-15.6],[-2,-19],[16,-15.6],[30,-15.6],[-22,-30],[10,-21],[-50,-14],[40,-25]],HEADS=[];
 for(const [x,z] of LAMPS)for(const s of[1,-1]){const X=x*s,Z=z*s;KIT.post(X,Z,.15,QY,9,false);const nearW=Math.abs(Z)<20,ax=nearW?0:s,az=nearW?(Z<0?1:-1):0,hx=X+ax*1.15,hz=Z+az*1.15,ry=Math.atan2(-az,ax);
   KIT.mg(faceMat).add(new THREE.CylinderGeometry(.24,.3,.5,10),M(X,QY+.25,Z),C(0x9a968e));KIT.mg(steelMat).add(new THREE.CylinderGeometry(.08,.14,9,coarse?8:12),M(X,QY+4.5,Z),K_DARK);
   for(const y of[.6,3,6])KIT.mg(steelMat).add(new THREE.CylinderGeometry(.16,.16,.08,10),M(X,QY+y,Z),K_DARK);KIT.mg(hazMat).add(new THREE.CylinderGeometry(.15,.15,.9,10),M(X,QY+1,Z),C(0xffffff));
   KIT.mg(steelMat).add(boxUV(1.4,.1,.1,1),M(X+ax*.6,QY+8.95,Z+az*.6,0,ry,0),K_DARK);strut([X,QY+8.2,Z],[X+ax*.8,QY+8.92,Z+az*.8],barG(.035),0x2a2e34,steelMat);
   KIT.mg(steelMat).add(boxUV(1,.2,.42,1),M(hx,QY+8.98,hz,0,ry,0),C(0x3a3e44));KIT.mg(KIT.lampMat).add(boxUV(.86,.04,.32,1),M(hx,QY+8.87,hz,0,ry,0),C(SODIUM).multiplyScalar(3));
   glowAt(hx,QY+8.8,hz,SODIUM,2);const g=groundAt(hx,hz);poolAt(hx,g,hz,7,SODIUM,g>1?.55:.4);coneAt(hx,QY+8.8,hz,QY+8.8-g,.35,3.8,SODIUM,.55);glintAt(hx,QY+8.8,hz,SODIUM,1.6);aoAt(X,QY,Z,.5,.5,0,.3);HEADS.push([hx,hz]);}
 const LL=coarse?HEADS.filter((_,i)=>i%2===0).slice(0,4):HEADS;for(const [x,z] of LL){const L=new THREE.PointLight(C(SODIUM),1.8,26,1.6);L.position.set(x,QY+8.3,z);scene.add(L);}
 for(const s of[1,-1]){const L=new THREE.PointLight(C(0xfff0d8),1.3,18,1.7);L.position.set(-14*s,DECK_Y+4,0);scene.add(L);glintAt(-14*s,DECK_Y+8.5,0,0xfff0d8,1);}
 for(const B of GS.BASES){const L=new THREE.PointLight(C(GS.TEAMS[B.team].c),1.6,22,1.6);L.position.set(B.x-B.fx*3,QY+4,B.z);scene.add(L);}}

/* ---------- the water: a moving swell with chop and rain rings over it; on PC a real reflection of everything above it (rendered
   from under the water each frame, half size, broken up by the waves), on phones the painted sky; long glints of every lamp ---------- */
const HB_WATER=(()=>{const NL=coarse?12:24,RQ=!coarse;const g=new THREE.PlaneGeometry(1600,1600,1,1).rotateX(-Math.PI/2);
  const rt=RQ?new THREE.WebGLRenderTarget(256,256,{type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat}):null;if(rt)rt.texture.generateMipmaps=false;
  // the lamps whose glints the water shows: those nearest the basin first
  const near=(p)=>Math.max(0,Math.abs(p[0])-34)+Math.max(0,Math.abs(p[2])-14);const GL=GLINTS.slice().sort((a,b)=>near(a)-near(b)).slice(0,NL);
  const Ls=[],LC=[];for(let i=0;i<NL;i++){const q=GL[i];Ls.push(q?new THREE.Vector3(q[0],q[1],q[2]):new THREE.Vector3(0,-99,0));LC.push(q?new THREE.Vector3(q[3].r,q[3].g,q[3].b):new THREE.Vector3());}
  const U={uT:{value:0},fogColor:{value:scene.fog.color},fogDensity:{value:scene.fog.density},beam:{value:new THREE.Vector3(1,0,0)},env:{value:HB_ENV},uRefl:{value:rt?rt.texture:null},uTM:{value:new THREE.Matrix4()},uUse:{value:0},uL:{value:Ls},uLC:{value:LC}};
  const mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,defines:{NL,REFL:RQ?1:0},
    vertexShader:'uniform mat4 uTM;varying vec3 vW;varying float vD;varying vec4 vR;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vR=uTM*w;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`varying vec3 vW;varying float vD;varying vec4 vR;uniform float uT,fogDensity,uUse;uniform vec3 fogColor,beam;uniform samplerCube env;uniform sampler2D uRefl;uniform vec3 uL[NL];uniform vec3 uLC[NL];
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float H(vec2 p){return n(p*.3+vec2(uT*.16,uT*.07))+n(p*.8-vec2(uT*.3,-uT*.16))*.5+n(p*2.1+vec2(uT*.55,uT*.3))*.26+n(p*5.3-vec2(uT*.9,uT*.45))*.12+n(p*11.0+vec2(uT*1.3,-uT))*.05;}
      void main(){vec2 p=vW.xz;float e=.05,h0=H(p);vec2 gr=vec2(H(p+vec2(e,0.0))-h0,H(p+vec2(0.0,e))-h0)/e;float fade=exp(-vD*.018);
        // rain: little rings spreading on the surface
        vec2 q=p*1.6;vec2 c=floor(q);vec2 rn=vec2(0.0);float rb=0.0;for(int i=0;i<4;i++){vec2 o=vec2(float(i/2),float(i-(i/2)*2));vec2 k=c+o;float t=fract(uT*1.1+h(k));vec2 dv=q-k-vec2(h(k+3.1),h(k+7.7));float d=length(dv);
          float ring=smoothstep(.07,0.0,abs(d-t*.5))*(1.0-t);rb+=ring;rn+=dv/max(d,.001)*ring*(1.0-t);}
        vec3 N=normalize(vec3(-(gr.x*.32+rn.x*.5)*fade-gr.x*.05,1.0,-(gr.y*.32+rn.y*.5)*fade-gr.y*.05));
        vec3 V=normalize(cameraPosition-vW);float nv=max(dot(N,V),0.0);float F=.02+.98*pow(1.0-nv,5.0);
        vec3 refl=pow(textureCube(env,reflect(-V,N)).rgb,vec3(2.2))*.7;
        #if REFL
        if(uUse>.5){vec2 suv=vR.xy/vR.w+N.xz*vec2(.05,.09)*(.3+.7*fade);refl=texture2D(uRefl,clamp(suv,.002,.998)).rgb;}
        #endif
        vec3 deep=vec3(.004,.010,.014)+vec3(.006,.008,.006)*h0;
        vec3 col=deep*(1.0-F)+refl*mix(.16,.9,F)+rb*vec3(.02,.024,.03)*fade;
        // every lamp's glint, stretched into a streak by the swell
        for(int i=0;i<NL;i++){vec3 Lv=uL[i]-vW;float d=length(Lv);vec3 L=Lv/d;vec3 Hh=normalize(L+V);float s=pow(max(dot(N,Hh),0.0),420.0);col+=uLC[i]*s*(1.5/(1.0+d*.05));}
        // the lighthouse's beam where it crosses the water
        vec2 bd=normalize(beam.xz);vec2 rel=vW.xz-vec2(150.0,-260.0);float along=dot(rel,bd);float across=abs(rel.x*bd.y-rel.y*bd.x);col+=vec3(.5,.55,.6)*smoothstep(28.0,0.0,across-along*.08)*step(0.0,along)*exp(-along*.004)*.5;
        float f=1.0-exp(-fogDensity*fogDensity*vD*vD);gl_FragColor=vec4(mix(col,fogColor,f),.95);
        #include <encodings_fragment>
      }`});
  const m=new THREE.Mesh(g,mat);m.renderOrder=1;m.userData.dyn=1;scene.add(m);
  if(rt){const vc=new THREE.PerspectiveCamera(),Nn=new THREE.Vector3(0,1,0),P0=new THREE.Vector3(),cw=new THREE.Vector3(),tgt=new THREE.Vector3(),rot=new THREE.Matrix4(),plane=new THREE.Plane(),cp=new THREE.Vector4(),q4=new THREE.Vector4(),sz=new THREE.Vector2();let busy=false;
    m.onBeforeRender=(rd,sc,cam)=>{U.uUse.value=0;if(busy||cam!==camera||!HQ)return;cw.setFromMatrixPosition(cam.matrixWorld);if(cw.y<.05)return;
      rot.extractRotation(cam.matrixWorld);tgt.set(0,0,-1).applyMatrix4(rot).add(cw);tgt.y=-tgt.y;vc.position.set(cw.x,-cw.y,cw.z);vc.up.set(0,1,0).applyMatrix4(rot).reflect(Nn);vc.lookAt(tgt);
      vc.near=cam.near;vc.far=cam.far;vc.updateMatrixWorld();vc.projectionMatrix.copy(cam.projectionMatrix);
      U.uTM.value.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
      plane.setFromNormalAndCoplanarPoint(Nn,P0).applyMatrix4(vc.matrixWorldInverse);cp.set(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant);const pe=vc.projectionMatrix.elements;
      q4.set((Math.sign(cp.x)+pe[8])/pe[0],(Math.sign(cp.y)+pe[9])/pe[5],-1,(1+pe[10])/pe[14]);cp.multiplyScalar(2/cp.dot(q4));pe[2]=cp.x;pe[6]=cp.y;pe[10]=cp.z+1;pe[14]=cp.w;
      rd.getDrawingBufferSize(sz);const w=Math.max(64,sz.x*.5|0),h=Math.max(64,sz.y*.5|0);if(rt.width!==w||rt.height!==h)rt.setSize(w,h);
      busy=true;m.visible=false;const cv=camera.visible;camera.visible=false;const prt=rd.getRenderTarget(),sau=rd.shadowMap.autoUpdate;rd.shadowMap.autoUpdate=false;
      try{rd.setRenderTarget(rt);rd.state.buffers.depth.setMask(true);if(rd.autoClear===false)rd.clear();rd.render(sc,vc);U.uUse.value=1;}catch(e){}
      rd.shadowMap.autoUpdate=sau;rd.setRenderTarget(prt);m.visible=true;camera.visible=cv;busy=false;};}
  // mist lying on the basin, drifting
  const mistM=new THREE.MeshBasicMaterial({map:glow,color:C(0x6a7a8c),transparent:true,opacity:coarse?.05:.07,depthWrite:false,blending:THREE.AdditiveBlending});const mist=[];
  for(let i=0;i<(coarse?5:9);i++){const q=new THREE.Mesh(flatQ(trr(18,30),trr(8,14)),mistM);q.position.set(trr(-30,30),trr(.3,1.4),trr(-12,12));q.renderOrder=3;q.userData.dyn=1;q.userData.v=trr(.2,.5)*(tr()<.5?-1:1);scene.add(q);mist.push(q);}
  CITY.ticks.push(dt=>{for(const q of mist){q.position.x+=q.userData.v*dt;if(q.position.x>36)q.position.x=-36;if(q.position.x<-36)q.position.x=36;}});
  return{U,m};})();

/* ---------- the far side: the harbour's other quays, Tide City over it, shore lights, the Vigil's lighthouse out on the breakwater, the sky ---------- */
{const ring=[];for(let x=-80;x<=80;x+=16)for(const z of[-46,46])ring.push([x+R(-3,3),z+R(-3,3),R(10,16),R(8,12),R(7,14)]);for(let z=-30;z<=30;z+=15)for(const x of[-70,70])ring.push([x+R(-3,3),z,R(8,12),R(10,14),R(8,18)]);
 for(const [x,z,w,d,h] of ring){const fz=z<0?d/2+.06:-d/2-.06,fx=Math.abs(x)>60?(x<0?w/2+.06:-w/2-.06):0;KIT.mg(corrMat).add(boxUV(w,h,d,4),M(x,QY+h/2,z),C(hash(x|0,z|0)<.5?0x5a6670:0x6a5a54));KIT.mg(steelMat).add(boxUV(w+.3,.3,d+.3,1),M(x,QY+h,z),K_DARK);
   for(let k=0;k<Math.floor(h/1.6);k++)for(let j=0;j<Math.floor(w/1.8);j++){const lit=hash((x*7|0)+j,(z*7|0)+k)<.35;if(!lit&&hash(j,k+9)<.5)continue;KIT.mg(KIT.lampMat).add(boxUV(1.1,.6,.05,1),M(x-w/2+.9+j*1.8,QY+1.2+k*1.6,z+fz),lit?C(0xffc080).multiplyScalar(.9+.6*hash(j,k)):C(0x141a22));}
   glowAt(x+w*.4,QY+h+.4,z,0xff3020,.8);if(hash(x|0,7)<.5){const lx=x-w*.3,lz=z+(z<0?d/2+1.5:-d/2-1.5);glowAt(lx,QY+6,lz,SODIUM,1.8);poolAt(lx,QY,lz,5,SODIUM,.4);}}
 // the far shore all round: a long scatter of lights at the water's edge and up the hills
 {const n=coarse?160:420;for(let i=0;i<n;i++){const a=Math.PI*(.05+.9*tr())+(tr()<.3?Math.PI:0),d=trr(160,520),y=trr(1,6)+(tr()<.3?trr(5,40):0);glowAt(Math.cos(a)*d,y,-Math.sin(a)*d-40,tr()<.7?SODIUM:0xfff0d8,trr(2.5,6));}}
 if(typeof SKYLINE!=='undefined'){const NS=coarse?30:80,S=SKYLINE.build({n:NS,seed:77,h:240,w:44,water:0,lit:.6,rings:true,traffic:coarse?10:36,place:(i,r)=>{const a=Math.PI*(.15+.7*(i/NS))+r()*.05,d=230+r()*380;return[Math.cos(a)*d,-Math.sin(a)*d-40,1-(d-230)/380];}});
   S.G.traverse(o=>{o.userData.dyn=1;});scene.add(S.G);CITY.ticks.push((dt,T)=>S.update&&S.update(T));}
 const sky=new THREE.Mesh(new THREE.SphereGeometry(3000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uT:{value:0}},
   vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`varying vec3 vD;uniform float uT;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
     void main(){float y=vD.y;vec2 p=vD.xz/(y+.2)*2.0+vec2(uT*.015,0.0);float c=n(p)*.5+n(p*2.3)*.28+n(p*5.1)*.14+n(p*11.0)*.08;vec3 col=mix(vec3(.13,.08,.05),vec3(.01,.015,.03),smoothstep(-.05,.5,y));
       col+=vec3(.08,.06,.05)*c*smoothstep(.0,.35,y)*(1.0-smoothstep(.35,.9,y))+vec3(.05,.03,.02)*c*smoothstep(.3,0.0,y);float st=step(.997,h(floor(vD.xz*300.0+vD.y*77.0)))*smoothstep(.2,.6,y)*(1.0-c);col+=vec3(st*.6);gl_FragColor=vec4(col,1.0);}`}));
 sky.renderOrder=-5;sky.userData.dyn=1;const sg=new THREE.Group();sg.add(sky);scene.add(sg);CITY.skies.push(sg);CITY.ticks.push((dt,T)=>{sky.material.uniforms.uT.value=T;});}
const HB_LIGHTHOUSE=(()=>{const LP=new THREE.Vector3(150,0,-260),H=46;const mg=KIT.mg(houseMat),seg=coarse?16:28;
  mg.add(new THREE.CylinderGeometry(3,4.4,H,seg,4),M(LP.x,H/2,LP.z),C(0xf0ece4));for(let k=0;k<4;k++)KIT.mg(paintMat).add(new THREE.CylinderGeometry(3.05+(.35*(4-k)/4),3.1+(.35*(4-k)/4),3,seg),M(LP.x,6+k*10,LP.z),C(0xb8302a));
  for(let k=0;k<6;k++){const a=k*1.1,r=3.6-k*.1;KIT.mg(KIT.lampMat).add(new THREE.PlaneGeometry(.6,1),M(LP.x+Math.cos(a)*r,8+k*6.5,LP.z+Math.sin(a)*r,0,Math.PI/2-a,0),C(0xffd8a0).multiplyScalar(1.2));}
  KIT.mg(paintMat).add(new THREE.CylinderGeometry(4.2,3.6,.6,seg),M(LP.x,H,LP.z),K_DARK);for(let k=0;k<24;k++){const a=k/24*Math.PI*2;KIT.mg(steelMat).add(new THREE.CylinderGeometry(.04,.04,1.1,4),M(LP.x+Math.cos(a)*4,H+.85,LP.z+Math.sin(a)*4),K_DARK);}
  KIT.mg(steelMat).add(new THREE.TorusGeometry(4,.05,4,seg).rotateX(Math.PI/2),M(LP.x,H+1.4,LP.z),K_DARK);
  KIT.mg(glassMat).add(new THREE.CylinderGeometry(2.2,2.2,3.2,12,1,true),M(LP.x,H+1.9,LP.z),C(0x6a8090));for(let k=0;k<12;k++){const a=k/12*Math.PI*2;KIT.mg(steelMat).add(boxUV(.1,3.2,.1,1),M(LP.x+Math.cos(a)*2.22,H+1.9,LP.z+Math.sin(a)*2.22),K_DARK);}
  KIT.mg(paintMat).add(new THREE.ConeGeometry(2.6,2,seg),M(LP.x,H+4.4,LP.z),C(0xb8302a));KIT.mg(steelMat).add(new THREE.SphereGeometry(.35,10,6),M(LP.x,H+5.6,LP.z),K_DARK);
  // the breakwater it stands on: armour blocks along it, a light at its end
  KIT.mg(faceMat).add(boxUV(14,3,180,6),M(LP.x-30,1,LP.z+80,0,.35,0),C(0x8a8a86));
  {const c=Math.cos(.35),s=Math.sin(.35);for(let i=0;i<(coarse?40:110);i++){const a=trr(-88,88),b=(tr()<.5?-1:1)*trr(6.5,9),x=LP.x-30+c*b+s*a,z=LP.z+80-s*b+c*a,sz=trr(1.2,2.4);KIT.mg(faceMat).add(boxUV(sz,sz,sz,2),M(x,trr(-.5,.8),z,tr(),tr()*3,tr()),C(0x9a968e).multiplyScalar(trr(.6,1)));}
   glowAt(LP.x-30-s*88,4,LP.z+80+c*88,0x40ff60,4);}
  const lamp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xfff4e0).multiplyScalar(6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));lamp.position.set(LP.x,H+1.9,LP.z);lamp.scale.setScalar(16);lamp.userData.dyn=1;scene.add(lamp);
  // the beam: a long cone you can see in the haze (a brighter core inside it), and the light it throws onto whatever it crosses
  const mk=(r1,op)=>{const beamG=new THREE.CylinderGeometry(.6,r1,520,24,1,true).rotateZ(-Math.PI/2).translate(260,0,0),cols=[];const P=beamG.attributes.position;for(let i=0;i<P.count;i++){const k=Math.pow(1-clamp(P.getX(i)/520,0,1),1.5);cols.push(k,k,k);}beamG.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
    const b=new THREE.Mesh(beamG,new THREE.MeshBasicMaterial({vertexColors:true,color:C(0xeef4ff),transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));b.position.set(LP.x,H+1.9,LP.z);b.userData.dyn=1;scene.add(b);return b;};
  const beam=mk(22,.08),core=mk(7,.12);
  const sp=new THREE.SpotLight(C(0xf4f8ff),coarse?7:10,700,.07,.6,1.0);sp.position.set(LP.x,H+1.9,LP.z);scene.add(sp,sp.target);
  const PERIOD=12;CITY.ticks.push((dt,T)=>{const a=T/PERIOD*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a);beam.rotation.set(0,-a,-.045);core.rotation.set(0,-a,-.045);sp.target.position.set(LP.x+dx*400,-10,LP.z+dz*400);HB_WATER.U.beam.value.set(dx,0,dz);
    // the beam is only worth the light on the map when it's turned toward it; the lamp flares when it looks straight at you
    const toward=Math.max(0,(dx*(-LP.x)+dz*(-LP.z))/LP.length());sp.intensity=(coarse?7:10)*Math.pow(toward,6)*1.4;
    const cx=camera.position.x-LP.x,cz=camera.position.z-LP.z,cl=Math.hypot(cx,cz)||1,fl=Math.pow(Math.max(0,(dx*cx+dz*cz)/cl),60);lamp.scale.setScalar(16+70*fl);});return{LP};})();

/* ---------- the glows: one cloud of soft sprites, sized in metres ---------- */
{const n=GLOWS.length,pos=new Float32Array(n*3),col=new Float32Array(n*3),sz=new Float32Array(n);GLOWS.forEach(([x,y,z,c,s],i)=>{pos.set([x,y,z],i*3);const k=C(c);col.set([k.r,k.g,k.b],i*3);sz[i]=s;});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('col',new THREE.BufferAttribute(col,3));g.setAttribute('sz',new THREE.BufferAttribute(sz,1));
 const U={map:{value:glow},uS:{value:300},fogDensity:{value:scene.fog.density}};
 const m=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:'attribute vec3 col;attribute float sz;uniform float uS,fogDensity;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);float d=-mv.z;vC=col*exp(-fogDensity*fogDensity*d*d*.35)*.75;gl_PointSize=min(sz*uS/max(d,.5),256.0);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform sampler2D map;varying vec3 vC;void main(){float a=texture2D(map,gl_PointCoord).a;gl_FragColor=vec4(vC*a*a,1.0);}'}));
 m.frustumCulled=false;m.renderOrder=5;m.userData.dyn=1;scene.add(m);const s2=new THREE.Vector2();
 CITY.ticks.push(()=>{renderer.getDrawingBufferSize(s2);U.uS.value=s2.y/(2*Math.tan(camera.fov*Math.PI/360));});}

/* ---------- the weather, the water's sounds; wading slows you ---------- */
KIT.rain({n:coarse?600:2200,col:0x9ab0c8,op:.3,slant:[.6,1.4]});
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
