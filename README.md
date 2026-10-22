# Elyra · The Keepers of the Remnant

Walkable WebGL chapters from the Vista 3D series, built with three.js r128 (cdnjs) as plain static files. Open `index.html` or deploy the folder as a static site; there is no build step.

## The archives

| # | Page | Archive | What happens |
|---|------|---------|--------------|
| 01 | `origin.html` | **The Mountain** · *The door was never meant to open.* | On foot. Opens with the prologue in 3D (`js/shared/prologue.js`: Earth breaking, the arks, Elyra, Tide City and the Spear, the Keepers, the Codex, the Hollow King and his Host, the theft, the Pathfinder), then the command deck at Tide City: the Pathfinder's last message ("we were wrong about the Heralds") and Michael's orders. The Keepers land at the Hollow King's mountain. North of the landing zone the valley splits around a mountain ridge into **two canyons** that meet again at the Hollow's courtyard; two tunnels and a Hollow door are passes through the ridge. Hollow turrets with gunners hold both canyons, and a voice that sounds like the Pathfinder's Captain Rhen calls Michael's name in the tunnels. At the gate the Hollow King invites Michael below, and he goes down alone (`js/origin/06-below.js`): a breathing tunnel, the voice, the Empty Host in the dark, a wall of carved names with the whole Pathfinder crew on it, and a chamber where the Codex turns inside a dome, and beyond a ledge a drowned sea under the mountain where the leviathan the Hollow King has tamed (`js/shared/leviathan.js`) raises its eyes out of the water. The trap springs, the Codex sinks out of reach, and Michael climbs out into the courtyard as the gate opens; fall back and hold the landing zone while the ships power up (three Empty Host dropships at once with 3, 3 and 4 troopers, then two more with 4 each); board and escape. Ends on the command deck two days later with the rest of the message: the Heralds are running. |
| 02 | `space.html` | **The Heralds** · *They didn't come for us.* | Space combat over Astraea: the Pathfinder wreck, the planet wakes, three waves of Heralds (the red aliens), the Covenant destroyed, the fleet turns away and jumps home. The Heralds are not invading; they are fleeing something. |
| 03 | `tide-city.html` | **The Empty Sky** · last transmission | The Vigil drops out of hyperspace over Elyra with the Heralds behind it. Hold the city; the Heralds break and run, and the Hollow King's fleet jumps in. The **Spear of Destiny** starts charging the moment he arrives: every 30 seconds (slower with troopers at its base) it fires one beam at the biggest, toughest ship left, his Harbinger first, until his fleet is down. While his Host lands, a Herald convoy (an amber-lit transport and two Void Lancers) crosses the south shore without firing a shot; the King's cruisers and some of his fighters turn on it, then it jumps out (`js/tide/15-heralds.js`). The ending doesn't hide what the Spear cost. |

## Recovered footage (The Call)

Three short 3D scenes, Michael's recovered footage: 01 The Call (after Archive 01 opens), 02 The Return (after Archive 01), 03 The Hollow (after Archive 02, before Tide City). They play from the **Recovered logs** panel on the menu and the service record drawer, and the idle menu plays the next one this device hasn't seen.

1. **The Call** (with Archive 01): Michael alone on the command deck at Tide City Command, the red emergency light, the dome dark on the holo table, his terminal facing the bay. He asks ELYRA, the Vigil's ship intelligence, where the Hollow is. *"Because you are already there."* The lights die, the dome wakes, and for a fraction of a second you see inside the Hollow.
2. **The Return** (with Archive 02): the same room, the dome already awake. The coordinates haven't changed in twenty-three years; Michael hasn't left the facility; the mast camera outside shows Tide City Command abandoned "since the incident", and for one frame something tall standing in the dark. Ends on ACCESS RECORD: MICHAEL — 17 ENTRIES.
3. **The Hollow** (after Archive 02): the night before Tide City, Michael goes back down to the chamber from Archive 01, alone. His name is on the wall, dated the day of Tide City. The Drowned Watcher rises; ELYRA: it has been trying to warn him. About the Spear.

