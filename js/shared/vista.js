/* Elyra shared · VISTA: what stands between the level and the sky (Oct 30, Bryce: "our backgrounds are just sky boxes ... I want
   mountains and views and ranges in the back, so it doesn't only hide in the sky box but also gives more depth"; his references:
   Halo Reach's Forge World, the Silent Cartographer's beach). Built first for the multiplayer map (Gilded Shore), made to be dropped
   onto the other levels next.

   Layers, each further out and fainter:
     massifs     the big ones, a few kilometres off: sea cliffs, stepped rock walls climbing to snow, waterfalls pouring off the cliffs
                 into the sea with mist at their feet, and (optionally) a white needle of a tower on a shoulder
     islands     smaller landmasses: plateaus on cliff walls with green tops, or rounded hills, a beach rim
     coasts      long continents along arcs of the horizon: a low shore rising into ranges with snow on the highest peaks
     skyline     one thin, jagged ridge all round at the very edge, barely there, so the horizon is never a ruler line
   The land is one cheap unlit material: light and haze are baked into the vertex colours (sun-facing slopes brighter, everything
   fading toward the haze colour with distance), so the layers cost a few draw calls and no lights. The waterfalls are the only
   moving part (VISTA's update(t)). Everything sits inside the camera's far plane and in front of the sky dome (which never writes depth).

   VISTA.build(opts) → {G, update(t)}
     opts.center   {x,z} the level's middle (default 0,0); opts.seaY the waterline (0); opts.seed
     opts.sun      THREE.Vector3 toward the sun (for the baked light)
     opts.haze     the horizon's colour (hex); opts.rock, opts.rock2, opts.green, opts.sand, opts.snow (hex) the land's colours
     opts.massifs  [{a, r, rad, h, falls, tower}]  bearing (radians, 0 = north/-z, clockwise), distance, radius, peak height, how many
                   waterfalls (on the side facing the level), and whether a tower stands on it
     opts.islands  {n, r0, r1, h0, h1}   how many, between which distances, how tall (metres)
     opts.coasts   [{a0, a1, r, depth, h}] arcs (radians, as massifs), distance of the shore, how deep the land runs, tallest peak
     opts.skyline  {r, h} the far ring's distance and height (null for none)
     opts.dry      0..1: 0 green tops, 1 dry and rocky (a desert world)
   Needs THREE and core.js (C, vnoise, ridged, fbm, clamp, sstep). Global `VISTA`. */
