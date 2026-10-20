/* Elyra · Origin — play: Lt. Michael on foot (third person), the Keeper squad, the Empty Host, their dropships, and the fight.
   PC: WASD move, mouse aims (click to lock), left or right mouse fires, G or F throws a grenade, Shift sprints, Space jumps, E boards.
   Phone: left thumb moves (push to the edge to sprint), right thumb aims, FIRE, NADE, JUMP, BOARD. */
window.AUDIO_SCALE=25;   // sounds placed in metres
const OD=DIFF.origin||DIFF.tide;   // ground-fight numbers (DIFFS in js/shared/progress.js): damage, fire rate, trooper health, accuracy, extra troopers per group
// small-arms bolts, sized in metres
BK.rifle={len:2.4,w:.06,head:.8,col:0x9ff4ff,bc:0x6fe0ff};BK.krifle={len:2.2,w:.06,head:.7,col:0xbfe8ff,bc:0x7fd0ff};BK.hrifle={len:2.4,w:.07,head:.9,col:0xd8a0ff,bc:0xa45cff};
for(const k of['rifle','krifle','hrifle'])boltMats[k]=new THREE.MeshBasicMaterial({color:C(BK[k].bc).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const _v=new THREE.Vector3(),_w=new THREE.Vector3(),_u=new THREE.Vector3();

/* ---------- navigation along the road: far apart, follow the road; close, go straight ---------- */
const ROADS=[],ROAD_LEN=(()=>{let s=0;for(let i=0;i<ROAD.length-1;i++){const [ax,az]=ROAD[i],[bx,bz]=ROAD[i+1],l=Math.hypot(bx-ax,bz-az);ROADS.push({ax,az,bx,bz,l,s0:s});s+=l;}return s;})();
function roadS(x,z){let best=1e9,bs=0;for(const r of ROADS){const dx=r.bx-r.ax,dz=r.bz-r.az,t=clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.l*r.l),0,1),d=Math.hypot(x-r.ax-dx*t,z-r.az-dz*t);if(d<best){best=d;bs=r.s0+t*r.l;}}
  if(z>ROAD[0][1])bs=-(z-ROAD[0][1]);if(z<ROAD[ROAD.length-1][1])bs=ROAD_LEN+(ROAD[ROAD.length-1][1]-z);return bs;}
function roadPt(s){s=clamp(s,0,ROAD_LEN);for(const r of ROADS)if(s<=r.s0+r.l){const t=(s-r.s0)/r.l;return _u.set(r.ax+(r.bx-r.ax)*t,0,r.az+(r.bz-r.az)*t);}const e=ROAD[ROAD.length-1];return _u.set(e[0],0,e[1]);}
function navToward(px,pz,tx,tz,out){const a=roadS(px,pz),b=roadS(tx,tz);
  if(Math.abs(a-b)<22||(a<0&&b<0)||(a>ROAD_LEN&&b>ROAD_LEN))return out.set(tx-px,0,tz-pz);
  const p=roadPt(a+Math.sign(b-a)*16);return out.set(p.x-px,0,p.z-pz);}
