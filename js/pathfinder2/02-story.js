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
    const am=p.team==='amber';if(d.dataset.t!==String(p.team)){d.dataset.t=p.team;d.style.borderColor=am?'#ffc040':'#ff5a4a';d.style.borderRadius=am?'50%':'0';d.style.boxShadow=am?'0 0 8px rgba(255,192,64,.85)':'0 0 8px rgba(255,90,74,.8)';}   // the two sides marked apart (Oct 22)
    d.style.display='';d.style.left=(behind?innerWidth-x:x)+'px';d.style.top=(behind?innerHeight-60:y)+'px';d.style.opacity=behind?.55:1;});}

/* ---------- the team: Captain Rhen (you), Sergeant Marsh, Okafor (hurt in the crash), Thorne, and Ensign Landry on foot now ---------- */
ALLY_TINT.marine=0xb4bcc4;ALLY_TINT.engineer=0xc4c0b8;
const SQUAD=[addAlly('marine',-4,-30,'Sergeant Marsh','keeper-pathfinder'),addAlly('marine',-14,-4,'Okafor','keeper-pathfinder'),addAlly('marine',4,-26,'Thorne','keeper-pathfinder'),addAlly('engineer',-2,-24,'Ensign Landry')];
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
function readCP(){try{const c=JSON.parse(localStorage.getItem(CP_KEY)||'null');return c&&['stone','drive','village','basin','grave','canyon','descent','defend'].includes(c.at)?c:null;}catch(_){return null;}}
const CP_NAME={desert:'The desert',stone:'The standing stone',drive:'The road north',village:'The red village',basin:'The basin',grave:'The graveyard',canyon:'The canyon’s mouth',descent:'Half way down the mountain',defend:'Dropship Two'};
function setPhase(p){if(['drive','basin','grave','canyon','defend'].includes(p)&&phase!==p)saveCP(p);if(p==='end')clearCP();phase=p;phT=0;
  if(['end','ds2cut','endcut'].includes(p))reviveAllies();}
function phaseFight(){return['desert','drive','basin','grave','canyon','defend'].includes(phase);}
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
function rimPerch(team,s,side){if(s>S_CANYON)side=-1;   // down the mountain there is only one rim: the rock on your left (the right is the drop)
  const h=laneHalf(s),p=at(s,side*(h+3.2));const E=spawnTrooper(p.x,p.z,{team,perch:true});if(E)E.pos.y=groundY(p.x,p.z);return E;}
// supplies along the way
for(const [s,lat,t] of[[70,0,'ammo'],[120,4,'med'],[160,-4,'rocket'],[212,0,'ammo'],[258,-6,'med'],[308,4,'ammo'],[340,-3,'rocket'],
  [SH(214),0,'ammo'],[SH(270),-8,'med'],[SH(322),0,'ammo'],[SH(360),0,'rocket'],[SH(410),0,'med'],[S_CANYON+60,0,'ammo'],[S_CANYON+120,3,'med'],[S_CANYON+190,0,'rocket'],
  [ROAD_LEN-30,4,'ammo'],[ROAD_LEN-26,-6,'med']]){const p=at(s,lat);addPick(t,p.x,p.z);}
// in the side areas: worth the detour
{const [h,r]=SIDES;for(const [o,dx,dz,t] of[[h,6,-5,'med'],[h,-5,6,'rocket'],[h,8,4,'ammo'],[r,2,-2,'ammo'],[r,-2,3,'med'],[r,3,3,'rocket']])addPick(t,o.cx+dx,o.cz+dz);}

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
// the hull is solid along its length (narrow circles down its keel), and everything you salvage sits outside it, along its flanks
// (the old circles were wider than the hull and swallowed two of the jobs: you could never get close enough to finish them)
const WA=(along,lat)=>V3(WRECK.x+Math.sin(WRECK.ry)*along+Math.cos(WRECK.ry)*lat,0,WRECK.z+Math.cos(WRECK.ry)*along-Math.sin(WRECK.ry)*lat);
for(const a of[-13,-8.5,-4,.5,5,9.5]){const c=WA(a,0);OBST.push({x:c.x,z:c.z,r:a<-10?2.6:3.6,h:7});}
// Dropship Two: on her side against the canyon's end wall, a long scar behind her
const DS2Y=floorAt(DS2.x,DS2.z);   // (the bottom of the basin, Oct 25)
const TWO=makeDropship();TWO.position.set(DS2.x+3,DS2Y+2.4,DS2.z-7);TWO.rotation.set(0,Math.PI*.55,0);TWO.rotateZ(1.25);TWO.rotateX(.1);
for(let k=-2;k<=2;k++)OBST.push({x:TWO.position.x+Math.sin(Math.PI*.55)*k*5,z:TWO.position.z+Math.cos(Math.PI*.55)*k*5,r:4.2,h:6});
const wreckSmoke=[{p:V3(WRECK.x+2,6,WRECK.z-6),k:1},{p:V3(TWO.position.x-4,TWO.position.y+3,TWO.position.z),k:1.2}];
const coreGlow=glowSprite(0x7fe6ff,2.2,2,0);coreGlow.position.set(DS2.x+1,DS2Y+2.2,DS2.z-2);scene.add(coreGlow);

/* ---------- things to do with your hands: walk up and hold (or press E / tap USE) ---------- */
const TASKS=[];let taskHold=0,taskNow=null;
function task(id,label,pos,onDone,needs){const t={id,label,pos:pos.clone(),done:false,onDone,needs:needs||null,on:false};TASKS.push(t);return t;}
function updateTasks(dt){taskNow=null;let best=3;for(const t of TASKS){if(!t.on||t.done||(t.needs&&!t.needs()))continue;const d=Math.hypot(P.pos.x-t.pos.x,P.pos.z-t.pos.z);if(d<best){best=d;taskNow=t;}}
  if(taskNow&&P.alive){onUse=()=>{taskHold=9;};taskHold+=dt;banner(taskNow.label+(coarse?' · hold':' · hold, or press E'));
    if(taskHold>1){const t=taskNow;t.done=true;taskHold=0;onUse=null;if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();t.onDone();}}
  else{taskHold=0;if(onUse&&!taskNow)onUse=null;}}
function nextTaskWP(){const t=TASKS.find(t=>t.on&&!t.done&&!t.lore&&(!t.needs||t.needs()));return t?t.pos.clone().setY(t.pos.y+1.6):null;}
// the wreck: four jobs before anyone walks anywhere
const W=(dx,dz)=>V3(WRECK.x+dx,0,WRECK.z+dz);
let medKit=false;
const T_AMMO=task('ammo','Ammunition',WA(3,7.2),()=>{for(let g=0;g<3;g++){const A=P.ammo[g];A.res=Math.min(GUNS[g].max,A.res+Math.round(GUNS[g].max*.5));}say('t1','Sergeant Marsh','Four magazines each. That’s all of it.');});
const T_MED=task('med','Medical kit',WA(-5,-7.2),()=>{medKit=true;say('t2','Thorne','Med kit. Half of it’s broken.');});
const T_OKA=task('okafor','Stabilize Okafor',V3(0,0,0),()=>{OKAFOR.on=true;OKAFOR.hp=70;say('t3','Okafor','I’m fine. ...I’m fine. Let’s go.');},()=>medKit);
const T_CASE=task('case','Retrieve the case',WA(14.5,0),()=>{CASE.g.visible=true;say('t4','Sergeant Marsh','I’ve got it. It’s still warm.');});
const T_LOC=task('locator','Activate the emergency locator',WA(-10,6.6),()=>{say('t5','Ensign Landry','Locator’s up. If anyone’s listening, they know where we fell.');});
const SALVAGE=[T_AMMO,T_MED,T_OKA,T_CASE,T_LOC];
// the graveyard: two terminals, two orders
const T_ORD=TERMS.map((tm,i)=>task('order'+i,'Pull the orders from the terminal',tm.p,()=>{tm.done=true;tm.scr.material.color.copy(C(0x5aa0ff)).multiplyScalar(1.4);ordersFound++;if(ordersFound===2)ordersTalk();else say('o1','Thorne','One order. Same network as the others. There’s another terminal in that wreck.');}));
let ordersFound=0;
function ordersTalk(){PG.done('p2orders');[[0,'Thorne','Two orders. Same command network, same hour.'],[3.6,'Captain Rhen','Saying what?'],[2.2,'Thorne','One says protect the site. The other says destroy it.'],
  [3.6,'Sergeant Marsh','Which site?'],[2,'Thorne','Doesn’t say. Coordinates I can’t read.'],[3,'Captain Rhen','Bring them. Keep moving.']].reduce((t,[d,w,x])=>{t+=d;setTimeout(()=>PG.say(w,x),t*1000);return t;},0);}

