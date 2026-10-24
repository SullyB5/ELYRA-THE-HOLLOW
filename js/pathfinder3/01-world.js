/* Elyra · Pathfinder · Arc 03 · The White City — the world. 10.03.2237, before dawn: Astraea at night, and in the middle of the red
   desert a city nobody built. Smooth white stone with no joins, a wall round it a hundred metres high with one round opening in it,
   streets that climb to a tower at the heart. The Herald war is all over it: amber defending, red trying to bring it down.
   Rhen's team comes in by air (js/pathfinder3/02-air.js), lands in the plaza inside the opening, fights up the streets, into the
   tower, up the spiral inside it, to the chamber at the top of the spiral where the object fits (js/pathfinder3/03-story.js).
   Same contract as js/pathfinder2/01-world.js: js/origin/03-play.js asks for playD, groundY, roadS, laneHalf and friends.
   Units are metres; the city's centre is the origin, north is -z, the opening faces south (+z). */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(1003);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.6:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
window.ELYRA_RENDERER=renderer;
$('app').appendChild(renderer.domElement);
MODELS.preload(['engineer','marine','rifle','host-trooper','dropship','wraith','voidclass']);
// you are Captain Rhen (read by js/origin/03-play.js)
window.AMBER_LOOK={tint:0x9c8f78,lift:{c:0xd8c8a8,k:.26,flat:true}};
window.PLAYER_KIND='marine';window.PLAYER_OPTS={tint:0xb4bcc4};

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(C(0x141a2e),.0011);scene.background=scene.fog.color;
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,9000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();
const lerp=(a,b,u)=>a+(b-a)*u;

/* ---------- the sky: Astraea before dawn. Deep blue, hard stars, the galaxy's band, a cold glow along the east where the day is
   still an hour off, and the dead moon (Arc 01's) low in the west. It rides with the camera ---------- */
