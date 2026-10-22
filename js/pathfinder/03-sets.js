/* Elyra · Side mission S1 · Pathfinder — the two cutscenes and the sets they need.
   Before: the installation from orbit → the Pathfinder's drop bay (red light, thirty seconds out, "That's what we're told.")
           → the rear door opens on the dark → the team falls through the cloud over the facility and lands in the crater.
   After:  the Pathfinder lifts off the hangar with the package → Host fighters → the cockpit ("Can we make Slipscape?" "No.")
           → the missile, the dive → Astraea's air on fire → the package wakes and shows Landry something under the planet
           → through the cloud → the crash → the wreck: "Status." "Alive." "Ship's dead." ... "They followed us."
   The sets are built off the play map the first time they're needed: orbit at x +20000, the cockpit at x +30000, Astraea at x -30000.
   The drop bay hangs in the real sky over the crater, so its open door looks down on the actual map. */
const SETS={active:false,anim:[],update(dt,T){for(let i=this.anim.length-1;i>=0;i--)if(this.anim[i](dt,T)===false)this.anim.splice(i,1);}};
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function glowSprite(hex,size,k,op){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(hex).multiplyScalar(k||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op==null?1:op}));s.scale.setScalar(size);return s;}
function vcol(g,c){const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
const metalMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.5,metalness:.55});
const lightMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
const ASTRAEA0={pos:astraea.position.clone(),scale:astraea.scale.x};
// the Pathfinder's guns, sized for the ground (the fleet's bolts are sized for space)
BK.pfgun={len:26,w:.9,head:9,col:0xffd08a,bc:0xffb347};BK.pfbig={len:70,w:2.2,head:20,col:0xffd08a,bc:0xffb347};BK.hbig={len:90,w:2.8,head:24,col:0xd8a0ff,bc:0xa45cff};
boltMats.hbig=new THREE.MeshBasicMaterial({color:C(0xa45cff).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});boltMats.pfgun=new THREE.MeshBasicMaterial({color:C(0xffb347).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});boltMats.pfbig=boltMats.pfgun;   // after pfgun exists (it used to be copied while still undefined, and the big gun's bolts broke the frame)
function resetSky(){skyGroup.rotation.set(0,0,0);putAstraea(ASTRAEA0.pos,ASTRAEA0.scale);}
// where Astraea hangs: a direction from the camera, an angular size
function putAstraea(dir,scale){astraea.position.copy(dir).normalize().multiplyScalar(3000);astraea.scale.setScalar(scale);astraeaHalo.position.copy(astraea.position);astraeaHalo.scale.setScalar(scale*1.06);}
const crew=()=>[P.H,...SQUAD.map(A=>A.H)];
function showCrew(on){for(const H of crew())H.root.visible=on;}
// Ensign Landry, the Pathfinder's pilot (Bryce's Keeper civilian model is the pilot for allied ships for now)
let LANDRY=null;function landry(){if(!LANDRY){LANDRY=makeHuman('officer');scene.add(LANDRY.root);MODELS.dress(LANDRY,'civilian',{unarmed:true});}return LANDRY;}

/* ---------- orbit: the moon, and the installation sunk into it ---------- */
let ORB=null;
function buildOrbit(){const O=V3(20000,0,0),G=new THREE.Group();G.position.copy(O);scene.add(G);const Rm=900;
  const mg=new THREE.SphereGeometry(Rm,160,80),P0=mg.attributes.position,col=new Float32Array(P0.count*3);
  for(let i=0;i<P0.count;i++){const x=P0.getX(i),y=P0.getY(i),z=P0.getZ(i),n=fbm(x*.006+3,z*.006+y*.004),cr=Math.max(0,.5-vnoise(x*.02,z*.02+y*.01))*8;const k=1+(n*10-cr)/Rm;P0.setXYZ(i,x*k,y*k,z*k);const g=.28+n*.25;col[i*3]=g;col[i*3+1]=g*.97;col[i*3+2]=g*1.06;}
  mg.setAttribute('color',new THREE.BufferAttribute(col,3));mg.computeVertexNormals();const moon=new THREE.Mesh(mg,rockMat2);moon.receiveShadow=true;G.add(moon);
  // the installation: black blocks pushed into the curve of the ground, spires, purple seams, and lights crawling across it
  const hm2=new Merger(),hg2=new Merger(),surf=(x,z)=>Math.sqrt(Rm*Rm-x*x-z*z);
  for(let i=0;i<90;i++){const x=R(-170,170),z=R(-200,120),w=R(8,50),h=R(10,70),d=R(8,50);if(Math.hypot(x,z)<30&&rng()<.5)continue;const y=surf(x,z)-10;hm2.add(boxUV(w,h,d,8),M(x,y+h/2,z,0,R(-.2,.2),0),rng()<.4?K_DARK2:K_DARK);
    if(rng()<.5)hg2.add(new THREE.BoxGeometry(w*.9,.6,.6),M(x,y+h-R(2,8),z+d/2+.3),W1);}
  for(let i=0;i<9;i++){const x=R(-140,140),z=R(-180,100),H=R(120,280),y=surf(x,z)-6;hm2.add(new THREE.CylinderGeometry(2,9,H,6),M(x,y+H/2,z),K_DARK);hm2.add(new THREE.CylinderGeometry(0,2,H*.3,6),M(x,y+H*1.15,z),K_SIL);
    for(let k=8;k<H*.85;k+=14)hg2.add(new THREE.BoxGeometry(.8,6,.8),M(x+4,y+k,z),W1);const l=glowSprite(HOST_GLOW,40,2.4);l.position.set(x,y+H*1.32,z);G.add(l);}
  const im=new THREE.Mesh(hm2.build(),hostMat);im.castShadow=true;G.add(im,new THREE.Mesh(hg2.build(),purpleGlow));
  const crawl=[];for(let i=0;i<36;i++){const s=glowSprite(i%5?HOST_GLOW:0xffffff,R(3,7),2.5);G.add(s);const a=V3(R(-170,170),0,R(-200,120)),b=a.clone().add(V3(R(-120,120),0,R(-120,120)));crawl.push({s,a,b,t:R(0,1),v:R(.04,.12)});}
  // the Pathfinder: a spark of blue light coming in
  const pf=glowSprite(0x9ff0ff,10,2.5);G.add(pf);
  return{G,O,S:O.clone().add(V3(0,Rm,0)),crawl,pf,surf};}

