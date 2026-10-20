/* Elyra · Archive 01 · The Mountain — the story, phase by phase:
   the command deck at Tide City (the Pathfinder's last message; Michael's orders) → the Keepers land at the Hollow
   → advance up the split canyon (turrets; a voice on Michael's channel in the tunnels) → the Hollow King at his gate
   → fall back to the ships → hold the landing zone while every ship powers up (three dropships at once, then two more)
   → board your interceptor → escape → the command deck, two days later: the rest of the message. On to Astraea.
   The stolen treasure is called "the Codex" here (a placeholder name, easy to change in this file). */

/* ---------- cutscenes: the shared system in js/shared/cutscene.js (camera keyframes, letterbox, subtitles paced by the voices, skip) ---------- */
const easeIO=CUTS.ease;
function playCut(shots,done){P.input=false;fireHeld=false;P.adsHeld=false;CUTS.play(shots,{done:sk=>{P.input=true;if(done)done(sk);}});}

/* ---------- objective marker: a gold diamond over where you need to go ---------- */
const wp=document.createElement('div');wp.className='hud keep';wp.style.cssText='width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid #ffd27a;transform:rotate(45deg);background:rgba(255,210,122,.15);display:none';
const wpLab=document.createElement('div');wpLab.className='hud';wpLab.style.cssText='font:600 10px var(--mono);color:#ffd27a;letter-spacing:.08em;transform:translate(-50%,12px);display:none';
document.body.append(wp,wpLab);let WP=null;
function updateWp(){if(!WP||CUTS.on||!P.alive){wp.style.display=wpLab.style.display='none';return;}_v.copy(WP).project(camera);const on=_v.z<1;
  const x=clamp((_v.x*.5+.5)*innerWidth,30,innerWidth-30),y=clamp((-_v.y*.5+.5)*innerHeight,60,innerHeight-60);
  wp.style.display=wpLab.style.display=on?'':'none';wp.style.left=wpLab.style.left=x+'px';wp.style.top=wpLab.style.top=y+'px';wpLab.textContent=Math.round(P.pos.distanceTo(WP))+' m';}

/* ---------- cast ---------- */
const SQUAD=[addAlly('marine',-3,30,'Sergeant Daro'),addAlly('marine',3,30,'Keeper'),addAlly('marine',-5,34,'KR-7','robot'),addAlly('marine',5,34,'Keeper'),addAlly('marine',0,36,'KR-9','robot')];
const ENGS=[addAlly('engineer',-24,48,'Engineer'),addAlly('engineer',0,62,'Engineer'),addAlly('engineer',24,48,'Engineer')];
const CIVS=[addAlly('colonist',-12,64,'Colonist'),addAlly('colonist',10,66,'Colonist'),addAlly('civilian',-30,70,'Civilian'),addAlly('civilian',34,68,'Civilian')];
for(const A of[...ENGS,...CIVS])A.on=false;
const KING=makeHollowKing();KING.root.position.copy(BALCONY);KING.root.visible=false;scene.add(KING.root);let kingGesture=0;
// ships: in the air for the opening, on the pad after it
const SHIP_AIR=SHIPS.map((S,i)=>new THREE.Vector3(S.x+R(-30,30),70+i*8,S.z+340+i*40));
function shipsLanded(){for(const S of SHIPS)if(!S.mine)S.g.position.set(S.x,0,S.z);}

/* ---------- phases ---------- */
let phase='brief',phT=0,gateOpen=0,spawnT=0,stalled=false,wentDown=false;
const said=new Set();function say(key,who,txt,tone,dur){if(said.has(key))return;said.add(key);PG.say(who,txt,tone,dur);}
function setPhase(p){phase=p;phT=0;}
function phaseFight(){return phase==='advance'||phase==='fallback'||phase==='defend';}
PG.init('origin',{challenges:[
  {id:'okills',text:'Down 25 Empty Host troopers',pts:2000,goal:25},
  {id:'oturret',text:'Destroy 3 Hollow turrets',pts:1500,goal:3},
  {id:'odrops',text:'Shoot down an Empty Host dropship',pts:1500},
  {id:'onade',text:'Down a trooper with a grenade',pts:500},
  {id:'ostall',text:'Never let a ship stall in the defence',pts:2500},
  {id:'odown',text:'Never go down',pts:2000},
]});

/* ---------- night and dusk: the command deck at Tide City is at night, the Hollow at dusk ---------- */
const DUSK={fog:scene.fog.color.clone(),dens:scene.fog.density,hor:sky.material.uniforms.hor.value.clone(),mid:sky.material.uniforms.mid.value.clone(),zen:sky.material.uniforms.zen.value.clone(),sunI:sun.intensity,sunC:sun.color.clone(),hemi:hemi.intensity};
function setNight(on){
  if(on){scene.fog.color.set(C(0x0e1428));scene.fog.density=.0009;sky.material.uniforms.hor.value.set(C(0x2a3a6a));sky.material.uniforms.mid.value.set(C(0x121a38));sky.material.uniforms.zen.value.set(C(0x04060e));
    sun.intensity=.35;sun.color.set(C(0x9fb8ff));hemi.intensity=.35;sky.material.uniforms.night.value=1;}
  else{scene.fog.color.copy(DUSK.fog);scene.fog.density=DUSK.dens;sky.material.uniforms.hor.value.copy(DUSK.hor);sky.material.uniforms.mid.value.copy(DUSK.mid);sky.material.uniforms.zen.value.copy(DUSK.zen);
    sun.intensity=DUSK.sunI;sun.color.copy(DUSK.sunC);hemi.intensity=DUSK.hemi;sky.material.uniforms.night.value=0;}
  scene.background=scene.fog.color;hollowLamp.visible=lzLamp.visible=dust.visible=harbinger.visible=beam.visible=beamCore.visible=pulse.visible=!on;}

