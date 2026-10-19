/* Elyra shared combat: ship hulls for collision and hit tests, ship name/HP tags, player homing missiles,
   damage fires, crosshair aim. Needs core.js, fx.js and page globals `scene`, `camera`, `glow`. */

/* ---------- hulls: a ship's merged geometry sliced along its length into boxes ---------- */
// Each slice box wraps the triangles that cross it, so the hull follows the ship's outline instead of one big box.
function buildHull(geo,slices,shrink){
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
    const s=o.scale.x;if(pos.distanceTo(o.position)>C.R*s+radius)continue;o.updateMatrixWorld();
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
