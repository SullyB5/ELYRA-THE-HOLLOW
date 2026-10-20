/* Elyra · Archive 01 · The Mountain — below the Hollow.
   After the courtyard, Michael goes down alone (as Master Veyr ordered: no one follows him below). A tunnel of ribbed rock
   that breathes, a voice that sounds like Captain Rhen, the Empty Host in the dark, a wall of carved names (the whole
   Pathfinder crew among them), and at the bottom the chamber: the Codex inside a dome, and something enormous beyond it.
   The Hollow King springs his trap; the Codex sinks out of reach; Michael climbs back out into the courtyard as the gate opens
   and the fall back begins. The tunnel's shape (BNODES, BCH) and its walkable area live in 01-world.js.
   Phases: 'below' (go down) → 'codexcut' → 'climb' (get out) → 'exitcut' → 'fallback'. */
const BELOW={on:false,ribs:[],eyes:null,codex:null,dome:null,lights:[],G:null,spot:null,shake:0,enc:0,sinkT:-1};
const BT=new THREE.Vector3(),BU=new THREE.Vector3();

/* ---------- building it (the first time it is needed) ---------- */
function buildBelow(){
  const G=new THREE.Group();scene.add(G);BELOW.G=G;
  const R=7,UP=R*.45;
  const curve=new THREE.CatmullRomCurve3([...BNODES.map(n=>new THREE.Vector3(n.x,n.y+UP,n.z)),new THREE.Vector3(BCH.x,BCH.y+UP,BCH.z+BCH.r-4)]);
  const L=curve.getLength();
  // the tunnel: a tube seen from inside, pushed into ribs every few metres and roughened, darker in the grooves
  const tube=new THREE.TubeGeometry(curve,220,R,22,false),P=tube.attributes.position,col=new Float32Array(P.count*3),RS=22;
  for(let i=0;i<P.count;i++){const seg=Math.floor(i/(RS+1)),u=seg/220,ctr=curve.getPointAt(Math.min(1,u)),j=i%(RS+1);
    BT.set(P.getX(i),P.getY(i),P.getZ(i)).sub(ctr);const ang=j/RS*Math.PI*2;
    const rib=.5+.5*Math.cos(u*L/5.5*Math.PI*2),n=vnoise(P.getX(i)*.35,P.getZ(i)*.35+P.getY(i)*.2);
    const k=1+.1*rib+.12*(n-.5)+.05*Math.sin(ang*3+u*20);BT.multiplyScalar(k);P.setXYZ(i,ctr.x+BT.x,ctr.y+BT.y,ctr.z+BT.z);
    const sh=.45+.55*rib*.6+.25*n,fade=1-u*.35;col[i*3]=.1*sh*fade;col[i*3+1]=.095*sh*fade;col[i*3+2]=.12*sh*fade;}
  tube.setAttribute('color',new THREE.BufferAttribute(col,3));tube.computeVertexNormals();
  const wallMat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.BackSide,roughness:.62,metalness:.15});
  G.add(new THREE.Mesh(tube,wallMat));
  // the floor: wet stone along the way down
  const fp=[],fi=[],steps=Math.ceil(BLEN+14);
  for(let k=0;k<=steps;k++){const s=k,c=belowPt(s,new THREE.Vector3()),c2=belowPt(s+1,new THREE.Vector3()),dx=c2.x-c.x,dz=c2.z-c.z,l=Math.hypot(dx,dz)||1,nx=-dz/l,nz=dx/l;
    for(const w of[-6.3,-4.6,0,4.6,6.3]){const y=(Math.abs(w)>6?.9:0)+c.y+.02;fp.push(c.x+nx*w,y,c.z+nz*w);}
    if(k<steps)for(let j=0;j<4;j++){const a=k*5+j,b=a+5;fi.push(a,b,a+1,a+1,b,b+1);}}
  const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setIndex(fi);fg.computeVertexNormals();
  const floorMat=new THREE.MeshStandardMaterial({color:C(0x24262e),roughness:.3,metalness:.3,map:detailTex,side:THREE.DoubleSide});
  G.add(new THREE.Mesh(fg,floorMat));
  // the door behind you: a wall with the purple of the gate seeping through it
  const cap=new THREE.Mesh(new THREE.CircleGeometry(R*1.2,24),new THREE.MeshStandardMaterial({color:C(0x15121a),roughness:.8}));cap.position.set(BNODES[0].x,BNODES[0].y+UP,1.5);cap.rotation.y=Math.PI;G.add(cap);
  const door=new THREE.Mesh(new THREE.PlaneGeometry(3,4.4),new THREE.MeshBasicMaterial({color:C(HOLLOW_GLOW).multiplyScalar(1.6),toneMapped:false}));door.position.set(BNODES[0].x,2.2,1.4);door.rotation.y=Math.PI;G.add(door);
  // ribs of brighter rock that rise and fall, very slowly, as if the mountain were breathing
  const ribMat=new THREE.MeshStandardMaterial({color:C(0x2a2c36),emissive:C(0x050a18),roughness:.45,metalness:.25});
  for(let s=9;s<L-6;s+=7.5){const u=s/L,p=curve.getPointAt(u),t=curve.getTangentAt(u);const rb=new THREE.Mesh(new THREE.TorusGeometry(R*.98,.5,6,28),ribMat);
    rb.position.copy(p);rb.lookAt(p.clone().add(t));G.add(rb);BELOW.ribs.push(rb);}
  // light: a cold blue somewhere ahead, always ahead
  for(const [s,i,d] of[[60,.7,30],[118,.9,34]]){const p=belowPt(s,new THREE.Vector3());const l=new THREE.PointLight(C(0x5a8cff),i,d,1.6);l.position.set(p.x,p.y+5,p.z);G.add(l);BELOW.lights.push(l);}
  const pl=new THREE.PointLight(C(HOLLOW_GLOW),.6,16,1.8);pl.position.set(BNODES[0].x,3,-2);G.add(pl);
  // the names: carved into the wall, hundreds of them (one of them, very small, is one you will not want to read)
  {const cv=document.createElement('canvas');cv.width=2048;cv.height=768;const x=cv.getContext('2d');x.fillStyle='#29262e';x.fillRect(0,0,2048,768);
    for(let i=0;i<900;i++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.03)';x.beginPath();x.arc(Math.random()*2048,Math.random()*768,2+Math.random()*30,0,7);x.fill();}
    const SUR=['ADEYEMI','ALCOTT','BRANDT','CALLOWAY','DARROW','EKWUEME','FARRIS','GALLO','HAYES','IVERS','JANSEN','KOVAC','LANDRY','MARSH','NAKAMURA','OKAFOR','PRUITT','QUINLAN','REYES','SATO','THORNE','VANCE','WEBER','YOUNG','ZIMMER','BLACKWOOD','DUBOIS','FONTAINE','GRAVES','HOLLOWAY','KESTREL','MERCER','NOVAK','ORLOV','ROURKE','TALLIS','VOSS','WINTERS','BELLAMY','CROSS','DRAKE','FINCH','HALE','KANE','LOCKE','MORROW','NASH','STROUD'];
    const RK=['PVT','CPL','SGT','SPC','LT','ENS','CPL','PVT'];let k=0;x.textAlign='center';
    for(let row=0;row<15;row++)for(let col=0;col<9;col++){k++;let n=RK[k*7%RK.length]+'. '+'ABCDEFGHJKLMNPRSTW'[k*5%18]+'. '+SUR[k*11%SUR.length],big=false;
      if(row===6&&col===4){n='CPT. A. RHEN';big=true;}else if(row===6&&col===3)n='SGT. O. MARSH';else if(row===7&&col===4)n='ENS. P. LANDRY';
      const px=114+col*228+(row%2)*30,py=48+row*49;x.font=(big?'600 34px':'600 24px')+' "Chakra Petch",sans-serif';x.fillStyle='rgba(255,255,255,.08)';x.fillText(n,px+2,py+2);x.fillStyle='rgba(6,6,8,.9)';x.fillText(n,px,py);
      x.font='500 14px monospace';x.fillStyle='rgba(6,6,8,.75)';x.fillText(row<5?String(2190+k*7%47):'08.03.2237',px,py+17);}
    x.font='600 9px "Chakra Petch",sans-serif';x.fillStyle='rgba(6,6,8,.85)';x.fillText('LT. M. VEYR · 17.03.2237',1940,756);
    const g=x.createRadialGradient(1024,384,200,1024,384,1050);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=g;x.fillRect(0,0,2048,768);
    const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;
    const s=97,p=belowPt(s,new THREE.Vector3()),p2=belowPt(s+1,new THREE.Vector3()),dx=p2.x-p.x,dz=p2.z-p.z,l=Math.hypot(dx,dz),nx=-dz/l,nz=dx/l;
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(15,5.6),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.7,depthWrite:false}));
    wall.position.set(p.x-nx*6.15,p.y+2.9,p.z-nz*6.15);wall.lookAt(p.x,p.y+2.9,p.z);G.add(wall);BELOW.names=wall;BELOW.namesAt=new THREE.Vector3(p.x-nx*5.6,p.y,p.z-nz*5.6);}
  // the chamber: a round hall of the same rock, a low dome of a roof, an opening into the dark at the far side
  const ch=new THREE.Group();ch.position.set(BCH.x,BCH.y,BCH.z);G.add(ch);
  const gap=.62,deep=1.05;
  for(const [t0,tl] of[[gap/2,Math.PI-deep/2-gap/2],[Math.PI+deep/2,Math.PI-deep/2-gap/2]]){const w=new THREE.CylinderGeometry(BCH.r+3,BCH.r+3,16,40,6,true,t0,tl),q=w.attributes.position;
    for(let i=0;i<q.count;i++){const x=q.getX(i),z=q.getZ(i),n=vnoise(x*.2+q.getY(i)*.15,z*.2);q.setXYZ(i,x*(1+.08*(n-.5)),q.getY(i),z*(1+.08*(n-.5)));}w.computeVertexNormals();
    const m=new THREE.Mesh(w,new THREE.MeshStandardMaterial({color:C(0x3a3644),side:THREE.BackSide,roughness:.6,metalness:.15,map:detailTex}));m.position.y=8;ch.add(m);}
  const roof=new THREE.Mesh(new THREE.SphereGeometry(BCH.r+3,40,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:C(0x1c1b22),side:THREE.BackSide,roughness:.8}));roof.scale.y=.55;roof.position.y=16;ch.add(roof);
  const flr=new THREE.Mesh(new THREE.CircleGeometry(BCH.r+3,48),floorMat);flr.rotation.x=-Math.PI/2;flr.position.y=.01;ch.add(flr);
  const lintel=new THREE.Mesh(new THREE.BoxGeometry(18,7,3),new THREE.MeshStandardMaterial({color:C(0x25232c),roughness:.8}));lintel.position.set(0,13,BCH.r+2);ch.add(lintel);
  // beyond the far opening: nothing. Only dark, and later, two lights in it
  const pit=new THREE.Mesh(new THREE.SphereGeometry(70,24,12),new THREE.MeshBasicMaterial({color:C(0x010103),side:THREE.BackSide}));pit.position.set(0,0,-BCH.r-70);ch.add(pit);
  const eyeMat=new THREE.SpriteMaterial({map:glow,color:C(0xcfe0ff).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0,fog:false});
  const eyes=new THREE.Group();eyes.position.set(0,12,-BCH.r-44);ch.add(eyes);for(const s of[-1,1]){const e=new THREE.Sprite(eyeMat);e.scale.setScalar(11);e.position.x=s*7;eyes.add(e);}const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x3a4a8a),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0,fog:false}));halo.scale.set(70,45,1);eyes.add(halo);
  BELOW.eyes={g:eyes,mat:eyeMat,halo,o:0,to:0};
  // the dome on its plinth, and the Codex turning inside it
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.9,1.4,28),new THREE.MeshStandardMaterial({color:C(0x2c2a30),roughness:.5,metalness:.4,map:panelTex}));plinth.position.y=.7;ch.add(plinth);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.05,.07,6,48),new THREE.MeshBasicMaterial({color:C(0x7fe3ff).multiplyScalar(2),toneMapped:false}));ring.rotation.x=Math.PI/2;ring.position.y=1.42;ch.add(ring);
  const domeMat=new THREE.MeshBasicMaterial({color:C(0x7fb6ff),transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(2.9,32,12,0,Math.PI*2,0,Math.PI/2),domeMat);dome.position.y=1.42;ch.add(dome);
  const wire=new THREE.Mesh(new THREE.SphereGeometry(2.92,16,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:C(0x7fd8ff),wireframe:true,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false}));wire.position.y=1.42;ch.add(wire);
  const codex=new THREE.Group();codex.position.y=3;ch.add(codex);const gold=new THREE.MeshStandardMaterial({color:C(0xd9b25a),emissive:C(0x6a4a10),roughness:.25,metalness:.9});
  for(let i=0;i<3;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(.9,.06,6,40),gold);t.rotation.set(i*1.05,i*.6,0);codex.add(t);}
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd890).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));core.scale.setScalar(2.2);codex.add(core);
  const cl=new THREE.PointLight(C(0xffd27a),1.6,26,1.6);cl.position.y=3.2;ch.add(cl);
  const bl=new THREE.PointLight(C(0x5a8cff),2.6,70,1.3);bl.position.y=11;ch.add(bl);BELOW.lights.push(bl,cl);
  BELOW.codex=codex;BELOW.dome={mat:domeMat,wire,ring,light:cl,core};BELOW.ch=ch;
  // your torch
  const sp=new THREE.SpotLight(C(0xffeedd),2.4,46,.46,.55,1.3);scene.add(sp,sp.target);sp.visible=false;BELOW.spot=sp;
  G.visible=false;
}