/* ---------- the command deck at Tide City, night over the bay. Built off the edge of the desert map the first time it is needed ---------- */
const DECK=new THREE.Vector3(2400,0,0);
let deck=null;
function buildDeck(){
  const G=new THREE.Group();scene.add(G);const X=DECK.x;
  const metal=new THREE.MeshStandardMaterial({map:panelTex,color:C(0x8a96a8),roughness:.55,metalness:.5}),dark=new THREE.MeshStandardMaterial({color:C(0x1a2030),roughness:.6,metalness:.4});
  const gold=new THREE.MeshStandardMaterial({color:C(0xd9b25a),roughness:.3,metalness:.85}),cyan=new THREE.MeshBasicMaterial({color:C(0x7fe3ff).multiplyScalar(2),toneMapped:false});
  const box=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(X+x,y,z);m.castShadow=m.receiveShadow=true;G.add(m);return m;};
  // the room: floor, ceiling, back and side walls, and a tall window wall facing the bay
  box(28,.4,22,0,-.2,0,metal);box(28,.4,22,0,8.2,0,dark);box(.6,8.4,22,-14,4,0,dark);for(const z of[-11,11])box(28,8.4,.6,0,4,z,dark);
  box(.6,1,22,14,.5,0,metal);box(.6,1.2,22,14,7.6,0,metal);for(const z of[-7,-2.4,2.4,7])box(.4,8,.4,14,4,z,metal);
  for(const z of[-10.6,10.6])box(26,.08,.08,0,7.9,z,cyan);box(.08,.08,20,-13.6,7.9,0,cyan);
  // consoles along the side walls, with screens, and a Remnant emblem on the back wall
  for(const z of[-9.4,9.4])for(const x of[-9,-4.5,0,4.5,9]){box(3,1.1,1.2,x,.55,z,dark);const s=box(2.6,1.2,.06,x,1.75,z-Math.sign(z)*.4,new THREE.MeshBasicMaterial({color:C(rng()<.5?0x7fe3ff:0xffd27a).multiplyScalar(.6),toneMapped:false}));s.rotation.x=Math.sign(z)*.25;}
  const emb=new THREE.Mesh(new THREE.TorusGeometry(1.6,.12,6,6),gold);emb.position.set(X-13.6,5,0);emb.rotation.y=Math.PI/2;G.add(emb);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(22,6.4),new THREE.MeshBasicMaterial({color:C(0x7fb6ff),transparent:true,opacity:.07,depthWrite:false}));glass.rotation.y=-Math.PI/2;glass.position.set(X+14,4,0);G.add(glass);
  // the holo table and the projection turning over it
  const tbl=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.6,1.1,24),metal);tbl.position.set(X,.55,0);tbl.castShadow=true;G.add(tbl);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(2.15,.06,6,48),cyan);rim.rotation.x=Math.PI/2;rim.position.set(X,1.12,0);G.add(rim);
  const holo=new THREE.Group();holo.position.set(X,2.6,0);G.add(holo);
  const pl=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:C(0x7fd8ff),wireframe:true,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));holo.add(pl);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.96,24,16),new THREE.MeshBasicMaterial({color:C(0x0a1830),transparent:true,opacity:.7}));holo.add(core);
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.6,.012,4,64),cyan);orbit.rotation.x=Math.PI/2.3;holo.add(orbit);
  const blip=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x8cf0b0).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));blip.scale.setScalar(.35);holo.add(blip);
  // a waveform hangs over the table while the message plays
  const wave=new THREE.Group();wave.position.set(X,2.6,0);wave.visible=false;G.add(wave);const bars=[];
  for(let i=0;i<28;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.06,1,.06),new THREE.MeshBasicMaterial({color:C(0xff8a6a).multiplyScalar(2),toneMapped:false}));b.position.z=-1.35+i*.1;wave.add(b);bars.push(b);}
  const beamM=new THREE.Mesh(new THREE.CylinderGeometry(1.3,2,1.4,24,1,true),new THREE.MeshBasicMaterial({color:C(0x7fe3ff),transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beamM.position.set(X,1.8,0);G.add(beamM);
  const lamp=new THREE.PointLight(C(0x7fe3ff),2.2,16,1.6);lamp.position.set(X,3,0);G.add(lamp);
  const warm=new THREE.PointLight(C(0xffd2a0),1.1,30,1.4);warm.position.set(X-6,7,0);G.add(warm);
  // the city across the bay: towers with lit windows, the sea, and the Spear of Destiny standing over the core
  const wc=document.createElement('canvas');wc.width=64;wc.height=128;const cx=wc.getContext('2d');cx.fillStyle='#0b1220';cx.fillRect(0,0,64,128);
  for(let y=4;y<128;y+=8)for(let x=4;x<64;x+=8)if(rng()<.55){cx.fillStyle=rng()<.75?'#ffd890':'#9fe4ff';cx.fillRect(x,y,4,4);}
  const wt=new THREE.CanvasTexture(wc);wt.wrapS=wt.wrapT=THREE.RepeatWrapping;wt.encoding=THREE.sRGBEncoding;
  const city=new THREE.MeshStandardMaterial({color:C(0x1a2436),emissive:C(0xffffff),emissiveMap:wt,emissiveIntensity:.9,roughness:.6,metalness:.4,map:wt});
  for(let i=0;i<70;i++){const a=R(-1.1,1.1),r=R(260,900),w=R(18,46),h=R(30,220)*(r<500?1.3:1);const g=new THREE.BoxGeometry(w,h,w);
    const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*w/24,uv.getY(k)*h/48);
    const m=new THREE.Mesh(g,city);m.position.set(X+60+Math.cos(a)*r,h/2-4,Math.sin(a)*r*.9);G.add(m);
    if(rng()<.3){const t=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff6a5a).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));t.scale.setScalar(6);t.position.set(m.position.x,h-4,m.position.z);G.add(t);}}
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.MeshStandardMaterial({color:C(0x0a1a30),roughness:.25,metalness:.7}));sea.rotation.x=-Math.PI/2;sea.position.set(X+1800,-6,0);G.add(sea);
  const sp=new THREE.Group();sp.position.set(X+560,-6,-60);G.add(sp);
  {const s1=new THREE.Mesh(new THREE.CylinderGeometry(4,12,300,6),new THREE.MeshStandardMaterial({color:C(0xe9e4d6),roughness:.35,metalness:.55}));s1.position.y=150;sp.add(s1);
   const s2=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),gold);s2.scale.set(8,40,8);s2.position.y=330;sp.add(s2);
   const tip=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd890).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));tip.scale.setScalar(70);tip.position.y=335;sp.add(tip);}
  // the cast: Master Elias Veyr and a Tide City Command officer
  const elias=makeHuman('master'),officer=makeHuman('officer');G.add(elias.root,officer.root);
  const face=(H,x,z,tx,tz)=>{H.root.position.set(X+x,0,z);H.root.rotation.y=Math.atan2(-(tx-x),-(tz-z));};
  face(elias,3.3,-1.2,0,0);face(officer,-3,-1.8,0,0);
  return{G,holo,pl,blip,orbit,beam:beamM,elias,officer,lamp,wave,bars};
}
// stand everyone at the table and run the room's little animations; returns the per-frame function for a shot
function deckScene(){
  if(!deck)deck=buildDeck();deck.G.visible=true;setNight(true);
  for(const A of ALLIES)A.on=false;P.H.root.visible=true;reviveHuman(P.H);P.H.crouchTo=P.H.crouch=0;P.pos.set(DECK.x-.4,0,2.9);P.H.root.rotation.y=Math.atan2(.4,2.9);
  const D=deck;let ang=0;D.lost=false;D.red=0;D.talk=0;
  return(t,dt)=>{ang+=dt*.3;D.pl.rotation.y=ang;D.orbit.rotation.z=ang*.5;
    const a=ang*2.2;D.blip.position.set(Math.cos(a)*1.6,Math.sin(a)*.6,Math.sin(a)*1.6);D.blip.material.opacity=D.lost?0:.6+.4*Math.sin(t*9);
    D.wave.visible=D.talk>0;if(D.talk>0)D.bars.forEach((b,i)=>{b.scale.y=.1+Math.abs(Math.sin(t*14+i*.9))*(.4+.6*Math.random())*D.talk;});
    D.pl.material.color.copy(C(0x7fd8ff)).lerp(C(0xff5a2a),D.red);D.lamp.color.copy(C(0x7fe3ff)).lerp(C(0xff7a4a),D.red);
    poseHuman(D.elias,dt,0,0);poseHuman(D.officer,dt,0,0);poseHuman(P.H,dt,0,0);D.lamp.intensity=2+Math.sin(t*3)*.3;};
}
function leaveDeck(){if(deck)deck.G.visible=false;setNight(false);}