const skyGroup=new THREE.Group();scene.add(skyGroup);
const sunDir=new THREE.Vector3(.7,.04,.7).normalize();   // under the horizon, east: the glow it throws up
const skyU={sunDir:{value:sunDir},hor:{value:C(0x2c3352)},mid:{value:C(0x0e1430)},zen:{value:C(0x02030c)},starK:{value:1},sunK:{value:.35},uT:{value:0},band:{value:1},photo:{value:null},photoK:{value:0},photoU:{value:.3},photoB:{value:.5},nebK:{value:1},domeK:{value:0}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(4000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,mid,zen;uniform float photoK,photoU,photoB,nebK;uniform sampler2D photo;uniform float starK,sunK,uT,band,domeK;
  float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.0,a=.5;for(int i=0;i<5;i++){s+=ns(p)*a;p=p*2.03+vec2(17.0,-9.0);a*=.5;}return s;}
  void main(){vec3 d=normalize(vDir);float y=d.y;
    vec3 c=mix(hor,mid,smoothstep(-.02,.2,y));c=mix(c,zen,smoothstep(.15,.75,y));
    vec2 sp=floor(vec2(atan(d.z,d.x)*420.0,asin(clamp(y,-1.0,1.0))*420.0));float st=step(.9958,hs(sp))*(.3+.7*hs(sp+7.3));
    vec2 sp2=floor(vec2(atan(d.z,d.x)*130.0,asin(clamp(y,-1.0,1.0))*130.0));st+=step(.9985,hs(sp2+3.1))*1.4;
    float tw=.75+.25*sin(uT*3.0+hs(sp)*40.0);st*=tw;
    float bd=abs(dot(d,normalize(vec3(-.3,.62,-.72))));float gb=exp(-bd*bd*16.0)*band;
    float neb=fbm(vec2(atan(d.z,d.x)*3.0,y*6.0)+3.0);c+=vec3(.12,.1,.2)*gb*neb*.9+vec3(.04,.05,.09)*gb;st*=1.0+gb*1.5;
    // Astraea's nebula (Oct 24, js/shared/skies.js): over the whole sky, strongest overhead; the look's own glow stays along the horizon
    if(photoK>0.0){vec2 pu=vec2(atan(d.z,d.x)/6.2831853+.5+photoU,asin(clamp(y,-1.0,1.0))/3.1415927+.5);vec3 pc=pow(texture2D(photo,pu).rgb,vec3(2.2))*photoB;pc=pc/(1.0+pc*.8);
      c=mix(c,c*.4+pc,photoK*nebK*smoothstep(-.02,.3,y));}
    // the dome's light, when it is up: the sky over the city goes pale blue-white
    c+=vec3(.25,.34,.5)*domeK*smoothstep(.0,.6,y)*.35;
    c+=vec3(st)*starK*(1.0-domeK*.7)*smoothstep(-.05,.12,y);
    float s=max(dot(d,sunDir),0.0);c+=vec3(.9,.55,.4)*pow(s,6.0)*.18*sunK*smoothstep(-.1,.08,y)*(1.0-smoothstep(.08,.4,y));
    if(y<0.0)c=mix(hor,hor*.3,smoothstep(0.0,-.25,y));
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
sky.renderOrder=-3;skyGroup.add(sky);
SKIES.load('astraea',t=>{skyU.photo.value=t;skyU.photoK.value=1;});
// the dead moon, low in the west: grey, cratered, lit from the east
const MOON=(()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.ShaderMaterial({uniforms:{sunDir:{value:new THREE.Vector3(1,.2,.3).normalize()}},fog:false,depthWrite:false,
  vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(mat3(modelMatrix)*normal);vP=position;gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vN;varying vec3 vP;uniform vec3 sunDir;float hs(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float ns(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}
    void main(){vec3 p=normalize(vP);float n=ns(p*4.0)*.5+ns(p*9.0)*.3+ns(p*22.0)*.2;float l=smoothstep(-.1,.4,dot(normalize(vN),sunDir));
      vec3 c=mix(vec3(.32,.31,.33),vec3(.62,.6,.6),n)*(.03+l*.9);gl_FragColor=vec4(c,1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`}));
  m.position.set(-2400,620,-1300).normalize().multiplyScalar(3000);m.scale.setScalar(150);m.renderOrder=-2;skyGroup.add(m);return m;})();
function skyFollow(){skyGroup.position.copy(camera.position);}

/* ---------- light: the moon's cold light, the city's own glow from below, fires where the war is ---------- */
const hemi=new THREE.HemisphereLight(C(0x5a6a9a),C(0x24283a),.6);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(C(0xa8b8e8),.75);scene.add(keyLight,keyLight.target);
keyLight.castShadow=true;keyLight.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(keyLight.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:1500});keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.05;
const rim=new THREE.DirectionalLight(C(0xffb890),.25);rim.position.copy(sunDir).multiplyScalar(500);scene.add(rim);
let keyDir=new THREE.Vector3(-.55,.62,-.3).normalize();
function followSun(p){keyLight.position.copy(p).addScaledVector(keyDir,600);keyLight.target.position.copy(p);}
const LOOKS={
  night:{hor:0x2c3352,mid:0x0e1430,zen:0x02030c,star:1,sunK:.35,fog:0x141a2e,dens:.0011,keyC:0xa8b8e8,keyI:.75,hemiS:0x5a6a9a,hemiG:0x24283a,hemiI:.6,band:1,exp:1.1},
  // under the dome: everything a little brighter and colder, the stars washed out
  dome:{hor:0x5a6e9a,mid:0x24305a,zen:0x0a1020,star:.35,sunK:.2,fog:0x2a3658,dens:.0008,keyC:0xd8e6ff,keyI:.85,hemiS:0x8aa0d0,hemiG:0x2a2a32,hemiI:.62,band:.4,exp:.98},
  // the Host overhead: the dome failing, purple through everything
  host:{hor:0x3a2a52,mid:0x1a1030,zen:0x05030c,star:.5,sunK:.1,fog:0x1e1430,dens:.0012,keyC:0xb89ae8,keyI:.6,hemiS:0x6a4a9a,hemiG:0x1a1420,hemiI:.55,band:.6,exp:1.05}};
let lookName='';
function setLook(name){const L=LOOKS[name];if(!L)return;lookName=name;
  skyU.hor.value.copy(C(L.hor));skyU.mid.value.copy(C(L.mid));skyU.zen.value.copy(C(L.zen));skyU.starK.value=L.star;skyU.sunK.value=L.sunK;skyU.band.value=L.band;skyU.nebK.value=L.neb!=null?L.neb:1;
  scene.fog.color.copy(C(L.fog));scene.fog.density=L.dens;scene.background=scene.fog.color;
  keyLight.color.copy(C(L.keyC));keyLight.intensity=L.keyI;hemi.color.copy(C(L.hemiS));hemi.groundColor.copy(C(L.hemiG));hemi.intensity=L.hemiI;renderer.toneMappingExposure=L.exp;}

/* ---------- the plan ----------
   WALL: a ring 520 m out, 110 m high, 14 thick. One opening, round, 34 m across the radius, centred 58 m up, facing south.
   PLAZA: just inside the opening, where Dropship Two sets down. STREETS: north from the plaza, winding up to the tower's door.
   THE TOWER (THE HEART): 70 m round at the foot, 300 high. Inside: a hall from the door to a corridor that runs round the tower's
   core in a spiral, climbing 34 m over three quarters of a turn; at its top it turns in, to the chamber in the core: round, 28 m
   across the radius, open above all the way up a shaft to the sky. The socket is in the middle of its floor. */
const WR=520,WH=110,WT=14,GATE={x:0,y:58,z:WR,r:34};
const LZ={x:0,z:452,r:36};
const TW={r:70,h:300},RC=50,RW=4.4,CR=28,TOPY=34,SPIRAL=Math.PI*1.5;   // ring corridor centre radius, half width; chamber radius; chamber floor
const SOCKET=new THREE.Vector3(0,TOPY,0);
const HALL_X=5.9;   // the hall's walls, outer face (the hall is 5.2 each side of x = 0 to walk; its walls stand at 5.6, 0.6 thick)
const TH_OUT0=Math.asin(HALL_X/(RC+RW)),TH_IN0=-Math.asin(HALL_X/(RC-RW));   // where the spiral's outer and inner walls start, at the hall
// the spiral's floor: flat for the first and last few degrees, a steady climb between
function spiralY(th){const a=.12,b=SPIRAL-.12;return th<=a?0:th>=b?TOPY:TOPY*(th-a)/(b-a);}
function thetaOf(x,z){let t=Math.atan2(x,z);if(t<0)t+=Math.PI*2;return t;}   // 0 = south (+z), increasing toward east (+x)
function spiralPt(th,r){return{x:Math.sin(th)*(r||RC),z:Math.cos(th)*(r||RC)};}
// the walk, south to north and then round and up
const ROAD=(()=>{const P=[[0,LZ.z],[0,418],[14,372],[10,318],[-14,262],[-18,206],[6,152],[4,112],[0,84],[0,62]];
  for(let k=0;k<=36;k++){const th=SPIRAL*k/36,p=spiralPt(th);P.push([+p.x.toFixed(3),+p.z.toFixed(3)]);}
  P.push([-38,0],[-6,0]);return P;})();
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const ROADS=[],ROAD_LEN=(()=>{let s=0;for(let i=0;i<ROAD.length-1;i++){const [ax,az]=ROAD[i],[bx,bz]=ROAD[i+1],l=Math.hypot(bx-ax,bz-az);if(l<1e-6)continue;ROADS.push({ax,az,bx,bz,l,s0:s,nx:-(bz-az)/l,nz:(bx-ax)/l});s+=l;}return s;})();
// distances along the walk where things change
const S_DOOR=(()=>{let s=0;for(const r of ROADS){if(Math.abs(r.az-84)<.01&&Math.abs(r.bz-62)<.01)return r.s0+r.l*.9;}return s;})();   // the tower's door
const S_RING0=(()=>{for(const r of ROADS)if(Math.abs(r.az-62)<.01)return r.s0+r.l;return 0;})();     // the spiral starts
const S_RING1=S_RING0+RC*SPIRAL;                                                                       // the spiral ends (west, 34 m up)
const S_CHAMBER=ROAD_LEN-22;
function roadSeg(x,z){let best=1e9,bs=0,bt=0,br=ROADS[0];
  // inside the tower the walk is the spiral: pick the spiral's segment by the angle, never a street segment the other side of a wall
  for(const r of ROADS){const dx=r.bx-r.ax,dz=r.bz-r.az,t=clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.l*r.l),0,1),d=Math.hypot(x-r.ax-dx*t,z-r.az-dz*t);if(d<best){best=d;bs=r.s0+t*r.l;bt=t;br=r;}}return{s:bs,r:br,t:bt,d:best};}
function roadS(x,z){const rr=Math.hypot(x,z);
  if(rr<TW.r+2){if(rr<CR+1)return S_RING1+RC-CR+(CR-rr)*.5;if(x<0&&Math.abs(z)<6&&rr<RC+RW+1)return S_RING1+Math.max(0,RC+x);
    const th=thetaOf(x,z);if(Math.abs(rr-RC)<RW+3&&th<=SPIRAL+.05)return S_RING0+RC*Math.min(th,SPIRAL);if(Math.abs(x)<7&&z>0)return S_RING0-(z-RC);}
  const q=roadSeg(x,z);let bs=q.s;if(z>ROAD[0][1]&&Math.abs(x)<60)bs=-(z-ROAD[0][1]);return bs;}
const _rp=new THREE.Vector3();
function roadPt(s,out){s=clamp(s,0,ROAD_LEN);out=out||_rp;for(const r of ROADS)if(s<=r.s0+r.l){const t=(s-r.s0)/r.l;return out.set(r.ax+(r.bx-r.ax)*t,0,r.az+(r.bz-r.az)*t);}const e=ROAD[ROAD.length-1];return out.set(e[0],0,e[1]);}
function roadN(s){let nx=0,nz=0;for(const r of ROADS){const k=clamp(1-Math.max(0,Math.max(r.s0-s,s-(r.s0+r.l)))/(s>S_RING0-4?3:10),0,1);nx+=r.nx*k;nz+=r.nz*k;}const l=Math.hypot(nx,nz)||1;return{x:nx/l,z:nz/l};}
function latOf(x,z){const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t;return(x-px)*r.nx+(z-pz)*r.nz;}
const SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0;
function laneC(s){return 0;}
function spineAt(s){return false;}
// how wide the walk is: the plaza, the streets (wider where the war is), the door, the hall, the spiral corridor, the chamber
const S_ST1=60,S_ST2=150,S_ST3=250;   // the three stretches of street
function laneHalf(s){
  if(s<14)return 26;
  if(s<S_DOOR-14)return 13+3*Math.sin(s*.04)+(s>S_ST2-20&&s<S_ST2+30?5:0);
  if(s<S_DOOR+2)return lerp(13,5.5,sstep(S_DOOR-14,S_DOOR-2,s));
  if(s<S_RING0-2)return 5.5;
  if(s<S_RING1+2)return RW;
  return 4.2;}
const BARRIERS=[];
function barrier(id){return null;}
function inTower(x,z,m){return Math.hypot(x,z)<TW.r+(m||0);}
/* side areas off the streets (as Arc 02's): two small squares you can go into, each a short way in and a round space at the end */
function sidePt(s,lat){const p=roadPt(clamp(s,0,ROAD_LEN)).clone(),n=roadN(clamp(s,0,ROAD_LEN));return{x:p.x+n.x*lat,z:p.z+n.z*lat};}
const SIDES=[{id:'garden',s:100,lat0:10,lat1:34,r:5,R:13},{id:'arcade',s:214,lat0:-10,lat1:-32,r:4.5,R:11}].map(o=>{const a=sidePt(o.s,o.lat0),b=sidePt(o.s,o.lat1),e=sidePt(o.s,o.lat1+Math.sign(o.lat1)*(o.R-2));
  return Object.assign(o,{ax:a.x,az:a.z,bx:b.x,bz:b.z,cx:e.x,cz:e.z});});
function sideD(x,z){let d=1e9;for(const o of SIDES)d=Math.min(d,segDist(x,z,o.ax,o.az,o.bx,o.bz)-o.r,Math.hypot(x-o.cx,z-o.cz)-o.R);return d;}
function sideOf(x,z){for(const o of SIDES)if(Math.min(segDist(x,z,o.ax,o.az,o.bx,o.bz)-o.r,Math.hypot(x-o.cx,z-o.cz)-o.R)<.5)return o;return null;}
/* ---------- the whole city is walkable (Bryce, Oct 22): inside the wall it is floor everywhere, and every building is solid, so you
   can leave the street and walk round the towers, the domes and the arcs. The wall keeps you in. The streets are still the way
   the story goes (the squad, the enemies and the markers follow them), but nothing stops you wandering off them.
   SOLIDS: each building's footprint at street level (circles, and ellipses for the street façades), in a 40 m grid for speed ---------- */
const SOLIDS=[],SG={};const SGC=40;
function addSolid(o){o.R=o.e?Math.max(o.a,o.b):o.r;SOLIDS.push(o);const x0=Math.floor((o.x-o.R)/SGC),x1=Math.floor((o.x+o.R)/SGC),z0=Math.floor((o.z-o.R)/SGC),z1=Math.floor((o.z+o.R)/SGC);
  for(let i=x0;i<=x1;i++)for(let j=z0;j<=z1;j++)(SG[i+','+j]||(SG[i+','+j]=[])).push(o);}
const _sq={s:1e9,h:0};
// signed distance to the nearest building (negative inside one), and that building's height
function solidAt(x,z){_sq.s=1e9;_sq.h=0;const L=SG[Math.floor(x/SGC)+','+Math.floor(z/SGC)];if(!L)return _sq;
  for(const o of L){let d;if(o.e){const dx=x-o.x,dz=z-o.z,lx=dx*o.c-dz*o.sn,lz=dx*o.sn+dz*o.c,k=Math.hypot(lx/o.a,lz/o.b);d=(k-1)*Math.min(o.a,o.b);}else d=Math.hypot(x-o.x,z-o.z)-o.r;
    if(d<_sq.s){_sq.s=d;_sq.h=o.h;}}return _sq;}
const TW_OUT=TW.r+4.6;   // the tower's outer face, its panels and gold included
const inDoorway=(x,z)=>Math.abs(x)<5.2&&z>0;
// distance outside the walkable area (negative inside)
function playD(x,z){
  const rr=Math.hypot(x,z);
  if(rr<TW.r+2)return towerD(x,z);   // the tower's inside has its own shape (towerD, below)
  let d=rr-(WR-1.5);                                                       // the city wall
  if(!inDoorway(x,z))d=Math.max(d,TW_OUT-rr);                              // the tower, from outside (open at its door)
  d=Math.max(d,-solidAt(x,z).s);                                           // the buildings
  for(const B of BLOCKS)d=Math.max(d,B.r-Math.hypot(x-B.x,z-B.z));
  return d;}
// the tower's inside, on its own (the walk's polyline is no use in there: the spiral would be 'near' the hall from the wrong side)
function towerD(x,z){const rr=Math.hypot(x,z),th=thetaOf(x,z);
  let d=rr-CR;                                                                                   // the chamber
  d=Math.min(d,Math.max(Math.abs(x)-5.2,z-(TW.r+3),(RC-RW+1)-z));                                // the hall: door to the spiral
  const ring=Math.abs(rr-RC)-RW;
  if(th<=SPIRAL)d=Math.min(d,ring);else d=Math.min(d,Math.hypot(Math.max(0,ring),RC*Math.min(th-SPIRAL,Math.PI*2-th)));   // the spiral: its ends are walls
  d=Math.min(d,Math.max(Math.abs(z)-4.2,x+CR-1,-(RC+RW-1)-x));                                  // west: the way in from the spiral's top to the chamber
  for(const B of BLOCKS)d=Math.max(d,B.r-Math.hypot(x-B.x,z-B.z));                               // doors and barriers the story closes
  return d;}
const BLOCKS=[];
// the floor: paving, dead level in the streets, the spiral climbing in the tower
function floorAt(x,z){const rr=Math.hypot(x,z);
  if(rr<TW.r+.5){if(rr<CR+4.5)return TOPY;if(x<0&&Math.abs(z)<9&&rr<RC+RW+5)return TOPY;
    const th=thetaOf(x,z);if(Math.abs(rr-RC)<RW+5&&th<=SPIRAL+.2)return spiralY(Math.min(th,SPIRAL));return 0;}
  if(rr>WR-WT)return duneY(x,z);
  return 0;}
function duneY(x,z){const rr=Math.hypot(x,z);return Math.max(0,(rr-WR-30)*.02)*sstep(WR+20,WR+200,rr)+3.5*fbm(x*.006,z*.006)*sstep(WR+40,WR+300,rr);}
// outside the walk: in the streets a band of solid wall-height behind the façades (it stops shots and sight lines through a
// building; the buildings drawn over it hide it); in the tower, solid stone; outside the city wall, the desert
// (a building's footprint reads as its full height, so it stops shots and sight lines the way its walls look like they should)
function groundY(x,z){
  const d=playD(x,z);
  if(d<=0)return floorAt(x,z);
  const rr=Math.hypot(x,z);
  if(rr<TW.r+.5)return d<3.6?floorAt(x,z):160;
  if(rr<TW_OUT&&!inDoorway(x,z))return TW.h;
  if(rr>WR+WT+2)return duneY(x,z);
  if(rr>WR-1.5)return WH;
  const q=solidAt(x,z);if(q.s<0)return q.h;
  return 0;}
// the drawn ground: the paving, flat right up to the buildings (they stand on it), the tower's floors, the desert outside
function meshY(x,z){const rr=Math.hypot(x,z);if(rr<TW.r+.5)return groundY(x,z);if(rr>WR-WT-2)return duneY(x,z);return 0;}
// the camera's roof, inside the tower (the hall, the spiral corridor; the chamber is open to the sky)
function ceilAt(x,z){const rr=Math.hypot(x,z);if(rr>=TW.r||rr<CR+.5)return 1e4;return floorAt(x,z)+(rr>RC+RW+1?11:9);}
function camClamp(head){const c=camera.position,g=groundY(c.x,c.z)+.4;if(c.y<g)c.y=g;const ce=ceilAt(c.x,c.z)-.4;if(c.y>ce)c.y=ce;}

/* ---------- materials ---------- */
const TEXL=new THREE.TextureLoader(),TSUF=coarse?'phone':'pc';
function ldTex(n){const t=TEXL.load('img/tex/'+n+'-'+TSUF+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=coarse?2:8;return t;}
const TX={rock:ldTex('rock'),sand:ldTex('sand'),soil:ldTex('soil'),peb:ldTex('pebbles')};
function triMat(t,scale,boost,opts,desat,soft){const m=new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.9,metalness:.05},opts||{}));const U={tA:{value:t}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader='uniform sampler2D tA;varying vec3 vWP;varying vec3 vWN;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 bw=pow(abs(normalize(vWN)),vec3(4.0));bw/=(bw.x+bw.y+bw.z);float k=${scale.toFixed(3)};
      vec3 tc=pow(texture2D(tA,vWP.zy*k).rgb,vec3(2.2))*bw.x+pow(texture2D(tA,vWP.xz*k).rgb,vec3(2.2))*bw.y+pow(texture2D(tA,vWP.xy*k).rgb,vec3(2.2))*bw.z;
      ${desat?`tc=mix(tc,vec3(dot(tc,vec3(.3,.5,.2))),${desat.toFixed(2)});`:''}${soft?`tc=mix(vec3(dot(tc,vec3(.33))),tc,${(1-soft).toFixed(2)});`:''}diffuseColor.rgb=tc*diffuseColor.rgb*${boost.toFixed(2)};`);};
  return m;}
/* the white stone: seamless, pale, a little glossy; it gives off a faint light of its own (the city is lit from nowhere).
   Gold threads run through it in lines (the glyphs); the DOME uniform brightens them when the socket wakes */
const CITY={glyph:{value:.55},wake:{value:0},t:{value:0}};
function whiteMat(o){o=o||{};const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:o.rough||.32,metalness:.05,emissive:C(0xc89a44),emissiveIntensity:o.em==null?.06:o.em,side:o.side||THREE.FrontSide});
  m.onBeforeCompile=sh=>{sh.uniforms.uWake=CITY.wake;sh.uniforms.uT=CITY.t;
    sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader='uniform float uWake,uT;varying vec3 vWP;varying vec3 vWN;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      // a soft gradient up the stone, and a pulse of light climbing it when the city wakes
      float hk=clamp(vWP.y/160.0,0.0,1.0);totalEmissiveRadiance*=(.75+.5*hk);
      // the gold undertone (Bryce, Oct 22): richest low down and where the stone turns away from the light
      float lowK=1.0-smoothstep(0.0,60.0,vWP.y);float turn=1.0-clamp(dot(normalize(vWN),vec3(-.55,.62,-.3)),0.0,1.0);
      totalEmissiveRadiance+=vec3(.62,.42,.12)*(.03+.05*lowK)*(.5+.5*turn);
      diffuseColor.rgb*=mix(vec3(1.0),vec3(1.0,.93,.78),.18*turn+.08*lowK);
      float wv=uWake*(.5+.5*sin(vWP.y*.06-uT*1.6));totalEmissiveRadiance+=vec3(.55,.66,.9)*wv*.12;`);};
  return m;}
const stoneMat=whiteMat();
const stoneInMat=whiteMat({em:.05,rough:.3,side:THREE.DoubleSide});
const goldMat=new THREE.MeshBasicMaterial({vertexColors:true,color:C(0xffcf7a),toneMapped:false});
const groundMat=(()=>{const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.08,emissive:C(0xb08840),emissiveIntensity:.03});
  m.onBeforeCompile=sh=>{sh.uniforms.uWake=CITY.wake;sh.uniforms.uT=CITY.t;
    sh.vertexShader='varying vec3 vWP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='uniform float uWake,uT;varying vec3 vWP;\nfloat h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float city=1.0-smoothstep(${(WR-WT-4).toFixed(1)},${(WR+10).toFixed(1)},length(vWP.xz));
      vec2 q=vWP.xz/3.0;vec2 f=abs(fract(q)-.5);float seam=smoothstep(.47,.5,max(f.x,f.y));
      float slab=h21(floor(q));float inT=1.0-smoothstep(68.0,72.0,length(vWP.xz));
      diffuseColor.rgb*=mix(1.0,(.5+.16*slab)*(1.0-seam*.55)*(1.0-.22*inT),city);
      float gl=smoothstep(.975,1.0,abs(sin(length(vWP.xz)*.13)))*city*step(vWP.y,2.0)*step(80.0,length(vWP.xz));`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      totalEmissiveRadiance+=vec3(1.0,.72,.28)*gl*(.45+uWake*1.2);totalEmissiveRadiance*=city+.1;`);};return m;})();
const hostMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.55,metalness:.6});
const purpleGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:C(FLEET_PURPLE).multiplyScalar(1.1),toneMapped:false});
const HOST_GLOW=FLEET_PURPLE;
const K_W=C(0xf7f3ea),K_W2=C(0xeee6d4),K_GOLD=new THREE.Color(1,1,1);   // (gold's colour is goldMat's)

/* ---------- the ground: one mesh, fine along the walk and in the tower, coarse over the rest of the city and the desert ---------- */
{const steps=(a,b,fine,lo,hi,cs)=>{const o=[];let v=a;while(v<b){o.push(v);v+=(v>=lo&&v<hi)?fine:(Math.abs(v)>WR+40?cs*2.5:cs);}o.push(b);return o;};
 const f=coarse?2.1:1.5,xs=steps(-1800,1800,f,-86,86,coarse?16:12),zs=steps(-1800,1800,f,-86,500,coarse?16:12);
 const NX=xs.length,NZ=zs.length,pos=new Float32Array(NX*NZ*3),col=new Float32Array(NX*NZ*3),pale=C(0xf0eadc),sand=C(0x5a3024),tmp=new THREE.Color();
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=xs[i],z=zs[j],k=(j*NX+i)*3,y=meshY(x,z);pos[k]=x;pos[k+1]=y;pos[k+2]=z;
   const rr=Math.hypot(x,z),o=sstep(WR-WT-6,WR+30,rr);tmp.copy(pale).lerp(sand,o).multiplyScalar(.9+.12*vnoise(x*.05,z*.05));col[k]=tmp.r;col[k+1]=tmp.g;col[k+2]=tmp.b;}
 const idx=new Uint32Array((NX-1)*(NZ-1)*6);let q=0;
 for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const p=j*NX+i,r=p+1,c=p+NX,d=c+1;idx[q++]=p;idx[q++]=c;idx[q++]=r;idx[q++]=r;idx[q++]=c;idx[q++]=d;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
 const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;scene.add(m);}

/* ---------- obstacles: circles for collision, cover and line of sight (OBST); long ones also in BARS. FLY: what the dropship can
   hit in the air (circles with a height, the wall, the tower) ---------- */
const OBST=[],BARS=[],FLY=[];
const sm=new Merger(),sg=new Merger(),wm=new Merger(),wg=new Merger();   // white stone, its gold; the war's wreckage, its glow
function at0(s,lat){const p=roadPt(clamp(s,0,ROAD_LEN)).clone(),n=roadN(clamp(s,0,ROAD_LEN));p.x+=n.x*lat;p.z+=n.z*lat;p.y=floorAt(p.x,p.z);return p;}
// a smooth white form: a tapering, slightly swelling column of n sides (n high = round). No joins: one surface, top to bottom
function form(x,z,y0,h,r0,r1,n,ry,col,swell){if(y0<1&&r0>1.5&&!form.noSolid)addSolid({x,z,r:r0*1.01+.4,h:y0+h});const g=new THREE.CylinderGeometry(r1,r0,h,n||24,Math.max(2,Math.round(h/12)));const P=g.attributes.position;
  for(let i=0;i<P.count;i++){const v=P.getY(i)/h+.5,k=1+(swell||.08)*Math.sin(v*Math.PI);P.setX(i,P.getX(i)*k);P.setZ(i,P.getZ(i)*k);}g.computeVertexNormals();
  sm.add(g,M(x,y0+h/2,z,0,ry||0,0),col||K_W);return g;}
/* ---------- the gold (Bryce, Oct 22): lines may cross, but never as one lone cross. Where they meet, several verticals and several
   horizontals cross each other, a lattice, a woven band. Elsewhere a line runs on its own. ---------- */
const _ga=new THREE.Vector3(),_gb=new THREE.Vector3(),_gm=new THREE.Matrix4(),_gq=new THREE.Quaternion(),_gz=new THREE.Vector3(0,0,1),_gs=new THREE.Vector3();
// a straight gold bar from a to b, t thick
function goldSeg(mg,a,b,t){_ga.subVectors(b,a);const L=_ga.length();if(L<1e-3)return;_gq.setFromUnitVectors(_gz,_ga.multiplyScalar(1/L));
  _gb.addVectors(a,b).multiplyScalar(.5);_gm.compose(_gb,_gq,_gs.set(1,1,1));mg.add(new THREE.BoxGeometry(t,t,L+t),_gm.clone(),K_GOLD);}
function goldLine(mg,pts,t){for(let i=0;i<pts.length-1;i++)goldSeg(mg,pts[i],pts[i+1],t);}
// a form's radius at height y (form() below: tapering r0→r1, swelling in the middle)
function formR(y0,h,r0,r1,sw,y){const v=clamp((y-y0)/h,0,1);return lerp(r0,r1,v)*(1+(sw||.08)*Math.sin(v*Math.PI));}
// a point on a form's surface, on vertex j of its n sides (so the gold sits on an edge, not floating off a flat face)
function formPt(x,z,y0,h,r0,r1,n,ry,sw,j,y,out){const r=formR(y0,h,r0,r1,sw,y)+.18,a=j/n*Math.PI*2+ry;return(out||new THREE.Vector3()).set(x+Math.sin(a)*r,y,z+Math.cos(a)*r);}
// a lone gold thread up one edge of a form, following its swell
function thread(x,z,y0,h,r0,r1,n,ry,sw,ya,yb,j){const P=[];const N=Math.max(2,Math.ceil((yb-ya)/6));for(let i=0;i<=N;i++)P.push(formPt(x,z,y0,h,r0,r1,n,ry,sw,j||0,lerp(ya,yb,i/N)));goldLine(sg,P,.42);}
// a woven band round a form: three rings, crossed by short verticals on its edges (and by the long thread, if it has one)
function wovenBand(x,z,y0,h,r0,r1,n,ry,sw,yc,gap){gap=gap||1.3;const step=n>12?2:1;
  for(const dy of[-gap,0,gap]){const y=yc+dy,P=[];for(let j=0;j<=n;j++)P.push(formPt(x,z,y0,h,r0,r1,n,ry,sw,j,y));goldLine(sg,P,.3);}
  for(let j=0;j<n;j+=step){goldLine(sg,[formPt(x,z,y0,h,r0,r1,n,ry,sw,j,yc-gap*2.1),formPt(x,z,y0,h,r0,r1,n,ry,sw,j,yc),formPt(x,z,y0,h,r0,r1,n,ry,sw,j,yc+gap*2.1)],.26);}}
// cover in the streets: low curved benches of the same stone (you can shoot over them), and the war's wreckage
function bench(x,z,ry,w){const y=floorAt(x,z);sm.add(boxUV(w,1.15,1,2),M(x,y+.57,z,0,ry,0),K_W2);sg.add(new THREE.BoxGeometry(w*.92,.05,.05),M(x,y+1.0,z,0,ry,0).multiply(M(0,0,.5)),K_GOLD);
  const n=Math.max(1,Math.round(w/1.4));for(let i=0;i<n;i++){const u=(i+.5)/n-.5;OBST.push({x:x+Math.cos(ry)*u*w,z:z-Math.sin(ry)*u*w,r:.75,h:1.3,bar:true});}
  BARS.push({ax:x-Math.cos(ry)*w/2,az:z+Math.sin(ry)*w/2,bx:x+Math.cos(ry)*w/2,bz:z-Math.sin(ry)*w/2,r:.75});}
const K_BURN=C(0x231c1c),K_HER=C(0x3a1616);
function hulk(x,z,w,h,d,ry,col,obst){const y=floorAt(x,z);wm.add(boxUV(w,h,d,3),M(x,y+h*.35,z,R(-.12,.12),ry,R(-.18,.18)),col||K_BURN);if(obst!==false)OBST.push({x,z,r:Math.max(w,d)*.45,h:h*.8});}
// pillars and planters along the streets: round, tall, smooth (cover you can't shoot through)
function pillar(x,z,r,h){form(x,z,floorAt(x,z),h,r,r*.8,16,0,K_W,.04);OBST.push({x,z,r:r+.1,h});}

/* ---------- THE WALL: a ring of white stone, 110 m high. The opening is cut through one great block on the south side,
   its edge ringed in gold; until the case wakes it, a skin of pale light fills it ---------- */
const WALL=(()=>{const G=new THREE.Group();scene.add(G);const N=96,gap=2;   // segments; the opening's block replaces `gap` of them each side of south
  const m=new Merger(),gm=new Merger();
  for(let k=0;k<N;k++){const a=(k+.5)/N*Math.PI*2;if(Math.min(a,Math.PI*2-a)<(gap+.5)/N*Math.PI*2)continue;   // (a=0 is south)
    const x=Math.sin(a)*(WR+WT/2),z=Math.cos(a)*(WR+WT/2),w=2*Math.PI*(WR+WT)/N+.6;
    m.add(boxUV(w,WH,WT,6),M(x,WH/2,z,0,a,0),k%2?K_W:K_W2);
    gm.add(new THREE.BoxGeometry(w*.98,1.2,.5),M(Math.sin(a)*(WR-.2),WH-6,Math.cos(a)*(WR-.2),0,a,0),K_GOLD);gm.add(new THREE.BoxGeometry(w*.98,1.2,.5),M(Math.sin(a)*(WR+WT+.2),WH-6,Math.cos(a)*(WR+WT+.2),0,a,0),K_GOLD);
    if(k%4===0){gm.add(new THREE.BoxGeometry(1,WH*.8,.5),M(Math.sin(a)*(WR-.2),WH*.42,Math.cos(a)*(WR-.2),0,a,0),K_GOLD);}
    // a parapet with a walk along the top
    m.add(boxUV(w,3,1.4,2),M(Math.sin(a)*(WR+.7),WH+1.5,Math.cos(a)*(WR+.7),0,a,0),K_W2);}
  // the gate block: a slab with a round hole, ringed in gold on both faces
  const gw=2*Math.PI*(WR+WT)/N*(gap*2+1)+2,sh=new THREE.Shape();sh.moveTo(-gw/2,0);sh.lineTo(gw/2,0);sh.lineTo(gw/2,WH);sh.lineTo(-gw/2,WH);sh.lineTo(-gw/2,0);
  const hole=new THREE.Path();hole.absarc(0,GATE.y,GATE.r,0,Math.PI*2,true);sh.holes.push(hole);
  const eg=new THREE.ExtrudeGeometry(sh,{depth:WT+6,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.2,bevelSegments:2,curveSegments:64});eg.translate(0,0,-(WT+6)/2);
  // ExtrudeGeometry has uv but no matching normals for Merger? it does: position, normal, uv
  m.add(eg,M(0,0,WR+WT/2),K_W);
  for(const zz of[WR-3.4,WR+WT+3.4]){const tg=new THREE.TorusGeometry(GATE.r+1.8,1.2,10,96);gm.add(tg,M(0,GATE.y,zz),K_GOLD);
    for(let k=0;k<24;k++){const a=k/24*Math.PI*2;gm.add(new THREE.BoxGeometry(.35,4.5,.35),M(Math.cos(a)*(GATE.r+5),GATE.y+Math.sin(a)*(GATE.r+5),zz,0,0,a+Math.PI/2),K_GOLD);}}
  const wmesh=new THREE.Mesh(m.build(),stoneMat);wmesh.castShadow=wmesh.receiveShadow=true;G.add(wmesh);G.add(new THREE.Mesh(gm.build(),goldMat));
  // the skin across the opening: pale, rippling; it irises open from the middle
  const skinU={uT:{value:0},open:{value:0}};
  const skin=new THREE.Mesh(new THREE.CircleGeometry(GATE.r+.4,64),new THREE.ShaderMaterial({uniforms:skinU,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vU;void main(){vU=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vU;uniform float uT,open;void main(){float r=length(vU)/${(GATE.r+.4).toFixed(1)};if(r<open)discard;
      float rip=.5+.5*sin(r*26.0-uT*1.4);float edge=smoothstep(open,open+.05,r);
      vec3 c=mix(vec3(.75,.82,.95),vec3(1.0,.92,.75),rip*.4)*(.55+.3*rip);c+=vec3(1.0,.85,.5)*(1.0-smoothstep(open,open+.03,r))*step(.001,open)*3.0;
      gl_FragColor=vec4(c,(.55+.25*rip)*edge);}`}));
  skin.position.set(0,GATE.y,WR+WT/2);G.add(skin);
  return{G,skin,skinU,open:0};})();
