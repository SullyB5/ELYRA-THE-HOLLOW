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
    {id:'pathfinder',name:'What We Stole',desc:'Complete Pathfinder Arc 01.',marks:50},
    {id:'deadground',name:'Dead Ground',desc:'Complete Pathfinder Arc 02.',marks:50},
    {id:'whitecity',name:'The White City',desc:'Complete Pathfinder Arc 03. Unlocks recovered footage 07.',marks:60},
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
.pghq.out{opacity:0;pointer-events:none}.pghq .bg{position:absolute;inset:-2%;background:#03050a center/cover no-repeat;animation:hqZoom 40s ease-out forwards}
.pghq .shade{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 40%,rgba(0,0,0,.7) 100%),linear-gradient(0deg,rgba(3,5,10,.75),rgba(3,5,10,0) 45%),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px)}
.pghq .live{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 1.2s}.pghq .live.on{opacity:1}
@keyframes hqZoom{from{transform:scale(1.06)}to{transform:scale(1)}}@media (prefers-reduced-motion:reduce){.pghq .bg{animation:none}}
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
  /* ---------- the campaigns: a finished mission's parts played in a row, no stops (index.html starts one; each part's page carries
     ?campaign=1 for Last Transmission, ?campaign=pf for Pathfinder). Progress is saved at the start of each part, so Continue on the
     menu picks up from the one you were on.
       last · LAST TRANSMISSION: The Mountain → The Heralds → The Empty Sky
       pf   · PATHFINDER (Oct 22, finished with Arc 03): Site K → Dead Ground → The White City ---------- */
  const CAMPS={
    last:{q:'1',key:'elyra.campaign',title:'LAST TRANSMISSION',order:['origin','astraea','tide'],page:{origin:'origin.html',astraea:'space.html',tide:'tide-city.html'},
      name:{origin:'The Mountain',astraea:'The Heralds',tide:'The Empty Sky'}},
    pf:{q:'pf',key:'elyra.campaign.pf',title:'PATHFINDER',order:['pathfinder','pathfinder2','pathfinder3'],page:{pathfinder:'pathfinder.html',pathfinder2:'pathfinder-2.html',pathfinder3:'pathfinder-3.html'},
      name:{pathfinder:'Site K',pathfinder2:'Dead Ground',pathfinder3:'The White City'}}};
  const campOf=ch=>Object.keys(CAMPS).find(k=>CAMPS[k].order.includes(ch))||'last';
  const ORDER=CAMPS.last.order,NAME=CAMPS.last.name;
  const qCamp=(location.search.match(/[?&]campaign=(\w+)/)||[])[1]||'';
  const CUR=Object.keys(CAMPS).find(k=>CAMPS[k].q===qCamp)||null;   // the campaign this page was opened in, if any
  const inCampaign=!!CUR;
  const camps={};for(const k in CAMPS){try{camps[k]=JSON.parse(localStorage.getItem(CAMPS[k].key)||'null');}catch(_){camps[k]=null;}}
  let camp=CUR?camps[CUR]:camps.last;
  function campStore(id){const k=id||CUR||'last';try{localStorage.setItem(CAMPS[k].key,JSON.stringify(camps[k]));}catch(_){}}
  function campaign(id){return camps[id||'last'];}
  function campStart(id){id=id||'last';const C=CAMPS[id];camps[id]={at:C.order[0],done:false,started:Date.now()};campStore(id);if(id===(CUR||'last'))camp=camps[id];return C.page[C.order[0]]+'?campaign='+C.q;}
  function campHref(ch,id){id=id||campOf(ch);const C=CAMPS[id];return C.page[ch]+'?campaign='+C.q;}
  function campSet(id,at){camps[id]=Object.assign(camps[id]||{started:Date.now()},{at,done:false});campStore(id);}
  function init(chapter,opts){
    if(inCampaign){if(!camps[CUR])camps[CUR]={at:chapter,done:false,started:Date.now()};camp=camps[CUR];camp.at=chapter;campStore(CUR);}
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
    if(inCampaign){const C=CAMPS[CUR],i=C.order.indexOf(run.chapter),next=C.order[i+1];
      if(o.lost)o.buttons=[{text:'Try again',onClick:()=>location.reload(),primary:true},{text:'Menu',href:'index.html'}];
      else if(next){const best=save.best[run.chapter]||0;if(run.score>best){save.best[run.chapter]=run.score;store();}if(run.score>=50000)ach('command');
        camp.at=next;campStore(CUR);try{sessionStorage.setItem('elyra.chain',next);}catch(_){}
        const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:9;background:#000;opacity:0;transition:opacity .6s';document.body.appendChild(f);
        requestAnimationFrame(()=>f.style.opacity=1);setTimeout(()=>{location.href=campHref(next);},650);return f;}
      // the last part: the whole mission's card. (Pathfinder keeps its own buttons: they lead on to the footage it unlocks)
      else{camp.done=true;camp.at=C.order[0];campStore(CUR);o.title=C.title;if(CUR==='last')o.buttons=[{text:'Back to the menu',href:'index.html',primary:true},{text:'Keep flying',close:true}];}}const best=save.best[run.chapter]||0,isBest=run.score>best;if(isBest){save.best[run.chapter]=run.score;store();}
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
  // warm-up jobs a chapter registers (PG.warm(fn)); the loading screen runs them before Begin unlocks
  const WARM=[];
  const KICK={origin:['LAST TRANSMISSION','The Mountain'],astraea:['LAST TRANSMISSION','The Heralds'],tide:['LAST TRANSMISSION','The Empty Sky'],pathfinder:['PATHFINDER','Site K'],pathfinder2:['PATHFINDER','Dead Ground'],pathfinder3:['PATHFINDER','The White City']};
  /* Keeper Command, alive: the painted still turned into a slow 2.5D shot while the chapter loads.
     A depth map (img/hq-loading-depth.png, white = near) lets one WebGL quad dolly side to side with real parallax
     (the marines and the holo table slide over the floor, the city stays put behind the glass), and the shader adds
     the moving parts: the dome turning, a blip riding its ring, a ripple off the pad, the city's windows, dust in the light.
     It is one fullscreen quad, so it doesn't fight the level's loading; it stops and frees its GL context when the mission starts.
     No WebGL (or it fails) → the CSS still underneath stays. */
  function hqLive(host,src){
    let cv,gl;try{cv=document.createElement('canvas');cv.className='live';
      gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power',preserveDrawingBuffer:false});}catch(_){gl=null;}
    if(!gl)return()=>{};
    const VS='attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    const FS=`precision highp float;varying vec2 v;uniform sampler2D T,D;uniform vec2 R,C;uniform float A,Z,t,M;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 px(vec2 q){return vec2(q.x*1920.,(1.-q.y)*1080.);}
float ell(vec2 p,vec2 c,vec2 r,float a){p-=c;float s=sin(a),k=cos(a);p=vec2(k*p.x+s*p.y,-s*p.x+k*p.y);return length(p/r);}
void main(){
  float sa=R.x/R.y;vec2 s=sa>A?vec2(1.,A/sa):vec2(sa/A,1.);
  vec2 uv=(v-.5)*s/Z+.5,q=uv;
  for(int i=0;i<6;i++){float d=texture2D(D,q).r;q=uv-C*(d-.32);}
  q=clamp(q,vec2(.001),vec2(.999));
  vec3 c=texture2D(T,q).rgb;vec2 P=px(q);float L=dot(c,vec3(.3,.59,.11));
  // the light breathes; now and then a ceiling strip stutters
  c*=1.+.025*sin(t*1.3);
  float fl=step(.985,h(vec2(floor(t*7.),3.)));if(P.y<330.&&L>.8)c*=1.-.35*fl;
  // the city: lit windows flicker on their own clocks
  if(P.x>735.&&P.x<1870.&&P.y>420.&&P.y<600.&&abs(P.x-925.)>235.&&c.r>c.b&&L>.4){vec2 cell=floor(P/vec2(6.,5.));c*=.75+.3*step(.18,h(cell+floor(t*.5+h(cell)*7.)));}
  // the dome: meridians and a scan band turning over the painted grid
  vec2 sp=(P-vec2(925.,485.))/132.;float r2=dot(sp,sp);
  if(r2<1.){float z=sqrt(1.-r2);float lon=atan(sp.x,z)+t*.45;float lat=asin(clamp(-sp.y,-1.,1.));
    float mer=smoothstep(.93,1.,abs(cos(lon*6.)))*z;float band=exp(-pow((lat-sin(t*.7)*1.2)*7.,2.));
    c+=vec3(.45,.9,1.)*(mer*.28+band*.22+.05*sin(t*2.)+.05)*z*M;}
  // a blip riding the ring; hidden while it is behind the dome
  float a=t*.9;vec2 bp=vec2(922.,478.)+vec2(cos(a)*205.,sin(a)*40.);float cs=cos(-.21),sn=sin(-.21);
  bp=vec2(922.,478.)+mat2(cs,sn,-sn,cs)*(bp-vec2(922.,478.));
  float behind=step(0.,-sin(a))*step(length((bp-vec2(925.,485.))/132.),1.);
  c+=vec3(.6,1.,.95)*exp(-dot(P-bp,P-bp)/40.)*1.2*(1.-behind)*M;
  // the pad: its rim pulses, a ripple runs out over the floor every few seconds
  float e=ell(P,vec2(925.,680.),vec2(292.,48.),0.);
  c+=vec3(.5,.9,1.)*exp(-pow((e-1.)*9.,2.))*(.12+.1*sin(t*2.6))*M;
  float rp=fract(t/4.2);c+=vec3(.4,.85,1.)*exp(-pow((e-1.-rp*1.4)*14.,2.))*(1.-rp)*.22*step(1.,e)*step(P.y,1000.)*M;
  // the beam under the dome shimmers
  if(P.y>560.&&P.y<690.&&abs(P.x-925.)<(P.y-540.)*1.3)c+=vec3(.3,.7,.9)*(.04+.04*sin(P.y*.08-t*5.))*M;
  // dust drifting through the light, in screen space at two depths
  for(int k=0;k<2;k++){float fk=float(k);vec2 g=v*vec2(48.,27.)*(1.+fk*.6)+vec2(t*(.08+fk*.05),-t*(.12+fk*.06))+C*(8.+fk*14.);
    vec2 id=floor(g),f=fract(g)-.5;float on=step(.965,h(id+fk*17.));vec2 o=vec2(h(id+1.3),h(id+7.1))-.5;
    c+=vec3(.75,.9,1.)*on*exp(-dot(f-o*.6,f-o*.6)*90.)*(.12+.08*sin(t*1.7+h(id)*6.))*M;}
  gl_FragColor=vec4(c,1.);
}`;
    const sh=(ty,s)=>{const o=gl.createShader(ty);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(o);return o;};
    let pr;try{pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
      if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw gl.getProgramInfoLog(pr);}catch(e){console.warn('hq live',e);return()=>{};}
    gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const ap=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,2,gl.FLOAT,false,0,0);
    const U={};['T','D','R','C','A','Z','t','M'].forEach(k=>U[k]=gl.getUniformLocation(pr,k));gl.uniform1i(U.T,0);gl.uniform1i(U.D,1);gl.uniform1f(U.A,16/9);
    const tex=(unit,url)=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>{const x=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,x);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);
      [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(w=>gl.texParameteri(gl.TEXTURE_2D,w,gl.CLAMP_TO_EDGE));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);ok();};im.onerror=no;im.src=url;});
    let low=false;try{low=localStorage.getItem('elyra.quality')==='low';}catch(_){}
    const coarseP=matchMedia('(pointer:coarse)').matches,still=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const dpr=Math.min(devicePixelRatio||1,low?1:(coarseP?1.25:1.5));
    const size=()=>{cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);gl.viewport(0,0,cv.width,cv.height);gl.uniform2f(U.R,cv.width,cv.height);};
    let raf=0,dead=false,t0=0,mx=0,my=0,sx=0,sy=0;
    const pm=e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;};
    if(!coarseP)host.addEventListener('pointermove',pm);
    addEventListener('resize',size);
    const frame=now=>{if(dead)return;if(!t0)t0=now;const t=(now-t0)/1000;
      sx+=(mx-sx)*.04;sy+=(my-sy)*.04;
      // the dolly: a slow sway across the room with a push in, plus a little of the mouse
      const k=still?0:1,cx=k*(Math.sin(t*Math.PI*2/16)*.022+sx*.012),cy=k*(Math.sin(t*Math.PI*2/23)*.006-sy*.008);
      const z=1.13-(still?0:.05*Math.min(1,t/40)*(2-Math.min(1,t/40)));
      gl.uniform2f(U.C,cx,cy);gl.uniform1f(U.Z,z);gl.uniform1f(U.t,still?0:t);gl.uniform1f(U.M,Math.min(1,t/1.5));
      gl.drawArrays(gl.TRIANGLES,0,3);if(t<.2)cv.classList.add('on');raf=requestAnimationFrame(frame);};
    Promise.all([tex(0,src),tex(1,'img/hq-loading-depth.png')]).then(()=>{if(dead)return;size();host.querySelector('.bg').after(cv);raf=requestAnimationFrame(frame);})
      .catch(e=>console.warn('hq live',e));
    return()=>{if(dead)return;dead=true;cancelAnimationFrame(raf);removeEventListener('resize',size);host.removeEventListener('pointermove',pm);
      setTimeout(()=>{try{const x=gl.getExtension('WEBGL_lose_context');if(x)x.loseContext();}catch(_){}cv.remove();},520);};
  }
  /* compile() only builds the shader programs. The first real draw still has to upload every mesh and texture to the GPU, build the
     shadow-pass and bloom shaders, and (Chrome on Windows) finish the driver's own shader compile, which it puts off until a program
     is first drawn with. That all landed on the first frame after Begin: the lag spike going in. So, behind the loading screen, draw
     one frame with every hidden thing shown and nothing culled, then put it all back. Lights keep the visibility they really have,
     so the light count (part of every lit shader) is the one play starts with. */
  function warmDraw(){
    if(typeof renderer==='undefined'||typeof scene==='undefined'||typeof camera==='undefined')return;
    const shown=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
    const lights=[],hid=[],cull=[];
    scene.traverse(o=>{if(o.isLight)lights.push([o,o.visible,shown(o)]);});
    scene.traverse(o=>{if(o.isLight)return;if(!o.visible){hid.push(o);o.visible=true;}if(o.frustumCulled&&(o.isMesh||o.isPoints||o.isSprite||o.isLine)){cull.push(o);o.frustumCulled=false;}});
    for(const [l,,on] of lights)l.visible=on;
    try{if(typeof renderFrame==='function')renderFrame();else renderer.render(scene,camera);}catch(e){console.warn('warm draw',e);}
    for(const o of hid)o.visible=false;for(const o of cull)o.frustumCulled=true;for(const [l,v] of lights)l.visible=v;
  }
  function briefing(o){
    if(!ui)css();paused=true;
    const touch=typeof coarse!=='undefined'&&coarse,ch=run&&run.chapter,K=KICK[ch]||['ELYRA','THE HOLLOW'];
    let chain=false;try{chain=inCampaign&&sessionStorage.getItem('elyra.chain')===ch;sessionStorage.removeItem('elyra.chain');}catch(_){}
    const CO=CAMPS[campOf(ch)].order,part=CO.indexOf(ch),kick=K[0]+(part>=0?' · PART '+(part+1)+' OF '+CO.length:' · '+K[1].toUpperCase());
    const text=(o.text||'').replace(/\s*Threat level:[^.]*\.\s*$/,'');
    const dl=rows=>'<dl>'+rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')+'</dl>';
    const el=document.createElement('div');el.className='pghq';
    el.innerHTML=`<div class="bg"></div><div class="shade"></div><div class="hqtop"><span>KEEPER COMMAND · TIDE CITY</span><span>${kick}</span></div>
      <div class="hqbrief"><div class="k">${kick}</div><h2>${o.title}</h2><p>${text}</p>${o.objective?`<div class="ob"><b>FIRST OBJECTIVE</b>${o.objective}</div>`:''}
        <div class="th">THREAT LEVEL · ${diff().name.toUpperCase()} <small>(change it on the menu or in pause)</small></div></div>
      <div class="hqctl"><div class="hd"><b>CONTROLS · ${touch?'PHONE':'PC'}</b><button type="button" class="sw">${touch?'PC':'Phone'} controls</button></div><div class="ls">${dl(touch?o.phone:o.pc)}</div></div>
      <div class="hqgo"><div class="bar"><i></i></div><button type="button" id="pgStart" disabled>Syncing archive…</button></div>`;
    document.body.appendChild(el);
    {const bt=document.getElementById('boot');if(bt)setTimeout(()=>bt.remove(),60);}   // the static cover the page opened with
    // Keeper Command, rendered from the game's own deck (Bryce's marines, engineers and Elias round the holo table); the phone gets the smaller file.
    // The still sits underneath; hqLive lays the moving 2.5D version over it once both textures are in.
    const hqSrc=`img/hq-loading-${touch?'phone':'pc'}.webp`;
    el.querySelector('.bg').style.backgroundImage=`url(${hqSrc})`;
    const stop=hqLive(el,hqSrc);
    let other=false;el.querySelector('.sw').addEventListener('click',()=>{other=!other;const ph=other?!touch:touch;el.querySelector('.hd b').textContent='CONTROLS · '+(ph?'PHONE':'PC');
      el.querySelector('.sw').textContent=(ph?'PC':'Phone')+' controls';el.querySelector('.ls').innerHTML=dl(ph?o.phone:o.pc);});
    let ready=false;const b=el.querySelector('#pgStart'),bar=el.querySelector('.bar i'),t0=performance.now(),MIN=chain?1600:1300;
    const go=()=>{if(!paused||!ready)return;paused=false;stop();el.classList.add('out');setTimeout(()=>el.remove(),500);removeEventListener('keydown',key,true);if(o.onStart)o.onStart();};
    // loading: the page's scripts, then the models (so they are not rigged mid-fight), then the warm-up jobs the chapter registered
    // (building cutscene sets, compiling every shader once) one per frame, so the first seconds of play don't stall
    const done=()=>{ready=true;bar.style.width='100%';b.disabled=false;b.textContent=chain?'Continuing…':(touch?'Tap to begin':'Begin  ·  Enter');if(chain)setTimeout(go,350);};
    const warm=()=>{b.textContent='Preparing…';const jobs=WARM.splice(0);let i=0;
      jobs.push(()=>{if(typeof renderer!=='undefined'&&typeof scene!=='undefined'&&typeof camera!=='undefined'&&renderer.compile)renderer.compile(scene,camera);});   // every shader in the level, once
      jobs.push(warmDraw);   // then one real frame of everything, so nothing is left for the first frame of play
      const nextJob=()=>{if(i>=jobs.length){done();return;}bar.style.width=(88+12*i/jobs.length)+'%';try{jobs[i++]();}catch(e){console.warn('warm',e);}setTimeout(nextJob,30);};nextJob();};
    (function load(){const k=Math.min(1,(performance.now()-t0)/MIN)*(document.readyState==='complete'?1:.85);bar.style.width=(k*80)+'%';
      if(k>=1){b.textContent='Loading models…';const M=typeof MODELS!=='undefined'&&MODELS.idle?MODELS.idle(9000):Promise.resolve();M.then(()=>setTimeout(warm,30));return;}requestAnimationFrame(load);})();
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
  return{warm:f=>WARM.push(f),campaign,campStart,campHref,campSet,CAMPS,inCampaign,CAMP_NAME:NAME,DIFFS,diff,setDiff,combat,say,briefing,get paused(){return paused;},set paused(v){paused=v;},TEST_UNLOCK_ALL,ACH,PAINTS,init,add,kill,tick,objective,done,prog,fail,ach,stat,finish,paint,setPaint,marks,paintOK,get save(){return save;},get run(){return run;},reload(){save=load();}};
})();
// the difficulty this chapter loaded with: DIFF.space / DIFF.tide hold the numbers
const DIFF=PG.diff();
