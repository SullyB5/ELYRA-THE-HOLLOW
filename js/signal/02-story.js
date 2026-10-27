/* Elyra · Last Transmission · Level 05 · The Last Signal — the story, phase by phase. 13.03.2237, the night after the Mountain.
   Bryce's level brief (docs/lore-2026-10-26/07_ELYRA_The_Last_Signal_Level_Brief_v3.1.docx), about fifteen minutes:
     0:00  THE SIGNAL     the interceptor up the valley after the Pathfinder-linked signal, two Host fighter engagements, the pad
                          (js/signal/03-air.js; the opening and the landing are in js/signal/04-scenes.js)
     2:30  THE FACILITY   on foot: the ledge, the outer security yard (riflemen on the terraces, wall guns), the security lock on the
                          gate, the security halls; through the overlook's glass, prisoners going aboard a Host transport; a
                          captured Pathfinder on a stolen radio knows Michael's transponder
     5:30  THE RESCUE     the detention wing: open the cells. Captain Rhen and two of his crew. Rhen: the device is not on the
                          transport, it is in a vault at the bottom of the place. Get the crew out of the cell block
     9:00  THE SUPPRESSOR the containment wing: the whispers and the warping get worse the deeper you go. The vault, the field, its
                          power room (cut the generator, hold its back door). Rhen lifts it: the whispers stop, the warping settles.
                          It does nothing about the Host: the alarms, and they keep coming
    12:00  THE PAD        up the switchbacks to the extraction pad on the peak; a Host gunship climbs up the mountain's side; hold the pad with
                          Rhen and the crew until the Keeper dropship Mercy is in; board
    14:00  THE LAST TRANSMISSION  in the dropship (js/signal/04-scenes.js): Bryce's scene, word for word
   Lore guardrails (v3.1): Rhen knows only what his crew saw; the voice under the mountain stays unexplained; the suppressor reduces
   the Hollow's influence and nothing else (gunfire still kills); the March 10 broadcast stays corrupted (what Rhen hands over is the
   crew's own local recording). Which of Marsh, Okafor, Thorne and Landry survived is still open (docs v3.1): the two crew in the
   cells are unnamed Pathfinder crew for now (CREW_NAMES below). Every line except the ending is Claude's draft; Bryce rewrites
   (docs/LAST-SIGNAL-SCRIPT.md). Forked from Site K's story (js/pathfinder/02-story.js). */
const easeIO=CUTS.ease;
function playCut(shots,done,opts){P.input=false;fireHeld=false;P.adsHeld=false;CUTS.play(shots,Object.assign({done:sk=>{P.input=true;if(done)done(sk);}},opts||{}));}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function glowSprite(hex,size,k,op){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(hex).multiplyScalar(k||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op==null?1:op}));s.scale.setScalar(size);return s;}
$('use').textContent='USE';

/* ---------- objective marker, and markers on the last few enemies ---------- */
const wp=document.createElement('div');wp.className='hud keep';wp.style.cssText='width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid #ffd27a;transform:rotate(45deg);background:rgba(255,210,122,.15);display:none';
const wpLab=document.createElement('div');wpLab.className='hud';wpLab.style.cssText='font:600 10px var(--mono);color:#ffd27a;letter-spacing:.08em;transform:translate(-50%,12px);display:none';
document.body.append(wp,wpLab);let WP=null;
function updateWp(){if(!WP||CUTS.on||!P.alive||FLY.on){wp.style.display=wpLab.style.display='none';return;}_v.copy(WP).project(camera);const on=_v.z<1;
  const x=clamp((_v.x*.5+.5)*innerWidth,30,innerWidth-30),y=clamp((-_v.y*.5+.5)*innerHeight,60,innerHeight-60);
  wp.style.display=wpLab.style.display=on?'':'none';wp.style.left=wpLab.style.left=x+'px';wp.style.top=wpLab.style.top=y+'px';wpLab.textContent=Math.round(P.pos.distanceTo(WP))+' m';}
const FOE_MK=[];let markList=[];
function markFoes(list){
  while(FOE_MK.length<list.length){const d=document.createElement('div');d.className='hud keep';d.style.cssText='width:12px;height:12px;margin:-6px 0 0 -6px;border:2px solid #c98aff;transform:rotate(45deg);box-shadow:0 0 8px rgba(201,138,255,.8);display:none;pointer-events:none';document.body.appendChild(d);FOE_MK.push(d);}
  FOE_MK.forEach((d,i)=>{const p=list[i];if(!p||CUTS.on||!P.alive){d.style.display='none';return;}_v.copy(p).project(camera);
    const x=clamp((_v.x*.5+.5)*innerWidth,24,innerWidth-24),y=clamp((-_v.y*.5+.5)*innerHeight,60,innerHeight-60),behind=_v.z>1;
    d.style.display='';d.style.left=(behind?innerWidth-x:x)+'px';d.style.top=(behind?innerHeight-60:y)+'px';d.style.opacity=behind?.55:1;});}

/* ---------- the crew in the cells: Captain Rhen and two of his. They join you as they come out ---------- */
ALLY_TINT.marine=0xb4bcc4;   // the Pathfinder's scout grey
// Bryce: the two crew are unnamed until you decide who survived the White City (docs v3.1: Marsh, Okafor, Thorne, Landry unresolved).
// Put a name here (e.g. 'Sergeant Marsh') and the radio uses it.
const CREW_NAMES={rhen:'Captain Rhen',a:'Pathfinder crew',b:'Pathfinder crew'};
const SQUAD=[];   // who is with you (empty until the cells open)
const CREW={};for(const c of CELLS)if(c.live){const F=cellFrame(c),x=F.fx+F.ox*c.d*.55,z=F.fz+F.oz*c.d*.55;
  const A=addAlly('marine',x,z,CREW_NAMES[c.who],'keeper-pathfinder');A.on=false;A.cell=c;A.who=c.who;CREW[c.who]=A;c.ally=A;}
const RHEN=CREW.rhen;
// the device's case rides on Rhen's back once he has it: a cracked Host case with the light coming through the seams (Site K's)
const CASE=(()=>{const g=new THREE.Group(),m=new THREE.Mesh(new THREE.BoxGeometry(.5,.8,.3),new THREE.MeshStandardMaterial({color:C(0x221d2a),roughness:.4,metalness:.7,map:panelTex}));g.add(m);
  const s=new THREE.Mesh(new THREE.BoxGeometry(.52,.05,.32),new THREE.MeshBasicMaterial({color:C(0xc8d4ff).multiplyScalar(2),toneMapped:false}));s.position.y=.1;g.add(s);
  const h=glowSprite(0xa8b8ff,1.4,1.2,.6);g.add(h);g.position.set(0,1.35,.32);g.visible=false;RHEN.H.root.add(g);return{g,h};})();
// what 03-play says when things go wrong, in this mission's voices
function playerDown(){P.alive=false;P.hp=0;P.respawnT=5;killHuman(P.H);fireHeld=false;P.adsHeld=false;
  if(SQUAD.length&&!RHEN.H.dead)PG.say('Captain Rhen','Hall’s down! Get him up!','alert',4);else PG.say('ELYRA','Lieutenant! Your vitals are failing. Get up. Get up.','alert',4);
  banner(SQUAD.length?'You are down · the crew is pulling you back':'You are down · get back up','alert');}
function hurtAlly(A,dmg){A.hits++;hitHuman(A.H);if(A.H.dead||!A.on)return;A.lastHit=T;A.hp-=dmg*(OD.allyDmg||1);
  if(A.hp<=0){A.hp=0;killHuman(A.H);A.downT=ALLY_DOWN;A.target=null;
    if(A===RHEN&&CASE.g.visible){PG.say('ELYRA','Captain Rhen is down. He has the device, Lieutenant. Get to him.','alert');PG.fail('lsrhen');}
    else if(T-(hurtAlly.said||-99)>14){hurtAlly.said=T;PG.say(A===RHEN?'Pathfinder crew':'Captain Rhen',(A===RHEN?'Captain':'One of mine')+' is down! Hall, get to them!','alert');}}}

/* ---------- phases ---------- */
let phase='brief',phT=0,wentDown=false;
const said=new Set();
// a line once. (03-play's turret warning comes from "Keeper Sergeant": here that's ELYRA, or Rhen once he's with you)
function say(key,who,txt,tone,dur){if(said.has(key))return;said.add(key);if(who==='Keeper Sergeant'){who=SQUAD.length?'Captain Rhen':'ELYRA';txt=txt.replace('Hollow turret ahead!','Host gun ahead.');}PG.say(who,txt,tone,dur);}
function talk(lines){lines.reduce((t,[d,w,x,tone])=>{t+=d;setTimeout(()=>{if(phase!=='endcut'&&!CUTS.on)PG.say(w,x,tone);},t*1000);return t;},0);}
const CP_KEY='elyra.checkpoint.signal';
function saveCP(at){try{localStorage.setItem(CP_KEY,JSON.stringify({at,t:Date.now()}));}catch(_){}}
function clearCP(){try{localStorage.removeItem(CP_KEY);}catch(_){}}
function readCP(){try{const c=JSON.parse(localStorage.getItem(CP_KEY)||'null');return c&&CP_NAME[c.at]?c:null;}catch(_){return null;}}
const CP_NAME={pad:'The transfer pad',halls:'Inside the gate',cells:'The detention wing',contain:'The containment wing',vault:'The power room',extract:'The way out',hold:'The extraction pad'};
function setPhase(p){if(['halls','detention','contain','vault','extract','hold'].includes(p)&&phase!==p)saveCP(p==='detention'?'cells':p);if(p==='end')clearCP();phase=p;phT=0;
  if(['board','end','doorcut','gunshipcut','endcut','takecut','rescuecut'].includes(p))reviveAllies();}
