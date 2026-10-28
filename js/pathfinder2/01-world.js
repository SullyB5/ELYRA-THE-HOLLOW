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
MODELS.preload(['engineer','chars/keeper-pathfinder','jetpack','rifle','chars/herald-footsoldier','chars/herald-heavy','dropship','harrower','wraith']);
// Oct 25: the loading screen warms up both Herald sides and the walker before Begin (js/origin/03-play.js, js/shared/mech.js)
window.WARM_TEAMS=['red','amber'];window.WARM_MECH=true;window.ENEMY_CAP=26;window.ENEMY_CAP_PHONE=16;
// you are Captain Rhen, not Michael (read by js/origin/03-play.js)
window.PLAYER_KIND='keeper-pathfinder';window.PLAYER_OPTS={};   // Captain Rhen: Bryce's Pathfinder soldier (Oct 25)

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(C(0xb8704e),.0011);scene.background=scene.fog.color;
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,9000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();
const lerp=(a,b,u)=>a+(b-a)*u;

/* ---------- the sky: black, hard stars, a faint band of the galaxy, a thin violet haze low down (the moon has a little air),
   and Astraea, enormous, ochre and red with white weather, lit from one side. The whole sky rides with the camera ---------- */
const skyGroup=new THREE.Group();skyGroup.userData.dyn=1;scene.add(skyGroup);   // (it rides with the camera: never solid to shots, js/shared/solid.js)
const sunDir=new THREE.Vector3(.62,.18,.76).normalize();   // the system's star: low, behind you as you go north
const ASTRAEA_DIR=new THREE.Vector3(-.28,.36,-.89).normalize();   // ahead and high, over the facility
const skyU={sunDir:{value:sunDir},hor:{value:C(0x2a2238)},mid:{value:C(0x120e22)},zen:{value:C(0x020208)},starK:{value:1},sunK:{value:1},uT:{value:0},band:{value:1},photo:{value:null},photoK:{value:0},photoU:{value:.3},photoB:{value:.5},nebK:{value:1}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(4000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,mid,zen;uniform float photoK,photoU,photoB,nebK;uniform sampler2D photo;uniform float starK,sunK,uT,band;
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
    // Astraea's nebula (Oct 24, js/shared/skies.js): over the whole sky, strongest overhead; the look's own glow stays along the horizon
    if(photoK>0.0){vec2 pu=vec2(atan(d.z,d.x)/6.2831853+.5+photoU,asin(clamp(y,-1.0,1.0))/3.1415927+.5);vec3 pc=pow(texture2D(photo,pu).rgb,vec3(2.2))*photoB;pc=pc/(1.0+pc*.8);
      c=mix(c,c*.4+pc,photoK*nebK*smoothstep(-.6,.25,y));}
    float s=max(dot(d,sunDir),0.0);c+=vec3(1.0,.85,.65)*pow(s,900.0)*6.0*sunK+vec3(1.0,.6,.4)*pow(s,24.0)*.12*sunK;
    c=mix(c,mix(hor,hor*.35,smoothstep(-.3,-.75,y)),smoothstep(-.3,-.65,y));   // Oct 24: the photo runs well below the horizon, then fades into the ground haze
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
sky.renderOrder=-3;skyGroup.add(sky);
SKIES.load('astraea',t=>{skyU.photo.value=t;skyU.photoK.value=1;});
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
  skyU.hor.value.copy(C(L.hor));skyU.mid.value.copy(C(L.mid));skyU.zen.value.copy(C(L.zen));skyU.starK.value=L.star;skyU.sunK.value=L.sunK;skyU.band.value=L.band;skyU.nebK.value=L.neb!=null?L.neb:1;
  scene.fog.color.copy(C(L.fog));scene.fog.density=L.dens;scene.background=scene.fog.color;
  keyLight.color.copy(C(L.keyC));keyLight.intensity=L.keyI;hemi.color.copy(C(L.hemiS));hemi.groundColor.copy(C(L.hemiG));hemi.intensity=L.hemiI;keyDir=L.dir.clone();
  astraea.visible=astraeaHalo.visible=!!L.planet;renderer.toneMappingExposure=L.exp;}
sunDir.copy(DESERT_KEY);

/* ---------- the map, south to north along one walk (the "road"): the crash (Rhen's dropship, where Arc 01 ended) → the dead desert
   (a burned convoy, black glass where the ground melted, pale stone fragments) → the basin, where two Herald forces with the same
   uniforms and different insignias are killing each other → the graveyard of Herald transports (two orders) → the canyon, and
   Dropship Two at its end. Units are metres. ---------- */
/* Oct 22: twice the walk. A new stretch of dead ground goes in at 190 m (before the basin: a downed Herald fighter, a field of black
   glass, a standing stone that answers the case), and a longer, winding canyon at 412 m (Dropship Two's scar, more fighting up it).
   SH(s) turns a distance on the old walk into the same place on this one, so everything placed before keeps its spot. */
/* Oct 25 (Bryce): the graveyard is 2.6 times as long (and wider), with a broken transport at its end you walk through the middle of;
   and the canyon is now the way DOWN a mountain: Dropship Two lies at the bottom of a basin, 110 m under the desert, and the walk
   from the canyon's mouth is a ledge down the mountain's flank, the rock wall on your left, the drop to the basin on your right.
   SH() still turns a distance on the oldest walk into the same place on this one (the graveyard's places are spread to its new length). */
/* Oct 25 (Bryce: start with a rover found near the crash, drive it through two or three Herald settlements, then the walker at the
   canyon's mouth): a new stretch goes in where the dead ground ends (345 m, past the standing stone and the glass), before the basin.
   It winds north 760 m through three Herald settlements (S_SETS below). Everything north of it moved 760 m north with it (OZ), and
   SH() adds its length DV to every distance past 190 m on the oldest walk, so all of it keeps its place along the walk. */
/* Oct 26 (Bryce, from the blueprint he signed off): the whole route reshaped.
     the start: you come to at the crash facing WEST; the dead ground runs west from the wreck, round a long right-hand bend, and north
       into the drive (still 344.9 m, so every place on it keeps its distance: the stone, the glass, the hollow)
     the drive: north into the outpost, a wide swing EAST (a dry gully cuts across it: SHORTS), north through the red village, then a
       long swing out WEST, the burning town on a straight running north-west, and back to the right, still heading north-north-west
     the graveyard: the road bulges east round the wrecks; the shortcut drives straight through the broken transport (SHORTS)
     the pit: past the canyon mouth the path turns left onto the south lip of a crater 150 m across and 190 m deep and winds 1.2 turns
       down its wall, rock on your left, the drop on your right; Dropship Two lies at the bottom, in the middle (PIT)
   Everything north of the drive is the old map moved with it (OX, OZ), so its places keep their distances along the walk. */
const fillet=(pts,c0)=>{const o=[pts[0]];for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(b[0]-a[0],b[1]-a[1]),lc=Math.hypot(c[0]-b[0],c[1]-b[1]),k=Math.min(c0,la*.4,lc*.4);
  const p=[b[0]+(a[0]-b[0])/la*k,b[1]+(a[1]-b[1])/la*k],q=[b[0]+(c[0]-b[0])/lc*k,b[1]+(c[1]-b[1])/lc*k];for(let j=0;j<=6;j++){const u=j/6,v=1-u;o.push([v*v*p[0]+2*v*u*b[0]+u*u*q[0],v*v*p[1]+2*v*u*b[1]+u*u*q[1]]);}}
  o.push(pts[pts.length-1]);return o;};
const D0=[[0,0],[-40,-2],[-85,2],[-120,-6],...Array.from({length:8},(_,k)=>{const a=(k+1)/8*Math.PI/2;return[-120-90*Math.sin(a),-96+90*Math.cos(a)];})];
const A0=(()=>{let l=0;for(let i=1;i<D0.length;i++)l+=Math.hypot(D0[i][0]-D0[i-1][0],D0[i][1]-D0[i-1][1]);const e=D0[D0.length-1];return[e[0],e[1]-(344.9-l)];})();
const SHF=[A0[0]-4.64,A0[1]+333.42];
const DRV_RAW=[[24,-410],[40,-570],[130,-630],[150,-710],[90,-790],[62,-1010],[20,-1060],[-60,-1110],[-130,-1140],[-190,-1180],[-310,-1310],[-350,-1395]].map(([x,z])=>[x+SHF[0],z+SHF[1]]);
const DRV_P=fillet([A0,...DRV_RAW],26).slice(1);
const DE=DRV_RAW[DRV_RAW.length-1],OX=DE[0]-4.64,OZ=DE[1]+333.42;
const DV=(()=>{let l=0,a=A0;for(const b of DRV_P){l+=Math.hypot(b[0]-a[0],b[1]-a[1]);a=b;}return l;})();
const DD=154.87,DC=212.6;let GK=2.6,GX=(392-318)*(GK-1);   // GK: the graveyard's stretch, set from its real length below
function SH(s){return s<190?s:(s<318?s+DD:s<392?318+DD+(s-318)*GK:s<412?s+DD+GX:s+DD+DC+GX)+DV;}
// the graveyard's eastward bulge, the canyon mouth (MOUTH), the canyon, then a left quarter turn onto the pit's south lip
const TAIL=fillet([[4.64,-333.42],[-22,-382],[-12,-442],[30,-490],[95,-535],[100,-590],[45,-625],[0.28,-641.9],[6,-680]],22).slice(1).map(([x,z])=>[x+OX,z+OZ]);
const MOUTH=[0.28+OX,-641.9+OZ];
const P_ARC=(()=>{const c=[6+OX-25,-680+OZ],o=[];for(let k=1;k<=8;k++){const a=k/8*Math.PI/2;o.push([c[0]+25*Math.cos(a),c[1]-25*Math.sin(a)]);}return o;})();
const PIT_R0=150,PIT_R1=45,PIT_PH=1.2*Math.PI*2,DEPTH=190,SPN=120;
const PIT=(()=>{const s0=P_ARC[P_ARC.length-1];return{x:s0[0],z:s0[1]-PIT_R0};})();
const P_SPIRAL=Array.from({length:SPN},(_,k)=>{const f=(k+1)/SPN,ph=f*PIT_PH,r=PIT_R0-(PIT_R0-PIT_R1)*f;return[PIT.x-r*Math.sin(ph),PIT.z+r*Math.cos(ph)];});
const LZ={x:0,z:-4,r:30},DS2={x:PIT.x,z:PIT.z,r:36};
const ROAD=[...D0,A0,...DRV_P,...TAIL,...P_ARC,...P_SPIRAL];
const PIT_I0=ROAD.length-1-SPN;   // the road's vertex on the pit's south lip
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const ROADS=[],ROAD_LEN=(()=>{let s=0;for(let i=0;i<ROAD.length-1;i++){const [ax,az]=ROAD[i],[bx,bz]=ROAD[i+1],l=Math.hypot(bx-ax,bz-az);ROADS.push({ax,az,bx,bz,l,s0:s,nx:-(bz-az)/l,nz:(bx-ax)/l});s+=l;}return s;})();
// (Oct 26) the graveyard's stretch from its real length on the bulging road; the pit's distances by angle (for its walls)
{const q=(x,z)=>{let best=1e9,bs=0;for(const r of ROADS){const dx=r.bx-r.ax,dz=r.bz-r.az,t=clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.l*r.l),0,1),d=Math.hypot(x-r.ax-dx*t,z-r.az-dz*t);if(d<best){best=d;bs=r.s0+t*r.l;}}return bs;};
 GK=(q(MOUTH[0],MOUTH[1])-(318+DD+DV))/74;GX=(392-318)*(GK-1);}
const PIT_S=Array.from({length:SPN+1},(_,k)=>PIT_I0+k<ROADS.length?ROADS[PIT_I0+k].s0:ROAD_LEN);
function pitRing(ph){const f=clamp(ph/PIT_PH,0,1),kf=f*SPN,i=Math.min(SPN-1,Math.floor(kf));return{r:PIT_R0-(PIT_R0-PIT_R1)*f,s:PIT_S[i]+(PIT_S[i+1]-PIT_S[i])*(kf-i)};}
function pitDist(x,z){return Math.hypot(x-PIT.x,z-PIT.z);}
/* (Oct 26) the road has ~330 pieces now (curves, the spiral), and the nearest-piece search runs for every body every frame: a grid of
   40 m cells finds the pieces near a point; past 200 m from any, a coarse copy of the road (every 6th piece) answers well enough */
const RG_C=40,RG=new Map(),RG_STAMP=new Int32Array(ROADS.length);let RG_T=0;
ROADS.forEach((r,i)=>{const x0=Math.floor(Math.min(r.ax,r.bx)/RG_C),x1=Math.floor(Math.max(r.ax,r.bx)/RG_C),z0=Math.floor(Math.min(r.az,r.bz)/RG_C),z1=Math.floor(Math.max(r.az,r.bz)/RG_C);
  for(let cx=x0;cx<=x1;cx++)for(let cz=z0;cz<=z1;cz++){const k=cx*100003+cz;let a=RG.get(k);if(!a)RG.set(k,a=[]);a.push(i);}});
