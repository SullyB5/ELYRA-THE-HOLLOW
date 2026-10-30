/* Elyra shared · gun sights (Oct 30, Bryce: "an actual scope animation on the ARs", "go straight for the real 3D sight fitted for each gun").
   Every gun you can hold in first person except the snipers carries a code-built holographic sight on its top rail: a dark metal hood
   with a glass window, a lit strip down each side, and the reticle drawn on the glass. Aiming down the sights lifts the gun until
   that glass sits dead on the middle of the screen (js/origin/03-play.js lines it up each frame), and the reticle boots up on the glass:
   it flickers on, the ring draws itself round, then the ticks snap in (about 0.2 s).

   Reticle by class (Halo Reach / Halo 3 for the feel):
     ar      a ring with four ticks outside it and a dot in the middle
     smg     four short arcs (a broken ring) round a dot, with small inner ticks
     pistol  a small thin ring with a chevron under the dot
     rocket  four corner brackets round a dot, with two range bars under it
   Colour by who made the gun: the Keepers' cyan, the Hollow's purple, the Heralds' amber, the red Heralds' red-orange (from the
   weapon's flash / glow colour). On a target the reticle turns red, as Halo's does.

   MOUNT: where the sight sits on each model, in the gun's own frame (metres, muzzle toward -z, top up): [z, y of the top there].
   Measured off each model file's top edge (the highest point within 4.5 cm of z, near the middle line), so the sight sits on the gun
   instead of floating or sinking into it. A model not listed gets a guess from its grip.
   SIGHTS.fit(gunObject, weapon) adds the sight to a gun (once) and returns it; SIGHTS.boot(sight, k, red) animates it. Global `SIGHTS`. */
