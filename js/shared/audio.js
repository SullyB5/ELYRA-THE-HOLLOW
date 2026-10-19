/* Elyra shared audio: every sound is synthesized with WebAudio (no files to download), placed by distance from the camera,
   and the radio speaks through the most natural voices the device has. Hooks the shared fire/boom/missile calls,
   so it loads after fx.js and combat.js; each chapter adds a small glue file for its own events and loops.
   M (or a Sound button a chapter mounts) mutes; the choice is remembered across chapters. */
const sfx=(()=>{
  let ctx=null,master=null,bus=null,noise=null,on=true,voices=0,speech=true;
  try{on=localStorage.getItem('tideAudio')!=='off';}catch(_){}
  const last={};
  const limit=(k,gap)=>{const t=performance.now();if(t-(last[k]||0)<gap)return false;last[k]=t;return true;};
  function start(){
    if(ctx){if(ctx.state!=='running')ctx.resume().catch(()=>{});return;}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    try{ctx=new AC();}catch(_){return;}
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.25;
    master=ctx.createGain();master.gain.value=on?.8:0;bus=ctx.createGain();bus.gain.value=1;
    bus.connect(comp);comp.connect(master);master.connect(ctx.destination);
    const len=ctx.sampleRate*2;noise=ctx.createBuffer(1,len,ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    // iOS only lets speech play after one utterance started inside a tap
    try{if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);}}catch(_){}
    initLoops();
    for(const f of onStart)f();
  }
  for(const ev of['pointerdown','touchend','keydown'])addEventListener(ev,start,{capture:true,passive:true});

  /* ---------- building blocks ---------- */
  // where a sound sits: quieter with distance, panned left/right of the camera
  const _ap=new THREE.Vector3(),_ar=new THREE.Vector3();
  function place(pos,ref){
    if(!pos)return{g:1,pan:0};
    const d=camera.position.distanceTo(pos),g=1/(1+Math.pow(d/ref,1.6));
    _ap.subVectors(pos,camera.position).normalize();_ar.set(Math.cos(camera.rotation.y),0,-Math.sin(camera.rotation.y));
    return{g,pan:clamp(_ap.dot(_ar),-1,1)*.8,d};
  }
  function out(gain,pan){
    const g=ctx.createGain();g.gain.value=0;
    if(pan&&ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(bus);}else g.connect(bus);
    return g;
  }
  function env(g,t,a,peak,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);}
  function track(node,dur){voices++;node.onended=()=>{voices--;};}
  // filtered noise burst: explosions, booms, whooshes, rumbles
  function burst(o){
    if(!ctx||!on||voices>40)return;
    const t=ctx.currentTime+(o.delay||0),s=ctx.createBufferSource();s.buffer=noise;s.loop=true;s.playbackRate.value=o.rate||1;
    const f=ctx.createBiquadFilter();f.type=o.type||'lowpass';f.frequency.setValueAtTime(o.f0,t);if(o.f1)f.frequency.exponentialRampToValueAtTime(o.f1,t+o.dec);f.Q.value=o.q||.7;
    const g=out(0,o.pan);env(g,t,o.a||.005,o.vol,o.dec);
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
    const g=out(0,o.pan);env(g,t,o.a||.004,o.vol,o.dec);tail.connect(g);s.start(t);s.stop(t+(o.a||.004)+o.dec+.05);track(s);
  }

  const onStart=[];

  /* ---------- weapons ---------- */
  function shot(kind,from){
    if(!ctx||!on)return;
    if(kind==='hollow')kind='enemy';else if(kind==='hbolt')kind='fbolt';   // the Hollow King's guns sound like the aliens'
    const P=place(from,kind==='friend'?2400:kind==='enemy'||kind==='torp'?3400:kind==='flak'?900:kind==='fbolt'?700:kind==='player'||kind==='zeal'?500:380);
    if(kind==='player'||kind==='zeal'){
      // your own guns fire right beside the camera: full volume, crisp; anyone else's player-colour bolts are distant zips
      if(P.d<260){if(!limit('pl',80))return;const z=kind==='zeal';
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
  function explosion(pos,size){
    if(!ctx||!on||size<380)return;
    const big=size>=2400,mid=size>=900,P=place(pos,big?6000:mid?2600:1100);if(P.g<.02)return;
    if(big){if(!limit('xb',160))return;
      burst({f0:900,f1:60,dec:2.4,vol:.9*P.g,a:.01,pan:P.pan,rate:.6});tone({wave:'sine',f0:60,f1:22,dec:2,vol:.6*P.g,pan:P.pan});burst({type:'bandpass',f0:300,q:.6,dec:1.2,vol:.3*P.g,delay:.12,pan:P.pan});}
    else if(mid){if(!limit('xm',90))return;burst({f0:2200,f1:120,dec:1.1,vol:.55*P.g,pan:P.pan,rate:.8});tone({wave:'sine',f0:85,f1:35,dec:.7,vol:.35*P.g,pan:P.pan});}
    else{if(!limit('xs',60))return;burst({f0:3200,f1:300,dec:.45,vol:.3*P.g,pan:P.pan});}
  }
  function missile(from,big){
    if(!ctx||!on)return;const P=place(from,big?1500:700);if(P.g<.04||!limit(big?'mb':'ms',big?90:120))return;
    burst({type:'bandpass',f0:600,f1:3200,q:1.5,a:.03,dec:.9,vol:.22*P.g,pan:P.pan});tone({wave:'sawtooth',f0:180,f1:520,dec:.5,vol:.04*P.g,lp:1500,pan:P.pan});
  }

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
  // n: 0..1 throttle, boost: afterburner, live: you are flying
  function engine(n,boost,live){
    if(!ctx||!eng)return;const t=ctx.currentTime;n=clamp(n,0,1);
    engN.f.frequency.setTargetAtTime(260+n*900+(boost?500:0),t,.25);engN.f2.frequency.setTargetAtTime(700+n*1600,t,.25);
    engN.g.gain.setTargetAtTime(live?.05+n*.07+(boost?.05:0):0,t,.3);
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

  /* ---------- the radio speaks ---------- */
  // Characters keep their voices close to natural pitch; heavy pitch-shifting is what makes browser speech sound robotic.
  const VOICE={'Elias Veyr':{sex:'m',accent:/GB|AU|IE/,pitch:.92,rate:.94},'Tide City Command':{sex:'f',accent:/US|GB/,pitch:1.02,rate:1.06},
    'Lt. Michael':{sex:'m',accent:/US|CA/,pitch:1.04,rate:1.03},'The Hollow King':{sex:'m',accent:/GB|US/,pitch:.7,rate:.84},
    'Keeper Sergeant':{sex:'m',accent:/US|AU|GB/,pitch:.96,rate:1.1},'Covenant Command':{sex:'f',accent:/GB|US/,pitch:1,rate:1.05}};
  const FEM=/female|samantha|victoria|karen|moira|tessa|fiona|serena|zira|aria|jenny|libby|sonia|emma|ava|allison|susan|kate|hazel|catherine|michelle|natasha|clara|joanna|salli|kimberly|ivy/i;
  const MALE=/male|daniel|alex|fred|oliver|arthur|guy|ryan|davis|thomas|rishi|david|mark|george|james|brian|eric|christopher|roger|andrew|william|liam|tom|aaron|gordon|lee|reed|evan|nathan/i;
  // natural / neural / online voices first, then the good built-ins; robotic engines last
  const score=v=>(/natural|neural|online|premium|enhanced|siri/i.test(v.name)?100:0)+(/google/i.test(v.name)?60:0)+(/samantha|daniel|karen|moira|alex|serena|arthur|oliver/i.test(v.name)?40:0)
    -(/espeak|compact|novelty|whisper|bells|bad news|boing|bubbles|cellos|jester|organ|trinoids|zarvox|albert|fred|junior|ralph|superstar|wobble|deranged|hysterical|pipe/i.test(v.name)?200:0)+(v.localService?0:10);
  let vlist=[],cast={};
  function loadVoices(){try{vlist=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)).sort((a,b)=>score(b)-score(a));}catch(_){vlist=[];}cast={};}
  function voiceFor(who){
    if(cast[who]!==undefined)return cast[who];const V=VOICE[who]||{};const used=new Set(Object.values(cast));
    const sexOf=v=>FEM.test(v.name)&&!/\bmale\b/i.test(v.name)?'f':MALE.test(v.name)?'m':'?';
    const fit=v=>(sexOf(v)===V.sex?50:sexOf(v)==='?'?10:-80)+(V.accent&&V.accent.test(v.lang)?15:0)+(used.has(v)?-35:0)+score(v);
    let best=null,bs=-1e9;for(const v of vlist){const s=fit(v);if(s>bs){bs=s;best=v;}}
    return cast[who]=best||null;
  }
  if(window.speechSynthesis){loadVoices();speechSynthesis.onvoiceschanged=loadVoices;}
  function speak(who,text){
    if(!on||!speech||!window.speechSynthesis||!ctx)return;
    try{
      if(speechSynthesis.pending)speechSynthesis.cancel();   // never fall more than one line behind the action
      const u=new SpeechSynthesisUtterance(text.replace(/’/g,"'")),V=VOICE[who]||{pitch:1,rate:1};
      u.pitch=V.pitch;u.rate=V.rate;u.volume=1;const v=voiceFor(who);if(v){u.voice=v;u.lang=v.lang;}
      speechSynthesis.speak(u);
    }catch(_){}
  }

  /* ---------- events ---------- */
  const api={
    shot,explosion,missile,engine,drone,speak,place,
    onStart(f){onStart.push(f);if(ctx)f();},
    crash(pos){const P=place(pos,7000);if(!ctx||!on)return;   // a capital ship breaking up: groaning metal and a long rumble
      tone({wave:'sawtooth',f0:70,f1:28,dec:3.5,vol:.35*P.g,lp:400,a:.3,pan:P.pan});tone({wave:'sawtooth',f0:140,f1:45,dec:2.8,vol:.12*P.g,lp:700,a:.2,detune:15,pan:P.pan});
      burst({f0:400,f1:50,dec:4,vol:.6*P.g,a:.4,rate:.4,pan:P.pan});},
    jump(pos){if(!ctx||!on)return;const P=place(pos,9000);   // dropping out of hyperspace
      tone({wave:'sawtooth',f0:1800,f1:60,dec:1.1,vol:.18*Math.max(.35,P.g),lp:2600,pan:P.pan});burst({type:'bandpass',f0:4000,f1:200,q:.9,dec:1.4,vol:.4*Math.max(.35,P.g),pan:P.pan});
      tone({wave:'sine',f0:50,f1:28,dec:1.6,vol:.4*Math.max(.35,P.g),delay:.2});},
    horn(pos){if(!ctx||!on||!limit('horn',2500))return;const P=place(pos,4000);const g=Math.max(.3,P.g);   // the Empty Host's war horn
      for(const [f,d] of[[73,0],[110,.02],[146,.04]])tone({wave:'sawtooth',f0:f,f1:f*.94,a:.25,dec:2.2,vol:.09*g,lp:800,delay:d,pan:P.pan});},
    trooperDown(pos){if(!ctx||!on||!limit('td',70))return;const P=place(pos,450);if(P.g<.05)return;   // a short cry
      const f=160+Math.random()*90;tone({wave:'sawtooth',f0:f*1.4,f1:f*.7,a:.01,dec:.22,vol:.12*P.g,bp:650+Math.random()*400,q:3,pan:P.pan});},
    spearFire(){if(!ctx||!on)return;tone({wave:'sawtooth',f0:80,f1:2400,dec:.9,vol:.25,lp:5000});burst({f0:6000,f1:80,dec:3.5,vol:1,a:.01,rate:.5});
      tone({wave:'sine',f0:48,f1:20,dec:3.5,vol:.8,delay:.05});},
    beam(pos){if(!ctx||!on)return;const P=place(pos,9000),g=Math.max(.35,P.g);
      tone({wave:'sawtooth',f0:1600,f1:180,dec:.8,vol:.22*g,lp:4000,pan:P.pan});burst({type:'bandpass',f0:2500,f1:400,q:.8,dec:.9,vol:.4*g,pan:P.pan});},
    collapse(pos){if(!ctx||!on||!limit('col',350))return;const P=place(pos,5000),g=Math.max(.15,P.g);   // a tower coming down
      burst({f0:700,f1:60,dec:4.5,vol:.7*g,a:.15,rate:.45,pan:P.pan});tone({wave:'sine',f0:55,f1:24,dec:4,vol:.4*g,a:.2,pan:P.pan});
      burst({type:'bandpass',f0:1800,f1:500,q:2,dec:.9,vol:.15*g,delay:.3,pan:P.pan});burst({type:'bandpass',f0:2600,f1:700,q:3,dec:.7,vol:.1*g,delay:1.1,pan:P.pan});},
    cityDeath(){if(!ctx||!on)return;burst({f0:3000,f1:40,dec:7,vol:1.2,a:.02,rate:.35});tone({wave:'sine',f0:40,f1:16,dec:7,vol:1});tone({wave:'sawtooth',f0:90,f1:30,dec:5,vol:.2,lp:300});},
    radio(){if(!ctx||!on)return;burst({type:'bandpass',f0:1800,q:2,dec:.16,vol:.12});tone({wave:'square',f0:1200,f1:1200,dec:.06,vol:.02,delay:.17});},
    hit(shieldOnly){if(!ctx||!on||!limit('hit',90))return;   // something hit you: a shield crackle, or a hull clang
      if(shieldOnly){burst({type:'bandpass',f0:3000,f1:1200,q:2,dec:.18,vol:.18});tone({wave:'sine',f0:900,f1:400,dec:.15,vol:.05});}
      else{tone({wave:'square',f0:180,f1:70,dec:.25,vol:.12,lp:900});burst({f0:2500,f1:300,dec:.3,vol:.3});}},
    alarm(){if(!ctx||!on||!limit('alarm',1500))return;for(let k=0;k<3;k++)tone({wave:'square',f0:880,f1:880,dec:.14,vol:.035,lp:2000,delay:k*.22});},
    shipDown(){if(!ctx||!on)return;burst({f0:2600,f1:80,dec:1.6,vol:.8,a:.005,rate:.8});tone({wave:'sine',f0:70,f1:25,dec:1.4,vol:.5});this.alarm();},
    zeal(){if(!ctx||!on)return;tone({wave:'sawtooth',f0:110,f1:880,dec:1.2,vol:.1,lp:3000,a:.2});tone({wave:'sine',f0:440,f1:1320,dec:1.4,vol:.08,a:.3});burst({type:'bandpass',f0:800,f1:5000,q:1,dec:1.2,vol:.2,a:.3});},
    wake(){if(!ctx||!on)return;burst({f0:200,f1:1400,dec:5,vol:.5,a:2,rate:.3});tone({wave:'sine',f0:30,f1:60,dec:6,vol:.6,a:2});tone({wave:'sawtooth',f0:55,f1:110,dec:5,vol:.06,lp:400,a:2.5});},
    toggle(v){on=v==null?!on:v;try{localStorage.setItem('tideAudio',on?'on':'off');}catch(_){}
      if(master)master.gain.setTargetAtTime(on?.8:0,ctx.currentTime,.05);if(!on&&window.speechSynthesis)speechSynthesis.cancel();for(const b of btns)b.textContent='Sound: '+(on?'on':'off');return on;},
    get on(){return on;},
    // a Sound button inside a chapter's own button group
    mountButton(parent,before,cls){const b=document.createElement(parent.tagName==='DIV'?'button':'button');b.type='button';if(cls)b.className=cls;b.textContent='Sound: '+(on?'on':'off');
      b.addEventListener('click',()=>{start();api.toggle();b.blur();});parent.insertBefore(b,before||null);btns.push(b);return b;},
  };
  const btns=[];

  /* ---------- hooks into the shared effects ---------- */
  const _fire=fire;fire=function(from,to,speed,kind,onHit){shot(kind,from);return _fire(from,to,speed,kind,onHit);};
  const _boom=boom;boom=function(pos,size,hex,life){explosion(pos,size);return _boom(pos,size,hex,life);};
  const _fm=fireMissile;fireMissile=function(from,dir,speed,target,cb){missile(from,true);return _fm(from,dir,speed,target,cb);};
  addEventListener('keydown',e=>{if(e.code==='KeyM'&&!e.repeat){start();api.toggle();}});
  return api;
})();