/* ---------- going down and coming back up: the light and the air change ---------- */
const UPSTAIRS={};
function setBelow(on){
  if(on===BELOW.on)return;BELOW.on=on;if(!BELOW.G)buildBelow();
  if(on){Object.assign(UPSTAIRS,{fog:scene.fog.color.clone(),dens:scene.fog.density,sun:sun.intensity,hemi:hemi.intensity,hc:hemi.color.clone(),fill:fill.intensity});
    scene.fog.color.set(C(0x05060b));scene.fog.density=.026;sun.intensity=0;fill.intensity=0;hemi.intensity=.1;hemi.color.set(C(0x5a6a98));sky.visible=false;}
  else{scene.fog.color.copy(UPSTAIRS.fog);scene.fog.density=UPSTAIRS.dens;sun.intensity=UPSTAIRS.sun;fill.intensity=UPSTAIRS.fill;hemi.intensity=UPSTAIRS.hemi;hemi.color.copy(UPSTAIRS.hc);sky.visible=true;}
  scene.background=scene.fog.color;BELOW.G.visible=on;BELOW.spot.visible=on;
  hollowLamp.visible=lzLamp.visible=dust.visible=harbinger.visible=beam.visible=beamCore.visible=pulse.visible=!on;
}
function updateBelow(dt){
  if(!BELOW.on)return;
  BELOW.ribs.forEach((r,i)=>r.scale.setScalar(1+.03*Math.sin(T*1.05-i*.55)));
  const sp=BELOW.spot;sp.position.copy(camera.position);camera.getWorldDirection(BT);sp.target.position.copy(camera.position).addScaledVector(BT,12);
  if(CUTS.on)sp.position.copy(P.pos).add(BU.set(0,1.6,0)),sp.target.position.copy(P.pos).add(BU.set(-Math.sin(P.H.root.rotation.y)*10,1,-Math.cos(P.H.root.rotation.y)*10));
  sp.intensity=BELOW.flicker>0?(Math.random()<.4?.2:2.4):2.4;BELOW.flicker=Math.max(0,(BELOW.flicker||0)-dt);
  BELOW.lights.forEach((l,i)=>{if(i<2)l.intensity=(i?.9:.7)*(.8+.2*Math.sin(T*.9+i*2));});
  if(BELOW.codex){BELOW.codex.rotation.y+=dt*.6;BELOW.codex.rotation.x=Math.sin(T*.4)*.3;BELOW.dome.core.material.opacity=.8+.2*Math.sin(T*3);
    if(BELOW.sinkT>=0){BELOW.sinkT+=dt;const u=Math.min(1,BELOW.sinkT/3);BELOW.codex.position.y=3-u*3.4;BELOW.dome.light.intensity=1.6*(1-u);BELOW.dome.mat.opacity=.1*(1-u);BELOW.dome.wire.material.opacity=.18*(1-u);BELOW.dome.ring.visible=u<.95;}}
  const E=BELOW.eyes;if(E){E.o+=(E.to-E.o)*(1-Math.exp(-dt*(E.to>E.o?.9:2.5)));E.mat.opacity=E.o*(.85+.15*Math.sin(T*.7));E.halo.material.opacity=E.o*.35;E.g.position.x=Math.sin(T*.13)*3;}
  // the climb: the mountain shakes, dust comes down
  if(BELOW.shake>0){BELOW.shake=Math.max(0,BELOW.shake-dt*.05);camera.position.x+=R(-.06,.06)*BELOW.shake;camera.position.y+=R(-.05,.05)*BELOW.shake;
    if(rng()<dt*3*BELOW.shake){const p=P.pos.clone().add(BU.set(R(-5,5),R(5,8),R(-8,2)));puff(p,R(1.5,3),3);}}
}

