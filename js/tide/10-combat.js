/* Tide City · combat: solid hulls, ship name/HP tags, interceptor missiles, points, objectives and the results card */

/* ---------- hulls: capital ships, raider frigates, the city flagship and the freighters are solid ---------- */
const CAPH=variants.map(V=>buildHull(V.geo,12,.9)),FLAGH=buildHull(FG.geo,14,.92),FRGH=buildHull(FRG.geo,10,.9);
capitals.forEach((c,i)=>{c.col=collider(c.grp,CAPH[CAPS[i].v]);c.lastHit=-99;});
PURS.forEach((P,i)=>{P.col=collider(P.grp,CAPH[i%3],()=>!P.dead);});
flag.col=collider(flag.grp,FLAGH,()=>flag.state!=='hidden');
civs.forEach(c=>{c.col=collider(c.m,FRGH,()=>c.state==='fly'||c.state==='parked'||c.state==='wait');});
const SOLIDS=[...capitals.map(c=>c.col),...PURS.map(P=>P.col),flag.col,...civs.map(c=>c.col)];
function tideSolids(){return SOLIDS;}
const CAP_NAMES=['Harrow','Vigilance Breaker','Dread Tide','Ashfall','Grief Engine','Pale Furnace','Sunder','Widow Lance','Throne of Ash'];

