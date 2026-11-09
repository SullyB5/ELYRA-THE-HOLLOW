/* Elyra · TakeOver · Fallen Spire — the world (Oct 31, Bryce: "Fallen Spire: a White City tower that has toppled over on its side.
   You fight inside it horizontally, so floors become walls and windows become pits." His references the same night: the inside of
   a New Alexandria tower in Halo: Reach — white walls, warm wood, glass, planters, lit strips — and New Alexandria burning behind it).

   The spire came down across its plaza and broke in two. The two halves lie side by side, offset, their broken ends facing each other
   over a heap of rubble in the middle; the city burns all round.
     inside      a tower on its side: its storeys are walls now, every 4.6 m across the hall, with the doorways and stairwells that were
                 in them; what was the facade is the floor, its windows pits; the far facade is the ceiling, its windows skylights.
                 Desks, sofas, planters and lamps all slid onto what is now the floor
     the pits    drop through a window into the crushed level under the tower (3.5 m down, old car park, light coming down the pits);
                 rubble slopes back up in two of the pits on each half, and out into the plaza at the break
     the top     what was the tower's side is a long walk 9 m up, open to the sky, its windows holes back down into the hall;
                 rubble ramps up onto it from the plaza, one near the middle and one toward each end
     the plaza   white stone, fires, burnt-out cars, the bases at the far ends (each by its half's broken base)
   Blue at the west end, red at the east. The same turned half way round (x,z → -x,-z).
   (Oct 31, later — Bryce: too tight side to side, "make it 1x as big to the sides … may need to add more stuff". The plaza is twice
   as wide now, and each side of it has more of the city in it: a shopping arcade with a roof walk, the spire's crown broken off
   with its needle lying out across the stones, a fallen sky-bridge ramped up onto its pillar, a row of kiosks, a fountain court.)

   Built on js/mp/kit.js. Units are metres; north is -z. */
setSeed(8484);
renderer.toneMappingExposure=1.05;
HAZE_HEX=0x3a1c12;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),.0095);scene.background=C(0x2a120a);

/* ---------- the plan ---------- */
const SEG={x0:-50,x1:-4,zN:-11,zS:1,H:9,BASE:-3.5,BAY:4.6};   // the west half (blue's); the east half is its twin
const GS=(()=>{
  const HALF=62,BASE_R=7;
  const BASES=[{team:'blue',x:-56.5,z:-5},{team:'red',x:56.5,z:5}].map(B=>{B.fx=-Math.sign(B.x);B.fz=0;B.r=BASE_R;B.shieldR=9.5;B.spawnR=2.2;B.spawnStep=1.8;return B;});
  const CFG={id:'mpspire',name:'FALLEN SPIRE',sub:'Team deathmatch · a tower on its side',air:false,vehicles:false,bots:8,score:50,time:10*60,see:70,range:60,hold:16,flashlights:false,beacon:false,domeK:.4,domeFog:true,
    brief:'TakeOver · team deathmatch. A tower of the city lies on its side, broken in two, the city burning round it. Inside, its floors are walls and its windows are pits: drop through one into the crushed level under it. Its side is a long walk along the top, its windows holes back down into the hall.',
    objective:'Down the other side. Your base has guns and ammo; nothing crosses its dome.'};
  return{HALF,HALFZ:52,SEA:-99,TEAMS:TEAM_COLS,BASES,BASE_R,CFG,NAME:CFG.name};})();
const mirP=(x,z)=>[-x,-z];
const inSeg=(x,z)=>(x>SEG.x0&&x<SEG.x1&&z>SEG.zN&&z<SEG.zS)||(-x>SEG.x0&&-x<SEG.x1&&-z>SEG.zN&&-z<SEG.zS);
// the trench at each break where the crushed level comes up into the plaza: a ramp from its floor to the plaza's
const TRENCH=[-4,3.6,-7.3,-4.7],inTrench=(x,z)=>(x>TRENCH[0]&&x<TRENCH[1]&&z>TRENCH[2]&&z<TRENCH[3])||(-x>TRENCH[0]&&-x<TRENCH[1]&&-z>TRENCH[2]&&-z<TRENCH[3]);
CITY.ground=(x,z)=>(inSeg(x,z)||inTrench(x,z))?SEG.BASE:0;
CITY.edge=(x,z)=>Math.max(Math.abs(x)-61.6,Math.abs(z)-51.6);
CITY.box=[-62,-52,62,52];CITY.step=2;
kitContract();
const twin=fn=>{fn(1);fn(-1);};   // s=1 the west half as written, s=-1 its twin (x,z → -x,-z)

/* ---------- the halves: their bays, partitions (old storeys), pits (old windows), skylights, side windows ---------- */
const NB=Math.round((SEG.x1-SEG.x0)/SEG.BAY);   // 10 bays
const bayX=k=>SEG.x0+k*SEG.BAY;
// each bay: its pit (in the floor) and skylight (in the ceiling): [z centre, z length]; ramps up out of the pit in bays 2 and 7
const PITS=[];for(let k=0;k<NB;k++){const north=k%2===0,big=k===2||k===7,len=big?5.6:3.6,zc=north?SEG.zN+1.4+len/2:SEG.zS-1.4-len/2;PITS.push({k,x0:bayX(k)+1.1,x1:bayX(k)+3.5,z0:zc-len/2,z1:zc+len/2,ramp:big});}
const SKY=[];for(let k=0;k<NB;k++){const north=k%2===1,zc=north?SEG.zN+3:SEG.zS-3;SKY.push({x0:bayX(k)+1.1,x1:bayX(k)+3.5,z0:zc-1.8,z1:zc+1.8});}
// the partitions' openings: [z0,z1,y0,y1] — doorways (2.4 by 3.2), the stairwell's long gap, a few broken right through
const PART=[];for(let k=1;k<NB;k++){const o=[];if(k===4){o.push([SEG.zN+2,SEG.zS-2,0,5.5]);}   // (broken through in the middle)
  else{const a=k%3;if(a!==1)o.push([SEG.zN+1.2,SEG.zN+3.6,0,3.2]);if(a!==2)o.push([SEG.zS-3.6,SEG.zS-1.2,0,3.2]);if(a===0)o.push([-6.4,-3.6,0,3.2]);
    o.push([SEG.zN+1,SEG.zN+3.2,6,8.2]);}   // (the stairwell, high up: you see through it)
  PART.push({x:bayX(k),o});}
// the side windows (the old side facades): one tall opening a bay on each side, sill at the floor: ways out onto the plaza
const SIDEWIN=[];for(let k=0;k<NB;k++){for(const side of['n','s']){if((k+(side==='n'?0:1))%2)continue;SIDEWIN.push({side,a0:bayX(k)+1,a1:bayX(k)+3.2,y0:0,y1:6.8});}}
const roofRamps=[];
// (Nov 8) the wrecked cars in the crushed level: solid now (the half's own frame; buildHalf turns them round for the twin)
const CARPARK_CARS=[[-44,-8.5,.2],[-27,-1,1.3],[-12,-9,-.3],[-47.3,-1.6,.1]];
function buildHalf(s){const P=(x,z)=>s>0?[x,z]:mirP(x,z);const {x0,x1,zN,zS,H,BASE}=SEG;
  const rect=(a,b,c,d)=>s>0?[a,b,c,d]:[-b,-a,-d,-c];
  // the floor (the old facade), in pieces round the pits: you stand on it, shots don't go through it
  for(let k=0;k<NB;k++){const bx0=bayX(k),bx1=bayX(k+1),p=PITS[k];
    const pieces=[[bx0,bx1,zN,p.z0],[bx0,bx1,p.z1,zS],[bx0,p.x0,p.z0,p.z1],[p.x1,bx1,p.z0,p.z1]];
    for(const [a,b,c,d] of pieces){if(b-a<.05||d-c<.05)continue;const r=rect(a,b,c,d);KIT.block(r,BASE+3.1,0);}}
  // the ceiling (the old far facade) is the top: a walk 9 m up, its skylights holes down into the hall
  for(let k=0;k<NB;k++){const bx0=bayX(k),bx1=bayX(k+1),q=SKY[k];
    for(const [a,b,c,d] of[[bx0,bx1,zN,q.z0],[bx0,bx1,q.z1,zS],[bx0,q.x0,q.z0,q.z1],[q.x1,bx1,q.z0,q.z1]]){if(b-a<.05||d-c<.05)continue;KIT.block(rect(a,b,c,d),H,H+.5);}}
  // the side walls (the old side facades) with their windows, from the floor to the ceiling
  for(const [side,z] of[['n',zN],['s',zS]]){const W=SIDEWIN.filter(w=>w.side===side).sort((p,q)=>p.a0-q.a0);let cur=x0;
    const seg=(a,b,y0,y1)=>{if(b-a<.05||y1-y0<.05)return;const p0=P(a,z),p1=P(b,z);KIT.wall(p0[0],p0[1],p1[0],p1[1],y0,y1,.5);};
    for(const w of W){seg(cur,w.a0,BASE,H);seg(w.a0,w.a1,w.y1,H);seg(w.a0,w.a1,BASE,0);cur=w.a1;}seg(cur,x1,BASE,H);}
  // the partitions (the old storeys)
  for(const Pt of PART){const pz=Pt.o.slice().sort((p,q)=>p[0]-q[0]);
    // the wall in vertical strips between the openings' z edges, each strip full height less whatever openings it holds
    const edges=[zN,zS,...pz.flatMap(o=>[o[0],o[1]])].sort((a,b)=>a-b);
    for(let i=0;i<edges.length-1;i++){const za=edges[i],zb=edges[i+1];if(zb-za<.05)continue;const zm=(za+zb)/2,ops=pz.filter(o=>o[0]<=zm&&o[1]>=zm).sort((a,b)=>a[2]-b[2]);let y=0;
      for(const o of ops){if(o[2]>y){const p0=P(Pt.x,za),p1=P(Pt.x,zb);KIT.wall(p0[0],p0[1],p1[0],p1[1],y,o[2],.45);}y=Math.max(y,o[3]);}
      if(y<H){const p0=P(Pt.x,za),p1=P(Pt.x,zb);KIT.wall(p0[0],p0[1],p1[0],p1[1],y,H,.45);}}}
  // the crushed level under the floor: its outer walls (the break and the base end leave ways out), columns, the pit ramps
  {const seg=(ax,az,bx,bz)=>{const a=P(ax,az),b=P(bx,bz);KIT.wall(a[0],a[1],b[0],b[1],BASE-.3,0,.6);};seg(x0,zN,x1,zN);seg(x0,zS,x1,zS);seg(x0,zN,x0,zS);
   seg(x1,zN,x1,-7.4);seg(x1,-4.6,x1,zS);   // (the way out at the break: the ramp up into the rubble)
   for(let k=1;k<NB;k++){const [cx,cz]=P(bayX(k),-5);KIT.post(cx,cz,.45,BASE,3.5);}
   for(const [x,z,ry] of CARPARK_CARS){const [cx,cz]=P(x,z),r=ry+(s>0?0:Math.PI),cab=P(x-.3*Math.cos(ry),z+.3*Math.sin(ry));KIT.block({cx,cz,ry:r,l:4.2,w:1.8},BASE-.1,BASE+1.15);KIT.block({cx:cab[0],cz:cab[1],ry:r,l:2.2,w:1.6},BASE+1.15,BASE+1.77,{top:false});}
   for(const p of PITS)if(p.ramp){const north=p.z0<-5,P0=P((p.x0+p.x1)/2,north?p.z0+.1:p.z1-.1),u=north?1:-1;KIT.ramp(P0,0,u*s,p.z1-p.z0+.2,2.2,BASE,0,{rails:[false,false],slab:false}).kind='pit';}
   const P0=P(x1,-6);KIT.ramp(P0,s,0,7.6,2.6,BASE,0,{rails:[true,true],clear:2.2}).kind='trench';
   for(const z of[TRENCH[2],TRENCH[3]]){const a=P(TRENCH[0],z),b=P(TRENCH[1],z);KIT.wall(a[0],a[1],b[0],b[1],BASE-.3,0,.3);}}
  // ends: the base end is broken open (a jagged gap), the break end wide open
  {const a=P(x0,zN),b=P(x0,-8.6),c=P(x0,-2.2),d=P(x0,zS);KIT.wall(a[0],a[1],b[0],b[1],0,H,.6);KIT.wall(c[0],c[1],d[0],d[1],0,H,.6);const e=P(x0,-8.6),f=P(x0,-2.2);KIT.wall(e[0],e[1],f[0],f[1],5.2,H,.6);}
  // the rubble ramps up onto the top: along the outside of the south face near the middle, the north face toward the base end
  roofRamps.push(KIT.ramp(P(-12,zS+1),-s,0,15.5,3,0,H+.5,{rails:[true,false]}));
  roofRamps.push(KIT.ramp(P(-30,zN-1),-s,0,15.5,3,0,H+.5,{rails:[false,true]}));}
twin(buildHalf);