const ROADS_C=(()=>{const o=[];for(let i=0;i<ROADS.length;i+=6){const j=Math.min(ROADS.length-1,i+5),a=ROADS[i],b=ROADS[j],l=Math.hypot(b.bx-a.ax,b.bz-a.az)||1;o.push({ax:a.ax,az:a.az,bx:b.bx,bz:b.bz,l,s0:a.s0,sl:b.s0+b.l-a.s0,i0:i,i1:j});}return o;})();
function _segT(r,x,z){const dx=r.bx-r.ax,dz=r.bz-r.az;return clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.l*r.l),0,1);}
function roadSeg(x,z){let best=1e9,bs=0,bt=0,br=null;const cx=Math.floor(x/RG_C),cz=Math.floor(z/RG_C);RG_T++;
  for(let ring=0;ring<=5;ring++){if(ring>0&&best<=(ring-1)*RG_C)break;
    for(let dx=-ring;dx<=ring;dx++)for(let dz=-ring;dz<=ring;dz++){if(Math.max(Math.abs(dx),Math.abs(dz))!==ring)continue;const a=RG.get((cx+dx)*100003+cz+dz);if(!a)continue;
      for(const i of a){if(RG_STAMP[i]===RG_T)continue;RG_STAMP[i]=RG_T;const r=ROADS[i],t=_segT(r,x,z),d=Math.hypot(x-r.ax-(r.bx-r.ax)*t,z-r.az-(r.bz-r.az)*t);if(d<best){best=d;bs=r.s0+t*r.l;bt=t;br=r;}}}}
  if(!br){let bc=null,bct=0;for(const c of ROADS_C){const t=_segT(c,x,z),d=Math.hypot(x-c.ax-(c.bx-c.ax)*t,z-c.az-(c.bz-c.az)*t);if(d<best){best=d;bc=c;bct=t;}}
    const i=Math.min(bc.i1,bc.i0+Math.floor(bct*(bc.i1-bc.i0+1)));br=ROADS[i];bt=_segT(br,x,z);bs=br.s0+bt*br.l;best=Math.hypot(x-br.ax-(br.bx-br.ax)*bt,z-br.az-(br.bz-br.az)*bt);}
  return{s:bs,r:br,t:bt,d:best};}
function roadS(x,z){const q=roadSeg(x,z);let bs=q.s;   // (Oct 26: past the ends by distance, not by z: the road runs west and winds now)
  if(q.r===ROADS[0]&&q.t<=0)bs=-q.d;else if(q.r===ROADS[ROADS.length-1]&&q.t>=1)bs=ROAD_LEN+q.d;return bs;}
const _rp=new THREE.Vector3();
function roadIdx(s){let lo=0,hi=ROADS.length-1;while(lo<hi){const m=(lo+hi)>>1;if(ROADS[m].s0+ROADS[m].l<s)lo=m+1;else hi=m;}return lo;}
function roadPt(s,out){s=clamp(s,0,ROAD_LEN);out=out||_rp;const r=ROADS[roadIdx(s)],t=clamp((s-r.s0)/r.l,0,1);return out.set(r.ax+(r.bx-r.ax)*t,0,r.az+(r.bz-r.az)*t);}
function roadN(s){let nx=0,nz=0;const c=roadIdx(clamp(s,0,ROAD_LEN));for(let i=Math.max(0,c-12);i<=Math.min(ROADS.length-1,c+12);i++){const r=ROADS[i],k=clamp(1-Math.max(0,Math.max(r.s0-s,s-(r.s0+r.l)))/10,0,1);nx+=r.nx*k;nz+=r.nz*k;}const l=Math.hypot(nx,nz)||1;return{x:nx/l,z:nz/l};}
function latOf(x,z){const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t;return(x-px)*r.nx+(z-pz)*r.nz;}
const SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0;
function laneC(s){return 0;}
function spineAt(s){return false;}
// the stretches, by distance along the walk
const S_DESERT=46,S_BASIN=SH(196),S_GRAVE=SH(318),S_CANYON=SH(392);let S_STONE=300;   // (S_STONE moves past the outpost below)
// the drive (Oct 25): from the end of the dead ground to the basin; three Herald settlements along it, one after another
const S_DRV0=344.9,S_DRV1=S_DRV0+DV;
// (Oct 26) each settlement on its own straight of the new road: the outpost north of the bend, the village on the run north after the
// east swing, the burning town on the north-west straight
const S_SETS=(()=>{const c=(a,b)=>{const q=roadSeg((a[0]+b[0])/2,(a[1]+b[1])/2);return q.s;},R_=DRV_RAW;
  const so=c(R_[0],R_[1]),sv=c(R_[4],R_[5]),sb=c(R_[9],R_[10]);
  return[{id:'outpost',s0:so-62,s1:so+62,team:'amber'},{id:'village',s0:sv-86,s1:sv+86,team:'red'},{id:'burning',s0:sb-64,s1:sb+64,team:'both'}];})();
function setAt(s){for(const S of S_SETS)if(s>S.s0-20&&s<S.s1+20)return S;return null;}
/* Oct 26 (Bryce: the first standing stone came at about a minute in; push it to two or three): it stands just past the outpost's north
   gate now, before the road and the gully part, so both ways pass it. The fight through the outpost comes first */
S_STONE=S_SETS[0].s1+32;   // (Oct 27, Bryce: a little further from the outpost's gate; the gully below starts past it, so both ways still pass it)
// the descent: from just past the canyon's mouth to the bottom, a smooth fall of DEPTH metres (steepest, about 22 degrees, half way)
const S_DESC0=PIT_S[0],S_DESC1=ROAD_LEN-26;   // (Oct 26) the descent starts on the pit's lip
function pathY(s){return -DEPTH*sstep(S_DESC0,S_DESC1,s);}
function zoneOf(s){return s<S_DESERT?'crash':s<S_DRV0?'desert':s<S_BASIN?'drive':s<S_GRAVE?'basin':s<S_CANYON?'grave':'canyon';}
function laneHalf(s){
  if(s<S_DESERT)return lerp(30,22,sstep(S_DESERT-14,S_DESERT,s));
  // the drive: a wide track; wider again through each settlement (its buildings stand inside the walk, along the street)
  if(s>S_DRV0-20&&s<S_BASIN-14){let h=22+4*Math.sin(s*.05);for(const S of S_SETS)h=lerp(h,44,sstep(S.s0-24,S.s0,s)*(1-sstep(S.s1,S.s1+24,s)));return h;}
  if(s<S_BASIN-14)return 22+4*Math.sin(s*.05);
  if(s<S_GRAVE-10)return lerp(22,46,sstep(S_BASIN-14,S_BASIN+14,s))*(1-sstep(S_GRAVE-30,S_GRAVE-10,s))+28*sstep(S_GRAVE-30,S_GRAVE-10,s);
  if(s<S_CANYON-30)return lerp(28,36,sstep(S_GRAVE-10,S_GRAVE+20,s));   // the graveyard: wider too (Oct 26: 36, round the bulge)
  if(s<S_CANYON-6)return lerp(36,14,sstep(S_CANYON-30,S_CANYON-6,s));
  return lerp(14,11.5,sstep(S_CANYON-6,S_CANYON+14,s))+1.5*Math.sin(s*.13);}
const BARRIERS=[];
function barrier(id){return null;}
function inDS2(x,z,m){return Math.hypot(x-DS2.x,z-DS2.z)<DS2.r+(m||0);}
/* side areas (Oct 22): the walk isn't one straight line any more. Places off to the side you can go into or pass by, each a short
   way in (a capsule, r wide) and a round space at the end (R). The ground outside them rises like everywhere else, so in the dunes
   they're hollows and in the canyon they're ravines cut into the rock.
     hollow:  off the dead ground at 236 m, east: where a Herald fighter came down; red survivors dug in round it
     ravine:  off the canyon, west: a dead Herald, his data slate, supplies, and whoever's sheltering in there */
function sidePt(s,lat){const p=roadPt(clamp(s,0,ROAD_LEN)).clone(),n=roadN(clamp(s,0,ROAD_LEN));return{x:p.x+n.x*lat,z:p.z+n.z*lat};}
const SIDES=[{id:'hollow',s:236,lat0:16,lat1:44,r:7,R:15},{id:'ravine',s:S_CANYON+150,lat0:-6,lat1:-34,r:4.2,R:9}].map(o=>{const a=sidePt(o.s,o.lat0),b=sidePt(o.s,o.lat1),e=sidePt(o.s,o.lat1+Math.sign(o.lat1)*(o.R-2));
  return Object.assign(o,{ax:a.x,az:a.z,bx:b.x,bz:b.z,cx:e.x,cz:e.z});});
function sideD(x,z){let d=1e9;for(const o of SIDES)d=Math.min(d,segDist(x,z,o.ax,o.az,o.bx,o.bz)-o.r,Math.hypot(x-o.cx,z-o.cz)-o.R);return d;}
function sideOf(x,z){for(const o of SIDES)if(Math.min(segDist(x,z,o.ax,o.az,o.bx,o.bz)-o.r,Math.hypot(x-o.cx,z-o.cz)-o.R)<.5)return o;return null;}
/* the shortcuts (Oct 26): straight cuts the road bends round, each a capsule you can walk or drive.
     gully: from the outpost's north gate across the east swing to the run into the red village; sunk two metres, narrow, an ambush in it
     hull:  across the graveyard's bulge, through the gap in the broken transport (THE BREAK, below) */
const SHORTS=(()=>{const P=s=>roadPt(s).clone();const g0=P(S_SETS[0].s1+46),g1=P(S_SETS[1].s0-34),h0=P(S_GRAVE+16),h1=P(S_CANYON-16);
  return[{id:'gully',ax:g0.x,az:g0.z,bx:g1.x,bz:g1.z,r:6.5,dip:2.6},{id:'hull',ax:h0.x,az:h0.z,bx:h1.x,bz:h1.z,r:7.5,dip:0}].map(o=>Object.assign(o,{l:Math.hypot(o.bx-o.ax,o.bz-o.az)}));})();
function shortD(x,z){let d=1e9;for(const o of SHORTS)d=Math.min(d,segDist(x,z,o.ax,o.az,o.bx,o.bz)-o.r);return d;}
function shortOf(x,z){for(const o of SHORTS)if(segDist(x,z,o.ax,o.az,o.bx,o.bz)<o.r+.5)return o;return null;}
// distance outside the walkable area (negative inside)
function playD(x,z){
  let d=Math.hypot(x-LZ.x,z-LZ.z)-LZ.r;
  const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t,lat=(x-px)*r.nx+(z-pz)*r.nz,along=Math.abs((x-px)*r.nz-(z-pz)*r.nx);
  const dl=Math.abs(lat)-laneHalf(q.s);d=Math.min(d,Math.hypot(Math.max(0,dl),along)+Math.min(0,dl));
  d=Math.min(d,Math.hypot(x-DS2.x,z-DS2.z)-DS2.r,sideD(x,z),shortD(x,z));
  for(const B of BLOCKS)d=Math.max(d,B.r-Math.hypot(x-B.x,z-B.z));
  return d;}
const BLOCKS=[];
// the floor: soft dunes under your feet (small, so the fight stays readable); down the mountain it falls with the path
function floorAt0(x,z){let b=0;if(pitDist(x,z)<PIT_R0+70)b=inDS2(x,z,0)?-DEPTH:pathY(roadS(x,z));
  const g=SHORTS[0],dx=g.bx-g.ax,dz=g.bz-g.az,u=((x-g.ax)*dx+(z-g.az)*dz)/(g.l*g.l);   // the gully's floor, sunk in the middle of its run
  if(u>0&&u<1){const dd=segDist(x,z,g.ax,g.az,g.bx,g.bz);if(dd<g.r+9)b-=g.dip*sstep(g.r+9,g.r-2,dd)*sstep(0,.14,u)*sstep(1,.86,u);}
  return .45*fbm(x*.03+7,z*.03-3)-.2+b;}
// outside the walk: dunes rising away from it; in the canyon, sheer rock to a flat rim 15 m up (riflemen stand on it), then the plateau
const CLIFF=15;
function rimY(x,z,d){return CLIFF+.6*vnoise(x*.2,z*.2)+Math.min(Math.max(0,d-9)*.35,9)+ridged(x*.01,z*.01)*6*sstep(9,40,d);}   // the plateau levels off, so the far horizon (and the white city) shows over it
function duneY(x,z,d){return floorAt0(x,z)+Math.min(d*.55,7)+Math.max(0,d-12)*.18+9*fbm(x*.008+2,z*.008)*sstep(10,60,d)+ridged(x*.004,z*.004)*60*sstep(120,380,d);}
/* the pit (Oct 26): the crater's wall is cut by the one ledge winding down it. At any point in it the ledge passes at most twice at that
   angle (the spiral makes 1.2 turns): the ground falls from the ledge outside it (a low lip, then sheer) and climbs from the ledge
   inside it (sheer rock), meeting between; outside the top ring it climbs to the plateau, inside the last one it falls to the floor */
function pitY(x,z,r){let th=Math.atan2(-(x-PIT.x),z-PIT.z);if(th<0)th+=Math.PI*2;
  let ro=1e9,yo=0,wo=12,ri=-1,yi=0,wi=12;
  for(let k=0;k<3;k++){const ph=th+k*Math.PI*2;if(ph>PIT_PH)break;const q=pitRing(ph),y=pathY(q.s),w=laneHalf(q.s);
    if(q.r>=r){if(q.r<ro){ro=q.r;yo=y;wo=w;}}else if(q.r>ri){ri=q.r;yi=y;wi=w;}}
  const top=CLIFF+.6*vnoise(x*.2,z*.2)+Math.min(Math.max(0,r-PIT_R0-20)*.35,9)+ridged(x*.01,z*.01)*6*sstep(9,40,r-PIT_R0-12);
  const floor=-DEPTH-3+2.4*fbm(x*.02+3,z*.02);
  const dd=ro-wo-r,lip=ro<1e9?(dd<2.5?yo+Math.max(0,dd)*.5:yo+1.25-(dd-2.5)*3.6+.8*vnoise(x*.15,z*.15)):1e9;
  const up=ri>=0?yi+Math.max(0,r-ri-wi)*2.9+.7*vnoise(x*.2,z*.2)+ridged(x*.03,z*.03)*3*sstep(2,10,r-ri-wi):-1e9;
  const h=ri<0?lip:(ro>=1e9?up:Math.min(lip,up));
  const H=Math.max(floor,Math.min(h,top));
  /* the breach (Oct 26, Bryce: at Dropship Two, open the walls so you see scenery, not walls all around): the crater's north wall is
     gone, cut down to the floor in a wide gorge that runs out to a low plain. The ledge crosses the gap on a bridge of the old pale stone
     (BREACH_BRIDGE, below), so from the bottom you look out under it */
  const w=breachW(th);if(w<=0)return H;
  const b=floor+Math.max(0,r-PIT_R0)*.01;
  return lerp(H,Math.min(H,b),w);}