/* ---------- the squad: follows a few metres behind you; Okafor sits by the wreck until he's patched; Landry keeps to the middle ---------- */
function squadFollow(spread){const sP=roadS(P.pos.x,P.pos.z);
  SQUAD.forEach((A,i)=>{if(A===OKAFOR&&!OKAFOR.on)return;const back=3.5+i*2.2,lat=(i%2?1:-1)*(1.6+i*.6)*spread;let g;
    if(sP<6||sideOf(P.pos.x,P.pos.z)&&Math.abs(latOf(P.pos.x,P.pos.z))>laneHalf(sP)-1){g=V3(P.pos.x+Math.sin(P.yaw)*back+Math.cos(P.yaw)*lat,0,P.pos.z+Math.cos(P.yaw)*back-Math.sin(P.yaw)*lat);if(playD(g.x,g.z)>-1)g.set(P.pos.x+Math.sin(P.yaw)*2,0,P.pos.z+Math.cos(P.yaw)*2);}
    else{const sc=sP-back,L=Math.max(1,laneHalf(Math.max(0,sc))-1.6);g=at(Math.max(0,sc),clamp(latOf(P.pos.x,P.pos.z)+lat,-L,L));}
    A.goal=g;});}
// Okafor, hurt: sitting against the hull until the med kit
OKAFOR.on=false;OKAFOR.pos.copy(WA(-1,7.4));T_OKA.pos.copy(OKAFOR.pos);
function poseOkafor(dt){if(OKAFOR.on)return;const H=OKAFOR.H;poseHuman(H,dt,0,0,false);H.crouchTo=1;H.root.rotation.y=WRECK.ry-Math.PI/2;H.head.rotation.x=.3;H.root.position.y=floorAt(OKAFOR.pos.x,OKAFOR.pos.z);}

/* ---------- the encounters ---------- */
let enc=new Set();
function once(k,fn){if(enc.has(k))return;enc.add(k);fn();}
function basinWar(){const n=4+(OD.n||0);
  for(let k=0;k<n;k++){herald('red',SH(228)+k*12,-30+R(-4,4),{hold:R(30,60)});herald('amber',SH(232)+k*12,30+R(-4,4),{hold:R(30,60)});}
  herald('red',SH(300),-26);herald('amber',SH(298),26);
  // Oct 24: a red Herald mech (Bryce's model) walks the red line across the basin, shelling amber, and turns on you if you close in
  if(typeof MECH!=='undefined'){const a=at(SH(262),-38),b=at(SH(234),-35);MECH.spawn(a.x,a.z,{path:[b,a],yaw:Math.PI/2});
    setTimeout(()=>PG.say('Okafor','Walker! Red walker, left side of the basin!','alert'),2600);setTimeout(()=>PG.say('Captain Rhen','Don’t trade rifles with it. Breaker, or go round.','alert'),5200);}}
function graveAmbush(){for(let k=0;k<3+(OD.n||0);k++)herald('amber',SH(340)+k*9,R(-10,10),{hold:R(12,20)});herald('red',SH(384),-14);}
// the canyon defence: both sides come up from the mouth, riflemen appear on both rims
// Oct 22: a minute and a half, not one; groups every five or six seconds; up to nine riflemen on the rims; and two big pushes, both
// sides at once, at 40 s and 70 s
// Oct 25 (Bryce: a small hold-out, the fight is on the way down the mountain): forty seconds now, one push
const DEF={t:0,max:40,spawnT:3,side:0,calmed:false,perches:0,push:1};
function defGroup(team,n){for(let k=0;k<n;k++){const p=at(ROAD_LEN-R(64,90),R(-7,7));const E=spawnTrooper(p.x,p.z,{team,hold:R(8,14)});if(E)E.goal=at(ROAD_LEN-R(18,30),R(-6,6));}}
function defSpawn(dt){
  if(DEF.push<2&&DEF.t>22){DEF.push++;defGroup('red',4+(OD.n||0));defGroup('amber',4+(OD.n||0));rimPerch('red',ROAD_LEN-R(30,50),-1);rimPerch('amber',ROAD_LEN-R(30,50),1);
    banner(DEF.push===1?'Both sides are pushing up the canyon':'Last push · hold','alert');}
  DEF.spawnT-=dt;if(DEF.spawnT>0)return;DEF.spawnT=R(4.5,6.5)/OD.rof;const team=DEF.side++%2?'amber':'red';
  defGroup(team,4+(OD.n||0));
  if(DEF.t>8&&DEF.perches<3){DEF.perches++;rimPerch(team,ROAD_LEN-R(30,64),rng()<.5?-1:1);}}

/* ---------- the dead ground isn't empty (Oct 22): three knots of Heralds fighting each other across the flats, so you fight your way
   through from the start, and one of their fighters making two strafing runs over you ---------- */
const SKIRM=[{s:74,lat:-6},{s:112,lat:8},{s:154,lat:-3}];
function skirmish(G){for(let k=0;k<3+(OD.n?1:0);k++){const red=k%2===0;herald(red?'red':'amber',G.s+R(-7,7),G.lat+(red?-1:1)*R(5,10),{hold:R(25,45)});}}
const STRAFER=(()=>{const K=SHIPKIT.wraith(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat()),new THREE.Mesh(K.glow,fleetGlowMat(0xff6a4a,2)));
  K.geo.computeBoundingBox();g.scale.setScalar(13/(K.geo.boundingBox.max.z-K.geo.boundingBox.min.z));MODELS.swapShip(g,'wraith',{ref:K.geo,tint:0xff6a5a});
  const e=glowSprite(0xff8a5a,2.4,2,.9);e.position.set(0,0,K.geo.boundingBox.max.z*.9);g.add(e);g.visible=false;scene.add(g);
  const st={on:false,t:0,runs:0,cool:0,from:new THREE.Vector3(),to:new THREE.Vector3()};
  function run(){const s=roadS(P.pos.x,P.pos.z),side=st.runs%2?1:-1;st.from.copy(at(s-160,side*70)).setY(60);st.to.copy(at(s+180,-side*50)).setY(70);st.on=true;st.t=0;st.runs++;g.visible=true;
    if(typeof sfx!=='undefined'&&sfx.whoosh)setTimeout(()=>sfx.whoosh(3,.22),2200);}
  const _a=new THREE.Vector3(),_b=new THREE.Vector3();
  function update(dt){if(!st.on)return;st.t+=dt;const u=st.t/7;if(u>=1){st.on=false;g.visible=false;return;}
    _a.lerpVectors(st.from,st.to,u);_a.y=lerp(60,22,Math.sin(u*Math.PI))+Math.sin(u*9)*1.5;g.position.copy(_a);_b.lerpVectors(st.from,st.to,Math.min(1,u+.02));_b.y=_a.y;g.lookAt(_a.clone().sub(_b).add(_a));g.rotateZ(Math.sin(u*Math.PI*2)*.25);
    // the strafe: bolts walking across the ground toward you while it is over you
    st.cool-=dt;if(u>.3&&u<.62&&st.cool<=0&&P.alive){st.cool=.11;const tg=P.pos.clone().add(new THREE.Vector3(R(-4,4),0,R(-4,4)));tg.y=floorAt(tg.x,tg.z);const from=g.position.clone();
      fire(from,tg,240,'rrifle',q=>{boom(q,R(1.5,2.5),0xff8a5a,.35);puff(q,1.4,1.2);if(P.alive&&Math.hypot(q.x-P.pos.x,q.z-P.pos.z)<1.8)hurtPlayer(9,from);});}}
  return{run,update,get runs(){return st.runs;},set runs(v){st.runs=v;}};})();
// something foreign, before the deep desert: an arch of the same pale stone as the vault walls on the moon, half sunk in the sand,
// older than anything the Heralds built here. Nobody can say what it was for
{const p=at(52,19),y=floorAt(p.x,p.z),G=new THREE.Group();G.position.set(p.x,y-2.4,p.z);G.rotation.set(.12,.7,.08);scene.add(G);
  const arch=new THREE.Mesh(new THREE.TorusGeometry(8,1.1,10,40,Math.PI),oldMat);arch.castShadow=arch.receiveShadow=true;G.add(arch);
  arch.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(arch.geometry.attributes.position.count*3).fill(.9),3));
  const glyph=new THREE.Mesh(new THREE.TorusGeometry(8,.07,4,40,Math.PI*.8),new THREE.MeshBasicMaterial({color:C(0xffd890).multiplyScalar(1.4)}));glyph.position.z=1.12;glyph.rotation.z=Math.PI*.1;G.add(glyph);
  for(const sx of[-8,8]){const f=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2.2,3,8),oldMat);f.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(f.geometry.attributes.position.count*3).fill(.85),3));f.position.set(sx,.6,0);G.add(f);
    const w=G.localToWorld(new THREE.Vector3(sx,0,0));OBST.push({x:w.x,z:w.z,r:2.2,h:6});}
}

/* ---------- the new stretch of dead ground (Oct 22) ----------
   The standing stone: a tall needle of the same pale stone, rings of gold glyphs climbing it, dark. When the case comes near it they
   light, one ring after another, and the case answers. (Draft lines, Claude's; Bryce rewrites.) */
