/* Elyra · Origin — the story, phase by phase:
   intro cutscene (the Keepers land at the Hollow, knowing it's a trap) → advance up the canyon → the Hollow King at his gate (cutscene)
   → fall back to the ships → hold the landing zone while every ship powers up (the Pathfinder news comes in over the radio)
   → board your interceptor → escape cutscene → Tide City, two days later: contact with the Pathfinder is lost. On to Astraea.
   The stolen treasure is called "the Codex" here (a placeholder name, easy to change in this file). */

/* ---------- cutscenes: camera moves between keyframes, letterbox, captions, a skip button ---------- */
const CUT={on:false,shots:null,i:0,t:0,done:null,said:new Set()};
const _c0=new THREE.Vector3(),_c1=new THREE.Vector3(),_l0=new THREE.Vector3(),_l1=new THREE.Vector3();
const easeIO=k=>{k=clamp(k,0,1);return k*k*(3-2*k);};
function playCut(shots,done){CUT.on=true;CUT.shots=shots;CUT.i=0;CUT.t=0;CUT.done=done;CUT.said=new Set();P.input=false;fireHeld=false;
  document.body.classList.add('incut');$('cut').classList.add('on');try{if(document.exitPointerLock)document.exitPointerLock();}catch(_){}showCap(shots[0]);}
function showCap(S){const c=$('cap');if(S&&S.cap){c.innerHTML=(S.small?`<small>${S.small}</small>`:'')+S.cap;c.classList.add('on');}else c.classList.remove('on');}
function endCut(skipped){if(!CUT.on)return;CUT.on=false;$('cut').classList.remove('on');$('cap').classList.remove('on');document.body.classList.remove('incut');P.input=true;
  if(skipped&&typeof speechSynthesis!=='undefined')try{speechSynthesis.cancel();}catch(_){}
  const d=CUT.done;CUT.done=null;if(d)d(skipped);}
function updateCut(dt){const S=CUT.shots[CUT.i];CUT.t+=dt;const u=easeIO(CUT.t/S.dur);
  _c0.set(...S.cam[0]);_c1.set(...S.cam[1]);_l0.set(...S.look[0]);_l1.set(...(S.look[1]||S.look[0]));
  camera.position.lerpVectors(_c0,_c1,u);camera.lookAt(_l0.lerp(_l1,u));
  for(const [at,who,txt,tone,dur] of S.say||[]){const k=CUT.i+':'+at;if(CUT.t>=at&&!CUT.said.has(k)){CUT.said.add(k);PG.say(who,txt,tone,dur);}}
  if(S.fn)S.fn(CUT.t,dt);
  if(CUT.t>=S.dur){CUT.i++;CUT.t=0;if(CUT.i>=CUT.shots.length)endCut(false);else showCap(CUT.shots[CUT.i]);}}
$('skip').addEventListener('click',()=>endCut(true));
addEventListener('keydown',e=>{if(CUT.on&&(e.code==='Enter'||e.code==='Escape'||e.code==='Space')&&!PG.paused){e.preventDefault();endCut(true);}});