function phaseFight(){return['ledge','yard','halls','detention','escort','contain','vault','extract','hold','board'].includes(phase);}
PG.init('signal',{challenges:[
  {id:'lsair',text:'Down all 5 Host fighters in the valley',pts:1500,goal:5},
  {id:'lskills',text:'Down 30 Empty Host troopers',pts:2000,goal:30},
  {id:'lsturret',text:'Silence 3 Host guns',pts:1500,goal:3},
  {id:'lscells',text:'Open all three cells inside a minute',pts:1500},
  {id:'lsrhen',text:'Never let Rhen go down with the suppressor',pts:2500},
  {id:'pdown',text:'Never go down',pts:2000},
]});
// hurtTurret and hurtEnemy count toward the Mountain's challenges by name: count them here too
{const _p=PG.prog,_d=PG.done;PG.prog=(id,n)=>_p(id==='okills'?'lskills':id==='oturret'?'lsturret':id,n);PG.done=id=>_d(id==='onade'?'-':id);}

/* ---------- places along the way ---------- */
function at(s,lat,out){const p=roadPt(clamp(s,0,ROAD_LEN),out||new THREE.Vector3()),n=roadN(clamp(s,0,ROAD_LEN));p.x+=n.x*lat;p.z+=n.z*lat;p.y=groundY(p.x,p.z);return p;}
function wallGun(s,side){const h=laneHalf(s),p=at(s,side*(h+.9)),c=at(s-20,0);const face=Math.atan2(-(c.x-p.x),-(c.z-p.z));return addTurret(p.x,p.z,WALLH.yard,face,'Wall gun');}
function perch(s,side,y,extra){const h=laneHalf(s),p=at(s,side*(h+(extra||1.6)));const E=spawnTrooper(p.x,p.z,{perch:true});if(E){E.pos.y=y;}return E;}
function anchorBehind(s,lat){const p=at(s+1.8,lat);return spawnTrooper(p.x,p.z,{anchor:p});}
function holder(s,lat){const p=at(s,lat);return spawnTrooper(p.x,p.z,{hold:R(14,24)});}
const n0=()=>OD.n||0;
// cover and supplies (Site K's, through the facility; open every door while placing, or anything behind one lands on the roof)
const _closeAll=OPEN_ALL();
{for(const [s,lat,w] of[[22,-8,7],[22,9,6],[48,0,8],[66,-12,6],[70,11,7],[92,-4,9],[104,8,5]]){const p=at(s,lat),n=roadN(s);addBarricade(p.x,p.z,Math.atan2(n.z,-n.x)+Math.PI,w);}
 for(const [s,lat,z] of[[34,-15,1.6],[38,16,1.4],[58,15,1.8],[82,-16,1.5],[86,14,1.3],[110,-5,1.2]]){const p=at(s,lat);addPod(p.x,p.z,z);}
 for(const [s,lat] of[[164,-3],[172,3.5],[180,-4],[206,3],[222,5],[232,7],[246,5],[264,-3],[276,3],[292,-3],[306,3]]){const p=at(s,lat);addPod(p.x,p.z,R(1.2,1.7));}   // (the overlook's side, -lat, is left clear)
 for(const r of[ROOM('guard'),ROOM('west')])for(const [a,d] of[[.6,7],[2.4,6.5],[4.2,7.5]])addPod(r.x+Math.cos(a)*d,r.z+Math.sin(a)*d,R(1.2,1.6));
 for(const [s,lat,w] of[[228,2,6],[242,5,5]]){const p=at(s,lat),n=roadN(s);addBarricade(p.x,p.z,Math.atan2(n.z,-n.x)+Math.PI,w);}
 for(let s=S_HALL0+10;s<S_HALL1-8;s+=11)for(const side of[-1,1]){const p=at(s,side*6.5);const c=new THREE.Mesh(new THREE.CylinderGeometry(.8,.95,14,8),hostMat);
   c.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(c.geometry.attributes.position.count*3).fill(.16),3));c.position.set(p.x,7,p.z);c.castShadow=c.receiveShadow=true;scene.add(c);OBST.push({x:p.x,z:p.z,r:.95,h:14});}
 for(const r of[ROOM('junction'),ROOM('east')])for(const [a,d] of[[1,r.r-4],[3.6,r.r-3.5]])addPod(r.x+Math.cos(a)*d,r.z+Math.sin(a)*d,R(1.2,1.6));
 for(const [s,lat,z] of[[S_OLD+34,-1.5,1.3],[S_OLD+78,1.5,1.2],[S_OLD+100,-1.5,1.1]]){const p=at(s,lat);addPod(p.x,p.z,z);}
 for(const [s,lat] of[[640,-2],[714,2],[752,-2],[812,2]]){const p=at(s,lat);addPod(p.x,p.z,R(1.1,1.4));}
 for(const a of[.4,2.7,4.0,5.6])addPod(CH.x+Math.cos(a)*12.5,CH.z+Math.sin(a)*12.5,R(1.3,1.7));
 for(const [x,z] of[[PLAT.x-10,PLAT.z-6],[PLAT.x-4,PLAT.z+9],[PLAT.x+5,PLAT.z-11],[PLAT.x-11,PLAT.z+5]])addPod(x,z,1.7);
 // the ledge: a few Host barricades across it, and cargo on the pad
 for(const [sv,lat,w] of[[-196,2,6],[-150,-3,6],[-112,3,7],[-70,-2,6],[-36,4,7]]){const p=apAt(sv,lat),n=apN(sv);addBarricade(p.x,p.z,Math.atan2(n.z,-n.x)+Math.PI,w);}
 for(const [dx,dz,z] of[[-18,-12,1.8],[-21,-4,1.5],[16,-16,1.6],[20,-8,1.3],[-12,14,1.4]])addPod(LZ.x+dx,LZ.z+dz,z);}
for(const [s,lat,t] of[[30,0,'ammo'],[70,-6,'med'],[100,6,'rocket'],[146,2,'ammo'],[192,0,'med'],[236,4,'ammo'],[270,0,'rocket'],[300,0,'med'],[340,3,'ammo'],[400,0,'rocket'],[450,0,'med'],[498,0,'ammo'],[530,0,'rocket'],[556,0,'med'],[652,0,'ammo'],[724,0,'med'],[800,0,'ammo'],[836,0,'rocket']]){const p=at(s,lat);addPick(t,p.x,p.z);}
for(const [sv,lat,t] of[[-190,-4,'ammo'],[-120,4,'med'],[-60,-3,'rocket']]){const p=apAt(sv,lat);addPick(t,p.x,p.z);}
addPick('ammo',CH.x+11,CH.z-6);addPick('med',CH.x-11,CH.z-6);addPick('rocket',CH.x,CH.z+12);
_closeAll();

/* ---------- the ledge and the yard: placed out of sight ahead of you. Michael is alone here, so lighter than Site K's ---------- */
function apTroop(sv,lat,o){const p=apAt(sv,lat);return spawnTrooper(p.x,p.z,Object.assign({hold:R(12,22)},o||{}));}
function apAnchor(sv,lat){const p=apAt(sv,lat);return spawnTrooper(p.x,p.z,{anchor:p,hold:R(14,24)});}
function cliffGun(sv){const p=apAt(sv,-(apHalf(sv)+.4)),c=apAt(sv+30,0);return addTurret(p.x,p.z,p.y+1.2,Math.atan2(-(c.x-p.x),-(c.z-p.z)),'Cliff gun');}
const APP=[
  {s:-232,go:()=>{for(let k=0;k<2+n0();k++)apAnchor(-190+(k%3)*4,(k%2?1:-1)*(2+k));apTroop(-170,0);},line:['ELYRA','Host on the ledge. Behind the barricade.','alert']},
  {s:-160,go:()=>{cliffGun(-104);for(let k=0;k<2+n0();k++)apAnchor(-110+(k%2)*5,(k%2?1:-1)*(3+k));apTroop(-90,2);},line:['ELYRA','A gun on the cliff side. Rifles won’t crack it, Lieutenant. The Breaker will.','alert']},
  {s:-96,go:()=>{for(let k=0;k<2+n0();k++)apAnchor(-34+(k%2)*4,(k%2?1:-1)*(3+k*1.5));launchDrop(apAt(-50,0),3+n0(),1.5);},line:['ELYRA','Dropship. They know someone’s on the shelf.','alert']},
];
let appIdx=0;
const ENC=[
  {s:24,go:()=>{for(let k=0;k<3+n0();k++)anchorBehind(22+(k%4)*13,(k%2?1:-1)*(5+(k>>1)%3*2.5));holder(40,-4);holder(44,6);},line:['ELYRA','The outer yard. Host behind the barricades.','alert']},
  {s:60,go:()=>{wallGun(64,-1);perch(56,1,WALLH.yard);perch(74,-1,WALLH.yard);perch(84,1,WALLH.yard);for(let k=0;k<2+n0();k++)anchorBehind(62+(k%4)*5,(k%2?1:-1)*(8+(k>>1)%2*4));holder(80,0);},line:['ELYRA','Riflemen up on the terraces, and a wall gun. Keep to cover.','alert']},
  {s:92,go:()=>{wallGun(100,1);perch(96,-1,WALLH.yard);perch(106,1,WALLH.yard);for(let k=0;k<2+n0();k++)anchorBehind(90+k*3,(k%2?1:-1)*(3+k%3*3));holder(112,-3);holder(112,3);},line:['ELYRA','They’re holding the gate.','alert']},
  {s:132,go:()=>{const r=ROOM('guard');for(let k=0;k<2+n0();k++){const a=R(2,4.2),q=V3(r.x+Math.cos(a)*7,0,r.z+Math.sin(a)*7);spawnTrooper(q.x,q.z,{anchor:q});}holder(168,0);},line:['Lt. Michael','Inside. A guard room.']},
  {s:186,go:()=>{const r=ROOM('west');for(let k=0;k<2+n0();k++){const a=R(-1,1.5),q=V3(r.x+Math.cos(a)*6,0,r.z+Math.sin(a)*6);spawnTrooper(q.x,q.z,{anchor:q});}},line:['ELYRA','The corridor turns north here. Host in the room.','alert']},
  {s:256,go:()=>{for(let k=0;k<2+n0();k++)holder(272+k*3,k%2?3:-3);anchorBehind(296,0);},line:null},
  // the detention wing: riflemen along both galleries, troopers between the columns
  {s:S_HALL0+4,go:()=>{for(const [s,side] of[[S_HALL0+16,-1],[S_HALL0+26,1],[S_HALL0+38,-1],[S_HALL0+50,1]])perch(s,side,5,1.7);for(let k=0;k<2+n0();k++)holder(S_HALL0+26+k*4,k%2?4:-4);},line:['ELYRA','Cells, under the galleries, both sides. Riflemen up on the walkways.','alert']},
  {s:S_HALL0+56,go:()=>{for(const [s,side] of[[S_HALL0+72,1],[S_HALL0+82,-1],[S_HALL0+94,1],[S_HALL0+60,-1]])perch(s,side,5,1.7);for(let k=0;k<2+n0();k++)anchorBehind(S_HALL0+72+k*4.5,k%2?4:-4);holder(S_HALL0+100,0);},line:['ELYRA','More on the walkways. The live cells are at the far end. I can hear heartbeats.','alert']},
];
let encIdx=0;

