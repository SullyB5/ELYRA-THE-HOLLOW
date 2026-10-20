/* Elyra shared combat: ship hulls for collision and hit tests, ship name/HP tags, player homing missiles,
   damage fires, crosshair aim. Needs core.js, fx.js and page globals `scene`, `camera`, `glow`. */

/* ---------- hulls: a ship's merged geometry sliced along its length into boxes ---------- */
// Each slice box wraps the triangles that cross it, so the hull follows the ship's outline instead of one big box.
function buildHull(geo,slices,shrink,xbins){
  if(xbins)return buildHull2(geo,slices,shrink,xbins);
  geo.computeBoundingBox();const bb=geo.boundingBox,n=slices||10,z0=bb.min.z,dz=(bb.max.z-z0)/n,k=shrink||.9;
  const S=[];for(let i=0;i<n;i++)S.push([1e9,-1e9,1e9,-1e9]);
  const P=geo.attributes.position.array,I=geo.index?geo.index.array:null,cnt=I?I.length:P.length/3;
  for(let t=0;t<cnt;t+=3){
    const a=(I?I[t]:t)*3,b=(I?I[t+1]:t+1)*3,c=(I?I[t+2]:t+2)*3;
    const zmn=Math.min(P[a+2],P[b+2],P[c+2]),zmx=Math.max(P[a+2],P[b+2],P[c+2]);
    const xmn=Math.min(P[a],P[b],P[c]),xmx=Math.max(P[a],P[b],P[c]),ymn=Math.min(P[a+1],P[b+1],P[c+1]),ymx=Math.max(P[a+1],P[b+1],P[c+1]);
    const i0=clamp(Math.floor((zmn-z0)/dz),0,n-1),i1=clamp(Math.floor((zmx-z0)/dz),0,n-1);
    for(let i=i0;i<=i1;i++){const s=S[i];if(xmn<s[0])s[0]=xmn;if(xmx>s[1])s[1]=xmx;if(ymn<s[2])s[2]=ymn;if(ymx>s[3])s[3]=ymx;}
  }
  const boxes=[];let R2=0;
  for(let i=0;i<n;i++){const s=S[i];if(s[0]>s[1])continue;
    const c=new THREE.Vector3((s[0]+s[1])/2,(s[2]+s[3])/2,z0+dz*(i+.5)),h=new THREE.Vector3((s[1]-s[0])/2*k,(s[3]-s[2])/2*k,dz/2);
    boxes.push({c,h});R2=Math.max(R2,c.length()+h.length());}
  return{boxes,R:R2};
}
// finer hull: slices along the length, and in each slice separate boxes for each solid run across the width
function buildHull2(geo,slices,shrink,xb){
  geo.computeBoundingBox();const bb=geo.boundingBox,n=slices,z0=bb.min.z,dz=(bb.max.z-z0)/n,x0=bb.min.x,dx=(bb.max.x-x0)/xb,k=shrink||.9;
  const G=[];for(let i=0;i<n*xb;i++)G.push([1e9,-1e9,1e9,-1e9]);   // per cell: x min/max, y min/max
  const P=geo.attributes.position.array,I=geo.index?geo.index.array:null,cnt=I?I.length:P.length/3;
  for(let t=0;t<cnt;t+=3){
    const a=(I?I[t]:t)*3,b=(I?I[t+1]:t+1)*3,c=(I?I[t+2]:t+2)*3;
    const zmn=Math.min(P[a+2],P[b+2],P[c+2]),zmx=Math.max(P[a+2],P[b+2],P[c+2]),xmn=Math.min(P[a],P[b],P[c]),xmx=Math.max(P[a],P[b],P[c]);
    const ymn=Math.min(P[a+1],P[b+1],P[c+1]),ymx=Math.max(P[a+1],P[b+1],P[c+1]);
    const i0=clamp(Math.floor((zmn-z0)/dz),0,n-1),i1=clamp(Math.floor((zmx-z0)/dz),0,n-1),j0=clamp(Math.floor((xmn-x0)/dx),0,xb-1),j1=clamp(Math.floor((xmx-x0)/dx),0,xb-1);
    for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const s=G[i*xb+j];
      const cx0=Math.max(xmn,x0+j*dx),cx1=Math.min(xmx,x0+(j+1)*dx);if(cx0<s[0])s[0]=cx0;if(cx1>s[1])s[1]=cx1;if(ymn<s[2])s[2]=ymn;if(ymx>s[3])s[3]=ymx;}
  }
  const boxes=[];let R2=0;
  for(let i=0;i<n;i++){let j=0;
    while(j<xb){if(G[i*xb+j][0]>G[i*xb+j][1]){j++;continue;}
      let xa=1e9,xz=-1e9,ya=1e9,yz=-1e9;while(j<xb&&G[i*xb+j][0]<=G[i*xb+j][1]){const s=G[i*xb+j];xa=Math.min(xa,s[0]);xz=Math.max(xz,s[1]);ya=Math.min(ya,s[2]);yz=Math.max(yz,s[3]);j++;}
      const c=new THREE.Vector3((xa+xz)/2,(ya+yz)/2,z0+dz*(i+.5)),h=new THREE.Vector3((xz-xa)/2*k,(yz-ya)/2*k,dz/2*.95);
      boxes.push({c,h});R2=Math.max(R2,c.length()+h.length());}}
  return{boxes,R:R2};
}
// a collider ties a hull to a live object; `on` can switch it off (sunk, hidden, exploded)
function collider(obj,hull,on){return{obj,boxes:hull.boxes,R:hull.R,on:on||null};}
const _ci=new THREE.Matrix4(),_cl=new THREE.Vector3(),_cn=new THREE.Vector3(),_cw=new THREE.Vector3();
function colScale(o){return _cw.setFromMatrixColumn(o.matrixWorld,0).length();}
function colLive(C){return C.obj.visible&&(!C.on||C.on());}
// push a sphere (pos, radius) out of every hull it overlaps; returns the speed it was moving into the hull (0 if no contact)
function collideHulls(pos,vel,radius,list){
  let impact=0;
  for(const C of list){
    if(!colLive(C))continue;const o=C.obj;
    // ships are direct children of the scene, so position and scale are already world values
    const s=o.scale.x;if(!(s>1e-4)||!isFinite(o.position.x+o.position.y+o.position.z))continue;   // never push against a ship with no valid place
    if(pos.distanceTo(o.position)>C.R*s+radius)continue;o.updateMatrixWorld();
    _ci.copy(o.matrixWorld).invert();_cl.copy(pos).applyMatrix4(_ci);const r=radius/s;let moved=false;
    for(const b of C.boxes){
      const dx=_cl.x-b.c.x,dy=_cl.y-b.c.y,dz=_cl.z-b.c.z;
      const px=b.h.x+r-Math.abs(dx),py=b.h.y+r-Math.abs(dy),pz=b.h.z+r-Math.abs(dz);
      if(px<=0||py<=0||pz<=0)continue;
      if(px<py&&px<pz)_cl.x+=Math.sign(dx||1)*px;else if(py<pz)_cl.y+=Math.sign(dy||1)*py;else _cl.z+=Math.sign(dz||1)*pz;
      moved=true;
    }
    if(!moved)continue;
    _cl.applyMatrix4(o.matrixWorld);_cn.subVectors(_cl,pos);const L=_cn.length();pos.copy(_cl);
    if(L>1e-6&&vel){_cn.divideScalar(L);const vn=vel.dot(_cn);if(vn<0){impact=Math.max(impact,-vn);vel.addScaledVector(_cn,-vn*1.25);}}
  }
  return impact;
}
// is a world point inside a hull (with a margin in world units)?
function hullContains(C,p,margin){
  if(!colLive(C))return false;const o=C.obj,s=o.scale.x;
  if(p.distanceTo(o.position)>C.R*s+(margin||0))return false;o.updateMatrixWorld();
  _ci.copy(o.matrixWorld).invert();_cl.copy(p).applyMatrix4(_ci);const m=(margin||0)/s;
  for(const b of C.boxes)if(Math.abs(_cl.x-b.c.x)<b.h.x+m&&Math.abs(_cl.y-b.c.y)<b.h.y+m&&Math.abs(_cl.z-b.c.z)<b.h.z+m)return true;
  return false;
}
// ray against a hull: distance along the ray or -1
function hullRay(C,o,d,maxD){
  if(!colLive(C))return -1;const ob=C.obj,s=ob.scale.x;
  _cn.copy(ob.position);const tc=_cw.subVectors(_cn,o).dot(d),d2=_cw.lengthSq()-tc*tc,Rw=C.R*s;
  if(d2>Rw*Rw||tc<-Rw||tc-Rw>maxD)return -1;
  ob.updateMatrixWorld();_ci.copy(ob.matrixWorld).invert();const lo=_cl.copy(o).applyMatrix4(_ci),le=_cw.copy(o).addScaledVector(d,maxD).applyMatrix4(_ci).sub(lo);
  let best=2;
  for(const b of C.boxes){let t0=0,t1=1,ok=true;
    for(const ax of['x','y','z']){const oa=lo[ax]-b.c[ax],da=le[ax],h=b.h[ax];
      if(Math.abs(da)<1e-9){if(Math.abs(oa)>h){ok=false;break;}continue;}
      let a=(-h-oa)/da,e=(h-oa)/da;if(a>e){const q=a;a=e;e=q;}t0=Math.max(t0,a);t1=Math.min(t1,e);if(t0>t1){ok=false;break;}}
    if(ok&&t0<best)best=t0;}
  return best<=1?best*maxD:-1;
}
// a random point on a hull's skin, in the object's local frame (for fires and hit sparks)
function hullPoint(C){const b=pick(C.boxes),f=new THREE.Vector3(R(-1,1),R(-.2,1),R(-1,1));
  const ax=pick(['x','y','y','x']);f[ax]=Math.sign(f[ax]||1);return new THREE.Vector3(b.c.x+f.x*b.h.x,b.c.y+f.y*b.h.y,b.c.z+f.z*b.h.z);}

