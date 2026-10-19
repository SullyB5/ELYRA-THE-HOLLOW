# Elyra · Roadmap

What's done, what's left, and who does what. **(You)** = Bryce, **(Claude)** = code work.

## Story (decided)

- Two-front war. The Keepers fight the **Hollow King + Empty Host** at home (introduced in Origin) and the **aliens of Astraea** (introduced with the loss of the Pathfinder).
- The second wave over Tide City is the **Hollow King's own fleet**, using the alien attack to make his move for the city.
- Palette: Keepers blue/white/gold · Hollow King, his fleet and the Empty Host purple/black/silver · Astraea aliens red.

## Open decisions (You)

- [ ] Which design-sheet enemy ships are alien and which are Hollow? (Harbinger, Voidclass, Reaper, Shade, Wraith, Devourer)
- [ ] Phone button for the sea guns? (PC = G)
- [ ] Origin gameplay: fly, walk, defend, escape, or a mix?
- [ ] Is the Hollow King himself seen (character model), or only heard?

## Not finished

### 1. Level 1 · Origin (not built)
- [ ] Cutscene system (Claude): camera paths, captions, letterbox bars, skip button
- [ ] Opening cutscene (~1 min, skippable): Elyra under ground attack, search ships sent to Astraea, contact lost
- [ ] Gameplay (Claude, after your decision above)
- [ ] Ending that hands off into Astraea

### 2. Restyle to the design sheet (Claude)
- [ ] Keeper ships: Raven, Sentinel, Vanguard, Hammer, Warden, Pathfinder, Transport, Medic
- [ ] Enemy ships: Harbinger, Voidclass, Reaper, Shade, Wraith, Devourer (split into alien red / Hollow purple)
- [ ] Tide City tower, the Spear of Destiny, the space station
- [ ] Faction colours are in place on the current ships; the shapes still need the sheet

### 3. Character models
- [ ] (You) Pick 3–5: Marine, Empty Host trooper, Hollow King, maybe Civilian and Colonist
- [ ] (You) Crop each from the sheet → Meshy / Tripo / Rodin / CSM (low-poly) → export .glb
- [ ] (You) Mixamo: upload, auto-rig, download idle / walk / run / shoot / death
- [ ] (You) Check each tool's terms allow use in YouTube videos (free tiers often differ from paid)
- [ ] (Claude) Load the models and animations into the game

### 4. Polish
- [ ] Save progress mid-chapter (checkpoints). Scores, achievements, paints and difficulty already save.
- [ ] Main menu polish (settings screen: sound, quality, difficulty in one place)
- [ ] Real recorded voices: (Claude) export a line-by-line script with file names; (You) record; (Claude) wire them in
- [ ] Balance pass from playtests of Easy / Hard / Insane
- [ ] Spear charge time (needs a playtest note)
- [ ] iPhone performance check (frame rate in the big fights)
- [ ] Phone landscape layout check on a real iPhone after this update

## Done

- Astraea: full audio, top HUD (PC), unlimited missiles (1.5 s cooldown), 7 wingmen, flagship flak, fixed flagship collisions, goals hidden in fights, Covenant wreck now blows away from the Vigil, aliens red
- Tide City: 2 enemy waves (second one is now the Hollow King's purple fleet), shootable frigates, troopers path around buildings, Keeper guards, bigger city, collapsing towers, city can fall, shield/hull, full audio, G = sea gun, **Zeal** (Z / ZEAL button)
- Difficulty: Easy / Hard / Insane on the menu and every briefing. Insane = the original Tide City siege and the original Astraea waves. Hard is the default.
- iPhone (Tide City): ship strip at the top, compass at bottom left, Sound/Quality/Chapters moved to a top-right row so they don't sit under FIRE
- Backups: `backup-*` branches on GitHub
