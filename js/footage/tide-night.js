/* Elyra · Recovered Footage 08 · Night Market (Nov 17 2026, Bryce: the Halo 3: ODST idea, the same city by day and by night).
   A Keeper's helmet camera, the night after the battle for Tide City, in the rain. Open exploration the ODST way (Nov 17, Bryce: "more
   of an open exploration map like Halo 3: ODST", about eight times Midnight Market): the market in the middle, roofs on top and the
   street under them, and round it the lower streets, the plaza, the docks 9 m down and the heights on their terraces, joined by
   stairs and two lifts (js/footage/night-city-world.js). Five Keeper recordings to find, one in each district, in any order, each
   under a beam of amber light; each district's Hollow patrol comes in the first time you get near it. All five found, the Hollow move
   on the plaza: hold the monument. Then the camera turns to the Spear and the signal goes.
   The Hollow (js/origin/03-play.js) walk the ground and the stairs between levels (a lattice of the ground-level spots only, below);
   the roofs are yours, and theirs only where a rifleman is put up there. If it plays well, this goes into the rebuilt Tide City level
   (docs: "ELYRA Level Plan · Decided: Tide City redo"): the day battle there, this at night. Lines are placeholders. */
let phase='brief';
function phaseFight(){return phase==='play';}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z),_fa=new THREE.Vector3();
const CFG={id:'tidenight',name:'NIGHT MARKET',sub:'Recovered footage · Tide City, the night after'};
PG.init(CFG.id,{challenges:[
  {id:'ftfound',text:'Recover all five recordings',pts:2000,goal:5},
  {id:'ftkills',text:'Down 25 of the Hollow',pts:2000,goal:25},
  {id:'ftclear',text:'Hold the plaza',pts:3000},
]});
{const _p=PG.prog;PG.prog=(id,n)=>_p(id==='okills'?'ftkills':id,n);}

/* ---------- the Hollow's way round: the street-level spots of the bots' lattice, and a route to any of them ---------- */
const NAVG=(()=>{const N=GS.nav,idx=[],map=new Int32Array(N.nodes.length).fill(-1);
  N.nodes.forEach((n,k)=>{if(n.y-CITY.ground(n.x,n.z)<.6){map[k]=idx.length;idx.push(k);}});
  const nodes=idx.map(k=>N.nodes[k]),nb=idx.map(k=>N.nodes[k].nb.map(b=>map[b]).filter(b=>b>=0));
  const BK={},bk=(x,z)=>Math.floor(x/4)+','+Math.floor(z/4);nodes.forEach((n,i)=>{(BK[bk(n.x,n.z)]||(BK[bk(n.x,n.z)]=[])).push(i);});
  function nearest(x,z){const gx=Math.floor(x/4),gz=Math.floor(z/4);let best=-1,bd=1e9;
    for(let r=1;r<=6&&best<0;r++)for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++){const L=BK[(gx+i)+','+(gz+j)];if(L)for(const k of L){const n=nodes[k],d=Math.hypot(n.x-x,n.z-z);if(d<bd){bd=d;best=k;}}}
    return best;}
  // a route to a spot: one walk out from it over the lattice gives every spot its next step toward it (kept for the last few spots asked)
  const memo=new Map();
  function toward(t){let P=memo.get(t);if(P)return P;P=new Int32Array(nodes.length).fill(-1);P[t]=t;const q=[t];let h=0;
    while(h<q.length){const a=q[h++];for(const b of nb[a])if(P[b]<0){P[b]=a;q.push(b);}}
    if(memo.size>48)memo.delete(memo.keys().next().value);memo.set(t,P);return P;}
  return{nodes,nb,nearest,toward};})();
navToward=function(px,pz,tx,tz,out){const N=GS.nav,d=Math.hypot(tx-px,tz-pz);
  if(d<120&&N.clear(px,pz,tx,tz,.5))return out.set(tx-px,0,tz-pz);
  const a=NAVG.nearest(px,pz),b=NAVG.nearest(tx,tz);if(a<0||b<0)return out.set(tx-px,0,tz-pz);
  if(a===b){const n=NAVG.nodes[a];return Math.hypot(n.x-px,n.z-pz)>4?out.set(n.x-px,0,n.z-pz):out.set(tx-px,0,tz-pz);}
  const nx=NAVG.toward(b)[a];if(nx<0)return out.set(tx-px,0,tz-pz);
  const A=NAVG.nodes[a],Nn=NAVG.nodes[nx];
  if(Math.hypot(A.x-px,A.z-pz)<3||N.clear(px,pz,Nn.x,Nn.z,.5))return out.set(Nn.x-px,0,Nn.z-pz);
  return out.set(A.x-px,0,A.z-pz);};
