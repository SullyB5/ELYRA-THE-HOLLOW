/* THE CALL · the archive menu's secret.
   Leave the menu alone for 5 to 10 minutes and the menu music starts to drift and distort, the view creeps, the background
   flickers once, and the screen goes black. Then a recovered piece of footage plays: Michael, alone on the command deck at
   Tide City Command (the room with the holo-table dome the Mountain opens and ends in), talking to ELYRA, the Vigil's ship AI.
   Which footage depends on how far this device has got, and each one is seen in order:
     1 · The Call    (always first)            Michael asks ELYRA where the Hollow is. "Because you are already there."
     2 · The Return  (after Archive 01)        the coordinates, twenty-three years, the empty facility, the thing outside.
     3 · The Hollow  (after Archive 03)        Michael inside the Hollow, the names on the wall, his own, dated tomorrow.
   Afterwards the menu remembers: a tiny red light blinks in the background and the menu music is different (1), the footer
   shows an access record (2), and after the third there is no music at all and ELYRA says one more line.
   Everything is drawn on one canvas in code and every sound is synthesized; the voices use the device's speech like the chapters.
   Test: index.html?call=1 (or 2, 3) starts that footage after 4 seconds of stillness, ignoring progress.
   Enter, Esc or the Skip button (shown on any tap) skip it. */
(()=>{
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const KEY='elyra.call';
let mem={seen:0,views:0};try{Object.assign(mem,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(_){}
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(mem));}catch(_){}};
const achs=()=>{try{if(typeof PG!=='undefined')return PG.save.ach||{};return(JSON.parse(localStorage.getItem('elyra.save.v1')||'{}').ach)||{};}catch(_){return{};}};
const qs=new URLSearchParams(location.search),FORCE=+qs.get('call')||0;
// the footage this device sees next: never skips one, never runs ahead of the story
function tierNow(){if(FORCE>=1&&FORCE<=3)return FORCE;const a=achs(),prog=a.tideholds?3:a.origin?2:1;return Math.min(prog,mem.seen+1);}
let silentSession=false;   // after The Hollow: no menu music for the rest of this visit

/* =====================================================================================================================
   SOUND · all synthesized. The menu music lives here too (the menu was silent before): a low pad that starts on the first
   tap or key, a different, wrong-sounding one once The Call has been seen. M mutes (shared with the chapters).
   ===================================================================================================================== */
const AU=(()=>{
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
const V=(()=>{
  const has=!!window.speechSynthesis;
  const VOICE={'Lt. Michael':{sex:'m',accent:/US|CA|GB/,pitch:.84,rate:.95,prefer:/guy|christopher|davis|andrew|brian|aaron|roger|tom\b|eric|reed|evan|nathan|daniel/i,
      tired:{pitch:.82,rate:.86},sharp:{pitch:.78,rate:1.04},whisper:{pitch:.8,rate:.82,vol:.6}},
    'ELYRA':{sex:'f',accent:/GB|US|AU|IE/,pitch:1,rate:.9,prefer:/serena|libby|sonia|hazel|aria|jenny|samantha|moira|kate|emma/i,human:{pitch:.86,rate:.78},soft:{pitch:.94,rate:.8,vol:.7}}};
  const FEM=/female|samantha|victoria|karen|moira|tessa|fiona|serena|zira|aria|jenny|libby|sonia|emma|ava|allison|susan|kate|hazel|catherine|michelle|natasha|clara|joanna|salli|kimberly|ivy/i;
  const MALE=/male|daniel|alex|fred|oliver|arthur|guy|ryan|davis|thomas|rishi|david|mark|george|james|brian|eric|christopher|roger|andrew|william|liam|tom|aaron|gordon|lee|reed|evan|nathan/i;
  const score=v=>(/natural|neural|online|premium|enhanced/i.test(v.name)?100:0)-(/siri/i.test(v.name)?400:0)+(/google/i.test(v.name)?60:0)+(/samantha|daniel|karen|moira|alex|serena|arthur|oliver/i.test(v.name)?40:0)
    -(/espeak|compact|novelty|whisper|bells|bad news|boing|bubbles|cellos|jester|organ|trinoids|zarvox|albert|fred|junior|ralph|superstar|wobble|deranged|hysterical|pipe/i.test(v.name)?200:0)+(v.localService?0:10);
  let list=[],cast={};
  function load(){try{list=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)).sort((a,b)=>score(b)-score(a));}catch(_){list=[];}cast={};}
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
    const fin=()=>{if(done)return;done=true;clearTimeout(a);clearTimeout(b);res();};
    if(!has||!AU.on||!AU.ctx){a=setTimeout(fin,e*1000);return;}
    try{const u=new SpeechSynthesisUtterance(text.replace(/’/g,"'").replace(/—/g,', ').replace(/\.\.\./g,', '));u.pitch=P.pitch;u.rate=P.rate;u.volume=P.vol||1;
      const v=voiceFor(who);if(v){u.voice=v;u.lang=v.lang;}u.onstart=()=>{started=true;ok=true;};u.onend=u.onerror=fin;
      a=setTimeout(fin,(e*2.2+3)*1000);b=setTimeout(()=>{if(!started){clearTimeout(a);a=setTimeout(fin,Math.max(0,e*1000-1600));}},1600);speechSynthesis.speak(u);}catch(_){a=setTimeout(fin,e*1000);}});}
  function hush(){try{if(has)speechSynthesis.cancel();}catch(_){}}
  return{say,hush};
})();

/* =====================================================================================================================
   THE STAGE · one full-screen canvas. Scenes are drawn in a 1600×900 frame; a phone held upright sees the middle 900 of
   it (the camera keeps what matters inside), in a letterboxed band.
   ===================================================================================================================== */
const VW=1600,VH=900;
const st=document.createElement('style');st.textContent=`
#call{position:fixed;inset:0;z-index:50;background:#000;cursor:none;-webkit-user-select:none;user-select:none}
#call.cur{cursor:auto}#call canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#call .csub{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 8vh);transform:translateX(-50%);width:min(860px,88vw);text-align:center;
  font:500 17px/1.45 'Chakra Petch','Arial Narrow',system-ui,sans-serif;letter-spacing:.03em;color:#e6e4df;text-shadow:0 1px 4px #000,0 0 2px #000;opacity:0;transition:opacity .25s}
#call .csub.on{opacity:1}#call .csub b{display:block;font:500 10px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.26em;color:rgba(159,200,204,.85);text-transform:uppercase;margin-bottom:3px}
#call .csub.m b{color:rgba(230,228,223,.55)}#call .csub.x b{color:#e8463c}#call .csub.x span{color:#cfd8ff;letter-spacing:.06em}
#call .ctitle{position:absolute;inset:0;display:grid;place-items:center;text-align:center;opacity:0;transition:opacity 1.6s;pointer-events:none;
  font:500 clamp(22px,4.4vw,48px)/1.25 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.42em;color:#e6e4df;padding:0 6vw}
#call .ctitle.on{opacity:1}#call .ctitle small{display:block;margin-top:16px;font:400 10px 'JetBrains Mono',monospace;letter-spacing:.32em;color:rgba(230,228,223,.45)}
#call .ctitle.rec{font:600 clamp(12px,1.9vw,17px)/1.6 'JetBrains Mono',monospace;letter-spacing:.2em;color:#e8463c}
#call .cskip{position:absolute;right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 16px);padding:8px 14px;border:1px solid rgba(230,228,223,.3);
  background:rgba(0,0,0,.5);color:rgba(230,228,223,.75);font:500 11px 'Chakra Petch',sans-serif;letter-spacing:.22em;text-transform:uppercase;cursor:pointer}
@media (max-width:760px){#call .csub{font-size:15px;bottom:calc(env(safe-area-inset-bottom,0px) + 11vh)}}
.call-light{position:absolute;left:9%;top:83%;width:3px;height:3px;border-radius:50%;background:#e8463c;box-shadow:0 0 5px 1px rgba(232,70,60,.8);pointer-events:none;animation:callb 3.1s steps(1) infinite}
@keyframes callb{0%{opacity:1}7%{opacity:.08}52%{opacity:1}55%{opacity:.08}60%{opacity:1}}
.call-rec{color:rgba(232,70,60,.8)!important}
.call-say{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 10vh);transform:translateX(-50%);z-index:30;pointer-events:none;text-align:center;
  font:500 15px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.06em;color:#cfd8ff;text-shadow:0 0 8px #000;background:rgba(3,3,4,.82);padding:10px 18px;opacity:0;transition:opacity 2s}
.call-say b{display:block;font:500 10px 'JetBrains Mono',monospace;letter-spacing:.26em;color:#e8463c;margin-bottom:4px}.call-say.on{opacity:1}`;
document.head.appendChild(st);
const root=document.createElement('div');root.id='call';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-label','Recovered footage');
root.innerHTML='<canvas></canvas><div class="csub" aria-live="polite"><b></b><span></span></div><div class="ctitle"></div><button class="cskip" type="button" hidden>Skip ›</button>';
document.body.appendChild(root);
const cv=root.querySelector('canvas'),c=cv.getContext('2d'),subEl=root.querySelector('.csub'),titleEl=root.querySelector('.ctitle'),skipEl=root.querySelector('.cskip');
let W=0,H=0,DPR=1,SC=1;
function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  SC=Math.max(Math.min(W/VW,H/VH),Math.min(H/VH,W/900));}
addEventListener('resize',resize);

