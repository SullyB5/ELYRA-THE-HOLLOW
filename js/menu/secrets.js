/* Elyra · the menu's recovered logs and the things hidden in it.
   - The Recovered logs panel (left column): the three footage reels and Michael's sleep log (one entry opens per archive cleared).
   - Touch the menu in the right places and it answers: the two small rings in the reticle ping like sonar (and after a few pings,
     something opens its eyes above the card), the heartbeat thumps, the signal bursts into static and lets a word through,
     the emblem turns, the coordinates scramble, the year slips, the warning triangle sounds, and touching the empty dark
     sometimes sends something enormous across the stars. Every sound is synthesized; Sound off in Settings silences it.
   window.ELYRA_SECRETS.static(el): the static burst the unrecovered missions use. */
(()=>{
  const $=id=>document.getElementById(id),still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const muted=()=>{try{return localStorage.getItem('tideAudio')==='off';}catch(_){return false;}};
  /* ---------- sound ---------- */
  let ctx=null,out=null;
  function ac(){if(muted())return null;if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=new A();out=ctx.createGain();out.gain.value=.5;out.connect(ctx.destination);}
    if(ctx.state!=='running')ctx.resume().catch(()=>{});return ctx;}
  function env(g,t,a,peak,d){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}
  function tone(f,dur,type,peak,f2){const c=ac();if(!c)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
    env(g,t,.01,peak||.3,dur);o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);}
  function noise(dur,freq,peak,q){const c=ac();if(!c)return;const t=c.currentTime,n=c.sampleRate*dur,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=freq||1800;f.Q.value=q||.7;const g=c.createGain();env(g,t,.005,peak||.25,dur);s.connect(f);f.connect(g);g.connect(out);s.start(t);}
  const SND={
    ping(){tone(1320,1.6,'sine',.22);setTimeout(()=>tone(1320,1.2,'sine',.06),420);},
    thump(){tone(70,.25,'sine',.6,40);setTimeout(()=>tone(60,.22,'sine',.45,36),260);},
    static(){noise(.45,2400,.22,.5);noise(.25,600,.12);},
    groan(){tone(46,3.6,'sawtooth',.12,31);tone(69,3.2,'sine',.14,52);noise(3,180,.08,2);},
    chime(){tone(880,1.4,'triangle',.12);setTimeout(()=>tone(1318,1.6,'triangle',.08),140);},
    beep(){tone(980,.12,'square',.08);setTimeout(()=>tone(980,.12,'square',.08),220);},
    tick(){tone(2200,.03,'square',.03);},
    rumble(){noise(5,90,.25,1.2);tone(32,5,'sine',.25,28);},
    whisper(){noise(1.6,3200,.06,6);noise(1.2,1400,.05,8);}};
  /* ---------- the recovered logs ---------- */
  const FOOT=[['01','The Call'],['02','The Return'],['03','The Hollow']];
  // Michael's sleep log (one opens per archive cleared). Oct 22 canon: the dreams come from the Hollow's pull and the Drowned Watcher
  // reaching him mind to mind through the water. They show the Watcher and people who matter, never Astraea (he has not been there),
  // and they point toward what is coming without explaining it. Draft text; Bryce rewrites.
  const DREAMS=[[null,'LOG 01','08.03.2237','Same dream again. Black water, no surface. Two lights far below me, patient, like they have been waiting a long time. Tonight someone in a Keeper captain\u2019s coat stood in the water beside me with his face turned away and said my name like he was sorry. I woke before I could ask who he was. I did not tell the Master. There is nothing to tell yet.'],
    ['origin','LOG 02','13.03.2237','The thing under the mountain had two lights for eyes. The same two lights from the dream, under water that should not be there. It did not want me dead. The lake under that mountain goes somewhere. Station Nine is six hundred kilometres away.'],
    ['astraea','LOG 03','14.03.2237','Astraea. The first other world I have ever seen, and none of it was in the dream. The dream was never about a place. Tonight it was the bay at home, lit gold from underneath, and the two lights turning away from it as fast as anything that big can move.'],
    ['tideholds','LOG 04','16.03.2237','When the Spear fired I heard something in it. Not a voice. More like a door. Everything that was under that light is gone, and the city cheered. I did not. There is a sentence in my head I have never read anywhere: they came before the end.']];
  const ach=()=>{try{return(typeof PG!=='undefined'&&PG.save&&PG.save.ach)||JSON.parse(localStorage.getItem('elyra.save.v1')||'{}').ach||{};}catch(_){return{};}};
  let readLogs={};try{readLogs=JSON.parse(localStorage.getItem('elyra.logs.read')||'{}');}catch(_){}
  function drawLogs(){const el=$('logList');if(!el)return;const A=ach();
    el.innerHTML=FOOT.map(([n,t])=>`<button type="button" class="lg" data-f="${+n}"><i>▶</i><span>Footage ${n} · ${t}</span><small>REC</small></button>`).join('')+
      DREAMS.map(([need,h,d],k)=>{const open=!need||A[need];return `<button type="button" class="lg sleep${open?'':' sealed'}${open&&!readLogs[k]?' new':''}" data-d="${k}" ${open?'':'disabled'}><i>${open?'≡':'▒'}</i><span>Sleep ${h}${open?'':' · sealed'}</span><small>${open?d.slice(0,5):''}</small></button>`;}).join('');
    el.querySelectorAll('.lg[data-f]').forEach(b=>b.addEventListener('click',()=>{if(window.ELYRA_FOOTAGE)window.ELYRA_FOOTAGE(+b.dataset.f);}));
    el.querySelectorAll('.lg[data-d]:not(.sealed)').forEach(b=>b.addEventListener('click',()=>showDream(+b.dataset.d)));}
  let typing=0;
  function showDream(k){const [,h,d,txt]=DREAMS[k],br=$('brief');if(!br)return;readLogs[k]=1;try{localStorage.setItem('elyra.logs.read',JSON.stringify(readLogs));}catch(_){}drawLogs();
    SND.whisper();br.innerHTML=`<p style="color:#9fc8cc;font-size:10px;letter-spacing:.24em">PERSONAL LOG · LT. M. HALL · SLEEP RECORD · ${h} · ${d}</p><p id="dreamTxt"></p><span class="ts">SOURCE: NEURAL TRACE · NOT FOR THE ARCHIVE</span>`;
    const p=$('dreamTxt'),id=++typing;let i=0;(function step(){if(id!==typing)return;i+=still?txt.length:2;p.textContent=txt.slice(0,i);if(i%6===0)SND.tick();if(i<txt.length)setTimeout(step,22);})();}
  drawLogs();addEventListener('pageshow',drawLogs);
  /* ---------- what answers when you touch it ---------- */
  const on=(el,fn)=>{if(el){el.classList.add('hot');el.addEventListener('click',e=>{e.stopPropagation();fn(e);});}};
  let pings=0,eyesUp=false;
  function ring(el){if(!el)return;el.setAttribute('stroke','rgba(159,232,255,.8)');el.setAttribute('stroke-width','2');
    let r=26,a=1;const anim=()=>{r+=1.6;a-=.03;el.setAttribute('r',r);el.setAttribute('stroke','rgba(159,232,255,'+Math.max(0,a)+')');if(a>0)requestAnimationFrame(anim);else{el.setAttribute('r',26);el.removeAttribute('stroke');}};anim();}
  for(const id of['hotL','hotR'])on($(id),()=>{SND.ping();ring($(id));pings++;
    if(pings>=3&&!eyesUp){eyesUp=true;setTimeout(()=>{const E=$('eyes');if(!E)return;E.classList.add('on');SND.groan();setTimeout(()=>{E.classList.remove('on');eyesUp=false;pings=0;},5200);},900);}});
  on($('ecg'),()=>{SND.thump();setTimeout(SND.thump,820);setTimeout(SND.thump,1500);});
  const FRAG=['...ASTRAEA...','...THEY CAME BEFORE THE END...','...DO NOT OPEN...','...MICHAEL...','...RHEN...','...SOMETHING IS COMING...'];
  on($('wave'),()=>{SND.static();const r=$('sgR');if(!r)return;r.textContent=FRAG[(Math.random()*FRAG.length)|0];r.style.color='#9fc8cc';setTimeout(()=>{r.style.color='';r.textContent='RECEIVING...';},2200);});
  const em=document.querySelector('.emblem');let emA=0;on(em,()=>{SND.chime();emA+=360;em.style.transition='transform 1.6s cubic-bezier(.3,.7,.2,1)';em.style.transform=`rotate(${emA}deg)`;});
  const co=document.querySelector('.meta.coord');let coN=0;on(co,()=>{coN++;let k=0;const keep='N 36.7731°<br>E 14.9827°';
    const iv=setInterval(()=>{SND.tick();co.innerHTML=`N ${(Math.random()*90).toFixed(4)}°<br>E ${(Math.random()*180).toFixed(4)}°`;if(++k>14){clearInterval(iv);co.innerHTML=coN%3===0?'N ??.????°<br>YOU ARE ALREADY THERE':keep;if(coN%3===0)setTimeout(()=>{co.innerHTML=keep;},2600);}},60);});
  document.querySelectorAll('.yr').forEach(y=>on(y,()=>{SND.whisper();const keep=y.textContent;y.textContent=Math.random()<.5?'????':'2214';y.style.color='#e8463c';setTimeout(()=>{y.textContent=keep;y.style.color='';},1400);}));
  const fail=document.querySelector('.foot .fail');on(fail,()=>{SND.beep();fail.style.animation='blink .25s steps(2) 6';setTimeout(()=>{fail.style.animation='';},1600);});
  // the empty dark: now and then something vast crosses behind the stars
  let crossing=false;
  document.addEventListener('click',e=>{const t=e.target;if(!(t===document.body||t.id==='bg'||t.classList.contains('wrap')||t.classList.contains('center')))return;
    if(crossing||Math.random()>.45)return;crossing=true;SND.rumble();
    const sh=document.createElement('div');sh.className='shade';const W=Math.min(innerWidth*1.1,1400),top=innerHeight*(.15+Math.random()*.35),ltr=Math.random()<.5;
    sh.style.cssText+=`width:${W}px;height:${W*.22}px;top:${top}px;left:${ltr?-W:innerWidth}px;transition:opacity 2s,left 9s linear`;
    sh.innerHTML=`<svg viewBox="0 0 1000 220" width="100%" height="100%" style="transform:scaleX(${ltr?1:-1})"><path d="M0 120 L180 92 L330 70 L470 60 L560 30 L600 62 L760 70 L900 96 L1000 112 L900 130 L760 150 L600 160 L560 190 L470 160 L330 150 L180 132 Z" fill="#000" stroke="rgba(160,120,220,.18)" stroke-width="2"/><g fill="rgba(170,110,255,.55)"><circle cx="300" cy="112" r="2"/><circle cx="520" cy="110" r="3"/><circle cx="760" cy="114" r="2"/></g></svg>`;
    document.body.appendChild(sh);requestAnimationFrame(()=>{sh.style.opacity='.85';sh.style.left=(ltr?innerWidth:-W)+'px';});
    setTimeout(()=>{sh.style.opacity='0';},7600);setTimeout(()=>{sh.remove();crossing=false;},9800);});
  window.ELYRA_SECRETS={static(el){SND.static();if(el){el.classList.remove('static');void el.offsetWidth;el.classList.add('static');}},sound:SND};
})();