/* ---------- objective marker: a gold diamond over where you need to go ---------- */
const wp=document.createElement('div');wp.className='hud keep';wp.style.cssText='width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid #ffd27a;transform:rotate(45deg);background:rgba(255,210,122,.15);display:none';
const wpLab=document.createElement('div');wpLab.className='hud';wpLab.style.cssText='font:600 10px var(--mono);color:#ffd27a;letter-spacing:.08em;transform:translate(-50%,12px);display:none';
document.body.append(wp,wpLab);let WP=null;
function updateWp(){if(!WP||CUT.on||!P.alive){wp.style.display=wpLab.style.display='none';return;}_v.copy(WP).project(camera);const on=_v.z<1;
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
  const fly=(t,from,to,d0,d1)=>{SHIPS.forEach((S,i)=>{if(S.mine)return;const u=easeIO((t-d0)/(d1-d0));S.g.position.lerpVectors(SHIP_AIR[i],_v.set(S.x,0,S.z),u);
    if(u>.7&&u<1&&rng()<.3)puff(_v.set(S.x+R(-8,8),.5,S.z+R(-8,8)),R(3,6),2.5);});};
  playCut([
    {dur:9,cam:[[150,90,340],[70,55,190]],look:[[0,60,-420],[0,40,-380]],small:'Elyra · the Hollow',cap:'The Hollow King’s mountain',
      say:[[1,'Elias Veyr','Three nights ago the Hollow King walked into the Remnant archive and took the Codex. Every star chart we have. Every world we know.']],fn:t=>fly(t,0,0,1,16)},
    {dur:8,cam:[[-40,6,20],[-30,4,34]],look:[[0,8,70],[0,3,60]],
      say:[[.5,'Keeper Sergeant','And now he invites us to come and collect it. Master, you know this is a trap.'],[5,'Elias Veyr','I know, Sergeant. We go anyway.']],fn:t=>fly(t+9,0,0,1,16)},
    {dur:7,cam:[[0,5,6],[0,30,-210]],look:[[0,12,-150],[0,22,-414]],small:'Level 1',cap:'ORIGIN',
      say:[[2.5,'Lt. Michael','Squad’s formed up. Moving up the road.']],fn:()=>{shipsLanded();}},
  ],()=>{shipsLanded();for(const A of SQUAD)A.on=true;P.pos.set(0,0,22);P.yaw=0;P.pitch=-.05;setPhase('advance');banner('Advance to the Hollow’s gate');});
}

function kingScene(){
  KING.root.visible=true;
  playCut([
    {dur:6,cam:[[0,3,COURT.z+30],[0,4,COURT.z+18]],look:[[0,GATE_H,GATE.z],[0,GATE_H+12,GATE.z]],
      say:[[.6,'The Hollow King','Keepers. You walked my road with your weapons in your hands. You came for your Codex.','enemy',7]],
      fn:t=>{if(t<.1){boom(BALCONY.clone().add(_v.set(0,2,0)),10,HOLLOW_GLOW,1.4);flashScreen(.25);}}},
    {dur:7,cam:[[5,BALCONY.y+3,BALCONY.z+16],[3,BALCONY.y+3.4,BALCONY.z+12]],look:[[0,BALCONY.y+2.8,BALCONY.z]],
      say:[[.4,'The Hollow King','It is no longer here. While you marched, I sent it beyond your sky, to a world where you will follow it.','enemy',7],
           [5.2,'Elias Veyr','Where is it, Hollow?']],fn:t=>{kingGesture=easeIO((t-1)/2);}},
    {dur:7,cam:[[0,9,COURT.z+5],[0,14,COURT.z+42]],look:[[0,GATE_H*.6,GATE.z],[0,12,GATE.z]],
      say:[[.2,'The Hollow King','Empty them.','enemy',3],[4.2,'Keeper Sergeant','It’s a trap! Fall back! Fall back to the ships!','alert',4]],
      fn:t=>{kingGesture=1;if(t>1.2&&!gateOpen){openGate();}}},
  ],()=>{openGate();kingGesture=.3;P.pos.set(0,0,COURT.z+30);P.yaw=Math.PI;setPhase('fallback');banner('It’s a trap · fall back to the ships','alert');});
}
function openGate(){if(gateOpen)return;gateOpen=.001;flashScreen(.3);if(typeof sfx!=='undefined')sfx.horn(_v.set(0,10,GATE.z));
  for(let k=0;k<7;k++)spawnTrooper(R(-6,6),GATE.z+R(4,12));}

