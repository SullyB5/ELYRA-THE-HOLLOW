/* Tide City · the Herald convoy (Oct 22 canon: "add more distinct Herald ships in the final battle, including ships that can
   function as combat distractions without implying every Herald is hostile").
   Right after the Hollow King's fleet jumps in, a Herald convoy drops out of Slipscape and crosses low over the south of the city: one
   big transport and two escorts, in the Heralds' own hulls and paint (Bryce's Harrower and Wraith models, untinted). No marker, no
   banner: Command calls it on the radio. They never fire on the city. The Hollow King's cruisers turn their guns on them and some of his
   fighters peel off to chase them, so while the convoy is in the sky the sea guns take fewer salvos and the Hollow fighters are busy.
   Then the escorts jump out, and the transport comes round to the south and sets down in the second bay beside the Vigil's cradle
   (BAY2, js/tide/02-city.js), where it stays while the city counts its dead. Nothing here can be shot down, by you or by him.
   The Spear is untouched (js/tide/11-story.js). Hooks in by wrapping director() and resetStory(); loads after the rest of Tide City. */
const CONVOY=(()=>{
  const S=new THREE.Vector3(15000,1900,3600),E=new THREE.Vector3(-8000,2100,3000),DUR=40,LAUNCH_AT=12;   // in right after the Hollow King's fleet, across the south of the city, low
  const APP=34,DESC=16;   // then round to the south and down onto the second bay
  const ENG=0xffe2b8;
  const engine=()=>new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(ENG).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
  function ship(kind,model,len){const K=SHIPKIT[kind](),g=new THREE.Group(),code=[new THREE.Mesh(K.geo,fleetHullMat(panelTex)),new THREE.Mesh(K.glowGeo||K.glow,fleetGlowMat(ENG,1.4))];g.add(...code);
    K.geo.computeBoundingBox();const L=K.geo.boundingBox.max.z-K.geo.boundingBox.min.z;g.scale.setScalar(len/L);
    const e=engine();e.position.set(0,0,K.geo.boundingBox.max.z*.95);e.scale.setScalar(L*.18);g.add(e);
    MODELS.swapShip(g,model,{ref:K.geo,hide:code,shadow:true,ground:true});   // the Heralds' own paint
    g.visible=false;scene.add(g);g.userData.minY=K.geo.boundingBox.min.y*len/L;return g;}
  const ships=[{g:ship('harrower','harrower',1500),off:new THREE.Vector3(0,0,0),big:true},
    {g:ship('wraith','wraith',160),off:new THREE.Vector3(600,260,-900)},{g:ship('wraith','wraith',160),off:new THREE.Vector3(-500,-180,-1100)}];
  const T=ships[0];
  // the second bay: a concrete apron with landing guides, a cradle of pylons, lights round the edge and a small control tower
  (function(){const B=BAY2,top=B.top,add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m;};
    const concrete=new THREE.MeshStandardMaterial({map:panelTex,color:C(0x737a82),roughness:.85,metalness:.05}),steel=new THREE.MeshStandardMaterial({color:C(0x59626c),roughness:.5,metalness:.55}),
      darkS=new THREE.MeshStandardMaterial({color:C(0x2a3037),roughness:.6,metalness:.4}),hazard=new THREE.MeshStandardMaterial({color:C(0xf2b632),emissive:C(0x4a3000),roughness:.5});
    add(boxUV(2*B.hx,8,2*B.hz,140),concrete,B.x,top-4,B.z);
    for(const s of[-1,1])add(new THREE.BoxGeometry(12,2,2*B.hz-200),accentMat,B.x+s*(B.hx-160),top+1,B.z);
    for(let k=-5;k<=5;k++)add(new THREE.BoxGeometry(260,2,14),hazard,B.x,top+1,B.z+k*260);
    for(const s of[-1,1])for(const lz of[-500,0,500]){add(new THREE.BoxGeometry(130,18,130),steel,B.x+s*330,top+9,B.z+lz);add(new THREE.BoxGeometry(140,4,140),accentMat,B.x+s*330,top+20,B.z+lz);}
    add(new THREE.CylinderGeometry(22,30,260,12),steel,B.x+B.hx-120,top+130,B.z-B.hz+160);add(new THREE.CylinderGeometry(70,52,44,16),darkS,B.x+B.hx-120,top+282,B.z-B.hz+160);
    const pts=[];for(let k=0;k<=16;k++){const u=k/16;pts.push(new THREE.Vector3(B.x-B.hx+60,top+12,B.z-B.hz+60+u*(2*B.hz-120)),new THREE.Vector3(B.x+B.hx-60,top+12,B.z-B.hz+60+u*(2*B.hz-120)));}
    scene.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts),new THREE.PointsMaterial({size:60,map:glow,color:C(0xffd890).multiplyScalar(2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));})();
  const LAND=new THREE.Vector3(BAY2.x,BAY2.top+2-T.g.userData.minY,BAY2.z),HOVER=new THREE.Vector3(BAY2.x,BAY2.top+900,BAY2.z),APPC=new THREE.Vector3(-4000,1700,9500);
  const st={on:false,t:0,done:false,said:new Set(),fireT:1,chasers:[],tp:'',tt:0};
  const _p=new THREE.Vector3(),_d=new THREE.Vector3(),_q=new THREE.Vector3(),_a=new THREE.Vector3();
  const pathAt=(u,o)=>{o.lerpVectors(S,E,u);o.y+=Math.sin(u*Math.PI)*-450;return o;};   // a shallow dip, as low as they dare
  const LINES=[[1,'Tide City Command','More contacts out of Slipscape, low over the south of the city! Herald hulls. They are not firing on us!','alert'],
    [7,'Lt. Michael','Master, that big one isn’t a warship. It’s a transport. They’re running again.'],
    [13,'Tide City Command','His cruisers are turning their guns on them! Hollow fighters breaking off after the Heralds!','alert'],
    [19,'Elias Veyr','Leave the Heralds be, Michael. Hit his fighters while their backs are turned.'],
    [DUR+1,'Tide City Command','The Herald escorts have jumped out. The transport is coming round to the south, Master. It’s asking for somewhere to set down.'],
    [DUR+7,'Elias Veyr','Give it the second bay, beside the Vigil. Nobody fires on that ship.']];
  // the battle radio is busy at this point: each convoy line waits for a gap (or 6 s), so it never talks over the King or Command
  let waitT=0;
  function radio(dt){const L=LINES.find(L=>st.t>=L[0]&&!st.said.has(L[0]));if(!L){waitT=0;return;}
    const busy=!!document.querySelector('.pgcomms.on');waitT+=dt||0;if(busy&&waitT<6)return;waitT=0;st.said.add(L[0]);PG.say(L[1],L[2],L[3]);}
  function reset(){st.on=false;st.t=0;st.done=false;st.tp='';st.tt=0;st.said=new Set();st.fireT=1;for(const f of st.chasers)f.heraldChase=false;st.chasers=[];for(const s of ships)s.g.visible=false;}
  function launch(){st.on=true;st.t=0;st.tp='cross';for(const s of ships){s.g.visible=true;}pathAt(0,_p);boom(_p,6000,0xffffff,.7);if(typeof sfx!=='undefined'&&sfx.jump){sfx.jump(_p);if(sfx.flyby)setTimeout(()=>sfx.flyby(6,.3,ships[0].g.position),1800);}}   // and then low over the south of the city
  function escortsJump(){for(const s of ships){if(s.big||!s.g.visible)continue;const p=s.g.position;boom(p,900,0xffffff,.7);s.g.visible=false;}
    if(typeof sfx!=='undefined'&&sfx.jump)sfx.jump(ships[1].g.position);for(const f of st.chasers)f.heraldChase=false;st.chasers=[];}
  const bez=(a,b,c,u,o)=>{const v=1-u;return o.set(0,0,0).addScaledVector(a,v*v).addScaledVector(b,2*v*u).addScaledVector(c,u*u);};
  function update(dt){
    const id=PH[ph].id;
    if(id==='arrive'||id==='fallen'){if(st.on||st.done||st.tp)reset();return;}   // a new battle (or the city lost): start clean
    if(id==='calm'&&!battles){if(st.tp)reset();return;}
    if(!st.tp&&((id==='reinf'&&phT>=LAUNCH_AT)||id==='host'||id==='spear'))launch();
    if(!st.tp)return;
    st.t+=dt;radio(dt);
    if(st.tp==='cross'){const u=Math.min(1,st.t/DUR);
      pathAt(u,_p);pathAt(Math.min(1,u+.01),_q);_d.subVectors(_q,_p).normalize();
      for(const s of ships){s.g.position.copy(_p).add(s.off);s.g.position.y+=Math.sin(st.t*.7+s.off.x)*18;s.g.lookAt(_a.copy(s.g.position).sub(_d));}
      // the distraction: his cruisers fire on the transport, his heavy guns are split (the sea guns get a breather), his fighters give chase
      const w2=WAVE2.filter(c=>!c.crash&&c.grp.visible);
      if(st.t>9&&w2.length){cStrikeT+=dt*.6;
        st.fireT-=dt;if(st.fireT<=0){st.fireT=R(.9,1.8);const c=pick(w2),Tp=T.g.position;
          const to=Tp.clone().add(_q.set(R(-500,500),R(-200,300),R(-500,500)));boom(shipLocalPoint(c,true),220,HOLLOW_GLOW,.35);
          fire(shipLocalPoint(c,true),to,2600,'hollow',p=>{boom(p,420,0xffe0b0,.5);boom(p,700,0xffb45a,.9);});}
        if(st.chasers.length<4){const f=fighters.find(f=>f.hollow&&f.kind==='fighter'&&f.state==='attack'&&!f.heraldChase&&!f.chase);if(f){f.heraldChase=true;st.chasers.push(f);}}}
      for(const f of st.chasers){if(f.state!=='attack'){f.heraldChase=false;continue;}const Tp=ships[st.chasers.indexOf(f)%ships.length].g.position;f.tgt.copy(Tp).add(_q.set(0,120,0));}
      st.chasers=st.chasers.filter(f=>f.heraldChase);
      if(u>=1){escortsJump();st.tp='approach';st.tt=0;T.from=T.g.position.clone();}}
    else if(st.tp==='approach'){st.tt+=dt;const u=ease(Math.min(1,st.tt/APP));bez(T.from,APPC,HOVER,u,_p);bez(T.from,APPC,HOVER,Math.min(1,u+.01),_q);
      T.g.position.copy(_p);if(u<.99){_d.subVectors(_q,_p).normalize();T.g.lookAt(_a.copy(_p).sub(_d));}
      if(st.tt>=APP){st.tp='descend';st.tt=0;T.q0=T.g.quaternion.clone();}}
    else if(st.tp==='descend'){st.tt+=dt;const u=Math.min(1,st.tt/DESC);T.g.position.lerpVectors(HOVER,LAND,ease(u));
      T.g.quaternion.slerpQuaternions(T.q0,PAD_Q,ease(Math.min(1,u*1.6)));
      if(u>.8&&rng()<.3)puff(_p.set(BAY2.x+R(-700,700),BAY2.top+20,BAY2.z+R(-900,900)),R(200,380),5);
      if(u>=1){st.tp='landed';T.g.position.copy(LAND);T.g.quaternion.copy(PAD_Q);emitSprayAt(BAY2.x,BAY2.z,600,120,.5);}}
  }
  return{update,reset,ships,get on(){return st.tp==='cross';}};
})();
{const _director=director;director=function(dt,t){_director(dt,t);CONVOY.update(dt);};
 const _reset=resetStory;resetStory=function(){_reset();CONVOY.reset();};}
