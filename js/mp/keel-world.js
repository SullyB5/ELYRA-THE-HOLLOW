/* Elyra · TakeOver · Keel — the world (Nov 10, Bryce: "build one small new map from hallway, corridor, the wall pieces and floor
   pieces as a tight ship-interior fight").

   The lower deck of a Keeper frigate, one deck, 68 by 36 m, the same turned half way round (x,z → -x,-z) so neither side has the
   better ground. West half (blue's) as written:
     the bay        blue's hangar at the west end: 12 by 24 m, 7 high, the landing deck's red-lit floor plate, two rows of drop seats along
                    its walls, lockers, two hull windows onto space in the back wall
     the spine      the white Keeper corridor from the bay to the hold (Bryce's hallway model, two sections), 4.5 m wide
     the crawl      the dark service tube along the south side (Bryce's corridor model), 2.6 m wide and low
     the bunks      the crew room on the north side: bunks, the officer's lit bed, lockers, a machinery wall; a door each end
     the hold       the middle, shared: 16 by 28 m, 6 high, a grated walkway down its middle a step up (ramps at both ends), lockers,
                    consoles, fuel cells and gas bottles for cover, hatch plates in the floor, the white braced wall along each side
   Floors and walls wear the textures of Bryce's floor and wall cards (floor-tiles, floor-material, wall-3) where they arrive.
   On foot only; six a side. Built on js/mp/kit.js and Bryce's props (js/shared/furnish.js). Units are metres; north is -z. */
setSeed(1110);
renderer.toneMappingExposure=1.15;
HAZE_HEX=0x070910;
scene.fog=new THREE.FogExp2(C(HAZE_HEX),.012);scene.background=C(0x020306);

/* ---------- the plan ---------- */
const KL={X:34,Z:18,BAY:[-34,-22,-12,12],BAY_H:7,SPINE:[-22,-8,-1.7,1.7],SP_H:3.3,CRAWL:[-22,-8,7.5,10.1],CR_H:2.3,
  BUNK:[-22,-8,-14,-6],BK_H:3.4,HOLD:[-8,8,-14,14],HOLD_H:6,WALK:[-1.6,1.6,-6.24,6.24],WALK_H:1.2};
const GS=(()=>{
  const HALF=34,BASE_R=4.5;
  const BASES=[{team:'blue',x:-29,z:0},{team:'red',x:29,z:0}].map(B=>{B.fx=-Math.sign(B.x);B.fz=0;B.r=BASE_R;B.shieldR=6.5;B.spawnR=2;B.spawnStep=1.6;return B;});
  const CFG={id:'mpkeel',name:'KEEL',sub:'Team deathmatch · a frigate’s lower deck',air:false,vehicles:false,bots:6,score:40,time:8*60,see:46,range:40,hold:14,flashlights:false,beacon:false,domeK:.4,domeFog:false,
    brief:'TakeOver · team deathmatch. The lower deck of a Keeper frigate, close and fast: a white spine corridor, a dark service crawl, the crew’s bunks, and the cargo hold in the middle where it all meets.',
    objective:'Down the other side. Your bay has guns and ammo; nothing crosses its dome.'};
  return{HALF,HALFZ:KL.Z,SEA:-99,TEAMS:TEAM_COLS,BASES,BASE_R,CFG,NAME:CFG.name};})();
CITY.ground=()=>0;
CITY.edge=(x,z)=>Math.max(Math.abs(x)-KL.X,Math.abs(z)-KL.Z);
CITY.box=[-KL.X-1,-KL.Z-1,KL.X+1,KL.Z+1];CITY.step=1.6;
kitContract();
const twin=fn=>{fn(1);fn(-1);};
const mirRect=r=>[-r[1],-r[0],-r[3],-r[2]];
const R4=(s,r)=>s>0?r:mirRect(r);

/* ---------- the solid mass between the rooms (walls you can't walk or shoot through): what isn't a room is ship ---------- */
// open areas, west half (the hold is the middle, itself symmetric)
const OPEN=s=>[KL.BAY,KL.SPINE,KL.CRAWL,KL.BUNK].map(r=>R4(s,r)).concat(s>0?[KL.HOLD]:[]);
const DOORS=[];   // the gaps through the walls between rooms: [rect] that must stay open
twin(s=>{
  // bay ↔ spine, crawl, bunks: the bay's east wall at x -22 has the three openings (the rooms run straight into it)
  // hold's west wall at x -8: the spine, the crawl, the bunks' door
  DOORS.push(R4(s,[-22.5,-21.5,-1.7,1.7]),R4(s,[-22.5,-21.5,7.5,10.1]),R4(s,[-22.5,-21.5,-10,-7.5]),R4(s,[-8.5,-7.5,-1.7,1.7]),R4(s,[-8.5,-7.5,7.5,10.1]),R4(s,[-8.5,-7.5,-11,-8.5]));});