/* ---------- the gate's security lock: a Host console in the guard post beside it ---------- */
const LOCK=(()=>{const p=at(S_GATE-7,-(laneHalf(S_GATE-7)-1.6)),G=new THREE.Group();G.position.copy(p);scene.add(G);const c=at(S_GATE-7,0);G.rotation.y=Math.atan2(-(c.x-p.x),-(c.z-p.z));
  const m=new Merger(),gm=new Merger();m.add(boxUV(1.6,1.1,.7,2),M(0,.55,0),K_DARK2);m.add(boxUV(1.5,.9,.2,2),M(0,1.45,-.25,-.4,0,0),K_DARK);gm.add(new THREE.BoxGeometry(1.2,.6,.02),M(0,1.47,-.14,-.4,0,0),W1);
  const o=new THREE.Mesh(m.build(),hostMat);o.castShadow=true;G.add(o,new THREE.Mesh(gm.build(),purpleGlow));OBST.push({x:p.x,z:p.z,r:.9,h:1.6});
  const l=glowSprite(0xff3a2a,.9,2.4,.9);l.position.set(0,2.1,0);G.add(l);return{G,p,l,hold:0,done:false,open:0};})();
function lockStep(dt){const near=P.alive&&Math.hypot(P.pos.x-LOCK.p.x,P.pos.z-LOCK.p.z)<3;
  PG.objective('Override the gate’s security lock');WP=LOCK.p.clone().setY(2.2);onUse=near?()=>{LOCK.hold=9;}:null;
  if(near){LOCK.hold+=dt;banner((coarse?'Overriding the lock…':'Overriding the lock… (or press E)')+' '+Math.min(100,Math.round(LOCK.hold/2.4*100))+'%');if(LOCK.hold>2.4){LOCK.done=true;onUse=null;openGate();}}else LOCK.hold=0;}
function openGate(){LOCK.l.material.color.copy(C(0x4aff8a)).multiplyScalar(2.4);if(typeof sfx!=='undefined'){sfx.beep&&sfx.beep();if(sfx.door)sfx.door(GATE.frame.position,'big',3);}
  GATE.sliding=true;GATE.charge.visible=false;say('g1','ELYRA','Lock’s open. The gate is moving.');}
function updateGateSlide(dt){if(!GATE.sliding||LOCK.open>=1)return;LOCK.open=Math.min(1,LOCK.open+dt*.35);const u=easeIO(LOCK.open);for(const L of GATE.leaves)L.L.position.x=L.x0+L.s*u*7.4;if(LOCK.open>.55)barrier('gate').open=true;}

/* ---------- the overlook: through the glass, the Host loading prisoners onto the transport below ---------- */
const STAGE_PEOPLE=[];let stageOn=false,stageT=0;
function stageStart(){if(stageOn)return;stageOn=true;const S=STAGE_SET;
  for(let k=0;k<8;k++){const H=makeHuman('colonist');scene.add(H.root);MODELS.dress(H,'keepers-civilian',{unarmed:true});H.root.position.copy(S.door);H.root.visible=false;STAGE_PEOPLE.push({H,t:-k*2.6,guard:false});}
  for(const [a,b] of[[-10,-4],[8,-8]]){const H=makeHuman('trooper');scene.add(H.root);MODELS.enemy(H,'host',{unit:'footsoldier',k:window.HOST_LIFT||.5});
    H.root.position.set(STAGE.cx+STAGE.tx*a+STAGE.nx*b,STAGE.fy,STAGE.cz+STAGE.tz*a+STAGE.nz*b);STAGE_PEOPLE.push({H,guard:true,a,b});}}
function stageStep(dt){if(!stageOn)return;const S=STAGE_SET;stageT+=dt;
  for(const Q of STAGE_PEOPLE){const H=Q.H;if(Q.guard){H.root.rotation.y=Math.atan2(-STAGE.tx,-STAGE.tz)+Math.sin(T*.4+Q.a)*.4;poseHuman(H,dt,0,.6,false);continue;}
    Q.t+=dt;if(Q.t<0){H.root.visible=false;continue;}
    // door → the foot of the ramp → up it, then gone into the ship; the next one comes out of the door again
    const L1=S.door.distanceTo(S.foot),L2=S.foot.distanceTo(S.top),d=Q.t*1.5;H.root.visible=true;let a,b,u;
    if(d<L1){a=S.door;b=S.foot;u=d/L1;}else if(d<L1+L2){a=S.foot;b=S.top;u=(d-L1)/L2;}else{Q.t=-R(2,8);H.root.visible=false;continue;}
    H.root.position.lerpVectors(a,b,u);H.root.rotation.y=Math.atan2(-(b.x-a.x),-(b.z-a.z));poseHuman(H,dt,1.5,0,false);H.torso.rotation.x=.25;}}
function stageStop(){if(!stageOn)return;stageOn=false;for(const Q of STAGE_PEOPLE)scene.remove(Q.H.root);STAGE_PEOPLE.length=0;}

/* ---------- the cells ---------- */
const TASKS=[];let taskHold=0,taskNow=null;
function task(id,label,pos,onDone,needs,hold){const t={id,label,pos:pos.clone(),done:false,onDone,needs:needs||null,on:false,hold:hold||1};TASKS.push(t);return t;}
function updateTasks(dt){taskNow=null;let best=3;for(const t of TASKS){if(!t.on||t.done||(t.needs&&!t.needs()))continue;const d=Math.hypot(P.pos.x-t.pos.x,P.pos.z-t.pos.z)+Math.max(0,Math.abs(P.pos.y-t.pos.y)-2)*3;if(d<best){best=d;taskNow=t;}}
  if(taskNow&&P.alive){onUse=()=>{taskHold=9;};taskHold+=dt;banner(taskNow.label+(coarse?' · hold':' · hold, or press E'));
    if(taskHold>taskNow.hold){const t=taskNow;t.done=true;taskHold=0;onUse=null;if(typeof sfx!=='undefined'&&sfx.pickup)sfx.pickup();t.onDone();}}
  else{taskHold=0;if(onUse&&!taskNow)onUse=null;}}
let firstCellT=-1,freed=0;
const CELL_TASKS=CELLS.filter(c=>c.live).map(c=>{const F=c.F,p=V3(F.fx-F.ox*1.4,0,F.fz-F.oz*1.4);
  return task('cell-'+c.who,'Open the cell',p,()=>openCell(c),null,1.2);});
function openCell(c){c.opening=true;if(typeof sfx!=='undefined'){sfx.beep&&sfx.beep();if(sfx.door)sfx.door(c.slab.position,'small',1);}c.lock.material.color.copy(C(0x4aff8a)).multiplyScalar(2);
  if(firstCellT<0)firstCellT=T;freed++;const A=c.ally;
  setTimeout(()=>{A.on=true;A.H.root.visible=true;reviveAlly(A,100);A.hp=100;if(!SQUAD.includes(A))SQUAD.push(A);
    if(A===RHEN){setPhase('rescuecut');rescueScene();}
    else if(freed<3)PG.say(A.name,pick(['Keeper? Thank God. I can still shoot.','About time. Give me a rifle.','I’m with you. Go.']),null);
    else PG.say(A.name,'That’s all of us. All that’s left.',null);
    if(freed>=3){if(T-firstCellT<60)PG.done('lscells');else PG.fail('lscells');}},900);}
function updateCells(dt){for(const c of CELLS){if(!c.opening||c.openK>=1)continue;c.openK=Math.min(1,c.openK+dt*.8);const u=easeIO(c.openK),F=c.F;
  c.slab.position.set(F.fx-F.ox*.15+F.tx*u*(c.w+.1)*-1,0,F.fz-F.oz*.15+F.tz*u*(c.w+.1)*-1);if(c.openK>.6)c.open=true;}}

