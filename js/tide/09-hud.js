/* Tide City · hud */
/* ---------- HUD ---------- */
const strip=$('strip'),PX=2;let compassW=200;
(function(){let h='';const names={0:'N',45:'NE',90:'E',135:'SE',180:'S',225:'SW',270:'W',315:'NW'};
  for(let d=-360;d<=720;d+=15){const nd=((d%360)+360)%360,lb=names[nd];
    h+=lb?`<span class="${lb.length===1?'card'+(lb==='N'?' n':''):'ord'}" style="left:${(d+360)*PX}px">${lb}</span>`:`<span class="tick" style="left:${(d+360)*PX}px"></span>`;}
  strip.innerHTML=h;})();
const DIRS=['N','NE','E','SE','S','SW','W','NW'];
let hudT=0;
function layerName(y){if(mode==='cannon')return'Sea cannon · you have the gun';if(mode==='pilot')return'Interceptor · '+Math.round(y)+' m';if(walkMode)return'Street level · on foot';if(y<25)return'Sea level';let best=LAYERS[0];for(const L of LAYERS)if(Math.abs(L.y-y)<Math.abs(best.y-y))best=L;
  if(Math.abs(best.y-y)<35)return best.name+' · '+best.y+' m';if(y>1100)return y>2000?'Among the capital ships':'Open sky';return'Between layers';}
function hud(dt){
  const heading=((-yaw*180/Math.PI)%360+360)%360;
  strip.style.transform=`translateX(${compassW/2-(heading+360)*PX}px)`;
  hudT+=dt;if(hudT<.12)return;hudT=0;
  $('deg').textContent=String(Math.round(heading)%360).padStart(3,'0')+'° '+DIRS[Math.round(heading/45)%8];
  $('alt').innerHTML=Math.round(player.y).toLocaleString()+'<small>m · '+Math.round(Math.hypot(vel.x,vel.y,vel.z)*3.6)+' km/h</small>';
  $('layer').textContent=layerName(player.y);
  const d=Math.hypot(player.x,player.z),b=((Math.atan2(-player.x,player.z)*180/Math.PI)+360)%360;
  $('sub').textContent=(mode==='cannon'||mode==='pilot')?'Hull hits '+score.hull+' · fighters down '+score.fighters+' · ships downed '+score.capitals:d<400?'Over the city core':'City core '+(d/1000).toFixed(1)+' km '+DIRS[Math.round(b/45)%8];
}
const bannerEl=$('banner'),attackBtn=$('attack');let bannerKey='',flashTxt='',flashUntil=0;
function flashBanner(t){flashTxt=t;flashUntil=performance.now()+2500;}
function fleetKm(){let m=1e9;for(const c of liveShips())m=Math.min(m,Math.hypot(c.grp.position.x,c.grp.position.z));return(m/1000).toFixed(1);}
function updateBanner(id,pt){
  let txt,cls='';
  const A=capitals[CRASH_A],B=capitals[CRASH_B];
  if(id==='calm')txt=!battles?'All quiet over Tide City':'Tide City holds · wreckage burning';
  else if(id==='arrive'){cls='alert';txt='Dropping out of Slipscape';}
  else if(id==='fallen'){cls='alert';txt=pt<11?'City integrity lost \u00b7 Tide City is breaking apart':'Tide City has fallen';}
  else if(id==='victory'){cls='shield';txt=pt<6?'Fleet destroyed · Tide City holds':pt<18?'The city celebrates':'Guns stand down';}
  else if(id==='escape'){cls='alert';txt=flag.t<PEEL_T?'The Vigil inbound · under fire':flag.t<FLY_T?'Frigates break off · the Vigil crossing the city':'The Vigil landing · enemy fleet sighted';}
  else if(id==='approach'){cls='alert';txt=pt>=14.5?'Fleet opened fire · city hit':'Enemy fleet inbound · '+fleetKm()+' km';}
  else if(id==='bombard'){cls=pt<2.4?'alert':'shield';txt=civs[0].state==='fall'?'Straggler shot down outside the shield':pt<2.4?'Incoming fire · shield raising':pt<3.4?'Shield holding':pt<9.5?'Shield holding · sea guns surfacing':'Shield holding · guns locked on';}
  else if(id==='counter'){cls='guns';txt=pt<1.4?'Shield down · guns firing':(A.crash&&!A.crash.impact)?'Enemy ship going down':(A.crash&&A.crash.impact&&A.crash.t<5)?'Wreck hit a sea gun':(B.crash&&(!B.crash.impact||B.crash.t<4))?'Second ship going down':'Sea guns firing \u00b7 '+liveShips().length+' ships left in the first wave';}
  else if(id==='rout'){cls='shield';txt=pt<6?'The aliens are breaking off \u00b7 jumping out':'Contact lost \u00b7 the sky is clear';}
  else if(id==='reinf'){cls='alert';txt=pt<4?'New contacts \u00b7 five ships dropping out of Slipscape':pt<10?'The Hollow King\u2019s fleet \u00b7 the Spear is waking':'Spear charging '+Math.floor(spearCharge()*100)+'% \u00b7 Hollow fleet launching fighters';}
  else if(id==='host'){cls='alert';txt='Empty Host landing · Spear charging '+Math.floor(spearCharge()*100)+'%';}
  else if(id==='spear'){cls='shield';txt=spearFired()?'The Hollow fleet is down':'The Spear is charging · '+Math.floor(spearCharge()*100)+'% · '+liveShips().length+' ships left';}
  if(performance.now()<flashUntil){txt=flashTxt;cls='guns';}
  const key=txt+cls;if(key!==bannerKey){bannerKey=key;bannerEl.textContent=txt;bannerEl.className='hud banner '+cls;}
  attackBtn.hidden=id!=='calm'||PG.paused||(typeof CUTS!=='undefined'&&CUTS.on)||!battles;/* only after a battle: 'Fight again' */attackBtn.textContent=battles?'Fight again':'Start';
}
const VIEWS={dome:{p:[200,330,-680],look:[-200,1100,-4800]},overview:{p:[0,2600,10500],look:[0,900,-2500]},start:{p:[0,40,3700],look:[0,260,0]},
  yard:{p:[2700,520,4700],look:[0,500,7600]},street:{p:[streetSpot.x,4.7,streetSpot.z],look:[streetSpot.x*.2,420,streetSpot.z-1600]}};
