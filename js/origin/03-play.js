/* Elyra · Archive 01 · The Mountain — play: Lt. Michael Veyr on foot (third person), the Keeper squad, the Empty Host,
   Hollow turrets, Empty Host dropships, and the fight.
   PC: WASD move, mouse aims (click to lock), left click fires, right click aims down the sights (the Lance has a scope),
       1 2 3 or the wheel switch weapons, R reloads, Q drops the mobile shield, X launches the shoulder sentry,
       G or F throws a grenade, Z burns Zeal, Shift sprints, E boards. (Jump and crouch are switched off for now.)
   Phone: left thumb moves (push to the edge to sprint), right thumb aims, and the buttons on the right. */
window.AUDIO_SCALE=25;   // sounds placed in metres
const OD=DIFF.origin||DIFF.tide;   // ground-fight numbers (DIFFS in js/shared/progress.js)
// small-arms bolts, sized in metres
BK.rifle={len:2.4,w:.06,head:.8,col:0x9ff4ff,bc:0x6fe0ff};BK.krifle={len:2.2,w:.06,head:.7,col:0xbfe8ff,bc:0x7fd0ff};BK.hrifle={len:2.4,w:.07,head:.9,col:0xd8a0ff,bc:0xa45cff};
BK.lance={len:5,w:.05,head:1.4,col:0xffffff,bc:0x9fe0ff};BK.heavy={len:3.4,w:.14,head:1.4,col:0xe6b8ff,bc:0xb060ff};
for(const k of['rifle','krifle','hrifle','lance','heavy'])boltMats[k]=new THREE.MeshBasicMaterial({color:C(BK[k].bc).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const _v=new THREE.Vector3(),_w=new THREE.Vector3(),_u=new THREE.Vector3(),_n=new THREE.Vector3();

/* ---------- navigation through the two canyons: stay in your own canyon, cross the ridge only through a pass or where they meet ---------- */
const CROSS=[SPINE_S0+8,...GAPS.map(g=>g.s),SPINE_S1-8];
function inSpineZone(s){return laneC(s)>laneHalf(s)*.85;}
// a point in a canyon: side -1 west, +1 east; lat is the old lane offset (LANE = the canyon's middle, more or less moves across it)
function lanePoint(s,side,lat,out){const c=roadPt(s,out),n=roadN(s),L=laneHalf(s)-1.5,l=inSpineZone(s)?side*(laneC(s)+clamp(Math.abs(lat==null?LANE:lat)-LANE,-L,L)):(lat||0)*.7;c.x+=n.x*l;c.z+=n.z*l;return c;}
function navToward(px,pz,tx,tz,out){
  if(px<-1600){const a=belowS(px,pz),b=belowS(tx,tz);if(Math.abs(a-b)<14||(a>BLEN&&b>BLEN))return out.set(tx-px,0,tz-pz);const p=belowPt(a+Math.sign(b-a)*10,_u);return out.set(p.x-px,0,p.z-pz);}
  const a=roadS(px,pz),b=roadS(tx,tz);
  if((a<0&&b<0)||(a>ROAD_LEN&&b>ROAD_LEN))return out.set(tx-px,0,tz-pz);
  const la=latOf(px,pz),lb=latOf(tx,tz),sa=la<0?-1:1,sb=lb<0?-1:1;
  // on opposite sides of the spine: go to the best crossing first
  const need=sa!==sb&&(inSpineZone(a)||inSpineZone(b))&&!(a<SPINE_S0-4&&b<SPINE_S0-4)&&!(a>SPINE_S1+4&&b>SPINE_S1+4);
  if(need){let g=CROSS[0],gd=1e9;for(const c of CROSS){const d=Math.abs(a-c)+Math.abs(c-b);if(d<gd){gd=d;g=c;}}
    if(Math.abs(a-g)<3.2){const p=lanePoint(g,sb,LANE,_u);return out.set(p.x-px,0,p.z-pz);}
    const p=lanePoint(a+Math.sign(g-a)*Math.min(14,Math.abs(g-a)),sa,LANE,_u);return out.set(p.x-px,0,p.z-pz);}
  if(Math.abs(a-b)<22)return out.set(tx-px,0,tz-pz);
  const p=lanePoint(a+Math.sign(b-a)*16,sa,inSpineZone(a)?LANE:la,_u);return out.set(p.x-px,0,p.z-pz);}
// move a body by (dx,dz), sliding along the canyon walls and around obstacles
function moveBody(pos,dx,dz,rad){
  let nx=pos.x+dx,nz=pos.z+dz;
  for(const o of OBST){const ox=nx-o.x,oz=nz-o.z,d=Math.hypot(ox,oz),m=o.r+rad;if(d<m&&d>1e-4){nx=o.x+ox/d*m;nz=o.z+oz/d*m;}}
  if(playD(nx,nz)>-rad){if(playD(nx,pos.z)<=-rad)nz=pos.z;else if(playD(pos.x,nz)<=-rad)nx=pos.x;else{nx=pos.x;nz=pos.z;}}
  pos.x=nx;pos.z=nz;
}
// steer a walker heading along unit (dx,dz) around what's ahead. A barricade counts as one wall: go round its nearer end.
function steer(pos,out,rad,side){
  const dx=out.x,dz=out.z,look=5.5;let ox=0,oz=0;
  for(const o of OBST){if(o.bar)continue;const rx=o.x-pos.x,rz=o.z-pos.z,along=rx*dx+rz*dz;if(along<-.5||along>look+o.r)continue;
    const lat=-rx*dz+rz*dx,clear=o.r+rad+.6;if(Math.abs(lat)>=clear)continue;
    const sd=Math.abs(lat)<.2?side:-Math.sign(lat),w=(1-Math.abs(lat)/clear)*(1.2-Math.max(0,along)/(look+o.r));ox+=-dz*sd*w*1.6;oz+=dx*sd*w*1.6;}
  for(const B of BARS){const ux=B.bx-B.ax,uz=B.bz-B.az,L=Math.hypot(ux,uz),ax=ux/L,az=uz/L,clear=B.r+rad+.5;let hit=false;
    for(let k=.5;k<=look;k+=1){const px=pos.x+dx*k,pz=pos.z+dz*k;if(segDist(px,pz,B.ax,B.az,B.bx,B.bz)<clear){hit=true;break;}}
    if(!hit)continue;
    const t=((pos.x-B.ax)*ax+(pos.z-B.az)*az)/L,end=t<.5?-1:1,ex=(end<0?B.ax:B.bx)+ax*end*(rad+1.3),ez=(end<0?B.az:B.bz)+az*end*(rad+1.3);
    let tx=ex-pos.x,tz=ez-pos.z;const tl=Math.hypot(tx,tz)||1;ox+=(tx/tl-dx)*1.4;oz+=(tz/tl-dz)*1.4;}
  out.x+=ox;out.z+=oz;const l=Math.hypot(out.x,out.z)||1;out.x/=l;out.z/=l;return out;}
// a walker that has been pushing without getting anywhere side-steps for a moment
function unstick(W,dt,moving,dir){
  W.stT=(W.stT||0)+dt;if(!W.stP)W.stP=W.pos.clone();
  if(W.detour>0){W.detour-=dt;const s=W.side||1;const x=dir.x,z=dir.z;dir.x=x*.3-z*s;dir.z=z*.3+x*s;const l=Math.hypot(dir.x,dir.z)||1;dir.x/=l;dir.z/=l;}
  if(W.stT>.9){if(moving&&W.pos.distanceTo(W.stP)<.6){W.detour=1.1;W.side=-(W.side||1);}W.stT=0;W.stP.copy(W.pos);}}
// keep a crowd from standing inside one another
function separate(list,rad){for(let i=0;i<list.length;i++){const a=list[i];if(a.H.dead||a.on===false||a.fixed)continue;for(let j=i+1;j<list.length;j++){const b=list[j];if(b.H.dead||b.on===false||b.fixed)continue;
  const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.hypot(dx,dz),m=rad*2;if(d<m&&d>1e-3){const k=(m-d)/2/d;a.pos.x-=dx*k;a.pos.z-=dz*k;b.pos.x+=dx*k;b.pos.z+=dz*k;}else if(d<=1e-3){a.pos.x-=.05;b.pos.x+=.05;}}}}
// is the straight line between two points blocked? Cover taller than a crouch blocks it, and so does the ground (the ridge between the canyons)
function blocked(a,b){const dx=b.x-a.x,dz=b.z-a.z,L2=dx*dx+dz*dz||1;
  for(const o of OBST){if(o.h<1)continue;const t=clamp(((o.x-a.x)*dx+(o.z-a.z)*dz)/L2,.05,.95),px=a.x+dx*t-o.x,pz=a.z+dz*t-o.z;if(px*px+pz*pz<o.r*o.r*.8)return true;}
  const n=Math.min(8,Math.ceil(Math.sqrt(L2)/6));for(let k=1;k<n;k++){const t=k/n;if(groundY(a.x+dx*t,a.z+dz*t)>a.y+(b.y-a.y)*t-.2)return true;}
  return false;}
// is something solid within a step of you, toward a threat? (crouching behind it counts as cover)
function inCover(pos,from){_n.set(from.x-pos.x,0,from.z-pos.z).normalize();for(const o of OBST){if(o.h<1)continue;const rx=o.x-pos.x,rz=o.z-pos.z,d=Math.hypot(rx,rz);if(d>o.r+2.2)continue;if((rx*_n.x+rz*_n.z)/Math.max(d,.01)>.35)return true;}return false;}

/* ---------- you: Lt. Michael Veyr ---------- */
const GUNS=[
  {id:'rifle',name:'Pulse rifle',short:'RIFLE',auto:true,rof:.11,dmg:1,mag:36,res:216,max:360,reload:1.7,spread:.014,ads:.004,zoom:1.45,range:170,kind:'rifle'},
  {id:'lance',name:'Lance marksman',short:'LANCE',auto:false,rof:.45,dmg:3.2,mag:8,res:40,max:64,reload:2.1,spread:.006,ads:0,zoom:3.6,scope:true,range:280,kind:'lance'},
  {id:'breaker',name:'Breaker launcher',short:'BREAKER',auto:false,rof:1,dmg:0,mag:1,res:4,max:8,reload:2.4,spread:.01,ads:.004,zoom:1.3,range:220,rocket:true},
];
const AMMO_K=OD.ammo||1;
const P={yaw:0,pitch:-.05,vy:0,hp:100,shield:100,alive:true,respawnT:0,lastHit:-99,cool:0,nadeCD:0,H:makeHuman('marine'),moving:0,
  run:false,input:true,spawn:new THREE.Vector3(LZ.x,0,LZ.z-14),kills:0,
  gun:0,ammo:GUNS.map(g=>({mag:g.mag,res:Math.round(g.res*AMMO_K)})),reloadT:0,switchT:0,adsHeld:false,ads:0,trigger:false,crouch:false,crouchHold:false,
  zeal:0,zealT:0,zeals:0,wallCD:0,sentryCD:0,wall:null,sentry:null};
P.pos=P.H.root.position;P.pos.set(LZ.x,0,LZ.z-14);scene.add(P.H.root);
MODELS.dress(P.H,'hero');
const keys={},joy={x:0,y:0,bx:0,by:0};let fireHeld=false,locked=false,T=0;
addEventListener('keydown',e=>{keys[e.code]=true;if(/^(Arrow|Space|Tab)/.test(e.code))e.preventDefault();if(e.repeat)return;
  const c=e.code;
  if(c==='KeyG'||c==='KeyF')throwNade();else if(c==='KeyE')useAction();else if(c==='KeyR')startReload();else if(c==='KeyQ')dropWall();else if(c==='KeyX')launchSentry();
  else if(c==='KeyZ')useZeal();else if(c==='Digit1'||c==='Digit2'||c==='Digit3')switchGun(+c.slice(5)-1);else if(c==='Tab')switchGun((P.gun+1)%GUNS.length);
  dismissHint();});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;fireHeld=false;P.adsHeld=false;});
