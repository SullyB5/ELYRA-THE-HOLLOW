# Elyra · Roadmap

**(You)** = Bryce. **(Claude)** = code work. The lore is Bryce's Oct 22 update in `docs/lore-2026-10-22/` (see `docs/CANON-NOTES.md` first): new work reveals it or leaves clues, it doesn't change it.

## Your list (only you can do these)

### Story and writing
- [ ] Script and dialogue rewrite, then record the voices. Every spoken line has an ID in the script doc; name files by ID (`M-014.mp3`). New draft lines from Oct 20 to rewrite: the prologue's Heralds and Testament lines, Station Nine (Archive 01 ending), the Pathfinder recorder (Archive 02 ending), the sonar under the bay (Archive 03 ending), Michael's four sleep-log entries (service record)
- [ ] One-page timeline: Earth and the Great Collapse → the arks → Elyra and Tide City → the Keepers and the Remnant → the Hollow King → the three archives → the 15 missions (`docs/PRODUCTION.md` §2F)
- [ ] Simple location map: Elyra (Tide City, the King's mountain, the underground lake, Coastal Station Nine, the remote settlement), Astraea (the ruined city, the Testament, the Mountain)
- [ ] Character sheets for Michael, Elias and the Hollow King (looks, voice, what they want)
- [ ] Decisions still open in the bible's checklist: what the Empty Host is made of (mixed coalition?), Zeal's limits, how the Spear damaged the barrier and how it reinforces it, the Drowned Watcher's silhouette, the device the King uses on it
- [ ] Where the three archives sit in the 15-mission campaign (you said Archive 02 is second-to-last)
- [ ] Rewrite the Pathfinder draft lines (marked *(draft)* in `docs/PATHFINDER-SCRIPT.md`) and decide what the object is
- [ ] Play Pathfinder start to finish (Site K → Dead Ground → The White City) and rewrite Arc 03's draft lines (`docs/PATHFINDER-3-SCRIPT.md`) and the footage and menu drafts (`docs/FOOTAGE-SCRIPT.md`: reels 04–07 and the menu's voices); Rhen's "they found a way to stop it" still wants its resist/suppress wording
- [ ] Walk the White City off the streets and note what to add there
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