/* ---------- interceptor missiles: lock the ship or fighter nearest the crosshair ---------- */
const TM={msl:6,t:0,cool:0,lock:null};
function fighterLive(f){return f.state==='attack'||f.state==='return'||f.state==='launch';}
function tideLock(){
  let best=null,bs=Math.cos(.3);
  for(const c of capitals){if(c.crash||!c.grp.visible)continue;if(c.grp.position.distanceTo(player)>9000)continue;const s=aimDot(c.grp.position);if(s>bs){bs=s;best={c};}}
  for(const f of fighters){if(!fighterLive(f)||f.pos.distanceTo(player)>6000)continue;const s=aimDot(f.pos)+.01;if(s>bs){bs=s;best={f};}}
  for(const D of drops){if(D.dead||!D.g.visible||D.pos.distanceTo(player)>7000)continue;const s=aimDot(D.pos)+.015;if(s>bs){bs=s;best={d:D};}}
  for(const P of PURS){if(P.dead||!P.grp.visible||P.grp.position.distanceTo(player)>9000)continue;const s=aimDot(P.grp.position)+.012;if(s>bs){bs=s;best={p:P};}}
  return best;
}
function tideMissile(){
  if(mode!=='pilot'||TM.msl<1||TM.cool>0)return;TM.msl--;TM.cool=.35;TM.t=0;
  const L=TM.lock,from=pShip.localToWorld(new THREE.Vector3((pBarrel^=1)?3:-3,-1.4,0));
  const cy=Math.cos(pitch),fwd=new THREE.Vector3(-Math.sin(yaw)*cy,Math.sin(pitch),-Math.cos(yaw)*cy);
  let target=null;
  if(L&&L.c){const c=L.c;target={pos:()=>c.crash?null:c.grp.position,hit:p=>hullContains(c.col,p,30)};
    fireMissile(from,fwd,2200,target,p=>damageCapital(c,8,p,'missile'));}
  else if(L&&L.d){const D=L.d;target={pos:()=>D.dead?null:D.pos,hit:p=>p.distanceTo(D.pos)<45};
    fireMissile(from,fwd,2200,target,p=>hostHit({type:'host',kind:'drop',obj:D},p,10,'missile'));}
  else if(L&&L.p){const P=L.p;target={pos:()=>P.dead?null:P.grp.position,hit:p=>hullContains(P.col,p,30)};
    fireMissile(from,fwd,2200,target,p=>damagePursuer(P,10,p,'missile'));}
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
  {id:'tfrig',text:'Shoot down a frigate chasing the Vigil',pts:1000},
  {id:'tcap',text:'Bring down a capital ship yourself',pts:3000},
  {id:'tdrop',text:'Down 4 Empty Host dropships',pts:2000,goal:4},
  {id:'tspear',text:'No trooper reaches the Spear',pts:3000},
  {id:'tcity',text:'Keep Tide City above 50%',pts:2500},
  ...(coarse?[]:[{id:'tgun',text:'Hit a capital ship from a sea gun (G)',pts:500}]),
  {id:'tmsl',text:'Destroy a fighter with a missile',pts:500},
];
PG.init('tide',{challenges:TIDE_CHAL});
let tPrev='calm',tResults=false;
const _tt=new THREE.Vector3();
function tideTick(dt){
  PG.tick(dt);
  const id=PH[ph].id,left=liveShips().length;
  if(id!==tPrev){
    if(tPrev==='calm'&&id==='arrive'&&battles>1){PG.init('tide',{challenges:TIDE_CHAL});tResults=false;}
    if(id==='victory'){if(!spearBreached)PG.done('tspear');if(cityLow>=50)PG.done('tcity');PG.ach('tideholds');PG.add(5000,null,'Tide City holds');}
    tPrev=id;
  }
  if(id==='victory'&&phT>9&&!tResults)tideResults(true);
  const tl=drops.filter(D=>!D.dead).length,tr=troopsLeft();
  PG.objective(id==='calm'?(battles?'Explore the city, or press Fight again':'Press Start to begin'):
    id==='arrive'?'Hold on \u00b7 dropping out of hyperspace':
    id==='escape'?'Keep the frigates off the Vigil until it reaches the shipyard':
    id==='approach'?'Enemy fleet inbound \u00b7 fly the interceptor or crew a sea cannon':
    id==='bombard'?'Hold under the shield while the sea guns surface':
    id==='counter'?'Bring down the first wave \u00b7 '+left+' capital ship'+(left===1?'':'s')+' left':
    id==='reinf'?'Second wave inbound \u00b7 '+left+' heavy capital ships':
    id==='host'?(tl+tr?'Stop the Empty Host \u00b7 '+tl+' dropship'+(tl===1?'':'s')+', '+tr+' trooper'+(tr===1?'':'s'):'Empty Host dropships inbound \u00b7 watch the core platform'):
    id==='spear'?(spearFired()?'The Spear of Destiny fires':'Defend the Spear while it charges \u00b7 '+Math.floor(spearCharge()*100)+'%'):id==='fallen'?'Tide City has fallen':'Tide City holds');
  // missiles reload one every 4.5 s
  TM.cool-=dt;if(TM.msl<6){TM.t+=dt;if(TM.t>4.5){TM.t=0;TM.msl++;}}
  $('msl').hidden=!(mode==='pilot'&&coarse);
  TM.lock=mode==='pilot'&&TM.msl>0?tideLock():null;
  const lp=TM.lock?(TM.lock.c?TM.lock.c.grp.position:TM.lock.d?TM.lock.d.pos:TM.lock.p?TM.lock.p.grp.position:TM.lock.f.pos):null;
  if(lp){_tt.copy(lp).project(camera);if(_tt.z<1&&Math.abs(_tt.x)<1&&Math.abs(_tt.y)<1){tLockEl.hidden=false;tLockEl.style.left=(_tt.x*.5+.5)*innerWidth+'px';tLockEl.style.top=(-_tt.y*.5+.5)*innerHeight+'px';}else tLockEl.hidden=true;}else tLockEl.hidden=true;
  // fires on damaged capital ships
  updateFires(dt,capitals.filter(c=>!c.crash&&c.grp.visible),c=>c.col);
  // tags: capital ships show name and hull when you hit them or aim at them; frigates and the flagship when you look at them
  const now=performance.now()/1000;
  // PC: the big hull bar at the top centre follows what you are hitting, then what you aim at
  let tb=null,tbt=0;
  capitals.forEach((c,i)=>{if(!c.crash&&c.grp.visible&&now-c.lastHit<3&&c.lastHit>tbt){tbt=c.lastHit;tb={key:c,name:'\u201c'+CAP_NAMES[i]+'\u201d',kind:'Alien capital ship',frac:(c.hp==null?c.maxHp:c.hp)/c.maxHp,hostile:true};}});
  for(const P of PURS)if(!P.dead&&P.grp.visible&&now-P.lastHit<3&&P.lastHit>tbt){tbt=P.lastHit;tb={key:P,name:'Raider frigate',kind:'Chasing the Vigil',frac:P.hp/PURS_HP,hostile:true};}
  for(const D of drops)if(!D.dead&&now-D.lastHit<3&&D.lastHit>tbt){tbt=D.lastHit;tb={key:D,name:'Dropship',kind:'Empty Host',frac:D.hp/DROP_HP,hostile:true};}
  if(!tb)capitals.forEach((c,i)=>{if(!tb&&!c.crash&&c.grp.visible&&aimDot(c.grp.position)>.993)tb={key:c,name:'\u201c'+CAP_NAMES[i]+'\u201d',kind:'Alien capital ship',frac:(c.hp==null?c.maxHp:c.hp)/c.maxHp,hostile:true};});
  if(!tb&&PH[ph].id==='spear'&&!spearFired())tb={key:'spear',name:'The Spear of Destiny',kind:'Charging',frac:spearCharge(),hostile:false,sub:spearBreachers()?spearBreachers()+' troopers at the base \u00b7 charge slowed':' '};
  if(tb&&!tb.sub)tb.sub=((tb.key.grp?tb.key.grp.position:tb.key.pos).distanceTo(player)/1000).toFixed(1)+' km';
  const pcb=targetBar(tb,dt);
  tagsBegin();
  capitals.forEach((c,i)=>{if(c.crash||!c.grp.visible)return;const hit=now-c.lastHit<4;
    if(hit||aimDot(c.grp.position)>.993)tagShip(c,c.grp.localToWorld(_tt.set(0,170,0)),'Alien capital \u201c'+CAP_NAMES[i]+'\u201d',(c.hp==null?c.maxHp:c.hp)/c.maxHp,true,!pcb,now-c.lastHit<.12);});
  for(const P of PURS)if(P.grp.visible&&!P.dead&&(now-P.lastHit<4||aimDot(P.grp.position)>.993))tagShip(P,P.grp.localToWorld(_tt.set(0,200,0)),'Alien frigate',P.hp/PURS_HP,true,!pcb,now-P.lastHit<.12);
  for(const D of drops)if(!D.dead&&D.g.visible&&(now-D.lastHit<4||aimDot(D.pos)>.995))tagShip(D,_tt.copy(D.pos).add(_cv.set(0,40,0)),'Empty Host dropship',D.hp/DROP_HP,true,!pcb,now-D.lastHit<.12);
  if(flag.state==='flying'&&aimDot(flag.grp.position)>.985)tagShip(flag,flag.grp.localToWorld(_tt.set(0,160,0)),'The Vigil',1,false,false);
  if(aimDot(SPEAR_TOP)>.995&&player.distanceTo(SPEAR_TOP)<9000)tagShip('spear',SPEAR_TOP,'The Spear of Destiny',spearCharge(),false,PH[ph].id==='spear');
  tagsEnd();
}
function tideResults(win){
  tResults=true;
  PG.finish({title:'TIDE CITY HOLDS',
    text:`The Spear of Destiny broke the alien fleet and the Empty Host was thrown back. Level 1 complete. Frigates ${score.frigates} \u00b7 fighters ${score.fighters} \u00b7 capital ships ${score.capitals} \u00b7 dropships ${hostStats.drops} \u00b7 troopers ${hostStats.troops}.`,
    buttons:[{text:'Keep flying',close:true,primary:true},{text:'Play again',onClick:()=>location.reload()},{text:'Chapters',href:'index.html'}]});
}
