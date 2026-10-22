/* Elyra · Pathfinder · Arc 02 · Dead Ground — the world. 09.03.2237, the day after the crash: Astraea's red desert under a copper sky.
   Rhen's team walks from the wreck through a burned convoy and black glass, across a basin where the Heralds are fighting each other,
   through a graveyard of their transports, into a canyon where Dropship Two came down. A white city stands on the far horizon.
   Same contract as js/pathfinder/01-world.js: js/origin/03-play.js only asks for playD, groundY, roadS, laneHalf and friends. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(2237);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.6:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
window.ELYRA_RENDERER=renderer;
$('app').appendChild(renderer.domElement);
MODELS.preload(['engineer','marine','rifle','host-trooper','dropship']);
// you are Captain Rhen, not Michael: the Keeper marine model in the Pathfinder's scout grey (read by js/origin/03-play.js)
window.PLAYER_KIND='marine';window.PLAYER_OPTS={tint:0xb4bcc4};

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(C(0xb8704e),.0011);scene.background=scene.fog.color;
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,9000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();
const lerp=(a,b,u)=>a+(b-a)*u;

/* ---------- the sky: black, hard stars, a faint band of the galaxy, a thin violet haze low down (the moon has a little air),
   and Astraea, enormous, ochre and red with white weather, lit from one side. The whole sky rides with the camera ---------- */