/* ---------- the rubble in the middle, the plaza's cover, the cars, the fires ---------- */
const RUBBLE=[];   // {x,z,l,w,h,ry}
twin(s=>{const P=(x,z)=>s>0?[x,z]:mirP(x,z);
  for(const [x,z,l,w,h,ry] of[[-1.5,-12,3,2.2,1.4,.4],[2,-15.5,2.4,1.6,1.1,1.1],[-2.5,3,2.6,1.8,1.2,.2],[1,8.5,1.6,1.6,1,.8],[-9,14,3.2,1.2,1.3,.3],[-22,9,2,2,1.2,.6],[-35,6.5,2.6,1.4,1.1,1.3],[-44,13,2.4,2.4,1.4,.5],
    [-20,-17,2.2,1.6,1.2,.9],[-41,-19,3,1.4,1.1,.2],[-52,-15,2,2,1.2,.7],[-14,20,2.6,2,1.3,1],[-30,17,1.8,1.8,1,.3],[-48,4.5,2.2,1.6,1.1,.6],
    [-30,-32,2.4,1.8,1.2,.6],[-54,-30,2.2,2,1.2,.2],[-20,-50,2,1.6,1.1,.9],[-56,48,2.6,2,1.3,.4],[-30,50,2.2,1.4,1,1.1],[-4,40,2,2,1.1,.3]]){const [X,Z]=P(x,z);
    KIT.block({cx:X,cz:Z,ry:ry,l,w},-.2,h);RUBBLE.push({x:X,z:Z,l,w,h,ry});}
  // broken pillars, a car or two (burnt out), a fountain's rim in the middle
  for(const [x,z] of[[-6,-21],[-26,21],[-46,-21],[-16,-6.5+20],[-52,-36],[-50,30],[-8,50]])KIT.post(...P(x,z),.7,0,4.5);});
const CARS=[[-18,-20,.15],[-38,17,-.3],[-8,17,1.3],[-54,10,.5],[-36,-30,.4],[-56,40,.2],[-22,46,1.4]];
twin(s=>{for(const [x,z,ry] of CARS){const X=x*s,Z=z*s;KIT.block({cx:X,cz:Z,ry,l:4.6,w:2},-.1,1.4);}});

/* ---------- the wider plaza (Oct 31): what each side of it holds now (west half's side as written, its twin turned round) ---------- */
// the arcade: a row of shops under a roof you can walk, its columns along the front, two ways through its back wall into the alley
// behind it, stairs up at both ends
const ARC={x0:-48,x1:-16,zb:-46,zf:-38,H:4.1,T:.4};
// the crown: the spire's top broken off, a tall room lying on its side, doors in, its roof reached up a heap of rubble; its needle
// lies out across the stones, a long low wall
const CROWN={x0:-13,x1:1,zN:-34,zS:-26,H:5.5};
// the sky-bridge: its span fell, one end on the stones, the other still on its pillar (a perch 5 m up); kiosks; the fountain court
const BRIDGE={px0:-44,px1:-40,pz0:34.5,pz1:37.5,top:5};
const KIOSKS=[-48,-40,-32],FOUNT={x:-12,z:44,r:3};
twin(s=>{const P=(x,z)=>s>0?[x,z]:mirP(x,z),rect=(a,b,c,d)=>s>0?[a,b,c,d]:[-b,-a,-d,-c];
  const W=(ax,az,bx,bz,y0,y1,th)=>{const a=P(ax,az),b=P(bx,bz);KIT.wall(a[0],a[1],b[0],b[1],y0,y1,th);};
  // arcade
  {const {x0,x1,zb,zf,H,T}=ARC;KIT.block(rect(x0,x1,zb,zf),H,H+T);
   for(const [a,b] of[[x0,-40],[-37.6,-26],[-23.6,x1]])W(a,zb,b,zb,0,H,.4);for(const [a,b] of[[-40,-37.6],[-26,-23.6]])W(a,zb,b,zb,3.2,H,.4);
   for(const x of[-42,-32,-22])W(x,zb,x,-41.5,0,H,.3);
   for(let x=x0+2;x<x1;x+=4)KIT.post(...P(x,zf-.4),.4,0,H);
   for(const [a,b] of[[x0,-33.2],[-30.8,x1]])W(a,zf+.15,b,zf+.15,H+T-.1,H+T+.9,.3);
   {const a=P(x0,zb+.15),b=P(x1,zb+.15);KIT.rail(a[0],a[1],b[0],b[1],H+T);}
   KIT.ramp(P(-56,-40),s,0,8,2,0,H+T,{rails:[true,true]}).kind='stair';KIT.ramp(P(-8,-42),-s,0,8,2,0,H+T,{rails:[true,true]}).kind='stair';}
  // crown
  {const {x0,x1,zN,zS,H}=CROWN;KIT.block(rect(x0,x1,zN,zS),H,H+.4);
   W(x0,zN,-9,zN,0,H,.5);W(-6.6,zN,x1,zN,0,H,.5);W(-9,zN,-6.6,zN,3.2,H,.5);
   W(x0,zS,-5,zS,0,H,.5);W(-2.6,zS,x1,zS,0,H,.5);W(-5,zS,-2.6,zS,3.2,H,.5);
   W(x0,zN,x0,-31.2,0,H,.5);W(x0,-28.8,x0,zS,0,H,.5);W(x0,-31.2,x0,-28.8,3.2,H,.5);
   W(x1,zN,x1,-32,0,4,.5);W(x1,-28,x1,zS,0,3.4,.5);
   KIT.ramp(P(-26,-30),s,0,13,2.6,0,H+.4,{rails:[false,false]});
   const n=P(13.5,-30);KIT.block({cx:n[0],cz:n[1],ry:0,l:22,w:1.3},-.1,1.3);}
  // sky-bridge, its fallen end, kiosks, the fountain
  {const {px0,px1,pz0,pz1,top}=BRIDGE;KIT.block(rect(px0,px1,pz0,pz1),-.1,top);W(px0+.15,pz0,px0+.15,pz1,top-.1,top+1,.3);
   KIT.ramp(P(-26,36),-s,0,14,3,0,top,{rails:[true,true]}).kind='span';
   const f=P(-49,41.5);KIT.block({cx:f[0],cz:f[1],ry:.3,l:6,w:3},-.1,1.1);
   for(const x of KIOSKS)KIT.block(rect(x-2,x+2,44,47.5),-.1,2.8);
   const c=P(FOUNT.x,FOUNT.z);KIT.post(c[0],c[1],FOUNT.r,0,.9);KIT.post(c[0],c[1],.6,0,4.2);}});
// racks: in the hall of each half (by the middle) and in the crushed level
/* racks: in the crushed level of each half, out on the plaza by the arcade, in the crown. (Nov 8, Bryce: "a weapon created in front of
   the stairs": a rack asked for in the hall stands on the ground under it, the car park, and it had backed onto the side of the pit's
   stairs with its ammo box at their foot; the crown's stood in its west doorway. Each is now asked for against a plain wall, and the
   ends of every stair and ramp, and the doorways, are marked as no place for a rack or a box) */
GS.RACKS=[{x:-24.7,z:-8.4},{x:24.7,z:8.4},{x:-28,z:-35},{x:28,z:35},{x:-4,z:-31.4},{x:4,z:31.4}];
{const NP=window.NO_PLACE=window.NO_PLACE||[];
 for(const R0 of KIT.PAIRS)for(const a of[-1.2,0,R0.L,R0.L+1.2]){NP.push({x:R0.P0[0]+R0.ux*a,z:R0.P0[1]+R0.uz*a,r:Math.max(1.6,R0.w*.8)});}
 twin(s=>{for(const [x,z] of[[-13,-30],[-7.8,-34],[-3.8,-26],[-56,-40],[-8,-42]])NP.push({x:x*s,z:z*s,r:1.8});});}

/* ---------- materials: New Alexandria's insides — white plaster, warm wood, brushed metal, glass; the city's white stone ---------- */
const SP_ENV=KIT.env((x,y,z)=>{const hz=1-Math.abs(y);let r=.2+.5*hz*hz,g=.06+.16*hz*hz,b=.03+.05*hz*hz;if(y<0){r*=.4;g*=.4;b*=.4;}const a=Math.atan2(z,x);r+=sstep(.8,1,hz)*.4*(.5+.5*Math.sin(a*7));return[r,g,b];});
/* (Nov 8, Bryce: "bring the detail up by 2x") the surfaces are painted at twice the size on PC, each with a normal map worked out
   from its own relief (seams, grain, cracks, pitting), so the light rakes across them instead of sliding off flat colour */
const TXW=coarse?256:512;
const spCv=W=>{const c=document.createElement('canvas');c.width=c.height=W;return[c,c.getContext('2d')];};
const texOf=(c,srgb)=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb!==false)t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;return t;};
// a normal map from a height canvas (bright = high)
function normOf(hc,k){const W=hc.width,src=hc.getContext('2d').getImageData(0,0,W,W).data,[c,g]=spCv(W),im=g.createImageData(W,W),h=(x,y)=>src[(((y+W)%W)*W+((x+W)%W))*4]/255;
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){const dx=(h(x+1,y)-h(x-1,y))*k,dy=(h(x,y+1)-h(x,y-1))*k,l=Math.hypot(dx,dy,1),o=(y*W+x)*4;im.data[o]=(-dx/l*.5+.5)*255;im.data[o+1]=(dy/l*.5+.5)*255;im.data[o+2]=(1/l*.5+.5)*255;im.data[o+3]=255;}
  g.putImageData(im,0,0);return texOf(c,false);}
function plankTex(){const W=TXW,s=W/256,[c,g]=spCv(W),[hc,hg]=spCv(W);hg.fillStyle='#808080';hg.fillRect(0,0,W,W);
  for(let i=0;i<8;i++){const y=i*32*s,base=[128+Math.random()*26,88+Math.random()*16,58+Math.random()*12];for(let x=0;x<W;x+=1){const v=Math.sin(x*.07/s+i*3)*8+Math.sin(x*.31/s+i)*4+Math.sin(x*1.3/s+i*5)*2;g.fillStyle=`rgb(${base[0]+v|0},${base[1]+v*.6|0},${base[2]+v*.4|0})`;g.fillRect(x,y,1,32*s);}
    // the grain: fine dark streaks along each plank
    for(let k=0;k<26*s;k++){const yy=y+Math.random()*32*s;g.fillStyle=`rgba(60,32,16,${R(.08,.22)})`;g.fillRect(Math.random()*W,yy,R(30,140)*s,R(.6,1.4));hg.fillStyle='rgba(100,100,100,.5)';hg.fillRect(Math.random()*W,yy,R(30,140)*s,1);}
    g.fillStyle='rgba(40,20,10,.6)';g.fillRect(0,y,W,1.5*s);hg.fillStyle='#202020';hg.fillRect(0,y,W,1.5*s);const cut=Math.random()*W;g.fillRect(cut,y,1.5*s,32*s);hg.fillRect(cut,y,1.5*s,32*s);}
  const t=texOf(c);t.userData={n:normOf(hc,2.2)};return t;}
