/* Elyra shared · doors that don't open (Oct 22, Bryce: "make the world feel bigger... doors to the sides of buildings, when you're
   inside a room, just make it feel like there's life in there"). Set dressing only: no collision, nothing behind them. Each one is set
   into a wall that already stops you, so they never change where anyone can walk or shoot.

   DOORS.add(style, x, y, z, nx, nz, opts)   x,y,z: the bottom centre of the doorway, on the wall's face
                                              nx,nz: the way the door faces (out of the wall, toward you)
                                              opts.s scale (1 = a person-sized door), opts.light false for a dead panel
   DOORS.build(parent)                        merges everything added so far into a few meshes (call once, after the walls)

   Styles:
     host    the Empty Host: a black slab in a silver frame, a purple seam, a lit panel beside it (some locked red)
     old     the First Civilization: a tall pointed arch of pale stone, sealed, a thread of gold round it. No handle, no panel
     herald  the Heralds: a heavy blast door in rust-dark metal, hazard bands, an amber lamp over it (some dead)
     bunker  a Host door with its own hood of black plate, for doors cut straight into rock (the Mountain's canyons)
     keeper  a Keeper door (Bryce's model only; nothing is drawn until it arrives)

   Oct 24, Bryce's door models: host and bunker doors become the Hollow door (models/hollow-door.glb), herald doors the Herald door
   (herald-door.glb), keeper doors the Keeper door (keeper-door.glb). The code doors stand until the file arrives, then hide; a
   bunker keeps its hood of plate round the model. A dead door (light false) gets the model with its glow turned almost off.
   The models are squashed front to back (MODEL[style].d) so they sit on the wall like the code doors and never reach into a corridor. */
