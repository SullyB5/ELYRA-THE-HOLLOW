/* Elyra · the recovered footage, in 3D. Three short scenes that sit with the archives on the menu (and that the menu plays on
   its own when it is left alone long enough, js/menu/the-call.js):
     01 · THE CALL    the command deck at Tide City Command, empty, one red emergency light. Michael asks ELYRA where the Hollow is.
     02 · THE RETURN  the same room, the dome already awake. Twenty-three years. The camera outside, and its record of the Spear firing.
     03 · THE HOLLOW  the night before Tide City (after Archive 02). Michael goes back down to the chamber from Archive 01, alone,
                    and the Drowned Watcher tries to warn him off the Spear. His name on the wall is dated the day of Tide City.
     04 · NO CONTACT · 05 · THE BEACON · 06 · THE WHITE CITY   the Pathfinder's own recordings (sets 4 and 5).
     07 · THE PRISONERS  under the King's mountain, the night after the White City. The Hollow King tries to feed Rhen's team to the
                    Drowned Watcher; it refuses them. Their names go on the wall. Rhen calls Tide City, and the cave says a name back.
                      The names on the wall, his own, dated tomorrow, and what the Hollow is the shell of.
   One three.js scene holds three sets, far apart: the deck (at the origin), the facility seen from outside (x +400), the Hollow (x -400).
   Michael is the Keeper Marine model (js/shared/models.js) on the code rig (js/origin/02-people.js), posed here: sitting, turning,
   walking, holding up a torch. Sound and voices: js/menu/call-sound.js. FOOTAGE.play(n,{done}) · Enter, Esc or Skip end it. */
const FOOTAGE=(()=>{
const AU=CALL_AU,V=CALL_V,still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAMES=['','FIRST SIGNAL','HOMEBOUND','HOLLOW KING','NO CONTACT','LIGHT IN THE DARK','THE WHITE CITY','TAKEN'];

/* ---------- the overlay: the canvas, letterbox, grain, subtitles, title, skip ---------- */
const css=document.createElement('style');css.textContent=`
#ftg{position:fixed;inset:0;z-index:50;background:#000;overflow:hidden;cursor:none}#ftg.cur{cursor:auto}
#ftg canvas.gl{position:absolute;inset:0;width:100%;height:100%;display:block;transition:filter .1s}
#ftg.cctv canvas.gl{filter:grayscale(1) sepia(.35) hue-rotate(55deg) saturate(1.6) contrast(1.25) brightness(1.5)}
#ftg .bar{position:absolute;left:0;right:0;height:9vh;background:#000;z-index:3}#ftg .bar.t{top:0}#ftg .bar.b{bottom:0}
#ftg .grain{position:absolute;inset:-50%;z-index:2;pointer-events:none;opacity:.09;animation:fgr .5s steps(5) infinite;mix-blend-mode:screen}
#ftg.cctv .grain{opacity:.22}
#ftg.helm canvas.gl{filter:contrast(1.12) saturate(.85)}#ftg.helm .hud{display:block}#ftg.helm .grain{opacity:.15}#ftg.helm .vig{background:radial-gradient(ellipse at center,rgba(0,0,0,0) 38%,rgba(0,0,0,.85) 100%)}
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

/* ---------- the night: Bryce's alien sky over Elyra (its upper half, js/shared/skies.js), a star field over it ---------- */
function nightSky(G,R,exp){
  const U={photo:{value:null},k:{value:0},exp:{value:exp||1}};
  const m=new THREE.Mesh(new THREE.SphereGeometry(R,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec3 vD;uniform sampler2D photo;uniform float k,exp;void main(){vec3 d=normalize(vD);float y=max(d.y,0.0);
      vec3 c=mix(vec3(.035,.05,.09),vec3(.008,.012,.03),pow(y,.6));
      if(k>0.0){float el=asin(clamp(d.y,0.0,1.0))/1.5707963;vec3 p=pow(texture2D(photo,vec2(atan(d.z,d.x)/6.2831853+.5,asin(clamp(d.y,-1.0,1.0))/3.1415927+.5)).rgb,vec3(2.2))*exp;p=p/(1.0+p);c=mix(c,max(c,p),k*smoothstep(-.6,.1,d.y));}
      gl_FragColor=vec4(c,1.0);}`}));
  m.renderOrder=-3;G.add(m);
  SKIES.load('elyra',t=>{U.photo.value=t;U.k.value=1;});
  const N=1600,pp=new Float32Array(N*3);for(let i=0;i<N;i++){const az=Math.random()*Math.PI*2,el=.05+Math.pow(Math.random(),.7)*1.4,r=R*.95;pp.set([Math.cos(az)*Math.cos(el)*r,Math.sin(el)*r,Math.sin(az)*Math.cos(el)*r],i*3);}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pp,3));
  G.add(new THREE.Points(sg,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,color:0xdfe6ff,transparent:true,opacity:.75,depthWrite:false,fog:false})));
  return m;}
