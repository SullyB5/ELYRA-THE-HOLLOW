# Elyra · Roadmap

What's done, what's left, and who does what. **(You)** = Bryce, **(Claude)** = code work.

## Story and factions (decided)

- Two-front war. The Keepers fight the **Hollow King + Empty Host** at home (introduced in Origin) and the **aliens of Astraea** (introduced with the loss of the Pathfinder).
- In Tide City the aliens attack first, lose, and run. Then the **Hollow King** uses the moment to make his own move for the city.
- Look: both enemy factions fly black hulls with thick glowing highlights. Aliens glow red, the Hollow King's fleet glows purple. Keepers are blue/white/gold.
- **Hollow King's fleet:** Harbinger (flagship) launches Devourer bombers and Wraith fighters; Voidclass are his cruisers.
- **Aliens:** Harrower (flagship) launches Void Lancer bombers and red Wraith-pattern fighters. No alien cruisers for now, just flagships.
- **Origin** will be a ground level, maybe ground and air.

## Open decisions (You)

- [ ] Origin: pure ground, or ground then a flight section? What's the goal (hold a position, escort, escape to the ships)?
- [ ] Is the Hollow King seen in person in Origin, or only heard on the radio?
- [ ] Characters: the 3D model sites wanted payment to download. Options: (a) I build simple low-poly characters in code from your images (Marine, Engineer, Colonist, Civilian, Empty Host trooper), like I did the ships; (b) you find a free tool/plan later and I swap them in. Pick one.

## Not finished

### 1. Level 1 · Origin (not built)
- [ ] Cutscene system (Claude): camera paths, captions, letterbox bars, skip button
- [ ] Opening cutscene (~1 min, skippable): Elyra under ground attack, search ships sent to Astraea, contact lost
- [ ] Ground movement: walk/run, aim and shoot on foot, cover (Claude)
- [ ] Ground level map and enemies (Empty Host troopers), maybe an air section (Claude, after your decision above)
- [ ] Ending that hands off into Astraea

### 2. Ships and places still to restyle (Claude)
- [ ] Keeper ships to the design sheet: Raven, Sentinel, Vanguard, Hammer, Warden, Pathfinder, Transport, Medic (the Vigil, Covenant, interceptor and freighters are still the older models)
- [ ] Empty Host dropship to match the sheet's Dropship
- [ ] Tide City tower, the Spear of Destiny, the space station
- [ ] Not used yet from the sheet: Guardian, Conduit, Ravager ruins, Blood Host, Vault Leviathan, Red Reclamation troops, The Hollow (unknown form), Hollow's Maw, outposts, rover, tank

### 3. Characters
- [ ] Marine, Mechanic/Engineer, Colonist, Civilian (your reference images), Empty Host trooper, Hollow King
- [ ] Animations: idle, walk, run, shoot, death

### 4. Polish
- [ ] Save progress mid-chapter (checkpoints). Scores, achievements, paints and difficulty already save.
- [ ] Settings screen on the main menu (sound, quality, difficulty in one place)
- [ ] Real recorded voices: (Claude) export a line-by-line script with file names; (You) record; (Claude) wire them in
- [ ] Balance pass from your playtests of Easy / Hard / Insane, including the new bombers and the alien retreat timing
- [ ] Spear charge time (needs a playtest note)
- [ ] iPhone performance check with the new ships (frame rate in the big fights)

## Done

- Astraea: full audio, unlimited missiles (1.5 s cooldown), 7 wingmen, flagship flak, fixed flagship collisions, goals hidden in fights, Covenant wreck blows away from the Vigil, aliens rebuilt as Harrowers, red Wraiths and Void Lancers
- Tide City: aliens (4 Harrowers + raiders) attack, break when one is left and jump away; then the Hollow King (Harbinger + 4 Voidclass) arrives. Bombers dive on towers. Shootable frigates, troopers, Keeper guards, collapsing towers, city can fall, shield/hull, Zeal, full audio
- Difficulty: Easy / Hard / Insane on the menu and every briefing (Insane = the original Tide City siege and Astraea waves)
- HUD: smaller strip; Zeal left, shield gem in the middle (drains down, no number), hull right; speed beside MSL
- Phone: ship strip at the top, compass bottom left, GUN button for the sea guns, Sound/Quality/Chapters in a Menu pull-down
- Backups: `backup-*` branches on GitHub
