/* Elyra · Side mission S1 · Pathfinder — the story, phase by phase (Bryce's opening, Oct 21):
   the Pathfinder's drop bay ("We get in. We find it. We get out.") → the team jumps and lands in the crater south of a Hollow installation
   → the yard and its wall guns → blow the gate → the Host's halls → the old stone nobody built ("the schematics end here")
   → the sealed door ("This wasn't on the schematics.") → the chamber: the object, the lights going out, "Take it." → alarms
   → fight out up the service ramp (doors slam, floor guns rise; Marsh carries the package) → the hangar: a gunship comes through
   the roof → hold the deck until the Pathfinder can come in → board → the chase, the failed Slipscape jump, the fall into Astraea,
   the crash, and "They followed us." (js/pathfinder/03-sets.js builds those sets and plays both cutscenes).
   Rhen, Marsh and Landry are the names carved under the Hollow King's mountain (js/origin/06-below.js), dated this day. */
const easeIO=CUTS.ease;
function playCut(shots,done,opts){P.input=false;fireHeld=false;P.adsHeld=false;CUTS.play(shots,Object.assign({done:sk=>{P.input=true;if(done)done(sk);}},opts||{}));}

/* ---------- objective marker, and markers on the last few enemies ---------- */
const wp=document.createElement('div');wp.className='hud keep';wp.style.cssText='width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid #ffd27a;transform:rotate(45deg);background:rgba(255,210,122,.15);display:none';
const wpLab=document.createElement('div');wpLab.className='hud';wpLab.style.cssText='font:600 10px var(--mono);color:#ffd27a;letter-spacing:.08em;transform:translate(-50%,12px);display:none';
document.body.append(wp,wpLab);let WP=null;
function updateWp(){if(!WP||CUTS.on||!P.alive){wp.style.display=wpLab.style.display='none';return;}_v.copy(WP).project(camera);const on=_v.z<1;
  const x=clamp((_v.x*.5+.5)*innerWidth,30,innerWidth-30),y=clamp((-_v.y*.5+.5)*innerHeight,60,innerHeight-60);
  wp.style.display=wpLab.style.display=on?'':'none';wp.style.left=wpLab.style.left=x+'px';wp.style.top=wpLab.style.top=y+'px';wpLab.textContent=Math.round(P.pos.distanceTo(WP))+' m';}
const FOE_MK=[];let markList=[];
function markFoes(list){
  while(FOE_MK.length<list.length){const d=document.createElement('div');d.className='hud keep';d.style.cssText='width:12px;height:12px;margin:-6px 0 0 -6px;border:2px solid #ff5a4a;transform:rotate(45deg);box-shadow:0 0 8px rgba(255,90,74,.8);display:none;pointer-events:none';document.body.appendChild(d);FOE_MK.push(d);}
  FOE_MK.forEach((d,i)=>{const p=list[i];if(!p||CUTS.on||!P.alive){d.style.display='none';return;}_v.copy(p).project(camera);
    const x=clamp((_v.x*.5+.5)*innerWidth,24,innerWidth-24),y=clamp((-_v.y*.5+.5)*innerHeight,60,innerHeight-60),behind=_v.z>1;
    d.style.display='';d.style.left=(behind?innerWidth-x:x)+'px';d.style.top=(behind?innerHeight-60:y)+'px';d.style.opacity=behind?.55:1;});}

/* ---------- the strike team: Captain Rhen (you), Sergeant Marsh, Specialist Okafor, Corporal Thorne. Ensign Landry flies the Pathfinder ---------- */
ALLY_TINT.marine=0xb4bcc4;   // the Pathfinder's scout grey
const SQUAD=[addAlly('marine',-3,30,'Sergeant Marsh'),addAlly('marine',3,30,'Okafor'),addAlly('marine',0,34,'Thorne')];
const MARSH=SQUAD[0];
// the package rides on Marsh's back once it's taken: a cracked Host case with the light coming through the seams
const CASE=(()=>{const g=new THREE.Group(),m=new THREE.Mesh(new THREE.BoxGeometry(.5,.8,.3),new THREE.MeshStandardMaterial({color:C(0x221d2a),roughness:.4,metalness:.7,map:panelTex}));g.add(m);
  const s=new THREE.Mesh(new THREE.BoxGeometry(.52,.05,.32),new THREE.MeshBasicMaterial({color:C(0xc8d4ff).multiplyScalar(2),toneMapped:false}));s.position.y=.1;g.add(s);
  const h=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xa8b8ff).multiplyScalar(1.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6}));h.scale.setScalar(1.4);g.add(h);
  g.position.set(0,1.35,.32);g.visible=false;MARSH.H.root.add(g);return{g,h};})();
// what 03-play says when things go wrong, in this crew's voices
function playerDown(){P.alive=false;P.hp=0;P.respawnT=5;killHuman(P.H);fireHeld=false;P.adsHeld=false;PG.say('Sergeant Marsh','Captain’s down! Okafor, get him up!','alert',4);
  banner('You are down · your team is pulling you back','alert');}
function hurtAlly(A,dmg){A.hits++;hitHuman(A.H);if(A.H.dead||!A.on)return;A.lastHit=T;A.hp-=dmg*(OD.allyDmg||1);
  if(A.hp<=0){A.hp=0;killHuman(A.H);A.downT=ALLY_DOWN;A.target=null;
    if(A===MARSH&&CASE.g.visible){PG.say('Okafor','Marsh is down! He’s got the package! Captain, get to him!','alert');PG.fail('pmarsh');}
    else PG.say(A===MARSH?'Okafor':'Sergeant Marsh',(A===MARSH?'Marsh':A.name)+' is down! Someone get to them!','alert');}}

/* ---------- phases ---------- */
let phase='brief',phT=0,wentDown=false;
const said=new Set();
// a line once. (03-play's turret warning comes from "Keeper Sergeant": here that's Marsh)
function say(key,who,txt,tone,dur){if(said.has(key))return;said.add(key);if(who==='Keeper Sergeant'){who='Sergeant Marsh';txt=txt.replace('Hollow turret ahead!','Wall gun!');}PG.say(who,txt,tone,dur);}
const CP_KEY='elyra.checkpoint.pathfinder';
function saveCP(at){try{localStorage.setItem(CP_KEY,JSON.stringify({at,t:Date.now()}));}catch(_){}}
function clearCP(){try{localStorage.removeItem(CP_KEY);}catch(_){}}
function readCP(){try{const c=JSON.parse(localStorage.getItem(CP_KEY)||'null');return c&&['halls','extract','hangar'].includes(c.at)?c:null;}catch(_){return null;}}
const CP_NAME={halls:'Inside the gate',extract:'The way out',hangar:'The hangar'};
function setPhase(p){if(['halls','extract','hold'].includes(p)&&phase!==p)saveCP(p==='hold'?'hangar':p);if(p==='end')clearCP();phase=p;phT=0;
  if(['board','end','doorcut','gunshipcut'].includes(p))reviveAllies();}