function setMode(v){
  manned=null;pShip.visible=false;walkMode=false;mode='free';vel.set(0,0,0);glide=0;
  if(v==='cannon'){let bd=1e18;for(const g of cannons){const d=(g.x-player.x)**2+(g.z-player.z)**2;if(d<bd){bd=d;manned=g;}}
    mode='cannon';yaw=manned.yawG.rotation.y;pitch=.3;flashBanner(manned.root.position.y<-30?'Gun crewed · it surfaces while the shield is up':(coarse?'Gun crewed · aim and hold FIRE':'Gun crewed · aim and right-click to fire'));}
  else if(v==='pilot'){mode='pilot';pShip.visible=true;player.set(PORT.x,180,PORT.z+80);yaw=0;pitch=.06;flashBanner(coarse?'Interceptor launched · hold FIRE to shoot':'Interceptor launched · right-click to shoot');}
  else{const V=VIEWS[v];walkMode=v==='street';player.set(...V.p);const dx=V.look[0]-V.p[0],dy=V.look[1]-V.p[1],dz=V.look[2]-V.p[2];
    yaw=Math.atan2(-dx,-dz);pitch=Math.atan2(dy,Math.hypot(dx,dz));}
  const armed=mode==='cannon'||mode==='pilot';$('fire').hidden=!armed||!coarse;$('ret').hidden=!armed;
  const gb=$('gun');if(gb){gb.hidden=!armed||!coarse;gb.textContent=mode==='cannon'?'FLY':'GUN';gb.setAttribute('aria-label',mode==='cannon'?'Back to the interceptor':'Crew the nearest sea gun');}
}

{const fb=$('fire');const on=e=>{e.preventDefault();try{fb.setPointerCapture(e.pointerId);}catch(_){}fireHeld=true;fb.classList.add('on');};const off=()=>{fireHeld=false;fb.classList.remove('on');};
 fb.addEventListener('pointerdown',on);fb.addEventListener('pointerup',off);fb.addEventListener('pointercancel',off);fb.addEventListener('lostpointercapture',off);fb.addEventListener('contextmenu',e=>e.preventDefault());}
cv.addEventListener('mousedown',e=>{if(e.button===2){e.preventDefault();fireHeld=true;}});
addEventListener('mouseup',e=>{if(e.button===2)fireHeld=false;});
addEventListener('blur',()=>{fireHeld=false;});
attackBtn.addEventListener('click',()=>{callFleet();attackBtn.blur();});
// the pull-down: Sound, Quality and Chapters sit behind one Menu button
{const mb=$('menuBtn'),vw=$('views');const set=o=>{vw.classList.toggle('open',o);mb.setAttribute('aria-expanded',o?'true':'false');};
 mb.addEventListener('click',e=>{e.stopPropagation();set(!vw.classList.contains('open'));mb.blur();});
 vw.addEventListener('click',e=>{if(e.target.closest('button,a'))setTimeout(()=>set(false),250);});
 cv.addEventListener('pointerdown',()=>set(false));addEventListener('keydown',e=>{if(e.code==='Escape')set(false);});}
