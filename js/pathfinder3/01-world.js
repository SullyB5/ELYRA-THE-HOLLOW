/* Elyra · Pathfinder · Arc 03 · The White City — the world. 10.03.2237, before dawn: Astraea at night, and in the middle of the red
   desert a city nobody built. Smooth white stone with no joins, a wall round it a hundred metres high with one round opening in it,
   streets that climb to a tower at the heart. The Herald war is all over it: amber defending, red trying to bring it down.
   (Nov 16 2026, the Exodus remodel) Dropship Two comes down on a ridge south of the wall; Rhen's team fights across the wreckage
   fields, under the wall through a broken drain, along the undercroft, up a four-tier plaza, round two lesser towers and over the
   chasm to the great tower, up its grand stair, and by lift to the dome room in its crown where the object fits (js/pathfinder3/03-story.js).
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
MODELS.preload(['engineer','chars/keeper-pathfinder','jetpack','rifle','chars/herald-footsoldier','chars/hollow-footsoldier','chars/hollow-commander','dropship','wraith','voidclass']);
// Oct 25 (Bryce: lag spikes when the walker spawns in, and when the stair hold-out starts): this level never opted into the loading
// screen's warm-ups, so the walker's file and each Herald side's armour were built in the middle of the fight. Now they're built behind
// the loading screen (js/origin/03-play.js, js/shared/mech.js). The streets and the spiral have all three: the Host, red and amber.
window.WARM_TEAMS=[null,'red','amber'];window.WARM_MECH=true;
// you are Captain Rhen (read by js/origin/03-play.js)
window.HERALD_LIFT=.16;   // (Oct 25: the Herald models in the White City's pale light: a lighter glow than in the desert dusk)
window.PLAYER_KIND='keeper-pathfinder';window.PLAYER_OPTS={};   // Captain Rhen: Bryce's Pathfinder soldier (Oct 25)

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(C(0x141a2e),.0011);scene.background=scene.fog.color;
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,9000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();
const lerp=(a,b,u)=>a+(b-a)*u;

/* ---------- the sky: Astraea before dawn. Deep blue, hard stars, the galaxy's band, a cold glow along the east where the day is
   still an hour off, and the dead moon (Arc 01's) low in the west. It rides with the camera ---------- */
const skyGroup=new THREE.Group();skyGroup.userData.dyn=1;scene.add(skyGroup);   // (it rides with the camera: never solid to shots, js/shared/solid.js)
const sunDir=new THREE.Vector3(.7,.04,.7).normalize();   // under the horizon, east: the glow it throws up
const skyU={sunDir:{value:sunDir},hor:{value:C(0x2c3352)},mid:{value:C(0x0e1430)},zen:{value:C(0x02030c)},starK:{value:1},sunK:{value:.35},uT:{value:0},band:{value:1},photo:{value:null},photoK:{value:0},photoU:{value:.3},photoB:{value:.5},nebK:{value:1},domeK:{value:0},hazeC:{value:scene.fog.color}};   // (hazeC is the fog's own colour object: setLook keeps them in step)
const sky=new THREE.Mesh(new THREE.SphereGeometry(4000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,mid,zen;uniform float photoK,photoU,photoB,nebK;uniform sampler2D photo;uniform float starK,sunK,uT,band,domeK;uniform vec3 hazeC;
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
      c=mix(c,c*.4+pc,photoK*nebK*smoothstep(-.6,.25,y));}
    // the dome's light, when it is up: the sky over the city goes pale blue-white
    c+=vec3(.25,.34,.5)*domeK*smoothstep(.0,.6,y)*.35;
    c+=vec3(st)*starK*(1.0-domeK*.7)*smoothstep(-.05,.12,y);
    float s=max(dot(d,sunDir),0.0);c+=vec3(.9,.55,.4)*pow(s,6.0)*.18*sunK*smoothstep(-.1,.08,y)*(1.0-smoothstep(.08,.4,y));
    c=mix(c,mix(hor,hor*.3,smoothstep(-.3,-.75,y)),smoothstep(-.3,-.65,y));   // Oct 24: the photo runs well below the horizon, then fades into the ground haze
    // Oct 27: the haze band. Below the horizon the sky is the fog's colour, the way the far desert fogs out, and it lifts off into the
    // sky over the first ~9 degrees, so the dunes meet the sky in haze instead of a hard line
    float hb=1.0-smoothstep(-.01,.2,y);c=mix(c,hazeC*1.1,hb*hb*(3.0-2.0*hb));
    gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
sky.renderOrder=-3;skyGroup.add(sky);
SKIES.load('elyra',t=>{skyU.photo.value=t;skyU.photoK.value=1;});   // Oct 24: Bryce's call, the blue (alien) sky over the White City
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
  night:{hor:0x2c3352,mid:0x0e1430,zen:0x02030c,star:1,sunK:.35,fog:0x1c2338,dens:.00095,keyC:0xa8b8e8,keyI:.85,hemiS:0x5a6a9a,hemiG:0x1a1c2a,hemiI:.5,band:1,exp:1.0},
  // under the dome: everything a little brighter and colder, the stars washed out
  dome:{hor:0x5a6e9a,mid:0x24305a,zen:0x0a1020,star:.35,sunK:.2,fog:0x2a3658,dens:.0008,keyC:0xd8e6ff,keyI:.9,hemiS:0x8aa0d0,hemiG:0x22222a,hemiI:.5,band:.4,exp:.8},
  // the Host overhead: the dome failing, purple through everything
  host:{hor:0x3a2a52,mid:0x1a1030,zen:0x05030c,star:.5,sunK:.1,fog:0x1e1430,dens:.0012,keyC:0xb89ae8,keyI:.7,hemiS:0x6a4a9a,hemiG:0x140f18,hemiI:.45,band:.6,exp:.88}};
let lookName='';
function setLook(name){const L=LOOKS[name];if(!L)return;lookName=name;
  skyU.hor.value.copy(C(L.hor));skyU.mid.value.copy(C(L.mid));skyU.zen.value.copy(C(L.zen));skyU.starK.value=L.star;skyU.sunK.value=L.sunK;skyU.band.value=L.band;skyU.nebK.value=L.neb!=null?L.neb:1;
  scene.fog.color.copy(C(L.fog));scene.fog.density=L.dens;scene.background=scene.fog.color;
  keyLight.color.copy(C(L.keyC));keyLight.intensity=L.keyI;hemi.color.copy(C(L.hemiS));hemi.groundColor.copy(C(L.hemiG));hemi.intensity=L.hemiI;renderer.toneMappingExposure=L.exp;}

/* ---------- the plan (Nov 16 2026, Bryce: the Exodus remodel, after Halo: Reach's Exodus) ----------
   The way in is no longer the round opening (it is sealed now, the landmark you see from the ridge) and no longer the walk round the
   city. Dropship Two comes down on a ridge in the desert south of the wall. From there, in order:
     THE APPROACH   down off the ridge and across the wreckage fields in front of the sealed gate, three or four fights
     THE BREACH     a blast trench at the foot of the wall south-west of the gate, and a collapsed drain under the wall
     THE UNDERCROFT an S-curve of passages under the outer district, 15 m down: a cistern hall, bridges over a pit, a second hall,
                    then a stair up into daylight
     THE PLAZA      four tiers climbing north-west toward Tower A: the Host low, red in the middle, amber's commanders on top
     TOWER A        a ramp round its outside to the skybridge (+42 m)            · or a jetpack hop from the top tier
     TOWER B        a ramp round it to the long bridge (+62 m)                   · or a jetpack hop from the skybridge
     THE BRIDGE     83 m across the chasm round the heart, to the main tower's first gallery (+62 m, the trailer tower's ledge)
     THE TOWER      round the gallery to the south door; inside, the lower balcony round the open shaft; the grand stair up the inner
                    wall to the upper balcony (+148 m); the lift; the dome room in the crown (+280 m)
   Every walkable place is a region (REGIONS): a signed distance (negative inside) and a floor height. The floors never overlap in
   plan (one floor per x,z), so the shared code's groundY/playD contract still holds; the one exception, the lift, has a floor that
   moves (ELEV.y). The walk (ROAD) is one line through all of it, in 3D: s counts metres along it, the lift's ride included.
   Units are metres; the city's centre is the origin, north is -z, the sealed opening faces south (+z). θ (thetaOf) is 0 to the
   south, 90° east, 180° north, 270° west. */
const WR=520,WH=110,WT=14,GATE={x:0,y:58,z:WR,r:34};
const TW={r:70,h:300},CR=30,TOPY=280;   // the tower; the dome room's radius and floor (in the crown)
const SOCKET=new THREE.Vector3(0,TOPY,0);
const DEG=Math.PI/180,TAU=Math.PI*2;
function thetaOf(x,z){let t=Math.atan2(x,z);if(t<0)t+=TAU;return t;}
function ringPt(cx,cz,a,r){return{x:cx+Math.sin(a)*r,z:cz+Math.cos(a)*r};}
function spiralPt(th,r){return ringPt(0,0,th,r);}
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz;if(l2<1e-9)return Math.hypot(px-ax,pz-az);const t=clamp(((px-ax)*dx+(pz-az)*dz)/l2,0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
// angles: a in [a0,a1] (a0<a1, a1 may pass 2π); how far outside, in radians
function angOff(a,a0,a1){let t=(a-a0)%TAU;if(t<0)t+=TAU;const sp=a1-a0;if(t<=sp)return -Math.min(t,sp-t);return Math.min(t-sp,TAU-t);}   // (signed: negative inside)
function angU(a,a0,a1){let t=(a-a0)%TAU;if(t<0)t+=TAU;return clamp(t/(a1-a0),0,1);}

/* the places */
const MESA={x:226,z:1050,r0:64,r1:200,h:30};                       // the ridge Dropship Two comes down on
const CRASH={x:224,z:1046,r:46};
const LZ={x:CRASH.x,z:CRASH.z-10,r:30};   // (js/origin/03-play.js starts you here)
const CUL={a:-22*DEG};                                              // the drain under the wall, south-west of the gate
const CUL_O=ringPt(0,0,CUL.a,WR+WT),CUL_T=ringPt(0,0,CUL.a,WR+WT+40);   // its mouth (the wall's outside face); the trench's top
const APPROACH=[[224,1046],[198,976],[140,904],[64,832],[-18,762],[-96,692],[-158,628],[-204,586],[CUL_T.x,CUL_T.z]];
const PIT={ax:-136,az:402,bx:-104,bz:396,hw:14};                    // the pit the bridges cross (floor 34 m down)
const UND=[   // the undercroft: x, z, floor, half width (the culvert, under the wall, the halls, the climb)
  [CUL_O.x,CUL_O.z,-10,4.4],[ringPt(0,0,CUL.a,WR).x,ringPt(0,0,CUL.a,WR).z,-11,4.4],[-188,466,-13,4.8],[-180,450,-15,5.2],
  [-172,436,-15,6],[-150,410,-15,5],[-136,402,-15,3.2],[-104,396,-15,3.2],[-90,394,-15,5],[-66,382,-15,6],[-44,364,-15,5],
  [-20,372,-11,5],[2,384,-4.5,5.5],[26,396,0,7]];   // (Nov 17: the stair court now climbs out east, into the lower quarter)
const UND_OPEN=11;   // from this node on the climb is open to the sky (a sunken stair court)
const HALLS=[{x:-172,z:436,r:13.5,y:-15,name:'cistern'},{x:-66,z:382,r:13,y:-15,name:'vault'}];
/* the lower quarter (Nov 17 2026, Bryce: "make the White City interior doubled ... not the inside of the tower, but the interior going
   towards the tower ... turning down buildings, going down alleys, to just enlarge that fight before going up"). Out of the stair court
   the way no longer runs straight up to the plaza: it turns east into the old quarter between the wall and the middle ring. A street
   (the Well square at the court's head), down a narrow alley between tall houses, a dog-leg, out into the Fountain square, back west
   along the Colonnade street, through an arcade that runs under a building (roofed), out into the Lamp alley and onto the processional
   avenue that climbs straight to the plaza's foot. All at street level. x, z, floor, half width; tags for the story */
const STREETS=[[26,396,0,12,'courtTop'],[64,412,0,7.5,null],[104,404,0,6,'alleyIn'],[126,380,0,4.4,null],[126,348,0,4.4,null],[150,322,0,12,'square'],
  [126,290,0,8,null],[86,280,0,7.5,'colonnade'],[50,294,0,6,'arcade'],[18,316,0,5,'arcadeOut'],[-6,338,0,5.5,null],[-30,350,0,9,'avenue'],[-64,304.6,0,10,null]];
const ARCADE={a:1,b:2};   // the roofed stretch: STREETS[8] to STREETS[9]
function arcadeD(x,z){const a=STREETS[8],b=STREETS[9];return segDist(x,z,a[0],a[1],b[0],b[1]);}
const PLZ={x:-66,z:302,dx:-.6,dz:-.8,len:100,tier:24,rise:6};       // the plaza: from its foot (E), up toward Tower A
const PLZ_L={x:-PLZ.dz,z:PLZ.dx};                                   // its across (v)
function plzUV(x,z){const ex=x-PLZ.x,ez=z-PLZ.z;return{u:ex*PLZ.dx+ez*PLZ.dz,v:ex*PLZ_L.x+ez*PLZ_L.z};}
function plzXZ(u,v){return{x:PLZ.x+PLZ.dx*u+PLZ_L.x*v,z:PLZ.z+PLZ.dz*u+PLZ_L.z*v};}
const PLZ_RAMPS=[{e:24,v:20,hw:5},{e:48,v:-20,hw:5},{e:72,v:0,hw:6}];   // the stairs between the tiers: zig, zag, up the middle
function plzHW(u){return u<80?36:22;}
function plzTierY(u){return clamp(Math.floor(u/PLZ.tier),0,3)*PLZ.rise;}
const PLZ_RUN=18;   // each stair runs 18 m up the face of the tier above it (it stands on the lower tier)
function plzY(u,v){let y=plzTierY(u);for(const R of PLZ_RAMPS){if(Math.abs(v-R.v)<R.hw&&u>R.e-PLZ_RUN&&u<R.e)y=lerp((R.e/PLZ.tier-1)*PLZ.rise,(R.e/PLZ.tier)*PLZ.rise,(u-(R.e-PLZ_RUN))/PLZ_RUN);}return y;}
const TOWA=(()=>{const p=plzXZ(126,0);return{x:p.x,z:p.z,r:16,h:96,rr:26,rw:3.6,y0:18,y1:42};})();      // Tower A
const TOWB={x:-134,z:124,r:16,h:118,rr:24,rw:3.6,y0:42,y1:62};                                            // Tower B
TOWA.a0=Math.atan2(-PLZ.dx,-PLZ.dz);TOWA.a1=Math.atan2(TOWB.x-TOWA.x,TOWB.z-TOWA.z)-TAU;                            // A's ramp: from the plaza, the long way round, to the skybridge
TOWB.a0=Math.atan2(TOWA.x-TOWB.x,TOWA.z-TOWB.z);TOWB.a1=Math.atan2(-TOWB.x,-TOWB.z)-TAU;                                // B's ramp: from the skybridge, the long way round, to the bridge
if(TOWB.a1>TOWB.a0)TOWB.a1-=TAU;if(TOWB.a0-TOWB.a1>TAU*.75)TOWB.a1+=TAU;
function rampY(T,a){const u=clamp((T.a0-a)/(T.a0-T.a1),0,1),f=15*DEG/(T.a0-T.a1);return lerp(T.y0,T.y1,sstep(f,1-f,u));}
// where a tower's ramp is at angle a (its sweep runs from a0 down to a1)
function rampA(T,x,z){let a=Math.atan2(x-T.x,z-T.z);while(a>T.a0)a-=TAU;while(a<T.a0-TAU)a+=TAU;return a;}
const SKY_A=ringPt(TOWA.x,TOWA.z,TOWA.a1,TOWA.rr),SKY_B=ringPt(TOWB.x,TOWB.z,TOWB.a0,TOWB.rr);                         // the skybridge's ends (ring middles)
const BR_DIR=(()=>{const l=Math.hypot(TOWB.x,TOWB.z);return{x:-TOWB.x/l,z:-TOWB.z/l,len:l};})();
const BR_B=ringPt(TOWB.x,TOWB.z,TOWB.a1,TOWB.rr);
const GAL={y:62,r0:68.6,r1:75.4};                                                                           // the main tower's first gallery (outside)
const BR_G={x:-BR_DIR.x*GAL.r1,z:-BR_DIR.z*GAL.r1};                                                         // where the bridge meets it
const BR_TH=thetaOf(BR_G.x,BR_G.z);
const CHASM={r0:86,r1:154,y:-60};
const HALL={hw:5,z0:58,z1:70,y:62};                                                                      // the door's hall (south, θ 0)
// the tower's inner wall (the panels lean in as they rise: its radius at a height), and the decks against it
function linerR(y){return 70*(1-.45*y/300)-1.2;}
const BAL={r0:30.5};
const LOWB={y:62,a0:295*DEG,a1:443*DEG};
const STAIR={w:9.5,a0:76*DEG,a1:285*DEG,y0:62,y1:148};
const UPB={y:148,a0:278.5*DEG,a1:292*DEG};
const CAR={r0:30,r1:37.5,a0:261*DEG,a1:276.5*DEG,y0:148,y1:TOPY};
const ELEV={y:148,v:0,on:false,shut:false};                                                                  // the lift (js/pathfinder3/03-story.js drives it)
const DOMEROOM={open:false};                                                                                 // its floor counts only once you are up there
function stairY(a){const u=angU(a,STAIR.a0,STAIR.a1),f=9*DEG/(STAIR.a1-STAIR.a0);return lerp(STAIR.y0,STAIR.y1,clamp((u-f)/(1-2*f),0,1));}
function stairR1(a){return linerR(stairY(a))-.6;}function stairR0(a){return stairR1(a)-STAIR.w;}

/* the desert (Oct 27): real dunes. (Nov 16) A ridge where Dropship Two comes down, and the approach packed flatter */
const WIND=[.8,.6];
function duneProf(u){const f=u-Math.floor(u);return f<.72?sstep(0,.72,f):1-sstep(.72,1,f);}
function duneBase(x,z,rr){return Math.max(0,(rr-WR-30)*.02)*sstep(WR+20,WR+200,rr)+3.5*fbm(x*.006,z*.006)*sstep(WR+40,WR+300,rr);}
let _appFlat=null;
function appDist(x,z){if(!_appFlat){_appFlat=[];for(let i=0;i<APPROACH.length-1;i++)_appFlat.push([...APPROACH[i],...APPROACH[i+1]]);}
  let d=1e9;for(const [ax,az,bx,bz] of _appFlat)d=Math.min(d,segDist(x,z,ax,az,bx,bz));return d;}
function appFlat(x,z){return 1-.7*(1-sstep(24,70,appDist(x,z)));}
/* Nov 17 (Bryce: "it is just flat ground"): the land either side of the approach rises into low hills and rock-backed rises, so the
   way down from the ridge runs along a broad shallow valley instead of a ruler-flat plain; the walk itself only rolls a little */
function reliefY(x,z,rr){const d=appDist(x,z),k=sstep(20,110,d)*sstep(WR+WT+10,WR+90,rr);
  const roll=3.2*(vnoise(x*.016+4,z*.016-3)-.5)*sstep(WR+WT+10,WR+60,rr);
  const hills=k*(70*Math.max(0,fbm(x*.004+9,z*.004-4)-.36)+22*ridged(x*.006+2,z*.006+7)*sstep(50,200,d));
  return roll+hills;}
function duneY(x,z){const rr=Math.hypot(x,z),d=rr-WR-WT,base=duneBase(x,z,rr);
  const mk=Math.hypot(x-MESA.x,z-MESA.z),mesa=MESA.h*(1-sstep(MESA.r0,MESA.r1,mk))*(.92+.08*vnoise(x*.03,z*.03));
  if(d<40)return base+mesa;
  const a=x*WIND[0]+z*WIND[1],b=-x*WIND[1]+z*WIND[0],wp=fbm(x*.004+5,z*.004-2)*90,fl=appFlat(x,z);
  const m1=duneProf((a+wp+18*Math.sin(b*.011))/140)*(.45+.75*vnoise(b*.012+3,a*.004))*9*sstep(40,300,d)*fl*sstep(MESA.r0,MESA.r1,mk);
  const m2=d<350?0:duneProf((a*.93+wp*2.2+60*Math.sin(b*.0042))/520)*(.5+.6*vnoise(b*.003,a*.002+9))*34*sstep(350,1400,d)*fl*sstep(MESA.r0,MESA.r1*1.4,mk);
  const far=d<1300?0:ridged(x*.0011,z*.0011)*70*sstep(1300,2600,d);
  return base+Math.max(m1+m2,0)+far+mesa+reliefY(x,z,rr)*sstep(MESA.r0,MESA.r1,mk);}
/* ---------- the regions ---------- */
const terrainY=(x,z)=>duneY(x,z);
// a polyline region: points [x,z,y,hw]; the floor is the nearest segment's, interpolated along it
function polyRegion(P,yf){const S=[];for(let i=0;i<P.length-1;i++){const [ax,az,ay,ah]=P[i],[bx,bz,by,bh]=P[i+1];S.push({ax,az,ay,ah,bx,bz,by,bh,l2:(bx-ax)**2+(bz-az)**2});}
  return{S,q(x,z){let bd=1e9,by=0;for(const s of S){const dx=s.bx-s.ax,dz=s.bz-s.az,t=s.l2<1e-9?0:clamp(((x-s.ax)*dx+(z-s.az)*dz)/s.l2,0,1),d=Math.hypot(x-s.ax-dx*t,z-s.az-dz*t)-lerp(s.ah,s.bh,t);
      if(d<bd){bd=d;by=yf?yf(x,z):lerp(s.ay,s.by,t);}}return{d:bd,y:by};}};}
const _R={d:1e9,y:0,r:null};
const REGIONS=[];
function region(name,f,o){const R=Object.assign({name,f},o||{});REGIONS.push(R);return R;}
const R_TRENCH=region('trench',(()=>{const ty=terrainY(CUL_T.x,CUL_T.z);const P=polyRegion([[CUL_T.x,CUL_T.z,ty,6],[CUL_O.x,CUL_O.z,-10,4.6]]);return(x,z)=>P.q(x,z);})());
// the desert you can walk: a wide band along the approach and the ridge top (the trench is cut out of it: its sides are walls)
const R_APP=region('approach',(()=>{const P=polyRegion(APPROACH.map(([x,z])=>[x,z,0,26]),terrainY);return(x,z)=>{const q=P.q(x,z);const c=Math.hypot(x-CRASH.x,z-CRASH.z)-CRASH.r-14;if(c<q.d){q.d=c;q.y=terrainY(x,z);}
  const t=R_TRENCH.f(x,z);if(t.d<1&&t.y<terrainY(x,z)-.4)q.d=Math.max(q.d,-t.d+.3);return q;};})());
const R_UND=region('undercroft',(()=>{const P=polyRegion(UND);return(x,z)=>{const q=P.q(x,z);for(const H of HALLS){const d=Math.hypot(x-H.x,z-H.z)-H.r;if(d<q.d){q.d=d;q.y=H.y;}}
  // the pit: only the bridges cross it (the walk is 3.2 m half-width there; the halls' rims stop short of it)
  return q;};})(),{under:true});
const R_STREET=region('streets',(()=>{const P=polyRegion(STREETS.map(([x,z,y,hw])=>[x,z,y,hw]));return(x,z)=>P.q(x,z);})());
const R_PLAZA=region('plaza',(x,z)=>{const {u,v}=plzUV(x,z);return{d:Math.max(-u,u-102,Math.abs(v)-plzHW(u)),y:plzY(u,v)};});
function towerRamp(T){return(x,z)=>{const r=Math.hypot(x-T.x,z-T.z),a=rampA(T,x,z),da=a<=T.a0&&a>=T.a1?-Math.min(T.a0-a,a-T.a1):Math.min(Math.abs(a-T.a0),Math.abs(a-T.a1),Math.abs(a+TAU-T.a1));return{d:Math.max(Math.abs(r-T.rr)-T.rw,da*T.rr),y:rampY(T,clamp(a,T.a1,T.a0))};};}
const R_RAMPA=region('rampA',towerRamp(TOWA)),R_RAMPB=region('rampB',towerRamp(TOWB));
const R_SKY=region('skybridge',(x,z)=>({d:segDist(x,z,SKY_A.x,SKY_A.z,SKY_B.x,SKY_B.z)-3.2,y:TOWA.y1}));
const R_BRIDGE=region('bridge',(x,z)=>({d:segDist(x,z,BR_B.x,BR_B.z,BR_G.x,BR_G.z)-3.2,y:GAL.y}));
const R_GAL=region('gallery',(x,z)=>{const r=Math.hypot(x,z);return{d:Math.max(GAL.r0-r,r-GAL.r1),y:GAL.y};});
const R_HALL=region('hall',(x,z)=>({d:Math.max(Math.abs(x)-HALL.hw,HALL.z0-z,z-HALL.z1),y:HALL.y}),{roof:HALL.y+11});
function sector(o){return(x,z)=>{const r=Math.hypot(x,z),a=thetaOf(x,z),r0=o.r0f?o.r0f(a):o.r0,r1=o.r1f?o.r1f(a):o.r1;return{d:Math.max(r0-r,r-r1,angOff(a,o.a0,o.a1)*r),y:typeof o.y==='function'?o.y(a):o.y};};}
const R_LOWB=region('lowBalcony',sector({r0:BAL.r0,r1:linerR(LOWB.y)-.6,a0:LOWB.a0,a1:LOWB.a1,y:LOWB.y}));
const R_STAIR=region('stair',sector({r0f:stairR0,r1f:stairR1,a0:STAIR.a0,a1:STAIR.a1,y:stairY}));
const R_UPB=region('upBalcony',sector({r0:BAL.r0,r1:linerR(UPB.y)-.6,a0:UPB.a0,a1:UPB.a1,y:UPB.y}));
const R_CAR=region('lift',(()=>{const f=sector({r0:CAR.r0,r1:CAR.r1,a0:CAR.a0,a1:CAR.a1,y:0});return(x,z)=>{const q=f(x,z);q.y=ELEV.y;return q;};})());
const R_DOME=region('domeRoom',(x,z)=>({d:DOMEROOM.open?Math.hypot(x,z)-CR:1e3,y:TOPY}));
// (each region's footprint box, measured once by sampling: a region can't be nearer than its box, so far ones are skipped)
for(const R of REGIONS)R.bb=null;
{const was=DOMEROOM.open;DOMEROOM.open=true;for(let x=-320;x<=320;x+=3)for(let z=-200;z<=1140;z+=3)for(const R of REGIONS){if(R.f(x,z).d<3){const b=R.bb||(R.bb=[x,z,x,z]);if(x<b[0])b[0]=x;if(z<b[1])b[1]=z;if(x>b[2])b[2]=x;if(z>b[3])b[3]=z;}}
 DOMEROOM.open=was;for(const R of REGIONS)if(R.bb){R.bb[0]-=4;R.bb[1]-=4;R.bb[2]+=4;R.bb[3]+=4;}}
let _rqx=NaN,_rqz=NaN,_rqv=-1;const _RQ={d:0,y:0,r:null};let REGION_V=0;   // (a one-point memo: the same spot is asked for many times a frame)
function regionAt(x,z){if(x===_rqx&&z===_rqz&&_rqv===REGION_V+ELEV.y*1e-3+(DOMEROOM.open?1e6:0)){_R.d=_RQ.d;_R.y=_RQ.y;_R.r=_RQ.r;return _R;}
  _R.d=1e9;_R.r=null;for(const R of REGIONS){const b=R.bb;if(b){const dx=Math.max(b[0]-x,0,x-b[2]),dz=Math.max(b[1]-z,0,z-b[3]),lb=dx>0||dz>0?Math.hypot(dx,dz):-1e9;if(lb>=_R.d)continue;}
    const q=R.f(x,z);if(q.d<_R.d){_R.d=q.d;_R.y=q.y;_R.r=R;}}
  _rqx=x;_rqz=z;_rqv=REGION_V+ELEV.y*1e-3+(DOMEROOM.open?1e6:0);_RQ.d=_R.d;_RQ.y=_R.y;_RQ.r=_R.r;return _R;}

/* ---------- the walk: one line through it all (3D: x, y, z), s in metres along it ---------- */
const ROAD3=(()=>{const P=[];const add=(x,z,y,hw,tag)=>{P.push({x,z,y,hw,tag});};
  APPROACH.forEach(([x,z],i)=>add(x,z,terrainY(x,z),i===0?20:14,i===0?'crash':null));
  add(CUL_O.x,CUL_O.z,-10,4,'culvert');
  for(let i=1;i<UND.length-1;i++){const [x,z,y,hw]=UND[i];add(x,z,y,i===4||i===9?11:Math.min(hw,5),i===4?'cistern':i===9?'vault':null);}
  for(const [x,z,y,hw,tag] of STREETS)add(x,z,y,Math.min(hw,9),tag);
  {const p=plzXZ(-1,0);add(p.x,p.z,0,10,'plaza');}
  for(const [u,v] of[[4,20],[24,20],[30,-20],[48,-20],[54,0],[72,0],[100,0]]){const p=plzXZ(u,v);add(p.x,p.z,plzY(u,v),u>90?10:14);}
  {const n=22;for(let k=0;k<=n;k++){const a=lerp(TOWA.a0,TOWA.a1,k/n),p=ringPt(TOWA.x,TOWA.z,a,TOWA.rr);add(p.x,p.z,rampY(TOWA,a),TOWA.rw,k===0?'rampA':k===n?'skyA':null);}}
  {const n=22;for(let k=0;k<=n;k++){const a=lerp(TOWB.a0,TOWB.a1,k/n),p=ringPt(TOWB.x,TOWB.z,a,TOWB.rr);add(p.x,p.z,rampY(TOWB,a),TOWB.rw,k===0?'skyB':k===n?'bridgeB':null);}}
  add(BR_G.x,BR_G.z,GAL.y,3,'gallery');
  {const a0=BR_TH,a1=TAU,n=6;for(let k=1;k<=n;k++){const p=spiralPt(lerp(a0,a1,k/n),72);add(p.x,p.z,GAL.y,3.2,k===n?'door':null);}}
  add(0,HALL.z0+1.5,HALL.y,4.4,'hallIn');
  {const n=8;for(let k=1;k<=n;k++){const a=lerp(0,STAIR.a0+3*DEG,k/n),p=spiralPt(a,lerp(46,linerR(62)-5.4,k/n));add(p.x,p.z,LOWB.y,k===n?4.2:9,k===n?'balconyEnd':null);}}
  {const n=36;for(let k=0;k<=n;k++){const a=lerp(STAIR.a0+5*DEG,STAIR.a1-3*DEG,k/n),p=spiralPt(a,stairR1(a)-STAIR.w/2);add(p.x,p.z,stairY(a),4.2,k===0?'stair':k===n?'stairTop':null);}}
  {const p=spiralPt(281*DEG,38);add(p.x,p.z,UPB.y,5,'upBalcony');}
  {const a=(CAR.a0+CAR.a1)/2,p=spiralPt(a,33.8);add(p.x,p.z,CAR.y0,3.2,'liftDown');add(p.x,p.z,CAR.y1,3.2,'liftUp');}
  add(-CR+3,0,TOPY,6,'domeIn');add(-1.5,0,TOPY,8,'socket');
  return P;})();
const ROAD=ROAD3.map(p=>[p.x,p.z]);
const ROADS=[],ROAD_LEN=(()=>{let s=0;for(let i=0;i<ROAD3.length-1;i++){const a=ROAD3[i],b=ROAD3[i+1],lp=Math.hypot(b.x-a.x,b.z-a.z),l=Math.hypot(lp,b.y-a.y);
  ROADS.push({ax:a.x,az:a.z,bx:b.x,bz:b.z,ay:a.y,by:b.y,ah:a.hw,bh:b.hw,l,lp,s0:s,nx:lp>1e-6?-(b.z-a.z)/lp:0,nz:lp>1e-6?(b.x-a.x)/lp:0});s+=l;}return s;})();
const S_AT={};{let s=0;for(let i=0;i<ROAD3.length;i++){if(ROAD3[i].tag)S_AT[ROAD3[i].tag]=s;if(i<ROADS.length)s+=ROADS[i].l;}}
// each region's stretch of the walk (so a point is measured against its own part of the line, never the part over or under it)
for(const R of REGIONS)R.sr=null;
{const near=(R,x,z)=>R.f(x,z).d<1.5;for(const r of ROADS){const mx=(r.ax+r.bx)/2,mz=(r.az+r.bz)/2;
   for(const R of REGIONS){if(R===R_DOME&&!DOMEROOM.open){if(Math.hypot(mx,mz)<CR&&Math.abs(r.ay-TOPY)<2){R.sr=R.sr||[1e9,-1e9];R.sr[0]=Math.min(R.sr[0],r.s0);R.sr[1]=Math.max(R.sr[1],r.s0+r.l);}continue;}
     const q=R.f(mx,mz);if(q.d<1.5&&Math.abs(q.y-(r.ay+r.by)/2)<3){R.sr=R.sr||[1e9,-1e9];R.sr[0]=Math.min(R.sr[0],r.s0);R.sr[1]=Math.max(R.sr[1],r.s0+r.l);}}}}
R_CAR.sr=[S_AT.liftDown,S_AT.liftUp];
function roadSeg(x,z,lo,hi){let best=1e9,bs=0,bt=0,br=ROADS[0];lo=lo==null?-1e9:lo;hi=hi==null?1e9:hi;
  for(const r of ROADS){if(r.lp<.5||r.s0+r.l<lo||r.s0>hi)continue;const dx=r.bx-r.ax,dz=r.bz-r.az,t=clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.lp*r.lp),0,1),d=Math.hypot(x-r.ax-dx*t,z-r.az-dz*t);
    if(d<best){best=d;bs=r.s0+t*r.l;bt=t;br=r;}}return{s:bs,r:br,t:bt,d:best};}
