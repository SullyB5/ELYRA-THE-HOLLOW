/* Elyra · Side mission S1 · Pathfinder — the story, phase by phase (Bryce's opening, Oct 21):
   the Pathfinder's drop bay ("We get in. We find it. We get out.") → the team jumps and lands in the crater south of a Hollow installation
   → the yard and its wall guns → blow the gate → the Host's halls → the old stone nobody built ("the schematics end here")
   → the sealed door ("This wasn't on the schematics.") → the chamber: the object in its field, fed through the west wall
   → the power room (Oct 22): fight through it, cut the generator, hold off the Host coming through its back door, get back to the object
   → the field fails, the lights go out, "Take it." → alarms
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
const SQUAD=[addAlly('marine',LZ.x-10,LZ.z+3,'Sergeant Marsh','keeper-pathfinder'),addAlly('marine',LZ.x-10,LZ.z-3,'Okafor','keeper-pathfinder'),addAlly('marine',LZ.x-6,LZ.z,'Thorne','keeper-pathfinder')];
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
// (Oct 27) each stage's objective pops up big once as it starts (js/shared/lean-hud.js goalPop)
const goalSaid=new Set();function goal(k,text,sub,o){if(goalSaid.has(k))return;goalSaid.add(k);if(window.goalPop)window.goalPop(text,sub,o);}
const CP_KEY='elyra.checkpoint.pathfinder';
/* Oct 25: the approach. The rover (js/shared/vehicles.js) is set down beside the landing zone in the opening; the approach's fights
   are APP below; the settlement is a checkpoint */
function saveCP(at){try{localStorage.setItem(CP_KEY,JSON.stringify({at,t:Date.now()}));}catch(_){}}
function clearCP(){try{localStorage.removeItem(CP_KEY);}catch(_){}}
function readCP(){try{const c=JSON.parse(localStorage.getItem(CP_KEY)||'null');return c&&['settle','halls','gallery','vault','extract','hangar'].includes(c.at)?c:null;}catch(_){return null;}}
const CP_NAME={settle:'The settlement',halls:'Inside the gate',gallery:'The galleries',vault:'The power room',extract:'The way out',hangar:'The hangar'};
function setPhase(p){if(['halls','vault','extract','hold'].includes(p)&&phase!==p)saveCP(p==='hold'?'hangar':p);if(p==='end')clearCP();phase=p;phT=0;
  if(['board','end','doorcut','gunshipcut'].includes(p))reviveAllies();}
function phaseFight(){return['yard','halls','vault','extract','hold','dogfight'].includes(phase);}
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
function wallGun(s,side){const h=laneHalf(s),p=at(s,side*(h+.9)),c=at(s-20,0);const face=Math.atan2(-(c.x-p.x),-(c.z-p.z));const Tt=addTurret(p.x,p.z,WALLH.yard,face,'Wall gun');if(Tt)Tt.roof=true;return Tt;}   // (up on the wall: see aimRay, Oct 27)
// riflemen up on the yard's terrace, or the big hall's galleries
function perch(s,side,y,extra){const h=laneHalf(s),p=at(s,side*(h+(extra||1.6)));const E=spawnTrooper(p.x,p.z,{perch:true});if(E){E.pos.y=y;}return E;}
function anchorBehind(s,lat){const p=at(s+1.8,lat);return spawnTrooper(p.x,p.z,{anchor:p});}
function holder(s,lat){const p=at(s,lat);return spawnTrooper(p.x,p.z,{hold:R(14,24)});}
// cover: barricades and pods in the yard, pods in the Host halls, columns in the big hall, fallen stone in the old stretch
/* Oct 25 fix (the "invisible objects"): every door is still shut while this runs, and groundY() treats anything behind a shut door as
   outside the map (it returns the wall top, ~40 m up). So every pod, block and pickup past the gate was being built up on the roof
   while its collider sat on the floor. Open every door while placing, and shut them again after. */
const _closeAll=OPEN_ALL();
{for(const [s,lat,w] of[[22,-8,7],[22,9,6],[48,0,8],[66,-12,6],[70,11,7],[92,-4,9],[104,8,5]]){const p=at(s,lat),n=roadN(s);addBarricade(p.x,p.z,Math.atan2(n.z,-n.x)+Math.PI,w);}
 for(const [s,lat,z] of[[34,-15,1.6],[38,16,1.4],[58,15,1.8],[82,-16,1.5],[86,14,1.3],[110,-5,1.2]]){const p=at(s,lat);addPod(p.x,p.z,z);}
 // the Host halls (twice as long since Oct 22): pods by the walls, the loading bay full of cargo, more pods after it
 for(const [s,lat] of[[132,-4],[140,4.5],[150,-4.5],[166,-7],[170,6],[178,-2],[186,7.5],[190,-8],[196,2.5],[214,-3.5],[226,3.5]]){const p=at(s,lat);addPod(p.x,p.z,R(1.2,1.7));}
 for(const [s,lat,w] of[[174,0,6],[188,-3,5]]){const p=at(s,lat),n=roadN(s);addBarricade(p.x,p.z,Math.atan2(n.z,-n.x)+Math.PI,w);}
 for(let s=S_HALL0+10;s<S_HALL1-8;s+=11)for(const side of[-1,1]){const p=at(s,side*6.5);const c=new THREE.Mesh(new THREE.CylinderGeometry(.8,.95,14,8),hostMat);
   c.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(c.geometry.attributes.position.count*3).fill(.16),3));c.position.set(p.x,7,p.z);c.castShadow=c.receiveShadow=true;scene.add(c);OBST.push({x:p.x,z:p.z,r:.95,h:14});}
 for(const [s,lat,z] of[[256,0,1.4],[280,-2,1.2],[304,2,1.3],[334,-2,1.2],[378,-3,1.6],[392,3,1.3],[410,-2.5,1.1],[432,2.5,1.4],[450,-2,1.2],[466,3,1.1]]){const p=at(s,lat);if(s<S_OLD)addPod(p.x,p.z,z);else addBlock(p.x,p.z,z);}
 for(const [s,lat] of[[S_DOOR+72,-2.5],[S_DOOR+92,2.5],[S_DOOR+114,-2]]){const p=at(s,lat);addPod(p.x,p.z,R(1.1,1.4));}
 // the power room: Host cargo round the generator (the room isn't walkable yet, so open it while placing, or they'd sit on its roof)
 VAULT.open=true;for(const [dx,dz,z] of[[6.5,-5,1.5],[5.5,5.5,1.3],[-4,7.5,1.4],[-5,-7,1.6],[1,-8.5,1.2]])addPod(VAULT.cx+dx,VAULT.cz+dz,z);VAULT.open=false;
 for(const [x,z] of[[PLAT.x-12,PLAT.z-6],[PLAT.x-6,PLAT.z+12],[PLAT.x+4,PLAT.z-14]])addPod(x,z,1.7);}
// supplies along the way
for(const [s,lat,t] of[[30,0,'ammo'],[70,-6,'med'],[100,6,'rocket'],[124,0,'ammo'],[158,-3,'med'],[206,3,'ammo'],[236,-3,'rocket'],[290,0,'med'],[340,3,'ammo'],[372,0,'rocket'],[440,-2,'med'],[468,2,'ammo'],[S_DOOR+58,0,'ammo'],[S_DOOR+100,0,'med']]){const p=at(s,lat);addPick(t,p.x,p.z);}
// and in the power room
VAULT.open=true;addPick('ammo',VAULT.x1+4,VAULT.z-2);addPick('med',VAULT.cx+8,VAULT.cz-6);addPick('rocket',VAULT.cx-7,VAULT.cz+4);VAULT.open=false;
_closeAll();

/* ---------- the encounters: placed out of sight ahead of you ---------- */
const ENC=[
  // Oct 25 (Bryce: 2x enemies): every group is twice what it was, spread across the way so they don't stand in each other
  {s:24,go:()=>{const n=(3+(OD.n||0))*2;for(let k=0;k<n;k++)anchorBehind(22+(k%4)*13,(k%2?1:-1)*(5+(k>>1)%3*2.5));holder(40,-4);holder(44,6);holder(36,0);holder(48,-8);},line:['Sergeant Marsh','Contact! Host on the barricades!','alert']},
  {s:60,go:()=>{wallGun(64,-1);perch(56,1,WALLH.yard);perch(74,-1,WALLH.yard);perch(66,1,WALLH.yard);perch(84,-1,WALLH.yard);for(let k=0;k<(3+(OD.n||0))*2;k++)anchorBehind(62+(k%4)*5,(k%2?1:-1)*(8+(k>>1)%2*4));holder(80,0);holder(84,6);},line:['Okafor','Wall guns, and riflemen on the terrace!','alert']},
  {s:92,go:()=>{wallGun(100,1);wallGun(88,-1);perch(96,-1,WALLH.yard);perch(106,1,WALLH.yard);for(let k=0;k<(3+(OD.n||0))*2;k++)anchorBehind(90+k*3,(k%2?1:-1)*(3+k%3*3));holder(112,-3);holder(112,3);holder(110,-9);holder(110,9);},line:['Sergeant Marsh','They’re holding the gate!','alert']},
  // inside (Oct 22: the way in is twice as long; these are spread along all of it)
  {s:132,go:()=>{for(let k=0;k<(3+(OD.n||0))*2;k++)anchorBehind(146+k*3.5,k%2?4.5:-4.5);holder(166,0);holder(170,3);},line:['Thorne','Inside! Short range, watch the pods!','alert']},
  {s:162,go:()=>{bayGun();for(let k=0;k<(4+(OD.n||0))*2;k++)anchorBehind(170+k*3.2,(k%2?1:-1)*(3+k%3*2));holder(194,-5);holder(196,5);holder(192,0);},line:['Thorne','Loading bay! Gun on the far side!','alert']},
  {s:208,go:()=>{for(let k=0;k<(2+(OD.n||0))*2;k++)holder(220+k*3,k%2?3:-3);anchorBehind(232,0);anchorBehind(228,4);},line:null},
  {s:244,go:()=>{for(const [s,side] of[[256,-1],[266,1],[278,-1],[290,1],[260,1],[272,-1],[284,1],[296,-1]])perch(s,side,5,1.7);for(let k=0;k<(2+(OD.n||0))*2;k++)holder(266+k*4,k%2?4:-4);},line:['Sergeant Marsh','They’re on the galleries! Both sides!','alert']},
  {s:300,go:()=>{for(const [s,side] of[[312,1],[322,-1],[334,1],[346,-1],[316,-1],[328,1],[340,-1],[352,1]])perch(s,side,5,1.7);for(let k=0;k<(3+(OD.n||0))*2;k++)anchorBehind(316+k*4.5,k%2?4:-4);holder(354,0);holder(350,4);},line:['Okafor','More on the walkways! Keep moving, don’t let them pin us!','alert']},
  {s:372,go:()=>{for(let k=0;k<(2+(OD.n||0))*2;k++)anchorBehind(386+k*5,k%2?3:-3);},line:null},
  {s:420,go:()=>{for(let k=0;k<(2+(OD.n||0))*2;k++)anchorBehind(434+k*4,k%2?3:-3);holder(458,0);holder(454,3);},line:['Sergeant Marsh','Host, between the ribs!','alert']},
];
let encIdx=0;
/* ---------- the approach (Oct 25): the Host's road from the landing zone to the yard ----------
   Cover along it, the skimmers waiting at their posts (they wake when you come close), and the fights that start as you near each
   stretch: gun nests, the relay, dropships on the road, the settlement (riflemen on its roofs, guns on two of them), the last nests. */
