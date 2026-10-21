/* Elyra · the prologue, in 3D. Plays before The Mountain's command deck (in the campaign and in Archive 01 on its own):
   who the Remnant are, what Elyra is, the Keepers, the Codex, the Hollow King, the theft, and the Pathfinder.
   Ten shots, each its own little three.js set (built once, far apart in one scene), narrated by Master Elias Veyr through the
   shared radio voices (sfx.speak). Uses the game's own pieces: the ark and Keeper ship hulls (js/shared/ships.js), the Keeper
   Marine models and the Hollow King (js/origin/02-people.js, js/shared/models.js).
   PROLOGUE.play(done) · Skip button, Enter or Esc skip it. Every line is in PROLOGUE.LINES and in the script doc. */
const PROLOGUE=(()=>{
const VW=1600,VH=900,still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const st=document.createElement('style');st.textContent=`
#prol{position:fixed;inset:0;z-index:60;background:#000}#prol canvas{position:absolute;inset:0;width:100%;height:100%}
#prol .psub{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 7vh);transform:translateX(-50%);width:min(900px,88vw);text-align:center;opacity:0;transition:opacity .3s;
  font:500 17px/1.5 'Chakra Petch','Arial Narrow',system-ui,sans-serif;letter-spacing:.03em;color:#eef0f4;text-shadow:0 1px 4px #000,0 0 2px #000}
#prol .psub.on{opacity:1}#prol .psub b{display:block;font:600 10px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.26em;color:rgba(217,178,90,.9);text-transform:uppercase;margin-bottom:3px}
#prol .ptitle{position:absolute;inset:0;display:grid;place-items:center;align-content:center;text-align:center;opacity:0;transition:opacity 1.4s;pointer-events:none;padding:0 6vw;
  font:500 clamp(22px,4.4vw,48px)/1.25 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.42em;color:#e6e4df}
#prol .ptitle small{display:block;margin-top:14px;font:400 11px 'JetBrains Mono',monospace;letter-spacing:.3em;color:rgba(230,228,223,.5)}
#prol .ptitle.on{opacity:1}#prol .ptitle.sm{font-size:clamp(12px,1.6vw,15px);letter-spacing:.32em;color:rgba(230,228,223,.75)}
#prol .vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 50%,rgba(0,0,0,.7) 100%)}
#prol .bar{position:absolute;left:0;right:0;height:8vh;background:#000}#prol .bar.t{top:0}#prol .bar.b{bottom:0}
#prol .fade{position:absolute;inset:0;background:#000;pointer-events:none}
#prol .tag{position:absolute;left:50%;transform:translateX(-50%);font:600 clamp(11px,1.5vw,16px) 'JetBrains Mono',monospace;letter-spacing:.24em;color:#ff7a5a;text-shadow:0 0 12px rgba(255,90,60,.6);opacity:0;transition:opacity .4s;white-space:nowrap}
#prol .tag.on{opacity:1}
#prol .pskip{position:absolute;right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 14px);padding:8px 14px;border:1px solid rgba(230,228,223,.3);border-radius:3px;
  background:rgba(0,0,0,.5);color:rgba(230,228,223,.8);font:700 11px 'Chakra Petch',sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer}
@media (max-width:760px){#prol .psub{font-size:15px;bottom:calc(env(safe-area-inset-bottom,0px) + 10vh)}}`;
document.head.appendChild(st);

/* ---------- the narration ---------- */
const E='Elias Veyr',M='Lt. Michael';
const LINES={
  earth:[[E,'Before Elyra, there was Earth. We call its end the Great Collapse. The Archive does not say what caused it.'],[E,'Scripture says Heralds came down at the end, bright as angels, with one warning: something is coming. We teach it to children as a parable.']],
  arks:[[E,'Nine arks left the dying world. Three arrived. Everyone alive on Elyra is descended from those three.'],[E,'We call ourselves the Remnant.']],
  elyra:[[E,'Elyra was waiting for us. An ocean over almost all of it, deeper than we have ever measured. Air we could breathe. And on the shore, a city of white stone that no human hand had built.']],
  city:[[E,'We built Tide City in its shadow, around the Spear we carried out of the Collapse. We teach our children that we found this world by chance.'],[E,'The Archive does not use that word.']],
  keepers:[[E,'The Keepers keep the Remnant. We hold the city, we fly the fleet, and we guard the Archive: everything humanity ever knew, and everything it chose to forget.'],
    [M,'Lieutenant Michael Hall, Interceptor Wing. When the Keepers go somewhere they shouldn’t, I go first.']],
  codex:[[E,'The heart of the Archive is the Codex. Every jump route between our colonies is written in it. Without it, every ship we have flies blind.'],[E,'Codex is only our filing word. Its oldest pages give it another name: the Testament of the First Word.']],
  king:[[E,'South of the city are the old mountains, where nothing grows. Something lives there that calls itself the Hollow King.'],[E,'His Empty Host do not speak. They do not stop.']],
  theft:[[E,'Three nights ago he walked into the Archive, past every Keeper on watch, and walked out with the Codex.']],
  pathfinder:[[E,'We sent the Pathfinder after him. Captain Rhen and forty-one crew, the fastest ship we had. She followed his trail into the dark, to a world called Astraea.']],
  silence:[[E,'Three days later, she sent us one message.'],[E,'Then nothing.']],
};

/* ---------- stage ---------- */
let shared=null,saved=null,home=null,root,cv,subEl,titleEl,fadeEl,tagA,tagB,renderer,composer,scene,camera,R=null,S=null,raf=0,last=0,built=false;
const SETS={};
const lin=h=>new THREE.Color(h).convertSRGBToLinear();
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function mount(){root=document.createElement('div');root.id='prol';root.setAttribute('role','dialog');root.setAttribute('aria-label','Prologue');
  root.innerHTML='<canvas></canvas><div class="vig"></div><div class="bar t"></div><div class="bar b"></div><div class="tag" style="top:28%"></div><div class="tag" style="top:66%"></div><div class="fade"></div><div class="psub" aria-live="polite"><b></b><span></span></div><div class="ptitle"></div><button class="pskip" type="button">Skip ›</button>';
  document.body.appendChild(root);cv=root.querySelector('canvas');subEl=root.querySelector('.psub');titleEl=root.querySelector('.ptitle');fadeEl=root.querySelector('.fade');[tagA,tagB]=root.querySelectorAll('.tag');
  root.querySelector('.pskip').addEventListener('click',skip);
  // On a chapter page, borrow the chapter's own renderer instead of opening a second WebGL context: iPhones run short of GPU memory
  // with two, and the chapter's context could be lost during a long prologue (the command-deck cutscene after it then never showed).
  shared=window.ELYRA_RENDERER||null;
  if(shared){cv.remove();cv=shared.domElement;renderer=shared;}
  else{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});
    renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
  scene=new THREE.Scene();scene.background=new THREE.Color(0x000000);camera=new THREE.PerspectiveCamera(40,1,.1,20000);
  try{if(THREE.EffectComposer&&THREE.UnrealBloomPass){composer=new THREE.EffectComposer(renderer);composer.addPass(new THREE.RenderPass(scene,camera));composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(512,512),.7,.5,.8));if(THREE.GammaCorrectionShader)composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
  resize();addEventListener('resize',resize);}
function borrow(){if(!shared)return;
  const c=shared.domElement;home={parent:c.parent||c.parentNode,next:c.nextSibling,style:c.getAttribute('style')||''};
  saved={pr:shared.getPixelRatio(),tm:shared.toneMapping,ex:shared.toneMappingExposure,enc:shared.outputEncoding,sh:shared.shadowMap.enabled,st:shared.shadowMap.type,ac:shared.autoClear};
  root.insertBefore(c,root.firstChild);c.style.cssText='position:absolute;inset:0;width:100%;height:100%';
  shared.outputEncoding=THREE.sRGBEncoding;shared.toneMapping=THREE.ACESFilmicToneMapping;shared.toneMappingExposure=1.1;shared.shadowMap.enabled=true;shared.shadowMap.type=THREE.PCFSoftShadowMap;shared.autoClear=true;resize();}
function giveBack(){if(!shared||!home)return;const c=shared.domElement;
  if(home.parent)home.parent.insertBefore(c,home.next&&home.next.parentNode===home.parent?home.next:null);c.setAttribute('style',home.style);
  shared.setPixelRatio(saved.pr);shared.toneMapping=saved.tm;shared.toneMappingExposure=saved.ex;shared.outputEncoding=saved.enc;shared.shadowMap.enabled=saved.sh;shared.shadowMap.type=saved.st;shared.autoClear=saved.ac;
  shared.setSize(innerWidth,innerHeight);home=null;dispatchEvent(new Event('resize'));}
function resize(){if(!renderer||(shared&&!home))return;const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.5:1.75));renderer.setSize(w,h,false);if(composer)composer.setSize(w,h);
  camera.aspect=w/h;camera.fov=w<h?62:40;camera.updateProjectionMatrix();}