function roadQ(x,z){const R=regionAt(x,z).r;if(R===R_CAR&&_R.d<1)return{s:S_AT.liftDown+(ELEV.y-CAR.y0),r:ROADS.find(r=>r.s0>=S_AT.liftDown-1)||ROADS[0],t:0,d:0};
  if(R&&R.sr&&_R.d<2)return roadSeg(x,z,R.sr[0]-3,R.sr[1]+3);return roadSeg(x,z);}
function roadS(x,z){return roadQ(x,z).s;}
const _rp=new THREE.Vector3();
function roadPt(s,out){s=clamp(s,0,ROAD_LEN);out=out||_rp;for(const r of ROADS)if(s<=r.s0+r.l){const t=r.l>0?(s-r.s0)/r.l:0;return out.set(r.ax+(r.bx-r.ax)*t,0,r.az+(r.bz-r.az)*t);}const e=ROAD3[ROAD3.length-1];return out.set(e.x,0,e.z);}
function roadY(s){s=clamp(s,0,ROAD_LEN);for(const r of ROADS)if(s<=r.s0+r.l){const t=r.l>0?(s-r.s0)/r.l:0;return lerp(r.ay,r.by,t);}return TOPY;}
function roadN(s){let nx=0,nz=0;for(const r of ROADS){if(r.lp<.5)continue;const k=clamp(1-Math.max(0,Math.max(r.s0-s,s-(r.s0+r.l)))/6,0,1);nx+=r.nx*k;nz+=r.nz*k;}const l=Math.hypot(nx,nz);if(l<1e-6)return{x:1,z:0};return{x:nx/l,z:nz/l};}
function latOf(x,z){const q=roadQ(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t;return(x-px)*r.nx+(z-pz)*r.nz;}
const SPINE_S0=-1e6,SPINE_S1=-1e6,GAPS=[],GAP_HALF=0,LANE=0;
function laneC(s){return 0;}
function spineAt(s){return false;}
function laneHalf(s){s=clamp(s,0,ROAD_LEN);for(const r of ROADS)if(s<=r.s0+r.l){const t=r.l>0?(s-r.s0)/r.l:0;return lerp(r.ah,r.bh,t);}return 6;}
const BARRIERS=[];
function barrier(id){return null;}
function inTower(x,z,m){return Math.hypot(x,z)<TW.r+(m||0);}
const TW_OUT=TW.r+4.6;

/* buildings (circles, and turned boxes) that stand in or over the walkable places: solid to walking (playD) */
const SOLIDS=[],SG={};const SGC=40;
function addSolid(o){o.R=o.e?Math.max(o.a,o.b):o.r;SOLIDS.push(o);const x0=Math.floor((o.x-o.R)/SGC),x1=Math.floor((o.x+o.R)/SGC),z0=Math.floor((o.z-o.R)/SGC),z1=Math.floor((o.z+o.R)/SGC);
  for(let i=x0;i<=x1;i++)for(let j=z0;j<=z1;j++)(SG[i+','+j]||(SG[i+','+j]=[])).push(o);}
const _sq={s:1e9,h:0};
function solidAt(x,z){_sq.s=1e9;_sq.h=0;const L=SG[Math.floor(x/SGC)+','+Math.floor(z/SGC)];if(!L)return _sq;
  for(const o of L){let d;if(o.e){const dx=x-o.x,dz=z-o.z,lx=dx*o.c-dz*o.sn,lz=dx*o.sn+dz*o.c,k=Math.hypot(lx/o.a,lz/o.b);d=(k-1)*Math.min(o.a,o.b);}else d=Math.hypot(x-o.x,z-o.z)-o.r;
    if(d<_sq.s){_sq.s=d;_sq.h=o.h;}}return _sq;}
const BLOCKS=[];
// distance outside the walkable area (negative inside)
function playD(x,z){let d=regionAt(x,z).d;
  if(d<0){const q=solidAt(x,z);if(q.s<0)d=Math.max(d,-q.s);}
  for(const B of BLOCKS)d=Math.max(d,B.r-Math.hypot(x-B.x,z-B.z));
  return d;}
function floorAt(x,z){const q=regionAt(x,z);return q.d<1.5?q.y:meshY(x,z);}   // (off the walk: the drawn ground, for props)
/* outside the walk: what a shot or a sight line meets. Under the outer district, rock (the undercroft's walls); the open shaft and
   the chasm, air; the tower's walls and the buildings, their height; outside the wall, the desert */
function groundY(x,z){const q=regionAt(x,z);
  if(q.d<=0){const s=solidAt(x,z);return s.s<0?q.y+s.h:q.y;}
  const R=q.r,rr=Math.hypot(x,z);
  if(R===R_UND&&q.d<16)return q.y+40;                                   // rock round the passages
  if(R&&(R===R_LOWB||R===R_STAIR||R===R_UPB||R===R_CAR||R===R_HALL||R===R_DOME)){if(rr>linerR(q.y)-.2&&rr<GAL.r0-.4)return TW.h;if(q.d<.8)return q.y;return CHASM.y;}
  if(rr<GAL.r0)return rr>48?TW.h:CHASM.y;
  if(rr<CHASM.r0&&rr>GAL.r1)return 24;                                  // the tower's plinth
  if(rr>CHASM.r0&&rr<CHASM.r1)return CHASM.y;
  if(rr>WR+WT+2)return duneY(x,z);
  if(rr>WR-1.5)return WH;
  const s=solidAt(x,z);if(s.s<0)return s.h;
  return 0;}
// the drawn ground: the paving, the plaza's tiers, the sunken stair court, the trench, the chasm, the desert outside
function meshY(x,z){const rr=Math.hypot(x,z);
  if(rr>WR-WT-2){const t=R_TRENCH.f(x,z);if(t.d<1)return Math.min(duneY(x,z),t.y-(t.d>0?0:.05));if(t.d<3.4&&rr>WR+WT+1)return Math.min(duneY(x,z),t.y-.05);return duneY(x,z);}
  if(rr>CHASM.r0-2&&rr<CHASM.r1+2)return Math.abs(x)<15&&z>0?0:CHASM.y;   // (the causeway crosses it on the south)
  if(openCourt(x,z))return Math.min(0,R_UND.f(x,z).y);
  return 0;}
// the sunken stair court at the end of the undercroft (open to the sky)
function openCourt(x,z){let d=1e9;for(let i=UND_OPEN;i<UND.length-1;i++){const [ax,az,,ah]=UND[i],[bx,bz,,bh]=UND[i+1];d=Math.min(d,segDist(x,z,ax,az,bx,bz)-Math.max(ah,bh)-1.5);}return d<0;}
// the camera's roof: the undercroft (except its open stair court), the door's hall
function ceilAt(x,z){const q=regionAt(x,z);if(q.r===R_UND&&!openCourt(x,z)){for(const H of HALLS)if(Math.hypot(x-H.x,z-H.z)<H.r+.5)return H.y+13;return q.y+8.4;}
  if(q.r===R_TRENCH&&Math.hypot(x,z)<WR+WT+.5)return q.y+8.4;
  if(q.r===R_HALL)return HALL.y+10.5;if(q.r===R_STREET&&arcadeD(x,z)<6)return 8.2;return 1e4;}
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
/* Oct 27 (Bryce: Metal020 "for the white colour in the white city, not the whole thing but around the places", all three: rust bleeding
   from the wrecks, scorch round the fires, and stains scattered over the city's ground outside the buildings). WARMAP is a top-down map
   of the city, 1080 m square, ~2 m a pixel: red = rust, green = soot. It is painted once the wrecks and fires are placed (paintWarMap,
   below). The ground reads it everywhere inside the wall (not in the tower); the white stone reads it on its lowest few metres only, so
   the towers above stay clean. Where it is strong the surface takes Metal020's colour (its pale steel and its rust), matched to the
   stone's brightness so it stains rather than darkens; soot darkens. One texture read, nothing moved. */
const WARMAP=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=512;const t=new THREE.CanvasTexture(cv);t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;
  const r=TEXL.load('img/tex/metal020-'+TSUF+'.jpg');r.wrapS=r.wrapT=THREE.RepeatWrapping;r.anisotropy=coarse?2:8;return{cv,tex:t,rust:r,size:1080,hulks:[]};})();
