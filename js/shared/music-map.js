/* Elyra · the score's recorded tracks. js/shared/music.js plays a synthesized score for every part below until a file is listed
   here and has loaded; then the file plays instead (looped, crossfaded in and out the same way). Put the MP3s in audio/music/ and
   list them by name without .mp3. A list of several is picked from at random each time that part comes in.

   The three in-play parts (Nov 3, Bryce: quiet like Halo 3: ODST, fast like Halo: Reach, the big trumpets and drums of Halo 3):
     quiet    exploring, between fights: sparse piano, soft choir, lots of space
     drive    a fight: driving strings and drums
     epic     the biggest fights and moments: brass, taiko, full choir
     resolve  a short swell when a fight ends (played once, then silence)
     sting    a short brass-and-drum hit for a huge moment (the Hollow King arriving, the Spear firing)
   Cutscenes pick a mood: cut.calm, cut.awe, cut.tense, cut.sorrow, cut.chill, cut.cave (a cutscene with no file plays the synth).
     sting.king is the Hollow King's own sting. levels{} at the bottom gives a level its own tracks.

   Fields: f  file name(s)   vol  level (default 1)   loop  false for a one-shot (resolve and sting are one-shots already)
   Example: quiet:[{f:'quiet-piano-1',vol:.8},{f:'quiet-piano-2'}],                                                               */
const MUSIC_MAP={
  base:'audio/music/',
  // the score everywhere (Nov 3: Bryce's picks, levelled by tools/audio-import.py)
  tracks:{
    // (Nov 4) Bones of the First Sky: the original (opening + 2:20), Transmission (a broken radio signal), Drift (high and weightless); two pianos stay
    // (Nov 7) the Bones tracks rebuilt by tools/bones-evolve.py: ~4.5 min each, re-sequenced bar by bar so nothing audibly loops
    // (Nov 8, Bryce) Transmission removed; quiet-bones, quiet-bones-drift and quiet-bones-deep kept
    // (Nov 9, Bryce: darker and deeper through the game, calm saved for the menu and Tide City) the dark Bones tracks from
    // tools/dark-score.py: Abyss (two semitones under Bones deep, a slow heartbeat) and Pulse (Bones drumless over a driving low pulse)
    quiet:[{f:'dark-bones-abyss'},{f:'dark-bones-pulse'},{f:'quiet-bones-deep'}],
    drive:[{f:'drive-epic-action'},{f:'drive-total-war'}],   // Reach: the fight (Nov 8, Bryce: drive-gritty removed)
    epic:[{f:'epic-cinematic-1'},{f:'epic-cinematic-2'}],                                           // Halo 3: brass and drums
    resolve:[],                                                // (the synth swell: no track fits yet)
    sting:[{f:'sting-drum-hit'}],                              // a huge moment: the dome, the Spear
    'sting.king':[{f:'sting-sub-drop',vol:.9}],                // the Hollow King arriving
    'cut.calm':[{f:'dark-bones-abyss'}],                       // (Nov 9) level cutscenes go dark; the piano stays Tide City's
    'cut.awe':[{f:'awe-bones-dark'}],                          // (Nov 9) Bones two semitones down with taiko; the original is the menu's
    'cut.tense':[{f:'dark-bones-pulse'}],                      // (Nov 9; was the synth's low strings and taiko)
    'cut.sorrow':[{f:'sorrow-tragic-piano'}],
    'cut.chill':[{f:'quiet-bones-deep'}],
    'cut.cave':[],                                             // (synth: the low choir drone under the mountain)
  },
  /* one level's own score, by page name; anything it doesn't list comes from tracks above. The same track for two parts keeps
     playing across them instead of restarting. */
  levels:{
    // Midnight Market, the night city map: jazz noir between fights and through them (Nov 3; Nov 4 remade faster with a retro drum machine)
    // (Nov 8, Bryce: it took a while to start) startIn: seconds after the sound wakes before the first track, instead of 9-18
    market:{quiet:[{f:'market-jazz-noir'}],drive:[{f:'market-jazz-noir'}],startIn:0},
    // the Hollow ship and the frozen glacier: the deep, slowed Bones opening, and the dreamscape / the melancholy piano
    // (Nov 9: the dreamscape and the melancholy piano were too calm; the Abyss in their place)
    husk:{quiet:[{f:'quiet-bones-deep'},{f:'dark-bones-abyss'}]},
    rime:{quiet:[{f:'quiet-bones-deep'},{f:'dark-bones-abyss'}]},
    keel:{quiet:[{f:'dark-bones-pulse'},{f:'dark-bones-abyss'}]},   // (Nov 10) the frigate's lower deck: dark and driving
    // Site K, the first level (Nov 9, Bryce: "wasn't bad but needs to be more intense"): always the Pulse between fights
    pathfinder:{quiet:[{f:'dark-bones-pulse'}]},
    // Tide City keeps the calm score (Nov 9, Bryce: the calm, relaxing music is saved for the menu and Tide City)
    'tide-city':{quiet:[{f:'quiet-bones'},{f:'quiet-bones-drift'},{f:'quiet-sad-piano'},{f:'quiet-dreamscape'}],
      'cut.calm':[{f:'calm-documentary-piano'}],'cut.awe':[{f:'awe-bones-of-the-first-sky'}]},
    // The Mountain's prologue (Nov 8, Bryce): Bones deep under the whole prologue, then parts of Epic Action over the title card at
    // its end (its opening four bars spliced into its last phrase and ending, ~20 s; built by tools/epic-ending.py)
    origin:{'cut.prologue':[{f:'quiet-bones-deep'}],'cut.prologue-end':[{f:'cut-epic-action-ending',loop:false}]},
  }
};