let ENV=null;   // a soft room reflection for the metal and the floor (three's RoomEnvironment, loaded with the footage)
function envMap(){if(ENV||!THREE.RoomEnvironment)return ENV;try{const pm=new THREE.PMREMGenerator(renderer);ENV=pm.fromScene(new THREE.RoomEnvironment(),.04).texture;}catch(e){ENV=null;}return ENV;}
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
  const deadParts=[];   // stand-ins until Bryce's supercomputers arrive (below)
  for(const s of[-1,1])for(const z of[-5,-1.5,2,5.5]){const b=box(G,1.2,1.1,2.6,s*11,.55,z,dark);const sc=box(G,.05,1,2.2,s*11.35,1.75,z,scr);sc.rotation.z=s*.25;deadParts.push(b,sc);}
  // the window: glass, the bay at night, the city with only a few lights left, the Spear of Destiny
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(24,5.8),new THREE.MeshStandardMaterial({color:0x8ab0d0,transparent:true,opacity:.07,roughness:.05,metalness:.9}));glass.position.set(0,4,-9);G.add(glass);
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshStandardMaterial({color:0x050b14,roughness:.18,metalness:.85}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-6,-1400);G.add(sea);
  // Tide City through the glass: the shared skyline (tiered towers, glass towers, the old pearl-and-gold Keeper towers), most of it dark
  nightSky(G,1800,1.1);
  if(typeof SKYLINE!=='undefined'){const near=SKYLINE.build({n:70,h:300,w:46,unit:7,lit:.13,water:-6,seed:37,traffic:4,place:(i,r)=>{const a=(r()-.5)*1.7,rr=170+r()*520;return[Math.sin(a)*rr,-9-Math.cos(a)*rr,1-rr/700];}});G.add(near.G);
    const far=SKYLINE.build({n:60,h:240,w:52,unit:9,lit:.12,water:-6,seed:91,traffic:0,rings:false,place:(i,r)=>{const a=(r()-.5)*2.2,rr=760+r()*600;return[Math.sin(a)*rr,-9-Math.cos(a)*rr,.1];}});G.add(far.G);D.sky=[near,far];}
  const sp=new THREE.Group();sp.position.set(160,-6,-520);G.add(sp);
  {const s1=new THREE.Mesh(new THREE.CylinderGeometry(3,10,260,6),STD(0xd8d2c4,{roughness:.4,metalness:.5,emissive:0x111008}));s1.position.y=130;sp.add(s1);
   const t=glowSprite(0xffd890,50,1.6);t.position.y=268;sp.add(t);D.spearTip=t;}
  const moon=new THREE.DirectionalLight(0x6f86c0,.45);moon.position.set(-20,30,-60);G.add(moon);
  // the room, dressed: ceiling beams with dead light panels, pilasters with standby strips, a gold rail round the holo table,
  // Keeper banners on the back wall, cable runs, chairs left at the consoles, a few amber standby lights still blinking
  const env=envMap();for(const mt of[floor,trim,dark,wall])if(env){mt.envMap=env;mt.envMapIntensity=mt===floor?.5:.14;mt.needsUpdate=true;}
  const panelOff=new THREE.MeshStandardMaterial({color:0x1a1d22,emissive:0x0b0e12,roughness:.4});
  for(const x of[-8,-2.6,2.6,8]){box(G,.5,.4,17.6,x,7.75,0,dark,false);box(G,.36,.04,15,x,7.53,0,panelOff,false);}
  const strip=new THREE.MeshBasicMaterial({color:new THREE.Color(0x7fe3ff).multiplyScalar(.5),toneMapped:false});
  for(const s2 of[-1,1])for(const z of[-6.8,-3.3,.2,3.7,7.2]){box(G,.5,8,.7,s2*11.7,4,z,dark);box(G,.04,5.6,.08,s2*11.42,3.6,z,strip,false);}
  for(const z of[-8.6,8.6])box(G,23.4,.06,.08,0,1.15,z*.999,trim,false);
  {const pts=[];for(let k=0;k<=64;k++){const a=Math.PI*.55+(Math.PI*2.2-(Math.PI*.55))*k/64;pts.push(new THREE.Vector3(2.6+Math.cos(a)*2.6,1,-3.4+Math.sin(a)*2.6));}G.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),96,.035,6,false),trim));for(const e of[pts[0],pts[64]]){const c=new THREE.Mesh(new THREE.SphereGeometry(.035*1.6,8,6),trim);c.position.copy(e);G.add(c);}}   // the rail runs post to post and ends on the end posts
  for(let i=0;i<9;i++){const a=Math.PI*.55+i/8*Math.PI*1.65;box(G,.05,1,.05,2.6+Math.cos(a)*2.6,.5,-3.4+Math.sin(a)*2.6,trim);}
  const bnr=new THREE.MeshStandardMaterial({color:0x22487a,roughness:.85,side:THREE.DoubleSide});
  for(const x of[-7,7]){const b2=new THREE.Mesh(new THREE.PlaneGeometry(1.5,4.8),bnr);b2.position.set(x,4.6,8.78);b2.rotation.y=Math.PI;G.add(b2);box(G,1.7,.08,.08,x,7.05,8.75,trim,false);
    const em=new THREE.Mesh(new THREE.TorusGeometry(.38,.05,6,6),trim);em.position.set(x,5.4,8.74);G.add(em);}
  for(const z of[-5,-1.5,2,5.5])for(const s2 of[-1,1]){const c2=new THREE.Group();c2.position.set(s2*9.6,0,z+.4);c2.rotation.y=s2*1.3+(Math.random()-.5)*.5;G.add(c2);
    box(c2,.55,.07,.55,0,.48,0,dark);box(c2,.55,.6,.07,0,.8,.26,dark);box(c2,.06,.45,.06,0,.24,0,dark);}
  box(G,.25,.12,17,-10.2,.06,0,dark,false);box(G,.25,.12,17,10.2,.06,0,dark,false);
  D.leds=[];for(const z of[-5,-1.5,2,5.5])for(const s2 of[-1,1]){const l=glowSprite(Math.random()<.7?0xffb040:0x7fe3ff,.14,2.2);l.position.set(s2*10.45,1.12,z+.9);G.add(l);D.leds.push(l);}
  /* (Oct 25) the same supercomputers as the live deck (js/origin/04-story.js), here with the power gone: darkened, one in each bay
     between the pilasters, backed onto the wall and facing in. Its standby light moves onto the bank's front. */
  {let li=0;for(const z of[-5,-1.5,2,5.5])for(const s2 of[-1,1]){const led=D.leds[li++];
    MODELS.supercomputer(2.7,{dim:.35}).then(o=>{o.position.set(s2*11.78,0,z+s2*.355);o.rotation.y=-s2*Math.PI/2;G.add(o);for(const m of deadParts)m.visible=false;
      if(led)led.position.x=s2*(11.78-o.userData.size.z-.04);}).catch(()=>{});}}
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
  const conc=STD(0xb0b4ae,{map:panelTexture('#8a8e88'),roughness:.85,metalness:.08}),dark=STD(0x3a3c3a,{roughness:.8}),glassM=STD(0x0c1012,{roughness:.1,metalness:.9});
  nightSky(G,1400,1.3);
  // ground: cracked apron, then the sea wall and the bay; the city on the far shore, the Spear standing over it
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(220,120),STD(0x5e605a,{map:panelTexture('#5a5c56'),roughness:.95,metalness:0}));gnd.material.map.wrapS=gnd.material.map.wrapT=THREE.RepeatWrapping;gnd.material.map.repeat.set(14,8);
  gnd.rotation.x=-Math.PI/2;gnd.position.z=-10;gnd.receiveShadow=true;G.add(gnd);
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(3000,1600),STD(0x0a1418,{roughness:.2,metalness:.8}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-2,-870);G.add(sea);box(G,220,2.4,1.2,0,-.8,-70,conc,false);
  if(typeof SKYLINE!=='undefined'){const c=SKYLINE.build({n:80,h:320,w:50,unit:8,lit:.08,water:-2,seed:53,traffic:0,place:(i,r)=>{const a=(r()-.5)*1.4,rr=420+r()*600;return[Math.sin(a)*rr*1.3,-70-Math.cos(a)*rr,1-rr/1100];}});G.add(c.G);X.city=c;}
  const sp=new THREE.Group();sp.position.set(-120,-2,-520);G.add(sp);const s1=new THREE.Mesh(new THREE.CylinderGeometry(3,10,300,6),STD(0xd8d2c4,{roughness:.4,metalness:.5}));s1.position.y=150;sp.add(s1);
  const tip=glowSprite(0xffd890,30,1.2);tip.position.y=306;sp.add(tip);X.spear=sp;X.spTip=tip;
  // Tide City Command: a main block with a glass band, two lower wings, roof plant, masts, the doors; a few windows broken
  box(G,44,12,18,0,6,-30,conc);box(G,44.4,1,18.4,0,12.5,-30,dark);box(G,18,8,14,28,4,-28,conc);box(G,12,7,12,-27,3.5,-26,conc);
  for(let x=-20;x<=20;x+=2.6){const b=box(G,2.1,1.6,.2,x,8.4,-20.92,glassM,false);if(Math.random()<.15)b.material=dark;}
  for(let x=20;x<=36;x+=3.2)box(G,2.2,1.3,.2,x,5,-20.92,glassM,false);for(let x=-32;x<=-22;x+=3)box(G,2,1.2,.2,x,4.4,-19.92,glassM,false);
  box(G,6,5,.3,0,2.5,-20.8,dark,false);box(G,7,.5,1.6,0,5.3,-20.4,conc);   // the doors and their canopy
  for(const [x,z,w,h] of[[-10,-32,5,2.2],[6,-34,7,2.8],[16,-28,4,1.8]])box(G,w,h,w*.8,x,12+h/2,z,dark);
  const mast=new THREE.Group();mast.position.set(-12,12,-30);G.add(mast);box(mast,.4,9,.4,0,4.5,0,dark);const dish=new THREE.Mesh(new THREE.SphereGeometry(2.4,20,10,0,Math.PI*2,0,Math.PI/3),dark);dish.rotation.x=-1;dish.position.y=8.5;mast.add(dish);
  box(G,.25,16,.25,14,20,-34,dark);
  const pad=new THREE.Mesh(new THREE.RingGeometry(9,9.6,48),new THREE.MeshBasicMaterial({color:0x6a7068}));pad.rotation.x=-Math.PI/2;pad.position.set(26,.02,6);G.add(pad);
  for(let i=-6;i<=6;i++){box(G,.15,3,.15,i*7,1.5,18,dark);}box(G,90,.06,.06,0,2.6,18,dark,false);box(G,90,.06,.06,0,1.5,18,dark,false);   // the fence
  for(const [x,z] of[[-30,6],[0,8],[30,-6]]){box(G,.3,7,.3,x,3.5,z,dark);box(G,1.4,.2,.4,x+.6,7,z,dark);}   // lamp posts, dark
  // left where they stopped: a transport with its ramp down, crates, a toppled barrier, papers of debris
  const tr=new THREE.Group();tr.position.set(-14,0,4);tr.rotation.y=.5;G.add(tr);box(tr,4,2.4,9,0,1.5,0,conc);box(tr,3.6,1,3,0,3.1,-2.4,glassM);box(tr,3.8,.2,3,0,.5,6,dark).rotation.x=.25;
  for(const [x,z,r] of[[8,2,.3],[9.4,3,.1],[8.6,4.6,.7],[-24,-10,.2]])box(G,1.4,1.2,1.4,x,.6,z,STD(0x4a5048)).rotation.y=r;
  const bar=box(G,4,.8,.5,-8,.4,10,STD(0x8a6a2a));bar.rotation.set(0,.4,1.3);
  for(let i=0;i<40;i++){const d=box(G,.2+Math.random()*.6,.04,.2+Math.random()*.6,(Math.random()-.5)*60,.03,(Math.random()-.5)*30,dark,false);d.rotation.y=Math.random()*3;}
  // the record: the last time the Spear fired, as this camera kept it. A gold beam up out of the city, the sky lit, then nothing
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(5,9,1600,24,1,true).translate(0,800,0),new THREE.MeshBasicMaterial({color:new THREE.Color(0xffe2a0).multiplyScalar(2),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}));
  beam.position.set(-120,300,-520);beam.rotation.z=-.08;G.add(beam);X.beam=beam;
  const flash=glowSprite(0xffe8b0,900,1.4);flash.position.set(-120,500,-560);flash.material.opacity=0;G.add(flash);X.flash=flash;
  const sky=new THREE.HemisphereLight(0x8a9a9a,0x202420,1.3);G.add(sky);const moon=new THREE.DirectionalLight(0xc0d0c8,1.6);moon.position.set(460,60,40);moon.target.position.set(400,0,-20);G.add(moon,moon.target);X.lights=[sky,moon];
  X.F={visible:false};   // (the one-frame figure from the first version is gone: Oct 22)
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
  // the names: a plane of carved rock on the right wall; among them CPT. A. RHEN's team and, small, his own
  const x0=(row,col)=>150+col*292+(row%2)*36,y0=row=>50+row*62,CREW=[],CREWN=['THORNE','SGT. O. MARSH','CPT. A. RHEN','OKAFOR','ENS. LANDRY'];
  const tex=canvasTex(2048,1024,(g,w,h)=>{g.fillStyle='#2c2a30';g.fillRect(0,0,w,h);
    for(let i=0;i<1400;i++){g.fillStyle=Math.random()<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.035)';g.beginPath();g.arc(Math.random()*w,Math.random()*h,2+Math.random()*40,0,7);g.fill();}
    const SUR=['ADEYEMI','ALCOTT','BRANDT','CALLOWAY','DARROW','EKWUEME','FARRIS','GALLO','HAYES','IVERS','JANSEN','KOVAC','LANDRY','MARSH','NAKAMURA','OKAFOR','PRUITT','QUINLAN','REYES','SATO','THORNE','VANCE','WEBER','YOUNG','ZIMMER','BLACKWOOD','DUBOIS','FONTAINE','GRAVES','HOLLOWAY','KESTREL','MERCER','NOVAK','ORLOV','ROURKE','TALLIS','VOSS','WINTERS','BELLAMY','CROSS','DRAKE','FINCH','HALE','KANE','LOCKE','MORROW','NASH','STROUD'];
    const RK=['PVT','CPL','SGT','SPC','LT','ENS','CPL','PVT'];g.textAlign='center';let k=0;
    for(let row=0;row<16;row++)for(let col=0;col<7;col++){k++;let n=RK[k*7%8]+'. '+'ABCDEFGHJKLMNPRSTW'[k*5%18]+'. '+SUR[k*11%SUR.length],d=row<6?`${String(1+k*3%28).padStart(2,'0')}.${String(1+k%12).padStart(2,'0')}.${2190+k*7%47}`:'08.03.2237',me=false;
      if(row===8&&col===3){n='LT. MICHAEL HALL';d='16.03.2237';me=true;}else if(row===7&&col>=1&&col<=5){CREW.push([x0(row,col),y0(row),CREWN[col-1]]);continue;}
      const x=x0(row,col),y=y0(row);g.font='600 25px "Chakra Petch",sans-serif';g.fillStyle='rgba(255,255,255,.09)';g.fillText(n,x+2,y+2);g.fillStyle='rgba(6,6,8,.92)';g.fillText(n,x,y);
      g.font='500 19px monospace';g.fillStyle='rgba(6,6,8,.8)';g.fillText(d,x,y+24);if(me){H3.meUV=[x/w,1-(y+8)/h];}}
    const r=g.createRadialGradient(w/2,h/2,300,w/2,h/2,1100);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=r;g.fillRect(0,0,w,h);});
  const nw=new THREE.Mesh(new THREE.PlaneGeometry(9,4.5,24,12),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.55,metalness:.1,depthWrite:false}));
  const np=nw.geometry.attributes.position;for(let i=0;i<np.count;i++)np.setZ(i,Math.sin(np.getX(i)*.35)*.35+vnoise(np.getX(i),np.getY(i))*.1);nw.geometry.computeVertexNormals();
  const c30=curve.getPointAt(22/L);nw.position.set(c30.x+2.95,c30.y-.2,c30.z);nw.rotation.y=-Math.PI/2;G.add(nw);H3.names=nw;
  /* the team's five names on a plane of their own, just off the rock (footage 07 carves them in: each burns in left to right, pale
     violet-white, and cools to the same black as the rest). CREWU.R: how many have been cut (0..5); after that they read as carved */
  {const ct=canvasTex(2048,1024,(g,w,h)=>{g.textAlign='center';for(const [x,y,n] of CREW){g.font='600 25px "Chakra Petch",sans-serif';g.fillStyle='#fff';g.fillText(n,x,y);g.font='500 19px monospace';g.fillText('08.03.2237',x,y+24);}});
   const U={map:{value:ct},R:{value:5},hot:{value:0}};H3.crewU=U;
   const cm=new THREE.Mesh(nw.geometry,new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,
     vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
     fragmentShader:`varying vec2 vU;uniform sampler2D map;uniform float R,hot;void main(){float a=texture2D(map,vU).a;if(a<.02)discard;
       float px=vU.x*2048.0;float col=floor((px-186.0+146.0)/292.0);float i=col-1.0;float lf=clamp((px-(186.0+col*292.0-140.0))/280.0,0.0,1.0);
       float k=clamp(R-i,0.0,1.0);if(lf>k)discard;float heat=clamp(1.0-(R-i-1.0)*.45,0.0,1.0)*hot;float edge=smoothstep(k-.08,k,lf)*step(k,.999);
       vec3 c=mix(vec3(.024,.024,.03),vec3(.85,.7,1.0)*2.2,max(heat,edge));gl_FragColor=vec4(c,a*.92);}`}));
   cm.position.copy(nw.position);cm.position.x-=.03;cm.rotation.copy(nw.rotation);G.add(cm);H3.crewNames=cm;
   const nl=new THREE.PointLight(0xc8a8ff,0,9,1.6);nl.position.set(nw.position.x-1.2,nw.position.y,nw.position.z);G.add(nl);H3.nameL=nl;}
  const slab=new THREE.Mesh(new THREE.PlaneGeometry(10.5,5.6),new THREE.MeshStandardMaterial({color:0x1c1a20,roughness:.8}));slab.position.set(c30.x+3.02,c30.y-.2,c30.z);slab.rotation.y=-Math.PI/2;G.add(slab);
  // where his name sits, in the Hollow's own space
  const u=H3.meUV||[.5,.5];H3.me=new THREE.Vector3(c30.x+2.9,c30.y-.2+(u[1]-.5)*4.5,c30.z+(u[0]-.5)*9);
  // the chamber at the bottom: the plinth from Archive 01, its dome dark, the Codex gone; an opening into the deep
  const CH=new THREE.Vector3(0,-3,-72);H3.CH=CH;
  /* the chamber (Oct 22, Bryce): a round room with a solid stone floor ringed with circles of blue light, glass for walls from floor to
     ceiling, a rock dome over it, and the drowned sea all round outside the glass. Whatever swims past swims out there, never through. */
  const CR=16,CHH=11;
  const cfl=new THREE.Mesh(new THREE.CircleGeometry(CR+.3,72),new THREE.MeshStandardMaterial({color:0x2a2830,roughness:.55,metalness:.25,map:rock}));cfl.rotation.x=-Math.PI/2;cfl.position.set(CH.x,CH.y,CH.z);cfl.receiveShadow=true;G.add(cfl);
  const ringM=new THREE.MeshBasicMaterial({color:new THREE.Color(0x3aa8ff).multiplyScalar(1.6),fog:false});H3.rings=ringM;
  for(const r of[4.2,7.6,11,14.4]){const ring=new THREE.Mesh(new THREE.RingGeometry(r,r+.16,96),ringM);ring.rotation.x=-Math.PI/2;ring.position.set(CH.x,CH.y+.02,CH.z);G.add(ring);}
  const GAP=.62;   // the doorway where the tunnel comes in (toward +z)
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(CR,CR,CHH,72,1,true,GAP/2,Math.PI*2-GAP),new THREE.MeshPhysicalMaterial({color:0x6ab8e0,transparent:true,opacity:.12,roughness:.05,metalness:.1,clearcoat:1,side:THREE.DoubleSide,depthWrite:false}));
  glass.position.set(CH.x,CH.y+CHH/2,CH.z);G.add(glass);H3.glass=glass;
  const frameM=STD(0x3a3a44,{metalness:.7,roughness:.35});
  for(let k=0;k<=18;k++){const a=GAP/2+(Math.PI*2-GAP)*k/18,mm=new THREE.Mesh(new THREE.BoxGeometry(.28,CHH,.28),frameM);mm.position.set(CH.x+Math.sin(a)*CR,CH.y+CHH/2,CH.z+Math.cos(a)*CR);G.add(mm);}
  for(const y of[.15,CHH-.15]){const rr=new THREE.Mesh(new THREE.TorusGeometry(CR,.18,5,72),frameM);rr.rotation.x=Math.PI/2;rr.position.set(CH.x,CH.y+y,CH.z);G.add(rr);}
  const dome=new THREE.Mesh(new THREE.SphereGeometry(CR+.4,48,16,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x1c1a22,side:THREE.BackSide,roughness:.85,map:rock}));dome.scale.set(1,.42,1);dome.position.set(CH.x,CH.y+CHH-.2,CH.z);G.add(dome);
  // the doorway from the tunnel: a collar of rock joining the tube to the glass
  const collar=new THREE.Mesh(new THREE.CylinderGeometry(4.9,4.9,4,24,1,true),new THREE.MeshStandardMaterial({color:0x221f28,side:THREE.DoubleSide,roughness:.8,map:rock}));collar.rotation.x=Math.PI/2;collar.position.set(CH.x,CH.y+2.6,CH.z+CR+.4);G.add(collar);
  // outside the glass: the sea, dark, lit from far above, with motes drifting
  const water=new THREE.Mesh(new THREE.CylinderGeometry(70,70,90,48,1,true),new THREE.MeshBasicMaterial({side:THREE.BackSide,fog:false,map:canvasTex(16,256,(g,w,h)=>{const r=g.createLinearGradient(0,0,0,h);r.addColorStop(0,'#0e4a62');r.addColorStop(.35,'#06283a');r.addColorStop(.7,'#020f18');r.addColorStop(1,'#000406');g.fillStyle=r;g.fillRect(0,0,w,h);})}));
  water.position.set(CH.x,CH.y+10,CH.z);G.add(water);
  const wb=new THREE.Mesh(new THREE.CircleGeometry(70,48),new THREE.MeshBasicMaterial({color:0x010507,fog:false}));wb.rotation.x=-Math.PI/2;wb.position.set(CH.x,CH.y-35,CH.z);G.add(wb);
  const wmotes=[];for(let k=0;k<160;k++){const m=glowSprite(0x8fe8ff,.16,1);m.material.fog=false;const a=Math.random()*Math.PI*2,r=CR+2+Math.random()*40;m.position.set(CH.x+Math.sin(a)*r,CH.y-20+Math.random()*40,CH.z+Math.cos(a)*r);m.material.opacity=.4;G.add(m);wmotes.push(m);}H3.wmotes=wmotes;
  // (the tunnel's open mouth at the top, sealed with rock)
  {const c0=curve.getPointAt(0),cap=new THREE.Mesh(new THREE.CircleGeometry(R0*1.3,24),new THREE.MeshStandardMaterial({color:0x1a181e,roughness:.9,map:rock}));cap.position.set(c0.x,c0.y,c0.z+.4);G.add(cap);}
  const pl=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.7,1,32),STD(0x2a282e,{metalness:.3,roughness:.6}));pl.position.set(CH.x,CH.y+.5,CH.z);pl.castShadow=pl.receiveShadow=true;G.add(pl);
  const pd=new THREE.Mesh(new THREE.SphereGeometry(2,36,16,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0x8fb0e0,transparent:true,opacity:.1,roughness:.1,clearcoat:1,depthWrite:false,side:THREE.DoubleSide}));
  pd.position.set(CH.x,CH.y+1,CH.z);G.add(pd);H3.pdome=pd;
  const sea=LEVIATHAN.makeWater(60,50,0x031a22);sea.mesh.position.set(CH.x,CH.y+40,CH.z);sea.mesh.visible=false;G.add(sea.mesh);H3.sea=sea;   // (the room is under the water now)
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
  buildPrisoners(G);
}
/* ---------- footage 07's people: Rhen's team (no rifles, hands bound behind them), Empty Host troopers, and the Hollow King
   (Bryce's model on the code rig, as Archive 01 dresses him), a purple light about him ---------- */
