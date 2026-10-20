# Elyra · Roadmap

What's done, what's left, and who does what. **(You)** = Bryce, **(Claude)** = code work.

## Story (decided)

- **Origin:** the Hollow King steals the **Codex** (placeholder name: every Remnant star chart) and invites the Keepers to his mountain fortress, the Hollow. They go knowing it's a trap. He shows himself, says the Codex is already off-world, and springs the trap. Fight back to the ships, hold the landing zone while every ship powers up, fly home to Tide City. On the radio: the **Pathfinder** was sent after the Codex's trail to Astraea. At the end, contact with the Pathfinder is lost, so the fleet goes to see.
- **Astraea:** the Pathfinder wreck, the red aliens, the Covenant lost, the jump home.
- **Tide City:** the aliens attack, lose, and run; the Hollow King's fleet takes its chance.
- Two-front war: Hollow King + Empty Host (purple, black, silver) at home; the aliens of Astraea (red, black, bone) out there. Keepers blue/white/gold.
- Fleets: Hollow King = Harbinger flagship, Voidclass cruisers, Wraith fighters, Devourer bombers. Aliens = Harrower flagships, red Wraith-pattern fighters, Void Lancer bombers. No alien cruisers yet.

## Open decisions (You)

- [ ] Real name for the stolen treasure (it's "the Codex" for now)
- [x] Origin playtest notes (Oct 19): bots stuck on the first wall, gun firing from the foot, Easy too easy, ending black screen, intro lines not spoken, dialogue not urgent enough, trooper markers hard to see on iPhone. All addressed.
- [ ] Should Origin get a flying section after liftoff (dogfight out of the mountains), or is the escape cutscene enough?

## Not finished

### 1. Origin polish (first playable version is in)
- [ ] Playtest balance: trooper accuracy and numbers, ship charge times, squad strength
- [ ] Squadmates can't be hurt yet; engineers can't be hit
- [ ] Better character animation (reloading, crouch behind cover, hit reactions)
- [ ] Interior of the Hollow (it's only the gate and courtyard for now)
- [ ] Optional flying escape (see decision above)

### 2. Ships and places still to restyle (Claude)
- [ ] Keeper ships to the design sheet: Raven, Sentinel, Vanguard, Hammer, Warden, Pathfinder, Transport, Medic (the Vigil, Covenant, interceptor and freighters are still older models; Origin's dropships are new)
- [ ] Empty Host dropship to match the sheet
- [ ] Tide City tower, the Spear of Destiny, the space station
- [ ] Not used yet from the sheet: Guardian, Conduit, Ravager ruins, Blood Host, Vault Leviathan, Red Reclamation troops, The Hollow (unknown form), Hollow's Maw, outposts, rover, tank

### 3. Characters
- [x] Built in code: Marine, Engineer, Colonist, Civilian, Empty Host trooper, Hollow King (used in Origin)
- [ ] Use them in Tide City too (the Keeper guards and Empty Host troopers there are still the older simple models)

### 4. Polish
- [ ] Save progress mid-chapter (checkpoints). Scores, achievements, paints and difficulty already save.
- [ ] Settings screen on the main menu (sound, quality, difficulty in one place)
- [ ] Real recorded voices: (Claude) export a line-by-line script with file names; (You) record; (Claude) wire them in
- [ ] Balance pass from your playtests (all three chapters)
- [ ] Spear charge time: cut from 30s to 15s (Oct 19); confirm in the next playtest
- [ ] iPhone performance check, especially Origin's characters and Tide City's new ships

## Done

- Cutscenes at the start and end of every chapter (shared system, dialogue paced by the voices); Origin ending on the Tide City command deck
- Origin: rifle held properly (shots leave the barrel), squad and troopers steer round barricades, ambushes in cover and on the canyon walls, Origin difficulty numbers
- Tide City: bigger pulsing Empty Host markers and an on-screen cue pointing at them

- Origin: first playable version (intro cutscene, canyon advance, the Hollow King at his gate, trap, fallback, landing-zone defence with ship charge bars and Empty Host dropships, Pathfinder radio story, boarding, escape cutscene, Tide City ending). Cutscene system with skip.
- Astraea: full audio, unlimited missiles, 7 wingmen, flagship flak, Covenant wreck blows away from the Vigil, aliens rebuilt from the design sheet
- Tide City: aliens attack then retreat; the Hollow King's Harbinger and Voidclass arrive; bombers dive on towers; Zeal; sea gun button on phone
- Difficulty: Easy / Hard / Insane (all chapters)
- HUD: compact strip (Zeal left, shield gem draining, hull right); phone layouts; Menu pull-down
- Backups: `backup-*` branches on GitHub