function phaseFight(){return['yard','halls','extract','hold','dogfight'].includes(phase);}
PG.init('pathfinder',{challenges:[
  {id:'pkills',text:'Down 30 Empty Host troopers',pts:2000,goal:30},
  {id:'pturret',text:'Silence 3 Host guns',pts:1500,goal:3},
  {id:'pmarsh',text:'Never let Marsh go down with the package',pts:2500},
  {id:'pnade',text:'Down a trooper with a grenade',pts:500},
  {id:'pdown',text:'Never go down',pts:2000},
  {id:'pdog',text:'Down 8 fighters in the dropship',pts:1500},
]});
// hurtTurret and hurtEnemy count toward the Mountain's challenges by name: count them here too
{const _p=PG.prog,_d=PG.done;PG.prog=(id,n)=>_p(id==='okills'?'pkills':id==='oturret'?'pturret':id,n);PG.done=id=>_d(id==='onade'?'pnade':id);}

/* ---------- places along the way ---------- */
const _pt=new THREE.Vector3();
function at(s,lat,out){const p=roadPt(clamp(s,0,ROAD_LEN),out||new THREE.Vector3()),n=roadN(clamp(s,0,ROAD_LEN));p.x+=n.x*lat;p.z+=n.z*lat;p.y=groundY(p.x,p.z);return p;}
// a gun on the yard's wall top, facing in; its gunner stands on the terrace behind it
function wallGun(s,side){const h=laneHalf(s),p=at(s,side*(h+.9)),c=at(s-20,0);const face=Math.atan2(-(c.x-p.x),-(c.z-p.z));return addTurret(p.x,p.z,WALLH.yard,face,'Wall gun');}
// riflemen up on the yard's terrace, or the big hall's galleries
function perch(s,side,y,extra){const h=laneHalf(s),p=at(s,side*(h+(extra||1.6)));const E=spawnTrooper(p.x,p.z,{perch:true});if(E){E.pos.y=y;}return E;}
function anchorBehind(s,lat){const p=at(s+1.8,lat);return spawnTrooper(p.x,p.z,{anchor:p});}
function holder(s,lat){const p=at(s,lat);return spawnTrooper(p.x,p.z,{hold:R(14,24)});}
// cover: barricades and pods in the yard, pods in the Host halls, columns in the big hall, fallen stone in the old stretch
{for(const [s,lat,w] of[[22,-8,7],[22,9,6],[48,0,8],[66,-12,6],[70,11,7],[92,-4,9],[104,8,5]]){const p=at(s,lat),n=roadN(s);addBarricade(p.x,p.z,Math.atan2(n.z,-n.x)+Math.PI,w);}
 for(const [s,lat,z] of[[34,-15,1.6],[38,16,1.4],[58,15,1.8],[82,-16,1.5],[86,14,1.3],[110,-5,1.2]]){const p=at(s,lat);addPod(p.x,p.z,z);}
 for(const [s,lat] of[[132,-4],[140,4.5],[150,-4.5],[160,3.5],[172,-3.5]]){const p=at(s,lat);addPod(p.x,p.z,R(1.2,1.6));}
 for(let s=S_HALL0+10;s<S_HALL1-8;s+=11)for(const side of[-1,1]){const p=at(s,side*6.5);const c=new THREE.Mesh(new THREE.CylinderGeometry(.8,.95,14,8),hostMat);
   c.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(c.geometry.attributes.position.count*3).fill(.16),3));c.position.set(p.x,7,p.z);c.castShadow=c.receiveShadow=true;scene.add(c);OBST.push({x:p.x,z:p.z,r:.95,h:14});}
 for(const [s,lat,z] of[[200,0,1.4],[222,-2,1.2],[256,-3,1.6],[268,3,1.3],[284,-2.5,1.1]]){const p=at(s,lat);if(s<S_OLD)addPod(p.x,p.z,z);else addBlock(p.x,p.z,z);}
 for(const [s,lat] of[[372,-2.5],[392,2.5],[414,-2]]){const p=at(s,lat);addPod(p.x,p.z,R(1.1,1.4));}
 for(const [x,z] of[[PLAT.x-12,PLAT.z-6],[PLAT.x-6,PLAT.z+12],[PLAT.x+4,PLAT.z-14]])addPod(x,z,1.7);}
// supplies along the way
for(const [s,lat,t] of[[30,0,'ammo'],[70,-6,'med'],[100,6,'rocket'],[124,0,'ammo'],[176,2,'med'],[214,-4,'rocket'],[236,4,'ammo'],[288,0,'med'],[358,0,'ammo'],[400,0,'med']]){const p=at(s,lat);addPick(t,p.x,p.z);}

/* ---------- the encounters: placed out of sight ahead of you ---------- */
const ENC=[
  {s:24,go:()=>{const n=3+(OD.n||0);for(let k=0;k<n;k++)anchorBehind(22+(k%2)*26,k%2?9:-8);holder(40,-4);holder(44,6);},line:['Sergeant Marsh','Contact! Host on the barricades!','alert']},
  {s:60,go:()=>{wallGun(64,-1);perch(56,1,WALLH.yard);perch(74,-1,WALLH.yard);for(let k=0;k<3+(OD.n||0);k++)anchorBehind(66+(k%2)*4,k%2?11:-12);holder(80,0);},line:['Okafor','Wall guns, and riflemen on the terrace!','alert']},
  {s:92,go:()=>{wallGun(100,1);perch(96,-1,WALLH.yard);for(let k=0;k<3+(OD.n||0);k++)anchorBehind(92+k*6,k%2?8:-4);holder(112,-3);holder(112,3);},line:['Sergeant Marsh','They’re holding the gate!','alert']},
  {s:132,go:()=>{for(let k=0;k<3+(OD.n||0);k++)anchorBehind(140+k*10,k%2?4.5:-4.5);holder(165,0);},line:['Thorne','Inside! Short range, watch the pods!','alert']},
  {s:186,go:()=>{for(const [s,side] of[[196,-1],[208,1],[222,-1],[230,1]])perch(s,side,5,1.7);for(let k=0;k<3+(OD.n||0);k++)holder(210+k*6,k%2?4:-4);holder(232,0);},line:['Sergeant Marsh','They’re on the galleries! Both sides!','alert']},
  {s:252,go:()=>{for(let k=0;k<2+(OD.n||0);k++)anchorBehind(266+k*10,k%2?3:-3);},line:null},
];
let encIdx=0;