const P7={on:false};
function buildPrisoners(G){
  const crew=[['marine',0xb4bcc4],['marine',0xb4bcc4],['marine',0xb4bcc4],['marine',0xb4bcc4],['engineer',0x8e949c]].map(([k,tint])=>{const H=makeHuman(k==='engineer'?'engineer':'marine');G.add(H.root);
    MODELS.dress(H,k,{tint,unarmed:true});H.root.visible=false;return{H,x:0,z:0,y:0,yaw:0,kneel:1,look:0};});
  const host=[0,1,2,3].map(()=>{const H=makeHuman('trooper');G.add(H.root);MODELS.dress(H,'host',{lift:{c:0x9a6ad0,k:.42}});H.root.visible=false;return{H,x:0,z:0,y:0,yaw:0};});
  const KH=makeHuman('master');G.add(KH.root);KH.root.visible=false;MODELS.dress(KH,'king',{unarmed:true});
  const aura=glowSprite(0x9a4aff,7,1.3);aura.material.opacity=.5;G.add(aura);aura.visible=false;
  const kl=new THREE.PointLight(0xa060ff,0,22,1.4);G.add(kl);
  Object.assign(P7,{crew,host,K:{H:KH,x:0,z:0,y:0,yaw:0,gesture:0,t:0},aura,kl});}
