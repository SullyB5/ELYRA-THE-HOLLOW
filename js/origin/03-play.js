/* Elyra · Archive 01 · The Mountain — play: Lt. Michael Hall on foot (first person), the Keeper squad, the Empty Host,
   Hollow turrets, Empty Host dropships, and the fight.
   PC: WASD move, mouse aims (click to lock), left click fires, right click aims down the sights (the Lance has a scope),
       1 2 3 4 or the wheel switch weapons, R reloads, Q drops the mobile shield, X launches the shoulder sentry,
       G or F throws a grenade, Z burns Zeal, Shift sprints, E boards. (Jump and crouch are switched off for now.)
   Phone: left thumb moves (push to the edge to sprint), right thumb aims, and the buttons on the right. */
window.AUDIO_SCALE=25;   // sounds placed in metres
const OD=DIFF.origin||DIFF.tide;   // ground-fight numbers (DIFFS in js/shared/progress.js)
// small-arms bolts, sized in metres
BK.rifle={len:2.4,w:.06,head:.8,col:0x9ff4ff,bc:0x6fe0ff};BK.krifle={len:2.2,w:.06,head:.7,col:0xbfe8ff,bc:0x7fd0ff};BK.hrifle={len:2.4,w:.07,head:.9,col:0xd8a0ff,bc:0xa45cff};
BK.rrifle={len:2.4,w:.07,head:.9,col:0xff9a7a,bc:0xff4a2a};BK.arifle={len:2.4,w:.07,head:.9,col:0xffd08a,bc:0xffa030};
BK.lance={len:5,w:.05,head:1.4,col:0xffffff,bc:0x9fe0ff};BK.heavy={len:3.4,w:.14,head:1.4,col:0xe6b8ff,bc:0xb060ff};
for(const k of['rifle','krifle','hrifle','rrifle','arifle','lance','heavy'])boltMats[k]=new THREE.MeshBasicMaterial({color:C(BK[k].bc).multiplyScalar(3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const _v=new THREE.Vector3(),_w=new THREE.Vector3(),_u=new THREE.Vector3(),_n=new THREE.Vector3();

/* ---------- navigation through the two canyons: stay in your own canyon, cross the ridge only through a pass or where they meet ---------- */
const CROSS=[SPINE_S0+8,...GAPS.map(g=>g.s),SPINE_S1-8];
function inSpineZone(s){return laneC(s)>laneHalf(s)*.85;}
// a point in a canyon: side -1 west, +1 east; lat is the old lane offset (LANE = the canyon's middle, more or less moves across it)
function lanePoint(s,side,lat,out){const c=roadPt(s,out),n=roadN(s),L=laneHalf(s)-1.5,l=inSpineZone(s)?side*(laneC(s)+clamp(Math.abs(lat==null?LANE:lat)-LANE,-L,L)):(lat||0)*.7;c.x+=n.x*l;c.z+=n.z*l;return c;}
function navToward(px,pz,tx,tz,out){
  if(px<-1600){const a=belowS(px,pz),b=belowS(tx,tz);if(Math.abs(a-b)<14||(a>BLEN&&b>BLEN))return out.set(tx-px,0,tz-pz);const p=belowPt(a+Math.sign(b-a)*10,_u);return out.set(p.x-px,0,p.z-pz);}
  const a=roadS(px,pz),b=roadS(tx,tz);
  // a map with a long approach before its road (Site K, Oct 25): follow the approach's curve instead of cutting across its banks
  if(a<0&&b<0&&typeof apPt==='function'&&Math.abs(a-b)>22){const q=apPt(a+Math.sign(b-a)*16,_u);return out.set(q.x-px,0,q.z-pz);}
  if((a<0&&b<0)||(a>ROAD_LEN&&b>ROAD_LEN))return out.set(tx-px,0,tz-pz);
  const la=latOf(px,pz),lb=latOf(tx,tz),sa=la<0?-1:1,sb=lb<0?-1:1;
  // on opposite sides of the spine: go to the best crossing first
  const need=sa!==sb&&(inSpineZone(a)||inSpineZone(b))&&!(a<SPINE_S0-4&&b<SPINE_S0-4)&&!(a>SPINE_S1+4&&b>SPINE_S1+4);
  if(need){let g=CROSS[0],gd=1e9;for(const c of CROSS){const d=Math.abs(a-c)+Math.abs(c-b);if(d<gd){gd=d;g=c;}}
    if(Math.abs(a-g)<3.2){const p=lanePoint(g,sb,LANE,_u);return out.set(p.x-px,0,p.z-pz);}
    const p=lanePoint(a+Math.sign(g-a)*Math.min(14,Math.abs(g-a)),sa,LANE,_u);return out.set(p.x-px,0,p.z-pz);}
  if(Math.abs(a-b)<22)return out.set(tx-px,0,tz-pz);
  const p=lanePoint(a+Math.sign(b-a)*16,sa,inSpineZone(a)?LANE:la,_u);return out.set(p.x-px,0,p.z-pz);}
/* Oct 25: buildings. OBST holds circles (rocks, pods, cover); a map can also put boxes in RECTS for whole buildings
   ({x,z,hw,hd,ry,y0,h}: centre, half width/depth, turned by ry like a mesh's rotation.y, base and height). They are solid to walking,
   to line of sight, to your shots and rockets, and the over-the-shoulder camera. */
window.RECTS=window.RECTS||[];
function rectL(R,x,z,o){const c=Math.cos(R.ry||0),s=Math.sin(R.ry||0),dx=x-R.x,dz=z-R.z;o.x=dx*c-dz*s;o.z=dx*s+dz*c;return o;}
const _rl={x:0,z:0},_rl2={x:0,z:0};
function pushOutRects(p,rad){for(const R of RECTS){rectL(R,p.x,p.z,_rl);const px=R.hw+rad-Math.abs(_rl.x),pz=R.hd+rad-Math.abs(_rl.z);if(px<=0||pz<=0)continue;
  if(px<pz)_rl.x+=Math.sign(_rl.x||1)*px;else _rl.z+=Math.sign(_rl.z||1)*pz;const c=Math.cos(R.ry||0),s=Math.sin(R.ry||0);p.x=R.x+_rl.x*c+_rl.z*s;p.z=R.z-_rl.x*s+_rl.z*c;}}
// where a straight line a→b first enters a box (as a fraction 0..1 of the way), or -1. Heights count: over the roof is clear.
function rectHit(R,a,b){rectL(R,a.x,a.z,_rl);rectL(R,b.x,b.z,_rl2);const dx=_rl2.x-_rl.x,dz=_rl2.z-_rl.z;let t0=0,t1=1;
  for(const [p,d,h] of[[_rl.x,dx,R.hw],[_rl.z,dz,R.hd]]){if(Math.abs(d)<1e-9){if(Math.abs(p)>h)return-1;continue;}let u=(-h-p)/d,v=(h-p)/d;if(u>v){const w=u;u=v;v=w;}t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return-1;}
  const ya=a.y+(b.y-a.y)*t0,yb=a.y+(b.y-a.y)*t1,top=(R.y0||0)+R.h,bot=R.y0||0;if(Math.min(ya,yb)>top||Math.max(ya,yb)<bot)return-1;return t0;}
function onRoof(R,p){rectL(R,p.x,p.z,_rl);return Math.abs(_rl.x)<R.hw+.3&&Math.abs(_rl.z)<R.hd+.3&&p.y>(R.y0||0)+R.h-.4;}
// move a body by (dx,dz), sliding along the canyon walls and around obstacles
// (moveBody.tall, Oct 25: set while a walker moves: it steps over low walls and rubble, anything under 1.7 m)
// (moveBody.drive, Oct 25: set while the rover moves: it rolls over small rocks, obstacles marked .low)
function moveBody(pos,dx,dz,rad){
  let nx=pos.x+dx,nz=pos.z+dz;
  for(const o of OBST){if(o.ghost||(moveBody.tall&&o.h!=null&&o.h<1.7)||(moveBody.drive&&o.low))continue;const ox=nx-o.x,oz=nz-o.z,d=Math.hypot(ox,oz),m=o.r+rad;if(d<m&&d>1e-4){nx=o.x+ox/d*m;nz=o.z+oz/d*m;}}
  if(RECTS.length){_w.set(nx,0,nz);pushOutRects(_w,rad);nx=_w.x;nz=_w.z;}
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
/* is the straight line between two points blocked? Cover taller than the line blocks it, and so does the ground (every map's walls are
   ground: outside the walkable area groundY() answers the wall or cliff top).
   Oct 25 (Bryce: enemies and squadmates shot through walls): the ground used to be tested at only eight points along the line, so a
   one-metre wall between two of them didn't count. Now every ~0.7 m. Cover now has a height too (a shot clears a low wall's top), and an
   obstacle round either end (a turret's own body, a vehicle you are in) doesn't block its own shots. */
function blocked(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,L2=dx*dx+dz*dz||1;
  for(const o of OBST){if(o.h<1||o.ghost)continue;const ex=o.r+.3;if((a.x-o.x)**2+(a.z-o.z)**2<ex*ex||(b.x-o.x)**2+(b.z-o.z)**2<ex*ex)continue;
    const t=clamp(((o.x-a.x)*dx+(o.z-a.z)*dz)/L2,0,1),px=a.x+dx*t-o.x,pz=a.z+dz*t-o.z;if(px*px+pz*pz<o.r*o.r*.8){const top=(o.y0!=null?o.y0:groundY(o.x,o.z))+o.h;if(a.y+dy*t<top+.05)return true;}}
  for(const R of RECTS){if(onRoof(R,a)||onRoof(R,b))continue;if(rectHit(R,a,b)>=0)return true;}   // (a rifleman or gun up on a roof sees off its edge)
  if(typeof losBlock==='function'&&losBlock(a,b))return true;   // a map's own solids that aren't ground (js/pathfinder3/01-world.js)
  const L=Math.sqrt(L2),n=Math.min(220,Math.ceil(L/.7));for(let k=1;k<n;k++){const t=k/n;if(shotG(a.x+dx*t,a.z+dz*t)>a.y+dy*t-.15)return true;}
  return false;}
// line of sight, remembered for a moment per shooter (the dense test above is too dear to run for every trooper every frame)
function canSee(W,from,to,key,dt){W._seeT=(W._seeT||0)-dt;if(W._seeT<=0||W._seeK!==key){W._seeT=R(.16,.28);W._seeK=key;W._see=!blocked(from,to);}return W._see;}
// is something solid within a step of you, toward a threat? (crouching behind it counts as cover)
function inCover(pos,from){_n.set(from.x-pos.x,0,from.z-pos.z).normalize();for(const o of OBST){if(o.h<1)continue;const rx=o.x-pos.x,rz=o.z-pos.z,d=Math.hypot(rx,rz);if(d>o.r+2.2)continue;if((rx*_n.x+rz*_n.z)/Math.max(d,.01)>.35)return true;}return false;}

/* ---------- you: Lt. Michael Hall ---------- */
/* Oct 25, the damage system (js/shared/damage.js, docs/COMBAT-SPEC.md): each slot is a spec weapon (spec: its damage by hit zone,
   cadence, magazine and reload). Hitscan, no spread, no range limit, no falloff. Reserves and pickups are as before. */
const gunOf=(o,spec)=>{const S=DMG.GUN[spec];return Object.assign(o,{spec,rof:1/S.rps,mag:S.mag,reload:S.reload,spread:0,ads:0,range:900});};
const GUNS=[
  gunOf({id:'rifle',name:'Pulse rifle',short:'RIFLE',auto:true,res:216,max:360,zoom:1.45,kind:'rifle'},'ar'),
  gunOf({id:'lance',name:'Lance marksman',short:'LANCE',auto:false,res:40,max:64,zoom:3.6,scope:true,kind:'lance'},'sniper'),
  gunOf({id:'breaker',name:'Breaker launcher',short:'BREAKER',auto:false,res:4,max:8,zoom:1.3,rocket:true},'breaker'),
  // the sidearm (Oct 24): never runs dry (inf: reloads don't use up reserves). Its look is the skin picked in the Armory on the menu
  gunOf({id:'side',name:'Sidearm',short:'SIDEARM',auto:false,res:999,max:999,zoom:1.3,kind:'rifle',inf:true},'pistol'),
];
const AMMO_K=OD.ammo||1;
const P={yaw:0,pitch:-.05,vy:0,hp:100,shield:25,maxHp:100,maxShield:25,regen:DMG.REGEN.player,alive:true,respawnT:0,lastHit:-99,cool:0,nadeCD:0,H:makeHuman('marine'),moving:0,
  run:false,input:true,spawn:new THREE.Vector3(LZ.x,0,LZ.z-14),kills:0,
  gun:0,ammo:GUNS.map(g=>({mag:g.mag,res:Math.round(g.res*AMMO_K)})),reloadT:0,switchT:0,adsHeld:false,ads:0,trigger:false,crouch:false,crouchHold:false,
  zeal:0,zealT:0,zeals:0,wallCD:0,sentryCD:0,wall:null,sentry:null};
P.pos=P.H.root.position;P.pos.set(LZ.x,0,LZ.z-14);scene.add(P.H.root);
MODELS.dress(P.H,window.PLAYER_KIND||'michael-hall',window.PLAYER_OPTS);   // the Pathfinder mission plays Captain Rhen instead (js/pathfinder/01-world.js)
const keys={},joy={x:0,y:0,bx:0,by:0};let fireHeld=false,locked=false,T=0;
addEventListener('keydown',e=>{keys[e.code]=true;if(/^(Arrow|Space|Tab)/.test(e.code))e.preventDefault();if(e.repeat)return;
  const c=e.code;
  if(c==='KeyG'||c==='KeyF')throwNade();else if(c==='KeyE')useAction();else if(c==='KeyR')startReload();else if(c==='KeyQ')dropWall();else if(c==='KeyX')launchSentry();
  else if(c==='Space')jump();else if(c==='KeyC'||c==='ControlLeft')toggleCrouch();
  else if(c==='KeyZ')useZeal();else if(/^Digit[1-4]$/.test(c))switchGun(+c.slice(5)-1);else if(c==='Tab')switchGun((P.gun+1)%GUNS.length);
  dismissHint();});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;fireHeld=false;P.adsHeld=false;});
const cv=renderer.domElement,ptrs=new Map(),joyEl=$('joy'),knob=$('knob');let joyId=null,lookId=null,lastLookTap=0,lastLookXY=[0,0];
cv.addEventListener('pointerdown',e=>{
  // (a mouse's buttons are read from mousedown below: pointerdown only fires for the first button pressed, so holding aim and then clicking fire was lost)
  if(e.pointerType==='mouse'){if(!locked&&!coarse&&cv.requestPointerLock){try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(_){}}return;}
  try{cv.setPointerCapture(e.pointerId);}catch(_){}dismissHint();
  if(joyId===null&&e.clientX<innerWidth*.45){joyId=e.pointerId;joy.bx=e.clientX;joy.by=e.clientY;joyEl.style.left=e.clientX+'px';joyEl.style.top=e.clientY+'px';knob.style.transform='';joyEl.hidden=false;}
  else if(lookId===null){lookId=e.pointerId;
    // double-tap the right side of the screen to aim down the sights (and again to stop)
    const now=performance.now();if(now-lastLookTap<300&&Math.hypot(e.clientX-lastLookXY[0],e.clientY-lastLookXY[1])<60){P.adsHeld=!P.adsHeld;lastLookTap=0;}else lastLookTap=now;lastLookXY=[e.clientX,e.clientY];}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(e.pointerId===joyId){let jx=e.clientX-joy.bx,jy=e.clientY-joy.by;const L=Math.hypot(jx,jy),mx=52;if(L>mx){jx*=mx/L;jy*=mx/L;}joy.x=jx/mx;joy.y=-jy/mx;knob.style.transform=`translate(${jx}px,${jy}px)`;}
  else if(e.pointerId===lookId&&P.input){const k=camera.fov/62;P.yaw-=dx*.006*k;P.pitch=clamp(P.pitch-dy*.005*k,-.9,.7);}});
const endPtr=e=>{if(e.pointerId===joyId){joyId=null;joy.x=joy.y=0;joyEl.hidden=true;}if(e.pointerId===lookId)lookId=null;ptrs.delete(e.pointerId);};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('mousedown',e=>{if(!locked)return;if(e.button===2)P.adsHeld=true;else if(e.button===0){fireHeld=true;P.trigger=true;}});
addEventListener('mouseup',e=>{if(e.button===2)P.adsHeld=false;else fireHeld=false;});
cv.addEventListener('wheel',e=>{if(!locked)return;e.preventDefault();switchGun((P.gun+(e.deltaY>0?1:GUNS.length-1))%GUNS.length);},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===cv;cv.style.cursor=locked?'none':'';if(!locked){fireHeld=false;P.adsHeld=false;}});
cv.addEventListener('mousemove',e=>{if(!locked||!P.input)return;const k=camera.fov/62;P.yaw-=(e.movementX||0)*.0023*k;P.pitch=clamp(P.pitch-(e.movementY||0)*.0023*k,-.9,.7);});
function holdBtn(el,on,off){el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{el.setPointerCapture(e.pointerId);}catch(_){}el.classList.add('on');on();});
  const f=()=>{el.classList.remove('on');if(off)off();};el.addEventListener('pointerup',f);el.addEventListener('pointercancel',f);el.addEventListener('lostpointercapture',f);el.addEventListener('contextmenu',e=>e.preventDefault());}