/* ---------- the containment wing: the Hollow's influence, worse the deeper you go (until the device is lifted) ---------- */
const WARP=(()=>{const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;z-index:2;pointer-events:none;opacity:0;mix-blend-mode:screen;'+
  'background:radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(120,60,200,.35) 75%,rgba(20,0,40,.8)),repeating-linear-gradient(0deg,rgba(180,90,255,.07) 0 2px,transparent 2px 5px)';document.body.appendChild(d);
  return{d,k:0,suppressed:false,wT:3,gT:0};})();
function hollowK(){if(WARP.suppressed)return 0;const s=roadS(P.pos.x,P.pos.z);if(phase==='vault'||phase==='doorcut')return 1;return sstep(S_OLD-10,S_DOOR-6,s)*(['contain','escort'].includes(phase)?1:0);}
function updateWarp(dt){const want=CUTS.on&&phase!=='doorcut'?0:hollowK();WARP.k+=(want-WARP.k)*(1-Math.exp(-dt*(WARP.suppressed?4:1.2)));const k=WARP.k;
  WARP.d.style.opacity=(k*(.55+.25*Math.sin(T*2.3)+.2*Math.sin(T*7.1))).toFixed(3);
  if(!CUTS.on&&!FLY.on&&k>.05){camera.fov*=1+k*(.05*Math.sin(T*.9)+.025*Math.sin(T*2.7));camera.updateProjectionMatrix();   // (after placeCamera, which sets the fov every frame)
    // the whispers, closer and more often; now and then the HUD splits for a beat (The Mountain's voice effect)
    WARP.wT-=dt*(.4+k*1.6);if(WARP.wT<=0){WARP.wT=R(3,6);if(typeof sfx!=='undefined'&&sfx.whisper)sfx.whisper();}
    WARP.gT-=dt;if(WARP.gT<=0&&rng()<dt*k*.6){WARP.gT=.35;document.body.classList.add('glitch');setTimeout(()=>document.body.classList.remove('glitch'),220+R(0,200));}
    // the strip lights stutter
    if(!alarmOn)stripMat.color.setRGB(1.4*(1-k*.5*(rng()<k*.08?1:0)),1.4*(1-k*.25),1.4);}}
const WHISPER_LINES=[[.2,'Pathfinder crew','Do you hear that?'],[.45,'Lt. Michael','Voices. Like under the mountain.'],[.7,'Captain Rhen','Don’t answer them. Whatever they say. Keep walking.'],[.9,'ELYRA','Lieutenant, my readings of this corridor don’t agree with each other. The walls are where they should be. The distances aren’t.']];

/* ---------- the squad follows a few metres behind you, spread across the way ---------- */
function squadFollow(spread){const sP=roadS(P.pos.x,P.pos.z);
  SQUAD.forEach((A,i)=>{const back=3.5+i*2.4,lat=(i%2?1:-1)*(1.6+i*.6)*spread;let g;
    if(inVault(P.pos.x,P.pos.z)){const room=inVaultRoom(P.pos.x,P.pos.z);
      g=room?V3(P.pos.x+Math.sin(P.yaw)*back+Math.cos(P.yaw)*lat,0,P.pos.z+Math.cos(P.yaw)*back-Math.sin(P.yaw)*lat):V3(Math.min(P.pos.x+back,VAULT.x0),0,clamp(P.pos.z+lat*.5,VAULT.z-VAULT.hw+1,VAULT.z+VAULT.hw-1));
      if(playD(g.x,g.z)>-1)g.set(P.pos.x+2+i,0,clamp(P.pos.z,VAULT.z-VAULT.hw+1,VAULT.z+VAULT.hw-1));}
    else if(sP<4||inPlat(P.pos.x,P.pos.z,2)){g=V3(P.pos.x+Math.sin(P.yaw)*back+Math.cos(P.yaw)*lat,0,P.pos.z+Math.cos(P.yaw)*back-Math.sin(P.yaw)*lat);
      if(playD(g.x,g.z)>-1)g.set(P.pos.x+Math.sin(P.yaw)*2,0,P.pos.z+Math.cos(P.yaw)*2);}
    else{const sc=sP-back,L=Math.max(1,laneHalf(Math.max(0,sc))-1.6);g=at(Math.max(0,sc),clamp(latOf(P.pos.x,P.pos.z)+lat,-L,L));}
    A.goal=g;});}
let doorSeen=false,shutT=-1,risers=[],holdT=0,hold=null,escT=0;

