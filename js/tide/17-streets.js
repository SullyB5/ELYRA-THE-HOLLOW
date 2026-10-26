/* Tide City · THE STREETS (Oct 25, Bryce): before the first fleet arrives, the Hollow King's carriers come in low over the sea and
   put dropships on the core platform: Empty Host troopers and their commanders, sent to break the city down before anyone is
   looking up. You drive the streets in a Keeper walker or a gun-skiff and take them apart: dropships, troops, then the carriers
   themselves. No sea guns and no city shield in this part. When the last carrier is in the water and the core is clear, the Vigil
   drops out of Slipscape with the Heralds behind her, and the battle runs as it always has (js/tide/11-story.js openingCut).

   Who you are here: Warden Six, the city's own heavy unit (Michael is still aboard the Vigil). Command calls you by callsign.
   What gets through costs the city: Host at the Spear's plinth and the carriers' guns take integrity off before the battle starts.

   Hooks (loads after the rest of Tide City): openingCut (the ground war runs first, then the old opening), step / playerWeapons
   (your machine), tideTick (HUD, objective), updateBanner, tagsEnd (carrier and dropship tags), callFleet (carry the damage over).
   Uses the path field FF (js/tide/11-story.js) for where you, and the Host, can go on the core platform. */
const STREETS=(()=>{
  const P0=PLATS[0],RIM=P0.r*.95,rf=(a,b)=>a+Math.random()*(b-a),rp=a=>a[(Math.random()*a.length)|0];
  const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3(),_d=new THREE.Vector3(),_m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3();
  const lerp=(a,b,u)=>a+(b-a)*u,st=(a,b,t)=>{const k=clamp((t-a)/(b-a),0,1);return k*k*(3-2*k);};
  const G={on:false,stage:'off',t:0,kind:null,lost:0,n:{troops:0,cmd:0,drops:0,carriers:0},said:new Set(),fightT:0,clearT:0,wentDown:false,breached:false};
  const say=(key,who,txt,tone,dur)=>{if(G.said.has(key))return;G.said.add(key);PG.say(who,txt,tone,dur);};

  /* ---------- where things can go ---------- */
  // on the core platform the path field knows the buildings and the Spear's plinth; off it, the outer districts' towers and homes
  function freeAt(x,z){return Math.hypot(x-P0.x,z-P0.z)<RIM?FF.free(x,z):true;}
  function solidOff(x,z,r){
    for(const T of towers){const dx=x-T.x,dz=z-T.z;if(Math.abs(dx)>200||Math.abs(dz)>200)continue;const rr=T.fp*(T.kind==='box'?.68:.52)+r;if(dx*dx+dz*dz<rr*rr)return true;}
    for(const L of lows){const dx=x-L.x,dz=z-L.z;if(Math.abs(dx)>120||Math.abs(dz)>120)continue;const rr=L.rad*.78+r;if(dx*dx+dz*dz<rr*rr)return true;}
    for(const P of PLATS)if(P.spire){const dx=x-P.x,dz=z-P.z,rr=P.r*.24+r;if(dx*dx+dz*dz<rr*rr)return true;}
    return false;}
  // can a machine of radius r stand here? (water: the skiff hovers over the sea, the walker can't)
  function clearFor(x,z,r,water){const d=Math.hypot(x-P0.x,z-P0.z);
    if(d>2700)return false;
    if(!water&&d>RIM-r*.4&&groundAt(x,z)===null)return false;
    if(d<RIM+r){if(!freeAt(x,z))return false;for(let k=0;k<8;k++){const a=k*Math.PI/4;if(!freeAt(x+Math.cos(a)*r,z+Math.sin(a)*r))return false;}return true;}
    return !solidOff(x,z,r);}
  const floorY=(x,z)=>{const g=groundAt(x,z);return g===null?0:g;};
  // line of sight along the ground (buildings block it); samples next to either end don't count
  function los(ax,az,bx,bz){const L=Math.hypot(bx-ax,bz-az),n=Math.ceil(L/10);for(let i=2;i<n-1;i++){const u=i/n;if(!freeAt(ax+(bx-ax)*u,az+(bz-az)*u))return false;}return true;}
  // is a point inside a tower (for the camera, and for what a shot can hit)
  function inTower(x,y,z){for(const T of towers){const dx=x-T.x,dz=z-T.z;if(Math.abs(dx)>90||Math.abs(dz)>90)continue;if(y>3+T.h)continue;const rr=T.fp*(T.kind==='box'?.62:.5);if(dx*dx+dz*dz<rr*rr)return true;}
    for(const L of lows){const dx=x-L.x,dz=z-L.z;if(Math.abs(dx)>40||Math.abs(dz)>40)continue;if(y>3+L.h)continue;if(dx*dx+dz*dz<L.rad*L.rad*.5)return true;}return false;}
  // a ray against the towers: distance to the first one it enters (or maxD)
  function towerRay(o,d,maxD){let best=maxD;const h2=Math.hypot(d.x,d.z);if(h2<1e-4)return best;const hx=d.x/h2,hz=d.z/h2;
    for(const T of towers){const ox=T.x-o.x,oz=T.z-o.z,sc=ox*hx+oz*hz;if(sc<-80||sc>best*h2+80)continue;const rr=T.fp*(T.kind==='box'?.6:.5),c2=ox*ox+oz*oz-sc*sc;if(c2>rr*rr)continue;
      const t=(sc-Math.sqrt(rr*rr-c2))/h2;if(t<0||t>best)continue;const y=o.y+d.y*t;if(y>3+T.h||y<0)continue;best=t;}
    return best;}

  /* ---------- your machine ---------- */
  const PV={kind:null,g:new THREE.Group(),vis:new THREE.Group(),pos:new THREE.Vector3(),yaw:0,vel:new THREE.Vector3(),r:10,alive:true,downT:0,gunCool:0,rkCool:0,side:0,
    mix:null,legs:[],legBase:[],stride:0,bob:0,muz:[],ready:{walker:false,skiff:false},models:{},pod:null,lift:[]};
  PV.g.add(PV.vis);PV.g.visible=false;scene.add(PV.g);
  const KIND={
    walker:{name:'WALKER',r:11,speed:52,boost:78,acc:3,camD:78,camH:MECH_H*.92,gun:.3,gunDmg:3,splash:22,rk:5,rkN:4,rkDmg:6,hp:1.35,water:false},
    skiff:{name:'GUN-SKIFF',r:10,speed:150,boost:235,acc:1.6,camD:52,camH:17,gun:.095,gunDmg:1,splash:11,rk:2.8,rkN:2,rkDmg:8,hp:1,water:true}};
  // the walker: Bryce's Tide City Mech (the same model holding the plinth), at the same height
  function loadWalker(){if(PV.models.walker)return PV.models.walker;
    return PV.models.walker=MODELS.copy('mech').then(({scene:s,animations:an})=>{MODELS.tame(s,.5);
      s.traverse(o=>{if(o.isMesh&&o.material.map){o.material=o.material.clone();o.material.emissive=new THREE.Color(1,1,1);o.material.emissiveMap=o.material.map;o.material.emissiveIntensity=.22;}});
      s.updateMatrixWorld(true);const bb=new THREE.Box3();s.traverse(o=>{if(o.isBone)bb.expandByPoint(o.getWorldPosition(new THREE.Vector3()));});
      const h=(bb.max.y-bb.min.y)/.9||1,k=MECH_H/h,inner=new THREE.Group();inner.add(s);inner.scale.setScalar(k);
      s.position.set(-(bb.min.x+bb.max.x)/2,-bb.min.y+h*.04,-(bb.min.z+bb.max.z)/2);s.rotation.y=Math.PI;
      const legs=[],muz=[];s.traverse(o=>{if(!o.isBone)return;if(/^Leg[LR]_\d+$/.test(o.name))legs.push(o);if(/^Gun(001)?_\d+$/.test(o.name))muz.push(o);});
      return{root:inner,mix:an[0]?(()=>{const m=new THREE.AnimationMixer(s);m.clipAction(an[0]).play();return m;})():null,legs,legBase:legs.map(b=>b.quaternion.clone()),muz};});}
  // the gun-skiff: Bryce's Tide City car, in Keeper white and blue, a twin pulse-gun pod on the roof and blue lift under it
  function flatModel(name){return MODELS.copy(name).then(({scene:s})=>{s.updateMatrixWorld(true);const out={};
    s.traverse(o=>{if(!o.isMesh)return;const src=o.geometry,g=new THREE.BufferGeometry();
      const div=a=>!a.normalized?1:a.array instanceof Int8Array?127:a.array instanceof Uint8Array?255:a.array instanceof Int16Array?32767:a.array instanceof Uint16Array?65535:1;
      for(const k of['position','normal','color']){const a=src.attributes[k];if(!a)continue;const n=a.count,sz=a.itemSize,dv=div(a),arr=new Float32Array(n*sz);
        for(let i=0;i<n;i++){arr[i*sz]=a.getX(i)/dv;if(sz>1)arr[i*sz+1]=a.getY(i)/dv;if(sz>2)arr[i*sz+2]=a.getZ(i)/dv;}g.setAttribute(k,new THREE.BufferAttribute(arr,sz));}
      if(src.index)g.setIndex(new THREE.BufferAttribute(Uint32Array.from(src.index.array),1));
      g.applyMatrix4(o.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();out[/glow/i.test(o.name)?'glow':'body']=g;});
    return out;});}
  function loadSkiff(){if(PV.models.skiff)return PV.models.skiff;
    return PV.models.skiff=flatModel('tide-car').then(F=>{const root=new THREE.Group(),k=5.2;
      const body=new THREE.Mesh(F.body,new THREE.MeshStandardMaterial({vertexColors:true,color:C(0xe6eef8),roughness:.38,metalness:.45,emissive:C(0x0b1726)}));body.scale.setScalar(k);body.castShadow=true;root.add(body);
      if(F.glow){const gl=new THREE.Mesh(F.glow,new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.2,2.2,2.2)}));gl.scale.setScalar(k);root.add(gl);}
      // Keeper blue down her flanks, and the gun pod
      const blu=new THREE.MeshStandardMaterial({color:C(0x2a5a96),roughness:.4,metalness:.4,emissive:C(0x0a2244)}),wht=new THREE.MeshStandardMaterial({color:C(0xeef1f5),roughness:.35,metalness:.35}),gd=new THREE.MeshStandardMaterial({color:C(0xd9b25a),roughness:.3,metalness:.8});
      for(const s of[-1,1]){const st=new THREE.Mesh(new THREE.BoxGeometry(.5,1.1,22),blu);st.position.set(s*6.95,2.6,0);root.add(st);}
      const pod=new THREE.Group();pod.position.set(0,6.4,2.5);root.add(pod);
      const base=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.9,1.4,10),wht);pod.add(base);const hous=new THREE.Mesh(new THREE.BoxGeometry(4.6,1.8,4.2),wht);hous.position.y=1.2;pod.add(hous);
      const band=new THREE.Mesh(new THREE.BoxGeometry(4.7,.35,4.3),gd);band.position.y=1.9;pod.add(band);
      const muz=[];for(const s of[-1,1]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.32,.42,7,8).rotateX(Math.PI/2),blu);b.position.set(s*1.4,1.2,-5);pod.add(b);const m=new THREE.Object3D();m.position.set(s*1.4,1.2,-8.6);pod.add(m);muz.push(m);}
      const lift=[];for(const [x,z] of[[-5,-9],[5,-9],[-5,9],[5,9]]){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0x7fe6ff).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.position.set(x,.6,z);sp.scale.setScalar(9);root.add(sp);lift.push(sp);}
      return{root,pod,muz,lift};});}
  ['mech','tide-car'].forEach(n=>{try{MODELS.copy(n).catch(()=>{});}catch(_){}});   // start the downloads early
  function mountKind(kind){PV.kind=kind;const K=KIND[kind];PV.r=K.r;PV.vis.clear();PV.mix=null;PV.legs=[];PV.pod=null;PV.muz=[];PV.lift=[];
    // a stand-in until the model is in
    const stand=new THREE.Mesh(kind==='walker'?new THREE.BoxGeometry(14,MECH_H*.8,10).translate(0,MECH_H*.45,0):new THREE.BoxGeometry(14,6,30).translate(0,3,0),new THREE.MeshStandardMaterial({color:C(0xdfe7f0),roughness:.5}));PV.vis.add(stand);
    (kind==='walker'?loadWalker():loadSkiff()).then(M=>{if(PV.kind!==kind)return;PV.vis.remove(stand);
      if(kind==='walker'){PV.vis.add(M.root);PV.mix=M.mix;PV.legs=M.legs;PV.legBase=M.legBase;PV.muz=M.muz;}
      else{PV.vis.add(M.root);PV.pod=M.pod;PV.muz=M.muz;PV.lift=M.lift;}}).catch(e=>console.warn('streets machine',e&&e.message));}
  // where you start: on the ring road, on the side the first carrier comes in
  function spawnSpot(a0){for(let k=0;k<60;k++){const a=a0+(k%2?1:-1)*Math.floor(k/2)*.03,r=P0.r*.915,x=Math.cos(a)*r,z=Math.sin(a)*r;if(clearFor(x,z,16,false))return{x,z,a};}return{x:Math.cos(a0)*P0.r*.9,z:Math.sin(a0)*P0.r*.9,a:a0};}

  /* ---------- the Host on the ground: troopers and commanders ---------- */
  const TN=96,tMesh=new THREE.InstancedMesh(TROOPG,troopMesh.material.clone(),TN);   // (its own material: it carries instance colours, the Host's mesh doesn't, and r128 can't share a program across that)
 tMesh.frustumCulled=false;tMesh.castShadow=true;scene.add(tMesh);
  const TR=[];for(let i=0;i<TN;i++){TR.push({on:false,cmd:false,pos:new THREE.Vector3(),dir:new THREE.Vector3(),yaw:0,hp:1,sp:9,fireT:0,state:'walk',ph:rf(0,6),holdT:0,burst:0});tMesh.setMatrixAt(i,_m.makeScale(0,0,0));tMesh.setColorAt(i,C(0xffffff));}
  // markers over them (purple troopers, gold commanders), drawn through buildings like the Host's beacons later in the battle
  const gTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.beginPath();x.moveTo(32,60);x.lineTo(7,24);x.lineTo(20,6);x.lineTo(44,6);x.lineTo(57,24);x.closePath();
    x.fillStyle='#ffc24a';x.fill();x.lineWidth=5;x.strokeStyle='#ffffff';x.lineJoin='round';x.stroke();x.beginPath();x.moveTo(20,22);x.lineTo(26,12);x.lineTo(32,20);x.lineTo(38,12);x.lineTo(44,22);x.closePath();x.fillStyle='#4a1c00';x.fill();
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;})();
  function beaconLayer(tex,size){const pos=new Float32Array(TN*3),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setDrawRange(0,0);
    const p=new THREE.Points(g,new THREE.PointsMaterial({size,sizeAttenuation:false,map:tex,alphaTest:.1,transparent:true,depthWrite:false,depthTest:false,fog:false,toneMapped:false}));p.frustumCulled=false;p.renderOrder=6;scene.add(p);return{p,pos,g};}
  const BT=beaconLayer(tbTex,coarse?26:20),BC=beaconLayer(gTex,coarse?36:30);
  function spawnTroop(at,cmd){const t=TR.find(t=>!t.on);if(!t)return null;t.on=true;t.cmd=!!cmd;t.state='walk';t.hp=Math.round((cmd?12:1)*Math.max(1,DIFF.tide.ehp));t.sp=cmd?rf(6,7.5):rf(8.5,11);
    for(let k=0;k<10;k++){t.pos.set(at.x+rf(-26,26),3,at.z+rf(-26,26));if(FF.free(t.pos.x,t.pos.z))break;}t.pos.y=3;t.dir.set(0,0,0);t.fireT=rf(1.5,3);t.holdT=0;t.burst=0;
    tMesh.setColorAt(TR.indexOf(t),cmd?new THREE.Color(1.5,1.15,.6):C(0xffffff));if(tMesh.instanceColor)tMesh.instanceColor.needsUpdate=true;return t;}
  function killTroop(t,how){if(!t.on)return;t.on=false;const p=t.pos.clone().setY(10);boom(p,t.cmd?140:70,t.cmd?0xffc24a:0xc080ff,.45);puff(p,t.cmd?44:26,1.6);if(typeof sfx!=='undefined'&&sfx.trooperDown)sfx.trooperDown(t.pos);
    if(how){if(t.cmd){G.n.cmd++;PG.kill(300,t.pos,how);if(G.n.cmd===1)PG.say('Tide City Command','Commander down! Their squads are breaking up!');}else{G.n.troops++;PG.kill(60,t.pos,how);}PG.prog('tstreetk');}}
  const troopsOn=()=>TR.reduce((n,t)=>n+(t.on?1:0),0);
  function updateTroops(dt,now){let nt=0,nc=0;
    for(let i=0;i<TN;i++){const t=TR[i];if(!t.on){tMesh.setMatrixAt(i,_m.makeScale(0,0,0));continue;}
      const dp=PV.alive&&PV.kind?Math.hypot(PV.pos.x-t.pos.x,PV.pos.z-t.pos.z):1e9;
      // a commander near you sharpens his squad: they fire faster
      if(t.state==='walk'||t.state==='hold'){
        const see=G.stage==='fight'&&dp<(t.cmd?480:400)&&los(t.pos.x,t.pos.z,PV.pos.x,PV.pos.z);
        if(see&&t.state==='walk'&&Math.random()<dt*1.6){t.state='hold';t.holdT=rf(2.5,4.5);}
        if(t.state==='hold'){t.holdT-=dt;t.yaw=Math.atan2(-(PV.pos.x-t.pos.x),-(PV.pos.z-t.pos.z));if(t.holdT<=0||!see)t.state='walk';}
        if(t.state==='walk'){const s=FF.step(t.pos.x,t.pos.z,_d);
          if(s===0){t.state='breach';t.fireT=rf(.5,1.5);}
          else{if(s===null)_d.set(SPEAR.x,3,SPEAR.z);_a.subVectors(_d,t.pos).setY(0);const L=_a.length();if(L>.01)_a.divideScalar(L);t.dir.lerp(_a,1-Math.exp(-dt*6));if(t.dir.lengthSq()>1e-4)t.dir.normalize();
            const nx=t.pos.x+t.dir.x*t.sp*dt,nz=t.pos.z+t.dir.z*t.sp*dt;
            if(s===null||FF.free(nx,nz)){t.pos.x=nx;t.pos.z=nz;}else if(FF.free(nx,t.pos.z))t.pos.x=nx;else if(FF.free(t.pos.x,nz))t.pos.z=nz;
            t.yaw=Math.atan2(-t.dir.x,-t.dir.z);}}
        // firing at you
        t.fireT-=dt;if(t.fireT<=0&&see&&PV.alive){let quick=1;if(!t.cmd)for(const c of TR)if(c.on&&c.cmd&&Math.abs(c.pos.x-t.pos.x)<90&&Math.abs(c.pos.z-t.pos.z)<90){quick=.6;break;}
          t.fireT=(t.cmd?rf(1.6,2.4):rf(1.6,3))*quick/DIFF.tide.rof;t.yaw=Math.atan2(-(PV.pos.x-t.pos.x),-(PV.pos.z-t.pos.z));
          const n=t.cmd?3:1;for(let k=0;k<n;k++)setTimeout(()=>{if(t.on)shootAtYou(t.pos.clone().setY(3+TROOP_S*(t.cmd?1.9:1.3)),'host',t.cmd?2.4:1.2,.35);},k*140);}}
      else if(t.state==='breach'){
        // at the Spear's plinth: they hammer its base, the guard there answers, and the city pays for every second
        t.yaw=Math.atan2(-(SPEAR.x-t.pos.x),-(SPEAR.z-t.pos.z));G.lost=Math.min(30,G.lost+dt*(t.cmd?.09:.045)*DIFF.tide.city);   // the streets can take the city down to 70%, no further (Bryce, Oct 25)
        if(!G.breached){G.breached=true;PG.fail('tstreet');PG.say('Keeper Sergeant','Host at the plinth! We’re holding, but every one that gets here is tearing at the city!','alert',5);}
        t.fireT-=dt;if(t.fireT<=0){t.fireT=rf(1.2,2.2);fire(t.pos.clone().setY(3+TROOP_S*1.3),new THREE.Vector3(SPEAR.x+rf(-30,30),rf(20,70),SPEAR.z+rf(-30,30)),900,'host',p=>boom(p,30,0xc080ff,.3));}
        // the plinth's guard picks them off
        if(Math.random()<dt*.5){const gd=guards.filter(g=>g.alive);if(gd.length){const g=rp(gd),from=new THREE.Vector3(g.x,3+TROOP_S*1.25,g.z);
          fire(from,t.pos.clone().setY(3+TROOP_S*1.4),1100,'keeper',p=>{boom(p,24,0x9ff4ff,.25);if(t.on&&Math.random()<(t.cmd?.15:.45))killTroop(t,null);});}}}
      const bob=t.state==='walk'?Math.abs(Math.sin(now*7+t.ph))*.9:0,sc=TROOP_S*(t.cmd?1.45:1);
      _e.set(0,t.yaw,t.state==='walk'?Math.sin(now*7+t.ph)*.06:0);tMesh.setMatrixAt(i,_m.compose(_s.set(t.pos.x,t.pos.y+bob,t.pos.z),_q.setFromEuler(_e),_c.setScalar(sc)));
      const L=t.cmd?BC:BT,k=t.cmd?nc++:nt++;L.pos[k*3]=t.pos.x;L.pos[k*3+1]=t.pos.y+sc*3.6;L.pos[k*3+2]=t.pos.z;}
    tMesh.instanceMatrix.needsUpdate=true;BT.g.setDrawRange(0,nt);BC.g.setDrawRange(0,nc);BT.g.attributes.position.needsUpdate=true;BC.g.attributes.position.needsUpdate=true;}

  /* ---------- enemy fire at you: aimed where you'll be, and it only hurts if you're still there ---------- */
  function shootAtYou(from,kind,dmg,spread){if(!PV.alive)return;G.shots=(G.shots||0)+1;const d=from.distanceTo(PV.pos),sp=kind==='hollow'?1500:900,tt=d/sp;
    const to=PV.pos.clone().addScaledVector(PV.vel,tt*rf(.3,.9)).add(_a.set(rf(-1,1),0,rf(-1,1)).multiplyScalar(spread*d*.06));to.y=PV.pos.y+(PV.kind==='walker'?MECH_H*rf(.3,.75):rf(2,6));
    fire(from,to,sp,kind,p=>{const near=Math.hypot(p.x-PV.pos.x,p.z-PV.pos.z)<PV.r+(kind==='hollow'?20:5);
      if(kind==='hollow'){boom(p,260,0xd8a0ff,.5);boom(p,420,0xff6a1a,1.1);puff(p,90,3);for(const t of TR)if(t.on&&t.pos.distanceTo(p)<40)killTroop(t,null);}
      if(near)hurtYou(dmg,p);});}
  function hurtYou(dmg,at){if(!PV.alive||CUTS.on||G.stage!=='fight')return;G.hits=(G.hits||0)+1;dmg*=DIFF.tide.dmg/KIND[PV.kind].hp;
    tideP.lastHit=performance.now()/1000;const s=Math.min(tideP.shield,dmg);tideP.shield-=s;tideP.hull-=dmg-s;if(typeof sfx!=='undefined'&&sfx.hit)sfx.hit(s>=dmg);
    boom(at||PV.pos,s>=dmg?30:50,s>=dmg?0x7fb6ff:0xff7a3a,.3);if(tideP.hull<=0)youDown();}
  function youDown(){PV.alive=false;PV.downT=5;tideP.hull=0;G.wentDown=true;fireHeld=false;const p=PV.pos.clone().setY(PV.pos.y+10);
    boom(p,220,0xfff0c0,.5);boom(p,460,0xff6a1a,1.4);for(let i=0;i<5;i++)puff(p.clone().add(_a.set(rf(-14,14),rf(0,20),rf(-14,14))),rf(40,80),3);flashScreen(.4);PV.g.visible=false;
    if(typeof sfx!=='undefined'&&sfx.shipDown)sfx.shipDown();PG.fail('pdown');
    PG.say('Tide City Command',PV.kind==='walker'?'Warden Six is down! Bring up another walker, now!':'Warden Six is down! Get another skiff on the road!','alert',4);}
  function respawn(){const s=spawnSpot(Math.atan2(PV.pos.z,PV.pos.x));PV.pos.set(s.x,floorY(s.x,s.z),s.z);PV.vel.set(0,0,0);PV.alive=true;tideP.shield=100;tideP.hull=100;PV.g.visible=true;
    PV.yaw=Math.atan2(s.x,s.z);yaw=PV.yaw;pitch=.12;flashBanner(KIND[PV.kind].name+' · back on the road');}

  /* ---------- the carriers ---------- */
  const CK=SHIPKIT.voidclass(),CAR_S=.47;
  CK.geo.computeBoundingBox();const CBB=CK.geo.boundingBox;
  const CAR=[{a:.82,name:'Pale Gate'},{a:.82+Math.PI*2/3,name:'Hush'},{a:.82+Math.PI*4/3,name:'Ninth Mouth'}].map((cfg,i)=>{
    const g=new THREE.Group(),h0=new THREE.Mesh(CK.geo,hollowMat),h1=new THREE.Mesh(CK.glowGeo,hollowWindowMat);g.add(h0,h1);
    MODELS.swapShip(g,'voidclass',{ref:CK.geo,hide:[h0,h1],shadow:true}).then(m=>{if(!m)return;
      // lit from within in the Host's purple: at this range, at night, the bare hull was a black shape on a black sky
      m.material=m.material.clone();m.material.color=C(0xc4bcd6);m.material.emissive=C(0x3a1d5c);m.material.emissiveMap=null;m.material.emissiveIntensity=1;});
    {const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(CK.lights,3));lg.setAttribute('color',new THREE.Float32BufferAttribute(CK.lc,3));
     g.add(new THREE.Points(lg,new THREE.PointsMaterial({size:22,map:glow,vertexColors:true,color:C(HOLLOW_GLOW),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));}   // her running lights
    const eg=new THREE.BufferGeometry();eg.setFromPoints(CK.eng);g.add(new THREE.Points(eg,new THREE.PointsMaterial({size:220,map:glow,color:C(HOLLOW_GLOW).multiplyScalar(2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
    // a purple light under her belly where the dropships come and go
    const bay=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xb46aff).multiplyScalar(2.4),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));bay.position.set(0,-120,60);bay.scale.setScalar(260);g.add(bay);
    g.scale.setScalar(CAR_S);g.rotation.order='YXZ';g.visible=false;scene.add(g);
    const home=new THREE.Vector3(Math.cos(cfg.a)*860,440,Math.sin(cfg.a)*860);
    return{i,g,name:cfg.name,a:cfg.a,home,state:'off',t:0,hp:0,max:Math.round(250*DIFF.tide.ehp),sorties:0,maxSorties:Math.round(4+2*DIFF.tide.mob),active:0,launchT:0,gunT:6,lastHit:-99,fx:0,vel:new THREE.Vector3(),spin:0,bay};});
  // where her hits land, along her keel (her length runs along local z)
  const CZ=[-520,-260,0,260,480];
  function carrierPts(c){c.g.updateMatrixWorld();return CZ.map(z=>c.g.localToWorld(new THREE.Vector3(0,-10,z)));}
  function arriveCarrier(c){c.state='in';c.t=0;c.hp=c.max;c.sorties=0;c.active=0;c.launchT=rf(2,4);c.gunT=rf(6,9);c.g.visible=true;c.g.rotation.set(0,Math.PI-c.a,0);
    c.g.position.copy(c.home).setY(2900);boom(c.g.position,2200,0xffffff,.6);boom(c.g.position,1600,HOLLOW_GLOW,1.2);if(typeof sfx!=='undefined'&&sfx.jump)sfx.jump(c.g.position);}
  function hurtCarrier(c,dmg,p,how){if(c.state!=='hold'&&c.state!=='in')return;c.hp-=dmg;c.lastHit=performance.now()/1000;boom(p,dmg>2?260:110,0xfff1c8,.35);if(dmg>2)boom(p,420,0xff7a26,1);
    if(c.hp<c.max*.5&&!c.half){c.half=true;say('half'+c.i,'Tide City Command','The '+c.name+' is burning! Keep on her!','alert');}
    if(c.hp<=0)downCarrier(c,how);}
  function downCarrier(c,how){c.state='fall';c.t=0;const out=_a.set(c.g.position.x,0,c.g.position.z).normalize();c.vel.set(out.x*40,-12,out.z*40);c.spin=(Math.random()<.5?-1:1)*rf(.12,.22);
    boom(c.g.position,1800,0xfff0c0,.8);boom(c.g.position,1400,0xff6a1a,1.6);for(let k=0;k<4;k++){const p=c.g.position.clone().add(_b.set(rf(-180,180),rf(-40,40),rf(-180,180)));boom(p,rf(500,900),0xff7a1a,1.5);smoke(p,rf(400,700),5);}
    if(typeof sfx!=='undefined'&&sfx.crash)sfx.crash(c.g.position);G.n.carriers++;PG.kill(3000,c.g.position,how||'gun');PG.prog('tcarrier');
    // her dropships still in the air turn and run
    for(const D of DR)if(D.on&&D.c===c&&(D.state==='launch'||D.state==='out'))D.state='flee';
    const left=CAR.filter(x=>x.state==='hold'||x.state==='in').length;
    PG.say(left?'Tide City Command':'Keeper Sergeant',left?'The '+c.name+' is going into the sea! '+(left===1?'One carrier left!':left+' carriers left!'):'That’s the last of them! She’s going down!','alert',4);}
  function updateCarriers(dt,t){
    for(const c of CAR){if(c.state==='off')continue;c.t+=dt;
      if(c.state==='in'){const u=st(0,9,c.t);c.g.position.copy(c.home).setY(lerp(2900,c.home.y,u));c.g.rotation.x=(1-u)*.12;if(u>=1){c.state='hold';c.t=0;}}
      else if(c.state==='hold'){c.g.position.copy(c.home);c.g.position.y+=Math.sin(t*.3+c.i)*12;c.g.position.x+=Math.sin(t*.13+c.i*2)*30;c.g.rotation.z=Math.sin(t*.25+c.i)*.02;
        // launch dropships, two in the air at a time
        c.launchT-=dt;if(c.launchT<=0&&c.active<2&&c.sorties<c.maxSorties){c.launchT=rf(6,10)/DIFF.tide.mob;if(launchDrop(c)){c.sorties++;c.active++;}}
        // her guns on you, when you're close enough to matter
        c.gunT-=dt;if(c.gunT<=0&&PV.alive&&G.stage==='fight'){c.gunT=rf(3.5,5.5)/DIFF.tide.rof;const d=Math.hypot(PV.pos.x-c.g.position.x,PV.pos.z-c.g.position.z);
          if(d<1400){const n=2+(Math.random()<.4?1:0);for(let k=0;k<n;k++)setTimeout(()=>{if(c.state!=='hold')return;const from=c.g.localToWorld(_a.set(rf(-40,40),-90,rf(-200,200)).clone());boom(from,180,HOLLOW_GLOW,.4);shootAtYou(from,'hollow',6,.3);},k*260);}}
        c.bay.material.opacity=.6+.4*Math.sin(t*3+c.i);
        if(c.hp<c.max*.6){c.fx-=dt;if(c.fx<=0){c.fx=rf(.15,.4)*(c.hp/c.max+.3);const p=c.g.localToWorld(_a.set(rf(-90,90),rf(-40,60),rf(-500,450)).clone());boom(p,rf(120,260),rp([0xff7a1a,0xff4a10,0xffb040]),rf(.5,1));smoke(p,rf(160,320),rf(3,5));}}}
      else if(c.state==='fall'){c.vel.y-=60*dt;c.g.position.addScaledVector(c.vel,dt);c.g.rotation.z+=c.spin*dt;c.g.rotation.x+=c.spin*.5*dt;
        c.fx-=dt;if(c.fx<=0){c.fx=.07;const p=c.g.localToWorld(_a.set(rf(-90,90),rf(-40,60),rf(-500,450)).clone());boom(p,rf(200,420),rp([0xff7a1a,0xb46aff,0xffb040]),rf(.6,1.2));smoke(p,rf(260,480),5);}
        if(c.g.position.y<30){c.state='dead';c.g.visible=false;const p=c.g.position.clone().setY(10);boom(p,2600,0xfff0c0,.8);boom(p,3200,0xff6a1a,2);
          for(let k=0;k<6;k++)smoke(p.clone().add(_a.set(rf(-200,200),rf(0,100),rf(-200,200))),rf(500,900),7);if(typeof emitSprayAt==='function')emitSprayAt(p.x,p.z,220,260,1.6);}}}}

  /* ---------- the dropships ---------- */
  const DR=[];for(let i=0;i<8;i++){const g=new THREE.Group();g.add(new THREE.Mesh(DROPG.geo,dropMat),new THREE.Mesh(DROPG.glow,dropGlowMat));
    const e=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xb46aff).multiplyScalar(2.6),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));e.position.set(0,0,30);e.scale.setScalar(40);g.add(e);
    g.scale.setScalar(1.2);g.visible=false;scene.add(g);DR.push({g,pos:g.position,on:false,state:'idle',t:0,hp:0,c:null,lz:new THREE.Vector3(),S:new THREE.Vector3(),Cc:new THREE.Vector3(),H:new THREE.Vector3(),vel:new THREE.Vector3(),deployed:0,cmd:false,gunT:0,lastHit:-99,fx:0,spin:0});}
  const DHP=()=>Math.round(22*DIFF.tide.ehp);
  // landing spots: the Host's own (the core's rim and its parks), on the carrier's side of the city
  function pickLZ(c){const near=LZ.slice().sort((p,q)=>Math.abs(angDiff(Math.atan2(p.z,p.x),c.a))-Math.abs(angDiff(Math.atan2(q.z,q.x),c.a)));
    const busy=p=>DR.some(D=>D.on&&D.lz.distanceTo(p)<90);for(const p of near.slice(0,6).sort(()=>Math.random()-.5))if(!busy(p))return p;return near[0];}
  // a compass name for a direction from the city's centre (north is -z)
  const compass=a=>{const x=Math.cos(a),z=Math.sin(a),ns=z<0?'north':'south',ew=x>0?'east':'west';return Math.abs(x)<.4?ns:Math.abs(z)<.4?ew:ns+'-'+ew;};
  const angDiff=(a,b)=>((a-b+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
  function launchDrop(c){const D=DR.find(D=>!D.on);if(!D)return false;D.on=true;D.c=c;D.state='launch';D.t=0;D.hp=DHP();D.deployed=0;D.cmd=c.sorties%2===1;D.gunT=rf(2,4);D.g.visible=true;D.g.rotation.set(0,0,0);
    D.lz.copy(pickLZ(c));c.g.updateMatrixWorld();D.S.copy(c.g.localToWorld(_a.set(0,-140,60).clone()));D.pos.copy(D.S);
    D.H.copy(D.lz).setY(110);D.Cc.copy(D.S).lerp(D.H,.5).setY(D.S.y*.9);if(typeof sfx!=='undefined'&&sfx.horn)sfx.horn(D.S);
    if(!G.said.has('drop1')){say('drop1','Tide City Command','Dropship away from the '+c.name+'! It’s coming down on the ring road!','alert');}return true;}
  function killDrop(D,how){if(!D.on||D.state==='fall')return;D.state='fall';D.t=0;D.spin=rf(1.5,3)*(Math.random()<.5?-1:1);D.vel.set(rf(-40,40),-10,rf(-40,40));
    boom(D.pos,400,0xfff0c0,.4);boom(D.pos,700,0xb46aff,1);boom(D.pos,560,0xff6a1a,1.2);puff(D.pos,120,4);if(D.c)D.c.active=Math.max(0,D.c.active-1);
    if(how){G.n.drops++;PG.kill(600,D.pos,how);PG.prog('tstreetd');if(D.deployed===0)say('dropclean','Keeper Sergeant','Got it before it unloaded! Keep doing that!');}}
  function updateDrops(dt,now){
    for(const D of DR){if(!D.on)continue;D.t+=dt;
      if(D.state==='launch'){const u=Math.min(1,D.t/9);bez2(D.S,D.Cc,D.H,u,_a);_b.subVectors(_a,D.pos);D.pos.copy(_a);if(_b.lengthSq()>.01){_b.y*=.3;D.g.lookAt(_c.copy(D.pos).sub(_b));}
        if(u>=1){D.state='land';D.t=0;}}
      else if(D.state==='land'){const k=st(0,3,D.t);D.pos.lerpVectors(D.H,_a.copy(D.lz).setY(14),k);if(D.t>2.2&&Math.random()<dt*20)puff(_a.copy(D.lz).add(_b.set(rf(-40,40),2,rf(-40,40))),rf(20,40),2);
        if(D.t>=3){D.state='deploy';D.t=0;}}
      else if(D.state==='deploy'){const n=D.cmd?5:6;while(D.deployed<n&&D.t>D.deployed*.38){D.deployed++;spawnTroop(D.lz,D.cmd&&D.deployed===n);}
        if(D.deployed===1&&D.cmd)say('cmd1','Tide City Command','That one’s carrying a commander! Gold marker! Take him down and his squad falls apart!','alert');
        if(D.t>n*.38+.6){D.state='wait';D.t=0;}}
      else if(D.state==='wait'){D.gunT-=dt;if(D.gunT<=0&&PV.alive&&G.stage==='fight'){D.gunT=rf(1.4,2.2)/DIFF.tide.rof;if(D.pos.distanceTo(PV.pos)<620)shootAtYou(D.pos.clone().add(_a.set(0,-4,0)),'hbolt',1.6,.3);}
        if(D.t>6){D.state='out';D.t=0;D.E=D.c&&D.c.state==='hold'?D.c.g.localToWorld(_a.set(0,-140,60).clone()):D.pos.clone().add(_a.set(Math.cos(D.c?D.c.a:0)*3000,900,Math.sin(D.c?D.c.a:0)*3000).clone());D.O=D.pos.clone();}}
      else if(D.state==='out'||D.state==='flee'){if(D.state==='flee'&&!D.E2){D.E2=true;D.O=D.pos.clone();D.t=0;D.E=D.pos.clone().add(_a.set(D.pos.x,0,D.pos.z).normalize().multiplyScalar(3000).setY(900).clone());}
        const u=Math.min(1,D.t/9);D.pos.lerpVectors(D.O,D.E,st(0,1,u));_b.subVectors(D.E,D.O).setY(0);if(_b.lengthSq()>1)D.g.lookAt(_c.copy(D.pos).sub(_b));
        if(u>=1){D.on=false;D.g.visible=false;D.E2=false;if(D.c&&D.state==='out')D.c.active=Math.max(0,D.c.active-1);}}
      else if(D.state==='fall'){D.vel.y-=110*dt;D.pos.addScaledVector(D.vel,dt);D.g.rotation.z+=D.spin*dt;D.g.rotation.x+=D.spin*.3*dt;
        D.fx-=dt;if(D.fx<=0){D.fx=.06;boom(D.pos,rf(80,160),rp([0xff7a1a,0xb46aff,0xffb040]),.5);puff(D.pos,rf(60,100),3);}
        const gy=floorY(D.pos.x,D.pos.z);if(D.pos.y<gy+6){D.on=false;D.g.visible=false;const p=D.pos.clone().setY(gy+4);boom(p,800,0xfff0c0,.5);boom(p,1100,0xff6a1a,1.6);boom(p,800,0xb46aff,1.2);
          for(let i=0;i<4;i++)puff(p.clone().add(_a.set(rf(-40,40),rf(0,30),rf(-40,40))),rf(100,180),6);if(gy<=0&&typeof emitSprayAt==='function')emitSprayAt(p.x,p.z,60,120,1);
          for(const t of TR)if(t.on&&t.pos.distanceTo(p)<46)killTroop(t,'gun');
          if(PV.alive&&PV.pos.distanceTo(p)<50)hurtYou(12,p);}}}}
  const dropsOn=()=>DR.filter(D=>D.on&&D.state!=='fall').length;

  /* ---------- your guns ---------- */
  // what's under the crosshair: Host, dropships, carriers, else a tower, the ground or the sea
  function aim(maxD){const r=crosshairRay(),o=r.o,d=r.d;let best=maxD,hit=null;
    // start the ray at your machine, not the camera behind it (so nothing between the camera and you is hit)
    const skip=Math.max(0,_a.subVectors(PV.pos,o).dot(d));
    const sph=(p,R,obj)=>{_b.subVectors(p,o);const tc=_b.dot(d);if(tc<skip||tc>best)return;const d2=_b.lengthSq()-tc*tc;if(d2>R*R)return;const tt=tc-Math.sqrt(R*R-d2);if(tt<best){best=Math.max(skip,tt);hit=obj;}};
    for(const t of TR)if(t.on)sph(_c.copy(t.pos).setY(3+TROOP_S*1.4*(t.cmd?1.45:1)),t.cmd?16:12,{t});
    for(const D of DR)if(D.on&&D.state!=='fall')sph(D.pos,46,{D});
    for(const c of CAR)if(c.state==='hold'||c.state==='in')for(const p of carrierPts(c))sph(p,95,{c});
    const tw=towerRay(_d.copy(o).addScaledVector(d,skip),d,best-skip)+skip;if(tw<best){best=tw;hit=null;}
    if(d.y<-1e-3){const tg=(3-o.y)/d.y;if(tg>skip&&tg<best){const x=o.x+d.x*tg,z=o.z+d.z*tg;if(groundAt(x,z)!==null){best=tg;hit=null;}}const tw2=(0-o.y)/d.y;if(tw2>skip&&tw2<best){best=tw2;hit=null;}}
    return{point:o.clone().addScaledVector(d,best),hit,dist:best};}
  function applyHit(h,p,dmg,splash,how){
    if(h&&h.D){const D=h.D;if(!D.on||D.state==='fall')return;D.hp-=dmg;D.lastHit=performance.now()/1000;boom(p,dmg>2?160:70,0xfff1c8,.3);if(D.hp<=0)killDrop(D,how);return;}
    if(h&&h.c){hurtCarrier(h.c,dmg,p,how);return;}
    boom(p,splash*3,0xffe0b0,.3);if(p.y<8)puff(p,splash*1.2,1.2);
    for(const t of TR){if(!t.on)continue;const dd=Math.hypot(t.pos.x-p.x,t.pos.z-p.z);if(h&&h.t===t||dd<splash){t.hp-=h&&h.t===t?dmg:Math.max(1,dmg*.5);if(t.hp<=0)killTroop(t,how);else boom(p,40,0xffd27a,.2);}}}
  function muzzle(i,out){const m=PV.muz[i%PV.muz.length];if(m){m.getWorldPosition(out);return out;}
    // no bones: off the walker's arms / the skiff's roof
    const fx=-Math.sin(PV.yaw),fz=-Math.cos(PV.yaw),rx=Math.cos(PV.yaw),rz=-Math.sin(PV.yaw),s=i%2?1:-1;
    return PV.kind==='walker'?out.set(PV.pos.x+rx*s*7+fx*6,PV.pos.y+MECH_H*.55,PV.pos.z+rz*s*7+fz*6):out.set(PV.pos.x+rx*s*1.4+fx*8,PV.pos.y+8,PV.pos.z+rz*s*1.4+fz*8);}
  function weapons(dt){const K=KIND[PV.kind];PV.gunCool-=dt;PV.rkCool=Math.max(0,PV.rkCool-dt);
    if(!fireHeld||PV.gunCool>0||!PV.alive)return;PV.gunCool=K.gun;PV.side^=1;
    const A=aim(2600),from=muzzle(PV.side,new THREE.Vector3()),walker=PV.kind==='walker';
    if(walker){boom(from,26,0x9ff4ff,.12);fire(from,A.point,1300,'mech',p=>applyHit(A.hit,p,K.gunDmg,K.splash,'cannon'));}
    else{boom(from,10,0x9ff4ff,.06);fire(from,A.point,2600,'player',p=>applyHit(A.hit,p,K.gunDmg,K.splash,'gun'));}}
  // rockets: lock what's nearest the crosshair (carrier, dropship, commander)
  function lockTarget(){let best=null,bs=Math.cos(.32);
    for(const c of CAR)if(c.state==='hold'||c.state==='in'){const s=aimDot(c.g.position)+.002;if(s>bs){bs=s;best={c};}}
    for(const D of DR)if(D.on&&D.state!=='fall'){const s=aimDot(D.pos)+.01;if(s>bs){bs=s;best={D};}}
    for(const t of TR)if(t.on&&t.cmd){const s=aimDot(_a.copy(t.pos).setY(20))+.012;if(s>bs){bs=s;best={t};}}
    return best;}
  function rockets(){if(G.stage!=='fight'||!PV.alive||PV.rkCool>0||CUTS.on)return;const K=KIND[PV.kind];PV.rkCool=K.rk;const L=lockTarget();
    for(let k=0;k<K.rkN;k++)setTimeout(()=>{if(!PV.alive)return;const from=muzzle(k,new THREE.Vector3()).add(_a.set(0,PV.kind==='walker'?6:2,0));
      const cp=Math.cos(pitch),fwd=new THREE.Vector3(-Math.sin(yaw)*cp,Math.max(.25,Math.sin(pitch)+.3),-Math.cos(yaw)*cp).normalize();let tg=null,cb=null;
      if(L&&L.c){const c=L.c;tg={pos:()=>c.state==='hold'||c.state==='in'?c.g.position:null,hit:p=>carrierPts(c).some(q=>q.distanceTo(p)<110)};cb=p=>hurtCarrier(c,K.rkDmg,p,'missile');}
      else if(L&&L.D){const D=L.D;tg={pos:()=>D.on&&D.state!=='fall'?D.pos:null,hit:p=>p.distanceTo(D.pos)<50};cb=p=>applyHit({D},p,K.rkDmg,0,'missile');}
      else if(L&&L.t){const t=L.t;tg={pos:()=>t.on?_d.copy(t.pos).setY(12):null,hit:p=>Math.hypot(p.x-t.pos.x,p.z-t.pos.z)<18&&p.y<40};cb=p=>applyHit({t},p,K.rkDmg,30,'missile');}
      else{const A=aim(2600);const P=A.point.clone(),H=A.hit;tg={pos:()=>P,hit:p=>p.distanceTo(P)<14};cb=p=>applyHit(H,p,K.rkDmg,30,'missile');}
      fireMissile(from,fwd,1500,tg,cb);},k*120);}
  addEventListener('keydown',e=>{if(e.code==='KeyF'&&mode==='ground'&&!e.repeat)rockets();});
  cv.addEventListener('mousedown',e=>{if(e.button===0&&locked&&mode==='ground')rockets();});
  $('msl').addEventListener('pointerdown',e=>{if(mode==='ground'){e.preventDefault();rockets();}});

  /* ---------- driving ---------- */
  function drive(dt){const K=KIND[PV.kind];
    if(!PV.alive){PV.downT-=dt;placeCam(dt);if(PV.downT<=0)respawn();return;}
    let f=0,s=0;if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD)s+=1;if(keys.KeyA)s-=1;
    if(keys.ArrowLeft)yaw+=1.6*dt;if(keys.ArrowRight)yaw-=1.6*dt;
    f+=joy.y;s+=joy.x;const L=Math.hypot(f,s);if(L>1){f/=L;s/=L;}
    const boost=keys.ShiftLeft||keys.ShiftRight||Math.hypot(joy.x,joy.y)>.96,sp=boost?K.boost:K.speed;
    // camera-relative: push the stick where you want to go
    const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
    const tx=(fx*f+rx*s)*sp,tz=(fz*f+rz*s)*sp,a=1-Math.exp(-K.acc*dt);PV.vel.x+=(tx-PV.vel.x)*a;PV.vel.z+=(tz-PV.vel.z)*a;
    const nx=PV.pos.x+PV.vel.x*dt,nz=PV.pos.z+PV.vel.z*dt;
    if(clearFor(nx,nz,PV.r,K.water)){PV.pos.x=nx;PV.pos.z=nz;}
    else if(clearFor(nx,PV.pos.z,PV.r,K.water)){PV.pos.x=nx;PV.vel.z*=.3;}
    else if(clearFor(PV.pos.x,nz,PV.r,K.water)){PV.pos.z=nz;PV.vel.x*=.3;}
    else{const hit=PV.vel.length();PV.vel.multiplyScalar(-.25);if(PV.kind==='skiff'&&hit>120){boom(PV.pos.clone().setY(PV.pos.y+4),40,0xfff0c0,.25);flashBanner('Scraped a wall');}}
    const spd=Math.hypot(PV.vel.x,PV.vel.z),gy=floorY(PV.pos.x,PV.pos.z);
    if(PV.kind==='walker'){
      // the walker faces where you aim; its stride follows its speed
      PV.yaw=angLerp(PV.yaw,yaw,1-Math.exp(-dt*3.2));PV.stride+=spd*dt/24;const step=Math.sin(PV.stride*Math.PI*2);
      PV.pos.y+=(gy-PV.pos.y)*(1-Math.exp(-dt*10));PV.bob=Math.abs(step)*Math.min(1,spd/30)*1.4;
      PV.g.position.set(PV.pos.x,PV.pos.y+PV.bob,PV.pos.z);PV.g.rotation.set(0,PV.yaw,Math.sin(PV.stride*Math.PI*2)*Math.min(1,spd/40)*.03);
      if(PV.mix)PV.mix.update(dt*(.7+Math.min(1,spd/40)*.8));
      PV.legs.forEach((b,i)=>{b.quaternion.copy(PV.legBase[i]);const sw=Math.sin(PV.stride*Math.PI*2+(i?Math.PI:0))*Math.min(1,spd/30)*.32;_q.setFromAxisAngle(_a.set(1,0,0),sw);b.quaternion.multiply(_q);});
      if(spd>12&&Math.abs(step)<.12&&!PV.stomp){PV.stomp=true;puff(PV.pos.clone().setY(gy+2),14,1.2);}else if(Math.abs(step)>.3)PV.stomp=false;}
    else{
      // the skiff points where it's going (it can slide), hovers, and leans into turns; its gun pod turns to your aim
      const want=spd>8?Math.atan2(-PV.vel.x,-PV.vel.z):PV.yaw,turn=angDiff(want,PV.yaw);PV.yaw+=turn*(1-Math.exp(-dt*4));
      const hy=gy+3.2+Math.sin(performance.now()*.004)*.4;PV.pos.y+=(hy-PV.pos.y)*(1-Math.exp(-dt*8));
      PV.g.position.copy(PV.pos);PV.g.rotation.set(-clamp((tx*fx+tz*fz-(PV.vel.x*fx+PV.vel.z*fz))*.0006,-.06,.06),PV.yaw,clamp(-turn*.35,-.22,.22));
      if(PV.pod)PV.pod.rotation.y=angDiff(yaw,PV.yaw);
      for(const l of PV.lift)l.material.opacity=.7+.3*Math.sin(performance.now()*.02+l.position.x);
      if(gy<=0&&spd>60&&Math.random()<dt*30&&typeof emitSprayAt==='function')emitSprayAt(PV.pos.x,PV.pos.z,10,2,.5);}
    player.copy(PV.pos);vel.copy(PV.vel);
    placeCam(dt);}
  function placeCam(dt){const K=KIND[PV.kind],cp=Math.cos(pitch),fx=-Math.sin(yaw)*cp,fy=Math.sin(pitch),fz=-Math.cos(yaw)*cp;
    const tg=_a.set(PV.pos.x,PV.pos.y+K.camH,PV.pos.z);let dist=K.camD;
    // (Oct 25, Bryce: the third-person camera went inside towers and you saw through them) the whole city's solids (js/tide/08-player.js
    // solidAt: towers at their corners and tiers, low buildings, the spire towers, the Spear), sampled finely, 3 m short of the first;
    // it pulls in at once and eases back out
    const solid=typeof solidAt==='function'?(x,y,z)=>solidAt(x,y,z,3):inTower;if(typeof camGrid==='function')camGrid();
    for(let k=1;k<=18;k++){const u=k/18*K.camD,x=tg.x-fx*u,y=tg.y-fy*u,z=tg.z-fz*u;if(y<2||solid(x,y,z)){dist=Math.max(6,u-K.camD/18-3);break;}}
    PV.camD=PV.camD==null||dist<PV.camD?dist:Math.min(dist,PV.camD+dt*K.camD*.6);dist=PV.camD;
    camera.position.set(tg.x-fx*dist,Math.max(3,tg.y-fy*dist),tg.z-fz*dist);
    // a little shake when the walker plants a foot
    if(PV.kind==='walker'&&!reduceMotion)camera.position.y+=PV.bob*.25;
    camera.rotation.set(pitch,yaw,0);camera.updateMatrixWorld();}

  /* ---------- the HUD while you're on the ground ---------- */
  function enterGround(){mode='ground';manned=null;pShip.visible=false;walkMode=false;glide=0;PV.g.visible=true;
    $('fire').hidden=!coarse;$('msl').hidden=!coarse;$('msl').textContent=PV.kind==='walker'?'RKT':'MSL';$('ret').hidden=false;$('gun').hidden=true;$('vbtns').hidden=true;
    tideP.shield=100;tideP.hull=100;}
  function leaveGround(){PV.g.visible=false;$('msl').textContent='MSL';$('vbtns').hidden=!coarse;mode='free';}
  function objective(){const left=CAR.filter(c=>c.state==='hold'||c.state==='in').length,tr=troopsOn(),dr=dropsOn();
    if(G.stage==='clear')return'The core is clear · the Vigil is due';
    return(left?'Bring down the Hollow carriers · '+left+' left':'Clear the core platform')+(dr||tr?' · '+(dr?dr+' dropship'+(dr===1?'':'s'):'')+(dr&&tr?', ':'')+(tr?tr+' Host on the ground':''):'');}

  /* ---------- the run ---------- */
  function startFight(){G.stage='fight';G.fightT=0;enterGround();
    const s=spawnSpot(CAR[0].a-.32);PV.pos.set(s.x,floorY(s.x,s.z),s.z);PV.vel.set(0,0,0);PV.alive=true;
    // facing the first carrier, out over the sea
    yaw=Math.atan2(-(CAR[0].home.x-s.x),-(CAR[0].home.z-s.z));PV.yaw=yaw;pitch=.28;
    if(typeof sfx!=='undefined'&&sfx.score)sfx.score('tense');
    flashBanner(coarse?'Left thumb drives · right thumb aims · hold FIRE · '+(PV.kind==='walker'?'RKT':'MSL'):'WASD drive · mouse aim · right-click fire · F or left-click '+(PV.kind==='walker'?'rockets':'missiles')+' · Shift boost');}
  function update(dt,t){if(G.stage==='off')return;G.t+=dt;const now=performance.now()/1000;
    updateCarriers(dt,t);updateDrops(dt,now);updateTroops(dt,now);
    if(G.stage==='fight'){G.fightT+=dt;
      // the carriers come in one after another (or as soon as the one before is beaten down)
      const [c0,c1,c2]=CAR;if(c0.state==='off')arriveCarrier(c0);
      if(c1.state==='off'&&(G.fightT>75||c0.state==='fall'||c0.state==='dead'||(c0.hp<c0.max*.4&&G.fightT>25))){arriveCarrier(c1);PG.say('Tide City Command','Second carrier! Coming down over the '+compass(c1.a)+' harbor!','alert');}
      if(c2.state==='off'&&c1.state!=='off'&&(G.fightT>160||((c1.state==='fall'||c1.state==='dead')&&G.fightT>40))){arriveCarrier(c2);PG.say('Tide City Command','Third carrier! The Ninth Mouth, over the '+compass(c2.a)+' harbor!','alert');}
      // radio
      if(G.fightT>4)say('go','Keeper Sergeant','Warden Six, the plinth guard can hold the Spear. Everything else on this platform is yours.');
      if(G.fightT>40&&!G.n.drops)say('hint1','Tide City Command','Hit the dropships before they unload! They sit on the ring road while they empty!','alert');
      if(G.fightT>90&&!G.n.carriers)say('hint2','Tide City Command',PV.kind==='skiff'?'Missiles on the carriers! Lock them up and let fly!':'Rockets on the carrier! Get under her and hit her keel!','alert');
      if(c2.state==='hold'&&c2.hp<c2.max*.3)say('last','Keeper Sergeant','She’s coming apart! Finish her!','alert');
      const allDown=CAR.every(c=>c.state==='fall'||c.state==='dead');
      if(allDown&&!dropsOn()&&!troopsOn()){G.stage='clear';G.clearT=0;
        if(!G.breached)PG.done('tstreet');if(!G.wentDown)PG.add(1500,null,'Warden Six held');
        PG.say('Tide City Command','The core is clear. Warden Six, that was the Hollow King’s, and he’ll be back. Stand by. The Vigil is due any minute.','',6);}
      else if(allDown&&!G.said.has('mop')&&(dropsOn()||troopsOn()))say('mop','Tide City Command','Carriers are down! Clear what’s left on the core!','alert');}
    if(G.stage==='fight'||G.stage==='clear'){
      if(G.stage==='clear'){G.clearT+=dt;if(G.clearT>8&&!CUTS.on)handOff();}}}
  // the end of the ground war: the old opening (the Vigil inbound, the Spear lit), then the battle as it always ran
  function handOff(){G.stage='handoff';fireHeld=false;
    CUTS.play([
      {dur:6,cam:[[PV.pos.x+(PV.kind==='walker'?60:30),PV.pos.y+(PV.kind==='walker'?40:14),PV.pos.z+(PV.kind==='walker'?90:45)],[PV.pos.x+(PV.kind==='walker'?90:45),PV.pos.y+(PV.kind==='walker'?70:24),PV.pos.z+(PV.kind==='walker'?140:70)]],look:[[PV.pos.x,PV.pos.y+(PV.kind==='walker'?24:5),PV.pos.z],[PV.pos.x,PV.pos.y+(PV.kind==='walker'?30:8),PV.pos.z]],
        say:[[.6,'Keeper Sergeant','Smoke on every side of the core... but she’s standing. Good work, Warden Six.'],[0,'Tide City Command','Slipscape flash! North-east! It’s the Vigil... and she’s not alone!','alert']],
        fn:(t,dt)=>{if(PV.mix)PV.mix.update(dt*.7);}},
    ],{score:'tense',done:()=>{G.stage='off';G.on=false;leaveGround();for(const t of TR)t.on=false;for(const D of DR){D.on=false;D.g.visible=false;}
      // the old opening, without its own fleet call yet (battles is still 0, so it plays in full)
      _openingCut();}});}

  /* ---------- the start: the carriers come in, you pick your machine, and go ---------- */
  function introCut(done){const c=CAR[0],T0=SPEAR_TOP;arriveCarrier(c);c.launchT=99;
    CUTS.play([
      // from the ring road, looking out over the harbor: she comes down through the clouds
      {dur:8,cam:[[c.home.x*.58-c.home.z*.12,30,c.home.z*.58+c.home.x*.12],[c.home.x*.6-c.home.z*.1,46,c.home.z*.6+c.home.x*.1]],lookAt:(u,t,o)=>o.copy(c.g.position).add(_d.set(0,-40,0)),small:'Last Transmission · Tide City',cap:'The Empty Sky',
        say:[[1.2,'Tide City Command','Contact! Something just came down through the cloud deck over the '+compass(c.a)+' harbor. No Slipscape flash. It came in low, over the sea.','alert'],
             [0,'Keeper Sergeant','Purple hull. Command, that’s one of his.','alert']]},
      {dur:7,camAt:(u,t,o)=>o.set(c.g.position.x*.55,90+u*30,c.g.position.z*.55),lookAt:(u,t,o)=>o.copy(c.g.position).add(_d.set(0,-60,0)),
        say:[[.4,'Tide City Command','Carrier, holding over the harbor. Bay doors open... dropships! They’re putting the Empty Host on the core platform!','alert'],
             [0,'Tide City Command','Warden Six, you’re the only heavy unit on the core. The sea guns can’t surface yet. It’s on you.','alert']],
        fn:(t,dt)=>{if(t>3.5&&!introCut.d&&c.state==='hold'){introCut.d=1;c.launchT=99;if(launchDrop(c)){c.sorties++;c.active++;}}}},
      {dur:5,cam:[[SPEAR.x+340,120,SPEAR.z+260],[SPEAR.x+260,160,SPEAR.z+200]],look:[[T0.x,T0.y*.4,T0.z],[T0.x,T0.y*.6,T0.z]],
        say:[[.3,'Keeper Sergeant','Guard to the plinth! Nobody touches the Spear!'],[0,'Tide City Command','The Vigil is due home within the hour. This sky needs to be clear before she drops out.']]},
    ],{score:'tense',done:()=>{if(!introCut.d&&c.state!=='off'){c.state='hold';if(launchDrop(c)){c.sorties++;c.active++;}}introCut.d=0;c.launchT=rf(5,8);done();}});}
  function pickCard(done){const el=document.createElement('div');el.className='pgend pgbrief';
    el.innerHTML=`<div class="card"><h2>WARDEN SIX</h2><p>Three Hollow carriers are putting the Empty Host on the core platform. Take a machine and break them before the Vigil comes home.</p>
      <div class="row"><button type="button" class="primary" id="pkW">Walker</button><button type="button" class="primary" id="pkS">Gun-skiff</button></div>
      <p style="font-size:.86em;opacity:.8;margin-top:10px"><b>Walker</b> · slow, heavy armour, plasma casters that blow troopers apart, a rocket rack. <b>Gun-skiff</b> · fast hover car, twin pulse guns, homing missiles, and it can cross the water.</p></div>`;
    document.body.appendChild(el);PG.paused=true;try{if(document.exitPointerLock)document.exitPointerLock();}catch(_){}
    const go=k=>{el.remove();PG.paused=false;G.kind=k;mountKind(k);done();};
    el.querySelector('#pkW').addEventListener('click',()=>go('walker'));el.querySelector('#pkS').addEventListener('click',()=>go('skiff'));}
  function deployCut(done){
    const s=spawnSpot(CAR[0].a-.32);PV.pos.set(s.x,floorY(s.x,s.z),s.z);PV.yaw=Math.atan2(-(CAR[0].home.x-s.x),-(CAR[0].home.z-s.z));PV.g.visible=true;
    PV.g.position.copy(PV.pos);PV.g.rotation.set(0,PV.yaw,0);const fx=-Math.sin(PV.yaw),fz=-Math.cos(PV.yaw),H=PV.kind==='walker'?MECH_H:8;
    CUTS.play([
      {dur:5,cam:[[PV.pos.x+fx*70-fz*40,PV.pos.y+H*.5,PV.pos.z+fz*70+fx*40],[PV.pos.x+fx*55-fz*25,PV.pos.y+H*.7,PV.pos.z+fz*55+fx*25]],look:[[PV.pos.x,PV.pos.y+H*.6,PV.pos.z]],
        say:[[.5,'Warden Six',PV.kind==='walker'?'Walker’s up. Casters hot. Moving.':'Skiff’s up. Guns hot. Moving.'],[0,'Tide City Command','Copy, Warden Six. Dropship on the ring road ahead of you. Go!','alert']],
        fn:(t,dt)=>{PV.g.position.copy(PV.pos);if(PV.mix)PV.mix.update(dt*.8);}},
    ],{score:'tense',done:()=>{startFight();done&&done();}});}
  function begin(){G.on=true;G.stage='intro';G.t=0;G.lost=0;G.said=new Set();G.breached=false;G.wentDown=false;G.n={troops:0,cmd:0,drops:0,carriers:0};
    for(const c of CAR){c.state='off';c.g.visible=false;c.half=false;}for(const D of DR){D.on=false;D.g.visible=false;}for(const t of TR)t.on=false;
    introCut(()=>{G.stage='pick';pickCard(()=>{G.stage='deploy';deployCut();});});}

  /* ---------- hooks ---------- */
  const _openingCut=openingCut;
  openingCut=function(){if(battles>0||G.done){_openingCut();return;}G.done=true;begin();};
  openingCut.noTitle=true;   // (read by the old opening: the title card already showed at the start of the streets)
  const _step=step;step=function(dt){if(mode==='ground'){drive(dt);return;}_step(dt);};
  const _pw=playerWeapons;playerWeapons=function(dt){if(mode==='ground'){if(G.stage==='fight'||G.stage==='clear')weapons(dt);return;}_pw(dt);};
  const _dir=director;director=function(dt,t){_dir(dt,t);update(dt,t);};
  const _tt=tideTick;tideTick=function(dt){_tt(dt);
    if(!G.on)return;
    if(G.stage==='fight'||G.stage==='clear'){PG.objective(objective());PG.combat(G.stage==='fight');
      if(!PG.paused&&PV.alive&&performance.now()/1000-tideP.lastHit>4)tideP.shield=Math.min(100,tideP.shield+dt*7);
      const K=KIND[PV.kind]||KIND.walker;
      SHUD.update({shield:PV.alive?tideP.shield:0,hull:PV.alive?tideP.hull:0,zeal:0,zealText:'offline',zealReady:false,mslReady:1-PV.rkCool/K.rk,speed:Math.hypot(PV.vel.x,PV.vel.z)/7,unit:'M/S',
        extra:K.name+' · CITY '+Math.max(0,Math.round(100-G.lost))+'%',down:!PV.alive});
      if(typeof sfx!=='undefined'&&sfx.engine)sfx.engine(PV.kind==='skiff'?Math.hypot(PV.vel.x,PV.vel.z)/300:0,false,PV.kind==='skiff'&&PV.alive&&!CUTS.on);}
    else PG.objective(G.stage==='pick'?'Choose your machine':'');};
  const _ub=updateBanner;updateBanner=function(id,pt){if(!G.on){_ub(id,pt);return;}
    let txt,cls='alert';const left=CAR.filter(c=>c.state==='hold'||c.state==='in').length;
    if(G.stage==='clear'||G.stage==='handoff'){txt='Core platform clear · the Vigil is due';cls='shield';}
    else if(!PV.alive&&G.stage==='fight'){txt='Warden Six down · relaunching';}
    else txt='Hollow carriers over Tide City · '+left+' in the sky';
    if(performance.now()<flashUntil){txt=flashTxt;cls='guns';}
    const key=txt+cls;if(key!==bannerKey){bannerKey=key;bannerEl.textContent=txt;bannerEl.className='hud banner '+cls;}attackBtn.hidden=true;};
  const _ln=layerName;layerName=function(y){if(mode==='ground')return'Warden Six · '+(PV.kind==='walker'?'walker':'gun-skiff')+(PV.pos.y<1?' · on the water':' · street level');return _ln(y);};
  const _te=tagsEnd;tagsEnd=function(){if(G.on&&(G.stage==='fight'||G.stage==='clear')){const now=performance.now()/1000;
      for(const c of CAR)if((c.state==='hold'||c.state==='in')&&(now-c.lastHit<4||aimDot(c.g.position)>.985))tagShip(c,c.g.localToWorld(_a.set(0,260,0).clone()),'Hollow carrier “'+c.name+'”',c.hp/c.max,true,true,now-c.lastHit<.12);
      for(const D of DR)if(D.on&&D.state!=='fall'&&(now-D.lastHit<4||aimDot(D.pos)>.993))tagShip(D,_a.copy(D.pos).add(_b.set(0,40,0)).clone(),'Empty Host dropship',D.hp/DHP(),true,true,now-D.lastHit<.12);}
    _te();};
  // what got through comes off the city's integrity before the battle starts
  const _cf=callFleet;callFleet=function(){const was=PH[ph].id==='calm';_cf();if(was&&G.lost>0){cityHP=Math.max(70,100-G.lost);cityLow=cityHP;if(G.lost>=5)setTimeout(()=>flashBanner('The Host left their mark · city integrity '+Math.round(cityHP)+'%'),9000);}};

  // challenges for this part
  try{TIDE_CHAL.unshift({id:'tcarrier',text:'Bring down all three Hollow carriers',pts:2500,goal:3},{id:'tstreet',text:'No Host reaches the plinth before the Vigil arrives',pts:2000},{id:'tstreetd',text:'Down 6 dropships on the streets',pts:1500,goal:6});
    PG.init('tide',{challenges:TIDE_CHAL});}catch(e){console.warn('streets chal',e);}

  return{G,PV,CAR,DR,TR,begin,startFight,mountKind,flatModel,aim,muzzle,lockTarget,arriveCarrier,hurtCarrier,killDrop,killTroop};
})();
