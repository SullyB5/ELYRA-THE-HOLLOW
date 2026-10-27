/* Elyra · Archive 01 · The Mountain — below the Hollow (Oct 26 rebuild from Bryce's blueprint: ~11 minutes inside, on Hollow).
   After the courtyard, Michael goes down alone (as Master Veyr ordered: no one follows him below). No title card: the gate shot cuts
   straight to him inside. The Hollow keeps a prison under the mountain, and it is huge: a curving gallery of cells two tiers high,
   lamps hung on chains all the way along, a stadium-sized vault, and at the bottom the Codex Dome, a bridge over a chasm to the
   Codex in the middle and the drowned sea behind glass. The Hollow King springs his trap; the Codex sinks out of reach; Michael
   runs the long way out to a door onto the courtyard, and the fall back begins. The shape (route, rooms, spurs, the 1 m grid) is
   in 01-world.js (BROUTE_N, BROOMS, BSPURS, BGRID).
   Phases: 'below' (go down) → 'codexcut' → 'climb' (get out) → 'exitcut' → 'fallback'.
   Holdouts (BELOW.hold): Checkpoint 9 (a seal breaks), the inner gate (it opens), the cage over the descent (it lifts), the dome
   (clear it), the cave mouth (Daro cuts the door). Each one shuts the way on until it is done. */
const BELOW={on:false,G:null,eyes:null,codex:null,dome:null,lights:[],pool:[],lamps:[],spot:null,shake:0,sinkT:-1,takeT:-1,
  hold:null,done:{},enc:{},seals:{},stage:0};
const BT=new THREE.Vector3(),BU=new THREE.Vector3();
// a sheet of the Hollow's light: brighter at the top and bottom edges, fine scan lines, thin in the middle (seals and barrier posts)
const BELOW_LIGHT_TEX=(()=>{let t=null;return()=>{if(t)return t;const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.12,'rgba(255,255,255,.35)');g.addColorStop(.5,'rgba(255,255,255,.18)');g.addColorStop(.88,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,1)');
  x.fillStyle=g;x.fillRect(0,0,64,256);for(let y=0;y<256;y+=6){x.fillStyle='rgba(255,255,255,.22)';x.fillRect(0,y,64,1);}
  t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;};})();
const bWorldFromChamber=(lx,ly,lz)=>[BCH.x-lz,BCH.y+ly,BCH.z+lx];   // the chamber group is turned so its -z (the sea) faces east

/* ---------- building it (the first time it is needed) ---------- */
function bRoomAt(x,z,m){for(const R0 of BROOMS)if(Math.hypot(x-R0.x,z-R0.z)<R0.r+m)return R0;
  if(Math.hypot((x-VAULT.x)/(VAULT.rx+m),(z-VAULT.z)/(VAULT.rz+m))<1)return VAULT;if(Math.hypot(x-BCH.x,z-BCH.z)<BCH.r+m)return BCH;return null;}