// move a body by (dx,dz), sliding along the canyon walls and around obstacles
function moveBody(pos,dx,dz,rad){
  let nx=pos.x+dx,nz=pos.z+dz;
  for(const o of OBST){const ox=nx-o.x,oz=nz-o.z,d=Math.hypot(ox,oz),m=o.r+rad;if(d<m&&d>1e-4){nx=o.x+ox/d*m;nz=o.z+oz/d*m;}}
  if(playD(nx,nz)>-rad){if(playD(nx,pos.z)<=-rad)nz=pos.z;else if(playD(pos.x,nz)<=-rad)nx=pos.x;else{nx=pos.x;nz=pos.z;}}
  pos.x=nx;pos.z=nz;
}
// steer a walker heading along unit (dx,dz) around what's ahead. A barricade counts as one wall: go round its nearer end.
// side (+1/-1) breaks the tie when a rock sits dead ahead, so a squad splits around it instead of pressing into it.
function steer(pos,out,rad,side){
  const dx=out.x,dz=out.z,look=5.5;let ox=0,oz=0;
  for(const o of OBST){if(o.bar)continue;const rx=o.x-pos.x,rz=o.z-pos.z,along=rx*dx+rz*dz;if(along<-.5||along>look+o.r)continue;
    const lat=-rx*dz+rz*dx,clear=o.r+rad+.6;if(Math.abs(lat)>=clear)continue;
    const sd=Math.abs(lat)<.2?side:-Math.sign(lat),w=(1-Math.abs(lat)/clear)*(1.2-Math.max(0,along)/(look+o.r));ox+=-dz*sd*w*1.6;oz+=dx*sd*w*1.6;}
  for(const B of BARS){const ux=B.bx-B.ax,uz=B.bz-B.az,L=Math.hypot(ux,uz),ax=ux/L,az=uz/L,clear=B.r+rad+.5;let hit=false;
    for(let k=.5;k<=look;k+=1){const px=pos.x+dx*k,pz=pos.z+dz*k;if(segDist(px,pz,B.ax,B.az,B.bx,B.bz)<clear){hit=true;break;}}
    if(!hit)continue;
    // aim past whichever end is nearer along the wall
    const t=((pos.x-B.ax)*ax+(pos.z-B.az)*az)/L,end=t<.5?-1:1,ex=(end<0?B.ax:B.bx)+ax*end*(rad+1.3),ez=(end<0?B.az:B.bz)+az*end*(rad+1.3);
    let tx=ex-pos.x,tz=ez-pos.z;const tl=Math.hypot(tx,tz)||1;ox+=(tx/tl-dx)*1.4;oz+=(tz/tl-dz)*1.4;}
  out.x+=ox;out.z+=oz;const l=Math.hypot(out.x,out.z)||1;out.x/=l;out.z/=l;return out;}
// a walker that has been pushing without getting anywhere side-steps for a moment
function unstick(W,dt,moving,dir){
  W.stT=(W.stT||0)+dt;if(!W.stP)W.stP=W.pos.clone();
  if(W.detour>0){W.detour-=dt;const s=W.side||1;const x=dir.x,z=dir.z;dir.x=x*.3-z*s;dir.z=z*.3+x*s;const l=Math.hypot(dir.x,dir.z)||1;dir.x/=l;dir.z/=l;}
  if(W.stT>.9){if(moving&&W.pos.distanceTo(W.stP)<.6){W.detour=1.1;W.side=-(W.side||1);}W.stT=0;W.stP.copy(W.pos);}}
// keep a crowd from standing inside one another
function separate(list,rad){for(let i=0;i<list.length;i++){const a=list[i];if(a.H.dead||a.on===false)continue;for(let j=i+1;j<list.length;j++){const b=list[j];if(b.H.dead||b.on===false)continue;
  const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.hypot(dx,dz),m=rad*2;if(d<m&&d>1e-3){const k=(m-d)/2/d;a.pos.x-=dx*k;a.pos.z-=dz*k;b.pos.x+=dx*k;b.pos.z+=dz*k;}else if(d<=1e-3){a.pos.x-=.05;b.pos.x+=.05;}}}}
// is the straight line between two points blocked by cover? (only obstacles taller than a crouch block it)
function blocked(a,b){const dx=b.x-a.x,dz=b.z-a.z,L2=dx*dx+dz*dz||1;
  for(const o of OBST){if(o.h<1)continue;const t=clamp(((o.x-a.x)*dx+(o.z-a.z)*dz)/L2,.05,.95),px=a.x+dx*t-o.x,pz=a.z+dz*t-o.z;if(px*px+pz*pz<o.r*o.r*.8)return true;}
  return false;}

/* ---------- you ---------- */
const P={yaw:0,pitch:-.05,vy:0,hp:100,shield:100,alive:true,respawnT:0,lastHit:-99,cool:0,nadeCD:0,H:makeHuman('marine'),moving:0,
  run:false,input:true,spawn:new THREE.Vector3(LZ.x,0,LZ.z-14),kills:0};
