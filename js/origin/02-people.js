/* Elyra · Origin — people, built in code from the design sheet: Keeper Marine, Mechanic/Engineer, Colonist, Civilian,
   the Empty Host trooper and the Hollow King. Each is a little rig of boxes with hip, knee, shoulder and elbow joints,
   posed every frame (walk, run, aim, fall). Feet at y = 0, facing -z. */
const charMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.35});
const charGlowMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
const STYLES={
  marine:{h:1,armor:0xe2e6ec,under:0x2c3b58,trim:0xd9b25a,accent:0x2a5a96,visor:0xffc860,helmet:true,pads:true,pack:true},
  engineer:{h:1,armor:0x2e3e5c,under:0x1c2434,trim:0xe8b030,accent:0x4a5a78,visor:0xffb84a,helmet:true,pads:true,pack:true,toolbox:true},
  colonist:{h:.97,armor:0xc8a0bc,under:0x6a4a62,trim:0xd9b25a,accent:0x9a7a60,visor:0xffe0c0,helmet:true,pads:false,pack:true},
  civilian:{h:.95,armor:0x6e6c62,under:0x4a4a54,trim:0x8a7a5a,accent:0x5a5048,visor:null,helmet:false,pads:false,pack:false,skin:0xc89a7a,hair:0x3a2a20},
  // the ending at Tide City: Master Elias Veyr (silver hair, white and gold) and a Tide City Command officer; neither carries a rifle
  master:{h:1.03,armor:0xeae6dc,under:0x24304a,trim:0xd9b25a,accent:0x2a5a96,visor:null,helmet:false,pads:true,pack:false,skin:0xd2a688,hair:0xc4c6cc,unarmed:true},
  officer:{h:.96,armor:0x2a3550,under:0x18202e,trim:0xd9b25a,accent:0x7fe3ff,visor:null,helmet:false,pads:false,pack:false,skin:0x8a5a3a,hair:0x1a1410,unarmed:true},
  trooper:{h:1.16,armor:0x16121e,under:0x0c0a12,trim:0xc9ccd6,accent:0x553078,visor:0xb46aff,helmet:true,pads:true,pack:false,mask:true,crest:true},
};
const _geoCache={};
function partGeo(key,fn){if(!_geoCache[key]){const m=new Merger(),gm=new Merger();fn(m,gm);_geoCache[key]={g:m.build(),gl:gm.p.length?gm.build():null};}return _geoCache[key];}
function partMesh(key,fn){const P=partGeo(key,fn),o=new THREE.Group(),a=new THREE.Mesh(P.g,charMat);a.castShadow=true;o.add(a);if(P.gl)o.add(new THREE.Mesh(P.gl,charGlowMat));return o;}
const B=(m,w,h,d,x,y,z,col,rx,ry,rz)=>m.add(boxUV(w,h,d,1),M(x,y,z,rx||0,ry||0,rz||0),col);

