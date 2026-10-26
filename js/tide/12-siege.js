/* Tide City · siege: your interceptor's shield and hull, capital ships tearing down towers, the city's integrity,
   and what happens if it reaches zero before the Spear fires. */

/* ---------- your interceptor can be shot down ---------- */
const tideP={shield:DMG.CLASS.playerCraft.shield,hull:DMG.CLASS.playerCraft.hp,maxShield:DMG.CLASS.playerCraft.shield,maxHull:DMG.CLASS.playerCraft.hp,alive:true,respawnT:0,lastHit:-99,zeal:0,zealT:0,zeals:0};
const FIGHT=new Set(['escape','approach','bombard','counter','reinf','host','spear']);
// your interceptor (the player craft): 100 hull + 25 shield, the shield first. exact: spec damage; otherwise old units (hull scrapes),
// the same share of 125 as they were of the old 200, with the old threat-level weight
function craftPool(){tideP.maxHull=DMG.CLASS.playerCraft.hp;tideP.maxShield=DMG.CLASS.playerCraft.shield;tideP.hull=tideP.maxHull;tideP.shield=tideP.maxShield;}
function hurtTide(dmg,at,exact){if(CUTS.on)return;
  if(!tideP.alive||mode!=='pilot'||!FIGHT.has(PH[ph].id))return;
  if(tideP.zealT>0){boom(at||player,40,0xffd27a,.3);return;}   // Zeal: nothing gets through
  if(!exact)dmg*=DIFF.tide.dmg*(tideP.maxHull+tideP.maxShield)/200;
  tideP.lastHit=performance.now()/1000;const s=Math.min(tideP.shield,dmg);tideP.shield-=s;tideP.hull-=dmg-s;
  boom(at||player,s>=dmg?36:64,s>=dmg?0x7fb6ff:0xff7a3a,.3);
  if(tideP.hull<=0)tideDown();
}
function tideDown(){
  tideP.alive=false;tideP.hull=0;tideP.respawnT=4.5;tideP.zealT=0;fireHeld=false;
  const p=player.clone();boom(p,220,0xfff0c0,.5);boom(p,460,0xff6a1a,1.2);for(let i=0;i<4;i++)puff(p,R(60,110),3);flashScreen(.45);
  pShip.visible=false;mode='down';$('fire').hidden=true;$('ret').hidden=true;$('gun').hidden=true;
  flashBanner('Interceptor down · relaunching from the spaceport');
  PG.say('Tide City Command','Interceptor down! Get him another ship!','alert',4);
}
function tideRespawn(){tideP.alive=true;craftPool();setMode('pilot');}
let gunReturn=null;
// G (or GUN on a phone) crews the nearest sea gun, and again puts you back in your interceptor where you left it
function toggleGun(){if(PG.paused)return;
  if(mode==='pilot'){gunReturn={p:player.clone(),yaw,pitch};setMode('cannon');}
  else if(mode==='cannon'){setMode('pilot');if(gunReturn){player.copy(gunReturn.p);yaw=gunReturn.yaw;pitch=gunReturn.pitch;}}}
addEventListener('keydown',e=>{if(e.code==='KeyG'&&!e.repeat)toggleGun();});
$('gun').addEventListener('pointerdown',e=>{e.preventDefault();toggleGun();});

/* ---------- towers: the capital ships pick one and hammer it until it falls ---------- */
const siegeTowers=strikeTowers;
for(const T of siegeTowers){T.maxHp=5+T.h/160;T.hp=T.maxHp;T.down=false;}
for(const T of towers)for(const P of T.parts)if(P.list==='deck')P.g=P.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,-.6,0)).multiply(new THREE.Matrix4().makeScale(1.03,.25,1.03));
const falling=[],_sM=new THREE.Matrix4(),_sA=new THREE.Matrix4(),_sB=new THREE.Matrix4(),_sQ=new THREE.Quaternion(),_sAx=new THREE.Vector3();
let towersDown=0,collapseBanner=0;
function setParts(T,fn){for(const P of T.parts){const mesh=TWM[P.list];mesh.setMatrixAt(P.i,fn(P.m));mesh.instanceMatrix.needsUpdate=true;
  if(P.g){TWM.deckGlow.setMatrixAt(P.i,fn(P.g));TWM.deckGlow.instanceMatrix.needsUpdate=true;}}}
