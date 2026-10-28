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
    {id:'lastsignal',name:'The Last Signal',desc:'Bring Captain Rhen and his crew out of the Host’s cells, with the device (Level 05).',marks:50},
    {id:'astraea',name:'Survivor of Astraea',desc:'Complete The Heralds, the second part of The First Word (Level 06).',marks:50},
    {id:'centurion',name:'Centurion',desc:'Down 100 enemies (all runs).',marks:60},
    {id:'gunner',name:'Sea Gunner',desc:'Hit a capital ship from a sea cannon.',marks:20},
    {id:'skyguard',name:'Skyguard',desc:'Down 10 fighters over Tide City in one run.',marks:30},
    {id:'shipkiller',name:'Shipkiller',desc:'Bring down a capital ship yourself in Tide City.',marks:50},
    {id:'tideholds',name:'Tide City Holds',desc:'Win the battle for Tide City.',marks:60},
    {id:'origin',name:'It Was a Trap',desc:'Complete The Mountain (Level 04).',marks:50},
    {id:'breaker',name:'Breaker',desc:'Destroy 3 Hollow turrets in one run.',marks:30},
    {id:'command',name:'High Command',desc:'Score 50,000 in one chapter.',marks:60},
    {id:'pathfinder',name:'What We Stole',desc:'Complete Site K (Level 01).',marks:50},
    {id:'deadground',name:'Dead Ground',desc:'Complete Dead Ground (Level 02).',marks:50},
    {id:'whitecity',name:'The White City',desc:'Complete The White City (Level 03). Unlocks recovered footage 07.',marks:60},
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
  /* ---------- Remnant Marks: a ledger, ready for a shop (Oct 23).
     earned = achievement marks + any granted marks (save.wallet.bonus); spent = what the shop has taken; marks() = the balance you can spend.
     Unlocks by rank (the paints) go by marks EARNED, so buying something never re-locks a paint.
     save.wallet.log keeps the last 60 entries {t, n (+/-), why}; save.owned[itemId] = time it was bought.
     Old saves carry over: their balance is their achievement total, nothing spent. ---------- */
  const W=()=>{const w=save.wallet=Object.assign({bonus:0,spent:0,log:[]},save.wallet||{});if(!Array.isArray(w.log))w.log=[];if(!save.owned||typeof save.owned!=='object')save.owned={};return w;};
  const logMarks=(n,why)=>{const w=W();w.log.push({t:Date.now(),n,why:String(why||'')});if(w.log.length>60)w.log.splice(0,w.log.length-60);};
  const earned=()=>ACH.reduce((s,a)=>s+(save.ach[a.id]?a.marks:0),0)+(+W().bonus||0);
  const spent=()=>+W().spent||0;
  const marks=()=>Math.max(0,earned()-spent());
  function grant(n,why){n=Math.round(+n||0);if(n<=0)return false;W().bonus+=n;logMarks(n,why||'Granted');store();return true;}
  function spend(n,why,item){n=Math.round(+n||0);if(n<=0||marks()<n)return false;W().spent+=n;logMarks(-n,why||'Spent');if(item)save.owned[item]=Date.now();store();return true;}
  const owns=item=>!!(save.owned&&save.owned[item]);
  /* ---------- marks earned through play (Oct 26, Bryce: "Remnant Marks earned through play, plus a challenge system").
     Finishing a level pays marks: 10 for the level plus 1 per 1,000 points scored. Each of a level's challenges pays its marks the
     first time you clear it on a threat level (so clearing it again on a harder one pays again). The threat level scales both:
     Survivor ×0.5, Keeper ×1, Hollow ×1.5. Challenge marks default to a hundredth of its points (a 2,000-point challenge: 20).
     save.chalDone['chapter:id:threat'] = when; save.chalDefs[chapter] = the level's challenge list, so the menu can show it. ---------- */
  const DIFF_MK={easy:.5,hard:1,insane:1.5};
  const diffK=()=>DIFF_MK[save.diff]||1;
  const chalMarks=c=>c.marks!=null?c.marks:Math.max(5,Math.round((c.pts||1000)/100));
  const chalKey=(ch,id,d)=>ch+':'+id+':'+(d||save.diff||'hard');
  const chalGot=(ch,id,d)=>!!(save.chalDone&&save.chalDone[chalKey(ch,id,d)]);
  const ledger=()=>W().log.slice().reverse();
  // test mode: every paint is unlocked regardless of marks (set to false for normal play)
  const TEST_UNLOCK_ALL=true;
  const paintOK=p=>TEST_UNLOCK_ALL||earned()>=p.need;
  function paint(){const p=PAINTS.find(p=>p.id===save.paint);return(p&&paintOK(p)?p:PAINTS[0]).pal;}
  /* ---------- the Armory (Oct 24): gun models bought with Remnant Marks. Skins: they change how a weapon looks, never its numbers.
     slot 'rifle' dresses the Pulse rifle, 'lance' the Lance marksman (standard issue: Bryce's sniper), 'breaker' the Breaker (standard issue: the launcher), 'side' the sidearm.
     Models: models/gun-<id>.glb (phone) and models/pc/gun-<id>.glb (MODELS.gunObj). 'standard' is the original rifle, always owned.
     save.arms = {rifle:id, lance:id, breaker:id, side:id}; bought ones are save.owned['gun:'+id].
     ARMORY_FREE (Oct 24, Bryce: "make all skins free for the moment"): every skin is owned and costs nothing; set it to false to sell them.
     Oct 27 (Bryce: the armour is just skins for the weapons, unlocked through marks): every skin is locked again and costs SKIN_PRICE
     (100 marks) for the moment; each item's own price below is kept for when they get priced one by one. Skins dress the WEAPON, so a
     skin shows whichever slot (primary or secondary) that weapon is carried in. ---------- */
  const ARMORY_FREE=false,SKIN_PRICE=100;
  const ARMORY=[
    {id:'standard',slot:'rifle',name:'Standard issue',price:0,desc:'The Keeper Pulse rifle: gunmetal with cyan cells along the receiver.'},
    {id:'m254',slot:'rifle',name:'M254 · Remnant White',price:60,desc:'White and black, a heavy bullpup frame.'},
    {id:'night',slot:'rifle',name:'Night Watch',price:120,desc:'A short black carbine wrapped in grey camouflage.'},
    {id:'carbine',slot:'rifle',name:'Red Carbine',price:150,desc:'Black blades and red inlay, long and lean.'},
    {id:'smg',slot:'rifle',name:'Red Ripper',price:170,desc:'Compact, hooked grips, a red-lit magazine.'},
    {id:'standard',slot:'lance',name:'Standard issue',price:0,desc:'The Keeper Lance: a long barrel, a heavy scope and a bipod.'},
    {id:'desert',slot:'lance',name:'Dune Marksman',price:100,desc:'Sand-coloured, with a magnified optic and a bipod grip.'},
    {id:'longshot',slot:'lance',name:'Red Longshot',price:160,desc:'A long lever-action frame, black and red, its own scope.'},
    // the sidearm (key 4, Oct 24, Bryce's three pistols): its standard issue is the Keeper Sidearm. (The rifle and Lance skins above add
    // up to every achievement's marks; these two are on top of that.)
    {id:'standard',slot:'side',name:'Keeper Sidearm',price:0,desc:'Standard issue, in Keeper white and blue.'},
    {id:'pistol-custom',slot:'side',name:'Tidewalker',price:80,desc:'A long-barrelled revolver: teal frame, wooden grip.'},
    {id:'pistol-custom-2',slot:'side',name:'Sandcat',price:120,desc:'Desert tan, a reflex sight and a heavy compensator.'},
    {id:'revolver',slot:'side',name:'Red Fang',price:100,desc:'A bladed revolver, black and red, from the same set as the Red Carbine.'},
    // (merged Oct 24 from the models-oct24 branch: the Herald and Hollow guns as Pulse rifle skins, and a Breaker slot whose standard
    //  issue stays the launcher. Files: models/<id>.glb, built by MODELS.propGun.)
    {id:'herald-rifle',slot:'rifle',name:'Herald Assault Rifle',price:150,desc:'Amber Herald make, taken off Astraea.'},
    {id:'hollow-gun',slot:'rifle',name:'Hollow Pulse Gun',price:250,desc:'Empty Host make. It hums.'},
    {id:'standard',slot:'breaker',name:'Standard issue',price:0,desc:'The Keeper launcher: a long tube, a shoulder grip, rockets that drop a little.'},
    {id:'heavy',slot:'breaker',name:'Keeper Breaker',price:90,desc:'The older pattern: squared off, heavy, bare steel.'},
    {id:'hollow-heavy',slot:'breaker',name:'Hollow Heavy Blaster',price:200,desc:'An Empty Host cannon, cut loose.'},
    {id:'herald-heavy',slot:'breaker',name:'Herald Heavy · Special',price:400,desc:'Red Herald heavy. Rare.'},
  ];
  for(const a of ARMORY)if(a.price>0){a.list=a.price;a.price=SKIN_PRICE;}
  const SLOTS={rifle:'Assault rifle · Pulse rifle',lance:'Sniper · Lance marksman',breaker:'Rocket launcher · Breaker',side:'Pistol · Sidearm'};
  const armItem=(slot,id)=>ARMORY.find(a=>a.slot===slot&&a.id===id);
  const armOwns=(slot,id)=>{const a=armItem(slot,id);return!!a&&(ARMORY_FREE||a.price===0||owns('gun:'+id));};
  function armEquipped(slot){const id=save.arms&&save.arms[slot];return id&&armOwns(slot,id)?id:'standard';}
  function armEquip(slot,id){if(!armOwns(slot,id))return false;save.arms=Object.assign({},save.arms||{},{[slot]:id});store();return true;}
  function armBuy(slot,id){const a=armItem(slot,id);if(!a)return false;if(armOwns(slot,id))return armEquip(slot,id);
    if(!spend(a.price,'Armory · '+a.name,'gun:'+id))return false;return armEquip(slot,id);}
  const arms={LIST:ARMORY,SLOTS,FREE:ARMORY_FREE,owns:armOwns,equipped:armEquipped,equip:armEquip,buy:armBuy};
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
.pgpop.chal,.pgpop.mk{font-size:13px;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;animation:pgChal 2.6s ease-out forwards}
@keyframes pgChal{0%{opacity:0;margin-top:8px}10%{opacity:1;margin-top:0}75%{opacity:1}100%{opacity:0;margin-top:-14px}}
.pgend .mkrow{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#ffd27a}
.pgend li .mk{color:#ffd27a;margin-left:6px}
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
.pghq{position:fixed;inset:0;z-index:7;background:#03050a;color:#eef4ff;font:400 12px/1.55 'JetBrains Mono',ui-monospace,monospace;transition:opacity .5s;overflow:hidden}
/* (PC: everything on the briefing is pinned in place, so the screen never scrolls; the slow zoom backdrop is bigger than the screen and used to give it scrollbars. Phones stack it and still scroll up/down, never sideways) */
.pghq.out{opacity:0;pointer-events:none}.pghq .bg{position:absolute;inset:-2%;background:#03050a center/cover no-repeat;animation:hqZoom 40s ease-out forwards}
.pghq .shade{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 40%,rgba(0,0,0,.7) 100%),linear-gradient(0deg,rgba(3,5,10,.75),rgba(3,5,10,0) 45%),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px)}
.pghq .live{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 1.2s}.pghq .live.on{opacity:1}
@keyframes hqZoom{from{transform:scale(1.06)}to{transform:scale(1)}}@media (prefers-reduced-motion:reduce){.pghq .bg{animation:none}}
.pghq .hqtop{position:absolute;left:calc(env(safe-area-inset-left,0px) + 22px);right:calc(env(safe-area-inset-right,0px) + 22px);top:calc(env(safe-area-inset-top,0px) + 16px);display:flex;justify-content:space-between;
  font:500 10px 'JetBrains Mono',monospace;letter-spacing:.24em;color:rgba(220,232,255,.55)}
.pghq .hqbrief{position:absolute;left:calc(env(safe-area-inset-left,0px) + 22px);bottom:calc(env(safe-area-inset-bottom,0px) + 22px);width:min(520px,calc(100vw - 62px - min(330px,40vw)));padding:16px 18px;
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
@media (max-width:760px){.pghq{overflow-x:hidden;overflow-y:auto;touch-action:pan-y}.pghq .hqctl{position:relative;right:auto;top:auto;width:auto;max-height:none;margin:52px 16px 0}.pghq .hqbrief{position:relative;left:auto;bottom:auto;width:auto;margin:14px 16px}
  .pghq .hqgo{position:relative;right:auto;bottom:auto;width:auto;margin:0 16px 24px}.pghq .hqtop{left:16px;right:16px}.pghq .hqtop span:first-child{display:none}}
.pgend .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:4px}
/* the loadout picker on the mission screen (Oct 27): primary and secondary, any weapon in either */
.pghq .lo{display:flex;flex-direction:column;gap:5px;padding:10px 12px;background:rgba(3,5,10,.78);border:1px solid rgba(140,200,255,.22);box-sizing:border-box}
.pghq .lo .lh{display:flex;justify-content:space-between;align-items:baseline;font:700 10px 'Chakra Petch',sans-serif;letter-spacing:.2em;color:#ffd27a}
.pghq .lo .lh small{font:400 9px 'JetBrains Mono',monospace;letter-spacing:.08em;color:rgba(220,232,255,.5)}
.pghq .lo .ln{font:600 9px 'JetBrains Mono',monospace;letter-spacing:.16em;color:rgba(220,232,255,.62);margin-top:2px}
.pghq .lo .lr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
.pghq .lo button{padding:6px 2px 5px;border:1px solid rgba(140,200,255,.28);border-radius:2px;background:rgba(20,34,60,.5);color:#eef4ff;font:700 10px 'Chakra Petch',sans-serif;letter-spacing:.08em;
  cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;min-width:0;touch-action:manipulation}
.pghq .lo button small{font:400 8px 'JetBrains Mono',monospace;letter-spacing:.02em;color:rgba(220,232,255,.5)}
.pghq .lo button[aria-pressed="true"]{border-color:#7fe3ff;background:rgba(127,227,255,.22)}.pghq .lo button[aria-pressed="true"] small{color:#bff0ff}
.pghq .lo button:focus-visible{outline:2px solid #7fe3ff;outline-offset:1px}
.pghq.haslo .hqctl{max-height:max(70px,calc(100vh - 360px))}
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
       last · LAST TRANSMISSION (Oct 26, three levels): The Mountain → The Last Signal → The First Word. The First Word is played as
              three chained parts (Tide City's streets → The Heralds over Astraea → back over Tide City for the evacuation and the
              Spear), so its chapters are tidestreets, astraea and tide; levelNo() numbers them as one level
       fw   · THE FIRST WORD on its own (the same three parts)
       pf   · PATHFINDER (Oct 22, finished with Arc 03): Site K → Dead Ground → The White City
     A page may carry its own query (tide-city.html?part=streets): campHref joins the campaign on with & ---------- */
  const CAMPS={
    last:{q:'1',key:'elyra.campaign',title:'LAST TRANSMISSION',order:['origin','signal','tidestreets','astraea','tide'],
      page:{origin:'origin.html',signal:'last-signal.html',tidestreets:'tide-city.html?part=streets',astraea:'space.html',tide:'tide-city.html?part=sky'},
      name:{origin:'The Mountain',signal:'The Last Signal',tidestreets:'The First Word',astraea:'The First Word',tide:'The First Word'}},
    fw:{q:'fw',key:'elyra.campaign.fw',title:'THE FIRST WORD',order:['tidestreets','astraea','tide'],
      page:{tidestreets:'tide-city.html?part=streets',astraea:'space.html',tide:'tide-city.html?part=sky'},
      name:{tidestreets:'The First Word',astraea:'The First Word',tide:'The First Word'}},
    pf:{q:'pf',key:'elyra.campaign.pf',title:'PATHFINDER',order:['pathfinder','pathfinder2','pathfinder3'],page:{pathfinder:'pathfinder.html',pathfinder2:'pathfinder-2.html',pathfinder3:'pathfinder-3.html'},
      name:{pathfinder:'Site K',pathfinder2:'Dead Ground',pathfinder3:'The White City'}}};
  // a chapter's level number through the whole game, in campaign order (Site K is Level 01, The Mountain Level 04); The First Word's
  // three parts share one number (they share a name)
  function levelNo(ch){let n=0,prev=null;for(const c of CAMPS.all.order){const nm=CAMPS.all.name[c];if(nm!==prev){n++;prev=nm;}if(c===ch)return n;}return 0;}
  // all · THE CAMPAIGN (Oct 23): every finished mission in one run, no menu between. Pathfinder first (in-world date order:
  // 08–10.03 then 11–16.03); to swap which mission opens the game, swap the two lists in CAMP_ORDER.
  const CAMP_ORDER=['pf','last'];
  CAMPS.all={q:'all',key:'elyra.campaign.all',title:'THE CAMPAIGN',order:[].concat(...CAMP_ORDER.map(k=>CAMPS[k].order)),
    page:Object.assign({},CAMPS.last.page,CAMPS.pf.page),name:Object.assign({},CAMPS.last.name,CAMPS.pf.name)};
  const campOf=ch=>Object.keys(CAMPS).find(k=>CAMPS[k].order.includes(ch))||'last';
  const ORDER=CAMPS.last.order,NAME=CAMPS.last.name;
  const qCamp=(location.search.match(/[?&]campaign=(\w+)/)||[])[1]||'';
  const CUR=Object.keys(CAMPS).find(k=>CAMPS[k].q===qCamp)||null;   // the campaign this page was opened in, if any
  const inCampaign=!!CUR;
  const camps={};for(const k in CAMPS){try{camps[k]=JSON.parse(localStorage.getItem(CAMPS[k].key)||'null');}catch(_){camps[k]=null;}}
  let camp=CUR?camps[CUR]:camps.last;
  function campStore(id){const k=id||CUR||'last';try{localStorage.setItem(CAMPS[k].key,JSON.stringify(camps[k]));}catch(_){}}
  function campaign(id){return camps[id||'last'];}
  function campStart(id){id=id||'last';const C=CAMPS[id];camps[id]={at:C.order[0],done:false,started:Date.now()};campStore(id);if(id===(CUR||'last'))camp=camps[id];return campHref(C.order[0],id);}
  function campHref(ch,id){id=id||campOf(ch);const C=CAMPS[id],pg=C.page[ch];return pg+(pg.includes('?')?'&':'?')+'campaign='+C.q;}
  function campSet(id,at){camps[id]=Object.assign(camps[id]||{started:Date.now()},{at,done:false});campStore(id);}
  function init(chapter,opts){
    if(inCampaign){if(!camps[CUR])camps[CUR]={at:chapter,done:false,started:Date.now()};camp=camps[CUR];camp.at=chapter;campStore(CUR);}
    if(!ui){css();const el=document.createElement('div');el.className='pg';
      el.innerHTML='<div class="sc"><b>0</b><span class="cb"></span></div><div class="obj"><b>Objective</b><span></span></div><div class="ch"></div><div class="toasts"></div>';
      document.body.appendChild(el);ui={el,sc:el.querySelector('.sc b'),cb:el.querySelector('.cb'),obj:el.querySelector('.obj span'),objBox:el.querySelector('.obj'),ch:el.querySelector('.ch'),toasts:el.querySelector('.toasts')};}
    run={chapter,score:0,combo:1,comboT:0,recent:[],kills:0,chal:(opts.challenges||[]).map(c=>Object.assign({n:0,state:''},c)),newAch:[],objective:'',stats:{},mk:{chal:0,play:0,paid:false}};
    save.chalDefs=save.chalDefs&&typeof save.chalDefs==='object'?save.chalDefs:{};save.chalDefs[chapter]=run.chal.map(c=>({id:c.id,text:c.text,marks:chalMarks(c)}));store();
    ui.objBox.hidden=true;drawChal();drawScore();
  }
  function drawScore(){ui.sc.textContent=run.score.toLocaleString();ui.cb.textContent='x'+run.combo+' combo';ui.cb.classList.toggle('on',run.combo>1);}
  function drawChal(){ui.ch.innerHTML=run.chal.map(c=>`<div class="${c.state}">${c.state==='done'?'✓':c.state==='fail'?'✗':'○'} ${c.text}${c.goal>1&&c.state===''?` ${c.n}/${c.goal}`:''}</div>`).join('');}
  function toast(title,text,q){const t=document.createElement('div');t.className='toast'+(q?' q':'');t.innerHTML=`<b>${title}</b>${text}`;ui.toasts.prepend(t);
    while(ui.toasts.children.length>3)ui.toasts.lastChild.remove();setTimeout(()=>t.remove(),4200);}
  function pop(text,sx,sy,kind){const p=document.createElement('div');p.className='pgpop'+(kind?' '+kind:'');p.textContent=text;p.style.left=sx+'px';p.style.top=sy+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),kind?2600:1000);}
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
  function done(id){const c=chal(id);if(!c||c.state)return;c.state='done';c.n=c.goal||1;add(c.pts,null,false);
    let pay=0;if(!chalGot(run.chapter,c.id)){save.chalDone=save.chalDone||{};save.chalDone[chalKey(run.chapter,c.id)]=Date.now();pay=Math.round(chalMarks(c)*diffK());
      if(pay>0){grant(pay,'Challenge · '+c.text);run.mk.chal+=pay;}else store();}
    c.paid=pay;toast('Challenge complete',`${c.text} · +${c.pts}`+(pay?` · +${pay} marks`:''),true);drawChal();
    // (the lean HUD hides the challenge panel and its toasts: a short gold line pops up instead, like a kill's points)
    pop('✓ '+c.text+(pay?'  ·  +'+pay+' MARKS':''),innerWidth/2,Math.max(90,innerHeight*.2),'chal');}
  function prog(id,n){const c=chal(id);if(!c||c.state)return;c.n+=n||1;if(c.n>=(c.goal||1))done(id);else drawChal();}
  function fail(id){const c=chal(id);if(!c||c.state)return;c.state='fail';drawChal();}
  function ach(id){const a=ACH.find(a=>a.id===id);if(!a||save.ach[id])return;save.ach[id]=Date.now();logMarks(a.marks,a.name);store();if(run)run.newAch.push(a);
    if(ui)toast('Achievement · +'+a.marks+' marks',a.name+' — '+a.desc);}
  function stat(k,n){if(!run)return 0;run.stats[k]=(run.stats[k]||0)+(n==null?1:n);return run.stats[k];}
  // a won level pays its marks once (finish can be reached twice in a campaign hand-off)
  function payLevel(o){if(!run||run.mk.paid||(o&&o.lost))return 0;run.mk.paid=true;const n=Math.round((10+run.score/1000)*diffK());
    if(n>0){grant(n,'Level · '+((KICK[run.chapter]||[])[1]||run.chapter));run.mk.play=n;}return n;}
  // end of a chapter: bank the best score and show the results card
  function finish(o){
    if(!run)return;payLevel(o);
    // (Oct 27) a won level is marked finished, so the menu can let the campaign start from it
    if(!o||!o.lost){if(!save.won||typeof save.won!=='object')save.won={};if(!save.won[run.chapter]){save.won[run.chapter]=Date.now();store();}}
    // in the campaign a win leads straight on to the next archive (after a short count, or at once with the button)
    if(inCampaign){const C=CAMPS[CUR],i=C.order.indexOf(run.chapter),next=C.order[i+1];
      if(o.lost)o.buttons=[{text:'Try again',onClick:()=>location.reload(),primary:true},{text:'Menu',href:'index.html'}];
      else if(next){const best=save.best[run.chapter]||0;if(run.score>best){save.best[run.chapter]=run.score;store();}if(run.score>=50000)ach('command');
        camp.at=next;campStore(CUR);try{sessionStorage.setItem('elyra.chain',next);}catch(_){}
        {const got=run.mk.play+run.mk.chal;if(got)pop('+'+got+' REMNANT MARKS',innerWidth/2,innerHeight*.42,'mk');}
        const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;z-index:9;background:#000;opacity:0;transition:opacity .6s';document.body.appendChild(f);
        requestAnimationFrame(()=>f.style.opacity=1);setTimeout(()=>{location.href=campHref(next,CUR);},650);return f;}
      // the last part: the whole mission's card. (Pathfinder keeps its own buttons: they lead on to the footage it unlocks)
      else{camp.done=true;camp.at=C.order[0];campStore(CUR);o.title=CUR==='all'?CAMPS[campOf(run.chapter)].title:C.title;if(CUR==='last'||CUR==='all')o.buttons=[{text:'Back to the menu',href:'index.html',primary:true},{text:'Keep flying',close:true}];}}const best=save.best[run.chapter]||0,isBest=run.score>best;if(isBest){save.best[run.chapter]=run.score;store();}
    if(run.score>=50000)ach('command');
    const el=document.createElement('div');el.className='pgend';
    const li=run.chal.map(c=>`<li class="${c.state==='done'?'done':'miss'}"><span>${c.state==='done'?'✓':'✗'} ${c.text}</span><span>${c.state==='done'?'+'+c.pts+(c.paid?`<i class="mk">+${c.paid} mk</i>`:''):chalGot(run.chapter,c.id)?'cleared before':'+'+Math.round(chalMarks(c)*diffK())+' mk'}</span></li>`).join('');
    const mkGot=run.mk.play+run.mk.chal;
    const al=run.newAch.map(a=>`<li class="done"><span>★ ${a.name}</span><span>+${a.marks} marks</span></li>`).join('');
    el.innerHTML=`<div class="card"><h2>${o.title}</h2><p>${o.text||''}</p>
      <div class="tot"><div><b>${run.score.toLocaleString()}</b><span>${isBest?'New best':'Score'}</span></div><div><b>${Math.max(best,run.score).toLocaleString()}</b><span>Best</span></div><div><b>${marks()}</b><span>Marks</span></div></div>
      ${mkGot?`<div class="mkrow"><span>+${mkGot} Remnant Marks</span>${run.mk.play?`<span>Level +${run.mk.play}</span>`:''}${run.mk.chal?`<span>Challenges +${run.mk.chal}</span>`:''}</div>`:''}
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
  const KICK={origin:['LAST TRANSMISSION','The Mountain'],signal:['LAST TRANSMISSION','The Last Signal'],tidestreets:['LAST TRANSMISSION','The First Word'],astraea:['LAST TRANSMISSION','The First Word'],tide:['LAST TRANSMISSION','The First Word'],pathfinder:['PATHFINDER','Site K'],pathfinder2:['PATHFINDER','Dead Ground'],pathfinder3:['PATHFINDER','The White City']};
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
  vec2 sp=(P-vec2(922.,483.))/138.;float r2=dot(sp,sp);
  if(r2<1.){float z=sqrt(1.-r2);float lon=atan(sp.x,z)+t*.45;float lat=asin(clamp(-sp.y,-1.,1.));
    float mer=smoothstep(.93,1.,abs(cos(lon*6.)))*z;float band=exp(-pow((lat-sin(t*.7)*1.2)*7.,2.));
    c+=vec3(.45,.9,1.)*(mer*.28+band*.22+.05*sin(t*2.)+.05)*z*M;}
  // a blip riding the ring; hidden while it is behind the dome
  float a=t*.9;vec2 bp=vec2(922.,480.)+vec2(cos(a)*224.,sin(a)*42.);float cs=cos(-.21),sn=sin(-.21);
  bp=vec2(922.,480.)+mat2(cs,sn,-sn,cs)*(bp-vec2(922.,480.));
  float behind=step(0.,-sin(a))*step(length((bp-vec2(922.,483.))/138.),1.);
  c+=vec3(.6,1.,.95)*exp(-dot(P-bp,P-bp)/40.)*1.2*(1.-behind)*M;
  // the pad: its rim pulses, a ripple runs out over the floor every few seconds
  float e=ell(P,vec2(920.,697.),vec2(316.,58.),0.);
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
    /* Oct 25 (the lag spike half a second into every level, and between Pathfinder's arcs): loseContext() made the browser tear the
       loading screen's GL context down on the spot, and the game's own context waited on it. Now it is only shrunk to 1 px and dropped:
       the browser frees it later, when it is idle. */
    /* Oct 27: and no longer shrunk to 1 px either: resizing a canvas makes the browser wait for every frame still queued on its GPU,
       measured as the longest stall right after Begin. It is only taken out of the page and let go. */
    return()=>{if(dead)return;dead=true;cancelAnimationFrame(raf);removeEventListener('resize',size);host.removeEventListener('pointermove',pm);
      setTimeout(()=>{cv.remove();gl=null;},520);};
  }
  /* ---------- the light pad (Oct 27, Bryce: "very high lag starting any level, and when the first ships or models arrive") ----------
     three.js bakes the NUMBER of point, spot, directional and hemisphere lights into every lit shader. So whenever a light switched on
     or off, or a scene set, ship or cutscene added one, every lit material in the level recompiled at once: measured on Site K, the
     warm-up compiled everything with 9 point lights, the opening scenes added 3 more right after Begin, and all of it compiled again
     (seconds on a phone); going below the Mountain (8 more lamps and Michael's torch) did the same. Now the counts are held fixed:
     a pool of black, zero-strength stand-in lights sits in the scene, and one switches off for every real light that switches on
     (and back), so the counts the shaders see don't change.
     Regimes: the counts the level starts with plus some room (4 point lights), and, when the level has lights waiting hidden (below
     the Mountain, cutscene sets), the counts with the biggest of those sections on. The loading screen compiles every shader for both, and play
     switches between them (down to the smaller one only after it has fitted for 3 s), so neither costs a stall. Only if more lights
     than that are ever on at once is a bigger regime made (one stall); it is kept per page (localStorage elyra.lightpad.*) and
     compiled on the loading screen from the next run on. */
  const LIGHTPAD=(()=>{
    if(typeof THREE==='undefined'||!THREE.Object3D)return{install(){},regimes:[],force(){}};
    const TYPES=['PointLight','SpotLight','DirectionalLight','HemisphereLight'],ROOM={PointLight:4,SpotLight:0,DirectionalLight:0,HemisphereLight:0};
    const REG=new Set(),reg=o=>{if(o.isLight&&!o.userData.lpad&&TYPES.includes(o.type))REG.add(o);};
    // every light ever added anywhere is noted (it may be in a set that joins the scene later)
    const add0=THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add=function(o){for(let i=0;i<arguments.length;i++){const x=arguments[i];if(x&&x.isObject3D){if(x.isLight)reg(x);else if(x.children.length)x.traverse(reg);}}return add0.apply(this,arguments);};
    let S=null,key='',cur=null,forced=null,fitT=0;const pads={},REGS=[];
    const on=l=>{for(let p=l;p;p=p.parent){if(!p.visible)return false;if(p===S)return true;}return false;};   // shown, and in the level's scene
    const fits=(R,n)=>TYPES.every(t=>n[t]<=R[t]),within=(a,b)=>TYPES.every(t=>a[t]<=b[t]);
    function mk(t){const l=t==='PointLight'?new THREE.PointLight(0,0,1,2):t==='SpotLight'?new THREE.SpotLight(0,0,1,.5,0,2):t==='DirectionalLight'?new THREE.DirectionalLight(0,0):new THREE.HemisphereLight(0,0,0);
      l.userData.lpad=true;l.castShadow=false;l.position.set(0,-9000,0);l.matrixAutoUpdate=false;l.updateMatrix();add0.call(S,l);return l;}
    function count(){const n={PointLight:0,SpotLight:0,DirectionalLight:0,HemisphereLight:0};
      for(const l of REG){if(on(l))n[l.type]++;else if(!l.parent)REG.delete(l);}   // (taken out of everything: add() notes it again if it comes back)
      return n;}
    function balance(){
      const n=count();let R=forced||cur;
      if(!forced){
        if(!fits(cur,n)){R=REGS.find(r=>fits(r,n));
          if(!R){const top=REGS[REGS.length-1];R={};for(const t of TYPES)R[t]=Math.max(n[t],top[t]);REGS.push(R);try{localStorage.setItem(key,JSON.stringify(R));}catch(_){}}
          cur=R;fitT=0;}
        else{const sm=REGS.find(r=>r!==cur&&within(r,cur)&&fits(r,n));   // a smaller regime would do: wait 3 s so a flicker doesn't swap back and forth
          if(sm){const t=performance.now();if(!fitT)fitT=t;else if(t-fitT>3000){cur=R=sm;fitT=0;}}else fitT=0;}}
      for(const t of TYPES){const P=pads[t],need=Math.max(0,R[t]-n[t]);while(P.length<need)P.push(mk(t));
        for(let i=0;i<P.length;i++)P[i].visible=i<need;}
    }
    function install(){
      if(S||typeof renderer==='undefined'||typeof scene==='undefined'||!renderer.render)return;
      S=scene;scene.traverse(reg);
      key='elyra.lightpad.'+location.pathname.split('/').pop()+'|'+(new URLSearchParams(location.search).get('part')||'');
      let seen={};try{seen=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(_){}
      const now={},hid={},base={},all={},grp=new Map();for(const t of TYPES){now[t]=0;hid[t]=0;}
      for(const l of REG){if(on(l)){now[l.type]++;continue;}
        // a hidden light belongs to the outermost hidden thing it sits in (the prison, a cutscene set): sections show one at a time
        let top=null,inS=false;for(let p=l;p;p=p.parent){if(p===S){inS=true;break;}if(!p.visible)top=p;}
        // (a light hidden on its own, like Michael's torch below, can come on with any section, so loose ones count on top)
        if(!inS||!top)continue;if(top===l){hid[l.type]++;continue;}
        let g=grp.get(top);if(!g){g={};for(const t of TYPES)g[t]=0;grp.set(top,g);}g[l.type]++;}
      {const mx={};for(const t of TYPES)mx[t]=0;for(const g of grp.values())for(const t of TYPES)mx[t]=Math.max(mx[t],g[t]);
        for(const t of TYPES)hid[t]+=mx[t];}   // the loose ones plus the biggest single section, not every section at once
      for(const t of TYPES){pads[t]=[];
        const room=Math.min(now[t]>=16?2:4,hid[t]+ROOM[t]);   // (a level already lit by many lights gets less spare room: each one costs every lit pixel)
        base[t]=now[t]||hid[t]||seen[t]?now[t]+room:0;   // a type the level never uses stays out of its shaders
        all[t]=Math.max(base[t],now[t]+hid[t],seen[t]||0);}
      REGS.push(base);if(!within(all,base))REGS.push(all);cur=base;
      const r0=renderer.render,c0=renderer.compile;
      renderer.render=function(s,c){if(s===S)balance();return r0.apply(this,arguments);};
      if(c0)renderer.compile=function(s,c){if(s===S)balance();return c0.apply(this,arguments);};
      balance();
    }
    // force(R): hold the counts at regime R while the loading screen compiles for it; force(null) goes back
    return{install,regimes:REGS,force(R){forced=R||null;if(S)balance();},get current(){return cur;}};
  })();
  /* compile() only builds the shader programs. The first real draw still has to upload every mesh and texture to the GPU, build the
     shadow-pass and bloom shaders, and (Chrome on Windows) finish the driver's own shader compile, which it puts off until a program
     is first drawn with. That all landed on the first frame after Begin: the lag spike going in. So, behind the loading screen, draw
     one frame with every hidden thing shown and nothing culled, then put it all back. Lights keep the visibility they really have,
     so the light count (part of every lit shader) is the one play starts with. */
  /* Oct 27 (Bryce: lag spikes when enemies spawn in, on every level): materials the level made while loading that nothing in the scene
     uses yet (the Host dropship's glow first showed up mid-fight and compiled its shader there) each get a stand-in far under the ground,
     so the compile and the first draw below cover them too. They go at Begin. js/shared/core.js notes the materials. */
  let ORPHANS=null;
  function addOrphans(){
    const R=window.ELYRA_MATS;if(!R||typeof scene==='undefined'||ORPHANS)return;
    const used=new Set();scene.traverse(o=>{const m=o.material;if(m)for(const x of[].concat(m))used.add(x);});
    const G=new THREE.Group();G.position.set(0,-5000,0);G.userData.dyn=1;ORPHANS=G;
    const box=new THREE.BoxGeometry(.1,.1,.1);box.setAttribute('color',new THREE.Float32BufferAttribute(new Array(box.attributes.position.count*3).fill(1),3));
    const pts=new THREE.BufferGeometry();pts.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.1,0,0],3));pts.setAttribute('color',new THREE.Float32BufferAttribute([1,1,1,1,1,1],3));
    let skinBox=null;const skinned=m=>{if(!skinBox){skinBox=box.clone();const n=skinBox.attributes.position.count;skinBox.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(new Array(n*4).fill(0),4));
        skinBox.setAttribute('skinWeight',new THREE.Float32BufferAttribute(new Array(n*4).fill(0).map((_,i)=>i%4?0:1),4));}
      const s=new THREE.SkinnedMesh(skinBox,m),b=new THREE.Bone();s.add(b);s.bind(new THREE.Skeleton([b]));return s;};
    const sig=new Set(),M=['map','alphaMap','emissiveMap','normalMap','roughnessMap','metalnessMap','aoMap','envMap','lightMap','bumpMap','specularMap','displacementMap'];
    for(const m of R.live()){if(used.has(m)||m.visible===false||m.morphTargets)continue;
      let k=m.type+'|'+m.vertexColors+'|'+m.side+'|'+m.toneMapped+'|'+m.fog+'|'+!!m.skinning+'|'+(m.alphaTest>0)+'|'+m.flatShading+'|'+m.sizeAttenuation+'|'+m.dithering+'|'+m.premultipliedAlpha;
      for(const t of M)k+=m[t]?'1':'0';
      try{k+='|'+(m.customProgramCacheKey?m.customProgramCacheKey():'')+'|'+(m.onBeforeCompile?String(m.onBeforeCompile).length:0);}catch(_){}
      if(sig.has(k))continue;sig.add(k);
      let o;try{o=m.isSpriteMaterial?new THREE.Sprite(m):m.isPointsMaterial?new THREE.Points(pts,m):m.isLineBasicMaterial?(m.isLineDashedMaterial?null:new THREE.Line(pts,m)):m.skinning?skinned(m):new THREE.Mesh(box,m);}catch(_){o=null;}
      if(!o)continue;o.frustumCulled=false;o.userData.dyn=1;G.add(o);}
    if(G.children.length)scene.add(G);
    addEventListener('elyra-begin',()=>{if(G.parent)G.parent.remove(G);},{once:true});
    if(R.stop)R.stop();
  }
  /* Oct 27 (Bryce: "page unresponsive" starting a level): the one warm-up frame below drew everything at once, every texture upload,
     shadow shader and (Chrome on Windows) deferred driver compile in a single task, long enough for the browser to call the page hung.
     Now everything is drawn a few objects at a time first, each batch in its own task (only that batch is in view: the camera and the
     shadow pass look at a spare layer that just the batch is on), the batch size following how long the last one took. The full frame
     after it then has nothing left to do. */
  function warmBatches(){let list=null,lights=null,i=0,n=6;const LY=30;
    return()=>{
      if(typeof renderer==='undefined'||typeof scene==='undefined'||typeof camera==='undefined')return false;
      if(!list){list=[];lights=[];scene.traverse(o=>{if(o.isLight)lights.push(o);else if(o.material&&(o.isMesh||o.isSprite||o.isPoints||o.isLine))list.push(o);});}
      if(i>=list.length)return false;
      const t0=performance.now(),chunk=list.slice(i,i+n),shown=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
      const lv=lights.map(l=>[l,l.visible,shown(l)]),opened=[],cull=[],cam0=camera.layers.mask;
      for(const o of chunk){for(let p=o;p&&p!==scene;p=p.parent)if(!p.visible){p.visible=true;opened.push(p);}
        o.layers.enable(LY);if(o.frustumCulled){o.frustumCulled=false;cull.push(o);}}
      for(const [l,,on] of lv){l.visible=on;l.layers.enable(LY);}
      camera.layers.set(LY);
      const cmp=typeof composer!=='undefined'&&composer&&(typeof HQ==='undefined'||HQ)?composer:null,rt0=renderer.getRenderTarget();
      try{renderer.setRenderTarget(cmp&&cmp.renderTarget1?cmp.renderTarget1:null);renderer.render(scene,camera);}catch(e){console.warn('warm batch',e);}
      finally{renderer.setRenderTarget(rt0);camera.layers.mask=cam0;
        for(const o of chunk)o.layers.disable(LY);for(const o of cull)o.frustumCulled=true;for(const p of opened)p.visible=false;
        for(const [l,v] of lv){l.visible=v;l.layers.disable(LY);}}
      i+=chunk.length;const dt=performance.now()-t0;n=dt<10?Math.min(96,n*2):dt>45?Math.max(1,n>>1):n;
      return i<list.length;};}
  // ...and before that, every texture they use is sent to the GPU on its own, a few per task (a single model can carry four 2048 px maps)
  function warmTextures(){let list=null,i=0;
    return()=>{
      if(typeof renderer==='undefined'||typeof scene==='undefined'||!renderer.initTexture)return false;
      if(!list){const S=new Set(),K=['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','alphaMap','bumpMap','lightMap','displacementMap','specularMap'];
        const take=t=>{if(t&&t.isTexture&&t.image&&!t.isCubeTexture&&!t.isVideoTexture&&!t.isDataTexture3D&&!t.isDataTexture2DArray&&!t.isCompressedTexture)S.add(t);};
        scene.traverse(o=>{const m=o.material;if(!m)return;for(const x of[].concat(m)){if(!x)continue;for(const k of K)take(x[k]);if(x.uniforms)for(const u in x.uniforms){const v=x.uniforms[u]&&x.uniforms[u].value;if(v&&v.isTexture)take(v);}}});
        list=[...S];}
      const t0=performance.now();
      while(i<list.length&&performance.now()-t0<20){try{renderer.initTexture(list[i]);}catch(e){}i++;}
      return i<list.length;};}
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
    const lv=levelNo(ch),kick=K[0]+(lv?' · LEVEL '+String(lv).padStart(2,'0'):' · '+K[1].toUpperCase());   // (Oct 26: levels are numbered through the whole game; The First Word's three parts share one)
    const text=(o.text||'').replace(/\s*Threat level:[^.]*\.\s*$/,'');
    const dl=rows=>'<dl>'+rows.map(r=>`<dt>${typeof KEYS!=='undefined'?KEYS.label(r[0]):r[0]}</dt><dd>${r[1]}</dd>`).join('')+'</dl>';   // (Oct 27: in the keys the player picked)
    const el=document.createElement('div');el.className='pghq';
    el.innerHTML=`<div class="bg"></div><div class="shade"></div><div class="hqtop"><span>KEEPER COMMAND · TIDE CITY</span><span>${kick}</span></div>
      <div class="hqbrief"><div class="k">${kick}</div><h2>${o.title}</h2><p>${text}</p>${o.objective?`<div class="ob"><b>FIRST OBJECTIVE</b>${o.objective}</div>`:''}
        <div class="th">THREAT LEVEL · ${diff().name.toUpperCase()} <small>(change it on the menu or in pause)</small></div></div>
      <div class="hqctl"><div class="hd"><b>CONTROLS · ${touch?'PHONE':'PC'}</b><button type="button" class="sw">${touch?'PC':'Phone'} controls</button></div><div class="ls">${dl(touch?o.phone:o.pc)}</div></div>
      <div class="hqgo"><div class="bar"><i></i></div><button type="button" id="pgStart" disabled>Syncing archive…</button></div>`;
    document.body.appendChild(el);
    /* the loadout (Oct 27, Bryce: "at the beginning of each mission, ask what they want to use"): on the levels you fight on foot
       (js/origin/03-play.js sets window.LOADOUT) pick a primary and a secondary from the four; the same weapon can't fill both, so picking
       the other slot's weapon swaps them. Starts on the assault rifle and the pistol; put in your hands at Begin. */
    const LO=window.LOADOUT,lsel=LO?LO.DEFAULT.slice():null;
    if(LO){el.classList.add('haslo');const box=document.createElement('div');box.className='lo';
      const SHORT={rifle:'AR',lance:'SNIPER',breaker:'ROCKET',side:'PISTOL'};
      const draw=()=>{box.innerHTML=`<div class="lh">LOADOUT<small>any weapon, either slot</small></div>`+['Primary','Secondary'].map((nm,k)=>
        `<div class="ln">${nm.toUpperCase()} · KEY ${typeof KEYS!=='undefined'?KEYS.name(KEYS.code('Digit'+(k+1))):k+1}</div><div class="lr" role="group" aria-label="${nm} weapon">`+
        LO.IDS.map(id=>{const W=LO.WEAPONS[id];return`<button type="button" data-k="${k}" data-id="${id}" aria-pressed="${lsel[k]===id}" title="${W.type} · ${W.name}">${SHORT[id]||W.short}<small>${W.name.split(' ')[0]}</small></button>`;}).join('')+'</div>').join('');};
      draw();box.addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(!b)return;const k=+b.dataset.k,id=b.dataset.id,o=1-k;
        if(lsel[o]===id)lsel[o]=lsel[k];lsel[k]=id;draw();const nb=box.querySelector(`button[data-k="${k}"][data-id="${id}"]`);if(nb)nb.focus({preventScroll:true});});
      const go0=el.querySelector('.hqgo');go0.insertBefore(box,go0.firstChild);}
    {const bt=document.getElementById('boot');if(bt)setTimeout(()=>bt.remove(),60);}   // the static cover the page opened with
    // Keeper Command, rendered from the game's own deck (re-rendered Oct 25 with the Meshy cast: the officers, Elias, the Keeper guards); the phone gets the smaller file.
    // The still sits underneath; hqLive lays the moving 2.5D version over it once both textures are in.
    const hqSrc=`img/hq-loading-${touch?'phone':'pc'}.webp`;
    el.querySelector('.bg').style.backgroundImage=`url(${hqSrc})`;
    const stop=hqLive(el,hqSrc);
    let other=false;el.querySelector('.sw').addEventListener('click',()=>{other=!other;const ph=other?!touch:touch;el.querySelector('.hd b').textContent='CONTROLS · '+(ph?'PHONE':'PC');
      el.querySelector('.sw').textContent=(ph?'PC':'Phone')+' controls';el.querySelector('.ls').innerHTML=dl(ph?o.phone:o.pc);});
    let ready=false;const b=el.querySelector('#pgStart'),bar=el.querySelector('.bar i'),t0=performance.now(),MIN=chain?1600:1300;
    /* Oct 27 (lag on the loading screen): every level kept drawing its whole scene, bloom and all, behind this screen every frame
       where no one could see it, fighting the loading screen's own animation and the loading work for the phone's GPU and main thread.
       While it covers the level, the level's renderFrame does nothing, except when a warm-up job draws on purpose (allowDraw). */
    let covered=true,allowDraw=false;
    if(typeof window.renderFrame==='function'&&!window.renderFrame._cov){const rf=window.renderFrame;
      window.renderFrame=function(){if(covered&&!allowDraw)return;return rf.apply(this,arguments);};window.renderFrame._cov=true;}
    const go=()=>{if(!paused||!ready)return;paused=false;covered=false;stop();el.classList.add('out');setTimeout(()=>el.remove(),500);removeEventListener('keydown',key,true);
      if(LO)LO.set(lsel);
      if(o.onStart)o.onStart();
      try{dispatchEvent(new Event('elyra-begin'));}catch(_){}};   // (js/origin/03-play.js clears the loading screen's warm-up stand-ins on this)
    // loading: the page's scripts, then the models (so they are not rigged mid-fight), then the warm-up jobs the chapter registered
    // (building cutscene sets, compiling every shader once) one per frame, so the first seconds of play don't stall
    const done=()=>{ready=true;window.ELYRA_WARMING=false;bar.style.width='100%';b.disabled=false;b.textContent=chain&&!LO?'Continuing…':chain?(touch?'Tap to continue':'Continue  ·  Enter'):(touch?'Tap to begin':'Begin  ·  Enter');if(chain&&!LO)setTimeout(go,350);};   // (a level with a loadout to pick waits for you, even in a campaign)
    const warm=()=>{b.textContent='Preparing…';const jobs=WARM.splice(0),WARM_N=jobs.length;let i=0;window.ELYRA_WARMING=true;
      // the light pad goes in after the chapter's own jobs (they may build hidden parts with lights of their own, like the Mountain's
      // prison), and before anything compiles, so every shader is built for the light counts play keeps (see LIGHTPAD)
      jobs.push(()=>{addOrphans();return false;});   // (stand-ins for materials nothing shows yet, so the compile below covers them: Oct 27)
      jobs.push(()=>LIGHTPAD.install());
      /* every shader in the level, once. Oct 27: in slices of about 25 ms instead of all at once (seconds on a phone, with the loading
         screen frozen the whole time). compile() visits the scene with traverse(); for each slice that is pointed at the next objects
         in a list made up front, so each call compiles only what is new among them. A job returning true runs again. */
      const compileFor=(R,k0,k1)=>{let CL=null,ci=0;return()=>{if(typeof renderer==='undefined'||typeof scene==='undefined'||typeof camera==='undefined'||!renderer.compile)return false;
        if(!CL){CL=[];scene.traverse(o=>{if(o.material)CL.push(o);});}
        const t1=performance.now();scene.traverse=function(cb){while(ci<CL.length){cb(CL[ci++]);if(performance.now()-t1>25)break;}};
        // compile for where play draws: the level draws into the bloom composer's buffer (linear colour), not straight to the screen
        // (sRGB), and three.js builds a different shader for each; compiled for the screen, none of it was used (Oct 27)
        const cmp=typeof composer!=='undefined'&&composer&&(typeof HQ==='undefined'||HQ)?composer:null,rt0=renderer.getRenderTarget();
        if(cmp&&cmp.renderTarget1)renderer.setRenderTarget(cmp.renderTarget1);
        if(R)LIGHTPAD.force(R);
        try{renderer.compile(scene,camera);}finally{delete scene.traverse;if(R)LIGHTPAD.force(null);renderer.setRenderTarget(rt0);}
        bar.style.width=(k0+(k1-k0)*ci/Math.max(1,CL.length))+'%';return ci<CL.length;};};
      jobs.push(compileFor(null,88,92));
      // the other regime (the level with all its hidden lights on), if it has one: the regimes are only known once install has run
      jobs.push(()=>{const RG=LIGHTPAD.regimes;if(RG&&RG.length>1){const extra=RG.slice(1).map(R=>compileFor(R,92,96));jobs.splice(i+1,0,...extra);}return false;});
      // the bloom and colour passes' own shaders, in a task of their own: one frame with the level's scene switched off (Oct 27)
      jobs.push(()=>{if(typeof renderFrame!=='function'||typeof scene==='undefined')return false;const v=scene.visible;scene.visible=false;try{renderFrame();}catch(e){}finally{scene.visible=v;}return false;});
      jobs.push(warmTextures());   // the textures first, a few per task
      jobs.push(warmBatches());   // everything drawn a few at a time first (Oct 27: the single frame of it all was the hang)
      jobs.push(warmDraw);   // then one real frame of everything, so nothing is left for the first frame of play
      const nextJob=()=>{if(i>=jobs.length){done();return;}if(i<WARM_N)bar.style.width=(80+8*i/Math.max(1,WARM_N))+'%';
        let again=false;allowDraw=true;try{again=jobs[i]()===true;}catch(e){console.warn('warm',e);}allowDraw=false;if(!again)i++;setTimeout(nextJob,again?16:30);};nextJob();};
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
  // the level's challenges for the pause menu: text, state, marks on offer at this threat level, cleared before
  function chalList(){if(!run)return[];return run.chal.map(c=>({id:c.id,text:c.text,state:c.state,n:c.n,goal:c.goal||1,marks:Math.round(chalMarks(c)*diffK()),got:chalGot(run.chapter,c.id),paid:c.paid||0}));}
  return{levelNo,chalList,chalGot,DIFF_MK,warm:f=>WARM.push(f),lightpad:LIGHTPAD,campaign,campStart,campHref,campSet,CAMPS,inCampaign,CAMP_NAME:NAME,DIFFS,diff,setDiff,combat,say,briefing,get paused(){return paused;},set paused(v){paused=v;},TEST_UNLOCK_ALL,ACH,PAINTS,arms,init,add,kill,tick,objective,done,prog,fail,ach,stat,finish,paint,setPaint,marks,earned,spent,grant,spend,owns,ledger,paintOK,get save(){return save;},get run(){return run;},reload(){save=load();}};
})();
// the difficulty this chapter loaded with: DIFF.space / DIFF.tide hold the numbers
const DIFF=PG.diff();
