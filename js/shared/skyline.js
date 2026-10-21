/* Elyra shared skyline: Tide City as seen from far off, for cutscene backdrops (the prologue's city shot, the command deck's
   windows in Archive 01, the deck in the recovered footage). Replaces the plain boxes with dotted windows.

   Five kinds of tower, mixed: tiered (setbacks, a crown and a mast), round glass, twin towers joined by a skybridge, needles,
   and the old pearl-and-gold Keeper towers. Facades have floors of windows (some floors dark, some fully lit, warm and cold),
   cyan light bands, red aviation lights that blink, the ring platforms the city stands on at the waterline with lit rims,
   long reflections on the water under the brightest towers, and a little air traffic. Static parts are merged per material.

   SKYLINE.build(opts) → {G, update(t)}
     opts.n         how many towers
     opts.place(i)  → [x, z, near]  where tower i stands (near: 1 close to the viewer .. 0 far, scales its height)
     opts.h         tallest tower (units), opts.w widest base, opts.water y of the sea (default 0)
     opts.lit       0..1 how many windows are on (a dying city: .15), opts.rings platforms at the base (default true)
     opts.traffic   number of flying lights (default 24), opts.seed */
const SKYLINE=(()=>{
  const lin=h=>new THREE.Color(h).convertSRGBToLinear();
  let glowT=null;
  function glowTex(){if(glowT)return glowT;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
    r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return glowT=new THREE.CanvasTexture(c);}
  // a small seeded random of its own, so a backdrop never shifts a chapter's seeded world
  function rnd(s){let a=s>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  // facade: floors of windows. One tile = 8 floors x 8 bays. A few floors dark, a few fully lit, mullions between bays
  const facCache={};
  function facade(lit,warm,seed){const key=lit+'|'+warm+'|'+seed;if(facCache[key])return facCache[key];
    const r=rnd(seed),W=128,H=256,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
    g.fillStyle='#0b0f18';g.fillRect(0,0,W,H);
    const rows=16,cols=8,cw=W/cols,rh=H/rows;
    for(let y=0;y<rows;y++){const floor=r(),dark=floor<.18,full=floor>.9;
      for(let x=0;x<cols;x++){const on=full?r()<.92:dark?r()<.04:r()<lit;
        const warmC=r()<warm,col=on?(warmC?['#ffd9a0','#ffc878','#ffe6c0'][(r()*3)|0]:['#a8e4ff','#d0f0ff','#7fd0ff'][(r()*3)|0]):(r()<.5?'#141c2a':'#101622');
        g.fillStyle=col;g.fillRect(x*cw+2,y*rh+3,cw-4,rh-6);
        if(on&&r()<.3){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x*cw+2+r()*(cw-6),y*rh+3,2,rh-6);}}   // a figure or a blind
      g.fillStyle='rgba(120,140,170,.18)';g.fillRect(0,y*rh,W,1.5);}   // floor slab line
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return facCache[key]=t;}
  // geometry collector: parts are merged into one mesh per material
  function Bag(){const P=[],N=[],U=[];return{add(geo,m){const g=geo.index?geo.toNonIndexed():geo.clone();g.applyMatrix4(m);const a=g.attributes;
        for(const v of a.position.array)P.push(v);for(const v of a.normal.array)N.push(v);if(a.uv)for(const v of a.uv.array)U.push(v);else for(let i=0;i<a.position.count*2;i++)U.push(0);},
      mesh(mat){if(!P.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
        g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);m.frustumCulled=false;return m;}};}
  const mx=(x,y,z,ry,sx,sy,sz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry||0,0)),new THREE.Vector3(sx||1,sy||1,sz||1));
  // a box whose windows are the right size whatever its size (unit = one floor's height x 2)
  function box(w,h,d,unit){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;if(f===2||f===3){uv.setXY(k,0,0);continue;}uv.setXY(k,uv.getX(k)*dims[f][0]/(unit*1),uv.getY(k)*dims[f][1]/(unit*2));}return g;}
  function cyl(r0,r1,h,seg,unit){const g=new THREE.CylinderGeometry(r0,r1,h,seg,1,true),uv=g.attributes.uv,circ=Math.PI*(r0+r1);
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*circ/unit,uv.getY(i)*h/(unit*2));return g;}

  function build(o){
    const r=rnd(o.seed||7),G=new THREE.Group(),lit=o.lit==null?.55:o.lit,WY=o.water||0,HM=o.h||200,WM=o.w||40,unit=o.unit||WM/3;
    const fac=[facade(lit,.72,11),facade(lit*.9,.35,23),facade(lit,.85,37)].map(t=>new THREE.MeshStandardMaterial({color:lin(0x121826),map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:o.glow||1.4,roughness:.35,metalness:.6}));
    const pearl=new THREE.MeshStandardMaterial({color:lin(0xe8e2d4),roughness:.45,metalness:.25,emissive:lin(0x1a1712)});
    const dark=new THREE.MeshStandardMaterial({color:lin(0x1c2230),roughness:.5,metalness:.6});
    const gold=new THREE.MeshStandardMaterial({color:lin(0xd9b25a),roughness:.25,metalness:.9,emissive:lin(0x4a3008)});
    const cyan=new THREE.MeshBasicMaterial({color:lin(0x7fe8ff).multiplyScalar(1.5),fog:true});
    const B={f0:Bag(),f1:Bag(),f2:Bag(),pearl:Bag(),dark:Bag(),gold:Bag(),cyan:Bag()};
    const blink=[],refl=[];
    const spr=(hex,s,op)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:lin(hex).multiplyScalar(2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op==null?1:op}));m.scale.setScalar(s);return m;};
    const cylG=(r0,r1,h,seg)=>new THREE.CylinderGeometry(r0,r1,h,seg);
    const towers=[];
    for(let i=0;i<o.n;i++){
      const [x,z,near]=o.place(i,r),nk=.45+.55*(near==null?1:near);
      const kind=r(),h=(.25+r()*.75)*HM*nk,w=(.35+r()*.65)*WM*(.7+.3*nk),ry=r()*Math.PI,F=B['f'+((r()*3)|0)];
      let top=h;
      if(kind<.34){   // tiered: three setbacks, each with a cyan band at its shoulder, a crown, a mast
        let y=WY,ww=w;for(const k of[.5,.3,.2]){const hh=h*k;F.add(box(ww,hh,ww,unit),mx(x,y+hh/2,z,ry));B.cyan.add(box(ww*1.02,hh*.012+.3,ww*1.02,unit),mx(x,y+hh-.6,z,ry));y+=hh;ww*=.72;}
        B.dark.add(box(ww*1.1,h*.03,ww*1.1,unit),mx(x,y+h*.015,z,ry));B.dark.add(cylG(.25,.5,h*.18,5),mx(x,y+h*.03+h*.09,z));top=y+h*.21;}
      else if(kind<.52){   // round glass tower, crowned with a gold ring
        const rr=w*.48;F.add(cyl(rr*.86,rr,h,14,unit),mx(x,WY+h/2,z));B.cyan.add(cylG(rr*1.01,rr*1.01,h*.01+.3,14),mx(x,WY+h*.33,z));B.cyan.add(cylG(rr*.95,rr*.95,h*.01+.3,14),mx(x,WY+h*.66,z));
        B.dark.add(cylG(rr*.7,rr*.86,h*.05,14),mx(x,WY+h*1.025,z));B.gold.add(new THREE.TorusGeometry(rr*.78,Math.max(.4,rr*.05),5,18).rotateX(Math.PI/2),mx(x,WY+h*1.05,z));top=h*1.05;}
      else if(kind<.66){   // twin towers with a lit skybridge
        const ww=w*.42,off=w*.42,h2=h*(.8+r()*.15),c=Math.cos(ry),s=Math.sin(ry);
        F.add(box(ww,h,ww,unit),mx(x-c*off,WY+h/2,z+s*off,ry));F.add(box(ww,h2,ww,unit),mx(x+c*off,WY+h2/2,z-s*off,ry));
        const by=WY+h2*.72;B.dark.add(box(off*2,h*.025+.6,ww*.5,unit),mx(x,by,z,ry));B.cyan.add(box(off*2,.25+h*.004,ww*.52,unit),mx(x,by-h*.012,z,ry));}
      else if(kind<.8){   // needle: a slim tapering spire
        const rr=w*.3;F.add(cyl(rr*.35,rr,h,8,unit),mx(x,WY+h/2,z));B.gold.add(cylG(0,rr*.36,h*.18,8),mx(x,WY+h*1.09,z));B.cyan.add(cylG(rr*.8,rr*.8,.3+h*.006,8),mx(x,WY+h*.25,z));top=h*1.18;}
      else{   // the old Keeper towers: pearl stone, gold bands, an arched crown, few windows
        const rr=w*.42,hh=h*.75;B.pearl.add(cylG(rr*.82,rr,hh,6),mx(x,WY+hh/2,z,ry));for(const k of[.3,.62,.98])B.gold.add(cylG(rr*1.02,rr*1.02,.4+hh*.012,6),mx(x,WY+hh*k,z,ry));
        F.add(cyl(rr*.55,rr*.7,hh*.18,6,unit),mx(x,WY+hh+hh*.09,z,ry));B.gold.add(new THREE.SphereGeometry(rr*.62,10,6,0,Math.PI*2,0,Math.PI/2),mx(x,WY+hh*1.18,z));top=hh*1.4;}
      towers.push({x,z,top:WY+top,w,near:nk});
      // a red light on the tallest ones, blinking
      if(top>HM*.45&&r()<.8){const b=spr(0xff3a2a,Math.max(2,w*.12),1);b.position.set(x,WY+top+w*.05,z);G.add(b);blink.push({s:b,p:r()*6});}
      // the reflection: a long soft streak on the water under it
      if(o.reflect!==false&&r()<.6){const s=spr(r()<.7?0xffc878:0x8fdcff,1,.0);s.scale.set(w*.7,top*.55,1);s.position.set(x,WY-top*.18,z);s.material.opacity=s.userData.o=.12+.12*lit;G.add(s);refl.push(s);}
    }
    // the ring platforms the city stands on, with lit rims (Tide City's look from the water)
    if(o.rings!==false){const ringN=Math.max(3,Math.round(o.n/12));for(let k=0;k<ringN;k++){const t=towers[(r()*towers.length)|0];if(!t)break;const rr=WM*(1.6+r()*1.6);
      B.dark.add(cylG(rr,rr*1.04,WM*.08,40),mx(t.x,WY+WM*.03,t.z));B.cyan.add(new THREE.TorusGeometry(rr*1.04,Math.max(.25,WM*.012),4,48).rotateX(Math.PI/2),mx(t.x,WY+WM*.08,t.z));}}
    for(const [k,m] of[['f0',fac[0]],['f1',fac[1]],['f2',fac[2]],['pearl',pearl],['dark',dark],['gold',gold],['cyan',cyan]]){const me=B[k].mesh(m);if(me)G.add(me);}
    // air traffic: lights crossing between the towers
    const TN=o.traffic==null?24:o.traffic,tp=new Float32Array(TN*3),tr=[];
    for(let i=0;i<TN;i++){const a=towers[(r()*towers.length)|0],b=towers[(r()*towers.length)|0];if(!a||!b){tr.push(null);continue;}
      tr.push({a,b,y:WY+HM*(.25+r()*.5),sp:.02+r()*.05,ph:r()});}
    const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(tp,3));
    const traffic=new THREE.Points(tg,new THREE.PointsMaterial({map:glowTex(),size:Math.max(3,WM*.12),color:lin(0xbfe8ff).multiplyScalar(2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    traffic.frustumCulled=false;if(TN)G.add(traffic);
    function update(t){
      for(const b of blink)b.s.material.opacity=Math.sin(t*2.2+b.p)>.55?1:.12;
      for(let i=0;i<TN;i++){const q=tr[i];if(!q){tp[i*3+1]=-1e5;continue;}const u=(q.ph+t*q.sp)%1,k=u<.5?u*2:2-u*2;
        tp[i*3]=q.a.x+(q.b.x-q.a.x)*k;tp[i*3+1]=q.y+Math.sin(u*6.283)*HM*.03;tp[i*3+2]=q.a.z+(q.b.z-q.a.z)*k;}
      tg.attributes.position.needsUpdate=true;
      for(let i=0;i<refl.length;i++)refl[i].material.opacity=refl[i].userData.o*(.8+.2*Math.sin(t*1.3+i*1.7));}
    return{G,update,towers};
  }
  return{build};
})();
