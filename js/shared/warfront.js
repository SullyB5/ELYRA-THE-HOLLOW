/* Elyra shared · the war on the horizon (Nov 9 2026, Bryce: "copy the feel of how there are wars going on around the planet in the
   back like missions in Halo"). Halo 3's The Covenant and Reach's Tip of the Spear: while you fight your corner, the battle carries on
   past the edge of the map. Nothing here can be reached or shot; it is all far off, and the level's own hills and walls hide it.

     dogfights     fighters of both sides wheeling over the far ground in pairs, trading tracer fire; now and then one comes apart in a
                   flash and falls trailing smoke, and another flies in later
     AA            guns below the horizon throwing streams of fire up into the sky, with flak bursting high
     capital ships one or two of the enemy's great ships hanging far off, now and then lancing a beam down onto the ground
     the ground    flashes on the horizon, columns of smoke rising and drifting
     sound         each flash's boom arrives late, the way it would from kilometres off (sound covers 343 m a second), low and quiet

   The whole thing rides with you (it is placed round the camera on the ground plane), so it always sits on the horizon however far
   you walk, like the sky. It holds still while the game is paused. Cheap: one line batch for every tracer, a sprite pool for the
   flashes and smoke, a few dozen small meshes. Phones get half as much.

   WARFRONT.start(cfg) after the world is built (camera, scene exist):
     ally, enemy      engine / tracer colours (hex) · allyShip, enemyShip  fighter models: 'wraith' 'lancer' 'devourer' or 'interceptor'
     capital          'harbinger' | 'voidclass' | 'harrower' | null · capitals  how many (0-2) · capCol  its glow colour
     fighters         how many in the air (both sides together) · aa  AA batteries · ground  ground flashes a minute
     near, far        the ring it all happens in (metres from you) · alt  [low, high] fighter altitude above the ground
     base             the ground's height out there (default: the ground under you at the start) · seed
   Global `WARFRONT` (WARFRONT.stop() / WARFRONT.set({...}) to change it mid-level). */
