/* Elyra · Side mission S1 · Pathfinder — the world: a Hollow installation (the Empty Host's) half sunk into a dead moon,
   at night, with Astraea hanging huge in the sky. Captain Rhen's strike team lands in a crater to the south (the LZ), fights up an
   open yard to a blast gate, through the Host's halls, into something older that nobody built (pale stone, no joins), to a sealed
   chamber. The way out is a bored service ramp up to a hangar on the east face, where the Pathfinder can pick them up.
   One walkable path (the "road") runs south to north through all of it, so js/origin/03-play.js (the player, the squad, the
   Empty Host, turrets, dropships) works here unchanged: it only asks for playD, groundY, roadS, laneHalf and friends.
   Units are metres. The cutscene sets (orbit, the drop bay, the cockpit, the fall, Astraea) live in js/pathfinder/03-ending.js. */
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
MODELS.preload(['engineer','marine','rifle','civilian','host-trooper','vanguard','wraith','harrower','dropship']);
// you are Captain Rhen, not Michael: the Keeper marine model in the Pathfinder's scout grey (read by js/origin/03-play.js)
window.HOST_LIFT=.5;   // the Host's troopers glow a little more here: their armour is the colour of their own walls
window.PLAYER_KIND='marine';window.PLAYER_OPTS={tint:0xb4bcc4};

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(C(0x120e1c),.0011);scene.background=scene.fog.color;
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
let keyBase=1.15,hemiBase=.55,inK=0;   // indoors the moonlight is turned down and the fill up, so a corridor isn't bright on one wall and dark on the other
const hemi=new THREE.HemisphereLight(C(0x7a7aa8),C(0x18121e),.55);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(C(0xffb08a),1.15);keyLight.position.copy(ASTRAEA_DIR).multiplyScalar(600);scene.add(keyLight,keyLight.target);
keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(keyLight.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:1500});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.05;
const rim=new THREE.DirectionalLight(C(0xbfd0ff),.45);rim.position.copy(sunDir).multiplyScalar(500);scene.add(rim);
let keyDir=ASTRAEA_DIR.clone();
function followSun(p){keyLight.position.copy(p).addScaledVector(keyDir,600);keyLight.target.position.copy(p);}
/* looks: the moon at night (play), orbit, inside a ship, the fall through Astraea's air, Astraea's surface */
const LOOKS={
  moon:{hor:0x2a2238,mid:0x120e22,zen:0x020208,star:1,sunK:1,fog:0x120e1c,dens:.0011,keyC:0xffb89a,keyI:.95,hemiS:0x7a7aa8,hemiG:0x18121e,hemiI:.55,planet:1,band:1,dir:ASTRAEA_DIR,exp:1.12},
  orbit:{hor:0x140a26,mid:0x0c0820,zen:0x04030c,star:1.7,sunK:1.3,fog:0x000000,dens:0,keyC:0xfff0e0,keyI:2.4,hemiS:0x404060,hemiG:0x000000,hemiI:.15,planet:1,band:1.8,dir:sunDir,exp:1.1},
  entry:{hor:0xff7a3a,mid:0x7a2614,zen:0x10060a,star:.15,sunK:.4,fog:0x5a1e12,dens:.00025,keyC:0xffa060,keyI:1.6,hemiS:0xff8a5a,hemiG:0x2a0a08,hemiI:.7,planet:0,band:0,dir:new THREE.Vector3(0,-1,.2).normalize(),exp:1.15},
  astraea:{hor:0xf0b088,mid:0xc4664c,zen:0x5a1a2c,star:0,sunK:1.2,fog:0xa8604c,dens:.0016,keyC:0xffd4a8,keyI:1.9,hemiS:0xffb8a0,hemiG:0x3a1a18,hemiI:.75,planet:0,band:0,dir:new THREE.Vector3(.5,.32,.8).normalize(),exp:1.05}};
let lookName='';
function setLook(name){const L=LOOKS[name];if(!L)return;lookName=name;
  skyU.hor.value.copy(C(L.hor));skyU.mid.value.copy(C(L.mid));skyU.zen.value.copy(C(L.zen));skyU.starK.value=L.star;skyU.sunK.value=L.sunK;skyU.band.value=L.band;
  scene.fog.color.copy(C(L.fog));scene.fog.density=L.dens;scene.background=scene.fog.color;
  keyLight.color.copy(C(L.keyC));keyLight.intensity=keyBase=L.keyI;hemi.color.copy(C(L.hemiS));hemi.groundColor.copy(C(L.hemiG));hemi.intensity=hemiBase=L.hemiI;keyDir=L.dir.clone();
  astraea.visible=astraeaHalo.visible=!!L.planet;renderer.toneMappingExposure=L.exp;}

/* ---------- the map: the LZ crater (south), the yard, the gate, the Host's halls, the old stone, the chamber, the ramp, the hangar ----------
   Oct 22: the inside is twice as long as it was (gate to sealed door ~360 m, was ~180): longer Host halls with a loading bay in the
   middle, a longer gallery hall, a longer old stretch. Everything from the door on keeps its old shape, moved north. */
const LZ={x:0,z:40,r:46},CH={x:10,z:-499,r:15},PLAT={x:24,z:-629,r:24},PLAT_Y=11;
const ROAD=[[0,0],[0,-40],[10,-90],[0,-118],[0,-152],[-16,-198],[-16,-226],[-16,-296],[-2,-340],[-2,-372],[10,-410],[10,-467],[10,-499],[10,-527],[24,-562],[24,-609]];
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const ROADS=[],ROAD_LEN=(()=>{let s=0;for(let i=0;i<ROAD.length-1;i++){const [ax,az]=ROAD[i],[bx,bz]=ROAD[i+1],l=Math.hypot(bx-ax,bz-az);ROADS.push({ax,az,bx,bz,l,s0:s,nx:-(bz-az)/l,nz:(bx-ax)/l});s+=l;}return s;})();
const S_NODE=(()=>{const o=[0];for(const r of ROADS)o.push(r.s0+r.l);return o;})();
function roadSeg(x,z){let best=1e9,bs=0,bt=0,br=ROADS[0];for(const r of ROADS){const dx=r.bx-r.ax,dz=r.bz-r.az,t=clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.l*r.l),0,1),d=Math.hypot(x-r.ax-dx*t,z-r.az-dz*t);if(d<best){best=d;bs=r.s0+t*r.l;bt=t;br=r;}}return{s:bs,r:br,t:bt,d:best};}
function roadS(x,z){const q=roadSeg(x,z);let bs=q.s;if(z>ROAD[0][1])bs=-(z-ROAD[0][1]);if(z<ROAD[ROAD.length-1][1])bs=ROAD_LEN+(ROAD[ROAD.length-1][1]-z);return bs;}
const _rp=new THREE.Vector3();
function roadPt(s,out){s=clamp(s,0,ROAD_LEN);out=out||_rp;for(const r of ROADS)if(s<=r.s0+r.l){const t=(s-r.s0)/r.l;return out.set(r.ax+(r.bx-r.ax)*t,0,r.az+(r.bz-r.az)*t);}const e=ROAD[ROAD.length-1];return out.set(e[0],0,e[1]);}
function roadN(s){let nx=0,nz=0;for(const r of ROADS){const k=clamp(1-Math.max(0,Math.max(r.s0-s,s-(r.s0+r.l)))/10,0,1);nx+=r.nx*k;nz+=r.nz*k;}const l=Math.hypot(nx,nz)||1;return{x:nx/l,z:nz/l};}
function latOf(x,z){const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t;return(x-px)*r.nx+(z-pz)*r.nz;}
// one lane here (no ridge between two canyons as on the Mountain): js/origin/03-play.js still asks for these
const SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0;
function laneC(s){return 0;}
function spineAt(s){return false;}
// the stretches of the way in, by distance along it
// the sealed door sits 3.3 m past node 11 (the last bend before the chamber); everything after it is measured from the door
const S_GATE=119,S_HOST=121,S_BAY0=162,S_BAY1=198,S_HALL0=240,S_HALL1=364,S_OLD=364,S_DOOR=S_NODE[11]+3.3,S_CH0=S_DOOR,
  S_RAMP=S_DOOR+48,S_SHUT=S_DOOR+52,RAMP0=S_DOOR+60,RAMP1=S_DOOR+132,S_HANGAR=S_DOOR+136;
function zoneOf(s){return s<0?'lz':s<S_HOST?'yard':s<S_HALL0?'host':s<S_HALL1?'hall':s<S_DOOR?'old':s<S_RAMP?'chamber':s<S_HANGAR?'ramp':'hangar';}
function laneHalf(s){
  if(s<S_HOST)return lerp(20,7.5,sstep(100,116,s));
  // the Host halls, with the loading bay (11 m either side) in the middle of them
  if(s<S_HALL0+8)return lerp(7,13,sstep(S_HALL0-4,S_HALL0+6,s))+4*sstep(S_BAY0-6,S_BAY0,s)*(1-sstep(S_BAY1,S_BAY1+6,s));
  if(s<S_HALL1+6)return lerp(13,7,sstep(S_HALL1-6,S_HALL1+3,s));
  if(s<S_DOOR+2)return lerp(7,5,sstep(S_DOOR-8,S_DOOR-2,s));
  return 5.5;}