const SIGHTS=(()=>{
  const MOUNT={vigil:[-.03,.139],carbine:[.05,.114],smg:[-.04,.129],m254:[.02,.134],night:[.04,.096],desert:[.06,.17],revolver:[.06,.1],
    pistol:[.04,.087],'pistol-custom':[.08,.063],'pistol-custom-2':[.07,.066],breaker:[-.06,.174],
    'herald-rifle':[.09,.127,.27],'hollow-gun':[.03,.24,.28,.06],heavy:[.08,.323],'hollow-heavy':[.1,.238,.34],'herald-heavy':[0,.061]};
  // the hood's size (metres, in the gun's frame): width, height, length
  // (Oct 30, Bryce: the frame was a little too thick and the sight a little big) 20% smaller, frame about half as thick
  const SIZE={ar:[.04,.04,.068],smg:[.037,.037,.06],pistol:[.028,.028,.04],rocket:[.056,.051,.088]};
  const classOf=W=>!W?'ar':W.rocket?'rocket':W.type==='SMG'?'smg':W.type==='Pistol'?'pistol':W.scope?null:'ar';
  const COL={keeper:'#7fe3ff'};
  const colourOf=W=>{const h=W&&(W.flash||W.glow);if(h==null)return COL.keeper;const c=new THREE.Color(h);
    // bright and saturated, so it reads on the glass over sand and sky alike
    const hsl={};c.getHSL(hsl);c.setHSL(hsl.h,Math.max(.75,hsl.s),Math.max(.62,Math.min(.72,hsl.l)));return'#'+c.getHexString();};
  const RED='#ff3b30';

  /* ---------- the reticle, drawn on a small canvas: p = how far the boot-up has got (0..1) ---------- */
  const S=256;
  function draw(ctx,cls,col,p){ctx.clearRect(0,0,S,S);if(p<=0)return;const c=S/2;
    const pass=(lw,stroke,blur)=>{ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.fillStyle=stroke;ctx.shadowColor=col;ctx.shadowBlur=blur;ctx.lineCap='round';};
    const ring=k=>Math.min(1,Math.max(0,(p-.15)/.55))*k;            // the ring draws itself round between 15% and 70%
    const ticks=p>.7?Math.min(1,(p-.7)/.25):0;                       // then the ticks snap in
    const core='#'+new THREE.Color(col).lerp(new THREE.Color(1,1,1),.55).getHexString();
    for(const [lw,st,bl] of [[5,col,10],[2,core,0]]){pass(lw,st,bl);
      // the dot (first thing on)
      if(p>.08){ctx.beginPath();ctx.arc(c,c,lw>3?4.5:2.2,0,Math.PI*2);ctx.fill();}
      if(cls==='ar'){const r=S*.3;ctx.beginPath();ctx.arc(c,c,r,-Math.PI/2,-Math.PI/2+ring(Math.PI*2));ctx.stroke();
        if(ticks)for(let i=0;i<4;i++){const a=i*Math.PI/2,r0=r+6+(1-ticks)*20,r1=r0+S*.09;ctx.beginPath();ctx.moveTo(c+Math.cos(a)*r0,c+Math.sin(a)*r0);ctx.lineTo(c+Math.cos(a)*r1,c+Math.sin(a)*r1);ctx.stroke();}}
      else if(cls==='smg'){const r=S*.33,g=.38;for(let i=0;i<4;i++){const a0=i*Math.PI/2+g,a1=(i+1)*Math.PI/2-g;ctx.beginPath();ctx.arc(c,c,r,a0,a0+(a1-a0)*Math.min(1,ring(1)));ctx.stroke();}
        if(ticks)for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,r0=r*.55,r1=r0-S*.06*ticks;ctx.beginPath();ctx.moveTo(c+Math.cos(a)*r0,c+Math.sin(a)*r0);ctx.lineTo(c+Math.cos(a)*r1,c+Math.sin(a)*r1);ctx.stroke();}}
      else if(cls==='pistol'){const r=S*.2;ctx.beginPath();ctx.arc(c,c,r,-Math.PI/2,-Math.PI/2+ring(Math.PI*2));ctx.stroke();
        if(ticks){const y=c+S*.075+(1-ticks)*14,w=S*.07;ctx.beginPath();ctx.moveTo(c-w,y+w*.75);ctx.lineTo(c,y);ctx.lineTo(c+w,y+w*.75);ctx.stroke();}}
      else if(cls==='rocket'){const h=S*.3*(1+(1-ring(1))*.5),L=S*.1;ctx.globalAlpha=Math.max(.15,ring(1));
        for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ctx.beginPath();ctx.moveTo(c+sx*h,c+sy*(h-L));ctx.lineTo(c+sx*h,c+sy*h);ctx.lineTo(c+sx*(h-L),c+sy*h);ctx.stroke();}
        ctx.globalAlpha=1;if(ticks)for(const [y,w] of [[.12,.07],[.2,.045]]){ctx.beginPath();ctx.moveTo(c-S*w*ticks,c+S*y);ctx.lineTo(c+S*w*ticks,c+S*y);ctx.stroke();}}}
    ctx.shadowBlur=0;}

  /* ---------- the sight: an open holographic frame ----------
     A low emitter housing clamped to the rail at the back, and at the front a thin chamfered window frame standing on two short posts,
     the glass inside it. Dark gunmetal, a lit edge in the maker's colour along the frame's top and down its posts. Open at the sides,
     so it never boxes in the view. */
  const metal=new THREE.MeshStandardMaterial({color:0x1b1f25,metalness:.45,roughness:.5,emissive:0x080b10});
  const metal2=new THREE.MeshStandardMaterial({color:0x101317,metalness:.5,roughness:.55,emissive:0x040608});
  const box=(w,h,l,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),m);o.position.set(x,y,z);return o;};
  // a frame of four bars with its corners cut (an octagon ring), in the x-y plane
  function frameRing(w,h,t,d,m){const g=new THREE.Group(),c=t*1.6;
    g.add(box(w-2*c,t,d,m,0,h/2-t/2,0),box(w-2*c,t,d,m,0,-h/2+t/2,0),box(t,h-2*c,d,m,-w/2+t/2,0,0),box(t,h-2*c,d,m,w/2-t/2,0,0));
    for(const [sx,sy] of[[-1,1],[1,1],[-1,-1],[1,-1]]){const L=Math.hypot(c,c)+t*.4,b=box(L,t,d,m,sx*(w/2-c/2-t*.15),sy*(h/2-c/2-t*.15),0);b.rotation.z=sx*sy>0?-Math.PI/4:Math.PI/4;g.add(b);}
    return g;}
  function build(W,gunId){const cls=classOf(W);if(!cls)return null;const [w,h,l]=SIZE[cls],t=w*.038,col=colourOf(W);
    const g=new THREE.Group();g.name='sight';const lit=new THREE.MeshBasicMaterial({color:col});
    const base=.008;g.add(box(w*.55,base,l*.9,metal2,0,base/2,0));                  // the rail clamp
    g.add(box(w*.62,h*.28,l*.4,metal,0,base+h*.14,l*.28));                         // the emitter housing at the back
    g.add(box(w*.18,h*.05,l*.08,lit,0,base+h*.29,l*.1));                           // its lens, lit
    const fz=-l*.3,fy=base+h*.62;
    g.add(box(w*.5,h*.24,l*.18,metal,0,base+h*.12,fz));                            // the front post block
    const ring=frameRing(w,h*.76,t,l*.07,metal);ring.position.set(0,fy,fz);g.add(ring);
    // the lit edge: along the top bar and a short way down each side
    g.add(box(w*.62,.0012,l*.072,lit,0,fy+h*.38+.0006,fz));
    for(const sx of[-1,1])g.add(box(.0012,h*.3,l*.072,lit,sx*(w/2+.0006),fy+h*.12,fz));
    const fw=w-2*t,fh=h*.76-2*t;
    const glass=new THREE.Mesh(new THREE.PlaneGeometry(fw,fh),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.035,depthWrite:false}));
    glass.position.set(0,fy,fz);g.add(glass);
    const cv=document.createElement('canvas');cv.width=cv.height=S;const ctx=cv.getContext('2d');const tex=new THREE.CanvasTexture(cv);
    const rm=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0});
    const sz=Math.min(fw,fh)*1.05;const ret=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),rm);ret.position.set(0,fy,fz+.0006);ret.renderOrder=5;g.add(ret);
    g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.frustumCulled=false;o.userData.keep=true;}});g.userData.keep=true;
    g.userData.sight={cls,col,ctx,tex,mat:rm,ret,p:-1,red:null};
    return g;}

  // put a sight on a gun object (once): the mount from the table, or a guess from the trigger hand
  function fit(o,W){if(!o||o.userData.sight!==undefined)return o&&o.userData.sight;const id=o.userData.gunId||'';
    const s=build(W,id);o.userData.sight=s;if(!s)return null;
    let m=MOUNT[id];if(!m){const R=o.userData.grip&&o.userData.grip.R;m=[R?R.z-.08:0,R?R.y+.12:.12];}
    s.position.set(0,m[1]-.004,m[0]);o.add(s);
    if(m[3]){const r=new THREE.Mesh(new THREE.BoxGeometry(.03,m[3],.05),metal2);r.position.set(0,-m[3]/2+.002,0);r.userData.keep=true;s.add(r);}
    // a long gun whose back end would come up past your eye: its sight is held further out (m[2], camera units) and made bigger
    // by the same amount, so it looks the same size on screen
    if(m[2]){s.userData.sight.d=m[2];s.scale.setScalar(m[2]/(DIST[s.userData.sight.cls]||.17));}
    return s;}
  // how far in front of your eye each kind of sight's glass sits while aiming (camera units; the gun is drawn at half size)
  const DIST={ar:.17,smg:.16,pistol:.13,rocket:.2};
  // the glass's middle (what lines up with the screen's middle)
  const eye=s=>s.userData.sight.ret;
  // k: how far into the aim (0..1, the boot-up runs on its own clock once you are in); red: a target under it
  function boot(s,k,red){const d=s.userData.sight;if(!d)return;const p=Math.round(Math.min(1,Math.max(0,k))*24)/24;
    if(p!==d.p||red!==d.red){d.p=p;d.red=red;draw(d.ctx,d.cls,red?RED:d.col,p);d.tex.needsUpdate=true;}
    // it flickers as it comes on
    d.mat.opacity=p<=0?0:p<.35?(Math.random()<.45?.25:1):1;}
  return{fit,boot,eye,classOf,colourOf,draw,MOUNT,DIST};
})();
