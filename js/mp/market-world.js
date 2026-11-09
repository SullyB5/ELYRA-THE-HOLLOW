/* Elyra · TakeOver · Midnight Market — the world (Oct 31, Bryce: picked from the ideas, "Midnight Market / Tide City rooftops ...
   go all out"). Two maps stacked on top of each other:

     the roofs    a tight block of Tide City at night, thirteen buildings a side of the street at different heights (5 to 14 m), flat
                  roofs with parapets, water tanks, vents and stair huts for cover; gaps of 2 to 4 m between them, some with planks
                  or metal stairs across, the rest you jump (sprint for the wider ones). Fall off and you don't die: you land in…
     the market   the covered street down the middle (x), stalls on both sides under tarps and lanterns, and the alleys behind it,
                  with fire escapes and stairwells back up. Gun racks down here, so the street is worth fighting for
     the towers   the two tallest (14 m) stand either side of the street in the middle, joined by a skybridge with the holo-billboard
                  hung under it, one face toward each side; whoever stands up there is lit by it. Three ways up each tower: the
                  fire escape up its back, the stair and bridge from the roof next to it, and the jump from a roof below
   Blue spawns on its own low roof at the west end (4.5 m), red at the east: a broad stair down into the street, a plank to the roof
   next door, a steep stair up to the tall one behind. The whole map is the same turned half way round (x,z → -x,-z).
   Rain the whole time, neon in team colours, a ship going over now and then with its light sweeping the roofs.

   Built on js/mp/kit.js (the frame, the contract, the bots' map). Units are metres; north is -z. */
setSeed(5151);
renderer.toneMappingExposure=1.18;
HAZE_HEX=0x0b0d1a;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),.016);scene.background=C(0x05060d);

/* ---------- the plan ---------- */
const GS=(()=>{
  const HALF=58,BASE_R=7;
  const BASES=[{team:'blue',x:-50.5,z:0},{team:'red',x:50.5,z:0}].map(B=>{B.fx=-Math.sign(B.x);B.fz=0;B.r=BASE_R;B.shieldR=11.5;B.spawnR=2.5;B.spawnStep=2;B.y=4.5;return B;});
  const CFG={id:'mpmarket',name:'MIDNIGHT MARKET',sub:'Team deathmatch · rooftops at night',air:false,vehicles:false,bots:8,score:50,time:10*60,see:80,range:70,hold:18,flashlights:false,beacon:false,domeK:.32,domeFog:true,
    brief:'TakeOver · team deathmatch. A block of Tide City at night in the rain: two maps on top of each other. Up top, the roofs, with gaps to jump; fall off and you land in the market street under the tarps. The two towers in the middle and the skybridge between them are the high ground.',
    objective:'Down the other side. Your roof has guns and ammo; the market has more. Nothing crosses your dome.'};
  return{HALF,HALFZ:38,SEA:-99,TEAMS:TEAM_COLS,BASES,BASE_R,CFG,NAME:CFG.name};})();
const MK_PLAT=[-58,-43,-11,11],MK_PLAT_H=4.5;
const inR=(r,x,z,m)=>{m=m||0;return x>=r[0]-m&&x<=r[1]+m&&z>=r[2]-m&&z<=r[3]+m;};
const mirR=r=>[-r[1],-r[0],-r[3],-r[2]];
CITY.ground=(x,z)=>(inR(MK_PLAT,x,z)||inR(mirR(MK_PLAT),x,z))?MK_PLAT_H:0;
CITY.edge=(x,z)=>Math.max(Math.abs(x)-57.6,Math.abs(z)-37.6);
CITY.box=[-58,-38,58,38];CITY.step=2.2;
kitContract();

/* ---------- the buildings: one half by hand, the other its twin ---------- */
// [x0,x1,z0,z1,h,name]
const MK_HALF=[
  // the front row, on the market street
  [-40,-29,-17,-5,6,'A'],[-26,-12,-17,-5,9,'B'],[-9,3,-17,-5,14,'T'],[6,17,-17,-5,7.5,'C'],[20,30,-17,-5,5,'D'],[33,40,-17,-5,9,'E'],
  // the back row, over the back alley
  [-58,-44,-38,-15,8,'G'],[-41,-26,-38,-21,11,'H'],[-23,-12,-38,-21,6.5,'I'],[-9,3,-38,-21,9,'J'],[6,20,-38,-21,12,'K'],[23,34,-38,-21,7,'L'],[37,41,-38,-21,10,'N'],[44,58,-38,-15,5.5,'M']];
const MK_BLD=[];
for(const b of MK_HALF)for(const s of[1,-1]){const r=s>0?b.slice(0,4):mirR(b);MK_BLD.push({r,h:b[4],name:b[5]+(s>0?'':"'"),front:b[3]===-5,tower:b[5]==='T',s});}
for(const B of MK_BLD){if(B.name[0]==='C'){B.club=true;continue;}B.k=KIT.block(B.r,-.3,B.h);}
/* ---------- the club (Oct 31, Bryce's reference: the nightclub in New Alexandria): C's ground floor, both halves. A dark room with
   light hanging in columns from the ceiling, a burning sphere over the floor, a lit platform under it, the bar along the back.
   Three ways in: the street, the alley beside it, the back alley. The building stands on it from 4.4 m up ---------- */
const CLUB={r:[6,17,-17,-5],h:4.4,sphere:[11.5,-11]};
const CLUB_DOORS=[['s',9.5,12.5],['w',-12,-9.6],['n',13,15.4]];   // [face, from, to] (along x for n/s, along z for w)
const clubR=s=>s>0?CLUB.r:mirR(CLUB.r),clubP=(s,x,z)=>s>0?[x,z]:[-x,-z];
for(const s of[1,-1]){const [x0,x1,z0,z1]=CLUB.r;
  KIT.block(clubR(s),CLUB.h,7.5);
  const edge=(face,a0,a1)=>{const doors=CLUB_DOORS.filter(d=>d[0]===face).sort((p,q)=>p[1]-q[1]);let cur=a0;const put=(a,b)=>{if(b-a<.05)return;let p,q;
      if(face==='s'){p=clubP(s,a,z1);q=clubP(s,b,z1);}else if(face==='n'){p=clubP(s,a,z0);q=clubP(s,b,z0);}else if(face==='w'){p=clubP(s,x0,a);q=clubP(s,x0,b);}else{p=clubP(s,x1,a);q=clubP(s,x1,b);}
      KIT.wall(p[0],p[1],q[0],q[1],-.3,CLUB.h+.1,.4);};
    for(const d of doors){put(cur,d[1]);cur=d[2];}put(cur,a1);};
  edge('s',x0,x1);edge('n',x0,x1);edge('w',z0,z1);edge('e',z0,z1);
  // the platform under the sphere (a step up), the bar, the booths, two pillars
  KIT.block(s>0?[9.5,13.5,-12.6,-9.4]:mirR([9.5,13.5,-12.6,-9.4]),-.1,.5);
  KIT.block(s>0?[7.4,12.2,-16.4,-15.3]:mirR([7.4,12.2,-16.4,-15.3]),-.1,1.1);
  for(const r of[[6.5,8.2,-8,-5.8],[15.2,16.6,-8.6,-6],[15.2,16.6,-13.6,-11.2]])KIT.block(s>0?r:mirR(r),-.1,.9);
  for(const [x,z] of[[8.4,-12.8],[14.6,-9.2]]){const p=clubP(s,x,z);KIT.post(p[0],p[1],.3,0,CLUB.h);}}
// the bases' roofs: solid to their tops (CITY.ground stands you on them)
for(const r of[MK_PLAT,mirR(MK_PLAT)])KIT.block(r,-.3,MK_PLAT_H,{top:false});

/* ---------- the ways up and across (stairs, planks, fire escapes): one half, the other its twin ----------
   [P0, u, L, w, yA, yB, base (the roof under it, for its solid underside), rails [left, right]] */
const MK_RAMPS=[
  // the bases: the broad stair down into the street, the plank to A, the steep stair up to G
  [[-43.3,0],[1,0],8,6,4.5,0,null,[true,true]],
  [[-44,-8.5],[1,0],5,2.2,4.5,6,null,[true,true]],
  [[-50.5,-10.6],[0,-1],5,2.4,4.5,8,null,[true,true]],
  // red's own: the plank north onto M (its twin is blue's onto M')
  [[50.5,-10.6],[0,-1],5,2.4,4.5,5.5,null,[true,true]],
  // A up to B: a stair on A's roof, a plank across the alley
  [[-36,-15.2],[1,0],6.5,1.6,6,9,6,[true,true]],[[-29.5,-15.2],[1,0],4,1.6,9,9,null,[true,true]],
  // B up to the tower: a stair across B's roof, the bridge over the alley
  [[-21.5,-10],[1,0],9,1.8,9,14,9,[true,true]],[[-12.5,-10],[1,0],4,1.8,14,14,null,[true,true]],
  // B down to I over the back alley
  [[-19,-16.6],[0,-1],5,2,9,6.5,null,[true,true]],
  // C down to D, D up to L, D up to E
  [[16.4,-8],[1,0],4.2,1.8,7.5,5,null,[true,true]],
  [[25,-16.6],[0,-1],5,2,5,7,null,[true,true]],
  [[22.5,-11],[1,0],7.3,1.6,5,9,5,[true,true]],[[29.8,-11],[1,0],3.8,1.6,9,9,null,[true,true]],
  // E up to N's water-tower roof
  [[38.5,-16.6],[0,-1],5,2,9,10,null,[true,true]],
  // the back row: G up to H, I up to J, J up to K
  [[-51,-36.5],[1,0],6.4,1.6,8,11,8,[true,true]],[[-44.6,-36.5],[1,0],4,1.6,11,11,null,[true,true]],
  [[-18,-36.5],[1,0],5.5,1.6,6.5,9,6.5,[true,true]],[[-12.5,-36.5],[1,0],4,1.6,9,9,null,[true,true]],
  [[-3,-36.5],[1,0],5.5,1.6,9,12,9,[true,true]],[[2.5,-36.5],[1,0],4,1.6,12,12,null,[true,true]],
  // from the street: up D's front, up C's side from the street, (the tower's and H's fire escapes below)
  [[21,-4.3],[1,0],7,1.5,0,5,null,[false,true]],
  [[17.9,-5.6],[0,-1],10.8,1.6,0,7.5,null,[false,true]],
  // the tower's fire escape up its back, in two flights (landings below)
  [[-7.5,-17.9],[1,0],9,1.6,0,7,null,[true,false]],[[1.5,-19.6],[-1,0],9,1.6,7,14,null,[true,true]],
  // H's fire escape, the same
  [[-39,-20.2],[1,0],8,1.6,0,5.5,null,[false,true]],[[-31,-18.5],[-1,0],8,1.6,5.5,11,null,[true,true]],
];
const MK_LANDINGS=[[2.5,-18.75,2,3.3,7],[-8.5,-18.6,2,3.6,14],[-30.1,-19.35,1.8,3.3,5.5],[-40,-19.4,2,3.6,11]];   // [cx,cz,lx,lz,y]
const MK_RAMP_OBJ=[];
for(const q of MK_RAMPS)for(const s of[1,-1]){const [P0,u,L,w,yA,yB,base,rails]=q;
  MK_RAMP_OBJ.push(KIT.ramp([P0[0]*s,P0[1]*s],u[0]*s,u[1]*s,L,w,yA,yB,{base,rails}));}
for(const [cx,cz,lx,lz,y] of MK_LANDINGS)for(const s of[1,-1])KIT.deck(cx*s,cz*s,0,lx,lz,y,0,0);
// the landings' outer rails
for(const s of[1,-1]){KIT.rail(3.5*s,-17.1*s,3.5*s,-20.4*s,7);KIT.rail(1.5*s,-20.4*s,3.5*s,-20.4*s,7);KIT.rail(-9.5*s,-17*s,-9.5*s,-20.4*s,14);KIT.rail(-9.5*s,-20.4*s,-7.5*s,-20.4*s,14);
  KIT.rail(-29.2*s,-17.7*s,-29.2*s,-21*s,5.5);KIT.rail(-41*s,-17.7*s,-39*s,-17.7*s,11);}
// the skybridge between the towers, its low walls to fight behind
const MK_BRIDGE=KIT.deck(0,0,0,6,10.6,14,0,0);
for(const x of[-3,3])KIT.wall(x,-5,x,5,14,15.05,.3);
// the stair top from the street up C's side lands on its roof: and the tower's back landing joins its roof
// (all of it is walkable: the planks overlap the roofs at both ends)

/* ---------- what stands on the roofs and in the street (cover) ---------- */
const nearRamp=(x,z,y,m)=>{for(const R of KIT.PAIRS){const q=R.loc(x,z);if(q[0]>-m-.4&&q[0]<R.L+m+.4&&Math.abs(q[1])<R.w/2+m&&Math.abs(R.hAt(q[0])-y)<3.5)return true;}
  for(const [cx,cz,lx,lz] of MK_LANDINGS)for(const s of[1,-1])if(Math.abs(x-cx*s)<lx/2+m&&Math.abs(z-cz*s)<lz/2+m)return true;
  if(Math.abs(x)<3+m&&Math.abs(z)<5.4+m&&y>12)return true;return false;};
const MK_PROPS=[];   // {kind,x,z,y,...} for drawing
function roofProps(B){const [x0,x1,z0,z1]=B.r,h=B.h,area=(x1-x0)*(z1-z0),n=Math.round(area/60)+1;let tries=0,made=0;
  while(made<n&&tries<60){tries++;const x=R(x0+1.8,x1-1.8),z=R(z0+1.8,z1-1.8);if(nearRamp(x,z,h,1.6))continue;
    if(MK_PROPS.some(p=>p.y===h&&Math.hypot(p.x-x,p.z-z)<3.4))continue;const k=hash(x*7|0,z*11|0);
    if(k<.3){KIT.post(x,z,1.15,h,2.6);MK_PROPS.push({kind:'tank',x,z,y:h,r:1.15});}
    else if(k<.6){const ry=k<.45?0:Math.PI/2;KIT.block({cx:x,cz:z,ry,l:1.8,w:1.2,y0:0},h-.1,h+1.15);MK_PROPS.push({kind:'ac',x,z,y:h,ry});}
    else if(k<.78){KIT.block({cx:x,cz:z,ry:0,l:2.4,w:2.4},h-.1,h+2.5);MK_PROPS.push({kind:'hut',x,z,y:h});}
    else{KIT.block({cx:x,cz:z,ry:0,l:1,w:1,y0:0},h-.1,h+1.4,{top:false});MK_PROPS.push({kind:'vent',x,z,y:h});}
    made++;}}
for(const B of MK_BLD)if(B.r[1]-B.r[0]>6)roofProps(B);   // (not on the narrow water-tower block: it's only a landing)
// parapets: round every roof's edge, 0.85 m, with a gap wherever a stair, plank or landing meets it (seen and shot over; jumped over)
const MK_PARA=[];
function parapets(r,h){const [x0,x1,z0,z1]=r,E=[[x0,z0,x1,z0],[x1,z0,x1,z1],[x1,z1,x0,z1],[x0,z1,x0,z0]];
  for(const [ax,az,bx,bz] of E){const L=Math.hypot(bx-ax,bz-az),n=Math.ceil(L/.5);let s0=null;
    for(let k=0;k<=n;k++){const t=k/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,ok=k<n&&!nearRamp(x,z,h,.35);
      if(ok&&s0===null)s0=t;if(!ok&&s0!==null){const t1=t;if((t1-s0)*L>.6){const p0=[ax+(bx-ax)*s0,az+(bz-az)*s0],p1=[ax+(bx-ax)*t1,az+(bz-az)*t1];KIT.wall(p0[0],p0[1],p1[0],p1[1],h-.1,h+.85,.3);MK_PARA.push([p0,p1,h]);}s0=null;}}}}
for(const B of MK_BLD)parapets(B.r,B.h);
for(const r of[MK_PLAT,mirR(MK_PLAT)])parapets(r,MK_PLAT_H);
// the market stalls: counters you can hop onto, canopies over them, both sides of the street (one side here, the other its twin)
const MK_STALLS=[[-31.5,2.8],[-25,2.6],[-18.5,3],[-6.5,2.4],[8.5,2.6],[14.5,2.8],[23,2.4],[30.5,2.6]];
for(const [x,w] of MK_STALLS)for(const s of[1,-1])KIT.block({cx:x*s,cz:-3.05*s,ry:0,l:w,w:1.3},-.1,1.05);
// crates and barrels on the street and in the alleys
const MK_CRATES=[[-21.8,-1.2,1.2,1],[-1.5,2.2,1.1,1.1],[11.2,-1.6,1.2,.9],[27.8,1.4,1.2,1.2],[-35.2,-19,1.3,1.2],[-14,-19.4,1.2,1],[4.5,-19.5,1.2,1.2],[31.4,-19,1.2,1.1],[-41.6,-14,1.1,1.1],[18.5,-19.2,1.1,1],[-51,13.2,1.2,1.2]];
for(const [x,z,l,h] of MK_CRATES)for(const s of[1,-1])KIT.block({cx:x*s,cz:z*s,ry:hash(x*3|0,z|0)*.6,l,w:l},-.1,h);
const MK_BARRELS=[[-27.2,1.5],[5.6,-1.8],[-11,-19.6],[24.6,-19.4],[-33.4,-12],[36.6,-19.6]];
for(const [x,z] of MK_BARRELS)for(const s of[1,-1])KIT.post(x*s,z*s,.38,0,1);
// street lamps
const MK_LAMPS=[[-38,-4.3],[-20,-4.3],[-2,-4.4],[12,-4.4],[28,-4.3]];
for(const [x,z] of MK_LAMPS)for(const s of[1,-1])KIT.post(x*s,z*s,.14,0,5,false);

