/* Tide City's towers, one look for the level (js/tide/02-city.js) and the menu's city (js/menu/halo-scene.js).
   Nov 8 2026 (Bryce: up the city's graphics "or the best without effecting the performance"): all in the material, no new geometry
   per tower and no textures, so it costs the same draw calls as before:
   - each tower has its own character, from a hash of where it stands: window width, how many rooms are lit, warm/cool/white mix
   - windows sit on the faces (mullions run across each face, not on a diagonal), floors are aligned on every tier
   - glass is dark, smooth and reflective (it catches the sky through the scene's environment), between lighter spandrels
   - lit rooms vary: brightness, colour, a ceiling-light falloff inside each; some towers run edge lights up their corners,
     some light their setbacks (the top of each tier), and the ground floors glow as lobbies
   - far off, the window grid fades smoothly into an even lit surface (no sparkling), by how small the cells are on screen
   TOWER_LOOK(material, {far:[a,b]}) patches a MeshStandardMaterial (instanced or not) and returns it. */
function TOWER_LOOK(m,o){o=o||{};const far=o.far||[500,2800];
  m.roughness=.55;m.metalness=.15;
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
        float twH(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}`)
      .replace('void main() {','vec3 winGlow=vec3(0.0);float twGlass=0.0,twFar=0.0;\nvoid main() {')
      .replace('#include <color_fragment>',`#include <color_fragment>
        {float th=floor(vTI.x*997.0+.5)/997.0;vec3 lm=vLP*vTI.yzw;
        float roof=step(.5,vLN.y),side=1.0-step(.5,abs(vLN.y));
        vec2 tn=normalize(vLN.xz+vec2(1e-4));float u=dot(lm.xz,vec2(-tn.y,tn.x));
        float fy=vWP.y,mw=2.6+1.6*fract(th*7.31);
        float dist=length(vWP-cameraPosition);
        // how small a window is on screen: past ~3 px the grid fades into its average
        float px=max(fwidth(fy)/4.4,fwidth(u)/mw),twD=smoothstep(${far[0].toFixed(1)},${far[1].toFixed(1)},dist);twFar=max(smoothstep(.3,.6,px)*.8,twD);
        float fl=fract(fy/4.4),cu=fract(u/mw);
        float curtain=step(.7,fract(th*3.7));   // some towers are all glass, thin spandrels
        float glass=smoothstep(.06,.1,fl)*(1.0-smoothstep(curtain>.5?.9:.7,curtain>.5?.94:.74,fl))*smoothstep(.0,.05,cu)*(1.0-smoothstep(.95,1.0,cu));
        glass=mix(glass,curtain>.5?.7:.5,twFar)*side;twGlass=glass;
        vec3 base=diffuseColor.rgb*(.9+.1*twH(vec3(floor(fy/4.4),th,1.0)));
        vec3 gl=diffuseColor.rgb*vec3(.09,.2,.31)+vec3(.01,.025,.045);
        diffuseColor.rgb=mix(base,gl,glass*.94);
        diffuseColor.rgb*=1.0-roof*.45;
        // lit rooms: each tower its own share lit and its own mix; far off, cells merge so towers keep a pattern without sparkling
        float big=step(.5,twD);vec2 cell=vec2(floor(u/(mw*(1.0+big))),floor(fy/(4.4*(1.0+big))));
        float hs=twH(vec3(cell,th*91.7)),h2=twH(vec3(cell.yx,th*13.1+4.0));
        float litR=.2+.3*fract(th*13.7);
        vec3 wc=h2<.55?vec3(1.0,.74,.42):h2<.82?vec3(.95,.9,.8):vec3(.45,.78,1.0);
        wc=mix(wc,vec3(.5,.82,1.0),step(.85,fract(th*5.3))*.6);   // a few towers mostly Keeper blue
        float room=mix(.55+.45*(1.0-abs(fl-.62)*2.2),1.0,twFar);          // brighter under the ceiling
        winGlow=glass*step(hs,litR)*(.5+.7*fract(hs*37.0))*wc*room*mix(1.0,.85,twFar);
        // edge lights up the corners on some towers, setback light at the top of each tier on others, lobbies at the foot
        float a=atan(vLP.z,vLP.x),edge=(1.0-smoothstep(-.995,-.975,cos(4.0*a)))*step(.74,th)*side*vIn;
        float topBand=vIn*side*step(1.0-1.1/max(vTI.z,1.0),vLP.y)*step(.42,fract(th*2.9));
        float lobby=side*(1.0-smoothstep(7.0,11.0,fy))*glass;
        winGlow+=edge*vec3(.3,.8,1.0)*1.1*mix(1.0,.6,twFar)+topBand*mix(vec3(1.0,.85,.6),vec3(.45,.85,1.0),step(.6,fract(th*8.1)))*.9+lobby*vec3(1.0,.8,.55)*.8;}`)
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=winGlow;')
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,mix(.06,.2,twFar),twGlass);')
      .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,.4,twGlass);');
  };
  m.customProgramCacheKey=()=>'towerlook2';
  return m;}
