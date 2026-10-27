/* Elyra · Last Transmission · Level 05 · The Last Signal — the world. 13.03.2237, the night after the Mountain: Elyra's southern
   mountains under the alien sky. A long valley with a river at its floor winds through the lower peaks to the foot of one summit, and
   over the top of that summit, the Empty Host's prisoner-transfer facility: a transfer pad on its shoulder, a ledge along the crest,
   an outer security yard with firing terraces, then inside, room to room (see the map below), to an eight-sided vault where the
   suppressor hangs in a cage of light, and a switchback climb to the extraction pad on the very top of the peak.
   The engine contract is Site K's (js/pathfinder/01-world.js, js/origin/03-play.js: playD, groundY, roadS, laneHalf and friends);
   the map, the vault and the end are this level's own (Bryce, Oct 26: a summit with views all round, bends and turns between rooms,
   and an end that doesn't look like Site K's). Units are metres; north is -z; the facility's mouth is the origin. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(1303);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.6:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
window.ELYRA_RENDERER=renderer;
$('app').appendChild(renderer.domElement);
MODELS.preload(['chars/michael-hall','chars/keeper-pathfinder','rifle','chars/hollow-footsoldier','chars/hollow-heavy','chars/hollow-commander','chars/keepers-civilian','interceptor','wraith','dropship','voidclass']);MODELS.preloadScenes(['turret']);
// the loading screen warms these up before Begin (js/origin/03-play.js): the Empty Host's troopers and the Hollow turret
window.WARM_TEAMS=[null];window.WARM_TURRET=true;
window.ENEMY_CAP=28;window.ENEMY_CAP_PHONE=18;
window.HOST_LIFT=.5;   // the Host's troopers glow a little more here: their armour is the colour of their own walls
// you are Lt. Michael Hall (03-play's default): alone until the cells open

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
const skyU={sunDir:{value:sunDir},hor:{value:C(0x2a2238)},mid:{value:C(0x120e22)},zen:{value:C(0x020208)},starK:{value:1},sunK:{value:1},uT:{value:0},band:{value:1},photo:{value:null},photoK:{value:0},photoU:{value:.1},photoB:{value:.26},nebK:{value:0}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(4000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,mid,zen;uniform float starK,sunK,uT,band,photoK,photoU,photoB,nebK;uniform sampler2D photo;
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
    // Astraea's nebula (img/sky/nebula-gold-*.jpg) over the moon and in orbit; it fades with the stars (none in Astraea's air)
    if(photoK>0.0){float sk=max(min(starK,1.0),nebK);vec2 pu=vec2(atan(d.z,d.x)/6.2831853+.5+photoU,asin(clamp(y,-1.0,1.0))/3.1415927+.5);vec3 pc=pow(texture2D(photo,pu).rgb,vec3(2.2))*photoB*(.75+.25*starK);pc=pc/(1.0+pc*.8);
      c=mix(c,c*.4+pc,photoK*sk*smoothstep(-.6,nebK>0.0?.25:.1,y));}
    float s=max(dot(d,sunDir),0.0);c+=vec3(1.0,.85,.65)*pow(s,900.0)*6.0*sunK+vec3(1.0,.6,.4)*pow(s,24.0)*.12*sunK;
    c=mix(c,mix(hor,hor*.35,smoothstep(-.3,-.75,y)),smoothstep(-.3,-.65,y));   // Oct 24: the photo runs well below the horizon, then fades into the ground haze
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
sky.renderOrder=-3;skyGroup.add(sky);
SKIES.load('elyra',t=>{skyU.photo.value=t;skyU.photoK.value=1;});   // Bryce's alien sky (js/shared/skies.js): this is Elyra, the same sky as The Mountain
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
const MOONDIR=new THREE.Vector3(.55,.5,-.45).normalize();   // Elyra's big banded moon, high in the north-east: the light on the cliffs
const LOOKS={
  // Elyra at night (The Mountain's night: js/origin/01-world.js SKY_LOOK.night), and first light for the dropship's climb at the end
  elyra:{hor:0x2a3a6a,mid:0x121a38,zen:0x04060e,star:1,sunK:.2,fog:0x141a30,dens:.00095,keyC:0xa8bcff,keyI:1.25,hemiS:0x6a7ab0,hemiG:0x1c1626,hemiI:.85,planet:0,band:.6,dir:MOONDIR,exp:1.08,neb:1,pu:0,pb:.62},
  dawn:{hor:0xe0b080,mid:0x8aa8d0,zen:0x3a64a8,star:0,sunK:1.2,fog:0x8a7a66,dens:.0006,keyC:0xffc890,keyI:2.0,hemiS:0x7a8aa8,hemiG:0x4a3a2c,hemiI:.6,planet:0,band:0,dir:new THREE.Vector3(.7,.18,.3).normalize(),exp:1.0,neb:1,pu:-.52,pb:.5,sun:new THREE.Vector3(.7,.12,.3).normalize()},
  moon:{hor:0x2a2238,mid:0x120e22,zen:0x020208,star:1,sunK:1,fog:0x120e1c,dens:.0011,keyC:0xffb89a,keyI:.95,hemiS:0x7a7aa8,hemiG:0x18121e,hemiI:.55,planet:1,band:1,dir:ASTRAEA_DIR,exp:1.12},
  orbit:{hor:0x140a26,mid:0x0c0820,zen:0x04030c,star:1.7,sunK:1.3,fog:0x000000,dens:0,keyC:0xfff0e0,keyI:2.4,hemiS:0x404060,hemiG:0x000000,hemiI:.15,planet:1,band:1.8,dir:sunDir,exp:1.1},
  entry:{hor:0xff7a3a,mid:0x7a2614,zen:0x10060a,star:.15,sunK:.4,fog:0x5a1e12,dens:.00025,keyC:0xffa060,keyI:1.6,hemiS:0xff8a5a,hemiG:0x2a0a08,hemiI:.7,planet:0,band:0,dir:new THREE.Vector3(0,-1,.2).normalize(),exp:1.15},
  // Oct 25: Astraea's surface is Arc 02's own sky now (js/pathfinder2/01-world.js 'desert'): the same copper gradient, the same sun, and her
  // nebula over it (it used to be a flat gradient with no photo, because the photo was tied to the stars, and there are none in her air)
  astraea:{hor:0xe8a070,mid:0xb4583c,zen:0x4a1626,star:0,sunK:1.3,fog:0xb8704e,dens:.0011,keyC:0xffd2a0,keyI:2.0,hemiS:0xffb898,hemiG:0x3a1a14,hemiI:.8,planet:0,band:0,dir:new THREE.Vector3(.55,.42,.72).normalize(),exp:1.0,neb:1,pu:.3,pb:.5,sun:new THREE.Vector3(.55,.42,.72).normalize()}};
const SUN0=sunDir.clone();
let lookName='';
function setLook(name){const L=LOOKS[name];if(!L)return;lookName=name;sunDir.copy(L.sun||SUN0);
  skyU.hor.value.copy(C(L.hor));skyU.mid.value.copy(C(L.mid));skyU.zen.value.copy(C(L.zen));skyU.starK.value=L.star;skyU.sunK.value=L.sunK;skyU.band.value=L.band;
  scene.fog.color.copy(C(L.fog));scene.fog.density=L.dens;scene.background=scene.fog.color;
  keyLight.color.copy(C(L.keyC));keyLight.intensity=keyBase=L.keyI;hemi.color.copy(C(L.hemiS));hemi.groundColor.copy(C(L.hemiG));hemi.intensity=hemiBase=L.hemiI;keyDir=L.dir.clone();
  astraea.visible=astraeaHalo.visible=!!L.planet;renderer.toneMappingExposure=L.exp;
  skyU.nebK.value=L.neb||0;skyU.photoU.value=L.pu!=null?L.pu:.1;skyU.photoB.value=L.pb!=null?L.pb:.26;}

/* ---------- the map (Oct 26, second pass: Bryce wanted the outside on top of a mountain with views all round, a route inside that
   bends and turns from room to room, and an ending that doesn't look like Site K's) ----------
   The whole facility stands on a summit: the transfer pad on its southern shoulder, the ledge along its crest, the outer yard, and the
   inside running north through the peak, room to room: the guard room, west to a second room, north up the overlook corridor (the
   staging hall below its west glass), a turn into the detention wing, the junction at its end, east to a room, north up the
   containment wing to the vault's blast door. The vault is eight-sided. Out of its north side, a ramp climbs in switchbacks (three
   landings) to the extraction pad on the very top of the peak, open on every side, beside the signal mast.
   The way is one walkable "road" (a path with a width, js/origin/03-play.js's contract) plus ROOMS, round floors where it turns. */
const ROAD=[[0,0],[0,-40],[10,-90],[0,-118],[0,-146],[-44,-146],[-44,-236],[-20,-262],[-20,-386],[36,-386],[36,-452],[36,-474],[36,-500],[-34,-500],[-34,-520],[36,-520],[36,-540],[-14,-540],[-14,-556]];
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const ROADS=[],ROAD_LEN=(()=>{let s=0;for(let i=0;i<ROAD.length-1;i++){const [ax,az]=ROAD[i],[bx,bz]=ROAD[i+1],l=Math.hypot(bx-ax,bz-az);ROADS.push({ax,az,bx,bz,l,s0:s,nx:-(bz-az)/l,nz:(bx-ax)/l});s+=l;}return s;})();
const S_NODE=(()=>{const o=[0];for(const r of ROADS)o.push(r.s0+r.l);return o;})();
function roadSeg(x,z){let best=1e9,bs=0,bt=0,br=ROADS[0];for(const r of ROADS){const dx=r.bx-r.ax,dz=r.bz-r.az,t=clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.l*r.l),0,1),d=Math.hypot(x-r.ax-dx*t,z-r.az-dz*t);if(d<best){best=d;bs=r.s0+t*r.l;bt=t;br=r;}}return{s:bs,r:br,t:bt,d:best};}
// the stretches of the way in, by distance along it
const S_GATE=119,S_HOST=121,S_BAY0=214,S_BAY1=254,S_HALL0=318,S_HALL1=442,S_OLD=442,S_DOOR=566,S_CH0=S_DOOR,
  S_RAMP=604,S_SHUT=607,RAMP0=612,RAMP1=852,S_HANGAR=856,S_TOP=780;   // S_TOP: from the second landing on, the climb is out in the open air
// the rooms where the way turns (h: their height; the vault is eight-sided; the three landings are on the climb)
const ROOMS=[{id:'guard',n:4,r:11,h:8},{id:'west',n:5,r:10,h:8},{id:'junction',n:8,r:15,h:12},{id:'east',n:9,r:10,h:10},{id:'vault',n:11,r:16,h:13,sides:8},
  {id:'l1',n:13,r:7,h:6},{id:'l2',n:15,r:7,h:6},{id:'l3',n:17,r:7,h:1.1,open:true}].map(o=>Object.assign(o,{x:ROAD[o.n][0],z:ROAD[o.n][1],s:S_NODE[o.n]}));