const hint=$('hint');
hint.textContent=coarse?'Left thumb flies · right thumb looks · UP / DOWN for altitude · hold FIRE · MSL for missiles · ZEAL when charged · GUN crews a sea gun':'Mouse to aim (click to lock, Esc to release) · WASD to fly · Space up · Q down · Shift boost · right-click fire · F missile · Z Zeal · G crew the nearest sea gun';
let hintGone=false;function dismissHint(){if(hintGone)return;hintGone=true;setTimeout(()=>hint.classList.add('gone'),2500);}
setTimeout(dismissHint,8000);   // on PC it fades by itself too, even if you haven't touched anything
setTimeout(dismissHint,7000);
$('vbtns').hidden=!coarse;   // the climb/descend buttons are for phones only

/* ---------- graphics: drifting clouds, ship shadows, bloom, quality toggle ---------- */
const cloudTex=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  for(let i=0;i<40;i++){const cx=R(30,226),cy=R(110,150),r=R(14,46),g=x.createRadialGradient(cx,cy,0,cx,cy,r);   // many small puffs in a thin band: a wisp, not a ball
    g.addColorStop(0,'rgba(255,255,255,.32)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;})();
const clouds=[];
for(let i=0;i<(coarse?18:32);i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:0x232c40,transparent:true,opacity:R(.16,.3),depthWrite:false,fog:false}));   // night clouds
  const a=rng()*6.283,r=R(2500,17000);sp.position.set(Math.cos(a)*r,R(3300,5600),Math.sin(a)*r);sp.scale.set(R(4200,9000),R(800,1300),1);scene.add(sp);clouds.push(sp);}
function updateClouds(dt){for(const c of clouds){c.position.x+=9*dt;if(c.position.x>18000)c.position.x=-18000;}}
for(const c of capitals)c.grp.traverse(o=>{if(o.isMesh)o.castShadow=true;});
scene.traverse(o=>{const m=o.material;if(m&&m.isMeshStandardMaterial)m.envMapIntensity=.22;});   // night: the sky lights the city only a little
flag.grp.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
for(const g of cannons)g.root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
let composer=null,HQ=true;
try{
  if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader&&THREE.RenderPass&&THREE.ShaderPass){
    const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),gl2=renderer.capabilities.isWebGL2;
    const opts={type:gl2&&renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType};
    const rt=gl2&&THREE.WebGLMultisampleRenderTarget?new THREE.WebGLMultisampleRenderTarget(sz.x,sz.y,opts):new THREE.WebGLRenderTarget(sz.x,sz.y,opts);
    composer=new THREE.EffectComposer(renderer,rt);
    composer.addPass(new THREE.RenderPass(scene,camera));
    composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.45,.4,.9));
    composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
  }
}catch(e){composer=null;}
try{const q=localStorage.getItem('elyra.quality');if(q)HQ=q!=='low';}catch(_){}
function setQuality(hq){HQ=hq;try{localStorage.setItem('elyra.quality',hq?'high':'low');}catch(_){}sun.castShadow=hq;renderer.setPixelRatio(Math.min(devicePixelRatio||1,hq?(coarse?1.6:1.75):(coarse?1.15:1)));
  renderer.setSize(innerWidth,innerHeight);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);}
  $('quality').textContent=hq?'Quality: high':'Quality: low';}
$('quality').addEventListener('click',()=>{setQuality(!HQ);$('quality').blur();});
if(!HQ)setQuality(false);
function renderFrame(){if(composer&&HQ){try{composer.render();return;}catch(e){composer=null;}}renderer.render(scene,camera);}

/* ---------- loop ---------- */
function resize(){renderer.setSize(innerWidth,innerHeight);if(composer)composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();compassW=strip.parentElement.clientWidth;}
addEventListener('resize',resize);resize();

let last=performance.now(),t=0;
// the loop schedules its next frame before doing any work, so one error can never freeze the game (it is reported once)
let frameErr=0;function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=PG.paused?0:Math.min(.05,(now-last)/1000);last=now;t+=dt;
  const cut=CUTS.update(dt);   // a cutscene has the camera; the battle keeps running underneath
  if(!cut){step(dt);playerWeapons(dt);}
  sky.position.copy(camera.position);
  ocean.position.set(camera.position.x,0,camera.position.z);
  ocean.material.uniforms.time.value=t;
  director(dt,t);
  updateBolts(dt);updateBooms(dt);updateSpray(dt);updateSmoke(dt);updateMissiles(dt);updateTrails(dt);
  updateFlyers(t,dt);updateMissilesP(dt,0);tideTick(dt);
  updateLife(dt,t);updateClouds(dt);
  hud(dt);
  renderFrame();
  
}
// Start the loop only after every game script has run. Starting it here (mid-load) let a frame fire
// while 10-combat.js / 11-story.js were still downloading on slow connections, so the director
// called updateStory() before it existed.
if(document.readyState==='loading')addEventListener('DOMContentLoaded',()=>requestAnimationFrame(frame),{once:true});
else requestAnimationFrame(frame);
