/* Tide City · The First Word · the two endings (Oct 27, Bryce: "Build Real Ending"; docs/ENDINGS.md). Both hang off the Spear's
   FIRE / HOLD order (SPEAR_ORDER, js/tide/11-story.js). Loads after the rest of Tide City and hooks in by wrapping shootBeam(),
   endingCut(), tideResults(), director() and resetStory().

   THE SPEAR FIRES (the normal ending). Any shot counts (Bryce, Oct 26). The discharge doesn't stop at the ship it was aimed at: a shell
   of light goes out from the Spear's tip across the whole sky and kills everyone in it: the Hollow King's fleet, his fighters, any
   Herald still flying, and Lieutenant Michael in his interceptor. Tide City stands. Then Elias, from the Vigil in her cradle, raises
   the device Michael carried down off the mountain (The Last Signal); its dome covers the city, and the Host left on the plinth burn
   inside it. Under the dome the Heralds' broadcast finally comes through clean: they had been asking for exactly this. Later missions
   follow a Pathfinder (saved as the route, below).

   THE SPEAR NEVER FIRES (the secret ending). HOLD starts the device: Elias has it brought out of the Vigil's hold, DEVICE_T seconds to
   wake (radio and pop-ups count it in). Hold the city until then (it can still fall; the Spear still asks again at 40% and 20%, and
   firing then is the normal ending). When it wakes, or if his fleet comes down to the guns first, the dome rises over Tide City
   before any Herald dies. Inside it the fully corrupted burn and its edge is a shock wall against them (Bryce's rule): his escorts
   break up as it passes, the Harbinger turns and jumps (the King is defeated, not confirmed dead), the Host on the plinth are gone.
   The Herald transport and its escorts come back under it with their guns cold, and speak: the first word. Everyone is saved.

   In game text the device stays unnamed ("the device", "what Michael brought down"); docs call it the suppressor (CANON-NOTES #28).
   All dialogue here is placeholder for Bryce's rewrite.
   Saved: localStorage 'elyra.route' {route:'spear'|'hold', michael:'dead'|'alive', at}, and elyra.flags gets spearFired /
   michaelLost / heraldsSpared. */
