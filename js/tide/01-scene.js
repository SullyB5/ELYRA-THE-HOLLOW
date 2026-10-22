/* Tide City · scene */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}

/* ---------- helpers ---------- */
setSeed(2077);

/* ---------- renderer / scene ---------- */
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.6:1.75));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.95;
$('app').appendChild(renderer.domElement);

const scene=new THREE.Scene();
// Tide City at night (Bryce's Qwantani night sky, img/sky/tide-night-*.jpg): dark sea fog, moonlight, the city lit from inside
const FOG=C(0x0d1626),FOG_DEN=0.00006;
scene.fog=new THREE.FogExp2(FOG,FOG_DEN);
scene.background=FOG;
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,1,45000);
camera.rotation.order='YXZ';

const sunDir=new THREE.Vector3(-0.35,0.84,0.42).normalize();
const ZENITH=C(0x060a18);

/* ---------- sky ---------- */
const sky=new THREE.Mesh(new THREE.SphereGeometry(40000,32,16),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{sunDir:{value:sunDir},hor:{value:FOG},zen:{value:ZENITH},photo:{value:null},photoK:{value:0},photoU:{value:.08}},
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,zen;uniform float photoK,photoU;uniform sampler2D photo;
  void main(){vec3 d=normalize(vDir);float y=max(d.y,0.0);
    vec3 c=mix(hor,zen,pow(smoothstep(0.0,1.0,y),0.55));
    if(photoK>0.0){float el=asin(clamp(d.y,0.0,1.0))/1.5707963;vec2 pu=vec2(atan(d.z,d.x)/6.2831853+.5+photoU,mix(.66,1.0,el));vec3 pc=pow(texture2D(photo,pu).rgb,vec3(2.2));pc=pc/(1.0+pc*1.5);c=mix(c,pc,photoK*smoothstep(0.0,.12,d.y));}   // sky half only, from the horizon up; highlights compressed
    if(d.y<0.0)c=hor;
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`
}));
sky.renderOrder=-2;scene.add(sky);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(C(0xcfe6ff),C(0x3a6a8c),.42));
const sun=new THREE.DirectionalLight(C(0xfff4e2),1.9);
sun.position.copy(sunDir).multiplyScalar(9000);scene.add(sun,sun.target);
sun.castShadow=true;
{const ms=coarse?2048:Math.min(4096,renderer.capabilities.maxTextureSize||4096);sun.shadow.mapSize.set(ms,ms);
 Object.assign(sun.shadow.camera,{left:-3300,right:3300,top:3300,bottom:-3300,near:100,far:20000});sun.shadow.bias=-.0004;sun.shadow.normalBias=1.5;}
const hemiL=scene.children.find(o=>o.isHemisphereLight);if(hemiL){hemiL.color.set(C(0x5a6c98));hemiL.groundColor.set(C(0x0c1626));hemiL.intensity=.32;}
sun.color.set(C(0xa8bce8));sun.intensity=.5;   // moonlight
function bakeEnv(){try{const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),sky.material));
  scene.environment=pm.fromScene(es,0,.1,1000).texture;}catch(e){}}
bakeEnv();
new THREE.TextureLoader().load('img/sky/tide-night-'+(coarse?'phone':'pc')+'.jpg',t=>{t.wrapS=THREE.RepeatWrapping;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;
  sky.material.uniforms.photo.value=t;sky.material.uniforms.photoK.value=1;bakeEnv();},undefined,()=>{});

/* ---------- ocean ---------- */
const ocean=new THREE.Mesh(new THREE.PlaneGeometry(90000,90000,1,1),new THREE.ShaderMaterial({
  fog:false,
  uniforms:{time:{value:0},sunDir:{value:sunDir},fogCol:{value:FOG},fogDen:{value:FOG_DEN},deep:{value:C(0x020a14)},zen:{value:ZENITH}},
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`varying vec3 vW;uniform float time,fogDen;uniform vec3 sunDir,fogCol,deep,zen;
  vec2 wv(vec2 p,vec2 d,float k,float a,float s){float ph=k*dot(normalize(d),p)+s*time;return normalize(d)*a*k*cos(ph);}
  void main(){
    vec2 p=vW.xz;float dist=length(cameraPosition-vW);
    float lod=1.0/(1.0+dist*0.0025);
    vec2 g=wv(p,vec2(1.0,0.35),0.018,1.1,0.9)+wv(p,vec2(-0.6,1.0),0.027,0.7,1.1)+wv(p,vec2(0.2,-1.0),0.041,0.45,1.4);
    g+=(wv(p,vec2(0.9,0.8),0.11,0.12,2.1)+wv(p,vec2(-1.0,0.2),0.17,0.08,2.6)+wv(p,vec2(0.3,1.0),0.29,0.05,3.3)+wv(p,vec2(-0.4,-0.9),0.53,0.025,4.1))*lod;
    vec3 N=normalize(vec3(-g.x,1.0,-g.y));
    vec3 V=normalize(cameraPosition-vW);
    float fres=0.02+0.98*pow(1.0-max(dot(N,V),0.0),5.0);
    vec3 Rf=reflect(-V,N);Rf.y=abs(Rf.y);
    vec3 skyc=mix(fogCol,zen,pow(clamp(Rf.y,0.0,1.0),0.55));
    vec3 col=mix(deep,skyc,fres);
    float sp=max(dot(Rf,sunDir),0.0);
    col+=vec3(1.0,0.96,0.88)*(pow(sp,600.0)*14.0+pow(sp,60.0)*0.35);
    float f=1.0-exp(-pow(fogDen*dist,2.0));
    col=mix(col,fogCol,f);
    gl_FragColor=vec4(col,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`
}));
ocean.rotation.x=-Math.PI/2;ocean.renderOrder=-1;scene.add(ocean);