// offscreen buffers: room light (multiplied over the deck), darkness with a torch-shaped hole (the Hollow), a grain tile, the rock face
const mk=(w,h)=>{const k=document.createElement('canvas');k.width=w;k.height=h;return k;};
const LB=mk(800,450),lb=LB.getContext('2d'),MK=mk(800,450),mx=MK.getContext('2d');
const GR=mk(192,192);{const g=GR.getContext('2d'),d=g.createImageData(192,192);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=Math.random()<.5?255:0;}g.putImageData(d,0,0);}
let grainPat=null;
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
let ROCK=null;function rock(){if(ROCK)return ROCK;ROCK=mk(1600,900);const g=ROCK.getContext('2d'),r=rng(77);g.fillStyle='#2a2a2e';g.fillRect(0,0,1600,900);
  for(let i=0;i<1400;i++){const x=r()*1600,y=r()*900,s=4+r()*60;g.fillStyle=r()<.5?`rgba(0,0,0,${.04+r()*.08})`:`rgba(255,255,255,${.015+r()*.03})`;g.beginPath();g.ellipse(x,y,s,s*(.4+r()*.8),r()*3,0,7);g.fill();}
  g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=1.4;for(let i=0;i<26;i++){let x=r()*1600,y=r()*900;g.beginPath();g.moveTo(x,y);for(let k=0;k<9;k++){x+=(r()-.5)*90;y+=r()*70;g.lineTo(x,y);}g.stroke();}
  return ROCK;}

/* ---------- the names on the wall. Hundreds of them; Captain Rhen of the Pathfinder is one. Michael's is dated tomorrow ---------- */
const SUR=['ADEYEMI','ALCOTT','BRANDT','CALLOWAY','DARROW','EKWUEME','FARRIS','GALLO','HAYES','IVERS','JANSEN','KOVAC','LANDRY','MARSH','NAKAMURA','OKAFOR','PRUITT','QUINLAN','REYES','SATO',
  'THORNE','UDALL','VANCE','WEBER','YOUNG','ZIMMER','ABERNATHY','BLACKWOOD','CASTELLANOS','DUBOIS','ELLERY','FONTAINE','GRAVES','HOLLOWAY','IMANI','KESTREL','LINDQVIST','MERCER','NOVAK',
  'ORLOV','PELL','ROURKE','SALAZAR','TALLIS','VOSS','WINTERS','YARDLEY','ASHFORD','BELLAMY','CROSS','DRAKE','ESPOSITO','FINCH','HALE','KANE','LOCKE','MORROW','NASH','OYELARAN','STROUD'];
const RK=['PVT','CPL','SGT','SPC','LT','CPT','ENS','CMDR','SGT','PVT','CPL','SPC'];
const NAMES=(()=>{const r=rng(2237),out=[],pad=n=>String(n).padStart(2,'0');
  for(let row=0;row<11;row++)for(let col=-2;col<8;col++){
    let n=`${RK[(r()*RK.length)|0]}. ${'ABCDEFGHJKLMNPRSTW'[(r()*18)|0]}. ${SUR[(r()*SUR.length)|0]}`,d=`${pad(1+((r()*28)|0))}.${pad(1+((r()*12)|0))}.${2190+((r()*47)|0)}`,me=false;
    if(row===5&&col===3){n='LT. MICHAEL VEYR';d='17.03.2237';me=true;}
    else if(row===5&&col===2){n='CPT. A. RHEN';d='08.03.2237';}
    else if(row===4&&col===3){n='SGT. O. MARSH';d='08.03.2237';}
    out.push({x:120+col*280,y:96+row*78,n,d,me});}
  return out;})();
const ME=NAMES.find(n=>n.me);

/* =====================================================================================================================
   SCENE STATE · the script below only changes these numbers; the draw loop paints whatever they say
   ===================================================================================================================== */
let S=null;
if(FORCE)window.__call=()=>S;   // test hook, only with ?call=
function fresh(){return{t:0,shot:'black',cam:{x:800,y:450,z:1},black:1,
  red:0,redF:1,dome:0,domeOn:0,domeF:0,term:0,termF:1,cityLit:.05,lightsOut:0,
  man:{x:300,y:820,s:1,sit:1,step:0,face:1,head:0,lean:0,aim:null},
  screen:[],scrTyped:0,coords:false,
  flash:0,glitch:0,figure:0,cctvT:0,
  blue:0,beam:0,dark:.97,breath:1,eyes:0,eye:{x:760,y:430,k:1,gap:110},
  spot:{x:480,y:330,r:60},wallDim:0,
  tw:[]};}
const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
function tw(o,k,to,dur,lin){if(!S)return;S.tw=S.tw.filter(q=>!(q.o===o&&q.k===k));S.tw.push({o,k,from:o[k],to,dur:Math.max(.001,dur),t:0,lin});}
function stepTw(dt){for(const q of S.tw){q.t+=dt;const u=Math.min(1,q.t/q.dur);q.o[q.k]=q.from+(q.to-q.from)*(q.lin?u:ease(u));}S.tw=S.tw.filter(q=>q.t<q.dur);}

/* ---------- Michael: a silhouette in Keeper armour, sitting, standing, walking or holding a torch. Returns where his hand and head are ---------- */
function drawMan(m,rim,px){
  const L=(a,b,u)=>a+(b-a)*u,P=(sa,si)=>[L(sa[0],si[0],m.sit),L(sa[1],si[1],m.sit)];
  const sw=Math.sin(m.step)*30*(1-m.sit),lift=k=>Math.max(0,Math.sin(m.step+k))*14*(1-m.sit);
  const hip=P([0,-150],[-18,-118]);
  const kA=P([10+sw*.5,-80-lift(0)],[52,-124]),aA=P([sw,-lift(0)*1.2],[58,-4]);
  const kB=P([4-sw*.5,-80-lift(Math.PI)],[46,-120]),aB=P([-sw,-lift(Math.PI)*1.2],[50,-2]);
  const sh=P([6+m.lean*14,-250],[18+m.lean*14,-212+m.lean*6]);
  const hd=[sh[0]+6+m.sit*8+m.lean*10,sh[1]-34+m.sit*5-m.head*3];
  let eA=P([10-sw*.4,-196],[54,-170]),hA=P([14-sw*.6,-146],[96,-178]),eB=P([2+sw*.4,-198],[48,-172]),hB=P([sw*.6-2,-148],[88,-176]);
  if(m.aim!=null){const ca=Math.cos(m.aim),sa=Math.sin(m.aim);eA=[sh[0]+ca*50,sh[1]+6+sa*50];hA=[sh[0]+ca*100,sh[1]+6+sa*100];eB=[sh[0]+ca*40-6,sh[1]+14+sa*40];hB=[sh[0]+ca*86-4,sh[1]+12+sa*86];}
  c.save();c.translate(m.x,m.y);c.scale(m.s*m.face,m.s);
  c.lineCap=c.lineJoin='round';
  // two passes: the first throws the rim light, the second covers the glow where the limbs overlap, so only the outside edge glows
  for(let pass=0;pass<2;pass++){c.fillStyle=c.strokeStyle='#060709';c.shadowColor=rim;c.shadowBlur=pass?0:Math.max(2,9*px*m.s);
  const limb=(a,b,w)=>{c.lineWidth=w;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();};
  limb(hip,kB,30);limb(kB,aB,26);limb(aB,[aB[0]+20,aB[1]],14);   // far leg
  limb(sh,eB,20);limb(eB,hB,18);                                  // far arm
  c.beginPath();c.roundRect?c.roundRect(sh[0]-46,sh[1]+6,22,64,6):c.rect(sh[0]-46,sh[1]+6,22,64);c.fill();   // pack
  limb(sh,hip,54);limb([sh[0]+8,sh[1]+16],[hip[0]+6,hip[1]-30],48);   // torso and chest plate
  c.beginPath();c.ellipse(sh[0]+2,sh[1]+6,27,17,-.25,0,7);c.fill();   // shoulder plate
  limb(hip,kA,32);limb(kA,aA,28);limb(aA,[aA[0]+22,aA[1]],15);   // near leg
  limb([sh[0],sh[1]-6],hd,15);c.beginPath();c.arc(hd[0],hd[1],19,0,7);c.fill();   // neck, head
  limb(sh,eA,21);limb(eA,hA,19);                                  // near arm
  }
  c.shadowBlur=0;
  // damage: scratched plates
  c.strokeStyle='rgba(190,180,165,.2)';c.lineWidth=1.4;c.beginPath();c.moveTo(sh[0]-12,sh[1]);c.lineTo(sh[0]+4,sh[1]+9);c.moveTo(sh[0]-4,sh[1]-4);c.lineTo(sh[0]+10,sh[1]+4);
  c.moveTo(hip[0]+8,hip[1]-60);c.lineTo(hip[0]+16,hip[1]-48);c.stroke();
  if(m.aim!=null){c.fillStyle='#15161a';c.save();c.translate(hA[0],hA[1]);c.rotate(m.aim);c.fillRect(-6,-6,26,12);c.restore();}
  c.restore();
  const tx=p=>[m.x+p[0]*m.s*m.face,m.y+p[1]*m.s];
  return{hand:tx(m.aim!=null?[hA[0]+Math.cos(m.aim)*18,hA[1]+Math.sin(m.aim)*18]:hA),head:tx(hd)};
}