const VISTA=(()=>{
  function rnd(s){let a=s>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function build(o){o=o||{};
    const G=new THREE.Group();G.name='vista';
    const cx=o.center?o.center.x:0,cz=o.center?o.center.z:0,sea=o.seaY||0,r=rnd(o.seed||7);
    const sun=(o.sun||new THREE.Vector3(.4,.6,.3)).clone().normalize();
    const HAZE=C(o.haze||0xbcd4e6),ROCK=C(o.rock||0x8a7a6a),ROCK2=C(o.rock2||0x6e6a66),GREEN=C(o.green||0x5d7a3e),SAND=C(o.sand||0xe8d6a8),SNOW=C(o.snow||0xf4f6fa);
    const dry=o.dry||0,tmp=new THREE.Color(),tmp2=new THREE.Color();
    const mat=new THREE.MeshBasicMaterial({vertexColors:true,fog:false});
    const bearing=(a,d)=>({x:cx+Math.sin(a)*d,z:cz-Math.cos(a)*d});
    /* shade one vertex: grass on the gentle ground, rock on the steep (two rocks, banded by height so cliffs read as layers), snow
       up high on the big ones, sand at the waterline; lit by the sun; hazed by distance (k: 0 near .. 1 gone) */
    function shade(out,h,top,slope,nl,dist,far,snowAt){
      const u=clamp(h/Math.max(1,top),0,1);
      if(h<5)out.copy(SAND);
      else{tmp2.copy(ROCK).lerp(ROCK2,.5+.5*Math.sin(h*.09));out.copy(GREEN).lerp(tmp2,clamp(dry*.8+slope*2.1+u*.3-.35,0,1));
        if(snowAt&&u>snowAt)out.lerp(SNOW,sstep(snowAt,snowAt+.12,u)*(1-clamp(slope*1.2-.3,0,.7)));}
      out.multiplyScalar(.32+.95*clamp(nl,0,1.1));
      const k=clamp(Math.pow(dist/far,.8),0,.93);return out.lerp(HAZE,k);}
    // a landmass as a polar patch: rings out from a centre; heights from hfn(x,z,u) (u: 0 middle .. 1 rim); the rim sinks under the sea
    function patch(px,pz,rad,segA,segR,hfn,top,far,snowAt){
      const pos=[],col=[],idx=[],H=[];
      for(let j=0;j<=segR;j++)for(let i=0;i<segA;i++){const a=i/segA*Math.PI*2,u=Math.pow(j/segR,.85),rr=rad*u,x=px+Math.sin(a)*rr,z=pz+Math.cos(a)*rr;const h=j===segR?-12:hfn(x,z,u);
        pos.push(x,sea+h,z);H.push(h);}
      for(let j=0;j<segR;j++)for(let i=0;i<segA;i++){const i2=(i+1)%segA,a=j*segA+i,b=j*segA+i2,c=(j+1)*segA+i,d=(j+1)*segA+i2;idx.push(a,c,b,b,c,d);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
      const N=g.attributes.normal;for(let k=0;k<H.length;k++){const nx=N.getX(k),ny=N.getY(k),nz=N.getZ(k),nl=nx*sun.x+ny*sun.y+nz*sun.z,x=pos[k*3]-cx,z=pos[k*3+2]-cz;
        shade(tmp,H[k],top,1-ny,nl*.85+.3,Math.hypot(x,z),far,snowAt);col.push(tmp.r,tmp.g,tmp.b);}
      g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.deleteAttribute('normal');return g;}
    const geos=[],falls=[];
    /* ---------- massifs: sea cliffs, stepped walls, ridges, snow ---------- */
    for(const Mf of(o.massifs||[])){const c=bearing(Mf.a,Mf.r),sd=r()*100,top=Mf.h,rad=Mf.rad;
      const hfn=(x,z,u)=>{const q=1-u,dx=(x-c.x)/rad,dz=(z-c.z)/rad;
        const cliff=sstep(0,.1,q)*.22,body=Math.pow(sstep(.05,.85,q),1.4),rid=Math.pow(ridged(x*.0011+sd,z*.0011),1.25)*(.4+.6*sstep(.1,.6,q));
        let h=top*(cliff+body*.42+rid*.62*sstep(.05,.4,q))*(.85+.3*vnoise(dx*2+sd,dz*2));
        const step=top*.07,fl=Math.floor(h/step)*step;h=h+(fl-h)*.35*sstep(.08,.3,q);   // the rock walls in layers (Reach's stepped cliffs)
        return h;};
      geos.push(patch(c.x,c.z,rad,coarse?72:110,coarse?20:30,hfn,top,Mf.r*3.2,.66));
      // waterfalls off the sea cliffs on the side that faces the level, mist where they land
      const face=Math.atan2(cx-c.x,cz-c.z);
      for(let k=0;k<(Mf.falls||0);k++){const a=face+(k-(Mf.falls-1)/2)*.27+(r()-.5)*.16,u=.86+r()*.06,fx=c.x+Math.sin(a)*rad*u,fz=c.z+Math.cos(a)*rad*u,hh=Math.max(50,hfn(fx,fz,u)*(.7+r()*.25));
        falls.push({x:fx+Math.sin(a)*10,z:fz+Math.cos(a)*10,h:hh,w:hh*.05+8+r()*14,ry:a,d:Math.hypot(fx-cx,fz-cz)});}
      if(Mf.tower){const a=face+.55,tx=c.x+Math.sin(a)*rad*.38,tz=c.z+Math.cos(a)*rad*.38,ty=hfn(tx,tz,.38)-20,th=top*.62,m=new THREE.Group();
        const d=Math.hypot(tx-cx,tz-cz),k=clamp(Math.pow(d/(Mf.r*3.2),.8),0,.9),wc=C(0xe8e8ec).lerp(HAZE,k*.75),gc=C(0xd9b25c).lerp(HAZE,k*.7),dc=C(0x8a96a8).lerp(HAZE,k*.8);
        const add=(g,col,y)=>{const ms=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,fog:false}));ms.position.y=y;m.add(ms);};
        add(new THREE.CylinderGeometry(9,24,th,6),wc,th/2);add(new THREE.CylinderGeometry(4,9,th*.25,6),wc,th+th*.125);add(new THREE.CylinderGeometry(.8,3,th*.12,6),wc,th*1.31);
        for(const f of[.3,.55,.78,.96]){add(new THREE.CylinderGeometry(26-f*16,27-f*16,5,6),gc,th*f);}
        add(new THREE.BoxGeometry(5,th*.7,1),dc,th*.45);
        m.position.set(tx,sea+ty,tz);m.userData.dyn=1;m.traverse(x=>{x.frustumCulled=false;});G.add(m);}}
    /* ---------- islands: plateaus on cliff walls (Forge World) or rounded hills ---------- */
    const I=o.islands;if(I&&I.n){for(let n=0;n<I.n;n++){
      const a=r()*Math.PI*2,d=I.r0+(I.r1-I.r0)*Math.pow(r(),.8),p=bearing(a,d),x=p.x,z=p.z,rad=140+r()*420*(d/I.r1+.4),top=I.h0+(I.h1-I.h0)*r()*r(),sd=r()*100,plat=r()<.75;
      geos.push(patch(x,z,rad,coarse?26:36,coarse?8:11,(wx,wz,u)=>{const q=1-u,w=.75+.5*vnoise((wx-x)*.008+sd,(wz-z)*.008);
        if(plat){const hh=top*sstep(.05,.2*w,q)*(.82+.18*fbm(wx*.006+sd,wz*.006))+top*.25*Math.pow(sstep(.3,1,q),2)*ridged(wx*.004,wz*.004+sd);return hh;}
        return top*sstep(0,.5*w,q)*(.45+.75*fbm((wx+sd)*.006,wz*.006))*(.6+.5*ridged(wx*.003+sd,wz*.003))+top*.35*Math.pow(q,2)*ridged(wx*.008+sd,wz*.008);},top*1.5,I.r1*2.4,0));}}
    /* ---------- coasts: a strip from the shore inland, along an arc ---------- */
    for(const K of(o.coasts||[])){const sd=r()*200,segA=Math.max(24,Math.round((K.a1-K.a0)*70)),segD=16,pos=[],col=[],idx=[],H=[];
      const span=K.a1-K.a0;
      for(let j=0;j<=segD;j++)for(let i=0;i<=segA;i++){const u=i/segA,a=K.a0+span*u,v=j/segD;
        const shore=K.r*(1+.06*(vnoise(a*3+sd,1.7)-.5)+.03*Math.sin(a*11+sd)),dd=shore+K.depth*v,x=cx+Math.sin(a)*dd,z=cz-Math.cos(a)*dd;
        const ends=sstep(0,.12,u)*sstep(1,.88,u),rise=sstep(0,.4,v)*(1-.35*sstep(.8,1,v));
        let h=(K.h*(.2+.8*Math.pow(ridged(x*.0005+sd,z*.0005),1.3))*rise+50*fbm(x*.002,z*.002)*sstep(0,.1,v)+K.h*.12*sstep(0,.06,v))*ends;if(v===0)h=-10;
        pos.push(x,sea+h,z);H.push(h);}
      for(let j=0;j<segD;j++)for(let i=0;i<segA;i++){const w=segA+1,a=j*w+i,b=a+1,c=a+w,d=c+1;idx.push(a,b,c,b,d,c);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
      const N=g.attributes.normal;for(let k=0;k<H.length;k++){const ny=N.getY(k),nl=N.getX(k)*sun.x+ny*sun.y+N.getZ(k)*sun.z,x=pos[k*3]-cx,z=pos[k*3+2]-cz;
        shade(tmp,H[k],K.h,1-ny,nl*.85+.3,Math.hypot(x,z),K.r*1.3,.7);col.push(tmp.r,tmp.g,tmp.b);}
      g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.deleteAttribute('normal');geos.push(g);}
    /* ---------- the skyline: a jagged ring right at the edge, nearly the haze's own colour ---------- */
    if(o.skyline){const S=o.skyline,n=360,pos=[],col=[],idx=[],sd=r()*50;
      for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,x=cx+Math.sin(a)*S.r,z=cz-Math.cos(a)*S.r;
        const h=S.h*Math.max(0,ridged(Math.sin(a)*3+sd,Math.cos(a)*3)*1.3-.35)*(.4+.6*vnoise(a*2+sd,3));
        pos.push(x,sea-40,z,x,sea+h,z);tmp.copy(HAZE).multiplyScalar(.94);tmp2.copy(HAZE).lerp(ROCK2,.14).multiplyScalar(.9);col.push(tmp.r,tmp.g,tmp.b,tmp2.r,tmp2.g,tmp2.b);}
      for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);
      const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));m.renderOrder=-2;m.userData.dyn=1;m.frustumCulled=false;G.add(m);}
    for(const g of geos){const m=new THREE.Mesh(g,mat);m.userData.dyn=1;m.frustumCulled=false;G.add(m);}
    /* ---------- the waterfalls: white streaks pouring down, a little haze over them with distance, mist at their feet ---------- */
    const U={t:{value:0},haze:{value:HAZE}};let mistTex=null;
    if(falls.length){const fm=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,
        vertexShader:'varying vec2 vUv;varying float vK;attribute float hk;void main(){vUv=uv;vK=hk;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:`varying vec2 vUv;varying float vK;uniform float t;uniform vec3 haze;
          float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
          void main(){float x=vUv.x,y=vUv.y;float edge=smoothstep(0.0,.18,x)*smoothstep(1.0,.82,x);
            float s=ns(vec2(x*18.0,y*3.0+t*1.6))*.6+ns(vec2(x*40.0,y*8.0+t*2.6))*.4;
            float a=edge*(.25+.6*s)*smoothstep(0.0,.06,1.0-y)*(.55+.45*smoothstep(.0,.3,y))*.85;
            vec3 c=mix(vec3(.96,.98,1.0),haze,vK);gl_FragColor=vec4(c,a*(1.0-vK*.55));}`});
      const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);mistTex=new THREE.CanvasTexture(c);
      for(const F of falls){const g=new THREE.PlaneGeometry(F.w,F.h,1,1),k=clamp(Math.pow(F.d/16000,.8),0,.7);g.setAttribute('hk',new THREE.Float32BufferAttribute([k,k,k,k],1));
        const m=new THREE.Mesh(g,fm);m.position.set(F.x,sea+F.h/2,F.z);m.rotation.y=F.ry;m.userData.dyn=1;m.frustumCulled=false;m.renderOrder=1;G.add(m);
        for(let j=0;j<3;j++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTex,color:C(0xffffff).lerp(HAZE,k),transparent:true,opacity:.55,depthWrite:false,fog:false}));
          sp.position.set(F.x+Math.sin(F.ry)*(8+j*10),sea+8+j*10,F.z+Math.cos(F.ry)*(8+j*10));sp.scale.setScalar(F.w*(1.6+j*.6));sp.userData.dyn=1;G.add(sp);}}}
    return{G,update(t){U.t.value=t;}};}
  return{build};
})();