/* ---------- opening: the command deck, then the landing at the Hollow ---------- */
function deckIntro(){
  const live=deckScene(),X=DECK.x,D=deck;
  playCut([
    {dur:3.6,black:true,small:'Archive 01',cap:'The First Warning',cam:[[X-11,4.2,4]],look:[[X+400,60,-60]],fn:live},
    {dur:6,cam:[[X-11,4.2,4],[X-8,3.6,2.6]],look:[[X+400,60,-60],[X+400,48,-40]],
      say:[[.6,'Tide City Command','Master Veyr. We cleaned up the Pathfinder’s last transmission. Eleven seconds. Most of it is static.']],fn:live},
    {dur:6,cam:[[X-3,3.3,3.6],[X-2,3,2.7]],look:[[X,2.6,0]],
      say:[[.6,'Captain Rhen · recording','Tide City, this is the Pathfinder. We were wrong about the Heralds. We were wrong about all of it. They are not—','alert']],
      fn:(t,dt)=>{D.talk=1;D.red=Math.min(1,t/3)*.6;D.lost=true;live(t,dt);if(t>5.6&&!D.cut){D.cut=true;if(typeof sfx!=='undefined'&&sfx.static)sfx.static(1.2);}}},
    {dur:6,cam:[[X+1,2.1,-.4],[X+1.4,2,-.7]],look:[[X+3.3,1.75,-1.2]],
      say:[[.3,'Elias Veyr','Three nights since the Hollow King walked out of the archive with the Codex. Three days of silence from the Pathfinder.'],
           [0,'Tide City Command','The Vigil found him, Master. The old mountains in the south. And something under that mountain is transmitting on the Pathfinder’s frequency.','alert']],
      fn:(t,dt)=>{D.talk=0;D.red=Math.max(0,.6-t/3);live(t,dt);}},
    {dur:7,cam:[[X-1.6,3.2,1.6],[X-2.6,2.6,4.6]],look:[[X,2.4,0],[X-.4,1.6,2.9]],
      say:[[.3,'Elias Veyr','Michael. Take the squad in. Recover the Codex, and hold the landing zone until the others are clear.'],
           [0,'Elias Veyr','And no one follows you below. No one.'],
           [0,'Lt. Michael','Understood, Master. In, out, and nobody comes after me.']],fn:live},
  ],sk=>{leaveDeck();landing();});
}
function landing(){
  setNight(false);P.input=false;
  SHIPS.forEach((S,i)=>{if(!S.mine)S.g.position.copy(SHIP_AIR[i]);});for(const A of SQUAD)A.on=false;
  // the dropships fly in on one clock that runs across the first three shots, so the landing never jumps between cuts
  let ic=0;const LAND0=2,LAND1=24;
  const fly=dt=>{ic+=dt;SHIPS.forEach((S,i)=>{if(S.mine)return;const u=easeIO((ic-LAND0-i*.8)/(LAND1-LAND0));S.g.position.lerpVectors(SHIP_AIR[i],_v.set(S.x,0,S.z),u);
    S.g.rotation.x=(1-u)*.12;if(u>.75&&u<1&&rng()<.35)puff(_v.set(S.x+R(-8,8),.5,S.z+R(-8,8)),R(3,6),2.5);});};
  const lead=SHIPS[1].g.position;
  playCut([
    {dur:9,cam:[[150,90,340],[70,55,190]],look:[[0,60,-420],[0,40,-380]],small:'Elyra · the Hollow',cap:'The Mountain',
      say:[[1,'Elias Veyr','There. The Hollow. He did not even try to hide it.']],
      fn:(t,dt)=>fly(dt)},
    {dur:8,camAt:(u,t,o)=>o.set(lead.x-28+u*6,lead.y+7,lead.z+26-u*4),lookAt:(u,t,o)=>o.set(lead.x,lead.y+2,lead.z-10),
      say:[[.4,'Keeper Sergeant','He wants us here, Master. Every Keeper aboard knows it’s a trap.','alert'],
           [0,'Elias Veyr','Then we spring it on our terms. Without the Codex, every colony we have flies blind.']],fn:(t,dt)=>fly(dt)},
    {dur:7,cam:[[-40,6,20],[-30,4,34]],look:[[0,8,70],[0,3,60]],
      say:[[.5,'Fleet Engineer','Wheels down! I’m keeping the engines hot. If this turns, we lift in seconds, not minutes.'],
           [0,'Elias Veyr','Keep them hot. Michael, the valley splits into two canyons around a ridge. They meet again at his gate. There are passes through the ridge if you need to cross.']],
      fn:(t,dt)=>{fly(dt);if(ic>LAND1+3)shipsLanded();}},
    {dur:6,cam:[[3,2.6,42],[1.5,3,36]],look:[[0,4,-40],[0,16,-300]],small:'Archive 01',cap:'Go in. Find it. Get out.',
      say:[[1.6,'Lt. Michael','Squad, on me! Weapons hot. We reach that gate before he closes it.','alert']],
      fn:t=>{if(t<.1){shipsLanded();P.pos.set(0,0,22);P.yaw=0;P.H.root.rotation.y=0;for(const A of SQUAD){A.on=true;A.yaw=0;}}}},
  ],()=>{shipsLanded();for(const A of SQUAD)A.on=true;P.pos.set(0,0,22);P.yaw=0;P.pitch=-.05;setPhase('advance');startAdvance();banner('Advance to the Hollow’s gate');});
}

