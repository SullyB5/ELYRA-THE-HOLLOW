# Elyra · Level 1

Walkable WebGL chapters from the Vista 3D series, built with three.js r128 (cdnjs) as plain static files. Open `index.html` or deploy the folder as a static site; there is no build step.

## Chapters

| # | Page | What happens |
|---|------|--------------|
| 1 | `origin.html` | Origin, on foot. Three nights ago the Hollow King stole the Codex (every Remnant star chart). The Keepers land at his mountain fortress, the Hollow, knowing it is a trap; advance up the canyon with the squad; the Hollow King appears at his gate, says the Codex is gone off-world, and opens the gate; fall back to the landing zone and hold it while three dropships and your interceptor power up (troopers near a ship stall it; Empty Host dropships land on the flanks); the Pathfinder news comes over the radio; board and escape; two days later, on the command deck at Tide City, contact with the Pathfinder is lost (a cutscene). |
| 2 | `space.html` | Astraea. Opens with the fleet dropping out of hyperspace over the Pathfinder wreck. The planet lights up, three waves of unknown red aliens (Wraith-pattern fighters; fighters and Void Lancer bombers; Harrower warships) while the Hollow King, an enemy back on Elyra, cheers them on, the Covenant is destroyed and its wreck is blown clear of the Vigil; the closing cutscene shows the jump home. |
| 3 | `tide-city.html` | Tide City, the final chapter. Opens with the city going to battle stations. The Vigil drops out of hyperspace chased by raider frigates you can shoot down, the city fights back against four alien Harrower flagships; once only one is left the aliens break and jump away, and after a short lull the Hollow King opens a second front: his Harbinger flagship and four Voidclass cruisers jump in, launch Wraith fighters and Devourer bombers, and go after the sea guns, the Hollow King's Empty Host lands and marches on the Spear of Destiny past the Keeper guards, and the Spear charges and fires, sweeping every enemy left in the sky. The capital ships tear down towers as they go; if city integrity reaches zero before the Spear fires, Tide City falls. The closing cutscene follows the Spear's shot. The Empty Host troopers carry pulsing markers, and a cue on screen points to them. |

`index.html` is the chapter menu, with the difficulty picker.

## Story and factions

The Keepers (blue, white and gold) fight a war on two fronts. The **Hollow King** and his **Empty Host** (purple, black and silver) are the enemy at home, introduced in Origin. The **aliens of Astraea** (red) are the second front, found when the Pathfinder is lost. In Tide City the aliens follow the Vigil home, and the Hollow King uses the attack to make his own move for the city.

## Difficulty

Easy, Hard (default) and Insane, picked on the menu or on a chapter's briefing (changing it reloads the chapter). The numbers live in `DIFFS` in `js/shared/progress.js`; chapters read them once through the global `DIFF`.

- Astraea: Hard is a third fewer enemies and a quarter less damage than the original waves; Insane is the original.
- Origin: its own numbers (`origin` in `DIFFS`): trooper damage, fire rate, health, accuracy, and extra troopers per ambush. Easy still hits back.
- Tide City: Insane is the original siege. Hard cuts damage to you to 70%, damage to the city to 65%, fighters to 68%, enemy fire rate to 80% and capital hulls to 85%. Easy goes further.

## Code layout

Classic scripts that share one global scope, loaded in the order each page lists them.