/* ---------- materials ---------- */
const MK_ENV=KIT.env((x,y,z)=>{// a wet night: dark violet sky, the city's glow low all round, neon smears at street height
  const hz=1-Math.abs(y);let r=.02+.05*hz*hz,g=.02+.03*hz*hz,b=.05+.06*hz*hz;const a=Math.atan2(z,x);
  const band=sstep(.55,.95,hz)*(.5+.5*Math.sin(a*9))*(.5+.5*Math.sin(a*3.7+1));r+=band*.45*(.5+.5*Math.sin(a*2));g+=band*.12;b+=band*.4*(.5+.5*Math.cos(a*2.6));
  const cy=sstep(.7,1,hz)*(.5+.5*Math.sin(a*5+2));g+=cy*.25;b+=cy*.3;return[r,g,b];});
/* (Nov 8, the 2x pass) a height map → a normal map (green up), for the facades', the paving's and the roofs' relief */
const MK_HI=!coarse;
function mkNormal(hc,str){const W=hc.width,H=hc.height,s=hc.getContext('2d').getImageData(0,0,W,H).data,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),im=g.createImageData(W,H);
  const hh=(x,y)=>s[((((y+H)%H)*W)+((x+W)%W))*4]/255;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const nx=(hh(x-1,y)-hh(x+1,y))*str,ny=(hh(x,y+1)-hh(x,y-1))*str,l=Math.hypot(nx,ny,1),o=(y*W+x)*4;
    im.data[o]=(nx/l*.5+.5)*255;im.data[o+1]=(ny/l*.5+.5)*255;im.data[o+2]=(1/l*.5+.5)*255;im.data[o+3]=255;}
  g.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=coarse?2:8;return t;}
// the facade: floors of windows, some lit warm, some cold, a few in neon colours, most dark; recessed in frames with sills, rain on the
// glass, grime run down from the sills, panel joints in the concrete. Its emissive map is the lit ones only; its height gives the
// relief (a normal map) and the wet: glass near-mirror, concrete damp. Same window layout as before (4 x 4 to an 8 m tile: windows
// centred on the odd metres, 0.55 to 1.6 m up each 2 m storey), so the sills, AC units and pipes drawn in 3D line up with them
function facadeTex(){const W=MK_HI?512:256,H=W,k=W/256,mk=()=>{const c=document.createElement('canvas');c.width=c.height=W;return c;};
  const c=mk(),e=mk(),hc=mk(),rc=mk(),g=c.getContext('2d'),q=e.getContext('2d'),hg=hc.getContext('2d'),rg=rc.getContext('2d');
  g.fillStyle='#3a3d48';g.fillRect(0,0,W,H);q.fillStyle='#000';q.fillRect(0,0,W,H);hg.fillStyle='#808080';hg.fillRect(0,0,W,H);rg.fillStyle='#a0a0a0';rg.fillRect(0,0,W,H);
  // concrete: blotches, panel joints every half tile, grime streaks
  for(let i=0;i<900*k;i++){const v=Math.random();g.fillStyle=`rgba(${v<.5?0:255},${v<.5?0:255},${v<.5?10:255},${Math.random()*.05})`;g.beginPath();g.arc(Math.random()*W,Math.random()*H,Math.random()*9*k,0,7);g.fill();}
  for(let i=0;i<220*k;i++){g.fillStyle=`rgba(${20+Math.random()*30|0},${20+Math.random()*28|0},${30+Math.random()*30|0},${Math.random()*.22})`;g.fillRect(Math.random()*W,Math.random()*H,(1+Math.random()*3)*k,(8+Math.random()*60)*k);}
  for(const p of[0,W/2]){g.fillStyle='rgba(10,12,18,.55)';g.fillRect(p,0,1.5*k,H);hg.fillStyle='#404040';hg.fillRect(p,0,2*k,H);}
  const rows=4,cols=4,cw=W/cols,rh=H/rows;
  for(let y=0;y<rows;y++){// the floor slab's line, a little proud
    g.fillStyle='rgba(70,74,86,.6)';g.fillRect(0,y*rh+rh-5*k,W,3*k);hg.fillStyle='#a0a0a0';hg.fillRect(0,y*rh+rh-5*k,W,3*k);
    for(let x=0;x<cols;x++){const wx=x*cw+cw*.16,wy=y*rh+rh*.2,ww=cw*.68,wh=rh*.52,on=Math.random(),warm=Math.random()<.6,neonW=Math.random()<.12;
    // the frame (proud), the reveal (dark, deep), the sill under it, the grime run down from the sill
    const gr=g.createLinearGradient(0,wy+wh,0,wy+wh+rh*.45);gr.addColorStop(0,'rgba(12,12,18,.45)');gr.addColorStop(1,'rgba(12,12,18,0)');g.fillStyle=gr;g.fillRect(wx+ww*.1,wy+wh,ww*.8,rh*.45);
    rg.fillStyle='rgba(60,60,60,.5)';rg.fillRect(wx+ww*.1,wy+wh,ww*.8,rh*.35);
    g.fillStyle='#1a1c24';g.fillRect(wx-4*k,wy-4*k,ww+8*k,wh+8*k);hg.fillStyle='#b8b8b8';hg.fillRect(wx-4*k,wy-4*k,ww+8*k,wh+8*k);
    g.fillStyle='#4a4e5a';g.fillRect(wx-6*k,wy+wh+3*k,ww+12*k,4*k);hg.fillStyle='#e0e0e0';hg.fillRect(wx-6*k,wy+wh+3*k,ww+12*k,4*k);
    hg.fillStyle='#202020';hg.fillRect(wx,wy,ww,wh);rg.fillStyle='#181818';rg.fillRect(wx,wy,ww,wh);
    if(on<.34){const col=neonW?['#ff4fd8','#41f0ff','#9b5cff'][Math.random()*3|0]:warm?['#ffcf8a','#ffb870','#ffe0b0'][Math.random()*3|0]:['#9fe0ff','#c8b8ff','#7fd8e8'][Math.random()*3|0];
      // the room: lit from a ceiling lamp, darker toward the sill, a shape or two of furniture
      const ig=g.createLinearGradient(0,wy,0,wy+wh);ig.addColorStop(0,col);ig.addColorStop(1,'#2a2028');g.fillStyle=ig;g.fillRect(wx,wy,ww,wh);
      const iq=q.createLinearGradient(0,wy,0,wy+wh);iq.addColorStop(0,col);iq.addColorStop(1,'#140c10');q.fillStyle=iq;q.fillRect(wx,wy,ww,wh);
      if(Math.random()<.5){q.fillStyle=g.fillStyle='rgba(0,0,0,.55)';const fx=wx+Math.random()*ww*.6;g.fillRect(fx,wy+wh*.6,ww*.35,wh*.4);q.fillRect(fx,wy+wh*.6,ww*.35,wh*.4);}
      // blinds or a curtain half across, a figure's shadow now and then
      if(Math.random()<.6){const bl=Math.random()*wh*.6;g.fillStyle='rgba(20,18,24,.55)';q.fillStyle='rgba(0,0,0,.6)';g.fillRect(wx,wy,ww,bl);q.fillRect(wx,wy,ww,bl);for(let j=0;j<bl;j+=3*k){q.fillStyle='rgba(0,0,0,.4)';q.fillRect(wx,wy+j,ww,1*k);}}
      else{const cw2=ww*(.2+Math.random()*.3),side=Math.random()<.5;g.fillStyle=q.fillStyle='rgba(30,10,20,.6)';g.fillRect(side?wx:wx+ww-cw2,wy,cw2,wh);q.fillRect(side?wx:wx+ww-cw2,wy,cw2,wh);}
      if(Math.random()<.2){q.fillStyle='rgba(0,0,0,.7)';q.fillRect(wx+ww*.3,wy+wh*.35,ww*.18,wh*.65);}}
    else{g.fillStyle=on<.5?'#1c2230':'#11141c';g.fillRect(wx,wy,ww,wh);
      // the dark glass catches the sky's glow: a soft diagonal sheen
      const sh=g.createLinearGradient(wx,wy,wx+ww,wy+wh);sh.addColorStop(0,'rgba(140,120,200,.16)');sh.addColorStop(.5,'rgba(140,120,200,.03)');sh.addColorStop(1,'rgba(60,180,220,.1)');g.fillStyle=sh;g.fillRect(wx,wy,ww,wh);}
    // mullions: a cross in each window
    g.fillStyle=q.fillStyle='#0e0f14';g.fillRect(wx+ww/2-1.5*k,wy,3*k,wh);g.fillRect(wx,wy+wh*.38,ww,2.5*k);q.fillRect(wx+ww/2-1.5*k,wy,3*k,wh);q.fillRect(wx,wy+wh*.38,ww,2.5*k);
    hg.fillStyle='#606060';hg.fillRect(wx+ww/2-1.5*k,wy,3*k,wh);hg.fillRect(wx,wy+wh*.38,ww,2.5*k);
    // rain on the glass
    for(let j=0;j<6*k;j++){const rx=wx+Math.random()*ww,ry=wy+Math.random()*wh*.5;g.fillStyle='rgba(220,230,255,.12)';g.fillRect(rx,ry,1,(4+Math.random()*16)*k);}}}
  const t=new THREE.CanvasTexture(c),te=new THREE.CanvasTexture(e),tr=new THREE.CanvasTexture(rc);for(const x of[t,te,tr]){x.wrapS=x.wrapT=THREE.RepeatWrapping;x.anisotropy=coarse?2:8;}t.encoding=te.encoding=THREE.sRGBEncoding;
  return[t,te,mkNormal(hc,2.2),tr];}
const [MK_FAC,MK_FACE,MK_FACN,MK_FACR]=facadeTex();
const facMat=new THREE.MeshStandardMaterial({vertexColors:true,map:MK_FAC,emissive:0xffffff,emissiveMap:MK_FACE,emissiveIntensity:1.5,roughness:1,roughnessMap:MK_FACR,normalMap:MK_FACN,normalScale:new THREE.Vector2(.9,.9),metalness:.18,envMap:MK_ENV,envMapIntensity:.85});
// the shopfronts along the street: glass, warm light, signs over them; and roller shutters on the dark ones
function shopTex(){const W=512,H=128,c=document.createElement('canvas'),e=document.createElement('canvas');c.width=e.width=W;c.height=e.height=H;const g=c.getContext('2d'),q=e.getContext('2d');
  g.fillStyle='#1a1c24';g.fillRect(0,0,W,H);q.fillStyle='#000';q.fillRect(0,0,W,H);
  for(let i=0;i<4;i++){const x=i*128+6,w=116;const open=Math.random()<.7;
    if(open){const col=['#ffb86a','#ffd59a','#9fe8ff','#ff9ad0','#b8ffcf'][Math.random()*5|0];const gr=g.createLinearGradient(0,30,0,H);gr.addColorStop(0,col);gr.addColorStop(1,'#3a2a20');g.fillStyle=gr;g.fillRect(x,30,w,H-34);
      q.fillStyle=col;q.globalAlpha=.85;q.fillRect(x,30,w,H-34);q.globalAlpha=1;
      // shelves and goods
      for(let k=0;k<3;k++){g.fillStyle='rgba(30,20,20,.7)';g.fillRect(x+6,48+k*24,w-12,3);for(let j=0;j<8;j++){g.fillStyle=`hsl(${Math.random()*360},50%,${30+Math.random()*30}%)`;g.fillRect(x+10+j*13,38+k*24,8,10);}}
      g.fillStyle='rgba(10,10,14,.9)';g.fillRect(x+w*.4,60,3,H-64);q.fillStyle='#000';q.fillRect(x+w*.4,60,3,H-64);}
    else{g.fillStyle='#40444c';g.fillRect(x,30,w,H-34);for(let k=30;k<H;k+=5){g.fillStyle='#2a2d34';g.fillRect(x,k,w,2);}
      g.fillStyle='rgba(255,90,170,.6)';g.font='bold 14px monospace';g.fillText(KIT.glyphWord(3,i*13+7),x+30,90);}
    // the awning stripe and a sign board
    g.fillStyle='#0a0c12';g.fillRect(x-4,0,w+8,28);const sc=['#ff4fd8','#41f0ff','#ffb03a','#7cff8a','#ff5050'][Math.random()*5|0];g.fillStyle=sc;q.fillStyle=sc;g.font='bold 18px sans-serif';
    const word=Math.random()<.5?KIT.glyphWord(4,i*31+3):['NOODLES','PARTS','CHARMS','TEA','AUGMENT','REPAIR','DUMPLINGS','TONICS'][Math.random()*8|0];g.fillText(word,x+10,20);q.font='bold 18px sans-serif';q.fillText(word,x+10,20);}
  const t=new THREE.CanvasTexture(c),te=new THREE.CanvasTexture(e);for(const x of[t,te]){x.wrapS=x.wrapT=THREE.RepeatWrapping;x.anisotropy=coarse?2:8;x.encoding=THREE.sRGBEncoding;}return[t,te];}