holdBtn($('fire'),()=>{fireHeld=true;P.trigger=true;},()=>{fireHeld=false;});
// swipe up off FIRE throws a grenade (the NADE button still works too)
{const fb=$('fire');let y0=null,thrown=false;fb.addEventListener('pointerdown',e=>{y0=e.clientY;thrown=false;});
  fb.addEventListener('pointermove',e=>{if(y0===null||thrown)return;if(y0-e.clientY>55){thrown=true;fireHeld=false;throwNade();fb.classList.add('nadeflick');setTimeout(()=>fb.classList.remove('nadeflick'),250);}});
  const up=()=>{y0=null;};fb.addEventListener('pointerup',up);fb.addEventListener('pointercancel',up);}
holdBtn($('nade'),()=>throwNade());holdBtn($('use'),()=>useAction());
holdBtn($('ads'),()=>{P.adsHeld=!P.adsHeld;});holdBtn($('rld'),()=>startReload());holdBtn($('wpn'),()=>switchGun((P.gun+1)%GUNS.length));
// one gear button: tap for the mobile shield, hold for the shoulder sentry
{const gb=$('shld');let ht=null,held=false;
  holdBtn(gb,()=>{held=false;gb.classList.remove('holding');ht=setTimeout(()=>{held=true;gb.classList.add('holding');launchSentry();},420);},
    ()=>{clearTimeout(ht);gb.classList.remove('holding');if(!held)dropWall();held=false;});}
holdBtn($('jump'),()=>jump());holdBtn($('crch'),()=>toggleCrouch());
// Zeal on a phone: tap the shield gem when it turns gold
SHUD.zealTap(()=>useZeal());
const hint=$('hint');
hint.textContent=coarse?'Left thumb moves (push to the edge to sprint) · right thumb aims · double-tap right to aim down the sights · swipe up off FIRE for a grenade · GEAR: tap shield, hold sentry':'Click to lock the mouse · WASD move · left click fires · right click aims · 1–4 weapons · R reload · Q shield · X sentry · G grenade · Space jump · C crouch · Z Zeal';
let hintGone=false;function dismissHint(){if(hintGone)return;hintGone=true;setTimeout(()=>hint.classList.add('gone'),3500);}
setTimeout(dismissHint,8000);   // on PC it fades by itself too, even if you haven't touched anything
let onUse=null;function useAction(){if(typeof VEH!=='undefined'&&VEH.use())return;if(onUse)onUse();}
const inVeh=()=>typeof VEH!=='undefined'&&!!VEH.cur;
// jump and crouch (back on). Crouch is a toggle; sprinting or jumping stands you up.
function jump(){if(!P.alive||!P.input||inVeh())return;if(P.crouch){P.crouch=false;return;}if(P.pos.y-groundY(P.pos.x,P.pos.z)<.05)P.vy=6.2;}
function toggleCrouch(){if(!P.alive||!P.input||inVeh())return;P.crouch=!P.crouch;}

/* ---------- aiming: a ray from the camera through the crosshair, with this weapon's spread ---------- */
function aimRay(maxD,spread){const o=camera.position.clone(),d=camera.getWorldDirection(new THREE.Vector3());
  if(spread)d.add(_v.set(R(-1,1),R(-1,1),R(-1,1)).multiplyScalar(spread)).normalize();
  let bt=maxD,hit=null;
  for(const E of ENEMIES){if(E.H.dead)continue;const h=1.95*E.scale*(E.H.crouch?1-E.H.crouch*.35:1),t=rayCapsule(o,d,E.pos,h,.42);if(t>0&&t<bt){bt=t;hit={E,zone:DMG.zoneAt(o.y+d.y*t-E.pos.y,h)};}}
  for(const D of DROPS){if(D.dead||!D.g.visible)continue;const t=raySphere(o,d,D.g.position,7);if(t>0&&t<bt){bt=t;hit={D};}}
  for(const Tt of TURRETS){if(Tt.dead)continue;const t=raySphere(o,d,Tt.head.getWorldPosition(_w),Tt.r||1.5);if(t>0&&t<bt){bt=t;hit={T:Tt};}}
  for(const AT of AIR_TARGETS){if(AT.off&&AT.off())continue;for(const S of AT.spheres()){const t=raySphere(o,d,S.c,S.r);if(t>0&&t<bt){bt=t;hit={AT};}}}   // Oct 25: big ships (the Pathfinder gunship)
  // Oct 25 (Bryce: in Dead Ground the bullets hit the rocks): a capsule's spheres used to reach a whole radius above the obstacle's top,
  // so a knee-high rock caught shots a metre over it. The top sphere now ends at the obstacle's real height.
  for(const ob of OBST){if(ob.ghost)continue;const gy=ob.y0!=null?ob.y0:groundY(ob.x,ob.z);let t;
    if(ob.bar)t=rayCapsule(o,d,_w.set(ob.x,gy,ob.z),.55,.7);   // barricades: the shot clears the top rail (it used to stop ~0.7 m above it)
    else{const rr=Math.min(ob.r*.85,ob.h*.5);t=rayCapsule(o,d,_w.set(ob.x,gy,ob.z),Math.max(0,ob.h-rr),rr);}
    if(t>0&&t<bt){bt=t;hit=null;}}
  if(RECTS.length){const far=_u.copy(o).addScaledVector(d,bt),fo=o.clone();for(const Rb of RECTS){const k=rectHit(Rb,fo,far);if(k>=0&&k*bt<bt){bt=Math.max(.05,k*bt);hit=null;far.copy(o).addScaledVector(d,bt);}}}
  // terrain: march along the ray (finer close in, where walls are thin)
  for(let s=.6;s<bt;s+=s<60?.6:1.5){_v.copy(o).addScaledVector(d,s);if(_v.y<shotG(_v.x,_v.z)){bt=s;hit=null;break;}}
  return{p:o.addScaledVector(d,bt),hit,dist:bt,dir:d};}
function raySphere(o,d,c,r){_w.subVectors(c,o);const t=_w.dot(d);if(t<0)return-1;const q=_w.lengthSq()-t*t;return q<r*r?t-Math.sqrt(r*r-q):-1;}
function rayCapsule(o,d,base,h,r){   // vertical capsule: closest approach of the ray to the segment base..base+h
  const bx=base.x,by=base.y,bz=base.z;let best=-1;const n=Math.max(4,Math.ceil(h/2.2));for(let k=0;k<=n;k++){const c=_u.set(bx,by+h*k/n,bz),t=raySphere(o,d,c,r);if(t>0&&(best<0||t<best))best=t;}return best;}

