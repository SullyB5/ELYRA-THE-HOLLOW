/* Elyra · the score (Nov 3 overhaul). Music now plays through gameplay and follows the fight, in three parts:
     quiet  (Halo 3: ODST)  sparse felt piano over a soft "oo" choir, lots of space; plays between fights, then rests
     drive  (Halo: Reach)   driving low strings in 3-3-2, taiko and snare, choir underneath, high strings when it heats up
     epic   (Halo 3)        brass chords and the ELYRA motif on horns, taiko, full choir, cymbal swells into each phrase
   plus a resolve swell when a fight ends and a brass sting on huge moments. Silence is part of it: after a fight the music
   resolves and stops, the quiet part comes and goes, and a long fight gives the music a break before it returns.

   How a fight is heard: every shot (fire), explosion (boom) and hit on you raises "heat", closer = more; heat drains over ~5 s.
   Heat over .3 starts drive, 10 s over .8 (or sfx.music.epic()) goes epic, cooling under .14 for 5 s resolves and rests.
   Cutscenes keep working as before: sfx.score(mood) inside a cutscene plays that mood's cue, score(null) hands back to the fight.
   Outside a cutscene, score('tense') holds a fight floor and score('chill') holds the quiet part (score(null) releases either).

   Every part is synthesized here until js/shared/music-map.js lists a recorded track for it; then the file plays instead.
   All of the music is original (the motif below is Elyra's own), not taken from any Halo score.
   Loads after js/shared/audio.js and music-map.js. Debug: MUSIC.state(), MUSIC.force('drive'|'epic'|'quiet'|null). */
