/* Elyra shared ship kit: geometry builders for the Keeper flagship, Empty Host warships and fighters, the city interceptor and freighters.
   Needs core.js. Builders consume rng when called, so call them in a fixed order per chapter. */
function makeGlowTex(){return (()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();}
function makePanelTex(){return (()=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  x.fillStyle='#a6afb8';x.fillRect(0,0,256,256);
  for(let i=0;i<60;i++){const v=140+(rng()*70|0);x.fillStyle=`rgb(${v},${v+6},${v+14})`;x.fillRect(rng()*256|0,rng()*256|0,8+rng()*70|0,6+rng()*40|0);}
  x.strokeStyle='rgba(40,48,58,.55)';x.lineWidth=1;for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32,256);x.stroke();x.beginPath();x.moveTo(0,i*32);x.lineTo(256,i*32);x.stroke();}
  for(let i=0;i<30;i++){x.fillStyle='rgba(30,38,46,.6)';x.fillRect(rng()*256,rng()*256,3+rng()*10,2+rng()*4);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;})();}
function capitalShip(variant){
  const m=new Merger(),gm=new Merger();
  const hull=C(0x737d88),mid=C(0x5b646e),dark=C(0x30373f),stripe=C(0xb8432f),warm=C(0xffdcaa),U=50;
  const L=1000,W=variant===1?250:190,H=95;
  // layered main hull
  m.add(boxUV(W,H,L*.78,U),M(0,0,40),hull);
  m.add(boxUV(W*.72,40,L*.66,U),M(0,-H/2-20,60),mid);
  m.add(boxUV(W*.4,26,L*.5,U),M(0,-H/2-52,80),dark);
  // bow wedge + spine
  const bow=new THREE.CylinderGeometry(6,W*.72,L*.36,4,1);bow.rotateY(Math.PI/4);bow.rotateX(-Math.PI/2);bow.attributes.uv.array.forEach((v,i,a)=>a[i]=v*6);
  m.add(bow,M(0,0,-L*.54),mid);
  m.add(boxUV(18,22,L*.5,U),M(0,H/2+8,-L*.25),dark);
  for(const s of[-1,1]){
    // faction stripe, hangar doors, sponsons, wings
    m.add(boxUV(4,10,L*.7,U),M(s*(W/2+2),14,40),stripe);
    for(let k=0;k<3;k++)m.add(boxUV(6,44,80,U),M(s*(W/2+3),-14,-140+k*140),dark);
    m.add(boxUV(70,58,L*.48,U),M(s*(W/2+38),-14,120),hull);
    m.add(boxUV(4,8,L*.46,U),M(s*(W/2+75),0,120),stripe);
    m.add(boxUV(170,12,140,U),M(s*(W/2+85),-8,-40,0,0,s*.08),mid);
    // dorsal gun turrets
    for(let k=0;k<4;k++){const z=-170+k*120,x=s*W*.34;
      m.add(new THREE.CylinderGeometry(14,17,10,10),M(x,H/2+5,z),mid);
      m.add(boxUV(18,10,20,U),M(x,H/2+14,z),dark);
      for(const b of[-1,1])m.add(cylZ(2.5,2.5,48,6),M(x+b*5,H/2+15,z-32),dark);}
    // windows
    for(let k=0;k<46;k++)gm.add(new THREE.BoxGeometry(2,3,7),M(s*(W/2+1.5),R(-32,30),R(-340,380)),warm);
  }
  // superstructure tiers + bridge
  m.add(boxUV(W*.62,42,L*.42,U),M(0,H/2+21,90),mid);
  m.add(boxUV(W*.42,36,L*.22,U),M(0,H/2+60,150),hull);
  m.add(boxUV(W*.3,30,L*.1,U),M(0,H/2+93,180),mid);
  m.add(boxUV(40,60,50,U),M(0,H/2+138,190),dark);
  gm.add(new THREE.BoxGeometry(W*.3+2,4,L*.1+2),M(0,H/2+98,180),warm);
  gm.add(new THREE.BoxGeometry(W*.42+2,3,L*.22+2),M(0,H/2+66,150),warm);
  for(const s of[-1,1])m.add(boxUV(6,120,6,U),M(s*12,H/2+220,195),dark);
  m.add(boxUV(80,4,4,U),M(0,H/2+250,195),dark);
  m.add(boxUV(10,90,170,U),M(0,H/2+45,-70,-.2,0,0),mid);
  // engine block + nacelles
  m.add(boxUV(W*1.2,140,140,U),M(0,-4,L*.47),dark);
  const eng=[];
  for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy+=2){const x=ix*W*.4,y=iy*36;
    m.add(cylZ(34,40,120,12),M(x,y,L*.5+40),mid);m.add(cylZ(30,28,10,12),M(x,y,L*.5+103),dark);
    gm.add(cylZ(24,24,4,12),M(x,y,L*.5+108),C(0x9ff0ff));eng.push(new THREE.Vector3(x,y,L*.5+118));}
  // belly ribs + greebles
  for(let z=-280;z<=380;z+=55)m.add(boxUV(W*.8,12,18,U),M(0,-H/2-36,z),dark);
  for(let i=0;i<150;i++){const top=rng()<.7;m.add(boxUV(R(5,28),R(4,18),R(8,60),U),M(R(-W*.45,W*.45),top?H/2+R(0,6):-H/2-R(0,10),R(-330,420)),pick([dark,mid,hull]));}
  if(variant===2)m.add(boxUV(W*.5,60,L*.5,U),M(0,-H/2-80,60),mid);
  if(variant===1)for(const s of[-1,1]){m.add(boxUV(44,44,L*.9,U),M(s*(W/2+130),22,0),mid);m.add(boxUV(4,8,L*.86,U),M(s*(W/2+153),22,0),stripe);}
  const lights=[],lc=[];
  for(let i=0;i<300;i++){lights.push(R(-W*.5,W*.5),-H/2-R(40,60),R(-380,440));const k=rng();const col=k<.65?C(0xd8f6ff):k<.88?C(0xffb070):C(0xff3a3a);lc.push(col.r*2,col.g*2,col.b*2);}
  return{geo:m.build(),glowGeo:gm.build(),eng,lights,lc,W};
}
function flagshipGeo(){
  const m=new Merger(),gm=new Merger(),pearl=C(0xe8ecf1),blue=C(0x284c78),steel=C(0x8d98a5),dark=C(0x262c34),cyan=C(0x7fe6ff),U=50;
  m.add(boxUV(130,84,880,U),M(0,0,40),pearl);
  m.add(boxUV(96,40,760,U),M(0,-60,60),steel);
  const bow=new THREE.CylinderGeometry(8,95,320,4,1);bow.rotateY(Math.PI/4);bow.rotateX(-Math.PI/2);bow.attributes.uv.array.forEach((v,i,a)=>a[i]=v*6);
  m.add(bow,M(0,0,-560),pearl);
  m.add(boxUV(30,26,520,U),M(0,52,-150),blue);
  for(const s of[-1,1]){
    m.add(boxUV(80,64,700,U),M(s*280,-6,80),blue);
    const ob=new THREE.CylinderGeometry(6,52,200,4,1);ob.rotateY(Math.PI/4);ob.rotateX(-Math.PI/2);ob.attributes.uv.array.forEach((v,i,a)=>a[i]=v*4);
    m.add(ob,M(s*280,-6,-370),steel);
    m.add(boxUV(84,10,690,U),M(s*280,30,80),pearl);
    for(const z of[-180,90,340])m.add(boxUV(200,16,70,U),M(s*160,0,z),pearl);
    m.add(new THREE.TorusGeometry(58,15,10,28),M(s*280,-6,450),steel);
    gm.add(new THREE.CircleGeometry(48,24),M(s*280,-6,452),cyan);
    gm.add(new THREE.BoxGeometry(3,5,640),M(s*66.5,10,40),cyan);
    gm.add(new THREE.BoxGeometry(3,4,640),M(s*321.5,-6,80),cyan);
    for(const z of[-200,150,380])m.add(boxUV(18,70,18,U),M(s*280,-70,z),dark);
    for(const z of[-120,60,240]){m.add(new THREE.CylinderGeometry(16,18,12,10),M(s*280,41,z),steel);m.add(cylZ(3,3,50,6),M(s*280,49,z-30),dark);}
  }
  m.add(new THREE.TorusGeometry(80,18,10,32),M(0,0,500),steel);
  gm.add(new THREE.CircleGeometry(66,28),M(0,0,502),cyan);
  m.add(boxUV(80,50,200,U),M(0,67,120),pearl);
  m.add(boxUV(56,46,120,U),M(0,115,150),blue);
  m.add(boxUV(34,70,60,U),M(0,170,170),pearl);
  gm.add(new THREE.BoxGeometry(58,4,122),M(0,120,150),C(0xbfe9ff));
  m.add(boxUV(8,120,8,U),M(0,260,180),dark);
  m.add(boxUV(14,110,170,U),M(0,105,330,.25,0,0),blue);
  m.add(boxUV(110,24,300,U),M(0,-92,0),dark);
  for(let i=0;i<90;i++)m.add(boxUV(R(6,24),R(4,14),R(10,50),U),M(R(-55,55),42+R(0,4),R(-380,420)),pick([steel,pearl,blue]));
  // armor: belt plates on the spine and outriggers, keel plating, a heavier prow and ram
  const armor=C(0x5a6573),armor2=C(0x434c58);
  for(const s of[-1,1]){
    for(let z=-360,k=0;z<=420;z+=96,k++)m.add(boxUV(10,72,90,U),M(s*70,-2,z),k%2?armor:armor2);
    for(let z=-260;z<=420;z+=86)m.add(boxUV(10,58,80,U),M(s*325,-6,z),armor);
    m.add(boxUV(92,12,640,U),M(s*280,-42,90),armor2);
    for(const z of[-120,300])gm.add(new THREE.SphereGeometry(14,10,8),M(s*331,24,z),C(0x9ff0ff));
  }
  const prow=new THREE.CylinderGeometry(10,108,260,4,1);prow.rotateY(Math.PI/4);prow.rotateX(-Math.PI/2);prow.attributes.uv.array.forEach((v,i,a)=>a[i]=v*6);
  m.add(prow,M(0,0,-500),armor);
  m.add(boxUV(16,16,170,U),M(0,-30,-700),armor2);
  // heavy twin turrets
  const tps=[];
  for(const [x,z] of[[0,-320],[0,-190],[-280,-210],[280,-210],[-280,330],[280,330]]){
    const y=x===0?66:36;
    m.add(new THREE.CylinderGeometry(28,32,14,14),M(x,y+7,z),steel);
    m.add(boxUV(52,20,56,U),M(x,y+22,z),armor);
    for(const b of[-1,1])m.add(cylZ(4.5,5.5,96,8),M(x+b*12,y+24,z-70),dark);
    tps.push(new THREE.Vector3(x,y+24,z-120));
  }
  return{geo:m.build(),glow:gm.build(),tps};
}
function fighterGeo(){
  const m=new Merger(),gm=new Merger(),black=C(0x0e0f12),dark=C(0x23252a),red=C(0xff2a2a),U=10;
  m.add(boxUV(3,2,14,U),M(0,0,0),black);
  const nose=new THREE.CylinderGeometry(.3,1.6,6,4,1);nose.rotateY(Math.PI/4);nose.rotateX(-Math.PI/2);m.add(nose,M(0,0,-10),black);
  for(const s of[-1,1]){
    m.add(boxUV(9,.4,5,U),M(s*5.5,-.3,2,0,s*.45,s*-.12),dark);
    m.add(boxUV(.6,3.4,3,U),M(s*9.5,1,4.2,0,0,s*.3),black);
    gm.add(new THREE.BoxGeometry(8,.2,.5),M(s*5.6,0,-.3,0,s*.45,s*-.12),red);
    gm.add(new THREE.BoxGeometry(.3,.4,10),M(s*1.55,.6,0),red);
  }
  gm.add(new THREE.CircleGeometry(1.1,10),M(0,0,7.1),red);
  return{geo:m.build(),glow:gm.build()};
}
// Raven-pattern interceptor: long white nose, swept wings with coloured panels, gold leading edges, twin fins and engines.
// `pal` comes from the paint the player picked in the hangar (see progress.js); no random numbers are used.
function interceptorGeo(pal){
  pal=Object.assign({},interceptorGeo.KEEPER,pal||{});
  const m=new Merger(),gm=new Merger(),H=C(pal.hull),P=C(pal.panel),T=C(pal.trim),D=C(pal.dark),G=C(pal.glow),U=10;
  m.add(boxUV(3.6,2.6,13,U),M(0,0,1.5),H);
  m.add(boxUV(2.8,1.8,6,U),M(0,-.3,-7.5),H);
  const nose=new THREE.CylinderGeometry(.15,1.45,9,4,1);nose.rotateY(Math.PI/4);nose.rotateX(-Math.PI/2);m.add(nose,M(0,-.3,-15),H);
  m.add(boxUV(.6,.12,10,U),M(0,1.32,-3),P);
  if(pal.glass)m.add(boxUV(2,.2,4.8,U),M(0,1.36,-4.5),D);   // just the sill: addPilot() puts a glass canopy and a pilot on it
  else m.add(boxUV(1.9,1.3,4.6,U),M(0,1.45,-4.5),D);
  m.add(boxUV(2.2,.25,.3,U),M(0,1.9,-2.1),T);
  for(const s of[-1,1]){
    m.add(boxUV(.3,.3,12,U),M(s*1.85,.5,.5),T);
    m.add(boxUV(11.5,.45,5.6,U),M(s*6.6,-.35,4,0,s*.55,0),H);
    m.add(boxUV(8,.5,3,U),M(s*6.4,-.3,4.4,0,s*.55,0),P);
    m.add(boxUV(10.5,.22,.4,U),M(s*6.1,-.08,1.6,0,s*.55,0),T);
    m.add(boxUV(4.2,.3,2.2,U),M(s*2.9,-.1,-6.3,0,s*.5,0),P);
    m.add(boxUV(.4,3.4,3.4,U),M(s*2.1,2.2,6.8,0,0,s*.28),P);
    m.add(boxUV(.45,.3,2.6,U),M(s*2.55,3.85,7.2,0,0,s*.28),T);
    m.add(cylZ(1.25,1.45,6,10),M(s*1.55,-.15,7.4),D);
    gm.add(new THREE.CircleGeometry(1.05,12),M(s*1.55,-.15,10.45),G);
    m.add(boxUV(.55,.55,4.2,U),M(s*4.6,-.55,-.6),D);
    gm.add(new THREE.BoxGeometry(7,.18,.3),M(s*6.7,-.02,5.6,0,s*.55,0),G);
    gm.add(new THREE.BoxGeometry(.5,.5,.5),M(s*11.2,-.3,7.6),s<0?C(0xff4a3a):C(0x4aff8a));
  }
  return{geo:m.build(),glow:gm.build()};
}
function freighter(){
  const m=new Merger(),gm=new Merger(),hull=C(0x2c3138),dark=C(0x14171b),mid=C(0x4a525c),cy=C(0x8ff0ff),red=C(0xff4a3a),U=20;
  m.add(boxUV(16,12,70,U),M(0,0,0),hull);
  const bow=new THREE.CylinderGeometry(2,10,24,4,1);bow.rotateY(Math.PI/4);bow.rotateX(-Math.PI/2);m.add(bow,M(0,1,-47),dark);
  m.add(boxUV(10,5,14,U),M(0,8,-26),dark);
  gm.add(new THREE.BoxGeometry(10.4,1.2,2),M(0,9.6,-32.5),cy);
  for(const s of[-1,1]){
    gm.add(new THREE.BoxGeometry(.4,.9,62),M(s*8.2,2,0),cy);
    for(let k=0;k<4;k++){m.add(boxUV(9,10,14,U),M(s*13,0,-21+k*15),k%2?mid:dark);gm.add(new THREE.BoxGeometry(.3,.5,12),M(s*17.6,4.2,-21+k*15),k%2?cy:red);}
    m.add(boxUV(2,12,10,U),M(s*27,5,25),mid);
    gm.add(new THREE.BoxGeometry(1.4,1.4,1.4),M(s*28,1,15),s<0?red:C(0x4aff8a));
  }
  m.add(boxUV(56,2,14,U),M(0,-1,22),mid);
  m.add(boxUV(24,15,14,U),M(0,0,40),hull);
  for(let k=-1;k<=1;k++){m.add(cylZ(4,4.6,8,10),M(k*7,0,50),dark);gm.add(new THREE.CircleGeometry(3.6,14),M(k*7,0,54.1),cy);}
  for(const s of[-1,1])for(const z of[-20,20])m.add(boxUV(2,8,2,U),M(s*6,-9,z),dark);
  return{geo:m.build(),glow:gm.build()};
}