const WAR_GLSL=`uniform sampler2D tWar,tRust;
vec3 warStain(vec3 base,vec3 wp,float k){vec4 dm=texture2D(tWar,vec2(wp.x/1080.0+.5,.5-wp.z/1080.0));   // (the canvas counts rows from the top)
  vec3 rc=pow(texture2D(tRust,wp.xz*.11).rgb,vec3(2.2)),rc2=pow(texture2D(tRust,wp.xz*.037+.31).rgb,vec3(2.2));rc=mix(rc,rc2,.45);
  float sat=max(rc.r-rc.b,0.0);                                                     // how rusty this texel is
  float rk=clamp(dm.r*k*1.9+(sat-.05)*2.2*dm.r*k-.1,0.0,1.0);                         // ragged edges: the rust spots lead
  vec3 st=rc*(dot(base,vec3(.33))/max(.04,dot(rc,vec3(.33))))*mix(1.0,.62,clamp(sat*3.0,0.0,1.0));   // Metal020 at the stone's brightness, its rust darker
  st*=mix(vec3(1.0),vec3(1.06,.74,.52),.38+.62*clamp(sat*3.0,0.0,1.0));                // rust brown through the whole stain, deepest on the spots
  base=mix(base,st,rk);
  float so=clamp(dm.g*k*1.7-.06+(dot(rc2,vec3(.33))-.4)*.6*dm.g,0.0,1.0);base*=1.0-so*.8;
  return base;}
`;
function whiteMat(o){o=o||{};const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:o.rough||.32,metalness:.05,emissive:C(0xc89a44),emissiveIntensity:o.em==null?.06:o.em,side:o.side||THREE.FrontSide});
  m.onBeforeCompile=sh=>{sh.uniforms.uWake=CITY.wake;sh.uniforms.uT=CITY.t;
    sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.uniforms.tWar={value:WARMAP.tex};sh.uniforms.tRust={value:WARMAP.rust};sh.uniforms.tGrain={value:TX.rock};
    sh.fragmentShader='uniform float uWake,uT;uniform sampler2D tGrain;varying vec3 vWP;varying vec3 vWN;\n'+WAR_GLSL+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      // (Nov 9) the stone's grain: the rock photo laid on from three sides, greyed and soft, so the white has a surface up close
      {vec3 bw=pow(abs(normalize(vWN)),vec3(4.0));bw/=(bw.x+bw.y+bw.z);vec3 gr=pow(texture2D(tGrain,vWP.zy*.07).rgb,vec3(2.2))*bw.x+pow(texture2D(tGrain,vWP.xz*.07).rgb,vec3(2.2))*bw.y+pow(texture2D(tGrain,vWP.xy*.07).rgb,vec3(2.2))*bw.z;
       float gl=dot(gr,vec3(.33));float fd=1.0-smoothstep(30.0,140.0,length(vWP-cameraPosition));diffuseColor.rgb*=mix(1.0,clamp(.7+gl*2.0,.6,1.25),.45*fd+.12);}
      diffuseColor.rgb=warStain(diffuseColor.rgb,vWP,1.0-smoothstep(.5,4.5,vWP.y));   // the war's marks, low on the stone only`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      // a soft gradient up the stone, and a pulse of light climbing it when the city wakes
      float hk=clamp(vWP.y/160.0,0.0,1.0);totalEmissiveRadiance*=(.75+.5*hk);
      // the gold undertone (Bryce, Oct 22): richest low down and where the stone turns away from the light
      float lowK=1.0-smoothstep(0.0,60.0,vWP.y);float turn=1.0-clamp(dot(normalize(vWN),vec3(-.55,.62,-.3)),0.0,1.0);
      totalEmissiveRadiance+=vec3(.62,.42,.12)*(.03+.05*lowK)*(.5+.5*turn);
      diffuseColor.rgb*=mix(vec3(1.0),vec3(1.0,.93,.78),.1*turn+.05*lowK);
      float wv=uWake*(.5+.5*sin(vWP.y*.06-uT*1.6));totalEmissiveRadiance+=vec3(.55,.66,.9)*wv*.12;`);};
  return m;}
const stoneMat=whiteMat();
const stoneInMat=whiteMat({em:.05,rough:.3,side:THREE.DoubleSide});
const goldMat=new THREE.MeshBasicMaterial({vertexColors:true,color:C(0xffcf7a),toneMapped:false});
const groundMat=(()=>{const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.08,emissive:C(0xb08840),emissiveIntensity:.03});
  m.onBeforeCompile=sh=>{sh.uniforms.uWake=CITY.wake;sh.uniforms.uT=CITY.t;sh.uniforms.tS={value:TX.sand};sh.uniforms.tWar={value:WARMAP.tex};sh.uniforms.tRust={value:WARMAP.rust};
    sh.vertexShader='varying vec3 vWP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='uniform float uWake,uT;uniform sampler2D tS;varying vec3 vWP;\nfloat h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+WAR_GLSL+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      // Nov 17 (Bryce: going down the under path "the texture glitches and it makes it look like it's a solid while you're walking
      // through"): the desert's triangles bridged the cut of the trench and the drain's mouth, so slabs of sand hung across the way.
      // Inside the cut, anything of the ground above the cut's own floor isn't drawn
      {vec2 ta=vec2(${CUL_T.x.toFixed(2)},${CUL_T.z.toFixed(2)}),tb=vec2(${ringPt(0,0,CUL.a,WR-1).x.toFixed(2)},${ringPt(0,0,CUL.a,WR-1).z.toFixed(2)});vec2 td=tb-ta;float tl=length(td);td/=tl;
       vec2 rp=vWP.xz-ta;float tu=dot(rp,td),tlat=abs(rp.x*td.y-rp.y*td.x);float tO=${Math.hypot(CUL_O.x-CUL_T.x,CUL_O.z-CUL_T.z).toFixed(2)};
       float tf=tu<tO?mix(${terrainY(CUL_T.x,CUL_T.z).toFixed(2)},-10.0,clamp(tu/tO,0.0,1.0)):-10.5;
       if(tu>-1.0&&tu<tl&&tlat<7.3&&vWP.y>tf+.35)discard;}
      float city=1.0-smoothstep(${(WR-WT-4).toFixed(1)},${(WR+10).toFixed(1)},length(vWP.xz));
      vec2 q=vWP.xz/3.0;vec2 f=abs(fract(q)-.5);float seam=smoothstep(.47,.5,max(f.x,f.y));
      float slab=h21(floor(q));float inT=1.0-smoothstep(68.0,72.0,length(vWP.xz));
      diffuseColor.rgb*=mix(1.0,(.5+.16*slab)*(1.0-seam*.55)*(1.0-.22*inT),city);
      diffuseColor.rgb=warStain(diffuseColor.rgb,vWP,city*(1.0-inT));   // the war's marks on the paving (WARMAP)
      // the desert outside the walls (Oct 24): Bryce's sand at two scales, so the plain under the opening flight isn't one flat colour
      vec3 sd=pow(texture2D(tS,vWP.xz*.03).rgb,vec3(2.2))*.55+pow(texture2D(tS,vWP.xz*.0031).rgb,vec3(2.2))*.45;diffuseColor.rgb*=mix(vec3(1.0),sd*2.4,1.0-city);
      // Oct 27: wind ripples up close (fading out before they shimmer), long streaks along the wind further out
      vec2 rW=vec2(.8,.6);float ra=dot(vWP.xz,rW),rb=dot(vWP.xz,vec2(-.6,.8));float rph=ra*7.0+sin(rb*.9)*1.6+sin(rb*.23+ra*.5)*3.0;
      float rcd=length(vWP-cameraPosition),rk=(1.0-city)*(1.0-smoothstep(18.0,80.0,rcd));
      diffuseColor.rgb*=mix(1.0,1.0+.08*sin(rph),rk);
      float strk=pow(texture2D(tS,vec2(ra*.0015,rb*.03)).r,1.5);diffuseColor.rgb*=mix(1.0,.86+.3*strk,(1.0-city)*smoothstep(30.0,200.0,rcd));
      float gl=smoothstep(.975,1.0,abs(sin(length(vWP.xz)*.13)))*city*step(vWP.y,2.0)*step(80.0,length(vWP.xz));`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      totalEmissiveRadiance+=vec3(1.0,.72,.28)*gl*(.45+uWake*1.2);totalEmissiveRadiance*=city+.1;`).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      {vec3 rn=vec3(rW.x,0.0,rW.y)*cos(rph)*.2*rk;normal=normalize(normal-(viewMatrix*vec4(rn,0.0)).xyz);}`).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=mix(roughnessFactor,.92,1.0-city);   // sand is matte (the paving keeps its sheen)`).replace('#include <fog_fragment>',`#include <fog_fragment>
      #ifdef USE_FOG
      // haze lying in the dunes: thicker low down and with distance, drifting slowly
      float hd=length(vWP.xz-cameraPosition.xz),mist=(1.0-city)*smoothstep(90.0,900.0,hd)*exp(-max(vWP.y-1.0,0.0)/16.0)*(.6+.4*sin(vWP.x*.004+uT*.05)*sin(vWP.z*.005-uT*.04));
      gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor*1.1,clamp(mist*.75,0.0,.8));
      #endif`);};return m;})();
const hostMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.55,metalness:.6});
const purpleGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:C(FLEET_PURPLE).multiplyScalar(1.1),toneMapped:false});
const HOST_GLOW=FLEET_PURPLE;
const K_W=C(0xf7f3ea),K_W2=C(0xeee6d4),K_GOLD=new THREE.Color(1,1,1);   // (gold's colour is goldMat's)
/* ---------- the ground: one mesh, fine over the approach, the trench, the plaza and the stair court; coarse over the rest ---------- */
{const steps=(a,b,fine,lo,hi,cs)=>{const o=[];let v=a;while(v<b){o.push(v);v+=(v>=lo&&v<hi)?fine:(Math.abs(v)>1500?cs*3:Math.abs(v)>WR+40?cs*.9:cs);}o.push(b);return o;};
 const f=coarse?4.6:3.2,xs=steps(-3000,3000,f,-250,270,coarse?16:12),zs=steps(-2400,3800,f,170,1130,coarse?16:12);
 const NX=xs.length,NZ=zs.length,pos=new Float32Array(NX*NZ*3),col=new Float32Array(NX*NZ*3),pale=C(0xf0eadc),sand=C(0x7a4630),crest=C(0xa8704a),slip=C(0x4a2418),abyss=C(0x1a1a24),tmp=new THREE.Color(),tmp2=new THREE.Color();
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=xs[i],z=zs[j],k=(j*NX+i)*3,y=meshY(x,z);pos[k]=x;pos[k+1]=y;pos[k+2]=z;
   const rr=Math.hypot(x,z),o=sstep(WR-WT-6,WR+30,rr);
   if(o>0){const e=4,sl=(duneY(x+WIND[0]*e,z+WIND[1]*e)-duneY(x-WIND[0]*e,z-WIND[1]*e))/(2*e),hk=clamp((y-duneBase(x,z,rr))/30,0,1);
     tmp2.copy(sand).lerp(crest,clamp(.35+sl*1.6+hk*.5,0,1)).lerp(slip,clamp(-sl*1.4-.15,0,.8)).multiplyScalar(.85+.25*vnoise(x*.004+11,z*.004));}
   tmp.copy(pale).lerp(o>0?tmp2:sand,o).multiplyScalar(.9+.12*vnoise(x*.05,z*.05));if(y<-20)tmp.lerp(abyss,clamp((-y-20)/30,0,1));col[k]=tmp.r;col[k+1]=tmp.g;col[k+2]=tmp.b;}
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
/* Oct 27 (Bryce: war damage in Metal020, the rusted steel): the wreckage wears it now (wreckMat below), lighter tints so the rust shows
   through the burn, and each hulk is torn wreckage, not one tilted block: a bent plate peeling off one side, a broken strut across it,
   shards on the paving. The extra pieces take their shapes from a hash of where the hulk stands, not from R(), so the level's random
   sequence, and with it where everything else in the city stands, is exactly what it was. Broken white stone (K_W, K_W2) goes in with
   the stone, not the rust. */
const K_BURN=C(0xa8988e),K_HER=C(0xc0806e);
const hh=(x,z,k)=>{const v=Math.sin(x*12.9898+z*78.233+k*37.719)*43758.5453;return v-Math.floor(v);};
function hulk(x,z,w,h,d,ry,col,obst){const y=floorAt(x,z),stone=col===K_W2||col===K_W,cc=col||K_BURN;if(!stone)WARMAP.hulks.push({x,z,r:Math.max(w,d)});
  (stone?sm:wm).add(boxUV(w,h,d,3),M(x,y+h*.35,z,R(-.12,.12),ry,R(-.18,.18)),cc);
  if(!stone){const c=Math.cos(ry),sn=Math.sin(ry),sd=hh(x,z,1)<.5?-1:1,k2=hh(x,z,2),k3=hh(x,z,3);
    wm.add(boxUV(.2,h*1.1,d*.8,2),M(x+c*sd*(w*.5+.3),y+h*.45,z-sn*sd*(w*.5+.3),0,ry,sd*(.3+k2*.3)),cc);                 // the bent plate
    wm.add(boxUV(.28,.28,d*1.15+1,2),M(x-c*sd*w*.2,y+h*.8,z+sn*sd*w*.2,.2+k3*.3,ry+.5*(k2-.5),0),C(0x5a4a40));          // a broken strut
    for(let i=0;i<3;i++){const a=hh(x,z,4+i)*6.283,r=Math.max(w,d)*.6+hh(x,z,8+i)*1.6,sx=x+Math.cos(a)*r,sz=z+Math.sin(a)*r;
      wm.add(boxUV(.9+hh(x,z,12+i),.12,.6+hh(x,z,15+i)*.6,1),M(sx,floorAt(sx,sz)+.07,sz,(hh(x,z,18+i)-.5)*.3,a,0),cc);}}   // shards
  if(obst!==false)OBST.push({x,z,r:Math.max(w,d)*.45,h:h*.8});}
// pillars and planters along the streets: round, tall, smooth (cover you can't shoot through)
function pillar(x,z,r,h){form(x,z,floorAt(x,z),h,r,r*.8,16,0,K_W,.04);OBST.push({x,z,r:r+.1,h});}
function k3(){return rng()<.5?K_HER:K_BURN;}
/* ---------- THE WALL: a ring of white stone, 110 m high. The round opening on the south is sealed now (Nov 16): its skin of light
   never opens, the landmark you see from the ridge. Buttresses round its foot and a lip along its top (the trailer's wall). South-west of
   the gate, under the wall, the drain the war broke open: a trench down to it and a dark arch in the wall's footing ---------- */