const USED=new Set();

/* ---------- the Spear: far off to the east over the roofs, the one thing you can always find ---------- */
let SPR=null;
if(typeof SPEAR_KIT!=='undefined'){try{SPR=SPEAR_KIT.build({C});SPR.group.position.set(1350,-30,-120);SPR.group.scale.setScalar(.72);
  SPR.group.traverse(o=>{if(o.material){for(const m of[].concat(o.material)){m.fog=false;if(m.color&&!m.emissive)m.color.multiplyScalar(.55);}}o.castShadow=false;o.receiveShadow=false;});
  SPR.group.userData.dyn=1;scene.add(SPR.group);}catch(e){console.warn('spear',e);SPR=null;}}

/* ---------- the footage: the recorder's line along the bottom, the title card, the signal going at the end ---------- */
const FTG=(()=>{const css=document.createElement('style');css.textContent=`
#ftrec{position:fixed;z-index:3;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);transform:translateX(-50%);pointer-events:none;white-space:nowrap;
  font:600 10px 'VG Label','Arial Narrow',sans-serif;letter-spacing:.18em;color:rgba(225,232,228,.62);text-shadow:0 1px 3px #000}
#ftrec i{font-style:normal;color:#e8463c;animation:ftb 1.4s steps(2) infinite}@keyframes ftb{50%{opacity:.15}}
#fttitle{position:fixed;inset:0;z-index:60;background:#000;display:grid;place-items:center;align-content:center;text-align:center;gap:14px;transition:opacity 1.6s;pointer-events:none;padding:0 6vw}
#fttitle .k{font:600 clamp(11px,1.6vw,14px) 'VG Label','Arial Narrow',sans-serif;letter-spacing:.3em;color:#e8463c}
#fttitle .t{font:400 clamp(24px,5vw,52px)/1.2 'VG Title','Arial Narrow',sans-serif;letter-spacing:.3em;color:#e6e4df}
#fttitle .s{font:400 clamp(10px,1.4vw,12px) 'VG Label','Arial Narrow',sans-serif;letter-spacing:.24em;color:rgba(230,228,223,.5)}
#ftdate{position:fixed;z-index:4;right:calc(env(safe-area-inset-right,0px) + 18px);bottom:calc(env(safe-area-inset-bottom,0px) + 30px);text-align:right;pointer-events:none;opacity:0;transition:opacity 1.2s;
  font:500 11px/1.6 'VG Label','Arial Narrow',sans-serif;letter-spacing:.16em;color:rgba(230,228,223,.75);text-shadow:0 1px 3px #000}
#ftdate b{display:block;font:400 15px 'VG Title','Arial Narrow',sans-serif;letter-spacing:.2em;color:#e6e4df}
#ftlost{position:fixed;inset:0;z-index:61;pointer-events:none;opacity:0;display:grid;place-items:center;background:#000;
  font:600 clamp(14px,2.4vw,22px) 'VG Label','Arial Narrow',sans-serif;letter-spacing:.34em;color:#e8463c}
#ftlost.on{opacity:1}#ftlost .x{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(232,70,60,.16) 0 3px,transparent 3px 9px);animation:ftx .09s steps(2) infinite}
@keyframes ftx{50%{transform:translateX(12px)}}
@media (pointer:coarse){#ftrec{bottom:calc(env(safe-area-inset-bottom,0px) + 4px);font-size:8px}#ftdate{bottom:auto;top:calc(env(safe-area-inset-top,0px) + 70px)}}`;
  document.head.appendChild(css);
  const rec=document.createElement('div');rec.id='ftrec';rec.hidden=true;document.body.appendChild(rec);
  let t0=23*3600+52*60+14,acc=0;
  const pad=n=>String(n).padStart(2,'0'),clock=s=>pad(Math.floor(s/3600)%24)+':'+pad(Math.floor(s/60)%60)+':'+pad(Math.floor(s)%60);
  return{
    title(done){const d=document.createElement('div');d.id='fttitle';d.innerHTML=`<div class="k">● RECOVERED FOOTAGE · 08</div><div class="t">NIGHT MARKET</div><div class="s">HELMET CAMERA · FIRETEAM LANTERN · TIDE CITY</div>`;
      document.body.appendChild(d);let gone=false;const go=()=>{if(gone)return;gone=true;d.style.opacity=0;setTimeout(()=>d.remove(),1700);done();};
      setTimeout(go,4200);setTimeout(()=>{addEventListener('keydown',go,{once:true});addEventListener('pointerdown',go,{once:true});},600);},
    date(){const d=document.createElement('div');d.id='ftdate';d.innerHTML='<b>TIDE CITY · THE MARKET</b>16.03.2237 · 23:52<br>THE NIGHT AFTER';document.body.appendChild(d);
      requestAnimationFrame(()=>d.style.opacity=1);setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),1300);},10000);},
    show(on){rec.hidden=!on;},
    tick(dt){acc+=dt;if(rec.hidden)return;const s=clock(t0+acc);if(rec.dataset.s!==s){rec.dataset.s=s;rec.innerHTML='<i>●</i> REC  '+s+'  ·  CAM · LANTERN TWO';}},
    lost(done){const d=document.createElement('div');d.id='ftlost';d.innerHTML='<div class="x"></div>SIGNAL LOST';document.body.appendChild(d);
      if(typeof sfx!=='undefined'&&sfx.glitch)try{sfx.glitch();}catch(_){}
      setTimeout(()=>d.classList.add('on'),60);setTimeout(()=>{rec.hidden=true;done();},2600);}};})();