// what the dropship can hit: the wall is a ring (handled in js/pathfinder3/02-air.js), and these
FLY.push({x:0,z:0,r:TW.r+2,h:TW.h});

/* ---------- THE STREETS: façades along both sides (they cover the solid band in groundY), pillars, benches for cover, a few
   bridges overhead, and in two places a square off to the side. The war has been here: burned Herald wreckage, scorches ---------- */
const FACADES=[];
{const lastS=S_DOOR-8;
 for(const side of[-1,1]){let s=-6;while(s<lastS){const w=R(16,30),sMid=s+w/2;if(sMid>lastS)break;
   // leave gaps for the side squares
   if(SIDES.some(o=>Math.sign(o.lat1)===side&&Math.abs(sMid-o.s)<o.r+w/2+2)){s+=w+1;continue;}
   const p=roadPt(clamp(sMid,0,ROAD_LEN)).clone(),n=roadN(clamp(sMid,0,ROAD_LEN)),hl=laneHalf(clamp(sMid,0,ROAD_LEN)),d=R(22,34),h=R(28,86);
   const cx=p.x+n.x*side*(hl+d/2+1),cz=p.z+n.z*side*(hl+d/2+1),ry=Math.atan2(n.x,n.z)+Math.PI/2;
   if(Math.hypot(cx-LZ.x,cz-LZ.z)<LZ.r+d/2-2&&sMid<20){s+=w+1;continue;}
   // the façade: a block with its street face set in a long soft curve, and a crown that steps back
   const g=new THREE.CylinderGeometry(w*.62,w*.7,h,20,Math.max(2,Math.round(h/12)),false);g.scale(1,1,d/(w*1.3));
   sm.add(g,M(cx,h/2,cz,0,ry,0),rng()<.5?K_W:K_W2);
   if(h>40)form(cx,cz,h,R(10,40),w*.38,w*.18,16,ry,K_W);
   // tall narrow openings on the street face (dark, a few lit gold from within) and threads of gold up the face
   {const fx=-n.x*side,fz=-n.z*side,ux=n.z,uz=-n.x;   // the face toward the street, and the direction along it
    const fp=(u,y)=>{const r=lerp(w*.7,w*.62,clamp(y/h,0,1)),b=r*d/(w*1.3),dep=r*Math.sqrt(Math.max(0,1-(u/b)*(u/b)))+.12;return new THREE.Vector3(cx+fx*dep+ux*u,y,cz+fz*dep+uz*u);};
    const hl=(y,u0,u1,t)=>{const P=[];for(let i=0;i<=8;i++)P.push(fp(lerp(u0,u1,i/8),y));goldLine(sg,P,t);};
    hl(6.5,-w*.36,w*.36,.3);                                                   // the line along the foot, on its own
    const yb=clamp(h*.42,15,38),U=w*.13;
    for(const dy of[-1.25,0,1.25])hl(yb+dy,-U*2.6,U*2.6,.24);                 // the band: three horizontals...
    for(let k=-2;k<=2;k++){if(k===0)continue;goldLine(sg,[fp(k*U,yb-2.7),fp(k*U,yb),fp(k*U,yb+2.7)],.22);}   // ...four short verticals through them...
    const V=[];for(let y=9;y<=h*.8;y+=4)V.push(fp(0,y));if(V.length>1)goldLine(sg,V,.26);}   // ...and the long thread up the middle, through the band
   FACADES.push({x:cx,z:cz,w,d,h,ry});addSolid({x:cx,z:cz,e:true,a:w*.7+.5,b:w*.7*d/(w*1.3)+.5,c:Math.cos(ry),sn:Math.sin(ry),h});FLY.push({x:cx,z:cz,r:Math.max(w,d)*.55,h:h+(h>40?30:0)});
   s+=w+R(1,4);}}
 // pillars along the street, cover benches, wreckage
 for(let s=24;s<S_DOOR-20;s+=R(22,34)){const hl=laneHalf(s);for(const side of[-1,1])if(rng()<.7){const p=at0(s+R(-4,4),side*(hl-R(2,4)));pillar(p.x,p.z,R(.8,1.3),R(7,14));}}
 for(const [s,lat,w] of[[30,-6,5],[44,7,6],[66,-3,5],[82,8,5],[96,-8,6],[120,2,5],[136,-7,5],[158,7,6],[172,-2,5],[190,9,5],[204,-6,6],[226,3,5],[240,-8,5],[262,6,6],[276,-3,5]]){
   if(s>S_DOOR-16)continue;const p=at0(s,lat),n=roadN(s);bench(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.3,.3),w);}
 // the war's leavings: burned Herald armour and transports, scorched along the way (red's work: they mean to bring the city down)
 for(const [s,lat] of[[52,-10],[88,11],[146,-12],[184,10],[232,-11],[268,9]]){if(s>S_DOOR-16)continue;const p=at0(s,lat);hulk(p.x,p.z,R(2,3.4),R(1,1.8),R(3,6),R(0,3),k3(),true);}
 // bridges across the street, high up (the air fight flies under some of them)
 for(const s of[78,168,248]){if(s>S_DOOR-14)continue;const p=roadPt(s).clone(),n=roadN(s),hl=laneHalf(s);const y=R(30,44);
   const g=new THREE.BoxGeometry((hl+18)*2,2.4,6);sm.add(g,M(p.x,y,p.z,0,Math.atan2(n.x,n.z)+Math.PI/2,0),K_W2);}
}
function k3(){return rng()<.5?K_HER:K_BURN;}
// the side squares: a garden of white stone trees (east of the street at 100 m) and an arcade (west, 214 m)
{const o=SIDES[0];for(let k=0;k<7;k++){const a=k/7*Math.PI*2,x=o.cx+Math.cos(a)*8,z=o.cz+Math.sin(a)*8;form(x,z,0,R(6,10),.5,.2,12,0,K_W,.25);sm.add(new THREE.SphereGeometry(R(1.6,2.4),16,10),M(x,R(7,10),z),K_W2);OBST.push({x,z,r:.7,h:8});}
  const c=new THREE.Mesh(new THREE.CircleGeometry(4,40),new THREE.MeshBasicMaterial({color:C(0x8ab4ff).multiplyScalar(.7),transparent:true,opacity:.55,toneMapped:false}));c.rotation.x=-Math.PI/2;c.position.set(o.cx,.05,o.cz);scene.add(c);
  for(const side of[-1,1])form(o.cx+side*o.R+side*6,o.cz,0,38,9,6,16,0,K_W2);}
{const o=SIDES[1];for(let k=0;k<6;k++){const a=k/6*Math.PI+Math.PI/2,x=o.cx+Math.cos(a)*(o.R-1.5),z=o.cz+Math.sin(a)*(o.R-1.5);pillar(x,z,.8,9);}
  sm.add(new THREE.TorusGeometry(o.R-1.5,1.2,8,40,Math.PI),M(o.cx,9,o.cz,Math.PI/2,0,0),K_W2);}