const [MK_SHOP,MK_SHOPE]=shopTex();
const shopMat=new THREE.MeshStandardMaterial({vertexColors:true,map:MK_SHOP,emissive:0xffffff,emissiveMap:MK_SHOPE,emissiveIntensity:.75,roughness:.3,metalness:.2,envMap:MK_ENV,envMapIntensity:.8});
// the wet ground: paving slabs and their joints (sunk, in the normal map), the puddles near-mirror (the roughness map), cracks, oil
// sheen. The roofs: tarred membrane laid in strips with lapped seams, patches, gravel, standing water in the low spots
function pavingTex(kind){const W=MK_HI?1024:512,k=W/512,mk=()=>{const c=document.createElement('canvas');c.width=c.height=W;return c;};
  const c=mk(),r=mk(),hc=mk(),g=c.getContext('2d'),q=r.getContext('2d'),hg=hc.getContext('2d');const roof=kind==='roof';
  g.fillStyle=roof?'#2c2d30':'#26272c';g.fillRect(0,0,W,W);hg.fillStyle='#909090';hg.fillRect(0,0,W,W);
  if(!roof){const S=42*k;for(let y=0;y<W;y+=S)for(let x=(y/S%2)*S/2-S;x<W+S;x+=S){const v=28+Math.random()*16|0;g.fillStyle=`rgb(${v},${v},${v+4})`;g.fillRect(x+1,y+1,S-2,S-2);
      hg.fillStyle=`rgb(${130+Math.random()*40|0},0,0)`;hg.fillRect(x+2*k,y+2*k,S-4*k,S-4*k);
      g.fillStyle='#121316';g.fillRect(x,y,S,1.5*k);g.fillRect(x,y,1.5*k,S);hg.fillStyle='#202020';hg.fillRect(x,y,S,2*k);hg.fillRect(x,y,2*k,S);
      if(Math.random()<.08){g.strokeStyle='rgba(8,8,10,.8)';g.lineWidth=k;g.beginPath();let px=x+Math.random()*S,py=y+Math.random()*S;g.moveTo(px,py);for(let j=0;j<4;j++){px+=(Math.random()-.5)*S*.5;py+=(Math.random()-.5)*S*.5;g.lineTo(px,py);}g.stroke();}}}
  else{const S=64*k;for(let y=0;y<W;y+=S){const v=36+Math.random()*10|0;g.fillStyle=`rgb(${v},${v},${v+3})`;g.fillRect(0,y,W,S);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,y+S-3*k,W,3*k);g.fillStyle='rgba(120,120,130,.12)';g.fillRect(0,y+S-5*k,W,2*k);
      hg.fillStyle='#b0b0b0';hg.fillRect(0,y+S-6*k,W,4*k);}
    for(let i=0;i<14;i++){const x=Math.random()*W,y=Math.random()*W,w=(30+Math.random()*90)*k,h=(20+Math.random()*60)*k,v=26+Math.random()*16|0;g.fillStyle=`rgb(${v},${v},${v+2})`;g.fillRect(x,y,w,h);g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=2*k;g.strokeRect(x,y,w,h);hg.fillStyle='#a8a8a8';hg.fillRect(x,y,w,h);}
    for(let i=0;i<6000*k;i++){const v=Math.random()*90|0;g.fillStyle=`rgba(${v},${v},${v},.35)`;g.fillRect(Math.random()*W,Math.random()*W,1.5*k,1.5*k);}}
  for(let i=0;i<500*k;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.25})`;g.beginPath();g.arc(Math.random()*W,Math.random()*W,Math.random()*6*k,0,7);g.fill();}
  // oil sheen here and there on the street
  if(!roof)for(let i=0;i<10;i++){const x=Math.random()*W,y=Math.random()*W,rr=(10+Math.random()*30)*k,o=g.createRadialGradient(x,y,0,x,y,rr);o.addColorStop(0,'rgba(120,60,160,.18)');o.addColorStop(.5,'rgba(40,140,160,.12)');o.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=o;g.fillRect(x-rr,y-rr,rr*2,rr*2);}
  // roughness: damp .7 (bright), the puddles near-mirror (dark), and the puddles sit low and flat in the height
  q.fillStyle=roof?'#a4a4a4':'#b0b0b0';q.fillRect(0,0,W,W);for(let i=0;i<(roof?20:30);i++){const x=Math.random()*W,y=Math.random()*W,rr=(20+Math.random()*70)*k,sy=.4+Math.random()*.5,rot=Math.random()*3;
    for(const [ctx,a,b] of[[q,'#0c0c0c','#202020'],[g,'rgba(8,9,14,.55)','rgba(8,9,14,.25)']]){const gr=ctx.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,a);gr.addColorStop(.7,b);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(x,y,rr,rr*sy,rot,0,7);ctx.fill();}
    hg.fillStyle='#707070';hg.beginPath();hg.ellipse(x,y,rr*.75,rr*sy*.75,rot,0,7);hg.fill();}
  // joints hold water too
  if(!roof)for(let y=0;y<W;y+=42*k){q.fillStyle='rgba(40,40,40,.6)';q.fillRect(0,y,W,2*k);}
  const t=new THREE.CanvasTexture(c),tr=new THREE.CanvasTexture(r);for(const x of[t,tr]){x.wrapS=x.wrapT=THREE.RepeatWrapping;x.anisotropy=coarse?4:8;}t.encoding=THREE.sRGBEncoding;return[t,tr,mkNormal(hc,roof?1.2:1.6)];}
const [MK_PAVE,MK_PAVER,MK_PAVEN]=pavingTex('street'),[MK_ROOF,MK_ROOFR,MK_ROOFN]=pavingTex('roof');
const groundMat=new THREE.MeshStandardMaterial({map:MK_PAVE,roughnessMap:MK_PAVER,normalMap:MK_PAVEN,normalScale:new THREE.Vector2(.8,.8),roughness:1,metalness:.4,envMap:MK_ENV,envMapIntensity:1.9,vertexColors:true});
const roofMat=new THREE.MeshStandardMaterial({map:MK_ROOF,roughnessMap:MK_ROOFR,normalMap:MK_ROOFN,normalScale:new THREE.Vector2(.7,.7),roughness:1,metalness:.35,envMap:MK_ENV,envMapIntensity:1.6,vertexColors:true});
const metalMat=new THREE.MeshStandardMaterial({vertexColors:true,map:panelTex,roughness:.38,metalness:.75,envMap:MK_ENV,envMapIntensity:1.2});
const trimMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.4,envMap:MK_ENV,envMapIntensity:.8});
const clothMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:0,side:THREE.DoubleSide,transparent:true,opacity:.92});
stoneMat=trimMat;
const K_CONC=[0x6c7280,0x5e6472,0x767a86,0x5a5e6a,0x707684,0x666a78].map(C),K_TRIM=C(0x2a2d36),K_METAL=C(0x8a929e),K_RUST=C(0x6a4a3a);
const NEON=[0xff3fc8,0x31e8ff,0xffa83a,0x9b5cff,0x57ff9a,0xff4a3a,0x3f8cff];

/* ---------- (Nov 8, Bryce: "just needs better graphics" · the 2x detail pass) the extra materials, a sign atlas, helpers ---------- */
// a small seeded random of the pass's own, so the decoration never shifts the map's own seeded layout
const MK_DR=(()=>{let a=90817;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();
const DR=(a,b)=>a+MK_DR()*(b-a),DPick=a=>a[(MK_DR()*a.length)|0];
const canv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
// a vertical gradient (bright at the top) for light beams and cones; a soft streak (bright at its v=0 end) for reflections on the wet
const MK_BEAMT=(()=>{const c=canv(8,128),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#fff');gr.addColorStop(.35,'#777');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,8,128);return new THREE.CanvasTexture(c);})();
const MK_STREAKT=(()=>{const c=canv(64,256),g=c.getContext('2d'),im=g.createImageData(64,256);for(let y=0;y<256;y++)for(let x=0;x<64;x++){const u=(x+.5)/64*2-1,v=1-(y+.5)/256;
    const a=Math.max(0,1-u*u)**1.6*Math.pow(1-v,1.4)*(.75+.25*Math.sin(v*40+u*3)),o=(y*64+x)*4;im.data[o]=im.data[o+1]=im.data[o+2]=Math.round(255*a);im.data[o+3]=255;}g.putImageData(im,0,0);return new THREE.CanvasTexture(c);})();
const MK_GRIMET=(()=>{const c=canv(4,64),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,64);gr.addColorStop(0,'#000');gr.addColorStop(1,'#fff');g.fillStyle=gr;g.fillRect(0,0,4,64);return new THREE.CanvasTexture(c);})();
const addMat=(map,o)=>new THREE.MeshBasicMaterial(Object.assign({map,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,fog:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2},o||{}));
const MK_STREAK=addMat(MK_STREAKT),MK_BEAM=addMat(MK_BEAMT,{polygonOffset:false}),MK_FLOORGLOW=addMat(glow);
// grime: black, fading out (contact darkening at the walls' feet, round the roofs' edges)
const MK_GRIME=new THREE.MeshBasicMaterial({color:0x000000,alphaMap:MK_GRIMET,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
// puddles: a near-mirror of the wet night (the env cube), soft edged
const MK_PUDT=(()=>{const c=canv(128,128),g=c.getContext('2d'),gr=g.createRadialGradient(64,64,10,64,64,64);gr.addColorStop(0,'#fff');gr.addColorStop(.75,'#ccc');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
const MK_PUDDLE=new THREE.MeshStandardMaterial({color:0x07080d,roughness:.03,metalness:1,envMap:MK_ENV,envMapIntensity:2.4,alphaMap:MK_PUDT,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
const clubFloorMat=new THREE.MeshStandardMaterial({vertexColors:true,color:0xffffff,roughness:.08,metalness:.85,envMap:MK_ENV,envMapIntensity:1.4});
const glassMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.05,metalness:.9,envMap:MK_ENV,envMapIntensity:1.8});
/* the sign atlas: one canvas, many neon boxes (32 wide ones 256x64, 32 tall blades 64x256): every new sign is a merged quad on it */
const MK_WORDS=['HOTEL','NOODLE','RAMEN','BAR','TIDE','24H','OPEN','SYNTH','REPAIR','PAWN','CLINIC','KARAOKE','ROOMS','TONICS','AUGMENT','PARTS','TEA','ARCADE','LIQUOR','IMPLANTS','CAFE','MOTEL','EXCHANGE','DATA','JADE','ORBIT','VIGIL','DOCK 9','CHROME','LUCK','DUMPLINGS','NO VACANCY'];
const MK_ATLAS=(()=>{const AW=1024,AH=1024,c=canv(AW,AH),g=c.getContext('2d');g.fillStyle='#05060b';g.fillRect(0,0,AW,AH);const cells=[];
  const tube=(hex,blur)=>{g.strokeStyle=hex;g.fillStyle=hex;g.shadowColor=hex;g.shadowBlur=blur;};
  for(let i=0;i<32;i++){const cx=(i%4)*256,cy=Math.floor(i/4)*64,col='#'+NEON[i%NEON.length].toString(16).padStart(6,'0');
    g.fillStyle=['#07080e','#0c0610','#060c10'][i%3];g.fillRect(cx+2,cy+2,252,60);tube(col,10);g.lineWidth=3;if(i%3!==1)g.strokeRect(cx+7,cy+7,242,50);
    g.font=`700 ${i%2?30:34}px ui-sans-serif,system-ui,Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';const w=i%5===2?KIT.glyphWord(5,i*11+5):MK_WORDS[i];for(let k=0;k<2;k++)g.fillText(w,cx+128,cy+34,232);
    if(i%4===0){g.font='700 14px monospace';g.fillText(KIT.glyphWord(3,i+1),cx+28,cy+32);}g.shadowBlur=0;cells.push([cx,cy,256,64]);}
  for(let i=0;i<32;i++){const cx=(i%16)*64,cy=512+Math.floor(i/16)*256,col='#'+NEON[(i*3+1)%NEON.length].toString(16).padStart(6,'0');
    g.fillStyle=['#07080e','#0c0610','#060c10'][i%3];g.fillRect(cx+2,cy+2,60,252);tube(col,9);g.lineWidth=3;g.strokeRect(cx+6,cy+6,52,244);
    const word=i%3===0?MK_WORDS[(i*7)%MK_WORDS.length].replace(/ /g,'').slice(0,6):KIT.glyphWord(5,i*13+2);const n=word.length;g.font=`700 ${Math.min(40,220/n)|0}px ui-sans-serif,system-ui,Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';
    for(let k=0;k<n;k++)for(let j=0;j<2;j++)g.fillText(word[k],cx+32,cy+16+(k+.5)*(224/n));g.shadowBlur=0;cells.push([cx,cy,64,256]);}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;
  const uv=(i)=>{const [cx,cy,cw,ch]=cells[i];return[cx/AW,(cx+cw)/AW,1-(cy+ch)/AH,1-cy/AH];};return{t,uv,cells};})();
const MK_SIGNMAT=new THREE.MeshBasicMaterial({map:MK_ATLAS.t,toneMapped:false,color:new THREE.Color(1.7,1.7,1.7),side:THREE.DoubleSide,fog:true});
// ads: four big lit posters for the rooftop billboards and the city's towers (512x256 each)
const MK_ADS=(()=>{const c=canv(512,1024),g=c.getContext('2d');const ads=[['SYNTHETIC SUNRISE','#ff4fd8','#2a0636','#41f0ff'],['ENLIST · KEEPER COMMAND','#41f0ff','#04162a','#ffa83a'],['THE NIGHT IS YOURS','#ffa83a','#2a1004','#ff4fd8'],['ASTRAEA LINES','#9b5cff','#0e0626','#57ff9a']];
  ads.forEach(([txt,a,bg,b],i)=>{const y=i*256,gr=g.createLinearGradient(0,y,512,y+256);gr.addColorStop(0,bg);gr.addColorStop(1,'#020205');g.fillStyle=gr;g.fillRect(0,y,512,256);
    g.save();g.beginPath();g.rect(0,y,512,256);g.clip();g.shadowColor=a;g.shadowBlur=30;g.fillStyle=a;g.globalAlpha=.85;
    if(i===0){g.beginPath();g.arc(380,y+150,90,0,7);g.fill();g.fillStyle=bg;for(let k=0;k<6;k++)g.fillRect(270,y+120+k*18,230,6);}
    else if(i===1){g.beginPath();g.moveTo(400,y+30);g.lineTo(470,y+128);g.lineTo(400,y+226);g.lineTo(330,y+128);g.closePath();g.lineWidth=10;g.strokeStyle=a;g.stroke();}
    else if(i===2){g.beginPath();g.ellipse(390,y+128,60,95,0,0,7);g.fill();g.fillStyle=bg;g.beginPath();g.ellipse(405,y+110,22,30,0,0,7);g.fill();}
    else{for(let k=0;k<5;k++){g.beginPath();g.arc(390,y+128,30+k*22,0,7);g.lineWidth=4;g.strokeStyle=k%2?a:b;g.stroke();}}
    g.restore();g.globalAlpha=1;g.shadowColor=b;g.shadowBlur=14;g.fillStyle='#ffffff';g.font='700 34px ui-sans-serif,system-ui,Arial,sans-serif';g.fillText(txt,24,y+70,300);
    g.font='700 18px monospace';g.fillStyle=b;g.fillText(KIT.glyphWord(10,i*5+9),24,y+110);g.fillText('TIDE CITY · '+['DISTRICT 4','ALL HOURS','LEVEL 30','ORBITAL'][i],24,y+210);g.shadowBlur=0;
    g.strokeStyle=b;g.lineWidth=4;g.strokeRect(6,y+6,500,244);});
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;return t;})();
const MK_ADMAT=new THREE.MeshBasicMaterial({map:MK_ADS,toneMapped:false,color:new THREE.Color(1.5,1.5,1.5),side:THREE.DoubleSide,fog:true});
// a plane (w x h, standing, facing +z before ry) whose UVs are a rect of an atlas
function atlasPlane(w,h,r){const g=new THREE.PlaneGeometry(w,h),U=g.attributes.uv;for(let i=0;i<U.count;i++)U.setXY(i,r[0]+U.getX(i)*(r[1]-r[0]),r[2]+U.getY(i)*(r[3]-r[2]));return g;}
const signAt=(i,w,h,x,y,z,ry)=>KIT.mg(MK_SIGNMAT,{shadow:false}).add(atlasPlane(w,h,MK_ATLAS.uv(i)),M(x,y,z,0,ry,0),C(0xffffff));
const adAt=(i,w,h,x,y,z,ry)=>KIT.mg(MK_ADMAT,{shadow:false}).add(atlasPlane(w,h,[0,1,1-(i+1)/4,1-i/4]),M(x,y,z,0,ry,0),C(0xffffff));
// a quad from four corners (UVs (0,0) (1,0) (1,1) (0,1) in that order)
function quadG(a,b,c2,d){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c2,...d],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return g;}
// a streak of reflected light on the wet ground: from (x,z) at the wall, out along (nx,nz) L long, w wide, in colour col (scaled by k)
function streak(x,y,z,nx,nz,L,w,col,k){const tx=-nz,tz=nx,hw=w/2;KIT.mg(MK_STREAK,{shadow:false,recv:false,order:2}).add(quadG([x-tx*hw,y,z-tz*hw],[x+tx*hw,y,z+tz*hw],[x+tx*hw+nx*L,y,z+tz*hw+nz*L],[x-tx*hw+nx*L,y,z-tz*hw+nz*L]),new THREE.Matrix4(),C(col).multiplyScalar(k));}
// a cable: hung from a to b, sagging, as thin cylinders
const _up=new THREE.Vector3(0,1,0),_qa=new THREE.Quaternion(),_va=new THREE.Vector3(),_vb=new THREE.Vector3(),_one=new THREE.Vector3(1,1,1);
function segM(p,q){_va.set(q[0]-p[0],q[1]-p[1],q[2]-p[2]);const L=_va.length();_va.divideScalar(L||1);_qa.setFromUnitVectors(_up,_va);_vb.set((p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2);return[new THREE.Matrix4().compose(_vb,_qa,_one),L];}
const MK_CYL=new THREE.CylinderGeometry(1,1,1,5,1,true);
function rod(p,q,r,mat,col){const [m,L]=segM(p,q);m.multiply(new THREE.Matrix4().makeScale(r,L,r));KIT.mg(mat,{shadow:false}).add(MK_CYL,m,col);}
function cable(a,b,sag,r,col,n){n=n||(MK_HI?10:6);let p=a;for(let i=1;i<=n;i++){const t=i/n,q=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag*4*t*(1-t),a[2]+(b[2]-a[2])*t];rod(p,q,r||.025,trimMat,col||C(0x0c0d12));p=q;}}
// the club's own extras, drawn in its group (its own coordinates: the s>0 half's)
function MK_CLUBX(add,x0,x1,z0,z1,h){const dark=C(0x2a1c18),amber=C(0xff8a3a).multiplyScalar(1.5);
  // slatted walls inside, an amber line top and bottom (not across the doors)
  const doorAt=(face,a)=>CLUB_DOORS.some(d=>d[0]===face&&a>d[1]-.25&&a<d[2]+.25);
  for(const [face,a0,a1,fix,inw] of[['s',x0+.3,x1-.3,z1-.24,-1],['n',x0+.3,x1-.3,z0+.24,1],['w',z0+.3,z1-.3,x0+.24,1],['e',z0+.3,z1-.3,x1-.24,-1]]){
    for(let a=a0;a<=a1;a+=MK_HI?.4:.8){if(doorAt(face,a))continue;const along=face==='s'||face==='n';add(trimMat,boxUV(.07,h-.7,.06,1),along?M(a,(h-.7)/2+.1,fix):M(fix,(h-.7)/2+.1,a),dark);}
    const L=a1-a0,mid=(a0+a1)/2,along=face==='s'||face==='n';for(const y of[.12,h-.55]){let cur=a0;const doors=CLUB_DOORS.filter(d=>d[0]===face).sort((p,q)=>p[1]-q[1]);
      const seg=(p,q)=>{if(q-p<.1)return;add(KIT.lampMat,boxUV(along?q-p:.04,.03,along?.04:q-p,1),along?M((p+q)/2,y,fix+inw*.05):M(fix+inw*.05,y,(p+q)/2),amber);};for(const d of doors){seg(cur,d[1]-.2);cur=d[2]+.2;}seg(cur,a1);}}
  // the back bar: a mirror behind the bottles, two more lit shelves of them
  add(glassMat,boxUV(5,1.3,.03,1),M(9.8,2.3,-16.76),C(0x8a7a80));
  for(const y of[2.3,2.7]){add(trimMat,boxUV(5,.04,.3,1),M(9.8,y-.18,-16.7),C(0x3a3036));add(KIT.lampMat,boxUV(5,.02,.02,1),M(9.8,y-.2,-16.56),amber);
    for(let k=0;k<20;k++)add(KIT.lampMat,new THREE.CylinderGeometry(.035,.045,.26+(k%3)*.05,6),M(7.6+k*.23,y,-16.72),C([0x40e0ff,0xffb050,0x9b5cff,0x57ff9a][(k+(y>2.5?1:0))%4]).multiplyScalar(1.3));}
  // stools along the bar
  for(let x=7.8;x<=11.9;x+=.82){add(metalMat,new THREE.CylinderGeometry(.04,.06,.72,8),M(x,.36,-14.95),C(0x3a3a40));add(trimMat,new THREE.CylinderGeometry(.2,.18,.08,14),M(x,.76,-14.95),C(0x4a1418));}
  // speakers hung in the corners, a truss over the platform with spots on it
  for(const [x,z] of[[6.9,-16.1],[16.1,-16.1],[6.9,-5.9],[16.1,-5.9]]){add(trimMat,boxUV(.55,.85,.5,1),M(x,h-.85,z),C(0x121216));add(trimMat,new THREE.CylinderGeometry(.16,.16,.05,14).rotateX(Math.PI/2),M(x,h-.95,z+(z<-11?.26:-.26)),C(0x050506));}
  for(const [w,d,x,z] of[[4.6,.12,11.5,-13],[4.6,.12,11.5,-9],[.12,4,9.2,-11],[.12,4,13.8,-11]])add(metalMat,boxUV(w,.12,d,1),M(x,h-.8,z),C(0x3a3a44));
  for(const [x,z] of[[9.6,-13],[13.4,-13],[9.6,-9],[13.4,-9],[11.5,-13],[11.5,-9]]){add(metalMat,new THREE.CylinderGeometry(.1,.14,.25,10),M(x,h-1,z),C(0x222228));add(KIT.lampMat,new THREE.CircleGeometry(.1,10).rotateX(Math.PI/2),M(x,h-1.13,z),C(0xffe0b0).multiplyScalar(2));
    add(MK_BEAM,new THREE.ConeGeometry(.75,h-1.2,14,1,true),M(x+(11.5-x)*.25,(h-1.15)/2,z+(-11-z)*.25,(-11-z)*.06,0,(x-11.5)*.06),C(0xffb070).multiplyScalar(.16));}
  // the booths' tables, a candle on each
  for(const [x,z] of[[7.35,-6.9],[15.9,-7.3],[15.9,-12.4]]){const tx=x<10?x+1.25:x-1.15;add(trimMat,new THREE.CylinderGeometry(.42,.42,.05,16),M(tx,.74,z),C(0x1a1214));add(metalMat,new THREE.CylinderGeometry(.04,.04,.72,8),M(tx,.37,z),C(0x2a2830));
    add(KIT.lampMat,new THREE.CylinderGeometry(.03,.03,.08,6),M(tx,.8,z),C(0xffb050).multiplyScalar(2.2));}
  // the floor: a glowing ring round the platform, grid lines in the glass
  add(KIT.lampMat,new THREE.RingGeometry(2.55,2.62,48).rotateX(-Math.PI/2),M(11.5,.04,-11),C(0xff7a2a).multiplyScalar(1.2));
  for(let x=x0+1.2;x<x1-.5;x+=1.2)add(trimMat,boxUV(.02,.005,z1-z0-.6,1),M(x,.03,(z0+z1)/2),C(0x24202a));
  // the platform's lit underside throws a glow on the floor; the sphere's light on it too
  add(MK_FLOORGLOW,new THREE.PlaneGeometry(7,6).rotateX(-Math.PI/2),M(11.5,.036,-11),C(0xff7a2a).multiplyScalar(.55));
  // the haze: soft warm light hanging in the room
  add(MK_FLOORGLOW,new THREE.PlaneGeometry(9,3.6),M(11.5,2.2,-16.3),C(0xff7a2a).multiplyScalar(.08));}


/* ---------- the club, drawn: dark panels outside with the doors, the sign; inside the hanging light, the sphere, the platform ---------- */
const CLUB_FX=[];
function drawClub(B,col){const s=B.s,[x0,x1,z0,z1]=CLUB.r,P=(x,z)=>s>0?[x,z]:[-x,-z],h=CLUB.h,G=new THREE.Group();G.userData.dyn=1;G.rotation.y=s>0?0:Math.PI;scene.add(G);
  const mg=new Map(),add=(mat,geo,m,c)=>{let b=mg.get(mat);if(!b){b=new Merger();mg.set(mat,b);}b.add(geo,m,c);};
  // the building over it: facades from the club's top up, the cornice, the roof
  const faces=[[x1,z0,x0,z0],[x0,z1,x1,z1],[x0,z0,x0,z1],[x1,z1,x1,z0]];
  for(const [ax,az,bx,bz] of faces){const L=Math.hypot(bx-ax,bz-az),g=new THREE.PlaneGeometry(L,B.h-h),U=g.attributes.uv;for(let i=0;i<U.count;i++)U.setXY(i,U.getX(i)*L/8,U.getY(i)*(B.h-h)/8+h/8);
    const dx=(bx-ax)/L,dz=(bz-az)/L;add(facMat,g,M((ax+bx)/2,(B.h+h)/2,(az+bz)/2,0,Math.atan2(-dz,dx),0),col);}
  add(trimMat,boxUV(x1-x0+.3,.35,z1-z0+.3,2),M((x0+x1)/2,B.h-.2,(z0+z1)/2),K_TRIM);add(roofMat,roofPlane(x1-x0,z1-z0),M((x0+x1)/2,B.h+.01,(z0+z1)/2),C(0xffffff));
  // the ground floor's walls: black glass panels outside, dark inside, orange strips; the doors' frames lit
  const wallSeg=(ax,az,bx,bz)=>{const L=Math.hypot(bx-ax,bz-az);if(L<.05)return;const ry=Math.atan2(-(bz-az),bx-ax);add(trimMat,boxUV(L,h+.1,.4,2),M((ax+bx)/2,h/2,(az+bz)/2,0,ry,0),C(0x14121a));
    add(KIT.lampMat,boxUV(L,.05,.44,1),M((ax+bx)/2,.35,(az+bz)/2,0,ry,0),C(0xff7a2a).multiplyScalar(1.4));};
  for(const face of['s','n','w','e']){const doors=CLUB_DOORS.filter(d=>d[0]===face).sort((p,q)=>p[1]-q[1]),[a0,a1]=face==='s'||face==='n'?[x0,x1]:[z0,z1];let cur=a0;
    const put=(a,b)=>{if(face==='s')wallSeg(a,z1,b,z1);else if(face==='n')wallSeg(a,z0,b,z0);else if(face==='w')wallSeg(x0,a,x0,b);else wallSeg(x1,a,x1,b);};
    for(const d of doors){put(cur,d[1]);cur=d[2];const m=(d[1]+d[2])/2,w=d[2]-d[1];
      const at=face==='s'?[m,h-.4,z1]:face==='n'?[m,h-.4,z0]:[x0,h-.4,m],ry=face==='w'?Math.PI/2:0;add(KIT.lampMat,boxUV(w+.3,.12,.5,1),M(at[0],3.3,at[2],0,ry,0),C(0xffa040).multiplyScalar(2));}put(cur,a1);}
  // the ceiling: dark, a grid of beams, the rigs the light hangs from
  add(trimMat,boxUV(x1-x0,.2,z1-z0,2),M((x0+x1)/2,h-.1,(z0+z1)/2),C(0x0c0a10));
  for(let x=x0+1.4;x<x1;x+=2.2)add(metalMat,boxUV(.15,.25,z1-z0-.4,1),M(x,h-.3,(z0+z1)/2),C(0x2a2830));
  // the floor: black glass, the platform's lit top, panels of white light set in the floor round it
  add(clubFloorMat,roofPlane(x1-x0-.4,z1-z0-.4),M((x0+x1)/2,.02,(z0+z1)/2),C(0x0a0810));
  add(trimMat,boxUV(4,.6,3.2,1),M(11.5,.2,-11),C(0x1a1620));add(KIT.lampMat,boxUV(3.6,.03,2.8,1),M(11.5,.51,-11),C(0xfff4e8).multiplyScalar(.6));
  for(const [x,z,w,d] of[[8,-10.5,1.6,.5],[15,-11.8,.5,1.8],[11,-7,2.4,.4],[12.6,-14.6,1.2,.4]])add(KIT.lampMat,boxUV(w,.03,d,1),M(x,.03,z),C(0xffe8d0).multiplyScalar(.9));
  // the light: columns of it hanging from the ceiling, amber and white, some all the way down, some short
  // (Nov 8: twice as many, each with a glowing tip and its pool of light on the glass floor under it)
  for(let k=0;k<(coarse?30:48);k++){const x=R(x0+.6,x1-.6),z=R(z0+.6,z1-.6);if(Math.abs(x-11.5)<2.3&&Math.abs(z+11)<1.9)continue;const L=hash(k,7)<.4?h-.4:R(.8,2.6),cc=C(hash(k,3)<.7?0xffb050:0xfff0d8).multiplyScalar(R(.45,.8));   // (Nov 9: toned down, the room was a wall of glare)
    add(KIT.lampMat,boxUV(.07,L,.07,1),M(x,h-.3-L/2,z),cc);add(KIT.lampMat,new THREE.SphereGeometry(.06,6,4),M(x,h-.3-L,z),cc.clone().multiplyScalar(1.3));
    add(MK_FLOORGLOW,new THREE.PlaneGeometry(L>h-.6?1.2:.8,L>h-.6?1.2:.8).rotateX(-Math.PI/2),M(x,.035,z),cc.clone().multiplyScalar(L>h-.6?.35:.15));}
  MK_CLUBX(add,x0,x1,z0,z1,h);
  // the bar along the back: its top lit underneath, bottles in a lit shelf behind
  add(trimMat,boxUV(4.8,1.1,1.1,1),M(9.8,.55,-15.85),C(0x221a1c));add(KIT.lampMat,boxUV(4.8,.05,1.12,1),M(9.8,1.05,-15.85),C(0xff8030).multiplyScalar(1.6));
  for(let k=0;k<20;k++)add(KIT.lampMat,new THREE.CylinderGeometry(.04,.05,.3,6),M(7.6+k*.23,1.9,-16.75),C([0x40e0ff,0xffb050,0x9b5cff][k%3]).multiplyScalar(1.4));
  add(trimMat,boxUV(5,.04,.3,1),M(9.8,1.72,-16.7),C(0x3a3036));
  // booths: low curved seats in the side's dark red, a table
  for(const [x,z,w,d] of[[7.35,-6.9,1.7,2.2],[15.9,-7.3,1.4,2.6],[15.9,-12.4,1.4,2.4]]){add(trimMat,boxUV(w,.9,d,1),M(x,.45,z),C(0x4a1418));add(KIT.lampMat,boxUV(w+.02,.04,d+.02,1),M(x,.1,z),C(0xff5a2a).multiplyScalar(1.2));}
  for(const [x,z] of[[8.4,-12.8],[14.6,-9.2]])add(metalMat,new THREE.CylinderGeometry(.3,.3,h,14),M(x,h/2,z),C(0x2a2830));
  for(const [mat,b] of mg){const m=new THREE.Mesh(b.build(),mat);m.castShadow=mat!==KIT.lampMat&&!mat.transparent;if(mat.transparent)m.renderOrder=2;m.receiveShadow=true;m.userData.dyn=1;G.add(m);}
  // the sphere: a ball of fire held over the platform, its surface crawling, a light the whole room takes its colour from
  const U={uT:{value:0}};const sph=new THREE.Mesh(new THREE.SphereGeometry(1.15,40,28),new THREE.ShaderMaterial({uniforms:U,toneMapped:false,
    vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec3 vN;varying vec3 vP;uniform float uT;float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){vec3 p=normalize(vP)*3.0;float a=n(p+vec3(0.0,uT*.6,0.0))*.6+n(p*2.3-vec3(uT*.4))*.3+n(p*5.1+uT)*.1;float veins=smoothstep(.45,.5,a)-smoothstep(.5,.56,a);
        float rim=pow(1.0-abs(vN.z),2.0);vec3 col=vec3(1.0,.42,.07)*(1.0+a)*.95+vec3(1.0,.85,.5)*veins*2.6+vec3(1.0,.55,.18)*rim*1.1;gl_FragColor=vec4(col,1.0);}`}));
  sph.position.set(11.5,2.5,-11);sph.userData.dyn=1;G.add(sph);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff8030).multiplyScalar(.9),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));halo.position.copy(sph.position);halo.scale.setScalar(5.5);halo.userData.dyn=1;G.add(halo);
  for(const r of[1.5,1.85]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.03,6,48),new THREE.MeshBasicMaterial({color:C(0xffc070).multiplyScalar(1.4),toneMapped:false}));ring.position.copy(sph.position);ring.userData.dyn=1;G.add(ring);CLUB_FX.push({ring,k:r});}
  const L=new THREE.PointLight(C(0xff7a2a),3,16,1.6);L.position.set(11.5,2.5,-11);G.add(L);const L2=new THREE.PointLight(C(0x9b5cff),.9,10,1.8);L2.position.set(8,3.6,-7);G.add(L2);
  CLUB_FX.push({U,sph,L});
  // the sign over the street door
  const t=KIT.neonTex('EMBER',0xff8a2a,{w:384,h:120,size:70});const sm=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.1),new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(1.8,1.8,1.8)}));
  sm.position.set(11,4.1,z1+.08);sm.userData.dyn=1;G.add(sm);MK_SIGNS_LATE.push(sm);}