/* ---------- the city, the ODST way: five recordings to find, one in each district, in any order; the Hollow's patrols in each ----------
   Each recording is a data pad where a Keeper fell, with a beam of amber light over it you can see across the city (fog or not).
   Walk up to it and it plays. A district's patrol comes in the first time you get near it. All five found, the Hollow move on the
   plaza: hold it till the last of them are down. Lines are placeholders (Bryce writes the script). */
const CLUES=[
  {d:'market',x:11.5,z:-8,name:'The club',lines:[['Keeper (recording)','If anyone finds this: we held the club door for an hour. They never came in. They just stood in the street, looking up at the Spear.',8]]},
  {d:'lower',x:-122,z:30,name:'The fountain',lines:[['Keeper (recording)','Civilians are through the square and down to the docks. Whoever\'s left: the transports are leaving from the piers. Don\'t wait for us.',8]]},
  {d:'plaza',x:120,z:33,name:'The dropship',lines:[['Pilot (recording)','Hit from above, not the ground. Something in the sky over the Spear. We were bringing ammunition to the plaza and never got there.',8]]},
  {d:'docksW',x:-34,z:105,name:'The pier',lines:[['Keeper (recording)','Last transport\'s gone. Forty on board, maybe more. I\'m staying with the lift. Somebody has to send it back up.',8]]},
  {d:'heightsE',x:104,z:-112,name:'The lookout',lines:[['Spotter (recording)','From up here you can see the whole bay. The Spear\'s lit end to end. Every one of their ships turned toward it at once.',8]]}];
const SAY_FOUND=['Lantern Lead','Got it. That\'s {n} of five. Keep looking, Two.'];
let found=0,finale=0,finT=0,endT=-1,downs=0,curD=null;
const PATROL=new Set(),SEEN=new Set(),FINAL=[];
const beamMat=new THREE.MeshBasicMaterial({color:C(0xffb040),transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide});
for(const K of CLUES){K.y=NC.ground(K.x,K.z);K.found=false;const g=new THREE.Group();g.position.set(K.x,K.y,K.z);g.userData.dyn=1;scene.add(g);K.g=g;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.3,160,12,1,true).translate(0,80,0),beamMat);g.add(beam);
  const pad=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,.34),new THREE.MeshBasicMaterial({color:C(0xffc860).multiplyScalar(1.8),toneMapped:false}));pad.position.y=.05;pad.rotation.y=K.x;g.add(pad);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffb040).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.y=.4;sp.scale.setScalar(1.6);g.add(sp);K.sp=sp;}
