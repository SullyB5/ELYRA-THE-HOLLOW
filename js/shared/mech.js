/* Elyra shared · the Herald mech (Oct 24, Bryce's Herold_Mech model, rigged and animated: models/herald-mech.glb).
   A red Herald war machine in Pathfinder's Herald war (Dead Ground's basin, the White City's streets). It walks a short patrol,
   and when something is in reach it plants its feet, turns its body on it and fires: machine-gun bursts, then both cannons.
   It fights amber first; it turns on Rhen's team if they come close or hurt it. Rifles barely mark it (like a Hollow turret):
   the Breaker, grenades and the Lance do. It counts as a turret for aiming and blasts (TURRETS in js/origin/03-play.js, with its
   own radius r and its own death).

   Its one animation clip ("Pelter|Action", 20.8 s) holds every move in a row, so it is played in pieces by time:
     walk 0.43–4.17 (looped while it walks), guns 6.27–9.96 (the machine guns sweep), cannons 15.03–17.5 (both recoil).
   MECH.spawn(x, z, {path:[V3,...], yaw, team}) · MECH.update(dt) is called from the chapter's loop through updateTurrets. */
const MECH=(()=>{
  const LIST=[],SEG={walk:[.43,4.17],guns:[6.27,9.96],cannon:[15.03,17.5],idle:[5.2,6.2]},H_M=6.8;   // height in metres
  // the file is 7.8 units tall, standing on y = 0, guns toward -z; a little warmth so it reads against the sand
  const matC=new Map();
  function prep(m){const k=H_M/7.8;m.scale.setScalar(k);m.traverse(c=>{if(!c.isMesh)return;c.castShadow=true;c.receiveShadow=true;c.frustumCulled=false;
    let mt=matC.get(c.material);if(!mt){mt=c.material.clone();if(mt.metalness>.6)mt.metalness=.6;mt.emissive=C(0x2a0a06);mt.emissiveIntensity=1;matC.set(c.material,mt);}c.material=mt;});return m;}
  /* Oct 25 (Bryce: big lag spikes when the mech spawns in, in the White City): the walker's file was only fetched, unpacked and
     compiled when it walked in. A page that has walkers sets window.WARM_MECH: the file comes in with the level, and one copy stands
     under the ground through the loading screen so its shaders and textures are ready (js/origin/03-play.js takes it away on Begin). */
  let warmO=null;
  if(window.WARM_MECH)MODELS.rigged('herald-mech').then(({scene:m})=>{prep(m);m.position.set(0,-80,0);scene.add(m);warmO=m;}).catch(()=>{});
  function unwarm(){if(warmO&&warmO.parent)warmO.parent.remove(warmO);warmO=null;}
  const _a=new THREE.Vector3(),_b=new THREE.Vector3();
  function spawn(x,z,o){o=o||{};const g=new THREE.Group();g.position.set(x,groundY(x,z),z);g.rotation.y=o.yaw||0;scene.add(g);
    const head=new THREE.Object3D();head.position.set(0,H_M*.72,0);g.add(head);   // what you aim at (moved onto the torso when the model arrives)
    const Mc={g,head,x,z,y:g.position.y,yaw:o.yaw||0,hp:DMG.CLASS.mech.hp,max:0,dead:false,name:'Herald mech',mech:true,r:3.1,
      team:o.team||'red',path:(o.path||[]).map(p=>p.clone()),pi:0,state:'walk',t:SEG.walk[0],seg:'walk',cool:R(1,3),tg:null,retarget:0,
      aggro:0,mixer:null,action:null,mz:{},ob:{x,z,r:2.6,h:6},smoke:0,sink:0,shotT:0,cannonFired:0};
    Mc.max=Mc.hp;OBST.push(Mc.ob);TURRETS.push(Mc);LIST.push(Mc);
    MODELS.rigged('herald-mech').then(({scene:m,clips})=>{if(Mc.gone)return;
      // the file is 7.8 units tall, standing on y = 0, guns toward -z
      prep(m);
      m.traverse(c=>{if(c.isBone){const n=c.name;if(/^Torso_?0?1?$/.test(n)||/^Torso_01/.test(n))Mc.torso=c;if(/^MGL/.test(n)&&!Mc.mz.mgL)Mc.mz.mgL=c;if(/^MGR/.test(n)&&!Mc.mz.mgR)Mc.mz.mgR=c;
          if(/^CannonL\d*_/.test(n)&&!Mc.mz.cL)Mc.mz.cL=c;if(/^CannonR\d*_/.test(n)&&!Mc.mz.cR)Mc.mz.cR=c;}});
      g.add(m);Mc.model=m;
      if(clips&&clips[0]){Mc.mixer=new THREE.AnimationMixer(m);Mc.action=Mc.mixer.clipAction(clips[0]);Mc.action.play();Mc.action.paused=true;}
    }).catch(e=>console.warn('mech',e&&e.message));
    return Mc;}
  // where a gun's shot leaves: the bone, pushed out along the mech's facing
  function muzzleOf(Mc,b,fw){if(b){b.getWorldPosition(_a);}else{Mc.head.getWorldPosition(_a);}
    _b.set(-Math.sin(Mc.yaw),0,-Math.cos(Mc.yaw));return _a.clone().addScaledVector(_b,fw);}
  function pickTarget(Mc){let best=null,bd=1e9;const here=Mc.g.position;
    for(const E of ENEMIES){if(E.H.dead||!E.team||E.team===Mc.team)continue;const d=here.distanceTo(E.pos);if(d<85&&d<bd){bd=d;best={pos:E.pos,E};}}
    const near=Mc.aggro>0?95:48;
    if(P.alive&&P.input){const d=here.distanceTo(P.pos);if(d<near&&d*.7<bd){bd=d*.7;best={pos:P.pos,player:true};}}
    for(const A of ALLIES){if(!A.on||A.H.dead)continue;const d=here.distanceTo(A.pos);if(d<near*.8&&d<bd){bd=d;best={pos:A.pos,A};}}
    return best;}
  function shoot(Mc,heavy,side){const tg=Mc.tg;if(!tg)return;const from=heavy?muzzleOf(Mc,side<0?Mc.mz.cL:Mc.mz.cR,2.6):muzzleOf(Mc,side<0?Mc.mz.mgL:Mc.mz.mgR,1.4);
    const to=tg.pos.clone().add(_b.set(0,1.2,0)),d=from.distanceTo(to);    const hit=rng()<DMG.hitChance();if(!hit)to.add(_b.set(R(-2.5,2.5),R(-.5,1.5),R(-2.5,2.5)));
    boom(from,heavy?2.2:.9,0xff5a2a,heavy?.25:.08);const stop=wallBlocks(from,to),T0=tg;
    if(!heavy&&typeof sfx!=='undefined'&&sfx.next)sfx.next('gun.herald.mech');   // its machine guns (the cannons are gun.heavy)
    fire(from,(stop||to).clone(),heavy?150:190,heavy?'heavy':'rrifle',q=>{if(stop){hitWall(heavy?24:8,q);return;}
      if(heavy){boom(q,3.2,0xff8a3a,.5);puff(q,1.6,1.4);
        // the cannon's shell bursts: everyone close is hurt, Herald or not
        for(const E of ENEMIES)if(!E.H.dead&&E.team!==Mc.team&&E.pos.distanceTo(q)<3.5)hurtEnemy(E,2*DMG.LEGACY,'');
        if(P.alive&&P.pos.distanceTo(q)<3.2)hurtPlayer(hit&&T0.player?22:10,Mc.g.position);if(T0.A&&hit)hurtAlly(T0.A,18);}
      else{boom(q,.8,0xff6a4a,.2);if(hit){if(T0.player)hurtPlayer(6,Mc.g.position);else if(T0.A)hurtAlly(T0.A,5);else if(T0.E)hurtEnemy(T0.E,DMG.LEGACY,'');}}});
    if(typeof sfx!=='undefined'&&heavy&&sfx.blast)sfx.blast(from);}
  function setSeg(Mc,s){if(Mc.seg===s)return;Mc.seg=s;Mc.t=SEG[s][0];Mc.cannonFired=0;}
  function update(dt){for(const Mc of LIST){if(Mc.gone)continue;
    if(Mc.dead){Mc.sink=Math.min(1,Mc.sink+dt*.5);Mc.g.rotation.z=Mc.sink*.22;Mc.g.position.y=Mc.y-Mc.sink*1.6;
      Mc.smoke-=dt;if(Mc.smoke<=0){Mc.smoke=.2;puff(Mc.head.getWorldPosition(_a).clone().add(_b.set(R(-1,1),R(0,1),R(-1,1))),R(2,3.5),3);}continue;}
    Mc.aggro=Math.max(0,Mc.aggro-dt);Mc.retarget-=dt;if(Mc.retarget<=0||(Mc.tg&&Mc.tg.E&&Mc.tg.E.H.dead)){Mc.retarget=R(1.5,2.5);Mc.tg=pickTarget(Mc);}
    const tg=Mc.tg,here=Mc.g.position;
    if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.mech',LIST.indexOf(Mc),here,Mc.seg==='walk'?1:.6,Mc.seg==='walk'?1.12:.92);   // its engine
    // (its line of sight starts outside its own body: its obstacle in OBST would otherwise block every shot, and it never fired)
    let see=false;if(tg){const dx=tg.pos.x-here.x,dz=tg.pos.z-here.z,d=Math.hypot(dx,dz)||1,k=Math.min(.9,(Mc.ob.r+.6)/d);
      see=!blocked(_a.set(here.x+dx*k,here.y+5,here.z+dz*k),_b.copy(tg.pos).setY(tg.pos.y+1.3));}
    if(tg&&see){   // plant the feet, turn on it, fire
      const want=Math.atan2(-(tg.pos.x-here.x),-(tg.pos.z-here.z));Mc.yaw=angLerp(Mc.yaw,want,1-Math.exp(-dt*.9));
      const aimed=Math.abs(angLerp(Mc.yaw,want,1)-Mc.yaw)<.18;
      if(Mc.seg==='walk')setSeg(Mc,'idle');
      // it picks its next attack a beat early, so the cannons can wind up audibly first (the Herald charge-up)
      if(Mc.seg==='idle'){Mc.cool-=dt;if(Mc.cool<=.6&&!Mc.pick){Mc.pick=rng()<.6?'guns':'cannon';if(Mc.pick==='cannon'&&typeof sfx!=='undefined'&&sfx.charge)sfx.charge(Mc.head.getWorldPosition(_a));}
        if(Mc.cool<=0&&aimed){setSeg(Mc,Mc.pick||'guns');Mc.pick=null;}}
      if(Mc.seg==='guns'){Mc.shotT-=dt;if(Mc.shotT<=0&&aimed){Mc.shotT=.14;shoot(Mc,false,Mc.t*10%2<1?-1:1);}}
      if(Mc.seg==='cannon'){if(Mc.cannonFired===0&&Mc.t>15.12){Mc.cannonFired=1;shoot(Mc,true,-1);}if(Mc.cannonFired===1&&Mc.t>15.52){Mc.cannonFired=2;shoot(Mc,true,1);}}}
    else if(Mc.path.length){   // walk the patrol
      if(Mc.seg!=='walk'&&Mc.seg!=='idle')null;else{setSeg(Mc,'walk');
        const goal=Mc.path[Mc.pi],dx=goal.x-here.x,dz=goal.z-here.z,d=Math.hypot(dx,dz);
        if(d<2){Mc.pi=(Mc.pi+1)%Mc.path.length;}
        else{const want=Math.atan2(-dx,-dz);Mc.yaw=angLerp(Mc.yaw,want,1-Math.exp(-dt*.8));
          const sp=1.9*Math.max(0,Math.cos(angLerp(Mc.yaw,want,1)-Mc.yaw));here.x-=Math.sin(Mc.yaw)*sp*dt;here.z-=Math.cos(Mc.yaw)*sp*dt;}}}
    else if(Mc.seg==='walk')setSeg(Mc,'idle');
    // play the clip's piece
    const S=SEG[Mc.seg];Mc.t+=dt;if(Mc.t>S[1]){if(Mc.seg==='walk'||Mc.seg==='idle')Mc.t=S[0]+(Mc.t-S[1]);else{setSeg(Mc,'idle');Mc.cool=R(1.2,2.6);}}
    if(Mc.action){Mc.action.time=Mc.t;Mc.mixer.update(0);}
    here.y=groundY(here.x,here.z);Mc.y=here.y;Mc.g.rotation.y=Mc.yaw;Mc.x=here.x;Mc.z=here.z;Mc.ob.x=here.x;Mc.ob.z=here.z;
    if(Mc.torso){Mc.torso.getWorldPosition(_a);Mc.g.worldToLocal(_a);Mc.head.position.copy(_a);}}}
  // hit by you (hurtTurret in js/origin/03-play.js hands it here)
  // Oct 25: a mech has 500 HP and no shield (js/shared/damage.js); your guns and the Breaker hit it for their spec damage
  function hurt(Mc,dmg,p,how){if(Mc.dead)return;
    Mc.hp-=dmg;Mc.aggro=12;if(!Mc.tg||!Mc.tg.player){Mc.tg={pos:P.pos,player:true};Mc.retarget=4;}
    boom(p,1.1,how==='gun'?0xfff0d0:0xffc070,.2);
    if(Mc.hp<=0){Mc.dead=true;const c=Mc.head.getWorldPosition(new THREE.Vector3());for(let k=0;k<4;k++)setTimeout(()=>{boom(c.clone().add(_b.set(R(-2,2),R(-2,1),R(-2,2))),R(6,10),k%2?0xff8a3a:0xfff0c0,1);if(typeof sfx!=='undefined')sfx.blast(c);},k*260);
      if(Mc.action)Mc.action.paused=true;const i=OBST.indexOf(Mc.ob);if(i>=0)OBST.splice(i,1);OBST.push({x:Mc.x,z:Mc.z,r:2.2,h:3});
      P.kills++;if(typeof gainZeal==='function')gainZeal(30);PG.kill(800,c,how);if(typeof banner==='function')banner('Herald mech down');}}
  return{spawn,update,hurt,LIST,unwarm,prep,SEG,H_M};
})();