/* ---------- the drop bay: a long grey box with benches, rails, red light, a holo table, and the rear ramp ---------- */
function buildBay(wreck){
  const G=new THREE.Group(),m=new Merger(),gm=new Merger(),hull=C(0x6a707a),dk=C(0x22262e),bl=C(0x2a5a96),gd=C(0xd9b25a),red=C(0xff3a2a),wht=C(0xcfe6ff);
  m.add(boxUV(6.4,.2,14.4,2),M(0,-.1,0),dk);
  // the ceiling (the wreck's has a hole torn in it, over the right-hand side)
  if(wreck){m.add(boxUV(6.4,.2,5.2,2),M(0,3.6,-4.6),hull);m.add(boxUV(6.4,.2,5.2,2),M(0,3.6,4.6),hull);m.add(boxUV(3,.2,4,2),M(-1.7,3.6,0),hull);}
  else m.add(boxUV(6.4,.2,14.4,2),M(0,3.6,0),hull);
  for(const s of[-1,1]){if(wreck&&s>0){m.add(boxUV(.2,3.6,5.2,2),M(3.2,1.8,-4.6),hull);m.add(boxUV(.2,3.6,5.2,2),M(3.2,1.8,4.6),hull);m.add(boxUV(.2,1.4,4,2),M(3.2,.7,0),hull);}
    else m.add(boxUV(.2,3.6,14.4,2),M(s*3.2,1.8,0),hull);
    m.add(boxUV(.6,.45,10,2),M(s*2.75,.45,0),dk);m.add(boxUV(.12,.9,10,2),M(s*3.02,1.3,0),bl);m.add(boxUV(.08,.08,13,2),M(s*1.5,3.25,0),gd);
    gm.add(new THREE.BoxGeometry(.05,.06,13.6),M(s*3.08,3.3,0),red);gm.add(new THREE.BoxGeometry(.05,.04,13.6),M(s*3.08,.08,0),wht);}
  for(let z=-6;z<=6;z+=2.4){m.add(boxUV(6.4,.3,.3,2),M(0,3.4,z),dk);for(const s of[-1,1])m.add(boxUV(.3,3.4,.3,2),M(s*3,1.7,z),dk);}
  // the front wall, with the doorway through to the cockpit
  for(const s of[-1,1])m.add(boxUV(2.4,3.6,.2,2),M(s*2,1.8,-7.2),hull);m.add(boxUV(1.6,1.2,.2,2),M(0,3,-7.2),hull);
  gm.add(new THREE.BoxGeometry(1.4,.05,.05),M(0,2.35,-7.1),wht);
  // a console by the doorway
  m.add(boxUV(1.2,1,.4,2),M(-2.2,1.2,-6.9),dk);
  const G1=new THREE.Mesh(m.build(),metalMat);G1.castShadow=G1.receiveShadow=true;G.add(G1,new THREE.Mesh(gm.build(),lightMat));
  // the rear ramp: hinged at the floor, at +z
  const ramp=new THREE.Group();ramp.position.set(0,0,7.2);G.add(ramp);const rp=new THREE.Mesh(vcol(boxUV(6.4,3.6,.2,2),hull),metalMat);rp.position.y=1.8;ramp.add(rp);
  const rs=new THREE.Mesh(vcol(new THREE.BoxGeometry(5.6,.06,.05),red),lightMat);rs.position.set(0,3.4,-.12);ramp.add(rs);
  // the holo table and what it shows: one objective, highlighted
  const ped=new THREE.Mesh(vcol(new THREE.CylinderGeometry(.35,.5,1.1,12),dk),metalMat);ped.position.set(0,.55,-1.2);G.add(ped);
  const hc=document.createElement('canvas');hc.width=256;hc.height=160;const hx=hc.getContext('2d'),ht=new THREE.CanvasTexture(hc);
  const holo=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.8),new THREE.MeshBasicMaterial({map:ht,transparent:true,opacity:.85,toneMapped:false,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  holo.position.set(0,1.75,-1.2);holo.rotation.y=Math.PI;G.add(holo);
  const drawHolo=(t,glitch)=>{hx.clearRect(0,0,256,160);hx.strokeStyle='rgba(127,227,255,.8)';hx.strokeRect(4,4,248,152);hx.font='11px monospace';hx.fillStyle='rgba(127,227,255,.7)';
    hx.fillText('PATHFINDER · STRIKE TEAM 1',12,22);hx.fillText('TGT: HOST INSTALLATION · SITE K',12,38);
    const pulse=.6+.4*Math.sin(t*6);hx.fillStyle=`rgba(255,210,122,${pulse})`;hx.fillRect(12,62,232,30);hx.fillStyle='#1a1206';hx.font='bold 15px monospace';hx.fillText('UNKNOWN ARTIFACT',44,83);
    hx.fillStyle='rgba(127,227,255,.6)';hx.font='10px monospace';hx.fillText('RECOVER · EXTRACT · NO ENGAGEMENT BRIEF',12,116);hx.fillText('SOURCE: TIDE CITY COMMAND',12,132);
    if(glitch)for(let i=0;i<12;i++){hx.fillStyle='rgba(255,90,74,.6)';hx.fillRect(Math.random()*256,Math.random()*160,Math.random()*80,2);}ht.needsUpdate=true;};drawHolo(0);
  // red lamps
  const lamps=[];for(const z of[-4,3]){const l=new THREE.PointLight(C(0xff2a1a),2,12,1.4);l.position.set(0,3.1,z);G.add(l);lamps.push(l);}
  const fill=new THREE.PointLight(C(0x9fc8ff),.5,10,1.6);fill.position.set(0,2.4,-1.2);G.add(fill);
  scene.add(G);return{G,ramp,holo,drawHolo,lamps,fill};}

/* ---------- the cockpit: two seats, consoles, a wide canopy ---------- */
let CK=null;
function buildCockpit(){const G=new THREE.Group();G.position.set(30000,0,0);scene.add(G);const m=new Merger(),gm=new Merger(),dk=C(0x1c2028),hull=C(0x5a606a),gd=C(0xd9b25a),cy=C(0x7fe3ff);
  m.add(boxUV(5,.2,5,2),M(0,-.1,0),dk);m.add(boxUV(5,1,.4,2),M(0,.5,-2.4),dk);
  // the canopy frame: struts, and the console under it
  for(const x of[-2.4,-.8,.8,2.4])m.add(boxUV(.12,.12,2.6,2),M(x,2.1,-1.6,-.75,0,0),hull);m.add(boxUV(5,.14,.14,2),M(0,2.9,-.6),hull);m.add(boxUV(5,.14,.14,2),M(0,1.05,-2.5),hull);
  for(const s of[-1,1]){m.add(boxUV(.2,3,5,2),M(s*2.5,1.5,0),dk);m.add(boxUV(1,.3,1,2),M(s*1.1,.6,.2),dk);m.add(boxUV(1,1.3,.25,2),M(s*1.1,1.15,.75),dk);
    m.add(boxUV(1.6,.15,1.1,2),M(s*1.1,.95,-1.75,-.35,0,0),dk);gm.add(new THREE.BoxGeometry(1.4,.02,.6),M(s*1.1,1.03,-1.75,-.35,0,0),cy);}
  m.add(boxUV(5,3,.2,2),M(0,1.5,2.5),dk);m.add(boxUV(5,.2,3.4,2),M(0,3,1),hull);gm.add(new THREE.BoxGeometry(4.6,.04,.04),M(0,2.9,1),gd);
  const gmesh=new THREE.Mesh(gm.build(),lightMat);G.add(new THREE.Mesh(m.build(),metalMat),gmesh);
  // Landry's display: the one that shows her something
  const dc=document.createElement('canvas');dc.width=256;dc.height=160;const dx=dc.getContext('2d'),dt=new THREE.CanvasTexture(dc);
  const disp=new THREE.Mesh(new THREE.PlaneGeometry(.9,.56),new THREE.MeshBasicMaterial({map:dt,toneMapped:false}));disp.position.set(-1.1,1.45,-1.45);disp.rotation.x=-.35;G.add(disp);
  const lamp=new THREE.PointLight(C(0x9fc8ff),.9,8,1.5);lamp.position.set(0,2.4,0);G.add(lamp);const red=new THREE.PointLight(C(0xff2a1a),0,8,1.5);red.position.set(0,2.6,.6);G.add(red);
  return{G,disp,dx,dt,lamp,red,gmesh};}
// what the display shows: the ship's state, the drive, and then for one moment, something under the planet
function drawDisplay(mode,t){const x=CK.dx;x.fillStyle='#03101a';x.fillRect(0,0,256,160);x.font='11px monospace';
  if(mode==='fault'){x.fillStyle='#ff5a4a';x.fillText('SHIELDS  '+Math.max(0,Math.round(30-t*6))+'%',12,24);x.fillText('SLIPSCAPE DRIVE',12,52);x.font='bold 18px monospace';x.fillText(Math.sin(t*8)>0?'NO RESPONSE':'',12,80);
    x.font='11px monospace';x.fillStyle='#7fe3ff';x.fillText('NEAREST BODY: ASTRAEA',12,120);x.fillText('OLD ARK CHART · NO SURVEY',12,136);}
  else if(mode==='shape'){x.strokeStyle='#ffd27a';x.lineWidth=1.5;x.beginPath();x.arc(128,52,120,Math.PI*.15,Math.PI*.85,false);x.stroke();   // the planet's curve, in section
    x.globalAlpha=.85;x.strokeStyle='#e8eeff';x.beginPath();const cx=128,cy=128;for(let k=0;k<7;k++){const r=8+k*7;x.moveTo(cx+r,cy);for(let a=0;a<=6.3;a+=.2)x.lineTo(cx+Math.cos(a)*r*(1+.2*Math.sin(a*3+k)),cy+Math.sin(a)*r*.5);}x.stroke();
    x.fillStyle='#ffd27a';x.fillRect(cx-2,cy-2,4,4);x.font='10px monospace';x.fillText('DEPTH ▓▓.▓ KM',150,118);x.fillText('38.2N 141.6E',150,132);x.globalAlpha=1;
    if(Math.random()<.4){x.fillStyle='rgba(255,255,255,.5)';x.fillRect(0,Math.random()*160,256,2);}}
  else if(mode==='off'){if(Math.random()<.2){x.fillStyle='#0a1a26';x.fillRect(0,Math.random()*160,256,3);}}
  CK.dt.needsUpdate=true;}

/* ---------- Astraea: pale ground under a red sky, tall white growths like bone, the cloud deck above; white towers far off ---------- */
let AST=null;
function buildAstraea(){const A0=V3(-30000,0,0),G=new THREE.Group();G.position.copy(A0);scene.add(G);
  const hY=(x,z)=>6*fbm(x*.004+11,z*.004)+2*vnoise(x*.03,z*.03)-sstep(-40,0,z)*sstep(40,0,z)*sstep(-200,-120,x)*sstep(380,300,x)*2;
  const N=coarse?120:180,S=2400,g=new THREE.PlaneGeometry(S,S,N,N);g.rotateX(-Math.PI/2);const P0=g.attributes.position,col=new Float32Array(P0.count*3);
  for(let i=0;i<P0.count;i++){const x=P0.getX(i),z=P0.getZ(i);P0.setY(i,hY(x,z));const n=vnoise(x*.01,z*.01);col[i*3]=.86+n*.1;col[i*3+1]=.62+n*.1;col[i*3+2]=.52+n*.05;}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();const gr=new THREE.Mesh(g,astraeaGroundMat);gr.receiveShadow=true;G.add(gr);
  // the bone-white growths
  const cg=new THREE.ConeGeometry(.6,1,7);cg.translate(0,.5,0);vcol(cg,C(0xf0e6da));const trees=new THREE.InstancedMesh(cg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.1}),coarse?220:420);
  const M4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();let k=0;
  for(let t=0;t<2000&&k<trees.count;t++){const x=R(-900,900),z=R(-900,900);if(Math.abs(z)<26&&x>-260&&x<320)continue;const h=R(8,30);e.set(R(-.2,.2),R(0,6),R(-.2,.2));q.setFromEuler(e);
    M4.compose(V3(x,hY(x,z)-.5,z),q,V3(h*.09,h,h*.09));trees.setMatrixAt(k++,M4);}
  trees.count=k;trees.castShadow=true;G.add(trees);
  // a few that the ship will break on its way through
  const snap=[];for(const [x,z,h] of[[-60,6,22],[-10,-8,18],[40,10,26],[90,-6,20]]){const m=new THREE.Mesh(cg,trees.material);m.scale.set(h*.09,h,h*.09);m.position.set(x,hY(x,z)-.5,z);m.castShadow=true;G.add(m);snap.push({m,x,fall:0,dir:z>0?1:-1});}
  // far off, through the haze: white towers, a city nobody has lived in for a long time
  const tm=new Merger();for(let i=0;i<22;i++){const x=R(-500,500),z=R(-1100,-850),h=R(60,240);tm.add(new THREE.CylinderGeometry(R(4,10),R(10,18),h,8),M(x,h/2,z),C(0xf4ece4));tm.add(new THREE.ConeGeometry(R(4,9),h*.3,8),M(x,h+h*.15,z),C(0xf4ece4));}
  const towers=new THREE.Mesh(tm.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}));G.add(towers);
  // the cloud deck
  const cc=document.createElement('canvas');cc.width=cc.height=256;const cx=cc.getContext('2d'),img=cx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){const n=fbm(x*.03,y*.03),a=Math.max(0,Math.min(1,(n-.42)*3.2));const i=(y*256+x)*4;img.data[i]=255;img.data[i+1]=228;img.data[i+2]=214;img.data[i+3]=a*255;}
  cx.putImageData(img,0,0);const ct=new THREE.CanvasTexture(cc);ct.wrapS=ct.wrapT=THREE.RepeatWrapping;ct.repeat.set(3,3);
  ct.repeat.set(8,8);const clouds=[];for(const [y,op] of[[520,.75],[560,.6],[610,.45]]){const c=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000),new THREE.MeshBasicMaterial({map:ct,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,color:C(0xffd8c8)}));c.rotation.x=-Math.PI/2;c.position.y=y;G.add(c);clouds.push(c);}
  // the trench the ship digs, dark and smoking (grows as it slides)
  const trench=new THREE.Mesh(new THREE.PlaneGeometry(1,10),new THREE.MeshBasicMaterial({color:C(0x2a1a14),transparent:true,opacity:.85,depthWrite:false}));trench.rotation.x=-Math.PI/2;trench.position.set(-200,.3,0);trench.visible=false;G.add(trench);
  return{G,A0,hY,snap,clouds,trench};}