function apTroop(sv,lat,o){const p=apAt(sv,setLat(sv,lat));return spawnTrooper(p.x,p.z,Object.assign({hold:R(12,22)},o||{}));}
function apAnchor(sv,lat){const p=apAt(sv,setLat(sv,lat));return spawnTrooper(p.x,p.z,{anchor:p,hold:R(14,24)});}
function apBar(sv,lat,w){const p=apAt(sv,lat),n=apN(sv);addBarricade(p.x,p.z,Math.atan2(n.z,-n.x)+Math.PI,w);}
function nestGun(i){const N=NESTS[i];if(!N||N.used)return;N.used=true;const c=apAt(N.s-30,0);return addTurret(N.x,N.z,N.y,Math.atan2(-(c.x-N.x),-(c.z-N.z)),'Nest gun');}
/* Oct 26 (Bryce: enemies on the roofs and in the buildings shooting from places you can't see): roof guns and riflemen stand at the
   street edge of the roof (they stood in the middle, behind the edge, and their own building didn't block their sight); the gun sits
   1.7 m in from the edge, a rifleman at its lip, off to one side of the gun */
function roofGun(k){const S=ROOF_SPOTS[k];if(!S||S.used)return;S.used=true;const e=S.d/2-1.7,x=S.x+S.fx*e,z=S.z+S.fz*e,c=apAt(apS(x,z)-25,0);
  const Tt=addTurret(x,z,S.y,Math.atan2(-(c.x-x),-(c.z-z)),'Roof gun');if(Tt)Tt.roof=true;return Tt;}
function roofRifle(k){const S=ROOF_SPOTS[k];if(!S||S.rifle)return;S.rifle=true;const e=S.d/2-.55,sd=rng()<.5?-1:1,a=sd*R(2.4,Math.max(2.6,S.w/2-1.2));
  const E=spawnTrooper(S.x+S.fx*e+S.ax*a,S.z+S.fz*e+S.az*a,{perch:true});if(E){E.pos.y=S.y+.1;E.yaw=Math.atan2(-S.fx,-S.fz);}return E;}
// the settlement's own street-side roofs (ROOF_SPOTS also holds the relay's, and the back row's, which can't see the road)
const SET_SPOTS=ROOF_SPOTS.map((S,k)=>k).filter(k=>{const S=ROOF_SPOTS[k],sv=apS(S.x,S.z);return S.front&&sv>SET0&&sv<SET1;});
// troopers in the settlement stay in the street (the buildings start 10.5 m out from the middle of the road)
const setLat=(sv,lat)=>sv>SET0-10&&sv<SET1+10?Math.sign(lat||1)*Math.min(Math.abs(lat),8.5):lat;
for(const [sv,lat,w] of[[-1300,-5,7],[-1292,7,6],[-1200,-9,8],[-1170,10,6],[-1150,-2,7],[-1070,6,7],[-1020,-8,6],[-990,3,8],[-930,-6,7],[-925,8,6],
  [-660,-7,8],[-640,8,7],[-600,-2,6],[-500,6,7],[-450,-7,8],[-420,3,6],[-330,-6,7],[-300,7,7],[-240,-3,8],[-180,8,6],[-160,-8,7],[-90,0,8]])apBar(sv,lat,w);
for(const [sv,lat,t] of[[-1420,4,'ammo'],[-1250,0,'med'],[-1180,-6,'rocket'],[-1100,4,'ammo'],[-940,-4,'med'],[-880,8,'rocket'],[-800,-10,'ammo'],[-740,6,'med'],
  [-620,0,'rocket'],[-520,-5,'ammo'],[-380,5,'med'],[-280,-4,'rocket'],[-140,3,'ammo'],[-60,-5,'med']]){const p=apAt(sv,lat);addPick(t,p.x,p.z);}
// the rover the dropship brings down with you (hidden until the opening sets it on the ground)
const ROVER=VEH.addRover(LZ.x-14,LZ.z-7,Math.PI/2);   // (Oct 26: the road leaves the landing zone heading west)
ROVER.g.visible=false;ROVER.bound=(x,z)=>roadS(x,z)<S_GATE-9;   // it stops short of the gate: the halls are on foot
/* Oct 27 (Bryce: "add extra warthogs at each settlement in case you lose it"): spare rovers parked on the shoulder at the relay, at both
   ends of the settlement and before the last nests, nose up the road, the middle lane left clear. Any of them drives like the first */
const ROVERS=[ROVER];
for(const [sv,lat] of[[RELAY+12,-7],[SET0+14,7.5],[SET1-22,-7.5],[NEST2+40,7]]){const p=apAt(sv,lat),q=apAt(sv+8,lat);const V=VEH.addRover(p.x,p.z,Math.atan2(-(q.x-p.x),-(q.z-p.z)));
  V.bound=ROVER.bound;V.spare=true;ROVERS.push(V);}
const inRover=()=>!!(VEH.cur&&VEH.cur.kind==='rover');
// the nearest spare still in one piece a little way ahead of s (or null)
const spareAhead=(s,ahead)=>ROVERS.find(V=>V.spare&&!V.dead&&V!==VEH.cur&&(()=>{const d=roadS(V.g.position.x,V.g.position.z)-s;return d>-25&&d<ahead;})())||null;
/* the walker (Oct 25, Bryce: the long rover road, then a walker the team takes over before the yard and fights the rest of the way in).
   A red Herald walker the Host took and staked out beside their last gun line: four of their pylons hold it with purple beams, its
   Herald pilot long gone. Climb in (E or USE) and the beams let go; walk it up through the yard to the gate. It won't fit through
   the gate either (like the rover): the halls are on foot. js/shared/vehicles.js does the walking and the guns. */
const WK_S=-232;
const WALKER=(()=>{const lat=apHalf(WK_S)-7,p=apAt(WK_S,lat),q=apAt(WK_S+24,lat*.3);const V=VEH.addWalker(p.x,p.z,Math.atan2(-(q.x-p.x),-(q.z-p.z)));
  V.bound=(x,z)=>roadS(x,z)<S_GATE-11;return V;})();
const PEN=(()=>{const c=WALKER.g.position,beams=[],lamps=[],G=new THREE.Group();scene.add(G);
  const pm=new THREE.MeshStandardMaterial({map:panelTex,color:C(0x2a2434),roughness:.45,metalness:.7}),bm=new THREE.MeshBasicMaterial({color:C(FLEET_PURPLE).multiplyScalar(2.2),transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  for(let k=0;k<4;k++){const a=k/4*Math.PI*2+.5,x=c.x+Math.cos(a)*6.2,z=c.z+Math.sin(a)*6.2,y=groundY(x,z);
    const py=new THREE.Mesh(new THREE.CylinderGeometry(.22,.5,5.4,6),pm);py.position.set(x,y+2.7,z);py.castShadow=true;G.add(py);OBST.push({x,z,r:.6,h:5.4});
    const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(FLEET_PURPLE).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.scale.setScalar(2.6);l.position.set(x,y+5.6,z);G.add(l);lamps.push(l);
    // a beam from the pylon's head to the walker's hips
    const from=new THREE.Vector3(x,y+5.4,z),to=new THREE.Vector3(c.x,c.y+3.8,c.z),L=from.distanceTo(to);
    const b=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,L,6,1,true),bm);b.position.lerpVectors(from,to,.5);b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.clone().sub(from).normalize());G.add(b);beams.push(b);}
  let free=false;
  return{free:()=>{if(free)return;free=true;for(const b of beams)b.visible=false;for(const l of lamps)l.material.color.copy(C(0x3a3044));boom(new THREE.Vector3(c.x,c.y+3.8,c.z),3,FLEET_PURPLE,.4);if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();},
    tick:t=>{if(free)return;bm.opacity=.55+.25*Math.sin(t*7);},get free_(){return free;}};})();
VEH.onEnter=V=>{if(V===WALKER){PEN.free();say('wk1','Thorne','Herald controls, Host locks. Locks are off. Guns on the trigger, Captain, cannons on the other one.');
  setTimeout(()=>say('wk2','Sergeant Marsh','Rover stays here. We walk in behind you.'),3600);}};