/* ---------- the director: what each phase does every frame ---------- */
function director(dt){
  phT+=dt;markFoes(markList);markList=[];
  if(!P.alive&&phaseFight())wentDown=true;
  const s=roadS(P.pos.x,P.pos.z);
  if(phaseFight()){updateTasks(dt);}
  updateCells(dt);updateGateSlide(dt);stageStep(dt);
  if(['ledge','yard','halls','detention'].includes(phase)){
    if(appIdx<APP.length&&s>APP[appIdx].s-60){const e=APP[appIdx++];e.go();if(e.line){const k='app'+appIdx;setTimeout(()=>say(k,...e.line),700);}}
    if(encIdx<ENC.length&&s>ENC[encIdx].s-(ENC[encIdx].s<120?75:40)){const e=ENC[encIdx++];e.go();if(e.line){const k='enc'+encIdx;setTimeout(()=>say(k,...e.line),900);}}
    squadFollow(1);P.spawn.copy(s<-20?apAt(Math.max(-AP_LEN+24,s-30),0):at(Math.max(-10,s-24),0));}
  if(phase==='ledge'){
    PG.objective(s<-30?'Along the ledge to the facility · '+Math.round(-s)+' m':'Into the outer yard');WP=s<-40?apAt(Math.min(-20,s+90),0).setY(3):at(30,0).setY(3);
    if(phT>3)say('l0','ELYRA','Thermal signatures inside the rock. Dozens of them. Some of them are human, Lieutenant.',null,6);
    if(phT>9)say('l1','Lt. Michael','Then that’s where I’m going.');
    if(s>2){setPhase('yard');}}
  else if(phase==='yard'){
    PG.objective('Fight through the yard to the gate');WP=s<60?at(S_GATE-30,0).setY(3):null;
    if(s>S_GATE-24){const left=ENEMIES.filter(E=>!E.H.dead&&roadS(E.pos.x,E.pos.z)<S_GATE+2&&roadS(E.pos.x,E.pos.z)>S_GATE-60);
      if(left.length&&left.length<=3)markList=left.map(E=>E.pos.clone().setY(E.pos.y+2.2));
      if(LOCK.done){PG.objective('The gate is opening');WP=null;if(barrier('gate').open){setPhase('halls');setTimeout(()=>PG.say('ELYRA','You’re in. Security halls. Quietly, if you can.'),800);}}
      else if(!left.length){say('g0','ELYRA','The gate’s locked from that guard post. Left side. I can walk you through the override.');lockStep(dt);}
      else PG.objective('Clear the gate · '+left.length+' left');}}
  else if(phase==='halls'){
    PG.objective(s<S_BAY0?'Push into the security halls':s<S_HALL0?'Find the detention wing':'Find the detention wing');WP=s>S_BAY1+10?at(Math.min(s+40,S_HALL0+10),0).setY(3):null;
    if(s>S_BAY0-14)stageStart();
    if(s>S_BAY0-6)say('o1','ELYRA','Lieutenant. Your right. Behind the glass.');
    if(s>S_BAY0+2)say('o2','Lt. Michael','Prisoners. They’re putting them on a transport.');
    if(s>S_BAY0+8)say('o3','ELYRA','Human, all of them. The transport is spun up. They mean to move tonight.',null,6);
    if(s>S_BAY0+16&&!said.has('o4')){said.add('o4');talk([[0,'Pathfinder (stolen radio)','…Keeper channel… is that a Keeper on the pad? Interceptor Wing transponder…','alert'],[4.2,'Pathfinder (stolen radio)','…Hall? Lieutenant Michael Hall?','alert'],
      [3.4,'Lt. Michael','Who is this?'],[2.4,'Pathfinder (stolen radio)','Pathfinder. What’s left of us. Cell block, north of you, past the halls. They move us at first light. Hurry.','alert'],[6,'Lt. Michael','Hold on. I’m coming.']]);}
    if(s>S_BAY1+20)stageStop();
    if(s>S_HALL0-4){setPhase('detention');banner('Checkpoint · '+CP_NAME.cells);}}
  else if(phase==='detention'){
    const left=CELLS.filter(c=>c.live&&!c.opening);
    PG.objective(left.length?'Open the cells · '+(3-left.length)+' / 3':'Get the crew out');
    if(s>S_HALL0+30)for(const t of CELL_TASKS)t.on=true;
    const near=left.map(c=>c.F).sort((a,b)=>Math.hypot(a.fx-P.pos.x,a.fz-P.pos.z)-Math.hypot(b.fx-P.pos.x,b.fz-P.pos.z))[0];
    WP=near?V3(near.fx-near.ox*1.2,2.4,near.fz-near.oz*1.2):null;
    if(s>S_HALL0+40)say('d1','ELYRA','The three cells at the far end, Lieutenant. The rest are empty.');
    if(!left.length&&!RHEN.H.dead&&phase==='detention'&&CELLS.every(c=>!c.live||c.open)){setPhase('escort');escT=0;}}
  else if(phase==='escort'){escT+=dt;squadFollow(1);P.spawn.copy(at(Math.max(S_HALL0,s-20),0));
    PG.objective('Get the crew out of the cell block');WP=at(S_OLD+10,0).setY(3);
    if(escT<1)talk([[.4,'Captain Rhen','They took the device off us at the White City. It isn’t going on that transport.'],[4,'Lt. Michael','Where is it?'],
      [2.2,'Captain Rhen','A vault, at the bottom of this place, behind a field. They kept us close to it. I could feel it through the floor.'],[5.4,'Lt. Michael','Then we take it back.'],[2.2,'Captain Rhen','We take it back.']]);
    // the Host come in behind you from the halls, and along the galleries
    if(escT>6)once('e1',()=>{for(let k=0;k<3+n0();k++)holder(S_HALL0+R(4,20),R(-6,6));for(const [ss,side] of[[S_HALL1-30,1],[S_HALL1-20,-1]])perch(ss,side,5,1.7);setTimeout(()=>PG.say('Pathfinder crew','Behind us! They’re coming down the wing!','alert'),300);});
    if(escT>22)once('e2',()=>{for(let k=0;k<3+n0();k++)holder(S_HALL0+R(4,30),R(-8,8));});
    if(s>S_OLD+6){setPhase('contain');banner('Checkpoint · '+CP_NAME.contain);}}
  else if(phase==='contain'){squadFollow(.6);P.spawn.copy(at(Math.max(S_OLD,s-16),0));
    const k=sstep(S_OLD,S_DOOR,s);PG.objective('Find the vault');WP=s>S_DOOR-30?DOOR.p.clone().setY(4):at(Math.min(s+40,S_DOOR-6),0).setY(3);
    for(const [kk,who,txt] of WHISPER_LINES)if(k>kk)say('w'+kk,who,txt);
    once('c1',()=>{for(let i=0;i<2+n0();i++)anchorBehind(S_OLD+26+i*5,i%2?2:-2);});
    if(s>S_OLD+44)once('c2',()=>{const r=ROOM('east');for(let i=0;i<2+n0();i++){const q=V3(r.x+R(-5,5),0,r.z+R(-5,5));spawnTrooper(q.x,q.z,{anchor:q});}holder(S_OLD+96,0);setTimeout(()=>PG.say('Captain Rhen','Contact, round the corner!','alert'),400);});
    if(s>S_DOOR-14&&!doorSeen){doorSeen=true;setPhase('doorcut');WP=null;doorScene();}}
  else if(phase==='vault')vaultStep(dt,s);
  else if(phase==='extract'){
    PG.objective(RHEN.H.dead&&CASE.g.visible?'Rhen is down with the device · get to him':'Get the device to the extraction pad');WP=at(Math.min(s+40,S_HANGAR+4),0).setY(at(Math.min(s+40,S_HANGAR+4),0).y+3);
    squadFollow(.8);P.spawn.copy(at(Math.max(S_SHUT+4,s-20),0));
    if(shutT<0&&s>S_SHUT+5){shutT=0;barrier('shutter').open=false;SHUTTER.drop=true;say('x2','Pathfinder crew','Doors are sealing behind us! Only way is up!','alert');
      for(const A of SQUAD)if(roadS(A.pos.x,A.pos.z)<S_SHUT+1){const p=at(S_SHUT+3,R(-2,2));A.pos.set(p.x,p.y,p.z);}}
    if(!risers.length&&s>S_SHUT+10){for(const [rs,lat] of[[650,-2.5],[736,2.5]]){const p=at(rs,lat),c=at(rs-30,0),Tt=addTurret(p.x,p.z,p.y,Math.atan2(-(c.x-p.x),-(c.z-p.z)),'Floor gun');Tt.g.position.y=p.y-2.6;risers.push({Tt,y:p.y,t:0});}
      say('x3','Captain Rhen','Floor guns! Breaker on them!','alert');}
    for(const Rs of risers){Rs.t+=dt;Rs.Tt.g.position.y=Rs.y-2.6*(1-sstep(0,2,Rs.t));}
    holdT-=dt;if(holdT<=0&&phT<160){holdT=R(5.5,8)/OD.rof;const n=(phT<20?2:3)+(OD.n?1:0);for(let k=0;k<n;k++){const p=at(clamp(s+R(30,45),S_SHUT+8,S_HANGAR-2),R(-3,3));spawnTrooper(p.x,p.z,{hold:R(10,18)});}}
    if(phT>3)say('x1','ELYRA','Lieutenant, every system in the facility just woke up. I’ve called the dropship. Mercy is four minutes out. I told her two.','alert',6);
    if(phT>10)say('x1b','Dropship Mercy','Mercy, inbound. Give me somewhere flat, Lieutenant, and keep it clear.');
    if(RHEN.H.dead&&CASE.g.visible)markList=[RHEN.pos.clone().setY(2.6)];
    if(inPlat(P.pos.x,P.pos.z,-2)&&!RHEN.H.dead){setPhase('gunshipcut');WP=null;gunshipScene();}}
  else if(phase==='hold'){
    hold.t-=dt;PG.objective(hold.t>0?'Hold the pad · dropship in '+Math.ceil(hold.t)+' s':'Board the dropship');P.spawn.set(PLAT.x-10,PLAT_Y,PLAT.z);
    squadFollow(1.4);updateHold(dt);
    if(phT>3&&!hold.warned){hold.warned=true;banner('Dropship inbound · '+Math.ceil(hold.t)+' s · hold the pad','alert');if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();}
    if(hold.warned&&PICKUP&&PICKUP.visible)WP=PICKUP.position.clone().setY(Math.max(PICKUP.position.y+6,PLAT_Y+4));
    if(hold.t<10&&!hold.warn10){hold.warn10=true;banner('Dropship in 10 seconds · get to the open edge','alert');}
    for(const [t,who,txt,tone] of HOLD_RADIO)if(phT>t)say('hr'+t,who,txt,tone);
    if(RHEN.H.dead&&CASE.g.visible)markList=[RHEN.pos.clone().setY(PLAT_Y+2.6)];
    if(hold.t<=0){setPhase('board');banner('The dropship is in · get aboard','alert');}}
  else if(phase==='board'){
    updateHold(dt,true);PG.objective('Board the dropship');const B=V3(PLAT.x+PLAT.r-1.5,PLAT_Y,PLAT.z);WP=B.clone().setY(PLAT_Y+2.5);
    SQUAD.forEach((A,i)=>{A.goal=B.clone().add(_v.set(-2-i*1.5,0,(i-1)*2.5));});
    say('b1','Dropship Mercy','Ramp’s down! Get on, get on!','alert');
    const near=P.alive&&Math.hypot(P.pos.x-B.x,P.pos.z-B.z)<5;onUse=near?()=>{onUse=null;setPhase('endcut');endScene();}:null;
    if(near){board.t+=dt;if(board.t>.5&&onUse){onUse();return;}if(!coarse)banner('Boarding · or press E');}else board.t=0;}
  // the last few on the field get markers
  if(['ledge','yard','halls','detention','escort','contain'].includes(phase)&&!markList.length){const live=ENEMIES.filter(E=>!E.H.dead&&!E.gunner&&E.pos.distanceTo(P.pos)<90);if(live.length&&live.length<=2)markList=live.map(E=>E.pos.clone().setY(E.pos.y+2.4));}
}
const enc=new Set();function once(k,fn){if(enc.has(k))return;enc.add(k);fn();}
const board={t:0};
const HOLD_RADIO=[
  [2,'Dropship Mercy','I see your beacon, Lieutenant. A minute out, a little more. There’s a Host gunship circling that peak with you.','alert'],
  [14,'Captain Rhen','More of them, up the ramp!','alert'],
  [30,'Pathfinder crew','Captain, I’m nearly dry!','alert'],
  [36,'Dropship Mercy','I can’t take that gunship on, Lieutenant. I’m coming in under it.'],
  [45,'Dropship Mercy','Thirty seconds! Hold that pad!','alert'],
  [56,'Captain Rhen','It’s getting warm on my back, Hall. Whatever it is, it wants to leave too.']];

/* ---------- the shutter that slams behind you on the ramp ---------- */
const SHUTTER=(()=>{const p=at(S_SHUT,0),n=roadN(S_SHUT),g=new THREE.Group();g.position.set(p.x,7,p.z);g.rotation.y=Math.atan2(n.z,-n.x);scene.add(g);
  const m=new THREE.Mesh(boxUV(12,7,.8,3),hostMat);m.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(m.geometry.attributes.position.count*3).fill(.2),3));m.position.y=3.5;m.castShadow=true;g.add(m);
  const s=new THREE.Mesh(new THREE.BoxGeometry(11.6,.12,.85),new THREE.MeshBasicMaterial({color:C(0xff3a2a).multiplyScalar(2),toneMapped:false}));s.position.y=.4;g.add(s);
  return{g,drop:false,y:7};})();
function updateShutter(dt){if(!SHUTTER.drop||SHUTTER.y<=0)return;if(SHUTTER.y>=7&&typeof sfx!=='undefined'&&sfx.door)sfx.door(SHUTTER.g.position,'big');SHUTTER.y=Math.max(0,SHUTTER.y-dt*14);SHUTTER.g.position.y=SHUTTER.y;if(SHUTTER.y<=0){boom(SHUTTER.g.position.clone().setY(.5),5,0xffc0a0,.4);if(typeof sfx!=='undefined')sfx.collapse(SHUTTER.g.position);}}

