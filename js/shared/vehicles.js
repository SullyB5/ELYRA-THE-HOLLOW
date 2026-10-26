/* Elyra shared · vehicles (Oct 25, Bryce's playtest).
   ROVER   · Site K: the Keepers' four-wheel rover the dropship sets down with the team (Bryce's warthog model, the chaingun one:
             models/warthog.glb, models/pc/warthog.glb). You drive; the rear gun is slaved to your aim. The squad rides with you.
             W/S throttle, A/D steer, mouse aims the gun (and the camera), click fires. Phone: left thumb drives, right thumb aims, FIRE.
             (Oct 26, Bryce: look-to-steer. W/S or the left stick's up/down is only gas and brake; she turns toward where you look.)
   WALKER  · Dead Ground: a red Herald walker left at the canyon's mouth, its pilot dead (Bryce's Herald mech model, the same file and
             clip as js/shared/mech.js). You climb in and fight down the mountain in it. W/S/A/D walk, it turns with your aim;
             click: its machine guns · G/F (phone NADE): both cannons.
   SKIMMER · Site K: the Empty Host's hover tanks on the road (code-built in the Host's black, silver and purple). They keep their
             distance, circle, and fire heavy bolts when they can see you. Rockets kill them; rifle fire takes a while.
   E (phone USE) gets in and out. While you're in a vehicle it takes the hits, not you; at zero it blows and throws you clear.
   Needs js/origin/03-play.js (P, keys, joy, aimRay, moveBody, blocked ...). VEH.update(dt) runs from updateTurrets every frame. */
