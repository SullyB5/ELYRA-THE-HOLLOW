/* Elyra · Pathfinder · Arc 02 · Dead Ground — the story, phase by phase (Bryce's S2 brief, Oct 22: a working outline, not a locked script).
   09.03.2237. The wreck at dawn: Landry picks up a beacon on a Keeper frequency, maybe Dropship Two ("Then we move now.")
   → SURVIVE: salvage the wreck (ammunition, the med kit for Okafor, the case, the locator) → DEAD GROUND: follow the beacon through a
   burned convoy and black glass that still burns → THE WAR WITHOUT SIDES: the basin, two Herald forces with the same uniforms and
   different insignias, killing each other ("Civil war?" "Looks that way."); neither side is a friend → THE GRAVEYARD: wrecked Herald
   transports; Thorne pulls two orders from the same command network, one to protect a site, one to destroy it → THE CANYON: Dropship
   Two on her side at the end; hold while Landry brings her core back, both sides coming up the canyon, Marsh and Rhen about the case;
   once, near the case, the enemy simply stops firing (nobody explains it) → the case pulses, its light points north, and over the rim
   a white city stands on the horizon. "I don't think we found this thing by accident."
   The object stays unnamed: to the crew it is "the case" / "the package". Draft lines are Claude's; Bryce rewrites. */
const easeIO=CUTS.ease;
function playCut(shots,done,opts){P.input=false;fireHeld=false;P.adsHeld=false;CUTS.play(shots,Object.assign({done:sk=>{P.input=true;if(done)done(sk);}},opts||{}));}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function glowSprite(hex,size,k,op){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(hex).multiplyScalar(k||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op==null?1:op}));s.scale.setScalar(size);return s;}
$('use').textContent='USE';

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

/* ---------- the team: Captain Rhen (you), Sergeant Marsh, Okafor (hurt in the crash), Thorne, and Ensign Landry on foot now ---------- */
ALLY_TINT.marine=0xb4bcc4;ALLY_TINT.engineer=0xc4c0b8;
const SQUAD=[addAlly('marine',-4,-30,'Sergeant Marsh'),addAlly('marine',-14,-4,'Okafor'),addAlly('marine',4,-26,'Thorne'),addAlly('engineer',-2,-24,'Ensign Landry')];
const [MARSH,OKAFOR,THORNE,LANDRY]=SQUAD;
// the case rides on Marsh's back once it's out of the wreck
const CASE=(()=>{const g=new THREE.Group(),m=new THREE.Mesh(new THREE.BoxGeometry(.5,.8,.3),new THREE.MeshStandardMaterial({color:C(0x221d2a),roughness:.4,metalness:.7,map:panelTex}));g.add(m);
  const s=new THREE.Mesh(new THREE.BoxGeometry(.52,.05,.32),new THREE.MeshBasicMaterial({color:C(0xc8d4ff).multiplyScalar(2),toneMapped:false}));s.position.y=.1;g.add(s);
  const h=glowSprite(0xa8b8ff,1.4,1.2,.6);g.add(h);g.position.set(0,1.35,.32);g.visible=false;MARSH.H.root.add(g);return{g,h,pulse:0};})();
function playerDown(){P.alive=false;P.hp=0;P.respawnT=5;killHuman(P.H);fireHeld=false;P.adsHeld=false;PG.say('Sergeant Marsh','Captain’s down! Thorne, get him up!','alert',4);
  banner('You are down · your team is pulling you back','alert');}
function hurtAlly(A,dmg){A.hits++;hitHuman(A.H);if(A.H.dead||!A.on)return;A.lastHit=T;A.hp-=dmg*(OD.allyDmg||1)*(A===LANDRY?.6:1);
  if(A.hp<=0){A.hp=0;killHuman(A.H);A.downT=ALLY_DOWN;A.target=null;PG.say(A===MARSH?'Thorne':'Sergeant Marsh',(A===MARSH?'Marsh':A.name.replace('Ensign ',''))+' is down! Someone get to them!','alert');
    if(A===LANDRY&&phase==='defend')PG.fail('p2landry');}}

/* ---------- phases ---------- */
let phase='brief',phT=0,wentDown=false;
const said=new Set();
function say(key,who,txt,tone,dur){if(said.has(key))return;said.add(key);if(who==='Keeper Sergeant')who='Sergeant Marsh';PG.say(who,txt,tone,dur);}
const CP_KEY='elyra.checkpoint.pathfinder2';
function saveCP(at){try{localStorage.setItem(CP_KEY,JSON.stringify({at,t:Date.now()}));}catch(_){}}
function clearCP(){try{localStorage.removeItem(CP_KEY);}catch(_){}}
function readCP(){try{const c=JSON.parse(localStorage.getItem(CP_KEY)||'null');return c&&['basin','grave','defend'].includes(c.at)?c:null;}catch(_){return null;}}
const CP_NAME={basin:'The basin',grave:'The graveyard',defend:'Dropship Two'};
function setPhase(p){if(['basin','grave','defend'].includes(p)&&phase!==p)saveCP(p);if(p==='end')clearCP();phase=p;phT=0;
  if(['end','ds2cut','endcut'].includes(p))reviveAllies();}