const STONE=(()=>{const p=at(S_STONE,-9),G=new THREE.Group();G.position.set(p.x,floorAt(p.x,p.z)-1.2,p.z);G.rotation.set(.06,.4,-.05);scene.add(G);
  const g=new THREE.CylinderGeometry(.9,1.9,15,6,8);const P=g.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i)/15+.5;P.setX(i,P.getX(i)*(1-.12*Math.sin(y*5)));P.setZ(i,P.getZ(i)*(1-.12*Math.sin(y*5)));}g.computeVertexNormals();
  g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(P.count*3).fill(.9),3));const m=new THREE.Mesh(g,oldMat);m.position.y=7.5;m.castShadow=m.receiveShadow=true;G.add(m);
  const rings=[];for(let k=0;k<6;k++){const y=2.2+k*2.1,r=1.75-k*.14;const mat=new THREE.MeshBasicMaterial({color:C(0xffd890).multiplyScalar(1.6),transparent:true,opacity:.08,toneMapped:false});
    const t=new THREE.Mesh(new THREE.TorusGeometry(r,.05,4,40),mat);t.position.y=y;t.rotation.x=Math.PI/2;G.add(t);rings.push(t);}
  const halo=glowSprite(0xffd890,9,1.2,0);halo.position.y=9;G.add(halo);OBST.push({x:p.x,z:p.z,r:2,h:14});
  return{G,rings,halo,p:V3(p.x,0,p.z),lit:0};})();
function lightStone(u){STONE.lit=u;STONE.rings.forEach((r,i)=>{r.material.opacity=.08+.9*clamp(u*6-i,0,1);r.rotation.z+=.01*u;});STONE.halo.material.opacity=.45*u;}
// the hollow: red survivors dug in round their downed fighter; amber hunters coming in to finish them
function hollowFight(){const o=SIDES[0],n=OD.n||0;
  for(let k=0;k<3+n;k++){const a=k/(3+n)*Math.PI*2,x=o.cx+Math.cos(a)*8,z=o.cz+Math.sin(a)*8,an=V3(x,0,z);spawnTrooper(x,z,{team:'red',anchor:an,hold:R(30,50)});}
  for(let k=0;k<3+n;k++)herald('amber',248+k*7,R(-6,14),{hold:R(20,35)});}
function glassHold(){for(let k=0;k<3+(OD.n||0);k++){const s0=[310,326,338][k%3]+1.8,p=at(s0,R(-6,6));spawnTrooper(p.x,p.z,{team:'amber',anchor:p,hold:R(18,30)});}herald('red',330,14);}
function stoneAmbush(){const n=OD.n||0;for(let k=0;k<2+n;k++){herald('red',S_STONE+R(24,40),-18-R(0,6),{hold:R(12,20)});herald('amber',S_STONE+R(24,40),18+R(0,6),{hold:R(12,20)});}}
// the dead Herald in the ravine, and two things to look at (walk up and hold, or E): lore, not the way on
const BODY=(()=>{const o=SIDES[1],H=makeHuman('trooper');scene.add(H.root);MODELS.enemy(H,'red',{k:.3});H.root.position.set(o.cx-1.5,floorAt(o.cx,o.cz),o.cz);
  H.root.rotation.y=1.2;killHuman(H);return H;})();
const LORE=[
  task('recorder','The fighter’s flight recorder',V3(SIDES[0].cx+3.6,0,SIDES[0].cz+2),()=>{[[0,'Thorne','Flight recorder. He was talking to someone right up to the end.'],[3.4,'Captain Rhen','Saying what?'],
    [2.2,'Thorne','Same word, over and over. I don’t have it in the translator.'],[3.4,'Ensign Landry','Then how do you know it’s a word?'],[2.6,'Thorne','Because he was screaming it.']].reduce((t,[d,w,x])=>{t+=d;setTimeout(()=>PG.say(w,x),t*1000);return t;},0);}),
  task('slate','The dead Herald’s data slate',V3(SIDES[1].cx-.4,0,SIDES[1].cz+.6),()=>{[[0,'Thorne','Data slate. Red insignia. Same command network as the orders.'],[3.6,'Sergeant Marsh','Protect or destroy?'],
    [2.4,'Thorne','Neither. It’s a list of names. Most of them crossed out.'],[3.6,'Captain Rhen','His unit?'],[2.2,'Thorne','His side. The red side. He was counting who was left.']].reduce((t,[d,w,x])=>{t+=d;setTimeout(()=>PG.say(w,x),t*1000);return t;},0);})];
for(const t of LORE){t.on=true;t.lore=true;}

/* ---------- the director ---------- */
function director(dt){
  phT+=dt;markFoes(markList);markList=[];if(!P.alive)wentDown=true;
  const s=roadS(P.pos.x,P.pos.z);updateTasks(dt);poseOkafor(dt);STRAFER.update(dt);
  // the black glass burns
  if(P.alive&&P.input)for(const h of HAZ)if(Math.hypot(P.pos.x-h.x,P.pos.z-h.z)<h.r*.95){glassT=(glassT||0)+dt;if(glassT>.45){glassT=0;hurtPlayer(10.5);PG.fail('p2glass');banner('The glass is still burning · get off it','alert');}}
  if(phase==='salvage'){const left=SALVAGE.filter(t=>!t.done);PG.objective(left.length?'Salvage the wreck · '+(5-left.length)+' / 5':'Follow the beacon');WP=nextTaskWP();squadFollow(1);
    if(!left.length){setPhase('desert');ROVER.locked=false;banner('Follow the beacon');say('go','Captain Rhen','That’s everything. Landry, which way?');setTimeout(()=>PG.say('Ensign Landry','North, through the flats. The beacon’s steady.'),3000);
      setTimeout(()=>PG.say('Sergeant Marsh','The bay’s rover came out of her in one piece, Captain. Over by the trench. Wheels beat walking.'),6400);}}
  else if(phase==='desert'){const getIn=!VEH.cur&&!ROVER.dead&&s<40&&ROVER.g.position.distanceTo(P.pos)<70;
    PG.objective(getIn?'Take the rover (by the trench), or walk':'Follow the beacon across the dead ground');WP=getIn?ROVER.g.position.clone().setY(ROVER.g.position.y+3):at(Math.min(s+120,S_DRV0+20),0).setY(2);squadFollow(1);
    for(const G of SKIRM)if(s>G.s-60)once('sk'+G.s,()=>{skirmish(G);if(G.s===74)setTimeout(()=>PG.say('Thorne','Contact! Two sides, both Herald. They’re fighting each other!','alert'),700);});
    if(s>40)say('d0','Thorne','That arch. Same stone as the vault walls on the moon.');
    if(s>92&&STRAFER.runs===0){STRAFER.run();setTimeout(()=>PG.say('Okafor','Fighter! Coming in low!','alert'),900);}
    if(s>140&&STRAFER.runs===1)STRAFER.run();
    if(s>60)say('d1','Sergeant Marsh','Whole convoy. Burned where it stood.');
    if(s>92)say('d2','Ensign Landry','Ground’s still burning out there. Stay off the black glass.','alert');
    if(s>118)say('d3','Thorne','That pale stone again. Same as the vault walls.');
    if(s>128)once('scouts',()=>{for(let k=0;k<2+(OD.n||0);k++)herald('red',152+k*6,R(-8,8),{hold:R(10,18)});setTimeout(()=>PG.say('Okafor','Movement ahead! Red markings!','alert'),600);});
    // Oct 22: the longer dead ground
    if(s>196)once('hollow',()=>{hollowFight();setTimeout(()=>PG.say('Thorne','Smoke, off to the right. A fighter came down. Red survivors, and amber’s come to finish them.','alert'),800);});
    if(s>224)say('d4','Sergeant Marsh','We don’t need that fight, Captain. Unless you want what’s in that wreck.');
    if(s>244&&STRAFER.runs===2){STRAFER.run();setTimeout(()=>PG.say('Okafor','Fighter, again! Get down!','alert'),900);}
    if(s>252)once('glass',()=>{glassHold();setTimeout(()=>PG.say('Ensign Landry','Glass field. All of it’s still burning. Slow, Captain. Step where I step.','alert'),500);});
    if(s>286&&!stoneSeen&&P.alive){stoneSeen=true;setPhase('stonecut');WP=null;stoneScene();return;}
    if(s>S_DRV0){setPhase('drive');}}
  else if(phase==='drive'){PG.objective((VEH.cur===ROVER?'Drive north through the settlements':'Follow the beacon north')+' · '+Math.max(0,Math.round(S_BASIN-s))+' m');
    WP=at(Math.min(s+120,S_BASIN+10),0);WP.y+=2.5;squadFollow(1);driveFights(s);
    if(s>S_BASIN-60)say('d5','Thorne','Gunfire up ahead. A lot of it. Sounds like an army.');
    if(s>S_BASIN-24){setPhase('basin');}}
  else if(phase==='basin'){once('war',basinWar);
    // the war keeps going while you cross: each side feeds men in from its own flank, ahead of you
    basinT-=dt;if(basinT<=0&&s<S_GRAVE-20){basinT=R(8,11);for(const team of['red','amber']){const live=ENEMIES.filter(E=>!E.H.dead&&E.team===team).length;if(live<4+(OD.n||0))herald(team,clamp(s+R(30,60),S_BASIN,S_GRAVE-14),(team==='red'?-1:1)*R(34,42),{hold:R(30,60)});}}PG.objective('Get through the basin · both sides will fire on you');WP=at(S_GRAVE+8,0).setY(2);squadFollow(1.3);
    if(phT>1)say('w1','Sergeant Marsh','Same uniforms.');if(phT>3.4)say('w2','Thorne','Different insignias.');if(phT>5.4)say('w3','Captain Rhen','Civil war?');
    if(phT>7.2)say('w4','Thorne','Looks that way.');if(phT>9.4)say('w5','Sergeant Marsh','Thought they were supposed to be invading us.');if(phT>12.4)say('w6','Captain Rhen','Keep moving.');
    if(s>S_GRAVE-6)setPhase('grave');}
  else if(phase==='grave'){once('ambush',graveAmbush);for(const t of T_ORD)t.on=true;PG.objective(ordersFound<2?'Thorne: pull the orders from the wrecks · '+ordersFound+' / 2 (or move on)':'Follow the beacon into the canyon');
    WP=ordersFound<2?nextTaskWP():at(S_CANYON+12,0).setY(2);squadFollow(1);if(s>S_CANYON-12&&!cliffSeen&&P.alive){cliffSeen=true;setPhase('cliffcut');WP=null;cliffScene();return;}}
  else if(phase==='canyon'){const inW=VEH.cur===WALKER;PG.objective(!inW&&!WALKER.dead&&s<S_DESC0+20?'Take the walker down the mountain (or go on foot)':'Get down the mountain to Dropship Two · '+Math.max(0,Math.round(ROAD_LEN-30-s))+' m');
    WP=!inW&&!WALKER.dead&&s<S_DESC0+20?WALKER.g.position.clone().setY(WALKER.g.position.y+7.5):at(Math.min(s+70,ROAD_LEN-20),0).setY(at(Math.min(s+70,ROAD_LEN-20),0).y+3);squadFollow(.8);
    for(const [ss,who,txt] of DESC_RADIO)if(s>ss)say('dr'+ss,who,txt);
    descentFights(s);
    // Oct 22: the canyon is three times as long, and it's held

    if(s>S_CANYON+130)once('rav',()=>{for(let k=0;k<2+(OD.n||0);k++){const o=SIDES[1];spawnTrooper(o.cx+R(-3,3),o.cz+R(-3,3),{team:'amber',hold:R(10,20)});}
      setTimeout(()=>PG.say('Thorne','Side ravine, left! Someone’s sheltering in there.','alert'),400);});
    if(s>S_CANYON+150)say('c3','Ensign Landry','Beacon’s close. A few hundred metres.');
    if(s>ROAD_LEN-34){if(VEH.cur)VEH.exit();setPhase('ds2cut');ds2Scene();}}
  else if(phase==='defend'){DEF.t+=dt;const left=Math.max(0,DEF.max-DEF.t);PG.objective(left>0?'Hold the canyon while Landry brings the core back · '+Math.ceil(left)+' s':'She’s up · get to the ship');
    WP=null;LANDRY.goal=V3(DS2.x+1,0,DS2.z-1);[MARSH,OKAFOR,THORNE].forEach((A,i)=>{A.goal=at(ROAD_LEN-22-i*3,(i-1)*5);});
    coreGlow.material.opacity=.3+.6*(DEF.t/DEF.max)*(.7+.3*Math.sin(T*6));
    if(left>0)defSpawn(dt);
    for(const [t,who,txt,tone] of DEF_RADIO)if(DEF.t>t)say('dr'+t,who,txt,tone);
    // once, near the case, it simply stops: everyone close to it holds fire for a few seconds. Nobody explains it
    if(DEF.t>14&&!DEF.calmed){DEF.calmed=true;CASE.pulse=1;flashScreen(.12);if(typeof sfx!=='undefined'&&sfx.wake)sfx.wake();
      for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(MARSH.pos)<45)E.calm=R(4,6);
      setTimeout(()=>PG.say('Okafor','Did they just... stop?'),900);setTimeout(()=>PG.say('Sergeant Marsh','Don’t ask. Shoot.','alert'),3600);}
    if(left<=0&&!ENEMIES.some(E=>!E.H.dead&&E.pos.distanceTo(P.pos)<40)){setPhase('endcut');endScene();}}
  // the last few on the field get markers
  if(phaseFight()){const live=ENEMIES.filter(E=>!E.H.dead&&!E.gunner&&E.pos.distanceTo(P.pos)<90);if(live.length&&live.length<=3)markList=live.map(E=>{const v=E.pos.clone().setY(E.pos.y+2.6);v.team=E.team;return v;});}
  if(phase!=='salvage'&&phase!=='brief'&&phase!=='intro')P.spawn.copy(at(Math.max(-6,s-20),0));
}
let glassT=0,basinT=6,stoneSeen=false,scarSeen=false,cliffSeen=false;
/* ---------- the walker (Oct 25, Bryce: a mech at the canyon's entrance, to fight down the mountain in) ----------
   A red Herald walker stopped at the canyon's mouth, its pilot dead beside it. Climb in (E or USE): js/shared/vehicles.js */