// kneeling: one knee down on the floor (measured on the model, so it touches whatever its proportions), wrists bound in front, in the lap
const _kp=new THREE.Vector3();
function kneelBound(H,k,look){const base=H.hipY||1,leg=H.hipY?H.hipY*.96:.92,[L0,L1]=H.legs;
  L0.hp.rotation.x=1.5*k;L0.kn.rotation.x=-1.5*k;L1.hp.rotation.x=.08*k;L1.kn.rotation.x=-1.38*k;H.hip.rotation.set(0,0,0);H.hip.position.y=base-leg*.5*k;H.torso.rotation.set(.1*k,0,0);
  const rlx=H.R?Math.atan2(H.R.el[0]-H.R.sh[0],H.R.sh[1]-H.R.el[1]):0;for(const [i,sg] of[[0,1],[1,-1]]){const A=H.arms[i];A.sh.rotation.set(.35,0,sg*rlx*.85);A.el.rotation.set(1.2,0,0);}H.head.rotation.set(-.15+(look||0)*.25,0,0);
  H.root.updateMatrixWorld(true);L1.kn.getWorldPosition(_kp);const g=H.root.parent;if(g)g.worldToLocal(_kp);H.hip.position.y-=(_kp.y-(H.root.position.y+.07))/(H.root.scale.y||1)*k;}
function posePrisoners(dt){if(!P7.on)return;
  for(const c of P7.crew){c.H.root.visible=true;c.H.root.position.set(c.x,c.y,c.z);c.H.root.rotation.y=c.yaw;poseHuman(c.H,dt,0,0,false);kneelBound(c.H,c.kneel,c.look);}
  for(const h of P7.host){h.H.root.visible=h.on!==false;h.H.root.position.set(h.x,h.y,h.z);h.H.root.rotation.y=h.yaw;h.H.aimPitch=-.3;poseHuman(h.H,dt,0,1,false);}
  const K=P7.K,H=K.H;K.t+=dt;H.root.visible=K.on!==false;P7.aura.visible=H.root.visible;H.root.position.set(K.x,K.y,K.z);H.root.rotation.y=K.yaw;poseHuman(H,dt,0,0);
  H.head.rotation.y=Math.sin(K.t*.4)*.12;H.arms[0].sh.rotation.x+=K.gesture*2.1+Math.sin(K.t*.8)*.05;H.arms[0].sh.rotation.z-=K.gesture*.3;H.arms[1].sh.rotation.x+=.15;
  P7.aura.position.set(K.x,K.y+2.2,K.z);P7.aura.material.opacity=(.4+.15*Math.sin(K.t*2.2))*(1+K.gesture*.8);P7.kl.position.set(K.x,K.y+3,K.z+1);P7.kl.intensity=(1.2+K.gesture*2.2)*(H.root.visible?1:0);}
function hidePrisoners(){P7.on=false;if(!P7.crew)return;for(const c of P7.crew)c.H.root.visible=false;for(const h of P7.host)h.H.root.visible=false;P7.K.H.root.visible=false;P7.aura.visible=false;P7.kl.intensity=0;}
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
   SET 4 · A DROPSHIP, INSIDE (Oct 22): the Pathfinder's dropship going down into Astraea (footage 04, seen through Okafor's helmet),
   and Dropship Two on her side at the end of the canyon (footage 05, her cockpit recorder). Built along -z: the cockpit at the far end
   ===================================================================================================================== */
const SH={};
function buildShip(){
  const G=new THREE.Group();G.position.set(0,0,600);scene.add(G);SH.G=G;G.visible=false;
  const wt=panelTexture('#3a3f48');wt.wrapS=wt.wrapT=THREE.RepeatWrapping;wt.repeat.set(4,1);
  const wall=STD(0x6a707a,{map:wt,metalness:.5,roughness:.5}),dark=STD(0x22262e,{metalness:.6,roughness:.45}),seat=STD(0x2a3550,{roughness:.8,metalness:.1}),gold=STD(0xd9b25a,{metalness:.9,roughness:.3});
  box(G,3.6,.2,13,0,-.1,0,wall);box(G,3.8,.2,13,0,2.85,0,wall);for(const s2 of[-1,1])box(G,.2,2.9,13,s2*1.85,1.4,0,wall);box(G,3.8,2.9,.2,0,1.4,6.4,wall);
  for(let z=-5;z<=5.5;z+=1.25){box(G,3.5,.16,.16,0,2.68,z,dark,false);for(const s2 of[-1,1])box(G,.16,2.6,.16,s2*1.7,1.3,z,dark,false);}
  for(const s2 of[-1,1])for(const z of[-3,-1.5,0,1.5,3]){box(G,.62,.45,.7,s2*1.38,.45,z,seat);box(G,.12,.9,.7,s2*1.64,1.05,z,seat);box(G,.04,.9,.05,s2*1.3,1.1,z-.3,gold,false);}
  // the cockpit: the console, two seats, the windscreen (what's outside is painted, and moves)
  box(G,3.2,.9,.9,0,.75,-6,dark);box(G,3.4,1,.25,0,2.4,-6.4,dark);
  const win=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);});SH.winT=win;SH.winC=win.image;
  const wm=new THREE.Mesh(new THREE.PlaneGeometry(3,1.3),new THREE.MeshBasicMaterial({map:win,toneMapped:false}));wm.position.set(0,1.75,-6.42);G.add(wm);SH.win=wm;
  box(G,3.8,2.9,.2,0,1.4,-6.6,wall);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.35),new THREE.MeshBasicMaterial({color:new THREE.Color(0xff5a3a).multiplyScalar(1.4),toneMapped:false}));scr.position.set(.6,1.22,-5.54);scr.rotation.x=-.6;G.add(scr);SH.scr=scr;
  // light: red lamps down the ceiling, the glow of whatever is outside the windscreen
  SH.reds=[];for(const z of[-4,-.5,3]){const l=new THREE.PointLight(0xff3a24,1.2,7,1.6);l.position.set(0,2.5,z);G.add(l);const b=box(G,.3,.08,.3,0,2.74,z,new THREE.MeshBasicMaterial({color:0xff3a24,toneMapped:false}),false);SH.reds.push({l,b});}
  SH.out=new THREE.PointLight(0xff9a50,0,9,1.4);SH.out.position.set(0,1.8,-5.6);G.add(SH.out);
  SH.amb=new THREE.HemisphereLight(0x8a90a8,0x101216,.12);G.add(SH.amb);
  SH.dash=new THREE.PointLight(0x9fd8ff,.9,3.2,1.6);SH.dash.position.set(-.4,1.35,-5.9);G.add(SH.dash);   // the console's glow on whoever sits at it
  SH.sparks=[];for(let i=0;i<14;i++){const sp=glowSprite(0xffc070,.12,1.8);sp.visible=false;G.add(sp);SH.sparks.push({sp,v:new THREE.Vector3(),t:0});}
  // the crew (Pathfinder strike team): Rhen at the cockpit, Landry flying, Marsh and Thorne strapped in. The camera is Okafor
  const P=(kind,x,z,ry,sit,dress,o)=>{const H=makeHuman('marine');H.root.position.set(x,0,z);H.root.rotation.y=ry;G.add(H.root);MODELS.dress(H,dress||'marine',o||{});H.sit=sit;return H;};
  SH.rhen=P('m',.55,-4.7,0,0);SH.landry=P('m',-.55,-5.4,0,.9,'engineer');SH.marsh=P('m',1.38,-1.5,-Math.PI/2,.9);SH.thorne=P('m',-1.38,0,Math.PI/2,.9);
  SH.pilot=P('m',-.55,-5.4,0,.9,'marine',{tint:0x9a9690});SH.pilot.root.visible=false;
  SH.crew=[SH.rhen,SH.landry,SH.marsh,SH.thorne,SH.pilot];
}
function paintWindow(t,mode){const g=SH.winC.getContext('2d'),w=512,h=256;
  if(mode==='fire'){const k=ST.fire;g.fillStyle=`rgb(${40+k*200|0},${20+k*80|0},${10+k*20|0})`;g.fillRect(0,0,w,h);
    for(let i=0;i<26;i++){const y=(i*37+t*900)%h,x=(i*131)%w;g.fillStyle=`rgba(255,${180+Math.random()*60|0},120,${.25+.5*k*Math.random()})`;g.fillRect(x-60,h-y,180+Math.random()*120,3+Math.random()*5);}}
  else if(mode==='dusk'){const r=g.createLinearGradient(0,0,0,h);r.addColorStop(0,'#5a2a2a');r.addColorStop(.55,'#c8643a');r.addColorStop(.6,'#7a3a22');r.addColorStop(1,'#3a1a12');g.fillStyle=r;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(0,0,0,.55)';for(let i=0;i<6;i++){g.beginPath();g.moveTo(i*100-40,h);g.lineTo(i*100+20+Math.sin(i)*30,h*.45+i%2*20);g.lineTo(i*100+90,h);g.fill();}
    if(Math.random()<.04){g.fillStyle='rgba(255,140,80,.9)';g.fillRect(Math.random()*w,h*.6+Math.random()*30,6,2);}}
  else{g.fillStyle='#000';g.fillRect(0,0,w,h);}
  SH.winT.needsUpdate=true;}