/* ---------- the gate: plant the charge, get clear ---------- */
let charge=null;
function gateStep(dt){const cp=GATE.frame.localToWorld(new THREE.Vector3(0,0,-2.4));cp.y=0;
  if(!charge){PG.objective('Plant the breaching charge on the gate');WP=cp.clone().setY(2);
    const near=P.alive&&Math.hypot(P.pos.x-cp.x,P.pos.z-cp.z)<3.4;onUse=near?()=>{charge={t:4};}:null;
    if(near){gateStep.hold=(gateStep.hold||0)+dt;banner(coarse?'Planting the charge…':'Planting the charge… (or press E)');if(gateStep.hold>1.1)charge={t:4};}else gateStep.hold=0;
    if(charge){onUse=null;GATE.charge.visible=true;banner('Charge set · get clear!','alert');say('g1','Sergeant Marsh','Charge set! Everybody back!','alert');if(typeof sfx!=='undefined')sfx.beep&&sfx.beep();}
    return false;}
  charge.t-=dt;GATE.charge.material.emissiveIntensity=Math.sin(charge.t*14)>0?2:0;if(Math.floor(charge.t*2)!==Math.floor((charge.t+dt)*2)&&typeof sfx!=='undefined')sfx.empty();
  WP=null;PG.objective('Get clear of the gate · '+Math.max(0,Math.ceil(charge.t)));
  if(charge.t<=0){blowGate();flashScreen(.35);if(P.alive&&P.pos.distanceTo(GATE.frame.position)<9)hurtPlayer(60);for(const A of SQUAD)if(A.pos.distanceTo(GATE.frame.position)<8)hurtAlly(A,40);
    for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(GATE.frame.position)<12)hurtEnemy(E,99,'nade');return true;}
  return false;}

/* ---------- the squad follows a few metres behind you, spread across the way ---------- */
function squadFollow(spread){const sP=roadS(P.pos.x,P.pos.z);
  SQUAD.forEach((A,i)=>{const back=3.5+i*2.4,lat=(i%2?1:-1)*(1.6+i*.6)*spread;let g;
    if(sP<4||inPlat(P.pos.x,P.pos.z,2)){g=new THREE.Vector3(P.pos.x+Math.sin(P.yaw)*back+Math.cos(P.yaw)*lat,0,P.pos.z+Math.cos(P.yaw)*back-Math.sin(P.yaw)*lat);
      if(playD(g.x,g.z)>-1)g.set(P.pos.x+Math.sin(P.yaw)*2,0,P.pos.z+Math.cos(P.yaw)*2);}
    else{const sc=sP-back,L=Math.max(1,laneHalf(Math.max(0,sc))-1.6);g=at(Math.max(0,sc),clamp(latOf(P.pos.x,P.pos.z)+lat,-L,L));}
    A.goal=g;});}
// the chamber, once the package is taken: Marsh keeps to the middle of the team
let doorSeen=false,shutT=-1,risers=[],holdT=0,hold=null;