/* ---------- your weapons ---------- */
function muzzle(H){H.root.updateMatrixWorld(true);if(H.gun&&H.gunObj)return H.gunObj.localToWorld(H.gunObj.userData.grip.muzzle.clone());return H.arms[1].el.localToWorld(H.muzzleL?H.muzzleL.clone():new THREE.Vector3(0,-.28,-.95));}   // the barrel's tip, after this frame's pose
const zealK=()=>P.zealT>0?DMG.EXTRA.zeal:1;
function playerShoot(){
  const G=GUNS[P.gun],A0=P.ammo[P.gun];
  if(P.reloadT>0||P.switchT>0)return;
  if(A0.mag<=0){if(A0.res>0)startReload();else if(!playerShoot.click||T-playerShoot.click>.6){playerShoot.click=T;banner(G.short+' · out of ammunition','alert');if(typeof sfx!=='undefined'&&sfx.empty)sfx.empty();}return;}
  A0.mag--;P.cool=G.rof/(P.zealT>0?DMG.EXTRA.zeal:1);
  // the sound: this slot's gun in its Armory skin (js/shared/sfx-map.js); a magazine dropping under a quarter ticks once
  if(typeof sfx!=='undefined'&&sfx.playerGun){if(!G.rocket)sfx.playerGun(G.id,typeof PG!=='undefined'&&PG.arms?PG.arms.equipped(G.id):'standard');
    if(!G.inf&&G.mag>=8&&A0.mag===Math.floor(G.mag/4))sfx.lowAmmo();}
  const spread=(G.spread+(G.ads-G.spread)*P.ads)*(P.moving>1?1.6:1)*(P.crouch?.65:1);
  const A=aimRay(G.range,spread);camera.updateMatrixWorld(true);const from=VM.root.visible?muzzle(VM):muzzle(P.H);FP.kick=G.kind==='lance'?1.6:G.rocket?2.2:1;
  if(G.rocket){fireRocket(from,A.p);P.H.hitT=.12;return;}
  boom(from,.35,G.kind==='lance'?0xffffff:0x9ff4ff,.06);
  // the damage is the weapon's for the zone it hit (troopers: head / torso / the rest; vehicles and aircraft have no zones: torso)
  const hc=A.hit?(A.hit.E?!!A.hit.E.team:true):null;   // a hit confirm: the Empty Host, or something armoured (Heralds, dropships, turrets, mechs, ships)
  fire(from,A.p,G.kind==='lance'?320:170,G.kind,p=>{boom(p,.6,0xbff4ff,.25);if(hc!==null&&typeof sfx!=='undefined'&&sfx.hitConfirm)sfx.hitConfirm(hc);
    if(A.hit&&A.hit.E)hurtEnemy(A.hit.E,DMG.player(G.spec,A.hit.zone)*zealK(),'gun',A.hit.zone);else if(A.hit&&A.hit.D)hurtDrop(A.hit.D,DMG.player(G.spec)*zealK(),p);
    else if(A.hit&&A.hit.AT)A.hit.AT.hit(p,'gun',DMG.player(G.spec)*zealK());
    else if(A.hit&&A.hit.T)hurtTurret(A.hit.T,A.hit.T.mech?DMG.player(G.spec)*zealK():G.kind==='lance'?1:.3,p,'gun');else puff(p,.6,.6);});
  if(A0.mag===0&&A0.res>0)setTimeout(()=>{if(P.ammo[P.gun]===A0&&A0.mag===0)startReload();},180);
}
function startReload(){if(inVeh())return;const G=GUNS[P.gun],A=P.ammo[P.gun];if(P.reloadT>0||A.mag>=G.mag||A.res<=0||!P.alive)return;P.reloadT=G.reload*(P.zealT>0?.6:1);P.reloadMax=P.reloadT;if(typeof sfx!=='undefined'&&sfx.reload)sfx.reload(P.reloadT);}
function switchGun(i){if(i===P.gun||!P.alive||!GUNS[i]||inVeh())return;P.gun=i;P.reloadT=0;P.H.reload=0;P.switchT=.35;if(typeof sfx!=='undefined'&&sfx.swap)sfx.swap();}
// the Breaker: a rocket that flies straight with a little drop, trailing smoke
// Oct 25: big targets in the air that shots and rockets can hit: {spheres:()=>[{c:Vector3,r}], hit(p,how,dmg), off:()=>bool}
const AIR_TARGETS=[];
// the ground a shot stops on (a map can define shotGroundY where its stand-in walls shouldn't stop shots: js/pathfinder/01-world.js)
function shotG(x,z){return typeof shotGroundY==='function'?shotGroundY(x,z):groundY(x,z);}
const ROCKETS=[],rocketGeo=new THREE.CylinderGeometry(.06,.09,.6,8).rotateX(Math.PI/2),rocketMat=new THREE.MeshStandardMaterial({color:C(0x4a5a3a),roughness:.5,metalness:.4,emissive:C(0x221100)});
function fireRocket(from,to){const m=new THREE.Mesh(rocketGeo,rocketMat);const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffb050).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));fl.scale.setScalar(1.1);fl.position.z=-.4;m.add(fl);
  m.position.copy(from);scene.add(m);const v=_v.subVectors(to,from).normalize().multiplyScalar(75).clone();m.lookAt(to);
  ROCKETS.push({m,v,t:0,trail:0});boom(from,1.2,0xffc070,.2);puff(from,1.4,1.2);if(typeof sfx!=='undefined')(sfx.breaker||sfx.missile)(from);}
function updateRockets(dt){for(let i=ROCKETS.length-1;i>=0;i--){const Rk=ROCKETS[i];Rk.t+=dt;Rk.v.y-=.8*dt;const p=Rk.m.position,prev=p.clone();p.addScaledVector(Rk.v,dt);Rk.m.lookAt(_v.copy(p).add(Rk.v));
  Rk.trail-=dt;if(Rk.trail<=0){Rk.trail=.03;puff(p.clone(),R(.5,.9),1.1);}
  let hit=Rk.t>6.5||p.y<shotG(p.x,p.z)+.1,air=null;   // Oct 25: flies ~6.5 s (~500 m), was 4 s
  if(!hit)for(const AT of AIR_TARGETS){if(AT.off&&AT.off())continue;for(const S of AT.spheres())if(S.c.distanceTo(p)<S.r+.4){hit=true;air=AT;break;}if(air)break;}
  let dE=null,dD=null,dT=null;   // what it struck directly takes the Breaker's 250 (Oct 25); the blast round it is the old one, a stand-in until its area damage is set
  if(!hit)for(const E of ENEMIES)if(!E.H.dead&&Math.hypot(E.pos.x-p.x,E.pos.z-p.z)<.7&&p.y>E.pos.y&&p.y<E.pos.y+2.2){hit=true;dE=E;break;}
  if(!hit)for(const D of DROPS)if(!D.dead&&D.g.position.distanceTo(p)<6.5){hit=true;dD=D;break;}
  if(!hit)for(const Tt of TURRETS)if(!Tt.dead&&Tt.head.getWorldPosition(_w).distanceTo(p)<(Tt.r||1.5)+.3){hit=true;dT=Tt;break;}
  if(!hit)for(const o of OBST){if(o.ghost)continue;if(Math.hypot(o.x-p.x,o.z-p.z)<o.r&&p.y<groundY(o.x,o.z)+o.h){hit=true;break;}}
  if(!hit)for(const Rb of RECTS)if(rectHit(Rb,prev,p)>=0){hit=true;break;}
  if(hit){scene.remove(Rk.m);ROCKETS.splice(i,1);const direct=DMG.player('breaker')*zealK();
    if(dE)hurtEnemy(dE,direct,'rocket');if(dD)hurtDrop(dD,direct,prev);if(dT)hurtTurret(dT,dT.mech?direct:45,prev,'rocket');
    rocketBlast(prev,dE||dD||dT);if(air)air.hit(prev,'rocket',direct);}}}
function rocketBlast(p,skip){if(typeof sfx!=='undefined'&&sfx.impact){sfx.impact(p);rocketBlast.snd=performance.now();}blast(p,6.5,9*zealK(),true,'rocket',skip);for(const Tt of TURRETS)if(Tt!==skip&&!Tt.dead&&Tt.head.getWorldPosition(_w).distanceTo(p)<4.5+(Tt.r?Tt.r-1.5:0))hurtTurret(Tt,Tt.mech?45*MECH_K:45,p,'rocket');}
const NADES=[],nadeGeo=new THREE.SphereGeometry(.12,8,6),nadeMat=new THREE.MeshBasicMaterial({color:C(0xffd27a).multiplyScalar(2)});
function throwNade(){if(inVeh()){VEH.alt();return;}if(!P.alive||!P.input||P.nadeCD>0)return;P.nadeCD=5;if(typeof sfx!=='undefined'&&sfx.toss)sfx.toss();
  const m=new THREE.Mesh(nadeGeo,nadeMat);scene.add(m);m.position.copy(P.pos).add(_v.set(0,1.7,0));
  const d=camera.getWorldDirection(new THREE.Vector3());d.y+=.35;d.normalize();
  NADES.push({m,v:d.multiplyScalar(19).add(new THREE.Vector3(0,1,0)),t:0});}
function updateNades(dt){for(let i=NADES.length-1;i>=0;i--){const N=NADES[i];N.t+=dt;N.v.y-=16*dt;N.m.position.addScaledVector(N.v,dt);
  const gy=groundY(N.m.position.x,N.m.position.z);if(N.m.position.y<gy+.12){N.m.position.y=gy+.12;N.v.y*=-.3;N.v.x*=.5;N.v.z*=.5;}
  if(N.t>1.7){const p=N.m.position.clone();scene.remove(N.m);NADES.splice(i,1);blast(p,6,5*zealK(),true);for(const Tt of TURRETS)if(!Tt.dead&&Tt.head.getWorldPosition(_w).distanceTo(p)<3.5+(Tt.r?Tt.r-1.5:0))hurtTurret(Tt,Tt.mech?12*MECH_K:12,p,'nade');}}}
/* blasts (grenades, the Breaker's splash, crashing dropships) aren't in the spec: they keep their old feel, in old fight units ×
   DMG.LEGACY on a trooper (a grenade still kills at its heart and not at its edge) and the same share of a dropship's 300 */
const DROP_K=DMG.CLASS.dropship.hp/28,MECH_K=DMG.CLASS.mech.hp/120;   // a dropship used to have 28, the Herald mech 120
function blast(p,r,dmg,mine,how,skip){boom(p,8,0xfff0c0,.5);boom(p,13,0xff8a3a,1.1);for(let i=0;i<6;i++)puff(p.clone().add(_v.set(R(-2,2),R(0,2),R(-2,2))),R(2,4),R(2,3));
  if(typeof sfx!=='undefined'&&!(how==='rocket'&&performance.now()-(rocketBlast.snd||0)<50))sfx.blast(p);   // (a rocket's blast already played its recorded impact)
  for(const E of ENEMIES){if(E.H.dead||E===skip)continue;const d=E.pos.distanceTo(p);if(d<r)hurtEnemy(E,dmg*(1-d/r*.6)*DMG.LEGACY,mine?(how||'nade'):'');}
  for(const D of DROPS)if(!D.dead&&D!==skip&&D.g.position.distanceTo(p)<r+6)hurtDrop(D,dmg*(how==='rocket'?1.8:2)*DROP_K,p);
  for(const AT of AIR_TARGETS)if(AT.blast&&!(AT.off&&AT.off()))AT.blast(p,r,dmg,mine,how);   // ground vehicles (js/shared/vehicles.js) take blasts too
  if(!mine&&P.alive&&P.pos.distanceTo(p)<r)hurtPlayer(25*(1-P.pos.distanceTo(p)/r)*PLAYER_K);}

/* ---------- gear: the mobile shield, the shoulder sentry, Zeal ---------- */
const WALL_CD=22,SENTRY_CD=28,SENTRY_T=16,WALL_T=12;
const hexTex=(()=>{const S=128,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2.2;
  const r=16,h=r*Math.sqrt(3);for(let row=-1;row<6;row++)for(let col=-1;col<6;col++){const cx=col*r*1.5,cy=row*h+(col%2?h/2:0);x.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;x[k?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r);}x.closePath();x.stroke();}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,2);return t;})();
const wallMat=new THREE.MeshBasicMaterial({map:hexTex,color:C(0x7fe3ff).multiplyScalar(1.4),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
function dropWall(){if(!P.alive||!P.input||P.wallCD>0||inVeh())return;
  if(P.wall){scene.remove(P.wall.g);P.wall=null;}
  const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),g=new THREE.Group();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.2,2.5,24,1,true,-.55,1.1),wallMat);m.position.y=1.25;g.add(m);
  const em=new THREE.Mesh(new THREE.BoxGeometry(.5,.18,.3),new THREE.MeshStandardMaterial({color:C(0x2a3440),metalness:.6,roughness:.4,emissive:C(0x7fe3ff),emissiveIntensity:.6}));em.position.set(0,.09,3.2);g.add(em);
  // the arc's centre sits behind you, so the curve wraps the space in front of you
  const cx=P.pos.x+fx*(2.6-3.2),cz=P.pos.z+fz*(2.6-3.2);g.position.set(cx,groundY(P.pos.x+fx*2.6,P.pos.z+fz*2.6),cz);g.rotation.y=P.yaw+Math.PI;scene.add(g);
  P.wall={g,m,cx:P.pos.x+fx*2.6,cz:P.pos.z+fz*2.6,fx,fz,hp:DMG.EXTRA.wallHp,t:WALL_T,flash:0};P.wallCD=WALL_CD;
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
function launchSentry(){if(!P.alive||!P.input||P.sentryCD>0||inVeh())return;P.sentry={t:SENTRY_T,cool:.5,tgt:null,re:0};P.sentryCD=SENTRY_CD;sentryG.visible=true;sentryG.position.copy(P.pos).add(_v.set(0,2.3,0));
  if(typeof sfx!=='undefined'&&sfx.sentry)sfx.sentry();banner('Shoulder sentry online');}
function updateSentry(dt){P.sentryCD=Math.max(0,P.sentryCD-dt);const S=P.sentry;if(!S){sentryG.visible=false;return;}S.t-=dt;
  const rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw),want=_v.set(P.pos.x+rx*.75,P.pos.y+2.25+Math.sin(T*3)*.08,P.pos.z+rz*.75);sentryG.position.lerp(want,1-Math.exp(-dt*8));
  S.re-=dt;if(S.re<=0){S.re=.5;S.tgt=null;let bd=50;for(const E of ENEMIES){if(E.H.dead)continue;const d=E.pos.distanceTo(sentryG.position);if(d<bd&&!blocked(sentryG.position,_w.copy(E.pos).setY(E.pos.y+1.4))){bd=d;S.tgt=E;}}}
  if(S.tgt&&!S.tgt.H.dead){sentryG.lookAt(S.tgt.pos.x,S.tgt.pos.y+1.3,S.tgt.pos.z);S.cool-=dt;
    if(S.cool<=0&&!canSee(S,sentryG.position,_w.copy(S.tgt.pos).setY(S.tgt.pos.y+1.3),S.tgt,dt)){S.re=0;}   // lost sight: look for another
    else if(S.cool<=0){S.cool=1/DMG.GUN[DMG.EXTRA.sentry].rps;const from=sentryG.position.clone(),E=S.tgt,d=from.distanceTo(E.pos),hit=rng()<.5*clamp(1.2-d/50,.3,1),to=E.pos.clone().add(_v.set(0,1.3,0));if(!hit)to.add(_v.set(R(-1,1),R(-.5,1),R(-1,1)));
      boom(from,.25,0x9ff4ff,.05);fire(from,to,160,'krifle',q=>{boom(q,.4,0xbfe8ff,.2);if(hit)hurtEnemy(E,DMG.player(DMG.EXTRA.sentry),'sentry');});}}
  else sentryG.rotation.y=P.yaw;
  if(S.t<=0){P.sentry=null;boom(sentryG.position.clone(),.8,0x9ff4ff,.3);sentryG.visible=false;}}