const ROOM=id=>ROOMS.find(o=>o.id===id);
const CH=ROOM('vault'),PLAT={x:-14,z:-574,r:20},PLAT_Y=30;
const LZ_Z=236;
const LZ={x:0,z:LZ_Z,r:30};
// the climb: the floor rises along the ramp's legs and stays flat on the landings
const FLATS=ROOMS.filter(o=>/^l\d/.test(o.id)).map(o=>[o.s-o.r,o.s+o.r]);
const slopedTo=s=>{let v=clamp(s,RAMP0,RAMP1)-RAMP0;for(const [a,b] of FLATS)v-=Math.max(0,Math.min(s,b)-Math.max(RAMP0,a));return v;};
const SLOPED=slopedTo(RAMP1);
function rampY(s){if(s<=RAMP0)return 0;if(s>=RAMP1)return PLAT_Y;return PLAT_Y*slopedTo(s)/SLOPED;}
for(const o of ROOMS)o.y=rampY(o.s);
function roomAt(x,z,m){for(const o of ROOMS)if(Math.hypot(x-o.x,z-o.z)<o.r+(m||0))return o;return null;}
/* the ledge: from the transfer pad (u 0) north along the crest to the yard's mouth (u AP_LEN); s = u - AP_LEN */
const AP=[[0,LZ_Z],[-14,190],[-26,138],[-12,84],[6,36],[0,0]];
const APS=[],AP_LEN=(()=>{let u=0;for(let i=0;i<AP.length-1;i++){const [ax,az]=AP[i],[bx,bz]=AP[i+1],l=Math.hypot(bx-ax,bz-az);APS.push({ax,az,bx,bz,l,u0:u,nx:-(bz-az)/l,nz:(bx-ax)/l});u+=l;}return u;})();
function apSeg(x,z){let best=1e9,bu=0,bt=0,br=APS[0];for(const r of APS){const dx=r.bx-r.ax,dz=r.bz-r.az,t=clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.l*r.l),0,1),d=Math.hypot(x-r.ax-dx*t,z-r.az-dz*t);if(d<best){best=d;bu=r.u0+t*r.l;bt=t;br=r;}}return{u:bu,r:br,t:bt,d:best};}
function apS(x,z){return apSeg(x,z).u-AP_LEN;}
const _ap=new THREE.Vector3();
function apPt(s,out){const u=clamp(AP_LEN+s,0,AP_LEN);out=out||_ap;for(const r of APS)if(u<=r.u0+r.l){const t=(u-r.u0)/r.l;return out.set(r.ax+(r.bx-r.ax)*t,0,r.az+(r.bz-r.az)*t);}const e=AP[AP.length-1];return out.set(e[0],0,e[1]);}
function apN(s){const u=AP_LEN+s;let nx=0,nz=0;for(const r of APS){const k=clamp(1-Math.max(0,Math.max(r.u0-u,u-(r.u0+r.l)))/14,0,1);nx+=r.nx*k;nz+=r.nz*k;}const l=Math.hypot(nx,nz)||1;return{x:nx/l,z:nz/l};}
function apAt(s,lat,out){const p=apPt(s,out||new THREE.Vector3()).clone(),n=apN(s);p.x+=n.x*(lat||0);p.z+=n.z*(lat||0);p.y=groundY(p.x,p.z);return p;}
const SET0=-1e6,SET1=-1e6,RELAY=-1e6,NEST1=-1e6,NEST2=-1e6;
function apHalf(s){let h=8.5+1.2*Math.sin(s*.05);if(s>-26)h=lerp(h,13,sstep(-26,-4,s));return h;}
function apD(x,z){const q=apSeg(x,z),s=q.u-AP_LEN,r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t,lat=(x-px)*r.nx+(z-pz)*r.nz,along=Math.abs((x-px)*r.nz-(z-pz)*r.nx);
  const dl=Math.abs(lat)-apHalf(s);return Math.hypot(Math.max(0,dl),along)+Math.min(0,dl);}
function roadS(x,z){if(z>ROAD[0][1])return Math.min(0,apS(x,z));const q=roadSeg(x,z);let bs=q.s;if(Math.hypot(x-PLAT.x,z-PLAT.z)<PLAT.r+4)bs=Math.max(bs,ROAD_LEN+(ROAD[ROAD.length-1][1]-z));return bs;}
const _rp=new THREE.Vector3();
function roadPt(s,out){s=clamp(s,0,ROAD_LEN);out=out||_rp;for(const r of ROADS)if(s<=r.s0+r.l){const t=(s-r.s0)/r.l;return out.set(r.ax+(r.bx-r.ax)*t,0,r.az+(r.bz-r.az)*t);}const e=ROAD[ROAD.length-1];return out.set(e[0],0,e[1]);}
function roadN(s){let nx=0,nz=0;for(const r of ROADS){const k=clamp(1-Math.max(0,Math.max(r.s0-s,s-(r.s0+r.l)))/6,0,1);nx+=r.nx*k;nz+=r.nz*k;}const l=Math.hypot(nx,nz)||1;return{x:nx/l,z:nz/l};}
function latOf(x,z){const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t;return(x-px)*r.nx+(z-pz)*r.nz;}
const SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0;
function laneC(s){return 0;}
function spineAt(s){return false;}
function zoneOf(s){return s<0?'lz':s<S_HOST?'yard':s<S_HALL0?'host':s<S_HALL1?'hall':s<S_DOOR?'old':s<S_RAMP?'chamber':s<S_TOP?'ramp':s<S_HANGAR?'top':'hangar';}
function laneHalf(s){
  if(s<S_HOST)return lerp(20,7.5,sstep(100,116,s));
  if(s<S_HALL0-10)return 7+4*sstep(S_BAY0-6,S_BAY0,s)*(1-sstep(S_BAY1,S_BAY1+6,s));
  if(s<S_HALL0)return lerp(7,13,sstep(S_HALL0-10,S_HALL0,s));
  if(s<S_HALL1)return 13;
  if(s<S_DOOR)return lerp(6.5,5,sstep(S_DOOR-12,S_DOOR-3,s));
  return 5;}
// doors that close the way: dir +1 stops you going further than s, -1 stops you going back past it
const BARRIERS=[{id:'gate',s:S_GATE,dir:1,open:false},{id:'door',s:S_DOOR+1,dir:1,open:false},{id:'exit',s:S_RAMP-1,dir:1,open:false},{id:'shutter',s:S_SHUT,dir:-1,open:true}];
function barrier(id){return BARRIERS.find(b=>b.id===id);}
// (Site K's power room is gone: the vault's own emitters feed its field. Kept far off the map for the code that still asks)
const VAULT={x0:-9e3,x1:-9e3-40,z:-9e3,hw:3.4,cx:-9e3-51,cz:-9e3,r:12,open:false};
function vaultD(x,z){return Math.hypot(x-VAULT.cx,z-VAULT.cz)-VAULT.r;}
function inVault(x,z){return false;}
function inVaultRoom(x,z){return false;}
function inPlat(x,z,m){return Math.hypot(x-PLAT.x,z-PLAT.z)<PLAT.r+(m||0);}
/* the detention wing's cells: a row under each gallery, one every 9 m; CELL_OPEN marks the three with prisoners in them */
const CELLS=[];
for(let s=S_HALL0+12;s<S_HALL1-8;s+=9)for(const side of[-1,1])CELLS.push({s,side,w:3.6,d:3.4,open:false,live:false});
const CELL_OPEN=[[S_HALL0+12+9*8,-1,'rhen'],[S_HALL0+12+9*9,1,'a'],[S_HALL0+12+9*10,-1,'b']];
for(const [s,side,who] of CELL_OPEN){const c=CELLS.find(c=>Math.abs(c.s-s)<.1&&c.side===side);c.live=true;c.who=who;}
function cellFrame(c){const p=roadPt(c.s).clone(),n=roadN(c.s),h=laneHalf(c.s)+.6,tx=n.z,tz=-n.x;return{p,n,h,tx,tz,fx:p.x+n.x*c.side*h,fz:p.z+n.z*c.side*h,ox:n.x*c.side,oz:n.z*c.side};}
function cellD(c,x,z){const F=cellFrame(c),dx=x-F.fx,dz=z-F.fz,a=dx*F.tx+dz*F.tz,b=dx*F.ox+dz*F.oz;
  const qa=Math.abs(a)-c.w/2,qb=Math.abs(b-c.d/2+.6)-(c.d/2+.6);return Math.hypot(Math.max(qa,0),Math.max(qb,0))+Math.min(Math.max(qa,qb),0);}
function cellAt(s,side){return CELLS.find(c=>c.side===side&&Math.abs(s-c.s)<c.w/2+.2);}
/* the overlook: the overlook corridor's west wall is glass, over the transport staging hall 24 m below (set dressing; STAGE is its box) */
const OVER={s0:S_BAY0+4,s1:S_BAY1-4,side:-1};
const STAGE=(()=>{const sm=(OVER.s0+OVER.s1)/2,p=roadPt(sm).clone(),n0=roadN(sm),n={x:n0.x*OVER.side,z:n0.z*OVER.side},h=laneHalf(sm)+.6,dep=46,len=72,fy=-24;
  return{cx:p.x+n.x*(h+1.4+dep/2),cz:p.z+n.z*(h+1.4+dep/2),nx:n.x,nz:n.z,tx:n.z,tz:-n.x,hd:dep/2,hl:len/2,fy,h:34,wall:h};})();
function inStage(x,z,m){const dx=x-STAGE.cx,dz=z-STAGE.cz;return Math.abs(dx*STAGE.tx+dz*STAGE.tz)<STAGE.hl+(m||0)&&Math.abs(dx*STAGE.nx+dz*STAGE.nz)<STAGE.hd+(m||0);}
// distance outside the walkable area (negative inside)
function playD(x,z){
  let d=Math.min(Math.hypot(x-LZ.x,z-LZ.z)-LZ.r,z>-8?apD(x,z):1e9);
  const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t,lat=(x-px)*r.nx+(z-pz)*r.nz,along=Math.abs((x-px)*r.nz-(z-pz)*r.nx);
  const dl=Math.abs(lat)-laneHalf(q.s);d=Math.min(d,Math.hypot(Math.max(0,dl),along)+Math.min(0,dl));
  for(const o of ROOMS)d=Math.min(d,Math.hypot(x-o.x,z-o.z)-o.r);
  d=Math.min(d,Math.hypot(x-PLAT.x,z-PLAT.z)-PLAT.r);
  if(q.s>S_HALL0&&q.s<S_HALL1)for(const c of CELLS)if(c.open&&Math.abs(q.s-c.s)<8)d=Math.min(d,cellD(c,x,z));
  for(const b of BARRIERS)if(!b.open){const s=roadS(x,z);d=Math.max(d,b.dir>0?s-b.s:b.s-s);}
  for(const B of BLOCKS)d=Math.max(d,B.r-Math.hypot(x-B.x,z-B.z));
  return d;}
const BLOCKS=[];
function floorAt(x,z){if(inPlat(x,z,1))return PLAT_Y;const o=roomAt(x,z,.5);if(o)return o.y;return rampY(roadS(x,z));}
/* ---------- the land: the summit, and Elyra's mountains far below it. The valley the interceptor flies (VAL) winds through the lower
   peaks to the summit's foot; the summit itself drops away on every side of the facility ---------- */