VEH.onExit=(V,eject)=>{const s=roadS(P.pos.x,P.pos.z);if(eject)return;
  if(V.kind==='rover'&&s<S_GATE-40&&s<WK_S-40)say('rx'+Math.round(T/20),'Sergeant Marsh','Out of the rover, Captain? Your call.');
  if(V===WALKER&&s<S_GATE-30)say('wx'+Math.round(T/20),'Okafor','You’re leaving the big gun behind, Captain?');};
VEH.onDestroy=V=>{if(V.kind==='rover'){const sp=spareAhead(roadS(P.pos.x,P.pos.z),600);setTimeout(()=>PG.say('Okafor',sp?'Rover’s gone! There’s another one up the road!':'Rover’s gone! On foot from here!','alert'),600);}
  if(V===WALKER)setTimeout(()=>PG.say('Sergeant Marsh','Walker’s down! Out and on foot! Push for the gate!','alert'),600);};
// Oct 25 (Bryce): two skimmers per group, every group
// the Host's skimmers at their posts: they wake when you come within reach of them
const SKIM_AT=[[-1272,6],[-1248,-9],[-985,0],[-958,11],[SET0+60,-20],[SET0+120,18],[-650,-6],[-616,10],[-330,0],[-296,9]];
for(const [sv,lat] of SKIM_AT){const p=apAt(sv,lat);VEH.addSkimmer(p.x,p.z,{wake:R(75,95),hold:p.clone(),yaw:0});}
VEH.onSkimmerDown=S=>{if(!VEH.onSkimmerDown.said){VEH.onSkimmerDown.said=1;setTimeout(()=>PG.say('Thorne','Skimmer down! Rockets work on those!'),500);}};
// Oct 25 (Bryce: too many on the road): the dug-in troopers here are back to single counts (the 2x stays inside the facility)
const APP=[
  {s:-1380,go:()=>{nestGun(6);for(let k=0;k<3+(OD.n||0);k++)apAnchor(-1302+(k%3)*6,(k%2?1:-1)*(3+k%3*3));apTroop(-1280,0);},line:['Okafor','Host on the road! A gun nest, and skimmers behind it!','alert']},
  {s:-1260,go:()=>{for(let k=0;k<3+(OD.n||0);k++)apAnchor(-1210+(k%4)*12,(k%2?1:-1)*(5+k%3*4));roofRifle(0);apTroop(-1160,4);apTroop(-1160,-4);},line:['Thorne','A relay! They’re dug in round the mast!','alert']},
  {s:-1120,go:()=>{nestGun(0);nestGun(1);for(let k=0;k<2+(OD.n||0);k++)apAnchor(-1072+(k%3)*8,(k%2?1:-1)*(4+k%2*4));launchDrop(apAt(-1010,0),4+(OD.n||0));},line:['Sergeant Marsh','Two nests, and a dropship coming down on the road!','alert']},
  {s:-990,go:()=>{for(let k=0;k<2+(OD.n||0);k++)apAnchor(-930+(k%2)*4,(k%2?1:-1)*(5+k*1.5));launchDrop(apAt(-900,8),4+(OD.n||0),1.5);},line:['Okafor','Buildings up ahead! Host blocks, a whole settlement!','alert']},
  {s:SET0-20,go:()=>{saveCP('settle');banner('Checkpoint · '+CP_NAME.settle);roofGun(SET_SPOTS[1]);roofGun(SET_SPOTS[4]);for(let i=0;i<SET_SPOTS.length&&i<7;i++)if(i!==1&&i!==4)roofRifle(SET_SPOTS[i]);
    for(let k=0;k<5+(OD.n||0);k++)apAnchor(SET0+20+k*12,(k%2?1:-1)*(4+k%4*4));for(let k=0;k<4;k++)apTroop(SET0+60+k*20,(k%2?1:-1)*R(14,24));
    launchDrop(apAt(SET0+90,0),4+(OD.n||0),2.5);launchDrop(apAt(SET0+150,6),4+(OD.n||0),6);},line:['Sergeant Marsh','Riflemen on the roofs! Guns up there too!','alert']},
  {s:SET1-30,go:()=>{for(let k=0;k<3+(OD.n||0);k++)apAnchor(-650+(k%3)*12,(k%2?1:-1)*(4+k%3*3));},line:['Thorne','Out of the settlement. Barricade line ahead!','alert']},
  {s:NEST2-70,go:()=>{nestGun(2);nestGun(3);for(let k=0;k<3+(OD.n||0);k++)apAnchor(NEST2+(k%3)*8,(k%2?1:-1)*(4+k%3*3));launchDrop(apAt(NEST2+60,0),4+(OD.n||0),1);},line:['Okafor','More nests! And another dropship!','alert']},
  {s:-360,go:()=>{for(let k=0;k<2+(OD.n||0);k++)apAnchor(-300+(k%2)*6,(k%2?1:-1)*(4+k*1.2));launchDrop(apAt(-250,-6),4+(OD.n||0),2);},line:null},
  {s:-290,go:()=>{nestGun(4);nestGun(5);for(let k=0;k<2+(OD.n||0);k++)apAnchor(WK_S+R(-6,10),apHalf(WK_S)-R(10,14));for(let k=0;k<2+(OD.n||0);k++)apAnchor(-180+(k%3)*12,(k%2?1:-1)*(4+k%3*3));launchDrop(apAt(-120,0),4+(OD.n||0),3);},line:['Sergeant Marsh','Last nests before the yard! Push through!','alert']},
];
let appIdx=0;
// the loading bay's floor gun, at the far end of the bay, facing back down it
function bayGun(){const p=at(S_BAY1-1,-6.5),c=at(S_BAY0,0);addTurret(p.x,p.z,p.y,Math.atan2(-(c.x-p.x),-(c.z-p.z)),'Floor gun');}

/* ---------- the gate: plant the charge, get clear ---------- */
let charge=null;
function gateStep(dt){const cp=GATE.frame.localToWorld(new THREE.Vector3(0,0,-2.4));cp.y=0;
  if(!charge){PG.objective('Plant the breaching charge on the gate');goal('gate','Plant the breaching charge','On the gate');WP=cp.clone().setY(2);
    const near=P.alive&&!VEH.cur&&Math.hypot(P.pos.x-cp.x,P.pos.z-cp.z)<3.4;onUse=near?()=>{charge={t:4};}:null;
    if(near){gateStep.hold=(gateStep.hold||0)+dt;banner(coarse?'Planting the charge…':'Planting the charge… (or press E)');if(gateStep.hold>1.1)charge={t:4};}else gateStep.hold=0;
    if(charge){onUse=null;GATE.charge.visible=true;banner('Charge set · get clear!','alert');say('g1','Sergeant Marsh','Charge set! Everybody back!','alert');if(typeof sfx!=='undefined')sfx.beep&&sfx.beep();}
    return false;}
  charge.t-=dt;GATE.charge.material.emissiveIntensity=Math.sin(charge.t*14)>0?2:0;if(Math.floor(charge.t*2)!==Math.floor((charge.t+dt)*2)&&typeof sfx!=='undefined')sfx.empty();
  WP=null;PG.objective('Get clear of the gate · '+Math.max(0,Math.ceil(charge.t)));
  if(charge.t<=0){blowGate();flashScreen(.35);if(P.alive&&P.pos.distanceTo(GATE.frame.position)<9)hurtPlayer(60);for(const A of SQUAD)if(A.pos.distanceTo(GATE.frame.position)<8)hurtAlly(A,40);
    for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(GATE.frame.position)<12)hurtEnemy(E,1e4,'nade');return true;}
  return false;}