function collapseTower(T,quiet){
  if(T.down)return;T.down=true;towersDown++;
  const a=Math.random()*Math.PI*2;T.fall={t:0,dur:R(4,6.5),tilt:R(.15,.45),ax:Math.cos(a),az:Math.sin(a)};falling.push(T);
  const top=new THREE.Vector3(T.x,3+T.h*.85,T.z),base=new THREE.Vector3(T.x,10,T.z);
  boom(top,T.fp*9,0xfff0c0,.6);boom(top,T.fp*14,0xff6a1a,1.6);smoke(top,T.fp*14,6);
  for(let i=0;i<5;i++)boom(base.clone().add(_bw.set(R(-T.fp,T.fp),R(0,T.h*.5),R(-T.fp,T.fp))),R(T.fp*4,T.fp*8),0xff7a26,R(1,1.8));
  if(typeof sfx!=='undefined')sfx.collapse(top);
  if(!quiet){cityHit(1.5);if(performance.now()-collapseBanner>6000){collapseBanner=performance.now();flashBanner('A tower is down · city integrity '+Math.ceil(cityHP)+'%');}}
}
function updateFalling(dt){
  for(let k=falling.length-1;k>=0;k--){const T=falling[k],F=T.fall;F.t+=dt;const u=Math.min(1,F.t/F.dur),e=u*u;
    if(u>=1){setParts(T,()=>_sM.makeScale(0,0,0));falling.splice(k,1);
      for(let i=0;i<3;i++)burners.push({p:new THREE.Vector3(T.x+R(-T.fp,T.fp)*.5,8,T.z+R(-T.fp,T.fp)*.5),t:0,s:1.2});
      for(let i=0;i<6;i++)puff(new THREE.Vector3(T.x+R(-T.fp,T.fp),R(10,60),T.z+R(-T.fp,T.fp)),R(T.fp*2,T.fp*4),R(5,8));continue;}
    // sink and lean: rotate about the base, then drop by up to the tower's height (it disappears into the platform and sea)
    _sAx.set(F.az,0,-F.ax);_sQ.setFromAxisAngle(_sAx,F.tilt*e);
    _sA.makeTranslation(T.x,3,T.z).multiply(_sB.makeRotationFromQuaternion(_sQ)).multiply(_sM.makeTranslation(-T.x,-3-T.h*1.05*e,-T.z));
    const A=_sA.clone();setParts(T,m=>_sM.multiplyMatrices(A,m));
    if(Math.random()<dt*14)puff(new THREE.Vector3(T.x+R(-1,1)*T.fp*1.2,R(5,30),T.z+R(-1,1)*T.fp*1.2),R(T.fp*1.5,T.fp*3),R(4,7));
    if(Math.random()<dt*4)boom(new THREE.Vector3(T.x,3+T.h*(1-e)*R(.3,.9),T.z),R(T.fp*3,T.fp*6),0xff7a26,1);
  }
}
function restoreTowers(){
  for(const T of towers){if(!T.down)continue;T.down=false;T.fall=null;setParts(T,m=>m);}
  for(const T of siegeTowers)T.hp=T.maxHp;falling.length=0;towersDown=0;
}
function damageTower(T,d){if(T.down)return;T.hp-=d;if(T.hp<=0)collapseTower(T);}
function pickFocus(c){
  const up=siegeTowers.filter(T=>!T.down);if(!up.length)return null;
  const cx=c.grp.position.x,cz=c.grp.position.z;up.sort((a,b)=>((a.x-cx)**2+(a.z-cz)**2)-((b.x-cx)**2+(b.z-cz)**2));
  return up[(Math.random()*Math.min(40,up.length))|0];
}
const _sh=new THREE.Vector3();
function siegeFire(dt,id){
  const hot=(id==='counter'&&phT>5)||id==='reinf'||id==='host'||(id==='spear'&&!spearFired());if(!hot)return;
  for(const c of liveShips()){
    if(c.wave===2&&c.t<12)continue;   // still flying in
    c.sFire=(c.sFire==null?Math.random()*2:c.sFire)-dt;if(c.sFire>0)continue;
    c.sFire=(c.wave===2?R(1.1,1.9):R(2,3.2))/DIFF.tide.rof;
    const bk=c.wave===2?'hollow':'enemy',from=shipLocalPoint(c,true);boom(from,200,c.wave===2?HOLLOW_GLOW:ALIEN_GLOW,.35);
    // now and then a capital ship turns its guns on you
    if(mode==='pilot'&&tideP.alive&&Math.random()<.14&&from.distanceTo(player)<6500){
      const hitP=DMG.rolls(),to=player.clone().addScaledVector(vel,from.distanceTo(player)/2600*.7);if(!hitP)to.add(new THREE.Vector3(R(-1,1),R(-1,1),R(-1,1)).setLength(R(110,200)));
      fire(from,to,2600,bk,p=>{boom(p,260,0xfff2d0,.4);if(hitP)hurtTide(DMG.npcAir('turret'),p,true);});continue;}
    if(!c.focus||c.focus.down)c.focus=pickFocus(c);const T=c.focus;if(!T)continue;
    const to=new THREE.Vector3(T.x+R(-T.fp*.3,T.fp*.3),3+T.h*R(.35,.9),T.z+R(-T.fp*.3,T.fp*.3));
    fire(from,to,2400,bk,p=>{boom(p,600,0xfff2d0,.5);boom(p,1000,0xff6a1a,1.6);for(let i=0;i<3;i++)puff(p,R(120,220),5);
      if(burners.length<60&&Math.random()<.35)burners.push({p:p.clone(),t:0});damageTower(T,1);cityHit(.12);});
  }
}

