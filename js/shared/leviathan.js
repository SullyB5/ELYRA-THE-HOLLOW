/* Elyra · the Drowned Watcher (canon name; "leviathan" in the code). A colossal organism native to Elyra's deep oceans, NOT made by
   the Hollow King and NOT part of the Hollow: he influences it through an ancient signal, imperfectly. Under his mountain the rock opens
   onto a vast fresh/salt lake that runs through the planet and connects to the open ocean, which is how it reaches the chamber.
   Show it in pieces: two lights first, a dark mass, never a clean full-body view in the first game (see docs/LORE.md).
   makeLeviathan() → {root, setEyes(0..1), update(t,dt)}: about 60 m nose to tail at scale 1, facing +z, eyes at the front.
   makeWater(w,d) → {mesh, update(t)}: a dark sea surface that moves, lit by whatever is near it.
   Used by Archive 01's chamber (js/origin/06-below.js) and the recovered footage (js/menu/footage.js). */
const LEVIATHAN=(()=>{
  const lin=h=>new THREE.Color(h).convertSRGBToLinear();
  let glowT=null;
  function glowTex(){if(glowT)return glowT;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
    r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.2,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return glowT=new THREE.CanvasTexture(c);}
  const sprite=(col,s,o)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:lin(col).multiplyScalar(o||2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));m.scale.setScalar(s);return m;};
  // a smooth noise for the hide
  const hn=(x,y,z)=>Math.sin(x*1.7+y*.3)*Math.sin(y*1.3+z*.7)*Math.sin(z*1.1+x*.5);
  function makeLeviathan(){
    const root=new THREE.Group(),body=new THREE.Group();root.add(body);
    const skin=new THREE.MeshStandardMaterial({color:lin(0x12262e),roughness:.55,metalness:.15,emissive:lin(0x010508)});
    // the body: one long form, a blunt heavy head like a whale's, a long tapering tail; the hide folded and scarred
    const g=new THREE.SphereGeometry(1,96,56),p=g.attributes.position,v=new THREE.Vector3();
    for(let i=0;i<p.count;i++){v.set(p.getX(i),p.getY(i),p.getZ(i));const u=(v.z+1)/2;   // 0 tail .. 1 nose
      // girth: thin at the tail, broadest behind the head, the head itself blunt and only a little narrower
      const girth=u<.75?Math.pow(Math.sin(u/.75*Math.PI*.5),1.4):1-.18*Math.pow((u-.75)/.25,3);
      v.x*=6.4*girth;v.y*=5.6*girth*(v.y<0?.8:1.05);
      v.z=v.z<0?v.z*34:v.z*14;   // long behind, short and blunt in front
      if(u>.9)v.z-=Math.pow(Math.max(0,Math.abs(p.getY(i))),2)*1.6;   // the flat brow
      const fold=Math.sin(v.z*1.6+Math.sin(v.y*.9)*2)*.18+Math.sin(v.z*.6+v.x*.8)*.22,n=hn(v.x*.5,v.y*.5,v.z*.2);
      const wr=u>.72?Math.sin(v.y*2.6+Math.sin(v.x*.7)*1.5)*.32*(u-.72)/.28:0;   // deep folds across the face
      const k=1+(fold+n*.3+wr)/Math.max(2,Math.hypot(v.x,v.y));v.x*=k;v.y*=k;
      if(v.y>3.5*girth&&u<.85)v.y+=Math.max(0,Math.sin(v.z*1.3))*.35;   // ridges down the back
      p.setXYZ(i,v.x,v.y,v.z);}
    g.computeVertexNormals();const hull=new THREE.Mesh(g,skin);body.add(hull);
    // a heavy brow over the eyes, and the long seam of the mouth
    const brow=new THREE.Mesh(new THREE.SphereGeometry(1,40,16),skin);brow.scale.set(5.8,1,2.2);brow.position.set(0,1.5,9.6);body.add(brow);
    const mouth=new THREE.Mesh(new THREE.TorusGeometry(4.6,.22,8,40,Math.PI*.9),new THREE.MeshBasicMaterial({color:0x000000}));mouth.rotation.set(Math.PI*.5,0,Math.PI*1.05);mouth.position.set(0,-2.2,8.6);mouth.scale.set(1,.7,1);body.add(mouth);
    // pectoral fins, long, swept back
    for(const s of[-1,1]){const fg=new THREE.SphereGeometry(1,24,10),fp=fg.attributes.position;for(let i=0;i<fp.count;i++){const x=fp.getX(i);fp.setXYZ(i,x*9,fp.getY(i)*.35*(1-Math.abs(x)*.6),fp.getZ(i)*2.6-x*x*3);}fg.computeVertexNormals();
      const f=new THREE.Mesh(fg,skin);f.position.set(s*10,-2.8,4);f.rotation.set(0,s*.55,s*.4);body.add(f);}
    // the feelers: a curtain of long thin strands under the jaw, each one drifting in the water
    const strands=[];const fm=new THREE.MeshStandardMaterial({color:lin(0x1e3a44),roughness:.5,emissive:lin(0x04202a)});
    for(let i=0;i<60;i++){const a=(i/59-.5)*2.6,L=9+Math.random()*12,pts=[];for(let k=0;k<=8;k++)pts.push(new THREE.Vector3(0,-k/8*L,0));
      const curve=new THREE.CatmullRomCurve3(pts),geo=new THREE.TubeGeometry(curve,16,.13,5,false),ln=new THREE.Mesh(geo,fm);
      const base={x:Math.sin(a)*5.2,y:-3-Math.random()*1.2,z:10.5+Math.cos(a)*1.5-Math.abs(a)*1.6-(i%2)*1.2};ln.position.set(base.x,base.y,base.z);body.add(ln);strands.push({ln,ph:Math.random()*6});}
    // pale lights along the flanks
    const dots=[];for(let i=0;i<26;i++){const s=i%2?1:-1,u=.25+Math.random()*.6,d=sprite(0x5ad8ff,.6+Math.random()*.6,1.6);d.position.set(s*5.8*Math.sin(Math.min(1,u*1.3)*Math.PI*.5),-1.4+Math.random()*2,(u-.75)*40);d.material.opacity=0;body.add(d);dots.push({d,ph:Math.random()*6});}
    // the eyes: small, cold, set wide under the brow
    const eyes=[];for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),new THREE.MeshBasicMaterial({color:lin(0x9ff0ff),transparent:true,opacity:0,fog:false}));e.position.set(s*4.7,.6,11.2);e.scale.set(.8,.45,.8);body.add(e);
      const gl=sprite(0x3ad8ff,2,2);gl.material.opacity=0;gl.position.copy(e.position).add(new THREE.Vector3(0,0,.4));body.add(gl);eyes.push(e,gl);}
    const eyeLight=new THREE.PointLight(lin(0x5ad8ff),0,26,1.6);eyeLight.position.set(0,.6,15);body.add(eyeLight);
    let eyeO=0,dotO=0;
    // Bryce's Drowned Watcher model: when it arrives it replaces the code-built hide, fins and feelers (same size, eyes moved onto its face)
    // Oct 30: his new model (Meshy, straightened to face +z). Its own texture is about half as bright as the first one's, so the
    // tint is lighter to keep the same dark blue; its eyes sit lower and further back on the face than the first model's.
    if(typeof MODELS!=='undefined')MODELS.load('watcher').then(src=>{
      const mm=src.material.clone();mm.color=lin(0xb0c4d0);mm.emissive=lin(0x02080c);mm.roughness=.6;mm.metalness=.15;
      const m=new THREE.Mesh(src.geometry,mm);m.scale.setScalar(48);m.position.set(0,0,-10);
      for(const o of body.children.slice())if(o.isMesh&&!eyes.includes(o))o.visible=false;
      for(const S of strands)S.ln.visible=false;body.add(m);
      // (the head is turned a little toward -x, so the eyes aren't mirror images: found from the model's own glowing eye texture)
      const EYE=[[-4.75,.24,8.6],[-1.2,.58,11]];
      eyes.forEach((e,i)=>{const P=EYE[i<2?0:1];e.position.set(P[0],P[1],P[2]+(e.isSprite?.4:0));});eyeLight.position.set(-3,.4,14);
    }).catch(()=>{});
    return{root,body,setEyes(o){eyeO=o;},setLights(o){dotO=o;},
      update(t,dt){body.rotation.z=Math.sin(t*.25)*.04;body.position.y=Math.sin(t*.4)*.6;body.rotation.x=Math.sin(t*.3)*.02;
        for(const e of eyes)e.material.opacity=eyeO*(e.isSprite?.85+.15*Math.sin(t*1.7):1);eyeLight.intensity=eyeO*2.2;
        for(const D of dots)D.d.material.opacity=dotO*(.35+.65*Math.max(0,Math.sin(t*.8+D.ph)));
        for(const S of strands){S.ln.rotation.x=.35+S.ph*.04+Math.sin(t*.5+S.ph)*.14;S.ln.rotation.z=(S.ph-3)*.05+Math.sin(t*.7+S.ph)*.12;}}};
  }
  // the water: a broad dark surface with slow swells, its normals redrawn from a moving texture
  function makeWater(w,d,color){
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),img=x.createImageData(256,256);
    for(let j=0;j<256;j++)for(let i=0;i<256;i++){const a=Math.sin(i*.12+Math.sin(j*.07)*2)*.5+Math.sin(j*.15+Math.sin(i*.05)*3)*.5,b=Math.cos(i*.09-j*.11)*.5,k=(j*256+i)*4;
      img.data[k]=128+a*50;img.data[k+1]=128+b*50;img.data[k+2]=255;img.data[k+3]=255;}
    x.putImageData(img,0,0);const nm=new THREE.CanvasTexture(c);nm.wrapS=nm.wrapT=THREE.RepeatWrapping;nm.repeat.set(w/14,d/14);
    const geo=new THREE.PlaneGeometry(w,d,48,48);geo.rotateX(-Math.PI/2);const base=Float32Array.from(geo.attributes.position.array);
    const mat=new THREE.MeshStandardMaterial({color:lin(color||0x03141c),roughness:.18,metalness:.35,normalMap:nm,normalScale:new THREE.Vector2(.45,.45),transparent:true,opacity:.8});
    const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;
    return{mesh,update(t){nm.offset.set(t*.012,t*.008);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const X=base[i*3],Z=base[i*3+2];p.setY(i,Math.sin(X*.08+t*.6)*.18+Math.sin(Z*.11-t*.45)*.14);}p.needsUpdate=true;}};
  }
  return{makeLeviathan,makeWater,sprite};
})();