/* ---------- the missile, the plasma sheath, the debris ---------- */
function makeMissile(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,5,8).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:C(0x2a2432),metalness:.6,roughness:.4}));g.add(b);
  const f=glowSprite(0xd8a0ff,6,3);f.position.z=3;g.add(f);scene.add(g);return g;}
const sheathMat=new THREE.MeshBasicMaterial({color:C(0xff8a3a).multiplyScalar(2),transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
// the fire she pushes ahead of her: a bright knot at the nose and a ragged wash of flame streaming back along the hull
function makeSheath(len){const g=new THREE.Group();const parts=[];for(let i=0;i<9;i++){const s=glowSprite(i<2?0xffd8a0:i<5?0xff8a40:0xff5a1a,i<2?18:R(10,20),i<2?1.3:1.1,.3);s.position.set(R(-7,7),R(-6,-1),-len*.48+i*len*.06);g.add(s);parts.push(s);}
  g.children[0].userData.k=1;g.userData.parts=parts;g.children.push||0;return g;}
function flickerSheath(sh){for(const s of sh.userData.parts){s.material.opacity=.18+.18*Math.random();s.scale.setScalar(s.scale.x*(.92+Math.random()*.16));if(s.scale.x>24||s.scale.x<8)s.scale.setScalar(R(10,20));}}

/* ======================= BEFORE: the opening ======================= */
function introScene(done){
  SETS.active=true;P.input=false;
  if(!ORB)ORB=buildOrbit();
  const BAYP=V3(0,330,118);const bay=buildBay(false);bay.G.position.copy(BAYP);
  const pf=makeDropship();pf.position.copy(BAYP);pf.visible=false;   // the dropship: the bay is inside her
  // the team in the bay: Rhen at the holo table, the others along the benches facing in
  const L=(x,y,z)=>bay.G.localToWorld(V3(x,y,z));
  const spots=[[0,-2.6,Math.PI],[-1.9,.4,-Math.PI/2],[1.9,-.6,Math.PI/2],[-1.9,2.6,-Math.PI/2]];
  const placeTeam=()=>{crew().forEach((H,i)=>{const [x,z,ry]=spots[i];H.root.position.copy(L(x,0,z));H.root.rotation.y=ry;H.root.visible=true;reviveHuman(H);});};
  bay.G.updateMatrixWorld(true);placeTeam();
  // clouds and fire over the facility for the fall
  const clouds=[];for(let i=0;i<26;i++){const s=glowSprite(0x6a5a7a,R(70,140),.55,.32);s.material.blending=THREE.NormalBlending;s.material.color.copy(C(0x3a3248));s.position.set(R(-150,150),R(130,190),R(-320,60));scene.add(s);clouds.push(s);}
  const flak=()=>{if(rng()<.12){const c=pick(clouds);boom(c.position.clone().add(V3(R(-20,20),R(-8,8),R(-20,20))),R(30,60),rng()<.5?0xffa060:0xb070ff,R(.4,.8));}
    if(rng()<.08){const sp=pick(SPIRES);fire(V3(sp.x,sp.H,sp.z),V3(R(-60,60),R(250,380),R(-120,120)),300,'hbolt');}};
  const fallStart=crew().map((H,i)=>L(spots[i][0]*.5,0,7.5+i*.6)),landAt=[V3(0,0,24),V3(-4,0,28),V3(4,0,27),V3(-1,0,32)];
  const thr=crew().map(()=>{const s=glowSprite(0x9fe8ff,1.2,2.5);s.visible=false;scene.add(s);return s;});
  let jumpT=-1,flakOn=false,shake=0;
  const fall=(t,dt)=>{crew().forEach((H,i)=>{const u=clamp((t-i*.35)/9,0,1),e=u*u*(3-2*u);if(t<i*.35)return;const p=H.root.position,s0=fallStart[i],l0=landAt[i];
    p.x=lerp(s0.x,l0.x,e);p.z=lerp(s0.z,l0.z,e);p.y=lerp(s0.y,groundY(l0.x,l0.z),1-Math.pow(1-u,1.4));
    H.root.rotation.set(u<.85?-.9*(1-sstep(.7,.85,u)):0,0,0);H.crouchTo=u>.9?.8:0;poseHuman(H,dt,0,0,false);
    if(u<.9){H.arms[0].sh.rotation.z=1.1;H.arms[1].sh.rotation.z=-1.1;}
    thr[i].visible=u>.55&&u<.99;thr[i].position.copy(p).add(V3(0,.9,.5));thr[i].scale.setScalar(u>.8?2.2:1.2);
    if(u>.98&&!H.landed){H.landed=true;for(let k=0;k<6;k++)puff(p.clone().add(V3(R(-1.5,1.5),.2,R(-1.5,1.5))),R(1.5,3),1.6);boom(p.clone().setY(.4),4,0x9fe8ff,.4);}});};
  setLook('moon');
  SETS.anim.push((dt,T)=>{if(!SETS.active)return false;
    for(const c of ORB.crawl){c.t=(c.t+dt*c.v)%1;const x=lerp(c.a.x,c.b.x,c.t),z=lerp(c.a.z,c.b.z,c.t);c.s.position.set(x,ORB.surf(x,z)+3,z);}
    if(flakOn)flak();if(shake>0){camera.position.x+=R(-1,1)*shake*.022;camera.position.y+=R(-1,1)*shake*.022;}});   // (shake toned down, Oct 22)
  const S=ORB.S,O=ORB.O;
  playCut([
    // Oct 22: the opening flies over the real installation (the map you play), not a stand-in model on a separate moon.
    // Night, Astraea huge over the far end, the spires lit, the yard and the gate below, the hangar on the far face. A spark coming in
    {dur:3.5,black:true,small:'Pathfinder · Arc 01 · 08.03.2237',cap:'Pathfinder',cam:[[60,150,200]],look:[[0,45,-220]],fn:t=>{if(t<.1){setLook('moon');scene.fog.density=.0005;}}},
    {dur:8,cam:[[60,150,200],[20,95,95]],look:[[0,45,-220],[0,40,-200]],
      fn:(t,dt)=>{if(typeof sfx!=='undefined')sfx.drone('hum',42,.08*Math.min(1,t/2),'sine');scene.fog.density=.0005;}},
    // INT. the drop bay. Red light. The ship shakes. Weapons checked, cells locked in
    {dur:6,camAt:(u,t,o)=>o.copy(L(1.6,2.2,-6.4+u*.6)),lookAt:(u,t,o)=>o.copy(L(-.4,1.2,4)),
      say:[[2.6,'Ensign Landry','We’re thirty seconds out.']],
      fn:(t,dt)=>{if(t<.1){setLook('moon');scene.fog.density=.0005;if(typeof sfx!=='undefined'){sfx.drone('hum',42,0);sfx.reload();}}shake=1+Math.sin(t*3);
        bay.lamps.forEach((l,i)=>l.intensity=1.2+1.4*Math.max(0,Math.sin(t*4+i*2)));bay.drawHolo(t);
        crew().forEach((H,i)=>{H.reload=i===1||i===3?(t*.6+i*.3)%1:0;H.aimPitch=-.3;poseHuman(H,dt,0,i===0?0:.5,false);});
        const M2=SQUAD[0].H;M2.head.rotation.y=t>1.2?-.8:0;if(t>2&&t<2.1&&typeof sfx!=='undefined')sfx.reload();}},
    // the objective: one line, highlighted
    {dur:7,camAt:(u,t,o)=>o.copy(L(.9,1.85,-3.6+u*.2)),lookAt:(u,t,o)=>o.copy(L(-.1,1.7,-1.2)),
      say:[[.5,'Captain Rhen','We get in. We find it. We get out.'],[1.2,'Sergeant Marsh','That’s it?'],[.4,'Captain Rhen','That’s what we’re told.']],
      fn:(t,dt)=>{shake=.6;bay.lamps.forEach((l,i)=>l.intensity=1.2+1.4*Math.max(0,Math.sin(t*4+i*2)));bay.drawHolo(t,t>6.5);crew().forEach((H,i)=>poseHuman(H,dt,0,i===0?0:.4,false));P.H.head.rotation.x=-.3;}},
    // the ship drops. Everyone grabs something. Brace. The ramp opens on wind and the dark
    {dur:5.5,camAt:(u,t,o)=>o.copy(L(-1.2,2.4,-6.2)),lookAt:(u,t,o)=>o.copy(L(0,1,7)),fov:[62,62],
      say:[[.2,'Ensign Landry','Brace!','alert']],
      fn:(t,dt)=>{shake=t<1.2?2.6:1.1;if(t<.1){flashScreen(.15);if(typeof sfx!=='undefined')sfx.crash(camera.position);}
        bay.lamps.forEach((l,i)=>l.intensity=1.2+1.4*Math.max(0,Math.sin(t*6+i*2)));
        crew().forEach(H=>{poseHuman(H,dt,0,0,false);H.arms[0].sh.rotation.x=t<2.5?-2.7:0;H.arms[1].sh.rotation.x=t<2.5?-2.6:0;H.crouchTo=t<2.5?.3:0;});
        bay.ramp.rotation.x=1.75*easeIO((t-2)/2.5);if(t>2&&t<2.1&&typeof sfx!=='undefined')sfx.static(2.5);}},
    // the team jumps
    {dur:4,camAt:(u,t,o)=>o.copy(L(.8,1.9,-5.8)),lookAt:(u,t,o)=>o.copy(L(0,.4,12)),
      fn:(t,dt)=>{shake=1;crew().forEach((H,i)=>{const k=clamp((t-.3-i*.45)/1.2,0,1);H.root.rotation.y=0;const p0=L(spots[i][0]*.6,0,spots[i][1]),p1=L(spots[i][0]*.3,0,9.5);
        H.root.position.lerpVectors(p0,p1,k);H.root.rotation.y=Math.PI;if(k>=1)H.root.position.y-=(t-.3-i*.45-1.2)*9;poseHuman(H,dt,k>0&&k<1?6:0,0,true);});}},
    // EXT. the fall: through the cloud over the facility; fire in the cloud; guns in the distance
    {dur:9,fov:[70,70],camAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x+3,p.y+7,p.z+16);},lookAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x*.5,p.y-26,p.z-120);},
      fn:(t,dt)=>{if(t<.1){bay.G.visible=false;pf.visible=true;pf.position.copy(BAYP);flakOn=true;shake=0;crew().forEach(H=>H.landed=false);scene.fog.density=.0008;}
        pf.position.z-=dt*40;pf.position.y+=dt*6;if(rng()<.1){const sp=pick(SPIRES);fire(pf.position.clone().add(V3(0,-1,-16)),V3(sp.x,sp.H*.7,sp.z),400,'pfgun',q=>boom(q,24,0xffc070,.8));}
        fall(t,dt);}},
    {dur:6,cam:[[10,1.2,6],[8,1.4,8]],look:[[0,14,30],[0,3,28]],small:'Pathfinder · Arc 01',cap:'Get in. Find it. Get out.',
      fn:(t,dt)=>{fall(9+t*1.2,dt);flakOn=t<3;}},
  ],sk=>{
    // clean up the sets, stand the team in the crater, and hand over
    SETS.active=false;flakOn=false;for(const c of clouds)scene.remove(c);for(const s of thr)scene.remove(s);scene.remove(bay.G);scene.remove(pf);if(ORB){scene.remove(ORB.G);ORB=null;}
    if(typeof sfx!=='undefined')sfx.drone('hum',42,0);setLook('moon');resetSky();
    crew().forEach((H,i)=>{H.root.rotation.set(0,0,0);H.crouchTo=0;reviveHuman(H);H.root.visible=true;H.arms[0].sh.rotation.z=H.arms[1].sh.rotation.z=0;});
    P.pos.set(0,groundY(0,22),22);P.yaw=0;P.pitch=-.05;P.H.root.rotation.y=0;SQUAD.forEach((A,i)=>{A.pos.copy(landAt[i+1]);A.pos.y=groundY(A.pos.x,A.pos.z);A.yaw=0;A.on=true;});
    if(done)done(sk);},{hush:true});
}