function phaseFight(){return['desert','basin','grave','canyon','defend'].includes(phase);}
PG.init('pathfinder2',{challenges:[
  {id:'p2kills',text:'Down 25 Herald soldiers',pts:2000,goal:25},
  {id:'p2glass',text:'Never step on the black glass',pts:1000},
  {id:'p2landry',text:'Never let Landry go down at Dropship Two',pts:2500},
  {id:'p2orders',text:'Recover both orders',pts:800},
  {id:'pdown',text:'Never go down',pts:2000},
]});
{const _p=PG.prog,_d=PG.done;PG.prog=(id,n)=>_p(id==='okills'?'p2kills':id,n);PG.done=id=>_d(id);}

/* ---------- places along the way ---------- */
function at(s,lat,out){const p=roadPt(clamp(s,0,ROAD_LEN),out||new THREE.Vector3()),n=roadN(clamp(s,0,ROAD_LEN));p.x+=n.x*lat;p.z+=n.z*lat;p.y=groundY(p.x,p.z);return p;}
function herald(team,s,lat,o){const p=at(s,lat);return spawnTrooper(p.x,p.z,Object.assign({team,hold:R(16,30)},o||{}));}
// a rifleman up on the canyon rim (15 m), standing on its flat lip, in the open
function rimPerch(team,s,side){const h=laneHalf(s),p=at(s,side*(h+3.2));const E=spawnTrooper(p.x,p.z,{team,perch:true});if(E)E.pos.y=groundY(p.x,p.z);return E;}
// supplies along the way
for(const [s,lat,t] of[[70,0,'ammo'],[120,4,'med'],[160,-4,'rocket'],[214,0,'ammo'],[270,-8,'med'],[322,0,'ammo'],[360,0,'rocket'],[410,0,'med'],[ROAD_LEN-30,4,'ammo'],[ROAD_LEN-26,-6,'med']]){const p=at(s,lat);addPick(t,p.x,p.z);}

/* ---------- the two dropships ---------- */
function makeDropship(){const g=new THREE.Group(),m=new Merger(),gl=new Merger(),hc=C(0x8e96a2),dk=C(0x2c3340),bl=C(0x2a5a96),gd=C(0xd9b25a);
  m.add(boxUV(9.6,5.8,22,3),M(0,1.8,-1.6),hc);m.add(boxUV(7.6,1.4,20,3),M(0,5.2,-1),dk);
  const nose=new THREE.CylinderGeometry(.8,4.6,6,4,1);nose.rotateY(Math.PI/4);nose.rotateX(-Math.PI/2);nose.scale(1,.75,1);m.add(nose,M(0,1.9,-15.6),hc);
  gl.add(new THREE.BoxGeometry(4.2,.9,2.4),M(0,3.4,-13.6,-.35,0,0),C(0x9ff0ff));
  for(const s of[-1,1]){m.add(boxUV(.2,1.1,21,3),M(s*4.85,2.4,-1.6),bl);m.add(boxUV(.22,.25,21,3),M(s*4.86,3.1,-1.6),gd);m.add(boxUV(4.4,.5,7,3),M(s*6.8,3,-3),dk);
    for(const z of[-6,4]){m.add(boxUV(2.6,2.6,6,3),M(s*7.2,1.4,z),dk);m.add(cylZ(1.1,1.2,1.2,10),M(s*7.2,1.4,z+3.4),hc);gl.add(new THREE.CircleGeometry(.9,12),M(s*7.2,1.4,z+4.05),C(0x7fe6ff));}}
  const geo=m.build();g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.45,metalness:.55})),new THREE.Mesh(gl.build(),new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)})));
  MODELS.swapShip(g,'dropship',{ref:geo,glow:.1});scene.add(g);g.userData.ref=geo;return g;}