/* ---------- the squad follows a few metres behind you, spread across the way ---------- */
function squadFollow(spread){const sP=roadS(P.pos.x,P.pos.z);
  SQUAD.forEach((A,i)=>{const back=3.5+i*2.4,lat=(i%2?1:-1)*(1.6+i*.6)*spread;let g;
    // in the power room's passage: behind you, toward the chamber (east); in the room: round you, kept inside its wall
    if(inVault(P.pos.x,P.pos.z)){const room=inVaultRoom(P.pos.x,P.pos.z);
      g=room?new THREE.Vector3(P.pos.x+Math.sin(P.yaw)*back+Math.cos(P.yaw)*lat,0,P.pos.z+Math.cos(P.yaw)*back-Math.sin(P.yaw)*lat)
        :new THREE.Vector3(Math.min(P.pos.x+back,VAULT.x0),0,clamp(P.pos.z+lat*.5,VAULT.z-VAULT.hw+1,VAULT.z+VAULT.hw-1));
      if(playD(g.x,g.z)>-1)g.set(P.pos.x+2+i,0,clamp(P.pos.z,VAULT.z-VAULT.hw+1,VAULT.z+VAULT.hw-1));}
    else if(sP<4||inPlat(P.pos.x,P.pos.z,2)){g=new THREE.Vector3(P.pos.x+Math.sin(P.yaw)*back+Math.cos(P.yaw)*lat,0,P.pos.z+Math.cos(P.yaw)*back-Math.sin(P.yaw)*lat);
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
    if(phase==='yard'&&appIdx<APP.length&&s>APP[appIdx].s-110){const e=APP[appIdx++];e.go();if(e.line){const k='app'+appIdx;setTimeout(()=>say(k,...e.line),700);}}
    /* Oct 26 (Bryce: walking up to the front door they spawned too close and killed you at once): the yard's groups come in 150 m out,
       while you are still on the road, so they are in their cover when you arrive; the first group inside waits until the gate is down */
    if(encIdx<ENC.length&&(ENC[encIdx].s<120?s>ENC[encIdx].s-150:s>ENC[encIdx].s-40&&(ENC[encIdx].s>140||phase==='halls'))){const e=ENC[encIdx++];e.go();if(e.line){const k='enc'+encIdx;setTimeout(()=>say(k,...e.line),900);}}
    squadFollow(1);P.spawn.copy(s<-20?apAt(Math.max(-AP_LEN+20,s-30),0):at(Math.max(-10,s-24),0));}
  if(phase==='yard'){
    // the walker, staked out by the last gun line (Oct 25): pointed out as you come up on it; a marker on it until you're in it or past it
    const wantW=!WALKER.dead&&VEH.cur!==WALKER&&!PEN.free_&&s>WK_S-140&&s<WK_S+60;PEN.tick(T);
    if(wantW){PG.objective('Take the Herald walker by the road (or go on foot)');goal('walker','Take the Herald walker','By the road on your right · or go on foot');}
    else if(s<-40&&phT>2)goal('road','Reach the facility',inRover()?'Drive the road to their gate':'Up the road to their gate · take the rover');
    else if(s<-40)PG.objective(inRover()?'Drive the road to the facility · '+Math.round(apMetres(s))+' m':VEH.cur===WALKER?'Walk it up to the facility · '+Math.round(apMetres(s))+' m':'Up the road to the facility · '+Math.round(apMetres(s))+' m');else if(s<0)PG.objective('Move up to the facility');else PG.objective(VEH.cur===WALKER?'Walk it through the yard to the gate':'Fight through the yard to the gate');
    WP=wantW?WALKER.g.position.clone().setY(WALKER.g.position.y+7.5):s<-60?apAt(Math.min(-20,s+150),0).setY(3):s<60?at(S_GATE-30,0).setY(3):null;
    // a spare rover just up the road when you're on foot without one close (Oct 27)
    if(!wantW&&!VEH.cur&&s<WK_S-40&&!ROVERS.some(V=>!V.dead&&V.g.visible&&V.g.position.distanceTo(P.pos)<45)){const sp=spareAhead(s,140);
      if(sp){PG.objective('Take the rover by the road (or go on foot)');WP=sp.g.position.clone().setY(sp.g.position.y+3);}}
    if(s>WK_S-120&&!said.has('wk0')){say('wk0','Thorne','Captain, right side. A Herald walker. The Host have it pinned to their pylons.');setTimeout(()=>say('wk0b','Captain Rhen','Then we’re borrowing it.'),3000);}
    if(phT>3&&!VEH.cur&&ROVER.g.visible&&!ROVER.dead&&s<-1300)say('rv0','Sergeant Marsh','Long way to that gate on foot, Captain. Take the rover.');
    if(inRover())say('rv1','Okafor','Gun’s slaved to your helmet, Captain. Point it, we’ll hang on.');
    if(s>-1460&&phT>6)say('rv2','Ensign Landry','Pathfinder, holding high. There’s a road on my scope, Captain, all the way to their gate. They built it to be used.');
    if(phT>4)say('y0','Sergeant Marsh','Quiet landing. That won’t last.');
    if(s>8)say('y1','Ensign Landry','Pathfinder, overhead and holding. I can’t come lower with those spires lit, Captain. Call it when you want out.');
    if(VEH.cur&&s>S_GATE-24)say('rv3','Sergeant Marsh',VEH.cur===WALKER?'That thing won’t fit through the gate, Captain. Out you get.':'Rover won’t fit through that gate, Captain. Everybody out.');
    if(s>S_GATE-22){const left=ENEMIES.filter(E=>!E.H.dead&&roadS(E.pos.x,E.pos.z)<S_GATE+2&&roadS(E.pos.x,E.pos.z)>S_GATE-60);
      if(left.length&&left.length<=3)markList=left.map(E=>E.pos.clone().setY(E.pos.y+2.2));
      if(!left.length||charge){if(gateStep(dt)){setPhase('halls');setTimeout(()=>PG.say('Okafor','Gate’s down. We’re in.'),1600);}}
      else PG.objective('Clear the gate · '+left.length+' left');}}
  else if(phase==='halls'){
    PG.objective(s<S_OLD?'Push into the facility':'Find the vault');goal(s<S_OLD?'halls':'vaultfind',s<S_OLD?'Push into the facility':'Find the vault',s<S_OLD?'The vault is four hundred metres in':null);WP=s>S_OLD-6?DOOR.p.clone().setY(4):null;
    if(s>S_HOST+18)say('h1','Thorne','Schematics put the vault four hundred metres in, Captain. Straight through.');
    if(s>S_BAY1+14)say('h1b','Ensign Landry','Captain, I’m reading Host signatures moving under you. Lots of them. They know you’re inside.');
    if(s>S_HALL0-4&&!said.has('cpg')){said.add('cpg');saveCP('gallery');}
    if(s>S_HALL1-10)say('h2','Sergeant Marsh','These walls aren’t Host. Look at the joins.',null,6);
    if(s>S_HALL1+4)say('h3','Okafor','There aren’t any.');
    if(s>S_OLD+22)say('h4','Thorne','Captain... the schematics end here.');
    // Oct 22 foreshadowing: the Host were studying the object, not storing it (its function stays unsaid)
    if(s>S_DOOR-24)say('h5','Thorne','Scan rigs. Sample racks. They weren’t storing something down here, Captain. They were studying it.',null,6);
    if(s>S_DOOR-14&&!doorSeen){doorSeen=true;setPhase('doorcut');WP=null;doorScene();}}
  else if(phase==='vault')vaultStep(dt,s);
  else if(phase==='extract'){
    PG.objective(MARSH.H.dead&&CASE.g.visible?'Marsh is down with the package · get to him':'Get the package to the hangar');goal('extract','Get the package to the hangar','Up the service ramp');WP=MARSH.H.dead?MARSH.pos.clone().setY(2.4):at(S_HANGAR+6,0).setY(PLAT_Y+3);
    squadFollow(.8);P.spawn.copy(at(Math.max(S_SHUT+4,s-20),0));
    // the doors slam behind you once you're through
    if(shutT<0&&s>S_SHUT+5){shutT=0;barrier('shutter').open=false;SHUTTER.drop=true;say('x2','Okafor','Doors are sealing behind us! Only way is up!','alert');
      for(const A of SQUAD)if(roadS(A.pos.x,A.pos.z)<S_SHUT+1){const p=at(S_SHUT+3,R(-2,2));A.pos.set(p.x,p.y,p.z);}}
    // floor guns rise out of the ramp
    if(!risers.length&&s>S_SHUT+10){for(const [rs,lat] of[[388,-3],[418,2.5]]){const p=at(rs,lat),c=at(rs-30,0),Tt=addTurret(p.x,p.z,p.y,Math.atan2(-(c.x-p.x),-(c.z-p.z)),'Floor gun');Tt.g.position.y=p.y-2.6;risers.push({Tt,y:p.y,t:0});}
      say('x3','Sergeant Marsh','Floor guns! They’re waking the whole place up!','alert');}
    for(const Rs of risers){Rs.t+=dt;Rs.Tt.g.position.y=Rs.y-2.6*(1-sstep(0,2,Rs.t));}
    // the Host come down the ramp at you, and up behind before the doors close
    holdT-=dt;if(holdT<=0&&phT<160){holdT=R(5,7.5)/OD.rof;const n=(phT<20?3:4)+(OD.n?1:0);for(let k=0;k<n;k++){const p=at(clamp(s+R(30,45),S_SHUT+8,S_HANGAR-2),R(-3,3));spawnTrooper(p.x,p.z,{hold:R(10,18)});}}
    if(phT>3)say('x1','Ensign Landry','Captain, the whole moon just lit up down there. What did you do?','alert');
    if(phT>9)say('x1b','Ensign Landry','Copy, east face, the hangar. I’ll find a way in. Keep moving.');
    if(MARSH.H.dead&&CASE.g.visible)markList=[MARSH.pos.clone().setY(2.6)];
    if(inPlat(P.pos.x,P.pos.z,-2)&&!MARSH.H.dead){setPhase('gunshipcut');WP=null;gunshipScene();}}
  else if(phase==='hold'){
    hold.t-=dt;PG.objective(hold.t>0?'Hold the deck · dropship in '+Math.ceil(hold.t)+' s':'Board the dropship');goal('hold','Hold the deck','The dropship is on her way in');P.spawn.set(PLAT.x-10,PLAT_Y,PLAT.z);
    squadFollow(1.4);updateHold(dt);
    // the warning: about ten seconds after the roof comes down, the dropship's beacon shows (a marker on her as she comes in)
    if(phT>3&&!hold.warned){hold.warned=true;banner('Dropship inbound · '+Math.ceil(hold.t)+' s · hold the deck','alert');if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();}
    if(hold.warned&&PICKUP&&PICKUP.visible)WP=PICKUP.position.clone().setY(Math.max(PICKUP.position.y+6,PLAT_Y+4));
    if(hold.t<10&&!hold.warn10){hold.warn10=true;banner('Dropship in 10 seconds · get to the open edge','alert');goal('h10','Dropship in 10 seconds','Get to the open edge of the deck',{alert:true,kicker:'Extraction'});BEACON.show(true);}
    for(const [t,who,txt,tone] of HOLD_RADIO)if(phT>t)say('hr'+t,who,txt,tone);
    if(hold.warn10)BEACON.tick(dt);
    if(hold.t<=0){setPhase('board');banner('The dropship is in · get aboard','alert');goal('board','Dropship ready · get aboard','Run to the ramp at the open edge',{alert:true,kicker:'Extraction',ms:6000});BEACON.show(true);if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();}}
  else if(phase==='board'){
    updateHold(dt,true);PG.objective('Board the dropship');const B=new THREE.Vector3(PLAT.x+PLAT.r-1.5,PLAT_Y,PLAT.z);WP=B.clone().setY(PLAT_Y+2.5);BEACON.tick(dt,B);
    board.beep=(board.beep||0)-dt;if(board.beep<=0){board.beep=2.2;if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();}
    if(phT>9)say('b2','Ensign Landry','Captain, the ramp! I can’t hold her here forever!','alert');
    SQUAD.forEach((A,i)=>{A.goal=B.clone().add(_v.set(-2-i*1.5,0,(i-1)*2.5));});
    say('b1','Ensign Landry','Ramp’s down! Get on, get on!','alert');
    const near=P.alive&&Math.hypot(P.pos.x-B.x,P.pos.z-B.z)<6.5;onUse=near?()=>{onUse=null;BEACON.show(false);setPhase('endcut');endingScene();}:null;
    if(near){board.t+=dt;if(board.t>.5&&onUse){onUse();return;}if(!coarse)banner('Boarding · or press E');}else board.t=0;}
}
const board={t:0};
/* Oct 27 (Bryce: make it more obvious the dropship is ready in the last few seconds): a column of gold light and a ring on the deck at
   her ramp, pulsing, from ten seconds out until you're aboard (built at load, hidden, so it compiles on the loading screen) */
const BEACON=(()=>{const G=new THREE.Group();G.visible=false;scene.add(G);
  const cm=new THREE.MeshBasicMaterial({color:C(0xffc860).multiplyScalar(1.6),transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const col=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2.2,60,20,1,true),cm);col.position.y=30;G.add(col);
  const rm=new THREE.MeshBasicMaterial({color:C(0xffd27a).multiplyScalar(2),transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.6,3.2,40),rm);ring.rotation.x=-Math.PI/2;ring.position.y=.08;G.add(ring);
  const ring2=new THREE.Mesh(new THREE.RingGeometry(5.6,6.2,48),rm);ring2.rotation.x=-Math.PI/2;ring2.position.y=.07;G.add(ring2);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffc860).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));halo.scale.setScalar(8);halo.position.y=3;G.add(halo);
  let t=0;const put=()=>G.position.set(PLAT.x+PLAT.r-1.5,PLAT_Y,PLAT.z);
  return{show(on){put();G.visible=!!on;},tick(dt,B){t+=dt;if(B)G.position.copy(B);G.visible=true;const k=.5+.5*Math.sin(t*6);cm.opacity=.18+.22*k;rm.opacity=.45+.5*k;
    const u=(t*.8)%1;ring2.scale.setScalar(.5+u*.9);ring.scale.setScalar(1+.08*k);halo.material.opacity=.5+.5*k;}};})();