const VAL=[[-220,3720],[-430,3260],[-200,2760],[250,2380],[400,1960],[190,1520],[-170,1200],[-290,860],[-90,560],[140,430],[90,250],[74,110]];
const BASINS=[{x:330,z:2180,r:330},{x:-240,z:1030,r:300}];
function polyD(L,x,z){let best=1e9,bu=0,u=0;for(let i=0;i<L.length-1;i++){const [ax,az]=L[i],[bx,bz]=L[i+1],dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),t=clamp(((x-ax)*dx+(z-az)*dz)/(l*l),0,1),d=Math.hypot(x-ax-dx*t,z-az-dz*t);if(d<best){best=d;bu=u+t*l;}u+=l;}return{d:best,u:bu};}
const VAL_LEN=(()=>{let u=0;for(let i=0;i<VAL.length-1;i++)u+=Math.hypot(VAL[i+1][0]-VAL[i][0],VAL[i+1][1]-VAL[i][1]);return u;})();
function valPt(u,out){out=out||new THREE.Vector3();let a=0;for(let i=0;i<VAL.length-1;i++){const [ax,az]=VAL[i],[bx,bz]=VAL[i+1],l=Math.hypot(bx-ax,bz-az);if(u<=a+l||i===VAL.length-2){const t=clamp((u-a)/l,0,1);return out.set(ax+(bx-ax)*t,0,az+(bz-az)*t);}a+=l;}return out;}
function valHalf(x,z){let w=150;for(const B of BASINS){const d=Math.hypot(x-B.x,z-B.z);w=Math.max(w,150+(B.r-60)*Math.exp(-(d/B.r)*(d/B.r)*1.4));}return w;}
const RIVER_Y=-446,VFLOOR=-450;
function mtnY(x,z){return -340+300*ridged(x*.0014+3.1,z*.0014-1.7)+70*fbm(x*.004,z*.004)+30*vnoise(x*.02,z*.02);}
// how far a point is from the summit's top (the facility, the ledge, the pads, the staging hall): negative on top
function summitD(x,z){let d=polyD(ROAD,x,z).d-42;d=Math.min(d,polyD(AP,x,z).d-30,Math.hypot(x-LZ.x,z-LZ.z)-LZ.r-26,Math.hypot(x-PLAT.x,z-PLAT.z)-PLAT.r-12);
  if(inStage(x,z,30))d=Math.min(d,-1);for(const o of ROOMS)d=Math.min(d,Math.hypot(x-o.x,z-o.z)-o.r-32);return d;}
function farY(x,z){const m=mtnY(x,z),v=polyD(VAL,x,z),w=valHalf(x,z);const vf=VFLOOR+5*vnoise(x*.01,z*.01)+16*Math.pow(clamp(v.d/w,0,1),2);return lerp(vf,m,sstep(w,w+300,v.d));}
function landY(x,z){const sd=summitD(x,z);if(sd<=0)return -1+2.5*vnoise(x*.03,z*.03);
  const far=Math.min(farY(x,z),-140),k=Math.pow(sstep(0,300,sd),.7);   // a crown of rock, then the cliffs down to the lower mountains
  return lerp(-1+2.5*vnoise(x*.03,z*.03),far,k)+18*(ridged(x*.01,z*.01)-.4)*Math.sin(k*Math.PI);}
function shelfY(x,z,d){return lerp(.3*vnoise(x*.08,z*.08)+Math.min(d*.85,2.6),landY(x,z),sstep(5,48,d));}
function moonY(x,z){return landY(x,z);}
function moonGround(x,z,d){return shelfY(x,z,d);}
function inLZ(x,z){return Math.hypot(x-LZ.x,z-LZ.z)<LZ.r+30;}
function footD(x,z){const s=roadS(x,z);if(s<-3)return 1e3;const q=roadSeg(x,z);
  let d=q.d-(laneHalf(clamp(s,0,ROAD_LEN))+46);for(const o of ROOMS)d=Math.min(d,Math.hypot(x-o.x,z-o.z)-o.r-40);return Math.min(d,Math.hypot(x-PLAT.x,z-PLAT.z)-(PLAT.r+6));}
const WALLH={lz:0,yard:12,host:8,hall:14,old:10,chamber:13,ramp:6,top:1.1,hangar:0,vault:9};
function inGallery(x,z,s){if(s<S_HALL0+6||s>S_HALL1-4)return false;const l=Math.abs(latOf(x,z)),h=laneHalf(s);return l>h&&l<h+3.4;}
function groundY(x,z){
  const d=playD(x,z);
  if(d<=0){const f=floorAt(x,z);return zoneOf(roadS(x,z))==='lz'&&!inLZ(x,z)?f+.3*vnoise(x*.08,z*.08):f;}
  if(inPlat(x,z,6))return Math.min(landY(x,z),PLAT_Y-10);   // off the edge of the top pad: the drop
  const s=roadS(x,z),zn=zoneOf(s);
  if(zn==='lz'){if(footD(x,z)<0)return 30;return shelfY(x,z,d);}
  if(zn==='hall'&&inGallery(x,z,s))return 5;
  return floorAt(x,z)+(zn==='yard'?WALLH.yard:40);}