/* ---------- the rover (Oct 25, Bryce: start with a rover the team finds near the crash, drive it through the settlements, then the
   walker at the canyon's mouth): the dropship's bay rover, thrown clear in the crash, upright by the trench. It's yours once the
   wreck is salvaged; it carries all five of you (js/shared/vehicles.js), and it stops at the top of the mountain ---------- */
const ROVER=(()=>{const p=at(30,12),q=at(40,12);const V=VEH.addRover(p.x,p.z,Math.atan2(-(q.x-p.x),-(q.z-p.z)));V.locked=true;
  V.bound=(x,z)=>roadS(x,z)<S_CANYON-6;return V;})();
const WALKER=(()=>{const p=at(S_CANYON+11,-4),q=at(S_CANYON+30,0);return VEH.addWalker(p.x,p.z,Math.atan2(-(q.x-p.x),-(q.z-p.z)));})();
const PILOT=(()=>{const H=makeHuman('trooper');scene.add(H.root);MODELS.dress(H,'host',{tint:0x7a4440,lift:{c:0x9a1808,k:.3}});const p=WALKER.g.position;H.root.position.set(p.x+3.2,floorAt(p.x+3.2,p.z+1.5),p.z+1.5);H.root.rotation.y=2.2;killHuman(H);return H;})();
VEH.onEnter=V=>{if(V===ROVER){say('rv1','Thorne','Gun turns with your helmet, Captain. Point it, we’ll hang on.');if(!said.has('rv1b'))setTimeout(()=>say('rv1b','Okafor','First good thing that’s happened all day.'),3400);}
  if(V===WALKER){say('wk1','Thorne','Controls are Herald, but a stick is a stick. Guns on the trigger, cannons on the grenade key.');setTimeout(()=>say('wk2','Okafor','Now that’s more like it.'),3200);}};
VEH.onDestroy=V=>{if(V===ROVER)setTimeout(()=>PG.say('Okafor','Rover’s gone! We walk from here!','alert'),600);if(V===WALKER)setTimeout(()=>PG.say('Sergeant Marsh','Walker’s gone! On foot! Keep moving down!','alert'),500);};
// the character scene, over the radio while the core comes back (Bryce's lines from the S2 outline)
// (the hold is forty seconds now: the Marsh and Rhen exchange moved to the walk down the mountain, DESC_RADIO below)
const DEF_RADIO=[[2,'Ensign Landry','Core’s cold but it’s whole. Give me forty seconds.','alert'],[10,'Thorne','They followed us down the mountain!','alert'],
  [20,'Ensign Landry','Core’s at sixty percent. Keep them off me!','alert'],[26,'Okafor','On the rock! Above us!','alert'],[31,'Sergeant Marsh','Last push! Make it count!','alert'],[38,'Ensign Landry','She’s up! She’s up!','alert']];
const DESC_RADIO=[[S_DESC0+60,'Sergeant Marsh','We should leave that thing here.'],[S_DESC0+76,'Captain Rhen','No.'],[S_DESC0+90,'Sergeant Marsh','We lost our ship for it.'],
  [S_DESC0+150,'Captain Rhen','They destroyed our ship to keep it.'],[S_DESC0+170,'Sergeant Marsh','That doesn’t make it worth another life.'],[S_DESC0+188,'Captain Rhen','I know.'],
  [S_DESC0+250,'Sergeant Marsh','Then why are we carrying it?'],[S_DESC0+268,'Captain Rhen','Because I need to know what they’re afraid of.']];

/* ---------- the drive (Oct 25): the three Herald settlements (js/pathfinder2/01-world.js, S_SETS) ----------
   the outpost: amber, in the street and on the roofs and the tower, more at its far gate; then the fighter
   the village: red, the biggest fight: the street, the roofs, both towers, and their walker on the square
   the burning one: both sides, at each other across the street; you drive through the middle of it */
function roofRifles(S,team,n){const spots=SET_ROOFS.filter(Rf=>Rf.s>S.s0-4&&Rf.s<S.s1+4&&(!team||Rf.team===team)&&!Rf.used).sort(()=>rng()-.5);
  for(const Rf of spots.slice(0,n)){Rf.used=true;const E=spawnTrooper(Rf.x+R(-1.2,1.2),Rf.z+R(-1.2,1.2),{team:Rf.team,perch:true});if(E)E.pos.y=Rf.y+.1;}}