// Rhen's: nose-down at the end of its trench, as Arc 01 left it (the model's keel is 3.5 m under the bay floor)
const OWN=makeDropship();OWN.position.set(WRECK.x,1.5,WRECK.z);OWN.rotation.set(0,WRECK.ry,0);OWN.rotateX(.2);OWN.rotateZ(.3);
for(let k=-2;k<=2;k++)OBST.push({x:WRECK.x+Math.sin(WRECK.ry)*k*5.2,z:WRECK.z+Math.cos(WRECK.ry)*k*5.2,r:4.6,h:7});
// Dropship Two: on her side against the canyon's end wall, a long scar behind her
const TWO=makeDropship();TWO.position.set(DS2.x+3,2.4,DS2.z-7);TWO.rotation.set(0,Math.PI*.55,0);TWO.rotateZ(1.25);TWO.rotateX(.1);
for(let k=-2;k<=2;k++)OBST.push({x:TWO.position.x+Math.sin(Math.PI*.55)*k*5,z:TWO.position.z+Math.cos(Math.PI*.55)*k*5,r:4.2,h:6});
const wreckSmoke=[{p:V3(WRECK.x+2,6,WRECK.z-6),k:1},{p:V3(TWO.position.x-4,5,TWO.position.z),k:.6}];
const coreGlow=glowSprite(0x7fe6ff,2.2,2,0);coreGlow.position.set(DS2.x+1,2.2,DS2.z-2);scene.add(coreGlow);

/* ---------- things to do with your hands: walk up and hold (or press E / tap USE) ---------- */
const TASKS=[];let taskHold=0,taskNow=null;
function task(id,label,pos,onDone,needs){const t={id,label,pos:pos.clone(),done:false,onDone,needs:needs||null,on:false};TASKS.push(t);return t;}
function updateTasks(dt){taskNow=null;let best=3;for(const t of TASKS){if(!t.on||t.done||(t.needs&&!t.needs()))continue;const d=Math.hypot(P.pos.x-t.pos.x,P.pos.z-t.pos.z);if(d<best){best=d;taskNow=t;}}
  if(taskNow&&P.alive){onUse=()=>{taskHold=9;};taskHold+=dt;banner(taskNow.label+(coarse?' · hold':' · hold, or press E'));
    if(taskHold>1){const t=taskNow;t.done=true;taskHold=0;onUse=null;if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();t.onDone();}}
  else{taskHold=0;if(onUse&&!taskNow)onUse=null;}}
function nextTaskWP(){const t=TASKS.find(t=>t.on&&!t.done&&(!t.needs||t.needs()));return t?t.pos.clone().setY(t.pos.y+1.6):null;}
// the wreck: four jobs before anyone walks anywhere
const W=(dx,dz)=>V3(WRECK.x+dx,0,WRECK.z+dz);
let medKit=false;
const T_AMMO=task('ammo','Ammunition',W(6,6),()=>{for(let g=0;g<3;g++){const A=P.ammo[g];A.res=Math.min(GUNS[g].max,A.res+Math.round(GUNS[g].max*.5));}say('t1','Sergeant Marsh','Four magazines each. That’s all of it.');});
const T_MED=task('med','Medical kit',W(-5,8),()=>{medKit=true;say('t2','Thorne','Med kit. Half of it’s broken.');});
const T_OKA=task('okafor','Stabilize Okafor',V3(0,0,0),()=>{OKAFOR.on=true;OKAFOR.hp=70;say('t3','Okafor','I’m fine. ...I’m fine. Let’s go.');},()=>medKit);
const T_CASE=task('case','Retrieve the case',W(2,-4),()=>{CASE.g.visible=true;say('t4','Sergeant Marsh','I’ve got it. It’s still warm.');});
const T_LOC=task('locator','Activate the emergency locator',W(-4,-9),()=>{say('t5','Ensign Landry','Locator’s up. If anyone’s listening, they know where we fell.');});
const SALVAGE=[T_AMMO,T_MED,T_OKA,T_CASE,T_LOC];
// the graveyard: two terminals, two orders
const T_ORD=TERMS.map((tm,i)=>task('order'+i,'Pull the orders from the terminal',tm.p,()=>{tm.done=true;tm.scr.material.color.copy(C(0x5aa0ff)).multiplyScalar(1.4);ordersFound++;if(ordersFound===2)ordersTalk();else say('o1','Thorne','One order. Same network as the others. There’s another terminal in that wreck.');}));
let ordersFound=0;
function ordersTalk(){PG.done('p2orders');[[0,'Thorne','Two orders. Same command network, same hour.'],[3.6,'Captain Rhen','Saying what?'],[2.2,'Thorne','One says protect the site. The other says destroy it.'],
  [3.6,'Sergeant Marsh','Which site?'],[2,'Thorne','Doesn’t say. Coordinates I can’t read.'],[3,'Captain Rhen','Bring them. Keep moving.']].reduce((t,[d,w,x])=>{t+=d;setTimeout(()=>PG.say(w,x),t*1000);return t;},0);}