P.pos=P.H.root.position;P.pos.set(LZ.x,0,LZ.z-14);scene.add(P.H.root);
const keys={},joy={x:0,y:0,bx:0,by:0};let fireHeld=false,locked=false,T=0;
addEventListener('keydown',e=>{keys[e.code]=true;if(/^(Arrow|Space)/.test(e.code))e.preventDefault();if(!e.repeat&&(e.code==='KeyG'||e.code==='KeyF'))throwNade();if(!e.repeat&&e.code==='KeyE')useAction();dismissHint();});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;fireHeld=false;});
const cv=renderer.domElement,ptrs=new Map(),joyEl=$('joy'),knob=$('knob');let joyId=null,lookId=null;
cv.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'){if(locked)fireHeld=true;else if(!coarse&&cv.requestPointerLock){try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(_){}}return;}
  try{cv.setPointerCapture(e.pointerId);}catch(_){}dismissHint();
  if(joyId===null&&e.clientX<innerWidth*.45){joyId=e.pointerId;joy.bx=e.clientX;joy.by=e.clientY;joyEl.style.left=e.clientX+'px';joyEl.style.top=e.clientY+'px';knob.style.transform='';joyEl.hidden=false;}
  else if(lookId===null)lookId=e.pointerId;
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(e.pointerId===joyId){let jx=e.clientX-joy.bx,jy=e.clientY-joy.by;const L=Math.hypot(jx,jy),mx=52;if(L>mx){jx*=mx/L;jy*=mx/L;}joy.x=jx/mx;joy.y=-jy/mx;knob.style.transform=`translate(${jx}px,${jy}px)`;}
  else if(e.pointerId===lookId&&P.input){P.yaw-=dx*.006;P.pitch=clamp(P.pitch-dy*.005,-.9,.7);}});
const endPtr=e=>{if(e.pointerId===joyId){joyId=null;joy.x=joy.y=0;joyEl.hidden=true;}if(e.pointerId===lookId)lookId=null;ptrs.delete(e.pointerId);};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
addEventListener('mouseup',()=>{fireHeld=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===cv;cv.style.cursor=locked?'none':'';if(!locked)fireHeld=false;});
cv.addEventListener('mousemove',e=>{if(!locked||!P.input)return;P.yaw-=(e.movementX||0)*.0023;P.pitch=clamp(P.pitch-(e.movementY||0)*.0023,-.9,.7);});
function holdBtn(el,on,off){el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}el.classList.add('on');on();});
  const f=()=>{el.classList.remove('on');if(off)off();};el.addEventListener('pointerup',f);el.addEventListener('pointercancel',f);el.addEventListener('lostpointercapture',f);el.addEventListener('contextmenu',e=>e.preventDefault());}
holdBtn($('fire'),()=>{fireHeld=true;},()=>{fireHeld=false;});
holdBtn($('nade'),()=>throwNade());holdBtn($('jump'),()=>{keys.Space=true;setTimeout(()=>keys.Space=false,120);});holdBtn($('use'),()=>useAction());
const hint=$('hint');
hint.textContent=coarse?'Left thumb moves (push to the edge to sprint) · right thumb aims · FIRE · NADE throws a grenade':'Click to lock the mouse · WASD move · mouse aims · left or right click fires · G grenade · Shift sprint · Space jump';
let hintGone=false;function dismissHint(){if(hintGone)return;hintGone=true;setTimeout(()=>hint.classList.add('gone'),3500);}
let onUse=null;function useAction(){if(onUse)onUse();}

/* ---------- aiming: a ray from the camera through the crosshair ---------- */
function aimRay(maxD){const o=camera.position.clone(),d=camera.getWorldDirection(new THREE.Vector3());
  let bt=maxD,hit=null;
  for(const E of ENEMIES){if(E.H.dead)continue;const t=rayCapsule(o,d,E.pos,1.95*E.scale,.42);if(t>0&&t<bt){bt=t;hit={E};}}
  for(const D of DROPS){if(D.dead||!D.g.visible)continue;const t=raySphere(o,d,D.g.position,7);if(t>0&&t<bt){bt=t;hit={D};}}
  for(const ob of OBST){const t=rayCapsule(o,d,_w.set(ob.x,groundY(ob.x,ob.z),ob.z),ob.h,ob.r*.85);if(t>0&&t<bt){bt=t;hit=null;}}
  // terrain: march along the ray
  for(let s=1;s<bt;s+=1.5){_v.copy(o).addScaledVector(d,s);if(_v.y<groundY(_v.x,_v.z)){bt=s;hit=null;break;}}
  return{p:o.addScaledVector(d,bt),hit,dist:bt};}
