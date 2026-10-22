/* Elyra · the sound of the recovered footage and the archive menu: menu music (that can be made to go wrong), the room tone,
   breathing, relays, static, the creature, and the voices (device speech, cast like the chapters: Michael's deeper voice, ELYRA calm,
   lower and slower when she sounds almost human). Shared by the menu secret (js/menu/the-call.js) and the footage (js/menu/footage.js). */
/* =====================================================================================================================
   SOUND · all synthesized. The menu music lives here too (the menu was silent before): a low pad that starts on the first
   tap or key, a different, wrong-sounding one once The Call has been seen. M mutes (shared with the chapters).
   ===================================================================================================================== */
const CALL_AU=(()=>{
  let ctx=null,master,mbus,fbus,noise,on=true,mus=null,want=null,hum=null,breath=null;
  try{on=localStorage.getItem('tideAudio')!=='off';}catch(_){}
  function start(){
    if(ctx){if(ctx.state!=='running')ctx.resume().catch(()=>{});return;}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{ctx=new AC();}catch(_){return;}
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;
    master=ctx.createGain();master.gain.value=on?.9:0;mbus=ctx.createGain();fbus=ctx.createGain();mbus.connect(comp);fbus.connect(comp);comp.connect(master);master.connect(ctx.destination);
    const len=ctx.sampleRate*2;noise=ctx.createBuffer(1,len,ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    if(want)music(want);
  }
  for(const ev of['pointerdown','touchend','keydown'])addEventListener(ev,start,{capture:true,passive:true});
  const now=()=>ctx.currentTime;
  function gain(v,dest){const g=ctx.createGain();g.gain.value=v;g.connect(dest||fbus);return g;}
  function env(g,t,a,v,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);}
  function tone(o){if(!ctx)return;const t=now()+(o.delay||0),a=o.a||.005,s=ctx.createOscillator();s.type=o.wave||'sine';s.frequency.setValueAtTime(o.f0,t);
    if(o.f1)s.frequency.exponentialRampToValueAtTime(Math.max(18,o.f1),t+a+o.dec);let tail=s;
    if(o.lp||o.bp){const f=ctx.createBiquadFilter();f.type=o.bp?'bandpass':'lowpass';f.frequency.value=o.bp||o.lp;f.Q.value=o.q||(o.bp?4:.7);s.connect(f);tail=f;}
    const g=gain(0,o.bus==='m'?mbus:fbus);env(g,t,a,o.vol,o.dec);tail.connect(g);s.start(t);s.stop(t+a+o.dec+.1);}
  function burst(o){if(!ctx)return;const t=now()+(o.delay||0),a=o.a||.005,s=ctx.createBufferSource();s.buffer=noise;s.loop=true;s.playbackRate.value=o.rate||1;
    const f=ctx.createBiquadFilter();f.type=o.type||'lowpass';f.frequency.setValueAtTime(o.f0,t);if(o.f1)f.frequency.exponentialRampToValueAtTime(o.f1,t+a+o.dec);f.Q.value=o.q||.7;
    const g=gain(0);env(g,t,a,o.vol,o.dec);s.connect(f);f.connect(g);s.start(t,Math.random()*1.5);s.stop(t+a+o.dec+.1);}
  /* ---------- the menu music: a slow pad. 'a' is the archive as it was; 'b' (after The Call) sits a semitone against itself, with a sonar ping ---------- */
  const CH={a:[55,82.41,110,130.81,164.81],b:[51.91,55,77.78,110,155.56]};
  function curve(k){const n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=(1+k)*x/(1+k*Math.abs(x));}return c;}
  function music(v){want=v;if(!ctx)return;if(mus&&mus.v===v&&!mus.bent)return;stopMusic(2.5);if(!v)return;
    const t=now(),out=gain(0,mbus);out.gain.linearRampToValueAtTime(1,t+5);
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=v==='b'?430:640;lp.Q.value=.9;
    const dry=gain(1,out),wet=gain(0,out),sh=ctx.createWaveShaper();sh.curve=curve(30);lp.connect(dry);lp.connect(sh);sh.connect(wet);
    const lfo=ctx.createOscillator();lfo.frequency.value=.045;const lg=ctx.createGain();lg.gain.value=v==='b'?170:250;lfo.connect(lg);lg.connect(lp.frequency);lfo.start();
    const vib=ctx.createOscillator();vib.frequency.value=4.7;const vg=ctx.createGain();vg.gain.value=0;vib.connect(vg);vib.start();
    const oscs=[];CH[v].forEach((f,i)=>{for(const[w,dt]of[['triangle',-5],['sawtooth',6]]){const o=ctx.createOscillator();o.type=w;o.frequency.value=f;o.detune.value=dt;vg.connect(o.detune);
      const og=ctx.createGain();og.gain.value=(w==='sawtooth'?.011:.028)*(i<2?1.25:.8);o.connect(og);og.connect(lp);o.start();oscs.push(o);}});
    const ping=v==='b'?setInterval(()=>{if(!ctx||!mus)return;tone({f0:1318.5,dec:3.2,vol:.016,bus:'m'});tone({f0:1244.5,dec:3.4,vol:.012,delay:.06,bus:'m'});},13000):0;
    mus={v,out,lp,dry,wet,oscs,lfo,vib,vg,ping,bent:false};}
  function stopMusic(fade){if(!mus)return;const m=mus;mus=null;clearInterval(m.ping);const t=now();m.out.gain.cancelScheduledValues(t);m.out.gain.setValueAtTime(m.out.gain.value,t);
    m.out.gain.linearRampToValueAtTime(0,t+fade);setTimeout(()=>{for(const o of m.oscs)try{o.stop();}catch(_){}try{m.lfo.stop();m.vib.stop();}catch(_){}},fade*1000+200);}
  // the music slowly goes wrong: the notes sag apart, a wobble creeps in, the filter closes and the sound tears
  function distort(dur){if(!mus)return;const m=mus,t=now();m.bent=true;
    m.oscs.forEach((o,i)=>{o.detune.cancelScheduledValues(t);o.detune.setValueAtTime(o.detune.value,t);o.detune.linearRampToValueAtTime(o.detune.value-(50+(i*37)%130),t+dur);});
    m.vg.gain.setValueAtTime(0,t);m.vg.gain.linearRampToValueAtTime(28,t+dur);m.lfo.frequency.linearRampToValueAtTime(.9,t+dur);
    m.lp.frequency.cancelScheduledValues(t);m.lp.frequency.setValueAtTime(m.lp.frequency.value,t);m.lp.frequency.linearRampToValueAtTime(240,t+dur);
    m.wet.gain.setValueAtTime(0,t+dur*.25);m.wet.gain.linearRampToValueAtTime(.75,t+dur);m.dry.gain.linearRampToValueAtTime(.45,t+dur);}
  /* ---------- the scenes ---------- */
  function humOn(level,fade){if(!ctx)return;if(!hum){const t=now(),g=gain(0);
      const o1=ctx.createOscillator();o1.frequency.value=47;o1.connect(g);
      const o2=ctx.createOscillator();o2.type='sawtooth';o2.frequency.value=94;const f2=ctx.createBiquadFilter();f2.frequency.value=240;o2.connect(f2);const g2=ctx.createGain();g2.gain.value=.35;f2.connect(g2);g2.connect(g);
      const n=ctx.createBufferSource();n.buffer=noise;n.loop=true;const fn=ctx.createBiquadFilter();fn.frequency.value=130;n.connect(fn);const gn=ctx.createGain();gn.gain.value=.8;fn.connect(gn);gn.connect(g);
      o1.start(t);o2.start(t);n.start(t);hum={g,src:[o1,o2,n]};}
    const t=now();hum.g.gain.cancelScheduledValues(t);hum.g.gain.setValueAtTime(hum.g.gain.value,t);hum.g.gain.linearRampToValueAtTime(level,t+(fade||2));}
  function humOff(fade){if(!hum)return;const h=hum;hum=null;const t=now();h.g.gain.cancelScheduledValues(t);h.g.gain.setValueAtTime(h.g.gain.value,t);h.g.gain.linearRampToValueAtTime(0,t+(fade||.05));
    setTimeout(()=>{for(const s of h.src)try{s.stop();}catch(_){}},(fade||.05)*1000+150);}
  // heavy, panicked breathing: noise through a moving band-pass, one breath a second
  function breathe(on,rate){if(!ctx)return;if(!on){if(breath){clearInterval(breath.id);const b=breath;breath=null;setTimeout(()=>{try{b.s.stop();}catch(_){}},1500);}return;}
    if(breath)return;const s=ctx.createBufferSource();s.buffer=noise;s.loop=true;const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=.9;f.frequency.value=800;const g=gain(0);s.connect(f);f.connect(g);s.start();
    const one=()=>{const t=now(),p=rate||1.05;f.frequency.setValueAtTime(1150,t);f.frequency.linearRampToValueAtTime(700,t+p*.5);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+p*.22);g.gain.linearRampToValueAtTime(.02,t+p*.45);g.gain.linearRampToValueAtTime(.12,t+p*.6);g.gain.linearRampToValueAtTime(0,t+p*.95);};
    one();breath={s,id:setInterval(one,(rate||1.05)*1000)};}
  const fx={
    relay(){burst({type:'highpass',f0:2500,dec:.04,vol:.25});tone({wave:'square',f0:120,dec:.25,vol:.05,lp:800,delay:.02});tone({wave:'sawtooth',f0:60,dec:.5,vol:.04,lp:300,delay:.03});},
    lightsOff(){burst({type:'highpass',f0:1800,dec:.05,vol:.3});tone({wave:'sine',f0:220,f1:40,dec:.6,vol:.12});},
    boot(){tone({f0:280,f1:880,dec:.35,vol:.05});tone({wave:'square',f0:1200,dec:.05,vol:.02,bp:1500,delay:.4});tone({wave:'square',f0:1600,dec:.05,vol:.02,bp:1800,delay:.52});},
    type(){tone({wave:'square',f0:2200+Math.random()*400,dec:.02,vol:.008,bp:2400});},
    process(sec){for(let i=0;i<sec*4;i++)tone({wave:'square',f0:i%2?165:220,dec:.17,vol:.028,bp:700,q:3,delay:i*.25});tone({f0:55,dec:sec,vol:.08,a:.4});},
    thump(){tone({f0:52,f1:28,dec:1.8,vol:.55});burst({f0:220,f1:60,dec:1.3,vol:.25});},
    pulse(){tone({f0:46,f1:34,dec:1.1,vol:.22});tone({f0:880,f1:860,dec:.8,vol:.012,a:.2});},
    surge(){tone({wave:'sawtooth',f0:55,f1:300,a:.7,dec:.6,vol:.14,lp:1400});burst({f0:300,f1:4000,a:.7,dec:.4,vol:.18});},
    glitch(){for(let i=0;i<9;i++)tone({wave:'square',f0:200+Math.random()*2800,dec:.035,vol:.06,delay:Math.random()*.3});burst({type:'bandpass',f0:3000,q:.5,dec:.3,vol:.22});},
    stat(d){burst({type:'bandpass',f0:2600,q:.5,dec:d||.4,vol:.14});},
    crackle(d){for(let i=0;i<d*14;i++)burst({type:'highpass',f0:3000,dec:.012,vol:.08+Math.random()*.1,delay:Math.random()*d});},
    boom(){tone({f0:62,f1:24,dec:3.4,vol:.6});burst({f0:400,f1:50,dec:2.8,vol:.35});},
    creature(){tone({wave:'sawtooth',f0:38,f1:26,a:1.4,dec:4,vol:.3,lp:150});burst({f0:110,f1:40,a:1,dec:4.5,vol:.35});tone({f0:19,dec:5,vol:.4,a:1.5});},
    footstep(){burst({f0:500,f1:120,dec:.12,vol:.12});},
  };
  return{start,music,stopMusic,distort,humOn,humOff,breathe,fx,get ctx(){return ctx;},get on(){return on;},
    get music_(){return mus&&mus.v;},
    toggle(){on=!on;try{localStorage.setItem('tideAudio',on?'on':'off');}catch(_){}if(master)master.gain.value=on?.9:0;if(!on)try{speechSynthesis.cancel();}catch(_){}},
    stopScene(){humOff(.6);breathe(false);}};
})();

