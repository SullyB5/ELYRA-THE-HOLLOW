/* Elyra · mountains (Nov 17 2026, Bryce: the mountains in the back needed better detail, the waterfalls fixed, and "the mountain glitch
   in the back" gone). Shared by the level (js/tide/02-city.js, js/tide/02b-world.js) and the menu (js/shared/world-kit.js).

   MOUNTAIN_LOOK(material, o) patches a MeshStandardMaterial with vertex colours so the slopes are coloured by the shape of the land,
   per pixel, instead of by the colour at each (far apart) vertex:
   - bare rock wherever the ground is steep or above the tree line, in strata that follow the height, two tones mottled
   - snow on the high ground that lies flat enough to hold it, a ragged snow line, a dusting even on the steepest summits
   - grass and forest green below (the vertex colour, so sand at the shore and the old layering stay), mottled at three scales
   - creases darker than ridges, and distance haze toward the sky colour
   - o.self: part of the colour glows on its own (at night the moon alone left every slope one grey-blue)
   o: {lin (colours already linear), snow, snowVar, tree, rock1, rock2, snowC, haze, hazeNear, hazeFar, hazeK, self, fill}

   MOUNTAIN_FALLS(scene, G, o) finds where the land is really steep (a run of cells dropping faster than o.steep) and puts the waterfalls
   there and only there: white falling water down the drop, lifted off the rock as it leaves the lip, spray at its foot, then a river
   down the gentle ground to the sea. (Before, each fall was a white ribbon laid on whatever slope was there, so on the gentle hills it
   read as a white road.) G: {pos, hs, A, RN} ring grid. Returns {feet:[[x,y,z,w]]} for spray clouds. */
