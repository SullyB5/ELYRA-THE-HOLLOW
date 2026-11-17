/* Tide City's towers, one look for the level (js/tide/02-city.js) and the menu's city (js/menu/halo-scene.js).
   Nov 8 2026 (Bryce: up the city's graphics "or the best without effecting the performance"): all in the material, no new geometry
   per tower and no textures, so it costs the same draw calls as before:
   - each tower has its own character, from a hash of where it stands: window width, how many rooms are lit, warm/cool/white mix
   - windows sit on the faces (mullions run across each face, not on a diagonal), floors are aligned on every tier
   - glass is dark, smooth and reflective (it catches the sky through the scene's environment), between lighter spandrels
   - lit rooms vary: brightness, colour, a ceiling-light falloff inside each; some towers run edge lights up their corners,
     some light their setbacks (the top of each tier), and the ground floors glow as lobbies
   - far off, the window grid fades smoothly into an even lit surface (no sparkling), by how small the cells are on screen
   Nov 9: o.lin for a scene with sRGB output (the window colours were picked for the menu's linear output); o.glow scales the lit windows (the menu's night city: darker towers, brighter rooms).
   TOWER_LOOK(material, {far:[a,b], glow}) patches a MeshStandardMaterial (instanced or not) and returns it. */
/* Nov 16 2026 (Bryce: the towers looked "like a checkerboard of light", not buildings): the facade rebuilt. Each tower now has
   a real facade style (curtain-wall glass, punched stone windows, ribbon windows, or a pilaster grid), with floor slabs, thin
   mullions between narrow panes, corner piers on the square towers, a stone parapet line at each setback and weathering toward the
   base. Lit rooms are a few panes wide and much rarer (5-17% of rooms, with the odd whole office floor on), dimmer, and lit from
   the ceiling, so a tower reads as a building with people in it, not a lit grid. Far off, everything blends to its average. */