function driveFights(s){const n=OD.n||0,[SO,SV,SB]=S_SETS;
  if(s>SO.s0-110)once('so',()=>{for(let k=0;k<(3+n)*2;k++)herald('amber',SO.s0+R(14,SO.s1-SO.s0-10),R(-7,7),{hold:R(14,26)});roofRifles(SO,'amber',4+n);
    setTimeout(()=>PG.say('Okafor','Buildings ahead! Amber flags on the gate!','alert'),400);setTimeout(()=>PG.say('Thorne','Herald outpost. People live out here.'),3400);
    setTimeout(()=>PG.say('Sergeant Marsh','Then they’ll fight for it. Through the gate, Captain. Don’t stop.','alert'),6600);});
  if(s>SO.s1-40)once('so2',()=>{for(let k=0;k<3+n;k++)herald('amber',SO.s1+R(8,26),R(-9,9),{hold:R(10,18)});});
  if(s>SO.s1+50)once('drvStrafe',()=>{STRAFER.run();setTimeout(()=>PG.say('Okafor','Fighter! Coming in down the road!','alert'),900);});
  if(s>SV.s0-130)once('sv',()=>{saveCP('village');banner('Checkpoint · '+CP_NAME.village);
    for(let k=0;k<(4+n)*2;k++)herald('red',SV.s0+R(10,SV.s1-SV.s0-10),R(-7,7),{hold:R(14,26)});roofRifles(SV,'red',6+n);
    if(typeof MECH!=='undefined'){const VSQ=(SV.s0+SV.s1)/2,a=at(VSQ-14,4),b=at(VSQ+14,4);MECH.spawn(a.x,a.z,{path:[b,a],yaw:0});}
    setTimeout(()=>PG.say('Thorne','Red banners. This one’s theirs. Bigger.','alert'),500);setTimeout(()=>PG.say('Ensign Landry','There’s a hall in the middle. Something big standing in front of it.','alert'),3600);
    setTimeout(()=>PG.say('Captain Rhen','Walker. Keep moving, keep it off the rover.','alert'),6800);});
  if(s>(SV.s0+SV.s1)/2)once('sv2',()=>{for(let k=0;k<3+n;k++)herald('red',SV.s1+R(4,24),R(-9,9),{hold:R(10,18)});});
  if(s>SB.s0-110)once('sb',()=>{for(let k=0;k<4+n;k++){herald('red',SB.s0+R(10,SB.s1-SB.s0-10),-R(4,8),{hold:R(25,45)});herald('amber',SB.s0+R(10,SB.s1-SB.s0-10),R(4,8),{hold:R(25,45)});}
    roofRifles(SB,null,4+n);setTimeout(()=>PG.say('Okafor','Smoke! That whole place is burning!','alert'),400);
    setTimeout(()=>PG.say('Sergeant Marsh','Both sides in there. Each other first, us second. Straight through the middle.','alert'),3600);});
  if(s>SB.s1-10)say('dv1','Ensign Landry','Beacon’s stronger. Past the next ridge. There’s fighting on it.');}
/* ---------- down the mountain (Oct 25): both sides coming up the path at you, riflemen on the rock above, a red walker, the fighter ---------- */
function descentFights(s){const n=OD.n||0;
  if(s>S_DESC0+8)once('dc1',()=>{for(let k=0;k<4+n;k++)herald('amber',S_DESC0+R(70,95),R(-6,6),{hold:R(10,18)});rimPerch('amber',S_DESC0+62,-1);rimPerch('amber',S_DESC0+84,-1);
    setTimeout(()=>PG.say('Thorne','Amber, coming up the path! And on the rock above!','alert'),500);});
  if(s>S_DESC0+70)once('dc2',()=>{for(let k=0;k<4+n;k++)herald('red',S_DESC0+R(150,175),R(-6,6),{hold:R(12,20)});
    if(typeof MECH!=='undefined'){const a=at(S_DESC0+178,0),b=at(S_DESC0+128,0);MECH.spawn(a.x,a.z,{path:[b,a],yaw:0});setTimeout(()=>PG.say('Okafor','Red walker, coming up the mountain at us!','alert'),1800);}});
  if(s>S_DESC0+130)once('dc3',()=>{STRAFER.run();setTimeout(()=>PG.say('Sergeant Marsh','Fighter! Coming down the slope!','alert'),900);
    for(let k=0;k<3+n;k++){herald('red',S_DESC0+R(205,225),R(-6,0),{hold:R(20,40)});herald('amber',S_DESC0+R(215,235),R(0,6),{hold:R(20,40)});}});
  if(s>S_DESC0+190)once('dc4',()=>{saveCP('descent');banner('Checkpoint · '+CP_NAME.descent);for(let k=0;k<3+n;k++){const p=at(S_DESC0+[262,272,282][k%3]+1.8,R(-4,4));spawnTrooper(p.x,p.z,{team:'amber',anchor:p,hold:R(14,24)});}
    rimPerch('amber',S_DESC0+252,-1);rimPerch('red',S_DESC0+276,-1);});
  if(s>S_DESC0+262)once('dc5',()=>{STRAFER.run();for(let k=0;k<4+n;k++)herald(k%2?'red':'amber',ROAD_LEN-R(50,72),R(-5,5),{hold:R(10,18)});rimPerch('red',ROAD_LEN-72,-1);
    setTimeout(()=>PG.say('Ensign Landry','I can see her! Almost there!','alert'),600);});}
// cover on the way down: broken rock across the path and stretches of low wall, alternating sides
for(const [k,lat,w] of[[34,-4,5],[58,4,5],[96,-3,6],[122,4,5],[160,-4,5],[196,3,6],[230,-4,5],[258,4,5],[292,-3,6],[326,3,5],[356,-4,5]]){const ss=S_DESC0+k,p=at(ss,lat),n=roadN(ss);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.4,.4),w);}
for(const [k,lat,t] of[[40,0,'ammo'],[110,3,'med'],[170,-3,'rocket'],[240,0,'ammo'],[300,3,'med'],[350,-2,'rocket']]){const p=at(S_DESC0+k,lat);addPick(t,p.x,p.z);}
/* ---------- cutscenes ---------- */
const crew=()=>[P.H,...SQUAD.map(A=>A.H)];
/* the canyon's mouth (Oct 25, Bryce: the same look at her, from the cliff side, down): the team at the lip of the mountain, Dropship Two
   far below on the basin floor, the walker standing over its dead pilot, and both sides coming up behind */