// Zeal: the meter fills as you fight. Burn it for nine seconds of double damage, a faster rifle, and most hits shrugged off
const ZEAL_T=9;
const zealAura=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd27a).multiplyScalar(1.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.5}));zealAura.scale.setScalar(4.2);zealAura.visible=false;scene.add(zealAura);
function gainZeal(n){if(P.zealT>0)return;const was=P.zeal<100;P.zeal=Math.min(100,P.zeal+n);if(was&&P.zeal>=100)banner(coarse?'Zeal ready · tap ZEAL':'Zeal ready · press Z');}
function useZeal(){if(!P.alive||!P.input||P.zeal<100||P.zealT>0)return;P.zealT=ZEAL_T;P.zeal=0;P.shield=P.maxShield;P.hp=Math.min(P.maxHp,P.hp+25);zealAura.visible=true;
  banner('ZEAL · the Word burns bright');flashScreen(.25);$('zealV').classList.add('on');if(typeof sfx!=='undefined')sfx.zeal();if(++P.zeals>=3)PG.ach('zealot');}
/* a blessing (Oct 25, Bryce: after the standing stone glows in Dead Ground, an effect for a little while): for sec seconds you take
   about half the damage, move faster and heal quickly. A pale gold light rides with you and the edges of the screen; a chip counts it down. */
const blessAura=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xfff2c8).multiplyScalar(1.3),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.35}));blessAura.scale.setScalar(3.4);blessAura.visible=false;scene.add(blessAura);
let blessEl=null;
function bless(sec,name,sub){P.blessT=sec;P.blessMax=sec;P.blessName=name||'BLESSED';blessAura.visible=true;flashScreen(.2);
  if(!blessEl){const st=document.createElement('style');st.textContent='.blessV{position:fixed;inset:0;z-index:2;pointer-events:none;opacity:0;transition:opacity .8s;box-shadow:inset 0 0 90px rgba(255,236,190,.38)}.blessV.on{opacity:1}'+
      '.blessChip{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 96px);z-index:3;pointer-events:none;font:700 10px "Chakra Petch",sans-serif;letter-spacing:.18em;color:#fff2c8;text-shadow:0 1px 4px #000;display:none}'+
      '.blessChip i{display:block;height:4px;margin-top:4px;background:rgba(255,242,200,.2);border-radius:2px;overflow:hidden}.blessChip u{display:block;height:100%;background:#ffe9b0}';document.head.appendChild(st);
    blessEl={v:document.createElement('div'),c:document.createElement('div')};blessEl.v.className='blessV';blessEl.c.className='blessChip';blessEl.c.innerHTML='<span></span><i><u></u></i>';document.body.append(blessEl.v,blessEl.c);}
  blessEl.v.classList.add('on');blessEl.c.style.display='block';banner(P.blessName+(sub?' · '+sub:''),'alert');if(typeof sfx!=='undefined'&&sfx.wake)sfx.wake();}
function updateBless(dt){if(!(P.blessT>0))return;P.blessT-=dt;blessAura.position.copy(P.pos).add(_v.set(0,1.2,0));blessAura.material.opacity=.22+.12*Math.sin(T*3);
  if(blessEl){blessEl.c.querySelector('span').textContent=P.blessName+' · '+Math.ceil(P.blessT)+' S';blessEl.c.querySelector('u').style.width=(P.blessT/P.blessMax*100)+'%';}
  if(P.blessT<=0){P.blessT=0;blessAura.visible=false;if(blessEl){blessEl.v.classList.remove('on');blessEl.c.style.display='none';}banner(P.blessName+' fades');}}
function updateZeal(dt){updateBless(dt);if(P.zealT>0){P.zealT-=dt;zealAura.position.copy(P.pos).add(_v.set(0,1.1,0));zealAura.material.opacity=.35+.2*Math.sin(T*8);
    if(P.zealT<=0){zealAura.visible=false;$('zealV').classList.remove('on');}}
  else if(PG.run&&phaseFight())P.zeal=Math.min(100,P.zeal+dt*.5);}

/* ---------- getting hurt, and healing ---------- */
/* the hit marker: a red wedge on a ring round the crosshair, pointing at whoever shot you (behind you = bottom of the ring) */
const HITDIR=(()=>{const st=document.createElement('style');st.textContent=`.hitdir{position:fixed;left:50%;top:50%;width:min(46vh,46vw);height:min(46vh,46vw);margin:calc(min(46vh,46vw)/-2) 0 0 calc(min(46vh,46vw)/-2);pointer-events:none;z-index:2}
  .hitdir i{position:absolute;left:50%;top:0;width:60px;height:26px;margin-left:-30px;transform-origin:30px calc(min(46vh,46vw)/2);opacity:0;transition:opacity .9s ease-out;
  background:radial-gradient(ellipse at 50% 0%,rgba(255,60,40,.95),rgba(255,40,30,0) 70%);clip-path:polygon(0 0,100% 0,70% 100%,30% 100%)}`;document.head.appendChild(st);
  const box=document.createElement('div');box.className='hitdir';document.body.appendChild(box);const pool=[];for(let i=0;i<4;i++){const w=document.createElement('i');box.appendChild(w);pool.push(w);}let k=0;
  return{show(from){if(!from||!P.alive)return;const yawTo=Math.atan2(-(from.x-P.pos.x),-(from.z-P.pos.z)),rel=yawTo-P.yaw;const w=pool[k++%pool.length];
    w.style.transition='none';w.style.opacity=1;w.style.transform=`rotate(${-rel}rad)`;requestAnimationFrame(()=>requestAnimationFrame(()=>{w.style.transition='opacity .9s ease-out';w.style.opacity=0;}));}};})();
/* you: 100 HP + 25 shield; a hit empties the shield first and the rest goes into HP in the same hit (DMG.hit).
   exact: the damage is already the spec's (troopers, turrets); otherwise it is in the old fight units (the story's blasts, hazards,
   the Herald mech's guns), made a share of your 125 the way it was a share of your old 200 (PLAYER_K). The threat level is already
   in the spec's numbers. Zeal still shrugs off most of a hit. In a vehicle the vehicle takes it, in old units (js/shared/vehicles.js) */
const PLAYER_K=(DMG.STD.hp+DMG.STD.shield)/200;
function hurtPlayer(dmg,from,exact){if(!P.alive||!P.input||(typeof CUTS!=='undefined'&&CUTS.on))return;
  if(inVeh()){VEH.hurt((exact?dmg/PLAYER_K:dmg*(OD.dmg||1))*.8,from);return;}
  if(P.blessT>0)dmg*=.5;if(from)HITDIR.show(from);dmg*=(exact?1:PLAYER_K*(OD.dmg||1))*(P.zealT>0?.3:1);const r=DMG.hit(P,dmg,T),s=r.shield;
  hitHuman(P.H);
  $('hurt').style.opacity=s>=dmg?.25:.75;setTimeout(()=>$('hurt').style.opacity=0,180);if(typeof sfx!=='undefined')sfx.hit(s>=dmg);
  if(P.hp<=0)playerDown();}
function playerDown(){P.alive=false;P.hp=0;P.respawnT=5;killHuman(P.H);fireHeld=false;P.adsHeld=false;PG.say('Keeper Sergeant','Lieutenant down! Medic! Get him up!','alert',4);
  banner('You are down · your squad is pulling you back','alert');}
function playerUp(){P.alive=true;DMG.refill(P);reviveHuman(P.H);P.pos.copy(P.spawn);P.pos.y=groundY(P.pos.x,P.pos.z);
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
  if(K.type==='med'&&P.hp<P.maxHp){DMG.heal(P,DMG.MED_HP);took='Medical pack · +'+DMG.MED_HP+' HP';}
  else if(K.type==='ammo'){for(let g=0;g<2;g++){const A=P.ammo[g],cap=GUNS[g].max;if(A.res<cap){A.res=Math.min(cap,A.res+Math.round(cap*.5));took='Ammunition';}}}
  else if(K.type==='rocket'){const A=P.ammo[2];if(A.res+A.mag<GUNS[2].max+1){A.res=Math.min(GUNS[2].max,A.res+2);took='Breaker rockets · +2';}}
  if(took){scene.remove(K.g);PICKS.splice(i,1);banner(took);if(typeof sfx!=='undefined'&&sfx.pickup)sfx.pickup();}}}

/* ---------- the Empty Host: troopers that advance, take cover, and fire purple bursts ---------- */
const ENEMIES=[];
// the mark over a Herald's head: its side's colour and shape, a fixed size on screen
const factionMark=(()=>{const T={};return team=>{if(!T[team]){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  x.fillStyle=team==='red'?'#ff4a2a':'#ffc040';x.strokeStyle='rgba(0,0,0,.75)';x.lineWidth=5;x.beginPath();
  if(team==='red'){x.moveTo(10,14);x.lineTo(54,14);x.lineTo(32,52);}else{x.moveTo(32,6);x.lineTo(56,32);x.lineTo(32,58);x.lineTo(8,32);}
  x.closePath();x.stroke();x.fill();T[team]=new THREE.CanvasTexture(c);}
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:T[team],sizeAttenuation:false,depthWrite:false,transparent:true,toneMapped:false}));s.scale.setScalar(.04);s.renderOrder=5;return s;};})();
function spawnTrooper(x,z,opts){opts=opts||{};
  if(!opts.gunner&&!opts.warm&&ENEMIES.filter(E=>!E.H.dead&&!E.warm).length>=(coarse?(window.ENEMY_CAP_PHONE||14):(window.ENEMY_CAP||22)))return null;
  const H=makeHuman('trooper');scene.add(H.root);
  /* Heralds (Pathfinder Arc 02): opts.team 'red' or 'amber', two sides of their civil war. Oct 22 (Bryce: "you cannot tell the
     difference between the two factions", and both were the colour of the sand): the RED side wears its armour dark, almost black,
     with red lights and a red crest; the AMBER side wears it pale as bone, with amber lights and a banner pole on the back. Over each
     head a small mark in the side's colour and shape (red: a point down, amber: a diamond), hidden by walls like the soldier is.
     The Empty Host: its armour glows faintly purple from inside and the hollow ring in the chest is lit, front and back, so a
     trooper reads against the Host's own black walls (Pathfinder) and in the dark below the Hollow. (Placeholder: the Empty Host
     trooper model stands in for a Herald until there is a Herald model.) */
  /* Oct 25: Bryce's Meshy soldiers. The Empty Host are hollow-footsoldiers with some heavies and the odd commander; the Heralds are
     herald-footsoldiers with heavies, engineers, snipers (riflemen up on a wall are snipers, turret crews engineers) and now and then a
     commander or a general. opts.unit picks one. The looks (MODELS.enemyLook): red keeps the models' own red, amber has its reds
     turned amber; both keep their faction marks and lamps below. */
  const TEAM={red:{c:0xff3a1a},amber:{c:0xffb030}}[opts.team];
  const dark=typeof BELOW!=='undefined'&&BELOW.on,side=TEAM?opts.team:'host';
  const unit=opts.unit||(TEAM&&opts.perch?'sniper':opts.gunner?(TEAM?'engineer':'footsoldier'):MODELS.unit(side));
  MODELS.enemy(H,side,{unit,k:TEAM?(window.HERALD_LIFT||null):dark?.75:(window.HOST_LIFT||.32)});
  const RIG=MODELS.RIGS[H.kind]||{h:2.2};
  const deco=[],glowSpr=(c,k,sc,x,y,z,par)=>{const b=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(c).multiplyScalar(k),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    b.scale.setScalar(sc);b.position.set(x,y,z);(par||H.root).add(b);deco.push(b);return b;};
  const keepMesh=(g,c,x,y,z,par)=>{const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:C(c).multiplyScalar(1.8),toneMapped:false}));m.position.set(x,y,z);m.userData.keep=true;(par||H.root).add(m);deco.push(m);return m;};
  if(TEAM){for(const z of[-.24,.22])glowSpr(TEAM.c,2.6,.42,0,1.45,z);
    if(opts.team==='red'){keepMesh(new THREE.BoxGeometry(.05,.1,.42),TEAM.c,0,.32,0,H.head);for(const x of[-.26,.26])glowSpr(TEAM.c,2,.22,x,1.62,-.05);}   // crest, shoulder lamps
    else{const pole=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.5,5),new THREE.MeshStandardMaterial({color:C(0x8a8478),metalness:.6,roughness:.4}));pole.position.set(.14,.75,.24);pole.userData.keep=true;H.torso.add(pole);deco.push(pole);
      const flag=keepMesh(new THREE.PlaneGeometry(.34,.5),0xffc060,.32,1.2,.24,H.torso);flag.material.side=THREE.DoubleSide;flag.rotation.y=Math.PI/2;glowSpr(TEAM.c,2.4,.2,.14,1.52,.24,H.torso);}
    const mk=factionMark(opts.team);mk.position.set(0,2.75,0);H.root.add(mk);deco.push(mk);}
  else{for(const z of[-.25,.23])glowSpr(0xb46aff,dark?2.4:1.8,.34,0,1.5,z);}
  const E={H,pos:H.root.position,scale:RIG.h/1.9,unit:H.unit,yaw:0,...DMG.pool(DMG.STD,DMG.REGEN.npc),cool:R(1,2.5),burst:0,bt:0,mag:DMG.GUN.ar.mag,rld:0,goal:opts.goal||null,hold:opts.hold||R(14,26),
    target:null,retarget:0,t:0,speed:R(3.2,4.2),gone:0,big:false,side:rng()<.5?-1:1,
    anchor:opts.anchor||null,perch:!!opts.perch,gunner:opts.gunner||null,fixed:!!opts.gunner,team:opts.team||null,calm:0,deco};   // anchor: holds cover until you close in; perch: a rifleman up on the wall; gunner: crews a turret
  E.warm=!!opts.warm;E.pos.set(x,0,z);if(!E.perch)keepIn(E.pos);E.pos.y=groundY(E.pos.x,E.pos.z);ENEMIES.push(E);return E;}