/* ======================= AFTER: the chase, the Pathfinder breaking, the fall, the crash =======================
   The dropship lifts off the hangar with the package → you fly it (a fight you can't win) toward the Pathfinder in orbit, and watch
   her broken in two in front of you → the cockpit ("Can we make Slipscape?" "No." Her drive is gone with her) → the missile, the fall
   into Astraea, the crash. The Pathfinder's two halves stay up there: that is the wreck the Keepers find in Archive 02. */
function endingScene(){
  P.input=false;WP=null;onUse=null;for(const E of ENEMIES)scene.remove(E.H.root);ENEMIES.length=0;for(const Tt of TURRETS)Tt.g.visible=false;
  if(P.wall)breakWall();P.sentry=null;sentryG.visible=false;zealAura.visible=false;for(const T0 of TELE)scene.remove(T0.m);TELE.length=0;
  const ds=PICKUP,gs=GUNSHIP,B=V3(PLAT.x+PLAT.r-1.5,PLAT_Y,PLAT.z);
  if(!AST)AST=buildAstraea();hold.noPF=true;
  const out=[];for(let i=0;i<4;i++){const K=SHIPKIT.wraith(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat()),new THREE.Mesh(K.glow,fleetGlowMat(HOST_GLOW,2)));g.scale.setScalar(.6);g.visible=false;scene.add(g);MODELS.swapShip(g,'wraith',{ref:K.geo});out.push(g);}
  let shake=0;SETS.anim.push(()=>{if(shake>0){camera.position.x+=R(-1,1)*shake*.05;camera.position.y+=R(-1,1)*shake*.05;}if(phase==='end')return false;});
  const lift0=ds.position.clone();
  playCut([
    // everyone up the ramp; she lifts away from the hangar
    {dur:5.5,cam:[[PLAT.x-10,PLAT_Y+5,PLAT.z+12],[PLAT.x-8,PLAT_Y+5.5,PLAT.z+10]],look:[[B.x+8,PLAT_Y+3,B.z-2]],
      say:[[.3,'Ensign Landry','Everyone’s aboard! Hold on to something!','alert']],
      fn:(t,dt)=>{if(t<.1){const c=camera.position;for(const Pp of ROOF.parts)if(Pp.G.position.distanceTo(c)<10||Math.hypot(Pp.G.position.x-c.x,Pp.G.position.z-c.z)<7)Pp.G.visible=false;
          if(typeof CHUNKS!=='undefined')for(const k of CHUNKS)if(k.m.position.distanceTo(c)<8)k.m.visible=false;}   // (the camera used to open inside a fallen roof slab)
        crew().forEach((H,i)=>{const p=H.root.position,k=clamp(t/2.4-i*.15,0,1);p.lerpVectors(p,B.clone().add(V3(3,0,0)),k*.08);H.root.rotation.y=-Math.PI/2;poseHuman(H,dt,k<1?5:0,0,true);H.root.visible=k<.95;});
        if(RAMP)RAMP.visible=t<2.6;const u=Math.max(0,t-2.8);ds.position.copy(lift0).add(V3(u*u*3,u*u*2.2,0));ds.rotation.z=-u*.06;updateHold(dt,true);}},
    // away from the moon; the Host fighters come off the spires after her
    {dur:5,camAt:(u,t,o)=>o.copy(ds.position).add(V3(-30,10,34)),lookAt:(u,t,o)=>o.copy(ds.position),
      say:[[.6,'Ensign Landry','We’ve got company!','alert']],
      fn:(t,dt)=>{ds.position.add(V3(dt*60,dt*(30+t*12),-dt*20));ds.rotation.set(.25,-Math.PI/2+.3,-.2);if(gs)gs.visible=t<2;
        out.forEach((g,i)=>{g.visible=true;g.position.copy(ds.position).add(V3(-60-i*18+t*6,-30+Math.sin(t+i)*8,30+i*20));g.lookAt(ds.position);g.rotateY(Math.PI);
          if(rng()<.05)fire(g.position.clone(),ds.position.clone().add(V3(R(-4,4),R(-2,2),R(-4,4))),300,'hbolt',q=>boom(q,R(4,8),0x9fe8ff,.3));});}},
  ],()=>{if(gs)gs.visible=false;out.forEach(g=>scene.remove(g));startFlight(ds,()=>{P.input=false;fallScene(ds);});},{hush:true});
}
// the rest of the way down: the cockpit, the missile, Astraea's air, the cloud, the ground
function fallScene(ds){
  let shake=0,missile=null,sheath=null,deb=[];SETS.anim.push(()=>{if(shake>0){camera.position.x+=R(-1,1)*shake*.03;camera.position.y+=R(-1,1)*shake*.03;}if(phase==='end')return false;});
  if(!CK)CK=buildCockpit();const X=CK.G.position;const ck=(x,y,z)=>V3(X.x+x,y,X.z+z);
  const ld=landry();
  const seatCrew=()=>{ld.root.visible=true;ld.root.position.copy(ck(-1.1,.05,.3));ld.root.rotation.y=0;ld.crouchTo=.85;
    P.H.root.position.copy(ck(.9,0,1.3));P.H.root.rotation.set(0,.25,0);P.H.root.visible=true;const mH=SQUAD[0].H;mH.root.position.copy(ck(-.2,0,2.1));mH.root.rotation.set(0,-.1,0);mH.root.visible=true;
    SQUAD[1].H.root.visible=SQUAD[2].H.root.visible=false;};
  let spin=0,alarmT=0;
  const cockpitLive=(t,dt,mode)=>{poseHuman(ld,dt,0,0,false);ld.arms[0].sh.rotation.x=-.9;ld.arms[1].sh.rotation.x=-.9;ld.arms[0].el.rotation.x=-.6;ld.arms[1].el.rotation.x=-.6;
    poseHuman(P.H,dt,0,0,false);poseHuman(SQUAD[0].H,dt,0,0,false);SQUAD[0].H.arms[0].sh.rotation.x=-2.5;
    alarmT+=dt;if(alarmT>.8){alarmT=0;if(typeof sfx!=='undefined')sfx.alarm();}CK.red.intensity=1.5*Math.max(0,Math.sin(t*6));drawDisplay(mode||'fault',t);};
  const AST_IN_WINDOW=V3(-.15,-.2,-1);
  playCut([
    // the cockpit: alarms. Losing shields. A hit; she spins; the planet fills the canopy
    {dur:6,cam:[[X.x+.4,1.95,X.z+2.3]],look:[[X.x-.4,1.5,X.z-3]],
      say:[[.3,'Sergeant Marsh','We’re losing shields!','alert'],[0,'Ensign Landry','I know!','alert']],
      fn:(t,dt)=>{if(t<.1){if(ORB){scene.remove(ORB.G);ORB=null;}setLook('orbit');scene.fog.density=0;seatCrew();putAstraea(V3(-.6,.25,-1),900);}cockpitLive(t,dt);shake=1.2;
        if(t>4&&!CK.hit){CK.hit=true;flashScreen(.4);shake=4;if(typeof sfx!=='undefined')sfx.crash(camera.position);}if(CK.hit){spin+=dt*1.6;}
        skyGroup.rotation.set(0,0,spin);const k=sstep(4,6,t);putAstraea(V3(-.6+k*.45,.25-k*.45,-1),900+k*900);}},
    {dur:7,cam:[[X.x+.2,1.8,X.z+1.9]],look:[[X.x-1,1.4,X.z-1.6]],
      say:[[.3,'Captain Rhen','Can we make Slipscape?'],[1.6,'Ensign Landry','No.']],
      fn:(t,dt)=>{cockpitLive(t,dt);spin+=dt*Math.max(0,1.6-t*.4);skyGroup.rotation.set(0,0,spin);shake=.8;putAstraea(AST_IN_WINDOW,1800);ld.head.rotation.x=.4;}},
    {dur:5,cam:[[X.x+.5,1.9,X.z+2.4]],look:[[X.x-.6,1.5,X.z-2]],
      say:[[1.4,'Captain Rhen','Try again.'],[.3,'Ensign Landry','I said no.']],
      fn:(t,dt)=>{cockpitLive(t,dt);skyGroup.rotation.set(0,0,spin);putAstraea(AST_IN_WINDOW,1800);ld.head.rotation.x=0;}},
    {dur:3,cam:[[X.x-.4,1.7,X.z+1.2]],look:[[X.x-1.1,1.4,X.z-1.5]],
      say:[[.4,'Ensign Landry','MISSILE!','alert']],
      fn:(t,dt)=>{cockpitLive(t,dt);skyGroup.rotation.set(0,0,spin);if(Math.floor(t*10)%2&&typeof sfx!=='undefined')sfx.empty();}},
    // outside: she dives; the missile misses by inches; the planet below
    {dur:5,camAt:(u,t,o)=>o.copy(ds.position).add(V3(14,4,12)),lookAt:(u,t,o)=>o.copy(ds.position).add(V3(-4,-6,-12)),
      fn:(t,dt)=>{if(t<.1){skyGroup.rotation.set(0,0,0);ld.root.visible=false;P.H.root.visible=false;SQUAD[0].H.root.visible=false;resetSky();putAstraea(V3(-.2,-.9,-.5),1900);ds.position.set(20000,3000,0);ds.rotation.set(-.5,0,0);missile=makeMissile();}
        ds.position.add(V3(0,-dt*40,-dt*60));ds.rotation.x=-.5-t*.05;const mp=ds.position.clone().add(V3(-16-t*1.2,26-t*10,40-t*32));   // it streaks past her off the far side, twenty metres clear, and bursts beyond (it used to fly through the hull)
        missile.position.copy(mp);missile.lookAt(mp.clone().add(V3(-1.2,-10,-32)));if(rng()<.8)puff(mp.clone(),R(1,2),1.2);if(t>3.2&&!missile.boomed){missile.boomed=true;boom(mp,36,0xd8a0ff,1);boom(mp,22,0xfff0d0,.5);missile.visible=false;shake=2;}}},
    // into Astraea's air: fire all round her; plates tearing off
    {dur:6,camAt:(u,t,o)=>o.copy(ds.position).add(V3(7+u*3,10,30-u*5)),lookAt:(u,t,o)=>o.copy(ds.position).add(V3(0,-3,-10)),
      say:[[1,'Ensign Landry','We’re in her atmosphere! I’ve got nothing, Captain, nothing!','alert']],
      fn:(t,dt)=>{if(t<.1){if(missile)scene.remove(missile);setLook('entry');scene.fog.density=.00025;ds.position.set(20000,2000,0);ds.rotation.set(-.55,0,0);sheath=makeSheath(34);ds.add(sheath);}
        ds.position.add(V3(0,-dt*50,-dt*70));flickerSheath(sheath);shake=2.5;
        if(rng()<.25)boom(ds.position.clone().add(V3(R(-4,4),R(-4,0),R(-14,8))),R(3,7),rng()<.5?0xffb060:0xff6a2a,.4);
        if(rng()<.08){const d=new THREE.Mesh(boxUV(R(1,2.5),.2,R(1,3),2),metalMat);vcol(d.geometry,C(0x6a707a));d.position.copy(ds.position).add(V3(R(-3,3),R(0,3),R(-8,8)));scene.add(d);deb.push({d,v:V3(R(-6,6),R(8,20),R(50,90))});}
        for(const D of deb){D.d.position.addScaledVector(D.v,dt);D.d.rotation.x+=dt*4;}}},
    // inside: the package wakes. A pulse goes through the ship. For a moment the display shows a shape, a place, something under the planet
    {dur:7,cam:[[X.x+.1,1.75,X.z+1.6],[X.x-.5,1.6,X.z+.6]],look:[[X.x-1.1,1.45,X.z-1.45]],
      say:[[5.4,'Ensign Landry','What was that?']],
      fn:(t,dt)=>{if(t<.1){seatCrew();P.H.root.visible=true;SQUAD[0].H.root.visible=true;CK.lamp.intensity=.9;}cockpitLive(t,dt,t>1.6&&t<4.6?'shape':t>4.6?'off':'fault');shake=1.5;
        if(t>1.2&&!CK.pulse){CK.pulse=true;flashScreen(.25);const p=glowSprite(0xc8d4ff,1,2.5,.9);p.position.copy(ck(0,1.6,3));scene.add(p);CK.pulseS=p;if(typeof sfx!=='undefined')sfx.wake();}
        if(CK.pulseS){CK.pulseS.scale.setScalar(1+(t-1.2)*14);CK.pulseS.position.z-=dt*3;CK.pulseS.material.opacity=Math.max(0,.9-(t-1.2)*.6);}
        CK.lamp.intensity=t>1.2&&t<3?(Math.random()<.5?0:1.2):.9;CK.gmesh.visible=!(t>1.2&&t<3&&Math.random()<.4);}},
    {dur:2.5,cam:[[X.x+.4,1.95,X.z+2.3]],look:[[X.x-.6,1.5,X.z-2]],fn:(t,dt)=>{cockpitLive(t,dt,'off');}},
    // through the cloud
    {dur:5,camAt:(u,t,o)=>{const A=AST.A0;o.set(A.x-520,330,A.z+120);},lookAt:(u,t,o)=>o.copy(ds.position),
      fn:(t,dt)=>{if(t<.1){if(CK.pulseS){scene.remove(CK.pulseS);CK.pulseS=null;}ld.root.visible=false;P.H.root.visible=false;SQUAD[0].H.root.visible=false;
          setLook('astraea');scene.fog.density=.0009;ds.position.copy(AST.A0).add(V3(-700,640,0));ds.rotation.set(0,-Math.PI/2,0);ds.rotateX(-.3);sheath.visible=false;deb.forEach(D=>scene.remove(D.d));deb=[];}
        ds.position.add(V3(dt*90,-dt*80,0));if(rng()<.7)puff(ds.position.clone().add(V3(-12,2,R(-2,2))),R(4,8),3.5);if(rng()<.4)boom(ds.position.clone().add(V3(-8,0,0)),R(6,12),0xff8a3a,.4);shake=.5;}},
    // the ground: she hits, tears through the white growths, ploughs on, and stops
    {dur:7,camAt:(u,t,o)=>{const A=AST.A0;o.set(A.x+lerp(-40,110,u),9+u*3,A.z+44);},lookAt:(u,t,o)=>o.copy(ds.position),
      fn:(t,dt)=>{const A=AST.A0,u=clamp(t/5,0,1),e=1-(1-u)*(1-u);const x=lerp(-260,150,e);ds.position.set(A.x+x,AST.hY(x,0)+3.4+Math.max(0,1-t*2)*50,A.z);ds.rotation.set(0,-Math.PI/2,0);ds.rotateX(-.08*(1-u));ds.rotateZ(.05*Math.sin(t*3)*(1-u));
        if(t<.2&&!ds.hitG){ds.hitG=true;flashScreen(.3);if(typeof sfx!=='undefined'){sfx.crash(ds.position);sfx.collapse(ds.position);}}
        shake=u<1?3*(1-u):0;if(u<1){for(let k=0;k<2;k++)puff(ds.position.clone().add(V3(R(-14,0),R(0,2),R(-6,6))),R(4,9),R(3,6));if(rng()<.5)boom(ds.position.clone().add(V3(R(-14,6),1.5,R(-5,5))),R(8,16),0xff8a3a,.6);}
        AST.trench.visible=true;AST.trench.scale.x=Math.max(1,x+260);AST.trench.position.x=-260+(x+260)/2;
        for(const S of AST.snap){if(S.fall===0&&ds.position.x-A.x>S.x-6){S.fall=.001;boom(S.m.position.clone().add(A).setY(10),12,0xffc08a,.5);}if(S.fall>0){S.fall=Math.min(1.45,S.fall+dt*2);S.m.rotation.z=S.dir*S.fall;}}}},
    // silence, and smoke
    {dur:4,camAt:(u,t,o)=>o.set(AST.A0.x+178,6,AST.A0.z+26),lookAt:(u,t,o)=>o.set(AST.A0.x+150,3,AST.A0.z),
      fn:(t,dt)=>{if(rng()<.4)puff(ds.position.clone().add(V3(R(-8,8),R(1,4),R(-3,3))),R(3,7),5);if(rng()<.1)boom(ds.position.clone().add(V3(R(-10,10),2,R(-3,3))),R(3,6),0xff8a3a,.6);}},
  ],()=>{SETS.active=true;wreckScene(ds,[]);},{hush:true});
}