function offVeh(){if(VEH.cur)VEH.exit();}
function cliffScene(){offVeh();
  // the rover stays parked at the top (it can't go down the mountain)
  if(!ROVER.dead){const rp=at(S_CANYON-18,-9),q=at(S_CANYON-8,-9);ROVER.g.position.copy(rp);ROVER.yaw=Math.atan2(-(q.x-rp.x),-(q.z-rp.z));ROVER.g.rotation.set(0,ROVER.yaw,0);ROVER.v=0;ROVER.ob.x=rp.x;ROVER.ob.z=rp.z;}
  for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(P.pos)<80){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  const team=[P,...SQUAD],s0=S_CANYON+5;team.forEach((A,i)=>{(A.pos||A.H.root.position).copy(at(s0-i*1.7,5.5+i*1.3));});
  const edge=at(S_CANYON+9,11),D=V3(DS2.x,DS2Y+3,DS2.z),W=WALKER.g.position;
  const live=(t,dt,look)=>team.forEach(A=>{const p=A.pos||A.H.root.position,L=look||D;p.y=floorAt(p.x,p.z);A.H.root.rotation.y=Math.atan2(-(L.x-p.x),-(L.z-p.z));poseHuman(A.H,dt,0,0,false);});
  const v=V3();
  playCut([
    {dur:6.5,camAt:(u,t,o)=>o.set(edge.x-2.5+u*1.5,edge.y+5.2-u*.8,edge.z+10-u*2),lookAt:(u,t,o)=>o.lerpVectors(v.set(edge.x+26,edge.y-24,edge.z-110),D,sstep(0,1,u)),score:'awe',
      say:[[.8,'Ensign Landry','That’s her. That’s Dropship Two.'],[0,'Okafor','All the way down there?']],fn:(t,dt)=>live(t,dt)},
    {dur:7.5,camAt:(u,t,o)=>o.set(D.x+74-u*12,D.y+40-u*7,D.z+96-u*16),lookAt:(u,t,o)=>o.copy(TWO.position),
      say:[[.5,'Ensign Landry','She came down the mountain sideways. He kept her nose up the whole way.'],[0,'Sergeant Marsh','Pilot’s good.'],[0,'Ensign Landry','Pilot was. You don’t land like that and walk away.']],fn:(t,dt)=>live(t,dt)},
    {dur:7,camAt:(u,t,o)=>o.set(W.x+6.5-u,W.y+2.4+u*.6,W.z+8-u*1.4),lookAt:(u,t,o)=>o.set(W.x,W.y+3.6+u,W.z),
      say:[[.4,'Thorne','Captain. A walker. Red insignia.'],[0,'Thorne','The pilot’s dead. It isn’t.'],[0,'Captain Rhen','Then it walks us down.']],fn:(t,dt)=>live(t,dt,W)},
    {dur:4.5,cam:[[edge.x-6,edge.y+3,edge.z-6]],look:[[edge.x,edge.y+2,edge.z+80]],
      say:[[.3,'Okafor','Both sides. Coming up behind us.','alert'],[0,'Captain Rhen','Then we don’t stop. Down.','alert']],fn:(t,dt)=>live(t,dt,v.set(edge.x,0,edge.z+80))},
  ],()=>{setPhase('canyon');banner(coarse?'The walker · tap USE beside it':'The walker · walk up to it and press E','alert');
    const n=OD.n||0;for(let k=0;k<3+n;k++)herald('amber',S_CANYON-R(40,60),R(-8,8),{hold:R(10,16)});for(let k=0;k<2+n;k++)herald('red',S_CANYON-R(60,80),R(-8,8),{hold:R(10,18)});});
}
function introScene(done){
  /* the opening (Oct 22: it read as everyone milling round the ship). Dawn after the crash: the trench from above, the wreck smoking at
     the end of it, then the team coming to, each doing one thing: Marsh with Okafor against the hull, Thorne up on the debris
     watching the flats with her rifle up, Landry on her knees at the open panel with the signal, Rhen walking down to her. */
  setLook('desert');const X=WRECK.x,Z=WRECK.z,face=(A,p)=>Math.atan2(-(p.x-A.x),-(p.z-A.z));
  const oka=OKAFOR.pos,mP=WA(-1,9.2),tP=WA(6,10.5),lP=WA(-9,6),rP0=WA(10,16),rP1=WA(-6,9);
  MARSH.pos.copy(mP);THORNE.pos.copy(tP);LANDRY.pos.copy(lP);P.pos.copy(rP0);P.yaw=0;
  const flats=at(80,0),rv=new THREE.Vector3();
  const live=(t,dt,walk)=>{const k=walk==null?0:walk;P.pos.lerpVectors(rP0,rP1,k);
    for(const A of[MARSH,THORNE,LANDRY])A.H.root.position.y=floorAt(A.pos.x,A.pos.z);P.H.root.position.y=floorAt(P.pos.x,P.pos.z);
    MARSH.H.crouchTo=.85;MARSH.H.root.rotation.y=face(mP,oka);poseHuman(MARSH.H,dt,0,0,false);
    THORNE.H.aimPitch=0;THORNE.H.root.rotation.y=face(tP,flats);poseHuman(THORNE.H,dt,0,1,false);
    LANDRY.H.crouchTo=.75;LANDRY.H.root.rotation.y=face(lP,WRECK)+.4;poseHuman(LANDRY.H,dt,0,0,false);
    P.H.root.rotation.y=face(P.pos,lP);poseHuman(P.H,dt,walk>0&&walk<1?1.4:0,0,false);poseOkafor(dt);
    for(const sm of wreckSmoke)if(rng()<.35*sm.k)puff(sm.p.clone().add(V3(R(-1,1),0,R(-1,1))),R(2,4),4);};
  let wk=0;
  playCut([
    {dur:3.5,black:true,small:'Pathfinder · Arc 02 · 09.03.2237',cap:'Dead Ground',cam:[[X+60,40,Z+90]],look:[[X,3,Z]],fn:(t,dt)=>live(t,dt,0),score:'sorrow'},
    // high over the trench at dawn, the wreck smoking at the end of it, the dead flats running north
    {dur:7,cam:[[X+60,40,Z+90],[X+30,16,Z+40]],look:[[X,2,Z],[X,2.5,Z-4]],fn:(t,dt)=>live(t,dt,0)},
    // Marsh, kneeling with Okafor against the hull
    {dur:5,cam:[[X+1,1.4,Z+3],[X+.5,1.5,Z+3.5]].map(c=>{const q=WA(1.5,12.5);return[q.x+(c[0]-X)*.2,c[1],q.z+(c[2]-Z)*.2];}),look:[[oka.x,1,oka.z]],
      say:[[.8,'Sergeant Marsh','Stay with me. Look at me. You’re fine.'],[0,'Okafor','I’m fine.']],fn:(t,dt)=>live(t,dt,0)},
    // Thorne on the wreckage, watching the flats
    {dur:4,cam:[[tP.x+3,1.8,tP.z+4],[tP.x+2.4,1.7,tP.z+3.2]],look:[[flats.x,4,flats.z]],say:[[.4,'Thorne','Nothing moving. For now.']],fn:(t,dt)=>live(t,dt,0)},
    // Landry at the open panel, and Rhen coming down to her
    {dur:7,camAt:(u,t,o)=>o.copy(lP).add(rv.set(2.2,1.3,3)),lookAt:(u,t,o)=>o.copy(lP).add(rv.set(0,.9,0)),
      say:[[.8,'Ensign Landry','I’ve got a signal.'],[0,'Captain Rhen','From the Pathfinder?'],[0,'Ensign Landry','No, sir. Emergency beacon. Keeper frequency.']],fn:(t,dt)=>{wk=Math.min(1,wk+dt/6);live(t,dt,wk);}},
    {dur:7,cam:[[X+8,2.4,Z+16],[X+7,2.2,Z+14]],look:[[lP.x,1.4,lP.z]],
      say:[[.3,'Sergeant Marsh','Another survivor?'],[0,'Ensign Landry','Could be Dropship Two.'],[0,'Thorne','How far?'],[0,'Ensign Landry','Far enough that we’re not walking there before dark.']],fn:(t,dt)=>live(t,dt,1)},
    {dur:5,camAt:(u,t,o)=>o.copy(P.pos).add(rv.set(1.2,1.7,-2.4+u*.4)),lookAt:(u,t,o)=>o.copy(P.pos).add(rv.set(0,1.6,0)),say:[[.4,'Captain Rhen','Then we move now. Take what we can carry.']],fn:(t,dt)=>live(t,dt,1)},
  ],()=>{THORNE.H.aimPitch=0;MARSH.H.crouchTo=LANDRY.H.crouchTo=0;done&&done();});
}
// the standing stone (Oct 22): the case comes near it and it wakes, ring by ring. Thorne scans it. Then horns: both sides saw that
function stoneScene(){offVeh();
  for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(P.pos)<60){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  const team=[P,...SQUAD],S=STONE.p,dir=at(S_STONE+10,0).sub(at(S_STONE-10,0)).normalize(),side=V3(-dir.z,0,dir.x);
  const spot=(i)=>V3(S.x-dir.x*(6+i*1.4)+side.x*(i-2)*1.8,0,S.z-dir.z*(6+i*1.4)+side.z*(i-2)*1.8);
  team.forEach((A,i)=>{(A.pos||A.H.root.position).copy(spot(i));});
  const live=(t,dt,walk)=>team.forEach((A,i)=>{const p=A.pos||A.H.root.position;p.y=floorAt(p.x,p.z);A.H.root.rotation.y=Math.atan2(-(S.x-p.x),-(S.z-p.z));poseHuman(A.H,dt,0,A===THORNE&&walk?1:0,false);});
  const rv=new THREE.Vector3();
  playCut([
    {dur:6,camAt:(u,t,o)=>o.set(S.x-dir.x*20+side.x*7,2.2+u,S.z-dir.z*20+side.z*7),lookAt:(u,t,o)=>o.set(S.x,6+u*3,S.z),score:'awe',
      say:[[.8,'Thorne','Captain. Another one. Bigger.']],fn:(t,dt)=>{live(t,dt);lightStone(0);}},
    {dur:6.5,camAt:(u,t,o)=>o.set(S.x+side.x*4.5-dir.x*3,1.6+u*2,S.z+side.z*4.5-dir.z*3),lookAt:(u,t,o)=>o.set(S.x,2.5+u*6,S.z),
      say:[[1.4,'Okafor','It’s lighting up.']],fn:(t,dt)=>{live(t,dt);lightStone(Math.min(1,t/6));if(t<.1&&typeof sfx!=='undefined'&&sfx.wake)sfx.wake();}},
    {dur:6.5,camAt:(u,t,o)=>o.copy(MARSH.pos).add(rv.set(side.x*1.6-dir.x*1.8,1.7,side.z*1.6-dir.z*1.8)),lookAt:(u,t,o)=>o.copy(MARSH.pos).add(rv.set(0,1.3,0)),
      say:[[.5,'Sergeant Marsh','It’s the case. It’s doing it again.'],[0,'Ensign Landry','Again?'],[0,'Sergeant Marsh','On the moon. Right before every light went out.']],
      fn:(t,dt)=>{live(t,dt);lightStone(1);if(t<.1){CASE.pulse=1;flashScreen(.1);}}},
    {dur:7,camAt:(u,t,o)=>o.copy(THORNE.pos).add(rv.set(-side.x*1.4-dir.x*1.2,1.8,-side.z*1.4-dir.z*1.2)),lookAt:(u,t,o)=>o.set(S.x,4+u*4,S.z),
      say:[[.5,'Thorne','Same stone as the vault on the moon. Same as the arch. And the markings run one way. North.'],[0,'Captain Rhen','Where the beacon’s taking us anyway.'],[0,'Thorne','Yes, sir. That’s what bothers me.']],
      fn:(t,dt)=>{live(t,dt,1);lightStone(1);}},
    {dur:4.5,cam:[[S.x-dir.x*14,3,S.z-dir.z*14],[S.x-dir.x*12,3.4,S.z-dir.z*12]],look:[[S.x+dir.x*60,4,S.z+dir.z*60]],
      say:[[.3,'Okafor','Horns. Both directions.','alert'],[0,'Captain Rhen','They saw that. Move.','alert']],
      fn:(t,dt)=>{live(t,dt);lightStone(1);if(t<.1&&typeof sfx!=='undefined'&&sfx.horn)sfx.horn(at(S_STONE+40,0));}},
  ],()=>{setPhase('desert');saveCP('stone');stoneAmbush();banner('Checkpoint · '+CP_NAME.stone);
    // Oct 25 (Bryce: after the stone glows, give an effect for a little bit): its light stays on you for a minute
    bless(60,'THE STONE’S LIGHT','Half the damage, faster on your feet, wounds closing');setTimeout(()=>PG.say('Okafor','Captain... you’re glowing.'),2600);setTimeout(()=>PG.say('Thorne','So is the case. Whatever that stone did, it’s on us now.'),5200);});
}
// Dropship Two's scar (Oct 22): her furrow starts here, panels of her hull along it. Landry reads it like a log
function scarScene(){offVeh();
  const team=[P,...SQUAD],s0=ROAD_LEN-150,dir=at(s0+10,0).sub(at(s0,0)).normalize(),c=at(s0+6,0);
  for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(P.pos)<50){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  team.forEach((A,i)=>{(A.pos||A.H.root.position).copy(at(s0-2-i*1.6,(i-2)*1.6));});
  const live=(t,dt)=>team.forEach(A=>{const p=A.pos||A.H.root.position;p.y=floorAt(p.x,p.z);A.H.root.rotation.y=Math.atan2(-dir.x,-dir.z);poseHuman(A.H,dt,0,0,false);});
  playCut([
    {dur:6,cam:[[c.x-dir.x*16,1.2,c.z-dir.z*16],[c.x-dir.x*12,1.6,c.z-dir.z*12]],look:[[c.x+dir.x*60,1,c.z+dir.z*60]],
      say:[[.6,'Ensign Landry','That’s her. That’s Dropship Two’s scar.']],fn:live},
    {dur:7,camAt:(u,t,o)=>o.copy(LANDRY.pos).add(V3(dir.z*1.6,1.6,-dir.x*1.6)),lookAt:(u,t,o)=>o.copy(LANDRY.pos).add(V3(dir.x*6,.4,dir.z*6)),
      say:[[.4,'Ensign Landry','She came in sideways. See the panels? He kept her nose up the whole way down.'],[0,'Sergeant Marsh','Pilot’s good.'],[0,'Ensign Landry','Pilot was. You don’t land like that and walk away.']],fn:live},
    {dur:5,cam:[[c.x+dir.x*4,2,c.z+dir.z*4]],look:[[c.x-dir.x*80,6,c.z-dir.z*80]],
      say:[[.3,'Thorne','Captain. Behind us. Both sides, coming up the canyon.','alert'],[0,'Captain Rhen','Then we don’t stop. Go.','alert']],fn:live},
  ],()=>{setPhase('canyon');const n=OD.n||0;for(let k=0;k<3+n;k++)herald('amber',s0-R(30,46),R(-5,5),{hold:R(10,16)});for(let k=0;k<2+n;k++)herald('red',s0+R(40,56),R(-5,5),{hold:R(10,18)});
    rimPerch('red',s0+30,-1);banner('They’re coming up behind you','alert');});
}
// Dropship Two: on her side at the end of the canyon; someone alive in the cockpit; and they're coming up behind
function ds2Scene(){
  const X=DS2.x,Z=DS2.z;for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(P.pos)<40){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  const team=[P,...SQUAD];team.forEach((A,i)=>{A.pos.copy(at(ROAD_LEN-30-i*1.5,(i-2)*2));});
  const live=(t,dt)=>{team.forEach(A=>{A.H.root.position.y=floorAt(A.pos.x,A.pos.z);A.H.root.rotation.y=Math.PI;poseHuman(A.H,dt,0,0,false);});};
  playCut([
    {dur:6,cam:[[X+14,(4)+DS2Y,Z+30],[X+10,(3)+DS2Y,Z+20]],look:[[X+3,(3)+DS2Y,Z-6]],say:[[.6,'Ensign Landry','Dropship Two. Her core’s still warm.']],fn:live},
    {dur:6,cam:[[X+6,(2)+DS2Y,Z+4],[X+5,(2.2)+DS2Y,Z+2.6]],look:[[X+3,(3)+DS2Y,Z-6]],say:[[.3,'Okafor','Pilot’s still in the seat.'],[0,'Sergeant Marsh','...He’s gone. Hours ago.'],[1,'Captain Rhen','He kept that beacon running for us.'],[.8,'Captain Rhen','Landry. Can you get her up?'],[0,'Ensign Landry','Maybe. Give me a minute. Maybe two.']],fn:live},
    {dur:5,cam:[[X-2,(2)+DS2Y,Z+18]],look:[[X-2,(4)+DS2Y,Z+80]],say:[[.4,'Thorne','Contacts at the canyon mouth. Both sides.','alert'],[0,'Captain Rhen','Then we give them two.']],fn:live},
  ],()=>{setPhase('defend');banner('Hold the canyon','alert');P.spawn.copy(at(ROAD_LEN-24,0));});
}
/* the end (Oct 22: the ending carries straight into Arc 03, without arriving: Arc 03 opens on the approach).
   ~ the reveal: the case pulses in Marsh's hands; its light points north over the rim; the white city on the horizon. Thorne's line.
   ~ the lead-in: Dropship Two hauls herself upright on her engines and lifts out of the canyon with the five of them aboard, what's left
     of the day going red behind her; she turns north, small against that light, and Landry gives them one flight. Cut before arrival. */
