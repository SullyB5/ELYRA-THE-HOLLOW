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

## Done (Oct 27, late): the real endings, and The Heralds' flight everywhere

- **The First Word's two endings** (`js/tide/19-endings.js`, `docs/ENDINGS.md` “As built”): FIRE kills everyone in the sky, Michael
  included, then Elias raises the device from the Vigil and the Heralds' broadcast comes through; HOLD wakes the device in 75 s and
  the dome rises before any Herald dies: everyone saved. The route is saved for later levels. Dialogue is placeholder.
- **The Heralds' flight, shared** (`js/shared/hflight.js`): The Last Signal's valley and the White City's way in now use The Heralds'
  own stick, guns (35 a hit, lead assist), missiles, fighter attack runs (half of them on you at a time, breaking off after each pass)
  and craft pool (100 + 25, recovering), at half Astraea's scale. Fighters are twice an interceptor's length, as in The Heralds.
- **White City:** the way in is playable again (`AIR_PLAYABLE`), flown that way, with BOOST/MSL on phone and the chase camera set back
  ~1.7 of Dropship Two's lengths (it sat inside one).
- **Missiles, every level** (`js/shared/combat.js`): lock cone 34° (was 17°), locks held a little longer, missiles turn hard off the
  rail and burst within reach of anything they locked, for the fast close fighters.

### Open (yours)
- [ ] Play both endings (fire, and hold to the device) and rewrite their lines; decide what reads `elyra.route`
- [ ] Fly The Last Signal and the White City's way in on iPhone: difficulty against The Heralds

## Done (Oct 27, night): Pathfinder playthrough fixes (Levels 01–03)

- **Lag spikes as fights start (every level):** soldiers come from a body pool now. The loading screen builds about 20 bodies per side (rigged, drawn once), and every soldier who falls goes back into it, so a fight starting builds nothing new (`EPOOL` in `js/origin/03-play.js`). Turret geometry is shared, and bolts and flashes are made up front (`js/shared/fx.js`).
- **Site K:** the gunship, the returning dropship, the crash site, the cockpit, Landry, the wreck interior and a Host fighter are built on the loading screen, hidden (the wreck was built in the frame the crash cut went black). Boarding: a gold light column and pulsing rings at her ramp from 10 s out, a big “Dropship ready · get aboard” pop-up, a beep every couple of seconds, a bigger boarding radius.
- **Objective pop-ups (`goalPop`, `js/shared/lean-hud.js`):** each stage's objective shows big for a few seconds as it starts, on all three Pathfinder levels (White City: “Find the entrance”).
- **Dead Ground:** the desert rock spires sit on the lowest sand under them; the standing stone is further past the outpost (the gully starts after it); the pit's open bowl had lowered the graveyard's ground under everything placed on it, so the debris field floated (up to 20 m): placement now uses the real ground, wrecks settle into the sand, the torn plates lie on it; the two order panels are the terminal model; pit-bottom riflemen stand up the ledge, never in the rock or on the breach; Dropship Two climbs straight out of the crater before heading north (was ~5 m from the bridge, now 85 m); the city's height is held in the last cutscene so it sits on the dunes, with a sheet of sand out under it.
- **Combat:** Warthog and walker guns 3.5 → 7 shots/s; Herald mechs 500 → 1500 HP (rocket/grenade damage to them unchanged), turn and fire faster, hit harder, notice you further out.
- **White City:** the opening flight and the crash flight are lifted over the dunes and the buildings (66 of 200 path samples were inside buildings, now 0); the crew follow you round the city instead of running at the wall of light; Herald marks over heads show only when fewer than 8 are left or one has camped in place 22 s; the broken wall in the tower is 8.6 m wide and the pinch that stopped you dropping through is gone.

## Done (Oct 27, evening): Site K playtest fixes

