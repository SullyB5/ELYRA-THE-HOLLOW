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
// the facade: floors of windows, some lit warm, some cold, most dark; its emissive map is the lit ones only
function facadeTex(){const W=256,H=256,c=document.createElement('canvas'),e=document.createElement('canvas');c.width=e.width=W;c.height=e.height=H;const g=c.getContext('2d'),q=e.getContext('2d');
  g.fillStyle='#3a3d48';g.fillRect(0,0,W,H);q.fillStyle='#000';q.fillRect(0,0,W,H);
  // concrete grime streaks
  for(let i=0;i<220;i++){g.fillStyle=`rgba(${20+Math.random()*30|0},${20+Math.random()*28|0},${30+Math.random()*30|0},${Math.random()*.25})`;g.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*3,8+Math.random()*60);}
  const rows=4,cols=4,cw=W/cols,rh=H/rows;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const wx=x*cw+cw*.16,wy=y*rh+rh*.2,ww=cw*.68,wh=rh*.52,on=Math.random(),warm=Math.random()<.6;
    g.fillStyle='#14161e';g.fillRect(wx-3,wy-3,ww+6,wh+8);g.fillStyle='#252830';g.fillRect(wx-4,wy+wh+3,ww+8,4);
    if(on<.34){const col=warm?['#ffcf8a','#ffb870','#ffe0b0'][Math.random()*3|0]:['#9fe0ff','#c8b8ff','#7fd8e8'][Math.random()*3|0];g.fillStyle=col;q.fillStyle=col;g.fillRect(wx,wy,ww,wh);q.fillRect(wx,wy,ww,wh);
      // blinds half down, a figure's shadow now and then
      const bl=Math.random()*wh*.6;g.fillStyle='rgba(20,18,24,.55)';q.fillStyle='rgba(0,0,0,.6)';g.fillRect(wx,wy,ww,bl);q.fillRect(wx,wy,ww,bl);for(let k=0;k<bl;k+=3){q.fillStyle='rgba(0,0,0,.4)';q.fillRect(wx,wy+k,ww,1);}
      if(Math.random()<.2){q.fillStyle='rgba(0,0,0,.7)';q.fillRect(wx+ww*.3,wy+wh*.35,ww*.18,wh*.65);}}
    else{g.fillStyle=on<.5?'#1c2230':'#11141c';g.fillRect(wx,wy,ww,wh);g.fillStyle='rgba(120,140,200,.08)';g.fillRect(wx,wy,ww*.4,wh);}}
  const t=new THREE.CanvasTexture(c),te=new THREE.CanvasTexture(e);for(const x of[t,te]){x.wrapS=x.wrapT=THREE.RepeatWrapping;x.anisotropy=coarse?2:8;x.encoding=THREE.sRGBEncoding;}return[t,te];}