const cv=renderer.domElement,ptrs=new Map(),joyEl=$('joy'),knob=$('knob');let joyId=null,lookId=null;
cv.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'){if(locked){if(e.button===2)P.adsHeld=true;else{fireHeld=true;P.trigger=true;}}else if(!coarse&&cv.requestPointerLock){try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(_){}}return;}
  try{cv.setPointerCapture(e.pointerId);}catch(_){}dismissHint();
  if(joyId===null&&e.clientX<innerWidth*.45){joyId=e.pointerId;joy.bx=e.clientX;joy.by=e.clientY;joyEl.style.left=e.clientX+'px';joyEl.style.top=e.clientY+'px';knob.style.transform='';joyEl.hidden=false;}
  else if(lookId===null)lookId=e.pointerId;
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(e.pointerId===joyId){let jx=e.clientX-joy.bx,jy=e.clientY-joy.by;const L=Math.hypot(jx,jy),mx=52;if(L>mx){jx*=mx/L;jy*=mx/L;}joy.x=jx/mx;joy.y=-jy/mx;knob.style.transform=`translate(${jx}px,${jy}px)`;}
  else if(e.pointerId===lookId&&P.input){const k=camera.fov/62;P.yaw-=dx*.006*k;P.pitch=clamp(P.pitch-dy*.005*k,-.9,.7);}});
const endPtr=e=>{if(e.pointerId===joyId){joyId=null;joy.x=joy.y=0;joyEl.hidden=true;}if(e.pointerId===lookId)lookId=null;ptrs.delete(e.pointerId);};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
addEventListener('mouseup',e=>{if(e.button===2)P.adsHeld=false;else fireHeld=false;});
cv.addEventListener('wheel',e=>{if(!locked)return;e.preventDefault();switchGun((P.gun+(e.deltaY>0?1:GUNS.length-1))%GUNS.length);},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===cv;cv.style.cursor=locked?'none':'';if(!locked){fireHeld=false;P.adsHeld=false;}});
cv.addEventListener('mousemove',e=>{if(!locked||!P.input)return;const k=camera.fov/62;P.yaw-=(e.movementX||0)*.0023*k;P.pitch=clamp(P.pitch-(e.movementY||0)*.0023*k,-.9,.7);});
function holdBtn(el,on,off){el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{el.setPointerCapture(e.pointerId);}catch(_){}el.classList.add('on');on();});
  const f=()=>{el.classList.remove('on');if(off)off();};el.addEventListener('pointerup',f);el.addEventListener('pointercancel',f);el.addEventListener('lostpointercapture',f);el.addEventListener('contextmenu',e=>e.preventDefault());}
holdBtn($('fire'),()=>{fireHeld=true;P.trigger=true;},()=>{fireHeld=false;});
holdBtn($('nade'),()=>throwNade());holdBtn($('use'),()=>useAction());
holdBtn($('ads'),()=>{P.adsHeld=!P.adsHeld;$('ads').classList.toggle('lit',P.adsHeld);});holdBtn($('rld'),()=>startReload());holdBtn($('wpn'),()=>switchGun((P.gun+1)%GUNS.length));
holdBtn($('shld'),()=>dropWall());holdBtn($('sent'),()=>launchSentry());
// Zeal on a phone: tap the shield gem when it turns gold
SHUD.zealTap(()=>useZeal());
const hint=$('hint');
hint.textContent=coarse?'Left thumb moves (push to the edge to sprint) · right thumb aims · FIRE · AIM zooms · tap the ammo box to reload · tap the shield when it turns gold for Zeal':'Click to lock the mouse · WASD move · left click fires · right click aims · 1 2 3 weapons · R reload · Q shield · X sentry · G grenade · Z Zeal';
let hintGone=false;function dismissHint(){if(hintGone)return;hintGone=true;setTimeout(()=>hint.classList.add('gone'),3500);}
let onUse=null;function useAction(){if(onUse)onUse();}

