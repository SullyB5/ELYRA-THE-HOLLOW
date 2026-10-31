/* Elyra · the menu's secrets, in 3D (Oct 22, Bryce: "make them convincing"). A transparent WebGL layer sits between the star field
   (canvas#bg) and the menu, drawn only while something is in it. It uses the game's own models, loaded with the footage's 3D
   (js/menu/the-call.js: three.js, the people, js/shared/models.js, js/shared/leviathan.js) the first time a secret needs it.

   SONAR (the two small rings in the reticle): each ping goes out across the screen as a sonar wave, and for a moment the return
   shows something huge in the dark behind the archive card: the Drowned Watcher, lit only by the ping. Each ping it is closer. On
   the third it is right behind the card, and its eyes open, and it watches the pointer for a few seconds before it sinks away.
   THE DARK (touching empty space): now and then a real ship goes over, far out, across the stars: usually the Hollow King's
   Harbinger, dark, with its purple running lights, and sometimes a Host Voidclass or a red Herald Harrower. The stars go out
   behind it; the coordinates lose it ("CONTACT · NO TRANSPONDER").
   The rest (the heartbeat, the signal, words typed on the keyboard) live in js/menu/secrets.js and use the voices here.
   window.ELYRA_3D: sonar(i, el) · cross() · busy */