// how far into the breach an angle round the pit is (1 in the middle of the gap, 0 outside it; th as pitY measures it, pi = north)
const BREACH={th:Math.PI,half:.48,soft:.12};
function breachW(th){let d=Math.abs(((th-BREACH.th)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI);return sstep(BREACH.half+BREACH.soft,BREACH.half,d);}
// outside the crater, past the breach: the gorge widening onto a low plain, mesas standing far off
function breachY(x,z,pr){let th=Math.atan2(-(x-PIT.x),z-PIT.z);if(th<0)th+=Math.PI*2;const d=pr-PIT_R0;
  const wide=sstep(0,500,d)*.55,dth=Math.abs(((th-BREACH.th)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI),w=sstep(BREACH.half+BREACH.soft+wide,BREACH.half+wide,dth);
  const plain=-DEPTH-3+2.4*fbm(x*.02+3,z*.02)+d*.012+sstep(500,1300,d)*(30+150*Math.max(0,ridged(x*.004,z*.004)-.35));
  return{w,y:plain};}
/* (Oct 26, Bryce: make the side walls go down with the path, more open) the crater is a wide open bowl now: past the outer turn of the
   ledge the rock stands only ~4 m over the path beside it, then climbs gently back to the desert by OPEN_R. Near the seam (due south,
   where the first turn passes over the last) it fades back to the old wall, so the canyon road arrives between its own walls */
const OPEN_R=520;
function groundY(x,z){const y=groundY0(x,z);const pr=pitDist(x,z);if(pr>=OPEN_R||pr<PIT_R1)return y;
  let th=Math.atan2(-(x-PIT.x),z-PIT.z);if(th<0)th+=Math.PI*2;
  const f=sstep(.1,.6,th)*(1-sstep(Math.PI*2-1.2,Math.PI*2-.15,th));if(f<=0)return y;
  const q=pitRing(th);if(pr<q.r)return y;
  const base=pathY(q.s)+4+.6*vnoise(x*.2,z*.2),bowl=lerp(base,y,sstep(q.r+laneHalf(q.s)+3,OPEN_R,pr));
  return lerp(y,Math.min(y,bowl),f);}
/* the ground MESH only: across the breach the ledge is carried by BREACH_BRIDGE, so the heightfield drops to the gorge floor under
   it (a heightfield can't make an arch; without this the lane stood on a thin rock fin that walled the gap). groundY, which feet and
   wheels stand on, still keeps the lane's height there */
function meshY(x,z){const y=groundY(x,z),pr=pitDist(x,z);if(pr>=PIT_R0+75||playD(x,z)>0)return y;
  let th=Math.atan2(-(x-PIT.x),z-PIT.z);if(th<0)th+=Math.PI*2;const w=breachW(th);if(w<=0)return y;
  return lerp(y,Math.min(y,pitY(x,z,pr)),w);}
function groundY0(x,z){
  const d=playD(x,z);
  if(d<=0)return floorAt0(x,z);
  const pr=pitDist(x,z);if(pr<PIT_R0+75)return pitY(x,z,pr);
  if(pr<2200&&z<PIT.z){const B=breachY(x,z,pr);if(B.w>0){const s0=roadS(x,z),zn0=zoneOf(clamp(s0,0,ROAD_LEN));const n=zn0==='canyon'?lerp(floorAt0(x,z),rimY(x,z,d),sstep(.2,1.6,d)):duneY(x,z,d);return lerp(n,Math.min(n,B.y),B.w);}}
  const s=roadS(x,z),zn=zoneOf(clamp(s,0,ROAD_LEN));
  if(zn==='canyon'){const k=sstep(.2,1.6,d);return lerp(floorAt0(x,z),rimY(x,z,d),k);}
  const g=SHORTS[0],gd=segDist(x,z,g.ax,g.az,g.bx,g.bz)-g.r;   // (Oct 26) the gully's banks: steep broken rock, not soft dune
  if(gd<16)return Math.max(duneY(x,z,d),floorAt0(x,z)+Math.min(Math.max(0,gd)*1.5,7.5)+.8*vnoise(x*.3,z*.3)*sstep(0,3,gd));
  return duneY(x,z,d);}
/* Oct 27 (Bryce: in the debris field a lot of things are floating, the terminal too): the pit's open bowl (OPEN_R, Oct 26) lowers the
   ground for 520 m round the crater, the graveyard's floor with it, but everything there was set on the floor from before the bowl
   (floorAt0), up to 20 m over the sand you walk on. floorAt is now the ground you actually stand on (groundY), so wrecks, walls,
   rocks, the terminals and the rest sit on it; the terrain's own maths keeps floorAt0. */
function floorAt(x,z){return groundY(x,z);}
function ceilAt(){return 1e4;}
function camClamp(head){const c=camera.position;
  // down the mountain: keep the over-the-shoulder camera out of the rock wall (pull it in toward you)
  if(pitDist(c.x,c.z)<PIT_R0+80){let k=1;const c0=c.clone();while(k>.15&&groundY(c.x,c.z)>c.y-.3){k-=.08;c.lerpVectors(head,c0,k);}}
  const g=groundY(c.x,c.z)+.4;if(c.y<g)c.y=g;
  // (Oct 26) under the gully's roof and the gatehouse arch, the camera stays under them
  for(const Rf of GULLY_ROOFS){if(head.y>Rf.y0)continue;rectL(Rf,c.x,c.z,_rlc);if(Math.abs(_rlc.x)<Rf.hw+1.5&&Math.abs(_rlc.z)<Rf.hd+1.5&&c.y>Rf.y0-.35)c.y=Math.max(head.y,Rf.y0-.35);}}
const _rlc={x:0,z:0};

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
// the open ground (Oct 22 polish): sand laid twice at two scales, one turned, so it never tiles; patches of pebbles and darker soil in
// broad drifts; wind ripples across the sand; rock on the slopes; the photo normal maps for real grain under the light; and out past
// a hundred metres it settles into the plain tint, so no repeat shows on the far ground. opts: desat (moon), ripple (dunes), boost
function groundTerrainMat(o){o=o||{};const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0});
  const U={tS:{value:TX.sand},tP:{value:TX.peb},tO:{value:TX.soil},tR:{value:TX.rock},tSN:{value:ldTex('sand-n')},tPN:{value:ldTex('pebbles-n')}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader=`uniform sampler2D tS,tP,tO,tR,tSN,tPN;varying vec3 vWP;varying vec3 vWN;
      vec3 dec(vec4 c){return pow(c.rgb,vec3(2.2));}
      float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
      float fb(vec2 p){return vn(p)*.55+vn(p*2.03+1.7)*.3+vn(p*4.1+3.1)*.15;}
      const mat2 ROT=mat2(.8,-.6,.6,.8);
      `+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 nW=normalize(vWN);vec3 bw=pow(abs(nW),vec3(4.0));bw/=(bw.x+bw.y+bw.z);
      vec2 p=vWP.xz;float flatK=smoothstep(.5,.86,nW.y);
      float m1=fb(p*.018),m2=fb(p*.07+9.1),m3=fb(p*.4+2.3);
      vec3 sA=dec(texture2D(tS,p*.11)),sB=dec(texture2D(tS,ROT*p*.043+.37));vec3 sand=mix(sA,sB,.4+.25*(m2-.5));
      vec3 peb=dec(texture2D(tP,ROT*p*.16+.2)),soil=dec(texture2D(tO,p*.09+.6));
      float pm=smoothstep(.6,.72,m1)*(.6+.4*m3),sm=smoothstep(.42,.26,m2);
      vec3 floorC=mix(mix(sand,soil*.9,sm*.55),peb,pm*.75);
      ${o.ripple?`float rip=.5+.5*sin(dot(p,vec2(.86,.5))*2.6+m2*9.0+m3*2.0);floorC*=.9+.16*rip*(1.0-pm)*flatK;`:''}
      vec3 rockC=dec(texture2D(tR,vWP.zy*.05))*bw.x+dec(texture2D(tR,p*.05))*bw.y+dec(texture2D(tR,vWP.xy*.05))*bw.z;
      vec3 tc=mix(rockC,floorC,flatK)*(.82+.36*m1)*(.94+.12*m3);
      ${o.desat?`tc=mix(tc,vec3(dot(tc,vec3(.3,.5,.2))),${o.desat.toFixed(2)});`:''}
      float far=smoothstep(90.0,380.0,length(vWP-cameraPosition));
      vec3 near=tc*diffuseColor.rgb*${(o.boost||2.4).toFixed(2)};
      diffuseColor.rgb=mix(near,diffuseColor.rgb*${((o.boost||2.4)*.42).toFixed(2)}*(.85+.3*m1),far*.85);`).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      {vec2 q=vWP.xz;float fk=smoothstep(.5,.86,normalize(vWN).y)*(1.0-smoothstep(40.0,160.0,length(vWP-cameraPosition)));
       vec3 a=texture2D(tSN,q*.11).xyz*2.-1.,b=texture2D(tSN,ROT*q*.043+.37).xyz*2.-1.,c=texture2D(tPN,ROT*q*.16+.2).xyz*2.-1.;
       float pk=smoothstep(.6,.72,fb(q*.018));vec2 d=mix((a.xy+b.xy)*.5,c.xy,pk*.75)*${(o.bump||.9).toFixed(2)}*fk;
       vec3 wn=normalize(normalize(vWN)+vec3(d.x,0.0,-d.y));normal=normalize((viewMatrix*vec4(wn,0.0)).xyz);}`);};
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
/* the ground mesh (Oct 26): rows run east-west as before, but each row's fine band now follows the road, which wanders 600 m west on
   its way north (and is a whole crater wide at the pit). BAND gives each row's centre and half-width (wider where the road runs across
   the row), smoothed so neighbouring rows shear gently; past the band the columns open out to the horizon. Same column count per row. */
{const steps=(a,b,fine,lo,hi,cs)=>{const o=[];let v=a;while(v<b){o.push(v);v+=(v>=lo&&v<hi)?fine:cs;}o.push(b);return o;};
 let zN=1e9;for(const [,z] of ROAD)zN=Math.min(zN,z);zN=Math.min(zN,PIT.z-PIT_R0-90);
 const BIN=10,Z0=zN-60,Z1=70,NB=Math.ceil((Z1-Z0)/BIN)+1,mn=new Array(NB).fill(1e9),mx=new Array(NB).fill(-1e9);
 const mark=(x,z)=>{const i=Math.round((z-Z0)/BIN);if(i>=0&&i<NB){mn[i]=Math.min(mn[i],x);mx[i]=Math.max(mx[i],x);}};
 for(const r of ROADS)for(let u=0;u<=r.l;u+=2)mark(r.ax+(r.bx-r.ax)*u/r.l,r.az+(r.bz-r.az)*u/r.l);
 for(const o of SHORTS)for(let u=0;u<=1;u+=.02)mark(o.ax+(o.bx-o.ax)*u,o.az+(o.bz-o.az)*u);
 for(let a2=0;a2<6.29;a2+=.05)for(const rr of[PIT_R0+40,PIT_R0])mark(PIT.x+rr*Math.cos(a2),PIT.z+rr*Math.sin(a2));
 for(const o of SIDES)mark(o.cx,o.cz);
 const CX=[],HW=[];for(let i=0;i<NB;i++){let lo=1e9,hi=-1e9;for(let j=i-6;j<=i+6;j++){const k=clamp(j,0,NB-1);if(mn[k]<1e9){lo=Math.min(lo,mn[k]);hi=Math.max(hi,mx[k]);}}
   if(lo>hi){lo=-10;hi=10;}CX.push((lo+hi)/2);HW.push(Math.max(120,(hi-lo)/2+90));}
 const sm=a=>a.map((_,i)=>{let s=0,n=0;for(let j=i-4;j<=i+4;j++){const k=clamp(j,0,NB-1);s+=a[k];n++;}return s/n;});
 const CXs=sm(CX),HWs=sm(HW);const band=z=>{const f=clamp((z-Z0)/BIN,0,NB-1),i=Math.min(NB-2,Math.floor(f)),u=f-i;return[lerp(CXs[i],CXs[i+1],u),lerp(HWs[i],HWs[i+1],u)];};
 const NF=coarse?130:190,NC=coarse?46:64,OUT=1300;
 const zs=steps(zN-700,500,coarse?2.4:1.7,zN-40,70,coarse?18:12);
 // the drive is driven, not walked: its rows a little further apart
 {const a3=[];let last=-1e9;const zA=A0[1]-10,zB=DE[1]+10;for(const z of zs){if(z<zA&&z>zB&&z-last<(coarse?3.4:2.8))continue;a3.push(z);last=z;}zs.length=0;zs.push(...a3);}
 const NX=NC*2+NF+1,rowX=new Float32Array(NX);
 const fillRow=z=>{const [c,h]=band(z);let i=0;for(let k=0;k<NC;k++)rowX[i++]=c-h-OUT*Math.pow((NC-k)/NC,1.6);for(let k=0;k<=NF;k++)rowX[i++]=c-h+2*h*k/NF;for(let k=1;k<=NC;k++)rowX[i++]=c+h+OUT*Math.pow(k/NC,1.6);};
 const NZ=zs.length,pos=new Float32Array(NX*NZ*3),col=new Float32Array(NX*NZ*3),sand=C(0xc87a50),rust=C(0x8a3a24),rock=C(0x6a3428),tmp=new THREE.Color();
 for(let j=0;j<NZ;j++){fillRow(zs[j]);for(let i=0;i<NX;i++){const x=rowX[i],z=zs[j],k=(j*NX+i)*3,y=meshY(x,z);pos[k]=x;pos[k+1]=y;pos[k+2]=z;
   const n=vnoise(x*.04,z*.04),fl=floorAt0(x,z),cliff=Math.max(clamp((y-fl)/CLIFF,0,1)*(zoneOf(clamp(roadS(x,z),0,ROAD_LEN))==='canyon'?1:.25),pitDist(x,z)<PIT_R0+75?clamp((fl-y-3)/20,0,1)*.8:0);
   tmp.copy(sand).lerp(rust,n*.7).lerp(rock,cliff*.85).multiplyScalar(.8+.35*vnoise(x*.25,z*.25));col[k]=tmp.r;col[k+1]=tmp.g;col[k+2]=tmp.b;}}
 const idx=new Uint32Array((NX-1)*(NZ-1)*6);let q=0;
 for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const p=j*NX+i,r=p+1,c=p+NX,d=c+1;idx[q++]=p;idx[q++]=c;idx[q++]=r;idx[q++]=r;idx[q++]=c;idx[q++]=d;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
 const m=new THREE.Mesh(g,groundTerrainMat({ripple:true,boost:2.4,bump:.75,desat:.18}));m.receiveShadow=true;scene.add(m);}