/* ---------- the gunship and the hold on the pad (Site K's hangar hold, out in the open) ---------- */
let GUNSHIP=null,PICKUP=null;
const GS_ORB={cx:70,rx:44,rz:58,y:30},GS_HIT={n:0,shake:0,said:false};
const _gsF=V3(0,0,0);
AIR_TARGETS.push({off:()=>!GUNSHIP||!GUNSHIP.visible||!(phase==='hold'||phase==='board'),
  spheres:()=>{const gs=GUNSHIP;_gsF.set(0,0,1).applyQuaternion(gs.quaternion);return[-24,-12,0,12,24].map((k,i)=>({c:gs.position.clone().addScaledVector(_gsF,k),r:i===2?11:i===1||i===3?10:7}));},
  hit:(p,how,dmg)=>{if(how==='rocket'){GS_HIT.n++;GS_HIT.shake=1;if(hold)hold.fire=Math.max(hold.fire,2.4/OD.rof);boom(p,10,0xffb070,.6);boom(p,6,0xfff0d0,.3);for(let k=0;k<3;k++)puff(p.clone(),R(4,7),R(2,3));
      if(PG.add)PG.add(150,p,'hit');if(!GS_HIT.said){GS_HIT.said=true;setTimeout(()=>PG.say('Captain Rhen','Good hit! She’s still up, but that rattled her!','alert'),300);}
      else if(GS_HIT.n===4)PG.say('Dropship Mercy','Keep it up, Lieutenant. Every time you hit her she stops shooting at you.');}
    else boom(p,1.2,0xfff0d0,.2);}});
let PICKUP_OB=null;
function solidPickup(){if(PICKUP_OB||!PICKUP)return;PICKUP.updateMatrixWorld(true);PICKUP_OB=[];
  const add=(lx,lz,r)=>{const w=PICKUP.localToWorld(V3(lx,0,lz));const o={x:w.x,z:w.z,r,h:6};OBST.push(o);PICKUP_OB.push(o);};
  for(const lz of[6,0,-6,-12])add(0,lz,4.6);add(0,-16,2.6);for(const sd of[-1,1])for(const lz of[-6,4])add(sd*7.2,lz,2.2);}
function makeGunship(){const g=new THREE.Group(),K=SHIPKIT.voidclass();const a=new THREE.Mesh(K.geo,fleetHullMat(panelTex)),b=new THREE.Mesh(K.glowGeo,fleetGlowMat(HOST_GLOW,2.2));g.add(a,b);
  K.geo.computeBoundingBox();const L=K.geo.boundingBox.max.z-K.geo.boundingBox.min.z;g.scale.setScalar(70/L);scene.add(g);MODELS.swapShip(g,'voidclass',{ref:K.geo,hide:[a,b]});return g;}
// the Keeper dropship Mercy (Site K's dropship build: bay floor at y 0, nose toward -z, rear ramp at z +7.2), about 28 m
function makeDropship(){const g=new THREE.Group(),m=new Merger(),gl=new Merger(),hc=C(0x9aa3ae),dk=C(0x2c3340),bl=C(0x284c78),gd=C(0xd9b25a);
  m.add(boxUV(9.6,5.8,22,3),M(0,1.8,-1.6),hc);m.add(boxUV(7.6,1.4,20,3),M(0,5.2,-1),dk);
  const nose=new THREE.CylinderGeometry(.8,4.6,6,4,1);nose.rotateY(Math.PI/4);nose.rotateX(-Math.PI/2);nose.scale(1,.75,1);m.add(nose,M(0,1.9,-15.6),hc);
  gl.add(new THREE.BoxGeometry(4.2,.9,2.4),M(0,3.4,-13.6,-.35,0,0),C(0x9ff0ff));
  for(const s of[-1,1]){m.add(boxUV(.2,1.1,21,3),M(s*4.85,2.4,-1.6),bl);m.add(boxUV(.22,.25,21,3),M(s*4.86,3.1,-1.6),gd);m.add(boxUV(4.4,.5,7,3),M(s*6.8,3,-3),dk);
    for(const z of[-6,4]){m.add(boxUV(2.6,2.6,6,3),M(s*7.2,1.4,z),dk);m.add(cylZ(1.1,1.2,1.2,10),M(s*7.2,1.4,z+3.4),hc);gl.add(new THREE.CircleGeometry(.9,12),M(s*7.2,1.4,z+4.05),C(0x7fe6ff));}}
  const geo=m.build();g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.45,metalness:.55})),new THREE.Mesh(gl.build(),new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)})));
  MODELS.swapShip(g,'dropship',{ref:geo,glow:.1});scene.add(g);g.userData.ref=geo;return g;}