const skyGroup=new THREE.Group();scene.add(skyGroup);
const sunDir=new THREE.Vector3(.62,.18,.76).normalize();   // the system's star: low, behind you as you go north
const ASTRAEA_DIR=new THREE.Vector3(-.28,.36,-.89).normalize();   // ahead and high, over the facility
const skyU={sunDir:{value:sunDir},hor:{value:C(0x2a2238)},mid:{value:C(0x120e22)},zen:{value:C(0x020208)},starK:{value:1},sunK:{value:1},uT:{value:0},band:{value:1}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(4000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,mid,zen;uniform float starK,sunK,uT,band;
  float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.0,a=.5;for(int i=0;i<5;i++){s+=ns(p)*a;p=p*2.03+vec2(17.0,-9.0);a*=.5;}return s;}
  void main(){vec3 d=normalize(vDir);float y=d.y;
    vec3 c=mix(hor,mid,smoothstep(-.02,.16,y));c=mix(c,zen,smoothstep(.12,.7,y));
    // stars in two sizes, and the galaxy's band: a long smear of dust and light across the sky
    vec2 sp=floor(vec2(atan(d.z,d.x)*420.0,asin(clamp(y,-1.0,1.0))*420.0));float st=step(.9962,hs(sp))*(.3+.7*hs(sp+7.3));
    vec2 sp2=floor(vec2(atan(d.z,d.x)*130.0,asin(clamp(y,-1.0,1.0))*130.0));st+=step(.9985,hs(sp2+3.1))*1.4;
    float bd=abs(dot(d,normalize(vec3(.3,.55,-.78))));float gb=exp(-bd*bd*18.0)*band;
    float neb=fbm(vec2(atan(d.z,d.x)*3.0,y*6.0)+3.0);c+=vec3(.16,.1,.22)*gb*neb*.9+vec3(.05,.06,.1)*gb;st*=1.0+gb*1.5;
    c+=vec3(st)*starK*smoothstep(-.05,.12,y)*(1.0-smoothstep(.0,.3,length(c)));
    float s=max(dot(d,sunDir),0.0);c+=vec3(1.0,.85,.65)*pow(s,900.0)*6.0*sunK+vec3(1.0,.6,.4)*pow(s,24.0)*.12*sunK;
    if(y<0.0)c=mix(hor,hor*.35,smoothstep(0.0,-.25,y));
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
sky.renderOrder=-3;skyGroup.add(sky);
// Astraea: banded ochre and rust, white storm cloud, a red rim of atmosphere, a night side that never quite goes black
const astraeaU={sunDir:{value:sunDir},uT:{value:0},glowK:{value:1}};
const astraea=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.ShaderMaterial({uniforms:astraeaU,fog:false,depthWrite:false,transparent:true,
  vertexShader:'varying vec3 vN;varying vec3 vP;varying vec3 vV;void main(){vN=normalize(mat3(modelMatrix)*normal);vP=position;vec4 w=modelMatrix*vec4(position,1.0);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`varying vec3 vN;varying vec3 vP;varying vec3 vV;uniform vec3 sunDir;uniform float uT,glowK;
  float hs(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float ns(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fb(vec3 p){float s=0.0,a=.5;for(int i=0;i<5;i++){s+=ns(p)*a;p=p*2.1+vec3(1.7,-2.3,.9);a*=.5;}return s;}
  void main(){vec3 n=normalize(vN),p=normalize(vP);
    float lat=p.y+fb(p*3.0)*.35;float bands=.5+.5*sin(lat*18.0+fb(p*5.0)*4.0);
    vec3 land=mix(vec3(.55,.24,.12),vec3(.86,.62,.38),bands);land=mix(land,vec3(.38,.1,.08),smoothstep(.55,.75,fb(p*2.2+4.0)));
    float cl=smoothstep(.52,.78,fb(p*4.0+vec3(uT*.002,0.0,0.0)));land=mix(land,vec3(1.0,.94,.9),cl*.85);
    float l=dot(n,sunDir);float day=smoothstep(-.15,.35,l);
    vec3 c=land*(.02+day*1.05);
    // the night side: a few faint lights where nothing should be lit
    float lights=step(.985,hs(floor(p*160.0)))*smoothstep(.1,-.2,l)*(1.0-cl);c+=vec3(1.0,.8,.5)*lights*.6;
    float rim=pow(1.0-max(dot(n,vV),0.0),3.0);c+=vec3(1.0,.35,.2)*rim*(.15+day*1.1)*glowK;
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
astraea.renderOrder=-2;astraea.position.copy(ASTRAEA_DIR).multiplyScalar(3000);astraea.scale.setScalar(760);skyGroup.add(astraea);
// a shell of her air around the disc, brightest at the limb
const astraeaHalo=new THREE.Mesh(new THREE.SphereGeometry(1,64,32),new THREE.ShaderMaterial({uniforms:{sunDir:{value:sunDir}},side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
  vertexShader:'varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=normalize(w.xyz-cameraPosition);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'varying vec3 vN;varying vec3 vW;uniform vec3 sunDir;void main(){float k=pow(clamp(dot(-normalize(vN),-vW)*-1.0+.32,0.0,1.0)*2.2,2.6);float lit=.25+.75*smoothstep(-.4,.5,dot(-normalize(vN),sunDir));gl_FragColor=vec4(vec3(1.0,.42,.24)*k*lit*.55,1.0);}'}));
astraeaHalo.renderOrder=-2;astraeaHalo.position.copy(astraea.position);astraeaHalo.scale.setScalar(760*1.06);skyGroup.add(astraeaHalo);
function skyFollow(){skyGroup.position.copy(camera.position);}

/* ---------- light: Astraea-shine (warm, from her side of the sky), the star low behind, a cold ambient, purple from the Host ---------- */
const hemi=new THREE.HemisphereLight(C(0x7a7aa8),C(0x18121e),.55);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(C(0xffb08a),1.15);keyLight.position.copy(ASTRAEA_DIR).multiplyScalar(600);scene.add(keyLight,keyLight.target);
keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(keyLight.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:1500});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.05;
const rim=new THREE.DirectionalLight(C(0xbfd0ff),.45);rim.position.copy(sunDir).multiplyScalar(500);scene.add(rim);
let keyDir=ASTRAEA_DIR.clone();
function followSun(p){keyLight.position.copy(p).addScaledVector(keyDir,600);keyLight.target.position.copy(p);}
/* looks: the moon at night (play), orbit, inside a ship, the fall through Astraea's air, Astraea's surface */
/* looks: the red desert by day (play), the end of the day (the last shot), the inside of the wreck */
const DESERT_KEY=new THREE.Vector3(.55,.42,.72).normalize();
const LOOKS={
  desert:{hor:0xe8a070,mid:0xb4583c,zen:0x4a1626,star:0,sunK:1.3,fog:0xb8704e,dens:.0011,keyC:0xffd2a0,keyI:2.0,hemiS:0xffb898,hemiG:0x3a1a14,hemiI:.8,planet:0,band:0,dir:DESERT_KEY,exp:1.0},
  dusk:{hor:0xff9a5a,mid:0x9a3a2a,zen:0x2a0c1a,star:.3,sunK:1.6,fog:0xa85a40,dens:.0005,keyC:0xffb070,keyI:1.7,hemiS:0xff9a80,hemiG:0x2a1010,hemiI:.65,planet:0,band:.3,dir:new THREE.Vector3(.2,.16,.97).normalize(),exp:1.0}};
let lookName='';
function setLook(name){const L=LOOKS[name];if(!L)return;lookName=name;
  skyU.hor.value.copy(C(L.hor));skyU.mid.value.copy(C(L.mid));skyU.zen.value.copy(C(L.zen));skyU.starK.value=L.star;skyU.sunK.value=L.sunK;skyU.band.value=L.band;
  scene.fog.color.copy(C(L.fog));scene.fog.density=L.dens;scene.background=scene.fog.color;
  keyLight.color.copy(C(L.keyC));keyLight.intensity=L.keyI;hemi.color.copy(C(L.hemiS));hemi.groundColor.copy(C(L.hemiG));hemi.intensity=L.hemiI;keyDir=L.dir.clone();
  astraea.visible=astraeaHalo.visible=!!L.planet;renderer.toneMappingExposure=L.exp;}
sunDir.copy(DESERT_KEY);

/* ---------- the map, south to north along one walk (the "road"): the crash (Rhen's dropship, where Arc 01 ended) → the dead desert
   (a burned convoy, black glass where the ground melted, pale stone fragments) → the basin, where two Herald forces with the same
   uniforms and different insignias are killing each other → the graveyard of Herald transports (two orders) → the canyon, and
   Dropship Two at its end. Units are metres. ---------- */
const LZ={x:0,z:-4,r:30},DS2={x:-4,z:-536,r:20};
const ROAD=[[0,0],[0,-50],[22,-110],[12,-170],[-22,-232],[-12,-292],[10,-342],[12,-400],[0,-450],[-4,-510],[-4,-536]];
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const ROADS=[],ROAD_LEN=(()=>{let s=0;for(let i=0;i<ROAD.length-1;i++){const [ax,az]=ROAD[i],[bx,bz]=ROAD[i+1],l=Math.hypot(bx-ax,bz-az);ROADS.push({ax,az,bx,bz,l,s0:s,nx:-(bz-az)/l,nz:(bx-ax)/l});s+=l;}return s;})();
function roadSeg(x,z){let best=1e9,bs=0,bt=0,br=ROADS[0];for(const r of ROADS){const dx=r.bx-r.ax,dz=r.bz-r.az,t=clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.l*r.l),0,1),d=Math.hypot(x-r.ax-dx*t,z-r.az-dz*t);if(d<best){best=d;bs=r.s0+t*r.l;bt=t;br=r;}}return{s:bs,r:br,t:bt,d:best};}
function roadS(x,z){const q=roadSeg(x,z);let bs=q.s;if(z>ROAD[0][1])bs=-(z-ROAD[0][1]);if(z<ROAD[ROAD.length-1][1])bs=ROAD_LEN+(ROAD[ROAD.length-1][1]-z);return bs;}
const _rp=new THREE.Vector3();
function roadPt(s,out){s=clamp(s,0,ROAD_LEN);out=out||_rp;for(const r of ROADS)if(s<=r.s0+r.l){const t=(s-r.s0)/r.l;return out.set(r.ax+(r.bx-r.ax)*t,0,r.az+(r.bz-r.az)*t);}const e=ROAD[ROAD.length-1];return out.set(e[0],0,e[1]);}
function roadN(s){let nx=0,nz=0;for(const r of ROADS){const k=clamp(1-Math.max(0,Math.max(r.s0-s,s-(r.s0+r.l)))/10,0,1);nx+=r.nx*k;nz+=r.nz*k;}const l=Math.hypot(nx,nz)||1;return{x:nx/l,z:nz/l};}
function latOf(x,z){const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t;return(x-px)*r.nx+(z-pz)*r.nz;}
const SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0;
function laneC(s){return 0;}
function spineAt(s){return false;}
// the stretches, by distance along the walk
const S_DESERT=46,S_BASIN=196,S_GRAVE=318,S_CANYON=392;
function zoneOf(s){return s<S_DESERT?'crash':s<S_BASIN?'desert':s<S_GRAVE?'basin':s<S_CANYON?'grave':'canyon';}
function laneHalf(s){
  if(s<S_DESERT)return lerp(30,22,sstep(S_DESERT-14,S_DESERT,s));
  if(s<S_BASIN-14)return 22+4*Math.sin(s*.05);
  if(s<S_GRAVE-10)return lerp(22,46,sstep(S_BASIN-14,S_BASIN+14,s))*(1-sstep(S_GRAVE-30,S_GRAVE-10,s))+28*sstep(S_GRAVE-30,S_GRAVE-10,s);
  if(s<S_CANYON-6)return 28;
  return lerp(28,11,sstep(S_CANYON-6,S_CANYON+14,s))+2*Math.sin(s*.13);}
const BARRIERS=[];
function barrier(id){return null;}
function inDS2(x,z,m){return Math.hypot(x-DS2.x,z-DS2.z)<DS2.r+(m||0);}
// distance outside the walkable area (negative inside)
function playD(x,z){
  let d=Math.hypot(x-LZ.x,z-LZ.z)-LZ.r;
  const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t,lat=(x-px)*r.nx+(z-pz)*r.nz,along=Math.abs((x-px)*r.nz-(z-pz)*r.nx);
  const dl=Math.abs(lat)-laneHalf(q.s);d=Math.min(d,Math.hypot(Math.max(0,dl),along)+Math.min(0,dl));
  d=Math.min(d,Math.hypot(x-DS2.x,z-DS2.z)-DS2.r);
  for(const B of BLOCKS)d=Math.max(d,B.r-Math.hypot(x-B.x,z-B.z));
  return d;}
const BLOCKS=[];
// the floor: soft dunes under your feet (small, so the fight stays readable)
function floorAt(x,z){return .45*fbm(x*.03+7,z*.03-3)-.2;}
// outside the walk: dunes rising away from it; in the canyon, sheer rock to a flat rim 15 m up (riflemen stand on it), then the plateau
const CLIFF=15;
function rimY(x,z,d){return CLIFF+.6*vnoise(x*.2,z*.2)+Math.min(Math.max(0,d-9)*.35,9)+ridged(x*.01,z*.01)*6*sstep(9,40,d);}   // the plateau levels off, so the far horizon (and the white city) shows over it
function duneY(x,z,d){return floorAt(x,z)+Math.min(d*.55,7)+Math.max(0,d-12)*.18+9*fbm(x*.008+2,z*.008)*sstep(10,60,d)+ridged(x*.004,z*.004)*60*sstep(120,380,d);}
function groundY(x,z){
  const d=playD(x,z);
  if(d<=0)return floorAt(x,z);
  const s=roadS(x,z),zn=zoneOf(clamp(s,0,ROAD_LEN));
  if(zn==='canyon'&&!inDS2(x,z,-2)){const k=sstep(.2,1.6,d);return lerp(floorAt(x,z),rimY(x,z,d),k);}
  if(inDS2(x,z,10)&&s>ROAD_LEN-30){const k=sstep(.2,2.2,d);return lerp(floorAt(x,z),rimY(x,z,d),k);}
  return duneY(x,z,d);}
function ceilAt(){return 1e4;}
function camClamp(head){const c=camera.position,g=groundY(c.x,c.z)+.4;if(c.y<g)c.y=g;}

/* ---------- the ground: one mesh, fine along the walk and coarse out in the dunes ---------- */

/* ---------- materials (as Arc 01) ---------- */
const TEXL=new THREE.TextureLoader(),TSUF=coarse?'phone':'pc';
function ldTex(n){const t=TEXL.load('img/tex/'+n+'-'+TSUF+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=coarse?2:8;return t;}
const TX={rock:ldTex('rock'),sand:ldTex('sand'),soil:ldTex('soil'),peb:ldTex('pebbles')};
// a photo texture laid on from three sides, tinted by the vertex colours (stone, dust)
function triMat(t,scale,boost,opts,desat,soft){const m=new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.9,metalness:.05},opts||{}));const U={tA:{value:t}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader='uniform sampler2D tA;varying vec3 vWP;varying vec3 vWN;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 bw=pow(abs(normalize(vWN)),vec3(4.0));bw/=(bw.x+bw.y+bw.z);float k=${scale.toFixed(3)};
      vec3 tc=pow(texture2D(tA,vWP.zy*k).rgb,vec3(2.2))*bw.x+pow(texture2D(tA,vWP.xz*k).rgb,vec3(2.2))*bw.y+pow(texture2D(tA,vWP.xy*k).rgb,vec3(2.2))*bw.z;
      ${desat?`tc=mix(tc,vec3(dot(tc,vec3(.3,.5,.2))),${desat.toFixed(2)});`:''}${soft?`tc=mix(vec3(dot(tc,vec3(.33))),tc,${(1-soft).toFixed(2)});`:''}diffuseColor.rgb=tc*diffuseColor.rgb*${boost.toFixed(2)};`);};
  return m;}
const hostMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.55,metalness:.6});
const oldMat=triMat(TX.rock,.035,2.1,{roughness:.6},.5,.7);              // the old stone: pale, smooth, seamless
const groundMat=triMat(TX.sand,.08,2.4,{roughness:.95},.75);           // moon dust (the sand photo, greyed)
const astraeaGroundMat=triMat(TX.sand,.08,2.4,{roughness:.95});     // Astraea's ground keeps its colour
const rockMat2=triMat(TX.rock,.05,2.2,{roughness:.92},.8);
const purpleGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:C(FLEET_PURPLE).multiplyScalar(1.1),toneMapped:false});
// Host windows: real panes of smoked violet glass, dim, set into the walls and the facility's mass (they used to be thin neon lines)
const winMat=new THREE.MeshBasicMaterial({vertexColors:true,color:C(0x6a4a9a).multiplyScalar(.75),toneMapped:false});
const stripMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1,1,1).multiplyScalar(1.4),toneMapped:false});   // the interior strip lights (they go red with the alarm)
const goldGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:C(0xffd890).multiplyScalar(1.2),toneMapped:false,transparent:true,opacity:.85});
const HOST_GLOW=FLEET_PURPLE;
{const steps=(a,b,fine,lo,hi,cs)=>{const o=[];let v=a;while(v<b){o.push(v);v+=(v>=lo&&v<hi)?fine:cs;}o.push(b);return o;};
 const xs=steps(-900,900,coarse?2.4:1.7,-110,110,coarse?18:12),zs=steps(-1300,500,coarse?2.4:1.7,-600,70,coarse?18:12);
 const NX=xs.length,NZ=zs.length,pos=new Float32Array(NX*NZ*3),col=new Float32Array(NX*NZ*3),sand=C(0xc87a50),rust=C(0x8a3a24),rock=C(0x6a3428),tmp=new THREE.Color();
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=xs[i],z=zs[j],k=(j*NX+i)*3,y=groundY(x,z);pos[k]=x;pos[k+1]=y;pos[k+2]=z;
   const n=vnoise(x*.04,z*.04),cliff=clamp((y-floorAt(x,z))/CLIFF,0,1)*(zoneOf(clamp(roadS(x,z),0,ROAD_LEN))==='canyon'?1:.25);
   tmp.copy(sand).lerp(rust,n*.7).lerp(rock,cliff*.85).multiplyScalar(.8+.35*vnoise(x*.25,z*.25));col[k]=tmp.r;col[k+1]=tmp.g;col[k+2]=tmp.b;}
 const idx=new Uint32Array((NX-1)*(NZ-1)*6);let q=0;
 for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const p=j*NX+i,r=p+1,c=p+NX,d=c+1;idx[q++]=p;idx[q++]=c;idx[q++]=r;idx[q++]=r;idx[q++]=c;idx[q++]=d;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
 const m=new THREE.Mesh(g,astraeaGroundMat);m.receiveShadow=true;scene.add(m);}

/* ---------- obstacles: circles for collision, cover and line of sight (OBST); long ones also in BARS ---------- */
const OBST=[],BARS=[];
const K_HULL=C(0x8e96a2),K_KEEP=C(0x2a5a96),K_BURN=C(0x231c1c),K_HER=C(0x3a1616),K_BONE=C(0xd8cbb4),K_GLASS=C(0x120a0a);
const wm=new Merger(),wg=new Merger(),sm=new Merger(),sg=new Merger();   // wreck metal, wreck glow, stone (the old white stone), its gold
// burned machinery: a box hulk, tilted, half in the sand
function hulk(x,z,w,h,d,ry,col,obst){const y=floorAt(x,z);wm.add(boxUV(w,h,d,3),M(x,y+h*.35,z,R(-.12,.12),ry,R(-.18,.18)),col||K_BURN);if(obst!==false){OBST.push({x,z,r:Math.max(w,d)*.45,h:h*.8});}}
// a burned convoy vehicle: hull, cab, wheels gone, a scorch
function vehicle(x,z,ry){hulk(x,z,3.2,2.2,7,ry,K_BURN);const y=floorAt(x,z);wm.add(boxUV(2.8,1.6,2.4,3),M(x+Math.sin(ry)*-2.6,y+2.2,z+Math.cos(ry)*-2.6,0,ry,.1),K_HER);
  for(const s of[-1,1])for(const k of[-2,2])wm.add(cylZ(.7,.7,.5,10).rotateY(Math.PI/2),M(x+Math.cos(ry)*s*1.7+Math.sin(ry)*k,y+.4,z-Math.sin(ry)*s*1.7+Math.cos(ry)*k),C(0x161212));}
// a pale stone fragment from something much older: seamless, a thread of gold through it
function relic(x,z,s,ry){const y=floorAt(x,z);sm.add(boxUV(s*.7,s*1.6,s*.5,2),M(x,y+s*.6,z,R(-.25,.25),ry,R(-.3,.3)),K_BONE);sg.add(new THREE.BoxGeometry(s*.72,.04,.04),M(x,y+s*.75,z,0,ry,0),C(0xffd27a));OBST.push({x,z,r:s*.45,h:s*1.2});}
function at0(s,lat){const p=roadPt(clamp(s,0,ROAD_LEN)).clone(),n=roadN(clamp(s,0,ROAD_LEN));p.x+=n.x*lat;p.z+=n.z*lat;p.y=floorAt(p.x,p.z);return p;}
// cover: low walls of broken stone and wreckage (you can shoot over them: their hit box is low, see BARS in js/origin/03-play.js)
function lowWall(x,z,ry,w){const y=floorAt(x,z);wm.add(boxUV(w,1.2,.9,2),M(x,y+.5,z,0,ry,R(-.05,.05)),K_BURN);
  const n=Math.max(1,Math.round(w/1.4));for(let i=0;i<n;i++){const u=(i+.5)/n-.5;OBST.push({x:x+Math.cos(ry)*u*w,z:z-Math.sin(ry)*u*w,r:.75,h:1.3,bar:true});}
  BARS.push({ax:x-Math.cos(ry)*w/2,az:z+Math.sin(ry)*w/2,bx:x+Math.cos(ry)*w/2,bz:z-Math.sin(ry)*w/2,r:.75});}
// boulders
const ROCKS=[];
function addRock(x,z,r){const ys=R(.45,.85),g=new THREE.DodecahedronGeometry(r,1),P=g.attributes.position;for(let i=0;i<P.count;i++){const k=.8+.4*hash(i*3+((x*7)|0),(z*5)|0);P.setXYZ(i,P.getX(i)*k,P.getY(i)*k,P.getZ(i)*k);}
  g.scale(1,ys,1);g.computeVertexNormals();const col=[];for(let i=0;i<P.count;i++)col.push(.55,.3,.22);g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(g,rockMat2);m.position.set(x,floorAt(x,z)+r*ys*.3,z);m.rotation.y=R(0,3);m.castShadow=m.receiveShadow=true;scene.add(m);OBST.push({x,z,r:r*.9,h:r*ys*1.5});ROCKS.push(m);}

// THE CRASH: Rhen's dropship where it stopped at the end of Arc 01, nose down at the end of its trench; debris along the trench
const WRECK={x:-9,z:-14,ry:-.35};
{for(let k=0;k<14;k++){const u=k/14;hulk(WRECK.x+18*u+R(-3,3),WRECK.z+44*u+R(-2,2),R(.8,2.2),R(.3,.8),R(.8,2.6),R(0,3),C(0x5a5e66),k%3===0);}
 for(const [x,z,r] of[[16,-20,1.6],[-24,6,1.3],[20,10,1.1],[-20,-26,1.8],[8,-34,1.2]])addRock(x,z,r);}

// THE DEAD DESERT: a convoy burned where it stood, black glass where the ground melted (it still burns: stay off it), stone fragments
const HAZ=[];   // {x,z,r}: patches of molten glass that hurt if you stand in them
{for(const [s,lat,ry] of[[64,-9,.3],[72,6,-.2],[84,-4,.9],[96,11,.1],[110,-13,-.4],[150,8,.6],[164,-6,1.2]])vehicle(at0(s,lat).x,at0(s,lat).z,ry);
 for(const [s,lat,sc] of[[78,15,2.2],[118,-17,3],[132,14,1.6],[176,-15,2.6],[188,10,1.8]])relic(at0(s,lat).x,at0(s,lat).z,sc,R(0,3));
 for(const [s,lat,r] of[[90,4,4.5],[126,-6,5.5],[142,9,3.8],[172,2,4.2]]){const p=at0(s,lat);HAZ.push({x:p.x,z:p.z,r});}
 for(const [s,lat,w] of[[58,3,5],[88,-12,6],[104,4,5],[138,-2,6],[160,12,5],[182,-8,6]]){const p=at0(s,lat),n=roadN(s);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.3,.3),w);}
 for(let k=0;k<26;k++){const s=R(50,190),lat=R(-20,20),p=at0(s,lat);if(HAZ.some(h=>Math.hypot(h.x-p.x,h.z-p.z)<h.r+2))continue;addRock(p.x,p.z,R(.5,1.3));}}
// the black glass: dark, glossy, cracks of orange light, heat shimmer
const hazMat=new THREE.MeshStandardMaterial({color:C(0x0a0606),roughness:.12,metalness:.6,emissive:C(0xff4a10),emissiveIntensity:.0});
const hazGlow=new THREE.MeshBasicMaterial({color:C(0xff6a20).multiplyScalar(1.4),toneMapped:false,transparent:true,opacity:.85});
for(const h of HAZ){const g=new THREE.CircleGeometry(h.r,28),P=g.attributes.position;for(let i=0;i<P.count;i++){const a=Math.atan2(P.getY(i),P.getX(i)),r=Math.hypot(P.getX(i),P.getY(i));const k=1+.18*Math.sin(a*5+h.r);P.setXY(i,Math.cos(a)*r*k,Math.sin(a)*r*k);}
  const m=new THREE.Mesh(g,hazMat);m.rotation.x=-Math.PI/2;m.position.set(h.x,floorAt(h.x,h.z)+.06,h.z);m.receiveShadow=true;scene.add(m);
  const cg=new Merger();for(let k=0;k<9;k++){const a=R(0,6.28),l=R(.4,.9)*h.r;cg.add(new THREE.BoxGeometry(l,.02,.07),M(h.x+Math.cos(a)*l*.45,floorAt(h.x,h.z)+.08,h.z+Math.sin(a)*l*.45,0,-a,0),C(0xffffff));}
  const cm=new THREE.Mesh(cg.build(),hazGlow);scene.add(cm);h.glow=cm;
  const pl=new THREE.PointLight(C(0xff6a20),1.2,h.r*3,1.6);pl.position.set(h.x,1.2,h.z);scene.add(pl);h.light=pl;}

// THE BASIN: wide and open, scattered cover; two Herald lines face each other across it (js/pathfinder2/02-story.js puts them there)
{for(const [s,lat,w] of[[210,-30,7],[222,-12,5],[232,22,7],[248,-34,6],[256,4,6],[266,30,7],[280,-20,7],[292,14,6],[300,-36,5],[304,34,5]]){const p=at0(s,lat),n=roadN(s);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.4,.4),w);}
 for(const [s,lat] of[[214,40],[238,-40],[262,-8],[286,42],[298,-4]]){const p=at0(s,lat);vehicle(p.x,p.z,R(0,3));}
 for(const [s,lat,sc] of[[226,38,3],[274,-42,2.4]])relic(at0(s,lat).x,at0(s,lat).z,sc,R(0,3));
 for(let k=0;k<20;k++){const p=at0(R(200,310),R(-44,44));addRock(p.x,p.z,R(.6,1.6));}}

// THE GRAVEYARD: Herald transports down in the sand, burned black, their red seams dead; two still have a terminal lit inside
const WRECKS=[];
{const K=SHIPKIT.harrower(),L=(()=>{K.geo.computeBoundingBox();return K.geo.boundingBox.max.z-K.geo.boundingBox.min.z;})(),hm2=fleetHullMat(panelTex),gm2=fleetGlowMat(0x5a1008,1.2);
 for(const [s,lat,len,ry,roll,sink] of[[326,-22,46,.8,.5,.35],[344,20,38,-.6,-.4,.3],[362,-16,52,2.2,.3,.4],[378,14,30,1.2,-.6,.3]]){const p=at0(s,lat),g=new THREE.Group();
   g.add(new THREE.Mesh(K.geo,hm2),new THREE.Mesh(K.glowGeo,gm2));g.scale.setScalar(len/L);g.position.set(p.x,floorAt(p.x,p.z)+len*.05-len*sink*.2,p.z);g.rotation.set(R(-.12,.12),ry,roll);
   g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});scene.add(g);WRECKS.push(g);
   for(let k=-2;k<=2;k++){const q={x:p.x+Math.sin(ry)*k*len*.18,z:p.z+Math.cos(ry)*k*len*.18};OBST.push({x:q.x,z:q.z,r:len*.09,h:len*.2});}}
 const LK=SHIPKIT.lancer();for(const [s,lat,ry] of[[334,4,1],[352,-6,2.5],[370,6,.4]]){const p=at0(s,lat),g=new THREE.Group();g.add(new THREE.Mesh(LK.geo,hm2),new THREE.Mesh(LK.glow,gm2));g.scale.setScalar(.55);
   g.position.set(p.x,floorAt(p.x,p.z)+.8,p.z);g.rotation.set(.3,ry,.4);scene.add(g);OBST.push({x:p.x,z:p.z,r:3,h:2.5});}
 for(const [s,lat,w] of[[330,8,6],[348,-4,6],[366,-2,5],[384,8,5]]){const p=at0(s,lat),n=roadN(s);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.4,.4),w);}}
// the two terminals Thorne pulls the orders from
const TERMS=[at0(338,-11),at0(372,9)].map(p=>{const g=new THREE.Group();g.position.copy(p);scene.add(g);
  const b=new THREE.Mesh(boxUV(1,1.3,.7,2),new THREE.MeshStandardMaterial({map:panelTex,color:C(0x2a1a1a),roughness:.5,metalness:.6}));b.position.y=.65;b.rotation.x=-.2;b.castShadow=true;g.add(b);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.8,.5),new THREE.MeshBasicMaterial({color:C(0xff5a3a).multiplyScalar(1.4),toneMapped:false,transparent:true,opacity:.8}));scr.position.set(0,1.05,.37);scr.rotation.x=-.5;g.add(scr);
  const l=new THREE.PointLight(C(0xff5a3a),.8,8,1.6);l.position.set(0,1.4,.8);g.add(l);return{g,p,scr,done:false};});

// THE CANYON: rock walls (the ground mesh), boulders, a few slabs fallen in from the rim; Dropship Two at the far end, on her side
{for(let k=0;k<22;k++){const s=R(S_CANYON+8,ROAD_LEN-24),h=laneHalf(s),p=at0(s,R(-h+1.5,h-1.5));addRock(p.x,p.z,R(.6,1.7));}
 for(const [s,lat,w] of[[408,-4,5],[426,4,5],[446,-3,5],[468,3,4]]){const p=at0(s,lat),n=roadN(s);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.4,.4),w);}}

/* the merged meshes */
const wreckMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.6,metalness:.45});
{const a=new THREE.Mesh(wm.build(),wreckMat);a.castShadow=a.receiveShadow=true;scene.add(a);
 const b=new THREE.Mesh(sm.build(),oldMat);b.castShadow=b.receiveShadow=true;scene.add(b);scene.add(new THREE.Mesh(sg.build(),goldGlow));}

/* ---------- the white city, far to the north: seamless pale towers on the horizon, no joins, catching the low sun.
   It sits in the sky group's frame (it rides with the camera like the sky), so it always reads as very far away ---------- */
const WHITE=(()=>{const G=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:C(0xf4ece0),roughness:.35,metalness:.15,emissive:C(0x3a2a20),fog:false});
  const R0=2600,dir=new THREE.Vector3(0,0,-1);
  const parts=[[0,520,70],[-120,380,60],[120,420,55],[-230,260,48],[230,300,52],[-60,300,40],[70,340,44],[-330,160,40],[330,190,38],[-180,190,30],[190,220,34]];
  for(const [x0,h0,w0] of parts){const F=1.7,x=x0*F,h=h0*F,w=w0*F;const g=new THREE.CylinderGeometry(w*.18,w,h,7,6);const P=g.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i)/h+.5;P.setX(i,P.getX(i)*(1-.15*Math.sin(y*3)));P.setZ(i,P.getZ(i)*(1-.15*Math.sin(y*3)));}g.computeVertexNormals();
    const t=new THREE.Mesh(g,m);t.position.set(x,h/2-60,-R0);G.add(t);}
  const dome=new THREE.Mesh(new THREE.SphereGeometry(440,32,16,0,Math.PI*2,0,Math.PI/2),m);dome.scale.set(1.6,.5,1);dome.position.set(0,-60,-R0-60);G.add(dome);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xfff0d8).multiplyScalar(.9),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.35,fog:false}));halo.scale.set(2400,1100,1);halo.position.set(0,300,-R0-80);G.add(halo);
  G.visible=false;skyGroup.add(G);return{G,halo};})();

/* ---------- light, dust, haze ---------- */
const helmLamp=new THREE.PointLight(C(0xd8e6ff),0,24,1.5);scene.add(helmLamp);
function updateLights(dt,T,pos){for(const h of HAZ){const f=.75+.25*Math.sin(T*3+h.r*2)+.1*Math.sin(T*11+h.x);h.light.intensity=1.3*f;h.glow.material.opacity=.6+.3*f;}}
const DUST_N=coarse?380:900,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,18),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.14,color:C(0xffc8a0),transparent:true,opacity:.45,depthWrite:false}));scene.add(dust);


let composer=null,HQ=true;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.6,.45,.82));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
try{const q=localStorage.getItem('elyra.quality');if(q)HQ=q!=='low';}catch(_){}
function setQuality(hq){HQ=hq;try{localStorage.setItem('elyra.quality',hq?'high':'low');}catch(_){}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,hq?(coarse?1.6:1.75):(coarse?1.15:1)));renderer.shadowMap.enabled=true;
  renderer.setSize(innerWidth,innerHeight);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);}$('quality').textContent=hq?'Quality: high':'Quality: low';}
$('quality').addEventListener('click',()=>{setQuality(!HQ);$('quality').blur();});
setQuality(HQ);
function renderFrame(){if(composer&&HQ){try{composer.render();return;}catch(e){composer=null;}}renderer.render(scene,camera);}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);if(composer)composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
{const mb=$('menuBtn'),vw=$('views');const set=o=>{vw.classList.toggle('open',o);mb.setAttribute('aria-expanded',o?'true':'false');};
 mb.addEventListener('click',e=>{e.stopPropagation();set(!vw.classList.contains('open'));mb.blur();});
 vw.addEventListener('click',e=>{if(e.target.closest('button,a'))setTimeout(()=>set(false),250);});
 renderer.domElement.addEventListener('pointerdown',()=>set(false));addEventListener('keydown',e=>{if(e.code==='Escape')set(false);});}
function flashScreen(a){const f=$('flash');f.style.transition='none';f.style.opacity=a;requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity=0;});}
// js/origin/03-play.js reaches for these on the Mountain; there is no tunnel below this map
const BLEN=0;function belowD(){return 1;}function belowS(){return 0;}function belowPt(s,o){return(o||new THREE.Vector3());}function belowFloor(){return 0;}
const HOLLOW_GLOW=HOST_GLOW;
setLook('desert');