/* ---------- aiming: a ray from the camera through the crosshair, with this weapon's spread ---------- */
function aimRay(maxD,spread){const o=camera.position.clone(),d=camera.getWorldDirection(new THREE.Vector3());
  if(spread)d.add(_v.set(R(-1,1),R(-1,1),R(-1,1)).multiplyScalar(spread)).normalize();
  let bt=maxD,hit=null;
  for(const E of ENEMIES){if(E.H.dead)continue;const t=rayCapsule(o,d,E.pos,1.95*E.scale*(E.H.crouch?1-E.H.crouch*.35:1),.42);if(t>0&&t<bt){bt=t;hit={E};}}
  for(const D of DROPS){if(D.dead||!D.g.visible)continue;const t=raySphere(o,d,D.g.position,7);if(t>0&&t<bt){bt=t;hit={D};}}
  for(const Tt of TURRETS){if(Tt.dead)continue;const t=raySphere(o,d,Tt.head.getWorldPosition(_w),1.5);if(t>0&&t<bt){bt=t;hit={T:Tt};}}
  for(const ob of OBST){const t=rayCapsule(o,d,_w.set(ob.x,groundY(ob.x,ob.z),ob.z),ob.h,ob.r*.85);if(t>0&&t<bt){bt=t;hit=null;}}
  // terrain: march along the ray
  for(let s=1;s<bt;s+=1.5){_v.copy(o).addScaledVector(d,s);if(_v.y<groundY(_v.x,_v.z)){bt=s;hit=null;break;}}
  return{p:o.addScaledVector(d,bt),hit,dist:bt,dir:d};}
function raySphere(o,d,c,r){_w.subVectors(c,o);const t=_w.dot(d);if(t<0)return-1;const q=_w.lengthSq()-t*t;return q<r*r?t-Math.sqrt(r*r-q):-1;}
function rayCapsule(o,d,base,h,r){   // vertical capsule: closest approach of the ray to the segment base..base+h
  const bx=base.x,by=base.y,bz=base.z;let best=-1;const n=Math.max(4,Math.ceil(h/2.2));for(let k=0;k<=n;k++){const c=_u.set(bx,by+h*k/n,bz),t=raySphere(o,d,c,r);if(t>0&&(best<0||t<best))best=t;}return best;}

/* ---------- your weapons ---------- */
function muzzle(H){H.root.updateMatrixWorld(true);return H.arms[1].el.localToWorld(H.muzzleL?H.muzzleL.clone():new THREE.Vector3(0,-.28,-.95));}   // the barrel's tip, after this frame's pose
const zealK=()=>P.zealT>0?2:1;
function playerShoot(){
  const G=GUNS[P.gun],A0=P.ammo[P.gun];
  if(P.reloadT>0||P.switchT>0)return;
  if(A0.mag<=0){if(A0.res>0)startReload();else if(!playerShoot.click||T-playerShoot.click>.6){playerShoot.click=T;banner(G.short+' · out of ammunition','alert');if(typeof sfx!=='undefined'&&sfx.empty)sfx.empty();}return;}
  A0.mag--;P.cool=G.rof/(P.zealT>0?1.6:1);
  const spread=(G.spread+(G.ads-G.spread)*P.ads)*(P.moving>1?1.6:1)*(P.crouch?.65:1);
  const A=aimRay(G.range,spread),from=muzzle(P.H);
  if(G.rocket){fireRocket(from,A.p);P.H.hitT=.12;return;}
  boom(from,.35,G.kind==='lance'?0xffffff:0x9ff4ff,.06);
  fire(from,A.p,G.kind==='lance'?320:170,G.kind,p=>{boom(p,.6,0xbff4ff,.25);
    if(A.hit&&A.hit.E)hurtEnemy(A.hit.E,G.dmg*zealK(),'gun');else if(A.hit&&A.hit.D)hurtDrop(A.hit.D,G.dmg*zealK(),p);
    else if(A.hit&&A.hit.T)hurtTurret(A.hit.T,G.kind==='lance'?1:.3,p,'gun');else puff(p,.6,.6);});
  if(A0.mag===0&&A0.res>0)setTimeout(()=>{if(P.ammo[P.gun]===A0&&A0.mag===0)startReload();},180);
}
function startReload(){const G=GUNS[P.gun],A=P.ammo[P.gun];if(P.reloadT>0||A.mag>=G.mag||A.res<=0||!P.alive)return;P.reloadT=G.reload*(P.zealT>0?.6:1);P.reloadMax=P.reloadT;if(typeof sfx!=='undefined'&&sfx.reload)sfx.reload();}
function switchGun(i){if(i===P.gun||!P.alive)return;P.gun=i;P.reloadT=0;P.H.reload=0;P.switchT=.35;if(typeof sfx!=='undefined'&&sfx.swap)sfx.swap();}
// the Breaker: a rocket that flies straight with a little drop, trailing smoke
const ROCKETS=[],rocketGeo=new THREE.CylinderGeometry(.06,.09,.6,8).rotateX(Math.PI/2),rocketMat=new THREE.MeshStandardMaterial({color:C(0x4a5a3a),roughness:.5,metalness:.4,emissive:C(0x221100)});
function fireRocket(from,to){const m=new THREE.Mesh(rocketGeo,rocketMat);const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffb050).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));fl.scale.setScalar(1.1);fl.position.z=-.4;m.add(fl);
  m.position.copy(from);scene.add(m);const v=_v.subVectors(to,from).normalize().multiplyScalar(75).clone();m.lookAt(to);
  ROCKETS.push({m,v,t:0,trail:0});boom(from,1.2,0xffc070,.2);puff(from,1.4,1.2);if(typeof sfx!=='undefined')sfx.missile(from);}
function updateRockets(dt){for(let i=ROCKETS.length-1;i>=0;i--){const Rk=ROCKETS[i];Rk.t+=dt;Rk.v.y-=2*dt;const p=Rk.m.position,prev=p.clone();p.addScaledVector(Rk.v,dt);Rk.m.lookAt(_v.copy(p).add(Rk.v));
  Rk.trail-=dt;if(Rk.trail<=0){Rk.trail=.03;puff(p.clone(),R(.5,.9),1.1);}
  let hit=Rk.t>4||p.y<groundY(p.x,p.z)+.1;
  if(!hit)for(const E of ENEMIES)if(!E.H.dead&&Math.hypot(E.pos.x-p.x,E.pos.z-p.z)<.7&&p.y>E.pos.y&&p.y<E.pos.y+2.2){hit=true;break;}
  if(!hit)for(const D of DROPS)if(!D.dead&&D.g.position.distanceTo(p)<6.5){hit=true;break;}
  if(!hit)for(const Tt of TURRETS)if(!Tt.dead&&Tt.head.getWorldPosition(_w).distanceTo(p)<1.8){hit=true;break;}
  if(!hit)for(const o of OBST){if(Math.hypot(o.x-p.x,o.z-p.z)<o.r&&p.y<groundY(o.x,o.z)+o.h){hit=true;break;}}
  if(hit){scene.remove(Rk.m);ROCKETS.splice(i,1);rocketBlast(prev);}}}
function rocketBlast(p){blast(p,6.5,9*zealK(),true,'rocket');for(const Tt of TURRETS)if(!Tt.dead&&Tt.head.getWorldPosition(_w).distanceTo(p)<4.5)hurtTurret(Tt,45,p,'rocket');}
const NADES=[],nadeGeo=new THREE.SphereGeometry(.12,8,6),nadeMat=new THREE.MeshBasicMaterial({color:C(0xffd27a).multiplyScalar(2)});
function throwNade(){if(!P.alive||!P.input||P.nadeCD>0)return;P.nadeCD=5;
  const m=new THREE.Mesh(nadeGeo,nadeMat);scene.add(m);m.position.copy(P.pos).add(_v.set(0,1.7,0));
  const d=camera.getWorldDirection(new THREE.Vector3());d.y+=.35;d.normalize();
  NADES.push({m,v:d.multiplyScalar(19).add(new THREE.Vector3(0,1,0)),t:0});}
