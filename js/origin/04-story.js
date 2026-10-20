/* Elyra · Origin — the story, phase by phase:
   intro cutscene (the Keepers land at the Hollow, knowing it's a trap) → advance up the canyon → the Hollow King at his gate (cutscene)
   → fall back to the ships → hold the landing zone while every ship powers up (the Pathfinder news comes in over the radio)
   → board your interceptor → escape cutscene → Tide City, two days later: contact with the Pathfinder is lost. On to Astraea.
   The stolen treasure is called "the Codex" here (a placeholder name, easy to change in this file). */

/* ---------- cutscenes: the shared system in js/shared/cutscene.js (camera keyframes, letterbox, subtitles paced by the voices, skip) ---------- */
const easeIO=CUTS.ease;
function playCut(shots,done){P.input=false;fireHeld=false;CUTS.play(shots,{done:sk=>{P.input=true;if(done)done(sk);}});}

/* ---------- objective marker: a gold diamond over where you need to go ---------- */
const wp=document.createElement('div');wp.className='hud keep';wp.style.cssText='width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid #ffd27a;transform:rotate(45deg);background:rgba(255,210,122,.15);display:none';
const wpLab=document.createElement('div');wpLab.className='hud';wpLab.style.cssText='font:600 10px var(--mono);color:#ffd27a;letter-spacing:.08em;transform:translate(-50%,12px);display:none';
document.body.append(wp,wpLab);let WP=null;
function updateWp(){if(!WP||CUTS.on||!P.alive){wp.style.display=wpLab.style.display='none';return;}_v.copy(WP).project(camera);const on=_v.z<1;
  const x=clamp((_v.x*.5+.5)*innerWidth,30,innerWidth-30),y=clamp((-_v.y*.5+.5)*innerHeight,60,innerHeight-60);
  wp.style.display=wpLab.style.display=on?'':'none';wp.style.left=wpLab.style.left=x+'px';wp.style.top=wpLab.style.top=y+'px';wpLab.textContent=Math.round(P.pos.distanceTo(WP))+' m';}

/* ---------- cast ---------- */
const SQUAD=[addAlly('marine',-3,30,'Sergeant Daro'),addAlly('marine',3,30,'Keeper'),addAlly('marine',-5,34,'Keeper'),addAlly('marine',5,34,'Keeper'),addAlly('marine',0,36,'Keeper')];
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
PG.init('origin',{challenges:[
  {id:'okills',text:'Down 25 Empty Host troopers',pts:2000,goal:25},
  {id:'odrops',text:'Shoot down an Empty Host dropship',pts:1500},
  {id:'onade',text:'Down a trooper with a grenade',pts:500},
  {id:'ostall',text:'Never let a ship stall in the defence',pts:2500},
  {id:'odown',text:'Never go down',pts:2000},
]});

