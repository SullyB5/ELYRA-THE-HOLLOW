/* Tide City · The First Word · the two endings (Oct 27, Bryce: "Build Real Ending"; docs/ENDINGS.md). Both hang off the Spear's
   FIRE / HOLD order (SPEAR_ORDER, js/tide/11-story.js). Loads after the rest of Tide City and hooks in by wrapping shootBeam(),
   endingCut(), tideResults(), director() and resetStory().

   THE SPEAR FIRES (the normal ending). Any shot counts (Bryce, Oct 26). The discharge doesn't stop at the ship it was aimed at: a shell
   of light goes out from the Spear's tip across the whole sky and kills everyone in it: the Hollow King's fleet, his fighters, any
   Herald still flying, and Lieutenant Michael in his interceptor. Tide City stands. Then Elias, from the Vigil in her cradle, raises
   the device Michael carried down off the mountain (The Last Signal); its dome covers the city, and the Host left on the plinth burn
   inside it. Under the dome the Heralds' broadcast finally comes through clean: they had been asking for exactly this. Later missions
   follow a Pathfinder (saved as the route, below).

   THE SPEAR NEVER FIRES (the secret ending). HOLD starts the device: Elias has it brought out of the Vigil's hold, DEVICE_T seconds to
   wake (radio and pop-ups count it in). Hold the city until then (it can still fall; the Spear still asks again at 40% and 20%, and
   firing then is the normal ending). When it wakes, or if his fleet comes down to the guns first, the dome rises over Tide City
   before any Herald dies. Inside it the fully corrupted burn and its edge is a shock wall against them (Bryce's rule): his escorts
   break up as it passes, the Harbinger turns and jumps (the King is defeated, not confirmed dead), the Host on the plinth are gone.
   The Herald transport and its escorts come back under it with their guns cold, and speak: the first word. Everyone is saved.

   In game text the device stays unnamed ("the device", "what Michael brought down"); docs call it the suppressor (CANON-NOTES #28).
   All dialogue here is placeholder for Bryce's rewrite.
   Saved: localStorage 'elyra.route' {route:'spear'|'hold', michael:'dead'|'alive', at}, and elyra.flags gets spearFired /
   michaelLost / heraldsSpared. */