const WARFRONT=(()=>{
  let G=null,cfg=null,run=false,last=0,T=0;
  const PHONE=matchMedia('(pointer:coarse)').matches;
  const lin=h=>new THREE.Color(h);
  // a small seeded random of its own, so the war never shifts a level's seeded world
  let s0=1;const rnd=()=>{s0|=0;s0=s0+0x6D2B79F5|0;let t=Math.imul(s0^s0>>>15,1|s0);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const R=(a,b)=>a+rnd()*(b-a);
  let glowTex=null,smokeTex=null;
  function tex(soft){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),r=x.createRadialGradient(32,32,0,32,32,32);
    if(soft){r.addColorStop(0,'rgba(255,255,255,.75)');r.addColorStop(.5,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');}
    else{r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.2,'rgba(255,255,255,.7)');r.addColorStop(1,'rgba(255,255,255,0)');}
    x.fillStyle=r;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}

  /* ---------- pools ---------- */
  // tracers: one LineSegments; each bolt is a segment from its head back along its path
  const MAXB=PHONE?140:280;let bGeo,bPos,bCol,bolts=[];
  function bolt(p,v,col,life,len){if(bolts.length>=MAXB)return;bolts.push({p:p.clone(),v:v.clone(),c:lin(col),life,len:len||40});}
  // flashes, flak and smoke: sprites from a pool
  const MAXS=PHONE?50:100;let sprites=[],free=[];
  function sprite(kind,pos,col,size,life,vel){const s=free.pop();if(!s)return null;s.visible=true;s.position.copy(pos);s.userData={kind,life,max:life,size,vel:vel?vel.clone():null};
    s.material=kind==='smoke'?s._smoke:s._glow;s.material.color.copy(lin(col));s.scale.setScalar(size);return s;}

  /* ---------- the craft ---------- */
  let craft=[],caps=[],aa=[],beams=[],darkCol=null;
  function shipGeo(kind){try{if(kind==='interceptor'&&typeof interceptorGeo==='function'){const g=interceptorGeo();g.geo.computeBoundingBox();return{geo:g.geo,glow:g.glow,len:g.geo.boundingBox.max.z-g.geo.boundingBox.min.z};}
    if(typeof SHIPKIT!=='undefined'&&SHIPKIT[kind]){const g=SHIPKIT[kind]();g.geo.computeBoundingBox();return{geo:g.geo,glow:g.glow||g.glowGeo,len:g.geo.boundingBox.max.z-g.geo.boundingBox.min.z};}}catch(e){console.warn('warfront ship',e);}
    const b=new THREE.ConeGeometry(4,20,4);b.rotateX(-Math.PI/2);return{geo:b,glow:null,len:20};}
  /* Nov 9 (Bryce: "fix the old textures through the maps, replace them"): the war's ships were the old code-built hulls drawn as flat
     unlit black cut-outs, so a capital ship hanging over the horizon read as a black paper silhouette with a white line under it. Each
     now wears Bryce's own model, lit by the level's light, with the code hull hidden once it's in (and kept if a file fails):
     the Herald fighter and Void Lancer his Wraith and Harrower, the Hollow bomber for the Devourer, the interceptor, and the
     Voidclass, Harrower and Harbinger as capital ships. A little of the texture is lifted (glow) so a hull far off in a night sky
     still shows its paint, and the paint is tinted toward the air's colour so it sits back in the distance. */
  const MODEL={interceptor:'interceptor',wraith:'wraith',lancer:'harrower',devourer:'ship_hollow_bomber',voidclass:'voidclass',harrower:'harrower',harbinger:'harbinger'};
  let hazeHex=0xffffff;
  function dress(g,kind,geo,o){const name=MODEL[kind];if(!name||typeof MODELS==='undefined'||!MODELS.swapShip||!geo.geo)return;
    MODELS.swapShip(g,name,Object.assign({ref:geo.geo,metal:.3,fog:false,glow:.22,tint:hazeHex},o||{})).then(m=>{if(m){m.castShadow=m.receiveShadow=false;m.frustumCulled=false;}});}
  function makeCraft(side,geo,col,len,kind){const g=new THREE.Group();
    const body=new THREE.Mesh(geo.geo,new THREE.MeshBasicMaterial({color:darkCol,fog:false}));g.add(body);
    if(geo.glow){const gl=new THREE.Mesh(geo.glow,new THREE.MeshBasicMaterial({color:lin(col).multiplyScalar(1.6),fog:false,toneMapped:false}));g.add(gl);}
    const eng=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:lin(col),blending:THREE.AdditiveBlending,depthWrite:false,fog:false,transparent:true,toneMapped:false}));
    eng.position.z=geo.len*.5;eng.scale.setScalar(geo.len*.9);g.add(eng);
    g.scale.setScalar(len/geo.len);G.add(g);dress(g,kind,geo,kind==='lancer'?{tint:mixHex(0xb86a5e,hazeHex)}:null);
    return{g,side,col,alive:true,respawn:0,a:R(0,6.28),r:0,h:0,w:0,wob:R(0,6.28),fire:R(0,2),burst:0,foe:null,fall:null};}
  function placeCraft(c,first){const near=cfg.near,far=cfg.far;
    // each pair circles its own patch of sky: centre bearing, radius, height, speed
    c.cx=R(0,6.28);c.cd=R(near+150,far-150);c.r=R(120,300);c.h=R(cfg.alt[0],cfg.alt[1]);c.w=R(.18,.32)*(rnd()<.5?-1:1);c.a=first?R(0,6.28):c.a;
    c.alive=true;c.fall=null;c.g.visible=true;c.g.rotation.set(0,0,0);}

  /* ---------- start / stop ---------- */
  function start(o){if(typeof THREE==='undefined'||typeof scene==='undefined'||typeof camera==='undefined')return;stop();
    cfg=Object.assign({ally:0x7fe3ff,enemy:0x9a45ff,allyShip:'interceptor',enemyShip:'wraith',capital:null,capitals:1,capCol:0x9a45ff,
      fighters:12,aa:4,ground:14,near:1100,far:2300,alt:[160,520],seed:7,fighterLen:34},o||{});
    if(PHONE){cfg.fighters=Math.ceil(cfg.fighters/2);cfg.aa=Math.ceil(cfg.aa/2);cfg.ground=Math.ceil(cfg.ground*.6);}
    s0=cfg.seed;
    // heights are from the ground under you (the ring rises and sinks with it, slowly), so the war sits on your horizon on a summit too
    if(cfg.base==null)cfg.base=-25;
    if(!glowTex){glowTex=tex(false);smokeTex=tex(true);}
    const fog=scene.fog&&scene.fog.color?scene.fog.color.clone():new THREE.Color(0x101018);
    darkCol=new THREE.Color(0x0a0a10).lerp(fog,.45);   // far off, the hulls take on the air's colour
    hazeHex=new THREE.Color(1,1,1).lerp(new THREE.Color(fog.r*3+.25,fog.g*3+.25,fog.b*3+.25),.3).getHex();   // (the models' paint, a little toward the air)
    G=new THREE.Group();G.name='warfront';scene.add(G);
    // tracers
    bGeo=new THREE.BufferGeometry();bPos=new Float32Array(MAXB*6);bCol=new Float32Array(MAXB*6);
    bGeo.setAttribute('position',new THREE.BufferAttribute(bPos,3));bGeo.setAttribute('color',new THREE.BufferAttribute(bCol,3));
    const lines=new THREE.LineSegments(bGeo,new THREE.LineBasicMaterial({vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false,toneMapped:false}));
    lines.frustumCulled=false;G.add(lines);bolts=[];
    // sprites
    sprites=[];free=[];for(let i=0;i<MAXS;i++){const s=new THREE.Sprite();
      s._glow=new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false,toneMapped:false});
      s._smoke=new THREE.SpriteMaterial({map:smokeTex,depthWrite:false,transparent:true,fog:false,color:0x333333});
      s.material=s._glow;s.visible=false;G.add(s);sprites.push(s);free.push(s);}
    // fighters, in pairs (one of each side chasing round the same patch)
    const ag=shipGeo(cfg.allyShip),eg=shipGeo(cfg.enemyShip);craft=[];
    for(let i=0;i<cfg.fighters;i+=2){const a=makeCraft('ally',ag,cfg.ally,cfg.fighterLen,cfg.allyShip),e=makeCraft('enemy',eg,cfg.enemy,cfg.fighterLen*1.3,cfg.enemyShip);
      placeCraft(a,true);Object.assign(e,{cx:a.cx,cd:a.cd,r:a.r*R(.85,1.1),h:a.h+R(-30,30),w:a.w,a:a.a-R(.25,.5)});e.g.visible=true;a.foe=e;e.foe=a;craft.push(a,e);}
    // capital ships, far out
    caps=[];if(cfg.capital){const cg=shipGeo(cfg.capital);for(let i=0;i<Math.min(2,cfg.capitals);i++){const g=new THREE.Group();
      g.add(new THREE.Mesh(cg.geo,new THREE.MeshBasicMaterial({color:new THREE.Color(0x0a0a10).lerp(fog,.6),fog:false})));
      if(cg.glow)g.add(new THREE.Mesh(cg.glow,new THREE.MeshBasicMaterial({color:lin(cfg.capCol).multiplyScalar(1.2),fog:false,toneMapped:false})));
      const L=PHONE?600:760;g.scale.setScalar(L/cg.len);const b=R(0,6.28)+i*2.4,d=cfg.far*1.8+i*600;
      g.userData={b,d,h:cfg.base+R(900,1300),drift:R(-.004,.004),beamT:R(6,14)};g.rotation.y=b+Math.PI/2+R(-.4,.4);G.add(g);caps.push(g);
      dress(g,cfg.capital,cg,{glow:.45});}}
    // beams: a thin bright box, stretched between a capital ship and the ground when it fires
    beams=caps.map(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:lin(cfg.capCol).multiplyScalar(2.2),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false,toneMapped:false}));
      m.visible=false;G.add(m);return{m,t:0};});
    // AA batteries on the far ground
    aa=[];for(let i=0;i<cfg.aa;i++)aa.push({b:R(0,6.28),d:R(cfg.near+200,cfg.far),t:R(0,3),burst:0,col:rnd()<.7?cfg.ally:0xffd27a});
    run=true;last=performance.now();T=0;requestAnimationFrame(loop);}
  function stop(){run=false;if(G){scene.remove(G);G.traverse(o=>{if(o.geometry&&o.geometry!==undefined&&o.isLineSegments)o.geometry.dispose();});}G=null;}

  /* ---------- helpers ---------- */
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3();
  // a point on the ring round the anchor (bearing, distance, height above the base)
  const ring=(b,d,h,out)=>(out||new THREE.Vector3()).set(Math.sin(b)*d,cfg.base+h,Math.cos(b)*d);
  function boom(p,size,col,loud){sprite('flash',p,col||0xffc070,size,.5);
    if(loud)for(let i=0;i<2;i++)sprite('smoke',_c.copy(p).add(_b.set(R(-20,20),R(0,30),R(-20,20))),0x2a2622,size*1.4,R(6,10),_b.set(R(-3,3),R(4,9),R(-3,3)));
    sound(p,loud?1:.45);}
  // the boom, late and low (it has a long way to come)
  let actx=null;
  function sound(p,k){try{if(typeof sfx==='undefined'||!sfx.music_io)return;const io=sfx.music_io();if(!io)return;actx=io.ctx;
      if(localStorage.getItem('tideAudio')==='off')return;const vol=((sfx.vol&&sfx.vol.sfx)!=null?sfx.vol.sfx:1)*k;if(vol<=0)return;
      const d=Math.hypot(p.x,p.z),delay=Math.min(7,d/343),t=actx.currentTime+delay,len=1.6;
      const n=actx.createBufferSource(),buf=actx.createBuffer(1,actx.sampleRate*len,actx.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1);
      n.buffer=buf;const f=actx.createBiquadFilter();f.type='lowpass';f.frequency.value=110+Math.random()*60;const g=actx.createGain();
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09*vol*Math.min(1,1400/d),t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+len);
      const pan=actx.createStereoPanner?actx.createStereoPanner():null;
      if(pan&&typeof camera!=='undefined'){const yaw=camera.rotation.y,rx=Math.cos(yaw),rz=-Math.sin(yaw);pan.pan.value=Math.max(-1,Math.min(1,(p.x*rx+p.z*rz)/d));}
      n.connect(f);f.connect(g);(pan?(g.connect(pan),pan):g).connect(actx.destination);n.start(t);n.stop(t+len);}catch(_){}}

  /* ---------- each frame ---------- */
  function loop(){if(!run)return;requestAnimationFrame(loop);
    const now=performance.now();let dt=Math.min(.05,(now-last)/1000);last=now;
    const paused=typeof PG!=='undefined'&&PG.paused;if(paused||document.hidden)dt=0;T+=dt;
    // ride with the camera on the ground plane
    {let gy=G.position.y;try{if(typeof groundY==='function'){const v=groundY(camera.position.x,camera.position.z);if(isFinite(v))gy=v;}}catch(_){}
      if(!G.userData.y0){G.userData.y0=1;G.position.y=gy;}G.position.y+=(gy-G.position.y)*Math.min(1,(dt||.016)*.4);
      G.position.x=camera.position.x;G.position.z=camera.position.z;}
    G.visible=!(typeof PROLOGUE!=='undefined'&&PROLOGUE.on);
    // fighters
    for(const c of craft){
      if(!c.alive){c.respawn-=dt;if(c.fall){const f=c.fall;f.v.y-=30*dt;c.g.position.addScaledVector(f.v,dt);c.g.rotation.x+=dt*1.5;c.g.rotation.z+=dt*2.2;f.sm-=dt;
          if(f.sm<=0){f.sm=.12;sprite('smoke',c.g.position,0x262220,R(25,40),R(3,5),_b.set(0,6,0));}
          if(c.g.position.y<cfg.base+10){boom(c.g.position,90,0xffb060,true);c.fall=null;c.g.visible=false;}}
        if(c.respawn<=0&&c.foe&&c.foe.alive){placeCraft(c);c.cx=c.foe.cx;c.cd=c.foe.cd;c.r=c.foe.r;c.h=c.foe.h;c.w=c.foe.w;c.a=c.foe.a+(c.side==='enemy'?-.4:.4);}
        continue;}
      c.a+=c.w*dt;c.wob+=dt*.7;
      const cx=Math.sin(c.cx)*c.cd,cz=Math.cos(c.cx)*c.cd,y=cfg.base+c.h+Math.sin(c.wob)*40;
      const px=cx+Math.cos(c.a)*c.r,pz=cz+Math.sin(c.a)*c.r*.7;
      _a.set(px,y,pz);const v=_b.subVectors(_a,c.g.position);const sp=v.length()/(dt||1);
      if(dt>0&&sp>1){c.g.lookAt(_c.copy(G.position).add(c.g.position).sub(v));c.g.rotateZ(-c.w*1.6);}   // nose along the way it moves, banked into the turn
      c.g.position.copy(_a);
      // shooting at its pair: short bursts
      c.fire-=dt;if(c.foe&&c.foe.alive&&c.fire<=0){c.burst=c.burst>0?c.burst-1:Math.floor(R(3,7));c.fire=c.burst>0?.09:R(.8,2.4);
        if(c.burst>0){const to=_c.subVectors(c.foe.g.position,c.g.position).add(_a.set(R(-12,12),R(-8,8),R(-12,12))).normalize().multiplyScalar(700);
          bolt(c.g.position,to,c.side==='ally'?cfg.ally:cfg.enemy,.5,30);}}
      // now and then one is hit
      if(dt>0&&c.foe&&c.foe.alive&&rnd()<dt*(1/38)){c.alive=false;c.respawn=R(9,16);c.fall={v:new THREE.Vector3(R(-30,30),R(-5,10),R(-30,30)),sm:0};
        sprite('flash',c.g.position,0xffd090,70,.6);sound(c.g.position,.35);}}
    // AA: bursts of fire climbing into the sky, flak where they top out
    for(const A of aa){A.t-=dt;if(A.t>0)continue;
      if(A.burst<=0)A.burst=Math.floor(R(6,14));A.burst--;A.t=A.burst>0?.11:R(1.5,4);
      ring(A.b,A.d,0,_a);const tgt=craft.length&&rnd()<.6?craft[(rnd()*craft.length)|0].g.position:ring(A.b+R(-.3,.3),A.d-R(100,400),R(300,650),_c);
      const dir=_b.subVectors(tgt,_a).add(_c.set(R(-60,60),R(0,80),R(-60,60))).normalize().multiplyScalar(520);bolt(_a,dir,A.col,R(.9,1.3),46);
      if(rnd()<.35){const fp=_c.copy(_a).addScaledVector(dir,R(.9,1.3));sprite('flash',fp,0xffe0b0,R(18,30),.25);}}
    // capital ships drift; their beam comes down now and then
    caps.forEach((g,i)=>{const u=g.userData;u.b+=u.drift*dt;g.position.copy(ring(u.b,u.d,u.h-cfg.base,_a));
      u.beamT-=dt;const B=beams[i];
      if(u.beamT<=0&&!B.t){B.t=R(2.5,4);u.beamT=R(12,22);B.to=ring(u.b+R(-.12,.12),u.d*R(.55,.75),0);}
      if(B.t>0){B.t=Math.max(0,B.t-dt);const from=_a.copy(g.position).add(_b.set(0,-60,0)),to=B.to,mid=_c.addVectors(from,to).multiplyScalar(.5);
        B.m.visible=true;B.m.position.copy(mid);B.m.lookAt(_b.copy(G.position).add(to));const L=from.distanceTo(to),w=(PHONE?9:12)*(.7+.3*Math.sin(T*40));B.m.scale.set(w,w,L);
        B.m.material.opacity=Math.min(1,B.t*2)*(.75+.25*Math.sin(T*23));
        if(rnd()<dt*3)boom(_a.copy(to).add(_b.set(R(-40,40),0,R(-40,40))),R(120,200),0xffd0ff,true);}
      else B.m.visible=false;});
    // the ground: flashes and smoke columns on the horizon
    if(rnd()<dt*cfg.ground/60){boom(ring(R(0,6.28),R(cfg.near,cfg.far*1.2),R(0,20)),R(90,170),rnd()<.5?0xffb060:0xffe0a0,true);}
    // tracers
    let n=0;for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];b.life-=dt;if(b.life<=0){bolts.splice(i,1);continue;}b.p.addScaledVector(b.v,dt);}
    for(const b of bolts){const k=n*6,sp=b.v.length()||1;bPos[k]=b.p.x;bPos[k+1]=b.p.y;bPos[k+2]=b.p.z;bPos[k+3]=b.p.x-b.v.x/sp*b.len;bPos[k+4]=b.p.y-b.v.y/sp*b.len;bPos[k+5]=b.p.z-b.v.z/sp*b.len;
      const c=b.c,f=Math.min(1,b.life*3)*1.6;bCol[k]=c.r*f;bCol[k+1]=c.g*f;bCol[k+2]=c.b*f;bCol[k+3]=bCol[k+4]=bCol[k+5]=0;n++;}
    bGeo.setDrawRange(0,n*2);bGeo.attributes.position.needsUpdate=true;bGeo.attributes.color.needsUpdate=true;
    // sprites age
    for(const s of sprites){if(!s.visible)continue;const u=s.userData;u.life-=dt;if(u.life<=0){s.visible=false;free.push(s);continue;}const f=u.life/u.max;
      if(u.kind==='smoke'){s.position.addScaledVector(u.vel,dt);s.scale.setScalar(u.size*(1+(1-f)*2.5));s.material.opacity=.55*Math.min(1,f*2)*Math.min(1,(1-f)*8);}
      else{s.scale.setScalar(u.size*(1+(1-f)*.8));s.material.opacity=f;}}
  }
  function mixHex(a,b){const x=new THREE.Color(a),y=new THREE.Color(b);return x.multiply(y).getHex();}
  return{start,stop,set(o){if(cfg)start(Object.assign({},cfg,o));},get on(){return run;}};
})();
window.WARFRONT=WARFRONT;