/* ---------- the city's integrity ---------- */
let cityHP=100,cityLow=100,cityWarned=0,fallenT=-1,fallQ=[],lostShown=false;
function cityHit(d){
  if(!FIGHT.has(PH[ph].id)||spearFired())return;
  d*=DIFF.tide.city;cityHP=Math.max(0,cityHP-d);cityLow=Math.min(cityLow,cityHP);
  if(cityHP<=50&&cityWarned<1){cityWarned=1;PG.say('Tide City Command','City integrity at half! The core platform can’t take much more!','alert',5);}
  if(cityHP<=25&&cityWarned<2){cityWarned=2;PG.say('Elias Veyr','Michael, the city is breaking apart. Stop those ships, or there will be nothing left to save.','',6);}
  if(cityHP<=0)cityFalls();
}
const _bcOrig=breakCannon;breakCannon=function(g,f){if(!g.broken)cityHit(4);return _bcOrig(g,f);};
function cityFalls(){
  const i=PH.findIndex(p=>p.id==='fallen');if(PH[ph].id==='fallen')return;
  ph=i;phT=0;fallenT=0;lostShown=false;
  fallQ=towers.filter(T=>!T.down).map(T=>({T,at:R(.5,11)*(.4+.6*Math.min(1,Math.hypot(T.x,T.z)/1800))}));
  for(const tr of troops)tr.state='dead';for(const D of drops){D.state='idle';D.dead=true;D.g.visible=false;}
  PG.say('Tide City Command','Integrity gone! The core is breaking up! All hands, abandon the city!','alert',6);
  setTimeout(()=>PG.say('Elias Veyr','Michael, get clear. Tide City is lost.','',6),5000);
}
function updateFallen(dt){
  fallenT+=dt;
  for(const q of fallQ)if(!q.done&&fallenT>=q.at){q.done=true;collapseTower(q.T,true);}
  // explosions rolling across every platform, the Spear toppling
  if(Math.random()<dt*10){const P=pick(PLATS),a=Math.random()*6.283,r=Math.random()*P.r;const p=new THREE.Vector3(P.x+Math.cos(a)*r,R(10,200),P.z+Math.sin(a)*r);
    boom(p,R(400,900),0xfff0c0,.6);boom(p,R(800,1600),0xff6a1a,1.8);smoke(p,R(800,1400),7);}
  spear.rotation.z=Math.min(.9,Math.max(0,fallenT-3)*.09)**1.5;spear.position.y=-Math.max(0,fallenT-4)*30;spearTip.visible=fallenT<4;
  if(fallenT>11.5&&fallenT-dt<=11.5){flashScreen(1);boom(new THREE.Vector3(0,300,0),9000,0xffffff,2.5);boom(new THREE.Vector3(0,200,0),7000,0xff7a20,4);
    for(let i=0;i<14;i++){const a=i/14*6.283;boom(new THREE.Vector3(Math.cos(a)*1500,150,Math.sin(a)*1500),4000,0xff5a14,3.5);}
    emitSprayAt(0,0,2400,SPRAY,3);if(typeof sfx!=='undefined')sfx.cityDeath();}
  if(fallenT>14&&!lostShown){lostShown=true;
    PG.finish({title:'TIDE CITY HAS FALLEN',lost:true,
      text:`The siege broke the city before the Spear of Destiny could finish the Hollow fleet. ${towersDown} towers fell. Fighters ${score.fighters} · capital ships ${score.capitals} · dropships ${hostStats.drops} · troopers ${hostStats.troops}. Bring the capital ships down faster, and keep the Host off the Spear.`,
      buttons:[{text:'Try again',onClick:()=>location.reload(),primary:true},{text:'Look around',close:true},{text:'Menu',href:'index.html'}]});}
}
function resetSiege(){
  restoreTowers();cityHP=100;cityLow=100;cityWarned=0;fallenT=-1;fallQ=[];
  spear.rotation.z=0;spear.position.y=0;spearTip.visible=true;
  for(const c of capitals){c.focus=null;c.sFire=null;}
  tideP.alive=true;craftPool();tideP.zeal=0;tideP.zealT=0;tideP.zeals=0;
}