const inR=(r,x,z,m)=>x>r[0]-(m||0)&&x<r[1]+(m||0)&&z>r[2]-(m||0)&&z<r[3]+(m||0);
const isOpen=(x,z)=>OPEN(1).concat(OPEN(-1)).some(r=>inR(r,x,z))||DOORS.some(r=>inR(r,x,z));
// the mass, as blocks on a 1 m grid merged into runs along x (solid to the ceiling: nothing walks or shoots through)
const MASS=[];
const GR=.5;for(let z=-KL.Z;z<KL.Z;z+=GR){let x0=null;for(let x=-KL.X;x<=KL.X;x+=GR){const solid=x<KL.X&&!isOpen(x+GR/2,z+GR/2);
    if(solid&&x0===null)x0=x;if(!solid&&x0!==null){MASS.push([x0,x,z,z+GR]);x0=null;}}}
for(const r of MASS)KIT.block(r,-.3,8,{top:false});
// the hold's walkway: a step up, ramps at both ends
KIT.block(KL.WALK,-.1,KL.WALK_H);
for(const sz of[1,-1])KIT.ramp([0,sz*(KL.WALK[3]+2.76)],0,-sz,2.76,3.2,0,KL.WALK_H,{rails:[false,false]});

/* ---------- materials: Keeper white and blue, the hold's worn steel, the crawl's dark; the floor and wall cards' textures ---------- */
const KL_ENV=KIT.env((x,y,z)=>{const k=.18+.25*Math.max(0,y);return[k*.8,k*.9,k*1.1];});
const whiteM=new THREE.MeshStandardMaterial({vertexColors:true,color:0xffffff,roughness:.45,metalness:.15,envMap:KL_ENV,envMapIntensity:.4});
const steelM=new THREE.MeshStandardMaterial({vertexColors:true,map:KIT.tex('metal015',true,[1,1]),roughness:.6,metalness:.45,envMap:KL_ENV,envMapIntensity:.5});
const floorM=new THREE.MeshStandardMaterial({color:0x8a8e96,roughness:.7,metalness:.3,envMap:KL_ENV,envMapIntensity:.3});
const tileM=new THREE.MeshStandardMaterial({color:0xb8c4d8,roughness:.5,metalness:.2,envMap:KL_ENV,envMapIntensity:.3});
const panelM=new THREE.MeshStandardMaterial({color:0x6a7080,roughness:.55,metalness:.4,envMap:KL_ENV,envMapIntensity:.4});
const glassM=new THREE.MeshBasicMaterial({color:0x0a1830,transparent:true,opacity:.35,depthWrite:false});
// Bryce's texture cards: their textures go on the floors and walls drawn here (the card meshes themselves are not used)
const cardTex=(f,mat,rep)=>{if(typeof MODELS==='undefined')return;MODELS.raw(f).then(G=>{let map=null;G.scene.traverse(o=>{if(!map&&o.isMesh&&o.material&&o.material.map)map=o.material.map;});if(!map)return;
  const t=map.clone();t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.needsUpdate=true;mat.map=t;mat.color.setHex(0xffffff);mat.needsUpdate=true;}).catch(()=>{});};
cardTex('floor-material',floorM,[1,1]);cardTex('floor-tiles',tileM,[1,1]);cardTex('wall-3',panelM,[1,1]);
const K_WH=C(0xeef0f4),K_BL=C(0x2f5fb0),K_GD=C(0xc8a050),K_DK=C(0x23262e);