/* ---------- obstacles: circles for collision, cover and line of sight (OBST); long ones also in BARS ---------- */
const OBST=[],BARS=[];
const K_HULL=C(0x8e96a2),K_KEEP=C(0x2a5a96),K_BURN=C(0x6a564a),K_HER=C(0x3a1616),K_BONE=C(0xd8cbb4),K_GLASS=C(0x120a0a);
const wm=new Merger(),wg=new Merger(),sm=new Merger(),sg=new Merger();   // wreck metal, wreck glow, stone (the old white stone), its gold
/* (Oct 26) wreck metal added after the map's mesh is built (js/pathfinder2/02-story.js) goes into window._WM instead, and the story
   builds that into its own mesh. The cover walls down the mountain used to be added to wm after it was built: solid, but never drawn */
const WM=()=>window._WM||wm;
// burned machinery: a box hulk, tilted, half in the sand
/* Oct 26 (Bryce: way too much debris to drive the road; clear the middle lane, push the stuff to the side, keep it all there): from
   just past the crash to the canyon's mouth (where the rover stops), nothing stands within CLEAR m of the road's middle. Every piece
   that was placed in that lane is pushed straight out to the side it was already on (the middle ones alternate sides), so the same
   wrecks, walls, rocks and glass are all still there, lining the road instead of blocking it. offLane() does it for any spot. */
const CLEAR=7,CLEAR_S0=24;
function offRoad(x,z,r){const q=roadSeg(x,z),s=q.s;if(s<CLEAR_S0||s>S_CANYON-6)return null;const g=q.r,px=g.ax+(g.bx-g.ax)*q.t,pz=g.az+(g.bz-g.az)*q.t,lat=(x-px)*g.nx+(z-pz)*g.nz,m=CLEAR+(r||0);
  if(Math.abs(lat)>=m)return null;const sd=Math.abs(lat)<.3?(Math.sin(s*1.7)<0?-1:1):Math.sign(lat),nl=sd*(m+Math.abs(lat)*.5);return{x:x+g.nx*(nl-lat),z:z+g.nz*(nl-lat)};}
// (Oct 26) and out of the shortcuts too: nothing left standing in the gully or the hull cut (their ends are on the road, cleared above)
function offLane(x,z,r){let o=null;
  for(const c of SHORTS){const dx=c.bx-c.ax,dz=c.bz-c.az,u=((x-c.ax)*dx+(z-c.az)*dz)/(c.l*c.l);if(u<.06||u>.94)continue;
    const px=c.ax+dx*u,pz=c.az+dz*u,nx=-dz/c.l,nz=dx/c.l,lat=(x-px)*nx+(z-pz)*nz,m=c.r+2+(r||0);
    if(Math.abs(lat)<m){const sd=Math.abs(lat)<.3?1:Math.sign(lat);x=px+nx*sd*(m+.5);z=pz+nz*sd*(m+.5);o={x,z};}}
  const o2=offRoad(x,z,r);if(!o2)return o;x=o2.x;z=o2.z;
  for(const c of SHORTS){const dx=c.bx-c.ax,dz=c.bz-c.az,u=((x-c.ax)*dx+(z-c.az)*dz)/(c.l*c.l);if(u<.06||u>.94)continue;const px=c.ax+dx*u,pz=c.az+dz*u,nx=-dz/c.l,nz=dx/c.l,lat=(x-px)*nx+(z-pz)*nz,m=c.r+2+(r||0);
    if(Math.abs(lat)<m){const sd=Math.sign(lat)||1;x=px+nx*sd*(m+.5);z=pz+nz*sd*(m+.5);}}
  return{x,z};}
function hulk(x,z,w,h,d,ry,col,obst){{const o=offLane(x,z,Math.max(w,d)*.5);if(o){x=o.x;z=o.z;}}const y=floorAt(x,z);WM().add(boxUV(w,h,d,3),M(x,y+h*.35,z,R(-.12,.12),ry,R(-.18,.18)),col||K_BURN);if(obst!==false){OBST.push({x,z,r:Math.max(w,d)*.45,h:h*.8});}}
// a burned convoy vehicle: hull, cab, wheels gone, a scorch
function vehicle(x,z,ry){{const o=offLane(x,z,4.2);if(o){x=o.x;z=o.z;}}hulk(x,z,3.2,2.2,7,ry,K_BURN);const y=floorAt(x,z);WM().add(boxUV(2.8,1.6,2.4,3),M(x+Math.sin(ry)*-2.6,y+2.2,z+Math.cos(ry)*-2.6,0,ry,.1),K_HER);
  for(const s of[-1,1])for(const k of[-2,2])WM().add(cylZ(.7,.7,.5,10).rotateY(Math.PI/2),M(x+Math.cos(ry)*s*1.7+Math.sin(ry)*k,y+.4,z-Math.sin(ry)*s*1.7+Math.cos(ry)*k),C(0x161212));}
// a pale stone fragment from something much older: seamless, a thread of gold through it
function relic(x,z,s,ry){{const o=offLane(x,z,s*.6);if(o){x=o.x;z=o.z;}}const y=floorAt(x,z);sm.add(boxUV(s*.7,s*1.6,s*.5,2),M(x,y+s*.6,z,R(-.25,.25),ry,R(-.3,.3)),K_BONE);sg.add(new THREE.BoxGeometry(s*.72,.04,.04),M(x,y+s*.75,z,0,ry,0),C(0xffd27a));OBST.push({x,z,r:s*.45,h:s*1.2});}
function at0(s,lat){const p=roadPt(clamp(s,0,ROAD_LEN)).clone(),n=roadN(clamp(s,0,ROAD_LEN));p.x+=n.x*lat;p.z+=n.z*lat;p.y=floorAt(p.x,p.z);return p;}
// cover: low walls of broken stone and wreckage (you can shoot over them: their hit box is low, see BARS in js/origin/03-play.js)
function lowWall(x,z,ry,w){{const o=offLane(x,z,w/2+.8);if(o){x=o.x;z=o.z;}}const y=floorAt(x,z);WM().add(boxUV(w,1.2,.9,2),M(x,y+.5,z,0,ry,R(-.05,.05)),K_BURN);
  const n=Math.max(1,Math.round(w/1.4));for(let i=0;i<n;i++){const u=(i+.5)/n-.5;OBST.push({x:x+Math.cos(ry)*u*w,z:z-Math.sin(ry)*u*w,r:.75,h:1.3,bar:true});}
  BARS.push({ax:x-Math.cos(ry)*w/2,az:z+Math.sin(ry)*w/2,bx:x+Math.cos(ry)*w/2,bz:z-Math.sin(ry)*w/2,r:.75});}
// boulders
const ROCKS=[];
function addRock(x,z,r){{const o=offLane(x,z,r);if(o){x=o.x;z=o.z;}}const ys=R(.3,.52),g=new THREE.DodecahedronGeometry(r,1),P=g.attributes.position;for(let i=0;i<P.count;i++){const k=.8+.4*hash(Math.round(P.getX(i)*7/r)*13+Math.round(P.getY(i)*7/r)*7+((x*7)|0),Math.round(P.getZ(i)*7/r)*11+((z*5)|0));P.setXYZ(i,P.getX(i)*k,P.getY(i)*k,P.getZ(i)*k);}
  g.scale(1,ys,1);g.computeVertexNormals();const col=[];for(let i=0;i<P.count;i++)col.push(.55,.3,.22);g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(g,rockMat2);m.position.set(x,floorAt(x,z)+r*ys*.15,z);m.rotation.y=R(0,3);m.castShadow=m.receiveShadow=true;scene.add(m);OBST.push({x,z,r:r*.9,h:r*ys*1.15,low:r<1.4});ROCKS.push(m);}   // (Oct 25: small ones the rover rolls over)

// THE CRASH: Rhen's dropship where it stopped at the end of Arc 01, nose down at the end of its trench; debris along the trench
const WRECK={x:-9,z:-14,ry:-.35};
{for(let k=0;k<14;k++){const u=k/14;hulk(WRECK.x+18*u+R(-3,3),WRECK.z+44*u+R(-2,2),R(.8,2.2),R(.3,.8),R(.8,2.6),R(0,3),C(k%2?0x8a9098:0x7a6a5e),k%3===0);}
 for(const [x,z,r] of[[16,-20,1.6],[-24,6,1.3],[20,10,1.1],[-20,-26,1.8],[8,-34,1.2]])addRock(x,z,r);}

// THE DEAD DESERT: a convoy burned where it stood, black glass where the ground melted (it still burns: stay off it), stone fragments
const HAZ=[];   // {x,z,r}: patches of molten glass that hurt if you stand in them
{for(const [s,lat,ry] of[[64,-9,.3],[72,6,-.2],[84,-4,.9],[96,11,.1],[110,-13,-.4],[150,8,.6],[164,-6,1.2]])vehicle(at0(s,lat).x,at0(s,lat).z,ry);
 for(const [s,lat,sc] of[[78,15,2.2],[118,-17,3],[132,14,1.6],[176,-15,2.6],[188,10,1.8]])relic(at0(s,lat).x,at0(s,lat).z,sc,R(0,3));
 for(const [s,lat,r] of[[90,4,4.5],[126,-6,5.5],[142,9,3.8],[172,2,4.2]]){const p=at0(s,lat);HAZ.push({x:p.x,z:p.z,r});}
 for(const [s,lat,w] of[[58,3,5],[88,-12,6],[104,4,5],[138,-2,6],[160,12,5],[182,-8,6]]){const p=at0(s,lat),n=roadN(s);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.3,.3),w);}
 for(let k=0;k<13;k++){const s=R(50,190),lat=R(-20,20),p=at0(s,lat);if(HAZ.some(h=>Math.hypot(h.x-p.x,h.z-p.z)<h.r+2))continue;addRock(p.x,p.z,R(.5,1.3));}
 /* the new stretch (Oct 22), 190 to 345 m: more of the convoy, a downed Herald fighter at ~236 m with red survivors dug in round it,
    a field of black glass at ~262-300 m you have to thread, and the standing stone at S_STONE */
 for(const [s,lat,ry] of[[198,12,.5],[206,-10,2.2],[226,9,1.4],[252,-12,.2],[318,10,2.8],[332,-9,.9]])vehicle(at0(s,lat).x,at0(s,lat).z,ry);
 for(const [s,lat,sc] of[[214,-16,2.4],[244,17,1.7],[322,-17,2.8],[340,15,2]])relic(at0(s,lat).x,at0(s,lat).z,sc,R(0,3));
 // the glass field: patches across most of the width, gaps between them to pick through
 for(const [s,lat,r] of[[262,-10,5],[266,9,4.5],[274,-1,4],[280,-13,4.5],[284,11,5],[292,0,4.2],[298,-11,4],[300,13,3.6]]){const p=at0(s,lat);HAZ.push({x:p.x,z:p.z,r,lit:false});}
 for(const [s,lat,w] of[[202,-4,6],[220,6,5],[232,-6,6],[246,4,5],[310,-4,6],[326,5,6],[338,-3,5]]){const p=at0(s,lat),n=roadN(s);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.3,.3),w);}
 for(let k=0;k<13;k++){const s=R(192,345),lat=R(-20,20),p=at0(s,lat);if(HAZ.some(h=>Math.hypot(h.x-p.x,h.z-p.z)<h.r+2))continue;addRock(p.x,p.z,R(.5,1.3));}}
/* THE CONVOY LINE (Oct 26, Bryce: nothing should shoot at you right after you get in the Warthog): a burned Herald convoy jack-knifed
   across the dead ground at ~56 m, tall cargo bodies end to end out to both sides, the middle of the track open to drive through. From
   the crash and the rover's spot it hides the flats beyond; the first knot of fighting is out past it (js/pathfinder2/02-story.js SKIRM) */
{for(const sd of[-1,1])for(const [ds,off] of[[0,10],[3,17],[-2,24],[2,31]]){const s=56+ds,p=at0(s,sd*off),n=roadN(s);hulk(p.x,p.z,8.5,4.6,3.4,Math.atan2(n.z,-n.x)+R(-.2,.2),rng()<.5?K_HER:K_BURN);}
 for(const sd of[-1,1]){const p=at0(64,sd*9.5);addRock(p.x,p.z,R(1.6,2.1));}}