const MK_SIGNS_LATE=[],MK_RINGB=[];
CITY.ticks.push((dt,T)=>{for(const F of CLUB_FX){if(F.U){F.U.uT.value=T;F.L.intensity=2.6+Math.sin(T*2.2)*.5+Math.sin(T*7.3)*.2;F.sph.rotation.y=T*.3;}if(F.ring){F.ring.rotation.x=T*(F.k>1.6?.5:-.7);F.ring.rotation.y=T*.3*F.k;}}});
// a roof's plane with its UVs in metres (6 m to a tile of the membrane), so the roofs aren't one stretched tile each
function roofPlane(w,d){const g=new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),U=g.attributes.uv;for(let i=0;i<U.count;i++)U.setXY(i,U.getX(i)*w/6,U.getY(i)*d/6);return g;}
/* ---------- drawing the buildings: walls with their windows (UVs in metres, 8 m to a tile), a cornice, the roof, the shopfronts ---------- */
function facePlane(ax,az,bx,bz,y0,y1,mat,col,uOff,unit){const L=Math.hypot(bx-ax,bz-az),H=y1-y0;if(L<.05||H<.05)return;const g=new THREE.PlaneGeometry(L,H),U=g.attributes.uv;
  for(let i=0;i<U.count;i++)U.setXY(i,U.getX(i)*L/unit+uOff,U.getY(i)*H/unit+y0/unit);
  const dx=(bx-ax)/L,dz=(bz-az)/L,th=Math.atan2(-dz,dx);KIT.mg(mat).add(g,M((ax+bx)/2,(y0+y1)/2,(az+bz)/2,0,th,0),col);}
function drawBuilding(r,h,col,opt){opt=opt||{};const [x0,x1,z0,z1]=r,uo=hash(x0*3|0,z0*5|0)*4|0;
  const faces=[[x1,z0,x0,z0,'n'],[x0,z1,x1,z1,'s'],[x0,z0,x0,z1,'w'],[x1,z1,x1,z0,'e']];
  for(const [ax,az,bx,bz,side] of faces){const street=opt.street&&side===opt.street;
    if(street){facePlane(ax,az,bx,bz,0,3.4,shopMat,C(0xffffff),uo*.25,Math.hypot(bx-ax,bz-az)>9?8:Math.hypot(bx-ax,bz-az));facePlane(ax,az,bx,bz,3.4,h,facMat,col,uo*.5,8);}
    else facePlane(ax,az,bx,bz,0,h,facMat,col,uo*.5,8);}
  // the cornice under the parapet, a band at each floor's level on the street side
  const w=x1-x0,d=z1-z0;KIT.mg(trimMat).add(boxUV(w+.3,.35,d+.3,2),M((x0+x1)/2,h-.2,(z0+z1)/2),K_TRIM);
  if(opt.street)KIT.mg(trimMat).add(boxUV(w+.5,.25,d+.5,2),M((x0+x1)/2,3.5,(z0+z1)/2),C(0x1c1e26));
  KIT.mg(roofMat,{shadow:false}).add(roofPlane(w,d),M((x0+x1)/2,h+.01,(z0+z1)/2),C(0xffffff));}
