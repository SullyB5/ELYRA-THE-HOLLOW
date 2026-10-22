/* Elyra shared progress: points with kill combos, objectives, per-run challenges, lifetime achievements,
   Remnant Marks and the interceptor paints they unlock. Saved in this browser (localStorage, best effort). */
const PG=(function(){
  const KEY='elyra.save.v1';
  const ACH=[
    {id:'first_blood',name:'First Blood',desc:'Down your first enemy.',marks:10},
    {id:'ace',name:'Ace',desc:'Down 5 enemies within 10 seconds.',marks:25},
    {id:'combo',name:'Chain Reaction',desc:'Reach a x5 kill combo.',marks:30},
    {id:'warbreaker',name:'Warbreaker',desc:'Destroy a Herald warship.',marks:40},
    {id:'missileer',name:'Fire and Forget',desc:'Destroy 10 enemies with missiles (all runs).',marks:30},
    {id:'untouchable',name:'Untouchable',desc:'Clear a wave without losing hull.',marks:40},
    {id:'zealot',name:'Zealot',desc:'Use Zeal 3 times in one run.',marks:25},
    {id:'recorder',name:'Black Box',desc:'Recover the Pathfinder’s flight recorder.',marks:30},
    {id:'shepherd',name:'Shepherd',desc:'Finish Astraea with the Vigil above 60%.',marks:50},
    {id:'astraea',name:'Survivor of Astraea',desc:'Complete Archive 02, The Heralds.',marks:50},
    {id:'centurion',name:'Centurion',desc:'Down 100 enemies (all runs).',marks:60},
    {id:'gunner',name:'Sea Gunner',desc:'Hit a capital ship from a sea cannon.',marks:20},
    {id:'skyguard',name:'Skyguard',desc:'Down 10 fighters over Tide City in one run.',marks:30},
    {id:'shipkiller',name:'Shipkiller',desc:'Bring down a capital ship yourself in Tide City.',marks:50},
    {id:'tideholds',name:'Tide City Holds',desc:'Win the battle for Tide City.',marks:60},
    {id:'origin',name:'It Was a Trap',desc:'Complete Archive 01, The Mountain.',marks:50},
    {id:'breaker',name:'Breaker',desc:'Destroy 3 Hollow turrets in one run.',marks:30},
    {id:'command',name:'High Command',desc:'Score 50,000 in one chapter.',marks:60},
    {id:'pathfinder',name:'What We Stole',desc:'Complete the Pathfinder side mission.',marks:50},
  ];
  const PAINTS=[
    {id:'keeper',name:'Keeper Blue',need:0,pal:{hull:0xeef1f5,panel:0x2a5a96,trim:0xd9b25a,dark:0x1e242c,glow:0x8ff0ff}},
    {id:'remnant',name:'Remnant White',need:100,pal:{hull:0xf7f3e8,panel:0xe2d9c2,trim:0xd8a83e,dark:0x3a3328,glow:0xffe2a0}},
    {id:'veyr',name:'Veyr Grey',need:200,pal:{hull:0x8a919b,panel:0x3a414b,trim:0x7fe3ff,dark:0x15191e,glow:0x8ff0ff}},
    {id:'zeal',name:'Zeal Gold',need:350,pal:{hull:0xe6c56a,panel:0xfff1c8,trim:0xffffff,dark:0x4a3410,glow:0xffd27a}},
  ];
  function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')return Object.assign({best:{},ach:{},paint:'keeper',kills:0,mkills:0},s);}catch(_){}
    return{best:{},ach:{},paint:'keeper',kills:0,mkills:0};}
  let save=load();
  function store(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch(_){}}
  const marks=()=>ACH.reduce((s,a)=>s+(save.ach[a.id]?a.marks:0),0);
  // test mode: every paint is unlocked regardless of marks (set to false for normal play)
  const TEST_UNLOCK_ALL=true;
  const paintOK=p=>TEST_UNLOCK_ALL||marks()>=p.need;
  function paint(){const p=PAINTS.find(p=>p.id===save.paint);return(p&&paintOK(p)?p:PAINTS[0]).pal;}
  /* ---------- threat level (difficulty): Survivor (easy), Keeper (hard, the default), Hollow (insane). The ids stay easy/hard/insane so saves carry over. Read once when a chapter loads, so changing it reloads the page.
     space: enemy damage (dmg) and enemy count (mob). tide: damage to you (dmg), to the city (city), fighters launched (mob),
     how often enemies fire (rof) and capital ship hull (ehp). Insane is the original Tide City and the original Astraea waves. ---------- */
  const DIFFS={
    easy:{id:'easy',name:'Survivor',desc:'The story comes first. The enemy is weaker. You have time to breathe.',
      space:{dmg:.5,mob:.75},tide:{dmg:.5,city:.45,mob:.5,rof:.65,ehp:.7},origin:{dmg:.7,rof:.9,ehp:.85,acc:1,n:0,ammo:1.4,drops:1.4,regen:5}},
    hard:{id:'hard',name:'Keeper',desc:'The intended experience. Ammunition is scarce. Mistakes hurt. Zeal is your only advantage.',
      space:{dmg:.75,mob:1},tide:{dmg:.7,city:.65,mob:.68,rof:.8,ehp:.85},origin:{dmg:1,rof:1,ehp:1,acc:1.15,n:1,ammo:1,drops:1,regen:3}},
    insane:{id:'insane',name:'Hollow',desc:'Nothing is forgiving. Nothing waits for you. Every encounter can kill you. The Hollow does not care how good you are.',
      space:{dmg:1,mob:1.47},tide:{dmg:1,city:1,mob:1,rof:1,ehp:1},origin:{dmg:1.3,rof:1.2,ehp:1.25,acc:1.35,n:2,canyon:3,ammo:.75,drops:.7,regen:1.5}},
  };
  function diff(){return DIFFS[save.diff]||DIFFS.hard;}
  function setDiff(id){if(!DIFFS[id])return false;save.diff=id;store();return true;}
  function setPaint(id){const p=PAINTS.find(p=>p.id===id);if(p&&paintOK(p)){save.paint=id;store();return true;}return false;}

  /* ---------- run state ---------- */
  let run=null,ui=null,clockT=0;
  function css(){const st=document.createElement('style');st.textContent=`
.pg{position:fixed;z-index:2;pointer-events:none;left:calc(env(safe-area-inset-left,0px) + 16px);top:calc(env(safe-area-inset-top,0px) + 54px);display:flex;flex-direction:column;gap:8px;
  width:min(250px,48vw);font:400 11px/1.35 'JetBrains Mono',ui-monospace,Menlo,monospace;color:#eef4ff;text-shadow:0 1px 4px rgba(0,0,0,.85)}
.pg .sc{display:flex;align-items:baseline;gap:8px}.pg .sc b{font:700 22px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.04em;font-variant-numeric:tabular-nums}
.pg .cb{font:700 13px 'Chakra Petch','Arial Narrow',sans-serif;color:#ffd27a;opacity:0;transition:opacity .2s}.pg .cb.on{opacity:1}
.pg .obj{padding:7px 9px;background:rgba(6,10,22,.46);border:1px solid rgba(140,200,255,.32);border-left:3px solid #ffd27a;border-radius:3px}
.pg .obj b{display:block;font:700 10px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.18em;color:#ffd27a;text-transform:uppercase;margin-bottom:2px}
.pg .ch{display:flex;flex-direction:column;gap:2px;color:rgba(220,232,255,.72)}.pg .ch div.done{color:#8cf0b0}.pg .ch div.fail{color:rgba(255,120,120,.6);text-decoration:line-through}
.pg .toasts{display:flex;flex-direction:column;gap:6px}
.pg.fight .ch{display:none}
.pg .toast{padding:7px 10px;background:rgba(40,28,6,.72);border:1px solid rgba(255,210,122,.7);border-radius:3px;animation:pgIn .3s ease-out}
.pg .toast b{display:block;font:700 10px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.18em;color:#ffd27a;text-transform:uppercase}
.pg .toast.q{background:rgba(6,40,30,.7);border-color:rgba(140,240,176,.7)}.pg .toast.q b{color:#8cf0b0}
.pgpop{position:fixed;z-index:2;pointer-events:none;font:700 14px 'Chakra Petch','Arial Narrow',sans-serif;color:#ffd27a;text-shadow:0 1px 4px #000;transform:translate(-50%,-50%);animation:pgPop 1s ease-out forwards}
@keyframes pgIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes pgPop{from{opacity:1;margin-top:0}to{opacity:0;margin-top:-40px}}
.pgend{position:fixed;inset:0;z-index:6;display:grid;place-items:center;background:rgba(0,0,0,.6);padding:20px;overflow:auto;touch-action:pan-y;-webkit-overflow-scrolling:touch}
.pgend .card{width:min(480px,100%);display:flex;flex-direction:column;gap:12px;padding:20px;background:rgba(6,10,22,.82);border:1px solid rgba(140,200,255,.32);border-radius:4px;color:#eef4ff;
  font:400 12px/1.5 'JetBrains Mono',ui-monospace,monospace;box-sizing:border-box}
.pgend h2{margin:0;font:700 22px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.24em;text-align:center}
.pgend p{margin:0;color:rgba(220,232,255,.72);text-align:center}
.pgend .tot{display:flex;justify-content:center;gap:18px;font-variant-numeric:tabular-nums}.pgend .tot b{display:block;font:700 26px 'Chakra Petch','Arial Narrow',sans-serif}
.pgend .tot span{color:rgba(220,232,255,.6);font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.pgend ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}.pgend li{display:flex;justify-content:space-between;gap:10px}
.pgend li.done{color:#8cf0b0}.pgend li.miss{color:rgba(220,232,255,.45)}.pgend h3{margin:4px 0 0;font:700 11px 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.18em;color:#ffd27a;text-transform:uppercase}
.pgcomms{position:fixed;z-index:3;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);transform:translateX(-50%);width:min(560px,calc(100vw - 32px));
  opacity:0;transition:opacity .4s;pointer-events:none;text-align:center;box-sizing:border-box;
  font:500 14px/1.4 'Chakra Petch','Arial Narrow',system-ui,sans-serif;color:#fff;text-shadow:0 1px 3px #000,0 0 2px #000,0 0 10px rgba(0,0,0,.6)}
.pgcomms.on{opacity:1}.pgcomms b{display:block;font:700 10px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.2em;color:#7fe3ff;text-transform:uppercase;margin-bottom:1px}
.pgcomms.enemy b{color:#c98aff}
.pgcomms.alert b{color:#ff8a7a}
/* (subtitles, not a text box: just the words over the picture, like a film's. Smaller and narrower on a phone so they stay out of the way) */
@media (pointer:coarse){.pgcomms{width:min(440px,58vw);font-size:11.5px;line-height:1.35;bottom:calc(env(safe-area-inset-bottom,0px) + 190px)}.pgcomms b{font-size:8.5px}}
@media (pointer:coarse) and (orientation:landscape){.pgcomms{width:min(420px,44vw);bottom:auto;top:calc(env(safe-area-inset-top,0px) + 94px)}}
.pghq{position:fixed;inset:0;z-index:7;background:#03050a;color:#eef4ff;font:400 12px/1.55 'JetBrains Mono',ui-monospace,monospace;transition:opacity .5s;overflow:auto}
.pghq.out{opacity:0;pointer-events:none}.pghq canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.pghq .hqtop{position:absolute;left:calc(env(safe-area-inset-left,0px) + 22px);right:calc(env(safe-area-inset-right,0px) + 22px);top:calc(env(safe-area-inset-top,0px) + 16px);display:flex;justify-content:space-between;
  font:500 10px 'JetBrains Mono',monospace;letter-spacing:.24em;color:rgba(220,232,255,.55)}
.pghq .hqbrief{position:absolute;left:calc(env(safe-area-inset-left,0px) + 22px);bottom:calc(env(safe-area-inset-bottom,0px) + 22px);width:min(520px,calc(100vw - 44px));padding:16px 18px;
  background:linear-gradient(90deg,rgba(3,5,10,.86),rgba(3,5,10,.6));border-left:2px solid #ffd27a;box-sizing:border-box}
.pghq .k{font:700 10px 'Chakra Petch',sans-serif;letter-spacing:.26em;color:#ffd27a}
.pghq h2{margin:4px 0 8px;font:600 clamp(24px,3.6vw,40px)/1.05 'Chakra Petch','Arial Narrow',sans-serif;letter-spacing:.2em}
.pghq p{margin:0 0 10px;color:rgba(220,232,255,.78)}
.pghq .ob{padding:7px 10px;background:rgba(255,210,122,.08);border-left:3px solid #ffd27a;margin-bottom:8px}.pghq .ob b{display:block;font:700 9px 'Chakra Petch',sans-serif;letter-spacing:.2em;color:#ffd27a}
.pghq .th{font-size:10px;letter-spacing:.16em;color:rgba(220,232,255,.55)}.pghq .th small{letter-spacing:.04em;font-size:10px}
.pghq .hqctl{position:absolute;right:calc(env(safe-area-inset-right,0px) + 22px);top:calc(env(safe-area-inset-top,0px) + 48px);width:min(330px,40vw);max-height:calc(100vh - 190px);overflow:auto;padding:12px 14px;
  background:rgba(3,5,10,.72);border:1px solid rgba(140,200,255,.22);box-sizing:border-box}
.pghq .hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.pghq .hd b{font:700 10px 'Chakra Petch',sans-serif;letter-spacing:.2em;color:#7fe3ff}
.pghq .sw{padding:3px 8px;border:1px solid rgba(140,200,255,.3);background:none;color:rgba(220,232,255,.7);font:500 9px 'JetBrains Mono',monospace;letter-spacing:.12em;cursor:pointer;text-transform:uppercase}
.pghq dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:11px}.pghq dt{color:#ffd27a;white-space:nowrap}.pghq dd{margin:0;color:rgba(220,232,255,.8)}
.pghq .hqgo{position:absolute;right:calc(env(safe-area-inset-right,0px) + 22px);bottom:calc(env(safe-area-inset-bottom,0px) + 22px);width:min(330px,40vw);display:flex;flex-direction:column;gap:8px}
.pghq .bar{height:3px;background:rgba(140,200,255,.15)}.pghq .bar i{display:block;height:100%;width:0;background:#7fe3ff;box-shadow:0 0 8px #7fe3ff}
.pghq #pgStart{padding:13px 16px;border:1px solid #7fe3ff;background:rgba(127,227,255,.14);color:#eef4ff;font:700 13px 'Chakra Petch',sans-serif;letter-spacing:.24em;text-transform:uppercase;cursor:pointer}
.pghq #pgStart:disabled{opacity:.55;cursor:default;border-color:rgba(140,200,255,.3)}
@media (max-width:760px){.pghq .hqctl{position:relative;right:auto;top:auto;width:auto;max-height:none;margin:52px 16px 0}.pghq .hqbrief{position:relative;left:auto;bottom:auto;width:auto;margin:14px 16px}
  .pghq .hqgo{position:relative;right:auto;bottom:auto;width:auto;margin:0 16px 24px}.pghq .hqtop{left:16px;right:16px}.pghq .hqtop span:first-child{display:none}}
.pgend .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:4px}
.pgbrief .ctl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.pgbrief .ctl div{display:flex;flex-direction:column;gap:3px;min-width:0}
.pgbrief .ctl h3{margin:0 0 4px}.pgbrief .ctl .me h3{color:#7fe3ff}
.pgbrief dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:11px}
.pgbrief dt{color:#ffd27a;white-space:nowrap}.pgbrief dd{margin:0;color:rgba(220,232,255,.8)}
.pgbrief .ob{padding:8px 10px;border-left:3px solid #ffd27a;background:rgba(255,210,122,.08);text-align:left}
.pgbrief .dif{display:flex;justify-content:center;gap:0;margin-top:2px}
.pgbrief .dif button{padding:8px 14px;border-radius:0;margin-left:-1px;font-size:11px}
.pgbrief .dif button:first-child{border-radius:3px 0 0 3px}.pgbrief .dif button:last-child{border-radius:0 3px 3px 0}
.pgbrief .dif button[aria-pressed="true"]{border-color:#ffd27a;color:#ffd27a;background:rgba(255,210,122,.14);position:relative}
.pgbrief .dif button[data-d="insane"][aria-pressed="true"]{border-color:#ff6a5a;color:#ff8a7a;background:rgba(255,90,70,.14)}
.pgbrief .difd{font-size:11px;margin:0}
.pgbrief kbd{font:inherit;color:rgba(220,232,255,.55)}
@media (max-width:520px){.pgbrief .ctl{grid-template-columns:1fr}.pgbrief .ctl div:not(.me){display:none}}
.pgend a,.pgend button{padding:10px 16px;border:1px solid rgba(140,200,255,.32);border-radius:3px;background:rgba(6,10,22,.46);color:#eef4ff;font:700 12px 'Chakra Petch','Arial Narrow',sans-serif;
  letter-spacing:.14em;text-transform:uppercase;text-decoration:none;cursor:pointer}
.pgend a.primary,.pgend button.primary{border-color:#7fe3ff;background:rgba(127,227,255,.18)}
@media (pointer:coarse) and (max-height:520px){.pg .ch{display:none}}
@media (max-width:520px){.pg{top:calc(env(safe-area-inset-top,0px) + 58px);width:44vw;font-size:10px}.pg .sc b{font-size:18px}.pg .ch{display:none}}
`;document.head.appendChild(st);}
  /* ---------- the campaign: all three archives in a row (index.html starts it; each chapter page carries ?campaign=1).
     Progress is saved at the start of each archive, so Continue on the menu picks up from the one you were on. ---------- */
  const CKEY='elyra.campaign',ORDER=['origin','astraea','tide'],PAGE={origin:'origin.html',astraea:'space.html',tide:'tide-city.html'},
    NAME={origin:'The Mountain',astraea:'The Heralds',tide:'The Empty Sky'};
  let camp=null;try{camp=JSON.parse(localStorage.getItem(CKEY)||'null');}catch(_){}
  const inCampaign=/[?&]campaign=1/.test(location.search);
  function campStore(){try{localStorage.setItem(CKEY,JSON.stringify(camp));}catch(_){}}
  function campaign(){return camp;}
  function campStart(){camp={at:'origin',done:false,started:Date.now()};campStore();return PAGE.origin+'?campaign=1';}
  function campHref(id){return PAGE[id]+'?campaign=1';}
  function init(chapter,opts){
    if(inCampaign){if(!camp)camp={at:chapter,done:false,started:Date.now()};camp.at=chapter;campStore();}
    if(!ui){css();const el=document.createElement('div');el.className='pg';
      el.innerHTML='<div class="sc"><b>0</b><span class="cb"></span></div><div class="obj"><b>Objective</b><span></span></div><div class="ch"></div><div class="toasts"></div>';
      document.body.appendChild(el);ui={el,sc:el.querySelector('.sc b'),cb:el.querySelector('.cb'),obj:el.querySelector('.obj span'),objBox:el.querySelector('.obj'),ch:el.querySelector('.ch'),toasts:el.querySelector('.toasts')};}
    run={chapter,score:0,combo:1,comboT:0,recent:[],kills:0,chal:(opts.challenges||[]).map(c=>Object.assign({n:0,state:''},c)),newAch:[],objective:'',stats:{}};
    ui.objBox.hidden=true;drawChal();drawScore();
  }
  function drawScore(){ui.sc.textContent=run.score.toLocaleString();ui.cb.textContent='x'+run.combo+' combo';ui.cb.classList.toggle('on',run.combo>1);}
  function drawChal(){ui.ch.innerHTML=run.chal.map(c=>`<div class="${c.state}">${c.state==='done'?'✓':c.state==='fail'?'✗':'○'} ${c.text}${c.goal>1&&c.state===''?` ${c.n}/${c.goal}`:''}</div>`).join('');}
  function toast(title,text,q){const t=document.createElement('div');t.className='toast'+(q?' q':'');t.innerHTML=`<b>${title}</b>${text}`;ui.toasts.prepend(t);
    while(ui.toasts.children.length>3)ui.toasts.lastChild.remove();setTimeout(()=>t.remove(),4200);}
  function pop(text,sx,sy){const p=document.createElement('div');p.className='pgpop';p.textContent=text;p.style.left=sx+'px';p.style.top=sy+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),1000);}
  const _pv=typeof THREE!=='undefined'?new THREE.Vector3():null;
  function popAt(text,world){
    if(world&&_pv&&typeof camera!=='undefined'){_pv.copy(world).project(camera);if(_pv.z<1&&Math.abs(_pv.x)<.95&&Math.abs(_pv.y)<.95){pop(text,(_pv.x*.5+.5)*innerWidth,(-_pv.y*.5+.5)*innerHeight);return;}}
    pop(text,innerWidth/2+R0(-40,40),innerHeight/2-60);
  }
  const R0=(a,b)=>a+Math.random()*(b-a);
  function add(pts,world,label){if(!run)return;run.score+=Math.round(pts);drawScore();if(label!==false)popAt('+'+Math.round(pts)+(label?' '+label:''),world);
    if(run.score>=50000)ach('command');}
  // a kill: chains within 3 s raise the combo up to x5
  function kill(pts,world,how){if(!run)return;
    run.combo=run.comboT>0?Math.min(5,run.combo+1):1;run.comboT=3;add(pts*run.combo,world);
    run.kills++;save.kills++;if(how==='missile'){save.mkills++;if(save.mkills>=10)ach('missileer');}store();
    ach('first_blood');if(run.combo>=5)ach('combo');if(save.kills>=100)ach('centurion');
    run.recent.push(clockT);run.recent=run.recent.filter(t=>clockT-t<=10);if(run.recent.length>=5)ach('ace');
  }
  function tick(dt){if(!run)return;clockT+=dt;if(run.comboT>0){run.comboT-=dt;if(run.comboT<=0){run.combo=1;drawScore();}}}
  function objective(text){if(!run)return;if(text===run.objective)return;run.objective=text;ui.objBox.hidden=!text;ui.obj.textContent=text||'';}
  function chal(id){return run&&run.chal.find(c=>c.id===id);}
  function done(id){const c=chal(id);if(!c||c.state)return;c.state='done';c.n=c.goal||1;add(c.pts,null,false);toast('Challenge complete',`${c.text} · +${c.pts}`,true);drawChal();}
  function prog(id,n){const c=chal(id);if(!c||c.state)return;c.n+=n||1;if(c.n>=(c.goal||1))done(id);else drawChal();}
  function fail(id){const c=chal(id);if(!c||c.state)return;c.state='fail';drawChal();}
  function ach(id){const a=ACH.find(a=>a.id===id);if(!a||save.ach[id])return;save.ach[id]=Date.now();store();if(run)run.newAch.push(a);
    if(ui)toast('Achievement · +'+a.marks+' marks',a.name+' — '+a.desc);}
  function stat(k,n){if(!run)return 0;run.stats[k]=(run.stats[k]||0)+(n==null?1:n);return run.stats[k];}
  // end of a chapter: bank the best score and show the results card
  function finish(o){
    if(!run)return;
    // in the campaign a win leads straight on to the next archive (after a short count, or at once with the button)
    if(inCampaign){const i=ORDER.indexOf(run.chapter),next=ORDER[i+1];
      if(o.lost)o.buttons=[{text:'Try again',onClick:()=>location.reload(),primary:true},{text:'Menu',href:'index.html'}];
      else if(next){const best=save.best[run.chapter]||0;if(run.score>best){save.best[run.chapter]=run.score;store();}if(run.score>=50000)ach('command');
        camp.at=next;campStore();try{sessionStorage.setItem('elyra.chain',next);}catch(_){}
        const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:9;background:#000;opacity:0;transition:opacity .6s';document.body.appendChild(f);
        requestAnimationFrame(()=>f.style.opacity=1);setTimeout(()=>{location.href=campHref(next);},650);return f;}
      else{camp.done=true;camp.at='origin';campStore();o.title='LAST TRANSMISSION';o.buttons=[{text:'Back to the menu',href:'index.html',primary:true},{text:'Keep flying',close:true}];}}const best=save.best[run.chapter]||0,isBest=run.score>best;if(isBest){save.best[run.chapter]=run.score;store();}
    if(run.score>=50000)ach('command');
    const el=document.createElement('div');el.className='pgend';
    const li=run.chal.map(c=>`<li class="${c.state==='done'?'done':'miss'}"><span>${c.state==='done'?'✓':'✗'} ${c.text}</span><span>${c.state==='done'?'+'+c.pts:'—'}</span></li>`).join('');
    const al=run.newAch.map(a=>`<li class="done"><span>★ ${a.name}</span><span>+${a.marks} marks</span></li>`).join('');
    el.innerHTML=`<div class="card"><h2>${o.title}</h2><p>${o.text||''}</p>
      <div class="tot"><div><b>${run.score.toLocaleString()}</b><span>${isBest?'New best':'Score'}</span></div><div><b>${Math.max(best,run.score).toLocaleString()}</b><span>Best</span></div><div><b>${marks()}</b><span>Marks</span></div></div>
      ${li?`<h3>Challenges</h3><ul>${li}</ul>`:''}${al?`<h3>Achievements unlocked</h3><ul>${al}</ul>`:''}
      <div class="row">${(o.buttons||[]).map((b,i)=>b.href?`<a class="${b.primary?'primary':''}" href="${b.href}">${b.text}</a>`:`<button type="button" data-i="${i}" class="${b.primary?'primary':''}">${b.text}</button>`).join('')}</div></div>`;
    el.querySelectorAll('button[data-i]').forEach(btn=>btn.addEventListener('click',()=>{const b=o.buttons[+btn.dataset.i];if(b.close)el.remove();if(b.onClick)b.onClick();}));
    document.body.appendChild(el);
    try{if(document.exitPointerLock)document.exitPointerLock();}catch(_){}
    const au=(o.buttons||[]).find(b=>b.auto&&b.href);if(au){const a=el.querySelector('a.primary');let n=au.auto;const base=a.textContent;
      const tick=()=>{if(!a.isConnected)return;if(n<=0){location.href=au.href;return;}a.textContent=base+' ('+n+')';n--;tt=setTimeout(tick,1000);};let tt=setTimeout(tick,0);
      // touching anything else on the card stops the count
      el.addEventListener('pointerdown',e=>{if(e.target!==a){clearTimeout(tt);a.textContent=base;}},{capture:true});}
    return el;
  }
  /* ---------- the mission screen (before every chapter): Keeper Command at night, painted in code while the chapter loads.
     Officers at their consoles and around the holo table, the city and the Spear through the long window, the brief and the first
     objective, and the controls for this device. No threat level here (it is picked on the menu, and lives in the pause menu).
     In Last Transmission, a part reached straight from the one before starts on its own once loading is done (no menu, no stats). */
  let paused=false;
  const KICK={origin:['LAST TRANSMISSION','The Mountain'],astraea:['LAST TRANSMISSION','The Heralds'],tide:['LAST TRANSMISSION','The Empty Sky'],pathfinder:['PATHFINDER','Arc 01']};
  function hqPainter(cv){
    const x=cv.getContext('2d'),still=matchMedia('(prefers-reduced-motion: reduce)').matches;let W=0,H=0,dpr=1,raf=0,t0=performance.now();
    const rnd=(()=>{let a=2237;return()=>{a=(a*16807)%2147483647;return a/2147483647;};})();
    const stars=Array.from({length:160},()=>({x:rnd(),y:rnd()*.62,s:rnd()*1.2+.3,p:rnd()*6}));
    const city=Array.from({length:70},(_,i)=>({x:i/70+rnd()*.01,w:.006+rnd()*.012,h:.03+Math.pow(rnd(),2.2)*.16}));
    const wins=city.map(b=>Array.from({length:Math.round(b.h*160)},()=>({u:rnd(),v:rnd(),on:rnd()<.45,f:rnd()<.05})));
    // people: x across the room (0..1), depth (0 far .. 1 near), which way they lean, at a console or the table, a walker
    const PEOPLE=[{x:.1,d:.55,c:1},{x:.2,d:.42,c:1},{x:.3,d:.32,c:1},{x:.71,d:.3,c:1},{x:.8,d:.43,c:1},{x:.9,d:.57,c:1},
      {x:.43,d:.2,t:1},{x:.585,d:.22,t:1},{x:.66,d:.86,t:1,big:1},{x:0,d:.12,walk:1}];
    function size(){dpr=Math.min(devicePixelRatio||1,2);W=cv.width=cv.clientWidth*dpr;H=cv.height=cv.clientHeight*dpr;}
    function person(px,py,sc,lean,glowC,glowK){const h=H*.27*sc,w=h*.27;x.save();x.translate(px,py);x.rotate(lean);
      x.fillStyle='#05070b';x.beginPath();x.ellipse(0,-h*.88,w*.28,w*.33,0,0,7);x.fill();   // head
      x.beginPath();x.moveTo(-w*.5,-h*.76);x.quadraticCurveTo(-w*.62,-h*.5,-w*.42,-h*.05);x.lineTo(w*.42,-h*.05);x.quadraticCurveTo(w*.62,-h*.5,w*.5,-h*.76);x.closePath();x.fill();   // coat
      x.fillRect(-w*.32,-h*.08,w*.26,h*.08);x.fillRect(w*.06,-h*.08,w*.26,h*.08);
      if(glowK>0){x.strokeStyle=glowC;x.globalAlpha=glowK;x.lineWidth=Math.max(1,w*.05);x.beginPath();x.moveTo(-w*.48,-h*.74);x.quadraticCurveTo(-w*.6,-h*.5,-w*.4,-h*.08);x.stroke();
        x.beginPath();x.arc(0,-h*.88,w*.29,Math.PI*.6,Math.PI*1.4);x.stroke();x.globalAlpha=1;}
      x.restore();}
    function drawPeople(T,d0,d1){for(const P of[...PEOPLE].sort((a,b)=>a.d-b.d)){if(P.d<d0||P.d>=d1)continue;const sc=.55+P.d*.75,py=H*(.62+P.d*.3);let px=P.x*W,lean=Math.sin(T*.6+P.x*20)*.012;
        if(P.walk){px=((T*.025)%1.2-.1)*W;lean=Math.sin(T*5)*.03;}
        if(P.c)lean+=(P.x<.5?-.05:.05);
        const glowK=P.t?.55:P.c?.35:.1;person(px,py,sc*(P.big?1.15:1),lean,'rgba(127,227,255,1)',glowK);}}
    function frame(now){const T=(now-t0)/1000;x.setTransform(1,0,0,1,0,0);
      // the room
      let g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#05070d');g.addColorStop(.6,'#0a0f1a');g.addColorStop(1,'#03050a');x.fillStyle=g;x.fillRect(0,0,W,H);
      // the long window: night sky, sea, Tide City, the Spear
      const wy0=H*.08,wy1=H*.5,hz=H*.4;
      g=x.createLinearGradient(0,wy0,0,hz);g.addColorStop(0,'#03050c');g.addColorStop(1,'#14203a');x.fillStyle=g;x.fillRect(0,wy0,W,hz-wy0);
      for(const s of stars){const a=.35+.35*Math.sin(T*.8+s.p);x.fillStyle=`rgba(220,230,255,${a})`;x.fillRect(s.x*W,wy0+s.y*(hz-wy0),s.s*dpr,s.s*dpr);}
      g=x.createLinearGradient(0,hz,0,wy1);g.addColorStop(0,'#0c1830');g.addColorStop(1,'#03060c');x.fillStyle=g;x.fillRect(0,hz,W,wy1-hz);
      for(let i=0;i<26;i++){const yy=hz+(i/26)*(wy1-hz),k=(i/26);x.fillStyle=`rgba(150,190,255,${.05*(1-k)})`;x.fillRect(((Math.sin(T*.4+i)*.5+.5)*W*.3)+i*W*.03,yy,W*(.06+k*.08),dpr);}
      for(let i=0;i<city.length;i++){const b=city[i],bx=b.x*W,bw=b.w*W,bh=b.h*H;x.fillStyle='#070b14';x.fillRect(bx,hz-bh,bw,bh);
        for(const w0 of wins[i]){if(!w0.on)continue;const fl=w0.f?(Math.sin(T*3+w0.u*9)>0?1:.2):1;x.fillStyle=`rgba(255,210,140,${.55*fl})`;x.fillRect(bx+w0.u*bw*.9,hz-bh+w0.v*bh*.95,dpr*1.6,dpr*1.6);}}
      const spx=W*.555,top=hz-H*.3;x.fillStyle='#0b0e16';x.beginPath();x.moveTo(spx-W*.006,hz);x.lineTo(spx-W*.0015,top);x.lineTo(spx+W*.0015,top);x.lineTo(spx+W*.006,hz);x.fill();x.strokeStyle=`rgba(255,200,110,${.35+.25*Math.sin(T*1.3)})`;x.lineWidth=dpr;x.beginPath();x.moveTo(spx,hz);x.lineTo(spx,top);x.stroke();x.fillStyle='#c9a24e';x.beginPath();x.moveTo(spx,top-H*.04);x.lineTo(spx-W*.004,top);x.lineTo(spx+W*.004,top);x.fill();
      const pulse=.55+.25*Math.sin(T*1.3);g=x.createRadialGradient(spx,top,0,spx,top,H*.06);g.addColorStop(0,`rgba(255,220,140,${pulse})`);g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.fillRect(spx-H*.06,top-H*.06,H*.12,H*.12);
      // window frame: mullions, sill
      x.fillStyle='#04060a';for(let i=0;i<=8;i++){const mx=i/8*W;x.fillRect(mx-W*.004,wy0,W*.008,wy1-wy0);}x.fillRect(0,wy0-H*.02,W,H*.02);x.fillRect(0,wy1,W,H*.03);
      x.fillStyle='rgba(127,227,255,.10)';x.fillRect(0,wy1,W,dpr);
      drawPeople(T,0,.3);   // the far ones stand behind the table and its hologram
      // the floor and the holo table
      const tx=W*.505,ty=H*.74,tr=W*.14;
      g=x.createRadialGradient(tx,ty,0,tx,ty,tr*2.2);g.addColorStop(0,'rgba(80,190,230,.18)');g.addColorStop(1,'rgba(80,190,230,0)');x.fillStyle=g;x.fillRect(0,H*.5,W,H*.5);
      x.fillStyle='#0a1018';x.beginPath();x.ellipse(tx,ty,tr,tr*.22,0,0,7);x.fill();x.strokeStyle='rgba(127,227,255,.55)';x.lineWidth=1.5*dpr;x.stroke();
      // the hologram: Elyra turning, a ring around it, a beam up from the table
      g=x.createLinearGradient(0,ty-H*.25,0,ty);g.addColorStop(0,'rgba(127,227,255,0)');g.addColorStop(1,'rgba(127,227,255,.18)');x.fillStyle=g;x.beginPath();x.moveTo(tx-tr*.6,ty);x.lineTo(tx-tr*.3,ty-H*.25);x.lineTo(tx+tr*.3,ty-H*.25);x.lineTo(tx+tr*.6,ty);x.fill();
      const pr=H*.065,py=ty-H*.16;x.strokeStyle='rgba(150,235,255,.55)';x.lineWidth=dpr;x.beginPath();x.arc(tx,py,pr,0,7);x.stroke();
      for(let k=-2;k<=2;k++){x.beginPath();x.ellipse(tx,py+k*pr*.38,Math.sqrt(1-(k*.38)**2)*pr,pr*.12,0,0,7);x.stroke();}
      for(let k=0;k<6;k++){const a=T*.4+k*Math.PI/6,c=Math.cos(a);x.beginPath();x.ellipse(tx,py,Math.abs(c)*pr,pr,0,0,7);x.globalAlpha=.25+.3*Math.abs(c);x.stroke();}x.globalAlpha=1;
      x.strokeStyle='rgba(255,210,122,.6)';x.beginPath();x.ellipse(tx,py,pr*1.6,pr*.32,Math.sin(T*.2)*.1,0,7);x.stroke();
      const bl=(T*.7)%(Math.PI*2);x.fillStyle='#ffd27a';x.fillRect(tx+Math.cos(bl)*pr*1.6-2*dpr,py+Math.sin(bl)*pr*.32-2*dpr,4*dpr,4*dpr);
      // consoles along both walls, their screens lighting whoever stands at them
      for(const s of[-1,1])for(let i=0;i<3;i++){const cx=s<0?W*(.1+i*.1):W*(.9-i*.1),d=[.55,.42,.32][i],cy=H*(.62+d*.22),cw=W*.07*(.6+d),chh=H*.05*(.6+d);
        x.fillStyle='#070a10';x.fillRect(cx-cw/2,cy-chh*.2,cw,chh);const fl=.6+.4*Math.sin(T*2+i*3+s);
        g=x.createLinearGradient(cx,cy-chh*1.2,cx,cy);g.addColorStop(0,'rgba(127,227,255,0)');g.addColorStop(1,`rgba(127,227,255,${.25*fl})`);x.fillStyle=g;x.fillRect(cx-cw/2,cy-chh*1.4,cw,chh*1.2);
        x.fillStyle=`rgba(127,227,255,${.5*fl})`;x.fillRect(cx-cw*.42,cy-chh*.15,cw*.84,chh*.18);}
      drawPeople(T,.3,2);
      // vignette, scan lines
      g=x.createRadialGradient(W/2,H*.5,H*.2,W/2,H*.5,W*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.75)');x.fillStyle=g;x.fillRect(0,0,W,H);
      x.fillStyle='rgba(255,255,255,.025)';for(let y=0;y<H;y+=3*dpr)x.fillRect(0,y,W,dpr*.6);
      if(!still)raf=requestAnimationFrame(frame);}
    size();addEventListener('resize',size);raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',size);};}
  function briefing(o){
    if(!ui)css();paused=true;
    const touch=typeof coarse!=='undefined'&&coarse,ch=run&&run.chapter,K=KICK[ch]||['ELYRA','THE HOLLOW'];
    let chain=false;try{chain=inCampaign&&sessionStorage.getItem('elyra.chain')===ch;sessionStorage.removeItem('elyra.chain');}catch(_){}
    const part=ORDER.indexOf(ch),kick=K[0]+(part>=0?' · PART '+(part+1)+' OF 3':' · '+K[1].toUpperCase());
    const text=(o.text||'').replace(/\s*Threat level:[^.]*\.\s*$/,'');
    const dl=rows=>'<dl>'+rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')+'</dl>';
    const el=document.createElement('div');el.className='pghq';
    el.innerHTML=`<canvas></canvas><div class="hqtop"><span>KEEPER COMMAND · TIDE CITY</span><span>${kick}</span></div>
      <div class="hqbrief"><div class="k">${kick}</div><h2>${o.title}</h2><p>${text}</p>${o.objective?`<div class="ob"><b>FIRST OBJECTIVE</b>${o.objective}</div>`:''}
        <div class="th">THREAT LEVEL · ${diff().name.toUpperCase()} <small>(change it on the menu or in pause)</small></div></div>
      <div class="hqctl"><div class="hd"><b>CONTROLS · ${touch?'PHONE':'PC'}</b><button type="button" class="sw">${touch?'PC':'Phone'} controls</button></div><div class="ls">${dl(touch?o.phone:o.pc)}</div></div>
      <div class="hqgo"><div class="bar"><i></i></div><button type="button" id="pgStart" disabled>Syncing archive…</button></div>`;
    document.body.appendChild(el);
    const stop=hqPainter(el.querySelector('canvas'));
    let other=false;el.querySelector('.sw').addEventListener('click',()=>{other=!other;const ph=other?!touch:touch;el.querySelector('.hd b').textContent='CONTROLS · '+(ph?'PHONE':'PC');
      el.querySelector('.sw').textContent=(ph?'PC':'Phone')+' controls';el.querySelector('.ls').innerHTML=dl(ph?o.phone:o.pc);});
    let ready=false;const b=el.querySelector('#pgStart'),bar=el.querySelector('.bar i'),t0=performance.now(),MIN=chain?1600:1300;
    const go=()=>{if(!paused||!ready)return;paused=false;stop();el.classList.add('out');setTimeout(()=>el.remove(),500);removeEventListener('keydown',key,true);if(o.onStart)o.onStart();};
    (function load(){const k=Math.min(1,(performance.now()-t0)/MIN)*(document.readyState==='complete'?1:.85);bar.style.width=(k*100)+'%';
      if(k>=1){ready=true;b.disabled=false;b.textContent=chain?'Continuing…':(touch?'Tap to begin':'Begin  ·  Enter');if(chain)setTimeout(go,350);return;}requestAnimationFrame(load);})();
    const key=e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopPropagation();go();}};
    addEventListener('keydown',key,true);
    b.addEventListener('click',go);
    return go;
  }
  // radio: a speaker line at the bottom centre; `tone` is '', 'enemy' (Hollow King) or 'alert'
  let commsEl=null,commsTimer=0;
  function say(who,text,tone,dur){
    if(!ui&&!commsEl)css();
    if(!commsEl){commsEl=document.createElement('div');commsEl.className='pgcomms';commsEl.innerHTML='<b></b><span></span>';document.body.appendChild(commsEl);}
    commsEl.querySelector('b').textContent=who;commsEl.querySelector('span').textContent=text;
    commsEl.className='pgcomms on'+(tone?' '+tone:'');clearTimeout(commsTimer);commsTimer=setTimeout(()=>commsEl.classList.remove('on'),(dur||6.5)*1000);
  }
  // during combat only the score, objective and challenge pop-ups show; the full list comes back between fights and at the end
  function combat(on){if(ui)ui.el.classList.toggle('fight',!!on);}
  return{campaign,campStart,campHref,inCampaign,CAMP_NAME:NAME,DIFFS,diff,setDiff,combat,say,briefing,get paused(){return paused;},set paused(v){paused=v;},TEST_UNLOCK_ALL,ACH,PAINTS,init,add,kill,tick,objective,done,prog,fail,ach,stat,finish,paint,setPaint,marks,paintOK,get save(){return save;},get run(){return run;},reload(){save=load();}};
})();
// the difficulty this chapter loaded with: DIFF.space / DIFF.tide hold the numbers
const DIFF=PG.diff();
