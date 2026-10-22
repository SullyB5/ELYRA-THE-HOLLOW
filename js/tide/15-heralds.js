/* Tide City · the Herald convoy (Oct 22 canon: "add more distinct Herald ships in the final battle, including ships that can
   function as combat distractions without implying every Herald is hostile").
   Right after the Hollow King's fleet jumps in, a Herald convoy drops out of Slipscape and crosses low over the south of the city: one big transport (a Harrower-pattern
   hull, burning amber instead of war-red: a different house, a different insignia) and two Void Lancer escorts. They never fire on
   the city. The Hollow King's cruisers turn their guns on them and some of his fighters peel off to chase them, so while the convoy
   is in the sky the sea guns take fewer salvos and the Hollow fighters are busy. Then the convoy jumps out. Nothing here can be
   shot down, by you or by him: it is a moment, not a target. The Spear is untouched (js/tide/11-story.js).
   Hooks in by wrapping director() and resetStory(); loads after the rest of Tide City. */
const HERALD_PALE=0xffb45a;
const CONVOY=(()=>{
  const S=new THREE.Vector3(15000,1900,3600),E=new THREE.Vector3(-15000,2400,1600),DUR=46,LAUNCH_AT=12;   // in right after the Hollow King's fleet, across the south of the city, low
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
  const pathAt=(u,o)=>{o.lerpVectors(S,E,u);o.y+=Math.sin(u*Math.PI)*-450;return o;};   // a shallow dip, as low as they dare
  const LINES=[[1,'Tide City Command','More contacts out of Slipscape, low over the south of the city! Herald hulls, amber running lights. They are not firing on us!','alert'],
    [7,'Lt. Michael','Master, that big one isn’t a warship. It’s a transport. They’re running again.'],
    [13,'Tide City Command','His cruisers are turning their guns on them! Hollow fighters breaking off after the Heralds!','alert'],
    [19,'Elias Veyr','Leave the Heralds be, Michael. Hit his fighters while their backs are turned.'],
    [DUR+1,'Tide City Command','The Herald ships are jumping out. All three made it.']];
  // the battle radio is busy at this point: each convoy line waits for a gap (or 6 s), so it never talks over the King or Command
  let waitT=0;
  function radio(dt){const L=LINES.find(L=>st.t>=L[0]&&!st.said.has(L[0]));if(!L){waitT=0;return;}
    const busy=!!document.querySelector('.pgcomms.on');waitT+=dt||0;if(busy&&waitT<6)return;waitT=0;st.said.add(L[0]);PG.say(L[1],L[2],L[3]);}
  function reset(){st.on=false;st.t=0;st.done=false;st.said=new Set();st.fireT=1;for(const f of st.chasers)f.heraldChase=false;st.chasers=[];for(const s of ships)s.g.visible=false;}
  function launch(){st.on=true;st.t=0;for(const s of ships){s.g.visible=true;}pathAt(0,_p);boom(_p,6000,0xffffff,.7);boom(_p,4000,HERALD_PALE,1.4);if(typeof sfx!=='undefined'&&sfx.jump)sfx.jump(_p);if(typeof flashBanner==='function')flashBanner('Herald ships crossing the bay · not hostile');}
  function jump(){for(const s of ships){if(!s.g.visible)continue;const p=s.g.position;boom(p,s.big?5200:900,0xffffff,.7);boom(p,s.big?3600:700,HERALD_PALE,1.4);s.g.visible=false;}
    if(typeof sfx!=='undefined'&&sfx.jump)sfx.jump(ships[0].g.position);for(const f of st.chasers)f.heraldChase=false;st.chasers=[];}
  function update(dt){
    const id=PH[ph].id;
    if(id==='calm'||id==='fallen'){if(st.on||st.done)reset();return;}
    if(!st.on&&!st.done&&((id==='reinf'&&phT>=LAUNCH_AT)||id==='host'||id==='spear'))launch();
    if(!st.on){if(st.done){st.t+=dt;radio(dt);}return;}
    st.t+=dt;const u=Math.min(1,st.t/DUR);
    pathAt(u,_p);pathAt(Math.min(1,u+.01),_q);_d.subVectors(_q,_p).normalize();
    for(const s of ships){s.g.position.copy(_p).add(s.off);s.g.position.y+=Math.sin(st.t*.7+s.off.x)*18;s.g.lookAt(_q.copy(s.g.position).sub(_d));}
    radio(dt);
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
  const cue=document.createElement('div');cue.className='hud hcue';cue.innerHTML='<i></i><span>HERALD CONVOY · NOT HOSTILE</span>';document.body.appendChild(cue);
  {const c=document.createElement('style');c.textContent=`.hcue{position:fixed;z-index:3;left:0;top:0;display:none;align-items:center;gap:6px;pointer-events:none;transform:translate(-50%,-50%);padding:4px 8px;border-radius:3px;
    background:rgba(60,34,6,.78);border:1.5px solid #ffcf8a;color:#fff3e0;font:700 11px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.12em;white-space:nowrap;text-shadow:0 1px 3px #000}
    .hcue i{display:none;width:0;height:0;border-top:8px solid transparent;border-bottom:8px solid transparent;border-left:13px solid #ffcf8a}.hcue.edge i{display:block}.hcue.edge span{font-size:10px}`;document.head.appendChild(c);}
  const _c=new THREE.Vector3();
  function drawCue(){if(!st.on||CUTS.on){cue.style.display='none';return;}_c.copy(ships[0].g.position).setY(ships[0].g.position.y+400).project(camera);
    let x=_c.x,y=_c.y;const behind=_c.z>1;if(behind){x=-x;y=-y;}const on=!behind&&Math.abs(x)<.9&&Math.abs(y)<.85;cue.style.display='flex';cue.classList.toggle('edge',!on);
    if(on){cue.style.left=(x*.5+.5)*innerWidth+'px';cue.style.top=(-y*.5+.5)*innerHeight+'px';cue.querySelector('i').style.transform='';return;}
    const a=Math.atan2(y,x),m=Math.max(Math.abs(Math.cos(a))/.8,Math.abs(Math.sin(a))/.66);cue.style.left=(Math.cos(a)/m*.5+.5)*innerWidth+'px';cue.style.top=(-Math.sin(a)/m*.5+.5)*innerHeight+'px';cue.querySelector('i').style.transform=`rotate(${-a}rad)`;}
  return{update(dt){update(dt);drawCue();},reset,ships,get on(){return st.on;}};
})();
{const _director=director;director=function(dt,t){_director(dt,t);CONVOY.update(dt);};
 const _reset=resetStory;resetStory=function(){_reset();CONVOY.reset();};}