// a trooper: 100 HP + 25 shield (the shield comes back after 10 quiet seconds, empty to full in 16); dmg in the spec's units
function hurtEnemy(E,dmg,how,zone){if(E.H.dead)return;DMG.hit(E,dmg,T);E.flinch=.15;hitHuman(E.H);
  if(how==='gun'||how==='rocket'){$('cross').classList.add('hit');clearTimeout(hurtEnemy.t);hurtEnemy.t=setTimeout(()=>$('cross').classList.remove('hit'),90);}
  if(E.hp<=0){killHuman(E.H);if(E.deco)E.deco.forEach(o=>o.visible=false);boom(E.pos.clone().add(_v.set(0,1.2,0)),1.6,HOLLOW_GLOW,.5);if(typeof sfx!=='undefined')sfx.trooperDown(E.pos);
    if(how){P.kills++;gainZeal(how==='sentry'?6:10);PG.kill(how==='nade'?150:how==='rocket'?120:100,E.pos.clone().add(_v.set(0,2,0)),how);PG.prog('okills');if(how==='nade')PG.done('onade');}
    // what they drop: sometimes ammunition, now and then a medical pack
    if(!E.gunner&&phase!=='end'){const r=rng(),k=OD.drops||1;if(r<.16*k)addPick('ammo',E.pos.x,E.pos.z,true);else if(r<.25*k)addPick('med',E.pos.x,E.pos.z,true);}}}
function nearestFoe(E){   // who a trooper shoots at: you, a squadmate, or an engineer (a Herald: the other side first, humans who come close)
  let best=null,bd=1e9;
  if(E.team){for(const F of ENEMIES){if(F===E||F.H.dead||!F.team||F.team===E.team||F.warm)continue;const d=E.pos.distanceTo(F.pos);if(d<bd){bd=d;best={pos:F.pos,E:F};}}
    // (the Empty Host in a Herald war, Pathfinder Arc 03: team 'host'. It fights everyone, and it wants Rhen's team most)
    const host=E.team==='host',near=host?90:36,pk=host?.5:.8;if(P.alive&&P.input){const d=E.pos.distanceTo(P.pos);if(d<near&&d*pk<bd){bd=d*pk;best={pos:P.pos,player:true};}}
    for(const A of ALLIES){if(!A.on||A.H.dead||A.ride)continue;const d=E.pos.distanceTo(A.pos)*(host?.7:1);if(d<near&&d<bd){bd=d;best={pos:A.pos,A};}}
    return best;}
  if(P.alive&&P.input){const d=E.pos.distanceTo(P.pos)*.55;if(d<bd){bd=d;best={pos:P.pos,player:true};}}   // the Host wants the lieutenant most
  for(const A of ALLIES){if(!A.on||A.H.dead||A.ride)continue;const d=E.pos.distanceTo(A.pos);if(d<bd){bd=d;best={pos:A.pos,A};}}
  return best;}
// pushes a point back inside the walkable area (separation and steering used to shove troopers into walls, where the ground
// under them reads as the top of the wall: they popped up 12 to 40 m into the air)
function keepIn(p){if(typeof playD!=='function')return;if(RECTS.length)pushOutRects(p,.5);for(let i=0;i<3;i++){const d=playD(p.x,p.z);if(d<=-.35)return;const e=.25,gx=playD(p.x+e,p.z)-playD(p.x-e,p.z),gz=playD(p.x,p.z+e)-playD(p.x,p.z-e),L=Math.hypot(gx,gz)||1;
  p.x-=gx/L*(d+.4);p.z-=gz/L*(d+.4);}}
function updateEnemies(dt){
  separate(ENEMIES.filter(E=>!E.perch),.5);for(const E of ENEMIES)if(!E.perch&&!E.H.dead)keepIn(E.pos);
  for(let i=ENEMIES.length-1;i>=0;i--){const E=ENEMIES[i];
    if(E.H.dead){E.gone+=dt;poseHuman(E.H,dt,0,0);if(E.gone>5){scene.remove(E.H.root);ENEMIES.splice(i,1);}continue;}
    if(E.warm){poseHuman(E.H,dt,0,1,false);continue;}   // a loading-screen stand-in (below)
    DMG.tick(E,dt,T);E.t+=dt;E.retarget-=dt;if(E.retarget<=0||!E.target){E.retarget=R(1.5,3);E.target=nearestFoe(E);}
    const tg=E.target;let speed=0,aim=0;
    if(E.gunner){   // crewing a turret: stay put behind it, aim with it
      const Tt=E.gunner;E.yaw=Tt.yaw;aim=1;E.H.crouchTo=.15;E.H.aimPitch=0;E.H.root.rotation.y=angLerp(E.H.root.rotation.y,E.yaw,1-Math.exp(-dt*10));poseHuman(E.H,dt,0,1,false);continue;}
    // anchored troopers keep their cover until you get close (or the fight moves past them)
    if(E.anchor&&tg&&(E.pos.distanceTo(tg.pos)<11||roadS(tg.pos.x,tg.pos.z)>roadS(E.anchor.x,E.anchor.z)+6))E.anchor=null;
    const goal=E.goal||E.anchor||(tg?tg.pos:null);
    if(goal){const d=E.pos.distanceTo(tg?tg.pos:goal);
      const see=tg&&canSee(E,_v.copy(E.pos).setY(E.pos.y+1.5),_w.copy(tg.pos).setY(tg.pos.y+1.4),tg.E||tg.A||tg.V||'p',dt);
      const want=E.perch?false:E.goal||E.anchor?E.pos.distanceTo(goal)>(E.anchor?.8:3):(d>E.hold||!see);
      if(want){navToward(E.pos.x,E.pos.z,goal.x,goal.z,_w);const L=_w.length();if(L>.1){_w.multiplyScalar(1/L);steer(E.pos,_w,.45,E.side);unstick(E,dt,true,_w);speed=E.speed*(E.flinch>0?.3:1);
        moveBody(E.pos,_w.x*speed*dt,_w.z*speed*dt,.45);E.yaw=Math.atan2(-_w.x,-_w.z);}}
      else{E.stT=0;if(E.goal&&E.pos.distanceTo(E.goal)<=3)E.goal=null;}
      if(tg&&d<70){if(!want)E.yaw=Math.atan2(-(tg.pos.x-E.pos.x),-(tg.pos.z-E.pos.z));aim=1;
        // bursts of three
        /* Oct 25: an assault rifle like yours: 4 shots a second while it has you in sight, 40 rounds, then a 4 s reload. (cool: the
           moment it takes to bring the rifle up when it first sees you) */
        E.burst=0;   // (burst: firing this frame, so a trooper in cover stands to shoot)
        if(E.calm>0){E.calm-=dt;aim=.3;}else if(E.rld>0){E.rld-=dt;if(E.rld<=0)E.mag=DMG.GUN.ar.mag;}else if(see&&d<60){E.burst=1;E.cool-=dt;if(E.cool<=0){E.cool+=1/DMG.GUN.ar.rps;trooperShot(E,tg,d);if(--E.mag<=0)E.rld=DMG.GUN.ar.reload;}}
        else E.cool=Math.max(E.cool,R(.3,.8));}}
    E.flinch=Math.max(0,(E.flinch||0)-dt);
    // troopers holding cover crouch behind it between bursts
    E.H.crouchTo=E.anchor&&E.burst===0&&speed<.5?.75:0;
    if(!E.perch)E.H.aimPitch=tg?clamp(Math.atan2(tg.pos.y-E.pos.y,Math.hypot(tg.pos.x-E.pos.x,tg.pos.z-E.pos.z)),-.6,.6):0;else E.H.aimPitch=tg?clamp(Math.atan2(tg.pos.y-E.pos.y,Math.hypot(tg.pos.x-E.pos.x,tg.pos.z-E.pos.z)),-.9,.3):0;
    if(!E.perch)E.pos.y=groundY(E.pos.x,E.pos.z);E.H.root.rotation.y=angLerp(E.H.root.rotation.y,E.yaw,1-Math.exp(-dt*10));poseHuman(E.H,dt,speed,aim,speed>3.5);
  }}
// a trooper's shot: the threat level's chance to hit (20 / 40 / 60%), the torso, the squad-of-four damage (DMG.trooper)
function trooperShot(E,tg,d){const from=muzzle(E.H),to=_w.copy(tg.pos).add(_v.set(0,tg.player&&P.crouch?.95:1.3,0));
  const hit=rng()<DMG.hitChance()*(tg.E?.3:1),dmg=DMG.trooper('ar');   // Herald on Herald: a long, grinding fight, not a quick one
  if(!hit)to.add(_v.set(R(-1.6,1.6),R(-.6,1.2),R(-1.6,1.6)));
  const kind=E.team==='red'?'rrifle':E.team==='amber'?'arifle':'hrifle',col=E.team==='red'?0xff6a4a:E.team==='amber'?0xffc060:0xd8a0ff;
  boom(from,.4,E.team?col:HOLLOW_GLOW,.08);const tgt=tg,stop=wallBlocks(from,to);
  fire(from,(stop||to).clone(),110,kind,q=>{if(stop){hitWall(dmg,q);return;}boom(q,.7,col,.25);if(hit){if(tgt.player)hurtPlayer(dmg,E.pos,true);else if(tgt.A)hurtAlly(tgt.A,dmg);else if(tgt.E)hurtEnemy(tgt.E,dmg,'');}else puff(q,.5,.5);});}

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
  OBST.push({x,z,r:1.2,h:2.2});TURRETS.push(Tt);turretModel(Tt);return Tt;}
/* the mounted gun model (Bryce's, Oct 24) on every Hollow turret, Ledge, Ridge and Gate guns, the Pathfinder's wall and floor guns.
   It sits on the code base and turns and tilts with the head; the code head hides once it is on. Hollow colours: the gun's own blue
   lights are pushed toward the Host's purple. When the turret dies the lights go out with the rest. */
const turMats={};
function turretModel(Tt){MODELS.copy('turret').then(({scene:s})=>{
    MODELS.tame(s,.5);s.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(!turMats[m.uuid]){const c=m.clone();if(c.emissive&&(c.emissiveMap||c.emissive.getHex())){c.emissive=C(FLEET_PURPLE);c.emissiveIntensity=1.6;}
      c.color&&c.color.multiplyScalar(.82);turMats[m.uuid]=c;}o.material=turMats[m.uuid];});
    const {o}=MODELS.fit(s,{ry:Math.PI,size:3.4,axis:'z'});   // barrel toward -z, about 3.4 m long
    o.position.set(0,.15,-.35);Tt.head.children.forEach(c=>{c.visible=false;});Tt.head.add(o);Tt.model=o;
    if(Tt.dead)o.rotation.x=.3;}).catch(()=>{});}
function hurtTurret(Tt,dmg,p,how){if(Tt.dead)return;if(Tt.mech){MECH.hurt(Tt,dmg,p,how);return;}   // the Herald mech (js/shared/mech.js)
  Tt.hp-=dmg;boom(p,.9,how==='gun'?0xfff0d0:0xffc070,.2);
  if(how==='gun'){$('cross').classList.add('hit');clearTimeout(hurtEnemy.t);hurtEnemy.t=setTimeout(()=>$('cross').classList.remove('hit'),90);
    if(!Tt.warned&&dmg<1){Tt.warned=true;say('turret','Keeper Sergeant','Hollow turret ahead! Rifles won’t crack that plating. Breaker, or take the gunner!','alert');}}
  if(Tt.hp<=0){Tt.dead=true;const c=Tt.head.getWorldPosition(new THREE.Vector3());boom(c,6,0xfff0c0,.5);boom(c,10,0xff8a3a,1.2);boom(c,7,HOLLOW_GLOW,.9);
    if(typeof sfx!=='undefined')sfx.blast(c);Tt.head.rotation.x=.5;Tt.head.position.y=1.1;Tt.head.children.forEach(o=>{if(o.material===turGlow)o.visible=false;});if(Tt.model)Tt.model.traverse(o=>{if(o.isMesh&&o.material.emissive){o.material=o.material.clone();o.material.emissiveIntensity=0;}});
    if(Tt.gunner&&!Tt.gunner.H.dead)hurtEnemy(Tt.gunner,1e4,'');P.kills++;gainZeal(20);PG.kill(400,c,how);PG.prog('oturret');}}
