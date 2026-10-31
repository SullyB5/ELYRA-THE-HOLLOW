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
  return{HALF,HALFZ:26,SEA:-99,TEAMS:TEAM_COLS,BASES,BASE_R,CFG,NAME:CFG.name};})();
const mirP=(x,z)=>[-x,-z];
const inSeg=(x,z)=>(x>SEG.x0&&x<SEG.x1&&z>SEG.zN&&z<SEG.zS)||(-x>SEG.x0&&-x<SEG.x1&&-z>SEG.zN&&-z<SEG.zS);
// the trench at each break where the crushed level comes up into the plaza: a ramp from its floor to the plaza's
const TRENCH=[-4,3.6,-7.3,-4.7],inTrench=(x,z)=>(x>TRENCH[0]&&x<TRENCH[1]&&z>TRENCH[2]&&z<TRENCH[3])||(-x>TRENCH[0]&&-x<TRENCH[1]&&-z>TRENCH[2]&&-z<TRENCH[3]);
CITY.ground=(x,z)=>(inSeg(x,z)||inTrench(x,z))?SEG.BASE:0;
CITY.edge=(x,z)=>Math.max(Math.abs(x)-61.6,Math.abs(z)-25.6);
CITY.box=[-62,-26,62,26];CITY.step=2;
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
   for(const p of PITS)if(p.ramp){const north=p.z0<-5,P0=P((p.x0+p.x1)/2,north?p.z0+.1:p.z1-.1),u=north?1:-1;KIT.ramp(P0,0,u*s,p.z1-p.z0+.2,2.2,BASE,0,{rails:[false,false],slab:false});}
   const P0=P(x1,-6);KIT.ramp(P0,s,0,7.6,2.6,BASE,0,{rails:[true,true],clear:2.2});
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
    [-20,-17,2.2,1.6,1.2,.9],[-41,-19,3,1.4,1.1,.2],[-52,-15,2,2,1.2,.7],[-14,20,2.6,2,1.3,1],[-30,17,1.8,1.8,1,.3],[-48,4.5,2.2,1.6,1.1,.6]]){const [X,Z]=P(x,z);
    KIT.block({cx:X,cz:Z,ry:ry,l,w},-.2,h);RUBBLE.push({x:X,z:Z,l,w,h,ry});}
  // broken pillars, a car or two (burnt out), a fountain's rim in the middle
  for(const [x,z] of[[-6,-21],[-26,21],[-46,-21],[-16,-6.5+20]])KIT.post(...P(x,z),.7,0,4.5);});
const CARS=[[-18,-20,.15],[-38,17,-.3],[-8,17,1.3],[-54,10,.5]];
twin(s=>{for(const [x,z,ry] of CARS){const X=x*s,Z=z*s;KIT.block({cx:X,cz:Z,ry,l:4.6,w:2},-.1,1.4);}});
// racks: in the hall of each half (by the middle) and in the crushed level
GS.RACKS=[{x:-14,z:-4},{x:14,z:4}];