// doors that close the way: dir +1 stops you going further than s, -1 stops you going back past it
const BARRIERS=[{id:'gate',s:S_GATE,dir:1,open:false},{id:'door',s:S_DOOR+1,dir:1,open:false},{id:'shutter',s:S_SHUT,dir:-1,open:true}];
function barrier(id){return BARRIERS.find(b=>b.id===id);}
/* the power room (Oct 22): off the chamber's west wall (your left as you walk in), a Host-built passage to the generator that feeds
   the object's containment field. A corridor (x0 at the chamber, x1 at the room) and a round room past it. Walkable once its door opens */
const VAULT={x0:CH.x-CH.r+2,x1:CH.x-40,z:CH.z,hw:3.4,cx:CH.x-51,cz:CH.z,r:12,open:false};
function vaultD(x,z){const mx=(VAULT.x0+VAULT.x1-3)/2,hx=(VAULT.x0-VAULT.x1+3)/2,qx=Math.abs(x-mx)-hx,qz=Math.abs(z-VAULT.z)-VAULT.hw;
  return Math.min(Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0),Math.hypot(x-VAULT.cx,z-VAULT.cz)-VAULT.r);}
// standing in the passage or the room (not the chamber)
function inVault(x,z){return x<CH.x-CH.r+.5&&vaultD(x,z)<.5;}
function inVaultRoom(x,z){return Math.hypot(x-VAULT.cx,z-VAULT.cz)<VAULT.r+.5;}
function inPlat(x,z,m){return Math.hypot(x-PLAT.x,z-PLAT.z)<PLAT.r+(m||0);}
// distance outside the walkable area (negative inside)
function playD(x,z){
  let d=Math.hypot(x-LZ.x,z-LZ.z)-LZ.r;
  const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t,lat=(x-px)*r.nx+(z-pz)*r.nz,along=Math.abs((x-px)*r.nz-(z-pz)*r.nx);
  const dl=Math.abs(lat)-laneHalf(q.s);d=Math.min(d,Math.hypot(Math.max(0,dl),along)+Math.min(0,dl));
  d=Math.min(d,Math.hypot(x-CH.x,z-CH.z)-CH.r,Math.hypot(x-PLAT.x,z-PLAT.z)-PLAT.r);
  if(VAULT.open)d=Math.min(d,vaultD(x,z));
  for(const b of BARRIERS)if(!b.open){const s=roadS(x,z);d=Math.max(d,b.dir>0?s-b.s:b.s-s);}
  for(const B of BLOCKS)d=Math.max(d,B.r-Math.hypot(x-B.x,z-B.z));   // fallen roof: solid
  return d;}
const BLOCKS=[];
// the floor: flat, except the ramp, which climbs to the hangar deck
function floorAt(x,z){if(inPlat(x,z,1))return PLAT_Y;const s=roadS(x,z);if(s<=RAMP0)return 0;return PLAT_Y*sstep(RAMP0,RAMP1,s);}
// the moon's own ground outside the facility: dust, a few craters, hills going up into the dark
const CRATERS=[[-70,90,26],[90,60,34],[-160,-40,48],[180,-200,60],[-220,-320,70],[60,180,40],[-60,240,30],[260,120,55],[-300,60,80]];
function moonY(x,z){let h=2.2*fbm(x*.012,z*.012)+.5*vnoise(x*.15,z*.15);
  for(const [cx,cz,cr] of CRATERS){const r=Math.hypot(x-cx,z-cz)/cr;if(r<1.6)h+=r<1?-cr*.09*(1-r*r):cr*.08*Math.exp(-(r-1)*(r-1)*14);}
  const far=Math.hypot(x,(z+180)*.8);h+=sstep(380,900,far)*(40+ridged(x*.004,z*.004)*160);
  return h;}
// the moon's own ground: a crater rim right at the edge of where you can walk (steep, so the edge reads), then the dust and hills
function moonGround(x,z,d){return .3*vnoise(x*.08,z*.08)+Math.min(d*1.6,8)+Math.max(0,Math.min(d-5,30))*.25+moonY(x,z)*sstep(0,20,d);}
// how far from the facility's footprint (its buried mass starts where this goes negative)
function footD(x,z){const s=roadS(x,z);if(s<-3)return 1e3;const q=roadSeg(x,z);
  let d=q.d-(laneHalf(clamp(s,0,ROAD_LEN))+56);if(s>ROAD_LEN)d=Math.max(d,s-ROAD_LEN-40);return Math.min(d,Math.hypot(x-PLAT.x,z-PLAT.z)-(PLAT.r+40),vaultD(x,z)-24);}
// how tall the walls are, by stretch: an open yard with a terrace above it, then roofs
const WALLH={lz:0,yard:12,host:8,hall:14,old:10,chamber:9,ramp:7,hangar:15,vault:9};
function inGallery(x,z,s){if(s<S_HALL0+6||s>S_HALL1-4)return false;const l=Math.abs(latOf(x,z)),h=laneHalf(s);return l>h&&l<h+3.4;}
function groundY(x,z){
  const d=playD(x,z);
  if(d<=0){const f=floorAt(x,z);return zoneOf(roadS(x,z))==='lz'&&!inPlat(x,z)?f+.3*vnoise(x*.08,z*.08):f;}
  const s=roadS(x,z),zn=inPlat(x,z,3)?'hangar':zoneOf(s);
  if(zn==='lz'){if(footD(x,z)<0)return 30;return moonGround(x,z,d);}
  if(zn==='hall'&&inGallery(x,z,s))return 5;
  if(zn==='hangar'&&x>PLAT.x+6&&Math.abs(z-PLAT.z)<PLAT.r+4)return Math.min(moonY(x,z),PLAT_Y-8);   // off the open edge of the deck: a long drop
  return floorAt(x,z)+(zn==='yard'?WALLH.yard:40);}
// the ceiling over a point (the camera stays under it)
let hangarOpen=false;
function ceilAt(x,z){if(inPlat(x,z,2))return hangarOpen?1e4:PLAT_Y+WALLH.hangar-.5;if(inVault(x,z))return WALLH.vault;const s=roadS(x,z),zn=zoneOf(s);
  if(zn==='lz'||zn==='yard')return 1e4;if(zn==='chamber')return Math.hypot(x-CH.x,z-CH.z)<CH.r+.5?15:9;return floorAt(x,z)+WALLH[zn];}
// keep the over-the-shoulder camera inside the walls and under the roof (js/origin/03-play.js calls this)
function camClamp(head){const c=camera.position;if(zoneOf(roadS(c.x,c.z))!=='lz'||playD(c.x,c.z)>3){
  let k=1;while(k>.1&&playD(head.x+(c.x-head.x)*k,head.z+(c.z-head.z)*k)>-.3)k-=.06;
  c.set(head.x+(c.x-head.x)*k,head.y+(c.y-head.y)*k,head.z+(c.z-head.z)*k);}
  const ce=ceilAt(c.x,c.z)-.5;if(c.y>ce)c.y=ce;}

/* ---------- materials ---------- */
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
// colours
const K_DARK=C(0x221d2a),K_DARK2=C(0x302838),K_SIL=C(0x9a9ca8),K_PALE=C(0xd8d0c4),K_PALE2=C(0xbcb2a6),W1=C(0xffffff),K_STRIP=C(0xcfe6ff),K_GOLD=C(0xffd27a);

/* ---------- the moon's ground: one mesh, fine around the LZ, coarse out in the hills; under the facility it drops away ---------- */
{const steps=(a,b,fine,lo,hi,cs)=>{const o=[];let v=a;while(v<b){o.push(v);v+=(v>=lo&&v<hi)?fine:cs;}o.push(b);return o;};
 const xs=steps(-1100,1100,coarse?2.6:1.9,-130,130,coarse?22:16),zs=steps(-1300,900,coarse?2.6:1.9,-30,140,coarse?22:16);
 const NX=xs.length,NZ=zs.length,pos=new Float32Array(NX*NZ*3),col=new Float32Array(NX*NZ*3),a=C(0x6a6670),b=C(0x4a4652),tmp=new THREE.Color();
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=xs[i],z=zs[j],k=(j*NX+i)*3;let y;
   const fd=footD(x,z);if(fd<-1)y=-4;else{const d=playD(x,z);y=d<=0?groundY(x,z):moonGround(x,z,d);if(fd<8)y=Math.min(y,lerp(-4,y,sstep(-1,8,fd)));}
   pos[k]=x;pos[k+1]=y;pos[k+2]=z;const n=vnoise(x*.05,z*.05);tmp.copy(a).lerp(b,n).multiplyScalar(.85+.3*vnoise(x*.3,z*.3));
   col[k]=tmp.r;col[k+1]=tmp.g;col[k+2]=tmp.b;}
 const idx=new Uint32Array((NX-1)*(NZ-1)*6);let q=0;
 for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const p=j*NX+i,r=p+1,c=p+NX,d=c+1;idx[q++]=p;idx[q++]=c;idx[q++]=r;idx[q++]=r;idx[q++]=c;idx[q++]=d;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
 const m=new THREE.Mesh(g,groundTerrainMat({desat:.75,boost:2.4,bump:.8}));m.receiveShadow=true;scene.add(m);}