/* ---------- the rest of the city: towers in rings round the heart, lower toward the wall; long arcs of building; domes; bridges
   between towers. Nothing stands on the walk or in the plaza. From the street you see their tops over the façades ---------- */
{const near=(x,z,m)=>Math.hypot(x,z)<TW.r+20||Math.hypot(x-LZ.x,z-LZ.z)<LZ.r+30+m||FACADES.some(F=>Math.hypot(x-F.x,z-F.z)<Math.max(F.w,F.d)*.6+m)||(roadSeg(x,z).d<(laneHalf(roadS(x,z))||12)+30+m&&roadS(x,z)<S_DOOR+4)||SIDES.some(o=>Math.hypot(x-o.cx,z-o.cz)<o.R+12+m);
 let placed=0;
 for(let k=0;k<(coarse?110:170);k++){const a=R(0,Math.PI*2),r=Math.sqrt(R(.02,1))*(WR-50),x=Math.sin(a)*r,z=Math.cos(a)*r;
   const big=r<260,w=big?R(22,44):R(16,32);if(near(x,z,w))continue;
   const h=(big?R(50,160):R(24,80))*(1-.4*r/WR)+R(0,16);const n=pick([8,12,24,24,32]);
   const r1=w*R(.3,.62),ry=R(0,3),sw=R(.06,.22);form(x,z,0,h,w*.5,r1,n,ry,rng()<.6?K_W:K_W2,sw);
   if(rng()<.4)form(x,z,0,R(6,12),w*.75,w*.7,n,0,K_W2,.02);
   const gk=rng(),jT=Math.floor(R(0,n));
   if(gk<.42&&h>30){const yc=h*R(.35,.62),gap=w>30?1.7:1.3;wovenBand(x,z,0,h,w*.5,r1,n,ry,sw,yc,gap);if(rng()<.7)thread(x,z,0,h,w*.5,r1,n,ry,sw,h*.08,h*.85,jT);}
   else if(gk<.75)thread(x,z,0,h,w*.5,r1,n,ry,sw,h*.08,h*.85,jT);
   else if(gk<.9){const y=h*R(.3,.7),P=[];for(let j=0;j<=n;j++)P.push(formPt(x,z,0,h,w*.5,r1,n,ry,sw,j,y));goldLine(sg,P,.4);}
   if(rng()<.35)sm.add(new THREE.SphereGeometry(w*.3,20,12,0,Math.PI*2,0,Math.PI/2),M(x,h,z),K_W2);
   FLY.push({x,z,r:w*.55,h:h+(rng()<.35?w*.3:0)});placed++;}
 // the low domes, and the arcs of building that ring the heart
 for(let k=0;k<14;k++){const a=k/14*Math.PI*2+.1,r=R(150,420),x=Math.sin(a)*r,z=Math.cos(a)*r,w=R(24,44);if(near(x,z,w))continue;
   sm.add(new THREE.SphereGeometry(w,28,14,0,Math.PI*2,0,Math.PI/2),M(x,-w*.15,z,0,0,0).multiply(new THREE.Matrix4().makeScale(1,.55,1)),K_W2);FLY.push({x,z,r:w,h:w*.45});addSolid({x,z,r:w*.97+.4,h:w*.4});}
 for(let ring=0;ring<2;ring++){const r=[120,330][ring],nA=ring?9:5;for(let k=0;k<nA;k++){const a0=k/nA*Math.PI*2+R(.1,.3),len=R(.25,.45);
   for(let j=0;j<10;j++){const a=a0+len*j/10,x=Math.sin(a)*r,z=Math.cos(a)*r;if(near(x,z,10))continue;form(x,z,0,R(18,30),9,8,8,a,K_W2,.02);FLY.push({x,z,r:9,h:30});}}}}