/* ---------- the squad: follows a few metres behind you; Okafor sits by the wreck until he's patched; Landry keeps to the middle ---------- */
function squadFollow(spread){const sP=roadS(P.pos.x,P.pos.z);
  SQUAD.forEach((A,i)=>{if(A===OKAFOR&&!OKAFOR.on)return;const back=3.5+i*2.2,lat=(i%2?1:-1)*(1.6+i*.6)*spread;let g;
    if(sP<6){g=V3(P.pos.x+Math.sin(P.yaw)*back+Math.cos(P.yaw)*lat,0,P.pos.z+Math.cos(P.yaw)*back-Math.sin(P.yaw)*lat);if(playD(g.x,g.z)>-1)g.set(P.pos.x+Math.sin(P.yaw)*2,0,P.pos.z+Math.cos(P.yaw)*2);}
    else{const sc=sP-back,L=Math.max(1,laneHalf(Math.max(0,sc))-1.6);g=at(Math.max(0,sc),clamp(latOf(P.pos.x,P.pos.z)+lat,-L,L));}
    A.goal=g;});}
// Okafor, hurt: sitting against the hull until the med kit
OKAFOR.on=false;OKAFOR.pos.set(WRECK.x+7.5,0,WRECK.z+1.5);T_OKA.pos.copy(OKAFOR.pos);
function poseOkafor(dt){if(OKAFOR.on)return;const H=OKAFOR.H;poseHuman(H,dt,0,0,false);H.crouchTo=1;H.root.rotation.y=-.9;H.head.rotation.x=.3;H.root.position.y=floorAt(OKAFOR.pos.x,OKAFOR.pos.z);}

/* ---------- the encounters ---------- */
let enc=new Set();
function once(k,fn){if(enc.has(k))return;enc.add(k);fn();}
function basinWar(){const n=4+(OD.n||0);
  for(let k=0;k<n;k++){herald('red',228+k*12,-30+R(-4,4),{hold:R(30,60)});herald('amber',232+k*12,30+R(-4,4),{hold:R(30,60)});}
  herald('red',300,-26);herald('amber',298,26);}
function graveAmbush(){for(let k=0;k<3+(OD.n||0);k++)herald('amber',340+k*9,R(-10,10),{hold:R(12,20)});herald('red',384,-14);}
// the canyon defence: both sides come up from the mouth, riflemen appear on both rims
const DEF={t:0,max:62,spawnT:3,side:0,calmed:false,perches:0};
function defSpawn(dt){DEF.spawnT-=dt;if(DEF.spawnT>0)return;DEF.spawnT=R(6,8)/OD.rof;const team=DEF.side++%2?'amber':'red';
  for(let k=0;k<3+(OD.n||0);k++){const p=at(ROAD_LEN-R(64,84),R(-7,7));const E=spawnTrooper(p.x,p.z,{team,hold:R(8,14)});if(E)E.goal=at(ROAD_LEN-R(18,30),R(-6,6));}
  if(DEF.t>14&&DEF.perches<5){DEF.perches++;rimPerch(team,ROAD_LEN-R(30,60),rng()<.5?-1:1);}}

