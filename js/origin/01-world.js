/* Elyra · Chapter 1 · Origin — the world: dusk over the Hollow, the Hollow King's fortress carved into a mountain.
   A landing zone in the south, a canyon road north, a courtyard under the cliff gate. Units are metres; the player is 1.8 m tall. */
const $=id=>document.getElementById(id);
if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="err">The 3D engine failed to load. Reload the page to try again.</div>');throw new Error('three.js failed to load');}
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){document.body.insertAdjacentHTML('beforeend','<div class="err">This browser could not start WebGL, which the scene needs to render.</div>');throw new Error('WebGL unavailable');}
setSeed(1101);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.35:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('app').appendChild(renderer.domElement);

const scene=new THREE.Scene();
const FOG=C(0x6e4458);
scene.fog=new THREE.FogExp2(FOG,.0019);scene.background=FOG;
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,5000);
camera.rotation.order='YXZ';
const glow=makeGlowTex();
const panelTex=makePanelTex();

/* ---------- dusk sky: a low red sun in the west, purple overhead ---------- */
const sunDir=new THREE.Vector3(-.82,.2,-.36).normalize();
const sky=new THREE.Mesh(new THREE.SphereGeometry(4500,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{sunDir:{value:sunDir},hor:{value:C(0xe0784a)},mid:{value:C(0x8a3a5a)},zen:{value:C(0x1c1230)}},
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 vDir;uniform vec3 sunDir,hor,mid,zen;
  void main(){vec3 d=normalize(vDir);float y=max(d.y,0.0);
    vec3 c=mix(hor,mid,smoothstep(0.0,0.18,y));c=mix(c,zen,smoothstep(0.15,0.75,y));
    float s=max(dot(d,sunDir),0.0);c+=vec3(1.0,.6,.35)*pow(s,8.0)*.5+vec3(1.0,.8,.5)*pow(s,300.0)*2.0;
    if(d.y<0.0)c=mix(hor*.8,vec3(.25,.14,.18),smoothstep(0.0,-.2,d.y));gl_FragColor=vec4(c,1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`}));
sky.renderOrder=-2;scene.add(sky);
scene.add(new THREE.HemisphereLight(C(0xd8a8c8),C(0x2a1a28),.75));
const sun=new THREE.DirectionalLight(C(0xffb08a),2.1);sun.position.copy(sunDir).multiplyScalar(600);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(sun.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:10,far:1400});sun.shadow.bias=-.0006;sun.shadow.normalBias=.05;
// the shadow box follows the camera
function followSun(p){sun.position.copy(p).addScaledVector(sunDir,600);sun.target.position.copy(p);}

/* ---------- the map: landing zone (south), the canyon road, the courtyard below the gate (north) ---------- */
const LZ={x:0,z:40,r:56},COURT={x:0,z:-362,r:50},GATE={x:0,z:-414};
const ROAD=[[0,10],[6,-40],[-12,-118],[10,-196],[-5,-272],[0,-325]],ROAD_W=17;
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
// distance outside the walkable area (negative inside)
function playD(x,z){
  let d=Math.min(Math.hypot(x-LZ.x,z-LZ.z)-LZ.r,Math.hypot(x-COURT.x,z-COURT.z)-COURT.r);
  for(let i=0;i<ROAD.length-1;i++)d=Math.min(d,segDist(x,z,ROAD[i][0],ROAD[i][1],ROAD[i+1][0],ROAD[i+1][1])-ROAD_W);
  if(z<GATE.z+4)d=Math.max(d,(GATE.z+4)-z);   // the cliff face
  return d;
}
function groundY(x,z){const d=playD(x,z);
  if(d<=0)return .35*vnoise(x*.05,z*.05);
  // canyon walls rise steeply for the first stretch, then roll away into ridges; the Hollow's mountain towers behind the gate
  const r=ridged(x*.006,z*.006),r2=ridged(x*.0025+7,z*.0025-3);
  let h=Math.min(d*1.8+d*d*.01,55+r*45)+sstep(40,320,d)*(60+r2*230);
  // south of the canyon mouth the mountains give way to open desert, with low dunes
  const north=sstep(LZ.z+30,LZ.z-50,z);h=h*north+(1-north)*(4+9*vnoise(x*.012,z*.012)+3*vnoise(x*.04,z*.04))*sstep(0,30,d);
  if(z<GATE.z+40)h+=sstep(GATE.z+40,GATE.z-80,z)*(150+90*r)*sstep(260,60,Math.abs(x));
  return .35*vnoise(x*.05,z*.05)+h;}

/* ---------- terrain ---------- */
{const S=2600,N=coarse?170:260,g=new THREE.PlaneGeometry(S,S,N,N);g.rotateX(-Math.PI/2);g.translate(0,0,-170);
 const P=g.attributes.position,col=new Float32Array(P.count*3);
 const sand=C(0x8a5e4c),dust=C(0x6e4a44),rock=C(0x3a2c34),high=C(0x55425e),road=C(0x5a463e),tmp=new THREE.Color();
 for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i),y=groundY(x,z),d=playD(x,z);P.setY(i,y);
   const n=vnoise(x*.08,z*.08);
   if(d<=0){tmp.copy(n<.5?sand:dust);if(d>-4)tmp.lerp(rock,.4);if(segDist(x,z,0,-400,0,40)<4&&z<0)tmp.lerp(road,.5);}
   else{tmp.copy(rock).lerp(high,sstep(40,200,y)).lerp(dust,sstep(6,0,d)*.6);tmp.multiplyScalar(.75+n*.5);}
   col.set([tmp.r,tmp.g,tmp.b],i*3);}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true}));m.receiveShadow=true;scene.add(m);}

/* ---------- obstacles: rocks, barricades, crates. Circles for collision, cover and line of sight ---------- */
const OBST=[];
const rockMat=new THREE.MeshStandardMaterial({color:C(0x4a3a40),roughness:.9,flatShading:true});
const metalMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.45,metalness:.55});
function addRock(x,z,r){const g=new THREE.DodecahedronGeometry(r,0);g.scale(1,R(.6,1.1),1);const m=new THREE.Mesh(g,rockMat);m.position.set(x,groundY(x,z)+r*.35,z);m.rotation.set(R(0,3),R(0,3),0);
  m.castShadow=m.receiveShadow=true;scene.add(m);OBST.push({x,z,r:r*.9,h:r*1.2});}
function addBarricade(x,z,ry,w){const m=new Merger(),d=C(0x2a3442),b=C(0x284c78),gd=C(0xd9b25a);
  m.add(boxUV(w,1.3,.7,2),M(0,.65,0),d);m.add(boxUV(w*.96,.12,.74,2),M(0,1.3,0),gd);m.add(boxUV(w*.3,.6,.72,2),M(0,.65,0),b);
  const o=new THREE.Mesh(m.build(),metalMat);o.position.set(x,groundY(x,z),z);o.rotation.y=ry;o.castShadow=o.receiveShadow=true;scene.add(o);
  // a barricade is a row of small circles
  const n=Math.max(1,Math.round(w/1.4));for(let i=0;i<n;i++){const u=(i+.5)/n-.5;OBST.push({x:x+Math.cos(ry)*u*w,z:z-Math.sin(ry)*u*w,r:.75,h:1.3});}}
function addCrate(x,z,s){const m=new Merger();m.add(boxUV(s,s,s,2),M(0,s/2,0),C(0x3a3a40));m.add(boxUV(s*1.02,s*.12,s*1.02,2),M(0,s*.85,0),C(0xd9b25a));
  const o=new THREE.Mesh(m.build(),metalMat);o.position.set(x,groundY(x,z),z);o.rotation.y=R(0,3);o.castShadow=o.receiveShadow=true;scene.add(o);OBST.push({x,z,r:s*.6,h:s});}
// along the canyon: tumbled rocks for cover on both sides of the road
for(let i=0;i<ROAD.length-1;i++){const [ax,az]=ROAD[i],[bx,bz]=ROAD[i+1];for(let k=0;k<4;k++){const t=(k+.5)/4,x=ax+(bx-ax)*t,z=az+(bz-az)*t,s=rng()<.5?-1:1;
  addRock(x+s*R(6,12),z+R(-6,6),R(1.2,2.4));}}
for(let i=0;i<10;i++){const a=i/10*Math.PI*2;addRock(COURT.x+Math.cos(a)*R(30,44),COURT.z+Math.sin(a)*R(20,40)+8,R(1.4,2.6));}
// the landing zone perimeter: Keeper barricades facing the canyon mouth, and supply crates
addBarricade(-14,8,0,7);addBarricade(14,8,0,7);addBarricade(-34,18,.6,6);addBarricade(34,18,-.6,6);addBarricade(0,-2,0,6);
for(const [x,z] of[[-22,30],[24,34],[-40,46],[42,52],[8,58],[-10,62]])addCrate(x,z,R(1.2,1.7));

/* ---------- the landing zone: a hex pad with lights ---------- */
{const pad=new THREE.Mesh(new THREE.CylinderGeometry(30,30,.25,6),new THREE.MeshStandardMaterial({map:panelTex,color:C(0x8a96a8),roughness:.6,metalness:.4}));
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
  g.children[0].castShadow=true;g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);SHIPS.push({g,x,z,ready:0,name:['Lantern','Bastion','Mercy'][SHIPS.length],stall:0});OBST.push({x,z,r:6,h:7});OBST.push({x:x+Math.sin(ry)*-8,z:z-8*Math.cos(ry),r:4,h:6});}
// your interceptor: the Raven-pattern ship from the hangar, scaled to about 14 m
const myShip=new THREE.Group();
{const a=new THREE.Mesh(ITC.geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.5})),b=new THREE.Mesh(ITC.glow,new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2,2,2)}));
 a.castShadow=true;myShip.add(a,b);ITC.geo.computeBoundingBox();const L=ITC.geo.boundingBox.max.z-ITC.geo.boundingBox.min.z;myShip.scale.setScalar(14/L);
 myShip.position.set(30,-ITC.geo.boundingBox.min.y*14/L+.2,26);myShip.rotation.y=Math.PI*.85;scene.add(myShip);
 SHIPS.push({g:myShip,x:30,z:26,ready:0,name:'Your interceptor',mine:true,stall:0});OBST.push({x:30,z:26,r:3.2,h:3});}
const SHIP_SEAT=new THREE.Vector3(30,0,31);   // where you climb aboard

/* ---------- the Hollow: a cliff wall carved with a great gate, flanking spires, a balcony, spines and purple light ---------- */
const HOLLOW_GLOW=FLEET_PURPLE;
const stoneMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.7,metalness:.25});
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
   gm.add(new THREE.OctahedronGeometry(3.2,0),M(x,120,z0+6),W1);}
 // spines bristling from the cliff face, raked down toward the courtyard
 for(let i=0;i<70;i++){const x=R(-120,120);if(Math.abs(x)<GW/2+3)continue;const y=R(30,140),l=R(6,18);
   m.add(new THREE.CylinderGeometry(0,R(.5,1.2),l,4),M(x,y,z0+1+l*.3,Math.PI/2+R(.2,.6),0,R(-.3,.3)),rng()<.3?sv:st2);}
 // glowing seams across the face
 for(let i=0;i<22;i++){const x=R(-110,110);if(Math.abs(x)<GW/2+6)continue;gm.add(new THREE.BoxGeometry(R(4,16),.35,.35),M(x,R(14,130),z0+1.2),W1);}
 const face=new THREE.Mesh(m.build(),stoneMat);face.castShadow=face.receiveShadow=true;scene.add(face);scene.add(new THREE.Mesh(gm.build(),hglowMat));
 // the doors (they slide apart when the trap springs) and the void glowing behind them
 for(const s of[-1,1]){const d=new Merger();d.add(boxUV(GW/2,GH,1.6,U),M(0,0,0),st2);for(let y=-14;y<=14;y+=7)d.add(boxUV(GW/2-1,.6,1.8,U),M(0,y,0),sv);
   const door=new THREE.Mesh(d.build(),stoneMat);door.position.set(s*GW/4,GH/2,z0+.2);door.castShadow=true;scene.add(door);gateDoors.push({m:door,s,x0:s*GW/4});}
 gateLight=new THREE.Mesh(new THREE.PlaneGeometry(GW,GH),new THREE.MeshBasicMaterial({color:C(HOLLOW_GLOW).multiplyScalar(1.6),toneMapped:false}));gateLight.position.set(0,GH/2,z0-1.2);scene.add(gateLight);
 // a pillar of purple light rising out of the mountain
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(6,14,900,16,1,true),new THREE.MeshBasicMaterial({color:C(HOLLOW_GLOW),transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
 beam.position.set(0,groundY(0,z0-150)+420,z0-150);scene.add(beam);}
const GATE_H=34,BALCONY=new THREE.Vector3(0,GATE_H+11,GATE.z+4);
const hollowLamp=new THREE.PointLight(C(HOLLOW_GLOW),2.2,120,1.6);hollowLamp.position.set(0,20,GATE.z+14);scene.add(hollowLamp);
const lzLamp=new THREE.PointLight(C(0x9fe8ff),1.2,90,1.6);lzLamp.position.set(0,14,LZ.z+12);scene.add(lzLamp);

/* ---------- distant mountain ring so the horizon is never empty ---------- */
{const m=new Merger();for(let i=0;i<40;i++){const a=i/40*Math.PI*2,r=R(1100,1500),h=R(120,420);m.add(new THREE.ConeGeometry(R(120,260),h,5),M(Math.cos(a)*r,h/2-20,-170+Math.sin(a)*r,0,R(0,3),0),C(0x2a1c2c));}
 scene.add(new THREE.Mesh(m.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true})));}

/* ---------- dust motes drifting in the low sun ---------- */
const DUST_N=coarse?400:900,dustPos=new Float32Array(DUST_N*3);
for(let i=0;i<DUST_N;i++)dustPos.set([R(-80,80),R(0,30),R(-80,80)],i*3);
const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.18,color:C(0xffc8a0),transparent:true,opacity:.45,depthWrite:false}));scene.add(dust);

/* ---------- bloom and quality ---------- */
let composer=null,HQ=!coarse;
try{if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.GammaCorrectionShader){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.55,.45,.85));composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));}}catch(e){composer=null;}
function setQuality(hq){HQ=hq;renderer.setPixelRatio(Math.min(devicePixelRatio||1,hq?(coarse?1.35:1.75):1));renderer.shadowMap.enabled=hq||!coarse;
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