const HOLD_RADIO=[
  [2,'Ensign Landry','Captain, I see your beacon. A minute out, a little more. That gunship is circling you, so am I.','alert'],
  [14,'Sergeant Marsh','More of them coming up the ramp!','alert'],
  [34,'Ensign Landry','I can’t get a lock on that thing. It’s too big, Captain. I’m coming in under it.'],
  [41,'Thorne','Captain, I’m on my last magazine!','alert'],
  [45,'Ensign Landry','Thirty seconds! Hold that deck!','alert'],
  [56,'Okafor','Captain, the case. It’s getting warm.']];

/* ---------- the shutter that slams behind you on the ramp ---------- */
const SHUTTER=(()=>{const p=at(S_SHUT,0),n=roadN(S_SHUT),g=new THREE.Group();g.position.set(p.x,7,p.z);g.rotation.y=Math.atan2(n.z,-n.x);scene.add(g);
  const m=new THREE.Mesh(boxUV(12,7,.8,3),hostMat);m.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(m.geometry.attributes.position.count*3).fill(.2),3));m.position.y=3.5;m.castShadow=true;g.add(m);
  const s=new THREE.Mesh(new THREE.BoxGeometry(11.6,.12,.85),new THREE.MeshBasicMaterial({color:C(0xff3a2a).multiplyScalar(2),toneMapped:false}));s.position.y=.4;g.add(s);
  return{g,drop:false,y:7};})();
function updateShutter(dt){if(!SHUTTER.drop||SHUTTER.y<=0)return;if(SHUTTER.y>=7&&typeof sfx!=='undefined'&&sfx.door)sfx.door(SHUTTER.g.position,'big');/* it starts to come down */SHUTTER.y=Math.max(0,SHUTTER.y-dt*14);SHUTTER.g.position.y=SHUTTER.y;if(SHUTTER.y<=0){boom(SHUTTER.g.position.clone().setY(.5),5,0xffc0a0,.4);if(typeof sfx!=='undefined')sfx.collapse(SHUTTER.g.position);}}

/* ---------- the gunship and the hold on the deck ---------- */
let GUNSHIP=null,PICKUP=null;
/* Oct 25: the gunship flies a tighter, lower circle (was 70 x 90 m out, 52 m up: out of Breaker reach) and she can be hit. She's too big
   to bring down (Landry can't even get a lock), but a rocket on her hull rocks her, throws off her guns for a couple of seconds and
   leaves her trailing smoke. Rifle rounds spark off her plating. */
const GS_ORB={cx:55,rx:48,rz:62,y:36},GS_HIT={n:0,shake:0,said:false};
const _gsF=new THREE.Vector3();
AIR_TARGETS.push({off:()=>!GUNSHIP||!GUNSHIP.visible||!(phase==='hold'||phase==='board'),
  spheres:()=>{const gs=GUNSHIP;_gsF.set(0,0,1).applyQuaternion(gs.quaternion);return[-24,-12,0,12,24].map((k,i)=>({c:gs.position.clone().addScaledVector(_gsF,k),r:i===2?11:i===1||i===3?10:7}));},
  hit:(p,how,dmg)=>{if(how==='rocket'){GS_HIT.n++;GS_HIT.shake=1;if(hold)hold.fire=Math.max(hold.fire,2.4/OD.rof);boom(p,10,0xffb070,.6);boom(p,6,0xfff0d0,.3);for(let k=0;k<3;k++)puff(p.clone(),R(4,7),R(2,3));
      if(PG.add)PG.add(150,p,'hit');if(!GS_HIT.said){GS_HIT.said=true;setTimeout(()=>PG.say('Thorne','Direct hit! She’s still flying, but that rattled her!','alert'),300);}
      else if(GS_HIT.n===4)PG.say('Ensign Landry','Keep it up, Captain, every time you hit her she stops shooting at you!');}
    else boom(p,1.2,0xfff0d0,.2);}});
// the Pathfinder's dropship is solid once she's in beside the deck: her hull, and the engine pods (your shots stop on her too)
let PICKUP_OB=null;
function solidPickup(){if(PICKUP_OB||!PICKUP)return;PICKUP.updateMatrixWorld(true);PICKUP_OB=[];
  const add=(lx,lz,r)=>{const w=PICKUP.localToWorld(new THREE.Vector3(lx,0,lz));const o={x:w.x,z:w.z,r,h:6};OBST.push(o);PICKUP_OB.push(o);};
  for(const lz of[6,0,-6,-12])add(0,lz,4.6);add(0,-16,2.6);for(const sd of[-1,1])for(const lz of[-6,4])add(sd*7.2,lz,2.2);}
function unsolidPickup(){if(!PICKUP_OB)return;for(const o of PICKUP_OB){const i=OBST.indexOf(o);if(i>=0)OBST.splice(i,1);}PICKUP_OB=null;}
/* (Oct 26, Bryce: something in the middle of the C, a few huge ships flying over) three Host capital ships, slow and low over the
   mountain inside the C, crossing toward the north-east the whole time you are on this part of the road. Scenery: they never fire */