function plasterTex(){const W=TXW,s=W/256,[c,g]=spCv(W),[hc,hg]=spCv(W);g.fillStyle='#e8e6e2';g.fillRect(0,0,W,W);hg.fillStyle='#909090';hg.fillRect(0,0,W,W);
  for(let i=0;i<1600*s*s;i++){const v=200+Math.random()*50|0,x=Math.random()*W,y=Math.random()*W;g.fillStyle=`rgba(${v},${v},${v-6},.25)`;g.fillRect(x,y,2,2);hg.fillStyle=`rgba(${v-40},${v-40},${v-40},.3)`;hg.fillRect(x,y,2,2);}
  // the panels: four to a tile, a fine shadow seam round each
  g.fillStyle='rgba(120,116,110,.5)';hg.fillStyle='#303030';for(const p of[0,W/2]){g.fillRect(0,p+W/2-2*s,W,2*s);g.fillRect(p+W/2-2*s,0,2*s,W);hg.fillRect(0,p+W/2-2*s,W,2*s);hg.fillRect(p+W/2-2*s,0,2*s,W);}
  // scorch and cracks
  for(let i=0;i<14;i++){g.strokeStyle='rgba(60,50,45,.35)';hg.strokeStyle='#404040';g.lineWidth=hg.lineWidth=s;g.beginPath();hg.beginPath();let x=Math.random()*W,y=Math.random()*W;g.moveTo(x,y);hg.moveTo(x,y);for(let k=0;k<7;k++){x+=(Math.random()-.5)*40*s;y+=(Math.random()-.5)*40*s;g.lineTo(x,y);hg.lineTo(x,y);}g.stroke();hg.stroke();}
  for(let i=0;i<5;i++){const x=Math.random()*W,y=Math.random()*W,r=R(20,60)*s,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(70,56,46,.22)');gr.addColorStop(1,'rgba(70,56,46,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
  const t=texOf(c);t.userData={n:normOf(hc,1.6)};return t;}
// brushed metal: long fine streaks, a few dents and scratches
function brushedTex(){const W=TXW,s=W/256,[c,g]=spCv(W),[hc,hg]=spCv(W);g.fillStyle='#b4b6b8';g.fillRect(0,0,W,W);hg.fillStyle='#808080';hg.fillRect(0,0,W,W);
  for(let i=0;i<900*s;i++){const v=150+Math.random()*90|0,y=Math.random()*W,l=R(20,200)*s;g.fillStyle=`rgba(${v},${v},${v+4},.35)`;g.fillRect(Math.random()*W,y,l,1);hg.fillStyle=`rgba(${v-30},${v-30},${v-30},.35)`;hg.fillRect(Math.random()*W,y,l,1);}
  for(let i=0;i<24;i++){g.strokeStyle='rgba(240,240,240,.35)';hg.strokeStyle='#505050';g.lineWidth=hg.lineWidth=.8;const x=Math.random()*W,y=Math.random()*W,a=R(0,6),l=R(8,40)*s;for(const q of[g,hg]){q.beginPath();q.moveTo(x,y);q.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);q.stroke();}}
  hg.fillStyle='#202020';g.fillStyle='rgba(60,60,64,.6)';g.fillRect(0,0,W,1.5*s);g.fillRect(0,0,1.5*s,W);hg.fillRect(0,0,W,1.5*s);hg.fillRect(0,0,1.5*s,W);
  const t=texOf(c);t.userData={n:normOf(hc,1.4)};return t;}
// concrete for the crushed car park: board-formed, water-stained, pitted
function concreteTex(){const W=TXW,s=W/256,[c,g]=spCv(W),[hc,hg]=spCv(W);g.fillStyle='#a8a49c';g.fillRect(0,0,W,W);hg.fillStyle='#808080';hg.fillRect(0,0,W,W);
  for(let i=0;i<3200*s*s;i++){const v=120+Math.random()*80|0,x=Math.random()*W,y=Math.random()*W,r=R(.6,2.2)*s;g.fillStyle=`rgba(${v},${v-2},${v-8},.3)`;g.fillRect(x,y,r,r);hg.fillStyle=`rgba(${v-20},${v-20},${v-20},.35)`;hg.fillRect(x,y,r,r);}
  for(let i=0;i<40*s;i++){const x=Math.random()*W,y=Math.random()*W,r=R(1,3)*s;hg.fillStyle='#303030';hg.beginPath();hg.arc(x,y,r,0,7);hg.fill();g.fillStyle='rgba(60,56,50,.5)';g.beginPath();g.arc(x,y,r,0,7);g.fill();}
  for(let y=0;y<W;y+=W/4){g.fillStyle='rgba(70,66,60,.35)';g.fillRect(0,y,W,1.2*s);hg.fillStyle='#505050';hg.fillRect(0,y,W,1.2*s);}
  // the water's stains running down from the top
  for(let i=0;i<10;i++){const x=Math.random()*W,w=R(6,26)*s,gr=g.createLinearGradient(0,0,0,W*R(.3,.9));gr.addColorStop(0,'rgba(50,44,36,.35)');gr.addColorStop(1,'rgba(50,44,36,0)');g.fillStyle=gr;g.fillRect(x,0,w,W);}
  const t=texOf(c);t.userData={n:normOf(hc,2)};return t;}
const plaster=plasterTex(),planks=plankTex(),brushed=brushedTex(),concT=concreteTex();
const NS=coarse?new THREE.Vector2(.6,.6):new THREE.Vector2(1,1);
const whiteMat=new THREE.MeshStandardMaterial({vertexColors:true,map:plaster,normalMap:plaster.userData.n,normalScale:NS,roughness:.6,metalness:.05,envMap:SP_ENV,envMapIntensity:.5});
const woodMat=new THREE.MeshStandardMaterial({vertexColors:true,map:planks,normalMap:planks.userData.n,normalScale:NS,roughness:.38,metalness:.05,envMap:SP_ENV,envMapIntensity:.8});
const metalMat=new THREE.MeshStandardMaterial({vertexColors:true,map:brushed,normalMap:brushed.userData.n,normalScale:NS,roughness:.3,metalness:.8,envMap:SP_ENV,envMapIntensity:1});
const concMat=new THREE.MeshStandardMaterial({vertexColors:true,map:concT,normalMap:concT.userData.n,normalScale:NS,roughness:.85,metalness:.02,envMap:SP_ENV,envMapIntensity:.25});
// grime: a soft dark wash at the foot of walls (and under the slab's edges), drawn as transparent strips, darkest at the bottom
const grimeT=(()=>{const [c,g]=spCv(64),gr=g.createLinearGradient(0,64,0,0);gr.addColorStop(0,'rgba(20,14,10,.75)');gr.addColorStop(.5,'rgba(20,14,10,.25)');gr.addColorStop(1,'rgba(20,14,10,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
// the car park's level signs (painted plates on the columns) and its puddles
const SP_SIGN=(()=>{const [c,g]=spCv(128);g.fillStyle='#e8e4dc';g.fillRect(0,0,128,128);g.fillStyle='#1c3a6a';g.fillRect(6,6,116,116);g.fillStyle='#f0ede6';g.font='700 64px ui-sans-serif,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('P1',64,56);
  g.font='700 22px ui-sans-serif,Arial,sans-serif';g.fillText('\u2190 EXIT',64,104);for(let i=0;i<300;i++){g.fillStyle=`rgba(40,30,20,${Math.random()*.3})`;g.fillRect(Math.random()*128,Math.random()*128,2,2);}
  return new THREE.MeshStandardMaterial({vertexColors:true,map:texOf(c),roughness:.5,metalness:.1,side:THREE.DoubleSide});})();
const puddleMat=new THREE.MeshStandardMaterial({vertexColors:true,color:C(0x1a1612),roughness:.04,metalness:.7,envMap:SP_ENV,envMapIntensity:1.4,transparent:true,opacity:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
// a shaft of light falling down a pit: an open box, bright at its top, fading out before the floor
const shaftT=(()=>{const [c,g]=spCv(64),gr=g.createLinearGradient(0,0,0,64);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.6,'rgba(255,255,255,.25)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const shaftMat=new THREE.MeshBasicMaterial({map:shaftT,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,side:THREE.DoubleSide,toneMapped:false});shaftMat.opacity=.07;
const grimeMat=new THREE.MeshBasicMaterial({map:grimeT,transparent:true,depthWrite:false,vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
// the city's white stone: big pale slabs, fine joints, a little warmth in some, soot on others
const stoneT=(()=>{const W=256,c=document.createElement('canvas');c.width=c.height=W;const g=c.getContext('2d');g.fillStyle='#d8d4cc';g.fillRect(0,0,W,W);
  for(let y=0;y<W;y+=64)for(let x=(y/64%2)*64;x<W+64;x+=128){const v=206+Math.random()*24|0;g.fillStyle=`rgb(${v},${v-3},${v-9})`;g.fillRect(x+1,y+1,126,62);}
  for(let i=0;i<2400;i++){const v=170+Math.random()*60|0;g.fillStyle=`rgba(${v},${v},${v-8},.18)`;g.fillRect(Math.random()*W,Math.random()*W,1.5,1.5);}
  g.fillStyle='rgba(90,84,76,.7)';for(let y=0;y<W;y+=64)g.fillRect(0,y,W,1.2);for(let y=0;y<W;y+=64)for(let x=(y/64%2)*64;x<W+64;x+=128)g.fillRect(x,y,1.2,64);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;return t;})(),stoneN=null;
const stoneMat2=new THREE.MeshStandardMaterial({vertexColors:true,map:stoneT,roughness:.62,metalness:.05,envMap:SP_ENV,envMapIntensity:.4});
const rustT=KIT.tex('metal020',true);
const burntMat=new THREE.MeshStandardMaterial({vertexColors:true,map:rustT,roughness:.8,metalness:.4});
const glassMat=new THREE.MeshStandardMaterial({color:C(0x8ab0c0),transparent:true,opacity:.18,roughness:.05,metalness:.9,envMap:SP_ENV,envMapIntensity:2,depthWrite:false,side:THREE.DoubleSide});
const plantMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:0,side:THREE.DoubleSide});
stoneMat=stoneMat2;
const K_WHITE=C(0xf0ede6),K_WHITE2=C(0xd8d4cc),K_GOLD=C(0xc8a050),K_DARK=C(0x2a2624),K_STONE=C(0xd8d2c4),K_STONE2=C(0xb8b0a0),K_SOOT=C(0x4a3e36);

/* ---------- drawing a half: in the half's own frame (west half as written; the twin a copy turned half way round) ---------- */
function drawHalf(){const G=new THREE.Group(),mgs=new Map(),mg=m=>{let b=mgs.get(m);if(!b){b=new Merger();mgs.set(m,b);}return b;};const {x0,x1,zN,zS,H,BASE}=SEG,L=x1-x0;
  const box=(mat,w,h,d,x,y,z,col,u,rx,ry,rz)=>mg(mat).add(boxUV(w,h,d,u||2),M(x,y,z,rx||0,ry||0,rz||0),col);
  /* the floor: the facade's inside face — white panels on an aluminium grid (the curtain wall's mullions, now underfoot), the window
     pits cut right through it; under the finish, the slab itself in raw concrete, which is the crushed level's ceiling.
     (Nov 8, Bryce: the pits and the stairs down "are not textured so it looks solid": the plaza's ground plane ran on under the whole
     tower 1 cm under the floor and closed every pit. The ground has holes now where the tower and the trenches are, and each pit is
     drawn as the hole it is: the slab's broken edge in concrete, rebar sticking out, the frame bent, light falling down it) */
  for(let k=0;k<NB;k++){const bx0=bayX(k),bx1=bayX(k+1),p=PITS[k];
    for(const [a,b,c,d] of[[bx0,bx1,zN,p.z0],[bx0,bx1,p.z1,zS],[bx0,p.x0,p.z0,p.z1],[p.x1,bx1,p.z0,p.z1]]){if(b-a<.05||d-c<.05)continue;
      box(whiteMat,b-a,.06,d-c,(a+b)/2,-.03,(c+d)/2,K_WHITE2,1.5);box(concMat,b-a,.34,d-c,(a+b)/2,-.23,(c+d)/2,C(0x8a8680),3);
      // the mullion grid across it, every 1.5 m each way (stopping at the piece's edges)
      for(let x=Math.ceil(a/1.5)*1.5;x<b-.05;x+=1.5)if(x>a+.05)box(metalMat,.07,.025,d-c,x,.005,(c+d)/2,C(0xa8acb0),1);
      for(let z=Math.ceil(c/1.5)*1.5;z<d-.05;z+=1.5)if(z>c+.05)box(metalMat,b-a,.025,.07,(a+b)/2,.005,z,C(0xa8acb0),1);}
    // the window frame round the pit (aluminium, bent in places), glass shards on its edge, the slab's broken lip and its rebar
    const pw=p.x1-p.x0,pd=p.z1-p.z0,pxm=(p.x0+p.x1)/2,pzm=(p.z0+p.z1)/2;
    for(const [w,d,x,z] of[[pw+.2,.12,pxm,p.z0],[pw+.2,.12,pxm,p.z1],[.12,pd,p.x0,pzm],[.12,pd,p.x1,pzm]])box(metalMat,w,.14,d,x,.05,z,C(0x9aa0a8),1);
    for(const [w,d,x,z] of[[pw+.3,.3,pxm,p.z0-.15],[pw+.3,.3,pxm,p.z1+.15],[.3,pd,p.x0-.15,pzm],[.3,pd,p.x1+.15,pzm]])box(metalMat,w,.012,d,x,.008,z,C(0x5a5e64),1);   // (the frame's dark gasket)
    for(let j=0;j<(coarse?5:9);j++)mg(glassMat).add(new THREE.PlaneGeometry(R(.3,.8),R(.2,.5)),M(R(p.x0,p.x1),R(.02,.4),j%2?p.z0+.05:p.z1-.05,R(-.5,.5),R(0,3),R(-.5,.5)),C(0xffffff));
    // the slab's edge round the hole: jagged concrete hanging under it, rebar ends bent into the opening
    const rim=[];for(let t=.15;t<pw;t+=.45)rim.push([p.x0+t,p.z0,0],[p.x0+t,p.z1,0]);for(let t=.15;t<pd;t+=.45)rim.push([p.x0,p.z0+t,1],[p.x1,p.z0+t,1]);
    for(const [x,z,ax] of rim){const i=(x*13+z*7)|0;if(hash(i,k)<.45)box(concMat,ax?.25:R(.3,.5),R(.1,.3),ax?R(.3,.5):.25,x,-.45-R(0,.1),z,C(0x7a766e),1,R(-.2,.2),R(0,3),R(-.2,.2));
      if(hash(i,k+9)<.5){const inX=ax?(x<pxm?1:-1):0,inZ=ax?0:(z<pzm?1:-1),l=R(.25,.6);mg(burntMat).add(new THREE.CylinderGeometry(.018,.018,l,5),M(x+inX*l/2,-.25+R(-.05,.05),z+inZ*l/2,inZ?Math.PI/2+R(-.4,.4):R(-.3,.3),0,inX?Math.PI/2+R(-.4,.4):0),C(0x5a4030));}}
    // the light falling down through it into the car park
    if(false)mg(shaftMat).add(   // (Nov 9: off; from inside the car park the shafts' sides read as hazy walls)
      new THREE.CylinderGeometry(.7071,.7071,1,4,1,true).rotateY(Math.PI/4).scale(pw*.75,-BASE,pd*.75),M(pxm,BASE/2,pzm),C(0xffb070));}
  // grime along the foot of every wall in the hall and the car park (a dark wash a half metre high)
  const grime=(ax,az,bx,bz,y,h,o)=>{const L=Math.hypot(bx-ax,bz-az);if(L<.1)return;mg(grimeMat).add(new THREE.PlaneGeometry(L,h).translate(0,h/2,0),M((ax+bx)/2+(o?o[0]:0),y,(az+bz)/2+(o?o[1]:0),0,Math.atan2(-(bz-az),bx-ax),0),C(0xffffff));};
  // the ceiling: the far facade's inside, its skylights open to the burning sky; the top's outer face (stone and gold bands) over it
  for(let k=0;k<NB;k++){const bx0=bayX(k),bx1=bayX(k+1),q=SKY[k];
    for(const [a,b,c,d] of[[bx0,bx1,zN,q.z0],[bx0,bx1,q.z1,zS],[bx0,q.x0,q.z0,q.z1],[q.x1,bx1,q.z0,q.z1]]){if(b-a<.05||d-c<.05)continue;box(whiteMat,b-a,.08,d-c,(a+b)/2,H+.04,(c+d)/2,K_WHITE,3);box(stoneMat2,b-a,.42,d-c,(a+b)/2,H+.29,(c+d)/2,K_STONE,4);}
    for(const [w,d,x,z] of[[q.x1-q.x0+.2,.14,(q.x0+q.x1)/2,q.z0],[q.x1-q.x0+.2,.14,(q.x0+q.x1)/2,q.z1],[.14,q.z1-q.z0,q.x0,(q.z0+q.z1)/2],[.14,q.z1-q.z0,q.x1,(q.z0+q.z1)/2]])box(metalMat,w,.6,d,x,H+.3,z,C(0x8a8e94),1);}
  // the top's gold bands (the old floor lines) across it at every partition
  for(let k=0;k<=NB;k++)box(metalMat,.35,.08,zS-zN,bayX(k),H+.52,(zN+zS)/2,K_GOLD,1);
  // the ceiling's mullion grid (the far facade's, seen from inside), like the floor's
  for(let k=0;k<NB;k++){const q=SKY[k],bx0=bayX(k),bx1=bayX(k+1);for(let x=bx0+.75;x<bx1;x+=1.5)if(x<q.x0-.1||x>q.x1+.1)box(metalMat,.07,.03,zS-zN-.6,x,H-.015,(zN+zS)/2,C(0x9a9ea4),1);}
  // the side walls: plaster inside, white stone outside, tall window slots (glass gone), a gold mullion each side; in the car park
  // under the floor the same walls are raw concrete
  for(const [side,z,o] of[['n',zN,-1],['s',zS,1]]){const W=SIDEWIN.filter(w=>w.side===side).sort((p,q)=>p.a0-q.a0);let cur=x0;
    const pane=(a,b,y0,y1)=>{if(b-a<.05||y1-y0<.05)return;box(whiteMat,b-a,y1-y0,.12,(a+b)/2,(y0+y1)/2,z-o*.2,K_WHITE,3);box(stoneMat2,b-a,y1-y0,.36,(a+b)/2,(y0+y1)/2,z+o*.05,K_STONE,4);
      if(y0<0){const ya=Math.min(y1,0);box(concMat,b-a,ya-y0,.05,(a+b)/2,(y0+ya)/2,z-o*.285,C(0x8a857c),3);grime(a,z-o*.315,b,z-o*.315,BASE,.7);}
      if(y1>.2&&y0<.2){box(woodMat,b-a,.14,.04,(a+b)/2,.07,z-o*.28,C(0x6a4a34),1);grime(a,z-o*.31,b,z-o*.31,0,.55);}};
    for(const w of W){pane(cur,w.a0,BASE,H);pane(w.a0,w.a1,w.y1,H);pane(w.a0,w.a1,BASE,0);for(const a of[w.a0,w.a1])box(metalMat,.14,w.y1,.5,a,w.y1/2,z,K_GOLD,1);
      box(stoneMat2,w.a1-w.a0+.3,.12,.62,(w.a0+w.a1)/2,.06,z,K_STONE2,1);box(metalMat,w.a1-w.a0,.1,.5,(w.a0+w.a1)/2,w.y1-.05,z,K_GOLD,1);cur=w.a1;}pane(cur,x1,BASE,H);
    // a gold band along the wall at the old floor line, and a lit strip under it (still on)
    for(let x=x0;x<x1;x+=SEG.BAY){const a=x+.2,b=x+SEG.BAY-.2;box(metalMat,b-a,.12,.06,(a+b)/2,H-1.2,z-o*.29,K_GOLD,1);mg(KIT.lampMat).add(boxUV(b-a-.4,.04,.03,1),M((a+b)/2,H-1.34,z-o*.3),C(0xffe0b0).multiplyScalar(1.2));}}
  // the partitions: wood (what was a floor) on the face toward the base end, white with its light fixtures (what was a ceiling) toward
  // the break; a dark slab between; the doorways' frames. (Nov 8) the old ceiling's vents, sprinklers and fallen tiles, cables hanging
  // from the fixtures, a skirting strip and grime at the foot of each face
  for(const Pt of PART){const pz=Pt.o.slice().sort((p,q)=>p[0]-q[0]);const edges=[zN,zS,...pz.flatMap(o=>[o[0],o[1]])].sort((a,b)=>a-b);
    const solid=(y,z,m)=>!pz.some(o=>z>o[0]-m&&z<o[1]+m&&y>o[2]-m&&y<o[3]+m);
    for(let i=0;i<edges.length-1;i++){const za=edges[i],zb=edges[i+1];if(zb-za<.05)continue;const zm=(za+zb)/2,ops=pz.filter(o=>o[0]<=zm&&o[1]>=zm).sort((a,b)=>a[2]-b[2]);let y=0;const pieces=[];
      for(const o of ops){if(o[2]>y)pieces.push([y,o[2]]);y=Math.max(y,o[3]);}if(y<H)pieces.push([y,H]);
      for(const [ya,yb] of pieces){const ym=(ya+yb)/2,hh=yb-ya;box(woodMat,.06,hh,zb-za,Pt.x-.2,ym,zm,C(0xffffff),2.4);box(whiteMat,.06,hh,zb-za,Pt.x+.2,ym,zm,K_WHITE,3);box(whiteMat,.34,hh,zb-za,Pt.x,ym,zm,C(0x3a3634),2);
        if(ya===0){for(const sd of[-1,1]){box(metalMat,.03,.12,zb-za,Pt.x+sd*.245,.06,zm,sd<0?C(0x5a4030):C(0xc8c8c4),1);grime(Pt.x+sd*.27,za,Pt.x+sd*.27,zb,0,.6);}}}}
    for(const o of pz){for(const z of[o[0],o[1]])box(metalMat,.5,o[3]-o[2],.1,Pt.x,(o[2]+o[3])/2,z,C(0xb8bcc0),1);box(metalMat,.5,.1,o[1]-o[0],Pt.x,o[3],(o[0]+o[1])/2,C(0xb8bcc0),1);
      // the doorway's reveal: a bevelled trim each side, the threshold plate
      for(const sd of[-1,1])for(const z of[o[0],o[1]])box(metalMat,.05,o[3]-o[2],.16,Pt.x+sd*.26,(o[2]+o[3])/2,z+(z===o[0]?-.06:.06),K_GOLD,1);
      if(o[2]===0)box(metalMat,.62,.02,o[1]-o[0],Pt.x,.01,(o[0]+o[1])/2,C(0x8a8e94),1);}
    // the old ceiling's lights: round fixtures and a long strip, still lit, now on the wall
    for(const [y,z] of[[2,-8.5],[4.5,-5],[7,-1.5],[6.5,-8],[2.2,-2.6],[7.6,-5.2]]){if(!solid(y,z,.6))continue;mg(KIT.lampMat).add(new THREE.CircleGeometry(.32,coarse?16:24).rotateY(Math.PI/2),M(Pt.x+.24,y,z),C(0xfff0d8).multiplyScalar(1.6));
      mg(metalMat).add(new THREE.CylinderGeometry(.4,.4,.05,coarse?16:24),M(Pt.x+.235,y,z,0,0,Math.PI/2),C(0xd8d8d4));
      // a cable hanging from it, now that down is along the wall
      if(hash(Pt.x|0,y*10|0)<.5){const l=R(.5,1.6);mg(burntMat).add(new THREE.CylinderGeometry(.015,.015,l,5),M(Pt.x+.32,y-.32-l/2,z+R(-.1,.1),R(-.1,.1),0,R(-.08,.08)),C(0x2a2422));}}
    if(solid(4.3,-5,.1)&&!pz.some(o=>o[2]<4.4&&o[3]>4.2))mg(KIT.lampMat).add(boxUV(.03,.08,zS-zN-2,1),M(Pt.x+.24,4.3,(zN+zS)/2),C(0xffe0b0).multiplyScalar(1.3));
    // vents and sprinkler heads on the white face; outlets and a fire-hose cabinet on the wood face
    for(const [y,z] of[[3.2,-9.6],[5.6,-2.4],[1.4,-6.8],[8.2,-4]]){if(!solid(y,z,.5))continue;box(metalMat,.04,.35,.7,Pt.x+.24,y,z,C(0xc0c4c8),1);for(let j=-2;j<=2;j++)box(metalMat,.05,.03,.62,Pt.x+.25,y+j*.06,z,C(0x3a3c40),1);}
    for(const [y,z] of[[3.6,-7],[6,-9.8],[1.2,-3.6],[7.2,-.6],[5,-6.6]]){if(!solid(y,z,.3))continue;mg(metalMat).add(new THREE.CylinderGeometry(.03,.05,.12,8),M(Pt.x+.29,y,z,0,0,Math.PI/2),C(0xd0c8b8));}
    for(const [y,z] of[[.35,-9.2],[.35,-2]]){if(!solid(y,z,.3))continue;box(whiteMat,.03,.12,.08,Pt.x-.24,y,z,C(0xe8e8e4),1);}
    if(solid(1.2,-1.4,.7))box(metalMat,.18,.8,.6,Pt.x-.32,1.2,-1.4,C(0xa83a2a),1);
    // tiles of the old ceiling, fallen to what's now the floor
    for(let j=0;j<(coarse?2:4);j++){const z=R(zN+.6,zS-.6);if(!solid(.3,z,.3))continue;box(whiteMat,.6,.025,.6,Pt.x+R(.5,1.6),.013,z,K_WHITE2,1,R(-.08,.08),R(0,3),R(-.08,.08));}}
  /* the crushed level: concrete everywhere; the floor slab's underside its ceiling, with its beams, lights, pipes and conduit; the
     columns with their hazard bands and level signs; parking lines and wheel stops; wrecked cars, puddles, fallen chunks of ceiling.
     (Nov 8, Bryce: "the map is glitched under the ground": the car park had no wall drawn at the break end, nor the trench's sides, so
     you looked out under the plaza at the sky's glowing underside. Both are concrete walls now, and the plaza's ground is solid) */
  box(concMat,L,.2,zS-zN,(x0+x1)/2,BASE-.1,(zN+zS)/2,C(0x6a665e),4);
  box(concMat,.6,-BASE-.07,zS-zN,x0,(BASE-.07)/2,(zN+zS)/2,C(0x7a756c),3);grime(x0+.32,zN,x0+.32,zS,BASE,.7);
  for(const [za,zb] of[[zN,-7.4],[-4.6,zS]]){box(concMat,.6,-BASE-.07,zb-za,x1,(BASE-.07)/2,(za+zb)/2,C(0x7a756c),3);grime(x1-.32,za,x1-.32,zb,BASE,.7);}
  // the trench at the break: its two sides, a kerb along their tops
  for(const z of[TRENCH[2],TRENCH[3]]){const tl=TRENCH[1]-TRENCH[0],tx=(TRENCH[0]+TRENCH[1])/2;box(concMat,tl,-BASE+.3,.3,tx,(BASE-.3)/2,z,C(0x7a756c),3);box(stoneMat2,tl,.14,.42,tx,.04,z,K_STONE2,1);
    grime(TRENCH[0],z+(z<-6?.16:-.16),TRENCH[1],z+(z<-6?.16:-.16),BASE,.7);}
  // the beams under the slab: one down the middle over the columns, one across at every old storey
  for(let k=0;k<NB;k++){const bx0=bayX(k),bx1=bayX(k+1),p=PITS[k],cut=p.z0<-5.3&&p.z1>-4.7;const segs=cut?[[bx0,p.x0-.15],[p.x1+.15,bx1]]:[[bx0,bx1]];
    for(const [a,b] of segs)box(concMat,b-a,.42,.6,(a+b)/2,-.61,-5,C(0x8a857c),2);}
  for(let k=1;k<NB;k++){box(concMat,.5,.42,zS-zN,bayX(k),-.61,(zN+zS)/2,C(0x8a857c),2);}
  // the columns: concrete, a hazard band at the foot, the level's sign, a gold collar where they meet the slab
  const signMat=SP_SIGN;
  for(let k=1;k<NB;k++){const cx=bayX(k);mg(concMat).add(new THREE.CylinderGeometry(.45,.45,-BASE,coarse?14:24),M(cx,BASE/2,-5),C(0x8a857c));mg(metalMat).add(boxUV(.94,.15,.94,1),M(cx,-.3,-5),K_GOLD);
    for(let j=0;j<4;j++)mg(concMat).add(new THREE.CylinderGeometry(.462,.462,.15,coarse?14:24,1,true),M(cx,BASE+.25+j*.15,-5),j%2?C(0x1a1816):C(0xd8a830));
    for(const sd of[-1,1])mg(signMat).add(new THREE.PlaneGeometry(.55,.55),M(cx+sd*.47,BASE+1.9,-5,0,sd*Math.PI/2,0),C(0xffffff));}
  // lights: fluorescent tubes in housings under the slab (a few dead), pipes and conduit along the walls under the ceiling
  for(let k=0;k<NB;k++){const p=PITS[k];for(const z of[-8.6,-1.4]){const x=bayX(k)+SEG.BAY/2;if(z>p.z0-.4&&z<p.z1+.4&&x>p.x0-1&&x<p.x1+1)continue;
      box(metalMat,1.5,.08,.24,x,-.44,z,C(0x9a9ea4),1);const dead=hash(k,z|0)<.25;mg(dead?metalMat:KIT.lampMat).add(boxUV(1.36,.05,.1,1),M(x,-.5,z),dead?C(0x3a3a3a):C(0xfff2dc).multiplyScalar(1.5));}}
  for(const [zz,r,y] of[[zN+.55,.11,-.75],[zN+.85,.06,-.62],[zS-.55,.09,-.72]]){mg(metalMat).add(new THREE.CylinderGeometry(r,r,L,coarse?8:12).rotateZ(Math.PI/2),M((x0+x1)/2,y,zz),zz<-5?C(0xa83a2a):C(0x8a8e94));
    for(let x=x0+1;x<x1;x+=2.3)box(metalMat,.06,-y-.4+r,.06,x,(y-.4)/2+r/2,zz,K_DARK,1);}
  // parking lines and wheel stops along both walls, an arrow down the aisle
  for(let x=x0+1.2;x<x1-.5;x+=2.5)for(const [zc,sd] of[[zN+2.4,-1],[zS-2.4,1]]){box(concMat,.1,.012,4,x,BASE+.006,zc,C(0xd8b040),1);if(hash(x|0,sd+3)<.7)box(concMat,1.4,.12,.18,x+1.25,BASE+.06,zc+sd*1.4,C(0x9a958a),1,0,R(-.1,.1),0);}
  for(let x=x0+3;x<x1-2;x+=9){box(concMat,1.4,.012,.12,x,BASE+.006,-5.9,C(0xe8e4dc),1);box(concMat,.12,.012,.6,x+.7,BASE+.006,-5.9,C(0xe8e4dc),1,0,.7,0);}
  // puddles (dark, glossy) where the water got in down the pits, chunks of the ceiling come down, a tyre or two
  for(let k=0;k<NB;k++){const p=PITS[k];mg(puddleMat).add(new THREE.CircleGeometry(R(.9,1.6),coarse?14:22).rotateX(-Math.PI/2).scale(1,1,R(.5,.9)),M((p.x0+p.x1)/2+R(-.6,.6),BASE+.012,(p.z0+p.z1)/2+R(-.8,.8),0,R(0,3),0),C(0xffffff));
    if(p.ramp)continue;for(let j=0;j<(coarse?3:6);j++)box(concMat,R(.3,.9),R(.15,.4),R(.3,.8),R(p.x0,p.x1),BASE+.1,R(p.z0,p.z1),C(0x8a857c),1,R(-.3,.3),R(0,3),R(-.3,.3));}
  for(const [x,z] of[[-47,-9.6],[-30,-.4],[-20.5,-9.8],[-8,-.2],[-35.5,-2.5]]){mg(burntMat).add(new THREE.TorusGeometry(.32,.12,8,coarse?12:18),M(x,BASE+.12,z,Math.PI/2,0,0),C(0x1a1816));}
  // the wrecked cars (solid; see buildHalf), crushed under the slab: body, cab, wheels, broken glass
  for(const [x,z,ry] of CARPARK_CARS){box(burntMat,4.2,1.1,1.8,x,BASE+.6,z,C(0x6a5a50),1,0,ry,0);box(burntMat,2.2,.62,1.6,x-.3*Math.cos(ry),BASE+1.42,z+.3*Math.sin(ry),C(0x3a3430),1,0,ry,0);
    for(const [a,b] of[[1.3,.85],[-1.3,.85],[1.3,-.85],[-1.3,-.85]])mg(burntMat).add(new THREE.CylinderGeometry(.34,.34,.24,coarse?10:16).rotateX(Math.PI/2),M(x+a*Math.cos(ry)+b*Math.sin(ry),BASE+.34,z-a*Math.sin(ry)+b*Math.cos(ry),0,ry,0),C(0x1a1816));
    for(let j=0;j<4;j++)mg(glassMat).add(new THREE.PlaneGeometry(R(.1,.3),R(.1,.3)).rotateX(-Math.PI/2),M(x+R(-2.4,2.4),BASE+.02,z+R(-1.4,1.4),0,R(0,3),0),C(0xffffff));}
  // the slid furniture: desks on their sides, sofas, planters (soil spilled, plants growing sideways now), filing cabinets, chairs,
  // monitors, shelving, a floor lamp, glass from the old office partitions (Nov 8: twice as many)
  for(let k=0;k<NB;k++){const bx=bayX(k)+SEG.BAY/2,p=PITS[k],free=(x,z)=>!(x>p.x0-.6&&x<p.x1+.6&&z>p.z0-.6&&z<p.z1+.6);
    const items=[['desk',bx-1.2,zN+1.4],['sofa',bx+.6,zS-1.3],['plant',bx+1.5,zN+1],['cab',bx-1.6,zS-.8],['desk',bx+1,-5.2],
      ['chair',bx-.4,zN+2.4],['chair',bx+1.7,-4.2],['mon',bx-1.4,-6.6],['shelf',bx-1.9,-3.4],['tall',bx+1.7,zS-.7],['lamp',bx-.6,zS-.6],['pane',bx+.2,-7.6],['plant',bx-1.8,-8.2]];
    for(const [kind,x,z] of items){if(!free(x,z)||hash(k*7+1,kind.length+(z*3|0))<.25)continue;const ry=hash(k,z|0)*1.2-.6;
      if(kind==='desk'){box(woodMat,1.8,.8,.08,x,.4,z,C(0xffffff),1.6,0,ry,0);box(metalMat,.08,.75,.7,x-.8,.38,z+.35,C(0xb0b4b8),1,0,ry,0);box(metalMat,.08,.75,.7,x+.8,.38,z+.35,C(0xb0b4b8),1,0,ry,0);box(woodMat,1.8,.05,.7,x,.79,z+.35,C(0xe0d0c0),1,0,ry,0);}
      else if(kind==='sofa'){box(whiteMat,2,.55,.9,x,.28,z,C(0xc89a6a),1,0,ry,0);box(whiteMat,2,.85,.25,x,.42,z+.45,C(0xb88a5a),1,0,ry,0);for(const sd of[-1,1])box(whiteMat,.22,.7,.9,x+sd*.99,.35,z,C(0xb08050),1,0,ry,0);box(whiteMat,.55,.18,.55,x+R(-.5,.5),.09,z-.9,C(0xd8b080),1,0,R(0,3),.2);}
      else if(kind==='plant'){mg(whiteMat).add(new THREE.CylinderGeometry(.42,.34,.9,coarse?14:22),M(x,.45,z,0,0,Math.PI/2),K_WHITE);mg(burntMat).add(new THREE.CircleGeometry(.6,10).rotateX(-Math.PI/2),M(x+.7,.012,z),C(0x2a1a10));
        for(let j=0;j<(coarse?6:12);j++)mg(plantMat).add(new THREE.PlaneGeometry(.18,1.1).translate(0,.55,0),M(x+.5,.45+R(-.2,.2),z+R(-.3,.3),R(-.5,.5),R(0,3),-Math.PI/2+R(-.4,.4)),C(hash(j,k)<.5?0x4a7a3a:0x5a8a44));}
      else if(kind==='tall'){mg(whiteMat).add(new THREE.CylinderGeometry(.3,.25,.7,coarse?12:20),M(x,.35,z),K_WHITE);for(let j=0;j<(coarse?7:14);j++)mg(plantMat).add(new THREE.PlaneGeometry(.12,R(.8,1.5)).translate(0,.6,0),M(x+R(-.1,.1),.6,z+R(-.1,.1),R(-.4,.4),R(0,3),R(-.4,.4)),C(0x4a7a3a));}
      else if(kind==='chair'){box(metalMat,.5,.06,.5,x,.45,z,C(0x3a3a3c),1,0,ry,0);box(whiteMat,.5,.55,.06,x,.72,z+.25,C(0x5a5a60),1,0,ry,0);mg(metalMat).add(new THREE.CylinderGeometry(.03,.03,.42,6),M(x,.22,z),C(0x8a8e94));
        if(hash(k,3)<.5)box(metalMat,.5,.06,.5,x+.6,.25,z+.3,C(0x3a3a3c),1,1.3,ry,0);}
      else if(kind==='mon'){box(metalMat,.62,.4,.04,x,.22,z,C(0x2a2a2e),1,-1.3,ry,0);mg(glassMat).add(new THREE.PlaneGeometry(.55,.33).rotateX(-Math.PI/2),M(x,.26,z,0,ry,0),C(0xffffff));}
      else if(kind==='shelf'){box(woodMat,1.4,.35,2,x,.18,z,C(0xd0b8a0),1,0,ry,0);for(let j=0;j<5;j++)box(whiteMat,R(.2,.3),R(.04,.08),R(.15,.25),x+R(-.9,.9),.03,z+R(-1.2,1.2),C(hash(j,k)<.5?0x8a3a2a:0x2a4a6a),1,0,R(0,3),0);}
      else if(kind==='lamp'){mg(metalMat).add(new THREE.CylinderGeometry(.02,.02,1.5,6),M(x+.75,.05,z,0,0,Math.PI/2),C(0xc8a050));mg(KIT.lampMat).add(new THREE.SphereGeometry(.16,10,8),M(x+1.55,.16,z),C(0xffe0b0).multiplyScalar(1.4));}
      else if(kind==='pane'){mg(glassMat).add(new THREE.PlaneGeometry(1.6,1.1).rotateX(-Math.PI/2),M(x,.03,z,0,ry,0),C(0xffffff));box(metalMat,1.7,.05,.05,x,.03,z+.55,C(0xa8acb0),1,0,ry,0);}
      else{box(metalMat,.5,1.3,.6,x,.65,z,C(0x8a8e94),1,0,ry,.4);}}
    // papers everywhere
    for(let j=0;j<(coarse?8:16);j++){const x=bayX(k)+R(.2,SEG.BAY-.2),z=R(zN+.3,zS-.3);if(!free(x,z))continue;mg(plantMat).add(new THREE.PlaneGeometry(.22,.3).rotateX(-Math.PI/2),M(x,.02,z,0,R(0,6),0),C(0xe8e4dc));}}
  // the end at the base: the broken stump's jagged edge round the gap; and at the break, the torn edge all round the opening
  for(const xe of[x0,x1])for(let j=0;j<16;j++){const t=j/15,on=xe===x1||t<.25||t>.6;if(!on&&j%3)continue;const z=lerp(zN,zS,t),y=(j%2?H:0)+R(-.6,.6);box(stoneMat2,R(.6,1.4),R(.6,1.6),R(.8,1.6),xe+R(-.6,.6),y,z,K_STONE2,2,R(-.4,.4),R(0,3),R(-.4,.4));}
  box(stoneMat2,.6,H-5.2,6.4,x0,(H+5.2)/2,-5.4,K_STONE,4);
  for(const [mat,b] of mgs){const m=new THREE.Mesh(b.build(),mat),fx=mat===shaftMat||mat===grimeMat||mat===puddleMat;m.castShadow=mat!==KIT.lampMat&&mat!==glassMat&&!fx;m.receiveShadow=!fx||mat===puddleMat;m.userData.dyn=1;if(mat===glassMat)m.renderOrder=2;if(mat===shaftMat)m.renderOrder=3;if(mat===grimeMat||mat===puddleMat)m.renderOrder=1;G.add(m);}
  return G;}
{const A=drawHalf();A.userData.dyn=1;scene.add(A);const B=A.clone();B.rotation.y=Math.PI;B.userData.dyn=1;scene.add(B);}
// the ramps (rubble heaped up onto the top; the slopes out of the pits and the crushed level), drawn as broken slabs and stone
for(const R0 of KIT.PAIRS){const ry=Math.atan2(-R0.uz,R0.ux),n=Math.max(4,Math.round(R0.L/.9));
  if(R0.kind){// (Oct 31) the arcade's stairs: stone treads on a solid stringer, gold rails; the sky-bridge's span: a deck slab with its parapets
    const mx=R0.P0[0]+R0.ux*R0.L/2,mz=R0.P0[1]+R0.uz*R0.L/2,pitch=Math.atan2(R0.yB-R0.yA,R0.L),hl=Math.hypot(R0.L,R0.yB-R0.yA),ym=(R0.yA+R0.yB)/2;
    if(R0.kind==='stair'){const m=Math.max(3,Math.round((R0.yB-R0.yA)/.22));for(let k=0;k<m;k++){const a=(k+.5)/m*R0.L,y=R0.hAt(a);KIT.mg(stoneMat2).add(boxUV(R0.L/m+.04,.12,R0.w,1),M(R0.P0[0]+R0.ux*a,y-.06,R0.P0[1]+R0.uz*a,0,ry,0),K_STONE);
        KIT.mg(stoneMat2).add(boxUV(R0.L/m+.04,Math.max(.1,y),.3,1),M(R0.P0[0]+R0.ux*a,y/2,R0.P0[1]+R0.uz*a,0,ry,0).multiply(M(0,0,0)),K_STONE2);}
      KIT.mg(stoneMat2).add(boxUV(hl,.4,R0.w,2),M(mx,ym-.32,mz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_STONE2);}
    /* (Nov 8, Bryce: "the stairs down to the basements are not textured so it looks solid") the ways down into the car park, the two
       pits' and the trench's at the break, are real stairs now: concrete treads on a solid flight, worn gold nosings, chunks of the
       slab broken off along their sides, rebar; the trench's with its rails */
    else if(R0.kind==='pit'||R0.kind==='trench'){const m=Math.max(4,Math.round((R0.yB-R0.yA)/.2)),g0=Math.min(R0.yA,R0.yB);
      for(let k=0;k<m;k++){const a=(k+.5)/m*R0.L,top=R0.hAt((k+1)/m*R0.L)+.03,x=R0.P0[0]+R0.ux*a,z=R0.P0[1]+R0.uz*a,c=hash(k,R0.w*10|0)<.5?C(0x9a958c):C(0x8a857c);
        KIT.mg(concMat).add(boxUV(R0.L/m+.02,top-g0,R0.w,1),M(x,(top+g0)/2,z,0,ry,0),c);
        const xn=R0.P0[0]+R0.ux*(k+1)/m*R0.L,zn=R0.P0[1]+R0.uz*(k+1)/m*R0.L;KIT.mg(metalMat).add(boxUV(.06,.03,R0.w-.1,1),M(xn-R0.ux*.04,top+.012,zn-R0.uz*.04,0,ry,0),C(0xb89a58));
        if(hash(k,7)<.35)KIT.mg(concMat).add(boxUV(R(.2,.4),R(.08,.18),R(.2,.4),1),M(x+R0.nx*R(-.6,.6),top+.06,z+R0.nz*R(-.6,.6),R(-.3,.3),R(0,3),R(-.3,.3)),C(0x8a857c));}
      // the flight's sides: its stringer in grimy concrete, a few broken chunks and rebar standing out of it
      for(const sd of[-1,1]){const ox=R0.nx*sd*(R0.w/2+.06),oz=R0.nz*sd*(R0.w/2+.06);KIT.mg(concMat).add(boxUV(hl,.3,.12,1),M(mx+ox,ym-.1,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),C(0x6a665e));
        for(let k=0;k<3;k++){const a=R(.5,R0.L-.5);KIT.mg(burntMat).add(new THREE.CylinderGeometry(.016,.016,R(.3,.7),5),M(R0.P0[0]+R0.ux*a+ox*1.05,R0.hAt(a)+.1,R0.P0[1]+R0.uz*a+oz*1.05,R(-.5,.5),0,R(-.5,.5)),C(0x5a4030));}}
      if(R0.kind==='pit'){continue;}}
    else{KIT.mg(stoneMat2).add(boxUV(hl,.5,R0.w+.3,3),M(mx,ym-.27,mz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_STONE);KIT.mg(whiteMat).add(boxUV(hl,.04,R0.w,3),M(mx,ym+.01,mz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_WHITE2);
      for(let k=0;k<5;k++){const a=R(1,R0.L-1);KIT.mg(stoneMat2).add(boxUV(R(.5,1.2),R(.4,.9),R(.5,1),1),M(R0.P0[0]+R0.ux*a+R0.nx*R(-1,1),R0.hAt(a)/2,R0.P0[1]+R0.uz*a+R0.nz*R(-1,1)*2.5,R(0,1),R(0,3),R(0,1)),K_STONE2);}}
    for(const sd of[-1,1]){const ox=R0.nx*sd*(R0.w/2-.05),oz=R0.nz*sd*(R0.w/2-.05);KIT.mg(metalMat).add(boxUV(hl,.06,.06,1),M(mx+ox,ym+1.02,mz+oz,0,ry,0).multiply(M(0,0,0,0,0,pitch)),K_GOLD);
      for(let k=0;k<=Math.floor(R0.L/1.6);k++){const a=Math.min(R0.L,k*1.6);KIT.mg(metalMat).add(boxUV(.06,1.04,.06,1),M(R0.P0[0]+R0.ux*a+ox,R0.hAt(a)+.52,R0.P0[1]+R0.uz*a+oz),K_DARK);}}
    continue;}
  for(let k=0;k<n;k++){const a=(k+.5)/n*R0.L,x=R0.P0[0]+R0.ux*a,z=R0.P0[1]+R0.uz*a,y=R0.hAt(a),g=Math.max(CITY.ground(x,z),R0.yA<R0.yB?R0.yA:R0.yB);
    KIT.mg(stoneMat2).add(boxUV(R0.L/n+.25,Math.max(.4,y-g+.3),R0.w+R(0,.6),2),M(x,(y+g)/2-.12,z,R(-.06,.06),ry+R(-.08,.08),R(-.08,.08)),hash(k,R0.w*10|0)<.5?K_STONE:K_STONE2);}
  for(let k=0;k<R0.L*1.4;k++){const a=R(0,R0.L),b=(rng()<.5?-1:1)*(R0.w/2+R(.2,1.2)),x=R0.P0[0]+R0.ux*a+R0.nx*b,z=R0.P0[1]+R0.uz*a+R0.nz*b,y=R0.hAt(a);
    KIT.mg(stoneMat2).add(boxUV(R(.4,1.2),R(.3,.9),R(.4,1.1),1),M(x,y-R(.2,.6),z,R(0,1),R(0,3),R(0,1)),K_STONE2);}}
// the rubble blocks, the cars, the pillars, the plaza's paving
for(const Rb of RUBBLE)KIT.mg(stoneMat2).add(boxUV(Rb.l,Rb.h+.2,Rb.w,2),M(Rb.x,Rb.h/2-.1,Rb.z,0,Rb.ry,0),hash(Rb.x|0,Rb.z|0)<.5?K_STONE:K_SOOT);
twin(s=>{for(const [x,z,ry] of CARS){const X=x*s,Z=z*s;KIT.mg(burntMat).add(boxUV(4.6,1,2,1),M(X,.55,Z,0,ry,0),C(0x5a4a44));KIT.mg(burntMat).add(boxUV(2.4,.7,1.8,1),M(X-.3*Math.cos(ry),1.35,Z+.3*Math.sin(ry),0,ry,0),C(0x2a2422));}});
for(const o of OBST)if(o.r>.6&&o.h>4)KIT.mg(stoneMat2).add(new THREE.CylinderGeometry(o.r,o.r*1.05,o.h,14),M(o.x,o.h/2,o.z),K_STONE),KIT.mg(metalMat).add(new THREE.CylinderGeometry(o.r*1.08,o.r*1.08,.3,14),M(o.x,o.h-.4,o.z),K_GOLD);
/* the plaza's ground (Nov 8): a grid of white stone, 2 m cells over the play area, with holes cut where the tower's halves and the
   trenches at the breaks go down to the car park (it used to be one plane right across, 1 cm under the hall's floor, which closed
   every pit). Its colour varies cell to cell and darkens round the fires and the wrecks */
const inHole=(x,z)=>inSeg(x,z)||inTrench(x,z);
const holeD=(x,z)=>{let d=1e9;for(const s of[1,-1]){const [a,b,c,e]=[SEG.x0*s,SEG.x1*s,SEG.zN*s,SEG.zS*s],x0=Math.min(a,b),x1=Math.max(a,b),z0=Math.min(c,e),z1=Math.max(c,e);d=Math.min(d,Math.hypot(Math.max(x0-x,0,x-x1),Math.max(z0-z,0,z-z1)));
  const t0=Math.min(TRENCH[0]*s,TRENCH[1]*s),t1=Math.max(TRENCH[0]*s,TRENCH[1]*s),u0=Math.min(TRENCH[2]*s,TRENCH[3]*s),u1=Math.max(TRENCH[2]*s,TRENCH[3]*s);d=Math.min(d,Math.hypot(Math.max(t0-x,0,x-t1),Math.max(u0-z,0,z-u1)));}return d;};
const SOOT=[[-24,-22],[-8,22],[-45,-13],[-36,22],[2,-23],[-56,20],[-34,-34],[-16,48],[-58,34],[-44,-50],...CARS.map(c=>[c[0],c[1]])].flatMap(([x,z])=>[[x,z],[-x,-z]]);
stoneMat2.normalMap=normOf(stoneT.image,1.6);stoneMat2.normalScale=NS;
{const GSZ=coarse?4:2,xs=new Set([-100,100]),zs=new Set([-100,100]);for(let x=-64;x<=64;x+=GSZ)xs.add(x);for(let z=-54;z<=54;z+=GSZ)zs.add(z);
 for(const s of[1,-1]){for(const v of[SEG.x0,SEG.x1,TRENCH[0],TRENCH[1]])xs.add(v*s);for(const v of[SEG.zN,SEG.zS,TRENCH[2],TRENCH[3]])zs.add(v*s);}
 const X=[...xs].sort((a,b)=>a-b),Z=[...zs].sort((a,b)=>a-b),pos=[],uv=[],col=[],nrm=[];
 const colAt=(x,z)=>{let v=.82+.06*Math.sin(x*.37+z*.11)*Math.sin(z*.29-x*.07)+.05*(hash(Math.floor(x/2),Math.floor(z/2))-.5);for(const [fx,fz] of SOOT){const d=Math.hypot(x-fx,z-fz);if(d<6)v*=.45+.55*sstep(1,6,d);}return v;};
 for(let i=0;i<X.length-1;i++)for(let j=0;j<Z.length-1;j++){const a=X[i],b=X[i+1],c=Z[j],d=Z[j+1];if(inHole((a+b)/2,(c+d)/2))continue;
   for(const [x,z] of[[a,c],[a,d],[b,c],[b,c],[a,d],[b,d]]){pos.push(x,0,z);nrm.push(0,1,0);uv.push(x/5,-z/5);const v=colAt(x,z);col.push(v,v*.98,v*.95);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:stoneT,normalMap:stoneMat2.normalMap,normalScale:NS,roughness:.6,metalness:.05,envMap:SP_ENV,envMapIntensity:.35}));m.position.y=-.01;m.receiveShadow=true;m.userData.dyn=1;scene.add(m);
 // soot and scorch: dark patches round the fires and the cars (never reaching over the hall or a trench); scattered chips of stone
 for(let k=0;k<(coarse?46:92);k++){const x=R(-60,60),z=R(-50,50),r=R(1.5,4);if(holeD(x,z)<r+.3)continue;KIT.mg(KIT.lampMat).add(new THREE.CircleGeometry(r,coarse?14:22).rotateX(-Math.PI/2),M(x,.015,z),C(0x0c0806));}
 for(let k=0;k<(coarse?120:320);k++){const x=R(-61,61),z=R(-51,51);if(holeD(x,z)<.6)continue;KIT.mg(stoneMat2).add(boxUV(R(.1,.45),R(.05,.18),R(.1,.4),1),M(x,.03,z,R(-.3,.3),R(0,3),R(-.3,.3)),hash(k,5)<.5?K_STONE:K_STONE2);}}
// the bases: rings of the side's light, a barricade arc
for(const B of GS.BASES){const TC=C(GS.TEAMS[B.team].c).multiplyScalar(2.2);KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(B.r-.3,B.r,48).rotateX(-Math.PI/2),M(B.x,.03,B.z),TC);
  KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(2.4,2.8,3).rotateX(-Math.PI/2),M(B.x,.04,B.z,0,B.fx>0?-Math.PI/2:Math.PI/2,0),TC);}

/* ---------- the wider plaza, drawn (west side's pieces as written; the twin a copy turned half way round) ---------- */
function drawWide(){const G=new THREE.Group(),mgs=new Map(),mg=m=>{let b=mgs.get(m);if(!b){b=new Merger();mgs.set(m,b);}return b;};
  const box=(mat,w,h,d,x,y,z,col,u,rx,ry,rz)=>mg(mat).add(boxUV(w,h,d,u||2),M(x,y,z,rx||0,ry||0,rz||0),col);
  // the arcade: white stone columns with gold collars, the roof slab with a gold fascia, shopfronts of glass and dark wood inside,
  // plaster back wall with its two doorways, warm strips under the roof
  {const {x0,x1,zb,zf,H,T}=ARC,L=x1-x0,zm=(zb+zf)/2;
   box(stoneMat2,L+.6,T,zf-zb+.8,(x0+x1)/2,H+T/2,zm+.1,K_STONE,5);box(metalMat,L+.6,.22,.12,(x0+x1)/2,H+T*.5,zf+.5,K_GOLD,1);
   box(whiteMat,L+.6,.08,zf-zb,(x0+x1)/2,H-.04,zm,K_WHITE,4);
   for(let x=x0+2;x<x1;x+=4){mg(stoneMat2).add(new THREE.CylinderGeometry(.4,.46,H,14),M(x,H/2,zf-.4),K_STONE);mg(metalMat).add(new THREE.CylinderGeometry(.5,.5,.25,14),M(x,H-.3,zf-.4),K_GOLD);mg(stoneMat2).add(new THREE.CylinderGeometry(.55,.6,.3,14),M(x,.15,zf-.4),K_STONE2);}
   for(const [a,b] of[[x0,-40],[-37.6,-26],[-23.6,x1]]){box(whiteMat,b-a,H,.12,(a+b)/2,H/2,zb+.26,K_WHITE,3);box(stoneMat2,b-a,H,.3,(a+b)/2,H/2,zb-.1,K_STONE,4);}
   for(const [a,b] of[[-40,-37.6],[-26,-23.6]]){box(stoneMat2,b-a,H-3.2,.42,(a+b)/2,(H+3.2)/2,zb,K_STONE,2);for(const x of[a,b])box(metalMat,.12,3.2,.5,x,1.6,zb,K_GOLD,1);}
   for(const x of[-42,-32,-22]){box(whiteMat,.3,H,4.5,x,H/2,zb+2.25,K_WHITE2,3);box(metalMat,.34,.15,4.5,x,H-.6,zb+2.25,K_GOLD,1);}
   // shopfronts: glass (mostly shattered: frames and a few panes), counters, a lit sign over each
   for(const [a,b] of[[x0,-42],[-42,-32],[-32,-22],[-22,x1]]){const zg=-41.4;box(metalMat,b-a,.12,.12,(a+b)/2,3.2,zg,C(0x9aa0a8),1);for(let x=a+.1;x<b;x+=2)box(metalMat,.08,3.2,.08,x,1.6,zg,C(0x9aa0a8),1);
     for(let k=0;k<3;k++){const x=R(a+.6,b-.6);mg(glassMat).add(new THREE.PlaneGeometry(R(.8,1.8),R(1,2.6)),M(x,R(1.2,1.9),zg,0,0,R(-.1,.1)),C(0xffffff));}
     box(woodMat,Math.min(4,b-a-2),1,.7,(a+b)/2,.5,zb+1.6,C(0xffffff),1.4);
     mg(KIT.lampMat).add(boxUV(Math.min(5,b-a-1.5),.35,.06,1),M((a+b)/2,3.7,zg+.02),C(hash(a|0,3)<.5?0xffd8a0:0x9ad8ff).multiplyScalar(1.5));}
   for(const x of[-44,-36,-28,-20])mg(KIT.lampMat).add(boxUV(3.2,.05,.2,1),M(x,H-.1,zf-1.4),C(0xfff0d8).multiplyScalar(1.4));
   // the roof walk: a waist-high parapet along the front (a gap in its middle), a railing along the back; the stairs drawn with the ramps
   for(const [a,b] of[[x0,-33.2],[-30.8,x1]]){box(stoneMat2,b-a,1,.3,(a+b)/2,H+T+.5,zf+.15,K_STONE,3);box(metalMat,b-a,.06,.34,(a+b)/2,H+T+1.02,zf+.15,K_GOLD,1);}
   box(metalMat,L,.06,.06,(x0+x1)/2,H+T+1.05,zb+.15,K_DARK,1);for(let x=x0;x<=x1;x+=1.6)box(metalMat,.06,1.05,.06,x,H+T+.52,zb+.15,K_DARK,1);
   // soot up the front, a burnt-out awning hanging
   for(let k=0;k<6;k++)box(burntMat,R(1.5,3),R(1,2.4),.04,R(x0+2,x1-2),R(1.5,3.4),zf+.62,K_SOOT,1);
   box(burntMat,4,.06,2,-29,3.1,zf+.6,C(0x4a2a1a),1,.5,0,.08);}
  // the crown: pale stone, gold bands, tall lit windows (the old top-floor lights still on), a ring chandelier fallen inside; torn edge
  // at its open end; the needle out of it, gold, tapering
  {const {x0,x1,zN,zS,H}=CROWN,xm=(x0+x1)/2,zm=(zN+zS)/2;
   box(stoneMat2,x1-x0+.6,.4,zS-zN+.6,xm,H+.2,zm,K_STONE,4);box(whiteMat,x1-x0,.06,zS-zN,xm,H-.03,zm,K_WHITE,3);
   const wall=(ax,az,bx,bz,y0,y1)=>{const L=Math.hypot(bx-ax,bz-az),ry=Math.atan2(-(bz-az),bx-ax),cx=(ax+bx)/2,cz=(az+bz)/2;
     box(stoneMat2,L,y1-y0,.5,cx,(y0+y1)/2,cz,K_STONE,4,0,ry,0);box(metalMat,L,.18,.54,cx,y0+(y1-y0)*.7,cz,K_GOLD,1,0,ry,0);};
   wall(x0,zN,-9,zN,0,H);wall(-6.6,zN,x1,zN,0,H);wall(-9,zN,-6.6,zN,3.2,H);wall(x0,zS,-5,zS,0,H);wall(-2.6,zS,x1,zS,0,H);wall(-5,zS,-2.6,zS,3.2,H);
   wall(x0,zN,x0,-31.2,0,H);wall(x0,-28.8,x0,zS,0,H);wall(x0,-31.2,x0,-28.8,3.2,H);wall(x1,zN,x1,-32,0,4);wall(x1,-28,x1,zS,0,3.4);
   for(const [x,z] of[[-11.5,zN],[-4,zN],[-1,zN],[-9,zS],[-11,zS],[.2,zS]])mg(KIT.lampMat).add(boxUV(.9,3.4,.06,1),M(x,2.6,z+(z===zN?.27:-.27)),C(0xffe6b8).multiplyScalar(1.3));
   for(let j=0;j<12;j++){const z=lerp(zN,zS,j/11),y=(j%3===0?H:R(0,H))+R(-.4,.4);box(stoneMat2,R(.6,1.3),R(.6,1.4),R(.6,1.2),x1+R(-.3,.5),y,z,K_STONE2,2,R(-.5,.5),R(0,3),R(-.5,.5));}
   mg(metalMat).add(new THREE.TorusGeometry(1.6,.12,8,32),M(-8,.15,-30,Math.PI/2,0,0),K_GOLD);for(let k=0;k<8;k++){const a=k/8*Math.PI*2;mg(KIT.lampMat).add(new THREE.SphereGeometry(.12,8,6),M(-8+Math.cos(a)*1.6,.2,-30+Math.sin(a)*1.6),C(0xfff0d0).multiplyScalar(1.4));}
   mg(metalMat).add(new THREE.CylinderGeometry(.35,.75,22,12),M(13.5,.65,-30,0,0,Math.PI/2),K_GOLD);
   for(let x=4;x<24;x+=3.2)mg(metalMat).add(new THREE.TorusGeometry(lerp(.8,.42,(x-2.5)/22),.06,6,20),M(x,.65,-30,0,Math.PI/2,0),C(0x8a7040));
   box(stoneMat2,2.4,1.4,2.2,2.2,.6,-30,K_STONE2,2,.1,.3,.2);}
  // the sky-bridge: its pillar (white, gold collar), the span lying down onto the stones (drawn with the ramps), a parapet on the
  // pillar's back, a broken length of the span's far end lying in the plaza; kiosks; the fountain court
  {const {px0,px1,pz0,pz1,top}=BRIDGE;box(stoneMat2,px1-px0,top,pz1-pz0,(px0+px1)/2,top/2,(pz0+pz1)/2,K_STONE,4);box(metalMat,px1-px0+.2,.25,pz1-pz0+.2,(px0+px1)/2,top-.4,(pz0+pz1)/2,K_GOLD,1);
   box(stoneMat2,.3,1,pz1-pz0,px0+.15,top+.5,(pz0+pz1)/2,K_STONE,2);
   for(let j=0;j<8;j++)box(stoneMat2,R(.4,1),R(.4,.8),R(.4,1),px0+R(-.4,.4),top+R(-.2,.4),R(pz0,pz1),K_STONE2,1,R(0,1),R(0,3),R(0,1));
   box(stoneMat2,6,1.1,3,-49,.5,41.5,K_STONE,3,0,.3,0);box(metalMat,6.1,.15,.2,-49,1.05,41.5-1.45,K_GOLD,1,0,.3,0);
   for(const x of KIOSKS){box(whiteMat,4,2.8,3.5,x,1.4,45.75,K_WHITE2,3);box(metalMat,4.4,.25,3.9,x,2.9,45.75,K_GOLD,1);box(woodMat,3.4,.9,.5,x,1.1,43.85,C(0xffffff),1.2);
     mg(KIT.lampMat).add(boxUV(3,.4,.06,1),M(x,2.4,43.98),C(hash(x|0,7)<.5?0xffb070:0x8ad0ff).multiplyScalar(1.4));box(burntMat,2,1.2,.04,x+R(-1,1),1.6,43.97,K_SOOT,1);}
   const {x,z,r}=FOUNT;mg(stoneMat2).add(new THREE.CylinderGeometry(r,r+.15,.9,32,1,true),M(x,.45,z),K_STONE);mg(stoneMat2).add(new THREE.TorusGeometry(r,.2,8,32),M(x,.9,z,Math.PI/2,0,0),K_STONE2);
   mg(stoneMat2).add(new THREE.CircleGeometry(r-.05,32).rotateX(-Math.PI/2),M(x,.5,z),C(0x3a4a50));
   mg(stoneMat2).add(new THREE.CylinderGeometry(.5,.7,4.2,12),M(x,2.1,z),K_STONE);mg(metalMat).add(new THREE.OctahedronGeometry(.8,0),M(x,4.7,z,0,.4,0),K_GOLD);
   mg(KIT.lampMat).add(new THREE.RingGeometry(r-.3,r-.1,32).rotateX(-Math.PI/2),M(x,.52,z),C(0x6ac8ff).multiplyScalar(1.2));}
  for(const [mat,b] of mgs){const m=new THREE.Mesh(b.build(),mat);m.castShadow=mat!==KIT.lampMat&&mat!==glassMat;m.receiveShadow=true;m.userData.dyn=1;if(mat===glassMat)m.renderOrder=2;G.add(m);}
  return G;}
{const A=drawWide();A.userData.dyn=1;scene.add(A);const B=A.clone();B.rotation.y=Math.PI;B.userData.dyn=1;scene.add(B);}

/* ---------- New Alexandria burning: the sky of smoke lit from under, the city's towers dark against it with fires in them, columns
   of smoke, Hollow ships over it, flashes where they fire, embers in the air ---------- */
{const sky=new THREE.Mesh(new THREE.SphereGeometry(4000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uT:{value:0},fl:{value:0}},
   vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`varying vec3 vD;uniform float uT,fl;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
     float fb(vec2 p){float s=0.0,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p=p*2.1+vec2(1.3,-.7);a*=.5;}return s;}
     void main(){float y=vD.y;vec2 p=vD.xz/(y+.18)*1.6+vec2(uT*.012,-uT*.006);float c=fb(p),c2=fb(p*2.3+vec2(uT*.02,0.0));
       vec3 glow=vec3(1.0,.38,.1),smoke=vec3(.09,.05,.04),high=vec3(.03,.02,.025);
       float under=smoothstep(.55,.0,y);   // the cloud lit from the fires underneath, brightest low down
       vec3 col=mix(high,smoke,smoothstep(.9,.1,y));col=mix(col,glow*(.6+.6*c2),under*smoothstep(.35,.75,c)*.9);col+=glow*smoothstep(.12,-.02,y)*.9;
       col*=.75+.5*c;col+=vec3(1.0,.6,.3)*fl*smoothstep(.6,.0,y);gl_FragColor=vec4(col,1.0);}`}));
 sky.renderOrder=-5;sky.userData.dyn=1;const sg=new THREE.Group();sg.add(sky);scene.add(sg);CITY.skies.push(sg);
 // the city: towers all round past the plaza, dark, a few windows, fires in some (the shared skyline, at a low light), and our own
 // near ring of white towers, gutted
 if(typeof SKYLINE!=='undefined'){const S=SKYLINE.build({n:coarse?40:70,seed:91,h:300,w:50,water:-30,lit:.12,rings:false,traffic:0,glow:.6,place:(i,r)=>{const a=i/(coarse?40:70)*Math.PI*2+r()*.08,d=150+r()*500;return[Math.cos(a)*d,Math.sin(a)*d,1-(d-150)/500];}});
   S.G.traverse(o=>{o.userData.dyn=1;if(o.material&&o.material.emissive)o.material.emissive.multiplyScalar(.5);});scene.add(S.G);}
 const NT=coarse?18:60,tower=new Merger(),fires=[];for(let i=0;i<NT;i++){const a=i/NT*Math.PI*2+R(-.08,.08),d=(coarse||i%2===0)?R(80,130):R(105,150),x=Math.cos(a)*d*1.3,z=Math.sin(a)*d,w=R(10,18),h=R(40,110);
   tower.add(boxUV(w,h,w*R(.6,1),8),M(x,h/2-2,z,0,R(0,3),0),tmpC.set(0x2a2624).convertSRGBToLinear().clone());if(rng()<.6)tower.add(boxUV(w*.6,h*.25,w*.6,8),M(x,h+h*.12-2,z),tmpC.set(0x24201e).convertSRGBToLinear().clone());
   const nf=rng()<.7?1+(rng()*3|0):0;for(let k=0;k<nf;k++)fires.push(new THREE.Vector3(x+R(-w/2,w/2),R(h*.2,h*.95),z+R(-w/2,w/2)));}
 // (Nov 8) their faces: rows of windows, most dark and gutted, some lit by the fires inside, a few still on (an emissive window map)
 const winT=(()=>{const W=coarse?128:256,[c,g]=spCv(W),[e,eg]=spCv(W),n=8,cw=W/n,rh=W/4;g.fillStyle='#2e2a28';g.fillRect(0,0,W,W);eg.fillStyle='#000';eg.fillRect(0,0,W,W);
   for(let r=0;r<4;r++){g.fillStyle='#3a3532';g.fillRect(0,r*rh,W,rh*.18);for(let i=0;i<n;i++){const x=i*cw+cw*.12,y=r*rh+rh*.28,w=cw*.76,h=rh*.6,q=Math.random();g.fillStyle=q<.8?'#121010':'#3a2418';g.fillRect(x,y,w,h);
     if(q>.86){const f=q>.97;eg.fillStyle=f?'#ffd8a0':`rgb(${200+Math.random()*55|0},${70+Math.random()*60|0},${10+Math.random()*20|0})`;eg.fillRect(x,y+(f?0:h*.4),w,f?h:h*.6);}}}
   const t=texOf(c),te=texOf(e);return[t,te];})();
 const tm=new THREE.Mesh(tower.build(),new THREE.MeshStandardMaterial({vertexColors:true,map:winT[0],emissiveMap:winT[1],emissive:C(0xffffff),emissiveIntensity:1.3,roughness:.8,metalness:.1}));tm.userData.dyn=1;scene.add(tm);
 // fires: glowing sprites that flicker, in the towers and on the plaza
 const fireTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,40,0,32,36,32);r.addColorStop(0,'rgba(255,240,200,1)');r.addColorStop(.25,'rgba(255,160,60,.9)');r.addColorStop(.6,'rgba(200,60,10,.35)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);return t;})();
 const FS=[];for(const p of fires){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:fireTex,color:C(0xffffff).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.position.copy(p);s.scale.setScalar(R(6,14));s.userData.dyn=1;scene.add(s);FS.push({s,b:s.scale.x,ph:R(0,9)});}
 const PLAZA_FIRES=[[-24,-22],[-8,22],[-45,-13],[-36,22],[2,-23],[-56,20],[-34,-34],[-16,48],[-58,34],[-44,-50]];
 for(const [x,z] of PLAZA_FIRES)for(const s of[1,-1]){const s2=new THREE.Sprite(new THREE.SpriteMaterial({map:fireTex,color:C(0xffffff).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s2.position.set(x*s,1.2,z*s);s2.scale.set(3,3.6,3);s2.userData.dyn=1;scene.add(s2);FS.push({s:s2,b:3,ph:R(0,9)});
   KIT.mg(burntMat).add(new THREE.CylinderGeometry(.5,.6,.9,10),M(x*s,.45,z*s),C(0x3a3430));KIT.post(x*s,z*s,.6,0,.9);}
 // smoke columns: dark billows rising and spreading from the burning towers (one instanced cloud of soft sprites, recycled)
 const smokeTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(.6,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
 const SRC=fires.filter((f,i)=>i%2===0).slice(0,coarse?8:28),NSM=coarse?90:440,spos=new Float32Array(NSM*3),slife=new Float32Array(NSM),ssrc=new Int16Array(NSM);
 for(let i=0;i<NSM;i++){slife[i]=R(0,1);ssrc[i]=i%Math.max(1,SRC.length);}
 const sg2=new THREE.BufferGeometry();sg2.setAttribute('position',new THREE.BufferAttribute(spos,3));
 const smk=new THREE.Points(sg2,new THREE.PointsMaterial({size:coarse?60:70,map:smokeTex,color:C(0x2a1a14),transparent:true,opacity:.5,depthWrite:false,fog:false,sizeAttenuation:true}));smk.frustumCulled=false;smk.userData.dyn=1;smk.renderOrder=-1;scene.add(smk);
 // embers drifting up past you
 const NE=coarse?120:600,epos=new Float32Array(NE*3);for(let i=0;i<NE;i++)epos.set([R(-30,30),R(0,20),R(-30,30)],i*3);
 const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.BufferAttribute(epos,3));const emb=new THREE.Points(eg,new THREE.PointsMaterial({size:.09,color:C(0xff9040).multiplyScalar(3),transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));emb.frustumCulled=false;emb.userData.dyn=1;scene.add(emb);
 // the Hollow over the city: cruisers holding over the skyline, their glow; now and then one fires down, a flash on the clouds
 const SHIPS=[];for(const [x,y,z,yaw,len] of[[-420,160,-520,.7,520],[560,210,-380,2.3,460],[120,190,640,-1.4,600]]){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=yaw;g.userData.dyn=1;scene.add(g);
   MODELS.swapShip(g,'voidclass',{len,glow:.25,fog:false,hide:[]}).then(m=>{if(m)m.traverse(o=>{o.userData.dyn=1;if(o.material)o.material.fog=false;});});
   const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xb46aff).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));sp.scale.setScalar(len*.3);sp.position.y=-len*.06;g.add(sp);SHIPS.push({g,len,y:y});}
 const beamM=new THREE.MeshBasicMaterial({color:C(0xd080ff).multiplyScalar(3),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});const beam=new THREE.Mesh(new THREE.CylinderGeometry(3,6,1,10,1,true),beamM);beam.userData.dyn=1;scene.add(beam);
 let bt=R(6,12),bon=0,flash=0;
 CITY.ticks.push((dt,T)=>{sky.material.uniforms.uT.value=T;
   for(const F of FS){const f=1+Math.sin(T*9+F.ph)*.12+Math.sin(T*23+F.ph*2)*.08;F.s.scale.set(F.b*f,F.b*f*1.2,1);}
   for(let i=0;i<NSM;i++){slife[i]+=dt*.03;if(slife[i]>1)slife[i]-=1;const s=SRC[ssrc[i]]||fires[0],u=slife[i];if(!s)continue;spos[i*3]=s.x+u*u*90+Math.sin(i)*u*20;spos[i*3+1]=s.y+u*140;spos[i*3+2]=s.z+u*u*30+Math.cos(i)*u*20;}
   sg2.attributes.position.needsUpdate=true;
   const c=camera.position;for(let i=0;i<NE;i++){let x=epos[i*3]+dt*(.8+Math.sin(T+i)*.6),y=epos[i*3+1]+dt*(1.2+(i%5)*.3),z=epos[i*3+2]+dt*Math.cos(T*.7+i)*.5;
     if(y>c.y+16||Math.abs(x-c.x)>30||Math.abs(z-c.z)>30){x=c.x+R(-30,30);z=c.z+R(-30,30);y=c.y-R(2,6);}epos[i*3]=x;epos[i*3+1]=y;epos[i*3+2]=z;}eg.attributes.position.needsUpdate=true;
   for(const S of SHIPS){S.g.position.y=S.y+Math.sin(T*.2+S.len)*4;}
   bt-=dt;if(bt<=0&&bon<=0){bt=R(8,18);bon=1.6;const S=SHIPS[(rng()*SHIPS.length)|0];const top=S.g.position.clone(),bot=top.clone();bot.y=-10;bot.x+=R(-40,40);bot.z+=R(-40,40);
     beam.position.copy(top).add(bot).multiplyScalar(.5);beam.scale.set(1,top.distanceTo(bot),1);beam.lookAt(bot);beam.rotateX(Math.PI/2);flash=1;SP_SND.boom(Math.min(1,top.length()/900));}
   if(bon>0){bon-=dt;beamM.opacity=Math.min(1,bon)*.8;}else beamM.opacity=0;flash=Math.max(0,flash-dt*1.4);sky.material.uniforms.fl.value=flash*.35;});}

/* ---------- light: the fires' glow over everything (warm, from low down), the halls' own lights still on, emergency strips ---------- */
hemi.color.copy(C(0xb08068));hemi.groundColor.copy(C(0x2a1810));hemi.intensity=.6;
keyLight.color.copy(C(0xff9a5a));keyLight.intensity=1.1;keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:4096,coarse?1024:4096);   // (Nov 8: 4096 on PC)
Object.assign(keyLight.shadow.camera,{left:-85,right:85,top:62,bottom:-62,near:10,far:400});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.05;
keyLight.position.set(-110,70,90);keyLight.target.position.set(0,0,0);
{const L=[];twin(s=>{for(let k=1;k<NB;k+=2){const x=(bayX(k)+SEG.BAY/2)*s,z=-5*s;L.push([x,4.5,z,0xffe2b8,1.2,9]);}// the car park: its tubes' cold-warm light, the fires' orange down the pits (Nov 8: three a half, under the slab)
   L.push([-40*s,-1,-5*s,0xffe6c8,.9,13],[-24*s,-1,-5*s,0xff9a5a,1,13],[-9*s,-1.2,-5*s,0xff7a3a,1.1,13]);
   L.push([-40*s,3.4,-42*s,0xffd8a8,1.1,10],[-24*s,3.4,-42*s,0xffd8a8,1.1,10],[-6*s,4.5,-30*s,0xffe0b0,1.1,10],[-12*s,1.5,44*s,0x8ac8ff,.8,8]);});
 const LL=coarse?L.filter((_,i)=>i%2===0):L;for(const [x,y,z,c,i,d] of LL){const p=new THREE.PointLight(C(c),i,d,1.7);p.position.set(x,y,z);scene.add(p);}
 const FL=[];for(const [x,z] of[[-24,-22],[-8,22],[-45,-13],[-34,-34],[-16,48]])for(const s of(coarse?[1]:[1,-1])){const p=new THREE.PointLight(C(0xff7030),1.6,16,1.8);p.position.set(x*s,1.6,z*s);scene.add(p);FL.push({p,ph:R(0,9)});}
 CITY.ticks.push((dt,T)=>{for(const F of FL)F.p.intensity=1.4+Math.sin(T*11+F.ph)*.25+Math.sin(T*27+F.ph)*.15;});
 for(const B of GS.BASES){const p=new THREE.PointLight(C(GS.TEAMS[B.team].c),1.4,18,1.6);p.position.set(B.x,3,B.z);scene.add(p);}}
if(BLOOM){BLOOM.strength=.7;BLOOM.threshold=.75;}

/* ---------- the sounds: fire roaring, the city far off, booms; the halls are a room ---------- */
const SP_SND=KIT.sound([{f:[['lowpass',300]],v:.12,swell:.35,rate:.3},{f:[['bandpass',900]],v:.03,swell:.6,rate:1.7}]);
SP_SND.boom=d=>SP_SND.one(c=>{const t=c.currentTime+.4+d*1.8,len=c.sampleRate*3,buf=c.createBuffer(1,len,c.sampleRate),q=buf.getChannelData(0);let b=0;for(let i=0;i<len;i++){b=.98*b+(Math.random()*2-1)*.2;q[i]=b*Math.exp(-i/len*4);}
  const s=c.createBufferSource();s.buffer=buf;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;const g=c.createGain();g.gain.value=lerp(.9,.35,d);s.connect(lp);lp.connect(g);g.connect(c.destination);s.start(t);});
GS.indoorAt=()=>{const c=camera.position;return inSeg(c.x,c.z)&&c.y<SEG.H?1:0;};
dust.material.color.copy(C(0xd8b8a0));dust.material.opacity=.4;

KIT.flush();

/* ---------- the bots' map ---------- */
const NAV=KIT.nav({step:2,perchY:6});
GS.HILLS=[{x:0,z:0},{x:-10,z:-5},{x:10,z:5},{x:-25,z:-5},{x:25,z:5},{x:-40,z:-5},{x:40,z:5},{x:-20,z:-5.5},{x:20,z:5.5},{x:-20,z:14},{x:20,z:-14},{x:-35,z:-18},{x:35,z:18},
  {x:-32,z:-42},{x:32,z:42},{x:-6,z:-30},{x:6,z:30},{x:-42,z:36},{x:42,z:-36},{x:-12,z:40},{x:12,z:-40},{x:-40,z:-49},{x:40,z:49},{x:20,z:-33},{x:-20,z:33}];
GS.INTRO=[[[-60,14,-22],[-30,4,-5]],[[-34,1.7,-8],[-14,3,-3]],[[-6,10.5,4],[20,9,6]],[[30,6,-20],[56,2,5]]];