const DOORS=(()=>{
  const sets={},PLACED=[];   // PLACED: every door added, for tests   // style -> {m: solid Merger, g: glow Merger}
  const PAL={
    host:{frame:0x8e909c,slab:0x241c2c,slab2:0x302838,lit:[0xb46aff,0xb46aff,0xff3a3a,0xd8d0ff]},
    bunker:{frame:0x8e909c,slab:0x1e1824,slab2:0x2c2434,lit:[0xb46aff,0xff3a3a,0xb46aff]},
    old:{frame:0xd8d0c4,slab:0xbcb2a6,slab2:0xcfc6b8,lit:[0xffd27a]},
    herald:{frame:0x5a3a30,slab:0x2e1a16,slab2:0x6a4a2a,lit:[0xffa040,0xff6a20,0xffa040]}};
  function set(style){return sets[style]||(sets[style]={m:new Merger(),g:new Merger(),n:0,at:[],hood:new Merger()});}
  // the models: file, height of the whole piece in metres at s = 1, depth squash, and how far it sits out of the wall
  // (sx narrows the wide models a little, so a door still fits between a wall's pilasters)
  const MODEL={host:{f:'hollow-door',h:3.75,sx:.78,d:.35,z:-.05},bunker:{f:'hollow-door',h:3.75,sx:.85,d:.35,z:.05},herald:{f:'herald-door',h:3.9,sx:.72,d:.5,z:.75},keeper:{f:'keeper-door',h:4.2,sx:1,d:.4,z:0}};
  // a piece in the door's own frame (x across, y up, z out of the wall), turned and placed onto the wall
  function add(style,x,y,z,nx,nz,o){o=o||{};const S=set(style),P=PAL[style]||PAL.host,s=o.s||1,ry=Math.atan2(nx,nz),T=M(x,y,z,0,ry,0);
    const put=(g,px,py,pz,col,rx,rz)=>S.m.add(g,T.clone().multiply(M(px*s,py*s,pz*s,rx||0,0,rz||0)),C(col));
    const lit=(g,px,py,pz,col)=>S.g.add(g,T.clone().multiply(M(px*s,py*s,pz*s)),C(col));
    const B=(w,h,d)=>boxUV(w*s,h*s,d*s,2),G=(w,h,d)=>new THREE.BoxGeometry(w*s,h*s,d*s);
    const k=S.n++,on=o.light!==false,lc=P.lit[k%P.lit.length];
    S.at.push({x,y,z,ry,s,dim:!on});PLACED.push({style,x,y,z,nx,nz});
    if(style==='keeper')return;
    if(style==='host'||style==='bunker'){const w=2.2,h=3.3;
      if(style==='bunker'){const hood=(g,px,py,pz,col,rx,rz)=>S.hood.add(g,T.clone().multiply(M(px*s,py*s,pz*s,rx||0,0,rz||0)),C(col));   // the hood stays when the model arrives
        hood(B(w+2.4+1.6,h+1.6,3.2),0,(h+1.6)/2-.3,-1.5,P.slab2);hood(B(w+2.8+1.6,.5,3.6),0,h+1.35,-1.3,P.slab,.12,0);
        for(const sx of[-1,1])hood(B(.5,h+1.4,.6),sx*(w/2+1.7),(h+1.4)/2-.3,.2,P.frame,0,sx*.06);}
      for(const sx of[-1,1]){put(B(.34,h+.3,.5),sx*(w/2+.17),(h+.3)/2,0,P.frame);                       // jambs
        put(B(w/2-.03,h,.18),sx*(w/4),h/2,.1,P.slab);                                              // the two leaves, set back
        for(let r=0;r<3;r++)put(B(w/2-.3,.08,.08),sx*(w/4),.7+r*.95,.21,P.slab2);}                     // ribs across them
      put(B(w+.68,.42,.56),0,h+.3+.21,0,P.frame);put(B(w+.4,.12,.4),0,.06,.05,P.slab2);              // lintel, sill
      lit(G(.05,h-.5,.03),0,h/2,.21,on?lc:0x2a2030);                                                 // the seam
      lit(G(w*.55,.06,.08),0,h+.62,.26,on?0xd8d0ff:0x302838);                                         // a strip lamp over it
      put(B(.34,.5,.1),w/2+.62,1.35,.02,P.frame);lit(G(.22,.26,.03),w/2+.62,1.38,.08,on?lc:0x221a28); // the panel
      if(k%3===1){put(B(.6,.36,.08),-(w/2+.72),2.4,.02,P.slab2);for(let r=0;r<4;r++)put(B(.5,.04,.04),-(w/2+.72),2.27+r*.09,.07,P.frame);}}   // a vent
    else if(style==='old'){const w=2.4,h=4.4;
      for(const sx of[-1,1]){put(B(.5,h,.6),sx*(w/2+.25),h/2,0,P.frame);
        put(B(.5,2,.6),sx*(w/4+.1),h+.75,0,P.frame,0,sx*.72);}                                        // the pointed top
      put(B(w,h,.2),0,h/2,.1,P.slab);
      {const t=new THREE.Shape();t.moveTo(-w/2*s,0);t.lineTo(w/2*s,0);t.lineTo(0,1.45*s);t.closePath();const tg=new THREE.ExtrudeGeometry(t,{depth:.2*s,bevelEnabled:false});
       tg.translate(0,0,-.1*s);S.m.add(tg,T.clone().multiply(M(0,h*s,.1*s)),C(P.slab2));}
      lit(G(.04,h-.2,.04),-(w/2-.04),h/2,.31,0xffd27a);lit(G(.04,h-.2,.04),w/2-.04,h/2,.31,0xffd27a);lit(G(w*.5,.04,.04),0,.5,.31,0xffd27a);}
    else if(style==='herald'){const w=2.6,h=3.1;
      put(B(w+1.1,h+.9,.7),0,(h+.9)/2,-.4,P.frame);                                                   // the heavy surround
      put(B(w,h,.25),0,h/2,-.02,P.slab);
      for(let r=0;r<5;r++)put(B(w*.98,.14,.06),0,.35+r*.62,.13,r%2?P.slab2:P.slab);                   // hazard bands
      put(B(.18,h,.2),-w/2+.3,h/2,.1,P.slab2);put(B(.18,h,.2),w/2-.3,h/2,.1,P.slab2);
      put(B(.6,.25,.35),0,h+.62,.1,P.frame);lit(G(.42,.1,.06),0,h+.55,.29,on?lc:0x2a1810);}            // the lamp over it
  }
  // a window (a lit pane in the facility's walls, someone home behind it)
  function pane(style,x,y,z,nx,nz,w,h,col){const S=set(style),T=M(x,y,z,0,Math.atan2(nx,nz),0);S.g.add(new THREE.BoxGeometry(w,h,.04),T,C(col));}
  function build(parent){const out=[];
    for(const k in sets){const S=sets[k],code=[];
      const mat=()=>new THREE.MeshStandardMaterial({map:typeof panelTex!=='undefined'?panelTex:null,vertexColors:true,roughness:k==='old'?.6:.5,metalness:k==='old'?.1:.55});
      if(S.m.p.length){const a=new THREE.Mesh(S.m.build(),mat());a.castShadow=a.receiveShadow=true;parent.add(a);out.push(a);code.push(a);}
      if(S.g.p.length){const b=new THREE.Mesh(S.g.build(),new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(1.6,1.6,1.6),toneMapped:false}));parent.add(b);out.push(b);code.push(b);}
      if(S.hood.p.length){const h=new THREE.Mesh(S.hood.build(),mat());h.castShadow=h.receiveShadow=true;parent.add(h);out.push(h);}
      // Bryce's model over the code doors: one instance per door, then the code doors hide
      const D=MODEL[k];if(D&&S.at.length&&typeof MODELS!=='undefined'){const at=S.at;
        MODELS.prop(D.f).then(P=>{const k0=D.h/P.size.y,list=at.map(e=>({x:e.x+Math.sin(e.ry)*D.z*e.s,y:e.y-P.box.min.y*k0*e.s,z:e.z+Math.cos(e.ry)*D.z*e.s,ry:e.ry,s:e.s,sx:D.sx,sz:D.d,dim:e.dim}));
          return MODELS.propInstances(D.f,parent,list,k0,{dim:.12});}).then(ims=>{if(ims&&ims.length)for(const c of code)c.visible=false;}).catch(e=>console.warn('door model',k,e&&e.message));}
      sets[k]={m:new Merger(),g:new Merger(),n:S.n,at:[],hood:new Merger()};}
    return out;}
  return{add,pane,build,PLACED};
})();
