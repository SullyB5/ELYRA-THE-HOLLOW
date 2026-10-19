/* Tide City · director */
/* ---------- the director: calm → arrive (out of hyperspace) → escape (the Vigil runs for the shipyard) → approach → bombard → counter-fire (wave 1)
   → reinf (wave 2: five heavier ships jump in) → host (the Empty Host lands at the Spear) → spear (the Spear charges and fires) → victory → calm ---------- */
const PH=[{id:'calm',dur:Infinity},{id:'arrive',dur:2.6},{id:'escape',dur:26},{id:'approach',dur:18},{id:'bombard',dur:14},{id:'counter',dur:Infinity},{id:'reinf',dur:20},{id:'host',dur:60},{id:'spear',dur:Infinity},{id:'victory',dur:28},{id:'fallen',dur:22}];
const PH_START={arrive:-2.6,escape:0,approach:26,bombard:44,counter:58,reinf:120,host:140,spear:200};
let ph=0,phT=0,enemyCool=0,earlyN=0,stragglerShot=false,battles=0,fightersOut=false,waveB=false,waveC=false,cStrikeT=6;
const WAVE1=capitals.filter(c=>c.wave===1),WAVE2=capitals.filter(c=>c.wave===2);
function waveDown(W){return W.every(c=>c.crash);}
const ease=k=>{k=clamp(k,0,1);return k*k*(3-2*k);};
const CRASH_A=2,CRASH_B=3;
for(const c of capitals){c.grp.rotation.order='YXZ';c.grp.visible=false;}
const _nose=new THREE.Vector3();
function shipLocalPoint(c,belly){return c.grp.localToWorld(new THREE.Vector3(R(-c.W*.45,c.W*.45),belly?-110:R(-40,70),R(-380,420)));}
let crashCannon=null;
function startCrash(c,guide){
  if(c.crash)return;
  const out=_bw.set(c.grp.position.x,0,c.grp.position.z).normalize();
  c.crash={t:0,v:new THREE.Vector3(out.x*70,-25,out.z*70),spin:(rng()<.5?-1:1)*R(.25,.45),impact:false,settled:false,fx:0};
  boom(c.grp.position,2800,0xfff0c0,.8);
  for(let i=0;i<6;i++){const p=shipLocalPoint(c,false);boom(p,R(1000,1700),0xff6a1a,R(1.3,2.2));smoke(p,R(900,1400),R(4,6));}
  if(guide){
    const P=.62,noseL=560*c.grp.scale.x,fwd=new THREE.Vector3(-Math.sin(c.grp.rotation.y),0,-Math.cos(c.grp.rotation.y));
    const top=new THREE.Vector3(guide.x,330,guide.z);
    const pEnd=top.clone().addScaledVector(fwd,-noseL*Math.cos(P)).add(new THREE.Vector3(0,noseL*Math.sin(P),0));
    c.crash.guide={p0:c.grp.position.clone(),pEnd,T:7,cannon:guide,P,fwd,top};
  }
}
function resetShip(c){c.hp=c.maxHp;c.on=false;c.t=0;c.fires=null;c.lastHit=-99;c.crash=null;c.grp.visible=false;c.grp.rotation.x=0;c.grp.rotation.z=0;c.grp.position.copy(c.home);c.engMat.opacity=1;}
function impactBlast(p,big){
  boom(p,big?5200:3600,0xfff2d0,1.1);boom(p,big?4000:3000,0xff7a20,2.8);boom(p,3600,0xffffff,3.2);
  for(let i=0;i<7;i++)boom(p.clone().add(_bw.set(R(-900,900),R(0,600),R(-900,900))),R(1500,2700),0xff5a14,R(1.8,3.2));
  emitSprayAt(p.x,p.z,500,Math.floor(SPRAY*.45),1.8);
  for(let i=0;i<10;i++)smoke(p.clone().add(_bw.set(R(-800,800),R(100,700),R(-800,800))),R(1800,3200),R(7,11));
  spawnDebris(p.clone().setY(Math.max(p.y,60)),34,30,140,420,9);
}
function breakCannon(g,fwd){
  if(g.broken)return;g.broken=true;g.burn=0;
  const b=g.barrels[0];scene.attach(b);
  g.debris={obj:b,v:new THREE.Vector3(fwd.x*110+R(-30,30),90,fwd.z*110+R(-30,30)),w:new THREE.Vector3(R(-1.4,-.6),R(-.6,.6),R(-.9,.9)),splashed:false};
  g.barrels[1].rotation.set(-.42,0,.12);
  g.pitchG.rotation.x=-.18;g.yawG.rotation.y+=.4;
  const p=g.yawG.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,180,0));
  boom(p,1800,0xfff2d0,.9);boom(p,2600,0xff7a20,2.4);for(let i=0;i<5;i++)smoke(p.clone().add(_bw.set(R(-300,300),R(0,300),R(-300,300))),R(900,1600),R(6,9));
}
function repairCannon(g){
  if(g.debris){const b=g.debris.obj;g.pitchG.add(b);b.position.set(-66,0,0);b.rotation.set(0,0,0);b.visible=true;g.debris=null;}
  g.barrels[1].rotation.set(0,0,0);g.broken=false;g.hits=0;
}
function updateDebris(g,dt){
  const d=g.debris;if(!d||!d.obj.visible)return;const o=d.obj;
  if(o.position.y>0){d.v.y-=130*dt;}else{if(!d.splashed){d.splashed=true;emitSprayAt(o.position.x,o.position.z,140,160,1.1);boom(o.position.clone().setY(10),900,0xffffff,1.6);}
    d.v.multiplyScalar(Math.exp(-dt*1.5));d.v.y=Math.max(d.v.y-20*dt,-60);d.w.multiplyScalar(Math.exp(-dt));}
  o.position.addScaledVector(d.v,dt);o.rotation.x+=d.w.x*dt;o.rotation.y+=d.w.y*dt;o.rotation.z+=d.w.z*dt;
  if(o.position.y<-900)o.visible=false;
}
function updateCrash(c,dt){
  const k=c.crash;k.t+=dt;
  if(!k.impact){
    const G=k.guide;
    if(G){const u=Math.min(k.t/G.T,1);
      c.grp.position.lerpVectors(G.p0,G.pEnd,u*u);
      c.grp.rotation.x=-G.P*ease(Math.min(1,u*1.25));
      c.grp.rotation.z+=k.spin*dt*.12;
    }else{
      k.v.y=Math.max(k.v.y-60*dt,-460);
      c.grp.position.addScaledVector(k.v,dt);
      c.grp.rotation.x+=(-.6-c.grp.rotation.x)*(1-Math.exp(-dt*.55));
      c.grp.rotation.z+=k.spin*dt*.3;
    }
    c.engMat.opacity=Math.max(0,c.engMat.opacity-dt*.7);
    k.fx-=dt;
    if(k.fx<=0){k.fx=.08;const p=shipLocalPoint(c,false);boom(p,R(500,1100),pick([0xff7a1a,0xff4a10,0xffb040]),R(.6,1.2));smoke(p,R(800,1400),R(4,7));}
    c.grp.localToWorld(_nose.set(0,0,-560));
    if(G?k.t>=G.T:_nose.y<20){
      k.impact=true;k.t=0;
      if(G){impactBlast(G.top.clone(),true);breakCannon(G.cannon,G.fwd);k.v.copy(G.fwd).multiplyScalar(40);}
      else{const p=_nose.clone();p.y=20;impactBlast(p,true);}
    }
  }else if(!k.settled){
    // the hull settles into the water nose-first and stays there, stern in the air, burning
    k.v.y=0;c.grp.position.addScaledVector(k.v,dt*.25);k.v.multiplyScalar(Math.exp(-dt*.3));
    c.grp.position.y-=32*dt;c.grp.rotation.x+=(-.75-c.grp.rotation.x)*dt*.2;
    if(rng()<dt*5){c.grp.localToWorld(_nose.set(R(-80,80),0,R(-300,500)));_nose.y=R(60,300);smoke(_nose,R(1500,2600),R(7,10));boom(_nose,R(500,900),0xff6a1a,1);}
    if(c.grp.position.y<150){k.settled=true;
      for(let i=0;i<10&&burnersOn(c)<5;i++){const p=c.grp.localToWorld(new THREE.Vector3(R(-c.W*.4,c.W*.4),R(30,90),R(-100,480)));if(p.y>60)burners.push({p,t:0,s:3,owner:c});}}
  }
}
const FW_COLS=[0x7fe6ff,0xffd27a,0xff5ad2,0xffffff,0x7dff9a,0x8a9bff];
function fireworkBurst(p,sz){
  const col=pick(FW_COLS),n=coarse?8:12;
  boom(p,320*sz,0xffffff,.35);boom(p,520*sz,col,1.1);
  for(let k=0;k<n;k++){const a=k/n*Math.PI*2,e=R(-.6,.9),r=R(140,230)*sz;
    boom(p.clone().add(_bw.set(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r)),R(90,150)*sz,rng()<.25?pick(FW_COLS):col,R(1.1,1.8));}
}
let fwT=0,vicWasUp=false;
function victoryShow(dt,pt){
  // rockets go up from the tallest towers and burst over the city
  fwT-=dt;
  if(pt>1.5&&pt<23&&fwT<=0){fwT=R(.15,.4);
    const T=pick(strikeTowers),from=new THREE.Vector3(T.x,3+T.h,T.z),to=new THREE.Vector3(T.x+R(-500,500),3+T.h+R(500,1100),T.z+R(-500,500));
    fire(from,to,1400,'flak',p=>fireworkBurst(p,R(.8,1.3)));}
}
function burnersOn(c){let n=0;for(const b of burners)if(b.owner===c)n++;return n;}
function liveShips(){return capitals.filter(c=>!c.crash&&c.grp.visible);}
function resetWorld(){
  capitals.forEach(resetShip);cannons.forEach(repairCannon);
  burners.length=0;resetCivs();clearDebris();resetFlag();resetPursuers();if(typeof resetSiege!=='undefined')resetSiege();
  earlyN=0;stragglerShot=false;fightersOut=false;waveB=false;waveC=false;cStrikeT=6;resetFighters();score.hull=score.fighters=score.capitals=score.frigates=0;resetStory();
}
function jumpInWave2(){
  WAVE2.forEach((c,i)=>{c.on=true;c.t=-i*.7;c.grp.visible=true;c.grp.position.copy(c.home);c.grp.rotation.set(0,Math.atan2(c.home.x,c.home.z),0);c.engMat.opacity=1;
    setTimeout(()=>{boom(c.home,6000,0xffffff,.7);boom(c.home,4000,0x9fd8ff,1.4);if(typeof sfx!=='undefined')sfx.jump(c.home);},Math.max(0,-c.t)*1000);});
  flashScreen(.3);
}
function callFleet(){if(PH[ph].id!=='calm')return;resetWorld();ph=1;phT=0;battles++;launchCivs();startArrival();}
function director(dt,t){
  phT+=dt;
  // every capital ship down: skip the rest of the script and celebrate
  const fid=PH[ph].id;
  // wave 1 is done once every first-wave ship is down (the two scripted crashes need ~18 s); a long stall forces the end
  const w1Done=fid==='counter'&&phT>18&&waveDown(WAVE1);
  if(fid==='counter'&&phT>110)WAVE1.forEach(c=>{if(!c.crash)startCrash(c);});
  if(phT>=PH[ph].dur||w1Done||(fid==='host'&&hostOver())||(fid==='spear'&&spearOver())){phT=0;ph=(fid==='victory'||fid==='fallen')?0:ph+1;
    if(PH[ph].id==='escape'){flag.state='flying';flag.grp.visible=true;flag.t=0;dropOut();}
    if(PH[ph].id==='victory')vicWasUp=true;
    if(PH[ph].id==='approach')WAVE1.forEach(c=>{if(!c.crash){c.grp.visible=true;c.grp.position.copy(c.home);}});
    if(PH[ph].id==='reinf')jumpInWave2();
    if(PH[ph].id==='spear'&&!waveC){waveC=true;launchFighters(FN,liveShips());}
    if(PH[ph].id==='calm')capitals.forEach(c=>{if(!c.crash)c.grp.visible=false;});}
  const id=PH[ph].id,D=PH[ph].dur,clock=id==='calm'?-1:PH_START[id]+phT;
  // the flagship's run, its pursuers, and the freighters
  if(flag.state==='flying'){flag.t+=dt;updateFlag(dt,flag.t);}
  updatePursuers(dt,flag.t,flag.state!=='hidden'&&flag.t<50);
  if(id==='counter'&&!fightersOut){fightersOut=true;launchFighters(Math.round(FN*.6));}
  if(id==='reinf'&&!waveB&&phT>=8){waveB=true;launchFighters(FN,WAVE2);}
  updateFighters(dt,id,phT);
  if(id!=='calm')updateCivs(dt,clock);
  // scripted kills
  if(!crashCannon){const A=capitals[CRASH_A];let bd=1e18;for(const g of cannons){const d=(g.x-A.atk.x)**2+(g.z-A.atk.z)**2;if(d<bd){bd=d;crashCannon=g;}}}
  if(id==='counter'&&phT>=8)startCrash(capitals[CRASH_A],crashCannon);
  if(id==='counter'&&phT>=17)startCrash(capitals[CRASH_B]);
  if(id==='approach'&&earlyN<4&&phT>=14.5+earlyN*.35){earlyShot(earlyN);earlyN++;}
  if(id==='bombard'&&!stragglerShot&&phT>=.3){stragglerShot=true;shootStraggler();}
  updateBurners(dt);
  // fleet
  let shipK=0;
  if(id==='approach')shipK=ease(phT/D);else if(id==='bombard'||id==='counter'||id==='reinf'||id==='host'||id==='spear'||id==='fallen')shipK=1;
  for(const c of capitals){
    if(c.crash){updateCrash(c,dt);continue;}
    if(!c.grp.visible)continue;
    let k=shipK;if(c.wave===2){c.t+=dt;k=ease(c.t/15);}
    c.grp.position.lerpVectors(c.home,c.atk,k);c.grp.position.y+=Math.sin(t*.25+c.ph)*25;
    c.grp.rotation.y=angLerp(c.grp.rotation.y,Math.atan2(c.grp.position.x,c.grp.position.z),1-Math.exp(-dt*.8));
    c.engMat.opacity=(id==='approach'||(c.wave===2&&k<1))?1:.6;
  }
  // wave 2 goes after the sea guns: a heavy salvo every few seconds, and three salvos wreck a gun
  if((id==='host'||id==='spear'||(id==='reinf'&&phT>12))&&!spearFired()){cStrikeT-=dt;
    const w2=WAVE2.filter(c=>!c.crash&&c.grp.visible),ok=cannons.filter(g=>!g.broken);
    if(cStrikeT<=0&&w2.length&&ok.length>4){cStrikeT=R(4,7)/DIFF.tide.rof;const c=pick(w2),g=pick(ok);
      for(let k=0;k<3;k++){const from=shipLocalPoint(c,true),to=g.yawG.getWorldPosition(new THREE.Vector3()).add(_bw.set(R(-120,120),R(60,260),R(-120,120)));
        boom(from,260,HOLLOW_GLOW,.4);
        fire(from,to,2600,'hollow',p=>{boom(p,700,0xfff2d0,.5);boom(p,1300,0xff6a1a,1.6);smoke(p,R(600,1000),5);
          g.hits=(g.hits||0)+1;if(g.hits>=3&&!g.broken){const f=_bw.set(g.x,0,g.z).normalize().clone();breakCannon(g,f);flashBanner('A sea gun is down');}});}}}
  // enemy fire on the dome
  if(id==='bombard'&&phT>.6&&phT<D-.3){enemyCool-=dt;
    const lv=liveShips();
    if(enemyCool<=0&&lv.length){enemyCool=R(.12,.3);const c=pick(lv),from=shipLocalPoint(c,true),to=shieldPointToward(c.grp.position);
      boom(from,160,ALIEN_GLOW,.35);
      fire(from,to,2600,'enemy',p=>{hitsU[hitIdx].set(p.x,p.y,p.z,t+0.0001);hitIdx=(hitIdx+1)%8;boom(p,320,0xbff4ff,.6);boom(p,700,0x5ad2ff,1.1);});}}
  // shield
  let sScale=0,sOp=0;
  if(id==='bombard'){sScale=ease(phT/2.2);sOp=1;}
  else if(id==='counter'){sScale=1;sOp=1-ease(phT/1.0);}
  shield.visible=sOp>0.001;shield.scale.set(1,Math.max(.002,sScale),1);
  shieldMat.uniforms.uOp.value=sOp*(0.85+0.15*Math.sin(t*9));shieldMat.uniforms.uTime.value=t;
  // guns rise under the shield, lock on before it drops, fire as it falls
  let rise=0,aim=false,shoot=false;
  if(id==='bombard'){rise=ease((phT-3.2)/6.5);aim=phT>9;}
  else if(id==='counter'){rise=1;aim=true;shoot=phT>.15;}
  else if(id==='reinf'||id==='host'||id==='spear'){rise=1;aim=true;shoot=true;}
  else if(id==='victory'){rise=(vicWasUp?1:ease(phT/4))*(1-ease((phT-18)/8));}
  const live=liveShips().filter(c=>c.grp.visible);
  for(let gi=0;gi<cannons.length;gi++){const g=cannons[gi];
    const prevY=g.root.position.y;g.root.position.y=HIDE_Y*(1-rise);
    const moving=Math.abs(g.root.position.y-prevY)/Math.max(dt,1e-4);
    const breaking=g.root.position.y>-380&&g.root.position.y<-5&&moving>4;
    if(breaking)emitSpray(g,Math.ceil(dt*70));
    g.foam.material.opacity=breaking?.75:Math.max(0,g.foam.material.opacity-dt*.4);
    g.foam.scale.setScalar(breaking?1+(1-Math.abs(g.root.position.y+130)/130)*.8:g.foam.scale.x+dt*.3);
    updateDebris(g,dt);
    if(g===manned&&!g.broken){g.yawG.rotation.y=yaw;g.pitchG.rotation.x=clamp(pitch,-.05,1.2);g.recoil=Math.max(0,g.recoil-dt*90);g.pitchG.position.z=-80+g.recoil;continue;}
    if(rise<.01){g.yawG.rotation.y=g.rest;g.pitchG.rotation.x=0;continue;}
    if(id==='victory'&&!g.broken){
      // salute: barrels up, three rounds each, timed around the ring
      g.yawG.rotation.y=angLerp(g.yawG.rotation.y,g.rest,1-Math.exp(-dt*1.2));
      g.pitchG.rotation.x+=(1.15-g.pitchG.rotation.x)*(1-Math.exp(-dt*1.4));
      g.recoil=Math.max(0,g.recoil-dt*90);g.pitchG.position.z=-80+g.recoil;
      if(g.salN==null||phT<.1)g.salN=0;
      const when=3+gi*.35+g.salN*2.4;
      if(g.salN<3&&phT>=when&&g.pitchG.rotation.x>1){g.salN++;g.barrel^=1;
        const mz=g.muzzles[g.barrel],from=mz.getWorldPosition(new THREE.Vector3()),dir=mz.getWorldDirection(new THREE.Vector3()).negate();
        boom(from,300,0xffd27a,.3);boom(from,600,0xff9a3a,.6);g.recoil=40;
        fire(from,from.clone().addScaledVector(dir,R(1300,1800)),2600,'friend',p=>fireworkBurst(p,1.6));}
      continue;
    }
    if(g.broken){g.burn-=dt;if(g.burn<=0&&g.root.position.y>-250){g.burn=.1;const p=g.yawG.localToWorld(new THREE.Vector3(R(-150,150),R(60,230),R(-200,220)));
      boom(p,R(200,420),pick([0xff7a1a,0xff4a10,0xffb040]),R(.5,1));smoke(p,R(350,700),R(4,7));}continue;}
    let ty=g.rest,tp=0;
    if(aim&&live.length){
      const A=capitals[CRASH_A],B=capitals[CRASH_B];
      let want=null;
      if(id==='counter'&&phT<8&&!A.crash&&gi%2===0)want=A;
      else if(id==='counter'&&phT>=14&&phT<17&&!B.crash)want=B;
      if(want)g.target=want;
      else if(!g.target||g.target.crash||rng()<dt*.08)g.target=live.slice().sort((a,b)=>a.grp.position.distanceToSquared(_bw.set(g.x,0,g.z))-b.grp.position.distanceToSquared(_bw.set(g.x,0,g.z)))[Math.min(live.length-1,(rng()*2)|0)];
      const tp3=g.target.grp.position,dx=tp3.x-g.x,dz=tp3.z-g.z;
      ty=Math.atan2(-dx,-dz);tp=Math.atan2(tp3.y-(g.root.position.y+120),Math.hypot(dx,dz));
    }
    g.yawG.rotation.y=angLerp(g.yawG.rotation.y,ty,1-Math.exp(-dt*1.4));
    g.pitchG.rotation.x+=(tp-g.pitchG.rotation.x)*(1-Math.exp(-dt*1.4));
    g.recoil=Math.max(0,g.recoil-dt*90);g.pitchG.position.z=-80+g.recoil;
    if(shoot&&g.target&&!g.target.crash){g.cool-=dt;
      const err=Math.abs(angLerp(g.yawG.rotation.y,ty,1)-g.yawG.rotation.y);
      if(g.cool<=0&&err<.1){g.cool=R(.7,1.5);
        const mz=g.muzzles[g.barrel];g.barrel^=1;const from=mz.getWorldPosition(new THREE.Vector3());
        const to=shipLocalPoint(g.target,false),tg=g.target;
        boom(from,260,0xffd27a,.3);boom(from,520,0xff9a3a,.6);g.recoil=40;
        fire(from,to,2800,'friend',p=>{aiDamageCapital(tg,tg.wave===2?.35:1.1);boom(p,420,0xfff1c8,.45);boom(p,1100,0xff7a26,1.4);boom(p.clone().add(_bw.set(R(-80,80),R(-40,60),R(-80,80))),700,0xff4a14,1.8);smoke(p,R(500,900),R(3,5));});}
      g.misCool-=dt;if(g.misCool<=0){g.misCool=R(3.5,6);g.queue=6;g.qT=0;}
      if(g.queue>0){g.qT-=dt;if(g.qT<=0){g.qT=.14;g.queue--;
        const lp=g.pods[(rng()*g.pods.length)|0],from=lp.getWorldPosition(new THREE.Vector3()),dir=lp.getWorldDirection(new THREE.Vector3()).negate();
        launchMissile(from,dir,g.target,true);boom(from,200,0xffc070,.3);puff(from,80,2.5);}}}
  }
  if(id==='victory')victoryShow(dt,phT);
  accentMat.emissiveIntensity=id==='victory'?1.3+.7*Math.sin(t*6):.9;
  updateCityGuns(dt,id==='bombard'?ease((phT-3.6)/6):(id==='counter'||id==='reinf'||id==='host'||id==='spear')?1:0,aim,shoot,live);
  updateStory(dt,id,phT);
  updateLaunchers(dt,shoot,live);
  updateDebrisField(dt,t);
  updateBanner(id,phT);
}