function raySphere(o,d,c,r){_w.subVectors(c,o);const t=_w.dot(d);if(t<0)return-1;const q=_w.lengthSq()-t*t;return q<r*r?t-Math.sqrt(r*r-q):-1;}
function rayCapsule(o,d,base,h,r){   // vertical capsule: closest approach of the ray to the segment base..base+h
  const bx=base.x,by=base.y,bz=base.z;let best=-1;for(let k=0;k<=4;k++){const c=_u.set(bx,by+h*k/4,bz),t=raySphere(o,d,c,r);if(t>0&&(best<0||t<best))best=t;}return best;}

/* ---------- your weapons ---------- */
function muzzle(H){H.root.updateMatrixWorld(true);return H.arms[1].el.localToWorld(new THREE.Vector3(0,-.28,-.95));}   // the barrel's tip, after this frame's pose
function playerShoot(){
  P.cool=.13;const A=aimRay(160),from=muzzle(P.H);boom(from,.35,0x9ff4ff,.06);
  fire(from,A.p,170,'rifle',p=>{boom(p,.6,0xbff4ff,.25);
    if(A.hit&&A.hit.E)hurtEnemy(A.hit.E,1,'gun');else if(A.hit&&A.hit.D)hurtDrop(A.hit.D,1,p);else puff(p,.6,.6);});
}
const NADES=[],nadeGeo=new THREE.SphereGeometry(.12,8,6),nadeMat=new THREE.MeshBasicMaterial({color:C(0xffd27a).multiplyScalar(2)});
function throwNade(){if(!P.alive||!P.input||P.nadeCD>0)return;P.nadeCD=5;
  const m=new THREE.Mesh(nadeGeo,nadeMat);scene.add(m);m.position.copy(P.pos).add(_v.set(0,1.7,0));
  const d=camera.getWorldDirection(new THREE.Vector3());d.y+=.35;d.normalize();
  NADES.push({m,v:d.multiplyScalar(19).add(new THREE.Vector3(0,1,0)),t:0});}
function updateNades(dt){for(let i=NADES.length-1;i>=0;i--){const N=NADES[i];N.t+=dt;N.v.y-=16*dt;N.m.position.addScaledVector(N.v,dt);
  const gy=groundY(N.m.position.x,N.m.position.z);if(N.m.position.y<gy+.12){N.m.position.y=gy+.12;N.v.y*=-.3;N.v.x*=.5;N.v.z*=.5;}
  if(N.t>1.7){const p=N.m.position.clone();scene.remove(N.m);NADES.splice(i,1);blast(p,6,5,true);}}}
function blast(p,r,dmg,mine){boom(p,8,0xfff0c0,.5);boom(p,13,0xff8a3a,1.1);for(let i=0;i<6;i++)puff(p.clone().add(_v.set(R(-2,2),R(0,2),R(-2,2))),R(2,4),R(2,3));
  if(typeof sfx!=='undefined')sfx.blast(p);
  for(const E of ENEMIES){if(E.H.dead)continue;const d=E.pos.distanceTo(p);if(d<r)hurtEnemy(E,dmg*(1-d/r*.6),mine?'nade':'');}
  for(const D of DROPS)if(!D.dead&&D.g.position.distanceTo(p)<r+6)hurtDrop(D,dmg*2,p);
  if(!mine&&P.alive&&P.pos.distanceTo(p)<r)hurtPlayer(25*(1-P.pos.distanceTo(p)/r));}

/* ---------- getting hurt ---------- */
function hurtPlayer(dmg){if(!P.alive||!P.input||(typeof CUTS!=='undefined'&&CUTS.on))return;dmg*=OD.dmg;P.lastHit=T;const s=Math.min(P.shield,dmg);P.shield-=s;P.hp-=dmg-s;
  $('hurt').style.opacity=s>=dmg?.25:.75;setTimeout(()=>$('hurt').style.opacity=0,180);if(typeof sfx!=='undefined')sfx.hit(s>=dmg);
  if(P.hp<=0)playerDown();}