/* =====================================================================================================================
   VOICES · the device's speech, cast the same way the chapters cast it. Michael keeps his deeper voice; ELYRA is a calm
   woman's voice, slower and lower in The Hollow ("almost human"). A line that can't be spoken (no tap yet, no voices,
   muted) still holds its subtitle for its reading time.
   ===================================================================================================================== */
const CALL_V=(()=>{
  const AU=CALL_AU;
  const has=!!window.speechSynthesis;
  const VOICE={'Lt. Michael':{sex:'m',accent:/US|CA|GB/,pitch:.84,rate:.95,prefer:/guy|christopher|davis|andrew|brian|aaron|roger|tom\b|eric|reed|evan|nathan|daniel/i,
      tired:{pitch:.82,rate:.86},sharp:{pitch:.78,rate:1.04},whisper:{pitch:.8,rate:.82,vol:.6}},
    'ELYRA':{sex:'f',accent:/GB|US|AU|IE/,pitch:1,rate:.9,prefer:/serena|libby|sonia|hazel|aria|jenny|samantha|moira|kate|emma/i,human:{pitch:.86,rate:.78},soft:{pitch:.94,rate:.8,vol:.7}},
    // the Pathfinder's crew (footage 04–06), cast as the chapters cast them (js/shared/audio.js). Every speaker needs a sex here:
    // a name missing from this table used to fall through to a voice of unknown sex, which on iOS meant a novelty voice that sings
    'Captain Rhen':{sex:'m',accent:/GB|AU|US/,pitch:.98,rate:1.02,sharp:{pitch:.92,rate:1.12},tired:{pitch:.94,rate:.92}},
    'Sergeant Marsh':{sex:'m',accent:/US|AU|CA/,pitch:.86,rate:1.04,sharp:{pitch:.8,rate:1.14}},
    'Okafor':{sex:'m',accent:/GB|NG|ZA|US/,pitch:1.02,rate:1.08,tired:{pitch:.98,rate:.9}},
    'Ensign Landry':{sex:'f',accent:/GB|IE|AU|US/,pitch:1.05,rate:1.1,sharp:{pitch:1,rate:1.2}},
    'Dropship Two':{sex:'m',accent:/US|CA|GB/,pitch:.94,rate:.96,tired:{pitch:.9,rate:.84}}};
  const FEM=/female|samantha|victoria|karen|moira|tessa|fiona|serena|zira|aria|jenny|libby|sonia|emma|ava|allison|susan|kate|hazel|catherine|michelle|natasha|clara|joanna|salli|kimberly|ivy/i;
  const MALE=/male|daniel|alex|fred|oliver|arthur|guy|ryan|davis|thomas|rishi|david|mark|george|james|brian|eric|christopher|roger|andrew|william|liam|tom|aaron|gordon|lee|reed|evan|nathan/i;
  // novelty voices are dropped outright, not just ranked low: iOS's Good News and Bad News sing every line to a tune
  const NOVELTY=/espeak|novelty|whisper|bells|good news|bad news|bahh|boing|bubbles|cellos|jester|organ|trinoids|zarvox|albert|fred|junior|ralph|superstar|wobble|deranged|hysterical|pipe/i;
  const score=v=>(/natural|neural|online|premium|enhanced/i.test(v.name)?100:0)-(/siri/i.test(v.name)?400:0)+(/google/i.test(v.name)?60:0)+(/samantha|daniel|karen|moira|alex|serena|arthur|oliver/i.test(v.name)?40:0)
    -(/espeak|compact|novelty|whisper|bells|good news|bad news|bahh|boing|bubbles|cellos|jester|organ|trinoids|zarvox|albert|fred|junior|ralph|superstar|wobble|deranged|hysterical|pipe/i.test(v.name)?200:0)+(v.localService?0:10);
  let list=[],cast={};
  function load(){try{list=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)&&!NOVELTY.test(v.name)).sort((a,b)=>score(b)-score(a));}catch(_){list=[];}cast={};}
  function voiceFor(who){if(cast[who]!==undefined)return cast[who];const P=VOICE[who]||{},used=new Set(Object.values(cast));
    const sexOf=v=>FEM.test(v.name)&&!/\bmale\b/i.test(v.name)?'f':MALE.test(v.name)?'m':'?';
    let best=null,bs=-1e9;for(const v of list){const s=(sexOf(v)===P.sex?50:sexOf(v)==='?'?10:-80)+(P.accent&&P.accent.test(v.lang)?15:0)+(used.has(v)?-35:0)+(P.prefer&&P.prefer.test(v.name)?40:0)+score(v);if(s>bs){bs=s;best=v;}}
    return cast[who]=best||null;}
  if(has){load();speechSynthesis.onvoiceschanged=load;}
  // iOS only speaks after an utterance has been started inside a real tap
  let ok=false,unl=false;
  function unlock(){if(ok||unl||!has)return;unl=true;try{const u=new SpeechSynthesisUtterance('.');u.volume=.01;u.rate=2;u.onstart=()=>{ok=true;};u.onend=u.onerror=()=>{unl=false;};speechSynthesis.speak(u);setTimeout(()=>{unl=false;},1500);}catch(_){unl=false;}}
  for(const ev of['touchend','click','keydown'])addEventListener(ev,unlock,{capture:true,passive:true});
  const est=(text,rate)=>text.split(/\s+/).length/(2.55*rate)+.5;
  function say(who,text,tone){return new Promise(res=>{
    const B=VOICE[who]||{pitch:1,rate:1},P=Object.assign({},B,tone&&B[tone]||{}),e=est(text,P.rate);let a=0,b=0,done=false,started=false;
    const t0=performance.now();
    // a line that ends without ever being spoken (no voices, an error) still holds its subtitle for its reading time
    const fin=()=>{if(done)return;done=true;clearTimeout(a);clearTimeout(b);const left=started?0:e*1000-(performance.now()-t0);if(left>0)setTimeout(res,left);else res();};
    if(!has||!AU.on||!AU.ctx){a=setTimeout(fin,e*1000);return;}
    try{const u=new SpeechSynthesisUtterance(text.replace(/’/g,"'").replace(/—/g,', ').replace(/\.\.\./g,', '));u.pitch=P.pitch;u.rate=P.rate;u.volume=P.vol||1;
      const v=voiceFor(who);if(v){u.voice=v;u.lang=v.lang;}u.onstart=()=>{started=true;ok=true;};u.onend=u.onerror=fin;
      a=setTimeout(fin,(e*2.2+3)*1000);b=setTimeout(()=>{if(!started){clearTimeout(a);a=setTimeout(fin,Math.max(0,e*1000-1600));}},1600);speechSynthesis.speak(u);}catch(_){a=setTimeout(fin,e*1000);}});}
  function hush(){try{if(has)speechSynthesis.cancel();}catch(_){}}
  return{say,hush};
})();