function escapeScene(){
  for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(LZ)<70)E.speed*=.5;
  const fighters=[];for(let i=0;i<5;i++){const K=SHIPKIT.wraith(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat()),new THREE.Mesh(K.glow,fleetGlowMat(HOLLOW_GLOW,2)));g.scale.setScalar(.45);g.visible=false;scene.add(g);fighters.push(g);}
  const lift=(t,dt)=>{SHIPS.forEach((S,i)=>{const k=Math.max(0,t-i*.6);S.g.position.y=k*k*1.6;S.g.position.z=S.z+k*k*.6;if(rng()<.4)puff(_v.set(S.x+R(-6,6),.5,S.z+R(-6,6)),R(3,7),2.5);});};
  const shoot=()=>{if(rng()<.15){const S=pick(SHIPS),to=S.g.position.clone().add(_v.set(R(-20,20),R(-8,8),R(-20,20)));fire(_w.set(R(-30,30),GATE_H,GATE.z+10),to,180,'hrifle',q=>boom(q,8,0xd8a0ff,.6));}};
  playCut([
    {dur:6,cam:[[50,8,10],[46,12,18]],look:[[10,6,50],[10,16,55]],say:[[.4,'Keeper Sergeant','Everyone’s aboard! Lantern, Bastion, Mercy, lift, lift, lift!','alert',4]],
      fn:(t,dt)=>{lift(t,dt);shoot();}},
    {dur:7,cam:[[60,70,60],[80,120,160]],look:[[0,60,40],[0,90,120]],
      say:[[.5,'The Hollow King','Go, then. Follow your Codex, Keepers. Wherever it leads, I have walked there first.','enemy',7]],
      fn:(t,dt)=>{lift(t+6,dt);shoot();fighters.forEach((g,i)=>{g.visible=true;g.position.set(-40+i*20+Math.sin(t+i)*6,40+t*8+i*3,-60+t*30);g.lookAt(g.position.x,g.position.y+3,g.position.z+30);
        if(rng()<.05)fire(g.position.clone(),pick(SHIPS).g.position.clone(),160,'hrifle',q=>boom(q,6,0xd8a0ff,.5));});
        if(t>4&&t-dt<=4){boom(fighters[2].position,10,0xfff0c0,.6);boom(fighters[2].position,16,0xff6a1a,1.2);fighters[2].visible=false;}}},
    {dur:6,cam:[[0,160,260],[0,200,380]],look:[[0,150,0],[-200,160,-400]],small:'The Keepers withdraw',cap:'Bound for Tide City',
      fn:(t,dt)=>{lift(t+13,dt);fighters.forEach(g=>g.visible=false);}},
  ],()=>{fighters.forEach(g=>scene.remove(g));ending();});
}
function ending(){
  setPhase('end');P.input=false;$('fade').style.opacity=1;document.body.classList.add('incut');
  const cap=$('cap');$('cut').classList.add('on');$('skip').hidden=true;
  setTimeout(()=>{cap.innerHTML='<small>Two days later</small>Tide City';cap.classList.add('on');},900);
  setTimeout(()=>PG.say('Tide City Command','Master Veyr... we’ve lost contact with the Pathfinder. Her last signal came from orbit over Astraea.','alert',7),2600);
  setTimeout(()=>PG.say('Elias Veyr','Then we go and see. Ready the Vigil and the Covenant. If the Codex is on Astraea, so is the Pathfinder.','',7),9800);
  setTimeout(()=>{if(P.kills>=25)PG.done('okills');if(!wentDown)PG.done('odown');if(!stalled)PG.done('ostall');PG.ach('origin');
    PG.finish({title:'ORIGIN COMPLETE',text:`The Keepers walked into the Hollow King’s trap and walked back out. The Codex is gone, and now the Pathfinder is silent. Troopers down: ${P.kills}. Difficulty: ${DIFF.name}.`,
      buttons:[{text:'Continue to Astraea',href:'space.html',primary:true},{text:'Play again',onClick:()=>location.reload()},{text:'Chapters',href:'index.html'}]});},17000);
}