function playerDown(){P.alive=false;P.hp=0;P.respawnT=5;killHuman(P.H);fireHeld=false;PG.say('Keeper Sergeant','Lieutenant down! Medic! Get him up!','alert',4);
  banner('You are down · your squad is pulling you back','alert');}
function playerUp(){P.alive=true;P.hp=100;P.shield=100;reviveHuman(P.H);P.pos.copy(P.spawn);P.pos.y=groundY(P.pos.x,P.pos.z);}

/* ---------- the Empty Host: troopers that advance, take cover, and fire purple bursts ---------- */
const ENEMIES=[];
function spawnTrooper(x,z,opts){opts=opts||{};
  if(ENEMIES.filter(E=>!E.H.dead).length>=(coarse?14:22))return null;
  const H=makeHuman('trooper');scene.add(H.root);
  const E={H,pos:H.root.position,scale:1.16,yaw:0,hp:Math.max(2,Math.round(3*OD.ehp)),cool:R(1,2.5),burst:0,bt:0,goal:opts.goal||null,hold:opts.hold||R(14,26),
    target:null,retarget:0,t:0,speed:R(3.2,4.2),gone:0,big:false,side:rng()<.5?-1:1,
    anchor:opts.anchor||null,perch:!!opts.perch};   // anchor: holds a spot in cover until you close in; perch: a rifleman up on the canyon wall
  E.pos.set(x,groundY(x,z),z);ENEMIES.push(E);return E;}
function hurtEnemy(E,dmg,how){if(E.H.dead)return;E.hp-=dmg;E.flinch=.15;
  if(how==='gun'){$('cross').classList.add('hit');clearTimeout(hurtEnemy.t);hurtEnemy.t=setTimeout(()=>$('cross').classList.remove('hit'),90);}
  if(E.hp<=0){killHuman(E.H);boom(E.pos.clone().add(_v.set(0,1.2,0)),1.6,HOLLOW_GLOW,.5);if(typeof sfx!=='undefined')sfx.trooperDown(E.pos);
    if(how){P.kills++;PG.kill(how==='nade'?150:100,E.pos.clone().add(_v.set(0,2,0)),how);PG.prog('okills');if(how==='nade')PG.done('onade');}}}
function nearestFoe(E){   // who a trooper shoots at: you, a squadmate, or an engineer
  let best=null,bd=1e9;
  if(P.alive&&P.input){const d=E.pos.distanceTo(P.pos)*.55;if(d<bd){bd=d;best={pos:P.pos,player:true};}}   // the Host wants the lieutenant most
  for(const A of ALLIES){if(!A.on||A.H.dead)continue;const d=E.pos.distanceTo(A.pos);if(d<bd){bd=d;best={pos:A.pos,A};}}
  return best;}
