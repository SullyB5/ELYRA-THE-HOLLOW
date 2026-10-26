/* Tide City · player */
/* ---------- street level: a free spot on the core's north edge, and walkable ground ---------- */
function groundAt(x,z){
  if(Math.hypot(x-PORT.x,z-PORT.z)<PORT.r*.97)return PORT.top;
  for(const P of PLATS)if(Math.hypot(x-P.x,z-P.z)<P.r*.95)return 3;
  return null;
}
function blockedAt(x,z){for(const T of towers){const r=T.fp*(T.kind==='box'?.68:.52)+1.2,dx=x-T.x,dz=z-T.z;if(dx*dx+dz*dz<r*r)return true;}for(const L of lows){const r=L.rad*.78+1,dx=x-L.x,dz=z-L.z;if(dx*dx+dz*dz<r*r)return true;}return false;}
const streetSpot=(()=>{let best=null,bs=-1;for(let k=0;k<400;k++){const a=-Math.PI/2+R(-.7,.7),r=R(PLATS[0].r*.55,PLATS[0].r*.9),x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(groundAt(x,z)===null||!freeOf(x,z,8))continue;let m=1e9;for(const T of towers){const d=Math.hypot(x-T.x,z-T.z)-T.fp*.7;if(d<m)m=d;}if(m>bs){bs=m;best={x,z};}}return best||{x:0,z:-PLATS[0].r*.8};})();
let walkMode=false;
/* ---------- player flight ---------- */
const player=new THREE.Vector3(0,40,3700);
let yaw=0,pitch=.07,glide=0,vert=0,walkBob=0;
const FORM_T=5.5,FORM_EASE=2,FORM_OFF=new THREE.Vector3(1900,650,-1300),_form=new THREE.Vector3(),_formV=new THREE.Vector3();   // off the Vigil's wing
const vel=new THREE.Vector3(),keys={},joy={x:0,y:0,bx:0,by:0};

addEventListener('keydown',e=>{keys[e.code]=true;if(/^(Arrow|Space)/.test(e.code))e.preventDefault();dismissHint();});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;vert=0;});

const cv=renderer.domElement,ptrs=new Map(),joyEl=$('joy'),knob=$('knob');
let joyId=null,lookId=null;
cv.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button===2)return;
  try{cv.setPointerCapture(e.pointerId);}catch(_){}
  dismissHint();
  if(e.pointerType==='touch'&&joyId===null&&e.clientX<innerWidth*.45){
    joyId=e.pointerId;joy.bx=e.clientX;joy.by=e.clientY;joyEl.style.left=e.clientX+'px';joyEl.style.top=e.clientY+'px';knob.style.transform='';joyEl.hidden=false;
  }else if(lookId===null&&e.pointerType!=='mouse')lookId=e.pointerId;
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
});
cv.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;
  const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(e.pointerId===joyId){let jx=e.clientX-joy.bx,jy=e.clientY-joy.by;const L=Math.hypot(jx,jy),mx=52;if(L>mx){jx*=mx/L;jy*=mx/L;}
    joy.x=jx/mx;joy.y=-jy/mx;knob.style.transform=`translate(${jx}px,${jy}px)`;}
  else if(e.pointerId===lookId){const k=e.pointerType==='touch'?.0055:.0033;yaw-=dx*k;pitch=clamp(pitch-dy*k,-1.45,1.45);}
});
const endPtr=e=>{if(e.pointerId===joyId){joyId=null;joy.x=joy.y=0;joyEl.hidden=true;}if(e.pointerId===lookId)lookId=null;ptrs.delete(e.pointerId);};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',e=>{e.preventDefault();dismissHint();glide=clamp(glide-e.deltaY*.25,-400,400);},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
let locked=false;
cv.addEventListener('click',e=>{if(e.button!==0||coarse||locked||!cv.requestPointerLock)return;try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(_){}});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===cv;cv.style.cursor=locked?'none':'';});
cv.addEventListener('mousemove',e=>{const k=locked?.0022:.003;yaw-=(e.movementX||0)*k;pitch=clamp(pitch-(e.movementY||0)*k,-1.45,1.45);});