const WALL=(()=>{const G=new THREE.Group();scene.add(G);const N=96,gap=2;
  const m=new Merger(),gm=new Merger();
  for(let k=0;k<N;k++){const a=(k+.5)/N*Math.PI*2;if(Math.min(a,Math.PI*2-a)<(gap+.5)/N*Math.PI*2)continue;   // (a=0 is south)
    const x=Math.sin(a)*(WR+WT/2),z=Math.cos(a)*(WR+WT/2),w=2*Math.PI*(WR+WT)/N+.6;
    m.add(boxUV(w,WH,WT,6),M(x,WH/2,z,0,a,0),k%2?K_W:K_W2);
    gm.add(new THREE.BoxGeometry(w*.98,1.2,.5),M(Math.sin(a)*(WR-.2),WH-6,Math.cos(a)*(WR-.2),0,a,0),K_GOLD);gm.add(new THREE.BoxGeometry(w*.98,1.2,.5),M(Math.sin(a)*(WR+WT+.2),WH-6,Math.cos(a)*(WR+WT+.2),0,a,0),K_GOLD);
    if(k%4===0){gm.add(new THREE.BoxGeometry(1,WH*.8,.5),M(Math.sin(a)*(WR-.2),WH*.42,Math.cos(a)*(WR-.2),0,a,0),K_GOLD);}
    m.add(boxUV(w,3,1.4,2),M(Math.sin(a)*(WR+.7),WH+1.5,Math.cos(a)*(WR+.7),0,a,0),K_W2);}
  // the buttresses round the outside (the trailer's), skipping the gate and the drain
  {const bg=new THREE.LatheGeometry([[0,0],[1,0],[1,.08],[.7,.3],[.55,.92],[.8,1],[0,1]].map(([r,y])=>new THREE.Vector2(r,y*WH)),4).rotateY(Math.PI/4);
   for(let i=0;i<120;i++){const a=i/120*Math.PI*2,sa=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(sa)<.1||Math.abs(sa-CUL.a)<.05)continue;
     const q=new THREE.Matrix4().compose(new THREE.Vector3(Math.sin(a)*(WR+WT+2.5),0,Math.cos(a)*(WR+WT+2.5)),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,a,0)),new THREE.Vector3(6,1,5));m.add(bg,q,K_W2);}}
  m.add(new THREE.TorusGeometry(WR+WT+1,2.2,6,192).rotateX(Math.PI/2),M(0,WH+1,0),K_W);
  gm.add(new THREE.TorusGeometry(WR+WT+.4,.5,4,192).rotateX(Math.PI/2),M(0,WH-12,0),K_GOLD);
  // the gate block: a slab with a round hole, ringed in gold on both faces
  const gw=2*Math.PI*(WR+WT)/N*(gap*2+1)+2,sh=new THREE.Shape();sh.moveTo(-gw/2,0);sh.lineTo(gw/2,0);sh.lineTo(gw/2,WH);sh.lineTo(-gw/2,WH);sh.lineTo(-gw/2,0);
  const hole=new THREE.Path();hole.absarc(0,GATE.y,GATE.r,0,Math.PI*2,true);sh.holes.push(hole);
  const eg=new THREE.ExtrudeGeometry(sh,{depth:WT+6,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.2,bevelSegments:2,curveSegments:64});eg.translate(0,0,-(WT+6)/2);
  m.add(eg,M(0,0,WR+WT/2),K_W);
  for(const zz of[WR-3.4,WR+WT+3.4]){const tg=new THREE.TorusGeometry(GATE.r+1.8,1.2,10,96);gm.add(tg,M(0,GATE.y,zz),K_GOLD);
    for(let k=0;k<24;k++){const a=k/24*Math.PI*2;gm.add(new THREE.BoxGeometry(.35,4.5,.35),M(Math.cos(a)*(GATE.r+5),GATE.y+Math.sin(a)*(GATE.r+5),zz,0,0,a+Math.PI/2),K_GOLD);}}
  // the drain under the wall: a broken arch in the footing at the foot of the trench, and stone fallen round it
  {const a=CUL.a,o=CUL_O,ry=a;const fw=16,fh=12,sh2=new THREE.Shape();sh2.moveTo(-fw/2,0);sh2.lineTo(fw/2,0);sh2.lineTo(fw/2,fh);sh2.lineTo(-fw/2,fh);sh2.lineTo(-fw/2,0);
   const h2=new THREE.Path();h2.moveTo(-4.6,0);h2.lineTo(4.6,0);h2.lineTo(4.6,5.2);h2.absarc(0,5.2,4.6,0,Math.PI,false);h2.lineTo(-4.6,0);sh2.holes.push(h2);
   const fg=new THREE.ExtrudeGeometry(sh2,{depth:3,bevelEnabled:false,curveSegments:24});fg.translate(0,-10.4,-1.5);m.add(fg,M(o.x,0,o.z,0,ry,0),K_W2);
   for(let i=0;i<9;i++){const u=i/8-.5,p=ringPt(0,0,a+u*.03,WR+WT+R(1,5));m.add(boxUV(R(1.5,3.4),R(.8,2.2),R(1.4,3),2),M(p.x,R(-.4,.6),p.z,R(-.4,.4),R(0,3),R(-.4,.4)),K_W2);}}
  const wmesh=new THREE.Mesh(m.build(),stoneMat);wmesh.castShadow=wmesh.receiveShadow=true;G.add(wmesh);G.add(new THREE.Mesh(gm.build(),goldMat));
  // the skin across the opening: pale, rippling, sealed (Nov 16: it never opens now)
  const skinU={uT:{value:0},open:{value:0}};
  const skin=new THREE.Mesh(new THREE.CircleGeometry(GATE.r+.4,64),new THREE.ShaderMaterial({uniforms:skinU,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vU;void main(){vU=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vU;uniform float uT,open;void main(){float r=length(vU)/${(GATE.r+.4).toFixed(1)};if(r<open)discard;
      float rip=.5+.5*sin(r*26.0-uT*1.4);float edge=smoothstep(open,open+.05,r);
      vec3 c=mix(vec3(.75,.82,.95),vec3(1.0,.92,.75),rip*.4)*(.55+.3*rip);c+=vec3(1.0,.85,.5)*(1.0-smoothstep(open,open+.03,r))*step(.001,open)*3.0;
      gl_FragColor=vec4(c,(.75+.2*rip)*edge);}`}));
  skin.position.set(0,GATE.y,WR+WT/2);G.add(skin);
  return{G,skin,skinU,open:0};})();
FLY.push({x:0,z:0,r:TW.r+2,h:TW.h});

/* ---------- helpers for the walk's stone: a box laid along a segment (it pitches with the floor), a strip along a polyline ---------- */
const _gSAx=new THREE.Vector3(),_gSBx=new THREE.Vector3(),_gSDx=new THREE.Vector3(),_gSSx=new THREE.Vector3(),_gSUx=new THREE.Vector3();
function segBox(mg,a,b,w,h,lat,yOff,col,unit){_gSDx.set(b.x-a.x,b.y-a.y,b.z-a.z);const L=_gSDx.length();if(L<1e-3)return;_gSDx.multiplyScalar(1/L);
  _gSSx.set(_gSDx.z,0,-_gSDx.x).normalize();_gSUx.crossVectors(_gSDx,_gSSx).normalize();if(_gSUx.y<0){_gSUx.negate();_gSSx.negate();}
  const m=new THREE.Matrix4().makeBasis(_gSSx,_gSUx,_gSDx);m.setPosition((a.x+b.x)/2+_gSSx.x*(lat||0),(a.y+b.y)/2+(yOff||0),(a.z+b.z)/2+_gSSx.z*(lat||0));
  mg.add(boxUV(w,h,L+.05,unit||3),m,col||K_W2);}
const V3w=(x,y,z)=>new THREE.Vector3(x,y,z);
const K_UND=C(0x9c968c),K_UND2=C(0x8a857c),K_DARK=C(0x5a5650);
const um=new Merger(),ug=new Merger();   // the undercroft's stone (darker), its gold
const UNDL=[];                           // its lamps

/* ---------- THE TRENCH and THE UNDERCROFT ---------- */
{// the trench: a cut through the apron, its floor stepping down to the drain, walls of broken stone either side
 const ty=terrainY(CUL_T.x,CUL_T.z),A=V3w(CUL_T.x,ty,CUL_T.z),B=V3w(CUL_O.x,-10,CUL_O.z);
 segBox(sm,A,B,12.4,1,0,-.5,K_W2,3);
 for(const sd of[-1,1])for(let k=0;k<10;k++){const u0=k/10,u1=(k+1)/10,a2=A.clone().lerp(B,u0),b2=A.clone().lerp(B,u1),n={x:-(B.z-A.z),z:B.x-A.x},nl=Math.hypot(n.x,n.z);
   let top=-1e9;for(const u of[u0,(u0+u1)/2,u1])for(const lat of[7.5,9,11,-7.5,-9,-11]){const px=lerp(A.x,B.x,u)+n.x/nl*lat,pz=lerp(A.z,B.z,u)+n.z/nl*lat;top=Math.max(top,duneY(px,pz));}
   const bot=Math.min(a2.y,b2.y)-1.2,mid=(a2.y+b2.y)/2,h=top+1.2-bot;a2.y=b2.y=mid;
   segBox(sm,a2,b2,1.6,h,sd*6.8,bot+h/2-mid,K_W2,3);segBox(sm,a2,b2,4.2,1,sd*8.4,top+.7-mid,K_W2,3);}
 for(let i=0;i<10;i++){const u=i/9,p=V3w(lerp(A.x,B.x,u),lerp(A.y,B.y,u),lerp(A.z,B.z,u)),n={x:B.z-A.z,z:-(B.x-A.x)},l=Math.hypot(n.x,n.z);
   for(const sd of[-1,1]){const q=V3w(p.x+n.x/l*sd*R(8,12),0,p.z+n.z/l*sd*R(8,12));sm.add(boxUV(R(2,4),R(1,2.4),R(2,4),2),M(q.x,duneY(q.x,q.z)+.3,q.z,R(-.3,.3),R(0,3),R(-.3,.3)),K_W2);}}}
{// the passages: floor, walls, roof along the line; the halls round; the pit under the bridges
 const P=UND.map(([x,z,y,hw])=>({x,z,y,hw}));
 const inHall=p=>HALLS.some(H=>Math.hypot(p.x-H.x,p.z-H.z)<H.r-1);
 const onPit=(a,b)=>segDist((a.x+b.x)/2,(a.z+b.z)/2,PIT.ax,PIT.az,PIT.bx,PIT.bz)<2;
 for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],hw=Math.min(a.hw,b.hw);const A=V3w(a.x,a.y,a.z),B=V3w(b.x,b.y,b.z),open=i>=UND_OPEN;
   if(inHall(a)&&inHall(b))continue;
   if(onPit(a,b)){// the bridge: a slab with a low parapet and gold along it; the pit walls stand off at PIT.hw
     segBox(um,A,B,hw*2+.4,1.2,0,-.6,K_UND,3);for(const sd of[-1,1]){segBox(um,A,B,.5,1.1,sd*(hw+.1),.55,K_UND2,2);segBox(ug,A,B,.12,.12,sd*(hw+.1),1.14,K_GOLD);}
     for(const sd of[-1,1])segBox(um,A,B,1,40,sd*(PIT.hw+.5),-19+8.4-12,K_UND2,4);
     segBox(um,A,B,PIT.hw*2+2,1,0,8.4+.5,K_UND2,4);
     segBox(um,V3w(A.x,-34,A.z),V3w(B.x,-34,B.z),PIT.hw*2,1,0,-.5,K_DARK,4);
     // a second bridge beside it, broken in the middle, its halves hanging into the pit
     for(const [u0,u1,dr] of[[0,.38,.3],[.62,1,-.3]]){const a2=V3w(lerp(A.x,B.x,u0),A.y,lerp(A.z,B.z,u0)),b2=V3w(lerp(A.x,B.x,u1),A.y-(dr>0?3:0),lerp(A.z,B.z,u1));if(dr<0)a2.y-=3;segBox(um,a2,b2,4,1,8.6,-.5,K_UND,3);}
     continue;}
   segBox(um,A,B,hw*2+2.4,1,0,-.5,K_UND,3);
   for(const sd of[-1,1]){segBox(um,A,B,1,open?(Math.max(0,-Math.min(a.y,b.y))+2.2):10.4,sd*(hw+.6),open?(Math.max(0,-Math.min(a.y,b.y))+2.2)/2-1:4.2,K_UND2,3);
     if(!open)segBox(ug,A,B,.12,.12,sd*(hw+.08),1.3,K_GOLD);}
   if(!open)segBox(um,A,B,hw*2+3.2,1,0,8.4+.5,K_UND2,4);
   // the climb into the light: steps
   if(open&&Math.abs(b.y-a.y)>.5){const n=Math.ceil(Math.abs(b.y-a.y)/.45);for(let k=0;k<n;k++){const u0=k/n,u1=(k+1)/n,p0=V3w(lerp(a.x,b.x,u0),lerp(a.y,b.y,u1),lerp(a.z,b.z,u0)),p1=V3w(lerp(a.x,b.x,u1),lerp(a.y,b.y,u1),lerp(a.z,b.z,u1));
     p0.y=p1.y;segBox(um,p0,p1,hw*2+.2,.45,0,-.22,k%2?K_UND:K_W2,2);}}}
 // pillars at the bends (they close the joints) and a lamp every so often
 for(let i=1;i<P.length-1;i++){const p=P[i];if(inHall(p))continue;const n=roadN(roadS(p.x,p.z));for(const sd of[-1,1]){const x=p.x+n.x*sd*(p.hw+.7),z=p.z+n.z*sd*(p.hw+.7);um.add(new THREE.CylinderGeometry(1.1,1.2,i>=UND_OPEN?Math.max(1,-p.y+2.2):10.4,10),M(x,(i>=UND_OPEN?Math.max(1,-p.y+2.2)/2-1+p.y:p.y+4.2),z),K_UND2);}}
 // the halls: a round wall with doorways where the passages come in, a ring of columns, a low vault, water in a ring channel
 for(const H of HALLS){const ents=[];for(let i=0;i<P.length;i++){const d=Math.hypot(P[i].x-H.x,P[i].z-H.z);if(d<H.r+18&&d>H.r-1){ents.push(Math.atan2(P[i].x-H.x,P[i].z-H.z));}}
   // the doorways: gaps in the wall toward each passage
   const gaps=[];for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],da=Math.hypot(a.x-H.x,a.z-H.z),db=Math.hypot(b.x-H.x,b.z-H.z);if((da<H.r)!==(db<H.r)){const o=da<H.r?b:a;gaps.push(Math.atan2(o.x-H.x,o.z-H.z));}}
   const half=Math.asin(Math.min(.9,6.6/(H.r+.6)));gaps.sort((u,v)=>u-v);
   const pieces=[];if(!gaps.length)pieces.push([0,Math.PI*2]);else for(let k=0;k<gaps.length;k++){const s0=gaps[k]+half,s1=(k+1<gaps.length?gaps[k+1]:gaps[0]+Math.PI*2)-half;if(s1>s0)pieces.push([s0,s1-s0]);}
   for(const [t0,tl] of pieces){const g=new THREE.CylinderGeometry(H.r+.6,H.r+.6,14,Math.max(6,Math.round(tl*12)),1,true,t0,tl);um.add(g,M(H.x,H.y+7,H.z),K_UND2);
     const gr=new THREE.CylinderGeometry(H.r+.45,H.r+.45,.14,Math.max(6,Math.round(tl*12)),1,true,t0,tl);ug.add(gr,M(H.x,H.y+1.3,H.z),K_GOLD);ug.add(gr,M(H.x,H.y+9,H.z),K_GOLD);}
   um.add(new THREE.CircleGeometry(H.r+1,40).rotateX(-Math.PI/2),M(H.x,H.y+.01,H.z),K_UND);
   {const vg=new THREE.SphereGeometry(H.r+.6,32,12,0,Math.PI*2,0,Math.PI/2);vg.scale(1,.32,1);um.add(vg,M(H.x,H.y+13.4,H.z),K_UND2);}   // the vault (seen from inside: the stone material is two-sided)
   for(let k=0;k<8;k++){const a=k/8*Math.PI*2+.2;if(gaps.some(g=>Math.abs(Math.atan2(Math.sin(a-g),Math.cos(a-g)))<.45))continue;const x=H.x+Math.sin(a)*(H.r-3),z=H.z+Math.cos(a)*(H.r-3);
     um.add(new THREE.CylinderGeometry(.9,1.1,14,12),M(x,H.y+7,z),K_UND);OBST.push({x,z,r:1.2,h:14,y0:H.y});}
   const w=new THREE.Mesh(new THREE.RingGeometry(H.r-1.8,H.r-.6,48),new THREE.MeshBasicMaterial({color:C(0x4a6aa8).multiplyScalar(.7),transparent:true,opacity:.65,toneMapped:false}));w.rotation.x=-Math.PI/2;w.position.set(H.x,H.y+.06,H.z);scene.add(w);
   const l=new THREE.PointLight(C(0xffc890),1.2,30,1.6);l.position.set(H.x,H.y+10,H.z);scene.add(l);UNDL.push(l);}
 // lamps along the passages: small gold lights high on the walls (sparse: it's meant to be dark down here)
 for(const s of[S_AT.culvert+24,S_AT.cistern+60,S_AT.vault+40]){const p=roadPt(s).clone(),n=roadN(s),y=roadY(s);const l=new THREE.PointLight(C(0xffb070),.9,24,1.6);l.position.set(p.x+n.x*3,y+7,p.z+n.z*3);scene.add(l);UNDL.push(l);
   const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffb070).multiplyScalar(1.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.setScalar(1.6);sp.position.copy(l.position);scene.add(sp);}
 // the sunken stair court at the top: low walls round it, broken white stone
 for(let i=UND_OPEN;i<UND.length-1;i++){const [ax,az]=UND[i],[bx,bz]=UND[i+1];for(let k=0;k<3;k++){const u=R(0,1),x=lerp(ax,bx,u)+R(-12,12),z=lerp(az,bz,u)+R(-12,12);if(R_UND.f(x,z).d<2)continue;sm.add(boxUV(R(2,4),R(1,2.5),R(2,4),2),M(x,R(0,.8),z,R(-.3,.3),R(0,3),R(-.3,.3)),K_W2);}}
 // cover in the halls and on the passages: fallen blocks, Host crates
 for(const H of HALLS)for(let k=0;k<5;k++){const a=k/5*Math.PI*2+R(0,.6),r=R(4,8),x=H.x+Math.sin(a)*r,z=H.z+Math.cos(a)*r;const y=H.y;um.add(boxUV(R(1.6,2.6),R(1,1.5),R(1.2,2),2),M(x,y+.6,z,0,R(0,3),0),k%2?K_UND:K_W2);OBST.push({x,z,r:1.2,h:1.4,y0:y});}
}

/* ---------- THE APPROACH: the wreckage fields in front of the sealed gate. Burned Herald armour and transports, two downed ships, white
   stone fallen off the wall, the Host's crates where they've dug in. Cover all the way down from the ridge ---------- */
const SMOLDER=[];
{const smoke=(x,y,z,k)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff7a2a).multiplyScalar(1.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7}));sp.scale.setScalar(6*k);sp.position.set(x,y+1.5,z);scene.add(sp);SMOLDER.push({sp,x,y,z,k});};
 const crate=(x,z,ry)=>{const y=floorAt(x,z);wm.add(boxUV(1.6,1.3,1.6,2),M(x,y+.65,z,0,ry,0),C(0x2a2433));wg.add(new THREE.BoxGeometry(1.62,.08,.3),M(x,y+1.1,z,0,ry,0),C(0xb46aff));OBST.push({x,z,r:1,h:1.3});};
 // the cover: a piece every 14-22 m down the approach, either side of the way, alternating kinds
 for(let s=28;s<S_AT.culvert-30;s+=R(14,22)){const sd=rng()<.5?-1:1,p=at0(s,sd*R(4,13)),n=roadN(s),k=rng();
   if(k<.36)hulk(p.x,p.z,R(2,3.4),R(1.2,2),R(3,6),R(0,3),k3(),true);
   else if(k<.62){sm.add(boxUV(R(3,6),R(1.6,3),R(2.4,4),2),M(p.x,p.y+.7,p.z,R(-.2,.2),R(0,3),R(-.25,.25)),K_W2);OBST.push({x:p.x,z:p.z,r:2,h:2.4});}
   else if(k<.82)bench(p.x,p.z,Math.atan2(n.z,-n.x)+R(-.4,.4),R(4,6));
   else crate(p.x,p.z,R(0,3));}
 // the Host's positions (the first fight, and the dropship field): crates in rows
 for(const [s0,s1] of[[150,178],[466,512]])for(let s=s0;s<s1;s+=4)for(const sd of[-1,1])if(rng()<.6){const p=at0(s,sd*R(6,12));crate(p.x,p.z,R(0,3));}
 // red's and amber's lines in front of the gate: low walls of fallen stone
 for(const [s,lat,ry] of[[296,-9,.2],[304,-4,-.1],[318,8,.3],[326,12,0],[676,-6,.1],[684,4,-.2],[692,10,.15]]){const p=at0(s,lat),n=roadN(s);sm.add(boxUV(7,1.4,1.4,2),M(p.x,p.y+.7,p.z,0,Math.atan2(n.x,n.z)+Math.PI/2+ry,0),K_W2);
   for(let i=-1;i<=1;i++)OBST.push({x:p.x+n.z*i*2.4,z:p.z-n.x*i*2.4,r:1.2,h:1.4,bar:true});}
 // two downed ships: a long burned hull nose-down in the sand, a fin standing up, fire still in it
 for(const [s,lat,L] of[[250,-20,36],[590,18,28]]){const p=at0(s,lat),n=roadN(s),ry=Math.atan2(n.x,n.z)+R(-.6,.6);
   wm.add(boxUV(L,5.5,8,3),M(p.x,p.y+1.6,p.z,R(-.1,.1),ry,.18),K_HER);wm.add(boxUV(L*.5,1,6,2),M(p.x,p.y+5.2,p.z,.5,ry+.3,.1),K_BURN);
   wm.add(boxUV(1,7,5,2),M(p.x+Math.sin(ry)*L*.3,p.y+5,p.z+Math.cos(ry)*L*.3,0,ry,.3),K_BURN);
   for(let i=-2;i<=2;i++)OBST.push({x:p.x+Math.sin(ry)*i*L*.2,z:p.z+Math.cos(ry)*i*L*.2,r:4.2,h:6});
   WARMAP.hulks.push({x:p.x,z:p.z,r:L*.4});smoke(p.x,p.y+3,p.z,1.4);smoke(p.x+Math.sin(ry)*L*.35,p.y+2,p.z+Math.cos(ry)*L*.35,1);}
 // the drain's mouth: the Host have been through it (a violet lamp on a pole at the trench top, a cold glow in the arch)
 {const top=V3w(CUL_T.x,terrainY(CUL_T.x,CUL_T.z),CUL_T.z);for(const sd of[-1,1]){const n={x:(CUL_O.z-CUL_T.z),z:-(CUL_O.x-CUL_T.x)},l=Math.hypot(n.x,n.z),x=top.x+n.x/l*sd*8.5,z=top.z+n.z/l*sd*8.5;
   wm.add(new THREE.CylinderGeometry(.12,.18,4.4,6),M(x,top.y+2.2,z),C(0x2a2433));const g=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xb46aff).multiplyScalar(2.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));g.scale.setScalar(3.4);g.position.set(x,top.y+4.6,z);scene.add(g);}
  const ml=new THREE.PointLight(C(0xb46aff),1.4,26,1.6);ml.position.set(CUL_O.x+(CUL_T.x-CUL_O.x)*.12,-5,CUL_O.z+(CUL_T.z-CUL_O.z)*.12);scene.add(ml);
  const mg=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x9a6aff).multiplyScalar(1.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6}));mg.scale.set(10,7,1);mg.position.set(CUL_O.x,-5.5,CUL_O.z);scene.add(mg);}
 // stone off the wall, scattered at its foot either side of the trench
 for(let i=0;i<24;i++){const a=CUL.a+R(-.18,.18),r=WR+WT+R(4,40),p=ringPt(0,0,a,r);if(R_TRENCH.f(p.x,p.z).d<2)continue;sm.add(boxUV(R(2,5),R(1.2,3),R(2,5),2),M(p.x,duneY(p.x,p.z)+.6,p.z,R(-.3,.3),R(0,3),R(-.3,.3)),K_W2);OBST.push({x:p.x,z:p.z,r:2,h:2.4});}
}
/* ---------- shapes for the decks, ramps and stairs: a sweep round a centre (cx,cz) from angle a0 to a1, between radii r0(a)..r1(a),
   its top at y(a), t thick; four faces (top, bottom, inner, outer) ---------- */
function sweepGeo(cx,cz,a0,a1,r0f,r1f,yf,t,n,ends){const pos=[],uv=[],idx=[];const F=v=>typeof v==='function'?v:()=>v;r0f=F(r0f);r1f=F(r1f);yf=F(yf);const tf=F(t);
  const ring=[];for(let k=0;k<=n;k++){const a=lerp(a0,a1,k/n),r0=r0f(a),r1=r1f(a),y=yf(a),tt=tf(a),s=Math.sin(a),c=Math.cos(a);
    ring.push([[cx+s*r0,y,cz+c*r0],[cx+s*r1,y,cz+c*r1],[cx+s*r1,y-tt,cz+c*r1],[cx+s*r0,y-tt,cz+c*r0]]);}
  const quad=(a,b,c,d,u0,u1,v0,v1)=>{const i=pos.length/3;pos.push(...a,...b,...c,...d);uv.push(u0,v0,u1,v0,u1,v1,u0,v1);idx.push(i,i+1,i+2,i,i+2,i+3);};
  for(let k=0;k<n;k++){const A=ring[k],B=ring[k+1],u0=k/2,u1=(k+1)/2;
    quad(A[0],A[1],B[1],B[0],u0,u1,0,1);quad(A[3],B[3],B[2],A[2],u0,u1,0,1);quad(A[1],A[2],B[2],B[1],u0,u1,0,tf(a0)/4);quad(A[0],B[0],B[3],A[3],u0,u1,0,tf(a0)/4);}
  if(ends){for(const R of[ring[0],ring[n]])quad(R[0],R[1],R[2],R[3],0,1,0,1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
// a gold line round a centre at radius r(a), height y(a)
function goldArc(mg,cx,cz,a0,a1,rf,yf,t,n){const F=v=>typeof v==='function'?v:()=>v;rf=F(rf);yf=F(yf);const P=[];for(let k=0;k<=n;k++){const a=lerp(a0,a1,k/n),r=rf(a);P.push(new THREE.Vector3(cx+Math.sin(a)*r,yf(a),cz+Math.cos(a)*r));}goldLine(mg,P,t);}

/* ---------- THE PLAZA: four tiers up toward Tower A, stairs between them (zig, zag, up the middle), arcades along both sides,
   the war across every tier ---------- */
const PLZ_RY=Math.atan2(PLZ.dx,PLZ.dz);
const PLAZA_GLASS=[];
function plzBox(mg,u0,u1,v0,v1,y0,y1,col,unit){const c=plzXZ((u0+u1)/2,(v0+v1)/2);mg.add(boxUV(v1-v0,y1-y0,u1-u0,unit||4),M(c.x,(y0+y1)/2,c.z,0,PLZ_RY,0),col||K_W2);}
{plzBox(sm,-14,102,-37,37,-1,.04,K_W2,6);
 for(let k=1;k<4;k++){const u0=k*PLZ.tier,y=k*PLZ.rise;if(k<3)plzBox(sm,u0,102,-36,36,-1,y,k%2?K_W:K_W2,5);else{plzBox(sm,u0,80,-36,36,-1,y,K_W,5);plzBox(sm,80,102,-22,22,-1,y,K_W,5);}
   // the tier's edge: a gold line along its lip, broken where the stair comes up
   const R0=PLZ_RAMPS.find(r=>r.e===u0);for(const [v0,v1] of[[-36,R0.v-R0.hw],[R0.v+R0.hw,36]]){if(v1-v0<1)continue;goldLine(sg,[plzXZ(u0+.05,v0),plzXZ(u0+.05,v1)].map(p=>new THREE.Vector3(p.x,y+.02,p.z)),.22);
     goldLine(sg,[plzXZ(u0-.05,v0),plzXZ(u0-.05,v1)].map(p=>new THREE.Vector3(p.x,y-1.4,p.z)),.16);}}
 // the stairs: steps up the face of each tier, with cheeks either side
 for(const Rp of PLZ_RAMPS){const k=Rp.e/PLZ.tier,y0=(k-1)*PLZ.rise,n=14;for(let i=0;i<n;i++){const u0=Rp.e-PLZ_RUN+i*PLZ_RUN/n,u1=Rp.e,yT=y0+(i+1)*PLZ.rise/n;plzBox(sm,u0,u0+PLZ_RUN/n+.02,Rp.v-Rp.hw,Rp.v+Rp.hw,y0,yT,i%2?K_W2:K_W,2);}
   for(const sd of[-1,1]){const v=Rp.v+sd*(Rp.hw+.35),a=plzXZ(Rp.e-PLZ_RUN,v),b=plzXZ(Rp.e,v);segBox(sm,V3w(a.x,y0+.7,a.z),V3w(b.x,y0+PLZ.rise+.7,b.z),.7,1.4,0,0,K_W2,2);
     segBox(sg,V3w(a.x,y0+1.42,a.z),V3w(b.x,y0+PLZ.rise+1.42,b.z),.14,.14,0,0,K_GOLD);}}
 // the arcades either side: a long white building per tier, its ground floor open on the plaza, a gold band, glass high up
 for(const sd of[-1,1])for(let k=0;k<4;k++){const u0=k*PLZ.tier-(k?0:14),u1=k===3?102:(k+1)*PLZ.tier,y=k*PLZ.rise,hw=k===3?36:36,v0=sd*(hw+3),v1=sd*(hw+19),h=R(22,34)+k*3;
   plzBox(sm,u0,u1,Math.min(v0,v1)+(sd>0?4:0),Math.max(v0,v1)-(sd<0?4:0),y-1,y+h,k%2?K_W:K_W2,6);
   plzBox(sm,u0-.4,u1+.4,Math.min(v0,v1)-.4,Math.max(v0,v1)+.4,y+h,y+h+1.6,K_W2,4);                          // the cornice
   for(let u=u0+3;u<u1-1;u+=6){const p=plzXZ(u,sd*(hw+2.2));form.noSolid=true;form(p.x,p.z,y,7.5,.75,.6,12,0,K_W,.03);form.noSolid=false;OBST.push({x:p.x,z:p.z,r:.8,h:7.5,y0:y});}
   {const a=plzXZ(u0,sd*(hw+3.4)),b=plzXZ(u1,sd*(hw+3.4));plzBox(sm,u0,u1,Math.min(sd*(hw+1.6),sd*(hw+3.4)),Math.max(sd*(hw+1.6),sd*(hw+3.4)),y+7.5,y+9,K_W2,3);
    for(const yy of[y+12.5,y+13.8,y+15.1])goldLine(sg,[V3w(a.x,yy,a.z),V3w(b.x,yy,b.z)],.2);}
   PLAZA_GLASS.push({u0,u1,sd,v:sd*(hw+3.05),y,h});
   FLY.push({x:plzXZ((u0+u1)/2,sd*(hw+11)).x,z:plzXZ((u0+u1)/2,sd*(hw+11)).z,r:16,h:y+h+2});}
 // the war on the tiers: Herald barricades, burned wreckage, fallen columns (cover on every tier)
 for(const [u,v,t] of[[8,-14,'b'],[12,6,'h'],[16,24,'b'],[20,-26,'p'],[30,-4,'b'],[36,14,'h'],[40,-26,'b'],[44,28,'p'],[56,12,'b'],[60,-12,'h'],[64,24,'b'],[68,-28,'p'],[82,-12,'b'],[86,10,'h'],[94,-6,'b'],[98,14,'p']]){
   const p=plzXZ(u,v),ry=PLZ_RY+R(-.4,.4);if(t==='b')bench(p.x,p.z,ry+Math.PI/2,R(4,6));else if(t==='h')hulk(p.x,p.z,R(2,3.2),R(1.2,1.8),R(3,5),R(0,3),k3(),true);else pillar(p.x,p.z,R(.8,1.2),R(5,9));}
}

/* ---------- the spires: the trailer's tower, at any size. Tall stone panels leaning in as they rise, gold strips down every other one,
   galleries on brackets, woven gold bands, a stepped plinth with buttresses, an open crown ringed with gold needles ---------- */
function spire(mg,gmg,cx,cz,o){const N=o.N,r0=o.r,r1=o.r*.55,h=o.h,slot=o.slot||0;
  const shear=(g,rz)=>{const P=g.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i)/h+.5,sc=1+(r1/r0-1)*y;P.setX(i,P.getX(i)*sc);P.setZ(i,P.getZ(i)-(1-sc)*rz);}g.computeVertexNormals();return g;};
  const panel=shear(boxUV(2*Math.PI*r0/N+.5,h,3,6),r0+1.5).translate(0,h/2,r0+1.5);
  const strip=shear(new THREE.BoxGeometry(1.1*o.k,h,.7,1,1,1),r0+3.1).translate(0,h/2,r0+3.1);
  const rib=shear(boxUV(2.6*o.k,h,1.6,4),r0+2.6).translate(0,h/2,r0+2.6);
  for(let k=0;k<N;k++){const a=(k+.5)/N*Math.PI*2;if(slot&&Math.min(a,Math.PI*2-a)<slot)continue;const mt=M(cx,0,cz,0,a,0);mg.add(panel,mt,k%2?K_W:K_W2);if(k%2)mg.add(rib,mt,K_W);else gmg.add(strip,mt,K_GOLD);}
  if(o.core)mg.add(new THREE.CylinderGeometry(r1-1,r0-1,h,Math.max(16,N),1),M(cx,h/2,cz),K_W2);
  const at=y=>r0+(r1-r0)*(y/h);
  for(const y of o.gal||[]){const rr=at(y)+3.2,g=new THREE.LatheGeometry([[rr,-1.7],[rr+7,-1.7],[rr+7,1.7],[rr,1.7],[rr,-1.7]].map(([r,yy])=>new THREE.Vector2(r,yy)),Math.max(24,N*2));mg.add(g,M(cx,y,cz),K_W2);
    gmg.add(new THREE.TorusGeometry(rr+7,.4,4,Math.max(32,N*3)).rotateX(Math.PI/2),M(cx,y+1.8,cz),K_GOLD);
    for(let k=0;k<Math.max(8,N/2);k++){const a=(k+.5)/Math.max(8,N/2)*Math.PI*2;if(slot&&Math.min(a,Math.PI*2-a)<slot)continue;mg.add(new THREE.BoxGeometry(1.6,6,7).translate(0,-4.5,rr+2.5),M(cx,y,cz,0,a,0),K_W2);}}
  for(const yc of o.bands||[])for(const dy of[-1.8,0,1.8]){const y=yc+dy;gmg.add(new THREE.TorusGeometry(at(y)+3.6,.45*o.k,6,Math.max(32,N*3)).rotateX(Math.PI/2),M(cx,y,cz),K_GOLD);}
  for(const [r,y] of o.plinth||[]){mg.add(new THREE.CylinderGeometry(r,r+2,6,Math.max(32,N*2)).translate(0,y-3,0),M(cx,0,cz),K_W2);gmg.add(new THREE.TorusGeometry(r+.2,.35,4,Math.max(32,N*3)).rotateX(Math.PI/2),M(cx,y,cz),K_GOLD);}
  if(o.butt){const y0=o.plinth?o.plinth[o.plinth.length-1][1]:0;for(let k=0;k<8;k++){const a=(k+.5)/8*Math.PI*2;if(slot&&Math.min(a,Math.PI*2-a)<.3)continue;
    const g=new THREE.BufferGeometry(),hh=o.butt,P=[[-2.5,0,0],[2.5,0,0],[2.5,0,hh*.24],[-2.5,0,hh*.24],[-2,hh,0],[2,hh,0]],v=[],q=(a1,b1,c1)=>v.push(...P[a1],...P[b1],...P[c1]);
    q(0,2,1);q(0,3,2);q(3,4,5);q(3,5,2);q(0,4,3);q(1,2,5);q(0,1,5);q(0,5,4);g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(v.length/3*2).fill(0),2));g.computeVertexNormals();
    const p=ringPt(cx,cz,a,r0+1);mg.add(g,M(p.x,y0,p.z,0,a,0),K_W2);}}
  // the crown: a heavy ring, open in the middle, gold needles round it curving in
  mg.add(new THREE.TorusGeometry(r1,6*o.k,12,Math.max(32,N*2)).rotateX(Math.PI/2),M(cx,h,cz),K_W);gmg.add(new THREE.TorusGeometry(r1-6*o.k,.8*o.k,6,Math.max(32,N*2)).rotateX(Math.PI/2),M(cx,h+2*o.k,cz),K_GOLD);
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2,big=k%3===0,L=(big?70:42)*o.k,cg=new THREE.ConeGeometry((big?2.6:1.8)*o.k,L,8).translate(0,L/2,0);
    const mt=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-.32,a,0,'YXZ'));mt.setPosition(cx+Math.sin(a)*r1,h+4*o.k,cz+Math.cos(a)*r1);(k%2?gmg:mg).add(cg,mt,k%2?K_GOLD:K_W);}
  FLY.push({x:cx,z:cz,r:r0+4,h:h+40*o.k});}
const crowns=[];
// the two lesser towers, and the ramps that climb round them (a spiral terrace: its outer wall runs down to the ground)
for(const T of[TOWA,TOWB]){spire(sm,sg,T.x,T.z,{N:24,r:T.r,h:T.h,k:.42,core:true,gal:[T.h*.62,T.h*.86],bands:[T.h*.46,T.h*.8],plinth:[[T.r+6,3],[T.r+4,6]],butt:0});
  const n=Math.round((T.a0-T.a1)/(3*DEG));
  sm.add(sweepGeo(T.x,T.z,T.a0,T.a1,T.r+2.2,T.rr+T.rw,a=>rampY(T,a),1.2,n),M(0,0,0),K_W2);
  sm.add(sweepGeo(T.x,T.z,T.a0,T.a1,T.rr+T.rw,T.rr+T.rw+.7,a=>rampY(T,a)+1.15,a=>rampY(T,a)+1.15,n),M(0,0,0),K_W);   // the outer wall, down to the ground
  goldArc(sg,T.x,T.z,T.a0,T.a1,T.rr+T.rw+.35,a=>rampY(T,a)+1.18,.16,n);goldArc(sg,T.x,T.z,T.a0,T.a1,T.rr+T.rw+.75,a=>rampY(T,a)-1.6,.2,n);
  sm.add(sweepGeo(T.x,T.z,T.a0,T.a1,T.r+1.5,T.r+2.3,a=>rampY(T,a)-1.1,a=>rampY(T,a)-1.1,n),M(0,0,0),K_W2);   // the inner skirt (the core of the terrace)
  const cg=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffe6b0).multiplyScalar(1.3),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.5}));cg.scale.setScalar(30);cg.position.set(T.x,T.h+6,T.z);scene.add(cg);crowns.push(cg);}
// the skybridge (A to B, 42 m up) and the long bridge (B to the tower, 62 m up, over the chasm)
function bridge(a,b,y,hw,o){const A=V3w(a.x,y,a.z),B=V3w(b.x,y,b.z);segBox(sm,A,B,hw*2+.8,1.6,0,-.8,K_W2,3);
  for(const sd of[-1,1]){if(o&&o.broken){const L=A.distanceTo(B);for(const [u0,u1] of o.broken[sd>0?1:0]){const a2=A.clone().lerp(B,u0),b2=A.clone().lerp(B,u1);segBox(sm,a2,b2,.6,1.1,sd*(hw+.1),.55,K_W,2);segBox(sg,a2,b2,.14,.14,sd*(hw+.1),1.14,K_GOLD);}}
    else{segBox(sm,A,B,.6,1.1,sd*(hw+.1),.55,K_W,2);segBox(sg,A,B,.14,.14,sd*(hw+.1),1.14,K_GOLD);}segBox(sg,A,B,.2,.2,sd*(hw+.42),-1.5,K_GOLD);}
  // its belly: a shallow arch
  const L=A.distanceTo(B),n=10;for(let k=0;k<n;k++){const u0=k/n,u1=(k+1)/n,s0=Math.sin(u0*Math.PI)*L*.06,s1=Math.sin(u1*Math.PI)*L*.06,p0=A.clone().lerp(B,u0),p1=B.clone().lerp(A,1-u1);p0.y-=2+L*.06-s0;p1.y-=2+L*.06-s1;segBox(sm,p0,p1,hw*1.2,1.2,0,0,K_W2,3);}
  FLY.push({x:(a.x+b.x)/2,z:(a.z+b.z)/2,r:L/2,h:y+3});}
bridge(SKY_A,SKY_B,TOWA.y1,3.2);
bridge(BR_B,BR_G,GAL.y,3.2,{broken:[[[0,.22],[.3,.71],[.78,1]],[[0,.46],[.52,1]]]});
// the long bridge's two piers, down into the chasm
for(const u of[.36,.7]){const x=lerp(BR_B.x,BR_G.x,u),z=lerp(BR_B.z,BR_G.z,u);sm.add(new THREE.CylinderGeometry(3,4.2,GAL.y-CHASM.y-6,16),M(x,(GAL.y-6+CHASM.y)/2,z),K_W2);sg.add(new THREE.TorusGeometry(3.1,.25,4,24).rotateX(Math.PI/2),M(x,GAL.y-8,z),K_GOLD);}

/* ---------- the jetpack hops (Nov 16, Bryce: "stairs or ramps for the safe way, jetpack for the fast way"): a gold ring on the floor at
   each end; stand in it and jump (js/pathfinder3/03-story.js flies you across) ---------- */
const JETS=(()=>{const out=[],pt=(x,z)=>V3w(x,floorAt(x,z),z);
  const p=(u,v)=>{const q=plzXZ(u,v);return pt(q.x,q.z);};
  out.push({a:p(14,-10),b:p(54,-10),name:'tier'},{a:p(40,12),b:p(84,12),name:'tier'});
  for(const T of[TOWA,TOWB]){const q0=ringPt(T.x,T.z,T.a0-62*DEG,T.rr),q1=ringPt(T.x,T.z,T.a0-132*DEG,T.rr);out.push({a:V3w(q0.x,rampY(T,T.a0-62*DEG),q0.z),b:V3w(q1.x,rampY(T,T.a0-132*DEG),q1.z),name:'ramp'});}
  const ringM=new THREE.MeshBasicMaterial({color:C(0xffd890).multiplyScalar(1.4),transparent:true,opacity:.8,toneMapped:false,depthWrite:false});
  for(const J of out){for(const e of[J.a,J.b]){const r=new THREE.Mesh(new THREE.RingGeometry(1.5,1.9,40),ringM);r.rotation.x=-Math.PI/2;r.position.set(e.x,e.y+.06,e.z);scene.add(r);}
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffd890).multiplyScalar(1.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.5}));s.scale.set(2.6,5,1);s.position.set(J.a.x,J.a.y+2.2,J.a.z);scene.add(s);J.glow=s;}
  return out;})();

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
/* ---------- THE HEART: the trailer's tower, brought into the level (Nov 16, Bryce). Outside, 48 tall panels leaning in to the crown,
   gold strips, three galleries on brackets (the first, 62 m up, is where the long bridge lands: you can walk all the way round it), two
   woven bands, the stepped plinth with its buttresses over the chasm, the sealed door at its foot, the open crown ringed with gold
   needles. A slot runs up the south face where two panels are missing: the door from the gallery is in it, the long window over it.
   Inside it is hollow: the inner wall (the panels' backs, leaning in), the lower balcony round the open shaft, the grand stair up the
   inner wall, the upper balcony, the lift, and at the top, in the crown, the dome room with the socket ---------- */
const TOWER=(()=>{const G=new THREE.Group();scene.add(G);const m=new Merger(),gm=new Merger(),im=new Merger(),ig=new Merger();
  const SLOT=.08;
  spire(m,gm,0,0,{N:48,r:TW.r,h:TW.h,k:1,slot:SLOT,gal:[148,236],bands:[96,196],plinth:[[84,6],[79,12],[74,18]],butt:110});
  // the first gallery: wider than the others (the walk), a parapet round its edge with gold along it
  {const g=new THREE.LatheGeometry([[64,-2.4],[GAL.r1+.6,-2.4],[GAL.r1+.6,0],[64,0],[64,-2.4]].map(([r,y])=>new THREE.Vector2(r,y)),128);m.add(g,M(0,GAL.y,0),K_W2);
   m.add(new THREE.LatheGeometry([[GAL.r1,0],[GAL.r1+.6,0],[GAL.r1+.6,1.1],[GAL.r1,1.1],[GAL.r1,0]].map(([r,y])=>new THREE.Vector2(r,y)),128),M(0,GAL.y,0),K_W);
   gm.add(new THREE.TorusGeometry(GAL.r1+.3,.12,4,160).rotateX(Math.PI/2),M(0,GAL.y+1.14,0),K_GOLD);gm.add(new THREE.TorusGeometry(GAL.r1+.65,.3,4,160).rotateX(Math.PI/2),M(0,GAL.y-1.2,0),K_GOLD);
   for(let k=0;k<32;k++){const a=(k+.5)/32*Math.PI*2;if(Math.min(a,Math.PI*2-a)<SLOT)continue;m.add(new THREE.BoxGeometry(1.8,7,9).translate(0,-5.6,GAL.r1-5),M(0,GAL.y,0,0,a,0),K_W2);}}
  // the sealed door at the foot (the processional avenue's end): an arch with a membrane of light (TOWER.doorU drives both doors)
  const doorU={uT:{value:0},open:{value:0}};
  const memMat=new THREE.ShaderMaterial({uniforms:doorU,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vU;void main(){vU=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vU;uniform float uT,open;void main(){float r=length(vU)/5.5;if(r<open)discard;float rip=.5+.5*sin(r*30.0-uT*2.5+vU.x*.8);
      gl_FragColor=vec4(mix(vec3(.75,.82,.95),vec3(1.0,.9,.7),rip*.4)*(.6+.35*rip),(.6+.25*rip)*smoothstep(open,open+.06,r));}`});
  {const dz=TW.r+3;m.add(new THREE.TorusGeometry(10,2.6,10,40,Math.PI),M(0,32,dz),K_W);gm.add(new THREE.TorusGeometry(10,.35,6,40,Math.PI),M(0,32,dz+2.4),K_GOLD);
   for(const sx of[-1,1])m.add(boxUV(5,14,6,3),M(sx*10,25,dz),K_W);
   const mem=new THREE.Mesh(new THREE.PlaneGeometry(15,24),new THREE.MeshBasicMaterial({color:C(0xe8eeff),transparent:true,opacity:.7,toneMapped:false}));mem.position.set(0,28,dz-.5);G.add(mem);}
  // the inner wall: the panels' backs, leaning in; open where the door's hall comes through
  {const ys=[18,GAL.y,HALL.y+11.5,TW.h],ha=Math.asin(5.9/linerR(GAL.y));
   for(let i=0;i<3;i++){const y0=ys[i],y1=ys[i+1],g=i===1?new THREE.CylinderGeometry(linerR(y1),linerR(y0),y1-y0,96,2,true,ha,Math.PI*2-ha*2):new THREE.CylinderGeometry(linerR(y1),linerR(y0),y1-y0,96,Math.max(2,Math.round((y1-y0)/12)),true);
     im.add(g,M(0,(y0+y1)/2,0),K_W2);}
   // gold rings round the inner wall, every forty metres, and the shaft's floor far below (gold rings in dark stone)
   for(const y of[40,100,180,220,260])ig.add(new THREE.TorusGeometry(linerR(y)-.15,.16,4,128).rotateX(Math.PI/2),M(0,y,0),K_GOLD);
   im.add(new THREE.CircleGeometry(linerR(18),64).rotateX(-Math.PI/2),M(0,18.05,0),K_DARK);
   for(let r=6;r<linerR(18);r+=7)ig.add(new THREE.TorusGeometry(r,.2,4,96).rotateX(Math.PI/2),M(0,18.1,0),K_GOLD);}
  // the door's hall: walls, a roof, through the slot to the gallery; its doorway on the gallery is a pointed arch with the membrane
  {const z0=HALL.z0-1,z1=HALL.z1+1.5,cz=(z0+z1)/2,L=z1-z0;for(const s of[-1,1]){im.add(boxUV(.8,11.5,L,3),M(s*(HALL.hw+.4),HALL.y+5.75,cz),K_W);ig.add(new THREE.BoxGeometry(.12,.12,L),M(s*(HALL.hw-.02),HALL.y+1.3,cz),K_GOLD);}
   im.add(boxUV(HALL.hw*2+1.6,1,L,3),M(0,HALL.y+11.5+.5,cz),K_W2);im.add(boxUV(HALL.hw*2+1.6,1.2,L,3),M(0,HALL.y-.6,cz),K_W2);
   m.add(new THREE.TorusGeometry(5.5,1.4,10,40,Math.PI),M(0,HALL.y+5.6,HALL.z1+.8),K_W);gm.add(new THREE.TorusGeometry(5.5,.22,6,40,Math.PI),M(0,HALL.y+5.6,HALL.z1+2),K_GOLD);}
  const door=new THREE.Mesh(new THREE.CircleGeometry(5.6,40,0,Math.PI),memMat);door.position.set(0,HALL.y+5.6,HALL.z1+.6);G.add(door);
  const doorLow=new THREE.Mesh(new THREE.PlaneGeometry(11.2,5.6),memMat);doorLow.position.set(0,HALL.y+2.8,HALL.z1+.6);G.add(doorLow);
  // the lower balcony: a deck round the shaft from the hall to the foot of the stair, a low wall and gold on its inner edge
  const liner0=linerR(LOWB.y)-.6;
  im.add(sweepGeo(0,0,LOWB.a0,LOWB.a1,BAL.r0,linerR(LOWB.y)+.3,LOWB.y,1.4,60),M(0,0,0),K_W2);
  im.add(sweepGeo(0,0,LOWB.a0,LOWB.a1-4*DEG,BAL.r0-.6,BAL.r0,LOWB.y+1.1,1.1,60),M(0,0,0),K_W);goldArc(ig,0,0,LOWB.a0,LOWB.a1-4*DEG,BAL.r0-.3,LOWB.y+1.14,.14,60);
  im.add(sweepGeo(0,0,LOWB.a0-1.2*DEG,LOWB.a0,BAL.r0-.6,liner0+.6,LOWB.y+1.1,1.1,1,true),M(0,0,0),K_W);   // its west end
  // brackets under it
  for(let k=0;k<14;k++){const a=lerp(LOWB.a0,LOWB.a1,(k+.5)/14),p=spiralPt(a,(BAL.r0+liner0)/2+6);im.add(boxUV(1.2,4,liner0-BAL.r0-6,2),M(p.x,LOWB.y-3.4,p.z,0,a,0),K_W);}
  // THE GRAND STAIR: up the inner wall from the lower balcony to the upper (the steps, a soffit under them, a low wall on the open side)
  {const n=200;for(let k=0;k<n;k++){const a0=lerp(STAIR.a0,STAIR.a1,k/n),a1=lerp(STAIR.a0,STAIR.a1,(k+1)/n),am=(a0+a1)/2,y=Math.round(stairY(a1)/.43)*.43||stairY(a1);
     const r0=stairR0(am),r1=stairR1(am)+.6,p=spiralPt(am,(r0+r1)/2),dep=(a1-a0)*(r0+r1)/2+.06;im.add(boxUV(dep,.9,r1-r0,2),M(p.x,stairY(a1)-.45,p.z,0,am,0),k%2?K_W:K_W2);}
   im.add(sweepGeo(0,0,STAIR.a0,STAIR.a1,stairR0,a=>stairR1(a)+.6,a=>stairY(a)-.9,1.6,120),M(0,0,0),K_W2);
   im.add(sweepGeo(0,0,STAIR.a0+10*DEG,STAIR.a1-8*DEG,a=>stairR0(a)-.6,stairR0,a=>stairY(a)+1.1,2.2,120),M(0,0,0),K_W);
   goldArc(ig,0,0,STAIR.a0+10*DEG,STAIR.a1-8*DEG,a=>stairR0(a)-.3,a=>stairY(a)+1.14,.14,120);
   goldArc(ig,0,0,STAIR.a0,STAIR.a1,a=>stairR1(a)+.45,a=>stairY(a)+1.3,.12,120);goldArc(ig,0,0,STAIR.a0,STAIR.a1,a=>stairR1(a)+.45,a=>stairY(a)+8.4,.16,120);}
  // the upper balcony, and the lift beside it
  im.add(sweepGeo(0,0,UPB.a0-1*DEG,UPB.a1,BAL.r0,linerR(UPB.y)+.3,UPB.y,1.4,12),M(0,0,0),K_W2);
  im.add(sweepGeo(0,0,UPB.a0+1*DEG,UPB.a1,BAL.r0-.6,BAL.r0,UPB.y+1.1,1.1,12),M(0,0,0),K_W);goldArc(ig,0,0,UPB.a0+1*DEG,UPB.a1,BAL.r0-.3,UPB.y+1.14,.14,12);
  im.add(sweepGeo(0,0,UPB.a1,UPB.a1+1.2*DEG,BAL.r0-.6,linerR(UPB.y)-.4,UPB.y+1.1,1.1,1,true),M(0,0,0),K_W);
  for(const a of[CAR.a0-1.5*DEG,CAR.a1+.5*DEG])for(const r of[CAR.r0-.6,CAR.r1+.6]){const p=spiralPt(a,r);ig.add(new THREE.BoxGeometry(.35,CAR.y1-CAR.y0+8,.35),M(p.x,(CAR.y0+CAR.y1)/2+2,p.z),K_GOLD);}
  const car=new THREE.Group();G.add(car);
  {const cm=new Merger(),cg=new Merger();cm.add(sweepGeo(0,0,CAR.a0,CAR.a1,CAR.r0,CAR.r1,0,.9,8,true),M(0,0,0),K_W);
   cg.add(new THREE.TorusGeometry(.1,.1,3,4),M(0,0,0),K_GOLD);goldArc(cg,0,0,CAR.a0,CAR.a1,CAR.r1-.1,.02,.18,8);goldArc(cg,0,0,CAR.a0,CAR.a1,CAR.r0+.1,.02,.18,8);
   for(const a of[CAR.a0+.6*DEG,CAR.a1-.6*DEG])for(const r of[CAR.r0+.4,CAR.r1-.4]){const p=spiralPt(a,r);cm.add(new THREE.CylinderGeometry(.14,.14,2.4,6),M(p.x,1.2,p.z),K_W);cg.add(new THREE.SphereGeometry(.22,8,6),M(p.x,2.45,p.z),K_GOLD);}
   const a=new THREE.Mesh(cm.build(),stoneInMat);a.receiveShadow=true;car.add(a);car.add(new THREE.Mesh(cg.build(),goldMat));
   const u=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xa8c8ff).multiplyScalar(1.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7}));const pc=spiralPt((CAR.a0+CAR.a1)/2,(CAR.r0+CAR.r1)/2);u.position.set(pc.x,-1.2,pc.z);u.scale.set(9,2.4,1);car.add(u);}
  car.position.y=CAR.y0;
  // THE DOME ROOM: in the crown, open to the sky. The deck round it (the lift comes up at its west side), its floor ringed in gold
  im.add(sweepGeo(0,0,CAR.a1+.5*DEG,CAR.a0+TAU-.5*DEG,CR,linerR(TOPY)+.3,TOPY-.05,2,48),M(0,0,0),K_W2);
  im.add(new THREE.CylinderGeometry(CR,CR,2,64),M(0,TOPY-1.05,0),K_W2);
  ig.add(new THREE.TorusGeometry(CR,.18,4,96).rotateX(Math.PI/2),M(0,TOPY+.1,0),K_GOLD);
  for(const y of[TOPY+4,TOPY+12,TOPY+16])for(const dy of[-.9,0,.9])ig.add(new THREE.TorusGeometry(linerR(y+dy)-.2,.14,4,128).rotateX(Math.PI/2),M(0,y+dy,0),K_GOLD);
  /* (Nov 17, Bryce: the room in the ending looked plain, a white floor and bare walls with stripes) the room's own architecture: a
     ring of columns round the floor's edge with gold capitals and bases, a gold-ribbed panel rhythm up the inner wall between the
     bands, and inlaid gold spokes out from the dais. Clear of the lift's mouth in the west, where the Host come up */
  {const lift=a=>{let d=a-(CAR.a0+CAR.a1)/2;d=Math.atan2(Math.sin(d),Math.cos(d));return Math.abs(d)<14*DEG;};
   const NC=20,rc=CR+2.2;for(let k=0;k<NC;k++){const a=(k+.5)/NC*TAU;if(lift(a))continue;const q=spiralPt(a,rc);
     im.add(new THREE.CylinderGeometry(.75,.9,15,14),M(q.x,TOPY+7.5,q.z),k%2?K_W:K_W2);im.add(new THREE.CylinderGeometry(1.25,1.25,.7,14),M(q.x,TOPY+.35,q.z),K_W2);
     im.add(new THREE.BoxGeometry(2.1,.8,2.1),M(q.x,TOPY+15.4,q.z,0,a,0),K_W2);
     ig.add(new THREE.TorusGeometry(.92,.1,4,20).rotateX(Math.PI/2),M(q.x,TOPY+.75,q.z),K_GOLD);ig.add(new THREE.TorusGeometry(.8,.1,4,20).rotateX(Math.PI/2),M(q.x,TOPY+14.6,q.z),K_GOLD);
     ig.add(new THREE.BoxGeometry(.12,12.5,.12).translate(0,0,.78),M(q.x,TOPY+7.6,q.z,0,a+Math.PI,0),K_GOLD);
     OBST.push({x:q.x,z:q.z,r:1.2,h:16,y0:TOPY});}
   // the lintel ring over the columns
   im.add(sweepGeo(0,0,CAR.a1+10*DEG,CAR.a0+TAU-10*DEG,rc-1.2,rc+1.2,TOPY+15.8,1.2,64),M(0,0,0),K_W);
   goldArc(ig,0,0,CAR.a1+10*DEG,CAR.a0+TAU-10*DEG,rc-1.25,TOPY+15.5,.16,64);
   // the inner wall: tall panels, a gold rib between each
   const NP=36;for(let k=0;k<NP;k++){const a=(k+.5)/NP*TAU;if(lift(a))continue;const r=linerR(TOPY+9)-.35;
     im.add(boxUV(2*Math.PI*r/NP-.5,15,.5,3).translate(0,0,r),M(0,TOPY+8.5,0,0,a,0),k%2?K_W:K_W2);
     ig.add(new THREE.BoxGeometry(.22,16,.22).translate(0,0,r-.35),M(0,TOPY+8.5,0,0,a+Math.PI/NP,0),K_GOLD);}
  }
  const floorU={uT:{value:0},wake:{value:0}};
  const fl=new THREE.Mesh(new THREE.CircleGeometry(CR,96),new THREE.ShaderMaterial({uniforms:floorU,transparent:true,depthWrite:false,
    vertexShader:'varying vec2 vU;void main(){vU=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vU;uniform float uT,wake;void main(){float r=length(vU),a=atan(vU.y,vU.x);
      float rings=smoothstep(.93,1.0,sin(r*1.6))*.8+smoothstep(.985,1.0,sin(a*12.0))*step(3.0,r)*.7;
      float run=wake>0.0?smoothstep(.0,.4,1.0-abs(r-(${CR.toFixed(1)}*fract(uT*.25)))*.3):0.0;
      vec3 c=vec3(1.0,.82,.45)*rings*(.25+wake*1.2)+vec3(.7,.85,1.0)*run*wake*.6;gl_FragColor=vec4(c,clamp(rings*(.35+wake)+run*wake*.5,0.0,1.0));}`}));
  fl.rotation.x=-Math.PI/2;fl.position.y=TOPY+.03;G.add(fl);
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.3,.8,48),stoneInMat);dais.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Array(dais.geometry.attributes.position.count*3).fill(.92),3));dais.position.set(0,TOPY+.4,0);G.add(dais);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(.6,.06,6,32),new THREE.MeshBasicMaterial({color:C(0xffd890).multiplyScalar(1.6),toneMapped:false}));lip.rotation.x=Math.PI/2;lip.position.set(0,TOPY+.81,0);G.add(lip);
  const slot=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({color:0x000000}));slot.rotation.x=-Math.PI/2;slot.position.set(0,TOPY+.805,0);G.add(slot);
  OBST.push({x:0,z:0,r:1.4,h:1,y0:TOPY});
  const cl=new THREE.PointLight(C(0xd8e4ff),.8,110,1);cl.position.set(0,TOPY+55,0);G.add(cl);
  const ringL=[];for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.3,l=new THREE.PointLight(C(0xffd890),.45,18,1.6);l.position.set(Math.sin(a)*(CR-2),TOPY+3,Math.cos(a)*(CR-2));G.add(l);ringL.push(l);}
  // lamps up the tower: along the stair, at the balconies, in the hall
  const lamps=[];for(let k=0;k<5;k++){const a=lerp(STAIR.a0,STAIR.a1,(k+.5)/5),p=spiralPt(a,stairR1(a)-1),l=new THREE.PointLight(C(0xfff0d8),1.1,30,1.5);l.position.set(p.x,stairY(a)+7,p.z);G.add(l);lamps.push(l);}
  {const l=new THREE.PointLight(C(0xfff0d8),1,30,1.5);l.position.set(0,HALL.y+8,HALL.z0+2);G.add(l);lamps.push(l);}
  {const p=spiralPt(330*DEG,45),l=new THREE.PointLight(C(0xffe0b0),1,40,1.5);l.position.set(p.x,LOWB.y+8,p.z);G.add(l);lamps.push(l);}
  // the murals: three panels on the inner wall beside the stair (what Thorne reads)
  const murals=[];
  [[126,'cities'],[170,'fall'],[226,'dome']].forEach(([deg,kind])=>{const a=deg*DEG,y=stairY(a),r=linerR(y+3.6)-.25,p=spiralPt(a,r);
    const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');drawMural(x,kind);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
    const pm=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,color:C(0xffffff).multiplyScalar(1.1)}));
    pm.position.set(p.x,y+3.6,p.z);pm.lookAt(0,y+3.6,0);G.add(pm);const q=spiralPt(a,stairR1(a)-2.5);murals.push({th:a,p:new THREE.Vector3(q.x,y,q.z),kind,m:pm});});
  const ext=new THREE.Mesh(m.build(),stoneMat);ext.castShadow=ext.receiveShadow=true;G.add(ext);G.add(new THREE.Mesh(gm.build(),goldMat));
  const inside=new THREE.Mesh(im.build(),stoneInMat);inside.receiveShadow=true;G.add(inside);G.add(new THREE.Mesh(ig.build(),goldMat));
  const crown=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffe6b0).multiplyScalar(1.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.45}));crown.scale.setScalar(120);crown.position.set(0,TW.h+10,0);G.add(crown);
  return{G,door,doorLow,doorU,lamps,fl,floorU,dais,lip,cl,ringL,murals,ext,car,inside};})();
// the plinth over the chasm, and the chasm itself: a ring of white walls falling away into the dark, a coping round its rim
{sm.add(new THREE.CylinderGeometry(CHASM.r0,CHASM.r0,-CHASM.y+18,96,4,true),M(0,(CHASM.y+18)/2,0),K_W2);
 sm.add(new THREE.CylinderGeometry(CHASM.r1,CHASM.r1,-CHASM.y,128,4,true),M(0,CHASM.y/2,0),K_W2);
 sm.add(new THREE.RingGeometry(CHASM.r1,CHASM.r1+14,128,1).rotateX(-Math.PI/2),M(0,.06,0),K_W2);
 sg.add(new THREE.TorusGeometry(CHASM.r1+.3,.25,4,192).rotateX(Math.PI/2),M(0,.4,0),K_GOLD);
 for(let k=0;k<48;k++){const a=(k+.5)/48*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.12)continue;const p=spiralPt(a,CHASM.r1+1.2);sm.add(boxUV(2.4,1.2,1.2,2),M(p.x,.6,p.z,0,a,0),K_W);}
 // the causeway: the processional avenue's last stretch, across the chasm to the sealed door (amber's barricades on it, red's wrecks)
 sm.add(boxUV(30,4,CHASM.r1-CHASM.r0+6,6),M(0,-2,(CHASM.r0+CHASM.r1)/2),K_W2);
 for(let z=CHASM.r0+4;z<CHASM.r1;z+=9)for(const s of[-1,1])pillar(s*14.2,z,.8,7);
 for(const [x,z] of[[-6,132],[5,118],[-2,104]])hulk(x,z,R(2.5,3.5),R(1.4,2),R(4,6),R(0,3),k3(),false);}

/* ---------- THE CITY (Nov 16, Bryce: "good spaces between the buildings, a real city like in real life"). A planned capital: two ring
   boulevards (the chasm's edge and the middle ring) and twelve radial avenues, the processional avenue from the sealed gate straight
   to the tower, and between them blocks cut by narrower streets. Three districts, each with its own buildings and spacing:
     OUTER   (330-505 m) terraces three to six storeys, round courtyards, alleys between them
     MIDDLE  (180-320 m) civic halls with colonnades and vaults, courtyard blocks, small gardens with a pavilion
     INNER   (168-240 m, by the chasm) towers on podiums, tall, banded in gold
   The building kit (terrace, hall, courtyard block, podium tower, pavilion) all wear the trailer tower's look: smooth white stone, gold
   threads and bands, tall dark slits lit gold here and there. Nothing stands on the walk, the plaza, the ramps or the open stair court;
   under the skybridge nothing reaches it. ---------- */
const BLD=[];
const winM=new Merger();   // the windows: dark slits, a few lit
const K_WIN=C(0x1a1c26),K_LIT=C(0xffc070);
function cityKeep(x,z,r){const rr=Math.hypot(x,z);
  if(rr<CHASM.r1+18+r||rr>WR-22-r)return true;
  {const q=plzUV(x,z);if(q.u>-30-r&&q.u<118+r&&Math.abs(q.v)<58+r)return true;}
  if(Math.hypot(x-TOWA.x,z-TOWA.z)<TOWA.rr+TOWA.rw+10+r||Math.hypot(x-TOWB.x,z-TOWB.z)<TOWB.rr+TOWB.rw+10+r)return true;
  if(segDist(x,z,BR_B.x,BR_B.z,BR_G.x,BR_G.z)<12+r)return true;
  if(Math.abs(x)<24+r&&z>120)return true;                                        // the processional avenue
  for(let i=UND_OPEN-1;i<UND.length-1;i++)if(segDist(x,z,UND[i][0],UND[i][1],UND[i+1][0],UND[i+1][1])<16+r)return true;   // the stair court
  if(segDist(x,z,CUL_O.x,CUL_O.z,CUL_T.x,CUL_T.z)<10+r)return true;
  for(let i=0;i<STREETS.length-1;i++){const a=STREETS[i],b=STREETS[i+1];if(segDist(x,z,a[0],a[1],b[0],b[1])<Math.max(a[3],b[3])+22+r)return true;}
  return false;}
function capAt(x,z){return segDist(x,z,SKY_A.x,SKY_A.z,SKY_B.x,SKY_B.z)<22?TOWA.y1-5:segDist(x,z,BR_B.x,BR_B.z,BR_G.x,BR_G.z)<26?GAL.y-6:1e3;}
const nearWalk=(x,z)=>{let d=1e9;for(let i=0;i<ROAD3.length;i+=2)d=Math.min(d,Math.hypot(x-ROAD3[i].x,z-ROAD3[i].z));return d;};
// windows on one face of a box: rows of tall slits, a few lit gold (only where you'll see them from the walk)
function windows(cx,cz,ry,w,h,d,y0,face){if(nearWalk(cx,cz)>260)return;const fx=Math.sin(ry)*face,fz=Math.cos(ry)*face,tx=Math.cos(ry),tz=-Math.sin(ry);
  const cols=Math.max(1,Math.floor((w-4)/4.2)),rows=Math.max(1,Math.floor((h-8)/6.5));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(hh(cx+c,cz+r,7)<.18)continue;const u=(c-(cols-1)/2)*4.2,y=y0+7+r*6.5,lit=hh(cx*.3+c,cz*.7+r,9)<.12;
    winM.add(new THREE.BoxGeometry(1.1,3.4,.3),M(cx+fx*(d/2+.05)+tx*u,y,cz+fz*(d/2+.05)+tz*u,0,ry,0),lit?K_LIT:K_WIN);}}
// a gold band round a box at height y (three lines, the woven look)
function bandBox(cx,cz,ry,w,d,y){const c=Math.cos(ry),s=Math.sin(ry),pt=(u,v,yy)=>V3w(cx+c*u+s*v,yy,cz-s*u+c*v);
  for(const dy of[-1.1,0,1.1]){const yy=y+dy,P=[pt(-w/2-.12,-d/2-.12,yy),pt(w/2+.12,-d/2-.12,yy),pt(w/2+.12,d/2+.12,yy),pt(-w/2-.12,d/2+.12,yy),pt(-w/2-.12,-d/2-.12,yy)];goldLine(sg,P,.18);}}
// a box building on the ground, with a cornice, an optional arcade on its front, a band, windows on front and back
function block(cx,cz,ry,w,d,h,o){o=o||{};h=Math.min(h,capAt(cx,cz));if(h<6)return;const col=o.col||(hh(cx,cz,1)<.5?K_W:K_W2);
  sm.add(boxUV(w,h,d,6),M(cx,h/2-.5,cz,0,ry,0),col);sm.add(boxUV(w+.8,1.4,d+.8,4),M(cx,h+.2,cz,0,ry,0),K_W2);
  if(o.step&&h>24){const h2=Math.min(R(6,14),capAt(cx,cz)-h-1);if(h2>3)sm.add(boxUV(w*.7,h2,d*.7,6),M(cx,h+h2/2,cz,0,ry,0),K_W);}
  if(h>16)bandBox(cx,cz,ry,w,d,clamp(h*.42,9,30));
  windows(cx,cz,ry,w,h,d,0,1);windows(cx,cz,ry,w,h,d,0,-1);
  if(o.arcade){const fx=Math.sin(ry),fz=Math.cos(ry),tx=Math.cos(ry),tz=-Math.sin(ry);for(let u=-w/2+3;u<=w/2-3;u+=5){const x=cx+fx*(d/2+2.6)+tx*u,z=cz+fz*(d/2+2.6)+tz*u;sm.add(new THREE.CylinderGeometry(.6,.7,7,10),M(x,3.5,z),K_W);}
    sm.add(boxUV(w,1.2,3.4,3),M(cx+fx*(d/2+1.6),7.4,cz+fz*(d/2+1.6),0,ry,0),K_W2);}
  BLD.push({x:cx,z:cz,r:Math.hypot(w,d)/2,h});FLY.push({x:cx,z:cz,r:Math.hypot(w,d)/2,h:h+2});}
// a civic hall: long, a colonnade all round, a barrel vault, glass in its ends
function hall(cx,cz,ry,w,d,h){h=Math.min(h,capAt(cx,cz)-d*.35);if(h<10)return;block(cx,cz,ry,w,d,h,{col:K_W});
  const v=new THREE.CylinderGeometry(d*.42,d*.42,w*.96,24,1,false,0,Math.PI);v.rotateZ(Math.PI/2);sm.add(v,M(cx,h+.8,cz,0,ry,0),K_W2);
  const fx=Math.sin(ry),fz=Math.cos(ry),tx=Math.cos(ry),tz=-Math.sin(ry);
  for(const sd of[-1,1])for(let u=-w/2+2;u<=w/2-2;u+=4.5){const x=cx+fx*sd*(d/2+3)+tx*u,z=cz+fz*sd*(d/2+3)+tz*u;sm.add(new THREE.CylinderGeometry(.7,.8,h*.55,12),M(x,h*.275,z),K_W);}
  for(const sd of[-1,1])sm.add(boxUV(w+2,1.4,3.6,3),M(cx+fx*sd*(d/2+2.4),h*.55+.6,cz+fz*sd*(d/2+2.4),0,ry,0),K_W2);
  if(nearWalk(cx,cz)<240)for(const sd of[-1,1]){const x=cx+tx*sd*(w/2+.15),z=cz+tz*sd*(w/2+.15);HALL_GLASS.push({p:V3w(x,h*.62,z),n:V3w(tx*sd,0,tz*sd),r:Math.min(4.6,d*.18)});}}
const HALL_GLASS=[];
// a courtyard block: four sides round an open court
function court(cx,cz,ry,w,d,h){const t=Math.min(12,w*.3,d*.3),fx=Math.sin(ry),fz=Math.cos(ry),tx=Math.cos(ry),tz=-Math.sin(ry);
  block(cx+fx*(d/2-t/2),cz+fz*(d/2-t/2),ry,w,t,h,{arcade:hh(cx,cz,3)<.5});block(cx-fx*(d/2-t/2),cz-fz*(d/2-t/2),ry,w,t,h*R(.8,1));
  for(const sd of[-1,1])block(cx+tx*sd*(w/2-t/2),cz+tz*sd*(w/2-t/2),ry+Math.PI/2,d-2*t,t,h*R(.75,1));
  if(hh(cx,cz,4)<.5){form.noSolid=true;form(cx,cz,0,R(5,9),.6,.25,12,0,K_W,.25);sm.add(new THREE.SphereGeometry(R(2,3),14,8),M(cx,R(7,10),cz),K_W2);form.noSolid=false;}}
// a tower on a podium: a box base and a tall white form, banded and threaded in gold
function podium(cx,cz,ry,w,d,h){const cap=capAt(cx,cz);if(cap<40){block(cx,cz,ry,w,d,Math.min(h*.3,cap));return;}
  const ph=R(12,18);block(cx,cz,ry,w,d,ph,{arcade:true});const r0=Math.min(w,d)*.36,hh2=Math.min(h,cap)-ph;if(hh2<20)return;
  form.noSolid=true;const n=pick([8,12,16,24]),r1=r0*R(.35,.6),sw=R(.04,.14),rr2=R(0,3);form(cx,cz,ph,hh2,r0,r1,n,rr2,K_W,sw);form.noSolid=false;
  wovenBand(cx,cz,ph,hh2,r0,r1,n,rr2,sw,ph+hh2*R(.4,.6),1.4);thread(cx,cz,ph,hh2,r0,r1,n,rr2,sw,ph+4,ph+hh2*.85,0);
  if(hh(cx,cz,5)<.5)sm.add(new THREE.SphereGeometry(r1*1.1,16,10,0,Math.PI*2,0,Math.PI/2),M(cx,ph+hh2,cz),K_W2);
  FLY.push({x:cx,z:cz,r:r0+2,h:ph+hh2+4});}
// a garden square: low wall, white stone trees, a domed pavilion
function garden(cx,cz,ry,w,d){for(let k=0;k<6;k++){const x=cx+R(-w*.35,w*.35),z=cz+R(-d*.35,d*.35);form.noSolid=true;form(x,z,0,R(6,10),.5,.2,12,0,K_W,.25);form.noSolid=false;sm.add(new THREE.SphereGeometry(R(1.6,2.6),14,8),M(x,R(7,10),z),K_W2);}
  sm.add(new THREE.CylinderGeometry(6,6.4,7,24),M(cx,3.5,cz),K_W);sm.add(new THREE.SphereGeometry(6.2,24,10,0,Math.PI*2,0,Math.PI/2),M(cx,7,cz),K_W2);sg.add(new THREE.TorusGeometry(6.45,.14,4,48).rotateX(Math.PI/2),M(cx,5.5,cz),K_GOLD);}
{// the street plan: rings and radials; blocks between them, split into lots
 const RAD=12,RA0=15*DEG,radW=7,rings=[[180,250,'inner'],[258,322,'middle'],[346,418,'outer'],[426,500,'outer']];
 for(const [r0,r1,dist] of rings){for(let k=0;k<RAD;k++){const a0=RA0+k*TAU/RAD,a1=a0+TAU/RAD,rm=(r0+r1)/2;
   const ia0=a0+radW/rm,ia1=a1-radW/rm,arc=(ia1-ia0)*rm,nl=Math.max(1,Math.round(arc/(dist==='outer'?46:dist==='middle'?54:60)));
   for(let j=0;j<nl;j++){const b0=lerp(ia0,ia1,j/nl)+(j?4/rm:0),b1=lerp(ia0,ia1,(j+1)/nl)-(j<nl-1?4/rm:0),am=(b0+b1)/2,w=(b1-b0)*rm,dd=r1-r0;
     const c=spiralPt(am,rm),ry=am;   // facing out along the radius (its front looks toward the tower)
     const fr=Math.hypot(w,dd)/2;if(cityKeep(c.x,c.z,fr*.55))continue;
     const t=hh(c.x,c.z,11);
     if(dist==='outer'){if(t<.62)court(c.x,c.z,ry,w-2,dd-2,R(14,26));else if(t<.82){for(const f of[-.25,.25])block(c.x+Math.sin(am)*dd*f,c.z+Math.cos(am)*dd*f,ry,w-2,dd*.38,R(14,24),{arcade:f<0});}else garden(c.x,c.z,ry,w,dd);}
     else if(dist==='middle'){if(t<.4)hall(c.x,c.z,ry+Math.PI/2,dd-6,Math.min(w-6,30),R(18,28));else if(t<.82)court(c.x,c.z,ry,w-2,dd-2,R(22,40));else garden(c.x,c.z,ry,w,dd);}
     else{if(t<.7)podium(c.x,c.z,ry,w-4,dd-6,R(70,150));else court(c.x,c.z,ry,w-2,dd-4,R(30,50));}}}}
 // the boulevards' furniture: lamp posts down the middle ring, white trees down the radials near the walk
 for(let k=0;k<72;k++){const a=k/72*TAU,p=spiralPt(a,334);if(cityKeep(p.x,p.z,2))continue;form.noSolid=true;form(p.x,p.z,0,7,.25,.18,8,0,K_W,.02);form.noSolid=false;
   const g=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffc880).multiplyScalar(1.3),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.6}));g.scale.setScalar(2.2);g.position.set(p.x,7.4,p.z);scene.add(g);}
 // the processional avenue: wide, white, lined with columns, amber's barricades across it and red's wrecks (it is the war's front)
 for(let z=CHASM.r1+10;z<WR-20;z+=16)for(const s of[-1,1]){form.noSolid=true;form(s*21,z,0,R(9,13),1.1,.9,16,0,K_W,.04);form.noSolid=false;}
 for(const z of[200,262,330,410,470]){for(let x=-16;x<=16;x+=5.5)bench(x+R(-1,1),z+R(-2,2),R(-.2,.2),R(4,5.5));hulk(R(-12,12),z+R(8,14),R(2.5,3.6),R(1.4,2.2),R(4,6),R(0,3),k3(),false);}
}
/* ---------- THE LOWER QUARTER (Nov 17): houses shoulder to shoulder down both sides of the new streets (tall over the alleys, so
   they read as alleys), the arcade's building over the way, a dry fountain in its square, the well's ring at the court's head, and the
   war in the streets: amber's barricades, burned red armour, the Host's crates. Nothing stands on the walk (each house is checked) ---------- */
const QUARTER_LIGHTS=[];
{const onWalk=(x,z,m)=>{const q=regionAt(x,z);return q.d<(m||1.5);};
 const free=(cx,cz,ry,w,d)=>{const c=Math.cos(ry),sn=Math.sin(ry);for(const [u,v] of[[0,0],[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5],[0,-.5],[0,.5],[-.5,0],[.5,0]]){const x=cx+c*u*w+sn*v*d,z=cz-sn*u*w+c*v*d;if(onWalk(x,z,.6))return false;}return true;};
 for(let i=0;i<STREETS.length-1;i++){const [ax,az,,ah]=STREETS[i],[bx,bz,,bh]=STREETS[i+1],L=Math.hypot(bx-ax,bz-az),dx=(bx-ax)/L,dz=(bz-az)/L,nx=-dz,nz=dx,ry=Math.atan2(dx,dz)+Math.PI/2;
   const hw=Math.min(ah,bh),alley=hw<5.5;
   for(const sd of[-1,1]){let u=4;while(u<L-4){const w=R(9,16),d=R(12,20),h=alley?R(20,34):R(13,26),lat=hw+1.3+d/2,cu=u+w/2,cx=ax+dx*cu+nx*sd*lat,cz=az+dz*cu+nz*sd*lat;
       if(free(cx,cz,ry,w,d)){block(cx,cz,ry,w,d,h,{arcade:!alley&&hh(cx,cz,6)<.35,step:hh(cx,cz,7)<.4});
         // an awning or a balcony on the street face, now and then
         if(hh(cx,cz,8)<.4){const fx=nx*sd*-1,fz=nz*sd*-1;sm.add(boxUV(w*.8,.4,2.2,2),M(cx+fx*(d/2+1.1),R(5,9),cz+fz*(d/2+1.1),0,ry,0),K_W2);}}
       u+=w+R(.4,2.2);}}}
 // the arcade: a building over the way, its ground floor a vaulted passage with columns down both sides
 {const a=STREETS[8],b=STREETS[9],L=Math.hypot(b[0]-a[0],b[1]-a[1]),cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2,ry=Math.atan2(b[0]-a[0],b[1]-a[1]),W=a[3]*2+10;
  sm.add(boxUV(W,14,L+6,6),M(cx,8.4+7,cz,0,ry,0),K_W);sm.add(boxUV(W+1,1.4,L+7,4),M(cx,22.4,cz,0,ry,0),K_W2);
  const v=new THREE.CylinderGeometry(a[3]+.6,a[3]+.6,L+5.6,20,1,true,0,Math.PI);v.rotateZ(Math.PI/2);v.rotateY(Math.PI/2);sm.add(v,M(cx,6.8,cz,0,ry,0),K_W2);
  const tx=Math.cos(ry),tz=-Math.sin(ry),fx=Math.sin(ry),fz=Math.cos(ry);
  for(const sd of[-1,1]){sm.add(boxUV(4,8.4,L+6,4),M(cx+tx*sd*(a[3]+2.6),4.2,cz+tz*sd*(a[3]+2.6),0,ry,0),K_W2);
    for(let u=-L/2;u<=L/2;u+=6){const x=cx+fx*u+tx*sd*(a[3]+.2),z=cz+fz*u+tz*sd*(a[3]+.2);sm.add(new THREE.CylinderGeometry(.5,.6,7,12),M(x,3.5,z),K_W);OBST.push({x,z,r:.7,h:7});}
    goldLine(sg,[V3w(cx-fx*L/2+tx*sd*(a[3]+.5),7.2,cz-fz*L/2+tz*sd*(a[3]+.5)),V3w(cx+fx*L/2+tx*sd*(a[3]+.5),7.2,cz+fz*L/2+tz*sd*(a[3]+.5))],.16);}
  bandBox(cx,cz,ry,W,L+6,15);windows(cx,cz,ry+Math.PI/2,L+6,22,W,8.4,1);windows(cx,cz,ry+Math.PI/2,L+6,22,W,8.4,-1);
  for(const u of[-L*.3,L*.3]){const l=new THREE.PointLight(C(0xffb070),.9,22,1.6);l.position.set(cx+fx*u,6.4,cz+fz*u);scene.add(l);QUARTER_LIGHTS.push(l);}
  BLD.push({x:cx,z:cz,r:Math.hypot(W,L)/2,h:23});FLY.push({x:cx,z:cz,r:Math.hypot(W,L)/2,h:24});}
 // the Fountain square: a dry basin, a figure on a column in it (cover all round)
 {const [x,z]=STREETS[5];sm.add(new THREE.CylinderGeometry(5.4,5.8,1.3,32),M(x,.65,z),K_W2);sm.add(new THREE.CylinderGeometry(4.6,4.6,.2,32),M(x,1.2,z),K_UND);
  form.noSolid=true;form(x,z,1.3,6.5,.7,.55,16,0,K_W,.05);form.noSolid=false;sm.add(new THREE.SphereGeometry(1.1,16,10),M(x,8.6,z),K_W);sg.add(new THREE.TorusGeometry(5.6,.14,4,48).rotateX(Math.PI/2),M(x,1.25,z),K_GOLD);
  OBST.push({x,z,r:5.6,h:1.3});OBST.push({x,z,r:1,h:9});}
 // the Well at the court's head: a low ring wall round the stair court's mouth is already the court's; a ring of white columns here
 {const [x,z]=STREETS[0];for(let k=0;k<6;k++){const a=k/6*TAU+.3,px=x+Math.sin(a)*13,pz=z+Math.cos(a)*13;if(onWalk(px,pz,-1.2)&&regionAt(px,pz).r!==R_STREET)continue;if(R_UND.f(px,pz).d<3)continue;pillar(px,pz,.9,R(5,9));}}
 // the war in the streets: cover the whole way
 const crate=(x,z,ry)=>{const y=0;wm.add(boxUV(1.6,1.3,1.6,2),M(x,y+.65,z,0,ry,0),C(0x2a2433));wg.add(new THREE.BoxGeometry(1.62,.08,.3),M(x,y+1.1,z,0,ry,0),C(0xb46aff));OBST.push({x,z,r:1,h:1.3});};
 const s0=S_AT.courtTop,s1=S_AT.plaza;
 for(let sv=s0+10;sv<s1-12;sv+=R(9,15)){const p=roadPt(sv).clone(),n=roadN(sv),hwv=laneHalf(sv),lat=(rng()<.5?-1:1)*R(.2,.85)*Math.max(1.2,hwv-1.6),x=p.x+n.x*lat,z=p.z+n.z*lat;
   if(arcadeD(x,z)<6&&rng()<.6)continue;const k=rng();
   if(k<.3)hulk(x,z,R(1.8,3),R(1.1,1.8),R(2.6,4.4),R(0,3),k3(),true);
   else if(k<.62){const w=Math.min(R(3.5,5.5),hwv*1.2);sm.add(boxUV(w,1.3,1.2,2),M(x,.65,z,R(-.05,.05),Math.atan2(n.x,n.z)+R(-.3,.3),0),K_W2);OBST.push({x,z,r:Math.max(1,w*.4),h:1.3,bar:true});}
   else if(k<.82)crate(x,z,R(0,3));
   else bench(x,z,Math.atan2(n.z,-n.x)+R(-.4,.4),R(3.5,5));}
 // fires in two of the streets (red's strikes)
 for(const sv of[S_AT.alleyIn+30,S_AT.colonnade+10]){const p=roadPt(sv).clone(),n=roadN(sv),x=p.x+n.x*2.5,z=p.z+n.z*2.5;hulk(x,z,2.6,1.6,4,R(0,3),K_HER,true);
   const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff7a2a).multiplyScalar(1.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.7}));sp.scale.setScalar(7);sp.position.set(x,2.2,z);scene.add(sp);SMOLDER.push({sp,x,y:.7,z,k:1.2});
   const l=new THREE.PointLight(C(0xff8a3a),1.1,26,1.6);l.position.set(x,3,z);scene.add(l);QUARTER_LIGHTS.push(l);}
}
{const w=new THREE.Mesh(winM.build(),new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}));scene.add(w);}

/* ---------- THE GLASS (Oct 25, Bryce: stained glass showing the old civilisation's culture: religious, ordered, coloured, scattered
   through the city). Windows of coloured glass, lit from within like everything here, set in the white stone with a thread of gold
   round each: pointed lancets (the old people's arch, the same as their doors) and round roses. What they show, in the murals' terms
   and nothing more: a people turned toward a light; ordered ranks of them in procession; their tower with light on its crown; their
   cities on many worlds; a city under a dome. Bryce's gold rule holds in the lead too: lines cross only as a lattice, never one
   lone cross (the lights are radial, the registers stacked, no single mullion and transom).
   Each design is painted once into a canvas: a mosaic of glass pieces (a jittered grid, each piece coloured by the design at its
   centre, a little lighter in its middle, lead between them), then the motifs laid over as whole pieces with heavier lead. Every
   window of one design is one merged mesh. Where they go: in pairs high on every other street façade (a rose over the pair on the
   tall ones), the long window over the tower's door, along the spiral's outer wall (each throws a pool of its colour on the floor),
   and a ring of them round the chamber's shaft. */
const GLASS=(()=>{const LEAD='#120d0a',TAU=Math.PI*2,S=coarse?.5:1;
  const PAL={blue:[24,64,160],deep:[14,30,96],ruby:[176,28,40],amber:[232,150,40],gold:[255,214,120],green:[40,128,72],violet:[104,52,150],pale:[206,190,156],sky:[60,120,200],white:[236,214,170]};
  const mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
  const rgb=(c,l)=>{l=l||0;return`rgb(${clamp(c[0]+l,0,255)|0},${clamp(c[1]+l,0,255)|0},${clamp(c[2]+l,0,255)|0})`;};
  // the outline of a window: a pointed arch (lancet) or a circle (rose), in canvas pixels
  function outline(x,kind,W,H){x.beginPath();if(kind==='rose'){x.arc(W/2,H/2,W/2-2,0,TAU);return;}
    const r=W-4,yS=W*.86;x.moveTo(2,H-2);x.lineTo(2,yS);x.arc(W-2,yS,r,Math.PI,Math.PI*1.333,false);x.arc(2,yS,r,Math.PI*1.667,TAU,false);x.lineTo(W-2,H-2);x.closePath();}
  // the mosaic: a jittered grid of pieces, each coloured by col(u,v) (u across, v up, 0..1), lead between them
  function mosaic(x,W,H,n,col){const m=Math.round(n*H/W),P=[];
    for(let j=0;j<=m;j++){P[j]=[];for(let i=0;i<=n;i++){const e=i===0||i===n||j===0||j===m;P[j][i]=[i/n*W+(e?0:R(-.3,.3)*W/n),j/m*H+(e?0:R(-.3,.3)*H/m)];}}
    x.lineJoin='round';
    for(let j=0;j<m;j++)for(let i=0;i<n;i++){const a=P[j][i],b=P[j][i+1],c=P[j+1][i+1],d=P[j+1][i],cx=(a[0]+b[0]+c[0]+d[0])/4,cy=(a[1]+b[1]+c[1]+d[1])/4;
      const base=col(cx/W,1-cy/H);if(!base)continue;const l=R(-14,14),g=x.createRadialGradient(cx,cy,0,cx,cy,W/n*.9);g.addColorStop(0,rgb(base,l+26));g.addColorStop(1,rgb(base,l-8));
      x.beginPath();x.moveTo(...a);x.lineTo(...b);x.lineTo(...c);x.lineTo(...d);x.closePath();x.fillStyle=g;x.fill();x.strokeStyle=LEAD;x.lineWidth=Math.max(1.5,W/110);x.stroke();}}
  // a whole piece of glass with heavy lead round it
  function piece(x,W,path,c,l){x.beginPath();path();x.fillStyle=rgb(c,l||0);x.fill();x.strokeStyle=LEAD;x.lineWidth=Math.max(2,W/70);x.lineJoin='round';x.stroke();}
  // a figure in glass: robe, head, a ring of light round the head; arms up (pose 'up'), or kneeling, facing f (1 right, -1 left)
  function figure(x,W,cx,cy,s,robe,pose,f){f=f||1;
    if(pose==='kneel'){piece(x,W,()=>{x.moveTo(cx-s*.5,cy);x.lineTo(cx+s*.55,cy);x.lineTo(cx+s*.25*f,cy-s*1.1);x.lineTo(cx-s*.2*f,cy-s*1.15);x.closePath();},robe);
      piece(x,W,()=>{x.arc(cx+s*.3*f,cy-s*1.45,s*.28,0,TAU);},PAL.pale,10);return;}
    piece(x,W,()=>{x.moveTo(cx-s*.55,cy);x.lineTo(cx+s*.55,cy);x.lineTo(cx+s*.22,cy-s*1.9);x.lineTo(cx-s*.22,cy-s*1.9);x.closePath();},robe);
    if(pose==='up')for(const sd of[-1,1])piece(x,W,()=>{x.moveTo(cx+sd*s*.18,cy-s*1.75);x.lineTo(cx+sd*s*.72,cy-s*2.7);x.lineTo(cx+sd*s*.58,cy-s*2.78);x.lineTo(cx+sd*s*.05,cy-s*1.95);x.closePath();},robe,18);
    piece(x,W,()=>{x.arc(cx,cy-s*2.25,s*.52,0,TAU);},PAL.gold,10);piece(x,W,()=>{x.arc(cx,cy-s*2.25,s*.3,0,TAU);},PAL.pale,14);}
  // registers: a band of pale glass with a row of little gold beads, between the scenes of a lancet
  function band(x,W,H,v){const y=H*(1-v);piece(x,W,()=>{x.rect(4,y-W*.035,W-8,W*.07);},PAL.pale,-6);for(let k=1;k<6;k++)piece(x,W,()=>{x.arc(k*W/6,y,W*.022,0,TAU);},PAL.gold);}
  // radiance: a disc of light with alternating rays (radial: crossed by many, never one cross)
  function sun(x,W,cx,cy,r,n){for(let k=0;k<n;k++){const a0=k/n*TAU,a1=(k+1)/n*TAU;piece(x,W,()=>{x.moveTo(cx+Math.cos(a0)*r*.45,cy+Math.sin(a0)*r*.45);x.lineTo(cx+Math.cos((a0+a1)/2)*r,cy+Math.sin((a0+a1)/2)*r);x.lineTo(cx+Math.cos(a1)*r*.45,cy+Math.sin(a1)*r*.45);x.closePath();},k%2?PAL.amber:PAL.gold,k%2?0:12);}
    piece(x,W,()=>{x.arc(cx,cy,r*.45,0,TAU);},PAL.white);piece(x,W,()=>{x.arc(cx,cy,r*.24,0,TAU);},PAL.gold,20);}
  const DES={
    // THE LIGHT: a figure, arms raised, under a radiant light; below, the people kneeling toward it
    light:(x,W,H)=>{mosaic(x,W,H,7,(u,v)=>v>.78?mix(PAL.deep,PAL.violet,(v-.78)*3):v<.3?(v<.07?PAL.green:mix(PAL.blue,PAL.deep,.4)):mix(PAL.blue,PAL.sky,Math.max(0,1-Math.abs(u-.5)*3)*.4));
      sun(x,W,W/2,H*.13,W*.36,16);band(x,W,H,.74);figure(x,W,W/2,H*.68,W*.17,PAL.ruby,'up');band(x,W,H,.3);
      for(let k=0;k<4;k++){const f=k<2?1:-1;figure(x,W,W*(.16+k*.225),H*.9,W*.1,k%2?PAL.violet:PAL.amber,'kneel',f);}},
    // THE TOWER: their white tower, light pouring from its crown, the rings of light round it, stars in the night behind
    tower:(x,W,H)=>{mosaic(x,W,H,6,(u,v)=>rng()<.06&&v>.35?PAL.white:mix(PAL.deep,PAL.blue,v*.7));
      for(let k=0;k<3;k++){const r=W*(.42-k*.1);x.beginPath();x.arc(W/2,H*.3,r,0,TAU);x.strokeStyle=rgb(k%2?PAL.amber:PAL.gold);x.lineWidth=W*.035;x.stroke();x.strokeStyle=LEAD;x.lineWidth=Math.max(1.5,W/110);x.stroke();}
      piece(x,W,()=>{x.moveTo(W*.5,H*.16);x.lineTo(W*.36,H*.08);x.lineTo(W*.64,H*.08);x.closePath();},PAL.gold,20);
      piece(x,W,()=>{x.moveTo(W*.3,H*.97);x.lineTo(W*.7,H*.97);x.lineTo(W*.58,H*.3);x.lineTo(W*.42,H*.3);x.closePath();},mix(PAL.pale,PAL.amber,.3),-10);
      for(let k=0;k<4;k++)piece(x,W,()=>{x.rect(W*(.43+.0*k),H*(.42+k*.13),W*.14,H*.035);},PAL.gold);
      piece(x,W,()=>{x.moveTo(W*.42,H*.3);x.lineTo(W*.58,H*.3);x.lineTo(W*.5,H*.24);x.closePath();},PAL.white);band(x,W,H,.06);},
    // THE PROCESSION: three registers of the people walking in ranks toward a small light, under an eight-rayed star
    ranks:(x,W,H)=>{mosaic(x,W,H,7,(u,v)=>v>.75?PAL.deep:v>.52?mix(PAL.ruby,PAL.deep,.35):v>.29?mix(PAL.violet,PAL.deep,.2):mix(PAL.green,PAL.deep,.25));
      sun(x,W,W/2,H*.14,W*.32,8);
      for(const [vb,c1,c2] of[[.73,PAL.amber,PAL.pale],[.5,PAL.blue,PAL.gold],[.27,PAL.ruby,PAL.amber]]){band(x,W,H,vb+.02);
        for(let k=0;k<3;k++)figure(x,W,W*(.18+k*.26),H*(1-vb+.2),W*.1,k%2?c1:c2,'walk');piece(x,W,()=>{x.arc(W*.9,H*(1-vb+.08),W*.05,0,TAU);},PAL.white);}
      band(x,W,H,.04);},
    // THE WORLDS: their cities on many worlds, joined by lines of gold
    worlds:(x,W,H)=>{mosaic(x,W,H,6,(u,v)=>mix(PAL.deep,PAL.violet,.25+.25*Math.sin(v*9)));
      const C=[[.5,.16],[.28,.42],[.72,.5],[.42,.74],[.66,.9]];x.strokeStyle=rgb(PAL.gold);x.lineWidth=W*.03;x.beginPath();C.forEach(([u,v],i)=>i?x.lineTo(u*W,v*H):x.moveTo(u*W,v*H));x.stroke();
      C.forEach(([u,v],i)=>{const r=W*(.15-.01*i);piece(x,W,()=>{x.arc(u*W,v*H,r,0,TAU);},[PAL.sky,PAL.green,PAL.amber,PAL.ruby,PAL.blue][i]);
        for(let k=-1;k<=1;k++)piece(x,W,()=>{x.rect(u*W+k*r*.42-r*.1,v*H-r*(.9+.3*(k===0)),r*.2,r*(.95+.3*(k===0)));},PAL.white);});band(x,W,H,.04);},
    // THE DOME: a city under a dome of light, the people inside, hands joined
    dome:(x,W,H)=>{mosaic(x,W,H,7,(u,v)=>v<.12?PAL.green:mix(PAL.deep,PAL.blue,.5));
      for(let k=0;k<4;k++){x.beginPath();x.arc(W/2,H*.62,W*(.46-k*.06),Math.PI,0);x.strokeStyle=rgb(k%2?PAL.sky:PAL.pale,k*8);x.lineWidth=W*.04;x.stroke();x.strokeStyle=LEAD;x.lineWidth=Math.max(1.5,W/110);x.stroke();}
      for(let k=0;k<5;k++)piece(x,W,()=>{const cx=W*(.26+k*.12),h=H*(.1+.05*(k%2)+.04*(k===2));x.rect(cx-W*.035,H*.62-h,W*.07,h);},PAL.pale,10);
      for(let k=0;k<4;k++)figure(x,W,W*(.23+k*.18),H*.86,W*.07,k%2?PAL.amber:PAL.ruby,'stand');sun(x,W,W/2,H*.15,W*.3,12);band(x,W,H,.04);},
    // the roses: twelve around a light: petals, then the people kneeling in medallions, all turned in, then a ring of small lights
    roseSun:(x,W,H)=>{const c=W/2;mosaic(x,W,H,9,(u,v)=>{const d=Math.hypot(u-.5,v-.5);return d<.22?PAL.ruby:d<.36?PAL.blue:d<.44?(Math.floor(Math.atan2(v-.5,u-.5)/TAU*24+24)%2?PAL.green:PAL.violet):PAL.deep;});
      for(let k=0;k<12;k++){const a=k/12*TAU,a1=(k+.5)/12*TAU;piece(x,W,()=>{x.moveTo(c+Math.cos(a)*W*.12,c+Math.sin(a)*W*.12);x.quadraticCurveTo(c+Math.cos(a1)*W*.3,c+Math.sin(a1)*W*.3,c+Math.cos(a+TAU/12)*W*.12,c+Math.sin(a+TAU/12)*W*.12);x.closePath();},k%2?PAL.amber:PAL.ruby,10);
        const mx=c+Math.cos(a1)*W*.29,my=c+Math.sin(a1)*W*.29;piece(x,W,()=>{x.arc(mx,my,W*.065,0,TAU);},PAL.blue,10);
        x.save();x.translate(mx,my);x.rotate(a1+Math.PI/2);figure(x,W,0,W*.04,W*.03,PAL.pale,'kneel',1);x.restore();}
      sun(x,W,c,c,W*.13,12);},
    // ...and the second rose: eight rings of order round their tower, white on gold
    roseOrder:(x,W,H)=>{const c=W/2;mosaic(x,W,H,9,(u,v)=>{const d=Math.hypot(u-.5,v-.5),a=Math.atan2(v-.5,u-.5);return d<.16?PAL.gold:d<.3?(Math.floor(a/TAU*8+8)%2?PAL.blue:PAL.violet):d<.4?(Math.floor(a/TAU*16+16)%2?PAL.amber:PAL.ruby):PAL.deep;});
      for(let k=0;k<8;k++){const a=(k+.5)/8*TAU;piece(x,W,()=>{x.arc(c+Math.cos(a)*W*.35,c+Math.sin(a)*W*.35,W*.045,0,TAU);},PAL.white);}
      piece(x,W,()=>{x.moveTo(c-W*.06,c+W*.13);x.lineTo(c+W*.06,c+W*.13);x.lineTo(c+W*.035,c-W*.1);x.lineTo(c-W*.035,c-W*.1);x.closePath();},PAL.pale,14);
      piece(x,W,()=>{x.moveTo(c-W*.035,c-W*.1);x.lineTo(c+W*.035,c-W*.1);x.lineTo(c,c-W*.14);x.closePath();},PAL.white);}};
  const TEX={},AVG={};
  function tex(kind){if(TEX[kind])return TEX[kind];const rose=kind.startsWith('rose'),W=Math.round((rose?512:256)*S),H=Math.round((rose?512:768)*S);
    const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.save();outline(x,rose?'rose':'lancet',W,H);x.clip();DES[kind](x,W,H);x.restore();
    // the frame: heavy lead round the edge, a pale stone lip inside it
    outline(x,rose?'rose':'lancet',W,H);x.strokeStyle=LEAD;x.lineWidth=W*.05;x.stroke();x.strokeStyle='rgba(236,226,200,.9)';x.lineWidth=W*.012;x.stroke();
    // its average colour, for the pool of light it throws
    {const d=x.getImageData(0,0,W,H).data;let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=64){if(d[i+3]<128)continue;r+=d[i];g+=d[i+1];b+=d[i+2];n++;}AVG[kind]=new THREE.Color(r/n/255,g/n/255,b/n/255);}
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=coarse?2:8;return TEX[kind]=t;}
  // every window of a design goes into one mesh; the glass glows (lit from within, like the stone), and is solid where the lead edge is
  const M_={};
  function add(kind,w,h,mat){(M_[kind]||(M_[kind]=new Merger())).add(new THREE.PlaneGeometry(w,h),mat,C(0xffffff));}
  // a gold thread round the window, just proud of the wall (a lancet: up both sides and over the point; a rose: a ring)
  function rim(p,nrm,w,h,rose,tilt){tilt=tilt||0;const t=new THREE.Vector3(nrm.z,0,-nrm.x),up=new THREE.Vector3(0,Math.cos(tilt),0).addScaledVector(nrm,-Math.sin(tilt)),o=p.clone().addScaledVector(nrm,.1),P=[],at=(dx,dy)=>o.clone().addScaledVector(t,dx).addScaledVector(up,dy);
    if(rose){const r=w/2+.14;for(let k=0;k<=32;k++){const a=k/32*TAU;P.push(at(Math.cos(a)*r,Math.sin(a)*r));}}
    else{// the lancet as the texture draws it: straight sides up to the spring (.213 h over the middle), two arcs of radius w meeting at the point
      const e=.14,hw=w/2+e,ys=.213*h,k=(h/w)/3*(1+e/w);
      P.push(at(-hw,-h/2-e),at(-hw,ys));for(let i=1;i<=8;i++){const a=Math.PI-i/8*Math.PI/3;P.push(at(hw+Math.cos(a)*2*hw,ys+Math.sin(a)*2*hw*k));}
      for(let i=7;i>=0;i--){const a=i/8*Math.PI/3;P.push(at(-hw+Math.cos(a)*2*hw,ys+Math.sin(a)*2*hw*k));}P.push(at(hw,-h/2-e));}
    goldLine(sg,P,.16);}
  // place one window: p its centre (on the wall's face), nrm the way it faces, w x h; a tilt (radians, about its own x) for leaning walls
  function place(kind,p,nrm,w,h,tilt){const ry=Math.atan2(nrm.x,nrm.z),m=M(p.x+nrm.x*.12,p.y,p.z+nrm.z*.12,0,ry,0).multiply(M(0,0,0,-(tilt||0),0,0));tex(kind);add(kind,w,h,m);rim(p,nrm,w,h,kind.startsWith('rose'),tilt);}
  // a soft pool of a window's colour on the floor in front of it (inside the tower)
  const pools=new Merger();const poolTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
  function pool(kind,p,nrm,y){const g=new THREE.PlaneGeometry(3.2,4.2);g.rotateX(-Math.PI/2);pools.add(g,M(p.x+nrm.x*2.6,y+.04,p.z+nrm.z*2.6,0,Math.atan2(nrm.x,nrm.z),0),AVG[kind]||C(0xffffff));}
  function build(parentFor){for(const k in M_){const mat=new THREE.MeshBasicMaterial({map:TEX[k],vertexColors:true,color:C(0xffffff).multiplyScalar(coarse?.95:1.0),toneMapped:false,alphaTest:.5,side:THREE.DoubleSide});
      const me=new THREE.Mesh(M_[k].build(),mat);(parentFor?parentFor(k):scene).add(me);}
    if(pools.p.length){const pm=new THREE.Mesh(pools.build(),new THREE.MeshBasicMaterial({map:poolTex,vertexColors:true,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-4}));scene.add(pm);}}
  return{place,pool,build,tex,AVG,DES:Object.keys(DES)};})();
// where the glass goes (Nov 16): the plaza's arcades, the halls' ends, the long window up the tower's slot, the stair's wall, the dome room
{const L=['light','tower','ranks','worlds','dome'];let li=0;
 for(const A of PLAZA_GLASS){if(A.h<20)continue;for(let u=A.u0+6;u<A.u1-4;u+=12){const p=plzXZ(u,A.v),n=V3w(-PLZ_L.x*A.sd,0,-PLZ_L.z*A.sd);GLASS.place(L[li++%L.length],V3w(p.x,A.y+A.h*.62,p.z),n,3,9.3);}}
 for(const H of HALL_GLASS)GLASS.place(li++%2?'roseOrder':'roseSun',H.p,H.n,H.r*2,H.r*2);
 {const lean=.105,y0=80,y1=136,ym=(y0+y1)/2;GLASS.place('tower',V3w(0,ym,linerR(ym)+1.6),V3w(0,0,1),7,y1-y0,Math.atan(lean));GLASS.place('roseSun',V3w(0,y1+7,linerR(y1+7)+1.6),V3w(0,0,1),9,9,Math.atan(lean));}
 for(const deg of[100,148,196,248,268]){const a=deg*DEG,y=stairY(a),r=linerR(y+5.2)-.12,p=spiralPt(a,r),nrm=V3w(-Math.sin(a),0,-Math.cos(a)),k=L[li++%L.length];
   GLASS.place(k,V3w(p.x,y+5.2,p.z),nrm,2.1,6.1,-Math.atan(.105));const q=spiralPt(a,stairR1(a));GLASS.pool(k,V3w(q.x,y,q.z),nrm,y);}
 for(let k=0;k<10;k++){const a=(k+.5)/10*TAU;if(a>CAR.a0-.2&&a<CAR.a1+.2)continue;const y=TOPY+9,p=spiralPt(a,linerR(y)-.1);GLASS.place(k%2?'ranks':'light',V3w(p.x,y,p.z),V3w(-Math.sin(a),0,-Math.cos(a)),3.4,12,-Math.atan(.105));}
 GLASS.build();}

/* ---------- the war over the city: a red Herald warship standing off to the north-east, firing down into the streets; fires where
   it has hit; amber guns on the wall shooting back. (The ships you fight are in js/pathfinder3/02-air.js) ---------- */
const WARSHIP=(()=>{const K=SHIPKIT.harrower(),g=new THREE.Group();g.add(new THREE.Mesh(K.geo,fleetHullMat(panelTex)),new THREE.Mesh(K.glowGeo,fleetGlowMat(0xff3a1a,1.8)));
  K.geo.computeBoundingBox();const L=K.geo.boundingBox.max.z-K.geo.boundingBox.min.z;g.scale.setScalar(230/L);g.position.set(380,260,-560);g.lookAt(0,120,0);g.rotateY(Math.PI);
  MODELS.swapShip(g,'harrower',{ref:K.geo,tint:0xff6a5a});g.traverse(o=>{if(o.isMesh)o.castShadow=false;});scene.add(g);return{g,cool:3,on:true};})();
const FIRES=[];
{for(const [x,z,s] of[[150,-120,1],[-210,80,1.2],[60,240,.8],[260,140,.9],[-120,-260,1.1],[-300,-80,.9],[40,-300,1],[190,310,.7]]){
  const l=new THREE.PointLight(C(0xff7a2a),2*s,55*s,1.6);l.position.set(x,14,z);scene.add(l);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xff8a3a).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.8}));sp.scale.setScalar(40*s);sp.position.set(x,10,z);scene.add(sp);
  FIRES.push({x,z,s,l,sp});}}
// the war map, painted (see WARMAP). Its own hash for the scattered marks, never rng(): the level's random sequence is untouched
(function paintWarMap(){const W=WARMAP,x=W.cv.getContext('2d'),S=512,k=S/W.size,px=v=>(v/W.size+.5)*S;
  x.fillStyle='#000';x.fillRect(0,0,S,S);x.globalCompositeOperation='lighter';
  const blob=(cx,cz,r,rr,gg)=>{const g=x.createRadialGradient(px(cx),px(cz),0,px(cx),px(cz),Math.max(1,r*k));
    g.addColorStop(0,`rgba(${rr},${gg},0,1)`);g.addColorStop(.55,`rgba(${rr*.55|0},${gg*.55|0},0,1)`);g.addColorStop(1,'rgba(0,0,0,1)');x.fillStyle=g;x.beginPath();x.arc(px(cx),px(cz),r*k,0,7);x.fill();};
  const hs=i=>{const v=Math.sin(i*91.3458+17.1)*47453.5453;return v-Math.floor(v);};
  const inCity=(cx,cz)=>{const rr=Math.hypot(cx,cz);return rr>TW.r+4&&rr<WR-WT-6;};
  // 1 · rust bleeding from every wreck, a little soot under it
  for(const H of W.hulks){blob(H.x,H.z,H.r*.9+5,200,60);for(let i=0;i<3;i++){const a=hs(H.x*3.1+i)*6.283,d=H.r*.5+hs(H.z*1.7+i)*5;blob(H.x+Math.cos(a)*d,H.z+Math.sin(a)*d,2+hs(H.x+H.z+i)*3,140,0);}}
  // 2 · scorch round the fires, and where the warship's shots have come down (fainter, smaller, all over)
  for(const F of FIRES){blob(F.x,F.z,22*F.s,70,230);blob(F.x,F.z,12*F.s,60,120);}
  for(let i=0;i<70;i++){const a=hs(i+500)*6.283,r=Math.sqrt(hs(i+700))*(WR-WT-10),cx=Math.sin(a)*r,cz=Math.cos(a)*r;if(!inCity(cx,cz))continue;blob(cx,cz,3+hs(i+900)*6,30,150+hs(i+1100)*80|0);}
  // 3 · stains scattered all over the city's ground: rust in drifts and runs, some with a little grime
  for(let i=0;i<1000;i++){const a=hs(i+1300)*6.283,r=Math.sqrt(hs(i+1500))*(WR-WT-10),cx=Math.sin(a)*r,cz=Math.cos(a)*r;if(!inCity(cx,cz))continue;
    const n=1+(hs(i+1700)*3|0);for(let j=0;j<n;j++){const b=hs(i*7+j+1900)*6.283,d=j*(2+hs(i+j+2100)*4);blob(cx+Math.cos(b)*d,cz+Math.sin(b)*d,2+hs(i*3+j+2300)*6,120+hs(i+j+2500)*120|0,hs(i+2700)<.3?70:0);}}
  W.tex.needsUpdate=true;})();
/* ---------- the merged meshes ---------- */
const wreckMat=(()=>{const L0=(f,srgb)=>{const t=TEXL.load('img/tex/metal020'+f+'-'+TSUF+'.jpg');if(srgb)t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=coarse?2:8;return t;};
  return new THREE.MeshStandardMaterial({map:L0('',true),normalMap:L0('-n',false),normalScale:new THREE.Vector2(.8,.8),vertexColors:true,roughness:.72,metalness:.4});})();   // Metal020, rusted steel
{const a=new THREE.Mesh(sm.build(),stoneMat);a.castShadow=a.receiveShadow=true;scene.add(a);scene.add(new THREE.Mesh(sg.build(),goldMat));
 if(wm.p.length){const b=new THREE.Mesh(wm.build(),wreckMat);b.castShadow=b.receiveShadow=true;scene.add(b);}
 {const u1=new THREE.Mesh(um.build(),stoneInMat);u1.receiveShadow=true;scene.add(u1);if(ug.p.length)scene.add(new THREE.Mesh(ug.build(),goldMat));}
 if(wg.p.length){const w=new THREE.Mesh(wg.build(),new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));scene.add(w);}}   // (the barracks' banners)
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
      float rip=.5+.5*sin(h*60.0-uT*2.4+sin(atan(vP.z,vP.x)*5.0+uT*.7)*2.0);   /* (Nov 9) light running up through the shell */
      vec3 c=vec3(.55,.72,1.0)*(cell*.2+fres*.42+lines*.22+.05+rip*.05*(1.0-cell))+vec3(1.0,.86,.55)*cell*fres*.25+vec3(1.0,.95,.85)*front*1.6+vec3(.7,.85,1.0)*smoothstep(.04,0.0,h)*.9;
      gl_FragColor=vec4(c*(1.0-gone)*fl*min(1.0,hold+.15),1.0);}`}));
  m.visible=false;m.renderOrder=2;scene.add(m);
  // the pillar of light up the shaft and out of the crown
  /* (Nov 9) a shaft of light, not a white wall: brightest down its middle, falling off to nothing at its edges, a slow pulse climbing it
     (bm.opacity still drives it, as the old plain material's did) */
  const bm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,uniforms:{op:{value:0},c:{value:C(0xc8d8ff)},uT:U.uT},
    vertexShader:'varying vec3 vN;varying vec3 vV;varying float vY;void main(){vY=position.y;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform float op,uT;uniform vec3 c;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float e=pow(abs(dot(normalize(vN),vV)),3.0);float p=.75+.25*sin(vY*.08-uT*4.0);gl_FragColor=vec4(c*e*p*op*1.5,1.);}'});
  Object.defineProperty(bm,'opacity',{get(){return bm.uniforms.op.value;},set(v){if(bm.uniforms)bm.uniforms.op.value=v;},configurable:true});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.6,TW.h-TOPY+40,24,1,true),bm);
  beam.position.y=TOPY+(TW.h-TOPY+40)/2;scene.add(beam);
  return{m,U,beam,k:0,f:1,flick:0};})();