/* ---------- obstacles: circles for collision, cover and line of sight (OBST); long barricades also go in BARS ---------- */
const OBST=[],BARS=[];
function addBarricade(x,z,ry,w){const m=new Merger(),gm=new Merger(),y=groundY(x,z);
  m.add(boxUV(w,1.25,.8,2),M(0,.62,0),K_DARK);m.add(boxUV(w*.98,.1,.84,2),M(0,1.26,0),K_SIL);m.add(boxUV(w*.2,1.5,.9,2),M(-w*.4,.75,0),K_DARK2);m.add(boxUV(w*.2,1.5,.9,2),M(w*.4,.75,0),K_DARK2);
  gm.add(new THREE.BoxGeometry(w*.6,.07,.02),M(0,.9,.42),W1);gm.add(new THREE.BoxGeometry(w*.6,.07,.02),M(0,.9,-.42),W1);
  const o=new THREE.Mesh(m.build(),hostMat),gl=new THREE.Mesh(gm.build(),purpleGlow);for(const k of[o,gl]){k.position.set(x,y,z);k.rotation.y=ry;scene.add(k);}o.castShadow=o.receiveShadow=true;
  const n=Math.max(1,Math.round(w/1.4));for(let i=0;i<n;i++){const u=(i+.5)/n-.5;OBST.push({x:x+Math.cos(ry)*u*w,z:z-Math.sin(ry)*u*w,r:.75,h:1.3,bar:true});}
  BARS.push({ax:x-Math.cos(ry)*w/2,az:z+Math.sin(ry)*w/2,bx:x+Math.cos(ry)*w/2,bz:z-Math.sin(ry)*w/2,r:.75});}
// Host cargo pods: six-sided, black, a silver band and a purple seam
function addPod(x,z,s,ry){const m=new Merger(),gm=new Merger(),y=groundY(x,z);const c=new THREE.CylinderGeometry(s*.55,s*.6,s,6);m.add(c,M(0,s/2,0),K_DARK);m.add(new THREE.CylinderGeometry(s*.58,s*.58,s*.1,6),M(0,s*.72,0),K_SIL);
  gm.add(new THREE.CylinderGeometry(s*.605,s*.605,s*.03,6),M(0,s*.4,0),W1);const o=new THREE.Mesh(m.build(),hostMat),gl=new THREE.Mesh(gm.build(),purpleGlow);
  for(const k of[o,gl]){k.position.set(x,y,z);k.rotation.y=ry==null?R(0,3):ry;scene.add(k);}o.castShadow=o.receiveShadow=true;OBST.push({x,z,r:s*.62,h:s});}
// fallen blocks of the old stone
function addBlock(x,z,s){const g=new THREE.BoxGeometry(s*R(1,1.6),s*R(.6,1),s*R(.8,1.2));const P=g.attributes.position;for(let i=0;i<P.count;i++)P.setXYZ(i,P.getX(i)*R(.9,1.1),P.getY(i),P.getZ(i)*R(.9,1.1));g.computeVertexNormals();
  const col=[];for(let i=0;i<P.count;i++)col.push(K_PALE2.r,K_PALE2.g,K_PALE2.b);g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(g,oldMat);m.position.set(x,groundY(x,z)+s*.35,z);m.rotation.set(R(-.15,.15),R(0,3),R(-.15,.15));m.castShadow=m.receiveShadow=true;scene.add(m);OBST.push({x,z,r:s*.7,h:s*.8});}
// the LZ: boulders on the crater floor
const ROCKS=[];
function addRock(x,z,r){const ys=R(.4,.8),g=new THREE.DodecahedronGeometry(r,1),P=g.attributes.position;for(let i=0;i<P.count;i++){const k=.8+.4*hash(Math.round(P.getX(i)*7/r)*13+Math.round(P.getY(i)*7/r)*7+((x*7)|0),Math.round(P.getZ(i)*7/r)*11+((z*5)|0));P.setXYZ(i,P.getX(i)*k,P.getY(i)*k,P.getZ(i)*k);}
  g.scale(1,ys,1);g.computeVertexNormals();const col=[];for(let i=0;i<P.count;i++)col.push(.42,.4,.45);g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(g,rockMat2);m.position.set(x,groundY(x,z)+r*ys*.3,z);m.rotation.y=R(0,3);m.castShadow=m.receiveShadow=true;scene.add(m);OBST.push({x,z,r:r*.9,h:r*ys*1.5});ROCKS.push(m);}
for(const [x,z,r] of[[-18,44,1.4],[16,50,1.1],[-8,22,.9],[22,26,1.6],[-26,28,1.2],[6,60,1.3],[-14,8,1],[12,12,.8]])addRock(x,z,r);

/* ---------- walls, floors and roofs, built along the boundary of the walkable area ---------- */
const OPEN_ALL=()=>{const k=BARRIERS.map(b=>b.open);BARRIERS.forEach(b=>b.open=true);return()=>BARRIERS.forEach((b,i)=>b.open=k[i]);};
const hm=new Merger(),hg=new Merger(),hs=new Merger(),om=new Merger(),og=new Merger(),wn=new Merger();   // host hull, host glow, strip lights, old stone, old glow
const SHADOWLESS=new Merger();   // floors and ceilings (they don't need to cast)
const restore=OPEN_ALL();VAULT.open=true;
// one piece of wall: centre (x,z), running along unit (tx,tz), facing inward along (nx,nz)
function wallPiece(zn,x,z,tx,tz,nx,nz,len,y0,s){
  const ry=Math.atan2(-tz,tx),H=WALLH[zn]||10;
  if(zn==='yard'){hm.add(boxUV(len,H,1.4,3),M(x,y0+H/2,z,0,ry,0),K_DARK);hg.add(new THREE.BoxGeometry(len,.12,.04),M(x+nx*.72,y0+2.1,z+nz*.72,0,ry,0),W1);
    hm.add(boxUV(len,.5,2.2,3),M(x+nx*.2,y0+H+.25,z+nz*.2,0,ry,0),K_SIL);
    if(((s/3)|0)%4===0){hm.add(boxUV(1.8,H+1.4,1.6,3),M(x+nx*.9,y0+(H+1.4)/2,z+nz*.9,0,ry,0),K_DARK2);hm.add(new THREE.ConeGeometry(.5,3,4),M(x+nx*1.2,y0+H+2.6,z+nz*1.2,-nz*.4,0,nx*.4),K_SIL);
      hm.add(boxUV(1.5,2.8,.3,3),M(x+nx*.78,y0+H-4.4,z+nz*.78,0,ry,0),K_SIL);wn.add(new THREE.BoxGeometry(1.1,2.3,.06),M(x+nx*.95,y0+H-4.4,z+nz*.95,0,ry,0),W1);}}
  else if(zn==='host'||zn==='ramp'||zn==='vault'){hm.add(boxUV(len,H,1,3),M(x,y0+H/2,z,0,ry,0),K_DARK);
    hs.add(new THREE.BoxGeometry(len,.08,.04),M(x+nx*.52,y0+2.6,z+nz*.52,0,ry,0),K_STRIP);hg.add(new THREE.BoxGeometry(len,.06,.04),M(x+nx*.52,y0+.25,z+nz*.52,0,ry,0),W1);
    if(((s/3)|0)%2===0){hm.add(boxUV(.7,H,.9,3),M(x+nx*.7,y0+H/2,z+nz*.7,0,ry,0),K_DARK2);hm.add(boxUV(.72,.4,.95,3),M(x+nx*.7,y0+1.3,z+nz*.7,0,ry,0),K_SIL);}}
  else if(zn==='hall'){   // the gallery: a 5 m face, a parapet, a walkway, then the back wall up to the roof
    hm.add(boxUV(len,5,1,3),M(x,y0+2.5,z,0,ry,0),K_DARK);hm.add(boxUV(len,1.1,.5,3),M(x,y0+5.55,z,0,ry,0),K_DARK2);hm.add(boxUV(len,.12,.6,3),M(x,y0+6.15,z,0,ry,0),K_SIL);
    hm.add(boxUV(len,.3,3.6,3),M(x-nx*1.8,y0+4.85,z-nz*1.8,0,ry,0),K_DARK2);
    hm.add(boxUV(len,H-5,1,3),M(x-nx*3.6,y0+5+(H-5)/2,z-nz*3.6,0,ry,0),K_DARK);hs.add(new THREE.BoxGeometry(len,.08,.04),M(x-nx*3.08,y0+8,z-nz*3.08,0,ry,0),K_STRIP);
    hg.add(new THREE.BoxGeometry(len,.06,.04),M(x+nx*.52,y0+4.6,z+nz*.52,0,ry,0),W1);}
  else if(zn==='old'||zn==='chamber'){om.add(boxUV(len,H,1.2,3),M(x,y0+H/2,z,0,ry,0),K_PALE);
    // ribs like the inside of a shell, and fine gold lines through the stone
    if(((s/2.4)|0)%3===0){const rb=new THREE.CylinderGeometry(.22,.4,H*1.02,6);om.add(rb,M(x+nx*.7,y0+H/2,z+nz*.7,nz*.08,0,-nx*.08),K_PALE2);}
    og.add(new THREE.BoxGeometry(len,.035,.03),M(x+nx*.62,y0+1.6+Math.sin(s*.35)*.4,z+nz*.62,0,ry,0),K_GOLD);
    if(zn==='old')og.add(new THREE.BoxGeometry(len,.03,.03),M(x+nx*.62,y0+6.4+Math.sin(s*.2+1)*.8,z+nz*.62,0,ry,0),K_GOLD);}
  else if(zn==='hangar'){hm.add(boxUV(len,H,1.4,3),M(x,y0+H/2,z,0,ry,0),K_DARK);hs.add(new THREE.BoxGeometry(len,.1,.04),M(x+nx*.72,y0+3,z+nz*.72,0,ry,0),K_STRIP);
    hg.add(new THREE.BoxGeometry(len,.08,.04),M(x+nx*.72,y0+9,z+nz*.72,0,ry,0),W1);}
}
// along the way in (both sides)
for(let s=0;s<=ROAD_LEN+4;s+=1.5){const zn=zoneOf(s);if(zn==='lz')continue;
  const p=roadPt(Math.min(s,ROAD_LEN)).clone(),n=roadN(Math.min(s,ROAD_LEN)),h=laneHalf(s),tx=n.z,tz=-n.x;
  for(const side of[-1,1]){const ox=p.x+n.x*side*(h+.6),oz=p.z+n.z*side*(h+.6);
    if(playD(ox+n.x*side*.6,oz+n.z*side*.6)<.2||playD(ox-n.x*side*1.4,oz-n.z*side*1.4)>-.2)continue;
    if(zn==='yard'&&s<4)continue;
    wallPiece(inPlat(ox,oz,2)?'hangar':zn,ox,oz,tx,tz,-n.x*side,-n.z*side,2.2,floorAt(p.x,p.z),s);}}