function updateTurrets(dt){if(typeof MECH!=='undefined')MECH.update(dt);if(typeof VEH!=='undefined')VEH.update(dt);for(const Tt of TURRETS){if(Tt.mech)continue;
  if(Tt.dead){Tt.smoke-=dt;if(Tt.smoke<=0){Tt.smoke=.25;puff(Tt.head.getWorldPosition(_w).clone().add(_v.set(R(-.4,.4),.6,R(-.4,.4))),R(1,2),2.2);}continue;}
  const G=Tt.gunner,manned=G&&!G.H.dead;if(!manned)continue;
  // aim at you (or the nearest squadmate) when they are within reach and in sight
  const hp=Tt.head.getWorldPosition(_w).clone();let tg=null,bd=88;
  // (sight lines are checked a few times a second, not every frame: js/origin/03-play.js canSee)
  Tt.sT=(Tt.sT||0)-dt;if(Tt.sT<=0){Tt.sT=R(.2,.32);Tt.sel=null;let sd=88;
    if(P.alive&&P.input){const d=hp.distanceTo(P.pos);if(d<sd&&!blocked(hp,_v.copy(P.pos).setY(P.pos.y+1.3))){sd=d*.8;Tt.sel={pos:P.pos,player:true};}}
    for(const A of ALLIES){if(!A.on||A.H.dead||A.ride)continue;const d=hp.distanceTo(A.pos);if(d<sd&&!blocked(hp,_v.copy(A.pos).setY(A.pos.y+1.3))){sd=d;Tt.sel={pos:A.pos,A};}}}
  if(Tt.sel&&!(Tt.sel.A&&(Tt.sel.A.H.dead||!Tt.sel.A.on))&&!(Tt.sel.player&&!P.alive))tg=Tt.sel;
  if(!tg){Tt.head.rotation.y=angLerp(Tt.head.rotation.y,Tt.yaw+Math.sin(T*.4+Tt.x)*.5,1-Math.exp(-dt*1.5));continue;}
  const want=Math.atan2(-(tg.pos.x-Tt.x),-(tg.pos.z-Tt.z));Tt.head.rotation.y=angLerp(Tt.head.rotation.y,want,1-Math.exp(-dt*2.5));Tt.yaw=Tt.head.rotation.y;
  Tt.head.rotation.x=clamp(Math.atan2(tg.pos.y+1.2-hp.y,Math.hypot(tg.pos.x-hp.x,tg.pos.z-hp.z))*.7,-.5,.4);
  // Oct 25: one shot a second, 30 a hit, the threat level's chance to hit
  Tt.cool-=dt;if(Tt.cool<=0&&Math.abs(angLerp(Tt.head.rotation.y,want,1)-Tt.head.rotation.y)<.08){Tt.cool=1/DMG.EXTRA.turretRps;Tt.side=!Tt.side;
    {Tt.burst=Tt.side?1:2;
    const from=Tt.head.localToWorld(Tt.model?new THREE.Vector3(Tt.burst%2?.1:-.1,.15,-2.1):new THREE.Vector3(Tt.burst%2?.38:-.38,.05,-3)),to=tg.pos.clone().add(_v.set(0,1.2,0)),d=from.distanceTo(to);
    const hit=DMG.rolls(),dmg=DMG.EXTRA.turretDmg;if(!hit)to.add(_v.set(R(-2,2),R(-.4,1.6),R(-2,2)));
    boom(from,1.1,HOLLOW_GLOW,.12);const stop=wallBlocks(from,to),tgt=tg;
    fire(from,(stop||to).clone(),130,'heavy',q=>{if(stop){hitWall(dmg,q);return;}boom(q,1.6,0xd8a0ff,.35);puff(q,1,1);if(hit){if(tgt.player)hurtPlayer(dmg,Tt.g.position,true);else if(tgt.A)hurtAlly(tgt.A,dmg);}});}}}}

/* ---------- Empty Host dropships: fly in, set down, unload troopers, lift away ---------- */
const DROPS=[],DSG2=hostDropshipGeo(),dropMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.6}),dropGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)});
function launchDrop(land,n,delay){const g=new THREE.Group();g.add(new THREE.Mesh(DSG2.geo,dropMat),new THREE.Mesh(DSG2.glow,dropGlow));g.scale.setScalar(.38);g.children[0].castShadow=true;
  const from=new THREE.Vector3(land.x+R(-60,60),90,land.z-260);g.position.copy(from);g.visible=!delay;scene.add(g);
  const D={g,from,land:land.clone().setY(groundY(land.x,land.z)+3),t:-(delay||0),state:'in',hp:DMG.CLASS.dropship.hp,max:DMG.CLASS.dropship.hp,dead:false,unloaded:false,n:n||4,gone:false};DROPS.push(D);if(typeof sfx!=='undefined'&&!delay)sfx.horn(D.land);return D;}
function hurtDrop(D,dmg,p){if(D.dead)return;D.hp-=dmg;boom(p,1.2,0xfff1c8,.25);if(D.hp<=0){D.dead=true;D.t=0;boom(D.g.position,14,0xfff0c0,.6);boom(D.g.position,20,0xff6a1a,1.4);
  if(typeof sfx!=='undefined')sfx.blast(D.g.position);gainZeal(25);PG.kill(600,D.g.position,'gun');PG.prog('odrops');}}
let dropSid=0;
function updateDrops(dt){for(let i=DROPS.length-1;i>=0;i--){const D=DROPS[i];D.t+=dt;const g=D.g;
  if(D.t<0)continue;if(!g.visible){g.visible=true;if(typeof sfx!=='undefined')sfx.horn(D.land);}
  if(!D.dead&&typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.dropship',D.sid||(D.sid=++dropSid),g.position,D.state==='down'?.7:1,D.state==='in'?1:D.state==='down'?.85:1.1);   // its engines
  if(D.dead){g.position.y-=dt*14;g.rotation.z+=dt*.8;if(rng()<dt*14)boom(g.position.clone().add(_v.set(R(-4,4),0,R(-4,4))),R(3,6),0xff7a1a,.7);
    if(g.position.y<groundY(g.position.x,g.position.z)+1){blast(g.position.clone(),10,6,true);scene.remove(g);DROPS.splice(i,1);}continue;}
  if(D.state==='in'){const u=Math.min(1,D.t/7),e=1-(1-u)*(1-u);g.position.lerpVectors(D.from,D.land,e);g.lookAt(D.land.x,g.position.y,D.land.z+(D.land.z>D.from.z?40:-40));
    if(u>=1){D.state='down';D.t=0;}}
  else if(D.state==='down'){if(!D.unloaded&&D.t>1){D.unloaded=true;for(let k=0;k<D.n;k++){const a=k/D.n*Math.PI*2;spawnTrooper(D.land.x+Math.cos(a)*5,D.land.z+Math.sin(a)*5,{hold:R(10,18)});}}
    if(D.t>4){D.state='out';D.t=0;}}
  else{g.position.y+=dt*(8+D.t*6);g.position.z-=dt*D.t*10;if(D.t>9){scene.remove(g);DROPS.splice(i,1);}}}}

/* ---------- the Keeper squad: marines and robots; engineers and colonists at the ships ---------- */
const ALLIES=[];
const ALLY_TINT={};   // (Oct 25: the Keeper marines wear the keeper-footsoldier model untinted, so its paint shows)
function addAlly(style,x,z,name,kind){const H=makeHuman(style);scene.add(H.root);const A={H,pos:H.root.position,style,name,yaw:0,goal:null,on:true,cool:R(.5,1.5),burst:0,bt:0,hits:0,
  armed:style==='marine',work:false,target:null,retarget:0,side:ALLIES.length%2?1:-1,hp:DMG.CLASS.ally.hp,lastHit:-99,downT:0};A.pos.set(x,groundY(x,z),z);ALLIES.push(A);
  // colonists and civilians keep their code-built look while they run (the civilian model's legs are fused; it's used standing, on the command deck)
  let k=kind||(style==='engineer'?'engineer':style==='marine'?'marine':null);if(k==='marine')k='keeper-footsoldier';
  if(k)MODELS.dress(H,k,{tint:style==='colonist'?0xe6cfe0:ALLY_TINT[k],unarmed:!A.armed&&k!=='engineer'});return A;}
/* squadmates can be hurt now: they go down at zero, and get back up on their own after a while (faster if you stand over them) */
const ALLY_DOWN=14;
function hurtAlly(A,dmg){A.hits++;hitHuman(A.H);if(A.H.dead||!A.on)return;A.lastHit=T;A.hp-=dmg*(OD.allyDmg||1);
  if(A.hp<=0){A.hp=0;killHuman(A.H);A.downT=ALLY_DOWN;A.target=null;
    // said once per squadmate (it used to repeat every time anyone went down), and never twice within twenty seconds
    if(typeof PG!=='undefined'&&PG.say&&!A.engine&&!A.downSaid&&T-(hurtAlly.said||-99)>20){A.downSaid=true;hurtAlly.said=T;PG.say('Keeper Sergeant',(A.name&&!/^Keeper$|^Colonist$|^Civilian$/.test(A.name)?A.name:'One of ours')+' is down! Someone get to them!','alert');}}}
function reviveAlly(A,hp){if(!A.H.dead)return;reviveHuman(A.H);A.hp=hp||60;A.downT=0;A.lastHit=T;}
function reviveAllies(){for(const A of ALLIES)reviveAlly(A,100);}
function updateAllies(dt){
  separate(ALLIES.filter(A=>!A.ride),.55);
  for(const A of ALLIES){if(!A.on){A.H.root.visible=false;continue;}A.H.root.visible=true;
    if(A.H.dead){poseHuman(A.H,dt,0,0);const near=P.alive&&P.pos.distanceTo(A.pos)<2.6;A.downT-=dt*(near?5:1);
      if(near&&A.downT>0)banner('Reviving '+(A.name||'squadmate'));if(A.downT<=0)reviveAlly(A,60);continue;}
    if(T-A.lastHit>5&&A.hp<100)A.hp=Math.min(100,A.hp+dt*6);
    let speed=0,aim=0;
    if(A.goal&&!A.ride){const dx=A.goal.x-A.pos.x,dz=A.goal.z-A.pos.z,d=Math.hypot(dx,dz);
      if(d>1.2){navToward(A.pos.x,A.pos.z,A.goal.x,A.goal.z,_w);const L=_w.length()||1;_w.multiplyScalar(1/L);steer(A.pos,_w,.45,A.side);unstick(A,dt,true,_w);
        const run=d>8;speed=run?5.6:2.8;moveBody(A.pos,_w.x*speed*dt,_w.z*speed*dt,.45);keepIn(A.pos);A.yaw=Math.atan2(-_w.x,-_w.z);
        // still caught on a rock after a few seconds of trying, and out of your sight line: step them clear, a few metres behind you
        A.jamT=(A.jamT||0)+dt;if(!A.jamP)A.jamP=A.pos.clone();if(A.jamT>3){const moved=A.pos.distanceTo(A.jamP);A.jamT=0;A.jamP.copy(A.pos);
          if(moved<1.2&&d>6&&P.alive){A.jams=(A.jams||0)+1;if(A.jams>=2){A.jams=0;for(let k=0;k<12;k++){const a=P.yaw+Math.PI+R(-.9,.9),r=R(3,6),x=P.pos.x-Math.sin(a)*r,z=P.pos.z-Math.cos(a)*r;
            if(playD(x,z)<-1&&!OBST.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+.6)){A.pos.set(x,groundY(x,z),z);break;}}}}else A.jams=0;}}else{A.stT=0;A.jamT=0;}}
    // squadmates fight: the nearest trooper they can SEE (Oct 25: they used to shoot the nearest one through walls), or a dropship
    // coming in over the pad (Host near a ship first)
    if(A.armed){A.retarget-=dt;if(A.retarget<=0){A.retarget=R(.5,1.1);let b=null;const eye=_u.copy(A.pos).setY(A.pos.y+1.5),cand=[];
        for(const E of ENEMIES){if(E.H.dead||E.pos.x<-1600||E.warm)continue;let d=E.pos.distanceTo(A.pos);if(typeof SHIPS!=='undefined'&&SHIPS.some(S=>Math.hypot(E.pos.x-S.x,E.pos.z-S.z)<18))d*=.5;if(d<75)cand.push([d,E]);}
        cand.sort((p,q)=>p[0]-q[0]);for(let k=0;k<Math.min(5,cand.length);k++){const E=cand[k][1];if(!blocked(eye,_w.copy(E.pos).setY(E.pos.y+1.4))){b=E;break;}}
        if(!b&&typeof DROPS!=='undefined'){let bd=90;for(const D of DROPS){if(D.dead||!D.g.visible)continue;const d=D.g.position.distanceTo(A.pos);if(d<bd&&!blocked(eye,D.g.position)){bd=d;b={drop:D,pos:D.g.position,H:{dead:false}};}}}
        A.target=b;}
      const E=A.target;if(E&&!E.H.dead&&!(E.drop&&E.drop.dead)){aim=1;if(speed<3)A.yaw=Math.atan2(-(E.pos.x-A.pos.x),-(E.pos.z-A.pos.z));
        A.cool-=dt;if(A.cool<=0){A.cool=R(.6,1.2);
          if(canSee(A,_u.copy(A.pos).setY(A.pos.y+1.5),_w.copy(E.pos).setY(E.pos.y+(E.drop?0:1.4)),E,1)){A.burst=4;A.bt=0;}else{A.retarget=0;A.target=null;}}
        if(A.burst>0){A.bt-=dt;if(A.bt<=0){A.bt=.13;A.burst--;const from=muzzle(A.H),d=A.pos.distanceTo(E.pos),hit=rng()<(E.drop?.5:.38)*clamp(1-d/80,.25,1),to=E.pos.clone().add(_v.set(0,E.drop?0:1.4,0));
          if(!hit)to.add(_v.set(R(-1.5,1.5),R(-.5,1),R(-1.5,1.5)));const tE=E;fire(from,to,150,'krifle',q=>{boom(q,.5,0xbfe8ff,.2);if(hit){if(tE.drop)hurtDrop(tE.drop,.5*DROP_K,q);else hurtEnemy(tE,DMG.LEGACY,'');}});}}}}
    // squadmates crouch when they stop with an enemy in sight
    A.H.crouchTo=A.armed&&aim&&speed<.5&&A.burst===0?.6:0;
    if(A.ride&&typeof VEH!=='undefined'){VEH.seatAlly(A,dt,aim);continue;}   // riding in the rover (js/shared/vehicles.js)
    A.pos.y=groundY(A.pos.x,A.pos.z);A.H.root.rotation.y=angLerp(A.H.root.rotation.y,A.yaw,1-Math.exp(-dt*8));poseHuman(A.H,dt,speed,A.work?0:aim,speed>4);
    if(A.work){A.H.arms[0].sh.rotation.x=-.9+Math.sin(T*6)*.25;A.H.arms[1].sh.rotation.x=-.7+Math.cos(T*5)*.2;A.H.torso.rotation.x=.25;}
  }}
