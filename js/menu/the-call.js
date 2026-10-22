/* THE CALL · the archive menu's secret, and the footage buttons on the archive cards.
   Leave the menu alone for 5 to 10 minutes and the menu music starts to drift and distort, the view creeps, the background
   flickers once, and the screen goes black. Then a piece of recovered footage plays, in 3D (js/menu/footage.js):
     1 · The Call    (Archive 01's footage)   Michael asks ELYRA where the Hollow is. "Because you are already there."
     2 · The Return  (Archive 02's footage)   the coordinates, twenty-three years, the empty facility, the thing outside.
     3 · The Hollow  (after Archive 02)   the night before Tide City: Michael goes back down, alone. The names. His own. The warning.
   Left alone, the menu plays the next one this device has not seen (never ahead of the story: 2 after Archive 01, 3 after Archive 02).
   Afterwards the menu remembers: a tiny red light blinks in the background and the menu music is different (1), the footer
   shows an access record (2), and after the third there is no music at all and ELYRA says one more line.
   Every footage can also be played from the Recovered logs panel and the service record drawer.
   The 3D (three.js, the people and the models) loads only when footage is about to play.
   Links: index.html?watch=1 (2, 3) shows a tap-to-play card for that footage; ?call=1 (2, 3) runs the idle version after 4 s.
   Enter, Esc or the Skip button (shown on any tap) skip it. */
(()=>{
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const KEY='elyra.call';
let mem={seen:0,views:0};try{Object.assign(mem,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(_){}
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(mem));}catch(_){}};
const achs=()=>{try{if(typeof PG!=='undefined')return PG.save.ach||{};return(JSON.parse(localStorage.getItem('elyra.save.v1')||'{}').ach)||{};}catch(_){return{};}};
const qs=new URLSearchParams(location.search),FORCE=+qs.get('call')||0,WATCH=+qs.get('watch')||0;
// the footage this device sees next: never skips one, never runs ahead of the story
function tierNow(){if(FORCE>=1&&FORCE<=3)return FORCE;const a=achs(),prog=a.astraea?3:a.origin?2:1;/* the third reel comes after Archive 02: the warning before Tide City */return Math.min(prog,mem.seen+1);}
let silentSession=false;   // after The Hollow: no menu music for the rest of this visit
const AU=CALL_AU,V=CALL_V;
let R=null;

/* ---------- loading the 3D only when it is needed ---------- */
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/GammaCorrectionShader.js','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js',
  'js/shared/core.js?v=1796200000','js/origin/02-people.js?v=1796200000','js/shared/models.js?v=1796200000','js/shared/leviathan.js?v=1796200000','js/shared/skyline.js?v=1796200000','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/environments/RoomEnvironment.js','js/menu/footage.js?v=1796200000'];
let libsP=null;
function loadFootage(){if(typeof FOOTAGE!=='undefined')return Promise.resolve();
  return libsP||(libsP=LIBS.reduce((p,src)=>p.then(()=>new Promise((ok,no)=>{if(src.includes('three.min.js')&&window.THREE)return ok();
    const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('could not load '+src));document.head.appendChild(s);})),Promise.resolve())
    .then(()=>{if(typeof MODELS!=='undefined')MODELS.preload&&MODELS.preload(['marine-hi']);}).catch(e=>{libsP=null;throw e;}));}

/* =====================================================================================================================
   STARTING IT · idle detection, the slow build on the menu, then the footage
   ===================================================================================================================== */
let idleT=0,limit=FORCE?4:300+Math.random()*300;
const bump=()=>{if(R){if(R.build)R.build.cancel();return;}idleT=0;};
for(const ev of['pointermove','pointerdown','keydown','wheel','touchstart','scroll'])addEventListener(ev,bump,{capture:true,passive:true});
setInterval(()=>{if(R||document.hidden)return;if(document.querySelector('#drawer:not([hidden]),#confirm:not([hidden])'))return;idleT+=1;if(idleT>=limit)play(tierNow());},1000);