/* ======================= THE CHASE: you fly the dropship, and you can't win =======================
   Landry hands Rhen the stick while she fights the engines. Host fighters come off the moon after you; you can knock them down,
   as many as you like. Ahead, the Pathfinder is waiting to take you in, with two Host warships on her. Before you get there,
   they break her in two. Then your shields go. */
let FLY=null;
const dogCss=document.createElement('style');dogCss.textContent='body.dog #wpanel,body.dog #gear,body.dog #nade,body.dog #rld,body.dog #wpn,body.dog #shld,body.dog #jump,body.dog #crch,body.dog #use,body.dog .shud{display:none!important}'+
  '.dogbar{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 14px);transform:translateX(-50%);width:min(320px,70vw);z-index:3;pointer-events:none;font:700 10px "Chakra Petch",sans-serif;letter-spacing:.18em;color:#bff0ff;text-align:center;text-shadow:0 1px 4px #000}'+
  '.dogbar i{display:block;height:6px;margin-top:4px;border:1px solid rgba(127,227,255,.5);border-radius:2px;overflow:hidden}.dogbar u{display:block;height:100%;background:linear-gradient(90deg,#7fe3ff,#e9fbff);transition:width .2s}.dogbar.low{color:#ff8a7a}.dogbar.low u{background:#ff6a5a}'+
  '.dogtag{position:fixed;z-index:3;pointer-events:none;transform:translate(-50%,-140%);font:700 10px "Chakra Petch",sans-serif;letter-spacing:.16em;color:#9ff0ff;text-shadow:0 1px 4px #000;white-space:nowrap}';