for(const B of MK_BLD){const col=K_CONC[(hash(B.r[0]|0,B.r[2]|0)*K_CONC.length)|0];if(B.club)drawClub(B,col);else drawBuilding(B.r,B.h,col,{street:B.front?(B.s>0?'s':'n'):null});}
// the bases' roofs: a low old block, the side's colour in strips round its top
for(const [r,team] of[[MK_PLAT,'blue'],[mirR(MK_PLAT),'red']]){drawBuilding(r,MK_PLAT_H,C(0x5a5e6a),{});const TC=C(GS.TEAMS[team].c).multiplyScalar(2.2),[x0,x1,z0,z1]=r;
  for(const [ax,az,bx,bz] of[[x0,z0,x1,z0],[x1,z0,x1,z1],[x1,z1,x0,z1],[x0,z1,x0,z0]]){const L=Math.hypot(bx-ax,bz-az);KIT.mg(KIT.lampMat).add(boxUV(Math.abs(bx-ax)+.12||.12,.08,Math.abs(bz-az)+.12||.12,1),M((ax+bx)/2,MK_PLAT_H+.95,(az+bz)/2),TC);}
  const cx=(x0+x1)/2,cz=(z0+z1)/2;KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(2.6,3,3).rotateX(-Math.PI/2),M(cx,MK_PLAT_H+.03,cz,0,team==='blue'?-Math.PI/2:Math.PI/2,0),TC);}
// parapets: a coping on top, weathered concrete
for(const [p0,p1,h] of MK_PARA){const L=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),ry=Math.atan2(-(p1[1]-p0[1]),p1[0]-p0[0]),mx=(p0[0]+p1[0])/2,mz=(p0[1]+p1[1])/2;
  KIT.mg(facMat).add(boxUV(L,.85,.28,8),M(mx,h+.42,mz,0,ry,0),C(0x585c68));KIT.mg(trimMat).add(boxUV(L+.04,.08,.36,2),M(mx,h+.88,mz,0,ry,0),C(0x7a7e88));}

/* ---------- the stairs, planks and landings: steel, a step every 0.25 m of rise, stringers, rails ---------- */
for(const R of KIT.PAIRS){const flat=Math.abs(R.yB-R.yA)<.05,ry=Math.atan2(-R.uz,R.ux),mx=R.P0[0]+R.ux*R.L/2,mz=R.P0[1]+R.uz*R.L/2,ym=(R.yA+R.yB)/2,pitch=Math.atan2(R.yB-R.yA,R.L),hl=Math.hypot(R.L,R.yB-R.yA);
  if(flat){KIT.mg(metalMat).add(boxUV(R.L,.12,R.w,1),M(mx,R.yA-.04,mz,0,ry,0),K_METAL);
    for(let k=0;k<=Math.floor(R.L/1.2);k++){const a=Math.min(R.L,k*1.2),x=R.P0[0]+R.ux*a,z=R.P0[1]+R.uz*a;KIT.mg(metalMat).add(boxUV(.12,.12,R.w,1),M(x,R.yA-.16,z,0,ry,0),K_TRIM);}}
  else{const n=Math.max(3,Math.round(Math.abs(R.yB-R.yA)/.24));for(let k=0;k<n;k++){const a=(k+.5)/n*R.L,x=R.P0[0]+R.ux*a,z=R.P0[1]+R.uz*a,y=R.hAt(a);KIT.mg(metalMat).add(boxUV(R.L/n+.02,.06,R.w-.1,1),M(x,y-.03,z,0,ry,0),K_METAL);}
    for(const s of[-1,1]){const ox=R.nx*s*(R.w/2-.04),oz=R.nz*s*(R.w/2-.04);KIT.mg(metalMat).add(boxUV(hl,.28,.06,1),M(mx+ox,ym-.15,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_TRIM);}}
  // the rails (wherever the kit put one): posts and a top bar
  for(const s of[-1,1]){const ox=R.nx*s*(R.w/2-.05),oz=R.nz*s*(R.w/2-.05);
    KIT.mg(metalMat).add(boxUV(hl,.05,.05,1),M(mx+ox,ym+1.0,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_TRIM);
    KIT.mg(metalMat).add(boxUV(hl,.04,.04,1),M(mx+ox,ym+.5,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_TRIM);
    for(let k=0;k<=Math.floor(R.L/1.4);k++){const a=Math.min(R.L,k*1.4),y=R.hAt(a);KIT.mg(metalMat).add(boxUV(.05,1.05,.05,1),M(R.P0[0]+R.ux*a+ox,y+.5,R.P0[1]+R.uz*a+oz),K_TRIM);}}}
for(const [cx,cz,lx,lz,y] of MK_LANDINGS)for(const s of[1,-1]){KIT.mg(metalMat).add(boxUV(lx,.14,lz,1),M(cx*s,y-.06,cz*s),K_METAL);for(const [dx,dz] of[[-1,-1],[1,-1],[1,1],[-1,1]])KIT.mg(metalMat).add(boxUV(.1,y,.1,1),M(cx*s+dx*(lx/2-.1),y/2,cz*s+dz*(lz/2-.1)),K_TRIM);}
// the skybridge: a steel deck, glass walls up to the hip, its lit underside
{KIT.mg(metalMat).add(boxUV(6,.6,10.6,2),M(0,13.7,0),C(0x4a505c));for(const x of[-3,3]){KIT.mg(trimMat).add(boxUV(.3,1.05,10.2,2),M(x,14.52,0),C(0x2a2e38));KIT.mg(KIT.lampMat).add(boxUV(.05,.05,10.2,1),M(x*1.03,15.08,0),C(0x7fe8ff).multiplyScalar(1.8));}
 KIT.mg(KIT.lampMat).add(boxUV(5.6,.04,.12,1),M(0,13.38,-4.8),C(0xff4fd8).multiplyScalar(2));KIT.mg(KIT.lampMat).add(boxUV(5.6,.04,.12,1),M(0,13.38,4.8),C(0xff4fd8).multiplyScalar(2));}

/* ---------- the props ---------- */
{const tankG=new THREE.CylinderGeometry(1.15,1.15,2.2,16),capG=new THREE.ConeGeometry(1.25,.6,16);
 for(const p of MK_PROPS){if(p.kind==='tank'){KIT.mg(metalMat).add(tankG,M(p.x,p.y+1.5,p.z),K_RUST);KIT.mg(metalMat).add(capG,M(p.x,p.y+2.9,p.z),K_TRIM);for(const [dx,dz] of[[-.8,-.8],[.8,-.8],[.8,.8],[-.8,.8]])KIT.mg(metalMat).add(boxUV(.12,.5,.12,1),M(p.x+dx,p.y+.25,p.z+dz),K_TRIM);}
   else if(p.kind==='ac'){KIT.mg(metalMat).add(boxUV(1.8,1.15,1.2,1),M(p.x,p.y+.55,p.z,0,p.ry,0),C(0x9aa2ae));KIT.mg(trimMat).add(new THREE.CylinderGeometry(.42,.42,.06,16),M(p.x,p.y+1.14,p.z),C(0x1a1c22));}
   else if(p.kind==='hut'){KIT.mg(facMat).add(boxUV(2.4,2.6,2.4,8),M(p.x,p.y+1.2,p.z),C(0x5c606c));KIT.mg(trimMat).add(boxUV(2.6,.15,2.6,2),M(p.x,p.y+2.5,p.z),K_TRIM);
     KIT.mg(KIT.lampMat).add(boxUV(.3,.12,.08,1),M(p.x,p.y+2.15,p.z+1.22),C(0xffc070).multiplyScalar(2));}
   else{KIT.mg(metalMat).add(boxUV(1,1.4,1,1),M(p.x,p.y+.7,p.z),C(0x7a828e));KIT.mg(trimMat).add(boxUV(1.2,.1,1.2,1),M(p.x,p.y+1.45,p.z),K_TRIM);}}
 // antennas and dishes on the tall ones
 for(const B of MK_BLD){if(B.h<9)continue;const [x0,x1,z0,z1]=B.r,x=x0+(x1-x0)*.8,z=z0+(z1-z0)*.2;if(nearRamp(x,z,B.h,1))continue;KIT.mg(metalMat).add(new THREE.CylinderGeometry(.05,.09,6,6),M(x,B.h+3,z),K_TRIM);
   KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.12,8,6),M(x,B.h+6.05,z),C(0xff3030).multiplyScalar(2.5));OBST.push({x,z,r:.15,h:6,y0:B.h});}
 // the stalls: a counter, goods under a canopy on poles, a lamp
 for(const [x,w] of MK_STALLS)for(const s of[1,-1]){const X=x*s,Z=-3.05*s,col=C(NEON[(hash(x|0,s+3)*NEON.length)|0]);
   KIT.mg(trimMat).add(boxUV(w,1.05,1.3,1),M(X,.52,Z),C(0x3a3028));KIT.mg(trimMat).add(boxUV(w+.1,.06,1.4,1),M(X,1.07,Z),C(0x5a4a3a));
   for(let k=0;k<6;k++)KIT.mg(trimMat).add(boxUV(.3,.25,.3,1),M(X-w/2+.35+k*(w-.7)/5,1.22,Z+R(-.3,.3)),C(0xffffff).setHSL(R(0,1),.5,.35));
   KIT.mg(clothMat,{shadow:true}).add(new THREE.PlaneGeometry(w+.6,1.9).rotateX(-Math.PI/2+.25*s),M(X,2.45,Z+.1*s),tmpC.copy(col).multiplyScalar(.6).clone());
   for(const dx of[-w/2,w/2])KIT.mg(metalMat).add(new THREE.CylinderGeometry(.04,.04,2.3,6),M(X+dx,1.15,Z+.6*s),K_TRIM);
   KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.13,8,6),M(X,2.1,Z+.5*s),C(0xffd090).multiplyScalar(2.2));}
 for(const [x,z,l,h] of MK_CRATES)for(const s of[1,-1])KIT.mg(trimMat).add(boxUV(l,h,l,1),M(x*s,h/2,z*s,0,hash(x*3|0,z|0)*.6,0),C(hash(x|0,z|0)<.5?0x5a4a34:0x3a4a5a));
 for(const [x,z] of MK_BARRELS)for(const s of[1,-1])KIT.mg(metalMat).add(new THREE.CylinderGeometry(.38,.38,1,14),M(x*s,.5,z*s),C(hash(x|0,z|0)<.5?0x2a5a7a:0x7a2a2a));
 for(const [x,z] of MK_LAMPS)for(const s of[1,-1]){KIT.mg(metalMat).add(new THREE.CylinderGeometry(.08,.12,5,8),M(x*s,2.5,z*s),K_TRIM);KIT.mg(metalMat).add(boxUV(1.4,.1,.2,1),M(x*s,5,z*s+.6*s),K_TRIM);KIT.mg(KIT.lampMat).add(boxUV(.6,.06,.18,1),M(x*s,4.94,z*s+1*s),C(0xbfe8ff).multiplyScalar(2));}}
// tarps over the street: sagging cloth between the fronts, two lengths each side of the middle; lantern strings under them
{const tarp=(x0,x1,col)=>{const L=x1-x0,g=new THREE.PlaneGeometry(L,8.6,12,6).rotateX(-Math.PI/2),P=g.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i);P.setY(i,-.7*(1-Math.pow(z/4.3,2))*(.6+.4*Math.cos(x/L*Math.PI*2))+Math.sin(x*1.7)*.05);}g.computeVertexNormals();
   KIT.mg(clothMat,{shadow:true}).add(g,M((x0+x1)/2,4.6,0),col);};
 tarp(-33,-24,C(0x7a3a5a));tarp(-23,-15,C(0x3a6a6a));tarp(15,23,C(0x6a5a2a));tarp(24,33,C(0x3a4a7a));
 const lantern=new THREE.SphereGeometry(.09,8,6),cols=[0xff6a3a,0xffc04a,0xff3fa0,0x40e8ff];
 for(const z0 of[-3.6,3.6])for(let x=-34;x<=34;x+=.9){if(Math.abs(x)<4)continue;const sag=-.5*(1-Math.pow(((x%9)+9)%9/4.5-1,2));KIT.mg(KIT.lampMat).add(lantern,M(x,4.05+sag,z0*(1-.15*Math.sin(x))),C(cols[(Math.abs(x*7)|0)%4]).multiplyScalar(1.25));}}

/* ---------- the neon: signs on the fronts (flat and the tall ones sticking out), in the street's colours and the sides' ---------- */
const MK_SIGNS=[];
{const words=['MARKET','NOODLE','TIDE','BAR','HOTEL','CHROME','LUCK','24H','OPEN','SYNTH','REPAIR','DOCK'];
 for(const B of MK_BLD){if(!B.front||B.club)continue;const [x0,x1,z0,z1]=B.r,sz=B.s>0?z1:z0,out=B.s>0?1:-1,n=1+(B.h>8?1:0);
   for(let k=0;k<n;k++){const vert=k===1||hash(x0|0,k)<.35,col=NEON[(hash(x0*5|0,k*3)*NEON.length)|0],word=hash(x1|0,k)<.45?KIT.glyphWord(vert?4:5,x0*3+k):words[(hash(x0|0,k*7)*words.length)|0];
     const t=KIT.neonTex(word,col,vert?{w:96,h:384,size:52}:{w:384,h:96});
     const mat=new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(1.6,1.6,1.6),side:THREE.DoubleSide,fog:true});
     let mesh;if(vert){mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.2,4.8),mat);const x=lerp(x0+1.5,x1-1.5,hash(x0|0,k+9));mesh.position.set(x,Math.min(B.h-3,8),sz+out*.8);mesh.rotation.y=Math.PI/2;
       KIT.mg(metalMat).add(boxUV(.1,.1,.8,1),M(x,mesh.position.y+2.3,sz+out*.4),K_TRIM);KIT.mg(metalMat).add(boxUV(.1,.1,.8,1),M(x,mesh.position.y-2.3,sz+out*.4),K_TRIM);}
     else{mesh=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(6,x1-x0-2),1.5),mat);mesh.position.set(lerp(x0,x1,.5)+(k?2:0),4.4,sz+out*.06);mesh.rotation.y=out>0?0:Math.PI;}
     mesh.userData.dyn=1;scene.add(mesh);MK_SIGNS.push({mesh,mat,flick:hash(x0|0,k*13)<.25,ph:R(0,9)});}}
 // the back alleys: smaller ones, and the side's own over each base's mouth
 for(const s of[1,-1]){const col=s>0?GS.TEAMS.blue.c:GS.TEAMS.red.c,t=KIT.neonTex(s>0?'WEST GATE':'EAST GATE',col,{w:384,h:96});const mat=new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(2,2,2),side:THREE.DoubleSide});
   const m=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),mat);m.position.set(-42.9*s,7.2,0);m.rotation.y=s>0?Math.PI/2:-Math.PI/2;m.userData.dyn=1;scene.add(m);
   KIT.mg(metalMat).add(boxUV(.2,3,.2,1),M(-43.3*s,5.9,-2.6),K_TRIM);KIT.mg(metalMat).add(boxUV(.2,3,.2,1),M(-43.3*s,5.9,2.6),K_TRIM);}
 for(const [x,z,ry,word,col] of[[-26.1,-19,Math.PI/2,'ROOMS',0x9b5cff],[-12.1,-27,-Math.PI/2,'NO. 9',0x31e8ff],[5.9,-26,Math.PI/2,'CLINIC',0x57ff9a],[22.9,-30,Math.PI/2,'PAWN',0xffa83a],[-41.1,-30,-Math.PI/2,'KARAOKE',0xff3fc8]])
   for(const s of[1,-1]){const t=KIT.neonTex(word,col,{w:256,h:80});const mat=new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(1.5,1.5,1.5),side:THREE.DoubleSide});const m=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.8),mat);
     m.position.set(x*s,3.6,z*s);m.rotation.y=ry+(s<0?Math.PI:0);m.userData.dyn=1;scene.add(m);MK_SIGNS.push({mesh:m,mat,flick:hash(x|0,z|0)<.3,ph:R(0,9)});}}

