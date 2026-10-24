/* Elyra · Chapter 2 · Astraea — renderer, space backdrop, the planet, light. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the battle needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(31337);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.4:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
$('app').appendChild(renderer.domElement);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x01020a);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,1,400000);
const glow=makeGlowTex();
const panelTex=makePanelTex();
const sunDir=new THREE.Vector3(.62,.32,.55).normalize();

/* ---------- deep space: nebula dome and stars ---------- */
const NOISE3=`
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm3(vec3 p){float s=0.0,a=.5;for(int i=0;i<5;i++){s+=n3(p)*a;p*=2.03;a*=.5;}return s;}`;
const nebula=new THREE.Mesh(new THREE.SphereGeometry(300000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
  uniforms:{sunDir:{value:sunDir},photo:{value:null},photoK:{value:0},photoU:{value:.25},photoB:{value:.48}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:NOISE3+`varying vec3 vD;uniform vec3 sunDir;uniform sampler2D photo;uniform float photoK,photoU,photoB;
  void main(){vec3 d=normalize(vD);
    float n=fbm3(d*2.6+vec3(3.1,.7,1.9)),m=fbm3(d*5.5-vec3(1.3,2.2,.4));
    float band=exp(-pow(d.y*2.2-.35+n*.6,2.0)*2.0);
    vec3 c=vec3(.012,.014,.03);
    c+=vec3(.20,.06,.26)*pow(n,2.4)*band*1.6;
    c+=vec3(.03,.16,.20)*pow(m,3.0)*band*1.4;
    // Bryce's Alien Space Nebula 1 sky (img/sky/nebula-gold-*.jpg), once it loads: the code nebula is only the stand-in
    if(photoK>0.0){vec2 pu=vec2(atan(d.z,d.x)/6.2831853+.5+photoU,asin(clamp(d.y,-1.0,1.0))/3.1415927+.5);vec3 pc=pow(texture2D(photo,pu).rgb,vec3(2.2))*photoB;pc=pc/(1.0+pc*.8);c=mix(c,pc,photoK);}
    c+=vec3(.35,.12,.06)*pow(max(dot(d,sunDir),0.0),6.0)*.5;
    c+=vec3(1.0,.92,.8)*pow(max(dot(d,sunDir),0.0),600.0)*6.0;
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
nebula.renderOrder=-3;scene.add(nebula);
{const N=coarse?3000:6000,pos=new Float32Array(N*3),col=new Float32Array(N*3);
  for(let i=0;i<N;i++){const u=rng()*2-1,a=rng()*6.283,r=Math.sqrt(1-u*u),R0=250000;pos.set([Math.cos(a)*r*R0,u*R0,Math.sin(a)*r*R0],i*3);
    const k=rng(),b=R(.5,1.6)*(rng()<.03?2.5:1);col.set(k<.6?[b,b,b]:k<.8?[b*.75,b*.85,b*1.2]:[b*1.2,b*.95,b*.7],i*3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const stars=new THREE.Points(g,new THREE.PointsMaterial({size:coarse?2.2:1.8,sizeAttenuation:false,vertexColors:true,depthWrite:false,fog:false}));stars.renderOrder=-2;scene.add(stars);}

/* ---------- Astraea: a dark world whose fissures ignite when the Host wakes ---------- */
const PLANET={c:new THREE.Vector3(2000,-6000,-40000),r:26000};
const planetU={sunDir:{value:sunDir},uLight:{value:0},uTime:{value:0}};
const planet=new THREE.Mesh(new THREE.SphereGeometry(PLANET.r,128,64),new THREE.ShaderMaterial({uniforms:planetU,
  vertexShader:'varying vec3 vN;varying vec3 vP;varying vec3 vW;void main(){vP=normalize(position);vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:NOISE3+`varying vec3 vN;varying vec3 vP;varying vec3 vW;uniform vec3 sunDir;uniform float uLight,uTime;
  void main(){vec3 N=normalize(vN),V=normalize(cameraPosition-vW);
    float h=fbm3(vP*3.2),d2=fbm3(vP*9.0+4.0);
    vec3 base=mix(vec3(.05,.055,.07),vec3(.20,.18,.21),smoothstep(.35,.75,h));
    base=mix(base,vec3(.025,.035,.06),smoothstep(.42,.36,h));
    base*=.75+.5*d2;
    float diff=max(dot(N,sunDir),0.0);
    vec3 col=base*(diff*1.15+.03);
    float r=1.0-abs(fbm3(vP*4.5+vec3(9.0))*2.0-1.0);
    float cracks=smoothstep(.9,.985,r);
    float nodes=smoothstep(.68,.74,fbm3(vP*2.0-vec3(2.0)));
    float pulse=.7+.3*sin(uTime*2.2+vP.x*14.0+vP.z*9.0);
    vec3 hot=vec3(1.0,.28,.06)*(cracks*2.2+nodes*1.4)*pulse*uLight;
    col+=hot*(1.0-diff*.6);
    float fres=pow(1.0-max(dot(N,V),0.0),3.0);
    col+=mix(vec3(.25,.35,.75),vec3(.9,.25,.12),uLight)*fres*(.25+.9*diff+.5*uLight);
    gl_FragColor=vec4(col,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
planet.position.copy(PLANET.c);scene.add(planet);
const atmo=new THREE.Mesh(new THREE.SphereGeometry(PLANET.r*1.035,96,48),new THREE.ShaderMaterial({uniforms:planetU,side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`varying vec3 vN;varying vec3 vW;uniform vec3 sunDir;uniform float uLight;
  void main(){vec3 N=normalize(vN),V=normalize(cameraPosition-vW);float rim=pow(max(dot(N,V),0.0),2.5);
    float lit=.25+.75*max(dot(-N,sunDir),0.0);
    vec3 c=mix(vec3(.25,.4,1.0),vec3(1.0,.3,.1),uLight)*rim*lit*(.8+uLight);
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
atmo.position.copy(PLANET.c);scene.add(atmo);

/* ---------- light ---------- */
scene.add(new THREE.HemisphereLight(C(0x8c9cff),C(0x2a1a2a),.6));
// fill light from the planet side, so hulls facing away from the sun are not pitch black; turns orange when Astraea wakes
const planetFill=new THREE.DirectionalLight(C(0x5a6cff),.5);planetFill.position.copy(PLANET.c).normalize().multiplyScalar(1000);scene.add(planetFill);
const sun=new THREE.DirectionalLight(C(0xfff1dc),2.6);sun.position.copy(sunDir).multiplyScalar(1000);scene.add(sun);
const sunFlare=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xfff0d0).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
sunFlare.scale.setScalar(26000);scene.add(sunFlare);
function bakeSpaceEnv(){try{const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),nebula.material));
  scene.environment=pm.fromScene(es,0,.1,1000).texture;}catch(e){}}
bakeSpaceEnv();
new THREE.TextureLoader().load('img/sky/nebula-gold-'+(coarse?'phone':'pc')+'.jpg',t=>{t.wrapS=THREE.RepeatWrapping;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;
  nebula.material.uniforms.photo.value=t;nebula.material.uniforms.photoK.value=1;bakeSpaceEnv();},undefined,()=>{});