function angLerp(a,b,k){let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*k;}

/* ---------- your movement ---------- */
function stepPlayer(dt){
  const H=P.H;
  if(!P.alive){P.respawnT-=dt;poseHuman(H,dt,0,0);if(P.respawnT<=0)playerUp();return;}
  if(inVeh()){P.ads=0;P.run=false;P.cool-=dt;P.nadeCD=Math.max(0,P.nadeCD-dt);VEH.drive(dt);if(!fireHeld)P.trigger=false;return;}
  let f=0,s=0;
  if(P.input){if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD||keys.ArrowRight)s+=1;if(keys.KeyA||keys.ArrowLeft)s-=1;f+=joy.y;s+=joy.x;}
  const L=Math.hypot(f,s);if(L>1){f/=L;s/=L;}
  const crouched=P.crouch&&P.alive;
  P.run=P.input&&!crouched&&P.ads<.3&&(keys.ShiftLeft||keys.ShiftRight||Math.hypot(joy.x,joy.y)>.95)&&f>.3;
  if(P.run)P.crouch=false;
  const sp=(P.run?7.2:crouched?2.3:P.ads>.5?2.9:fireHeld?3.4:4.6)*(P.blessT>0?1.22:1),fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
  moveBody(P.pos,(fx*f+rx*s)*sp*dt,(fz*f+rz*s)*sp*dt,.45);
  const gy=groundY(P.pos.x,P.pos.z);
  P.vy-=16*dt;P.pos.y+=P.vy*dt;if(P.pos.y<gy){P.pos.y=gy;P.vy=0;}
  P.moving=L*sp;
  // aiming down the sights eases in and out
  const G=GUNS[P.gun];P.ads+=((P.adsHeld&&P.input&&P.alive?1:0)-P.ads)*(1-Math.exp(-dt*12));
  H.crouchTo=crouched?1:0;H.reload=P.reloadT>0?1-P.reloadT/P.reloadMax:0;
  H.root.rotation.y=P.yaw;H.aimPitch=P.pitch;poseHuman(H,dt,P.moving,P.run?.25:1,P.run);
  // the shield comes back 5 s after the latest hit, empty to full in 8 (twice as fast in Zeal); HP only from medical packs.
  // a blessing: the shield starts back after 1.2 s at 1.8× the rate, and HP mends slowly while it lasts
  if(P.blessT>0){if(T-P.lastHit>1.2&&P.shield<P.maxShield)P.shield=Math.min(P.maxShield,P.shield+P.maxShield/DMG.REGEN.player.fill*1.8*dt*(P.zealT>0?DMG.EXTRA.zeal:1));if(P.hp>0)P.hp=Math.min(P.maxHp,P.hp+dt*6);}
  else DMG.tick(P,dt,T,P.zealT>0?DMG.EXTRA.zeal:1);
  P.cool-=dt;P.nadeCD=Math.max(0,P.nadeCD-dt);P.switchT=Math.max(0,P.switchT-dt);
  if(P.reloadT>0){P.reloadT-=dt;if(P.reloadT<=0){const A=P.ammo[P.gun],take=Math.min(G.mag-A.mag,A.res);A.mag+=take;if(!G.inf)A.res-=take;P.reloadT=0;}}
  if(fireHeld&&P.cool<=0&&P.input&&(G.auto||P.trigger)){P.trigger=false;playerShoot();}
  if(!fireHeld)P.trigger=false;
}
/* ---------- first person (Oct 21): the camera sits in Michael's helmet. His body is drawn on layer 1, which the camera skips
   while you play (cutscenes still show him); what you see of yourself is the viewmodel: a Keeper's code-built arms (the same arms
   the pilots have, which bend cleanly) holding the rifle, on layer 2, riding the camera at half size so it never pokes into walls. ---------- */
camera.near=.05;camera.updateProjectionMatrix();scene.add(camera);
const VM=makeHuman('fparms'),vmRoot=new THREE.Group(),VMK=.5;
vmRoot.add(VM.root);camera.add(vmRoot);VM.root.scale.setScalar(VMK);
// only the arms and the gun: everything else of the viewmodel person is hidden
{const keep=new Set();for(const a of VM.arms)for(const o of[a.sh,a.el])o.children.forEach(c=>{if(!c.isGroup||c.children.some(m=>m.isMesh))keep.add(c);});
 for(const o of[VM.hip,VM.torso,VM.head,...VM.legs.flatMap(l=>[l.hp,l.kn])])o.children.forEach(c=>{if(c.isGroup&&c.children.length&&c.children.every(m=>m.isMesh)&&!keep.has(c))c.visible=false;});}
// the arms about two thirds as thick as a squadmate's, so they frame the rifle instead of filling the screen
for(const A of VM.arms)for(const o of[A.sh,A.el])o.children.forEach(c=>{if(c.isGroup&&c.children.length&&c.children.every(m=>m.isMesh))c.scale.set(.68,1,.68);});
const vmLayer=o=>o.traverse(c=>{c.layers.set(2);c.castShadow=false;});vmLayer(VM.root);
// the rifle model replaces the code rifle as soon as it is in (the code one is there from the start)
// (the fore hand holds the rifle closer in than a squadmate does: half-size arms at the camera can't reach the far grip)
const vmGrip=o=>{o.userData.grip.L.set(0,-.07,-.02);return o;};vmGrip(VM.gunObj);
/* the Armory (Oct 24): each weapon slot carries the gun model bought and equipped on the menu (PG.arms): the Pulse rifle the 'rifle' slot's,
   the Lance the 'lance' slot's (standard issue: Bryce's sniper), the Breaker its launcher, the sidearm the 'side' slot's skin.
   The viewmodel and Michael's own body each get their own copy; a switch swaps the model while the gun is dipped out of view, so it
   never pops. A missing file keeps the standard rifle. */
const ARM_SLOTS=['rifle','lance','breaker','side'],ARMS={vm:ARM_SLOTS.map(()=>null),body:ARM_SLOTS.map(()=>null)};
const armSlot=()=>P.gun;
ARM_SLOTS.forEach((slot,i)=>{
  MODELS.slotGun(slot).catch(()=>MODELS.rifleObj()).then(o=>{ARMS.vm[i]=o.userData.gunId?o:vmGrip(o);}).catch(()=>{});
  MODELS.slotGun(slot).catch(()=>MODELS.rifleObj()).then(o=>{ARMS.body[i]=o;}).catch(()=>{});});
// (the fore hand pulled in: the half-size arms reach about half way from the trigger hand to a squadmate's fore grip)
// (with the arm models in, Oct 24, the forearms are longer, so the fore hand reaches further: VM_ARM.reach)
function vmGripFor(o){const g=o.userData.grip;if(!g._vm){g.L.lerpVectors(g.R,g.L,o.userData.gunId?VM_ARM.reach:1).setY(Math.min(g.L.y,g.R.y+.01));g._vm=true;}return o;}
function armsSync(lowered){const i=armSlot();
  const v=ARMS.vm[i];if(v&&VM.gunObj!==v&&(lowered||!VM._armed)){gunRig(VM,vmGripFor(v),VM.fpHand?{handPt:VM.fpHand}:{});vmLayer(VM.root);VM._armed=true;}
  const b=ARMS.body[i];if(b&&P.H.gunObj&&P.H.gunObj!==b&&P.H.handPt&&(lowered||!P.H._armed||!FP.on)){gunRig(P.H,b,{handPt:P.H.handPt});P.H._armed=true;}}
/* the arms you see (Oct 24, Bryce's FPS arms: grey sleeves, black leather gloves; models/fp-arms.glb). Two rigid forearms, baked so the
   grip point inside the curled hand is at the origin and the elbow at +y = 1 (palm-top toward -z): each rides its viewmodel forearm with
   the grip where the code fist was, so the arm IK above keeps putting the hands on whatever gun is held, and the reload still drops the
   left hand to the belt. The model's forearm is longer than the code one (len), so the fore hand reaches further along the gun (reach:
   how far from the trigger hand toward the gun's fore grip). roll turns each hand about its forearm (left palm up under the guard).
   lift: the cloth and leather are dark, so they glow faintly from their own texture and still read against a dark street. */
const VM_ARM={len:.42,reach:.75,roll:[1.6,0],lift:.35};
MODELS.copy('fp-arms').then(({scene:s})=>{MODELS.tame(s,.4);
  s.traverse(o=>{if(o.isMesh&&o.material&&o.material.map&&!o.material._lift){const m=o.material;m.emissive=new THREE.Color(1,1,1);m.emissiveMap=m.map;m.emissiveIntensity=VM_ARM.lift;m._lift=true;m.needsUpdate=true;}});
  VM.fpHand=[new THREE.Vector3(0,-VM_ARM.len,0),new THREE.Vector3(0,-VM_ARM.len,0)];VM.handPt=VM.fpHand;
  ['armL','armR'].forEach((n,i)=>{const src=s.getObjectByName(n);if(!src)return;
    const w=new THREE.Group(),a=src.clone(true);w.add(a);a.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=false;o.userData.keep=true;}});
    w.userData.keep=true;w.position.copy(VM.fpHand[i]);w.scale.setScalar(VM_ARM.len);w.rotation.y=VM_ARM.roll[i];
    const A=VM.arms[i];for(const o of[A.sh,A.el])o.children.forEach(c=>{if(c.isGroup&&c.children.length&&c.children.every(m=>m.isMesh)&&!c.userData.keep)c.visible=false;});
    A.el.add(w);A.fpArm=w;});
  vmLayer(VM.root);}).catch(e=>console.warn('fp arms',e&&e.message));
// eye in the viewmodel person's frame (head height, a little forward): the person is placed so this point sits on the camera
const VM_EYE=new THREE.Vector3(0,1.79,-.1);
const FP={on:false,bob:0,kick:0,swayX:0,swayY:0,lastYaw:0,lastPitch:0,run:0,swap:0};
camera.layers.enable(2);
function fpLayers(on){
  // the body: layer 1 only, so the camera can skip it (it follows Michael's model when that arrives)
  P.H.root.traverse(o=>{if(o.layers.mask!==2)o.layers.set(1);});
  if(on){camera.layers.disable(1);camera.layers.enable(2);}else{camera.layers.enable(1);camera.layers.disable(2);}}
/* ---------- first or third person: a setting (Settings on the menu, the pause menu, or V on a PC), shared by every ground chapter ---------- */
let VIEW='first';try{VIEW=localStorage.getItem('elyra.view')==='third'?'third':'first';}catch(_){}
window.ELYRA_VIEW={get:()=>VIEW,set(v){VIEW=v==='third'?'third':'first';try{localStorage.setItem('elyra.view',VIEW);}catch(_){}
  if(VIEW==='third'){VM.root.visible=false;}P.H.root.visible=true;if(typeof banner==='function')banner(VIEW==='third'?'Third person':'First person');},toggle(){this.set(VIEW==='third'?'first':'third');}};
