/* Elyra · planets seen from space (Nov 9 2026, Bryce: the prologue's planets were flat painted spheres with blobs of green; "a
   complete overhaul of new objects and structures"). Every planet is drawn in its own shader, nothing painted onto a texture:
   - the surface from 3D noise on the sphere (no seam, no stretching at the poles): oceans with depth, shallows and coasts, land from
     lowland to highland, deserts, ice toward the poles, a glint of the sun on the water
   - the night side: city lights on the land, where people live (Earth, and Tide City's shore on Elyra)
   - clouds on their own shell, turning a little faster than the ground, casting a soft darkening on it
   - the atmosphere: a rim of scattered light, brightest toward the sun, and a thin terminator glow
   - Earth breaking: glowing faults (crack 0..1) that widen and darken the land round them, the oceans going grey
   PLANETS.make(kind, r, {sun}) → {group, surf, clouds, atm, U (surface uniforms), update(t), setSun(v)}.
   kind: 'earth' | 'elyra' | 'astraea' | 'moon'. sun: world direction toward the sun. */
const PLANETS=(()=>{
  // phones: two fewer octaves in every noise sum (the planets fill the screen, and these are the costliest pixels in the prologue)
  const CUT=matchMedia('(pointer:coarse)').matches?2:0;
  const NOISE=`#define OCT_CUT ${CUT}

    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
    float fbm(vec3 p,int o){float s=0.0,a=.5;for(int i=0;i<7;i++){if(i>=o-OCT_CUT&&i>1)break;s+=a*snoise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
    float ridge(vec3 p){float s=0.0,a=.5;for(int i=0;i<4;i++){float n=1.0-abs(snoise(p));s+=a*n*n;p*=2.1;a*=.5;}return s;}`;
  // per world: ocean deep/shallow, land low/high, desert, ice, land threshold, seed, city lights colour/amount, atmosphere colour
  const KIND={
    earth:{deep:[.004,.02,.07],shal:[.02,.12,.2],low:[.06,.13,.035],high:[.24,.2,.12],des:[.42,.32,.18],ice:[.85,.88,.92],thr:.02,seed:3.1,city:[1,.62,.28],cityK:1.4,atm:[.3,.55,1],cloud:.55,iceLat:.78},
    elyra:{deep:[.002,.025,.06],shal:[.01,.16,.22],low:[.32,.3,.24],high:[.62,.6,.55],des:[.5,.46,.38],ice:[.8,.86,.92],thr:.34,seed:11.4,city:[1,.78,.45],cityK:.8,atm:[.32,.62,1],cloud:.62,iceLat:.86},
    astraea:{deep:[.06,.012,.008],shal:[.16,.04,.02],low:[.34,.12,.05],high:[.62,.34,.18],des:[.5,.24,.1],ice:[.75,.6,.5],thr:-.25,seed:21.7,city:[0,0,0],cityK:0,atm:[1,.5,.28],cloud:.3,iceLat:.92},
    moon:{deep:[.18,.18,.2],shal:[.22,.22,.24],low:[.3,.3,.32],high:[.5,.5,.52],des:[.38,.37,.36],ice:[.6,.6,.62],thr:-1,seed:5.5,city:[0,0,0],cityK:0,atm:[.5,.5,.6],cloud:0,iceLat:2}};
  const v3=a=>new THREE.Vector3(a[0],a[1],a[2]);
  function make(kind,r,o){o=o||{};const K=Object.assign({},KIND[kind]||KIND.earth,o.k||{});const group=new THREE.Group();
    const sun={value:(o.sun||new THREE.Vector3(1,.3,.6)).clone().normalize()};
    const U={sun,t:{value:0},crack:{value:0},burn:{value:0},deep:{value:v3(K.deep)},shal:{value:v3(K.shal)},low:{value:v3(K.low)},high:{value:v3(K.high)},
      des:{value:v3(K.des)},ice:{value:v3(K.ice)},thr:{value:K.thr},seed:{value:K.seed},city:{value:v3(K.city)},cityK:{value:K.cityK},atm:{value:v3(K.atm)},
      iceLat:{value:K.iceLat},rot:{value:0},cloudRot:{value:0},cloudK:{value:K.cloud},spot:{value:o.spot||new THREE.Vector3(0,0,0)},spotK:{value:o.spot?1:0},
      crater:{value:kind==='moon'?1:0},exp:{value:o.exp||1}};
    const surf=new THREE.Mesh(new THREE.SphereGeometry(r,128,96),new THREE.ShaderMaterial({uniforms:U,
      vertexShader:`varying vec3 vP;varying vec3 vN;varying vec3 vW;uniform float rot;
        void main(){vP=normalize(position);float c=cos(rot),s=sin(rot);vP=vec3(c*vP.x+s*vP.z,vP.y,-s*vP.x+c*vP.z);
          vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader:NOISE+`
        uniform vec3 sun,deep,shal,low,high,des,ice,city,atm,spot;uniform float t,crack,burn,thr,seed,cityK,iceLat,cloudRot,cloudK,spotK,crater,exp;
        varying vec3 vP;varying vec3 vN;varying vec3 vW;
        void main(){vec3 p=vP;vec3 q=p*1.6+seed;
          float n=fbm(q,7)+.35*fbm(q*3.1+4.0,4)*smoothstep(.0,.3,fbm(q*.7,3));
          float h=n-thr;float land=smoothstep(-.004,.006,h);
          float lat=abs(p.y);
          // ocean: deep to shallow toward the coasts
          vec3 oc=mix(deep,shal,smoothstep(-.18,0.0,h));
          // land: lowland to highland, deserts in bands of their own noise, ice toward the poles and on the high ground
          float m=smoothstep(.0,.42,h);float dz=smoothstep(.1,.4,fbm(q*1.3+11.0,4)+.25-abs(lat-.3));
          vec3 lc=mix(low,high,m);lc=mix(lc,des,dz*(1.0-m*.6));
          lc*=.82+.36*fbm(q*9.0,3);
          if(crater>.5){float cr=ridge(q*2.4);lc*=.75+.5*cr;oc=lc;}
          float icy=smoothstep(iceLat-.05,iceLat+.06,lat+.08*snoise(q*4.0))+smoothstep(.62,.8,h)*.8;
          vec3 col=mix(oc,lc,land);col=mix(col,ice,clamp(icy,0.0,1.0));
          // Earth breaking: faults in the crust that open and glow; the land round them burns and the seas go grey
          float fl=0.0;
          if(crack>0.0){float rr=1.0-abs(snoise(p*3.1+7.0)+.3*snoise(p*9.0));float w=mix(.0,.035,crack);fl=smoothstep(1.0-w,1.0,rr)*smoothstep(.0,.2,crack);
            float near=smoothstep(1.0-w*5.0,1.0,rr);col=mix(col,vec3(.05,.035,.03),near*crack*.8+burn*.55);}
          vec3 N=normalize(vN);vec3 V=normalize(cameraPosition-vW);vec3 L=normalize(sun);
          float nl=dot(N,L);float day=smoothstep(-.12,.25,nl);
          // the clouds' shadow on the ground
          float cs=cloudK>0.0?smoothstep(.05,.5,fbm(vec3(cos(cloudRot)*p.x+sin(cloudRot)*p.z,p.y*1.6,-sin(cloudRot)*p.x+cos(cloudRot)*p.z)*2.2+seed*2.0,5)):0.0;
          vec3 c=col*(max(nl,0.0)*1.15+.012)*(1.0-cs*.35*cloudK);
          // the sun on the water
          vec3 Hh=normalize(L+V);float sp=pow(max(dot(N,Hh),0.0),160.0)*(1.0-land)*(1.0-icy)*day;c+=vec3(1.0,.92,.8)*sp*.55+vec3(.6,.75,1.0)*pow(max(dot(N,Hh),0.0),8.0)*.06*(1.0-land)*day;
          // lights on the night side
          float nite=1.0-smoothstep(-.18,.06,nl);
          float cl=smoothstep(.55,.85,snoise(q*26.0)*.5+.5)*smoothstep(.1,.5,fbm(q*5.0+3.0,3)+.2)*land*(1.0-icy)*(1.0-burn);
          c+=city*cl*nite*cityK*.6;
          // a gold light on one shore
          if(spotK>0.0){float d=distance(p,normalize(spot));c+=vec3(1.0,.8,.45)*(smoothstep(.03,.0,d)*2.5+smoothstep(.12,.0,d)*.25)*(.35+nite);}
          // faults glowing
          c+=vec3(1.0,.32,.06)*fl*3.0*crack+vec3(.9,.25,.05)*burn*smoothstep(.2,.8,fbm(q*3.0+t*.05,4))*.25*(1.0-land*.3);
          // atmosphere seen through: haze toward the rim, blue on the day side
          float fr=pow(1.0-max(dot(N,V),0.0),3.0);c=mix(c,atm*(.18+.9*max(nl+.25,0.0)),fr*.75*smoothstep(-.3,.2,nl));
          c*=exp;
          gl_FragColor=vec4(c,1.0);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`}));
    group.add(surf);
    let clouds=null;
    if(K.cloud>0){clouds=new THREE.Mesh(new THREE.SphereGeometry(r*1.012,96,72),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
      vertexShader:`varying vec3 vP;varying vec3 vN;varying vec3 vW;uniform float cloudRot;
        void main(){vP=normalize(position);float c=cos(cloudRot),s=sin(cloudRot);vP=vec3(c*vP.x+s*vP.z,vP.y,-s*vP.x+c*vP.z);
          vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader:NOISE+`uniform vec3 sun,atm;uniform float seed,cloudK,burn,exp;varying vec3 vP;varying vec3 vN;varying vec3 vW;
        void main(){vec3 p=vP;
          // swirls: the lookup bent by a slower field, bands by latitude
          vec3 w=vec3(snoise(p*1.4+seed),snoise(p*1.4+seed+5.0),snoise(p*1.4+seed+9.0));
          vec3 q=vec3(p.x,p.y*1.6,p.z)*2.2+w*.45+seed*2.0;
          float d=smoothstep(.05,.5,fbm(q,6))*cloudK;d*=.65+.35*smoothstep(.0,.25,abs(sin(p.y*7.0+w.x*2.0)));
          vec3 N=normalize(vN);vec3 L=normalize(sun);float nl=dot(N,L);
          vec3 c=mix(vec3(1.0),vec3(.35,.3,.28),burn)*(max(nl,0.0)*1.2+.01)+atm*.05;
          float fr=1.0-max(dot(N,normalize(cameraPosition-vW)),0.0);
          gl_FragColor=vec4(c*exp,d*(1.0-fr*fr*.5));
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`}));group.add(clouds);}
    // the atmosphere shell: scattered light round the limb, toward the sun
    const atm=new THREE.Mesh(new THREE.SphereGeometry(r*1.06,96,64),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,
      vertexShader:'varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader:`uniform vec3 sun,atm;uniform float burn,exp;varying vec3 vN;varying vec3 vW;
        void main(){vec3 N=normalize(vN);vec3 V=normalize(cameraPosition-vW);float rim=-dot(N,V);
          // seen from outside, the back faces: 0 at the shell's edge, about .33 at the planet's limb (inside that, the planet hides it)
          float a=pow(smoothstep(.0,.34,rim),2.2);
          float lit=smoothstep(-.4,.6,dot(N,normalize(sun)));
          vec3 c=mix(atm,vec3(1.0,.45,.2),burn*.7)*a*(.12+1.7*lit);
          gl_FragColor=vec4(c*exp,1.0);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`}));
    if(K.cloud>0||kind==='astraea')group.add(atm);else atm.visible=false;
    function update(t){U.t.value=t;U.rot.value=t*(o.spin||.02);U.cloudRot.value=t*(o.spin||.02)*1.35;}
    function setSun(v){sun.value.copy(v).normalize();}
    return{group,surf,clouds,atm,U,update,setSun};}
  return{make,KIND};
})();
