/* Tide City · the longer battle (Oct 22, Bryce: every Last Transmission part 7-10 minutes, nothing left behind).
   Three additions, each hooked in by wrapping director() / resetStory() / tagsEnd() like the Herald convoy (js/tide/15-heralds.js):

   1. EVACUATION (a new phase, 'evac', between the Heralds running and the Hollow King arriving). The outer district is cut off; three
      evacuation shuttles lift civilians to the shipyard, and Herald stragglers who missed the jump fall on them. Keep them off.
   2. THE HARBOR BOARDERS (during the Host landing). Some of the Empty Host's dropships don't go for the Spear: they clamp onto the sea
      guns and board them. Shoot the dropship off in time or the gun is lost. The Host phase also gets more landings.
   3. THE CONVOY CUTSCENE. When the Herald convoy crosses the city, a short shot of the Hollow King's cruisers firing on a transport that
      never fires back. It sets up what the Spear will cost. */
const LONGER=(()=>{
  const EV_DUR=110;   // evac ends early once every shuttle is through (or lost) and the stragglers are down
  {const i=PH.findIndex(p=>p.id==='rout');PH.splice(i+1,0,{id:'evac',dur:EV_DUR});}
  const EVI=PH.findIndex(p=>p.id==='evac');
  FIGHT.add('evac');
  HOST_DROPS.push(37,43,49);   // a longer landing
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3();

  /* ---------- 1. evacuation ---------- */
  const shuttles=[];
  for(let i=0;i<3;i++){const g=new THREE.Group();g.add(new THREE.Mesh(FRG.geo,civMat),new THREE.Mesh(FRG.glow,civGlowMat));
    const e=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x8ae8ff).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));e.position.set(0,0,60);e.scale.setScalar(34);g.add(e);
    g.scale.setScalar(2.6);g.visible=false;scene.add(g);
    shuttles.push({g,pos:g.position,S:new THREE.Vector3(),Cc:new THREE.Vector3(),E:new THREE.Vector3(),t:0,delay:i*9,dur:62,hp:50,max:50,state:'idle',vel:new THREE.Vector3(),spin:0,fx:0,name:['Shuttle Lantern-3','Shuttle Halden','Shuttle Marrow'][i],lastHit:-99,pt:0});}
  const ev={on:false,t:0,lost:0,saved:0,endT:-1,said:new Set()};
  function startEvac(){ev.on=true;ev.t=0;ev.lost=0;ev.saved=0;ev.endT=-1;ev.said=new Set();
    shuttles.forEach((S,i)=>{const a=-.9+i*.9;   // three spots in the outer district, north and to either side
      S.S.set(Math.sin(a)*5400,160,-Math.cos(a)*5400);S.Cc.set(Math.sin(a)*2600,900,-Math.cos(a)*2600+1800);S.E.set(YARD.x+(i-1)*700,YARD.top+60,YARD.z-900);
      S.t=-S.delay;S.hp=S.max;S.state='wait';S.g.visible=false;S.g.rotation.set(0,0,0);S.chasers=[];});}
  function shPos(S,u,o){return bez2(S.S,S.Cc,S.E,clamp(u,0,1),o);}
  function stragglers(S){const n=Math.max(2,Math.round(3*DIFF.tide.mob));
    const idle=fighters.filter(f=>f.state==='idle').slice(0,n);
    idle.forEach((f,k)=>{setCraft(f,false,false);f.home=null;f.ace=false;f.chase=false;f.evac=S;
      f.pos.copy(S.pos).add(_a.set(R(-1,1),0,R(-1,1)).normalize().multiplyScalar(R(2600,3400))).setY(R(600,1100));
      f.v.subVectors(S.pos,f.pos).normalize().multiplyScalar(500);f.state='attack';f.t=0;f.cool=R(.5,1.5);f.g.visible=true;f.tgt.copy(S.pos);S.chasers.push(f);});}
  function hurtShuttle(S,d){if(S.state!=='fly')return;S.hp-=d;S.lastHit=performance.now()/1000;
    if(S.hp<=0){S.state='fall';ev.lost++;S.vel.copy(_a.subVectors(S.E,S.S).normalize().multiplyScalar(120)).setY(-30);S.spin=R(.6,1.1)*(rng()<.5?-1:1);
      boom(S.pos,900,0xfff0c0,.6);boom(S.pos,1500,0xff6a1a,1.6);for(let k=0;k<4;k++)smoke(S.pos.clone().add(_a.set(R(-80,80),R(-40,40),R(-80,80))),R(400,700),5);
      PG.say('Tide City Command',S.name+' is down! It’s going into the water!','alert');
      for(const f of S.chasers)if(f.state==='attack'){f.evac=null;f.state='return';f.t=0;}}}
  function updateEvac(dt,pt){
    if(!ev.on)startEvac();ev.t+=dt;
    for(const S of shuttles){
      if(S.state==='wait'){S.t+=dt;if(S.t>=0){S.state='fly';S.g.visible=true;shPos(S,0,S.pos);boom(S.pos.clone().setY(40),500,0x8ae8ff,.6);if(typeof sfx!=='undefined'&&sfx.liftoff)sfx.liftoff(S.pos,5);   // lifting off with the civilians
        if(S===shuttles[0]||rng()<.8)stragglers(S);}}
      else if(S.state==='fly'){S.t+=dt;const u=S.t/S.dur;if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.dropship','sh'+shuttles.indexOf(S),S.pos,1,1.1);shPos(S,u,S.pos);shPos(S,u+.004,_a);_b.subVectors(_a,S.pos);if(_b.lengthSq()>1){_b.y*=.4;S.g.lookAt(_c.copy(S.pos).sub(_b));}
        S.pt-=dt;if(S.pt<=0){S.pt=.06;puff(_c.copy(_b).normalize().multiplyScalar(-150).add(S.pos),36,1.8);}
        // the stragglers in reach wear it down: hits land along its hull
        let near=0;for(const f of S.chasers)if(f.state==='attack'&&f.pos.distanceTo(S.pos)<800)near++;
        if(near){hurtShuttle(S,dt*near*.85*DIFF.tide.rof);if(rng()<dt*near*3){const p=S.pos.clone().add(_a.set(R(-60,60),R(-20,30),R(-60,60)));boom(p,R(120,220),0xff6a3a,.4);}}
        if(u>=1){S.state='done';S.g.visible=false;ev.saved++;PG.add(1500,S.pos,S.name+' is through');boom(S.pos,400,0x8ae8ff,.6);
          for(const f of S.chasers)if(f.state==='attack'){f.evac=null;f.state='return';f.t=0;}}}
      else if(S.state==='fall'){S.vel.y-=60*dt;S.pos.addScaledVector(S.vel,dt);S.g.rotation.z+=S.spin*dt;S.g.rotation.x+=S.spin*.3*dt;
        S.fx-=dt;if(S.fx<=0){S.fx=.06;boom(S.pos,R(150,300),pick([0xff7a1a,0xffb040]),.6);puff(S.pos,R(100,180),4);}
        if(S.pos.y<0){S.state='lost';S.g.visible=false;const p=S.pos.clone().setY(5);emitSprayAt(p.x,p.z,140,200,1.2);boom(p,1200,0xffffff,1.6);boom(p,700,0xff8a2a,.8);}}}
    // keep the stragglers on their shuttle
    for(const f of fighters){if(!f.evac)continue;if(f.state!=='attack'||f.evac.state!=='fly'){if(f.state==='attack'){f.state='return';f.t=0;}f.evac=null;continue;}
      f.tgt.copy(f.evac.pos).add(_a.set(0,40,0));f.chase=false;}
    // radio: the shuttle lines, then how it went
    const say=(k,at,who,txt,tone)=>{if(pt>=at&&!ev.said.has(k)){ev.said.add(k);PG.say(who,txt,tone);}};
    say('e1',1.5,'Tide City Command','Master, the outer district is cut off. Three evacuation shuttles lifting now, civilians aboard. They’re heading for the shipyard.','alert');
    say('e2',8,'Lt. Michael','Herald fighters turning onto them! Stragglers that missed the jump!','alert');
    say('e3',14,'Elias Veyr','Get those fighters off the shuttles, Michael. Every one of them comes home.');
    const busy=shuttles.some(S=>S.state==='wait'||S.state==='fly'||S.state==='fall')||fighters.some(f=>f.evac);
    if(!busy&&ev.endT<0){ev.endT=pt;
      if(!ev.lost){PG.done('tevac');PG.say('Tide City Command','All three shuttles are down at the shipyard. Every soul accounted for.');}
      else PG.say('Tide City Command',ev.saved?ev.saved+' shuttle'+(ev.saved>1?'s':'')+' through. We lost '+ev.lost+'. Word keep them.':'We lost them. All three.','alert');}
    if(ev.endT>=0&&pt>ev.endT+7)PH[EVI].dur=pt;   // on to the Hollow King
  }
  function resetEvac(){ev.on=false;for(const S of shuttles){S.state='idle';S.g.visible=false;}for(const f of fighters)f.evac=null;PH[EVI].dur=EV_DUR;}

  /* ---------- 2. the harbor boarders ---------- */
  const BOARD_AT=[12,24,38],BOARD_T=14;
  const board=[];const beamMat=new THREE.MeshBasicMaterial({color:C(0xb46aff).multiplyScalar(2),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false});
  for(let i=0;i<BOARD_AT.length;i++){const D=makeDrop();D.harbor=true;drops.push(D);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(14,40,1,12,1,true).translate(0,-.5,0),beamMat);beam.visible=false;scene.add(beam);board.push({D,beam,g:null,t:0});}
  let hClock=0,hSaid=new Set();
  function launchBoarder(B){const ok=cannons.filter(g=>!g.broken&&!board.some(o=>o!==B&&o.g===g&&(o.D.state==='hbin'||o.D.state==='hb')));if(!ok.length)return;
    const g=pick(ok),D=B.D,gp=g.yawG.getWorldPosition(new THREE.Vector3()),out=_a.set(g.x,0,g.z).normalize();
    B.g=g;B.t=0;D.hS=gp.clone().addScaledVector(out,7000).setY(1100);D.hC=gp.clone().addScaledVector(out,1600).setY(700);D.hH=gp.clone().setY(gp.y+430);
    D.state='hbin';D.t=0;D.hp=DROP_HP;D.dead=false;D.g.visible=true;D.g.rotation.set(0,0,0);D.pos.copy(D.hS);
    if(!hSaid.has('b1')){hSaid.add('b1');PG.say('Tide City Command','Host dropships breaking for the harbor! They’re going for the sea guns!','alert');}}
  function updateBoarders(dt,id){
    if(id==='host'){hClock+=dt;for(const B of board){const at=BOARD_AT[board.indexOf(B)];if(hClock>=at&&hClock-dt<at)launchBoarder(B);}}
    for(const B of board){const D=B.D;
      if(D.state==='hbin'){D.t+=dt;const u=Math.min(1,D.t/9);bez2(D.hS,D.hC,D.hH,u,_b);_c.subVectors(_b,D.pos);D.pos.copy(_b);if(_c.lengthSq()>.01){_c.y*=.3;D.g.lookAt(_a.copy(D.pos).sub(_c));}
        if(u>=1){D.state='hb';D.t=0;B.beam.visible=true;if(!hSaid.has('b2')){hSaid.add('b2');PG.say('Elias Veyr','It’s clamping onto the gun! Shoot it off before they’re aboard!','alert');}}}
      else if(D.state==='hb'){D.t+=dt;const gp=B.g.yawG.getWorldPosition(_a);D.pos.y=gp.y+430+Math.sin(D.t*3)*6;
        B.beam.position.copy(D.pos);B.beam.scale.set(1,D.pos.y-gp.y-120,1);beamMat.opacity=.4+.2*Math.sin(D.t*12);
        if(rng()<dt*6)boom(_b.copy(gp).add(_c.set(R(-90,90),R(120,220),R(-90,90))),R(60,120),0xb46aff,.5);
        if(D.t>=BOARD_T){B.beam.visible=false;breakCannon(B.g,_c.set(B.g.x,0,B.g.z).normalize().clone());flashBanner('The Host boarded a sea gun');
          D.state='out';D.t=0;D.outDir=_c.set(B.g.x,0,B.g.z).normalize().clone();}}
      else B.beam.visible=false;}}
  function resetBoarders(){hClock=0;hSaid=new Set();for(const B of board){B.D.state='idle';B.D.dead=true;B.D.g.visible=false;B.beam.visible=false;}}

  /* ---------- 3. the convoy cutscene ---------- */
  let cvT=-1,cvPlayed=false;
  function updateConvoyCut(dt){
    if(!CONVOY.on){if(cvT>=0&&!cvPlayed)cvT=-1;return;}
    if(cvT<0)cvT=0;cvT+=dt;
    if(cvPlayed||cvT<12||CUTS.on)return;cvPlayed=true;
    const Tg=CONVOY.ships[0].g,w2=WAVE2.filter(c=>!c.crash&&c.grp.visible);let ft=0;
    CUTS.play([
      {dur:9,camAt:(u,t,o)=>o.copy(Tg.position).add(_a.set(-2600+u*600,800,2200)),lookAt:(u,t,o)=>o.copy(Tg.position),
        say:[[.4,'Lt. Michael','He’s firing on the transport, Master. It isn’t even shooting back.'],[0,'Elias Veyr','He doesn’t care who dies today. Remember that, when this is over.']],
        fn:(t,dt)=>{ft-=dt;if(ft<=0&&w2.length){ft=R(.3,.6);const c=pick(w2),from=shipLocalPoint(c,true),to=Tg.position.clone().add(_b.set(R(-400,400),R(-150,250),R(-400,400)));
          boom(from,220,HOLLOW_GLOW,.35);fire(from,to,2600,'hollow',p=>{boom(p,420,0xffe0b0,.5);boom(p,700,0xffb45a,.9);});}}},
    ]);}

  return{EVI,updateEvac,resetEvac,updateBoarders,resetBoarders,updateConvoyCut,shuttles,get cvPlayed(){return cvPlayed;},set cvPlayed(v){cvPlayed=v;},ev};
})();
{const _director=director;director=function(dt,t){_director(dt,t);const id=PH[ph].id;
   if(id==='evac')LONGER.updateEvac(dt,phT);
   LONGER.updateBoarders(dt,id);LONGER.updateConvoyCut(dt);};
 const _reset=resetStory;resetStory=function(){_reset();LONGER.resetEvac();LONGER.resetBoarders();LONGER.cvPlayed=false;};
 const _te=tagsEnd;tagsEnd=function(){const now=performance.now()/1000;
   if(PH[ph].id==='evac')for(const S of LONGER.shuttles)if(S.state==='fly'&&(aimDot(S.pos)>.97||now-S.lastHit<3||S.pos.distanceTo(player)<4000))
     tagShip(S,_tagv.copy(S.pos).add(_tagw.set(0,120,0)),S.name+' · civilians',S.hp/S.max,false,true,now-S.lastHit<.12);
   _te();};}
const _tagv=new THREE.Vector3(),_tagw=new THREE.Vector3();