function updateNades(dt){for(let i=NADES.length-1;i>=0;i--){const N=NADES[i];N.t+=dt;N.v.y-=16*dt;N.m.position.addScaledVector(N.v,dt);
  const gy=groundY(N.m.position.x,N.m.position.z);if(N.m.position.y<gy+.12){N.m.position.y=gy+.12;N.v.y*=-.3;N.v.x*=.5;N.v.z*=.5;}
  if(N.t>1.7){const p=N.m.position.clone();scene.remove(N.m);NADES.splice(i,1);blast(p,6,5*zealK(),true);for(const Tt of TURRETS)if(!Tt.dead&&Tt.head.getWorldPosition(_w).distanceTo(p)<3.5)hurtTurret(Tt,12,p,'nade');}}}
function blast(p,r,dmg,mine,how){boom(p,8,0xfff0c0,.5);boom(p,13,0xff8a3a,1.1);for(let i=0;i<6;i++)puff(p.clone().add(_v.set(R(-2,2),R(0,2),R(-2,2))),R(2,4),R(2,3));
  if(typeof sfx!=='undefined')sfx.blast(p);
  for(const E of ENEMIES){if(E.H.dead)continue;const d=E.pos.distanceTo(p);if(d<r)hurtEnemy(E,dmg*(1-d/r*.6),mine?(how||'nade'):'');}
  for(const D of DROPS)if(!D.dead&&D.g.position.distanceTo(p)<r+6)hurtDrop(D,dmg*(how==='rocket'?1.8:2),p);
  if(!mine&&P.alive&&P.pos.distanceTo(p)<r)hurtPlayer(25*(1-P.pos.distanceTo(p)/r));}

/* ---------- gear: the mobile shield, the shoulder sentry, Zeal ---------- */
const WALL_CD=22,SENTRY_CD=28,SENTRY_T=16,WALL_T=12;
const hexTex=(()=>{const S=128,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2.2;
  const r=16,h=r*Math.sqrt(3);for(let row=-1;row<6;row++)for(let col=-1;col<6;col++){const cx=col*r*1.5,cy=row*h+(col%2?h/2:0);x.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;x[k?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r);}x.closePath();x.stroke();}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,2);return t;})();
const wallMat=new THREE.MeshBasicMaterial({map:hexTex,color:C(0x7fe3ff).multiplyScalar(1.4),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
function dropWall(){if(!P.alive||!P.input||P.wallCD>0)return;
  if(P.wall){scene.remove(P.wall.g);P.wall=null;}
  const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),g=new THREE.Group();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.2,2.5,24,1,true,-.55,1.1),wallMat);m.position.y=1.25;g.add(m);
  const em=new THREE.Mesh(new THREE.BoxGeometry(.5,.18,.3),new THREE.MeshStandardMaterial({color:C(0x2a3440),metalness:.6,roughness:.4,emissive:C(0x7fe3ff),emissiveIntensity:.6}));em.position.set(0,.09,3.2);g.add(em);
  // the arc's centre sits behind you, so the curve wraps the space in front of you
  const cx=P.pos.x+fx*(2.6-3.2),cz=P.pos.z+fz*(2.6-3.2);g.position.set(cx,groundY(P.pos.x+fx*2.6,P.pos.z+fz*2.6),cz);g.rotation.y=P.yaw+Math.PI;scene.add(g);
  P.wall={g,m,cx:P.pos.x+fx*2.6,cz:P.pos.z+fz*2.6,fx,fz,hp:70,t:WALL_T,flash:0};P.wallCD=WALL_CD;
  if(typeof sfx!=='undefined'&&sfx.shieldUp)sfx.shieldUp();banner('Mobile shield up');}
// does a shot from `a` to `b` cross your shield? Returns the point it stops at, or null
function wallBlocks(a,b){const W=P.wall;if(!W)return null;
  const da=(a.x-W.cx)*W.fx+(a.z-W.cz)*W.fz,db=(b.x-W.cx)*W.fx+(b.z-W.cz)*W.fz;if(!(da>0&&db<0))return null;   // only shots coming in from the front
  const t=da/(da-db),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,z=a.z+(b.z-a.z)*t,lat=Math.abs((x-W.cx)*-W.fz+(z-W.cz)*W.fx),gy=groundY(W.cx,W.cz);
  return lat<3.3&&y>gy-.2&&y<gy+2.6?new THREE.Vector3(x,y,z):null;}
function hitWall(dmg,p){const W=P.wall;if(!W)return;W.hp-=dmg;W.flash=.15;boom(p,.9,0x9ff4ff,.25);if(W.hp<=0)breakWall();}
function breakWall(){const W=P.wall;if(!W)return;boom(W.g.position.clone().setY(W.g.position.y+1.3),3,0x9ff4ff,.5);scene.remove(W.g);P.wall=null;banner('Mobile shield down');}
function updateWall(dt){P.wallCD=Math.max(0,P.wallCD-dt);const W=P.wall;if(!W)return;W.t-=dt;W.flash=Math.max(0,W.flash-dt);
  wallMat.opacity=(.35+.25*Math.sin(T*6))*(W.t<2?W.t/2:1)+W.flash*2;hexTex.offset.y=T*.08;if(W.t<=0)breakWall();}
// the shoulder sentry: a small drone that rides over your right shoulder and shoots whatever it can see
const sentryG=(()=>{const g=new THREE.Group(),body=new THREE.Mesh(new THREE.OctahedronGeometry(.2,0),new THREE.MeshStandardMaterial({color:C(0xe6e8ec),metalness:.6,roughness:.3}));body.scale.set(1.2,.7,1.6);g.add(body);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.3,.03,6,24),new THREE.MeshStandardMaterial({color:C(0xd9b25a),metalness:.8,roughness:.3}));ring.rotation.x=Math.PI/2;g.add(ring);
  const eye=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x7fe3ff).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));eye.scale.setScalar(.5);eye.position.z=-.3;g.add(eye);
  g.visible=false;scene.add(g);return g;})();
function launchSentry(){if(!P.alive||!P.input||P.sentryCD>0)return;P.sentry={t:SENTRY_T,cool:.5,tgt:null,re:0};P.sentryCD=SENTRY_CD;sentryG.visible=true;sentryG.position.copy(P.pos).add(_v.set(0,2.3,0));
  if(typeof sfx!=='undefined'&&sfx.sentry)sfx.sentry();banner('Shoulder sentry online');}
function updateSentry(dt){P.sentryCD=Math.max(0,P.sentryCD-dt);const S=P.sentry;if(!S){sentryG.visible=false;return;}S.t-=dt;
  const rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw),want=_v.set(P.pos.x+rx*.75,P.pos.y+2.25+Math.sin(T*3)*.08,P.pos.z+rz*.75);sentryG.position.lerp(want,1-Math.exp(-dt*8));
  S.re-=dt;if(S.re<=0){S.re=.5;S.tgt=null;let bd=50;for(const E of ENEMIES){if(E.H.dead)continue;const d=E.pos.distanceTo(sentryG.position);if(d<bd&&!blocked(sentryG.position,_w.copy(E.pos).setY(E.pos.y+1.4))){bd=d;S.tgt=E;}}}
  if(S.tgt&&!S.tgt.H.dead){sentryG.lookAt(S.tgt.pos.x,S.tgt.pos.y+1.3,S.tgt.pos.z);S.cool-=dt;
    if(S.cool<=0){S.cool=.3;const from=sentryG.position.clone(),E=S.tgt,d=from.distanceTo(E.pos),hit=rng()<.5*clamp(1.2-d/50,.3,1),to=E.pos.clone().add(_v.set(0,1.3,0));if(!hit)to.add(_v.set(R(-1,1),R(-.5,1),R(-1,1)));
      boom(from,.25,0x9ff4ff,.05);fire(from,to,160,'krifle',q=>{boom(q,.4,0xbfe8ff,.2);if(hit)hurtEnemy(E,1,'sentry');});}}
  else sentryG.rotation.y=P.yaw;
  if(S.t<=0){P.sentry=null;boom(sentryG.position.clone(),.8,0x9ff4ff,.3);sentryG.visible=false;}}
