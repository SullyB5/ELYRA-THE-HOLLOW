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
    'gun.rifle.standard':      {f:['rifle-m16-a','rifle-m16-b'], vol:.5, rate:1, own:1, stream:1, tail:.7},   // (Nov 3) the M16 single round
    'gun.rifle.m254':          {f:'machine-gun-b-single',    vol:.44, rate:.9,   own:1, stream:1, tail:.6},
    'gun.rifle.night':         {f:'machine-gun-clean-single',vol:.4,  rate:1,    own:1, stream:1, tail:.5},
    'gun.rifle.carbine':       {f:'machine-gun-a-single',    vol:.4,  rate:1.12, own:1, stream:1, tail:.55},
    'gun.rifle.smg':           {f:'machine-gun-clean-single',vol:.38, rate:1.2,  own:1, stream:1, tail:.45},
    // captured enemy guns sound like their makers': the Herald rifle fires the Heralds' ray, the Hollow pulse gun the Host's shot
    'gun.rifle.herald-rifle':  {f:'scifi-laser-04', slice:[0,.5], vol:.4, rate:1.1, own:1, stream:1},
    'gun.rifle.hollow-gun':    {f:'scifi-warped-06', slice:[0,.5], vol:.42, rate:1, own:1, stream:1},
    // the SMG (Oct 28, Bryce: "the pistol sound, just a bunch of bullets super quick"): every SMG, yours or an enemy's
    'gun.smg.standard':        {f:'pistol-9mm',              vol:.38, rate:1.08, own:1, stream:1, tail:.18, vary:[.06,.12]},
    'gun.smg.npc':             {f:'pistol-9mm',              vol:.3,  rate:1.08, ref:550, stream:1, tail:.18, vary:[.06,.12]},
    'gun.lance.standard':      {f:'gun-shot-heavy',          vol:.55, rate:1,    own:1, tail:2.2},
    'gun.lance.desert':        {f:'gun-shot-heavy',          vol:.55, rate:.92,  own:1, tail:2.2},
    'gun.lance.longshot':      {f:'gun-shots-multi-2',       vol:.6,  rate:.95,  own:1},
    'gun.side.standard':       {f:'pistol-9mm',              vol:.46, rate:1,    own:1, tail:.9},   // (Nov 3) the 9mm
    'gun.side.pistol-custom':  {f:'gun-shots-multi-1',       vol:.5,  rate:1,    own:1},
    'gun.side.pistol-custom-2':{f:'gun-shots-multi-3',       vol:.5,  rate:1.06, own:1, tail:.9},
    'gun.side.revolver':       {f:'gun-shot-heavy',          vol:.45, rate:1.18, own:1, tail:1.2},
    'gun.breaker':             {f:'rocket-launcher-rpg',     vol:.5,  rate:1,    own:1},
    'gun.breaker.hollow-heavy':{f:'scifi-bass-heavy',       vol:.55, rate:.8,   own:1, tail:2.2},   // the Hollow's heavy
    'gun.breaker.herald-heavy':{f:'scifi-pulse-15',         vol:.5,  rate:.95,  own:1, tail:2},
    'gun.squad':               {f:['rifle-m16-a','machine-gun-b-single','machine-gun-clean-single'], vol:.34, ref:650, stream:1, tail:.5},
    'gun.keeper.trooper':      {f:'rifle-m16-a',             vol:.32, rate:1.04, ref:500, stream:1, tail:.45},
    'gun.walker':              {f:'cannon-shot',             vol:.5,  rate:1.05, own:1, tail:1.6},
    'gun.warthog':             {f:'machine-gun-a-single',    vol:.38, rate:.9,   ref:600, stream:1, tail:.6},   // the Warthog's chaingun (Oct 26)
    'gun.warthog.own':         {f:'machine-gun-a-single',    vol:.42, rate:.9,   own:1, stream:1, tail:.6},
    'gun.skiff':               {f:'machine-gun-a-single',    vol:.36, rate:1.08, own:1, stream:1, tail:.5},
    'gun.pilot':               {f:'machine-gun-clean-single',vol:.3,  rate:1.1,  own:1, stream:1, tail:.4},
    'gun.pilot.zeal':          {f:'machine-gun-clean-single',vol:.32, rate:1.3,  own:1, stream:1, tail:.4},
    'gun.fighter':             {f:'machine-gun-b-single',    vol:.3,  rate:1.15, ref:500, stream:1, tail:.4},
    'gun.capital':             {f:'cannon-shot',             vol:.7,  rate:.8,   ref:2400, tail:2.5},   // (Nov 3) the cannon
    'gun.flak':                {f:'machine-gun-clean-single',vol:.3,  rate:.85,  ref:900, tail:.4},
    'gun.pf.nose':             {f:'machine-gun-a-single',    vol:.34, rate:1.15, ref:500, stream:1, tail:.45},
    'gun.pf.nose.own':         {f:'machine-gun-a-single',    vol:.36, rate:1.15, own:1, stream:1, tail:.45},
    'gun.pf.big':              {f:'cannon-shot',             vol:.6,  rate:.9,   ref:900, tail:1.8},
    'missile.keeper':          {f:'rocket-launcher-rpg',     vol:.45, rate:1.05, ref:700, tail:2.6},
    'missile.keeper.big':      {f:'rocket-launcher-rpg',     vol:.55, rate:.9,   ref:1500, tail:3},

    /* ---- the Heralds: sci-fi only. Regular fire is a short slice of the ray gun, heavies the whole blast ---- */
    'gun.herald.rifle':        {f:'scifi-laser-04',  slice:[0,.5],  vol:.3,  rate:1.1,  ref:600, stream:1},
    'gun.herald.fighter':      {f:'scifi-zap-8',     slice:[0,.4],  vol:.28, rate:1.2,  ref:700, stream:1},
    'gun.herald.capital':      {f:'scifi-pulse-15',                 vol:.55, rate:.9,   ref:3400, tail:2},
    'gun.herald.bomber':       {f:'scifi-bass-heavy',               vol:.55, rate:.7,   ref:3400, tail:2.4},
    'gun.herald.mech':         {f:'scifi-laser-04',  slice:[0,.5],  vol:.34, rate:.9,   ref:700, stream:1},
    'gun.heavy':               {f:'scifi-bass-heavy',               vol:.5,  rate:1,    ref:900, tail:1.6},
    'gun.herald.warship':      {f:'laser-cannon',                   vol:.55, rate:.8,   ref:3000, tail:2.4},
    'gun.herald.flak':         {f:'scifi-zap-8',     slice:[0,.25], vol:.24, rate:1.5,  ref:700},
    'herald.charge':           {f:'scifi-rise-16',   slice:[0,.7],  vol:.42, rate:1.2,  ref:1200},

    /* ---- the Hollow and the Empty Host: sci-fi only ---- */
    'gun.hollow.trooper':      {f:'scifi-warped-06', slice:[0,.45], vol:.32, rate:1,    ref:600, stream:1},
    'gun.hollow.fighter':      {f:'scifi-warped-06', slice:[0,.35], vol:.28, rate:1.25, ref:700, stream:1},
    'gun.hollow.capital':      {f:'scifi-bass-heavy',               vol:.55, rate:.8,   ref:3400, tail:2},
    'gun.hollow.warship':      {f:'scifi-beam-12',                  vol:.5,  rate:.75,  ref:3000, tail:2.4},
    'missile.hollow':          {f:'scifi-rise-16',                  vol:.5,  rate:.8,   ref:1500, tail:2.6},
    // a missile or rocket landing (Breaker rockets, interceptor and walker missiles); every other explosion stays synthesized
    'missile.hit':             {f:['missile-explosion','expl-boom'], vol:.6, rate:1, ref:1500, tail:3.6, vary:[.06,.1]},

    /* ---- (Nov 3) explosions by size, the Spear's beam, a walker's feet ---- */
    'expl.small':              {f:['expl-fx','expl-boom'],         vol:.5,  ref:1100, tail:2.6, vary:[.08,.1]},
    'expl.mid':                {f:['expl-sfx','expl-loud-b'],      vol:.6,  ref:2600, tail:2.9, vary:[.06,.1]},
    'expl.big':                {f:['expl-massive','expl-loud-a'],  vol:.75, ref:6000, tail:3.6, vary:[.05,.08]},
    'expl.water':              {f:'expl-underwater',               vol:.6,  ref:3000, tail:6},
    'beam':                    {f:'laser-cannon',                  vol:.5,  ref:9000, tail:2.9},
    'mech.step':               {f:['mech-step-1','mech-step-2','mech-step-3','mech-step-4','mech-step-5','mech-step-6'], vol:.5, ref:500, vary:[.06,.15]},

    /* ---- (Nov 3) bullets around you: the crack of a near miss, ricochets, far-off gunfire, hits on you, your brass ---- */
    'whizz':                   {f:'bullet-whizz',     vol:.42, ref:200, tail:.9, vary:[.1,.15]},
    'ricochet':                {f:'ricochet-metal',   vol:.34, ref:200, tail:1.6, vary:[.12,.15]},
    'gun.distant':             {f:['distant-shot-a','distant-shot-b','distant-shot-c'], vol:.5, ref:4000, tail:2.6, vary:[.08,.2]},
    'gun.distant.burst':       {f:'distant-burst',    vol:.45, ref:4000, tail:2.7},
    'hit.shield':              {f:'bullet-impact',    vol:.3,  rate:1.25, own:1, vary:[.08,.15]},
    'hit.hull':                {f:['hit-body','bullet-hit-b','bullet-hit-metal'], vol:.42, own:1, tail:.8, vary:[.06,.12]},
    'hit.vehicle':             {f:['car-hit-1','car-hit-2','car-hit-3'], vol:.4, own:1, tail:1},
    'shield.break':            {f:'shield-impact',    vol:.62, own:1, vary:[.02,.05]},   // (Nov 3, Bryce) your shield gone
    'shield.up':               {f:'shield-impact', slice:[0,2], rev:1, vol:.4, own:1, vary:[0,0]},   // and back: the same impact, backwards
    'casing':                  {f:['casing-1','casing-2','casing-3','casing-4','casing-5','casing-6'], vol:.16, own:1, vary:[.08,.25]},
    'shell.drop':              {f:['shell-drop-1','shell-drop-2','shell-drop-3','shell-drop-4','shell-drop-5'], vol:.16, own:1, vary:[.08,.25]},

    /* ---- (Nov 3) footsteps, one set per ground; js/origin/03-play.js picks the set for each level and indoors ---- */
    'step.concrete':           {f:['step-concrete-1','step-concrete-2','step-concrete-3','step-concrete-4','step-concrete-5','step-concrete-6','step-concrete-7','step-concrete-8'], vol:.22, own:1, vary:[.06,.15]},
    'step.metal':              {f:['step-metal-1','step-metal-2','step-metal-3','step-metal-4','step-metal-5','step-metal-6','step-metal-7','step-metal-8'], vol:.2, own:1, vary:[.06,.15]},
    'step.sand':               {f:['step-sand-1','step-sand-2','step-sand-3','step-sand-4','step-sand-5','step-sand-6','step-sand-7','step-sand-8'], vol:.24, own:1, vary:[.06,.15]},
    'step.snow':               {f:['step-snow-1','step-snow-2','step-snow-3','step-snow-4','step-snow-5','step-snow-6','step-snow-7','step-snow-8'], vol:.24, own:1, vary:[.06,.15]},
    'step.gravel':             {f:['step-gravel-1','step-gravel-2','step-gravel-3','step-gravel-4','step-gravel-5','step-gravel-6','step-gravel-7','step-gravel-8'], vol:.22, own:1, vary:[.06,.15]},
    'step.trail':              {f:['step-trail-1','step-trail-2','step-trail-3','step-trail-4','step-trail-5','step-trail-6','step-trail-7','step-trail-8'], vol:.22, own:1, vary:[.06,.15]},
    'step.stairs':             {f:['step-stairs-1','step-stairs-2','step-stairs-3','step-stairs-4','step-stairs-5','step-stairs-6'], vol:.22, own:1, vary:[.06,.15]},

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