const VEH=(()=>{
  const lerpV=(a,b,u)=>a+(b-a)*u,angDiff=(a,b)=>((a-b+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
  const LIST=[],SKIMS=[];let cur=null;
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3(),_q=new THREE.Quaternion(),_e=new THREE.Euler(0,0,0,'YXZ');
  BK.chain={len:2.2,w:.07,head:.8,col:0xfff0b0,bc:0xffc860};
  boltMats.chain=new THREE.MeshBasicMaterial({color:C(0xffc860).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});if(window.BOLT_WARM)BOLT_WARM('chain');
  const hk=()=>(typeof OD!=='undefined'&&OD.dmg)||1;
  /* ---------- the rover ---------- */
  function addRover(x,z,yaw,o){o=o||{};const g=new THREE.Group();g.userData.dyn=1;g.position.set(x,groundY(x,z),z);g.rotation.y=yaw||0;scene.add(g);
    const V={kind:'rover',g,body:new THREE.Group(),yaw:yaw||0,v:0,steer:0,hp:Math.round(440/Math.max(.6,hk())),max:0,dead:false,label:'ROVER',gunName:'ROVER GUN',
      heat:0,over:0,cool:0,ob:{x,z,r:2.5,h:2.1},seats:[],riders:[],pitch:0,roll:0,turret:null,lastHit:-99,len:5.2,bob:0};V.max=V.hp;g.add(V.body);
    OBST.push(V.ob);LIST.push(V);
    // seats in the rover's own frame (nose toward -z): driver, passenger, and two in the bed by the gun
    // (Oct 25: a fifth place on the tailgate, so Dead Ground's four squadmates all fit)
    V.seats=[{x:-.52,y:.78,z:-.15,sit:1},{x:.52,y:.78,z:-.15,sit:1},{x:-.5,y:1.02,z:1.55,sit:.55},{x:.55,y:1.02,z:1.75,sit:.55},{x:-.05,y:.98,z:2.3,sit:.55}];
    // a code-built stand-in until the model arrives (or if it never does)
    {const m=new Merger(),hull=C(0x6a7a62),dk=C(0x22261e);m.add(boxUV(2.1,.7,4.6,2),M(0,.95,0),hull);m.add(boxUV(1.9,.5,1.6,2),M(0,1.5,-.6),dk);
      for(const sx of[-1,1])for(const sz of[-1.55,1.55])m.add(new THREE.CylinderGeometry(.48,.48,.36,12).rotateZ(Math.PI/2),M(sx*1.05,.48,sz),dk);
      const s=new THREE.Mesh(m.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.3}));s.castShadow=true;V.body.add(s);V.stand=s;
      const t=new THREE.Group();t.position.set(0,1.6,1.45);const tb=new THREE.Mesh(boxUV(.5,.4,1.1,1),s.material);tb.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(tb.geometry.attributes.position.count*3).fill(.2),3));t.add(tb);V.body.add(t);V.turret=t;V.muz=new THREE.Vector3(0,.1,-.9);}
    MODELS.copy('warthog').then(({scene:s})=>{MODELS.tame(s,.45);
      const {o}=MODELS.fit(s,{ry:Math.PI,size:V.len,axis:'z',floor:true});o.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});
      V.body.remove(V.stand);V.body.remove(V.turret);V.body.add(o);V.model=o;o.updateMatrixWorld(true);
      // the chaingun on its own pivot so it can turn with your aim
      let gun=null;o.traverse(c=>{if(c.isMesh&&/chaingun/i.test(c.material&&c.material.name||''))gun=c;});
      if(gun){V.body.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(gun),cc=bb.getCenter(new THREE.Vector3());const pv=new THREE.Group();
        V.body.worldToLocal(cc);pv.position.set(cc.x,V.body.worldToLocal(new THREE.Vector3(0,bb.min.y+(bb.max.y-bb.min.y)*.55,0)).y,cc.z);V.body.add(pv);pv.updateMatrixWorld(true);pv.attach(gun);V.turret=pv;
        const sz=bb.getSize(new THREE.Vector3());V.muz=new THREE.Vector3(0,.05,-Math.max(sz.x,sz.z)*.55);}
    }).catch(e=>console.warn('rover',e&&e.message));
    return V;}
  /* ---------- the walker (the Herald mech, captured) ---------- */
  function addWalker(x,z,yaw,o){o=o||{};const g=new THREE.Group();g.userData.dyn=1;g.position.set(x,groundY(x,z),z);g.rotation.y=yaw||0;scene.add(g);
    const V={kind:'walker',g,yaw:yaw||0,hp:Math.round(650/Math.max(.6,hk())),max:0,dead:false,label:'WALKER',gunName:'WALKER GUNS',seg:'idle',t:5.2,mixer:null,action:null,mz:{},
      cool:0,cannon:0,cannonT:0,seats:[],riders:[],ob:{x,z,r:2.8,h:6.2},lastHit:-99,head:new THREE.Object3D(),moving:0,shotSide:1};V.max=V.hp;
    V.head.position.set(0,(MECH.H_M||6.8)*.72,0);g.add(V.head);OBST.push(V.ob);LIST.push(V);
    MODELS.rigged('herald-mech').then(({scene:m,clips})=>{MECH.prep(m);
      m.traverse(c=>{if(c.isBone){const n=c.name;if(/^Torso_?0?1?$/.test(n)||/^Torso_01/.test(n))V.torso=c;if(/^MGL/.test(n)&&!V.mz.mgL)V.mz.mgL=c;if(/^MGR/.test(n)&&!V.mz.mgR)V.mz.mgR=c;
        if(/^CannonL\d*_/.test(n)&&!V.mz.cL)V.mz.cL=c;if(/^CannonR\d*_/.test(n)&&!V.mz.cR)V.mz.cR=c;}});
      // a Keeper hand on it now: the red is scorched, and a blue lamp burns in the cockpit
      m.traverse(c=>{if(c.isMesh){c.material=c.material.clone();c.material.color=c.material.color.clone().multiplyScalar(.78);}});
      const lamp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x7fe3ff).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));lamp.scale.setScalar(1.2);lamp.position.set(0,(MECH.H_M||6.8)*.78,-1.4);g.add(lamp);V.lamp=lamp;
      g.add(m);V.model=m;if(clips&&clips[0]){V.mixer=new THREE.AnimationMixer(m);V.action=V.mixer.clipAction(clips[0]);V.action.play();V.action.paused=true;}}).catch(e=>console.warn('walker',e&&e.message));
    return V;}
  /* ---------- getting in and out ---------- */
  function near(){if(cur||!P.alive)return null;let best=null,bd=1e9;for(const V of LIST){if(V.dead||V.locked||!V.g.visible)continue;const d=Math.hypot(P.pos.x-V.g.position.x,P.pos.z-V.g.position.z);if(d<(V.kind==='walker'?4.6:4)&&d<bd){bd=d;best=V;}}return best;}
  function canUse(){return !!(cur?(cur.kind==='walker'||Math.abs(cur.v)<3)&&!cur.noExit:near());}
  function use(){if(cur){if(cur.noExit)return true;if(cur.kind==='rover'&&Math.abs(cur.v)>3)return true;exit();return true;}const V=near();if(!V)return false;enter(V);return true;}
  function enter(V,quiet){cur=V;V.ob.ghost=true;P.crouch=false;P.adsHeld=false;fireHeld=false;P.reloadT=0;
    if(V.kind==='walker'){P.H.root.visible=false;}
    // the squad climbs aboard the rover (whoever is close)
    if(V.kind==='rover'){let k=1;for(const A of ALLIES){if(!A.on||A.H.dead||!A.armed||k>=V.seats.length)continue;if(A.pos.distanceTo(V.g.position)>40)continue;A.ride=V;A.seat=k++;V.riders.push(A);}}
    if(!quiet){banner(V.kind==='rover'?(coarse?'Rover · left thumb: gas and brake · look to steer · FIRE shoots · USE gets out':'Rover · W/S gas and brake · mouse steers · click fires · E gets out'):(coarse?'Walker · FIRE: guns · NADE: cannons · USE gets out':'Walker · left click: guns · right click: cannons · E gets out'),'alert');
      if(typeof sfx!=='undefined'&&sfx.beep)sfx.beep();}
    if(VEH.onEnter)VEH.onEnter(V);}
  function exit(eject){const V=cur;if(!V)return;cur=null;V.ob.ghost=false;V.v=0;
    // out on the left side (or wherever is clear)
    const fx=-Math.sin(V.yaw),fz=-Math.cos(V.yaw),rx=Math.cos(V.yaw),rz=-Math.sin(V.yaw),off=V.kind==='walker'?3.8:2.4;
    let placed=false;for(const [a,b] of[[-1,0],[1,0],[0,1],[0,-1],[-1,1],[1,1]]){const x=V.g.position.x+rx*a*off+fx*b*off*1.3,z=V.g.position.z+rz*a*off+fz*b*off*1.3;if(playD(x,z)<-.8){P.pos.set(x,groundY(x,z),z);placed=true;break;}}
    if(!placed)P.pos.set(V.g.position.x,groundY(V.g.position.x,V.g.position.z),V.g.position.z);
    P.H.root.visible=true;P.vy=0;
    for(const A of V.riders){A.ride=null;const s=V.seats[A.seat]||{x:0,z:0};const w=V.g.localToWorld(_a.set(s.x*2.6,0,s.z*1.2));if(playD(w.x,w.z)>-.6)w.copy(P.pos);A.pos.set(w.x,groundY(w.x,w.z),w.z);reviveHuman(A.H);A.H.root.rotation.set(0,A.H.root.rotation.y,0);}
    V.riders.length=0;if(VEH.onExit)VEH.onExit(V,eject);}
  /* ---------- damage ---------- */
  function hurt(dmg,from,V){V=V||cur;if(!V||V.dead)return;V.hp-=dmg;V.lastHit=T;if(from&&V===cur)HITDIR.show(from);
    if(V===cur){$('hurt').style.opacity=.3;setTimeout(()=>$('hurt').style.opacity=0,140);if(typeof sfx!=='undefined')sfx.hit(true);}
    if(V.hp<=V.max*.3&&!V.warned){V.warned=true;banner(V.label+' badly damaged','alert');}
    if(V.hp<=0)destroy(V);}
  function destroy(V){if(V.dead)return;V.dead=true;V.hp=0;const c=V.g.position.clone().setY(V.g.position.y+(V.kind==='walker'?4:1.2));
    for(let k=0;k<4;k++)setTimeout(()=>{boom(c.clone().add(_b.set(R(-2,2),R(-1,2),R(-2,2))),R(7,12),k%2?0xff8a3a:0xfff0c0,1);if(typeof sfx!=='undefined')sfx.blast(c);},k*200);
    const was=cur===V;if(was){exit(true);hurtPlayer(20);banner(V.label+' destroyed · you are on foot','alert');}
    if(V.action)V.action.paused=true;V.ob.h=V.kind==='walker'?3:1.4;V.smoke=0;
    V.g.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color&&o.material.color.multiplyScalar(.3);if(o.material.emissive)o.material.emissiveIntensity=0;}});if(V.lamp)V.lamp.visible=false;
    if(VEH.onDestroy)VEH.onDestroy(V);}
  /* ---------- driving ---------- */
  function input(){let f=0,s=0;if(P.input){if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD||keys.ArrowRight)s+=1;if(keys.KeyA||keys.ArrowLeft)s-=1;f+=joy.y;s+=joy.x;}
    return{f:clamp(f,-1,1),s:clamp(s,-1,1)};}
  function driveRover(V,dt){
    // Oct 26 (Bryce): the stick (or W/S) is only gas and brake; you steer with where you look. The nose swings to the centre of the
    // screen: quick once she's rolling, slowly from a crawl, not at all parked with no throttle
    let f=0;if(P.input){if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;f+=joy.y;}f=clamp(f,-1,1);
    const boost=keys.ShiftLeft||keys.ShiftRight||joy.y>.96,maxV=boost?21:16;
    const want=f>0?f*maxV:f<0?f*(V.v>1?maxV:6):0;const acc=(Math.sign(want-V.v)===Math.sign(V.v)||Math.abs(V.v)<.5)?(f===0?5:9):16;   // brakes bite harder than the engine
    V.v+=clamp(want-V.v,-acc*dt,acc*dt);
    const grip=Math.max(clamp(Math.abs(V.v)/6,0,1),Math.abs(f)>.1?.35:0),rate=2.3*grip*(1-.3*clamp(Math.abs(V.v)/21,0,1));
    const off=angDiff(P.yaw,V.yaw),turn=clamp(off*4,-rate,rate);V.yaw+=turn*dt;V.steer=rate>0?turn/2.3:0;
    const fx=-Math.sin(V.yaw),fz=-Math.cos(V.yaw),p=V.g.position,ox=p.x,oz=p.z;_a.set(p.x,0,p.z);
    moveBody.drive=true;moveBody(_a,fx*V.v*dt,fz*V.v*dt,2.1);moveBody.drive=false;   // (it rolls over small rocks: OBST .low)
    if(V.bound&&!V.bound(_a.x,_a.z)){_a.set(ox,0,oz);V.v*=-.2;}const moved=Math.hypot(_a.x-ox,_a.z-oz),meant=Math.abs(V.v*dt);
    if(meant>.02&&moved<meant*.5){const hitV=Math.abs(V.v);if(hitV>9){hurt(hitV*1.2,null,V);shakeV=.4;if(typeof sfx!=='undefined')sfx.crash&&sfx.crash(p);}V.v*=-.25;}
    p.x=_a.x;p.z=_a.z;
    // run them down
    if(Math.abs(V.v)>5)for(const E of ENEMIES){if(E.H.dead||E.warm||E.gunner)continue;if(Math.hypot(E.pos.x-p.x,E.pos.z-p.z)<2.5){hurtEnemy(E,99,'gun');boom(E.pos.clone().setY(E.pos.y+1),2,0xffe0c0,.3);V.v*=.92;}}
    // on the ground: height at the middle, pitch and roll from the wheels
    const gy=groundY(p.x,p.z),fy=groundY(p.x+fx*1.6,p.z+fz*1.6),by=groundY(p.x-fx*1.6,p.z-fz*1.6),rx=Math.cos(V.yaw),rz=-Math.sin(V.yaw),ly=groundY(p.x-rx*1,p.z-rz*1),ry=groundY(p.x+rx*1,p.z+rz*1);
    const tp=Math.atan2(fy-by,3.2),tr=Math.atan2(ly-ry,2);V.pitch+=(tp-V.pitch)*(1-Math.exp(-dt*8));V.roll+=(tr-V.roll)*(1-Math.exp(-dt*8));
    // rolling over a small rock: a bump and a little speed lost
    if(Math.abs(V.v)>2)for(const o of OBST){if(!o.low)continue;if(Math.hypot(o.x-p.x,o.z-p.z)<o.r+1.2){if(!o.bumpT||T-o.bumpT>.8){o.bumpT=T;V.pitch-=.08*Math.sign(V.v);V.roll+=R(-.06,.06);V.v*=.95;}break;}}
    V.bob+=dt*Math.abs(V.v)*.9;p.y=Math.max(gy,(fy+by)/2)+Math.sin(V.bob)*.025*Math.min(1,Math.abs(V.v)/8);
    V.g.rotation.set(0,0,0);_e.set(V.pitch,V.yaw,V.roll,'YXZ');V.g.quaternion.setFromEuler(_e);
    V.ob.x=p.x;V.ob.z=p.z;P.pos.set(p.x,p.y,p.z);P.moving=Math.abs(V.v);
    // the gun turns with your aim
    if(V.turret){const local=P.yaw-V.yaw;V.turret.rotation.y=angLerp(V.turret.rotation.y,local,1-Math.exp(-dt*14));V.turret.rotation.x=clamp(-P.pitch*.8,-.4,.5)*0;}
    // the gun: fires along the crosshair, heats up
    V.cool-=dt;V.over=Math.max(0,V.over-dt);V.heat=Math.max(0,V.heat-dt*(V.over>0?.38:.22));
    // Oct 25 (Bryce): 45 a shot (DMG.EXTRA.vehGunDmg); Oct 26: 3.5 shots a second (DMG.EXTRA.vehTurretRps); Zeal doubles both
    if(fireHeld&&P.input&&V.cool<=0&&V.over<=0){const zk=zealK(),dmg=DMG.EXTRA.vehGunDmg*zk;V.cool=1/(DMG.EXTRA.vehTurretRps*zk);
      const A=aimRay(260,.016);camera.updateMatrixWorld(true);V.g.updateMatrixWorld(true);const from=V.turret?V.turret.localToWorld(_b.copy(V.muz)):V.g.position.clone().setY(p.y+2);
      boom(from,.5,0xffd890,.05);fire(from.clone(),A.p,240,'chain',q=>{boom(q,.6,0xffe0b0,.2);
        if(A.hit&&A.hit.E)hurtEnemy(A.hit.E,dmg,'gun','torso');else if(A.hit&&A.hit.D)hurtDrop(A.hit.D,dmg,q);else if(A.hit&&A.hit.AT)A.hit.AT.hit(q,'gun',dmg);
        else if(A.hit&&A.hit.T)hurtTurret(A.hit.T,A.hit.T.mech?dmg:.55,q,'gun');else puff(q,.5,.5);});}
    // engine
    // (Oct 25, Bryce: the old synth sawtooth was far too loud) the recorded car engine, low, rising a little with speed
    if(typeof sfx!=='undefined'&&sfx.loopAt){const n=Math.min(1,Math.abs(V.v)/21);sfx.loopAt('loop.warthog','you',null,.12+n*.18,.75+n*.55);}
    // dust off the wheels
    if(Math.abs(V.v)>6&&rng()<dt*14)puff(p.clone().add(_b.set(R(-1,1),.3,R(-1,1))).addScaledVector(_c.set(-fx,0,-fz),2.2),R(.8,1.6),1.4);}
  function seg(V,s){if(V.seg===s)return;V.seg=s;V.t=MECH.SEG[s][0];V.fired=0;}
  function driveWalker(V,dt){const {f,s}=input();const p=V.g.position;
    // it turns with your aim; you walk it relative to where you look
    V.yaw=angLerp(V.yaw,P.yaw,1-Math.exp(-dt*2.2));
    const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw),L=Math.hypot(f,s)||1,k=Math.min(1,Math.hypot(f,s));
    const sp=(keys.ShiftLeft||keys.ShiftRight?5.6:4.2)*k;_a.set(p.x,0,p.z);moveBody.tall=true;moveBody(_a,(fx*f+rx*s)/L*sp*dt,(fz*f+rz*s)/L*sp*dt,2.6);moveBody.tall=false;   // it steps over low walls
    if(V.bound&&!V.bound(_a.x,_a.z))_a.set(p.x,0,p.z);   // where it can't go (a gate it won't fit through)
    p.x=_a.x;p.z=_a.z;
    V.moving+=((k>.1?1:0)-V.moving)*(1-Math.exp(-dt*6));
    if(V.seg==='walk'||V.seg==='idle')seg(V,k>.1?'walk':'idle');
    // stomp troopers that get under its feet
    for(const E of ENEMIES){if(E.H.dead||E.warm||E.gunner)continue;if(Math.hypot(E.pos.x-p.x,E.pos.z-p.z)<2.2&&k>.1){hurtEnemy(E,99,'gun');}}
    p.y=groundY(p.x,p.z);V.g.rotation.y=V.yaw;V.ob.x=p.x;V.ob.z=p.z;P.pos.set(p.x,p.y,p.z);P.moving=sp;
    // machine guns: along the crosshair, from the guns on its arms
    V.cool-=dt;V.cannon=Math.max(0,V.cannon-dt);
    // Oct 26 (Bryce): the same as the Warthog's gun, 45 a shot at 3.5 shots a second (Zeal doubles both)
    if(fireHeld&&P.input&&V.cool<=0){const zk=zealK(),dmg=DMG.EXTRA.vehGunDmg*zk;V.cool=1/(DMG.EXTRA.vehTurretRps*zk);V.shotSide*=-1;if(V.seg!=='cannon')seg(V,'guns');V.gunT=1.1;
      const A=aimRay(240,.018);const b=V.shotSide<0?V.mz.mgL:V.mz.mgR,from=b?b.getWorldPosition(_b).addScaledVector(_c.set(-Math.sin(V.yaw),0,-Math.cos(V.yaw)),1.4):V.head.getWorldPosition(_b);
      boom(from,.9,0xff8a5a,.06);fire(from.clone(),A.p,230,'rrifle',q=>{boom(q,.8,0xff9a6a,.2);
        if(A.hit&&A.hit.E)hurtEnemy(A.hit.E,dmg,'gun','torso');else if(A.hit&&A.hit.D)hurtDrop(A.hit.D,dmg,q);else if(A.hit&&A.hit.AT)A.hit.AT.hit(q,'gun',dmg);
        else if(A.hit&&A.hit.T)hurtTurret(A.hit.T,A.hit.T.mech?dmg:1.2,q,'gun');else puff(q,.6,.6);});}
    V.gunT=Math.max(0,(V.gunT||0)-dt);if(V.seg==='guns'&&V.gunT<=0)seg(V,k>.1?'walk':'idle');
    // the cannons (G / F / NADE): both, a shell each, then a reload
    // Oct 26: the shells run off their own timer, not the cannon clip's time (that never got there, so they never fired)
    if(V.wantCannon&&V.cannon<=0){V.wantCannon=false;V.cannon=2.2;seg(V,'cannon');V.cannonAim=aimRay(420,.004).p.clone();V.shellT=0;V.shells=0;}
    if(V.shells!=null&&V.shells<2){V.shellT+=dt;if(V.shells===0&&V.shellT>=.09){V.shells=1;shell(V,V.mz.cL);}if(V.shells===1&&V.shellT>=.49){V.shells=2;shell(V,V.mz.cR);}}
    V.wantCannon=false;
    if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.walker','you',null,.1+V.moving*.15,.85+V.moving*.25);}   // (Oct 25: quieter, the recorded loop)
  function shell(V,b){const fw=_c.set(-Math.sin(V.yaw),0,-Math.cos(V.yaw)),from=(b?b.getWorldPosition(new THREE.Vector3()):V.head.getWorldPosition(new THREE.Vector3())).addScaledVector(fw,2.6);
    boom(from,2.6,0xff7a3a,.25);fireRocket(from,V.cannonAim||from.clone().addScaledVector(fw,80));shakeV=.35;if(typeof sfx!=='undefined')sfx.blast&&sfx.blast(from);}
  // G / F / NADE in the walker: cannons. In the rover: nothing (js/origin/03-play.js asks first)
  function alt(){if(cur&&cur.kind==='walker')cur.wantCannon=true;return !!cur;}
  // (Oct 26, Bryce: guns on left click, missiles on right click) right click (aim) in the walker fires both cannons; G / F / NADE still do
  let rmbWas=false;function rmb(){const on=!!(cur&&cur.kind==='walker'&&P.adsHeld);if(on&&!rmbWas)cur.wantCannon=true;rmbWas=on;}
  let shakeV=0;
  /* ---------- the camera: behind and above, along your aim; pulled in short of walls and buildings ---------- */
  function cameraPlace(){const V=cur,p=V.g.position;FP.on=false;VM.root.visible=false;if(typeof fpLayers==='function')fpLayers(false);$('scope').classList.remove('on');
    camera.fov=V.kind==='walker'?64:66;camera.updateProjectionMatrix();
    const cp=Math.cos(P.pitch),sp=Math.sin(P.pitch),fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
    const W=V.kind==='walker',dist=W?11.5:8.6,up=W?7.4:3.3,side=W?2.4:0;
    const head=_a.set(p.x,p.y+(W?6:1.9),p.z);
    _b.set(head.x-fx*dist*cp+rx*side,head.y+up-W*1.5-sp*dist,head.z-fz*dist*cp+rz*side);
    // pull in toward the vehicle until the line is clear of walls, buildings and the ground
    let k=1;for(let i=0;i<14&&k>.12;i++){_c.lerpVectors(head,_b,k);if(playD(_c.x,_c.z)<2.5&&_c.y>groundY(_c.x,_c.z)+.6&&!RECTS.some(Rb=>rectHit(Rb,head,_c)>=0))break;k-=.065;}
    camera.position.lerpVectors(head,_b,k);if(typeof camClamp==='function'&&!W)camClamp(head);
    const g=groundY(camera.position.x,camera.position.z)+.6;if(camera.position.y<g)camera.position.y=g;
    if(shakeV>0){shakeV=Math.max(0,shakeV-1/60);camera.position.x+=R(-1,1)*shakeV*.3;camera.position.y+=R(-1,1)*shakeV*.3;}
    camera.rotation.order='YXZ';camera.rotation.set(P.pitch-(W?.12:.06),P.yaw,0);
    P.H.root.visible=V.kind==='rover';}
  /* ---------- people in their seats ---------- */
  function sitPose(H,dt,k,aim){poseHuman(H,dt,0,aim||0,false);if(k<=0)return;for(const L of H.legs){L.hp.rotation.x=lerpV(L.hp.rotation.x,1.45,k);L.kn.rotation.x=lerpV(L.kn.rotation.x,-1.5,k);}}
  function seatAt(V,s,out){return V.g.localToWorld(out.set(s.x,s.y,s.z));}
  function placeDriver(V,dt){if(V.kind!=='rover')return;const s=V.seats[0];seatAt(V,s,_a);P.H.root.position.copy(_a);P.H.root.position.y-=(P.H.hipY||1)*.62;P.H.root.quaternion.copy(V.g.quaternion);
    P.H.aimPitch=0;sitPose(P.H,dt,1,0);}
  // a squadmate riding (js/origin/03-play.js updateAllies hands them here): in the seat, firing at whatever they can see
  function seatAlly(A,dt,aim){const V=A.ride;if(!V||V.dead){A.ride=null;return;}const s=V.seats[A.seat]||V.seats[1];seatAt(V,s,_a);A.pos.copy(_a);
    A.H.root.position.y=_a.y-(s.sit>.9?(A.H.hipY||1)*.62:(A.H.hipY||1)*.25);
    if(!aim)A.H.root.quaternion.copy(V.g.quaternion);else A.H.root.rotation.set(0,A.yaw,0);
    sitPose(A.H,dt,s.sit>.9?1:.0,aim);if(s.sit<=.9)A.H.crouchTo=.5;}
  /* ---------- the Host skimmer ---------- */
  const skHull=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.4,metalness:.7}),skGlow=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  let skGeo=null;function skimGeo(){if(skGeo)return skGeo;const m=new Merger(),gm=new Merger(),dk=C(0x1a1622),dk2=C(0x2a2434),sv=C(0x9a9ca8),pu=C(typeof FLEET_PURPLE!=='undefined'?FLEET_PURPLE:0xa45cff);
    const hull=new THREE.CylinderGeometry(1.1,1.35,4.6,6);hull.rotateX(Math.PI/2);hull.scale(1,.42,1);m.add(hull,M(0,.2,0),dk);
    const nose=new THREE.ConeGeometry(1.05,1.8,6);nose.rotateX(-Math.PI/2);nose.scale(1,.42,1);m.add(nose,M(0,.2,-3.1),dk2);
    for(const sx of[-1,1]){m.add(boxUV(1.3,.18,2.4,2),M(sx*1.5,.05,.5,0,0,sx*.25),dk2);m.add(new THREE.ConeGeometry(.12,1.4,4),M(sx*2.05,.15,1.4,Math.PI/2,0,0),sv);
      m.add(boxUV(.4,.5,1.4,2),M(sx*.9,-.2,1.6),dk);gm.add(new THREE.CircleGeometry(.24,10),M(sx*.9,-.2,2.31),pu);}
    gm.add(new THREE.BoxGeometry(2.2,.05,.06),M(0,.62,-.6),pu);gm.add(new THREE.BoxGeometry(.06,.05,3.2),M(0,.64,.2),pu);
    skGeo={g:m.build(),gl:gm.build()};return skGeo;}
  function addSkimmer(x,z,o){o=o||{};const G=skimGeo(),g=new THREE.Group(),body=new THREE.Group();g.add(body);g.userData.dyn=1;
    const hm=new THREE.Mesh(G.g,skHull),gm=new THREE.Mesh(G.gl,skGlow);hm.castShadow=true;body.add(hm,gm);
    const tur=new THREE.Group();tur.position.set(0,.75,-.3);body.add(tur);const tb=new THREE.Mesh(boxUV(.8,.4,.9,1),skHull);tb.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(tb.geometry.attributes.position.count*3).fill(.16),3));tur.add(tb);
    const bar=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,1.6,8).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:C(0x9ea2ae),metalness:.85,roughness:.3}));bar.position.set(0,.05,-1);tur.add(bar);
    const under=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(typeof FLEET_PURPLE!=='undefined'?FLEET_PURPLE:0xa45cff).multiplyScalar(1.8),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7}));under.scale.set(4.4,1.4,1);under.position.y=-.7;body.add(under);
    g.position.set(x,groundY(x,z)+1.5,z);scene.add(g);
    // Oct 26 (Bryce): 200 HP + 25 shield on every level and threat level, in the spec's units (was 38 old units, scaled by threat level)
    const S={g,body,tur,under,pos:g.position,...DMG.pool('skimmer',DMG.REGEN.npc),dead:false,yaw:o.yaw||0,v:new THREE.Vector3(),orbit:rng()<.5?1:-1,cool:R(2,4),burst:0,bt:0,tg:null,re:0,
      ob:{x,z,r:2.3,h:2},wake:o.wake||0,awake:!o.wake,range:R(24,40),t:R(0,9),hold:o.hold||null,smoke:0,gone:0};
    OBST.push(S.ob);SKIMS.push(S);
    S.AT={off:()=>S.dead,spheres:()=>[{c:S.g.position,r:2.4}],
      // what reaches it is already in spec units: rifle / Lance / sidearm by gun (no zones on a vehicle: torso), the Breaker's 250 on a direct hit,
      // the Warthog's and walker's 45. A blast arrives in the old units, so it is scaled like a trooper's (a grenade at its heart: ~208)
      hit:(p,how,dmg)=>{skHurt(S,dmg,p,how);},
      blast:(p,r,dmg,mine,how)=>{if(S.dead||how==='rocket')return;const d=S.g.position.distanceTo(p);if(d<r+2.2)skHurt(S,dmg*DMG.LEGACY*(1-d/(r+2.2)*.5),p,how||'nade');}};
    AIR_TARGETS.push(S.AT);return S;}
  function skHurt(S,dmg,p,how){if(S.dead)return;DMG.hit(S,dmg,T);S.awake=true;boom(p,1,0xfff0d0,.15);if(how==='gun'||how==='rocket'){$('cross').classList.add('hit');setTimeout(()=>$('cross').classList.remove('hit'),90);}
    if(S.hp<=0){S.dead=true;const c=S.g.position.clone();boom(c,8,0xfff0c0,.5);boom(c,13,0xff8a3a,1.2);boom(c,7,typeof HOLLOW_GLOW!=='undefined'?HOLLOW_GLOW:0xa45cff,.9);if(typeof sfx!=='undefined')sfx.blast(c);
      P.kills++;if(typeof gainZeal==='function')gainZeal(22);PG.kill(500,c,how);if(VEH.onSkimmerDown)VEH.onSkimmerDown(S);S.under.visible=false;S.ob.h=1.2;}}
  function skTarget(S){let best=null,bd=1e9;const here=S.g.position;
    if(P.alive&&P.input){const d=here.distanceTo(P.pos)*.7;if(d<bd){bd=d;best={pos:P.pos,player:true};}}
    for(const A of ALLIES){if(!A.on||A.H.dead||A.ride)continue;const d=here.distanceTo(A.pos);if(d<bd){bd=d;best={pos:A.pos,A};}}
    return best;}
  function updateSkimmers(dt){for(let i=SKIMS.length-1;i>=0;i--){const S=SKIMS[i],p=S.g.position;
    if(S.dead){S.gone+=dt;const gy=groundY(p.x,p.z)+.5;p.y=Math.max(gy,p.y-dt*6);S.body.rotation.z=Math.min(.35,S.body.rotation.z+dt*.4);S.smoke-=dt;if(S.smoke<=0){S.smoke=.25;puff(p.clone().setY(p.y+1),R(1,2),2.4);}
      S.ob.x=p.x;S.ob.z=p.z;continue;}
    DMG.tick(S,dt,T);   // its shield refills 10 s after the latest hit, empty to full in 16 (like a trooper's)
    S.t+=dt;if(!S.awake){if(P.pos.distanceTo(p)<S.wake||(VEH.cur&&VEH.cur.g.position.distanceTo(p)<S.wake))S.awake=true;else{p.y=groundY(p.x,p.z)+1.4+Math.sin(S.t*2)*.12;continue;}}
    S.re-=dt;if(S.re<=0||!S.tg){S.re=R(1.5,2.5);S.tg=skTarget(S);}const tg=S.tg;
    // move: close to its range, circle there, keep inside the map
    let mx=0,mz=0;if(tg){const dx=tg.pos.x-p.x,dz=tg.pos.z-p.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d;const rad=(d-S.range)/8;mx=ux*clamp(rad,-1,1)+(-uz)*S.orbit*.7;mz=uz*clamp(rad,-1,1)+ux*S.orbit*.7;
      if(S.hold){const hx=S.hold.x-p.x,hz=S.hold.z-p.z,hd=Math.hypot(hx,hz);if(hd>18){mx+=hx/hd*1.2;mz+=hz/hd*1.2;}}}
    if(rng()<dt*.2)S.orbit*=-1;
    const L=Math.hypot(mx,mz)||1,sp=8.5*Math.min(1,L);S.v.x+=(mx/L*sp-S.v.x)*(1-Math.exp(-dt*1.8));S.v.z+=(mz/L*sp-S.v.z)*(1-Math.exp(-dt*1.8));
    S.ob.ghost=true;_a.set(p.x,0,p.z);moveBody(_a,S.v.x*dt,S.v.z*dt,2.2);S.ob.ghost=false;
    if(Math.hypot(_a.x-p.x-S.v.x*dt,_a.z-p.z-S.v.z*dt)>.05)S.orbit*=-1;   // ran into something: go the other way round
    p.x=_a.x;p.z=_a.z;p.y+=(groundY(p.x,p.z)+1.4+Math.sin(S.t*2)*.12-p.y)*(1-Math.exp(-dt*5));S.ob.x=p.x;S.ob.z=p.z;
    const sv=Math.hypot(S.v.x,S.v.z);if(sv>.5)S.yaw=angLerp(S.yaw,Math.atan2(-S.v.x,-S.v.z),1-Math.exp(-dt*3));S.g.rotation.y=S.yaw;S.body.rotation.z=clamp(-S.orbit*sv*.02,-.25,.25);
    S.under.material.opacity=.55+.25*Math.sin(S.t*9);
    // the gun: on the target when it can see it
    if(!tg)continue;const want=Math.atan2(-(tg.pos.x-p.x),-(tg.pos.z-p.z))-S.yaw;S.tur.rotation.y=angLerp(S.tur.rotation.y,want,1-Math.exp(-dt*4));
    const eye=_b.copy(p).setY(p.y+1.1),aimP=_c.copy(tg.pos).setY(tg.pos.y+1.2),see=canSee(S,eye,aimP,tg.A||'p',dt),d=eye.distanceTo(aimP);
    S.cool-=dt;if(S.cool<=0&&see&&d<85){S.cool=R(2.2,3.4)/(OD.rof||1);S.burst=3;S.bt=0;}
    if(S.burst>0){S.bt-=dt;if(S.bt<=0){S.bt=.22;S.burst--;if(!see){S.burst=0;continue;}
      S.g.updateMatrixWorld(true);const from=S.tur.localToWorld(new THREE.Vector3(0,.05,-1.8)),to=tg.pos.clone().setY(tg.pos.y+1.2);
      const k=tg.player&&P.crouch&&inCover(P.pos,from)?.4:1,hit=rng()<Math.min(.75,.45*(OD.acc||1)*clamp(1.2-d/90,.3,1)*k)-.05;   // (Oct 26: every NPC 5 points less accurate)if(!hit)to.add(_a.set(R(-2,2),R(-.4,1.4),R(-2,2)));
      boom(from,1.1,typeof HOLLOW_GLOW!=='undefined'?HOLLOW_GLOW:0xa45cff,.12);const stop=wallBlocks(from,to),T0=tg,end=stop?null:shotEnd(from,to,1),cut=!stop&&shotEnd.cut;
      fire(from,(stop||end).clone(),140,'heavy',q=>{if(stop){hitWall(18,q);return;}boom(q,1.8,0xd8a0ff,.35);puff(q,1,1);if(cut)return;if(hit){if(T0.player)hurtPlayer(15,S.g.position);else if(T0.A)hurtAlly(T0.A,12);}});}}}}
  /* ---------- every frame ---------- */
  function update(dt){
    updateSkimmers(dt);rmb();
    for(const V of LIST){
      if(V.dead){V.smoke=(V.smoke||0)-dt;if(V.smoke<=0){V.smoke=.3;puff(V.g.position.clone().setY(V.g.position.y+(V.kind==='walker'?3:1.2)),R(1.5,2.6),2.6);}continue;}
      if(V.kind==='walker'){const S=MECH.SEG[V.seg];V.t+=dt;if(V.t>S[1]){if(V.seg==='walk'||V.seg==='idle')V.t=S[0]+(V.t-S[1]);else seg(V,V.moving>.3?'walk':'idle');}
        if(V.action){V.action.time=V.t;V.mixer.update(0);}if(V.torso){V.torso.getWorldPosition(_a);V.g.worldToLocal(_a);V.head.position.copy(_a);}
        if(V.lamp)V.lamp.material.opacity=cur===V?1:.35+.25*Math.sin(T*3);}
      if(V===cur){if(T-V.lastHit>6&&V.hp<V.max){V.hp=Math.min(V.max,V.hp+dt*(V.kind==='walker'?4:6));if(typeof sfx!=='undefined'&&sfx.repair)sfx.repair();}}
      else if(V.kind==='rover'){V.v*=Math.exp(-dt*3);V.wasDriven=false;}
      if(V===cur)V.wasDriven=true;}
    // a prompt when you're next to one
    const n=near();if(n&&P.input&&!(typeof CUTS!=='undefined'&&CUTS.on)){if(!update.said||T-update.said>4){update.said=T;banner(n.kind==='rover'?(coarse?'Rover · tap USE to drive':'Rover · E to drive'):(coarse?'Walker · tap USE to climb in':'Walker · E to climb in'));}}
    if(typeof $!=='undefined'){const u=$('use');if(u){const lab=cur?(cur.noExit?null:'EXIT'):n?(n.kind==='rover'?'DRIVE':'CLIMB IN'):null;
      if(lab){if(u.dataset.vb==null)u.dataset.vb=u.textContent;if(u.textContent!==lab)u.textContent=lab;}else if(u.dataset.vb!=null){u.textContent=u.dataset.vb;delete u.dataset.vb;}}}}
  let driveSound=false;
  // your turn at the controls (js/origin/03-play.js stepPlayer hands the frame here while you're in one)
  function drive(dt){const V=cur;if(!V||V.dead)return;if(V.kind==='rover'){driveRover(V,dt);V.g.updateMatrixWorld(true);placeDriver(V,dt);}else driveWalker(V,dt);}
  return{addRover,addWalker,addSkimmer,update,drive,use,canUse,enter,exit,hurt,alt,camera:cameraPlace,seatAlly,LIST,SKIMS,destroy,
    get cur(){return cur;},onEnter:null,onExit:null,onDestroy:null,onSkimmerDown:null};
})();