// round rooms: the chamber, and the hangar (whose east side is open to the sky)
for(const [c,zn,y0] of[[CH,'chamber',0],[PLAT,'hangar',PLAT_Y]])for(let a=0;a<Math.PI*2;a+=1.4/c.r){
  const ox=c.x+Math.cos(a)*(c.r+.6),oz=c.z+Math.sin(a)*(c.r+.6);
  if(zn==='hangar'&&Math.cos(a)>.35)continue;
  if(playD(ox+Math.cos(a)*.6,oz+Math.sin(a)*.6)<.2||playD(ox-Math.cos(a)*1.4,oz-Math.sin(a)*1.4)>-.2)continue;
  wallPiece(zn,ox,oz,-Math.sin(a),Math.cos(a),-Math.cos(a),-Math.sin(a),1.6,y0,a*c.r);}
// the power room: its passage (both sides) and its round wall, Host work bolted onto the old stone
for(let x=VAULT.x1-2;x<=VAULT.x0+1;x+=1.6)for(const side of[-1,1]){const ox=x,oz=VAULT.z+side*(VAULT.hw+.6);
  if(playD(ox,oz+side*.6)<.2||playD(ox,oz-side*1.4)>-.2)continue;
  wallPiece('vault',ox,oz,1,0,0,-side,2.2,0,x);}
for(let a=0;a<Math.PI*2;a+=1.4/VAULT.r){const ox=VAULT.cx+Math.cos(a)*(VAULT.r+.6),oz=VAULT.cz+Math.sin(a)*(VAULT.r+.6);
  if(playD(ox+Math.cos(a)*.6,oz+Math.sin(a)*.6)<.2||playD(ox-Math.cos(a)*1.4,oz-Math.sin(a)*1.4)>-.2)continue;
  wallPiece('vault',ox,oz,-Math.sin(a),Math.cos(a),-Math.cos(a),-Math.sin(a),1.6,0,a*VAULT.r);}
{const L=VAULT.x0-VAULT.x1+4,mx=(VAULT.x0+VAULT.x1)/2,w=VAULT.hw*2;
  hm.add(boxUV(L,.3,w+1.2,3),M(mx,-.15,VAULT.z),C(0x34303c));hm.add(new THREE.CylinderGeometry(VAULT.r+.5,VAULT.r+.5,.3,48),M(VAULT.cx,-.15,VAULT.cz),C(0x34303c));
  hm.add(boxUV(L,.8,w+2.6,3),M(mx,WALLH.vault+.4,VAULT.z),K_DARK2);hm.add(new THREE.CylinderGeometry(VAULT.r+1.2,VAULT.r+1.2,.8,48),M(VAULT.cx,WALLH.vault+.4,VAULT.cz),K_DARK2);
  for(let x=VAULT.x1;x<VAULT.x0;x+=6){hm.add(boxUV(.5,.6,w+.4,3),M(x,WALLH.vault-.25,VAULT.z),K_DARK);hs.add(new THREE.BoxGeometry(.3,.05,1.2),M(x+3,WALLH.vault-.06,VAULT.z),K_STRIP);
    hg.add(new THREE.BoxGeometry(.08,.02,w*.8),M(x+3,.02,VAULT.z),W1);}
  for(let k=0;k<3;k++)hg.add(new THREE.TorusGeometry(4+k*3.2,.05,4,64),M(VAULT.cx,.03,VAULT.cz,Math.PI/2,0,0),W1);
  // ribs across the room's ceiling, a ring of strip light
  for(let k=0;k<6;k++)hm.add(boxUV(VAULT.r*2,.5,.6,3),M(VAULT.cx,WALLH.vault-.3,VAULT.cz,0,k/6*Math.PI,0),K_DARK);
  hs.add(new THREE.TorusGeometry(VAULT.r-1.2,.05,4,64),M(VAULT.cx,WALLH.vault-.6,VAULT.cz,Math.PI/2,0,0),K_STRIP);}
// the chamber is taller than its doorway: carved rings around it, and a low dome
{const H=15;for(let a=0;a<Math.PI*2;a+=1.3/CH.r){const x=CH.x+Math.cos(a)*(CH.r+.6),z=CH.z+Math.sin(a)*(CH.r+.6);om.add(boxUV(1.5,H-9,1.2,3),M(x,9+(H-9)/2,z,0,Math.atan2(-Math.cos(a),-Math.sin(a)),0),K_PALE);}
 for(const y of[3,6.5,10.5,13.6])og.add(new THREE.TorusGeometry(CH.r-.02,.035,4,96),M(CH.x,y,CH.z,Math.PI/2,0,0),K_GOLD);
 const dome=new THREE.SphereGeometry(CH.r+1.2,40,14,0,Math.PI*2,0,Math.PI/2);dome.scale(1,.42,1);om.add(dome,M(CH.x,H-.4,CH.z),K_PALE2);
 og.add(new THREE.CircleGeometry(2.2,32),M(CH.x,H+6.3,CH.z,Math.PI/2,0,0),K_GOLD);}
// the path out to the landing zone: the yard's floor carried on 36 m past the gateposts, so it doesn't stop short in the dust
{const p0=roadPt(0).clone(),p1=roadPt(2).clone(),fw=p1.clone().sub(p0).normalize(),n=roadN(0),ry=Math.atan2(n.z,-n.x),w=laneHalf(0)*2+2.4;
  for(let d=2;d<=36;d+=2){const x=p0.x-fw.x*d,z=p0.z-fw.z*d,fy=floorAt(x,z);hm.add(new THREE.BoxGeometry(w*(1-d/90),.3,2.25),M(x,fy-.12,z,0,ry,0),C(0x2a2630));
    if(d%8===0)hg.add(new THREE.BoxGeometry(w*.8*(1-d/90),.02,.08),M(x,fy+.04,z,0,ry,0),W1);}}
// floors
for(let s=0;s<=ROAD_LEN;s+=2){const zn=zoneOf(s),p=roadPt(s).clone(),n=roadN(s),h=laneHalf(s)+1.2,ry=Math.atan2(n.z,-n.x);
  const f0=floorAt(...[roadPt(Math.max(0,s-1),new THREE.Vector3())].map(v=>[v.x,v.z])[0]),f1=floorAt(...[roadPt(Math.min(ROAD_LEN,s+1),new THREE.Vector3())].map(v=>[v.x,v.z])[0]),fy=(f0+f1)/2,pitch=Math.atan2(f1-f0,2);
  const col=zn==='old'||zn==='chamber'?K_PALE2:zn==='yard'?C(0x2a2630):C(0x34303c);
  const g=new THREE.BoxGeometry(h*2+(zn==='hall'?7:0),.3,2.25);(zn==='old'||zn==='chamber'?om:hm).add(g,M(p.x,fy-.15,p.z,0,ry,0).multiply(M(0,0,0,-pitch,0,0)),col);
  if(zn==='yard'||zn==='host'||zn==='ramp'){if(s%8===0)hg.add(new THREE.BoxGeometry(h*1.6,.02,.08),M(p.x,fy+.02,p.z,0,ry,0).multiply(M(0,0,0,-pitch,0,0)),W1);}
  // roofs over everything after the gate
  if(zn!=='yard'&&zn!=='lz'&&zn!=='chamber'&&!inPlat(p.x,p.z,-4)){const H=WALLH[zn]||9;const w=h*2+(zn==='hall'?8:1.6);
    hm.add(boxUV(w,.8,2.3,3),M(p.x,fy+H+.4,p.z,0,ry,0).multiply(M(0,0,0,-pitch,0,0)),K_DARK2);
    if(s%6===0)hm.add(boxUV(w,.6,.5,3),M(p.x,fy+H-.25,p.z,0,ry,0),K_DARK);
    if(zn!=='old'&&s%6===0)hs.add(new THREE.BoxGeometry(1.2,.05,.3),M(p.x,fy+H-.56,p.z,0,ry,0),K_STRIP);}
  else if(zn==='chamber'&&Math.hypot(p.x-CH.x,p.z-CH.z)>CH.r)om.add(boxUV(h*2+1.6,.8,2.3,3),M(p.x,9.4,p.z,0,ry,0),K_PALE2);}
// the old stretch: arches across the way, like ribs (nobody cut these: they grew, or were poured, or something else)
for(let s=S_OLD+4;s<S_DOOR-2;s+=7){const p=roadPt(s).clone(),n=roadN(s),h=laneHalf(s)+.6;const a=new THREE.TorusGeometry(h,.45,8,24,Math.PI);
  const ar=Math.atan2(-n.z,n.x);om.add(a,M(p.x,0,p.z,0,ar,0).multiply(mat4(0,0,0,1,1.25,1)),K_PALE);og.add(new THREE.TorusGeometry(h-.42,.03,4,32,Math.PI),M(p.x,0,p.z,0,ar,0).multiply(mat4(0,0,0,1,1.25,1)).multiply(M(0,0,.46)),K_GOLD);}