// Zeal: the meter fills as you fight. Burn it for nine seconds of double damage, a faster rifle, and most hits shrugged off
const ZEAL_T=9;
const zealAura=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd27a).multiplyScalar(1.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.5}));zealAura.scale.setScalar(4.2);zealAura.visible=false;scene.add(zealAura);
function gainZeal(n){if(P.zealT>0)return;const was=P.zeal<100;P.zeal=Math.min(100,P.zeal+n);if(was&&P.zeal>=100)banner(coarse?'Zeal ready · tap ZEAL':'Zeal ready · press Z');}
function useZeal(){if(!P.alive||!P.input||P.zeal<100||P.zealT>0)return;P.zealT=ZEAL_T;P.zeal=0;P.shield=100;P.hp=Math.min(100,P.hp+25);zealAura.visible=true;
  banner('ZEAL · the Word burns bright');flashScreen(.25);$('zealV').classList.add('on');if(typeof sfx!=='undefined')sfx.zeal();if(++P.zeals>=3)PG.ach('zealot');}
function updateZeal(dt){if(P.zealT>0){P.zealT-=dt;zealAura.position.copy(P.pos).add(_v.set(0,1.1,0));zealAura.material.opacity=.35+.2*Math.sin(T*8);
    if(P.zealT<=0){zealAura.visible=false;$('zealV').classList.remove('on');}}
  else if(PG.run&&phaseFight())P.zeal=Math.min(100,P.zeal+dt*.5);}

/* ---------- getting hurt, and healing ---------- */
function hurtPlayer(dmg){if(!P.alive||!P.input||(typeof CUTS!=='undefined'&&CUTS.on))return;dmg*=OD.dmg*(P.zealT>0?.3:1);P.lastHit=T;const s=Math.min(P.shield,dmg);P.shield-=s;P.hp-=dmg-s;
  hitHuman(P.H);
  $('hurt').style.opacity=s>=dmg?.25:.75;setTimeout(()=>$('hurt').style.opacity=0,180);if(typeof sfx!=='undefined')sfx.hit(s>=dmg);
  if(P.hp<=0)playerDown();}
function playerDown(){P.alive=false;P.hp=0;P.respawnT=5;killHuman(P.H);fireHeld=false;P.adsHeld=false;PG.say('Keeper Sergeant','Lieutenant down! Medic! Get him up!','alert',4);
  banner('You are down · your squad is pulling you back','alert');}
function playerUp(){P.alive=true;P.hp=100;P.shield=100;reviveHuman(P.H);P.pos.copy(P.spawn);P.pos.y=groundY(P.pos.x,P.pos.z);
  // whatever you lost, you are sent back in with at least a working rifle
  const A=P.ammo[0];A.res=Math.max(A.res,72);if(A.mag<12)A.mag=GUNS[0].mag;}
// pickups: medical packs, ammunition and Breaker rockets. Walk over one to take it (only when you need it)
const PICKS=[];
const pickMats={med:new THREE.MeshStandardMaterial({color:C(0xeef2f0),roughness:.4,metalness:.2,emissive:C(0x1a3a24)}),ammo:new THREE.MeshStandardMaterial({map:panelTex,color:C(0x3a4250),roughness:.45,metalness:.6}),
  rocket:new THREE.MeshStandardMaterial({color:C(0x4a5a3a),roughness:.5,metalness:.4})};
const pickGlow={med:0x6aff9a,ammo:0xffd27a,rocket:0xff8a4a};
function addPick(type,x,z,temp){const g=new THREE.Group(),y=groundY(x,z);
  if(type==='med'){g.add(new THREE.Mesh(new THREE.BoxGeometry(.6,.4,.45),pickMats.med));const cr=new THREE.MeshBasicMaterial({color:C(0x6aff9a).multiplyScalar(2),toneMapped:false});
    const a=new THREE.Mesh(new THREE.BoxGeometry(.32,.09,.02),cr),b=new THREE.Mesh(new THREE.BoxGeometry(.09,.32,.02),cr);a.position.z=b.position.z=.235;g.add(a,b);}
  else if(type==='ammo'){g.add(new THREE.Mesh(new THREE.BoxGeometry(.7,.38,.42),pickMats.ammo));const s=new THREE.Mesh(new THREE.BoxGeometry(.72,.07,.44),new THREE.MeshBasicMaterial({color:C(0xffd27a).multiplyScalar(1.5)}));s.position.y=.12;g.add(s);}
  else{g.add(new THREE.Mesh(new THREE.BoxGeometry(1.1,.3,.34),pickMats.rocket));const s=new THREE.Mesh(new THREE.BoxGeometry(.12,.32,.36),new THREE.MeshBasicMaterial({color:C(0xff8a4a).multiplyScalar(1.6)}));s.position.x=.42;g.add(s);}
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(pickGlow[type]).multiplyScalar(1.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6}));halo.scale.setScalar(1.6);g.add(halo);
  g.position.set(x,y+.35,z);g.children.forEach(o=>o.castShadow=!!o.isMesh);scene.add(g);const K={type,g,x,z,y,t:R(0,6),temp:temp?30:0,halo};PICKS.push(K);return K;}
function updatePicks(dt){for(let i=PICKS.length-1;i>=0;i--){const K=PICKS[i];K.t+=dt;K.g.rotation.y+=dt*1.2;K.g.position.y=K.y+.35+Math.sin(K.t*2.2)*.08;K.halo.material.opacity=.4+.25*Math.sin(K.t*4);
  if(K.temp){K.temp-=dt;if(K.temp<=0){scene.remove(K.g);PICKS.splice(i,1);continue;}if(K.temp<5)K.g.visible=(K.temp*4|0)%2===0;}
  if(!P.alive||Math.hypot(P.pos.x-K.x,P.pos.z-K.z)>1.9)continue;
  let took=false;
  if(K.type==='med'&&P.hp<100){P.hp=Math.min(100,P.hp+45);took='Medical pack · +45 HP';}
  else if(K.type==='ammo'){for(let g=0;g<2;g++){const A=P.ammo[g],cap=GUNS[g].max;if(A.res<cap){A.res=Math.min(cap,A.res+Math.round(cap*.5));took='Ammunition';}}}
  else if(K.type==='rocket'){const A=P.ammo[2];if(A.res+A.mag<GUNS[2].max+1){A.res=Math.min(GUNS[2].max,A.res+2);took='Breaker rockets · +2';}}
  if(took){scene.remove(K.g);PICKS.splice(i,1);banner(took);if(typeof sfx!=='undefined'&&sfx.pickup)sfx.pickup();}}}

/* ---------- the Empty Host: troopers that advance, take cover, and fire purple bursts ---------- */
const ENEMIES=[];
function spawnTrooper(x,z,opts){opts=opts||{};
  if(!opts.gunner&&ENEMIES.filter(E=>!E.H.dead).length>=(coarse?14:22))return null;
  const H=makeHuman('trooper');scene.add(H.root);
  const E={H,pos:H.root.position,scale:1.16,yaw:0,hp:Math.max(2,Math.round(3*OD.ehp)),cool:R(1,2.5),burst:0,bt:0,goal:opts.goal||null,hold:opts.hold||R(14,26),
    target:null,retarget:0,t:0,speed:R(3.2,4.2),gone:0,big:false,side:rng()<.5?-1:1,
    anchor:opts.anchor||null,perch:!!opts.perch,gunner:opts.gunner||null,fixed:!!opts.gunner};   // anchor: holds cover until you close in; perch: a rifleman up on the wall; gunner: crews a turret
  E.pos.set(x,groundY(x,z),z);ENEMIES.push(E);return E;}
