/* Elyra · the prologue, in 3D. Plays before The Mountain's command deck (in the campaign and in Archive 01 on its own):
   who the Remnant are, what Elyra is, the Keepers, the Codex, the Hollow King, the theft, and the Pathfinder.
   Ten shots, each its own three.js set (built once, all at the origin, only the one on screen visible; Nov 9 rebuilt, see below), narrated by Master Elias Veyr through the
   shared radio voices (sfx.speak). Uses the game's own pieces: the ark and Keeper ship hulls (js/shared/ships.js), the Keeper
   Marine models and the Hollow King (js/origin/02-people.js, js/shared/models.js).
   PROLOGUE.play(done) · Skip button, Enter or Esc skip it. Every line is in PROLOGUE.LINES and in the script doc. */
const PROLOGUE=(()=>{
const VW=1600,VH=900,still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const st=document.createElement('style');st.textContent=`
#prol{position:fixed;inset:0;z-index:60;background:#000}#prol canvas{position:absolute;inset:0;width:100%;height:100%}
#prol .psub{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 7vh);transform:translateX(-50%);width:min(900px,88vw);text-align:center;opacity:0;transition:opacity .3s;
  font:500 17px/1.5 'VG Body','Arial Narrow',system-ui,sans-serif;letter-spacing:.03em;color:#eef0f4;text-shadow:0 1px 4px #000,0 0 2px #000}
#prol .psub.on{opacity:1}#prol .psub b{display:block;font:400 12px 'VG Title','Arial Narrow',sans-serif;letter-spacing:.18em;color:rgba(217,178,90,.9);text-transform:uppercase;margin-bottom:3px}
#prol .ptitle{position:absolute;inset:0;display:grid;place-items:center;align-content:center;text-align:center;opacity:0;transition:opacity 1.4s;pointer-events:none;padding:0 6vw;
  font:400 clamp(20px,4vw,44px)/1.3 'VG Title','Arial Narrow',sans-serif;letter-spacing:.3em;color:#e6e4df}
#prol .ptitle small{display:block;margin-top:14px;font:400 11px 'VG Label','Arial Narrow',sans-serif;letter-spacing:.3em;color:rgba(230,228,223,.5)}
#prol .ptitle.on{opacity:1}#prol .ptitle.sm{font-size:clamp(12px,1.6vw,15px);letter-spacing:.32em;color:rgba(230,228,223,.75)}
#prol .vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 50%,rgba(0,0,0,.7) 100%)}
#prol .bar{position:absolute;left:0;right:0;height:8vh;background:#000}#prol .bar.t{top:0}#prol .bar.b{bottom:0}
#prol .fade{position:absolute;inset:0;background:#000;pointer-events:none}
#prol .tag{position:absolute;left:50%;transform:translateX(-50%);font:600 clamp(11px,1.5vw,16px) 'VG Label','Arial Narrow',sans-serif;letter-spacing:.24em;color:#ff7a5a;text-shadow:0 0 12px rgba(255,90,60,.6);opacity:0;transition:opacity .4s;white-space:nowrap}
#prol .tag.on{opacity:1}
#prol .pskip{position:absolute;right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 14px);padding:8px 14px;border:1px solid rgba(230,228,223,.3);border-radius:3px;
  background:rgba(0,0,0,.5);color:rgba(230,228,223,.8);font:700 11px 'VG Display',sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer}
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
  theft:[[E,'Six nights ago he walked into the Archive, past every Keeper on watch, and walked out with the Codex.']],
  pathfinder:[[E,'We sent the Pathfinder after him. Captain Rhen and forty-one crew, the fastest ship we had. She followed his trail into the dark, to a world called Astraea.']],
  silence:[[E,'Five days later, she sent us one message.'],[E,'Then nothing.']],
};

/* ---------- stage ---------- */
let shared=null,saved=null,home=null,root,cv,subEl,titleEl,fadeEl,tagA,tagB,renderer,composer,scene,camera,R=null,S=null,raf=0,last=0,built=false;
const SETS={};
const lin=h=>new THREE.Color(h).convertSRGBToLinear();
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const rr=(a,b)=>a+Math.random()*(b-a);
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
  // Nov 9: the finishing pass shared with the menu (js/shared/grade.js): antialiased, bloom, a filmic grade, vignette and grain
  try{if(typeof GRADE!=='undefined'){const F=GRADE.composer(renderer,scene,camera,{bloom:[.8,.55,.78],grade:{gam:2.2,contrast:1.06,sat:1.04,vig:.48,grain:.032}});composer=F.on?F:null;}
    else if(THREE.EffectComposer&&THREE.UnrealBloomPass){const c=new THREE.EffectComposer(renderer);c.addPass(new THREE.RenderPass(scene,camera));c.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(512,512),.7,.5,.8));if(THREE.GammaCorrectionShader)c.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));composer={render:()=>c.render(),setSize:(w,h)=>{renderer.setSize(w,h,false);c.setSize(w,h);},composer:c};}}catch(e){composer=null;}
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
function resize(){if(!renderer||(shared&&!home))return;const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.5:1.75));if(composer)composer.setSize(w,h);else renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.fov=w<h?62:40;camera.updateProjectionMatrix();}
function tex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
let gT=null;const glowT=()=>gT||(gT=tex(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.45)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);}));
const sprite=(col,s,o)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT(),color:lin(col).multiplyScalar(o||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));m.scale.setScalar(s);return m;};
function stars(G,n,r){const p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const v=V3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(r*(.8+Math.random()*.2));p.set([v.x,v.y,v.z],i*3);const k=.5+Math.random()*.5;c.set([k,k,k*1.05],i*3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));const s=new THREE.Points(g,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,vertexColors:true,depthWrite:false}));G.add(s);return s;}
// a planet: an equirectangular texture painted in code, an atmosphere shell
function planet(G,r,paint,atm,opts){opts=opts||{};const t=tex(coarse?384:640,coarse?192:320,paint);const m=new THREE.MeshStandardMaterial({map:t,roughness:.85,metalness:0});
  if(opts.emissive){m.emissiveMap=opts.emissive;m.emissive=lin(0xff6a2a);m.emissiveIntensity=0;}
  const p=new THREE.Mesh(new THREE.SphereGeometry(r,96,64),m);G.add(p);
  const a=new THREE.Mesh(new THREE.SphereGeometry(r*1.04,64,48),new THREE.MeshBasicMaterial({color:lin(atm),transparent:true,opacity:.18,blending:THREE.AdditiveBlending,side:THREE.BackSide,depthWrite:false}));G.add(a);
  return{p,m,a};}
function noiseLand(g,w,h,sea,land,thr,seed){const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=x/w,v=y/h,th=u*Math.PI*2,ph=v*Math.PI;
    const nx=Math.cos(th)*Math.sin(ph)*3.4+seed,ny=Math.cos(ph)*3.4,nz=Math.sin(th)*Math.sin(ph)*3.4;const n=fbm(nx+nz*.7,ny+nz*.4);const k=(y*w+x)*4,L=n>thr,c=L?land(n,v):sea(n,v);img.data[k]=c[0];img.data[k+1]=c[1];img.data[k+2]=c[2];img.data[k+3]=255;}
  g.putImageData(img,0,0);}

/* ---------- the ten sets ----------
   Nov 9 2026 (Bryce: "for the longer cutscene it needs a complete overhaul of new object and structures, it does not fit, all of it
   needs a massive overhaul"): every set rebuilt so it looks like the game it opens.
   - the planets are drawn in their own shaders (js/shared/planets.js): oceans, coasts, ice, clouds, night lights, atmosphere
   - the arks are Bryce's Keeper freighter, and six of them die on screen with the burning Earth behind them
   - Tide City is the real city (js/shared/tide-kit.js, the menu's and the level's) round the real Spear (js/shared/spear.js), at dusk
   - the Keepers stand in a hangar bay on the city's edge with the city and the Spear behind them through its open mouth
   - the Archive's vault is stone and gold under a lit oculus, the photo textures in place of the drawn bricks
   - the Hollow King stands on a black rock above his Host in the old mountains, Hollow spires round him, his mountain behind
     with the violet light going up from it, lightning in the cloud
   - Astraea is a real red world under the gold nebula, and the Pathfinder jumps with a flash and a shock ring
   - the last message plays over the command deck's own holotable
   All sets sit at the origin; only the one being filmed (and any world it shares, SETS[id].extra) is visible. */
const TX={};
function tx(n,rep,ry,srgb){const k=n+'|'+rep+'|'+ry;if(TX[k])return TX[k];const t=new THREE.TextureLoader().load('img/tex/'+n+'-'+(coarse?'phone':'pc')+'.jpg');
  t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep,ry||rep);t.anisotropy=8;if(srgb!==false&&!/-n$/.test(n))t.encoding=THREE.sRGBEncoding;return TX[k]=t;}
let NOISE2=null;
function n2(x,y){const h=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s);};const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fb2(x,y,o){let s=0,a=.5,f=1;for(let i=0;i<(o||5);i++){s+=a*n2(x*f,y*f);f*=2.03;a*=.5;}return s;}
function rdg(x,y,o){let s=0,a=.55,f=1,w=1;for(let i=0;i<(o||6);i++){let n=1-Math.abs(n2(x*f,y*f)*2-1);n*=n;s+=n*a*w;w=Math.min(1,Math.max(0,n*1.4));a*=.5;f*=2.03;}return s;}
// a ship model, sized to len along its length (nose toward -z), swapped in when its file arrives; the group is there at once
const SHIPM={};
function shipM(name,len,o){o=o||{};const g=new THREE.Group();
  if(typeof MODELS!=='undefined')MODELS.load(name).then(src=>{const G=src.geometry;if(!G.boundingBox)G.computeBoundingBox();const b=G.boundingBox,k=len/(b.max.z-b.min.z),c=b.getCenter(V3());
    const key=name+'|'+(o.tint||'')+'|'+(o.lift||0)+'|'+(o.metal==null?'':o.metal);let m=SHIPM[key];
    if(!m){m=src.material.clone();m.side=THREE.DoubleSide;m.transparent=false;m.depthWrite=true;if(o.tint)m.color=new THREE.Color(o.tint);
      if(o.lift){m.emissive=new THREE.Color(1,1,1);m.emissiveMap=m.map;m.emissiveIntensity=o.lift;}
      if(o.metal!=null){m.metalness=o.metal;m.metalnessMap=null;}if(o.rough!=null){m.roughness=o.rough;m.roughnessMap=null;}m.needsUpdate=true;SHIPM[key]=m;}
    const mesh=new THREE.Mesh(G,o.fresh?m.clone():m);mesh.scale.setScalar(k);mesh.position.copy(c).multiplyScalar(-k);mesh.castShadow=mesh.receiveShadow=!!o.shadow;g.add(mesh);g.userData.mesh=mesh;
    if(o.cb)o.cb(mesh);}).catch(()=>{});
  return g;}
// an expanding ring of light (a ship dying, a jump)
function shock(G,col){const m=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    uniforms:{c:{value:lin(col).multiplyScalar(2)},o:{value:0}},vertexShader:'varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 c;uniform float o;varying vec2 vU;void main(){float d=length(vU);float e=exp(-pow((d-.86)/.05,2.))+.25*exp(-pow((d-.7)/.18,2.));gl_FragColor=vec4(c*o*e*(1.-smoothstep(.97,1.,d)),1.);}'}));G.add(m);m.visible=false;return m;}
// sparks and debris flung out from a point
function burst(G,n,col,sz){const p=new Float32Array(n*3),v=[];for(let i=0;i<n;i++){const d=V3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(.3+Math.random());v.push(d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  const o=new THREE.Points(g,new THREE.PointsMaterial({map:glowT(),color:lin(col).multiplyScalar(2),size:sz||3,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));o.frustumCulled=false;o.visible=false;G.add(o);
  return{o,set(at,k,spd){o.visible=k>0&&k<1;const P=g.attributes.position;for(let i=0;i<n;i++)P.setXYZ(i,at.x+v[i].x*k*spd,at.y+v[i].y*k*spd,at.z+v[i].z*k*spd);P.needsUpdate=true;o.material.opacity=Math.max(0,1-k);}};}
// the sun seen from space: a hot core, a wide soft halo, a faint horizontal streak
function sunFlare(G,dir,dist,col){const at=dir.clone().normalize().multiplyScalar(dist);
  const a=sprite(col||0xfff0d8,dist*.035,2.4);a.position.copy(at);const b=sprite(col||0xffe0b0,dist*.12,.4);b.position.copy(at);b.material.opacity=.35;
  const c=sprite(0xbfd8ff,1,.25);c.scale.set(dist*.4,dist*.006,1);c.position.copy(at);for(const s of[a,b,c]){s.material.fog=false;G.add(s);}return{a,b,c};}
// a sky for a planet's surface at dusk: deep blue overhead, the sun's colour along the horizon toward it, violet away from it, a sun
// disc with its glow, and long thin cloud lit from below
function duskSky(G,R,sunD,o){o=o||{};const U={sun:{value:sunD.clone().normalize()},top:{value:lin(o.top||0x081530)},mid:{value:lin(o.mid||0x3a3c6e)},hor:{value:lin(o.hor||0xff8a4a)},
    away:{value:lin(o.away||0x6a4a7a)},sunC:{value:lin(o.sunC||0xffd9a0)}};
  const m=new THREE.Mesh(new THREE.SphereGeometry(R,64,32),new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform vec3 sun,top,mid,hor,away,sunC;varying vec3 vD;
      float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float fb(vec3 p){return .5*n3(p)+.25*n3(p*2.03)+.125*n3(p*4.1)+.0625*n3(p*8.3);}
      void main(){vec3 d=normalize(vD);vec3 L=normalize(sun);float h=d.y;float s=max(dot(d,L),0.);
        float az=dot(normalize(d.xz+1e-4),normalize(L.xz+1e-4))*.5+.5;
        vec3 horC=mix(away,hor,pow(az,2.2));
        vec3 c=mix(horC,mid,smoothstep(.0,.18,h));c=mix(c,top,smoothstep(.12,.6,h));
        c=h<0.?mix(horC*.5,vec3(.02,.02,.04),smoothstep(0.,.2,-h)):c;
        c+=sunC*(pow(s,6.)*.35+pow(s,64.)*.8)+vec3(1.,.95,.85)*smoothstep(.9994,.9997,s)*8.;
        float band=smoothstep(.02,.1,h)*(1.-smoothstep(.18,.4,h));vec3 q=vec3(d.x*1.2,d.y*14.,d.z*1.2)*3.;float cl=smoothstep(.45,.75,fb(q+vec3(4.,0.,1.)));
        c=mix(c,mix(vec3(.18,.12,.2),hor*1.4,pow(az,3.)*.8+.1),cl*band*.85);
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`}));m.renderOrder=-5;G.add(m);return{m,U};}
// a sea at dusk: small waves, the sky's colour at a glance, the sun's path toward the camera, the city's light where it stands
function duskSea(G,size,sunD,o){o=o||{};const U=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{deep:{value:lin(o.deep||0x050a16)},skyc:{value:lin(o.sky||0x6a5a88)},sun:{value:sunD.clone().normalize()},sunC:{value:lin(o.sunC||0xffb070)},t:{value:0}}]);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size).rotateX(-Math.PI/2),new THREE.ShaderMaterial({uniforms:U,fog:true,
    vertexShader:'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader:`uniform vec3 deep,skyc,sun,sunC;uniform float t;varying vec3 vW;
      #include <common>
      #include <fog_pars_fragment>
      void main(){vec3 V=normalize(cameraPosition-vW);vec2 p=vW.xz;float dd=length(cameraPosition-vW);
        float nx=sin(p.x*.021+t*.6)*.05+sin(p.y*.031-t*.4+p.x*.01)*.05+sin(p.x*.11+p.y*.07+t*1.3)*.03+sin(p.x*.41-p.y*.23+t*2.1)*.02*exp(-dd*.0006);
        float nz=cos(p.y*.023+t*.5)*.05+sin(p.x*.017+p.y*.013-t*.7)*.05+cos(p.y*.13-p.x*.05+t*1.1)*.03+cos(p.y*.37+p.x*.29-t*1.9)*.02*exp(-dd*.0006);
        vec3 N=normalize(vec3(nx,1.,nz));float fr=pow(1.-max(dot(N,V),0.),4.);vec3 R=reflect(-V,N);float s=max(dot(R,normalize(sun)),0.);
        vec3 c=mix(deep,skyc,.08+.75*fr)+sunC*(pow(s,300.)*6.+pow(s,24.)*.25);
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
        #include <fog_fragment>
      }`}));G.add(m);return{m,U};}
// a rock from noise on its own surface (no torn faces), the rock photo laid on it
function rockGeo(r,seed,flat){const g=new THREE.IcosahedronGeometry(r,3),P=g.attributes.position,v=V3();
  for(let k=0;k<P.count;k++){v.fromBufferAttribute(P,k);const n=v.clone().normalize(),d=.7+.6*fb2(n.x*1.6+seed+n.z*.7,n.y*1.6-seed+n.z*1.1,4);v.multiplyScalar(d);v.y*=flat||1;P.setXYZ(k,v.x,v.y,v.z);}
  g.computeVertexNormals();const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,P.getX(k)/r*1.2+P.getZ(k)/r*.5,P.getY(k)/r*1.2);return g;}
// one world for the two shots on Elyra's surface (Tide City at dusk, and the hangar bay on its edge)
let CW=null;
function build(){if(built)return;built=true;
  const at=(far,near)=>{const G=new THREE.Group();G.visible=false;scene.add(G);G.userData.far=far||20000;G.userData.near=near||.1;return G;};
  /* 1 · EARTH, breaking: the old world lit from the side, its moon beyond it; the faults open across it, the land round them burns,
     and fire throws sparks off into space */
  {const G=at(30000,1),sunD=V3(-1,.28,.5).normalize();SKIES.dome(G,20000,'earth',{full:true,exp:.32});stars(G,3500,14000);
    const E=PLANETS.make('earth',100,{sun:sunD,spin:.028});E.group.rotation.z=.4;G.add(E.group);
    const MO=PLANETS.make('moon',26,{sun:sunD,spin:.006});MO.group.position.set(-260,80,-460);G.add(MO.group);
    sunFlare(G,sunD,9000);
    const sparks=[0,1,2,3].map(()=>burst(G,160,0xff7a30,2.2)),spots=[V3(.6,.5,.62),V3(-.2,.7,.68),V3(.35,-.1,.93),V3(.8,.1,.55)].map(v=>v.normalize().multiplyScalar(101));
    SETS.earth={G,cam:t=>{const a=.35+t*.022,r=330-t*3;return{p:V3(Math.sin(a)*r,40-t*1.6,Math.cos(a)*r),l:V3(-40+t*1.5,-6,0)};},
      update:(t)=>{E.update(t);MO.update(t);const k=Math.min(1,Math.max(0,(t-.8)/9));E.U.crack.value=k*k*(3-2*k);E.U.burn.value=Math.min(.75,Math.max(0,(t-3)/10));
        sparks.forEach((b,i)=>{const T=((t+i*1.7)%5)/5;const w=spots[i].clone().applyAxisAngle(V3(0,1,0),t*.028).applyEuler(E.group.rotation);b.set(w,t>2?T:0,60);});}};}
  /* 2 · THE ARKS: nine Keeper freighters climbing away from the burning world in three columns; six fail, one after another (their
     engines gutter, they fall out of line, and they go in a flash and a ring of light); three go on */
  {const G=at(40000,1),sunD=V3(-.6,.4,-.7).normalize();SKIES.dome(G,30000,'earth',{full:true,exp:.28});stars(G,3000,20000);
    G.add(new THREE.AmbientLight(0x2a3046,.6));const sun=new THREE.DirectionalLight(0xfff0dc,2.2);sun.position.copy(sunD).multiplyScalar(100);G.add(sun);
    const fire=new THREE.DirectionalLight(0xff7a3a,1.2);fire.position.set(0,-60,80);G.add(fire);
    const E=PLANETS.make('earth',1500,{sun:V3(-.3,.2,-1),spin:.004});E.U.crack.value=1;E.U.burn.value=.8;E.group.position.set(-2000,-1700,7400);G.add(E.group);
    sunFlare(G,sunD,24000);
    const SPD=22,arks=[],LOST=[0,2,3,5,6,8],DIE=[3.2,4.6,5.4,6.6,7.6,8.6];
    for(let i=0;i<9;i++){const col=i%3,row=(i/3)|0;const g=shipM('ship_keeper_freighter',64,{metal:.35,rough:.5,lift:.06,fresh:true});
      const base=V3((col-1)*95+(row%2)*20,(row-1)*48+(col===1?14:0),row*120+(Math.random()-.5)*30);g.position.copy(base);G.add(g);
      const eng=[];for(const s of[-1,1]){const e=sprite(0x6fc8ff,7,2);e.position.set(s*8,0,33);g.add(e);eng.push(e);}
      const li=LOST.indexOf(i),fl=sprite(0xffe0b0,1,3);fl.material.opacity=0;G.add(fl);
      arks.push({g,eng,base,die:li<0?null:DIE[li],fl,ring:li<0?null:shock(G,0xffb070),deb:li<0?null:burst(G,120,0xffa050,4),spin:(Math.random()-.5)*.6});}
    const zOf=t=>-t*SPD;
    SETS.arks={G,cam:t=>{const z=zOf(t);return{p:V3(120-t*3,38+t*1.2,z-110+t*3),l:V3(-20,-6,z+120)};},update:(t)=>{E.update(t);const z=zOf(t);
      for(const a of arks){let k=0;if(a.die!=null)k=Math.min(1.6,Math.max(0,(t-a.die+1.6)/1.6));   // 0..1 failing, 1..1.6 gone
        const f=Math.min(1,k);a.g.position.set(a.base.x+f*f*a.base.x*.25,a.base.y-f*f*40,a.base.z+z+f*f*80);a.g.rotation.set(f*.25,0,f*a.spin);
        a.eng.forEach((e,i)=>{e.material.opacity=f>0?Math.max(0,(1-f)*(Math.random()<.3?.2:1)):1;});
        a.g.visible=k<1.02;
        if(a.ring){const b=k-1;a.fl.position.copy(a.g.position);a.fl.scale.setScalar(Math.max(0,1-Math.abs(b-.05)/.25)*520);a.fl.material.opacity=b>-.1&&b<.4?1:0;
          a.ring.visible=b>0&&b<.6;a.ring.position.copy(a.g.position);a.ring.lookAt(camera.position);a.ring.scale.setScalar(10+b*150);a.ring.material.uniforms.o.value=Math.max(0,1-b/.6)*.45;
          a.deb.set(a.g.position.clone().setZ(a.base.z+z+80),b>0?b/.6:0,260);}}}};}
  /* 3 · ELYRA: an ocean world under its own sky, white cloud over almost all of it, a moon, and a gold light on one shore */
  {const G=at(30000,1),sunD=V3(-1,.3,.55).normalize();SKIES.dome(G,20000,'elyra',{full:true,exp:.32});stars(G,2500,14000);
    const P=PLANETS.make('elyra',100,{sun:sunD,spin:.014,spot:V3(-.5,.24,.83)});G.add(P.group);
    const MO=PLANETS.make('moon',14,{sun:sunD,spin:.004});MO.group.position.set(210,70,-260);G.add(MO.group);
    sunFlare(G,sunD,9000,0xfff4e6);
    SETS.elyra={G,cam:t=>({p:V3(-70+t*2.4,34-t*.6,330-t*7),l:V3(-26+t*.8,8,0)}),update:(t)=>{P.update(t);MO.update(t);}};}
  /* 4 · TIDE CITY at dusk: the real city (js/shared/tide-kit.js) round the real Spear (js/shared/spear.js) on its platforms over the
     sea, the sun going down behind the far headlands, the Keepers' ships coming home */
  {CW=new THREE.Group();CW.visible=false;scene.add(CW);const G=CW;const SPc=V3(0,0,0),sunD=V3(-.82,.07,-.56).normalize();
    const sky=duskSky(G,60000,sunD);
    G.add(new THREE.HemisphereLight(0x7a80b8,0x1a1418,.32));const sun=new THREE.DirectionalLight(0xffa060,1.7);sun.position.copy(sunD).multiplyScalar(5000);G.add(sun);
    const sea=duskSea(G,160000,sunD,{deep:0x04070e,sky:0x2e2a44});
    // the far shore: headlands round the bay, dark against the sky
    {const seg=240,rows=6,p=[],ix=[];for(let j=0;j<=rows;j++)for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,r=15000+j*900,v=j/rows,
        ht=Math.pow(fb2(Math.cos(a)*5+11,Math.sin(a)*5-4,5),2.2)*3400*Math.sin(v*Math.PI)*(.55+.45*fb2(a*9,j));p.push(Math.cos(a)*r,ht-180,Math.sin(a)*r);}
      for(let j=0;j<rows;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+seg+1;ix.push(a,b,a+1,b,b+1,a+1);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();
      G.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:lin(0x1c1826),roughness:1,flatShading:true})));}
    // the sky baked for reflections (the Spear's gold, the towers' glass)
    let ENV=null;try{const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene(),sm=sky.m.material.clone();es.add(new THREE.Mesh(new THREE.SphereGeometry(100,48,24),sm));ENV=pm.fromScene(es,0,.1,1000).texture;pm.dispose();}catch(e){ENV=null;}
    const CITY=typeof TIDE_KIT!=='undefined'?TIDE_KIT.build(G,{SP:SPc,low:coarse,phone:coarse,env:null,night:0x5c6474,srgb:true,glow:3,far:[600,3000]}):null;
    const spear=typeof SPEAR_KIT!=='undefined'?SPEAR_KIT.build({C:lin}):null;if(spear){G.add(spear.group);if(ENV&&spear.setEnv)spear.setEnv(ENV,.9);}
    const tip=sprite(0xffd890,220,1.6);tip.position.set(0,1530,0);G.add(tip);
    // the Keepers' ships: interceptors in threes, a dropship coming in, a cruiser high up
    const flights=[0,1,2].map(i=>{const grp=[0,1,2].map(()=>{const g=shipM('raven',24,{lift:.15});const e=sprite(0x9fe8ff,14,2);e.position.z=12;g.add(e);G.add(g);return g;});return{grp,ph:i*5.3,y:300+i*180,r:2400+i*500};});
    const drop=shipM('dropship',70,{lift:.12});G.add(drop);const cru=shipM('vanguard',520,{lift:.1});G.add(cru);
    const tmp=V3();
    const tick=t=>{sea.U.t.value=t;if(CITY)CITY.tick(t);if(spear)spear.tick(t,1);tip.material.opacity=.75+.2*Math.sin(t*1.4);
      for(const F of flights){const a=t*.12+F.ph;F.grp.forEach((g,k)=>{const aa=a-k*.012,r=F.r+(k-1)*40;g.position.set(Math.cos(aa)*r,F.y+k*8,Math.sin(aa)*r);g.lookAt(tmp.set(Math.cos(aa-.05)*r,F.y+k*8,Math.sin(aa-.05)*r));g.rotateY(Math.PI);g.rotateZ(-.35);});}
      {const u=(t%40)/40;drop.position.set(-1800+u*1500,900-u*600,2600-u*1500);drop.lookAt(tmp.set(-1800+(u+.01)*1500,900-(u+.01)*600,2600-(u+.01)*1500));drop.rotateY(Math.PI);}
      cru.position.set(-6000+t*30,2600,-4000);cru.rotation.y=-Math.PI/2;};
    CW.userData.tick=tick;
    SETS.city={G,fog:[0x6a5470,.000045],far:90000,near:1,cam:t=>({p:V3(-2500+t*40,300+t*12,2700-t*52),l:V3(-120+t*6,620,0)}),update:t=>tick(t)};}
  /* 5 · THE KEEPERS: a hangar bay on a platform on the city's edge, its mouth open to the Spear across the water at dusk. A dropship on
     the deck, crates and racks, the Keeper seal on the back wall, light strips overhead; the Marines in a line, Michael at the front
     in his flight suit. Interceptors cross the mouth on patrol. */
  {const G=at(90000,.2),HB=V3(140,70,3300),W=42,HH=11.5,D=40;
    const deckM=new THREE.MeshStandardMaterial({color:lin(0x8a929e),map:tx('metal015',10,7),normalMap:tx('metal015-n',10,7),roughness:.55,metalness:.55});
    const wallM=new THREE.MeshStandardMaterial({color:lin(0x6a727e),map:tx('metal039',6,3),normalMap:tx('metal039-n',6,3),roughness:.6,metalness:.5});
    const frameM=new THREE.MeshStandardMaterial({color:lin(0x2a3038),roughness:.4,metalness:.75});
    const stripM=new THREE.MeshBasicMaterial({color:lin(0xdff4ff).multiplyScalar(2.2)}),blueM=new THREE.MeshBasicMaterial({color:lin(0x5ad2ff).multiplyScalar(2)}),amberM=new THREE.MeshBasicMaterial({color:lin(0xffb048).multiplyScalar(1.8)});
    const gold=new THREE.MeshStandardMaterial({color:lin(0xd9b25a),emissive:lin(0x4a3008),metalness:.9,roughness:.25});
    const bx=(w,h,d,x,y,z,m,sh)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(HB.x+x,HB.y+y,HB.z+z);if(sh!==false){b.castShadow=b.receiveShadow=true;}G.add(b);return b;};
    // the deck, the platform under it, its legs into the sea
    bx(W,1.2,D,0,-.6,0,deckM);
    const pl=new THREE.Mesh(new THREE.CylinderGeometry(52,40,HB.y,24),new THREE.MeshStandardMaterial({color:lin(0x3a4250),roughness:.8,metalness:.3}));pl.position.set(HB.x,HB.y/2-1.2,HB.z+4);G.add(pl);
    // hazard band at the mouth (yellow and black), its lip, and the lights set in it
    const hz=tex(256,16,(g,w,h)=>{g.fillStyle='#111';g.fillRect(0,0,w,h);g.fillStyle='#d9a521';for(let x=-16;x<w;x+=32){g.beginPath();g.moveTo(x,h);g.lineTo(x+16,0);g.lineTo(x+32,0);g.lineTo(x+16,h);g.fill();}});hz.wrapS=THREE.RepeatWrapping;hz.repeat.set(10,1);
    bx(W,.08,1.6,0,.04,-D/2+1,new THREE.MeshStandardMaterial({map:hz,roughness:.6}),false);bx(W,.5,.6,0,.2,-D/2+.2,frameM);
    for(let i=0;i<16;i++)bx(.6,.12,.3,-W/2+2+i*(W-4)/15,.5,-D/2+.3,blueM,false);
    // the walls and the roof, ribbed, and the back wall with the seal
    bx(1.2,HH,D,-W/2,HH/2,0,wallM);bx(1.2,HH,D,W/2,HH/2,0,wallM);bx(W,1.4,D,0,HH+.7,0,wallM);bx(W,HH,1.2,0,HH/2,D/2,wallM);
    for(let z=-D/2+1;z<=D/2-1;z+=5){bx(1.4,HH,1.2,-W/2+1.2,HH/2,z,frameM);bx(1.4,HH,1.2,W/2-1.2,HH/2,z,frameM);bx(W-2,1,1.2,0,HH-.6,z,frameM);bx(W-6,.12,.3,0,HH-1.15,z,stripM,false);}
    bx(W,1.8,2.2,0,HH-.9,-D/2+.6,frameM);bx(W-2,.1,.3,0,HH-1.85,-D/2+.4,blueM,false);   // the header over the mouth
    for(const s of[-1,1])for(let k=0;k<6;k++)bx(.2,HH-4,.2,s*(W/2-1.9),HH/2-.5,-D/2+3+k*6.5,amberM,false);
    for(const r of[5.2,3.6]){const t=new THREE.Mesh(new THREE.TorusGeometry(r*.7,.13,10,96),gold);t.position.set(HB.x,HB.y+6.5,HB.z+D/2-.7);G.add(t);}
    for(const a of[0,Math.PI/2,Math.PI/4,-Math.PI/4]){const b=new THREE.Mesh(new THREE.BoxGeometry(7.4,.1,.1),gold);b.position.set(HB.x,HB.y+6.5,HB.z+D/2-.7);b.rotation.z=a;G.add(b);}
    const bannerM=new THREE.MeshStandardMaterial({color:lin(0x1f4c86),roughness:.9,side:THREE.DoubleSide});
    for(const x of[-9,9,-15,15]){const b=new THREE.Mesh(new THREE.PlaneGeometry(2.2,6.5),bannerM);b.position.set(HB.x+x,HB.y+6.3,HB.z+D/2-.65);b.rotation.y=Math.PI;G.add(b);
      const tr=new THREE.Mesh(new THREE.PlaneGeometry(2.24,.2),gold);tr.position.set(HB.x+x,HB.y+9.6,HB.z+D/2-.7);tr.rotation.y=Math.PI;G.add(tr);}
    // a dropship on the deck with a gantry beside it, crates and gun racks on the other side
    const ds=shipM('dropship',17,{lift:.12,shadow:true});ds.position.set(HB.x-12,HB.y+2.4,HB.z+8);ds.rotation.y=.5;G.add(ds);
    bx(.8,7,.8,-19,3.5,0,frameM);bx(6,.3,1.6,-17,6.8,0,frameM);
    const crateM=new THREE.MeshStandardMaterial({color:lin(0x46505a),map:tx('metal020',1),roughness:.7,metalness:.4});
    for(let i=0;i<7;i++){const s=1.4+(i%3)*.4;bx(s,s,s,13+(i%3)*2.2,s/2+(i>4?1.6:0),6+((i/3)|0)*2.4,crateM);}
    if(typeof MODELS!=='undefined'&&MODELS.copy)MODELS.copy('weapon-rack').then(({scene:s})=>{if(MODELS.tame)MODELS.tame(s,.5);const {o}=MODELS.fit(s,{size:3,axis:'x',floor:true});o.position.set(HB.x+18,HB.y,HB.z+14);o.rotation.y=-Math.PI/2;G.add(o);}).catch(()=>{});
    // light: cold overhead key with shadows, a warm fill off the deck, the dusk outside does the rest
    const key=new THREE.SpotLight(0xe6f0ff,4,70,.8,.6,1.2);key.position.set(HB.x+3,HB.y+HH-1.5,HB.z+6);key.target.position.set(HB.x,HB.y,HB.z-2);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;G.add(key,key.target);
    const fill=new THREE.PointLight(0xffb070,1.2,40,1.6);fill.position.set(HB.x,HB.y+3,HB.z-6);G.add(fill);
    const bounce=new THREE.HemisphereLight(0x9ab0d8,0x2a2420,.35);G.add(bounce);
    // the Marines in a line; Michael at the front, a pilot in his flight suit, no rifle
    const people=[];for(let i=-4;i<=4;i++){const H=makeHuman('marine');H.root.position.set(HB.x+i*1.7,HB.y,HB.z-1+(i?-1.2-Math.abs(i)*.18:0));H.root.rotation.y=Math.PI;G.add(H.root);
      H.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});MODELS.dress(H,i?'keeper-footsoldier':'michael-hall',i?{}:{unarmed:true});people.push(H);}
    const pass=[0,1,2].map(i=>{const g=shipM('raven',22,{lift:.15});const e=sprite(0x9fe8ff,12,2);e.position.z=11;g.add(e);G.add(g);return g;});
    SETS.keepers={G,extra:[CW],fog:[0x6a5470,.000045],far:90000,near:.2,
      cam:t=>({p:V3(HB.x-6.5+t*.6,HB.y+1.7+t*.03,HB.z+7.6-t*.2),l:V3(HB.x+t*.2-1.6,HB.y+2.6,HB.z-6)}),
      update:(t,dt)=>{CW.userData.tick(t);for(const H of people)poseHuman(H,dt||.016,0,0);
        pass.forEach((g,i)=>{const u=((t*.06+i*.05)%1);g.position.set(HB.x-900+u*1800,HB.y+40+i*6,HB.z-260-i*30);g.rotation.y=-Math.PI/2;});}};}
  /* 6 · THE CODEX in the Archive: a round chamber of laid stone under a gold-ribbed dome, light falling through an oculus onto the
     Codex as it turns over its plinth, the Archive's record cells lit in the walls. One side is glass onto the deep sea the Archive
     is built into; once in the shot something very large passes behind it (the Drowned Watcher, never a clear look). */
  const vault=(G,o)=>{const R=16,H=20,gold=new THREE.MeshStandardMaterial({color:lin(0xd9b25a),emissive:lin(0x3a2808),metalness:.9,roughness:.26});
    const floorM=new THREE.MeshStandardMaterial({color:lin(o.purple?0x2a2230:0x2a241c),map:tx('pebbles',5),normalMap:tx('pebbles-n',5),roughness:o.purple?.5:.22,metalness:.35});floorM.normalScale.set(.4,.4);
    const fl=new THREE.Mesh(new THREE.CircleGeometry(R,96),floorM);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;G.add(fl);
    for(const r of[3.4,6.5,10.5]){const t=new THREE.Mesh(new THREE.RingGeometry(r,r+.14,128),gold);t.rotation.x=-Math.PI/2;t.position.y=.01;G.add(t);}
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2,sp=new THREE.Mesh(new THREE.PlaneGeometry(.06,i%2?3.6:7),gold);sp.rotation.set(-Math.PI/2,0,-a);sp.position.set(Math.sin(a)*(i%2?8.7:7),.012,Math.cos(a)*(i%2?8.7:7));G.add(sp);}
    const gap=o.glass||o.door;
    const stoneM=new THREE.MeshStandardMaterial({color:lin(o.purple?0x8a8098:0xc4b49a),map:tx('rock',9,3),normalMap:tx('rock-n',9,3),roughness:.85});
    const wall=new THREE.Mesh(new THREE.CylinderGeometry(R,R,H,128,1,true,gap[0]+gap[1],Math.PI*2-gap[1]),stoneM);wall.material.side=THREE.BackSide;wall.position.y=H/2;wall.receiveShadow=true;G.add(wall);
    // courses of the stone: thin dark joints every metre and a half, a gold band at the dome's spring
    for(let y=1.5;y<H;y+=1.5){const j=new THREE.Mesh(new THREE.CylinderGeometry(R-.02,R-.02,.05,128,1,true,gap[0]+gap[1],Math.PI*2-gap[1]),new THREE.MeshBasicMaterial({color:0x0a0806,side:THREE.BackSide}));j.position.y=y;G.add(j);}
    {const b=new THREE.Mesh(new THREE.TorusGeometry(R-.1,.22,8,128),gold);b.rotation.x=Math.PI/2;b.position.y=H;G.add(b);}
    const dome=new THREE.Mesh(new THREE.SphereGeometry(R,96,32,0,Math.PI*2,0,Math.PI/2*.92),new THREE.MeshStandardMaterial({color:lin(0x3a3228),map:stoneM.map,roughness:.75,side:THREE.BackSide}));dome.position.y=H;G.add(dome);
    for(let i=0;i<16;i++){const rib=new THREE.Mesh(new THREE.TorusGeometry(R*.99,.14,6,32,Math.PI/2*.9),gold);rib.rotation.set(0,i/16*Math.PI*2,Math.PI/2);rib.position.y=H;G.add(rib);}
    // the oculus at the crown: a ring of gold, and the light it lets in
    const oc=new THREE.Mesh(new THREE.TorusGeometry(R*Math.cos(Math.PI/2*.92),.3,8,64),gold);oc.rotation.x=Math.PI/2;oc.position.y=H+R*Math.sin(Math.PI/2*.92);G.add(oc);
    const cone=new THREE.Mesh(new THREE.CylinderGeometry(2.2,4.6,H+R*.9,48,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
      uniforms:{c:{value:lin(o.purple?0x7a4ab0:0xffe2a8)},k:{value:o.purple?.05:.11}},vertexShader:'varying vec2 vU;varying vec3 vN;varying vec3 vV;void main(){vU=uv;vN=normalize(normalMatrix*normal);vec4 m=modelViewMatrix*vec4(position,1.);vV=normalize(-m.xyz);gl_Position=projectionMatrix*m;}',
      fragmentShader:'uniform vec3 c;uniform float k;varying vec2 vU;varying vec3 vN;varying vec3 vV;void main(){float e=pow(abs(dot(vN,vV)),1.6);gl_FragColor=vec4(c*k*e*smoothstep(0.,.35,vU.y)*(.6+.4*vU.y),1.);}'}));
    cone.position.y=(H+R*.9)/2;G.add(cone);
    const pm=new THREE.MeshStandardMaterial({color:lin(0x4a4034),map:stoneM.map,roughness:.6,metalness:.2});
    const inGap=a=>{let d=((a-gap[0])%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return d<gap[1]+.08;};
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2+.1;if(inGap(a))continue;
      const c=new THREE.Mesh(new THREE.CylinderGeometry(.62,.72,H,16),pm);c.position.set(Math.sin(a)*(R-.9),H/2,Math.cos(a)*(R-.9));c.castShadow=true;G.add(c);
      for(const y of[.25,H-.5]){const cap=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,.5,16),gold);cap.position.set(Math.sin(a)*(R-.9),y,Math.cos(a)*(R-.9));G.add(cap);}
      const strip=new THREE.Mesh(new THREE.BoxGeometry(.06,H*.8,.06),new THREE.MeshBasicMaterial({color:lin(o.purple?0x8a4ad0:0xffd890).multiplyScalar(1.4)}));strip.position.set(Math.sin(a)*(R-1.6),H*.45,Math.cos(a)*(R-1.6));G.add(strip);}
    // the record cells between the pillars: deep niches with glowing faces in rows, a gold frame round each bay
    const cellT=tex(256,512,(g,w,h)=>{g.fillStyle='#070605';g.fillRect(0,0,w,h);for(let y=0;y<32;y++)for(let x=0;x<16;x++){const on=Math.random();
        g.fillStyle=on<.45?`rgba(255,${190+Math.random()*30|0},120,${.55+Math.random()*.4})`:on<.55?'rgba(140,210,255,.7)':'rgba(30,24,18,1)';g.fillRect(x*16+3,y*16+4,10,8);}});
    const cellM=new THREE.MeshStandardMaterial({color:lin(0x241e16),map:cellT,emissive:0xffffff,emissiveMap:cellT,emissiveIntensity:o.purple?.22:.75,roughness:.4});
    for(let i=0;i<16;i++){const a=(i+.5)/16*Math.PI*2+.1;if(inGap(a))continue;
      const sh=new THREE.Mesh(new THREE.PlaneGeometry(4.4,11),cellM);sh.position.set(Math.sin(a)*(R-.12),7,Math.cos(a)*(R-.12));sh.rotation.y=a+Math.PI;G.add(sh);
      const fr=new THREE.Mesh(new THREE.TorusGeometry(1,.05,4,4),gold);fr.scale.set(3.3,7.9,1);fr.rotation.set(0,a+Math.PI,Math.PI/4);fr.position.set(Math.sin(a)*(R-.15),7,Math.cos(a)*(R-.15));G.add(fr);}
    const pl=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.4,1.6,48),new THREE.MeshStandardMaterial({color:lin(0x2a241a),map:stoneM.map,roughness:.35,metalness:.6}));pl.position.y=.8;pl.castShadow=pl.receiveShadow=true;G.add(pl);
    for(const [r,y] of[[1.85,1.6],[2.38,.05]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,.08,8,64),gold);t.rotation.x=Math.PI/2;t.position.y=y;G.add(t);}
    let sea=null;
    if(o.glass){const [g0,gl]=o.glass;
      const gm=new THREE.Mesh(new THREE.CylinderGeometry(R,R,H,64,1,true,g0,gl),new THREE.MeshStandardMaterial({color:lin(0x2a6a8a),roughness:.05,metalness:.6,transparent:true,opacity:.14,side:THREE.BackSide,depthWrite:false}));gm.position.y=H/2;G.add(gm);
      for(let k=0;k<=6;k++){const a=g0+gl*k/6,m=new THREE.Mesh(new THREE.BoxGeometry(.32,H,.32),gold);m.position.set(Math.sin(a)*R,H/2,Math.cos(a)*R);G.add(m);}
      for(const y of[H*.33,H*.66]){const m=new THREE.Mesh(new THREE.CylinderGeometry(R+.05,R+.05,.2,64,1,true,g0,gl),gold);m.position.y=y;G.add(m);}
      const wat=new THREE.Mesh(new THREE.CylinderGeometry(70,70,140,48,1,true,g0-.5,gl+1),new THREE.MeshBasicMaterial({side:THREE.BackSide,fog:false,map:tex(16,256,(g,w,h)=>{const r=g.createLinearGradient(0,0,0,h);r.addColorStop(0,'#3a8aa8');r.addColorStop(.25,'#0e4a62');r.addColorStop(.55,'#042030');r.addColorStop(1,'#000608');g.fillStyle=r;g.fillRect(0,0,w,h);})}));wat.position.y=30;G.add(wat);
      const wfl=new THREE.Mesh(new THREE.CircleGeometry(70,48),new THREE.MeshBasicMaterial({color:lin(0x02090c)}));wfl.rotation.x=-Math.PI/2;wfl.position.y=-12;G.add(wfl);
      const shafts=[];for(let i=0;i<6;i++){const sh=new THREE.Mesh(new THREE.PlaneGeometry(4+Math.random()*5,90),new THREE.MeshBasicMaterial({color:lin(0x7fd8ff),transparent:true,opacity:.05,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
        const a=g0+gl*(i+.5)/6;sh.position.set(Math.sin(a)*(30+i*4),30,Math.cos(a)*(30+i*4));sh.rotation.set(0,a,.25-i*.08);G.add(sh);shafts.push(sh);}
      const motes=[];for(let i=0;i<120;i++){const m=sprite(0x9fe8ff,.25,.8);const a=g0+Math.random()*gl,r=R+2+Math.random()*30;m.position.set(Math.sin(a)*r,Math.random()*30-6,Math.cos(a)*r);m.material.opacity=.35;G.add(m);motes.push(m);}
      const bl=new THREE.PointLight(lin(0x4ab8e0),1.6,40,1.6);bl.position.set(Math.sin(g0+gl/2)*(R-2),8,Math.cos(g0+gl/2)*(R-2));G.add(bl);
      sea={g0,gl,motes,shafts};}
    return{sea,gold,cone};};
  {const G=at(400,.1),GL=[2.75,2.05],VA=vault(G,{glass:GL});G.add(new THREE.AmbientLight(0x1a140c,.5));
    const sp=new THREE.SpotLight(0xffe0a0,7,60,.28,.5,1.2);sp.position.set(0,34,0);sp.target.position.set(0,1,0);sp.castShadow=true;sp.shadow.mapSize.set(1024,1024);G.add(sp,sp.target);
    G.add(new THREE.HemisphereLight(0xffe0b0,0x100c08,.3));
    const gold=new THREE.MeshStandardMaterial({color:lin(0xd9b25a),emissive:lin(0x7a5010),metalness:.95,roughness:.18});const codex=new THREE.Group();codex.position.y=3.6;G.add(codex);
    for(let i=0;i<4;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(1.2-i*.12,.05,10,96),gold);t.rotation.set(i*.8,i*.5,0);codex.add(t);}
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,1),new THREE.MeshBasicMaterial({color:lin(0xffe0a0).multiplyScalar(3)}));codex.add(core);
    codex.add(sprite(0xffd890,2.8,2.4));const cl=new THREE.PointLight(lin(0xffc860),2.5,22,1.5);codex.add(cl);
    const motes=[];for(let i=0;i<90;i++){const m=sprite(0xffe8b0,.1,1.4);const a=Math.random()*6.28,r=Math.random()*3.6;m.position.set(Math.cos(a)*r,Math.random()*16,Math.sin(a)*r);G.add(m);motes.push(m);}
    let Wt=null;if(typeof LEVIATHAN!=='undefined'){Wt=LEVIATHAN.makeLeviathan();Wt.root.scale.setScalar(.55);Wt.setEyes(.9);Wt.setLights(.6);G.add(Wt.root);}
    const PASS=[3,13];
    SETS.codex={G,cam:t=>({p:V3(Math.sin(t*.12)*7.5,3.6+Math.sin(t*.2)*.3+t*.05,Math.cos(t*.12)*7.5),l:V3(0,3.6,0)}),update:(t,dt)=>{codex.children.forEach((c,i)=>{if(c.isMesh&&c!==core){c.rotation.y+=.004*(i+1);c.rotation.x+=.003*(4-i);}});
      core.scale.setScalar(1+.08*Math.sin(t*3));motes.forEach(m=>{m.position.y=(m.position.y+.006)%16;});
      const S=VA.sea;S.motes.forEach(m=>{m.position.y+=.006;if(m.position.y>24)m.position.y=-6;});S.shafts.forEach((s,i)=>{s.material.opacity=.04+.025*Math.sin(t*.6+i);});
      if(Wt){const u=(t-PASS[0])/(PASS[1]-PASS[0]);Wt.root.visible=u>-.05&&u<1.05;const a=GL[0]-.6+(GL[1]+1.2)*Math.min(1,Math.max(0,u)),r=34;
        Wt.root.position.set(Math.sin(a)*r,4+Math.sin(t*.3)*1.5,Math.cos(a)*r);Wt.root.rotation.y=a+Math.PI/2;Wt.update(t,dt||.016);
        if(u>0&&!SETS.codex.swished){SETS.codex.swished=true;if(typeof sfx!=='undefined'&&sfx.swell)sfx.swell(8);}}}};}
  /* 7 · THE HOLLOW KING and his Empty Host, in the old mountains south of the city: he stands on a black rock with the Hollow's
     spires round it, his Host drawn up below; behind them the ranges, and his mountain with the violet light going up from it into
     the cloud; lightning in the cloud now and then */
  {const G=at(6000,.1);
    G.add(new THREE.HemisphereLight(0x5a3a7a,0x08040c,.45));const back=new THREE.DirectionalLight(0xb070ff,1.4);back.position.set(-10,24,-60);G.add(back);
    const key=new THREE.SpotLight(0x9fb0ff,2.2,80,.5,.7,1.2);key.position.set(6,10,22);key.target.position.set(0,4,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);G.add(key,key.target);
    const flash=new THREE.DirectionalLight(0xd8c8ff,0);flash.position.set(20,80,-120);G.add(flash);
    SKIES.dome(G,5000,'elyra',{base:tex(16,256,(g,w,h)=>{const r=g.createLinearGradient(0,0,0,h);r.addColorStop(0,'#05020a');r.addColorStop(.42,'#2a1238');r.addColorStop(.5,'#6a3a90');r.addColorStop(.53,'#120a18');r.addColorStop(1,'#000');g.fillStyle=r;g.fillRect(0,0,w,h);}),exp:.5});
    stars(G,2500,4600).material.fog=false;
    // the ground: rock photo on a plateau that breaks up into ridges toward the ranges
    {const g=new THREE.PlaneGeometry(1600,1600,220,220);g.rotateX(-Math.PI/2);const P=g.attributes.position,col=new Float32Array(P.count*3);
      for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i),d=Math.hypot(x,z+10),far=Math.max(0,(d-60)/500);
        const y=rdg(x*.006+3,z*.006-1,6)*230*far*far+fb2(x*.05,z*.05,3)*2.2*Math.min(1,d/20)-(d<14?0:0);P.setY(i,y);
        const k=.55+.45*fb2(x*.02+9,z*.02,3);col[i*3]=k*.9;col[i*3+1]=k*.82;col[i*3+2]=k;}
      g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
      const m=new THREE.MeshStandardMaterial({color:lin(0x4a3e58),map:tx('rock',60),normalMap:tx('rock-n',60),vertexColors:true,roughness:.95});
      const o=new THREE.Mesh(g,m);o.receiveShadow=true;G.add(o);}
    // the far ranges in layers, darker and hazier with distance
    [[1500,700,0x1e1228],[2300,1100,0x150c1e]].forEach(([r,h,c],j)=>{const seg=200,p=[],ix=[];for(let k=0;k<=1;k++)for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2;const y=k?Math.pow(rdg(Math.cos(a)*4+j*7,Math.sin(a)*4,5),1.6)*h:-50;p.push(Math.cos(a)*r,y,Math.sin(a)*r);}
      for(let i=0;i<seg;i++){const a=i,b=i+seg+1;ix.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();
      G.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:lin(c),side:THREE.DoubleSide})));});
    // his mountain behind the Host, and the light going up from it
    {const g=new THREE.ConeGeometry(260,620,9,12,true),P=g.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),k=1+.28*(fb2(x*.01+4,y*.01+z*.01,4)-.5)*2;P.setXYZ(i,x*k,y,z*k);}g.computeVertexNormals();
      const mm=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:lin(0x1a1222),roughness:1,flatShading:true}));mm.position.set(-60,250,-900);G.add(mm);
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(5,12,2600,24,1,true),new THREE.MeshBasicMaterial({color:lin(0xb070ff).multiplyScalar(1.6),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
      beam.position.set(-60,560+1300,-900);G.add(beam);const bg=sprite(0xb070ff,260,1.2);bg.material.fog=false;bg.position.set(-60,580,-900);G.add(bg);}
    // the black rock he stands on, and the Hollow's spires round it: obsidian shards with violet light in their seams
    const rockM=new THREE.MeshStandardMaterial({color:lin(0x2a2230),map:tx('rock',1),normalMap:tx('rock-n',1),roughness:.8});
    const dais=new THREE.Mesh(rockGeo(4.2,7,.55),rockM);dais.position.set(0,.6,0);dais.castShadow=dais.receiveShadow=true;G.add(dais);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.8,.6,7),rockM);top.position.set(0,2.55,0);G.add(top);
    const obs=new THREE.MeshStandardMaterial({color:lin(0x07050c),roughness:.18,metalness:.7}),vein=new THREE.MeshBasicMaterial({color:lin(0xb070ff).multiplyScalar(2)});
    const spires=[];for(let i=0;i<9;i++){const a=Math.PI*(.62+i/8*.76)+(i%2?.04:0),r=i%2?11:15,h=8+((i*37)%5)*2.6;
      const g=new THREE.Group();const s=new THREE.Mesh(new THREE.ConeGeometry(.9,h,4),obs);s.position.y=h/2;g.add(s);const v=new THREE.Mesh(new THREE.ConeGeometry(.92,h*.92,4,1,true),vein);v.scale.set(.06,1,1);v.position.y=h*.46;g.add(v);
      g.position.set(Math.sin(a)*r,0,Math.cos(a)*r-3);g.rotation.set((Math.random()-.5)*.25,a,(Math.random()-.5)*.25);s.castShadow=true;G.add(g);spires.push(v);}
    const K=makeHollowKing();K.root.position.set(0,2.85,0);K.root.rotation.y=Math.PI;dressKing(K);G.add(K.root);const kl=new THREE.PointLight(lin(0xc080ff),3,24,1.5);kl.position.set(0,8,4);G.add(kl);
    const host=[];for(let row=0;row<5;row++)for(let i=-7;i<=7;i++){if(row===0&&Math.abs(i)<2)continue;const H=makeHuman('trooper');{const side=Math.abs(i)>=5,unit=row===0&&Math.abs(i)===2?'commander':(row+i)%4===0&&side?'heavy':'footsoldier';
      MODELS.enemy(H,'host',{unit,lod:coarse||row>1?'lod':null});}H.root.position.set(i*2.4+(row%2)*1.2,0,-9-row*3.2);H.root.rotation.y=Math.PI;G.add(H.root);host.push(H);}
    // mist lying in the hollows round the rock
    for(let i=0;i<16;i++){const m=sprite(0x5a3a7a,1,.5);m.material.opacity=.22;m.scale.set(40+Math.random()*50,4+Math.random()*3,1);m.position.set((Math.random()-.5)*90,1.2+Math.random()*1.5,-Math.random()*60+8);G.add(m);}
    let bolt=0;
    SETS.king={G,fog:[0x1a0c26,.0012],far:6000,cam:t=>({p:V3(Math.sin(t*.05)*3.5,1.4+t*.1,19-t*.75),l:V3(0,5.2,0)}),update:(t,dt)=>{poseKing(K,dt,Math.min(1,t/5)*.6);for(const H of host)poseHuman(H,dt,0,1);
      spires.forEach((v,i)=>{v.material.color.copy(lin(0xb070ff)).multiplyScalar(1.6+.6*Math.sin(t*2+i));});
      bolt=Math.max(0,bolt-dt*3);if(Math.random()<dt*.35)bolt=1;flash.intensity=bolt*bolt*3.5*(Math.random()<.5?1:.4);}};}
  /* 8 · THE THEFT: the same chamber after he came. The vault door torn out of the wall and lying on the floor, purple light pouring
     through the hole, Keepers down where they stood, the plinth empty, and the Archive's own display still drawing the Codex's
     outline where it should be, in red: NOT PRESENT. */
  {const G=at(400,.1),DOOR=[3.55,.62],VA=vault(G,{door:DOOR,purple:true});G.add(new THREE.AmbientLight(0x140c1c,.7));G.add(new THREE.HemisphereLight(0x8a6ab0,0x0a0610,.3));
    const da=DOOR[0]+DOOR[1]/2,dx=Math.sin(da)*16,dz=Math.cos(da)*16;
    const pass=new THREE.Mesh(new THREE.BoxGeometry(10,12,30),new THREE.MeshStandardMaterial({color:lin(0x241830),map:tx('metal039',1),roughness:.8,side:THREE.BackSide}));pass.position.set(Math.sin(da)*30,6,Math.cos(da)*30);pass.rotation.y=da;G.add(pass);
    const pglow=sprite(0xb070ff,22,1.2);pglow.position.set(Math.sin(da)*24,5,Math.cos(da)*24);G.add(pglow);
    const door=new THREE.SpotLight(0xb070ff,5,60,.55,.6,1.3);door.position.set(Math.sin(da)*22,7,Math.cos(da)*22);door.target.position.set(0,0,0);door.castShadow=true;G.add(door,door.target);
    const dm=new THREE.MeshStandardMaterial({color:lin(0x6a6258),map:tx('metal015',1),normalMap:tx('metal015-n',1),roughness:.45,metalness:.75});const dg=new THREE.Group();
    dg.add(new THREE.Mesh(new THREE.CylinderGeometry(3.6,3.6,.8,48),dm));const bnd=new THREE.Mesh(new THREE.TorusGeometry(3.4,.14,8,48),VA.gold);bnd.rotation.x=Math.PI/2;bnd.position.y=.42;dg.add(bnd);
    for(let i=0;i<6;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.4,.3,1.4),VA.gold);const a=i/6*Math.PI*2;b.position.set(Math.cos(a)*2.4,.45,Math.sin(a)*2.4);b.rotation.y=-a;dg.add(b);}
    dg.position.set(dx*.72,1.1,dz*.72);dg.rotation.set(.35,da,.15);dg.traverse(o=>{if(o.isMesh)o.castShadow=true;});G.add(dg);
    const slab=new THREE.MeshStandardMaterial({color:lin(0x8a8070),map:tx('rock',1),normalMap:tx('rock-n',1),roughness:.85});
    for(let i=0;i<14;i++){const s=new THREE.Mesh(rockGeo(.4+Math.random()*.7,i*2.3,.6),slab);const k=.72+Math.random()*.24,o=(Math.random()-.5)*6;s.position.set(dx*k+Math.cos(da)*o,.25,dz*k-Math.sin(da)*o);s.rotation.set(Math.random(),Math.random()*3,Math.random());s.castShadow=true;G.add(s);}
    const fallen=[];for(const [x,z,a] of[[3.4,-1.6,.6],[-1.2,4.4,2.4],[5.6,-5.8,-1.2],[-6.4,-3.2,1.9]]){const H=makeHuman('marine');H.root.position.set(x,0,z);H.root.rotation.y=a;H.dead=2;G.add(H.root);if(typeof MODELS!=='undefined')MODELS.dress(H,'keeper-footsoldier');fallen.push(H);}
    const fp=new THREE.MeshBasicMaterial({color:lin(0x8a4ad0).multiplyScalar(1.5),transparent:true,opacity:.6,depthWrite:false});
    for(let i=0;i<9;i++){const k=.12+i*.09,s=i%2?.35:-.35,f=new THREE.Mesh(new THREE.CircleGeometry(.22,12),fp);f.scale.set(1,1.8,1);f.rotation.set(-Math.PI/2,0,-da);f.position.set(dx*k+Math.cos(da)*s,.02,dz*k-Math.sin(da)*s);G.add(f);}
    const ghost=new THREE.Group();ghost.position.y=3.6;G.add(ghost);const gm=new THREE.MeshBasicMaterial({color:lin(0xff4a3a).multiplyScalar(1.4),wireframe:true,transparent:true,opacity:.5});
    for(let i=0;i<4;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(1.2-i*.12,.04,4,32),gm);t.rotation.set(i*.8,i*.5,0);ghost.add(t);}
    const red=new THREE.PointLight(lin(0xff3a2a),2,24,1.5);red.position.set(0,6,0);G.add(red);
    const alarm=new THREE.SpotLight(0xff3a2a,3.5,40,.25,.5,1);alarm.position.set(0,19,0);G.add(alarm,alarm.target);
    const dust=[];for(let i=0;i<70;i++){const m=sprite(0xc0a0ff,.12,1);m.position.set(dx*(.3+Math.random()*.7)+(Math.random()-.5)*4,Math.random()*8,dz*(.3+Math.random()*.7)+(Math.random()-.5)*4);G.add(m);dust.push(m);}
    SETS.theft={G,cam:t=>({p:V3(11-t*.3,6-t*.12,5-t*.15),l:V3(dx*.3,.6,dz*.3)}),update:(t,dt)=>{door.intensity=2+Math.sin(t*9)*Math.sin(t*3.3)*.7;pglow.material.opacity=.6+.25*Math.sin(t*2.3);
      for(const H of fallen)poseHuman(H,dt||.016,0,0);ghost.rotation.y=t*.4;gm.opacity=Math.random()<.08?.08:.45+.1*Math.sin(t*7);
      dust.forEach((m,i)=>{m.position.y=(m.position.y+.004)%8;});
      alarm.target.position.set(Math.sin(t*1.6)*12,0,Math.cos(t*1.6)*12);red.intensity=1.4+1.2*Math.max(0,Math.sin(t*3.2));
      tagA.textContent='ARCHIVE · INNER VAULT';tagA.classList.add('on');tagB.textContent='CODEX · NOT PRESENT';tagB.classList.toggle('on',Math.sin(t*4)>-.2);}};}
  /* 9 · THE PATHFINDER, after him into the dark: Captain Rhen's ship under the gold nebula, Astraea red below, and the jump */
  {const G=at(60000,1),sunD=V3(.5,.35,.6).normalize();SKIES.dome(G,40000,'astraea',{full:true,exp:.55});stars(G,3000,30000);
    G.add(new THREE.AmbientLight(0x30343e,.55));const sun=new THREE.DirectionalLight(0xfff0e0,2.4);sun.position.copy(sunD).multiplyScalar(100);G.add(sun);
    const A=PLANETS.make('astraea',2400,{sun:sunD,spin:.003});A.group.position.set(1500,-2900,-7600);G.add(A.group);
    const MO=PLANETS.make('moon',300,{sun:sunD,spin:.002});MO.group.position.set(-3400,1200,-12000);G.add(MO.group);
    sunFlare(G,sunD,30000,0xffe8c8);
    const ship=shipM('vanguard',90,{lift:.08,metal:.4});ship.rotation.y=0;G.add(ship);
    const eng=[-1,0,1].map(s=>{const e=sprite(0x8ff0ff,10,2);G.add(e);return{e,s};});
    const streak=new THREE.Mesh(new THREE.CylinderGeometry(.6,3.2,1,16,1,true),new THREE.MeshBasicMaterial({color:lin(0x9fe8ff).multiplyScalar(2.2),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));streak.rotation.x=Math.PI/2;G.add(streak);
    const ring=shock(G,0x9fe8ff),flashS=sprite(0xd8f4ff,1,3);G.add(flashS);
    const zOf=t=>t<6.5?-t*30:-195-Math.pow(t-6.5,3)*3000;
    SETS.pathfinder={G,far:60000,cam:t=>{const s=zOf(Math.min(t,6.5));const sh=t>6.5&&t<7.4?(Math.random()-.5)*1.4:0;return{p:V3(70+sh,24+sh,s+120-Math.min(t,6)*6),l:V3(0,0,s-45)};},
      update:(t)=>{const z=zOf(t);ship.position.set(0,0,z);A.update(t);MO.update(t);eng.forEach(({e,s})=>{e.position.set(s*9,0,z+46);e.scale.setScalar(t>6?14+(t-6)*40:12);});
        const j=Math.max(0,t-6.5);streak.material.opacity=Math.min(1,j*2)*(j<1.5?1:Math.max(0,1-(j-1.5)));streak.scale.set(1,60+j*3000,1);streak.position.set(0,0,z+(60+j*3000)/2);
        ring.visible=j>0&&j<1.4;ring.position.set(0,0,-195);ring.lookAt(camera.position);ring.scale.setScalar(10+j*260);ring.material.uniforms.o.value=Math.max(0,1-j/1.4);
        flashS.position.set(0,0,-200);flashS.visible=j>0;flashS.scale.setScalar(j>0?Math.max(0,1-Math.abs(j-.1)/.4)*600:0);ship.visible=j<.25;}};}
  /* 10 · ONE MESSAGE, then nothing: the command deck's holotable, the message as a waveform in its light, breaking up */
  {const G=at(200,.1);G.add(new THREE.AmbientLight(0x200808,.6));const red=new THREE.PointLight(lin(0xff5a3a),3,30,1.5);red.position.set(0,4,3);G.add(red);
    const deckM=new THREE.MeshStandardMaterial({color:lin(0x1a1d24),map:tx('metal015',1),normalMap:tx('metal015-n',1),roughness:.35,metalness:.7});
    const fl=new THREE.Mesh(new THREE.CircleGeometry(30,64),deckM);fl.rotation.x=-Math.PI/2;G.add(fl);
    const tbl=new THREE.Mesh(new THREE.CylinderGeometry(3,3.5,1.1,6),new THREE.MeshStandardMaterial({color:lin(0x20242c),map:tx('metal039',1),roughness:.4,metalness:.7}));tbl.position.y=.55;G.add(tbl);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(2.9,.05,6,6),new THREE.MeshBasicMaterial({color:lin(0xff7a5a).multiplyScalar(1.8)}));rim.rotation.set(Math.PI/2,0,Math.PI/6);rim.position.y=1.12;G.add(rim);
    const holo=new THREE.Mesh(new THREE.CylinderGeometry(2.7,2.7,3.4,64,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{t:{value:0},k:{value:1}},
      vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform float t,k;varying vec2 vU;void main(){float s=.6+.4*sin(vU.y*90.-t*6.);float e=smoothstep(1.,.0,vU.y);gl_FragColor=vec4(vec3(1.,.36,.24)*.04*s*e*k,1.);}'}));holo.position.y=2.8;G.add(holo);
    const bars=[];const bm=new THREE.MeshBasicMaterial({color:lin(0xff7a5a).multiplyScalar(1.8)});for(let i=0;i<48;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.07,1,.07),bm);b.position.set(-2.2+i*.094,2.8,0);G.add(b);bars.push(b);}
    // the deck round it in the dark: consoles with their screens, the big window, the city's lights far off through it
    const scr=new THREE.MeshBasicMaterial({color:lin(0x5ad2ff).multiplyScalar(.8)});
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2,c=new THREE.Mesh(new THREE.BoxGeometry(1.6,1,.8),new THREE.MeshStandardMaterial({color:lin(0x14171c),roughness:.5,metalness:.6}));c.position.set(Math.sin(a)*7,.5,Math.cos(a)*7);c.rotation.y=a;G.add(c);
      const s=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.55),scr);s.position.set(Math.sin(a)*6.58,1.2,Math.cos(a)*6.58);s.rotation.set(-.5,a+Math.PI,0,'YXZ');G.add(s);}
    const win=new THREE.Mesh(new THREE.PlaneGeometry(40,9),new THREE.MeshBasicMaterial({map:tex(512,128,(g,w,h)=>{g.fillStyle='#03050a';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=Math.random()<.7?'rgba(255,200,130,.8)':'rgba(140,210,255,.7)';g.fillRect(Math.random()*w,h*.45+Math.random()*h*.5,1.5,1.5);}})}));
    win.position.set(0,5,-16);G.add(win);
    SETS.silence={G,cam:t=>({p:V3(0,2.9,7.6-t*.15),l:V3(0,2.6,0)}),update:(t)=>{const br=Math.min(1,Math.max(0,(t-3)/2));holo.material.uniforms.t.value=t;holo.material.uniforms.k.value=(1-br*.8)*(Math.random()<.06*br?.2:1);
      bars.forEach((b,i)=>{b.scale.y=Math.max(.05,(Math.abs(Math.sin(i*.4+t*7)*Math.sin(i*.13-t*2))*(1-br)+Math.random()*br*.9)*1.6);});
      red.intensity=3*(1-br*.7);tagA.textContent='PATHFINDER · KEEPER SCOUT · CPT. A. RHEN';tagA.classList.add('on');tagB.textContent='SIGNAL LOST';tagB.classList.toggle('on',br>.5&&Math.sin(t*6)>0);}};}
}
// which groups a shot shows: its own, and any world it shares
function show(id){for(const k in SETS)SETS[k].G.visible=false;if(CW)CW.visible=false;const S=SETS[id];if(!S)return;S.G.visible=true;for(const g of S.extra||[])g.visible=true;
  camera.near=S.near||S.G.userData.near||.1;camera.far=S.far||S.G.userData.far||20000;camera.updateProjectionMatrix();}

/* ---------- the running order ---------- */
const ORDER=[['earth',1.2,'Before Elyra'],['arks',.8],['elyra',.8],['city',.8],['keepers',.8],['codex',.8],['king',.8],['theft',.8],['pathfinder',2.4],['silence',1.2]];
const ABORT={};
/* (Nov 8, Bryce) the music: Bones deep (quiet-bones-deep) under the whole prologue, from the first shot to the last, instead of a mood
   per shot; then parts of Epic Action (cut-epic-action-ending: its opening bars into its last phrase, ~20 s) come in on their first
   hit as the title card does, and the card holds over them. Mapped in js/shared/music-map.js (levels.origin). */
const END_HOLD=15.5;   // the title card over Epic Action (the cue's last hit is ~17 s in; its tail fades as the prologue hands over)
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
  if(typeof sfx!=='undefined'&&sfx.score)sfx.score('prologue');   // (Nov 8, Bryce) Bones deep under the whole prologue, from the first card
  await wait(.6);
  warmSet(ORDER[0][0]);
  for(let oi=0;oi<ORDER.length;oi++){const[id,beat,small]=ORDER[oi];
    if(small){await card(small,'sm',2.2);}
    warmSet(id);   // (normally done already, in the black before this shot)
    S.shot=id;S.t=0;show(id);const F=SETS[id].fog;scene.fog=F?new THREE.FogExp2(F[0],F[1]):null;tagA.classList.remove('on');tagB.classList.remove('on');
    fade(false,1.2);await wait(1.1);
    if(id==='silence'&&typeof sfx!=='undefined'&&sfx.static)setTimeout(()=>{if(R&&!R.dead)sfx.static(1.6);},4200);
    if(typeof sfx!=='undefined'){
      if(id==='arks'&&sfx.whoosh)setTimeout(()=>{if(R&&!R.dead)sfx.whoosh(4,.14);},600);
      if(id==='elyra'&&sfx.swell)sfx.swell(7);
      if(id==='pathfinder'&&sfx.jump)setTimeout(()=>{if(R&&!R.dead)sfx.jump();},6400);}
    for(const[who,text]of LINES[id]){await line(who,text);await wait(.35);}
    await wait(beat);fade(true,1);await wait(1);
    if(ORDER[oi+1])warmSet(ORDER[oi+1][0]);}   // the next set's shaders, while the screen is black
  S.shot=null;tagA.classList.remove('on');tagB.classList.remove('on');
  if(typeof sfx!=='undefined'&&sfx.score)sfx.score('prologue-end');
  await card('ELYRA: THE HOLLOW<small>THE KEEPERS OF THE REMNANT</small>','',END_HOLD);
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
  removeEventListener('keydown',key,true);if(typeof sfx!=='undefined'){if(sfx.hush)sfx.hush();if(sfx.score)sfx.score(null);}sub(null);
  root.style.transition='opacity .8s';root.style.opacity='0';const r=R;R=null;S=null;
  giveBack();   // the chapter's canvas goes home now; the black overlay fades off it
  setTimeout(()=>{root.hidden=true;root.style.transition='';},850);
  if(done)done(r&&r.dead);}
// the loading screen builds every set and compiles its shaders before Begin, so the prologue doesn't stall when it starts
/* Oct 24: compiling all ten sets made The Mountain's loading screen far slower than any other level's. Now the loading screen
   builds the sets (cheap) and compiles only the first; each later set compiles while the screen is black between shots */
const warmed=new Set();
/* Oct 27 (measured: the first set compiled all over again 4.5 s into the prologue): a shader is built for the exact settings it is
   drawn with, and the prologue draws with shadows on (PCF soft, set in borrow()) into the bloom's render target, not straight to the
   screen. The warm-up compiled with shadows as the chapter had them and no render target, so none of it was used. Now it matches. */
/* Oct 27 (Bryce: "lots of lag in the load screen from the White City to the Mountain"; measured: this one compile was the single
   longest freeze on the loading screen, every shader of the first set in one task). With a budget it now compiles a slice of the
   set's objects per call (about budget ms) and returns true while there is more, so the loading screen's job runs it again; called
   without one (between shots, in the black) it still does the whole set at once. Same trick as the level's own warm-up: compile()
   gathers the lights from the whole scene, then visits only the objects handed to it through traverse. */
let wq=null;
function warmSet(id,budget){if(!renderer||!SETS[id])return false;if(warmed.has(id)&&!(wq&&wq.id===id))return false;
  if(!wq||wq.id!==id){warmed.add(id);const CL=[];for(const g of[SETS[id].G].concat(SETS[id].extra||[]))g.traverse(o=>{if(o.material)CL.push(o);});wq={id,CL,ci:0};}
  const W=wq,lim=budget||1e9;
  const sv={enc:renderer.outputEncoding,tm:renderer.toneMapping,sh:renderer.shadowMap.enabled,st:renderer.shadowMap.type,rt:renderer.getRenderTarget()},vis={},cwv=CW&&CW.visible;
  for(const k in SETS)vis[k]=SETS[k].G.visible;show(id);
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  {const c=composer&&composer.composer;if(c&&c.renderTarget1)renderer.setRenderTarget(c.renderTarget1);}
  const t1=performance.now();scene.traverse=function(cb){while(W.ci<W.CL.length){cb(W.CL[W.ci++]);if(performance.now()-t1>lim)break;}};
  try{renderer.compile(scene,camera);}catch(_){}finally{delete scene.traverse;}
  renderer.setRenderTarget(sv.rt);
  for(const k in SETS)SETS[k].G.visible=vis[k];if(CW)CW.visible=!!cwv;renderer.outputEncoding=sv.enc;renderer.toneMapping=sv.tm;renderer.shadowMap.enabled=sv.sh;renderer.shadowMap.type=sv.st;
  const more=W.ci<W.CL.length;if(!more)wq=null;return more;}
function warmJobs(){return[()=>{if(!root){mount();root.hidden=true;}build();},()=>warmSet(ORDER[0][0],25)];}
// for testing: one shot at time t, rendered once
function stillShot(id,t){if(!root)mount();build();if(!home)borrow();show(id);const set=SETS[id],F=set.fog;scene.fog=F?new THREE.FogExp2(F[0],F[1]):null;
  for(let s=0;s<=t;s+=.05){const c0=set.cam(s);camera.position.copy(c0.p);camera.lookAt(c0.l);set.update(s,.05);}const c=set.cam(t);camera.position.copy(c.p).add(set.G.position);camera.lookAt(c.l.clone().add(set.G.position));
  if(composer)composer.render();else renderer.render(scene,camera);return renderer.domElement.toDataURL('image/jpeg',.8);}
if(typeof PG!=='undefined'&&PG.warm)for(const j of warmJobs())PG.warm(j);
return{play,LINES,still:stillShot,get on(){return!!R;}};
})();