// the chamber floor: rings set into the stone
og.add(new THREE.TorusGeometry(4.6,.04,4,64),M(CH.x,.03,CH.z,Math.PI/2,0,0),K_GOLD);og.add(new THREE.TorusGeometry(9,.04,4,96),M(CH.x,.03,CH.z,Math.PI/2,0,0),K_GOLD);
for(let k=0;k<12;k++){const a=k/12*Math.PI*2;og.add(new THREE.BoxGeometry(4.2,.02,.05),M(CH.x+Math.cos(a)*6.8,.03,CH.z+Math.sin(a)*6.8,0,-a,0),K_GOLD);}
om.add(new THREE.CylinderGeometry(CH.r+.5,CH.r+.5,.3,64),M(CH.x,-.15,CH.z),K_PALE2);
// the hangar deck
hm.add(new THREE.CylinderGeometry(PLAT.r+.6,PLAT.r+.6,.4,48),M(PLAT.x,PLAT_Y-.2,PLAT.z),C(0x2c2834));
for(let k=0;k<3;k++)hg.add(new THREE.TorusGeometry(6+k*6,.06,4,64),M(PLAT.x,PLAT_Y+.03,PLAT.z,Math.PI/2,0,0),W1);
// the open edge: a low rail and lights along the drop
for(let a=-.95;a<=.95;a+=.08){const x=PLAT.x+Math.cos(a)*(PLAT.r+.3),z=PLAT.z+Math.sin(a)*(PLAT.r+.3);hm.add(boxUV(.12,1,.12,1),M(x,PLAT_Y+.5,z),K_SIL);hs.add(new THREE.BoxGeometry(.2,.06,.2),M(x,PLAT_Y+.04,z),K_STRIP);}
hm.add(new THREE.TorusGeometry(PLAT.r+.3,.05,4,64,1.9),M(PLAT.x,PLAT_Y+1,PLAT.z,Math.PI/2,0,.95),K_SIL);
// the underside of the deck, seen from outside
hm.add(new THREE.CylinderGeometry(PLAT.r+.6,PLAT.r*.6,8,24),M(PLAT.x,PLAT_Y-4.4,PLAT.z),K_DARK);
/* ---------- doors that don't open (Oct 22, Bryce: make it feel like there's life behind the walls). Host doors along the yard, the
   halls and up on the gallery behind the riflemen; sealed pointed arches in the old stone; a pair in the power room's passage and the
   hangar's big ones. Set into walls that already stop you (js/shared/doors.js) ---------- */
{const ARCH0=S_OLD+4,last={};const FACE={yard:.7,host:.5,hall:.5,old:.6};
 const wallAt=(s,side)=>{const p=roadPt(s).clone(),n=roadN(s),h=laneHalf(s),ox=p.x+n.x*side*(h+.6),oz=p.z+n.z*side*(h+.6);
   return(playD(ox+n.x*side*.6,oz+n.z*side*.6)<.2||playD(ox-n.x*side*1.4,oz-n.z*side*1.4)>-.2)?null:{p,n,ox,oz};};
 for(let s=6;s<S_DOOR-3;s+=.5){const zn=zoneOf(s);if(!FACE[zn])continue;
   if(Math.abs(s-S_GATE)<8||Math.abs(s-S_DOOR)<7||Math.abs(laneHalf(s+2)-laneHalf(s-2))>.12)continue;
   if(zn==='yard'&&Math.abs(s%12-7.5)>.01)continue;                     // between the buttresses
   if((zn==='host')&&Math.abs(s%6-4.5)>.01)continue;                    // between the pilasters
   if(zn==='old'&&(Math.abs(s%7.2-4.8)>.26||Math.abs(((s-ARCH0)%7+7)%7-3.5)>2))continue;   // between the ribs, away from the arches
   const gap={yard:20,host:13,hall:15,old:22}[zn];
   for(const side of[-1,1]){const key=side;if(last[key]!=null&&s-last[key]<gap)continue;
     if(!wallAt(s-1.6,side)||!wallAt(s+1.6,side))continue;const W=wallAt(s,side);if(!W)continue;
     const nx=-W.n.x*side,nz=-W.n.z*side,f=FACE[zn],fy=floorAt(W.p.x,W.p.z);
     if(zn==='old')DOORS.add('old',W.ox+nx*f,fy,W.oz+nz*f,nx,nz);
     else{DOORS.add('host',W.ox+nx*f,fy,W.oz+nz*f,nx,nz,{light:rng()>.15});
       if(zn==='hall')DOORS.add('host',W.ox-nx*3.1,fy+5,W.oz-nz*3.1,nx,nz,{light:rng()>.25});}   // and one on the gallery, behind the riflemen
     last[key]=s;}}
 // the power room's passage (one each side) and two round its wall
 for(const side of[-1,1]){const x=(VAULT.x0+VAULT.x1)/2+side*5,z=VAULT.z+side*(VAULT.hw+.1);DOORS.add('host',x,0,z,0,-side);}
 for(const a of[Math.PI*.5,Math.PI*1.5]){const x=VAULT.cx+Math.cos(a)*(VAULT.r+.1),z=VAULT.cz+Math.sin(a)*(VAULT.r+.1);DOORS.add('host',x,0,z,-Math.cos(a),-Math.sin(a));}
 // the hangar: two big cargo doors in its back wall
 for(const a of[Math.PI*.85,Math.PI*1.2]){const x=PLAT.x+Math.cos(a)*(PLAT.r-.1),z=PLAT.z+Math.sin(a)*(PLAT.r-.1);DOORS.add('host',x,PLAT_Y,z,-Math.cos(a),-Math.sin(a),{s:1.9});}
 DOORS.build(scene);}
restore();VAULT.open=false;

/* ---------- the facility's mass: stepped black blocks along both sides and over the roofs, sloping into the dust, with spires.
   From the yard it reads as a terrace over the wall and something far bigger behind it ---------- */
const SPIRES=[];
{const restore2=OPEN_ALL();
 for(let s=-2;s<ROAD_LEN+40;s+=11){const sc=clamp(s,0,ROAD_LEN),p=roadPt(sc).clone(),n=roadN(sc),h=laneHalf(sc),zn=zoneOf(sc),ry=Math.atan2(n.z,-n.x),top=zn==='yard'?12:(WALLH[zn]||9)+1.2;
   for(const side of[-1,1]){
     if(zn==='yard'&&sc>4&&sc<S_GATE-2){const mid=h+2.9,x=p.x+n.x*side*mid,z=p.z+n.z*side*mid;hm.add(boxUV(3.6,1,11.6,6),M(x,11.5,z,0,ry,0),K_DARK2);}   // the walkway, flat at 12 m
     const a0=h+(zn==='hall'?4.6:zn==='yard'?4.6:1.4),tiers=[[a0,h+16,top+(zn==='yard'?R(3,6):R(0,1.5))],[h+16,h+34,top+R(8,22)],[h+34,h+58,top+R(2,12)]];
     for(const [a,b,H] of tiers){const mid=(a+b)/2,x=p.x+n.x*side*mid,z=p.z+n.z*side*mid;
       if(inPlat(x,z,22)||(x>PLAT.x+4&&Math.abs(z-PLAT.z)<PLAT.r+30))continue;
       if(playD(x,z)<(b-a)/2+.5||vaultD(x,z)<Math.hypot((b-a)/2,5.8)+1.5)continue;
       hm.add(boxUV(b-a,H+6,11.6,6),M(x,(H-6)/2,z,0,ry,0),rng()<.3?K_DARK2:K_DARK);
       if(rng()<.45)for(let k=-1;k<=1;k++){const f=(b-a)/2+.03,cx=x+n.x*side*f,cz=z+n.z*side*f,tx=-n.z,tz=n.x;   // a row of three windows on the face toward the way in
         wn.add(new THREE.BoxGeometry(.06,1.1,2),M(cx+tx*k*3.2,H-2.2,cz+tz*k*3.2,0,ry,0),W1);}}
   }
   // over the roof
   if(zn!=='yard'&&zn!=='lz'&&s<ROAD_LEN-6&&!(VAULT&&Math.abs(p.z-VAULT.z)<20&&p.x<CH.x-CH.r-1)){const H=(WALLH[zn]||9)+(zn==='chamber'?8:2);hm.add(boxUV(h*2+3,2.5,11.6,6),M(p.x,H+.8+floorAt(p.x,p.z),p.z,0,ry,0),K_DARK2);}
 }
 // the front, either side of the yard's mouth, leaning back into the ground
 for(const sx of[-1,1])for(let x=22;x<80;x+=12){hm.add(boxUV(12,22,10,6),M(sx*(x+6),5,-2,-.25,0,0),K_DARK);hm.add(new THREE.ConeGeometry(.9,8,4),M(sx*(x+6),17,-4,-.6,0,0),K_SIL);}
 // spires: tall black needles with purple light climbing them, a crown of spines, a lamp at the tip
 for(const [s,lat,H] of[[30,-48,70],[60,52,95],[140,-40,120],[200,46,150],[260,-52,110],[330,44,180],[390,-44,130],[150,60,85],[440,52,165],[300,64,95],[530,48,140],[600,52,120]]){const p=roadPt(s).clone(),n=roadN(s),x=p.x+n.x*lat,z=p.z+n.z*lat;
   hm.add(new THREE.CylinderGeometry(1.5,5,H,6),M(x,H/2,z),K_DARK);hm.add(new THREE.CylinderGeometry(0,1.5,H*.25,6),M(x,H+H*.12,z),K_SIL);
   for(let k=0;k<6;k++){const a=k/6*Math.PI*2;hm.add(new THREE.ConeGeometry(.35,7,4),M(x+Math.cos(a)*2.4,H*.82,z+Math.sin(a)*2.4,Math.sin(a)*.6,0,-Math.cos(a)*.6),K_SIL);}
   for(let y=6;y<H*.8;y+=7)hg.add(new THREE.BoxGeometry(.3,3,.3),M(x+2.6,y,z),W1);
   const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(HOST_GLOW).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.scale.setScalar(14);l.position.set(x,H*1.25,z);scene.add(l);SPIRES.push({l,x,z,H});}
 restore2();}

