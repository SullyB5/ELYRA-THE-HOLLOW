/* Elyra · the two skies (Oct 24). Bryce's two picks replace every older sky photo in the game:
     ELYRA   · the alien sky (img/sky/nebula-green-*): Elyra. The Mountain (and its command deck), Tide City, the prologue's
               Elyra shots, the menu footage on the deck.
     ASTRAEA · the nebula   (img/sky/nebula-gold-*):  Astraea and its moon. The Heralds, Pathfinder Arcs 01, 02 and 03, the
               prologue's last shot (the Pathfinder going after him, to Astraea).
     EARTH   · the purple nebula (img/sky/nebula-purple-*): the old world. The prologue's Earth and the nine arks.
   SKIES.load(world, cb)  loads the photo once per page (phones get the 1024-wide file) and hands it to every caller.
   SKIES.dome(G, R, world, {base, exp, full, u})  a backdrop sphere for cutscene sets: the set's old painted gradient (base) stays
     along the horizon, the photo fills the sky above it; full:true for sets out in space (photo all the way round).
   Both photos are full spheres of space (no photographed ground), so a ground level maps the photo's upper half (v .5 → 1). */
const SKIES=(()=>{
  const FILE={elyra:'nebula-green',astraea:'nebula-gold',earth:'nebula-purple'},cache={},wait={};
  const ph=matchMedia('(pointer:coarse)').matches;
  const url=w=>'img/sky/'+FILE[w]+'-'+(ph?'phone':'pc')+'.jpg';
  function load(w,cb){if(!FILE[w])return;if(cache[w]){cb(cache[w]);return;}if(wait[w]){wait[w].push(cb);return;}wait[w]=[cb];
    new THREE.TextureLoader().load(url(w),t=>{t.wrapS=THREE.RepeatWrapping;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;cache[w]=t;
      const q=wait[w];wait[w]=null;q.forEach(f=>{try{f(t);}catch(e){}});},undefined,()=>{wait[w]=null;});}
  function dome(G,R,w,o){o=o||{};
    const U={photo:{value:null},k:{value:0},exp:{value:o.exp||1},base:{value:o.base||null},hasBase:{value:o.base?1:0},full:{value:o.full?1:0},u:{value:o.u||0}};
    const m=new THREE.Mesh(new THREE.SphereGeometry(R,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,
      vertexShader:'varying vec3 vD;varying vec2 vUv;void main(){vD=normalize(position);vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:`varying vec3 vD;varying vec2 vUv;uniform sampler2D photo,base;uniform float k,exp,hasBase,full,u;
      void main(){vec3 d=normalize(vD);
        vec3 b=hasBase>.5?pow(texture2D(base,vec2(.5,vUv.y)).rgb,vec3(2.2)):vec3(.004,.005,.01);
        vec3 c=b;
        if(k>0.0){vec2 pu=vec2(atan(d.z,d.x)/6.2831853+.5+u,asin(clamp(d.y,-1.0,1.0))/3.1415927+.5);
          vec3 p=pow(texture2D(photo,pu).rgb,vec3(2.2))*exp;p=p/(1.0+p*.8);
          float over=full>.5?1.0:smoothstep(.0,.2,d.y);
          c=mix(b,b*.35+p,k*over);}
        gl_FragColor=vec4(c,1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`}));
    m.renderOrder=-3;G.add(m);load(w,t=>{U.photo.value=t;U.k.value=1;});return m;}
  return{load,dome,url,FILE};
})();