let hangarOpen=true;   // the extraction pad is open to the sky
function shotGroundY(x,z){if(inPlat(x,z,1))return PLAT_Y;if(Math.hypot(x-PLAT.x,z-PLAT.z)<PLAT.r+120&&playD(x,z)>0)return Math.min(groundY(x,z),PLAT_Y-2);return groundY(x,z);}
function ceilAt(x,z){if(inPlat(x,z,2))return 1e4;const o=roomAt(x,z,.3);if(o)return o.open?1e4:o.y+o.h;const s=roadS(x,z),zn=zoneOf(s);
  if(zn==='hall'&&CELLS.some(c=>c.open&&cellD(c,x,z)<.5))return 4.5;
  if(zn==='lz'||zn==='yard'||zn==='top')return 1e4;return floorAt(x,z)+(WALLH[zn]||9);}
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
const oldMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.42,metalness:.62});   // the containment wing: Host work too, darker and smoother (Site K's old stone, re-dressed)
const groundMat=triMat(TX.sand,.08,2.4,{roughness:.95},.75);           // moon dust (the sand photo, greyed)
const astraeaGroundMat=triMat(TX.sand,.08,2.4,{roughness:.95});     // Astraea's ground keeps its colour
const rockMat2=triMat(TX.rock,.05,2.2,{roughness:.92},.8);
const purpleGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:C(FLEET_PURPLE).multiplyScalar(1.1),toneMapped:false});
// Host windows: real panes of smoked violet glass, dim, set into the walls and the facility's mass (they used to be thin neon lines)
const winMat=new THREE.MeshBasicMaterial({vertexColors:true,color:C(0x6a4a9a).multiplyScalar(.75),toneMapped:false});
const stripMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1,1,1).multiplyScalar(1.4),toneMapped:false});   // the interior strip lights (they go red with the alarm)
const goldGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:C(0xc8a8ff).multiplyScalar(1.15),toneMapped:false,transparent:true,opacity:.85});   // (the containment wing's fine lines: a cold violet)
const glassMat=new THREE.MeshStandardMaterial({color:C(0x8a9ad0),roughness:.05,metalness:.3,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
const HOST_GLOW=FLEET_PURPLE;
// colours
const K_DARK=C(0x221d2a),K_DARK2=C(0x302838),K_SIL=C(0x9a9ca8),K_PALE=C(0x2c2636),K_PALE2=C(0x3a3346),W1=C(0xffffff),K_STRIP=C(0xcfe6ff),K_GOLD=C(0xffd27a);

/* ---------- the land: one mesh, fine around the pad and the ledge, coarse across the valley and the mountains; under the facility it
   drops away (its walls and mass stand there), and under the staging hall it goes deep (the hall's own floor is 24 m down) ---------- */
{const steps=(a,b,fine,lo,hi,cs)=>{const o=[];let v=a;while(v<b){o.push(v);v+=(v>=lo&&v<hi)?fine:cs;}o.push(b);return o;};
 const xs=steps(-1300,1500,coarse?4:3,-170,130,coarse?30:24),zs=steps(-1300,3950,coarse?4:3,-680,LZ_Z+90,coarse?30:24);
 const NX=xs.length,NZ=zs.length,pos=new Float32Array(NX*NZ*3),col=new Float32Array(NX*NZ*3),tmp=new THREE.Color();
 const cLow=C(0x26332f),cLow2=C(0x2f3a34),cMid=C(0x4a4856),cMid2=C(0x3c3a46),cHi=C(0x8e909c);
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=xs[i],z=zs[j],k=(j*NX+i)*3;let y;
   const fd=footD(x,z);if(inStage(x,z,10))y=-60;else if(fd<-1)y=-4;else{const d=playD(x,z);y=d<=0?groundY(x,z):shelfY(x,z,d);if(fd<8)y=Math.min(y,lerp(-4,y,sstep(-1,8,fd)));}
   pos[k]=x;pos[k+1]=y;pos[k+2]=z;const n=vnoise(x*.05,z*.05);
   if(y<-380)tmp.copy(cLow).lerp(cLow2,n);else tmp.copy(cMid2).lerp(cMid,n);
   if(y>-120)tmp.lerp(cHi,sstep(-120,40,y)*(.35+.3*vnoise(x*.03,z*.03)));
   tmp.multiplyScalar(.85+.3*vnoise(x*.3,z*.3));col[k]=tmp.r;col[k+1]=tmp.g;col[k+2]=tmp.b;}
 const idx=new Uint32Array((NX-1)*(NZ-1)*6);let q=0;
 for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const p=j*NX+i,r=p+1,c=p+NX,d=c+1;idx[q++]=p;idx[q++]=c;idx[q++]=r;idx[q++]=r;idx[q++]=c;idx[q++]=d;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
 const m=new THREE.Mesh(g,groundTerrainMat({desat:.45,boost:2.3,bump:.8}));m.receiveShadow=true;m.userData.dyn=true;scene.add(m);}   // (dyn: js/shared/solid.js leaves the land out; groundY already stands for it in every shot test)
/* the river along the valley floor, far below the summit: dark water with the moon on it */
const waterMat=new THREE.MeshStandardMaterial({color:C(0x0c1c2a),roughness:.12,metalness:.6,transparent:true,opacity:.92,side:THREE.DoubleSide});
{const N=Math.ceil(VAL_LEN/12),pos=[],idx=[];for(let i=0;i<=N;i++){const u=i/N*VAL_LEN,p=valPt(u),q=valPt(Math.min(VAL_LEN,u+6)),dx=q.x-p.x,dz=q.z-p.z,l=Math.hypot(dx,dz)||1,w=valHalf(p.x,p.z)*.42;
   pos.push(p.x-dz/l*w,RIVER_Y,p.z+dx/l*w,p.x+dz/l*w,RIVER_Y,p.z-dx/l*w);if(i<N){const b=i*2;idx.push(b,b+2,b+1,b+1,b+2,b+3);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
 const w=new THREE.Mesh(g,waterMat);w.receiveShadow=true;w.userData.dyn=true;scene.add(w);}

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
// boulders along the ledge, under the cliff (its west side)
for(const [sv,lat,r] of[[-210,-9,1.6],[-180,-10,1.2],[-150,-9.5,2],[-120,-10,1.4],[-96,-9,1],[-70,-10.5,1.8],[-44,-9.5,1.3]]){const p=apPt(sv).clone(),n=apN(sv);addRock(p.x+n.x*lat,p.z+n.z*lat,r);}

/* ---------- walls, floors and roofs, built along the boundary of the walkable area ---------- */
const OPEN_ALL=()=>{const k=BARRIERS.map(b=>b.open);BARRIERS.forEach(b=>b.open=true);return()=>BARRIERS.forEach((b,i)=>b.open=k[i]);};
const hm=new Merger(),hg=new Merger(),hs=new Merger(),om=new Merger(),og=new Merger(),wn=new Merger(),glm=new Merger();   // host hull, host glow, strip lights, old stone, old glow
const SHADOWLESS=new Merger();   // floors and ceilings (they don't need to cast)
const restore=OPEN_ALL();VAULT.open=true;
// one piece of wall: centre (x,z), running along unit (tx,tz), facing inward along (nx,nz)
const TANKS=[];
function wallPiece(zn,x,z,tx,tz,nx,nz,len,y0,s,hOverride){
  const ry=Math.atan2(-tz,tx),H=hOverride||WALLH[zn==='hallTop'?'hall':zn]||10;
  if(zn==='yard'){hm.add(boxUV(len,H,1.4,3),M(x,y0+H/2,z,0,ry,0),K_DARK);hg.add(new THREE.BoxGeometry(len,.12,.04),M(x+nx*.72,y0+2.1,z+nz*.72,0,ry,0),W1);
    hm.add(boxUV(len,.5,2.2,3),M(x+nx*.2,y0+H+.25,z+nz*.2,0,ry,0),K_SIL);
    if(((s/3)|0)%4===0){hm.add(boxUV(1.8,H+1.4,1.6,3),M(x+nx*.9,y0+(H+1.4)/2,z+nz*.9,0,ry,0),K_DARK2);hm.add(new THREE.ConeGeometry(.5,3,4),M(x+nx*1.2,y0+H+2.6,z+nz*1.2,-nz*.4,0,nx*.4),K_SIL);
      hm.add(boxUV(1.5,2.8,.3,3),M(x+nx*.78,y0+H-4.4,z+nz*.78,0,ry,0),K_SIL);wn.add(new THREE.BoxGeometry(1.1,2.3,.06),M(x+nx*.95,y0+H-4.4,z+nz*.95,0,ry,0),W1);}}
  else if(zn==='host'||zn==='ramp'||zn==='vault'){hm.add(boxUV(len,H,1,3),M(x,y0+H/2,z,0,ry,0),K_DARK);
    hs.add(new THREE.BoxGeometry(len,.08,.04),M(x+nx*.52,y0+2.6,z+nz*.52,0,ry,0),K_STRIP);hg.add(new THREE.BoxGeometry(len,.06,.04),M(x+nx*.52,y0+.25,z+nz*.52,0,ry,0),W1);
    if(((s/3)|0)%2===0){hm.add(boxUV(.7,H,.9,3),M(x+nx*.7,y0+H/2,z+nz*.7,0,ry,0),K_DARK2);hm.add(boxUV(.72,.4,.95,3),M(x+nx*.7,y0+1.3,z+nz*.7,0,ry,0),K_SIL);}}
  else if(zn==='hall'||zn==='hallTop'){   // the gallery: a 5 m face, a parapet, a walkway, then the back wall up to the roof (hallTop: over a cell's doorway, no face)
    if(zn==='hall')hm.add(boxUV(len,5,1,3),M(x,y0+2.5,z,0,ry,0),K_DARK);else hm.add(boxUV(len,.4,1,3),M(x,y0+4.8,z,0,ry,0),K_DARK);hm.add(boxUV(len,1.1,.5,3),M(x,y0+5.55,z,0,ry,0),K_DARK2);hm.add(boxUV(len,.12,.6,3),M(x,y0+6.15,z,0,ry,0),K_SIL);
    hm.add(boxUV(len,.3,3.6,3),M(x-nx*1.8,y0+4.85,z-nz*1.8,0,ry,0),K_DARK2);
    hm.add(boxUV(len,H-5,1,3),M(x-nx*3.6,y0+5+(H-5)/2,z-nz*3.6,0,ry,0),K_DARK);hs.add(new THREE.BoxGeometry(len,.08,.04),M(x-nx*3.08,y0+8,z-nz*3.08,0,ry,0),K_STRIP);
    hg.add(new THREE.BoxGeometry(len,.06,.04),M(x+nx*.52,y0+4.6,z+nz*.52,0,ry,0),W1);}
  else if(zn==='old'){   // the containment wing: black walls, a violet seam at shoulder height, and specimen tanks set against them
    hm.add(boxUV(len,H,1,3),M(x,y0+H/2,z,0,ry,0),K_DARK);og.add(new THREE.BoxGeometry(len,.05,.04),M(x+nx*.52,y0+1.7,z+nz*.52,0,ry,0),K_GOLD);
    hm.add(boxUV(len,.5,1.6,3),M(x+nx*.3,y0+H-.25,z+nz*.3,0,ry,0),K_DARK2);
    if(((s/1.5)|0)%5===0){const tx2=x+nx*1.15,tz2=z+nz*1.15;hm.add(new THREE.CylinderGeometry(1,1.1,.5,12),M(tx2,y0+.25,tz2),K_DARK2);hm.add(new THREE.CylinderGeometry(1,1,.4,12),M(tx2,y0+3.9,tz2),K_DARK2);
      glm.add(new THREE.CylinderGeometry(.92,.92,3.2,16,1,true),M(tx2,y0+2.1,tz2),W1);og.add(new THREE.CylinderGeometry(.12,.12,3,6),M(tx2,y0+2.1,tz2),K_GOLD);TANKS.push({x:tx2,z:tz2});}}
  else if(zn==='top'){   // the open walkway up the last of the climb: a parapet, a rail of light, the drop beyond
    hm.add(boxUV(len,1.1,.7,3),M(x,y0+.55,z,0,ry,0),K_DARK);hm.add(boxUV(len,.12,.9,3),M(x,y0+1.16,z,0,ry,0),K_SIL);hs.add(new THREE.BoxGeometry(len,.05,.04),M(x+nx*.38,y0+.9,z+nz*.38,0,ry,0),K_STRIP);}
  else if(zn==='chamber'){   // the vault: tall black walls, ribs, and slits of cold violet light from floor to ceiling
    hm.add(boxUV(len,H,1.4,3),M(x,y0+H/2,z,0,ry,0),K_DARK);
    if(((s/1.6)|0)%3===0){hm.add(boxUV(.9,H,1.2,3),M(x+nx*.8,y0+H/2,z+nz*.8,0,ry,0),K_DARK2);og.add(new THREE.BoxGeometry(.08,H-2,.05),M(x+nx*1.42,y0+H/2,z+nz*1.42,0,ry,0),K_GOLD);}
    hs.add(new THREE.BoxGeometry(len,.06,.04),M(x+nx*.72,y0+.3,z+nz*.72,0,ry,0),K_STRIP);}
  else if(zn==='hangar'){hm.add(boxUV(len,H,1.4,3),M(x,y0+H/2,z,0,ry,0),K_DARK);hs.add(new THREE.BoxGeometry(len,.1,.04),M(x+nx*.72,y0+3,z+nz*.72,0,ry,0),K_STRIP);
    hg.add(new THREE.BoxGeometry(len,.08,.04),M(x+nx*.72,y0+9,z+nz*.72,0,ry,0),W1);}
}
// along the way in (both sides)
for(let s=0;s<=ROAD_LEN+4;s+=1.5){const zn=zoneOf(s);if(zn==='lz')continue;
  const p=roadPt(Math.min(s,ROAD_LEN)).clone(),n=roadN(Math.min(s,ROAD_LEN)),h=laneHalf(s),tx=n.z,tz=-n.x;
  for(const side of[-1,1]){const ox=p.x+n.x*side*(h+.6),oz=p.z+n.z*side*(h+.6);
    if(playD(ox+n.x*side*.6,oz+n.z*side*.6)<.2||playD(ox-n.x*side*1.4,oz-n.z*side*1.4)>-.2)continue;
    if(zn==='yard'&&s<4)continue;
    if(zn==='host'&&side===OVER.side&&s>OVER.s0&&s<OVER.s1){glassPiece(ox,oz,tx,tz,-n.x*side,-n.z*side,2.2,s);continue;}   // the overlook
    if(zn==='hall'){const c=cellAt(s,side);if(c&&c.live){wallPiece('hallTop',ox,oz,tx,tz,-n.x*side,-n.z*side,2.2,0,s);continue;}}   // an open cell's doorway: the gallery over it, no face
    if(zn==='hangar'||inPlat(ox,oz,2))continue;
    wallPiece(zn,ox,oz,tx,tz,-n.x*side,-n.z*side,2.2,floorAt(p.x,p.z),s);}}
/* ---------- the overlook's glass, the staging hall below it, and the detention wing's cells (Oct 26) ---------- */
function glassPiece(x,z,tx,tz,nx,nz,len,s){const ry=Math.atan2(-tz,tx),H=WALLH.host;
  hm.add(boxUV(len,1.1,1,3),M(x,.55,z,0,ry,0),K_DARK);hm.add(boxUV(len,.9,1,3),M(x,H-.45,z,0,ry,0),K_DARK);   // the sill and the header
  hs.add(new THREE.BoxGeometry(len,.06,.04),M(x+nx*.52,1.12,z+nz*.52,0,ry,0),K_STRIP);
  glm.add(new THREE.BoxGeometry(len,H-2,.06),M(x,1.1+(H-2)/2,z,0,ry,0),W1);
  if(((s/3)|0)%2===0)hm.add(boxUV(.3,H,1.1,3),M(x,H/2,z,0,ry,0),K_DARK2);}   // mullions
function buildCells(){
  for(const c of CELLS){const F=cellFrame(c),ry=Math.atan2(-F.tz,F.tx),at=(a,b,y)=>M(F.fx+F.tx*a+F.ox*b,y,F.fz+F.tz*a+F.oz*b,0,ry,0);
    // the frame: jambs, a header, a purple seam, the lock light over it
    for(const sd of[-1,1])hm.add(boxUV(.36,4.5,1.25,2),at(sd*(c.w/2+.18),-.05,2.25),K_DARK2);hm.add(boxUV(c.w+.7,.4,1.25,2),at(0,-.05,4.55),K_DARK2);
    hg.add(new THREE.BoxGeometry(c.w+.5,.05,.04),at(0,-.7,4.32),W1);
    const lock=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(c.live?0xff3a2a:0x8a2a3a).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:c.live?.9:.5}));
    lock.scale.setScalar(.7);lock.position.set(F.fx+F.ox*-.72,4.05,F.fz+F.oz*-.72);scene.add(lock);c.lock=lock;
    // the door: a slab with a slit window (a faint light behind it). The live cells' slabs slide aside into the wall when they open
    const slab=new THREE.Group();slab.position.set(F.fx-F.ox*.15,0,F.fz-F.oz*.15);slab.rotation.y=ry;scene.add(slab);
    const sm=new Merger(),sg=new Merger();sm.add(boxUV(c.w,4.15,.3,2),M(0,2.08,0),K_DARK);for(const y of[1.1,3.2])sm.add(boxUV(c.w*.92,.16,.36,2),M(0,y,0),K_DARK2);
    sg.add(new THREE.BoxGeometry(.9,.12,.34),M(0,2.7,0),W1);
    const sl=new THREE.Mesh(sm.build(),hostMat);sl.castShadow=true;slab.add(sl,new THREE.Mesh(sg.build(),winMat));c.slab=slab;c.F=F;c.openK=0;
    if(!c.live)continue;
    // inside: floor, back wall, side walls (the gallery's walkway is the ceiling), a bench, a light strip, restraints on the wall
    hm.add(boxUV(c.w+.4,.3,c.d+.2,2),at(0,c.d/2,-.15),C(0x2a2630));hm.add(boxUV(c.w+.8,4.8,.5,2),at(0,c.d+.35,2.4),K_DARK);
    for(const sd of[-1,1])hm.add(boxUV(.5,4.8,c.d+.6,2),at(sd*(c.w/2+.25),c.d/2,2.4),K_DARK);
    hm.add(boxUV(c.w*.8,.5,.7,2),at(0,c.d-.1,.45),K_DARK2);hs.add(new THREE.BoxGeometry(c.w*.7,.05,.04),at(0,c.d+.08,4.1),K_STRIP);
    for(const sd of[-1,1])hm.add(boxUV(.25,.25,.3,1),at(sd*.6,c.d+.05,1.9),K_SIL);}}
