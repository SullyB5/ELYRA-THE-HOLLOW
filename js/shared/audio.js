/* Elyra shared audio: recorded samples where a file fits (js/shared/sfx-map.js, one line per event) and synthesized WebAudio
   sound for everything else, and as the stand-in for any sample that hasn't loaded yet. Everything is placed by distance from
   the camera (quieter, panned, and muffled with distance); your own gun is centred and full. The radio speaks through the most
   natural voices the device has. Hooks the shared fire/boom/missile calls, so it loads after fx.js and combat.js (and after
   sfx-map.js, which every page loads just before it); each chapter adds a small glue file for its own events and loops.
   M (or a Sound button a chapter mounts) mutes; the choice is remembered across chapters. Settings: SFX and Music volume.

   Mix: world sounds → bus (cutscenes duck it) → duckG (big moments duck it) → sfxG (SFX slider) → compressor → master → limiter.
   The radio click and the big moment itself go round the ducks; the score goes through musG (Music slider). Indoors a
   light reverb is fed from the world bus (sfx.indoor). Sample files load in the background a moment after the level has started. */
const sfx=(()=>{
  let ctx=null,master=null,bus=null,noise=null,on=true,voices=0,speech=false;
  let hero=null,ui=null,duckG=null,sfxG=null,musG=null,revIn=null;
  const VOL={sfx:1,music:1};
  try{const a=parseFloat(localStorage.getItem('elyra.vol.sfx')),b=parseFloat(localStorage.getItem('elyra.vol.music'));if(a>=0&&a<=1)VOL.sfx=a;if(b>=0&&b<=1)VOL.music=b;}catch(_){}
  // spoken lines: off by default (Oct 21, Bryce: the browser's built-in voices made people take the story less seriously). Cutscenes and
  // radio run on subtitles with a radio click, paced by reading time. Settings → Voices turns the browser voices back on until real
  // recordings exist.
  try{speech=localStorage.getItem('elyra.voices')==='on';}catch(_){}
  try{on=localStorage.getItem('tideAudio')!=='off';}catch(_){}
  const last={};
  const limit=(k,gap)=>{const t=performance.now();if(t-(last[k]||0)<gap)return false;last[k]=t;return true;};
  let held=false;   // true while the game is paused
  function start(){
    if(ctx){if(ctx.state!=='running'&&!held)ctx.resume().catch(()=>{});return;}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    try{ctx=new AC();}catch(_){return;}
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.25;
    // a brick-wall limiter last, so a big fight can never clip
    const lim=ctx.createDynamicsCompressor();lim.threshold.value=-2;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.12;
    master=ctx.createGain();master.gain.value=on?.8:0;bus=ctx.createGain();bus.gain.value=1;
    duckG=ctx.createGain();sfxG=ctx.createGain();sfxG.gain.value=VOL.sfx;musG=ctx.createGain();musG.gain.value=VOL.music;
    hero=ctx.createGain();ui=ctx.createGain();
    bus.connect(duckG);duckG.connect(sfxG);hero.connect(sfxG);ui.connect(sfxG);sfxG.connect(comp);comp.connect(master);musG.connect(master);master.connect(lim);lim.connect(ctx.destination);
    const len=ctx.sampleRate*2;noise=ctx.createBuffer(1,len,ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    // indoor reverb: a short dark room (1.4 s of decaying noise), fed from the world bus only while sfx.indoor() says so
    try{const rl=Math.floor(ctx.sampleRate*1.4),ir=ctx.createBuffer(2,rl,ctx.sampleRate);
      for(let c=0;c<2;c++){const x=ir.getChannelData(c);let lp=0;for(let i=0;i<rl;i++){lp+=(Math.random()*2-1-lp)*.35;x[i]=lp*Math.pow(1-i/rl,3.2)*(i<ctx.sampleRate*.008?i/(ctx.sampleRate*.008):1);}}
      const cv=ctx.createConvolver();cv.buffer=ir;revIn=ctx.createGain();revIn.gain.value=0;bus.connect(revIn);revIn.connect(cv);cv.connect(duckG);}catch(_){revIn=null;}
    initLoops();
    for(const f of onStart)f();
  }
  for(const ev of['pointerdown','touchend','keydown'])addEventListener(ev,start,{capture:true,passive:true});
  // iOS only lets speech play after an utterance is started inside a real tap (touchend or click: a touch going down does not count).
  // Keep trying on every tap until one line has actually begun speaking.
  let speechOK=false,unlocking=false;
  function unlockSpeech(){if(speechOK||unlocking||!window.speechSynthesis)return;unlocking=true;
    try{const u=new SpeechSynthesisUtterance('.');u.volume=.01;u.rate=2;u.onstart=()=>{speechOK=true;};u.onend=u.onerror=()=>{unlocking=false;};speechSynthesis.speak(u);setTimeout(()=>{unlocking=false;},1500);}catch(_){unlocking=false;}}
  for(const ev of['touchend','click','keydown'])addEventListener(ev,unlockSpeech,{capture:true,passive:true});

  /* ---------- building blocks ---------- */
  // where a sound sits: quieter with distance, panned left/right of the camera
  const _ap=new THREE.Vector3(),_ar=new THREE.Vector3();
  function place(pos,ref){
    if(!pos)return{g:1,pan:0};
    const d=camera.position.distanceTo(pos)*(window.AUDIO_SCALE||1),g=1/(1+Math.pow(d/ref,1.6));   // AUDIO_SCALE: a page in metres sets it so distances sound right
    _ap.subVectors(pos,camera.position).normalize();_ar.set(Math.cos(camera.rotation.y),0,-Math.sin(camera.rotation.y));
    return{g,pan:clamp(_ap.dot(_ar),-1,1)*.8,d};
  }
  // dest: 'hero' (round the ducks: the big moment itself), 'ui' (the radio click: under no duck), else the world bus
  const destOf=k=>k==='hero'?hero:k==='ui'?ui:bus;
  function out(gain,pan,dest){
    const g=ctx.createGain();g.gain.value=0;const D=destOf(dest);
    if(pan&&ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(D);}else g.connect(D);
    return g;
  }
  function env(g,t,a,peak,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);}
  function track(node,dur){voices++;node.onended=()=>{voices--;};}
  // filtered noise burst: explosions, booms, whooshes, rumbles
  function burst(o){
    if(!ctx||!on||voices>40)return;
    const t=ctx.currentTime+(o.delay||0),s=ctx.createBufferSource();s.buffer=noise;s.loop=true;s.playbackRate.value=o.rate||1;
    const f=ctx.createBiquadFilter();f.type=o.type||'lowpass';f.frequency.setValueAtTime(o.f0,t);if(o.f1)f.frequency.exponentialRampToValueAtTime(o.f1,t+o.dec);f.Q.value=o.q||.7;
    const g=out(0,o.pan,o.dest);env(g,t,o.a||.005,o.vol,o.dec);
    s.connect(f);f.connect(g);s.start(t,Math.random()*1.5);s.stop(t+(o.a||.005)+o.dec+.05);track(s);
  }
  // oscillator sweep: lasers, zaps, engines, grunts
  function tone(o){
    if(!ctx||!on||voices>40)return;
    const t=ctx.currentTime+(o.delay||0),s=ctx.createOscillator();s.type=o.wave||'sine';s.frequency.setValueAtTime(o.f0,t);s.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1||o.f0),t+o.dec);
    if(o.detune)s.detune.value=o.detune;
    let tail=s;
    if(o.bp){const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=o.bp;f.Q.value=o.q||4;s.connect(f);tail=f;}
    else if(o.lp){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;s.connect(f);tail=f;}
    const g=out(0,o.pan,o.dest);env(g,t,o.a||.004,o.vol,o.dec);tail.connect(g);s.start(t);s.stop(t+(o.a||.004)+o.dec+.05);track(s);
  }

  const onStart=[];
  const R0=(a,b)=>a+Math.random()*(b-a);
  const inCut=()=>(typeof CUTS!=='undefined'&&CUTS.on)||(typeof PROLOGUE!=='undefined'&&PROLOGUE.on);
  const stats={};const count=k=>{stats[k]=(stats[k]||0)+1;};

  /* ---------- recorded samples (the event → file map is js/shared/sfx-map.js) ----------
     Files are fetched in the background a moment after the page has loaded (two at a time), decoded once the sound has started,
     and trimmed as they decode: the silent head and tail go, a loop gets a 40 ms crossfade over its seam. Until a file is ready,
     its events play their synthesized stand-ins. */
  const MAP=typeof SFX_MAP!=='undefined'?SFX_MAP:{ev:{}},EV=MAP.ev||{},BASE=MAP.base||'audio/sfx/';
  const RAWB={},BUF={},DER={};let loadStarted=false;
  const filesOf=S=>Array.isArray(S.f)?S.f:[S.f];
  const loopFile=n=>Object.keys(EV).some(k=>EV[k].loop&&filesOf(EV[k]).indexOf(n)>=0);
  function load(){if(loadStarted||typeof fetch!=='function')return;loadStarted=true;
    const names=[];for(const k in EV)for(const n of filesOf(EV[k]))if(names.indexOf(n)<0)names.push(n);let i=0;
    const next=()=>{if(i>=names.length)return;const n=names[i++];
      fetch(BASE+n+'.mp3').then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer();}).then(ab=>{RAWB[n]=ab;decode(n);}).catch(()=>{count('!load '+n);}).then(next);};
    next();next();}
  function decode(n){if(!ctx||!RAWB[n])return;const ab=RAWB[n];delete RAWB[n];
    try{const p=ctx.decodeAudioData(ab,b=>{BUF[n]=prep(b,loopFile(n));},()=>{count('!decode '+n);});if(p&&p.catch)p.catch(()=>{});}catch(_){count('!decode '+n);}}
  // trim at decode time: everything under -60 dBFS at either end goes (2 ms kept before the attack, 20 ms after the last sound)
  function prep(b,loop){const sr=b.sampleRate,ch=b.numberOfChannels,L=b.length,th=.001,C=[];for(let c=0;c<ch;c++)C.push(b.getChannelData(c));
    const lvl=i=>{let m=0;for(let c=0;c<ch;c++){const v=Math.abs(C[c][i]);if(v>m)m=v;}return m;};
    let a=0,z=L-1;while(a<L&&lvl(a)<th)a++;while(z>a&&lvl(z)<th)z--;
    a=Math.max(0,a-Math.floor(sr*.002));z=Math.min(L-1,z+Math.floor(sr*.02));const n=z-a+1;if(n<256)return b;
    const xf=loop?Math.min(Math.floor(sr*.04),n>>2):0,o=ctx.createBuffer(ch,n-xf,sr);
    for(let c=0;c<ch;c++){const s=C[c].subarray(a,z+1),d=o.getChannelData(c);d.set(s.subarray(0,n-xf));
      if(loop){for(let i=0;i<xf;i++){const k=i/xf*Math.PI/2;d[i]=s[i]*Math.sin(k)+s[n-xf+i]*Math.cos(k);}}   // the tail crossfades into the head
      else{const fi=Math.floor(sr*.002),fo=Math.min(n>>1,Math.floor(sr*.01));for(let i=0;i<fi;i++)d[i]*=i/fi;for(let i=0;i<fo;i++)d[n-1-i]*=i/fo;}}
    return o;}
  // a slice of a file (reload clicks, hit confirms, the short ray), forwards or backwards (the Herald charge-up)
  function derived(n,slice,rev){const key=n+'|'+(slice?slice.join(','):'')+'|'+(rev?1:0);if(DER[key])return DER[key];const b=BUF[n];if(!b)return null;
    const sr=b.sampleRate,a=slice?Math.min(b.length-64,Math.floor(slice[0]*sr)):0,len=Math.max(64,Math.min(b.length-a,slice?Math.floor(slice[1]*sr):b.length));
    const o=ctx.createBuffer(b.numberOfChannels,len,sr),fi=Math.min(len>>2,Math.floor(sr*.003)),fo=Math.min(len>>1,Math.floor(sr*(rev?.004:.025)));
    for(let c=0;c<b.numberOfChannels;c++){const s=b.getChannelData(c),d=o.getChannelData(c);for(let i=0;i<len;i++)d[i]=s[a+(rev?len-1-i:i)]||0;
      for(let i=0;i<fi;i++)d[i]*=i/fi;for(let i=0;i<fo;i++)d[len-1-i]*=i/fo;}
    return DER[key]=o;}
  // where a file is loudest (a flyby's closest pass), cached
  const PK=new WeakMap();
  function peakOf(b){if(PK.has(b))return PK.get(b);const d=b.getChannelData(0),w=Math.floor(b.sampleRate*.05);let best=0,bi=0;
    for(let i=0;i+w<d.length;i+=w){let e=0;for(let j=i;j<i+w;j+=4)e+=d[j]*d[j];if(e>best){best=e;bi=i;}}const t=bi/b.sampleRate;PK.set(b,t);return t;}

  const live2=new Set(),streams=new Map();let nextEv=null,nextT=0,ownSkip=0;
  const OWN_D=260;   // a gun this close to the camera (scaled units) is yours
  // play an event's sample. Returns false if its file isn't ready (the caller plays the synth instead), truthy otherwise
  // (including when it was too far away to hear or the voice cap dropped it: the synth would only add to the pile).
  // o: world (place an own event in the world), vol, rate, delay, offset, tail, env:[attack,hold,release], bend:[r0,r1,atSec,r2] (doppler),
  //    sweep:[pan0,pan1], pan, dest ('hero'/'ui'), cut, stream (key), refK, force
  function play(name,pos,o){o=o||{};const S=EV[name];if(!S||!ctx)return false;if(!on)return true;
    const fs=filesOf(S),fn=fs[(Math.random()*fs.length)|0];let b=BUF[fn];if(!b)return false;
    if(S.slice||S.rev){b=derived(fn,S.slice,S.rev);if(!b)return false;}
    const own=S.own&&!o.world;let g=1,pan=0,lpF=0;
    if(!own&&pos){const P=place(pos,(S.ref||600)*(o.refK||1));g=P.g;pan=P.pan;if(g<.012){count(name);return true;}
      if(g<.85)lpF=Math.min(18000,650+17000*Math.pow(g,1.25));}   // far away: muffled
    if(o.pan!=null)pan=o.pan;
    const cut=!!(S.cut||o.cut||inCut()),pri=own||cut||o.force||name.indexOf('door')===0;
    if(voices>(pri?52:40)){count('-cap');return true;}   // the voice cap: big fights don't distort
    const va=S.vary||[.05,.1],rate=(S.rate||1)*(o.rate||1)*(1+R0(-va[0],va[0])),vol=(S.vol==null?.4:S.vol)*(o.vol==null?1:o.vol)*g*(1+R0(-va[1],va[1]));
    const t=ctx.currentTime+(o.delay||0),src=ctx.createBufferSource(),gn=ctx.createGain();src.buffer=b;
    const off=Math.min(b.duration-.05,Math.max(0,o.offset||0)),len=(b.duration-off)/rate;let end=len;const tl=o.tail||S.tail;if(tl&&tl<end)end=tl;
    if(o.env){const ea=o.env[0],eh=o.env[1],er=o.env[2];end=Math.min(end,ea+eh+er);gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(vol,t+ea);
      gn.gain.setValueAtTime(vol,t+Math.max(ea,end-er));gn.gain.linearRampToValueAtTime(0,t+end);}
    else{gn.gain.setValueAtTime(vol,t);if(end<len-.01){gn.gain.setValueAtTime(vol,t+Math.max(0,end-.15));gn.gain.linearRampToValueAtTime(0,t+end);}}
    if(o.bend){const B=o.bend;src.playbackRate.setValueAtTime(rate*B[0],t);src.playbackRate.linearRampToValueAtTime(rate*B[1],t+B[2]);src.playbackRate.linearRampToValueAtTime(rate*B[3],t+Math.max(B[2]+.1,end));}
    else src.playbackRate.value=rate;
    let node=src;if(lpF){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=lpF;f.Q.value=.5;src.connect(f);node=f;}
    node.connect(gn);
    const D=destOf(S.big?'hero':o.dest);
    if((pan||o.sweep)&&ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=o.sweep?o.sweep[0]:pan;if(o.sweep)p.pan.linearRampToValueAtTime(o.sweep[1],t+end);gn.connect(p);p.connect(D);}
    else gn.connect(D);
    src.start(t,off);src.stop(t+end+.03);
    const V={src,gn,cut,name,key:null};voices++;live2.add(V);
    src.onended=()=>{voices--;live2.delete(V);if(V.key&&streams.get(V.key)===V)streams.delete(V.key);};
    // rapid fire: the new round fades the last one from the same shooter (its own gun, or whoever stands in the same few metres)
    if(S.stream){const q=60/(window.AUDIO_SCALE||1);
      const key=o.stream||(own?'own':name+':'+(pos?Math.round(pos.x/q)+','+Math.round(pos.y/q)+','+Math.round(pos.z/q):''));V.key=key;
      const pv=streams.get(key);if(pv&&pv!==V){try{pv.gn.gain.cancelScheduledValues(t);pv.gn.gain.setTargetAtTime(0,t,.013);pv.src.stop(t+.08);}catch(_){}}
      streams.set(key,V);}
    if(S.big)bigDuck(o.duck||2.5);
    if(S.seq)for(const q of S.seq)play(q[1],pos,Object.assign({},o,{delay:(o.delay||0)+q[0]}));
    count(name);return V;}
  // an event, or its synthesized stand-in when the file isn't ready
  function ev(name,pos,o,fb){const r=play(name,pos,o);if(r)return r;if(fb&&ctx&&on){count('~'+name);fb();}return false;}
  // stop every cutscene sound now (a skipped cutscene): a quick fade, no click
  function stopCut(){if(!ctx)return;const t=ctx.currentTime;for(const V of live2)if(V.cut){try{V.gn.gain.cancelScheduledValues(t);V.gn.gain.setTargetAtTime(0,t,.03);V.src.stop(t+.2);}catch(_){}}}
  // a huge moment: everything else drops for a moment and comes back
  function bigDuck(sec){if(!duckG)return;const t=ctx.currentTime;duckG.gain.cancelScheduledValues(t);duckG.gain.setTargetAtTime(.3,t,.04);duckG.gain.setTargetAtTime(1,t+Math.max(.5,sec*.45),Math.max(.3,sec*.25));}
  const kick=()=>setTimeout(()=>{(window.requestIdleCallback||(f=>setTimeout(f,1)))(load,{timeout:3000});},1500);   // after the level is up
  if(document.readyState==='complete')kick();else addEventListener('load',kick,{once:true});
  onStart.push(()=>{for(const n in RAWB)decode(n);});

  /* ---------- weapons ----------
     fire(from,to,speed,kind) → the kind's event. own: the event when it's your gun (the shot leaves within a few metres of the camera).
     s: the synthesized stand-in. The player's ground guns are played by playerGun() (it knows the slot and the Armory skin). */
  const KIND={
    rifle:{s:'player'},lance:{s:'player'},
    krifle:{e:'gun.squad',s:'keeper'},krifleR:{e:'gun.squad',s:'keeper'},mbolt:{e:'gun.fighter',own:'gun.pilot',s:'player'},mboltR:{e:'gun.fighter',s:'player'},hlaser:{e:'gun.fighter',own:'gun.pilot.zeal',s:'zeal'},keeper:{e:'gun.keeper.trooper',s:'keeper'},
    player:{e:'gun.fighter',own:'gun.pilot',s:'player'},zeal:{e:'gun.fighter',own:'gun.pilot.zeal',s:'zeal'},
    chain:{e:'gun.warthog',own:'gun.warthog.own',s:'keeper'},mech:{e:'gun.walker',own:'gun.walker',s:'friend'},friend:{e:'gun.capital',s:'friend'},flak:{e:'gun.flak',s:'flak'},
    pfgun:{e:'gun.pf.nose',own:'gun.pf.nose.own',s:'player'},pfbig:{e:'gun.pf.big',s:'friend'},
    rrifle:{e:'gun.herald.rifle',s:'fbolt'},arifle:{e:'gun.herald.rifle',s:'fbolt'},rbolt:{e:'gun.herald.fighter',s:'fbolt'},abolt:{e:'gun.herald.fighter',s:'fbolt'},
    fbolt:{e:'gun.herald.fighter',s:'fbolt'},enemy:{e:'gun.herald.capital',s:'enemy'},torp:{e:'gun.herald.bomber',s:'torp'},wbeam:{e:'gun.herald.warship',s:'enemy'},
    aflak:{e:'gun.herald.flak',s:'flak'},heavy:{e:'gun.heavy',s:'enemy'},
    hrifle:{e:'gun.hollow.trooper',s:'host'},host:{e:'gun.hollow.trooper',s:'host'},hbolt:{e:'gun.hollow.fighter',s:'fbolt'},hollow:{e:'gun.hollow.capital',s:'enemy'},hbig:{e:'gun.hollow.warship',s:'enemy'}};
  function shot(kind,from){
    if(!ctx||!on)return;
    // playerGun() already played it (Oct 28: whatever bolt colour your gun fires; a captured gun's bolt used to add its maker's
    // shot on top of yours)
    if(performance.now()-ownSkip<60&&(kind==='rifle'||kind==='lance'||(from&&camera.position.distanceTo(from)*(window.AUDIO_SCALE||1)<OWN_D))){ownSkip=0;return;}
    const K=KIND[kind]||(count('?kind '+kind),{s:null});let name=K.e,own=false;   // (an unknown kind shows in sfx.stats: it would be silent)
    if(K.own&&from&&camera.position.distanceTo(from)*(window.AUDIO_SCALE||1)<OWN_D){own=true;name=K.own;}
    if(nextEv&&performance.now()-nextT<30){name=nextEv;nextEv=null;}   // a call site said what this shot is (sfx.next)
    if(name&&play(name,from,own?null:{world:true}))return;
    if(name)count('~'+name);
    synthShot(K.s,from);
  }
  function synthShot(kind,from){
    if(!kind)return;
    const P=place(from,kind==='friend'?2400:kind==='enemy'||kind==='torp'?3400:kind==='flak'?900:kind==='fbolt'?700:kind==='player'||kind==='zeal'?500:380);
    if(kind==='player'||kind==='zeal'){
      // your own guns fire right beside the camera: full volume, crisp; anyone else's player-colour bolts are distant zips
      if(P.d<OWN_D){if(!limit('pl',80))return;const z=kind==='zeal';
        tone({wave:'square',f0:z?2000:1500,f1:z?700:520,dec:.065,vol:z?.08:.065,lp:z?5000:3600});tone({wave:'sawtooth',f0:220,f1:90,dec:.05,vol:.03,lp:900});
        if(z)tone({wave:'sine',f0:2600,f1:1800,dec:.05,vol:.03});return;}
      if(P.g<.05||!limit('plx',140))return;tone({wave:'square',f0:1300,f1:420,dec:.07,vol:.05*P.g,lp:3200,pan:P.pan});return;}
    if(P.g<.03)return;
    if(kind==='friend'){if(!limit('fr',70))return;   // heavy cannon: a deep thump and a crack
      tone({wave:'sine',f0:95,f1:34,dec:.9,vol:.55*P.g,pan:P.pan});burst({f0:1800,f1:200,dec:.6,vol:.45*P.g,pan:P.pan});}
    else if(kind==='enemy'){if(!limit('en',60))return;   // alien heavy laser
      tone({wave:'sawtooth',f0:420,f1:70,dec:.45,vol:.16*P.g,lp:1800,pan:P.pan});tone({wave:'square',f0:160,f1:55,dec:.5,vol:.08*P.g,lp:600,pan:P.pan});}
    else if(kind==='torp'){if(!limit('tp',150))return;   // bomber torpedo: a slow, heavy whoomp
      tone({wave:'sawtooth',f0:140,f1:40,dec:1.1,vol:.2*P.g,lp:500,pan:P.pan});burst({type:'bandpass',f0:500,f1:150,q:1,dec:1,vol:.25*P.g,pan:P.pan});}
    else if(kind==='flak'){if(!limit('fk',45))return;burst({type:'bandpass',f0:2400,f1:900,q:1.2,dec:.07,vol:.12*P.g,pan:P.pan});}
    else if(kind==='fbolt'){if(!limit('fb',70))return;tone({wave:'square',f0:1000,f1:280,dec:.09,vol:.06*P.g,lp:2400,pan:P.pan});}
    else if(kind==='host'){if(!limit('ho',55))return;tone({wave:'triangle',f0:820,f1:230,dec:.11,vol:.09*P.g,pan:P.pan});tone({wave:'square',f0:410,f1:115,dec:.08,vol:.03*P.g,lp:1400,pan:P.pan});}
    else if(kind==='keeper'){if(!limit('kp',55))return;tone({wave:'sine',f0:1500,f1:650,dec:.07,vol:.08*P.g,pan:P.pan});burst({type:'highpass',f0:3000,dec:.03,vol:.04*P.g,pan:P.pan});}
  }
  // your ground gun (js/origin/03-play.js): gun.<slot>.<Armory skin>, or the slot's standard issue if that skin has no line of its own
  function playerGun(slot,skin){
    let name='gun.'+slot+'.'+(skin||'standard');if(!EV[name])name=slot==='breaker'?'gun.breaker':'gun.'+slot+'.standard';
    if(play(name,null))ownSkip=performance.now();}
  // explosions stay synthesized. The big ones go round the duck and duck everything else for a moment.
  let explSkip=0,explAt=null;
  function explosion(pos,size){
    if(!ctx||!on)return;
    if(performance.now()-explSkip<120&&(!explAt||!pos||pos.distanceTo(explAt)<Math.max(30,size*.6)))return;   // a recorded impact just played here
    if(size<380)return;
    const big=size>=2400,mid=size>=900,P=place(pos,big?6000:mid?2600:1100);if(P.g<.02)return;
    if(big){if(!limit('xb',160))return;const h=P.g>.25?'hero':null;if(h)bigDuck(2.6);
      burst({f0:900,f1:60,dec:2.4,vol:.9*P.g,a:.01,pan:P.pan,rate:.6,dest:h});tone({wave:'sine',f0:60,f1:22,dec:2,vol:.6*P.g,pan:P.pan,dest:h});burst({type:'bandpass',f0:300,q:.6,dec:1.2,vol:.3*P.g,delay:.12,pan:P.pan,dest:h});}
    else if(mid){if(!limit('xm',90))return;burst({f0:2200,f1:120,dec:1.1,vol:.55*P.g,pan:P.pan,rate:.8});tone({wave:'sine',f0:85,f1:35,dec:.7,vol:.35*P.g,pan:P.pan});}
    else{if(!limit('xs',60))return;burst({f0:3200,f1:300,dec:.45,vol:.3*P.g,pan:P.pan});}
  }
  // side: 'hollow' for the Hollow's missiles (pitched-down ray gun); anything else is a Keeper rocket
  function missile(from,big,side){
    if(!ctx||!on)return;const name=side==='hollow'?'missile.hollow':big?'missile.keeper.big':'missile.keeper';
    if(!limit(big?'mb':'ms',big?90:120))return;
    ev(name,from,null,()=>{const P=place(from,big?1500:700);if(P.g<.04)return;
      burst({type:'bandpass',f0:600,f1:3200,q:1.5,a:.03,dec:.9,vol:.22*P.g,pan:P.pan});tone({wave:'sawtooth',f0:180,f1:520,dec:.5,vol:.04*P.g,lp:1500,pan:P.pan});});
  }

  // a flyby: its loudest moment lands at sec/2 from now; doppler bend and a pan sweep across the screen
  function flyby(sec,vol,pos,fb){const S=EV.flyby,b=S&&BUF[filesOf(S)[0]];
    if(!b){count('~flyby');if(fb)fb();return false;}
    const at=Math.max(.6,sec*.5),pk=peakOf(b),off=Math.max(0,pk-at),dir=Math.random()<.5?-1:1;let k=vol==null?1:clamp(vol/.18,.35,1.6),pan=null;
    if(pos){const P=place(pos,4000);k*=Math.max(.35,P.g);pan=P.pan;}
    return play('flyby',null,{offset:off,vol:k,bend:[1.06,1,Math.min(at,pk),.93],sweep:pan==null?[-.6*dir,.6*dir]:[clamp(pan-.3*dir,-1,1),clamp(pan+.3*dir,-1,1)],tail:at+3.5});}
  let reloadV=[];
  function stopReload(){if(!ctx)return;const t=ctx.currentTime;for(const V of reloadV){try{V.gn.gain.cancelScheduledValues(t);V.gn.gain.setValueAtTime(0,t);V.src.stop(t+.01);}catch(_){}}reloadV=[];}
  // a door, hatch or airlock: 'big' (gates, vaults, the tower), 'open' (ramps, bay doors), 'hatch' (canopies, small hatches)
  function door(pos,kind,sec){if(!ctx||!on)return;const n='door.'+(kind||'open');
    ev(n,pos,{force:1},()=>{const P=place(pos,500),g=Math.max(.3,P.g);burst({type:'bandpass',f0:900,f1:300,q:1.2,a:.05,dec:kind==='hatch'?.35:1.2,vol:.18*g,pan:P.pan});
      tone({wave:'sawtooth',f0:140,f1:90,a:.05,dec:kind==='hatch'?.3:1,vol:.05*g,lp:700,pan:P.pan});});
    // a long door opening keeps moving: the servo again near the end
    if(sec&&sec>2.5)ev(n,pos,{force:1,delay:sec-1.4,vol:.7,rate:1.08});}
  // a Herald heavy weapon winding up (a beat before it fires)
  function charge(pos){if(!ctx||!on||!limit('chg',250))return;ev('herald.charge',pos,null,()=>{const P=place(pos,1200);if(P.g<.04)return;
    tone({wave:'sawtooth',f0:180,f1:1400,a:.45,dec:.08,vol:.08*P.g,lp:2600,pan:P.pan});});}
  // a huge moment (the dome, the Hollow King): everything else drops away under it
  function moment(kind,pos){if(!ctx||!on)return;const sec=kind==='dome'?6:kind==='king'?3.5:3;bigDuck(sec);
    const P=pos?place(pos,6000):{g:1,pan:0},g=Math.max(.5,P.g);
    if(kind==='king'){for(const [f,d] of[[55,0],[82.5,.03],[110,.06]])tone({wave:'sawtooth',f0:f,f1:f*.93,a:.4,dec:3,vol:.08*g,lp:700,delay:d,pan:P.pan,dest:'hero'});}
    else{tone({wave:'sine',f0:36,f1:62,a:sec*.4,dec:sec*.6,vol:.4*g,dest:'hero'});tone({wave:'triangle',f0:110,f1:220,a:sec*.5,dec:sec*.5,vol:.05*g,lp:1200,dest:'hero'});
      burst({type:'bandpass',f0:400,f1:2400,q:.8,a:sec*.45,dec:sec*.55,vol:.3*g,rate:.4,dest:'hero'});}}
  // indoors (tunnels, halls, the tower): 0..1 of the room's reverb
  let indoorK=0;function indoor(k){k=clamp(k||0,0,1);if(Math.abs(k-indoorK)<.01)return;indoorK=k;if(revIn)revIn.gain.setTargetAtTime(k*.42,ctx.currentTime,.4);}
  function setVol(kind,v){v=clamp(+v,0,1);if(!(kind in VOL))return;VOL[kind]=v;try{localStorage.setItem('elyra.vol.'+kind,String(v));}catch(_){}
    const G=kind==='sfx'?sfxG:musG;if(G&&ctx)G.gain.setTargetAtTime(v,ctx.currentTime,.05);}
  addEventListener('storage',e=>{if(e.key==='elyra.vol.sfx'||e.key==='elyra.vol.music'){const v=parseFloat(e.newValue);if(v>=0&&v<=1)setVol(e.key.slice(10),v);}});

  /* ---------- loops: your engine, plus named drones a chapter can raise and lower (shield, Spear, zeal, beams) ---------- */
  let eng=null,engN=null;const drones={};
  function loopOsc(type,f,g0,lp){const o=ctx.createOscillator();o.type=type;o.frequency.value=f;const g=ctx.createGain();g.gain.value=g0;let tail=o;
    if(lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);tail=fl;}tail.connect(g);g.connect(bus);o.start();return{o,g};}
  function initLoops(){
    // jet: noise through two low-passes for the roar, a quiet sine turbine whine on top, and a sub hum underneath
    const s=ctx.createBufferSource();s.buffer=noise;s.loop=true;s.playbackRate.value=.5;
    const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=400;f.Q.value=.4;const f2=ctx.createBiquadFilter();f2.type='lowpass';f2.frequency.value=900;
    const g=ctx.createGain();g.gain.value=0;s.connect(f);f.connect(f2);f2.connect(g);g.connect(bus);s.start();engN={f,f2,g};
    eng=loopOsc('sine',620,0);eng.hum=loopOsc('sine',48,0);
  }
  // n: 0..1 throttle, boost: afterburner, live: you are flying (or driving). kind: 'interceptor' (default), 'walker' or 'skiff':
  // the interceptor keeps its synth jet with the recorded engine hum under it; a vehicle runs on its recorded loop once it's loaded
  function engine(n,boost,live,kind){
    if(!ctx||!eng)return;const t=ctx.currentTime;n=clamp(n,0,1);kind=kind||'interceptor';
    const L='loop.'+kind,ready=!!(EV[L]&&BUF[filesOf(EV[L])[0]]);
    loopAt(L,'you',null,live?(kind==='interceptor'?.4+n*.6:.45+n*.55)+(boost?.2:0):0,kind==='walker'?.85+n*.35:.8+n*.5);
    const jet=kind==='interceptor'||!ready?1:0;
    engN.f.frequency.setTargetAtTime(260+n*900+(boost?500:0),t,.25);engN.f2.frequency.setTargetAtTime(700+n*1600,t,.25);
    engN.g.gain.setTargetAtTime(live?(.05+n*.07+(boost?.05:0))*jet:0,t,.3);
    eng.o.frequency.setTargetAtTime(520+n*520,t,.4);eng.g.gain.setTargetAtTime(live?.006+n*.008:0,t,.3);
    eng.hum.o.frequency.setTargetAtTime(44+n*14,t,.4);eng.hum.g.gain.setTargetAtTime(live?.05:0,t,.3);
  }
  // a pair of slightly detuned oscillators; set its pitch and level every frame, level 0 to silence it
  function drone(key,freq,gain,type,lp){
    if(!ctx)return;let D=drones[key];
    if(!D){D=drones[key]={a:loopOsc(type||'sine',freq,0,lp),b:loopOsc(type||'sine',freq*1.006,0,lp)};}
    const t=ctx.currentTime;D.a.o.frequency.setTargetAtTime(freq,t,.3);D.b.o.frequency.setTargetAtTime(freq*1.006,t,.3);
    D.a.g.gain.setTargetAtTime(gain,t,.25);D.b.g.gain.setTargetAtTime(gain*.6,t,.25);
  }
  /* recorded engine loops: call sfx.loopAt(event, id, pos, level, rate) every frame for each thing that's running its engine
     (pos null = it's yours: centred). A request not renewed for 0.3 s fades out by itself, so nothing has to be stopped by hand.
     Per event only the loudest two play (a sky of dropships would be mush). Until the file is loaded, one synth hum stands in. */
  const LREQ=new Map(),LIVE=new Map();
  function loopAt(name,id,pos,level,rate){if(!ctx||!EV[name])return;const k=name+'#'+(id==null?0:id),r=LREQ.get(k)||{name,pos:null};
    r.pos=pos?(r.pos||new THREE.Vector3()).copy(pos):null;r.level=level==null?1:level;r.rate=rate||1;r.at=performance.now();LREQ.set(k,r);}
  function loopTick(){requestAnimationFrame(loopTick);if(!ctx||held)return;const now=performance.now(),t=ctx.currentTime,by={};
    for(const [k,r] of LREQ){if(now-r.at>300){LREQ.delete(k);continue;}const S=EV[r.name];let g=1,pan=0;if(r.pos){const P=place(r.pos,S.ref||900);g=P.g;pan=P.pan;}
      (by[r.name]||(by[r.name]=[])).push({k,r,lv:r.level*g,pan,g});}
    const want=new Set(),top={};
    for(const n in by){by[n].sort((a,b)=>b.lv-a.lv);top[n]=by[n][0].lv;let k=0;
      // the loudest two; one already playing keeps its voice while it's still third, so two close ones don't keep swapping (and restarting)
      for(const x of by[n]){if(x.lv<=.003)break;if(k<2||(k<3&&LIVE.has(x.k))){want.add(x.k);k++;}}}
    for(const [k,L] of LIVE)if(!want.has(k)){L.gn.gain.setTargetAtTime(0,t,.12);try{L.src.stop(t+.7);}catch(_){}LIVE.delete(k);}
    for(const n in by){const S=EV[n],b=BUF[filesOf(S)[0]];if(!b)continue;
      for(const x of by[n]){if(!want.has(x.k))continue;let L=LIVE.get(x.k);
        if(!L){const src=ctx.createBufferSource();src.buffer=b;src.loop=true;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=18000;
          const gn=ctx.createGain();gn.gain.value=0;const p=ctx.createStereoPanner?ctx.createStereoPanner():null;src.connect(lp);lp.connect(gn);
          if(p){gn.connect(p);p.connect(bus);}else gn.connect(bus);src.playbackRate.value=(S.rate||1)*x.r.rate;src.start(t,Math.random()*b.duration*.9);
          L={src,gn,lp,p};LIVE.set(x.k,L);count(n);}
        L.gn.gain.setTargetAtTime((S.vol==null?.3:S.vol)*x.lv*(on?1:0),t,.15);L.src.playbackRate.setTargetAtTime((S.rate||1)*x.r.rate,t,.25);
        if(L.p)L.p.pan.setTargetAtTime(x.pan,t,.1);L.lp.frequency.setTargetAtTime(x.g<.85?Math.min(18000,500+17000*Math.pow(x.g,1.25)):18000,t,.2);}}
    for(const n in EV){const S=EV[n];if(!S.loop)continue;const ready=!!BUF[filesOf(S)[0]],lv=ready?0:(top[n]||0);
      if(lv>0||drones['~'+n])drone('~'+n,46*(S.rate||1),Math.min(.07,lv*(S.vol==null?.3:S.vol)*.3),'sawtooth',320);}
  }
  requestAnimationFrame(loopTick);
  // the number of engine loops running now (the sound test reads it)
  const loopsLive=()=>LIVE.size;

  /* ---------- the score: quiet music under cutscenes (and a few places in play), so a scene without dialogue is never dead silent ----------
     Oct 22 (Bryce: "more rhythm, not so creepy"): each mood is a slow chord progression on a soft pad, a plucked arpeggio walking the
     chord in eighth notes, and in the tenser moods a low heartbeat on the beat. The old dissonant drone survives as 'cave'.
     score(mood) fades a mood in ('calm', 'awe', 'tense', 'sorrow', 'chill', 'cave'), score(null) fades it out. It sits past the
     compressor, under everything. */
  const MOODS={   // prog: chords as semitones over the root; arp: which chord tones the pluck walks; pulse: heartbeat level
    calm:{bpm:76,root:55,prog:[[0,4,7,11],[-3,0,4,7],[-7,-3,0,4],[-5,-1,2,7]],arp:[0,1,2,3,2,1,2,1],oct:2,pulse:0,pad:.032,pl:.03,lp:2000},
    awe:{bpm:66,root:49,prog:[[0,7,14,16],[-2,5,12,14],[-4,3,10,15],[-5,2,9,14]],arp:[0,2,3,1,2,3,1,2],oct:1,pulse:0,pad:.04,pl:.026,lp:2400},
    tense:{bpm:92,root:46.25,prog:[[0,3,7,10],[-4,0,3,8],[-2,2,5,10],[-5,-2,2,7]],arp:[0,2,1,3,0,2,1,3],oct:2,pulse:1,pad:.026,pl:.026,lp:1600,tick:.008},
    sorrow:{bpm:62,root:46.25,prog:[[0,3,7,10],[-4,0,3,7],[-7,-3,0,5],[-5,-1,2,7]],arp:[0,1,2,1,3,2,1,2],oct:2,pulse:0,pad:.034,pl:.022,lp:1400},
    chill:{bpm:70,root:41.2,prog:[[0,3,7,14],[1,4,8,13],[0,3,7,15],[-2,1,5,12]],arp:[3,-1,2,-1,1,-1,2,-1],oct:3,pulse:.6,pad:.03,pl:.02,lp:1300},
    cave:{bpm:0,root:41.2,prog:[[0,7,13,15],[0,6,12,15],[-1,6,11,14],[0,7,12,13]],arp:null,oct:0,pulse:0,pad:.045,pl:0,lp:650}};
  let SC=null;
  function playScore(mood){
    if(!ctx){onStart.push(()=>playScore(mood));return;}
    const t=ctx.currentTime;
    if(SC&&(!mood||SC.mood!==mood)){const old=SC;SC=null;old.g.gain.cancelScheduledValues(t);old.g.gain.setTargetAtTime(0,t,1);clearInterval(old.iv);setTimeout(()=>{for(const v of old.v){try{v.o.stop();v.o2.stop();}catch(_){}}try{old.lfo.stop();}catch(_){}},6000);}
    if(!mood||!MOODS[mood]||(SC&&SC.mood===mood))return;
    const M=MOODS[mood],g=ctx.createGain();g.gain.value=0;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=M.lp;lp.Q.value=.3;
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.06;lg.gain.value=M.lp*.25;lfo.connect(lg);lg.connect(lp.frequency);lfo.start();
    lp.connect(g);g.connect(musG);
    // the pad: four soft voices holding the chord
    const pg=ctx.createGain();pg.gain.value=M.pad/.045;pg.connect(lp);
    const v=[];for(let i=0;i<4;i++){const o=ctx.createOscillator(),o2=ctx.createOscillator(),vg=ctx.createGain();o.type=i===0?'sine':mood==='cave'?'triangle':'sine';o2.type='triangle';o2.detune.value=5+i*2;vg.gain.value=i===0?.5:.26;
      o.connect(vg);o2.connect(vg);vg.connect(pg);o.start();o2.start();v.push({o,o2,vg});}
    // the pluck: its own gentle low-pass, so it is round, not bright
    const pk=ctx.createBiquadFilter();pk.type='lowpass';pk.frequency.value=2600;pk.connect(g);
    let step=0,ch=M.prog[0];
    const setChord=k=>{ch=M.prog[k%M.prog.length];const now=ctx.currentTime;v.forEach((x,i)=>{const f=M.root*Math.pow(2,ch[i]/12)*(i===0?1:2);x.o.frequency.setTargetAtTime(f,now,.6);x.o2.frequency.setTargetAtTime(f*(i===0?2:1),now,.7);});};
    setChord(0);
    const S={mood,g,v,lfo,iv:0};SC=S;
    if(M.bpm){const eighth=60/M.bpm/2;
      S.iv=setInterval(()=>{if(SC!==S||!on)return;const at=ctx.currentTime+.04,beat=step%8;
        if(step%16===0)setChord(step/16);
        const n=M.arp[beat];if(n>=0){const f=M.root*Math.pow(2,ch[n%4]/12+M.oct);const o=ctx.createOscillator(),e=ctx.createGain();o.type='triangle';o.frequency.value=f;e.gain.setValueAtTime(0,at);e.gain.linearRampToValueAtTime(M.pl*(beat%4===0?1.3:1),at+.012);e.gain.exponentialRampToValueAtTime(.0001,at+eighth*3);o.connect(e);e.connect(pk);o.start(at);o.stop(at+eighth*3+.05);}
        if(M.pulse&&(beat===0||beat===4)){const o=ctx.createOscillator(),e=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(64,at);o.frequency.exponentialRampToValueAtTime(38,at+.3);e.gain.setValueAtTime(0,at);e.gain.linearRampToValueAtTime(.09*M.pulse,at+.01);e.gain.exponentialRampToValueAtTime(.0001,at+.35);o.connect(e);e.connect(g);o.start(at);o.stop(at+.4);}
        if(M.tick&&beat%2===1&&noise){const s2=ctx.createBufferSource();s2.buffer=noise;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=7000;const e=ctx.createGain();e.gain.setValueAtTime(M.tick,at);e.gain.exponentialRampToValueAtTime(.0001,at+.05);s2.connect(hp);hp.connect(e);e.connect(g);s2.start(at,Math.random());s2.stop(at+.06);}
        step++;},eighth*1000);}
    else S.iv=setInterval(()=>{if(SC!==S)return;step++;setChord(step);},8000);
    g.gain.setTargetAtTime(1,t,1.8);
  }

  /* ---------- the radio speaks ---------- */
  // Characters keep their voices close to natural pitch; heavy pitch-shifting is what makes browser speech sound robotic.
  // alert: how the line is said when it is shouted in a fight (lower and harder, a little faster). prefer: names to reach for first.
  const VOICE={'Elias Veyr':{sex:'m',accent:/GB|AU|IE/,pitch:.92,rate:.94,alert:{pitch:.88,rate:1.02}},'Tide City Command':{sex:'f',accent:/US|GB/,pitch:1.02,rate:1.06},
    'Lt. Michael':{sex:'m',accent:/US|CA|GB/,pitch:.84,rate:.98,prefer:/guy|christopher|davis|andrew|brian|aaron|roger|tom\b|eric|reed|evan|nathan|daniel/i,alert:{pitch:.76,rate:1.13}},
    'The Hollow King':{sex:'m',accent:/GB|US/,pitch:.7,rate:.84},
    'Keeper Sergeant':{sex:'m',accent:/US|AU|GB/,pitch:.96,rate:1.1,alert:{pitch:.9,rate:1.16}},'Fleet Engineer':{sex:'f',accent:/AU|GB|IE|US/,pitch:1.08,rate:1.12},'Covenant Command':{sex:'f',accent:/GB|US/,pitch:1,rate:1.05},
    'Captain Rhen · recording':{sex:'m',accent:/GB|AU|US/,pitch:.98,rate:1.08},
    // the voice in the tunnels sounds like Rhen, slowed and dropped
    'Captain Rhen?':{same:'Captain Rhen · recording',pitch:.6,rate:.76},
    // the Pathfinder's crew (side mission S1): Rhen is the same voice as his recording, alive
    'Captain Rhen':{same:'Captain Rhen · recording',pitch:.98,rate:1.02,alert:{pitch:.92,rate:1.12}},
    'Sergeant Marsh':{sex:'m',accent:/US|AU|CA/,pitch:.86,rate:1.04,alert:{pitch:.8,rate:1.14}},'Okafor':{sex:'m',accent:/GB|NG|ZA|US/,pitch:1.02,rate:1.08,alert:{pitch:.96,rate:1.15}},
    // Oct 28: Thorne is male (placeholder voice until the recorded dialogue); the stolen-radio label is the same man
    'Thorne':{sex:'m',accent:/US|CA|GB/,pitch:.94,rate:1.08,alert:{pitch:.9,rate:1.15}},'Thorne (stolen radio)':{same:'Thorne',pitch:.94,rate:1.08,alert:{pitch:.9,rate:1.15}},'Ensign Landry':{sex:'f',accent:/GB|IE|AU|US/,pitch:1.05,rate:1.1,alert:{pitch:1,rate:1.2}},
    // the Host's speakers, in a language nobody knows
    'Host speaker':{sex:'m',accent:/GB|US/,pitch:.45,rate:.7},'Host officer':{sex:'m',accent:/GB|US/,pitch:.45,rate:.7}};
  const FEM=/female|samantha|victoria|karen|moira|tessa|fiona|serena|zira|aria|jenny|libby|sonia|emma|ava|allison|susan|kate|hazel|catherine|michelle|natasha|clara|joanna|salli|kimberly|ivy/i;
  const MALE=/male|daniel|alex|fred|oliver|arthur|guy|ryan|davis|thomas|rishi|david|mark|george|james|brian|eric|christopher|roger|andrew|william|liam|tom|aaron|gordon|lee|reed|evan|nathan/i;
  // natural / neural / online voices first, then the good built-ins; robotic engines last
  // (iOS lists its Siri voices, but a web page cannot speak through them: they say nothing at all)
  // novelty voices are dropped outright, not just ranked low: iOS's Good News and Bad News sing every line to a tune
  const NOVELTY=/espeak|novelty|whisper|bells|good news|bad news|bahh|boing|bubbles|cellos|jester|organ|trinoids|zarvox|albert|fred|junior|ralph|superstar|wobble|deranged|hysterical|pipe/i;
  const score=v=>(/natural|neural|online|premium|enhanced/i.test(v.name)?100:0)-(/siri/i.test(v.name)?400:0)+(/google/i.test(v.name)?60:0)+(/samantha|daniel|karen|moira|alex|serena|arthur|oliver/i.test(v.name)?40:0)
    -(/espeak|compact|novelty|whisper|bells|good news|bad news|bahh|boing|bubbles|cellos|jester|organ|trinoids|zarvox|albert|fred|junior|ralph|superstar|wobble|deranged|hysterical|pipe/i.test(v.name)?200:0)+(v.localService?0:10);
  let vlist=[],cast={};
  function loadVoices(){try{vlist=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)&&!NOVELTY.test(v.name)).sort((a,b)=>score(b)-score(a));}catch(_){vlist=[];}cast={};}
  function voiceFor(who){
    if(VOICE[who]&&VOICE[who].same)return voiceFor(VOICE[who].same);
    if(cast[who]!==undefined)return cast[who];const V=VOICE[who]||{};const used=new Set(Object.values(cast));
    const sexOf=v=>FEM.test(v.name)&&!/\bmale\b/i.test(v.name)?'f':MALE.test(v.name)?'m':'?';
    const fit=v=>(sexOf(v)===V.sex?50:sexOf(v)==='?'?10:-80)+(V.accent&&V.accent.test(v.lang)?15:0)+(used.has(v)?-35:0)+(V.prefer&&V.prefer.test(v.name)?40:0)+score(v);
    let best=null,bs=-1e9;for(const v of vlist){const s=fit(v);if(s>bs){bs=s;best=v;}}
    if(!vlist.length)return null;   // voices not loaded yet: don't remember 'no voice' for this character
    return cast[who]=best||null;
  }
  if(window.speechSynthesis){loadVoices();speechSynthesis.onvoiceschanged=loadVoices;}
  // one line speaks at a time; a line that arrives while another is speaking waits its turn (at most two wait, the oldest is dropped).
  // speak() returns a handle {voiced, done, est}: voiced when the device will actually say it, done once it has.
  // onPlay(handle) runs when the line starts, so the subtitle and radio click line up with the voice.
  const estimate=(who,text)=>{const V=VOICE[who]||{rate:1};return text.split(/\s+/).length/(2.55*V.rate)+.45;};
  let cur=null,stalls=0;const queue=[],live=new Set();
  let lastCancel=0;
  function speak(who,text,onPlay,tone,cut){
    const H={voiced:false,done:false,est:estimate(who,text)};
    if(!on||!speech||!window.speechSynthesis||!ctx){if(onPlay)onPlay(H);return H;}
    H.voiced=true;const item={who,text,H,onPlay,tone,at:performance.now(),cut:!!cut};
    // a cutscene line goes ahead of radio chatter that is still waiting
    if(cur){if(cut){for(let i=queue.length-1;i>=0;i--)if(!queue[i].cut){queue[i].H.done=true;queue.splice(i,1);}}
      queue.push(item);while(queue.length>2){const d=queue.shift();d.H.done=true;}return H;}
    playLine(item);return H;
  }
  // a line that has waited more than 5 s is about something that's already over, so it's skipped
  // (cutscene lines never expire: a cutscene waits on them)
  function next(){let n;while((n=queue.shift())){if(n.cut||n.who==='The Hollow King'||performance.now()-n.at<5000){playLine(n);return;}n.H.done=true;}}
  function playLine(item){
    cur=item;const {who,text,H}=item;
    const once=()=>{if(item.played)return;item.played=true;if(item.onPlay)item.onPlay(H);};   // the subtitle shows when the voice starts
    const fin=()=>{if(item.u)live.delete(item.u);if(cur!==item)return;H.done=true;cur=null;clearTimeout(item.to);clearTimeout(item.chk);next();};
    const go=()=>{try{
      const u=new SpeechSynthesisUtterance(text.replace(/’/g,"'").replace(/—/g,', ')),V0=VOICE[who]||{pitch:1,rate:1},V=item.tone==='alert'&&V0.alert?Object.assign({},V0,V0.alert):V0;
      u.pitch=V.pitch;u.rate=V.rate;u.volume=1;const v=voiceFor(who);if(v){u.voice=v;u.lang=v.lang;}
      item.u=u;live.add(u);   // Chrome drops the events of an utterance it has garbage-collected, and its speech then goes silent for good
      u.onstart=()=>{H.started=true;speechOK=true;stalls=0;once();};
      u.onend=fin;u.onerror=fin;item.to=setTimeout(fin,(H.est*2.2+3)*1000);   // some browsers never fire onend
      // a voice that has not started after a moment is not going to (iOS before a tap, no voices installed): fall back to reading time,
      // so cutscenes keep their pace instead of waiting on silence
      item.chk=setTimeout(()=>{if(!H.started&&cur===item){H.voiced=false;once();stalls++;
        // the engine is wedged (Chrome after a long fight): cancel clears it so the next line can speak
        if(speechOK&&stalls<4){try{speechSynthesis.cancel();lastCancel=performance.now();}catch(_){}}clearTimeout(item.to);item.to=setTimeout(fin,Math.max(0,H.est*1000-1600));}},1600);
      try{if(speechSynthesis.paused)speechSynthesis.resume();}catch(_){}   // Chrome stays silent forever after a pause() it never resumed
      speechSynthesis.speak(u);
    }catch(_){H.voiced=false;once();fin();}};
    // iOS drops an utterance spoken right after a cancel
    const wait=performance.now()-lastCancel;if(wait<160)setTimeout(go,170-wait);else go();
  }
  // stop every voice now (a cutscene starting or being skipped)
  function hush(){stopCut();for(const q of queue)q.H.done=true;queue.length=0;if(cur){cur.H.done=true;clearTimeout(cur.to);clearTimeout(cur.chk);cur=null;}try{if(window.speechSynthesis){speechSynthesis.cancel();lastCancel=performance.now();}}catch(_){}}

  /* ---------- events ---------- */
  const api={
    shot,explosion,missile,engine,drone,speak,hush,estimate,place,score:playScore,
    // recorded samples (js/shared/sfx-map.js): ev(name,pos,opts,synthFallback), loopAt(name,id,pos,level,rate) every frame
    ev,play,loopAt,door,charge,moment,indoor,playerGun,
    // the next fire() call is this event (a call site that knows better than its bolt kind: the Herald mech's guns, your own nose guns)
    next(name){nextEv=name;nextT=performance.now();},
    // the Breaker leaving its tube (every skin): the recorded launcher, the synth rocket until it loads
    // (an enemy-make launcher from the Armory fires its makers' sound: gun.breaker.<skin>)
    breaker(from){if(!ctx||!on)return;const sk=typeof PG!=='undefined'&&PG.arms?PG.arms.equipped('breaker'):'standard',n=EV['gun.breaker.'+sk]?'gun.breaker.'+sk:'gun.breaker';
      if(play(n,null))return;count('~'+n);missile(from,false,/^hollow/.test(sk)?'hollow':null);},
    // a missile or rocket landing: the recorded explosion (the synth boom at that spot is skipped so the two don't double)
    impact(pos){if(!ctx||!on||!limit('imp',70))return;if(play('missile.hit',pos)){explSkip=performance.now();explAt=pos&&pos.clone?pos.clone():null;return;}
      count('~missile.hit');explosion(pos,1200);},
    get vol(){return Object.assign({},VOL);},setVol,
    events:Object.keys(EV),stats,load,stopCut,loopsLive,start,
    ready(name){const S=EV[name];return !!(S&&BUF[filesOf(S)[0]]);},
    get files(){return{loaded:Object.keys(BUF).length,total:[...new Set(Object.keys(EV).flatMap(k=>filesOf(EV[k])))].length};},
    // turn the world's sounds down (cutscenes), not the music or the radio click: duck(1) restores
    duck(v){if(ctx&&bus)bus.gain.setTargetAtTime(v,ctx.currentTime,.35);},
    // something big passing the camera (a cutscene, a fly-in): the recorded flyby, its loudest moment landing where the old whoosh
    // peaked, with a doppler bend (higher coming in, lower going away) and a pan sweep. The synth whoosh stands in until it loads.
    whoosh(sec,vol){if(!ctx||!on)return;const d=sec||2.5;flyby(d,vol,null,()=>burst({type:'bandpass',f0:300,f1:1400,q:.8,a:d*.45,dec:d*.55,vol:(vol||.18),rate:.5}));},
    flyby(sec,vol,pos){if(!ctx||!on)return;const d=sec||2.5;flyby(d,vol,pos,()=>burst({type:'bandpass',f0:300,f1:1400,q:.8,a:d*.45,dec:d*.55,vol:(vol||.18),rate:.5}));},
    // a low swell under a reveal
    swell(sec){if(!ctx||!on)return;const d=sec||5;tone({wave:'sine',f0:55,f1:58,a:d*.5,dec:d*.5,vol:.12});tone({wave:'triangle',f0:110,f1:116,a:d*.55,dec:d*.45,vol:.035,lp:600});},
    // pause: freeze every sound and the voice mid-line, and pick both up again on resume
    hold(p){held=!!p;try{if(ctx)(p?ctx.suspend():ctx.resume()).catch(()=>{});}catch(_){}try{if(window.speechSynthesis)p?speechSynthesis.pause():speechSynthesis.resume();}catch(_){}},
    onStart(f){onStart.push(f);if(ctx)f();},
    crash(pos){const P=place(pos,7000);if(!ctx||!on)return;   // a capital ship breaking up: groaning metal and a long rumble
      tone({wave:'sawtooth',f0:70,f1:28,dec:3.5,vol:.35*P.g,lp:400,a:.3,pan:P.pan});tone({wave:'sawtooth',f0:140,f1:45,dec:2.8,vol:.12*P.g,lp:700,a:.2,detune:15,pan:P.pan});
      burst({f0:400,f1:50,dec:4,vol:.6*P.g,a:.4,rate:.4,pan:P.pan});},
    jump(pos){if(!ctx||!on)return;const P=place(pos,9000),k=Math.max(.35,P.g);   // a jump: a slow rising draw, then the release (slower than it was, Oct 22)
      tone({wave:'sawtooth',f0:90,f1:900,a:1.2,dec:.4,vol:.05*k,lp:1800,pan:P.pan});
      tone({wave:'sawtooth',f0:1400,f1:60,dec:2.4,vol:.14*k,lp:2200,delay:1.5,pan:P.pan});burst({type:'bandpass',f0:3000,f1:180,q:.9,dec:2.6,vol:.32*k,delay:1.5,pan:P.pan,rate:.6});
      tone({wave:'sine',f0:48,f1:26,dec:3,vol:.4*k,delay:1.6});},
    // a ship lifting off: a slow swelling rumble and a rising engine note, no crack (Oct 22: slower, heavier)
    liftoff(pos,sec){if(!ctx||!on)return;const P=place(pos,1200),k=Math.max(.4,P.g),d=sec||6;
      // the recorded rocket engine swelling up over the lift, the synth sub-rumble kept under it
      if(play('launch',null,{vol:k,pan:P.pan,env:[d*.35,d*.65,1.8]})){tone({wave:'sine',f0:36,f1:52,a:d*.35,dec:d*.7,vol:.2*k});return;}
      count('~launch');
      burst({f0:120,f1:420,a:d*.45,dec:d*.6,vol:.45*k,rate:.35,pan:P.pan});tone({wave:'sine',f0:36,f1:52,a:d*.35,dec:d*.7,vol:.35*k});
      tone({wave:'sawtooth',f0:65,f1:150,a:d*.5,dec:d*.5,vol:.05*k,lp:500,pan:P.pan});tone({wave:'triangle',f0:220,f1:440,a:d*.6,dec:d*.4,vol:.025*k,lp:1200,pan:P.pan});},
    horn(pos){if(!ctx||!on||!limit('horn',2500))return;const P=place(pos,4000);const g=Math.max(.3,P.g);   // the Empty Host's war horn
      for(const [f,d] of[[73,0],[110,.02],[146,.04]])tone({wave:'sawtooth',f0:f,f1:f*.94,a:.25,dec:2.2,vol:.09*g,lp:800,delay:d,pan:P.pan});},
    trooperDown(pos){if(!ctx||!on||!limit('td',70))return;const P=place(pos,450);if(P.g<.05)return;   // a short cry
      const f=160+Math.random()*90;tone({wave:'sawtooth',f0:f*1.4,f1:f*.7,a:.01,dec:.22,vol:.12*P.g,bp:650+Math.random()*400,q:3,pan:P.pan});},
    spearFire(){if(!ctx||!on)return;bigDuck(4);tone({wave:'sawtooth',f0:80,f1:2400,dec:.9,vol:.25,lp:5000,dest:'hero'});burst({f0:6000,f1:80,dec:3.5,vol:1,a:.01,rate:.5,dest:'hero'});
      tone({wave:'sine',f0:48,f1:20,dec:3.5,vol:.8,delay:.05,dest:'hero'});},
    beam(pos){if(!ctx||!on)return;const P=place(pos,9000),g=Math.max(.35,P.g);
      tone({wave:'sawtooth',f0:1600,f1:180,dec:.8,vol:.22*g,lp:4000,pan:P.pan});burst({type:'bandpass',f0:2500,f1:400,q:.8,dec:.9,vol:.4*g,pan:P.pan});},
    collapse(pos){if(!ctx||!on||!limit('col',350))return;const P=place(pos,5000),g=Math.max(.15,P.g);   // a tower coming down
      burst({f0:700,f1:60,dec:4.5,vol:.7*g,a:.15,rate:.45,pan:P.pan});tone({wave:'sine',f0:55,f1:24,dec:4,vol:.4*g,a:.2,pan:P.pan});
      burst({type:'bandpass',f0:1800,f1:500,q:2,dec:.9,vol:.15*g,delay:.3,pan:P.pan});burst({type:'bandpass',f0:2600,f1:700,q:3,dec:.7,vol:.1*g,delay:1.1,pan:P.pan});},
    cityDeath(){if(!ctx||!on)return;bigDuck(7);burst({f0:3000,f1:40,dec:7,vol:1.2,a:.02,rate:.35,dest:'hero'});tone({wave:'sine',f0:40,f1:16,dec:7,vol:1,dest:'hero'});tone({wave:'sawtooth',f0:90,f1:30,dec:5,vol:.2,lp:300,dest:'hero'});},
    // the radio key-up: a short soft hiss and a small high tick (no low end, so it never reads as a thud)
    radio(){if(!ctx||!on||!limit('radio',400))return;burst({type:'highpass',f0:2400,dec:.09,vol:.035,a:.01,dest:'ui'});tone({wave:'sine',f0:1900,f1:1900,dec:.05,vol:.012,delay:.1,dest:'ui'});},
    hit(shieldOnly){if(!ctx||!on||!limit('hit',90))return;   // something hit you: a shield crackle, or a hull clang
      if(shieldOnly){burst({type:'bandpass',f0:3000,f1:1200,q:2,dec:.18,vol:.18});tone({wave:'sine',f0:900,f1:400,dec:.15,vol:.05});}
      else{tone({wave:'square',f0:180,f1:70,dec:.25,vol:.12,lp:900});burst({f0:2500,f1:300,dec:.3,vol:.3});}},
    alarm(){if(!ctx||!on||!limit('alarm',1500))return;for(let k=0;k<3;k++)tone({wave:'square',f0:880,f1:880,dec:.14,vol:.035,lp:2000,delay:k*.22});},
    shipDown(){if(!ctx||!on)return;burst({f0:2600,f1:80,dec:1.6,vol:.8,a:.005,rate:.8});tone({wave:'sine',f0:70,f1:25,dec:1.4,vol:.5});this.alarm();},
    zeal(){if(!ctx||!on)return;tone({wave:'sawtooth',f0:110,f1:880,dec:1.2,vol:.1,lp:3000,a:.2});tone({wave:'sine',f0:440,f1:1320,dec:1.4,vol:.08,a:.3});burst({type:'bandpass',f0:800,f1:5000,q:1,dec:1.2,vol:.2,a:.3});},
    wake(){if(!ctx||!on)return;burst({f0:200,f1:1400,dec:5,vol:.5,a:2,rate:.3});tone({wave:'sine',f0:30,f1:60,dec:6,vol:.6,a:2});tone({wave:'sawtooth',f0:55,f1:110,dec:5,vol:.06,lp:400,a:2.5});},
    // ground gear (The Mountain)
    empty(){if(!ctx||!on||!limit('emp',250))return;ev('empty',null,null,()=>tone({wave:'square',f0:1800,f1:1700,dec:.03,vol:.04,lp:4000}));},
    // dur: the reload's length, so the rack lands just before you can fire again
    reload(dur){if(!ctx||!on)return;const d=Math.max(1,dur||3);stopReload();
      const a=play('reload.out',null),b=play('reload.in',null,{delay:d*.5}),c=play('reload.rack',null,{delay:Math.max(.7,d-.35)});
      if(a&&b&&c){reloadV=[a,b,c].filter(v=>v&&v.src);return;}count('~reload');
      tone({wave:'square',f0:900,f1:600,dec:.05,vol:.05,lp:3000});burst({type:'bandpass',f0:2400,q:3,dec:.08,vol:.08,delay:.35});tone({wave:'square',f0:520,f1:1200,dec:.08,vol:.05,lp:3000,delay:.9});},
    swap(){if(!ctx||!on)return;stopReload();if(play('swap',null)){play('swap.click',null,{delay:.14});return;}count('~swap');
      burst({type:'bandpass',f0:1500,q:2,dec:.1,vol:.07});tone({wave:'sine',f0:300,f1:500,dec:.08,vol:.04,delay:.12});},
    // a grenade thrown: the pin's click (recorded) and a swish of the arm (synth)
    toss(){if(!ctx||!on||!limit('toss',300))return;play('nade.pin',null);burst({type:'bandpass',f0:700,f1:2200,q:1,a:.06,dec:.22,vol:.07,delay:.05});},
    // the magazine has dropped under a quarter: two small ticks, once per magazine (the caller decides when)
    lowAmmo(){if(!ctx||!on||!limit('low',600))return;if(play('lowammo',null)){play('lowammo',null,{delay:.09});return;}
      tone({wave:'square',f0:2400,f1:2400,dec:.025,vol:.025,lp:5000});tone({wave:'square',f0:2400,f1:2400,dec:.025,vol:.025,lp:5000,delay:.09});},
    // your shot landed: the Empty Host (soft zap) or something armoured (a Herald, a mech, a turret, a dropship: a hard tick)
    hitConfirm(armored){if(!ctx||!on||!limit('hc',55))return;ev(armored?'hit.herald':'hit.hollow',null,null,()=>armored?
      tone({wave:'square',f0:2600,f1:1900,dec:.03,vol:.03,lp:6000}):tone({wave:'sine',f0:1800,f1:1200,dec:.04,vol:.035}));},
    shieldUp(){if(!ctx||!on)return;tone({wave:'sawtooth',f0:180,f1:900,dec:.6,vol:.07,lp:2400,a:.05});tone({wave:'sine',f0:880,f1:1320,dec:.5,vol:.05,a:.1});},
    sentry(){if(!ctx||!on)return;tone({wave:'sawtooth',f0:300,f1:1400,dec:.45,vol:.05,lp:2000});tone({wave:'sine',f0:1600,f1:2200,dec:.2,vol:.04,delay:.4});},
    // (Oct 26, Bryce) a vehicle mending itself: a soft ratchet of small ticks and a faint rising hum, quiet but there; the caller paces it
    repair(){if(!ctx||!on||!limit('repair',700))return;for(let k=0;k<3;k++)tone({wave:'square',f0:1500,f1:1150,dec:.03,vol:.018,lp:4200,delay:k*.09});
      tone({wave:'sine',f0:420,f1:560,a:.05,dec:.35,vol:.022});},
    pickup(){if(!ctx||!on)return;tone({wave:'sine',f0:880,f1:880,dec:.12,vol:.06});tone({wave:'sine',f0:1320,f1:1320,dec:.18,vol:.05,delay:.09});},
    // a signal breaking up: a thin, crackling hiss (high, so it never thumps)
    static(sec){if(!ctx||!on)return;const d=sec||1;burst({type:'highpass',f0:3200,dec:d,vol:.12,a:.08});for(let k=0;k<5;k++)burst({type:'bandpass',f0:R0(2500,5000),q:3,dec:.05,vol:.05,delay:R0(0,d*.8)});},
    // a huge door grinding open: a slow groaning creak (stuttering pitch), stone scraping, a deep rumble under it
    creak(pos,sec){if(!ctx||!on)return;const P=place(pos,260),g=Math.max(.35,P.g),d=sec||3.5;
      for(let k=0;k<5;k++){const f=R0(70,120);tone({wave:'sawtooth',f0:f,f1:f*R0(.7,1.3),a:.08,dec:R0(.5,.9),vol:.07*g,bp:R0(500,900),q:6,delay:k*d/5+R0(0,.2),pan:P.pan});}
      burst({type:'bandpass',f0:300,f1:140,q:1.4,a:.4,dec:d,vol:.35*g,rate:.35,pan:P.pan});tone({wave:'sine',f0:38,f1:30,a:.5,dec:d+1,vol:.35*g});},
    // the voice in the tunnels: breath and a low hiss under it
    whisper(){if(!ctx||!on)return;for(let k=0;k<4;k++)burst({type:'bandpass',f0:R0(900,1600),f1:R0(400,700),q:4,a:.25,dec:R0(.6,1.1),vol:.12,delay:k*.45,rate:.6});tone({wave:'sine',f0:55,f1:42,a:.6,dec:3,vol:.18});},
    toggle(v){on=v==null?!on:v;try{localStorage.setItem('tideAudio',on?'on':'off');}catch(_){}
      if(master)master.gain.setTargetAtTime(on?.8:0,ctx.currentTime,.05);if(!on)hush();for(const b of btns)b.textContent='Sound: '+(on?'on':'off');return on;},
    get on(){return on;},
    // a Sound button inside a chapter's own button group
    mountButton(parent,before,cls){const b=document.createElement(parent.tagName==='DIV'?'button':'button');b.type='button';if(cls)b.className=cls;b.textContent='Sound: '+(on?'on':'off');
      b.addEventListener('click',()=>{start();api.toggle();b.blur();});parent.insertBefore(b,before||null);btns.push(b);return b;},
  };
  const btns=[];

  /* ---------- hooks into the shared effects ---------- */
  const _fire=fire;fire=function(from,to,speed,kind,onHit){shot(kind,from);return _fire(from,to,speed,kind,onHit);};
  const _boom=boom;boom=function(pos,size,hex,life){explosion(pos,size);return _boom(pos,size,hex,life);};
  // (every fireMissile in the game is a Keeper's: yours, your walker's)
  const _fm=fireMissile;fireMissile=function(from,dir,speed,target,cb){missile(from,true);return _fm(from,dir,speed,target,p=>{if(p)api.impact(p);if(cb)return cb(p);});};
  addEventListener('keydown',e=>{if(e.code==='KeyM'&&!e.repeat){start();api.toggle();}});
  return api;
})();