/* ---------- the holo-billboard: hung under the skybridge, a screen facing each way down the street, its own light ---------- */
const MK_BOARD=(()=>{const W=512,H=256,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
  const mat=new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(1.7,1.7,1.7),transparent:true,opacity:.92,depthWrite:false,blending:THREE.AdditiveBlending});
  const meshes=[];for(const x of[-3.4,3.4]){const m=new THREE.Mesh(new THREE.PlaneGeometry(9.6,4.6),mat);m.position.set(x,10.6,0);m.rotation.y=x<0?-Math.PI/2:Math.PI/2;m.userData.dyn=1;m.renderOrder=3;scene.add(m);meshes.push(m);}
  for(const z of[-4.6,4.6])for(const x of[-3.4,3.4])KIT.mg(metalMat).add(boxUV(.12,3,.12,1),M(x,12.6,z),K_TRIM);
  const L=new THREE.PointLight(C(0xff4fd8),2.6,30,1.6);L.position.set(0,12,0);scene.add(L);
  const PAL=['#ff3fc8','#31e8ff','#ffa83a','#9b5cff'];let acc=0,f=0;
  function draw(T){g.clearRect(0,0,W,H);const ph=Math.floor(T/6)%4,u=(T%6)/6,col=PAL[ph];
    g.fillStyle='rgba(10,4,24,.55)';g.fillRect(0,0,W,H);
    // a scan grid, a big rotating glyph, a ticker
    g.strokeStyle='rgba(120,230,255,.18)';for(let y=0;y<H;y+=8){g.beginPath();g.moveTo(0,y+((T*20)%8));g.lineTo(W,y+((T*20)%8));g.stroke();}
    g.save();g.translate(130,128);g.rotate(T*.6);g.strokeStyle=col;g.lineWidth=6;g.shadowColor=col;g.shadowBlur=18;g.beginPath();for(let k=0;k<=6;k++){const a=k/6*Math.PI*2;g.lineTo(Math.cos(a)*70,Math.sin(a)*70);}g.stroke();
    g.rotate(-T*1.4);g.beginPath();for(let k=0;k<=3;k++){const a=k/3*Math.PI*2;g.lineTo(Math.cos(a)*40,Math.sin(a)*40);}g.stroke();g.restore();
    g.fillStyle=col;g.shadowColor=col;g.shadowBlur=14;g.font='bold 54px sans-serif';g.fillText(['TIDE CITY','HOLD THE LINE','NIGHT MARKET','THE VIGIL'][ph],230,110);
    g.font='bold 26px monospace';g.fillStyle='#e9fbff';g.fillText(KIT.glyphWord(8,ph*17+3),232,160);g.shadowBlur=0;
    const tx=W-((T*120)%(W*2));g.fillStyle='rgba(255,255,255,.85)';g.font='18px monospace';g.fillText('◆ KEEPER COMMAND · CURFEW 0200 · REPORT ALL HOLLOW SIGHTINGS · STAY OFF THE ROOFS ◆',tx,232);
    if(Math.random()<.04){g.fillStyle='rgba(255,255,255,.25)';g.fillRect(0,Math.random()*H,W,6+Math.random()*20);}
    t.needsUpdate=true;L.color.set(col).convertSRGBToLinear();L.intensity=2.2+Math.sin(T*3)*.4;}
  CITY.ticks.push((dt,T)=>{acc+=dt;if(acc>(coarse?.12:.06)){acc=0;draw(T);}});draw(0);return{L};})();

/* ---------- the ground: paving everywhere at street level (the bases' blocks stand on it), a gutter down each side ---------- */
{const S=200,g=new THREE.PlaneGeometry(S,S,4,4).rotateX(-Math.PI/2),U=g.attributes.uv;for(let i=0;i<U.count;i++)U.setXY(i,U.getX(i)*S/7,U.getY(i)*S/7);
 const cols=[];for(let i=0;i<g.attributes.position.count;i++)cols.push(1,1,1);g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
 const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;m.userData.dyn=1;scene.add(m);
 for(const z of[-4.15,4.15])KIT.mg(trimMat).add(boxUV(80,.06,.3,1),M(0,.02,z),C(0x14161a));
 // the bases' roofs: their own floor
 for(const r of[MK_PLAT,mirR(MK_PLAT)]){const [x0,x1,z0,z1]=r;KIT.mg(roofMat,{shadow:false}).add(roofPlane(x1-x0,z1-z0),M((x0+x1)/2,MK_PLAT_H+.012,(z0+z1)/2),C(0xc8ccd8));}}

/* ---------- the city all round: the blocks past the edge close the view, the towers of Tide City beyond them, the sky ---------- */
{// the near ring: tall dark blocks just past the edge, windows lit (no collision: the edge stops you)
 const ring=[];MK_RINGB.length=0;for(let x=-74;x<=74;x+=13)for(const z of[-50,50])ring.push([x+R(-2,2),z+R(-4,4)]);for(let z=-36;z<=36;z+=14)for(const x of[-72,72])ring.push([x+R(-4,4),z+R(-2,2)]);
 for(const [x,z] of ring){const w=R(9,13),d=R(9,13),h=R(16,42);drawBuilding([x-w/2,x+w/2,z-d/2,z+d/2],h,K_CONC[(rng()*K_CONC.length)|0],{});MK_RINGB.push([x,z,w,d,h]);
   if(rng()<.5){const col=NEON[(rng()*NEON.length)|0],t=KIT.neonTex(KIT.glyphWord(4,x*z|0),col,{w:96,h:384,size:52});const mat=new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(1.6,1.6,1.6),side:THREE.DoubleSide});
     const m=new THREE.Mesh(new THREE.PlaneGeometry(2,8),mat);m.position.set(x+(Math.abs(x)>60?-Math.sign(x)*(w/2+.2):0),h*.6,z+(Math.abs(z)>45?-Math.sign(z)*(d/2+.2):0));m.rotation.y=Math.abs(x)>60?Math.PI/2:0;m.userData.dyn=1;scene.add(m);}}
 // Tide City beyond: the shared skyline, all round, far off
 if(typeof SKYLINE!=='undefined'){const S=SKYLINE.build({n:coarse?40:110,seed:31,h:260,w:46,water:-40,lit:.5,rings:false,traffic:coarse?14:56,place:(i,r)=>{const a=i/(coarse?40:110)*Math.PI*2+r()*.1,d=170+r()*420;return[Math.cos(a)*d,Math.sin(a)*d,1-(d-170)/420];}});
   S.G.traverse(o=>{o.userData.dyn=1;});scene.add(S.G);CITY.ticks.push((dt,T)=>S.update&&S.update(T));}
 // the sky: a dome of low cloud lit from under by the city
 const sky=new THREE.Mesh(new THREE.SphereGeometry(3000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uT:{value:0}},
   vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`varying vec3 vD;uniform float uT;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
     void main(){float y=vD.y;vec2 p=vD.xz/(y+.25)*2.0+vec2(uT*.02,uT*.01);float c=n(p)*.5+n(p*2.1)*.3+n(p*4.3)*.2;vec3 low=vec3(.16,.07,.18),high=vec3(.015,.015,.04);vec3 col=mix(low,high,smoothstep(-.05,.45,y));
       col+=vec3(.12,.05,.14)*c*smoothstep(.0,.3,y)*smoothstep(.9,.2,y);col+=vec3(.05,.12,.16)*smoothstep(.12,-.02,y);gl_FragColor=vec4(col,1.0);}`}));
 sky.renderOrder=-5;sky.userData.dyn=1;const sg=new THREE.Group();sg.add(sky);scene.add(sg);CITY.skies.push(sg);CITY.ticks.push((dt,T)=>{sky.material.uniforms.uT.value=T;});}

/* ---------- light: the city's glow from below, a cold moon behind the cloud for the shadows, neon pools in the street ---------- */
hemi.color.copy(C(0x46508a));hemi.groundColor.copy(C(0x3a1a30));hemi.intensity=.75;
keyLight.color.copy(C(0x8ea4e0));keyLight.intensity=.5;keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:4096,coarse?1024:4096);
Object.assign(keyLight.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:400});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.05;
keyLight.position.set(-60,140,-80);keyLight.target.position.set(0,0,0);
{const pools=[[-30,2.5,-2,0xff3fc8],[-12,2.6,2,0x31e8ff],[22,2.6,-2,0xffa83a],[-46,3.4,-14,0x9b5cff],[-18,3.4,-19,0x57ff9a]];
 for(const [x,y,z,c] of pools)for(const s of(coarse?[1]:[1,-1])){const L=new THREE.PointLight(C(c),1.5,16,1.8);L.position.set(x*s,y,z*s);scene.add(L);}
 for(const B of GS.BASES){const L=new THREE.PointLight(C(GS.TEAMS[B.team].c),1.6,22,1.6);L.position.set(B.x-B.fx*3,B.y+4,B.z);scene.add(L);}}
// the neon flickers (a few of them), the base strips breathe
CITY.ticks.push((dt,T)=>{for(const S of MK_SIGNS){if(!S.flick)continue;const f=Math.sin(T*23+S.ph)>.93||Math.sin(T*1.3+S.ph)>.985?.15:1.6;S.mat.color.setScalar(f);}});