function holdBtn(el,dir){
  const on=e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}vert=dir;el.classList.add('on');dismissHint();};
  const off=()=>{if(vert===dir)vert=0;el.classList.remove('on');};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);
  el.addEventListener('contextmenu',e=>e.preventDefault());
}
holdBtn($('up'),1);holdBtn($('down'),-1);

function step(dt){
  let f=0,s=0,u=vert;
  if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD)s+=1;if(keys.KeyA)s-=1;
  if(keys.ArrowLeft)yaw+=1.6*dt;if(keys.ArrowRight)yaw-=1.6*dt;
  if(keys.Space||keys.KeyE)u+=1;if(keys.KeyQ||keys.KeyC||keys.ControlLeft)u-=1;
  f+=joy.y;s+=joy.x;
  const L=Math.hypot(f,s);if(L>1){f/=L;s/=L;}
  const boost=keys.ShiftLeft||keys.ShiftRight||Math.hypot(joy.x,joy.y)>.96;
  if(mode==='cannon'){yaw-=s*1.1*dt;pitch=clamp(pitch+f*.7*dt,-.05,1.2);stepCannonCam();return;}
  if(walkMode){
    if(u!==0||keys.Space){walkMode=false;}
    else{
      const sp=boost?14:5.5,fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
      const a=1-Math.exp(-8*dt);vel.x+=((fx*f+rx*s)*sp-vel.x)*a;vel.z+=((fz*f+rz*s)*sp-vel.z)*a;vel.y=0;
      const nx=player.x+vel.x*dt,nz=player.z+vel.z*dt;
      if(groundAt(nx,player.z)!==null&&!blockedAt(nx,player.z))player.x=nx;else vel.x=0;
      if(groundAt(player.x,nz)!==null&&!blockedAt(player.x,nz))player.z=nz;else vel.z=0;
      const gy=groundAt(player.x,player.z);player.y+=((gy===null?3:gy)+1.7-player.y)*(1-Math.exp(-10*dt));
      walkBob+=Math.hypot(vel.x,vel.z)*dt*1.6;
      camera.position.set(player.x,player.y+(reduceMotion?0:Math.sin(walkBob*2)*.04),player.z);
      camera.rotation.set(pitch,yaw,0);return;
    }
  }
  const pil=mode==='pilot';
  const altK=pil?1:1+clamp(player.y/600,0,3);
  const sp=pil?(boost?650:240):(boost?460:95)*altK,vs=pil?(boost?420:160):(boost?340:75)*Math.min(altK,2.2);
  const cp=pil?Math.cos(pitch):1,fx=-Math.sin(yaw)*cp,fz=-Math.cos(yaw)*cp,fy=pil?Math.sin(pitch):0,rx=Math.cos(yaw),rz=-Math.sin(yaw);
  const tx=(fx*f+rx*s)*sp+fx*glide,tz=(fz*f+rz*s)*sp+fz*glide,ty=fy*f*sp+clamp(u,-1,1)*vs;
  const a=1-Math.exp(-4*dt);vel.x+=(tx-vel.x)*a;vel.z+=(tz-vel.z)*a;vel.y+=(ty-vel.y)*a;
  glide*=Math.exp(-1.6*dt);if(Math.abs(glide)<.5)glide=0;
  player.addScaledVector(vel,dt);
  // the opening run: the interceptor rides in off the Vigil's wing for the first seconds after the drop (no control yet),
  // then eases loose with her speed and the flight is yours
  if(pil&&typeof flag!=='undefined'&&flag.state==='flying'&&flag.t<FORM_T+FORM_EASE){
    flagPos(flag.t,_form).add(FORM_OFF);flagPos(flag.t+.05,_formV).add(FORM_OFF).sub(_form).multiplyScalar(20);
    if(flag.t<FORM_T){player.copy(_form);vel.copy(_formV);
      yaw=angLerp(yaw,Math.PI,1-Math.exp(-dt*4));pitch+=(-.03-pitch)*(1-Math.exp(-dt*4));glide=Math.min(400,_formV.length());}   // glide: let go, you keep her speed
    else{const k=1-(flag.t-FORM_T)/FORM_EASE;player.lerp(_form,k*k*.5);glide=Math.max(glide,Math.min(400,_formV.length())*k);}
  }
  // large ships are solid: capital ships, frigates, the city flagship and the freighters push you out
  const imp=collideHulls(player,vel,pil?18:6,tideSolids());
  if(pil&&imp>160){boom(player.clone(),120,0xfff0c0,.3);flashBanner('Hull scrape');if(typeof hurtTide!=='undefined')hurtTide(Math.min(30,imp*.05));}
  player.y=clamp(player.y,4,5200);
  const rad=Math.hypot(player.x,player.z),MAXR=12000;if(rad>MAXR){player.x*=MAXR/rad;player.z*=MAXR/rad;}
  const sway=reduceMotion?0:Math.sin(performance.now()*.0009)*.35;
  if(pil){
    pShip.position.copy(player);pShip.rotation.set(pitch,yaw,clamp(-(vel.x*rx+vel.z*rz)*.0022,-.7,.7));
    const cy=Math.cos(pitch);_cam.set(Math.sin(yaw)*cy,-Math.sin(pitch),Math.cos(yaw)*cy).multiplyScalar(72);
    _camW.copy(player).add(_cam);_camW.y+=17;
    // (Oct 25) never inside a tower: pulled in toward the ship to short of the first thing in the way; eases back out after
    const k=camPull(player,_camW);camK=k<camK?k:Math.min(k,camK+dt*1.6);camera.position.lerpVectors(player,_camW,camK);if(camK<.999)camera.position.y+=(1-camK)*3;
    collideHulls(camera.position,null,6,tideSolids());camera.rotation.set(pitch-.1,yaw,0);camera.updateMatrixWorld();
  }else{
    camera.position.set(player.x,player.y+sway,player.z);
    camera.rotation.set(pitch,yaw,clamp(-(vel.x*rx+vel.z*rz)*.0009,-.12,.12));
  }
}
const _cam=new THREE.Vector3(),_camW=new THREE.Vector3();
/* ---------- the chase camera and the city (Oct 25, Bryce: in third person the camera went inside the towers and you saw through them)
   Everything solid the camera could sit in: the instanced towers (three tiers, each narrower: js/tide/02-city.js), the low buildings
   (js/tide/03-life.js), Bryce's spire towers on the outer platforms (SPIRE_SOLIDS, once the model is in), the Spear, and the
   platforms' tops. A grid of 160 m cells finds what is near the ship; the line from the ship back to the camera is sampled, and the
   camera stops 3 m short of the first sample inside something. */