/* ---------- materials: New Alexandria's insides — white plaster, warm wood, brushed metal, glass; the city's white stone ---------- */
const SP_ENV=KIT.env((x,y,z)=>{const hz=1-Math.abs(y);let r=.2+.5*hz*hz,g=.06+.16*hz*hz,b=.03+.05*hz*hz;if(y<0){r*=.4;g*=.4;b*=.4;}const a=Math.atan2(z,x);r+=sstep(.8,1,hz)*.4*(.5+.5*Math.sin(a*7));return[r,g,b];});
function plankTex(){const W=256,c=document.createElement('canvas');c.width=c.height=W;const g=c.getContext('2d');
  for(let i=0;i<8;i++){const y=i*32,base=[128+Math.random()*26,88+Math.random()*16,58+Math.random()*12];for(let x=0;x<W;x+=1){const v=Math.sin(x*.07+i*3)*8+Math.sin(x*.31+i)*4;g.fillStyle=`rgb(${base[0]+v|0},${base[1]+v*.6|0},${base[2]+v*.4|0})`;g.fillRect(x,y,1,32);}
    g.fillStyle='rgba(40,20,10,.6)';g.fillRect(0,y,W,1.5);const cut=Math.random()*W;g.fillRect(cut,y,1.5,32);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;return t;}
function plasterTex(){const W=256,c=document.createElement('canvas');c.width=c.height=W;const g=c.getContext('2d');g.fillStyle='#e8e6e2';g.fillRect(0,0,W,W);
  for(let i=0;i<1600;i++){const v=200+Math.random()*50|0;g.fillStyle=`rgba(${v},${v},${v-6},.25)`;g.fillRect(Math.random()*W,Math.random()*W,2,2);}
  // scorch and cracks, a panel seam
  for(let i=0;i<10;i++){g.strokeStyle='rgba(60,50,45,.35)';g.lineWidth=1;g.beginPath();let x=Math.random()*W,y=Math.random()*W;g.moveTo(x,y);for(let k=0;k<6;k++){x+=(Math.random()-.5)*40;y+=(Math.random()-.5)*40;g.lineTo(x,y);}g.stroke();}
  g.fillStyle='rgba(120,116,110,.5)';g.fillRect(0,W-2,W,2);g.fillRect(W-2,0,2,W);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;return t;}
const plaster=plasterTex(),planks=plankTex();
const whiteMat=new THREE.MeshStandardMaterial({vertexColors:true,map:plaster,roughness:.6,metalness:.05,envMap:SP_ENV,envMapIntensity:.5});
const woodMat=new THREE.MeshStandardMaterial({vertexColors:true,map:planks,roughness:.38,metalness:.05,envMap:SP_ENV,envMapIntensity:.8});
const metalMat=new THREE.MeshStandardMaterial({vertexColors:true,map:panelTex,roughness:.3,metalness:.8,envMap:SP_ENV,envMapIntensity:1});
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
  // the floor: the facade's inside face — white panels, the window pits cut through, a dark frame round each; under it, the slab
  for(let k=0;k<NB;k++){const bx0=bayX(k),bx1=bayX(k+1),p=PITS[k];
    for(const [a,b,c,d] of[[bx0,bx1,zN,p.z0],[bx0,bx1,p.z1,zS],[bx0,p.x0,p.z0,p.z1],[p.x1,bx1,p.z0,p.z1]]){if(b-a<.05||d-c<.05)continue;box(whiteMat,b-a,.4,d-c,(a+b)/2,-.2,(c+d)/2,K_WHITE2,3);}
    // the window frame round the pit (aluminium), glass shards on its edge
    for(const [w,d,x,z] of[[p.x1-p.x0+.2,.12,(p.x0+p.x1)/2,p.z0],[p.x1-p.x0+.2,.12,(p.x0+p.x1)/2,p.z1],[.12,p.z1-p.z0,p.x0,(p.z0+p.z1)/2],[.12,p.z1-p.z0,p.x1,(p.z0+p.z1)/2]])box(metalMat,w,.14,d,x,.05,z,C(0x9aa0a8),1);
    for(let j=0;j<5;j++)mg(glassMat).add(new THREE.PlaneGeometry(R(.3,.8),R(.2,.5)),M(R(p.x0,p.x1),R(.02,.4),j%2?p.z0+.05:p.z1-.05,R(-.5,.5),R(0,3),R(-.5,.5)),C(0xffffff));}
  // the ceiling: the far facade's inside, its skylights open to the burning sky; the top's outer face (stone and gold bands) over it
  for(let k=0;k<NB;k++){const bx0=bayX(k),bx1=bayX(k+1),q=SKY[k];
    for(const [a,b,c,d] of[[bx0,bx1,zN,q.z0],[bx0,bx1,q.z1,zS],[bx0,q.x0,q.z0,q.z1],[q.x1,bx1,q.z0,q.z1]]){if(b-a<.05||d-c<.05)continue;box(whiteMat,b-a,.08,d-c,(a+b)/2,H+.04,(c+d)/2,K_WHITE,3);box(stoneMat2,b-a,.42,d-c,(a+b)/2,H+.29,(c+d)/2,K_STONE,4);}
    for(const [w,d,x,z] of[[q.x1-q.x0+.2,.14,(q.x0+q.x1)/2,q.z0],[q.x1-q.x0+.2,.14,(q.x0+q.x1)/2,q.z1],[.14,q.z1-q.z0,q.x0,(q.z0+q.z1)/2],[.14,q.z1-q.z0,q.x1,(q.z0+q.z1)/2]])box(metalMat,w,.6,d,x,H+.3,z,C(0x8a8e94),1);}
  // the top's gold bands (the old floor lines) across it at every partition
  for(let k=0;k<=NB;k++)box(metalMat,.35,.08,zS-zN,bayX(k),H+.52,(zN+zS)/2,K_GOLD,1);
  // the side walls: plaster inside, white stone outside, tall window slots (glass gone), a gold mullion each side
  for(const [side,z,o] of[['n',zN,-1],['s',zS,1]]){const W=SIDEWIN.filter(w=>w.side===side).sort((p,q)=>p.a0-q.a0);let cur=x0;
    const pane=(a,b,y0,y1)=>{if(b-a<.05||y1-y0<.05)return;box(whiteMat,b-a,y1-y0,.12,(a+b)/2,(y0+y1)/2,z-o*.2,K_WHITE,3);box(stoneMat2,b-a,y1-y0,.36,(a+b)/2,(y0+y1)/2,z+o*.05,K_STONE,4);};
    for(const w of W){pane(cur,w.a0,BASE,H);pane(w.a0,w.a1,w.y1,H);pane(w.a0,w.a1,BASE,0);for(const a of[w.a0,w.a1])box(metalMat,.14,w.y1,.5,a,w.y1/2,z,K_GOLD,1);cur=w.a1;}pane(cur,x1,BASE,H);}
  // the partitions: wood (what was a floor) on the face toward the base end, white with its light fixtures (what was a ceiling) toward
  // the break; a dark slab between; the doorways' frames
  for(const Pt of PART){const pz=Pt.o.slice().sort((p,q)=>p[0]-q[0]);const edges=[zN,zS,...pz.flatMap(o=>[o[0],o[1]])].sort((a,b)=>a-b);
    for(let i=0;i<edges.length-1;i++){const za=edges[i],zb=edges[i+1];if(zb-za<.05)continue;const zm=(za+zb)/2,ops=pz.filter(o=>o[0]<=zm&&o[1]>=zm).sort((a,b)=>a[2]-b[2]);let y=0;const pieces=[];
      for(const o of ops){if(o[2]>y)pieces.push([y,o[2]]);y=Math.max(y,o[3]);}if(y<H)pieces.push([y,H]);
      for(const [ya,yb] of pieces){const ym=(ya+yb)/2,hh=yb-ya;box(woodMat,.06,hh,zb-za,Pt.x-.2,ym,zm,C(0xffffff),2.4);box(whiteMat,.06,hh,zb-za,Pt.x+.2,ym,zm,K_WHITE,3);box(whiteMat,.34,hh,zb-za,Pt.x,ym,zm,C(0x3a3634),2);}}
    for(const o of pz){for(const z of[o[0],o[1]])box(metalMat,.5,o[3]-o[2],.1,Pt.x,(o[2]+o[3])/2,z,C(0xb8bcc0),1);box(metalMat,.5,.1,o[1]-o[0],Pt.x,o[3],(o[0]+o[1])/2,C(0xb8bcc0),1);}
    // the old ceiling's lights: round fixtures and a long strip, still lit, now on the wall
    for(const [y,z] of[[2,-8.5],[4.5,-5],[7,-1.5],[6.5,-8]]){if(pz.some(o=>z>o[0]-.6&&z<o[1]+.6&&y>o[2]-.6&&y<o[3]+.6))continue;mg(KIT.lampMat).add(new THREE.CircleGeometry(.32,16).rotateY(Math.PI/2),M(Pt.x+.24,y,z),C(0xfff0d8).multiplyScalar(1.6));}
    if(!pz.some(o=>o[2]<4.4&&o[3]>4.2))mg(KIT.lampMat).add(boxUV(.03,.08,zS-zN-2,1),M(Pt.x+.24,4.3,(zN+zS)/2),C(0xffe0b0).multiplyScalar(1.3));}
  // the crushed level: concrete, the columns, the floor slab's underside, wrecked cars, water
  box(stoneMat2,L,.2,zS-zN,(x0+x1)/2,BASE-.1,(zN+zS)/2,C(0x5a5650),6);
  for(const z of[zN,zS])box(stoneMat2,L,-BASE,.6,(x0+x1)/2,BASE/2,z,C(0x6a645c),4);box(stoneMat2,.6,-BASE,zS-zN,x0,BASE/2,(zN+zS)/2,C(0x6a645c),4);
  for(let k=1;k<NB;k++){mg(stoneMat2).add(new THREE.CylinderGeometry(.45,.45,-BASE,12),M(bayX(k),BASE/2,-5),C(0x7a7468));mg(metalMat).add(boxUV(.94,.15,.94,1),M(bayX(k),-.3,-5),K_GOLD);}
  for(let k=0;k<NB;k++)box(whiteMat,SEG.BAY,.06,zS-zN,bayX(k)+SEG.BAY/2,-.42,(zN+zS)/2,C(0x8a8680),3);
  for(const [x,z,ry] of[[-44,-8.5,.2],[-27,-1,1.3],[-12,-9,-.3]]){box(burntMat,4.2,1.1,1.8,x,BASE+.6,z,C(0x6a5a50),1,0,ry,0);box(burntMat,2.2,.7,1.6,x-.3,BASE+1.45,z,C(0x3a3430),1,0,ry,0);}
  // the slid furniture: desks on their sides, sofas, planters (soil spilled, plants growing sideways now), filing cabinets, lamps
  for(let k=0;k<NB;k++){const bx=bayX(k)+SEG.BAY/2,p=PITS[k],free=(x,z)=>!(x>p.x0-.6&&x<p.x1+.6&&z>p.z0-.6&&z<p.z1+.6);
    const items=[['desk',bx-1.2,zN+1.4],['sofa',bx+.6,zS-1.3],['plant',bx+1.5,zN+1],['cab',bx-1.6,zS-.8],['desk',bx+1,-5.2]];
    for(const [kind,x,z] of items){if(!free(x,z)||hash(k*7+1,kind.length)<.25)continue;const ry=hash(k,z|0)*1.2-.6;
      if(kind==='desk'){box(woodMat,1.8,.8,.08,x,.4,z,C(0xffffff),1.6,0,ry,0);box(metalMat,.08,.75,.7,x-.8,.38,z+.35,C(0xb0b4b8),1,0,ry,0);box(metalMat,.08,.75,.7,x+.8,.38,z+.35,C(0xb0b4b8),1,0,ry,0);}
      else if(kind==='sofa'){box(whiteMat,2,.55,.9,x,.28,z,C(0xc89a6a),1,0,ry,0);box(whiteMat,2,.85,.25,x,.42,z+.45,C(0xb88a5a),1,0,ry,0);}
      else if(kind==='plant'){mg(whiteMat).add(new THREE.CylinderGeometry(.42,.34,.9,14),M(x,.45,z,0,0,Math.PI/2),K_WHITE);for(let j=0;j<6;j++)mg(plantMat).add(new THREE.PlaneGeometry(.18,1.1).translate(0,.55,0),M(x+.5,.45+R(-.2,.2),z+R(-.3,.3),R(-.5,.5),R(0,3),-Math.PI/2+R(-.4,.4)),C(0x4a7a3a));}
      else{box(metalMat,.5,1.3,.6,x,.65,z,C(0x8a8e94),1,0,ry,.4);}}
    // papers everywhere
    for(let j=0;j<8;j++){const x=bayX(k)+R(.2,SEG.BAY-.2),z=R(zN+.3,zS-.3);if(!free(x,z))continue;mg(plantMat).add(new THREE.PlaneGeometry(.22,.3).rotateX(-Math.PI/2),M(x,.02,z,0,R(0,6),0),C(0xe8e4dc));}}
  // the end at the base: the broken stump's jagged edge round the gap; and at the break, the torn edge all round the opening
  for(const xe of[x0,x1])for(let j=0;j<16;j++){const t=j/15,on=xe===x1||t<.25||t>.6;if(!on&&j%3)continue;const z=lerp(zN,zS,t),y=(j%2?H:0)+R(-.6,.6);box(stoneMat2,R(.6,1.4),R(.6,1.6),R(.8,1.6),xe+R(-.6,.6),y,z,K_STONE2,2,R(-.4,.4),R(0,3),R(-.4,.4));}
  box(stoneMat2,.6,H-5.2,6.4,x0,(H+5.2)/2,-5.4,K_STONE,4);
  for(const [mat,b] of mgs){const m=new THREE.Mesh(b.build(),mat);m.castShadow=mat!==KIT.lampMat&&mat!==glassMat;m.receiveShadow=true;m.userData.dyn=1;if(mat===glassMat)m.renderOrder=2;G.add(m);}
  return G;}
{const A=drawHalf();A.userData.dyn=1;scene.add(A);const B=A.clone();B.rotation.y=Math.PI;B.userData.dyn=1;scene.add(B);}
// the ramps (rubble heaped up onto the top; the slopes out of the pits and the crushed level), drawn as broken slabs and stone
for(const R0 of KIT.PAIRS){const ry=Math.atan2(-R0.uz,R0.ux),n=Math.max(4,Math.round(R0.L/.9));
  for(let k=0;k<n;k++){const a=(k+.5)/n*R0.L,x=R0.P0[0]+R0.ux*a,z=R0.P0[1]+R0.uz*a,y=R0.hAt(a),g=Math.max(CITY.ground(x,z),R0.yA<R0.yB?R0.yA:R0.yB);
    KIT.mg(stoneMat2).add(boxUV(R0.L/n+.25,Math.max(.4,y-g+.3),R0.w+R(0,.6),2),M(x,(y+g)/2-.12,z,R(-.06,.06),ry+R(-.08,.08),R(-.08,.08)),hash(k,R0.w*10|0)<.5?K_STONE:K_STONE2);}
  for(let k=0;k<R0.L*1.4;k++){const a=R(0,R0.L),b=(rng()<.5?-1:1)*(R0.w/2+R(.2,1.2)),x=R0.P0[0]+R0.ux*a+R0.nx*b,z=R0.P0[1]+R0.uz*a+R0.nz*b,y=R0.hAt(a);
    KIT.mg(stoneMat2).add(boxUV(R(.4,1.2),R(.3,.9),R(.4,1.1),1),M(x,y-R(.2,.6),z,R(0,1),R(0,3),R(0,1)),K_STONE2);}}