function updateShip(dt,t){const S=ST;
  for(const R of SH.reds){const on=S.redF>0&&(Math.sin(t*S.redRate+R.l.position.z)>-.2);R.l.intensity=on?1.4*S.redF:.1;R.b.material.color.setRGB(on?1:.2,.1,.08);}
  SH.out.intensity=S.fire*3.5;SH.amb.intensity=.14+S.dim*.35;SH.dash.intensity=.9*(.8+.2*Math.sin(t*5));SH.scr.material.color.setRGB(1.4*(.5+.5*Math.sin(t*7)),.3,.2);
  if(!S.winT||t-S.winT>.06){S.winT=t;paintWindow(t,S.win);}
  for(const P of SH.sparks){if(!P.sp.visible){if(S.sparks>0&&Math.random()<S.sparks*dt*6){P.sp.visible=true;P.t=0;P.sp.position.set((Math.random()-.5)*3,2.6,(Math.random()-.5)*10);P.v.set((Math.random()-.5)*2,-1-Math.random()*2,(Math.random()-.5)*2);}continue;}
    P.t+=dt;P.v.y-=9*dt;P.sp.position.addScaledVector(P.v,dt);P.sp.material.opacity=1-P.t;if(P.t>1)P.sp.visible=false;}
  for(const H of SH.crew){if(!H.root.visible)continue;H.crouchTo=H.sit||0;poseHuman(H,dt,0,0,false);if(H.sit||H===SH.rhen){if(H.gun)H.gun.visible=false;}   // (Oct 22: seated and bracing, rifles stowed: their hands are on the seat and the grip, not floating rifles)
    if(H.sit){H.arms[0].sh.rotation.x=-.4+S.brace*-1.6;H.arms[1].sh.rotation.x=-.4+S.brace*-1.6;}}
  SH.rhen.arms[1].sh.rotation.x=-2.6;SH.rhen.arms[1].el.rotation.x=-.2;   // a hand up on the overhead grip
  SH.landry.arms[0].sh.rotation.x=.9;SH.landry.arms[1].sh.rotation.x=.9;SH.landry.arms[0].el.rotation.x=-.6;SH.landry.arms[1].el.rotation.x=-.6;}

/* =====================================================================================================================
   SET 5 · THE WHITE CITY, INSIDE (footage 06): a corridor of white stone with no joins anywhere, lit from nowhere, purple at its far end
   ===================================================================================================================== */
const WC={};
function buildWhite(){
  const G=new THREE.Group();G.position.set(0,0,-600);scene.add(G);WC.G=G;G.visible=false;
  const wm=new THREE.MeshStandardMaterial({color:0xd8d0c4,roughness:.35,metalness:.05,emissive:0x141210,side:THREE.BackSide});
  const tube=new THREE.CylinderGeometry(3.2,3.2,46,48,1,true);tube.rotateX(Math.PI/2);tube.scale(1,1.15,1);const c=new THREE.Mesh(tube,wm);c.position.set(0,2.2,-14);G.add(c);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(5.2,46),new THREE.MeshStandardMaterial({color:0xe8e0d4,roughness:.18,metalness:.1}));fl.rotation.x=-Math.PI/2;fl.position.set(0,0,-14);G.add(fl);
  const back=new THREE.Mesh(new THREE.CircleGeometry(3.6,40),new THREE.MeshStandardMaterial({color:0xf2ece2,roughness:.4}));back.position.set(0,2.2,8.9);back.rotation.y=Math.PI;G.add(back);
  // the far end: a doorway full of purple light
  const door=new THREE.Mesh(new THREE.PlaneGeometry(4,5),new THREE.MeshBasicMaterial({color:new THREE.Color(0xa45cff).multiplyScalar(1.5),toneMapped:false}));door.position.set(0,2.4,-36.5);G.add(door);WC.door=door;
  WC.pl=new THREE.PointLight(0xa45cff,0,30,1.2);WC.pl.position.set(0,2.5,-30);G.add(WC.pl);
  WC.amb=new THREE.HemisphereLight(0xfff6ea,0x8a8478,.5);G.add(WC.amb);const k=new THREE.PointLight(0xfff0dc,1.2,20,1.5);k.position.set(0,4,2);G.add(k);WC.key=k;
  const P=(x,z,ry,dress,o)=>{const H=makeHuman('marine');H.root.position.set(x,0,z);H.root.rotation.y=ry;G.add(H.root);MODELS.dress(H,dress||'marine',o||{});return H;};
  WC.rhen=P(0,2.2,Math.PI);WC.marsh=P(-1.2,-.6,0);WC.thorne=P(1.3,-1.4,0);
  WC.host=[];for(let i=0;i<5;i++){const H=makeHuman('trooper');H.root.position.set((i-2)*.9,0,-34-i*.6);G.add(H.root);MODELS.dress(H,'host');H.root.visible=false;WC.host.push(H);}
}
function updateWhite(dt,t){const S=ST;WC.pl.intensity=S.purple*5;WC.door.material.color.setRGB(.64*1.5*(.4+S.purple),.36*1.5*(.4+S.purple),1.5*(.4+S.purple));
  WC.amb.intensity=.5*(1-S.dim*.7);WC.key.intensity=.9*(1-S.dim*.6)*(Math.random()<S.flick?.2:1);
  poseHuman(WC.rhen,dt,0,0,false);WC.rhen.arms[1].sh.rotation.x=.9;WC.rhen.arms[1].el.rotation.x=-1.1;   // holding the recorder up to his face
  if(WC.rhen.gun){WC.rhen.gun.visible=false;WC.rhen.arms[0].sh.rotation.set(.12,0,.12);WC.rhen.arms[0].el.rotation.set(-.25,0,0);}   // (Oct 22: rifle slung, the other arm at his side)
  for(const H of[WC.marsh,WC.thorne])poseHuman(H,dt,0,S.aim,false);
  for(const H of WC.host){if(!H.root.visible)continue;H.root.position.z+=dt*S.hostV;poseHuman(H,dt,S.hostV,1,false);}}

/* =====================================================================================================================
   THE STATE the scripts change, and the frame that paints it
   ===================================================================================================================== */
let ST=null,TW=[];
function freshState(){return{t:0,set:'deck',red:0,redF:1,dome:0,domeOn:0,domeF:0,term:0,termF:1,lightsOut:0,screen:[],typed:0,coords:false,camFeed:false,
  figure:0,beam:0,rec:0,pass:0,blue:0,eyes:0,torchAt:null,torch:0,torchF:1,breath:1,amb:0,cam:{p:new THREE.Vector3(),l:new THREE.Vector3()},shake:0,
  roll:0,redF:1,redRate:3,fire:0,win:'off',sparks:0,brace:0,dim:0,purple:0,flick:0,aim:0,hostV:0};}
const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
function tw(o,k,to,dur,lin){TW=TW.filter(q=>!(q.o===o&&q.k===k));TW.push({o,k,from:o[k],to,dur:Math.max(.001,dur),t:0,lin});}
function stepTw(dt){for(const q of TW){q.t+=dt;const u=Math.min(1,q.t/q.dur);q.o[q.k]=q.from+(q.to-q.from)*(q.lin?u:ease(u));}TW=TW.filter(q=>q.t<q.dur);}
// a shot: the camera moves from one place to another over the shot's length (world coordinates of that set)
let SHOT=null;
function shot(set,p0,l0,p1,l1,dur){ST.set=set;SHOT={p0:new THREE.Vector3(...p0),l0:new THREE.Vector3(...l0),p1:new THREE.Vector3(...(p1||p0)),l1:new THREE.Vector3(...(l1||l0)),dur:dur||6,t:0};
  root.classList.toggle('cctv',set==='out');root.classList.toggle('helm',set==='ship'||set==='white');}
