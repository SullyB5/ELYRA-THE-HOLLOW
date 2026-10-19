/* Tide City · audio: every sound is synthesized with WebAudio (no files to download), placed by distance from the camera,
   and the radio speaks through the browser's own voices. Hooks the shared fire/boom/missile calls, so it loads last.
   M (or the Sound button) mutes; the choice is remembered. */
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

  /* ---------- weapons ---------- */
  function shot(kind,from){
    if(!ctx||!on)return;
    if(kind==='player'){
      // your own guns are always close, so they skip distance falloff
      if(mode!=='pilot'||!limit('pl',85)){const P=place(from,500);if(P.g<.05||!limit('plx',140))return;tone({wave:'square',f0:1300,f1:420,dec:.07,vol:.05*P.g,lp:3200,pan:P.pan});return;}
      tone({wave:'square',f0:1500,f1:520,dec:.065,vol:.07,lp:3600});tone({wave:'sawtooth',f0:220,f1:90,dec:.05,vol:.035,lp:900});return;}
    const P=place(from,kind==='friend'?2400:kind==='enemy'?3400:kind==='flak'?900:kind==='fbolt'?700:380);
    if(P.g<.03)return;
    if(kind==='friend'){if(!limit('fr',70))return;   // sea cannon: a deep thump and a crack
      tone({wave:'sine',f0:95,f1:34,dec:.9,vol:.55*P.g,pan:P.pan});burst({f0:1800,f1:200,dec:.6,vol:.45*P.g,pan:P.pan});}
    else if(kind==='enemy'){if(!limit('en',60))return;   // alien heavy laser
      tone({wave:'sawtooth',f0:420,f1:70,dec:.45,vol:.16*P.g,lp:1800,pan:P.pan});tone({wave:'square',f0:160,f1:55,dec:.5,vol:.08*P.g,lp:600,pan:P.pan});}
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

  /* ---------- events ---------- */
  const api={
    shot,explosion,missile,
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
    radio(){if(!ctx||!on)return;burst({type:'bandpass',f0:1800,q:2,dec:.16,vol:.12});tone({wave:'square',f0:1200,f1:1200,dec:.06,vol:.02,delay:.17});},
    toggle(v){on=v==null?!on:v;try{localStorage.setItem('tideAudio',on?'on':'off');}catch(_){}
      if(master)master.gain.setTargetAtTime(on?.8:0,ctx.currentTime,.05);if(!on&&window.speechSynthesis)speechSynthesis.cancel();btn.textContent='Sound: '+(on?'on':'off');return on;},
    get on(){return on;},
    tick,
  };

  /* ---------- loops: your engine, the shield hum, the Spear's charge ---------- */
  let eng=null,engN=null,shieldHum=null,spearHum=null;
  function loopOsc(type,f,g0,lp){const o=ctx.createOscillator();o.type=type;o.frequency.value=f;const g=ctx.createGain();g.gain.value=g0;let tail=o;
    if(lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);tail=fl;}tail.connect(g);g.connect(bus);o.start();return{o,g};}
  function initLoops(){
    eng=loopOsc('sawtooth',70,0,500);
    const s=ctx.createBufferSource();s.buffer=noise;s.loop=true;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=.8;const g=ctx.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(bus);s.start();engN={f,g};
    shieldHum=loopOsc('sine',55,0);shieldHum.o2=loopOsc('triangle',110.7,0);
    spearHum=loopOsc('sawtooth',50,0,900);spearHum.o2=loopOsc('sawtooth',50.6,0,900);
  }
  function tick(dt){
    if(!ctx||!eng)return;const t=ctx.currentTime,k=.08;
    // engine: pitch and roar follow your speed
    const sp=mode==='pilot'?vel.length():0,boost=sp>420;
    eng.o.frequency.setTargetAtTime(55+sp*.12,t,k);eng.g.gain.setTargetAtTime(mode==='pilot'?.045+Math.min(.06,sp/9000):0,t,k);
    engN.f.frequency.setTargetAtTime(500+sp*2.2,t,k);engN.g.gain.setTargetAtTime(mode==='pilot'?.03+(boost?.07:Math.min(.04,sp/9000)):0,t,.15);
    // shield hum, louder the closer you are to the dome
    const sOn=shield.visible?Math.min(1,shieldMat.uniforms.uOp.value):0,sd=Math.max(0,1-Math.abs(camera.position.length()-SHIELD_R)/2500);
    shieldHum.g.gain.setTargetAtTime(sOn*(.05+.1*sd),t,.2);shieldHum.o2.g.gain.setTargetAtTime(sOn*(.015+.04*sd),t,.2);
    // the Spear: a rising drone while it charges
    const ch=PH[ph].id==='spear'&&!spearFired()?spearCharge():0;
    spearHum.o.frequency.setTargetAtTime(45+ch*190,t,.3);spearHum.o2.o.frequency.setTargetAtTime(45.7+ch*192,t,.3);
    const sv=ch>0?.02+ch*.09:0;spearHum.g.gain.setTargetAtTime(sv,t,.3);spearHum.o2.g.gain.setTargetAtTime(sv,t,.3);
  }

  /* ---------- the radio speaks ---------- */
  const VOICE={'Elias Veyr':{pitch:.75,rate:.95},'Tide City Command':{pitch:1.05,rate:1.08},'Lt. Michael':{pitch:1.15,rate:1.02},'The Hollow King':{pitch:.25,rate:.78},'Keeper Sergeant':{pitch:.85,rate:1.12}};
  let vlist=[];function loadVoices(){try{vlist=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));}catch(_){}}
  if(window.speechSynthesis){loadVoices();speechSynthesis.onvoiceschanged=loadVoices;}
  function speak(who,text){
    if(!on||!speech||!window.speechSynthesis||!ctx)return;
    try{
      if(speechSynthesis.pending)speechSynthesis.cancel();   // never fall more than one line behind the action
      const u=new SpeechSynthesisUtterance(text.replace(/’/g,"'")),V=VOICE[who]||{pitch:1,rate:1};
      u.pitch=V.pitch;u.rate=V.rate;u.volume=.9;
      if(vlist.length){const k=Object.keys(VOICE).indexOf(who);u.voice=vlist[Math.abs(k)%vlist.length];if(who==='The Hollow King')u.voice=vlist[0];}
      speechSynthesis.speak(u);
    }catch(_){}
  }
  const _say=PG.say;
  PG.say=function(who,text,tone,dur){_say(who,text,tone,dur);api.radio();speak(who,text);};

  /* ---------- hooks into the shared effects ---------- */
  const _fire=fire;fire=function(from,to,speed,kind,onHit){shot(kind,from);return _fire(from,to,speed,kind,onHit);};
  const _boom=boom;boom=function(pos,size,hex,life){explosion(pos,size);return _boom(pos,size,hex,life);};
  const _lm=launchMissile;launchMissile=function(from,dir,target,big){if(target)missile(from,big);return _lm(from,dir,target,big);};
  const _fm=fireMissile;fireMissile=function(from,dir,speed,target,cb){missile(from,true);return _fm(from,dir,speed,target,cb);};
  const _sc=startCrash;startCrash=function(c,guide){if(!c.crash)api.crash(c.grp.position);return _sc(c,guide);};
  const _do=dropOut;dropOut=function(){api.jump(camera.position);return _do();};
  const _ld=launchDrop;launchDrop=function(){_ld();const D=drops.find(D=>D.state==='in'&&D.t===0);if(D)api.horn(D.pos);};

  /* ---------- mute button and M key ---------- */
  const btn=document.createElement('button');btn.type='button';btn.textContent='Sound: '+(on?'on':'off');
  btn.addEventListener('click',()=>{start();api.toggle();btn.blur();});
  const views=$('views');views.insertBefore(btn,$('quality'));
  addEventListener('keydown',e=>{if(e.code==='KeyM'&&!e.repeat){start();api.toggle();}});
  return api;
})();
const _tideTick=tideTick;tideTick=function(dt){_tideTick(dt);sfx.tick(dt);};