const C_SHIPS=(()=>{const L0=320,list=[],dir=new THREE.Vector3(1,0,-1).normalize(),side=new THREE.Vector3(dir.z,0,-dir.x),K=SHIPKIT.voidclass();
  K.geo.computeBoundingBox();const KL=K.geo.boundingBox.max.z-K.geo.boundingBox.min.z;
  for(const [off,lat,y,len] of[[-520,-120,300,L0],[-160,30,250,L0*.8],[180,170,330,L0*1.1]]){const g=new THREE.Group(),a=new THREE.Mesh(K.geo,fleetHullMat(panelTex)),b=new THREE.Mesh(K.glowGeo,fleetGlowMat(HOST_GLOW,2.4));
    g.add(a,b);g.scale.setScalar(len/KL);g.userData.dyn=1;scene.add(g);MODELS.swapShip(g,'voidclass',{ref:K.geo,hide:[a,b]});list.push({g,off,lat,y});}
  const SPAN=1800,V=14;let t=0;
  function update(dt){t+=dt;for(const S of list){const u=((S.off+t*V)%SPAN+SPAN)%SPAN-SPAN/2;
    S.g.position.set(C_MID.x+dir.x*u+side.x*S.lat,S.y+Math.sin(t*.07+S.lat)*4,C_MID.z+dir.z*u+side.z*S.lat);S.g.lookAt(S.g.position.x-dir.x,S.g.position.y,S.g.position.z-dir.z);}}
  update(0);return{update,list};})();
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
  hold.gt+=dt*.26;const gs=GUNSHIP;if(gs){gs.visible=true;const a=hold.gt,cx=PLAT.x+GS_ORB.cx,cz=PLAT.z+10;gs.position.set(cx+Math.cos(a)*GS_ORB.rx,PLAT_Y+GS_ORB.y+Math.sin(a*2)*4,cz+Math.sin(a)*GS_ORB.rz);   // east of the hangar, over open ground: clear of the facility and the spires
    gs.lookAt(cx+Math.cos(a+.1)*GS_ORB.rx,gs.position.y,cz+Math.sin(a+.1)*GS_ORB.rz);gs.rotateY(Math.PI);gs.rotateZ(-.25);
    // hits rock her: a shudder, and her guns lose their aim for a moment
    if(GS_HIT.shake>0){GS_HIT.shake=Math.max(0,GS_HIT.shake-dt*2.5);gs.rotateX(Math.sin(T*31)*.05*GS_HIT.shake);gs.rotateZ(Math.sin(T*23)*.06*GS_HIT.shake);}
    if(GS_HIT.n>0&&rng()<dt*Math.min(8,GS_HIT.n*1.5)){_v.set(R(-1,1),R(-.3,.3),R(-1,1)).multiplyScalar(14);puff(gs.position.clone().add(_v),R(4,7),R(3,5));}
    hold.fire-=dt;if(!calm&&hold.fire<=0){hold.fire=R(3.5,5.5)/OD.rof;strafe();}}
  for(let i=TELE.length-1;i>=0;i--){const T0=TELE[i];T0.t-=dt;T0.m.material.opacity=.3+.5*Math.abs(Math.sin(T0.t*12));
    if(T0.t<=0){scene.remove(T0.m);TELE.splice(i,1);const p=new THREE.Vector3(T0.x,PLAT_Y+.3,T0.z);if(gs)fire(gs.position.clone(),p,260,'heavy',()=>{});
      setTimeout(()=>{boom(p,8,0xd8a0ff,.6);boom(p,5,0xfff0d0,.3);puff(p,4,2);if(typeof sfx!=='undefined')sfx.blast(p);
        if(P.alive&&Math.hypot(P.pos.x-T0.x,P.pos.z-T0.z)<3.6)hurtPlayer(35);for(const A of SQUAD)if(Math.hypot(A.pos.x-T0.x,A.pos.z-T0.z)<3.4)hurtAlly(A,30);},180);}}
  // the Host keep coming up the ramp
  // Oct 22: they keep coming up the ramp (and still do while you run for the ramp); two Host dropships put troopers on the deck itself
  hold.sp-=dt;if(hold.sp<=0&&(calm||hold.t>4)){hold.sp=(calm?R(5,7):R(4.5,7))/OD.rof;for(let k=0;k<(calm?2:3)+(OD.n||0);k++){const p=at(S_HANGAR-R(8,18),R(-3,3));spawnTrooper(p.x,p.z,{hold:R(8,14)});}}
  if(!calm)for(const [at_,n] of[[52,4],[26,5]])if(hold.t<at_&&hold.t>8&&hold.drops<(at_===52?1:2)){hold.drops++;const a=R(2.2,4),land=new THREE.Vector3(PLAT.x+Math.cos(a)*15,PLAT_Y,PLAT.z+Math.sin(a)*15);launchDrop(land,n+(OD.n||0));
    setTimeout(()=>PG.say(hold.drops===1?'Thorne':'Sergeant Marsh',hold.drops===1?'Host dropship! It’s putting down on the deck!':'Another one! Right on top of us!','alert'),400);}
  // the Pathfinder: out east, closing, then in beside the open edge with her ramp down
  if(PICKUP&&!hold.noPF){const u=1-clamp(hold.t/hold.max,0,1),far=new THREE.Vector3(PLAT.x+700,PLAT_Y+220,PLAT.z+500),near=new THREE.Vector3(PLAT.x+PLAT.r+8.6,PLAT_Y+.3,PLAT.z);
    // nose first along her line of flight, level, then she swings round over the last stretch to put her ramp to the deck
    const e=easeIO(Math.min(1,u*1.05));PICKUP.position.lerpVectors(far,near,e);
    const yIn=Math.atan2(-(near.x-far.x),-(near.z-far.z));let dy=-Math.PI/2-yIn;dy=Math.atan2(Math.sin(dy),Math.cos(dy));const turn=sstep(.6,.93,e);
    PICKUP.rotation.set(-.07*(1-sstep(.75,1,e)),yIn+dy*turn,-Math.sin(turn*Math.PI)*.1);PICKUP.visible=true;
    if(RAMP)RAMP.visible=u>=1;if(u>=1)solidPickup();}}
let RAMP=null;
function startHold(){hold={t:75,max:75,gt:0,fire:4,sp:3,drops:0};blackout=0;if(!GUNSHIP)GUNSHIP=makeGunship();if(!PICKUP)PICKUP=makeDropship();
  if(!RAMP){RAMP=new THREE.Mesh(boxUV(2.4,.3,5,2),new THREE.MeshStandardMaterial({map:panelTex,color:C(0x6a7280),roughness:.5,metalness:.5}));RAMP.position.set(PLAT.x+PLAT.r+.6,PLAT_Y+.2,PLAT.z);scene.add(RAMP);RAMP.visible=false;}
  for(const E of ENEMIES)if(!E.H.dead&&roadS(E.pos.x,E.pos.z)<S_SHUT){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  setPhase('hold');banner('Hold the deck','alert');}

/* ---------- in-chapter cutscenes: the door and the chamber; the gunship ---------- */
let blackout=0;const BASE={hemi:hemi.intensity,art:ART.light.intensity};
function applyBlackout(){const b=blackout;if(b<=0&&!applyBlackout.was)return;applyBlackout.was=b>0;
  hemi.intensity=(LOOKS[lookName]||LOOKS.moon).hemiI*(1-b*.92);helmLamp.intensity*=1-b;ART.light.intensity=BASE.art*(1-b)+(ART.taken?0:0);goldGlow.opacity=.85*(1-b);
  if(!alarmOn)stripMat.color.setRGB(1.4*(1-b),1.4*(1-b),1.4*(1-b));purpleGlow.color.copy(C(HOST_GLOW)).multiplyScalar(1.1*(1-b*.95));ART.halo.material.opacity=.6*(1-b);}
// the scanner Okafor holds up: a little panel of light that fills with nonsense
const SCAN=(()=>{const c=document.createElement('canvas');c.width=128;c.height=96;const x=c.getContext('2d'),t=new THREE.CanvasTexture(c);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.55,.4),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:.9,toneMapped:false,side:THREE.DoubleSide,depthWrite:false}));m.visible=false;scene.add(m);
  const draw=(T,g)=>{x.fillStyle='rgba(4,16,28,.9)';x.fillRect(0,0,128,96);x.strokeStyle='#7fe3ff';x.strokeRect(2,2,124,92);x.fillStyle='#7fe3ff';x.font='9px monospace';
    if(g<.5){x.fillText('SCAN · MATERIAL',8,16);x.fillText('DENSITY ......',8,30);x.fillText('ORIGIN .......',8,44);x.beginPath();for(let i=0;i<120;i++)x.lineTo(4+i,70+Math.sin(i*.2+T*4)*8);x.stroke();}
    else{for(let i=0;i<40;i++){x.fillStyle=Math.random()<.5?'#ff5a4a':'#7fe3ff';x.fillRect(Math.random()*128,Math.random()*96,Math.random()*40,2);}x.fillStyle='#ff8a7a';x.fillText('NO MATCH',38,50);x.fillText('NO MATCH',38+Math.random()*4,62);}
    t.needsUpdate=true;};return{m,draw};})();
// the team at the door and in the chamber: where they stand, which way is in (both chamber scenes use it)
function chamberRig(){const D=DOOR.p,n=roadN(S_DOOR),dx=n.z,dz=-n.x;   // (dx,dz): forward, into the chamber
  const fw=(k,lat,y)=>new THREE.Vector3(D.x+dx*k+n.x*lat,y,D.z+dz*k+n.z*lat);
  return{D,n,dx,dz,fw,team:[P,...SQUAD],startAt:[fw(-6,0,0),fw(-8,-2.4,0),fw(-8,2.4,0),fw(-10,0,0)],inAt:[fw(19,-1.2,0),fw(18,-3.6,0),fw(17.5,2.6,0),fw(16,.4,0)],
    faceArt:(H,dt)=>{const p=H.root.position;H.root.rotation.y=Math.atan2(-(CH.x-p.x),-(CH.z-p.z));poseHuman(H,dt,0,.2,false);}};}