/* ---------- the Empty Host (the Hollow King's followers): purple, black and silver, all spines and blades ---------- */
// assault dropship, about 70 m long, nose toward -z; no random numbers
function hostDropshipGeo(){
  const m=new Merger(),gm=new Merger(),blk=C(0x15121c),drk=C(0x2a2236),pur=C(0x4a2a6e),sil=C(0xb8bcc8),gl=C(0xb46aff),U=12;
  m.add(boxUV(10,7,44,U),M(0,0,2),blk);
  const prow=new THREE.CylinderGeometry(.4,6,26,4,1);prow.rotateY(Math.PI/4);prow.rotateX(-Math.PI/2);m.add(prow,M(0,.5,-32),blk);
  m.add(boxUV(6,4,18,U),M(0,5,-4),drk);
  m.add(boxUV(14,3,20,U),M(0,-4.5,6),drk);
  gm.add(new THREE.BoxGeometry(12,.4,16),M(0,-6.1,6),gl);
  for(const s of[-1,1]){
    m.add(boxUV(22,1.2,8,U),M(s*14,0,4,0,-s*.42,s*.12),pur);
    m.add(boxUV(20,.6,1,U),M(s*14,.6,0.4,0,-s*.42,s*.12),sil);
    const blade=new THREE.CylinderGeometry(.2,1.6,16,4,1);blade.rotateX(-Math.PI/2);m.add(blade,M(s*26,.8,-6,0,-s*.42,0),sil);
    m.add(boxUV(1.2,9,5,U),M(s*4,7,12,0,0,s*.45),pur);
    m.add(boxUV(1,6,3,U),M(s*3,8,-10,-.5,0,s*.3),blk);
    m.add(cylZ(2.2,2.8,8,8),M(s*6,-.5,24),drk);
    gm.add(new THREE.CircleGeometry(2,10),M(s*6,-.5,28.1),gl);
    gm.add(new THREE.BoxGeometry(.4,.5,30),M(s*5.2,1.6,0),gl);
  }
  return{geo:m.build(),glow:gm.build()};
}
// trooper: tall, thin, armoured, silver mask and crest; about 2.6 units high, feet at y=0
/* a pilot under a glass canopy, for an interceptor built with interceptorGeo({...,glass:true}). Ship units are about half a metre.
   Allied wingmen only (Michael's own ship keeps its closed canopy). The pilot is Bryce's Keeper soldier model (Oct 25; it was the civilian
   model until then), seated: the hull hides
   everything below the shoulders. Before the model arrives the code-built officer sits there instead. */