const ENDINGS=(()=>{
  const DEVICE_T=75,DOME_R=13500;
  const st={route:null,devT:-1,devSaid:new Set(),cut:false,dome:0,disc:-1,discHit:new Set(),kingGone:false};
  const _a=new THREE.Vector3(),_b=new THREE.Vector3();
  const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  const cradle=()=>_b.set(flag.grp.position.x,0,flag.grp.position.z);

  /* ---------- the dome: the same shell of light as the White City's (js/pathfinder3/01-world.js), city-sized. Drawn from the
     loading screen on (scaled to nothing, so its shader is compiled there and not in the middle of the ending) ---------- */
  const DU={uT:{value:0},rise:{value:0},hold:{value:1}};
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1,96,48,0,Math.PI*2,0,Math.PI/2),new THREE.ShaderMaterial({uniforms:DU,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,
    vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=normalize(w.xyz-cameraPosition);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`varying vec3 vP;varying vec3 vN;varying vec3 vW;uniform float uT,rise,hold;
    float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){float h=vP.y;if(h>rise)discard;
      vec2 q=vec2(atan(vP.z,vP.x)*60.0,h*70.0);vec2 g=vec2(q.x,q.y+mod(floor(q.x),2.0)*.5);vec2 f=abs(fract(g)-.5);float cell=smoothstep(.42,.5,max(f.x,f.y));
      float fres=pow(1.0-abs(dot(normalize(vN),-vW)),2.2);
      float front=smoothstep(rise-.05,rise,h)*step(h,rise)*(1.0-step(.999,rise));
      float lines=smoothstep(.97,1.0,sin(atan(vP.z,vP.x)*48.0))*(.5+.5*sin(h*40.0-uT*3.0));
      vec3 c=vec3(.55,.72,1.0)*(cell*.16+fres*.3+lines*.2)+vec3(1.0,.95,.85)*front*1.4+vec3(.7,.85,1.0)*smoothstep(.03,0.0,h)*.8;
      gl_FragColor=vec4(c*hold,1.0);}`}));
  dome.frustumCulled=false;dome.renderOrder=2;dome.scale.setScalar(.001);dome.position.set(0,-50,7600);scene.add(dome);
  // the pillar of light out of the Vigil's hold
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(40,90,1,24,1,true).translate(0,.5,0),new THREE.MeshBasicMaterial({color:C(0xc8d8ff).multiplyScalar(1.6),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}));
  pillar.frustumCulled=false;scene.add(pillar);
  function domeAt(k,rise){const c=cradle();dome.position.set(c.x,-20,c.z);dome.scale.setScalar(Math.max(.001,DOME_R*k));DU.rise.value=rise;}
  // the Spear's discharge: a shell of light going out from its tip across the whole sky
  const disc=new THREE.Mesh(new THREE.SphereGeometry(1,48,24),new THREE.MeshBasicMaterial({color:C(0xfff0c8).multiplyScalar(2.2),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}));
  disc.frustumCulled=false;disc.scale.setScalar(.001);disc.position.copy(SPEAR_TOP);scene.add(disc);

  function save(route){st.route=route;
    try{localStorage.setItem('elyra.route',JSON.stringify({route,michael:route==='spear'?'dead':'alive',at:Date.now()}));
      const F=JSON.parse(localStorage.getItem('elyra.flags')||'{}');Object.assign(F,route==='spear'?{spearFired:true,michaelLost:true,heraldsSpared:false}:{spearFired:false,michaelLost:false,heraldsSpared:true});
      localStorage.setItem('elyra.flags',JSON.stringify(F));}catch(_){}}
  // after an ending the Spear never asks again
  function silenceSpear(){SPEAR_ORDER.ask=()=>false;}

  /* ---------- the discharge kills whatever its shell has reached (every frame while it grows) ---------- */
  function updateDischarge(dt){if(st.disc<0)return;st.disc+=dt;
    const r=Math.min(32000,600+st.disc*st.disc*2400+st.disc*3000);disc.scale.setScalar(r);disc.material.opacity=Math.max(0,.55*(1-st.disc/5));disc.visible=st.disc<5.2;
    const reach=p=>p.distanceTo(SPEAR_TOP)<r;
    for(const c of capitals)if(c.grp.visible&&!c.crash&&reach(c.grp.position))startCrash(c);
    for(const f of fighters)if(f.state!=='idle'&&f.state!=='dead'&&reach(f.pos))killFighter(f,false);
    for(const D of drops)if(!D.dead&&reach(D.pos))killDrop(D,null,false);
    for(const s of CONVOY.ships)if(s.g.visible&&s.g.position.y>BAY2.top+400&&reach(s.g.position)&&!st.discHit.has(s)){st.discHit.add(s);boom(s.g.position,s.big?4200:900,0xfff0c8,1.4);boom(s.g.position,s.big?3000:600,0xff8a3a,2.2);s.g.visible=false;}
    if(pShip.visible&&reach(pShip.position)&&!st.discHit.has(pShip)){st.discHit.add(pShip);const p=pShip.position.clone();boom(p,520,0xfff6e0,.6);boom(p,700,0xff9a4a,1.4);smoke(p,600,5);pShip.visible=false;
      st.wreck={p:p.clone(),v:V3(R(-40,40),-20,R(-40,40)),t:0};if(typeof sfx!=='undefined'&&sfx.crash)sfx.crash(p);}}
  // Michael's interceptor going down into the bay, burning
  function updateWreck(dt){const w=st.wreck;if(!w||w.done)return;w.t+=dt;w.v.y-=60*dt;w.p.addScaledVector(w.v,dt);w.fx=(w.fx||0)-dt;if(w.fx<=0){w.fx=.08;boom(w.p,R(60,110),0xff8a3a,.5);smoke(w.p,R(80,140),3);}
    if(w.p.y<=0){w.done=true;w.p.y=0;emitSprayAt(w.p.x,w.p.z,90,60,1.2);boom(w.p.clone().setY(8),300,0xffffff,1);}}

  /* ---------- the normal ending: the Spear fires ---------- */
  function fireCut(target){if(st.cut)return;st.cut=true;save('spear');silenceSpear();st.devT=-1;tResults=true;
    const ST=SPEAR_TOP;
    // Michael in his interceptor, whatever he was doing when the order went out (canon: he is in the sky)
    if(mode!=='pilot'){pShip.visible=true;}
    const me=pShip.position.clone();const side=V3(me.x-ST.x,0,me.z-ST.z).normalize();
    CUTS.play([
      // the beam, and the light that doesn't stop
      {dur:6,camAt:(u,t,o)=>o.copy(me).addScaledVector(side,140-u*30).add(_a.set(0,46+u*10,0)),lookAt:(u,t,o)=>o.copy(ST).lerp(me,.15),fov:[62,70],
        say:[[.3,'Lt. Michael','Master, the light... it isn’t stopping at the ship. It’s coming out across the whole...','alert'],[0,'Elias Veyr','Michael! Pull out! Pull out!','alert']],
        fn:(t,dt)=>{if(t>.6&&st.disc<0){st.disc=0;flashScreen(.5);if(typeof sfx!=='undefined'&&sfx.moment)sfx.moment('spear');}updateDischarge(dt);updateWreck(dt);}},
      // the sky over the bay: everything in it is coming down
      {dur:8,cam:[[YARD.x-3400,1500,YARD.z+4200],[YARD.x-3000,1700,YARD.z+3800]],look:[[0,2400,-2000],[0,1800,-1500]],
        say:[[.6,'Tide City Command','Vigil... we’ve lost everything in the sky. Every ship. His, and ours.','alert'],[0,'Elias Veyr','Michael. Michael, answer me.']],
        fn:(t,dt)=>{updateDischarge(dt);updateWreck(dt);}},
      // the bay, where his interceptor went in
      {dur:6,camAt:(u,t,o)=>{const w=st.wreck?st.wreck.p:me;return o.set(w.x+260-u*40,60+u*10,w.z+320);},lookAt:(u,t,o)=>{const w=st.wreck?st.wreck.p:me;return o.set(w.x,Math.max(0,w.y*.5),w.z);},
        say:[[1,'Tide City Command','No transponder. Lieutenant Michael’s interceptor is down in the bay. No signal.']],fn:(t,dt)=>{updateDischarge(dt);updateWreck(dt);}},
      // the Vigil in her cradle: Elias raises what Michael brought down off the mountain
      {dur:7,cam:[[YARD.x+3600,1100,YARD.z+4200],[YARD.x+3200,1300,YARD.z+3700]],look:[[YARD.x,400,YARD.z],[YARD.x,700,YARD.z]],
        say:[[.4,'Tide City Command','Master, the Host are still on the plinth!','alert'],[0,'Elias Veyr','Bring up the device. The one he carried down off that mountain. Now.']],
        fn:(t,dt)=>{updateWreck(dt);riseFX(t,dt,0);}},
      // the dome rises over the city; the Host on the plinth burn inside it
      {dur:9,cam:[[3200,2600,-5200],[2600,3200,-4400]],look:[[0,600,3000],[0,900,3600]],
        say:[[.8,'Tide City Command','It’s spreading over the whole city! The Host on the plinth... they’re burning up inside it!','alert'],[0,'Keeper Sergeant','Our people are fine. It’s only them.']],
        fn:(t,dt)=>{riseFX(t,dt,1);burnHost(t);}},
      // under the dome, the Heralds' broadcast comes through clean
      {dur:11,cam:[[SPEAR.x+700,420,SPEAR.z+900],[SPEAR.x+560,520,SPEAR.z+700]],look:[[ST.x,ST.y*.6,ST.z]],
        say:[[.5,'Tide City Command','Master... the Heralds’ broadcast. The one they’ve repeated since Astraea. Under the dome it’s clean.'],
             [0,'Herald broadcast','…raise what the Pathfinders carried. Raise it over your city. Do not fire the weapon beneath you…','enemy'],
             [0,'Elias Veyr','They were telling us. The whole time. And we fired.']],fn:(t,dt)=>{riseFX(99,dt,1);}},
      {dur:5,black:true,small:'Last Transmission · Level 06 · Tide City',cap:'Lieutenant Michael · lost over Tide City',cam:[[0,2600,10500]],look:[[0,900,-2500]]},
    ],{hush:true,score:'sorrow',duck:.18,done:()=>tideResults(true)});}

  /* ---------- the secret ending: the Spear never fires ---------- */
  function holdCut(why){if(st.cut)return;st.cut=true;save('hold');silenceSpear();st.devT=-1;tResults=true;
    const ST=SPEAR_TOP,H=WAVE2.find(c=>c.model==='harbinger');pShip.visible=true;
    const bay=V3(BAY2.x,0,BAY2.z),T=CONVOY.ships[0];
    CUTS.play([
      // the Vigil's hold opens: the column of light, and the dome rising out of it
      {dur:7,cam:[[YARD.x+3600,1100,YARD.z+4200],[YARD.x+3100,1500,YARD.z+3600]],look:[[YARD.x,500,YARD.z],[YARD.x,1800,YARD.z]],
        say:[[.4,'Vigil crew','Master, it’s awake! It’s lifting out of the hold!','alert'],[0,'Elias Veyr','Then let it rise.']],
        fn:(t,dt)=>{riseFX(t,dt,0);}},
      // its edge sweeps out over the bay to his fleet: the fully corrupted break up where it touches them
      {dur:9,cam:[[-6200,5200,9800],[-5400,5600,8600]],look:[[0,1800,-1500],[0,2200,-2500]],
        say:[[.6,'Tide City Command','It’s over the whole city... it’s reaching his ships! They’re breaking up where it touches them!','alert'],
             [0,'The Hollow King','No. Not that. Not again.','enemy']],
        fn:(t,dt)=>{riseFX(t+7,dt,1);shockWall();if(t>6&&H&&!st.kingGone)kingJumps(H);}},
      // the plinth: the Host are gone, the Keepers standing
      {dur:6,cam:[[SPEAR.x+1300,900,SPEAR.z+1500],[SPEAR.x+1050,1000,SPEAR.z+1200]],look:[[ST.x,80,ST.z],[ST.x,300,ST.z]],
        say:[[.4,'Keeper Sergeant','The Host at the plinth... burned out where they stood. Every one of ours is still standing. We’re fine!']],fn:(t,dt)=>{riseFX(99,dt,1);burnHost(t+4);shockWall();}},
      // the Heralds come back in under it, weapons cold, and speak
      {dur:11,camAt:(u,t,o)=>o.copy(bay).add(_a.set(-1900+u*300,700+u*120,2600-u*400)),lookAt:(u,t,o)=>o.copy(bay).add(_a.set(0,500,0)),
        say:[[.6,'Tide City Command','Herald ships coming back in... they’re inside the dome. Their weapons are cold.'],
             [0,'Herald transport','Keepers of Tide City. At last you can hear us.','enemy'],
             [0,'Lt. Michael','Master... they’re talking to us.'],[0,'Elias Veyr','Then we answer.']],
        fn:(t,dt)=>{riseFX(99,dt,1);heraldsReturn(t,dt);}},
      // Michael, alive, in the sky under the dome with them
      {dur:7,camAt:(u,t,o)=>o.copy(pShip.position).add(_a.set(90-u*20,30,140-u*20)),lookAt:(u,t,o)=>o.copy(pShip.position).add(_a.set(0,0,-200)),
        say:[[.4,'Lt. Michael','Everyone up here is still flying, Master. All of us.'],[0,'Elias Veyr','And all of them.']],fn:(t,dt)=>{riseFX(99,dt,1);heraldsReturn(t+11,dt);pShip.position.addScaledVector(_a.set(0,0,-1).applyQuaternion(pShip.quaternion),dt*120);}},
      {dur:5,black:true,small:'Last Transmission · Level 06 · Tide City',cap:'The First Word',cam:[[0,2600,10500]],look:[[0,900,-2500]]},
    ],{hush:true,score:'calm',duck:.18,done:()=>tideResults(true)});}

  // the dome's rise (t: seconds into it; full in ~7 s) and the pillar out of the Vigil's hold
  function riseFX(t,dt,stage){DU.uT.value+=dt;const c=cradle();pillar.position.set(c.x,flag.grp.position.y,c.z);pillar.scale.set(1,stage?6000:Math.min(6000,t*1400),1);
    pillar.material.opacity=stage?.25+.1*Math.sin(DU.uT.value*3):Math.min(.8,t*.4);
    const k=stage?sstep(0,7,t):Math.max(0,(t-3)/4)*.08;st.dome=Math.max(st.dome,k);domeAt(.05+.95*st.dome,stage?Math.min(1,.15+st.dome):Math.min(.15,t*.04));
    if(stage&&t<7&&t>.2&&!st.domeSnd){st.domeSnd=1;flashScreen(.25);if(typeof sfx!=='undefined'&&sfx.wake)sfx.wake();}}
  // the dome's edge against the fully corrupted: his escorts inside it break up; his fighters and the Host's dropships burn
  function shockWall(){const R=DOME_R*Math.max(.05,st.dome),c=cradle();const inside=p=>Math.hypot(p.x-c.x,p.z-c.z)<R;
    for(const s of WAVE2)if(s.model!=='harbinger'&&s.grp.visible&&!s.crash&&inside(s.grp.position))startCrash(s);
    for(const f of fighters)if(f.state!=='idle'&&f.state!=='dead'&&f.home&&f.home.wave===2&&inside(f.pos))killFighter(f,false);   // (his: any Herald fighter still up is spared)
    for(const D of drops)if(!D.dead&&inside(D.pos))killDrop(D,null,false);}
  function burnHost(t){if(t<1.5)return;for(const tr of troops)if(tr.state!=='dead'&&rng()<.08)killTrooper(tr,null);}
  // the Harbinger turns and jumps out: defeated, not confirmed dead
  function kingJumps(H){st.kingGone=true;const p=H.grp.position.clone();boom(p,6000,0xffffff,.7);boom(p,4000,0xc080ff,1.4);if(typeof sfx!=='undefined'&&sfx.jump)sfx.jump(p);H.grp.visible=false;H.crash={t:99,v:V3(),spin:0,impact:true,settled:true,fx:99,jumped:true};}
  // the Herald transport (landed beside the Vigil, or still flying) and its escorts, back in under the dome, guns cold
  function heraldsReturn(t,dt){const T=CONVOY.ships[0];if(!T.g.visible){T.g.visible=true;T.g.position.set(BAY2.x,1200,BAY2.z+2400);T.g.rotation.set(0,Math.PI,0);}
    CONVOY.ships.forEach((s,i)=>{if(i===0)return;if(!s.g.visible){s.g.visible=true;s.g.position.set(BAY2.x+(i===1?900:-900),900,BAY2.z+3200);s.g.rotation.set(0,Math.PI,0);}
      s.g.position.lerp(_a.set(BAY2.x+(i===1?700:-700),620,BAY2.z+400),1-Math.exp(-dt*.25));});}

  /* ---------- the device's countdown after HOLD ---------- */
  const DEV_LINES=[[1,'Elias Veyr','And bring up the device Michael carried down off that mountain. Get it out of the Vigil’s hold. If Rhen was right, it does what the Spear can’t.','',7],
    [16,'Vigil crew','Device is out of the hold, Master. It’s… waking. Like it knows where it is.'],
    [38,'Tide City Command','Device at half! Keep them off the Vigil!','alert'],
    [58,'Elias Veyr','Michael, stay over the city. When it rises, be under it.','',5],
    [70,'Vigil crew','Seconds now!','alert']];
  function updateDevice(dt){if(st.cut||st.devT<0)return;st.devT+=dt;
    for(const [at,who,txt,tone,dur] of DEV_LINES)if(st.devT>=at&&!st.devSaid.has(at)){st.devSaid.add(at);PG.say(who,txt,tone,dur);}
    for(const k of[25,50,75])if(st.devT>=DEVICE_T*k/100&&!st.devSaid.has('p'+k)){st.devSaid.add('p'+k);flashBanner('The device · '+k+'%');}
    if(st.devT>=DEVICE_T&&!CUTS.on&&PH[ph].id!=='fallen'&&cityHP>0)holdCut('device');}

  /* ---------- hooks ---------- */
  // the first shot from the Spear is the normal ending
  {const _sb=shootBeam;shootBeam=function(c){_sb(c);if(!st.cut&&!st.route)setTimeout(()=>fireCut(c),350);};}
  // his fleet down to the guns without a shot: the dome rises anyway (the secret ending)
  endingCut=function(){holdCut('guns');};
  {const _d=director;director=function(dt,t){_d(dt,t);
    if(!st.cut&&st.devT<0&&SPEAR_ORDER.order==='hold'&&PH[ph].id!=='fallen'){st.devT=0;}
    updateDevice(dt);if(st.disc>=0&&!CUTS.on){updateDischarge(dt);updateWreck(dt);}};}
  {const _r=resetStory;resetStory=function(){_r();st.route=null;st.devT=-1;st.devSaid=new Set();st.cut=false;st.dome=0;st.disc=-1;st.discHit=new Set();st.kingGone=false;st.wreck=null;st.domeSnd=0;
    domeAt(.001/DOME_R,0);pillar.material.opacity=0;disc.scale.setScalar(.001);disc.material.opacity=0;};}
  {const _tr=tideResults;tideResults=function(win){if(!st.route||!win)return _tr(win);tResults=true;
    const D=`Threat level: ${DIFF.name}. Frigates ${score.frigates} · fighters ${score.fighters} · capital ships ${score.capitals} · dropships ${hostStats.drops} · troopers ${hostStats.troops}.`;
    if(st.route==='spear')PG.finish({title:'THE FIRST WORD',
      text:`The Spear fired, and its light went out across the whole sky. The Hollow King’s fleet came down, and every soul up there with it: Lieutenant Michael among them. Tide City stands. Under the dome Elias raised afterwards, the Heralds’ broadcast came through at last: they had been asking for that, not the Spear. The Keepers go on without him. What comes next follows the Pathfinders. ${D}`,
      buttons:[{text:'Play again',onClick:()=>location.reload(),primary:true},{text:'Menu',href:'index.html'}]});
    else PG.finish({title:'THE FIRST WORD',
      text:`The Spear never fired. The device Michael carried down off the mountain rose over Tide City, and inside it the Hollow burned out of everything it had fully taken. His escorts broke up at its edge; the Harbinger turned and ran. The Heralds came back under it with their guns cold, and spoke. Everyone in the sky came home. ${D}`,
      buttons:[{text:'Keep flying',close:true,primary:true},{text:'Play again',onClick:()=>location.reload()},{text:'Menu',href:'index.html'}]});};}
  return{st,fireCut,holdCut,get route(){return st.route;}};
})();