/* the merged meshes */
const meshHost=new THREE.Mesh(hm.build(),hostMat);meshHost.castShadow=meshHost.receiveShadow=true;scene.add(meshHost);
const meshOld=new THREE.Mesh(om.build(),oldMat);meshOld.castShadow=meshOld.receiveShadow=true;scene.add(meshOld);
scene.add(new THREE.Mesh(hg.build(),purpleGlow),new THREE.Mesh(hs.build(),stripMat),new THREE.Mesh(og.build(),goldGlow),new THREE.Mesh(wn.build(),winMat));

/* ---------- the gate: two leaves of black armour across the yard's end, a silver frame, a purple seam. Blown open by the charge ---------- */
const GATE=(()=>{const p=roadPt(S_GATE).clone(),n=roadN(S_GATE),ry=Math.atan2(n.z,-n.x),W=16,H=11;
  const fr=new Merger(),fg=new Merger();fr.add(boxUV(W+4,3,2.4,3),M(0,H+1.5,0),K_DARK2);for(const s of[-1,1]){fr.add(boxUV(2,H+3,2.6,3),M(s*(W/2+1),(H+3)/2,0),K_SIL);fr.add(new THREE.ConeGeometry(.6,4,4),M(s*(W/2+1),H+5,0),K_SIL);}
  fg.add(new THREE.BoxGeometry(W,.2,.1),M(0,H+.4,1.3),W1);
  const frame=new THREE.Group();frame.position.set(p.x,0,p.z);frame.rotation.y=ry;scene.add(frame);const fm=new THREE.Mesh(fr.build(),hostMat);fm.castShadow=true;frame.add(fm,new THREE.Mesh(fg.build(),purpleGlow));
  const leaves=[];for(const s of[-1,1]){const lm=new Merger(),lg=new Merger();lm.add(boxUV(W/2,H,1.2,3),M(0,H/2,0),K_DARK);
    for(let k=0;k<4;k++)lm.add(boxUV(W/2-1,.4,1.4,3),M(0,1.5+k*2.6,0),K_DARK2);lm.add(boxUV(.4,H,1.5,3),M(-s*(W/4-.2),H/2,0),K_SIL);
    lg.add(new THREE.BoxGeometry(.12,H-1,.05),M(-s*(W/4-.5),H/2,.78),W1);lg.add(new THREE.BoxGeometry(.12,H-1,.05),M(-s*(W/4-.5),H/2,-.78),W1);
    const L=new THREE.Group();L.position.set(s*W/4,0,0);frame.add(L);const lmm=new THREE.Mesh(lm.build(),hostMat);lmm.castShadow=true;L.add(lmm,new THREE.Mesh(lg.build(),purpleGlow));leaves.push({L,s,x0:s*W/4,v:new THREE.Vector3(),spin:0});}
  // the charge on the seam, once it's planted
  const charge=new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.3),new THREE.MeshStandardMaterial({color:C(0x3a4a3a),roughness:.5,metalness:.4,emissive:C(0xff4020),emissiveIntensity:0}));charge.position.set(0,1.6,-1);charge.visible=false;frame.add(charge);
  return{frame,leaves,charge,p,n,blown:false,t:0};})();
function blowGate(){if(GATE.blown)return;GATE.blown=true;barrier('gate').open=true;GATE.charge.visible=false;
  const c=GATE.frame.position.clone().setY(3);if(typeof sfx!=='undefined')sfx.blast(c);boom(c,14,0xfff0c0,.6);boom(c,22,0xff8a3a,1.4);for(let i=0;i<10;i++)puff(c.clone().add(new THREE.Vector3(R(-6,6),R(0,8),R(-3,3))),R(3,6),R(2,3.5));
  for(const L of GATE.leaves){L.v.set(-L.s*R(2,4),R(4,7),R(6,9));L.spin=L.s*R(.8,1.6);}}
function updateGate(dt){if(!GATE.blown)return;GATE.t+=dt;for(const L of GATE.leaves){if(GATE.t>3)continue;L.v.y-=14*dt;L.L.position.addScaledVector(L.v,dt*.3);L.L.rotation.z+=L.spin*dt*.4;L.L.rotation.x-=dt*.5;
  if(L.L.position.y<-2){L.L.position.y=-2;L.v.set(0,0,0);L.spin=0;}}}

/* ---------- the sealed door: a round stone door at the end of the old stretch; its six petals turn aside ---------- */
const DOOR=(()=>{const p=roadPt(S_DOOR).clone(),n=roadN(S_DOOR),ry=Math.atan2(n.z,-n.x),G=new THREE.Group();G.position.set(p.x,0,p.z);G.rotation.y=ry;scene.add(G);
  const fr=new THREE.Mesh(new THREE.TorusGeometry(4.6,.7,10,48),oldMat);fr.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(fr.geometry.attributes.position.count*3).fill(.85),3));fr.position.y=4.4;fr.castShadow=true;G.add(fr);
  const petals=[];for(let k=0;k<6;k++){const a=k/6*Math.PI*2,sh=new THREE.Shape();sh.moveTo(0,0);sh.absarc(0,0,4.5,a,a+Math.PI/3+.02,false);sh.lineTo(0,0);
    const g=new THREE.ExtrudeGeometry(sh,{depth:.5,bevelEnabled:false});g.translate(0,0,-.25);const col=[];for(let i=0;i<g.attributes.position.count;i++)col.push(.8,.76,.7);g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    const m=new THREE.Mesh(g,oldMat);m.castShadow=true;const pv=new THREE.Group();pv.position.y=4.4;pv.add(m);G.add(pv);petals.push({pv,a:a+Math.PI/6});}
  const seam=new THREE.Mesh(new THREE.RingGeometry(.2,4.4,6,1),new THREE.MeshBasicMaterial({color:C(0xffd890).multiplyScalar(.8),transparent:true,opacity:.0,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));seam.position.set(0,4.4,.3);G.add(seam);
  // the wall around it (the corridor here is narrower than the door's stone)
  const wm=new Merger();wm.add(boxUV(4.6,10,1.4,3),M(-6.9,5,-.2),K_PALE);wm.add(boxUV(4.6,10,1.4,3),M(6.9,5,-.2),K_PALE);wm.add(boxUV(9.2,1.2,1.4,3),M(0,9.4,-.2),K_PALE);
  // and the corners between the round door and the square opening, filled with the same stone (there were gaps to the dark behind)
  {const sh=new THREE.Shape();sh.moveTo(-4.7,0);sh.lineTo(4.7,0);sh.lineTo(4.7,8.9);sh.lineTo(-4.7,8.9);sh.lineTo(-4.7,0);const hole=new THREE.Path();hole.absarc(0,4.4,4.55,0,Math.PI*2,true);sh.holes.push(hole);
   const g=new THREE.ExtrudeGeometry(sh,{depth:1.4,bevelEnabled:false,curveSegments:48});g.translate(0,0,-.9);g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(g.attributes.position.count*3).fill(.85),3));wm.add(g,M(0,0,0),K_PALE);}
  const w=new THREE.Mesh(wm.build(),oldMat);w.castShadow=true;G.add(w);
  return{G,petals,seam,open:0,p};})();
function updateDoor(dt){if(DOOR.open<=0)return;DOOR.open=Math.min(1,DOOR.open+dt*.35);const u=CUTS.ease(DOOR.open);
  for(const P of DOOR.petals){P.pv.position.set(Math.cos(P.a)*u*4.6,4.4+Math.sin(P.a)*u*4.6,0);P.pv.rotation.z=u*1.2;P.pv.scale.setScalar(1-u*.35);}
  if(DOOR.open>=.6)barrier('door').open=true;}

/* ---------- the power room's doors and generator (Oct 22) ----------
   A slab of Host armour bolted into the chamber's west wall; it rises when Thorne finds the feed. A second one at the back of the
   room, which the Host come through once the power is cut. The generator: three black pylons round a column of purple light,
   rings turning on it, and a cable in the floor that runs back to the clamps around the object. */