- **"Page unresponsive" starting a level:** the warm-up's single frame of everything (every texture upload and late shader compile in one task) is now spread out: textures go to the GPU a few per task, then everything is drawn a few objects at a time, then the one full frame. Models arriving together are rigged one per task. The shot grid is finished on the loading screen however long it takes.
- **Lag spikes when enemies spawn (every level):** materials made while loading but first shown mid-fight (the Host dropship's glow compiled its shader on the road) get stand-ins on the loading screen, so the compile happens there. Measured on the Site K road and the Dead Ground drive: no shaders built after Begin.
- **Lag near the base and in the settlement:** every soldier was the full ~100k-triangle model, twice with shadows; 30+ in view was 9–10 million triangles a frame. Past 18 m they now swap to the crowd version on the same bones (shadows off past 55 m): about 2–3 million on the same walk.
- **Roof gun and rifleman "shots did nothing":** the shot grid (`js/shared/solid.js`) stored every wall a second time up to 2 m along z (a 9-bit height packed into 8 bits). A roof tier's ghost stood over the gun and the man in front of it. Fixed on every level. On roofs and walls a shot that would also find the gunner just behind his gun goes to him.
- **Site K opening:** the team in the drop bay faces the way it should (Rhen at the holo table); the rover shot no longer puts the camera under the crater floor.
- **Spare rovers:** Site K at the relay, both ends of the settlement and before the last nests; Dead Ground at the near end of each settlement. Any of them drives like the first; on foot, the objective points to the next one. (Tide City already sends another vehicle.)
- Testing tools: `tools/render/longtasks.py` (long tasks + CPU profile), `probe.py` (real-time scripted checks), `runs.py` / `self.py` (profile breakdowns).

## Done (Oct 27): the lag, controls, and a review pass

- **Lag starting a level, when ships/models first arrive, and on the loading screen:** measured on every level, now 0 shader builds after Begin. Light counts are held fixed (`LIGHTPAD` in `js/shared/progress.js`), shaders compile for the bloom buffer in short slices, the level no longer draws behind the loading screen, the prison below the Mountain is built while loading.
- **Controls:** PC key rebinding (Settings → Controls on the menu, or Controls in pause; `js/shared/controls.js`). Phone: pause → **Button layout** to drag and resize every touch button (saved per HUD type).
- **Review fixes:** phone briefing text no longer under the controls card; flight hint under the shield/hull bars; ship engine glows on the models' sterns (White City dropship, interceptor); Tide City streets hides the flight UP/DOWN buttons; phone pause menu fits on one screen; Dead Ground debris no longer flat black.

### Open (yours, suggested from the review)
- [ ] Sharper shadows on the big outdoor levels (Last Signal valley, the Mountain): edges are stair-stepped. Costs a little GPU on phone.
- [ ] The White City's desert floor: a flat dark plane with a hard horizon; dunes, sand texture and haze would help.

## Done (Oct 26, late): The Last Signal, and The First Word

- **Last Transmission is three levels now:** The Mountain (04) → **The Last Signal** (05, new) → **The First Word** (06) (The Heralds and The Empty Sky merged). On the menu the arcs are called levels.
- **The Last Signal** (`last-signal.html`, `js/signal/`), from your v3.1 brief:
  - The interceptor up a mountain valley after the signal, with two Host fighter fights.
  - A Host facility built over the top of a summit, with views on every side. Inside, the way bends from room to room: guard room, west room, the overlook (prisoners through the glass), the detention wing (Rhen and two crew in cells), the junction, the east room, the tank-lined containment wing (whispers and warping), an eight-sided vault (blast door, the device in a cage of light, three emitters to shut down), then a switchback climb to an open pad on the very top of the peak.
  - Ends on your dropship scene, word for word.
  - Script: `docs/LAST-SIGNAL-SCRIPT.md`. Blueprint: `docs/LAST-SIGNAL-BLUEPRINT.html`.
- **The First Word** plays as three parts with no menu between them: the Tide City streets → The Heralds → back over Tide City.
  - Tide City's own Herald fleet fight is cut, and Tide City's sky uses The Heralds' damage scale.
  - The Herald convoy jumps out as soon as it's safe.
  - The shuttles are faster, with two stragglers on the last approach.
  - The Spear asks FIRE or HOLD.
- Your v3.1 lore files, unchanged: `docs/lore-2026-10-26/`.

### Open (yours)
- [ ] Next (Bryce, Oct 26): Bryce plays through, then we build both endings together (`docs/ENDINGS.md`: firing the Spear kills everyone in the sky, Michael included, and later missions go on without them; holding it spares the Heralds and everyone, and the suppressor is used before the Heralds are destroyed), then polish everything, then move on
- [ ] The real dialogue for The Last Signal (its lines are placeholder filler for now; `docs/LAST-SIGNAL-SCRIPT.md` lists them by ID)
- [ ] Play The Last Signal and The First Word through on Hollow and check the length (~15 min each)
## Done (Oct 26): The Mountain and the White City enlarged (Bryce's blueprints)

- **The Mountain, below the Hollow** (`js/origin/06-below.js`, layout in `js/origin/01-world.js`): rebuilt as the Hollow's prison, about 1.3 km inside instead of a 156 m tunnel. No "Below the Hollow" title card. Prison Ring → Checkpoint 9 (hold) → the inner gate (hold) → the Vault Floor (hold at the cage) → the descent → the Codex Dome (bridge over a chasm, alcoves, the sea behind glass) → the escape run → the cave mouth (hold). Lamps on chains all the way, floodlights in the vault, barrier posts for cover, four side rooms. New checkpoints: the Vault Floor and the Codex Dome. The outside of the mountain is unchanged.
- **The White City** (`js/pathfinder3/`): Act A (the crash on the north concourse, amber's ring of light, the walk round west or east to the plaza), Act B (a slower door, the Archive Gallery hold, the barrier hold at two minutes, the Crown Hold, the floor giving way into the underworks), Act C (a third wave in the chamber). New checkpoints: the north concourse, round the city, the gallery, the Crown Hold.
- **Fix:** Ensign Landry wore the old engineer kit; Landry is in the Pathfinder suit now (White City and Dead Ground).
- New dialogue in both is Claude's draft, for your rewrite. To look at in your playthrough: the timings of the holds, how the walk round the city feels on each side, and whether the drop into the underworks reads.

## Done (Oct 26): the visual pass after the Meshy swap, and the metal toned down

- **Metal and gloss:** your worn-metal texture (from `lt_textures`, the LMetal set) is on every model in the game (`img/tex/metal-*`). Rust patches lose their shine, and every model surface takes the texture's roughness, so nothing mirrors the sky any more. The Vigil was the worst: its hull is mostly painted, not metal, but the paint was nearly glass-smooth. Code-built hulls are capped too.
- **Recovered footage:** 03's torch is back in Michael's hand (it had been sitting 400 m away); 07's King shots frame him from the crew's line instead of the lit ceiling, and Rhen's wrist radio finally lights his face in the cave; 04's dropship crew face in and brace. Reels 01–07 all checked.
- **Tide City:** the Hollow carriers glow through their own paint, so they read as ships; the ending's Spear shot no longer has a bare pylon across half the frame.
- **White City ending:** the Host march through the dome's curtain is followed close behind.
- **Briefing screen:** re-rendered from today's command deck (supercomputers, the Meshy crew), with the same parallax strength.
- To look at in your playthrough: the space outro's bloom showed a soft rectangle around the Vigil in the test renderer (probably the software renderer only); Dropship Two's cockpit recorder in reel 05 is very close on the pilot.

## Done (Oct 25): Tide City's streets, the new Tide City models, the White City landing

- **The Empty Sky now opens on the streets** (`js/tide/17-streets.js`). Before the Vigil comes home, three Hollow carriers come down over the harbor, one after another, and put the Empty Host on the core platform: dropships land on the ring road and unload troopers, and every other one brings a **commander** (gold marker, tougher, fires bursts, makes his squad fire faster). You pick a **walker** (the Tide City Mech model: plasma casters with splash, a rocket rack, heavy armour) or a **gun-skiff** (the Tide City car in Keeper white and blue with a roof gun pod: fast, twin pulse guns, homing missiles, and it can cross the water). No sea guns and no city shield in this part.
  - You play it as **Warden Six**, the city's heavy unit, since Michael is still aboard the Vigil. Command calls you by callsign. Kept as the city unit (Bryce, Oct 25).
  - Anything that reaches the Spear's plinth costs the city: that damage carries into the battle as lower starting integrity (never below 70%).
  - Once the carriers are down and the core is clear: "Slipscape flash... it's the Vigil, and she's not alone", then the old opening (without its title card, which now shows at the start of the streets), and the battle runs as before.
  - New challenges: all three carriers, no Host at the plinth, six dropships on the streets. "Fight again" skips the streets and goes straight to the fleet, as before.
- **Bryce's Tide City models:** the ring-road traffic now drives his two cars, half and half (`models/tide-car-2.glb`, the sleek two-seater baked to its hover version, and `models/tide-car.glb`), and **maglev trains** of his train car, five to a train, run along the four transit rings (`models/tide-train.glb`, `js/tide/18-transit.js`). All three were flattened to one painted mesh plus their lights (car_2 went from 26.7 MB to 87 KB).
- **White City landing (Pathfinder Arc 03):** the crew come down Dropship Two's ramp at her tail, run down both flanks and fall in ahead of her nose facing up the street (they used to walk backwards straight through her hull). You take control, and the plaza checkpoint starts you, clear of her nose, so the third-person camera no longer opens inside the ship. She's solid now too.

## Done (Oct 24): two skies for the whole game

- The old sky photos are gone (rogland night, valley of desolation dawn, Qwantani night, NightSkyHDRI010). Two skies now, picked in one place (`js/shared/skies.js`):
  - **The alien sky** (`img/sky/nebula-green-*`): Elyra. The Mountain (night, dawn and the command deck's window), Tide City, the menu footage on the deck, and the prologue's Elyra shots (the arks arriving, Elyra from space, Tide City, the Keepers' window, the Hollow King's mountains).
  - **The nebula** (`img/sky/nebula-gold-*`): Astraea and its moon. The Heralds, Pathfinder Arcs 01, 02 and 03, and the prologue's last shot (the Pathfinder going after him).
- Every cutscene is shot in its own mission's scene, so each one carries its mission's sky. The prologue's painted skies now have the alien sky over them;
- **The purple nebula** (`img/sky/nebula-purple-*`): the old world. The prologue's Earth and the nine arks.

## Done (Oct 24): the models-oct24 and wip-revolver branches, merged

- **Armory**: Red Fang revolver (sidearm skin, with its picture); the Herald assault rifle and Hollow pulse gun as Pulse rifle skins; a Breaker slot (standard issue stays the launcher; Keeper Breaker, Hollow heavy blaster, Herald heavy special). All free for now like the rest.
- **First-person arms**: Bryce's FPS arms (grey sleeves, black gloves, `models/fp-arms.glb`) replace the block arms; they ride the arm IK, so the hands stay on every gun and the reload still works. Tuning in `VM_ARM` (js/origin/03-play.js).
- **Herald mech** (`js/shared/mech.js`) in Dead Ground's basin and the White City streets. Fixed on merge: its own body blocked its line of sight, so it never fired; now it plants, sweeps the machine guns, fires both cannons, and turns on you if hit.
- **Command deck**: keeps the animated Keeper door (opens and closes now and then) and the supercomputers; the branch's display terminals stand in the two far corners. The branch's other Keeper door is kept as `keeper-door-2` for the DOORS 'keeper' style (not placed anywhere yet). Host and Herald doors use the Hollow and Herald door models.
- To check later: Lance, Breaker and sidearm sit low in first person (already so before the merge).

## Done (Oct 24): the Armory, new guns and the nebula skies

- (later Oct 24) The standard Keeper rifle is now Assault Rifle Default 2 (every Keeper, squadmates and cutscenes included), and every Armory skin is free for now (`ARMORY_FREE`).

- **Armory** on the menu: buy gun skins with Remnant Marks (two taps to buy, one to equip), six for the Pulse rifle and three for the Lance, from Bryce's seven files (the weapon pack split into its carbine, SMG and lever sniper). They show in first person and in Michael's or Rhen's hands in every ground chapter. Skins only: no stat changes.
- Every gun file slimmed for phones (10–14k triangles, WebP textures, meshopt; 75–665 KB each, only the equipped ones download) with a sharper PC set.
- **Skies:** Nebula 1 behind The Heralds, Nebula 2 over Pathfinder Arc 01's moon and orbit.
- Your call: whether any skin should change handling (a faster SMG, a slower Longshot), and a slot for the revolver (a sidearm) and the chain blades (melee).

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