// the marker on the nearest recording you haven't found (and on the plaza for the last stand)
const wp=document.createElement('div');wp.className='hud keep';wp.style.cssText='width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid #ffc860;transform:rotate(45deg);background:rgba(255,200,96,.15);display:none;pointer-events:none';
const wpLab=document.createElement('div');wpLab.className='hud';wpLab.style.cssText='font:600 10px var(--mono);color:#ffc860;letter-spacing:.08em;transform:translate(-50%,12px);display:none;pointer-events:none';
document.body.append(wp,wpLab);
function updateMarker(){let tgt=null;if(phase==='play'&&P.alive){if(finale)tgt=V3(110,2,-10);else{let bd=1e9;for(const K of CLUES)if(!K.found){const d=Math.hypot(K.x-P.pos.x,K.z-P.pos.z);if(d<bd){bd=d;tgt=V3(K.x,K.y+1,K.z);}}}}
  if(!tgt){wp.style.display=wpLab.style.display='none';return;}_fa.copy(tgt).project(camera);const on=_fa.z<1;
  const x=clamp((_fa.x*.5+.5)*innerWidth,30,innerWidth-30),y=clamp((-_fa.y*.5+.5)*innerHeight,60,innerHeight-60);
  wp.style.display=wpLab.style.display=on?'':'none';wp.style.left=wpLab.style.left=x+'px';wp.style.top=wpLab.style.top=y+'px';wpLab.textContent=Math.round(P.pos.distanceTo(tgt))+' m';}
// a district's patrol: street soldiers round its middle, riflemen on its roofs, away from you
const PLAN={market:{foot:5,heavy:0,roof:2},lower:{foot:6,heavy:1,roof:1},plaza:{foot:5,heavy:1,roof:0},docksW:{foot:4,heavy:1,roof:0},docksE:{foot:4,heavy:0,roof:1},heightsW:{foot:4,heavy:0,roof:1},heightsE:{foot:3,heavy:1,roof:1}};
function inDistrict(n,D){return D.d(n.x,n.z)<-2;}
function spotIn(D,away){for(let t=0;t<80;t++){const n=NAVG.nodes[Math.floor(rng()*NAVG.nodes.length)];if(!inDistrict(n,D))continue;if(Math.hypot(n.x-P.pos.x,n.z-P.pos.z)<away)continue;return n;}return null;}
function roofIn(D){const L=GS.nav.perches.map(k=>GS.nav.nodes[k]).filter(n=>inDistrict(n,D)&&!USED.has(n)&&Math.hypot(n.x-P.pos.x,n.z-P.pos.z)>30);if(!L.length)return null;const n=L[Math.floor(rng()*L.length)];USED.add(n);return n;}
function patrol(D){if(PATROL.has(D.id))return;PATROL.add(D.id);const Q=PLAN[D.id];
  const put=(unit,n)=>{for(let k=0;k<n;k++){const s=spotIn(D,28);if(!s)continue;spawnTrooper(s.x+R(-.4,.4),s.z+R(-.4,.4),{unit,hold:R(16,30)});}};
  put('footsoldier',Q.foot);put('heavy',Q.heavy);
  for(let k=0;k<Q.roof;k++){const s=roofIn(D);if(!s)continue;const E=spawnTrooper(s.x,s.z,{perch:true,hold:999,unit:'footsoldier'});if(E){E.pos.y=s.y;E.H.root.position.y=s.y;}}}
function districtAt(x,z){for(const D of NC.DISTRICTS)if(D.d(x,z)<0)return D;return null;}
function checkClues(){for(const K of CLUES){if(K.found)continue;if(Math.hypot(K.x-P.pos.x,K.z-P.pos.z)<2.4&&Math.abs(P.pos.y-K.y)<2.5){K.found=true;found++;K.g.visible=false;
  P.spawn.set(K.x,K.y,K.z);if(typeof sfx!=='undefined'&&sfx.pickup)try{sfx.pickup();}catch(_){}
  banner('Recording recovered · '+K.name+' · '+found+' of '+CLUES.length);PG.prog('ftfound');
  let t=0;for(const [w,line,d] of K.lines){setTimeout(()=>PG.say(w,line,'',d),t);t+=d*1000+300;}
  if(found<CLUES.length)setTimeout(()=>PG.say(SAY_FOUND[0],SAY_FOUND[1].replace('{n}',found),'',4),t+400);
  else setTimeout(startFinale,t+600);}}}