const ENDINGS=(()=>{
  const DEVICE_T=75,DOME_R=13500;
  const st={route:null,devT:-1,devSaid:new Set(),cut:false,dome:0,disc:-1,discHit:new Set(),kingGone:false};
  const _a=new THREE.Vector3(),_b=new THREE.Vector3();
  const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  /* Nov 8 (Bryce: "a transport from the ship goes to the Spear and the light comes out of the Spear instead of the ship"): the
     device no longer wakes in the Vigil's hold. A Keeper dropship carries it from her cradle to the Spear's plinth (the courier,
     below), and the pillar of light and the dome rise out of the Spear. centre(): where the dome stands. */
  const cradle=()=>_b.set(SPEAR.x,0,SPEAR.z);
  const PLINTH=new THREE.Vector3(SPEAR.x,78,SPEAR.z+86);   // the courier's spot on the plinth, on the shipyard side

  /* ---------- the dome: the same shell of light as the White City's (js/pathfinder3/01-world.js), city-sized. Drawn from the
     loading screen on (scaled to nothing, so its shader is compiled there and not in the middle of the ending) ---------- */
  const DU={uT:{value:0},rise:{value:0},hold:{value:1}};
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1,96,48,0,Math.PI*2,0,Math.PI/2),new THREE.ShaderMaterial({uniforms:DU,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,
    vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=normalize(w.xyz-cameraPosition);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:`varying vec3 vP;varying vec3 vN;varying vec3 vW;uniform float uT,rise,hold;
    float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){float h=vP.y;if(h>rise)discard;
      vec2 q=vec2(atan(vP.z,vP.x)*60.0,h*70.0);vec2 g=vec2(q.x,q.y+mod(floor(q.x),2.0)*.5);vec2 f=abs(fract(g)-.5);float cell=smoothstep(.42,.5,max(f.x,f.y));
      float fres=pow(1.0-abs(dot(normalize(vN),-vW)),2.2);
      float front=smoothstep(rise-.05,rise,h)*step(h,rise)*(1.0-step(.999,rise));
      float lines=smoothstep(.97,1.0,sin(atan(vP.z,vP.x)*48.0))*(.5+.5*sin(h*40.0-uT*3.0));
      float rip=.5+.5*sin(h*50.0-uT*2.4+sin(atan(vP.z,vP.x)*5.0+uT*.7)*2.0);   /* (Nov 9) softer cells, light running up through the shell, gold at its seams */
      vec3 c=vec3(.55,.72,1.0)*(cell*.07+fres*.34+lines*.14+.03+rip*.045*(1.0-cell))+vec3(1.0,.86,.55)*cell*fres*.16+vec3(1.0,.95,.85)*front*1.4+vec3(.7,.85,1.0)*smoothstep(.03,0.0,h)*.8;
      gl_FragColor=vec4(c*hold,1.0);}`}));
  dome.frustumCulled=false;dome.renderOrder=2;dome.scale.setScalar(.001);dome.position.set(0,-50,7600);scene.add(dome);
  // the pillar of light out of the Spear's tip
  // (Nov 9) a shaft of light bright down its middle and gone at its edges, as in the White City (opacity still drives it)
  const pm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,uniforms:{op:{value:0},c:{value:C(0xc8d8ff)},uT:DU.uT},
    vertexShader:'varying vec3 vN;varying vec3 vV;varying float vY;void main(){vY=position.y;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform float op,uT;uniform vec3 c;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float e=pow(abs(dot(normalize(vN),vV)),2.5);float p=.8+.2*sin(vY*30.-uT*4.);gl_FragColor=vec4(c*e*p*op*1.8,1.);}'});
  Object.defineProperty(pm,'opacity',{get(){return pm.uniforms.op.value;},set(v){if(pm.uniforms)pm.uniforms.op.value=v;},configurable:true});
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(40,90,1,24,1,true).translate(0,.5,0),pm);
  pillar.frustumCulled=false;scene.add(pillar);
  function domeAt(k,rise){const c=cradle();dome.position.set(c.x,-20,c.z);dome.scale.setScalar(Math.max(.001,DOME_R*k));DU.rise.value=rise;}
  // the Spear's discharge: a shell of light going out from its tip across the whole sky
  const disc=new THREE.Mesh(new THREE.SphereGeometry(1,48,24),new THREE.MeshBasicMaterial({color:C(0xfff0c8).multiplyScalar(2.2),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}));
  disc.frustumCulled=false;disc.scale.setScalar(.001);disc.position.copy(SPEAR_TOP);scene.add(disc);

  /* ---------- the courier: the Keeper shuttle (Bryce's model, Nov 9) that takes the device from the Vigil to the Spear ----------
     HOLD: it lifts out of the cradle ten seconds after the order and flies the length of the city with the King's fighters on it;
     every fighter on it slows it down (they can't bring it down: the device is the ending), and the device only wakes once it is
     on the plinth. FIRE: the same dropship sets down on the plinth in the ending cut. */
  const CR={g:new THREE.Group(),state:'idle',u:0,dur:40,chasers:[],landT:0,said:new Set(),A:V3(0,0,0),B:V3(0,0,0),P:PLINTH.clone(),near:0};
  {const box=new THREE.Mesh(new THREE.BoxGeometry(16,9,46).translate(0,0,0),new THREE.MeshStandardMaterial({color:C(0xdfe6ee),roughness:.5,metalness:.3}));CR.g.add(box);
   const e=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x8ae8ff).multiplyScalar(2.5),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));e.position.set(0,0,26);e.scale.setScalar(30);CR.g.add(e);
   // (Nov 9: Bryce's Keeper shuttle, the Lantern, carries the device; it was the Keeper dropship)
   if(typeof MODELS!=='undefined')MODELS.swapShip(CR.g,'ship_keeper_shuttle',{len:70,glow:.15,hide:[box],shadow:true});}
  CR.g.visible=false;scene.add(CR.g);
  function courierAt(u,o){return bez2(CR.A,CR.B,CR.P,clamp(u,0,1),o);}
  function courierLift(){const f=flag.grp.position;CR.A.set(f.x,Math.max(f.y,0)+260,f.z-300);CR.B.set((f.x+SPEAR.x)/2+900,1500,(f.z+SPEAR.z)/2);CR.P.copy(PLINTH);
    CR.state='fly';CR.u=0;CR.g.visible=true;courierAt(0,CR.g.position);boom(CR.g.position,420,0x8ae8ff,.6);if(typeof sfx!=='undefined'&&sfx.liftoff)sfx.liftoff(CR.g.position,4);
    // the King's fighters go for it
    const idle=fighters.filter(f=>f.state==='idle').slice(0,Math.max(3,Math.round(4*DIFF.tide.mob)));
    for(const f of idle){setCraft(f,true,false);f.home=null;f.ace=false;f.chase=false;f.courier=true;
      f.pos.copy(CR.g.position).add(_a.set(R(-1,1),0,R(-1,1)).normalize().multiplyScalar(R(2600,3400))).setY(R(700,1200));
      f.v.subVectors(CR.g.position,f.pos).normalize().multiplyScalar(500);f.state='attack';f.t=0;f.cool=R(.5,1.5);f.g.visible=true;f.tgt.copy(CR.g.position);CR.chasers.push(f);}}
  // bow (-z) along the path: lookAt points +z, so it looks back down the path (as the evacuation shuttles do)
  function courierFace(u){courierAt(u+.004,_a);_a.sub(CR.g.position);if(_a.lengthSq()>.5){_a.y*=.4;CR.g.lookAt(_c0.copy(CR.g.position).sub(_a));}}
  const _c0=new THREE.Vector3();
  function updateCourier(dt){if(CR.state==='idle'||CR.state==='down')return;
    if(CR.state==='fly'){
      // fighters on it: each within 800 m slows it; they're kept on it
      let near=0;for(const f of CR.chasers){if(f.state!=='attack'){continue;}f.tgt.copy(CR.g.position).add(_a.set(0,30,0));f.chase=false;if(f.pos.distanceTo(CR.g.position)<800)near++;}
      CR.near=near;
      if(near&&rng()<dt*near*3){const p=CR.g.position.clone().add(_a.set(R(-30,30),R(-10,20),R(-30,30)));boom(p,R(90,160),0xff6a3a,.4);}
      CR.u+=dt/CR.dur/(1+.35*near);courierAt(CR.u,CR.g.position);courierFace(CR.u);
      if(typeof sfx!=='undefined'&&sfx.loopAt)sfx.loopAt('loop.dropship','courier',CR.g.position,1,1.1);
      if(CR.u>=1){CR.state='down';CR.landT=st.devT;CR.g.position.copy(CR.P);CR.g.rotation.set(0,Math.PI,0);boom(CR.P,300,0x8ae8ff,.5);
        for(const f of CR.chasers){f.courier=false;if(f.state==='attack'){f.state='return';f.t=0;}}CR.chasers.length=0;}}}
  function resetCourier(){CR.state='idle';CR.u=0;CR.g.visible=false;CR.said=new Set();for(const f of CR.chasers)f.courier=false;CR.chasers.length=0;}
  // the courier as a target ping and HUD tag while it flies (the objective line says where it is going)

  /* ---------- the plinth, close up (Nov 8, Bryce): the 50% line on screen (CANON-NOTES #38, js/shared/corruption.js). A Keeper squad
     and the Host they're holding off, at ground level by the Spear's base. Every Host soldier is past half (veins over the whole body);
     one Keeper, the corporal, has the Hollow in him but under half (veins on his chest and shoulders only). The dome's edge comes
     through: the Host burn to ash where they stand, the corporal drops to a knee, his veins blaze and burn off, and he gets up clean.
     Both endings play it (the dome rises in both). People are 1 unit = 1 m inside the set, scaled to the city's troopers. ---------- */
  const PL=(()=>{if(typeof makeHuman!=='function'||typeof MODELS==='undefined'||typeof CORRUPT==='undefined')return null;
    const G=new THREE.Group();G.visible=false;scene.add(G);
    // a clear patch east of the Spear, out past the plinth's steps and the Herald clasp's feet (and off the courier's side, PLINTH)
    let px=SPEAR.x+215,pz=SPEAR.z;for(let k=0;k<40;k++){const a=0+(k%2?1:-1)*Math.ceil(k/2)*.08,r=215+(k%5)*5,x=SPEAR.x+Math.cos(a)*r,z=SPEAR.z+Math.sin(a)*r;if(typeof FF==='undefined'||FF.free(x,z)){px=x;pz=z;break;}}
    G.position.set(px,3,pz);G.scale.setScalar(TROOP_S*1.3);   // (a 1.9 m soldier comes out the height of the city's trooper statues)
    G.rotation.y=Math.atan2(px-SPEAR.x,pz-SPEAR.z)+Math.PI;   // local +z faces the Spear: the dome's edge comes out from there, over the Keepers
                                                              // holding near it first, then through the Host coming in from outside (-z)
    const P=[];
    function person(kind,x,z,amount,o){o=o||{};const H=makeHuman(kind.startsWith('hollow')?'trooper':'marine');H.root.position.set(x,0,z);H.root.rotation.y=o.yaw||0;G.add(H.root);
      const p={H,kind,x,z,yaw:o.yaw||0,aim:o.aim==null?1:o.aim,c:null,hit:-1,fate:null,amount,keeper:!kind.startsWith('hollow')};
      MODELS.dress(H,kind,{noLod:true,unarmed:o.unarmed,lift:kind.startsWith('hollow')?{c:0x9a6ad0,k:.25}:undefined}).then(()=>{p.c=CORRUPT.mark(H,amount);p.fate=CORRUPT.edge(H,p.c);});
      P.push(p);return p;}
    // Keepers on the Spear's side, facing out (-z) at the Host coming in from outside (facing +z: yaw pi)
    person('keeper-footsoldier',-2.2,2.6,0);
    const cpl=person('keeper-footsoldier',0,3.4,.36,{aim:.2});cpl.corporal=true;
    person('keeper-footsoldier',2.4,2.2,0);
    person('hollow-footsoldier',-3,-5.5,.86,{yaw:Math.PI});person('hollow-commander',-.4,-6.6,.97,{yaw:Math.PI});
    person('hollow-footsoldier',2.2,-5.2,.9,{yaw:Math.PI});person('hollow-footsoldier',4.4,-6.4,.82,{yaw:Math.PI});
    // light for every face (Bryce's dark-scene rule): the Host's own violet, a cool fill from the Keepers' side, and the dome's edge
    const hostL=new THREE.PointLight(0x9a5aff,1.4,14,1.6);hostL.position.set(0,2.4,-4.2);G.add(hostL);
    const fill=new THREE.PointLight(0x8fb8ff,1.1,12,1.6);fill.position.set(1.6,2.3,1.4);G.add(fill);   // (in front of the Keepers: their faces)
    const edgeL=new THREE.PointLight(0xdfe8ff,0,22,1.4);G.add(edgeL);
    // the dome's edge as it reaches them: a wall of the dome's light, sweeping out from the Spear (+z) past them (-z)
    const WU={uT:{value:0},k:{value:0}};
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(120,70,1,1).translate(0,35,0),new THREE.ShaderMaterial({uniforms:WU,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,
      vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:`varying vec2 vU;uniform float uT,k;void main(){vec2 q=vec2(vU.x*120.,vU.y*70.);vec2 g=vec2(q.x*.22,q.y*.34+mod(floor(q.x*.22),2.)*.5);vec2 f=abs(fract(g)-.5);
        float cell=smoothstep(.465,.5,max(f.x,f.y));float base=smoothstep(.05,0.,vU.y)*.9;float up=.5+.5*sin(vU.y*30.-uT*4.);
        float side=smoothstep(0.,.18,vU.x)*smoothstep(1.,.82,vU.x);float top=smoothstep(1.,.55,vU.y);
        vec3 c=(vec3(.55,.72,1.)*(.012+cell*.32+up*.025)+vec3(1.,.95,.85)*base*.6)*side*top;gl_FragColor=vec4(c*k,1.);}`}));
    wall.visible=false;G.add(wall);
    const W0=12,W1=-6.5;   // the wall's path (local z): over the Keepers, through the Host, and it stops short of the reverse camera
    const wp=new THREE.Vector3();
    function world(x,y,z,o){return G.localToWorld(o.set(x,y,z));}
    function reset(){G.visible=false;wall.visible=false;edgeL.intensity=0;for(const p of P){p.hit=-1;p.H.dead=0;p.H.crouchTo=p.corporal?1:0;p.H.crouch=p.H.crouchTo;p.H.root.visible=true;if(p.H.gun)p.H.gun.visible=true;
      if(p.c){p.c.burn=0;p.c.cleanse=0;p.c.amount=p.amount;}}}
    reset();
    // t: seconds since the first of the three shots. The edge appears at ~5.2 s, is over the Keepers by ~6.5 s and the Host by ~8.5 s
    function run(t,dt){G.visible=true;CORRUPT.tick(dt);WU.uT.value+=dt;
      const k=sstep(5.3,9.6,t),wz=W0+(W1-W0)*k;wall.visible=t>5.2&&t<12;wall.position.z=wz;WU.k.value=Math.min(1,(t-5.2)*1.2)*(1-sstep(9.4,10.6,t));
      edgeL.position.set(0,2.5,wz+1);edgeL.intensity=wall.visible?2*WU.k.value:0;
      for(const p of P){const H=p.H;
        if(p.hit<0&&wall.visible&&wz<p.z+.2){p.hit=t;H.hitT=0;H.hitSide=p.x>0?1:-1;
          if(p.fate==='burn'){world(p.x,1.2,p.z,wp);if(typeof boom==='function')boom(wp.clone(),3.2*G.scale.x,0xc080ff,.5);}
          else if(p.fate==='cleanse')H.crouchTo=1;}
        const e=p.hit<0?0:t-p.hit;
        if(p.c){if(p.fate==='burn'){p.c.burn=Math.min(1,e/1.9);if(H.gun)H.gun.visible=p.c.burn<.55;if(p.c.burn>=1)H.root.visible=false;}
          else if(p.fate==='cleanse'&&p.amount>0){p.c.cleanse=Math.min(1,e/2.4);if(e>3.2)H.crouchTo=0;}}
        // the Host hold their aim until it takes them; the Keepers keep theirs up (the corporal's comes back up once he's clean)
        const aim=p.fate==='burn'?1:p.corporal?(p.hit>=0&&t-p.hit>3.4?Math.min(1,(t-p.hit-3.4)*.8):.15):p.aim;
        poseHuman(H,dt,0,aim,false);}}
    // cameras: the corporal from the front (his veins), the reverse from behind the Host (the light coming over the Keepers toward
    // us, the Host in the foreground taken by it), and the corporal again, clean and back on his feet
    const camCpl=(u,t,o)=>world(1.25-u*.25,1.3,1.0+u*.25,o),lookCpl=(u,t,o)=>world(0,1.0,3.4,o);
    const camRev=(u,t,o)=>world(2.4-u*.7,1.75,-11.2+u*.9,o),lookRev=(u,t,o)=>world(-.3,1.3,2.6,o);
    const camUp=(u,t,o)=>world(1.1-u*.15,1.45,1.3+u*.2,o),lookUp=(u,t,o)=>world(0,1.35,3.4,o);
    function off(){G.visible=false;}
    return{G,P,run,reset,off,camCpl,lookCpl,camRev,lookRev,camUp,lookUp};})();
  const plOff=()=>{if(PL)PL.off();};
  // the two shots both endings use: the edge comes through the plinth, then the corporal, clean
  function plinthShots(){if(!PL)return[];PL.reset();let b=0;
    return[{dur:5,camAt:PL.camCpl,lookAt:PL.lookCpl,fov:[38,35],
        say:[[.3,'Keeper Sergeant','Hold the line! Corporal, stay with me. It’s only to your shoulders. You’re still you.','alert']],
        fn:(t,dt)=>{PL.run(Math.min(t,5),dt);}},
      {dur:7.5,camAt:PL.camRev,lookAt:PL.lookRev,fov:[46,42],
        say:[[.2,'Tide City Command','The light’s at the plinth! Brace!','alert']],
        fn:(t,dt)=>{b=t;PL.run(5+t,dt);}},
      {dur:6,camAt:PL.camUp,lookAt:PL.lookUp,fov:[36,34],
        say:[[.6,'Keeper Sergeant','The Host burned where they stood. Corporal... it’s gone off you. You’re clean.']],
        fn:(t,dt)=>{PL.run(5+b+t,dt);}}];}

  function save(route){st.route=route;
    try{localStorage.setItem('elyra.route',JSON.stringify({route,michael:route==='spear'?'dead':'alive',at:Date.now()}));
      const F=JSON.parse(localStorage.getItem('elyra.flags')||'{}');Object.assign(F,route==='spear'?{spearFired:true,michaelLost:true,heraldsSpared:false}:{spearFired:false,michaelLost:false,heraldsSpared:true});
      localStorage.setItem('elyra.flags',JSON.stringify(F));}catch(_){}}
  // after an ending the Spear never asks again
  // (Nov 8, Bryce: replaying, the Spear never offered the order again) the silence lasts until the story resets: Fight again after
  // an ending (Keep flying, then back to calm) puts the Spear's own ask back
  const ASK0=SPEAR_ORDER.ask;
  function silenceSpear(){SPEAR_ORDER.ask=()=>false;}

  /* ---------- the discharge kills whatever its shell has reached (every frame while it grows) ---------- */
  function updateDischarge(dt){if(st.disc<0)return;st.disc+=dt;
    const r=Math.min(32000,600+st.disc*st.disc*2400+st.disc*3000);disc.scale.setScalar(r);disc.material.opacity=Math.max(0,.55*(1-st.disc/5));disc.visible=st.disc<5.2;
    const reach=p=>p.distanceTo(SPEAR_TOP)<r;
    for(const c of capitals)if(c.grp.visible&&!c.crash&&reach(c.grp.position))startCrash(c);
    for(const f of fighters)if(f.state!=='idle'&&f.state!=='dead'&&reach(f.pos))killFighter(f,false);
    for(const D of drops)if(!D.dead&&reach(D.pos))killDrop(D,null,false);
    for(const s of CONVOY.ships)if(s.g.visible&&s.g.position.y>BAY2.top+400&&reach(s.g.position)&&!st.discHit.has(s)){st.discHit.add(s);boom(s.g.position,s.big?4200:900,0xfff0c8,1.4);boom(s.g.position,s.big?3000:600,0xff8a3a,2.2);s.g.visible=false;}
    if(pShip.visible&&reach(pShip.position)&&!st.discHit.has(pShip)){st.discHit.add(pShip);const p=pShip.position.clone();boom(p,520,0xfff6e0,.6);boom(p,700,0xff9a4a,1.4);smoke(p,600,5);pShip.visible=false;
      st.wreck={p:p.clone(),v:V3(R(-40,40),-20,R(-40,40)),t:0};if(typeof sfx!=='undefined'&&sfx.crash)sfx.crash(p);}}
  // Michael's interceptor going down into the bay, burning
  function updateWreck(dt){const w=st.wreck;if(!w||w.done)return;w.t+=dt;w.v.y-=60*dt;w.p.addScaledVector(w.v,dt);w.fx=(w.fx||0)-dt;if(w.fx<=0){w.fx=.08;boom(w.p,R(60,110),0xff8a3a,.5);smoke(w.p,R(80,140),3);}
    if(w.p.y<=0){w.done=true;w.p.y=0;emitSprayAt(w.p.x,w.p.z,90,60,1.2);boom(w.p.clone().setY(8),300,0xffffff,1);}}

  /* ---------- the Vigil's bridge (Nov 10, Bryce: Elias in the ending where the device rises, on the starship bridge with the
     hologram table in the middle; FURN.bridgeSet, js/shared/furnish.js). Built when the ending starts, far out of the city, at the
     plinth set's scale (1 unit = 1 m inside it, scaled to the city), hidden again when the cut moves on. Elias at the table's head. ---------- */
  const VB=(()=>{let B=null;return()=>{if(B!==null)return B;B=false;if(typeof FURN==='undefined'||typeof makeHuman!=='function')return B;
    const set=FURN.bridgeSet();const G=set.G;G.position.set(0,-4000,60000);G.scale.setScalar(TROOP_S*1.3);
    const el=makeHuman('master');G.add(el.root);MODELS.dress(el,'elias-veyr',{unarmed:true,noLod:true});   // (the Vigil officer who calls it in is a voice off)
    const [x0,z0,r0]=set.STAND[0];el.root.position.set(x0,0,z0);el.root.rotation.y=r0;
    const k=TROOP_S*1.3,W=(x,y,z,o)=>o.set(x,y,z).multiplyScalar(k).add(G.position);
    return B={G,el,W,pose(dt){poseHuman(el,dt,0,0);}};};})();
  setTimeout(()=>{try{VB();}catch(e){console.warn('VB',e);}},20000);   // (built well before the ending, so the files are in when it plays)

  /* ---------- the normal ending: the Spear fires ---------- */
  function fireCut(target){if(st.cut)return;st.cut=true;save('spear');silenceSpear();st.devT=-1;tResults=true;
    const ST=SPEAR_TOP;
    // Michael in his interceptor, whatever he was doing when the order went out (canon: he is in the sky)
    if(mode!=='pilot'){pShip.visible=true;}
    const me=pShip.position.clone();const side=V3(me.x-ST.x,0,me.z-ST.z).normalize();
    CUTS.play([
      // the beam, and the light that doesn't stop
      {dur:6,camAt:(u,t,o)=>o.copy(me).addScaledVector(side,140-u*30).add(_a.set(0,46+u*10,0)),lookAt:(u,t,o)=>o.copy(ST).lerp(me,.15),fov:[62,70],
        say:[[.3,'Lt. Michael','Master, the light... it isn’t stopping at the ship. It’s coming out across the whole...','alert'],[0,'Elias Veyr','Michael! Pull out! Pull out!','alert']],
        fn:(t,dt)=>{if(t>.6&&st.disc<0){st.disc=0;flashScreen(.5);if(typeof sfx!=='undefined'&&sfx.moment)sfx.moment('spear');}updateDischarge(dt);updateWreck(dt);}},
      // the sky over the bay: everything in it is coming down
      {dur:8,cam:[[YARD.x-3400,1500,YARD.z+4200],[YARD.x-3000,1700,YARD.z+3800]],look:[[0,2400,-2000],[0,1800,-1500]],
        say:[[.6,'Tide City Command','Vigil... we’ve lost everything in the sky. Every ship. His, and ours.','alert'],[0,'Elias Veyr','Michael. Michael, answer me.']],
        fn:(t,dt)=>{updateDischarge(dt);updateWreck(dt);}},
      // the bay, where his interceptor went in
      {dur:6,camAt:(u,t,o)=>{const w=st.wreck?st.wreck.p:me;return o.set(w.x+260-u*40,60+u*10,w.z+320);},lookAt:(u,t,o)=>{const w=st.wreck?st.wreck.p:me;return o.set(w.x,Math.max(0,w.y*.5),w.z);},
        say:[[1,'Tide City Command','No transponder. Lieutenant Michael’s interceptor is down in the bay. No signal.']],fn:(t,dt)=>{updateDischarge(dt);updateWreck(dt);}},
      // a dropship from the Vigil sets the device down on the Spear's plinth, and the light comes out of the Spear (Nov 8)
      {dur:8,cam:[[SPEAR.x+900,260,SPEAR.z+1300],[SPEAR.x+700,340,SPEAR.z+1000]],lookAt:(u,t,o)=>o.copy(CR.g.position).lerp(SPEAR_TOP,Math.max(0,(t-5)/3)*.6),
        say:[[.4,'Tide City Command','Master, the Host are still on the plinth!','alert'],[0,'Elias Veyr','Bring up the device. The one he carried down off that mountain. Now.']],
        fn:(t,dt)=>{updateWreck(dt);if(t<dt*1.5){CR.A.set(SPEAR.x+1400,900,SPEAR.z+2600);CR.B.set(SPEAR.x+500,500,SPEAR.z+900);CR.P.copy(PLINTH);CR.state='cut';CR.g.visible=true;}
          const u=Math.min(1,t/5);courierAt(u,CR.g.position);if(u<1)courierFace(u);else CR.g.rotation.set(0,Math.PI,0);
          if(t>5)riseFX(t-5,dt,0);}},
      // the dome rises over the city; the Host on the plinth burn inside it
      {dur:9,cam:[[3200,2600,-5200],[2600,3200,-4400]],look:[[0,600,3000],[0,900,3600]],
        say:[[.8,'Tide City Command','It’s spreading over the whole city! The Host on the plinth... they’re burning up inside it!','alert'],[0,'Keeper Sergeant','Our people are fine. It’s only them.']],
        fn:(t,dt)=>{riseFX(t,dt,1);burnHost(t);}},
      // down on the plinth: the 50% line (Nov 8)
      ...plinthShots().map(S=>Object.assign(S,{fn:((f)=>(t,dt)=>{f(t,dt);riseFX(99,dt,1);burnHost(t+4);})(S.fn)})),
      // under the dome, the Heralds' broadcast comes through clean
      {dur:11,cam:[[SPEAR.x+700,420,SPEAR.z+900],[SPEAR.x+560,520,SPEAR.z+700]],look:[[ST.x,ST.y*.6,ST.z]],
        say:[[.5,'Tide City Command','Master... the Heralds’ broadcast. The one they’ve repeated since Astraea. Under the dome it’s clean.'],
             [0,'Herald broadcast','…raise what the Pathfinders carried. Raise it over your city. Do not fire the weapon beneath you…','enemy'],
             [0,'Elias Veyr','They were telling us. The whole time. And we fired.']],fn:(t,dt)=>{plOff();riseFX(99,dt,1);}},
      {dur:5,black:true,cap:'Lieutenant Michael · lost over Tide City',cam:[[0,2600,10500]],look:[[0,900,-2500]]},
    ],{hush:true,score:'sorrow',duck:.18,done:()=>tideResults(true)});}

  /* ---------- the secret ending: the Spear never fires ---------- */
  function holdCut(why){if(st.cut)return;st.cut=true;save('hold');silenceSpear();st.devT=-1;tResults=true;
    const ST=SPEAR_TOP,H=WAVE2.find(c=>c.model==='harbinger');pShip.visible=true;
    const bay=V3(BAY2.x,0,BAY2.z),T=CONVOY.ships[0];
    CUTS.play([
      // (Nov 10) the Vigil's bridge: the word comes to Elias at the hologram table
      ...(VB()?[{dur:6,camAt:(u,t,o)=>VB().W(1.7-u*.4,1.75,3.2-u*.25,o),lookAt:(u,t,o)=>VB().W(-.1,1.35,.6,o),fov:[52,48],
        say:[[.4,'Vigil crew','Master, it’s awake! The light is coming out of the Spear!','alert'],[0,'Elias Veyr','Then let it rise.']],
        fn:(t,dt)=>{const B=VB();B.G.visible=true;B.pose(dt);B.el.head.rotation.y=t>2.6?-.25:0;}}]:[]),
      // on the Spear's plinth, where the dropship set it down: the column of light out of the Spear, and the dome rising (Nov 8)
      {dur:7,cam:[[SPEAR.x+1500,500,SPEAR.z+2100],[SPEAR.x+1200,900,SPEAR.z+1700]],look:[[SPEAR.x,200,SPEAR.z],[SPEAR_TOP.x,SPEAR_TOP.y,SPEAR_TOP.z]],
        say:VB()?[]:[[.4,'Vigil crew','Master, it’s awake! The light is coming out of the Spear!','alert'],[0,'Elias Veyr','Then let it rise.']],
        fn:(t,dt)=>{if(VB())VB().G.visible=false;if(t<dt*1.5&&CR.state!=='down'){CR.state='down';CR.g.visible=true;CR.g.position.copy(PLINTH);CR.g.rotation.set(0,Math.PI,0);}riseFX(t,dt,0);}},
      // its edge sweeps out over the bay to his fleet: the fully corrupted break up where it touches them
      {dur:9,cam:[[-6200,5200,9800],[-5400,5600,8600]],look:[[0,1800,-1500],[0,2200,-2500]],
        say:[[.6,'Tide City Command','It’s over the whole city... it’s reaching his ships! They’re breaking up where it touches them!','alert'],
             [0,'The Hollow King','No. Not that. Not again.','enemy']],
        fn:(t,dt)=>{riseFX(t+7,dt,1);shockWall();if(t>6&&H&&!st.kingGone)kingJumps(H);}},
      // the plinth: the Host are gone, the Keepers standing
      // (Nov 8: the wide shot of the plinth became the close-up trio, the 50% line on screen; the wide one stays for a build without makeHuman)
      ...(PL?plinthShots().map(S=>Object.assign(S,{fn:((f)=>(t,dt)=>{f(t,dt);riseFX(99,dt,1);burnHost(t+4);shockWall();})(S.fn)})):
      [{dur:6,cam:[[SPEAR.x+1300,900,SPEAR.z+1500],[SPEAR.x+1050,1000,SPEAR.z+1200]],look:[[ST.x,80,ST.z],[ST.x,300,ST.z]],
        say:[[.4,'Keeper Sergeant','The Host at the plinth... burned out where they stood. Every one of ours is still standing. We’re fine!']],fn:(t,dt)=>{riseFX(99,dt,1);burnHost(t+4);shockWall();}}]),
      // the Heralds come back in under it, weapons cold, and speak
      {dur:11,camAt:(u,t,o)=>o.copy(bay).add(_a.set(-1900+u*300,700+u*120,2600-u*400)),lookAt:(u,t,o)=>o.copy(bay).add(_a.set(0,500,0)),
        say:[[.6,'Tide City Command','Herald ships coming back in... they’re inside the dome. Their weapons are cold.'],
             [0,'Herald transport','Keepers of Tide City. At last you can hear us.','enemy'],
             [0,'Lt. Michael','Master... they’re talking to us.'],[0,'Elias Veyr','Then we answer.']],
        fn:(t,dt)=>{plOff();riseFX(99,dt,1);heraldsReturn(t,dt);capitalsReturn(dt);}},
      // Michael, alive, in the sky under the dome with them
      {dur:7,camAt:(u,t,o)=>o.copy(pShip.position).add(_a.set(90-u*20,30,140-u*20)),lookAt:(u,t,o)=>o.copy(pShip.position).add(_a.set(0,0,-200)),
        say:[[.4,'Lt. Michael','Everyone up here is still flying, Master. All of us.'],[0,'Elias Veyr','And all of them.']],fn:(t,dt)=>{riseFX(99,dt,1);heraldsReturn(t+11,dt);capitalsReturn(dt);pShip.position.addScaledVector(_a.set(0,0,-1).applyQuaternion(pShip.quaternion),dt*120);}},
      {dur:1.5,black:true,cam:[[0,2600,10500]],look:[[0,900,-2500]]},
    ],{hush:true,score:'calm',duck:.18,done:()=>tideResults(true)});}

  // the dome's rise (t: seconds into it; full in ~7 s) and the pillar up out of the Spear's tip
  function riseFX(t,dt,stage){DU.uT.value+=dt;pillar.position.copy(SPEAR_TOP);pillar.scale.set(1,stage?6000:Math.min(6000,t*1400),1);
    pillar.material.opacity=stage?.25+.1*Math.sin(DU.uT.value*3):Math.min(.8,t*.4);
    const k=stage?sstep(0,7,t):Math.max(0,(t-3)/4)*.08;st.dome=Math.max(st.dome,k);domeAt(.05+.95*st.dome,stage?Math.min(1,.15+st.dome):Math.min(.15,t*.04));
    if(stage&&t<7&&t>.2&&!st.domeSnd){st.domeSnd=1;flashScreen(.25);if(typeof sfx!=='undefined'&&sfx.wake)sfx.wake();}}
  // the dome's edge against the fully corrupted: his escorts inside it break up; his fighters and the Host's dropships burn
  function shockWall(){const R=DOME_R*Math.max(.05,st.dome),c=cradle();const inside=p=>Math.hypot(p.x-c.x,p.z-c.z)<R;
    for(const s of WAVE2)if(s.model!=='harbinger'&&s.grp.visible&&!s.crash&&inside(s.grp.position))startCrash(s);
    for(const f of fighters)if(f.state!=='idle'&&f.state!=='dead'&&f.home&&f.home.wave===2&&inside(f.pos))killFighter(f,false);   // (his: any Herald fighter still up is spared)
    for(const D of drops)if(!D.dead&&inside(D.pos))killDrop(D,null,false);}
  function burnHost(t){if(t<1.5)return;for(const tr of troops)if(tr.state!=='dead'&&rng()<.08)killTrooper(tr,null);}
  // the Harbinger turns and jumps out: defeated, not confirmed dead
  function kingJumps(H){st.kingGone=true;const p=H.grp.position.clone();boom(p,6000,0xffffff,.7);boom(p,4000,0xc080ff,1.4);if(typeof sfx!=='undefined'&&sfx.jump)sfx.jump(p);H.grp.visible=false;H.crash={t:99,v:V3(),spin:0,impact:true,settled:true,fx:99,jumped:true};}
  // the Herald transport (landed beside the Vigil, or still flying) and its escorts, back in under the dome, guns cold
  function heraldsReturn(t,dt){const T=CONVOY.ships[0];if(!T.g.visible){T.g.visible=true;T.g.position.set(BAY2.x,1200,BAY2.z+2400);T.g.rotation.set(0,Math.PI,0);}
    CONVOY.ships.forEach((s,i)=>{if(i===0)return;if(!s.g.visible){s.g.visible=true;s.g.position.set(BAY2.x+(i===1?900:-900),900,BAY2.z+3200);s.g.rotation.set(0,Math.PI,0);}
      s.g.position.lerp(_a.set(BAY2.x+(i===1?700:-700),620,BAY2.z+400),1-Math.exp(-dt*.25));});}
  /* Nov 8 (Bryce: "make the Herald capital ships return to the dome when the fight is over"): the Harrowers that broke and jumped
     out after the first fight (not the ones shot down) drop back out of Slipscape at the dome's edge and come in under it, guns cold,
     to hold station around the Spear. They stay there after the ending (Keep flying). */
  const RET=[];
  function capitalsReturn(dt){
    if(!st.capsBack){st.capsBack=true;let k=0;
      for(const c of WAVE1){if(c.crash)continue;c.flee={t:-1e12,gone:true};   // (the director's flee update stays out of it)
        const a=-Math.PI*.5+(k-.5)*.9+(k>1?Math.PI:0),Rr=3600+k*500;k++;
        const to=V3(SPEAR.x+Math.cos(a)*Rr,1500+k*180,SPEAR.z+Math.sin(a)*Rr),from=to.clone().sub(SPEAR_TOP).setY(0).normalize().multiplyScalar(6000).add(to).setY(to.y+900);
        c.grp.visible=true;c.grp.position.copy(from);c.grp.rotation.set(0,Math.atan2(from.x-to.x,from.z-to.z),0);c.engMat.opacity=1;
        boom(from,6000,0xffffff,.7);boom(from,4000,ALIEN_GLOW,1.4);if(typeof sfx!=='undefined'&&sfx.jump)sfx.jump(from);RET.push({c,to});}}
    for(const R0 of RET){const g=R0.c.grp;g.position.lerp(R0.to,1-Math.exp(-dt*.22));g.rotation.x=0;g.rotation.z=0;
      g.rotation.y=angLerp(g.rotation.y,Math.atan2(g.position.x-SPEAR.x,g.position.z-SPEAR.z),1-Math.exp(-dt*.5));R0.c.engMat.opacity=.6;}}

  /* ---------- the device's countdown after HOLD ---------- */
  const DEV_LINES=[[1,'Elias Veyr','And bring up the device Michael carried down off that mountain. Get it out of the Vigil’s hold. If Rhen was right, it does what the Spear can’t.','',7],
    ['lift','Elias Veyr','It goes to the Spear. Dropship, lift. Michael, get on it and keep them off it, all the way to the plinth.','alert',6],
    ['land','Vigil crew','Device is out of the hold, Master. It’s… waking. Like it knows where it is.'],
    [38,'Tide City Command','Device at half! Keep them off the Vigil!','alert'],
    [58,'Elias Veyr','Michael, stay over the city. When it rises, be under it.','',5],
    [70,'Vigil crew','Seconds now!','alert']];
  /* the countdown: the dropship lifts at 10 s and has to reach the plinth; the device wakes DEVICE_T after HOLD, and never sooner than
     12 s after it has set down (so a slow run, with fighters all over it, holds the ending back: it is a fight, not a wait) */
  const LIFT_T=10;
  function updateDevice(dt){if(st.cut||st.devT<0)return;st.devT+=dt;
    if(st.devT>=LIFT_T&&CR.state==='idle'){courierLift();}
    updateCourier(dt);
    for(const [at,who,txt,tone,dur] of DEV_LINES){const go=at==='lift'?CR.state!=='idle':at==='land'?CR.state==='down':st.devT>=at;if(go&&!st.devSaid.has(at)){st.devSaid.add(at);PG.say(who,txt,tone,dur);}}
    if(CR.state==='fly'){if(CR.near>=2&&!CR.said.has('hot')&&CR.u>.15){CR.said.add('hot');PG.say('Tide City Command','Fighters all over the dropship! It’s slowing down!','alert');}
      if(CR.u>.5&&!CR.said.has('half')){CR.said.add('half');flashBanner('The device · halfway to the Spear');}}
    const ready=CR.state==='down'&&st.devT-CR.landT>=12;
    for(const k of[25,50,75])if(st.devT>=DEVICE_T*k/100&&!st.devSaid.has('p'+k)&&(k<75||CR.state==='down')){st.devSaid.add('p'+k);flashBanner('The device · '+k+'%');}
    if(st.devT>=DEVICE_T&&ready&&!CUTS.on&&PH[ph].id!=='fallen'&&cityHP>0)holdCut('device');}

  /* ---------- hooks ---------- */
  // the first shot from the Spear is the normal ending
  {const _sb=shootBeam;shootBeam=function(c){_sb(c);if(!st.cut&&!st.route)setTimeout(()=>fireCut(c),350);};}
  // his fleet down to the guns without a shot: the dome rises anyway (the secret ending)
  endingCut=function(){holdCut('guns');};
  {const _d=director;director=function(dt,t){_d(dt,t);
    if(!st.cut&&st.devT<0&&SPEAR_ORDER.order==='hold'&&PH[ph].id!=='fallen'){st.devT=0;}
    updateDevice(dt);if(st.disc>=0&&!CUTS.on){updateDischarge(dt);updateWreck(dt);}};}
  {const _r=resetStory;resetStory=function(){SPEAR_ORDER.ask=ASK0;_r();st.route=null;st.devT=-1;st.devSaid=new Set();st.cut=false;st.dome=0;st.disc=-1;st.discHit=new Set();st.kingGone=false;st.wreck=null;st.domeSnd=0;st.capsBack=false;RET.length=0;resetCourier();
    domeAt(.001/DOME_R,0);pillar.material.opacity=0;if(PL)PL.reset();disc.scale.setScalar(.001);disc.material.opacity=0;};}
  {const _tr=tideResults;tideResults=function(win){if(!st.route||!win)return _tr(win);tResults=true;
    const D=`Threat level: ${DIFF.name}. Frigates ${score.frigates} · fighters ${score.fighters} · capital ships ${score.capitals} · dropships ${hostStats.drops} · troopers ${hostStats.troops}.`;
    if(st.route==='spear')PG.finish({title:'THE FIRST WORD',
      text:`The Spear fired, and its light went out across the whole sky. The Hollow King’s fleet came down, and every soul up there with it: Lieutenant Michael among them. Tide City stands. Under the dome Elias raised afterwards, the Heralds’ broadcast came through at last: they had been asking for that, not the Spear. The Keepers go on without him. What comes next follows the Pathfinders. ${D}`,
      buttons:[{text:'Play again',onClick:()=>location.reload(),primary:true},{text:'Menu',href:'index.html'}]});
    else PG.finish({title:'THE FIRST WORD',
      text:`The Spear never fired. The device Michael carried down off the mountain rose over Tide City, and inside it the Hollow burned out of everything it had fully taken. His escorts broke up at its edge; the Harbinger turned and ran. The Heralds came back under it with their guns cold, and spoke. Everyone in the sky came home. ${D}`,
      buttons:[{text:'Keep flying',close:true,primary:true},{text:'Play again',onClick:()=>location.reload()},{text:'Menu',href:'index.html'}]});};}
  // (testing: ENDINGS.plinth() plays just the close-up trio, with the dome already over the city)
  function plinth(){CUTS.play(plinthShots().map(S=>Object.assign(S,{fn:((f)=>(t,dt)=>{f(t,dt);riseFX(99,dt,1);})(S.fn)})),{hush:true,done:()=>plOff()});}
  return{st,fireCut,holdCut,CR,plinth,PL,get route(){return st.route;}};
})();