/* ---------- damage you can see: fires break out as a ship loses HP ---------- */
const FIRE_STEPS=[.8,.6,.45,.3,.15];
function damageFires(ship,C,frac){
  ship.fires=ship.fires||[];
  while(ship.fires.length<FIRE_STEPS.length&&frac<FIRE_STEPS[ship.fires.length]){
    const lp=hullPoint(C);ship.fires.push(lp);
    const w=C.obj.localToWorld(lp.clone());boom(w,colScale(C.obj)*R(120,220),0xfff0c0,.5);boom(w,colScale(C.obj)*R(200,320),0xff6a1a,1.2);
  }
}
const _cfw=new THREE.Vector3();
function updateFires(dt,ships,getC){
  for(const sh of ships){if(!sh.fires||!sh.fires.length)continue;const C=getC(sh);if(!C||!C.obj.visible)continue;const s=colScale(C.obj);
    for(const lp of sh.fires){if(rng()<dt*5){C.obj.localToWorld(_cfw.copy(lp));boom(_cfw,s*R(40,90),pick([0xff7a1a,0xff4a10,0xffb040]),R(.4,.8));}
      if(rng()<dt*4){C.obj.localToWorld(_cfw.copy(lp));puff(_cfw,s*R(60,110),R(3,5));}}}
}

