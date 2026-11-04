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

   Fields: f  file name(s)   vol  level (default 1)   loop  false for a one-shot (resolve and sting are one-shots already)
   Example: quiet:[{f:'quiet-piano-1',vol:.8},{f:'quiet-piano-2'}],                                                               */
const MUSIC_MAP={
  base:'audio/music/',
  tracks:{
    quiet:[],
    drive:[],
    epic:[],
    resolve:[],
    sting:[],
    'cut.calm':[],
    'cut.awe':[],
    'cut.tense':[],
    'cut.sorrow':[],
    'cut.chill':[],
    'cut.cave':[],
  }
};