function makeHuman(style){
  const S=STYLES[style],ar=C(S.armor),un=C(S.under),tr=C(S.trim),ac=C(S.accent),k=style;
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.setScalar(S.h);
  const hip=new THREE.Group();hip.position.y=1;body.add(hip);
  hip.add(partMesh(k+'pelvis',m=>{B(m,.36,.2,.24,0,0,0,un);B(m,.38,.08,.26,0,.08,0,tr);if(S.armor)B(m,.3,.14,.06,0,-.02,-.13,ar);}));
  const torso=new THREE.Group();torso.position.y=.1;hip.add(torso);
  torso.add(partMesh(k+'torso',(m,gm)=>{B(m,.44,.5,.28,0,.3,0,ar);B(m,.3,.2,.3,0,.08,0,un);B(m,.46,.06,.3,0,.5,0,tr);
    if(S.accent)B(m,.12,.3,.02,0,.32,-.15,ac);
    if(S.pack)B(m,.32,.4,.16,0,.32,.22,un);
    if(S.mask){B(m,.08,.5,.04,0,.3,-.15,tr);gm.add(new THREE.BoxGeometry(.04,.3,.02),M(.12,.3,-.15),C(S.visor));gm.add(new THREE.BoxGeometry(.04,.3,.02),M(-.12,.3,-.15),C(S.visor));}
    if(style==='marine'||style==='engineer')gm.add(new THREE.BoxGeometry(.06,.06,.02),M(.14,.42,-.15),C(0x7fe3ff));}));
  const head=new THREE.Group();head.position.y=.6;torso.add(head);
  head.add(partMesh(k+'head',(m,gm)=>{
    if(S.helmet){const h=new THREE.SphereGeometry(.15,10,8);h.scale(1,1.12,1.08);m.add(h,M(0,.12,0),S.mask?ar:ar);
      if(S.mask){B(m,.2,.22,.04,0,.1,-.15,tr);gm.add(new THREE.BoxGeometry(.06,.025,.02),M(.05,.13,-.175),C(S.visor));gm.add(new THREE.BoxGeometry(.06,.025,.02),M(-.05,.13,-.175),C(S.visor));}
      else{gm.add(new THREE.BoxGeometry(.2,.08,.04),M(0,.13,-.15),C(S.visor));B(m,.24,.03,.04,0,.18,-.14,tr);}
      if(S.crest)m.add(new THREE.CylinderGeometry(.01,.06,.5,4),M(0,.38,.06,-.35,0,0),tr);}
    else{const h=new THREE.SphereGeometry(.12,10,8);h.scale(1,1.15,1.05);m.add(h,M(0,.12,0),C(S.skin));
      const hr=new THREE.SphereGeometry(.13,10,8,0,Math.PI*2,0,Math.PI*.55);m.add(hr,M(0,.14,.01),C(S.hair));B(m,.16,.2,.06,0,.06,.1,C(S.hair));
      for(const e of[-1,1])B(m,.035,.02,.02,e*.045,.13,-.115,C(0x1a1418));B(m,.06,.015,.02,0,.06,-.118,C(0x6a3a30));}}));   // eyes and mouth
  const arms=[],legs=[];
  for(const s of[-1,1]){
    const sh=new THREE.Group();sh.position.set(s*.29,.5,0);torso.add(sh);
    sh.add(partMesh(k+'upper'+s,m=>{B(m,.12,.32,.12,0,-.16,0,un);if(S.pads)B(m,.18,.12,.18,0,-.02,0,ar);else B(m,.13,.18,.13,0,-.08,0,ar);}));
    const el=new THREE.Group();el.position.y=-.32;sh.add(el);
    el.add(partMesh(k+'fore'+s,m=>{B(m,.12,.28,.12,0,-.14,0,ar);B(m,.1,.1,.1,0,-.31,0,S.skin&&!S.helmet?C(S.skin):un);
      if(s>0&&style!=='civilian'&&!S.unarmed){B(m,.07,.12,.7,0,-.32,-.22,C(0x2a2e36));B(m,.05,.05,.3,0,-.28,-.7,C(style==='trooper'?0x8e909c:0x3a4048));B(m,.06,.03,.5,0,-.25,-.25,tr);}
      if(s<0&&S.toolbox)B(m,.16,.22,.3,0,-.42,0,C(0xe8b030));}));
    arms.push({sh,el});
    const hp=new THREE.Group();hp.position.set(s*.11,-.04,0);hip.add(hp);
    hp.add(partMesh(k+'thigh',m=>{B(m,.16,.46,.18,0,-.23,0,un);B(m,.17,.24,.19,0,-.14,-.01,ar);}));
    const kn=new THREE.Group();kn.position.y=-.46;hp.add(kn);
    kn.add(partMesh(k+'shin',m=>{B(m,.15,.44,.17,0,-.22,0,ar);B(m,.16,.1,.28,0,-.48,-.04,un);B(m,.16,.06,.06,0,-.02,-.08,S.pads?ar:tr);}));
    legs.push({hp,kn});
  }
  return{root,body,hip,torso,head,arms,legs,style,ph:Math.random()*6,dead:0};
}
// pose: speed in m/s, aim 0..1 (rifle up), sideways lean; t is the clock
function poseHuman(H,dt,speed,aim,run){
  if(H.dead>0){H.dead+=dt;const u=Math.min(1,H.dead/.6);H.body.rotation.x=-u*u*1.5;H.body.position.y=-u*.15;return;}
  const sp=Math.min(speed,7);H.ph+=dt*(3+sp*1.6);const a=Math.min(1,sp/3)*(run?.9:.6),s=Math.sin(H.ph),c=Math.cos(H.ph);
  H.legs[0].hp.rotation.x=s*a;H.legs[1].hp.rotation.x=-s*a;
  H.legs[0].kn.rotation.x=Math.max(0,-c)*a*1.3;H.legs[1].kn.rotation.x=Math.max(0,c)*a*1.3;
  H.hip.position.y=1-Math.abs(c)*a*.05;H.torso.rotation.x=-a*.12*(run?1.6:1);
  const [L,Rt]=H.arms,pt=(H.aimPitch||0)*aim;
  // rifle up: the rifle is fixed across the right forearm, so the upper arm swings forward and the forearm hangs straight down
  // (shoulder + elbow = 0) to hold it level at the chest; the aim pitch tilts it up or down. The left hand reaches across to the barrel.
  // (A positive x rotation swings a hanging arm forward, toward -z.)
  Rt.sh.rotation.set(1.35*aim+pt*.6+(-s*a*.5)*(1-aim),0,0);Rt.el.rotation.set(-1.35*aim+pt*.4-.15*(1-aim),0,0);
  L.sh.rotation.set(.7*aim+pt*.6+(s*a*.5)*(1-aim),0,.5*aim);L.el.rotation.set(.45*aim+pt*.4-.15*(1-aim),0,0);
  H.head.rotation.x=pt*.6;
}
function killHuman(H){if(!H.dead)H.dead=.001;}
function reviveHuman(H){H.dead=0;H.body.rotation.x=0;H.body.position.y=0;}