- [ ] Pathfinder S1 smoothing pass (Bryce's playtest notes)
- [x] **Pathfinder S2 · Dead Ground**: first playable built Oct 22 (needs your playtest, your rewrite of the draft lines, and a Herald soldier model). Brief: crash aftermath, the desert, the Herald civil war seen from the side, Dropship Two's beacon and the canyon defence, a small unexplained anomaly near the object, the white city on the horizon (`docs/lore-2026-10-22/pathfinder-the-lost-expedition.md`)
- [x] **Pathfinder S3 · The White City**: built and played through in the test browser Oct 22 (needs your playtest and your rewrite of the draft lines). After S2 (capture is locked; Rhen's "they found a way to stop it" becomes resist/suppress). Ends on Bryce's dome: the object goes in at the city's heart, a city-sized dome rises over it (decided: city-sized, it flickers when the Host arrive), then the Host take them and the dome falls (`docs/PATHFINDER-3-DOME.md`)
- [ ] Audit Tide City's secret-ending conditions and the Spear's reach before building the true ending (`docs/CANON-NOTES.md` #33)
- [ ] Restyle the older ships to the design sheet: Vigil, Covenant, interceptor, freighters, Empty Host dropship; Tide City's tower, the Spear and the space station *(needs the sheet)*
- [ ] Design-sheet pieces not used yet: Guardian, Conduit, Ravager ruins, Blood Host, Vault Leviathan, Red Reclamation troops, outposts, rover, tank *(needs the sheet)*
- [ ] Cutscene lighting pass: environment lighting (image-based), softer bloom on bright hulls, rim lights on characters
- [ ] Set dressing for the other cutscenes (the landing zone, Tide City's ending, Astraea's fleet): the command deck got the first pass
- [ ] Checkpoints in Archive 02 and 03 (Archive 01 has them)
- [ ] Wire in your recorded voices when they exist
- [ ] Mission 01 · First Watch prototype, when you're ready to start the 15-mission campaign (`docs/PRODUCTION.md` §3)
- [ ] Balance pass from your notes

## Done (Oct 22, last): the menu's secrets, rebuilt

- **Sonar** (the two small rings): each ping's return shows the Drowned Watcher (the real model) in the dark, lit only by the ping, closer each time; on the third it is right behind the card, its eyes open and it follows the pointer, then it sinks away.
- **The dark** (touching empty space): a real ship goes over, far out, and the stars go out behind it: the Harbinger (usually), a Host Voidclass, or a red Herald Harrower. The coordinates read CONTACT · NO TRANSPONDER while it passes.
- **The heartbeat**: a second one joins Michael's on the trace, slower and out of step, and the panel reads LIFE SIGNS ON THIS CHANNEL: 2. Then it stops.
- **The signal**: a real voice comes through the static with its voice print (ELYRA; after Pathfinder, Rhen from under the mountain, slowed).
- **Typed names**: MICHAEL (the card reads LT. MICHAEL HALL · 16.03.2237, ELYRA: "You are already there.") and RHEN ("Michael.").
- Code: `js/menu/secrets-3d.js` (a WebGL layer between the stars and the menu, drawn only while something is in it; the 3D loads with the footage's, quietly after 12 s on a PC, on the first secret on a phone). The old CSS eyes and painted silhouette stay as the fallback if the 3D can't load.

## Done (Oct 22, late night): Pathfinder finished

- **The White City** (Pathfinder Arc 03, `pathfinder-3.html`) played start to finish in the test browser (the flight in, the plaza, the streets, the tower, the barrier, the chamber, every cutscene) and fixed: the dropship turned the long way round past ±180° and flew off into the desert; it could fly over the wall or through it and then never make the opening (the city is now sealed from the air except through the opening, and Landry says so); a comment had swallowed the pitch control; Landry warned about the charge after you had already pulled it.
- **The ending, reworked after your notes:** much less white (narrower light pillar, cameras outside it, softer chamber lamps, a darker exposure under the dome, darker grey paving with dark seams, Landry's kit and the amber Heralds darker so they keep their detail); the socket's dais small enough that Rhen stands at it, not in it, and he holds the object in both hands and sets it in; a proper kneel (one knee on the floor, measured on each model) with the elbows bent and the hands forward; "Weapons down" lowers the rifles, no raised hands; the street Herald who stood on the camera is gone (a red pair and an amber pair face off and lower their rifles); the Host walk in through the dome from the desert, outside the wall; the transmitter is a field set with a screen, beside Landry, and the last shots frame it.
- **The whole city is walkable** (you asked for it in the main game): inside the wall it's floor everywhere, every building is solid at street level (`SOLIDS` in `js/pathfinder3/01-world.js`), the tower is solid except its door, the wall keeps you in. The story still runs up the streets.
- **Gold lines** cross only as a lattice: woven bands of three rings crossed by short verticals on the street façades and the city towers (with the long thread through them), two bands round the heart, and the chamber's rings tripled with its verticals running unbroken through them. A lone thread or lone ring stays on its own.
- **Recovered footage 07 · The Prisoners** (`js/menu/footage.js`, `T7`), unlocked by the new **The White City** achievement; on the Recovered logs panel and in the drawer. Rhen, Marsh, Thorne, Okafor and Landry's names are now their own plane on the wall of names (footage 07 burns them in; footage 03 shows them carved). New voices: whispers for the crew, Thorne in the footage, and Rhen's slowed echo.
- **Pathfinder is one finished entry on the menu**, played straight through like Last Transmission: Site K → Dead Ground → The White City with no stats or menu between (`?campaign=pf`, `PG.CAMPS` in `js/shared/progress.js`), Continue, jump to a part, start over.
- Script with line IDs: `docs/PATHFINDER-3-SCRIPT.md` (`P3-001`–`P3-105`). Every footage reel's lines, and the menu's voices, now in one place with IDs: `docs/FOOTAGE-SCRIPT.md` (`C1-`…`C7-`, `MV-`).

## Done (Oct 22, night): cutscene and footage review

- Every cutscene in all five missions shot by shot in a test browser: each is filmed in its own mission's scene, so sky, light and models match. Fixes: **rifles in hands** in every cutscene (anyone a shot doesn't pose, or whose model arrived mid-scene, gets their hands put back on the rifle: `holdRifles` in `js/origin/02-people.js`, called by `js/shared/cutscene.js`, so Pathfinder Arc 03 gets it too); The Mountain's lift-off shot reframed from over the open desert (it looked into the canyon wall); the hangar roof's dust in Pathfinder Arc 01 smaller and lower (up close it read as pale balls).
- **Footage 05 and 06:** the seated crew and the pilot have their rifles stowed (their arms brace on the seat, so the rifles were floating); Rhen's rifle is slung while he holds the recorder, his other arm at his side.

## Done (Oct 22, evening): longer Last Transmission parts 2 and 3

- **The Heralds:** search the wreck before Astraea wakes (the flight recorder, then scan each half of the Pathfinder: her dropship cradle is empty; her nav log points down at the planet). Between waves 2 and 3, **the convoy**: Herald transports run past the fleet with Herald fighters on them; hold fire on the transports and keep the fighters off (challenge for letting all three through). Then a cutscene: a Herald warship turns its guns on the surface, not on you, and keeps firing down through wave 3. Wave 3's warships carry **shield generators** (three burning nodes on top): the hull takes a tenth of the damage until they're broken.
- **The Empty Sky** (`js/tide/16-longer.js`): a new **evacuation** phase after the Heralds run: three shuttles lift civilians from the outer district to the shipyard and Herald stragglers fall on them. During the Host landing, **dropships board the sea guns** (shoot them off within 14 s or lose the gun), and three more landings. A short cutscene when the convoy crosses: the Hollow King's cruisers firing on a transport that never fires back.
- Every new cutscene is shot in-engine in its own mission's scene, so it carries that mission's sky, lighting and models.

## Done (Oct 22, late): seeing enemies, telling the sides apart, doors

- **The Empty Host** glow faintly purple from inside their armour, and the hollow ring in the chest is lit front and back. They read against the Host's own black walls (Pathfinder) and in the dark below the Hollow (brighter down there).
- **The two Herald sides** look nothing alike now: **red** wear their armour dark with red lights and a red crest; **amber** wear it pale as bone with amber lights and a banner pole on the back. A small mark over each head (red point, amber diamond), and the last-few-enemies markers are coloured and shaped by side.
- **Doors that don't open** (`js/shared/doors.js`), set into walls you already can't walk through, so no fight changes: Host doors along Pathfinder Arc 01's yard and halls (and up on the gallery behind the riflemen), sealed pointed arches in the old stone, two in the power room and its passage, big cargo doors in the hangar; Herald blockhouses half buried in the dunes along Dead Ground with blast doors and lit windows; bunker doors cut into the Mountain's canyon walls and both faces of the ridge, round the courtyard, at the foot of the carved face and on the King's balcony; sealed doors in the tunnel below the Hollow.
- **Arc 03 plan:** the dome (`docs/PATHFINDER-3-DOME.md`).

## Done (Oct 22, night): Pathfinder Arc 01 playtest fixes

- **Mission screen** is now a still rendered from the game's own command deck (marines, engineers, Elias, the 3D holo globe); `img/hq-loading-pc.webp` / `-phone.webp`. The deck's crew are all engineers now.
- **Where you're shot from:** a red wedge on a ring round the crosshair points at the shooter (all on-foot chapters).
- **Enemies stay where they belong:** troopers shoved by the crowd into a wall used to pop up 12–40 m (the wall's top); they're walked back into the open now. The yard's terrace is a flat walkway with a back wall, so riflemen up there stand in the open behind the parapet instead of inside the facility's mass.
- **Barricades:** shots clear the top rail (the hit box was ~0.7 m above it).
- **Windows:** the thin neon pinstripes are dimmer; the yard buttresses and the facility's mass have real smoked-glass windows.
- **The landing crater** is wider and its rim rises steeply, so the edge reads (it was an invisible wall).
- **The 'rock mountain':** the ground beside and behind the facility was built at the collision height (40 m up). It's the moon's own dunes now, so the gunship and the dropship no longer fly through it. The gunship circles out east, clear of the spires.
- **Dropship warning** ~10 s after the roof falls, a marker on her as she comes in, and a 10-second call.
- **Re-entry** no longer whites out the screen; **the crash** lands her on her belly.

## Done (Oct 22): the game brought up to the Oct 22 lore

- **Docs:** Bryce's six updated documents as markdown in `docs/lore-2026-10-22/`; `docs/CANON-NOTES.md` opens with the Oct 22 rulings (#27–36) and a before/after table of every game change.
- **Elias is honest:** Station Nine is logged as seen (no "sensor fault, classify the rest"); the Pathfinder's recorder is sealed as evidence to open together (no "nobody listens to it but me").
- **Tide City:** a Herald convoy crosses during the Host landing and never fires; the King's cruisers and fighters turn on it (the sea guns get a breather). The ending names the Spear's cost; the results say his fleet is gone, he is not.
- **Sleep log:** no Astraea in Michael's dreams; the Watcher's two lights, a Keeper captain with his face turned away, the bay lit gold.
- **Menu:** Pathfinder S2 Dead Ground and S3 The White City as unrecovered side files.
- **Pathfinder S1:** the Host's gunship and the cruisers that break the Pathfinder are Host Voidclass hulls (they were Herald Harrowers); Thorne notices the Host were studying the object; results text fixed. Bug fix: the dropship's big gun used a bolt material that didn't exist yet, which could break every frame of the chase.

## Done (Oct 21, late): Pathfinder, side mission S1

- **Playable** at `pathfinder.html` and on the menu.
- **Opening cutscene:** orbit → the dropship's bay → the jump → the fall → the crater.
- **Assault:** the yard with its wall guns → blow the gate → the Host halls and the galleried hall → the old stone → the sealed door.
- **Chamber cutscene:** the lights going out, "Take it."
- **Extraction:** under alarm, with doors slamming and floor guns rising. The gunship comes through the hangar roof, and you hold the deck until the dropship arrives.
- **The chase:** you fly the dropship against Host fighters, and the Pathfinder is broken in two in front of you.
- **Ending cutscene:** "Can we make Slipscape?" "No." → the missile → Astraea's air → the crash → the wreck → "They followed us."
- **Script:** `docs/PATHFINDER-SCRIPT.md`, every line with an ID. New voices for Rhen, Marsh, Okafor, Thorne, Landry and the Host speakers.

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