const TELE=[];
const teleMat=new THREE.MeshBasicMaterial({color:C(0xff4a3a).multiplyScalar(2),transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
function strafe(){const a=R(0,6.28),r=R(0,PLAT.r-4),x=PLAT.x+Math.cos(a)*r*.6+(P.alive?P.pos.x-PLAT.x:0)*.6,z=PLAT.z+Math.sin(a)*r*.6+(P.alive?P.pos.z-PLAT.z:0)*.6;
  const m=new THREE.Mesh(new THREE.RingGeometry(2.6,3.2,32),teleMat);m.rotation.x=-Math.PI/2;m.position.set(x,PLAT_Y+.06,z);scene.add(m);TELE.push({m,x,z,t:1.6});}
function updateHold(dt,calm){
  hold.gt+=dt*.26;const gs=GUNSHIP;if(gs){gs.visible=true;const a=hold.gt,cx=PLAT.x+GS_ORB.cx,cz=PLAT.z+6;gs.position.set(cx+Math.cos(a)*GS_ORB.rx,PLAT_Y+GS_ORB.y+Math.sin(a*2)*4,cz+Math.sin(a)*GS_ORB.rz);   // out over the gorge, east of the pad
    gs.lookAt(cx+Math.cos(a+.1)*GS_ORB.rx,gs.position.y,cz+Math.sin(a+.1)*GS_ORB.rz);gs.rotateY(Math.PI);gs.rotateZ(-.25);
    if(GS_HIT.shake>0){GS_HIT.shake=Math.max(0,GS_HIT.shake-dt*2.5);gs.rotateX(Math.sin(T*31)*.05*GS_HIT.shake);gs.rotateZ(Math.sin(T*23)*.06*GS_HIT.shake);}
    if(GS_HIT.n>0&&rng()<dt*Math.min(8,GS_HIT.n*1.5)){_v.set(R(-1,1),R(-.3,.3),R(-1,1)).multiplyScalar(14);puff(gs.position.clone().add(_v),R(4,7),R(3,5));}
    hold.fire-=dt;if(!calm&&hold.fire<=0){hold.fire=R(3.8,6)/OD.rof;strafe();}}
  for(let i=TELE.length-1;i>=0;i--){const T0=TELE[i];T0.t-=dt;T0.m.material.opacity=.3+.5*Math.abs(Math.sin(T0.t*12));
    if(T0.t<=0){scene.remove(T0.m);TELE.splice(i,1);const p=V3(T0.x,PLAT_Y+.3,T0.z);if(gs)fire(gs.position.clone(),p,260,'heavy',()=>{});
      setTimeout(()=>{boom(p,8,0xd8a0ff,.6);boom(p,5,0xfff0d0,.3);puff(p,4,2);if(typeof sfx!=='undefined')sfx.blast(p);
        if(P.alive&&Math.hypot(P.pos.x-T0.x,P.pos.z-T0.z)<3.6)hurtPlayer(35);for(const A of SQUAD)if(Math.hypot(A.pos.x-T0.x,A.pos.z-T0.z)<3.4)hurtAlly(A,30);},180);}}
  hold.sp-=dt;if(hold.sp<=0&&(calm||hold.t>4)){hold.sp=(calm?R(5,7):R(4.5,7))/OD.rof;for(let k=0;k<(calm?2:3)+(OD.n||0);k++){const p=at(S_HANGAR-R(8,18),R(-3,3));spawnTrooper(p.x,p.z,{hold:R(8,14)});}}
  if(!calm)for(const [at_,n] of[[52,4],[26,5]])if(hold.t<at_&&hold.t>8&&hold.drops<(at_===52?1:2)){hold.drops++;const a=R(2.2,4),land=V3(PLAT.x+Math.cos(a)*15,PLAT_Y,PLAT.z+Math.sin(a)*15);launchDrop(land,n+(OD.n||0));
    setTimeout(()=>PG.say(hold.drops===1?'Pathfinder crew':'Captain Rhen',hold.drops===1?'Host dropship! Putting down on the pad!':'Another one! Right on top of us!','alert'),400);}
  // Mercy: out east over the lower peaks, closing, then in beside the open edge with her ramp down
  if(PICKUP){const u=1-clamp(hold.t/hold.max,0,1),far=V3(PLAT.x+760,PLAT_Y+160,PLAT.z-260),near=V3(PLAT.x+PLAT.r+8.6,PLAT_Y+.3,PLAT.z);
    const e=easeIO(Math.min(1,u*1.05));PICKUP.position.lerpVectors(far,near,e);
    const yIn=Math.atan2(-(near.x-far.x),-(near.z-far.z));let dy=-Math.PI/2-yIn;dy=Math.atan2(Math.sin(dy),Math.cos(dy));const turn=sstep(.6,.93,e);
    PICKUP.rotation.set(-.07*(1-sstep(.75,1,e)),yIn+dy*turn,-Math.sin(turn*Math.PI)*.1);PICKUP.visible=true;
    if(RAMP)RAMP.visible=u>=1;if(u>=1)solidPickup();}}
let RAMP=null;
function startHold(){hold={t:75,max:75,gt:0,fire:4,sp:3,drops:0};blackout=0;if(!GUNSHIP)GUNSHIP=makeGunship();if(!PICKUP)PICKUP=makeDropship();
  if(!RAMP){RAMP=new THREE.Mesh(boxUV(2.4,.3,5,2),new THREE.MeshStandardMaterial({map:panelTex,color:C(0x6a7280),roughness:.5,metalness:.5}));RAMP.position.set(PLAT.x+PLAT.r+.6,PLAT_Y+.2,PLAT.z);scene.add(RAMP);RAMP.visible=false;}
  for(const E of ENEMIES)if(!E.H.dead&&roadS(E.pos.x,E.pos.z)<S_SHUT){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  setPhase('hold');banner('Hold the pad','alert');}

/* ---------- the vault: the door, the field, the power room, the lifting ---------- */
let blackout=0;const BASE={hemi:hemi.intensity,art:ART.light.intensity};
function applyBlackout(){const b=blackout;if(b<=0&&!applyBlackout.was)return;applyBlackout.was=b>0;
  hemi.intensity=(LOOKS[lookName]||LOOKS.elyra).hemiI*(1-b*.92);helmLamp.intensity*=1-b;ART.light.intensity=BASE.art*(1-b);goldGlow.opacity=.85*(1-b);
  if(!alarmOn)stripMat.color.setRGB(1.4*(1-b),1.4*(1-b),1.4*(1-b));purpleGlow.color.copy(C(HOST_GLOW)).multiplyScalar(1.1*(1-b*.95));ART.halo.material.opacity=.6*(1-b);}
function chamberRig(){const D=DOOR.p,n=roadN(S_DOOR),dx=n.z,dz=-n.x;
  const fw=(k,lat,y)=>V3(D.x+dx*k+n.x*lat,y,D.z+dz*k+n.z*lat);
  const team=[P,...SQUAD];
  return{D,n,dx,dz,fw,team,startAt:[fw(-6,0,0),fw(-8,-2.4,0),fw(-8,2.4,0),fw(-10,0,0)],inAt:[fw(10,-1.2,0),fw(9,-3.6,0),fw(8.5,2.6,0),fw(7,.4,0)],
    faceArt:(H,dt)=>{const p=H.root.position;H.root.rotation.y=Math.atan2(-(CH.x-p.x),-(CH.z-p.z));poseHuman(H,dt,0,.2,false);}};}
function doorScene(){
  const {dx,dz,fw,team,startAt,inAt,faceArt}=chamberRig();
  for(const E of ENEMIES)if(!E.H.dead){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  const walk=(u,dt)=>team.forEach((A,i)=>{const H=A.H,p=A.pos||A.H.root.position;p.lerpVectors(startAt[i],inAt[i],u);p.y=0;H.root.rotation.y=Math.atan2(-dx,-dz);poseHuman(H,dt,u>0&&u<1?1.6:0,.4,false);});
  team.forEach((A,i)=>{(A.pos||A.H.root.position).copy(startAt[i]);});
  playCut([
    {dur:5,camAt:(u,t,o)=>o.copy(fw(-12+u*2,1.4,2.2)),lookAt:(u,t,o)=>o.copy(fw(0,0,3.6)),
      say:[[.6,'Captain Rhen','This is it. They brought us past this door on the way down.']],fn:(t,dt)=>walk(0,dt)},
    {dur:6,camAt:(u,t,o)=>o.copy(fw(-3,-3.5,1.2)),lookAt:(u,t,o)=>o.copy(fw(2,0,4.2+u)),
      say:[[1.6,'Lt. Michael','The voices… they’re louder here.']],
      fn:(t,dt)=>{if(t<.1&&!DOOR.open){DOOR.open=.001;if(typeof sfx!=='undefined'){sfx.wake();if(sfx.door)sfx.door(DOOR.G?DOOR.G.position:null,'big',3);}}DOOR.seam.material.opacity=Math.max(0,.8-t*.2);walk(0,dt);}},
    {dur:7,camAt:(u,t,o)=>o.set(CH.x+9-u*2,2.2+u*.8,CH.z+11-u*2),lookAt:(u,t,o)=>o.set(CH.x,2.6,CH.z),fn:(t,dt)=>walk(Math.min(1,t/7),dt)},
    {dur:6,camAt:(u,t,o)=>{const p=RHEN.H.root.position;o.set(p.x+1.1,1.9,p.z+1.6);},lookAt:(u,t,o)=>o.set(CH.x,2.6,CH.z),
      say:[[.5,'Captain Rhen','There. We carried it off a dead moon and across half of Astraea. They took it off us in an hour.']],
      fn:(t,dt)=>{if(!doorScene.placed){doorScene.placed=1;walk(1,0);}team.forEach(A=>faceArt(A.H,dt));}},
    {dur:5,camAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x-1.4,1.85,p.z+1.8-u*.3);},lookAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x+(CH.x-p.x)*.2,1.7,p.z+(CH.z-p.z)*.2);},
      say:[[.4,'Lt. Michael','What is it?'],[0,'Captain Rhen','I don’t know. I know what it did over the White City.']],fn:(t,dt)=>{team.forEach(A=>faceArt(A.H,dt));ART.objU.wake.value=Math.min(1,t/5)*.6;}},
    {dur:6.5,camAt:(u,t,o)=>o.set(CH.x+3-u*3,1.6+u*.5,CH.z+11),lookAt:(u,t,o)=>o.set(EMIT[2].x+u*(EMIT[0].x-EMIT[2].x),2.8,EMIT[2].z+u*(EMIT[0].z-EMIT[2].z)),
      say:[[.5,'ELYRA','Three emitters are holding that field, Lieutenant. Shut them down and it fails.'],[0,'Lt. Michael','Then we shut them down.']],
      fn:(t,dt)=>{ART.objU.wake.value=Math.max(.15,.6-t*.1);team.forEach(A=>faceArt(A.H,dt));
        }},
  ],()=>{DOOR.open=1;updateDoor(.01);barrier('door').open=true;openVault();
    P.pos.copy(inAt[0]);P.yaw=Math.atan2(-(CH.x-P.pos.x),-(CH.z-P.pos.z));P.pitch=-.05;
    SQUAD.forEach((A,i)=>A.pos.copy(inAt[i+1]));
    setPhase('vault');vaultStart();banner('Checkpoint · '+CP_NAME.vault,'alert');});
}
/* the vault: clear it, shut the three emitters down (walk up and hold, or E). The first one going down sets off the Host: they come
   through the vault's north door, twice. When all three are dark the field fails; then back to the device */
const VS={cut:false,t:0,hold:0,wave:0,w1:0,shut:0};
function openVault(){}
function vaultStart(){const n=n0();
  for(const [a,d] of[[-1.1,11],[-2,11.5],[.2,12],[2.9,12],[-.4,6],[3.6,6]].slice(0,4+n)){const q=V3(CH.x+Math.cos(a)*d,0,CH.z+Math.sin(a)*d);spawnTrooper(q.x,q.z,{anchor:q});}
  spawnTrooper(CH.x-4,CH.z-9,{hold:R(10,16)});}
function rearWave(n){for(let k=0;k<n;k++){const q=at(S_RAMP+R(3,12),R(-3,3));spawnTrooper(q.x,q.z,{hold:R(8,16),goal:V3(CH.x+R(-8,8),0,CH.z+R(-10,-4))});}}
function shutEmitter(E){E.off=true;VS.shut++;onUse=null;VS.hold=0;flashScreen(.12);shakeT=.4;const c=V3(E.x,4,E.z);boom(c,5,0xd8a0ff,.5);if(typeof sfx!=='undefined'&&sfx.collapse)sfx.collapse(c);
  if(VS.shut===1){SDOOR.go=true;VS.t=0;if(typeof sfx!=='undefined'&&sfx.alarm)sfx.alarm();setTimeout(()=>PG.say('Captain Rhen','North door! They’re coming through!','alert'),1400);}
  if(VS.shut===3){VS.cut=true;ART.flicker=true;ART.objU.wake.value=.3;banner('The field is failing','alert');say('v2','Captain Rhen','That’s the last one! The field’s going down!','alert');}
  else banner('Emitter down · '+VS.shut+' / 3','alert');}
function vaultStep(dt,s){
  squadFollow(1);P.spawn.copy(at(S_DOOR+6,0));VS.t+=dt;
  const inRoom=E=>!E.H.dead&&!E.gunner&&Math.hypot(E.pos.x-CH.x,E.pos.z-CH.z)<CH.r+6;
  const left=ENEMIES.filter(inRoom);if(left.length&&left.length<=3)markList=left.map(E=>E.pos.clone().setY(E.pos.y+2.2));
  if(VS.shut>=1&&VS.wave===0&&VS.t>2.6){VS.wave=1;VS.w1=VS.t;rearWave(3+n0());}
  if(VS.wave===1&&VS.t>VS.w1+5&&(left.length<=1||VS.t>VS.w1+30)){VS.wave=2;rearWave(2+n0());say('v4','Pathfinder crew','More of them! Hold the vault!','alert');}
  if(!VS.cut){
    if(P.alive&&Math.hypot(P.pos.x-CH.x,P.pos.z-CH.z)<4.5)say('v0','Captain Rhen','Not while that field’s up, Hall. The emitters first.');
    if(VS.shut===0&&left.length){PG.objective('Clear the vault · '+left.length+' left');WP=null;onUse=null;VS.hold=0;return;}
    const on=EMIT.filter(E=>!E.off);say('v1b','ELYRA','Room’s clear. Three emitters. Shut them down.');
    PG.objective('Shut down the field emitters · '+VS.shut+' / 3');
    const near=on.map(E=>({E,d:Math.hypot(P.pos.x-E.x,P.pos.z-E.z)})).sort((a,b)=>a.d-b.d)[0];WP=near?V3(near.E.x,5.6,near.E.z):null;
    const close=near&&P.alive&&near.d<3.4;onUse=close?()=>{VS.hold=9;}:null;
    if(close){VS.hold+=dt;banner((coarse?'Shutting it down…':'Shutting it down… (or press E)')+' '+Math.min(100,Math.round(VS.hold/1.4*100))+'%');if(VS.hold>1.4)shutEmitter(near.E);}else VS.hold=0;
    return;}
  ART.fieldOn=Math.max(0,ART.fieldOn-dt*.5);
  if(VS.wave<2||left.length){PG.objective(left.length?'Hold the vault · '+left.length+' left':'The field is failing');WP=null;return;}
  PG.objective('Get to the device');WP=V3(CH.x,3.2,CH.z);say('v5','ELYRA','The field is down to nothing, Lieutenant. It’s just hanging there.');
  if(Math.hypot(P.pos.x-CH.x,P.pos.z-CH.z)<7&&P.alive){setPhase('takecut');WP=null;takeScene();}}