document.head.appendChild(dogCss);
function startFlight(ds,done){
  if(!ORB)ORB=buildOrbit();setLook('moon');scene.fog.density=0;SETS.active=true;setPhase('dogfight');
  const start=ORB.S.clone().add(V3(0,420,-120));ds.position.copy(start);ds.rotation.set(0,0,0);ds.visible=true;
  // the Pathfinder, waiting high above the moon, and the two Host warships closing on her
  const pf=makePathfinder();pf.scale.setScalar(3);pf.position.copy(start).add(V3(120,240,-1500));pf.rotation.set(0,.4,0);   // drawn big: she has to read as a ship from a long way off
  const war=[0,1].map(i=>{const g=new THREE.Group(),K=SHIPKIT.voidclass(),h0=new THREE.Mesh(K.geo,fleetHullMat(panelTex)),h1=new THREE.Mesh(K.glowGeo,fleetGlowMat(HOST_GLOW,2.2));g.add(h0,h1);   // Empty Host cruisers (Voidclass), not Herald hullsK.geo.computeBoundingBox();
    g.scale.setScalar(180/(K.geo.boundingBox.max.z-K.geo.boundingBox.min.z));scene.add(g);MODELS.swapShip(g,'voidclass',{ref:K.geo,hide:[h0,h1]});g.position.copy(pf.position).add(V3(i?420:-380,i?-60:90,i?-300:-160));g.lookAt(pf.position);g.rotateY(Math.PI);return g;});
  const bar=document.createElement('div');bar.className='dogbar';bar.innerHTML='DROPSHIP SHIELDS<i><u style="width:100%"></u></i>';document.body.appendChild(bar);
  const tag=document.createElement('div');tag.className='dogtag';tag.textContent='PATHFINDER';document.body.appendChild(tag);
  document.body.classList.add('dog');P.input=true;P.alive=true;P.yaw=0;P.pitch=0;fireHeld=false;
  banner(coarse?'You have the stick · left thumb or drag to steer, hold FIRE':'You have the stick · mouse steers, click to fire','alert');
  // the fighters: they come from behind, make firing passes, cross in front of you, and come round again
  const F=[];for(let i=0;i<7;i++){const K=SHIPKIT.wraith(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat()),new THREE.Mesh(K.glow,fleetGlowMat(HOST_GLOW,2)));g.scale.setScalar(.6);scene.add(g);MODELS.swapShip(g,'wraith',{ref:K.geo});
    g.position.copy(start).add(V3(R(-200,200),R(-160,60),R(300,700)));F.push({g,v:V3(0,0,-120),hp:4,dead:0,tgt:null,ret:0,cool:R(1,3),ahead:i%2===0});}
  const N=260,sp=new Float32Array(N*3);for(let i=0;i<N;i++)sp.set([R(-90,90),R(-60,60),R(-160,160)],i*3);
  const streaks=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({size:.3,color:C(0xcfe6ff),transparent:true,opacity:.55,depthWrite:false}));streaks.geometry.setAttribute('position',new THREE.BufferAttribute(sp,3));streaks.frustumCulled=false;scene.add(streaks);
  FLY={ds,pf,war,F,bar,tag,streaks,sp,t:0,shields:100,cool:0,kills:0,shake:0,done,said:new Set(),yaw:0,pitch:0,roll:0,gunL:true,broken:0,halves:null};
}
const _dv=new THREE.Vector3(),_dw=new THREE.Vector3(),_dq=new THREE.Quaternion(),_de=new THREE.Euler(0,0,0,'YXZ');
const FLY_LINES=[[1,'Ensign Landry','You fly, Captain! I need both hands on these engines! Get us to the Pathfinder!','alert'],[8,'Sergeant Marsh','Fighters behind us! They’re coming round!','alert'],
  [17,'Ensign Landry','Pathfinder, this is the dropship, open the bay! We’re coming in hot!','alert'],[24,'Okafor','Captain, those are Host warships on her! Two of them!','alert']];