/* ---------- the director: what each phase does every frame ---------- */
function director(dt){
  phT+=dt;markFoes(markList);markList=[];
  if(!P.alive)wentDown=true;
  const s=roadS(P.pos.x,P.pos.z);
  if(phase==='yard'||phase==='halls'){
    if(encIdx<ENC.length&&s>ENC[encIdx].s-(ENC[encIdx].s<120?75:40)){const e=ENC[encIdx++];e.go();if(e.line){const k='enc'+encIdx;setTimeout(()=>say(k,...e.line),900);}}
    squadFollow(1);P.spawn.copy(at(Math.max(-10,s-24),0));}
  if(phase==='yard'){
    if(s<0)PG.objective('Move up to the facility');else PG.objective('Fight through the yard to the gate');
    WP=s<60?at(S_GATE-30,0).setY(3):null;
    if(phT>4)say('y0','Sergeant Marsh','Quiet landing. That won’t last.');
    if(s>8)say('y1','Ensign Landry','Pathfinder, overhead and holding. I can’t come lower with those spires lit, Captain. Call it when you want out.');
    if(s>S_GATE-22){const left=ENEMIES.filter(E=>!E.H.dead&&roadS(E.pos.x,E.pos.z)<S_GATE+2&&roadS(E.pos.x,E.pos.z)>S_GATE-60);
      if(left.length&&left.length<=3)markList=left.map(E=>E.pos.clone().setY(E.pos.y+2.2));
      if(!left.length||charge){if(gateStep(dt)){setPhase('halls');setTimeout(()=>PG.say('Okafor','Gate’s down. We’re in.'),1600);}}
      else PG.objective('Clear the gate · '+left.length+' left');}}
  else if(phase==='halls'){
    PG.objective(s<S_OLD?'Push into the facility':'Find the vault');WP=s>S_OLD-6?DOOR.p.clone().setY(4):null;
    if(s>S_HOST+18)say('h1','Thorne','Schematics put the vault three hundred metres in, Captain. Straight through.');
    if(s>S_HALL1-10)say('h2','Sergeant Marsh','These walls aren’t Host. Look at the joins.',null,6);
    if(s>S_HALL1+4)say('h3','Okafor','There aren’t any.');
    if(s>S_OLD+22)say('h4','Thorne','Captain... the schematics end here.');
    // Oct 22 foreshadowing: the Host were studying the object, not storing it (its function stays unsaid)
    if(s>S_DOOR-24)say('h5','Thorne','Scan rigs. Sample racks. They weren’t storing something down here, Captain. They were studying it.',null,6);
    if(s>S_DOOR-14&&!doorSeen){doorSeen=true;setPhase('doorcut');WP=null;doorScene();}}
  else if(phase==='extract'){
    PG.objective(MARSH.H.dead&&CASE.g.visible?'Marsh is down with the package · get to him':'Get the package to the hangar');WP=MARSH.H.dead?MARSH.pos.clone().setY(2.4):at(S_HANGAR+6,0).setY(PLAT_Y+3);
    squadFollow(.8);P.spawn.copy(at(Math.max(S_SHUT+4,s-20),0));
    // the doors slam behind you once you're through
    if(shutT<0&&s>S_SHUT+5){shutT=0;barrier('shutter').open=false;SHUTTER.drop=true;say('x2','Okafor','Doors are sealing behind us! Only way is up!','alert');
      for(const A of SQUAD)if(roadS(A.pos.x,A.pos.z)<S_SHUT+1){const p=at(S_SHUT+3,R(-2,2));A.pos.set(p.x,p.y,p.z);}}
    // floor guns rise out of the ramp
    if(!risers.length&&s>S_SHUT+10){for(const [rs,lat] of[[388,-3],[418,2.5]]){const p=at(rs,lat),c=at(rs-30,0),Tt=addTurret(p.x,p.z,p.y,Math.atan2(-(c.x-p.x),-(c.z-p.z)),'Floor gun');Tt.g.position.y=p.y-2.6;risers.push({Tt,y:p.y,t:0});}
      say('x3','Sergeant Marsh','Floor guns! They’re waking the whole place up!','alert');}
    for(const Rs of risers){Rs.t+=dt;Rs.Tt.g.position.y=Rs.y-2.6*(1-sstep(0,2,Rs.t));}
    // the Host come down the ramp at you, and up behind before the doors close
    holdT-=dt;if(holdT<=0&&phT<80){holdT=R(6,9)/OD.rof;const n=phT<20?2:3;for(let k=0;k<n;k++){const p=at(clamp(s+R(30,45),S_SHUT+8,S_HANGAR-2),R(-3,3));spawnTrooper(p.x,p.z,{hold:R(10,18)});}}
    if(phT>3)say('x1','Ensign Landry','Captain, the whole moon just lit up down there. What did you do?','alert');
    if(phT>9)say('x1b','Ensign Landry','Copy, east face, the hangar. I’ll find a way in. Keep moving.');
    if(MARSH.H.dead&&CASE.g.visible)markList=[MARSH.pos.clone().setY(2.6)];
    if(inPlat(P.pos.x,P.pos.z,-2)&&!MARSH.H.dead){setPhase('gunshipcut');WP=null;gunshipScene();}}
  else if(phase==='hold'){
    hold.t-=dt;PG.objective(hold.t>0?'Hold the deck · dropship in '+Math.ceil(hold.t)+' s':'Board the dropship');P.spawn.set(PLAT.x-10,PLAT_Y,PLAT.z);
    squadFollow(1.4);updateHold(dt);
    for(const [t,who,txt,tone] of HOLD_RADIO)if(phT>t)say('hr'+t,who,txt,tone);
    if(hold.t<=0){setPhase('board');banner('The dropship is in · get aboard','alert');}}
  else if(phase==='board'){
    updateHold(dt,true);PG.objective('Board the dropship');const B=new THREE.Vector3(PLAT.x+PLAT.r-1.5,PLAT_Y,PLAT.z);WP=B.clone().setY(PLAT_Y+2.5);
    SQUAD.forEach((A,i)=>{A.goal=B.clone().add(_v.set(-2-i*1.5,0,(i-1)*2.5));});
    say('b1','Ensign Landry','Ramp’s down! Get on, get on!','alert');
    const near=P.alive&&Math.hypot(P.pos.x-B.x,P.pos.z-B.z)<5;onUse=near?()=>{onUse=null;setPhase('endcut');endingScene();}:null;
    if(near){board.t+=dt;if(board.t>.5&&onUse){onUse();return;}if(!coarse)banner('Boarding · or press E');}else board.t=0;}
}
const board={t:0};
const HOLD_RADIO=[
  [2,'Ensign Landry','Captain, I see your beacon. Forty seconds. That gunship is circling you, so am I.','alert'],
  [14,'Sergeant Marsh','More of them coming up the ramp!','alert'],
  [24,'Ensign Landry','I can’t get a lock on that thing. It’s too big, Captain. I’m coming in under it.'],
  [34,'Okafor','Captain, the case. It’s getting warm.']];

/* ---------- the shutter that slams behind you on the ramp ---------- */
const SHUTTER=(()=>{const p=at(S_SHUT,0),n=roadN(S_SHUT),g=new THREE.Group();g.position.set(p.x,7,p.z);g.rotation.y=Math.atan2(n.z,-n.x);scene.add(g);
  const m=new THREE.Mesh(boxUV(12,7,.8,3),hostMat);m.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(m.geometry.attributes.position.count*3).fill(.2),3));m.position.y=3.5;m.castShadow=true;g.add(m);
  const s=new THREE.Mesh(new THREE.BoxGeometry(11.6,.12,.85),new THREE.MeshBasicMaterial({color:C(0xff3a2a).multiplyScalar(2),toneMapped:false}));s.position.y=.4;g.add(s);
  return{g,drop:false,y:7};})();
function updateShutter(dt){if(!SHUTTER.drop||SHUTTER.y<=0)return;SHUTTER.y=Math.max(0,SHUTTER.y-dt*14);SHUTTER.g.position.y=SHUTTER.y;if(SHUTTER.y<=0){boom(SHUTTER.g.position.clone().setY(.5),5,0xffc0a0,.4);if(typeof sfx!=='undefined')sfx.collapse(SHUTTER.g.position);}}

/* ---------- the gunship and the hold on the deck ---------- */
let GUNSHIP=null,PICKUP=null;
function makeGunship(){const g=new THREE.Group(),K=SHIPKIT.voidclass();const a=new THREE.Mesh(K.geo,fleetHullMat(panelTex)),b=new THREE.Mesh(K.glowGeo,fleetGlowMat(HOST_GLOW,2.2));g.add(a,b);   // a Host hull: the Heralds' Harrower would say the wrong thing about who chased them
  K.geo.computeBoundingBox();const L=K.geo.boundingBox.max.z-K.geo.boundingBox.min.z;g.scale.setScalar(70/L);scene.add(g);MODELS.swapShip(g,'voidclass',{ref:K.geo,hide:[a,b]});return g;}