function endScene(){
  for(const E of ENEMIES)if(!E.H.dead){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  const X=DS2.x,Z=DS2.z,team=[P,...SQUAD];team.forEach((A,i)=>{A.pos.copy(V3(X+(i-2)*1.8,0,Z+10));});CASE.g.visible=true;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.05,.6,600,8,1,true).translate(0,300,0),new THREE.MeshBasicMaterial({color:C(0xc8d4ff).multiplyScalar(1.6),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  scene.add(beam);
  const live=(t,dt)=>{team.forEach(A=>{if(!A.H.root.visible)return;A.H.root.position.y=floorAt(A.pos.x,A.pos.z);A.H.root.rotation.y=0;poseHuman(A.H,dt,0,0,false);});
    CASE.h.material.opacity=.5+.5*Math.abs(Math.sin(t*3));CASE.h.scale.setScalar(1.4+Math.abs(Math.sin(t*3))*1.4);
    const c=MARSH.H.root.localToWorld(V3(0,1.35,.32));beam.position.copy(c);beam.rotation.set(-1.32,0,0);};
  // Dropship Two: from her side to upright, up out of the canyon, then north
  const q0=TWO.quaternion.clone(),p0=TWO.position.clone(),qUp=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0)),qN=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.08,0,.06));
  const hover=V3(X,26+DS2Y,Z+2),eng=[];
  let ft=0;const fly=(dt,stage)=>{ft+=dt;
    if(stage===0){const u=sstep(.4,4.6,ft);TWO.quaternion.slerpQuaternions(q0,qUp,sstep(.2,2.6,ft));TWO.position.lerpVectors(p0,hover,u);eng.forEach(e=>e.material.opacity=Math.min(1,ft*.8));
      if(rng()<.6)puff(V3(X+R(-10,10),DS2Y+.6,Z+R(-8,10)),R(3,6),3);if(ft<3&&rng()<.15)boom(TWO.position.clone().add(V3(R(-6,6),R(-1,2),R(-6,6))),R(1,2.5),0x9fe8ff,.3);}
    else{const u=ft;TWO.quaternion.slerp(qN,1-Math.exp(-dt*1.5));TWO.position.set(hover.x+Math.sin(u*.3)*3,hover.y+u*6+u*u*.4,hover.z-u*u*3-u*8);}};
  const rv=new THREE.Vector3();
  playCut([
    // the reveal
    {dur:4,cam:[[X+1.5,(1.9)+DS2Y,Z+7.4]],look:[[MARSH.pos.x,1.4,MARSH.pos.z]],fn:(t,dt)=>{live(t,dt);beam.material.opacity=0;}},
    {dur:5.5,cam:[[X-3,(1.6)+DS2Y,Z+13],[X-2.5,(2.5)+DS2Y,Z+12]],look:[[X,(4)+DS2Y,Z-20],[X,(12)+DS2Y,Z-40]],say:[[1,'Thorne','Captain.'],[0,'Captain Rhen','What?']],fn:(t,dt)=>{live(t,dt);beam.material.opacity=Math.min(.7,t*.25);}},
    {dur:7,cam:[[X,(8)+DS2Y,Z+14],[X,(46)+DS2Y,Z+8]],look:[[X,(20)+DS2Y,Z-200],[X,(60)+DS2Y,Z-900]],score:'awe',fn:(t,dt)=>{live(t,dt);if(t<.1){setLook('dusk');WHITE.G.visible=true;if(typeof sfx!=='undefined'&&sfx.swell)sfx.swell(7);}beam.material.opacity=.7;}},
    {dur:5,cam:[[X,(46)+DS2Y,Z+8],[X+2,(48)+DS2Y,Z+6]],look:[[X,(60)+DS2Y,Z-900]],say:[[.6,'Thorne','I don’t think we found this thing by accident.']],fn:(t,dt)=>{live(t,dt);WHITE.halo.material.opacity=.35+.15*Math.sin(t*2);}},
    // the lead-in: she rights herself on her engines and lifts, the team gone up her ramp
    {dur:6,camAt:(u,t,o)=>{const c=at(ROAD_LEN-36,3.5);o.set(c.x,c.y+2.6+u*2,c.z);},lookAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(0,2,0)),
      say:[[1.2,'Ensign Landry','Hold on to something. She doesn’t want to fly.','alert']],
      fn:(t,dt)=>{if(t<.1){beam.visible=false;team.forEach(A=>A.H.root.visible=false);CASE.g.visible=false;ft=0;if(typeof sfx!=='undefined'){sfx.liftoff&&sfx.liftoff(TWO.position,7);sfx.creak&&sfx.creak(TWO.position,2.5);sfx.door&&sfx.door(TWO.position,'open');}}   // her ramp comes up
        if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.dropship','two',TWO.position,Math.min(1,t/2),.7+t*.05);fly(dt,0);}},
    // up past the rim; the canyon falls away; north, the city in the last of the light
    {dur:8,camAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(-16+u*4,6-u*2,30-u*6)),lookAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(0,2,-40)),
      say:[[2.2,'Ensign Landry','Core’s holding. I can give you one flight, Captain. Not two.'],[0,'Captain Rhen','Then take us north.']],
      fn:(t,dt)=>{if(t<.1)ft=0;fly(dt,1);if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.dropship','two',TWO.position,1,1);WHITE.halo.material.opacity=.4+.12*Math.sin(t*1.5);}},
    // the last shot: a speck of light crossing the dead ground toward something enormous
    {dur:6,camAt:(u,t,o)=>o.set(X+60,40+u*6+DS2Y,Z+120),lookAt:(u,t,o)=>o.copy(TWO.position),
      fn:(t,dt)=>{fly(dt,1);if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.dropship','two',TWO.position,1,1);WHITE.G.scale.setScalar(1+t*.03);}},
    {dur:4.5,black:true,small:'Pathfinder · Arc 02',cap:'Dead Ground',cam:[[X,(46)+DS2Y,Z+8]],look:[[X,(60)+DS2Y,Z-900]]},
  ],()=>{setPhase('end');finishMission();},{hush:true,score:'tense'});
}
function finishMission(){
  if(!wentDown)PG.done('pdown');if(LANDRY.hp>0)PG.done('p2landry');PG.ach('deadground');
  PG.finish({title:'PATHFINDER · ARC 02',text:`Dead Ground. Rhen’s team crossed the red desert, walked through the Herald civil war without picking a side, and found Dropship Two at the end of the canyon with her core coming back. The case points north, at a white city nobody built. Herald soldiers down: ${P.kills}. Threat level: ${DIFF.name}.`,
    buttons:[{text:'Menu',href:'index.html',primary:true},{text:'Play again',onClick:()=>location.reload()}]});}

/* ---------- jumps (checkpoints, and testing: pathfinder-2.html?at=desert|basin|grave|canyon|defend) ---------- */
function jumpTo(atq){P.input=true;for(const t of SALVAGE)t.done=true;medKit=true;OKAFOR.on=true;CASE.g.visible=true;
  const S={desert:S_DESERT+4,stone:S_STONE+8,drive:S_DRV0+6,village:S_SETS[1].s0-90,basin:S_BASIN-20,grave:S_GRAVE-2,canyon:S_CANYON+6,descent:S_DESC0+196,defend:ROAD_LEN-26}[atq]||0;
  if(S>S_CANYON-12)cliffSeen=true;if(atq==='descent'){for(const k of['dc1','dc2','dc3','dc4'])enc.add(k);const w=at(S+4,5);WALKER.g.position.copy(w);WALKER.ob.x=w.x;WALKER.ob.z=w.z;}
  // what's behind you has already happened
  for(const k of['sk74','sk112','sk154','scouts','hollow','glass','so','so2','drvStrafe','sv','sv2','sb','rav'])if({sk74:74,sk112:112,sk154:154,scouts:150,hollow:200,glass:256,so:S_SETS[0].s0-40,so2:S_SETS[0].s1-40,drvStrafe:S_SETS[0].s1+50,sv:S_SETS[1].s0-60,sv2:(S_SETS[1].s0+S_SETS[1].s1)/2,sb:S_SETS[2].s0-110,rav:S_CANYON+130}[k]<S)enc.add(k);
  // on the drive or past it, the rover is beside you (it can't go down the mountain)
  ROVER.locked=false;if(S>S_DESERT&&S<S_CANYON-12){const rp=at(S+2,8),q=at(S+12,8);ROVER.g.position.copy(rp);ROVER.yaw=Math.atan2(-(q.x-rp.x),-(q.z-rp.z));ROVER.g.rotation.set(0,ROVER.yaw,0);ROVER.ob.x=rp.x;ROVER.ob.z=rp.z;}
  if(S>S_STONE)stoneSeen=true,lightStone(1);if(S>140)while(STRAFER.runs<3&&S>[92,140,244][STRAFER.runs])STRAFER.runs++;
  const p=at(S,0);P.pos.copy(p);SQUAD.forEach((A,i)=>A.pos.copy(at(S-4-i*2,(i-1.5)*2)));P.yaw=Math.atan2(-(at(S+6,0).x-p.x),-(at(S+6,0).z-p.z));
  if(atq==='defend'){setPhase('defend');banner('Hold the canyon','alert');return;}
  setPhase(atq==='desert'||atq==='stone'?'desert':atq==='village'?'drive':atq==='descent'?'canyon':atq);banner('Checkpoint · '+(CP_NAME[atq]||atq));}

/* ---------- main loop ---------- */
let last=performance.now(),shakeT=0;
let frameErr=0;function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(!PG.paused){
    director(dt);
    if(CUTS.on)CUTS.update(dt);else if(phase!=='end'&&phase!=='brief'){stepPlayer(dt);placeCamera();}
    poseHuman(BODY,dt,0,0);updateEnemies(dt);if(!CUTS.on)updateAllies(dt);updateDrops(dt);updateNades(dt);updateRockets(dt);updateTurrets(dt);updateWall(dt);updateSentry(dt);updateZeal(dt);updatePicks(dt);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);skyU.uT.value=T;
    PG.combat(phaseFight());
    if(CASE.g.visible){if(CASE.pulse>0){CASE.pulse=Math.max(0,CASE.pulse-dt*.25);CASE.h.scale.setScalar(1.4+CASE.pulse*6);CASE.h.material.opacity=.6+CASE.pulse*.4;}else{CASE.h.material.opacity=.4+.3*Math.sin(T*3);CASE.h.scale.setScalar(1.4);}}
    if(!CUTS.on)for(const sm of wreckSmoke)if(rng()<dt*6*sm.k)puff(sm.p.clone().add(V3(R(-1,1),0,R(-1,1))),R(2,4),4);
    // the burning settlement: smoke off the fires near you, the flames flickering
    for(const F of SET_FIRES){const d=Math.abs(F.p.z-P.pos.z);if(d>220)continue;const f=.7+.3*Math.sin(T*9+F.p.x)*Math.sin(T*5.3+F.p.z);F.glow.material.opacity=f;F.core.material.opacity=.6+.4*Math.sin(T*13+F.p.z);
      for(const m of F.smoke){let u=m.userData.u=(m.userData.u+dt*.07)%1;const h=3+u*26*F.k;m.position.set(F.p.x+u*u*9,F.p.y+h,F.p.z+u*u*4);m.scale.setScalar((3+u*12)*F.k);m.material.opacity=.95*Math.sin(Math.PI*Math.min(1,u*1.1));}}
  }else if(phase==='brief'){camera.position.set(WRECK.x+40,14,WRECK.z+46);camera.lookAt(WRECK.x,3,WRECK.z);}
  if(shakeT>0){shakeT-=dt;camera.position.x+=R(-1,1)*shakeT*.15;camera.position.y+=R(-1,1)*shakeT*.12;}
  updateLights(dt,T,CUTS.on?camera.position:P.pos);
  skyFollow();followSun(CUTS.on?camera.position:P.pos);updateDust();updateHud(dt);updateWp();
  renderFrame();
}
PG.briefing({title:'DEAD GROUND',text:'09.03.2237. The morning after the crash. The Pathfinder is in pieces in orbit; Rhen’s team is on Astraea with a dead dropship, a hurt man and the case. Landry has picked up a beacon on a Keeper frequency. Threat level: '+DIFF.name+'.',
  objective:'Salvage the wreck, then follow the beacon. Stay off the black glass. Both Herald sides will shoot you.',
  pc:[['Mouse','Aim (click to lock, Esc releases)'],['W A S D','Move'],['Shift','Sprint'],['Left click','Fire'],['Right click','Aim down the sights (the Lance has a scope)'],
    ['1 2 3 4 or wheel','Rifle, Lance, Breaker launcher, sidearm (Armory skin)'],['R','Reload'],['Q','Mobile shield'],['X','Shoulder sentry'],['G or F','Grenade'],['Space','Jump'],['C or Ctrl','Crouch (toggle)'],['Z','Zeal when the meter is full'],['Walk up and hold, or E','Use (salvage, terminals)'],['Enter','Skip a cutscene']],
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