/* ---------- the command deck at Tide City Command: empty, dark, one red emergency light, the dome on the holo table ---------- */
const poly=(pts,fill)=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=fill;c.fill();};
const lw=(u,v)=>[260*u,(900-340*u)+((150*u)-(900-340*u))*v],rw=(u,v)=>[1600-260*u,(900-340*u)+((150*u)-(900-340*u))*v];
const CITY=(()=>{const r=rng(91),out=[];let x=330;while(x<1270){const w=14+r()*40,h=10+r()*55;out.push({x,w,h,win:Array.from({length:8},()=>r())});x+=w+2+r()*6;}return out;})();
const STARS=(()=>{const r=rng(5);return Array.from({length:70},()=>[330+r()*940,192+r()*230,r()]);})();
function redLevel(t){return S.red*S.redF*(.78+.22*Math.sin(t*2.3));}
function domeLight(t){const p=Math.pow(Math.max(0,Math.sin(t*1.9)),8);return Math.min(1.4,S.dome*(.25+.75*p)+S.domeOn*.85+S.domeF);}
function drawBay(t){
  const g=c.createLinearGradient(0,190,0,430);g.addColorStop(0,'#03050a');g.addColorStop(1,'#0a1120');c.fillStyle=g;c.fillRect(330,190,940,240);
  for(const s of STARS){c.fillStyle=`rgba(220,226,240,${.15+.35*s[2]})`;c.fillRect(s[0],s[1],1.6,1.6);}
  c.fillStyle='#03060c';c.fillRect(330,430,940,90);c.strokeStyle='rgba(120,140,170,.05)';c.lineWidth=1;for(let y=438;y<520;y+=9){c.beginPath();c.moveTo(330,y);c.lineTo(1270,y);c.stroke();}
  // the Spear of Destiny across the bay, dark
  c.fillStyle='#0e1016';c.beginPath();c.moveTo(1136,430);c.lineTo(1146,236);c.lineTo(1150,206);c.lineTo(1154,236);c.lineTo(1164,430);c.fill();
  c.fillStyle=`rgba(217,178,90,${.25+.15*Math.sin(t*.7)})`;c.beginPath();c.arc(1150,210,2.4,0,7);c.fill();
  for(const b of CITY){c.fillStyle='#070a10';c.fillRect(b.x,430-b.h,b.w,b.h);
    for(let i=0;i<b.win.length;i++)if(b.win[i]<S.cityLit){c.fillStyle='rgba(255,214,140,.55)';c.fillRect(b.x+3+(i%3)*((b.w-6)/3),430-b.h+4+((i/3)|0)*9,2.5,2.5);}}
}
function drawDome(t,cx,cy,R,Hh){
  const dl=domeLight(t);
  c.save();c.globalCompositeOperation='lighter';
  let g=c.createRadialGradient(cx,cy-Hh*.25,4,cx,cy-Hh*.3,R*1.1);g.addColorStop(0,`rgba(110,190,255,${.55*dl})`);g.addColorStop(.6,`rgba(60,120,230,${.18*dl})`);g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g;c.beginPath();c.ellipse(cx,cy,R,Hh,0,Math.PI,2*Math.PI);c.fill();
  if(S.domeOn>.02){const a=t*.4,r=R*.5,y0=cy-Hh*.52;c.strokeStyle=`rgba(127,216,255,${.55*S.domeOn})`;c.lineWidth=1.2;
    for(let i=-2;i<=2;i++){c.beginPath();c.ellipse(cx,y0+i*r*.36,r*Math.sqrt(1-Math.pow(i*.36,2)),r*.12,0,0,7);c.stroke();}
    for(let i=0;i<6;i++){const k=Math.cos(a+i*Math.PI/6);c.beginPath();c.ellipse(cx,y0,Math.abs(r*k),r,0,0,7);c.stroke();}
    c.fillStyle=`rgba(140,240,176,${.8*S.domeOn})`;c.beginPath();c.arc(cx+Math.cos(a*2.2)*r*1.25,y0+Math.sin(a*2.2)*r*.3,3,0,7);c.fill();}
  c.restore();
  // the glass
  c.fillStyle='rgba(160,195,230,.035)';c.beginPath();c.ellipse(cx,cy,R,Hh,0,Math.PI,2*Math.PI);c.fill();
  c.strokeStyle=`rgba(170,205,235,${.14+.25*Math.min(1,dl)})`;c.lineWidth=1.5;c.beginPath();c.ellipse(cx,cy,R,Hh,0,Math.PI,2*Math.PI);c.stroke();
  c.strokeStyle=`rgba(170,205,235,${.05+.1*Math.min(1,dl)})`;c.lineWidth=1;
  for(const k of[.35,.65,.88]){const y=cy-Hh*k,w=R*Math.sqrt(1-k*k);c.beginPath();c.ellipse(cx,y,w,w*.14,0,0,Math.PI);c.stroke();}
  c.strokeStyle='rgba(255,255,255,.09)';c.lineWidth=3;c.beginPath();c.ellipse(cx,cy,R*.86,Hh*.9,0,Math.PI*1.18,Math.PI*1.42);c.stroke();
  c.strokeStyle=`rgba(127,227,255,${.12+.5*S.domeOn+.3*S.domeF})`;c.lineWidth=2;c.beginPath();c.ellipse(cx,cy,R,R*.17,0,0,7);c.stroke();
}
function drawDeck(t,px){
  // the room, in its own colours; light is multiplied over it afterwards
  poly([[0,0],[1600,0],[1340,150],[260,150]],'#24262d');
  poly([[0,0],[260,150],[260,560],[0,900]],'#33363e');poly([[1600,0],[1340,150],[1340,560],[1600,900]],'#33363e');
  poly([[0,900],[260,560],[1340,560],[1600,900]],'#2b2e35');c.fillStyle='#30333b';c.fillRect(260,150,1080,410);
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2;for(let i=-7;i<=7;i++){c.beginPath();c.moveTo(800+i*78,560);c.lineTo(800+i*240,900);c.stroke();}
  for(const y of[600,660,750,880]){c.beginPath();c.moveTo(0,y);c.lineTo(1600,y);c.stroke();}
  // consoles down both side walls, dead
  for(const[f,u]of[[lw,.18],[lw,.42],[lw,.64],[rw,.18],[rw,.42],[rw,.64]]){const a=f(u,0),b=f(u+.16,0),d=f(u+.16,.16),e=f(u,.16);poly([a,b,d,e],'#1d1f25');
    const s1=f(u+.02,.2),s2=f(u+.14,.2),s3=f(u+.14,.32),s4=f(u+.02,.32);poly([s1,s2,s3,s4],'#16181d');}
  // the holo table
  c.fillStyle='#262931';c.beginPath();c.moveTo(615,650);c.lineTo(650,770);c.lineTo(950,770);c.lineTo(985,650);c.fill();
  c.fillStyle='#1b1d23';c.beginPath();c.ellipse(800,770,150,24,0,0,Math.PI);c.fill();c.fillStyle='#3a3d46';c.beginPath();c.ellipse(800,650,185,31,0,0,7);c.fill();
  // Michael's terminal desk and chair (left foreground)
  c.fillStyle='#2a2d34';c.beginPath();c.moveTo(330,628);c.lineTo(560,628);c.lineTo(590,650);c.lineTo(350,650);c.fill();
  c.fillStyle='#17191e';c.fillRect(352,650,14,170);c.fillRect(568,650,14,160);c.fillRect(352,650,230,22);
  c.fillStyle='#1d1f25';c.fillRect(250,703,84,10);c.fillRect(250,560,10,150);c.fillRect(285,713,8,96);c.fillRect(256,806,66,6);
  c.fillStyle='#22252c';c.fillRect(468,512,12,118);c.fillRect(460,624,30,6);
  // light: a dim base, the red emergency light, the dome, the terminal, a little night through the glass
  const rl=redLevel(t),dl=domeLight(t),tl=S.term*S.termF*(1-S.lightsOut);
  lb.globalCompositeOperation='source-over';lb.fillStyle='rgb(9,9,11)';lb.fillRect(0,0,800,450);lb.globalCompositeOperation='lighter';
  const glow=(x,y,r,col,a)=>{if(a<=.003)return;const g=lb.createRadialGradient(x/2,y/2,0,x/2,y/2,r/2);g.addColorStop(0,col.replace('A',a));g.addColorStop(1,col.replace('A',0));lb.fillStyle=g;lb.fillRect(0,0,800,450);};
  glow(800,150,1100,'rgba(255,40,28,A)',.62*rl*(1-S.lightsOut));glow(800,150,380,'rgba(255,70,50,A)',.5*rl*(1-S.lightsOut));
  glow(800,600,560,'rgba(70,150,255,A)',.6*Math.min(1.2,dl));glow(470,580,300,'rgba(130,210,220,A)',.55*tl);glow(800,330,800,'rgba(40,60,110,A)',.22*(1-S.lightsOut*.7));
  c.save();c.globalCompositeOperation='multiply';c.drawImage(LB,0,0,1600,900);c.restore();
  // what isn't lit by the room: the bay through the glass, the mullions, the light fixtures
  c.save();c.beginPath();c.rect(330,190,940,330);c.clip();drawBay(t);c.fillStyle=`rgba(255,40,30,${.05*rl})`;c.fillRect(330,190,940,330);
  c.strokeStyle='rgba(255,255,255,.035)';c.lineWidth=40;c.beginPath();c.moveTo(420,520);c.lineTo(640,190);c.moveTo(980,520);c.lineTo(1160,190);c.stroke();c.restore();
  c.fillStyle='#050608';for(const x of[330,518,706,894,1082,1270])c.fillRect(x-6,186,12,338);c.fillRect(324,182,952,10);c.fillRect(324,518,952,10);
  c.fillStyle='#0d0e12';c.fillRect(770,150,60,14);
  c.save();c.globalCompositeOperation='lighter';
  if(rl>.01){const g=c.createRadialGradient(800,166,0,800,166,60);g.addColorStop(0,`rgba(255,70,50,${.9*rl})`);g.addColorStop(1,'rgba(255,20,10,0)');c.fillStyle=g;c.fillRect(740,120,120,100);c.fillStyle=`rgba(255,120,100,${rl})`;c.fillRect(784,162,32,5);}
  if(tl>.01){c.fillStyle=`rgba(140,220,230,${.7*tl})`;c.fillRect(466,516,3,108);const g=c.createRadialGradient(440,575,0,440,575,90);g.addColorStop(0,`rgba(120,200,215,${.25*tl})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(340,480,200,190);}
  c.restore();
  drawDome(t,800,650,165,150);
  drawMan(S.man,`rgba(${Math.round(150*rl+40*dl)},${Math.round(30*rl+110*dl)},${Math.round(25*rl+200*dl)},.6)`,px);
  // the face lit by the screen
  if(tl>.01&&S.man.sit>.5){c.save();c.globalCompositeOperation='lighter';const hx=S.man.x+(24+S.man.lean*10)*S.man.s,hy=S.man.y-244*S.man.s,g=c.createRadialGradient(hx+14,hy,0,hx+14,hy,30);
    g.addColorStop(0,`rgba(130,200,210,${.35*tl})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(hx-20,hy-34,70,68);c.restore();}
}
/* ---------- over his shoulder: the terminal ---------- */
function screenText(t){
  const lines=[];let left=S.scrTyped;for(const ln of S.screen){if(left<=0)break;lines.push({s:ln.s.slice(0,left),c:ln.c,full:left>=ln.s.length});left-=ln.s.length;}return lines;}
function drawOTS(t,px){
  const rl=redLevel(t),tl=S.term*S.termF;
  c.fillStyle='#08080a';c.fillRect(0,0,1600,900);
  let g=c.createRadialGradient(240,80,0,240,80,900);g.addColorStop(0,`rgba(150,22,16,${.55*rl})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,1600,900);
  g=c.createRadialGradient(1300,600,0,1300,600,700);g.addColorStop(0,`rgba(50,110,220,${.22*domeLight(t)})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,1600,900);
  // desk edge
  c.fillStyle='#121318';c.beginPath();c.moveTo(0,760);c.lineTo(1600,700);c.lineTo(1600,900);c.lineTo(0,900);c.fill();
  // the monitor
  const Q=[[560,170],[1300,140],[1300,660],[560,630]];poly(Q,'#141519');
  const I=[[590,198],[1270,170],[1270,632],[590,604]];poly(I,`rgba(4,10,12,1)`);
  c.save();c.beginPath();c.moveTo(I[0][0],I[0][1]);for(const p of I.slice(1))c.lineTo(p[0],p[1]);c.closePath();c.clip();
  const fl=tl*(S.termF<1?1:.92+.08*Math.random());
  g=c.createRadialGradient(930,400,0,930,400,520);g.addColorStop(0,`rgba(40,90,100,${.35*fl})`);g.addColorStop(1,`rgba(10,30,34,${.25*fl})`);c.fillStyle=g;c.fillRect(560,140,760,520);
  c.transform(1,-.041,0,1,0,24);   // the screen leans back a little
  c.font='600 22px "JetBrains Mono",ui-monospace,monospace';c.textBaseline='top';c.fillStyle=`rgba(159,200,204,${.9*fl})`;
  c.fillText('VIGIL // SHIP INTELLIGENCE',620,212);c.fillStyle=`rgba(159,200,204,${.45*fl})`;c.fillText('ELYRA · KEEPER COMMAND NET',620,242);c.fillRect(620,276,620,1.5);
  c.font='500 24px "JetBrains Mono",ui-monospace,monospace';
  let y=300;const ls=screenText(t);for(const ln of ls.slice(-8)){c.fillStyle=(ln.c||'rgba(200,230,232,A)').replace('A',.92*fl);c.fillText(ln.s+(!ln.full||ln===ls[ls.length-1]?(Math.sin(t*7)>0?'▌':''):''),620,y);y+=36;}
  if(S.coords){c.font='600 40px "JetBrains Mono",ui-monospace,monospace';c.fillStyle=`rgba(232,70,60,${(.75+.25*Math.sin(t*5))*fl})`;c.fillText('N 36.7731°  E 14.9827°',640,y+14);}
  c.globalAlpha=.25*fl;c.fillStyle='#000';for(let yy=150;yy<700;yy+=4)c.fillRect(560,yy,760,1.6);c.globalAlpha=1;
  c.restore();
  // a little screen light on the dark
  c.save();c.globalCompositeOperation='lighter';g=c.createRadialGradient(930,400,0,930,400,800);g.addColorStop(0,`rgba(60,120,130,${.12*tl})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,1600,900);c.restore();
  // Michael's head and shoulder, close, in the foreground
  const ln=S.man.lean,hx=330+ln*70,hy=500-ln*14,k=1+ln*.08;
  c.save();c.fillStyle='#040405';
  for(let pass=0;pass<2;pass++){c.shadowColor=`rgba(110,190,200,${.4*tl+.15})`;c.shadowBlur=pass?0:16*px;
    c.beginPath();c.moveTo(-40,900);c.bezierCurveTo(-20,700,120,640,250+ln*40,650);c.bezierCurveTo(380+ln*50,640,470+ln*60,700,520+ln*60,900);c.fill();
    c.beginPath();c.ellipse(hx,hy,100*k,128*k,.12,0,7);c.fill();c.beginPath();c.ellipse(hx+10*k,hy+96*k,52*k,60*k,0,0,7);c.fill();
    c.beginPath();c.ellipse(230+ln*40,690,120,52,-.2,0,7);c.fill();}
  c.restore();
  c.strokeStyle='rgba(190,180,165,.16)';c.lineWidth=2;c.beginPath();c.moveTo(170+ln*40,668);c.lineTo(214+ln*40,690);c.moveTo(196+ln*40,662);c.lineTo(232+ln*40,680);c.stroke();
}

/* ---------- the camera outside: Tide City Command, abandoned ---------- */
function drawCCTV(t,px){
  let g=c.createLinearGradient(0,0,0,560);g.addColorStop(0,'#0a0c0b');g.addColorStop(1,'#171a18');c.fillStyle=g;c.fillRect(0,0,1600,560);
  c.fillStyle='#1b1e1c';c.fillRect(0,560,1600,340);c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=2;for(let i=-8;i<=8;i++){c.beginPath();c.moveTo(800+i*60,560);c.lineTo(800+i*260,900);c.stroke();}
  // the facility
  poly([[280,330],[1000,330],[1000,600],[280,600]],'#272b29');poly([[1000,330],[1190,380],[1190,585],[1000,600]],'#1f2321');poly([[280,330],[1000,330],[1190,380],[470,380]],'#2d312f');
  c.fillStyle='#0d0f0e';for(let x=300;x<990;x+=58)c.fillRect(x,410,46,44);for(let x=1010;x<1180;x+=40)c.fillRect(x,430+(x-1010)*.12,30,36);
  c.fillRect(600,520,80,80);poly([[860,330],[960,330],[960,250],[880,250]],'#242826');c.strokeStyle='#2b2f2d';c.lineWidth=5;c.beginPath();c.moveTo(420,330);c.lineTo(420,180);c.stroke();
  c.beginPath();c.ellipse(420,200,36,14,-.4,0,7);c.stroke();
  // landing pad, a lamp post with no light, a barrier knocked over
  c.strokeStyle='rgba(120,130,120,.18)';c.lineWidth=3;c.beginPath();c.ellipse(1240,760,210,40,0,0,7);c.stroke();c.beginPath();c.moveTo(1210,745);c.lineTo(1210,775);c.moveTo(1270,745);c.lineTo(1270,775);c.moveTo(1210,760);c.lineTo(1270,760);c.stroke();
  c.strokeStyle='#2a2e2b';c.lineWidth=6;c.beginPath();c.moveTo(150,720);c.lineTo(150,470);c.lineTo(200,470);c.stroke();c.fillStyle='#232624';c.save();c.translate(560,770);c.rotate(.35);c.fillRect(-60,-12,120,24);c.restore();
  // the fence
  c.strokeStyle='#2a2d2b';c.lineWidth=4;for(let i=0;i<=22;i++){const x=60+i*68,y=690-i*2.6;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-70);c.stroke();}
  c.lineWidth=1.5;c.beginPath();c.moveTo(60,630);c.lineTo(1556,573);c.moveTo(60,660);c.lineTo(1556,603);c.stroke();
  // the thing that stands outside, for a moment
  if(S.figure>0){c.fillStyle='#000';c.save();c.translate(1330,640);c.beginPath();c.moveTo(-14,0);c.lineTo(-10,-170);c.lineTo(-24,-240);c.lineTo(-18,-300);c.quadraticCurveTo(0,-352,18,-300);c.lineTo(24,-240);c.lineTo(10,-170);c.lineTo(14,0);c.fill();
    c.lineWidth=7;c.strokeStyle='#000';c.beginPath();c.moveTo(-20,-250);c.lineTo(-34,-110);c.moveTo(20,-250);c.lineTo(34,-110);c.stroke();c.restore();}
}
function cctvHud(t,y0,y1,x0,x1){
  c.font=`500 ${Math.max(10,Math.round(12*SC*1.3))}px "JetBrains Mono",ui-monospace,monospace`;c.textBaseline='top';const pad=14;
  c.fillStyle='rgba(220,230,220,.75)';c.fillText('CAM 04 · TIDE CITY COMMAND · EXTERIOR',x0+pad,y0+pad);
  const s=Math.floor(S.cctvT)%60;c.fillText('11.03.2260  03:14:'+String(22+s).padStart(2,'0').slice(-2),x0+pad,y1-pad-16);
  if(Math.sin(t*4)>0){c.fillStyle='rgba(232,70,60,.9)';c.fillText('● REC',x1-pad-56,y0+pad);}
}
/* ---------- the Hollow ---------- */
const RIB=Array.from({length:12},(_,i)=>{const r=rng(300+i);return Array.from({length:40},()=>r());});
function drawCave(t,px){
  c.fillStyle='#020306';c.fillRect(-400,-200,2400,1300);
  const cx=760,cy=440;
  // a tunnel of ribs, far to near: each one a ring of rock that swells and settles, as if the cave were breathing
  const ring=(i,scale,phase)=>{const k=.09*Math.pow(1.32,i)*scale,b=1+.025*Math.sin(t*1.05-i*.55+phase)*S.breath,n=RIB[i],pts=[];
    for(let j=0;j<40;j++){const a=j/40*Math.PI*2,w=1+.08*Math.sin(a*5+n[0]*6)+.05*(n[j]-.5);pts.push([cx+Math.cos(a)*860*k*b*w,cy+70*k+Math.sin(a)*(Math.sin(a)>0?330:620)*k*b*w]);}return pts;};
  const path=pts=>{c.moveTo(pts[0][0],pts[0][1]);for(let j=1;j<=pts.length;j++){const p=pts[j%pts.length],q=pts[(j-1)%pts.length];c.quadraticCurveTo(q[0],q[1],(p[0]+q[0])/2,(p[1]+q[1])/2);}c.closePath();};
  let g=c.createRadialGradient(cx,cy+30,0,cx,cy+30,260);g.addColorStop(0,'#141c34');g.addColorStop(1,'#04050a');c.fillStyle=g;c.beginPath();path(ring(0,1,0));c.fill();
  for(let i=1;i<12;i++){const o=ring(i,1,0),inn=ring(i-1,1.12,.3),sh=1-i/12;
    c.beginPath();path(o);path(inn);g=c.createRadialGradient(cx,cy,60*Math.pow(1.32,i),cx,cy,90*Math.pow(1.32,i));
    g.addColorStop(0,`rgb(${18+20*sh},${20+22*sh},${30+34*sh})`);g.addColorStop(1,`rgb(${10+8*sh},${10+9*sh},${15+14*sh})`);c.fillStyle=g;c.fill('evenodd');
    c.strokeStyle=`rgba(${70+60*sh},${90+70*sh},${140+80*sh},${.12+.25*sh})`;c.lineWidth=2.5*Math.pow(1.2,i);c.beginPath();path(inn);c.stroke();
    // wet glints along the floor of each rib
    c.strokeStyle=`rgba(150,180,230,${.05+.08*sh})`;c.lineWidth=1.5*Math.pow(1.2,i);c.beginPath();const fp=inn.slice(6,15);c.moveTo(fp[0][0],fp[0][1]);for(const p of fp)c.lineTo(p[0],p[1]);c.stroke();}
  // the names, carved into the rib beside him: hundreds of them, too small to read from here
  c.save();c.beginPath();path(ring(9,1,0));path(ring(7,1.08,.3));c.clip('evenodd');c.beginPath();c.rect(1020,0,700,900);c.clip();
  c.translate(1030,120);c.rotate(-.08);c.font='600 11px "Chakra Petch",sans-serif';c.fillStyle='rgba(4,4,6,.75)';
  for(let r=0;r<34;r++)for(let col=0;col<7;col++){const nm=NAMES[(r*7+col)%NAMES.length];c.fillText(nm.n,col*92+(r%2)*30,r*21);}c.restore();
  // darkness, with the torch and the blue cut out of it
  mx.globalCompositeOperation='source-over';mx.clearRect(0,0,800,450);mx.fillStyle=`rgba(0,0,0,${S.dark})`;mx.fillRect(0,0,800,450);mx.globalCompositeOperation='destination-out';
  const camOff=(x,y)=>[x/2,y/2];
  if(S.blue>.01){const[a,b]=camOff(cx,cy),gg=mx.createRadialGradient(a,b,0,a,b,380);gg.addColorStop(0,`rgba(0,0,0,${.85*S.blue})`);gg.addColorStop(.5,`rgba(0,0,0,${.35*S.blue})`);gg.addColorStop(1,'rgba(0,0,0,0)');mx.fillStyle=gg;mx.fillRect(0,0,800,450);}
  // where the torch is (Michael's hand) and where it points
  const hand=handOf(S.man);S.hand=hand;
  const wa=Math.atan2(Math.sin(S.man.aim||0),Math.cos(S.man.aim||0)*S.man.face),bo=S.beam*(S.beamF==null?1:S.beamF);
  if(bo>.01){const[a,b]=camOff(hand[0],hand[1]),L=700,sp=.24;mx.beginPath();mx.moveTo(a,b);mx.lineTo(a+Math.cos(wa-sp)*L,b+Math.sin(wa-sp)*L);mx.lineTo(a+Math.cos(wa+sp)*L,b+Math.sin(wa+sp)*L);mx.closePath();
    const gg=mx.createRadialGradient(a,b,0,a,b,L);gg.addColorStop(0,`rgba(0,0,0,${bo})`);gg.addColorStop(.45,`rgba(0,0,0,${.6*bo})`);gg.addColorStop(1,'rgba(0,0,0,0)');mx.fillStyle=gg;mx.fill();
    const g2=mx.createRadialGradient(a,b,0,a,b,40);g2.addColorStop(0,`rgba(0,0,0,${.8*bo})`);g2.addColorStop(1,'rgba(0,0,0,0)');mx.fillStyle=g2;mx.fillRect(a-40,b-40,80,80);}
  c.drawImage(MK,0,0,1600,900);
  c.save();c.globalCompositeOperation='lighter';
  if(S.blue>.01){g=c.createRadialGradient(cx,cy,0,cx,cy,520);g.addColorStop(0,`rgba(50,100,220,${.3*S.blue})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(-400,-200,2400,1300);}
  if(bo>.01){c.beginPath();c.moveTo(hand[0],hand[1]);const L=1400,sp=.2;c.lineTo(hand[0]+Math.cos(wa-sp)*L,hand[1]+Math.sin(wa-sp)*L);c.lineTo(hand[0]+Math.cos(wa+sp)*L,hand[1]+Math.sin(wa+sp)*L);c.closePath();
    const gg=c.createRadialGradient(hand[0],hand[1],0,hand[0],hand[1],L);gg.addColorStop(0,`rgba(255,238,205,${.07*bo})`);gg.addColorStop(.5,`rgba(255,238,205,${.02*bo})`);gg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gg;c.fill();}
  c.restore();
  // what lives in it: a shape that blots out the blue, and two enormous points of light
  if(S.eyes>.01){const E=S.eye,k=E.k;const bg=c.createRadialGradient(E.x,E.y+120*k,40*k,E.x,E.y+120*k,420*k);bg.addColorStop(0,`rgba(0,0,0,${.95*S.eyes})`);bg.addColorStop(.55,`rgba(0,0,0,${.85*S.eyes})`);bg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=bg;c.beginPath();c.ellipse(E.x,E.y+40*k,250*k,180*k,0,0,7);c.ellipse(E.x,E.y+260*k,440*k,260*k,0,0,7);c.fill();
    c.save();c.globalCompositeOperation='lighter';for(const sx of[-1,1]){const x=E.x+sx*E.gap*k*.5,y=E.y;g=c.createRadialGradient(x,y,0,x,y,70*k);g.addColorStop(0,`rgba(215,232,255,${.9*S.eyes})`);g.addColorStop(.12,`rgba(150,190,255,${.45*S.eyes})`);g.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=g;c.fillRect(x-80*k,y-80*k,160*k,160*k);}c.restore();}
  drawMan(S.man,'rgba(70,120,220,.6)',px);
}
function handOf(m){const ca=Math.cos(m.aim||0),sa=Math.sin(m.aim||0),sh=[6+m.lean*14,-250];return[m.x+(sh[0]+ca*118)*m.s*m.face,m.y+(sh[1]+6+sa*118)*m.s];}
/* ---------- the names, close: the torch on the rock ---------- */
function drawWall(t){
  c.drawImage(rock(),0,0);
  for(const n of NAMES){c.font='600 23px "Chakra Petch",sans-serif';c.textAlign='center';
    c.fillStyle='rgba(255,255,255,.12)';c.fillText(n.n,n.x+1.5,n.y+1.5);c.fillStyle='rgba(8,8,10,.92)';c.fillText(n.n,n.x,n.y);
    c.font='500 15px "JetBrains Mono",monospace';c.fillStyle='rgba(255,255,255,.1)';c.fillText(n.d,n.x+1,n.y+27);c.fillStyle='rgba(8,8,10,.85)';c.fillText(n.d,n.x,n.y+26);}
  c.textAlign='left';
  // the torch: a warm pool, the rest black
  const p=S.spot;let g=c.createRadialGradient(p.x,p.y,p.r*.15,p.x,p.y,p.r);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.75,'rgba(0,0,0,.82)');g.addColorStop(1,'rgba(0,0,0,.985)');
  c.fillStyle=g;c.fillRect(-1000,-1000,3600,2900);
  c.save();c.globalCompositeOperation='lighter';g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);g.addColorStop(0,`rgba(255,226,180,${.16*(1-S.wallDim)})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);c.restore();
  if(S.wallDim>0){c.fillStyle=`rgba(0,0,0,${S.wallDim})`;c.fillRect(-1000,-1000,3600,2900);}
}
/* ---------- the flash on the dome: something inside the Hollow, enormous ---------- */
function drawHollow(t){
  c.fillStyle='#06030b';c.fillRect(0,0,1600,900);const cx=800,cy=430;
  for(let i=0;i<9;i++){const k=.16*Math.pow(1.35,i);c.strokeStyle=`rgba(${70-i*5},${40-i*3},${90-i*6},1)`;c.lineWidth=60*k;c.beginPath();c.ellipse(cx,cy+50*k,900*k,620*k,0,Math.PI*.95,Math.PI*2.05);c.stroke();}
  let g=c.createRadialGradient(cx,cy,40,cx,cy,520);g.addColorStop(0,'rgba(140,110,180,.35)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,1600,900);
  c.fillStyle='#000';c.beginPath();c.ellipse(cx,cy+30,430,360,-.12,0,7);c.fill();c.beginPath();c.ellipse(cx-120,cy+420,720,240,0,Math.PI,2*Math.PI);c.fill();
  c.strokeStyle='rgba(170,150,200,.35)';c.lineWidth=3;c.beginPath();c.ellipse(cx,cy+30,430,360,-.12,3.6,5.9);c.stroke();
  c.strokeStyle='rgba(232,70,60,.85)';c.lineWidth=7;c.beginPath();c.moveTo(cx-300,cy+70);for(let i=1;i<=20;i++){const u=i/20;c.lineTo(cx-300+u*600,cy+70-u*70+Math.sin(u*30)*6*(1-Math.abs(u-.5)*2));}c.stroke();
}

/* ---------- the frame: camera, shot, letterbox, grain, glitches ---------- */
let raf=0,last=0;
function frame(nowT){if(!S){raf=0;return;}raf=requestAnimationFrame(frame);const dt=Math.min(.05,(nowT-(last||nowT))/1000);last=nowT;S.t+=dt;stepTw(dt);if(S.shot==='cctv')S.cctvT+=dt;
  const t=S.t;c.setTransform(1,0,0,1,0,0);c.fillStyle='#000';c.fillRect(0,0,cv.width,cv.height);
  const cam=S.flash>0?{x:800,y:450,z:1}:S.cam,k=SC*cam.z,hv=W/k/2,vv=H/k/2;
  const cxm=hv<800?Math.min(1600-hv,Math.max(hv,cam.x)):800,cym=vv<450?Math.min(900-vv,Math.max(vv,cam.y)):450;
  c.setTransform(DPR*k,0,0,DPR*k,DPR*(W/2-cxm*k),DPR*(H/2-cym*k));const px=DPR*k;
  if(S.flash>0)drawHollow(t);
  else if(S.shot==='deck')drawDeck(t,px);else if(S.shot==='ots')drawOTS(t,px);else if(S.shot==='cctv')drawCCTV(t,px);
  else if(S.shot==='cave')drawCave(t,px);else if(S.shot==='wall')drawWall(t);
  c.setTransform(1,0,0,1,0,0);
  // the band the scene lives in, and black bars outside it
  const bandH=Math.min(H,VH*SC),y0=(H-bandH)/2,bar=bandH*.06;const Y0=(y0+bar)*DPR,Y1=(y0+bandH-bar)*DPR;
  if(!grainPat)grainPat=c.createPattern(GR,'repeat');
  if(S.shot!=='black'||S.flash>0){c.save();c.globalAlpha=S.shot==='cctv'?.16:.07;c.translate(Math.random()*192,Math.random()*192);c.fillStyle=grainPat;c.fillRect(-192,-192,cv.width+192,cv.height+192);c.restore();
    if(S.shot==='cctv'&&!S.flash){c.fillStyle='rgba(110,150,120,.07)';c.fillRect(0,0,cv.width,cv.height);
      const ry=((t*90)%(H+200)-100)*DPR;const g=c.createLinearGradient(0,ry-60*DPR,0,ry+60*DPR);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.05)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,ry-60*DPR,cv.width,120*DPR);
      c.save();c.scale(DPR,DPR);cctvHud(t,y0+bar,y0+bandH-bar,Math.max(0,(W-Math.min(W,VW*SC))/2),W-Math.max(0,(W-Math.min(W,VW*SC))/2));c.restore();}
    // vignette
    const vg=c.createRadialGradient(cv.width/2,cv.height/2,cv.height*.25,cv.width/2,cv.height/2,Math.max(cv.width,cv.height)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.7)');c.fillStyle=vg;c.fillRect(0,0,cv.width,cv.height);}
  if((S.glitch>0||S.flash>0)&&!still){const n=S.flash>0?7:4;for(let i=0;i<n;i++){const y=Math.random()*cv.height,h=(8+Math.random()*60)*DPR,dx=(Math.random()-.5)*90*DPR;c.drawImage(cv,0,y,cv.width,h,dx,y,cv.width,h);}
    c.fillStyle=`rgba(232,70,60,${.08+Math.random()*.1})`;c.fillRect(0,Math.random()*cv.height,cv.width,(2+Math.random()*14)*DPR);}
  c.fillStyle='#000';c.fillRect(0,0,cv.width,Y0);c.fillRect(0,Y1,cv.width,cv.height-Y1);
  if(S.black>0){c.fillStyle=`rgba(0,0,0,${S.black})`;c.fillRect(0,0,cv.width,cv.height);}
}

/* =====================================================================================================================
   THE SCRIPTS
   ===================================================================================================================== */
const ABORT={};let R=null;
const chk=()=>{if(!R||R.dead)throw ABORT;};
async function w(s){await Promise.race([new Promise(r=>setTimeout(r,s*1000)),R.skipP]);chk();}
function sub(who,text,cls){if(!who){subEl.classList.remove('on');return;}subEl.className='csub on'+(cls?' '+cls:'');subEl.querySelector('b').textContent=who;subEl.querySelector('span').textContent=text;}
// one line: the subtitle shows while it is spoken, then a beat
async function say(who,text,tone,after){chk();const cls=who==='ELYRA'?(tone==='human'?'x':''):'m';sub(who==='ELYRA'&&tone==='human'?'ELYRA ·· signal degraded':who,text,cls);
  if(who==='ELYRA'&&tone==='human')AU.fx.crackle(Math.min(3,text.length/12));
  await Promise.race([V.say(who,text,tone),R.skipP]);chk();sub(null);if(after)await w(after);}
const M=(text,tone,after)=>say('Lt. Michael',text,tone,after==null?.5:after);
const E=(text,tone,after)=>say('ELYRA',text,tone,after==null?.5:after);
// ELYRA writes to the terminal as she speaks
function scr(s,col){S.screen.push({s,c:col});}
let typer=0;function typeOn(){clearInterval(typer);typer=setInterval(()=>{if(!S)return clearInterval(typer);const tot=S.screen.reduce((a,l)=>a+l.s.length,0);if(S.scrTyped<tot){S.scrTyped+=2;if(S.scrTyped%6===0)AU.fx.type();}},34);}
async function title(html,cls,hold){titleEl.className='ctitle'+(cls?' '+cls:'');titleEl.innerHTML=html;await w(.05);titleEl.classList.add('on');await w(hold);titleEl.classList.remove('on');await w(1.7);}
// the red emergency light stuttering on (or the whole room's power failing)
async function redOn(){AU.fx.relay();for(const[v,d]of[[.8,.09],[0,.16],[.5,.07],[0,.32],[1,.06],[.3,.05],[1,0]]){S.red=v;S.redF=1;if(d)await w(d);}S.red=1;}

/* ---------- 1 · THE CALL ---------- */
async function T1(){
  const m=S.man;S.shot='black';S.black=1;S.dome=.35;S.term=.85;S.cityLit=.05;
  await w(3.2);AU.humOn(.09,3);await w(3.4);
  S.shot='deck';S.black=0;S.cam={x:560,y:500,z:1};await redOn();await w(.4);
  S.cam={x:520,y:520,z:1.05};tw(S.cam,'z',1.18,16,true);tw(S.cam,'x',470,16,true);
  await w(2.6);
  await M('ELYRA.','tired',2.6);
  await M('Come online.','tired',.6);
  // the terminal stutters awake
  AU.fx.boot();for(const v of[.2,1,.4,1.2,1])S.termF=v,await w(.08);S.termF=1;
  S.shot='ots';S.cam={x:820,y:450,z:1};scr('> ELYRA');scr('BOOT ............ OK');typeOn();await w(1.4);
  scr('SYSTEMS OPERATIONAL','rgba(140,240,176,A)');await E('Systems are operational.',null,1.4);
  S.shot='deck';S.cam={x:600,y:540,z:1.25};tw(m,'head',4,1.4);tw(S.cam,'x',680,6,true);await w(1.2);
  await M('Where are we?','tired',1.4);
  S.shot='ots';S.cam={x:820,y:450,z:1};scr('> QUERY: POSITION');await w(.9);scr('LOCATION ........ UNAVAILABLE','rgba(232,200,120,A)');await E('Location unavailable.',null,.9);
  tw(m,'lean',1,1.6);await w(.8);
  await M('That’s not what I asked.',null,1.5);
  await M('Where is the Hollow?',null,.4);
  // the room goes quieter
  AU.humOn(.035,2.5);await w(2.8);
  scr('> QUERY: "HOLLOW"');await w(.8);scr('PLEASE CLARIFY');await E('Please clarify.',null,.8);
  S.shot='deck';S.cam={x:420,y:560,z:1.6};m.head=0;
  await M('The cave.','sharp',2.2);
  await M('Where we found it.',null,.4);
  S.shot='ots';S.cam={x:820,y:450,z:1};scr('SEARCHING ░░░░░░░░░░');AU.fx.process(3);
  for(let i=1;i<=10;i++){S.screen[S.screen.length-1].s='SEARCHING '+'▓'.repeat(i)+'░'.repeat(10-i);await w(.32);}
  scr('NO MATCH · "HOLLOW CAVE"','rgba(232,70,60,A)');
  await E('I cannot identify a location designated “Hollow Cave.”',null,1.2);
  S.shot='deck';S.cam={x:440,y:540,z:1.9};tw(S.cam,'z',2.1,9,true);
  await M('You’ve been there.',null,1.8);
  await M('You took us there.',null,.4);
  S.shot='ots';S.cam={x:820,y:450,z:1};scr('TRANSPORT LOG ··· 0 RECORDS');await w(.6);
  await E('I have no record of transporting personnel to that location.',null,1.4);
  // he looks at the dome
  S.shot='deck';S.cam={x:800,y:580,z:2.6};tw(S.cam,'z',2.9,6,true);m.lean=0;await w(1.6);
  await M('Then who did?','tired',.3);
  AU.fx.pulse();for(const v of[1.2,0,.8,0,1.4,0])S.domeF=v,await w(.07);S.domeF=0;await w(.9);
  // he stands
  S.cam={x:520,y:520,z:1.05};tw(S.cam,'z',1,3);tw(m,'sit',0,1.6);await w(1.7);
  await M('ELYRA.','sharp',2.4);
  // and walks to the dome; the light under the glass gets stronger the closer he gets
  tw(m,'x',600,4.4,true);tw(m,'y',800,4.4,true);tw(m,'s',.93,4.4,true);tw(S,'dome',.9,4.4,true);tw(S.cam,'x',640,4.4,true);
  const walk=setInterval(()=>{if(!S)return clearInterval(walk);m.step+=.42;if(Math.abs(Math.sin(m.step))<.2)AU.fx.footstep();},60);
  await w(2.2);await M('Give me the coordinates.',null,0);
  await w(.2);clearInterval(walk);tw(m,'step',Math.round(m.step/Math.PI)*Math.PI,.3);
  await E('Michael—',null,1.8);
  S.cam={x:690,y:570,z:1.7};
  await M('Give me the coordinates.','sharp',.3);
  await E('I cannot.',null,.5);
  await M('Why?',null,0);
  AU.humOff(1.5);await w(3.6);
  await E('Because you are already there.','soft',.2);
  await w(1.6);
  // lights out, then the dome wakes
  AU.fx.lightsOff();S.lightsOut=1;S.red=0;S.term=0;S.dome=0;await w(.9);
  AU.fx.surge();tw(S,'domeOn',1,.5);tw(S,'domeF',1,.5);S.cam={x:800,y:560,z:2.2};await w(.7);
  AU.fx.glitch();S.flash=1;await w(still?.6:.32);S.flash=0;
  S.shot='black';S.black=1;sub(null);await w(2.6);
  AU.fx.boom();await title('ELYRA: THE HOLLOW',null,4.2);
}

/* ---------- 2 · THE RETURN ---------- */
async function T2(){
  const m=S.man;S.shot='black';S.black=1;S.dome=.7;S.domeOn=.9;S.term=1;S.cityLit=0;
  await w(3);AU.humOn(.09,3);await w(3.2);
  S.shot='deck';S.black=0;S.cam={x:560,y:500,z:1};await redOn();await w(.4);
  tw(S.cam,'z',1.14,10,true);await w(2.4);
  S.shot='ots';S.cam={x:820,y:450,z:1};scr('> NAV · LAST KNOWN');scr('COORDINATES');S.scrTyped=999;S.coords=true;typeOn();await w(2.2);
  await M('That’s not possible.',null,.9);
  scr('> PLEASE SPECIFY');await E('Please specify.',null,.6);
  await M('These coordinates.',null,1.6);
  await M('They’re different.',null,.6);
  scr('NEGATIVE');await E('Negative.',null,1);
  S.shot='deck';S.cam={x:620,y:540,z:1.3};tw(m,'head',4,1.2);await w(1);
  await M('No.','tired',1);
  tw(m,'head',0,.8);tw(m,'lean',1,1.4);S.shot='ots';S.cam={x:820,y:450,z:1};await w(1);
  await M('They weren’t there before.',null,.6);
  scr('UNCHANGED · 0 REVISIONS');await E('Those coordinates have remained unchanged.',null,1.4);
  await M('How long?',null,2.2);
  scr('LAST REVISION · 11.03.2237 · 23 YRS','rgba(232,200,120,A)');await E('Twenty-three years.',null,1.2);
  // he stands and turns away from the desk
  S.shot='deck';S.cam={x:520,y:520,z:1.15};m.lean=0;tw(m,'sit',0,1.6);await w(1.2);tw(m,'face',-1,2.2);await w(2.2);
  await M('That’s impossible.',null,.5);
  scr('STATEMENT LOGGED');await E('Your statement has been logged.',null,1);
  tw(m,'face',1,1.4);await w(1.4);
  await M('I was there yesterday.',null,1.8);
  await E('Negative.',null,.5);
  await M('What?','sharp',.4);
  S.shot='ots';S.cam={x:820,y:450,z:1};scr('PERSONNEL · M. VEYR · ON SITE');await E('You have not left the facility.',null,1.2);
  await M('Open the camera.',null,.4);
  // the camera outside: nothing, nobody, no lights
  AU.fx.stat(.25);S.shot='cctv';S.cam={x:800,y:450,z:1};tw(S.cam,'z',1.06,20,true);await w(3.6);
  await M('How long has the facility been empty?','tired',3);
  await E('Since the incident.',null,.4);
  await M('What incident?',null,2.4);
  await M('Elyra.',null,1.6);
  await M('What incident?','sharp',.6);
  AU.fx.thump();S.glitch=1;AU.fx.glitch();await w(.35);S.glitch=0;S.figure=1;await w(still?.4:.2);S.figure=0;S.glitch=1;await w(.25);S.glitch=0;
  await w(.5);
  await M('...What the hell was that?','whisper',1.4);
  S.shot='ots';scr('> MICHAEL.','rgba(232,70,60,A)');await w(.4);
  await E('Michael.',null,1);
  await E('Do not open the Hollow.','soft',1.4);
  S.shot='deck';S.cam={x:600,y:560,z:1.9};
  await M('I never opened it.','whisper',.2);
  S.shot='black';S.black=1;AU.humOff(.05);sub(null);await w(2.2);
  await title('ACCESS RECORD: MICHAEL — 17 ENTRIES','rec',4.4);
}

/* ---------- 3 · THE HOLLOW ---------- */
async function T3(){
  const m=S.man;S.shot='black';S.black=1;Object.assign(m,{x:560,y:870,s:1.1,sit:0,face:1,aim:.12});S.beam=0;S.blue=0;S.dark=.97;
  await w(1.6);AU.breathe(true,1);await w(3);
  await M('Elyra...','whisper',.2);AU.fx.stat(.6);await w(1.2);
  await M('Are you there?','whisper',2.4);
  await M('Please.','whisper',2.2);
  // a faint blue light: he isn't in the office. He's in the Hollow
  S.shot='cave';S.cam={x:760,y:470,z:1};tw(S,'black',0,3.2);tw(S,'blue',.55,5);await w(1.6);
  AU.fx.relay();S.beam=1;
  const sweep=setInterval(()=>{if(!S)return clearInterval(sweep);if(R&&!R.hold)m.aim=.12+Math.sin(S.t*.7)*.16;},40);
  await w(3);
  await M('I found it.','whisper',.2);AU.fx.stat(.3);await w(.6);
  await M('I found the entrance.','whisper',1.2);
  R.hold=true;tw(m,'aim',.1,.6);
  await E('Michael.','human',.2);
  AU.breathe(false);await w(.8);
  await M('How did you know my name?','whisper',2);
  // he looks behind him: nothing
  tw(m,'face',-1,.7);await w(1.6);tw(m,'face',1,.7);await w(.9);
  await M('Elyra?','whisper',.4);
  await E('You shouldn’t have come back.','human',.8);
  tw(m,'aim',-.42,1.6);await w(1.4);
  await M('Back?','whisper',.6);
  // the torch catches something carved in the rock
  S.shot='wall';S.cam={x:ME.x-480,y:ME.y-150,z:2.7};Object.assign(S.spot,{x:ME.x-560,y:ME.y-170,r:70});await w(1.5);
  tw(S.spot,'x',ME.x-280,1.8);tw(S.cam,'x',ME.x-280,1.8);await w(2);
  tw(S.cam,'z',1.15,3.2);tw(S.spot,'r',300,3.2);tw(S.spot,'x',ME.x-200,3.2);tw(S.spot,'y',ME.y-60,3.2);tw(S.cam,'y',ME.y-60,3.2);tw(S.cam,'x',ME.x-200,3.2);AU.breathe(true,.95);await w(3.4);
  await M('No...','whisper',.6);
  tw(S.spot,'x',ME.x,2.6);tw(S.spot,'y',ME.y+10,2.6);tw(S.spot,'r',150,2.6);tw(S.cam,'x',ME.x,2.6);tw(S.cam,'y',ME.y+10,2.6);tw(S.cam,'z',2.4,2.6);await w(3.2);
  tw(S.cam,'z',2.8,5,true);await w(1.2);
  await M('That’s...','whisper',1.2);
  tw(S.cam,'z',2.2,.6);tw(S.spot,'r',190,.6);await w(.8);
  await M('That’s tomorrow.','whisper',2.2);
  AU.breathe(false);
  await E('Michael.','human',.1);
  // the cave behind him is no longer empty
  S.shot='cave';S.cam={x:760,y:470,z:1.05};m.aim=.1;tw(S,'eyes',1,2.6);await w(2.6);
  await M('What is that?','whisper',1.8);
  await M('Elyra.','whisper',1.4);
  await M('Tell me what that is.','whisper',.8);
  await E('It is not the Hollow.','human',.6);
  await M('Then what is it?','whisper',3);
  await E('The Hollow is what it lives inside.','human',.8);
  // the torch flickers; it moves, away from him, as if something behind him has frightened it
  const fl=setInterval(()=>{if(!S)return clearInterval(fl);S.beamF=Math.random()<.35?Math.random()*.3:1;},70);await w(1.2);
  AU.fx.creature();tw(S.eye,'k',.45,3.2);tw(S.eye,'y',400,3.2);tw(S.eye,'x',840,3.2);tw(S,'eyes',0,3.4);await w(2);clearInterval(fl);S.beamF=1;
  tw(m,'face',-1,3.2,true);await w(3.4);
  S.shot='black';S.black=1;sub(null);await w(1.4);
  await M('...Oh my God.','whisper',2.6);
  await title('ELYRA: THE HOLLOW',null,4.2);
}

/* =====================================================================================================================
   STARTING IT · idle detection, the slow build on the menu, then the footage
   ===================================================================================================================== */
let idleT=0,limit=FORCE?4:300+Math.random()*300;
const bump=()=>{if(R){if(R.build)R.build.cancel();return;}idleT=0;};
for(const ev of['pointermove','pointerdown','keydown','wheel','touchstart','scroll'])addEventListener(ev,bump,{capture:true,passive:true});
setInterval(()=>{if(R||document.hidden)return;if(document.querySelector('#drawer:not([hidden]),#confirm:not([hidden])'))return;idleT+=1;if(idleT>=limit)play(tierNow());},1000);

// the build: the music bends, the view creeps, the background flickers once, then black. Any input stops it
function buildup(){return new Promise(res=>{
  const bg=document.getElementById('bg'),wrap=document.querySelector('.wrap'),els=[bg,wrap].filter(Boolean),t0=performance.now(),DUR=21;let flick=false,done=false,id=0;
  AU.distort(DUR);
  const restore=()=>{for(const e of els){e.style.transform='';e.style.opacity='';e.style.transition='';}};
  const end=ok=>{if(done)return;done=true;cancelAnimationFrame(id);restore();res(ok);};
  R.build={cancel:()=>{end(false);if(!silentSession)AU.music(mem.seen>=1?'b':'a');}};
  (function tick(){if(done)return;const s=(performance.now()-t0)/1000,u=Math.min(1,s/DUR);
    if(!still)for(const e of els){e.style.transformOrigin='50% 46%';e.style.transform=`translate(${-u*u*16}px,${u*u*7}px) scale(${1+u*u*.03})`;}
    if(!flick&&s>12.5){flick=true;if(bg){bg.style.opacity='.12';setTimeout(()=>{bg.style.opacity='';},still?250:80);}if(wrap&&!still){wrap.style.opacity='.55';setTimeout(()=>{wrap.style.opacity='';},60);}}
    if(s>=DUR)return end(true);id=requestAnimationFrame(tick);})();});}

async function play(tier){
  if(R)return;R={tier,dead:false};R.skipP=new Promise(r=>R.skipRes=r);
  if(tier!==3&&!(await buildup())){R=null;idleT=0;return;}
  R.build=null;
  for(const d of document.querySelectorAll('.drawer'))d.hidden=true;
  AU.stopMusic(tier===3?1.2:.05);V.hush();
  S=fresh();resize();root.hidden=false;root.classList.remove('cur');skipEl.hidden=true;sub(null);titleEl.className='ctitle';last=0;if(!raf)raf=requestAnimationFrame(frame);
  if(tier===3){S.black=0;tw(S,'black',1,.5);}
  mem.seen=Math.max(mem.seen,tier);mem.views=(mem.views||0)+1;store();
  try{await[T1,T2,T3][tier-1]();}catch(e){if(e!==ABORT)console.error(e);}
  finish(tier);
}
function skip(){if(!R||R.dead||R.build)return;R.dead=true;R.skipRes();V.hush();}
skipEl.addEventListener('click',e=>{e.stopPropagation();skip();});
root.addEventListener('pointerdown',()=>{if(R&&!R.build){skipEl.hidden=false;root.classList.add('cur');}});
addEventListener('keydown',e=>{if(!R||R.build||root.hidden)return;if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();skip();}else skipEl.hidden=false;});
addEventListener('keydown',e=>{if((e.key==='m'||e.key==='M')&&!e.metaKey&&!e.ctrlKey&&!e.altKey)AU.toggle();});

function finish(tier){
  if(R)R.dead=true;V.hush();AU.stopScene();clearInterval(typer);sub(null);
  root.style.transition='opacity .9s';root.style.opacity='0';
  setTimeout(()=>{root.hidden=true;root.style.opacity='';root.style.transition='';S=null;R=null;idleT=0;limit=FORCE?1e9:300+Math.random()*300;},950);
  after();
  if(tier===3){silentSession=true;AU.stopMusic(.05);
    // the menu again, no music at all. Then, quietly:
    setTimeout(()=>{const el=document.createElement('div');el.className='call-say';el.innerHTML='<b>ELYRA</b>Michael is not finished.';document.body.appendChild(el);
      requestAnimationFrame(()=>el.classList.add('on'));V.say('ELYRA','Michael is not finished.','soft').then(()=>{setTimeout(()=>{el.classList.remove('on');setTimeout(()=>el.remove(),2200);},1800);});},7000);}
  else AU.music('b');
}
// what the menu keeps: the red light, the access record, the changed music
function after(){
  if(mem.seen>=1&&!document.querySelector('.call-light')){const ctr=document.querySelector('.center');if(ctr){const l=document.createElement('span');l.className='call-light';l.setAttribute('aria-hidden','true');ctr.appendChild(l);}}
  if(mem.seen>=2){const foot=document.querySelector('.foot');let r=document.querySelector('.call-rec');if(foot&&!r){r=document.createElement('div');r.className='call-rec';const fail=foot.querySelector('.fail');foot.insertBefore(r,fail);}
    if(r)r.textContent='ACCESS RECORD: MICHAEL — '+(mem.seen>=3?18:17)+' ENTRIES';}
}
after();
AU.music(mem.seen>=1?'b':'a');
})();
