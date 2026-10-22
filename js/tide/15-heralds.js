/* Tide City · the Herald convoy (Oct 22 canon: "add more distinct Herald ships in the final battle, including ships that can
   function as combat distractions without implying every Herald is hostile").
   While the Empty Host lands at the Spear, a Herald convoy crosses low over the south shore: one big transport (a Harrower-pattern
   hull, burning amber instead of war-red: a different house, a different insignia) and two Void Lancer escorts. They never fire on
   the city. The Hollow King's cruisers turn their guns on them and some of his fighters peel off to chase them, so while the convoy
   is in the sky the sea guns take fewer salvos and the Hollow fighters are busy. Then the convoy jumps out. Nothing here can be
   shot down, by you or by him: it is a moment, not a target. The Spear is untouched (js/tide/11-story.js).
   Hooks in by wrapping director() and resetStory(); loads after the rest of Tide City. */
const HERALD_PALE=0xffb45a;
const CONVOY=(()=>{
  const S=new THREE.Vector3(15500,2300,7200),E=new THREE.Vector3(-15500,3100,4600),DUR=38,LAUNCH_AT=4;
  const hullMat=fleetHullMat(panelTex),glowMat=fleetGlowMat(HERALD_PALE,2.2);
  const engine=(n,size)=>new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(HERALD_PALE).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
  function ship(kind,len){const K=SHIPKIT[kind](),g=new THREE.Group();
    g.add(new THREE.Mesh(K.geo,hullMat),new THREE.Mesh(K.glowGeo||K.glow,glowMat));
    K.geo.computeBoundingBox();const L=K.geo.boundingBox.max.z-K.geo.boundingBox.min.z;g.scale.setScalar(len/L);
    const e=engine();e.position.set(0,0,K.geo.boundingBox.max.z*.95);e.scale.setScalar(L*.35);g.add(e);
    g.visible=false;scene.add(g);return g;}
  const ships=[{g:ship('harrower',1700),off:new THREE.Vector3(0,0,0),big:true},
    {g:ship('lancer',150),off:new THREE.Vector3(600,260,-900)},{g:ship('lancer',150),off:new THREE.Vector3(-500,-180,-1100)}];
  const st={on:false,t:0,done:false,said:new Set(),fireT:1,chasers:[]};
  const _p=new THREE.Vector3(),_d=new THREE.Vector3(),_q=new THREE.Vector3();
  const pathAt=(u,o)=>{o.lerpVectors(S,E,u);o.y+=Math.sin(u*Math.PI)*-500;return o;};   // a shallow dip over the water, as low as they dare
  const LINES=[[1,'Tide City Command','New contacts low over the south shore! Herald hulls, amber running lights. They are not firing on us!','alert'],
    [7,'Lt. Michael','Master, that big one isn’t a warship. It’s a transport. They’re running again.'],
    [13,'Tide City Command','His cruisers are turning their guns on them! Hollow fighters breaking off after the Heralds!','alert'],
    [19,'Elias Veyr','Leave the Heralds be, Michael. Hit his fighters while their backs are turned.'],
    [DUR+1,'Tide City Command','The Herald ships are jumping out. All three made it.']];
  function reset(){st.on=false;st.t=0;st.done=false;st.said=new Set();st.fireT=1;for(const f of st.chasers)f.heraldChase=false;st.chasers=[];for(const s of ships)s.g.visible=false;}
  function launch(){st.on=true;st.t=0;for(const s of ships){s.g.visible=true;}if(typeof flashBanner==='function')flashBanner('Herald ships crossing the bay · not hostile');}
  function jump(){for(const s of ships){if(!s.g.visible)continue;const p=s.g.position;boom(p,s.big?5200:900,0xffffff,.7);boom(p,s.big?3600:700,HERALD_PALE,1.4);s.g.visible=false;}
    if(typeof sfx!=='undefined'&&sfx.jump)sfx.jump(ships[0].g.position);for(const f of st.chasers)f.heraldChase=false;st.chasers=[];}
  function update(dt){
    const id=PH[ph].id;
    if(id==='calm'||id==='fallen'){if(st.on||st.done)reset();return;}
    if(!st.on&&!st.done&&id==='host'&&phT>=LAUNCH_AT)launch();
    if(!st.on){if(st.done){st.t+=dt;for(const L of LINES)if(L[0]>DUR&&st.t>=L[0]&&!st.said.has(L[0])){st.said.add(L[0]);PG.say(L[1],L[2],L[3]);}}return;}
    st.t+=dt;const u=Math.min(1,st.t/DUR);
    pathAt(u,_p);pathAt(Math.min(1,u+.01),_q);_d.subVectors(_q,_p).normalize();
    for(const s of ships){s.g.position.copy(_p).add(s.off);s.g.position.y+=Math.sin(st.t*.7+s.off.x)*18;s.g.lookAt(_q.copy(s.g.position).sub(_d));}
    for(const L of LINES)if(L[0]<=DUR&&st.t>=L[0]&&!st.said.has(L[0])){st.said.add(L[0]);PG.say(L[1],L[2],L[3]);}
    // the distraction: his cruisers fire on the transport, his heavy guns are split (the sea guns get a breather), his fighters give chase
    const w2=WAVE2.filter(c=>!c.crash&&c.grp.visible);
    if(st.t>9&&w2.length){
      cStrikeT+=dt*.6;
      st.fireT-=dt;if(st.fireT<=0){st.fireT=R(.9,1.8);const c=pick(w2),T=ships[0].g.position;
        const to=T.clone().add(_q.set(R(-500,500),R(-200,300),R(-500,500)));boom(shipLocalPoint(c,true),220,HOLLOW_GLOW,.35);
        fire(shipLocalPoint(c,true),to,2600,'hollow',p=>{boom(p,420,0xffe0b0,.5);boom(p,700,HERALD_PALE,.9);});}
      if(st.chasers.length<4){const f=fighters.find(f=>f.hollow&&f.kind==='fighter'&&f.state==='attack'&&!f.heraldChase&&!f.chase);if(f){f.heraldChase=true;st.chasers.push(f);}}}
    for(const f of st.chasers){if(f.state!=='attack'){f.heraldChase=false;continue;}const T=ships[st.chasers.indexOf(f)%ships.length].g.position;f.tgt.copy(T).add(_q.set(0,120,0));}
    st.chasers=st.chasers.filter(f=>f.heraldChase);
    if(u>=1){st.on=false;st.done=true;jump();}
  }
  return{update,reset,ships,get on(){return st.on;}};
})();
{const _director=director;director=function(dt,t){_director(dt,t);CONVOY.update(dt);};
 const _reset=resetStory;resetStory=function(){_reset();CONVOY.reset();};}