function bRegionH(s){return s<BS.vaultIn?13:s<BLEN?11:12;}
function buildBelow(){
  const G=new THREE.Group();scene.add(G);BELOW.G=G;
  // rock: dark violet-grey, lighter on the ribs, a little wet
  const wallMat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.BackSide,roughness:.66,metalness:.12,map:detailTex});
  const floorMat=new THREE.MeshStandardMaterial({color:C(0x2a2a32),roughness:.82,metalness:.08,map:detailTex,side:THREE.DoubleSide});
  const stoneTex=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=512;const x=cv.getContext('2d');x.fillStyle='#3a3530';x.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=32){const off=(y/32%2)*32;for(let xx=-64;xx<512;xx+=64){const k=52+Math.random()*26;x.fillStyle=`rgb(${k+10},${k+4},${k+14})`;x.fillRect(xx+off+1.5,y+1.5,61,29);}}
    for(let i=0;i<2500;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.14})`;x.fillRect(Math.random()*512,Math.random()*512,2,2);}
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;})();
  const stoneMat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.BackSide,roughness:.6,metalness:.15,map:stoneTex});
  const pushQuad=(I,a,b,c,d)=>I.push(a,b,c,b,d,c);
  // --- the passages: an arched section swept along the route and the spurs, broken where a room takes over
  function sweep(pts,Hf,mat,floor){
    const runs=[];let cur=[];for(const p of pts){if(bRoomAt(p.x,p.z,-.6)){if(cur.length>1)runs.push(cur);cur=[];}else cur.push(p);}if(cur.length>1)runs.push(cur);
    for(const run of runs){const NJ=16,P=[],Cc=[],UV=[],I=[],FP=[],FI=[];
      for(let i=0;i<run.length;i++){const p=run[i],a=run[Math.max(0,i-1)],b=run[Math.min(run.length-1,i+1)],tx=b.x-a.x,tz=b.z-a.z,tl=Math.hypot(tx,tz)||1,nx=-tz/tl,nz=tx/tl;
        const W=p.hw+2.4,H=Hf(p),acc=(p.s||i*1.5);
        for(let j=0;j<=NJ;j++){const th=-.42+j/NJ*(Math.PI+.84),n=vnoise(p.x*.22+j*.7,p.z*.22),rib=.5+.5*Math.cos(acc/6*Math.PI*2),k=1+.16*(n-.5)+.05*rib;
          const lat=Math.cos(th)*W*k,up=Math.sin(th)*H*(1+.1*(n-.5));P.push(p.x+nx*lat,p.y+up,p.z+nz*lat);
          const sh=(.5+.35*n+.2*rib)*(.85+.15*Math.sin(th));Cc.push(.16*sh,.15*sh,.19*sh);UV.push(acc/4,j*.8);}
        // the floor strip, slightly raised at its edges where the rock meets it
        for(const w of[-W,-p.hw,0,p.hw,W])FP.push(p.x+nx*w,p.y+(Math.abs(w)>p.hw+.1?.5:.02),p.z+nz*w);
        if(i<run.length-1){for(let j=0;j<NJ;j++){const q=i*(NJ+1)+j;pushQuad(I,q,q+1,q+NJ+1,q+NJ+2);}for(let j=0;j<4;j++){const q=i*5+j;FI.push(q,q+5,q+1,q+1,q+5,q+6);}}}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));g.setIndex(I);g.computeVertexNormals();
      G.add(new THREE.Mesh(g,mat));
      if(floor){const f=new THREE.BufferGeometry();f.setAttribute('position',new THREE.Float32BufferAttribute(FP,3));f.setIndex(FI);f.computeVertexNormals();
        const uv=[];for(let k=0;k<FP.length/3;k++)uv.push(FP[k*3]*.25,FP[k*3+2]*.25);f.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const m=new THREE.Mesh(f,floorMat);m.receiveShadow=true;G.add(m);}}}
  sweep(BR,p=>bRegionH(p.s),wallMat,true);
  for(const S of BSPURS){const pts=[];const L=Math.hypot(S.b[0]-S.a[0],S.b[1]-S.a[1]),n=Math.ceil(L/1.5);for(let k=0;k<=n;k++){const t=k/n;pts.push({x:S.a[0]+(S.b[0]-S.a[0])*t,z:S.a[1]+(S.b[1]-S.a[1])*t,y:S.a[2]+(S.b[2]-S.a[2])*t,hw:S.hw,s:k*1.5});}sweep(pts,()=>7.5,wallMat,true);}
  // --- a room: walls of panels round it (none where a passage comes in), a domed roof, a flat floor
  function roomShell(cx,cz,y,rx,rz,wallH,capH,mat,opts){opts=opts||{};const R1=Math.max(rx,rz),NA=Math.max(28,Math.ceil(Math.PI*2*R1/2.2)),rows=[-2.5,wallH*.35,wallH*.7,wallH],P=[],Cc=[],UV=[],I=[];
    const open=a=>{const ox=cx+Math.cos(a)*(rx+1.8),oz=cz+Math.sin(a)*(rz+1.8);if(opts.skip&&opts.skip(a))return true;return belowD(ox,oz)<-.4;};
    for(let i=0;i<=NA;i++){const a=i/NA*Math.PI*2;for(const ry of rows){const n=vnoise(Math.cos(a)*R1*.2+ry*.15,Math.sin(a)*R1*.2),k=1+(opts.smooth?.01:.08)*(n-.5);
        P.push(cx+Math.cos(a)*(rx+1.6)*k,y+ry,cz+Math.sin(a)*(rz+1.6)*k);const sh=.55+.45*n;Cc.push(.2*sh,.19*sh,.24*sh);UV.push(a*R1/4,ry/4);}}
    for(let i=0;i<NA;i++){const am=(i+.5)/NA*Math.PI*2;if(open(am))continue;for(let r=0;r<rows.length-1;r++){const q=i*rows.length+r;pushQuad(I,q,q+rows.length,q+1,q+rows.length+1);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));g.setIndex(I);g.computeVertexNormals();
    G.add(new THREE.Mesh(g,mat));
    const cap=new THREE.Mesh(new THREE.SphereGeometry(1,40,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:C(0x1c1b22),side:THREE.BackSide,roughness:.85,map:detailTex}));
    cap.scale.set(rx+1.7,capH,rz+1.7);cap.position.set(cx,y+wallH-.2,cz);G.add(cap);
    if(!opts.noFloor){const f=new THREE.Mesh(new THREE.CircleGeometry(1,48),floorMat);f.rotation.x=-Math.PI/2;f.scale.set(rx+2.2,rz+2.2,1);f.position.set(cx,y+.015,cz);f.receiveShadow=true;G.add(f);}}
  for(const R0 of BROOMS)roomShell(R0.x,R0.z,R0.y,R0.r,R0.r,R0.side?9:14,R0.side?4:8,wallMat);
  roomShell(VAULT.x,VAULT.z,VAULT.y,VAULT.rx,VAULT.rz,20,22,wallMat);
  BELOW.lamps=[];BELOW.cellsAt=[];
  const glowAdd=(x,y,z,hex,k,size)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(hex).multiplyScalar(k),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s.scale.setScalar(size);s.position.set(x,y,z);G.add(s);return s;};
  const solid=new Merger(),glowM=new Merger();
  const metal=C(0x55565e),dark=C(0x07060a),bar=C(0x8e909c),gold=C(0xd9b25a),purp=C(0xb46aff),lampC=C(0xdde8ff);
  // --- the prison: cells two tiers high (three in the vault), set into the rock along the gallery and round the vault
  function cell(x,y,z,ry){const T=(px,py,pz)=>new THREE.Matrix4().makeRotationY(ry).setPosition(x,y,z).multiply(new THREE.Matrix4().makeTranslation(px,py,pz));
    solid.add(boxUV(3.7,3.5,2.6,2),T(0,1.75,-1.35),dark);                     // the dark inside (behind the bars)
    for(const [w,h,px,py] of[[4.2,.28,0,3.6],[4.2,.24,0,.12],[.3,3.7,-2,1.85],[.3,3.7,2,1.85]])solid.add(boxUV(w,h,.34,1),T(px,py,0),metal);
    for(let b=0;b<7;b++)solid.add(new THREE.BoxGeometry(.07,3.3,.07),T(-1.6+b*.53,1.8,.05),bar);
    glowM.add(new THREE.BoxGeometry(3.5,.06,.06),T(0,3.42,.12),purp);}
  function cellRow(x,y,z,ry,tiers){for(let t=0;t<tiers;t++){const yy=y+t*4.3;cell(x,yy,z,ry);
      if(t>0){const T=new THREE.Matrix4().makeRotationY(ry).setPosition(x,yy,z);solid.add(boxUV(4.4,.22,1.4,2),T.clone().multiply(new THREE.Matrix4().makeTranslation(0,-.1,.62)),metal);
        solid.add(new THREE.BoxGeometry(4.4,.06,.06),T.clone().multiply(new THREE.Matrix4().makeTranslation(0,1.05,1.25)),bar);}}
    BELOW.cellsAt.push(new THREE.Vector3(x,y,z));}
  for(let s=10;s<BS.vaultIn-6;s+=5.4){const p=belowPt(s),q=belowPt(s+1.5),tx=q.x-p.x,tz=q.z-p.z,tl=Math.hypot(tx,tz)||1,nx=-tz/tl,nz=tx/tl,hw=BR[Math.min(BR.length-1,Math.round(s/1.5))].hw||6;
    for(const side of[-1,1]){const wx=p.x+nx*side*(hw+1.7),wz=p.z+nz*side*(hw+1.7);if(bRoomAt(wx,wz,3)||belowD(wx+nx*side*3,wz+nz*side*3)<0)continue;
      if(s>88&&s<112&&side<0)continue;   // the names wall
      cellRow(wx,p.y,wz,Math.atan2(-nx*side,-nz*side),2);}}
  for(let i=0;i<64;i++){const a=i/64*Math.PI*2,x=VAULT.x+Math.cos(a)*(VAULT.rx+.4),z=VAULT.z+Math.sin(a)*(VAULT.rz+.4);
    if(belowD(VAULT.x+Math.cos(a)*(VAULT.rx+4),VAULT.z+Math.sin(a)*(VAULT.rz+4))<0)continue;const nx=Math.cos(a)/VAULT.rx,nz=Math.sin(a)/VAULT.rz;cellRow(x,VAULT.y,z,Math.atan2(-nx,-nz),3);}
  // --- the vault: watchtowers, cell stacks standing on the floor, crane gantries overhead, crates. Solid, and cover
  const RECTS=window.RECTS;
  for(const [dx,dz] of[[-40,-30],[34,-34],[-22,30],[40,26]]){const x=VAULT.x+dx,z=VAULT.z+dz;solid.add(boxUV(4,15,4,2),M(x,VAULT.y+7.5,z),C(0x3a3a44));solid.add(boxUV(7,.5,7,2),M(x,VAULT.y+15.2,z),metal);
    for(const ox of[-3.3,3.3])for(const oz of[-3.3,3.3])solid.add(new THREE.BoxGeometry(.12,1.2,.12),M(x+ox,VAULT.y+16,z+oz),bar);
    glowM.add(new THREE.BoxGeometry(1.6,.6,1.6),M(x,VAULT.y+14.4,z),lampC);BELOW.lamps.push({x,y:VAULT.y+13.6,z,big:1});glowAdd(x,VAULT.y+14.4,z,0xdde8ff,1.2,4.5);
    RECTS.push({x,z,hw:2,hd:2,ry:0,y0:VAULT.y,h:15});}
  for(const [dx,dz,ry] of[[-8,-14,.3],[18,8,-.5],[-30,6,1.2],[6,34,.1]]){const x=VAULT.x+dx,z=VAULT.z+dz;
    for(const s of[-1,1]){cellRow(x+Math.cos(ry)*0+Math.sin(ry)*s*1.6,VAULT.y,z+Math.cos(ry)*s*1.6,ry+(s<0?Math.PI:0),2);}
    solid.add(boxUV(4.4,.4,3.4,2),T0(x,VAULT.y+8.8,z,ry),metal);RECTS.push({x,z,hw:2.3,hd:3.1,ry,y0:VAULT.y,h:8.8});}
  function T0(x,y,z,ry){return new THREE.Matrix4().makeRotationY(ry).setPosition(x,y,z);}
  for(const [x0,z0,x1,z1] of[[-60,-40,60,-40],[-50,18,46,40]]){const ax=VAULT.x+x0,az=VAULT.z+z0,bx=VAULT.x+x1,bz=VAULT.z+z1,L=Math.hypot(bx-ax,bz-az),ry=Math.atan2(-(bz-az),bx-ax);
    solid.add(boxUV(L,1.2,1.6,2),T0((ax+bx)/2,VAULT.y+19,(az+bz)/2,ry),metal);
    for(let k=0;k<5;k++){const u=(k+.5)/5;const x=ax+(bx-ax)*u,z=az+(bz-az)*u;solid.add(new THREE.CylinderGeometry(.06,.06,6,4),M(x,VAULT.y+15.5,z),bar);solid.add(boxUV(2.2,1.6,2.2,2),M(x,VAULT.y+11.8,z),C(0x3a3640));}}
  for(let i=0;i<12;i++){const a=i*2.4,r=R(14,44),x=VAULT.x+Math.cos(a)*r*1.1,z=VAULT.z+Math.sin(a)*r*.8;if(belowD(x,z)>-4)continue;if(RECTS.some(Rb=>Math.hypot(Rb.x-x,Rb.z-z)<7))continue;addCrate(x,z,R(1.2,1.8));}
  // --- the names on the wall in the gallery: hundreds, and one you will not want to read
  {const cv=document.createElement('canvas');cv.width=2048;cv.height=768;const x=cv.getContext('2d');x.fillStyle='#29262e';x.fillRect(0,0,2048,768);
    for(let i=0;i<900;i++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.03)';x.beginPath();x.arc(Math.random()*2048,Math.random()*768,2+Math.random()*30,0,7);x.fill();}
    const SUR=['ADEYEMI','ALCOTT','BRANDT','CALLOWAY','DARROW','EKWUEME','FARRIS','GALLO','HAYES','IVERS','JANSEN','KOVAC','LANDRY','MARSH','NAKAMURA','OKAFOR','PRUITT','QUINLAN','REYES','SATO','THORNE','VANCE','WEBER','YOUNG','ZIMMER','BLACKWOOD','DUBOIS','FONTAINE','GRAVES','HOLLOWAY','KESTREL','MERCER','NOVAK','ORLOV','ROURKE','TALLIS','VOSS','WINTERS','BELLAMY','CROSS','DRAKE','FINCH','HALE','KANE','LOCKE','MORROW','NASH','STROUD'];
    const RK=['PVT','CPL','SGT','SPC','LT','ENS','CPL','PVT'];let k=0;x.textAlign='center';
    for(let row=0;row<15;row++)for(let col=0;col<9;col++){k++;let n=RK[k*7%RK.length]+'. '+'ABCDEFGHJKLMNPRSTW'[k*5%18]+'. '+SUR[k*11%SUR.length],big=false;
      if(row===6&&col===4){n='CPT. A. RHEN';big=true;}else if(row===6&&col===3)n='SGT. O. MARSH';else if(row===7&&col===4)n='ENS. P. LANDRY';
      const px=114+col*228+(row%2)*30,py=48+row*49;x.font=(big?'600 34px':'600 24px')+' "Chakra Petch",sans-serif';x.fillStyle='rgba(255,255,255,.08)';x.fillText(n,px+2,py+2);x.fillStyle='rgba(6,6,8,.9)';x.fillText(n,px,py);
      x.font='500 14px monospace';x.fillStyle='rgba(6,6,8,.75)';x.fillText(row<5?String(2190+k*7%47):'08.03.2237',px,py+17);}
    x.font='600 9px "Chakra Petch",sans-serif';x.fillStyle='rgba(6,6,8,.85)';x.fillText('LT. M. HALL · 16.03.2237',1940,756);
    const g=x.createRadialGradient(1024,384,200,1024,384,1050);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=g;x.fillRect(0,0,2048,768);
    const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;
    const s=100,p=belowPt(s),p2=belowPt(s+1.5),dx=p2.x-p.x,dz=p2.z-p.z,l=Math.hypot(dx,dz),nx=-dz/l,nz=dx/l,hw=6.6;
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(16,6),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.7,depthWrite:false}));
    wall.position.set(p.x-nx*(hw+1.6),p.y+3.2,p.z-nz*(hw+1.6));wall.lookAt(p.x,p.y+3.2,p.z);G.add(wall);BELOW.names=wall;BELOW.namesAt=new THREE.Vector3(p.x-nx*hw,p.y,p.z-nz*hw);
    const nl=new THREE.PointLight(C(0xffd8a0),.9,18,1.6);nl.position.set(p.x-nx*(hw-2),p.y+5,p.z-nz*(hw-2));G.add(nl);BELOW.lights.push(nl);}
  // --- lamps hung on chains along the whole way, every 18 m, and a ring of them in every room
  for(let s=4;s<BTOT-4;s+=18){const p=belowPt(s);if(bRoomAt(p.x,p.z,0))continue;const top=p.y+bRegionH(s)*.95,y=top-3.2;
    solid.add(new THREE.CylinderGeometry(.04,.04,3,4),M(p.x,top-1.5,p.z),bar);solid.add(new THREE.CylinderGeometry(.55,.3,.5,8),M(p.x,y+.3,p.z),metal);
    glowM.add(new THREE.SphereGeometry(.26,8,6),M(p.x,y,p.z),lampC);glowAdd(p.x,y,p.z,0xdde8ff,.9,2.2);BELOW.lamps.push({x:p.x,y,z:p.z});}
  for(const R0 of[...BROOMS,{x:VAULT.x,z:VAULT.z,y:VAULT.y,r:40}]){const n=R0.side?1:R0.r>30?6:4,rr=R0.side?0:R0.r*.5;
    for(let k=0;k<n;k++){const a=k/n*Math.PI*2+.4,x=R0.x+Math.cos(a)*rr,z=R0.z+Math.sin(a)*rr*(R0===undefined?1:1),top=R0.y+(R0.side?9.5:R0.r>30?24:15),y=top-4;
      solid.add(new THREE.CylinderGeometry(.04,.04,4,4),M(x,top-2,z),bar);solid.add(new THREE.CylinderGeometry(.7,.35,.6,8),M(x,y+.35,z),metal);
      glowM.add(new THREE.SphereGeometry(.32,8,6),M(x,y,z),lampC);glowAdd(x,y,z,0xdde8ff,1,2.8);BELOW.lamps.push({x,y,z});}}
  // floodlight masts round the vault floor, pointed in
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3,x=VAULT.x+Math.cos(a)*(VAULT.rx-8),z=VAULT.z+Math.sin(a)*(VAULT.rz-7);if(belowD(x,z)>-2)continue;
    solid.add(new THREE.CylinderGeometry(.25,.35,12,6),M(x,VAULT.y+6,z),metal);solid.add(boxUV(2.4,1.4,.8,2),T0(x,VAULT.y+12.4,z,Math.atan2(VAULT.x-x,VAULT.z-z)),C(0x2a2a30));
    glowM.add(new THREE.BoxGeometry(2,1,.1),T0(x-Math.cos(a)*.45,VAULT.y+12.4,z-Math.sin(a)*.45,Math.atan2(VAULT.x-x,VAULT.z-z)),lampC);glowAdd(x-Math.cos(a)*.8,VAULT.y+12.4,z-Math.sin(a)*.8,0xe8f0ff,1.3,6);
    OBST.push({x,z,r:.5,h:12});}
  // --- shields: Hollow barrier posts, a sheet of purple light over a low plate. Cover for you, cover for them
  const shieldMat=new THREE.MeshBasicMaterial({color:C(0x9a5aff),map:BELOW_LIGHT_TEX(),transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  BELOW.shieldMat=shieldMat;
  function shieldPost(x,z,ry,w){w=w||3.4;const y=belowFloor(x,z);solid.add(boxUV(w,.7,.8,2),T0(x,y+.35,z,ry),C(0x26222c));glowM.add(new THREE.BoxGeometry(w*.96,.08,.1),T0(x,y+.72,z,ry),purp);
    const pane=new THREE.Mesh(new THREE.PlaneGeometry(w,1.2),shieldMat);pane.position.set(x,y+1.3,z);pane.rotation.y=ry;G.add(pane);
    const n=Math.max(1,Math.round(w/1.3));for(let i=0;i<n;i++){const u=(i+.5)/n-.5;OBST.push({x:x+Math.cos(ry)*u*w,z:z-Math.sin(ry)*u*w,r:.7,h:1.9,bar:true});}
    BARS.push({ax:x-Math.cos(ry)*w/2,az:z+Math.sin(ry)*w/2,bx:x+Math.cos(ry)*w/2,bz:z-Math.sin(ry)*w/2,r:.7});}
  const rp=id=>BROOMS.find(R0=>R0.id===id);
  {const c=rp('cp9');shieldPost(c.x-5,c.z-3,.4);shieldPost(c.x+5,c.z+2,-.5);shieldPost(c.x,c.z+7,0,4);}
  {const c=rp('gate');shieldPost(c.x-6,c.z+4,1.1);shieldPost(c.x+2,c.z+8,.2,4);shieldPost(c.x-2,c.z-6,-.3);}
  {const cx=VAULT.x-28,cz=VAULT.z+40;for(const [dx,dz,ry] of[[-8,-6,.6],[2,-10,0],[10,-4,-.6],[-2,4,.1]])shieldPost(cx+dx,cz+dz,ry,4);}
  {const c=rp('mouth');shieldPost(c.x-5,c.z+4,.2,4);shieldPost(c.x+5,c.z+3,-.2,4);shieldPost(c.x,c.z-4,0,3);}
  for(const [dx,dz,ry] of[[-41,8,1.57],[-41,-8,1.57],[8,-41,0],[-8,-41,0]])shieldPost(BCH.x+dx,BCH.z+dz,ry,3);
  // cover in the rooms: rubble
  for(const R0 of BROOMS){if(R0.side||R0.alc!=null)continue;for(let k=0;k<4;k++){const a=k*1.7+R0.r,r=R0.r*R(.35,.7),x=R0.x+Math.cos(a)*r,z=R0.z+Math.sin(a)*r;if(belowD(x,z)<-2&&!OBST.some(o=>Math.hypot(o.x-x,o.z-z)<3))addRock(x,z,R(.8,1.4));}}
  // --- seals: walls of light across the way on, until a holdout is done
  function seal(id,s,w){const p=belowPt(s),q=belowPt(s+1.5),tx=q.x-p.x,tz=q.z-p.z,tl=Math.hypot(tx,tz)||1;
    const ww=w||16,m=new THREE.Mesh(new THREE.PlaneGeometry(ww,9),new THREE.MeshBasicMaterial({color:C(0xa868ff),map:BELOW_LIGHT_TEX(),transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    m.position.set(p.x,p.y+4.5,p.z);m.rotation.y=Math.atan2(tx,tz);G.add(m);const obs=[];const nx=-tz/tl,nz=tx/tl;
    for(let k=-ww/2;k<=ww/2;k+=1.1){const o={x:p.x+nx*k,z:p.z+nz*k,r:.75,h:9};OBST.push(o);obs.push(o);}
    BELOW.seals[id]={m,obs,open:0};}
  seal('cp9',BS.cp9+16,16);seal('mouth',BTOT-6,14);
  // --- the inner gate: two great slabs between the gate room and the vault
  {const s=BS.gate+18,p=belowPt(s),q=belowPt(s+1.5),ry=Math.atan2(q.x-p.x,q.z-p.z),gm=new THREE.MeshStandardMaterial({color:C(0x2a2430),roughness:.4,metalness:.65,map:panelTex});
    const gg=new THREE.Group();gg.position.set(p.x,p.y,p.z);gg.rotation.y=ry;G.add(gg);const slabs=[];
    for(const sd of[-1,1]){const sl=new THREE.Mesh(new THREE.BoxGeometry(8,12,1.2),gm);sl.position.set(sd*4,6,0);gg.add(sl);const seam=new THREE.Mesh(new THREE.BoxGeometry(.16,11,1.3),new THREE.MeshBasicMaterial({color:C(HOLLOW_GLOW).multiplyScalar(2),toneMapped:false}));seam.position.set(sd*-.1,6,0);sl.add(seam);slabs.push({m:sl,sd});}
    const fr=new THREE.Mesh(new THREE.BoxGeometry(18,1.6,2),gm);fr.position.y=12.6;gg.add(fr);for(const sd of[-1,1]){const pl=new THREE.Mesh(new THREE.BoxGeometry(1.6,13,2),gm);pl.position.set(sd*8.6,6.5,0);gg.add(pl);}
    seal('gate',s,16);BELOW.seals.gate.m.visible=false;BELOW.innerGate={slabs,u:0};}
  // --- the cage over the descent: bars drop across the way out of the vault; a winch lifts it
  {const s=BS.vaultOut+4,p=belowPt(s),q=belowPt(s+1.5),ry=Math.atan2(q.x-p.x,q.z-p.z),cg=new THREE.Group();cg.position.set(p.x,p.y,p.z);cg.rotation.y=ry;G.add(cg);
    const cm=new Merger();for(let k=-7;k<=7;k+=.9)cm.add(new THREE.BoxGeometry(.14,9,.14),M(k,4.5,0),bar);for(const y of[.4,3,6,8.8])cm.add(boxUV(15,.3,.3,1),M(0,y,0),metal);
    const cage=new THREE.Mesh(cm.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.7,map:panelTex}));cg.add(cage);
    seal('cage',s,15);BELOW.seals.cage.m.visible=false;BELOW.cage={m:cage,u:0};}
  // --- the outer door at the cave mouth: Daro cuts it from the other side
  {const p=belowPt(BTOT-3),q=belowPt(BTOT-1.5),ry=Math.atan2(q.x-p.x,q.z-p.z),dg=new THREE.Group();dg.position.set(p.x,p.y,p.z);dg.rotation.y=ry;G.add(dg);
    const dm=new THREE.Mesh(new THREE.BoxGeometry(11,9,1),new THREE.MeshStandardMaterial({color:C(0x2a2430),roughness:.45,metalness:.6,map:panelTex}));dm.position.y=4.5;dg.add(dm);
    const cut=new THREE.Mesh(new THREE.TorusGeometry(2.2,.08,6,40,0.01),new THREE.MeshBasicMaterial({color:C(0xffb050).multiplyScalar(3),toneMapped:false}));cut.position.set(0,2.6,-.6);dg.add(cut);
    BELOW.outerDoor={g:dg,m:dm,cut,u:0};}
  // --- doors in the walls (where the Host come out of)
  BELOW.doors={};
  function roomDoors(id,n,a0){const R0=rp(id)||{x:VAULT.x,z:VAULT.z,y:VAULT.y,r:Math.min(VAULT.rx,VAULT.rz)};const out=[];let a=a0||0,tries=0;
    while(out.length<n&&tries<80){tries++;a+=Math.PI*2/(n*3)+.17;const rx=id==='vault'?VAULT.rx:R0.r,rz=id==='vault'?VAULT.rz:R0.r,x=R0.x+Math.cos(a)*(rx+1.4),z=R0.z+Math.sin(a)*(rz+1.4);
      if(belowD(R0.x+Math.cos(a)*(rx+4),R0.z+Math.sin(a)*(rz+4))<0)continue;if(out.some(o=>Math.hypot(o.x-x,o.z-z)<8))continue;
      DOORS.add('bunker',x,R0.y+.82,z,-Math.cos(a),-Math.sin(a),{light:true,s:id==='vault'?1.4:1.15});out.push({x:R0.x+Math.cos(a)*(rx-2.5),z:R0.z+Math.sin(a)*(rz-2.5)});}
    BELOW.doors[id]=out;}
  roomDoors('cp9',3,.5);roomDoors('gate',3,2.2);roomDoors('vault',6,.2);roomDoors('pump',2,1);roomDoors('chain',2,3);roomDoors('ward',2,5);roomDoors('mouth',3,1.4);
  for(let s=24;s<BTOT;s+=46){const p=belowPt(s),q=belowPt(s+1.5);if(bRoomAt(p.x,p.z,4))continue;const tx=q.x-p.x,tz=q.z-p.z,tl=Math.hypot(tx,tz)||1,sd=(s/46|0)%2?1:-1,nx=-tz/tl*sd,nz=tx/tl*sd,hw=BR[Math.round(s/1.5)]?BR[Math.round(s/1.5)].hw:6;
    if(s>BS.vaultIn&&s<BS.vaultOut)continue;if(belowD(p.x+nx*(hw+4),p.z+nz*(hw+4))<0)continue;DOORS.add('bunker',p.x+nx*(hw+1.8),p.y+.82,p.z+nz*(hw+1.8),-nx,-nz,{light:(s/46|0)%3!==1});}
  DOORS.build(G);
  const sm=new THREE.Mesh(solid.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.55,map:panelTex}));sm.castShadow=false;sm.receiveShadow=true;G.add(sm);
  G.add(new THREE.Mesh(glowM.build(),new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false})));
  // --- the light pool: a few real lights that follow the nearest lamps (the lamps themselves glow on their own)
  for(let i=0;i<6;i++){const l=new THREE.PointLight(C(0xdde8ff),0,30,1.3);G.add(l);BELOW.pool.push(l);}
  BELOW.vaultL=[];for(const [dx,dz] of[[-25,-10],[25,10]]){const l=new THREE.PointLight(C(0xd8e4ff),1.1,120,1.1);l.position.set(VAULT.x+dx,VAULT.y+18,VAULT.z+dz);G.add(l);BELOW.vaultL.push(l);}
  buildDome(G,stoneMat,floorMat);
  // your torch
  const sp=new THREE.SpotLight(C(0xffeedd),1.2,40,.42,.6,1.5);scene.add(sp,sp.target);sp.visible=false;BELOW.spot=sp;
  G.visible=false;
}

/* ---------- the Codex Dome: stone walls with gold ribs, a rim walk, a chasm, two bridges to the platform, glass onto the sea ---------- */
function buildDome(G,stoneMat,floorMat){
  const SR=BCH.r+1.6,deep=1.05;
  // the walls: dressed stone panels round the rim, none where a way comes in or where the glass is (east)
  {const NA=110,rows=[-3,6,12,19],P=[],Cc=[],UV=[],I=[];
    for(let i=0;i<=NA;i++){const a=i/NA*Math.PI*2;for(const ry of rows){P.push(BCH.x+Math.cos(a)*SR,BCH.y+ry,BCH.z+Math.sin(a)*SR);Cc.push(.55,.52,.58);UV.push(a*SR/5,ry/5);}}
    for(let i=0;i<NA;i++){const am=(i+.5)/NA*Math.PI*2,an=Math.atan2(Math.sin(am),Math.cos(am));if(Math.abs(an)<deep/2)continue;if(belowD(BCH.x+Math.cos(am)*(SR+.6),BCH.z+Math.sin(am)*(SR+.6))<-.3)continue;
      for(let r=0;r<rows.length-1;r++){const q=i*rows.length+r;I.push(q,q+rows.length,q+1,q+rows.length,q+rows.length+1,q+1);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));g.setIndex(I);g.computeVertexNormals();
    G.add(new THREE.Mesh(g,stoneMat));}
  const roof=new THREE.Mesh(new THREE.SphereGeometry(SR,48,14,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:C(0x1c1b22),side:THREE.BackSide,roughness:.8}));roof.scale.y=.55;roof.position.set(BCH.x,BCH.y+19,BCH.z);G.add(roof);
  // the rim, the platform, the bridges; the chasm under them
  const rim=new THREE.Mesh(new THREE.RingGeometry(BCH.rim,SR+.4,96,1),floorMat);rim.rotation.x=-Math.PI/2;rim.position.set(BCH.x,BCH.y+.015,BCH.z);G.add(rim);
  const lip=new THREE.Mesh(new THREE.CylinderGeometry(BCH.rim,BCH.rim,1.2,96,1,true),new THREE.MeshStandardMaterial({color:C(0x8a8290),roughness:.5,metalness:.4,side:THREE.DoubleSide}));lip.position.set(BCH.x,BCH.y-.6,BCH.z);G.add(lip);
  const pit=new THREE.Mesh(new THREE.CylinderGeometry(BCH.rim,BCH.rim*.7,48,64,1,true),new THREE.MeshStandardMaterial({color:C(0x0a0910),side:THREE.BackSide,roughness:.95,map:detailTex}));pit.position.set(BCH.x,BCH.y-24.5,BCH.z);G.add(pit);
  const deepGlow=new THREE.Mesh(new THREE.CircleGeometry(BCH.rim*.7,48),new THREE.MeshBasicMaterial({color:C(0x3a1a6a),toneMapped:false}));deepGlow.rotation.x=-Math.PI/2;deepGlow.position.set(BCH.x,BCH.y-48,BCH.z);G.add(deepGlow);
  const platMat=new THREE.MeshStandardMaterial({color:C(0x3a3640),roughness:.55,metalness:.35,map:panelTex});
  const plat=new THREE.Mesh(new THREE.CylinderGeometry(BCH.plat+.4,BCH.plat-2,5,48),platMat);plat.position.set(BCH.x,BCH.y-2.5,BCH.z);G.add(plat);
  const gold=new THREE.MeshStandardMaterial({color:C(0xd9b25a),emissive:C(0x3a2808),metalness:.9,roughness:.28});
  const edge=new THREE.MeshBasicMaterial({color:C(0x7fb6ff).multiplyScalar(1.6),toneMapped:false});
  for(const [ax,az] of[[-1,0],[0,-1]]){const L=BCH.rim-BCH.plat+1.6,cx=BCH.x+ax*(BCH.plat+L/2-.8),cz=BCH.z+az*(BCH.plat+L/2-.8);
    const b=new THREE.Mesh(new THREE.BoxGeometry(ax?L:BCH.bw*2+.4,1.2,ax?BCH.bw*2+.4:L),platMat);b.position.set(cx,BCH.y-.6,cz);G.add(b);
    for(const sd of[-1,1]){const e=new THREE.Mesh(new THREE.BoxGeometry(ax?L:.1,.08,ax?.1:L),edge);e.position.set(cx+(ax?0:sd*BCH.bw),BCH.y+.06,cz+(ax?sd*BCH.bw:0));G.add(e);
      const rl=new THREE.Mesh(new THREE.BoxGeometry(ax?L:.08,.08,ax?.08:L),gold);rl.position.set(cx+(ax?0:sd*(BCH.bw+.1)),BCH.y+1.05,cz+(ax?sd*(BCH.bw+.1):0));G.add(rl);}}
  for(const r of[5.2,8.4,10.6]){const t=new THREE.Mesh(new THREE.RingGeometry(r,r+.12,96),gold);t.rotation.x=-Math.PI/2;t.position.set(BCH.x,BCH.y+.03,BCH.z);G.add(t);}
  // pillars with strips of light round the rim, gold ribs up the dome
  const pm=new THREE.MeshStandardMaterial({color:C(0x4a4450),roughness:.55,metalness:.4,map:panelTex}),lm=new THREE.MeshBasicMaterial({color:C(0x7fb6ff).multiplyScalar(1.4),toneMapped:false});
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2,an=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(an)<deep/2+.05)continue;if(belowD(BCH.x+Math.cos(a)*(SR+.6),BCH.z+Math.sin(a)*(SR+.6))<1)continue;
    const col=new THREE.Mesh(new THREE.BoxGeometry(1.6,19,1.6),pm);col.position.set(BCH.x+Math.cos(a)*(SR-.7),BCH.y+9.5,BCH.z+Math.sin(a)*(SR-.7));col.rotation.y=-a;G.add(col);
    const str=new THREE.Mesh(new THREE.BoxGeometry(.12,14,.12),lm);str.position.set(BCH.x+Math.cos(a)*(SR-1.55),BCH.y+8,BCH.z+Math.sin(a)*(SR-1.55));G.add(str);
    OBST.push({x:BCH.x+Math.cos(a)*(SR-.7),z:BCH.z+Math.sin(a)*(SR-.7),r:1,h:19});}
  for(let i=0;i<18;i++){const rib=new THREE.Mesh(new THREE.TorusGeometry(SR*.99,.16,5,24,Math.PI/2),gold);rib.rotation.set(0,i/18*Math.PI*2,Math.PI/2);rib.scale.set(1,.55,1);rib.position.set(BCH.x,BCH.y+19,BCH.z);G.add(rib);}
  // a ring of lights round the dome's rim, high up
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2,s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xfff0c8).multiplyScalar(1.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    s.scale.setScalar(4);s.position.set(BCH.x+Math.cos(a)*(SR-2),BCH.y+17,BCH.z+Math.sin(a)*(SR-2));G.add(s);BELOW.lamps.push({x:s.position.x,y:s.position.y,z:s.position.z});}
  // the chamber group: local frame as before (the sea at -z), turned so the sea is east
  const ch=new THREE.Group();ch.position.set(BCH.x,BCH.y,BCH.z);ch.rotation.y=-Math.PI/2;G.add(ch);BELOW.ch=ch;
  {const g0=Math.PI-deep/2,GR=SR-.2;
    const gm=new THREE.MeshStandardMaterial({color:C(0x4a9ac0),roughness:.05,metalness:.6,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false});
    const glass=new THREE.Group();ch.add(glass);const pane=new THREE.Mesh(new THREE.CylinderGeometry(GR,GR,22,32,1,true,g0,deep),gm);pane.position.y=8;glass.add(pane);
    for(let k=0;k<=7;k++){const a=g0+deep*k/7,m=new THREE.Mesh(new THREE.BoxGeometry(.3,22,.3),gold);m.position.set(Math.sin(a)*GR,8,Math.cos(a)*GR);glass.add(m);}
    BELOW.glass=glass;BELOW.glassAt=new THREE.Vector3(0,6,-GR);
    const sill=new THREE.Mesh(new THREE.CylinderGeometry(GR,GR,1.4,32,1,true,g0,deep),new THREE.MeshStandardMaterial({color:C(0x8a8290),roughness:.5,side:THREE.DoubleSide}));sill.position.y=-.7;ch.add(sill);}
  const SEA=-SR-74;
  const pitS=new THREE.Mesh(new THREE.SphereGeometry(110,32,16),new THREE.MeshStandardMaterial({color:C(0x0a1418),side:THREE.BackSide,roughness:.9,map:detailTex}));pitS.position.set(0,6,SEA);ch.add(pitS);
  const sea=LEVIATHAN.makeWater(170,140,0x031a22);sea.mesh.position.set(0,-3,SEA);ch.add(sea.mesh);
  const lev=LEVIATHAN.makeLeviathan();lev.root.scale.setScalar(1.05);lev.root.position.set(0,-11,-SR-26);ch.add(lev.root);
  const levTop=new THREE.SpotLight(C(0x5ad0e0),0,110,.55,.7,1.2);levTop.position.set(0,30,-SR-22);levTop.target.position.set(0,-4,-SR-18);ch.add(levTop,levTop.target);BELOW.levTop=levTop;
  const deepL=new THREE.PointLight(C(0x2aa8c0),0,80,1.4);deepL.position.set(0,2,-SR-22);ch.add(deepL);
  const caust=new THREE.PointLight(C(0x3ac8e0),.6,50,1.6);caust.position.set(0,3,-SR+6);ch.add(caust);
  BELOW.eyes={o:0,to:0};BELOW.lev=lev;BELOW.sea=sea;BELOW.deepL=deepL;BELOW.caust=caust;BELOW.levZ=-SR-26;
  // the dome on its plinth, and the Codex turning inside it
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.9,1.4,28),new THREE.MeshStandardMaterial({color:C(0x2c2a30),roughness:.5,metalness:.4,map:panelTex}));plinth.position.y=.7;ch.add(plinth);
  OBST.push({x:BCH.x,z:BCH.z,r:3.4,h:1.4});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.05,.07,6,48),new THREE.MeshBasicMaterial({color:C(0x7fe3ff).multiplyScalar(2),toneMapped:false}));ring.rotation.x=Math.PI/2;ring.position.y=1.42;ch.add(ring);
  const domeMat=new THREE.MeshBasicMaterial({color:C(0x7fb6ff),transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(2.9,32,12,0,Math.PI*2,0,Math.PI/2),domeMat);dome.position.y=1.42;ch.add(dome);
  const wire=new THREE.Mesh(new THREE.SphereGeometry(2.92,16,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:C(0x7fd8ff),wireframe:true,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false}));wire.position.y=1.42;ch.add(wire);
  const codex=new THREE.Group();codex.position.y=3;ch.add(codex);const cg=new THREE.MeshStandardMaterial({color:C(0xd9b25a),emissive:C(0x6a4a10),roughness:.25,metalness:.9});
  for(let i=0;i<3;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(.9,.06,6,40),cg);t.rotation.set(i*1.05,i*.6,0);codex.add(t);}
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd890).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));core.scale.setScalar(1.1);codex.add(core);
  const cl=new THREE.PointLight(C(0xffd27a),1.2,24,1.8);cl.position.y=3.2;ch.add(cl);
  const bl=new THREE.PointLight(C(0x5a8cff),1.6,90,1.3);bl.position.y=16;ch.add(bl);BELOW.lights.push(bl,cl);
  BELOW.codex=codex;BELOW.dome={mat:domeMat,wire,ring,light:cl,core};
  MODELS.copy('dome').then(({scene:s})=>{
    const glassM=new THREE.MeshPhysicalMaterial({color:C(0x9fc8ff),transparent:true,opacity:.22,roughness:.05,metalness:0,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
    s.traverse(o=>{if(!o.isMesh)return;const n=(o.material.name||'')+o.name;
      if(/Glass/i.test(n)){o.material=glassM;o.renderOrder=2;o.castShadow=false;}else if(/Light/i.test(n))o.visible=false;
      else{o.material=o.material.clone();o.material.metalness=Math.min(o.material.metalness,.5);}});
    const {o,size}=MODELS.fit(s,{rx:Math.PI,size:6.3,axis:'x',floor:true});
    o.position.y=3-size.y*.75;ch.add(o);
    domeMat.visible=false;dome.visible=false;wire.visible=false;ring.visible=false;
    BELOW.dome.mat=glassM;BELOW.dome.glassK=.22/.1;BELOW.dome.model=o;}).catch(()=>{});
}

/* Oct 27: built behind the loading screen (hidden, exactly as the first trip down used to leave it), not at the gate. Building it there
   meant every new material in it compiled at once, and its lamps and Michael's torch changed the level's light counts, so every shader
   on the mountain compiled again too: a long freeze going down. Now its shaders are ready before Begin (see LIGHTPAD in progress.js). */
if(typeof PG!=='undefined'&&PG.warm)PG.warm(()=>{if(!BELOW.G)buildBelow();});

/* ---------- going down and coming back up: the light and the air change ---------- */
const UPSTAIRS={};
function setBelow(on){
  if(on===BELOW.on)return;BELOW.on=on;if(!BELOW.G)buildBelow();
  if(on){Object.assign(UPSTAIRS,{fog:scene.fog.color.clone(),dens:scene.fog.density,sun:sun.intensity,hemi:hemi.intensity,hc:hemi.color.clone(),fill:fill.intensity});
    // (Oct 26, Bryce: much, much more light down here) the fog is thinner and the cave has a cold fill of its own; the lamps do the rest
    scene.fog.color.set(C(0x07080e));scene.fog.density=.0105;sun.intensity=0;fill.intensity=0;hemi.intensity=.42;hemi.color.set(C(0x8a96c0));sky.visible=false;}
  else{scene.fog.color.copy(UPSTAIRS.fog);scene.fog.density=UPSTAIRS.dens;sun.intensity=UPSTAIRS.sun;fill.intensity=UPSTAIRS.fill;hemi.intensity=UPSTAIRS.hemi;hemi.color.copy(UPSTAIRS.hc);sky.visible=true;}
  scene.background=scene.fog.color;BELOW.G.visible=on;BELOW.spot.visible=on;
  hollowLamp.visible=lzLamp.visible=dust.visible=harbinger.visible=beam.visible=beamCore.visible=pulse.visible=!on;
}
function updateBelow(dt){
  if(!BELOW.on)return;
  const sp=BELOW.spot;sp.position.copy(camera.position);camera.getWorldDirection(BT);sp.target.position.copy(camera.position).addScaledVector(BT,12);
  if(CUTS.on)sp.position.copy(P.pos).add(BU.set(0,1.6,0)),sp.target.position.copy(P.pos).add(BU.set(-Math.sin(P.H.root.rotation.y)*10,1,-Math.cos(P.H.root.rotation.y)*10));
  sp.intensity=BELOW.flicker>0?(Math.random()<.4?.15:1.2):1.2;BELOW.flicker=Math.max(0,(BELOW.flicker||0)-dt);
  // the light pool follows the lamps nearest the camera (every quarter second)
  BELOW.poolT=(BELOW.poolT||0)-dt;if(BELOW.poolT<=0){BELOW.poolT=.25;const c=camera.position;const L=BELOW.lamps.map(l=>[(l.x-c.x)**2+(l.z-c.z)**2,l]).sort((a,b)=>a[0]-b[0]);
    BELOW.pool.forEach((l,i)=>{const q=L[i];if(!q){l.intensity=0;return;}l.position.set(q[1].x,q[1].y-.6,q[1].z);l.intensity=q[1].big?2.2:1.5;l.distance=q[1].big?55:30;});}
  const flick=BELOW.flicker>0&&Math.random()<.3;BELOW.pool.forEach(l=>l.visible=!flick);
  if(BELOW.shieldMat){BELOW.shieldMat.opacity=.16+.05*Math.sin(T*3.1);BELOW.shieldMat.map.offset.y=-T*.15;}
  for(const id in BELOW.seals){const S=BELOW.seals[id];if(S.m.visible)S.m.material.opacity=S.open?Math.max(0,S.m.material.opacity-dt*.4):.26+.06*Math.sin(T*4+id.length);if(S.open&&S.m.material.opacity<=0)S.m.visible=false;}
  if(BELOW.innerGate){const g=BELOW.innerGate;g.slabs.forEach(sl=>sl.m.position.x=sl.sd*(4+g.u*7.6));}
  if(BELOW.cage)BELOW.cage.m.position.y=BELOW.cage.u*10;
  if(BELOW.outerDoor){const D=BELOW.outerDoor;if(D.u!==D.lastU){D.lastU=D.u;D.cut.geometry.dispose();D.cut.geometry=new THREE.TorusGeometry(2.2,.08,6,40,Math.max(.01,Math.min(1,D.u)*Math.PI*2));}D.cut.visible=D.u>0&&D.u<1;
    if(D.u>0&&D.u<1&&rng()<dt*14){const p=D.g.localToWorld(BU.set(Math.cos(D.u*Math.PI*2)*2.2,2.6+Math.sin(D.u*Math.PI*2)*2.2,-.7));boom(p,R(.3,.6),0xffb050,.2);}
    if(D.u>=1)D.m.position.y=Math.max(-9,D.m.position.y-dt*3);}
  if(BELOW.codex){BELOW.codex.rotation.y+=dt*.6;BELOW.codex.rotation.x=Math.sin(T*.4)*.3;BELOW.dome.core.material.opacity=.8+.2*Math.sin(T*3);
    if(BELOW.takeT>=0){if(BELOW.glass&&BELOW.glass.visible){BELOW.glass.visible=false;const c=BELOW.ch.localToWorld(BELOW.glassAt.clone());for(let k=0;k<14;k++){boom(c.clone().add(BU.set(R(-2,2),R(-6,8),R(-12,12))),R(1.5,3.5),0x9fe8ff,.5);puff(c.clone().add(BU.set(R(0,4),R(-4,6),R(-10,10))),R(1.5,3),2);}if(typeof sfx!=='undefined'){sfx.explosion(c,1400);sfx.static&&sfx.static(.8);}}
      BELOW.takeT+=dt;const u=Math.min(1,BELOW.takeT/3.4),e=u*u*(3-2*u),lz=BELOW.levZ-2;
      BELOW.codex.position.set(0,3+Math.sin(e*Math.PI)*9-(u>.85?(u-.85)*40:0),e*lz);BELOW.codex.rotation.y+=dt*4*u;
      BELOW.dome.light.intensity=1.2*(1-e);BELOW.dome.mat.opacity=.1*(BELOW.dome.glassK||1)*(1-e);BELOW.dome.wire.material.opacity=.18*(1-e);BELOW.dome.ring.visible=u<.3&&!BELOW.dome.model;
      if(BELOW.lev){BELOW.lev.root.position.z=BELOW.levZ+Math.sin(Math.min(1,BELOW.takeT/2)*Math.PI*.5)*14-(u>.85?(u-.85)*60:0);}
      if(u>=1)BELOW.codex.visible=false;}}
  const E=BELOW.eyes;if(E&&BELOW.lev){E.o+=(E.to-E.o)*(1-Math.exp(-dt*(E.to>E.o?.9:2.5)));BELOW.lev.setEyes(E.o);BELOW.lev.setLights(E.o*.8);BELOW.lev.update(T,dt);
    BELOW.lev.root.position.y=-11+E.o*10.2;BELOW.deepL.intensity=E.o*3.2;BELOW.levTop.intensity=E.o*3;BELOW.sea.update(T);BELOW.caust.intensity=.45+.2*Math.sin(T*1.3)*Math.sin(T*2.1);}
  // the climb out: the mountain shakes, dust comes down
  if(BELOW.shake>0){BELOW.shake=Math.max(0,BELOW.shake-dt*.05);const q=BELOW.shake*(.35+.65*Math.pow(Math.max(0,Math.sin(T*.9)),6));camera.position.x+=Math.sin(T*23)*.012*q;camera.position.y+=Math.sin(T*31)*.01*q;
    if(rng()<dt*1.2*BELOW.shake){const p=P.pos.clone().add(BU.set(R(-5,5),R(5,8),R(-8,2)));puff(p,R(1.5,3),3);}}
}

/* ---------- the story below ---------- */
// at: 'vault' or 'dome' (checkpoints), 'deep' (test: just before the dome), 'escape' (test: the run out)
function enterBelow(at){
  setBelow(true);for(const A of ALLIES)A.on=false;
  let s=3;
  // (what's behind a checkpoint has already happened)
  if(at==='vault')['r1','r2','r3'].forEach(k=>BELOW.enc[k]=1);
  if(at==='dome'||at==='deep')['r1','r2','r3','v1','v2','v3','d1','d2','d3'].forEach(k=>BELOW.enc[k]=1);
  if(at==='vault'){s=BS.vaultIn+2;BELOW.done.cp9=BELOW.done.gate=1;openSeal('cp9',true);openSeal('gate',true);BELOW.innerGate.u=1;BELOW.stage=4;}
  if(at==='dome'||at==='deep'){s=at==='deep'?BLEN-6:BLEN-24;Object.assign(BELOW.done,{cp9:1,gate:1,cage:1});openSeal('cp9',true);openSeal('gate',true);openSeal('cage',true);BELOW.innerGate.u=1;BELOW.cage.u=1;BELOW.stage=9;}
  const s0=belowPt(s),s1=belowPt(s+3);P.pos.set(s0.x,s0.y,s0.z);P.yaw=Math.atan2(-(s1.x-s0.x),-(s1.z-s0.z));P.pitch=-.04;P.H.root.rotation.y=P.yaw;P.spawn.copy(P.pos);
  setPhase('below');
  // supplies along the way (more of them than the old tunnel: it is a long way down)
  for(const [ps,type,off] of[[60,'ammo',2],[130,'med',-3],[200,'rocket',2],[300,'ammo',-2],[BS.vaultIn+60,'med',3],[BS.vaultIn+150,'ammo',-3],[BS.vaultIn+240,'rocket',3],[BS.vaultOut+60,'med',2],[BS.vaultOut+150,'ammo',-2],[BLEN-12,'rocket',2]]){
    if(ps<s)continue;const p=belowPt(ps);addPick(type,p.x+off,p.z);}
  for(const R0 of BROOMS)if(R0.side&&R0.alc==null)addPick(R0.id==='armory'?'rocket':R0.id==='office'?'med':'ammo',R0.x,R0.z);
  if(at==='vault'||at==='dome')saveCP(at);
}
function openSeal(id,now){const S=BELOW.seals[id];if(!S||S.open)return;S.open=1;S.obs.forEach(o=>o.ghost=true);if(now)S.m.visible=false;
  if(!now&&typeof sfx!=='undefined'){if(sfx.door)sfx.door(S.m.position,'big',2);if(sfx.static)sfx.static(.4);}}
function closeSeal(id){const S=BELOW.seals[id];if(!S)return;S.open=0;S.obs.forEach(o=>o.ghost=false);S.m.visible=true;S.m.material.opacity=.4;}
// Michael's line and Master Veyr's voice on the way down (s: metres along the route). Draft lines; Bryce rewrites.
const BLINES=[
  [5,'Lt. Michael','I’m in. There’s light down here. Lamps, on chains. Someone keeps this place lit.'],
  [16,'Elias Veyr','We hear you, Michael. Keep this channel open. Sergeant Daro holds the door.'],
  [34,'Lt. Michael','Master, these are cells. Rows of them. Two high, all the way along.'],
  [44,'Elias Veyr','A prison. Under his mountain. Then he keeps more than the Codex down there.'],
  [70,'Captain Rhen?','You came. I knew you would come, Michael.','enemy'],
  [80,'Lt. Michael','Master, the voice is down here too. It’s closer.'],
  [86,'Elias Veyr','Then don’t answer it. Find the Codex and come back to us.'],
  [96,'Lt. Michael','There are names carved into the rock. Hundreds of them.'],
  [103,'Lt. Michael','Master... Captain Rhen’s name is here. Marsh. Landry. The whole Pathfinder crew.'],
  [110,'Elias Veyr','That isn’t possible. The Pathfinder never came here. Michael, those names can’t be—'],
  [230,'Elias Veyr','Michael, your signal is breaking up. The deeper you go, the less of you we hear.'],
  [BS.vaultIn+12,'Lt. Michael','Master... it opens out. It’s a vault. A stadium of cells. Floodlights on every wall.'],
  [BS.vaultIn+22,'Elias Veyr','How many cells?'],[BS.vaultIn+28,'Lt. Michael','I can’t count them. They’re all empty.'],
  [BS.vaultIn+130,'Captain Rhen?','We were kept here. Then we were not. Lower, Michael.','enemy'],
  [BS.vaultOut+30,'Lt. Michael','Going down. Pumps, chains. This is where they work the prison from.'],
  [BS.vaultOut+120,'Captain Rhen?','Lower. The light is lower. Come and see what we found.','enemy'],
  [BLEN-30,'Lt. Michael','There’s a dome ahead. A bridge over a drop. The Codex is in the middle of it.'],
];
// a pack of the Host: n troopers ahead of you at s, spread across the way (a heavy now and then)
function bPack(s,n,spread,opts){opts=opts||{};const out=[];for(let k=0;k<n+(OD.n||0);k++){const p=belowPt(s+k*(opts.step||4));const q=belowPt(s+k*(opts.step||4)+1.5),tx=q.x-p.x,tz=q.z-p.z,tl=Math.hypot(tx,tz)||1;
    const off=R(-spread,spread);const E=spawnTrooper(p.x-tz/tl*off,p.z+tx/tl*off,{hold:R(opts.h0||8,opts.h1||15),unit:opts.heavy&&k===0?'heavy':opts.cmd&&k===1?'commander':undefined});if(E)out.push(E);}return out;}
function bFromDoors(id,n,opts){const D=(BELOW.doors[id]||[]).slice().sort((a,b)=>Math.hypot(a.x-P.pos.x,a.z-P.pos.z)-Math.hypot(b.x-P.pos.x,b.z-P.pos.z)).slice(0,3);if(!D.length)return;
  for(let k=0;k<n;k++){const d=D[(k+(BELOW.doorK=(BELOW.doorK||0)+1))%D.length];spawnTrooper(d.x+R(-1.2,1.2),d.z+R(-1.2,1.2),{hold:R(4,9),unit:opts&&opts.heavy&&k===0?'heavy':undefined});}}
function belowFoes(){return ENEMIES.filter(E=>!E.H.dead&&E.pos.x<-1600);}
// a holdout: hold a room for dur seconds while the Host come in waves (every gap s, n at a time); onTick(u) moves the door/gate/cage
function startHold(id,dur,gap,n,where,onTick,lines){if(BELOW.hold||BELOW.done[id])return;dur*=window.BELOW_HOLD_K||1;   // (BELOW_HOLD_K: tests only)
  BELOW.hold={id,dur,gap,n,where,onTick,t:0,next:2,lines:lines||[]};
  if(typeof sfx!=='undefined'&&sfx.horn)sfx.horn(P.pos);}
function updateHold(dt){const H=BELOW.hold;if(!H)return;H.t+=dt;const left=Math.max(0,H.dur-H.t),u=Math.min(1,H.t/H.dur);if(H.onTick)H.onTick(u);
  for(const [t,who,txt,tone] of H.lines)if(H.t>t)say('h'+H.id+t,who,txt,tone);
  if(left>0&&Math.ceil(left)%15===0&&Math.ceil(left)!==H.lastB&&Math.ceil(left)<H.dur){H.lastB=Math.ceil(left);banner(Math.ceil(left)+' s','alert');}
  H.next-=dt;if(left>4&&H.next<=0){H.next=H.gap/(OD.rof||1);const live=belowFoes().length;if(live<9+(OD.n||0)*2)bFromDoors(H.where,H.n+(rng()<.3?1:0),{heavy:H.t>H.dur*.5&&rng()<.4});}
  if(left<=0){const foes=belowFoes().filter(E=>E.pos.distanceTo(P.pos)<60);if(foes.length&&foes.length<=3)markList=foes.map(E=>E.pos.clone().setY(E.pos.y+2.2));
    if(!foes.length||H.t>H.dur+25){BELOW.done[H.id]=1;BELOW.hold=null;H.onTick&&H.onTick(1);return 'done';}}
  return null;}
function belowDirector(dt){
  if(phase==='below'){
    const s=belowS(P.pos.x,P.pos.z),F=belowFoes();
    if(!BELOW.hold)P.spawn.copy(belowPt(Math.max(3,s-14)));
    for(const [at,who,txt,tone] of BLINES)if(s>at){say('bl'+at,who,txt,tone);if(tone==='enemy'&&!said.has('blg'+at)){said.add('blg'+at);glitch(1.4);if(typeof sfx!=='undefined'&&sfx.whisper)sfx.whisper();}
      if(at===110&&!said.has('bls')){said.add('bls');setTimeout(()=>{if(typeof sfx!=='undefined'&&sfx.static)sfx.static(1.4);},5200);}}
    const once=(k,f)=>{if(!BELOW.enc[k]){BELOW.enc[k]=1;f();}};
    // the Prison Ring: Host in the gallery, then more round the second bend and out of Cell Ward B
    if(s>30)once('r1',()=>{bPack(60,3,4);say('blc1','Lt. Michael','Contact! Host between the cells!','alert');});
    if(s>BS.cp9+30)once('r2',()=>{bPack(BS.cp9+70,3,4);const w=BROOMS.find(R0=>R0.id==='wardB');for(let k=0;k<2;k++)spawnTrooper(w.x+R(-3,3),w.z+R(-3,3),{hold:R(6,10)});});
    if(s>BS.cp9+110)once('r3',()=>{bPack(BS.gate-30,2+(OD.n?1:0),4,{heavy:true});});
    // Checkpoint 9: the way on is sealed. Michael's suit works the lock; the Host come out of the cell doors
    if(!BELOW.done.cp9&&s>BS.cp9-4)startHold('cp9',45,7,2,'cp9',null,[
      [1,'Lt. Michael','Sealed. A wall of light, and a lock panel. I’m on it.'],[3,'Elias Veyr','Your suit can talk to their locks, slowly. Hold that room until it gives.'],
      [24,'Lt. Michael','They’re coming out of the cells! They were in the walls the whole time!','alert']]);
    if(BELOW.hold&&BELOW.hold.id==='cp9'){P.spawn.copy(belowPt(BS.cp9));if(updateHold(dt)==='done'){openSeal('cp9');banner('The seal is down · keep going');}}
    // the inner gate: the vault's door. It opens on its own, slowly, and the Host know it
    if(!BELOW.done.gate&&s>BS.gate-6&&BELOW.done.cp9){if(!BELOW.hold){closeSeal('gate');BELOW.seals.gate.m.visible=false;}
      startHold('gate',60,6.5,2,'gate',u=>{BELOW.innerGate.u=u;},[
      [1,'Lt. Michael','A gate. Twice my height... it’s opening. By itself.'],[4,'Elias Veyr','Then he knows you’re there. Find cover, Michael.'],
      [30,'Captain Rhen?','Don’t go through, Michael. Not yet. Not until we can see you.','enemy'],[48,'Lt. Michael','Almost wide enough. Come on!']]);}
    if(BELOW.hold&&BELOW.hold.id==='gate'){P.spawn.copy(belowPt(BS.gate));if(updateHold(dt)==='done'){openSeal('gate',true);banner('Through the gate');}}
    if(s>BS.vaultIn&&!BELOW.cpVault){BELOW.cpVault=1;saveCP('vault');}
    // the Vault Floor: three packs on the way round, then the cage over the descent drops: hold while the winch lifts it
    if(s>BS.vaultIn+16)once('v1',()=>{bPack(BS.vaultIn+60,4,10,{step:5});say('blv1','Lt. Michael','Movement on the floor! Towers, two o’clock!','alert');});
    if(s>BS.vaultIn+90)once('v2',()=>{bPack(BS.vaultIn+140,4,12,{step:5,heavy:true});bFromDoors('vault',2);});
    if(s>BS.vaultIn+170)once('v3',()=>{bPack(BS.vaultIn+220,3,12,{step:5,cmd:true});});
    if(!BELOW.done.cage&&s>BS.vaultOut-32){if(!BELOW.hold){closeSeal('cage');BELOW.seals.cage.m.visible=false;}
      startHold('cage',60,6,3,'vault',u=>{BELOW.cage.u=Math.max(0,(u-.05)/.95);},[
      [1,'Lt. Michael','The way down’s caged off. There’s a winch... it’s slow.'],[5,'Elias Veyr','Then make it count. Use those barriers, keep your back to the cage.'],
      [28,'Lt. Michael','They’re coming down off the tiers!','alert'],[50,'Lt. Michael','Cage is up! Nearly!']]);}
    if(BELOW.hold&&BELOW.hold.id==='cage'){P.spawn.copy(belowPt(BS.vaultOut-26));if(updateHold(dt)==='done'){openSeal('cage',true);banner('The cage is up · go down');}}
    // the descent: a room at a time
    for(const [id,k,n,h] of[['pump','d1',3,0],['chain','d2',3,1],['ward','d3',4,1]]){const R0=BROOMS.find(q=>q.id===id);if(Math.hypot(P.pos.x-R0.x,P.pos.z-R0.z)<R0.r+22)once(k,()=>{bFromDoors(id,n,{heavy:h});});}
    if(s>BLEN-30&&!BELOW.cpDome){BELOW.cpDome=1;saveCP('dome');}
    // the Codex Dome: they come out of the alcoves round the rim, in two waves; the Codex once the room is clear
    if(s>BLEN-6)once('dome1',()=>{for(let i=0;i<4;i++){const R0=BROOMS.find(q=>q.id==='alc'+i);for(let k=0;k<1+(i%2)+(OD.n?1:0);k++)spawnTrooper(R0.x+R(-2,2),R0.z+R(-2,2),{hold:R(6,12),unit:k===0&&i===1?'heavy':undefined});}
      say('bld1','Lt. Michael','They’re in the alcoves! All round the rim!','alert');});
    if(BELOW.enc.dome1&&!BELOW.enc.dome2&&F.length<=2){BELOW.enc.dome2=1;for(let i=0;i<4;i++){const R0=BROOMS.find(q=>q.id==='alc'+i);for(let k=0;k<1+(OD.n||0);k++)spawnTrooper(R0.x+R(-2,2),R0.z+R(-2,2),{hold:R(4,8),unit:i===2&&k===0?'commander':undefined});}}
    if(s>BS.vaultIn&&!BELOW.hold){if(F.length&&F.length<=3)markList=F.map(E=>E.pos.clone().setY(E.pos.y+2.2));}
    const near=Math.hypot(P.pos.x-BCH.x,P.pos.z-BCH.z);
    WP=BELOW.hold?null:s<BLEN-10?belowPt(Math.min(BLEN,s+40)).clone().setY(belowPt(Math.min(BLEN,s+40)).y+2.5):new THREE.Vector3(BCH.x,BCH.y+3,BCH.z);
    PG.objective(BELOW.hold?'Hold · '+Math.ceil(Math.max(0,BELOW.hold.dur-BELOW.hold.t))+' s':'Find the Codex');
    if(near<BCH.rim&&s>BLEN&&F.length)say('blcf','Lt. Michael','Not yet. Clear the room first.','alert');
    if(near<10&&BELOW.enc.dome2&&F.length===0){setPhase('codexcut');WP=null;codexScene();}
    return true;}
  if(phase==='climb'){
    const s=belowS(P.pos.x,P.pos.z),F=belowFoes();PG.objective('Get out of the Hollow');
    WP=BELOW.hold?null:belowPt(Math.min(BTOT-2,s+40)).clone().setY(belowPt(Math.min(BTOT-2,s+40)).y+2.5);if(!BELOW.hold)P.spawn.copy(belowPt(Math.max(BS.north,s-12)));
    BELOW.shake=Math.max(BELOW.shake,.5);
    if(phT>2)say('cl1','Elias Veyr','Michael, run! The way you came is full of them. There’s another door, north, it comes out on the courtyard!','alert');
    if(phT>9)say('cl1b','Lt. Michael','I see it on the map. Going!','alert');
    const once=(k,f)=>{if(!BELOW.enc[k]){BELOW.enc[k]=1;f();}};
    if(s>BS.north+20)once('e1',()=>{bPack(BS.north+70,3,4,{h0:5,h1:9});});
    if(s>BS.north+90)once('e2',()=>{bPack(BS.north+150,3,4,{h0:5,h1:9,heavy:true});const p=belowPt(BS.north+60);for(let k=0;k<2;k++)spawnTrooper(p.x+R(-3,3),p.z+R(-3,3),{hold:R(3,6)});});
    if(s>BS.north+180)once('e3',()=>{bPack(BS.mouth-50,3,5,{h0:5,h1:9});});
    if(phT>34)say('cl2','Keeper Sergeant','We see your light on the scope, Lieutenant! The north door is sealed, we’re cutting it from our side!','alert');
    if(!BELOW.done.mouth&&s>BS.mouth-8)startHold('mouth',35,6,2,'mouth',u=>{BELOW.outerDoor.u=u;},[
      [1,'Keeper Sergeant','Thirty seconds, Lieutenant! Keep them off your back!','alert'],[18,'Lt. Michael','Daro, faster!','alert'],[30,'Keeper Sergeant','Nearly through! Stand clear of the door!','alert']]);
    if(BELOW.hold&&BELOW.hold.id==='mouth'){P.spawn.copy(belowPt(BS.mouth));if(updateHold(dt)==='done')openSeal('mouth',true);}
    if(!BELOW.hold&&F.length&&F.length<=2&&BELOW.done.mouth)markList=F.map(E=>E.pos.clone().setY(E.pos.y+2.2));
    if(BELOW.done.mouth&&s>BTOT-8){setPhase('exitcut');WP=null;exitScene();}
    return true;}
  return phase==='codexcut'||phase==='exitcut';
}
function codexScene(){
  const at=(x,y,z)=>bWorldFromChamber(x,y,z);
  // Michael walks up to the dome (on the bridge side, facing the sea)
  {const p=at(0,0,5.2);P.pos.set(p[0],p[1],p[2]);}P.yaw=-Math.PI/2;P.H.root.rotation.y=-Math.PI/2;
  playCut([
    {dur:7,score:'cave',cam:[at(-16,7,26),at(-12,6,18)],look:[at(0,3,0)],
      say:[[.6,'Lt. Michael','Master, I’ve found it. The Codex is here. It’s inside some kind of dome.'],[0,'Elias Veyr','Then take it, and get out of there.']],
      fn:(t,dt)=>{poseHuman(P.H,dt,0,0);}},
    {dur:7,cam:[at(3.4,3.4,8.4),at(2.2,3.6,6.4)],look:[at(0,2.6,0)],
      say:[[.8,'Captain Rhen?','You came back.','enemy'],[0,'Lt. Michael','Back? I’ve never been here before.']],
      fn:(t,dt)=>{poseHuman(P.H,dt,0,0);if(t<.1)glitch(1.2);}},
    {dur:9,cam:[at(5,3,-2),at(3,2.4,-16)],look:[at(0,0,-60),at(0,-.5,-74)],
      say:[[2.6,'Lt. Michael','Master... there’s something behind the glass. Something big. It’s looking at me.']],
      fn:(t,dt)=>{poseHuman(P.H,dt,0,0);if(t>1)BELOW.eyes.to=1;if(t<.1&&typeof sfx!=='undefined'&&sfx.wake)sfx.wake();}},
    // it takes the Codex
    {dur:5,cam:[at(6,5,6),at(4,6,2)],look:[at(0,4,-6),at(0,0,-46)],
      fn:(t,dt)=>{poseHuman(P.H,dt,0,0);if(BELOW.takeT==null||BELOW.takeT<0){BELOW.takeT=0;if(typeof sfx!=='undefined'&&sfx.wake)sfx.wake();}BELOW.eyes.to=1;BELOW.shake=.4;}},
    {dur:8,cam:[at(-6,10,16),at(-9,13,22)],look:[at(0,3,0),at(0,4,-6)],
      say:[[.4,'The Hollow King','Now you have seen him, Lieutenant. Now stay, and be emptied.','enemy'],
           [0,'Elias Veyr','Michael! The gate is opening up here, they’re pouring out of the mountain! Get out, now!','alert']],
      fn:(t,dt)=>{poseHuman(P.H,dt,0,0);if(t<.1&&!BELOW.kingM&&typeof sfx!=='undefined'&&sfx.collapse){BELOW.kingM=1;sfx.collapse();if(sfx.moment)sfx.moment('king');}BELOW.shake=1;if(t>1)BELOW.eyes.to=0;BELOW.flicker=t<1.5?.2:0;}},
  ],()=>{BELOW.eyes.to=0;P.pos.set(BCH.x,BCH.y,BCH.z-13);P.yaw=0;P.H.root.rotation.y=0;setPhase('climb');banner('The Codex is gone · get out of the Hollow','alert');
    // they come up the west bridge behind you, and out of the alcoves
    for(let k=0;k<2+(OD.n||0);k++)spawnTrooper(BCH.x-R(24,34),BCH.z+R(-2,2),{hold:R(5,10)});
    for(const i of[0,2]){const R0=BROOMS.find(q=>q.id==='alc'+i);spawnTrooper(R0.x,R0.z,{hold:R(4,8)});}});
}
function exitScene(){
  for(const E of ENEMIES)if(E.pos.x<-1600){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  setBelow(false);BELOW.shake=0;BELOW.hold=null;for(const A of SQUAD)A.on=true;
  SQUAD.forEach((A,i)=>{A.pos.set(-8+i*4,0,COURT.z+18);});P.pos.set(0,0,GATE.z+14);P.yaw=Math.PI;P.H.root.rotation.y=Math.PI;
  playCut([
    {dur:6,score:'tense',cam:[[8,4,COURT.z+30],[5,5,COURT.z+22]],look:[[0,4,GATE.z+10],[0,GATE_H*.5,GATE.z]],
      say:[[.3,'Keeper Sergeant','Lieutenant! There you are! It’s a trap, they’re coming out of the walls! Fall back to the ships!','alert']],
      fn:(t,dt)=>{if(t>.6&&!gateOpen)openGate();const u=Math.min(1,t/4);P.pos.set(0,0,GATE.z+14+u*16);poseHuman(P.H,dt,5.6,.25,true);}},
  ],()=>{openGate();kingGesture=.3;P.pos.set(0,0,COURT.z+30);P.yaw=Math.PI;setPhase('fallback');banner('It’s a trap · fall back to the ships','alert');});
}
