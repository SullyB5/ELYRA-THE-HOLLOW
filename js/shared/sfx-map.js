/* Elyra · every sound event → the file it plays. ONE LINE PER EVENT: to change a sound, change its line; to add a file, put it in
   audio/sfx/ (run audio/sfx/process.sh once) and point an event at its name. The coverage checklist is audio/sfx/SOURCES.md.
   Anything whose file is missing or still loading plays its synthesized stand-in (js/shared/audio.js), so nothing goes silent.

   Fields (all optional except f):
     f      file name in audio/sfx/ without .mp3, or a list of names (one is picked at random each play)
     vol    level (the files are loudness-normalised, so these are mix levels)        rate   playback speed = pitch (1 = as recorded)
     vary   [pitch, volume] random spread per play, as fractions (default [.05,.1])   ref    distance where it is half as loud (scaled units, as shot() uses)
     slice  [start, length] in seconds, cut from the (trimmed) file                   rev    play the slice backwards
     tail   longest it may ring, seconds (it fades over the last 0.15 s)              loop   loops (engines)
     own    your own: centred and never attenuated                                    stream rapid fire: a new round fades the last one from the same shooter (40 ms), so a long hold never stacks
     big    ducks everything else for a moment                                        cut    belongs to a cutscene (stops if the cutscene is skipped)
     seq    several pieces in a row: [[delay, event], ...]                            */