function updateDogfight(dt){const D=FLY;if(!D)return;D.t+=dt;const ds=D.ds;
  // steering: the mouse (or right thumb) sets where you want to point; the left thumb turns you too. She follows, banking into turns
  P.yaw-=joy.x*dt*1.3;P.pitch=clamp(P.pitch+joy.y*dt*.9,-.9,.7);
  const dy=P.yaw-D.yaw;D.yaw+=dy*(1-Math.exp(-dt*2.2));D.pitch+=(P.pitch-D.pitch)*(1-Math.exp(-dt*2.2));D.roll+=(clamp(-dy*1.6,-1,1)-D.roll)*(1-Math.exp(-dt*3));
  _de.set(D.pitch,D.yaw,D.roll);ds.quaternion.setFromEuler(_de);
  const fwd=_dv.set(0,0,-1).applyQuaternion(ds.quaternion).clone();ds.position.addScaledVector(fwd,85*dt);
  // the chase camera, behind and a little above
  const back=fwd.clone().multiplyScalar(-27).add(V3(0,10,0).applyQuaternion(ds.quaternion));camera.position.copy(ds.position).add(back);
  camera.quaternion.copy(ds.quaternion);camera.rotateZ(-D.roll*.6);camera.rotateX(-.13);camera.fov=68;camera.updateProjectionMatrix();
  if(D.shake>0){D.shake-=dt;camera.position.x+=R(-1,1)*D.shake*.5;camera.position.y+=R(-1,1)*D.shake*.5;}
  for(const [t,who,txt,tone] of FLY_LINES)if(D.t>t&&!D.said.has(t)){D.said.add(t);PG.say(who,txt,tone);}
  // the Pathfinder: drifting, firing back at the warships, until they break her
  const pf=D.pf;pf.position.add(V3(0,0,-14*dt));
  for(const w of D.war){w.position.add(V3(0,0,-14*dt));if(!D.broken&&rng()<.18){const to=pf.position.clone().add(V3(R(-20,20),R(-10,10),R(-40,40)));fire(w.position.clone(),to,900,'hbig',q=>boom(q,R(10,18),0xd8a0ff,.5));}
    if(!D.broken&&rng()<.12)fire(pf.position.clone().add(V3(R(-10,10),10,R(-30,30))),w.position.clone().add(V3(R(-30,30),R(-10,10),R(-40,40))),900,'pfbig',q=>boom(q,R(10,18),0xffc070,.5));}
  const dist=ds.position.distanceTo(pf.position);
  if(!D.broken&&(D.t>32||dist<600))breakPathfinder(D);
  if(D.halves){D.broken+=dt;D.halves.forEach((h,i)=>{h.position.addScaledVector(h.userData.v,dt);h.rotateOnAxis(h.userData.ax,dt*h.userData.sp);if(rng()<.25)boom(h.getWorldPosition(new THREE.Vector3()).add(V3(R(-30,30),R(-15,15),R(-50,50))),R(8,20),rng()<.5?0xff8a3a:0xfff0c0,.6);});
    if(D.broken<5&&rng()<.25)boom(pf.position.clone().add(V3(R(-40,40),R(-25,25),R(-60,60))),R(20,45),0xffa050,1);}
  // where she is: a tag over her while she's in front of you
  {_dw.copy(pf.position).project(camera);const on=_dw.z<1&&Math.abs(_dw.x)<1.1&&Math.abs(_dw.y)<1.1;D.tag.style.display=on?'':'none';
   if(on){D.tag.style.left=((_dw.x*.5+.5)*innerWidth)+'px';D.tag.style.top=((-_dw.y*.5+.5)*innerHeight)+'px';D.tag.textContent=D.broken?'PATHFINDER · LOST':'PATHFINDER · '+(dist/1000).toFixed(1)+' KM';}}
  // the fighters
  for(const f of D.F){if(f.dead>0){f.dead-=dt;if(f.dead<=0){f.dead=0;f.hp=4;f.g.visible=true;f.g.position.copy(ds.position).addScaledVector(fwd,-R(400,700)).add(V3(R(-150,150),R(-100,100),R(-150,150)));}continue;}
    f.ret-=dt;if(f.ret<=0||!f.tgt){f.ret=R(3,5);f.ahead=!f.ahead;f.tgt=f.ahead?V3(R(-120,120),R(-60,60),-R(120,260)):V3(R(-60,60),R(-30,30),R(60,140));}
    const want=ds.position.clone().add(f.tgt.clone().applyQuaternion(ds.quaternion)).sub(f.g.position);const L=want.length();
    f.v.lerp(want.normalize().multiplyScalar(f.ahead?160:115),1-Math.exp(-dt*1.4));f.g.position.addScaledVector(f.v,dt);
    _dw.copy(f.g.position).add(f.v);f.g.lookAt(_dw);f.g.rotateY(Math.PI);
    f.cool-=dt;const toMe=ds.position.clone().sub(f.g.position),d=toMe.length();
    if(f.cool<=0&&d<300&&toMe.normalize().dot(f.v.clone().normalize())>.8){f.cool=R(1.2,2.4);
      fire(f.g.position.clone(),ds.position.clone().add(V3(R(-3,3),R(-2,2),R(-3,3))),360,'hbolt',q=>{boom(q,R(4,8),0x9fe8ff,.3);if(!FLY)return;FLY.shields=Math.max(FLY.broken?0:12,FLY.shields-R(2,4));FLY.shake=.3;if(typeof sfx!=='undefined')sfx.hit(true);});}}
  // your guns: two in the nose, along the crosshair
  D.cool-=dt;if(fireHeld&&P.input&&D.cool<=0){D.cool=.1;D.gunL=!D.gunL;const dir=camera.getWorldDirection(_dw).clone();
    let best=null,bt=900;for(const f of D.F){if(f.dead>0)continue;const oc=f.g.position.clone().sub(camera.position),t=oc.dot(dir);if(t<0||t>bt)continue;if(oc.lengthSq()-t*t<12*12){bt=t;best=f;}}
    const to=camera.position.clone().addScaledVector(dir,best?bt:700),from=ds.position.clone().add(V3(D.gunL?-2.6:2.6,.4,-12).applyQuaternion(ds.quaternion));
    fire(from,to,1000,'pfgun',q=>{if(!best||best.dead>0)return;boom(q,4,0xffd08a,.2);best.hp--;$('cross').classList.add('hit');clearTimeout(updateDogfight.t);updateDogfight.t=setTimeout(()=>$('cross').classList.remove('hit'),90);
      if(best.hp<=0){best.dead=R(3,5);best.g.visible=false;const p=best.g.position.clone();boom(p,24,0xfff0d0,.6);boom(p,36,0xff8a3a,1.2);boom(p,20,HOST_GLOW,.9);if(typeof sfx!=='undefined')sfx.explosion(p,600);
        D.kills++;P.kills++;PG.kill(250,p,'gun');if(D.kills>=8)PG.done('pdog');}});}
  // dust going past
  const a=D.sp;for(let i=0;i<a.length;i+=3){a[i+2]+=dt*85;if(a[i+2]>160){a[i]=R(-90,90);a[i+1]=R(-60,60);a[i+2]=-160;}}D.streaks.position.copy(ds.position);D.streaks.quaternion.copy(ds.quaternion);D.streaks.geometry.attributes.position.needsUpdate=true;
  // the shields: they hold until she breaks, then nothing holds
  if(D.broken>3)D.shields=Math.max(0,D.shields-dt*16);
  D.bar.querySelector('u').style.width=D.shields+'%';D.bar.classList.toggle('low',D.shields<30);
  PG.objective(D.broken?'Stay alive · fighters down: '+D.kills:'Get to the Pathfinder · fighters down: '+D.kills);
  if(D.broken>3&&D.shields<=0){const done=D.done;flashScreen(.5);boom(ds.position.clone(),30,0xfff0d0,.8);if(typeof sfx!=='undefined')sfx.crash(camera.position);
    D.bar.remove();D.tag.remove();scene.remove(D.streaks);document.body.classList.remove('dog');for(const f of D.F)scene.remove(f.g);for(const w of D.war)scene.remove(w);
    // her two halves stay up there, burning out, for the Keepers to find (Archive 02)
    if(D.halves)D.halves.forEach(h=>h.visible=false);scene.remove(D.pf);camera.fov=62;camera.updateProjectionMatrix();FLY=null;fireHeld=false;setPhase('endcut');done();}}
// the Pathfinder breaks in two: a flash down her spine, and her bow and stern pull apart
function breakPathfinder(D){D.broken=.001;const pf=D.pf,c=pf.position.clone();flashScreen(.6);D.shake=1.4;if(typeof sfx!=='undefined'){sfx.crash(c);sfx.shipDown&&sfx.shipDown();}
  for(let i=0;i<8;i++)boom(c.clone().add(V3(R(-40,40),R(-25,25),R(-80,80))),R(40,90),i%2?0xfff0c0:0xff8a3a,R(1,2));
  const m=pf.userData.model;let parts=[];
  if(m&&MODELS.halves){parts=MODELS.halves(m,.45);m.visible=false;parts.forEach(h=>pf.add(h));}
  else{const g=pf.children[0];g.visible=false;parts=[0,1].map(()=>{const h=new THREE.Mesh(pf.userData.ref,g.material);pf.add(h);return h;});parts[0].scale.set(1,1,.5);parts[1].scale.set(1,1,.5);}
  parts.forEach((h,i)=>{h.userData.v=V3(i?3:-3,i?-2:2.5,i?6:-4);h.userData.ax=V3(i?1:-1,R(-.3,.3),i?.4:-.4).normalize();h.userData.sp=i?.22:.16;});
  D.halves=parts;
  setTimeout(()=>PG.say('Sergeant Marsh','She’s breaking up! The Pathfinder’s breaking up!','alert'),900);
  setTimeout(()=>PG.say('Captain Rhen','Pathfinder, respond. Pathfinder!','alert'),4200);
  setTimeout(()=>PG.say('Ensign Landry','She’s gone, Captain. She’s gone. And our way home went with her.','alert'),8200);}