function TOWER_LOOK(m,o){o=o||{};const far=o.far||[500,2800],gk=(o.glow||1).toFixed(2),lin=!!o.lin;
  m.roughness=.6;m.metalness=.12;
  m.extensions={derivatives:true};
  m.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vLP;varying vec3 vLN;varying vec4 vTI;varying float vIn;')
      .replace('#include <project_vertex>',`#include <project_vertex>
        vec4 wpp=vec4(transformed,1.0);vec3 isc=vec3(1.0);vec2 ixz=vec2(0.0);vIn=0.0;
        #ifdef USE_INSTANCING
        wpp=instanceMatrix*wpp;isc=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));ixz=instanceMatrix[3].xz;vIn=1.0;
        #endif
        vWP=(modelMatrix*wpp).xyz;vLP=position;vLN=normal;
        vTI=vec4(fract(sin(dot(floor(ixz*.5),vec2(12.9898,78.233)))*43758.5453),isc);`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 vWP;varying vec3 vLP;varying vec3 vLN;varying vec4 vTI;varying float vIn;
        float twH(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
        float twB(float x,float a,float b,float w){return smoothstep(a-w,a+w,x)-smoothstep(b-w,b+w,x);}
        float twN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=twH(vec3(i,1.0)),b=twH(vec3(i+vec2(1,0),1.0)),c=twH(vec3(i+vec2(0,1),1.0)),d=twH(vec3(i+1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}`)
      .replace('void main() {','vec3 winGlow=vec3(0.0);float twGlass=0.0,twFar=0.0;\nvoid main() {')
      .replace('#include <color_fragment>',`#include <color_fragment>
        {float th=floor(vTI.x*997.0+.5)/997.0;vec3 isc=vTI.yzw;vec3 lm=vLP*isc;
        float roof=step(.5,vLN.y),side=1.0-step(.5,abs(vLN.y));
        vec2 tn=normalize(vLN.xz+vec2(1e-4));float u=dot(lm.xz,vec2(-tn.y,tn.x));
        float boxF=step(.999,max(abs(vLN.x),abs(vLN.z)))*vIn;
        if(boxF<.5&&vIn>.5)u=atan(vLP.z,vLP.x)*.5*isc.x;   // round towers: round the circumference (the normal follows the position there)
        float fy=vWP.y,dist=length(vWP-cameraPosition);
        float sty=floor(fract(th*5.17)*4.0);                       // 0 curtain glass, 1 punched stone, 2 ribbon windows, 3 pilaster grid
        float FH=3.5+.5*fract(th*3.1);                              // floor height
        float PW=sty==1.0?2.4:sty==2.0?1.9:1.4+.5*fract(th*7.7);   // pane pitch
        float uw=fwidth(u);if(boxF<.5&&vIn>.5)uw=min(uw,fwidth(atan(-vLP.z,-vLP.x)*.5*isc.x));
        float aF=fwidth(fy)/FH,aP=uw/PW;
        float dfar=smoothstep(${far[0].toFixed(1)},${far[1].toFixed(1)},dist);
        float fF=max(smoothstep(.14,.42,aF),dfar),fP=max(smoothstep(.12,.36,aP),fF);   // floors stay readable after the panes have merged
        float fade=fF;twFar=fF;
        float fl=fract(fy/FH),cu=fract(u/PW),wF=max(aF,.004),wP=max(aP,.004);
        // the panes, per style: a band per floor times a band per pane, each blended to its average once it is too small to draw
        float vb,hb,vA,hA;
        if(sty==0.0){vb=twB(fl,.1,.97,wF);vA=.87;hb=twB(cu,.035,.965,wP);hA=.93;}
        else if(sty==1.0){vb=twB(fl,.28,.86,wF);vA=.58;hb=twB(cu,.24,.76,wP);hA=.52;}
        else if(sty==2.0){vb=twB(fl,.36,.9,wF);vA=.54;hb=twB(cu,.02,.98,wP);hA=.96;}
        else{float pil=step(.76,fract(u/(PW*4.0)));vb=twB(fl,.16,.93,wF);vA=.77;hb=twB(cu,.07,.93,wP)*(1.0-pil);hA=.65;}
        float gD=mix(vb,vA,fF)*mix(hb,hA,fP),gA=vA*hA;
        // square towers: stone piers up the corners
        float hw=.5*(abs(vLN.x)>.5?isc.z:isc.x);
        float pier=boxF*smoothstep(hw-1.7-wP*PW,hw-1.5,abs(u));
        gD*=1.0-pier*(1.0-fF);gA*=1.0-.12*boxF;
        // a stone parapet line at the top of each tier
        float parap=vIn*side*step(1.0-1.4/max(isc.y,1.0),vLP.y);
        float glass=mix(gD,min(gA+.12,1.0),dfar)*side*(1.0-parap);twGlass=glass;
        // stone: the tower's tint, a little variation per floor, weathered and darker toward the street
        float fIdx=floor(fy/FH);
        vec3 stone=diffuseColor.rgb*(.88+.12*twH(vec3(fIdx,th,1.0)));
        float grime=(1.0-smoothstep(3.0,40.0,fy))*.25+twN(vec2(u*.35,fy*.025+th*40.0))*.12*(1.0-fade);
        stone*=1.0-grime;stone=mix(stone,stone*1.08,parap);
        // glass: dark and reflective, some panes with pale blinds drawn
        float paneH=twH(vec3(floor(u/PW),fIdx,th*7.0));
        vec3 gl=diffuseColor.rgb*vec3(.08,.14,.2)+vec3(.012,.022,.035);
        gl=mix(gl,diffuseColor.rgb*.22,step(.86,paneH)*(1.0-fade)*.7);
        diffuseColor.rgb=mix(stone,gl,glass);
        diffuseColor.rgb*=1.0-roof*.5;
        // lit rooms: a few panes wide, rarer and dimmer, brighter under the ceiling; now and then a whole office floor on
        float RP=2.0+floor(fract(th*9.1)*3.0),rw=PW*RP;
        vec2 cell=vec2(floor(u/rw),fIdx);
        float hs=twH(vec3(cell,th*91.7)),h2=twH(vec3(cell.yx,th*13.1+4.0));
        float litR=.05+.12*fract(th*13.7);
        float office=step(twH(vec3(fIdx,th,3.0)),.03);
        float lit=max(step(hs,litR),office);
        vec3 wc=h2<.5?vec3(1.0,.72,.42):h2<.85?vec3(.95,.86,.7):vec3(.55,.8,1.0);
        wc=mix(wc,vec3(.75,.88,1.0),office*.7);
        float b=(.28+.38*fract(hs*37.0))*mix(1.0,.55,office);
        float inside=.45+.55*smoothstep(.15,.85,fl);                       // light falls off from the ceiling
        float curt=smoothstep(0.0,.18,fract(u/rw))*smoothstep(1.0,.82,fract(u/rw));
        vec3 nearG=gD*lit*b*wc*mix(inside,.75,fF)*mix(.55,1.0,mix(curt,1.0,fP));
        vec3 farG=gA*((litR+.03)*1.4)*vec3(1.0,.84,.64);   // (brighter than the true average: far off, a night city reads by its lights)
        float fRoom=smoothstep(.5,1.4,max(aF,uw/rw));   // rooms stay as points of light until they are smaller than a pixel
        winGlow=mix(nearG,farG,fRoom)*side*(1.0-parap);
        // lobbies glow at the foot; a few towers light their setbacks or run thin lights up their corners
        float lobby=side*vIn*(1.0-smoothstep(7.5,8.0,fy))*smoothstep(3.4,3.6,fy)*(1.0-pier)*twB(cu,.05,.95,wP);
        diffuseColor.rgb=mix(diffuseColor.rgb,gl,lobby*.9);
        float edge=pier*step(.86,th)*side;
        winGlow+=lobby*vec3(1.0,.78,.5)*.12*(1.0-dfar)+parap*step(.5,fract(th*2.9))*mix(vec3(1.0,.82,.55),vec3(.45,.82,1.0),step(.6,fract(th*8.1)))*.35+edge*vec3(.3,.75,1.0)*.35;}`)
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+='+(lin?'pow(winGlow,vec3(2.2))':'winGlow')+'*'+gk+';')
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,mix(.08,.45,twFar),twGlass);')
      .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,mix(.45,.12,twFar),twGlass);');
  };
  m.customProgramCacheKey=()=>'towerlook3'+gk+(lin?'L':'');
  return m;}

/* Nov 16 2026: what stands on the towers, so they read as buildings and not stacked blocks: a stone cap at the top of every tier
   (a touch wider than the tier, like a cornice), and plant rooms, water tanks and a mast or two on the roofs. Seeded from where each
   tower stands, so it never moves the city's own random numbers.
   TOWER_DRESS(towers) -> {caps:{box:[],cyl:[],hex:[]}, mech:[]}: lists of {m, T} (m a Matrix4); each tower needs x,z,fp,h,h1,h2,kind,rot. */
function TOWER_DRESS(list){
  const out={caps:{box:[],cyl:[],hex:[]},mech:[]},q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),s=new THREE.Vector3();
  const M=(x,y,z,sx,sy,sz,ry)=>new THREE.Matrix4().compose(v.set(x,y,z),q.setFromEuler(e.set(0,ry,0)),s.set(sx,sy,sz));
  for(const T of list){if(T.h1==null)continue;
    let sd=Math.abs(Math.floor(T.x*13.1+T.z*7.7))%2147483646+1;const r=()=>((sd=(sd*16807)%2147483647)-1)/2147483646;
    const tiers=[[T.fp,T.h1],[T.fp*.76,T.h2],[T.fp*.5,T.h]];
    for(const[w,top]of tiers)out.caps[T.kind].push({T,m:M(T.x,3+top-.4,T.z,w*1.035,1.3,w*1.035,T.rot)});
    const w=T.fp*.5,top=3+T.h+.9,n=1+((r()*3)|0),c=Math.cos(T.rot),sn=Math.sin(T.rot);
    for(let i=0;i<n;i++){const lx=(r()-.5)*w*.5,lz=(r()-.5)*w*.5,bw=w*(.18+r()*.22),bh=1.8+r()*3.5;
      out.mech.push({T,m:M(T.x+lx*c+lz*sn,top,T.z-lx*sn+lz*c,bw,bh,bw*(.7+r()*.6),T.rot)});}
    if(r()<.35)out.mech.push({T,m:M(T.x,top,T.z,.5,8+r()*14,.5,0)});   // a mast
  }
  return out;}
