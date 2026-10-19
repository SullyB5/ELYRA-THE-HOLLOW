/* Tide City · combat: solid hulls, ship name/HP tags, interceptor missiles, points, objectives and the results card */

/* ---------- hulls: capital ships, raider frigates, the city flagship and the freighters are solid ---------- */
const CAPH=variants.map(V=>buildHull(V.geo,12,.9)),FLAGH=buildHull(FG.geo,14,.92),FRGH=buildHull(FRG.geo,10,.9);
capitals.forEach((c,i)=>{c.col=collider(c.grp,CAPH[CAPS[i].v]);c.lastHit=-99;});
PURS.forEach((P,i)=>{P.col=collider(P.grp,CAPH[i%3],()=>!P.dead);});
flag.col=collider(flag.grp,FLAGH,()=>flag.state!=='hidden');
civs.forEach(c=>{c.col=collider(c.m,FRGH,()=>c.state==='fly'||c.state==='parked'||c.state==='wait');});
const SOLIDS=[...capitals.map(c=>c.col),...PURS.map(P=>P.col),flag.col,...civs.map(c=>c.col)];
function tideSolids(){return SOLIDS;}
const CAP_NAMES=['Harrow','Vigilance Breaker','Dread Tide','Ashfall'];

/* ---------- interceptor missiles: lock the ship or fighter nearest the crosshair ---------- */
const TM={msl:6,t:0,cool:0,lock:null};
function fighterLive(f){return f.state==='attack'||f.state==='return'||f.state==='launch';}
function tideLock(){
  let best=null,bs=Math.cos(.3);
  for(const c of capitals){if(c.crash||!c.grp.visible)continue;if(c.grp.position.distanceTo(player)>9000)continue;const s=aimDot(c.grp.position);if(s>bs){bs=s;best={c};}}
  for(const f of fighters){if(!fighterLive(f)||f.pos.distanceTo(player)>6000)continue;const s=aimDot(f.pos)+.01;if(s>bs){bs=s;best={f};}}
  return best;
}
function tideMissile(){
  if(mode!=='pilot'||TM.msl<1||TM.cool>0)return;TM.msl--;TM.cool=.35;TM.t=0;
  const L=TM.lock,from=pShip.localToWorld(new THREE.Vector3((pBarrel^=1)?3:-3,-1.4,0));
  const cy=Math.cos(pitch),fwd=new THREE.Vector3(-Math.sin(yaw)*cy,Math.sin(pitch),-Math.cos(yaw)*cy);
  let target=null;
  if(L&&L.c){const c=L.c;target={pos:()=>c.crash?null:c.grp.position,hit:p=>hullContains(c.col,p,30)};
    fireMissile(from,fwd,2200,target,p=>damageCapital(c,8,p,'missile'));}
  else if(L&&L.f){const f=L.f;target={pos:()=>fighterLive(f)?f.pos:null,hit:p=>p.distanceTo(f.pos)<60};
    fireMissile(from,fwd,2200,target,()=>killFighter(f,'missile'));}
  else fireMissile(from,fwd,2200,null,null);
}
addEventListener('keydown',e=>{if(e.code==='KeyF')tideMissile();});
cv.addEventListener('mousedown',e=>{if(e.button===0&&locked&&mode==='pilot')tideMissile();});
$('msl').addEventListener('pointerdown',e=>{e.preventDefault();tideMissile();});
const tLockEl=document.createElement('div');tLockEl.className='lockbox';tLockEl.hidden=true;document.body.appendChild(tLockEl);