/* ---------- the Hollow King: 3.4 m, robed in black plate, a crown of spines, a silver mask with purple eyes, a long blade ---------- */
function makeHollowKing(){
  const root=new THREE.Group(),blk=C(0x0e0b14),drk=C(0x221a2c),pur=C(0x4a2a6e),sv=C(0xc9ccd6),gl=C(0xc080ff);
  const robe=partMesh('hkRobe',(m,gm)=>{const r=new THREE.CylinderGeometry(.5,1.25,2.2,8);m.add(r,M(0,1.1,0),blk);
    B(m,1.1,.9,.6,0,2.55,0,drk);B(m,.5,.7,.05,0,2.55,-.31,pur);
    for(const s of[-1,1]){B(m,.5,.18,.7,s*.62,2.95,0,sv,0,0,s*-.25);for(let i=0;i<3;i++)m.add(new THREE.CylinderGeometry(0,.07,.8,4),M(s*(.6+i*.14),3.25+i*.06,.05*i,0,0,s*-.5),sv);}
    for(let i=0;i<5;i++)gm.add(new THREE.BoxGeometry(.04,.5,.02),M(-.4+i*.2,.6+((i%2)*.3),-.5+Math.abs(i-2)*.05),gl);
    const cape=new THREE.PlaneGeometry(1.6,3.1,1,1);m.add(cape,M(0,1.65,.42,.12,Math.PI,0),C(0x1a0e26));});
  root.add(robe);
  const head=new THREE.Group();head.position.y=3.1;root.add(head);
  head.add(partMesh('hkHead',(m,gm)=>{const h=new THREE.SphereGeometry(.24,10,8);h.scale(.9,1.2,1);m.add(h,M(0,.12,0),blk);
    B(m,.3,.34,.05,0,.1,-.22,sv);gm.add(new THREE.BoxGeometry(.08,.03,.02),M(.07,.15,-.25),gl);gm.add(new THREE.BoxGeometry(.08,.03,.02),M(-.07,.15,-.25),gl);
    for(let i=0;i<9;i++){const a=(i/8-.5)*2.2,l=.4+(4-Math.abs(i-4))*.12;m.add(new THREE.CylinderGeometry(0,.04,l,4),M(Math.sin(a)*.2,.36+l*.4,Math.cos(a)*.05,-.2,0,-a*.55),i%2?sv:pur);}}));
  const arm=new THREE.Group();arm.position.set(.62,2.85,0);root.add(arm);
  arm.add(partMesh('hkArm',(m,gm)=>{B(m,.2,1,.2,0,-.5,0,drk);B(m,.16,.16,.16,0,-1.05,0,sv);
    B(m,.06,2.6,.06,0,-1.1,-.05,sv);gm.add(new THREE.OctahedronGeometry(.16,0),M(0,.25,-.05),gl);m.add(new THREE.CylinderGeometry(0,.1,.8,4),M(0,-2.7,-.05,Math.PI,0,0),sv);}));
  const arm2=new THREE.Group();arm2.position.set(-.62,2.85,0);root.add(arm2);
  arm2.add(partMesh('hkArm2',m=>{B(m,.2,1.1,.2,0,-.55,0,drk);for(let i=0;i<4;i++)m.add(new THREE.CylinderGeometry(0,.025,.3,4),M(-.04+i*.03,-1.2,-.04,.3,0,0),sv);}));
  const aura=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(HOLLOW_GLOW).multiplyScalar(1.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7}));
  aura.scale.setScalar(7);aura.position.y=2;root.add(aura);
  return{root,head,arm,arm2,aura,t:0};
}
function poseKing(K,dt,gesture){K.t+=dt;K.head.rotation.y=Math.sin(K.t*.4)*.15;K.aura.material.opacity=.55+Math.sin(K.t*2.2)*.15;
  K.arm2.rotation.x=-gesture*2.1+Math.sin(K.t*.8)*.05;K.arm2.rotation.z=-gesture*.3;K.arm.rotation.x=-.15+Math.sin(K.t*.6)*.05;}
