/* Elyra · ground detail (Nov 16 2026, Bryce: Tide City's ground "just looks flat", one colour; wanted grass, or at least a textured
   ground). GROUND_DETAIL(material, {terrain}) patches a MeshStandardMaterial so whatever colour it already has (a painted map or vertex
   colours) gets world-space detail on top, with no texture files:
   - grass (green-leaning colour): clumps, blades and dry patches at three scales, with a soft normal tilt so it catches the light
   - paving (pale, grey): stone slabs in a staggered bond with joints and a little colour per slab
   - asphalt (dark grey): grit, patched repairs and wear
   - rock and snow on the terrain: strata and grain
   Every layer fades out by its own size on screen, so far ground never sparkles. One shader, no extra draw calls. */
function GROUND_DETAIL(m,o){o=o||{};const terr=!!o.terrain;
  m.extensions=m.extensions||{};m.extensions.derivatives=true;
  const prev=m.onBeforeCompile;
  m.onBeforeCompile=(sh,r)=>{if(prev)prev(sh,r);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGW;')
      .replace('#include <project_vertex>','#include <project_vertex>\nvGW=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vGW;
      float gdH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float gdN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(gdH(i),gdH(i+vec2(1,0)),f.x),mix(gdH(i+vec2(0,1)),gdH(i+vec2(1,1)),f.x),f.y);}
      float gdF(vec2 p){return gdN(p)*.5+gdN(p*2.13+7.1)*.3+gdN(p*4.37-3.3)*.2;}
      float gdK(vec2 p,float size){float w=length(fwidth(p))/size;return 1.0-smoothstep(.25,.9,w);}   // 1 while the feature is several px`)
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      {vec2 p=vGW.xz;vec3 c=diffuseColor.rgb;float lum=dot(c,vec3(.3,.59,.11));
       float grass=smoothstep(.01,.06,c.g-max(c.r,c.b)*.98);
       float snow=${terr?'smoothstep(.55,.75,min(c.r,min(c.g,c.b)))':'0.0'};
       float asph=(1.0-grass)*(1.0-smoothstep(.07,.13,lum));
       float pave=(1.0-grass)*(1.0-asph)*(1.0-snow);
       // grass: big clumps of lush and dry, then tufts, then blades
       float g1=gdF(p*${terr?'.012':'.05'}),g2=gdF(p*${terr?'.09':'.35'}),g3=gdN(p*vec2(3.1,2.3))*gdK(p,.3);
       vec3 gc=c*(.78+.42*g1)*(.85+.3*g2*gdK(p,${terr?'8.0':'2.5'}))*(.88+.24*g3);
       gc=mix(gc,c*vec3(1.25,1.1,.7),smoothstep(.62,.8,g1)*.45);               // dry, yellowing patches
       gc=mix(gc,c*vec3(.7,.85,.7),smoothstep(.35,.18,g2)*.35);                 // dark, deep clumps
       // paving: staggered slabs with joints, each a little different
       vec2 sp=p/vec2(2.4,1.2);sp.x+=step(1.0,mod(floor(sp.y),2.0))*.5;vec2 sf=fract(sp);
       float joint=1.0-smoothstep(.0,.05,min(min(sf.x,1.0-sf.x)*2.0,min(sf.y,1.0-sf.y)));
       float kP=gdK(p,1.0);
       vec3 pc=c*(.9+.18*gdH(floor(sp))*kP)*(1.0-joint*.35*kP)*(.8+.35*gdF(p*.04))*(.92+.12*gdN(p*.6)*gdK(p,.8));
       // asphalt: grit, repairs and wear
       vec3 ac=c*(.85+.3*gdN(p*2.7)*gdK(p,.4))*(.9+.2*gdF(p*.05));
       ac=mix(ac,c*.7,smoothstep(.72,.78,gdF(p*.11+3.0))*.6);
       vec3 dc=c*(.85+.3*gdF(p*${terr?'.02':'.2'}));                            // rock / anything else
       vec3 snc=c*(.92+.1*gdF(p*.03));
       c=gc*grass+pc*pave*${terr?'0.0':'1.0'}+dc*pave*${terr?'1.0':'0.0'}+ac*asph+snc*snow;
       diffuseColor.rgb=c;
       roughnessFactor=mix(roughnessFactor,.98,grass);roughnessFactor=mix(roughnessFactor,.8,asph);}`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      {vec2 p=vGW.xz;float k=gdK(p,1.5);vec2 e=vec2(.6,0.);
       float h0=gdF(p*.7),hx=gdF((p+e.xy)*.7),hz=gdF((p+e.yx)*.7);
       vec3 tilt=vec3(h0-hx,0.0,h0-hz)*${terr?'.6':'.35'}*k;
       normal=normalize(normal+(viewMatrix*vec4(tilt,0.0)).xyz);}`);
  };
  const key=m.customProgramCacheKey?m.customProgramCacheKey():'';
  m.customProgramCacheKey=()=>key+'|gd'+(terr?'T':'P');
  m.needsUpdate=true;return m;}