/* the lifting: the field gone, Rhen takes it in his hands. For a few breaths the place goes quiet: the whispers stop, the warping
   settles, the lights hold. Then the alarms, because the Host don't care about any of that */
function takeScene(){
  const {inAt,team,faceArt}=chamberRig();
  for(const E of ENEMIES)if(!E.H.dead){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  team.forEach((A,i)=>{(A.pos||A.H.root.position).copy(inAt[i]);});onUse=null;
  let alarmT=0,quiet=false;const rp=V3(CH.x+.6,0,CH.z+3.1);
  playCut([
    {dur:5,cam:[[CH.x+6,2.4,CH.z+8]],look:[[CH.x,2.8,CH.z]],
      fn:(t,dt)=>{team.forEach(A=>faceArt(A.H,dt));ART.fieldOn=0;ART.obj.position.y=lerp(4.2,1.7,sstep(.6,4.6,t));ART.halo.position.y=ART.obj.position.y;ART.objU.wake.value=t<1.2?.6+t*.3:.15;blackout=t<1.2?Math.min(1,t/.3)*.7:.7;
        RHEN.pos.lerp(rp,Math.min(1,dt*1.2));poseHuman(RHEN.H,dt,t<3?1.4:0,0,false);}},
    // Rhen lifts it. The whispers stop dead; the warping goes; everything holds still
    {dur:6.5,camAt:(u,t,o)=>{const p=RHEN.H.root.position;o.set(p.x-1.9,1.75,p.z+2.2);},lookAt:(u,t,o)=>{const p=RHEN.H.root.position;o.set(p.x,1.5,p.z);},
      say:[[2.6,'Lt. Michael','It’s… quiet.'],[0,'Captain Rhen','It does that.']],
      fn:(t,dt)=>{faceArt(RHEN.H,dt);const H=RHEN.H;H.arms[0].sh.rotation.x=-.9;H.arms[1].sh.rotation.x=-.9;H.arms[0].el.rotation.x=-.6;H.arms[1].el.rotation.x=-.6;
        if(t>1.2&&!quiet){quiet=true;WARP.suppressed=true;ART.taken=true;ART.obj.visible=false;ART.halo.visible=false;ART.motes.visible=false;ART.fieldOn=0;CASE.g.visible=true;
          flashScreen(.18);if(typeof sfx!=='undefined'){if(sfx.duck)sfx.duck(.25);if(sfx.wake)sfx.wake();}stripMat.color.setRGB(1.4,1.4,1.4);}
        if(quiet){blackout=Math.max(.15,blackout-dt*.3);}}},
    {dur:5,camAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x-1.6,1.8,p.z+2);},lookAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x,1.7,p.z);},
      say:[[.5,'Lt. Michael','The voices are gone. All of them.'],[0,'Captain Rhen','Not gone. Smaller. It won’t stop a bullet, Hall. Remember that.']],
      fn:(t,dt)=>{team.forEach(A=>faceArt(A.H,dt));P.H.root.rotation.y=Math.atan2(-(RHEN.pos.x-P.pos.x),-(RHEN.pos.z-P.pos.z));}},
    // and then the alarms, one and then dozens, and a voice over the speakers in no language anyone knows
    {dur:6,cam:[[CH.x-7,3.4,CH.z+9],[CH.x-5.5,3,CH.z+7.5]],look:[[CH.x,2,CH.z+3]],
      say:[[1.6,'Host speaker','Seraveth. Oruun kael sera. Seraveth vael.','enemy','[Unknown language]'],[0,'Captain Rhen','Now they know.','alert']],
      fn:(t,dt)=>{if(t<.1&&typeof sfx!=='undefined'&&sfx.duck)sfx.duck(1);team.forEach(A=>{poseHuman(A.H,dt,0,1,false);});alarmT+=dt;if(alarmT>(t<2?.9:.25)){alarmT=0;if(typeof sfx!=='undefined')sfx.alarm();}alarmOn=Math.min(1,.35+t*.15);blackout=.35;}},
  ],()=>{if(!ART.taken){ART.taken=true;ART.obj.visible=ART.halo.visible=ART.motes.visible=false;ART.fieldOn=0;CASE.g.visible=true;}WARP.suppressed=true;
    ART.light.intensity=0;BASE.art=0;blackout=.35;alarmOn=1;if(typeof sfx!=='undefined'&&sfx.duck)sfx.duck(1);
    P.pos.copy(inAt[0]);P.yaw=Math.atan2(-(at(S_RAMP,0).x-P.pos.x),-(at(S_RAMP,0).z-P.pos.z));P.pitch=-.05;
    setPhase('extract');banner('Get the device out','alert');PG.objective('Get the device to the extraction pad');});
}
let shakeT=0;
// the peak: a Host gunship climbs up the mountain's side as you come out on it
function gunshipScene(){
  if(!GUNSHIP)GUNSHIP=makeGunship();const gs=GUNSHIP,low=V3(PLAT.x+180,PLAT_Y-90,PLAT.z+40),mid=V3(PLAT.x+60,PLAT_Y+24,PLAT.z),out=V3(PLAT.x+150,PLAT_Y+50,PLAT.z+70);
  for(const E of ENEMIES)if(!E.H.dead&&roadS(E.pos.x,E.pos.z)>S_HANGAR-30){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  const team=[P,...SQUAD],spots=[[-6,0],[-10,-4],[-10,4],[-13,0]].map(([a,b])=>V3(PLAT.x+a,PLAT_Y,PLAT.z+b));team.forEach((A,i)=>A.pos.copy(spots[i]));
  playCut([
    {dur:5,cam:[[PLAT.x+PLAT.r-3,PLAT_Y+2.2,PLAT.z+6]],look:[[PLAT.x-12,PLAT_Y+2,PLAT.z]],
      say:[[.4,'Captain Rhen','Open air. Thank God.'],[0,'ELYRA','Lieutenant. Something big, climbing up the side of the mountain.','alert']],
      fn:(t,dt)=>{team.forEach(A=>{A.H.root.rotation.y=-Math.PI/2;poseHuman(A.H,dt,0,1,false);A.H.aimPitch=.2;});gs.visible=true;gs.position.lerpVectors(low,mid,easeIO(Math.max(0,t-2.5)/2.5)*.5);gs.rotation.set(-.3,-Math.PI/2,0);}},
    {dur:4.5,cam:[[PLAT.x-14,PLAT_Y+1.2,PLAT.z+12]],look:[[PLAT.x+40,PLAT_Y+14,PLAT.z]],
      fn:(t,dt)=>{gs.position.lerpVectors(low,mid,.5+.5*easeIO(Math.min(1,t/2.4)));gs.rotation.set(-.3+t*.06,-Math.PI/2,Math.sin(t)*.1);
        if(t>2&&!gunshipScene.f){gunshipScene.f=1;for(let k=0;k<4;k++)setTimeout(()=>{const p=V3(PLAT.x+R(-12,10),PLAT_Y+.5,PLAT.z+R(-12,12));fire(gs.position.clone(),p,260,'heavy',()=>{boom(p,7,0xd8a0ff,.6);puff(p,3,2);});},k*220);shakeT=1;}
        team.forEach(A=>{A.H.crouchTo=t>2.2?1:0;poseHuman(A.H,dt,0,1,false);A.H.aimPitch=.35;});}},
    {dur:6,cam:[[PLAT.x-8,PLAT_Y+2,PLAT.z-14],[PLAT.x-6,PLAT_Y+3,PLAT.z-12]],look:[[PLAT.x+30,PLAT_Y+26,PLAT.z+20]],
      say:[[.5,'Lt. Michael','Mercy, the pad’s hot! There’s a Host gunship on it! Come in from the east, low and fast!','alert'],[0,'Dropship Mercy','Copy. A minute, a little more. Keep them off that pad.','alert']],
      fn:(t,dt)=>{gs.position.lerpVectors(mid,out,easeIO(t/6));gs.lookAt(out.x+40,out.y+10,out.z+30);gs.rotateY(Math.PI);team.forEach(A=>{A.H.crouchTo=0;poseHuman(A.H,dt,0,1,false);});}},
  ],()=>{startHold();});
}
// indoors for the sound (js/origin/05-audio.js)
window.INDOOR_AT=()=>{if(typeof CUTS!=='undefined'&&CUTS.on&&camera.position.y>40)return 0;if(FLY.on)return 0;const z=zoneOf(roadS(camera.position.x,camera.position.z));
  if(SETS.inBay)return 1;return z==='host'||z==='hall'||z==='old'||z==='chamber'||z==='ramp'?1:0;};
