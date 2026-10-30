/* Elyra · Multiplayer · Gilded Shore — the AI warthogs (Oct 30, Bryce: "add the enemies in the warthogs driving around as well and
   make them the same amount as there would be in the air").
   Each side keeps as many warthogs on the roads as it has AI craft in the air (AI_FIGHTERS in js/mp/03-match.js): a driver and a gunner
   in the side's colours, one of each gun in turn (chaingun, rocket pod, laser). They leave by their base's gates, drive the street
   lattice (navToward), take the nearest of the other side they can see out to HOG_SEE, circle it at gun range and shoot, and run down
   anyone on foot in their way. A hog that's lost comes back at its base after HOG_BACK s; downing one is a point for your side.
   Your shots, rockets and grenades find the other side's hogs (AIR_TARGETS), as do their bots, craft and missiles, and the other way round.
   MPHOG.update(dt) every frame; MPHOG.foes(team) is what foesOf adds; MPHOG.hurt(S,dmg,byTeam,byYou); MPHOG.blast(p,team,r,dmg). */
const MPHOG=(()=>{
  const HOGS=[],WEAPS=['chain','rocket','laser'],HOG_HP=700,HOG_SEE=140,HOG_BACK=20,ORBIT=30;
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3(),_e=new THREE.Euler(0,0,0,'YXZ');
  const angDiff=(a,b)=>((a-b+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
  const RATE={chain:3,rocket:1/2.2,laser:1/1.7};
  function crewMan(team){const H=makeHuman('marine');scene.add(H.root);MODELS.dress(H,'keeper-footsoldier',{tint:TEAMS[team].tint});
    // the side's light on the chest, like the soldiers on foot
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(TEAMS[team].c).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.set(0,1.45,-.2);sp.scale.setScalar(.36);H.root.add(sp);
    return{H,pos:H.root.position,yaw:0,seat:0,ride:null};}
  // where a hog rolls out: just outside one of its base's three gates, facing out into the city
  function spawnSpot(S){const B=baseOf(S.team),f=Math.atan2(B.fx,B.fz),g=[0,-.95,.95][S.i%3],a=f+g;
    for(let r=B.shieldR+10+Math.floor(S.i/3)*7;r<B.shieldR+70;r+=4){const x=B.x+Math.sin(a)*r,z=B.z+Math.cos(a)*r;if(GS.playD(x,z)<-2.6)return{x,z,yaw:Math.atan2(-Math.sin(a),-Math.cos(a))};}
    return{x:B.x+B.fx*(B.shieldR+14),z:B.z+B.fz*(B.shieldR+14),yaw:Math.atan2(-B.fx,-B.fz)};}
  function build(S){const sp=spawnSpot(S),V=VEH.addRover(sp.x,sp.z,sp.yaw,{weap:S.weap});
    V.locked=true;V.warned=true;V.aiHog=S;V.hp=V.max=HOG_HP;V.label=TEAMS[S.team].name+' HOG';S.V=V;S.v=0;S.cool=R(.5,1.5);S.goal=null;S.goalT=0;S.tg=null;S.re=0;S.revT=0;S.stuckT=0;S.stuckP=null;S.stuck=0;
    S.H.dead=false;S.pos.copy(V.g.position);S.c.copy(S.pos).setY(S.pos.y+1.1);
    S.crew.forEach((A,k)=>{reviveHuman(A.H);A.H.root.visible=true;A.ride=V;A.seat=k?2:0;});
    // the lights in the side's colour on the nose (so you can tell whose it is across the island)
    const col=C(TEAMS[S.team].c).multiplyScalar(2.6);for(const sx of[-.8,.8]){const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.position.set(sx,1.05,-2.45);l.scale.setScalar(.9);V.g.add(l);}}
  function add(team,i){const S={team,i,weap:WEAPS[i%3],hog:true,H:{dead:false},respT:0,pos:new THREE.Vector3(),c:new THREE.Vector3(),crew:[crewMan(team),crewMan(team)],backT:0,name:TEAMS[team].name+' hog'};
    build(S);HOGS.push(S);
    // your guns, rockets and grenades find the other side's hogs (js/origin/03-play.js aimRay, updateRockets, blast)
    AIR_TARGETS.push({spheres:()=>[{c:S.c,r:2.7}],off:()=>S.H.dead||S.team===TEAM_YOU,hit:(p,how,dmg)=>hurt(S,dmg,TEAM_YOU,true),
      blast:(p,r,dmg,mine)=>{if(!mine||S.team===TEAM_YOU||S.H.dead)return;const d=p.distanceTo(S.c);if(d<r+2.6)hurt(S,dmg*DMG.LEGACY*.5*(1-d/(r+2.6)*.5),TEAM_YOU,true);}});
    return S;}
  /* ---------- damage ---------- */
  function hurt(S,dmg,byTeam,byYou){if(S.H.dead||!(dmg>0)||byTeam===S.team)return;S.lastBy=byTeam;S.byYou=!!byYou;VEH.hurt(dmg,null,S.V);
    if(byYou){$('cross').classList.add('hit');clearTimeout(hurt.t);hurt.t=setTimeout(()=>$('cross').classList.remove('hit'),90);if(typeof sfx!=='undefined'&&sfx.hitConfirm)sfx.hitConfirm(true);}
    if(S.V.dead)down(S);}
  function down(S){if(S.H.dead)return;S.H.dead=true;S.backT=HOG_BACK;const p=S.c.clone();
    for(const A of S.crew){killHuman(A.H);A.ride=null;setTimeout(()=>{if(S.H.dead)A.H.root.visible=false;},2500);}
    if(S.lastBy){scoreKill(S.lastBy,S,'hog');if(S.byYou){P.kills++;PG.kill(300,p.add(_a.set(0,2,0)),'gun');}}}
  function blast(p,team,r,dmg){for(const S of HOGS){if(S.team===team||S.H.dead)continue;const d=p.distanceTo(S.c);if(d<r+2.6)hurt(S,dmg*1.6*(1-d/(r+2.6)*.5),team,false);}}
  function foes(team){const L=[];for(const S of HOGS)if(S.team!==team&&!S.H.dead)L.push(S);return L;}
  /* ---------- the hog's own look round: the nearest of the other side it can see (the player first when close) ---------- */
  function pick(S){const p=S.c,cand=[];for(const F of foesOf(S.team)){const d=F.pos.distanceTo(p)*(F.player?.8:1);if(d<HOG_SEE&&!sheltered(F.pos,F.player?TEAM_YOU:F.team))cand.push([d,F]);}
    cand.sort((a,b)=>a[0]-b[0]);for(let k=0;k<Math.min(4,cand.length);k++){const F=cand[k][1];if(!blocked(_a.copy(p).setY(p.y+.8),_b.copy(F.pos).setY(F.pos.y+(F.hog?1:1.3))))return F;}return null;}
  function roam(S){const N=GS.nav.nodes,foe=baseOf(S.team===TEAM_YOU?TEAM_FOE:TEAM_YOU);
    for(let k=0;k<20;k++){const n=N[Math.floor(rng()*N.length)];if(n.up||n.base)continue;if(Math.hypot(n.x-foe.x,n.z-foe.z)<foe.shieldR+25)continue;if(GS.playD(n.x,n.z)>-3)continue;return V3(n.x,0,n.z);}
    return V3(R(-GS.HALF*.4,GS.HALF*.4),0,R(-GS.HALF*.4,GS.HALF*.4));}
  /* ---------- the guns ---------- */
  function shoot(S,tg,d){const V=S.V;V.g.updateMatrixWorld(true);const from=V.turret?V.turret.localToWorld(_b.copy(V.muz)).clone():S.c.clone().setY(S.c.y+1);
    const aim=tg.pos.clone().setY(tg.pos.y+(tg.hog?1:tg.player?(P.crouch?.95:1.3):1.3));
    const chance=tg.player?DMG.hitChance()*(S.weap==='chain'?.8:.9):tg.hog?.6:clamp(.55-d/300,.2,.5),hit=rng()<chance;if(!hit)aim.add(_c.set(R(-2,2),R(-.6,1.6),R(-2,2)));
    if(losBlock(from,aim)){S.cool=.3;return;}
    const col=TEAMS[S.team].c,red=S.team===TEAM_FOE;
    if(S.weap==='chain'){boom(from,.5,0xffd890,.05);fire(from,aim,240,'chain',q=>{boom(q,.6,0xffe0b0,.2);if(!hit){puff(q,.5,.5);return;}
        if(tg.player)hurtPlayer(youDmg()*1.1,S.c,true);else if(tg.hog)hurt(tg,30,S.team);else hurtBot(tg,22,'',S.team);});
      if(typeof sfx!=='undefined'&&sfx.at)sfx.at('gun.warthog',from);return;}
    if(S.weap==='rocket'){for(const sx of[-.6,.6]){const a2=aim.clone().add(_c.set(sx,0,0));fire(from.clone(),a2,110,red?'mboltR':'mbolt',q=>{boom(q,4,0xfff0c0,.35);boom(q,7,0xff8a3a,.7);puff(q,2.5,1.8);
        if(typeof sfx!=='undefined')sfx.blast&&sfx.blast(q);
        if(hit&&tg.hog)hurt(tg,120,S.team);MPAIR.onBlast(q,S.team,5.5,70);});}return;}
    boom(from,1,col,.12);fire(from,aim,900,'hlaser',q=>{boom(q,1.8,0xbff8ff,.3);if(!hit){puff(q,.8,.8);return;}
      if(tg.player)hurtPlayer(youDmg()*3,S.c,true);else if(tg.hog)hurt(tg,140,S.team);else hurtBot(tg,95,'',S.team);});}
  /* ---------- one hog, one frame ---------- */
  function drive(S,dt){const V=S.V,p=V.g.position;
    S.re-=dt;if(S.re<=0||(S.tg&&tg_dead(S.tg))){S.re=R(.5,.9);S.tg=pick(S);}
    const tg=S.tg;let gx,gz,want=15;
    if(tg){const d=Math.hypot(tg.pos.x-p.x,tg.pos.z-p.z);
      if(d>ORBIT+12){gx=tg.pos.x;gz=tg.pos.z;}
      else{// circle it at gun range: a point a quarter turn round from where the hog is now
        const a=Math.atan2(p.x-tg.pos.x,p.z-tg.pos.z)+(S.i%2?.7:-.7);gx=tg.pos.x+Math.sin(a)*ORBIT;gz=tg.pos.z+Math.cos(a)*ORBIT;want=9;}}
    else{S.goalT-=dt;if(!S.goal||S.goalT<=0||Math.hypot(S.goal.x-p.x,S.goal.z-p.z)<12){S.goal=roam(S);S.goalT=R(25,45);}gx=S.goal.x;gz=S.goal.z;}
    navToward(p.x,p.z,gx,gz,_a);const wy=Math.atan2(-_a.x,-_a.z);let off=angDiff(wy,V.yaw);
    // stuck against something: back off, turning, then go again
    S.stuckT+=dt;if(S.stuckT>1.4){S.stuckT=0;if(S.stuckP&&Math.hypot(p.x-S.stuckP.x,p.z-S.stuckP.z)<1.6&&S.revT<=0){S.revT=1.3;S.revS=rng()<.5?-1:1;if(++S.stuck>3){S.goal=null;S.stuck=0;}}else if(S.revT<=0)S.stuck=0;(S.stuckP||(S.stuckP=new THREE.Vector3())).copy(p);}
    let tv;if(S.revT>0){S.revT-=dt;tv=-6;off=S.revS*1.2;}else tv=Math.abs(off)>1.1?5:want;
    S.v+=clamp(tv-S.v,-14*dt,9*dt);
    const grip=clamp(Math.abs(S.v)/5,.25,1),rate=1.9*grip;V.yaw+=clamp(off*3,-rate,rate)*dt*(S.v<0?-1:1);
    const fx=-Math.sin(V.yaw),fz=-Math.cos(V.yaw),ox=p.x,oz=p.z;_a.set(p.x,p.y,p.z);
    V.ob.ghost=true;moveBody.drive=true;moveBody(_a,fx*S.v*dt,fz*S.v*dt,2.1);moveBody.drive=false;V.ob.ghost=false;
    if(GS.playD(_a.x,_a.z)>-1.6){_a.set(ox,0,oz);S.v*=-.3;}
    // the other side's dome turns it away
    for(const B of GS.BASES){if(B.team===S.team)continue;const dx=_a.x-B.x,dz=_a.z-B.z,dd=Math.hypot(dx,dz);if(dd<B.shieldR+3){_a.x=B.x+dx/dd*(B.shieldR+3);_a.z=B.z+dz/dd*(B.shieldR+3);S.v*=-.3;S.goal=null;}}
    p.x=_a.x;p.z=_a.z;
    // run them down
    if(Math.abs(S.v)>6){for(const B of BOTS){if(B.team===S.team||B.H.dead||B.respT>0)continue;if(Math.hypot(B.pos.x-p.x,B.pos.z-p.z)<2.6){hurtBot(B,999,'',S.team);boom(B.pos.clone().setY(B.pos.y+1),2,0xffe0c0,.3);S.v*=.9;}}
      if(S.team!==TEAM_YOU&&P.alive&&!VEH.cur&&!MPAIR.flying()&&Math.hypot(P.pos.x-p.x,P.pos.z-p.z)<2.6&&Math.abs(P.pos.y-p.y)<2)hurtPlayer(9999,S.c,true);}
    // on the ground: pitch and roll from the wheels (as js/shared/vehicles.js driveRover)
    const gy=groundY(p.x,p.z),fy=groundY(p.x+fx*1.6,p.z+fz*1.6),by=groundY(p.x-fx*1.6,p.z-fz*1.6),rx=Math.cos(V.yaw),rz=-Math.sin(V.yaw),ly=groundY(p.x-rx,p.z-rz),ry=groundY(p.x+rx,p.z+rz);
    V.pitch+=(Math.atan2(fy-by,3.2)-V.pitch)*(1-Math.exp(-dt*8));V.roll+=(Math.atan2(ly-ry,2)-V.roll)*(1-Math.exp(-dt*8));
    V.bob+=dt*Math.abs(S.v)*.9;p.y=Math.max(gy,(fy+by)/2)+Math.sin(V.bob)*.025*Math.min(1,Math.abs(S.v)/8);
    V.g.rotation.set(0,0,0);_e.set(V.pitch,V.yaw,V.roll,'YXZ');V.g.quaternion.setFromEuler(_e);V.ob.x=p.x;V.ob.z=p.z;V.v=0;
    S.pos.copy(p);S.c.copy(p).setY(p.y+1.1);
    if(Math.abs(S.v)>6&&rng()<dt*10)puff(p.clone().add(_b.set(R(-1,1),.3,R(-1,1))).addScaledVector(_c.set(-fx,0,-fz),2.2),R(.8,1.6),1.4);
    if(typeof sfx!=='undefined'&&sfx.loopAt&&p.distanceTo(camera.position)<70){const n=Math.min(1,Math.abs(S.v)/15);sfx.loopAt('loop.warthog','hog'+S.team+S.i,p,.1+n*.12,.75+n*.5);}
    // the gun: onto the target, and firing when it bears
    if(V.turret){const local=tg?Math.atan2(-(tg.pos.x-p.x),-(tg.pos.z-p.z))-V.yaw:0;V.turret.rotation.y=angLerp(V.turret.rotation.y,local,1-Math.exp(-dt*6));}
    S.cool-=dt;if(tg&&S.cool<=0&&phase==='play'){const d=tg.pos.distanceTo(p);S.cool=1/RATE[S.weap]*R(.9,1.15);if(d<(S.weap==='chain'?110:140))shoot(S,tg,d);}
    // the crew in their seats (the gunner turned toward what he's shooting)
    for(const A of S.crew){A.yaw=tg?Math.atan2(-(tg.pos.x-p.x),-(tg.pos.z-p.z)):V.yaw;VEH.seatAlly(A,dt,A.seat?1:0);}}
  function respawn(S){const V=S.V;if(V){if(V.g.parent)V.g.parent.remove(V.g);const i=VEH.LIST.indexOf(V);if(i>=0)VEH.LIST.splice(i,1);const j=OBST.indexOf(V.ob);if(j>=0)OBST.splice(j,1);}build(S);}
  function update(dt){for(const S of HOGS){
    if(S.H.dead){S.backT-=dt;for(const A of S.crew)if(A.H.root.visible)poseHuman(A.H,dt,0,0);if(S.backT<=0)respawn(S);continue;}
    drive(S,dt);}}
  return{HOGS,add,update,hurt,blast,foes};
})();
for(let i=0;i<AI_HOGS;i++){MPHOG.add(TEAM_YOU,i);MPHOG.add(TEAM_FOE,i);}
