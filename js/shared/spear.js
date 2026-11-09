/* The Spear of Destiny, the Holy Lance: Elyra's landmark (Nov 4 2026, Bryce: the menu needs "our own" symmetrical structure, the way
   Halo has its ring, and it should be in the game too). One build, used by Tide City (js/tide/11-story.js, standing over the city core)
   and by the main menu's backdrop (js/menu/halo-scene.js). Lore (docs/LORE-COMPLETE.md): built in the Collapse from human and captured
   Herald technology; Tide City was built around it.

   So it is two things made into one: the HUMAN lance (the old stone plinth, the pale shaft with its gold collars and veins, the gold
   blade and crossguard: the Keepers' relic, kept from before) held in a HERALD clasp (four great swept arms of the same white jointless
   stone as the white city, rising from the plinth's corners and closing on the shaft like a hand, a cyan Herald light running inside
   each one) with three broken Herald rings hovering round the upper shaft, turning slowly in opposite directions. Seen from far off:
   a tall gold-tipped needle in a white crown of arms, ringed with light. Symmetrical from every side.

   Nov 8 2026 (Bryce: "up the graphics for the Spear of Destiny by like 200-400%... or the best without affecting performance"):
   the same shapes and the same footprint (so collisions, the plinth guard and the Host's paths are untouched), rebuilt in detail:
   - a fluted shaft (lathed, 40 sides, a swell at its foot) with panel seams, its six veins now light running in the flutes, pulses
     climbing toward the head (brighter as the Spear charges)
   - laid-stone plinth with block joints and per-block colour, chamfered steps, eight lamps at its top corners
   - curved buttress fins with lit edges in place of the plain slabs
   - a real blade: a flattened diamond with a glowing fuller and bright edges, an ornate socket, swept crossguard wings with spurs,
     and a gem at its heart
   - the Herald arms smoother (twice the steps, a finer section) with marbled white stone and faint seams of light
   - the rings beveled and capped at their breaks, light running round them, a glow at every break, and white shards drifting
     round the clasp
   Everything that shares a material is merged into one mesh, so for all the extra detail it draws in fewer calls than before.

   SPEAR_KIT.build({C}) → {group, mats, boxes, top, tick(t, k)}. Units: metres, base at y 0, tip at 1560 (Tide City's SPEAR_H).
   C: colour function (Tide City passes its sRGB→linear one). boxes: extra collision boxes for the arms, local to the group.
   tick(t, k): turns the rings and breathes the light; k (0..1+) is how lit it is (Tide City drives it from the Spear's charge). */