/* ---------- the weather: rain, steam off the roofs' vents, thunder far off ---------- */
KIT.rain({n:coarse?1000:2600,col:0x9ab0d0,op:.42});
// (Nov 8, Bryce: "make the rain sound more quiet": the hiss from .15 to .06 and its low roar from .07 to .03, a bit under half;
//  the hiss's top end rolled off a little lower too, so what's left sits behind the guns instead of over them. Thunder unchanged)
const MK_SND=KIT.sound([{f:[['highpass',380],['lowpass',4200]],v:.06},{f:[['lowpass',260]],v:.03,swell:.3,rate:.2}]);
{let next=R(14,26);CITY.ticks.push(dt=>{next-=dt;if(next<=0){next=R(22,45);MK_SND.thunder(R(.6,1));}});}
const MK_STEAM=(()=>{const vents=MK_PROPS.filter(p=>p.kind==='vent'),N=coarse?60:160,pos=new Float32Array(N*3),life=new Float32Array(N),src=new Int16Array(N);
  if(!vents.length)return null;for(let i=0;i<N;i++){src[i]=i%vents.length;life[i]=R(0,1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.Points(g,new THREE.PointsMaterial({size:1.6,map:glow,color:C(0x8a90a8),transparent:true,opacity:.22,depthWrite:false}));m.frustumCulled=false;m.userData.dyn=1;scene.add(m);
  CITY.ticks.push(dt=>{for(let i=0;i<N;i++){life[i]+=dt*.35;if(life[i]>1)life[i]-=1;const v=vents[src[i]],u=life[i];pos[i*3]=v.x+Math.sin(i+u*3)*.5*u+u*1.2;pos[i*3+1]=v.y+1.5+u*5;pos[i*3+2]=v.z+Math.cos(i*1.7)*.5*u+u*.6;}g.attributes.position.needsUpdate=true;});return m;})();

/* ---------- a ship over the roofs now and then: a Keeper patrol craft, its searchlight sweeping down, its engines ---------- */
const MK_SHIP=(()=>{const g=new THREE.Group();g.userData.dyn=1;g.visible=false;scene.add(g);
  MODELS.swapShip(g,'interceptor',{len:16,glow:.4,tint:0x8a96a8,hide:[]}).then(m=>{if(m)m.traverse(o=>{o.userData.dyn=1;});});
  const sp=new THREE.SpotLight(C(0xdff0ff),6,90,.18,.5,1.2);sp.position.set(0,-1,0);g.add(sp);scene.add(sp.target);
  const cone=new THREE.Mesh(new THREE.ConeGeometry(7,40,24,1,true).translate(0,-20,0),new THREE.MeshBasicMaterial({color:C(0xbfe0ff),transparent:true,opacity:.05,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:true}));g.add(cone);
  for(const x of[-2,2]){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff3030).multiplyScalar(3),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s.position.set(x,.3,2);s.scale.setScalar(.9);g.add(s);}
  let t=-R(8,14),A=null,Bp=null;const tmp=new THREE.Vector3();
  CITY.ticks.push((dt,T)=>{t+=dt;if(t<0){g.visible=false;return;}
    if(!A){const z0=R(-30,30),dir=rng()<.5?1:-1;A=new THREE.Vector3(-150*dir,R(26,34),z0);Bp=new THREE.Vector3(150*dir,R(26,34),-z0*.6);g.position.copy(A);g.lookAt(Bp);MK_SND.tone(52,46,9,.06);}
    const u=t/14;if(u>1){t=-R(18,32);A=null;g.visible=false;return;}g.visible=true;g.position.lerpVectors(A,Bp,u);g.position.y+=Math.sin(u*Math.PI)*-4;
    // the light sweeps side to side over the roofs below it
    tmp.set(Math.sin(T*.9)*14,0,Math.cos(T*.7)*10).add(g.position);tmp.y=6;sp.target.position.copy(tmp);
    cone.lookAt(tmp);cone.rotateX(-Math.PI/2);});return g;})();

/* ---------- (Nov 8, the 2x pass) the detail: on the facades, the roofs, the street, the stalls, the city round it ---------- */
// a second seeded random only for what you can stand on or bump into, so it's the same on a phone as on a PC
const MK_SR=(()=>{let a=4242;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();
const SR=(a,b)=>a+MK_SR()*(b-a);
const MK_NEWSIGNS=[];   // [x,y,z] of every sign put up here (no two on top of each other, none on top of the old ones)
const signFree=(x,y,z,m)=>!MK_NEWSIGNS.some(p=>Math.hypot(p[0]-x,p[1]-y,p[2]-z)<m)&&!MK_SIGNS.some(S=>S.mesh.position.distanceTo(_vb.set(x,y,z))<m+.6);
const facesOf=(r)=>{const [x0,x1,z0,z1]=r;return[[x1,z0,x0,z0,'n'],[x0,z1,x1,z1,'s'],[x0,z0,x0,z1,'w'],[x1,z1,x1,z0,'e']];};
const edgeFace=(ax,az,bx,bz)=>{const mx=(ax+bx)/2,mz=(az+bz)/2;return Math.abs(mz)>37.5&&Math.abs(az-bz)<.01||Math.abs(mx)>57.5&&Math.abs(ax-bx)<.01;};
const WIN_RGB=[0xffb86a,0xffd59a,0x9fe8ff,0xff9ad0,0xb8ffcf];
{const CONC_D=C(0x4a4e5a),AC=C(0x9aa2ae),PIPE=C(0x3a3e46),RUSTY=C(0x5a4232);
 const decorB=(B)=>{const [x0,x1,z0,z1]=B.r,h=B.h,street=B.front?(B.s>0?'s':'n'):null;
   // corner pilasters and a second band under the cornice: the boxes stop reading as boxes
   for(const [x,z] of[[x0,z0],[x1,z0],[x1,z1],[x0,z1]])KIT.mg(facMat).add(boxUV(.36,h-.4,.36,8),M(x,(h-.4)/2,z),CONC_D);
   KIT.mg(trimMat).add(boxUV(x1-x0+.18,.14,z1-z0+.18,2),M((x0+x1)/2,h-1.05,(z0+z1)/2),C(0x30333c));
   for(const [ax,az,bx,bz,side] of facesOf(B.r)){if(edgeFace(ax,az,bx,bz))continue;const L=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/L,uz=(bz-az)/L,nx=-uz,nz=ux,isSt=side===street&&!B.club,
       y0=B.club?4.6:isSt?3.6:0,P=(s,o)=>[ax+ux*s+nx*o,az+uz*s+nz*o];
     // grime at the wall's foot, and the dark wet strip on the ground along it
     if(!isSt&&!B.club){const a=P(0,.02),b=P(L,.02);KIT.mg(MK_GRIME,{shadow:false,recv:false}).add(quadG([a[0],0,a[1]],[b[0],0,b[1]],[b[0],1.1,b[1]],[a[0],1.1,a[1]]),new THREE.Matrix4(),C(0));}
     {const a=P(0,0),b=P(L,0),c2=P(L,.7),d=P(0,.7);KIT.mg(MK_GRIME,{shadow:false,recv:false}).add(quadG([a[0],.012,a[1]],[b[0],.012,b[1]],[c2[0],.012,c2[1]],[d[0],.012,d[1]]),new THREE.Matrix4(),C(0));}
     // sills under every window (PC), AC units under some, all on the window grid of the facade texture
     for(let s=1;s<L-.4;s+=2)for(let k=0;;k++){const yb=.55+2*k;if(yb>h-1.2)break;if(yb<y0)continue;const p=P(s,.07);
       if(MK_HI)KIT.mg(trimMat).add(boxUV(1.5,.07,.16,1),M(p[0],yb-.06,p[1],0,Math.atan2(-uz,ux),0),C(0x4a4e58));
       if(DR(0,1)<(MK_HI?.14:.06)){const q=P(s+DR(-.2,.2),.26);if(nearRamp(q[0],q[1],yb,.7))continue;const ry=Math.atan2(-uz,ux);
         KIT.mg(metalMat).add(boxUV(.82,.52,.44,1),M(q[0],yb-.42,q[1],0,ry,0),DPick([AC,C(0xb0b4ba),C(0x7a8088)]));
         KIT.mg(trimMat).add(new THREE.CylinderGeometry(.17,.17,.02,12).rotateX(Math.PI/2),M(q[0]+nx*.225,yb-.42,q[1]+nz*.225,0,ry,0),C(0x15161a));
         for(const e of[-.3,.3]){const b2=P(s+e,.12);KIT.mg(metalMat).add(boxUV(.04,.04,.3,1),M(b2[0],yb-.7,b2[1],0,ry,0),K_TRIM);}}}
     // a drainpipe down the face (not the shopfronts), brackets every 2 m
     if(!isSt&&L>5){const sp=DR(0,1)<.5?.45:L-.45,p=P(sp,.14),top=h-.25;if(!nearRamp(p[0],p[1],top/2,.3)){rod([p[0],0,p[1]],[p[0],top,p[1]],.075,metalMat,DPick([PIPE,RUSTY]));
       for(let y=1;y<top;y+=2)KIT.mg(metalMat).add(boxUV(.2,.05,.2,1),M(p[0],y,p[1]),K_TRIM);KIT.mg(metalMat).add(boxUV(.2,.12,.5,1),M(p[0]-nx*.1,top,p[1]-nz*.1,0,Math.atan2(-nz,nx),0),PIPE);}}
     // conduit along the shopfronts' top, and a neon tube under the band
     if(isSt){for(const [y,o,r] of[[3.62,.12,.035],[3.72,.16,.025],[3.0,.06,.03]]){const a=P(.3,o),b=P(L-.3,o);rod([a[0],y,a[1]],[b[0],y,b[1]],r,metalMat,C(0x22242a));}
       const nc=NEON[(hash(x0*9|0,7)*NEON.length)|0],a=P(L/2,.1);KIT.mg(KIT.lampMat).add(boxUV(L-.5,.045,.045,1),M(a[0],3.38,a[1],0,Math.atan2(-uz,ux),0),C(nc).multiplyScalar(2.2));
       // the wet street takes each shop's light: a warm smear per bay, the neon tube's line
       for(let s=2;s<L-1;s+=4){const p=P(s,.05);streak(p[0],.02,p[1],nx,nz,3.4,2.8,DPick(WIN_RGB),.18);}
       {const p=P(L/2,.05);streak(p[0],.021,p[1],nx,nz,2.2,L-.6,nc,.22);}
       // neon up the corners of half the fronts (and both towers)
       if(B.tower||hash(x0|0,h|0)<.5)for(const s of[.05,L-.05]){const p=P(s,.2);const cc=NEON[(hash(x0|0,s|0)*NEON.length)|0];KIT.mg(KIT.lampMat).add(boxUV(.06,h-4,.06,1),M(p[0],(h+3.6)/2,p[1]),C(cc).multiplyScalar(2.4));
         const q=P(s,.05);streak(q[0],.022,q[1],nx,nz,4.5,.7,cc,.35);}}
     // signs: blades sticking out of the upper floors, little box signs over the shopfronts and alley doors, flat panels high up
     const tx=ux,tz=uz,ry=Math.atan2(tx,tz),fry=Math.atan2(nx,nz);
     const nBl=MK_HI?Math.max(1,Math.floor(L/4.5)):Math.floor(L/9);
     for(let k=0;k<nBl;k++){if(h<7)break;const s=DR(1.2,L-1.2),y=DR(Math.max(y0+2.6,5.6),Math.max(Math.max(y0+2.6,5.6)+.1,h-2.4)),p=P(s,.75);
       if(y+1.8>h-.3||nearRamp(p[0],p[1],y,1)||!signFree(p[0],y,p[1],2.6))continue;const i=32+((MK_DR()*32)|0),cc=NEON[((i-32)*3+1)%NEON.length];
       signAt(i,.85,3.4,p[0],y,p[1],ry);MK_NEWSIGNS.push([p[0],y,p[1]]);for(const dy of[1.5,-1.5]){const b=P(s,.38);KIT.mg(metalMat).add(boxUV(.06,.06,.75,1),M(b[0],y+dy,b[1],0,fry,0),K_TRIM);}
       if(isSt||y<9){const q=P(s,.05);streak(q[0],.023,q[1],nx,nz,isSt?4.5:3,1.2,cc,isSt?.4:.25);}}
     const nBox=MK_HI?Math.floor(L/4):Math.floor(L/8);
     for(let k=0;k<nBox;k++){const s=DR(1,L-1),y=isSt?DR(2.75,3.05):DR(2.4,3.4),p=P(s,.55);if(nearRamp(p[0],p[1],y,.8)||!signFree(p[0],y,p[1],1.6))continue;
       const i=(MK_DR()*32)|0,cc=NEON[i%NEON.length];signAt(i,1.1,.28,p[0],y,p[1],ry);MK_NEWSIGNS.push([p[0],y,p[1]]);const b=P(s,.25);KIT.mg(metalMat).add(boxUV(.04,.04,.5,1),M(b[0],y+.18,b[1],0,fry,0),K_TRIM);
       const q=P(s,.05);streak(q[0],.024,q[1],nx,nz,2.6,.9,cc,.3);}
     if(h>=9&&DR(0,1)<(MK_HI?.55:.25)){const s=DR(2.2,L-2.2),y=h-2.1,p=P(s,.05);if(signFree(p[0],y,p[1],3)){signAt((MK_DR()*32)|0,3.2,.8,p[0],y,p[1],fry);MK_NEWSIGNS.push([p[0],y,p[1]]);}}}};
 for(const B of MK_BLD)decorB(B);
 for(const r of[MK_PLAT,mirR(MK_PLAT)])decorB({r,h:MK_PLAT_H,front:false,s:1});

 /* the roofs: grime round their edges, conduit along the parapets, vent pipes, dishes, hatches, standing water; skylights and duct runs
    you can stand on (solid: registered like the old props, kept off the stairs and planks) */
 const MK_NEWPROPS=[];
 const roofFree=(x,z,h,m)=>!nearRamp(x,z,h,m)&&!MK_PROPS.some(p=>p.y===h&&Math.hypot(p.x-x,p.z-z)<m+1.8)&&!MK_NEWPROPS.some(p=>p.y===h&&Math.hypot(p.x-x,p.z-z)<m+1.2);
 const roofs=MK_BLD.map(B=>({r:B.r,h:B.h,B})).concat([MK_PLAT,mirR(MK_PLAT)].map(r=>({r,h:MK_PLAT_H})));
 for(const R0 of roofs){const [x0,x1,z0,z1]=R0.r,h=R0.h,wide=x1-x0>6;
   for(const [ax,az,bx,bz] of[[x0,z0,x1,z0],[x1,z0,x1,z1],[x1,z1,x0,z1],[x0,z1,x0,z0]]){const L=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/L,uz=(bz-az)/L,ix=-uz,iz=ux;   // inward (the roofs' edges go round clockwise seen from above)
     const a=[ax+ix*.15,az+iz*.15],b=[bx+ix*.15,bz+iz*.15];KIT.mg(MK_GRIME,{shadow:false,recv:false}).add(quadG([a[0],h+.02,a[1]],[b[0],h+.02,b[1]],[b[0]+ix*.9,h+.02,b[1]+iz*.9],[a[0]+ix*.9,h+.02,a[1]+iz*.9]),new THREE.Matrix4(),C(0));
     // conduit along the parapet's inside, on little stands (only where no stair or plank crosses)
     if(MK_HI&&wide&&DR(0,1)<.6){let s0=null;for(let s=.6;s<=L-.6+.01;s+=.5){const x=ax+ux*s+ix*.32,z=az+uz*s+iz*.32,ok=!nearRamp(x,z,h,.5)&&s<L-.6;
         if(ok&&s0===null)s0=s;if((!ok||s>=L-.6)&&s0!==null){if(s-s0>1.5){const p=[ax+ux*s0+ix*.32,h+.22,az+uz*s0+iz*.32],q=[ax+ux*s+ix*.32,h+.22,az+uz*s+iz*.32];rod(p,q,.05,metalMat,C(0x50555e));rod([p[0],h+.32,p[2]],[q[0],h+.32,q[2]],.035,metalMat,C(0x2a2c32));
           for(let t=s0;t<s;t+=1.5)KIT.mg(metalMat).add(boxUV(.08,.3,.08,1),M(ax+ux*t+ix*.32,h+.15,az+uz*t+iz*.32),K_TRIM);}s0=null;}}}}
   if(!wide)continue;const area=(x1-x0)*(z1-z0),solid=!!R0.B;
   // skylights (solid, low: a step up)
   for(let n=solid?Math.round(area/110)+1:0,t=0;n>0&&t<30;t++){const x=SR(x0+2,x1-2),z=SR(z0+2,z1-2);if(!roofFree(x,z,h,1.4))continue;n--;const ry=MK_SR()<.5?0:Math.PI/2;
     KIT.block({cx:x,cz:z,ry,l:1.9,w:1.2},h-.1,h+.45);MK_NEWPROPS.push({x,z,y:h});
     KIT.mg(trimMat).add(boxUV(1.9,.42,1.2,1),M(x,h+.21,z,0,ry,0),C(0x3a3e48));KIT.mg(glassMat).add(boxUV(1.7,.06,1,1),M(x,h+.44,z,0,ry,0),C(0x6a7aa0));
     KIT.mg(KIT.lampMat).add(boxUV(1.6,.02,.9,1),M(x,h+.4,z,0,ry,0),C(DR(0,1)<.5?0xffc890:0xa8e0ff).multiplyScalar(.5));for(let k=-1;k<=1;k++)KIT.mg(metalMat).add(boxUV(.04,.04,1.02,1),M(x+Math.cos(ry)*k*.55,h+.48,z-Math.sin(ry)*k*.55,0,ry,0),K_TRIM);}
   // a duct run along one side, on the roof against the parapet (solid, 0.55 high)
   if(solid){const side=(MK_SR()*4)|0,E=[[x0,z0,x1,z0],[x1,z0,x1,z1],[x1,z1,x0,z1],[x0,z1,x0,z0]][side],[ax,az,bx,bz]=E,L=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/L,uz=(bz-az)/L,ix=-uz,iz=ux,len=Math.min(L-3,SR(3,6)),s0=SR(1.5,Math.max(1.6,L-1.5-len));
     let ok=len>2;for(let s=s0;s<=s0+len&&ok;s+=.5){const x=ax+ux*s+ix*.75,z=az+uz*s+iz*.75;if(!roofFree(x,z,h,.9))ok=false;}
     if(ok){const sm=s0+len/2,cx=ax+ux*sm+ix*.75,cz=az+uz*sm+iz*.75,ry=Math.atan2(-uz,ux);KIT.block({cx,cz,ry,l:len,w:.6},h-.1,h+.55);MK_NEWPROPS.push({x:cx,z:cz,y:h});
       KIT.mg(metalMat).add(boxUV(len,.55,.6,1),M(cx,h+.275,cz,0,ry,0),C(0x8a909a));for(let s=0;s<=len;s+=1.2)KIT.mg(metalMat).add(boxUV(.06,.62,.66,1),M(ax+ux*(s0+s)+ix*.75,h+.29,az+uz*(s0+s)+iz*.75,0,ry,0),C(0x5a606a));
       const ex=ax+ux*(s0+len)+ix*.75,ez=az+uz*(s0+len)+iz*.75;KIT.mg(metalMat).add(boxUV(.7,.7,.7,1),M(ex,h+.35,ez,0,ry,0),C(0x7a808a));}}
   // vent stacks, a dish, a hatch, junk, standing water (no collision for the small ones; posts for the stacks)
   const nDec=MK_HI?Math.round(area/40)+2:Math.round(area/90)+1;
   for(let n=0,t=0;n<nDec&&t<40;t++){const edgeN=DR(0,1)<.7,x=edgeN?(DR(0,1)<.5?x0+DR(.55,1.1):x1-DR(.55,1.1)):DR(x0+1.5,x1-1.5),z=edgeN?DR(z0+1,z1-1):(DR(0,1)<.5?z0+DR(.55,1.1):z1-DR(.55,1.1));
     if(!roofFree(x,z,h,.8)||GS.BASES.some(B=>Math.hypot(B.x-x,B.z-z)<6))continue;n++;const k=DR(0,1);
     if(k<.4){const hh=DR(.6,1.4),r=DR(.07,.14);KIT.mg(metalMat).add(new THREE.CylinderGeometry(r,r,hh,10),M(x,h+hh/2,z),C(0x6a707a));KIT.mg(metalMat).add(new THREE.ConeGeometry(r*2.2,r*1.6,10),M(x,h+hh+r*.6,z),K_TRIM);OBST.push({x,z,r:r+.05,h:hh,y0:h});
       if(DR(0,1)<.5){const x2=x+DR(-.4,.4),z2=z+DR(-.4,.4),h2=hh*.6;KIT.mg(metalMat).add(new THREE.CylinderGeometry(r*.7,r*.7,h2,8),M(x2,h+h2/2,z2),C(0x50555e));}}
     else if(k<.55){const ry=DR(0,6.28);KIT.mg(metalMat).add(new THREE.CylinderGeometry(.04,.06,1.1,6),M(x,h+.55,z),K_TRIM);
       KIT.mg(metalMat).add(new THREE.SphereGeometry(.55,14,6,0,Math.PI*2,0,.9).scale(1,.45,1),M(x,h+1.25,z,-1,ry,0),C(0xc8ccd2));KIT.mg(metalMat).add(new THREE.CylinderGeometry(.015,.015,.5,4),M(x,h+1.35,z,-1,ry,0),K_TRIM);OBST.push({x,z,r:.3,h:1.6,y0:h});}
     else if(k<.7){KIT.mg(metalMat).add(boxUV(.9,.12,.9,1),M(x,h+.06,z),C(0x4a4e56));KIT.mg(metalMat).add(boxUV(.6,.03,.1,1),M(x,h+.135,z+.3),K_TRIM);}
     else if(k<.85){for(let j=0;j<3;j++)KIT.mg(trimMat).add(boxUV(DR(.3,.6),DR(.15,.4),DR(.3,.6),1),M(x+DR(-.4,.4),h+.12,z+DR(-.4,.4),0,DR(0,3),0),DPick([C(0x3a3028),C(0x2a3440),C(0x4a4a50)]));}
     else{const rr=DR(.8,1.8);KIT.mg(MK_PUDDLE,{shadow:false,recv:false}).add(new THREE.PlaneGeometry(rr*2,rr*DR(1,1.6)).rotateX(-Math.PI/2),M(x,h+.015,z,0,DR(0,3),0),C(0xffffff));}}
   // a red light on the corner of the tall ones
   if(h>=9){const x=x0+.3,z=z0+.3;KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.07,6,4),M(x,h+.95,z),C(0xff2020).multiplyScalar(2.5));}}

 /* rooftop billboards on the back row (lit from below, a catwalk under each), facing in over the roofs */
 for(const B of MK_BLD){if(B.front||B.r[1]-B.r[0]<9||B.h<6.5)continue;const s=B.s,[x0,x1,z0,z1]=B.r,back=s>0?z0:z1,W=Math.min(8,(x1-x0)*.55),cx=x0+(x1-x0)*.42,cz=back+(s>0?.6:-.6),y=B.h+1.6+2;
   if(Math.abs(B.r[0])>50)continue;const i=(hash(x0|0,7)*4)|0,ry=s>0?0:Math.PI;
   adAt(i,W,W/2,cx,y+W/4-1,cz+(s>0?.06:-.06),ry);KIT.mg(trimMat).add(boxUV(W+.3,W/2+.3,.12,1),M(cx,y+W/4-1,cz),C(0x16181e));
   for(const dx of[-W*.35,W*.35]){KIT.mg(metalMat).add(boxUV(.16,y+W/4-1-B.h,.16,1),M(cx+dx,(y+W/4-1+B.h)/2-W/8,cz),K_TRIM);KIT.mg(metalMat).add(boxUV(.1,1.8,.1,1),M(cx+dx,B.h+.9,cz+(s>0?.5:-.5),(s>0?1:-1)*-.6,0,0),K_TRIM);}
   KIT.mg(metalMat).add(boxUV(W,.06,.6,1),M(cx,y-1.15,cz+(s>0?.35:-.35)),K_METAL);
   for(let k=-1;k<=1;k++){const lx=cx+k*W*.3;KIT.mg(metalMat).add(boxUV(.3,.14,.2,1),M(lx,y-1.05,cz+(s>0?.45:-.45),.6*(s>0?1:-1),0,0),K_TRIM);
     KIT.mg(MK_BEAM,{shadow:false,recv:false,order:2}).add(new THREE.ConeGeometry(.9,W/2+.5,10,1,true).rotateX(Math.PI),M(lx,y-1+W/4,cz+(s>0?.32:-.32)),C(0xfff0d0).multiplyScalar(.08));}
   const q=[cx,B.h+.02,cz];streak(q[0],q[1],q[2],0,s>0?1:-1,4,W*.8,[0xff4fd8,0x41f0ff,0xffa83a,0x9b5cff][i],.25);}

 /* cables: across the street over the tarps, across the back alleys, between the roofs; some carry strings of bulbs */
 const frontAt=(x,sg)=>MK_BLD.find(B=>B.front&&B.s===sg&&x>B.r[0]+.3&&x<B.r[1]-.3);
 const backAt=(x)=>MK_BLD.find(B=>!B.front&&B.s===1&&x>B.r[0]+.3&&x<B.r[1]-.3);
 const bulbs=(a,b,sag,col)=>{const n=Math.round(Math.hypot(b[0]-a[0],b[2]-a[2])/.6);for(let i=1;i<n;i++){const t=i/n;KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.05,6,4),M(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag*4*t*(1-t)-.06,a[2]+(b[2]-a[2])*t),col);}};
 for(let x=-41;x<=41;x+=DR(1.4,MK_HI?2.6:4.5)){if(Math.abs(x)<6.5)continue;const A=frontAt(x,1),Bb=frontAt(x+DR(-1.5,1.5),-1);if(!A||!Bb)continue;const top=Math.min(A.h,Bb.h)-.5;if(top<5.9)continue;
   const a=[x,DR(5.6,top),-5.1],b=[clamp(x+DR(-1.5,1.5),Bb.r[0]+.3,Bb.r[1]-.3),DR(5.6,top),5.1],sag=DR(.3,1.1);cable(a,b,sag,DR(.018,.035));
   if(DR(0,1)<(MK_HI?.3:.15))bulbs(a,b,sag,C(DPick([0xffd08a,0xff9ad0,0x9fe8ff])).multiplyScalar(2));}
 for(const sg of[1,-1])for(let x=-38;x<=38;x+=DR(1.6,MK_HI?3:5)){const A=frontAt(x,1),Bb=backAt(x);if(!A||!Bb)continue;const top=Math.min(A.h,Bb.h)-.4;if(top<3.4)continue;
   const a=[x*sg,DR(3.2,top)*1,-17.1*sg],b=[(x+DR(-1,1))*sg,DR(3.2,top),-20.9*sg];if(nearRamp(a[0],a[2],a[1],.6)||nearRamp(b[0],b[2],b[1],.6))continue;cable(a,b,DR(.2,.7),DR(.015,.03));
   if(MK_HI&&DR(0,1)<.2)bulbs(a,b,.4,C(0xffc070).multiplyScalar(2));}
 // the gaps between the buildings along a row: wires across them, high
 for(const sg of[1,-1])for(const row of[true,false]){const L=MK_BLD.filter(B=>B.front===row&&B.s===sg).sort((p,q)=>p.r[0]-q.r[0]);
   for(let i=0;i+1<L.length;i++){const A=L[i],Bb=L[i+1],top=Math.min(A.h,Bb.h)-.4;if(top<4)continue;const zr=[Math.max(A.r[2],Bb.r[2])+.5,Math.min(A.r[3],Bb.r[3])-.5];
     for(let k=0;k<(MK_HI?3:1);k++){const z=DR(zr[0],zr[1]),a=[A.r[1]+.05,DR(3.5,top),z],b=[Bb.r[0]-.05,DR(3.5,top),z+DR(-1,1)];if(nearRamp(a[0],a[2],a[1],.5)||nearRamp(b[0],b[2],b[1],.5))continue;cable(a,b,DR(.15,.5),.02);}}}

 /* the market stalls: a neon tube along the canopy's edge, a sign hung under it, goods hung from it, glowing jars on the counter */
 for(const [x,w] of MK_STALLS)for(const s of[1,-1]){const X=x*s,Z=-3.05*s,fz=Z+1.02*s,ry=s>0?0:Math.PI,nc=NEON[(hash(x|0,s+3)*NEON.length)|0];
   KIT.mg(KIT.lampMat).add(boxUV(w+.6,.035,.035,1),M(X,2.2,fz),C(nc).multiplyScalar(2.4));
   const i=(hash(x*3|0,s+11)*32)|0;signAt(i,Math.min(w,2.2),.42,X,2.0,fz+.02*s,ry);
   streak(X,.02,Z+.7*s,0,s,2.8,w+.4,nc,.35);
   for(let k=0;k<(MK_HI?7:3);k++){const gx=X-w/2+.3+k*(w-.6)/Math.max(1,(MK_HI?6:2)),gl=DR(.25,.5),gz=Z+DR(.75,.9)*s;rod([gx,2.2,gz],[gx,2.2-gl,gz],.006,trimMat,C(0x111111));
     const kind=DR(0,1);if(kind<.4)KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.09,8,6).scale(1,1.3,1),M(gx,2.2-gl-.1,gz),C(DPick([0xff6a3a,0xffc04a,0xff3fa0,0x40e8ff])).multiplyScalar(1.4));
     else if(kind<.7)KIT.mg(clothMat).add(boxUV(.16,.36,.04,1),M(gx,2.2-gl-.18,gz),C(0xffffff).setHSL(DR(0,1),.6,.35));
     else KIT.mg(trimMat).add(new THREE.CylinderGeometry(.03,.09,.3,6),M(gx,2.2-gl-.15,gz),C(DPick([0x8a5a2a,0x6a3a2a,0xa08050])));}
   for(let k=0;k<4;k++)KIT.mg(KIT.lampMat).add(new THREE.CylinderGeometry(.06,.06,.16,8),M(X-w/2+.4+k*(w-.8)/3,1.16,Z+.42*s),C(DPick([0x57ff9a,0x31e8ff,0xffa83a,0xff3fc8])).multiplyScalar(.9));
   KIT.mg(trimMat).add(boxUV(w+.04,.12,.06,1),M(X,.98,Z+.66*s),C(DPick([0x6a2a2a,0x2a4a6a,0x5a5a2a])));}

 /* the street: puddles, manhole covers, grates in the gutters, the lamps' light in the rain and on the wet */
 for(let k=0;k<(MK_HI?44:16);k++){const x=DR(-42,42),z=DR(-4.3,4.3),r=DR(.5,1.6);if(Math.abs(Math.abs(z)-3.05)<.75&&MK_STALLS.some(([sx,w])=>Math.abs(Math.abs(x)-Math.abs(sx))<w/2+.2))continue;
   KIT.mg(MK_PUDDLE,{shadow:false,recv:false}).add(new THREE.PlaneGeometry(r*2,r*DR(.8,1.6)).rotateX(-Math.PI/2),M(x,.014,z,0,DR(0,3),0),C(0xffffff));}
 for(let k=0;k<(MK_HI?26:10);k++){const sg=DR(0,1)<.5?1:-1,x=DR(-40,40)*sg,z=DR(-20.6,-17.4)*sg,r=DR(.4,1.1);KIT.mg(MK_PUDDLE,{shadow:false,recv:false}).add(new THREE.PlaneGeometry(r*2.5,r).rotateX(-Math.PI/2),M(x,.014,z,0,DR(-.2,.2),0),C(0xffffff));}
 const MANH=[[-24,1.2],[-8.5,-.8],[12,1],[33,-.6],[-30,-19],[17,-19.2]];
 for(const [x,z] of MANH)for(const s of[1,-1]){KIT.mg(metalMat).add(new THREE.CylinderGeometry(.42,.42,.03,20),M(x*s,.015,z*s),C(0x2a2c30));for(let k=-2;k<=2;k++)KIT.mg(trimMat).add(boxUV(.7-Math.abs(k)*.1,.005,.04,1),M(x*s,.033,z*s+k*.13),C(0x15161a));}
 for(let x=-40;x<=40;x+=6)for(const z of[-4.15,4.15]){KIT.mg(metalMat).add(boxUV(.9,.02,.32,1),M(x+1.3,.035,z),C(0x1c1e22));for(let k=-3;k<=3;k++)KIT.mg(trimMat).add(boxUV(.03,.005,.28,1),M(x+1.3+k*.12,.05,z),C(0x060608));}
 for(const [x,z] of MK_LAMPS)for(const s of[1,-1]){const hx=x*s,hz=z*s+1*s;KIT.mg(MK_BEAM,{shadow:false,recv:false,order:2}).add(new THREE.ConeGeometry(1.9,4.9,18,1,true),M(hx,2.46,hz),C(0xbfe8ff).multiplyScalar(.1));
   KIT.mg(MK_FLOORGLOW,{shadow:false,recv:false,order:2}).add(new THREE.PlaneGeometry(4,4).rotateX(-Math.PI/2),M(hx,.03,hz),C(0xbfe8ff).multiplyScalar(.28));
   streak(hx,.025,hz,0,-s,3.5,.9,0xbfe8ff,.3);
   KIT.mg(metalMat).add(boxUV(.7,.14,.26,1),M(hx,5.02,hz),K_TRIM);}
 // the old signs' light on the wet ground under them (their colour read off their own canvases)
 const pix=(t)=>{try{const c=t.image,d=c.getContext('2d').getImageData(7,c.height>>1,1,1).data;return(d[0]<<16)|(d[1]<<8)|d[2];}catch(_){return 0xffffff;}};
 for(const S of MK_SIGNS){const p=S.mesh.position,ry=S.mesh.rotation.y,vert=S.mesh.geometry.parameters.height>3,col=pix(S.mat.map);
   if(Math.abs(p.z)<7){const dz=-Math.sign(p.z);streak(p.x,.026,p.z+(vert?-dz*.8:0),0,dz,vert?5:4,vert?1.4:3.5,col,vert?.45:.4);}
   else streak(p.x,.026,p.z,Math.sin(ry),Math.cos(ry),3,2,col,.35);}
 for(const sg of[1,-1]){streak(-43*sg,.026,0,sg,0,5,4.5,sg>0?GS.TEAMS.blue.c:GS.TEAMS.red.c,.35);streak(11*sg,.026,-5.05*sg,0,sg,4.5,3.4,0xff8a2a,.5);}
 // the lantern strings' colour pooled on the street under them
 for(const z0 of[-3.6,3.6])for(let x=-34;x<=34;x+=2.2){if(Math.abs(x)<4)continue;KIT.mg(MK_FLOORGLOW,{shadow:false,recv:false,order:2}).add(new THREE.PlaneGeometry(2.2,1.4).rotateX(-Math.PI/2),M(x,.028,z0*.8),C([0xff6a3a,0xffc04a,0xff3fa0,0x40e8ff][(Math.abs(x*7)|0)%4]).multiplyScalar(.12));}

 /* the city round it: the near ring's crowns, masts, lit bands, blades and ads; a far ring (PC) behind it */
 const inward=(x,z)=>Math.abs(z)>45?[0,-Math.sign(z)]:[-Math.sign(x),0];
 const ringDecor=([x,z,w,d,h],big)=>{const [nx,nz]=inward(x,z),cw=w*DR(.45,.7),cd=d*DR(.45,.7),ch=DR(2,big?7:4);KIT.mg(trimMat).add(boxUV(cw,ch,cd,2),M(x,h+ch/2,z),C(0x15171d));
   KIT.mg(KIT.lampMat).add(boxUV(w+.1,.12,d+.1,1),M(x,h-.6,z),C(DPick([0x31e8ff,0xff3fc8,0x9b5cff,0xffa83a])).multiplyScalar(DR(0,1)<.5?1.6:0));
   const mh=DR(3,9);KIT.mg(metalMat).add(new THREE.CylinderGeometry(.08,.16,mh,6),M(x,h+ch+mh/2,z),K_TRIM);KIT.mg(KIT.lampMat).add(new THREE.SphereGeometry(.25,8,6),M(x,h+ch+mh,z),C(0xff2020).multiplyScalar(3));
   const fx=x+nx*(w/2+.12),fz=z+nz*(d/2+.12),ry=Math.atan2(nx,nz),tx=-nz,tz=nx;
   if(DR(0,1)<(MK_HI?.85:.5)){const o=DR(-.3,.3)*(nz?w:d),bh=DR(5,9);signAt(32+((MK_DR()*32)|0),bh*.25,bh,fx+tx*o+nx*.9,DR(6,h*.75),fz+tz*o+nz*.9,Math.atan2(tx,tz));}
   if(DR(0,1)<(MK_HI?.4:.2)){const aw=Math.min(nz?w:d,10)*.85;adAt((MK_DR()*4)|0,aw,aw/2,fx+nx*.05,h*DR(.5,.8),fz+nz*.05,ry);}};
 for(const b of MK_RINGB)ringDecor(b,false);
 if(MK_HI)for(let k=0;k<18;k++){const a=k/18*Math.PI*2+DR(-.1,.1),dd=DR(92,120),x=Math.cos(a)*dd*1.25,z=Math.sin(a)*dd*.85,w=DR(12,20),d=DR(12,20),h=DR(40,95);
   drawBuilding([x-w/2,x+w/2,z-d/2,z+d/2],h,K_CONC[(MK_DR()*K_CONC.length)|0],{});ringDecor([x,z,w,d,h],true);}}

