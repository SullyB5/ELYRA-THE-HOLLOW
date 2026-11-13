Score tracks go here (MP3). List them in js/shared/music-map.js under quiet / drive / epic / resolve / sting / cut.<mood>.
Until a part has a file, js/shared/music.js plays its synthesized version.

Bones of the First Sky tracks (Nov 7-8 2026, built by tools/bones-evolve.py from awe-bones-of-the-first-sky.mp3; ~4.5 min each,
re-sequenced bar by bar so nothing audibly loops. Bryce likes all three; quiet-bones-transmission was removed Nov 8):
  awe-bones-of-the-first-sky   the original song: main menu music and cut.awe
  quiet-bones                  the original sound: in the quiet (between fights) rotation on every level
  quiet-bones-drift            a fifth up, slowed, high and weightless: in the quiet rotation on every level
  quiet-bones-deep             a fifth down, slow and dark: cut.chill, and the quiet track on husk (Hollow ship) and rime (glacier)

The Mountain's prologue (Nov 8 2026, Bryce):
  quiet-bones-deep             under the whole prologue, from its first card to its last shot (cut.prologue, origin only)
  cut-epic-action-ending       parts of Epic Action over the prologue's closing title card: its opening four bars spliced on the bar
                               line into its last phrase and ending, ~20 s (cut.prologue-end; built by tools/epic-ending.py)

The dark score (Nov 9 2026, Bryce: darker and deeper music on the Pathfinder mission and throughout the game; the calm, relaxing
music is saved for the menu and Tide City; Site K wasn't bad but needed more intensity). Built by tools/dark-score.py:
  dark-bones-abyss             quiet-bones-deep two semitones lower and darker, a slow heartbeat on its beat: in the quiet rotation
                               on every level, cut.calm on the levels, and the quiet track on husk and rime (with quiet-bones-deep)
  dark-bones-pulse             Bones drumless and darkened over a driving low pulse (taiko, ghost hits, tom runs, ticking 16ths):
                               Site K's only quiet track, in the quiet rotation everywhere else, and cut.tense
  awe-bones-dark               Bones of the First Sky two semitones down, taiko where it's up, top kept clear (Nov 9: less muffled): cut.awe on the levels
Where the calm tracks still play: the main menu (the original Bones), Tide City (quiet-bones, quiet-bones-drift, quiet-sad-piano,
quiet-dreamscape, the documentary piano for its calm cutscenes, the original Bones for awe). quiet-melancholy is no longer used.

Nov 13 2026 (Bryce): the main menu plays quiet-dreamscape (index.html and js/menu/call-sound.js), in place of the original Bones,
which still plays in Tide City's cut.awe and its quiet rotation.
  epic-hybrid                  Epic Two's opening, then Epic One at Epic Two's beat (x1.233, pitch kept), speeding up 6.5% from 20 s in;
                               then its first 40 s cut off (Bryce, Nov 13), so it opens inside Epic One.
                               Built by tools/trailer/hybrid.py; the Believe clip's music (tools/trailer/ACTION.md). Not used in the game yet.
