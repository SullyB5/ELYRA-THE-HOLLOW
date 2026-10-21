/* Elyra · Origin — people, built in code from the design sheet: Keeper Marine, Mechanic/Engineer, Colonist, Civilian,
   the Empty Host trooper and the Hollow King. Each is a little rig of boxes with hip, knee, shoulder and elbow joints,
   posed every frame (walk, run, aim, fall). Feet at y = 0, facing -z. */
const charMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.35});
const charGlowMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
const STYLES={
  marine:{h:1,armor:0xe2e6ec,under:0x2c3b58,trim:0xd9b25a,accent:0x2a5a96,visor:0xffc860,helmet:true,pads:true,pack:true},
  engineer:{h:1,armor:0x2e3e5c,under:0x1c2434,trim:0xe8b030,accent:0x4a5a78,visor:0xffb84a,helmet:true,pads:true,pack:true,toolbox:true},
  colonist:{h:.97,armor:0xc8a0bc,under:0x6a4a62,trim:0xd9b25a,accent:0x9a7a60,visor:0xffe0c0,helmet:true,pads:false,pack:true},
  // Tide City civilians in the Keepers' palette: cream coats, Keeper-blue undercloth, a gold edge, a sash. Three faces (civilian, civilian1, civilian2)
  civilian:{h:.95,armor:0xe4dccb,under:0x2c3b58,trim:0xd9b25a,accent:0x2a5a96,visor:null,helmet:false,pads:false,pack:false,skin:0xc89a7a,hair:0x3a2a20,coat:true,unarmed:true},
  civilian1:{h:.93,armor:0xd8d2c4,under:0x3a4a66,trim:0xd9b25a,accent:0x6a4a3a,visor:null,helmet:false,pads:false,pack:false,skin:0x8a5a3a,hair:0x141010,coat:true,unarmed:true},
  civilian2:{h:.97,armor:0xc9cfd6,under:0x24304a,trim:0xb89a50,accent:0x2a5a96,visor:null,helmet:false,pads:false,pack:true,skin:0xe0b898,hair:0x9a7a50,coat:true,hood:true,unarmed:true},
  // the ending at Tide City: Master Elias Veyr (silver hair, white and gold) and a Tide City Command officer; neither carries a rifle
  master:{h:1.03,armor:0xeae6dc,under:0x24304a,trim:0xd9b25a,accent:0x2a5a96,visor:null,helmet:false,pads:true,pack:false,skin:0xd2a688,hair:0xc4c6cc,unarmed:true},
  officer:{h:.96,armor:0x2a3550,under:0x18202e,trim:0xd9b25a,accent:0x7fe3ff,visor:null,helmet:false,pads:false,pack:false,skin:0x8a5a3a,hair:0x1a1410,unarmed:true},
  // the Empty Host trooper (design sheet: purple, black, silver). Faceless silver mask with two eye slits, a hollow glowing ring where
  // the chest should be, spined pauldrons, a torn tabard. Built richer than the others (host:true) since there's no model file for it yet.
  trooper:{h:1.16,armor:0x1a1524,under:0x0c0a12,trim:0xc9ccd6,accent:0x553078,visor:0xb46aff,helmet:true,pads:true,pack:false,mask:true,crest:true,host:true},
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
    if(style==='marine'||style==='engineer')gm.add(new THREE.BoxGeometry(.06,.06,.02),M(.14,.42,-.15),C(0x7fe3ff));
    if(S.host){const sv=tr,pu=ac,dk=C(0x08060c);
      // a keeled chest plate in two angled halves, a silver collar, ribs down the flanks
      for(const q of[-1,1]){B(m,.24,.34,.06,q*.11,.34,-.16,ar,0,q*.32,0);B(m,.05,.3,.22,q*.24,.3,0,sv);for(let r=0;r<3;r++)B(m,.03,.025,.26,q*.235,.14+r*.07,0,sv);}
      m.add(new THREE.TorusGeometry(.15,.035,6,12),M(0,.58,0,Math.PI/2,0,0),sv);
      // the hollow: a dark socket with a purple ring burning inside it
      m.add(new THREE.CylinderGeometry(.075,.075,.05,12),M(0,.33,-.18,Math.PI/2,0,0),dk);
      gm.add(new THREE.TorusGeometry(.07,.014,6,16),M(0,.33,-.205),C(S.visor));gm.add(new THREE.BoxGeometry(.012,.22,.01),M(0,.12,-.17),C(S.visor));
      // a torn tabard front and back, a spine of plates
      for(const z of[-.17,.16]){B(m,.2,.42,.02,0,-.18,z,pu);B(m,.08,.12,.02,.05,-.43,z,pu,0,0,.2);B(m,.07,.08,.02,-.06,-.41,z,pu,0,0,-.25);}
      for(let i=0;i<4;i++)B(m,.12-i*.015,.05,.06,0,.5-i*.12,.17,sv);}
    if(S.coat){B(m,.46,.06,.3,0,.18,0,ac);B(m,.06,.5,.31,.12,.3,0,tr,0,0,.5);   // a sash over the shoulder
      if(S.hood){const hd=new THREE.SphereGeometry(.17,10,8,0,Math.PI*2,0,Math.PI*.6);hd.scale(1,1,1.1);m.add(hd,M(0,.6,.12,-1.1,0,0),un);}}}));
  const head=new THREE.Group();head.position.y=.6;torso.add(head);
  head.add(partMesh(k+'head',(m,gm)=>{
    if(S.helmet){const h=new THREE.SphereGeometry(.15,10,8);h.scale(1,1.12,1.08);m.add(h,M(0,.12,0),S.mask?ar:ar);
      if(S.mask){B(m,.2,.22,.04,0,.1,-.15,tr);gm.add(new THREE.BoxGeometry(.06,.025,.02),M(.05,.13,-.175),C(S.visor));gm.add(new THREE.BoxGeometry(.06,.025,.02),M(-.05,.13,-.175),C(S.visor));}
      else{gm.add(new THREE.BoxGeometry(.2,.08,.04),M(0,.13,-.15),C(S.visor));B(m,.24,.03,.04,0,.18,-.14,tr);}
      if(S.crest)m.add(new THREE.CylinderGeometry(.01,.06,.5,4),M(0,.38,.06,-.35,0,0),tr);
      if(S.host){// a long faceless silver mask, a ridge, back spines, a gorget
        const mk=new THREE.SphereGeometry(.13,10,8,0,Math.PI*2,0,Math.PI*.62);mk.scale(1,1.35,.7);m.add(mk,M(0,.1,-.08,-1.45,0,0),tr);
        B(m,.025,.16,.2,0,.27,0,tr);for(let i=0;i<3;i++)m.add(new THREE.CylinderGeometry(0,.025,.22,4),M(0,.2-i*.07,.15,-1.1+i*.2,0,0),tr);
        m.add(new THREE.CylinderGeometry(.11,.14,.08,8),M(0,-.04,0),C(0x08060c));}}
    else{const h=new THREE.SphereGeometry(.12,10,8);h.scale(1,1.15,1.05);m.add(h,M(0,.12,0),C(S.skin));
      const hr=new THREE.SphereGeometry(.13,10,8,0,Math.PI*2,0,Math.PI*.55);m.add(hr,M(0,.14,.01),C(S.hair));B(m,.16,.2,.06,0,.06,.1,C(S.hair));
      for(const e of[-1,1])B(m,.035,.02,.02,e*.045,.13,-.115,C(0x1a1418));B(m,.06,.015,.02,0,.06,-.118,C(0x6a3a30));}}));   // eyes and mouth
  const arms=[],legs=[];
  for(const s of[-1,1]){
    const sh=new THREE.Group();sh.position.set(s*.29,.5,0);torso.add(sh);
    sh.add(partMesh(k+'upper'+s,(m,gm)=>{B(m,.12,.32,.12,0,-.16,0,un);if(S.pads)B(m,.18,.12,.18,0,-.02,0,ar);else B(m,.13,.18,.13,0,-.08,0,ar);
      if(S.host){// layered spined pauldron with a silver edge and a purple seam
        B(m,.22,.07,.22,s*.02,.05,0,ar,0,0,s*-.25);B(m,.2,.03,.2,s*.04,.0,0,tr,0,0,s*-.3);B(m,.17,.06,.17,s*.05,-.06,0,ar,0,0,s*-.35);
        for(let i=0;i<2;i++)m.add(new THREE.CylinderGeometry(0,.025,.2+i*.06,4),M(s*(.06+i*.05),.16+i*.02,.02-i*.05,-.2,0,s*-.45),tr);
        gm.add(new THREE.BoxGeometry(.02,.02,.16),M(s*.09,-.02,0,0,0,s*-.3),C(S.visor));}
      if(S.coat)B(m,.15,.3,.15,0,-.17,0,ar);}));
    const el=new THREE.Group();el.position.y=-.32;sh.add(el);
    el.add(partMesh(k+'fore'+s,m=>{B(m,.12,.28,.12,0,-.14,0,ar);B(m,.1,.1,.1,0,-.31,0,S.skin&&!S.helmet?C(S.skin):un);
      if(S.host){B(m,.14,.12,.14,0,-.2,0,tr);m.add(new THREE.CylinderGeometry(0,.02,.12,4),M(s*.07,-.12,.02,0,0,s*-1.2),tr);}
      if(S.coat)B(m,.13,.06,.13,0,-.24,0,tr);
      // (the rifle is its own object now: see gunRig below)
      if(s<0&&S.toolbox)B(m,.16,.22,.3,0,-.42,0,C(0xe8b030));}));
    arms.push({sh,el});
    const hp=new THREE.Group();hp.position.set(s*.11,-.04,0);hip.add(hp);
    hp.add(partMesh(k+'thigh',m=>{B(m,.16,.46,.18,0,-.23,0,un);B(m,.17,.24,.19,0,-.14,-.01,ar);
      if(S.host)B(m,.18,.06,.2,0,-.02,-.02,tr);
      if(S.coat){B(m,.2,.5,.05,0,-.22,-.1,ar);B(m,.2,.5,.05,0,-.22,.1,ar);B(m,.05,.5,.2,s*.1,-.22,0,ar);B(m,.21,.03,.06,0,-.46,-.1,tr);}}));
    const kn=new THREE.Group();kn.position.y=-.46;hp.add(kn);
    kn.add(partMesh(k+'shin',m=>{B(m,.15,.44,.17,0,-.22,0,S.coat?un:ar);B(m,.16,.1,.28,0,-.48,-.04,S.coat?C(0x3a2c22):un);B(m,.16,.06,.06,0,-.02,-.08,S.pads?ar:tr);
      if(S.host){m.add(new THREE.CylinderGeometry(0,.03,.16,4),M(0,.0,-.12,-1.3,0,0),tr);B(m,.04,.3,.03,0,-.22,-.09,tr);}}));
    legs.push({hp,kn});
  }
  const H={root,body,hip,torso,head,arms,legs,style,ph:Math.random()*6,dead:0};
  if(!S.unarmed&&!style.startsWith('civilian'))gunRig(H,codeRifle(style==='trooper'),style==='trooper'?{rest:'host'}:{});
  return H;
}
/* ---------- holding a rifle: the gun sits in the shoulder (it hangs off the torso, pitched with the aim), and both hands reach it ---------- */
// A two-bone solve per arm: the elbow bend sets the shoulder-to-hand distance, the shoulder turns the arm onto the grip,
// then the arm twists so the elbow hangs down and out. Works for the code rig and for the rigged models (any rest pose).
const _ikA=new THREE.Vector3(),_ikB=new THREE.Vector3(),_ikC=new THREE.Vector3(),_ikD=new THREE.Vector3(),_ikQ=new THREE.Quaternion(),_ikQ2=new THREE.Quaternion(),_ikE=new THREE.Euler();
const _rifleGeo={};
function codeRifle(host){const k=host?'h':'k';if(!_rifleGeo[k]){const m=new Merger(),gm=new Merger(),dk=C(host?0x16121e:0x2a2e36),mt=C(host?0x8e909c:0x3a4048),tr=C(host?0xc9ccd6:0xd9b25a);
    B(m,.07,.11,.5,0,0,0,dk);B(m,.045,.045,.34,0,.01,-.4,mt);B(m,.05,.13,.06,0,-.1,.1,dk,-.25,0,0);B(m,.05,.08,.18,0,-.02,.33,dk);B(m,.04,.1,.05,0,-.09,-.14,dk);
    B(m,.075,.025,.4,0,.065,-.02,tr);gm.add(new THREE.BoxGeometry(.03,.02,.12),M(0,.03,-.2),C(host?0xb46aff:0x7fe3ff));
    _rifleGeo[k]={g:m.build(),gl:gm.build()};}
  const o=new THREE.Group(),a=new THREE.Mesh(_rifleGeo[k].g,charMat);a.castShadow=true;o.add(a,new THREE.Mesh(_rifleGeo[k].gl,charGlowMat));
  // grips in the rifle's own frame (muzzle toward -z): trigger hand, fore hand, muzzle tip, and the butt that sits in the shoulder
  o.userData.grip={R:new THREE.Vector3(0,-.11,.1),L:new THREE.Vector3(0,-.07,-.17),muzzle:new THREE.Vector3(0,.01,-.58),butt:.42};return o;}