function intro(){
  SHIPS.forEach((S,i)=>{if(!S.mine)S.g.position.copy(SHIP_AIR[i]);});for(const A of SQUAD)A.on=false;
  // the dropships fly in on one clock that runs across the first three shots, so the landing never jumps between cuts
  let ic=0;const LAND0=2,LAND1=24;
  const fly=dt=>{ic+=dt;SHIPS.forEach((S,i)=>{if(S.mine)return;const u=easeIO((ic-LAND0-i*.8)/(LAND1-LAND0));S.g.position.lerpVectors(SHIP_AIR[i],_v.set(S.x,0,S.z),u);
    S.g.rotation.x=(1-u)*.12;if(u>.75&&u<1&&rng()<.35)puff(_v.set(S.x+R(-8,8),.5,S.z+R(-8,8)),R(3,6),2.5);});};
  const lead=SHIPS[1].g.position;
  playCut([
    {dur:9,cam:[[150,90,340],[70,55,190]],look:[[0,60,-420],[0,40,-380]],small:'Elyra · the Hollow',cap:'The Hollow King’s mountain',
      say:[[1,'Elias Veyr','Three nights ago the Hollow King broke into the Remnant archive and took the Codex. Every star chart we have. Every world we know.']],
      fn:(t,dt)=>fly(dt)},
    {dur:8,camAt:(u,t,o)=>o.set(lead.x-28+u*6,lead.y+7,lead.z+26-u*4),lookAt:(u,t,o)=>o.set(lead.x,lead.y+2,lead.z-10),
      say:[[.4,'Keeper Sergeant','And now he wants us to come and collect it. Master, this is a trap. Everyone on this ship knows it.','alert'],
           [0,'Elias Veyr','I know, Sergeant. We go anyway. Without the Codex every colony we have is flying blind.']],fn:(t,dt)=>fly(dt)},
    {dur:7,cam:[[-40,6,20],[-30,4,34]],look:[[0,8,70],[0,3,60]],
      say:[[.5,'Fleet Engineer','Wheels down! Engines stay hot, Master. If this goes bad we need to be off the ground in seconds, not minutes.'],
           [0,'Elias Veyr','Keep them hot. Lieutenant Michael, take the squad up the canyon. Find that Codex and bring it back to me.']],
      fn:(t,dt)=>{fly(dt);if(ic>LAND1+3)shipsLanded();}},
    {dur:6,cam:[[3,2.6,42],[1.5,3,36]],look:[[0,4,-40],[0,16,-300]],small:'Level 1',cap:'ORIGIN',
      say:[[1.6,'Lt. Michael','Squad, on me! Weapons hot. We need to be up that road before he shuts the door on us.']],
      fn:t=>{if(t<.1){shipsLanded();P.pos.set(0,0,22);P.yaw=0;P.H.root.rotation.y=0;for(const A of SQUAD){A.on=true;A.yaw=0;}}}},
  ],()=>{shipsLanded();for(const A of SQUAD)A.on=true;P.pos.set(0,0,22);P.yaw=0;P.pitch=-.05;setPhase('advance');banner('Advance to the Hollow’s gate');});
}

function kingScene(){
  KING.root.visible=true;
  playCut([
    {dur:6,cam:[[0,3,COURT.z+30],[0,4,COURT.z+18]],look:[[0,GATE_H,GATE.z],[0,GATE_H+12,GATE.z]],
      say:[[.8,'The Hollow King','Keepers. You walked my road with your weapons drawn. You came for your Codex.','enemy']],
      fn:t=>{if(t<.1){boom(BALCONY.clone().add(_v.set(0,2,0)),10,HOLLOW_GLOW,1.4);flashScreen(.25);}}},
    {dur:7,cam:[[5,BALCONY.y+3,BALCONY.z+16],[3,BALCONY.y+3.4,BALCONY.z+12]],look:[[0,BALCONY.y+2.8,BALCONY.z]],
      say:[[.4,'The Hollow King','You are too late. While you marched, I sent it beyond your sky, to a world where you will have to follow it.','enemy'],
           [0,'Elias Veyr','Where is it, Hollow? Answer me!','alert']],fn:t=>{kingGesture=easeIO((t-1)/2);}},
    {dur:6,cam:[[0,9,COURT.z+5],[0,14,COURT.z+42]],look:[[0,GATE_H*.6,GATE.z],[0,12,GATE.z]],
      say:[[.2,'The Hollow King','Empty them.','enemy'],[0,'Keeper Sergeant','It’s a trap! Fall back! Everyone back to the ships, now!','alert']],
      fn:t=>{kingGesture=1;if(t>1.2&&!gateOpen){openGate();}}},
  ],()=>{openGate();kingGesture=.3;P.pos.set(0,0,COURT.z+30);P.yaw=Math.PI;setPhase('fallback');banner('It’s a trap · fall back to the ships','alert');});
}
function openGate(){if(gateOpen)return;gateOpen=.001;flashScreen(.3);if(typeof sfx!=='undefined')sfx.horn(_v.set(0,10,GATE.z));
  for(let k=0;k<7+(OD.n||0)*2;k++)spawnTrooper(R(-6,6),GATE.z+R(4,12));}