function startFinale(){if(finale)return;finale=1;finT=0;
  PG.say('Lantern Lead','That\'s all five. Two, they\'re moving on the plaza, all of them. Get to the monument and hold it.','alert',6);
  if(window.goalPop)goalPop('Hold the plaza','The monument');else banner('Hold the plaza');}
function finaleWave(k){const D=NC.DISTRICTS.find(d=>d.id==='plaza'),Q=k===0?[['footsoldier',5],['heavy',1]]:[['footsoldier',3],['heavy',1],['commander',1]];
  for(const [u,n] of Q)for(let i=0;i<n;i++){const s=spotIn(D,30);if(!s)continue;const E=spawnTrooper(s.x,s.z,{unit:u,hold:R(12,22)});if(E){E.goal=V3(110,0,-10);FINAL.push(E);}}}
// you go down: Lantern Lead pulls you back to the last recording you found (or the start)
playerDown=function(){if(!P.alive)return;P.alive=false;P.hp=0;P.respawnT=5;downs++;killHuman(P.H);fireHeld=false;P.adsHeld=false;
  PG.say('Lantern Lead','Two\'s down! Get him up, get him off the street!','alert',4);banner('You are down · back in where you last checked in','alert');};
{const pu=playerUp;playerUp=function(){pu();P.pos.copy(P.spawn);P.vy=0;refillAll();P.nades=Math.max(P.nades,typeof NADE_START!=='undefined'?NADE_START:3);P.H.root.visible=true;};}
// gun racks: one in each district, at a crossroads
for(const [x,z] of[[-64,12],[-145,-22],[84,-44],[-118,86],[-46,-86],[64,44]])STATION_SPOTS.push({x,z});

/* ---------- the start: the title card, then the skybridge between the market's towers, looking east to the Spear ---------- */
function beginPlay(){phase='play';P.input=true;P.alive=true;P.H.root.visible=true;
  P.pos.set(0,14,2.5);P.spawn.copy(P.pos);P.yaw=-Math.PI/2;P.pitch=-.05;
  FTG.show(true);FTG.date();
  setTimeout(()=>{if(phase!=='play')return;PG.say('Lantern Lead','Two, the network\'s down but the recorders aren\'t. Five Keeper recordings out there somewhere in this district. Find them. Mind the patrols.','',8);
    if(window.goalPop)goalPop('Find the recordings','0 of '+CLUES.length+' · follow the amber light');},2500);}
function startTitle(){phase='title';P.input=false;FTG.title(beginPlay);}

/* ---------- the end: the plaza held, the camera turns to the Spear, the signal goes ---------- */
let turnFrom=null;
function endFootage(){phase='end';P.input=false;fireHeld=false;P.adsHeld=false;PG.done('ftclear');PG.combat(false);
  PG.say('Lantern Lead','Plaza\'s ours. Look at that, Two. She\'s still standing.','',5);
  turnFrom={yaw:P.yaw,pitch:P.pitch,t:0};
  setTimeout(()=>FTG.lost(()=>{try{if(document.exitPointerLock)document.exitPointerLock();}catch(_){}
    PG.finish({title:'RECOVERED FOOTAGE · NIGHT MARKET',text:`Tide City, the night after. ${found} of ${CLUES.length} recordings recovered, ${P.kills} of the Hollow down${downs?', '+downs+' time'+(downs>1?'s':'')+' pulled back':''}. Threat level: ${DIFF.name}.`,
      buttons:[{text:'Play again',onClick:()=>location.reload(),primary:true},{text:'Menu',href:'index.html'}]});}),6500);}
