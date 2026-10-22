/* Elyra · Archive 01 · The Mountain — the world: dusk over the Hollow, the Hollow King's fortress carved into a mountain.
   A landing zone in the south; north of it the canyon splits around a mountain ridge into two canyons, west and east, that meet
   again at the courtyard under the cliff gate. Passes cut through the ridge join them: two tunnels and one Hollow door.
   Units are metres; the player is 1.9 m tall. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(1101);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.6:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
window.ELYRA_RENDERER=renderer;   // the prologue borrows it (one WebGL context per page)
$('app').appendChild(renderer.domElement);
MODELS.preload(['michael','marine','engineer','rifle','harbinger','civilian','host-trooper','hollow-king','elias']);

const scene=new THREE.Scene();
const FOG=C(0x6a4256);
scene.fog=new THREE.FogExp2(FOG,.00135);scene.background=FOG;
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,6000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();

/* ---------- dusk sky: a low red sun in the west, purple overhead, a bank of lit cloud along the horizon,
   a great banded moon low in the east and the first stars ---------- */
const sunDir=new THREE.Vector3(-.82,.2,-.36).normalize();
const sky=new THREE.Mesh(new THREE.SphereGeometry(5000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{sunDir:{value:sunDir},hor:{value:C(0xe0784a)},mid:{value:C(0x8a3a5a)},zen:{value:C(0x1c1230)},uT:{value:0},night:{value:0},photo:{value:null},photoK:{value:0},photoU:{value:0},photoExp:{value:1}},
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,mid,zen;uniform float uT,night,photoK,photoU,photoExp;uniform sampler2D photo;
  float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.0,a=.5;for(int i=0;i<5;i++){s+=ns(p)*a;p=p*2.03+vec2(17.0,-9.0);a*=.5;}return s;}
  void main(){vec3 d=normalize(vDir);float y=max(d.y,0.0);
    vec3 c=mix(hor,mid,smoothstep(0.0,0.18,y));c=mix(c,zen,smoothstep(0.15,0.75,y));
    float s=max(dot(d,sunDir),0.0);c+=vec3(1.0,.6,.35)*pow(s,8.0)*.5*(1.0-night)+vec3(1.0,.8,.5)*pow(s,300.0)*2.0*(1.0-night);
    // stars, strongest high up
    vec2 sp=floor(d.xz/(d.y+.25)*260.0);float st=step(.9965,hs(sp))*smoothstep(.12,.6,d.y)*(.35+.65*hs(sp+3.1));c+=vec3(st)*(.55+night*.9)*(1.0-photoK);
    // a photographed sky (Bryce's HDRIs, tonemapped to JPG): the real sky replaces the painted one; the moon and its ring still draw over it
    if(photoK>0.0){float el=asin(clamp(d.y,0.0,1.0))/1.5707963;vec2 pu=vec2(atan(d.z,d.x)/6.2831853+.5+photoU,mix(.66,1.0,el));vec3 pc=pow(texture2D(photo,pu).rgb,vec3(2.2))*photoExp;pc=pc/(1.0+pc*.8);c=mix(c,pc,photoK*smoothstep(0.0,.1,d.y));}   // sky half only (the photos' Earth hills and bushes never show), highlights compressed
    // the banded moon, low in the east, lit from the sun's side
    vec3 md=normalize(vec3(.78,.27,-.5));float mc=dot(d,md);
    if(mc>.9855){vec3 up=vec3(0,1,0),rx=normalize(cross(md,up)),ry=cross(rx,md);vec2 q=vec2(dot(d,rx),dot(d,ry))/.17;float r=length(q);
      vec3 n=normalize(rx*q.x+ry*q.y+md*sqrt(max(0.0,1.0-r*r)));float lit=smoothstep(-.15,.4,dot(n,sunDir));
      float band=.5+.5*sin(q.y*22.0+ns(q*6.0)*3.0);vec3 mcl=mix(vec3(.55,.42,.6),vec3(.85,.7,.72),band)*(.12+.88*lit);
      c=mix(c,mcl,smoothstep(1.0,.97,r)*.85);}
    // the moon's thin ring, edge-on
    vec3 md2=normalize(vec3(.78,.27,-.5));vec3 rx2=normalize(cross(md2,vec3(0,1,0))),ry2=cross(rx2,md2);vec2 q2=vec2(dot(d,rx2),dot(d,ry2))/.17;
    float ring=smoothstep(.06,0.0,abs(q2.y-q2.x*.18))*smoothstep(2.6,1.2,abs(q2.x))*step(1.0,length(q2))*step(0.0,dot(d,md2));c+=vec3(.5,.38,.5)*ring*.35;
    // a bank of cloud along the horizon, lit orange toward the sun
    vec2 uv=d.xz/(d.y+.09)*.9;float cl=fbm(uv*1.3+vec2(uT*.006,uT*.002));cl=smoothstep(.48,.82,cl)*smoothstep(-.02,.06,d.y)*(1.0-smoothstep(.22,.55,d.y));
    vec3 cc=mix(vec3(.16,.08,.14),vec3(1.05,.52,.36),pow(s,2.5)*(1.0-night))+vec3(.08,.04,.07);c=mix(c,cc,cl*.8*(1.0-photoK));
    if(d.y<0.0&&photoK<.5)c=mix(hor*.8,vec3(.25,.14,.18),smoothstep(0.0,-.2,d.y));gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
sky.renderOrder=-2;scene.add(sky);
/* the photographed skies: night over the landing and the canyons, dawn from the fall back on, Tide City's night through the deck window.
   setSky(mode) swaps the photo, the light and the fog together. Phones load the 1024-wide files. */
const SKY_FILES={night:'mountain-night',dawn:'mountain-dawn',deck:'tide-night'},skyTex={};let skyMode='';
const SKY_LOOK={
  night:{u:.0,exp:.9,fog:0x141a30,dens:.00115,sunC:0xa8bcff,sunI:1.15,hemiS:0x6a7ab0,hemiG:0x1c1626,hemiI:.8,moon:1,hor:0x2a3a6a,mid:0x121a38,zen:0x04060e},
  dawn:{u:-.52,exp:.9,fog:0x8a7a66,dens:.0008,sunC:0xffc890,sunI:2.0,hemiS:0x7a8aa8,hemiG:0x4a3a2c,hemiI:.5,moon:0,hor:0xe0b080,mid:0x8aa8d0,zen:0x3a64a8},
  deck:{u:.25,exp:.32,fog:0x0e1428,dens:.0005,sunC:0x9fb8ff,sunI:.35,hemiS:0xd8a8c8,hemiG:0x2a1a28,hemiI:.35,moon:1,hor:0x2a3a6a,mid:0x121a38,zen:0x04060e}};
function setSky(mode){const L=SKY_LOOK[mode];if(!L)return;skyMode=mode;const U=sky.material.uniforms;
  scene.fog.color.set(C(L.fog));scene.fog.density=L.dens;scene.background=scene.fog.color;U.hor.value.set(C(L.hor));U.mid.value.set(C(L.mid));U.zen.value.set(C(L.zen));U.night.value=L.moon;
  sun.color.set(C(L.sunC));sun.intensity=L.sunI;hemi.color.set(C(L.hemiS));hemi.groundColor.set(C(L.hemiG));hemi.intensity=L.hemiI;U.photoU.value=L.u;U.photoExp.value=L.exp;
  const f=SKY_FILES[mode];if(skyTex[f]){U.photo.value=skyTex[f];U.photoK.value=1;return;}U.photoK.value=0;
  new THREE.TextureLoader().load('img/sky/'+f+'-'+(coarse?'phone':'pc')+'.jpg',t=>{t.wrapS=THREE.RepeatWrapping;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;skyTex[f]=t;
    if(skyMode===mode){U.photo.value=t;U.photoK.value=1;}},undefined,()=>{});}
const hemi=new THREE.HemisphereLight(C(0xd8a8c8),C(0x2a1a28),.78);scene.add(hemi);
const sun=new THREE.DirectionalLight(C(0xffb08a),2.15);sun.position.copy(sunDir).multiplyScalar(600);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(sun.shadow.camera,{left:-80,right:80,top:80,bottom:-80,near:10,far:1400});sun.shadow.bias=-.0006;sun.shadow.normalBias=.05;
// a cool fill from the east so the shadowed side of the canyon is not a flat purple
const fill=new THREE.DirectionalLight(C(0x8aa0ff),.35);fill.position.set(400,200,-100);scene.add(fill);
// the shadow box follows the camera
function followSun(p){sun.position.copy(p).addScaledVector(sunDir,600);sun.target.position.copy(p);}

/* ---------- the map: landing zone (south), the split canyon road, the courtyard below the gate (north) ---------- */
const LZ={x:0,z:40,r:56},COURT={x:0,z:-362,r:50},GATE={x:0,z:-414};
const ROAD=[[0,10],[6,-40],[-12,-118],[10,-196],[-5,-272],[0,-325]],ROAD_W=19;
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
// the road as a path: s = metres along it from the landing zone, plus the sideways offset (positive = right, heading north)
const ROADS=[],ROAD_LEN=(()=>{let s=0;for(let i=0;i<ROAD.length-1;i++){const [ax,az]=ROAD[i],[bx,bz]=ROAD[i+1],l=Math.hypot(bx-ax,bz-az);ROADS.push({ax,az,bx,bz,l,s0:s,nx:-(bz-az)/l,nz:(bx-ax)/l});s+=l;}return s;})();
function roadSeg(x,z){let best=1e9,bs=0,bt=0,br=ROADS[0];for(const r of ROADS){const dx=r.bx-r.ax,dz=r.bz-r.az,t=clamp(((x-r.ax)*dx+(z-r.az)*dz)/(r.l*r.l),0,1),d=Math.hypot(x-r.ax-dx*t,z-r.az-dz*t);if(d<best){best=d;bs=r.s0+t*r.l;bt=t;br=r;}}return{s:bs,r:br,t:bt};}
function roadS(x,z){let bs=roadSeg(x,z).s;if(z>ROAD[0][1])bs=-(z-ROAD[0][1]);if(z<ROAD[ROAD.length-1][1])bs=ROAD_LEN+(ROAD[ROAD.length-1][1]-z);return bs;}
const _rp=new THREE.Vector3();
function roadPt(s,out){s=clamp(s,0,ROAD_LEN);out=out||_rp;for(const r of ROADS)if(s<=r.s0+r.l){const t=(s-r.s0)/r.l;return out.set(r.ax+(r.bx-r.ax)*t,0,r.az+(r.bz-r.az)*t);}const e=ROAD[ROAD.length-1];return out.set(e[0],0,e[1]);}
// the sideways direction at s, blended across the bends so the spine curves instead of kinking
function roadN(s){let nx=0,nz=0;for(const r of ROADS){const k=clamp(1-Math.max(0,Math.max(r.s0-s,s-(r.s0+r.l)))/14,0,1);nx+=r.nx*k;nz+=r.nz*k;}const l=Math.hypot(nx,nz)||1;return{x:nx/l,z:nz/l};}
function latOf(x,z){const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t;return(x-px)*r.nx+(z-pz)*r.nz;}
// two canyons. From the mouth (SPINE_S0) the road splits around a mountain ridge into a west and an east canyon, which meet again
// at the courtyard (SPINE_S1). laneC(s): how far each canyon's middle lies from the centre line; laneHalf(s): each canyon's half-width.
// Passes cut through the ridge at GAPS: two tunnels and the Hollow door. (The ridge was a thin spine once; the names stayed.)
const SPINE_S0=34,SPINE_S1=ROAD_LEN-40,SEP=27,LANE_W=8.5,GAPS=[{s:92,kind:'tunnel'},{s:162,kind:'door'},{s:232,kind:'tunnel'}],GAP_HALF=5.5,LANE=9.5;   // the passes are wide open cuts now (people got lost in the dark tunnels)
function laneC(s){return SEP*sstep(SPINE_S0,SPINE_S0+42,s)*sstep(SPINE_S1,SPINE_S1-42,s);}
function laneHalf(s){return LANE_W+(1-laneC(s)/SEP)*10;}
function spineAt(s){return laneC(s)>laneHalf(s)+.5&&!GAPS.some(g=>Math.abs(s-g.s)<GAP_HALF);}
/* ---------- below the Hollow: a tunnel that winds down under the mountain to a chamber. It is built far off the map (x -2400),
   so the canyon never sees it; playD and groundY hand anything west of x -1600 to these. Meshes in js/origin/06-below.js ---------- */
const BX=-2400,BNODES=[[0,0,0],[3,-1.2,-28],[-5,-3.5,-56],[2,-6,-86],[-4,-8.5,-116],[0,-10,-142],[0,-10,-156]].map(n=>({x:BX+n[0],y:n[1],z:n[2]})),
  BCH={x:BX,y:-10,z:-180,r:26},BFW=5;
const BSEGS=[];{let s=0;for(let i=0;i<BNODES.length-1;i++){const a=BNODES[i],b=BNODES[i+1],l=Math.hypot(b.x-a.x,b.z-a.z);BSEGS.push({a,b,l,s0:s});s+=l;}}
const BLEN=BSEGS.reduce((s,q)=>s+q.l,0);
function bSeg(x,z){let best=1e9,r=null;for(const q of BSEGS){const dx=q.b.x-q.a.x,dz=q.b.z-q.a.z,t=clamp(((x-q.a.x)*dx+(z-q.a.z)*dz)/(q.l*q.l),0,1),d=Math.hypot(x-q.a.x-dx*t,z-q.a.z-dz*t);if(d<best){best=d;r={q,t,d};}}return r;}
function belowD(x,z){const q=bSeg(x,z);let dc=Math.hypot(x-BCH.x,z-BCH.z)-BCH.r;dc=Math.max(dc,(BCH.z-11)-z);   // the chamber stops at the ledge over the water
  let d=Math.min(q.d-BFW,dc);if(z>-1)d=Math.max(d,z+1);return d;}
// along the way down: 0 at the door, BLEN where the tunnel opens into the chamber, more across it
function belowS(x,z){const q=bSeg(x,z),ch=Math.hypot(x-BCH.x,z-BCH.z);if(ch<BCH.r&&z<BNODES[BNODES.length-1].z)return BLEN+(BNODES[BNODES.length-1].z-z);return q.q.s0+q.t*q.q.l;}
function belowPt(s,out){out=out||new THREE.Vector3();if(s>=BLEN){const e=BNODES[BNODES.length-1];return out.set(e.x,BCH.y,e.z-(s-BLEN));}
  for(const q of BSEGS)if(s<=q.s0+q.l){const t=Math.max(0,s-q.s0)/q.l;return out.set(q.a.x+(q.b.x-q.a.x)*t,q.a.y+(q.b.y-q.a.y)*t,q.a.z+(q.b.z-q.a.z)*t);}return out.set(BCH.x,BCH.y,BCH.z);}
function belowFloor(x,z){const q=bSeg(x,z),y=q.q.a.y+(q.q.b.y-q.q.a.y)*q.t,ch=Math.hypot(x-BCH.x,z-BCH.z);return ch<BCH.r+4?lerp(BCH.y,y,sstep(BCH.r-6,BCH.r+4,ch)):y;}
const lerp=(a,b,u)=>a+(b-a)*u;
// distance outside the walkable area (negative inside): the landing zone, the courtyard, the two canyons and the passes between them
function playD(x,z){
  if(x<-1600)return belowD(x,z);
  let d=Math.min(Math.hypot(x-LZ.x,z-LZ.z)-LZ.r,Math.hypot(x-COURT.x,z-COURT.z)-COURT.r);
  const q=roadSeg(x,z),r=q.r,px=r.ax+(r.bx-r.ax)*q.t,pz=r.az+(r.bz-r.az)*q.t,lat=(x-px)*r.nx+(z-pz)*r.nz,along=Math.abs((x-px)*r.nz-(z-pz)*r.nx);
  const k=laneC(q.s),dl=Math.abs(Math.abs(lat)-k)-laneHalf(q.s);
  d=Math.min(d,Math.hypot(Math.max(0,dl),along)+Math.min(0,dl));
  for(const g of GAPS){const ds=Math.abs(q.s-g.s);if(ds<GAP_HALF+30)d=Math.min(d,Math.max(ds-GAP_HALF,Math.abs(lat)-k));}
  if(z<GATE.z+4)d=Math.max(d,(GATE.z+4)-z);   // the cliff face
  return d;
}
function groundY(x,z){if(x<-1600){const d=belowD(x,z),f=belowFloor(x,z);return d<=0?f:f+d*4;}
  const d=playD(x,z);
  if(d<=0)return .35*vnoise(x*.05,z*.05)+.25*vnoise(x*.3,z*.3)*sstep(-6,0,d);
  // the gate's recess: the mountain stops at the carved face, so the doors stand in the open (the slope used to bury them)
  if(Math.abs(x)<13&&z>GATE.z-9&&z<GATE.z+6)return .2;
  // canyon walls rise steeply for the first stretch (with ledges), then roll away into ridges; the Hollow's mountain towers behind the gate
  const r=ridged(x*.006,z*.006),r2=ridged(x*.0025+7,z*.0025-3);
  let h=Math.min(d*1.8+d*d*.01,55+r*45)+sstep(40,320,d)*(60+r2*230);
  h+=sstep(2,8,d)*sstep(26,12,d)*3.5*vnoise(x*.08,z*.08);   // broken ledges low on the walls
  // south of the canyon mouth the mountains give way to open desert, with low dunes
  const north=sstep(LZ.z+30,LZ.z-50,z);h=h*north+(1-north)*(4+9*vnoise(x*.012,z*.012)+3*vnoise(x*.04,z*.04))*sstep(0,30,d);
  if(z<GATE.z+40)h+=sstep(GATE.z+40,GATE.z-80,z)*(150+90*r)*sstep(260,60,Math.abs(x));
  return .35*vnoise(x*.05,z*.05)+h;}

/* ---------- rock: one material for the ground, the walls and the spine. Strata in the vertex colours, and a detail texture
   laid on from three sides (so cliffs are not smeared) with a second, larger scale to break up repeats ---------- */
function makeDetailTex(){const S=256,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),img=x.createImageData(S,S);
  const keep=seed;setSeed(777);
  const v=(px,py,f)=>{let s=0,a=.5;for(let o=0;o<5;o++){const k=f*Math.pow(2,o);s+=a*vnoise((px/S)*k,(py/S)*k);a*=.5;}return s;};
  for(let py=0;py<S;py++)for(let px=0;px<S;px++){
    // tileable: blend four offsets
    const fx=px/S,fy=py/S,a=v(px,py,8),b=v(px+S,py,8),cc=v(px,py+S,8),d=v(px+S,py+S,8);
    let n=(a*(1-fx)+b*fx)*(1-fy)+(cc*(1-fx)+d*fx)*fy;
    const grit=hash(px*7+1,py*13+5)*.22;n=n*.85+grit;const i=(py*S+px)*4,g=Math.max(0,Math.min(255,n*255));img.data[i]=img.data[i+1]=img.data[i+2]=g;img.data[i+3]=255;}
  x.putImageData(img,0,0);
  // cracks
  x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1;for(let k=0;k<26;k++){let px=rng()*S,py=rng()*S;x.beginPath();x.moveTo(px,py);for(let j=0;j<8;j++){px+=(rng()-.5)*22;py+=(rng()-.5)*22;x.lineTo(px,py);}x.stroke();}
  setSeed(keep);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
const detailTex=makeDetailTex();
function rockMaterial(opts){
  const m=new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.93,metalness:0},opts||{}));
  m.onBeforeCompile=sh=>{sh.uniforms.tDet={value:detailTex};
    sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader='uniform sampler2D tDet;varying vec3 vWP;varying vec3 vWN;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 bw=pow(abs(normalize(vWN)),vec3(4.0));bw/=(bw.x+bw.y+bw.z);
      float dt=texture2D(tDet,vWP.zy*.13).r*bw.x+texture2D(tDet,vWP.xz*.13).r*bw.y+texture2D(tDet,vWP.xy*.13).r*bw.z;
      float dl=texture2D(tDet,vWP.xz*.011+vec2(.3,.7)).r;
      float df=texture2D(tDet,vWP.xz*.6).r*bw.y+texture2D(tDet,vWP.zy*.6).r*bw.x+texture2D(tDet,vWP.xy*.6).r*bw.z;   // fine grit up close
      diffuseColor.rgb*=(.62+.7*dt)*(.82+.36*dl)*(.85+.3*df);`);};
  return m;}
const groundMat=rockMaterial();
/* the terrain itself wears Bryce's Poly Haven textures (img/tex): gravelly sand on the canyon floors with patches of river pebbles,
   excavated soil low on the walls, rock higher up. Laid on from three sides, tinted a little toward the strata colours. */
const TEXL=new THREE.TextureLoader(),TSUF=coarse?'phone':'pc';
function terrTex(n){const t=TEXL.load('img/tex/'+n+'-'+TSUF+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=coarse?2:8;return t;}
function terrainMaterial(){
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0});
  const U={tSand:{value:terrTex('sand')},tSoil:{value:terrTex('soil')},tRock:{value:terrTex('rock')},tPeb:{value:terrTex('pebbles')},tDet:{value:detailTex}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader='uniform sampler2D tSand,tSoil,tRock,tPeb,tDet;varying vec3 vWP;varying vec3 vWN;\n'+
      'vec3 dec(vec4 c){return pow(c.rgb,vec3(2.2));}\n'+
      'vec3 tri(sampler2D t,float s,vec3 bw){return dec(texture2D(t,vWP.zy*s))*bw.x+dec(texture2D(t,vWP.xz*s))*bw.y+dec(texture2D(t,vWP.xy*s))*bw.z;}\n'+
      sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 nW=normalize(vWN);vec3 bw=pow(abs(nW),vec3(4.0));bw/=(bw.x+bw.y+bw.z);
      float flatK=smoothstep(.6,.88,abs(nW.y));
      float pm=smoothstep(.5,.72,texture2D(tDet,vWP.xz*.0075).r);
      vec3 floorC=mix(dec(texture2D(tSand,vWP.xz*.16)),dec(texture2D(tPeb,vWP.xz*.22)),pm*.8);
      vec3 wallC=mix(tri(tSoil,.07,bw),tri(tRock,.045,bw),smoothstep(8.0,36.0,vWP.y));
      vec3 tc=mix(wallC,floorC,flatK);
      float far=smoothstep(140.0,420.0,length(vWP-cameraPosition));   // far hills: mostly the strata colours (no visible tiling)
      diffuseColor.rgb=mix(tc*mix(vec3(1.0),diffuseColor.rgb*2.2,.4)*1.15,diffuseColor.rgb*(.75+.5*dec(texture2D(tDet,vWP.xz*.011)).r),far*.7);`);};
  return m;}