/* ---------- the canyon: turrets, supplies, and the voices in the tunnels ---------- */
// a spot on a canyon wall a few metres up: on the outer wall, or (inner) on the ridge's face
function ledgeSpot(s,side,inner){const c=roadPt(s).clone(),n=roadN(s),k=laneC(s),L=laneHalf(s);
  for(let d=1;d<13;d+=1){const l=inner?k-L-d:k+L+d,x=c.x+n.x*l*side,z=c.z+n.z*l*side,q=playD(x,z);if(q>2.5&&q<9)return new THREE.Vector3(x,groundY(x,z),z);}return null;}
function faceDown(x,z,s){const t=lanePoint(Math.max(0,s-28),latOf(x,z)<0?-1:1,LANE,_u);return Math.atan2(-(t.x-x),-(t.z-z));}
let advanceSet=false;
function startAdvance(){if(advanceSet)return;advanceSet=true;
  for(const [s,side] of[[118,-1],[178,1]]){const p=ledgeSpot(s,side);if(p)addTurret(p.x,p.z,p.y,faceDown(p.x,p.z,s),'Ledge gun');}
  {const p=ledgeSpot(212,-1,true);if(p)addTurret(p.x,p.z,p.y,faceDown(p.x,p.z,212),'Ridge gun');}
  for(const sx of[-1,1]){const x=sx*19,z=GATE.z+30;addTurret(x,z,groundY(x,z),Math.atan2(-(0-x)*.2,-(COURT.z+60-z)),'Gate gun');}
  // supplies: medical packs in every tunnel, ammunition and rockets along both lanes, more at the courtyard
  for(const g of GAPS){const c=roadPt(g.s);addPick('med',c.x,c.z);}
  for(const [s,side,type] of[[58,1,'ammo'],[128,-1,'rocket'],[196,1,'ammo'],[198,1,'med'],[262,-1,'rocket'],[300,1,'med'],[300,-1,'ammo']]){const p=lanePoint(s,side,13,_u);addPick(type,p.x,p.z);}
}
// passing through a tunnel, a voice comes over Michael's helmet channel. It sounds like Captain Rhen of the Pathfinder.
const WHISPERS=[
  [['Captain Rhen?','Michael... Michael, it’s Rhen. We’re under the mountain. Come down to us.','enemy'],[3.5,'Elias Veyr','Michael, that voice is on your helmet channel, not ours. Do not answer it.','alert']],
  [['Captain Rhen?','Take off your helmet, Michael. The air is good down here. Let me see your face.','enemy'],[3.5,'Lt. Michael','Master... it sounds just like Captain Rhen.']],
  [['Captain Rhen?','Why did you stop, Michael? We are so close now. Follow the light below.','enemy'],[3.5,'Elias Veyr','Whatever you hear calling your name, it isn’t him. Rhen is gone. Keep moving.','alert']],
];
let whispN=0;const whispDone=new Set();
function voices(s){if(whispN>=WHISPERS.length)return;
  for(const g of GAPS){if(whispDone.has(g.s)||Math.abs(s-g.s)>7)continue;whispDone.add(g.s);
    const [w,reply]=WHISPERS[whispN++];glitch(1.6);if(typeof sfx!=='undefined'&&sfx.whisper)sfx.whisper();PG.say(w[0],w[1],w[2],6);
    setTimeout(()=>PG.say(reply[1],reply[2],reply[3]),reply[0]*1000+2500);break;}}
function glitch(sec){document.body.classList.add('glitch');clearTimeout(glitch.t);glitch.t=setTimeout(()=>document.body.classList.remove('glitch'),sec*1000);}

