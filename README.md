# Elyra · The Keepers of the Remnant

Walkable WebGL chapters from the Vista 3D series, built with three.js r128 (cdnjs) as plain static files. Open `index.html` or deploy the folder as a static site; there is no build step.

## The archives

| # | Page | Archive | What happens |
|---|------|---------|--------------|
| 01 | `origin.html` | **The Mountain** · *The door was never meant to open.* | On foot. Opens on the command deck at Tide City: the Pathfinder's last message ("we were wrong about the Heralds") and Michael's orders. The Keepers land at the Hollow King's mountain. North of the landing zone the valley splits around a mountain ridge into **two canyons** that meet again at the Hollow's courtyard; two tunnels and a Hollow door are passes through the ridge. Hollow turrets with gunners hold both canyons, and a voice that sounds like the Pathfinder's Captain Rhen calls Michael's name in the tunnels. The Hollow King springs his trap at the gate; fall back and hold the landing zone while the ships power up (three Empty Host dropships at once with 3, 3 and 4 troopers, then two more with 4 each); board and escape. Ends on the command deck two days later with the rest of the message: the Heralds are running. |
| 02 | `space.html` | **The Heralds** · *They didn't come for us.* | Space combat over Astraea: the Pathfinder wreck, the planet wakes, three waves of Heralds (the red aliens), the Covenant destroyed, the fleet turns away and jumps home. The Heralds are not invading; they are fleeing something. |
| 03 | `tide-city.html` | **The Empty Sky** · last transmission | The Vigil drops out of hyperspace over Elyra with the Heralds behind it. Hold the city; the Heralds break and run, and the Hollow King's fleet jumps in. The **Spear of Destiny** starts charging the moment he arrives: every 30 seconds (slower with troopers at its base) it fires one beam at the biggest, toughest ship left, his Harbinger first, until his fleet is down. |

`index.html` is the archive menu (mission select, threat level, the service record drawer with paints and achievements). The later archives show as locked until the one before is cleared on that device; they can still be opened.

## Story and factions

The Keepers (white, blue and gold) fight on two fronts. The **Hollow King** and his **Empty Host** (purple, black and silver) are the enemy at home. The **Heralds** of Astraea (red) are the second front; the Pathfinder found them, and its last words were that the Keepers were wrong about them. Lt. Michael Veyr of the Interceptor Wing is the player; Master Elias Veyr commands.

## Threat level

**Survivor** (the story comes first), **Keeper** (the intended experience; the default) and **Hollow** (nothing is forgiving). Picked on the menu or a chapter's briefing; changing it reloads the chapter. The numbers live in `DIFFS` in `js/shared/progress.js` (ids `easy`, `hard`, `insane`, so old saves carry over). The Mountain's include ammunition, drop rates and health regeneration.

## Models

`models/*.glb`, made outside the game and slimmed for phones (about 9–24k triangles each, WebP textures, meshopt-compressed; about 1.5 MB for all of them): the Keeper Marine (`marine-hi` for Michael, `marine` for squadmates and Tide City's guards), Engineer, Robot, the sci-fi assault rifle, and the Harbinger. `js/shared/models.js` loads them in the background: everyone is built from code first and swaps to their model when it arrives, so a failed download changes nothing. The character models came unrigged, so they are rigged in code onto the code-built joints, and the same pose code (walk, run, aim, crouch, reload, flinch, fall) drives both.

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
- `js/origin/`: Archive 01. `01-world.js` the two canyons, terrain, sky, the Hollow, the signal; `02-people.js` the code-built people and their poses; `03-play.js` movement, weapons (Pulse rifle, Lance, Breaker), gear (mobile shield, shoulder sentry, Zeal), pickups, turrets, troopers, dropships, squad and the lane-aware pathfinding; `04-story.js` the phases, cutscenes and the command deck; `05-audio.js` audio glue.
- `js/space/`: Archive 02. `js/tide/`: Archive 03 (`11-story.js` holds the Spear).

## Controls

**The Mountain, PC:** WASD move, mouse aims (click to lock), left click fires, right click aims down the sights (the Lance has a scope), 1 2 3 or the wheel switch weapons, R reloads, Q mobile shield, X shoulder sentry, G or F grenade, Z Zeal, Shift sprint, E board.
**The Mountain, phone:** left thumb moves (push to the edge to sprint), right thumb aims, FIRE, AIM, NADE, SHLD, SNTRY, BOARD; the small ammo box reloads (it shows the magazine) and the small ⇄ switches weapons. Zeal (every chapter): tap the shield gem when it turns gold. Jump and crouch are switched off for now.
**Flight (The Heralds, The Empty Sky):** mouse aims, right-click guns, left-click or F missiles, WASD fly, Space/Q up and down, Shift boost, Z Zeal. Phone: left thumb flies, right thumb aims, FIRE, MSL, ZEAL. Tide City: G (PC) or GUN (phone) crews the nearest sea gun.
**Everywhere:** pause with the button at the top left, Esc or P; M mutes; Enter skips a cutscene.

Backups of earlier versions live on the `backup-*` branches. What's left to build is in `ROADMAP.md`.