const SPEAR_KIT=(()=>{
  let GLOWT=null;
  function glowTex(){if(GLOWT)return GLOWT;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.22,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
    return GLOWT=new THREE.CanvasTexture(c);}

  /* one mesh per material: parts are [geometry, matrix, flat?] */
  function merge(parts){let n=0;
    const gs=parts.map(([g,m,flat])=>{let q=g.index?g.toNonIndexed():g.clone();if(m)q.applyMatrix4(m);if(flat||!q.attributes.normal)q.computeVertexNormals();n+=q.attributes.position.count;return q;});
    const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let o=0;
    for(const q of gs){const c=q.attributes.position.count;P.set(q.attributes.position.array,o*3);N.set(q.attributes.normal.array,o*3);
      if(q.attributes.uv)U.set(q.attributes.uv.array,o*2);o+=c;q.dispose();}
    const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P,3));G.setAttribute('normal',new THREE.BufferAttribute(N,3));
    G.setAttribute('uv',new THREE.BufferAttribute(U,2));G.computeBoundingSphere();return G;}
  const _q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3();
  const M=(x,y,z,rx,ry,rz,sx,sy,sz)=>new THREE.Matrix4().compose(new THREE.Vector3(x||0,y||0,z||0),_q.setFromEuler(_e.set(rx||0,ry||0,rz||0)),_s.set(sx||1,sy==null?(sx||1):sy,sz==null?(sx||1):sz));
  const RY=a=>new THREE.Matrix4().makeRotationY(a);

  /* surface detail without textures: a height (bumped in the shader from its screen derivatives, faded out where it would shimmer),
     colour and light, all from the surface's own position (metres, Spear space) */
  const NOISE=`float spH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float spN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(spH(i),spH(i+vec3(1,0,0)),f.x),mix(spH(i+vec3(0,1,0)),spH(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(spH(i+vec3(0,0,1)),spH(i+vec3(1,0,1)),f.x),mix(spH(i+vec3(0,1,1)),spH(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
  function detail(mat,key,U,o){
    mat.extensions={derivatives:true};
    mat.onBeforeCompile=sh=>{sh.uniforms.uT=U.t;sh.uniforms.uK=U.k;
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOP=position;');
      let f=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;uniform float uT,uK;\n'+NOISE+'\nvec3 spE=vec3(0.);float spHt=0.;');
      f=f.replace('void main() {','void main() {\nvec3 p=vOP;\n'+(o.pre||''));
      if(o.col)f=f.replace('#include <color_fragment>','#include <color_fragment>\n'+o.col);
      if(o.h)f=f.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        {float h=${o.h};vec3 pdx=dFdx(-vViewPosition),pdy=dFdy(-vViewPosition);vec2 dh=vec2(dFdx(h),dFdy(h));
         float fade=1.-smoothstep(${o.fade||'.5,2.5'},length(fwidth(p)));
         vec3 spA=cross(pdy,normal),spB=cross(normal,pdx);float det=dot(pdx,spA);vec3 grad=sign(det)*(dh.x*spA+dh.y*spB)*fade;
         normal=normalize(abs(det)*normal-grad);}`);
      if(o.rough)f=f.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n'+o.rough);
      f=f.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=spE;');
      sh.fragmentShader=f;};
    mat.customProgramCacheKey=()=>'spear2-'+key;return mat;}

  function build(o){o=o||{};const C=o.C||(h=>new THREE.Color(h)),g=new THREE.Group(),V=(x,y,z)=>new THREE.Vector3(x,y,z),V2=(x,y)=>new THREE.Vector2(x,y);
    const U={t:{value:0},k:{value:.5}};
    const mats={
      stone:new THREE.MeshStandardMaterial({color:C(0x4d463d),roughness:.9,metalness:.05}),
      gold:new THREE.MeshStandardMaterial({color:C(0xe2a743),roughness:.3,metalness:.88}),
      shaft:new THREE.MeshStandardMaterial({color:C(0xebe4d2),roughness:.4,metalness:.3}),
      glow:new THREE.MeshStandardMaterial({color:C(0x2a2418),emissive:C(0xffc860),emissiveIntensity:.5,roughness:.4}),
      // the Herald parts: white stone with no joins, and their own cold light
      white:new THREE.MeshStandardMaterial({color:C(0xe8e6e0),roughness:.42,metalness:.1}),
      cyan:new THREE.MeshStandardMaterial({color:C(0x0c1a1e),emissive:C(0x8ff0ff),emissiveIntensity:1.1,roughness:.4})};
    mats.blade=mats.gold.clone();
    const GOLDL='vec3(1.,.78,.38)',CYANL='vec3(.56,.94,1.)';

    // the plinth's laid stone: blocks in offset courses, each its own shade, the joints cut in
    detail(mats.stone,'stone',U,{pre:`float pa=atan(p.x,p.z),pu=pa*max(length(p.xz),1.),pv=p.y;float row=floor(pv/5.5);pu+=mod(row,2.)*4.5;
        vec2 bl=vec2(pu/9.,pv/5.5),bf=fract(bl),bi=floor(bl);float jd=min(min(bf.x,1.-bf.x)*9.,min(bf.y,1.-bf.y)*5.5);float bh=spH(vec3(bi,3.));`,
      h:'-.35*(1.-smoothstep(.15,.55,jd))+(spN(p*.6)-.5)*.12',
      col:'diffuseColor.rgb*=(.82+.32*bh)*(.9+.2*spN(p*.15))*mix(.55,1.,smoothstep(.1,.5,jd));'});
    // the shaft: forty sides fluted in twelve, panel seams every 52 m, the six veins of light in the flutes with pulses climbing them
    detail(mats.shaft,'shaft',U,{pre:`float sa=atan(p.z,p.x),fl=cos(sa*12.),sd=abs(p.y-52.*floor(p.y/52.+.5));
        float vein=smoothstep(.9,.985,cos(sa*6.))*step(70.,p.y)*(1.-step(1300.,p.y));`,
      h:'.55*fl-.5*(1.-smoothstep(.25,.9,sd))',fade:'.8,3.',
      col:'diffuseColor.rgb*=(.78+.22*smoothstep(-1.,1.,fl))*mix(.7,1.,smoothstep(.2,.9,sd))*(.94+.12*spN(p*vec3(.4,.02,.4)));',
      rough:'roughnessFactor=mix(roughnessFactor,.18,smoothstep(.3,1.,fl));'});
    // (the veins' light is added below, in the glow material's place: it follows mats.glow's intensity)
    mats.shaft.onBeforeCompile=(prev=>sh=>{prev(sh);sh.fragmentShader=sh.fragmentShader.replace('totalEmissiveRadiance+=spE;',
      `{float pulse=pow(.5+.5*sin(p.y*.012-uT*1.6),10.)+pow(.5+.5*sin(p.y*.004-uT*.7+1.3),14.)*.6;
        totalEmissiveRadiance+=${GOLDL}*vein*uK*(1.6+3.5*pulse);}`);})(mats.shaft.onBeforeCompile);
    // the blade: a glowing fuller down its middle, bright honed edges, hammered gold elsewhere
    detail(mats.blade,'blade',U,{pre:`float bz=abs(p.z)/.42,xr=abs(p.x)/max(abs(p.x)+bz,.001);float bon=step(1330.,p.y);
        float ful=(1.-smoothstep(.05,.13,xr))*smoothstep(1345.,1380.,p.y)*(1.-smoothstep(1540.,1585.,p.y));`,
      h:'bon*(-1.6*ful+(spN(p*.2)-.5)*.08)',
      col:'diffuseColor.rgb*=1.-.35*ful;',
      rough:'roughnessFactor=mix(roughnessFactor,.12,bon*smoothstep(.85,.97,xr));'});
    mats.blade.onBeforeCompile=(prev=>sh=>{prev(sh);sh.fragmentShader=sh.fragmentShader.replace('totalEmissiveRadiance+=spE;',
      `totalEmissiveRadiance+=${GOLDL}*(ful*(1.2+uK*2.2)*(.75+.25*sin(p.y*.05-uT*2.))+bon*smoothstep(.95,.995,xr)*.35);`);})(mats.blade.onBeforeCompile);
    // gold: a faint hammered surface
    detail(mats.gold,'gold',U,{h:'(spN(p*.25)-.5)*.06',col:'diffuseColor.rgb*=.92+.16*spN(p*.08);'});
    // Herald white: marbled, with faint seams of light every 48 m (round each ring's middle, across the arms)
    detail(mats.white,'white',U,{pre:'float wm=spN(p*.035)*.6+spN(p*.12)*.4,ws=1.-smoothstep(.12,.45,abs(mod(p.y+24.,48.)-24.));',
      h:'-.3*ws+(wm-.5)*.25',
      col:'diffuseColor.rgb*=.9+.14*wm;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.86,.93,1.),smoothstep(.55,.8,wm));',
      rough:'roughnessFactor=mix(roughnessFactor,.25,wm*.6);'});
    mats.white.onBeforeCompile=(prev=>sh=>{prev(sh);sh.fragmentShader=sh.fragmentShader.replace('totalEmissiveRadiance+=spE;',
      `totalEmissiveRadiance+=${CYANL}*ws*.22*(.6+.4*sin(uT*.8+p.x*.01+p.z*.01));`);})(mats.white.onBeforeCompile);
    // the Herald light: streaks running round the rings and up the arms
    detail(mats.cyan,'cyan',U,{pre:'float cs=pow(.5+.5*sin(atan(p.z,p.x)*9.+p.y*.05-uT*1.4),6.);',col:''});
    mats.cyan.onBeforeCompile=(prev=>sh=>{prev(sh);sh.fragmentShader=sh.fragmentShader.replace('totalEmissiveRadiance+=spE;',
      'totalEmissiveRadiance+=totalEmissiveRadiance*cs*.9;');})(mats.cyan.onBeforeCompile);

    const parts={stone:[],gold:[],blade:[],shaft:[],glow:[],white:[],cyan:[]};
    const put=(k,geo,m,flat)=>parts[k].push([geo,m,flat]);
    const lathe=(pts,segs,phi)=>new THREE.LatheGeometry(pts.map(([r,y])=>V2(r,y)),segs,phi||0);

    /* ---------- the human lance ---------- */
    // plinth: three chamfered octagonal steps of laid stone (the same outline as before) with gold bands at each edge
    put('stone',lathe([[0,0],[114,0],[114,2],[112,4],[99,24],[98,25],[96,25],[95,26],[84,46],[83,47],[82,47],[81,48],[70,68],[69,69],[0,69]],8),M(0,0,0,0,Math.PI/8),true);
    for(const [y,r] of[[25,99],[47,85],[69,71]])put('gold',new THREE.CylinderGeometry(r,r+.6,3,8),M(0,y,0,0,Math.PI/8),true);
    // eight lamps at the top step's corners
    const lampAt=[];
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2+Math.PI/8,x=Math.sin(a)*64,z=Math.cos(a)*64;
      put('gold',lathe([[0,0],[3.4,0],[3.4,1.2],[1.6,2],[1.4,7],[3.6,9],[4.2,11],[0,11]],8),M(x,69,z));lampAt.push(V(x,82,z));}
    // eight curved buttress fins leaning in against the shaft, a line of light along each outer edge
    {const fin=new THREE.Shape();fin.moveTo(34,62);fin.lineTo(98,62);fin.bezierCurveTo(96,150,70,270,30,384);fin.lineTo(26,384);fin.bezierCurveTo(30,250,33,140,34,62);
      const finGeo=new THREE.ExtrudeGeometry(fin,{depth:8,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.2,bevelSegments:1,curveSegments:18}).translate(0,0,-4);
      const edge=new THREE.CubicBezierCurve3(V(100.4,64,0),V(98.4,150,0),V(72.2,270,0),V(32,386,0));
      const edgeGeo=new THREE.TubeGeometry(edge,28,1.3,5);
      for(let k=0;k<8;k++){const r=RY(-k/8*Math.PI*2);put('stone',finGeo,r);put('glow',edgeGeo,r);}}
    // the shaft: lathed, forty sides, swelling at its foot and a little through its length (fluting, seams and veins are in its material)
    {const pts=[];for(let i=0;i<=72;i++){const y=60+i/72*1260,t=(y-70)/1240;pts.push([34-22*t+3.5*t*(1-t)+11*Math.exp(-Math.max(0,y-60)/16),y]);}
      pts.unshift([0,60]);pts.push([0,1320]);put('shaft',lathe(pts,40));}
    // gold collars: three ridges each, a ring of light on the middle one
    for(const [y,r] of[[300,32],[620,27],[940,22],[1250,16]]){
      put('gold',lathe([[r-1,y-11],[r+2,y-10],[r+5,y-8.5],[r+5,y-5],[r+3,y-4],[r+3.2,y-2],[r+7,y-1.2],[r+7,y+1.2],[r+3.2,y+2],[r+3,y+4],[r+5,y+5],[r+5,y+8.5],[r+2,y+10],[r-1,y+11]],40));
      put('glow',new THREE.TorusGeometry(r+7.6,1.1,6,48),M(0,y,0,Math.PI/2));}
    // the lance head: an ornate socket, the swept crossguard with its spurs and a gem at its heart, and the blade
    put('gold',lathe([[11,1286],[14,1290],[16,1296],[15.4,1299],[19,1303],[19,1309],[15.6,1312],[17,1316],[17.6,1322],[13,1328],[10,1334]],32));
    {const sec=new THREE.Shape();sec.moveTo(0,-5);sec.lineTo(3.4,0);sec.lineTo(0,5);sec.lineTo(-3.4,0);sec.lineTo(0,-5);
      class P3 extends THREE.Curve{constructor(P){super();this.c=new THREE.CatmullRomCurve3(P);}getPoint(t,o){return this.c.getPoint(t,o);}}
      for(const s of[-1,1]){
        const wing=new THREE.ExtrudeGeometry(sec,{steps:32,bevelEnabled:false,extrudePath:new P3([V(s*10,1318,0),V(s*46,1312,0),V(s*84,1322,0),V(s*108,1348,0),V(s*118,1374,0)])});
        put('gold',wing);
        const tip=new THREE.ConeGeometry(4.6,30,4);tip.translate(0,15,0);put('gold',tip,M(s*118,1372,0,0,0,-s*.36));
        const spur=new THREE.ExtrudeGeometry(sec,{steps:20,bevelEnabled:false,extrudePath:new P3([V(s*12,1312,0),V(s*36,1300,0),V(s*54,1284,0),V(s*60,1268,0)])});
        put('gold',spur,M(0,0,0,0,0,0,1,1,.75));
        const st=new THREE.ConeGeometry(3.4,18,4);st.translate(0,-9,0);put('gold',st,M(s*60,1270,0,0,0,s*.25));}
      put('gold',new THREE.OctahedronGeometry(15,0),M(0,1318,0,0,Math.PI/4,0,1,.75,1));
      for(const s of[-1,1])put('glow',new THREE.SphereGeometry(5,12,8),M(0,1318,s*10.6,0,0,0,1,1,.6));}
    // the blade: a flattened diamond, wide across the crossguard's line, tapering to the point at 1612
    {const pts=[[0,1324]];for(let i=0;i<=40;i++){const y=1326+i/40*286,t=(y-1326)/286;
        const r=t<.24?10+20*Math.sin(t/.24*Math.PI/2):30*Math.pow(1-(t-.24)/.76,.82)*(1-.06*Math.sin((t-.24)/.76*Math.PI));pts.push([Math.max(r,0),y]);}
      put('blade',lathe(pts,4),M(0,0,0,0,0,0,1,1,.42),true);}

    /* ---------- the Herald clasp: four swept arms from the plinth's corners, closing on the shaft ---------- */
    class Path extends THREE.Curve{constructor(P){super();this.c=new THREE.CatmullRomCurve3(P);}getPoint(t,o){return this.c.getPoint(t,o);}}
    // the arm's line in its own vertical plane (x out from the shaft, y up): out and up from the plinth, then in to grip the shaft
    const ARM=[V(118,48,0),V(196,200,0),V(232,360,0),V(206,520,0),V(118,640,0),V(40,700,0)];
    const blade=new THREE.Shape();
    [[0,-38],[8,-29],[12.5,-18],[14,-6],[14,6],[12.5,18],[8,29],[0,38],[-8,29],[-12.5,18],[-14,6],[-14,-6],[-12.5,-18],[-8,-29]].forEach(([x,y],i)=>i?blade.lineTo(x,y):blade.moveTo(x,y));blade.lineTo(0,-38);
    const armGeo=new THREE.ExtrudeGeometry(blade,{steps:130,bevelEnabled:false,extrudePath:new Path(ARM)});
    const lineGeo=new THREE.TubeGeometry(new Path(ARM.map(p=>p.clone().multiplyScalar(.985).setY(p.y))),130,2.2,6);
    const fingerGeo=new THREE.ConeGeometry(9,70,6);
    for(let k=0;k<4;k++){const r=RY(-(k/4*Math.PI*2+Math.PI/4));
      put('white',armGeo,r);
      // the light inside the arm shows along its inner edge
      put('cyan',lineGeo,r.clone().multiply(M(-14,0,0)));
      // the foot: a white wedge set into the plinth's corner, chamfered
      put('white',new THREE.CylinderGeometry(19,26,52,4,1),r.clone().multiply(M(122,44,0,0,Math.PI/4,-.2,1,1,.8)),true);
      // the grip: two short fingers wrapping the shaft either side of the arm's end
      for(const s of[-1,1])put('white',fingerGeo,r.clone().multiply(M(30,712,s*20,s*.9,0,Math.PI)));}
    // the collar the four arms meet at: white bands with cyan seams
    put('white',lathe([[38,672],[46,676],[48,684],[48,688],[44,690],[46,694],[48,700],[48,714],[44,720],[40,724]],8),M(0,0,0,0,Math.PI/8),true);
    put('cyan',new THREE.CylinderGeometry(49,49,3,8,1,true),M(0,686,0,0,Math.PI/8));
    put('cyan',new THREE.CylinderGeometry(45.6,45.6,2,8,1,true),M(0,691.6,0,0,Math.PI/8));

    /* ---------- three broken Herald rings hovering round the upper shaft ---------- */
    const rings=[],sprites=[],glowT=glowTex();
    const sprite=(col,sc,par,p,op)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowT,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op==null?1:op}));
      s.position.copy(p);s.scale.setScalar(sc);(par||g).add(s);sprites.push(s);return s;};
    [[840,150,1],[1030,118,-1],[1210,88,1]].forEach(([y,r,dir],i)=>{const R=new THREE.Group();R.position.y=y;R.userData.dir=dir*(.06+i*.025);g.add(R);rings.push(R);
      const n=6,arc=Math.PI*2/n*.78,wp=[],cp=[],up=V(0,1,0);
      for(let k=0;k<n;k++){const m=M(0,0,0,Math.PI/2,0,k/n*Math.PI*2);
        wp.push([new THREE.TorusGeometry(r,8,10,44,arc),m]);
        // a flat outer band with a step, so the section reads as cut, not a pipe
        wp.push([new THREE.TorusGeometry(r+7.5,2.4,4,44,arc),m.clone().multiply(M(0,0,0,0,0,0,1,1,1.9))]);
        cp.push([new THREE.TorusGeometry(r-6.5,1.6,5,44,arc*.92),m.clone().multiply(M(0,0,0,0,0,arc*.04))]);
        cp.push([new THREE.TorusGeometry(r+10,.9,4,44,arc*.9),m.clone().multiply(M(0,0,0,0,0,arc*.05))]);
        // sharp caps where each segment breaks off, pointing into the gap
        for(const [a0,sg] of[[0,-1],[arc,1]]){const pos=V(Math.cos(a0)*r,Math.sin(a0)*r,0).applyMatrix4(m),tan=V(-Math.sin(a0)*sg,Math.cos(a0)*sg,0).transformDirection(m);
          const cone=new THREE.ConeGeometry(8.2,22,10);cone.translate(0,11,0);
          wp.push([cone,new THREE.Matrix4().compose(pos,new THREE.Quaternion().setFromUnitVectors(up,tan),V(1,1,1))]);}}
      // a white node at each break, its light round it
      for(let k=0;k<n;k++){const a=(k+.89)/n*Math.PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r;
        wp.push([new THREE.OctahedronGeometry(7,0),M(x,0,z,0,a,0,1,1.8,1)]);
        wp.push([new THREE.OctahedronGeometry(3.6,0),M(x,17,z,0,a,0,1,1.4,1)],[new THREE.OctahedronGeometry(3.6,0),M(x,-17,z,0,a,0,1,1.4,1)]);
        sprite(C(0x9ff4ff),46,R,V(x,0,z),.9);}
      const wm=new THREE.Mesh(merge(wp),mats.white);wm.castShadow=wm.receiveShadow=true;R.add(wm);
      R.add(new THREE.Mesh(merge(cp),mats.cyan));});

    // white shards drifting round the clasp (Herald stone broken off and held in its field)
    const shards=new THREE.Group();g.add(shards);
    {const sp=[];let s=7;const rr=()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};
      for(let i=0;i<30;i++){const a=i/30*Math.PI*2+rr()*.2,d=62+rr()*80,y=735+rr()*80,sz=2.5+rr()*6;
        sp.push([i%3?new THREE.OctahedronGeometry(sz,0):new THREE.TetrahedronGeometry(sz*1.3,0),M(Math.cos(a)*d,y,Math.sin(a)*d,rr()*3,rr()*3,rr()*3,1,1.4+rr(),1),true]);}
      const sm=new THREE.Mesh(merge(sp),mats.white);sm.castShadow=true;shards.add(sm);}
    // the lamps' light, and the gem's
    for(const p of lampAt)sprite(C(0xffc070),26,g,p,.85);

    for(const k in parts){if(!parts[k].length)continue;const m=new THREE.Mesh(merge(parts[k]),mats[k]);m.castShadow=m.receiveShadow=k!=='glow'&&k!=='cyan';g.add(m);}

    // collision for the arms (each a box low and a box high, along the arm), local to the group; the rest is Tide City's own
    const boxes=[];for(let k=0;k<4;k++){const a=k/4*Math.PI*2+Math.PI/4,cx=Math.cos(a),cz=Math.sin(a);
      boxes.push({c:V(cx*200,240,cz*200),h:V(36,190,36)},{c:V(cx*170,560,cz*170),h:V(40,130,40)});}
    const c0=mats.cyan.emissiveIntensity;
    function tick(t,k){for(const R of rings)R.rotation.y=t*R.userData.dir;
      shards.rotation.y=-t*.035;shards.position.y=Math.sin(t*.4)*3;
      U.t.value=t;U.k.value=mats.glow.emissiveIntensity;
      // the Herald light breathes slowly and runs a little hotter as the Spear wakes
      const kk=k==null?1:k;mats.cyan.emissiveIntensity=c0*(.75+.25*Math.sin(t*.7))*(1+.6*Math.max(0,kk-1));
      for(const s of sprites)if(s.parent!==g)s.material.opacity=.55+.35*Math.min(1.5,kk)*(.8+.2*Math.sin(t*1.3+s.position.x));}
    // reflections, where a scene has none of its own (the menu): pass a PMREM'd environment texture
    function setEnv(env,k){k=k||1;for(const [n,f] of[['gold',1],['blade',1],['shaft',.45],['white',.3],['stone',.35]]){mats[n].envMap=env;mats[n].envMapIntensity=k*f;mats[n].needsUpdate=true;}}
    return{group:g,mats,boxes,top:1560,tick,setEnv};}
  return{build};
})();