/* ---------- per frame ---------- */
function siegeTick(dt){
  const id=PH[ph].id;
  if(!PG.paused){
    siegeFire(dt,id);updateFalling(dt);
    // troopers at the Spear's base wear the city down too
    if(FIGHT.has(id))cityHit(dt*.03*spearBreachers());
    if(id==='fallen')updateFallen(dt);
    // hull and shield come back 5 s after the latest hit, each empty to full in 8 (not on the streets: the walker and skiff don't recover)
    if(tideP.alive&&mode!=='ground')DMG.craftTick(tideP,dt,performance.now()/1000,tideP.zealT>0?DMG.EXTRA.zeal:1);
    if(!tideP.alive){tideP.respawnT-=dt;if(tideP.respawnT<=0)tideRespawn();}
  }
  PG.combat(FIGHT.has(PH[ph].id));
  const zr=tideP.zeal>=100&&tideP.zealT<=0;
  SHUD.update({shield:tideP.shield/tideP.maxShield*100,hull:tideP.hull/tideP.maxHull*100,zeal:tideP.zealT>0?tideP.zealT/ZEAL_T*100:tideP.zeal,zealText:tideP.zealT>0?'burning':zr?(coarse?'ready':'ready · Z'):'charging',zealReady:zr,mslReady:1-TM.cool/MSL_CD,speed:mode==='pilot'?vel.length():0,unit:mode==='cannon'?'SEA GUN':'M/S',
    extra:mode==='cannon'?'':'ALT '+Math.round(player.y)+' M',city:battles?cityHP:undefined,down:!tideP.alive||mode!=='pilot'});
}
const _siegeTick0=tideTick;tideTick=function(dt){_siegeTick0(dt);siegeTick(dt);};