/* ---------- drawing ---------- */
const mgs=new Map(),mg=m=>{let b=mgs.get(m);if(!b){b=new Merger();mgs.set(m,b);}return b;};
// a floor or ceiling plate with world-space UVs (so the cards' textures tile at a fixed size: unit metres a repeat)
function plate(mat,r,y,unit,down){const w=r[1]-r[0],d=r[3]-r[2],g=new THREE.PlaneGeometry(w,d);g.rotateX(down?Math.PI/2:-Math.PI/2);
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){uv.setXY(i,uv.getX(i)*w/unit,uv.getY(i)*d/unit);}mg(mat).add(g,M((r[0]+r[1])/2,y,(r[2]+r[3])/2),K_WH);}
// the walls round an open rect: faces drawn where the rect meets the mass (sampled every half metre), so doorways stay open
function roomWalls(r,h,mat,col,skip){const step=.5;
  for(const [face,a0,a1,fix,inw] of[['n',r[0],r[1],r[2],1],['s',r[0],r[1],r[3],-1],['w',r[2],r[3],r[0],1],['e',r[2],r[3],r[1],-1]]){
    // (where a model is the room's wall, skip: the plain wall goes a little behind the model's, so no gap in the model shows space)
    let run=null,back=false;const flush=(a,b,bk)=>{if(b-a<.05)return;const L=b-a,ns=face==='n'||face==='s',g=boxUV(ns?L:.12,h+(bk?.3:0),ns?.12:L,2.5),o=bk?-.35:.06;
      mg(mat).add(g,ns?M((a+b)/2,(h+(bk?.3:0))/2,fix-inw*o):M(fix-inw*o,(h+(bk?.3:0))/2,(a+b)/2),bk?C(0x15171c):col);};
    for(let a=a0;a<=a1+1e-6;a+=step){const ns=face==='n'||face==='s',x=ns?a:fix-inw*.3,z=ns?fix-inw*.3:a,solid=!isOpen(x,z)&&a<a1,bk=!!(skip&&ns&&x>skip[0]&&x<skip[1]);
      if(solid&&run!==null&&bk!==back){flush(run,a,back);run=a;back=bk;}
      if(solid&&run===null){run=a;back=bk;}if((!solid||a>=a1-1e-6)&&run!==null){flush(run,Math.min(a,a1),back);run=null;}}}}
twin(s=>{
  const bay=R4(s,KL.BAY),sp=R4(s,KL.SPINE),cr=R4(s,KL.CRAWL),bk=R4(s,KL.BUNK);
  plate(tileM,bay,0,4);plate(panelM,bay,KL.BAY_H,5.3,true);roomWalls(bay,KL.BAY_H,panelM,C(0x9aa0aa));
  // the spine and the crawl: the hallway and corridor models are their walls, floor and ceiling; drawn here only past the models' ends
  const HW=s>0?[-21.9,-10]:[10,21.9],TB=s>0?[-19.1,-10.9]:[10.9,19.1];
  const sub=(r,a,b)=>[a,b,r[2],r[3]];
  for(const q of(s>0?[sub(sp,-22,-21.9),sub(sp,-10,-8)]:[sub(sp,8,10),sub(sp,21.9,22)])){plate(floorM,q,0,3);plate(whiteM,q,KL.SP_H,4,true);}plate(panelM,[sp[0],sp[1],sp[2]-.5,sp[3]+.5],KL.SP_H+.25,4,true);roomWalls(sp,KL.SP_H,whiteM,K_WH,HW);
  for(const q of(s>0?[sub(cr,-22,-19.1),sub(cr,-10.9,-8)]:[sub(cr,8,10.9),sub(cr,19.1,22)]))plate(floorM,q,0,2.6);plate(panelM,[cr[0],cr[1],cr[2]-.5,cr[3]+.5],KL.CR_H,2.6,true);roomWalls(cr,KL.CR_H,panelM,C(0x40444e),TB);
  plate(tileM,bk,0,3);plate(whiteM,bk,KL.BK_H,4,true);roomWalls(bk,KL.BK_H,whiteM,C(0xd8dce4));
  // blue and gold bands along the spine and the bunks
  for(const r of[bk])for(const z of[r[2]+.14,r[3]-.14]){mg(KIT.lampMat).add(boxUV(r[1]-r[0],.05,.03,1),M((r[0]+r[1])/2,1.05,z),K_BL.clone().multiplyScalar(1.6));mg(whiteM).add(boxUV(r[1]-r[0],.04,.04,1),M((r[0]+r[1])/2,1.2,z),K_GD);}
  // the bay: its team colour round the floor's edge
  const TC=C(GS.TEAMS[s>0?'blue':'red'].c).multiplyScalar(1.8);for(const z of[bay[2]+.2,bay[3]-.2])mg(KIT.lampMat).add(boxUV(bay[1]-bay[0],.04,.08,1),M((bay[0]+bay[1])/2,.03,z),TC);});