/* ---------- the director ---------- */
function director(dt){
  phT+=dt;markFoes(markList);markList=[];if(!P.alive)wentDown=true;
  const s=roadS(P.pos.x,P.pos.z);updateTasks(dt);poseOkafor(dt);
  // the black glass burns
  if(P.alive&&P.input)for(const h of HAZ)if(Math.hypot(P.pos.x-h.x,P.pos.z-h.z)<h.r*.95){glassT=(glassT||0)+dt;if(glassT>.45){glassT=0;hurtPlayer(7);PG.fail('p2glass');banner('The glass is still burning · get off it','alert');}}
  if(phase==='salvage'){const left=SALVAGE.filter(t=>!t.done);PG.objective(left.length?'Salvage the wreck · '+(5-left.length)+' / 5':'Follow the beacon');WP=nextTaskWP();squadFollow(1);
    if(!left.length){setPhase('desert');banner('Follow the beacon');say('go','Captain Rhen','That’s everything. Landry, which way?');setTimeout(()=>PG.say('Ensign Landry','North, through the flats. The beacon’s steady.'),3000);}}
  else if(phase==='desert'){PG.objective('Follow the beacon across the dead ground');WP=at(S_BASIN+10,0).setY(2);squadFollow(1);
    if(s>60)say('d1','Sergeant Marsh','Whole convoy. Burned where it stood.');
    if(s>92)say('d2','Ensign Landry','Ground’s still burning out there. Stay off the black glass.','alert');
    if(s>118)say('d3','Thorne','That pale stone again. Same as the vault walls.');
    if(s>128)once('scouts',()=>{for(let k=0;k<2+(OD.n||0);k++)herald('red',152+k*6,R(-8,8),{hold:R(10,18)});setTimeout(()=>PG.say('Okafor','Movement ahead! Red markings!','alert'),600);});
    if(s>S_BASIN-24){setPhase('basin');}}
  else if(phase==='basin'){once('war',basinWar);
    // the war keeps going while you cross: each side feeds men in from its own flank, ahead of you
    basinT-=dt;if(basinT<=0&&s<S_GRAVE-20){basinT=R(8,11);for(const team of['red','amber']){const live=ENEMIES.filter(E=>!E.H.dead&&E.team===team).length;if(live<4+(OD.n||0))herald(team,clamp(s+R(30,60),S_BASIN,S_GRAVE-14),(team==='red'?-1:1)*R(34,42),{hold:R(30,60)});}}PG.objective('Get through the basin · both sides will fire on you');WP=at(S_GRAVE+8,0).setY(2);squadFollow(1.3);
    if(phT>1)say('w1','Sergeant Marsh','Same uniforms.');if(phT>3.4)say('w2','Thorne','Different insignias.');if(phT>5.4)say('w3','Captain Rhen','Civil war?');
    if(phT>7.2)say('w4','Thorne','Looks that way.');if(phT>9.4)say('w5','Sergeant Marsh','Thought they were supposed to be invading us.');if(phT>12.4)say('w6','Captain Rhen','Keep moving.');
    if(s>S_GRAVE-6)setPhase('grave');}
  else if(phase==='grave'){once('ambush',graveAmbush);for(const t of T_ORD)t.on=true;PG.objective(ordersFound<2?'Thorne: pull the orders from the wrecks · '+ordersFound+' / 2 (or move on)':'Follow the beacon into the canyon');
    WP=ordersFound<2?nextTaskWP():at(S_CANYON+12,0).setY(2);squadFollow(1);if(s>S_CANYON+4){setPhase('canyon');say('c1','Ensign Landry','Beacon’s strong. She’s in there.');}}
  else if(phase==='canyon'){PG.objective('Find Dropship Two');WP=V3(DS2.x,3,DS2.z);squadFollow(.8);
    if(s>S_CANYON+40)once('cRim',()=>{rimPerch('amber',S_CANYON+70,-1);rimPerch('amber',S_CANYON+84,1);setTimeout(()=>PG.say('Thorne','On the rim! Both sides!','alert'),500);});
    if(s>ROAD_LEN-34){setPhase('ds2cut');ds2Scene();}}
  else if(phase==='defend'){DEF.t+=dt;const left=Math.max(0,DEF.max-DEF.t);PG.objective(left>0?'Hold the canyon while Landry brings the core back · '+Math.ceil(left)+' s':'She’s up · get to the ship');
    WP=null;LANDRY.goal=V3(DS2.x+1,0,DS2.z-1);[MARSH,OKAFOR,THORNE].forEach((A,i)=>{A.goal=at(ROAD_LEN-22-i*3,(i-1)*5);});
    coreGlow.material.opacity=.3+.6*(DEF.t/DEF.max)*(.7+.3*Math.sin(T*6));
    if(left>0)defSpawn(dt);
    for(const [t,who,txt,tone] of DEF_RADIO)if(DEF.t>t)say('dr'+t,who,txt,tone);
    // once, near the case, it simply stops: everyone close to it holds fire for a few seconds. Nobody explains it
    if(DEF.t>34&&!DEF.calmed){DEF.calmed=true;CASE.pulse=1;flashScreen(.12);if(typeof sfx!=='undefined'&&sfx.wake)sfx.wake();
      for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(MARSH.pos)<45)E.calm=R(4,6);
      setTimeout(()=>PG.say('Okafor','Did they just... stop?'),900);setTimeout(()=>PG.say('Sergeant Marsh','Don’t ask. Shoot.','alert'),3600);}
    if(left<=0&&!ENEMIES.some(E=>!E.H.dead&&E.pos.distanceTo(P.pos)<40)){setPhase('endcut');endScene();}}
  // the last few on the field get markers
  if(phaseFight()){const live=ENEMIES.filter(E=>!E.H.dead&&!E.gunner&&E.pos.distanceTo(P.pos)<90);if(live.length&&live.length<=3)markList=live.map(E=>E.pos.clone().setY(E.pos.y+2.6));}
  if(phase!=='salvage'&&phase!=='brief'&&phase!=='intro')P.spawn.copy(at(Math.max(-6,s-20),0));
}
let glassT=0,basinT=6;
// the character scene, over the radio while the core comes back (Bryce's lines from the S2 outline)
const DEF_RADIO=[[3,'Ensign Landry','Core’s cold but it’s whole. I need a minute. Maybe two.','alert'],[9,'Sergeant Marsh','We should leave that thing here.'],[12,'Captain Rhen','No.'],[14,'Sergeant Marsh','We lost our ship for it.'],
  [17,'Captain Rhen','They destroyed our ship to keep it.'],[20.5,'Sergeant Marsh','That doesn’t make it worth another life.'],[24,'Captain Rhen','I know.'],[26,'Sergeant Marsh','Then why are we carrying it?'],
  [29,'Captain Rhen','Because I need to know what they’re afraid of.'],[46,'Ensign Landry','Power’s coming up! Keep them off me!','alert'],[58,'Ensign Landry','She’s up! She’s up!','alert']];