const SFX_MAP={
  base:'audio/sfx/',
  ev:{
    /* ---- Keepers: you and your allies, normal guns. gun.<slot>.<Armory skin id>; a skin with no line uses its slot's .standard ---- */
    'gun.rifle.standard':      {f:'machine-gun-a-single',    vol:.42, rate:1,    own:1, stream:1, tail:.6},
    'gun.rifle.m254':          {f:'machine-gun-b-single',    vol:.44, rate:.9,   own:1, stream:1, tail:.6},
    'gun.rifle.night':         {f:'machine-gun-clean-single',vol:.4,  rate:1,    own:1, stream:1, tail:.5},
    'gun.rifle.carbine':       {f:'machine-gun-a-single',    vol:.4,  rate:1.12, own:1, stream:1, tail:.55},
    'gun.rifle.smg':           {f:'machine-gun-clean-single',vol:.38, rate:1.2,  own:1, stream:1, tail:.45},
    // captured enemy guns sound like their makers': the Herald rifle fires the Heralds' ray, the Hollow pulse gun the Host's shot
    'gun.rifle.herald-rifle':  {f:'ray-gun-blast', slice:[0,.42], vol:.4, rate:1.2, own:1, stream:1},
    'gun.rifle.hollow-gun':    {f:'gun-scifi-shot',          vol:.42, rate:.95,  own:1, stream:1},
    'gun.lance.standard':      {f:'gun-shot-heavy',          vol:.55, rate:1,    own:1, tail:2.2},
    'gun.lance.desert':        {f:'gun-shot-heavy',          vol:.55, rate:.92,  own:1, tail:2.2},
    'gun.lance.longshot':      {f:'gun-shots-multi-2',       vol:.6,  rate:.95,  own:1},
    'gun.side.standard':       {f:'pistol-shot-reverb',      vol:.42, rate:1,    own:1, tail:.9},
    'gun.side.pistol-custom':  {f:'gun-shots-multi-1',       vol:.5,  rate:1,    own:1},
    'gun.side.pistol-custom-2':{f:'gun-shots-multi-3',       vol:.5,  rate:1.06, own:1, tail:.9},
    'gun.side.revolver':       {f:'gun-shot-heavy',          vol:.45, rate:1.18, own:1, tail:1.2},
    'gun.breaker':             {f:'rocket-launcher-rpg',     vol:.5,  rate:1,    own:1},
    'gun.breaker.hollow-heavy':{f:'ray-gun-blast',           vol:.55, rate:.6,   own:1, tail:2.4},   // the Hollow's missile sound
    'gun.breaker.herald-heavy':{f:'ray-gun-blast',           vol:.55, rate:.85,  own:1, tail:2},
    'gun.squad':               {f:['machine-gun-b-single','machine-gun-clean-single'], vol:.34, ref:650, stream:1, tail:.5},
    'gun.keeper.trooper':      {f:'machine-gun-clean-single',vol:.3,  rate:1.05, ref:500, stream:1, tail:.4},
    'gun.walker':              {f:'gun-shot-heavy',          vol:.5,  rate:.72,  own:1, tail:1.6},
    'gun.skiff':               {f:'machine-gun-a-single',    vol:.36, rate:1.08, own:1, stream:1, tail:.5},
    'gun.pilot':               {f:'machine-gun-clean-single',vol:.3,  rate:1.1,  own:1, stream:1, tail:.4},
    'gun.pilot.zeal':          {f:'machine-gun-clean-single',vol:.32, rate:1.3,  own:1, stream:1, tail:.4},
    'gun.fighter':             {f:'machine-gun-b-single',    vol:.3,  rate:1.15, ref:500, stream:1, tail:.4},
    'gun.capital':             {f:'gun-shot-heavy',          vol:.7,  rate:.55,  ref:2400, tail:2.5},
    'gun.flak':                {f:'machine-gun-clean-single',vol:.3,  rate:.85,  ref:900, tail:.4},
    'gun.pf.nose':             {f:'machine-gun-a-single',    vol:.34, rate:1.15, ref:500, stream:1, tail:.45},
    'gun.pf.nose.own':         {f:'machine-gun-a-single',    vol:.36, rate:1.15, own:1, stream:1, tail:.45},
    'gun.pf.big':              {f:'gun-shot-heavy',          vol:.6,  rate:.7,   ref:900, tail:1.8},
    'missile.keeper':          {f:'rocket-launcher-rpg',     vol:.45, rate:1.05, ref:700, tail:2.6},
    'missile.keeper.big':      {f:'rocket-launcher-rpg',     vol:.55, rate:.9,   ref:1500, tail:3},

    /* ---- the Heralds: sci-fi only. Regular fire is a short slice of the ray gun, heavies the whole blast ---- */
    'gun.herald.rifle':        {f:'ray-gun-blast', slice:[0,.42],  vol:.3,  rate:1.25, ref:600, stream:1},
    'gun.herald.fighter':      {f:'ray-gun-blast', slice:[0,.38],  vol:.28, rate:1.45, ref:700, stream:1},
    'gun.herald.capital':      {f:'ray-gun-blast',                 vol:.55, rate:.9,   ref:3400, tail:2},
    'gun.herald.bomber':       {f:'ray-gun-blast',                 vol:.55, rate:.62,  ref:3400, tail:2.4},
    'gun.herald.mech':         {f:'ray-gun-blast', slice:[0,.4],   vol:.32, rate:1.05, ref:700, stream:1},
    'gun.heavy':               {f:'ray-gun-blast',                 vol:.5,  rate:1,    ref:900, tail:1.6},
    'gun.herald.warship':      {f:'ray-gun-blast',                 vol:.6,  rate:.55,  ref:3000, tail:2.6},
    'gun.herald.flak':         {f:'ray-gun-blast', slice:[0,.3],   vol:.26, rate:1.6,  ref:700},
    'herald.charge':           {f:'ray-gun-blast', slice:[.45,.7], rev:1, vol:.42, rate:1.2, ref:1200},

    /* ---- the Hollow and the Empty Host: sci-fi only ---- */
    'gun.hollow.trooper':      {f:'gun-scifi-shot',                vol:.3,  rate:1,    ref:600, stream:1},
    'gun.hollow.fighter':      {f:'gun-scifi-shot',                vol:.28, rate:1.2,  ref:700, stream:1},
    'gun.hollow.capital':      {f:'ray-gun-blast',                 vol:.55, rate:.8,   ref:3400, tail:2},
    'gun.hollow.warship':      {f:'ray-gun-blast',                 vol:.55, rate:.7,   ref:3000, tail:2.2},
    'missile.hollow':          {f:'ray-gun-blast',                 vol:.5,  rate:.6,   ref:1500, tail:2.6},
    // a missile or rocket landing (Breaker rockets, interceptor and walker missiles); every other explosion stays synthesized
    'missile.hit':             {f:'missile-explosion',             vol:.6,  rate:1,    ref:1500, tail:3.6, vary:[.06,.1]},

    /* ---- engines (loops), flybys, launches ---- */
    'loop.interceptor':        {f:'drone-engine-loop', loop:1, vol:.16, rate:1.2},
    'loop.walker':             {f:'drone-engine-loop', loop:1, vol:.3,  rate:.62},
    'loop.skiff':              {f:'car-engine-loop',   loop:1, vol:.4,  rate:1},    // the gun-skiff is warthog class
    'loop.warthog':            {f:'car-engine-loop',   loop:1, vol:.4,  rate:.92, ref:700},
    'engine.start':            {f:'car-engine',        vol:.5,  rate:1,   ref:600},     // a warthog-class engine turning over
    'engine.rev':              {f:'car-engine-roaring', vol:.45, rate:1, tail:2.4, ref:600},
    'loop.dropship':           {f:'drone-engine-loop', loop:1, vol:.4,  rate:.82, ref:900},
    'loop.mech':               {f:'drone-engine-loop', loop:1, vol:.38, rate:.5,  ref:600},
    'loop.carrier':            {f:'drone-engine-loop', loop:1, vol:.5,  rate:.4,  ref:4000},
    'flyby':                   {f:'ship-flyby-large',  vol:.55, vary:[.03,.08]},
    'launch':                  {f:'rocket-engine-large', vol:.55, vary:[.03,.08]},

    /* ---- doors, hatches, airlocks ---- */
    'door.big':                {f:'door-scifi-a', vol:.6,  rate:.72, ref:700},
    'door.open':               {f:'door-scifi-a', vol:.55, rate:.95, ref:500},
    'door.hatch':              {f:'door-scifi-b', vol:.5,  rate:1,   ref:400},

    /* ---- your gear and feedback (slices of the files above) ---- */
    'reload.out':              {f:'door-scifi-b', slice:[.0,.14],  vol:.36, rate:1.45, own:1},
    'reload.in':               {f:'door-scifi-b', slice:[.25,.13], vol:.4,  rate:1.6,  own:1},
    'reload.rack':             {f:'door-scifi-b', slice:[.43,.12], vol:.42, rate:1.8,  own:1},
    'empty':                   {f:'door-scifi-b', slice:[.43,.06], vol:.34, rate:2.3,  own:1, vary:[.03,.05]},
    'swap':                    {f:'door-scifi-a', slice:[.0,.24],  vol:.3,  rate:1.7,  own:1},
    'swap.click':              {f:'door-scifi-b', slice:[.25,.08], vol:.3,  rate:1.9,  own:1},
    'lowammo':                 {f:'door-scifi-b', slice:[.25,.05], vol:.3,  rate:2.6,  own:1, vary:[0,0]},
    'hit.hollow':              {f:'gun-scifi-shot', slice:[0,.09], vol:.2,  rate:2.1,  own:1},
    'hit.herald':              {f:'machine-gun-clean-single', slice:[0,.05], vol:.2, rate:2.4, own:1, seq:[[.012,'hit.clank']]},
    'nade.pin':                {f:'door-scifi-b', slice:[.43,.07], vol:.3,  rate:1.5,  own:1},
    'hit.clank':               {f:'door-scifi-b', slice:[0,.07],   vol:.22, rate:1.3,  own:1},
  },
};