/* ---------- THE HEART: the tower. Outside, 48 tall panels round it tapering to a crown, threads of gold; the door on the south,
   a round arch; inside, the hall, the spiral corridor (walls, a ceiling, a gold line along the walls, murals), the chamber ---------- */
const TOWER=(()=>{const G=new THREE.Group();scene.add(G);const m=new Merger(),gm=new Merger(),N=48,r1T=TW.r*.55;
  for(let k=0;k<N;k++){const a=(k+.5)/N*Math.PI*2;if(Math.min(a,Math.PI*2-a)<.5/N*Math.PI*2+.03)continue;   // (the door's panel is left out: its arch goes there)
    const r0=TW.r,r1=TW.r*.55,h=TW.h,w=2*Math.PI*r0/N+.4;
    // each panel leans in as it rises (a box sheared toward the axis)
    const g=boxUV(w,h,3,6);const P=g.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i)/h+.5,sc=lerp(1,r1/r0,y);P.setX(i,P.getX(i)*sc);P.setZ(i,P.getZ(i)-(1-sc)*r0);}g.computeVertexNormals();
    m.add(g,M(Math.sin(a)*(r0+1.5),h/2,Math.cos(a)*(r0+1.5),0,a,0),k%2?K_W:K_W2);
    if(k%2===0){const t=new THREE.BoxGeometry(1.1,h,.6);const Q=t.attributes.position;for(let i=0;i<Q.count;i++){const y=Q.getY(i)/h+.5,sc=lerp(1,r1/r0,y);Q.setZ(i,Q.getZ(i)-(1-sc)*r0);}
      gm.add(t,M(Math.sin(a)*(r0+3.1),h/2,Math.cos(a)*(r0+3.1),0,a,0),K_GOLD);}}
  // two woven bands round it, three rings each, crossing the 24 strips (radius: where the strips are at that height)
  for(const yc of[96,196])for(const dy of[-1.8,0,1.8]){const y=yc+dy,sc=lerp(1,r1T/TW.r,y/TW.h),rad=(TW.r+3.1)-(1-sc)*TW.r+.5;gm.add(new THREE.TorusGeometry(rad,.32,6,96),M(0,y,0,Math.PI/2,0,0),K_GOLD);}
  // the crown: a ring round the top, open in the middle (the shaft over the chamber comes out here)
  m.add(new THREE.TorusGeometry(TW.r*.55,6,12,64),M(0,TW.h,0,Math.PI/2,0,0),K_W);gm.add(new THREE.TorusGeometry(TW.r*.55-6,.6,6,64),M(0,TW.h+2,0,Math.PI/2,0,0),K_GOLD);
  // the door: an arch in the south face; the hall behind it (walls, ceiling) to the spiral
  const dz=TW.r+1.5;m.add(new THREE.TorusGeometry(7.2,2,10,40,Math.PI),M(0,10,dz+1),K_W);gm.add(new THREE.TorusGeometry(7.2,.25,6,40,Math.PI),M(0,10,dz+2.6),K_GOLD);
  /* (Bryce, Oct 23: you could walk through walls here and get lost.) The hall meets the spiral at its foot: the spiral runs off to the
     EAST, so the hall's east wall stops at the spiral's outer wall and leaves the corridor open; the west wall runs on to the spiral's
     inner wall and closes the corridor's foot (nothing is walkable west of it). The spiral's own walls start where the hall's do. */
  const hz1=dz+.25,hzW=RC-RW-.25,hzE=Math.sqrt((RC+RW)*(RC+RW)-HALL_X*HALL_X);   // hall walls: the door end; the west and east inner ends
  for(const s of[-1,1]){m.add(boxUV(4,10,6,3),M(s*7.2,5,dz+1),K_W);const z0=s<0?hzW:hzE;m.add(boxUV(.6,11,hz1-z0,3),M(s*5.6,5.5,(hz1+z0)/2,0,0,0),K_W2);
    gm.add(new THREE.BoxGeometry(.12,.12,hz1-z0-.9),M(s*5.25,1.3,(hz1+z0)/2),K_GOLD);}
  // over the spiral's mouth on the east: stone from the corridor's ceiling up to the hall's, so there is no slot to see out of
  m.add(boxUV(.6,2.4,hzE-hzW,3),M(5.6,10.1,(hzE+hzW)/2),K_W2);
  m.add(boxUV(12,1,TW.r-RC+RW+4,3),M(0,11.5,(dz+RC-RW)/2),K_W2);
  const ext=new THREE.Mesh(m.build(),stoneMat);ext.castShadow=ext.receiveShadow=true;G.add(ext);G.add(new THREE.Mesh(gm.build(),goldMat));
  // the door itself: a membrane of light like the opening's, until the case opens it
  const doorU={uT:{value:0},open:{value:0}};
  const door=new THREE.Mesh(new THREE.CircleGeometry(7.4,40,0,Math.PI),new THREE.ShaderMaterial({uniforms:doorU,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vU;void main(){vU=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vU;uniform float uT,open;void main(){float r=length(vU)/7.4;if(r<open)discard;float rip=.5+.5*sin(r*30.0-uT*2.5+vU.x*.8);
      gl_FragColor=vec4(mix(vec3(.75,.82,.95),vec3(1.0,.9,.7),rip*.4)*(.6+.35*rip),(.6+.25*rip)*smoothstep(open,open+.06,r));}`}));
  door.position.set(0,10,dz+1.2);G.add(door);
  // under the arch, a square of wall below the half-disc, so the membrane closes the whole doorway (it is drawn as a half disc + this)
  const doorLow=new THREE.Mesh(new THREE.PlaneGeometry(14.8,10),door.material);doorLow.position.set(0,5,dz+1.2);G.add(doorLow);

  // INSIDE: the spiral corridor. Strips along the spiral for the inner and outer wall, and the ceiling; a gold line along both walls
  const im=new Merger(),ig=new Merger();const seg=96;
  const strip=(r,y0f,y1f,col,inward,t0,t1)=>{const pos=[],nor=[],uv=[],idx=[];for(let k=0;k<=seg;k++){const th=t0+(t1-t0)*k/seg,p=spiralPt(th,r),f=spiralY(clamp(th,0,SPIRAL));
      const n=inward?[-Math.sin(th),0,-Math.cos(th)]:[Math.sin(th),0,Math.cos(th)];pos.push(p.x,f+y0f,p.z,p.x,f+y1f,p.z);nor.push(...n,...n);uv.push(k/4,0,k/4,(y1f-y0f)/4);}
    for(let k=0;k<seg;k++){const a=k*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g.toNonIndexed();};
  im.add(strip(RC-RW-.05,-.5,9.4,0,false,TH_IN0,SPIRAL-Math.asin(4.6/(RC-RW))),M(0,0,0),K_W);   // the inner wall (faces out, toward the corridor; across the hall's far end)
  im.add(strip(RC+RW+.05,-.5,9.4,0,true,TH_OUT0,SPIRAL+.12),M(0,0,0),K_W);    // the outer wall (faces in; it starts at the hall's east wall, so the hall stays open)
  // the ceiling: a ribbon over the corridor
  {const pos=[],nor=[],uv=[],idx=[];for(let k=0;k<=seg;k++){const th=SPIRAL*k/seg,f=spiralY(th)+9,a=spiralPt(th,RC-RW-.2),b=spiralPt(th,RC+RW+.2);pos.push(a.x,f,a.z,b.x,f,b.z);nor.push(0,-1,0,0,-1,0);uv.push(k/4,0,k/4,2);}
   for(let k=0;k<seg;k++){const a=k*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);im.add(g.toNonIndexed(),M(0,0,0),K_W2);}
  // the spiral's two ends (walls across the corridor) and the way in to the chamber at its top
  // (only the top end: the foot of the spiral is closed by the hall's west wall. The old wall there stood in the middle of the hall)
  {const th=SPIRAL+.1,p=spiralPt(th),f=spiralY(SPIRAL);im.add(boxUV(RW*2+1,10,1,2),M(p.x,f+4.5,p.z,0,th+Math.PI/2,0),K_W2);}
  // the way in (west): from the spiral's top straight in to the chamber; walls into the chamber's doorway, a ceiling that stops at it
  {const x0=-(RC-RW),x1=-CR+.5,cx=(x0+x1)/2;for(const s of[-1,1])im.add(boxUV(x1-x0,10,.6,3),M(cx,TOPY+4.5,s*4.5),K_W);
   const c0=-(RC+RW+1),c1=-CR+.4;im.add(boxUV(c1-c0,.8,9.6,3),M((c0+c1)/2,TOPY+9.6,0),K_W2);}
  // a gold line along both walls at waist height, climbing with the floor; and small lamps of light in the ceiling
  // (each starts where its wall does: the inner one across the hall's far end, the outer one at the hall's east wall)
  for(const r of[RC-RW+.1,RC+RW-.1])for(const hy of[1.25,8.6]){const pos=[],t0=r<RC?-Math.asin((HALL_X-.6)/r):Math.asin(HALL_X/r);
    for(let k=0;k<=seg;k++){const th=t0+(SPIRAL-t0)*k/seg,p=spiralPt(th,r);pos.push(new THREE.Vector3(p.x,spiralY(clamp(th,0,SPIRAL))+hy,p.z));}
    ig.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pos),seg*2,hy<2?.12:.18,5,false),M(0,0,0),K_GOLD);}
  const inside=new THREE.Mesh(im.build(),stoneInMat);inside.receiveShadow=true;G.add(inside);G.add(new THREE.Mesh(ig.build(),goldMat));
  const lamps=[];for(let k=0;k<7;k++){const th=SPIRAL*(k+.5)/7,p=spiralPt(th),l=new THREE.PointLight(C(0xfff0d8),1.1,22,1.5);l.position.set(p.x,spiralY(th)+7.5,p.z);G.add(l);lamps.push(l);}
  {const l=new THREE.PointLight(C(0xfff0d8),1,26,1.5);l.position.set(0,8,TW.r-6);G.add(l);lamps.push(l);}

  // THE CHAMBER: a round wall up to the crown (the shaft), its floor ringed in gold lines that run in to the socket
  // (Bryce, Oct 23: it was a closed ring, so the way in from the spiral ran into it and you walked through it.) A doorway on the west,
  // as wide as the way in; above it the wall carries on up the shaft
  const DA=Math.asin(4.8/(CR+.1)),grey=g=>{g.setAttribute('color',new THREE.Float32BufferAttribute(new Array(g.attributes.position.count*3).fill(.74),3));return g;};
  const cw=new THREE.Mesh(grey(new THREE.CylinderGeometry(CR+.1,CR+.1,TW.h-TOPY+4,64,8,true,Math.PI*1.5+DA,Math.PI*2-DA*2)),stoneInMat);
  cw.position.y=TOPY+(TW.h-TOPY)/2-1;G.add(cw);
  {const y0=TOPY+9.2,y1=TW.h+1;const lt=new THREE.Mesh(grey(new THREE.CylinderGeometry(CR+.1,CR+.1,y1-y0,4,8,true,Math.PI*1.5-DA,DA*2)),stoneInMat);lt.position.y=(y0+y1)/2;G.add(lt);}
  {const rg=new Merger(),Y=[TOPY+12,TOPY+30,TOPY+60,TOPY+110];for(const y of Y)for(const dy of[-1.1,0,1.1])rg.add(new THREE.TorusGeometry(CR-.25,.16,5,96),M(0,y+dy,0,Math.PI/2,0,0),K_GOLD);
   for(let k=0;k<16;k++){const a=k/16*Math.PI*2;if(Math.abs(a-Math.PI*1.5)<.25)continue;const y0=TOPY+1.5,y1=Y[3]+2.4;rg.add(new THREE.BoxGeometry(.26,y1-y0,.26),M(Math.sin(a)*(CR-.12),(y0+y1)/2,Math.cos(a)*(CR-.12)),K_GOLD);}
   G.add(new THREE.Mesh(rg.build(),goldMat));}
  const floorU={uT:{value:0},wake:{value:0}};
  const fl=new THREE.Mesh(new THREE.CircleGeometry(CR,96),new THREE.ShaderMaterial({uniforms:floorU,transparent:true,depthWrite:false,
    vertexShader:'varying vec2 vU;void main(){vU=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vU;uniform float uT,wake;void main(){float r=length(vU),a=atan(vU.y,vU.x);
      float rings=smoothstep(.93,1.0,sin(r*1.6))*.8+smoothstep(.985,1.0,sin(a*12.0))*step(3.0,r)*.7;
      float run=wake>0.0?smoothstep(.0,.4,1.0-abs(r-(28.0*fract(uT*.25)))*.3):0.0;
      vec3 c=vec3(1.0,.82,.45)*rings*(.25+wake*1.2)+vec3(.7,.85,1.0)*run*wake*.6;gl_FragColor=vec4(c,clamp(rings*(.35+wake)+run*wake*.5,0.0,1.0));}`}));
  fl.rotation.x=-Math.PI/2;fl.position.y=TOPY+.03;G.add(fl);
  // the socket: a low round dais with a slot in it the shape of the object, gold round its lip
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.3,.8,48),stoneInMat);dais.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(dais.geometry.attributes.position.count*3).fill(.92),3));dais.position.set(0,TOPY+.4,0);G.add(dais);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(.6,.06,6,32),new THREE.MeshBasicMaterial({color:C(0xffd890).multiplyScalar(1.6),toneMapped:false}));lip.rotation.x=Math.PI/2;lip.position.set(0,TOPY+.81,0);G.add(lip);
  const slot=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({color:0x000000}));slot.rotation.x=-Math.PI/2;slot.position.set(0,TOPY+.805,0);G.add(slot);
  OBST.push({x:0,z:0,r:1.4,h:1});
  // the chamber's light: high, cold, from the shaft (the sky); a ring of small gold lamps round the wall
  const cl=new THREE.PointLight(C(0xd8e4ff),.8,90,1);cl.position.set(0,TOPY+55,0);G.add(cl);
  const ringL=[];for(let k=0;k<6;k++){const a=k/6*Math.PI*2,l=new THREE.PointLight(C(0xffd890),.45,16,1.6);l.position.set(Math.sin(a)*(CR-2),TOPY+3,Math.cos(a)*(CR-2));G.add(l);ringL.push(l);}
  // the murals: three panels on the spiral's outer wall (what Thorne reads: the people who were here, their fall, and what saved them)
  const murals=[];
  [[.35,'cities'],[.62,'fall'],[.88,'dome']].forEach(([u,kind],i)=>{const th=SPIRAL*u,p=spiralPt(th,RC+RW-.12),f=spiralY(th);
    const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');drawMural(x,kind);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
    const pm=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,color:C(0xffffff).multiplyScalar(1.1)}));
    pm.position.set(p.x,f+3.6,p.z);pm.lookAt(0,f+3.6,0);G.add(pm);murals.push({th,p:new THREE.Vector3(p.x*.9,f,p.z*.9),kind,m:pm});});
  return{G,door,doorLow,doorU,lamps,cw,fl,floorU,dais,lip,cl,ringL,murals,ext};})();