/* ---------- cutscenes ---------- */
const crew=()=>[P.H,...SQUAD.map(A=>A.H)];
function introScene(done){
  setLook('desert');const X=WRECK.x,Z=WRECK.z;
  // stage the team at the wreck
  P.pos.set(X+2,0,Z+9);P.yaw=Math.PI*.1;MARSH.pos.set(X+5,0,Z+5);THORNE.pos.set(X-3,0,Z+7);LANDRY.pos.set(X-4.5,0,Z-7.5);
  const live=(t,dt)=>{for(const A of[MARSH,THORNE,LANDRY]){A.H.root.position.y=floorAt(A.pos.x,A.pos.z);poseHuman(A.H,dt,0,0,false);}poseOkafor(dt);
    P.H.root.position.y=floorAt(P.pos.x,P.pos.z);poseHuman(P.H,dt,0,0,false);MARSH.H.crouchTo=.8;MARSH.H.root.rotation.y=2.2;THORNE.H.root.rotation.y=-.6;LANDRY.H.crouchTo=.7;LANDRY.H.root.rotation.y=-2.6;P.H.root.rotation.y=Math.PI;
    for(const sm of wreckSmoke)if(rng()<.35*sm.k)puff(sm.p.clone().add(V3(R(-1,1),0,R(-1,1))),R(2,4),4);};
  playCut([
    {dur:3.5,black:true,small:'Pathfinder · Arc 02 · 09.03.2237',cap:'Dead Ground',cam:[[X+40,14,Z+40]],look:[[X,3,Z]],fn:live},
    // the trench, the wreck at the end of it, dust blowing through the broken hull; the sky copper-red
    {dur:7,cam:[[X+40,14,Z+46],[X+22,7,Z+26]],look:[[X,3,Z],[X,2.5,Z-2]],fn:live},
    {dur:6,cam:[[X+9,1.6,Z+3.5],[X+8.6,1.5,Z+3]],look:[[X+7.5,1,Z+1.5]],fn:live},
    {dur:7,cam:[[X-2,1.8,Z-4.5],[X-2.4,1.7,Z-5]],look:[[X-4.5,1.2,Z-7.5]],
      say:[[.8,'Ensign Landry','I’ve got a signal.'],[0,'Captain Rhen','From the Pathfinder?'],[0,'Ensign Landry','No, sir. Emergency beacon. Keeper frequency.']],fn:live},
    {dur:7,cam:[[X+6,2.2,Z+12],[X+5,2,Z+10.5]],look:[[X+1,1.5,Z+4]],
      say:[[.3,'Sergeant Marsh','Another survivor?'],[0,'Ensign Landry','Could be Dropship Two.'],[0,'Thorne','How far?'],[0,'Ensign Landry','Far enough that we’re not walking there before dark.']],fn:live},
    {dur:5,cam:[[X+1,1.7,Z+13],[X+1.4,1.75,Z+12.2]],look:[[X+2,1.6,Z+9]],say:[[.4,'Captain Rhen','Then we move now. Take what we can carry.']],fn:live},
  ],()=>{done&&done();});
}
// Dropship Two: on her side at the end of the canyon; someone alive in the cockpit; and they're coming up behind
function ds2Scene(){
  const X=DS2.x,Z=DS2.z;for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(P.pos)<40){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  const team=[P,...SQUAD];team.forEach((A,i)=>{A.pos.copy(at(ROAD_LEN-30-i*1.5,(i-2)*2));});
  const live=(t,dt)=>{team.forEach(A=>{A.H.root.position.y=floorAt(A.pos.x,A.pos.z);A.H.root.rotation.y=Math.PI;poseHuman(A.H,dt,0,0,false);});};
  playCut([
    {dur:6,cam:[[X+14,4,Z+30],[X+10,3,Z+20]],look:[[X+3,3,Z-6]],say:[[.6,'Ensign Landry','Dropship Two. Her core’s still warm.']],fn:live},
    {dur:6,cam:[[X+6,2,Z+4],[X+5,2.2,Z+2.6]],look:[[X+3,3,Z-6]],say:[[.3,'Okafor','Someone’s alive in the cockpit.'],[0,'Captain Rhen','Landry. Can you get her up?'],[0,'Ensign Landry','Maybe. Give me a minute. Maybe two.']],fn:live},
    {dur:5,cam:[[X-2,2,Z+18]],look:[[X-2,4,Z+80]],say:[[.4,'Thorne','Contacts at the canyon mouth. Both sides.','alert'],[0,'Captain Rhen','Then we give them two.']],fn:live},
  ],()=>{setPhase('defend');banner('Hold the canyon','alert');P.spawn.copy(at(ROAD_LEN-24,0));});
}
// the end: the case pulses; its light points north, over the rim; the white city on the horizon
function endScene(){
  for(const E of ENEMIES)if(!E.H.dead){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  const X=DS2.x,Z=DS2.z,team=[P,...SQUAD];team.forEach((A,i)=>{A.pos.copy(V3(X+(i-2)*1.8,0,Z+10));});CASE.g.visible=true;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.05,.6,600,8,1,true).translate(0,300,0),new THREE.MeshBasicMaterial({color:C(0xc8d4ff).multiplyScalar(1.6),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  scene.add(beam);
  const live=(t,dt)=>{team.forEach(A=>{A.H.root.position.y=floorAt(A.pos.x,A.pos.z);A.H.root.rotation.y=0;poseHuman(A.H,dt,0,0,false);});
    CASE.h.material.opacity=.5+.5*Math.abs(Math.sin(t*3));CASE.h.scale.setScalar(1.4+Math.abs(Math.sin(t*3))*1.4);
    const c=MARSH.H.root.localToWorld(V3(0,1.35,.32));beam.position.copy(c);beam.rotation.set(-1.32,0,0);};
  playCut([
    {dur:5,cam:[[X+1.5,1.9,Z+7.4]],look:[[MARSH.pos.x,1.4,MARSH.pos.z]],fn:(t,dt)=>{live(t,dt);beam.material.opacity=0;}},
    {dur:6,cam:[[X-3,1.6,Z+13],[X-2.5,2.5,Z+12]],look:[[X,4,Z-20],[X,12,Z-40]],say:[[1.2,'Thorne','Captain.'],[0,'Captain Rhen','What?']],fn:(t,dt)=>{live(t,dt);beam.material.opacity=Math.min(.7,t*.25);}},
    {dur:8,cam:[[X,8,Z+14],[X,46,Z+8]],look:[[X,20,Z-200],[X,60,Z-900]],fn:(t,dt)=>{live(t,dt);if(t<.1){setLook('dusk');WHITE.G.visible=true;}beam.material.opacity=.7;}},
    {dur:6,cam:[[X,46,Z+8],[X+2,48,Z+6]],look:[[X,60,Z-900]],say:[[.6,'Thorne','I don’t think we found this thing by accident.']],fn:(t,dt)=>{live(t,dt);WHITE.halo.material.opacity=.35+.15*Math.sin(t*2);}},
    {dur:4.5,black:true,small:'Pathfinder · Arc 02',cap:'Dead Ground',cam:[[X,46,Z+8]],look:[[X,60,Z-900]]},
  ],()=>{setPhase('end');finishMission();},{hush:true});
}
function finishMission(){
  if(!wentDown)PG.done('pdown');if(LANDRY.hp>0)PG.done('p2landry');PG.ach('deadground');
  PG.finish({title:'PATHFINDER · ARC 02',text:`Dead Ground. Rhen’s team crossed the red desert, walked through the Herald civil war without picking a side, and found Dropship Two at the end of the canyon with her core coming back. The case points north, at a white city nobody built. Herald soldiers down: ${P.kills}. Threat level: ${DIFF.name}.`,
    buttons:[{text:'Menu',href:'index.html',primary:true},{text:'Play again',onClick:()=>location.reload()}]});}

/* ---------- jumps (checkpoints, and testing: pathfinder-2.html?at=desert|basin|grave|canyon|defend) ---------- */
function jumpTo(atq){P.input=true;for(const t of SALVAGE)t.done=true;medKit=true;OKAFOR.on=true;CASE.g.visible=true;
  const S={desert:S_DESERT+4,basin:S_BASIN-20,grave:S_GRAVE-2,canyon:S_CANYON+6,defend:ROAD_LEN-26}[atq]||0;
  const p=at(S,0);P.pos.copy(p);SQUAD.forEach((A,i)=>A.pos.copy(at(S-4-i*2,(i-1.5)*2)));P.yaw=Math.atan2(-(at(S+6,0).x-p.x),-(at(S+6,0).z-p.z));
  if(atq==='defend'){setPhase('defend');banner('Hold the canyon','alert');return;}
  setPhase(atq==='desert'?'desert':atq);banner('Checkpoint · '+(CP_NAME[atq]||atq));}

/* ---------- main loop ---------- */
let last=performance.now(),shakeT=0;
let frameErr=0;function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(!PG.paused){
    director(dt);
    if(CUTS.on)CUTS.update(dt);else if(phase!=='end'&&phase!=='brief'){stepPlayer(dt);placeCamera();}
    updateEnemies(dt);if(!CUTS.on)updateAllies(dt);updateDrops(dt);updateNades(dt);updateRockets(dt);updateTurrets(dt);updateWall(dt);updateSentry(dt);updateZeal(dt);updatePicks(dt);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);skyU.uT.value=T;
    PG.combat(phaseFight());
    if(CASE.g.visible){if(CASE.pulse>0){CASE.pulse=Math.max(0,CASE.pulse-dt*.25);CASE.h.scale.setScalar(1.4+CASE.pulse*6);CASE.h.material.opacity=.6+CASE.pulse*.4;}else{CASE.h.material.opacity=.4+.3*Math.sin(T*3);CASE.h.scale.setScalar(1.4);}}
    if(!CUTS.on)for(const sm of wreckSmoke)if(rng()<dt*6*sm.k)puff(sm.p.clone().add(V3(R(-1,1),0,R(-1,1))),R(2,4),4);
  }else if(phase==='brief'){camera.position.set(WRECK.x+40,14,WRECK.z+46);camera.lookAt(WRECK.x,3,WRECK.z);}
  if(shakeT>0){shakeT-=dt;camera.position.x+=R(-1,1)*shakeT*.15;camera.position.y+=R(-1,1)*shakeT*.12;}
  updateLights(dt,T,CUTS.on?camera.position:P.pos);
  skyFollow();followSun(CUTS.on?camera.position:P.pos);updateDust();updateHud(dt);updateWp();
  renderFrame();
}
PG.briefing({title:'DEAD GROUND',text:'09.03.2237. The morning after the crash. The Pathfinder is in pieces in orbit; Rhen’s team is on Astraea with a dead dropship, a hurt man and the case. Landry has picked up a beacon on a Keeper frequency. Threat level: '+DIFF.name+'.',
  objective:'Salvage the wreck, then follow the beacon. Stay off the black glass. Both Herald sides will shoot you.',
  pc:[['Mouse','Aim (click to lock, Esc releases)'],['W A S D','Move'],['Shift','Sprint'],['Left click','Fire'],['Right click','Aim down the sights (the Lance has a scope)'],
    ['1 2 3 or wheel','Rifle, Lance, Breaker launcher'],['R','Reload'],['Q','Mobile shield'],['X','Shoulder sentry'],['G or F','Grenade'],['Space','Jump'],['C or Ctrl','Crouch (toggle)'],['Z','Zeal when the meter is full'],['Walk up and hold, or E','Use (salvage, terminals)'],['Enter','Skip a cutscene']],
  phone:[['Left thumb','Move (push to the edge to sprint)'],['Right thumb','Aim'],['Double-tap right','Aim down the sights (again to stop)'],['FIRE','Fire (hold) · swipe up off it to throw a grenade'],['Ammo box','Reload (shows the magazine)'],['⇄','Next weapon'],['GEAR','Tap: mobile shield · hold: shoulder sentry'],['NADE','Grenade'],['JUMP · CROUCH','Jump, crouch (toggle)'],['Gold shield','Tap it for Zeal'],['Walk up · USE','Salvage, terminals'],['Skip','Skip a cutscene']],
  onStart:()=>{setPhase('intro');P.input=false;
    const atq=(location.search.match(/[?&]at=(\w+)/)||[])[1];if(atq){jumpTo(atq);return;}
    const begin=()=>introScene(()=>{setPhase('salvage');for(const t of SALVAGE)t.on=true;banner('Salvage the wreck');});
    const cp=readCP();if(!cp){begin();return;}
    PG.paused=true;const el=document.createElement('div');el.className='pgend pgbrief';
    el.innerHTML=`<div class="card"><h2>CHECKPOINT</h2><p>You stopped at <b>${CP_NAME[cp.at]}</b>. Pick up there, or start Dead Ground from the beginning.</p><div class="row"><button type="button" class="primary" id="cpGo">Resume</button><button type="button" id="cpNew">Start over</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('#cpGo').addEventListener('click',()=>{el.remove();PG.paused=false;jumpTo(cp.at);});
    el.querySelector('#cpNew').addEventListener('click',()=>{el.remove();PG.paused=false;clearCP();begin();});}});
requestAnimationFrame(frame);