function doorScene(){
  const {dx,dz,fw,team,startAt,inAt,faceArt}=chamberRig();
  for(const E of ENEMIES)if(!E.H.dead){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  // everyone in a row at the door; then walking slowly in
  const walk=(u,dt)=>team.forEach((A,i)=>{const H=A.H,p=A.pos||A.H.root.position;p.lerpVectors(startAt[i],inAt[i],u);p.y=0;H.root.rotation.y=Math.atan2(-dx,-dz);poseHuman(H,dt,u>0&&u<1?1.6:0,.4,false);});
  team.forEach((A,i)=>{(A.pos||A.H.root.position).copy(startAt[i]);});
  const okafor=SQUAD[1].H,thorne=SQUAD[2].H,W=new THREE.Vector3(CH.x-CH.r,3.6,CH.z);
  playCut([
    {dur:5,camAt:(u,t,o)=>o.copy(fw(-12+u*2,1.4,2.2)),lookAt:(u,t,o)=>o.copy(fw(0,0,3.6)),
      say:[[.6,'Captain Rhen','This wasn’t on the schematics.']],fn:(t,dt)=>walk(0,dt)},
    {dur:6,camAt:(u,t,o)=>o.copy(fw(-3,-3.5,1.2)),lookAt:(u,t,o)=>o.copy(fw(2,0,4.2+u)),
      fn:(t,dt)=>{if(t<.1&&!DOOR.open){DOOR.open=.001;if(typeof sfx!=='undefined'){sfx.wake();if(sfx.door)sfx.door(DOOR.G?DOOR.G.position:null,'big',3);}}DOOR.seam.material.opacity=Math.max(0,.8-t*.2);walk(0,dt);}},
    // silence. The chamber, and the thing in the middle of it
    {dur:7,camAt:(u,t,o)=>o.set(CH.x+9-u*2,2.2+u*.8,CH.z+11-u*2),lookAt:(u,t,o)=>o.set(CH.x,2.6,CH.z),fn:(t,dt,u)=>walk(Math.min(1,t/7),dt)},
    {dur:6,camAt:(u,t,o)=>{const p=okafor.root.position;o.set(p.x+1.1,1.9,p.z+1.6);},lookAt:(u,t,o)=>o.set(CH.x,2.6,CH.z),
      say:[[.5,'Sergeant Marsh','What the hell is that?']],
      fn:(t,dt)=>{if(!doorScene.placed){doorScene.placed=1;walk(1,0);}team.forEach(A=>faceArt(A.H,dt));okafor.arms[1].sh.rotation.x=.9;okafor.arms[1].el.rotation.x=-.9;okafor.arms[0].sh.rotation.x=.8;okafor.arms[0].el.rotation.x=-.8;const p=okafor.root.position;
        const fd=Math.hypot(CH.x-p.x,CH.z-p.z)||1;SCAN.m.visible=true;SCAN.m.position.set(p.x+(CH.x-p.x)/fd*.55,1.35,p.z+(CH.z-p.z)/fd*.55);SCAN.m.lookAt(p.x,1.6,p.z);SCAN.draw(t,t>2.5?1:0);}},
    {dur:5,camAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x-1.4,1.85,p.z+1.8-u*.3);},lookAt:(u,t,o)=>{const p=P.H.root.position;o.set(p.x+(CH.x-p.x)*.2,1.7,p.z+(CH.z-p.z)*.2);},
      say:[[.4,'Captain Rhen','I don’t know.']],fn:(t,dt)=>{team.forEach(A=>faceArt(A.H,dt));SCAN.draw(t,1);ART.objU.wake.value=Math.min(1,t/5)*.6;}},
    // Oct 22: the field is fed from somewhere. Thorne follows the cable in the floor to the west wall (draft lines; Bryce rewrites)
    {dur:6.5,camAt:(u,t,o)=>o.set(CH.x+3-u*3,1.5+u*.5,CH.z+5.5),lookAt:(u,t,o)=>o.set(CH.x-6-u*8,.4+u*2.6,CH.z+1.8),
      say:[[.5,'Thorne','Captain. That field’s drawing power. There’s a feed in the floor, running to the west wall.'],[0,'Sergeant Marsh','Host bolted a door into that stone.']],
      fn:(t,dt)=>{SCAN.m.visible=false;ART.objU.wake.value=Math.max(.15,.6-t*.1);team.forEach(A=>faceArt(A.H,dt));
        thorne.root.rotation.y=Math.atan2(-(W.x-thorne.root.position.x),-(W.z-thorne.root.position.z));}},
    {dur:6,camAt:(u,t,o)=>o.set(CH.x-6.5+u*.6,1.7,CH.z+4.2),lookAt:(u,t,o)=>o.set(CH.x-CH.r,3.4+u*.8,CH.z),
      say:[[.6,'Captain Rhen','Then we cut the power. Then we take it.']],
      fn:(t,dt)=>{team.forEach(A=>{const p=A.H.root.position;A.H.root.rotation.y=Math.atan2(-(W.x-p.x),-(W.z-p.z));poseHuman(A.H,dt,0,1,false);});
        if(t>1.6&&!SDOOR.go){SDOOR.go=true;if(typeof sfx!=='undefined'&&sfx.collapse){sfx.collapse(SDOOR.G.position);if(sfx.door)sfx.door(SDOOR.G.position,'big',3);}shakeT=.4;}}},
  ],()=>{SCAN.m.visible=false;DOOR.open=1;updateDoor(.01);barrier('door').open=true;openVault();
    P.pos.set(CH.x-5,0,CH.z+1.5);P.yaw=Math.atan2(-(W.x-P.pos.x),-(W.z-P.pos.z));P.pitch=-.05;
    SQUAD.forEach((A,i)=>A.pos.set(CH.x-1+i*1.6,0,CH.z+(i-1)*2.2));
    setPhase('vault');vaultStart();banner('Cut the field’s power','alert');});
}
/* ---------- the power room (Oct 22) ----------
   Clear it, cut the generator (walk up, or E), then hold off the Host coming through its back door, then get back to the object.
   The field fails when the power goes: what follows (the lights out, the pulse, "Take it.") is takeScene. */
const VS={cut:false,t:0,hold:0,wave2:0};
function openVault(){SDOOR.go=true;if(SDOOR.open<.6){SDOOR.open=.6;SDOOR.slab.position.y=CUTS.ease(.6)*(WALLH.vault-1.1);}VAULT.open=true;}
function vaultStart(){VAULT.open=true;const n=OD.n||0;
  // behind the cargo, holding until you close in; two at the generator; more the harder it is
  const spots=[[4.2,-6.8],[3.6,7.2],[-5.6,9],[-6.8,-8.6],[-.2,-10.2],[-8.6,1.4]];
  for(let k=0;k<Math.min(spots.length,3+n);k++){const [ax,az]=spots[k],a=new THREE.Vector3(VAULT.cx+ax,0,VAULT.cz+az);spawnTrooper(a.x,a.z,{anchor:a});}
  for(const [hx,hz] of[[-4.5,-1.5],[-6,2.5]])spawnTrooper(VAULT.cx+hx,VAULT.cz+hz,{hold:R(10,16)});}
function rearWave(n){for(let k=0;k<n;k++)spawnTrooper(VAULT.cx-VAULT.r+2+R(0,2.5),VAULT.cz+R(-2.6,2.6),{hold:R(8,16)});}
function cutPower(){VS.cut=true;VS.t=0;onUse=null;GEN.cut=true;ART.flicker=true;ART.objU.wake.value=.3;flashScreen(.25);shakeT=.7;
  boom(GEN.pos.clone().setY(4.5),6,0xd8a0ff,.5);boom(GEN.pos.clone().setY(4.5),3,0xfff0d0,.25);if(typeof sfx!=='undefined'&&sfx.collapse)sfx.collapse(GEN.pos);
  banner('Power cut · the field is failing','alert');say('v2','Thorne','That’s it! The field’s going down!','alert');}
function vaultStep(dt,s){
  squadFollow(1);P.spawn.set(CH.x-4,0,CH.z);
  const near=E=>!E.H.dead&&!E.gunner&&(inVault(E.pos.x,E.pos.z)||Math.hypot(E.pos.x-CH.x,E.pos.z-CH.z)<CH.r+3);
  const inside=inVault(P.pos.x,P.pos.z),left=ENEMIES.filter(near);
  if(inside)say('v1','Sergeant Marsh','Host! Behind the cargo!','alert');
  if(left.length&&left.length<=3)markList=left.map(E=>E.pos.clone().setY(E.pos.y+2.2));
  if(!VS.cut){
    // the object can't be touched while the field holds it: walk up to it early and Thorne says so
    if(P.alive&&Math.hypot(P.pos.x-CH.x,P.pos.z-CH.z)<5.5)say('v0','Thorne','Can’t touch it with that field up, Captain. Kill the power first.');
    if(left.length){PG.objective('Clear the power room · '+left.length+' left');goal('vclear','Clear the power room');WP=inside?null:GEN.pos.clone().setY(4);VS.hold=0;onUse=null;return;}
    PG.objective('Cut the generator');goal('vgen','Cut the generator','In the middle of the room');WP=GEN.pos.clone().setY(3);say('v1b','Thorne','Room’s clear. Generator’s in the middle, Captain. Pull it.');
    const close=P.alive&&Math.hypot(P.pos.x-GEN.pos.x,P.pos.z-GEN.pos.z)<4.8;onUse=close?()=>{VS.hold=9;}:null;
    if(close){VS.hold+=dt;banner(coarse?'Cutting the power…':'Cutting the power… (or press E)');if(VS.hold>1.4)cutPower();}else VS.hold=0;
    return;}
  // the power's cut: the back door opens and they come through, twice
  VS.t+=dt;const n=OD.n||0;
  if(VS.t>1.2&&!RDOOR.go){RDOOR.go=true;if(typeof sfx!=='undefined'&&sfx.alarm)sfx.alarm();}
  if(VS.t>2.8&&VS.wave2===0){VS.wave2=1;VS.w1=VS.t;rearWave(3+n);say('v3','Sergeant Marsh','Back door! They’re coming through!','alert');return;}
  // the second group once the first is nearly down (or after half a minute, whichever is first)
  if(VS.wave2===1&&VS.t>VS.w1+4&&(left.length<=1||VS.t>VS.w1+30)){VS.wave2=2;rearWave(2+n);say('v4','Okafor','More of them! Hold the room!','alert');}
  if(VS.wave2<2||left.length){PG.objective(VS.wave2?'Hold off the Host · '+left.length+' left':'The field is failing');if(VS.wave2)goal('vhold','Hold the power room','They’re coming through the back door',{alert:true});WP=null;return;}
  // clear: back to the object
  PG.objective('Get back to the object');goal('vback','Get back to the object');WP=new THREE.Vector3(CH.x,3.2,CH.z);say('v5','Thorne','Field’s down to nothing, Captain. It’s just sitting there.');
  if(Math.hypot(P.pos.x-CH.x,P.pos.z-CH.z)<7&&P.alive){setPhase('takecut');WP=null;takeScene();}}