const OFF={deck:[0,0,0],out:[400,0,0],hollow:[-400,0,0],glimpse:[-400,0,0],ship:[0,0,600],white:[0,0,-600]};
let raf=0,last=0;
function frame(now){if(!ST){raf=0;return;}raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-(last||now))/1000);last=now;ST.t+=dt;stepTw(dt);const t=ST.t;
  // camera
  if(SHOT){SHOT.t+=dt;const u=ease(Math.min(1,SHOT.t/SHOT.dur)),o=OFF[ST.set];camera.position.lerpVectors(SHOT.p0,SHOT.p1,u).add(new THREE.Vector3(...o));
    const l=new THREE.Vector3().lerpVectors(SHOT.l0,SHOT.l1,u).add(new THREE.Vector3(...o));
    if(!still){camera.position.x+=Math.sin(t*.7)*.012;camera.position.y+=Math.sin(t*.9)*.01;}if(ST.shake>0){camera.position.x+=(Math.random()-.5)*.08*ST.shake;camera.position.y+=(Math.random()-.5)*.06*ST.shake;}
    camera.lookAt(l);if(ST.roll)camera.rotateZ(ST.roll);}
  // the deck
  scene.fog.density=ST.set==='glimpse'?.06:ST.set==='hollow'?.014:ST.set==='out'?.0014:.0009;scene.fog.color.setHex(ST.set==='glimpse'?0x02141a:0x020306);scene.background.copy(scene.fog.color);renderer.toneMappingExposure=ST.set==='glimpse'?.55:ST.set==='hollow'?.95:ST.set==='white'?.62:1.15;if(ST.set==='white'){scene.fog.density=.012;scene.fog.color.setHex(0xd8d0c4);scene.background.copy(scene.fog.color);}else if(ST.set==='ship'){scene.fog.density=.02;}
  if(SH.G)SH.G.visible=ST.set==='ship';if(WC.G)WC.G.visible=ST.set==='white';
  if(ST.set==='deck'){D.G.visible=true;X.G.visible=H3.G.visible=false;
    const rl=ST.red*ST.redF*(.75+.25*Math.sin(t*2.3))*(1-ST.lightsOut);D.red.intensity=rl*6;D.redGlow.material.opacity=rl;D.lens.material.color.setRGB(.25+rl,.03+rl*.1,.02);
    const pulse=Math.pow(Math.max(0,Math.sin(t*1.9)),8),dl=Math.min(1.6,ST.dome*(.25+.75*pulse)+ST.domeOn*.9+ST.domeF);
    D.under.intensity=dl*6;D.core.material.opacity=Math.min(1,dl);D.dome.material.opacity=.12+.18*Math.min(1,dl);D.ring.material.color.setRGB(.2+.3*dl,.5+.4*dl,.6+.4*dl);
    D.hm.opacity=.6*ST.domeOn;D.blip.material.opacity=ST.domeOn*(.6+.4*Math.sin(t*9));D.holo.rotation.y+=dt*.35;const a=t*.8;D.blip.position.set(Math.cos(a)*.9,Math.sin(a)*.3,Math.sin(a)*.9);
    D.scrLight.intensity=ST.term*ST.termF*(1-ST.lightsOut)*2.2;D.amb.intensity=.18*(1-ST.lightsOut*.8);
    if(D.beacons)D.beacons.forEach((b,i)=>b.material.opacity=Math.sin(t*2+i)>.6?1:.15);if(D.sky)D.sky.forEach(k=>k.update(t));if(D.leds)D.leds.forEach((l,i)=>l.material.opacity=(Math.sin(t*(1.3+i*.17)+i)>.2?.9:.12)*(1-ST.lightsOut*.6));
    drawScreen();poseDeck(dt);}
  else if(ST.set==='out'){X.G.visible=true;D.G.visible=H3.G.visible=false;X.beam.material.opacity=ST.beam*(.75+.25*Math.sin(t*40));X.flash.material.opacity=ST.beam*.8;X.spTip.material.opacity=.6+ST.beam;
    if(X.city)X.city.update(t);X.lights[0].intensity=1.3+ST.beam*3;
    hudEl.querySelector('.d').textContent=ST.rec?'▓▓.▓▓.▓▓▓▓  ▓▓:▓▓:'+String(Math.floor(t*7)%60).padStart(2,'0')+'  · ARCHIVE':'11.03.2260  03:14:'+String(22+Math.floor(t)%38).padStart(2,'0');hudEl.querySelector('.c').textContent=ST.rec?'CAM 04 · RECORD · SPEAR DISCHARGE':'CAM 04 · TIDE CITY COMMAND · EXTERIOR';hudEl.querySelector('.r').style.opacity=Math.sin(t*4)>0?1:0;}
  else if(ST.set==='hollow'||ST.set==='glimpse'){H3.G.visible=true;D.G.visible=X.G.visible=false;
    // the tunnel breathes
    const P=H3.tube.attributes.position,B=H3.base,k=1+.025*Math.sin(t*1.05)*ST.breath;if(!still){for(let i=0;i<P.count;i++){const j=i*3;P.array[j]=B[j]*k;P.array[j+1]=(B[j+1]-2.1)*k+2.1;}P.needsUpdate=true;}
    H3.blue.intensity=ST.blue*4;H3.amb.intensity=ST.amb;H3.torch.intensity=ST.torch*ST.torchF*4.5;H3.torchGlow.material.opacity=ST.torch*ST.torchF;
    H3.lev.setEyes(ST.eyes);H3.lev.setLights(ST.eyes*.8);H3.lev.update(t,dt);H3.sea.update(t);H3.levTop.intensity=ST.eyes*2.6;H3.deepL.intensity=ST.eyes*1.4+ST.pass*3;if(ST.pass>0){H3.deepL.position.set(H3.cr.position.x*.6,H3.CH.y+2,-84);}H3.rays.visible=ST.set==='glimpse';
    if(ST.set==='glimpse'){H3.blue.intensity=.6;H3.amb.intensity=.12;H3.lev.setEyes(1);H3.lev.setLights(1);H3.levTop.intensity=2.2;}else H3.blue.color.setHex(0x5a62ff);
    poseHollow(dt);posePrisoners(dt);if(H3.nameL)H3.nameL.intensity=(ST.nameHeat||0)*2.4;}
  else{D.G.visible=X.G.visible=H3.G.visible=false;if(ST.set==='ship')updateShip(dt,t);else if(ST.set==='white')updateWhite(dt,t);}
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
function sh2scr(){scr('> RECORD · CAM 04 · ARCHIVE','rgba(232,200,120,A)');scr('SPEAR OF DESTINY · DISCHARGE');scr('RADIUS ······ UPPER ATMOSPHERE');scr('LIFE SIGNS IN RADIUS ··· 0','rgba(232,70,60,A)');}
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
  // she answers with the record this camera kept: the last time the Spear fired (the date is sealed)
  AU.fx.glitch();glitch(.3);await w(.3);ST.rec=1;shot('out',[-60,40,90],[-110,160,-520],[-50,34,70],[-115,220,-520],12);
  sh2scr();await w(1.2);
  AU.fx.boom();tw(ST,'beam',1,.25);await w(.6);
  await E('The last discharge of the Spear of Destiny.',null,.6);
  await M('What did it hit?','whisper',.8);
  await E('Everything above the city.',null,.9);
  tw(ST,'beam',0,2.6);await w(1.4);
  await E('Ours. Theirs. Everything in the sky.','soft',1.2);
  await M('When?','whisper',1);
  ST.rec=0;sh('ots',null,5);scr('DATE ··· RECORD SEALED','rgba(232,70,60,A)');await w(1.4);
  await E('Michael.',null,1);
  await E('Do not use the Spear.','soft',1.4);
  sh('close',null,5);await w(1.6);
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
  AU.fx.creature();tw(H3.cr.position,'y',-18,2.4);tw(ST,'eyes',0,2.4);ST.shake=.6;await w(2.4);clearInterval(fl);ST.torchF=1;ST.shake=0;
  // it comes back past him: along the water under the chamber, close under the surface, and it takes a long time to go by
  const cr=H3.cr;cr.scale.setScalar(1);cr.rotation.set(0,-Math.PI/2,0);cr.position.set(80,1,-112);   // twenty metres out past the glass
  // seen through the glass of the empty dome: the dark water beyond it, and the length of the thing going by
  shot('hollow',[2.4,-.4,-62],[-2,0,-112],[1.6,-.5,-63],[-16,0,-112],10);tw(ST,'pass',1,1.5);
  tw(ST,'eyes',.9,1.2);AU.fx.creature();tw(cr.position,'x',-110,10,true);ST.shake=.3;await w(3.2);ST.shake=.15;await w(3.4);ST.shake=0;
  // his face, watching the length of it go by
  const fy=floorAt(m.z);shot('hollow',[m.x+.55,fy+1.72,m.z-1.25],[m.x,fy+1.62,m.z],[m.x+.45,fy+1.7,m.z-1.05],[m.x,fy+1.62,m.z],5);tw(m,'aim',-.2,1.5);
  tw(ST,'blue',.9,1.5);await w(1.6);
  await M('...Oh my God.','whisper',1.6);
  tw(ST,'eyes',0,2);black(true,1.2);sub(null);await w(1.6);
  await title('ELYRA: THE HOLLOW',null,4.2);
}

/* ---------- 04 · NO CONTACT (Oct 22): the deck; Michael asks after the Pathfinder; ELYRA has nothing from her, and then something
   that is not hers: a helmet recorder aboard her dropship, going down into Astraea. Draft lines; Bryce rewrites ---------- */
