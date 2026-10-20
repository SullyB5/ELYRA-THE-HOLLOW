# Elyra · Roadmap

What's done, what's left, and who does what. **(You)** = Bryce, **(Claude)** = code work.

## Story (decided)

- **Archive 01 · The Mountain:** the Hollow King took the Codex (placeholder name) and disappeared into the old mountains. Three days later the Pathfinder sent one final message: *we were wrong about the Heralds*. Then silence. The Vigil finds the mountain; something beneath it is still transmitting on the Pathfinder's frequency. Michael goes in; no one follows him below. The voice in the tunnels sounds like Captain Rhen of the Pathfinder: it isn't him. The trap, the fall back, the landing zone, the escape. The rest of the message: the Heralds are not invading, they are running.
- **Archive 02 · The Heralds:** Astraea, the Pathfinder wreck, three waves of Heralds that keep climbing for open space, the Covenant lost, the jump home.
- **Archive 03 · The Empty Sky:** the Heralds lead the war to Elyra and run; the Hollow King's fleet comes for the city; the Spear of Destiny wakes. *He knows what humanity did, and what you have to become.*
- Two-front war: Hollow King + Empty Host (purple, black, silver) at home; the Heralds of Astraea (red, black, bone) out there. Keepers white/blue/gold.

## Open decisions (You)

- [ ] Real name for the stolen treasure (it's "the Codex" for now)
- [ ] What the Heralds are running from (the story only hints at it so far)
- [ ] What "what humanity did" is, and what Michael has to become
- [ ] Should The Mountain get the inside of the Hollow (going below), or does that wait for another archive?
- [ ] The Call's questions: is Michael in the office or remembering it; is the Hollow a place or outside normal space; did ELYRA bring him there; what was "the incident"; why 23 years; the date on his name (17.03.2237, the day after Archive 03); what the creature is afraid of behind him
- [ ] One long first level or several short ones (see the notes from Oct 20)

## Not finished

### Restyling to the design sheet (Claude)
- [ ] Keeper ships: the Vigil, Covenant, interceptor and freighters are still the older models
- [ ] Empty Host dropship
- [ ] Tide City tower, the Spear and the space station
- [ ] Not used yet from the sheet: Guardian, Conduit, Ravager ruins, Blood Host, Vault Leviathan, Red Reclamation troops, outposts, rover, tank

### Characters
- [ ] Jump and crouch: switched off for now (the code is kept); bring back later
- [x] Keeper Marine, Engineer and Robot models in The Mountain (rigged in code); Michael has his own (higher detail) model
- [x] Tide City's Keeper guards use the Marine model
- [ ] Tide City's Empty Host troopers are still the older simple figures (no model for the Host yet)
- [ ] (You) a Host trooper model, and a civilian model in the same style as the Keepers if you want one back
- [ ] Squadmates can't be hurt yet

### Phone controls (ideas saved for later)
- [ ] Merge SHLD and SNTRY into one gear button: tap for the shield, hold for the sentry
- [ ] Board automatically when you walk up to your interceptor (no BOARD button)
- [ ] Double-tap the right side of the screen to aim, instead of the AIM button
- [ ] Swipe up off FIRE to throw a grenade, instead of NADE (least discoverable: do last, if at all)

### Polish
- [ ] Mid-chapter checkpoints
- [ ] A settings screen on the menu (sound, quality, threat level in one place)
- [ ] Recorded voices: (Claude) export a line-by-line script with file names; (You) record; (Claude) wire them in
- [ ] Balance pass from your playtests (The Mountain's new weapons, turrets and dropship waves especially)
- [ ] (You) iPhone check: voices and cutscenes, the new phone buttons, frame rate in The Mountain

## Done (Oct 20, later)

- **The Call:** the idle-menu secret in three parts (The Call, The Return, The Hollow) unlocked by progress; menu music; the red light, access record and the silent menu afterwards

## Done (Oct 20)

- **Menu:** the Keeper archive from the design: mission select with in-game shots, threat level, operator and file panels, clearance footer, signal readout, ODST-style casing lines, corruption on Archives 02 and 03; service record, paints and achievements in a drawer
- **Threat levels:** Survivor / Keeper / Hollow
- **The Mountain:** two canyons around a ridge with tunnels and a Hollow door; new terrain and sky; the Harbinger over the mountain; Pulse rifle, Lance (scope), Breaker launcher; aim, reload; mobile shield, shoulder sentry, Zeal; HP (not hull), regeneration and pickups; Hollow turrets; new dropship waves (3/3/4, then 4/4); command deck opening and ending; voices in the tunnels; reload, crouch and hit animations
- **The Heralds:** the launch no longer flies into the Vigil; the fleet turns away from the planet before jumping; the Heralds named, and shown running; the "built for war" line replaced
- **The Empty Sky:** the Spear charges 30 s from the moment the Hollow fleet arrives, fires at the biggest ship first (the Harbinger), recharges; its lines follow the charge; Harbinger model
- **Script:** repeats removed; Michael has a new, deeper voice, harder in a fight
- **Phone controls:** Zeal is a tap on the shield gem when it turns gold (every chapter); reload is a small ammo box showing the magazine; weapon switch a small ⇄ chip; jump and crouch off for now
- **Live:** merged into `main` on Oct 20; the old version is on `backup-2026-10-20-before-archive`
- **iPhone:** voices unlock on the first tap (and Siri voices, which a page can't use, are skipped); cutscenes no longer stall when a voice doesn't start; cutscenes widen on a phone held upright; Menu moved into Pause; HUD pieces no longer overlap; sharper rendering by default

## Earlier

- Pause in all three chapters; Tide City fast-kill radio fixes; cutscenes at the start and end of every chapter; Origin first playable; Astraea audio, wingmen and rebuilt aliens; Tide City's two waves, Zeal and sea guns; difficulty; the compact HUD. Backups on the `backup-*` branches.