// the rubble blocks, the cars, the pillars, the plaza's paving
for(const Rb of RUBBLE)KIT.mg(stoneMat2).add(boxUV(Rb.l,Rb.h+.2,Rb.w,2),M(Rb.x,Rb.h/2-.1,Rb.z,0,Rb.ry,0),hash(Rb.x|0,Rb.z|0)<.5?K_STONE:K_SOOT);
twin(s=>{for(const [x,z,ry] of CARS){const X=x*s,Z=z*s;KIT.mg(burntMat).add(boxUV(4.6,1,2,1),M(X,.55,Z,0,ry,0),C(0x5a4a44));KIT.mg(burntMat).add(boxUV(2.4,.7,1.8,1),M(X-.3*Math.cos(ry),1.35,Z+.3*Math.sin(ry),0,ry,0),C(0x2a2422));}});
for(const o of OBST)if(o.r>.6&&o.h>4)KIT.mg(stoneMat2).add(new THREE.CylinderGeometry(o.r,o.r*1.05,o.h,14),M(o.x,o.h/2,o.z),K_STONE),KIT.mg(metalMat).add(new THREE.CylinderGeometry(o.r*1.08,o.r*1.08,.3,14),M(o.x,o.h-.4,o.z),K_GOLD);
{const S=200,g=new THREE.PlaneGeometry(S,S,1,1).rotateX(-Math.PI/2),U=g.attributes.uv;for(let i=0;i<U.count;i++)U.setXY(i,U.getX(i)*S/5,U.getY(i)*S/5);g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(g.attributes.position.count*3).fill(.85),3));
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:stoneT,roughness:.6,metalness:.05,envMap:SP_ENV,envMapIntensity:.35}));m.position.y=-.01;m.receiveShadow=true;m.userData.dyn=1;scene.add(m);
 // soot and scorch: dark patches round the fires and the cars
 for(let k=0;k<26;k++){const x=R(-60,60),z=R(-25,25);if(inSeg(x,z))continue;KIT.mg(KIT.lampMat).add(new THREE.CircleGeometry(R(1.5,4),18).rotateX(-Math.PI/2),M(x,.015,z),C(0x0c0806));}}