// the field gone: the object notices them. Every light goes out, the pulse, "Take it.", the alarms
function takeScene(){
  const {inAt,team,faceArt}=chamberRig();
  for(const E of ENEMIES)if(!E.H.dead){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  team.forEach((A,i)=>{(A.pos||A.H.root.position).copy(inAt[i]);});onUse=null;
  let alarmT=0,thoom=false;
  playCut([
    {dur:5.4,cam:[[CH.x+6,2.4,CH.z+8]],look:[[CH.x,2.8,CH.z]],
      fn:(t,dt)=>{team.forEach(A=>faceArt(A.H,dt));ART.fieldOn=Math.max(0,1-t*.8);ART.objU.wake.value=t<1.2?.6+t*.3:0;blackout=t<1.2?Math.min(1,t/.3):1;
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
    blackout=.35;alarmOn=1;
    P.pos.copy(inAt[0]);P.yaw=Math.atan2(-(at(S_RAMP,0).x-P.pos.x),-(at(S_RAMP,0).z-P.pos.z));P.pitch=-.05;
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
      say:[[.5,'Captain Rhen','Landry, the roof’s gone! Come in from the east, low and fast!','alert'],[0,'Ensign Landry','Copy. A minute, maybe more. Keep them off that deck.','alert']],
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
    updateGate(dt);updateDoor(dt);updateVault(dt,T);updateRoof(dt);updateShutter(dt);updateArtifact(dt,T);SETS.update(dt,T);
    C_SHIPS.update(dt);updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);skyU.uT.value=T;astraeaU.uT.value=T;
    PG.combat(phaseFight());
    if(CASE.g.visible)CASE.h.material.opacity=.4+.3*Math.sin(T*3);
  }else if(phase==='brief'){camera.position.set(60,40,110);camera.lookAt(0,20,-120);}
  if(shakeT>0){shakeT-=dt;camera.position.x+=R(-1,1)*shakeT*.15;camera.position.y+=R(-1,1)*shakeT*.12;}
  if(!SETS.active){updateLights(dt,T,CUTS.on?camera.position:P.pos);applyBlackout();}
  skyFollow();followSun(CUTS.on?camera.position:P.pos);updateDust();updateHud(dt);updateWp();
  renderFrame();
}
PG.briefing({title:'PATHFINDER',text:'08.03.2237. Three nights after the Hollow King walked out of the archive, the Pathfinder followed his trail into the dark. Captain Rhen’s orders: a Host installation on a dead moon, one object, recovered by the Host days ago. Get in. Find it. Get out. Threat level: '+DIFF.name+'.',
  objective:'Land with the strike team and fight up the yard to the gate.',
  pc:[['Mouse','Aim (click to lock, Esc releases)'],['W A S D','Move'],['Shift','Sprint'],['Left click','Fire'],['Right click','Aim down the sights (snipers scope in: Z zooms 4x / 7x)'],
    ['1 2 or wheel','Primary, secondary · look at a gun on a rack to take it'],['E','Pick up a gun on the ground · fill up at an ammo box'],['R','Reload'],['Q','Mobile shield'],['X','Shoulder sentry'],['3','Grenade (3 a mission, more off the fallen)'],['Space','Jump'],['C or Ctrl','Crouch (toggle)'],['4 or middle click','Zeal when the meter is full'],['Walk up or E','Plant the charge, board'],['Enter','Skip a cutscene']],
  phone:[['Left thumb','Move (push to the edge to sprint)'],['Right thumb','Aim'],['Double-tap right','Aim down the sights (again to stop) · scoped: ZOOM for 4x / 7x'],['FIRE','Fire (hold) · swipe up off it to throw a grenade'],['Ammo box','Reload (shows the magazine)'],['⇄','Next weapon'],['GEAR','Tap: mobile shield · hold: shoulder sentry'],['NADE','Grenade'],['JUMP · CROUCH','Jump, crouch (toggle)'],['Gold shield','Tap it for Zeal'],['Walk up','Plant the charge, board'],['Skip','Skip a cutscene']],
  onStart:()=>{setPhase('intro');P.input=false;
    // test: pathfinder.html?at=halls|gallery|door|vault|extract|hangar|end starts there
    const atq=(location.search.match(/[?&]at=(\w+)/)||[])[1];if(atq){jumpTo(atq);return;}
    const begin=()=>introScene(()=>{setPhase('yard');banner('Move up to the facility');goal('road','Reach the facility','Take the rover up the road to their gate');});
    const cp=readCP();if(!cp){begin();return;}
    PG.paused=true;const el=document.createElement('div');el.className='pgend pgbrief';
    el.innerHTML=`<div class="card"><h2>CHECKPOINT</h2><p>You stopped at <b>${CP_NAME[cp.at]}</b>. Pick up there, or start the mission from the beginning.</p><div class="row"><button type="button" class="primary" id="cpGo">Resume</button><button type="button" id="cpNew">Start over</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('#cpGo').addEventListener('click',()=>{el.remove();PG.paused=false;jumpTo(cp.at);});
    el.querySelector('#cpNew').addEventListener('click',()=>{el.remove();PG.paused=false;clearCP();begin();});}});
// jump straight to a stage (checkpoints, and testing)
function jumpTo(atq){P.input=true;
  // on the road (Oct 25): the settlement checkpoint, or ?at=road for the start of the approach (the rover beside you)
  if(atq==='walker'){const sv=WK_S-14;appIdx=APP.findIndex(e=>e.s>=-290);if(appIdx<0)appIdx=0;const p=apAt(sv,0);P.pos.copy(p);SQUAD.forEach((A,i)=>A.pos.copy(apAt(sv-3-i*2,(i-1)*2)));
    const q=apAt(sv+6,0);P.yaw=Math.atan2(-(q.x-p.x),-(q.z-p.z));const rp=apAt(sv-4,-6);ROVER.g.visible=true;ROVER.g.position.copy(rp);ROVER.ob.x=rp.x;ROVER.ob.z=rp.z;
    for(const S of VEH.SKIMS)if(apS(S.g.position.x,S.g.position.z)<sv-20){S.dead=true;S.hp=0;S.g.visible=false;S.ob.r=0;}said.add('wk0');setPhase('yard');banner('The walker');return;}
  if(atq==='settle'||atq==='road'){const sv=atq==='road'?-AP_LEN+40:SET0-30;appIdx=atq==='road'?0:APP.findIndex(e=>e.s>=SET0-20);if(appIdx<0)appIdx=0;
    const p=apAt(sv,0);P.pos.copy(p);SQUAD.forEach((A,i)=>A.pos.copy(apAt(sv-3-i*2,(i-1)*2)));const q=apAt(sv+6,0);P.yaw=Math.atan2(-(q.x-p.x),-(q.z-p.z));
    const rp=apAt(sv+2,7);ROVER.g.visible=true;ROVER.g.position.copy(rp);ROVER.yaw=P.yaw;ROVER.g.rotation.y=P.yaw;ROVER.ob.x=rp.x;ROVER.ob.z=rp.z;
    // skimmers behind you are gone
    for(const S of VEH.SKIMS)if(apS(S.g.position.x,S.g.position.z)<sv-20){S.dead=true;S.hp=0;S.g.visible=false;S.ob.r=0;}
    setPhase('yard');banner(atq==='road'?'The road':'Checkpoint · the settlement');return;}
  encIdx=ENC.length;appIdx=APP.length;blowGate();GATE.t=9;for(const L of GATE.leaves){L.L.visible=false;}
  const put=(s,lat)=>{const p=at(s,lat||0);P.pos.copy(p);SQUAD.forEach((A,i)=>{const q=at(s-3-i*2,(i-1)*2);A.pos.copy(q);});P.yaw=Math.atan2(-(at(s+5,0).x-p.x),-(at(s+5,0).z-p.z));};
  if(atq==='halls'){encIdx=3;put(S_GATE+6);setPhase('halls');banner('Checkpoint · '+CP_NAME.halls);return;}
  if(atq==='gallery'){encIdx=6;said.add('cpg');put(S_HALL0-2);setPhase('halls');banner('Checkpoint · '+CP_NAME.gallery);return;}
  if(atq==='door'){encIdx=ENC.length;put(S_DOOR-18);setPhase('halls');return;}
  DOOR.open=1;updateDoor(.01);barrier('door').open=true;doorSeen=true;openVault();
  if(atq==='vault'){encIdx=ENC.length;P.pos.set(CH.x-5,0,CH.z+1.5);P.yaw=Math.PI/2;SQUAD.forEach((A,i)=>A.pos.set(CH.x-1+i*1.6,0,CH.z+(i-1)*2.2));
    setPhase('vault');vaultStart();banner('Checkpoint · '+CP_NAME.vault,'alert');return;}
  GEN.cut=true;GEN.on=0;VS.cut=true;VS.wave2=2;RDOOR.go=true;ART.taken=true;ART.obj.visible=ART.halo.visible=ART.motes.visible=false;ART.fieldOn=0;CASE.g.visible=true;BASE.art=0;ART.light.intensity=0;alarmOn=1;blackout=.35;doorSeen=true;
  if(atq==='extract'){put(S_RAMP-6);setPhase('extract');banner('Checkpoint · '+CP_NAME.extract,'alert');return;}
  shutT=0;barrier('shutter').open=false;SHUTTER.drop=true;SHUTTER.y=.01;collapseRoof();for(const Pp of ROOF.parts)if(Pp.falling)Pp.delay=0;
  P.pos.set(PLAT.x-6,PLAT_Y,PLAT.z);SQUAD.forEach((A,i)=>A.pos.set(PLAT.x-10,PLAT_Y,PLAT.z+(i-1)*3));
  if(atq==='end'){startHold();hold.t=.1;return;}
  startHold();banner('Checkpoint · '+CP_NAME.hangar,'alert');}
// (the loop starts at the end of js/pathfinder/03-sets.js, once everything it calls exists)

// indoors for the sound (js/origin/05-audio.js): the Host's bays and halls, the old stone, the chamber and the service ramp; the hangar half
window.INDOOR_AT=()=>{if(typeof CUTS!=='undefined'&&CUTS.on&&camera.position.y>40)return 0;const z=zoneOf(roadS(camera.position.x,camera.position.z));
  return z==='host'||z==='hall'||z==='old'||z==='chamber'||z==='ramp'?1:z==='hangar'?.5:0;};