/* ---------- light, dust ---------- */
const helmLamp=new THREE.PointLight(C(0xd8e6ff),0,24,1.5);scene.add(helmLamp);
function updateLights(dt,T,pos){CITY.t.value=T;WALL.skinU.uT.value=T;TOWER.doorU.uT.value=T;TOWER.floorU.uT.value=T;DOME.U.uT.value=T;skyU.uT.value=T;
  /* (Oct 27, Bryce: "make sure that explosion effect from the bomb that makes the marks on the ground doesn't stay longer than it should"):
     these used to burn at full size forever, a 40-55 m glow standing in the street like an explosion frozen in place. Now a fire is a
     hit: it flares with a blast, dies down over about 3.5 s, and then only smoulders on its scorch mark (WARMAP) until the next shot
     lands there 14-26 s later. Its light only changes brightness (never added or removed, so nothing recompiles mid-fight). */
  for(const F of FIRES){if(F.t==null){F.t=2+((F.x*.37+F.z*.11)%1+1)%1*20;F.fl=0;}
    F.t-=dt;if(F.t<=0){F.t=R(14,26);F.fl=1;const q=new THREE.Vector3(F.x,3,F.z);boom(q,26*F.s,0xff8a3a,1.2);boom(q,12*F.s,0xfff0d0,.4);for(let k=0;k<3;k++)puff(q.clone().add(new THREE.Vector3(R(-6,6),R(0,6),R(-6,6))),R(10,16)*F.s,6);
      if(typeof sfx!=='undefined'&&sfx.blast&&Math.hypot(P.pos.x-F.x,P.pos.z-F.z)<160)sfx.blast(q);}
    F.fl=Math.max(0,F.fl-dt/3.5);const f=.75+.25*Math.sin(T*7+F.x)+.12*Math.sin(T*17+F.z),e=.12+.88*F.fl*F.fl;
    F.l.intensity=2*F.s*f*e;F.sp.scale.setScalar((7+33*F.fl)*F.s);F.sp.position.y=2.5+7.5*F.fl;F.sp.material.opacity=(.4+.3*f)*(.45+.55*F.fl);
    if(rng()<(.01+.05*F.fl)*F.s)puff(new THREE.Vector3(F.x+R(-4,4),4+8*F.fl,F.z+R(-4,4)),R(6,14),6);}
  for(const S0 of SMOLDER){S0.sp.material.opacity=.45+.25*Math.sin(T*7+S0.x)*Math.sin(T*3.3+S0.z);if(rng()<.04*S0.k)puff(new THREE.Vector3(S0.x+R(-2,2),S0.y+4,S0.z+R(-2,2)),R(6,12),6);}
  const inT=Math.hypot(pos.x,pos.z)<TW.r;helmLamp.intensity=inT?0:0;}