function hostDoor(x,z,face){const G=new THREE.Group();G.position.set(x,0,z);G.rotation.y=face;scene.add(G);
  const W=VAULT.hw*2+1.4,H=WALLH.vault,fm=new Merger(),fg=new Merger();
  for(const sd of[-1,1]){fm.add(boxUV(1,H,1.3,2),M(sd*(W/2+.3),H/2,0),K_DARK2);fm.add(boxUV(.3,H,1.36,2),M(sd*(W/2-.1),H/2,0),K_SIL);}
  fm.add(boxUV(W+1.6,1,1.3,2),M(0,H-.3,0),K_DARK2);
  const fr=new THREE.Mesh(fm.build(),hostMat);fr.castShadow=true;G.add(fr);
  const slab=new THREE.Group();G.add(slab);const sm=new Merger(),sg=new Merger();
  sm.add(boxUV(W,H-.9,.7,2),M(0,(H-.9)/2,0),K_DARK);for(const y of[2.2,4.6,7])sm.add(boxUV(W*.92,.25,.8,2),M(0,y,0),K_DARK2);
  sg.add(new THREE.BoxGeometry(.08,H-1.4,.78),M(0,(H-.9)/2,0),W1);sg.add(new THREE.BoxGeometry(W*.8,.06,.8),M(0,1.2,0),W1);
  const sl=new THREE.Mesh(sm.build(),hostMat);sl.castShadow=true;slab.add(sl,new THREE.Mesh(sg.build(),purpleGlow));
  return{G,slab,open:0,go:false};}
const SDOOR=hostDoor(CH.x-CH.r-.2,CH.z,Math.PI/2),RDOOR=hostDoor(VAULT.cx-VAULT.r-.4,VAULT.cz,Math.PI/2);
// behind the rear door: a short dark passage going on into the facility (you can't go there; they come from there)
{const m=new Merger(),x=VAULT.cx-VAULT.r-5,w=VAULT.hw*2+1;m.add(boxUV(8,WALLH.vault,.6,2),M(x,WALLH.vault/2,VAULT.cz-w/2),K_DARK);m.add(boxUV(8,WALLH.vault,.6,2),M(x,WALLH.vault/2,VAULT.cz+w/2),K_DARK);
  m.add(boxUV(.6,WALLH.vault,w,2),M(x-4,WALLH.vault/2,VAULT.cz),K_DARK2);m.add(boxUV(8,.6,w+1,2),M(x,WALLH.vault,VAULT.cz),K_DARK2);m.add(boxUV(8,.3,w,2),M(x,-.1,VAULT.cz),K_DARK);
  const o=new THREE.Mesh(m.build(),hostMat);o.receiveShadow=true;scene.add(o);}
const GEN=(()=>{const G=new THREE.Group();G.position.set(VAULT.cx,0,VAULT.cz);scene.add(G);const m=new Merger();
  m.add(new THREE.CylinderGeometry(3,3.4,.8,6),M(0,.4,0),K_DARK2);m.add(new THREE.CylinderGeometry(1.4,1.6,.5,6),M(0,1,0),K_SIL);
  for(let k=0;k<3;k++){const a=k/3*Math.PI*2,x=Math.cos(a)*2.2,z=Math.sin(a)*2.2;m.add(boxUV(.7,7.4,.7,2),M(x,4.1,z,0,-a,0),K_DARK);
    for(const y of[2,4.4,6.8])m.add(boxUV(.8,.18,.8,2),M(x,y,z,0,-a,0),K_SIL);m.add(boxUV(.4,.4,1.9,2),M(x*.6,7.6,z*.6,0,-a+Math.PI/2,0),K_DARK2);}
  m.add(new THREE.CylinderGeometry(1.1,1.1,.5,6),M(0,8,0),K_DARK2);
  const body=new THREE.Mesh(m.build(),hostMat);body.castShadow=body.receiveShadow=true;G.add(body);
  const coreMat=new THREE.MeshBasicMaterial({color:C(HOST_GLOW).multiplyScalar(2.2),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const core=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,6.6,12,1,true),coreMat);core.position.y=4.5;G.add(core);
  const ringMat=new THREE.MeshBasicMaterial({color:C(HOST_GLOW).multiplyScalar(1.8),toneMapped:false,transparent:true});
  const rings=[2.4,4.4,6.4].map((y,i)=>{const r=new THREE.Mesh(new THREE.TorusGeometry(1.25,.07,6,32),ringMat);r.position.y=y;r.rotation.x=Math.PI/2;G.add(r);return r;});
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(HOST_GLOW).multiplyScalar(1.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7}));halo.scale.set(5,9,1);halo.position.y=4.5;G.add(halo);
  const light=new THREE.PointLight(C(HOST_GLOW),2.2,30,1.5);light.position.y=5;G.add(light);
  OBST.push({x:VAULT.cx,z:VAULT.cz,r:3.3,h:8});
  // the feed: a cable in a channel in the floor, from the generator to the clamps round the object
  const cableMat=new THREE.MeshBasicMaterial({color:C(HOST_GLOW).multiplyScalar(1.6),toneMapped:false,transparent:true});
  const x0=VAULT.cx+3.2,x1=CH.x-3.4,cz=VAULT.cz+1.8,cab=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,.06,.22),cableMat);cab.position.set((x0+x1)/2,.04,cz);scene.add(cab);
  const ch=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,.04,.6),new THREE.MeshStandardMaterial({color:C(0x16121c),roughness:.8}));ch.position.set((x0+x1)/2,.01,cz);scene.add(ch);
  return{G,core,coreMat,rings,ringMat,halo,light,cableMat,on:1,cut:false,pos:new THREE.Vector3(VAULT.cx,0,VAULT.cz)};})();
// the generator, and the doors (go: rising; the side door opens the way once it's halfway up)
function updateVault(dt,T){
  for(const D of[SDOOR,RDOOR])if(D.go&&D.open<1){D.open=Math.min(1,D.open+dt*.5);D.slab.position.y=CUTS.ease(D.open)*(WALLH.vault-1.1);}
  if(SDOOR.open>.5)VAULT.open=true;
  if(GEN.cut)GEN.on=Math.max(0,GEN.on-dt*.7);const k=GEN.on,fl=GEN.cut&&k>0?(Math.random()<.35?.2:1):1;
  for(let i=0;i<3;i++)GEN.rings[i].rotation.z+=dt*(1.2+i*.5)*k;
  GEN.coreMat.opacity=(.6+.25*Math.sin(T*4))*k*fl;GEN.halo.material.opacity=.7*k*fl;GEN.light.intensity=2.2*k*fl;GEN.ringMat.opacity=.25+.75*k;
  GEN.cableMat.opacity=k>0?(.55+.45*Math.sin(T*6-GEN.G.position.x*.1))*k*fl:0;GEN.cableMat.color.copy(C(HOST_GLOW)).multiplyScalar(1.6*(.2+.8*k));}

/* ---------- the chamber's heart: an object held in a Host containment field ----------
   It is not Host work. It is not ours. A tall, narrow shape of something like black glass, seamless, a little too smooth to look at
   for long; light moves inside it in lines that do not repeat. Four Host clamps hold the field around it. */