let camK=1;const CAMG=new Map(),CAM_CELL=160;
function camGrid(){if(CAMG.size)return;const put=(o,r)=>{const i0=Math.floor((o.x-r)/CAM_CELL),i1=Math.floor((o.x+r)/CAM_CELL),j0=Math.floor((o.z-r)/CAM_CELL),j1=Math.floor((o.z+r)/CAM_CELL);
    for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=i*4099+j;let a=CAMG.get(k);if(!a)CAMG.set(k,a=[]);a.push(o);}};
  for(const T of towers)put({t:'T',x:T.x,z:T.z,T,r:T.fp*(T.kind==='box'?.72:.52)},T.fp);
  for(const L of lows)put({t:'L',x:L.x,z:L.z,r:L.rad,top:3+L.h},L.rad);}
function solidAt(x,y,z,m,gm){const g=groundAt(x,z);if(g!==null&&y<Math.max(g,3)+1+(gm==null?m:gm))return true;   // the platforms' tops (and the port, its own deck height); gm: a separate margin over the deck
  const ds=Math.hypot(x-SPEAR.x,z-SPEAR.z);if(ds<140){const r=y<72?112:y<1310?34-22*(y-70)/1240:y<1610?26*(1-Math.abs(y-1460)/150):0;if(ds<r+m)return true;}
  for(const S of SPIRE_SOLIDS)if(y<S.h&&Math.hypot(x-S.x,z-S.z)<S.r*(1-.55*clamp((y-3)/S.h,0,1))+m)return true;
  const a=CAMG.get(Math.floor(x/CAM_CELL)*4099+Math.floor(z/CAM_CELL));if(!a)return false;
  for(const o of a){const dx=x-o.x,dz=z-o.z;if(Math.abs(dx)>o.r+m+40||Math.abs(dz)>o.r+m+40)continue;
    if(o.t==='T'){const T=o.T,u=(y-3)/T.h;if(u>1.02+(T.spire?.15:0))continue;const r=o.r*(u<.62?1:u<.9?.76:u<=1?.5:.08);if(dx*dx+dz*dz<(r+m)*(r+m))return true;}
    else if(y<o.top+m&&dx*dx+dz*dz<(o.r+m)*(o.r+m))return true;}
  return false;}