// the glass field's light: a few broad lamps over it rather than one per patch
for(const s of[268,286]){const p=at0(s,0),l=new THREE.PointLight(C(0xff6a20),1.6,30,1.4);l.position.set(p.x,2.5,p.z);scene.add(l);}
// the black glass: dark, glossy, cracks of orange light, heat shimmer
const hazMat=new THREE.MeshStandardMaterial({color:C(0x0a0606),roughness:.12,metalness:.6,emissive:C(0xff4a10),emissiveIntensity:.0});
const hazGlow=new THREE.MeshBasicMaterial({color:C(0xff6a20).multiplyScalar(1.4),toneMapped:false,transparent:true,opacity:.85});
for(const h of HAZ){{const o=offLane(h.x,h.z,h.r);if(o){h.x=o.x;h.z=o.z;}}const g=new THREE.CircleGeometry(h.r,28),P=g.attributes.position;for(let i=0;i<P.count;i++){const a=Math.atan2(P.getY(i),P.getX(i)),r=Math.hypot(P.getX(i),P.getY(i));const k=1+.18*Math.sin(a*5+h.r);P.setXY(i,Math.cos(a)*r*k,Math.sin(a)*r*k);}
  const m=new THREE.Mesh(g,hazMat);m.rotation.x=-Math.PI/2;m.position.set(h.x,floorAt(h.x,h.z)+.06,h.z);m.receiveShadow=true;scene.add(m);
  const cg=new Merger();for(let k=0;k<9;k++){const a=R(0,6.28),l=R(.4,.9)*h.r;cg.add(new THREE.BoxGeometry(l,.02,.07),M(h.x+Math.cos(a)*l*.45,floorAt(h.x,h.z)+.08,h.z+Math.sin(a)*l*.45,0,-a,0),C(0xffffff));}
  const cm=new THREE.Mesh(cg.build(),hazGlow);scene.add(cm);h.glow=cm;
  if(h.lit===false)continue;   // the glass field's patches go without a lamp each (a few lights for the whole field instead: phones)
  const pl=new THREE.PointLight(C(0xff6a20),1.2,h.r*3,1.6);pl.position.set(h.x,1.2,h.z);scene.add(pl);h.light=pl;}

// THE BASIN: wide and open, scattered cover; two Herald lines face each other across it (js/pathfinder2/02-story.js puts them there)
{for(const [s0,lat,w] of[[210,-30,7],[222,-12,5],[232,22,7],[248,-34,6],[256,4,6],[266,30,7],[280,-20,7],[292,14,6],[300,-36,5],[304,34,5]]){const s=SH(s0),p=at0(s,lat),n=roadN(s);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.4,.4),w);}
 for(const [s,lat] of[[214,40],[238,-40],[262,-8],[286,42],[298,-4]]){const p=at0(SH(s),lat);vehicle(p.x,p.z,R(0,3));}
 for(const [s,lat,sc] of[[226,38,3],[274,-42,2.4]])relic(at0(SH(s),lat).x,at0(SH(s),lat).z,sc,R(0,3));
 for(let k=0;k<12;k++){const p=at0(SH(R(200,310)),R(-44,44));addRock(p.x,p.z,R(.6,1.6));}}

// THE GRAVEYARD: Herald transports down in the sand, burned black, their red seams dead; two still have a terminal lit inside.
/* Oct 25 (Bryce: update the debris field, use the new models, make it 2-3x bigger, open in the middle at the end to walk through):
   2.6 times as long and half again as wide; the wrecks are Bryce's Herald ship models now (the Harrower's hull for the transports,
   the Wraith for the fighters), burned dark, half sunk, with their code shapes only as stand-ins until the files arrive. At its end a
   transport three times the size of the rest lies across the way, broken in two: you walk through the gap between the halves. */
const WRECKS=[];
/* (Oct 27) a wreck lying tilted on uneven sand can still hang a wing or a hull end over a dip: once its model is in, it's lowered until
   its lowest part is a little way into the sand (never raised: the half-buried ones stay buried) */
const _sv=new THREE.Vector3();
function settleDown(g,bury){g.updateMatrixWorld(true);let lo=1e9;g.traverse(o=>{if(!o.isMesh)return;for(let p=o;p&&p!==g.parent;p=p.parent)if(!p.visible)return;
  const P=o.geometry.attributes.position,st=Math.max(1,Math.floor(P.count/1200));for(let i=0;i<P.count;i+=st){_sv.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);const d=_sv.y-groundY(_sv.x,_sv.z);if(d<lo)lo=d;}});
  if(lo<1e8&&lo>-bury)g.position.y-=lo+bury;}
{const K=SHIPKIT.harrower(),L=(()=>{K.geo.computeBoundingBox();return K.geo.boundingBox.max.z-K.geo.boundingBox.min.z;})(),hm2=fleetHullMat(panelTex),gm2=fleetGlowMat(0x5a1008,1.2);hm2.metalness=.3;hm2.roughness=.7;   // burned, not black (see MODELS.swapShip opts.metal)
 const WK=SHIPKIT.wraith(),WL=(()=>{WK.geo.computeBoundingBox();return WK.geo.boundingBox.max.z-WK.geo.boundingBox.min.z;})();
 const hull=(p,len,ry,roll,sink,pitch)=>{{const q=roadSeg(p.x,p.z),gg=q.r,ext=()=>Math.abs(Math.sin(ry)*gg.nx+Math.cos(ry)*gg.nz)*len*.45+len*.09+1;   // (Oct 26: its whole length kept out of the lane; laid along the road if it's too long to fit across it)
   if(CLEAR+ext()>laneHalf(q.s)-4)ry=Math.atan2(gg.nz,-gg.nx)+(rng()<.5?0:Math.PI)+R(-.2,.2);const o=offLane(p.x,p.z,ext());if(o){p.x=o.x;p.z=o.z;}}
   const g=new THREE.Group(),a=new THREE.Mesh(K.geo,hm2),b=new THREE.Mesh(K.glowGeo,gm2);g.add(a,b);g.scale.setScalar(len/L);
   g.position.set(p.x,floorAt(p.x,p.z)+len*.05-len*sink*.2,p.z);g.rotation.set(pitch||R(-.12,.12),ry,roll);g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});scene.add(g);WRECKS.push(g);
   MODELS.swapShip(g,'harrower',{ref:K.geo,tint:0x9a7a70,metal:.3,hide:[a,b],shadow:true}).then(()=>settleDown(g,len*.03));   // burned, not black (Oct 25): see opts.metal
   for(let k=-2;k<=2;k++){const q={x:p.x+Math.sin(ry)*k*len*.18,z:p.z+Math.cos(ry)*k*len*.18};OBST.push({x:q.x,z:q.z,r:len*.09,h:len*.2});}return g;};
 const fighter=(p,len,ry)=>{{const o=offLane(p.x,p.z,len*.45);if(o){p.x=o.x;p.z=o.z;}}const g=new THREE.Group(),a=new THREE.Mesh(WK.geo,hm2),b=new THREE.Mesh(WK.glow,gm2);g.add(a,b);g.scale.setScalar(len/WL);
   g.position.set(p.x,floorAt(p.x,p.z)+len*.06,p.z);g.rotation.set(R(.15,.45),ry,R(-.6,.6));scene.add(g);MODELS.swapShip(g,'wraith',{ref:WK.geo,tint:0xc0a098,metal:.3,hide:[a,b],shadow:true}).then(()=>settleDown(g,.4));
   OBST.push({x:p.x,z:p.z,r:len*.32,h:len*.22});const sc=new Merger();for(let k=0;k<5;k++){const a2=R(0,6.28),d=R(len*.5,len*1.4);let sx=p.x+Math.cos(a2)*d,sz=p.z+Math.sin(a2)*d;{const o=offLane(sx,sz,1);if(o){sx=o.x;sz=o.z;}}sc.add(boxUV(R(.6,1.6),R(.2,.5),R(.8,2.2),2),M(sx,floorAt(sx,sz)+.02,sz,R(-.12,.12),R(0,3),R(-.15,.15)),K_BURN);}
   const sm=new THREE.Mesh(sc.build(),hm2);sm.castShadow=true;scene.add(sm);};
 // the transports (the old four spread out, and more)
 for(const [s0,lat,len,ry,roll,sink] of[[326,-34,46,.8,.5,.35],[344,32,38,-.6,-.4,.3],[362,-26,52,2.2,.3,.4],[378,22,30,1.2,-.6,.3],
   [322,30,34,2.6,-.5,.35],[333,-12,26,1.4,.7,.25],[351,36,48,.3,.4,.4],[357,10,24,2.9,-.6,.3],[368,-38,40,1.8,.5,.35],[372,34,28,.6,-.3,.3],[384,-30,36,2.4,.6,.35]])hull(at0(SH(s0),lat),len,ry,roll,sink);
 // fighters down among them
 for(const [s0,lat,ry] of[[324,-6,1],[330,18,2.5],[340,-24,.4],[348,-4,2],[355,22,1.2],[366,8,.3],[374,-14,2.8],[381,22,1.6]])fighter(at0(SH(s0),lat),R(10,14),ry);
 // the small Void Lancers (code-built, there's no model of them): three, as before (Oct 25: the last one and the fighter beside it
 // moved out from the middle, so the rover has a way through to the break)
 const LK=SHIPKIT.lancer();for(const [s,lat,ry] of[[334,4,1],[352,-6,2.5],[370,18,.4]]){const p=at0(SH(s),lat),g=new THREE.Group();{const o=offLane(p.x,p.z,3.6);if(o){p.x=o.x;p.z=o.z;}}g.add(new THREE.Mesh(LK.geo,hm2),new THREE.Mesh(LK.glow,gm2));g.scale.setScalar(.55);
   g.position.set(p.x,floorAt(p.x,p.z)+.8,p.z);g.rotation.set(.3,ry,.4);scene.add(g);settleDown(g,.3);OBST.push({x:p.x,z:p.z,r:3,h:2.5});}
 for(const [s0,lat,w] of[[330,8,6],[348,-4,6],[366,-2,5],[384,8,5],[338,-20,6],[356,24,5],[374,-26,6],[326,22,5],[362,16,6],[388,-12,5]]){const s=SH(s0),p=at0(s,lat),n=roadN(s);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.4,.4),w);}
 // THE BREAK at the field's end: one enormous transport across the way, in two halves with a gap between them where the path goes
 {const H=SHORTS[1],c=new THREE.Vector3(H.ax+(H.bx-H.ax)*.55,0,H.az+(H.bz-H.az)*.55),n={x:-(H.bz-H.az)/H.l,z:(H.bx-H.ax)/H.l},sB=roadS(c.x,c.z),ry=Math.atan2(n.x,n.z),LEN=100,GAP=16,G=new THREE.Group();   // (Oct 26: on the hull cut, across it, the road going round its end)G.position.set(c.x,floorAt(c.x,c.z)-LEN*.035,c.z);G.rotation.set(0,ry,1.22);   // on her side (upright she'd stand seventy metres tall)scene.add(G);
  // the halves' stand-ins, then the model cut in two when it arrives
  const halfStand=[];for(const sd of[-1,1]){const h=new THREE.Group(),a=new THREE.Mesh(K.geo,hm2);h.add(a);h.scale.set(LEN/L,LEN/L,LEN/L*.5);h.position.set(0,0,sd*(LEN*.25+GAP/2));G.add(h);halfStand.push(h);}
  MODELS.load('harrower').then(src=>{const gg=src.geometry;if(!gg.boundingBox)gg.computeBoundingBox();const b=gg.boundingBox,lm=b.max.z-b.min.z,k=LEN/lm,cz=(b.max.z+b.min.z)/2;
    const mat=src.material.clone();mat.color=C(0x8a6a62);mat.metalness=.3;mat.metalnessMap=null;mat.side=THREE.DoubleSide;
    const whole=new THREE.Mesh(gg,mat);whole.scale.setScalar(k);whole.position.set(-(b.max.x+b.min.x)/2*k,-(b.min.y)*k,-cz*k);
    const [hA,hB]=MODELS.halves(whole,.5);for(const hs of halfStand)G.remove(hs);
    for(const [h,sd] of[[hA,-1],[hB,1]]){h.position.z+=sd*GAP/2;h.rotation.x+=sd*.04;h.castShadow=h.receiveShadow=true;G.add(h);}settleDown(G,1.2);
  }).catch(()=>{});
  // solid along both halves, open in the middle
  for(const sd of[-1,1])for(let k=0;k<5;k++){const off=sd*(GAP/2+8.6+k*10);const x=c.x+Math.sin(ry)*off*0+n.x*off,z=c.z+n.z*off;OBST.push({x,z,r:8.5,h:LEN*.3});}
  // the torn edges of the break: plates and ribs fallen into the gap's mouth
  const tm=new Merger();for(let k=0;k<14;k++){const sd=k%2?1:-1,off=sd*(GAP/2+R(-1,2.5)),along=R(-14,14),x=c.x+n.x*off+n.z*along,z=c.z+n.z*off-n.x*along;
    {const th=R(.2,.6),rx=R(-.35,.35),rz=R(-.35,.35);tm.add(boxUV(R(1.5,4),th,R(2,5),2),M(x,floorAt(x,z)+th*.2,z,rx,R(0,3),rz),k%3?K_BURN:K_HER);}}   // (Oct 27: on the sand; they hung up to 2.5 m in the air)
  const tmm=new THREE.Mesh(tm.build(),hm2);tmm.castShadow=tmm.receiveShadow=true;scene.add(tmm);
  // a red light still flickering in the hull over the gap
  const fl=new THREE.PointLight(C(0xff4a1a),1.3,40,1.6);fl.position.set(c.x,14,c.z);scene.add(fl);window.BREAK_LIGHT=fl;window.BREAK={x:c.x,z:c.z,s:sB};}}
// the two terminals Thorne pulls the orders from
/* Oct 27 (Bryce: make the panels you click the new terminal model, and the terminal was floating): Bryce's display terminal
   (models/terminal.glb, the one on the command deck) stands on the sand facing the road; a small lamp over it goes from red to blue
   once its order is pulled. The code box only shows until the model arrives. */