/* ---------- points, objectives, challenges ---------- */
const TIDE_CHAL=[
  {id:'tfighters',text:'Down 10 fighters',pts:1500,goal:10},
  {id:'tgun',text:'Hit a capital ship from a sea cannon',pts:500},
  {id:'tmsl',text:'Destroy a fighter with a missile',pts:500},
  {id:'tcap',text:'Bring down a capital ship yourself',pts:3000},
  {id:'tvictory',text:'Destroy the whole fleet',pts:5000},
];
PG.init('tide',{challenges:TIDE_CHAL});
let tPrev='calm',tResults=false;
const _tt=new THREE.Vector3();
function tideTick(dt){
  PG.tick(dt);
  const id=PH[ph].id,left=capitals.filter(c=>!c.crash).length;
  if(id!==tPrev){
    if(tPrev==='calm'&&id==='escape'&&battles>1){PG.init('tide',{challenges:TIDE_CHAL});tResults=false;}
    if(id==='victory'){PG.done('tvictory');PG.ach('tideholds');PG.add(5000,null,'Tide City holds');}
    if(tPrev==='retreat'&&id==='calm'&&!tResults)tideResults(false);
    tPrev=id;
  }
  if(id==='victory'&&phT>9&&!tResults)tideResults(true);
  PG.objective(id==='calm'?(battles?'Explore, or call the fleet again':'Call the fleet when you are ready'):
    id==='escape'?'Cover the city flagship as it runs for the shipyard':
    id==='approach'?'Enemy fleet inbound · crew a sea cannon or fly the interceptor':
    id==='bombard'?'Hold under the shield while the sea guns surface':
    id==='counter'?'Bring down the capital ships · '+left+' left':
    id==='retreat'?'Finish them before they escape · '+left+' left':'Tide City holds');
  // missiles reload one every 4.5 s
  TM.cool-=dt;if(TM.msl<6){TM.t+=dt;if(TM.t>4.5){TM.t=0;TM.msl++;}}
  $('msl').hidden=!(mode==='pilot'&&coarse);
  TM.lock=mode==='pilot'&&TM.msl>0?tideLock():null;
  const lp=TM.lock?(TM.lock.c?TM.lock.c.grp.position:TM.lock.f.pos):null;
  if(lp){_tt.copy(lp).project(camera);if(_tt.z<1&&Math.abs(_tt.x)<1&&Math.abs(_tt.y)<1){tLockEl.hidden=false;tLockEl.style.left=(_tt.x*.5+.5)*innerWidth+'px';tLockEl.style.top=(-_tt.y*.5+.5)*innerHeight+'px';}else tLockEl.hidden=true;}else tLockEl.hidden=true;
  // fires on damaged capital ships
  updateFires(dt,capitals.filter(c=>!c.crash&&c.grp.visible),c=>c.col);
  // tags: capital ships show name and hull when you hit them or aim at them; frigates and the flagship when you look at them
  const now=performance.now()/1000;
  tagsBegin();
  capitals.forEach((c,i)=>{if(c.crash||!c.grp.visible)return;const hit=now-c.lastHit<4;
    if(hit||aimDot(c.grp.position)>.993)tagShip(c,c.grp.localToWorld(_tt.set(0,170,0)),'Raider capital “'+CAP_NAMES[i]+'”',(c.hp==null?CAP_HP:c.hp)/CAP_HP,true,true,now-c.lastHit<.12);});
  for(const P of PURS)if(P.grp.visible&&!P.dead&&aimDot(P.grp.position)>.996)tagShip(P,P.grp.localToWorld(_tt.set(0,200,0)),'Raider frigate',P.hp/18,true,true);
  if(flag.state==='flying'&&aimDot(flag.grp.position)>.985)tagShip(flag,flag.grp.localToWorld(_tt.set(0,160,0)),'City flagship',1,false,false);
  tagsEnd();
}
function tideResults(win){
  tResults=true;
  PG.finish({title:win?'TIDE CITY HOLDS':'THE FLEET ESCAPED',
    text:win?`The fleet is destroyed and the city celebrates. Fighters ${score.fighters} · capital ships ${score.capitals} · hull hits ${score.hull}.`:`The surviving capital ships pulled back. Down them all next time for the victory. Fighters ${score.fighters} · capital ships ${score.capitals}.`,
    buttons:[{text:'Keep flying',close:true,primary:true},{text:'Play again',onClick:()=>location.reload()},{text:'Chapters',href:'index.html'}]});
}
PG.briefing({title:'TIDE CITY',text:'Chapter 3, the final chapter. The aliens followed the Vigil home. Defend Tide City from the air, from the sea guns, or on foot.',objective:'Press Call fleet (top right) when you are ready. Bring down every capital ship to win.',
  pc:[['Mouse','Look / aim (click to lock, Esc releases)'],['W A S D','Fly'],['Space / Q','Up / down'],['Shift','Boost'],['Views','Right side: crew a sea cannon, fly the interceptor, walk the street'],['Right-click','Fire (cannon or interceptor)'],['Left-click / F','Homing missile (interceptor)']],
  phone:[['Left thumb','Fly'],['Right thumb','Look / aim'],['UP / DOWN','Altitude'],['Views','Right side buttons'],['FIRE','Fire (cannon or interceptor)'],['MSL','Homing missile (interceptor)']]});