function escapeScene(){
  for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(LZ)<70)E.speed*=.5;
  const fighters=[];for(let i=0;i<5;i++){const K=SHIPKIT.wraith(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat()),new THREE.Mesh(K.glow,fleetGlowMat(HOLLOW_GLOW,2)));g.scale.setScalar(.45);g.visible=false;scene.add(g);fighters.push(g);}
  let lt=0;const lift=dt=>{lt+=dt;SHIPS.forEach((S,i)=>{const k=Math.max(0,lt-i*.6);S.g.position.y=k*k*1.6;S.g.position.z=S.z+k*k*.6;if(k<6&&rng()<.4)puff(_v.set(S.x+R(-6,6),.5,S.z+R(-6,6)),R(3,7),2.5);});};
  const shoot=()=>{if(rng()<.15){const S=pick(SHIPS),to=S.g.position.clone().add(_v.set(R(-20,20),R(-8,8),R(-20,20)));fire(_w.set(R(-30,30),GATE_H,GATE.z+10),to,180,'hrifle',q=>boom(q,8,0xd8a0ff,.6));}};
  let killed=false;
  playCut([
    {dur:6,cam:[[50,8,10],[46,12,18]],look:[[10,6,50],[10,16,55]],say:[[.4,'Keeper Sergeant','Everyone’s aboard! Lantern, Bastion, Mercy, lift, lift, lift! Go now!','alert']],
      fn:(t,dt)=>{lift(dt);shoot();}},
    {dur:7,cam:[[60,70,60],[80,120,160]],look:[[0,60,40],[0,90,120]],
      say:[[.5,'The Hollow King','Run, then. Follow your Codex, Keepers. Wherever it leads, I have walked there first.','enemy']],
      fn:(t,dt)=>{lift(dt);shoot();fighters.forEach((g,i)=>{if(killed&&i===2)return;g.visible=true;g.position.set(-40+i*20+Math.sin(t+i)*6,40+t*8+i*3,-60+t*30);g.lookAt(g.position.x,g.position.y+3,g.position.z+30);
        if(rng()<.05)fire(g.position.clone(),pick(SHIPS).g.position.clone(),160,'hrifle',q=>boom(q,6,0xd8a0ff,.5));});
        if(t>4&&!killed){killed=true;boom(fighters[2].position,10,0xfff0c0,.6);boom(fighters[2].position,16,0xff6a1a,1.2);fighters[2].visible=false;}}},
    {dur:5,cam:[[0,160,260],[0,200,380]],look:[[0,150,0],[-200,160,-400]],small:'The Keepers withdraw',cap:'Bound for Tide City',
      fn:(t,dt)=>{lift(dt);fighters.forEach(g=>g.visible=false);}},
  ],()=>{fighters.forEach(g=>scene.remove(g));ending();});
}