const TERMS=[at0(SH(338),-11),at0(SH(372),9)].map(p=>{{const o=offLane(p.x,p.z,1.2);if(o){p.x=o.x;p.z=o.z;}}p.y=floorAt(p.x,p.z);
  const g=new THREE.Group();g.position.copy(p);{const q=roadPt(roadS(p.x,p.z));g.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);}scene.add(g);
  const b=new THREE.Mesh(boxUV(1,1.3,.7,2),new THREE.MeshStandardMaterial({map:panelTex,color:C(0x2a1a1a),roughness:.5,metalness:.6}));b.position.y=.65;b.castShadow=true;g.add(b);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.8,.5),new THREE.MeshBasicMaterial({color:C(0xff5a3a).multiplyScalar(1.4),toneMapped:false,transparent:true,opacity:.8}));scr.position.set(0,1.05,.37);scr.rotation.x=-.5;g.add(scr);
  const l=new THREE.PointLight(C(0xff5a3a),.8,8,1.6);l.position.set(0,1.9,.8);g.add(l);
  const T0={g,p,scr,l,done:false};
  MODELS.propObj('terminal',1.7/3.44).then(o=>{b.visible=false;g.add(o);T0.model=o;
    // the screen's own state light: a small lamp on top
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.18,.06,.18),scr.material);lamp.position.set(0,1.78,0);g.add(lamp);scr.visible=false;}).catch(()=>{});
  return T0;});

// THE CANYON: rock walls (the ground mesh), boulders, a few slabs fallen in from the rim; Dropship Two at the far end, on her side
{for(let k=0;k<20;k++){const s=R(S_CANYON+8,ROAD_LEN-24),h=laneHalf(s),p=at0(s,R(-h+1.5,h-1.5));addRock(p.x,p.z,R(.6,1.7));}
 for(const [s,lat,w] of[[SH(408),-4,5],[SH(426),4,5],[SH(446),-3,5],[SH(468),3,4],
   // the longer canyon (Oct 22): cover all the way up it
   [S_CANYON+40,-4,4],[S_CANYON+62,4,5],[S_CANYON+86,-4,5],[S_CANYON+108,4,4],[S_CANYON+132,-3,5],[S_CANYON+170,4,5],[S_CANYON+196,-4,4]]){const p=at0(s,lat),n=roadN(s);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.4,.4),w);}}

// THE SIDE AREAS (Oct 22). The hollow: a Herald fighter nose-down in the sand, a furrow behind it, its red seams still lit; wreckage strewn.
// The ravine: a dead end of rock with a fallen slab across its mouth (cover), and a dead Herald at the back (js/pathfinder2/02-story.js)
const SIDE_WRECK=(()=>{const o=SIDES[0],LK=SHIPKIT.lancer(),g=new THREE.Group();g.add(new THREE.Mesh(LK.geo,fleetHullMat(panelTex)),new THREE.Mesh(LK.glow,fleetGlowMat(0xff3a1a,1.6)));
  g.scale.setScalar(.95);g.position.set(o.cx,floorAt(o.cx,o.cz)+1.2,o.cz);g.rotation.set(.45,Math.atan2(o.cx-o.bx,o.cz-o.bz)+.6,.5);g.traverse(m=>{if(m.isMesh)m.castShadow=m.receiveShadow=true;});scene.add(g);
  OBST.push({x:o.cx,z:o.cz,r:4.2,h:4});
  for(let k=0;k<9;k++){const a=R(0,6.28),d=R(6,12);hulk(o.cx+Math.cos(a)*d,o.cz+Math.sin(a)*d,R(.8,2),R(.3,.9),R(.8,2.4),R(0,3),k%2?K_HER:K_BURN,k%3===0);}
  for(const [u,w] of[[.3,5],[.7,5]]){const x=o.ax+(o.bx-o.ax)*u,z=o.az+(o.bz-o.az)*u;lowWall(x+R(-2,2),z+R(-2,2),Math.atan2(o.bz-o.az,-(o.bx-o.ax))+R(-.3,.3),w);}
  return{g,p:new THREE.Vector3(o.cx,0,o.cz)};})();
{const o=SIDES[1];lowWall((o.ax+o.bx)/2,(o.az+o.bz)/2,Math.atan2(o.bz-o.az,-(o.bx-o.ax))+.2,4);
 for(let k=0;k<6;k++){const a=R(0,6.28),d=R(3,7);addRock(o.cx+Math.cos(a)*d,o.cz+Math.sin(a)*d,R(.6,1.4));}}
// Dropship Two's scar, up the canyon before her: a long dark furrow down the floor, torn hull panels (Keeper blue and gold) along it
{for(let s=ROAD_LEN-150;s<ROAD_LEN-30;s+=6){const p=at0(s,Math.sin(s*.07)*2);wm.add(boxUV(2.4,.18,6.4,2),M(p.x,floorAt(p.x,p.z)+.03,p.z,0,Math.atan2(roadN(s).z,-roadN(s).x),0),C(0x120c0a));}
 for(const [s,lat,ry] of[[ROAD_LEN-140,-5,.4],[ROAD_LEN-118,6,2],[ROAD_LEN-96,-3,1.1],[ROAD_LEN-74,7,2.6],[ROAD_LEN-60,-6,.2]]){const p=at0(s,lat);
   hulk(p.x,p.z,R(1.6,3),R(.4,1),R(2,4),ry,K_HULL,true);wm.add(boxUV(.25,.3,R(1.5,3),2),M(p.x+.4,floorAt(p.x,p.z)+.5,p.z,R(-.3,.3),ry,R(-.4,.4)),k2());}}
function k2(){return rng()<.5?K_KEEP:C(0xd9b25a);}

/* ---------- THE SETTLEMENTS (Oct 25, Bryce: drive the rover through two or three Herald settlements) ----------
   Three places the Heralds live, along the drive, in the same rust-dark blockhouse build as the depots at the walk's edge:
     the outpost (amber)   a walled waystation: a gate you drive under, two rows of blockhouses along the street, a watchtower
     the village (red)     the big one: homes in two rows each side, a square where the street opens, a domed hall on it with a
                           ring of lamps, banners on the hall's poles (the red walker patrols the square: js/pathfinder2/02-story.js)
     the burning one       both sides fighting through it: roofs fallen in, walls blackened, fires and smoke over the street
   Buildings are solid (RECTS, js/origin/03-play.js): you, the rover, shots and sight all stop at them. Flat roofs hold riflemen
   (SET_ROOFS). The street has cover: low walls, burned carts. The houses' doors and lit windows are the Herald door set (doors.js). */