The secret still works: leave the menu alone for 5 to 10 minutes and the music bends, the view creeps, the background flickers, the screen goes black and the next footage this device hasn't seen plays (never ahead of the story). After it the menu keeps a blinking red light (1), an access record in the footer (2), and after the third, silence and one more line from ELYRA.

Code: `js/menu/footage.js` builds the three sets in one three.js scene (the deck at the origin, the facility from outside at x +400, the Hollow at x -400) with Michael as the Keeper Marine model posed on the code rig, and runs the scripts; `js/menu/call-sound.js` is the synthesized sound and the voices; `js/menu/the-call.js` is the idle secret, the chips and the after-effects. The 3D (three.js, `core.js`, `02-people.js`, `models.js`) loads only when footage is about to play. Links: `index.html?watch=1` (or `2`, `3`) shows a tap-to-play card; `?call=1` runs the idle version after 4 seconds.

## The campaign

The gold **Campaign** entry at the top of mission select plays all three archives in a row (prologue first), about 20 minutes. Each chapter page carries `?campaign=1`; finishing one counts down 12 seconds and opens the next (touching the results card stops the count). Progress is saved at the start of each archive (`elyra.campaign` in localStorage, handled in `js/shared/progress.js`), so **Continue** on the menu picks up at the archive you were on; **Start over** begins again from the prologue. Mission select still opens any single archive. Archive 01 also saves checkpoints (below the Hollow, the fall back, the landing zone; `elyra.checkpoint`) and offers to resume.

Test jumps for The Mountain: `origin.html?at=below` starts at the door below the Hollow, `origin.html?at=deep` near the chamber.

`index.html` is the archive menu (mission select, threat level, the service record drawer with paints and achievements). The later archives show as locked until the one before is cleared on that device; they can still be opened.

## Story and factions

The Keepers (white, blue and gold) fight on two fronts. The **Hollow King** and his **Empty Host** (purple, black and silver) are the enemy at home. The **Heralds** of Astraea (red) are the second front; the Pathfinder found them, and its last words were that the Keepers were wrong about them. Lt. Michael Hall of the Interceptor Wing is the player; Master Elias Veyr (his mentor) commands. The canon lore is Bryce's Oct 22 update in `docs/lore-2026-10-22/`; start with `docs/CANON-NOTES.md`, which summarises it and lists what changed in the game.

## Threat level

**Survivor** (the story comes first), **Keeper** (the intended experience; the default) and **Hollow** (nothing is forgiving). Picked on the menu or a chapter's briefing; changing it reloads the chapter. The numbers live in `DIFFS` in `js/shared/progress.js` (ids `easy`, `hard`, `insane`, so old saves carry over). The Mountain's include ammunition, drop rates and health regeneration.

## Models