const STAGE_SET=(()=>{const S=STAGE,ry=Math.atan2(-S.tz,S.tx),at=(a,b,y)=>M(S.cx+S.tx*a+S.nx*b,y,S.cz+S.tz*a+S.nz*b,0,ry,0);
  const m=new Merger(),g=new Merger(),rk=new Merger();
  m.add(boxUV(S.hl*2+2,1,S.hd*2+2,6),at(0,0,S.fy-.5),C(0x26222c));
  // the cavern's rock walls and roof, and a Host gantry along the far side
  rk.add(boxUV(S.hl*2+4,S.h,2,8),at(0,S.hd+1,S.fy+S.h/2),C(0x3a3842));for(const sd of[-1,1])rk.add(boxUV(2,S.h,S.hd*2+4,8),at(sd*(S.hl+1),0,S.fy+S.h/2),C(0x3a3842));
  rk.add(boxUV(S.hl*2+4,2,S.hd*2+4,8),at(0,0,S.fy+S.h+1),C(0x302e38));
  m.add(boxUV(S.hl*2+2,-S.fy-1.4,1.6,4),at(0,-S.hd-.4,S.fy/2-.7),K_DARK);   // the wall under the glass
  for(let a=-S.hl+6;a<S.hl;a+=12){m.add(boxUV(.8,S.h,.8,2),at(a,S.hd-1,S.fy+S.h/2),K_DARK2);g.add(new THREE.BoxGeometry(.12,S.h*.7,.12),at(a+.5,S.hd-1.5,S.fy+S.h*.4),W1);}
  m.add(boxUV(S.hl*2,1,4,3),at(0,S.hd-3,S.fy+9),K_DARK2);hs.add(new THREE.BoxGeometry(S.hl*2-2,.08,.1),at(0,S.hd-5,S.fy+8.4),K_STRIP);
  // floor markings: the walk from the cell-block door (near left) to the transport's ramp
  for(let a=-S.hl+4;a<S.hl-14;a+=3)g.add(new THREE.BoxGeometry(1.6,.02,.12),at(a,-6,S.fy+.02),W1);
  for(let k=0;k<8;k++){const a=R(-S.hl+6,S.hl-6),b=R(-S.hd+8,-S.hd+16);m.add(new THREE.CylinderGeometry(.9,1,1.8,6),at(a,b,S.fy+.9),k%2?K_DARK:K_DARK2);}
  // the door the prisoners come out of, and lamps on the cavern's walls
  m.add(boxUV(4,5,1,2),at(-S.hl+.4,-6,S.fy+2.5),K_DARK2);g.add(new THREE.BoxGeometry(3,.1,.1),at(-S.hl+1,-6,S.fy+5),W1);
  const o=new THREE.Mesh(m.build(),hostMat);o.receiveShadow=true;scene.add(o,new THREE.Mesh(g.build(),purpleGlow));
  const r=new THREE.Mesh(rk.build(),rockMat2);r.receiveShadow=true;scene.add(r);
  const L1=new THREE.PointLight(C(HOST_GLOW),2.4,90,1.4);L1.position.set(S.cx,S.fy+20,S.cz);scene.add(L1);
  const L2=new THREE.PointLight(C(0xcfe0ff),1.4,70,1.5);L2.position.set(S.cx+S.tx*20+S.nx*6,S.fy+14,S.cz+S.tz*20+S.nz*6);scene.add(L2);
  // the transport: a Host hull along the far side, nose toward the cavern's mouth, its ramp down to the floor
  const ship=new THREE.Group(),K=SHIPKIT.voidclass();ship.add(new THREE.Mesh(K.geo,fleetHullMat(panelTex)),new THREE.Mesh(K.glowGeo,fleetGlowMat(HOST_GLOW,2)));
  K.geo.computeBoundingBox();const L=K.geo.boundingBox.max.z-K.geo.boundingBox.min.z,sc=44/L;ship.scale.setScalar(sc);
  const sp=new THREE.Vector3(S.cx+S.tx*6+S.nx*(S.hd-14),S.fy+8,S.cz+S.tz*6+S.nz*(S.hd-14));ship.position.copy(sp);ship.rotation.y=Math.atan2(S.tx,S.tz)+Math.PI;scene.add(ship);
  MODELS.swapShip(ship,'voidclass',{ref:K.geo});
  const ramp=new THREE.Mesh(boxUV(5,.3,9,2),hostMat);ramp.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(ramp.geometry.attributes.position.count*3).fill(.22),3));
  const rp=new THREE.Vector3(S.cx+S.tx*14+S.nx*(S.hd-24),S.fy+2.2,S.cz+S.tz*14+S.nz*(S.hd-24));ramp.position.copy(rp);ramp.rotation.set(-.42,ry+Math.PI/2,0);scene.add(ramp);
  const door=new THREE.Vector3(S.cx-S.tx*(S.hl-2)-S.nx*6,S.fy,S.cz-S.tz*(S.hl-2)-S.nz*6),foot=new THREE.Vector3(rp.x-S.nx*5,S.fy,rp.z-S.nz*5);
  return{ship,ramp,door,foot,top:new THREE.Vector3(rp.x+S.nx*3,S.fy+4,rp.z+S.nz*3)};})();
buildCells();
for(const t of TANKS)OBST.push({x:t.x,z:t.z,r:1.15,h:4});

/* the rooms where the way turns: a ring (or, for the vault, an octagon) of wall with gaps where the way comes in and goes out, a floor,
   a roof, a ring of strip light */
for(const o of ROOMS){const zn=o.id==='vault'?'chamber':zoneOf(o.s)==='hall'?'host':zoneOf(o.s),R0=o.r+.6;
  const pts=[];if(o.sides){const Rv=R0/Math.cos(Math.PI/o.sides);for(let k=0;k<o.sides;k++){const a0=(k+.5)/o.sides*Math.PI*2,a1=(k+1.5)/o.sides*Math.PI*2,x0=o.x+Math.cos(a0)*Rv,z0=o.z+Math.sin(a0)*Rv,x1=o.x+Math.cos(a1)*Rv,z1=o.z+Math.sin(a1)*Rv,L=Math.hypot(x1-x0,z1-z0),n=Math.ceil(L/1.6);
      for(let i=0;i<n;i++){const u=(i+.5)/n;pts.push({x:x0+(x1-x0)*u,z:z0+(z1-z0)*u,tx:(x1-x0)/L,tz:(z1-z0)/L,len:L/n+.05});}}}
  else for(let a=0;a<Math.PI*2;a+=1.5/o.r)pts.push({x:o.x+Math.cos(a)*R0,z:o.z+Math.sin(a)*R0,tx:-Math.sin(a),tz:Math.cos(a),len:1.6});
  for(const q of pts){const nx=-(q.x-o.x)/R0,nz=-(q.z-o.z)/R0,nl=Math.hypot(nx,nz);if(playD(q.x-nx/nl*.6,q.z-nz/nl*.6)<.2)continue;
    wallPiece(zn,q.x,q.z,q.tx,q.tz,nx/nl,nz/nl,q.len,o.y,Math.atan2(q.z-o.z,q.x-o.x)*o.r,o.h);}
  const seg=o.sides||48;hm.add(new THREE.CylinderGeometry(o.r+.8,o.r+.8,.3,seg),M(o.x,o.y-.13,o.z,0,o.sides?Math.PI/o.sides:0,0),zn==='chamber'?C(0x1c1822):C(0x34303c));
  if(!o.open)hm.add(new THREE.CylinderGeometry(o.r+1.4,o.r+1.4,.8,seg),M(o.x,o.y+o.h+.4,o.z,0,o.sides?Math.PI/o.sides:0,0),K_DARK2);
  if(!o.open)hs.add(new THREE.TorusGeometry(o.r-.6,.05,4,64),M(o.x,o.y+o.h-.6,o.z,Math.PI/2,0,0),K_STRIP);
  if(zn!=='chamber'&&!o.open)for(let k=0;k<4;k++)hm.add(boxUV(o.r*2,.5,.6,3),M(o.x,o.y+o.h-.3,o.z,0,k/4*Math.PI,0),K_DARK);}
// the vault's ceiling: eight ribs to a ring over the device; its floor: three rings and spokes of violet light
{const o=CH;for(let k=0;k<8;k++){const a=k/8*Math.PI*2;hm.add(boxUV(o.r,.7,.8,3),M(o.x+Math.cos(a)*o.r*.5,o.h-1,o.z+Math.sin(a)*o.r*.5,0,-a,0),K_DARK);}
 hm.add(new THREE.TorusGeometry(3,.4,8,32),M(o.x,o.h-1.2,o.z,Math.PI/2,0,0),K_DARK2);
 for(const r of[4.5,9,13])og.add(new THREE.TorusGeometry(r,.04,4,96),M(o.x,.04,o.z,Math.PI/2,0,0),K_GOLD);
 for(let k=0;k<8;k++){const a=(k+.5)/8*Math.PI*2;og.add(new THREE.BoxGeometry(8,.02,.05),M(o.x+Math.cos(a)*8.5,.04,o.z+Math.sin(a)*8.5,0,-a,0),K_GOLD);}}
// the peak: the extraction pad on a tower of black plate, open on every side; a rail round it with gaps for the way up (south) and
// Mercy's ramp (east); landing rings; lamps
{const P=PLAT;hm.add(new THREE.CylinderGeometry(P.r+.6,P.r+.6,.5,48),M(P.x,PLAT_Y-.25,P.z),C(0x2c2834));
 hm.add(new THREE.CylinderGeometry(P.r*.75,P.r*.95,PLAT_Y+8,24),M(P.x,PLAT_Y/2-4.6,P.z),K_DARK);
 for(let k=0;k<3;k++)hg.add(new THREE.TorusGeometry(5+k*5.5,.07,4,64),M(P.x,PLAT_Y+.03,P.z,Math.PI/2,0,0),W1);
 for(let a=0;a<Math.PI*2;a+=.07){if(Math.abs(Math.atan2(Math.sin(a-Math.PI/2),Math.cos(a-Math.PI/2)))<.32||Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.2)continue;
   const x=P.x+Math.cos(a)*(P.r+.3),z=P.z+Math.sin(a)*(P.r+.3);hm.add(boxUV(.12,1.1,.12,1),M(x,PLAT_Y+.55,z),K_SIL);hm.add(boxUV(1.5,.08,.1,1),M(x,PLAT_Y+1.1,z,0,-a+Math.PI/2,0),K_SIL);if(((a/.07)|0)%3===0)hs.add(new THREE.BoxGeometry(.2,.06,.2),M(x,PLAT_Y+.04,z),K_STRIP);}
 for(const a of[.9,2.3,3.9,5.3]){const x=P.x+Math.cos(a)*(P.r-1.5),z=P.z+Math.sin(a)*(P.r-1.5);hm.add(new THREE.CylinderGeometry(.18,.25,3,6),M(x,PLAT_Y+1.5,z),K_DARK2);}}
// the path out to the landing zone: the yard's floor carried on 36 m past the gateposts, so it doesn't stop short in the dust
{const p0=roadPt(0).clone(),p1=roadPt(2).clone(),fw=p1.clone().sub(p0).normalize(),n=roadN(0),ry=Math.atan2(n.z,-n.x),w=laneHalf(0)*2+2.4;
  for(let d=2;d<=36;d+=2){const x=p0.x-fw.x*d,z=p0.z-fw.z*d,fy=floorAt(x,z);hm.add(new THREE.BoxGeometry(w*(1-d/90),.3,2.25),M(x,fy-.12,z,0,ry,0),C(0x2a2630));
    if(d%8===0)hg.add(new THREE.BoxGeometry(w*.8*(1-d/90),.02,.08),M(x,fy+.04,z,0,ry,0),W1);}}