window.RECTS=window.RECTS||[];
const SET_ROOFS=[],SET_FIRES=[];   // (no new point lights: each one would cost every material in the level; glows and lit windows instead)
const TEAMC={red:0xff3a1a,amber:0xffa030};
{const tg=new Merger(),cl=new Merger(),K_W=C(0x5a3428),K_W2=C(0x3a2420),K_ROOF=C(0x2a1a16),K_BRZ=C(0x8a5a32),K_SOOT=C(0x1c1412);
 const tcol=t=>t==='both'?(rng()<.5?'red':'amber'):t;
 // a house: its front on the street at (s, lat), facing the street; w along the street, d deep, H tall. o.roof: a flat roof with a
 // parapet riflemen stand on; o.burnt: blackened, roof fallen in (lower, no lip), no light in it
 const house=(s,lat,w,d,H,team,o)=>{o=o||{};const p=roadPt(s).clone(),n=roadN(s),side=Math.sign(lat)||1,px=p.x+n.x*lat,pz=p.z+n.z*lat;
   const fx=-n.x*side,fz=-n.z*side,ry=Math.atan2(fx,fz),gy=floorAt(px,pz),cx=px-fx*d/2,cz=pz-fz*d/2,T=(x,y,z,rx,rz)=>M(cx,0,cz,0,ry,0).multiply(M(x,y,z,rx||0,0,rz||0));
   const bw=o.burnt?K_SOOT:(rng()<.5?K_W:K_W2),tc=C(TEAMC[tcol(team)]);
   wm.add(boxUV(w,H+3,d,3),T(0,gy-3+(H+3)/2,0),bw);                                                   // the walls (sunk a little in the sand)
   wm.add(boxUV(w+.8,.9,d+.8,2),T(0,gy+.15,0),K_ROOF);                                                 // a plinth round its foot
   for(const sx of[-1,1])wm.add(boxUV(.9,H+3.2,1,3),T(sx*(w/2-.2),gy-3+(H+3.2)/2,d/2+.1),o.burnt?K_SOOT:K_ROOF);   // corner piers on the street side
   // buttresses down the long sides, leaning in
   for(const sx of[-1,1])for(const k of[-1,1])if(d>8)wm.add(boxUV(.7,H*.8,1.6,2),T(sx*(w/2+.45),gy+H*.38,k*d/4,0,sx*.12),K_ROOF);
   if(!o.burnt){wm.add(boxUV(w+1.2,.6,d+1.2,3),T(0,gy+H+.3,.3),K_ROOF);                                 // the roof slab, over the front
     wm.add(boxUV(w+.1,.25,.12,2),T(0,gy+H*.7,d/2+.08),K_BRZ);                                         // a bronze band across the front
     tg.add(new THREE.BoxGeometry(w*.92,.09,.05),T(0,gy+H*.7-.28,d/2+.14),tc);                         // under it, a thread of the side's colour
     if(o.roof)for(const [x,z,ww,dd] of[[0,d/2+.2,w+1.2,.4],[0,-d/2-.2,w+1.2,.4],[w/2+.4,0,.4,d+1.2],[-w/2-.4,0,.4,d+1.2]])wm.add(boxUV(ww,1,dd,2),T(x,gy+H+1,z),K_W2);   // the parapet
     else if(rng()<.6)wm.add(new THREE.CylinderGeometry(.08,.12,R(4,7),5),T(R(-w/3,w/3),gy+H+2.6,-d/4),C(0x2a2222));}   // a mast
   else{for(let k=0;k<3;k++)wm.add(boxUV(R(1.5,3.5),R(.3,.7),R(1.5,3),2),T(R(-w/3,w/3),gy+H-R(.2,1.2),R(-d/3,d/3),R(-.5,.5),R(-.5,.5)),K_SOOT);   // what's left of the roof
     for(let k=0;k<3;k++)wm.add(boxUV(R(1,2.5),R(.4,1.2),R(1,2.2),2),T(R(-w/2,w/2),gy+.4,d/2+R(1,3),R(-.4,.4),R(-.4,.4)),K_BURN);}   // and on the street
   const dx=R(-w/5,w/5);DOORS.add('herald',px+fx*.3+Math.cos(ry)*dx,gy-.05,pz+fz*.3-Math.sin(ry)*dx,fx,fz,{light:!o.burnt&&rng()<.8});
   for(const k of[-1,1]){const wx=dx+k*(w/2-1.6);if(Math.abs(wx-dx)<2.9||rng()<.2)continue;
     DOORS.pane('herald',px+fx*.04+Math.cos(ry)*wx,gy+H*.55,pz+fz*.04-Math.sin(ry)*wx,fx,fz,1.2,.9,!o.burnt&&rng()<.7?0xffa850:0x140c0a);}
   if(H>7)for(const k of[-1,0,1])if(rng()<.55)DOORS.pane('herald',px+fx*.04+Math.cos(ry)*k*3,gy+H*.82,pz+fz*.04-Math.sin(ry)*k*3,fx,fz,1.6,.6,!o.burnt&&rng()<.5?0xff9a40:0x140c0a);
   RECTS.push({x:cx,z:cz,hw:w/2+.4,hd:d/2+.2,ry,y0:gy-3,h:H+3+(o.burnt?0:.6),herald:true});   // (Oct 26: up to the top of the roof slab)
   /* Oct 26 (Bryce: riflemen on the roofs shooting from where you can't see them): the spot is at the parapet on the street side, not
      the middle of the roof (fx,fz: toward the street; ax,az: along the front; front: a house on the street, not the row behind) */
   // the roof slab's overhang and the parapet on it, solid to sight and shots (not to walking): a rifleman up there shows over it
   if(o.roof&&!o.burnt)RECTS.push({x:cx+fx*.3,z:cz+fz*.3,hw:w/2+.6,hd:d/2+.6,ry,y0:gy+H,h:.6,air:true},{x:cx,z:cz,hw:w/2+.6,hd:d/2+.4,ry,y0:gy+H,h:1.5,air:true});
   if(o.roof&&!o.burnt)SET_ROOFS.push({x:px-fx*.55,z:pz-fz*.55,y:gy+H+.6,s,side,team:tcol(team),fx,fz,ax:Math.cos(ry),az:-Math.sin(ry),w,front:Math.abs(lat)<15});
   if(o.burnt&&rng()<.6)SET_FIRES.push({p:new THREE.Vector3(cx+R(-w/4,w/4),gy+H-.6,cz+R(-d/4,d/4)),k:R(1.2,1.8)});   // burning inside, showing over the broken roof
   return{cx,cz,gy,ry,w,d,H};}
 // a banner on a pole: the side's colour, a pale chevron on it, hanging from a crossbar
 const flag=(x,z,team,h,ry)=>{const gy=floorAt(x,z),c=C(TEAMC[tcol(team)]).multiplyScalar(.55),T=(a,b,cc,rx)=>M(x,0,z,0,ry,0).multiply(M(a,b,cc,rx||0,0,0));
   wm.add(new THREE.CylinderGeometry(.09,.14,h,6),M(x,gy+h/2,z),K_ROOF);wm.add(boxUV(2,.12,.12,1),T(0,gy+h-.2,0),K_BRZ);
   cl.add(new THREE.BoxGeometry(1.7,h*.45,.05),T(0,gy+h-.3-h*.225,0,.04),c);
   for(const sx of[-1,1])cl.add(new THREE.BoxGeometry(.9,.16,.06),T(sx*.32,gy+h-.3-h*.18,.01,0).multiply(M(0,0,0,0,0,sx*.6)),C(0xd8c8a8));
   OBST.push({x,z,r:.3,h});}
 // a watchtower: a tapered shaft, a platform with a parapet (a rifleman stands up there), a lamp in the side's colour
 const tower=(s,lat,team,H)=>{const p=at0(s,lat),gy=p.y,tc=C(TEAMC[tcol(team)]),sh=new THREE.CylinderGeometry(1.5,2.4,H,4);sh.rotateY(Math.PI/4);
   wm.add(sh,M(p.x,gy+H/2,p.z),K_W2);wm.add(boxUV(5.2,.5,5.2,2),M(p.x,gy+H,p.z),K_ROOF);for(const [x,z,w,d] of[[0,2.5,5.2,.3],[0,-2.5,5.2,.3],[2.5,0,.3,5.2],[-2.5,0,.3,5.2]])wm.add(boxUV(w,1,d,2),M(p.x+x,gy+H+.75,p.z+z),K_W);
   wm.add(new THREE.ConeGeometry(3.4,2.4,4).rotateY(Math.PI/4),M(p.x,gy+H+3.6,p.z),K_ROOF);for(const k of[-1,1])for(const j of[-1,1])wm.add(boxUV(.2,2.4,.2,1),M(p.x+k*2.3,gy+H+1.6,p.z+j*2.3),K_ROOF);
   tg.add(new THREE.BoxGeometry(3.1,.08,3.1),M(p.x,gy+H*.55,p.z),tc);
   const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:tc.clone().multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.scale.setScalar(5.5);l.position.set(p.x,gy+H+2.6,p.z);scene.add(l);
   RECTS.push({x:p.x,z:p.z,hw:2.3,hd:2.3,ry:0,y0:gy-2,h:H+2,herald:true});RECTS.push({x:p.x,z:p.z,hw:2.75,hd:2.75,ry:0,y0:gy+H,h:1.25,air:true});   // its parapet (sight and shots)
   {const n=roadN(s),fx=-n.x*Math.sign(lat),fz=-n.z*Math.sign(lat);   // at the platform's street side
     SET_ROOFS.push({x:p.x+fx*1.8,z:p.z+fz*1.8,y:gy+H+.3,s,side:Math.sign(lat),team:tcol(team),tower:true,fx,fz,ax:fz,az:-fx,w:2.6,front:true});}}
 // a row of houses down one side of the street, from s0 to s1, front at |lat| (skipping the stretches in skip)
 const row=(S,side,lat,dMin,dMax,hMin,hMax,o,skip)=>{for(let s=S.s0+8;s<S.s1-8;){const w=R(9,15);const sc=s+w/2;if(skip&&skip.some(([a,b])=>sc>a&&sc<b)){s+=w+R(5,8);continue;}
   house(sc,side*lat,w,R(dMin,dMax),R(hMin,hMax),S.team,Object.assign({roof:rng()<(o&&o.roofK||.45)},o||{}));s+=w+R(5,9);}}
 const [SO,SV,SB]=S_SETS;
 // THE OUTPOST: a gate at each end of the street (two piers and a beam you drive under), blockhouses both sides, a watchtower
 {for(const sg of[SO.s0+2,SO.s1-2]){const n=roadN(sg),ry=Math.atan2(n.z,-n.x);for(const sd of[-1,1]){const p=at0(sg,sd*9.5);wm.add(boxUV(2.6,9,2.6,3),M(p.x,p.y+4.5,p.z),K_W2);RECTS.push({x:p.x,z:p.z,hw:1.4,hd:1.4,ry:0,y0:p.y-1,h:10,herald:true});
     for(const k of[1,2,3])lowWall(...(q=>[q.x,q.z])(at0(sg,sd*(9.5+k*4.6))),ry,4.4);}
   const c=at0(sg,0);wm.add(boxUV(21,1.4,1.8,4),M(c.x,c.y+8.6,c.z,0,Math.atan2(n.x,n.z)+Math.PI/2,0),K_ROOF);tg.add(new THREE.BoxGeometry(18,.1,.1),M(c.x,c.y+7.85,c.z,0,Math.atan2(n.x,n.z)+Math.PI/2,0),C(TEAMC.amber));
   flag(...(q=>[q.x,q.z])(at0(sg+3,-11)),'amber',7,Math.atan2(n.x,n.z));flag(...(q=>[q.x,q.z])(at0(sg+3,11)),'amber',7,Math.atan2(n.x,n.z));}
  const SM=(SO.s0+SO.s1)/2;
  row(SO,-1,10,8,11,5,8,{roofK:.55},[[SM-16,SM+16]]);row(SO,1,10,8,11,5,8,{roofK:.55});row(SO,-1,27,9,12,6,10);row(SO,1,27,9,12,6,10);
  tower(SM,-15,'amber',15);
  for(const [ds,lat,w] of[[-40,-3,5],[-12,5,6],[20,-5,5],[46,3,6]]){const p=at0(SM+ds,lat),n=roadN(SM+ds);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.3,.3),w);}
  for(const [ds,lat] of[[-28,6],[34,-6]]){const p=at0(SM+ds,lat);vehicle(p.x,p.z,R(0,3));}
}
 // THE VILLAGE: two rows each side; the square at its middle (no houses on it), the domed hall standing on the square's far side
 const VSQ=(SV.s0+SV.s1)/2;
 {row(SV,-1,10,8,12,5,9,{roofK:.4},[[VSQ-26,VSQ+26]]);row(SV,1,10,8,12,5,9,{roofK:.4},[[VSQ-26,VSQ+26]]);row(SV,-1,26,9,13,7,12,{roofK:.3});row(SV,1,27,9,13,7,12,{roofK:.3},[[VSQ-18,VSQ+18]]);
  // the hall: a drum, a dome, a ring of red lamps round its foot, a spire; banners on poles in front of it
  const h=at0(VSQ,26),gy=h.y,R0=10;wm.add(new THREE.CylinderGeometry(R0,R0+.6,7,16),M(h.x,gy+3.5,h.z),K_W);wm.add(new THREE.CylinderGeometry(R0+1,R0+1,.8,16),M(h.x,gy+7.2,h.z),K_ROOF);
  wm.add(new THREE.SphereGeometry(R0,16,8,0,Math.PI*2,0,Math.PI/2),M(h.x,gy+7.4,h.z,0,0,0).multiply(new THREE.Matrix4().makeScale(1,.75,1)),K_W2);wm.add(new THREE.CylinderGeometry(.15,.5,9,6),M(h.x,gy+18,h.z),K_BRZ);
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2;tg.add(new THREE.BoxGeometry(.5,1.4,.12),M(h.x+Math.cos(a)*(R0+.62),gy+4.2,h.z+Math.sin(a)*(R0+.62),0,-a+Math.PI/2,0),C(TEAMC.red));
    wm.add(boxUV(1.2,7.5,1.2,2),M(h.x+Math.cos(a+.26)*(R0+.5),gy+3.7,h.z+Math.sin(a+.26)*(R0+.5)),K_ROOF);}
  OBST.push({x:h.x,z:h.z,r:R0+1,h:16});RECTS.push({x:h.x,z:h.z,hw:R0*.72,hd:R0*.72,ry:Math.PI/4,y0:gy-2,h:13,herald:true});
  {const fp=at0(VSQ,15.6),n=roadN(VSQ);DOORS.add('herald',fp.x,fp.y-.05,fp.z,-n.x,-n.z,{light:true,s:1.5});}
  const n=roadN(VSQ),ry=Math.atan2(n.x,n.z);for(const k of[-9,-3,3,9]){const q=at0(VSQ+k,13);flag(q.x,q.z,'red',9,ry);}
  // a plinth with a lamp in the middle of the square
  {const q=at0(VSQ,-11);wm.add(new THREE.CylinderGeometry(2.2,2.6,1.1,8),M(q.x,q.y+.55,q.z),K_ROOF);wm.add(new THREE.CylinderGeometry(.3,.45,6,6),M(q.x,q.y+4,q.z),K_W2);OBST.push({x:q.x,z:q.z,r:2.5,h:7});
   const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(TEAMC.red).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.scale.setScalar(4.4);l.position.set(q.x,q.y+7.4,q.z);scene.add(l);}
  tower(SV.s0+1,16,'red',13);tower(SV.s1-1,-16,'red',13);
  for(const [ds,lat,w] of[[-70,4,6],[-48,-5,5],[-30,-12,6],[-24,10,5],[30,12,6],[36,-9,5],[56,4,6],[78,-4,5]]){const p=at0(VSQ+ds,lat),n2=roadN(VSQ+ds);lowWall(p.x,p.z,Math.atan2(n2.z,-n2.x)+R(-.3,.3),w);}
  for(const [ds,lat] of[[-60,-6],[16,-10],[66,7]]){const p=at0(VSQ+ds,lat);vehicle(p.x,p.z,R(0,3));}
}
 // THE BURNING ONE: both sides fought over it and are still fighting: roofs gone, walls black, fires in the street and the houses
 {const W0=SB.s0+30;row(SB,-1,10,8,11,4,7,{burnt:true},[[W0-14,W0+14],[W0+68-14,W0+68+14]]);row(SB,1,10,8,11,4,7,{burnt:true},[[W0+34-14,W0+34+14],[W0+102-14,W0+102+14]]);row(SB,-1,27,9,12,5,8,{burnt:true});row(SB,1,27,9,12,5,8,{burnt:true});
  for(const k of[0,1,2,3])house(W0+k*34,k%2?10:-10,R(8,11),R(7,9),R(6,8),k%2?'amber':'red',{roof:true});   // a few still whole, with riflemen on them
  for(const [ds,lat,w] of[[16,-4,5],[40,6,6],[64,-6,5],[90,3,6],[112,-3,5]]){const p=at0(SB.s0+ds,lat),n=roadN(SB.s0+ds);lowWall(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.4,.4),w);}
  for(const [ds,lat] of[[26,7],[76,-8],[104,9]]){const p=at0(SB.s0+ds,lat);vehicle(p.x,p.z,R(0,3));}
  for(let k=0;k<5;k++){const p=at0(SB.s0+16+k*26,(k%2?1:-1)*R(CLEAR+1.5,CLEAR+4));SET_FIRES.push({p:new THREE.Vector3(p.x,p.y,p.z),k:R(.7,1.1)});}   // and in the street: a cart, a heap of something
  // the fires: a glow that flickers (js/pathfinder2/02-story.js sends the smoke up)
  // (two layers: a wide orange glow and a hot yellow core)
  for(const F of SET_FIRES){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff6a1a).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));s.scale.set(6*F.k,7*F.k,1);s.position.copy(F.p).setY(F.p.y+1.6*F.k);scene.add(s);F.glow=s;
    const c=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd070).multiplyScalar(2.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));c.scale.set(2.4*F.k,3.4*F.k,1);c.position.copy(F.p).setY(F.p.y+1*F.k);scene.add(c);F.core=c;
    // the smoke over it, dark enough to read against the day: five soft puffs climbing and spreading (js/pathfinder2/02-story.js moves them)
    F.smoke=[];for(let k=0;k<6;k++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x0a0706),transparent:true,depthWrite:false,opacity:.85,fog:false}));m.userData.u=k/6;scene.add(m);F.smoke.push(m);}}}
 // boulders kept out of the streets; the merged pieces
 const tgm=new THREE.Mesh(tg.build(),new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}));scene.add(tgm);
 const clm=new THREE.Mesh(cl.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0,side:THREE.DoubleSide,emissive:C(0x1a0604)}));clm.castShadow=true;scene.add(clm);}
// the drive's open stretches between the settlements: dunes, boulders, a burned cart or two
{for(let k=0;k<22;k++){const s=R(S_DRV0+10,S_DRV1-10);if(setAt(s))continue;const h=laneHalf(s),p=at0(s,(rng()<.5?-1:1)*R(h*.55,h-2));addRock(p.x,p.z,R(.7,1.7));}   // (Oct 25: half as many, kept off the middle)
 for(const s of[S_DRV0+40,S_DRV0+270,S_DRV0+545,S_DRV0+880,S_DRV1-12]){if(setAt(s))continue;const p=at0(s,R(-12,12));vehicle(p.x,p.z,R(0,3));}}
// the gully (Oct 26): banks of broken rock, burned carts over its edges; its floor kept clear to drive
{const g=SHORTS[0],nx=-(g.bz-g.az)/g.l,nz=(g.bx-g.ax)/g.l,P=(u,lat)=>({x:g.ax+(g.bx-g.ax)*u+nx*lat,z:g.az+(g.bz-g.az)*u+nz*lat});
 for(let k=0;k<26;k++){const u=R(.08,.92),sd=rng()<.5?-1:1,p=P(u,sd*R(g.r+2.5,g.r+9));addRock(p.x,p.z,R(1.4,3.2));}
 for(const [u,sd] of[[.16,1],[.82,-1],[.5,1]]){const p=P(u,sd*(g.r+4.5));vehicle(p.x,p.z,R(0,3));}}

/* the gully's roof and its gatehouse (Oct 26, Bryce: the gully shortcut gets a roof and a drive-through structure). Herald work: a
   stretch of the cut roofed over, slabs on piers set into both banks with a strip of amber lamps under each; further on a blockhouse
   straddles the cut, its floor running straight through under the arch, a flat roof with a parapet on top (riflemen: the gully's
   ambush, js/pathfinder2/02-story.js). The floor stays clear to drive. The camera keeps under both (camClamp) */