// gun: an Object3D whose userData.grip gives R, L, muzzle (rifle frame) and butt (distance from centre to the stock's end)
function gunRig(H,gun,opts){opts=opts||{};
  if(H.gun){H.gun.parent.remove(H.gun);}
  const piv=new THREE.Group();piv.userData.keep=true;gun.userData.keep=true;gun.traverse(o=>{o.userData.keep=true;});
  piv.add(gun);gun.position.set(0,0,-gun.userData.grip.butt);H.torso.add(piv);
  H.gun=piv;H.gunObj=gun;H.gunRest=opts.rest||'';
  // hand points in each forearm's frame: the code fist, or the model's palm
  H.handPt=opts.handPt||[new THREE.Vector3(0,-.31,0),new THREE.Vector3(0,-.31,0)];
  H.muzzleObj=gun;H.muzzleL=null;
}
function _armIK(H,i,t,side){// t: target in the torso's frame
  const sh=H.arms[i].sh,el=H.arms[i].el,u=el.position,f=H.handPt[i];
  const w=_ikA.copy(t).sub(sh.position),d=w.length();if(d<1e-4)return;
  // the elbow: search its hinge (x) for the bend that puts the hand at distance d from the shoulder
  let best=0,bd=1e9;for(let k=0;k<=24;k++){const p=-2.75+k*(2.85/24);const e=_ikB.copy(f).applyAxisAngle(_ikD.set(1,0,0),p).add(u);const dd=Math.abs(e.length()-d);if(dd<bd){bd=dd;best=p;}}
  for(let step=.06;step>.004;step*=.5)for(const p of[best-step,best+step]){if(p<-2.8||p>.1)continue;const e=_ikB.copy(f).applyAxisAngle(_ikD.set(1,0,0),p).add(u);const dd=Math.abs(e.length()-d);if(dd<bd){bd=dd;best=p;}}
  el.rotation.set(best,0,0);
  const v=_ikB.copy(f).applyAxisAngle(_ikD.set(1,0,0),best).add(u).normalize(),wn=_ikC.copy(w).normalize();
  _ikQ.setFromUnitVectors(v,wn);
  // twist about the shoulder-to-hand line so the elbow hangs down and out
  const e=_ikD.copy(u).applyQuaternion(_ikQ),pole=_ikB.set(side*.3,-1,.05);
  e.addScaledVector(wn,-e.dot(wn));pole.addScaledVector(wn,-pole.dot(wn));
  if(e.lengthSq()>1e-8&&pole.lengthSq()>1e-8){e.normalize();pole.normalize();const ang=Math.atan2(_ikA.crossVectors(e,pole).dot(wn),e.dot(pole));_ikQ2.setFromAxisAngle(wn,ang);_ikQ.premultiply(_ikQ2);}
  sh.quaternion.copy(_ikQ);
}
const _gT=new THREE.Vector3();
function poseGun(H,aim,run){
  const G=H.gun,g=H.gunObj.userData.grip,sR=H.arms[1].sh.position,pt=(H.aimPitch||0);
  // aimed: the butt in the right shoulder pocket, barrel along the aim. Lowered (running, idle): across the chest, muzzle down and left
  const lo=1-aim;G.position.set(sR.x*.62+lo*-.06,sR.y-.06-lo*.2,sR.z-.08-lo*.1);
  G.rotation.set(pt*aim-lo*(run?.55:.75),lo*(run?.7:.5),lo*.35);
  if(H.reload>0){const k=Math.sin(Math.min(1,H.reload)*Math.PI);G.rotation.x-=k*.35;G.rotation.z+=k*.4;}
  G.updateMatrix();H.gunObj.updateMatrix();
  const toT=v=>_gT.copy(v).applyMatrix4(H.gunObj.matrix).applyMatrix4(G.matrix);
  _armIK(H,1,toT(g.R).clone(),1);
  // the off hand: on the fore grip, or down to the belt for a fresh cell during a reload
  const L=toT(g.L);if(H.reload>0){const k=Math.sin(Math.min(1,H.reload)*Math.PI);L.lerp(_ikC.set(-.12,-.05,-.12),k);}
  _armIK(H,0,L,-1);
}
// pose: speed in m/s, aim 0..1 (rifle up), run. Extra state on H, all optional:
//   H.crouch 0..1 (eased toward H.crouchTo), H.reload 0..1 (a reload in progress), H.hitT (seconds since a hit: a flinch), H.aimPitch.
// (A positive x rotation swings a hanging limb forward, toward -z; a knee bends with a negative one.)
function poseHuman(H,dt,speed,aim,run){
  if(H.dead>0){H.dead+=dt;const u=Math.min(1,H.dead/.6);H.body.rotation.x=-u*u*1.5;H.body.position.y=-u*.15;return;}
  H.crouch=(H.crouch||0)+((H.crouchTo||0)-(H.crouch||0))*(1-Math.exp(-dt*10));const cr=H.crouch;
  const sp=Math.min(speed,7);H.ph+=dt*(3+sp*1.6)*(1-cr*.35);const a=Math.min(1,sp/3)*(run?.9:.6)*(1-cr*.5)*(H.glb?.72:1),s=Math.sin(H.ph),c=Math.cos(H.ph);
  const base=H.hipY||1,leg=H.hipY?H.hipY*.96:.92;
  // crouch: thighs forward, shins back by twice as much, so the feet stay under the hips and the hips drop
  H.legs[0].hp.rotation.x=s*a+cr*1.05;H.legs[1].hp.rotation.x=-s*a+cr*1.05;
  H.legs[0].kn.rotation.x=-Math.max(0,-c)*a*1.3-cr*2.1;H.legs[1].kn.rotation.x=-Math.max(0,c)*a*1.3-cr*2.1;
  H.hip.position.y=base-Math.abs(c)*a*.05*(base)-(1-Math.cos(cr*1.05))*leg;
  // a hit: the body jerks back and twists for a moment
  H.hitT=(H.hitT==null?9:H.hitT+dt);const fl=H.hitT<.35?Math.sin(H.hitT/.35*Math.PI)*(1-H.hitT/.35):0;
  H.torso.rotation.set(-a*.12*(run?1.6:1)-cr*.28+fl*.35,0,fl*.25*(H.hitSide||1));
  const [L,Rt]=H.arms,pt=(H.aimPitch||0)*aim;
  // the models hang their arms out in an A shape; bring them in toward the body (more when the rifle is up)
  const relax=H.R?Math.atan2(H.R.el[0]-H.R.sh[0],H.R.sh[1]-H.R.el[1]):0,rz=relax*(.55+.45*aim);
  // rifle up: the rifle is fixed across the right forearm, so the upper arm swings forward and the forearm hangs straight down
  // (shoulder + elbow = 0) to hold it level at the chest; the aim pitch tilts it up or down. The left hand reaches across to the barrel.
  Rt.sh.rotation.set(1.35*aim+pt*.6+(-s*a*.5)*(1-aim),0,-rz);Rt.el.rotation.set(-1.35*aim+pt*.4-.15*(1-aim),0,0);
  L.sh.rotation.set(.7*aim+pt*.6+(s*a*.5)*(1-aim),0,.5*aim+rz);L.el.rotation.set(.45*aim+pt*.4-.15*(1-aim),0,0);
  // reload: the left hand drops to the belt for a fresh cell and slaps it home, the rifle tips toward you
  if(H.reload>0){const r=H.reload,k=Math.sin(Math.min(1,r)*Math.PI);L.sh.rotation.x-=k*1.1;L.sh.rotation.z+=k*.2;L.el.rotation.x+=k*.9;Rt.sh.rotation.x-=k*.35;Rt.el.rotation.z=k*.35;}
  H.head.rotation.set(pt*.6-fl*.3,0,0);
  if(H.gun)poseGun(H,aim,run);
}
// bake a posed person into one static geometry (vertex colours; glow parts included), feet at y = 0, about h units tall.
// For crowds drawn as one InstancedMesh (Tide City's Empty Host troopers).
function bakeHuman(style,h,pose){const H=makeHuman(style);H.aimPitch=pose&&pose.pitch||0;for(let i=0;i<30;i++)poseHuman(H,.05,pose&&pose.speed||0,pose&&pose.aim!=null?pose.aim:1,false);
  H.root.updateMatrixWorld(true);const m=new Merger();
  H.root.traverse(o=>{if(!o.isMesh||!o.visible)return;const g=o.geometry,P=g.attributes.position,Cc=g.attributes.color;if(!P||!Cc)return;
    const ng=g.index?g.toNonIndexed():g.clone();ng.applyMatrix4(o.matrixWorld);const col=ng.attributes.color.array;
    const pp=ng.attributes.position.array,nn=ng.attributes.normal.array,uu=ng.attributes.uv?ng.attributes.uv.array:null;
    for(let i=0;i<pp.length;i++){m.p.push(pp[i]);m.n.push(nn[i]);m.c.push(col[i]*(o.material===charGlowMat?2.2:1));}
    for(let i=0;i<pp.length/3*2;i++)m.u.push(uu?uu[i]:0);});
  const g=m.build();g.computeBoundingBox();const k=h/(g.boundingBox.max.y-g.boundingBox.min.y);g.translate(0,-g.boundingBox.min.y,0);g.scale(k,k,k);return g;}
function killHuman(H){if(!H.dead)H.dead=.001;}
function reviveHuman(H){H.dead=0;H.body.rotation.x=0;H.body.position.y=0;H.crouch=H.crouchTo=0;H.reload=0;}
function hitHuman(H,side){H.hitT=0;H.hitSide=side||(Math.random()<.5?-1:1);}

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
