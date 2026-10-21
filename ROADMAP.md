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
- [ ] The footage's open questions (23 years, who or what sent them to the Hollow, why the Watcher fears the Spear)
- [ ] Make the footage chips secret again, or keep them open

### Art and assets (what "bringing it to life" needs)
- [ ] Surface textures (rock, sand, metal) from ambientCG or Poly Haven, 1K, to replace the code-made terrain detail
- [ ] A redo of the civilian in an A-pose with legs apart, if you want her walking
- [ ] Real 3D models, if you can get or commission them: an Empty Host trooper, Elias, the Hollow King, a Herald, civilians. **Rigged with animations** (idle, walk, run, aim, reload, die, talk) is the big jump in quality; unrigged models only get Claude's code rig
- [ ] Ship models in the design-sheet style (Vigil, Covenant, interceptor, Herald and Host ships)
- [ ] Optional: a sky/HDRI image per location for lighting (fixes the "dark background, blown-out bright ship" look)

### Playtesting
- [ ] iPhone: does the command-deck cutscene now play after the full prologue? (fix below)
- [ ] iPhone: the new phone controls (GEAR, double-tap aim, swipe-up grenade, JUMP, CROUCH, walk-up boarding)
- [ ] iPhone: try **Add to Home Screen** from Safari's Share menu and play from the icon (full screen, no address bar)
- [ ] Balance notes after playing the new weapons, turrets, dropship waves and squadmates going down

## Claude's list (next code work)

- [ ] **Pathfinder side mission** (next): Captain Rhen's crew reaching Astraea first
- [ ] Secret ending in Tide City: cancel the Spear's charge and keep the King's flagship and the Herald ship alive (`docs/CANON-NOTES.md` #14)
- [ ] Restyle the older ships to the design sheet: Vigil, Covenant, interceptor, freighters, Empty Host dropship; Tide City's tower, the Spear and the space station *(needs the sheet)*
- [ ] Design-sheet pieces not used yet: Guardian, Conduit, Ravager ruins, Blood Host, Vault Leviathan, Red Reclamation troops, outposts, rover, tank *(needs the sheet)*
- [ ] Cutscene lighting pass: environment lighting (image-based), softer bloom on bright hulls, rim lights on characters
- [ ] Set dressing for the other cutscenes (the landing zone, Tide City's ending, Astraea's fleet): the command deck got the first pass
- [ ] Checkpoints in Archive 02 and 03 (Archive 01 has them)
- [ ] Wire in your recorded voices when they exist
- [ ] Mission 01 · First Watch prototype, when you're ready to start the 15-mission campaign (`docs/PRODUCTION.md` §3)
- [ ] Balance pass from your notes

## Done (Oct 21): the PC playtest list

- **Archive 01:** prologue fixed (lost arks fade and vanish, no zoom glitch, Esc no longer freezes it, subtitles wait for the voice), Pathfinder shot fixed; Michael further from the camera on the deck; dropships climb high then drop straight down; new walk; perches for enemies on the cliffs, cliff walls you can't walk through, both passages open; the carved Hollow gate is back; terrain and stone retextured; low cover rocks in mixed sizes; King scene waits for every enemy; the Watcher now takes the Codex; nobody left behind when the ships lift; harder start on Hollow
- **Archive 02:** no snap at launch; no stray lights behind flagships; flagship and wreck break in half without the lag spike; the King's line isn't cut; warships launch fighters
- **Archive 03:** city lights cut; opening shot and spawn fixed; Hollow flagship faces forward; Call Fleet and up/down hidden on PC; alien flagships +25–30% HP, small Hollow ships −25%; new sea guns; no silences before cutscene lines; Raven traffic
- **Story:** ELYRA never sent them ("No vessel I command has been there"); "Do not use the Spear"; the third reel is the Watcher's warning and now unlocks after Archive 02; the "lives inside the Hollow" line is gone

## Done (Oct 20, night): Bryce's models

- **Characters:** Michael Hall (player), Elias Veyr (command deck), the Hollow King, the Empty Host trooper (aims its own rifle), each with a phone set (`models/`) and a sharper PC set (`models/pc/`). The Keeper civilian stands on the deck and pilots the allied wingmen (her legs are fused, so she doesn't walk)
- **Ships:** Vanguard = the Vigil (and a bigger Covenant), your interceptor, Raven wingmen, Harrower warships and raiders, Wraith fighters (purple for the Host, red for the Heralds), Voidclass cruisers, dropships on the Mountain pad. Code-built hulls stay underneath for hit detection
- **Places:** the cliff model forms the canyon walls and the ridge; Tide City at night with lit windows and the spire towers (painted, since the model came untextured); the Drowned Watcher under the Hollow
- **Skies:** rogland night over the Mountain landing, valley of desolation dawn from the fall back, Qwantani night over Tide City and through the deck window (NightSkyHDRI010 kept in `img/sky/night-alt-*` as a spare)

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
