/* Elyra · the recovered footage, in 3D. Three short scenes that sit with the archives on the menu (and that the menu plays on
   its own when it is left alone long enough, js/menu/the-call.js):
     01 · THE CALL    the command deck at Tide City Command, empty, one red emergency light. Michael asks ELYRA where the Hollow is.
     02 · THE RETURN  the same room, the dome already awake. Twenty-three years. The camera outside. Something standing in the dark.
     03 · THE HOLLOW  the night before Tide City (after Archive 02). Michael goes back down to the chamber from Archive 01, alone,
                    and the Drowned Watcher tries to warn him off the Spear. His name on the wall is dated the day of Tide City.
                      The names on the wall, his own, dated tomorrow, and what the Hollow is the shell of.
   One three.js scene holds three sets, far apart: the deck (at the origin), the facility seen from outside (x +400), the Hollow (x -400).
   Michael is the Keeper Marine model (js/shared/models.js) on the code rig (js/origin/02-people.js), posed here: sitting, turning,
   walking, holding up a torch. Sound and voices: js/menu/call-sound.js. FOOTAGE.play(n,{done}) · Enter, Esc or Skip end it. */
const FOOTAGE=(()=>{
const AU=CALL_AU,V=CALL_V,still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAMES=['','THE CALL','THE RETURN','THE HOLLOW'];

/* ---------- the overlay: the canvas, letterbox, grain, subtitles, title, skip ---------- */
const css=document.createElement('style');css.textContent=`
#ftg{position:fixed;inset:0;z-index:50;background:#000;overflow:hidden;cursor:none}#ftg.cur{cursor:auto}
#ftg canvas.gl{position:absolute;inset:0;width:100%;height:100%;display:block;transition:filter .1s}
#ftg.cctv canvas.gl{filter:grayscale(1) sepia(.35) hue-rotate(55deg) saturate(1.6) contrast(1.25) brightness(1.5)}
#ftg .bar{position:absolute;left:0;right:0;height:9vh;background:#000;z-index:3}#ftg .bar.t{top:0}#ftg .bar.b{bottom:0}
#ftg .grain{position:absolute;inset:-50%;z-index:2;pointer-events:none;opacity:.09;animation:fgr .5s steps(5) infinite;mix-blend-mode:screen}
#ftg.cctv .grain{opacity:.22}
@keyframes fgr{0%{transform:translate(0,0)}20%{transform:translate(-7%,4%)}40%{transform:translate(5%,-6%)}60%{transform:translate(-3%,7%)}80%{transform:translate(6%,2%)}}
#ftg .vig{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(0,0,0,.75) 100%)}
#ftg .black{position:absolute;inset:0;z-index:4;background:#000;opacity:1;pointer-events:none}
#ftg .hud{position:absolute;inset:calc(9vh + 14px) 18px;z-index:3;pointer-events:none;font:500 13px 'JetBrains Mono',ui-monospace,monospace;color:rgba(220,235,220,.8);letter-spacing:.08em;display:none}
#ftg.cctv .hud{display:block}#ftg .hud .r{position:absolute;right:0;top:0;color:#e8463c}#ftg .hud .d{position:absolute;left:0;bottom:0}
#ftg .gl-x{position:absolute;inset:0;z-index:3;pointer-events:none;opacity:0;background:repeating-linear-gradient(0deg,rgba(232,70,60,.18) 0 3px,transparent 3px 11px);mix-blend-mode:screen}
#ftg .gl-x.on{opacity:1;animation:fgx .09s steps(2) infinite}@keyframes fgx{50%{transform:translateX(14px);filter:hue-rotate(90deg)}}
#ftg .sub{position:absolute;left:50%;bottom:calc(9vh + 18px);transform:translateX(-50%);width:min(860px,88vw);text-align:center;z-index:5;opacity:0;transition:opacity .25s;
  font:500 18px/1.45 'Chakra Petch','Arial Narrow',system-ui,sans-serif;letter-spacing:.03em;color:#eef0f2;text-shadow:0 1px 4px #000,0 0 2px #000}
#ftg .sub.on{opacity:1}#ftg .sub b{display:block;font:600 10px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.26em;color:rgba(159,200,204,.9);text-transform:uppercase;margin-bottom:3px}
#ftg .sub.m b{color:rgba(230,228,223,.6)}#ftg .sub.x b{color:#e8463c}#ftg .sub.x span{color:#cfd8ff;letter-spacing:.06em}
#ftg .title{position:absolute;inset:0;z-index:6;display:grid;place-items:center;align-content:center;text-align:center;opacity:0;transition:opacity 1.6s;pointer-events:none;padding:0 6vw;
  font:500 clamp(22px,4.4vw,48px)/1.25 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.42em;color:#e6e4df}
#ftg .title.on{opacity:1}#ftg .title small{display:block;margin-top:16px;font:400 10px 'JetBrains Mono',monospace;letter-spacing:.32em;color:rgba(230,228,223,.45)}
#ftg .title.rec{font:600 clamp(12px,1.9vw,17px)/1.6 'JetBrains Mono',monospace;letter-spacing:.2em;color:#e8463c}
#ftg .skip{position:absolute;z-index:7;right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 14px);padding:8px 14px;border:1px solid rgba(230,228,223,.3);
  background:rgba(0,0,0,.5);color:rgba(230,228,223,.8);font:600 11px 'Chakra Petch',sans-serif;letter-spacing:.22em;text-transform:uppercase;cursor:pointer}
@media (max-width:760px){#ftg .sub{font-size:15px}#ftg .bar{height:7vh}#ftg .hud{font-size:10px}}`;
document.head.appendChild(css);
let root,cv,subEl,titleEl,blackEl,hudEl,glx,renderer,composer,scene,camera,built=false;
function grainURL(){const c=document.createElement('canvas');c.width=c.height=160;const g=c.getContext('2d'),d=g.createImageData(160,160);
  for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}g.putImageData(d,0,0);return c.toDataURL();}
function mount(){
  root=document.createElement('div');root.id='ftg';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-label','Recovered footage');
  root.innerHTML=`<canvas class="gl"></canvas><div class="grain" style="background-image:url(${grainURL()})"></div><div class="vig"></div><div class="gl-x"></div>
    <div class="hud"><span class="c">CAM 04 · TIDE CITY COMMAND · EXTERIOR</span><span class="r">● REC</span><span class="d"></span></div>
    <div class="bar t"></div><div class="bar b"></div><div class="black"></div><div class="sub" aria-live="polite"><b></b><span></span></div><div class="title"></div><button class="skip" type="button" hidden>Skip ›</button>`;
  document.body.appendChild(root);cv=root.querySelector('canvas.gl');subEl=root.querySelector('.sub');titleEl=root.querySelector('.title');blackEl=root.querySelector('.black');hudEl=root.querySelector('.hud');glx=root.querySelector('.gl-x');
  root.querySelector('.skip').addEventListener('click',e=>{e.stopPropagation();skip();});
  root.addEventListener('pointerdown',()=>{root.querySelector('.skip').hidden=false;root.classList.add('cur');});
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x020306);scene.fog=new THREE.FogExp2(0x020306,.0016);
  camera=new THREE.PerspectiveCamera(42,1,.05,3000);
  resize();addEventListener('resize',resize);
  try{if(THREE.EffectComposer&&THREE.UnrealBloomPass){composer=new THREE.EffectComposer(renderer);composer.addPass(new THREE.RenderPass(scene,camera));
    composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(512,512),.8,.5,.82));if(THREE.GammaCorrectionShader)composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));resize();}}catch(e){composer=null;}
}
function resize(){if(!renderer)return;const w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio||1,coarse?1.5:1.75);renderer.setPixelRatio(d);renderer.setSize(w,h,false);
  if(composer)composer.setSize(w,h);camera.aspect=w/h;
  // a phone held upright sees a wider field so the shot still holds what matters
  camera.fov=w<h?62:42;camera.updateProjectionMatrix();}