// the murals: gold line drawings on the stone (the record of a people older than the Heralds)
function drawMural(x,kind){x.clearRect(0,0,512,256);x.strokeStyle='rgba(255,214,140,.95)';x.fillStyle='rgba(255,214,140,.9)';x.lineWidth=3;x.lineCap='round';
  const fig=(cx,cy,s)=>{x.beginPath();x.arc(cx,cy-s*1.6,s*.35,0,7);x.moveTo(cx,cy-s*1.2);x.lineTo(cx,cy);x.moveTo(cx-s*.6,cy-s*.8);x.lineTo(cx+s*.6,cy-s*.8);x.moveTo(cx,cy);x.lineTo(cx-s*.4,cy+s);x.moveTo(cx,cy);x.lineTo(cx+s*.4,cy+s);x.stroke();};
  x.beginPath();x.rect(6,6,500,244);x.stroke();
  if(kind==='cities'){   // towers on many worlds, linked by lines
    for(let w=0;w<3;w++){const cx=90+w*165;x.beginPath();x.arc(cx,150,46,0,7);x.stroke();for(let k=0;k<5;k++){x.beginPath();x.moveTo(cx-30+k*15,150-20);x.lineTo(cx-30+k*15+3,150-60-k*7%30);x.stroke();}}
    x.beginPath();x.moveTo(136,150);x.lineTo(209,150);x.moveTo(301,150);x.lineTo(374,150);x.stroke();for(let k=0;k<6;k++)fig(60+k*80,230,9);}
  else if(kind==='fall'){   // a dark spiral over the cities, the towers broken, the people scattered
    x.beginPath();for(let k=0;k<200;k++){const a=k*.12,r=k*.45;x.lineTo(256+Math.cos(a)*r,100+Math.sin(a)*r*.6);}x.stroke();
    for(let k=0;k<5;k++){x.beginPath();x.moveTo(60+k*90,230);x.lineTo(70+k*90,190);x.lineTo(82+k*90,205);x.lineTo(90+k*90,170);x.stroke();}
    x.save();x.translate(400,210);x.rotate(.6);fig(0,0,10);x.restore();x.save();x.translate(110,215);x.rotate(-1.2);fig(0,0,10);x.restore();}
  else{   // a city under a dome, the dark spiral outside it, people standing inside, hands joined
    x.beginPath();x.arc(256,210,150,Math.PI,0);x.stroke();x.lineWidth=1.5;for(let k=0;k<9;k++){x.beginPath();x.arc(256,210,140-k*14,Math.PI,0);x.globalAlpha=.25;x.stroke();}x.globalAlpha=1;x.lineWidth=3;
    for(let k=0;k<5;k++){x.beginPath();x.moveTo(196+k*30,210);x.lineTo(198+k*30,150+(k%2)*20);x.stroke();}
    for(let k=0;k<6;k++)fig(176+k*32,240,7);x.beginPath();for(let k=0;k<90;k++){const a=k*.18,r=k*.3;x.lineTo(450+Math.cos(a)*r,70+Math.sin(a)*r*.6);}x.stroke();}}