function updateEnemies(dt){
  separate(ENEMIES.filter(E=>!E.perch),.5);
  for(let i=ENEMIES.length-1;i>=0;i--){const E=ENEMIES[i];
    if(E.H.dead){E.gone+=dt;poseHuman(E.H,dt,0,0);if(E.gone>5){scene.remove(E.H.root);ENEMIES.splice(i,1);}continue;}
    E.t+=dt;E.retarget-=dt;if(E.retarget<=0||!E.target){E.retarget=R(1.5,3);E.target=nearestFoe(E);}
    const tg=E.target;let speed=0,aim=0;
    // anchored troopers keep their cover until you get close (or the fight moves past them)
    if(E.anchor&&tg&&(E.pos.distanceTo(tg.pos)<11||roadS(tg.pos.x,tg.pos.z)>roadS(E.anchor.x,E.anchor.z)+6))E.anchor=null;
    const goal=E.goal||E.anchor||(tg?tg.pos:null);
    if(goal){const d=E.pos.distanceTo(tg?tg.pos:goal);
      const see=tg&&!blocked(_v.copy(E.pos).setY(E.pos.y+1.5),_w.copy(tg.pos).setY(tg.pos.y+1.4));
      const want=E.perch?false:E.goal||E.anchor?E.pos.distanceTo(goal)>(E.anchor?.8:3):(d>E.hold||!see);
      if(want){navToward(E.pos.x,E.pos.z,goal.x,goal.z,_w);const L=_w.length();if(L>.1){_w.multiplyScalar(1/L);steer(E.pos,_w,.45,E.side);unstick(E,dt,true,_w);speed=E.speed*(E.flinch>0?.3:1);
        moveBody(E.pos,_w.x*speed*dt,_w.z*speed*dt,.45);E.yaw=Math.atan2(-_w.x,-_w.z);}}
      else{E.stT=0;if(E.goal&&E.pos.distanceTo(E.goal)<=3)E.goal=null;}
      if(tg&&d<70){if(!want)E.yaw=Math.atan2(-(tg.pos.x-E.pos.x),-(tg.pos.z-E.pos.z));aim=1;
        // bursts of three
        E.cool-=dt;if(E.cool<=0&&see&&d<60){E.burst=3;E.cool=R(1.4,2.6)/OD.rof;E.bt=0;}
        if(E.burst>0){E.bt-=dt;if(E.bt<=0){E.bt=.17;E.burst--;trooperShot(E,tg,d);}}}}
    E.flinch=Math.max(0,(E.flinch||0)-dt);
    if(!E.perch)E.H.aimPitch=tg?clamp(Math.atan2(tg.pos.y-E.pos.y,Math.hypot(tg.pos.x-E.pos.x,tg.pos.z-E.pos.z)),-.6,.6):0;else E.H.aimPitch=tg?clamp(Math.atan2(tg.pos.y-E.pos.y,Math.hypot(tg.pos.x-E.pos.x,tg.pos.z-E.pos.z)),-.9,.3):0;
    if(!E.perch)E.pos.y=groundY(E.pos.x,E.pos.z);E.H.root.rotation.y=angLerp(E.H.root.rotation.y,E.yaw,1-Math.exp(-dt*10));poseHuman(E.H,dt,speed,aim,speed>3.5);
  }}
function trooperShot(E,tg,d){const from=muzzle(E.H),to=_w.copy(tg.pos).add(_v.set(0,1.3,0));
  const runK=tg.player&&P.run?.6:1,p=Math.min(.75,.34*(OD.acc||1)*clamp(1-d/70,.2,1)*runK);const hit=rng()<p;
  if(!hit)to.add(_v.set(R(-1.6,1.6),R(-.6,1.2),R(-1.6,1.6)));
  boom(from,.4,HOLLOW_GLOW,.08);const tgt=tg;
  fire(from,to.clone(),110,'hrifle',q=>{boom(q,.7,0xd8a0ff,.25);if(hit){if(tgt.player)hurtPlayer(8);else if(tgt.A)tgt.A.hits++;}else puff(q,.5,.5);});}

/* ---------- Empty Host dropships: fly in, set down, unload four troopers, lift away ---------- */
const DROPS=[],DSG2=hostDropshipGeo(),dropMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.6}),dropGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)});
function launchDrop(land){const g=new THREE.Group();g.add(new THREE.Mesh(DSG2.geo,dropMat),new THREE.Mesh(DSG2.glow,dropGlow));g.scale.setScalar(.38);g.children[0].castShadow=true;
  const from=new THREE.Vector3(land.x+R(-60,60),90,land.z-260);g.position.copy(from);scene.add(g);
  const D={g,from,land:land.clone().setY(groundY(land.x,land.z)+3),t:0,state:'in',hp:Math.round(28*OD.ehp),dead:false,unloaded:false};DROPS.push(D);if(typeof sfx!=='undefined')sfx.horn(D.land);return D;}
function hurtDrop(D,dmg,p){if(D.dead)return;D.hp-=dmg;boom(p,1.2,0xfff1c8,.25);if(D.hp<=0){D.dead=true;D.t=0;boom(D.g.position,14,0xfff0c0,.6);boom(D.g.position,20,0xff6a1a,1.4);
  if(typeof sfx!=='undefined')sfx.blast(D.g.position);PG.kill(600,D.g.position,'gun');PG.prog('odrops');}}
