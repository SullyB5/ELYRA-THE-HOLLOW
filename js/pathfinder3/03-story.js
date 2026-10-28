/* Elyra · Pathfinder · Arc 03 · The White City — the story, phase by phase. 10.03.2237, before dawn.
   Built on the locked S3 outcomes (docs/lore-2026-10-22/pathfinder-the-lost-expedition.md) and Bryce's dome (docs/PATHFINDER-3-DOME.md):
     OPENING     Dropship Two crosses the last of the desert. The city: no joins, no landing pads, a war on top of it.
     THE AIR     Rhen flies, Landry keeps the core alive (js/pathfinder3/02-air.js). Red and amber fighters, the amber guns on the wall,
                 then the Empty Host's fighters, already here. The case opens the round opening in the wall; through it.
     THE STREETS Down hard in the plaza; on foot from there. Amber defends the streets, red is planting charges to bring the city
                 down, and the Host's troopers are already landing. Neither Herald side is a friend.
     THE TOWER   The case opens its door. A hall, then a corridor spiralling up round the core: the Host are inside already. Murals on
                 the walls (a people older than the Heralds: their cities, their fall, and a dome). Halfway up, a barrier of light:
                 Thorne opens it while you hold the spiral.
     THE CHAMBER At the top, round, open to the sky; a socket in the floor the shape of the object. Amber's last guardians.
     ENDING      The object goes in. The dome rises over the whole city and the war stops. Rhen's warning to Tide City. Something
                 enters the atmosphere: the Host. The dome thins; they walk in through it. "Weapons down. They want us alive."
                 An officer pulls the object out; the dome falls. A small light on Landry's transmitter keeps blinking.
   The object stays unnamed ("the case", "the object"). The Hollow is never shown as a monster. Draft lines are Claude's (the
   warning is Bryce's, word for word, from the S3 document); Bryce rewrites. */
const easeIO=CUTS.ease;
function playCut(shots,done,opts){P.input=false;fireHeld=false;P.adsHeld=false;CUTS.play(shots,Object.assign({done:sk=>{P.input=true;if(done)done(sk);}},opts||{}));}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function glowSprite(hex,size,k,op){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(hex).multiplyScalar(k||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op==null?1:op}));s.scale.setScalar(size);return s;}
$('use').textContent='USE';
// the Empty Host has a side in this war: everyone it isn't (js/origin/03-play.js reads team 'host')
{const _st=spawnTrooper;spawnTrooper=function(x,z,o){o=o||{};if(!o.team&&!o.gunner)o.team='host';return _st(x,z,o);};}

/* ---------- objective marker, and markers on the last few enemies ---------- */
const wp=document.createElement('div');wp.className='hud keep';wp.style.cssText='width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid #ffd27a;transform:rotate(45deg);background:rgba(255,210,122,.15);display:none';
const wpLab=document.createElement('div');wpLab.className='hud';wpLab.style.cssText='font:600 10px var(--mono);color:#ffd27a;letter-spacing:.08em;transform:translate(-50%,12px);display:none';
document.body.append(wp,wpLab);let WP=null;
function updateWp(){if(!WP||CUTS.on||!P.alive||AIR.on){wp.style.display=wpLab.style.display='none';return;}_v.copy(WP).project(camera);const on=_v.z<1;
  const x=clamp((_v.x*.5+.5)*innerWidth,30,innerWidth-30),y=clamp((-_v.y*.5+.5)*innerHeight,60,innerHeight-60);
  wp.style.display=wpLab.style.display=on?'':'none';wp.style.left=wpLab.style.left=x+'px';wp.style.top=wpLab.style.top=y+'px';wpLab.textContent=Math.round(P.pos.distanceTo(WP))+' m';}
const FOE_MK=[];let markList=[];
const TEAM_MK={red:['#ff5a4a','0'],amber:['#ffc040','50%'],host:['#c98aff','2px']};
function markFoes(list){
  while(FOE_MK.length<list.length){const d=document.createElement('div');d.className='hud keep';d.style.cssText='width:12px;height:12px;margin:-6px 0 0 -6px;border:2px solid #ff5a4a;transform:rotate(45deg);display:none;pointer-events:none';document.body.appendChild(d);FOE_MK.push(d);}
  FOE_MK.forEach((d,i)=>{const p=list[i];if(!p||CUTS.on||!P.alive){d.style.display='none';return;}_v.copy(p).project(camera);
    const x=clamp((_v.x*.5+.5)*innerWidth,24,innerWidth-24),y=clamp((-_v.y*.5+.5)*innerHeight,60,innerHeight-60),behind=_v.z>1;
    const k=TEAM_MK[p.team]||TEAM_MK.host;if(d.dataset.t!==String(p.team)){d.dataset.t=p.team;d.style.borderColor=k[0];d.style.borderRadius=k[1];d.style.boxShadow='0 0 8px '+k[0];}
    d.style.display='';d.style.left=(behind?innerWidth-x:x)+'px';d.style.top=(behind?innerHeight-60:y)+'px';d.style.opacity=behind?.55:1;});}

/* ---------- the team: Captain Rhen (you), Sergeant Marsh (the case on his back), Okafor (patched), Thorne, Ensign Landry ---------- */
ALLY_TINT.marine=0xb4bcc4;ALLY_TINT.engineer=0x8e949c;   // (Landry's pale engineer kit went white in the chamber's light)
const SQUAD=[addAlly('marine',-3,440,'Sergeant Marsh','keeper-pathfinder'),addAlly('marine',3,442,'Okafor','keeper-pathfinder'),addAlly('marine',-5,446,'Thorne','keeper-pathfinder'),addAlly('engineer',4,447,'Ensign Landry','keeper-pathfinder')];
const [MARSH,OKAFOR,THORNE,LANDRY]=SQUAD;
const CASE=(()=>{const g=new THREE.Group(),m=new THREE.Mesh(new THREE.BoxGeometry(.5,.8,.3),new THREE.MeshStandardMaterial({color:C(0x221d2a),roughness:.4,metalness:.7,map:panelTex}));g.add(m);
  const s=new THREE.Mesh(new THREE.BoxGeometry(.52,.05,.32),new THREE.MeshBasicMaterial({color:C(0xc8d4ff).multiplyScalar(2),toneMapped:false}));s.position.y=.1;g.add(s);
  const h=glowSprite(0xa8b8ff,1.4,1.2,.6);g.add(h);g.position.set(0,1.35,.32);MARSH.H.root.add(g);return{g,h,pulse:0};})();