/* ---------- the war over the city: a red Herald warship standing off to the north-east, firing down into the streets; fires where
   it has hit; amber guns on the wall shooting back. (The ships you fight are in js/pathfinder3/02-air.js) ---------- */
const WARSHIP=(()=>{const K=SHIPKIT.harrower(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat(panelTex)),new THREE.Mesh(K.glowGeo,fleetGlowMat(0xff3a1a,1.8)));
  K.geo.computeBoundingBox();const L=K.geo.boundingBox.max.z-K.geo.boundingBox.min.z;g.scale.setScalar(230/L);g.position.set(380,260,-560);g.lookAt(0,120,0);g.rotateY(Math.PI);
  MODELS.swapShip(g,'harrower',{ref:K.geo,tint:0xff6a5a});g.traverse(o=>{if(o.isMesh)o.castShadow=false;});scene.add(g);return{g,cool:3,on:true};})();
const FIRES=[];
{for(const [x,z,s] of[[150,-120,1],[-210,80,1.2],[60,240,.8],[260,140,.9],[-120,-260,1.1],[-300,-80,.9],[40,-330,1],[190,310,.7]]){
  const l=new THREE.PointLight(C(0xff7a2a),2*s,55*s,1.6);l.position.set(x,14,z);scene.add(l);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff8a3a).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.8}));sp.scale.setScalar(40*s);sp.position.set(x,10,z);scene.add(sp);
  FIRES.push({x,z,s,l,sp});}}

