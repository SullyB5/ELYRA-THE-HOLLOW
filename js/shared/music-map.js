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
    // (Nov 4) Bones of the First Sky's opening and 2:20 passage, extended, plus two variations of the opening; two pianos stay
    quiet:[{f:'quiet-bones'},{f:'quiet-bones-opening'},{f:'quiet-bones-pulse'},{f:'quiet-sad-piano'},{f:'quiet-dreamscape'}],
    drive:[{f:'drive-epic-action'},{f:'drive-gritty'},{f:'drive-total-war'}],   // Reach: the fight (drive-gritty: Epic Action slowed, darker)
    epic:[{f:'epic-cinematic-1'},{f:'epic-cinematic-2'}],                                           // Halo 3: brass and drums
    resolve:[],                                                // (the synth swell: no track fits yet)
    sting:[{f:'sting-drum-hit'}],                              // a huge moment: the dome, the Spear
    'sting.king':[{f:'sting-sub-drop',vol:.9}],                // the Hollow King arriving
    'cut.calm':[{f:'calm-documentary-piano'}],
    'cut.awe':[{f:'awe-bones-of-the-first-sky'}],
    'cut.tense':[],                                            // (synth: low strings and taiko)
    'cut.sorrow':[{f:'sorrow-tragic-piano'}],
    'cut.chill':[{f:'quiet-bones-deep'}],
    'cut.cave':[],                                             // (synth: the low choir drone under the mountain)
  },
  /* one level's own score, by page name; anything it doesn't list comes from tracks above. The same track for two parts keeps
     playing across them instead of restarting. */
  levels:{
    // Midnight Market, the night city map: jazz noir between fights and through them (Nov 3; Nov 4 remade faster with a retro drum machine)
    market:{quiet:[{f:'market-jazz-noir'}],drive:[{f:'market-jazz-noir'}]},
    // the Hollow ship and the frozen glacier: the deep, slowed Bones opening, and the dreamscape / the melancholy piano
    husk:{quiet:[{f:'quiet-bones-deep'},{f:'quiet-dreamscape'}]},
    rime:{quiet:[{f:'quiet-bones-deep'},{f:'quiet-melancholy'}]},
  }
};
