/* Elyra · Recovered Footage 08 · Night Market (Nov 17 2026, Bryce: the Halo 3: ODST idea, the same city by day and by night).
   The test of it: the night after the battle for Tide City, a Keeper's helmet camera in the market district at the Spear's foot, in the
   rain. The Hollow's rearguard is still in the streets. Built on Midnight Market's block (js/mp/market-world.js: the roofs, the
   covered street, the alleys, the two towers and their skybridge) with the campaign's Hollow soldiers (js/origin/03-play.js) in place
   of TakeOver's bots (js/mp/03-match.js is not on this page). If it plays well, the market goes into the rebuilt Tide City level
   (docs: "ELYRA Level Plan · Decided: Tide City redo"): the day battle there, this at night.

     THE STREET   down off the west roof into the covered market: the Hollow picking through the stalls
     THE TOWERS   riflemen up on the towers either side of the skybridge, more coming in from the east end
     THE EAST END their commander and what's left, dug in round the far roof. Then the camera turns to the Spear, and the signal goes.

   The Hollow walk the street and the alleys (a lattice of the street-level spots only, below); the roofs are yours, and theirs only
   where a rifleman is put up there. Lines are placeholders (Bryce writes the script). */
let phase='brief';
function phaseFight(){return phase==='play';}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z),_fa=new THREE.Vector3();
const CFG={id:'tidenight',name:'NIGHT MARKET',sub:'Recovered footage · Tide City, the night after'};
PG.init(CFG.id,{challenges:[
  {id:'ftkills',text:'Down 25 of the Hollow',pts:2000,goal:25},
  {id:'ftclear',text:'Clear the market',pts:3000},
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
// a street spot in a stretch of the map, not too close to you
function streetSpot(x0,x1,away){for(let t=0;t<40;t++){const n=NAVG.nodes[Math.floor(rng()*NAVG.nodes.length)];if(n.x<x0||n.x>x1)continue;
  if(away&&Math.hypot(n.x-P.pos.x,n.z-P.pos.z)<away)continue;return n;}return null;}
// a roof spot (the lattice's perches) in a stretch of the map, for a rifleman
function roofSpot(x0,x1){const L=GS.nav.perches.map(k=>GS.nav.nodes[k]).filter(n=>n.x>=x0&&n.x<=x1&&!USED.has(n));if(!L.length)return null;const n=L[Math.floor(rng()*L.length)];USED.add(n);return n;}
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

/* ---------- the fight: three rounds down the market, west to east ---------- */
const ROUNDS=[
  {name:'The street',goal:'Clear the market street',x:[-36,4],away:16,
   foot:6,heavy:1,commander:0,roof:0,
   say:[['Lantern Lead','Lantern Two, you\'re on the west roof. The Hollow left people behind in the market. Clear the street.',6]]},
  {name:'The towers',goal:'Take the towers',x:[-4,40],away:18,
   foot:6,heavy:1,commander:0,roof:2,roofX:[-14,14],
   say:[['Lantern Lead','Riflemen on the towers, either side of the bridge. More of them coming in from the east end.',6]]},
  {name:'The east end',goal:'Clear the east end',x:[22,56],away:16,
   foot:4,heavy:2,commander:1,roof:2,roofX:[30,56],
   say:[['Lantern Lead','That\'s their commander at the far end. Put him down and the market\'s ours.',5]]},
];
let round=-1,roundT=0,leftT=0,endT=-1,quietT=0,downs=0;
const ROUND_FOES=[];
function startRound(i){round=i;roundT=0;const RD=ROUNDS[i];ROUND_FOES.length=0;USED.clear();
  const put=(unit,n)=>{for(let k=0;k<n;k++){const s=streetSpot(RD.x[0],RD.x[1],RD.away);if(!s)continue;const E=spawnTrooper(s.x+R(-.4,.4),s.z+R(-.4,.4),{unit,hold:R(16,28)});if(E)ROUND_FOES.push(E);}};
  put('footsoldier',RD.foot);put('heavy',RD.heavy);put('commander',RD.commander);
  for(let k=0;k<(RD.roof||0);k++){const s=roofSpot(RD.roofX[0],RD.roofX[1]);if(!s)continue;const E=spawnTrooper(s.x,s.z,{perch:true,hold:999,unit:'footsoldier'});if(E){E.pos.y=s.y;E.H.root.position.y=s.y;ROUND_FOES.push(E);}}
  // you come back in where this round starts
  P.spawn.copy(P.pos);
  if(window.goalPop)goalPop(RD.goal,RD.name);else banner(RD.goal);
  for(const [w,t,d] of RD.say)PG.say(w,t,'',d);}
function foesLeft(){let n=0;for(const E of ROUND_FOES)if(!E.H.dead)n++;return n;}
// you go down: Lantern Lead pulls you back to where the round started
playerDown=function(){if(!P.alive)return;P.alive=false;P.hp=0;P.respawnT=5;downs++;killHuman(P.H);fireHeld=false;P.adsHeld=false;
  PG.say('Lantern Lead','Two\'s down! Get him up, get him off the street!','alert',4);banner('You are down · back in where this push started','alert');};
{const pu=playerUp;playerUp=function(){pu();refillAll();P.nades=Math.max(P.nades,typeof NADE_START!=='undefined'?NADE_START:3);P.H.root.visible=true;};}

/* ---------- the start: the title card, then the west roof ---------- */
const WEST=GS.BASES.find(b=>b.team==='blue')||{x:-50.5,z:0,y:4.5,fx:1,fz:0};
function beginPlay(){phase='play';P.input=true;P.alive=true;P.H.root.visible=true;
  P.pos.set(WEST.x+1.5,WEST.y,WEST.z);P.spawn.copy(P.pos);P.yaw=Math.atan2(-WEST.fx,-WEST.fz);P.pitch=-.08;
  FTG.show(true);FTG.date();setTimeout(()=>{if(phase==='play'&&round<0)startRound(0);},2500);}
function startTitle(){phase='title';P.input=false;FTG.title(beginPlay);}

/* ---------- the end: the last of them down, the camera turns to the Spear, the signal goes ---------- */
let turnFrom=null;
function endFootage(){phase='end';P.input=false;fireHeld=false;P.adsHeld=false;PG.done('ftclear');PG.combat(false);
  PG.say('Lantern Lead','Market\'s clear. Look at that, Two. She\'s still standing.','',5);
  turnFrom={yaw:P.yaw,pitch:P.pitch,t:0};
  setTimeout(()=>FTG.lost(()=>{try{if(document.exitPointerLock)document.exitPointerLock();}catch(_){}
    PG.finish({title:'RECOVERED FOOTAGE · NIGHT MARKET',text:`The market at the Spear's foot, the night after Tide City. ${P.kills} of the Hollow down${downs?', '+downs+' time'+(downs>1?'s':'')+' pulled back':''}. Threat level: ${DIFF.name}.`,
      buttons:[{text:'Play again',onClick:()=>location.reload(),primary:true},{text:'Menu',href:'index.html'}]});}),6500);}
function updateTurn(dt){if(!turnFrom||!SPR)return;turnFrom.t+=dt;const u=sstep(0,1,clamp(turnFrom.t/3.2,0,1));
  const sp=SPR.group.position,want=Math.atan2(-(sp.x-P.pos.x),-(sp.z-P.pos.z));let d=want-turnFrom.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));
  P.yaw=turnFrom.yaw+d*u;P.pitch=turnFrom.pitch+(.32-turnFrom.pitch)*u;}

/* ---------- main loop ---------- */
let last=performance.now(),frameErr=0;
function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(!PG.paused){
    if(phase==='play'||phase==='end'){stepPlayer(dt);if(phase==='end')updateTurn(dt);placeCamera();}
    if(phase==='play'&&round>=0){roundT+=dt;const n=foesLeft();
      if(n===0&&roundT>3){if(round<ROUNDS.length-1){quietT+=dt;if(quietT>4){quietT=0;startRound(round+1);}}else if(endT<0){endT=0;setTimeout(endFootage,2500);}}
      // the last couple of a round who've gone to ground: they come looking for you
      if(n>0&&n<=2&&roundT>40){leftT+=dt;if(leftT>8){leftT=0;for(const E of ROUND_FOES)if(!E.H.dead&&!E.perch){E.goal=P.pos.clone();E.hold=8;}}}else leftT=0;}
    if(phase!=='brief'&&phase!=='title')updateEnemies(dt);
    updateNades(dt);updateRockets(dt);updateTurrets(dt);updateWall(dt);updateSentry(dt);updateZeal(dt);updatePicks(dt);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);
    {let near=false;if(phase==='play')for(const E of ENEMIES)if(!E.H.dead&&!E.warm&&E.pos.distanceTo(P.pos)<48){near=true;break;}PG.combat(near);}
    FTG.tick(dt);
  }else if(phase==='brief'||phase==='title'){camera.position.set(WEST.x-6,WEST.y+4,WEST.z+3);camera.lookAt(0,4,0);}
  if(phase==='title'){camera.position.set(WEST.x-6,WEST.y+4,WEST.z+3);camera.lookAt(0,4,0);}
  if(SPR)SPR.tick(T,.6);
  updateLights(dt,T,camera.position);
  skyFollow();followSun(phase==='play'||phase==='end'?P.pos:camera.position);updateDust();if(phase==='play'||phase==='end')updateHud(dt);
  renderFrame();}