/* ---------- the merged meshes ---------- */
const wreckMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.6,metalness:.45});
{const a=new THREE.Mesh(sm.build(),stoneMat);a.castShadow=a.receiveShadow=true;scene.add(a);scene.add(new THREE.Mesh(sg.build(),goldMat));
 if(wm.p.length){const b=new THREE.Mesh(wm.build(),wreckMat);b.castShadow=b.receiveShadow=true;scene.add(b);}}

/* ---------- THE DOME: a shell of light over the whole city, risen from the shaft. Hex-cells, a bright rim where it meets the ground,
   lines of light climbing to the top; when it fails it flickers and thins and you can see through it. js/pathfinder3/03-story.js
   drives it (DOME.k: how far up it has risen, 0..1; DOME.f: how much of it is holding, 0..1; DOME.flick) ---------- */
const DOME=(()=>{const U={uT:{value:0},rise:{value:0},hold:{value:1},flick:{value:0}};const R0=WR+60;
  const m=new THREE.Mesh(new THREE.SphereGeometry(R0,96,48,0,Math.PI*2,0,Math.PI/2),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,
    vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=normalize(w.xyz-cameraPosition);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`varying vec3 vP;varying vec3 vN;varying vec3 vW;uniform float uT,rise,hold,flick;
    float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){float h=vP.y/${R0.toFixed(1)};if(h>rise)discard;
      vec2 q=vec2(atan(vP.z,vP.x)*30.0,h*40.0);vec2 g=vec2(q.x,q.y+mod(floor(q.x),2.0)*.5);vec2 f=abs(fract(g)-.5);float cell=smoothstep(.42,.5,max(f.x,f.y));
      float fres=pow(1.0-abs(dot(normalize(vN),-vW)),2.2);
      float front=smoothstep(rise-.06,rise,h)*step(h,rise)*(1.0-step(.999,rise));   // the bright edge climbing
      float lines=smoothstep(.97,1.0,sin(atan(vP.z,vP.x)*24.0))*(.5+.5*sin(h*30.0-uT*3.0));
      float gone=step(hold,hs(floor(g)+floor(uT*6.0)*.13));          // cells dropping out as it fails
      float fl=1.0-flick*step(.5,hs(vec2(floor(uT*14.0),3.0)));
      vec3 c=vec3(.55,.72,1.0)*(cell*.22+fres*.35+lines*.25)+vec3(1.0,.95,.85)*front*1.6+vec3(.7,.85,1.0)*smoothstep(.04,0.0,h)*.9;
      gl_FragColor=vec4(c*(1.0-gone)*fl*min(1.0,hold+.15),1.0);}`}));
  m.visible=false;m.renderOrder=2;scene.add(m);
  // the pillar of light up the shaft and out of the crown
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.6,TW.h-TOPY+40,24,1,true),new THREE.MeshBasicMaterial({color:C(0xc8d8ff).multiplyScalar(1.6),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
  beam.position.y=TOPY+(TW.h-TOPY+40)/2;scene.add(beam);
  return{m,U,beam,k:0,f:1,flick:0};})();

/* ---------- light, dust ---------- */
const helmLamp=new THREE.PointLight(C(0xd8e6ff),0,24,1.5);scene.add(helmLamp);
function updateLights(dt,T,pos){CITY.t.value=T;WALL.skinU.uT.value=T;TOWER.doorU.uT.value=T;TOWER.floorU.uT.value=T;DOME.U.uT.value=T;skyU.uT.value=T;
  for(const F of FIRES){const f=.75+.25*Math.sin(T*7+F.x)+.12*Math.sin(T*17+F.z);F.l.intensity=2*F.s*f;F.sp.material.opacity=.55+.3*f;if(rng()<.04*F.s)puff(new THREE.Vector3(F.x+R(-6,6),12,F.z+R(-6,6)),R(10,18),6);}
  const inT=Math.hypot(pos.x,pos.z)<TW.r;helmLamp.intensity=inT?0:0;}
const DUST_N=coarse?380:900,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,18),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.12,color:C(0xd8e0ff),transparent:true,opacity:.35,depthWrite:false}));scene.add(dust);

let composer=null,HQ=true;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.75,.5,.8));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
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
setLook('night');