// the build: the music bends, the view creeps, the background flickers once, then black. Any input stops it
const fade=document.createElement('div');fade.style.cssText='position:fixed;inset:0;z-index:48;background:#000;opacity:0;pointer-events:none;transition:opacity 1.2s';document.body.appendChild(fade);
function buildup(){return new Promise(res=>{
  const bg=document.getElementById('bg'),wrap=document.querySelector('.wrap'),els=[bg,wrap].filter(Boolean),t0=performance.now(),DUR=21;let flick=false,done=false,id=0;
  AU.distort(DUR);loadFootage().catch(()=>{});
  const restore=()=>{for(const e of els){e.style.transform='';e.style.opacity='';e.style.transition='';}};
  const end=ok=>{if(done)return;done=true;cancelAnimationFrame(id);restore();res(ok);};
  R.build={cancel:()=>{end(false);fade.style.opacity=0;if(!silentSession)AU.music(mem.seen>=1?'b':'a');}};
  (function tick(){if(done)return;const s=(performance.now()-t0)/1000,u=Math.min(1,s/DUR);
    if(!still)for(const e of els){e.style.transformOrigin='50% 46%';e.style.transform=`translate(${-u*u*16}px,${u*u*7}px) scale(${1+u*u*.03})`;}
    if(!flick&&s>12.5){flick=true;if(bg){bg.style.opacity='.12';setTimeout(()=>{bg.style.opacity='';},still?250:80);}if(wrap&&!still){wrap.style.opacity='.55';setTimeout(()=>{wrap.style.opacity='';},60);}}
    if(s>DUR-1.3)fade.style.opacity=1;
    if(s>=DUR)return end(true);id=requestAnimationFrame(tick);})();});}

// instant: from a button (no build-up, and it does not count toward the secret)
async function play(tier,instant){
  if(R)return;R={tier};
  if(!instant&&tier!==3&&!(await buildup())){R=null;idleT=0;return;}
  R.build=null;fade.style.opacity=1;
  for(const d of document.querySelectorAll('.drawer'))d.hidden=true;
  AU.stopMusic(tier===3?1.2:.05);V.hush();
  try{await loadFootage();}catch(e){console.error(e);fade.style.opacity=0;R=null;AU.music(mem.seen>=1?'b':'a');alert('The footage could not load. Check your connection and try again.');return;}
  if(!instant){mem.seen=Math.max(mem.seen,tier);}mem.views=(mem.views||0)+1;store();
  FOOTAGE.play(tier,{done:()=>{fade.style.transition='none';fade.style.opacity=0;requestAnimationFrame(()=>fade.style.transition='opacity 1.2s');finish(tier,instant);}});
}
addEventListener('keydown',e=>{if((e.key==='m'||e.key==='M')&&!e.metaKey&&!e.ctrlKey&&!e.altKey)AU.toggle();});

function finish(tier,instant){
  R=null;idleT=0;limit=FORCE?1e9:300+Math.random()*300;
  after();
  if(tier===3&&!instant){silentSession=true;AU.stopMusic(.05);
    // the menu again, no music at all. Then, quietly:
    setTimeout(()=>{const el=document.createElement('div');el.className='call-say';el.innerHTML='<b>ELYRA</b>Michael is not finished.';document.body.appendChild(el);
      requestAnimationFrame(()=>el.classList.add('on'));V.say('ELYRA','Michael is not finished.','soft').then(()=>{setTimeout(()=>{el.classList.remove('on');setTimeout(()=>el.remove(),2200);},1800);});},7000);}
  else if(!silentSession)AU.music(mem.seen>=1?'b':'a');
}
// what the menu keeps: the red light, the access record, the changed music
function after(){
  if(mem.seen>=1&&!document.querySelector('.call-light')){const ctr=document.querySelector('.center');if(ctr){const l=document.createElement('span');l.className='call-light';l.setAttribute('aria-hidden','true');ctr.appendChild(l);}}
  if(mem.seen>=2){const foot=document.querySelector('.foot');let r=document.querySelector('.call-rec');if(foot&&!r){r=document.createElement('div');r.className='call-rec';const fail=foot.querySelector('.fail');foot.insertBefore(r,fail);}
    if(r)r.textContent='ACCESS RECORD: MICHAEL — '+(mem.seen>=3?18:17)+' ENTRIES';}
}
after();
AU.music(mem.seen>=1?'b':'a');
/* ---------- playing on purpose: the chips on the archive cards, the drawer, and ?watch=N ---------- */
// index.html?unlock=1 opens every reel and log on this device (for testing; ?unlock=0 locks them again)
const UNLOCK_ALL=(function(){try{if(/[?&]unlock=1/.test(location.search))localStorage.setItem('elyra.unlockAll','1');if(/[?&]unlock=0/.test(location.search))localStorage.removeItem('elyra.unlockAll');return localStorage.getItem('elyra.unlockAll')==='1';}catch(_){return /[?&]unlock=1/.test(location.search);}})();
const FOOT=[['01','THE CALL','Michael asks ELYRA where the Hollow is.'],['02','THE RETURN','Twenty-three years. The camera outside.'],['03','THE HOLLOW','He goes back down. The names on the wall.'],
  ['04','NO CONTACT','Nothing from the Pathfinder. Something from her dropship.','pathfinder'],['05','THE BEACON','Dropship Two’s cockpit, the night before.','deadground'],['06','THE WHITE CITY','Eleven seconds, whole.','deadground']];