function updateDrops(dt){for(let i=DROPS.length-1;i>=0;i--){const D=DROPS[i];D.t+=dt;const g=D.g;
  if(D.dead){g.position.y-=dt*14;g.rotation.z+=dt*.8;if(rng()<dt*14)boom(g.position.clone().add(_v.set(R(-4,4),0,R(-4,4))),R(3,6),0xff7a1a,.7);
    if(g.position.y<groundY(g.position.x,g.position.z)+1){blast(g.position.clone(),10,6,true);scene.remove(g);DROPS.splice(i,1);}continue;}
  if(D.state==='in'){const u=Math.min(1,D.t/7),e=1-(1-u)*(1-u);g.position.lerpVectors(D.from,D.land,e);g.lookAt(D.land.x,g.position.y,D.land.z+(D.land.z>D.from.z?40:-40));
    if(u>=1){D.state='down';D.t=0;}}
  else if(D.state==='down'){if(!D.unloaded&&D.t>1){D.unloaded=true;for(let k=0;k<4;k++){const a=k/4*Math.PI*2;spawnTrooper(D.land.x+Math.cos(a)*5,D.land.z+Math.sin(a)*5);}}
    if(D.t>4){D.state='out';D.t=0;}}
  else{g.position.y+=dt*(8+D.t*6);g.position.z-=dt*D.t*10;if(D.t>9){scene.remove(g);DROPS.splice(i,1);}}}}

/* ---------- the Keeper squad ---------- */
const ALLIES=[];
function addAlly(style,x,z,name){const H=makeHuman(style);scene.add(H.root);const A={H,pos:H.root.position,style,name,yaw:0,goal:null,on:true,cool:R(.5,1.5),burst:0,bt:0,hits:0,
  armed:style==='marine',work:false,target:null,retarget:0,side:ALLIES.length%2?1:-1};A.pos.set(x,groundY(x,z),z);ALLIES.push(A);return A;}
function updateAllies(dt){
  separate(ALLIES,.55);
  for(const A of ALLIES){if(!A.on){A.H.root.visible=false;continue;}A.H.root.visible=true;
    let speed=0,aim=0;
    if(A.goal){const dx=A.goal.x-A.pos.x,dz=A.goal.z-A.pos.z,d=Math.hypot(dx,dz);
      if(d>1.2){navToward(A.pos.x,A.pos.z,A.goal.x,A.goal.z,_w);const L=_w.length()||1;_w.multiplyScalar(1/L);steer(A.pos,_w,.45,A.side);unstick(A,dt,true,_w);
        const run=d>8;speed=run?5.6:2.8;moveBody(A.pos,_w.x*speed*dt,_w.z*speed*dt,.45);A.yaw=Math.atan2(-_w.x,-_w.z);}else A.stT=0;}
    if(A.armed){A.retarget-=dt;if(A.retarget<=0){A.retarget=R(.8,1.6);let bd=55,b=null;for(const E of ENEMIES){if(E.H.dead)continue;const d=E.pos.distanceTo(A.pos);if(d<bd){bd=d;b=E;}}A.target=b;}
      const E=A.target;if(E&&!E.H.dead){aim=1;if(speed<3)A.yaw=Math.atan2(-(E.pos.x-A.pos.x),-(E.pos.z-A.pos.z));
        A.cool-=dt;if(A.cool<=0){A.cool=R(1,2);A.burst=3;A.bt=0;}
        if(A.burst>0){A.bt-=dt;if(A.bt<=0){A.bt=.15;A.burst--;const from=muzzle(A.H),d=A.pos.distanceTo(E.pos),hit=rng()<.22*clamp(1-d/60,.2,1),to=E.pos.clone().add(_v.set(0,1.4,0));
          if(!hit)to.add(_v.set(R(-1.5,1.5),R(-.5,1),R(-1.5,1.5)));const tE=E;fire(from,to,150,'krifle',q=>{boom(q,.5,0xbfe8ff,.2);if(hit)hurtEnemy(tE,1,'');});}}}}
    A.pos.y=groundY(A.pos.x,A.pos.z);A.H.root.rotation.y=angLerp(A.H.root.rotation.y,A.yaw,1-Math.exp(-dt*8));poseHuman(A.H,dt,speed,A.work?0:aim,speed>4);
    if(A.work){A.H.arms[0].sh.rotation.x=-.9+Math.sin(T*6)*.25;A.H.arms[1].sh.rotation.x=-.7+Math.cos(T*5)*.2;A.H.torso.rotation.x=.25;}
  }}