// the Pathfinder's dropship: the one that put the team down and comes back for them. Built around the drop bay's own coordinates
// (bay floor at y 0, nose toward -z, the rear ramp at z +7.2), so the bay set (js/pathfinder/03-sets.js) sits inside it. About 28 m
function makeDropship(){const g=new THREE.Group(),m=new Merger(),gl=new Merger(),hc=C(0x8e96a2),dk=C(0x2c3340),bl=C(0x2a5a96),gd=C(0xd9b25a);
  m.add(boxUV(9.6,5.8,22,3),M(0,1.8,-1.6),hc);m.add(boxUV(7.6,1.4,20,3),M(0,5.2,-1),dk);
  const nose=new THREE.CylinderGeometry(.8,4.6,6,4,1);nose.rotateY(Math.PI/4);nose.rotateX(-Math.PI/2);nose.scale(1,.75,1);m.add(nose,M(0,1.9,-15.6),hc);
  gl.add(new THREE.BoxGeometry(4.2,.9,2.4),M(0,3.4,-13.6,-.35,0,0),C(0x9ff0ff));
  for(const s of[-1,1]){m.add(boxUV(.2,1.1,21,3),M(s*4.85,2.4,-1.6),bl);m.add(boxUV(.22,.25,21,3),M(s*4.86,3.1,-1.6),gd);m.add(boxUV(4.4,.5,7,3),M(s*6.8,3,-3),dk);
    for(const z of[-6,4]){m.add(boxUV(2.6,2.6,6,3),M(s*7.2,1.4,z),dk);m.add(cylZ(1.1,1.2,1.2,10),M(s*7.2,1.4,z+3.4),hc);gl.add(new THREE.CircleGeometry(.9,12),M(s*7.2,1.4,z+4.05),C(0x7fe6ff));}}
  const geo=m.build();g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.45,metalness:.55})),new THREE.Mesh(gl.build(),new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)})));
  MODELS.swapShip(g,'dropship',{ref:geo,glow:.1});scene.add(g);g.userData.ref=geo;return g;}
// the Pathfinder herself: a Vanguard-class scout (Bryce's vanguard model), about 90 m
function makePathfinder(){const g=new THREE.Group();const hull=new Merger(),gl=new Merger(),hc=C(0x8e96a2),dk=C(0x2c3340),bl=C(0x2a5a96),gd=C(0xd9b25a);
  hull.add(boxUV(14,9,80,4),M(0,0,0),hc);hull.add(boxUV(10,4,70,4),M(0,6,2),dk);hull.add(new THREE.ConeGeometry(7,18,4).rotateX(-Math.PI/2).rotateZ(Math.PI/4),M(0,0,-49),hc);
  for(const s of[-1,1]){hull.add(boxUV(6,5,30,4),M(s*11,-1,18),dk);hull.add(boxUV(.3,1.2,70,4),M(s*7.1,1,0),bl);hull.add(boxUV(.3,.3,70,4),M(s*7.2,2.2,0),gd);gl.add(new THREE.CircleGeometry(2.2,12),M(s*11,-1,33.1),C(0x8ff0ff));}
  gl.add(new THREE.BoxGeometry(8,1.2,.2),M(0,2.2,-40.2,-.4,0,0),C(0x9ff0ff));
  const geo=hull.build();g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.45,metalness:.55})),new THREE.Mesh(gl.build(),new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)})));
  MODELS.swapShip(g,'vanguard',{ref:geo,glow:.12});scene.add(g);g.userData.ref=geo;return g;}
const TELE=[];   // where the gunship's guns are about to land: a ring on the deck, then the hit
const teleMat=new THREE.MeshBasicMaterial({color:C(0xff4a3a).multiplyScalar(2),transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
function strafe(){const a=R(0,6.28),r=R(0,PLAT.r-4),x=PLAT.x+Math.cos(a)*r*.6+(P.alive?P.pos.x-PLAT.x:0)*.6,z=PLAT.z+Math.sin(a)*r*.6+(P.alive?P.pos.z-PLAT.z:0)*.6;
  const m=new THREE.Mesh(new THREE.RingGeometry(2.6,3.2,32),teleMat);m.rotation.x=-Math.PI/2;m.position.set(x,PLAT_Y+.06,z);scene.add(m);TELE.push({m,x,z,t:1.6});}
function updateHold(dt,calm){
  hold.gt+=dt*.22;const gs=GUNSHIP;if(gs){gs.visible=true;const a=hold.gt,cx=PLAT.x+40,cz=PLAT.z;gs.position.set(cx+Math.cos(a)*110,PLAT_Y+46+Math.sin(a*2)*6,cz+Math.sin(a)*130);
    gs.lookAt(cx+Math.cos(a+.1)*110,gs.position.y,cz+Math.sin(a+.1)*130);gs.rotateY(Math.PI);gs.rotateZ(-.25);
    hold.fire-=dt;if(!calm&&hold.fire<=0){hold.fire=R(3.5,5.5)/OD.rof;strafe();}}
  for(let i=TELE.length-1;i>=0;i--){const T0=TELE[i];T0.t-=dt;T0.m.material.opacity=.3+.5*Math.abs(Math.sin(T0.t*12));
    if(T0.t<=0){scene.remove(T0.m);TELE.splice(i,1);const p=new THREE.Vector3(T0.x,PLAT_Y+.3,T0.z);if(gs)fire(gs.position.clone(),p,260,'heavy',()=>{});
      setTimeout(()=>{boom(p,8,0xd8a0ff,.6);boom(p,5,0xfff0d0,.3);puff(p,4,2);if(typeof sfx!=='undefined')sfx.blast(p);
        if(P.alive&&Math.hypot(P.pos.x-T0.x,P.pos.z-T0.z)<3.6)hurtPlayer(35);for(const A of SQUAD)if(Math.hypot(A.pos.x-T0.x,A.pos.z-T0.z)<3.4)hurtAlly(A,30);},180);}}
  // the Host keep coming up the ramp
  if(!calm){hold.sp-=dt;if(hold.sp<=0&&hold.t>6){hold.sp=R(7,10)/OD.rof;for(let k=0;k<2+(OD.n||0);k++){const p=at(S_HANGAR-R(8,18),R(-3,3));spawnTrooper(p.x,p.z,{hold:R(8,14)});}}}
  // the Pathfinder: out east, closing, then in beside the open edge with her ramp down
  if(PICKUP&&!hold.noPF){const u=1-clamp(hold.t/hold.max,0,1),far=new THREE.Vector3(PLAT.x+700,PLAT_Y+220,PLAT.z+500),near=new THREE.Vector3(PLAT.x+PLAT.r+8.6,PLAT_Y+.3,PLAT.z);
    PICKUP.position.lerpVectors(far,near,easeIO(Math.min(1,u*1.05)));PICKUP.rotation.set(0,-Math.PI/2+(1-easeIO(u))*1.2,(1-u)*.3);PICKUP.visible=true;
    if(RAMP)RAMP.visible=u>=1;}}
let RAMP=null;
function startHold(){hold={t:45,max:45,gt:0,fire:4,sp:3};blackout=0;if(!GUNSHIP)GUNSHIP=makeGunship();if(!PICKUP)PICKUP=makeDropship();
  if(!RAMP){RAMP=new THREE.Mesh(boxUV(2.4,.3,5,2),new THREE.MeshStandardMaterial({map:panelTex,color:C(0x6a7280),roughness:.5,metalness:.5}));RAMP.position.set(PLAT.x+PLAT.r+.6,PLAT_Y+.2,PLAT.z);scene.add(RAMP);RAMP.visible=false;}
  for(const E of ENEMIES)if(!E.H.dead&&roadS(E.pos.x,E.pos.z)<S_SHUT){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  setPhase('hold');banner('Hold the deck','alert');}

/* ---------- in-chapter cutscenes: the door and the chamber; the gunship ---------- */
let blackout=0;const BASE={hemi:hemi.intensity,art:ART.light.intensity};
function applyBlackout(){const b=blackout;if(b<=0&&!applyBlackout.was)return;applyBlackout.was=b>0;
  hemi.intensity=(LOOKS[lookName]||LOOKS.moon).hemiI*(1-b*.92);helmLamp.intensity*=1-b;ART.light.intensity=BASE.art*(1-b)+(ART.taken?0:0);goldGlow.opacity=.85*(1-b);
  if(!alarmOn)stripMat.color.setRGB(1.4*(1-b),1.4*(1-b),1.4*(1-b));purpleGlow.color.copy(C(HOST_GLOW)).multiplyScalar(1.7*(1-b*.95));ART.halo.material.opacity=.6*(1-b);}
// the scanner Okafor holds up: a little panel of light that fills with nonsense
const SCAN=(()=>{const c=document.createElement('canvas');c.width=128;c.height=96;const x=c.getContext('2d'),t=new THREE.CanvasTexture(c);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.55,.4),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:.9,toneMapped:false,side:THREE.DoubleSide,depthWrite:false}));m.visible=false;scene.add(m);
  const draw=(T,g)=>{x.fillStyle='rgba(4,16,28,.9)';x.fillRect(0,0,128,96);x.strokeStyle='#7fe3ff';x.strokeRect(2,2,124,92);x.fillStyle='#7fe3ff';x.font='9px monospace';
    if(g<.5){x.fillText('SCAN · MATERIAL',8,16);x.fillText('DENSITY ......',8,30);x.fillText('ORIGIN .......',8,44);x.beginPath();for(let i=0;i<120;i++)x.lineTo(4+i,70+Math.sin(i*.2+T*4)*8);x.stroke();}
    else{for(let i=0;i<40;i++){x.fillStyle=Math.random()<.5?'#ff5a4a':'#7fe3ff';x.fillRect(Math.random()*128,Math.random()*96,Math.random()*40,2);}x.fillStyle='#ff8a7a';x.fillText('NO MATCH',38,50);x.fillText('NO MATCH',38+Math.random()*4,62);}
    t.needsUpdate=true;};return{m,draw};})();