(()=>{
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches,touch=matchMedia('(pointer: coarse)').matches;
  let S=null,initP=null,raf=0,active=0,last=0;
  const FX=[];   // running effects: {update(dt,t) → false when finished}
  function load3d(){return window.ELYRA_LOAD3D?window.ELYRA_LOAD3D():Promise.reject(new Error('no 3D loader'));}
  function init(){return initP||(initP=load3d().then(()=>{
    const cv=document.createElement('canvas');cv.setAttribute('aria-hidden','true');
    cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:1';
    const bg=document.getElementById('bg');bg.after(cv);
    const r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:!touch,powerPreference:'low-power'});
    r.setClearColor(0x000000,0);r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1;
    const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(34,1,1,20000);cam.position.set(0,0,0);
    const size=()=>{const d=Math.min(devicePixelRatio||1,touch?1.25:1.5);r.setPixelRatio(d);r.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;
      cam.fov=cam.aspect<1?54:34;cam.updateProjectionMatrix();if(!active)r.clear();};
    size();addEventListener('resize',size);
    S={cv,r,scene,cam,watcher:null,ships:{}};
    // the Drowned Watcher (the code-built creature is swapped for Bryce's model when the file arrives)
    const lev=LEVIATHAN.makeLeviathan();lev.root.visible=false;scene.add(lev.root);
    const ping=new THREE.DirectionalLight(0x9fe4ff,0);ping.position.set(.2,.35,1);scene.add(ping,ping.target);   // the sonar's return, from the front
    const rimL=new THREE.DirectionalLight(0x4aa8c8,0);rimL.position.set(0,1,-1);scene.add(rimL,rimL.target);
    S.watcher={lev,ping,rimL,step:0,t:0,busy:false};
    try{MODELS.preload(['watcher','voidclass','harbinger']);}catch(_){}
    return S;}));}
  function frame(now){raf=0;if(!S)return;const dt=Math.min(.05,(now-(last||now))/1000);last=now;
    for(let i=FX.length-1;i>=0;i--)if(FX[i].update(dt,now/1000)===false)FX.splice(i,1);
    active=FX.length;S.r.render(S.scene,S.cam);if(active)raf=requestAnimationFrame(frame);else{last=0;S.r.clear();}}
  function run(fx){FX.push(fx);if(!raf)raf=requestAnimationFrame(frame);}
  // a screen point (CSS px) → a point in the 3D layer at distance d in front of the camera
  function at(px,py,d){const v=new THREE.Vector3((px/innerWidth)*2-1,-(py/innerHeight)*2+1,.5).unproject(S.cam).sub(S.cam.position).normalize();return v.multiplyScalar(d/(-v.z||1)).add(S.cam.position);}
  const cardC=()=>{const c=document.getElementById('card');if(!c)return[innerWidth/2,innerHeight/2];const b=c.getBoundingClientRect();return[b.left+b.width/2,b.top+b.height*.42];};
  let mx=innerWidth/2,my=innerHeight/2;addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});

  /* ---------- SONAR ---------- */
  const DIST=[1500,900,420],SCL=[12,12,10];   // far off to one side, nearer on the other, then right behind the card (its eyes either side of it, above)
  // (Oct 30: wait for his Watcher model before the first ping shows anything, so the code-built stand-in never flashes up on the
  // first visit; if the file is slow, give up after a few seconds and use the stand-in rather than lose the moment)
  const modelIn=()=>Promise.race([S.watcher.lev.ready,new Promise(ok=>setTimeout(ok,6000))]);
  function sonar(i,el){return init().then(modelIn).then(()=>{const W=S.watcher,L=W.lev;if(W.busy&&i<2)return;
    const k=Math.min(2,i),[cx,cy]=cardC(),d=DIST[k];
    const p=at(k===2?cx:(k?innerWidth*.22:innerWidth*.8),k===2?Math.max(innerHeight*.12,cy-innerHeight*.3):cy+innerHeight*.1,d);
    L.root.visible=true;L.root.scale.setScalar(SCL[k]);L.root.position.copy(p).add(new THREE.Vector3(0,-1*SCL[k],-13*SCL[k]));   // (its eyes, not its middle, at that point)
    L.root.rotation.set(-.06,(k===2?0:(k?.35:-.4)),0);L.setEyes(0);L.setLights(0);
    W.ping.target.position.copy(p);W.ping.position.copy(p).add(new THREE.Vector3(.2,.35,1).multiplyScalar(500));W.rimL.target.position.copy(p);W.rimL.position.copy(p).add(new THREE.Vector3(0,400,-600));
    if(k===2){W.busy=true;watch(el);return;}
    // the return: a flash of the shape, then dark again
    let t=0;run({update(dt){t+=dt;const u=t<.25?t/.25:Math.max(0,1-(t-.25)/1.7);W.ping.intensity=u*u*(k?1.5:1.2);W.rimL.intensity=u*1.6;L.update(t,dt);
      if(t>2.2){W.ping.intensity=W.rimL.intensity=0;L.root.visible=false;return false;}}});});}
  // the third ping: it is behind the card. The eyes open and follow the pointer; then it goes down into the dark
  function watch(){const W=S.watcher,L=W.lev,R0=L.root.rotation.clone(),P0=L.root.position.clone();let t=0;
    const S2=window.ELYRA_SECRETS&&ELYRA_SECRETS.sound;if(S2&&S2.groan)S2.groan();
    run({update(dt,now){t+=dt;L.update(now,dt);
      const lit=t<.3?t/.3:t<7.2?1-.25*Math.min(1,(t-.3)/1.5):Math.max(0,1-(t-7.2)/2.5);W.ping.intensity=(t<.4?1.6*(1-t/.4):0)+lit*.16;W.rimL.intensity=lit*1.3;
      const eyes=t<1.4?0:t<7.4?Math.min(1,(t-1.4)/1.4):Math.max(0,1-(t-7.4)/1.6);L.setEyes(eyes);L.setLights(eyes*.6);
      // it looks at the pointer (a little, slowly: something that size does not turn its head quickly)
      const tx=(mx/innerWidth-.5)*.5,ty=(my/innerHeight-.5)*.22;L.root.rotation.y+=((R0.y+tx)-L.root.rotation.y)*(1-Math.exp(-dt*.8));L.root.rotation.x+=((R0.x+ty)-L.root.rotation.x)*(1-Math.exp(-dt*.8));
      if(t>7.2){L.root.position.y=P0.y-(t-7.2)*(t-7.2)*30;}
      if(t>10.5){L.root.visible=false;L.setEyes(0);W.ping.intensity=W.rimL.intensity=0;W.busy=false;return false;}}});}

  /* ---------- THE DARK: a ship over the stars ---------- */
  const SHIP={harbinger:{len:1000,lights:0xb46aff,eng:0x9a4aff},voidclass:{len:700,lights:0xb46aff,eng:0x9a4aff},harrower:{len:600,lights:0xff5a3a,eng:0xff3a1a}};
  function shipMesh(name){if(S.ships[name])return Promise.resolve(S.ships[name]);
    const mk=(g,m)=>{const grp=new THREE.Group(),mesh=new THREE.Mesh(g,m);grp.add(mesh);
      // running lights along the hull and the engines at the stern, sprites so they read at this distance
      if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox,sp=(c,s,o)=>{const x=LEVIATHAN.sprite(c,s*1.6,2.4);x.material.opacity=o;grp.add(x);return x;};
      const L=[];for(let i=0;i<9;i++){const z=b.min.z+(b.max.z-b.min.z)*(i+.5)/9,s=sp(SHIP[name].lights,14,.9);s.position.set((i%2?1:-1)*(b.max.x-b.min.x)*.32,b.max.y*.4,z);L.push(s);}
      const E=[];for(const x of[-.18,0,.18]){const s=sp(SHIP[name].eng,70,.85);s.position.set((b.max.x-b.min.x)*x,0,b.max.z*1.02);E.push(s);}
      grp.userData={L,E};grp.visible=false;S.scene.add(grp);return S.ships[name]=grp;};
    // (the Harbinger is a big file: if it isn't in within a few seconds, a Voidclass goes over instead this time)
    if(name==='harbinger')return new Promise((ok,no)=>{const to=setTimeout(()=>no(new Error('slow')),9000);MODELS.harbinger((g,m)=>{clearTimeout(to);if(S.ships.harbinger)return ok(S.ships.harbinger);m.emissiveIntensity=.38;m.color=new THREE.Color(.62,.58,.68);ok(mk(g,m));});})
      .catch(()=>shipMesh('voidclass'));
    return MODELS.load(name).then(src=>{const g=src.geometry.clone();g.computeBoundingBox();const b=g.boundingBox,s=SHIP[name].len/(b.max.z-b.min.z);
      g.translate(-(b.max.x+b.min.x)/2,-(b.max.y+b.min.y)/2,-(b.max.z+b.min.z)/2);g.scale(s,s,s);
      const m=src.material.clone();m.side=THREE.DoubleSide;m.color=new THREE.Color(name==='harrower'?.8:.6,.56,name==='harrower'?.5:.66);return mk(g,m);});}
  let crossing=false;
  function cross(o){o=o||{};if(crossing)return Promise.resolve(null);crossing=true;
    return init().then(()=>new Promise(done=>{const r=Math.random(),name=o.name||(r<.62?'harbinger':r<.85?'voidclass':'harrower');shipMesh(name).then(grp=>{
      const ltr=o.ltr!=null?o.ltr:Math.random()<.5,D=name==='harbinger'?2600:1700,y=(o.y!=null?o.y:Math.random()*.5-.15)*D*.22,span=D*Math.tan(S.cam.fov*Math.PI/360)*S.cam.aspect*1.25+SHIP[name].len;
      grp.visible=true;grp.rotation.set(.08,ltr?-Math.PI/2:Math.PI/2,ltr?.05:-.05);grp.position.set(ltr?-span:span,y,-D);
      if(!S.moon){S.moon=new THREE.DirectionalLight(0x9aa4c8,1.8);S.moon.position.set(.3,1,.4);S.scene.add(S.moon);S.amb=new THREE.HemisphereLight(0x3a3a58,0x000000,.7);S.scene.add(S.amb);}
      const dur=o.dur||(still?8:name==='harbinger'?24:16);let t=0;
      const S2=window.ELYRA_SECRETS&&ELYRA_SECRETS.sound;if(S2&&S2.rumble)S2.rumble();
      const co=document.querySelector('.meta.coord'),keep=co&&co.innerHTML;
      run({update(dt,now){t+=dt;const u=t/dur;grp.position.x=(ltr?-span:span)+(ltr?1:-1)*span*2*u;
        grp.userData.L.forEach((s,i)=>s.material.opacity=(Math.sin(now*2.2+i*1.7)>.7?.95:.12));grp.userData.E.forEach(s=>s.material.opacity=.7+.2*Math.sin(now*9));
        if(co){const mid=Math.abs(u-.5)<.3;co.innerHTML=mid?'CONTACT · NO TRANSPONDER<br>BEARING '+String(Math.round(90+u*180)).padStart(3,'0')+'°':keep;co.style.color=mid?'#c98aff':'';}
        if(t>=dur){grp.visible=false;crossing=false;if(co){co.innerHTML=keep;co.style.color='';}done(true);return false;}}});}).catch(e=>{crossing=false;console.warn('cross',e);done(false);});})).catch(e=>{crossing=false;console.warn('cross',e);return false;});}
  window.ELYRA_3D={sonar,cross,init,get busy(){return active>0;},get crossing(){return crossing;}};
  // warm it up quietly once the menu has settled, on a PC (phones load it on the first secret)
  if(!touch)setTimeout(()=>{if(document.visibilityState==='visible')init().catch(()=>{});},12000);
})();
