/* Elyra · the finishing pass (Nov 9 2026, Bryce: "increase the quality from the menu screen, complete overhaul", and the same for the
   cutscenes). One look for every scene that uses it: the menu backdrop and the prologue so far.
   GRADE.composer(renderer, scene, camera, {bloom:[strength,radius,threshold], grade:{...}, low}) → {render(), setSize(w,h), grade, bloom}
   - renders into a multisampled target when the browser has WebGL2 (the composer used to lose the scene's antialiasing)
   - bloom (UnrealBloomPass) after the tone mapping, so only what is really bright blooms
   - a grade in one pass: gamma (gam: 2.2 for a scene lit in linear space, 1 for the menu, whose colours were picked for no
     gamma), a gentle S-curve, cool shadows / warm highlights (split toning), saturation, a vignette, and (Nov 16) no
     chromatic fringe or film grain any more (grain/fringe uniforms are still accepted and ignored). Values per scene through opts.grade or .grade.uniforms later.
   Needs the three.js examples: CopyShader, LuminosityHighPassShader, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass.
   With them missing (or low quality) it falls back to a plain render. */
/* (Nov 16 2026, Bryce: the Hollow King's glow broke up into red/green/blue/yellow dots on iPhone) Clean glow textures.
   The soft glows, mist and sparks are canvas gradients that fade to almost nothing at their edges. Where a pixel is nearly see-through
   the browser can hand the GPU nonsense colour for it (it stores the canvas pre-multiplied and divides back out on upload; at alpha 1-2
   out of 255 any rounding becomes a full red, green or blue), and additive blending plus bloom turns those pixels into coloured dots.
   Every sprite or point texture drawn on a canvas is read once, the colour of its faint pixels replaced by the texture's own solid
   colour (the alpha untouched), and handed to the GPU as raw pixels so nothing is divided again. Glows look the same; the dots can't. */
(function(){if(typeof THREE==='undefined'||THREE.__glowClean)return;THREE.__glowClean=true;
  const done=new WeakSet();
  function clean(t){try{if(!t||!t.isTexture||done.has(t))return;const c=t.image;
      if(!c||typeof HTMLCanvasElement==='undefined'||!(c instanceof HTMLCanvasElement))return;
      if(c.width*c.height>512*512||c.width<2)return;done.add(t);
      const x=c.getContext('2d');if(!x)return;const im=x.getImageData(0,0,c.width,c.height),d=im.data;
      let r=0,g=0,b=0,w=0,soft=0;
      for(let i=0;i<d.length;i+=4){const a=d[i+3];if(a<255)soft++;if(a>=96){const k=a/255;r+=d[i]*k;g+=d[i+1]*k;b+=d[i+2]*k;w+=k;}}
      if(!soft||!w)return;r/=w;g/=w;b/=w;
      for(let i=0;i<d.length;i+=4){const a=d[i+3];if(a<96){const k=a/96;d[i]=r+(d[i]-r)*k*k;d[i+1]=g+(d[i+1]-g)*k*k;d[i+2]=b+(d[i+2]-b)*k*k;}}
      t.image=im;t.premultiplyAlpha=false;t.needsUpdate=true;
      // a canvas the game redraws later (sights, screens, labels) goes straight back to the live canvas on its next update
      Object.defineProperty(t,'needsUpdate',{configurable:true,set(v){delete t.needsUpdate;t.image=c;t.needsUpdate=v;}});}catch(e){}}
  for(const M of[THREE.SpriteMaterial,THREE.PointsMaterial]){if(!M)continue;const P=M.prototype;
    Object.defineProperty(P,'map',{configurable:true,get(){return this.__map||null;},
      set(v){this.__map=v||null;if(v)Promise.resolve().then(()=>clean(v));}});}
})();
const GRADE=(()=>{
  const SHADER={uniforms:{tDiffuse:{value:null},t:{value:0},res:{value:new THREE.Vector2(1,1)},
      contrast:{value:1.08},sat:{value:1.06},vig:{value:.42},grain:{value:.035},fringe:{value:.0018},
      shadow:{value:new THREE.Vector3(.0,.012,.03)},high:{value:new THREE.Vector3(.02,.008,-.012)},lift:{value:0},gain:{value:1},gam:{value:2.2}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform sampler2D tDiffuse;uniform float t,contrast,sat,vig,grain,fringe,lift,gain,gam;uniform vec2 res;uniform vec3 shadow,high;varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      vec3 g(vec3 c){return pow(max(c,0.0),vec3(1.0/gam));}
      void main(){vec2 d=vUv-.5;float r2=dot(d,d);
        vec3 c=texture2D(tDiffuse,vUv).rgb;   /* (Nov 16) no chromatic fringe: it split the colours into a rainbow inside the grain */
        c=g(c);
        float l=dot(c,vec3(.2126,.7152,.0722));
        c+=shadow*(1.0-smoothstep(.0,.45,l))+high*smoothstep(.45,1.0,l);
        c=mix(vec3(l),c,sat);
        c=clamp((c-.5)*contrast+.5,0.0,1.0);c=c*c*(3.0-2.0*c)*.25+c*.75;
        c=c*gain+lift;
        c*=1.0-vig*smoothstep(.12,.72,r2*(1.0+.35*(res.x/res.y-1.0)));
        /* (Nov 16, Bryce: the white haze with rainbow colours in it, everywhere: "better to have nothing there") the moving film grain is gone */
        gl_FragColor=vec4(c,1.0);}`};
  function composer(R,scene,cam,o){o=o||{};
    const ok=!o.low&&THREE.EffectComposer&&THREE.RenderPass&&THREE.ShaderPass&&THREE.UnrealBloomPass;
    let pr=R.getPixelRatio(),W=innerWidth,H=innerHeight;
    if(!ok)return{render(){R.render(scene,cam);},setSize(w,h){R.setSize(w,h,false);},grade:null,bloom:null,on:false};
    let C,rt=null;
    try{const gl2=R.capabilities&&R.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget;
      /* (Nov 9) a stencil buffer on the target: three.js then gives it 24-bit depth instead of 16, which the levels with far planes
         kilometres out need (TakeOver's maps asked for it on their own targets; now every scene gets it) */
      if(gl2){rt=new THREE.WebGLMultisampleRenderTarget(W*pr,H*pr,{format:THREE.RGBAFormat,stencilBuffer:true});rt.samples=o.samples||(o.phone||(matchMedia&&matchMedia('(pointer: coarse)').matches)?2:4);/* (Nov 10) 2 on every phone: half the memory of 4x */}
      else rt=new THREE.WebGLRenderTarget(W*pr,H*pr,{stencilBuffer:true});
      C=new THREE.EffectComposer(R,rt);}catch(e){C=new THREE.EffectComposer(R);}
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