const ART=(()=>{const G=new THREE.Group();G.position.set(CH.x,0,CH.z);scene.add(G);
  // the dais (old stone) and the Host's clamps (bolted onto it later: you can see the drill marks)
  const d=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.9,.9,6),oldMat);d.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(d.geometry.attributes.position.count*3).fill(.82),3));d.position.y=.45;d.castShadow=d.receiveShadow=true;G.add(d);
  const cm=new Merger(),cg=new Merger();for(let k=0;k<4;k++){const a=k/4*Math.PI*2+Math.PI/4,x=Math.cos(a)*3.6,z=Math.sin(a)*3.6,ry=-a+Math.PI/2;
    cm.add(boxUV(1,1.4,1,2),M(x,.7,z,0,ry,0),K_DARK);cm.add(boxUV(.4,3.6,.4,2),M(x*.9,2.6,z*.9,0,ry,0).multiply(M(0,0,0,0,0,0)),K_SIL);cm.add(boxUV(.5,.3,1.6,2),M(x*.72,4.4,z*.72,0,ry,0),K_DARK2);
    cg.add(new THREE.BoxGeometry(.08,3,.08),M(x*.86,2.6,z*.86,0,ry,0),W1);}
  const cmm=new THREE.Mesh(cm.build(),hostMat);cmm.castShadow=true;G.add(cmm,new THREE.Mesh(cg.build(),purpleGlow));
  // the object
  const og=new THREE.OctahedronGeometry(1,3);const P=og.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i);P.setXYZ(i,P.getX(i)*.34*(1-Math.abs(y)*.25),y*1.15,P.getZ(i)*.34*(1-Math.abs(y)*.25));}og.computeVertexNormals();
  const objU={uT:{value:0},wake:{value:0}};
  const om=new THREE.ShaderMaterial({uniforms:objU,vertexShader:'varying vec3 vN;varying vec3 vP;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vP=position;vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:`varying vec3 vN;varying vec3 vP;varying vec3 vV;uniform float uT,wake;
    float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.5);
      // lines of light that run through it and never line up twice
      float a=atan(vP.z,vP.x);float l1=smoothstep(.97,1.0,sin(vP.y*9.0+a*3.0+uT*.7+sin(uT*.31)*4.0));float l2=smoothstep(.985,1.0,sin(vP.y*-13.0+a*5.0-uT*.43));
      vec3 c=vec3(.01,.01,.02)+vec3(.55,.6,.9)*f*.6+vec3(.75,.85,1.0)*(l1+l2)*(.6+wake*2.4)+vec3(1.0,.95,.8)*wake*f*1.4;
      gl_FragColor=vec4(c,1.0);}`});
  const obj=new THREE.Mesh(og,om);obj.position.y=2.9;G.add(obj);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xa8b8ff).multiplyScalar(.9),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6}));halo.scale.setScalar(4);halo.position.y=2.9;G.add(halo);
  // dust of light circling it
  const N=90,pp=new Float32Array(N*3),motes=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({size:.05,color:C(0xd8e0ff).multiplyScalar(2),transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
  motes.geometry.setAttribute('position',new THREE.BufferAttribute(pp,3));motes.position.y=2.9;G.add(motes);const ph=[...Array(N)].map(()=>[R(0,6.28),R(.7,1.6),R(-1.4,1.4),R(.2,.6)]);
  // the containment field: a six-sided column of light, hex-patterned, flickering when it fails
  const hc=document.createElement('canvas');hc.width=hc.height=128;const hx=hc.getContext('2d');hx.strokeStyle='rgba(255,255,255,.9)';hx.lineWidth=2;
  for(let row=-1;row<6;row++)for(let col=-1;col<6;col++){const r=14,cx=col*r*1.5,cy=row*r*1.732+(col%2?r*.866:0);hx.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;hx[k?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r);}hx.closePath();hx.stroke();}
  const ht=new THREE.CanvasTexture(hc);ht.wrapS=ht.wrapT=THREE.RepeatWrapping;ht.repeat.set(4,3);
  const field=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,4.4,6,1,true),new THREE.MeshBasicMaterial({map:ht,color:C(HOST_GLOW).multiplyScalar(1.4),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  field.position.y=3;G.add(field);
  const light=new THREE.PointLight(C(0xb8c4ff),1.6,26,1.6);light.position.y=4;G.add(light);
  return{G,obj,objU,halo,motes,ph,pp,field,light,fieldOn:1,taken:false};})();
function updateArtifact(dt,T){ART.objU.uT.value=T;ART.obj.rotation.y+=dt*.12;
  for(let i=0;i<ART.ph.length;i++){const p=ART.ph[i];p[0]+=dt*p[3];ART.pp.set([Math.cos(p[0])*p[1],p[2]+Math.sin(T*.5+i)*.1,Math.sin(p[0])*p[1]],i*3);}ART.motes.geometry.attributes.position.needsUpdate=true;
  ART.field.material.map.offset.y=T*.05;ART.field.material.opacity=ART.fieldOn*(.25+.1*Math.sin(T*3))*(ART.flicker?(Math.random()<.4?0:1):1);}

/* ---------- the hangar roof: six great plates on ribs. The gunship comes through it ---------- */
const ROOF=(()=>{const parts=[],y=PLAT_Y+WALLH.hangar;
  for(let k=0;k<6;k++){const m=new Merger(),a0=k/6*Math.PI*2,a1=(k+1)/6*Math.PI*2,sh=new THREE.Shape();sh.moveTo(0,0);sh.absarc(0,0,PLAT.r+2,a0,a1,false);sh.lineTo(0,0);
    const g=new THREE.ExtrudeGeometry(sh,{depth:1,bevelEnabled:false});g.rotateX(Math.PI/2);m.add(g,M(0,0,0),K_DARK2);
    const am=(a0+a1)/2;m.add(boxUV(PLAT.r,.8,.7,3),M(Math.cos(am)*PLAT.r*.5,-.7,Math.sin(am)*PLAT.r*.5,0,-am,0),K_DARK);
    const G=new THREE.Group();G.position.set(PLAT.x,y+1,PLAT.z);const mm=new THREE.Mesh(m.build(),hostMat);mm.castShadow=mm.receiveShadow=true;G.add(mm);scene.add(G);
    const l=new THREE.Mesh(new THREE.BoxGeometry(PLAT.r*.6,.05,.3),new THREE.MeshBasicMaterial({color:C(0xcfe6ff).multiplyScalar(1.3),toneMapped:false}));l.position.set(Math.cos(am)*PLAT.r*.5,-1.12,Math.sin(am)*PLAT.r*.5);l.rotation.y=-am;G.add(l);
    parts.push({G,am,v:new THREE.Vector3(),spin:new THREE.Vector3(),falling:false,done:false});}
  return{parts,y};})();
// the roof comes down in pieces: they fall, tumble and land as cover on the deck
// (the plates don't fall whole: each one shatters where it is and comes down as a few chunks)
const CHUNKS=[];
function collapseRoof(){hangarOpen=true;ROOF.parts.forEach((P,i)=>{if(i===1||i===4)return;P.falling=true;P.delay=i*.18;P.G.visible=false;
    for(let k=0;k<4;k++){const r=PLAT.r*R(.25,.85),a=P.am+R(-.4,.4),m=new THREE.Mesh(boxUV(R(3,6),R(.6,1),R(3,6),3),hostMat);
      m.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(m.geometry.attributes.position.count*3).fill(.18),3));
      m.position.set(PLAT.x+Math.cos(a)*r,ROOF.y+R(0,1.5),PLAT.z+Math.sin(a)*r);m.castShadow=true;scene.add(m);CHUNKS.push({m,v:new THREE.Vector3(R(-2,2),R(0,2),R(-2,2)),s:new THREE.Vector3(R(-2,2),R(-2,2),R(-2,2)),d:P.delay+k*.08});}
    boom(new THREE.Vector3(PLAT.x+Math.cos(P.am)*PLAT.r*.5,ROOF.y,PLAT.z+Math.sin(P.am)*PLAT.r*.5),10,0xffc08a,.6);});
  if(typeof sfx!=='undefined')sfx.collapse(new THREE.Vector3(PLAT.x,PLAT_Y+10,PLAT.z));}
function updateRoof(dt){for(let i=CHUNKS.length-1;i>=0;i--){const c=CHUNKS[i];if(c.d>0){c.d-=dt;continue;}c.v.y-=16*dt;c.m.position.addScaledVector(c.v,dt);c.m.rotation.x+=c.s.x*dt;c.m.rotation.z+=c.s.z*dt;
    if(c.m.position.y<PLAT_Y+.5){c.m.position.y=PLAT_Y+.4;CHUNKS.splice(i,1);puff(c.m.position.clone(),R(2,4),2);}}
for(const P of ROOF.parts){if(!P.falling||P.done)continue;if(P.delay>0){P.delay-=dt;continue;}P.v.y-=16*dt;P.G.position.addScaledVector(P.v,dt);P.G.rotation.x+=P.spin.x*dt;P.G.rotation.z+=P.spin.z*dt;
  if(P.G.position.y<PLAT_Y+2){P.done=true;P.G.visible=false;
    // what's left is a heap of plate and rib on the deck: cover, for whoever gets to it first
    const x=PLAT.x+Math.cos(P.am)*PLAT.r*.55,z=PLAT.z+Math.sin(P.am)*PLAT.r*.55;debrisHeap(x,z);
    boom(new THREE.Vector3(x,PLAT_Y+1,z),9,0xffc08a,.7);for(let k=0;k<8;k++)puff(new THREE.Vector3(x+R(-4,4),PLAT_Y+1,z+R(-4,4)),R(3,6),R(2,4));}}}
function debrisHeap(x,z){const m=new Merger();for(let k=0;k<5;k++)m.add(boxUV(R(2.5,5),R(.6,1.2),R(1.5,3),3),M(R(-1.5,1.5),R(.3,1.4),R(-1.5,1.5),R(-.5,.5),R(0,3),R(-.5,.5)),k%2?K_DARK:K_DARK2);
  m.add(boxUV(.6,.6,5,3),M(0,1.8,0,R(-.6,.6),R(0,3),.3),K_SIL);const o=new THREE.Mesh(m.build(),hostMat);o.position.set(x,PLAT_Y,z);o.castShadow=o.receiveShadow=true;scene.add(o);OBST.push({x,z,r:2.6,h:2.2});}

/* ---------- interior light: a cold lamp that goes where you go inside (the team's helmet lights), the chamber's own,
   and the alarm that turns every strip red ---------- */
const helmLamp=new THREE.PointLight(C(0xd8e6ff),0,32,1.2);scene.add(helmLamp);
const alarmLamp=new THREE.PointLight(C(0xff2a1a),0,40,1.4);scene.add(alarmLamp);
const yardLamps=[];for(const [s,lat] of[[40,-16],[80,16],[112,0]]){const p=roadPt(s).clone(),n=roadN(s);const l=new THREE.PointLight(C(HOST_GLOW),1.6,60,1.6);l.position.set(p.x+n.x*lat,9,p.z+n.z*lat);scene.add(l);yardLamps.push(l);}
let alarmOn=0;
function updateLights(dt,T,pos){const s=roadS(pos.x,pos.z),inside=s>S_GATE-4&&!(hangarOpen&&inPlat(pos.x,pos.z,4));
  helmLamp.intensity+=((inside?.85:0)-helmLamp.intensity)*(1-Math.exp(-dt*3));
  inK+=((inside?1:0)-inK)*(1-Math.exp(-dt*2));if(!CUTS.on){keyLight.intensity=keyBase*(1-.6*inK);hemi.intensity=hemiBase*(1+.7*inK);}helmLamp.position.set(pos.x,pos.y+3.2,pos.z);
  if(alarmOn){const pulse=.5+.5*Math.sin(T*5);alarmLamp.intensity=(inside?2.4:1.2)*pulse*alarmOn;alarmLamp.position.set(pos.x,pos.y+5,pos.z);stripMat.color.setRGB(1.6*(.5+pulse*.8),.12,.08);}
  else{alarmLamp.intensity=0;stripMat.color.setRGB(1.4,1.4,1.4);}
  for(const S of SPIRES)S.l.material.opacity=.6+.4*Math.sin(T*1.3+S.x);}

/* ---------- moon dust drifting, very slowly ---------- */
const DUST_N=coarse?350:800,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,30),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.12,color:C(0xc8c0e0),transparent:true,opacity:.35,depthWrite:false}));scene.add(dust);

/* ---------- bloom and quality (as in the other chapters) ---------- */
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
setLook('moon');
