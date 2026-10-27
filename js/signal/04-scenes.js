/* Elyra · The Last Signal — the cutscenes, the sets they need, the jumps, the loop.
     introScene   the interceptor low over the river at night, ELYRA and Elias on the channel: the signal is still going out
     landScene    down on the transfer pad, out of the cockpit
     rescueScene  Rhen's cell opens
     endScene     the Keeper dropship Mercy: Michael opposite Rhen, the crew asleep where they sit, the device on the floor between
                  them. Bryce's scene (docs/lore-2026-10-26, the level brief), word for word. Then Mercy climbs out over the
                  mountains into first light, and Astraea is the next stop.
   The bay is built at load, far off the map (x +30000), so its lights and shaders are warmed with everything else. */
const SETS={inBay:false,active:false,update(){}};
/* ---------- your interceptor, on the pad once you've landed (solid) ---------- */
const MYSHIP=makeInterceptor();MYSHIP.visible=false;
const SHIP_AT={x:LZ.x+7,z:LZ.z+4,ry:Math.PI*.82};
function parkShip(){const k=MYSHIP.userData.k;MYSHIP.position.set(SHIP_AT.x,1.6,SHIP_AT.z);MYSHIP.rotation.set(0,SHIP_AT.ry,0);MYSHIP.visible=true;if(!parkShip.ob){parkShip.ob=1;OBST.push({x:SHIP_AT.x,z:SHIP_AT.z,r:3.4,h:3},{x:SHIP_AT.x+Math.sin(SHIP_AT.ry)*5,z:SHIP_AT.z+Math.cos(SHIP_AT.ry)*5,r:2.8,h:3});}}