let _glassMat=null;
function addPilot(grp){
  if(!_glassMat)_glassMat=new THREE.MeshStandardMaterial({color:C(0xa8dcff),transparent:true,opacity:.3,roughness:.05,metalness:.9,depthWrite:false,emissive:C(0x0a2030)});
  const gl=new THREE.Mesh(new THREE.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2),_glassMat);gl.scale.set(.98,.95,2.45);gl.position.set(0,1.42,-4.5);gl.renderOrder=2;grp.add(gl);
  if(typeof makeHuman!=='function')return null;
  const H=makeHuman('officer');H.root.scale.setScalar(1.9);H.root.position.set(0,-.7,-4.2);grp.add(H.root);
  const seat=()=>{poseHuman(H,0,0,0);for(const l of H.legs){l.hp.rotation.x=1.45;l.kn.rotation.x=-1.45;}
    for(const a of H.arms){a.sh.rotation.x=.55;a.el.rotation.x=-.8;}H.head.rotation.x=-.05;};
  seat();if(typeof MODELS!=='undefined')MODELS.dress(H,'keeper-footsoldier',{unarmed:true,lod:'phone'}).then(seat);   // (Oct 25: Keeper pilots in Bryce's Keeper soldier model)
  return H;
}
function hostTrooperGeo(){
  // the new code-built Empty Host trooper (js/origin/02-people.js), baked in its aiming pose; the old blocky one if that file isn't loaded
  if(typeof bakeHuman==='function'){try{return bakeHuman('trooper',2.6,{aim:1});}catch(e){console.warn('trooper bake',e);}}
  const m=new Merger(),blk=C(0x1a1622),pur=C(0x553078),sil=C(0xc9ccd6),gl=C(0xc080ff),U=2;
  m.add(boxUV(.7,1,.45,U),M(0,1.55,0),blk);m.add(boxUV(.8,.3,.5,U),M(0,1.95,0),pur);
  m.add(boxUV(.5,.5,.5,U),M(0,2.35,0),blk);m.add(boxUV(.36,.3,.08,U),M(0,2.35,-.27),sil);
  const crest=new THREE.CylinderGeometry(.02,.12,.7,4);m.add(crest,M(0,2.85,.08,-.3,0,0),sil);
  for(const s of[-1,1]){m.add(boxUV(.22,1,.22,U),M(s*.48,1.45,0,0,0,s*.15),blk);m.add(boxUV(.26,1.05,.26,U),M(s*.2,.55,0),blk);
    m.add(boxUV(.3,.25,.5,U),M(s*.2,.06,-.05),pur);m.add(new THREE.CylinderGeometry(.02,.1,.5,4),M(s*.45,2.2,0,0,0,s*.6),sil);}
  m.add(boxUV(.12,.12,1.3,U),M(.55,1.2,-.5),sil);m.add(boxUV(.14,.14,.14,U),M(.55,1.2,-1.15),gl);
  return m.build();
}

interceptorGeo.KEEPER={hull:0xeef1f5,panel:0x2a5a96,trim:0xd9b25a,dark:0x1e242c,glow:0x8ff0ff};