function kingScene(){
  KING.root.visible=true;
  playCut([
    {dur:6,cam:[[0,3,COURT.z+30],[0,4,COURT.z+18]],look:[[0,GATE_H,GATE.z],[0,GATE_H+12,GATE.z]],
      say:[[.8,'The Hollow King','Keepers. You followed the signal to my door, as your Pathfinder did.','enemy']],
      fn:t=>{if(t<.1){boom(BALCONY.clone().add(_v.set(0,2,0)),10,HOLLOW_GLOW,1.4);flashScreen(.25);}}},
    {dur:7,cam:[[5,BALCONY.y+3,BALCONY.z+16],[3,BALCONY.y+3.4,BALCONY.z+12]],look:[[0,BALCONY.y+2.8,BALCONY.z]],
      say:[[.4,'The Hollow King','Your Codex lies below, with everything your archive chose to forget. Go down, Lieutenant. He has been calling you.','enemy'],
           [0,'Elias Veyr','Michael, hold your ground. Nobody goes below!','alert']],fn:t=>{kingGesture=easeIO((t-1)/2);}},
    {dur:6,cam:[[0,9,COURT.z+5],[0,14,COURT.z+42]],look:[[0,GATE_H*.6,GATE.z],[0,12,GATE.z]],
      say:[[.2,'The Hollow King','Then stay, and be emptied.','enemy'],[0,'Keeper Sergeant','It’s a trap! Fall back to the ships! Move!','alert']],
      fn:t=>{kingGesture=1;if(t>1.2&&!gateOpen){openGate();}}},
  ],()=>{openGate();kingGesture=.3;P.pos.set(0,0,COURT.z+30);P.yaw=Math.PI;setPhase('fallback');banner('It’s a trap · fall back to the ships','alert');});
}
function openGate(){if(gateOpen)return;gateOpen=.001;flashScreen(.3);if(typeof sfx!=='undefined')sfx.horn(_v.set(0,10,GATE.z));
  for(let k=0;k<7+(OD.n||0)*2;k++)spawnTrooper(R(-6,6),GATE.z+R(4,12));}

function escapeScene(){
  for(const E of ENEMIES)if(!E.H.dead&&Math.hypot(E.pos.x-LZ.x,E.pos.z-LZ.z)<70)E.speed*=.5;
  const fighters=[];for(let i=0;i<5;i++){const K=SHIPKIT.wraith(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat()),new THREE.Mesh(K.glow,fleetGlowMat(HOLLOW_GLOW,2)));g.scale.setScalar(.45);g.visible=false;scene.add(g);fighters.push(g);}
  let lt=0;const lift=dt=>{lt+=dt;SHIPS.forEach((S,i)=>{const k=Math.max(0,lt-i*.6);S.g.position.y=k*k*1.6;S.g.position.z=S.z+k*k*.6;if(k<6&&rng()<.4)puff(_v.set(S.x+R(-6,6),.5,S.z+R(-6,6)),R(3,7),2.5);});};
  const shoot=()=>{if(rng()<.15){const S=pick(SHIPS),to=S.g.position.clone().add(_v.set(R(-20,20),R(-8,8),R(-20,20)));fire(_w.set(R(-30,30),GATE_H,GATE.z+10),to,180,'hrifle',q=>boom(q,8,0xd8a0ff,.6));}};
  let killed=false;
  playCut([
    {dur:6,cam:[[50,8,10],[46,12,18]],look:[[10,6,50],[10,16,55]],say:[[.4,'Keeper Sergeant','Everyone’s aboard! Lantern, Bastion, Mercy, lift, lift, lift! Go now!','alert']],
      fn:(t,dt)=>{lift(dt);shoot();}},
    {dur:7,cam:[[60,70,60],[80,120,160]],look:[[0,60,40],[0,90,120]],
      say:[[.5,'The Hollow King','Run, then. Ask the Heralds where they are running, Keepers. You will not like the answer.','enemy']],
      fn:(t,dt)=>{lift(dt);shoot();fighters.forEach((g,i)=>{if(killed&&i===2)return;g.visible=true;g.position.set(-40+i*20+Math.sin(t+i)*6,40+t*8+i*3,-60+t*30);g.lookAt(g.position.x,g.position.y+3,g.position.z+30);
        if(rng()<.05)fire(g.position.clone(),pick(SHIPS).g.position.clone(),160,'hrifle',q=>boom(q,6,0xd8a0ff,.5));});
        if(t>4&&!killed){killed=true;boom(fighters[2].position,10,0xfff0c0,.6);boom(fighters[2].position,16,0xff6a1a,1.2);fighters[2].visible=false;}}},
    {dur:5,cam:[[0,160,260],[0,200,380]],look:[[0,150,0],[-200,160,-400]],small:'The Keepers withdraw',cap:'Bound for Tide City',
      fn:(t,dt)=>{lift(dt);fighters.forEach(g=>g.visible=false);}},
  ],()=>{fighters.forEach(g=>scene.remove(g));ending();});
}