plate(floorM,KL.HOLD,0,4);plate(steelM,KL.HOLD,KL.HOLD_H,4,true);roomWalls(KL.HOLD,KL.HOLD_H,steelM,C(0x9a9ca4));
// the walkway's sides and the ramps' lit edges
for(const sx of[-1,1])mg(KIT.lampMat).add(boxUV(.04,.04,KL.WALK[3]*2,1),M(sx*1.62,KL.WALK_H+.02,0),C(0xff5a3a).multiplyScalar(1.4));
for(const [mat,b] of mgs){const m=new THREE.Mesh(b.build(),mat);m.receiveShadow=true;m.castShadow=mat!==KIT.lampMat&&!mat.transparent;m.userData.dyn=1;scene.add(m);}
// space through the bay's windows: stars on a sphere well outside the ship
{const N=900,p=new Float32Array(N*3);for(let i=0;i<N;i++){const u=rng()*2-1,a=rng()*6.283,r=1400,q=Math.sqrt(1-u*u);p.set([Math.cos(a)*q*r,u*r,Math.sin(a)*q*r],i*3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const st=new THREE.Points(g,new THREE.PointsMaterial({color:0xdfe8ff,size:1.6,sizeAttenuation:false,fog:false}));CITY.skies.push(st);scene.add(st);}

/* ---------- Bryce's props (js/shared/furnish.js): the rooms' furniture and the cover. Each half as written, its twin turned round ---------- */
if(typeof FURN!=='undefined'){const L=[],Q=Math.PI/2;
  twin(s=>{const P=(x,z)=>s>0?[x,z]:[-x,-z],r0=s>0?0:Math.PI,put=(e,x,z)=>{const p=P(x,z);L.push(Object.assign({},e,{x:p[0],z:p[1],ry:(e.ry||0)+r0}));};
    // the spine: two sections of the white Keeper hallway, end to end (its length along x)
    put({f:'hallway',ry:Q,sz:1.02,noShadow:true},-18.9,0);put({f:'hallway',ry:Q,sz:1.02,noShadow:true},-12.97,0);
    // the crawl: the dark corridor tube (its length along x), lights down it
    put({f:'corridor',ry:Q,noShadow:true},-15,8.8);
    for(const x of[-20.5,-9.5])put({f:'ceiling-light',ry:Q,y:KL.CR_H-.12,noShadow:true},x,8.8);
    // the bay: the landing deck's plate, drop seats along both walls, lockers, two hull windows in the back wall, a keypad by the spine
    put({f:'floor-panel',ry:Q,y:.01,noShadow:true},-28,0);
    for(const z of[-11.55,11.55])for(const x of[-31,-27.6])put({f:'chairs-x4',ry:z<0?0:Math.PI,solid:true},x,z);
    put({f:'locker',ry:Q,solid:true},-33.2,-6.5);put({f:'locker',ry:Q,solid:true},-33.2,6.5);
    for(const z of[-3.2,3.2])put({f:'wall-b',ry:Q,y:0,solid:true},-32.8,z);
    put({f:'keypad-panel',ry:-Q,y:.9,s:.6},-22.15,3.6);put({f:'medkit-small',ry:Math.PI,y:1.3},-22.08,-4.2);
    for(const z of[-6,0,6])put({f:'ceiling-light',y:KL.BAY_H-.12,noShadow:true},-28,z);
    // the bunks: three bunks along the north wall, the officer's lit bed, lockers, the machinery wall, lights
    for(const x of[-20.6,-19.4,-18.2])put({f:'bed',ry:0,solid:true},x,-13);
    put({f:'bed-led',ry:0,solid:true},-15,-12.9);put({f:'locker',ry:Math.PI,solid:true},-11.6,-6.75);put({f:'locker',ry:Math.PI,solid:true},-12.5,-6.75);
    put({f:'wall-4',ry:Math.PI,solid:true},-8.22,-12.6);put({f:'wall-c',ry:0,y:1.6},-17,-13.85);
    for(const x of[-19,-12])put({f:'ceiling-light',ry:Q,y:KL.BK_H-.12,noShadow:true},x,-10);
    // the crew's table by the hold door, a control panel left on it, a low sofa under the lights
    put({f:'table-chairs',ry:Q,solid:true},-11.3,-11.6);put({f:'control-panel',ry:.4,y:.5,s:.8},-11.2,-11.5);put({f:'chairs-set',p:'sofa',ry:0,solid:true},-19.5,-7.3);
    put({f:'floor-modular',p:'hatch',y:.005,s:1.4,noShadow:true},-17.5,-8.4);put({f:'floor-modular',p:'vent',y:.005,s:1.4,noShadow:true},-13.5,-8.4);
    // the hold: half of it (the twin is the other half): lockers and a console for cover, a fuel cell and a gas bottle, a hatch
    put({f:'locker',ry:Q,solid:true},-7.35,5);put({f:'computer-console',ry:Q,solid:true},-5,-3.5);put({f:'chairs-set',p:'swivel',ry:Q},-6.2,-3.5);put({f:'fuel-cell',solid:'r'},-4.6,10.2);
    put({f:'gas-bottle',solid:'r'},-6.9,-5.6);put({f:'gas-bottle',solid:'r'},-6.4,-6.1);put({f:'wall-2',ry:0,s:.9,y:.2},-1.5,-13.5);
    put({f:'catwalk-bridge',ry:Q,sx:.45,sy:1.55,y:0,noShadow:true},0,KL.WALK[2]-1.38);
    put({f:'roof-panel',y:KL.HOLD_H-.2,noShadow:true},-3.75,-7);put({f:'roof-panel',y:KL.HOLD_H-.2,noShadow:true},-3.75,0);
  });
  L.push({f:'floor-section-b',p:'b',x:0,z:0,y:0,noShadow:false});   // the hold's walkway (the middle piece; drawn once)
  // hatch plates in the hold's floor: tiles out of the modular floor pack (split by box in js/shared/furnish.js)
  twin(s=>{for(const [x,z,p] of[[-5.5,8,'hatch'],[-5.5,-10,'grille'],[-3,12,'plate']])L.push({f:'floor-modular',p,x:s*x,z:s*z,y:.005,s:1.6,noShadow:true});});
  FURN.place(L);}

// racks: one in each bay, one in each half of the hold (against a plain wall); doorways and the walkway's ramps are no place for one
GS.RACKS=[{x:-33.2,z:-9.5},{x:33.2,z:9.5},{x:-7.4,z:12.6},{x:7.4,z:-12.6}];
{const NP=window.NO_PLACE=window.NO_PLACE||[];for(const r of DOORS)NP.push({x:(r[0]+r[1])/2,z:(r[2]+r[3])/2,r:2});NP.push({x:0,z:-8,r:2.4},{x:0,z:8,r:2.4});}

/* ---------- light: the bays in their team colour, cold white down the spine and the bunks, the hold's work lamps, red in the crawl ---------- */
hemi.color.copy(C(0x8a96b0));hemi.groundColor.copy(C(0x1a1c24));hemi.intensity=.75;
keyLight.intensity=0;
{const L=[];twin(s=>{L.push([-28*s,5.5,0,GS.TEAMS[s>0?'blue':'red'].c,1.6,16],[-15*s,2.8,0,0xe8f0ff,1.2,10],[-15*s,1.9,8.8*s,0xff4a3a,.9,8],[-15*s,3,-10*s,0xe8f0ff,1,10],[-4*s,5.2,-7*s,0xffe2c0,2.2,16],[-4*s,4.6,8*s,0xd8e4ff,1.4,13]);});
  const LL=coarse?L.filter((_,i)=>i%5!==2):L;for(const [x,y,z,c,i,d] of LL){const p=new THREE.PointLight(C(c),i,d,1.6);p.position.set(x,y,z);scene.add(p);}}
if(typeof BLOOM!=='undefined'&&BLOOM){BLOOM.strength=.6;BLOOM.threshold=.78;}

/* ---------- the sound: the ship's hum ---------- */
const KL_SND=KIT.sound([{f:[['lowpass',140]],v:.14,swell:.2,rate:.2},{f:[['bandpass',1200]],v:.015,swell:.5,rate:1.3}]);
GS.indoorAt=()=>1;
dust.material.color.copy(C(0xc8d4e8));dust.material.opacity=.25;

KIT.flush();

/* ---------- the bots' map ---------- */
const NAV=KIT.nav({step:1.6,perchY:3});
GS.HILLS=[{x:0,z:0},{x:0,z:-10},{x:0,z:10},{x:-5,z:4},{x:5,z:-4},{x:-15,z:0},{x:15,z:0},{x:-15,z:8.8},{x:15,z:-8.8},{x:-15,z:-10},{x:15,z:10},{x:-5,z:-11},{x:5,z:11}];
GS.INTRO=[[[-32,4.5,-9],[-22,1.6,0]],[[-21,1.7,0],[-8,1.6,0]],[[-6,4.6,-12],[4,1.2,4]],[[6,1.7,11],[20,1.7,0]]];