function hurtEnemy(E,dmg,how){if(E.H.dead)return;E.hp-=dmg;E.flinch=.15;hitHuman(E.H);
  if(how==='gun'||how==='rocket'){$('cross').classList.add('hit');clearTimeout(hurtEnemy.t);hurtEnemy.t=setTimeout(()=>$('cross').classList.remove('hit'),90);}
  if(E.hp<=0){killHuman(E.H);boom(E.pos.clone().add(_v.set(0,1.2,0)),1.6,HOLLOW_GLOW,.5);if(typeof sfx!=='undefined')sfx.trooperDown(E.pos);
    if(how){P.kills++;gainZeal(how==='sentry'?6:10);PG.kill(how==='nade'?150:how==='rocket'?120:100,E.pos.clone().add(_v.set(0,2,0)),how);PG.prog('okills');if(how==='nade')PG.done('onade');}
    // what they drop: sometimes ammunition, now and then a medical pack
    if(!E.gunner&&phase!=='end'){const r=rng(),k=OD.drops||1;if(r<.16*k)addPick('ammo',E.pos.x,E.pos.z,true);else if(r<.25*k)addPick('med',E.pos.x,E.pos.z,true);}}}
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
    if(E.gunner){   // crewing a turret: stay put behind it, aim with it
      const Tt=E.gunner;E.yaw=Tt.yaw;aim=1;E.H.crouchTo=.15;E.H.aimPitch=0;E.H.root.rotation.y=angLerp(E.H.root.rotation.y,E.yaw,1-Math.exp(-dt*10));poseHuman(E.H,dt,0,1,false);continue;}
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
    // troopers holding cover crouch behind it between bursts
    E.H.crouchTo=E.anchor&&E.burst===0&&speed<.5?.75:0;
    if(!E.perch)E.H.aimPitch=tg?clamp(Math.atan2(tg.pos.y-E.pos.y,Math.hypot(tg.pos.x-E.pos.x,tg.pos.z-E.pos.z)),-.6,.6):0;else E.H.aimPitch=tg?clamp(Math.atan2(tg.pos.y-E.pos.y,Math.hypot(tg.pos.x-E.pos.x,tg.pos.z-E.pos.z)),-.9,.3):0;
    if(!E.perch)E.pos.y=groundY(E.pos.x,E.pos.z);E.H.root.rotation.y=angLerp(E.H.root.rotation.y,E.yaw,1-Math.exp(-dt*10));poseHuman(E.H,dt,speed,aim,speed>3.5);
  }}
function trooperShot(E,tg,d){const from=muzzle(E.H),to=_w.copy(tg.pos).add(_v.set(0,tg.player&&P.crouch?.95:1.3,0));
  let k=tg.player&&P.run?.6:1;if(tg.player&&P.crouch)k*=inCover(P.pos,E.pos)?.45:.75;
  const p=Math.min(.75,.34*(OD.acc||1)*clamp(1-d/70,.2,1)*k);const hit=rng()<p;
  if(!hit)to.add(_v.set(R(-1.6,1.6),R(-.6,1.2),R(-1.6,1.6)));
  boom(from,.4,HOLLOW_GLOW,.08);const tgt=tg,stop=wallBlocks(from,to);
  fire(from,(stop||to).clone(),110,'hrifle',q=>{if(stop){hitWall(8,q);return;}boom(q,.7,0xd8a0ff,.25);if(hit){if(tgt.player)hurtPlayer(8);else if(tgt.A){tgt.A.hits++;hitHuman(tgt.A.H);}}else puff(q,.5,.5);});}

/* ---------- Hollow turrets: heavy guns in the canyon, crewed by a trooper. Rifles barely mark the armour:
   bring the Breaker, or drop the gunner and the gun goes quiet ---------- */
const TURRETS=[],turHull=new THREE.MeshStandardMaterial({map:panelTex,color:C(0x2a2432),roughness:.4,metalness:.7}),turSilver=new THREE.MeshStandardMaterial({color:C(0x9ea2ae),roughness:.3,metalness:.85}),
  turGlow=new THREE.MeshBasicMaterial({color:C(FLEET_PURPLE).multiplyScalar(2.2),toneMapped:false});
function addTurret(x,z,y,face,name){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.4,1.1,6),turHull);base.position.y=.55;base.castShadow=true;g.add(base);
  const head=new THREE.Group();head.position.y=1.5;g.add(head);
  const hb=new THREE.Mesh(new THREE.BoxGeometry(1.5,.8,1.6),turHull);hb.castShadow=true;head.add(hb);
  const plate=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.3,.18),turSilver);plate.position.set(0,.1,-.95);plate.rotation.x=-.18;head.add(plate);
  for(const s of[-1,1]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,2.2,8),turSilver);b.rotation.x=Math.PI/2;b.position.set(s*.38,.05,-1.9);head.add(b);
    const tip=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.5),turGlow);tip.position.set(s*.38,.2,-1.6);head.add(tip);}
  for(let k=0;k<3;k++){const sp=new THREE.Mesh(new THREE.ConeGeometry(.08,.7,4),turSilver);sp.position.set(-.6+k*.6,.75,.3);sp.rotation.x=-.5;head.add(sp);}
  const seam=new THREE.Mesh(new THREE.BoxGeometry(1.52,.06,1.62),turGlow);seam.position.y=-.2;head.add(seam);
  const Tt={g,head,x,z,y,yaw:face,hp:Math.round(40*OD.ehp),max:Math.round(40*OD.ehp),dead:false,cool:R(1,2),burst:0,bt:0,name,smoke:0,warned:false};
  head.rotation.y=face;
  // the gunner stands behind the gun
  const bx=x+Math.sin(face)*1.9,bz=z+Math.cos(face)*1.9,E=spawnTrooper(bx,bz,{gunner:Tt,perch:true});if(E){E.pos.y=y;E.yaw=face;}Tt.gunner=E;
  OBST.push({x,z,r:1.2,h:2.2});TURRETS.push(Tt);return Tt;}
function hurtTurret(Tt,dmg,p,how){if(Tt.dead)return;Tt.hp-=dmg;boom(p,.9,how==='gun'?0xfff0d0:0xffc070,.2);
  if(how==='gun'){$('cross').classList.add('hit');clearTimeout(hurtEnemy.t);hurtEnemy.t=setTimeout(()=>$('cross').classList.remove('hit'),90);
    if(!Tt.warned&&dmg<1){Tt.warned=true;say('turret','Keeper Sergeant','Hollow turret ahead! Rifles won’t crack that plating. Breaker, or take the gunner!','alert');}}
  if(Tt.hp<=0){Tt.dead=true;const c=Tt.head.getWorldPosition(new THREE.Vector3());boom(c,6,0xfff0c0,.5);boom(c,10,0xff8a3a,1.2);boom(c,7,HOLLOW_GLOW,.9);
    if(typeof sfx!=='undefined')sfx.blast(c);Tt.head.rotation.x=.5;Tt.head.position.y=1.1;Tt.head.children.forEach(o=>{if(o.material===turGlow)o.visible=false;});
    if(Tt.gunner&&!Tt.gunner.H.dead)hurtEnemy(Tt.gunner,99,'');P.kills++;gainZeal(20);PG.kill(400,c,how);PG.prog('oturret');}}