/* ---------- (Nov 8) the far city's searchlights sweeping the cloud, the rain's splashes on whatever's under you, more steam ---------- */
const MK_BEAMS=(()=>{const L=[];for(let k=0;k<(MK_HI?5:3);k++){const a=k/(MK_HI?5:3)*Math.PI*2+.7,d=DR(160,260),g=new THREE.ConeGeometry(7,420,16,1,true).rotateX(Math.PI).translate(0,210,0);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:MK_BEAMT,color:C(DPick([0xbfe0ff,0xffd0f0,0xbfe8ff])).multiplyScalar(.09),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false,toneMapped:false}));
    m.position.set(Math.cos(a)*d,-20,Math.sin(a)*d);m.userData.dyn=1;m.renderOrder=-1;scene.add(m);L.push({m,ph:DR(0,6),sp:DR(.08,.18)});}
  CITY.ticks.push((dt,T)=>{for(const b of L){b.m.rotation.z=Math.sin(T*b.sp+b.ph)*.35;b.m.rotation.x=Math.cos(T*b.sp*.7+b.ph)*.25;}});return L;})();
const MK_SPLASH=(()=>{const N=MK_HI?280:110,pos=new Float32Array(N*3),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.Points(g,new THREE.PointsMaterial({size:.08,map:glow,color:C(0xb8c8e8),transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending}));m.frustumCulled=false;m.userData.dyn=1;scene.add(m);
  const covered=(x,z)=>{for(const s of[1,-1]){const [a,b,c2,d]=s>0?CLUB.r:mirR(CLUB.r);if(x>a&&x<b&&z>c2&&z<d)return true;}if(Math.abs(z)<4.3&&((Math.abs(x)>15&&Math.abs(x)<33)))return true;return Math.abs(x)<3&&Math.abs(z)<5.3;};
  const put=(i)=>{const c=camera.position;let x,z,t=0;do{x=c.x+(Math.random()*2-1)*13;z=c.z+(Math.random()*2-1)*13;t++;}while(t<4&&covered(x,z));const y=covered(x,z)?-50:floorY3(x,z,c.y+.5);pos[i*3]=x;pos[i*3+1]=y+.04;pos[i*3+2]=z;};
  for(let i=0;i<N;i++)put(i);let k=0;CITY.ticks.push(()=>{for(let j=0;j<N/5;j++){put(k);k=(k+1)%N;}g.attributes.position.needsUpdate=true;});return m;})();
const MK_STEAM2=(()=>{const src=[];for(const [x,z] of[[-24,1.2],[12,1],[-30,-19],[17,-19.2]])for(const s of[1,-1])src.push([x*s,.05,z*s,1]);for(const [x] of MK_STALLS.slice(0,2))for(const s of[1,-1])src.push([x*s,1.2,-3.05*s,.6]);
  const N=MK_HI?140:50,pos=new Float32Array(N*3),life=new Float32Array(N);for(let i=0;i<N;i++)life[i]=Math.random();const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.Points(g,new THREE.PointsMaterial({size:1.3,map:glow,color:C(0x9aa0b8),transparent:true,opacity:.16,depthWrite:false}));m.frustumCulled=false;m.userData.dyn=1;scene.add(m);
  CITY.ticks.push(dt=>{for(let i=0;i<N;i++){life[i]+=dt*.3;if(life[i]>1)life[i]-=1;const S=src[i%src.length],u=life[i];pos[i*3]=S[0]+Math.sin(i*2.3+u*4)*.4*u+u*.8;pos[i*3+1]=S[1]+u*3.2*S[3];pos[i*3+2]=S[2]+Math.cos(i*1.3)*.4*u+u*.4;}g.attributes.position.needsUpdate=true;});return m;})();

KIT.flush();

/* ---------- the bots' map ---------- */
const NAV=KIT.nav({step:2.2});
// where they go looking: the street, the alleys' mouths, under the bridge, the tower tops
GS.HILLS=[{x:0,z:0},{x:-18,z:0},{x:18,z:0},{x:-30,z:-19},{x:30,z:19},{x:-10.5,z:-10},{x:10.5,z:10},{x:-3,z:-11},{x:3,z:11},{x:-18,z:-28},{x:18,z:28}];
// racks in the market (as well as each base's): under the tarps, either side of the middle
GS.RACKS=[{x:-15,z:1.2},{x:15,z:-1.2}];
// the opening: down the wet street under the lanterns, up past the billboard, over the roofs to the far side
GS.INTRO=[[[-38,3.2,1.5],[-10,4,-1]],[[-8,6,2],[2,11,0]],[[-14,22,-26],[6,9,-8]],[[24,16,22],[50,6,0]]];