// floors
for(let s=0;s<=ROAD_LEN;s+=2){const zn=zoneOf(s),p=roadPt(s).clone(),n=roadN(s),h=laneHalf(s)+1.2,ry=Math.atan2(n.z,-n.x);if(roomAt(p.x,p.z,-1.2)||inPlat(p.x,p.z,-1))continue;
  const f0=floorAt(...[roadPt(Math.max(0,s-1),new THREE.Vector3())].map(v=>[v.x,v.z])[0]),f1=floorAt(...[roadPt(Math.min(ROAD_LEN,s+1),new THREE.Vector3())].map(v=>[v.x,v.z])[0]),fy=(f0+f1)/2,pitch=Math.atan2(f1-f0,2);
  const col=zn==='old'||zn==='chamber'?K_PALE2:zn==='yard'?C(0x2a2630):C(0x34303c);
  const g=new THREE.BoxGeometry(h*2+(zn==='hall'?7:0),.3,2.25);(zn==='old'||zn==='chamber'?om:hm).add(g,M(p.x,fy-.15,p.z,0,ry,0).multiply(M(0,0,0,-pitch,0,0)),col);
  if(zn==='yard'||zn==='host'||zn==='ramp'){if(s%8===0)hg.add(new THREE.BoxGeometry(h*1.6,.02,.08),M(p.x,fy+.02,p.z,0,ry,0).multiply(M(0,0,0,-pitch,0,0)),W1);}
  // roofs over everything after the gate
  if(zn!=='yard'&&zn!=='lz'&&zn!=='hangar'&&zn!=='top'){const H=WALLH[zn]||9;const w=h*2+(zn==='hall'?8:1.6);
    hm.add(boxUV(w,.8,2.3,3),M(p.x,fy+H+.4,p.z,0,ry,0).multiply(M(0,0,0,-pitch,0,0)),K_DARK2);
    if(s%6===0)hm.add(boxUV(w,.6,.5,3),M(p.x,fy+H-.25,p.z,0,ry,0),K_DARK);
    if(zn!=='old'&&s%6===0)hs.add(new THREE.BoxGeometry(1.2,.05,.3),M(p.x,fy+H-.56,p.z,0,ry,0),K_STRIP);}
}
/* ---------- the approach (Oct 25): the Host's road, the relay, the gun nests and the settlement ----------
   The road: a band of dark fused rock ten metres wide, guide lights along both edges, pylons with purple lamps. The settlement: blocks
   of the Host's black stone on both sides of the road through a wide plaza, some with doors and lit windows, shelters, a mast; whole
   buildings are solid (RECTS, js/origin/03-play.js). Gun nests: raised blocks at the road's edge for a Hollow turret on top. */
window.RECTS=window.RECTS||[];
const ROOF_SPOTS=[],NESTS=[],SPIRES_LATE=[];
function hostBlock(x,z,ry,w,d,h,o){o=o||{};const T=(lx,ly,lz,rx)=>M(x,0,z,0,ry,0).multiply(M(lx,ly,lz,rx||0,0,0));
  hm.add(boxUV(w,h+2,d,4),T(0,(h-2)/2,0),rng()<.35?K_DARK2:K_DARK);
  hm.add(boxUV(w+.6,.5,d+.6,3),T(0,h+.1,0),K_SIL);                                  // the roof's silver lip
  hg.add(new THREE.BoxGeometry(w*1.002,.08,d*1.002),T(0,h*.32,0),W1);               // a purple seam round it
  const face=o.face||1;
  /* Oct 26 (Bryce: enemies on the roofs shooting from places you can't see, and from inside buildings): a roof that holds a rifleman
     or a gun keeps its upper tier back off the street edge (they used to stand inside it), and the tier is solid like the block */
  if(o.tier){let w2=w*R(.45,.65),d2=d*R(.45,.65);const h2=R(3,6),tx=R(-w/5,w/5);let tz=R(-d/6,d/6);
    if(o.roof){d2=Math.min(d2,d-4.2);tz=face*(-d/2+.3+d2/2);}
    hm.add(boxUV(w2,h2,d2,3),T(tx,h+h2/2,tz),K_DARK2);
    const c=Math.cos(ry),s=Math.sin(ry);RECTS.push({x:x+tx*c+tz*s,z:z-tx*s+tz*c,hw:w2/2,hd:d2/2,ry,y0:h,h:h2});
    if(rng()<.6)hm.add(new THREE.CylinderGeometry(.12,.18,R(5,9),5),T(R(-w2/3,w2/3),h+h2+3,tz),K_SIL);}
  // windows on the side toward the road, and on the ends
  for(let k=-2;k<=2;k++){if(rng()<.35)continue;const wx=k*w/5.5;if(Math.abs(wx)>w/2-1)continue;wn.add(new THREE.BoxGeometry(1.2,.9,.06),T(wx,h*.66,face*(d/2+.03)),W1);}
  RECTS.push({x,z,hw:w/2,hd:d/2,ry,y0:-2,h:h+2.35,host:true});   // (Oct 26: the box runs -2 to h, the silver lip to h+.35; its top was 2 m short, so the roof's top let sight and shots through)
  // a roof spot is on the street edge, where whoever stands there is seen and can see down (fx,fz: toward the street; ax,az: along it)
  if(o.roof){const fx=Math.sin(ry)*face,fz=Math.cos(ry)*face;ROOF_SPOTS.push({x,z,y:h+.35,ry,w,d,fx,fz,ax:Math.cos(ry),az:-Math.sin(ry),front:!!o.front});}
  return{x,z,ry,w,d,h};}
{const restoreA=OPEN_ALL();
 /* the ledge (Oct 26): a band of the Host's fused black rock along the shelf from the pad to the yard, guide lights along its edges,
    pylons with purple lamps on the cliff side; the transfer pad itself, a six-sided deck jutting out over the valley on struts */
 {const N=Math.ceil(AP_LEN/3),pos=[],idx=[],col=[],c0=C(0x221e28),c1=C(0x2c2832);
  for(let i=0;i<=N;i++){const sv=-AP_LEN+i/N*AP_LEN,p=apPt(sv).clone(),n=apN(sv),hw=4.6+.3*Math.sin(i*.7);
    for(const sd of[-1,-.5,0,.5,1]){const x=p.x+n.x*sd*hw,z=p.z+n.z*sd*hw;pos.push(x,groundY(x,z)+.2,z);const c=(i%2?c0:c1);col.push(c.r,c.g,c.b);}
    if(i<N)for(let j=0;j<4;j++){const b=i*5+j;idx.push(b,b+5,b+1,b+1,b+5,b+6);}
    if(i%6===0&&sv<-6&&sv>-AP_LEN+34)for(const sd of[-1,1]){const x=p.x+n.x*sd*(hw-.3),z=p.z+n.z*sd*(hw-.3);hg.add(new THREE.BoxGeometry(.5,.06,.5),M(x,groundY(x,z)+.1,z),W1);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const road=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:.2,polygonOffset:true,polygonOffsetFactor:-2}));road.receiveShadow=true;scene.add(road);}
 window.AP_LAMPS=[];
 for(let sv=-AP_LEN+50;sv<-16;sv+=44){const p=apAt(sv,-(apHalf(sv)+2.2));
   hm.add(new THREE.CylinderGeometry(.35,.6,9,6),M(p.x,p.y+4.5,p.z),K_DARK);hm.add(boxUV(2.4,.3,.5,2),M(p.x,p.y+8.6,p.z,0,Math.atan2(apN(sv).x,apN(sv).z),0),K_SIL);hg.add(new THREE.BoxGeometry(.14,6,.14),M(p.x+.38,p.y+4.5,p.z),W1);
   const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(HOST_GLOW).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.scale.setScalar(5);l.position.set(p.x,p.y+9.2,p.z);scene.add(l);AP_LAMPS.push(l);}
 // the pad: a six-sided deck, its rim lit, a landing ring and chevrons; struts down the cliff under it
 {const r=LZ.r+.8;hm.add(new THREE.CylinderGeometry(r,r,1.2,6),M(LZ.x,-.6,LZ.z,0,Math.PI/6,0),C(0x2a2630));hm.add(new THREE.CylinderGeometry(r-1,r-6,6,6),M(LZ.x,-4.2,LZ.z,0,Math.PI/6,0),K_DARK);
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2+Math.PI/6,x=LZ.x+Math.cos(a)*(r-.3),z=LZ.z+Math.sin(a)*(r-.3);hs.add(new THREE.BoxGeometry(r*.95,.06,.2),M(x,.04,z,0,-a+Math.PI/2,0),K_STRIP);
    const sx=LZ.x+Math.cos(a)*(r-3),sz=LZ.z+Math.sin(a)*(r-3),gy=landY(sx,sz);if(gy<-6){const L=-6-gy;hm.add(new THREE.CylinderGeometry(.8,1.4,L,6),M(sx,-6-L/2,sz,Math.sin(a)*.12,0,-Math.cos(a)*.12),K_DARK2);}}
  for(const rr of[9,16])hg.add(new THREE.TorusGeometry(rr,.08,4,64),M(LZ.x,.03,LZ.z,Math.PI/2,0,0),W1);
  for(let k=0;k<4;k++){const a=k/4*Math.PI*2;hg.add(new THREE.BoxGeometry(2.4,.02,.3),M(LZ.x+Math.cos(a)*12.5,.03,LZ.z+Math.sin(a)*12.5,0,-a,0),W1);}}
 // the facility's transmitter, on the cliff over the yard's mouth: the mast the signal is coming from
 // the facility's transmitter: a mast on the very top of the peak, beside the extraction pad. It is what the signal is coming from,
 // and you can see it from the ledge, a long way north over the facility's roofs
 {const x=PLAT.x-36,z=PLAT.z-4,y0=-40,H=110;hm.add(new THREE.CylinderGeometry(1.2,3.6,H,6),M(x,y0+H/2,z),K_DARK);hm.add(new THREE.CylinderGeometry(0,1.2,11,6),M(x,y0+H+5.5,z),K_SIL);
  for(let y=4;y<y0+H;y+=8)hg.add(new THREE.BoxGeometry(.3,3,.3),M(x+2,y,z),W1);for(let k=0;k<3;k++){const a=k/3*Math.PI*2;hm.add(boxUV(.5,H*.45,.5,2),M(x+Math.cos(a)*3.2,y0+H*.75,z+Math.sin(a)*3.2,Math.sin(a)*.08,0,-Math.cos(a)*.08),K_SIL);}
  for(const y of[50,62])hm.add(boxUV(9,.4,.4,2),M(x,y,z,0,.6,0),K_SIL);
  const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff6a5a).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.scale.setScalar(16);l.position.set(x,y0+H+13,z);scene.add(l);SPIRES_LATE.push({l,x,red:true});window.MAST={x,z,y:y0+H+13,l};OBST.push({x,z,r:4,h:H});}
 restoreA();}
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
   if(zn==='old'&&Math.abs(s%9-4.5)>.26)continue;
   if(roomAt(roadPt(s).x,roadPt(s).z,4))continue;
   const gap={yard:20,host:13,hall:15,old:22}[zn];
   for(const side of[-1,1]){const key=side;if(last[key]!=null&&s-last[key]<gap)continue;
     if(!wallAt(s-1.6,side)||!wallAt(s+1.6,side))continue;const W=wallAt(s,side);if(!W)continue;
     const nx=-W.n.x*side,nz=-W.n.z*side,f=FACE[zn],fy=floorAt(W.p.x,W.p.z);
     if(zn==='host'&&side===OVER.side&&s>OVER.s0-3&&s<OVER.s1+3)continue;   // not in the overlook's glass
     if(zn==='hall')DOORS.add('host',W.ox-nx*3.1,fy+5,W.oz-nz*3.1,nx,nz,{light:rng()>.25});   // the detention wing's floor has the cells (below); these are up on the gallery, behind the riflemen
     else DOORS.add('host',W.ox+nx*f,fy,W.oz+nz*f,nx,nz,{light:rng()>.15});
     last[key]=s;}}
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
     if(zn==='ramp'||zn==='top'||zn==='hangar')continue;   // (the climb and the peak stay clear: the view from the top runs all the way round)
     for(const [a,b,H] of tiers){const mid=(a+b)/2,x=p.x+n.x*side*mid,z=p.z+n.z*side*mid;
       if(inPlat(x,z,22)||(x>PLAT.x+4&&Math.abs(z-PLAT.z)<PLAT.r+30)||inStage(x,z,(b-a)/2+6))continue;
       if(playD(x,z)<Math.hypot((b-a)/2,5.8)+.5||summitD(x,z)>-4)continue;
       hm.add(boxUV(b-a,H+6,11.6,6),M(x,(H-6)/2,z,0,ry,0),rng()<.3?K_DARK2:K_DARK);
       if(rng()<.45)for(let k=-1;k<=1;k++){const f=(b-a)/2+.03,cx=x+n.x*side*f,cz=z+n.z*side*f,tx=-n.z,tz=n.x;   // a row of three windows on the face toward the way in
         wn.add(new THREE.BoxGeometry(.06,1.1,2),M(cx+tx*k*3.2,H-2.2,cz+tz*k*3.2,0,ry,0),W1);}}
   }
   // over the roof
   if(zn!=='yard'&&zn!=='lz'&&zn!=='hangar'&&zn!=='ramp'&&zn!=='top'&&s<ROAD_LEN-6&&!roomAt(p.x,p.z,1)){const H=(WALLH[zn]||9)+(zn==='chamber'?8:2);hm.add(boxUV(h*2+3,2.5,11.6,6),M(p.x,H+.8+floorAt(p.x,p.z),p.z,0,ry,0),K_DARK2);}
 }
 // the front, either side of the yard's mouth, leaning back into the ground
 for(const sx of[-1,1])for(let x=22;x<80;x+=12){hm.add(boxUV(12,22,10,6),M(sx*(x+6),5,-2,-.25,0,0),K_DARK);hm.add(new THREE.ConeGeometry(.9,8,4),M(sx*(x+6),17,-4,-.6,0,0),K_SIL);}
 // spires: tall black needles with purple light climbing them, a crown of spines, a lamp at the tip
 for(const [s,lat,H] of[[30,-52,80],[140,-44,120],[260,-56,110],[330,-50,160],[440,-54,140],[530,-64,130]]){   // (Oct 26: fewer than Site K's: a facility meant to stay hidden in the cliffs; all on the west side, clear of the staging hall and the gorge)   // Oct 25: the last two moved to the west side: east of the hangar is the gunship's sky, and she was clipping past them in your line of fire
  const p=roadPt(s).clone(),n=roadN(s),x=p.x+n.x*lat,z=p.z+n.z*lat;if(playD(x,z)<9||inStage(x,z,8))continue;
   hm.add(new THREE.CylinderGeometry(1.5,5,H,6),M(x,H/2,z),K_DARK);hm.add(new THREE.CylinderGeometry(0,1.5,H*.25,6),M(x,H+H*.12,z),K_SIL);
   for(let k=0;k<6;k++){const a=k/6*Math.PI*2;hm.add(new THREE.ConeGeometry(.35,7,4),M(x+Math.cos(a)*2.4,H*.82,z+Math.sin(a)*2.4,Math.sin(a)*.6,0,-Math.cos(a)*.6),K_SIL);}
   for(let y=6;y<H*.8;y+=7)hg.add(new THREE.BoxGeometry(.3,3,.3),M(x+2.6,y,z),W1);
   const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(HOST_GLOW).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));l.scale.setScalar(14);l.position.set(x,H*1.25,z);scene.add(l);SPIRES.push({l,x,z,H});}
 restore2();}