/* ---------- ship tags: name and HP above a ship when you look at or shoot it ---------- */
(function(){const st=document.createElement('style');st.textContent=`
.shiptag{position:fixed;left:0;top:0;z-index:2;pointer-events:none;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:3px;
  font:600 10px/1 'JetBrains Mono',ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#bfe9ff;text-shadow:0 1px 3px rgba(0,0,0,.9);white-space:nowrap;transition:opacity .25s}
.shiptag.hostile{color:#ff8a7a}.shiptag .hb{width:96px;height:4px;background:rgba(0,0,0,.55);border:1px solid rgba(160,210,255,.4);border-radius:2px;overflow:hidden}
.shiptag.hostile .hb{border-color:rgba(255,120,110,.5)}.shiptag .hb i{display:block;height:100%;background:#7fe3ff;transition:width .15s}
.shiptag.hostile .hb i{background:#ff5a4a}.shiptag .hp{font-size:9px;opacity:.8}.shiptag.hit .hb{box-shadow:0 0 8px #fff}
.aimx{position:fixed;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border:1.5px solid rgba(230,246,255,.85);border-radius:50%;z-index:2;pointer-events:none}
.aimx::after{content:"";position:absolute;left:50%;top:50%;width:3px;height:3px;margin:-1.5px 0 0 -1.5px;background:#fff;border-radius:50%}
.msl{position:fixed;z-index:3;pointer-events:none;font:700 10px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;color:#ffd27a;text-shadow:0 1px 3px #000}
.lockbox{position:fixed;left:0;top:0;width:54px;height:54px;margin:-27px 0 0 -27px;border:2px solid #ffd27a;transform:rotate(45deg);z-index:2;pointer-events:none;transition:opacity .15s}
`;document.head.appendChild(st);})();
const tags=new Map();const _tp=new THREE.Vector3();let tagFrame=0;
function tagShip(key,worldPos,name,frac,hostile,showHp,hitFlash){
  let t=tags.get(key);
  if(!t){const el=document.createElement('div');el.className='shiptag';el.innerHTML='<span class="nm"></span><span class="hb"><i></i></span><span class="hp"></span>';
    document.body.appendChild(el);t={el,nm:el.children[0],hb:el.children[1],fill:el.children[1].firstChild,hp:el.children[2],name:'',f:-1};tags.set(key,t);}
  t.frame=tagFrame;
  _tp.copy(worldPos).project(camera);
  if(_tp.z>1||Math.abs(_tp.x)>1.1||Math.abs(_tp.y)>1.1){t.el.style.opacity=0;return;}
  t.el.style.opacity=1;t.el.style.transform=`translate(${(_tp.x*.5+.5)*innerWidth}px,${(-_tp.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;
  if(t.name!==name){t.name=name;t.nm.textContent=name;}
  t.el.classList.toggle('hostile',!!hostile);t.el.classList.toggle('hit',!!hitFlash);
  t.hb.hidden=t.hp.hidden=!showHp;
  if(showHp){const f=Math.round(clamp(frac,0,1)*100);if(f!==t.f){t.f=f;t.fill.style.width=f+'%';t.hp.textContent=f+'% hull';}}
}
function tagsBegin(){tagFrame++;}
function tagsEnd(){for(const [k,t] of tags)if(t.frame!==tagFrame){t.el.remove();tags.delete(k);}}
// how close an object sits to the crosshair: 1 = dead centre
function aimDot(p){_tp.subVectors(p,camera.position).normalize();return _tp.dot(camera.getWorldDirection(_cw));}

/* ---------- crosshair aim: shots converge where the crosshair points ---------- */
// the camera sits behind and above the ship, so firing straight ahead from the guns lands above the crosshair
const _ad=new THREE.Vector3();
function crosshairRay(){return{o:camera.position.clone(),d:camera.getWorldDirection(_ad).clone()};}

/* ---------- player homing missiles ---------- */
const mslGeo=new THREE.CylinderGeometry(1.1,1.4,9,8).rotateX(Math.PI/2);
const mslMat=new THREE.MeshStandardMaterial({color:C(0xe8ecf2),roughness:.4,metalness:.5});
const PMS=[];
// target: {pos():Vector3|null, hit(p):bool, onHit(p)} — pos() returning null means the target is gone
function fireMissile(from,dir,speed,target,dmgCb){
  let m=PMS.find(m=>!m.on);
  if(!m){if(PMS.length>=24)return;const mesh=new THREE.Mesh(mslGeo,mslMat),fl=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:C(0xffc070).multiplyScalar(3),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    fl.scale.setScalar(22);mesh.add(fl);fl.position.z=6;scene.add(mesh);m={mesh,pos:mesh.position,vel:new THREE.Vector3()};PMS.push(m);}
  m.on=true;m.t=0;m.mesh.visible=true;m.pos.copy(from);m.vel.copy(dir).normalize().multiplyScalar(speed*.45);m.speed=speed;m.target=target;m.cb=dmgCb;m.pt=0;
  boom(from,40,0xffd27a,.2);
}
const _cmd=new THREE.Vector3();
function updateMissilesP(dt,ground){
  for(const m of PMS){if(!m.on)continue;m.t+=dt;
    const tp=m.target&&m.target.pos();
    if(tp){_cmd.subVectors(tp,m.pos).normalize();const v=m.vel.length();m.vel.normalize().lerp(_cmd,1-Math.exp(-dt*(m.t<.25?1:4.5))).normalize().multiplyScalar(Math.min(m.speed,v+m.speed*1.6*dt));}
    else m.vel.setLength(Math.min(m.speed,m.vel.length()+m.speed*1.6*dt));
    m.pos.addScaledVector(m.vel,dt);m.mesh.lookAt(_cmd.copy(m.pos).sub(m.vel));
    m.pt-=dt;if(m.pt<=0){m.pt=.03;puff(m.pos,9,1.4);}
    let boomIt=m.t>7||(ground!=null&&m.pos.y<ground);
    if(!boomIt&&tp&&m.target.hit(m.pos)){boomIt=true;if(m.cb)m.cb(m.pos.clone());}
    if(boomIt){m.on=false;m.mesh.visible=false;boom(m.pos,180,0xfff0c0,.35);boom(m.pos,320,0xff7a26,.9);puff(m.pos,60,3);}
  }
}

/* ---------- PC target panel: the ship you are fighting, big and readable at the top centre ---------- */
// phones keep the small floating tags; on a mouse-and-keyboard screen the hull bar moves here
(function(){const st=document.createElement('style');st.textContent=`
.tbar{position:fixed;z-index:3;left:50%;top:var(--tbar-top,66px);transform:translateX(-50%);width:min(560px,60vw);pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:5px;
  opacity:0;transition:opacity .25s;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;color:#eef4ff;text-shadow:0 1px 6px rgba(0,0,0,.9)}
.tbar.on{opacity:1}
.tbar .k{font:700 10px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.34em;text-transform:uppercase;color:#ff7a6a}
.tbar.friend .k{color:#7fe3ff}
.tbar .n{font:700 22px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.14em;text-transform:uppercase}
.tbar .row{display:flex;align-items:center;gap:12px;width:100%}
.tbar .bar{position:relative;flex:1;height:16px;background:rgba(10,4,8,.7);border:1px solid rgba(255,110,100,.55);clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%);
  box-shadow:inset 0 0 12px rgba(0,0,0,.8)}
.tbar.friend .bar{border-color:rgba(127,227,255,.55)}
.tbar .bar i{position:absolute;left:0;top:0;bottom:0;transition:width .08s linear}
.tbar .bar .tr{background:rgba(255,240,220,.85)}
.tbar .bar .fl{background:linear-gradient(180deg,#ff8a6a,#d8261c 60%,#8a1010)}
.tbar.friend .bar .fl{background:linear-gradient(180deg,#bff4ff,#3ab8e8 60%,#1a5a8a)}
.tbar .bar::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 2px),rgba(0,0,0,.55) calc(10% - 2px) 10%)}
.tbar .p{font:700 16px 'Chakra Petch','Arial Narrow',sans-serif;min-width:52px;text-align:right;font-variant-numeric:tabular-nums}
.tbar.hit .bar{animation:tbHit .18s}
@keyframes tbHit{0%{transform:translateX(-3px);filter:brightness(2)}50%{transform:translateX(3px)}100%{transform:none;filter:none}}
.tbar .sub{font-size:10px;letter-spacing:.12em;color:rgba(220,232,255,.65);text-transform:uppercase}
@media (pointer:fine){.shiptag{font-size:12px}.shiptag .hb{width:130px;height:6px}}
`;document.head.appendChild(st);})();
const TB={el:null,cur:null,frac:1,trail:1,hold:0,hitT:0};
function targetBar(t,dt){
  if(coarse){return false;}
  if(!TB.el){const el=document.createElement('div');el.className='tbar';
    el.innerHTML='<span class="k"></span><span class="n"></span><div class="row"><div class="bar"><i class="tr"></i><i class="fl"></i></div><span class="p"></span></div><span class="sub"></span>';
    document.body.appendChild(el);TB.el=el;TB.k=el.querySelector('.k');TB.n=el.querySelector('.n');TB.tr=el.querySelector('.tr');TB.fl=el.querySelector('.fl');TB.p=el.querySelector('.p');TB.sub=el.querySelector('.sub');}
  if(!t){if(TB.cur!==null){TB.el.classList.remove('on');TB.cur=null;}return true;}
  const f=clamp(t.frac,0,1);
  if(t.key!==TB.cur){TB.cur=t.key;TB.frac=TB.trail=f;TB.k.textContent=t.kind||'';TB.n.textContent=t.name;TB.el.classList.toggle('friend',!t.hostile);TB.el.classList.add('on');}
  if(f<TB.frac-1e-4){TB.hold=.45;TB.hitT=.18;}
  TB.frac=f;TB.hold-=dt;if(TB.hold<=0)TB.trail+=(f-TB.trail)*Math.min(1,dt*3);if(TB.trail<f)TB.trail=f;
  TB.hitT-=dt;TB.el.classList.toggle('hit',TB.hitT>0);
  TB.fl.style.width=(f*100).toFixed(1)+'%';TB.tr.style.width=(TB.trail*100).toFixed(1)+'%';TB.p.textContent=Math.ceil(f*100)+'%';
  TB.sub.textContent=t.sub||'';
  return true;
}

/* ---------- hyperspace: star streaks that stretch past the camera ---------- */
// uses Math.random so it never disturbs a page's seeded layout
function makeHyper(){
  const N=coarse?260:520,pos=new Float32Array(N*6),st=[];
  for(let i=0;i<N;i++){const a=Math.random()*6.283,r=30+Math.pow(Math.random(),.7)*420;st.push({x:Math.cos(a)*r,y:Math.sin(a)*r,z:-Math.random()*3000,s:.6+Math.random()*.8});}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const mat=new THREE.LineBasicMaterial({color:C(0xcfe9ff),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
  const obj=new THREE.LineSegments(g,mat);obj.frustumCulled=false;obj.visible=false;obj.renderOrder=5;scene.add(obj);
  return{update(k,dt){
    if(k<=0){obj.visible=false;return;}obj.visible=true;mat.opacity=Math.min(1,k*1.3);
    obj.position.copy(camera.position);obj.quaternion.copy(camera.quaternion);
    const L=20+1100*k*k,v=(300+7000*k)*dt;
    for(let i=0;i<N;i++){const s=st[i];s.z+=v*s.s;if(s.z>0)s.z-=3000;pos.set([s.x,s.y,s.z,s.x,s.y,s.z-L*s.s],i*6);}
    g.attributes.position.needsUpdate=true;}};
}
