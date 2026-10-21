# Elyra · Roadmap

**(You)** = Bryce. **(Claude)** = code work. The lore is locked in `docs/` (see `docs/CANON-NOTES.md` first): new work reveals it or leaves clues, it doesn't change it.

## Your list (only you can do these)

### Story and writing
- [ ] Script and dialogue rewrite, then record the voices. Every spoken line has an ID in the script doc; name files by ID (`M-014.mp3`). New draft lines from Oct 20 to rewrite: the prologue's Heralds and Testament lines, Station Nine (Archive 01 ending), the Pathfinder recorder (Archive 02 ending), the sonar under the bay (Archive 03 ending), Michael's four sleep-log entries (service record)
- [ ] One-page timeline: Earth and the Great Collapse → the arks → Elyra and Tide City → the Keepers and the Remnant → the Hollow King → the three archives → the 15 missions (`docs/PRODUCTION.md` §2F)
- [ ] Simple location map: Elyra (Tide City, the King's mountain, the underground lake, Coastal Station Nine, the remote settlement), Astraea (the ruined city, the Testament, the Mountain)
- [ ] Character sheets for Michael, Elias and the Hollow King (looks, voice, what they want)
- [ ] Decisions still open in the bible's checklist: what the Empty Host is made of (mixed coalition?), Zeal's limits, how the Spear damaged the barrier and how it reinforces it, the Drowned Watcher's silhouette, the device the King uses on it
- [ ] Where the three archives sit in the 15-mission campaign (you said Archive 02 is second-to-last), and whether you want the **Pathfinder side mission** (play Captain Rhen's crew reaching Astraea first)
- [ ] The Call footage's questions (23 years, "the incident", the date on Michael's name, what the creature is afraid of)
- [ ] Make the footage chips secret again, or keep them open

### Art and assets (what "bringing it to life" needs)
- [ ] The design sheet image again (attach it in chat): Claude needs it to restyle the ships and build the unused pieces
- [ ] Real 3D models, if you can get or commission them: an Empty Host trooper, Elias, the Hollow King, a Herald, civilians. **Rigged with animations** (idle, walk, run, aim, reload, die, talk) is the big jump in quality; unrigged models only get Claude's code rig
- [ ] Ship models in the design-sheet style (Vigil, Covenant, interceptor, Herald and Host ships)
- [ ] Optional: a sky/HDRI image per location for lighting (fixes the "dark background, blown-out bright ship" look)

### Playtesting
- [ ] iPhone: does the command-deck cutscene now play after the full prologue? (fix below)
- [ ] iPhone: the new phone controls (GEAR, double-tap aim, swipe-up grenade, JUMP, CROUCH, walk-up boarding)
- [ ] iPhone: try **Add to Home Screen** from Safari's Share menu and play from the icon (full screen, no address bar)
- [ ] Balance notes after playing the new weapons, turrets, dropship waves and squadmates going down

## Claude's list (next code work)

- [ ] Restyle the older ships to the design sheet: Vigil, Covenant, interceptor, freighters, Empty Host dropship; Tide City's tower, the Spear and the space station *(needs the sheet)*
- [ ] Design-sheet pieces not used yet: Guardian, Conduit, Ravager ruins, Blood Host, Vault Leviathan, Red Reclamation troops, outposts, rover, tank *(needs the sheet)*
- [ ] Cutscene lighting pass: environment lighting (image-based), softer bloom on bright hulls, rim lights on characters
- [ ] Set dressing for the other cutscenes (the landing zone, Tide City's ending, Astraea's fleet): the command deck got the first pass
- [ ] Checkpoints in Archive 02 and 03 (Archive 01 has them)
- [ ] Wire in your recorded voices when they exist
- [ ] Mission 01 · First Watch prototype, when you're ready to start the 15-mission campaign (`docs/PRODUCTION.md` §3)
- [ ] Balance pass from your notes

## Done (Oct 20, evening)

- **Lore locked:** the three canon docs are in `docs/` with Bryce's rulings in `CANON-NOTES.md`. Michael is **Michael Hall** everywhere. The prologue now has the Heralds as scripture ("something is coming"), the Spear carried out of the Collapse, and the Codex's true name (the Testament of the First Word). The creature is the Drowned Watcher and the lake under the mountain reaches the sea. New clues in each archive's ending; Michael's **sleep log** in the service record (dreams of Astraea before he's been there); the footer reads "before the Second Collapse"
- **Phone controls:** one GEAR button (tap shield, hold sentry); double-tap the right side to aim; swipe up off FIRE for a grenade (NADE still there); walk up to your interceptor to board (E still works on PC)
- **Jump and crouch are back:** Space / C or Ctrl on PC, JUMP / CROUCH on phone
- **Guns held properly:** the rifle sits in the shoulder and both hands grip it (two-bone arm IK), lowered across the chest when running or idle; works on the code rig and the models
- **Empty Host trooper rebuilt:** silver faceless mask, a hollow purple ring in the chest, spined pauldrons, torn tabard. Used in The Mountain, the prologue, and (baked) for Tide City's troopers
- **Civilians** in the Keepers' palette (cream coats, blue, gold), three variants
- **Squadmates can be hurt:** they go down, get back up after a while (faster if you stand over them), and everyone's back up for boarding
- **Checkpoints in Archive 01:** below the Hollow, the fall back, the landing zone; reopening the archive offers Resume or Start over
- **Settings** on the menu: sound, graphics quality, model detail (Auto / Light / Full), threat level, full-screen help
- **Phone vs PC models:** `models/` is the phone set; drop sharper files in `models/pc/` and list them in `PC_FILES` (js/shared/models.js) and PCs load them automatically
- **Full screen on iPhone:** web-app manifest and icon; "Add to Home Screen" runs the whole game with no Safari bars. A one-time hint on the menu explains it
- **Fixes:** the prologue now borrows the chapter's renderer instead of opening a second WebGL context (the likely cause of the command-deck cutscene not showing on iPhone after the full prologue); prologue Keepers, Host and King face the camera; Archive 02's ending no longer has your interceptor parked in front of the camera or leftover hyperspace streaks; Tide City remembers the quality setting
- **Command deck dressed:** crew at the consoles, live screens, guards on the door, a wall map of Elyra's ocean (Station Nine blinking), banners, ceiling lights, railing, kit cases, interceptors patrolling outside

## Earlier

Oct 20 (afternoon): campaign mode, prologue in 3D, below the Hollow, the leviathan, footage in 3D, the archive menu, threat levels, The Mountain's two canyons and new weapons. Before that: pause, Tide City fixes, cutscenes in every chapter, Origin first playable. Backups on the `backup-*` branches.