window.ELYRA_FOOTAGE=n=>{AU.start();play(n,true);};
function drawFootage(){const box=document.querySelector('#drawer .in');if(!box)return;let el=document.getElementById('callFoot');
  if(!el){el=document.createElement('div');el.id='callFoot';const x=box.querySelector('.x');box.insertBefore(el,x);}
  el.innerHTML='<h2 style="color:#e8463c">RECOVERED FOOTAGE <span style="color:var(--dim);font-family:var(--mono);font-size:11px;letter-spacing:.08em">SOURCE: M. HALL · SLEEP CYCLE</span></h2><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">'+FOOT.map((f,i)=>{const open=UNLOCK_ALL||!f[3]||achs()[f[3]];
    return `<button type="button" class="paint" data-w="${i+1}" ${open?'':'disabled'} style="border-color:rgba(232,70,60,.5)"><b style="font:500 13px var(--display);letter-spacing:.14em">${f[0]} · ${open?f[1]:'SEALED'}</b><small>${open?f[2]:'Clear Pathfinder '+(f[3]==='pathfinder'?'Arc 01':'Arc 02')+' to recover it.'}</small></button>`;}).join('')+'</div>';
  el.querySelectorAll('button[data-w]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('drawer').hidden=true;window.ELYRA_FOOTAGE(+b.dataset.w);}));}
const rb=document.getElementById('recBtn');if(rb)rb.addEventListener('click',drawFootage);
// a link straight to the footage: one tap first, so the sound and the voices are allowed to start
if(WATCH>=1&&WATCH<=FOOT.length){loadFootage().catch(()=>{});const g=document.createElement('button');g.type='button';
  g.style.cssText="position:fixed;inset:0;z-index:49;width:100%;border:0;background:rgba(0,0,0,.92);color:#e6e4df;font:500 clamp(14px,2.2vw,20px) 'Chakra Petch',sans-serif;letter-spacing:.3em;cursor:pointer";
  g.innerHTML=`<span style="color:#e8463c;font:600 11px 'JetBrains Mono',monospace;letter-spacing:.3em;display:block;margin-bottom:14px">RECOVERED FOOTAGE ${FOOT[WATCH-1][0]}</span>▶ ${FOOT[WATCH-1][1]}<span style="display:block;margin-top:14px;font:400 10px 'JetBrains Mono',monospace;letter-spacing:.2em;color:rgba(230,228,223,.5)">TAP TO PLAY · SOUND ON</span>`;
  document.body.appendChild(g);g.addEventListener('click',()=>{g.remove();window.ELYRA_FOOTAGE(WATCH);});}
// the red light and the line ELYRA says after the menu goes silent need their styles
const st=document.createElement('style');st.textContent=`
.call-light{position:absolute;left:9%;top:83%;width:3px;height:3px;border-radius:50%;background:#e8463c;box-shadow:0 0 5px 1px rgba(232,70,60,.8);pointer-events:none;animation:callb 3.1s steps(1) infinite}
@keyframes callb{0%{opacity:1}7%{opacity:.08}52%{opacity:1}55%{opacity:.08}60%{opacity:1}}
.call-rec{color:rgba(232,70,60,.8)!important}
.call-say{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 10vh);transform:translateX(-50%);z-index:30;pointer-events:none;text-align:center;
  font:500 15px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.06em;color:#cfd8ff;text-shadow:0 0 8px #000;background:rgba(3,3,4,.82);padding:10px 18px;opacity:0;transition:opacity 2s}
.call-say b{display:block;font:500 10px 'JetBrains Mono',monospace;letter-spacing:.26em;color:#e8463c;margin-bottom:4px}.call-say.on{opacity:1}`;
document.head.appendChild(st);
})();