/* ---------- the ending: two days later, the command deck at Tide City, night over the bay ---------- */
const DECK=new THREE.Vector3(2400,0,0);   // off the edge of the desert map, built when the ending starts
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
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(22,6.4),new THREE.MeshBasicMaterial({color:C(0x7fb6ff),transparent:true,opacity:.07,depthWrite:false}));glass.rotation.y=-Math.PI/2;glass.position.set(X+14,4,0);G.add(glass);
  // the holo table and Astraea turning over it
  const tbl=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.6,1.1,24),metal);tbl.position.set(X,.55,0);tbl.castShadow=true;G.add(tbl);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(2.15,.06,6,48),cyan);rim.rotation.x=Math.PI/2;rim.position.set(X,1.12,0);G.add(rim);
  const holo=new THREE.Group();holo.position.set(X,2.6,0);G.add(holo);
  const pl=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:C(0x7fd8ff),wireframe:true,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));holo.add(pl);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.96,24,16),new THREE.MeshBasicMaterial({color:C(0x0a1830),transparent:true,opacity:.7}));holo.add(core);
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.6,.012,4,64),cyan);orbit.rotation.x=Math.PI/2.3;holo.add(orbit);
  const blip=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x8cf0b0).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));blip.scale.setScalar(.35);holo.add(blip);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.3,2,1.4,24,1,true),new THREE.MeshBasicMaterial({color:C(0x7fe3ff),transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.set(X,1.8,0);G.add(beam);
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
  // the cast
  const elias=makeHuman('master'),officer=makeHuman('officer');G.add(elias.root,officer.root);
  const face=(H,x,z,tx,tz)=>{H.root.position.set(X+x,0,z);H.root.rotation.y=Math.atan2(-(tx-x),-(tz-z));};
  face(elias,3.3,-1.2,0,0);face(officer,-3,-1.8,0,0);
  return{G,holo,pl,blip,orbit,beam,elias,officer,lamp};
}
function ending(){
  setPhase('end');P.input=false;WP=null;$('ships').hidden=true;
  for(const E of ENEMIES){scene.remove(E.H.root);}ENEMIES.length=0;for(const A of ALLIES)A.on=false;
  if(!deck)deck=buildDeck();deck.G.visible=true;
  // night over the bay
  scene.fog.color.set(C(0x0e1428));scene.fog.density=.0009;scene.background=scene.fog.color;
  sky.material.uniforms.hor.value.set(C(0x2a3a6a));sky.material.uniforms.mid.value.set(C(0x121a38));sky.material.uniforms.zen.value.set(C(0x04060e));
  sun.intensity=.35;sun.color.set(C(0x9fb8ff));for(const o of scene.children)if(o.isHemisphereLight)o.intensity=.35;
  hollowLamp.visible=lzLamp.visible=false;dust.visible=false;
  // Lieutenant Michael stands at the table with them
  P.H.root.visible=true;reviveHuman(P.H);P.pos.set(DECK.x-.4,0,2.9);P.H.root.rotation.y=Math.atan2(.4,2.9);
  const X=DECK.x,D=deck;let ang=0,lost=false;
  const live=(t,dt)=>{ang+=dt*.3;D.pl.rotation.y=ang;D.orbit.rotation.z=ang*.5;
    const a=ang*2.2;D.blip.position.set(Math.cos(a)*1.6,Math.sin(a)*.6,Math.sin(a)*1.6);D.blip.material.opacity=lost?0:.6+.4*Math.sin(t*9);
    poseHuman(D.elias,dt,0,0);poseHuman(D.officer,dt,0,0);poseHuman(P.H,dt,0,0);D.lamp.intensity=2+Math.sin(t*3)*.3;};
  const redden=k=>{D.pl.material.color.copy(C(0x7fd8ff)).lerp(C(0xff5a2a),k);D.lamp.color.copy(C(0x7fe3ff)).lerp(C(0xff7a4a),k);};
  playCut([
    {dur:3.6,black:true,small:'Two days later',cap:'Tide City',cam:[[X-11,4.2,4]],look:[[X+400,60,-60]],fn:live},
    {dur:7,cam:[[X-11,4.2,4],[X-8,3.6,2.6]],look:[[X+400,60,-60],[X+400,48,-40]],
      say:[[.6,'Tide City Command','Master Veyr! We’ve lost the Pathfinder! Her last signal came from orbit over Astraea, and then nothing.','alert']],fn:live},
    {dur:6,cam:[[X-3,3.3,3.6],[X-2,3,2.7]],look:[[X,2.5,0]],
      say:[[.3,'Elias Veyr','No distress call? Nothing at all?'],[0,'Tide City Command','Static. Whatever hit her, it hit fast. She had twelve crew aboard, Master.','alert']],
      fn:(t,dt)=>{live(t,dt);if(t>1.2&&!lost){lost=true;boom(D.holo.position.clone().add(D.blip.position),.8,0xff8a7a,.4);}}},
    {dur:6,cam:[[X+1,2.1,-.4],[X+1.4,2,-.7]],look:[[X+3.3,1.75,-1.2]],
      say:[[.3,'Elias Veyr','Then we need to move now. Ready the Vigil and the Covenant. If the Codex is on Astraea, so is whatever took the Pathfinder.'],
           [0,'Lt. Michael','My interceptor’s fueled and armed, Master. Say the word.'],
           [0,'Elias Veyr','We launch within the hour. Every minute we wait, her trail goes colder.']],fn:live},
    {dur:5,cam:[[X-1.6,3.2,1.6],[X-4.5,5,4.5]],look:[[X,2.6,0]],small:'Next',cap:'Astraea',
      fn:(t,dt)=>{live(t,dt);redden(Math.min(1,t/2));}},
  ],()=>{
    if(P.kills>=25)PG.done('okills');if(!wentDown)PG.done('odown');if(!stalled)PG.done('ostall');PG.ach('origin');
    PG.finish({title:'ORIGIN COMPLETE',text:`The Keepers walked into the Hollow King’s trap and walked back out. The Codex is gone, and now the Pathfinder is silent. Troopers down: ${P.kills}. Difficulty: ${DIFF.name}.`,
      buttons:[{text:'Continue to Astraea',href:'space.html',primary:true},{text:'Play again',onClick:()=>location.reload()},{text:'Chapters',href:'index.html'}]});});
}

/* ---------- the director: what each phase does every frame ---------- */
/* the canyon's ambushes: each group is set up out of sight ahead of you. Riflemen take the rocks beside the road (anchored in cover
   until you close in), the rest hold the road, and on Hard and up more of them perch on the canyon walls above. Numbers per difficulty in DIFFS.origin. */
const ENC=[{s:72,n:4},{s:150,n:5},{s:228,n:5}];let encIdx=0,encAlert=0,courtSet=false;
function coverSpots(s0,s1){const out=[];
  for(const o of OBST){if(o.bar||o.h<1||o.r>3)continue;const s=roadS(o.x,o.z);if(s<s0||s>s1)continue;
    const c=roadPt(s).clone(),f=roadPt(s+2).clone().sub(c).normalize(),px=-f.z,pz=f.x,sg=Math.sign((c.x-o.x)*px+(c.z-o.z)*pz)||1;
    // just behind the rock (further up the road) and leaning out toward the road, so they can see you and you can see them
    out.push(new THREE.Vector3(o.x+f.x*(o.r*.5+.6)+px*sg*(o.r+.6),0,o.z+f.z*(o.r*.5+.6)+pz*sg*(o.r+.6)));}
  return out.sort(()=>rng()-.5);}
function perchSpot(s,side){const c=roadPt(s).clone(),f=roadPt(s+2).clone().sub(c).normalize(),px=-f.z*side,pz=f.x*side;
  for(let d=ROAD_W+2;d<ROAD_W+12;d+=1){const x=c.x+px*d,z=c.z+pz*d,k=playD(x,z);if(k>2.5&&k<8)return new THREE.Vector3(x,groundY(x,z),z);}return null;}
function placeEncounter(e){const n=e.n+(OD.n||0);let k=0;
  for(const p of coverSpots(e.s,e.s+45)){if(k>=Math.ceil(n*.6))break;spawnTrooper(p.x,p.z,{anchor:p});k++;}
  for(;k<n;k++){const p=roadPt(e.s+20+k*5);spawnTrooper(p.x+R(-7,7),p.z+R(-3,3),{hold:R(16,26)});}
  for(let j=0;j<(OD.n||0)+(e.s>100?1:0);j++){const p=perchSpot(e.s+8+j*14,j%2?1:-1);if(p){const E=spawnTrooper(p.x,p.z,{perch:true});if(E)E.pos.y=p.y;}}}
function placeCourtyard(){const n=4+(OD.n||0);let k=0;
  for(const o of OBST){if(o.bar||k>=n)continue;if(Math.hypot(o.x-COURT.x,o.z-COURT.z)>COURT.r||o.z>COURT.z+10)continue;
    const p=new THREE.Vector3(o.x,0,o.z-(o.r+.8));spawnTrooper(p.x,p.z,{anchor:p});k++;}
  for(;k<n;k++)spawnTrooper(R(-10,10),GATE.z+R(14,24),{hold:R(14,22)});}
function squadFollow(spread){SQUAD.forEach((A,i)=>{const row=1+Math.floor(i/2),side=(i%2?1:-1)*(1.6+i*.4);
  A.goal=_w.set(P.pos.x-Math.sin(P.yaw)*-row*3.2+Math.cos(P.yaw)*side*spread,0,P.pos.z-Math.cos(P.yaw)*-row*3.2-Math.sin(P.yaw)*side*spread).clone();});}
const DEF_POS=[[-14,4],[14,4],[-34,14],[34,14],[0,-6]];
const LANDINGS=[new THREE.Vector3(-42,0,32),new THREE.Vector3(44,0,36),new THREE.Vector3(0,0,-2)];
let defSpawn=0,dropIdx=0;
function director(dt){
  phT+=dt;
  if(gateOpen>0&&gateOpen<1){gateOpen=Math.min(1,gateOpen+dt*.4);for(const D of gateDoors)D.m.position.x=D.x0+D.s*gateOpen*7.5;gateLight.material.color.copy(C(HOLLOW_GLOW)).multiplyScalar(1.6+gateOpen*2);}
  if(KING.root.visible){poseKing(KING,dt,kingGesture);KING.root.rotation.y=Math.atan2(-(P.pos.x-BALCONY.x),-(P.pos.z-BALCONY.z));}
  if(!P.alive)wentDown=true;
  const s=roadS(P.pos.x,P.pos.z);
  if(phase==='advance'){
    PG.objective('Advance up the canyon to the Hollow’s gate');WP=_v.set(0,4,COURT.z).clone();squadFollow(1);P.spawn.copy(roadPt(Math.max(0,s-30)));
    if(encIdx<ENC.length&&s>ENC[encIdx].s-105)placeEncounter(ENC[encIdx++]);
    if(!courtSet&&s>ROAD_LEN-70){courtSet=true;placeCourtyard();}
    const CONTACT=[['Contact! Empty Host in the rocks, both sides of the road! Get down!'],['More of them dug in ahead! Watch the walls, they’ve got rifles up high!'],['They’re holding the last bend! Push through, we need to reach that gate!']];
    if(encAlert<ENC.length&&s>ENC[encAlert].s-50){say('c'+encAlert,'Keeper Sergeant',CONTACT[encAlert][0],'alert');encAlert++;}
    if(s>25)say('a1','Lt. Michael','Too quiet. Stay sharp, they know we’re here.');if(s>45)say('a2','Elias Veyr','He wants us at his door. Eyes on the ridges, Michael, and keep moving.');
    if(s>215)say('a3','Keeper Sergeant','Gate’s ahead. That courtyard is a killing ground. Clear it fast!','alert');
    const courtFoes=ENEMIES.filter(E=>!E.H.dead&&Math.hypot(E.pos.x-COURT.x,E.pos.z-COURT.z)<COURT.r+20).length;
    if(courtSet&&Math.hypot(P.pos.x-COURT.x,P.pos.z-COURT.z)<COURT.r-10&&courtFoes===0){setPhase('kingcut');WP=null;kingScene();}
  }
  else if(phase==='fallback'){
    PG.objective('Fall back to the ships');WP=_v.set(LZ.x,3,LZ.z).clone();P.spawn.copy(roadPt(Math.min(ROAD_LEN,s+25)));
    SQUAD.forEach((A,i)=>{const g=roadPt(Math.max(-10,s-6-i*3));A.goal=_w.set(g.x+(i%2?3:-3),0,g.z).clone();});
    spawnT-=dt;if(spawnT<=0&&phT<70){spawnT=R(2.2,3.4)/OD.rof;for(let k=0;k<2;k++)spawnTrooper(R(-6,6),GATE.z+R(6,14),{hold:R(16,26)});}
    if(phT>9&&phT<9.1+dt){const p=roadPt(Math.max(0,s-60));for(let k=0;k<3+(OD.n||0);k++)spawnTrooper(p.x+R(-8,8),p.z+R(-4,4),{hold:R(12,20)});say('f0','Keeper Sergeant','They’re ahead of us! They came down the walls! Cut through them!','alert');}
    if(phT>2)say('f1','Elias Veyr','All ships, this is Veyr! Spin up every engine, we are leaving now!','alert');
    if(phT>6)say('f2','Fleet Engineer','Engines went cold, Master! We need time, hold them off the pad!','alert');
    if(Math.hypot(P.pos.x-LZ.x,P.pos.z-LZ.z)<LZ.r-8){setPhase('defend');startDefend();}
  }
  else if(phase==='defend'){
    PG.objective('Hold the landing zone while the ships power up');WP=null;P.spawn.set(0,0,LZ.z+10);
    // the ships: each charges in turn; a trooper close to a ship stops its charge
    let allReady=true;
    for(const S of SHIPS){if(S.ready>=100)continue;allReady=false;
      const near=ENEMIES.some(E=>!E.H.dead&&Math.hypot(E.pos.x-S.x,E.pos.z-S.z)<16);
      S.stall=near?S.stall+dt:0;if(near){if(S.stall>1.2&&!stalled){stalled=true;PG.fail('ostall');}}
      else S.ready=Math.min(100,S.ready+dt*(S.mine?(SHIPS.filter(x=>!x.mine&&x.ready>=100).length>=3?14:0):100/(26+SHIPS.indexOf(S)*9)));
      if(near)say('stall'+S.name+Math.floor(phT/12),'Fleet Engineer',S.mine?'They’re on your interceptor, Lieutenant! Get them off it!':'They’re on the '+S.name+'! I can’t work with them on the ramp! Clear them out!','alert',4);}
    drawShips();
    defSpawn-=dt;if(defSpawn<=0&&phT<70){defSpawn=R(6,8.5)/OD.rof;const n=phT<20?3:4;for(let k=0;k<n;k++){const p=roadPt(R(30,70));spawnTrooper(p.x+R(-8,8),p.z,{hold:R(10,20)});}}
    if(dropIdx<3&&phT>[12,30,48][dropIdx]){launchDrop(LANDINGS[dropIdx]);dropIdx++;say('d'+dropIdx,'Keeper Sergeant',['Dropship! West flank! Bring it down before it lands!','Another dropship, east side! Shoot it down!','Dropship right on the canyon mouth! Everything you’ve got, now!'][dropIdx-1],'alert',4);}
    for(const [t,who,txt,tone,dur] of DEF_RADIO)if(phT>t)say('dr'+t,who,txt,tone,dur);
    // the colonists and civilians run for the Mercy's ramp
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
  [14,'Elias Veyr','Tide City, this is Veyr! The Codex is not here. He has already sent it off-world!','alert'],
  [23,'Tide City Command','Master, the Pathfinder left orbit this morning on the Codex’s trail! Last heading: a world the old charts call Astraea.'],
  [33,'Elias Veyr','Then the Pathfinder is the only ship that can catch it. Tell her captain to report every hour. Every hour, no exceptions!'],
  [44,'The Hollow King','Run, little Keepers. Every road you take, I have already walked.','enemy',6],
  [58,'Fleet Engineer','Last dropship is almost there! Lieutenant, your interceptor is next, hold on!','alert'],
];
function startDefend(){
  for(const E of ENEMIES)if(!E.H.dead&&(E.pos.z<-200||E.perch)){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  SQUAD.forEach((A,i)=>{A.goal=new THREE.Vector3(DEF_POS[i][0],0,DEF_POS[i][1]+2);});
  ENGS.forEach((A,i)=>{A.on=true;const S=SHIPS[i];A.pos.set(S.x+3,0,S.z+11);A.goal=null;A.work=true;A.yaw=Math.PI;});
  CIVS.forEach((A,i)=>{A.on=true;A.pos.set([-40,40,-20,20][i],0,82);});
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
    updateEnemies(dt);updateAllies(dt);updateDrops(dt);updateNades(dt);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);
    PG.combat(phase==='advance'||phase==='fallback'||phase==='defend');
  }else if(phase==='brief'){camera.position.set(150,90,340);camera.lookAt(0,60,-420);}
  followSun(P.pos);updateDust();updateHud(dt);updateWp();
  renderFrame();requestAnimationFrame(frame);
}
PG.briefing({title:'ORIGIN',text:'Chapter 1. Three nights ago the Hollow King stole the Codex from the Remnant archive. He has invited the Keepers to his mountain fortress, the Hollow, to take it back. Everyone knows it is a trap. Difficulty: '+DIFF.name+'.',
  objective:'Advance up the canyon with your squad to the Hollow’s gate.',
  pc:[['Mouse','Aim (click to lock, Esc releases)'],['W A S D','Move'],['Shift','Sprint'],['Space','Jump'],['Left / right click','Fire'],['G or F','Grenade'],['E','Board your ship'],['Enter','Skip a cutscene']],
  phone:[['Left thumb','Move (push to the edge to sprint)'],['Right thumb','Aim'],['FIRE','Fire (hold)'],['NADE','Grenade'],['JUMP','Jump'],['BOARD','Board your ship'],['Skip','Skip a cutscene']],
  onStart:()=>{setPhase('intro');intro();}});
requestAnimationFrame(frame);