function tex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
let gT=null;const glowT=()=>gT||(gT=tex(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.45)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);}));
const sprite=(col,s,o)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT(),color:lin(col).multiplyScalar(o||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));m.scale.setScalar(s);return m;};
function stars(G,n,r){const p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const v=V3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(r*(.8+Math.random()*.2));p.set([v.x,v.y,v.z],i*3);const k=.5+Math.random()*.5;c.set([k,k,k*1.05],i*3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));const s=new THREE.Points(g,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,vertexColors:true,depthWrite:false}));G.add(s);return s;}
// a planet: an equirectangular texture painted in code, an atmosphere shell
function planet(G,r,paint,atm,opts){opts=opts||{};const t=tex(1024,512,paint);const m=new THREE.MeshStandardMaterial({map:t,roughness:.85,metalness:0});
  if(opts.emissive){m.emissiveMap=opts.emissive;m.emissive=lin(0xff6a2a);m.emissiveIntensity=0;}
  const p=new THREE.Mesh(new THREE.SphereGeometry(r,96,64),m);G.add(p);
  const a=new THREE.Mesh(new THREE.SphereGeometry(r*1.04,64,48),new THREE.MeshBasicMaterial({color:lin(atm),transparent:true,opacity:.18,blending:THREE.AdditiveBlending,side:THREE.BackSide,depthWrite:false}));G.add(a);
  return{p,m,a};}