const [MK_FAC,MK_FACE]=facadeTex();
const facMat=new THREE.MeshStandardMaterial({vertexColors:true,map:MK_FAC,emissive:0xffffff,emissiveMap:MK_FACE,emissiveIntensity:1.5,roughness:.55,metalness:.15,envMap:MK_ENV,envMapIntensity:.6});
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
// the wet ground: paving slabs and their joints, the puddles shining (a roughness map), the street's gutters
function pavingTex(kind){const W=512,c=document.createElement('canvas'),r=document.createElement('canvas');c.width=c.height=r.width=r.height=W;const g=c.getContext('2d'),q=r.getContext('2d');
  g.fillStyle=kind==='roof'?'#2c2d30':'#26272c';g.fillRect(0,0,W,W);
  const S=kind==='roof'?64:42;for(let y=0;y<W;y+=S)for(let x=(y/S%2)*S/2;x<W+S;x+=S){const v=28+Math.random()*16|0;g.fillStyle=kind==='roof'?`rgb(${v+8},${v+8},${v+10})`:`rgb(${v},${v},${v+4})`;g.fillRect(x+1,y+1,S-2,S-2);g.fillStyle='#121316';g.fillRect(x,y,S,1.5);g.fillRect(x,y,1.5,S);}
  for(let i=0;i<500;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.25})`;g.beginPath();g.arc(Math.random()*W,Math.random()*W,Math.random()*6,0,7);g.fill();}
  // roughness: dry .75 (bright), the puddles near-mirror (dark)
  q.fillStyle='#bbb';q.fillRect(0,0,W,W);for(let i=0;i<26;i++){const x=Math.random()*W,y=Math.random()*W,rr=20+Math.random()*70;const gr=q.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,'#141414');gr.addColorStop(.7,'#262626');gr.addColorStop(1,'rgba(187,187,187,0)');q.fillStyle=gr;q.beginPath();q.ellipse(x,y,rr,rr*R(.4,.9),R(0,3),0,7);q.fill();}
  // joints hold water too
  for(let y=0;y<W;y+=S){q.fillStyle='rgba(40,40,40,.6)';q.fillRect(0,y,W,2);}
  const t=new THREE.CanvasTexture(c),tr=new THREE.CanvasTexture(r);for(const x of[t,tr]){x.wrapS=x.wrapT=THREE.RepeatWrapping;x.anisotropy=coarse?4:8;}t.encoding=THREE.sRGBEncoding;return[t,tr];}
const [MK_PAVE,MK_PAVER]=pavingTex('street'),[MK_ROOF,MK_ROOFR]=pavingTex('roof');
const groundMat=new THREE.MeshStandardMaterial({map:MK_PAVE,roughnessMap:MK_PAVER,roughness:1,metalness:.35,envMap:MK_ENV,envMapIntensity:1.6,vertexColors:true});
const roofMat=new THREE.MeshStandardMaterial({map:MK_ROOF,roughnessMap:MK_ROOFR,roughness:1,metalness:.3,envMap:MK_ENV,envMapIntensity:1.3,vertexColors:true});
const metalMat=new THREE.MeshStandardMaterial({vertexColors:true,map:panelTex,roughness:.38,metalness:.75,envMap:MK_ENV,envMapIntensity:1.2});
const trimMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.4,envMap:MK_ENV,envMapIntensity:.8});
const clothMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:0,side:THREE.DoubleSide,transparent:true,opacity:.92});
stoneMat=trimMat;
const K_CONC=[0x6c7280,0x5e6472,0x767a86,0x5a5e6a,0x707684,0x666a78].map(C),K_TRIM=C(0x2a2d36),K_METAL=C(0x8a929e),K_RUST=C(0x6a4a3a);
const NEON=[0xff3fc8,0x31e8ff,0xffa83a,0x9b5cff,0x57ff9a,0xff4a3a,0x3f8cff];


/* ---------- the club, drawn: dark panels outside with the doors, the sign; inside the hanging light, the sphere, the platform ---------- */
const CLUB_FX=[];
function drawClub(B,col){const s=B.s,[x0,x1,z0,z1]=CLUB.r,P=(x,z)=>s>0?[x,z]:[-x,-z],h=CLUB.h,G=new THREE.Group();G.userData.dyn=1;G.rotation.y=s>0?0:Math.PI;scene.add(G);
  const mg=new Map(),add=(mat,geo,m,c)=>{let b=mg.get(mat);if(!b){b=new Merger();mg.set(mat,b);}b.add(geo,m,c);};
  // the building over it: facades from the club's top up, the cornice, the roof
  const faces=[[x1,z0,x0,z0],[x0,z1,x1,z1],[x0,z0,x0,z1],[x1,z1,x1,z0]];
  for(const [ax,az,bx,bz] of faces){const L=Math.hypot(bx-ax,bz-az),g=new THREE.PlaneGeometry(L,B.h-h),U=g.attributes.uv;for(let i=0;i<U.count;i++)U.setXY(i,U.getX(i)*L/8,U.getY(i)*(B.h-h)/8+h/8);
    const dx=(bx-ax)/L,dz=(bz-az)/L;add(facMat,g,M((ax+bx)/2,(B.h+h)/2,(az+bz)/2,0,Math.atan2(-dz,dx),0),col);}
  add(trimMat,boxUV(x1-x0+.3,.35,z1-z0+.3,2),M((x0+x1)/2,B.h-.2,(z0+z1)/2),K_TRIM);add(roofMat,new THREE.PlaneGeometry(x1-x0,z1-z0).rotateX(-Math.PI/2),M((x0+x1)/2,B.h+.01,(z0+z1)/2),C(0xffffff));
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
  add(trimMat,new THREE.PlaneGeometry(x1-x0-.4,z1-z0-.4).rotateX(-Math.PI/2),M((x0+x1)/2,.02,(z0+z1)/2),C(0x0a0810));
  add(trimMat,boxUV(4,.6,3.2,1),M(11.5,.2,-11),C(0x1a1620));add(KIT.lampMat,boxUV(3.6,.03,2.8,1),M(11.5,.51,-11),C(0xfff4e8).multiplyScalar(.6));
  for(const [x,z,w,d] of[[8,-10.5,1.6,.5],[15,-11.8,.5,1.8],[11,-7,2.4,.4],[12.6,-14.6,1.2,.4]])add(KIT.lampMat,boxUV(w,.03,d,1),M(x,.03,z),C(0xffe8d0).multiplyScalar(.9));
  // the light: columns of it hanging from the ceiling, amber and white, some all the way down, some short
  for(let k=0;k<(coarse?26:44);k++){const x=R(x0+.6,x1-.6),z=R(z0+.6,z1-.6);if(Math.abs(x-11.5)<2.3&&Math.abs(z+11)<1.9)continue;const L=hash(k,7)<.4?h-.4:R(.8,2.6);
    add(KIT.lampMat,boxUV(.07,L,.07,1),M(x,h-.3-L/2,z),C(hash(k,3)<.7?0xffb050:0xfff0d8).multiplyScalar(R(.9,1.5)));}
  // the bar along the back: its top lit underneath, bottles in a lit shelf behind
  add(trimMat,boxUV(4.8,1.1,1.1,1),M(9.8,.55,-15.85),C(0x221a1c));add(KIT.lampMat,boxUV(4.8,.05,1.12,1),M(9.8,1.05,-15.85),C(0xff8030).multiplyScalar(1.6));
  for(let k=0;k<20;k++)add(KIT.lampMat,new THREE.CylinderGeometry(.04,.05,.3,6),M(7.6+k*.23,1.9,-16.75),C([0x40e0ff,0xffb050,0x9b5cff][k%3]).multiplyScalar(1.4));
  add(trimMat,boxUV(5,.04,.3,1),M(9.8,1.72,-16.7),C(0x3a3036));
  // booths: low curved seats in the side's dark red, a table
  for(const [x,z,w,d] of[[7.35,-6.9,1.7,2.2],[15.9,-7.3,1.4,2.6],[15.9,-12.4,1.4,2.4]]){add(trimMat,boxUV(w,.9,d,1),M(x,.45,z),C(0x4a1418));add(KIT.lampMat,boxUV(w+.02,.04,d+.02,1),M(x,.1,z),C(0xff5a2a).multiplyScalar(1.2));}
  for(const [x,z] of[[8.4,-12.8],[14.6,-9.2]])add(metalMat,new THREE.CylinderGeometry(.3,.3,h,14),M(x,h/2,z),C(0x2a2830));
  for(const [mat,b] of mg){const m=new THREE.Mesh(b.build(),mat);m.castShadow=mat!==KIT.lampMat;m.receiveShadow=true;m.userData.dyn=1;G.add(m);}
  // the sphere: a ball of fire held over the platform, its surface crawling, a light the whole room takes its colour from
  const U={uT:{value:0}};const sph=new THREE.Mesh(new THREE.SphereGeometry(1.15,40,28),new THREE.ShaderMaterial({uniforms:U,toneMapped:false,
    vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec3 vN;varying vec3 vP;uniform float uT;float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){vec3 p=normalize(vP)*3.0;float a=n(p+vec3(0.0,uT*.6,0.0))*.6+n(p*2.3-vec3(uT*.4))*.3+n(p*5.1+uT)*.1;float veins=smoothstep(.45,.5,a)-smoothstep(.5,.56,a);
        float rim=pow(1.0-abs(vN.z),2.0);vec3 col=vec3(1.0,.42,.07)*(1.0+a)*.95+vec3(1.0,.85,.5)*veins*2.6+vec3(1.0,.55,.18)*rim*1.1;gl_FragColor=vec4(col,1.0);}`}));
  sph.position.set(11.5,2.5,-11);sph.userData.dyn=1;G.add(sph);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff8030).multiplyScalar(1.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));halo.position.copy(sph.position);halo.scale.setScalar(5.5);halo.userData.dyn=1;G.add(halo);
  for(const r of[1.5,1.85]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.03,6,48),new THREE.MeshBasicMaterial({color:C(0xffc070).multiplyScalar(1.4),toneMapped:false}));ring.position.copy(sph.position);ring.userData.dyn=1;G.add(ring);CLUB_FX.push({ring,k:r});}
  const L=new THREE.PointLight(C(0xff7a2a),3,16,1.6);L.position.set(11.5,2.5,-11);G.add(L);const L2=new THREE.PointLight(C(0x9b5cff),.9,10,1.8);L2.position.set(8,3.6,-7);G.add(L2);
  CLUB_FX.push({U,sph,L});
  // the sign over the street door
  const t=KIT.neonTex('EMBER',0xff8a2a,{w:384,h:120,size:70});const sm=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.1),new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(1.8,1.8,1.8)}));
  sm.position.set(11,4.1,z1+.08);sm.userData.dyn=1;G.add(sm);MK_SIGNS_LATE.push(sm);}