- `js/shared/core.js`: seeded random numbers, noise, geometry merger, helpers.
- `js/shared/fleets.js`: the enemy ships from the design sheet, black hulls with thick glowing lines (glow colour = faction): aliens' Harrower flagship (spiral prow), Wraith fighter and Void Lancer bomber; the Hollow King's Harbinger flagship, Voidclass cruiser and Devourer bomber. Global `SHIPKIT`.
- `js/shared/ships.js`: Keeper ships and older shared models: capital ships, the armored flagship, fighters, the interceptor, freighters, glow and hull-panel textures.
- `js/shared/fx.js`: energy bolts, explosions, smoke trails and smoke puffs. Needs `scene`, `renderer` and `glow` defined first.
- `js/shared/combat.js`: ship hulls (sliced boxes) for collision and hit tests, ship name/HP tags, damage fires, crosshair aim, homing missiles.
- `js/shared/shiphud.js`: the interceptor's cockpit strip at the top centre, shared by both chapters: Zeal on the left wing, the shield as a centre gem that drains downward, hull on the right, then missiles and speed, and the city's integrity in Tide City.
- `js/shared/audio.js`: all sound, synthesized with WebAudio (guns, cannons, lasers, torpedoes, flak, explosions sized to the blast, missiles, the jet engine, drones for shields and charging weapons, hits and alarms) and the radio spoken with the most natural voices the device offers. Each chapter adds a small glue file (`js/space/03-audio.js`, `js/tide/13-audio.js`) for its own events.
- `js/shared/cutscene.js`: the cutscene system every chapter uses: camera keyframes, letterbox, title cards, subtitles and Skip. Each line waits for the one before it to finish speaking, and a shot holds until its last line is said.
- `js/shared/progress.js`: points and kill combos, objectives, per-run challenges, achievements, Remnant Marks and interceptor paints, saved in the browser.
- `js/origin/`: Chapter 1. `01-world.js` the dusk desert, the canyon and the Hollow's gate, Keeper ships; `02-people.js` characters built in code (Marine, Engineer, Colonist, Civilian, Empty Host trooper, the Hollow King) with jointed limbs; `03-play.js` third-person movement, aiming, rifle and grenades, squad and trooper AI (walkers steer round barricades and rocks and side-step when stuck; troopers hold cover beside rocks or perch on the canyon walls), Empty Host dropships; `04-story.js` every phase and cutscene, the canyon ambushes, and the Tide City command deck for the ending; `05-audio.js` audio glue (distances in metres via `AUDIO_SCALE`).
- `js/space/`: the Astraea chapter (setup, then battle and HUD).
- `js/tide/`: the Tide City chapter in load order; `02-city.js` builds the capital ships (aliens red, Hollow fleet purple); `10-combat.js` adds hulls, tags, missiles and progress; `11-story.js` adds the Spear of Destiny, the arrival, the Empty Host ground strike (troopers path around buildings on a distance field over the core platform), the Keeper guards and the radio; `12-siege.js` adds your shield and hull, towers that collapse under fire, city integrity and the city's fall; `13-audio.js` hooks Tide City's events into the shared audio; `14-zeal.js` adds Zeal.

## Controls

PC: click to lock the mouse (Esc releases), mouse aims, right-click fires guns, left-click or F fires homing missiles, WASD to fly, Space/Q up and down, Shift boosts. Z fires Zeal once the meter is full (both chapters).
Origin (on foot): WASD move, mouse aims (click to lock), left or right click fires, G or F grenade, Shift sprint, Space jump, E board; Enter skips a cutscene. Phone: left thumb moves (push to the edge to sprint), right thumb aims, FIRE, NADE, JUMP, BOARD, Skip.
Phone: left thumb flies, right thumb aims, hold FIRE, tap MSL for missiles, ZEAL when charged. In Tide City the ship strip sits at the top and the compass at the bottom left.
Tide City: G (PC) or GUN (phone) crews the nearest sea gun; again returns you to your interceptor. Sound, Quality and Chapters are in the Menu pull-down at the top right.
Pause: the pause button at the top left, or Esc or P on PC (releasing the mouse mid-fight or switching tabs pauses too); Esc or P resumes. All three chapters.
Sound: M or the Sound button mutes, in both chapters; the choice is remembered.

The menu shows your service record, achievements, and the interceptor paints that Remnant Marks unlock.

Backups of earlier versions live on the `backup-*` branches. What's left to build is in `ROADMAP.md`.