const GULLY_ROOFS=[];let GATEHOUSE=null;
{const g=SHORTS[0],ux=(g.bx-g.ax)/g.l,uz=(g.bz-g.az)/g.l,nx=-uz,nz=ux,ry=Math.atan2(ux,uz),P=(u,lat)=>({x:g.ax+(g.bx-g.ax)*u+nx*lat,z:g.az+(g.bz-g.az)*u+nz*lat});
 const K_W=C(0x5a3428),K_W2=C(0x3a2420),K_ROOF=C(0x2a1a16),tg=new Merger(),half=g.r+1.6,amber=C(0xffa030);
 // the roof, u .30 to .52: one slab per bay, piers between
 const U0=.30,U1=.52,RL=(U1-U0)*g.l,bays=Math.max(3,Math.round(RL/7)),bl=RL/bays;
 for(let b=0;b<=bays;b++){const u=U0+(U1-U0)*b/bays;for(const sd of[-1,1]){const p=P(u,sd*(g.r+.9)),y=floorAt(p.x,p.z);wm.add(boxUV(1.1,7.6,1.1,2),M(p.x,y+3.1,p.z,0,ry,0),K_W2);OBST.push({x:p.x,z:p.z,r:.7,h:7});}}
 let ry0=1e9;
 for(let b=0;b<bays;b++){const u=U0+(U1-U0)*(b+.5)/bays,c=P(u,0),y=floorAt(c.x,c.z)+6.6;ry0=Math.min(ry0,y-.35);
   wm.add(boxUV(half*2+.6,.7,bl+.12,3),M(c.x,y,c.z,0,ry,0),K_ROOF);
   for(const sd of[-1,1])wm.add(boxUV(.35,.9,bl,2),M(c.x+nx*sd*half,y+.75,c.z+nz*sd*half,0,ry,0),K_W);
   tg.add(new THREE.BoxGeometry(.14,.06,bl*.72),M(c.x,y-.38,c.z,0,ry,0),amber);}
 {const c=P((U0+U1)/2,0);GULLY_ROOFS.push({x:c.x,z:c.z,hw:half+.3,hd:RL/2+.3,ry,y0:ry0,h:1.2,air:true});}
 // the gatehouse at u .76: thick side walls along the cut, an arch-topped front and back, a roof slab with a parapet
 const UG=.76,c=P(UG,0),gy=floorAt(c.x,c.z),L=14,H=8.6,ow=g.r-.4,oh=5.6;
 for(const sd of[-1,1]){const w=P(UG,sd*(ow+2.6));wm.add(boxUV(5.2,H+2,L,3),M(w.x,gy-1+(H+2)/2,w.z,0,ry,0),K_W);RECTS.push({x:w.x,z:w.z,hw:2.6,hd:L/2,ry,y0:gy-2,h:H+2.2,herald:true});
   const d=P(UG+sd*.012,sd*(ow+.02));DOORS.add('herald',d.x,gy-.05,d.z,-nx*sd,-nz*sd,{light:sd>0});}
 for(const fz of[-1,1]){const f=P(UG+fz*(L/2-.7)/g.l,0);wm.add(boxUV(ow*2+.6,H-oh,1.4,3),M(f.x,gy+oh+(H-oh)/2,f.z,0,ry,0),K_W2);
   wm.add(boxUV(ow*2+1.4,.35,.25,2),M(f.x+ux*fz*.8,gy+H*.55+2.3,f.z+uz*fz*.8,0,ry,0),C(0x8a5a32));   // a bronze band over the arch
   tg.add(new THREE.BoxGeometry(ow*2-.6,.1,.06),M(f.x+ux*fz*.74,gy+oh+.3,f.z+uz*fz*.74,0,ry,0),amber);}
 wm.add(boxUV(ow*2+10.6,.8,L+.6,3),M(c.x,gy+H+.4,c.z,0,ry,0),K_ROOF);
 for(const sd of[-1,1])wm.add(boxUV(.4,1,L+.6,2),M(c.x+nx*sd*(ow+5.1),gy+H+1.3,c.z+nz*sd*(ow+5.1),0,ry,0),K_W);
 for(const fz of[-1,1])wm.add(boxUV(ow*2+10.6,1,.4,2),M(c.x+ux*fz*(L/2+.1),gy+H+1.3,c.z+uz*fz*(L/2+.1),0,ry,0),K_W);
 GULLY_ROOFS.push({x:c.x,z:c.z,hw:ow+.3,hd:L/2+.1,ry,y0:gy+oh,h:H-oh+.8,air:true});RECTS.push(...GULLY_ROOFS);
 {const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:amber.clone().multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.scale.setScalar(5);l.position.set(c.x,gy+H+3,c.z);scene.add(l);}
 GATEHOUSE={x:c.x,z:c.z,y:gy+H+.8,ux,uz,nx,nz,ow,L,u:UG};
 const tm=new THREE.Mesh(tg.build(),new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}));scene.add(tm);}

/* Herald buildings at the edge of the walk (Oct 22, Bryce: make the world feel bigger, doors on the sides of buildings): blockhouses
   and depots half buried in the dunes, burned, each with a sealed blast door toward you, a lamp over it (some still lit), a few windows
   with someone's light still on. All of them stand outside where you can walk, so they change no fight. */
{const K_W=C(0x5a3428),K_W2=C(0x3a2420),K_ROOF=C(0x2a1a16);
 for(const [s,side,off,w,H,d] of[[60,-1,5,10,6,8],[100,1,6,12,7,9],[150,-1,4,9,5,7],[205,-1,6,14,8,10],[270,1,5,10,6,8],[318,-1,5,11,6,8],[340,1,7,13,9,10],
   [SH(214),1,6,16,9,12],[SH(244),-1,6,12,7,9],[SH(274),1,8,14,10,10],[SH(300),-1,6,10,6,8],[SH(334),-1,6,12,7,9],[SH(366),1,5,10,6,8]]){
   const p=roadPt(s).clone(),n=roadN(s),h=laneHalf(s),fx=-n.x*side,fz=-n.z*side,lat=side*(h+off),px=p.x+n.x*lat,pz=p.z+n.z*lat,gy=groundY(px,pz),ry=Math.atan2(fx,fz);
   const cx=px-fx*d/2,cz=pz-fz*d/2,lean=R(-.03,.03),T=(x,y,z,rx,rz)=>M(cx,0,cz,0,ry,0).multiply(M(x,y,z,(rx||0)+lean,0,rz||0));
   if(shortD(cx,cz)<Math.max(w,d)/2+14)continue;   // (Oct 26: never on a shortcut)
   wm.add(boxUV(w,H+3,d,3),T(0,gy-3+(H+3)/2,0),rng()<.5?K_W:K_W2);
   wm.add(boxUV(w+1,.6,d+1,3),T(0,gy+H+.3,.3),K_ROOF);                                     // the roof slab, overhanging the front
   for(const sx of[-1,1])wm.add(boxUV(.9,H+3,1,3),T(sx*(w/2-.2),gy-3+(H+3)/2,d/2+.1),K_ROOF);   // corner piers
   if(rng()<.6){wm.add(new THREE.CylinderGeometry(.08,.12,R(4,7),5),T(R(-w/3,w/3),gy+H+2.5,-d/4),C(0x2a2222));}   // a mast
   if(rng()<.5)wm.add(boxUV(R(2,4),R(1,2.4),R(2,3),2),T(w/2+.6,gy+.6,d/2-1,R(-.4,.4),R(-.5,.5)),K_BURN);   // a fallen chunk at the corner
   const dx=R(-w/5,w/5);DOORS.add('herald',px+fx*.3+Math.cos(ry)*dx,gy-.05,pz+fz*.3-Math.sin(ry)*dx,fx,fz,{light:rng()<.65});
   for(const k of[-1,1]){if(rng()<.3)continue;const wx=dx+k*(w/2-1.6);if(Math.abs(wx-dx)<2.9)continue;   // (clear of Bryce's wider door model)
     DOORS.pane('herald',px+fx*.04+Math.cos(ry)*wx,gy+H*.62,pz+fz*.04-Math.sin(ry)*wx,fx,fz,1.2,.8,rng()<.55?0xffa850:0x140c0a);}
   if(H>7)for(const k of[-1,0,1])if(rng()<.5)DOORS.pane('herald',px+fx*.04+Math.cos(ry)*k*3,gy+H*.85,pz+fz*.04-Math.sin(ry)*k*3,fx,fz,1.6,.6,rng()<.4?0xff9a40:0x140c0a);}
 DOORS.build(scene);}

/* the merged meshes */
const wreckMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.72,metalness:.15});   // (Oct 27: a little less metal, lighter paint: the debris near the crash read as flat black slabs against the morning sun)   // (low metalness: there's no environment to reflect, so a metal surface here is black)
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
  /* Oct 27 (Bryce: make the sand look like it reaches out to the city in the last cutscene): a sheet of desert in the city's own frame,
     from just past where the ground mesh ends out under the towers and beyond, fading in from nothing at its near edge so it meets
     the real dunes without a seam. Its colour is set from the evening sand and haze when the city is shown (apronTint) */
  const ac=document.createElement('canvas');ac.width=8;ac.height=256;{const x=ac.getContext('2d'),gr=x.createLinearGradient(0,0,0,256);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.55,'rgba(255,255,255,1)');gr.addColorStop(.85,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,8,256);}
  const am=new THREE.MeshBasicMaterial({color:C(0xa8603c),alphaMap:new THREE.CanvasTexture(ac),transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide});
  const ag=new THREE.PlaneGeometry(12000,5000,24,24);{const P=ag.attributes.position;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i);P.setZ(i,6*Math.sin(x*.004)+4*Math.sin(y*.006+x*.002));}}   // a few long swells
  const apron=new THREE.Mesh(ag,am);apron.rotation.x=-Math.PI/2+.06;apron.position.set(0,-214,-R0-750);   // (tilted: its near edge drops below the far dunes' skyline, so no edge shows; its far edge meets the towers' feet)apron.renderOrder=-1;G.add(apron);
  function apronTint(){const f=scene.fog?scene.fog.color:C(0x8a5a40);am.color.copy(C(0xc8784a)).lerp(f,.25);}
  G.visible=false;skyGroup.add(G);return{G,halo,apron,apronTint};})();

/* ---------- light, dust, haze ---------- */
const helmLamp=new THREE.PointLight(C(0xd8e6ff),0,24,1.5);scene.add(helmLamp);
function updateLights(dt,T,pos){for(const h of HAZ){const f=.75+.25*Math.sin(T*3+h.r*2)+.1*Math.sin(T*11+h.x);if(h.light)h.light.intensity=1.3*f;h.glow.material.opacity=.6+.3*f;}}
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
/* ---------- (Oct 25) Astraea's rock spires: Bryce's cliff model (models/cliff.glb, a red sandstone needle; it was cut from the Mountain's
   walls, where it tore), standing out in the dunes either side of the walk, never on it and never across the white city on the
   horizon. Scenery only: nothing reaches them, so no collision. A missing file leaves the dunes as they were. ---------- */
{const SP=[[-96,-60,46],[-150,-210,64],[118,-150,38],[180,-300,72],[-128,-360,52],[-210,-470,80],[140,-450,44],[96,-560,34]];
 MODELS.copy('cliff').then(({scene:src})=>{MODELS.tame(src,.2);
   SP.forEach(([x,z,h],i)=>{if(playD(x,z)<40)return;const s=i?src.clone(true):src;const {o}=MODELS.fit(s,{size:h,axis:'y',floor:true,ry:i*1.7});
     o.scale.x*=1+.25*Math.sin(i*2.3);o.scale.z*=1+.25*Math.cos(i*1.9);/* Oct 27 (Bryce: a rock to the left of the stone, just outside the map, floating): the dunes out here slope hard, and the spire stood at the height of the sand under its middle, so its downhill side hung over the slope. It's set at the lowest sand under its whole footprint now, and a little into it */o.position.set(x,0,z);o.updateMatrixWorld(true);{const bb=new THREE.Box3().setFromObject(o),rx=(bb.max.x-bb.min.x)/2,rz=(bb.max.z-bb.min.z)/2,cx=(bb.max.x+bb.min.x)/2,cz=(bb.max.z+bb.min.z)/2;let lo=groundY(x,z);for(let a=0;a<6.28;a+=.524)for(const f of[.45,.8,1.05]){lo=Math.min(lo,groundY(cx+Math.cos(a)*rx*f,cz+Math.sin(a)*rz*f));}o.position.y=lo-bb.min.y-Math.max(1.5,h*.05);}
     o.traverse(m=>{if(m.isMesh){m.castShadow=false;m.receiveShadow=true;}});scene.add(o);});}).catch(()=>{});}
setLook('desert');


/* (Oct 26) the bridge over the breach: where the path crosses the gap in the pit's north wall, a span of rock carries it, thick at its
   ends where it leaves the wall and thin across the middle, a broken lip along both edges. Walking follows the path's own height
   (floorAt), so the bridge is what you see under your feet */
const BREACH_BRIDGE=(()=>{const m=new Merger(),c=C(0x9a5a40),c2=C(0x6a3428),a0=BREACH.th-BREACH.half-BREACH.soft-.05,a1=BREACH.th+BREACH.half+BREACH.soft+.05,N=44;
  for(let i=0;i<N;i++){const p0=a0+(a1-a0)*i/N,p1=a0+(a1-a0)*(i+1)/N,pm=(p0+p1)/2,q=pitRing(pm),r=q.r,y=pathY(q.s),w=laneHalf(q.s)*2+1.6;
    const x0=PIT.x-r*Math.sin(p0),z0=PIT.z+r*Math.cos(p0),x1=PIT.x-r*Math.sin(p1),z1=PIT.z+r*Math.cos(p1),L=Math.hypot(x1-x0,z1-z0)+.35,ry=Math.atan2(x1-x0,z1-z0);
    const e=Math.abs((pm-BREACH.th)/(BREACH.half+BREACH.soft)),th=2.6+9*Math.pow(clamp(e,0,1),3);   // thin across the middle, deep where it meets the rock
    m.add(boxUV(w,th,L,4),M((x0+x1)/2,y-.08-th/2,(z0+z1)/2,0,ry,0),i%3?c:c2);
    for(const sd of[-1,1])if(rng()<.75){const nx=Math.cos(ry),nz=-Math.sin(ry),hh=R(.5,1.1);m.add(boxUV(.8,hh,L*R(.6,1),2),M((x0+x1)/2+nx*sd*(w/2-.3),y+hh/2-.1,(z0+z1)/2+nz*sd*(w/2-.3),R(-.1,.1),ry,R(-.1,.1)),c2);}}
  const g=m.build(),mesh=new THREE.Mesh(g,rockMat2);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh;})();