function doorScene(){
  const D=DOOR.p,n=roadN(S_DOOR),dx=n.z,dz=-n.x;   // (dx,dz): forward, into the chamber
  const fw=(k,lat,y)=>new THREE.Vector3(D.x+dx*k+n.x*lat,y,D.z+dz*k+n.z*lat);
  for(const E of ENEMIES)if(!E.H.dead){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  // everyone in a row at the door; then walking slowly in
  const team=[P,...SQUAD];const startAt=[fw(-6,0,0),fw(-8,-2.4,0),fw(-8,2.4,0),fw(-10,0,0)],inAt=[fw(19,-1.2,0),fw(18,-3.6,0),fw(17.5,2.6,0),fw(16,.4,0)];
  const walk=(u,dt)=>team.forEach((A,i)=>{const H=A.H,p=A.pos||A.H.root.position;p.lerpVectors(startAt[i],inAt[i],u);p.y=0;H.root.rotation.y=Math.atan2(-dx,-dz);poseHuman(H,dt,u>0&&u<1?1.6:0,.4,false);});
  team.forEach((A,i)=>{(A.pos||A.H.root.position).copy(startAt[i]);});
  const faceArt=(H,dt)=>{const p=H.root.position;H.root.rotation.y=Math.atan2(-(CH.x-p.x),-(CH.z-p.z));poseHuman(H,dt,0,.2,false);};
  let alarmT=0,thoom=false;
  const okafor=SQUAD[1].H;
  playCut([
    {dur:5,camAt:(u,t,o)=>o.copy(fw(-12+u*2,1.4,2.2)),lookAt:(u,t,o)=>o.copy(fw(0,0,3.6)),
      say:[[.6,'Captain Rhen','This wasn’t on the schematics.']],fn:(t,dt)=>walk(0,dt)},
    {dur:6,camAt:(u,t,o)=>o.copy(fw(-3,-3.5,1.2)),lookAt:(u,t,o)=>o.copy(fw(2,0,4.2+u)),
      fn:(t,dt)=>{if(t<.1){DOOR.open=.001;if(typeof sfx!=='undefined')sfx.wake();}DOOR.seam.material.opacity=Math.max(0,.8-t*.2);walk(0,dt);}},
    // silence. The chamber, and the thing in the middle of it
    {dur:7,camAt:(u,t,o)=>o.set(CH.x+9-u*2,2.2+u*.8,CH.z+11-u*2),lookAt:(u,t,o)=>o.set(CH.x,2.6,CH.z),fn:(t,dt,u)=>walk(Math.min(1,t/7),dt)},
    {dur:6,camAt:(u,t,o)=>{const p=okafor.root.position;o.set(p.x+1.1,1.9,p.z+1.6);},lookAt:(u,t,o)=>o.set(CH.x,2.6,CH.z),
      say:[[.5,'Sergeant Marsh','What the hell is that?']],
      fn:(t,dt)=>{if(!doorScene.placed){doorScene.placed=1;walk(1,0);}team.forEach(A=>faceArt(A.H,dt));okafor.arms[1].sh.rotation.x=.9;okafor.arms[1].el.rotation.x=-.9;okafor.arms[0].sh.rotation.x=.8;okafor.arms[0].el.rotation.x=-.8;const p=okafor.root.position;
        const fd=Math.hypot(CH.x-p.x,CH.z-p.z)||1;SCAN.m.visible=true;SCAN.m.position.set(p.x+(CH.x-p.x)/fd*.55,1.35,p.z+(CH.z-p.z)/fd*.55);SCAN.m.lookAt(p.x,1.6,p.z);SCAN.draw(t,t>2.5?1:0);}},
    {dur:5,camAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x-1.4,1.85,p.z+1.8-u*.3);},lookAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x+(CH.x-p.x)*.2,1.7,p.z+(CH.z-p.z)*.2);},
      say:[[.4,'Captain Rhen','I don’t know.']],fn:(t,dt)=>{team.forEach(A=>faceArt(A.H,dt));SCAN.draw(t,1);ART.objU.wake.value=Math.min(1,t/5)*.6;}},
    // it notices them: every light goes out. Then the pulse
    {dur:5.4,cam:[[CH.x+6,2.4,CH.z+8]],look:[[CH.x,2.8,CH.z]],
      fn:(t,dt)=>{team.forEach(A=>faceArt(A.H,dt));SCAN.m.visible=false;ART.objU.wake.value=t<1.2?.6+t*.3:0;blackout=t<1.2?Math.min(1,t/.3):1;
        if(t>1.4)ART.objU.wake.value=0;
        if(t>3.4&&!thoom){thoom=true;flashScreen(.5);ART.objU.wake.value=2;const c=new THREE.Vector3(CH.x,2.9,CH.z);boom(c,30,0xc8d4ff,1.2);boom(c,60,0x8a6aff,2);if(typeof sfx!=='undefined'){sfx.spearFire();}shakeT=1.2;}
        if(thoom)ART.objU.wake.value=Math.max(.15,2-(t-3.4)*1.5);}},
    // emergency light; the field failing
    {dur:6,camAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x-1.6,1.8,p.z+2);},lookAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x,1.7,p.z);},
      say:[[.5,'Captain Rhen','Take it.'],[0,'Sergeant Marsh','Command said recover the package.'],[0,'Captain Rhen','That is the package.']],
      fn:(t,dt)=>{team.forEach(A=>faceArt(A.H,dt));blackout=Math.max(.55,1-t*.4);alarmOn=.35;ART.flicker=true;P.H.root.rotation.y=Math.atan2(-(MARSH.pos.x-P.pos.x),-(MARSH.pos.z-P.pos.z));}},
    // one alarm, then another, then dozens. A voice over the speakers in no language anyone knows
    {dur:7,cam:[[CH.x-7,3.4,CH.z+9],[CH.x-5.5,3,CH.z+7.5]],look:[[CH.x,2,CH.z+3]],
      say:[[2.2,'Host speaker','Seraveth. Oruun kael sera. Seraveth vael.','enemy','[Unknown language]']],
      fn:(t,dt)=>{team.forEach(A=>{poseHuman(A.H,dt,0,1,false);});alarmT+=dt;if(alarmT>(t<2?.9:.25)){alarmT=0;if(typeof sfx!=='undefined')sfx.alarm();}alarmOn=Math.min(1,.35+t*.15);blackout=.5;}},
    {dur:4.5,camAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x+1.4,1.8,p.z+1.6);},lookAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x,1.75,p.z);},
      say:[[.3,'Captain Rhen','We’re out of time.','alert']],
      fn:(t,dt)=>{team.forEach(A=>poseHuman(A.H,dt,0,1,false));if(t>1.5&&!ART.taken){ART.taken=true;ART.obj.visible=false;ART.halo.visible=false;ART.motes.visible=false;ART.fieldOn=0;CASE.g.visible=true;ART.light.intensity=0;BASE.art=0;}}},
  ],()=>{if(!ART.taken){ART.taken=true;ART.obj.visible=ART.halo.visible=ART.motes.visible=false;ART.fieldOn=0;CASE.g.visible=true;ART.light.intensity=0;BASE.art=0;}
    SCAN.m.visible=false;DOOR.open=1;updateDoor(.01);barrier('door').open=true;blackout=.35;alarmOn=1;
    P.pos.copy(inAt[0]);P.yaw=Math.atan2(-dx,-dz)+Math.PI;P.yaw=Math.atan2(-(at(S_RAMP,0).x-P.pos.x),-(at(S_RAMP,0).z-P.pos.z));P.pitch=-.05;
    setPhase('extract');banner('Get the package out','alert');PG.objective('Get the package to the hangar');});
}
let shakeT=0;
function gunshipScene(){
  if(!GUNSHIP)GUNSHIP=makeGunship();const gs=GUNSHIP,top=new THREE.Vector3(PLAT.x+6,PLAT_Y+120,PLAT.z-30),mid=new THREE.Vector3(PLAT.x,PLAT_Y+26,PLAT.z),out=new THREE.Vector3(PLAT.x+160,PLAT_Y+60,PLAT.z+90);
  for(const E of ENEMIES)if(!E.H.dead&&roadS(E.pos.x,E.pos.z)>S_HANGAR-30){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  const team=[P,...SQUAD],spots=[[-6,0],[-10,-4],[-10,4],[-13,0]].map(([a,b])=>new THREE.Vector3(PLAT.x+a,PLAT_Y,PLAT.z+b));team.forEach((A,i)=>A.pos.copy(spots[i]));
  let crashed=false;
  playCut([
    {dur:5,cam:[[PLAT.x+PLAT.r-3,PLAT_Y+2.2,PLAT.z+6]],look:[[PLAT.x-12,PLAT_Y+2,PLAT.z]],
      say:[[.4,'Ensign Landry','I have your beacon, Captain. I’m coming round to the east face now.'],[0,'Sergeant Marsh','Contact above! Something big!','alert']],
      fn:(t,dt)=>{team.forEach(A=>{A.H.root.rotation.y=-Math.PI/2;poseHuman(A.H,dt,0,1,false);A.H.aimPitch=.6;});gs.visible=true;gs.position.lerpVectors(top,mid,easeIO(Math.max(0,t-3)/3)*.4);gs.rotation.set(.3,0,0);}},
    {dur:4.5,cam:[[PLAT.x-14,PLAT_Y+1.2,PLAT.z+12]],look:[[PLAT.x+2,PLAT_Y+12,PLAT.z]],
      fn:(t,dt)=>{gs.position.lerpVectors(top,mid,.4+.6*easeIO(Math.min(1,t/1.4)));gs.rotation.set(.3-t*.05,0,Math.sin(t)*.1);
        if(t>1.1&&!crashed){crashed=true;collapseRoof();flashScreen(.4);shakeT=1.6;for(let k=0;k<6;k++)boom(new THREE.Vector3(PLAT.x+R(-14,14),PLAT_Y+15,PLAT.z+R(-14,14)),R(10,18),0xffb070,1);}
        team.forEach((A,i)=>{A.H.crouchTo=t>1.2?1:0;poseHuman(A.H,dt,t>1.2&&t<2.4?4:0,0,t>1.2);if(t>1.2&&t<2.6){const p=A.pos||A.H.root.position;p.x-=dt*3;}});}},
    {dur:6,cam:[[PLAT.x-8,PLAT_Y+2,PLAT.z-14],[PLAT.x-6,PLAT_Y+3,PLAT.z-12]],look:[[PLAT.x+30,PLAT_Y+30,PLAT.z+20]],
      say:[[.5,'Captain Rhen','Landry, the roof’s gone! Come in from the east, low and fast!','alert'],[0,'Ensign Landry','Copy. Forty seconds. Keep them off that deck.','alert']],
      fn:(t,dt)=>{gs.position.lerpVectors(mid,out,easeIO(t/6));gs.lookAt(out.x+40,out.y+10,out.z+30);gs.rotateY(Math.PI);team.forEach(A=>{A.H.crouchTo=0;poseHuman(A.H,dt,0,1,false);});}},
  ],()=>{startHold();});
}

/* ---------- main loop ---------- */
let last=performance.now();
let frameErr=0;function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(!PG.paused){
    if(!SETS.active)director(dt);
    if(CUTS.on)CUTS.update(dt);else if(phase==='dogfight')updateDogfight(dt);else if(phase!=='end'&&phase!=='brief'){stepPlayer(dt);placeCamera();}
    if(!SETS.active){updateEnemies(dt);if(!CUTS.on)updateAllies(dt);updateDrops(dt);updateNades(dt);updateRockets(dt);updateTurrets(dt);updateWall(dt);updateSentry(dt);updateZeal(dt);updatePicks(dt);}
    updateGate(dt);updateDoor(dt);updateRoof(dt);updateShutter(dt);updateArtifact(dt,T);SETS.update(dt,T);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);skyU.uT.value=T;astraeaU.uT.value=T;
    PG.combat(phaseFight());
    if(CASE.g.visible)CASE.h.material.opacity=.4+.3*Math.sin(T*3);
  }else if(phase==='brief'){camera.position.set(60,40,110);camera.lookAt(0,20,-120);}
  if(shakeT>0){shakeT-=dt;camera.position.x+=R(-1,1)*shakeT*.15;camera.position.y+=R(-1,1)*shakeT*.12;}
  if(!SETS.active){updateLights(dt,T,CUTS.on?camera.position:P.pos);applyBlackout();}
  skyFollow();followSun(CUTS.on?camera.position:P.pos);updateDust();updateHud(dt);updateWp();
  renderFrame();
}
PG.briefing({title:'PATHFINDER',text:'Side mission S1 · 08.03.2237. Three nights after the Hollow King walked out of the archive, the Pathfinder followed his trail into the dark. Captain Rhen’s orders: a Host installation on a dead moon, one object, recovered by the Host days ago. Get in. Find it. Get out. Threat level: '+DIFF.name+'.',
  objective:'Land with the strike team and fight up the yard to the gate.',
  pc:[['Mouse','Aim (click to lock, Esc releases)'],['W A S D','Move'],['Shift','Sprint'],['Left click','Fire'],['Right click','Aim down the sights (the Lance has a scope)'],
    ['1 2 3 or wheel','Rifle, Lance, Breaker launcher'],['R','Reload'],['Q','Mobile shield'],['X','Shoulder sentry'],['G or F','Grenade'],['Space','Jump'],['C or Ctrl','Crouch (toggle)'],['Z','Zeal when the meter is full'],['Walk up or E','Plant the charge, board'],['Enter','Skip a cutscene']],
  phone:[['Left thumb','Move (push to the edge to sprint)'],['Right thumb','Aim'],['Double-tap right','Aim down the sights (again to stop)'],['FIRE','Fire (hold) · swipe up off it to throw a grenade'],['Ammo box','Reload (shows the magazine)'],['⇄','Next weapon'],['GEAR','Tap: mobile shield · hold: shoulder sentry'],['NADE','Grenade'],['JUMP · CROUCH','Jump, crouch (toggle)'],['Gold shield','Tap it for Zeal'],['Walk up','Plant the charge, board'],['Skip','Skip a cutscene']],
  onStart:()=>{setPhase('intro');P.input=false;
    // test: pathfinder.html?at=halls|door|extract|hangar|end starts there
    const atq=(location.search.match(/[?&]at=(\w+)/)||[])[1];if(atq){jumpTo(atq);return;}
    const begin=()=>introScene(()=>{setPhase('yard');banner('Move up to the facility');});
    const cp=readCP();if(!cp){begin();return;}
    PG.paused=true;const el=document.createElement('div');el.className='pgend pgbrief';
    el.innerHTML=`<div class="card"><h2>CHECKPOINT</h2><p>You stopped at <b>${CP_NAME[cp.at]}</b>. Pick up there, or start the mission from the beginning.</p><div class="row"><button type="button" class="primary" id="cpGo">Resume</button><button type="button" id="cpNew">Start over</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('#cpGo').addEventListener('click',()=>{el.remove();PG.paused=false;jumpTo(cp.at);});
    el.querySelector('#cpNew').addEventListener('click',()=>{el.remove();PG.paused=false;clearCP();begin();});}});
// jump straight to a stage (checkpoints, and testing)
function jumpTo(atq){P.input=true;encIdx=ENC.length;blowGate();GATE.t=9;for(const L of GATE.leaves){L.L.visible=false;}
  const put=(s,lat)=>{const p=at(s,lat||0);P.pos.copy(p);SQUAD.forEach((A,i)=>{const q=at(s-3-i*2,(i-1)*2);A.pos.copy(q);});P.yaw=Math.atan2(-(at(s+5,0).x-p.x),-(at(s+5,0).z-p.z));};
  if(atq==='halls'){encIdx=3;put(S_GATE+6);setPhase('halls');banner('Checkpoint · inside the gate');return;}
  if(atq==='door'){encIdx=ENC.length;put(S_DOOR-18);setPhase('halls');return;}
  DOOR.open=1;updateDoor(.01);barrier('door').open=true;ART.taken=true;ART.obj.visible=ART.halo.visible=ART.motes.visible=false;ART.fieldOn=0;CASE.g.visible=true;BASE.art=0;ART.light.intensity=0;alarmOn=1;blackout=.35;doorSeen=true;
  if(atq==='extract'){put(S_RAMP-6);setPhase('extract');banner('Checkpoint · the way out','alert');return;}
  shutT=0;barrier('shutter').open=false;SHUTTER.drop=true;SHUTTER.y=.01;collapseRoof();for(const Pp of ROOF.parts)if(Pp.falling)Pp.delay=0;
  P.pos.set(PLAT.x-6,PLAT_Y,PLAT.z);SQUAD.forEach((A,i)=>A.pos.set(PLAT.x-10,PLAT_Y,PLAT.z+(i-1)*3));
  if(atq==='end'){startHold();hold.t=.1;return;}
  startHold();banner('Checkpoint · the hangar','alert');}
// (the loop starts at the end of js/pathfinder/03-sets.js, once everything it calls exists)