/* ---------- the director: what each phase does every frame ---------- */
const ADV_SPAWNS=[{at:80,n:3,ahead:55},{at:170,n:4,ahead:55},{at:250,n:4,ahead:50}];let advIdx=0;
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
    if(advIdx<ADV_SPAWNS.length&&s>ADV_SPAWNS[advIdx].at){const A=ADV_SPAWNS[advIdx++];for(let k=0;k<A.n;k++){const p=roadPt(s+A.ahead+k*4);spawnTrooper(p.x+R(-9,9),p.z+R(-4,4),{hold:R(18,30)});}
      if(advIdx===1)say('c1','Keeper Sergeant','Contact! Empty Host on the road!','alert');}
    if(s>40)say('a1','Lt. Michael','Quiet, for a fortress.');if(s>60)say('a2','Elias Veyr','He wants us at his door. Eyes on the ridges, Michael.');
    if(s>215)say('a3','Keeper Sergeant','Gate’s ahead. I don’t like how open that courtyard is.');
    if(Math.hypot(P.pos.x-COURT.x,P.pos.z-COURT.z)<COURT.r-10&&ENEMIES.filter(E=>!E.H.dead).length<=2){setPhase('kingcut');WP=null;kingScene();}
  }
  else if(phase==='fallback'){
    PG.objective('Fall back to the ships');WP=_v.set(LZ.x,3,LZ.z).clone();P.spawn.copy(roadPt(Math.min(ROAD_LEN,s+25)));
    SQUAD.forEach((A,i)=>{const g=roadPt(Math.max(-10,s-6-i*3));A.goal=_w.set(g.x+(i%2?3:-3),0,g.z).clone();});
    spawnT-=dt;if(spawnT<=0&&phT<70){spawnT=R(2.2,3.4)/OD.rof;for(let k=0;k<2;k++)spawnTrooper(R(-6,6),GATE.z+R(6,14),{hold:R(16,26)});}
    if(phT>9&&phT<9.1+dt){const p=roadPt(Math.max(0,s-60));for(let k=0;k<3;k++)spawnTrooper(p.x+R(-8,8),p.z+R(-4,4),{hold:R(12,20)});say('f0','Keeper Sergeant','More of them ahead! They came down the walls!','alert');}
    if(phT>3)say('f1','Elias Veyr','All ships, this is Veyr. Spin up every engine. We’re leaving.');
    if(phT>7)say('f2','Fleet Engineer','Engines are cold, Master! You’ll have to give us time!');
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
      if(near)say('stall'+S.name+Math.floor(phT/12),'Fleet Engineer',S.mine?'They’re on your interceptor, Lieutenant!':'They’re on the '+S.name+'! I can’t work with them on the ramp!','alert',4);}
    drawShips();
    defSpawn-=dt;if(defSpawn<=0&&phT<70){defSpawn=R(6,8.5)/OD.rof;const n=phT<20?3:4;for(let k=0;k<n;k++){const p=roadPt(R(30,70));spawnTrooper(p.x+R(-8,8),p.z,{hold:R(10,20)});}}
    if(dropIdx<3&&phT>[12,30,48][dropIdx]){launchDrop(LANDINGS[dropIdx]);dropIdx++;say('d'+dropIdx,'Keeper Sergeant',['Dropship! Coming in on the west flank!','Another dropship, east side!','Dropship right on the canyon mouth! Bring it down!'][dropIdx-1],'alert',4);}
    for(const [t,who,txt,tone,dur] of DEF_RADIO)if(phT>t)say('dr'+t,who,txt,tone,dur);
    // the colonists and civilians run for the Mercy's ramp
    CIVS.forEach((A,i)=>{if(!A.on)return;const S=SHIPS[i%3];A.goal=_w.set(S.x,0,S.z+13).clone();if(A.pos.distanceTo(A.goal)<2.5)A.on=false;});
    if(allReady){setPhase('board');banner('All ships ready · board your interceptor');}
  }
  else if(phase==='board'){
    PG.objective('Board your interceptor');WP=SHIP_SEAT.clone().setY(3);drawShips();
    const near=P.alive&&P.pos.distanceTo(SHIP_SEAT)<5;onUse=near?()=>{onUse=null;setPhase('escapecut');escapeScene();}:null;
    if(near&&!coarse)banner('Press E to board');
    say('b1','Keeper Sergeant','Ships are hot! Get aboard, Lieutenant, we’ll cover you!','alert');
  }
}
const DEF_RADIO=[
  [3,'Fleet Engineer','Lantern’s engines are warming. Keep them off the ramps!'],
  [14,'Elias Veyr','Tide City, this is Veyr. The Codex is not here. He has sent it off-world.'],
  [23,'Tide City Command','Master, the Pathfinder left orbit this morning on the Codex’s trail. Last heading: a world the old charts call Astraea.'],
  [33,'Elias Veyr','Then the Pathfinder may be the only ship that can catch it. Tell her captain to report every hour, without fail.'],
  [44,'The Hollow King','Run, little Keepers. Every road you take, I have already walked.','enemy',6],
  [58,'Fleet Engineer','Last of the dropships is nearly there! Lieutenant, your interceptor is next!'],
];
function startDefend(){
  for(const E of ENEMIES)if(!E.H.dead&&E.pos.z<-200){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
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
    if(CUT.on)updateCut(dt);else if(phase!=='end'&&phase!=='brief'){stepPlayer(dt);placeCamera();}
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