function updateTurrets(dt){for(const Tt of TURRETS){
  if(Tt.dead){Tt.smoke-=dt;if(Tt.smoke<=0){Tt.smoke=.25;puff(Tt.head.getWorldPosition(_w).clone().add(_v.set(R(-.4,.4),.6,R(-.4,.4))),R(1,2),2.2);}continue;}
  const G=Tt.gunner,manned=G&&!G.H.dead;if(!manned)continue;
  // aim at you (or the nearest squadmate) when they are within reach and in sight
  const hp=Tt.head.getWorldPosition(_w).clone();let tg=null,bd=88;
  if(P.alive&&P.input){const d=hp.distanceTo(P.pos);if(d<bd&&!blocked(hp,_v.copy(P.pos).setY(P.pos.y+1.3))){bd=d*.8;tg={pos:P.pos,player:true};}}
  for(const A of ALLIES){if(!A.on||A.H.dead)continue;const d=hp.distanceTo(A.pos);if(d<bd&&!blocked(hp,_v.copy(A.pos).setY(A.pos.y+1.3))){bd=d;tg={pos:A.pos,A};}}
  if(!tg){Tt.head.rotation.y=angLerp(Tt.head.rotation.y,Tt.yaw+Math.sin(T*.4+Tt.x)*.5,1-Math.exp(-dt*1.5));continue;}
  const want=Math.atan2(-(tg.pos.x-Tt.x),-(tg.pos.z-Tt.z));Tt.head.rotation.y=angLerp(Tt.head.rotation.y,want,1-Math.exp(-dt*2.5));Tt.yaw=Tt.head.rotation.y;
  Tt.head.rotation.x=clamp(Math.atan2(tg.pos.y+1.2-hp.y,Math.hypot(tg.pos.x-hp.x,tg.pos.z-hp.z))*.7,-.5,.4);
  Tt.cool-=dt;if(Tt.cool<=0&&Math.abs(angLerp(Tt.head.rotation.y,want,1)-Tt.head.rotation.y)<.08){Tt.cool=R(1.6,2.4)/OD.rof;Tt.burst=2;Tt.bt=0;}
  if(Tt.burst>0){Tt.bt-=dt;if(Tt.bt<=0){Tt.bt=.28;Tt.burst--;
    const from=Tt.head.localToWorld(new THREE.Vector3(Tt.burst%2?.38:-.38,.05,-3)),to=tg.pos.clone().add(_v.set(0,1.2,0)),d=from.distanceTo(to);
    let k=tg.player&&P.crouch&&inCover(P.pos,from)?.4:1;const hit=rng()<Math.min(.8,.5*(OD.acc||1)*clamp(1.2-d/90,.3,1)*k);if(!hit)to.add(_v.set(R(-2,2),R(-.4,1.6),R(-2,2)));
    boom(from,1.1,HOLLOW_GLOW,.12);const stop=wallBlocks(from,to),tgt=tg;
    fire(from,(stop||to).clone(),130,'heavy',q=>{if(stop){hitWall(18,q);return;}boom(q,1.6,0xd8a0ff,.35);puff(q,1,1);if(hit){if(tgt.player)hurtPlayer(16);else if(tgt.A){tgt.A.hits+=2;hitHuman(tgt.A.H);}}});}}}}

/* ---------- Empty Host dropships: fly in, set down, unload troopers, lift away ---------- */
const DROPS=[],DSG2=hostDropshipGeo(),dropMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.6}),dropGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)});
function launchDrop(land,n,delay){const g=new THREE.Group();g.add(new THREE.Mesh(DSG2.geo,dropMat),new THREE.Mesh(DSG2.glow,dropGlow));g.scale.setScalar(.38);g.children[0].castShadow=true;
  const from=new THREE.Vector3(land.x+R(-60,60),90,land.z-260);g.position.copy(from);g.visible=!delay;scene.add(g);
  const D={g,from,land:land.clone().setY(groundY(land.x,land.z)+3),t:-(delay||0),state:'in',hp:Math.round(28*OD.ehp),dead:false,unloaded:false,n:n||4,gone:false};DROPS.push(D);if(typeof sfx!=='undefined'&&!delay)sfx.horn(D.land);return D;}
function hurtDrop(D,dmg,p){if(D.dead)return;D.hp-=dmg;boom(p,1.2,0xfff1c8,.25);if(D.hp<=0){D.dead=true;D.t=0;boom(D.g.position,14,0xfff0c0,.6);boom(D.g.position,20,0xff6a1a,1.4);
  if(typeof sfx!=='undefined')sfx.blast(D.g.position);gainZeal(25);PG.kill(600,D.g.position,'gun');PG.prog('odrops');}}
function updateDrops(dt){for(let i=DROPS.length-1;i>=0;i--){const D=DROPS[i];D.t+=dt;const g=D.g;
  if(D.t<0)continue;if(!g.visible){g.visible=true;if(typeof sfx!=='undefined')sfx.horn(D.land);}
  if(D.dead){g.position.y-=dt*14;g.rotation.z+=dt*.8;if(rng()<dt*14)boom(g.position.clone().add(_v.set(R(-4,4),0,R(-4,4))),R(3,6),0xff7a1a,.7);
    if(g.position.y<groundY(g.position.x,g.position.z)+1){blast(g.position.clone(),10,6,true);scene.remove(g);DROPS.splice(i,1);}continue;}
  if(D.state==='in'){const u=Math.min(1,D.t/7),e=1-(1-u)*(1-u);g.position.lerpVectors(D.from,D.land,e);g.lookAt(D.land.x,g.position.y,D.land.z+(D.land.z>D.from.z?40:-40));
    if(u>=1){D.state='down';D.t=0;}}
  else if(D.state==='down'){if(!D.unloaded&&D.t>1){D.unloaded=true;for(let k=0;k<D.n;k++){const a=k/D.n*Math.PI*2;spawnTrooper(D.land.x+Math.cos(a)*5,D.land.z+Math.sin(a)*5,{hold:R(10,18)});}}
    if(D.t>4){D.state='out';D.t=0;}}
  else{g.position.y+=dt*(8+D.t*6);g.position.z-=dt*D.t*10;if(D.t>9){scene.remove(g);DROPS.splice(i,1);}}}}

/* ---------- the Keeper squad: marines and robots; engineers and colonists at the ships ---------- */
const ALLIES=[];
const ALLY_TINT={marine:0xc6ccd8};
function addAlly(style,x,z,name,kind){const H=makeHuman(style);scene.add(H.root);const A={H,pos:H.root.position,style,name,yaw:0,goal:null,on:true,cool:R(.5,1.5),burst:0,bt:0,hits:0,
  armed:style==='marine',work:false,target:null,retarget:0,side:ALLIES.length%2?1:-1};A.pos.set(x,groundY(x,z),z);ALLIES.push(A);
  // colonists and civilians keep their code-built look for now
  const k=kind||(style==='engineer'?'engineer':style==='marine'?'marine':null);
  if(k)MODELS.dress(H,k,{tint:ALLY_TINT[k],unarmed:!A.armed&&k!=='engineer'});return A;}
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
    // squadmates crouch when they stop with an enemy in sight
    A.H.crouchTo=A.armed&&aim&&speed<.5&&A.burst===0?.6:0;
    A.pos.y=groundY(A.pos.x,A.pos.z);A.H.root.rotation.y=angLerp(A.H.root.rotation.y,A.yaw,1-Math.exp(-dt*8));poseHuman(A.H,dt,speed,A.work?0:aim,speed>4);
    if(A.work){A.H.arms[0].sh.rotation.x=-.9+Math.sin(T*6)*.25;A.H.arms[1].sh.rotation.x=-.7+Math.cos(T*5)*.2;A.H.torso.rotation.x=.25;}
  }}
function angLerp(a,b,k){let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*k;}