const FOOT_PC=[['Mouse','Aim (click to lock, Esc releases)'],['Left click','Fire'],['Right click','Aim down the sights (Z zooms a sniper 4x / 7x)'],['W A S D','Move'],['Shift','Sprint'],['1 2 or wheel','Primary, secondary · look at a gun on a rack to take it'],['E','Pick up a gun · walk up to an ammo box to fill up'],['R','Reload'],['Space','Jump'],['3','Grenade'],['4 or middle click','Zeal'],['F','Flashlight on / off']];
const FOOT_PHONE=[['Drag (right side)','Aim'],['Left thumb','Move'],['FIRE','Fire (hold)'],['Double-tap right','Aim down the sights · scoped: ZOOM for 4x / 7x'],['⇄','Next weapon'],['LIGHT','Flashlight on / off'],['JUMP · CROUCH','Jump, crouch']];
PG.briefing({title:'NIGHT MARKET',text:'Recovered footage. A Keeper\'s helmet camera in Tide City\'s market district at the Spear\'s foot, the night after the battle, in the rain. The Hollow left a rearguard in the streets. Threat level: '+DIFF.name+'.',
  objective:'Clear the market, west to east: the street, the towers, the east end.',
  pc:FOOT_PC,phone:FOOT_PHONE,
  onStart:()=>{if(/[?&]skip=1/.test(location.search)){beginPlay();return;}startTitle();}});
requestAnimationFrame(frame);
window.INDOOR_AT=GS.indoorAt||(()=>0);