/* the merged meshes */
const meshHost=new THREE.Mesh(hm.build(),hostMat);meshHost.castShadow=meshHost.receiveShadow=true;scene.add(meshHost);
const meshOld=new THREE.Mesh(om.build(),oldMat);meshOld.castShadow=meshOld.receiveShadow=true;scene.add(meshOld);
scene.add(new THREE.Mesh(hg.build(),purpleGlow),new THREE.Mesh(hs.build(),stripMat),new THREE.Mesh(og.build(),goldGlow),new THREE.Mesh(wn.build(),winMat));
{const gl=new THREE.Mesh(glm.build(),glassMat);gl.renderOrder=2;scene.add(gl);}   // the overlook's glass, drawn last

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

/* ---------- the vault's blast door: two slabs of Host armour across the containment wing's end, a silver frame, a seam of violet light.
   They slide apart into the walls (DOOR.open 0 → 1) ---------- */
const DOOR=(()=>{const p=roadPt(S_DOOR).clone(),n=roadN(S_DOOR),ry=Math.atan2(n.z,-n.x),G=new THREE.Group();G.position.set(p.x,0,p.z);G.rotation.y=ry;scene.add(G);
  const W=11,H=9,fm=new Merger(),fg=new Merger();
  for(const sd of[-1,1]){fm.add(boxUV(3.4,H+3,1.8,3),M(sd*(W/2+1.7),(H+3)/2,0),K_DARK2);fm.add(boxUV(.4,H,1.9,3),M(sd*(W/2+.1),H/2,0),K_SIL);}
  fm.add(boxUV(W+7,2.6,1.8,3),M(0,H+1.3,0),K_DARK2);fg.add(new THREE.BoxGeometry(W,.12,.06),M(0,H+.3,.95),W1);
  const fr=new THREE.Mesh(fm.build(),hostMat);fr.castShadow=true;G.add(fr,new THREE.Mesh(fg.build(),purpleGlow));
  const leaves=[];for(const sd of[-1,1]){const lm=new Merger(),lg=new Merger();lm.add(boxUV(W/2,H,1.1,3),M(0,H/2,0),K_DARK);
    for(let k=0;k<5;k++)lm.add(boxUV(W/2-.6,.35,1.25,3),M(0,1.2+k*1.7,0),K_DARK2);lm.add(boxUV(.5,H,1.3,3),M(-sd*(W/4-.25),H/2,0),K_SIL);
    lg.add(new THREE.BoxGeometry(.1,H-.8,.04),M(-sd*(W/4-.6),H/2,.66),W1);const L=new THREE.Group();L.position.set(sd*W/4,0,0);G.add(L);
    const mm=new THREE.Mesh(lm.build(),hostMat);mm.castShadow=true;L.add(mm,new THREE.Mesh(lg.build(),purpleGlow));leaves.push({L,sd,x0:sd*W/4});}
  const seam=new THREE.Mesh(new THREE.PlaneGeometry(.2,H),new THREE.MeshBasicMaterial({color:C(0xc8a8ff).multiplyScalar(1.6),transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));seam.position.set(0,H/2,.62);G.add(seam);
  return{G,leaves,seam,open:0,p};})();
function updateDoor(dt){if(DOOR.open<=0)return;DOOR.open=Math.min(1,DOOR.open+dt*.32);const u=CUTS.ease(DOOR.open);
  for(const L of DOOR.leaves)L.L.position.x=L.x0+L.sd*u*5.6;DOOR.seam.material.opacity=Math.max(0,.8-u*2);if(DOOR.open>=.6)barrier('door').open=true;}

/* ---------- the vault's way out: a Host slab door in its north wall. The Host come through it once the field starts to fail ---------- */
function hostDoor(x,z,face,W,H){const G=new THREE.Group();G.position.set(x,0,z);G.rotation.y=face;scene.add(G);
  const fm=new Merger();for(const sd of[-1,1]){fm.add(boxUV(1,H,1.3,2),M(sd*(W/2+.3),H/2,0),K_DARK2);fm.add(boxUV(.3,H,1.36,2),M(sd*(W/2-.1),H/2,0),K_SIL);}
  fm.add(boxUV(W+1.6,1,1.3,2),M(0,H-.3,0),K_DARK2);const fr=new THREE.Mesh(fm.build(),hostMat);fr.castShadow=true;G.add(fr);
  const slab=new THREE.Group();G.add(slab);const sm=new Merger(),sg=new Merger();
  sm.add(boxUV(W,H-.9,.7,2),M(0,(H-.9)/2,0),K_DARK);for(const y of[2.2,4.6,7])sm.add(boxUV(W*.92,.25,.8,2),M(0,y,0),K_DARK2);
  sg.add(new THREE.BoxGeometry(.08,H-1.4,.78),M(0,(H-.9)/2,0),W1);sg.add(new THREE.BoxGeometry(W*.8,.06,.8),M(0,1.2,0),W1);
  const sl=new THREE.Mesh(sm.build(),hostMat);sl.castShadow=true;slab.add(sl,new THREE.Mesh(sg.build(),purpleGlow));
  return{G,slab,open:0,go:false,H};}
const SDOOR=(()=>{const p=roadPt(S_RAMP-1).clone(),n=roadN(S_RAMP-1);return hostDoor(p.x,p.z,Math.atan2(n.z,-n.x),11,9);})();
const RDOOR={go:false,open:0,slab:{position:{y:0}},G:{position:new THREE.Vector3()}};   // (Site K's power-room back door: not here)
const GEN={cut:false,on:0,pos:new THREE.Vector3(-9e3,0,-9e3)};
/* ---------- the vault's heart: the device hanging in a column of light inside a cage of Host bars, held there by three field emitters
   round the room (pylons with violet cores, a beam from each to the cage). Shut the three down and the field fails ----------
   The device itself is the same thing the Pathfinder carried off the moon: a tall narrow shape of black glass with light moving in it. */
const ART=(()=>{const G=new THREE.Group();G.position.set(CH.x,0,CH.z);scene.add(G);
  const cm=new Merger(),cg=new Merger();
  cm.add(new THREE.CylinderGeometry(3,3.4,.6,8),M(0,.3,0),K_DARK2);cm.add(new THREE.CylinderGeometry(2.6,2.6,.5,8),M(0,CH.h-2,0),K_DARK2);
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;cm.add(boxUV(.18,CH.h-2.4,.18,2),M(Math.cos(a)*2.4,(CH.h-2)/2+.3,Math.sin(a)*2.4),K_SIL);}
  for(const y of[1.4,4.6])cm.add(new THREE.TorusGeometry(2.4,.08,6,32),M(0,y,0,Math.PI/2,0,0),K_DARK);
  cg.add(new THREE.TorusGeometry(2.45,.03,4,48),M(0,.65,0,Math.PI/2,0,0),W1);
  const cmm=new THREE.Mesh(cm.build(),hostMat);cmm.castShadow=true;G.add(cmm,new THREE.Mesh(cg.build(),purpleGlow));
  const og=new THREE.OctahedronGeometry(1,3);const P=og.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i);P.setXYZ(i,P.getX(i)*.34*(1-Math.abs(y)*.25),y*1.15,P.getZ(i)*.34*(1-Math.abs(y)*.25));}og.computeVertexNormals();
  const objU={uT:{value:0},wake:{value:0}};
  const om=new THREE.ShaderMaterial({uniforms:objU,vertexShader:'varying vec3 vN;varying vec3 vP;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vP=position;vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:`varying vec3 vN;varying vec3 vP;varying vec3 vV;uniform float uT,wake;
    void main(){float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.5);
      float a=atan(vP.z,vP.x);float l1=smoothstep(.97,1.0,sin(vP.y*9.0+a*3.0+uT*.7+sin(uT*.31)*4.0));float l2=smoothstep(.985,1.0,sin(vP.y*-13.0+a*5.0-uT*.43));
      vec3 c=vec3(.01,.01,.02)+vec3(.55,.6,.9)*f*.6+vec3(.75,.85,1.0)*(l1+l2)*(.6+wake*2.4)+vec3(1.0,.95,.8)*wake*f*1.4;
      gl_FragColor=vec4(c,1.0);}`});
  const obj=new THREE.Mesh(og,om);obj.position.y=4.2;obj.scale.setScalar(.85);G.add(obj);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xa8b8ff).multiplyScalar(.9),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6}));halo.scale.setScalar(4);halo.position.y=4.2;G.add(halo);
  const N=90,pp=new Float32Array(N*3),motes=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({size:.05,color:C(0xd8e0ff).multiplyScalar(2),transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
  motes.geometry.setAttribute('position',new THREE.BufferAttribute(pp,3));motes.position.y=4.2;G.add(motes);const ph=[...Array(N)].map(()=>[R(0,6.28),R(.7,1.8),R(-1.6,1.6),R(.2,.6)]);
  // the column of light, floor to ceiling, through the cage
  const field=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,CH.h-2.4,24,1,true),new THREE.MeshBasicMaterial({color:C(HOST_GLOW).multiplyScalar(1.3),transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  field.position.y=(CH.h-2)/2+.3;G.add(field);
  const light=new THREE.PointLight(C(0xb8c4ff),1.6,30,1.6);light.position.y=5;G.add(light);
  OBST.push({x:CH.x,z:CH.z,r:2.8,h:CH.h});
  return{G,obj,objU,halo,motes,ph,pp,field,light,fieldOn:1,taken:false};})();
// the three emitters, round the vault at 7 m (one north, two either side of the way in), each with a beam to the cage
const EMIT=[-Math.PI/2,Math.PI/6,Math.PI*5/6].map(a=>{const x=CH.x+Math.cos(a)*8,z=CH.z+Math.sin(a)*8,G=new THREE.Group();G.position.set(x,0,z);scene.add(G);
  const m=new Merger();m.add(new THREE.CylinderGeometry(1.3,1.6,.7,6),M(0,.35,0),K_DARK2);for(let k=0;k<3;k++){const b=k/3*Math.PI*2;m.add(boxUV(.4,4.6,.4,2),M(Math.cos(b)*.9,2.6,Math.sin(b)*.9),K_DARK);}
  m.add(new THREE.CylinderGeometry(.9,.9,.4,6),M(0,5,0),K_DARK2);const body=new THREE.Mesh(m.build(),hostMat);body.castShadow=true;G.add(body);
  const coreMat=new THREE.MeshBasicMaterial({color:C(HOST_GLOW).multiplyScalar(2.2),transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const core=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,3.8,10,1,true),coreMat);core.position.y=2.7;G.add(core);
  const from=new THREE.Vector3(x,5,z),to=new THREE.Vector3(CH.x,4.4,CH.z),L=from.distanceTo(to);
  const beamMat=new THREE.MeshBasicMaterial({color:C(HOST_GLOW).multiplyScalar(2),transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,L,6,1,true),beamMat);beam.position.lerpVectors(from,to,.5);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.clone().sub(from).normalize());scene.add(beam);
  OBST.push({x,z,r:1.6,h:5.2});return{G,x,z,a,core,coreMat,beam,beamMat,on:1,off:false};});
function updateVault(dt,T){
  for(const D of[SDOOR])if(D.go&&D.open<1){D.open=Math.min(1,D.open+dt*.5);D.slab.position.y=CUTS.ease(D.open)*(D.H-1.1);if(D.open>.55)barrier('exit').open=true;}
  for(const E of EMIT){if(E.off)E.on=Math.max(0,E.on-dt*1.2);const fl=E.off&&E.on>0?(Math.random()<.35?.2:1):1;E.coreMat.opacity=(.6+.3*Math.sin(T*4+E.a))*E.on*fl;E.beamMat.opacity=(.5+.25*Math.sin(T*9+E.a))*E.on*fl;E.beam.visible=E.on>.02;}}
function updateArtifact(dt,T){ART.objU.uT.value=T;ART.obj.rotation.y+=dt*.12;ART.obj.position.y=4.2+Math.sin(T*.7)*.12*(ART.fieldOn);
  for(let i=0;i<ART.ph.length;i++){const p=ART.ph[i];p[0]+=dt*p[3];ART.pp.set([Math.cos(p[0])*p[1],p[2]+Math.sin(T*.5+i)*.1,Math.sin(p[0])*p[1]],i*3);}ART.motes.geometry.attributes.position.needsUpdate=true;
  const lit=EMIT.reduce((a,E)=>a+E.on,0)/3;ART.field.material.opacity=ART.fieldOn*lit*(.22+.1*Math.sin(T*3))*(ART.flicker?(Math.random()<.4?0:1):1);}

/* ---------- the hangar roof: six great plates on ribs. The gunship comes through it ---------- */
const ROOF={parts:[],y:PLAT_Y+WALLH.hangar};   // (the extraction pad is open to the sky: no roof to bring down)
// the roof comes down in pieces: they fall, tumble and land as cover on the deck
// (the plates don't fall whole: each one shatters where it is and comes down as a few chunks)
const CHUNKS=[];
function collapseRoof(){hangarOpen=true;return;ROOF.parts.forEach((P,i)=>{if(i===1||i===4)return;P.falling=true;P.delay=i*.18;P.G.visible=false;
    for(let k=0;k<4;k++){const r=PLAT.r*R(.25,.85),a=P.am+R(-.4,.4),m=new THREE.Mesh(boxUV(R(3,6),R(.6,1),R(3,6),3),hostMat);
      m.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(m.geometry.attributes.position.count*3).fill(.18),3));
      m.position.set(PLAT.x+Math.cos(a)*r,ROOF.y+R(0,1.5),PLAT.z+Math.sin(a)*r);m.castShadow=true;scene.add(m);CHUNKS.push({m,v:new THREE.Vector3(R(-2,2),R(0,2),R(-2,2)),s:new THREE.Vector3(R(-2,2),R(-2,2),R(-2,2)),d:P.delay+k*.08});}
    boom(new THREE.Vector3(PLAT.x+Math.cos(P.am)*PLAT.r*.5,ROOF.y,PLAT.z+Math.sin(P.am)*PLAT.r*.5),10,0xffc08a,.6);});
  if(typeof sfx!=='undefined')sfx.collapse(new THREE.Vector3(PLAT.x,PLAT_Y+10,PLAT.z));}
function updateRoof(dt){for(let i=CHUNKS.length-1;i>=0;i--){const c=CHUNKS[i];if(c.d>0){c.d-=dt;continue;}c.v.y-=16*dt;c.m.position.addScaledVector(c.v,dt);c.m.rotation.x+=c.s.x*dt;c.m.rotation.z+=c.s.z*dt;
    if(c.m.position.y<PLAT_Y+.5){c.m.position.y=PLAT_Y+.4;c.m.rotation.x*=.15;c.m.rotation.z*=.15;CHUNKS.splice(i,1);puff(c.m.position.clone(),R(2,4),2);
      // Oct 25: a landed chunk is solid (you used to walk through them): a collider the size of the slab, cover for both sides
      c.m.geometry.computeBoundingBox();const bb=c.m.geometry.boundingBox,hw=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)/2;
      if(inPlat(c.m.position.x,c.m.position.z,-1))OBST.push({x:c.m.position.x,z:c.m.position.z,r:Math.max(1.2,hw*.85),h:1.4});}}
for(const P of ROOF.parts){if(!P.falling||P.done)continue;if(P.delay>0){P.delay-=dt;continue;}P.v.y-=16*dt;P.G.position.addScaledVector(P.v,dt);P.G.rotation.x+=P.spin.x*dt;P.G.rotation.z+=P.spin.z*dt;
  if(P.G.position.y<PLAT_Y+2){P.done=true;P.G.visible=false;
    // what's left is a heap of plate and rib on the deck: cover, for whoever gets to it first
    const x=PLAT.x+Math.cos(P.am)*PLAT.r*.55,z=PLAT.z+Math.sin(P.am)*PLAT.r*.55;debrisHeap(x,z);
    boom(new THREE.Vector3(x,PLAT_Y+1,z),9,0xffc08a,.7);for(let k=0;k<5;k++)puff(new THREE.Vector3(x+R(-4,4),PLAT_Y+.6,z+R(-4,4)),R(1.4,2.6),R(1.6,2.6));}}}   // (Oct 22 review: smaller, lower dust: up close the big puffs read as pale balls)
// Oct 25: solid all the way out to its edges (one 2.6 m circle in the middle used to let you walk into its outer slabs)
function debrisHeap(x,z){const m=new Merger();for(let k=0;k<5;k++){const w=R(2.5,5),d=R(1.5,3),ox=R(-1.5,1.5),oz=R(-1.5,1.5),ry=R(0,3);m.add(boxUV(w,R(.6,1.2),d,3),M(ox,R(.3,1.4),oz,R(-.5,.5),ry,R(-.5,.5)),k%2?K_DARK:K_DARK2);
    // two circles along each slab's length
    for(const u of[-.28,.28])OBST.push({x:x+ox+Math.cos(ry)*w*u,z:z+oz-Math.sin(ry)*w*u,r:Math.max(1,d*.5),h:1.6});}
  m.add(boxUV(.6,.6,5,3),M(0,1.8,0,R(-.6,.6),R(0,3),.3),K_SIL);const o=new THREE.Mesh(m.build(),hostMat);o.position.set(x,PLAT_Y,z);o.castShadow=o.receiveShadow=true;scene.add(o);OBST.push({x,z,r:2.6,h:2.2});}

/* ---------- interior light: a cold lamp that goes where you go inside (the team's helmet lights), the chamber's own,
   and the alarm that turns every strip red ---------- */
const helmLamp=new THREE.PointLight(C(0xd8e6ff),0,32,1.2);scene.add(helmLamp);
const alarmLamp=new THREE.PointLight(C(0xff2a1a),0,40,1.4);scene.add(alarmLamp);
const yardLamps=[];for(const [s,lat] of[[40,-16],[80,16],[112,0]]){const p=roadPt(s).clone(),n=roadN(s);const l=new THREE.PointLight(C(HOST_GLOW),1.6,60,1.6);l.position.set(p.x+n.x*lat,9,p.z+n.z*lat);scene.add(l);yardLamps.push(l);}
let alarmOn=0;
function updateLights(dt,T,pos){const s=roadS(pos.x,pos.z),inside=s>S_GATE-4&&s<S_TOP&&!(hangarOpen&&inPlat(pos.x,pos.z,4));
  helmLamp.intensity+=((inside?.85:0)-helmLamp.intensity)*(1-Math.exp(-dt*3));
  inK+=((inside?1:0)-inK)*(1-Math.exp(-dt*2));if(!CUTS.on){keyLight.intensity=keyBase*(1-.6*inK);hemi.intensity=hemiBase*(1+.7*inK);}helmLamp.position.set(pos.x,pos.y+3.2,pos.z);
  if(alarmOn){const pulse=.5+.5*Math.sin(T*5);alarmLamp.intensity=(inside?2.4:1.2)*pulse*alarmOn;alarmLamp.position.set(pos.x,pos.y+5,pos.z);stripMat.color.setRGB(1.6*(.5+pulse*.8),.12,.08);}
  else{alarmLamp.intensity=0;stripMat.color.setRGB(1.4,1.4,1.4);}
  for(const S of SPIRES)S.l.material.opacity=.6+.4*Math.sin(T*1.3+S.x);for(const S of SPIRES_LATE)S.l.material.opacity=.6+.4*Math.sin(T*1.1+S.x);}

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
setLook('elyra');