// how far along from (the ship) to (where the camera wants to be) it can go: 0..1
function camPull(from,to){camGrid();const N=14;for(let i=1;i<=N;i++){const k=i/N,x=from.x+(to.x-from.x)*k,y=from.y+(to.y-from.y)*k,z=from.z+(to.z-from.z)*k;
    if(solidAt(x,y,z,3)){const L=from.distanceTo(to);return Math.max(.08,(k-1/N)-3/Math.max(L,1));}}return 1;}
let mode='free',manned=null,fireHeld=false,pCool=0,pBarrel=0;
function stepCannonCam(){
  const p=manned.yawG.getWorldPosition(_cam),fx=-Math.sin(yaw),fz=-Math.cos(yaw);
  camera.position.set(p.x-fx*1150,Math.max(p.y,0)+460,p.z-fz*1150);
  camera.rotation.set(clamp(pitch,-.05,1.2)*.8-.16,yaw,0);
  player.copy(camera.position);vel.set(0,0,0);
}
function playerWeapons(dt){
  pCool-=dt;if(!fireHeld||pCool>0)return;
  if(mode==='cannon'){const g=manned;
    if(g.broken){flashBanner('This gun is wrecked · pick another');pCool=1.2;return;}
    if(g.root.position.y<-30){flashBanner('Guns surface while the shield is up');pCool=1.2;return;}
    pCool=.45;pBarrel^=1;const mz=g.muzzles[pBarrel],from=mz.getWorldPosition(new THREE.Vector3()),dir=mz.getWorldDirection(new THREE.Vector3()).negate();
    boom(from,320,0xffd27a,.3);boom(from,620,0xff9a3a,.6);g.recoil=40;playerShot(from,dir,3200,'friend',4);}
  else if(mode==='pilot'){const z=tideP.zealT>0;pCool=z?.06:.11;pBarrel^=1;
    // guns converge on whatever sits under the crosshair, not straight ahead of the nose (the camera rides above and behind)
    const from=pShip.localToWorld(new THREE.Vector3(pBarrel?4.6:-4.6,-.55,-3)),r=crosshairRay(),h=rayHit(r.o,r.d,9000),aim=h?h.point:r.o.addScaledVector(r.d,2600);
    const dir=aim.sub(from).normalize();boom(from,8,z?0xffd27a:0x9ff4ff,.06);playerShot(from,dir,4500,z?'zeal':'player',z?2:1);}   // Zeal: faster, gold, double damage
}