const crew=()=>[P.H,...SQUAD.map(A=>A.H)];
const face=(a,b)=>Math.atan2(-(b.x-a.x),-(b.z-a.z));
function vcol(g,c){const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
// the stage's people are made once, at load, and hidden (so their models are dressed and warmed behind the loading screen)
{const _ss=stageStart;stageStart=function(){if(stageOn)return;stageOn=true;for(const Q of STAGE_PEOPLE)Q.H.root.visible=!!Q.guard;};}
{const S=STAGE_SET;for(let k=0;k<8;k++){const H=makeHuman('colonist');scene.add(H.root);MODELS.dress(H,'keepers-civilian',{unarmed:true});H.root.position.copy(S.door);H.root.visible=false;STAGE_PEOPLE.push({H,t:-k*2.6,guard:false});}
 for(const [a,b] of[[-10,-4],[8,-8]]){const H=makeHuman('trooper');scene.add(H.root);MODELS.enemy(H,'host',{unit:'footsoldier',k:window.HOST_LIFT||.5});
   H.root.position.set(STAGE.cx+STAGE.tx*a+STAGE.nx*b,STAGE.fy,STAGE.cz+STAGE.tz*a+STAGE.nz*b);H.root.visible=false;STAGE_PEOPLE.push({H,guard:true,a,b});}}
stageStop=function(){if(!stageOn)return;stageOn=false;for(const Q of STAGE_PEOPLE)Q.H.root.visible=false;};
// the gunship and Mercy, made at load and hidden until the pad
GUNSHIP=makeGunship();GUNSHIP.visible=false;PICKUP=makeDropship();PICKUP.visible=false;

/* ---------- the dropship's bay: two benches facing each other, the ramp at the back, Keeper blue and gold, a dim cabin light ---------- */
const BAY=(()=>{const O=V3(30000,0,0),G=new THREE.Group();G.position.copy(O);scene.add(G);
  const metalMat=new THREE.MeshStandardMaterial({map:panelTex,vertexColors:true,roughness:.5,metalness:.55}),lightMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  const m=new Merger(),gm=new Merger(),hull=C(0x6a707a),dk=C(0x22262e),bl=C(0x284c78),gd=C(0xd9b25a),wht=C(0xcfe6ff),amb=C(0xffb070);
  m.add(boxUV(6.4,.2,14.4,2),M(0,-.1,0),dk);m.add(boxUV(6.4,.2,14.4,2),M(0,3.6,0),hull);
  for(const s of[-1,1]){m.add(boxUV(.2,3.6,14.4,2),M(s*3.2,1.8,0),hull);m.add(boxUV(.7,.12,10,2),M(s*2.7,.5,0),dk);m.add(boxUV(.7,.5,10,2),M(s*2.7,.22,0),C(0x2c3038));
    m.add(boxUV(.12,.9,10,2),M(s*3.05,1.3,0),bl);m.add(boxUV(.08,.08,13,2),M(s*1.5,3.25,0),gd);m.add(boxUV(.1,1.1,10,2),M(s*3.0,.95,0),C(0x3a4250));   // seat backs
    gm.add(new THREE.BoxGeometry(.05,.05,13.6),M(s*3.08,3.3,0),amb);gm.add(new THREE.BoxGeometry(.05,.04,13.6),M(s*3.08,.08,0),wht);
    for(let z=-4;z<=4;z+=2)m.add(boxUV(.08,1.2,.08,1),M(s*2.95,2.4,z),gd);}   // harness hooks
  for(let z=-6;z<=6;z+=2.4){m.add(boxUV(6.4,.3,.3,2),M(0,3.4,z),dk);for(const s of[-1,1])m.add(boxUV(.3,3.4,.3,2),M(s*3,1.7,z),dk);}
  for(const s of[-1,1])m.add(boxUV(2.4,3.6,.2,2),M(s*2,1.8,-7.2),hull);m.add(boxUV(1.6,1.2,.2,2),M(0,3,-7.2),hull);gm.add(new THREE.BoxGeometry(1.4,.05,.05),M(0,2.35,-7.1),wht);
  m.add(boxUV(6.4,3.6,.2,2),M(0,1.8,7.2),hull);gm.add(new THREE.BoxGeometry(5.6,.06,.05),M(0,3.4,7.08),C(0xff3a2a));
  // two small windows in the hull, the sky going pale outside them
  for(const z of[-3,3])gm.add(new THREE.PlaneGeometry(.7,.45),M(-3.08,2.3,z,0,Math.PI/2,0),C(0xe8b890));
  const G1=new THREE.Mesh(m.build(),metalMat);G1.castShadow=G1.receiveShadow=true;G.add(G1,new THREE.Mesh(gm.build(),lightMat));
  const L1=new THREE.PointLight(C(0xffc89a),1.6,11,1.4);L1.position.set(0,3.1,-1);G.add(L1);const L2=new THREE.PointLight(C(0x9fc8ff),.7,10,1.6);L2.position.set(0,2.4,3);G.add(L2);
  // the device, out of its case, on the floor between the two benches: tall, narrow, black glass, light moving inside it
  const og=new THREE.OctahedronGeometry(1,3),P0=og.attributes.position;for(let i=0;i<P0.count;i++){const y=P0.getY(i);P0.setXYZ(i,P0.getX(i)*.34*(1-Math.abs(y)*.25),y*1.15,P0.getZ(i)*.34*(1-Math.abs(y)*.25));}og.computeVertexNormals();
  const U={uT:{value:0},wake:{value:.2}};
  const obj=new THREE.Mesh(og,new THREE.ShaderMaterial({uniforms:U,vertexShader:'varying vec3 vN;varying vec3 vP;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vP=position;vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:`varying vec3 vN;varying vec3 vP;varying vec3 vV;uniform float uT,wake;
    void main(){float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.5);float a=atan(vP.z,vP.x);
      float l1=smoothstep(.97,1.0,sin(vP.y*9.0+a*3.0+uT*.7+sin(uT*.31)*4.0));float l2=smoothstep(.985,1.0,sin(vP.y*-13.0+a*5.0-uT*.43));
      vec3 c=vec3(.01,.01,.02)+vec3(.55,.6,.9)*f*.6+vec3(.75,.85,1.0)*(l1+l2)*(.6+wake*2.4)+vec3(1.0,.95,.8)*wake*f*1.4;gl_FragColor=vec4(c,1.0);}`}));
  obj.scale.setScalar(.42);obj.position.set(0,.5,0);G.add(obj);const halo=glowSprite(0xa8b8ff,1.6,1.2,.35);obj.add(halo);halo.scale.setScalar(3.4);
  // the crew's recorder: a field set with a green light (the local recording)
  const rec=new THREE.Group(),rb=new THREE.Mesh(vcol(boxUV(.22,.08,.14,1),C(0x2a2e34)),metalMat),rl=glowSprite(0x4aff8a,.12,2.4,.9);rl.position.set(.06,.06,0);rec.add(rb,rl);rec.position.set(2.45,.62,.55);G.add(rec);
  return{O,G,obj,U,halo,rec,rl,L1,L2,w:(x,y,z)=>V3(O.x+x,O.y+y,O.z+z)};})();
// sitting: hips and knees bent, the hips set onto the bench (call after poseHuman)
const _hp=V3(0,0,0);
function sitPose(H,seatY,lean){const [L0,L1]=H.legs;for(const L of[L0,L1]){L.hp.rotation.x=1.45;L.kn.rotation.x=-1.5;}H.hip.rotation.x=0;H.torso.rotation.x=lean||.12;
  H.root.updateMatrixWorld(true);H.hip.getWorldPosition(_hp);H.root.position.y+=seatY+.1-_hp.y;}
function restArms(H,k){for(const A of H.arms){A.sh.rotation.x=-.55*(k||1);A.el.rotation.x=-.9*(k||1);}}

/* ---------- the opening: the river, the mountains, the signal ---------- */
function introScene(done){
  setPhase('intro');P.H.root.visible=false;MYSHIP.visible=true;
  // (Oct 26) she follows the valley's own bends now (the lead-in at the head of VAL), low over the river, and the last frame is exactly
  // where you take the stick (VAL_FLY_U): no flying through the mountains, no jumping back over the start
  const V=58,T0=4.2,T1=29,uAt=t=>VAL_FLY_U-(T1-Math.max(t,T0))*V;let clk=0,curU=uAt(0);   // her own clock: shots wait on their lines (about 29 s in all), and she just keeps flying
  const
    sm=(u,o)=>{o=o||V3();o.set(0,0,0);const q=V3();for(const k of[-60,-30,0,30,60]){valPt(clamp(u+k,0,VAL_LEN),q);o.add(q);}return o.multiplyScalar(.2);},
    tan=(u,o)=>{const a=sm(u-25),b=sm(u+25);return(o||V3()).copy(b).sub(a).setY(0).normalize();},
    side=(u,o)=>{const d=tan(u);return(o||V3()).set(-d.z,0,d.x);},
    _a=V3(),_b=V3(),_c=V3();let roll=0;
  const fly=(t,dt)=>{clk+=dt||0;t=clk;const u=curU=uAt(t),p=sm(u),d=tan(u),d2=tan(u+90);MYSHIP.position.set(p.x,RIVER_Y+34+Math.sin(t*.8)*1.5,p.z);
    const turn=Math.atan2(d.x*d2.z-d.z*d2.x,d.x*d2.x+d.z*d2.z);roll+=(clamp(turn*1.6,-.5,.5)-roll)*Math.min(1,(dt||.016)*2);
    MYSHIP.rotation.set(-.02,Math.atan2(-d.x,-d.z),roll+Math.sin(t*.6)*.04);};
  const p0=sm(uAt(T0)),p1=sm(uAt(T0)+260);
  playCut([
    {dur:4.2,black:true,small:'Last Transmission · Level 05 · 13.03.2237',cap:'The Last Signal',cam:[[p0.x,RIVER_Y+60,p0.z]],look:[[p1.x,RIVER_Y+30,p1.z]],fn:(t,dt)=>fly(0,dt),score:'awe'},
    // low over the river at night, the mountains black on both sides, the alien sky over them: the camera trails her round the bends
    {dur:7,camAt:(u,t,o)=>{const cu=curU-260+u*120;sm(cu,o).addScaledVector(side(cu,_a),60);o.y=RIVER_Y+10+u*6;return o;},lookAt:(u,t,o)=>o.copy(MYSHIP.position),
      say:[[.6,'ELYRA','Lieutenant. Part of the Pathfinder’s last transmission isn’t a recording. It’s still going out. Now.']],fn:(t,dt)=>fly(0,dt)},
    {dur:6,camAt:(u,t,o)=>{const su=curU,d=tan(su,_a),n=side(su,_b);return o.copy(MYSHIP.position).addScaledVector(d,-26).addScaledVector(n,8).setY(MYSHIP.position.y+5-u);},
      lookAt:(u,t,o)=>o.copy(MYSHIP.position).addScaledVector(tan(curU,_c),60),
      say:[[.3,'Lt. Michael','From where?'],[0,'ELYRA','Elyra’s southern mountains. A valley Command has no name for.']],fn:(t,dt)=>fly(0,dt)},
    {dur:6.5,camAt:(u,t,o)=>{const su=curU,d=tan(su,_a),n=side(su,_b);return o.copy(MYSHIP.position).addScaledVector(d,34).addScaledVector(n,6).setY(MYSHIP.position.y+3);},
      lookAt:(u,t,o)=>o.copy(MYSHIP.position).add(_c.set(0,1,0)),
      say:[[.4,'Elias Veyr','One interceptor, Michael. No noise. If it’s them, bring them home. If it isn’t, come home anyway.'],[0,'Lt. Michael','Understood, Master.']],fn:(t,dt)=>fly(0,dt)},
  ],sk=>{if(sk||clk<T1){clk=T1;fly(0,0);}done&&done();},{hush:true});   // skipped: she's put where the shot would have ended
}
/* ---------- down on the pad ---------- */
function landScene(){
  setPhase('landcut');const from=MYSHIP.position.clone(),q0=MYSHIP.quaternion.clone(),qL=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,SHIP_AT.ry,0)),
    hover=V3(SHIP_AT.x,14,SHIP_AT.z),down=V3(SHIP_AT.x,1.6,SHIP_AT.z),seat=V3(SHIP_AT.x-2.4,0,SHIP_AT.z+1.2),stand=V3(LZ.x-4,0,LZ.z-14);
  P.H.root.visible=false;camera.fov=62;camera.updateProjectionMatrix();
  playCut([
    {dur:6,camAt:(u,t,o)=>o.set(LZ.x-26+u*6,8,LZ.z-30),lookAt:(u,t,o)=>o.copy(MYSHIP.position),
      say:[[1,'Lt. Michael','ELYRA, I’m down.']],
      fn:(t,dt)=>{const u=sstep(0,3.6,t);MYSHIP.position.lerpVectors(from,hover,u);MYSHIP.quaternion.slerpQuaternions(q0,qL,u);if(t>3.4)MYSHIP.position.lerpVectors(hover,down,sstep(3.4,5.4,t));
        if(t>5.2&&!landScene.d){landScene.d=1;for(let k=0;k<8;k++)puff(V3(SHIP_AT.x+R(-8,8),.6,SHIP_AT.z+R(-8,8)),R(2,4),3);if(typeof sfx!=='undefined'&&sfx.thud)sfx.thud();}}},
    // out of the cockpit and down onto the pad; the cliff, the mast with its red light, the yard's mouth
    {dur:7,cam:[[LZ.x+6,1.7,LZ.z-24],[LZ.x+4,1.9,LZ.z-26]],look:[[LZ.x-2,1.6,LZ.z-6],[MAST.x,MAST.y-20,MAST.z]],
      say:[[.8,'ELYRA','I have you. The facility runs back over the summit and down into the peak. The signal is coming from that mast, on the very top.'],[0,'Lt. Michael','Then I go through it.']],
      fn:(t,dt)=>{MYSHIP.position.copy(down);MYSHIP.quaternion.copy(qL);P.H.root.visible=t>.6;const u=sstep(.6,6.5,t);P.pos.lerpVectors(seat,stand,u);P.pos.y=0;P.H.root.rotation.y=face(seat,stand);poseHuman(P.H,dt,u>0&&u<1?2.4:0,.5,false);}},
  ],()=>{parkShip();P.H.root.visible=true;P.pos.copy(stand);P.yaw=face(stand,apPt(-AP_LEN+60).clone());P.pitch=-.02;setPhase('ledge');saveCP('pad');banner('Along the ledge to the facility');},{hush:true});
}
/* ---------- the flight (js/signal/03-air.js) ---------- */
function startAir(keep){setPhase('air');P.H.root.visible=false;MYSHIP.visible=true;
  FLY.start(MYSHIP,{keep,done:()=>{landScene();},crash:()=>{
    const el=document.createElement('div');el.className='pgend pgbrief';el.innerHTML=`<div class="card"><h2>INTERCEPTOR DOWN</h2><p>She came apart in the valley. Fly it again.</p><div class="row"><button type="button" class="primary" id="airAgain">Fly again</button></div></div>`;
    document.body.appendChild(el);PG.paused=true;try{if(document.exitPointerLock)document.exitPointerLock();}catch(_){}
    el.querySelector('#airAgain').addEventListener('click',()=>{el.remove();PG.paused=false;wentDown=true;startAir();});}});}

/* ---------- Rhen's cell ---------- */
function rescueScene(){const c=RHEN.cell,F=c.F,inside=V3(F.fx+F.ox*1.6,0,F.fz+F.oz*1.6),out=V3(F.fx-F.ox*1.6,0,F.fz-F.oz*1.6),me=V3(F.fx-F.ox*3.4+F.tx*.8,0,F.fz-F.oz*3.4+F.tz*.8);
  for(const E of ENEMIES)if(!E.H.dead&&E.pos.distanceTo(P.pos)<30&&!E.perch){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  P.pos.copy(me);RHEN.pos.copy(inside);
  playCut([
    {dur:5,camAt:(u,t,o)=>o.set(me.x-F.tx*1.4+F.ox*.4,1.75,me.z-F.tz*1.4+F.oz*.4),lookAt:(u,t,o)=>o.set(RHEN.pos.x,1.6,RHEN.pos.z),
      say:[[.8,'Captain Rhen','Interceptor Wing.'],[0,'Lt. Michael','Lieutenant Hall, Captain. I followed your signal.']],
      fn:(t,dt)=>{RHEN.pos.lerpVectors(inside,out,sstep(.4,3.4,t));RHEN.H.root.rotation.y=face(RHEN.pos,me);poseHuman(RHEN.H,dt,t>.4&&t<3.4?1.2:0,0,false);P.H.root.rotation.y=face(me,RHEN.pos);poseHuman(P.H,dt,0,.4,false);}},
    {dur:5.5,camAt:(u,t,o)=>o.set(RHEN.pos.x+F.tx*1.5-F.ox*.9,1.7,RHEN.pos.z+F.tz*1.5-F.oz*.9),lookAt:(u,t,o)=>o.set(P.pos.x,1.65,P.pos.z),
      say:[[.5,'Captain Rhen','Then it’s still going out.'],[1.2,'Captain Rhen','Good.'],[0,'Captain Rhen','Two more of mine, down the row. Get them out. I’ll take a rifle off one of these.']],
      fn:(t,dt)=>{RHEN.H.root.rotation.y=face(RHEN.pos,P.pos);poseHuman(RHEN.H,dt,0,.2,false);P.H.root.rotation.y=face(me,RHEN.pos);poseHuman(P.H,dt,0,.4,false);}},
  ],()=>{P.yaw=face(P.pos,at(roadS(P.pos.x,P.pos.z)+10,0));P.pitch=-.03;setPhase('detention');},{hush:true});}

/* ---------- THE LAST TRANSMISSION: the dropship. Bryce's scene, word for word ---------- */
function endScene(){
  for(const E of ENEMIES)if(!E.H.dead){scene.remove(E.H.root);E.H.dead=1;E.gone=99;}
  SETS.inBay=true;alarmOn=0;blackout=0;WARP.d.style.opacity=0;
  const W=BAY.w,me=W(-2.35,0,.1),rh=W(2.35,0,-.1),c1=W(2.35,0,2.2),c2=W(-2.35,0,2.6),HM=P.H,HR=RHEN.H,others=SQUAD.filter(A=>A!==RHEN);
  hemi.intensity=.25;keyLight.intensity=.15;
  const seatAll=(dt,talker)=>{HM.root.position.copy(me);HM.root.rotation.y=-Math.PI/2;poseHuman(HM,dt,0,0,false);sitPose(HM,.5,talker==='m'?.05:.18);restArms(HM);
    HR.root.position.copy(rh);HR.root.rotation.y=Math.PI/2;poseHuman(HR,dt,0,0,false);sitPose(HR,.5,talker==='r'?.05:.2);restArms(HR);
    others.forEach((A,i)=>{const H=A.H;H.root.position.copy(i?c2:c1);H.root.rotation.y=i?-Math.PI/2:Math.PI/2;poseHuman(H,dt,0,0,false);sitPose(H,.5,.45);restArms(H,1.2);H.head&&(H.head.rotation.x=.5);});};
  for(const H of[HM,HR,...others.map(A=>A.H)])H.root.visible=true;CASE.g.visible=false;
  const objHome=BAY.obj.position.clone(),objHands=V3(-1.75,1.05,.1),objRhen=V3(1.75,1.05,-.1);let rumbleT=0;
  const rumble=dt=>{rumbleT-=dt;BAY.G.position.y=Math.sin(T*9)*.004;if(rumbleT<=0){rumbleT=R(2,4);shakeT=Math.max(shakeT,.15);}BAY.U.uT.value=T;};
  playCut([
    // the bay, from the cockpit door: the two of them facing each other, the crew asleep where they sit, the device on the floor
    {dur:6,cam:[[BAY.O.x,2.4,-6.2],[BAY.O.x,2.2,-5.6]],look:[[BAY.O.x,1,1.2]],
      say:[[2.2,'Lt. Michael','I heard your voice beneath the mountain.']],fn:(t,dt)=>{seatAll(dt,t>2.2?'m':'');rumble(dt);}},
    {dur:4,camAt:(u,t,o)=>o.copy(W(-3.0,1.55,.95)),lookAt:(u,t,o)=>o.copy(W(2.3,1.25,-.1)),
      say:[[.3,'Captain Rhen','Then you heard the warning.']],fn:(t,dt)=>{seatAll(dt,'r');rumble(dt);}},
    {dur:4,camAt:(u,t,o)=>o.copy(W(3.0,1.55,-.95)),lookAt:(u,t,o)=>o.copy(W(-2.3,1.25,.1)),
      say:[[.3,'Lt. Michael','I heard you calling my name.']],fn:(t,dt)=>{seatAll(dt,'m');rumble(dt);}},
    // Rhen looks at him
    {dur:5.5,camAt:(u,t,o)=>o.copy(W(.9-u*.2,1.35,-1.2)),lookAt:(u,t,o)=>o.copy(W(2.3,1.3,-.1)),
      say:[[1.6,'Captain Rhen','I heard it too. Before I knew who you were.']],fn:(t,dt)=>{seatAll(dt,'r');HR.head.rotation.x=-.05;rumble(dt);}},
    // a moment of silence: the thing on the floor between them, its light moving
    {dur:5,camAt:(u,t,o)=>o.copy(W(.6,.45+u*.15,1.6-u*.3)),lookAt:(u,t,o)=>o.copy(W(0,.55,0)),fn:(t,dt)=>{seatAll(dt,'');rumble(dt);BAY.U.wake.value=.2+.1*Math.sin(T*1.3);}},
    {dur:9,camAt:(u,t,o)=>o.copy(W(-3.0,1.55,.95)),lookAt:(u,t,o)=>o.copy(W(2.3,1.25,-.1)),
      say:[[.4,'Lt. Michael','What did you find on Astraea?'],[0,'Captain Rhen','A civilization that destroyed itself trying to fight something it didn’t understand.'],[0,'Lt. Michael','The Heralds?'],[0,'Captain Rhen','No. The people who came before them.']],
      fn:(t,dt)=>{seatAll(dt,'r');rumble(dt);}},
    // Rhen places the suppressor in Michael's hands, and the crew's recorder with it
    {dur:9,camAt:(u,t,o)=>o.copy(W(0,1.9,-2.4+u*.3)),lookAt:(u,t,o)=>o.copy(W(0,1,.2)),
      say:[[2.2,'Captain Rhen','We didn’t bring back a weapon, Lieutenant.'],[0,'Lt. Michael','Then what is it?'],[0,'Captain Rhen','A chance.']],
      fn:(t,dt)=>{seatAll(dt,'r');rumble(dt);const k1=sstep(.2,1.4,t),k2=sstep(1.6,3,t);
        if(k2<=0){BAY.obj.position.lerpVectors(objHome,objRhen,k1);HR.torso.rotation.x=.2+.35*(1-Math.abs(k1-.5)*2);for(const A of HR.arms){A.sh.rotation.x=-1.2*k1-.2;A.el.rotation.x=-.5;}}
        else{BAY.obj.position.lerpVectors(objRhen,objHands,k2);for(const A of HR.arms){A.sh.rotation.x=-1.4*(1-k2*.7);A.el.rotation.x=-.4;}for(const A of HM.arms){A.sh.rotation.x=-1.2*k2;A.el.rotation.x=-.6;}}
        if(t>3.2){BAY.obj.position.copy(objHands);for(const A of HM.arms){A.sh.rotation.x=-1.15;A.el.rotation.x=-.7;}BAY.rec.position.lerp(W(-1.9,.62,.55).sub(BAY.O),Math.min(1,dt*1.5));}
        BAY.U.wake.value=.25+sstep(2.6,4,t)*.25;}},
    // ELYRA interrupts
    {dur:7,camAt:(u,t,o)=>o.copy(W(-3.05,1.6,-1.1+u*.3)),lookAt:(u,t,o)=>o.copy(W(-1.8,1.05,.1)),
      say:[[.5,'ELYRA','Lieutenant Hall. Coordinates recovered from the Pathfinder’s original transmission. Destination: Astraea.']],
      fn:(t,dt)=>{seatAll(dt,'m');rumble(dt);BAY.obj.position.copy(objHands);for(const A of HM.arms){A.sh.rotation.x=-1.15;A.el.rotation.x=-.7;}BAY.rl.material.opacity=(Math.floor(T*2)%2)?1:.2;}},
    // the camera pulls away from the dropship as it climbs off the peak, above the mountains, into first light
    {dur:9,camAt:(u,t,o)=>{const p=PICKUP.position;o.set(p.x-60-u*140,p.y+10+u*60,p.z+70+u*160);},lookAt:(u,t,o)=>o.copy(PICKUP.position),score:'awe',
      fn:(t,dt)=>{if(t<.1&&SETS.inBay){SETS.inBay=false;setLook('dawn');for(const H of crew())H.root.visible=false;}
        const u=t/9;PICKUP.visible=true;PICKUP.position.set(PLAT.x+120+u*900,PLAT_Y+60+u*420,PLAT.z-80-u*500);PICKUP.rotation.set(-.18,Math.atan2(-.9,.5),Math.sin(t*.7)*.05);}},
    {dur:4.5,black:true,small:'Mission complete',cap:'The Last Signal',camAt:(u,t,o)=>o.copy(PICKUP.position).add(V3(-200,80,260)),lookAt:(u,t,o)=>o.copy(PICKUP.position)},
  ],()=>{setPhase('end');finishMission();},{hush:true,score:'sorrow'});
}
// what this level hands on (Bryce's brief: crewRescued, suppressorRecovered, localRecordingRecovered, astraeaLeadUnlocked)
function setFlags(){try{const F=JSON.parse(localStorage.getItem('elyra.flags')||'{}');Object.assign(F,{crewRescued:true,suppressorRecovered:true,localRecordingRecovered:true,astraeaLeadUnlocked:true});localStorage.setItem('elyra.flags',JSON.stringify(F));}catch(_){}}
function finishMission(){
  if(P.kills>=30)PG.done('lskills');if(!wentDown)PG.done('pdown');if(CASE.g.visible||ART.taken)PG.done('lsrhen');PG.ach('lastsignal');setFlags();clearCP();
  PG.finish({title:'THE LAST SIGNAL',text:`Michael followed the signal up a valley with no name, into the Empty Host’s cliffs, and brought Captain Rhen and what is left of his crew out of their cells. The device they carried off a dead moon is in Keeper hands again. It quiets the voices. It does not stop the guns. And the Pathfinder’s own recording points at one place: Astraea. Troopers and fighters down: ${P.kills}. Threat level: ${DIFF.name}.`,
    buttons:[{text:'Menu',href:'index.html',primary:true},{text:'Play again',onClick:()=>location.reload()}]});}

/* ---------- jumps (checkpoints, and testing: last-signal.html?at=air|pad|yard|gate|halls|overlook|cells|escort|contain|door|vault|extract|hold|end|bay) ---------- */
function jumpTo(atq){P.input=true;
  if(atq==='air'){startAir();return;}
  parkShip();appIdx=APP.length;
  const put=(s,lat)=>{const p=s<0?apAt(s,lat||0):at(s,lat||0);P.pos.copy(p);const q=s<0?apAt(s+5,0):at(s+5,0);P.yaw=face(p,q);
    SQUAD.forEach((A,i)=>{const r=s<0?apAt(s-3-i*2,(i-1)*2):at(Math.max(0,s-3-i*2),(i-1)*2);A.pos.copy(r);});};
  if(atq==='pad'){appIdx=0;P.pos.set(LZ.x-4,0,LZ.z-14);P.yaw=face(P.pos,apPt(-AP_LEN+60).clone());setPhase('ledge');banner('Checkpoint · '+CP_NAME.pad);return;}
  if(atq==='yard'){put(4);setPhase('yard');return;}
  if(atq==='gate'){encIdx=3;put(S_GATE-12);setPhase('yard');return;}
  LOCK.done=true;GATE.sliding=true;LOCK.open=1;for(const L of GATE.leaves)L.L.position.x=L.x0+L.s*7.4;barrier('gate').open=true;LOCK.l.material.color.copy(C(0x4aff8a)).multiplyScalar(2.4);
  if(atq==='halls'){encIdx=3;put(S_GATE+6);setPhase('halls');banner('Checkpoint · '+CP_NAME.halls);return;}
  if(atq==='overlook'){encIdx=4;put(S_BAY0-12);setPhase('halls');return;}
  const free=()=>{for(const c of CELLS)if(c.live){c.opening=true;c.openK=1;c.open=true;const F=c.F;c.slab.position.set(F.fx-F.ox*.15-F.tx*(c.w+.1),0,F.fz-F.oz*.15-F.tz*(c.w+.1));c.lock.material.color.copy(C(0x4aff8a)).multiplyScalar(2);
    const A=c.ally;A.on=true;if(!SQUAD.includes(A))SQUAD.push(A);}for(const t of CELL_TASKS)t.done=true;freed=3;firstCellT=T;said.add('o4');};
  if(atq==='cells'){encIdx=5;put(S_HALL0+2);setPhase('detention');banner('Checkpoint · '+CP_NAME.cells);return;}
  free();encIdx=ENC.length;
  if(atq==='escort'){put(S_HALL1-30);setPhase('escort');escT=2;return;}
  if(atq==='contain'){put(S_OLD+8);setPhase('contain');banner('Checkpoint · '+CP_NAME.contain);return;}
  if(atq==='door'){enc.add('c1');enc.add('c2');put(S_DOOR-20);setPhase('contain');return;}
  DOOR.open=1;updateDoor(.01);barrier('door').open=true;doorSeen=true;openVault();
  if(atq==='vault'){const rg=chamberRig();P.pos.copy(rg.inAt[0]);P.yaw=face(P.pos,CH);SQUAD.forEach((A,i)=>A.pos.copy(rg.inAt[i+1]));setPhase('vault');vaultStart();banner('Checkpoint · '+CP_NAME.vault,'alert');return;}
  for(const E of EMIT){E.off=true;E.on=0;}VS.cut=true;VS.shut=3;VS.wave=2;SDOOR.go=true;SDOOR.open=1;SDOOR.slab.position.y=SDOOR.H-1.1;barrier('exit').open=true;ART.taken=true;ART.obj.visible=ART.halo.visible=ART.motes.visible=false;ART.fieldOn=0;CASE.g.visible=true;BASE.art=0;ART.light.intensity=0;alarmOn=1;blackout=.35;WARP.suppressed=true;
  if(atq==='extract'){put(S_RAMP-6);setPhase('extract');banner('Checkpoint · '+CP_NAME.extract,'alert');return;}
  shutT=0;barrier('shutter').open=false;SHUTTER.drop=true;SHUTTER.y=.01;
  P.pos.set(PLAT.x-6,PLAT_Y,PLAT.z);SQUAD.forEach((A,i)=>A.pos.set(PLAT.x-10,PLAT_Y,PLAT.z+(i-1)*3));
  if(atq==='bay'){setPhase('endcut');PICKUP.position.set(PLAT.x+PLAT.r+8.6,PLAT_Y+.3,PLAT.z);endScene();return;}
  if(atq==='end'){startHold();hold.t=.1;return;}
  startHold();banner('Checkpoint · '+CP_NAME.hold,'alert');}

/* ---------- main loop ---------- */
let last=performance.now();
let frameErr=0;function frame(now){requestAnimationFrame(frame);try{frameBody(now);}catch(e){if(frameErr++<3)console.error('frame',e);}}
function frameBody(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
  if(!PG.paused){
    director(dt);
    if(CUTS.on)CUTS.update(dt);else if(phase==='air')FLY.update(dt);else if(!['end','brief','intro','landcut','endcut','rescuecut'].includes(phase)){stepPlayer(dt);placeCamera();}
    updateEnemies(dt);if(!CUTS.on&&phase!=='air')updateAllies(dt);updateDrops(dt);updateNades(dt);updateRockets(dt);updateTurrets(dt);updateWall(dt);updateSentry(dt);updateZeal(dt);updatePicks(dt);
    updateGate(dt);updateDoor(dt);updateVault(dt,T);updateRoof(dt);updateShutter(dt);updateArtifact(dt,T);
    updateBolts(dt);updateBooms(dt);updateTrails(dt);updateSmoke(dt);PG.tick(dt);skyU.uT.value=T;astraeaU.uT.value=T;BAY.U.uT.value=T;
    PG.combat(phaseFight());updateWarp(dt);
    if(CASE.g.visible)CASE.h.material.opacity=.4+.3*Math.sin(T*3);
    if(MAST)MAST.l.material.opacity=(Math.floor(T*1.2)%2)?1:.25;   // the transmitter's light, blinking
  }else if(phase==='brief'){camera.position.set(330,90,1150);camera.lookAt(20,0,120);}
  if(shakeT>0){shakeT-=dt;camera.position.x+=R(-1,1)*shakeT*.15;camera.position.y+=R(-1,1)*shakeT*.12;}
  if(!SETS.inBay){updateLights(dt,T,CUTS.on||phase==='air'?camera.position:P.pos);applyBlackout();}
  skyFollow();followSun(CUTS.on||phase==='air'?camera.position:P.pos);updateDust();updateHud(dt);updateWp();
  renderFrame();
}
PG.briefing({title:'THE LAST SIGNAL',text:'13.03.2237, the night after the Mountain. Part of the Pathfinder’s last transmission is still going out, live, from Elyra’s southern mountains. One interceptor, no noise. Follow it. If it’s them, bring them home. Threat level: '+DIFF.name+'.',
  objective:'Fly the valley after the signal. Find where it is coming from.',
  pc:[['Mouse','Aim · in the interceptor: steer (click to lock, Esc releases)'],['Left click','Fire'],['Shift','Sprint · in the interceptor: boost'],['W A S D','Move'],['Right click','Aim down the sights (the Lance has a scope)'],
    ['1 2 3 4 or wheel','Rifle, Lance, Breaker launcher, sidearm (Armory skin)'],['R','Reload'],['Q','Mobile shield'],['X','Shoulder sentry'],['G or F','Grenade'],['Space','Jump'],['C or Ctrl','Crouch (toggle)'],['Z','Zeal when the meter is full'],['Walk up and hold, or E','Use (the lock, the cells, the generator), board'],['Enter','Skip a cutscene']],
  phone:[['Drag (right side)','Aim · in the interceptor: steer'],['Left thumb','Move · in the interceptor: turn (push to the edge to boost)'],['FIRE','Fire (hold) · swipe up off it to throw a grenade'],['Double-tap right','Aim down the sights (again to stop)'],['Ammo box','Reload (shows the magazine)'],['⇄','Next weapon'],['GEAR','Tap: mobile shield · hold: shoulder sentry'],['JUMP · CROUCH','Jump, crouch (toggle)'],['Gold shield','Tap it for Zeal'],['Walk up · USE','The lock, the cells, the generator, board'],['Skip','Skip a cutscene']],
  onStart:()=>{setPhase('intro');P.input=false;
    const atq=(location.search.match(/[?&]at=(\w+)/)||[])[1];if(atq){jumpTo(atq);return;}
    const begin=()=>introScene(()=>startAir(true));
    const cp=readCP();if(!cp){begin();return;}
    PG.paused=true;const el=document.createElement('div');el.className='pgend pgbrief';
    el.innerHTML=`<div class="card"><h2>CHECKPOINT</h2><p>You stopped at <b>${CP_NAME[cp.at]}</b>. Pick up there, or start The Last Signal from the beginning.</p><div class="row"><button type="button" class="primary" id="cpGo">Resume</button><button type="button" id="cpNew">Start over</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('#cpGo').addEventListener('click',()=>{el.remove();PG.paused=false;jumpTo(cp.at==='cells'?'cells':cp.at);});
    el.querySelector('#cpNew').addEventListener('click',()=>{el.remove();PG.paused=false;clearCP();begin();});}});
requestAnimationFrame(frame);