const terrainMat=terrainMaterial();
// carved stone that wears the rock photo texture (the Hollow's face, its doors, the passes, the perches), tinted by the vertex colours
function rockTexMaterial(scale,boost,plain){const m=new THREE.MeshStandardMaterial({vertexColors:!plain,color:plain?C(0x3a302c):0xffffff,roughness:.9,metalness:.05});const U={tRock:{value:terrTex('rock')}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader='varying vec3 vWP;varying vec3 vWN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader='uniform sampler2D tRock;varying vec3 vWP;varying vec3 vWN;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 bw=pow(abs(normalize(vWN)),vec3(4.0));bw/=(bw.x+bw.y+bw.z);float k=${(scale||.05).toFixed(3)};
      vec3 tc=pow(texture2D(tRock,vWP.zy*k).rgb,vec3(2.2))*bw.x+pow(texture2D(tRock,vWP.xz*k).rgb,vec3(2.2))*bw.y+pow(texture2D(tRock,vWP.xy*k).rgb,vec3(2.2))*bw.z;
      diffuseColor.rgb=tc*mix(vec3(1.0),diffuseColor.rgb*${(boost||3).toFixed(2)},.7);`);};
  return m;}
// sandstone strata, matched to Bryce's cliff model (warm tan and rust, a little violet in the shadows of the bands)
const STRATA=[C(0x8a5e46),C(0x6a4a44),C(0x9a6c4e),C(0x5a4040),C(0x7e5644),C(0xa47a58)];
const _sc=new THREE.Color();
function strataColor(x,y,z,out){const k=y*.16+vnoise(x*.012,z*.012)*1.6+vnoise(x*.004,z*.004)*1.2,i=Math.floor(k),f=k-i;
  const a=STRATA[((i%6)+6)%6],b=STRATA[(((i+1)%6)+6)%6];return out.copy(a).lerp(b,sstep(.75,1,f));}

/* ---------- terrain: a grid that is fine over the canyon and coarse out in the hills ---------- */
{const step=(a,b,fine,lo,hi,coarseStep)=>{const out=[];let v=a;while(v<b){out.push(v);v+=(v>=lo&&v<hi)?fine:coarseStep;}out.push(b);return out;};
 const FINE=coarse?2.3:1.6;
 const xs=step(-1300,1300,FINE,-150,150,coarse?18:13),zs=step(-1470,1130,FINE,-500,140,coarse?18:13);   // finer out in the hills than before, so the ridges are less blocky
 const NX=xs.length,NZ=zs.length,pos=new Float32Array(NX*NZ*3),col=new Float32Array(NX*NZ*3);
 const sand=C(0x9a6a52),dust=C(0x7a5048),road=C(0x5a463e),tmp=new THREE.Color();
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=xs[i],z=zs[j],y=groundY(x,z),d=playD(x,z),k=(j*NX+i)*3;pos[k]=x;pos[k+1]=y;pos[k+2]=z;
   const n=vnoise(x*.08,z*.08);
   if(d<=0){tmp.copy(n<.5?sand:dust);if(d>-4)tmp.lerp(STRATA[1],.35);
     // a worn track down the middle of each canyon
     const s=roadS(x,z);if(s>0&&s<ROAD_LEN){const l=Math.abs(latOf(x,z));if(Math.abs(l-laneC(s))<2.2)tmp.lerp(road,.45);}
     tmp.multiplyScalar(.9+n*.2);}
   else{strataColor(x,y,z,tmp);tmp.lerp(C(0x5e4a52),sstep(60,240,y)*.45).lerp(dust,sstep(5,0,d)*.6);tmp.multiplyScalar(.78+n*.4);}
   col[k]=tmp.r;col[k+1]=tmp.g;col[k+2]=tmp.b;}
 const idx=new Uint32Array((NX-1)*(NZ-1)*6);let q=0;
 for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const a=j*NX+i,b=a+1,c=a+NX,d=c+1;idx[q++]=a;idx[q++]=c;idx[q++]=b;idx[q++]=b;idx[q++]=c;idx[q++]=d;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(new THREE.BufferAttribute(idx,1));
 g.computeVertexNormals();
 const m=new THREE.Mesh(g,terrainMat);m.receiveShadow=true;m.castShadow=false;scene.add(m);}

/* ---------- obstacles: rocks, barricades, crates. Circles for collision, cover and line of sight ---------- */
const OBST=[],BARS=[];
const rockMat=rockMaterial({vertexColors:false,color:C(0x6a5258),flatShading:true});
const metalMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.45,metalness:.55});
// cover rocks: low and of mixed sizes (the tall ones ate everyone's shots). They wear Bryce's cliff model once it has loaded.
const ROCKS=[];
function addRock(x,z,r){const ys=R(.35,.75);const g=new THREE.DodecahedronGeometry(r,1);const P=g.attributes.position;for(let i=0;i<P.count;i++){const k=.82+.36*hash(i*3+((x*7)|0),(z*5)|0);P.setXYZ(i,P.getX(i)*k,P.getY(i)*k,P.getZ(i)*k);}
  g.scale(1,ys,1);g.computeVertexNormals();const m=new THREE.Mesh(g,rockMat);m.position.set(x,groundY(x,z)+r*ys*.35,z);m.rotation.set(0,R(0,3),0);
  m.castShadow=m.receiveShadow=true;scene.add(m);OBST.push({x,z,r:r*.9,h:r*ys*1.5});ROCKS.push({m,x,z,r,ys});}
function addBarricade(x,z,ry,w){const m=new Merger(),d=C(0x2a3442),b=C(0x284c78),gd=C(0xd9b25a);
  m.add(boxUV(w,1.3,.7,2),M(0,.65,0),d);m.add(boxUV(w*.96,.12,.74,2),M(0,1.3,0),gd);m.add(boxUV(w*.3,.6,.72,2),M(0,.65,0),b);
  const o=new THREE.Mesh(m.build(),metalMat);o.position.set(x,groundY(x,z),z);o.rotation.y=ry;o.castShadow=o.receiveShadow=true;scene.add(o);
  // a barricade is a row of small circles for collision, and one segment (BARS) so walkers steer around the whole wall, not into its middle
  const n=Math.max(1,Math.round(w/1.4));for(let i=0;i<n;i++){const u=(i+.5)/n-.5;OBST.push({x:x+Math.cos(ry)*u*w,z:z-Math.sin(ry)*u*w,r:.75,h:1.3,bar:true});}
  BARS.push({ax:x-Math.cos(ry)*w/2,az:z+Math.sin(ry)*w/2,bx:x+Math.cos(ry)*w/2,bz:z-Math.sin(ry)*w/2,r:.75});}
function addCrate(x,z,s){const m=new Merger();m.add(boxUV(s,s,s,2),M(0,s/2,0),C(0x3a3a40));m.add(boxUV(s*1.02,s*.12,s*1.02,2),M(0,s*.85,0),C(0xd9b25a));
  const o=new THREE.Mesh(m.build(),metalMat);o.position.set(x,groundY(x,z),z);o.rotation.y=R(0,3);o.castShadow=o.receiveShadow=true;scene.add(o);OBST.push({x,z,r:s*.6,h:s});}
// along both canyons: tumbled rocks for cover
for(let s=26;s<ROAD_LEN-30;s+=9){for(const side of[-1,1]){if(rng()<.38)continue;const c=roadPt(s+R(-3,3)).clone(),n=roadN(s),L=laneHalf(s),off=side*(laneC(s)+R(-L+2.5,L-2.5));
  addRock(c.x+n.x*off,c.z+n.z*off,rng()<.6?R(.7,1.3):R(1.3,2.1));}}
for(let i=0;i<10;i++){const a=i/10*Math.PI*2;addRock(COURT.x+Math.cos(a)*R(30,44),COURT.z+Math.sin(a)*R(20,40)+8,R(.9,2));}
// the landing zone perimeter: Keeper barricades facing the canyon mouth, and supply crates
addBarricade(-14,8,0,7);addBarricade(14,8,0,7);addBarricade(-34,18,.6,6);addBarricade(34,18,-.6,6);addBarricade(0,-2,0,6);
for(const [x,z] of[[-22,30],[33,38],[-40,46],[42,52],[8,58],[-10,62]])addCrate(x,z,R(1.2,1.7));

/* ---------- the passes through the ridge: two tunnels roofed with rock ribs, and a Hollow door ---------- */
const SPINE_GLOW=[];
const lampPostMat=new THREE.MeshStandardMaterial({color:C(0x1c1824),roughness:.6,metalness:.6}),lampLensMat=new THREE.MeshBasicMaterial({color:C(FLEET_PURPLE).multiplyScalar(1.6)});
{const ribMat=rockMaterial({vertexColors:false,color:C(0x5a4248),flatShading:true});
 for(const g of GAPS){const c=roadPt(g.s).clone(),n=roadN(g.s),gy=groundY(c.x,c.z),yaw=Math.atan2(n.x,n.z),depth=2*(laneC(g.s)-laneHalf(g.s))+2;
   if(g.kind==='tunnel'){
     // rock ribs over the pass and a roof slab between them: a short dark tunnel through the ridge
     // an open cut through the ridge (it used to be a roofed tunnel): just a lamp at each end so you can find it from either canyon
     const tun=new THREE.Group();tun.position.set(c.x,gy,c.z);tun.rotation.y=yaw;scene.add(tun);
     // (they floated in the air as a bare purple dot: now each hangs on a Host lamp post at the side of the cut, with a small glow)
     for(const z of[-depth/2+1,depth/2-1]){const px=GAP_HALF-.6;
       const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.14,4.6,6),lampPostMat);post.position.set(px,2.3,z);tun.add(post);
       const arm=new THREE.Mesh(new THREE.BoxGeometry(.9,.1,.1),lampPostMat);arm.position.set(px-.4,4.5,z);tun.add(arm);
       const lens=new THREE.Mesh(new THREE.BoxGeometry(.28,.18,.28),lampLensMat);lens.position.set(px-.8,4.38,z);tun.add(lens);
       const l=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(FLEET_PURPLE).multiplyScalar(1.2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.45}));l.scale.setScalar(1.3);l.position.set(px-.8,4.3,z);tun.add(l);}}
   else{
     // the Hollow door: a silver frame with purple seams in the middle of the pass, its doors slid open
     const fm=new Merger(),gm=new Merger(),sv=C(0x8e909c),dk=C(0x231b28),W1=C(0xffffff),wd=GAP_HALF*2+1.2,H=6.4;
     fm.add(boxUV(wd,1.6,6.2,2),M(0,H+.8,0),dk);fm.add(boxUV(wd+.4,.4,6.4,2),M(0,H,0),sv);
     for(const s of[-1,1]){fm.add(boxUV(.8,H,6.2,2),M(s*(wd/2-.4),H/2,0),sv);gm.add(new THREE.BoxGeometry(.18,H-1,.18),M(s*(wd/2-.95),H/2,3.15),W1);gm.add(new THREE.BoxGeometry(.18,H-1,.18),M(s*(wd/2-.95),H/2,-3.15),W1);
       fm.add(boxUV(.5,H-.6,wd*.3,2),M(s*(wd/2-.2),(H-.6)/2,0),dk);}
     for(let k=0;k<5;k++)fm.add(new THREE.CylinderGeometry(0,.25,2.2,4),M(-wd/2+.8+k*(wd-1.6)/4,H+2.6,0),sv);
     gm.add(new THREE.BoxGeometry(wd-1.4,.2,.2),M(0,H-.5,3.2),W1);gm.add(new THREE.BoxGeometry(wd-1.4,.2,.2),M(0,H-.5,-3.2),W1);
     const fr=new THREE.Mesh(fm.build(),new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.6,metalness:.4}));fr.position.set(c.x,gy,c.z);fr.rotation.y=yaw;fr.castShadow=true;scene.add(fr);
     const gl=new THREE.Mesh(gm.build(),new THREE.MeshBasicMaterial({vertexColors:true,color:C(FLEET_PURPLE).multiplyScalar(2.2),toneMapped:false}));gl.position.copy(fr.position);gl.rotation.copy(fr.rotation);scene.add(gl);SPINE_GLOW.push(gl);}}}

/* ---------- the landing zone: a hex pad with lights ---------- */
{const pad=new THREE.Mesh(new THREE.CylinderGeometry(30,30,.25,6),new THREE.MeshStandardMaterial({map:panelTex,color:C(0x5a5e66),roughness:.8,metalness:.25}));
 pad.position.set(LZ.x,.12,LZ.z+12);pad.receiveShadow=true;scene.add(pad);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(29.6,.18,4,6),new THREE.MeshBasicMaterial({color:C(0x7fe3ff).multiplyScalar(2)}));ring.rotation.x=Math.PI/2;ring.rotation.z=Math.PI/6;ring.position.set(LZ.x,.3,LZ.z+12);scene.add(ring);}

/* ---------- Keeper ships on the pad ---------- */
// dropship from the design sheet: a boxy armoured hull, grey and blue, a rear ramp, four engine pods. About 24 m long, nose toward -z.
function keeperDropshipGeo(){const m=new Merger(),gm=new Merger(),hull=C(0x9aa3ae),dk=C(0x3a414b),bl=C(0x284c78),gd=C(0xd9b25a),U=4;
  m.add(boxUV(8,4.4,18,U),M(0,3.6,0),hull);m.add(boxUV(6.4,1.4,16,U),M(0,6.4,.5),dk);
  const nose=new THREE.CylinderGeometry(.6,4.2,6,4,1);nose.rotateY(Math.PI/4);nose.rotateX(-Math.PI/2);nose.scale(1,.7,1);m.add(nose,M(0,3.4,-12),hull);
  gm.add(new THREE.BoxGeometry(4.4,.8,2.4),M(0,4.6,-10.4,-.3,0,0),C(0x9ff0ff));
  for(const s of[-1,1]){m.add(boxUV(.2,1,17,U),M(s*4.1,4.4,0),bl);m.add(boxUV(.22,.25,17,U),M(s*4.12,5.3,0),gd);
    for(const z of[-5,5]){m.add(boxUV(2.4,2.4,5,U),M(s*6.4,2.6,z),dk);m.add(cylZ(1,1.1,1.2,10),M(s*6.4,2.6,z+3),hull);gm.add(new THREE.CircleGeometry(.8,10),M(s*6.4,2.6,z+3.65),C(0x7fe6ff));
      m.add(boxUV(.6,2.6,.6,U),M(s*3.4,1.2,z),dk);}}
  m.add(boxUV(7,.3,5,U),M(0,1.5,11.5,.35,0,0),dk);   // rear ramp
  return{geo:m.build(),glow:gm.build()};}
const DSG=keeperDropshipGeo(),ITC=interceptorGeo(PG.paint());
const dsGlow=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.6,1.6,1.6)});
const SHIPS=[];
for(const [x,z,ry] of[[-24,58,.25],[0,72,0],[24,58,-.25]]){const g=new THREE.Group();g.add(new THREE.Mesh(DSG.geo,metalMat),new THREE.Mesh(DSG.glow,dsGlow));
  g.children[0].castShadow=true;g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);MODELS.swapShip(g,'dropship',{ref:DSG.geo,ground:true,shadow:true,k:.62});SHIPS.push({g,x,z,ready:0,name:['Lantern','Bastion','Mercy'][SHIPS.length],stall:0});OBST.push({x,z,r:6,h:7});OBST.push({x:x+Math.sin(ry)*-8,z:z-8*Math.cos(ry),r:4,h:6});}
// your interceptor: the Raven-pattern ship from the hangar, scaled to about 14 m
const myShip=new THREE.Group();
{const a=new THREE.Mesh(ITC.geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.5})),b=new THREE.Mesh(ITC.glow,new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)}));
 a.castShadow=true;myShip.add(a,b);ITC.geo.computeBoundingBox();const L=ITC.geo.boundingBox.max.z-ITC.geo.boundingBox.min.z;myShip.scale.setScalar(14/L);
 myShip.position.set(24,-ITC.geo.boundingBox.min.y*14/L+.2,32);myShip.rotation.y=Math.PI*.85;scene.add(myShip);MODELS.swapShip(myShip,'interceptor',{ref:ITC.geo,ground:true,shadow:true});
 SHIPS.push({g:myShip,x:24,z:32,ready:0,name:'Your interceptor',mine:true,stall:0});OBST.push({x:24,z:32,r:3.2,h:3});}   // (moved in from 30,26: its tail sat in the canyon wall)
const SHIP_SEAT=new THREE.Vector3(24,0,37);   // where you climb aboard
// an older battle: a Keeper dropship half buried in the dunes south-west of the pad, and its scattered plating
{const g=new THREE.Mesh(DSG.geo,new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,color:C(0x5a5650),roughness:.85,metalness:.35}));
 g.position.set(-118,groundY(-118,128)-3.2,128);g.rotation.set(.22,1.1,-.38);g.scale.setScalar(1.25);g.castShadow=g.receiveShadow=true;scene.add(g);
 for(let i=0;i<14;i++){const p=new THREE.Mesh(boxUV(R(1.5,4),R(.1,.3),R(1,3),2),metalMat);const x=-118+R(-30,30),z=128+R(-24,24);p.position.set(x,groundY(x,z)+.1,z);p.rotation.set(R(-.4,.4),R(0,3),R(-.4,.4));p.receiveShadow=true;scene.add(p);}}

/* ---------- the Hollow: a cliff wall carved with a great gate, flanking spires, a balcony, spines and purple light ---------- */
const HOLLOW_GLOW=FLEET_PURPLE;
const stoneMat=rockTexMaterial(.035,3.2);   // the Hollow's carved face: real rock (it was flat panels)
const hglowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:C(HOLLOW_GLOW).multiplyScalar(2.2),toneMapped:false});
const gateDoors=[];let gateLight;
{const m=new Merger(),gm=new Merger(),st=C(0x231b28),st2=C(0x302434),sv=C(0x8e909c),W1=C(0xffffff),U=8,z0=GATE.z;
 const GW=16,GH=34;
 // the carved face: blocks either side of the gate and above it, stepped back as they rise
 for(const s of[-1,1]){m.add(boxUV(110,150,30,U),M(s*(GW/2+55),75,z0-14),st);m.add(boxUV(70,40,10,U),M(s*(GW/2+40),20,z0-.5),st2);}
 m.add(boxUV(GW+4,116,30,U),M(0,GH+58,z0-14),st);
 // the gate arch: a pointed frame of silver ribs and a glowing seam
 for(const s of[-1,1]){m.add(boxUV(2.4,GH,3,U),M(s*(GW/2+1.2),GH/2,z0+.8),sv);m.add(boxUV(2.4,14,3,U),M(s*4.5,GH+5,z0+.8,0,0,s*.6),sv);
   gm.add(new THREE.BoxGeometry(.5,GH-2,.5),M(s*(GW/2-.2),GH/2,z0+2.2),W1);}
 // balcony over the gate, where the Hollow King appears
 m.add(boxUV(26,1.6,9,U),M(0,GH+10,z0+3.5),st2);m.add(boxUV(26,1.4,.6,U),M(0,GH+11.4,z0+7.8),sv);gm.add(new THREE.BoxGeometry(24,.3,.3),M(0,GH+12.2,z0+7.9),W1);
 for(const x of[-12,-6,0,6,12])m.add(new THREE.CylinderGeometry(0,.35,5,4),M(x,GH+13.5,z0+7.8),sv);
 // spires either side of the gate, each with a column of purple light and a crown of spines
 for(const s of[-1,1]){const x=s*38;
   m.add(new THREE.CylinderGeometry(3,7,90,6),M(x,45,z0+6),st2);m.add(new THREE.CylinderGeometry(0,3,28,6),M(x,104,z0+6),st);
   for(let k=0;k<6;k++){const a=k/6*Math.PI*2;m.add(new THREE.CylinderGeometry(0,.8,14,4),M(x+Math.cos(a)*4,92,z0+6+Math.sin(a)*4,Math.sin(a)*.5,0,-Math.cos(a)*.5),sv);}
   for(let y=8;y<86;y+=8)gm.add(new THREE.BoxGeometry(.4,4,.4),M(x+s*-3.6,y,z0+10),W1);
   /* (a glowing gem used to sit on each spire's tip: the spire itself is lost in the dark, so from the canyon it read as a purple dot
      floating in the sky. The light now runs in a ring round the crown of spines, on the stone) */
   gm.add(new THREE.TorusGeometry(4.6,.35,6,24),M(x,92,z0+6,Math.PI/2,0,0),W1);}
 // spines bristling from the cliff face, raked down toward the courtyard
 for(let i=0;i<70;i++){const x=R(-120,120);if(Math.abs(x)<GW/2+3)continue;const y=R(30,140),l=R(6,18);
   m.add(new THREE.CylinderGeometry(0,R(.5,1.2),l,4),M(x,y,z0+1+l*.3,Math.PI/2+R(.2,.6),0,R(-.3,.3)),rng()<.3?sv:st2);}
 // glowing seams across the face
 for(let i=0;i<22;i++){const x=R(-110,110);if(Math.abs(x)<GW/2+6)continue;gm.add(new THREE.BoxGeometry(R(4,16),.35,.35),M(x,R(14,130),z0+1.2),W1);}
 const face=new THREE.Mesh(m.build(),stoneMat);face.castShadow=face.receiveShadow=true;scene.add(face);scene.add(new THREE.Mesh(gm.build(),hglowMat));
 // the doors (they slide apart when the trap springs) and the void glowing behind them
 /* the gate: two great leaves of carved stone in silver frames. Each carries half of the Remnant's broken ring (it closes into one
    whole ring when the gate is shut), a column of runes that burn purple, ribbed panels, a pointed crown, and spikes along the seam. */
 const trimMat=new THREE.MeshStandardMaterial({map:panelTex,color:C(0x9a9ca8),roughness:.32,metalness:.85});
 for(const s of[-1,1]){const L=new THREE.Group(),hw=GW/2,sm=new Merger(),tm=new Merger(),gl=new Merger();
   // the slab, thick, with a raised border and five ribbed panels
   sm.add(boxUV(hw,GH,1.8,U),M(0,0,0),st2);
   for(let k=0;k<5;k++){const y=-GH/2+3+k*(GH-6)/5+(GH-6)/10;sm.add(boxUV(hw-2.4,(GH-6)/5-1.2,.5,U),M(0,y,1.0),st);
     for(let r=0;r<4;r++)sm.add(boxUV(hw-3.2,.25,.3,U),M(0,y-1.4+r*.95,1.35),st2);}
   tm.add(boxUV(hw,.7,2.2,U),M(0,GH/2-.35,0),sv);tm.add(boxUV(hw,.7,2.2,U),M(0,-GH/2+.35,0),sv);tm.add(boxUV(.7,GH,2.2,U),M(s*(hw/2-.35),0,0),sv);
   tm.add(boxUV(.5,GH,2.4,U),M(-s*(hw/2-.25),0,0),sv);   // the meeting edge
   // the pointed crown above the leaf
   const cr=new THREE.Shape();cr.moveTo(-hw/2,0);cr.lineTo(hw/2,0);cr.lineTo(s>0?-hw/2:hw/2,7);cr.closePath();
   const cg=new THREE.ExtrudeGeometry(cr,{depth:1.6,bevelEnabled:false});cg.translate(0,0,-.8);sm.add(cg,M(0,GH/2,0),st2);
   // half of the ring, on the seam, and its glowing inner edge
   tm.add(new THREE.TorusGeometry(4.2,.55,8,24,Math.PI),M(-s*hw/2,2,1.4,0,0,-s*Math.PI/2),sv);
   gl.add(new THREE.TorusGeometry(3.4,.14,6,24,Math.PI),M(-s*hw/2,2,1.6,0,0,-s*Math.PI/2),W1);
   // runes down the leaf, and spikes along the seam
   for(let k=0;k<9;k++){const y=-GH/2+5+k*3.2,w=.5+((k*7)%3)*.35;gl.add(new THREE.BoxGeometry(w,.22,.1),M(s*(hw/2-1.6),y,1.5),W1);gl.add(new THREE.BoxGeometry(.18,w*.9,.1),M(s*(hw/2-1.6)+.4*-s,y+.5,1.5),W1);}
   for(let k=0;k<7;k++)tm.add(new THREE.CylinderGeometry(0,.35,1.8,4),M(-s*(hw/2-.2),-GH/2+4+k*4.6+(k>=3?3:0),1.6,Math.PI/2,0,0),sv);
   L.add(new THREE.Mesh(sm.build(),stoneMat),new THREE.Mesh(tm.build(),trimMat),new THREE.Mesh(gl.build(),hglowMat));
   L.children.forEach(o=>{o.castShadow=true;o.receiveShadow=true;});
   L.position.set(s*GW/4,GH/2,z0+.2);scene.add(L);gateDoors.push({m:L,s,x0:s*GW/4});}
 gateLight=new THREE.Mesh(new THREE.PlaneGeometry(GW,GH),new THREE.MeshBasicMaterial({color:C(HOLLOW_GLOW).multiplyScalar(1.6),toneMapped:false}));gateLight.position.set(0,GH/2,z0-1.2);scene.add(gateLight);}
const GATE_H=34,BALCONY=new THREE.Vector3(0,GATE_H+11,GATE.z+4);
const hollowLamp=new THREE.PointLight(C(HOLLOW_GLOW),2.2,120,1.6);hollowLamp.position.set(0,20,GATE.z+14);scene.add(hollowLamp);
const lzLamp=new THREE.PointLight(C(0x9fe8ff),1.2,90,1.6);lzLamp.position.set(0,14,LZ.z+12);scene.add(lzLamp);

/* ---------- the signal: a pillar of purple light out of the mountain, and a ring that pulses out of it every few seconds.
   Whatever is under the mountain is still transmitting. ---------- */
const BEAM_AT=new THREE.Vector3(0,0,GATE.z-150);
const beam=new THREE.Mesh(new THREE.CylinderGeometry(6,14,900,16,1,true),new THREE.MeshBasicMaterial({color:C(HOLLOW_GLOW),transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
beam.position.set(0,groundY(0,BEAM_AT.z)+420,BEAM_AT.z);scene.add(beam);
const beamCore=new THREE.Mesh(new THREE.CylinderGeometry(1.6,3,900,10,1,true),new THREE.MeshBasicMaterial({color:C(0xe6d0ff).multiplyScalar(1.5),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
beamCore.position.copy(beam.position);scene.add(beamCore);
const pulseMat=new THREE.MeshBasicMaterial({color:C(HOLLOW_GLOW).multiplyScalar(1.8),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
const pulse=new THREE.Mesh(new THREE.RingGeometry(.92,1,96),pulseMat);pulse.rotation.x=-Math.PI/2;pulse.position.set(0,groundY(0,BEAM_AT.z)+260,BEAM_AT.z);scene.add(pulse);
let pulseT=0;
function updateSignal(dt){pulseT=(pulseT+dt)%6;const u=pulseT/6;pulse.scale.setScalar(20+u*900);pulseMat.opacity=(1-u)*(1-u)*.55;
  beam.material.opacity=.18+.06*Math.sin(pulseT*Math.PI/3);beamCore.material.opacity=.45+.2*Math.sin(pulseT*Math.PI/3);
  for(const g of SPINE_GLOW)g.material.color.copy(C(FLEET_PURPLE)).multiplyScalar(1.6+Math.sin(pulseT*Math.PI/3)*.7);}

/* ---------- the horizon: two rings of jagged ranges, a near one in shadow and a far one in haze ---------- */
{const ringMesh=(r0,amp,base,colHex,seedOff)=>{const N=coarse?200:320,pos=[],idx=[],col=[],c=C(colHex),c2=C(colHex).multiplyScalar(.6);
   for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,r=r0+60*Math.sin(a*7+seedOff),x=Math.cos(a)*r,z=-170+Math.sin(a)*r;
     let h=base+amp*ridged(Math.cos(a)*3+seedOff,Math.sin(a)*3-seedOff)*(.6+.4*vnoise(i*.07,seedOff));
     if(z<-600)h*=1.5;   // taller behind the Hollow
     pos.push(x,-40,z,x,h,z);col.push(c2.r,c2.g,c2.b,c.r,c.g,c.b);
     if(i<N){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
   const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,fog:true}));scene.add(m);};
 ringMesh(1250,330,90,0x3a2236,1.3);ringMesh(1900,520,150,0x4e2e44,4.7);}

/* ---------- black shards of Hollow crystal jutting from the canyon walls, purple at the tips ---------- */
{const N=coarse?40:80,geo=new THREE.ConeGeometry(.6,1,5);geo.translate(0,.5,0);
 const shard=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:C(0x120e18),roughness:.25,metalness:.8,emissive:C(FLEET_PURPLE),emissiveIntensity:.12}),N);
 const mt=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new THREE.Vector3(),p=new THREE.Vector3();let k=0;
 for(let t=0;t<N*4&&k<N;t++){const s=R(30,ROAD_LEN),side=rng()<.5?-1:1,c=roadPt(s),n=roadN(s),kc=laneC(s),L=laneHalf(s),inner=kc>L+6&&rng()<.4,off=side*(inner?kc-L-R(2,8):kc+L+R(3,14)),x=c.x+n.x*off,z=c.z+n.z*off;
   if(playD(x,z)<1)continue;p.set(x,groundY(x,z)-.5,z);e.set(R(-.5,.5)-side*.3*n.z,R(0,6),R(-.5,.5)+side*.3*n.x);q.setFromEuler(e);const h=R(3,11);sc.set(h*.25,h,h*.25);
   shard.setMatrixAt(k++,mt.compose(p,q,sc));}
 shard.count=k;shard.castShadow=true;scene.add(shard);}

/* ---------- the Harbinger: the Hollow King's flagship hangs over the mountain, far off in the haze ---------- */
const harbinger=new THREE.Group();harbinger.position.set(260,560,-1250);harbinger.rotation.set(.08,-.55,.03);scene.add(harbinger);
MODELS.harbinger((g,m)=>{m=m.clone();m.fog=false;m.color.multiplyScalar(.35);m.emissiveIntensity=.9;const mesh=new THREE.Mesh(g,m);mesh.scale.setScalar(.9);harbinger.add(mesh);
  for(const x of[-110,0,110]){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(FLEET_PURPLE).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));s.scale.setScalar(90);s.position.set(x,0,470);harbinger.add(s);}});

/* ---------- dust motes drifting in the low sun ---------- */
const DUST_N=coarse?400:900,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,30),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.18,color:C(0xffc8a0),transparent:true,opacity:.45,depthWrite:false}));scene.add(dust);

/* ---------- bloom and quality. Phones start on high too: they run it fine, and low looked flat ---------- */
let composer=null,HQ=true;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.55,.45,.85));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
try{const q=localStorage.getItem('elyra.quality');if(q)HQ=q!=='low';}catch(_){}
function setQuality(hq){HQ=hq;try{localStorage.setItem('elyra.quality',hq?'high':'low');}catch(_){}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,hq?(coarse?1.6:1.75):(coarse?1.15:1)));renderer.shadowMap.enabled=true;
  renderer.setSize(innerWidth,innerHeight);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);}$('quality').textContent=hq?'Quality: high':'Quality: low';}
$('quality').addEventListener('click',()=>{setQuality(!HQ);$('quality').blur();});
setQuality(HQ);
function renderFrame(){if(composer&&HQ){try{composer.render();return;}catch(e){composer=null;}}renderer.render(scene,camera);}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);if(composer)composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
// the pull-down menu
{const mb=$('menuBtn'),vw=$('views');const set=o=>{vw.classList.toggle('open',o);mb.setAttribute('aria-expanded',o?'true':'false');};
 mb.addEventListener('click',e=>{e.stopPropagation();set(!vw.classList.contains('open'));mb.blur();});
 vw.addEventListener('click',e=>{if(e.target.closest('button,a'))setTimeout(()=>set(false),250);});
 renderer.domElement.addEventListener('pointerdown',()=>set(false));addEventListener('keydown',e=>{if(e.code==='Escape')set(false);});}
function flashScreen(a){const f=$('flash');f.style.transition='none';f.style.opacity=a;requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity=0;});}

/* ---------- Bryce's cliff model as the canyon walls: rock faces standing on the canyon floor right at its edge, packed side by side
   so they read as one wall, a second, taller row behind them, and a few around the landing zone. One instanced mesh. ---------- */
MODELS.load('cliff').then(src=>{
  const g=src.geometry;g.computeBoundingBox();const b=g.boundingBox,mat=src.material.clone();mat.color=C(0xa88c88);
  const H=b.max.y-b.min.y,W=Math.max(b.max.x-b.min.x,b.max.z-b.min.z),HALF=.45;   // HALF: the solid core of the rock (it also blocks you: see OBST below)   // the rock's footprint reaches about HALF of its width from its centre
  // the ledges where Host riflemen and gunners stand (the same spots js/origin/04-story.js picks): no rock there, a stone perch instead
  const PERCH=[];if(typeof ledgeSpot==='function'){for(const e of[72,150,228])for(let j=0;j<4;j++){const p=ledgeSpot(e+8+j*14,j%2?1:-1);if(p)PERCH.push(p);}
    for(const [ps,side,inner] of[[118,-1],[178,1],[212,-1,true]]){const p=ledgeSpot(ps,side,inner);if(p)PERCH.push(p);}}
  // (and no rock on top of a parked ship: your interceptor's nose used to sit inside one)
  const clearOf=(x,z,r)=>!SHIPS.some(S=>Math.hypot(S.x-x,S.z-z)<r+11)&&!PERCH.some(p=>Math.hypot(p.x-x,p.z-z)<r+5)&&!GAPS.some(G=>{const c=roadPt(G.s);return Math.hypot(c.x-x,c.z-z)<r+GAP_HALF+6;});
  const spots=[],seedKeep=seed;setSeed(4401);
  const step=coarse?9:6.5;
  for(let s=-6;s<ROAD_LEN+14;s+=step){const sc=Math.max(0,Math.min(ROAD_LEN,s)),p=roadPt(sc,new THREE.Vector3()),n=roadN(sc),outer=laneC(sc)+laneHalf(sc);
    for(const side of[-1,1])for(const row of[0,1]){if(row&&rng()<.35)continue;
      const h=row?R(44,60):R(28,36),wd=h*(row?.85:1.05),lat=side*(outer+wd*.38+row*wd*.6);
      const x=p.x+n.x*lat,z=p.z+n.z*lat;if(!clearOf(x,z,wd*HALF))continue;
      const fx=p.x+n.x*side*outer,fz=p.z+n.z*side*outer;
      spots.push([x,Math.min(groundY(fx,fz),groundY(x,z))-1.5,z,h,wd]);}
    // the ridge between the canyons, sized to stay between them
    if(spineAt(sc)){const half=laneC(sc)-laneHalf(sc);if(half>3){const wd=half*2,h=Math.max(24,wd*1.15),x=p.x,z=p.z;if(clearOf(x,z,wd*HALF))spots.push([x,groundY(x,z)-h*.12,z,h,wd]);}}}
  for(let i=0;i<(coarse?8:14);i++){const a=R(.6,2.6),r=LZ.r+R(40,110),x=LZ.x+Math.cos(a)*r*(rng()<.5?-1:1),z=LZ.z-Math.sin(a)*r*.6;const h0=R(18,32);if(playD(x,z)>20&&z<LZ.z&&clearOf(x,z,h0*.7*HALF)){const h=h0;spots.push([x,groundY(x,z)-2,z,h,h*.7]);}}
  setSeed(seedKeep);
  const im=new THREE.InstancedMesh(g,mat,spots.length),M4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
  spots.forEach(([x,y,z,h,wd],i)=>{const k=h/H,kw=wd/W;e.set(0,R(0,6.28),0);q.setFromEuler(e);
    M4.compose(new THREE.Vector3(x,y-b.min.y*k,z),q,new THREE.Vector3(kw,k,kw));im.setMatrixAt(i,M4);});
  im.castShadow=im.receiveShadow=true;scene.add(im);
  // the cover rocks become small copies of the same stone
  {const rm=new THREE.InstancedMesh(g,mat,ROCKS.length);ROCKS.forEach((Rk,i)=>{Rk.m.visible=false;const k=Rk.r*2*Rk.ys*1.1/H,kw=Rk.r*2.1/W;
     e.set(0,R(0,6.28),0);q.setFromEuler(e);M4.compose(new THREE.Vector3(Rk.x,groundY(Rk.x,Rk.z)-.15-b.min.y*k,Rk.z),q,new THREE.Vector3(kw,k,kw));rm.setMatrixAt(i,M4);});
   rm.castShadow=rm.receiveShadow=true;scene.add(rm);}
  // the rocks are solid: you (and everyone else) walk around them, never through
  for(const [x,y,z,h,wd] of spots)OBST.push({x,z,r:wd*HALF*.95,h:h,rock:true});
  // the perches: a stone shelf under each rifleman, with a low lip to crouch behind
  const pm=rockTexMaterial(.12,2.4,true);
  for(const p of PERCH){const hh=Math.max(1,p.y-groundY(p.x,p.z)+1.5),sh=new THREE.Mesh(new THREE.CylinderGeometry(2.4,1.6,hh,7),pm);sh.position.set(p.x,p.y-hh/2,p.z);sh.castShadow=sh.receiveShadow=true;scene.add(sh);
    const lip=new THREE.Mesh(new THREE.BoxGeometry(3.4,.9,.6),pm);const c=roadPt(roadS(p.x,p.z));lip.position.set(p.x,p.y+.45,p.z);lip.lookAt(c.x,p.y+.45,c.z);lip.translateZ(1.6);lip.castShadow=true;scene.add(lip);}
}).catch(()=>{});