function angLerp(a,b,k){let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*k;}

/* ---------- your movement and the over-the-shoulder camera ---------- */
const CAM={dist:4.3,side:1.15,up:.45};
function stepPlayer(dt){
  const H=P.H;
  if(!P.alive){P.respawnT-=dt;poseHuman(H,dt,0,0);if(P.respawnT<=0)playerUp();return;}
  let f=0,s=0;
  if(P.input){if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD||keys.ArrowRight)s+=1;if(keys.KeyA||keys.ArrowLeft)s-=1;f+=joy.y;s+=joy.x;}
  const L=Math.hypot(f,s);if(L>1){f/=L;s/=L;}
  P.run=P.input&&(keys.ShiftLeft||keys.ShiftRight||Math.hypot(joy.x,joy.y)>.95)&&f>.3;
  const sp=P.run?7.2:fireHeld?3.4:4.6,fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
  moveBody(P.pos,(fx*f+rx*s)*sp*dt,(fz*f+rz*s)*sp*dt,.45);
  const gy=groundY(P.pos.x,P.pos.z);
  if(P.input&&keys.Space&&P.pos.y<=gy+.02)P.vy=5.2;
  P.vy-=16*dt;P.pos.y+=P.vy*dt;if(P.pos.y<gy){P.pos.y=gy;P.vy=0;}
  P.moving=L*sp;
  H.root.rotation.y=P.yaw;H.aimPitch=P.pitch;poseHuman(H,dt,P.moving,P.run?.25:1,P.run);
  // shields come back after three quiet seconds
  if(T-P.lastHit>3)P.shield=Math.min(100,P.shield+dt*25);
  P.cool-=dt;P.nadeCD=Math.max(0,P.nadeCD-dt);
  if(fireHeld&&P.cool<=0&&P.input)playerShoot();
}
function placeCamera(){
  const cp=Math.cos(P.pitch),sp=Math.sin(P.pitch),fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
  const head=_v.copy(P.pos).add(_w.set(0,1.62,0));
  camera.position.set(head.x-fx*CAM.dist*cp+rx*CAM.side,head.y+CAM.up-sp*CAM.dist,head.z-fz*CAM.dist*cp+rz*CAM.side);
  const g=groundY(camera.position.x,camera.position.z)+.4;if(camera.position.y<g)camera.position.y=g;
  camera.rotation.set(P.pitch,P.yaw,0);}

/* ---------- HUD bits ---------- */
SHUD.update({zeal:null,sub:false});
let bannerT=0;function banner(t,cls){const b=$('banner');b.textContent=t;b.className='hud banner'+(cls?' '+cls:'');bannerT=4;}
function updateHud(dt){bannerT-=dt;if(bannerT<=0)$('banner').classList.add('quiet');
  SHUD.update({shield:P.shield,hull:P.hp,down:!P.alive});
  const arm=P.alive&&P.input;$('fire').hidden=!coarse||!arm;$('nade').hidden=!coarse||!arm;$('jump').hidden=!coarse||!arm;$('nade').disabled=P.nadeCD>0;$('cross').hidden=!arm;
  $('use').hidden=!coarse||!onUse||!arm;}
function updateDust(){const a=dustG.attributes.position.array;for(let i=0;i<DUST_N;i++){let x=a[i*3],z=a[i*3+2];
  if(x-camera.position.x>80)x-=160;if(camera.position.x-x>80)x+=160;if(z-camera.position.z>80)z-=160;if(camera.position.z-z>80)z+=160;a[i*3]=x+.02;a[i*3+2]=z;}dustG.attributes.position.needsUpdate=true;}