addEventListener('keydown',e=>{if(e.code==='KeyV'&&!e.repeat&&P.input&&!(typeof PG!=='undefined'&&PG.paused))window.ELYRA_VIEW.toggle();});
// third person: over the right shoulder, closer while aiming, through the scope with the Lance
const CAM={dist:4.3,side:1.15,up:.45};
function placeCamera3(G,a,scoped){FP.on=false;
  camera.fov=62/(1+(G.zoom-1)*a);camera.updateProjectionMatrix();
  const cp=Math.cos(P.pitch),sp=Math.sin(P.pitch),fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
  const crH=P.H.crouch||0,head=_v.copy(P.pos).add(_w.set(0,1.62-crH*.62,0));
  if(scoped)camera.position.set(head.x+fx*.3,head.y+.12,head.z+fz*.3);
  else{const dist=CAM.dist*(1-a*.48),side=CAM.side*(1-a*.25);camera.position.set(head.x-fx*dist*cp+rx*side,head.y+CAM.up-sp*dist,head.z-fz*dist*cp+rz*side);}
  // below the Hollow: pull the camera in toward Michael until it is inside the tunnel, and under its roof
  if(P.pos.x<-1600){const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;let k=1;
    while(k>.15&&belowD(head.x+(cx-head.x)*k,head.z+(cz-head.z)*k)>-1.1)k-=.08;camera.position.set(head.x+(cx-head.x)*k,head.y+(cy-head.y)*k,head.z+(cz-head.z)*k);
    camera.position.y=Math.min(camera.position.y,belowFloor(camera.position.x,camera.position.z)+7.5);}
  if(typeof camClamp==='function')camClamp(head);
  if(RECTS.length){const c0=camera.position.clone();let k=1;while(k>.12&&RECTS.some(Rb=>rectHit(Rb,head,camera.position)>=0)){k-=.08;camera.position.lerpVectors(head,c0,k);}}
  const g=groundY(camera.position.x,camera.position.z)+.4;if(camera.position.y<g)camera.position.y=g;
  for(const o of OBST){if(o.h<2)continue;const dx=camera.position.x-o.x,dz=camera.position.z-o.z,d=Math.hypot(dx,dz),m=o.r+.25;if(d<m&&d>1e-3&&camera.position.y<groundY(o.x,o.z)+o.h){camera.position.x=o.x+dx/d*m;camera.position.z=o.z+dz/d*m;}}
  camera.rotation.order='YXZ';camera.rotation.set(P.pitch,P.yaw,0);
  armsSync(P.switchT>.12);
  VM.root.visible=false;fpLayers(false);P.H.root.visible=!scoped;$('scope').classList.toggle('on',!!scoped);}
function placeCamera(){
  if(inVeh()){VEH.camera();return;}
  const G=GUNS[P.gun],a=P.ads,scoped=G.scope&&a>.85&&P.alive;
  if(VIEW==='third'){placeCamera3(G,a,scoped);return;}
  FP.on=true;P.H.root.visible=true;
  camera.fov=62/(1+(G.zoom-1)*a);camera.updateProjectionMatrix();
  const crH=P.H.crouch||0,eye=P.alive?1.68-crH*.62:.5;
  // a soft head bob from your stride (none while aiming)
  const sp=P.moving;FP.bob+=sp*.016*Math.PI*(P.run?1.15:1);const bobK=reduceMotion?0:Math.min(1,sp/4.6)*(1-a*.85);
  const by=Math.abs(Math.sin(FP.bob))*.045*bobK*(P.run?1.6:1),bx=Math.sin(FP.bob)*.03*bobK*(P.run?1.5:1);
  camera.position.set(P.pos.x+Math.cos(P.yaw)*bx,P.pos.y+eye+by,P.pos.z-Math.sin(P.yaw)*bx);
  // below the Hollow: under the tunnel's roof
  if(P.pos.x<-1600)camera.position.y=Math.min(camera.position.y,belowFloor(camera.position.x,camera.position.z)+7.5);
  if(typeof camClamp==='function')camClamp(_v.set(P.pos.x,P.pos.y+eye,P.pos.z));   // maps with walls and roofs keep the camera inside them
  const g=groundY(camera.position.x,camera.position.z)+.3;if(camera.position.y<g)camera.position.y=g;
  camera.rotation.order='YXZ';camera.rotation.set(P.pitch,P.yaw,P.alive?0:.5);
  placeViewmodel(scoped);fpLayers(true);
  $('scope').classList.toggle('on',!!scoped);}
const _vmT=new THREE.Vector3();
function placeViewmodel(scoped){
  const dt=1/60,G=GUNS[P.gun],a=P.ads;
  VM.root.visible=P.alive&&!scoped;
  // the arms copy your state: reload, crouch makes no difference here, a flinch when hit
  VM.reload=P.H.reload;VM.hitT=P.H.hitT;VM.aimPitch=0;
  FP.run+=((P.run?1:0)-FP.run)*.12;
  poseHuman(VM,dt,0,1-FP.run*.75,P.run);
  // lag behind fast turns (sway), bob with the stride, kick back when you fire, dip while switching
  const dy=((P.yaw-FP.lastYaw+Math.PI*3)%(Math.PI*2))-Math.PI,dp=P.pitch-FP.lastPitch;FP.lastYaw=P.yaw;FP.lastPitch=P.pitch;
  FP.swayX+=(clamp(dy*2.2,-.08,.08)-FP.swayX)*.15;FP.swayY+=(clamp(-dp*2.2,-.06,.06)-FP.swayY)*.15;
  FP.kick*=.8;FP.swap=Math.max(0,P.switchT/.35);
  armsSync(FP.swap>.55||P.switchT===0&&VM._armSlot!==armSlot());VM._armSlot=armSlot();
  const k=reduceMotion?0:1,bobK=Math.min(1,P.moving/4.6)*(1-a*.9)*k;
  const bx=Math.cos(FP.bob)*.012*bobK*(P.run?2:1),by=-Math.abs(Math.sin(FP.bob))*.012*bobK*(P.run?2:1);
  // aiming down the sights: slide the rifle in so its sight sits under the crosshair
  _vmT.copy(VM_EYE).multiplyScalar(-VMK);
  // (raised and pushed forward from the true shoulder, so the hands are in view the way a shooter sees them)
  vmRoot.position.set(_vmT.x+(-.09*a)+FP.swayX*(1-a)+bx,_vmT.y+.005-.0*a+FP.swayY*(1-a)+by-FP.swap*.25-FP.run*.04,_vmT.z-.1-.03*a+FP.kick*.06);
  vmRoot.rotation.set(FP.kick*.08-FP.swap*.4,FP.swayX*.6*(1-a),FP.run*.12+FP.swayX*.4*(1-a));
}
/* ---------- HUD: the strip at the top (HP, shield, Zeal), the weapon panel, gear cooldowns, the crosshair ---------- */
SHUD.update({zeal:0,sub:false,hullLabel:'HP'});
let bannerT=0;function banner(t,cls){const b=$('banner');b.textContent=t;b.className='hud banner'+(cls?' '+cls:'');bannerT=4;}
function cdStyle(el,left,total){el.style.setProperty('--cd',(total?clamp(left/total,0,1):0)*100+'%');el.classList.toggle('cool',left>0);}
let hudT=0;
function updateHud(dt){bannerT-=dt;if(bannerT<=0)$('banner').classList.add('quiet');
  const arm=P.alive&&P.input;
  hudT+=dt;if(hudT>.08){hudT=0;
    const Vh=inVeh()?VEH.cur:null;
    SHUD.update({shield:Vh?Vh.hp/Vh.max*100:P.shield/P.maxShield*100,hull:Vh?Vh.hp/Vh.max*100:P.hp/P.maxHp*100,hullLabel:Vh?Vh.label:'HP',down:!P.alive,zeal:P.zealT>0?P.zealT/ZEAL_T*100:P.zeal,zealText:P.zealT>0?'burning':P.zeal>=100?(coarse?'ready':'ready · Z'):'charging',zealReady:P.zeal>=100&&P.zealT<=0});
    const G=GUNS[P.gun],A=P.ammo[P.gun];
    if(Vh){$('wName').textContent=Vh.gunName;$('wMag').textContent=Vh.kind==='rover'?(Vh.over>0?'HOT':Math.round(Vh.heat*100)+'%'):(Vh.cannon>0?Math.ceil(Vh.cannon)+'s':'RDY');$('wRes').textContent=Vh.kind==='rover'?'heat':'cannons';}
    else{$('wName').textContent=G.name.toUpperCase();$('wMag').textContent=P.reloadT>0?'··':A.mag;$('wRes').textContent=G.inf?'∞':A.res;}
    $('wMag').classList.toggle('low',A.mag<=Math.ceil(G.mag*.2));$('wpanel').classList.toggle('reloading',P.reloadT>0);
    document.querySelectorAll('#wslots i').forEach((el,i)=>{el.classList.toggle('on',i===P.gun);el.classList.toggle('empty',P.ammo[i].mag+P.ammo[i].res<=0);});
    cdStyle($('gShield'),P.wallCD,WALL_CD);cdStyle($('gSentry'),P.sentryCD,SENTRY_CD);cdStyle($('gNade'),P.nadeCD,5);
    $('gZeal').classList.toggle('ready',P.zeal>=100&&P.zealT<=0);$('gZeal').style.setProperty('--cd',(100-(P.zealT>0?P.zealT/ZEAL_T*100:P.zeal))+'%');
    if(coarse){const gb=$('shld');gb.style.setProperty('--rs',P.wallCD>0?.15:1);gb.style.setProperty('--rt',P.sentryCD>0?.15:1);gb.classList.toggle('cool',P.wallCD>0&&P.sentryCD>0);
      $('gearLab').textContent=P.wallCD>0&&P.sentryCD<=0?'SNTRY':P.sentryCD>0&&P.wallCD<=0?'SHLD':'GEAR';cdStyle($('nade'),P.nadeCD,5);
      $('crch').classList.toggle('lit',!!P.crouch);
      $('rldN').textContent=P.reloadT>0?'··':A.mag;$('rld').classList.toggle('low',A.mag<=Math.ceil(G.mag*.2)&&P.reloadT<=0);$('rld').classList.toggle('lit',P.reloadT>0);}}
  const iv=inVeh();for(const id of['fire','nade','rld','wpn','shld','jump','crch'])$(id).hidden=!coarse||!arm||(iv&&id!=='fire'&&!(id==='nade'&&VEH.cur.kind==='walker'));$('ads').hidden=true;
  $('cross').hidden=!arm||($('scope').classList.contains('on'));$('cross').classList.toggle('ads',P.ads>.5);
  $('gear').hidden=!arm||iv;
  $('use').hidden=!coarse||!(onUse||(typeof VEH!=='undefined'&&VEH.canUse()))||!arm;}
function updateDust(){const a=dustG.attributes.position.array;for(let i=0;i<DUST_N;i++){let x=a[i*3],z=a[i*3+2];
  if(x-camera.position.x>80)x-=160;if(camera.position.x-x>80)x+=160;if(z-camera.position.z>80)z-=160;if(camera.position.z-z>80)z+=160;a[i*3]=x+.02;a[i*3+2]=z;}dustG.attributes.position.needsUpdate=true;}

/* ---------- the loading screen's warm-up stand-ins (Oct 25, Bryce: lag spikes when ships, mechs and fights start) ----------
   Troopers, each Herald side, the Hollow turret and the bolts only exist once a fight starts, so their shaders were compiled and their
   textures uploaded in the middle of it. One of each now stands far under the ground from the start: the loading screen's warm-up
   frame draws them (it shows every hidden thing once), and they are taken away the moment Begin is pressed. A map lists the sides it
   uses in window.WARM_TEAMS (null: the Empty Host) and sets window.WARM_TURRET when it has Hollow turrets. */
const WARMS=[];
{const teams=window.WARM_TEAMS||[null],y=-60;
 // (Oct 25: one of every unit model on that side, now that each side has several: the Host's foot soldier, heavy and commander, the Heralds' six)
 teams.forEach((t,i)=>{(t?['footsoldier','heavy','engineer','sniper','commander','general']:['footsoldier','heavy','commander']).forEach((u,j)=>{const o={warm:true,perch:true,hold:999,unit:u};if(t)o.team=t;const E=spawnTrooper(LZ.x+i*2,LZ.z+j*2,o);if(E){E.pos.y=y;E.H.root.position.y=y;}});});
 if(window.WARM_TURRET){const Tt={head:new THREE.Group(),dead:false};Tt.head.position.set(LZ.x,y,LZ.z+4);scene.add(Tt.head);turretModel(Tt);WARMS.push(Tt.head);}
 // one rocket and one grenade, for their materials
 {const r=new THREE.Mesh(rocketGeo,rocketMat),n=new THREE.Mesh(nadeGeo,nadeMat);r.position.set(LZ.x,y,LZ.z);n.position.set(LZ.x,y,LZ.z);scene.add(r,n);WARMS.push(r,n);}}
addEventListener('elyra-begin',()=>{for(let i=ENEMIES.length-1;i>=0;i--)if(ENEMIES[i].warm){scene.remove(ENEMIES[i].H.root);ENEMIES.splice(i,1);}
  for(const o of WARMS)if(o.parent)o.parent.remove(o);WARMS.length=0;if(typeof MECH!=='undefined'&&MECH.unwarm)MECH.unwarm();});
