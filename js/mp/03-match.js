/* Elyra · Multiplayer · Gilded Shore — the match (Oct 30, Bryce). Team deathmatch: Keeper against Keeper, in team colours (blue and red
   now; yellow and green are ready in GS.TEAMS). You are blue; the rest of both sides are bots for now (real players over two devices
   come next: peer-to-peer, no server to run).
     Bases   each side's corner: a wall with three gates, a dome over it that no shot crosses either way and the other side can't walk
             or fly into, ten spawn points (a random one each time), three gun racks with ammo boxes, three warthogs (chaingun, rocket,
             laser: js/shared/vehicles.js) and three craft on pads (Herald fighter, Keeper fighter, interceptor: js/mp/02-air.js)
     Bots    Keeper soldiers on foot. They roam the island on the street lattice (GS.nav), take the nearest enemy they can see, close
             to fighting range and hold it, and respawn at their base. Each side also keeps AI fighters in the air
     Score   a kill is a point for the killer's side (a soldier, you, or an AI craft); first to SCORE_LIMIT, or the most when the clock
             runs out
   Hooks into js/origin/03-play.js (assigned over its globals, so its own calls reach these): navToward (the lattice), hurtPlayer
   (your craft takes the hits while you fly), playerDown / playerUp (no medic: you respawn at your base), useAction (craft first),
   aimRay (the domes stop your shots). */
const TEAM_YOU='blue',TEAM_FOE='red',TEAMS=GS.TEAMS;
/* the map's own settings (GS.CFG, from its world file): Gilded Shore's are the defaults. Rainveil (js/mp/jungle-world.js) is small and
   on foot only: no craft, no hogs, fewer a side, shorter sight in the dark, and flashlights */
const CFG=Object.assign({id:'multiplayer',name:'GILDED SHORE',sub:'Team deathmatch',air:true,vehicles:true,bots:12,score:50,time:12*60,see:110,range:95,hold:34,flashlights:false,
  brief:'Multiplayer · team deathmatch. An island city of white stone and gold, the sea all round it.',
  objective:'Down the other side. Your base has guns, three warthogs and three craft; nothing crosses its dome.'},GS.CFG||{});
// (Oct 30, Bryce: 12 against 12)
// (Oct 30, Bryce: twice as many flying, and as many AI warthogs on the ground per side as there are craft in the air: js/mp/04-hogs.js)
const SCORE_LIMIT=CFG.score,TIME_LIMIT=CFG.time,BOTS_PER_SIDE=CFG.bots,AI_FIGHTERS=CFG.air?(coarse?2:4):0,AI_HOGS=CFG.vehicles?(coarse?2:4):0,RESPAWN_T=5;
let phase='brief',phT=0,matchT=0;
function phaseFight(){return phase==='play';}
const SCORE={blue:0,red:0};
const V3=(x,y,z)=>new THREE.Vector3(x,y,z),_mm=new THREE.Vector3(),_mn=new THREE.Vector3(),_mz=new THREE.Vector3();
PG.init(CFG.id,{challenges:[
  {id:'mpkills',text:'Down 20 of the other side',pts:2000,goal:20},
  ...(CFG.air?[{id:'mpair',text:'Down 3 of their craft',pts:1500,goal:3}]:[]),
  {id:'mpwin',text:'Win the match',pts:3000},
]});
{const _p=PG.prog;PG.prog=(id,n)=>_p(id==='okills'?'mpkills':id,n);}
MPAIR.setTeam(TEAM_YOU);