/* ---------- your movement and the over-the-shoulder camera (closer while aiming; through the scope with the Lance) ---------- */
const CAM={dist:4.3,side:1.15,up:.45};
function stepPlayer(dt){
  const H=P.H;
  if(!P.alive){P.respawnT-=dt;poseHuman(H,dt,0,0);if(P.respawnT<=0)playerUp();return;}
  let f=0,s=0;
  if(P.input){if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD||keys.ArrowRight)s+=1;if(keys.KeyA||keys.ArrowLeft)s-=1;f+=joy.y;s+=joy.x;}
  const L=Math.hypot(f,s);if(L>1){f/=L;s/=L;}
  const crouched=false;   // crouch and jump are switched off for now (the code is kept for later)
  P.run=P.input&&!crouched&&P.ads<.3&&(keys.ShiftLeft||keys.ShiftRight||Math.hypot(joy.x,joy.y)>.95)&&f>.3;
  if(P.run)P.crouch=false;
  const sp=P.run?7.2:crouched?2.3:P.ads>.5?2.9:fireHeld?3.4:4.6,fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
  moveBody(P.pos,(fx*f+rx*s)*sp*dt,(fz*f+rz*s)*sp*dt,.45);
  const gy=groundY(P.pos.x,P.pos.z);
  P.vy-=16*dt;P.pos.y+=P.vy*dt;if(P.pos.y<gy){P.pos.y=gy;P.vy=0;}
  P.moving=L*sp;
  // aiming down the sights eases in and out
  const G=GUNS[P.gun];P.ads+=((P.adsHeld&&P.input&&P.alive?1:0)-P.ads)*(1-Math.exp(-dt*12));
  H.crouchTo=crouched?1:0;H.reload=P.reloadT>0?1-P.reloadT/P.reloadMax:0;
  H.root.rotation.y=P.yaw;H.aimPitch=P.pitch;poseHuman(H,dt,P.moving,P.run?.25:1,P.run);
  // shields come back after three quiet seconds; health after six, more slowly
  if(T-P.lastHit>3)P.shield=Math.min(100,P.shield+dt*25);
  if(T-P.lastHit>6&&P.hp<100)P.hp=Math.min(100,P.hp+dt*(OD.regen||3));
  if(P.zealT>0)P.hp=Math.min(100,P.hp+dt*4);
  P.cool-=dt;P.nadeCD=Math.max(0,P.nadeCD-dt);P.switchT=Math.max(0,P.switchT-dt);
  if(P.reloadT>0){P.reloadT-=dt;if(P.reloadT<=0){const A=P.ammo[P.gun],take=Math.min(G.mag-A.mag,A.res);A.mag+=take;A.res-=take;P.reloadT=0;}}
  if(fireHeld&&P.cool<=0&&P.input&&(G.auto||P.trigger)){P.trigger=false;playerShoot();}
  if(!fireHeld)P.trigger=false;
}
function placeCamera(){
  const G=GUNS[P.gun],a=P.ads,scoped=G.scope&&a>.85&&P.alive;
  camera.fov=62/(1+(G.zoom-1)*a);camera.updateProjectionMatrix();
  const cp=Math.cos(P.pitch),sp=Math.sin(P.pitch),fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
  const crH=P.H.crouch||0,head=_v.copy(P.pos).add(_w.set(0,1.62-crH*.62,0));
  if(scoped){camera.position.set(head.x+fx*.3,head.y+.12,head.z+fz*.3);}
  else{const dist=CAM.dist*(1-a*.48),side=CAM.side*(1-a*.25);
    camera.position.set(head.x-fx*dist*cp+rx*side,head.y+CAM.up-sp*dist,head.z-fz*dist*cp+rz*side);}
  // below the Hollow: pull the camera in toward Michael until it is inside the tunnel, and under its roof
  if(P.pos.x<-1600){const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;let k=1;
    while(k>.15&&belowD(head.x+(cx-head.x)*k,head.z+(cz-head.z)*k)>-1.1)k-=.08;camera.position.set(head.x+(cx-head.x)*k,head.y+(cy-head.y)*k,head.z+(cz-head.z)*k);
    camera.position.y=Math.min(camera.position.y,belowFloor(camera.position.x,camera.position.z)+7.5);}
  const g=groundY(camera.position.x,camera.position.z)+.4;if(camera.position.y<g)camera.position.y=g;
  // keep the camera out of the rocks
  for(const o of OBST){if(o.h<2)continue;const dx=camera.position.x-o.x,dz=camera.position.z-o.z,d=Math.hypot(dx,dz),m=o.r+.25;if(d<m&&d>1e-3&&camera.position.y<groundY(o.x,o.z)+o.h){camera.position.x=o.x+dx/d*m;camera.position.z=o.z+dz/d*m;}}
  camera.rotation.set(P.pitch,P.yaw,0);
  P.H.root.visible=!scoped;$('scope').classList.toggle('on',!!scoped);}

/* ---------- HUD: the strip at the top (HP, shield, Zeal), the weapon panel, gear cooldowns, the crosshair ---------- */
SHUD.update({zeal:0,sub:false,hullLabel:'HP'});
let bannerT=0;function banner(t,cls){const b=$('banner');b.textContent=t;b.className='hud banner'+(cls?' '+cls:'');bannerT=4;}
function cdStyle(el,left,total){el.style.setProperty('--cd',(total?clamp(left/total,0,1):0)*100+'%');el.classList.toggle('cool',left>0);}
let hudT=0;
function updateHud(dt){bannerT-=dt;if(bannerT<=0)$('banner').classList.add('quiet');
  const arm=P.alive&&P.input;
  hudT+=dt;if(hudT>.08){hudT=0;
    SHUD.update({shield:P.shield,hull:P.hp,down:!P.alive,zeal:P.zealT>0?P.zealT/ZEAL_T*100:P.zeal,zealText:P.zealT>0?'burning':P.zeal>=100?(coarse?'ready':'ready · Z'):'charging',zealReady:P.zeal>=100&&P.zealT<=0});
    const G=GUNS[P.gun],A=P.ammo[P.gun];
    $('wName').textContent=G.name.toUpperCase();$('wMag').textContent=P.reloadT>0?'··':A.mag;$('wRes').textContent=A.res;
    $('wMag').classList.toggle('low',A.mag<=Math.ceil(G.mag*.2));$('wpanel').classList.toggle('reloading',P.reloadT>0);
    document.querySelectorAll('#wslots i').forEach((el,i)=>{el.classList.toggle('on',i===P.gun);el.classList.toggle('empty',P.ammo[i].mag+P.ammo[i].res<=0);});
    cdStyle($('gShield'),P.wallCD,WALL_CD);cdStyle($('gSentry'),P.sentryCD,SENTRY_CD);cdStyle($('gNade'),P.nadeCD,5);
    $('gZeal').classList.toggle('ready',P.zeal>=100&&P.zealT<=0);$('gZeal').style.setProperty('--cd',(100-(P.zealT>0?P.zealT/ZEAL_T*100:P.zeal))+'%');
    if(coarse){cdStyle($('shld'),P.wallCD,WALL_CD);cdStyle($('sent'),P.sentryCD,SENTRY_CD);cdStyle($('nade'),P.nadeCD,5);
      $('rldN').textContent=P.reloadT>0?'··':A.mag;$('rld').classList.toggle('low',A.mag<=Math.ceil(G.mag*.2)&&P.reloadT<=0);$('rld').classList.toggle('lit',P.reloadT>0);}}
  for(const id of['fire','nade','ads','rld','wpn','shld','sent'])$(id).hidden=!coarse||!arm;
  $('cross').hidden=!arm||($('scope').classList.contains('on'));$('cross').classList.toggle('ads',P.ads>.5);
  $('gear').hidden=!arm;
  $('use').hidden=!coarse||!onUse||!arm;}
function updateDust(){const a=dustG.attributes.position.array;for(let i=0;i<DUST_N;i++){let x=a[i*3],z=a[i*3+2];
  if(x-camera.position.x>80)x-=160;if(camera.position.x-x>80)x+=160;if(z-camera.position.z>80)z-=160;if(camera.position.z-z>80)z+=160;a[i*3]=x+.02;a[i*3+2]=z;}dustG.attributes.position.needsUpdate=true;}