// INT. the wreck. Smoke, sparks, the emergency light. "Status."
function wreckScene(pf,fighters){
  fighters.forEach(g=>scene.remove(g));const A=AST.A0;
  const W=new THREE.Group();W.position.copy(pf.position);W.quaternion.copy(pf.quaternion);scene.add(W);pf.visible=false;   // inside, only the bay: the hull would close over the hole in the roof
  const bay=buildBay(true);W.add(bay.G);bay.G.position.set(0,0,0);bay.lamps.forEach(l=>{l.color.copy(C(0xff7a2a));l.intensity=.8;});
  // the cockpit door is jammed shut; Landry works the console beside it
  {const dp=new THREE.Mesh(vcol(boxUV(1.6,2.4,.12,2),C(0x3a414b)),metalMat);dp.position.set(.05,1.2,-7.15);dp.rotation.z=.05;bay.G.add(dp);}bay.fill.intensity=0;bay.holo.visible=false;bay.G.children.forEach(c=>{if(c.geometry&&c.geometry.type==='CylinderGeometry')c.visible=false;});W.updateMatrixWorld(true);
  const L=(x,y,z)=>bay.G.localToWorld(V3(x,y,z));
  // the cargo rack and the case on it, split open. The object inside is lit
  const rack=new THREE.Mesh(vcol(boxUV(1.4,1,1,2),C(0x22262e)),metalMat);rack.position.set(-2.4,.5,-4.6);bay.G.add(rack);
  const cs=new THREE.Group();cs.position.set(-2.4,1.15,-4.6);cs.rotation.z=.2;bay.G.add(cs);
  const half1=new THREE.Mesh(new THREE.BoxGeometry(.5,.3,.8),new THREE.MeshStandardMaterial({color:C(0x8a8e98),map:panelTex,metalness:.5,roughness:.4,emissive:C(0x6a7aff),emissiveIntensity:.08}));half1.position.y=-.05;cs.add(half1);
  const half2=half1.clone();half2.position.set(.08,.32,0);half2.rotation.z=-.5;cs.add(half2);
  const obj=new THREE.Mesh(ART.obj.geometry,ART.obj.material);obj.scale.setScalar(.34);obj.rotation.z=1.4;obj.position.y=.14;cs.add(obj);
  const oh=glowSprite(0xa8b8ff,2.4,1.8,.6);const ol=new THREE.PointLight(C(0xb8c4ff),1.2,6,1.6);ol.position.y=.4;cs.add(ol);oh.position.y=.2;cs.add(oh);
  // the crew where the crash left them
  const ld=landry();const H=[P.H,SQUAD[0].H,SQUAD[1].H,SQUAD[2].H,ld];
  const put=(h,x,z,ry,lie)=>{h.root.position.copy(L(x,0,z));h.root.rotation.set(0,0,0);h.root.rotation.y=-Math.PI/2+ry;h.root.rotateZ(.12);h.root.visible=true;reviveHuman(h);if(lie){killHuman(h);h.dead=5;}};
  put(P.H,.4,.6,Math.PI*.1,true);put(SQUAD[0].H,-2.6,2.4,-Math.PI/2,false);put(SQUAD[1].H,2.2,-2,Math.PI*.6,true);put(SQUAD[2].H,1.9,3.4,Math.PI*.4,true);put(ld,-2.2,-6.1,0,false);
  SQUAD[0].H.crouchTo=1;
  const sparks=[];const sparkAt=[L(2.9,3.3,0),L(-2.9,3.2,-3)];
  // the sky through the hole in the roof; ships coming down through it
  const falling=[];for(let i=0;i<3;i++){const g=new THREE.Group(),K=i===1?SHIPKIT.voidclass():SHIPKIT.wraith();g.add(new THREE.Mesh(K.geo,fleetHullMat(panelTex)),new THREE.Mesh(K.glowGeo||K.glow,fleetGlowMat(HOST_GLOW,2.4)));g.scale.setScalar(i===1?1.2:2.2);
    const t0=glowSprite(0xff8a3a,40,2.2,.9);t0.position.z=-20;g.add(t0);g.visible=false;scene.add(g);falling.push({g,from:L([60,-20,140][i],[300,340,380][i],[-60,40,-140][i]),to:L([160,90,240][i],30,[80,220,60][i]),t:-i*2.2});}
  let fallOn=false;
  const live=(t,dt)=>{bay.lamps.forEach((l,i)=>l.intensity=Math.random()<.08?0:.7+.3*Math.sin(t*3+i));
    if(rng()<.3){const p=pick(sparkAt);boom(p.clone().add(V3(R(-.2,.2),0,R(-.2,.2))),R(.3,.8),0xffd08a,.25);}
    if(rng()<.05)puff(L(R(-2,2),R(2.6,3.4),R(-5,5)),R(.6,1.2),3);
    oh.material.opacity=.35+.25*Math.sin(t*2.2);ART.objU.uT.value+=dt*.2;
    if(fallOn)for(const F of falling){F.t+=dt*.16;if(F.t<0)continue;F.g.visible=true;const u=Math.min(1,F.t);F.g.position.lerpVectors(F.from,F.to,u);F.g.lookAt(F.to);F.g.rotateY(Math.PI);if(rng()<.5)puff(F.g.position.clone(),R(8,14),4);}};
  SETS.active=true;
  playCut([
    {dur:4,black:true,cam:[[0,0,0]],look:[[0,0,-1]],fn:(t)=>{const c=L(1.6,1.2,2.6);camera.position.copy(c);camera.lookAt(L(0,.4,0));}},
    {dur:6,camAt:(u,t,o)=>o.copy(L(1.5,1.4+u*.2,2.8)),lookAt:(u,t,o)=>o.copy(P.H.root.position.clone().add(V3(0,.4+u*.6,0))),
      say:[[3.4,'Captain Rhen','Status.']],
      fn:(t,dt)=>{live(t,dt);const u=clamp((t-1.2)/3,0,1);if(u>0&&P.H.dead){reviveHuman(P.H);}poseHuman(P.H,dt,0,0,false);P.H.body.rotation.x=-1.5*(1-easeIO(u));P.H.crouchTo=u<1?1:0;
        for(const h of[SQUAD[1].H,SQUAD[2].H,ld])poseHuman(h,dt,0,0,false);poseHuman(SQUAD[0].H,dt,0,0,false);}},
    {dur:5,camAt:(u,t,o)=>o.copy(L(-1.2,1.3,3.6)),lookAt:(u,t,o)=>o.copy(L(-2.6,.8,2.2)),
      say:[[1.6,'Sergeant Marsh','Alive.']],
      fn:(t,dt)=>{live(t,dt);if(t>.3&&!SQUAD[1].groaned){SQUAD[1].groaned=true;if(typeof sfx!=='undefined')sfx.trooperDown(camera.position);}
        if(t>1&&SQUAD[1].H.dead){reviveHuman(SQUAD[1].H);SQUAD[1].H.crouchTo=1;}for(const h of crew())poseHuman(h,dt,0,0,false);poseHuman(ld,dt,0,0,false);}},
    {dur:5,camAt:(u,t,o)=>o.copy(L(.6,1.7,-3.6)),lookAt:(u,t,o)=>o.copy(L(-.6,1.4,-7)),
      say:[[1.2,'Ensign Landry','Ship’s dead.']],
      fn:(t,dt)=>{live(t,dt);for(const h of crew())poseHuman(h,dt,0,0,false);poseHuman(ld,dt,0,0,false);ld.head.rotation.x=.35;}},
    // the case: cracked; something inside it still glowing. Rhen goes to it
    {dur:6,camAt:(u,t,o)=>o.copy(L(-1.2,1.6,-2.6+u*.4)),lookAt:(u,t,o)=>o.copy(L(-2.4,1.1,-4.6)),
      fn:(t,dt)=>{live(t,dt);const u=clamp(t/4,0,1);P.H.crouchTo=0;reviveHuman(P.H);P.H.root.position.copy(L(.4-u*1.8,0,.6-u*3.6));P.H.root.rotation.set(0,0,0);P.H.root.rotation.y=-Math.PI/2+Math.atan2(2.4-.4,4.6+.6)+Math.PI;P.H.root.rotateZ(.12);
        poseHuman(P.H,dt,u<1?1.4:0,0,false);for(const h of[SQUAD[0].H,SQUAD[1].H,SQUAD[2].H,ld])poseHuman(h,dt,0,0,false);
        if(u>=1){P.H.arms[1].sh.rotation.x=-1.1*Math.min(1,(t-4)/1.5);}}},
    // a distant explosion. They look up. Through the hole: a Host ship coming down, then another
    {dur:8,camAt:(u,t,o)=>o.copy(L(-1.6,1.2,1.8)),lookAt:(u,t,o)=>o.copy(L(4+u*6,9+u*3,1+u*4)),
      say:[[5.6,'Sergeant Marsh','They followed us.']],
      fn:(t,dt)=>{live(t,dt);if(t<.1){fallOn=true;flashScreen(.2);if(typeof sfx!=='undefined')sfx.explosion(L(200,40,400),900);shakeT=.6;}
        for(const h of[P.H,SQUAD[0].H,SQUAD[1].H,ld]){poseHuman(h,dt,0,0,false);h.head.rotation.x=-.6;}poseHuman(SQUAD[2].H,dt,0,0,false);}},
    {dur:7,camAt:(u,t,o)=>o.copy(L(-1.1,1.75,-2.2)),lookAt:(u,t,o)=>o.copy(P.H.root.position.clone().add(V3(0,1.65,0))),
      say:[[2.4,'Captain Rhen','Then we’d better figure out what we stole.']],
      fn:(t,dt)=>{live(t,dt);for(const h of crew())poseHuman(h,dt,0,0,false);poseHuman(ld,dt,0,0,false);P.H.head.rotation.y=t<1.4?.5:t<2.6?-.3:0;}},
    {dur:5,black:true,small:'Astraea · 08.03.2237',cap:'Pathfinder',cam:[[0,0,0]],look:[[0,0,-1]],fn:()=>{camera.position.copy(L(-1.1,1.75,-2.2));camera.lookAt(P.H.root.position);}},
  ],()=>{SETS.active=true;setPhase('end');finishMission();},{hush:true});
}
function finishMission(){
  if(P.kills>=30)PG.done('pkills');if(!wentDown)PG.done('pdown');PG.done('pmarsh');PG.ach('pathfinder');
  PG.finish({title:'PATHFINDER · ARC 01',text:`Captain Rhen’s team took the object out of the Host’s vault and lost the ship doing it. The Pathfinder is in pieces in orbit. Her strike team is down on Astraea with nothing but what they carried, and the Host are coming down after them. Nobody knows what they stole. Troopers down: ${P.kills}. Threat level: ${DIFF.name}.`,
    buttons:[{text:'Menu',href:'index.html',primary:true},{text:'Play again',onClick:()=>location.reload()}]});}
requestAnimationFrame(frame);