/* ---------- the bases: the dome, the beacon, the spawn points, racks, hogs and pads ---------- */
// (Rainveil: a fainter dome that the fog swallows like everything else: CFG.domeK, CFG.domeFog)
const domeMat=team=>new THREE.ShaderMaterial({uniforms:{uT:{value:0},col:{value:C(TEAMS[team].c)},hitP:{value:new THREE.Vector3(0,-999,0)},hitT:{value:9},k:{value:CFG.domeK||1},fogD:{value:CFG.domeFog?scene.fog.density:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,
  vertexShader:'varying vec3 vN;varying vec3 vWP;varying vec3 vL;void main(){vL=position;vec4 w=modelMatrix*vec4(position,1.0);vWP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`varying vec3 vN;varying vec3 vWP;varying vec3 vL;uniform float uT,hitT,k,fogD;uniform vec3 col,hitP;
    void main(){vec3 V=normalize(cameraPosition-vWP);float fr=pow(1.0-abs(dot(normalize(vN),V)),2.6);
      vec3 p=normalize(vL);float lat=asin(p.y),lon=atan(p.z,p.x);
      float hx=abs(fract(lon*14.0/3.1416+.5*floor(lat*20.0/3.1416))-.5),hy=abs(fract(lat*20.0/3.1416)-.5);float grid=smoothstep(.44,.5,max(hx,hy));
      float sweep=smoothstep(.0,.06,fract(lat*.6-uT*.12))*(1.0-smoothstep(.06,.16,fract(lat*.6-uT*.12)));
      float hit=max(0.0,1.0-hitT*1.6)*smoothstep(14.0,0.0,distance(vWP,hitP));
      float base=1.0-smoothstep(0.0,6.0,vL.y);
      float fd=distance(cameraPosition,vWP);float a=(fr*.55+grid*.06+sweep*.12+base*.25)*k*exp(-fd*fd*fogD*fogD)+hit*.9;
      gl_FragColor=vec4(col*a*1.4,1.0);}`});
const BASEVIS=[];
for(const B of GS.BASES){const f=Math.atan2(B.fx,B.fz),pt=(a,r)=>({x:B.x+Math.sin(f+a)*r,z:B.z+Math.cos(f+a)*r});
  // the dome
  const dm=domeMat(B.team),dome=new THREE.Mesh(new THREE.SphereGeometry(B.shieldR,64,24,0,Math.PI*2,0,Math.PI/2),dm);dome.position.set(B.x,B.y,B.z);dome.userData.dyn=1;dome.renderOrder=2;scene.add(dome);
  // the beacon: a white pylon in the middle of the base with the side's light up its face and a ring turning over it
  const bp={x:B.x,z:B.z},by=GS.terrH(bp.x,bp.z);
  if(CFG.beacon!==false){const g=new THREE.Group();g.position.set(bp.x,by,bp.z);g.userData.dyn=1;scene.add(g);
    const st=new THREE.Mesh(new THREE.CylinderGeometry(1.4,2.6,26,6),stoneMat);st.position.y=13;st.castShadow=true;g.add(st);
    const lb=new THREE.Mesh(new THREE.BoxGeometry(.5,22,.5),new THREE.MeshBasicMaterial({color:C(TEAMS[B.team].c).multiplyScalar(2.4),toneMapped:false}));
    for(let k=0;k<6;k++){const l=lb.clone(),a=k/6*Math.PI*2;l.position.set(Math.sin(a)*1.9,13,Math.cos(a)*1.9);g.add(l);}
    const ring=new THREE.Mesh(new THREE.TorusGeometry(5,.22,8,48),new THREE.MeshBasicMaterial({color:C(TEAMS[B.team].c).multiplyScalar(2.2),toneMapped:false}));ring.position.y=29;ring.rotation.x=Math.PI/2;g.add(ring);
    const tip=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(TEAMS[B.team].c).multiplyScalar(3),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));tip.position.y=29;tip.scale.setScalar(14);g.add(tip);
    OBST.push({x:bp.x,z:bp.z,r:2.8,h:26});BASEVIS.push({B,dome,dm,ring,tip});}else BASEVIS.push({B,dome,dm,ring:null,tip:null});
  // the spawn points: round the back of the base, each marked by a chevron of the side's light on the stone
  B.spawns=[];for(let k=0;k<15;k++){const a=Math.PI+(k/14-.5)*2.8,r=(B.spawnR||13)+(k%3)*(B.spawnStep||6),p=pt(a,r);if(GS.playD(p.x,p.z)>-1.5)continue;B.spawns.push(p);
    const cm=new THREE.Mesh(new THREE.RingGeometry(1.1,1.5,3).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:C(TEAMS[B.team].c).multiplyScalar(1.4),toneMapped:false,transparent:true,opacity:.6,depthWrite:false}));
    cm.position.set(p.x,GS.terrH(p.x,p.z)+.05,p.z);cm.rotation.y=f;cm.userData.dyn=1;scene.add(cm);}
  // the craft on their pads at the back, the hogs by the gates, the racks by the spawn
  if(CFG.air)[['herald',Math.PI-.68],['keeper',Math.PI],['interceptor',Math.PI+.68]].forEach(([k,a])=>{const p=pt(a,B.r*.71);MPAIR.addPad(B,p.x,p.z,f+Math.PI,k);});
  B.hogSlots=CFG.vehicles?[['chain',-.42],['rocket',0],['laser',.42]].map(([w,a])=>{const p=pt(a,B.r*.58);return{x:p.x,z:p.z,yaw:f+Math.PI,weap:w,V:null,backT:0};}):[];
  for(const a of[Math.PI-1.5,Math.PI+1.5]){const p=pt(a,B.r*.5);STATION_SPOTS.push({x:p.x,z:p.z});}
  {const p=pt(0,B.r*.3);STATION_SPOTS.push({x:p.x,z:p.z});}}
// hogs: placed at Begin (so their models load behind the loading screen); one that's lost comes back on its slot after a while
function hogUp(S){S.V=VEH.addRover(S.x,S.z,S.yaw,{weap:S.weap});S.V.spare=true;}
for(const B of GS.BASES)for(const S of B.hogSlots)hogUp(S);
VEH.onDestroy=V=>{for(const B of GS.BASES)for(const S of B.hogSlots)if(S.V===V)S.backT=25;};
function updateHogs(dt){for(const B of GS.BASES)for(const S of B.hogSlots){if(S.backT>0){S.backT-=dt;if(S.backT<=0){const V=S.V;if(VEH.cur!==V){if(V.g.parent)V.g.parent.remove(V.g);const i=VEH.LIST.indexOf(V);if(i>=0)VEH.LIST.splice(i,1);const j=OBST.indexOf(V.ob);if(j>=0)OBST.splice(j,1);hogUp(S);}else S.backT=5;}}}}
// a craft for each side in the air from the start
const AIRK=['herald','keeper','interceptor'];
for(let i=0;i<AI_FIGHTERS;i++){MPAIR.addAI(TEAM_YOU,AIRK[i%3]);MPAIR.addAI(TEAM_FOE,AIRK[(i+1)%3]);}
const baseOf=t=>GS.BASES.find(b=>b.team===t);
const pickSpawn=t=>{const B=baseOf(t),L=B.spawns;return L[Math.floor(rng()*L.length)];};

/* ---------- the bots ---------- */
const NAMES=['Hale','Okoro','Vance','Reyes','Kincaid','Sato','Brandt','Ivers','Calder','Moreau','Quill','Dace','Ferro','Lark','Navarro','Soren','Abara','Teague','Lindqvist','Marek','Oduya','Pell','Rourke','Vasquez'];
const BOTS=[];
const EYE=1.5;
// the soldiers' flashlight beam: an open cone, bright at the lamp and fading out along its length
const LAMP_GEO=(()=>{if(!CFG.flashlights)return null;const L=11,g=new THREE.ConeGeometry(1.9,L,18,4,true).rotateX(Math.PI/2).translate(0,0,-L/2),P=g.attributes.position,cols=[];
  for(let i=0;i<P.count;i++){const k=Math.pow(1-clamp(-P.getZ(i)/L,0,1),1.6);cols.push(k,k*.96,k*.88);}g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));return g;})();
const LAMP_MAT=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:true});
function makeBot(team,i){const H=makeHuman('marine');scene.add(H.root);const T0=TEAMS[team];
  MODELS.dress(H,'keeper-footsoldier',{tint:T0.tint});
  const RIG=MODELS.RIGS['keeper-footsoldier']||{h:1.9};
  const B={H,pos:H.root.position,team,name:NAMES[(i+(team==='red'?12:0))%NAMES.length],scale:RIG.h/1.9,unit:'footsoldier',wpn:'rifle',spec:'ar',
    ...DMG.pool(DMG.STD,DMG.REGEN.npc),yaw:0,cool:R(.3,1),mag:DMG.GUN.ar.mag,rld:0,target:null,retarget:0,goal:null,goalT:0,side:i%2?1:-1,speed:R(4.2,4.8),
    respT:0,counted:false,deco:[],strafe:0,strafeT:0,seenAt:null,lastShotBy:null,isBot:true};
  // the side's lights on chest and back, and over your own side's heads a small mark (never over theirs)
  const gl=(x,y,z,s)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(T0.c).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.set(x,y,z);sp.scale.setScalar(s);H.root.add(sp);B.deco.push(sp);};
  gl(0,1.42,-.2,.32);gl(0,1.45,.22,.4);gl(-.24,1.58,0,.18);gl(.24,1.58,0,.18);
  // Rainveil (Oct 30): every soldier carries a flashlight, a pale cone along his aim that shows where he is in the dark
  if(CFG.flashlights){const lamp=new THREE.Group();lamp.position.set(.16,1.38,-.28);const cone=new THREE.Mesh(LAMP_GEO,LAMP_MAT);lamp.add(cone);
    const lens=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xfff1d8).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));lens.scale.setScalar(.45);lamp.add(lens);
    H.root.add(lamp);B.deco.push(lamp);B.lamp=lamp;}
  if(team===TEAM_YOU){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#'+T0.c.toString(16).padStart(6,'0');x.strokeStyle='rgba(0,0,0,.7)';x.lineWidth=5;x.beginPath();x.moveTo(10,14);x.lineTo(54,14);x.lineTo(32,50);x.closePath();x.stroke();x.fill();
    const mk=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),sizeAttenuation:false,depthWrite:false,depthTest:false,transparent:true,toneMapped:false}));mk.scale.setScalar(.022);mk.position.y=2.45;mk.renderOrder=6;H.root.add(mk);B.deco.push(mk);B.mk=mk;}
  const sp=pickSpawn(team);B.pos.set(sp.x+R(-2,2),0,sp.z+R(-2,2));B.pos.y=groundY(B.pos.x,B.pos.z);
  BOTS.push(B);if(team===TEAM_FOE)ENEMIES.push(B);   // the other side is what your guns, rockets, grenades and hogs find (js/origin/03-play.js)
  return B;}
for(let i=0;i<BOTS_PER_SIDE;i++){if(i<BOTS_PER_SIDE-1)makeBot(TEAM_YOU,i);makeBot(TEAM_FOE,i);}   // (blue: you and the rest)
// damage to a bot from another bot or a craft: the other side's bots go through hurtEnemy (so a kill there counts as theirs, not yours)
function hurtBot(B,dmg,how,byTeam){if(B.H.dead||B.respT>0)return;B.lastShotBy=byTeam;
  if(B.team===TEAM_FOE){hurtEnemy(B,dmg,how||'');return;}
  DMG.hit(B,dmg,T);hitHuman(B.H);B.flinch=.15;if(B.hp<=0){killHuman(B.H);for(const o of B.deco)o.visible=false;boom(B.pos.clone().add(V3(0,1.2,0)),1.6,TEAMS[B.team].c,.5);if(typeof sfx!=='undefined')sfx.trooperDown&&sfx.trooperDown(B.pos);}}
// who a bot (or an AI craft) can go after: the other side's bots, and you when you're theirs
function foesOf(team){const L=[];for(const B of BOTS)if(B.team!==team&&!B.H.dead&&B.respT<=0)L.push(B);
  if(typeof MPHOG!=='undefined')for(const S of MPHOG.foes(team))L.push(S);   // (the other side's AI warthogs)
  if(team!==TEAM_YOU&&P.alive&&phase==='play'&&!(VEH.flying&&P.pos.y-groundY(P.pos.x,P.pos.z)>50))L.push({pos:P.pos,player:true,H:P.H});return L;}
// shelter: inside your own dome, the other side can't touch you
const sheltered=(p,team)=>{const B=baseOf(team);return GS.inDome(B,{x:p.x,y:p.y+1,z:p.z});};
// the bot's pick of a place to go when it has nothing in sight: toward where the other side was last seen, a high place, or across the island
const HIGH=[...GS.HILLS.map(h=>({x:h.x,z:h.z})),{x:0,z:40},...GS.TERR.filter((t,i)=>i%2===0).map(t=>({x:t.I.P[t.hi][0]*.7+t.I.cx*.3,z:t.I.P[t.hi][1]*.7+t.I.cz*.3}))];
function roamGoal(B){const r=rng(),own=baseOf(B.team),foe=baseOf(B.team===TEAM_YOU?TEAM_FOE:TEAM_YOU);let g=null;
  if(r<.45){const F=foesOf(B.team).filter(f=>!sheltered(f.pos,f.player?TEAM_YOU:f.team));if(F.length){const f=F[Math.floor(rng()*F.length)];g={x:f.pos.x+R(-25,25),z:f.pos.z+R(-25,25)};}}
  // (Oct 30) half the time "high" means up a building now: a tower top, a keep's roof, a hall's, the far end of a bridge
  const PR=GS.nav.perches;if(!g&&r<.75&&PR.length&&rng()<.55){const n=GS.nav.nodes[PR[Math.floor(rng()*PR.length)]];if(!GS.inDome(foe,{x:n.x,y:foe.y,z:n.z})){const v=V3(n.x,n.y,n.z);v.perch=true;return v;}}
  if(!g&&r<.75){const h=HIGH[Math.floor(rng()*HIGH.length)];g={x:h.x+R(-8,8),z:h.z+R(-8,8)};}
  if(!g){const u=R(.35,.75),w=GS.HALF*.42;g={x:lerp(own.x,foe.x,u)+R(-w,w),z:lerp(own.z,foe.z,u)+R(-w,w)};}
  for(let k=0;k<12&&(GS.playD(g.x,g.z)>-1.5||GS.inDome(foe,{x:g.x,y:foe.y,z:g.z}));k++){g.x+=R(-30,30);g.z+=R(-30,30);g.x=clamp(g.x,-(GS.HALF-20),GS.HALF-20);g.z=clamp(g.z,-(GS.HALF-20),GS.HALF-20);}
  return V3(g.x,groundY(g.x,g.z),g.z);}
/* Oct 30: the way there, on every level. A bot heads straight for where it wants to be when that's on its own level and it can walk
   there; otherwise node to node along the graph (js/mp/01-world.js NAV), keeping to the node it chose until it gets there (half way
   up a flight it belongs to neither floor, so it doesn't ask again until it's at the top) */
function navStep(B,want,dt,out){const N=GS.nav,p=B.pos,ty=want.y==null?GS.floorY3(want.x,want.z,GS.terrH(want.x,want.z)+.3):want.y;
  B.navT=(B.navT||0)-dt;B.wpT=(B.wpT||0)+dt;B.noDirect=Math.max(0,(B.noDirect||0)-dt);
  // stuck (hardly moved in 3 s with somewhere to go): the straight line it thought was clear isn't, so the graph for a while
  B.nsT=(B.nsT||0)+dt;if(B.nsT>3){B.nsT=0;if(B.nsP&&Math.hypot(p.x-B.nsP.x,p.z-B.nsP.z)<1.2&&Math.hypot(want.x-p.x,want.z-p.z)>4){B.noDirect=8;if(B.wp===-1||B.wpT>3)B.wp=null;}(B.nsP||(B.nsP=p.clone())).copy(p);}
  const reached=k=>{const n=N.nodes[k];return Math.hypot(n.x-p.x,n.z-p.z)<(n.up?n.r||1.6:5)&&Math.abs(n.y-p.y)<(n.up?1.3:3)&&(!n.up||N.clear3(p.x,p.z,p.y,n.x,n.z,n.y,.3));};   // (and on the right side of any wall or hole)   // (a street node is a crossing; a stair's foot is a spot)
  const hop=(from)=>{const b=N.nearest(want.x,want.z,ty);if(b<0||from===b)return -1;const nx=N.NEXT[b*N.N+from];return nx<0?-1:nx;};
  if(B.navT<=0){B.navT=R(.35,.5);const d=Math.hypot(want.x-p.x,want.z-p.z);
    if(B.noDirect<=0&&Math.abs((ty-GS.terrH(want.x,want.z))-(p.y-GS.terrH(p.x,p.z)))<1.2&&d<90&&N.clear3(p.x,p.z,p.y,want.x,want.z,ty,.45)){B.wp=-1;}
    else if(B.wp==null||B.wp<0||B.wpT>9){const a=N.nearest(p.x,p.z,p.y),was=B.wp;B.wpT=0;
      if(a<0)B.wp=-1;else if(reached(a)||a===was){B.wp=hop(a);}else B.wp=a;}   // (stuck short of the same node twice: on to the next)
    else if(N.nodes[B.wp].up&&!N.clear3(p.x,p.z,p.y,N.nodes[B.wp].x,N.nodes[B.wp].z,N.nodes[B.wp].y,.3)&&B.wpT>1.5){const a=N.nearest(p.x,p.z,p.y);if(a>=0&&a!==B.wp){B.wp=a;B.wpT=0;}}   // (can't walk straight to it from here: back to a node it can)
    else if(!N.nodes[B.wp].up){const nx=hop(B.wp);if(nx>=0&&!N.nodes[nx].up&&N.clear(p.x,p.z,N.nodes[nx].x,N.nodes[nx].z,.5))B.wp=nx;}}   // (out on the streets: cut corners)
  if(B.wp!=null&&B.wp>=0&&reached(B.wp)){B.wp=hop(B.wp);B.wpT=0;}
  if(B.wp==null||B.wp<0)return out.set(want.x-p.x,0,want.z-p.z);
  const n=N.nodes[B.wp];return out.set(n.x-p.x,0,n.z-p.z);}
const BOT_HIT=.36,BOT_DMG=18;
const youDmg=()=>({easy:6,hard:11,insane:16})[DMG.level()]||11;   // a bot's hit on you, by threat level
function botShot(B,tg,d){const from=muzzle(B.H),to=_mm.copy(tg.pos).add(_mn.set(0,tg.player?(P.crouch?.95:1.3):1.35,0)).clone();
  const hit=rng()<(tg.player?DMG.hitChance():BOT_HIT*clamp(1.15-d/110,.35,1));
  if(!hit)to.add(_mn.set(R(-1.6,1.6),R(-.6,1.2),R(-1.6,1.6)));
  let end=shotEnd(from,to),cut=shotEnd.cut;const col=TEAMS[B.team].c;{const k=GS.s3Frac(from,end);if(k<1){end=from.clone().lerp(end,Math.max(0,k-.01));cut=true;}}boom(from,.35,col,.06);
  fire(from,end,150,B.team==='red'?'krifleR':'krifle',q=>{boom(q,.6,col,.2);if(cut||!hit){puff(q,.5,.5);return;}
    if(tg.player)hurtPlayer(youDmg(),B.pos,true);else if(tg.hog)MPHOG.hurt(tg,BOT_DMG*.8,B.team);else hurtBot(tg,BOT_DMG,'',B.team);});}
BK.krifleR={len:2.2,w:.06,head:.7,col:0xffc8c0,bc:0xff5a4a};boltMats.krifleR=new THREE.MeshBasicMaterial({color:C(0xff5a4a).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
function updateBots(dt){
  const live=BOTS.filter(B=>!B.H.dead);separate(live,.5);
  for(const B of BOTS){
    if(B.H.dead){poseHuman(B.H,dt,0,0);if(!B.counted){B.counted=true;B.respT=RESPAWN_T+R(0,2);scoreKill(B.team===TEAM_YOU?TEAM_FOE:TEAM_YOU,B);}
      B.respT-=dt;if(B.respT<=0)respawnBot(B);continue;}
    DMG.tick(B,dt,T);
    // a target: the nearest of theirs it can see, out to 110 m (not inside their own dome)
    B.retarget-=dt;if(B.retarget<=0){B.retarget=R(.35,.7);const eye=_mm.copy(B.pos).setY(B.pos.y+EYE),cand=[];
      for(const F of foesOf(B.team)){const d=F.pos.distanceTo(B.pos),see=F.player&&CFG.flashlights?CFG.see*(typeof LIGHT!=='undefined'&&LIGHT.on?1.3:.75):CFG.see;   // (in the dark your own light gives you away)
        if(d<see&&!sheltered(F.pos,F.player?TEAM_YOU:F.team))cand.push([d,F]);}cand.sort((a,b)=>a[0]-b[0]);B.target=null;
      for(let k=0;k<Math.min(4,cand.length);k++){const F=cand[k][1];if(!blocked(eye,_mn.copy(F.pos).setY(F.pos.y+1.4))){B.target=F;B.seenAt=F.pos.clone();break;}}}
    const tg=B.target&&!(tg_dead(B.target))?B.target:null;if(!tg)B.target=null;
    let speed=0,aim=0,want=null;
    if(tg){const d=tg.pos.distanceTo(B.pos);aim=1;
      if(d>CFG.hold&&!(B.dwell>0&&d<CFG.range))want=tg.pos;                                  // (up on a perch with them in range: holds it and shoots)                                                       // close in
      else{B.strafeT-=dt;if(B.strafeT<=0){B.strafeT=R(.8,2);B.strafe=rng()<.3?0:(rng()<.5?-1:1);}   // at range: hold, side-stepping
        if(B.strafe){const sx=-(tg.pos.z-B.pos.z)/d*B.strafe,sz=(tg.pos.x-B.pos.x)/d*B.strafe;want=_mm.set(B.pos.x+sx*4,B.pos.y,B.pos.z+sz*4).clone();}}
      B.yaw=Math.atan2(-(tg.pos.x-B.pos.x),-(tg.pos.z-B.pos.z));
      // the assault rifle: 4 a second, 40 rounds, a 4 s reload
      const S=DMG.GUN.ar;if(B.rld>0){B.rld-=dt;if(B.rld<=0)B.mag=S.mag;}else if(d<CFG.range){B.cool-=dt;if(B.cool<=0){B.cool+=1/S.rps;botShot(B,tg,d);B.mag--;if(B.mag<=0)B.rld=S.reload;}}}
    else{B.goalT-=dt;B.cool=Math.max(B.cool,R(.2,.5));
      const at=B.goal&&Math.hypot(B.goal.x-B.pos.x,B.goal.z-B.pos.z)<(B.goal.perch?2.2:6)&&Math.abs(B.goal.y-B.pos.y)<2;
      if(at&&B.goal.perch&&!B.dwelt){B.dwelt=true;B.dwell=R(7,16);}            // up on a perch: stays a while, watching the ground
      if(B.dwell>0){B.dwell-=dt;B.yaw+=Math.sin(T*.7+B.side)*dt*.9;}
      else{if(!B.goal||B.goalT<=0||at){B.goal=B.seenAt&&rng()<.6?B.seenAt.clone():roamGoal(B);B.seenAt=null;B.goalT=R(30,55);B.dwelt=false;B.wp=null;}want=B.goal;}}
    if(want){navStep(B,want,dt,_mn);const L=_mn.length();if(L>.1){_mn.multiplyScalar(1/L);steer(B.pos,_mn,.45,B.side);unstick(B,dt,true,_mn);
      speed=(tg?(B.strafe&&!(tg.pos.distanceTo(B.pos)>CFG.hold)?2.8:B.speed):Math.hypot(want.x-B.pos.x,want.z-B.pos.z)>40?6.8:B.speed)*((B.flinch||0)>0?.4:1);const ox=B.pos.x,oz=B.pos.z;moveBody(B.pos,_mn.x*speed*dt,_mn.z*speed*dt,.45);
      // up on a floor, a roof or a bridge, a bot doesn't walk off its edge or down into a stair hole: it leaves a level only by the
      // flight or bridge its path takes (the level it's keeping to: the next node's, or where it's headed when that's on its level)
      {const w=B.wp!=null&&B.wp>=0?GS.nav.nodes[B.wp]:null;let lv=null;if(w&&w.up)lv=w.y;else if(B.wp===-1&&want.y-GS.terrH(want.x,want.z)>2&&Math.abs(want.y-B.pos.y)<1.2)lv=want.y;
       if(lv!=null){const f=GS.floorY3(B.pos.x,B.pos.z,B.pos.y);if(f<lv-.5&&f<B.pos.y-.02){B.pos.x=ox;B.pos.z=oz;}}}if(!tg)B.yaw=Math.atan2(-_mn.x,-_mn.z);}}
    B.flinch=Math.max(0,(B.flinch||0)-dt);keepIn(B.pos);
    // the other side's dome: pushed back out of it
    for(const Bs of GS.BASES){if(Bs.team===B.team)continue;const dx=B.pos.x-Bs.x,dz=B.pos.z-Bs.z,d=Math.hypot(dx,dz);if(d<Bs.shieldR+1){B.pos.x=Bs.x+dx/d*(Bs.shieldR+1.2);B.pos.z=Bs.z+dz/d*(Bs.shieldR+1.2);B.goal=null;}}
    {const f=GS.floorY3(B.pos.x,B.pos.z,B.pos.y);   // (Oct 30: storeys and bridges: the floor under him, not just the ground; off an edge, he falls)
     if(f<B.pos.y-.7||(B.vy>0&&f<B.pos.y-.05)){B.vy=(B.vy||0)+22*dt;B.pos.y=Math.max(f,B.pos.y-B.vy*dt);}else{B.vy=0;B.pos.y=f;}}
    B.H.aimPitch=tg?clamp(Math.atan2(tg.pos.y+1.2-(B.pos.y+EYE),Math.hypot(tg.pos.x-B.pos.x,tg.pos.z-B.pos.z)),-.6,.6):0;if(B.lamp)B.lamp.rotation.x=lerp(B.lamp.rotation.x,B.H.aimPitch-(tg?0:.18),1-Math.exp(-dt*8));
    B.H.root.rotation.y=angLerp(B.H.root.rotation.y,B.yaw,1-Math.exp(-dt*10));poseHuman(B.H,dt,speed,aim,speed>5);}}
function tg_dead(t){return t.player?!P.alive:(t.H.dead||t.respT>0);}
function respawnBot(B){const sp=pickSpawn(B.team);reviveHuman(B.H);DMG.refill(B);B.H.root.visible=true;B.H.root.rotation.set(0,0,0);for(const o of B.deco)o.visible=true;
  B.pos.set(sp.x+R(-1.5,1.5),0,sp.z+R(-1.5,1.5));B.pos.y=groundY(B.pos.x,B.pos.z);B.respT=0;B.counted=false;B.target=null;B.goal=null;B.wp=null;B.vy=0;B.dwell=0;B.noDirect=0;B.mag=DMG.GUN.ar.mag;B.rld=0;B.gone=0;
  B.yaw=Math.atan2(-baseOf(B.team).fx,-baseOf(B.team).fz);}
// the AI craft: what they strafe on the ground, and their hits
MPAIR.groundFoe=(team,pos)=>{const F=foesOf(team).filter(f=>!sheltered(f.pos,f.player?TEAM_YOU:f.team));if(!F.length)return null;let best=null,bd=1e9;for(const f of F){const d=f.pos.distanceTo(pos)*(.6+rng()*.8);if(d<bd){bd=d;best=f;}}return{pos:best.pos,bot:best.player?null:best,player:!!best.player};};
MPAIR.onStrafe=(t,team)=>{if(t.player)hurtPlayer(youDmg()*1.6,null,true);else if(t.bot&&t.bot.hog)MPHOG.hurt(t.bot,40,team);else if(t.bot)hurtBot(t.bot,30,'',team);};
MPAIR.onBlast=(p,team,r,dmg)=>{for(const B of BOTS){if(B.team===team||B.H.dead)continue;const d=B.pos.distanceTo(p);if(d<r)hurtBot(B,dmg*(1-d/r*.6),team===TEAM_YOU?'rocket':'',team);}
  if(team!==TEAM_YOU&&P.alive&&P.pos.distanceTo(p)<r)hurtPlayer(dmg*.5*(1-P.pos.distanceTo(p)/r),p,true);
  if(typeof MPHOG!=='undefined')MPHOG.blast(p,team,r,dmg);};
/* Oct 30 (Bryce: "make it so you can lock the missiles onto the individuals as well"): what your craft's missiles can lock on the
   ground: the other side's soldiers and their AI warthogs. A missile that reaches one lands its full weight on it, then bursts */
MPAIR.groundLocks=team=>{const L=[],z=_mz;for(const B of BOTS)if(B.team!==team&&!B.H.dead&&B.respT<=0&&!sheltered(B.pos,B.team))L.push({pos:B.pos,vel:z,r:1,ref:B});
  if(typeof MPHOG!=='undefined')for(const S of MPHOG.foes(team))L.push({pos:S.c,vel:z,r:2.6,ref:S});return L;};
MPAIR.onGroundHit=(t,p,team)=>{if(t.hog)MPHOG.hurt(t,260,team,team===TEAM_YOU);else if(t.H)hurtBot(t,400,team===TEAM_YOU?'rocket':'',team);MPAIR.onBlast(p,team,8,120);};
MPAIR.onKill=(byTeam,victim)=>{if(byTeam)scoreKill(byTeam,null,'craft');if(byTeam===TEAM_YOU)PG.prog('mpair');};

/* ---------- the engine's hooks ---------- */
// the bots find their way on the street lattice: straight there when the way is clear, else node to node
navToward=function(px,pz,tx,tz,out){const N=GS.nav,d=Math.hypot(tx-px,tz-pz);
  if(d<140&&N.clear(px,pz,tx,tz,.5))return out.set(tx-px,0,tz-pz);
  const a=N.nearest(px,pz),b=N.nearest(tx,tz);if(a<0||b<0)return out.set(tx-px,0,tz-pz);
  if(a===b){const n=N.nodes[a];return Math.hypot(n.x-px,n.z-pz)>5?out.set(n.x-px,0,n.z-pz):out.set(tx-px,0,tz-pz);}
  const nx=N.NEXT[b*N.N+a];if(nx<0)return out.set(tx-px,0,tz-pz);
  const A=N.nodes[a],Nn=N.nodes[nx];
  if(Math.hypot(A.x-px,A.z-pz)<7||N.clear(px,pz,Nn.x,Nn.z,.5))return out.set(Nn.x-px,0,Nn.z-pz);
  return out.set(A.x-px,0,A.z-pz);};
{const hp=hurtPlayer;hurtPlayer=function(dmg,from,exact){if(MPAIR.flying()){MPAIR.hurtYou(dmg,from,exact);return;}if(sheltered(P.pos,TEAM_YOU))return;return hp.apply(this,arguments);};}
playerDown=function(){if(!P.alive)return;P.alive=false;P.hp=0;P.respawnT=RESPAWN_T;killHuman(P.H);fireHeld=false;P.adsHeld=false;
  if(VEH.cur)VEH.exit(true);{const sp=pickSpawn(TEAM_YOU);P.spawn.set(sp.x,0,sp.z);}scoreKill(TEAM_FOE,null,'you');banner('You are down · back in at your base in '+RESPAWN_T+' s','alert');};
{const pu=playerUp;playerUp=function(){pu();refillAll();P.nades=Math.max(P.nades,NADE_START);P.H.root.visible=true;const B=baseOf(TEAM_YOU);P.yaw=Math.atan2(-B.fx,-B.fz);P.pitch=-.05;};}
{const he=hurtEnemy;hurtEnemy=function(E,dmg,how,zone){if(how&&E&&!E.H.dead)E.lastShotBy='you';return he.apply(this,arguments);};}
{const ua=useAction;useAction=function(){if(MPAIR.use())return;return ua.apply(this,arguments);};}
// your shots stop at the domes (theirs and your own)
function domeCut(o,p){let best=1;for(const B of GS.BASES){const ino=GS.inDome(B,o),inp=GS.inDome(B,p);if(ino===inp)continue;
  // where the segment o→p crosses the sphere
  const dx=p.x-o.x,dy=p.y-o.y,dz=p.z-o.z,fx=o.x-B.x,fy=o.y-B.y,fz=o.z-B.z,a=dx*dx+dy*dy+dz*dz,b=2*(fx*dx+fy*dy+fz*dz),c=fx*fx+fy*fy+fz*fz-B.shieldR*B.shieldR,disc=b*b-4*a*c;if(disc<0)continue;
  const s=Math.sqrt(disc);for(const t of[(-b-s)/(2*a),(-b+s)/(2*a)])if(t>0&&t<best){best=t;B._hitAt=_mm.set(o.x+dx*t,o.y+dy*t,o.z+dz*t).clone();domeHit(B,B._hitAt);}}
  return best;}
function domeHit(B,p){const V=BASEVIS.find(v=>v.B===B);if(!V)return;V.dm.uniforms.hitP.value.copy(p);V.dm.uniforms.hitT.value=0;}
{const ar=aimRay;aimRay=function(maxD,spread){const A=ar.call(this,maxD,spread);const o=camera.position,k=Math.min(domeCut(o,A.p),GS.s3Frac(o,A.p));if(k<1){A.p=o.clone().lerp(A.p,k-.002);A.hit=null;A.dist*=k;}return A;};}   // (your shots stop at the domes, and at the halls' walls, floors and bridges)
// rockets and grenades that reach a dome burst on it
function domeProjectiles(dt){const crossDome=(p,q)=>GS.BASES.some(B=>GS.inDome(B,p)!==GS.inDome(B,q));
  for(let i=ROCKETS.length-1;i>=0;i--){const Rk=ROCKETS[i],p=Rk.m.position,nx=_mn.copy(p).addScaledVector(Rk.v,dt).clone();
    if(crossDome(p,nx)){domeCut(p,nx);scene.remove(Rk.m);ROCKETS.splice(i,1);boom(p.clone(),4,0xfff0c0,.35);puff(p.clone(),2,1.2);continue;}
    const k=GS.s3Frac(p,nx);if(k<1){const q=p.clone().lerp(nx,Math.max(0,k-.02));scene.remove(Rk.m);ROCKETS.splice(i,1);rocketBlast(q);}}   // (a wall, a floor, a bridge: it bursts there)
  for(let i=NADES.length-1;i>=0;i--){const N=NADES[i],p=N.m.position,nx=_mn.copy(p).addScaledVector(N.v,dt).clone();if(crossDome(p,nx)){domeCut(p,nx);N.v.multiplyScalar(-.3);}else if(GS.s3Frac(p,nx)<1){N.v.x*=-.35;N.v.z*=-.35;}}}
// the player's hog can't drive into their dome either
function keepOutDome(dt){const B=baseOf(TEAM_FOE),V=VEH.cur,p=V?V.g.position:P.pos,dx=p.x-B.x,dz=p.z-B.z,d=Math.hypot(dx,dz),m=B.shieldR+(V?3:1);
  if(d<m&&!MPAIR.flying()){p.x=B.x+dx/d*m;p.z=B.z+dz/d*m;if(V){V.v*=-.3;V.ob.x=p.x;V.ob.z=p.z;P.pos.set(p.x,p.y,p.z);}if(T-(keepOutDome.t||-9)>2){keepOutDome.t=T;banner('Their dome · nothing gets through it','alert');domeHit(B,V3(p.x,p.y+1,p.z));}}}

/* ---------- the score ---------- */
const SB=(()=>{const st=document.createElement('style');st.textContent=`
.mpsb{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 80px);transform:translateX(-50%);z-index:3;pointer-events:none;display:flex;align-items:center;gap:10px;font:700 15px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.12em;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.8)}
.mpsb .t{min-width:58px;padding:3px 10px;text-align:center;border-radius:3px;background:rgba(8,12,20,.45);clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)}
.mpsb .t b{font-size:20px}.mpsb .blue{box-shadow:inset 0 -3px #3f8cff}.mpsb .red{box-shadow:inset 0 -3px #ff4a3a}.mpsb .clk{font:600 12px 'JetBrains Mono',monospace;color:#e8f0ff;opacity:.9;min-width:44px;text-align:center}
.mpsb .lim{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:3px;font:600 9px 'JetBrains Mono',monospace;letter-spacing:.2em;color:rgba(255,255,255,.6);white-space:nowrap}
body.mpfly .mpsb{top:calc(env(safe-area-inset-top,0px) + 92px)}
.mpfeed{position:fixed;right:calc(env(safe-area-inset-right,0px) + 14px);top:calc(env(safe-area-inset-top,0px) + 64px);z-index:3;pointer-events:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px;font:600 11px 'JetBrains Mono',monospace;text-shadow:0 1px 4px #000}
.mpfeed div{padding:2px 8px;background:rgba(8,12,20,.42);border-radius:2px;transition:opacity .6s}.mpfeed .blue{color:#9cc4ff}.mpfeed .red{color:#ff9e92}.mpfeed .x{color:#fff;opacity:.6;margin:0 6px}
.mpres{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:3;pointer-events:none;text-align:center;font:700 13px 'Chakra Petch',sans-serif;letter-spacing:.28em;color:#fff;text-shadow:0 2px 10px #000}
.mpres b{display:block;font-size:44px;letter-spacing:.06em}
.mptitle{position:fixed;left:0;right:0;bottom:16%;z-index:4;pointer-events:none;text-align:center;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.6);transition:opacity 1s}
.mptitle b{display:block;font:700 clamp(34px,7vw,72px) 'Chakra Petch',sans-serif;letter-spacing:.24em}.mptitle span{font:600 12px 'JetBrains Mono',monospace;letter-spacing:.32em;opacity:.85}
.mptitle small{display:block;margin-top:14px;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.2em;opacity:.6}
@media (pointer:coarse){.mpfeed{top:calc(env(safe-area-inset-top,0px) + 96px);font-size:10px}.mpsb{top:calc(env(safe-area-inset-top,0px) + 76px);font-size:13px}.mpsb .t b{font-size:16px}}`;document.head.appendChild(st);
  const el=document.createElement('div');el.className='mpsb';el.hidden=true;el.innerHTML=`<div class="t blue"><b>0</b></div><div class="clk">12:00</div><div class="t red"><b>0</b></div><div class="lim">FIRST TO ${SCORE_LIMIT}</div>`;document.body.appendChild(el);
  const feed=document.createElement('div');feed.className='mpfeed';document.body.appendChild(feed);
  const res=document.createElement('div');res.className='mpres';res.hidden=true;document.body.appendChild(res);
  return{el,feed,res,b:el.querySelector('.blue b'),r:el.querySelector('.red b'),clk:el.querySelector('.clk')};})();
function feedLine(html){const d=document.createElement('div');d.innerHTML=html;SB.feed.prepend(d);while(SB.feed.children.length>5)SB.feed.lastChild.remove();setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),700);},5000);}
const tn=t=>`<span class="${t}">${TEAMS[t].name}</span>`;
function scoreKill(team,victim,kind){if(phase!=='play')return;SCORE[team]++;SB.b.textContent=SCORE.blue;SB.r.textContent=SCORE.red;
  const vt=team===TEAM_YOU?TEAM_FOE:TEAM_YOU;
  if(kind==='you')feedLine(`${tn(TEAM_FOE)}<span class="x">✕</span><span class="blue">you</span>`);
  else if(kind==='craft')feedLine(`${tn(team)}<span class="x">✕</span><span class="${vt}">${TEAMS[vt].name} craft</span>`);
  else if(kind==='hog')feedLine(`<span class="${team}">${victim&&victim.byYou?'you':TEAMS[team].name}</span><span class="x">✕</span><span class="${vt}">${TEAMS[vt].name} warthog</span>`);
  else if(victim){const who=victim.lastShotBy==='you'?'you':TEAMS[team].name;feedLine(`<span class="${team}">${who==='you'?'you':who}</span><span class="x">✕</span><span class="${victim.team}">${victim.name}</span>`);}
  if(SCORE[team]>=SCORE_LIMIT)endMatch();}

/* ---------- the opening: a sweep over the island from the sea, the map's name, then you're in ---------- */
let introT=-1,introEl=null;
const IK=GS.HALF/750,INTRO_K=GS.INTRO?GS.INTRO.map(([a,b])=>[V3(...a),V3(...b)]):[[V3(-1200*IK,110,1100*IK),V3(-300*IK,20,300*IK)],[V3(-700*IK,70,420*IK),V3(0,16,0)],[V3(300*IK,52,-180*IK),V3(520*IK,8,-540*IK)],[V3(-520*IK,22,650*IK),V3(-560*IK,6,560*IK)]];
function startIntro(){introT=0;phase='intro';P.input=false;P.H.root.visible=false;
  introEl=document.createElement('div');introEl.className='mptitle';introEl.innerHTML=`<b>${CFG.name}</b><span>TEAM DEATHMATCH · ${TEAMS.blue.name} AGAINST ${TEAMS.red.name} · FIRST TO ${SCORE_LIMIT}</span><small>${coarse?'TAP':'CLICK OR PRESS ANY KEY'} TO SKIP</small>`;document.body.appendChild(introEl);
  const skip=()=>{if(phase==='intro')introT=99;};addEventListener('keydown',skip,{once:true});addEventListener('pointerdown',skip,{once:true});}
function updateIntro(dt){introT+=dt;const D=11,u=clamp(introT/D,0,1),n=INTRO_K.length-1,s=Math.min(n-1e-6,u*n),i=Math.floor(s),f=sstep(0,1,s-i);
  camera.position.lerpVectors(INTRO_K[i][0],INTRO_K[i+1][0],f);_mm.lerpVectors(INTRO_K[i][1],INTRO_K[i+1][1],f);camera.lookAt(_mm);
  if(introEl)introEl.style.opacity=u<.08?u/.08:u>.85?(1-u)/.15:1;
  if(introT>=D){if(introEl){introEl.remove();introEl=null;}beginPlay();}}
function beginPlay(){phase='play';matchT=0;P.input=true;P.alive=true;P.H.root.visible=true;const sp=pickSpawn(TEAM_YOU),B=baseOf(TEAM_YOU);P.pos.set(sp.x,groundY(sp.x,sp.z),sp.z);P.spawn.copy(P.pos);
  P.yaw=Math.atan2(-B.fx,-B.fz);P.pitch=-.05;SB.el.hidden=false;
  if(window.goalPop)goalPop('Team deathmatch','First to '+SCORE_LIMIT+(CFG.vehicles?' · hogs and craft at your base':' · on foot'));}

/* ---------- the end ---------- */
function endMatch(){if(phase!=='play')return;phase='end';P.input=false;fireHeld=false;
  const won=SCORE[TEAM_YOU]>SCORE[TEAM_FOE],tie=SCORE[TEAM_YOU]===SCORE[TEAM_FOE];if(won)PG.done('mpwin');
  SB.res.hidden=false;SB.res.innerHTML=`${tie?'DRAW':won?TEAMS[TEAM_YOU].name+' WINS':TEAMS[TEAM_FOE].name+' WINS'}<b>${SCORE.blue} · ${SCORE.red}</b>`;
  setTimeout(()=>{SB.res.hidden=true;try{if(document.exitPointerLock)document.exitPointerLock();}catch(_){}
    PG.finish({title:CFG.name+' · TEAM DEATHMATCH',text:`${tie?'A draw':won?'Blue takes it':'Red takes it'}, ${SCORE.blue} to ${SCORE.red}, in ${Math.floor(matchT/60)}:${String(Math.floor(matchT%60)).padStart(2,'0')}. Your kills: ${P.kills}. Threat level: ${DIFF.name}.`,
      buttons:[{text:'Play again',onClick:()=>location.reload(),primary:true},{text:'Menu',href:'index.html'}]});},3500);}

/* ---------- main loop ---------- */
let last=performance.now();
let frameErr=0;function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(!PG.paused){
    if(phase==='intro')updateIntro(dt);
    else if(phase==='play'||phase==='end'){
      if(phase==='play'){matchT+=dt;if(matchT>=TIME_LIMIT)endMatch();}
      if(MPAIR.flying())0;else{stepPlayer(dt);placeCamera();}
      keepOutDome(dt);}
    if(phase!=='brief'){updateBots(dt);updateHogs(dt);if(typeof MPHOG!=='undefined')MPHOG.update(dt);MPAIR.update(dt);domeProjectiles(dt);}
    updateNades(dt);updateRockets(dt);updateTurrets(dt);updateWall(dt);updateSentry(dt);updateZeal(dt);updatePicks(dt);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);PG.combat(phase==='play');
    for(const V of BASEVIS){V.dm.uniforms.uT.value=T;V.dm.uniforms.hitT.value+=dt;if(V.ring){V.ring.rotation.z+=dt*.6;V.tip.material.opacity=.7+.3*Math.sin(T*2.4);}}
    if(phase==='play'){const left=Math.max(0,TIME_LIMIT-matchT);SB.clk.textContent=Math.floor(left/60)+':'+String(Math.floor(left%60)).padStart(2,'0');}
  }else if(phase==='brief'){camera.position.set(-GS.HALF*1.25,90,GS.HALF*1.25);camera.lookAt(0,20,0);}
  if(window.VIEWTEST){camera.position.set(...VIEWTEST[0]);camera.lookAt(...VIEWTEST[1]);}   // (testing: a fixed camera)
  updateLights(dt,T,camera.position);
  skyFollow();followSun(phase==='play'?P.pos:camera.position);updateDust();if(phase==='play'||phase==='end'){updateHud(dt);if(coarse){const u=$('use'),c=MPAIR.canUse()&&P.alive&&P.input;if(c){u.hidden=false;u.textContent=MPAIR.flying()?'LAND':'FLY';}}}
  renderFrame();}
PG.briefing({title:CFG.name,text:CFG.brief+' Keepers against Keepers, blue against red, '+BOTS_PER_SIDE+' a side. First to '+SCORE_LIMIT+' kills, or the most when the clock runs out. Threat level: '+DIFF.name+'.',
  objective:CFG.objective,
  pc:CFG.vehicles||CFG.air?[['Mouse','Aim (click to lock, Esc releases)'],['Left click','Fire · in a craft: missiles'],['Right click','Aim down the sights (Z zooms a sniper 4x / 7x) · in a craft: guns'],['W A S D','Move · in a hog: gas (look to steer) · in a craft: throttle, slide'],['Shift','Sprint · boost'],
    ['1 2 or wheel','Primary, secondary · look at a gun on a rack to take it'],['E','Get in or out of a hog or a craft · pick up a gun · fill up at an ammo box'],['R','Reload'],['Space · Q','Jump · in a craft: up, down'],['3','Grenade'],['4 or middle click','Zeal'],['F','In a craft: missile']]:
    [['Mouse','Aim (click to lock, Esc releases)'],['Left click','Fire'],['Right click','Aim down the sights (Z zooms a sniper 4x / 7x)'],['W A S D','Move'],['Shift','Sprint'],['1 2 or wheel','Primary, secondary · look at a gun on a rack to take it'],['E','Pick up a gun · fill up at an ammo box'],['R','Reload'],['Space','Jump'],['3','Grenade'],['4 or middle click','Zeal'],['F','Flashlight on / off']],
  phone:CFG.vehicles||CFG.air?[['Drag (right side)','Aim · in a craft: steer'],['Left thumb','Move · throttle'],['FIRE','Fire (hold) · in a craft: guns'],['USE','Hogs and craft: in, out'],['MSL · BOOST','In a craft'],['Double-tap right','Aim down the sights · scoped: ZOOM for 4x / 7x'],['⇄','Next weapon'],['JUMP · CROUCH','Jump, crouch']]:
    [['Drag (right side)','Aim'],['Left thumb','Move'],['FIRE','Fire (hold)'],['Double-tap right','Aim down the sights · scoped: ZOOM for 4x / 7x'],['⇄','Next weapon'],['LIGHT','Flashlight on / off'],['JUMP · CROUCH','Jump, crouch']],
  onStart:()=>{const q=location.search;if(/[?&]skip=1/.test(q)){beginPlay();return;}startIntro();}});
requestAnimationFrame(frame);
window.INDOOR_AT=()=>0;