const DUST_N=coarse?380:900,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,18),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.12,color:C(0xd8e0ff),transparent:true,opacity:.35,depthWrite:false}));scene.add(dust);dust.material.visible=false;/* (Nov 16, Bryce) hidden: floating specks/mist, smoother on iPhone */

/* Nov 9 2026 (the graphics overhaul): the finishing pass (js/shared/grade.js); Low skips it */
let composer=null,HQ=true;
try{if(typeof GRADE!=='undefined'){const F=GRADE.composer(renderer,scene,camera,{bloom:[.6,.5,.86],grade:{gam:2.2,contrast:1.12,sat:1.06,vig:.42,grain:coarse?.022:.03,fringe:coarse?0:.0015,shadow:[.0,.012,.04],high:[.03,.012,-.012]}});composer=F.on?F:null;}}catch(e){composer=null;}
try{const q=localStorage.getItem('elyra.quality');if(q)HQ=q!=='low';}catch(_){}
function setQuality(hq){HQ=hq;try{localStorage.setItem('elyra.quality',hq?'high':'low');}catch(_){}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,hq?(coarse?1.6:1.75):(coarse?1.15:1)));renderer.shadowMap.enabled=true;
  if(composer)composer.setSize(innerWidth,innerHeight);else renderer.setSize(innerWidth,innerHeight);$('quality').textContent=hq?'Quality: high':'Quality: low';}