function noiseLand(g,w,h,sea,land,thr,seed){const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=x/w,v=y/h,th=u*Math.PI*2,ph=v*Math.PI;
    const nx=Math.cos(th)*Math.sin(ph)*3.4+seed,ny=Math.cos(ph)*3.4,nz=Math.sin(th)*Math.sin(ph)*3.4;const n=fbm(nx+nz*.7,ny+nz*.4);const k=(y*w+x)*4,L=n>thr,c=L?land(n,v):sea(n,v);img.data[k]=c[0];img.data[k+1]=c[1];img.data[k+2]=c[2];img.data[k+3]=255;}
  g.putImageData(img,0,0);}

/* ---------- the ten sets ---------- */
function build(){if(built)return;built=true;
  const SP=6000;let ox=0;const at=()=>{const G=new THREE.Group();G.position.x=(ox++)*SP;G.visible=false;scene.add(G);return G;};
  // 1 · EARTH, breaking
  {const G=at(),cr=tex(1024,512,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.strokeStyle='#fff';g.lineCap='round';
      const crack=(x,y,a,len,wd,d)=>{if(d>5||len<4)return;g.lineWidth=wd;g.beginPath();g.moveTo(x,y);for(let k=0;k<6;k++){a+=(Math.random()-.5)*.9;x+=Math.cos(a)*len/6;y+=Math.sin(a)*len/6;g.lineTo(x,y);}g.stroke();crack(x,y,a+.6,len*.6,wd*.7,d+1);if(Math.random()<.6)crack(x,y,a-.7,len*.55,wd*.6,d+1);};
      g.shadowColor='#fff';g.shadowBlur=6;for(let i=0;i<14;i++)crack(Math.random()*w,h*.2+Math.random()*h*.6,Math.random()*7,120+Math.random()*120,2.2,0);});
    const E=planet(G,10,(g,w,h)=>noiseLand(g,w,h,(n,v)=>[18,50+n*40,95+n*60],(n,v)=>v<.08||v>.92?[230,235,240]:n>.62?[120+n*40,105+n*30,80]:[50+n*40,90+n*50,45],.5,3),0x5aa0ff,{emissive:cr});
    const sun=new THREE.DirectionalLight(0xfff2e0,2.2);sun.position.set(-40,10,20);G.add(sun);G.add(new THREE.AmbientLight(0x101520,.4));stars(G,2500,2000);
    const fire=sprite(0xff6a2a,30,1.2);fire.material.opacity=0;G.add(fire);
    SETS.earth={G,cam:t=>({p:V3(Math.sin(t*.03)*36,4-t*.08,Math.cos(t*.03)*36),l:V3(0,0,0)}),update:(t)=>{E.p.rotation.y=t*.04;const k=Math.min(1,t/9);E.m.emissiveIntensity=k*1.8;fire.material.opacity=k*.25;E.m.color.setScalar(1-.55*k);}};}
  // 2 · THE ARKS: nine leave, three arrive
  {const G=at();stars(G,3000,3000);const sun=new THREE.DirectionalLight(0xdfe8ff,1.6);sun.position.set(20,30,10);G.add(sun);G.add(new THREE.AmbientLight(0x202838,.5));
    const V=[capitalShip(0),capitalShip(1),capitalShip(2)],hull=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.6,map:typeof panelTex!=='undefined'?panelTex:null}),gl=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)});
    const arks=[];for(let i=0;i<9;i++){const v=V[i%3],g=new THREE.Group(),hm=hull.clone();hm.transparent=true;g.add(new THREE.Mesh(v.geo,hm));const gm=new THREE.Mesh(v.glowGeo,gl.clone());g.add(gm);g.scale.setScalar(.02);
      g.position.set((i%3-1)*28+(Math.random()-.5)*8,((i/3|0)-1)*14+(Math.random()-.5)*6,-i*6);g.rotation.y=Math.PI;G.add(g);const eng=sprite(0x8fd8ff,6,1.8);eng.position.set(g.position.x,g.position.y,g.position.z+11);G.add(eng);
      const fl=sprite(0xffd8a0,30,2.4);fl.material.opacity=0;G.add(fl);
      arks.push({g,gm,eng,hm,fl,lost:i%3!==1,base:g.position.clone(),sp:4+Math.random()});}
    SETS.arks={G,cam:t=>({p:V3(60-t*1.5,18,40-t*4),l:V3(0,0,-40-t*4)}),update:(t)=>{for(const a of arks){a.g.position.z=a.base.z-t*a.sp;a.eng.position.z=a.g.position.z+11;const d=a.lost?Math.min(1,Math.max(0,(t-3-(a.base.z/-6)*.5)/3)):0;
      a.g.position.y=a.base.y-d*3;a.g.rotation.z=d*.25;a.eng.material.opacity=1-d;a.gm.material.color.setScalar(2*(1-d));
      // a lost ark goes dark, flares once, and is gone
      a.hm.opacity=1-Math.max(0,(d-.6)/.4);a.g.visible=d<1;a.fl.position.copy(a.g.position);a.fl.material.opacity=a.lost?Math.max(0,1-Math.abs(d-.8)/.15):0;}}};}
  // 3 · ELYRA: an ocean world, a gold light on one shore
  {const G=at();stars(G,2500,2000);const sun=new THREE.DirectionalLight(0xfff4e6,2.4);sun.position.set(-30,12,30);G.add(sun);G.add(new THREE.AmbientLight(0x0a1420,.5));
    const P=planet(G,12,(g,w,h)=>noiseLand(g,w,h,(n,v)=>[10,70+n*60,110+n*70],(n,v)=>[200,190,160],.66,11),0x6ad0ff);
    const cl=new THREE.Mesh(new THREE.SphereGeometry(12.15,64,48),new THREE.MeshStandardMaterial({map:tex(1024,512,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<500;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.25})`;g.beginPath();g.ellipse(Math.random()*w,h*.1+Math.random()*h*.8,20+Math.random()*90,4+Math.random()*10,0,0,7);g.fill();}}),transparent:true,depthWrite:false,roughness:1}));G.add(cl);
    const glint=sprite(0xffd890,1.6,2.4);glint.position.set(-7,4.5,8.6);G.add(glint);
    SETS.elyra={G,cam:t=>({p:V3(-8+t*.4,4,44-t*.9),l:V3(-2,1,0)}),update:(t)=>{P.p.rotation.y=.6+t*.02;cl.rotation.y=.6+t*.026;glint.material.opacity=.7+.3*Math.sin(t*2.2);}};}
  // 4 · TIDE CITY at dusk, the Spear over the bay
  {const G=at();G.add(new THREE.HemisphereLight(0xffb48a,0x1a1424,.7));const sun=new THREE.DirectionalLight(0xff9a5a,1.8);sun.position.set(-300,60,-200);G.add(sun);
    const sky=new THREE.Mesh(new THREE.SphereGeometry(3000,32,16),new THREE.MeshBasicMaterial({side:THREE.BackSide,map:tex(16,256,(g,w,h)=>{const r=g.createLinearGradient(0,0,0,h);r.addColorStop(0,'#0c1028');r.addColorStop(.42,'#4a2a4a');r.addColorStop(.5,'#e0805a');r.addColorStop(.52,'#20202c');r.addColorStop(1,'#05060a');g.fillStyle=r;g.fillRect(0,0,w,h);}),fog:false}));G.add(sky);
    const sea=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),new THREE.MeshStandardMaterial({color:lin(0x1a2a40),roughness:.15,metalness:.8}));sea.rotation.x=-Math.PI/2;G.add(sea);
    // the city (js/shared/skyline.js): towers around the Spear, thinning out toward the edges of the bay
    const SK=SKYLINE.build({n:150,h:95,w:20,unit:5,lit:.6,seed:404,traffic:30,place:(i,r)=>{const a=(r()-.5)*2.3,rr=45+Math.pow(r(),.8)*430;let x=Math.sin(a)*rr,z=-Math.cos(a)*rr-60;const d=Math.hypot(x,z+160);if(d<30){x+=(x||1)/Math.max(d,1)*(30-d);z+=(z+160)/Math.max(d,1)*(30-d);}return[x,z,1-rr/520];}});   // (kept clear of the Spear's foot)
    G.add(SK.G);
    const spear=new THREE.Group();spear.position.set(0,0,-160);G.add(spear);const sh=new THREE.Mesh(new THREE.CylinderGeometry(1.8,6,220,8),new THREE.MeshStandardMaterial({color:lin(0xf0eadc),roughness:.35,metalness:.4}));sh.position.y=110;spear.add(sh);
    const tip=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:lin(0xd9b25a),emissive:lin(0x8a6420),metalness:.9,roughness:.2}));tip.scale.set(4,20,4);tip.position.y=232;spear.add(tip);
    const tg=sprite(0xffd890,40,1.8);tg.position.y=236;spear.add(tg);const tl=new THREE.PointLight(lin(0xffd27a),3,400,1.2);tl.position.y=230;spear.add(tl);
    SETS.city={G,fog:[0x3a2a3a,.0022],cam:t=>({p:V3(-140+t*6,30+t*1.5,260-t*12),l:V3(0,90,-160)}),update:(t)=>{tg.material.opacity=.8+.2*Math.sin(t*1.5);SK.update(t);}};}
  // 5 · THE KEEPERS, and Michael at the front
  {const G=at();G.add(new THREE.HemisphereLight(0x8aa8d8,0x101418,.5));const key=new THREE.SpotLight(0xdfe8ff,3,80,.6,.6,1.2);key.position.set(6,18,16);key.target.position.set(0,1,0);key.castShadow=true;G.add(key,key.target);
    const rim=new THREE.DirectionalLight(0x7fb0ff,1.2);rim.position.set(0,8,-20);G.add(rim);
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(80,60),new THREE.MeshStandardMaterial({color:lin(0x1a1d24),roughness:.4,metalness:.6,map:typeof panelTex!=='undefined'?panelTex:null}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;G.add(fl);
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(80,30),new THREE.MeshStandardMaterial({color:lin(0x14161c),roughness:.8}));wall.position.set(0,15,-10);G.add(wall);
    const gold=new THREE.MeshStandardMaterial({color:lin(0xd9b25a),emissive:lin(0x5a3a08),metalness:.9,roughness:.25});
    for(const r of[5.6,3.8]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,.12,8,96),gold);t.position.set(0,8.5,-9.8);G.add(t);}
    for(const a of[0,Math.PI/2,Math.PI/4,-Math.PI/4]){const b=new THREE.Mesh(new THREE.BoxGeometry(11.2,.1,.1),gold);b.position.set(0,8.5,-9.8);b.rotation.z=a;G.add(b);}
    const people=[];for(let i=-4;i<=4;i++){const H=makeHuman('marine');H.root.position.set(i*1.6,0,i?-1.2-Math.abs(i)*.15:0);H.root.rotation.y=Math.PI;G.add(H.root);MODELS.dress(H,i?'marine':'hero');people.push(H);}
    const ITC2=interceptorGeo(),im=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.5}),ig=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)});
    const ships=[];for(let i=0;i<3;i++){const g=new THREE.Group();g.add(new THREE.Mesh(ITC2.geo,im),new THREE.Mesh(ITC2.glow,ig));g.scale.setScalar(.14);G.add(g);ships.push(g);}
    SETS.keepers={G,cam:t=>({p:V3(-9+t*.8,1.6+t*.03,7.5-t*.25),l:V3(t*.25-2,1.4,0)}),update:(t,dt)=>{for(const H of people)poseHuman(H,dt,0,0);ships.forEach((g,i)=>{g.position.set(-40+((t*9+i*30)%90),16+i*2,-20-i*6);g.rotation.y=-Math.PI/2;});}};}
  // 6 · THE CODEX in the Archive
  const vault=(G,purple)=>{const fl=new THREE.Mesh(new THREE.CircleGeometry(30,64),new THREE.MeshStandardMaterial({color:lin(0x16130e),roughness:.5,metalness:.5}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;G.add(fl);
    const pm=new THREE.MeshStandardMaterial({color:lin(0x3a3022),roughness:.5,metalness:.6});for(let i=0;i<16;i++){const a=i/16*Math.PI*2,c=new THREE.Mesh(new THREE.BoxGeometry(1.4,20,1.4),pm);c.position.set(Math.cos(a)*14,10,Math.sin(a)*14);c.castShadow=true;G.add(c);
      const strip=new THREE.Mesh(new THREE.BoxGeometry(.12,16,.12),new THREE.MeshBasicMaterial({color:lin(purple?0x6a3aa0:0xd9b25a)}));strip.position.set(Math.cos(a)*13.2,9,Math.sin(a)*13.2);G.add(strip);}
    const pl=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.3,1.6,32),new THREE.MeshStandardMaterial({color:lin(0x2a241a),roughness:.4,metalness:.7}));pl.position.y=.8;pl.castShadow=pl.receiveShadow=true;G.add(pl);};
  {const G=at();vault(G,false);G.add(new THREE.AmbientLight(0x1a140c,.6));const sp=new THREE.SpotLight(0xffe0a0,6,40,.35,.6,1.3);sp.position.set(0,20,0);sp.target.position.set(0,1,0);sp.castShadow=true;G.add(sp,sp.target);
    const gold=new THREE.MeshStandardMaterial({color:lin(0xd9b25a),emissive:lin(0x7a5010),metalness:.95,roughness:.18});const codex=new THREE.Group();codex.position.y=3.6;G.add(codex);
    for(let i=0;i<4;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(1.2-i*.12,.05,8,64),gold);t.rotation.set(i*.8,i*.5,0);codex.add(t);}codex.add(sprite(0xffd890,2.6,2.4));const cl=new THREE.PointLight(lin(0xffc860),2.5,20,1.5);codex.add(cl);
    const motes=[];for(let i=0;i<60;i++){const m=sprite(0xffe8b0,.12,1.2);m.position.set((Math.random()-.5)*6,Math.random()*12,(Math.random()-.5)*6);G.add(m);motes.push(m);}
    SETS.codex={G,cam:t=>({p:V3(Math.sin(t*.12)*7.5,3.8+Math.sin(t*.2)*.3,Math.cos(t*.12)*7.5),l:V3(0,3.4,0)}),update:(t)=>{codex.children.forEach((c,i)=>{if(c.isMesh){c.rotation.y+=.004*(i+1);c.rotation.x+=.003*(4-i);}});motes.forEach((m,i)=>{m.position.y=(m.position.y+.004)%12;});}};}
  // 7 · THE HOLLOW KING and his Empty Host, in the old mountains
  {const G=at();G.add(new THREE.HemisphereLight(0x6a3a8a,0x0a0610,.6));const back=new THREE.DirectionalLight(0xb070ff,1.6);back.position.set(0,20,-60);G.add(back);
    const sky=new THREE.Mesh(new THREE.SphereGeometry(2000,32,16),new THREE.MeshBasicMaterial({side:THREE.BackSide,map:tex(16,256,(g,w,h)=>{const r=g.createLinearGradient(0,0,0,h);r.addColorStop(0,'#08040e');r.addColorStop(.45,'#3a1a4a');r.addColorStop(.5,'#8a4ab0');r.addColorStop(.53,'#120a18');r.addColorStop(1,'#000');g.fillStyle=r;g.fillRect(0,0,w,h);}),fog:false}));G.add(sky);
    const mg=new THREE.PlaneGeometry(1200,500,160,60);mg.rotateX(-Math.PI/2);const mp=mg.attributes.position;for(let i=0;i<mp.count;i++){const x=mp.getX(i),z=mp.getZ(i);const far=Math.max(0,(-z-40)/200);mp.setY(i,ridged(x*.006,z*.006)*90*far*far+(z<-80?20:0)*far);}mg.computeVertexNormals();
    const mt=new THREE.Mesh(mg,new THREE.MeshStandardMaterial({color:lin(0x1a1020),roughness:.95,flatShading:true}));mt.position.z=-180;G.add(mt);
    const K=makeHollowKing();K.root.position.set(0,0,0);K.root.rotation.y=Math.PI;dressKing(K);G.add(K.root);const kl=new THREE.PointLight(lin(0xc080ff),2.5,20,1.5);kl.position.set(0,6,4);G.add(kl);
    const host=[];for(let row=0;row<5;row++)for(let i=-7;i<=7;i++){if(row===0&&Math.abs(i)<2)continue;const H=makeHuman('trooper');if(row<2)MODELS.dress(H,'host');H.root.position.set(i*2.4+(row%2)*1.2,0,-5-row*3.2);H.root.rotation.y=Math.PI;G.add(H.root);host.push(H);}
    SETS.king={G,fog:[0x1a0c22,.006],cam:t=>({p:V3(Math.sin(t*.05)*3,1.2+t*.08,16-t*.7),l:V3(0,4.2,0)}),update:(t,dt)=>{poseKing(K,dt,Math.min(1,t/5)*.6);for(const H of host)poseHuman(H,dt,0,1);}};}
  // 8 · THE THEFT: the plinth empty, the door broken, purple light where the Codex was
  {const G=at();vault(G,true);G.add(new THREE.AmbientLight(0x100818,.6));const door=new THREE.SpotLight(0xa45cff,2.6,60,.5,.6,1.4);door.position.set(-16,6,-6);door.target.position.set(0,0,0);door.castShadow=true;G.add(door,door.target);
    const slab=new THREE.MeshStandardMaterial({color:lin(0x2a2620),roughness:.6,metalness:.5});for(const [x,z,r] of[[-13,-4,.4],[-11,-7,-.6]]){const s=new THREE.Mesh(new THREE.BoxGeometry(4,.5,6),slab);s.position.set(x,.3,z);s.rotation.set(.1,r,.2);G.add(s);}
    const hm=new THREE.MeshStandardMaterial({color:lin(0xdfe3e8),roughness:.35,metalness:.4}),band=new THREE.MeshStandardMaterial({color:lin(0x284c78),roughness:.4});
    for(const [x,z,a] of[[3,4,.3],[-4,6,1.2],[6,-3,2.2]]){const h=new THREE.Group();const s=new THREE.Mesh(new THREE.SphereGeometry(.32,20,14),hm);s.scale.set(1,1.1,1.05);h.add(s);const b=new THREE.Mesh(new THREE.BoxGeometry(.4,.1,.36),band);b.position.set(0,.05,-.18);h.add(b);h.position.set(x,.3,z);h.rotation.set(1.2,a,0);G.add(h);}
    const pg=sprite(0xa45cff,6,1.4);pg.position.set(0,2.5,0);G.add(pg);
    SETS.theft={G,cam:t=>({p:V3(7-t*.3,3.5,9-t*.2),l:V3(0,1.2,0)}),update:(t)=>{door.intensity=2.4+Math.sin(t*9)*Math.sin(t*3.3)*.8;pg.material.opacity=.25+.15*Math.sin(t*2);}};}
  // 9 · THE PATHFINDER, after him into the dark, to Astraea
  {const G=at();stars(G,3000,3000);const sun=new THREE.DirectionalLight(0xfff0e0,2);sun.position.set(30,20,30);G.add(sun);G.add(new THREE.AmbientLight(0x202430,.4));
    const A=planet(G,40,(g,w,h)=>noiseLand(g,w,h,(n,v)=>[90+n*60,30,20],(n,v)=>[160+n*50,70,40],.55,21),0xff7a4a);A.p.parent.remove(A.p);A.a.parent.remove(A.a);const ap=new THREE.Group();ap.add(A.p,A.a);ap.position.set(120,30,-400);G.add(ap);
    const F=flagshipGeo(),ship=new THREE.Group();ship.add(new THREE.Mesh(F.geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.6})),new THREE.Mesh(F.glow,new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)})));ship.scale.setScalar(.012);ship.rotation.y=Math.PI;G.add(ship);
    const streak=new THREE.Mesh(new THREE.CylinderGeometry(.15,.6,1,12,1,true),new THREE.MeshBasicMaterial({color:lin(0x9fe8ff).multiplyScalar(2),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));streak.rotation.x=Math.PI/2;G.add(streak);
    const eng=sprite(0x8ff0ff,3,2);G.add(eng);
    if(typeof MODELS!=='undefined')MODELS.swapShip(ship,'vanguard',{ref:F.geo,glow:.15});
    SETS.pathfinder={G,cam:t=>{const s=shipZ(Math.min(t,6.5));return{p:V3(14,5,s+22-Math.min(t,6)*1.2),l:V3(0,0,s-8)};},update:(t)=>{const z=shipZ(t);ship.position.set(0,0,z);eng.position.set(0,0,z+6);
      const j=Math.max(0,t-6.5);streak.material.opacity=Math.min(1,j*2)*(j<1.5?1:Math.max(0,1-(j-1.5)));streak.scale.set(1,30+j*900,1);streak.position.set(0,0,z+(30+j*900)/2);ap.rotation.y=t*.01;}};}
  function shipZ(t){return t<6.5?-t*6:-39-Math.pow(t-6.5,3)*400;}
  // 10 · ONE MESSAGE, then nothing: the waveform over the command deck's table, breaking up
  {const G=at();G.add(new THREE.AmbientLight(0x200808,1));const red=new THREE.PointLight(lin(0xff5a3a),3,30,1.5);red.position.set(0,4,4);G.add(red);
    const bars=[];const bm=new THREE.MeshBasicMaterial({color:lin(0xff7a5a).multiplyScalar(1.6)});for(let i=0;i<48;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.08,1,.08),bm);b.position.set(-4+i*.17,2,0);G.add(b);bars.push(b);}
    const tbl=new THREE.Mesh(new THREE.CylinderGeometry(3,3.4,1,40),new THREE.MeshStandardMaterial({color:lin(0x1a1d24),metalness:.6,roughness:.4}));tbl.position.y=.5;G.add(tbl);
    SETS.silence={G,cam:t=>({p:V3(0,2.6,7.5-t*.15),l:V3(0,2,0)}),update:(t)=>{const br=Math.min(1,Math.max(0,(t-3)/2));bars.forEach((b,i)=>{b.scale.y=Math.max(.05,(Math.abs(Math.sin(i*.4+t*7)*Math.sin(i*.13-t*2))*(1-br)+Math.random()*br*.9)*1.6);});
      red.intensity=3*(1-br*.7);tagA.textContent='PATHFINDER · KEEPER SCOUT · CPT. A. RHEN';tagA.classList.add('on');tagB.textContent='SIGNAL LOST';tagB.classList.toggle('on',br>.5&&Math.sin(t*6)>0);}};}
}

/* ---------- the running order ---------- */
const ORDER=[['earth',1.2,'Before Elyra'],['arks',.8],['elyra',.8],['city',.8],['keepers',.8],['codex',.8],['king',.8],['theft',.8],['pathfinder',2.4],['silence',1.2]];
const ABORT={};
const chk=()=>{if(!R||R.dead)throw ABORT;};
const wait=s=>Promise.race([new Promise(r=>setTimeout(r,s*1000)),R.skipP]).then(chk);
function sub(who,text){if(!who){subEl.classList.remove('on');return;}subEl.querySelector('b').textContent=who==='Lt. Michael'?'Lt. Michael Hall':who==='Elias Veyr'?'Master Elias Veyr':who;subEl.querySelector('span').textContent=text;subEl.classList.add('on');}
// one line: spoken through the shared radio voices when there are any, else held for its reading time
function line(who,text){chk();sub(who,text);return Promise.race([new Promise(res=>{
  if(typeof sfx!=='undefined'&&sfx.speak){const h=sfx.speak(who,text,null);const t0=performance.now(),p=()=>{if(h.done||!R||R.dead){const left=h.est*1000-(performance.now()-t0);return left>0&&!h.started?setTimeout(res,left):res();}setTimeout(p,120);};
    setTimeout(()=>{if(!h.voiced)setTimeout(res,h.est*1000);else p();},200);}
  else setTimeout(res,(text.split(/\s+/).length/2.5+.6)*1000);}),R.skipP]).then(()=>{chk();sub(null);});}
async function card(html,cls,hold){titleEl.className='ptitle'+(cls?' '+cls:'');titleEl.innerHTML=html;await wait(.05);titleEl.classList.add('on');await wait(hold);titleEl.classList.remove('on');await wait(1.4);}
function fade(on,s){fadeEl.style.transition=`opacity ${s}s`;fadeEl.style.opacity=on?1:0;}
async function run(){
  S={shot:null,t:0};fade(true,0);
  await wait(.6);
  for(const[id,beat,small]of ORDER){
    if(small){await card(small,'sm',2.2);}
    S.shot=id;S.t=0;for(const k in SETS)SETS[k].G.visible=k===id;const F=SETS[id].fog;scene.fog=F?new THREE.FogExp2(F[0],F[1]):null;tagA.classList.remove('on');tagB.classList.remove('on');
    fade(false,1.2);await wait(1.1);
    if(id==='silence'&&typeof sfx!=='undefined'&&sfx.static)setTimeout(()=>{if(R&&!R.dead)sfx.static(1.6);},4200);
    for(const[who,text]of LINES[id]){await line(who,text);await wait(.35);}
    await wait(beat);fade(true,1);await wait(1);}
  S.shot=null;tagA.classList.remove('on');tagB.classList.remove('on');await card('ELYRA: THE HOLLOW<small>THE KEEPERS OF THE REMNANT</small>','',3.4);
}
function frame(now){if(!R){raf=0;return;}raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-(last||now))/1000);last=now;if(!S||!S.shot)return;S.t+=dt;
  const set=SETS[S.shot],c=set.cam(S.t);camera.position.copy(c.p).add(set.G.position);camera.lookAt(c.l.clone().add(set.G.position));set.update(S.t,dt);
  if(composer)composer.render();else renderer.render(scene,camera);}
function skip(){if(!R||R.dead)return;R.dead=true;R.skipRes();if(typeof sfx!=='undefined'&&sfx.hush)sfx.hush();}
const key=e=>{if(!R)return;if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();e.stopPropagation();skip();}};
async function play(done){
  if(!root)mount();try{build();}catch(e){console.error(e);}
  root.hidden=false;root.style.opacity='';R={dead:false};borrow();R.skipP=new Promise(r=>R.skipRes=r);last=0;if(!raf)raf=requestAnimationFrame(frame);addEventListener('keydown',key,true);
  try{await run();}catch(e){if(e!==ABORT)console.error(e);}
  removeEventListener('keydown',key,true);if(typeof sfx!=='undefined'&&sfx.hush)sfx.hush();sub(null);
  root.style.transition='opacity .8s';root.style.opacity='0';const r=R;R=null;S=null;
  giveBack();   // the chapter's canvas goes home now; the black overlay fades off it
  setTimeout(()=>{root.hidden=true;root.style.transition='';},850);
  if(done)done(r&&r.dead);}
return{play,LINES,get on(){return!!R;}};
})();