/* ---------- little texture helpers ---------- */
function canvasTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
function panelTexture(base){return canvasTex(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<600;i++){g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},255,${Math.random()*.03})`;g.fillRect(Math.random()*w,Math.random()*h,2,2);}
  g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=2;for(let x=0;x<=w;x+=64)g.strokeRect(x,0,64,128),g.strokeRect(x+32,128,64,128);
  g.fillStyle='rgba(255,255,255,.05)';for(let x=6;x<w;x+=64)for(let y=6;y<h;y+=128)g.fillRect(x,y,3,3);});}
const glowTex=canvasTex(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);});
function glowSprite(col,s,o){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:new THREE.Color(col).multiplyScalar(o||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));m.scale.setScalar(s);return m;}
const STD=(col,o)=>new THREE.MeshStandardMaterial(Object.assign({color:C(col),roughness:.6,metalness:.4},o||{}));
const box=(G,w,h,d,x,y,z,mat,cast)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=cast!==false;m.receiveShadow=true;G.add(m);return m;};

/* =====================================================================================================================
   SET 1 · THE COMMAND DECK (Tide City Command, the room the Mountain opens in) — empty, night, power on emergency
   ===================================================================================================================== */
const D={};
function buildDeck(){
  const G=new THREE.Group();scene.add(G);D.G=G;
  const wallTex=panelTexture('#2a2e36'),floorTex=panelTexture('#1d2026');floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(8,6);wallTex.wrapS=wallTex.wrapT=THREE.RepeatWrapping;wallTex.repeat.set(6,2);
  const wall=STD(0x8a909a,{map:wallTex,roughness:.7,metalness:.35}),floor=STD(0x8a8f98,{map:floorTex,roughness:.35,metalness:.55}),dark=STD(0x15181e,{roughness:.6}),trim=STD(0xd9b25a,{roughness:.3,metalness:.85});
  // the room: 24 wide, 18 deep, 8 high; a window wall to the north (-z) over the bay
  box(G,24,.2,18,0,-.1,0,floor,false);box(G,24,.3,18,0,8.15,0,dark,false);
  box(G,.4,8,18,-12,4,0,wall,false);box(G,.4,8,18,12,4,0,wall,false);box(G,24,8,.4,0,4,9,wall,false);
  box(G,24,1,.4,0,.5,-9,wall,false);box(G,24,1.2,.4,0,7.6,-9,wall,false);for(const x of[-12,-6,0,6,12])box(G,.35,8,.5,x,4,-9,dark);
  for(const z of[-8.8,8.8])box(G,24,.05,.05,0,7.9,z,new THREE.MeshBasicMaterial({color:0x2a3a44}));
  // dead consoles down both side walls
  const scr=new THREE.MeshStandardMaterial({color:0x05080a,roughness:.15,metalness:.6});
  for(const s of[-1,1])for(const z of[-5,-1.5,2,5.5]){box(G,1.2,1.1,2.6,s*11,.55,z,dark);const sc=box(G,.05,1,2.2,s*11.35,1.75,z,scr);sc.rotation.z=s*.25;}
  // the window: glass, the bay at night, the city with only a few lights left, the Spear of Destiny
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(24,5.8),new THREE.MeshStandardMaterial({color:0x8ab0d0,transparent:true,opacity:.07,roughness:.05,metalness:.9}));glass.position.set(0,4,-9);G.add(glass);
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshStandardMaterial({color:0x050b14,roughness:.18,metalness:.85}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-6,-1400);G.add(sea);
  const win=canvasTex(64,128,(g)=>{g.fillStyle='#070a10';g.fillRect(0,0,64,128);for(let y=4;y<128;y+=8)for(let x=4;x<64;x+=8)if(Math.random()<.05){g.fillStyle=Math.random()<.7?'#ffd890':'#9fe4ff';g.fillRect(x,y,4,4);}});
  win.wrapS=win.wrapT=THREE.RepeatWrapping;const cityM=new THREE.MeshStandardMaterial({color:0x0c111a,emissive:0xffffff,emissiveMap:win,emissiveIntensity:1.6,roughness:.7});
  for(let i=0;i<70;i++){const a=(Math.random()-.5)*1.6,r=180+Math.random()*700,w=14+Math.random()*30,h=20+Math.random()*160;const g=new THREE.BoxGeometry(w,h,w),uv=g.attributes.uv;
    for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*w/24,uv.getY(k)*h/48);const m=new THREE.Mesh(g,cityM);m.position.set(Math.sin(a)*r,h/2-6,-9-Math.cos(a)*r);G.add(m);
    if(Math.random()<.25){const t=glowSprite(0xff4a3a,5,1.5);t.position.set(m.position.x,h-5,m.position.z);G.add(t);D.beacons=(D.beacons||[]).concat(t);}}
  const sp=new THREE.Group();sp.position.set(160,-6,-520);G.add(sp);
  {const s1=new THREE.Mesh(new THREE.CylinderGeometry(3,10,260,6),STD(0xd8d2c4,{roughness:.4,metalness:.5,emissive:0x111008}));s1.position.y=130;sp.add(s1);
   const t=glowSprite(0xffd890,50,1.6);t.position.y=268;sp.add(t);D.spearTip=t;}
  const moon=new THREE.DirectionalLight(0x6f86c0,.45);moon.position.set(-20,30,-60);G.add(moon);
  const bay=new THREE.PointLight(0x3a5a9a,1.2,30,1.4);bay.position.set(0,5,-8);G.add(bay);
  const amb=new THREE.HemisphereLight(0x3a4560,0x0a0a0e,.18);G.add(amb);D.amb=amb;
  // the red emergency light over the room, a turning beacon under a cage
  const fx=new THREE.Group();fx.position.set(0,7.8,0);G.add(fx);box(fx,.9,.2,.9,0,.1,0,dark,false);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.28,.32,.3,16),new THREE.MeshBasicMaterial({color:0xff2a1a}));lens.position.y=-.15;fx.add(lens);D.lens=lens;
  const red=new THREE.PointLight(0xff2a18,0,26,1.6);red.position.set(0,7.2,0);red.castShadow=true;red.shadow.mapSize.set(1024,1024);red.shadow.bias=-.002;G.add(red);D.red=red;
  const rs=glowSprite(0xff3020,3.2,2);rs.position.set(0,7.6,0);G.add(rs);D.redGlow=rs;
  // the holo table and its dome
  const T=new THREE.Vector3(2.6,0,-3.4);D.T=T;
  const tbl=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.8,1.05,32),STD(0x2c3038,{map:wallTex,metalness:.6,roughness:.35}));tbl.position.set(T.x,.525,T.z);tbl.castShadow=tbl.receiveShadow=true;G.add(tbl);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.42,.03,6,64),new THREE.MeshBasicMaterial({color:0x7fe3ff}));ring.rotation.x=Math.PI/2;ring.position.set(T.x,1.07,T.z);G.add(ring);D.ring=ring;
  const domeMat=new THREE.MeshPhysicalMaterial({color:0x9fc8ff,transparent:true,opacity:.16,roughness:.05,metalness:0,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1.35,48,24,0,Math.PI*2,0,Math.PI/2),domeMat);dome.position.set(T.x,1.07,T.z);G.add(dome);D.dome=dome;
  const under=new THREE.PointLight(0x4a90ff,0,9,1.6);under.position.set(T.x,1.5,T.z);G.add(under);D.under=under;
  const core=glowSprite(0x5aa0ff,1.6,1.4);core.position.set(T.x,1.4,T.z);G.add(core);D.core=core;
  // what wakes inside it: a planet in wireframe, an orbit, a contact
  const holo=new THREE.Group();holo.position.set(T.x,1.85,T.z);G.add(holo);D.holo=holo;
  const hm=new THREE.MeshBasicMaterial({color:0x7fd8ff,wireframe:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  holo.add(new THREE.Mesh(new THREE.SphereGeometry(.55,20,14),hm));const orb=new THREE.Mesh(new THREE.TorusGeometry(.9,.006,4,80),hm);orb.rotation.x=1.2;holo.add(orb);D.hm=hm;
  const blip=glowSprite(0x8cf0b0,.22,2.4);blip.material.opacity=0;holo.add(blip);D.blip=blip;
  // Michael's terminal, facing the window: desk, chair, a monitor that lights his face
  const desk=new THREE.Group();desk.position.set(-3,0,-6);G.add(desk);
  box(desk,2.4,.08,1,0,.78,0,dark);box(desk,.08,.78,.9,-1.1,.39,0,dark);box(desk,.08,.78,.9,1.1,.39,0,dark);box(desk,.6,.04,.25,.3,.82,.25,STD(0x22262c));
  D.scrCanvas=document.createElement('canvas');D.scrCanvas.width=1024;D.scrCanvas.height=640;D.scrTex=new THREE.CanvasTexture(D.scrCanvas);D.scrTex.encoding=THREE.sRGBEncoding;
  const mon=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.94),new THREE.MeshBasicMaterial({map:D.scrTex,toneMapped:false}));mon.position.set(0,1.42,-.18);mon.rotation.x=-.08;desk.add(mon);D.mon=mon;
  box(desk,1.6,1.02,.06,0,1.42,-.22,dark).rotation.x=-.08;box(desk,.1,.5,.1,0,1.05,-.25,dark);
  const scrLight=new THREE.PointLight(0x7fd0dc,0,4.5,1.8);scrLight.position.set(-3,1.5,-5.5);G.add(scrLight);D.scrLight=scrLight;
  const chair=new THREE.Group();chair.position.set(-3,0,-4.75);G.add(chair);D.chair=chair;box(chair,.6,.08,.6,0,.5,0,dark);box(chair,.6,.7,.08,0,.9,.3,dark);box(chair,.08,.5,.08,0,.25,0,dark);
  // Michael: the Keeper Marine on the code rig. Dirty, scratched, tired
  const H=makeHuman('marine');G.add(H.root);D.H=H;MODELS.dress(H,'hero',{unarmed:true,tint:0x8f8a82});
  D.m={x:-3,z:-4.62,yaw:0,sit:1,head:0,headP:0,lean:0,step:0,speed:0};
}
// a seated pose on top of the code rig: thighs forward, shins down, forearms on the desk; lean tips him toward the screen
function poseDeck(dt){const m=D.m,H=D.H;
  poseHuman(H,dt,m.speed,0,false);
  const k=m.sit;if(k>0){for(const L of H.legs){L.hp.rotation.x=L.hp.rotation.x*(1-k)+1.5*k;L.kn.rotation.x=L.kn.rotation.x*(1-k)-1.45*k;}
    H.hip.position.y=(H.hipY||1)*(1-.45*k);for(const A of H.arms){A.sh.rotation.x=A.sh.rotation.x*(1-k)+(.55+m.lean*.35)*k;A.el.rotation.x=A.el.rotation.x*(1-k)+.75*k;}}
  H.torso.rotation.x+=-m.lean*.35;H.head.rotation.y=m.head;H.head.rotation.x=m.headP;
  H.root.position.set(m.x,0,m.z);H.root.rotation.y=m.yaw;D.chair.rotation.y=m.sit>.5?m.yaw:D.chair.rotation.y;}
/* the terminal: ELYRA writes as she speaks */
function drawScreen(){const c=D.scrCanvas,g=c.getContext('2d'),fl=ST.term*ST.termF;g.fillStyle='#030809';g.fillRect(0,0,1024,640);
  if(fl<=.01){D.scrTex.needsUpdate=true;return;}
  const gr=g.createRadialGradient(512,320,40,512,320,620);gr.addColorStop(0,`rgba(30,80,90,${.55*fl})`);gr.addColorStop(1,`rgba(4,16,18,${.6*fl})`);g.fillStyle=gr;g.fillRect(0,0,1024,640);
  g.font='600 30px "JetBrains Mono",ui-monospace,monospace';g.textBaseline='top';g.fillStyle=`rgba(159,220,224,${.95*fl})`;g.fillText('VIGIL // SHIP INTELLIGENCE',48,40);
  g.fillStyle=`rgba(159,220,224,${.5*fl})`;g.fillText('ELYRA · KEEPER COMMAND NET',48,80);g.fillRect(48,124,928,2);
  g.font='500 32px "JetBrains Mono",ui-monospace,monospace';let left=ST.typed,y=150;const shown=[];
  for(const ln of ST.screen){if(left<=0)break;shown.push({s:ln.s.slice(0,left),c:ln.c});left-=ln.s.length;}
  for(const ln of shown.slice(-9)){g.fillStyle=(ln.c||'rgba(205,235,235,A)').replace('A',.95*fl);g.fillText(ln.s,48,y);y+=46;}
  if(Math.sin(performance.now()/140)>0){g.fillStyle=`rgba(205,235,235,${fl})`;g.fillRect(48+g.measureText(shown.length?shown[shown.length-1].s:'').width+6,y-42,16,32);}
  if(ST.coords){g.font='700 54px "JetBrains Mono",ui-monospace,monospace';g.fillStyle=`rgba(232,70,60,${(.75+.25*Math.sin(performance.now()/180))*fl})`;g.fillText('N 36.7731°  E 14.9827°',60,Math.min(y+10,540));}
  if(ST.camFeed){g.fillStyle='#0a0f0c';g.fillRect(560,150,420,260);g.strokeStyle=`rgba(159,220,224,${.6*fl})`;g.strokeRect(560,150,420,260);g.fillStyle=`rgba(159,220,224,${.7*fl})`;g.font='500 20px monospace';g.fillText('CAM 04 · EXT',572,160);}
  g.fillStyle='rgba(0,0,0,.28)';for(let yy=0;yy<640;yy+=4)g.fillRect(0,yy,1024,1.6);D.scrTex.needsUpdate=true;}

/* =====================================================================================================================
   SET 2 · OUTSIDE (x +400): Tide City Command seen from a mast camera. Nobody. No vehicles. No lights.
   ===================================================================================================================== */
const X={};
function buildOutside(){
  const G=new THREE.Group();G.position.set(400,0,0);scene.add(G);X.G=G;
  const conc=STD(0xb0b4ae,{map:panelTexture('#8a8e88'),roughness:.9,metalness:.05}),dark=STD(0x3a3c3a,{roughness:.8});
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(400,400),STD(0x6a6c66,{roughness:.95,metalness:0}));gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;G.add(gnd);
  box(G,40,12,18,0,6,-30,conc);box(G,18,8,14,26,4,-28,conc);box(G,10,6,10,-24,3,-26,conc);   // the facility
  for(let x=-18;x<=18;x+=4)box(G,2.6,1.4,.2,x,8,-20.9,dark,false);for(let x=19;x<=33;x+=3.5)box(G,2,1.2,.2,x,5,-20.9,dark,false);
  box(G,4,5,.3,0,2.5,-20.8,dark,false);   // the doors
  const mast=new THREE.Group();mast.position.set(-12,12,-30);G.add(mast);box(mast,.4,9,.4,0,4.5,0,dark);const dish=new THREE.Mesh(new THREE.SphereGeometry(2.4,20,10,0,Math.PI*2,0,Math.PI/3),dark);dish.rotation.x=-1;dish.position.y=8.5;mast.add(dish);
  const pad=new THREE.Mesh(new THREE.RingGeometry(9,9.6,48),new THREE.MeshBasicMaterial({color:0x6a7068}));pad.rotation.x=-Math.PI/2;pad.position.set(26,.02,6);G.add(pad);
  for(let i=-6;i<=6;i++){box(G,.15,3,.15,i*7,1.5,18,dark);}box(G,90,.06,.06,0,2.6,18,dark,false);box(G,90,.06,.06,0,1.5,18,dark,false);   // the fence
  for(const [x,z] of[[-30,6],[0,8],[30,-6]]){box(G,.3,7,.3,x,3.5,z,dark);box(G,1.4,.2,.4,x+.6,7,z,dark);}   // lamp posts, dark
  const bar=box(G,4,.8,.5,-8,.4,10,STD(0x8a6a2a));bar.rotation.set(0,.4,1.3);
  // the thing outside: tall, thin, motionless, watching the building. One frame.
  const F=new THREE.Group();F.position.set(18,0,24);F.rotation.y=Math.PI;G.add(F);const blk=new THREE.MeshBasicMaterial({color:0x000000});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,6,8),blk);body.position.y=3.6;F.add(body);const hd=new THREE.Mesh(new THREE.SphereGeometry(.5,10,8),blk);hd.scale.set(.8,1.4,.8);hd.position.y=7.2;F.add(hd);
  for(const s of[-1,1]){const a=new THREE.Mesh(new THREE.CylinderGeometry(.12,.08,5.4,6),blk);a.position.set(s*.75,4,0);a.rotation.z=s*.05;F.add(a);const l=new THREE.Mesh(new THREE.CylinderGeometry(.18,.12,3,6),blk);l.position.set(s*.3,1,0);F.add(l);}
  F.visible=false;X.F=F;
  const sky=new THREE.HemisphereLight(0x8a9a9a,0x202420,1.3);G.add(sky);const moon=new THREE.DirectionalLight(0xc0d0c8,1.6);moon.position.set(460,60,40);moon.target.position.set(400,0,-20);G.add(moon,moon.target);X.lights=[sky,moon];
}

/* =====================================================================================================================
   SET 3 · THE HOLLOW (x -400): the tunnel from Archive 01 that breathes, the names, the chamber with the empty plinth,
   and what lives beyond it
   ===================================================================================================================== */
const H3={};
function buildHollow(){
  const G=new THREE.Group();G.position.set(-400,0,0);scene.add(G);H3.G=G;
  const R0=4.2,UP=R0*.5;
  const pts=[[0,0,0],[1.5,-.6,-14],[-1.5,-1.4,-28],[.5,-2.2,-42],[0,-3,-54]].map(p=>new THREE.Vector3(p[0],p[1]+UP,p[2]));
  const curve=new THREE.CatmullRomCurve3(pts),L=curve.getLength();H3.curve=curve;
  const RS=26,SEG=180,tube=new THREE.TubeGeometry(curve,SEG,R0,RS,false),P=tube.attributes.position,col=new Float32Array(P.count*3),v=new THREE.Vector3();
  for(let i=0;i<P.count;i++){const seg=Math.floor(i/(RS+1)),u=seg/SEG,ctr=curve.getPointAt(Math.min(1,u)),j=i%(RS+1),ang=j/RS*Math.PI*2;v.set(P.getX(i),P.getY(i),P.getZ(i)).sub(ctr);
    const rib=Math.pow(.5+.5*Math.cos(u*L/3.6*Math.PI*2),3),n=vnoise(P.getX(i)*.5+P.getY(i)*.3,P.getZ(i)*.5);
    v.multiplyScalar(1-.12*rib+.16*(n-.5)+.05*Math.sin(ang*3+u*30));P.setXYZ(i,ctr.x+v.x,ctr.y+v.y,ctr.z+v.z);
    const sh=.35+.4*(1-rib)+.3*n;col[i*3]=.18*sh;col[i*3+1]=.16*sh;col[i*3+2]=.2*sh;}
  tube.setAttribute('color',new THREE.BufferAttribute(col,3));tube.computeVertexNormals();
  const rock=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#8a8590';g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){const v=Math.random();g.fillStyle=`rgba(${v<.5?20:230},${v<.5?18:225},${v<.5?26:235},${Math.random()*.12})`;g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,1+Math.random()*14,1+Math.random()*5,Math.random()*3,0,7);g.fill();}
    g.strokeStyle='rgba(10,8,14,.35)';for(let i=0;i<60;i++){g.lineWidth=1+Math.random()*2;g.beginPath();let x=Math.random()*w,y=Math.random()*h;g.moveTo(x,y);for(let k=0;k<6;k++){x+=(Math.random()-.5)*60;y+=Math.random()*40;g.lineTo(x,y);}g.stroke();}});
  rock.wrapS=rock.wrapT=THREE.RepeatWrapping;rock.repeat.set(26,3);
  const flesh=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.BackSide,roughness:.72,metalness:.08,map:rock,bumpMap:rock,bumpScale:.06});H3.wall=new THREE.Mesh(tube,flesh);H3.wall.receiveShadow=true;G.add(H3.wall);
  H3.base=Float32Array.from(P.array);H3.tube=tube;
  // the floor: wet, a skin of water that catches the torch
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(6.6,64,8,64),new THREE.MeshStandardMaterial({color:0x15161b,roughness:.45,metalness:.2}));fl.rotation.x=-Math.PI/2;fl.position.set(0,-1.6,-27);
  const fp=fl.geometry.attributes.position;for(let i=0;i<fp.count;i++){const wz=-27-fp.getY(i);fp.setZ(i,floorAt(wz)+vnoise(fp.getX(i)*.6,wz*.6)*.08);}fl.geometry.computeVertexNormals();fl.receiveShadow=true;
  fl.position.set(0,-.02,-27);G.add(fl);H3.floor=fl;
  // the names: a plane of carved rock on the right wall; among them CPT. A. RHEN and, small, his own
  const tex=canvasTex(2048,1024,(g,w,h)=>{g.fillStyle='#2c2a30';g.fillRect(0,0,w,h);
    for(let i=0;i<1400;i++){g.fillStyle=Math.random()<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.035)';g.beginPath();g.arc(Math.random()*w,Math.random()*h,2+Math.random()*40,0,7);g.fill();}
    const SUR=['ADEYEMI','ALCOTT','BRANDT','CALLOWAY','DARROW','EKWUEME','FARRIS','GALLO','HAYES','IVERS','JANSEN','KOVAC','LANDRY','MARSH','NAKAMURA','OKAFOR','PRUITT','QUINLAN','REYES','SATO','THORNE','VANCE','WEBER','YOUNG','ZIMMER','BLACKWOOD','DUBOIS','FONTAINE','GRAVES','HOLLOWAY','KESTREL','MERCER','NOVAK','ORLOV','ROURKE','TALLIS','VOSS','WINTERS','BELLAMY','CROSS','DRAKE','FINCH','HALE','KANE','LOCKE','MORROW','NASH','STROUD'];
    const RK=['PVT','CPL','SGT','SPC','LT','ENS','CPL','PVT'];g.textAlign='center';let k=0;
    for(let row=0;row<16;row++)for(let col=0;col<7;col++){k++;let n=RK[k*7%8]+'. '+'ABCDEFGHJKLMNPRSTW'[k*5%18]+'. '+SUR[k*11%SUR.length],d=row<6?`${String(1+k*3%28).padStart(2,'0')}.${String(1+k%12).padStart(2,'0')}.${2190+k*7%47}`:'08.03.2237',me=false;
      if(row===8&&col===3){n='LT. MICHAEL HALL';d='16.03.2237';me=true;}else if(row===7&&col===3)n='CPT. A. RHEN';else if(row===7&&col===2)n='SGT. O. MARSH';
      const x=150+col*292+(row%2)*36,y=50+row*62;g.font='600 25px "Chakra Petch",sans-serif';g.fillStyle='rgba(255,255,255,.09)';g.fillText(n,x+2,y+2);g.fillStyle='rgba(6,6,8,.92)';g.fillText(n,x,y);
      g.font='500 19px monospace';g.fillStyle='rgba(6,6,8,.8)';g.fillText(d,x,y+24);if(me){H3.meUV=[x/w,1-(y+8)/h];}}
    const r=g.createRadialGradient(w/2,h/2,300,w/2,h/2,1100);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=r;g.fillRect(0,0,w,h);});
  const nw=new THREE.Mesh(new THREE.PlaneGeometry(9,4.5,24,12),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.55,metalness:.1,depthWrite:false}));
  const np=nw.geometry.attributes.position;for(let i=0;i<np.count;i++)np.setZ(i,Math.sin(np.getX(i)*.35)*.35+vnoise(np.getX(i),np.getY(i))*.1);nw.geometry.computeVertexNormals();
  const c30=curve.getPointAt(22/L);nw.position.set(c30.x+2.95,c30.y-.2,c30.z);nw.rotation.y=-Math.PI/2;G.add(nw);H3.names=nw;
  const slab=new THREE.Mesh(new THREE.PlaneGeometry(10.5,5.6),new THREE.MeshStandardMaterial({color:0x1c1a20,roughness:.8}));slab.position.set(c30.x+3.02,c30.y-.2,c30.z);slab.rotation.y=-Math.PI/2;G.add(slab);
  // where his name sits, in the Hollow's own space
  const u=H3.meUV||[.5,.5];H3.me=new THREE.Vector3(c30.x+2.9,c30.y-.2+(u[1]-.5)*4.5,c30.z+(u[0]-.5)*9);
  // the chamber at the bottom: the plinth from Archive 01, its dome dark, the Codex gone; an opening into the deep
  const CH=new THREE.Vector3(0,-3,-72);H3.CH=CH;
  // the chamber opens at its far end onto the drowned sea under the mountain (the same water as Archive 01)
  const cg=new THREE.SphereGeometry(18,56,32),cp=cg.attributes.position;for(let i=0;i<cp.count;i++){v.set(cp.getX(i),cp.getY(i),cp.getZ(i));const n=vnoise(v.x*.2+v.y*.1,v.z*.2);v.multiplyScalar(1+.12*(n-.5));if(v.y<-6)v.y=-6+(v.y+6)*.1;if(v.z<0)v.z*=1.9;cp.setXYZ(i,v.x,v.y*.75,v.z);}
  cg.computeVertexNormals();const ch=new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:0x221f28,side:THREE.BackSide,roughness:.8,metalness:.05,map:rock}));ch.position.set(CH.x,CH.y+4.5,CH.z);ch.receiveShadow=true;G.add(ch);
  const pl=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.7,1,32),STD(0x2a282e,{metalness:.3,roughness:.6}));pl.position.set(CH.x,CH.y+.5,CH.z);pl.castShadow=pl.receiveShadow=true;G.add(pl);
  const pd=new THREE.Mesh(new THREE.SphereGeometry(2,36,16,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0x8fb0e0,transparent:true,opacity:.1,roughness:.1,clearcoat:1,depthWrite:false,side:THREE.DoubleSide}));
  pd.position.set(CH.x,CH.y+1,CH.z);G.add(pd);H3.pdome=pd;
  const ledge=new THREE.Mesh(new THREE.BoxGeometry(34,2.2,.8),new THREE.MeshStandardMaterial({color:0x17161c,roughness:.9,map:rock}));ledge.position.set(CH.x,CH.y-1.1,CH.z-8);G.add(ledge);
  const sea=LEVIATHAN.makeWater(60,50,0x031a22);sea.mesh.position.set(CH.x,CH.y-1.5,CH.z-33);G.add(sea.mesh);H3.sea=sea;
  // the leviathan the Hollow King has tamed: under the water, eyes first
  const lev=LEVIATHAN.makeLeviathan();lev.root.scale.setScalar(.6);G.add(lev.root);H3.lev=lev;H3.cr=lev.root;
  const levTop=new THREE.SpotLight(0x5ad0e0,0,90,.5,.7,1.2);levTop.position.set(CH.x,CH.y+22,CH.z-24);levTop.target.position.set(CH.x,CH.y-3,CH.z-30);G.add(levTop,levTop.target);H3.levTop=levTop;
  const deepL=new THREE.PointLight(0x2aa8c0,0,60,1.4);deepL.position.set(CH.x,CH.y+1,CH.z-22);G.add(deepL);H3.deepL=deepL;
  // under the surface (what the dome shows Michael for a fraction of a second): shafts of light, motes in the water
  const rays=new THREE.Group();rays.visible=false;G.add(rays);H3.rays=rays;
  for(let k=0;k<7;k++){const r=new THREE.Mesh(new THREE.CylinderGeometry(.4,2.4,30,16,1,true),new THREE.MeshBasicMaterial({color:0x5ad8e0,transparent:true,opacity:.014,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
    r.position.set(CH.x-12+k*4,CH.y-14,CH.z-30-k*2);r.rotation.z=.15-k*.04;rays.add(r);}
  for(let k=0;k<80;k++){const m=glowSprite(0x8fe8ff,.18,1.2);m.position.set(CH.x+(Math.random()-.5)*30,CH.y-3-Math.random()*18,CH.z-14-Math.random()*30);rays.add(m);}
  // light down here: a cold blue from the chamber, the torch, nothing else
  const blue=new THREE.PointLight(0x5a62ff,0,60,1.4);blue.position.set(CH.x,CH.y+6,CH.z);G.add(blue);H3.blue=blue;
  const amb=new THREE.HemisphereLight(0x5a5070,0x08060c,0);G.add(amb);H3.amb=amb;
  const torch=new THREE.SpotLight(0xfff0dc,0,40,.38,.5,1.2);torch.castShadow=true;torch.shadow.mapSize.set(1024,1024);torch.shadow.bias=-.001;G.add(torch,torch.target);H3.torch=torch;
  const tg=glowSprite(0xfff2dc,.25,1.4);G.add(tg);H3.torchGlow=tg;
  const rim=new THREE.PointLight(0x7a84ff,.7,5,2);G.add(rim);H3.rim=rim;
  // Michael, here with a torch in his right hand
  const H=makeHuman('marine');G.add(H.root);H3.H=H;MODELS.dress(H,'hero',{unarmed:true,tint:0x8f8a82});
  H3.m={x:0,z:-16,yaw:0,aim:0,speed:0};
}
function poseHollow(dt){const m=H3.m,H=H3.H,c=H3.curve;
  poseHuman(H,dt,m.speed,1,false);
  // the left arm drops; the right holds the torch out in front
  H.arms[0].sh.rotation.set(.1,0,.1);H.arms[0].el.rotation.set(-.2,0,0);H.arms[1].sh.rotation.x=1.25+m.aim*.5;H.arms[1].el.rotation.x=-.9;
  const fy=floorAt(m.z);H.root.position.set(m.x,fy,m.z);H.root.rotation.y=m.yaw;H.head.rotation.x=-m.aim*.4;
  // the torch sits in his hand and points where he points
  H.root.updateMatrixWorld(true);const hp=new THREE.Vector3(0,-.32,0);H.arms[1].el.localToWorld(hp);H3.G.worldToLocal(hp);
  const dir=new THREE.Vector3(-Math.sin(m.yaw),-m.aim*.5,-Math.cos(m.yaw)).normalize();
  H3.torch.position.copy(hp);if(ST.torchAt)H3.torch.target.position.copy(ST.torchAt);else H3.torch.target.position.copy(hp).addScaledVector(dir,10);
  H3.torchGlow.position.copy(hp).addScaledVector(dir,.15);H3.torchGlow.visible=!ST.torchAt&&camera.position.distanceTo(H3.torchGlow.getWorldPosition(new THREE.Vector3()))>2.5;
  H3.rim.position.set(m.x+Math.sin(m.yaw)*1.2,fy+2.3,m.z+Math.cos(m.yaw)*1.2);H3.rim.intensity=ST.blue>.1?.8:0;}
function floorAt(z){return z>-54?-(Math.min(54,-z)/54)*3:-3;}

/* =====================================================================================================================
   THE STATE the scripts change, and the frame that paints it
   ===================================================================================================================== */
let ST=null,TW=[];
function freshState(){return{t:0,set:'deck',red:0,redF:1,dome:0,domeOn:0,domeF:0,term:0,termF:1,lightsOut:0,screen:[],typed:0,coords:false,camFeed:false,
  figure:0,blue:0,eyes:0,torchAt:null,torch:0,torchF:1,breath:1,amb:0,cam:{p:new THREE.Vector3(),l:new THREE.Vector3()},shake:0};}
const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
function tw(o,k,to,dur,lin){TW=TW.filter(q=>!(q.o===o&&q.k===k));TW.push({o,k,from:o[k],to,dur:Math.max(.001,dur),t:0,lin});}
function stepTw(dt){for(const q of TW){q.t+=dt;const u=Math.min(1,q.t/q.dur);q.o[q.k]=q.from+(q.to-q.from)*(q.lin?u:ease(u));}TW=TW.filter(q=>q.t<q.dur);}
// a shot: the camera moves from one place to another over the shot's length (world coordinates of that set)
let SHOT=null;
function shot(set,p0,l0,p1,l1,dur){ST.set=set;SHOT={p0:new THREE.Vector3(...p0),l0:new THREE.Vector3(...l0),p1:new THREE.Vector3(...(p1||p0)),l1:new THREE.Vector3(...(l1||l0)),dur:dur||6,t:0};
  root.classList.toggle('cctv',set==='out');}
const OFF={deck:[0,0,0],out:[400,0,0],hollow:[-400,0,0],glimpse:[-400,0,0]};
let raf=0,last=0;
function frame(now){if(!ST){raf=0;return;}raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-(last||now))/1000);last=now;ST.t+=dt;stepTw(dt);const t=ST.t;
  // camera
  if(SHOT){SHOT.t+=dt;const u=ease(Math.min(1,SHOT.t/SHOT.dur)),o=OFF[ST.set];camera.position.lerpVectors(SHOT.p0,SHOT.p1,u).add(new THREE.Vector3(...o));
    const l=new THREE.Vector3().lerpVectors(SHOT.l0,SHOT.l1,u).add(new THREE.Vector3(...o));
    if(!still){camera.position.x+=Math.sin(t*.7)*.012;camera.position.y+=Math.sin(t*.9)*.01;}if(ST.shake>0){camera.position.x+=(Math.random()-.5)*.08*ST.shake;camera.position.y+=(Math.random()-.5)*.06*ST.shake;}
    camera.lookAt(l);}
  // the deck
  scene.fog.density=ST.set==='glimpse'?.06:ST.set==='hollow'?.014:ST.set==='out'?.006:.0016;scene.fog.color.setHex(ST.set==='glimpse'?0x02141a:0x020306);scene.background.copy(scene.fog.color);renderer.toneMappingExposure=ST.set==='glimpse'?.55:ST.set==='hollow'?.95:1.15;
  if(ST.set==='deck'){D.G.visible=true;X.G.visible=H3.G.visible=false;
    const rl=ST.red*ST.redF*(.75+.25*Math.sin(t*2.3))*(1-ST.lightsOut);D.red.intensity=rl*6;D.redGlow.material.opacity=rl;D.lens.material.color.setRGB(.25+rl,.03+rl*.1,.02);
    const pulse=Math.pow(Math.max(0,Math.sin(t*1.9)),8),dl=Math.min(1.6,ST.dome*(.25+.75*pulse)+ST.domeOn*.9+ST.domeF);
    D.under.intensity=dl*6;D.core.material.opacity=Math.min(1,dl);D.dome.material.opacity=.12+.18*Math.min(1,dl);D.ring.material.color.setRGB(.2+.3*dl,.5+.4*dl,.6+.4*dl);
    D.hm.opacity=.6*ST.domeOn;D.blip.material.opacity=ST.domeOn*(.6+.4*Math.sin(t*9));D.holo.rotation.y+=dt*.35;const a=t*.8;D.blip.position.set(Math.cos(a)*.9,Math.sin(a)*.3,Math.sin(a)*.9);
    D.scrLight.intensity=ST.term*ST.termF*(1-ST.lightsOut)*2.2;D.amb.intensity=.18*(1-ST.lightsOut*.8);
    if(D.beacons)D.beacons.forEach((b,i)=>b.material.opacity=Math.sin(t*2+i)>.6?1:.15);
    drawScreen();poseDeck(dt);}
  else if(ST.set==='out'){X.G.visible=true;D.G.visible=H3.G.visible=false;X.F.visible=ST.figure>0;
    hudEl.querySelector('.d').textContent='11.03.2260  03:14:'+String(22+Math.floor(t)%38).padStart(2,'0');hudEl.querySelector('.r').style.opacity=Math.sin(t*4)>0?1:0;}
  else if(ST.set==='hollow'||ST.set==='glimpse'){H3.G.visible=true;D.G.visible=X.G.visible=false;
    // the tunnel breathes
    const P=H3.tube.attributes.position,B=H3.base,k=1+.025*Math.sin(t*1.05)*ST.breath;if(!still){for(let i=0;i<P.count;i++){const j=i*3;P.array[j]=B[j]*k;P.array[j+1]=(B[j+1]-2.1)*k+2.1;}P.needsUpdate=true;}
    H3.blue.intensity=ST.blue*4;H3.amb.intensity=ST.amb;H3.torch.intensity=ST.torch*ST.torchF*4.5;H3.torchGlow.material.opacity=ST.torch*ST.torchF;
    H3.lev.setEyes(ST.eyes);H3.lev.setLights(ST.eyes*.8);H3.lev.update(t,dt);H3.sea.update(t);H3.levTop.intensity=ST.eyes*2.6;H3.deepL.intensity=ST.eyes*1.4;H3.rays.visible=ST.set==='glimpse';
    if(ST.set==='glimpse'){H3.blue.intensity=.6;H3.amb.intensity=.12;H3.lev.setEyes(1);H3.lev.setLights(1);H3.levTop.intensity=2.2;}else H3.blue.color.setHex(0x5a62ff);
    poseHollow(dt);}
  else{D.G.visible=X.G.visible=H3.G.visible=false;}
  if(composer)composer.render();else renderer.render(scene,camera);}

/* =====================================================================================================================
   THE SCRIPTS (word for word from Bryce's pages; line IDs in the script doc: C1-, C2-, C3-)
   ===================================================================================================================== */
const ABORT={};let RUN=null;
const chk=()=>{if(!RUN||RUN.dead)throw ABORT;};
const w=s=>Promise.race([new Promise(r=>setTimeout(r,s*1000)),RUN.skipP]).then(chk);
function sub(who,text,cls){if(!who){subEl.classList.remove('on');return;}subEl.className='sub on'+(cls?' '+cls:'');subEl.querySelector('b').textContent=who;subEl.querySelector('span').textContent=text;}
async function say(who,text,tone,after){chk();const human=who==='ELYRA'&&tone==='human';sub(human?'ELYRA ·· signal degraded':who==='Lt. Michael'?'Lt. Michael Hall':who,text,human?'x':who==='ELYRA'?'':'m');
  if(human)AU.fx.crackle(Math.min(3,text.length/12));await Promise.race([V.say(who,text,tone),RUN.skipP]);chk();sub(null);if(after)await w(after);}
const M=(t,tone,a)=>say('Lt. Michael',t,tone,a==null?.5:a),E=(t,tone,a)=>say('ELYRA',t,tone,a==null?.5:a);
function scr(s,c){ST.screen.push({s,c});}
let typer=0;function typeOn(){clearInterval(typer);typer=setInterval(()=>{if(!ST)return clearInterval(typer);const tot=ST.screen.reduce((a,l)=>a+l.s.length,0);if(ST.typed<tot){ST.typed+=2;if(ST.typed%6===0)AU.fx.type();}},34);}
async function title(html,cls,hold){titleEl.className='title'+(cls?' '+cls:'');titleEl.innerHTML=html;await w(.05);titleEl.classList.add('on');await w(hold);titleEl.classList.remove('on');await w(1.7);}
function black(on,s){blackEl.style.transition=`opacity ${s||0}s`;blackEl.style.opacity=on?1:0;}
async function redOn(){AU.fx.relay();for(const[v,d]of[[.8,.09],[0,.16],[.5,.07],[0,.32],[1,.06],[.3,.05],[1,0]]){ST.red=v;if(d)await w(d);}ST.red=1;}
async function glitch(s){glx.classList.add('on');await w(s);glx.classList.remove('on');}
// walking: move him from where he is to (x, z) over sec seconds, legs going
function walk(m,x,z,sec,yaw){if(yaw!=null)tw(m,'yaw',yaw,Math.min(.6,sec));tw(m,'x',x,sec,true);tw(m,'z',z,sec,true);m.speed=1.4;
  let n=0;const id=setInterval(()=>{if(!ST||++n*.1>=sec){clearInterval(id);m.speed=0;return;}if(n%5===0)AU.fx.footstep();},100);}
// camera presets on the deck (the deck's own coordinates)
const CAM={
  wide:[[7,3.4,5],[-1.5,1.2,-4]], wide2:[[6,3,3.4],[-2,1.1,-4.5]],
  side:[[-.4,1.7,-3.2],[-3,1.3,-4.8]], close:[[-1.7,1.55,-3.7],[-3,1.45,-4.7]],
  ots:[[-2.35,2.05,-3.55],[-3,1.4,-6.2]], ots2:[[-2.5,1.95,-3.85],[-3,1.42,-6.2]],
  dome:[[-.2,2.1,-1],[2.6,1.4,-3.4]], domeC:[[1.1,1.75,-1.6],[2.6,1.5,-3.4]], back:[[-6,2.2,-1],[1,1.4,-3.6]],
};
const sh=(k,k2,dur)=>shot('deck',CAM[k][0],CAM[k][1],k2?CAM[k2][0]:null,k2?CAM[k2][1]:null,dur);

/* ---------- 01 · THE CALL ---------- */
async function T1(){
  const m=D.m;Object.assign(m,{x:-3,z:-4.62,yaw:0,sit:1,head:0,lean:0,speed:0});ST.dome=.35;ST.term=.85;
  black(true);await w(3.2);AU.humOn(.09,3);await w(3);
  sh('wide','wide2',16);black(false,1.4);await redOn();await w(1.6);
  sh('side','close',9);await w(1.6);
  await M('ELYRA.','tired',2.6);
  await M('Come online.','tired',.6);
  AU.fx.boot();for(const v of[.2,1,.4,1.2,1])ST.termF=v,await w(.08);ST.termF=1;
  sh('ots','ots2',10);scr('> ELYRA');scr('BOOT ............ OK');typeOn();await w(1.4);
  scr('SYSTEMS OPERATIONAL','rgba(140,240,176,A)');await E('Systems are operational.',null,1.4);
  sh('close',null,6);tw(m,'head',-1.1,1.4);await w(1.2);
  await M('Where are we?','tired',1.2);
  sh('ots','ots2',8);tw(m,'head',0,.8);scr('> QUERY: POSITION');await w(.9);scr('LOCATION ........ UNAVAILABLE','rgba(232,200,120,A)');await E('Location unavailable.',null,.9);
  tw(m,'lean',1,1.6);await w(.8);
  await M('That’s not what I asked.',null,1.5);
  await M('Where is the Hollow?',null,.4);
  AU.humOn(.035,2.5);await w(2.8);
  scr('> QUERY: "HOLLOW"');await w(.8);scr('PLEASE CLARIFY');await E('Please clarify.',null,.8);
  sh('close',null,6);await M('The cave.','sharp',2.2);
  await M('Where we found it.',null,.4);
  sh('ots','ots2',6);scr('SEARCHING ░░░░░░░░░░');AU.fx.process(3);
  for(let i=1;i<=10;i++){ST.screen[ST.screen.length-1].s='SEARCHING '+'▓'.repeat(i)+'░'.repeat(10-i);await w(.32);}
  scr('NO MATCH · "HOLLOW CAVE"','rgba(232,70,60,A)');
  await E('I cannot identify a location designated “Hollow Cave.”',null,1.2);
  sh('side','close',9);await M('You’ve been there.',null,1.8);
  await M('You took us there.',null,.4);
  sh('ots',null,5);scr('TRANSPORT LOG ··· 0 RECORDS');await w(.6);
  await E('I have no record of transporting personnel to that location.',null,1.4);
  // he turns to the dome
  sh('back','dome',7);tw(m,'lean',0,1);tw(m,'yaw',-.6,1.6);tw(m,'head',-.9,1.6);await w(1.8);
  await M('Then who did?','tired',.3);await E('No vessel I command has been there.',null,1.2);
  AU.fx.pulse();for(const v of[1.2,0,.8,0,1.4,0])ST.domeF=v,await w(.07);ST.domeF=0;await w(.9);
  // he stands
  sh('wide2',null,5);tw(m,'sit',0,1.6);tw(m,'head',0,1);await w(1.7);
  await M('ELYRA.','sharp',2.4);
  walk(m,1,-3.1,4.2,-Math.PI/2);tw(ST,'dome',1,4.4,true);sh('back','dome',4.6);
  await w(2.2);await M('Give me the coordinates.',null,0);await w(.4);
  sh('domeC',null,8);await E('Michael—',null,1.8);
  await M('Give me the coordinates.','sharp',.3);
  await E('I cannot.',null,.5);
  await M('Why?',null,0);
  AU.humOff(1.5);await w(3.6);
  await E('Because you are already there.','soft',.2);
  await w(1.6);
  AU.fx.lightsOff();ST.lightsOut=1;ST.red=0;ST.term=0;ST.dome=0;await w(.9);
  AU.fx.surge();tw(ST,'domeOn',1,.5);tw(ST,'domeF',1,.5);sh('dome','domeC',1.2);await w(.7);
  // for a fraction of a second: inside the Hollow
  AU.fx.glitch();glitch(.5);const back=ST.set;ST.set='glimpse';H3.cr.position.set(0,-11.5,-100);SHOT={p0:new THREE.Vector3(-2,-9,-80),l0:new THREE.Vector3(0,-10,-92),p1:new THREE.Vector3(-1.6,-9.2,-81.5),l1:new THREE.Vector3(0,-10,-92),dur:.5,t:0};
  ST.eyes=1;await w(still?.6:.35);ST.eyes=0;black(true);sub(null);await w(2.6);
  AU.fx.boom();await title('ELYRA: THE HOLLOW',null,4.2);
}

/* ---------- 02 · THE RETURN ---------- */
async function T2(){
  const m=D.m;Object.assign(m,{x:-3,z:-4.62,yaw:0,sit:1,head:0,lean:0,speed:0});ST.dome=.7;ST.domeOn=.9;ST.term=1;
  black(true);await w(3);AU.humOn(.09,3);await w(3);
  sh('wide','wide2',12);black(false,1.4);await redOn();await w(2);
  sh('ots','ots2',9);scr('> NAV · LAST KNOWN');scr('COORDINATES');ST.typed=999;ST.coords=true;typeOn();await w(2.2);
  await M('That’s not possible.',null,.9);
  scr('> PLEASE SPECIFY');await E('Please specify.',null,.6);
  await M('These coordinates.',null,1.6);
  await M('They’re different.',null,.6);
  scr('NEGATIVE');await E('Negative.',null,1);
  sh('back','dome',6);tw(m,'yaw',-.5,1.2);tw(m,'head',-.8,1.2);await w(1);
  await M('No.','tired',1);
  sh('ots','ots2',8);tw(m,'yaw',0,.8);tw(m,'head',0,.8);tw(m,'lean',1,1.4);await w(1);
  await M('They weren’t there before.',null,.6);
  scr('UNCHANGED · 0 REVISIONS');await E('Those coordinates have remained unchanged.',null,1.4);
  await M('How long?',null,2.2);
  scr('LAST REVISION · 11.03.2237 · 23 YRS','rgba(232,200,120,A)');await E('Twenty-three years.',null,1.2);
  // he stands, turns away from the desk
  sh('wide2','wide',6);tw(m,'lean',0,.6);tw(m,'sit',0,1.6);await w(1.2);tw(m,'yaw',Math.PI*.8,2);await w(2.2);
  await M('That’s impossible.',null,.5);
  scr('STATEMENT LOGGED');await E('Your statement has been logged.',null,1);
  sh('close',null,6);tw(m,'yaw',0,1.4);await w(1.4);
  await M('I was there yesterday.',null,1.8);
  await E('Negative.',null,.5);
  await M('What?','sharp',.4);
  sh('ots2',null,5);scr('PERSONNEL · M. HALL · ON SITE');await E('You have not left the facility.',null,1.2);
  await M('Open the camera.',null,.4);
  // the camera outside: nothing, nobody, no lights
  AU.fx.stat(.25);shot('out',[-30,22,52],[2,4,-24],[-26,21,48],[4,4,-22],20);await w(3.6);
  await M('How long has the facility been empty?','tired',3);
  await E('Since the incident.',null,.4);
  await M('What incident?',null,2.4);
  await M('Elyra.',null,1.6);
  await M('What incident?','sharp',.6);
  AU.fx.thump();AU.fx.glitch();glitch(.35);await w(.35);ST.figure=1;await w(still?.4:.2);ST.figure=0;glitch(.25);await w(.75);
  await M('...What the hell was that?','whisper',1.4);
  sh('ots',null,5);scr('> MICHAEL.','rgba(232,70,60,A)');await w(.4);
  await E('Michael.',null,1);
  await E('Do not use the Spear.','soft',1.4);
  sh('close',null,5);
  await M('The Spear? Why?','whisper',.2);
  black(true);AU.humOff(.05);sub(null);await w(2.2);
  await title('ACCESS RECORD: MICHAEL — 17 ENTRIES','rec',4.4);
}

/* ---------- 03 · THE HOLLOW · the night before Tide City (after Archive 02). He goes back down, alone ---------- */
async function T3(){
  const m=H3.m;Object.assign(m,{x:0,z:-14,yaw:0,aim:0,speed:0});ST.torch=0;ST.blue=0;ST.amb=0;ST.eyes=0;
  shot('hollow',[1.8,1.5,-10.5],[-.2,1.6,-16]);black(true);
  await w(1.6);AU.breathe(true,1);await w(3);
  await M('Elyra...','whisper',.2);AU.fx.stat(.6);await w(1.2);
  await M('Are you there?','whisper',2.4);
  await M('Please.','whisper',2.2);
  // a faint blue: he isn't in the office. He's in the Hollow
  tw(ST,'blue',.5,5);tw(ST,'amb',.08,5);black(false,3.2);await w(1.6);
  AU.fx.relay();ST.torch=1;shot('hollow',[1.8,1.5,-10.5],[-.2,1.6,-16],[1.2,1.6,-11.5],[0,1.8,-20],9);
  const sweep=setInterval(()=>{if(!ST)return clearInterval(sweep);if(RUN&&!RUN.hold)m.yaw=Math.sin(ST.t*.6)*.35;},40);
  walk(m,0,-19,5);await w(3);
  await M('I found it.','whisper',.2);AU.fx.stat(.3);await w(.6);
  await M('I found the entrance.','whisper',1.2);
  RUN.hold=true;tw(m,'yaw',0,.6);
  await E('Michael.','human',.2);
  AU.breathe(false);await w(.8);
  shot('hollow',[-1.2,1.7,-24],[0,1.5,-19]);
  await M('How did you know my name?','whisper',2);
  tw(m,'yaw',Math.PI*.9,.8);await w(1.6);tw(m,'yaw',0,.8);await w(.9);   // behind him: nothing
  await M('Elyra?','whisper',.4);
  await E('You shouldn’t have come back.','human',.8);
  await M('Back?','whisper',.6);
  // the torch catches something carved in the rock
  walk(m,.2,-23.6,2.4,-Math.PI/2);tw(m,'aim',.15,1.4);
  shot('hollow',[-.6,1.8,-19],[3,1.7,-23],[0,1.7,-20.6],[3.4,1.6,-22.4],5);await w(3);
  AU.breathe(true,.95);
  const me=H3.me;ST.torchAt=new THREE.Vector3(me.x,me.y+.4,me.z+2.6);tw(ST.torchAt,'z',me.z+.9,4);tw(ST.torchAt,'y',me.y+.2,4);
  shot('hollow',[me.x-3.1,me.y+.6,me.z+2.4],[me.x,me.y+.3,me.z+1.4],[me.x-2.2,me.y+.25,me.z+.9],[me.x,me.y,me.z+.3],5);await w(1.8);
  await M('No...','whisper',.6);
  tw(ST.torchAt,'z',me.z,2.5);tw(ST.torchAt,'y',me.y,2.5);ST.torch=.7;shot('hollow',[me.x-1.6,me.y+.05,me.z+.25],[me.x,me.y,me.z],[me.x-1.15,me.y,me.z+.02],[me.x,me.y-.02,me.z],7);await w(2.8);
  await M('That’s...','whisper',1.2);
  await M('That’s tomorrow.','whisper',2.2);
  AU.breathe(false);ST.torch=1;ST.torchAt=null;
  await E('Michael.','human',.1);
  // the cave behind him is no longer empty
  H3.cr.position.set(0,-14,-100);tw(H3.cr.position,'y',-4.3,4);tw(m,'yaw',0,1);tw(m,'aim',0,1);walk(m,0,-24,1);
  shot('hollow',[1.6,1.8,-21],[0,-1,-70],[1.2,1.9,-22],[0,-3,-88],9);tw(ST,'eyes',1,2.6);await w(2.6);
  await M('What is that?','whisper',1.8);
  await M('Elyra.','whisper',1.4);
  await M('Tell me what that is.','whisper',.8);
  await E('It is not the Hollow.','human',.6);
  await M('Then what is it?','whisper',3);
  await E('It has been trying to warn you.','human',.8);await M('About what?','whisper',1.2);await E('The Spear.','human',.6);
  // the torch flickers; it moves away from him, as if something behind him has frightened it
  const fl=setInterval(()=>{if(!ST)return clearInterval(fl);ST.torchF=Math.random()<.35?Math.random()*.3:1;},70);await w(1.2);
  AU.fx.creature();tw(H3.cr.position,'z',-120,3.4);tw(H3.cr.position,'y',-15,3.4);tw(ST,'eyes',0,3.4);ST.shake=.6;await w(2);clearInterval(fl);ST.torchF=1;ST.shake=0;
  shot('hollow',[.2,1.7,-27],[0,1.6,-22]);tw(m,'yaw',Math.PI,3.2,true);await w(3.4);
  black(true);sub(null);await w(1.4);
  await M('...Oh my God.','whisper',2.6);
  await title('ELYRA: THE HOLLOW',null,4.2);
}

/* ---------- running one ---------- */
function build(){if(built)return;built=true;mount();buildDeck();buildOutside();buildHollow();}
function skip(){if(!RUN||RUN.dead)return;RUN.dead=true;RUN.skipRes();V.hush();}
const key=e=>{if(!RUN)return;if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();e.stopPropagation();skip();}else root.querySelector('.skip').hidden=false;};
async function play(n,opts){opts=opts||{};
  build();if(RUN)return;RUN={n,dead:false};RUN.skipP=new Promise(r=>RUN.skipRes=r);
  ST=freshState();TW=[];SHOT=null;root.hidden=false;root.classList.remove('cur','cctv');root.querySelector('.skip').hidden=true;sub(null);titleEl.className='title';black(true);
  H3.cr.position.set(0,-14,-100);X.F.visible=false;
  last=0;if(!raf)raf=requestAnimationFrame(frame);addEventListener('keydown',key,true);
  AU.start();AU.stopMusic(.6);
  try{if(opts.noscript)await RUN.skipP;else await[T1,T2,T3][n-1]();}catch(e){if(e!==ABORT)console.error(e);}
  removeEventListener('keydown',key,true);V.hush();AU.stopScene();clearInterval(typer);sub(null);
  root.style.transition='opacity .9s';root.style.opacity='0';const r=RUN;RUN=null;
  setTimeout(()=>{root.hidden=true;root.style.opacity='';root.style.transition='';ST=null;},950);
  if(opts.done)opts.done(r&&r.dead);}
return{play,NAMES,get on(){return!!RUN;},_dbg:()=>({H3,ST,camera,shot,black})};
})();