function hud(c,d,r){hudEl.querySelector('.c').textContent=c;hudEl.querySelector('.d').textContent=d||'';hudEl.querySelector('.r').textContent=r||'● REC';}
async function T4(){
  const m=D.m;Object.assign(m,{x:-3,z:-4.62,yaw:0,sit:1,head:0,lean:0,speed:0});ST.dome=.35;ST.term=.85;
  black(true);await w(2.6);AU.humOn(.09,3);await w(1.6);
  sh('wide','wide2',14);black(false,1.4);await redOn();await w(1.2);
  sh('side','close',9);await M('ELYRA.','tired',1);
  AU.fx.boot();sh('ots','ots2',10);ST.screen=[];ST.typed=0;scr('> ELYRA');typeOn();await w(.8);
  await E('I am here.',null,.8);
  await M('The Pathfinder. Anything?',null,.6);
  scr('> QUERY: PATHFINDER · KEEPER SCOUT');await w(.9);scr('CONTACT ......... NONE','rgba(232,200,120,A)');
  await E('No contact.',null,.9);
  sh('close',null,6);await M('Since when?','tired',.6);
  await E('Eleven seconds of static, five nights ago. Nothing from her since.',null,1.2);
  sh('ots','ots2',8);tw(m,'lean',1,1.4);await M('Then why is the dome still listening?',null,1.4);
  scr('SIGNAL ......... NOT PATHFINDER','rgba(232,70,60,A)');scr('SOURCE ......... HELMET RECORDER');scr('CARRIER ........ HER DROPSHIP');AU.fx.pulse();
  await E('Because something on her frequency never stopped. It is not the ship.',null,.5);
  await E('It is a helmet recorder. Aboard her dropship.',null,1);
  sh('close',null,4);await M('Show me.','sharp',.4);
  // the feed: Okafor's helmet, going down
  AU.fx.glitch();await glitch(.35);black(true);await w(.4);
  Object.assign(ST,{win:'fire',fire:.6,redF:1,redRate:6,sparks:.6,brace:1,dim:0,shake:1,roll:.06});
  hud('HELM CAM · OKAFOR · PATHFINDER DROPSHIP','08.03.2237  · ASTRAEA ATMOSPHERE');
  shot('ship',[-1.15,1.3,1.5],[0,1.5,-5.5],[-1.12,1.28,1.45],[.4,1.6,-5.5],6);black(false,.15);AU.fx.boom();AU.breathe(true,1.6);
  tw(ST,'fire',1,4);
  await say('Ensign Landry','We’re in her atmosphere! I’ve got nothing, Captain, nothing!','sharp',.2);
  shot('ship',[-1.12,1.28,1.45],[1.4,1.2,-1.5],[-1.12,1.3,1.45],[1.4,1.25,-1.7],3);   // he looks across: Marsh, braced
  await say('Sergeant Marsh','Hold on! Everybody hold on!','sharp',.2);
  shot('ship',[-1.12,1.3,1.45],[.5,1.8,-4.6],[-1.12,1.32,1.4],[0,1.7,-6.4],3);ST.shake=2.2;tw(ST,'roll',-.25,2.5);
  await say('Captain Rhen','Landry, put her down anywhere! Anywhere!','sharp',.1);
  await w(.6);AU.fx.boom();AU.fx.thump();ST.shake=0;black(true);ST.fire=0;ST.sparks=0;sub(null);AU.fx.stat(1.2);await w(2.4);
  // after: dim, tilted, dust; someone leaning in
  Object.assign(ST,{win:'dusk',redF:.35,redRate:1,sparks:.15,brace:0,dim:.5,roll:.35});
  shot('ship',[-1.2,.9,1.6],[0,1.7,0],[-1.15,1.0,1.55],[.2,1.7,-.4],8);black(false,1.8);AU.breathe(true,.7);await w(1.6);
  await say('Sergeant Marsh','Okafor. Okafor, look at me.',null,.4);
  await say('Okafor','I’m fine.','tired',.6);
  await say('Captain Rhen','Status.',null,.4);
  await say('Ensign Landry','Ship’s dead.',null,1);
  AU.fx.glitch();await glitch(.3);black(true);AU.breathe(false);sub(null);await w(.8);
  // back on the deck
  Object.assign(ST,{roll:0,shake:0});sh('close',null,7);ST.screen=[];ST.typed=0;black(false,.6);
  await M('When was that?','tired',.5);
  scr('RECORDED ....... 08.03.2237');typeOn();await E('Eight March.',null,.8);
  await M('Five days. Are they alive?','tired',1.2);
  sh('ots','ots2',7);scr('RECORDER ....... RUNNING','rgba(140,240,176,A)');
  await E('I do not know, Michael. The recorder is still running.',null,2);
  AU.humOff(2);black(true,1.6);await w(2);
  await title('04 · NO CONTACT',null,3.6);
}

/* ---------- 05 · THE BEACON (Oct 22): Dropship Two's cockpit recorder, the night before Rhen's team reaches her. Her pilot, alone,
   hurt, keeping the beacon on. Draft lines; Bryce rewrites ---------- */
async function T5(){
  black(true);await w(1.6);
  SH.pilot.root.visible=true;SH.landry.root.visible=false;SH.rhen.root.visible=false;SH.marsh.root.visible=false;SH.thorne.root.visible=false;
  Object.assign(ST,{win:'dusk',redF:.4,redRate:.8,sparks:.08,brace:0,dim:.3,roll:.18,fire:0});
  hud('COCKPIT RECORDER · DROPSHIP TWO','08.03.2237  21:40  · ASTRAEA','● BEACON');
  shot('ship',[.2,1.55,-6.25],[-.55,1.2,-5.2],[.15,1.52,-6.2],[-.55,1.15,-5.1],14);black(false,2);AU.humOn(.05,3);
  const beep=setInterval(()=>{if(!ST)return clearInterval(beep);AU.fx.pulse();},2400);
  await w(2.4);
  await say('Dropship Two','Dropship Two. Emergency beacon, Keeper frequency. Anyone.','tired',2.2);
  AU.fx.crackle(1.2);await w(1.4);
  await say('Dropship Two','Core’s cold. I can’t feel my legs. I can hear rifles at the canyon mouth. Two sides.','tired',1.2);
  shot('ship',[-.2,1.5,-6.3],[-.55,1.3,-5.3],[-.25,1.48,-6.25],[-.6,1.25,-5.25],14);
  await say('Dropship Two','Same uniforms.','tired',2);
  await say('Dropship Two','Captain Rhen, if this reaches you: both of them want that case. One of them wants it destroyed.','tired',1.4);
  await say('Dropship Two','Don’t let them have it.','tired',2.4);
  ST.redF=.15;await say('Dropship Two','Beacon’s on repeat. It’ll run longer than I will.','tired',3);
  AU.fx.relay();ST.screen=[];await w(3.4);clearInterval(beep);
  black(true,2.4);AU.humOff(2.4);await w(2.6);SH.pilot.root.visible=false;for(const H of[SH.landry,SH.rhen,SH.marsh,SH.thorne])H.root.visible=true;
  await title('05 · LIGHT IN THE DARK',null,3.6);
}

/* ---------- 06 · THE WHITE CITY (Oct 22): Rhen's suit recorder, inside the white structure on Astraea, 10.03.2237: the message the
   Keepers received as eleven seconds of static, whole. Oct 22 (Bryce): word for word the warning Rhen gives at the end of The White City
   (js/pathfinder3/03-story.js), as it reached Tide City: broken up, and cut off where the Host come down. ---------- */
async function T6(){
  black(true);await w(1.6);
  Object.assign(ST,{dim:0,purple:.15,flick:0,aim:.3,hostV:0,roll:.04});for(const H of WC.host){H.root.visible=false;H.root.position.z=-34;}
  hud('SUIT RECORDER · CPT. A. RHEN · TRANSMITTING','10.03.2237  · ASTRAEA · WHITE STRUCTURE','● TX');
  shot('white',[.25,1.7,4.6],[0,1.55,2.1],[.2,1.68,4.3],[0,1.55,2.1],12);black(false,1.2);AU.humOn(.04,2);await w(1.2);
  await say('Captain Rhen','Tide City Command. This is Captain Rhen of the Pathfinder.',null,.4);
  await say('Captain Rhen','If this reaches you, listen carefully.',null,.3);
  AU.fx.stat(.5);glitch(.2);await say('Captain Rhen','We were wrong about the Heralds.',null,.2);
  await say('Captain Rhen','They’re not invading us. They’re running.',null,.3);
  AU.fx.crackle(1.4);ST.flick=.3;await w(.8);ST.flick=0;
  shot('white',[.2,1.68,4.3],[0,1.55,2.1],[.22,1.69,4.1],[0,1.56,2.1],14);
  await say('Captain Rhen','We found something here. Something older than them.',null,.3);
  await say('Captain Rhen','Whatever destroyed their civilization, it doesn’t have to happen again.',null,.2);
  AU.fx.stat(.4);glitch(.2);await say('Captain Rhen','There was another people here before them. They found a way to hold it back.',null,.3);
  await say('Captain Rhen','We have evidence. We have to get it home.',null,.4);
  // the light at the far end goes purple; shapes in it; the recorder turns to look
  shot('white',[.2,1.68,4.3],[0,1.55,2.1],[.3,1.7,3.6],[-.4,1.6,-8],5);
  AU.fx.glitch();tw(ST,'purple',1,1.2);ST.dim=.4;ST.aim=1;for(const H of WC.host)H.root.visible=true;ST.hostV=1.4;
  await say('Ensign Landry','Captain. Something’s entering the atmosphere.','sharp',.2);
  shot('white',[.3,1.7,3.6],[0,1.8,-30],[.2,1.65,3.4],[0,1.7,-28],6);
  await say('Captain Rhen','Command, do not activate the Spear until we—','sharp',0);
  AU.fx.creature();ST.flick=.5;await w(1.6);
  glx.classList.add('on');AU.fx.stat(1.4);await w(.9);black(true);glx.classList.remove('on');sub(null);AU.humOff(.5);
  await w(1);await title('TRANSMISSION ENDS<small>RECEIVED AT TIDE CITY AS ELEVEN SECONDS OF STATIC</small>','rec',3.4);
  await title('06 · THE WHITE CITY',null,3.6);
}

/* ---------- 07 · THE PRISONERS (Oct 22): under the Hollow King's mountain, 10–11.03.2237. The Empty Host have brought Rhen's team
   home with them. The King has them knelt at the glass of the drowned chamber and calls the Drowned Watcher up out of the water to
   take them. It comes, it looks at them, and it will not. He tries again. It goes. So they are kept in the caves, and their names go
   on the wall beside everyone else's, dated the day they stole the object. Rhen calls Tide City on his suit radio; nothing answers,
   and then the cave gives his own voice back to him, slowed, saying a name none of them know. Draft lines; Bryce rewrites ---------- */