$('quality').addEventListener('click',()=>{setQuality(!HQ);$('quality').blur();});
setQuality(HQ);
function renderFrame(){if(composer&&HQ){try{composer.render();return;}catch(e){composer=null;}}renderer.render(scene,camera);}
addEventListener('resize',()=>{if(composer)composer.setSize(innerWidth,innerHeight);else renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
{const mb=$('menuBtn'),vw=$('views');const set=o=>{vw.classList.toggle('open',o);mb.setAttribute('aria-expanded',o?'true':'false');};
 mb.addEventListener('click',e=>{e.stopPropagation();set(!vw.classList.contains('open'));mb.blur();});
 vw.addEventListener('click',e=>{if(e.target.closest('button,a'))setTimeout(()=>set(false),250);});
 renderer.domElement.addEventListener('pointerdown',()=>set(false));addEventListener('keydown',e=>{if(e.code==='Escape')set(false);});}
function flashScreen(a){const f=$('flash');f.style.transition='none';f.style.opacity=a;requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity=0;});}
// js/origin/03-play.js reaches for these on the Mountain; there is no tunnel below this map
const BLEN=0;function belowD(){return 1;}function belowS(){return 0;}function belowPt(s,o){return(o||new THREE.Vector3());}function belowFloor(){return 0;}
const HOLLOW_GLOW=HOST_GLOW;
setLook('night');