/* ---------- the ending: two days later, the command deck. The rest of the message ---------- */
function ending(){
  setPhase('end');P.input=false;WP=null;$('ships').hidden=true;
  for(const E of ENEMIES){scene.remove(E.H.root);}ENEMIES.length=0;for(const Tt of TURRETS)Tt.g.visible=false;
  if(P.wall)breakWall();P.sentry=null;sentryG.visible=false;zealAura.visible=false;
  const live=deckScene(),X=DECK.x,D=deck;
  playCut([
    {dur:3.6,black:true,small:'Two days later',cap:'Tide City',cam:[[X-11,4.2,4]],look:[[X+400,60,-60]],fn:live},
    {dur:7,cam:[[X-11,4.2,4],[X-8,3.6,2.6]],look:[[X+400,60,-60],[X+400,48,-40]],
      say:[[.6,'Tide City Command','Master, we pulled the rest of the Pathfinder’s message out of the static. A few more words.']],fn:live},
    {dur:6,cam:[[X-3,3.3,3.6],[X-2,3,2.7]],look:[[X,2.6,0]],
      say:[[.4,'Captain Rhen · recording','...they are not invading us... they are running...','alert'],[0,'Elias Veyr','Running. From what?']],
      fn:(t,dt)=>{D.talk=t<4?1:0;D.lost=true;live(t,dt);}},
    {dur:7,cam:[[X+1,2.1,-.4],[X+1.4,2,-.7]],look:[[X+3.3,1.75,-1.2]],
      say:[[.3,'Tide City Command','The signal ends there, Master. Her last position was orbit over Astraea.'],
           [0,'Elias Veyr','Then we go to Astraea and find out. Ready the Vigil and the Covenant.'],
           [0,'Lt. Michael','My interceptor’s fueled and armed, Master. Say the word.'],
           [0,'Elias Veyr','We launch within the hour. Whatever the Heralds are running from, I want to see it before it sees us.']],fn:(t,dt)=>{D.talk=0;live(t,dt);}},
    {dur:5,cam:[[X-1.6,3.2,1.6],[X-4.5,5,4.5]],look:[[X,2.6,0]],small:'Next · Archive 02',cap:'The Heralds',
      fn:(t,dt)=>{D.red=Math.min(1,t/2);live(t,dt);}},
  ],()=>{
    if(P.kills>=25)PG.done('okills');if(!wentDown)PG.done('odown');if(!stalled)PG.done('ostall');PG.ach('origin');
    if(TURRETS.filter(t=>t.dead).length>=3)PG.ach('breaker');
    PG.finish({title:'ARCHIVE 01 COMPLETE',text:`The Keepers walked into the Hollow King’s trap and walked back out. The Codex is still under the mountain, and the Pathfinder’s last words point to Astraea. Troopers down: ${P.kills}. Turrets destroyed: ${TURRETS.filter(t=>t.dead).length}. Threat level: ${DIFF.name}.`,
      buttons:[{text:'Continue to The Heralds',href:'space.html',primary:true},{text:'Play again',onClick:()=>location.reload()},{text:'Archives',href:'index.html'}]});});
}

/* ---------- the director: what each phase does every frame ---------- */
/* the canyon's ambushes: each group is set up out of sight ahead of you, in both lanes. Riflemen take the rocks (anchored in cover
   until you close in), the rest hold the lanes, and on Keeper and up more of them perch on the canyon walls. Numbers per threat level in DIFFS.origin. */
const ENC=[{s:72,n:4},{s:150,n:5},{s:228,n:5}];let encIdx=0,encAlert=0,courtSet=false;
function coverSpots(s0,s1){const out=[];
  for(const o of OBST){if(o.bar||o.h<1||o.r>3)continue;const s=roadS(o.x,o.z);if(s<s0||s>s1)continue;
    const f=roadPt(s+2).clone().sub(roadPt(s).clone()).normalize(),side=latOf(o.x,o.z)<0?-1:1,c=lanePoint(s,side,LANE,new THREE.Vector3()),px=-f.z,pz=f.x,sg=Math.sign((c.x-o.x)*px+(c.z-o.z)*pz)||1;
    // just behind the rock (further up the road) and leaning out toward the lane, so they can see you and you can see them
    out.push(new THREE.Vector3(o.x+f.x*(o.r*.5+.6)+px*sg*(o.r+.6),0,o.z+f.z*(o.r*.5+.6)+pz*sg*(o.r+.6)));}
  return out.sort(()=>rng()-.5);}
function perchSpot(s,side){return ledgeSpot(s,side);}
function placeEncounter(e){const n=e.n+(OD.n||0);let k=0;
  for(const p of coverSpots(e.s,e.s+45)){if(k>=Math.ceil(n*.6))break;spawnTrooper(p.x,p.z,{anchor:p});k++;}
  for(;k<n;k++){const p=lanePoint(e.s+20+k*5,k%2?1:-1,LANE+R(-3,3),new THREE.Vector3());spawnTrooper(p.x,p.z,{hold:R(16,26)});}
  for(let j=0;j<(OD.n||0)+(e.s>100?1:0);j++){const p=perchSpot(e.s+8+j*14,j%2?1:-1);if(p){const E=spawnTrooper(p.x,p.z,{perch:true});if(E)E.pos.y=p.y;}}}
function placeCourtyard(){const n=4+(OD.n||0);let k=0;
  for(const o of OBST){if(o.bar||k>=n||o.h>3)continue;if(Math.hypot(o.x-COURT.x,o.z-COURT.z)>COURT.r||o.z>COURT.z+10)continue;
    const p=new THREE.Vector3(o.x,0,o.z-(o.r+.8));spawnTrooper(p.x,p.z,{anchor:p});k++;}
  for(;k<n;k++)spawnTrooper(R(-10,10),GATE.z+R(14,24),{hold:R(14,22)});}
// the squad follows in a loose wedge behind you, always in your lane
function squadFollow(spread){const side=latOf(P.pos.x,P.pos.z)<0?-1:1,sP=roadS(P.pos.x,P.pos.z);
  SQUAD.forEach((A,i)=>{const row=1+Math.floor(i/2),off=(i%2?1:-1)*(1.6+i*.4);
    const g=new THREE.Vector3(P.pos.x-Math.sin(P.yaw)*-row*3.2+Math.cos(P.yaw)*off*spread,0,P.pos.z-Math.cos(P.yaw)*-row*3.2-Math.sin(P.yaw)*off*spread);
    const sg=roadS(g.x,g.z);if(inSpineZone(sg)&&inSpineZone(sP)&&(playD(g.x,g.z)>-1||(latOf(g.x,g.z)<0?-1:1)!==side))lanePoint(sg,side,LANE+R(-2,2),g);
    A.goal=g;});}
