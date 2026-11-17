/* Tide City · the world round the city (Nov 16 2026, from Bryce's four concept paintings: "I like the depth then the mountains")
   - a second and third range behind the coastal hills: great snow-capped peaks over green lower slopes, then a far range
     fading into the night, so the land steps back in layers
   - waterfalls down the big range, with spray at their feet; cloud banks lying along the mountainsides (not a haze over the scene)
   - a ringed planet-sized moon and a small moon over the mountains
   - two lit coastal towns across the water, and lights along the shore
   - warm lights round every district's rim (the water picks them up: js/tide/01-scene.js)
   Everything here draws in a handful of draw calls and uses its own random numbers, so the city's layout (seeded) does not move. */
(function(){
  let s=91611;const rnd=()=>((s=(s*16807)%2147483647)-1)/2147483646,RR=(a,b)=>a+(b-a)*rnd();
  const TAU=Math.PI*2,phone=coarse;

  /* ---------- the great range (r 10.5k-19k) and the far range (r 19k-33k) ---------- */
  function range(o){
    const{A,RN,rin,rout}=o,N=(A+1)*(RN+1),pos=new Float32Array(N*3),col=new Float32Array(N*3),hs=new Float32Array(N);
    for(let i=0;i<=A;i++){const a=i/A*TAU,ca=Math.cos(a),sa=Math.sin(a);
      for(let j=0;j<=RN;j++){const jt=j/RN,r=rin+(rout-rin)*jt,x=ca*r,z=sa*r,h=o.h(x,z,jt,-sa);const k=i*(RN+1)+j;pos.set([x,h,z],k*3);hs[k]=h;}}
    const idx=[];for(let i=0;i<A;i++)for(let j=0;j<RN;j++){const a=i*(RN+1)+j,b=a+RN+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
    const nrm=g.attributes.normal.array,c=new THREE.Color();
    for(let k=0;k<N;k++){o.paint(c,hs[k],nrm[k*3+1],pos[k*3],pos[k*3+2]);col.set([c.r,c.g,c.b],k*3);}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mt=new THREE.MeshLambertMaterial({vertexColors:true,fog:false,emissive:C(o.fill||0x070d18)});
    // at night the moonlight alone left every slope the same grey-blue: part of each vertex colour glows on its own, so grass reads green and snow white
    mt.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vColor*'+(o.self||.12).toFixed(2)+';');};
    const m=new THREE.Mesh(g,mt);
    m.matrixAutoUpdate=false;scene.add(m);return{pos,hs,A,RN,rin,rout};}

  const sand=C(0xb9a77e),lush=C(0x37803a),lush2=C(0x245a2a),rock=C(0x4a515d),rock2=C(0x2a303a),snow=C(0xffffff),haze=C(0x24365a),haze2=C(0x2f4570);
  // the great range: tallest to the north, behind the Spear, and still a wall of peaks all round
  const BIG=range({A:phone?220:320,RN:phone?30:44,rin:10500,rout:19500,
    h(x,z,jt,north){const amp=.32+.68*sstep(-.6,.7,north);
      const ridge=fbm(x*.00016+3.2,z*.00016-1.4)*.85+Math.pow(ridged(x*.00022+7.1,z*.00022-3.3),1.6)*1.05+fbm(x*.0012,z*.0012)*.08;
      return ridge*5600*sstep(0,.38,jt)*(.7+.3*sstep(.45,1,jt))*amp-60;},
    paint(c,h,ny,x,z){const r=Math.hypot(x,z);
      c.copy(lush).lerp(lush2,fbm(x*.002,z*.002));c.lerp(sand,1-sstep(0,30,h));
      c.lerp(rock,sstep(1100,2100,h)).lerp(rock2,sstep(.85,.5,ny)*.7);
      const sl=4100+fbm(x*.0016,z*.0016)*900;c.lerp(snow,sstep(sl,sl+350,h)*sstep(.4,.7,ny));
      c.lerp(haze,sstep(11000,21000,r)*.22);}});
  // the far range: pale snow on dark slopes, fading toward the sky
  range({A:phone?160:240,RN:phone?12:18,rin:18500,rout:33000,fill:0x0b1424,self:.1,
    h(x,z,jt,north){const amp=.55+.45*sstep(-.4,.6,north);
      return (fbm(x*.00009-4,z*.00009+9)*.9+Math.pow(ridged(x*.00011-4,z*.00011+9),1.5)*.8)*7600*sstep(0,.45,jt)*amp-200;},
    paint(c,h,ny,x,z){c.copy(rock2).lerp(snow,sstep(5000,6000,h)*sstep(.35,.65,ny)*.8).lerp(haze2,.5);}});

  // the great range's height along one of its own grid lines (so the waterfalls lie exactly on its slope)
  // a point of a ring's grid (so the waterfalls lie exactly on its slope); NEAR is the coastal hills of js/tide/02-city.js
  const gridAt=(G,i,j)=>{const k=(((i%G.A)+G.A)%G.A)*(G.RN+1)+j;return[G.pos[k*3],G.hs[k],G.pos[k*3+2]];};
  const NEAR=window.TIDE_TERRAIN||BIG;

  /* ---------- waterfalls down the big range, facing the city ---------- */
  const fallMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,
    uniforms:{time:ocean.material.uniforms.time},
    vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vU;uniform float time;
      float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n1(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
      void main(){float x=abs(vU.x-.5)*2.0;
        float st=n1(vec2(vU.x*26.0,vU.y*9.0-time*2.2))*.6+n1(vec2(vU.x*60.0,vU.y*22.0-time*3.4))*.4;
        float a=(1.0-smoothstep(.35,1.0,x))*smoothstep(0.0,.04,vU.y)*(.2+.8*st*st)*(1.0-smoothstep(.93,1.0,vU.y)*.6);
        vec3 c=mix(vec3(.55,.68,.85),vec3(.92,.96,1.0),st);
        gl_FragColor=vec4(c*.85,a*.6);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`});
  const fallPos=[],fallUV=[],fallIdx=[],feet=[];
  // down the coastal hills' seaward face, from high on the slope to the water, as in the paintings
  const FALLS=phone?[-.13,.02,.12]:[-.24,-.13,-.04,.04,.12,.21];   // turns of the circle away from due north
  for(const f of FALLS){const G=NEAR;
    const i0=Math.round((.75+f)*G.A);   // a=3pi/2 is due north (-z)
    let j0=-1,j1=-1;for(let j=0;j<=G.RN;j++){const h=gridAt(G,i0,j)[1];if(j0<0&&h>25)j0=j;if(h<RR(900,1300))j1=j;else if(j0>=0)break;}
    if(j0<0||j1<=j0+1)continue;
    const w=RR(80,140),base=fallPos.length/3,L=[];let len=0;
    for(let j=j1;j>=j0-1;j--){const p=gridAt(G,i0,j);if(L.length){const q=L[L.length-1];len+=Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);}L.push([...p,len]);}
    const a=i0/G.A*TAU,tx=-Math.sin(a),tz=Math.cos(a),ix=-Math.cos(a),iz=-Math.sin(a);
    L.forEach((p,n)=>{for(const sd of[-1,1]){fallPos.push(p[0]+tx*w/2*sd+ix*25,p[1]+10,p[2]+tz*w/2*sd+iz*40);fallUV.push(sd<0?0:1,1-p[3]/len);}
      if(n){const b=base+(n-1)*2;fallIdx.push(b,b+1,b+2,b+1,b+3,b+2);}});
    const ft=L[L.length-1];feet.push([ft[0]+ix*90,Math.max(ft[1],0),ft[2]+iz*90,w]);
  }
  if(fallPos.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(fallPos,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(fallUV,2));g.setIndex(fallIdx);const m=new THREE.Mesh(g,fallMat);m.renderOrder=2;scene.add(m);}

  /* ---------- cloud banks along the mountainsides and spray at the waterfalls' feet: one draw call ---------- */
  const cloudTex=(()=>{const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x=cv.getContext('2d');
    for(let n=0;n<44;n++){const px=RR(30,226),py=RR(58,84)-Math.sin((px-30)/196*Math.PI)*14,r=RR(26,52);
      const gr=x.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,'rgba(255,255,255,.22)');gr.addColorStop(.6,'rgba(255,255,255,.1)');gr.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=gr;x.beginPath();x.arc(px,py,r,0,TAU);x.fill();}
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t;})();
  const cP=[],cU=[],cC=[],cI=[];
  function cloud(x,y,z,w,h,col){const a=Math.atan2(x,z),rx=Math.cos(a)*w/2,rz=-Math.sin(a)*w/2,b=cP.length/3;
    cP.push(x-rx,y-h/2,z-rz, x+rx,y-h/2,z-rz, x-rx,y+h/2,z-rz, x+rx,y+h/2,z-rz);cU.push(0,0,1,0,0,1,1,1);
    for(let k=0;k<4;k++)cC.push(col.r,col.g,col.b);cI.push(b,b+1,b+2,b+1,b+3,b+2);}
  const cloudC=C(0x7286aa),sprayC=C(0x7d90b0);
  // a bank where the big range's slope crosses the bank's height, pulled out in front of it
  // half low on the coastal hills, half high on the great range, above the hills so they show
  for(let n=0,N=phone?22:38;n<N;n++){const G=n%2?BIG:NEAR,low=G===NEAR;
    const north=rnd()<.7,a=north?Math.PI*1.5+RR(-1.15,1.15):RR(0,TAU),i=Math.round(a/TAU*G.A),y=low?RR(450,1300):RR(2600,4200);
    let j=0;while(j<G.RN&&gridAt(G,i,j)[1]<y)j++;if(j>=G.RN)continue;
    const p=gridAt(G,i,j),k=1-RR(low?150:300,low?400:800)/Math.hypot(p[0],p[2]);
    cloud(p[0]*k,y,p[2]*k,low?RR(2200,3800):RR(4000,7000),low?RR(380,620):RR(800,1300),cloudC);}
  for(const f of feet)for(let n=0;n<2;n++)cloud(f[0]+RR(-60,60),f[1]+RR(50,120),f[2]+RR(-60,60),f[3]*RR(3,4.5),RR(140,220),sprayC);
  {const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(cP,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(cU,2));
   g.setAttribute('color',new THREE.Float32BufferAttribute(cC,3));g.setIndex(cI);
   const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:cloudTex,vertexColors:true,transparent:true,opacity:.6,depthWrite:false,fog:false,side:THREE.DoubleSide}));
   m.renderOrder=3;scene.add(m);}

  /* ---------- a great moon and a small one over the mountains (they ride with the sky, so they stay on the horizon) ---------- */
  function moonTex(o){const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;const x=cv.getContext('2d'),R=S/2-4;
    x.save();x.beginPath();x.arc(S/2,S/2,R,0,TAU);x.clip();
    x.fillStyle=o.base;x.globalAlpha=1;x.fillRect(0,0,S,S);
    for(let n=0;n<o.bands;n++){x.fillStyle=`rgba(${o.band},${RR(.04,.16)})`;const y=RR(0,S);x.fillRect(0,y,S,RR(4,30));}
    // mottled ground: many soft dark and light patches rather than drawn circles
    for(let n=0;n<o.craters*4;n++){const cx=RR(0,S),cy=RR(0,S),r=RR(6,o.big*2),g=x.createRadialGradient(cx,cy,0,cx,cy,r),dk=rnd()<.6;
      g.addColorStop(0,dk?`rgba(25,35,55,${RR(.06,.16)})`:`rgba(235,242,255,${RR(.04,.1)})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);}
    // night side: lit from the lower right, a soft terminator
    const g=x.createRadialGradient(S*.78,S*.72,R*.2,S*.62,S*.6,R*1.55);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.45,'rgba(4,8,18,.25)');g.addColorStop(.8,'rgba(4,8,18,.85)');g.addColorStop(1,'rgba(4,8,18,.97)');
    x.fillStyle=g;x.fillRect(0,0,S,S);x.restore();
    // a thin bright rim on the lit edge
    x.strokeStyle='rgba(200,225,255,.5)';x.lineWidth=3;x.beginPath();x.arc(S/2,S/2,R-1,-.35,1.9);x.stroke();
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t;}
  function moon(tex,az,el,size,dist){const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,fog:false,color:C(0x9fb2cc)}));
    const ce=Math.cos(el);m.position.set(Math.sin(az)*ce*dist,Math.sin(el)*dist,-Math.cos(az)*ce*dist);m.lookAt(0,0,0);m.renderOrder=-1;sky.add(m);return m;}
  moon(moonTex({base:'#a8bfd9',band:'210,225,240',bands:22,craters:90,big:34}),-.95,.36,11000,36000);
  moon(moonTex({base:'#b8c2cc',band:'240,240,240',bands:4,craters:60,big:22}),-.42,.5,1500,36000);

  /* ---------- the coast: two lit towns across the water, and lights along the shore ---------- */
  const T=window.TIDE_TERRAIN;
  if(T){const{pos,hs,nrm,A,RN}=T,at=(i,j)=>(((i%A)+A)%A)*(RN+1)+j;
    const lights=[],lc=[],warm=C(0xffc27a),cool=C(0xbfe2ff);
    // shore lights: every few steps round the ring, where the land first rises out of the water
    for(let i=0;i<A;i+=phone?3:2){for(let j=0;j<RN;j++){const k=at(i,j);if(hs[k]>3){const p=k*3;
      if(!inYard(pos[p],pos[p+2],200)){lights.push(pos[p],hs[k]+8,pos[p+2]);const c=rnd()<.8?warm:cool;lc.push(c.r,c.g,c.b);}break;}}}
    // the towns: low-ground cells near the shore at two headings (west, and north-east toward the big falls)
    const homes=[];
    for(const[a0,n0] of[[Math.PI*1.02,phone?90:160],[Math.PI*1.82,phone?70:120]]){const ic=Math.round(a0/TAU*A);
      for(let t=0;t<n0*6&&homes.length<9999;t++){const i=ic+Math.round(RR(-9,9)),j=1+Math.floor(RR(0,7)),k=at(i,j);
        if(hs[k]<6||hs[k]>140||nrm[k*3+1]<.93)continue;const p=k*3,x=pos[p]+RR(-14,14),z=pos[p+2]+RR(-14,14);if(inYard(x,z,300))continue;
        const tall=rnd()<.25,h=tall?RR(90,320):RR(25,90),w=RR(18,40);homes.push(mat4(x,hs[k]-4,z,w,h,w*RR(.7,1.3),0,rnd()*3,0));
        if(rnd()<.5){lights.push(x,hs[k]+h+6,z);lc.push(warm.r,warm.g,warm.b);}
        if(homes.length%n0===0)break;}}
    if(homes.length){const im=new THREE.InstancedMesh(unitBox,towerMat,homes.length);const tint=[0xffffff,0xeef3f7,0xe2ebf2,0xd7e6ee,0xf3efe6].map(C);homes.forEach((m,i)=>{im.setMatrixAt(i,m);im.setColorAt(i,tint[i%5]);});scene.add(im);}   // (setColorAt: the tower look is shared with the city's towers, which carry a colour each)
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lights,3));g.setAttribute('color',new THREE.Float32BufferAttribute(lc,3));
    scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:55,map:glow,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})));}

  /* ---------- the districts' warm rims, and the lights the water reflects ---------- */
  {const rimMat=new THREE.MeshBasicMaterial({color:C(0xffc888).multiplyScalar(1.6),fog:false});
   const rim=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.03,1.035,1,96,1,true),rimMat,PLATS.length);
   PLATS.forEach((P,i)=>rim.setMatrixAt(i,mat4(P.x,1.2,P.z,P.r,1.8,P.r)));scene.add(rim);
   const lp=[];for(const P of PLATS){const n=Math.round(TAU*P.r/48);for(let k=0;k<n;k++){const a=k/n*TAU;lp.push(P.x+Math.cos(a)*P.r*1.045,5,P.z+Math.sin(a)*P.r*1.045);}}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));
   scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:22,map:glow,color:C(0xffd29a).multiplyScalar(1.4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
   const U=ocean.material.uniforms.plats.value;PLATS.slice(0,16).forEach((P,i)=>U[i].set(P.x,P.z,P.r*1.04,1));}
})();