/* Bryce's Nov 10 props (js/shared/furnish.js), moved for the Nov 16 remodel: marble columns framing the top of the plaza before Tower A,
   weathered pillars in the undercroft's halls, broken arches on the approach. Off the way (js/shared/finds.js): a Remnant carving in
   the cistern hall, a data pad on the plaza's second tier (the footage log), a Remnant cache out on the approach. */
if(typeof FURN!=='undefined'){const p=(u,v)=>plzXZ(u,v);const P=[];
  for(const [u,v] of[[90,-18],[90,18],[100,-18],[100,18]]){const q=p(u,v);P.push({f:'greek-pillar',x:+q.x.toFixed(2),z:+q.z.toFixed(2),s:1.4,solid:'r'});}
  for(const H of HALLS)for(const a of[.9,3.6]){P.push({f:'stone-pillar',x:+(H.x+Math.sin(a)*(H.r-5)).toFixed(2),z:+(H.z+Math.cos(a)*(H.r-5)).toFixed(2),ry:a,solid:'r'});}
  P.push({f:'stone-arch-ruins',x:40,z:842,ry:1.1},{f:'stone-arch-ruins',x:-120,z:690,ry:2.3});
  FURN.place(P);}
if(typeof FIND!=='undefined'){const H=HALLS[0],q=plzXZ(34,-28);
  FIND.add({kind:'mural',x:+(H.x+Math.sin(2.4)*(H.r-1.2)).toFixed(2),z:+(H.z+Math.cos(2.4)*(H.r-1.2)).toFixed(2),ry:2.4+Math.PI,tint:0xd0c8bc,lines:[['Thorne','This one isn’t defaced. The Host never came down this far.',3.6],
    ['Thorne','The ring again, over this city. The red ones inside it this time. Whole. Not burning.',4.8],['Captain Rhen','Then whatever we’re here for... it’s that ring.',3.6]]});
  FIND.add({kind:'log',f:'cinema-camera',x:+q.x.toFixed(2),z:+q.z.toFixed(2),ry:4.06,title:'Pathfinder helmet recorder',lines:[['Recovered log','Landry, recording. Rhen says log everything. So: white stone, no wind, no birds.',5],
    ['Recovered log','A red ship came low over us an hour ago and didn’t fire. I think it was showing us the way in.',5]]});
  FIND.add({kind:'cache',x:96,z:858,ry:4.06,marks:50,where:'The White City'});}

/* ---------- the land outside the wall (Nov 17 2026, Bryce: "that outside needs a complete 1,000,000% overhaul ... it is just flat
   ground"): js/shared/landscape.js dresses the desert round the approach. Astraea was not always a desert: dry riverbeds and lakebeds
   with their old shorelines, petrified trees, the bones of great animals and the ruins of whoever lived by the water; and what still
   lives here: dry grass, thornbush, succulents, column cacti, and lichen that glows before dawn. Mesas, buttes, hoodoos, needles and
   arches stand off in the dunes. Nothing of it inside the wall or in the trench ---------- */
try{if(typeof LANDSCAPE!=='undefined')LANDSCAPE.build({scene,biome:'astraea',seed:1031,phone:coarse,night:true,reach:1100,
  path:APPROACH,groundY:meshY,walkD:(x,z)=>{const d=playD(x,z);return d;},
  keep:(x,z)=>Math.hypot(x,z)>WR+WT+8&&R_TRENCH.f(x,z).d>5&&!(Math.abs(x)<GATE.r+30&&z>WR&&z<WR+140)});}catch(e){console.warn('landscape',e);}
