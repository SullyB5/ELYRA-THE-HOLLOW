/* CORRUPTION · how far gone someone is, on screen (Nov 8, Bryce). docs/CANON-NOTES.md #38: the line is 50%. Under half lost to the
   Hollow, the suppressor's dome eases it off you and you live; past half you are "fully corrupted" for the dome's rules: you burn inside
   it, and its edge is a shock wall you can't cross. Judged per person (the King, each Host soldier, each Herald).

   The sign: dark violet veins that spread out from the chest over a dressed character (MODELS.dress), the skin around them going ashen.
   amount 0..1 is how far they have spread (0.5 = half the body: the chest, shoulders and upper arms; 0.9 = almost all of it). So the
   player can read the line before the dome makes the call.

     const c=CORRUPT.mark(H,.35)   // H: a person from makeHuman(), dressed or still dressing (it waits for the model)
     c.amount=.6                   // change it at any time
     c.cleanse=0..1                // UNDER HALF, the dome passing: the veins blaze, then burn off and are gone (1 = clean)
     c.burn=0..1                   // PAST HALF: the whole body goes white-violet and comes apart into ash (1 = gone)
     CORRUPT.edge(H,c)             // which of the two the 50% line gives this person: 'cleanse' or 'burn'

   Shader only (no extra meshes): one clone of the person's material, its own program (the existing wear/hue hooks still run first). */
const CORRUPT=(()=>{
  const LINE=.5;
  const NOISE=`
    float _ch(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float _cn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(_ch(i),_ch(i+vec3(1,0,0)),f.x),mix(_ch(i+vec3(0,1,0)),_ch(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(_ch(i+vec3(0,0,1)),_ch(i+vec3(1,0,1)),f.x),mix(_ch(i+vec3(0,1,1)),_ch(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float _cf(vec3 p){return _cn(p)*.55+_cn(p*2.1)*.3+_cn(p*4.3)*.15;}`;
  function patch(sh,U){
    Object.assign(sh.uniforms,U);
    sh.vertexShader='varying vec3 vCorP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCorP=position;');
    sh.fragmentShader='varying vec3 vCorP;uniform float uCorA,uCorC,uCorB,uCorT,uCorH;uniform vec3 uCorO;\n'+NOISE+'\n'+sh.fragmentShader
      // where it has spread (out from the chest), the vein lines, and the burn's dissolve
      .replace('#include <map_fragment>',`#include <map_fragment>
        vec3 _q=(vCorP-uCorO)/uCorH;float _sp=length((_q-vec3(0.,.24,0.))*vec3(1.,.82,1.15));
        float _wob=_cf(_q*7.)*.16;float _cov=(1.-smoothstep(uCorA*.95-.05,uCorA*.95+.03,_sp+_wob-.04))*step(.001,uCorA);
        float _n=_cf(_q*vec3(15.,11.,15.)+vec3(0.,uCorT*.05,0.));float _vein=1.-smoothstep(.0,.032,abs(_n-.5));
        float _fine=1.-smoothstep(.0,.03,abs(_cf(_q*31.+3.7)-.5));_vein=max(_vein,_fine*.3);
        float _cl=1.-smoothstep(.55,1.,uCorC);float _flare=sin(clamp(uCorC,0.,1.)*3.1416)*1.8;
        _cov*=_cl;
        float _dis=_cf(_q*9.+1.3);if(uCorB>.42&&_dis<(uCorB-.42)*1.9)discard;
        float _edgeB=uCorB>.42?1.-smoothstep(0.,.07,_dis-(uCorB-.42)*1.9):0.;
        diffuseColor.rgb*=1.-_cov*.5;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.06,.05,.07),smoothstep(.2,.6,uCorB));`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        {float _p=.75+.25*sin(uCorT*2.3+_q.y*9.);vec3 _vc=vec3(.62,.2,1.)*(1.+_flare)+vec3(1.)*_flare*.35;
         totalEmissiveRadiance+=_vc*_vein*_cov*(.9+_p*.7);
         totalEmissiveRadiance+=mix(vec3(.55,.22,1.),vec3(1.,.85,1.),smoothstep(.3,.7,uCorB))*smoothstep(0.,.5,uCorB)*1.5*(.5+.5*_n);
         totalEmissiveRadiance+=vec3(1.,.85,1.)*_edgeB*5.;}`);
  }
  function hook(mesh,U,c){if(!mesh||mesh.userData.corr)return;mesh.userData.corr=1;
    const src=mesh.material,m=src.clone();m.userData=Object.assign({},src.userData);
    const prev=Object.prototype.hasOwnProperty.call(src,'onBeforeCompile')?src.onBeforeCompile:THREE.MeshStandardMaterial.prototype.onBeforeCompile,
      key=Object.prototype.hasOwnProperty.call(src,'customProgramCacheKey')?src.customProgramCacheKey:THREE.MeshStandardMaterial.prototype.customProgramCacheKey;
    m.onBeforeCompile=function(sh,r){prev.call(src,sh,r);patch(sh,U);};
    m.customProgramCacheKey=function(){return key.call(src)+'|corrupt';};
    m.userData.corrSide=m.side;m.needsUpdate=true;mesh.material=m;c.mats.push(m);}
  const ALL=[];
  function mark(H,amount){const U={uCorA:{value:amount||0},uCorC:{value:0},uCorB:{value:0},uCorT:{value:Math.random()*20},uCorH:{value:1},uCorO:{value:new THREE.Vector3()}};
    const c={H,U,mats:[],get amount(){return U.uCorA.value;},set amount(v){U.uCorA.value=v;},get cleanse(){return U.uCorC.value;},set cleanse(v){U.uCorC.value=v;},
      get burn(){return U.uCorB.value;},set burn(v){U.uCorB.value=v;
        // once it comes apart, the inside shows through the holes: two-sided from then on (not before: the inside of a helmet, two-sided,
        // mirrors the sky white in a level with an environment map)
        const two=v>.4;for(const m of c.mats){const sd=two?THREE.DoubleSide:m.userData.corrSide;if(m.side!==sd){m.side=sd;m.needsUpdate=true;}}}};
    // the dressed model's units: its geometry's height (measured from its bounding box: centre and height), so the spread sits on the body
    const tryHook=()=>{if(H.skin){if(!H.skin.geometry.boundingBox)H.skin.geometry.computeBoundingBox();const b=H.skin.geometry.boundingBox;U.uCorH.value=Math.max(.05,(b.max.y-b.min.y)||1);b.getCenter(U.uCorO.value);
        hook(H.skin,U,c);}
      if(H.skinLo)hook(H.skinLo,U,c);return H.skin&&(H.skinLo||c.tries>40);};
    c.tries=0;const poll=()=>{c.tries++;if(!tryHook()&&c.tries<400)setTimeout(poll,100);};poll();
    ALL.push(c);return c;}
  function edge(H,c){return c.amount<LINE?'cleanse':'burn';}
  // the veins' slow pulse (call once a frame from the level, with dt)
  function tick(dt){for(const c of ALL)c.U.uCorT.value+=dt;}
  return{mark,edge,tick,LINE};
})();