const MUSIC=(()=>{
  if(typeof sfx==='undefined')return null;
  let ctx=null,noise=null,out=null,dry=null,revSend=null,ready=false;
  const MAP=typeof MUSIC_MAP!=='undefined'?MUSIC_MAP:{tracks:{}},TR=MAP.tracks||{},BASE=MAP.base||'audio/music/';
  const BUF={};const mtof=m=>440*Math.pow(2,(m-69)/12);const R=(a,b)=>a+Math.random()*(b-a);const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  const now=()=>ctx?ctx.currentTime:0;

  function init(){
    if(ready)return;const io=sfx.music_io&&sfx.music_io();if(!io||!io.ctx)return;ctx=io.ctx;noise=io.noise;ready=true;
    out=ctx.createGain();out.gain.value=.5;   // sits under the fight: combat peaks land around -6 dB before the SFX
    out.connect(io.musG);
    dry=ctx.createGain();dry.gain.value=1;dry.connect(out);
    // a big hall: 3.6 s stereo tail, 22 ms pre-delay, darker as it decays
    try{const sr=ctx.sampleRate,len=Math.floor(sr*3.6),ir=ctx.createBuffer(2,len,sr),pre=Math.floor(sr*.022);
      for(let c=0;c<2;c++){const x=ir.getChannelData(c);let lp=0;for(let i=pre;i<len;i++){const k=(i-pre)/(len-pre),a=.55-.4*k;lp+=((Math.random()*2-1)-lp)*a;x[i]=lp*Math.pow(1-k,2.6);}}
      const cv=ctx.createConvolver();cv.buffer=ir;revSend=ctx.createGain();revSend.gain.value=.5;revSend.connect(cv);cv.connect(out);}catch(_){revSend=null;}
    setTimeout(loadFiles,2500);
    setInterval(tick,50);
  }
  sfx.onStart(init);

  /* ---------- recorded tracks (music-map.js) ----------
     A level can override any part (MUSIC_MAP.levels[page]). Each part picks ONE of its listed tracks per visit to the page, and only
     the picks are downloaded, in the order they're likely needed (the in-play parts first, then stings, then cutscene moods), two at a
     time, so a phone never pulls the whole score. A part still on its synth when its file lands switches over to the file. */
  const PAGE=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'')||'index';
  const LV=(MAP.levels||{})[PAGE]||{};
  const listFor=k=>(k in LV?LV[k]:TR[k])||[];
  const PICK={};const pickOf=k=>{if(!(k in PICK)){const L=listFor(k);PICK[k]=L.length?L[Math.floor(Math.random()*L.length)]:null;}return PICK[k];};
  const nameOf=e=>Array.isArray(e.f)?e.f[0]:e.f;
  const ORDER=['quiet','drive','epic','sting','sting.king','resolve','cut.calm','cut.tense','cut.awe','cut.sorrow','cut.chill','cut.cave'];
  const allKeys=()=>[...new Set([...ORDER,...Object.keys(TR),...Object.keys(LV)])];
  const filesOf=k=>{const e=pickOf(k);return e?[nameOf(e)]:[];};
  const loading={};
  function loadFiles(){const names=[...new Set(allKeys().flatMap(filesOf))];let i=0;
    const next=()=>{if(i>=names.length)return;const n=names[i++];loading[n]=1;
      fetch(BASE+n+'.mp3').then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>ctx.decodeAudioData(b,ok,no))).then(b=>{BUF[n]=b;}).catch(()=>{}).then(next);};
    next();next();}
  function fileFor(key){const e=pickOf(key);if(!e||!BUF[nameOf(e)])return null;return{buf:BUF[nameOf(e)],vol:e.vol==null?1:e.vol,loop:e.loop!==false,name:nameOf(e)};}

  /* ---------- instruments: each schedules one note at time t into a layer's node ---------- */
  function vca(dest){const g=ctx.createGain();g.gain.value=0;g.connect(dest);return g;}
  function osc(type,f,t,end,dest,det){const o=ctx.createOscillator();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;o.connect(dest);o.start(t);o.stop(end);return o;}
  // felt piano: five partials, the high ones dying first, a low-pass closing as it rings
  function piano(L,t,m,v){const f=mtof(m),dec=cl(6.5-(m-48)*.09,1.8,6.5),end=t+dec+.3;
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(700+2400*v,t);lp.frequency.exponentialRampToValueAtTime(380+500*v,t+dec*.6);
    const g=vca(L);lp.connect(g);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.2,t+.005);g.gain.setTargetAtTime(0,t+.005,dec/3.2);
    [[1,1],[2,.38],[3,.15],[4.03,.07],[5.05,.035]].forEach(([p,a],i)=>{const pg=ctx.createGain();pg.gain.setValueAtTime(a,t);pg.gain.setTargetAtTime(0,t,dec/(2.2*(i+1)));pg.connect(lp);osc('sine',f*p,t,end,pg);});
    const n=ctx.createBufferSource();n.buffer=noise;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*4;bp.Q.value=2;const ng=ctx.createGain();
    ng.gain.setValueAtTime(v*.05,t);ng.gain.exponentialRampToValueAtTime(.0001,t+.03);n.connect(bp);bp.connect(ng);ng.connect(L);n.start(t,Math.random());n.stop(t+.04);}
  // choir: two detuned saws a voice, shaped by three vowel formants, with a slow vibrato
  const VOW={ah:[700,1150,2600],oo:[330,780,2350],oh:[460,860,2500]};
  function choir(L,t,ms,dur,v,vow){const F=VOW[vow||'ah'],att=Math.min(1.3,dur*.35),rel=1.8,end=t+dur+rel+.1;
    const g=vca(L);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.11/Math.sqrt(ms.length),t+att);g.gain.setValueAtTime(v*.11/Math.sqrt(ms.length),t+dur);g.gain.setTargetAtTime(0,t+dur,rel/3);
    const sum=ctx.createGain();[[F[0],6,1],[F[1],8,.55],[F[2],11,.2]].forEach(([f,q,a])=>{const b=ctx.createBiquadFilter();b.type='bandpass';b.frequency.value=f;b.Q.value=q;const bg=ctx.createGain();bg.gain.value=a*2.4;sum.connect(b);b.connect(bg);bg.connect(g);});
    const body=ctx.createBiquadFilter();body.type='lowpass';body.frequency.value=520;const bg=ctx.createGain();bg.gain.value=.35;sum.connect(body);body.connect(bg);bg.connect(g);
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=R(4.6,5.4);lg.gain.value=9;lfo.connect(lg);lfo.start(t);lfo.stop(end);
    for(const m of ms)for(const d of[-7,6]){const o=osc('sawtooth',mtof(m),t,end,sum,d+R(-2,2));lg.connect(o.detune);}}
  // strings: 'spic' (short, bowed hard) or long
  function strings(L,t,m,dur,v,spic){const end=t+dur+(spic?.25:.8);const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=.8;
    lp.frequency.setValueAtTime(spic?900+2600*v:600+1500*v,t);if(spic)lp.frequency.exponentialRampToValueAtTime(500+700*v,t+.12);
    const g=vca(L);lp.connect(g);
    if(spic){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.16,t+.004);g.gain.setTargetAtTime(0,t+.01,Math.min(.07,dur*.6));}
    else{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.1,t+Math.min(.35,dur*.3));g.gain.setValueAtTime(v*.1,t+dur);g.gain.setTargetAtTime(0,t+dur,.25);}
    osc('sawtooth',mtof(m),t,end,lp,-6);osc('sawtooth',mtof(m),t,end,lp,7);}
  // brass: a filter that blooms open on the attack (the blat), a small scoop up into pitch
  function brass(L,t,ms,dur,v,soft){const end=t+dur+.6,top=(soft?500:900)+(soft?1100:2600)*v;
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=soft?.6:1.4;lp.frequency.setValueAtTime(260,t);lp.frequency.exponentialRampToValueAtTime(top,t+(soft?.35:.13));lp.frequency.setTargetAtTime(top*.62,t+.2,.4);
    const g=vca(L);lp.connect(g);const pk=v*(soft?.09:.13)/Math.sqrt(ms.length);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+(soft?.18:.04));g.gain.setTargetAtTime(pk*.75,t+.1,.3);g.gain.setValueAtTime(pk*.75,t+dur);g.gain.setTargetAtTime(0,t+dur,.18);
    for(const m of ms)for(const d of[-5,5]){const o=osc('sawtooth',mtof(m),t,end,lp,d);o.detune.setValueAtTime(d-35,t);o.detune.linearRampToValueAtTime(d,t+.07);}}
  // taiko: a pitched skin dropping, a thud of noise, a hard edge
  function taiko(L,t,v,f){f=f||74;const g=vca(L);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.55,t+.004);g.gain.setTargetAtTime(0,t+.01,.22);
    const o=osc('sine',f*1.7,t,t+1.2,g);o.frequency.setValueAtTime(f*1.7,t);o.frequency.exponentialRampToValueAtTime(f*.6,t+.32);
    nz(L,t,'lowpass',700,.6,v*.35,.1);nz(L,t,'highpass',2200,.7,v*.08,.02);}
  function snare(L,t,v){nz(L,t,'bandpass',2300,.8,v*.3,.09);const g=vca(L);g.gain.setValueAtTime(v*.12,t);g.gain.exponentialRampToValueAtTime(.0001,t+.07);const o=osc('triangle',200,t,t+.1,g);o.frequency.exponentialRampToValueAtTime(150,t+.06);}
  function nz(L,t,type,f,q,v,dec,att){const s=ctx.createBufferSource();s.buffer=noise;const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;const g=vca(L);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+(att||.002));g.gain.setTargetAtTime(0,t+(att||.002),dec/3);s.connect(b);b.connect(g);s.start(t,Math.random()*1.5);s.stop(t+(att||0)+dec*2+.1);}
  const swell=(L,t,dur,v)=>{const s=ctx.createBufferSource();s.buffer=noise;s.loop=true;const b=ctx.createBiquadFilter();b.type='highpass';b.frequency.value=5200;const g=vca(L);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.22,t+dur);g.gain.setTargetAtTime(0,t+dur,.05);s.connect(b);b.connect(g);s.start(t);s.stop(t+dur+.4);};
  const crash=(L,t,v)=>nz(L,t,'highpass',4200,.5,v*.25,2.4);
  function sub(L,t,m,dur,v){const g=vca(L);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.22,t+.05);g.gain.setValueAtTime(v*.22,t+dur);g.gain.setTargetAtTime(0,t+dur,.2);osc('sine',mtof(m),t,t+dur+1,g);}

  /* ---------- harmony: D minor. b = bass, u = upper voicing ---------- */
  const C={Dm:{b:38,u:[57,62,65,69]},Dm9:{b:38,u:[57,64,65,69]},Bb:{b:34,u:[58,62,65,70]},Bbmaj7:{b:34,u:[57,62,65,70]},F:{b:41,u:[57,60,65,69]},
    C:{b:36,u:[55,60,64,67]},Gm:{b:43,u:[55,58,62,67]},Gm9:{b:43,u:[57,58,62,65]},A:{b:33,u:[57,61,64,69]},Asus:{b:33,u:[57,62,64,69]},A7b9:{b:33,u:[57,61,67,70]},
    Ab:{b:44,u:[56,60,63,68]},D:{b:38,u:[57,62,66,69]}};
  // the ELYRA motif (original): [beat, note, beats] over four bars
  const MOTIF=[[0,62,2],[2,65,1],[3,64,1],[4,62,2],[6,69,2],[8,67,1.5],[9.5,65,.5],[10,64,2],[12,62,4]];

  /* ---------- the parts. Each is a step function the clock calls on every 16th: (L, t, step, bar, sec) ---------- */
  const PART={
    quiet:{bpm:64,prog:['Dm9','Bbmaj7','Gm9','Asus','Dm9','Bbmaj7','Gm9','A7b9'],step(L,t,s,bar,o){
      const ch=C[this.prog[bar%8]],B=60/this.bpm,sp=o.sorrow?.8:1;
      if(s===0){piano(L,t,ch.b+12,.3*sp);if(!o.cave&&bar%2===0)piano(L,t+.02,ch.b+19,.18);
        if(o.pad!==false&&(bar%8>=1||o.cave))choir(L,t,o.cave?[ch.b+12,ch.b+19]:ch.u.slice(0,3),B*4,o.cave?.9:.55,'oo');
        if(o.cave||o.dark)sub(L,t,ch.b,B*4,.5);
        // every other cycle the right hand plays the motif, an octave up, slow and soft
        o.motif=(Math.floor(bar/8)%2===1)&&!o.cave&&!o.sorrow;}
      if(o.cave)return;
      if(o.motif&&s%2===0){const b=(bar%4)*4+s/4;for(const [at,m] of MOTIF)if(Math.abs(at-b)<.01)piano(L,t+R(0,.03),m+12,.32);return;}
      // otherwise: a few notes from the chord, wandering, with room around them
      if(s%2===0&&s>0&&Math.random()<(o.dark?.16:.24)){const u=ch.u[Math.floor(Math.random()*ch.u.length)]+(Math.random()<.5?12:0);piano(L,t+R(0,.04),u,R(.16,.3)*sp);}}},
    drive:{bpm:140,prog:['Dm','Dm','Bb','C','Dm','Dm','Gm','A'],step(L,t,s,bar,o){
      const ch=C[this.prog[bar%8]],B=60/this.bpm,low=o.low,acc=[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0][s];
      // the 3-3-2 ostinato, low strings
      const base=ch.b+12;strings(L,t,s===7||s===15?base+7:s%4===2&&!low?base+12:base,B/4,(acc?.62:.3)*(low?.7:1),true);
      if(!low&&acc)strings(L,t,base-12,B/4,.4,true);
      // drums
      if(s===0||s===6||s===10)taiko(L,t,low?.55:s===0?.95:.65,low?62:74);
      if(!low){if(s===4||s===12)snare(L,t,.32);else if(s%2===1)snare(L,t,.06);}
      if(!low&&bar%4===3&&s>=12)taiko(L,t,.45+.1*(s-12),110-(s-12)*10);
      // choir and brass underneath
      if(s===0&&bar%2===0)choir(L,t,low?[ch.b+12,ch.b+19]:ch.u.slice(0,3),B*8,low?.7:.65,low?'oo':'ah');
      if(!low&&s===0&&(bar%8===3||bar%8===7))brass(L,t,ch.u.map(m=>m-12),B*1.5,.6);
      // heat: the violins join, running the chord in 16ths
      if(!low&&o.hot&&s%1===0){const u=ch.u;strings(L,t,u[[0,1,2,1][s%4]]+12,B/4,.26,true);}}},
    epic:{bpm:84,prog:['Dm','Bb','F','C','Dm','Bb','Gm','A'],step(L,t,s,bar,o){
      const ch=C[this.prog[bar%8]],B=60/this.bpm,soft=o.soft;
      if(s===0){brass(L,t,[ch.b+12,...ch.u.slice(0,3).map(m=>m-12)],B*(soft?4:2),soft?.5:.8,soft);choir(L,t,ch.u,B*4,soft?.6:.9,'ah');if(!soft)sub(L,t,ch.b,B*4,.7);}
      if(s===8&&!soft)brass(L,t,[ch.b+12,...ch.u.slice(0,3).map(m=>m-12)],B*2,.6);
      // the horns carry the motif: an octave down the first time round, at full height the second
      const b=(bar%4)*4+s/4,hi=Math.floor(bar/4)%2===1;
      for(const [at,m,len] of MOTIF)if(Math.abs(at-b)<.01)brass(L,t,[hi?m:m-12],B*len*.95,soft?.55:hi?.8:.6,true);
      if(soft)return;
      // low strings in eighths, taiko, a snare roll and a cymbal swell into the next phrase
      if(s%2===0)strings(L,t,ch.b+12,B/2,s%8===0?.55:.32,true);
      const tk=[1,0,0,.6,0,.6,.7,0][s/2|0];if(s%2===0&&tk)taiko(L,t,tk*(s===0?1:.85),s===0?60:74);
      if(bar%4===3&&s>=12)snare(L,t,.15+.06*(s-12));
      if(bar%8===7&&s===12)swell(L,t,B,1);if(bar%8===0&&s===0&&bar>0)crash(L,t,1);}}};

  /* ---------- the layer that's playing: its own gain, its own clock ---------- */
  let cur=null;
  function startPart(key,opts){
    if(key&&ctx&&cur&&cur.src){const F=fileFor(opts&&opts.file||key);if(F&&F.buf===cur.buf){cur.key=key;cur.opts=Object.assign({},opts||{});return;}}
    stopPart(key==='quiet'?3.5:1.6);if(!key||!ctx)return;
    const g=ctx.createGain();g.gain.value=0;g.connect(dry);if(revSend)g.connect(revSend);
    const fileKey=opts&&opts.file||key,F=fileFor(fileKey),L={key,fileKey,g,opts:Object.assign({},opts||{}),step:0,bar:0,next:now()+.08,src:null};
    const lvl=(F?F.vol:1)*(key==='quiet'?1.3:1);
    g.gain.setValueAtTime(0,now());g.gain.linearRampToValueAtTime(lvl,now()+(key==='quiet'?3:key==='drive'?.6:1.2));
    if(F){const s=ctx.createBufferSource();s.buffer=F.buf;s.loop=F.loop;s.connect(g);s.start(now()+.05);L.src=s;L.buf=F.buf;}
    cur=L;
  }
  function stopPart(fade){if(!cur)return;const L=cur;cur=null;const t=now();L.g.gain.cancelScheduledValues(t);L.g.gain.setValueAtTime(L.g.gain.value,t);L.g.gain.setTargetAtTime(0,t,(fade||2)/3);
    L.dead=true;setTimeout(()=>{try{if(L.src)L.src.stop();L.g.disconnect();}catch(_){}},(fade||2)*1000+5000);}
  function clock(){if(cur&&!cur.src&&!cur.dead&&fileFor(cur.fileKey)){const k=cur.key,o=cur.opts;cur.next=1e9;startPart(k,o);return;}
    if(!cur||cur.src)return;const P=PART[cur.key],step16=60/P.bpm/4,t0=now();
    if(cur.next<t0-.25)cur.next=t0+.05;   // the tab was asleep: pick up from now, don't flood
    while(cur.next<t0+.18){if(sfx.on){try{P.step(cur.g,cur.next,cur.step,cur.bar,cur.opts);}catch(e){}}
      cur.next+=step16;cur.step++;if(cur.step>=16){cur.step=0;cur.bar++;}}}

  /* ---------- one-shots: the resolve when a fight ends, the sting on a huge moment ---------- */
  function oneShot(key,fn){if(!ctx||!sfx.on)return;const F=fileFor(key),g=ctx.createGain();g.gain.value=1;g.connect(dry);if(revSend)g.connect(revSend);
    if(F){const s=ctx.createBufferSource();s.buffer=F.buf;s.connect(g);g.gain.value=F.vol;s.start(now()+.03);}else fn(g,now()+.03);
    setTimeout(()=>{try{g.disconnect();}catch(_){}},14000);}
  const resolve=()=>oneShot('resolve',(L,t)=>{const D=C.D;choir(L,t,D.u,3.2,.75,'ah');brass(L,t+.15,[D.b+12,D.u[1]-12,D.u[2]-12],3,.45,true);sub(L,t,D.b,3.4,.5);taiko(L,t,.4,60);});
  function sting(kind){oneShot(kind==='king'&&pickOf('sting.king')?'sting.king':'sting',(L,t)=>{
    if(kind==='king'){brass(L,t,[38,44,50],3.2,.85);choir(L,t,[50,56],3.4,.8,'oo');taiko(L,t,1,52);taiko(L,t+.5,.6,52);sub(L,t,26,3.5,.9);}
    else{const D=kind==='spear'||kind==='dome'?C.D:C.Dm;brass(L,t,[D.b+12,...D.u.slice(0,3).map(m=>m-12)],2.6,.9);choir(L,t,D.u,3.4,.9,'ah');taiko(L,t,1,60);crash(L,t,.9);sub(L,t,D.b,3,.8);}});}

  /* ---------- the director ---------- */
  const S={mode:'rest',heat:0,hot:0,cool:0,since:0,restUntil:0,until:0,lockUntil:0,epicUntil:0,hint:null,hintUntil:0,cutMood:null,forced:undefined,last:0};
  const T=()=>performance.now()/1000;
  S.restUntil=T()+R(9,18);
  const inCut=()=>(typeof CUTS!=='undefined'&&CUTS.on)||(typeof PROLOGUE!=='undefined'&&PROLOGUE.on);
  const CUTMAP={calm:['quiet',{}],sorrow:['quiet',{sorrow:1}],chill:['quiet',{dark:1}],cave:['quiet',{cave:1}],awe:['epic',{soft:1}],tense:['drive',{low:1}],
    quiet:['quiet',{}],drive:['drive',{}],epic:['epic',{}]};
  function want(key,opts,tag){const id=key?key+':'+(tag||''):'';if(S.playing===id&&(key||!cur))return;S.playing=id;startPart(key,opts);}
  function setMode(m){if(S.mode===m)return;const was=S.mode;S.mode=m;const t=T();
    if(m==='drive'||m==='epic'){if(was!=='drive'&&was!=='epic'){S.since=t;S.cool=0;}}
    if(m==='rest')S.restUntil=t+((was==='drive'||was==='epic')?R(28,55):R(45,100));
    if(m==='quiet')S.until=t+R(70,130);}
  let lastTick=0;
  function tick(){if(!ctx)return;clock();const t=T();const dt=lastTick?Math.min(.5,t-lastTick):.05;lastTick=t;
    S.heat*=Math.exp(-dt/5);if(t>S.hintUntil)S.hint=null;
    if(S.forced!==undefined){want(S.forced,Object.assign({hot:S.heat>.55},S.forcedOpts),'f');return;}
    // cutscenes and the prologue: their mood, or silence when they asked for none
    if(inCut()){if(S.cutMood){const c=CUTMAP[S.cutMood]||CUTMAP.calm;want(c[0],Object.assign({file:'cut.'+S.cutMood},c[1]),'cut.'+S.cutMood);}else want(null);return;}
    const h=Math.max(S.heat,S.hint==='tense'?.42:0);
    if(S.mode==='drive'||S.mode==='epic'){
      S.hot=h>.8?S.hot+dt:Math.max(0,S.hot-dt*2);S.cool=h<.14?S.cool+dt:0;
      if(S.cool>5){S.cool=0;S.hot=0;want(null);setMode('rest');resolve();return;}
      if(t-S.since>150&&t>S.epicUntil){S.lockUntil=t+R(30,45);want(null);setMode('rest');return;}   // a long fight: let it breathe
      if(t<S.epicUntil||S.hot>10)setMode('epic');else if(S.mode==='epic'&&h<.45){S.calmT=(S.calmT||0)+dt;if(S.calmT>6){S.calmT=0;setMode('drive');}}else S.calmT=0;
    }else{
      if(t<S.epicUntil)setMode('epic');
      else if(h>.3&&t>S.lockUntil)setMode('drive');
      else if(S.hint==='chill')setMode('quiet');
      else if(S.mode==='rest'&&t>S.restUntil)setMode('quiet');
      else if(S.mode==='quiet'&&t>S.until)setMode('rest');}
    if(S.mode==='epic')want('epic',{},'e');
    else if(S.mode==='drive'){const hot=h>.55;if(!cur||cur.key!=='drive')want('drive',{hot},'d');else cur.opts.hot=hot;}
    else if(S.mode==='quiet')want('quiet',S.hint==='chill'?{dark:1}:{},'q');
    else want(null);}

  /* ---------- what the fight sounds like to the director ---------- */
  let budget=0,budT=0;
  function heat(x){const t=T();if(t-budT>1){budT=t;budget=0;}if(budget>.55)return;x=Math.max(0,x);budget+=x;S.heat=Math.min(1,S.heat+x);}
  const near=(pos,ref)=>{try{return pos?sfx.place(pos,ref).g:1;}catch(_){return .5;}};
  if(typeof fire==='function'){const _f=fire;fire=function(from,to,speed,kind,onHit){heat(.032*near(from,520));return _f.apply(this,arguments);};}
  if(typeof boom==='function'){const _b=boom;boom=function(pos,size){if(size>=300)heat(.14*near(pos,1400));return _b.apply(this,arguments);};}
  const wrap=(name,fn)=>{const o=sfx[name];if(typeof o!=='function')return;sfx[name]=function(){fn.apply(null,arguments);return o.apply(sfx,arguments);};};
  wrap('playerGun',()=>heat(.022));
  wrap('hit',()=>heat(.1));
  wrap('shieldBreak',()=>heat(.22));
  wrap('heartbeat',()=>{S.heat=Math.max(S.heat,.78);});
  wrap('moment',kind=>{sting(kind);if(!inCut())S.epicUntil=T()+25;});
  wrap('spearFire',()=>sting('spear'));

  /* ---------- the score() calls the game already makes ---------- */
  function score(mood){
    if(inCut()||(typeof document!=='undefined'&&document.body&&document.body.classList.contains('incut'))){S.cutMood=mood||null;tick();return;}
    if(mood==='tense'||mood==='chill'){S.hint=mood;S.hintUntil=T()+240;}
    else if(!mood){S.hint=null;S.cutMood=null;}
    else S.cutMood=mood;}

  const api={score,epic(sec){S.epicUntil=T()+(sec||30);},sting,resolve,
    force(k,o){S.forced=k===undefined?undefined:k;S.forcedOpts=o||{};S.playing=null;},
    state(){return{mode:S.mode,heat:+S.heat.toFixed(2),playing:S.playing,file:!!(cur&&cur.src),hint:S.hint,cut:S.cutMood,restIn:Math.max(0,S.restUntil-T())|0};},
    get files(){return{loaded:Object.keys(BUF).length,listed:[...new Set(allKeys().flatMap(filesOf))].length};},page:PAGE};
  sfx.music=api;
  return api;
})();