function MOUNTAIN_LOOK(m,o){o=o||{};
  const cv=h=>{const c=new THREE.Color(h);if(!o.lin)c.convertSRGBToLinear();return c;},V3=c=>`vec3(${c.r.toFixed(4)},${c.g.toFixed(4)},${c.b.toFixed(4)})`,F=v=>(+v).toFixed(1);
  const R1=V3(cv(o.rock1||0x5a5f68)),R2=V3(cv(o.rock2||0x33383f)),SN=V3(cv(o.snowC||0xf2f6fb)),HZ=V3(cv(o.haze||0x24365a));
  const snow=o.snow||1500,snowV=o.snowVar||500,tree=o.tree||700,hn=o.hazeNear||6000,hf=o.hazeFar||30000,hk=o.hazeK==null?.45:o.hazeK,self=o.self||0;
  m.extensions=m.extensions||{};m.extensions.derivatives=true;
  const prev=m.onBeforeCompile;
  m.onBeforeCompile=(sh,r)=>{if(prev)prev(sh,r);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMW;varying vec3 vMN;')
      .replace('#include <project_vertex>','#include <project_vertex>\nvMW=(modelMatrix*vec4(transformed,1.0)).xyz;vMN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vMW;varying vec3 vMN;
      float mlH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float mlN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mlH(i),mlH(i+vec2(1,0)),f.x),mix(mlH(i+vec2(0,1)),mlH(i+vec2(1,1)),f.x),f.y);}
      float mlF(vec2 p){return mlN(p)*.5+mlN(p*2.07+5.3)*.28+mlN(p*4.31-2.1)*.14+mlN(p*8.9+1.7)*.08;}`)
      .replace('#include <color_fragment>',`#include <color_fragment>
      {vec3 p=vMW;vec3 n=normalize(vMN);float sl=1.0-clamp(n.y,0.0,1.0);
       float N1=mlF(p.xz*.0009),N2=mlF(p.xz*.0055),N3=mlN(p.xz*.035);
       float fine=1.0-smoothstep(.6,2.0,length(fwidth(p.xz*.035)));          // the finest layer only while it is bigger than a pixel
       vec3 base=diffuseColor.rgb;
       // rock: two tones, strata following the height and bent by the land
       float sk=1.0-smoothstep(.3,1.0,fwidth(p.y*.018));
       float strata=mix(.5,mlN(vec2(dot(p.xz,vec2(.6,.8))*.0012,p.y*.018+N1*5.0))*.65+mlN(vec2(p.x*.003,p.y*.045+N2*4.0))*.35,sk);   // (layers fade out before they are a pixel thin: no stripes far off)
       vec3 rockC=mix(${R1},${R2},smoothstep(.3,.75,N2))*(.8+.36*strata)*(.9+.2*N3*fine);
       float rockK=smoothstep(.2,.4,sl+(N2-.5)*.22);
       rockK=max(rockK,smoothstep(${F(tree)},${F(tree+450)},p.y+(N1-.5)*600.0));
       rockK*=smoothstep(4.0,40.0,p.y);                                       // the shore keeps its sand
       // snow: a ragged line, held on the flatter ground, a dusting on the high steep faces
       float snl=${F(snow)}+(N1-.5)*${F(snowV)};
       float snowK=smoothstep(snl,snl+260.0,p.y+(N2-.5)*240.0)*(1.0-smoothstep(.42,.7,sl+(N3-.5)*.1));
       snowK=max(snowK,smoothstep(snl+500.0,snl+1100.0,p.y)*(.45+.35*N2));
       // grass and forest
       vec3 grassC=base*(.78+.44*N2)*(.9+.2*N3*fine);
       grassC=mix(grassC,grassC*vec3(.75,.9,.7),smoothstep(.55,.75,N1)*.5);
       vec3 c=mix(grassC,rockC,rockK);
       c=mix(c,${SN}*(.86+.16*N3),snowK);
       c*=.78+.22*clamp(n.y,0.0,1.0);                                          // creases darker than ridges
       float dd=length(p-cameraPosition);
       c=mix(c,${HZ},${hk.toFixed(3)}*smoothstep(${F(hn)},${F(hf)},dd));
       diffuseColor.rgb=c;}`)
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*'+self.toFixed(3)+';');
  };
  const key=m.customProgramCacheKey?m.customProgramCacheKey():'';
  m.customProgramCacheKey=()=>key+'|mtn'+[snow,tree,hn,hf,hk,self,o.lin?1:0,o.haze||0].join(',');
  m.needsUpdate=true;return m;}

function MOUNTAIN_FALLS(scene,G,o){o=o||{};
  const{pos,hs,A,RN}=G,TAU=Math.PI*2,cx=o.cx||0,cz=o.cz||0;
  let s=o.seed||31337;const rnd=()=>((s=(s*16807)%2147483647)-1)/2147483646,RR=(a,b)=>a+(b-a)*rnd();
  const at=(i,j)=>{const k=(((i%A)+A)%A)*(RN+1)+j;return[pos[k*3],hs[k],pos[k*3+2]];};
  const steep=o.steep||.7,maxTop=o.maxTop||2600,minDrop=o.minDrop||250,n=o.count||4,span=o.span||1.0,center=o.center==null?Math.PI*1.5:o.center;
  // every grid line in the arc: its longest steep run
  const cand=[];
  for(let ii=0;ii<A;ii++){const a=ii/A*TAU;let d=Math.atan2(Math.sin(a-center),Math.cos(a-center));if(Math.abs(d)>span)continue;
    let best=null,run=null;
    for(let j=0;j<RN;j++){const p=at(ii,j),q=at(ii,j+1),hd=Math.hypot(q[0]-p[0],q[2]-p[2]),sl=(q[1]-p[1])/Math.max(hd,1);
      if(sl>steep&&p[1]>20&&q[1]<maxTop){if(!run)run={j0:j,j1:j+1};else run.j1=j+1;}
      else if(run){const drop=at(ii,run.j1)[1]-at(ii,run.j0)[1];if(!best||drop>best.drop)best={...run,drop};run=null;}}
    if(run){const drop=at(ii,run.j1)[1]-at(ii,run.j0)[1];if(!best||drop>best.drop)best={...run,drop};}
    if(best&&o.maxDrop){while(best.j1>best.j0+1&&at(ii,best.j1)[1]-at(ii,best.j0)[1]>o.maxDrop)best.j1--;best.drop=at(ii,best.j1)[1]-at(ii,best.j0)[1];}   // keep falls to a believable height
    if(best&&best.drop>minDrop)cand.push({i:ii,...best});}
  cand.sort((a,b)=>b.drop-a.drop);
  const picks=[],sep=Math.max(3,Math.round(A*(o.sep||.03)));
  for(const c of cand){if(picks.length>=n)break;if(picks.some(p=>{const d=Math.abs(p.i-c.i);return Math.min(d,A-d)<sep;}))continue;picks.push(c);}

  const fallMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,uniforms:{time:o.time||{value:0}},
    vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vU;uniform float time;
      float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n1(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
      void main(){float x=abs(vU.x-.5)*2.0;
        float st=n1(vec2(vU.x*18.0,vU.y*7.0-time*2.6))*.55+n1(vec2(vU.x*44.0,vU.y*18.0-time*4.2))*.3+n1(vec2(vU.x*90.0,vU.y*30.0-time*6.0))*.15;
        float core=1.0-smoothstep(.15,.9,x+st*.25);
        float foot=smoothstep(.8,1.0,vU.y);                       // foam where it lands
        float a=core*smoothstep(0.0,.03,vU.y)*(.35+.65*st)+foot*(1.0-x)*.5;
        vec3 c=mix(vec3(.5,.62,.78),vec3(.95,.98,1.0),clamp(st*1.2+foot,0.0,1.0));
        gl_FragColor=vec4(c,clamp(a,0.0,1.0)*.8);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`});
  const riverMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,uniforms:{time:o.time||{value:0}},
    vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vU;uniform float time;
      float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n1(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
      void main(){float x=abs(vU.x-.5)*2.0;
        float fl=n1(vec2(vU.x*6.0,vU.y*40.0-time*1.4))*.6+n1(vec2(vU.x*14.0,vU.y*90.0-time*2.3))*.4;
        float a=(1.0-smoothstep(.6,1.0,x))*.9;
        vec3 c=mix(vec3(.04,.09,.15),vec3(.3,.42,.58),smoothstep(.55,.9,fl))+vec3(.5,.6,.7)*(1.0-smoothstep(.0,.15,vU.y))*.6;   // white water where it leaves the fall
        gl_FragColor=vec4(c,a);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`});
  const fP=[],fU=[],fI=[],rP=[],rU=[],rI=[],feet=[];
  for(const c of picks){const a=c.i/A*TAU,tx=-Math.sin(a),tz=Math.cos(a),ix=-Math.cos(a),iz=-Math.sin(a);   // t: across the fall, i: toward the centre
    const w=RR(o.wMin||70,o.wMax||130),top=at(c.i,c.j1),L=[];let len=0;
    for(let j=c.j1;j>=c.j0;j--){const p=at(c.i,j);if(L.length){const q=L[L.length-1];len+=Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);}L.push([...p,len]);}
    const base=fP.length/3;
    L.forEach((p,k)=>{const drop=top[1]-p[1],out=18+Math.sqrt(Math.max(drop,0))*2.2;   // the water leaves the lip and falls clear of the rock
      for(const sd of[-1,1]){const ww=w*(1+drop/Math.max(1,c.drop)*.35);fP.push(p[0]+tx*ww/2*sd+ix*out,p[1]+10,p[2]+tz*ww/2*sd+iz*out);fU.push(sd<0?0:1,p[3]/len);}
      if(k){const b=base+(k-1)*2;fI.push(b,b+1,b+2,b+1,b+3,b+2);}});
    const ft=L[L.length-1];feet.push([ft[0]+ix*60,ft[1],ft[2]+iz*60,w]);
    // the river from the fall's foot down to the sea
    const R=[];for(let j=c.j0;j>=0;j--){const p=at(c.i,j);R.push(p);if(p[1]<1)break;}
    if(R.length>1){const rb=rP.length/3,rw=w*.55;let rl=0;
      R.forEach((p,k)=>{if(k)rl+=Math.hypot(p[0]-R[k-1][0],p[2]-R[k-1][2]);
        for(const sd of[-1,1]){rP.push(p[0]+tx*rw/2*sd+ix*(k?0:40),Math.max(p[1],.5)+6,p[2]+tz*rw/2*sd+iz*(k?0:40));rU.push(sd<0?0:1,rl/600);}
        if(k){const b=rb+(k-1)*2;rI.push(b,b+1,b+2,b+1,b+3,b+2);}});}
  }
  const mk=(P,U,I,mat,ro)=>{if(!P.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);
    const m=new THREE.Mesh(g,mat);m.renderOrder=ro;m.frustumCulled=false;scene.add(m);};
  mk(rP,rU,rI,riverMat,1);mk(fP,fU,fI,fallMat,2);
  return{feet,picks};}

/* MOUNTAIN_CLOUDS(scene, banks, o): cloud banks lying along the mountainsides, each built from soft puffs that always face the camera,
   so from any angle a bank reads as cloud (they were flat cards turned toward the city: from anywhere else they showed as grey bars
   with straight edges). Each puff is billowy (noise in its edge), fades out as the camera comes close, one draw call for all.
   banks: [{x,y,z,w,h,col}] (col a THREE.Color); o: {cx, cz, opacity, seed}. */
function MOUNTAIN_CLOUDS(scene,banks,o){o=o||{};const cx=o.cx||0,cz=o.cz||0;
  let s=o.seed||5151;const rnd=()=>((s=(s*16807)%2147483647)-1)/2147483646,RR=(a,b)=>a+(b-a)*rnd();
  const P=[],K=[],S=[],Cc=[],Sd=[],I=[];
  for(const b of banks){const a=Math.atan2(b.x-cx,b.z-cz),tx=Math.cos(a),tz=-Math.sin(a),dx=Math.sin(a),dz=Math.cos(a);
    const n=Math.min(12,Math.max(2,Math.round(b.w/(b.h*.8))));
    for(let k=0;k<n;k++){const u=(k+.5)/n-.5,sz=b.h*RR(1.1,1.9)*(1-Math.abs(u)*.6),x=b.x+tx*u*b.w+dx*RR(-.4,.4)*b.h,z=b.z+tz*u*b.w+dz*RR(-.4,.4)*b.h,y=b.y+RR(-.2,.25)*b.h-Math.abs(u)*b.h*.3,sd=rnd()*100;
      const base=P.length/3;
      for(const[cxx,cyy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){P.push(x,y,z);K.push(cxx,cyy);S.push(sz);Cc.push(b.col.r,b.col.g,b.col.b);Sd.push(sd);}
      I.push(base,base+1,base+2,base+1,base+3,base+2);}}
  if(!P.length)return null;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('corner',new THREE.Float32BufferAttribute(K,2));
  g.setAttribute('size',new THREE.Float32BufferAttribute(S,1));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setAttribute('seed',new THREE.Float32BufferAttribute(Sd,1));g.setIndex(I);
  const m=new THREE.Mesh(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{op:{value:o.opacity||.55}},
    vertexShader:`attribute vec2 corner;attribute float size;attribute float seed;attribute vec3 color;varying vec2 vC;varying vec3 vCol;varying float vS,vF;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vF=smoothstep(size*.6,size*2.2,-mv.z);mv.xy+=corner*size*.5;vC=corner;vCol=color;vS=seed;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec2 vC;varying vec3 vCol;varying float vS,vF;uniform float op;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){vec2 p=vC*vec2(1.0,1.35);float r=length(p);
        float bill=n(p*2.2+vS)*.55+n(p*4.7-vS)*.3+n(p*9.3+vS*2.0)*.15;
        float a=smoothstep(1.0,.25,r+(bill-.5)*.6)*(.55+.45*bill)*smoothstep(-1.1,-.2,vC.y*.9-bill*.3);   // flatter underside
        vec3 c=vCol*(.8+.35*bill+.15*vC.y);
        gl_FragColor=vec4(c,a*op*vF);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`}));
  m.frustumCulled=false;m.renderOrder=3;scene.add(m);return m;}