// the object itself (out of the case at the end): tall, narrow, like black glass, light moving inside it in lines that never repeat
const OBJ=(()=>{const og=new THREE.OctahedronGeometry(1,3);const P0=og.attributes.position;for(let i=0;i<P0.count;i++){const y=P0.getY(i);P0.setXYZ(i,P0.getX(i)*.34*(1-Math.abs(y)*.25),y*1.15,P0.getZ(i)*.34*(1-Math.abs(y)*.25));}og.computeVertexNormals();
  const U={uT:{value:0},wake:{value:.2}};
  const m=new THREE.Mesh(og,new THREE.ShaderMaterial({uniforms:U,vertexShader:'varying vec3 vN;varying vec3 vP;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vP=position;vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:`varying vec3 vN;varying vec3 vP;varying vec3 vV;uniform float uT,wake;
    void main(){float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.5);float a=atan(vP.z,vP.x);
      float l1=smoothstep(.97,1.0,sin(vP.y*9.0+a*3.0+uT*.7+sin(uT*.31)*4.0));float l2=smoothstep(.985,1.0,sin(vP.y*-13.0+a*5.0-uT*.43));
      vec3 c=vec3(.01,.01,.02)+vec3(.55,.6,.9)*f*.6+vec3(.75,.85,1.0)*(l1+l2)*(.6+wake*2.4)+vec3(1.0,.95,.8)*wake*f*1.4;gl_FragColor=vec4(c,1.0);}`}));
  m.scale.setScalar(.42);m.visible=false;scene.add(m);const halo=glowSprite(0xa8b8ff,2.4,1.4,.6);m.add(halo);halo.scale.setScalar(2.4);halo.material.opacity=.35;return{m,U,halo};})();
function playerDown(){P.alive=false;P.hp=0;P.respawnT=5;killHuman(P.H);fireHeld=false;P.adsHeld=false;PG.say('Sergeant Marsh','Captain’s down! Thorne, get him up!','alert',4);
  banner('You are down · your team is pulling you back','alert');}
function hurtAlly(A,dmg){A.hits++;hitHuman(A.H);if(A.H.dead||!A.on)return;A.lastHit=T;A.hp-=dmg*(OD.allyDmg||1)*(A===THORNE&&phase==='interface'?.6:1);
  if(A.hp<=0){A.hp=0;killHuman(A.H);A.downT=ALLY_DOWN;A.target=null;if(T-(hurtAlly.said||-99)>12){hurtAlly.said=T;PG.say(A===MARSH?'Thorne':'Sergeant Marsh',(A===MARSH?'Marsh':A.name.replace('Ensign ',''))+' is down! Someone get to them!','alert');}
    if(A===THORNE&&phase==='interface')PG.fail('p3thorne');}}

/* a kneel for cutscenes: one knee on the floor, the other foot planted (the cover crouch drops the hips with both feet down,
   which in a held shot reads as floating). Call after poseHuman; k 0..1 */
function kneelPose(H,k){if(!(k>0))return;const base=H.hipY||1,leg=H.hipY?H.hipY*.96:.92,[L0,L1]=H.legs;
  L0.hp.rotation.x=lerp(L0.hp.rotation.x,1.5,k);L0.kn.rotation.x=lerp(L0.kn.rotation.x,-1.5,k);
  L1.hp.rotation.x=lerp(L1.hp.rotation.x,.08,k);L1.kn.rotation.x=lerp(L1.kn.rotation.x,-1.38,k);
  H.hip.rotation.x=0;H.hip.rotation.y=lerp(H.hip.rotation.y,0,k);H.hip.position.y=lerp(H.hip.position.y,base-leg*.5,k);H.torso.rotation.x=lerp(H.torso.rotation.x,.06,k);
  H.root.updateMatrixWorld(true);const kw=L1.kn.getWorldPosition(_kn);H.hip.position.y-=(kw.y-(H.root.position.y+.07))/(H.root.scale.y||1)*k;}
const _kn=new THREE.Vector3();
/* ---------- phases ---------- */
let phase='brief',phT=0,wentDown=false;
const said=new Set();
function say(key,who,txt,tone,dur){if(said.has(key))return;said.add(key);PG.say(who,txt,tone,dur);}
function talk(lines){lines.reduce((t,[d,w,x,tone])=>{t+=d;setTimeout(()=>{if(phase!=='endcut')PG.say(w,x,tone);},t*1000);return t;},0);}
const CP_KEY='elyra.checkpoint.pathfinder3';
function saveCP(at){try{localStorage.setItem(CP_KEY,JSON.stringify({at,t:Date.now()}));}catch(_){}}
function clearCP(){try{localStorage.removeItem(CP_KEY);}catch(_){}}
function readCP(){try{const c=JSON.parse(localStorage.getItem(CP_KEY)||'null');return c&&['air','north','flank','streets','tower','gallery','interface','crown','chamber'].includes(c.at)?c:null;}catch(_){return null;}}
const CP_NAME={air:'The air over the city',north:'The north concourse',flank:'Round the city',streets:'The plaza',tower:'The tower door',gallery:'The gallery on the spiral',interface:'The barrier on the spiral',crown:'The Crown Hold',chamber:'The chamber',socket:'The socket'};   // every checkpoint banner reads its name from here (Oct 25)
/* Oct 27 (Bryce: the objective pops up at the start of each round, e.g. "Find the entrance"): js/shared/lean-hud.js goalPop */
const GOALS={north:['Hold the crash site','Host dropships are coming down on the concourse',{alert:true}],flank:['Find the entrance','Round the city, west or east, to the plaza'],
  streets:['Get to the tower','Up the street to the heart of the city · pull red’s charges'],ramp:['Climb the spiral','Up round the core'],
  gallery:['Hold the gallery','Up the spiral and down it',{alert:true}],interface:['Hold the spiral','Keep them off Thorne while he opens the barrier',{alert:true}],
  crown:['Hold the crown','Red, coming down from the top',{alert:true}],chamber:['Take the chamber','Then place the object in the socket']};
function setPhase(p){if(GOALS[p]&&phase!==p&&window.goalPop)setTimeout(()=>{if(phase===p)goalPop(GOALS[p][0],GOALS[p][1],GOALS[p][2]);},600);
  phase=p;phT=0;if(['endcut','end','landcut'].includes(p))reviveAllies();}
function phaseFight(){return['north','flank','streets','ramp','gallery','interface','crown','chamber'].includes(phase);}
PG.init('pathfinder3',{challenges:[
  {id:'p3air',text:'Down 12 fighters over the city',pts:2000,goal:12},
  {id:'p3charges',text:'Pull all three of red’s charges',pts:2000},
  {id:'p3kills',text:'Down 30 on foot',pts:2000,goal:30},
  {id:'p3murals',text:'Read the three murals',pts:800,goal:3},
  {id:'p3thorne',text:'Never let Thorne go down at the barrier',pts:1500},
  {id:'pdown',text:'Never go down',pts:2000},
]});
{const _p=PG.prog;PG.prog=(id,n)=>_p(id==='okills'?'p3kills':id,n);}

/* ---------- places along the way ---------- */
function at(s,lat,out){const p=roadPt(clamp(s,0,ROAD_LEN),out||new THREE.Vector3()),n=roadN(clamp(s,0,ROAD_LEN));p.x+=n.x*lat;p.z+=n.z*lat;p.y=groundY(p.x,p.z);return p;}
function herald(team,s,lat,o){const p=at(s,lat);return spawnTrooper(p.x,p.z,Object.assign({team,hold:R(16,30)},o||{}));}
function host(s,lat,o){const p=at(s,lat);return spawnTrooper(p.x,p.z,Object.assign({team:'host',hold:R(10,20)},o||{}));}
const sRing=th=>S_RING0+RC*th;   // a distance along the walk for an angle up the spiral
// supplies along the way (more in the tower: there's nowhere to fall back to in there)
for(const [s,lat,t] of[[36,6,'ammo'],[70,-8,'med'],[112,0,'ammo'],[150,8,'rocket'],[196,-6,'med'],[238,4,'ammo'],[282,-5,'rocket'],[330,6,'med'],[362,0,'ammo'],
  [sRing(.5),0,'ammo'],[sRing(1.3),0,'med'],[sRing(2.2),0,'rocket'],[sRing(3),0,'ammo'],[sRing(3.9),0,'med'],[sRing(4.6),0,'ammo'],[sRing(5.2),0,'med'],[S_UW0+12,0,'rocket'],[S_UW1-6,0,'ammo']]){const p=at(s,lat);addPick(t,p.x,p.z);}
// (Oct 26) round the city: both ways, every hundred and fifty metres or so, and at the crash site
for(const k of['W','E'])for(const [f,t] of[[.08,'ammo'],[.22,'med'],[.36,'rocket'],[.52,'ammo'],[.66,'med'],[.8,'ammo'],[.92,'rocket']]){const p=flankAt(k,FLANK.len[k]*f,R(-4,4));addPick(t,p.x,p.z);}
for(const [dx,dz,t] of[[-14,18,'ammo'],[14,18,'med'],[0,26,'rocket']])addPick(t,NCRASH.x+dx,NCRASH.z+dz);
{const [g,a]=SIDES;for(const [o,dx,dz,t] of[[g,4,-4,'med'],[g,-4,4,'rocket'],[a,2,-2,'ammo'],[a,-2,3,'med']])addPick(t,o.cx+dx,o.cz+dz);}

/* ---------- Dropship Two ---------- */
const TWO=makeDropship();TWO.visible=false;
const LANDP=V3(NCRASH.x,0,NCRASH.z-22);   // (Oct 26) where she comes down: the north concourse, nose north, her ramp toward the city
const PLAZA_IN=V3(0,40,506);              // just inside the opening, where the fly-in hands her over
// once she's down she's solid, nose to ramp (you could walk back into her before)
for(const z of[-15,-9,-3,3,8])addSolid({x:LANDP.x,z:LANDP.z+z,r:z===-15?3:4.4,h:8});

/* ---------- walk up and hold (or press E / tap USE) ---------- */
const TASKS=[];let taskHold=0,taskNow=null;
function task(id,label,pos,onDone,needs,hold){const t={id,label,pos:pos.clone(),done:false,onDone,needs:needs||null,on:false,hold:hold||1};TASKS.push(t);return t;}
function updateTasks(dt){taskNow=null;let best=3;for(const t of TASKS){if(!t.on||t.done||(t.needs&&!t.needs()))continue;const d=Math.hypot(P.pos.x-t.pos.x,P.pos.z-t.pos.z)+Math.max(0,Math.abs(P.pos.y-t.pos.y)-2)*3;if(d<best){best=d;taskNow=t;}}
  if(taskNow&&P.alive){onUse=()=>{taskHold=9;};taskHold+=dt;banner(taskNow.label+(coarse?' · hold':' · hold, or press E'));
    if(taskHold>taskNow.hold){const t=taskNow;t.done=true;taskHold=0;onUse=null;if(typeof sfx!=='undefined'&&sfx.pickup)sfx.pickup();t.onDone();}}
  else{taskHold=0;if(onUse&&!taskNow)onUse=null;}}

/* ---------- the squad: a few metres behind you along the walk ---------- */
function squadFollow(spread){const sP=roadS(P.pos.x,P.pos.z),inT=Math.hypot(P.pos.x,P.pos.z)<TW.r;
  SQUAD.forEach((A,i)=>{if(!A.on)return;const back=3+i*2.2,lat=(i%2?1:-1)*(1.4+i*.5)*spread;let g;
    /* Oct 27 (Bryce: the crew ran straight at the wall of light they can't get through): round the city (and on the concourse) they
       follow you along the way you're walking, not along the street inside the wall */
    if(phase==='flank'&&FLANK.on){const k=FLANK.side,u=flankU(P.pos.x,P.pos.z,k);g=flankAt(k,Math.max(0,u-back),lat*.8);A.goal=g;return;}
    if(phase==='north'||sP<8||sideOf(P.pos.x,P.pos.z)){g=V3(P.pos.x+Math.sin(P.yaw)*back+Math.cos(P.yaw)*lat,0,P.pos.z+Math.cos(P.yaw)*back-Math.sin(P.yaw)*lat);if(playD(g.x,g.z)>-1)g.set(P.pos.x+Math.sin(P.yaw)*2,0,P.pos.z+Math.cos(P.yaw)*2);}
    else{const sc=Math.max(0,sP-back),L=Math.max(1,laneHalf(sc)-1.4);g=at(sc,clamp((inT?0:latOf(P.pos.x,P.pos.z))+lat,-L,L));}
    A.goal=g;});}

/* ---------- THE STREETS ---------- */
let enc=new Set();
function once(k,fn){if(enc.has(k))return;enc.add(k);fn();}
const n0=()=>OD.n||0;
// red's demolition charges: set at the foot of the façades, a fuse running. Pull them (walk up and hold) before they go
const CHG=[];
function makeCharge(s,side){const hl=laneHalf(s),p=at(s,side*(hl-.6));const g=new THREE.Group();g.position.copy(p);scene.add(g);
  const b=new THREE.Mesh(boxUV(.9,1.2,.6,2),new THREE.MeshStandardMaterial({color:C(0x2a1414),map:panelTex,metalness:.6,roughness:.4}));b.position.y=.6;g.add(b);
  const l=glowSprite(0xff3a1a,1.6,2.4,.9);l.position.y=1.3;g.add(l);const pl=new THREE.PointLight(C(0xff3a1a),1.2,10,1.6);pl.position.y=1.5;g.add(pl);
  const C0={s,g,l,pl,p,fuse:70,armed:false,done:false,blown:false};
  C0.task=task('chg'+s,'Pull the charge',p,()=>{C0.done=true;chargeOff(C0);PG.kill(300,p.clone().setY(p.y+2),'');const left=CHG.filter(c=>!c.done&&!c.blown).length;
    if(CHG.every(c=>c.done))PG.done('p3charges');PG.say('Thorne',left?'Charge is out. Red’s set more up the street.':'That’s the last of their charges.',null);});
  CHG.push(C0);return C0;}
/* a spent charge: hide its body and glow but leave its light in the scene at zero. Hiding the light would change the scene's light
   count, and three.js would then recompile every lit material in the city on the spot (a hitch mid-fight) */
function chargeOff(C0){C0.g.children.forEach(o=>{if(!o.isLight)o.visible=false;});C0.pl.intensity=0;}
function blowCharge(C0){C0.blown=true;chargeOff(C0);C0.task.done=true;PG.fail('p3charges');const p=C0.p.clone().setY(2);
  boom(p,18,0xff8a3a,1.4);boom(p,10,0xfff0d0,.5);for(let k=0;k<8;k++)puff(p.clone().add(V3(R(-5,5),R(0,8),R(-5,5))),R(4,9),5);if(typeof sfx!=='undefined')sfx.collapse(p);shakeT=1;
  // a piece of the façade comes down into the street
  const n=roadN(C0.s),side=Math.sign(latOf(C0.p.x,C0.p.z))||1;for(let k=0;k<5;k++){const m=new THREE.Mesh(boxUV(R(2,4),R(1.5,3),R(2,4),2),stoneMat);m.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(m.geometry.attributes.position.count*3).fill(.9),3));
    m.position.set(C0.p.x+n.x*side*R(1,3),R(20,34),C0.p.z+n.z*side*R(1,3));scene.add(m);FALL.push({m,v:V3(-n.x*side*R(2,5),0,-n.z*side*R(2,5)),y0:floorAt(m.position.x,m.position.z)});}
  if(P.alive&&P.pos.distanceTo(C0.p)<9)hurtPlayer(40,C0.p);PG.say('Okafor','Charge went! Part of the street’s coming down!','alert');}
const FALL=[];function updateFall(dt){for(const F of FALL){if(F.done)continue;F.v.y-=22*dt;F.m.position.addScaledVector(F.v,dt);F.m.rotation.x+=dt*2;if(F.m.position.y<F.y0+.8){F.m.position.y=F.y0+.8;F.done=true;boom(F.m.position.clone(),5,0xffe0c0,.3);puff(F.m.position.clone(),4,3);OBST.push({x:F.m.position.x,z:F.m.position.z,r:1.6,h:2});}}}
const CHARGES=[[118,1],[226,-1],[318,1]].map(([s,side])=>makeCharge(s,side));
// the street fights: amber holds lines across the street; red comes at them (and plants charges); the Host lands among both
function streetWar(sNow){
  if(sNow>-4)once('st0',()=>{for(let k=0;k<3+n0();k++){const s0=58+k*5;herald('amber',s0,R(-8,8),{anchor:at(s0,R(-8,8)),hold:R(20,40)});}
    herald('red',96,-6,{hold:R(14,24)});herald('red',100,6,{hold:R(14,24)});setTimeout(()=>PG.say('Thorne','Amber, holding the street. Red, beyond them.','alert'),600);});
  if(sNow>60)once('st1',()=>{for(let k=0;k<3+n0();k++)herald('red',128+k*6,R(-9,9),{hold:R(16,26)});for(let k=0;k<2;k++)herald('red',116,k?-9:9,{anchor:at(116,k?-9:9)});
});
  if(sNow>100)once('host1',()=>{const land=at(S_ST2+18,0);launchDrop(land,4+n0(),0);setTimeout(()=>PG.say('Okafor','Host dropship! Coming down in the street ahead!','alert'),400);
    setTimeout(()=>PG.say('Sergeant Marsh','They’re not here for the Heralds.','alert'),3600);});
  if(sNow>150)once('st2',()=>{for(let k=0;k<3+n0();k++){const s0=196+k*6;herald('amber',s0,R(-10,10),{anchor:at(s0,R(-10,10)),hold:R(18,30)});}
    for(let k=0;k<3+n0();k++)herald('red',S_ST2+40+k*5,R(-8,8));for(const o of[SIDES[1]])for(let k=0;k<2+n0();k++)spawnTrooper(o.cx+R(-3,3),o.cz+R(-3,3),{team:'red',hold:R(14,24)});
    setTimeout(()=>PG.say('Thorne','The arcade, left! Red’s in there!','alert'),800);
    // Oct 24: red brought a walker into the street (Bryce's Herald mech): it holds behind its line and shells amber's
    if(typeof MECH!=='undefined'){const a=at(S_ST2+78,-3),b=at(S_ST2+58,3);MECH.spawn(a.x,a.z,{path:[b,a]});setTimeout(()=>PG.say('Sergeant Marsh','Red’s got a walker up the street! Breaker on it!','alert'),3400);}});
  if(sNow>214)once('host2',()=>{launchDrop(at(S_ST3+6,-4),4+n0(),0);launchDrop(at(S_ST3+20,5),3+n0(),2.5);});
  if(sNow>262)once('st3',()=>{for(let k=0;k<4+n0();k++){const s0=S_DOOR-58+k*7;herald('amber',s0,R(-6,6),{anchor:at(s0,R(-6,6)),hold:R(16,30)});}
    for(let k=0;k<3+n0();k++)herald('red',S_DOOR-90+k*6,R(-7,7));setTimeout(()=>PG.say('Sergeant Marsh','Last of the street. That door’s the way in.','alert'),600);});
  if(sNow>S_DOOR-50)once('host3',()=>{for(let k=0;k<3+n0();k++)host(S_DOOR-110+k*4,R(-6,6));setTimeout(()=>PG.say('Okafor','Host, behind us! They came down the street after us!','alert'),300);});}
// the war overhead in the streets: fighters crossing, the warship's beams landing somewhere in the city, now and then close
const SKY=(()=>{const F=[];for(let i=0;i<6;i++){const team=i%3===2?'host':i%2?'amber':'red',g=makeFighter(team);g.visible=false;F.push({g,team,a:R(0,6.28),r:R(200,420),h:R(120,260),sp:R(.08,.16)*(rng()<.5?-1:1),cool:R(1,4)});}
  let beamT=4,warCh=0;
  function update(dt,on){for(const f of F){f.g.visible=on;if(!on)continue;f.a+=f.sp*dt;const x=Math.sin(f.a)*f.r,z=Math.cos(f.a)*f.r-60,y=f.h+Math.sin(f.a*3)*20;const nx=Math.sin(f.a+f.sp*.2)*f.r,nz=Math.cos(f.a+f.sp*.2)*f.r-60;
      f.g.position.set(x,y,z);f.g.lookAt(nx,y,nz);f.g.rotateY(Math.PI);f.g.rotateZ(Math.sign(f.sp)*.5);
      f.cool-=dt;if(f.cool<=0){f.cool=R(1,3);const o=pick(F);if(o!==f)fire(f.g.position.clone(),o.g.position.clone().add(V3(R(-8,8),R(-4,4),R(-8,8))),380,f.team==='red'?'rbolt':f.team==='amber'?'abolt':'hbolt',q=>boom(q,R(4,7),SIDE_COL[f.team],.25));}}
    if(!on||!WARSHIP.on)return;beamT-=dt;if(beamT<.55&&!warCh&&typeof sfx!=='undefined'&&sfx.charge){warCh=1;sfx.charge(WARSHIP.g.position);}if(beamT<=0){beamT=R(4,8);warCh=0;const near=rng()<.3&&P.alive,to=near?(phase==='flank'?flankAt(FLANK.side,flankU(P.pos.x,P.pos.z,FLANK.side)+R(40,70),R(-30,30)):at(roadS(P.pos.x,P.pos.z)+R(40,70),R(-30,30))).setY(0):V3(R(-300,300),0,R(-320,250));
      if(near&&Math.hypot(to.x,to.z)<TW.r+10)return;fire(WARSHIP.g.position.clone(),to,900,'wbeam',q=>{boom(q,R(16,26),0xff8a3a,1.2);boom(q,10,0xfff0d0,.4);for(let k=0;k<3;k++)puff(q.clone().add(V3(R(-6,6),R(0,6),R(-6,6))),R(8,14),5);if(near){shakeT=.6;if(typeof sfx!=='undefined')sfx.blast(q);}});}}
  return{update,F};})();

/* ---------- THE TOWER ---------- */
// its door: sealed with light; the case opens it
const DOOR_BLOCK={x:0,z:TW.r+4.5,r:6.5};BLOCKS.push(DOOR_BLOCK);let doorOpen=0,doorOpening=false;
function openDoor(){if(doorOpening)return;doorOpening=true;if(window.goalPop)goalPop('Hold the door','It’s opening slowly · the Host are coming up the street',{alert:true});CASE.pulse=1;flashScreen(.15);if(typeof sfx!=='undefined'){sfx.wake();sfx.creak(V3(0,4,TW.r),4);if(sfx.door)sfx.door(V3(0,4,TW.r),'big',4);}
  talk([[.4,'Sergeant Marsh','The case. Again.'],[2.4,'Thorne','The door’s answering it.'],[2.6,'Captain Rhen','Then it wants us inside. Go.']]);}
// the barrier halfway up the spiral: a sheet of light across the corridor; Thorne opens it while you hold
const TH_INT=SP_OLD*.56,S_INT=sRing(TH_INT);
const INT=(()=>{const p=spiralPt(TH_INT),f=spiralY(TH_INT),U={uT:{value:0},k:{value:1}};
  const m=new THREE.Mesh(new THREE.PlaneGeometry(RW*2+.6,9),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vU;uniform float uT,k;void main(){float l=smoothstep(.96,1.0,sin(vU.y*60.0+uT*3.0))*.6+smoothstep(.9,1.0,sin(vU.x*30.0-uT*1.3))*.3;gl_FragColor=vec4(vec3(.7,.82,1.0)*(l+.2)*k,1.0);}'}));
  m.position.set(p.x,f+4.5,p.z);m.rotation.y=TH_INT+Math.PI/2;TOWER.G.add(m);
  // the panel Thorne works at, on the inner wall just below it
  const pp=spiralPt(TH_INT-.06,RC-RW+.9),panel=new THREE.Mesh(new THREE.BoxGeometry(.9,1.2,.4),stoneInMat);panel.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(panel.geometry.attributes.position.count*3).fill(.9),3));
  panel.position.set(pp.x,spiralY(TH_INT-.06)+1.1,pp.z);panel.lookAt(0,panel.position.y,0);TOWER.G.add(panel);
  const pg=glowSprite(0x9fd8ff,1.2,2,.8);pg.position.copy(panel.position).add(V3(0,.3,0));TOWER.G.add(pg);
  const B={x:p.x,z:p.z,r:RW+.8};BLOCKS.push(B);
  return{m,U,B,panel,pg,pp:V3(pp.x*1.06,0,pp.z*1.06),t:0,max:120*(window.P3_HOLD_K||1),spawnT:3,side:0,done:false};})();   // (Oct 26: the hold here is two minutes now)
/* (Oct 26, Bryce's blueprint, Act B) two more holds on the spiral: the Archive Gallery low down among the murals, and the Crown Hold
   high up past the chamber's level. Waves from below and above; hold till the timer runs out, then clear what's left. */
const HOLDS={gallery:{th:SP_OLD*.2,dur:40,teams:['host','amber'],done:false,t:0,spawnT:2,k:0},crown:{th:5.0,dur:45,teams:['host','red'],done:false,t:0,spawnT:2,k:0}};
for(const id in HOLDS){const H=HOLDS[id];H.s=sRing(H.th);H.dur*=window.P3_HOLD_K||1;}
// the murals: walk up and hold to read (Thorne reads them: lore, not the way on)
const MURAL_LINES={
  cities:[[0,'Thorne','Cities. Dozens of them. On more than one world.'],[3,'Sergeant Marsh','Herald cities?'],[2.2,'Thorne','No. This wasn’t built by the Heralds.'],[3,'Sergeant Marsh','Then who built it?'],[2.4,'Thorne','Someone who was here long before them.']],
  fall:[[0,'Thorne','And then this. Everything coming apart at once.'],[3,'Captain Rhen','What happened to them?'],[2.4,'Thorne','I don’t know.'],[2.2,'Okafor','That spiral. It’s on every one of them.']],
  dome:[[0,'Thorne','Captain. This one’s later. The cities are still standing.'],[3.4,'Ensign Landry','Then what are we looking at?'],[2.8,'Thorne','Evidence that whatever happened here didn’t have to end the way it did.']]};
const T_MURAL=TOWER.murals.map(M0=>{const t=task('mural-'+M0.kind,'Read the mural',M0.p,()=>{talk(MURAL_LINES[M0.kind]);PG.prog('p3murals');});t.on=true;t.lore=true;return t;});
// the socket
const T_SOCKET=task('socket','Place the object in the socket',V3(0,TOPY,2.6),()=>{setPhase('endcut');endScene();},null,1.4);

/* ---------- the director ---------- */
let charSaid=0;const door={};
function director(dt){
  phT+=dt;markFoes(markList);markList=[];if(!P.alive&&phaseFight())wentDown=true;
  const s=roadS(P.pos.x,P.pos.z),inT=Math.hypot(P.pos.x,P.pos.z)<TW.r;
  if(phaseFight()){updateTasks(dt);updateFall(dt);}
  SKY.update(dt,phaseFight()&&!inT);
  // the charges' fuses (they start when you're close enough to see them)
  if(phase==='streets')for(const C0 of CHARGES){if(C0.done||C0.blown)continue;if(!C0.armed&&s>C0.s-70){C0.armed=true;C0.task.on=true;if(C0===CHARGES[0])say('chg0','Ensign Landry','Captain, red has something at the foot of that building. A charge. They’re bringing the street down.','alert');}
    if(C0.armed){C0.fuse-=dt;C0.l.material.opacity=.5+.5*Math.sin(T*(C0.fuse<15?16:6));C0.pl.intensity=1.2*(.5+.5*Math.sin(T*(C0.fuse<15?16:6)));if(C0.fuse<=0)blowCharge(C0);}}
  if(phase==='streets'){streetWar(s);const ac=CHARGES.filter(c=>c.armed&&!c.done&&!c.blown);
    PG.objective(ac.length?'Pull red’s charge · '+Math.ceil(ac[0].fuse)+' s (or push on to the tower)':s<S_DOOR-30?'Get to the tower at the heart of the city':'Get to the tower’s door');
    WP=ac.length&&ac[0].p.distanceTo(P.pos)<80?ac[0].p.clone().setY(2.2):at(Math.min(s+60,S_DOOR-4),0).setY(3);if(s>S_DOOR-40)WP=V3(0,6,TW.r+4);
    squadFollow(1);
    if(s>20)say('s1','Thorne','No joins. Anywhere. It’s one piece of stone, the whole street.');
    if(s>180)say('s2','Ensign Landry','The tower’s the middle of everything. Every street runs to it.');
    if(s>S_DOOR-22){PG.objective('The door is sealed');if(!doorOpening)openDoor();}
    // (Oct 26) the breach: the door answers the case slowly now, half a minute, and the Host come up the street behind you while it does
    if(doorOpening&&doorOpen<1){doorOpen=Math.min(1,doorOpen+dt/(30*(window.P3_HOLD_K||1)));TOWER.doorU.open.value=sstep(0,1,doorOpen);if(doorOpen>.85&&BLOCKS.includes(DOOR_BLOCK))BLOCKS.splice(BLOCKS.indexOf(DOOR_BLOCK),1);
      PG.objective('Hold the door while it opens · '+Math.ceil((1-doorOpen)*30)+' s');WP=null;
      door.spT=(door.spT==null?4:door.spT)-dt;if(door.spT<=0&&doorOpen<.9){door.spT=R(6.5,8)/OD.rof;for(let k=0;k<2+n0();k++)setTimeout(()=>host(S_DOOR-R(40,70),R(-8,8),{hold:R(6,12)}),k*220);}
      if(doorOpen>.2)say('dr1','Thorne','It’s slower this time. The door is fighting it.','alert');if(doorOpen>.45)say('dr2','Sergeant Marsh','Host, back down the street! Hold the door!','alert');}
    if(doorOpen>=1&&inT){setPhase('ramp');saveCP('tower');banner('Checkpoint · '+CP_NAME.tower);
      talk([[.6,'Thorne','The air’s different in here. Still.'],[3,'Okafor','And it goes up. All the way round.']]);}}
  else if(phase==='ramp'){const th=Math.max(0,(s-S_RING0)/RC);
    const next=!HOLDS.gallery.done?HOLDS.gallery.s-4:!INT.done?S_INT-4:!HOLDS.crown.done?HOLDS.crown.s-4:!HOLE_OPEN?S_RING1-4:S_UW1+8;
    PG.objective(HOLE_OPEN?'Through the broken wall':'Climb the spiral');{const w=at(Math.min(s+40,next),0);WP=w.setY(w.y+2);}squadFollow(.5);
    if(!HOLDS.gallery.done&&s>HOLDS.gallery.s-8){setPhase('gallery');saveCP('gallery');banner('Checkpoint · '+CP_NAME.gallery);
      talk([[.3,'Okafor','Both ways! Up the spiral and down it!','alert'],[2.6,'Captain Rhen','Then we hold the gallery. Backs to the pictures.'],[3,'Thorne','Don’t shoot the walls.']]);}
    if(INT.done&&!HOLDS.crown.done&&s>HOLDS.crown.s-8){setPhase('crown');saveCP('crown');banner('Checkpoint · '+CP_NAME.crown);
      talk([[.3,'Ensign Landry','Captain, we’re above the chamber. Whatever’s in the middle, we climbed past it.'],[3.2,'Sergeant Marsh','Contact! Red, coming down from the top!','alert'],[2.4,'Captain Rhen','Hold here. Then we find a way down.']]);}
    // the floor gives way just past the Crown Hold: down through the inner wall into the underworks
    if(HOLDS.crown.done&&!HOLE_OPEN&&s>S_RING1-14)collapse();
    if(s>S_RING0-6)once('r1',()=>{for(let k=0;k<3+n0();k++){const s0=sRing(.5+k*.18);host(s0,R(-2,2),{anchor:at(s0,R(-2,2)),hold:R(10,18)});}setTimeout(()=>PG.say('Okafor','Host! They’re already in here!','alert'),500);});
    if(th>.6)once('r2',()=>{for(let k=0;k<3+n0();k++){const s0=sRing(1.5+k*.15);herald('amber',s0,R(-2,2),{anchor:at(s0,R(-2,2)),hold:R(12,20)});}
      setTimeout(()=>PG.say('Thorne','Amber, up ahead. Guardians. They’re not letting anyone up.','alert'),300);});
    if(th>.3)say('r3','Captain Rhen','Pictures on the walls. Thorne, eyes on them when we can.');
    if(!INT.done&&s>S_INT-14){setPhase('interface');saveCP('interface');banner('Checkpoint · '+CP_NAME.interface);
      talk([[.3,'Thorne','A wall of light. There’s a panel. I can open it. I need time.','alert'],[3.2,'Captain Rhen','How long?'],[1.8,'Thorne','Less if nobody shoots me.'],[2.6,'Sergeant Marsh','They’re coming up behind us. Both of them.','alert']]);}
    if(HOLE_OPEN&&s>S_UW0+8)say('uw1','Thorne','We’re going back down. Captain, it’s taking us back down.');
    if(HOLE_OPEN&&s>S_UW0+30)say('uw2','Captain Rhen','Then it wants us at the bottom. Keep moving.');
    if(INT.done&&HOLE_OPEN&&s>S_UW1+2){setPhase('chamber');saveCP('chamber');banner('Checkpoint · '+CP_NAME.chamber);
      talk([[.4,'Okafor','Open to the sky. All the way up.'],[2.6,'Thorne','Captain. The middle of the floor.'],[2.4,'Captain Rhen','I see it.']]);}}
  else if(phase==='interface'){INT.t+=dt;const left=Math.max(0,INT.max-INT.t);PG.objective(left>0?'Hold the spiral while Thorne opens the barrier · '+Math.ceil(left)+' s':'It’s open · up the spiral');
    WP=null;THORNE.goal=INT.pp.clone();THORNE.work=left>0;[MARSH,OKAFOR,LANDRY].forEach((A,i)=>{A.goal=at(S_INT-8-i*3,(i-1)*1.4);});
    INT.pg.material.opacity=.5+.5*Math.sin(T*8);
    if(left>0){INT.spawnT-=dt;if(INT.spawnT<=0){INT.spawnT=R(5.5,7.5)/OD.rof;const team=INT.side++%2?'host':'red',n=3+n0();
      // (Oct 25: one at a time, a fifth of a second apart, so a wave is never built in a single frame)
      for(let k=0;k<n;k++)setTimeout(()=>{if(phase!=='interface')return;const p=at(S_INT-R(45,75),R(-2.5,2.5));const E=spawnTrooper(p.x,p.z,{team,hold:R(8,14)});if(E)E.goal=at(S_INT-R(14,22),R(-2,2));},k*200);
      if(INT.side===3)PG.say('Okafor','More of them! Coming up the spiral!','alert');}}
    if(INT.t>25)say('i0','Thorne','Still going. It’s slower than the door.');
    if(INT.t>55)say('i1','Thorne','Halfway. It’s not a lock. It’s asking me something.');
    if(INT.t>80)say('i3','Sergeant Marsh','Heavier ones coming up! Keep them off Thorne!','alert');
    if(INT.t>100)say('i2','Thorne','It wants the case. It’s reading the case.','alert');
    if(left<=0&&!INT.done){INT.done=true;THORNE.work=false;CASE.pulse=1;flashScreen(.15);if(typeof sfx!=='undefined')sfx.wake();if(!THORNE.H.dead)PG.done('p3thorne');
      INT.fade=1;BLOCKS.splice(BLOCKS.indexOf(INT.B),1);PG.say('Thorne','It’s open! Go, go!','alert');}
    if(INT.done){setPhase('ramp');}}
  else if(phase==='gallery'||phase==='crown'){const H=HOLDS[phase];H.t+=dt;const left=Math.max(0,H.dur-H.t);WP=null;
    PG.objective(left>0?'Hold · '+Math.ceil(left)+' s':'Clear the spiral');[MARSH,OKAFOR,THORNE,LANDRY].forEach((A,i)=>{A.goal=at(H.s+(i-1.5)*3,(i%2?1:-1)*1.6);});
    if(left>0&&Math.ceil(left)%15===0&&Math.ceil(left)!==H.lastB&&Math.ceil(left)<H.dur){H.lastB=Math.ceil(left);banner(Math.ceil(left)+' s','alert');}
    if(left>3){H.spawnT-=dt;if(H.spawnT<=0){H.spawnT=R(6,8)/OD.rof;const up=H.k++%2===1,team=H.teams[H.k%2],n=2+n0();
      for(let k=0;k<n;k++)setTimeout(()=>{if(HOLDS[phase]!==H)return;const p=at(up?Math.min(H.s+R(25,45),S_RING1-6):H.s-R(30,55),R(-2.5,2.5));const E=spawnTrooper(p.x,p.z,{team,hold:R(6,12)});if(E)E.goal=at(H.s+(up?R(6,12):-R(6,12)),R(-2,2));},k*220);}}
    const near=ENEMIES.filter(E=>!E.H.dead&&E.pos.distanceTo(P.pos)<70);
    if(left<=0&&(!near.length||H.t>H.dur+25)){H.done=true;setPhase('ramp');PG.say(H===HOLDS.gallery?'Sergeant Marsh':'Okafor',H===HOLDS.gallery?'Gallery’s clear! Up!':'That’s the last of them up here!','alert');}}
  else if(phase==='north'){northDirector(dt);}
  else if(phase==='flank'){flankDirector(dt);}
  else if(phase==='chamber'){PG.objective(chamberClear?'Place the object in the socket':'Take the chamber');squadFollow(.6);
    once('ch1',()=>{for(let k=0;k<4+n0();k++){const a=k/(4+n0())*Math.PI*2,x=Math.sin(a)*13,z=Math.cos(a)*13;spawnTrooper(x,z,{team:'amber',anchor:V3(x,TOPY,z),hold:R(20,30)});}
      setTimeout(()=>PG.say('Ensign Landry','Amber! Round the socket! Guarding it!','alert'),400);});
    if(phT>9)once('ch2',()=>{for(let k=0;k<3+n0();k++){const p=at(S_UW0+R(8,30),R(-1.5,1.5));spawnTrooper(p.x,p.z,{team:'host',hold:R(8,16)});}setTimeout(()=>PG.say('Okafor','Host, behind us, out of the underworks!','alert'),300);});
    // (Oct 26) a third wave: red, down the shaft on lines from the crown, into the middle of the room
    if(phT>26)once('ch3',()=>{for(let k=0;k<4+n0();k++){const a=R(0,Math.PI*2),r=R(8,16),E=spawnTrooper(Math.sin(a)*r,Math.cos(a)*r,{team:'red',hold:R(6,12),unit:k===0?'heavy':undefined});if(E){E.pos.y=TOPY+24;}}
      setTimeout(()=>PG.say('Thorne','Red! Coming down the shaft!','alert'),200);boom(V3(0,TOPY+30,0),10,0xff6a3a,.4);});
    const live=ENEMIES.filter(E=>!E.H.dead&&E.pos.y>TOPY-14&&Math.hypot(E.pos.x,E.pos.z)<RC+RW+2);
    if(phT>30&&enc.has('ch3')&&!live.length&&!chamberClear){chamberClear=true;T_SOCKET.on=true;talk([[.5,'Sergeant Marsh','Clear!'],[2,'Thorne','Captain. That slot. It’s the same shape.'],[2.8,'Captain Rhen','I know.']]);}
    WP=chamberClear?V3(0,TOPY+1.6,0):null;}
  if(INT.fade>0){INT.fade=Math.max(0,INT.fade-dt*.7);INT.U.k.value=INT.fade;if(!INT.fade)INT.m.visible=false;}
  // the last few on the field get markers
  if(phaseFight()){const live=ENEMIES.filter(E=>!E.H.dead&&!E.gunner&&E.pos.distanceTo(P.pos)<90);if(live.length&&live.length<=3)markList=live.map(E=>{const v=E.pos.clone().setY(E.pos.y+2.6);v.team=E.team;return v;});}
  if(phaseFight()&&phase!=='north'&&phase!=='flank')P.spawn.copy(at(Math.max(4,s-16),0));
}
let chamberClear=false;

/* ---------- ACT A (Oct 26, Bryce's blueprint): the north concourse, and the long way round ---------- */
// hold the crash site: Host dropships come down on it, and both Herald sides come to see what fell
const HK=window.P3_HOLD_K||1;   // (tests only: shorter holds)
const NORTH={dur:50*HK};
function northDirector(dt){const left=Math.max(0,NORTH.dur-phT);WP=null;squadFollow(1);
  PG.objective(left>0?'Hold the crash site · '+Math.ceil(left)+' s':'Clear the concourse');P.spawn.set(NCRASH.x,0,NCRASH.z+16);
  const c=V3(NCRASH.x,0,NCRASH.z+6);
  once('n1',()=>{launchDrop(V3(NCRASH.x-26,0,NCRASH.z+30),3+n0(),1.5);launchDrop(V3(NCRASH.x+28,0,NCRASH.z+24),3+n0(),3.5);setTimeout(()=>PG.say('Okafor','Host dropships! Two of them, coming down on us!','alert'),1200);});
  if(phT>18)once('n2',()=>{for(let k=0;k<3+n0();k++)spawnTrooper(c.x+R(-40,-28),c.z+R(10,40),{team:'red',hold:R(10,18)});for(let k=0;k<3+n0();k++)spawnTrooper(c.x+R(28,40),c.z+R(10,40),{team:'amber',hold:R(10,18)});
    setTimeout(()=>PG.say('Thorne','Both sides. Red west, amber east. They came to see what fell.','alert'),400);});
  if(phT>32)once('n3',()=>{launchDrop(V3(NCRASH.x,0,NCRASH.z+52),4+n0(),0);});
  if(left>0&&Math.ceil(left)%15===0&&Math.ceil(left)!==NORTH.lastB&&Math.ceil(left)<NORTH.dur){NORTH.lastB=Math.ceil(left);banner(Math.ceil(left)+' s','alert');}
  const near=ENEMIES.filter(E=>!E.H.dead&&E.pos.distanceTo(c)<90);
  if(left<=0&&near.length&&near.length<=3)markList=near.map(E=>{const v=E.pos.clone().setY(E.pos.y+2.6);v.team=E.team;return v;});
  if(left<=0&&(!near.length||phT>NORTH.dur+30)){setPhase('flank');FLANK.on=true;saveCP('flank');banner('Round the city · west or east, to the plaza');
    talk([[.4,'Captain Rhen','Clear. Now we walk. West or east, it’s the same distance.'],[3,'Ensign Landry','I’ll keep the case’s scan on. If that wall opens anywhere else, I’ll see it.']]);}}
// the way round: three places a side, each its own fight (they're only set up on the side you take)
const FLANK_ENC={
  W:[[.13,'Market Terraces',k=>{for(let i=0;i<5+n0();i++)fHost(k,.17,R(-10,10));launchDrop(flankAt(k,FLANK.len[k]*.2,0),3+n0(),1);},'Host in the market! Under the awnings!'],
     [.44,'the Aqueduct Break',k=>{for(let i=0;i<4+n0();i++)fHer(k,'amber',.49,R(-12,12),{unit:i<2?'sniper':undefined,anchor:true});for(let i=0;i<3+n0();i++)fHer(k,'red',.52,R(-9,9));},'Amber riflemen up by the aqueduct! Red’s hitting them!'],
     [.75,'the Reliquary Steps',k=>{for(let i=0;i<4+n0();i++)fHer(k,'red',.8,R(-10,10));for(let i=0;i<3;i++)fHost(k,.83,R(-8,8));
       if(typeof MECH!=='undefined'){const a=flankAt(k,FLANK.len[k]*.84,6),b=flankAt(k,FLANK.len[k]*.8,-4);MECH.spawn(a.x,a.z,{path:[b,a]});setTimeout(()=>PG.say('Sergeant Marsh','Red walker by the shrine! Breaker!','alert'),2200);}},'Red at the shrine! They’re dug in!']],
  E:[[.13,'the Spire Gardens',k=>{for(let i=0;i<4+n0();i++)fHost(k,.17,R(-12,12));for(let i=0;i<2+n0();i++)fHer(k,'red',.2,R(-10,10));},'Host in the gardens! Use the trees!'],
     [.46,'the Herald Barracks',k=>{for(let i=0;i<4+n0();i++)fHer(k,'amber',.5,R(-10,10),{anchor:true,unit:i===0?'heavy':undefined});for(let i=0;i<4+n0();i++)fHer(k,'red',.54,R(-12,12),{unit:i===0?'heavy':i===1?'commander':undefined});},'Herald barracks! Both sides are in there!'],
     [.77,'the Lantern Bridge',k=>{launchDrop(flankAt(k,FLANK.len[k]*.81,-4),4+n0(),0);launchDrop(flankAt(k,FLANK.len[k]*.85,5),3+n0(),2.4);},'Host dropships over the bridge!']]};
function fHost(k,f,lat){const p=flankAt(k,FLANK.len[k]*f+R(-8,8),lat);return spawnTrooper(p.x,p.z,{team:'host',hold:R(8,16)});}
function fHer(k,team,f,lat,o){o=o||{};const p=flankAt(k,FLANK.len[k]*f+R(-8,8),lat);const E=spawnTrooper(p.x,p.z,Object.assign({team,hold:R(14,26)},o,{anchor:o.anchor?p.clone():undefined}));return E;}
function flankDirector(dt){
  // you choose the side by going round it: once you're well out either way, that's the way the team goes
  const k0=flankSide(P.pos.x,P.pos.z);if(!FLANK.chose&&Math.abs(P.pos.x)>40){FLANK.chose=true;FLANK.side=k0;PG.say('Captain Rhen',k0==='W'?'West. Stay on me.':'East. Stay on me.');}
  const k=FLANK.chose?FLANK.side:k0;if(!FLANK.chose)FLANK.side=k0;
  const u=flankU(P.pos.x,P.pos.z,k),L=FLANK.len[k];
  {const w=flankAt(k,Math.min(L,u+60),0);WP=w.setY(3);}PG.objective('Round the city to the plaza · '+Math.round(L-u)+' m');squadFollow(1);
  P.spawn.copy(flankAt(k,Math.max(0,u-16),0));
  if(FLANK.chose)for(const [f,name,spawn,line] of FLANK_ENC[k]){if(u>L*f)once('fl'+k+f,()=>{spawn(k);setTimeout(()=>PG.say(k==='W'?'Okafor':'Thorne',line,'alert'),500);});}
  if(u>L*.3)say('fl1','Thorne','That wall of light goes all the way round. Amber built it fast.');
  if(u>L*.6)say('fl2','Ensign Landry','The case is pulling toward the middle, Captain. Harder the closer we get.');
  if(u>L*.9)say('fl3','Sergeant Marsh','The plaza. And the opening we came through.');
  // the plaza: the walk round is done; the streets from here, as before
  if(Math.hypot(P.pos.x-LZ.x,P.pos.z-LZ.z)<LZ.r+14||(Math.abs(P.pos.x)<60&&P.pos.z>300&&P.pos.z<LZ.z+20)){FLANK.on=false;setPhase('streets');saveCP('streets');banner('The plaza · get to the tower');
    launchDrop(at(30,-6),3+n0(),.8);talk([[.4,'Okafor','Host coming down in the plaza behind us!','alert'],[2.6,'Captain Rhen','Up the street. The tower.']]);}}
// the floor gives way past the Crown Hold
function collapse(){HOLE_OPEN=true;TOWER.holePatch.visible=false;if(window.goalPop)setTimeout(()=>goalPop('Through the broken wall','Drop down into the passage below'),2600);shakeT=1.4;flashScreen(.18);
  const p=spiralPt(TH_DROP,(IR+IRW+RC-RW)/2),y=uwY(TH_DROP);for(let k=0;k<10;k++){boom(V3(p.x+R(-3,3),y+R(2,10),p.z+R(-3,3)),R(3,6),0xffe8c8,.3);puff(V3(p.x+R(-4,4),y+R(1,8),p.z+R(-4,4)),R(3,6),3);}
  if(typeof sfx!=='undefined'){sfx.collapse(V3(p.x,y+6,p.z));}
  talk([[.2,'Okafor','The wall! It’s coming down!','alert'],[2.2,'Sergeant Marsh','There’s a way through it. Down, there’s a passage under us.'],[2.6,'Captain Rhen','Then we go down. Through the wall, everybody!','alert']]);}

/* ---------- cutscenes ---------- */
/* Oct 27 (Bryce: the ship was under the ground at the start of the opening, and flew through a lot of buildings over the city):
   flyMin(x,z) is the lowest she can be at a point: the sand (the dunes outside the wall rise high now) or the tops of the buildings
   (FLY), plus room for her hull. A flight path is lifted to it, with the climb starting early so she rises smoothly instead of popping */
function flyMin(x,z,clear){let h=Math.max(floorAt(x,z),typeof meshY==='function'?meshY(x,z):-1e9);const rad=14;
  for(const o of FLY){const d=Math.hypot(x-o.x,z-o.z);if(d<o.r+rad)h=Math.max(h,o.h);}
  const rr=Math.hypot(x,z);if(Math.abs(rr-WR)<WT+rad&&!(z>0&&Math.abs(x)<GATE.r+6))h=Math.max(h,WH);return h+(clear||10);}
function liftPath(curve,n,clear,keepEnd){const req=[];for(let i=0;i<=n;i++){const p=curve.getPointAt(i/n);req.push(flyMin(p.x,p.z,clear));}
  const L=curve.getLength(),step=L/n,slope=.45;   // she climbs at most ~1 m per 2 m flown: start the climb ahead of the building
  for(let i=n-1;i>=0;i--)req[i]=Math.max(req[i],req[i+1]-slope*step);for(let i=1;i<=n;i++)req[i]=Math.max(req[i],req[i-1]-slope*step);
  if(keepEnd){const i0=n-keepEnd,y0=req[i0],y1=curve.getPointAt(1).y;for(let i=i0;i<=n;i++){const f=(i-i0)/keepEnd;req[i]=lerp(y0,y1,f*f*(3-2*f));}}   // the landing: an even glide down from wherever the climb left her
  return u=>{const f=clamp(u,0,1)*n,i=Math.min(n-1,Math.floor(f));return lerp(req[i],req[i+1],f-i);};}
const crew=()=>[P.H,...SQUAD.map(A=>A.H)];
const face=(a,b)=>Math.atan2(-(b.x-a.x),-(b.z-a.z));
// set pieces only the opening uses: fighters crossing the sky
function cutFighters(n){const out=[];for(let i=0;i<n;i++){const team=['red','amber','red','amber','host'][i%5],g=makeFighter(team);out.push({g,team,p0:V3(R(-500,500),R(140,300),R(-400,300)),v:V3(R(-1,1),R(-.1,.1),R(-1,1)).normalize().multiplyScalar(R(90,140))});}
  return{list:out,update(dt){for(const f of out){f.p0.addScaledVector(f.v,dt);f.g.position.copy(f.p0);f.g.lookAt(f.p0.clone().add(f.v));f.g.rotateY(Math.PI);}},clear(){for(const f of out)scene.remove(f.g);}};}
function introScene(done){
  setLook('night');P.H.root.visible=false;SQUAD.forEach(A=>{A.on=false;A.H.root.visible=false;});TWO.visible=true;
  const CF=cutFighters(8);let beamT=0,warCh=0;
  let lift=0;const fly=(t,from,to,dur)=>{const u=clamp(t/dur,0,1);TWO.position.lerpVectors(from,to,u);{const p=TWO.position,need=Math.max(flyMin(p.x,p.z,16),flyMin(p.x,p.z-60,16)-4)-p.y;lift=need>lift?need:Math.max(need,lift-1.2*(1/60));p.y+=Math.max(0,lift);}TWO.position.y+=Math.sin(t*1.3)*.6;TWO.rotation.set(-.03,0,Math.sin(t*.9)*.025);};
  const warBeams=dt=>{beamT-=dt;if(beamT<.55&&!warCh&&typeof sfx!=='undefined'&&sfx.charge){warCh=1;sfx.charge(WARSHIP.g.position);}if(beamT<=0){beamT=R(1.5,3);warCh=0;fire(WARSHIP.g.position.clone(),V3(R(-300,300),0,R(-320,250)),900,'wbeam',q=>{boom(q,R(18,28),0xff8a3a,1.2);puff(q,R(12,18),6);});}};
  const A0=V3(30,40,2600),A1=V3(0,70,1900),A2=V3(0,110,1600),A3=V3(0,150,1350),rv=V3();
  playCut([
    {dur:4,black:true,small:'Pathfinder · Level 03 · 10.03.2237',cap:'The White City',cam:[[60,30,2700]],look:[[0,60,0]],fn:(t,dt)=>{fly(t,A0,A1,26);CF.update(dt);},score:'awe'},
    // low over the dunes in the dark, Dropship Two's three good engines; the city ahead, glowing on the horizon
    {dur:8,camAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(-22+u*6,6-u*2,40-u*10)),lookAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(0,10,-200)),
      fn:(t,dt)=>{fly(4+t,A0,A1,26);CF.update(dt);warBeams(dt);}},
    {dur:7,camAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(-24+u*4,5,-38+u*4)),lookAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(0,2,-4)),
      say:[[.4,'Ensign Landry','I’m not seeing any landing infrastructure.'],[0,'Thorne','There isn’t any.'],[0,'Sergeant Marsh','Then how did they build it?'],[0,'Thorne','I don’t think they did.']],
      fn:(t,dt)=>{fly(12+t,A0,A1,26);CF.update(dt);warBeams(dt);}},
    // the wall from in front: a hundred metres of white stone, one round opening, sealed with light; the war over it
    {dur:7,cam:[[-60,30,1150],[-40,60,1000]],look:[[0,60,520],[0,70,500]],
      say:[[.6,'Okafor','There’s a war on top of it.'],[0,'Thorne','Both sides. Red’s hitting the city. Amber’s holding it.']],
      fn:(t,dt)=>{TWO.position.lerpVectors(A1,A2,clamp(t/7,0,1));{const p=TWO.position;p.y=Math.max(p.y,flyMin(p.x,p.z,16));}TWO.rotation.set(0,0,0);CF.update(dt);warBeams(dt);}},
    {dur:6,camAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(-6,4,22)),lookAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(0,8,-120)),
      say:[[.4,'Captain Rhen','Find somewhere to put us down.'],[0,'Ensign Landry','Inside that wall, Captain, or nowhere. And I can’t fly and keep the core alive.']],
      fn:(t,dt)=>{TWO.position.lerpVectors(A2,A3,clamp(t/6,0,1));{const p=TWO.position;p.y=Math.max(p.y,flyMin(p.x,p.z,16));}CF.update(dt);warBeams(dt);}},
    {dur:4,camAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(0,9,28)),lookAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(0,4,-60)),
      say:[[.2,'Captain Rhen','Then I’ll fly.','alert']],fn:(t,dt)=>{TWO.position.copy(A3);CF.update(dt);}},
  ],()=>{CF.clear();done&&done();},{hush:true});
}
// through the opening, down in the plaza; the five of them out of her, and she won't fly again
function landScene(){
  if(lookName==='night')scene.fog.density=LOOKS.night.dens;
  setPhase('landcut');P.H.root.visible=false;SQUAD.forEach(A=>{A.on=false;});
  const from=TWO.position.clone(),q0=TWO.quaternion.clone(),qL=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0)),hover=V3(LANDP.x,14,LANDP.z+6),rv=V3();
  const team=[P,...SQUAD];
  // each one's run off the ramp: out of the tail, round her flank (port for the even ones, starboard for the odd), to a spot
  // in a loose line ahead of the nose, all facing up the street. You (team[0]) end where you take control.
  const ends=[[0,LZ.z-18],[2.6,LZ.z-16],[-2.8,LZ.z-15.5],[5,LZ.z-14.5],[-5.2,LZ.z-14]];
  const crewPath=team.map((A,i)=>{const s=i%2?1:-1,e=ends[i],z0=LANDP.z;
    const pts=[[s*.8,z0+12],[s*2.5,z0+16],[s*7.5,z0+11],[s*7.5,z0-17],[e[0]*.6+s*4,e[1]+4],[e[0],e[1]]];
    const seg=[];let L=0;for(let k=1;k<pts.length;k++){const l=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);seg.push(l);L+=l;}
    return{pts,seg,L};});
  const pathAt=(P2,d,o)=>{d=clamp(d,0,P2.L);let k=0;while(k<P2.seg.length-1&&d>P2.seg[k]){d-=P2.seg[k];k++;}
    const a=P2.pts[k],b=P2.pts[k+1],u=P2.seg[k]?clamp(d/P2.seg[k],0,1):1,dx=b[0]-a[0],dz=b[1]-a[1];
    o.set(a[0]+dx*u,0,a[1]+dz*u);o.yaw=d>=P2.seg[k]&&k===P2.seg.length-1?0:Math.atan2(-dx,-dz);return o;};
  playCut([
    {dur:5,camAt:(u,t,o)=>o.set(18,8,LZ.z-20),lookAt:(u,t,o)=>o.copy(TWO.position),
      say:[[.8,'Ensign Landry','Hold on! She’s coming down hard!','alert']],
      fn:(t,dt)=>{const u=sstep(0,4.2,t);TWO.position.lerpVectors(from,hover,u);TWO.quaternion.slerpQuaternions(q0,qL,u);if(t>3.8){TWO.position.y=lerp(14,3.2,sstep(3.8,5,t));}
        if(t>4.6&&!TWO.userData.down){TWO.userData.down=1;boom(V3(LANDP.x,1,LANDP.z),12,0xfff0d0,.4);for(let k=0;k<10;k++)puff(V3(LANDP.x+R(-12,12),1,LANDP.z+R(-12,12)),R(4,8),4);shakeT=.8;if(typeof sfx!=='undefined')sfx.crash(TWO.position);}}},
    // Oct 25: the ramp is at her tail (+z) and her nose points at the city, so they come down the ramp, turn out to her flanks
    // and run the length of her, a few metres off her side, to fall in ahead of the nose. (Before: a straight line from the ramp
    // to the nose, which ran through her hull, facing back the way they came.)
    {dur:10.5,cam:[[16,2.2,LZ.z-22],[13,2,LZ.z-20]],look:[[0,2.2,LANDP.z+2],[-2,1.8,LZ.z-12]],
      say:[[.8,'Ensign Landry','That’s it. Core’s gone. She’s done.'],[0,'Captain Rhen','Then we walk. Everybody out.']],
      fn:(t,dt)=>{TWO.position.y=3.2;team.forEach((A,i)=>{const P2=crewPath[i],d=Math.max(0,t-.3-i*.4)*6.8,q=pathAt(P2,d,rv);
        A.pos.set(q.x,0,q.z);A.H.root.visible=t>.3+i*.4;A.H.root.rotation.y=q.yaw;const mv=d<P2.L;poseHuman(A.H,dt,mv?6.8:0,mv?0:.6,mv);});
        if(rng()<.3)puff(TWO.position.clone().add(V3(R(-6,6),2,R(-8,8))),R(3,6),4);}},
    {dur:5,cam:[[2.5,2.1,LZ.z-5],[1.8,2.5,LZ.z-7]],look:[[0,12,300],[0,30,120]],
      say:[[.4,'Thorne','The tower. Every street in this city runs to it.'],[0,'Captain Rhen','Then so do we.']],fn:(t,dt)=>{team.forEach((A,i)=>{A.pos.set(ends[i][0],0,ends[i][1]);A.H.root.visible=true;A.H.root.rotation.y=0;poseHuman(A.H,dt,0,.6,false);});}},
  ],()=>{SQUAD.forEach(A=>{A.on=true;});P.H.root.visible=true;P.pos.set(0,0,LZ.z-18);P.yaw=0;SQUAD.forEach((A,i)=>A.pos.set(ends[i+1][0],0,ends[i+1][1]));P.pitch=-.03;setPhase('streets');saveCP('streets');banner('Get to the tower');},{hush:true});
}

/* (Oct 26, Bryce's blueprint) through the opening she can't set down: the plaza is full of the Host. Rhen takes her on up the
   streets and round the tower's west flank, a red beam clips her, and she comes down hard on the north concourse. They come out of
   her ramp facing the city, and see amber's wall of light round its heart. */
function crashScene(){
  if(lookName==='night')scene.fog.density=LOOKS.night.dens;
  setPhase('landcut');P.H.root.visible=false;SQUAD.forEach(A=>{A.on=false;A.H.root.visible=false;});
  const rv=V3(),team=[P,...SQUAD],from=TWO.position.clone();
  const path=new THREE.CatmullRomCurve3([from,V3(4,62,330),V3(-30,76,170),V3(-120,86,40),V3(-116,74,-120),V3(-52,46,-250),V3(LANDP.x,16,LANDP.z+14)]);
  const lift=liftPath(path,240,14,30);
  const along=u=>{u=clamp(u,0,1);const p=path.getPointAt(u),t=path.getTangentAt(u);p.y=Math.max(p.y,lift(u));TWO.position.copy(p);TWO.rotation.set(-.06,Math.atan2(-t.x,-t.z),Math.sin(u*16)*.05+(TWO.userData.hit?.16:0));return t;};
  const ends=[[0,LANDP.z+30],[2.6,LANDP.z+28],[-2.8,LANDP.z+27.5],[5,LANDP.z+26.5],[-5.2,LANDP.z+26]];
  const crewPath=team.map((A,i)=>{const sd=i%2?1:-1,e=ends[i],z0=LANDP.z,pts=[[sd*.8,z0+12],[sd*2.5,z0+16],[e[0],e[1]]],seg=[];let L=0;
    for(let k=1;k<pts.length;k++){const l=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);seg.push(l);L+=l;}return{pts,seg,L};});
  const pathAt=(P2,d,o)=>{d=clamp(d,0,P2.L);let k=0;while(k<P2.seg.length-1&&d>P2.seg[k]){d-=P2.seg[k];k++;}const a=P2.pts[k],b=P2.pts[k+1],u=P2.seg[k]?clamp(d/P2.seg[k],0,1):1,dx=b[0]-a[0],dz=b[1]-a[1];
    o.set(a[0]+dx*u,0,a[1]+dz*u);o.yaw=Math.atan2(-dx,-dz);return o;};
  TWO.userData.hit=false;TWO.userData.down=false;
  playCut([
    {dur:5,camAt:(u,t,o)=>{const tg=along(t/5*.3);return o.copy(TWO.position).add(rv.set(-tg.x*34+8,12,-tg.z*34));},lookAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(0,2,-60)),
      say:[[.3,'Ensign Landry','The plaza’s full of them! Host dropships on the pad!','alert'],[0,'Captain Rhen','Then not the plaza. Up the street, find me the far side.']]},
    {dur:6.5,camAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(26-u*10,9+u*4,34-u*18)),lookAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(-6,0,-30)),
      say:[[.6,'Ensign Landry','The tower, sir! It goes all the way up!','alert'],[0,'Captain Rhen','Round it. West.']],
      fn:(t,dt)=>{along(.3+t/6.5*.38);if(t>3.6&&!TWO.userData.hit){TWO.userData.hit=true;fire(WARSHIP.g.position.clone(),TWO.position.clone(),900,'wbeam',q=>{boom(q,14,0xff8a3a,.9);boom(q,8,0xfff0d0,.4);});
          const e=TWO.userData.eng;if(e&&e[1])e[1].material.opacity=0;shakeT=.6;if(typeof sfx!=='undefined')sfx.blast(TWO.position);PG.say('Ensign Landry','We’re hit! I’m losing the core!','alert');}
        if(TWO.userData.hit&&rng()<.4)puff(TWO.position.clone().add(V3(R(-3,3),1,R(2,8))),R(3,5),3);}},
    {dur:5.2,cam:[[38,7,LANDP.z+46],[32,6,LANDP.z+40]],lookAt:(u,t,o)=>o.copy(TWO.position),
      say:[[.4,'Captain Rhen','Hold on! She’s coming down!','alert']],
      fn:(t,dt)=>{if(t<3.4)along(.68+t/3.4*.32);else{TWO.position.lerpVectors(V3(LANDP.x,16,LANDP.z+14),V3(LANDP.x,3.2,LANDP.z),sstep(3.4,4.6,t));TWO.rotation.set(0,0,lerp(.16,.05,sstep(3.4,4.6,t)));}
        if(rng()<.5)puff(TWO.position.clone().add(V3(R(-4,4),1,R(0,8))),R(3,5),3);
        if(t>4.5&&!TWO.userData.down){TWO.userData.down=true;boom(V3(LANDP.x,1,LANDP.z),14,0xfff0d0,.4);for(let k=0;k<12;k++)puff(V3(LANDP.x+R(-14,14),1,LANDP.z+R(-14,14)),R(4,8),4);shakeT=1;if(typeof sfx!=='undefined')sfx.crash(TWO.position);}}},
    {dur:10,cam:[[16,2.6,LANDP.z+44],[12,2.4,LANDP.z+40]],look:[[0,2.2,LANDP.z+14],[-2,2,LANDP.z+24]],
      say:[[.6,'Ensign Landry','That’s it. Core’s gone. She won’t fly again.'],[0,'Thorne','Captain. Look at the middle of the city.'],[0,'Sergeant Marsh','A wall of light. All the way round.'],
           [0,'Thorne','Amber’s. There’s one way in. The south, where the streets start.'],[0,'Captain Rhen','The plaza we just flew over.']],
      fn:(t,dt)=>{TWO.position.set(LANDP.x,3.2,LANDP.z);team.forEach((A,i)=>{const P2=crewPath[i],d=Math.max(0,t-.3-i*.4)*6.4,q=pathAt(P2,d,rv);
        A.pos.set(q.x,0,q.z);A.H.root.visible=t>.3+i*.4;const mv=d<P2.L;A.H.root.rotation.y=mv?q.yaw:Math.PI;poseHuman(A.H,dt,mv?6.4:0,mv?0:.6,mv);});
        if(rng()<.3)puff(TWO.position.clone().add(V3(R(-6,6),2,R(-8,8))),R(3,6),4);}},
  ],()=>{SQUAD.forEach((A,i)=>{A.on=true;A.H.root.visible=true;A.pos.set(ends[i+1][0],0,ends[i+1][1]);});P.H.root.visible=true;P.pos.set(ends[0][0],0,ends[0][1]);P.yaw=Math.PI;P.pitch=-.03;
    TWO.position.set(LANDP.x,3.2,LANDP.z);TWO.rotation.set(0,0,.05);setPhase('north');saveCP('north');banner('Hold the crash site','alert');
    PG.say('Captain Rhen','Then we walk. But not yet. Host, inbound!','alert');},{hush:true});
}

/* ---------- THE ENDING ----------
   The socket. The dome. The warning (Bryce's words). The Host. The capture. The light that keeps blinking. */
function endScene(){
  for(const E of ENEMIES)if(!E.H.dead){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  BAR.on=false;FLANK.on=false;BARWALL.m.visible=BARWALL.posts.visible=BARWALL.glows.visible=false;   // (amber's wall: their emitters go dark when the dome rises)
  onUse=null;WP=null;for(const t of TASKS)t.on=false;
  const team=[P,...SQUAD];const S=SOCKET;
  // where everyone stands: Rhen at the socket, the others in an arc behind him toward the way in (west)
  const spots=[V3(-1.85,TOPY,.15),V3(-4.8,TOPY,-2.4),V3(-5.4,TOPY,2.2),V3(-3.6,TOPY,-4.6),V3(-6.3,TOPY,4.3)];
  team.forEach((A,i)=>{A.pos.copy(spots[i]);A.H.root.visible=true;A.H.crouchTo=0;reviveHuman(A.H);if(A.H.gun)A.H.gun.visible=true;A.kneel=0;});
  const RHEN0=spots[0].clone(),RHEN_TX=V3(-5.0,TOPY,4.0);
  CASE.g.visible=false;
  // Landry's transmitter on the floor by her
  const TX=new THREE.Group();TX.position.set(-5.55,TOPY,4.95);TX.rotation.y=-.9;scene.add(TX);
  {const mt=new THREE.MeshStandardMaterial({color:C(0x4a5260),map:panelTex,metalness:.6,roughness:.45});
   const b=new THREE.Mesh(boxUV(.46,.22,.32,2),mt);b.position.y=.11;TX.add(b);
   const lid=new THREE.Mesh(boxUV(.46,.26,.03,2),mt);lid.position.set(0,.33,-.15);lid.rotation.x=-.25;TX.add(lid);
   const scr=new THREE.Mesh(new THREE.PlaneGeometry(.38,.18),new THREE.MeshBasicMaterial({color:C(0x2a6a5a).multiplyScalar(1.4),toneMapped:false}));scr.position.set(0,.33,-.13);scr.rotation.x=-.25;TX.add(scr);
   for(const x of[-.15,-.07,.01]){const kb=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.02,8),new THREE.MeshStandardMaterial({color:C(0x9aa0a8),metalness:.8,roughness:.3}));kb.position.set(x,.23,.1);TX.add(kb);}
   const ant=new THREE.Mesh(new THREE.CylinderGeometry(.008,.012,.62,5),new THREE.MeshStandardMaterial({color:C(0x8a8e98),metalness:.7}));ant.position.set(.19,.52,.08);ant.rotation.z=-.12;TX.add(ant);}
  const txLight=glowSprite(0x6aff9a,.16,2.6,0);txLight.position.set(.16,.25,.12);TX.add(txLight);
  const txLamp=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),new THREE.MeshBasicMaterial({color:C(0x6aff9a).multiplyScalar(2),toneMapped:false}));txLamp.position.copy(txLight.position);TX.add(txLamp);
  // the Host: troopers to walk in, and an officer
  const HOST=[];for(let i=0;i<7;i++){const H=makeHuman('trooper');scene.add(H.root);MODELS.enemy(H,'host',{unit:i===2||i===5?'heavy':'footsoldier',k:.4,lod:'phone'});H.root.visible=false;H.root.position.set(-RC,TOPY,0);HOST.push(H);}
  const OFF=makeHuman('trooper');scene.add(OFF.root);MODELS.enemy(OFF,'host',{unit:'commander',k:.5});OFF.root.scale.setScalar(1.18);OFF.root.visible=false;   // the Host commander (his own cape)
  {const ring=glowSprite(0xb46aff,.6,2.4,.9);ring.position.set(0,1.45,-.24);OFF.root.add(ring);}
  // the Host fleet over the city, and their dropships coming down through the dome
  const FLEET=[0,1,2].map(i=>{const g=new THREE.Group(),K=SHIPKIT.voidclass(),h0=new THREE.Mesh(K.geo,fleetHullMat(panelTex)),h1=new THREE.Mesh(K.glowGeo,fleetGlowMat(HOST_GLOW,2.2));g.add(h0,h1);K.geo.computeBoundingBox();
    g.scale.setScalar([340,260,280][i]/(K.geo.boundingBox.max.z-K.geo.boundingBox.min.z));MODELS.swapShip(g,'voidclass',{ref:K.geo,hide:[h0,h1]});g.visible=false;scene.add(g);
    const sheath=glowSprite(0xff9a5a,260,1.6,0);g.add(sheath);return{g,sheath,p0:V3([-300,260,40][i],1700,[-200,-450,250][i]),p1:V3([-260,220,60][i],[720,640,820][i],[-160,-420,260][i])};});
  const DROPS3=[0,1,2,3,4].map(i=>{const g=new THREE.Group(),G=hostDropshipGeo();g.add(new THREE.Mesh(G.geo,dropMat),new THREE.Mesh(G.glow,dropGlow));g.scale.setScalar(.38);g.visible=false;scene.add(g);
    return{g,p0:V3(R(-260,260),900,R(-260,260)),p1:V3(R(-200,200),R(40,80),R(-200,200))};});
  // marching through the dome's edge, out in the city (seen from the street)
  const MARCH=[];for(let i=0;i<8;i++){const H=makeHuman('trooper');scene.add(H.root);MODELS.enemy(H,'host',{unit:i%4===3?'heavy':'footsoldier',k:.4,lod:'lod'});H.root.visible=false;MARCH.push(H);}
  // Herald soldiers in the street: they look up when the dome rises, and stop
  const STREET=[],SQ=S_DOOR-64;for(let i=0;i<4;i++){const H=makeHuman('trooper');scene.add(H.root);const red=i%2===0;MODELS.enemy(H,red?'red':'amber',{unit:i===1?'engineer':i===2?'heavy':'footsoldier',k:window.HERALD_LIFT});
    const p=at(SQ-(i>>1)*5,(red?-1:1)*(4.5+(i>>1)*1.5));H.root.position.copy(p);const q=at(SQ-(i>>1)*5,(red?1:-1)*5);H.root.rotation.y=face(p,q);H.root.visible=false;STREET.push({H,red});}
  const rv=V3(),hands=(H,k)=>{};   // 'weapons down': the rifles come off the aim (poseHuman's low ready, hands still on them); no raised hands
  let surrender=0,kneel=0,lookUp=0;
  const live=(t,dt,o)=>{o=o||{};team.forEach((A,i)=>{A.pos.y=TOPY;const look=o.lookAt||S;A.H.root.rotation.y=i===0&&o.rhenFace!=null?o.rhenFace:face(A.pos,look);A.H.crouchTo=0;
      poseHuman(A.H,dt,i===0&&o.walk?2.2:0,surrender>0?0:o.aim||0,false);if(surrender>0)hands(A.H,surrender);const kk=Math.max(kneel,A.kneel||0);kneelPose(A.H,kk);
      // kneeling (at the transmitter, or with their weapons down): rifle off, forearms forward over the knee, elbows bent
      if(kk>.3&&(surrender>0||A!==P||kneel>0)){const H=A.H,rl=H.R?Math.atan2(H.R.el[0]-H.R.sh[0],H.R.sh[1]-H.R.el[1]):0;if(H.gun&&surrender>0)H.gun.visible=false;
        if(surrender>0||A===LANDRY)for(const [i,sg] of[[0,1],[1,-1]]){const R2=H.arms[i];R2.sh.rotation.set(lerp(R2.sh.rotation.x,.4,kk),0,sg*rl*.85);R2.el.rotation.set(lerp(R2.el.rotation.x,1.15,kk),0,0);}}A.H.head.rotation.x=lookUp*.6;});
    OBJ.U.uT.value+=dt;};
  // the object in Rhen's two hands, held out in front of him (arms forward, elbows nearly straight; the rifle slung, out of sight)
  const rhenHold=(t,reach)=>{const H=P.H;if(H.gun)H.gun.visible=false;for(const [i,sg] of[[0,1],[1,-1]]){const A=H.arms[i];A.sh.rotation.set(1.05+.35*(reach||0),0,.18*sg);A.el.rotation.set(-.35+.25*(reach||0),0,0);}};
  // where the object is, in front of Rhen at chest height, and how it gets to the slot
  const handPt=(k)=>{const f=face(P.pos,S),d=V3(-Math.sin(f),0,-Math.cos(f));return P.pos.clone().addScaledVector(d,.5+.35*k).add(V3(0,1.12-.1*k,0));};
  // the dome: rise, hold, fail
  const domeSet=(k,f,fl)=>{DOME.m.visible=k>0;DOME.U.rise.value=k;DOME.U.hold.value=f;DOME.U.flick.value=fl||0;skyU.domeK.value=k*f;CITY.wake.value=k*f;TOWER.floorU.wake.value=Math.max(TOWER.floorU.wake.value*0,k>0?f:0);};
  const putObj=(y)=>{OBJ.m.visible=true;OBJ.m.position.set(S.x,S.y+.8+y,S.z);};const objAt=p=>{OBJ.m.visible=true;OBJ.m.position.copy(p);};
  const hostIn=(t,dt,n,toward)=>{HOST.forEach((H,i)=>{if(i>=n)return;H.root.visible=true;const tgt=V3(-12.5+Math.cos(i)*2.5,TOPY,(i-3)*2.6),st=V3(-RC+2-i*1.6,TOPY,(i%2?1:-1)*1.2),u=clamp((t-i*.35)/4,0,1);
    H.root.position.lerpVectors(st,tgt,u);H.root.position.y=TOPY;H.root.rotation.y=face(H.root.position,toward||S);poseHuman(H,dt,u<1?3:0,1,false);});};
  /* street troopers: looking up, lowering weapons (Bryce, Oct 23: their arms were wrong). They wear the Host trooper model, whose rifle
     is built into the right forearm; blending its aim to 0 dropped that arm straight down with the gun through the leg and let the off
     arm hang loose. So they stay in the aiming pose they use in play and tip the rifles down (a negative aim pitch, the same arms a
     trooper has shooting downhill), then look up. k 0..1 */
  const streetLive=(dt,k)=>{STREET.forEach(({H})=>{H.root.visible=true;H.crouchTo=0;H.aimPitch=-.6*k;poseHuman(H,dt,0,1,false);H.head.rotation.x=.75*k;});};
  const marchLive=(t,dt)=>{MARCH.forEach((H,i)=>{H.root.visible=true;const x=-14+(i%4)*5+(i>>2)*2.5,z=WR+74+(i>>2)*5-(i%2)*1.5-t*2.8;H.root.position.set(x,duneY(x,z),z);H.root.rotation.y=0;poseHuman(H,dt,2.6,1,false);});};
  const wide=V3(520,260,980);
  // Rhen's face, for the close shots: in front of him and a little to the side, at his eye height (lower when he kneels)
  // (the head's real position, after this frame's pose: a kneel lowers it by however much the model's legs fold)
  const eyeOf=(A,o)=>{A.H.root.updateMatrixWorld(true);return A.H.head.getWorldPosition(o).add(V3(0,.1,0));};
  const faceCam=(o,side,dist,lookTo)=>{const f=face(P.pos,lookTo),d=V3(-Math.sin(f),0,-Math.cos(f)),r=V3(Math.cos(f),0,-Math.sin(f)),ey=eyeOf(P,V3()).y;
    return o.copy(P.pos).addScaledVector(d,dist).addScaledVector(r,side).setY(ey+.05);};
  const toTX=()=>{const k=P.pos.distanceTo(RHEN_TX);return k;};
  playCut([
    // the object, out of the case, in Rhen's hands; he reaches it out over the slot
    {dur:6,cam:[[1.5,TOPY+1.75,2.9],[1.3,TOPY+1.6,2.5]],look:[[-1.1,TOPY+1.05,.1]],score:'awe',
      say:[[1.2,'Okafor','What happens when it goes in?'],[0,'Captain Rhen','We find out what they were afraid of.']],
      fn:(t,dt)=>{const k=sstep(1.5,6,t);live(t,dt,{rhenFace:face(P.pos,S)});rhenHold(t,k);objAt(handPt(0).lerp(V3(S.x,S.y+1.15,S.z),k*.85));OBJ.U.wake.value=.3+.3*sstep(2,6,t);}},
    // in: it sinks into the slot; the lip lights, lines of gold run out across the floor and up the wall
    {dur:6,cam:[[2.3,TOPY+1.0,1.9],[2.9,TOPY+1.6,2.7]],look:[[0,TOPY+.85,0],[0,TOPY+1.6,0]],
      fn:(t,dt)=>{live(t,dt,{rhenFace:face(P.pos,S)});const k=sstep(0,1.4,t);rhenHold(t,1-k*.6);objAt(V3(S.x,S.y+1.15-.6*k,S.z));OBJ.U.wake.value=.6+1.4*sstep(1,2,t);
        if(t>1.4&&!endScene.lit){endScene.lit=1;flashScreen(.25);if(typeof sfx!=='undefined')sfx.wake();shakeT=.5;}TOWER.floorU.wake.value=sstep(1.4,4,t);TOWER.lip.material.color.copy(C(0xfff0c8)).multiplyScalar(1.4+1.6*sstep(1.4,2,t));
        TOWER.ringL.forEach(l=>l.intensity=.45+.9*sstep(1.4,4,t));}},
    // up the shaft: a pillar of light climbs it to the sky (seen from the edge of the room, the crew at its foot)
    {dur:6,cam:[[10,TOPY+1.4,-7]],look:[[0,TOPY+12,0],[0,TOPY+180,0]],
      fn:(t,dt)=>{live(t,dt);lookUp=Math.min(1,lookUp+dt);DOME.beam.material.opacity=.42*sstep(.5,3,t);DOME.beam.scale.y=Math.max(.01,sstep(.5,4,t));DOME.beam.position.y=TOPY+(TW.h-TOPY+40)/2*DOME.beam.scale.y;
        if(t<.1&&typeof sfx!=='undefined')sfx.swell(6);}},
    // outside: from high over the desert. The beam out of the crown; the dome rises from the wall all the way round, and closes
    {dur:9,cam:[[wide.x,wide.y,wide.z],[wide.x*.9,wide.y*.95,wide.z*.92]],look:[[0,150,0]],
      fn:(t,dt)=>{if(t<.1){DOME.beam.scale.y=1;DOME.beam.position.y=TOPY+(TW.h-TOPY+40)/2;WARSHIP.on=true;}domeSet(sstep(1.5,8,t),1,0);if(t>1.6)setLook('dome');
        if(t>1.2&&!endScene.dome){endScene.dome=1;if(typeof sfx!=='undefined'&&sfx.moment)sfx.moment('dome');}   // the dome: everything else drops away under it
        if(rng()<.1)fire(WARSHIP.g.position.clone(),V3(R(-200,200),0,R(-200,200)),900,'wbeam',q=>boom(q,20,0xff8a3a,1));}},
    // the street: a red pair and an amber pair facing each other over their rifles. They stop, lower them, and look up
    {dur:7,camAt:(u,t,o)=>{const p=at(SQ+9,2.5);o.set(p.x,1.5+u*.4,p.z);},lookAt:(u,t,o)=>{const p=at(SQ-3,0);o.set(p.x,1.6+sstep(.45,1,u)*40,p.z-sstep(.45,1,u)*20);},
      fn:(t,dt)=>{domeSet(1,1,0);WARSHIP.on=false;streetLive(dt,sstep(1,3.5,t));}},
    // the chamber: the crew under it
    {dur:7,cam:[[-10,TOPY+1.5,-5],[-10.4,TOPY+1.6,-5.6]],look:[[-3,TOPY+2.6,1.2]],
      say:[[.6,'Ensign Landry','What is that?'],[0,'Thorne','I don’t know. But whatever’s been in the air since we landed... it’s gone.'],[0,'Captain Rhen','They built this to keep something out.']],
      fn:(t,dt)=>{domeSet(1,1,0);STREET.forEach(({H})=>H.root.visible=false);lookUp=Math.max(.3,lookUp-dt*.3);live(t,dt);}},
    // the warning. Landry kneels at the transmitter; Rhen crosses to her and kneels beside it (Bryce's words)
    {dur:8,cam:[[-1.6,TOPY+1.7,8.6],[-2.0,TOPY+1.5,8.0]],look:[[-5.2,TOPY+.8,4.2]],
      say:[[.4,'Captain Rhen','Landry. Tide City. Everything you’ve got.'],[0,'Ensign Landry','One burst. Maybe. Go.']],
      fn:(t,dt)=>{domeSet(1,1,0);lookUp=0;const k=sstep(.8,5,t);P.pos.lerpVectors(RHEN0,RHEN_TX,k);P.pos.y=TOPY;LANDRY.kneel=sstep(0,1.5,t);P.kneel=sstep(5,6.5,t);
        live(t,dt,{lookAt:TX.position,walk:k>0&&k<1,rhenFace:k<1?face(P.pos,RHEN_TX.clone().add(V3(-.1,0,.1))):face(P.pos,TX.position)});txLight.material.opacity=.4+.6*(Math.sin(T*10)>0?1:0);}},
    {dur:12,camAt:(u,t,o)=>faceCam(o,-.6-u*.1,1.5-u*.15,TX.position),lookAt:(u,t,o)=>eyeOf(P,o).add(V3(0,-.08,0)),
      say:[[.3,'Captain Rhen','Tide City Command. This is Captain Rhen of the Pathfinder.'],[0,'Captain Rhen','If this reaches you, listen carefully.'],[0,'Captain Rhen','We were wrong about the Heralds.'],
        [0,'Captain Rhen','They’re not invading us. They’re running.']],
      fn:(t,dt)=>{domeSet(1,1,0);P.pos.copy(RHEN_TX);P.kneel=1;LANDRY.kneel=1;live(t,dt,{lookAt:TX.position});txLight.material.opacity=Math.sin(T*10)>0?1:.3;}},
    {dur:12,cam:[[-3.1,TOPY+1.25,7.1],[-3.4,TOPY+1.2,6.7]],look:[[-5.5,TOPY+.75,4.4]],
      say:[[.2,'Captain Rhen','We found something here. Something older than them.'],[0,'Captain Rhen','Whatever destroyed their civilization, it doesn’t have to happen again.'],
        [0,'Captain Rhen','There was another people here before them. They found a way to hold it back.'],[0,'Captain Rhen','We have evidence. We have to get it home.']],
      fn:(t,dt)=>{domeSet(1,1,0);P.kneel=1;LANDRY.kneel=1;live(t,dt,{lookAt:TX.position});txLight.material.opacity=Math.sin(T*10)>0?1:.3;}},
    // the sky over the dome: fire. Ships coming down through the air, big ones
    {dur:6,cam:[[-8,TOPY+1.3,-3]],look:[[0,TOPY+200,-20]],
      say:[[.5,'Ensign Landry','Captain. Something’s entering the atmosphere.','alert'],[0,'Captain Rhen','Command, do not activate the Spear until we—','alert']],
      fn:(t,dt)=>{domeSet(1,1,0);live(t,dt,{lookAt:V3(0,TOPY,-20)});lookUp=Math.min(1,lookUp+dt);FLEET.forEach((F,i)=>{F.g.visible=true;const u=sstep(0,14,t+i);F.g.position.lerpVectors(F.p0,F.p1,u);F.g.lookAt(F.p1.x,F.p1.y-200,F.p1.z+50);F.sheath.material.opacity=.8*(1-u);});
        if(t>4.6&&!endScene.cut){endScene.cut=1;if(typeof sfx!=='undefined')sfx.static(1.4);txLight.material.opacity=0;}}},
    // outside: the Host fleet over the dome; the dome flickers, thins
    {dur:8,cam:[[wide.x,wide.y,wide.z]],look:[[0,200,0]],score:'tense',
      fn:(t,dt)=>{if(t<.1)setLook('host');if(t>.4&&!endScene.fleet){endScene.fleet=1;if(typeof sfx!=='undefined'&&sfx.flyby)sfx.flyby(6,.3);}   // the Host fleet coming in over the city
        DROPS3.forEach(D=>{if(D.g.visible&&typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.dropship',DROPS3.indexOf(D),D.g.position,1,.9);});
        domeSet(1,1-.55*sstep(1,7,t),.25+.4*sstep(2,7,t));FLEET.forEach((F,i)=>{F.g.visible=true;const u=sstep(0,14,6+t+i);F.g.position.lerpVectors(F.p0,F.p1,u);F.sheath.material.opacity=.8*(1-u);});
        DROPS3.forEach((D,i)=>{const u=clamp((t-1-i*.6)/6,0,1);D.g.visible=u>0;D.g.position.lerpVectors(D.p0,D.p1,u);D.g.lookAt(D.p1.x,D.g.position.y,D.p1.z+40);});}},
    // outside the wall, on the desert: Host troopers walk in through the dome's curtain as if it weren't there
    // (Oct 26: the camera follows them in, a few metres behind at their walking pace, so they hold their size against the wall;
    // from 30 m back they were specks)
    {dur:7,cam:[[4,1.8,WR+86],[3,1.9,WR+67]],look:[[-5,2.6,WR+62],[-6,3.2,WR+42]],
      fn:(t,dt)=>{lookUp=0;domeSet(1,.42,.6);FLEET.forEach(F=>F.g.visible=false);DROPS3.forEach(D=>D.g.visible=false);marchLive(t,dt);}},
    // the chamber: they come in from the spiral; the crew stand, rifles up, then down
    {dur:7,cam:[[-3.5,TOPY+1.75,8],[-3.8,TOPY+1.8,7.4]],look:[[-13,TOPY+1.3,-.5]],
      say:[[1.6,'Sergeant Marsh','Captain. There’s too many.','alert'],[0,'Captain Rhen','...Weapons down.'],[0,'Sergeant Marsh','Captain—'],[0,'Captain Rhen','Down. They want us alive.']],
      fn:(t,dt)=>{MARCH.forEach(H=>H.root.visible=false);domeSet(1,.42,.6);P.kneel=Math.max(0,P.kneel-dt*1.5);LANDRY.kneel=Math.max(0,LANDRY.kneel-dt*1.5);hostIn(t,dt,7);live(t,dt,{lookAt:V3(-14,TOPY,0),aim:t<5?1:0});if(t>5)surrender=Math.min(1,surrender+dt*.8);}},
    // the officer walks to the socket. A word nobody knows. He pulls the object out
    {dur:8,camAt:(u,t,o)=>o.set(1.1,TOPY+1.55,-4.4),lookAt:(u,t,o)=>o.copy(OFF.root.position).add(rv.set(0,1.6,0)),
      // (to his troopers in the Host's own tongue, as their intercom speaks it in Site K; then to Rhen, in his)
      say:[[1,'Host officer','Seraveth. Oruun vael.','enemy','[Unknown language]'],[0,'Host officer','You carried it a long way, Captain. It was never yours.','enemy']],
      fn:(t,dt)=>{domeSet(1,.42,.6);hostIn(9,dt,7,P.pos);live(t,dt,{lookAt:OFF.root.position});surrender=1;
        OFF.root.visible=true;const u=clamp(t/4,0,1);OFF.root.position.lerpVectors(V3(-12,TOPY,-1.5),V3(-1.35,TOPY,-1.2),u);OFF.root.rotation.y=face(OFF.root.position,S);poseHuman(OFF,dt,u<1?2.4:0,0,false);
        if(t>5){const k=sstep(5,6.6,t);OFF.arms[1].sh.rotation.x=1.1+.4*(1-k);OFF.arms[1].el.rotation.x=-.3;objAt(V3(S.x,S.y+.55+.75*k,S.z).lerp(OFF.root.position.clone().add(V3(.45,1.25,.35)),k*.5));OBJ.U.wake.value=2-1.6*k;if(t>5.4&&!endScene.pulled){endScene.pulled=1;flashScreen(.25);if(typeof sfx!=='undefined')sfx.shipDown();}
          TOWER.floorU.wake.value=1-k;TOWER.ringL.forEach(l=>l.intensity=.45*(1-k));DOME.beam.material.opacity=.42*(1-k);}}},
    // the dome falls: from outside, it comes apart, cell by cell, into the dark
    {dur:6,cam:[[wide.x*.8,wide.y*.7,wide.z*.8]],look:[[0,150,0]],
      fn:(t,dt)=>{domeSet(1-.25*sstep(2,6,t),Math.max(0,.42-.42*sstep(0,4,t)),.8);if(t>4.5)DOME.m.visible=false;skyU.domeK.value=0;CITY.wake.value=0;DOME.beam.material.opacity=0;
        FLEET.forEach((F,i)=>{F.g.visible=true;F.g.position.copy(F.p1);});}},
    // on their knees. Rhen looks at the transmitter on the floor: its small light, blinking. He doesn't know if it got through
    {dur:8,camAt:(u,t,o)=>faceCam(o,1.3-u*.15,2.1-u*.2,TX.position).add(V3(0,.45,0)),lookAt:(u,t,o)=>eyeOf(P,o).add(V3(0,-.2,0)),
      fn:(t,dt)=>{FLEET.forEach(F=>F.g.visible=false);kneel=Math.min(1,kneel+dt*.8);hostIn(9,dt,7,P.pos);live(t,dt,{rhenFace:face(P.pos,TX.position)});OFF.root.visible=true;poseHuman(OFF,dt,0,0,false);
        objAt(OFF.root.position.clone().add(V3(.4,1.2,.3)));TOWER.lip.material.color.copy(C(0xffd890)).multiplyScalar(.4);txLight.material.opacity=0;}},
    {dur:6,camAt:(u,t,o)=>o.copy(TX.position).add(V3(.2,.5-u*.05,.95-u*.1)),lookAt:(u,t,o)=>o.copy(TX.position).add(V3(0,.22,0)),
      fn:(t,dt)=>{live(t,dt,{rhenFace:face(P.pos,TX.position)});hostIn(9,dt,7,P.pos);const on=(Math.floor(t*1.6)%2)===1;txLight.material.opacity=on?1:.08;txLamp.visible=on;}},
    {dur:4.5,black:true,small:'Pathfinder · Level 03 · 10.03.2237',cap:'The White City',camAt:(u,t,o)=>o.copy(TX.position).add(V3(.2,.45,.85)),lookAt:(u,t,o)=>o.copy(TX.position).add(V3(0,.22,0))},
  ],()=>{setPhase('end');finishMission();},{hush:true,score:'sorrow'});
}
function finishMission(){
  if(!wentDown)PG.done('pdown');PG.ach('whitecity');
  PG.finish({title:'THE WHITE CITY · LEVEL 03',text:`The White City. Rhen’s team flew through the Herald war, walked up the streets of a city older than the Heralds, and put the object where it fit. For a few minutes a dome of light stood over the whole city, and the war stopped. Then the Empty Host came down through it, and took them alive. One burst went out to Tide City. Nobody knows how much of it arrived. Troopers and fighters down: ${P.kills}. Threat level: ${DIFF.name}.`,
    buttons:[{text:'Recovered footage 07 →',href:'index.html?watch=7',primary:true,auto:12},{text:'Menu',href:'index.html'},{text:'Play again',onClick:()=>location.reload()}]});}

/* ---------- the way in, as a cutscene (Bryce, Oct 22: the flight can't be beaten yet, so for now the dropship flies itself in;
   flip AIR_PLAYABLE back on once the flight is fixed). Picks up where introScene leaves her (0,150,1350) and hands her to
   landScene just inside the opening ---------- */
const AIR_PLAYABLE=false;
function flyInScene(){setPhase('intro');P.H.root.visible=false;SQUAD.forEach(A=>{A.on=false;A.H.root.visible=false;});TWO.visible=true;
  const CF=cutFighters(10);let beamT=0,warCh=0;const rv=V3();
  const warBeams=dt=>{beamT-=dt;if(beamT<.55&&!warCh&&typeof sfx!=='undefined'&&sfx.charge){warCh=1;sfx.charge(WARSHIP.g.position);}if(beamT<=0){beamT=R(1.2,2.4);warCh=0;fire(WARSHIP.g.position.clone(),V3(R(-300,300),0,R(-320,250)),900,'wbeam',q=>{boom(q,R(18,28),0xff8a3a,1.2);puff(q,R(12,18),6);});}};
  const B0=V3(0,150,1350),B1=V3(-10,96,880),B2=V3(0,GATE.y+2,640),B3=V3(0,GATE.y,WR+WT+30),B4=PLAZA_IN.clone();
  const sway=t=>{TWO.position.y+=Math.sin(t*1.7)*.7;TWO.rotation.set(-.04,0,Math.sin(t*1.1)*.04);};   // Oct 24: half the old sway
  const near=(t,dt)=>{CF.update(dt);warBeams(dt);if(rng()<dt*1.4){const q=TWO.position.clone().add(V3(R(-60,60),R(-20,30),R(-80,-20)));boom(q,R(5,9),0xffa060,.6);}};
  WALL.open=0;WALL.skinU.open.value=0;
  playCut([
    // into the war: fighters crossing her nose, flak bursting round her, the red warship's beams falling on the city ahead
    {dur:7,camAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(10-u*4,7,34-u*6)),lookAt:(u,t,o)=>o.copy(TWO.position).add(rv.set(0,2,-160)),
      say:[[.3,'Ensign Landry','Both sides are painting us! Shields are holding, barely!','alert'],[0,'Captain Rhen','Nobody fires. We are not picking a side today.']],
      fn:(t,dt)=>{TWO.position.lerpVectors(B0,B1,sstep(0,7,t));{const p=TWO.position;p.y=Math.max(p.y,flyMin(p.x,p.z,16));}sway(t);near(t,dt);if(t>3.5)shakeT=Math.max(shakeT,.12);}},
    // the wall, close: the opening still sealed with light. The case wakes it, and the light irises open from the middle
    {dur:7,cam:[[-90,40,700],[-70,52,660]],look:[[0,GATE.y,WR],[0,GATE.y,WR+10]],
      say:[[.4,'Thorne','The case is reacting. It knows this place.'],[0,'Sergeant Marsh','The light, it’s opening!','alert'],[0,'Captain Rhen','Landry. Take us in.'],[0,'Ensign Landry','No, sir. You take us in. I’m holding her together.','alert']],
      fn:(t,dt)=>{TWO.position.lerpVectors(B1,B2,sstep(0,6,t));sway(t);near(t,dt);WALL.open=sstep(2,6,t);WALL.skinU.open.value=WALL.open;}},
    // through it: from inside the plaza, looking back at the opening as she comes through, low and fast
    {dur:5,camAt:(u,t,o)=>o.set(24-u*6,10+u*2,LZ.z-16),lookAt:(u,t,o)=>o.copy(TWO.position),
      say:[[.5,'Okafor','We’re through! We’re inside the wall!']],
      fn:(t,dt)=>{WALL.open=1;WALL.skinU.open.value=1;const u=sstep(0,4.6,t);if(u<.5)TWO.position.lerpVectors(B2,B3,u*2);else TWO.position.lerpVectors(B3,B4,(u-.5)*2);TWO.rotation.set(-.05+u*.08,0,Math.sin(t*2)*.05);CF.update(dt);}},
  ],()=>{CF.clear();WALL.open=1;WALL.skinU.open.value=1;TWO.position.copy(B4);TWO.rotation.set(0,0,0);crashScene();},{hush:true});   // (skipped or not, she's just inside the wall)
}

/* ---------- the air (js/pathfinder3/02-air.js) ---------- */
function startAir(){setPhase('air');saveCP('air');P.H.root.visible=false;SQUAD.forEach(A=>{A.on=false;A.H.root.visible=false;});TWO.visible=true;
  AIR.start(TWO,{done:()=>{crashScene();},crash:()=>{
    // a crash: back to the start of the flight
    const el=document.createElement('div');el.className='pgend pgbrief';el.innerHTML=`<div class="card"><h2>DROPSHIP TWO IS DOWN</h2><p>She came apart over the city. Try the way in again.</p><div class="row"><button type="button" class="primary" id="airAgain">Fly again</button></div></div>`;
    document.body.appendChild(el);PG.paused=true;try{if(document.exitPointerLock)document.exitPointerLock();}catch(_){}
    el.querySelector('#airAgain').addEventListener('click',()=>{el.remove();PG.paused=false;wentDown=true;WALL.open=0;WALL.skinU.open.value=0;startAir();});}});}

/* ---------- jumps (checkpoints, and testing: pathfinder-3.html?at=air|streets|tower|interface|chamber|socket) ---------- */
function jumpTo(atq){P.input=true;TWO.visible=true;TWO.position.set(LANDP.x,3.2,LANDP.z);TWO.rotation.set(0,0,0);WALL.open=1;WALL.skinU.open.value=1;
  if(atq==='air'){if(AIR_PLAYABLE)startAir();else flyInScene();return;}
  SQUAD.forEach(A=>{A.on=true;});P.H.root.visible=true;
  if(atq==='north'||atq==='flank'){TWO.rotation.set(0,0,.05);P.pos.set(LANDP.x,0,LANDP.z+30);P.yaw=Math.PI;SQUAD.forEach((A,i)=>A.pos.set(-4+i*2.6,0,LANDP.z+26));
    if(atq==='flank'){FLANK.on=true;['n1','n2','n3'].forEach(k=>enc.add(k));setPhase('flank');}else setPhase('north');banner('Checkpoint · '+CP_NAME[atq]);return;}
  const S={streets:18,tower:S_RING0-6,gallery:HOLDS.gallery.s-12,interface:S_INT-10,crown:HOLDS.crown.s-12,chamber:S_UW1+4,socket:S_UW1+20}[atq]||4;
  // what's behind you has already happened
  if(S>40){for(const k of['st0','st1','host1','st2','host2','st3','host3'])enc.add(k);for(const c of CHARGES){c.done=true;chargeOff(c);}   /* (Oct 25: chargeOff keeps their lights, so the light count, and with it every shader warmed on the loading screen, stays the same after a checkpoint) */doorOpen=1;doorOpening=true;TOWER.doorU.open.value=1;if(BLOCKS.includes(DOOR_BLOCK))BLOCKS.splice(BLOCKS.indexOf(DOOR_BLOCK),1);}
  if(S>HOLDS.gallery.s)HOLDS.gallery.done=true;
  if(S>S_INT){INT.done=true;INT.m.visible=false;if(BLOCKS.includes(INT.B))BLOCKS.splice(BLOCKS.indexOf(INT.B),1);enc.add('r1');enc.add('r2');}
  if(S>HOLDS.crown.s)HOLDS.crown.done=true;
  if(S>S_RING1){HOLE_OPEN=true;TOWER.holePatch.visible=false;}
  const p=at(S,0);P.pos.copy(p);SQUAD.forEach((A,i)=>A.pos.copy(at(Math.max(0,S-3-i*2),(i-1.5)*1.2)));const q=at(S+(atq==='tower'?16:4),0);P.yaw=Math.atan2(-(q.x-p.x),-(q.z-p.z));   // (the tower: the spiral turns right where you stand, so look up the ramp, not at the wall)
  setPhase(atq==='streets'?'streets':atq==='tower'?'streets':['gallery','interface','crown'].includes(atq)?'ramp':'chamber');
  if(atq==='socket'){enc.add('ch1');enc.add('ch2');chamberClear=true;T_SOCKET.on=true;phT=20;}
  banner('Checkpoint · '+(CP_NAME[atq]||atq));}

/* ---------- main loop ---------- */
let last=performance.now(),shakeT=0;
let frameErr=0;function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(!PG.paused){
    director(dt);
    if(CUTS.on)CUTS.update(dt);else if(phase==='air')AIR.update(dt);else if(!['end','brief','intro','landcut','endcut'].includes(phase)){stepPlayer(dt);placeCamera();}
    updateEnemies(dt);if(!CUTS.on&&phase!=='air')updateAllies(dt);updateDrops(dt);updateNades(dt);updateRockets(dt);updateTurrets(dt);updateWall(dt);updateSentry(dt);updateZeal(dt);updatePicks(dt);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);
    PG.combat(phaseFight());INT.U.uT.value=T;BARWALL.U.uT.value=T;
    if(CASE.g.visible){if(CASE.pulse>0){CASE.pulse=Math.max(0,CASE.pulse-dt*.25);CASE.h.scale.setScalar(1.4+CASE.pulse*6);CASE.h.material.opacity=.6+CASE.pulse*.4;}else{CASE.h.material.opacity=.4+.3*Math.sin(T*3);CASE.h.scale.setScalar(1.4);}}
  }else if(phase==='brief'){camera.position.set(0,150,1500);camera.lookAt(0,70,0);}
  if(shakeT>0){shakeT-=dt;camera.position.x+=R(-1,1)*shakeT*.15;camera.position.y+=R(-1,1)*shakeT*.12;}
  updateLights(dt,T,CUTS.on||phase==='air'?camera.position:P.pos);
  if(window.VIEWTEST){camera.position.set(...VIEWTEST[0]);camera.lookAt(...VIEWTEST[1]);}   // (testing: a fixed camera)
  skyFollow();followSun(CUTS.on||phase==='air'?camera.position:P.pos);updateDust();updateHud(dt);updateWp();
  // the approach (Oct 24): the night fog thins with distance so the city glows on the horizon instead of drowning in black
  if((phase==='intro'||phase==='brief')&&lookName==='night'){const d=Math.hypot(camera.position.x,camera.position.z);scene.fog.density=LOOKS.night.dens*clamp(650/Math.max(d,1),.28,1);}
  renderFrame();
}
PG.briefing({title:'THE WHITE CITY',text:'10.03.2237, before dawn. One flight left in Dropship Two, and the case pointing at a white city in the middle of the desert. The Herald war is all over it. Threat level: '+DIFF.name+'.',
  objective:'Get Dropship Two into the city. Then on foot to the tower at its heart. Neither Herald side is ours.',
  pc:[['Mouse','Aim · in the dropship: steer (click to lock, Esc releases)'],['Left click','Fire'],['W A S D','Move'],['Shift','Sprint'],['Right click','Aim down the sights (the Lance has a scope)'],
    ['1 2 3 4 or wheel','Rifle, Lance, Breaker launcher, sidearm (Armory skin)'],['R','Reload'],['Q','Mobile shield'],['X','Shoulder sentry'],['G or F','Grenade'],['Space','Jump'],['C or Ctrl','Crouch (toggle)'],['Z','Zeal when the meter is full'],['Walk up and hold, or E','Use (charges, murals, the socket)'],['Enter','Skip a cutscene']],
  phone:[['Drag (right side)','Aim · in the dropship: steer'],['Left thumb','Move · in the dropship: turn'],['FIRE','Fire (hold) · swipe up off it to throw a grenade'],['Double-tap right','Aim down the sights (again to stop)'],['Ammo box','Reload (shows the magazine)'],['⇄','Next weapon'],['GEAR','Tap: mobile shield · hold: shoulder sentry'],['JUMP · CROUCH','Jump, crouch (toggle)'],['Gold shield','Tap it for Zeal'],['Walk up · USE','Charges, murals, the socket'],['Skip','Skip a cutscene']],
  onStart:()=>{setPhase('intro');P.input=false;
    const atq=(location.search.match(/[?&]at=(\w+)/)||[])[1];if(atq){jumpTo(atq);return;}
    const begin=()=>introScene(()=>AIR_PLAYABLE?startAir():flyInScene());
    const cp=readCP();if(!cp){begin();return;}
    PG.paused=true;const el=document.createElement('div');el.className='pgend pgbrief';
    el.innerHTML=`<div class="card"><h2>CHECKPOINT</h2><p>You stopped at <b>${CP_NAME[cp.at]}</b>. Pick up there, or start The White City from the beginning.</p><div class="row"><button type="button" class="primary" id="cpGo">Resume</button><button type="button" id="cpNew">Start over</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('#cpGo').addEventListener('click',()=>{el.remove();PG.paused=false;jumpTo(cp.at);});
    el.querySelector('#cpNew').addEventListener('click',()=>{el.remove();PG.paused=false;clearCP();begin();});}});
requestAnimationFrame(frame);

// indoors for the sound (js/origin/05-audio.js): inside the tower (the hall, the spiral, the chamber at the top)
window.INDOOR_AT=()=>{const c=camera.position;return Math.hypot(c.x,c.z)<TW.r-2&&c.y<TW.h&&phase!=='air'?1:0;};