function updateTurn(dt){if(!turnFrom||!SPR)return;turnFrom.t+=dt;const u=sstep(0,1,clamp(turnFrom.t/3.2,0,1));
  const sp=SPR.group.position,want=Math.atan2(-(sp.x-P.pos.x),-(sp.z-P.pos.z));let d=want-turnFrom.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));
  P.yaw=turnFrom.yaw+d*u;P.pitch=turnFrom.pitch+(.32-turnFrom.pitch)*u;}
function updateCity(dt){
  // the district you're in: its name the first time, its patrol the first time you get near
  const D=districtAt(P.pos.x,P.pos.z);if(D&&D!==curD){curD=D;if(!SEEN.has(D.name)){SEEN.add(D.name);if(window.goalPop)goalPop(D.name,found+' of '+CLUES.length+' recordings');}}
  for(const Dd of NC.DISTRICTS)if(!PATROL.has(Dd.id)&&Dd.d(P.pos.x,P.pos.z)<18)patrol(Dd);
  checkClues();
  for(const K of CLUES)if(!K.found)K.sp.material.opacity=.6+.4*Math.sin(T*3+K.x);
  if(finale){finT+=dt;if(finale===1&&finT>4){finale=2;finaleWave(0);}if(finale===2&&finT>16){finale=3;finaleWave(1);}
    if(finale===3&&finT>20&&endT<0&&FINAL.every(E=>E.H.dead)){endT=0;setTimeout(endFootage,2000);}}}

/* ---------- main loop ---------- */
let last=performance.now(),frameErr=0;
function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(!PG.paused){
    if(phase==='play'||phase==='end'){stepPlayer(dt);if(phase==='end')updateTurn(dt);placeCamera();}
    if(phase==='play')updateCity(dt);
    if(phase!=='brief'&&phase!=='title')updateEnemies(dt);
    updateNades(dt);updateRockets(dt);updateTurrets(dt);updateWall(dt);updateSentry(dt);updateZeal(dt);updatePicks(dt);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);
    {let near=false;if(phase==='play')for(const E of ENEMIES)if(!E.H.dead&&!E.warm&&E.pos.distanceTo(P.pos)<48){near=true;break;}PG.combat(near);}
    FTG.tick(dt);updateMarker();
  }else if(phase==='brief'||phase==='title'){camera.position.set(-20,20,6);camera.lookAt(40,8,0);}
  if(phase==='title'){camera.position.set(-20,20,6);camera.lookAt(40,8,0);}
  if(SPR)SPR.tick(T,.6);
  updateLights(dt,T,camera.position);
  skyFollow();followSun(phase==='play'||phase==='end'?P.pos:camera.position);updateDust();if(phase==='play'||phase==='end')updateHud(dt);
  renderFrame();}
const FOOT_PC=[['Mouse','Aim (click to lock, Esc releases)'],['Left click','Fire'],['Right click','Aim down the sights (Z zooms a sniper 4x / 7x)'],['W A S D','Move'],['Shift','Sprint'],['1 2 or wheel','Primary, secondary · look at a gun on a rack to take it'],['E','Pick up a gun · walk up to an ammo box to fill up'],['R','Reload'],['Space','Jump'],['3','Grenade'],['4 or middle click','Zeal'],['F','Flashlight on / off']];
const FOOT_PHONE=[['Drag (right side)','Aim'],['Left thumb','Move'],['FIRE','Fire (hold)'],['Double-tap right','Aim down the sights · scoped: ZOOM for 4x / 7x'],['⇄','Next weapon'],['LIGHT','Flashlight on / off'],['JUMP · CROUCH','Jump, crouch']];
PG.briefing({title:'NIGHT MARKET',text:'Recovered footage. A Keeper\'s helmet camera in Tide City, the night after the battle, in the rain: the market and the districts round it, the lower streets, the plaza, the docks and the heights. The Hollow left patrols in the streets. Threat level: '+DIFF.name+'.',
  objective:'Find the five Keeper recordings, in any order: follow the amber light. Then hold the plaza.',
  pc:FOOT_PC,phone:FOOT_PHONE,
  onStart:()=>{if(/[?&]skip=1/.test(location.search)){beginPlay();return;}startTitle();}});
requestAnimationFrame(frame);
window.INDOOR_AT=GS.indoorAt||(()=>0);
