/* Elyra · the finishing pass (Nov 9 2026, Bryce: "increase the quality from the menu screen, complete overhaul", and the same for the
   cutscenes). One look for every scene that uses it: the menu backdrop and the prologue so far.
   GRADE.composer(renderer, scene, camera, {bloom:[strength,radius,threshold], grade:{...}, low}) → {render(), setSize(w,h), grade, bloom}
   - renders into a multisampled target when the browser has WebGL2 (the composer used to lose the scene's antialiasing)
   - bloom (UnrealBloomPass) after the tone mapping, so only what is really bright blooms
   - a grade in one pass: gamma (gam: 2.2 for a scene lit in linear space, 1 for the menu, whose colours were picked for no
     gamma), a gentle S-curve, cool shadows / warm highlights (split toning), saturation, a vignette, a little
     chromatic fringe toward the corners, and fine film grain (moving). Values per scene through opts.grade or .grade.uniforms later.
   Needs the three.js examples: CopyShader, LuminosityHighPassShader, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass.
   With them missing (or low quality) it falls back to a plain render. */
const GRADE=(()=>{
  const SHADER={uniforms:{tDiffuse:{value:null},t:{value:0},res:{value:new THREE.Vector2(1,1)},
      contrast:{value:1.08},sat:{value:1.06},vig:{value:.42},grain:{value:.035},fringe:{value:.0018},
      shadow:{value:new THREE.Vector3(.0,.012,.03)},high:{value:new THREE.Vector3(.02,.008,-.012)},lift:{value:0},gain:{value:1},gam:{value:2.2}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform sampler2D tDiffuse;uniform float t,contrast,sat,vig,grain,fringe,lift,gain,gam;uniform vec2 res;uniform vec3 shadow,high;varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      vec3 g(vec3 c){return pow(max(c,0.0),vec3(1.0/gam));}
      void main(){vec2 d=vUv-.5;float r2=dot(d,d);
        vec2 o=d*fringe*r2*4.0;
        vec3 c=vec3(texture2D(tDiffuse,vUv+o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-o).b);
        c=g(c);
        float l=dot(c,vec3(.2126,.7152,.0722));
        c+=shadow*(1.0-smoothstep(.0,.45,l))+high*smoothstep(.45,1.0,l);
        c=mix(vec3(l),c,sat);
        c=clamp((c-.5)*contrast+.5,0.0,1.0);c=c*c*(3.0-2.0*c)*.25+c*.75;
        c=c*gain+lift;
        c*=1.0-vig*smoothstep(.12,.72,r2*(1.0+.35*(res.x/res.y-1.0)));
        c+=(h(vUv*res+fract(t*7.13)*91.0)-.5)*grain;
        gl_FragColor=vec4(c,1.0);}`};
  function composer(R,scene,cam,o){o=o||{};
    const ok=!o.low&&THREE.EffectComposer&&THREE.RenderPass&&THREE.ShaderPass&&THREE.UnrealBloomPass;
    let pr=R.getPixelRatio(),W=innerWidth,H=innerHeight;
    if(!ok)return{render(){R.render(scene,cam);},setSize(w,h){R.setSize(w,h,false);},grade:null,bloom:null,on:false};
    let C,rt=null;
    try{const gl2=R.capabilities&&R.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget;
      if(gl2){rt=new THREE.WebGLMultisampleRenderTarget(W*pr,H*pr,{format:THREE.RGBAFormat});rt.samples=o.samples||4;}
      C=rt?new THREE.EffectComposer(R,rt):new THREE.EffectComposer(R);}catch(e){C=new THREE.EffectComposer(R);}
    C.addPass(new THREE.RenderPass(scene,cam));
    const B=o.bloom||[.75,.55,.82],bloom=new THREE.UnrealBloomPass(new THREE.Vector2(W,H),B[0],B[1],B[2]);C.addPass(bloom);
    const grade=new THREE.ShaderPass(SHADER);const G=o.grade||{};
    for(const k in G){const u=grade.uniforms[k];if(!u)continue;if(u.value&&u.value.set&&Array.isArray(G[k]))u.value.set(...G[k]);else u.value=G[k];}
    C.addPass(grade);
    function setSize(w,h){W=w;H=h;R.setSize(w,h,false);C.setPixelRatio?C.setPixelRatio(R.getPixelRatio()):0;C.setSize(w,h);grade.uniforms.res.value.set(w*R.getPixelRatio(),h*R.getPixelRatio());}
    setSize(W,H);
    let t0=performance.now();
    return{render(){grade.uniforms.t.value=(performance.now()-t0)/1000;C.render();},setSize,grade,bloom,composer:C,on:true,
      set(G){for(const k in G){const u=grade.uniforms[k];if(!u)continue;if(u.value&&u.value.set&&Array.isArray(G[k]))u.value.set(...G[k]);else u.value=G[k];}}};}
  return{composer,SHADER};
})();