const DEF_POS=[[-14,4],[14,4],[-34,14],[34,14],[0,-6]];
const LANDINGS=[new THREE.Vector3(-42,0,32),new THREE.Vector3(44,0,36),new THREE.Vector3(0,0,-2)];
let defSpawn=0,waveA=null,waveB=null;
function director(dt){
  phT+=dt;
  if(gateOpen>0&&gateOpen<1){gateOpen=Math.min(1,gateOpen+dt*.4);for(const D of gateDoors)D.m.position.x=D.x0+D.s*gateOpen*7.5;gateLight.material.color.copy(C(HOLLOW_GLOW)).multiplyScalar(1.6+gateOpen*2);}
  if(KING.root.visible){poseKing(KING,dt,kingGesture);KING.root.rotation.y=Math.atan2(-(P.pos.x-BALCONY.x),-(P.pos.z-BALCONY.z));}
  if(!P.alive)wentDown=true;
  const s=roadS(P.pos.x,P.pos.z);
  if(phase==='advance'){
    PG.objective('Advance up the canyon to the Hollow’s gate');WP=_v.set(0,4,COURT.z).clone();squadFollow(1);P.spawn.copy(lanePoint(Math.max(0,s-30),latOf(P.pos.x,P.pos.z)<0?-1:1,LANE,_u));
    if(encIdx<ENC.length&&s>ENC[encIdx].s-105)placeEncounter(ENC[encIdx++]);
    if(!courtSet&&s>ROAD_LEN-70){courtSet=true;placeCourtyard();}
    const CONTACT=['Contact! Empty Host in the rocks, both canyons! Get down!','More of them dug in ahead! Watch the walls, they’ve got rifles up high!','They’re holding the last bend! Push through, we need to reach that gate!'];
    if(encAlert<ENC.length&&s>ENC[encAlert].s-50){say('c'+encAlert,'Keeper Sergeant',CONTACT[encAlert],'alert');encAlert++;}
    if(s>25)say('a1','Lt. Michael','Too quiet. Stay sharp, they know we’re here.');
    if(s>45)say('a2','Elias Veyr','Eyes on the ridges, Michael. You can’t see the other canyon from where you are. Use the passes to cross.');
    for(const Tt of TURRETS)if(!Tt.dead&&Tt.gunner&&!Tt.gunner.H.dead&&P.pos.distanceTo(Tt.g.position)<75){say('turret','Keeper Sergeant','Hollow turret ahead! Rifles won’t crack that plating. Breaker, or take the gunner!','alert');break;}
    voices(s);
    if(s>215)say('a3','Keeper Sergeant','Gate’s ahead. That courtyard is a killing ground. Clear it fast!','alert');
    const courtFoes=ENEMIES.filter(E=>!E.H.dead&&!E.gunner&&Math.hypot(E.pos.x-COURT.x,E.pos.z-COURT.z)<COURT.r+20).length;
    if(courtSet&&Math.hypot(P.pos.x-COURT.x,P.pos.z-COURT.z)<COURT.r-10&&courtFoes===0){setPhase('kingcut');WP=null;kingScene();}
  }
  else if(phase==='fallback'){
    PG.objective('Fall back to the ships');WP=_v.set(LZ.x,3,LZ.z).clone();P.spawn.copy(lanePoint(Math.min(ROAD_LEN,s+25),latOf(P.pos.x,P.pos.z)<0?-1:1,LANE,_u));
    SQUAD.forEach((A,i)=>{const side=latOf(P.pos.x,P.pos.z)<0?-1:1,g=lanePoint(Math.max(-10,s-6-i*3),side,LANE+(i%2?3:-3),new THREE.Vector3());A.goal=g;});
    spawnT-=dt;if(spawnT<=0&&phT<70){spawnT=R(2.2,3.4)/OD.rof;for(let k=0;k<2;k++)spawnTrooper(R(-6,6),GATE.z+R(6,14),{hold:R(16,26)});}
    if(phT>9&&phT<9.1+dt){for(let k=0;k<3+(OD.n||0);k++){const p=lanePoint(Math.max(0,s-60),k%2?1:-1,LANE+R(-3,3),new THREE.Vector3());spawnTrooper(p.x,p.z+R(-4,4),{hold:R(12,20)});}
      say('f0','Keeper Sergeant','They’re ahead of us! They came down the walls! Cut through them!','alert');}
    if(phT>2)say('f1','Elias Veyr','All ships, this is Veyr! Spin up every engine, we are leaving now!','alert');
    if(phT>6)say('f2','Fleet Engineer','Engines went cold, Master! We need time, hold them off the pad!','alert');
    if(Math.hypot(P.pos.x-LZ.x,P.pos.z-LZ.z)<LZ.r-8){setPhase('defend');startDefend();}
  }
  else if(phase==='defend'){
    PG.objective('Hold the landing zone while the ships power up');WP=null;P.spawn.set(0,0,LZ.z+10);
    // the dropships: three at once (3, 3 and 4 troopers), then, once those are gone, two more with four each
    if(!waveA&&phT>12){waveA=[launchDrop(LANDINGS[0],3),launchDrop(LANDINGS[1],3,.6),launchDrop(LANDINGS[2],4,1.2)];
      say('dA','Keeper Sergeant','Three dropships, all at once! West, east and the canyon mouth! Bring them down before they land!','alert',5);}
    if(waveA&&!waveB&&waveA.every(D=>!DROPS.includes(D))){waveB=[launchDrop(LANDINGS[0].clone().add(_v.set(6,0,8)),4),launchDrop(LANDINGS[1].clone().add(_v.set(-6,0,6)),4,1)];
      say('dB','Keeper Sergeant','Two more dropships coming in hot, four troopers each! Same flanks!','alert',5);}
    const dropsDone=waveB&&waveB.every(D=>!DROPS.includes(D));
    // the ships: each charges in turn; a trooper close to a ship stops its charge. Your interceptor goes last, once the dropships are dealt with.
    let allReady=true;
    for(const S of SHIPS){if(S.ready>=100)continue;allReady=false;
      const near=ENEMIES.some(E=>!E.H.dead&&Math.hypot(E.pos.x-S.x,E.pos.z-S.z)<16);
      S.stall=near?S.stall+dt:0;if(near){if(S.stall>1.2&&!stalled){stalled=true;PG.fail('ostall');}}
      else{const others=SHIPS.filter(x=>!x.mine&&x.ready>=100).length>=3;S.ready=Math.min(100,S.ready+dt*(S.mine?(others&&dropsDone?14:0):100/(30+SHIPS.indexOf(S)*10)));}
      if(near)say('stall'+S.name+Math.floor(phT/12),'Fleet Engineer',S.mine?'They’re on your interceptor, Lieutenant! Get them off it!':'They’re on the '+S.name+'! I can’t work with them on the ramp! Clear them out!','alert',4);}
    if(SHIPS.filter(x=>!x.mine&&x.ready>=100).length>=3&&!dropsDone)say('hold','Fleet Engineer','Dropships are hot! Your interceptor is next, Lieutenant, but not with Host landing on the pad!','alert');
    drawShips();
    defSpawn-=dt;if(defSpawn<=0&&phT<70){defSpawn=R(8,11)/OD.rof;const n=phT<30?2:3;for(let k=0;k<n;k++){const p=lanePoint(R(30,70),k%2?1:-1,LANE+R(-4,4),new THREE.Vector3());spawnTrooper(p.x,p.z,{hold:R(10,20)});}}
    for(const [t,who,txt,tone,dur] of DEF_RADIO)if(phT>t)say('dr'+t,who,txt,tone,dur);
    // the colonists and civilians run for the ramps
    CIVS.forEach((A,i)=>{if(!A.on)return;const S=SHIPS[i%3];A.goal=_w.set(S.x,0,S.z+13).clone();if(A.pos.distanceTo(A.goal)<2.5)A.on=false;});
    if(allReady){setPhase('board');banner('All ships ready · board your interceptor');}
  }
  else if(phase==='board'){
    PG.objective('Board your interceptor');WP=SHIP_SEAT.clone().setY(3);drawShips();
    const near=P.alive&&P.pos.distanceTo(SHIP_SEAT)<5;onUse=near?()=>{onUse=null;setPhase('escapecut');escapeScene();}:null;
    if(near&&!coarse)banner('Press E to board');
    say('b1','Keeper Sergeant','Ships are hot! Get aboard, Lieutenant, now! We’ll cover you!','alert');
  }
}
const DEF_RADIO=[
  [3,'Fleet Engineer','Lantern’s engines are warming! Keep them off the ramps, we can’t lose a single ship!','alert'],
  [17,'Elias Veyr','Tide City, the Codex is not on the surface. He has buried it somewhere under the Hollow.','alert'],
  [27,'Tide City Command','Understood, Master. We’re still pulling the Pathfinder’s message out of the static. Her last position was Astraea.'],
  [37,'Elias Veyr','Then the answer is on Astraea. Whatever the Pathfinder found there, we find it next.'],
  [48,'The Hollow King','Run, little Keepers. Every road you take, I walked before you.','enemy',6],
];
function startDefend(){
  for(const E of ENEMIES)if(!E.H.dead&&(E.pos.z<-200||E.perch)){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  SQUAD.forEach((A,i)=>{A.goal=new THREE.Vector3(DEF_POS[i][0],0,DEF_POS[i][1]+2);});
  ENGS.forEach((A,i)=>{A.on=true;const S=SHIPS[i];A.pos.set(S.x+3,0,S.z+11);A.goal=null;A.work=true;A.yaw=Math.PI;});
  CIVS.forEach((A,i)=>{A.on=true;A.pos.set([-40,40,-20,20][i],0,82);});
  // the quartermaster has put out what's left
  addPick('rocket',-6,12);addPick('ammo',6,12);addPick('med',0,20);addPick('rocket',22,30);
  $('ships').hidden=false;banner('Hold the landing zone','alert');
}
function drawShips(){$('ships').innerHTML=SHIPS.map(S=>`<div class="${S.ready>=100?'ok':S.stall>.5?'stop':''}">${S.mine?'YOU':S.name.toUpperCase()}<i><u style="width:${S.ready}%"></u></i></div>`).join('');}

/* ---------- main loop ---------- */
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(!PG.paused){
    director(dt);
    if(CUTS.on)CUTS.update(dt);else if(phase!=='end'&&phase!=='brief'){stepPlayer(dt);placeCamera();}
    updateEnemies(dt);updateAllies(dt);updateDrops(dt);updateNades(dt);updateRockets(dt);updateTurrets(dt);updateWall(dt);updateSentry(dt);updateZeal(dt);updatePicks(dt);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);updateSignal(dt);sky.material.uniforms.uT.value=T;
    PG.combat(phaseFight());
  }else if(phase==='brief'){camera.position.set(150,90,340);camera.lookAt(0,60,-420);}
  followSun(CUTS.on?camera.position:P.pos);updateDust();updateHud(dt);updateWp();
  renderFrame();requestAnimationFrame(frame);
}
PG.briefing({title:'THE MOUNTAIN',text:'Archive 01. The Codex is somewhere beneath the Hollow King’s mountain. Go in. Find it. Get out. Something has been moving through the tunnels since the Pathfinder went silent. Do not answer the voices. Do not remove your helmet. Threat level: '+DIFF.name+'.',
  objective:'Take either canyon to the Hollow’s gate. They meet at its courtyard.',
  pc:[['Mouse','Aim (click to lock, Esc releases)'],['W A S D','Move'],['Shift','Sprint'],['Space','Jump'],['C or Ctrl','Crouch'],['Left click','Fire'],['Right click','Aim down the sights (the Lance has a scope)'],
    ['1 2 3 or wheel','Rifle, Lance, Breaker launcher'],['R','Reload'],['Q','Mobile shield'],['X','Shoulder sentry'],['G or F','Grenade'],['Z','Zeal when the meter is full'],['E','Board your ship'],['Enter','Skip a cutscene']],
  phone:[['Left thumb','Move (push to the edge to sprint)'],['Right thumb','Aim'],['FIRE','Fire (hold)'],['AIM','Aim down the sights'],['WPN','Next weapon'],['RLD','Reload'],['CRCH','Crouch'],['SHLD','Mobile shield'],['SNTRY','Shoulder sentry'],['NADE','Grenade'],['ZEAL','Zeal when charged'],['BOARD','Board your ship'],['Skip','Skip a cutscene']],
  onStart:()=>{setPhase('intro');deckIntro();}});
requestAnimationFrame(frame);