`models/*.glb`, made outside the game and slimmed for phones (about 9–24k triangles each, WebP textures, meshopt-compressed; about 1.5 MB for all of them): the Keeper Marine (`marine-hi` for Michael, `marine` for squadmates and Tide City's guards), Engineer, Robot, the sci-fi assault rifle, and the Harbinger. `js/shared/models.js` loads them in the background (`models/` is the phone set; an optional sharper set goes in `models/pc/`, picked by Settings → Model detail): everyone is built from code first and swaps to their model when it arrives, so a failed download changes nothing. The character models came unrigged, so they are rigged in code onto the code-built joints, and the same pose code (walk, run, aim, crouch, reload, flinch, fall) drives both.

## Code layout

Classic scripts that share one global scope, loaded in the order each page lists them.

- `js/shared/core.js`: seeded random numbers, noise, geometry merger, helpers.
- `js/shared/models.js`: the model loader and auto-rig (see Models).
- `js/shared/fleets.js`: enemy ships from the design sheet: the Heralds' Harrower, Wraith fighter and Void Lancer; the Hollow King's Harbinger, Voidclass cruiser and Devourer bomber. Global `SHIPKIT`.
- `js/shared/ships.js`: Keeper ships and older shared models.
- `js/shared/fx.js`, `js/shared/combat.js`: bolts, explosions, smoke; hulls, ship tags, damage fires, homing missiles.
- `js/shared/shiphud.js`: the HUD strip: Zeal, the shield gem, hull (HP on foot).
- `js/shared/audio.js`: all sound, synthesized with WebAudio, and the radio voices. On iPhone, speech unlocks on the first real tap; lines that never start fall back to reading time so cutscenes keep their pace. Lines marked `alert` are said harder and faster.
- `js/shared/cutscene.js`: camera keyframes, letterbox, titles, subtitles paced by the voices, Skip. Widens the view on a phone held upright.
- `js/shared/progress.js`: points, objectives, challenges, achievements, Remnant Marks, paints, threat levels, the briefing card.
- `js/shared/pause.js`: pause (button, Esc or P). On phones it also holds Sound and Quality, which used to sit in a corner Menu.
- `js/shared/prologue.js`: the prologue before The Mountain, ten painted shots drawn in code and narrated through the shared voices.
- `js/menu/the-call.js`, `footage.js`, `call-sound.js`: the recovered footage (3D), the menu's idle secret, the menu music.
- `js/origin/`: Archive 01. `01-world.js` the two canyons, terrain, sky, the Hollow, the signal; `02-people.js` the code-built people and their poses; `03-play.js` movement, weapons (Pulse rifle, Lance, Breaker), gear (mobile shield, shoulder sentry, Zeal), pickups, turrets, troopers, dropships, squad and the lane-aware pathfinding; `04-story.js` the phases, cutscenes and the command deck; `05-audio.js` audio glue; `06-below.js` below the Hollow (the tunnel's walkable shape is `BNODES`/`BCH` in `01-world.js`, built far west of the map at x -2400).
- `js/space/`: Archive 02. `js/tide/`: Archive 03 (`11-story.js` holds the Spear, `15-heralds.js` the Herald convoy).

## Controls

**The Mountain, PC:** WASD move, mouse aims (click to lock), left click fires, right click aims down the sights (the Lance has a scope), 1 2 3 or the wheel switch weapons, R reloads, Q mobile shield, X shoulder sentry, G or F grenade, Space jump, C or Ctrl crouch, Z Zeal, Shift sprint; walk up to your interceptor (or E) to board.
**The Mountain, phone:** left thumb moves (push to the edge to sprint), right thumb aims, double-tap the right side to aim down the sights; FIRE (swipe up off it for a grenade), NADE, GEAR (tap: shield, hold: sentry), JUMP, CROUCH; walk up to your interceptor to board. The small ammo box reloads and the small ⇄ switches weapons. Zeal (every chapter): tap the shield gem when it turns gold.
**Full screen on iPhone:** Safari won't hide its bars for a page, so the game ships a web-app manifest: Share → Add to Home Screen, then play from the icon.
**Flight (The Heralds, The Empty Sky):** mouse aims, right-click guns, left-click or F missiles, WASD fly, Space/Q up and down, Shift boost, Z Zeal. Phone: left thumb flies, right thumb aims, FIRE, MSL, ZEAL. Tide City: G (PC) or GUN (phone) crews the nearest sea gun.
**Everywhere:** pause with the button at the top left, Esc or P; M mutes; Enter skips a cutscene.

Backups of earlier versions live on the `backup-*` branches. What's left to build is in `ROADMAP.md`.

## Side mission S1 · Pathfinder

`pathfinder.html` (also on the menu under Side missions). Play Captain Rhen's strike team on 08.03.2237:
- an opening cutscene in the Pathfinder's dropship;
- an assault on an Empty Host installation on a dead moon;
- a sealed chamber and the object in it;
- the fight out to the hangar;
- a dropship chase you fly and can't win, as two Empty Host cruisers break the Pathfinder in two;
- the fall to Astraea, the crash, and "They followed us."

The object is the suppressor in the lore (`docs/CANON-NOTES.md` #28), but nobody in the game names it. Next: **S2 · Dead Ground** (09.03.2237) and **S3 · The White City** (10.03.2237), already on the menu as unrecovered side files.

The script with line IDs is in `docs/PATHFINDER-SCRIPT.md`. To test a stretch, add `?at=halls`, `door`, `extract`, `hangar` or `end` to the address.