const MK_SIGNS_LATE=[];
CITY.ticks.push((dt,T)=>{for(const F of CLUB_FX){if(F.U){F.U.uT.value=T;F.L.intensity=2.6+Math.sin(T*2.2)*.5+Math.sin(T*7.3)*.2;F.sph.rotation.y=T*.3;}if(F.ring){F.ring.rotation.x=T*(F.k>1.6?.5:-.7);F.ring.rotation.y=T*.3*F.k;}}});
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
  KIT.mg(roofMat,{shadow:false}).add(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),M((x0+x1)/2,h+.01,(z0+z1)/2),C(0xffffff));}
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
 for(const r of[MK_PLAT,mirR(MK_PLAT)]){const [x0,x1,z0,z1]=r;KIT.mg(roofMat,{shadow:false}).add(new THREE.PlaneGeometry(x1-x0,z1-z0).rotateX(-Math.PI/2),M((x0+x1)/2,MK_PLAT_H+.012,(z0+z1)/2),C(0xc8ccd8));}}

/* ---------- the city all round: the blocks past the edge close the view, the towers of Tide City beyond them, the sky ---------- */
{// the near ring: tall dark blocks just past the edge, windows lit (no collision: the edge stops you)
 const ring=[];for(let x=-74;x<=74;x+=13)for(const z of[-50,50])ring.push([x+R(-2,2),z+R(-4,4)]);for(let z=-36;z<=36;z+=14)for(const x of[-72,72])ring.push([x+R(-4,4),z+R(-2,2)]);
 for(const [x,z] of ring){const w=R(9,13),d=R(9,13),h=R(16,42);drawBuilding([x-w/2,x+w/2,z-d/2,z+d/2],h,K_CONC[(rng()*K_CONC.length)|0],{});
   if(rng()<.5){const col=NEON[(rng()*NEON.length)|0],t=KIT.neonTex(KIT.glyphWord(4,x*z|0),col,{w:96,h:384,size:52});const mat=new THREE.MeshBasicMaterial({map:t,toneMapped:false,color:new THREE.Color(1.6,1.6,1.6),side:THREE.DoubleSide});
     const m=new THREE.Mesh(new THREE.PlaneGeometry(2,8),mat);m.position.set(x+(Math.abs(x)>60?-Math.sign(x)*(w/2+.2):0),h*.6,z+(Math.abs(z)>45?-Math.sign(z)*(d/2+.2):0));m.rotation.y=Math.abs(x)>60?Math.PI/2:0;m.userData.dyn=1;scene.add(m);}}
 // Tide City beyond: the shared skyline, all round, far off
 if(typeof SKYLINE!=='undefined'){const S=SKYLINE.build({n:coarse?36:64,seed:31,h:260,w:46,water:-40,lit:.5,rings:false,traffic:coarse?12:28,place:(i,r)=>{const a=i/(coarse?36:64)*Math.PI*2+r()*.1,d=170+r()*420;return[Math.cos(a)*d,Math.sin(a)*d,1-(d-170)/420];}});
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
keyLight.color.copy(C(0x8ea4e0));keyLight.intensity=.5;keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(keyLight.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:400});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.05;
keyLight.position.set(-60,140,-80);keyLight.target.position.set(0,0,0);
{const pools=[[-30,2.5,-2,0xff3fc8],[-12,2.6,2,0x31e8ff],[22,2.6,-2,0xffa83a],[-46,3.4,-14,0x9b5cff],[-18,3.4,-19,0x57ff9a]];
 for(const [x,y,z,c] of pools)for(const s of(coarse?[1]:[1,-1])){const L=new THREE.PointLight(C(c),1.5,16,1.8);L.position.set(x*s,y,z*s);scene.add(L);}
 for(const B of GS.BASES){const L=new THREE.PointLight(C(GS.TEAMS[B.team].c),1.6,22,1.6);L.position.set(B.x-B.fx*3,B.y+4,B.z);scene.add(L);}}
// the neon flickers (a few of them), the base strips breathe
CITY.ticks.push((dt,T)=>{for(const S of MK_SIGNS){if(!S.flick)continue;const f=Math.sin(T*23+S.ph)>.93||Math.sin(T*1.3+S.ph)>.985?.15:1.6;S.mat.color.setScalar(f);}});

/* ---------- the weather: rain, steam off the roofs' vents, thunder far off ---------- */
KIT.rain({n:coarse?1000:2600,col:0x9ab0d0,op:.42});
const MK_SND=KIT.sound([{f:[['highpass',380],['lowpass',5200]],v:.15},{f:[['lowpass',260]],v:.07,swell:.3,rate:.2}]);
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

KIT.flush();

/* ---------- the bots' map ---------- */
const NAV=KIT.nav({step:2.2});
// where they go looking: the street, the alleys' mouths, under the bridge, the tower tops
GS.HILLS=[{x:0,z:0},{x:-18,z:0},{x:18,z:0},{x:-30,z:-19},{x:30,z:19},{x:-10.5,z:-10},{x:10.5,z:10},{x:-3,z:-11},{x:3,z:11},{x:-18,z:-28},{x:18,z:28}];
// racks in the market (as well as each base's): under the tarps, either side of the middle
GS.RACKS=[{x:-15,z:1.2},{x:15,z:-1.2}];
// the opening: down the wet street under the lanterns, up past the billboard, over the roofs to the far side
GS.INTRO=[[[-38,3.2,1.5],[-10,4,-1]],[[-8,6,2],[2,11,0]],[[-14,22,-26],[6,9,-8]],[[24,16,22],[50,6,0]]];