async function T7(){
  const CH=H3.CH,fy=CH.y,c30=H3.curve.getPointAt(22/H3.curve.getLength()),nf=floorAt(c30.z);
  Object.assign(ST,{torch:0,blue:.22,amb:.05,eyes:0,pass:0,nameHeat:0});H3.H.root.visible=false;H3.crewU.R.value=0;H3.crewU.hot.value=1;
  const cr=H3.cr;cr.scale.setScalar(.6);cr.rotation.set(0,0,0);cr.position.set(0,-16,-112);
  // knelt in a row facing the glass, the King behind them at the plinth, his troopers either side
  P7.on=true;P7.crew.forEach((c,i)=>Object.assign(c,{x:(i-2)*1.9,z:CH.z-9.5-Math.abs(i-2)*.3,y:fy,yaw:0,kneel:1,look:0}));
  [[-4.2,-77],[4.2,-77],[-6.2,-82.5],[6.2,-82.5]].forEach(([x,z],i)=>Object.assign(P7.host[i],{x,z,y:fy,yaw:Math.atan2(x,-(-79-z))*0+(x<0?-.5:.5),on:true}));
  Object.assign(P7.K,{x:0,z:CH.z-3.4,y:fy,yaw:0,gesture:0,on:true});H3.H.root.visible=false;
  black(true);await w(1.4);
  await title('SUIT RECORDER · CPT. A. RHEN<small>11.03.2237 · 02:10 · LOCATION UNKNOWN · AUDIO DEGRADED</small>','rec',3.2);
  AU.humOn(.05,3);
  // the chamber from the door: the King, the five of them small against the glass, black water beyond
  shot('hollow',[0,1.4,-58],[0,-1.6,-86],[0,1.2,-60.5],[0,-1.8,-88],10);black(false,2.4);await w(2.6);
  await say('Okafor','Where are we?','whisper',1);
  await say('Thorne','Under something. There’s water all the way round.','whisper',1.2);
  // the King: low, looking up at him
  shot('hollow',[1.8,-2.2,-79],[0,1.6,CH.z-3.4],[1.5,-2.25,-79.4],[0,1.9,CH.z-3.4],6);await w(1.6);
  tw(P7.K,'gesture',1,1.6);AU.fx.surge();await say('The Hollow King','Rise. Here are the ones who stole from me.',null,.6);
  // the rings in the floor brighten; something comes up out of the dark beyond the glass
  tw(ST,'blue',.75,2.4);shot('hollow',[-1.4,-1.5,-77],[0,-3.8,-100],[-1.2,-1.6,-78.2],[0,-3.6,-100],10);
  tw(cr.position,'y',-4.6,5);tw(cr.position,'z',-101,6);tw(ST,'eyes',1,4);tw(ST,'pass',.45,4);AU.fx.creature();P7.crew.forEach(c=>tw(c,'look',.6,3));
  await w(3.2);await say('Sergeant Marsh','Captain.','whisper',.4);await say('Captain Rhen','I see it.','whisper',2.2);
  // their faces, the eyes outside the glass lighting them
  shot('hollow',[1.1,-1.5,-84.5],[-.4,-1.9,-79.6],[.9,-1.48,-84.2],[-.6,-1.9,-79.6],7);ST.shake=.15;await w(3.6);ST.shake=0;
  await say('Ensign Landry','It’s looking at us.','whisper',2.6);
  // it holds there a long time. Then it turns its head away from them, and from him
  shot('hollow',[3.2,-2.0,-85.6],[0,-4,-98],[3,-2.05,-85.4],[-1,-4.2,-98],10);await w(2.2);
  tw(cr.rotation,'y',.9,4.5);tw(ST,'eyes',.55,4.5);await w(2.6);
  await say('Thorne','It won’t.','whisper',.4);
  await say('The Hollow King','Take them.',null,.6);
  // he tries again: the light about him flares; it doesn't come back
  shot('hollow',[1.8,-2.2,-79],[0,1.6,CH.z-3.4],[2.1,-2.1,-78.6],[0,1.8,CH.z-3.4],5);tw(P7.K,'gesture',0,.6);await w(.7);tw(P7.K,'gesture',1.35,.8);AU.fx.surge();ST.shake=.3;await w(1.2);ST.shake=0;
  shot('hollow',[-1.4,-1.5,-77],[0,-4,-100],[-1.6,-1.4,-77.4],[-4,-6,-104],8);tw(cr.position,'y',-17,5);tw(cr.position,'x',-14,6);tw(ST,'eyes',0,4);tw(ST,'pass',0,4);AU.fx.creature();await w(3.4);
  await say('Ensign Landry','Why not?','whisper',1.2);
  // the King, after it: to the water, then to them
  shot('hollow',[1.8,-2.2,-79],[0,1.6,CH.z-3.4],[1.6,-2.15,-79.3],[0,1.75,CH.z-3.4],7);await w(.6);
  await say('The Hollow King','So. You still choose.',null,.9);
  await say('The Hollow King','Then they wait in the dark, Keepers. With the others.',null,1.4);
  tw(P7.K,'gesture',0,2);tw(ST,'blue',.22,3);black(true,1.6);sub(null);await w(2.4);
  // the caves: the five of them against the rock across from the wall of names; a Host trooper at the bend
  hidePrisoners();P7.on=true;P7.K.on=false;P7.host.forEach((h,i)=>h.on=i===0);
  P7.crew.forEach((c,i)=>Object.assign(c,{x:c30.x-2.15,z:c30.z-3.2+i*1.6,y:floorAt(c30.z-3.2+i*1.6),yaw:-Math.PI/2,kneel:1,look:0}));
  {const zz=c30.z-11;Object.assign(P7.host[0],{x:c30.x-.4,z:zz,y:floorAt(zz),yaw:Math.PI});}
  Object.assign(ST,{blue:.1,amb:.05});
  // the wall: one name after another cut into it, burning, and cooling black like the rest
  const mz=H3.me.z,my=H3.me.y;shot('hollow',[c30.x-1.4,my+.15,c30.z+.2],[c30.x+3,my+.2,c30.z+.2],[c30.x-1.0,my+.2,c30.z+.1],[c30.x+3,my+.22,c30.z+.1],13);black(false,1.4);
  for(let i=0;i<5;i++){ST.nameHeat=1;AU.fx.relay();tw(H3.crewU.R,'value',i+1,1.5,true);await w(1.9);tw(ST,'nameHeat',.25,.8);await w(.25);}
  tw(H3.crewU.hot,'value',0,3);tw(ST,'nameHeat',0,3);await w(1.6);
  // Rhen, against the far wall, at the radio on his wrist
  const rh=P7.crew[2];shot('hollow',[c30.x-.6,rh.y+1.05,rh.z-1.6],[rh.x,rh.y+.95,rh.z],[c30.x-.75,rh.y+1.0,rh.z-1.3],[rh.x,rh.y+.95,rh.z],12);tw(rh,'look',.4,1.5);
  await w(1.2);AU.fx.stat(.4);
  await say('Captain Rhen','Tide City Command. This is Captain Rhen.','tired',1.2);
  await say('Captain Rhen','Is anybody receiving.','tired',3.2);
  // nothing; then the cave answers in his own voice, slow, from somewhere further in
  AU.humOff(1.2);await w(1.2);AU.fx.echo();shot('hollow',[c30.x-1.1,c30.y+.3,c30.z+6],[c30.x-.4,c30.y-1.2,c30.z-14],[c30.x-1.0,c30.y+.25,c30.z+5.4],[c30.x-.4,c30.y-1.4,c30.z-16],8);
  await w(.8);await say('Captain Rhen','Michael.','echo',.3);await say('Captain Rhen','Michael.','echo2',1.8);
  shot('hollow',[c30.x-.9,rh.y+1.0,rh.z+1.8],[rh.x-.2,rh.y+.95,rh.z-1.4],[c30.x-.85,rh.y+1.0,rh.z+1.6],[rh.x-.2,rh.y+.95,rh.z-1.4],7);
  await say('Sergeant Marsh','Who’s Michael?','whisper',1.4);
  await say('Captain Rhen','I don’t know.','whisper',2.2);
  black(true,1.6);sub(null);await w(2);hidePrisoners();
  await title('07 · TAKEN',null,3.6);
}

/* ---------- running one ---------- */
function build(){if(built)return;built=true;mount();buildDeck();buildOutside();buildHollow();buildShip();buildWhite();}
function skip(){if(!RUN||RUN.dead)return;RUN.dead=true;RUN.skipRes();V.hush();}
const key=e=>{if(!RUN)return;if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();e.stopPropagation();skip();}else root.querySelector('.skip').hidden=false;};
async function play(n,opts){opts=opts||{};
  build();if(RUN)return;RUN={n,dead:false};RUN.skipP=new Promise(r=>RUN.skipRes=r);
  ST=freshState();TW=[];SHOT=null;root.hidden=false;root.classList.remove('cur','cctv','helm');root.querySelector('.skip').hidden=true;sub(null);titleEl.className='title';black(true);
  H3.cr.position.set(0,-14,-100);H3.cr.scale.setScalar(.6);H3.cr.rotation.set(0,0,0);X.F.visible=false;hidePrisoners();H3.H.root.visible=true;H3.crewU.R.value=5;H3.crewU.hot.value=0;
  last=0;if(!raf)raf=requestAnimationFrame(frame);addEventListener('keydown',key,true);
  AU.start();AU.stopMusic(.6);
  try{if(opts.noscript)await RUN.skipP;else await[T1,T2,T3,T4,T5,T6,T7][n-1]();}catch(e){if(e!==ABORT)console.error(e);}
  removeEventListener('keydown',key,true);V.hush();AU.stopScene();clearInterval(typer);sub(null);
  root.style.transition='opacity .9s';root.style.opacity='0';const r=RUN;RUN=null;
  setTimeout(()=>{root.hidden=true;root.style.opacity='';root.style.transition='';ST=null;},950);
  if(opts.done)opts.done(r&&r.dead);}
return{play,NAMES,get on(){return!!RUN;},_dbg:()=>({H3,ST,camera,shot,black})};
})();
