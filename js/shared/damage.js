/* Elyra shared · the damage system (Oct 25, Bryce's Combat Master spec: docs/COMBAT-SPEC.md).
   One place for every number a hit uses: weapon damage by hit zone, health + shield pools (damage carries through the shield into
   HP in the same hit), shield regeneration, the medical supply, vehicle and ship classes, aircraft weapons, and the threat level's
   NPC damage and hit chance. Values marked TBD in the spec are null here; the game never makes one up.
   Needs PG (js/shared/progress.js) for the threat level. Global `DMG`. */
const DMG=(()=>{
  /* ---------- pools ---------- */
  const STD={hp:100,shield:25};                       // standard ground player, ground NPC, player craft: 125 total
  const CLASS={                                        // vehicles and ships (spec §6)
    playerCraft:{name:'Player craft',hp:100,shield:25,hullRegen:true,shieldRegen:true},
    fighter:{name:'Fighter',hp:100,shield:25},
    bomber:{name:'Bomber',hp:175,shield:25},
    dropship:{name:'Dropship',hp:300,shield:0},
    warthog:{name:'Warthog',hp:175,shield:0},
    mech:{name:'Mech',hp:500,shield:0},
    flagship:{name:'Flagship',hp:800,shield:200},
    mainFlagship:{name:'Main flagship',hp:1600,shield:500},
    // outside the spec (Bryce, Oct 25): squadmates have a player's HP and no shield
    ally:{name:'Squadmate',hp:100,shield:0},
    // the Empty Host's hover tank (Bryce Oct 26), every level: 200 HP + 25 shield; the shield comes back like a trooper's
    skimmer:{name:'Skimmer',hp:200,shield:25},
  };
  // shield regeneration (spec §5): wait = seconds with no damage after the latest hit, fill = seconds from empty to full
  const REGEN={player:{wait:5,fill:8},npc:{wait:10,fill:16},
    craft:{wait:5,fill:8}};   // your craft's hull AND shield (Bryce Oct 25): 5 s after the latest hit, each empty to full in 8
  const MED_HP=50;                                     // one medical supply: +50 HP at once, usable in a fight

  /* ---------- weapons ---------- */
  // ground weapons (spec §2–3): damage by zone; rps = shots per second; reload in seconds
  const GUN={
    ar:{name:'Assault rifle',head:125,torso:65,other:45,rps:4,mag:40,reload:4},     // rps: Bryce Oct 25 (the spec's 2–3 was open)
    sniper:{name:'Sniper rifle',head:150,torso:125,other:65,rps:1/3,mag:10,reload:4},
    pistol:{name:'Pistol',head:65,torso:45,other:35,rps:4,mag:18,reload:3},
    smg:{name:'SMG',head:65,torso:35,other:25,rps:6,mag:40,reload:3},
    // the Breaker: 250 on a direct hit, in the campaign too (Bryce Oct 25). It is the launcher in your hands, so it fires at the
    // ground rocket launcher's cadence. Its area damage, radius and falloff are TBD: aoe is null
    breaker:{name:'Breaker',head:250,torso:250,other:250,rps:1/3,mag:1,reload:4,aoe:null},
  };
  // aircraft weapons (spec §7): no hit zones on aircraft. Fire rate, ammunition, reload and projectile behaviour are TBD
  const AIR={turret:35,rocket:80};

  /* ---------- the threat level ---------- */
  // spec §4: NPC outgoing damage as a share of the matching player attack, and the chance each NPC shot hits
  const LEVEL={easy:{dmg:.2,hit:.2},hard:{dmg:.4,hit:.4},insane:{dmg:.6,hit:.6}};
  const AIR_K=.75;                                     // NPC aircraft: a further 25% off (15 / 30 / 45%)
  /* Empty Host / Herald troopers on foot (Bryce Oct 25): there is never just one, so their hits are tuned for a squad of four
     firing at once. Spec damage × TROOPER: Survivor 13 → 3.25, Keeper 26 → 2.6, Hollow 39 → 2.6 per torso hit (assault rifle).
     Four troopers drop a full 125 in about 12 s / 7.5 s / 5 s. */
  const TROOPER={easy:1/4,hard:1/10,insane:1/15};
  const lv=()=>{const id=typeof PG!=='undefined'&&PG.save?PG.save.diff:'hard';return LEVEL[id]?id:'hard';};

  /* ---------- outside the spec (Bryce, Oct 25) ---------- */
  const EXTRA={
    zeal:2,                 // Zeal doubles your damage, your fire rate and your shield regeneration
    wallHp:100,             // the mobile shield
    turretDmg:30,turretRps:1,   // a Hollow turret's gun: 30 per hit, one shot a second (hit chance by threat level)
    vehGunDmg:45,           // your Warthog's and walker's guns (Bryce Oct 25): 45 per hit, at the turret's one shot a second
    sentry:'ar',            // the shoulder sentry hits like the assault rifle, at its rate
  };
  // old fight units: everything not named above keeps its old feel. A trooper used to have 3 points; now it has 125
  const LEGACY=125/3;
  // your craft's guns (Bryce Oct 25: half the old rate, so ships don't melt): seconds between shots, Zeal doubles the rate
  const CRAFT_GUN_CD=.22;

  /* ---------- pools: make, hit, regenerate ---------- */
  function pool(spec,regen){spec=typeof spec==='string'?CLASS[spec]:spec||STD;
    return{hp:spec.hp,maxHp:spec.hp,shield:spec.shield,maxShield:spec.shield,regen:regen||null,lastHit:-1e9,fill:0};}
  // a hit: the shield takes what it can, the rest goes to HP in the same hit. Returns what each part took
  function hit(p,dmg,t){if(!(dmg>0))return{shield:0,hp:0,dead:p.hp<=0};
    const s=Math.min(p.shield,dmg);p.shield-=s;const h=Math.min(p.hp,dmg-s);p.hp-=h;if(t!=null)p.lastHit=t;
    return{shield:s,hp:h,dead:p.hp<=0};}
  // shield regeneration: nothing until `wait` damage-free seconds after the latest hit, then refill at max/fill per second.
  // Points already restored are kept when a new hit pauses it. k speeds the refill (Zeal: 2)
  function tick(p,dt,t,k){if(!p.regen||p.hp<=0||p.shield>=p.maxShield)return;if(t-p.lastHit<p.regen.wait)return;
    p.shield=Math.min(p.maxShield,p.shield+p.maxShield/p.regen.fill*dt*(k||1));}
  function heal(p,n){const was=p.hp;p.hp=Math.min(p.maxHp,p.hp+n);return p.hp-was;}
  function refill(p){p.hp=p.maxHp;p.shield=p.maxShield;p.lastHit=-1e9;}
  const frac=p=>(p.hp+p.shield)/(p.maxHp+p.maxShield);

  /* ---------- damage lookups ---------- */
  // where a shot landed on a standing body: y measured from the feet, h = the body's height (head = top ~15%, torso to the waist)
  function zoneAt(y,h){const f=y/h;return f>=.85?'head':f>=.5?'torso':'other';}
  const player=(gun,zone)=>GUN[gun][zone||'torso'];
  // a ground NPC's shot (spec table × the threat level). NPC shots on you always land on the torso (Bryce Oct 25)
  const npc=(gun,zone)=>GUN[gun][zone||'torso']*LEVEL[lv()].dmg;
  const trooper=gun=>npc(gun||'ar','torso')*TROOPER[lv()];
  const npcAir=w=>AIR[w]*LEVEL[lv()].dmg*AIR_K;        // fractions are kept: rounding is TBD
  const hitChance=()=>LEVEL[lv()].hit;
  const rolls=()=>(typeof rng==='function'?rng():Math.random())<hitChance();

  // a craft's hull and shield recover together after the wait (k: Zeal 2). Fields: hull/maxHull, shield/maxShield, lastHit
  function craftTick(c,dt,t,k){if(t-c.lastHit<REGEN.craft.wait||c.hull<=0)return;const r=dt/REGEN.craft.fill*(k||1);
    c.hull=Math.min(c.maxHull,c.hull+c.maxHull*r);c.shield=Math.min(c.maxShield,c.shield+c.maxShield*r);}
  return{STD,CLASS,REGEN,MED_HP,GUN,AIR,LEVEL,AIR_K,TROOPER,EXTRA,LEGACY,CRAFT_GUN_CD,craftTick,
    pool,hit,tick,heal,refill,frac,zoneAt,player,npc,trooper,npcAir,hitChance,rolls,level:lv};
})();