/* ---------- the story below ---------- */
function enterBelow(){
  setBelow(true);for(const A of ALLIES)A.on=false;
  const s0=belowPt(3,new THREE.Vector3());P.pos.set(s0.x,s0.y,s0.z);P.yaw=0;P.pitch=-.04;P.H.root.rotation.y=0;P.spawn.copy(P.pos);
  setPhase('below');banner('Below the Hollow');
  addPick('med',belowPt(72).x,belowPt(72).z);addPick('ammo',belowPt(104).x+2,belowPt(104).z);addPick('rocket',belowPt(48).x-2,belowPt(48).z);
}
const BLINES=[
  [5,'Lt. Michael','I’m in. No light down here. Torch on.'],
  [15,'Elias Veyr','We hear you, Michael. Keep this channel open. Sergeant Daro holds the door.'],
  [27,'Captain Rhen?','You came. I knew you would come, Michael.','enemy'],
  [33,'Lt. Michael','Master, the voice is down here too. It’s closer.'],
  [37,'Elias Veyr','Then don’t answer it. Find the Codex and come back to us.'],
  [72,'Elias Veyr','Michael, your signal is breaking up. The deeper you go, the less of you we hear.'],
  [92,'Lt. Michael','There are names carved into the rock. Hundreds of them.'],
  [99,'Lt. Michael','Master... Captain Rhen’s name is here. Marsh. Landry. The whole Pathfinder crew.'],
  [104,'Elias Veyr','That isn’t possible. The Pathfinder never came here. Michael, those names can’t be—'],
  [127,'Captain Rhen?','Lower. The light is lower. Come and see what we found.','enemy'],
];
function belowDirector(dt){
  if(phase==='below'){
    const s=belowS(P.pos.x,P.pos.z);PG.objective('Find the Codex');WP=new THREE.Vector3(BCH.x,BCH.y+3,BCH.z);
    P.spawn.copy(belowPt(Math.max(3,s-14)));
    for(const [at,who,txt,tone] of BLINES)if(s>at){say('bl'+at,who,txt,tone);if(tone==='enemy'&&!said.has('blg'+at)){said.add('blg'+at);glitch(1.4);if(typeof sfx!=='undefined'&&sfx.whisper)sfx.whisper();}
      if(at===104&&!said.has('bls')){said.add('bls');setTimeout(()=>{if(typeof sfx!=='undefined'&&sfx.static)sfx.static(1.4);},5200);}}
    // the Host waiting in the dark: three, then four
    if(BELOW.enc===0&&s>36){BELOW.enc=1;for(let k=0;k<3+(OD.n||0);k++){const p=belowPt(58+k*4);spawnTrooper(p.x+R(-3,3),p.z,{hold:R(9,15)});}say('blc1','Lt. Michael','Contact! Host in the dark ahead!','alert');}
    if(BELOW.enc===1&&s>106){BELOW.enc=2;for(let k=0;k<4+(OD.n||0);k++){const p=belowPt(128+k*5);spawnTrooper(p.x+R(-3,3),p.z,{hold:R(9,16)});}say('blc2','Lt. Michael','More of them! They’re coming up from below!','alert');}
    const near=Math.hypot(P.pos.x-BCH.x,P.pos.z-BCH.z),foes=ENEMIES.filter(E=>!E.H.dead&&E.pos.x<-1600).length;
    if(near<BCH.r-4&&foes)say('blcf','Lt. Michael','Not yet. Clear the room first.','alert');
    if(near<10&&foes===0){setPhase('codexcut');WP=null;codexScene();}
    return true;}
  if(phase==='climb'){
    const s=belowS(P.pos.x,P.pos.z);PG.objective('Get out of the Hollow');WP=belowPt(1).clone().setY(belowPt(1).y+2);P.spawn.copy(belowPt(Math.min(BLEN+10,s+12)));
    BELOW.shake=Math.max(BELOW.shake,.7);
    if(phT>2)say('cl1','Elias Veyr','Michael, run! Don’t stop for anything!','alert');
    if(phT>14)say('cl2','Keeper Sergeant','We see your light, Lieutenant! Keep coming, the door is still open!','alert');
    // more of them come down the tunnel to meet you, and some follow you up from the chamber
    if(!BELOW.c1&&s<120){BELOW.c1=true;for(let k=0;k<3+(OD.n||0);k++){const p=belowPt(70-k*5);spawnTrooper(p.x+R(-3,3),p.z,{hold:R(7,12)});}}
    if(!BELOW.c2&&s<55){BELOW.c2=true;for(let k=0;k<2+(OD.n||0);k++){const p=belowPt(20-k*4);spawnTrooper(p.x+R(-3,3),p.z,{hold:R(6,10)});}}
    if(s<5){setPhase('exitcut');WP=null;exitScene();}
    return true;}
  return phase==='codexcut'||phase==='exitcut';
}
function codexScene(){
  const c=new THREE.Vector3(BCH.x,BCH.y,BCH.z),at=(x,y,z)=>[c.x+x,c.y+y,c.z+z];
  // Michael walks up to the dome
  P.pos.set(c.x,c.y,c.z+5.2);P.yaw=0;P.H.root.rotation.y=0;
  playCut([
    {dur:7,cam:[at(-14,6,22),at(-11,5,16)],look:[at(0,3,0)],
      say:[[.6,'Lt. Michael','Master, I’ve found it. The Codex is here. It’s inside some kind of dome.'],[0,'Elias Veyr','Then take it, and get out of there.']],
      fn:(t,dt)=>{poseHuman(P.H,dt,0,0);}},
    {dur:7,cam:[at(3.4,3.4,8.4),at(2.2,3.6,6.4)],look:[at(0,2.6,0)],
      say:[[.8,'Captain Rhen?','You came back.','enemy'],[0,'Lt. Michael','Back? I’ve never been here before.']],
      fn:(t,dt)=>{poseHuman(P.H,dt,0,0);if(t<.1)glitch(1.2);}},
    {dur:9,cam:[at(2.6,4.6,11),at(1.8,5,9.5)],look:[at(0,9,-50),at(0,12,-70)],
      say:[[2.6,'Lt. Michael','Master... there’s something down here. Something big. It’s looking at me.']],
      fn:(t,dt)=>{poseHuman(P.H,dt,0,0);if(t>1)BELOW.eyes.to=1;if(t<.1&&typeof sfx!=='undefined'&&sfx.wake)sfx.wake();}},
    {dur:8,cam:[at(-6,9,14),at(-9,12,20)],look:[at(0,3,0),at(0,4,-6)],
      say:[[.4,'The Hollow King','Now you have seen him, Lieutenant. Now stay, and be emptied.','enemy'],
           [0,'Elias Veyr','Michael! The gate is opening up here, they’re pouring out of the mountain! Get out, now!','alert']],
      fn:(t,dt)=>{poseHuman(P.H,dt,0,0);if(BELOW.sinkT<0){BELOW.sinkT=0;if(typeof sfx!=='undefined'&&sfx.collapse)sfx.collapse();}BELOW.shake=1;if(t>3)BELOW.eyes.to=0;BELOW.flicker=t<1.5?.2:0;}},
  ],()=>{BELOW.eyes.to=0;P.yaw=Math.PI;P.H.root.rotation.y=Math.PI;P.pos.set(c.x,c.y,c.z+7);setPhase('climb');banner('The Codex is gone · get out of the Hollow','alert');
    for(let k=0;k<2+(OD.n||0);k++){const a=Math.PI+R(-.5,.5);spawnTrooper(c.x+Math.sin(a)*18,c.z+Math.cos(a)*18,{hold:R(6,12)});}});
}
function exitScene(){
  for(const E of ENEMIES)if(E.pos.x<-1600){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  setBelow(false);BELOW.shake=0;for(const A of SQUAD)A.on=true;
  SQUAD.forEach((A,i)=>{A.pos.set(-8+i*4,0,COURT.z+18);});P.pos.set(0,0,GATE.z+14);P.yaw=Math.PI;P.H.root.rotation.y=Math.PI;
  playCut([
    {dur:6,cam:[[8,4,COURT.z+30],[5,5,COURT.z+22]],look:[[0,4,GATE.z+10],[0,GATE_H*.5,GATE.z]],
      say:[[.3,'Keeper Sergeant','Lieutenant! There you are! It’s a trap, they’re coming out of the walls! Fall back to the ships!','alert']],
      fn:(t,dt)=>{if(t>.6&&!gateOpen)openGate();const u=Math.min(1,t/4);P.pos.set(0,0,GATE.z+14+u*16);poseHuman(P.H,dt,5.6,.25,true);}},
  ],()=>{openGate();kingGesture=.3;P.pos.set(0,0,COURT.z+30);P.yaw=Math.PI;setPhase('fallback');banner('It’s a trap · fall back to the ships','alert');});
}