// the bases: rings of the side's light, a barricade arc
for(const B of GS.BASES){const TC=C(GS.TEAMS[B.team].c).multiplyScalar(2.2);KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(B.r-.3,B.r,48).rotateX(-Math.PI/2),M(B.x,.03,B.z),TC);
  KIT.mg(KIT.lampMat).add(new THREE.RingGeometry(2.4,2.8,3).rotateX(-Math.PI/2),M(B.x,.04,B.z,0,B.fx>0?-Math.PI/2:Math.PI/2,0),TC);}

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
 const tower=new Merger(),fires=[];for(let i=0;i<(coarse?18:30);i++){const a=i/(coarse?18:30)*Math.PI*2+R(-.08,.08),d=R(80,130),x=Math.cos(a)*d*1.3,z=Math.sin(a)*d,w=R(10,18),h=R(40,110);
   tower.add(boxUV(w,h,w*R(.6,1),8),M(x,h/2-2,z,0,R(0,3),0),tmpC.set(0x2a2624).convertSRGBToLinear().clone());if(rng()<.6)tower.add(boxUV(w*.6,h*.25,w*.6,8),M(x,h+h*.12-2,z),tmpC.set(0x24201e).convertSRGBToLinear().clone());
   const nf=rng()<.7?1+(rng()*3|0):0;for(let k=0;k<nf;k++)fires.push(new THREE.Vector3(x+R(-w/2,w/2),R(h*.2,h*.95),z+R(-w/2,w/2)));}
 const tm=new THREE.Mesh(tower.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:.1}));tm.userData.dyn=1;scene.add(tm);
 // fires: glowing sprites that flicker, in the towers and on the plaza
 const fireTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,40,0,32,36,32);r.addColorStop(0,'rgba(255,240,200,1)');r.addColorStop(.25,'rgba(255,160,60,.9)');r.addColorStop(.6,'rgba(200,60,10,.35)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);return t;})();
 const FS=[];for(const p of fires){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:fireTex,color:C(0xffffff).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.position.copy(p);s.scale.setScalar(R(6,14));s.userData.dyn=1;scene.add(s);FS.push({s,b:s.scale.x,ph:R(0,9)});}
 const PLAZA_FIRES=[[-24,-22],[-8,22],[-45,-13],[-36,22],[2,-23],[-56,20]];
 for(const [x,z] of PLAZA_FIRES)for(const s of[1,-1]){const s2=new THREE.Sprite(new THREE.SpriteMaterial({map:fireTex,color:C(0xffffff).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s2.position.set(x*s,1.2,z*s);s2.scale.set(3,3.6,3);s2.userData.dyn=1;scene.add(s2);FS.push({s:s2,b:3,ph:R(0,9)});
   KIT.mg(burntMat).add(new THREE.CylinderGeometry(.5,.6,.9,10),M(x*s,.45,z*s),C(0x3a3430));KIT.post(x*s,z*s,.6,0,.9);}
 // smoke columns: dark billows rising and spreading from the burning towers (one instanced cloud of soft sprites, recycled)
 const smokeTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(.6,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
 const SRC=fires.filter((f,i)=>i%2===0).slice(0,coarse?8:16),NSM=coarse?90:220,spos=new Float32Array(NSM*3),slife=new Float32Array(NSM),ssrc=new Int16Array(NSM);
 for(let i=0;i<NSM;i++){slife[i]=R(0,1);ssrc[i]=i%Math.max(1,SRC.length);}
 const sg2=new THREE.BufferGeometry();sg2.setAttribute('position',new THREE.BufferAttribute(spos,3));
 const smk=new THREE.Points(sg2,new THREE.PointsMaterial({size:coarse?60:70,map:smokeTex,color:C(0x2a1a14),transparent:true,opacity:.5,depthWrite:false,fog:false,sizeAttenuation:true}));smk.frustumCulled=false;smk.userData.dyn=1;smk.renderOrder=-1;scene.add(smk);
 // embers drifting up past you
 const NE=coarse?120:300,epos=new Float32Array(NE*3);for(let i=0;i<NE;i++)epos.set([R(-30,30),R(0,20),R(-30,30)],i*3);
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
keyLight.color.copy(C(0xff9a5a));keyLight.intensity=1.1;keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(keyLight.shadow.camera,{left:-75,right:75,top:45,bottom:-45,near:10,far:400});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.05;
keyLight.position.set(-110,70,90);keyLight.target.position.set(0,0,0);
{const L=[];twin(s=>{for(let k=1;k<NB;k+=2){const x=(bayX(k)+SEG.BAY/2)*s,z=-5*s;L.push([x,4.5,z,0xffe2b8,1.2,9]);}L.push([-28*s,-2,-5*s,0xff7a3a,1.2,12],[-10*s,-2,-5*s,0xff7a3a,1.2,12]);});
 const LL=coarse?L.filter((_,i)=>i%2===0):L;for(const [x,y,z,c,i,d] of LL){const p=new THREE.PointLight(C(c),i,d,1.7);p.position.set(x,y,z);scene.add(p);}
 const FL=[];for(const [x,z] of[[-24,-22],[-8,22],[-45,-13]])for(const s of(coarse?[1]:[1,-1])){const p=new THREE.PointLight(C(0xff7030),1.6,16,1.8);p.position.set(x*s,1.6,z*s);scene.add(p);FL.push({p,ph:R(0,9)});}
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
GS.HILLS=[{x:0,z:0},{x:-10,z:-5},{x:10,z:5},{x:-25,z:-5},{x:25,z:5},{x:-40,z:-5},{x:40,z:5},{x:-20,z:-5.5},{x:20,z:5.5},{x:-20,z:14},{x:20,z:-14},{x:-35,z:-18},{x:35,z:18}];
GS.INTRO=[[[-60,14,-22],[-30,4,-5]],[[-34,1.7,-8],[-14,3,-3]],[[-6,10.5,4],[20,9,6]],[[30,6,-20],[56,2,5]]];
