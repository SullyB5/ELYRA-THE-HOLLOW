# Elyra · Level 1

Walkable WebGL chapters from the Vista 3D series, built with three.js r128 (cdnjs) as plain static files. Open `index.html` or deploy the folder as a static site; there is no build step.

## Chapters

| # | Page | What happens |
|---|------|--------------|
| 1 | Origin | Coming soon. The Keepers fight the Hollow King and his Empty Host on Elyra, then sail for Astraea. |
| 2 | `space.html` | Astraea. The planet lights up, three waves of unknown red aliens (fighters; fighters and bombers; warships) while the Hollow King, an enemy back on Elyra, cheers them on, the Covenant is destroyed and its wreck is blown clear of the Vigil, the Vigil jumps home. |
| 3 | `tide-city.html` | Tide City, the final chapter. The Vigil drops out of hyperspace chased by raider frigates you can shoot down, the city fights back against a first wave of four red alien capital ships, then the Hollow King opens a second front: five heavier purple ships of his own fleet jump in and go after the sea guns, the Hollow King's Empty Host lands and marches on the Spear of Destiny past the Keeper guards, and the Spear charges and fires, sweeping every enemy left in the sky. The capital ships tear down towers as they go; if city integrity reaches zero before the Spear fires, Tide City falls. |

`index.html` is the chapter menu, with the difficulty picker.

## Story and factions

The Keepers (blue, white and gold) fight a war on two fronts. The **Hollow King** and his **Empty Host** (purple, black and silver) are the enemy at home, introduced in Origin. The **aliens of Astraea** (red) are the second front, found when the Pathfinder is lost. In Tide City the aliens follow the Vigil home, and the Hollow King uses the attack to make his own move for the city.

## Difficulty

Easy, Hard (default) and Insane, picked on the menu or on a chapter's briefing (changing it reloads the chapter). The numbers live in `DIFFS` in `js/shared/progress.js`; chapters read them once through the global `DIFF`.

- Astraea: Hard is a third fewer enemies and a quarter less damage than the original waves; Insane is the original.
- Tide City: Insane is the original siege. Hard cuts damage to you to 70%, damage to the city to 65%, fighters to 68%, enemy fire rate to 80% and capital hulls to 85%. Easy goes further.

## Code layout

Classic scripts that share one global scope, loaded in the order each page lists them.

- `js/shared/core.js`: seeded random numbers, noise, geometry merger, helpers.
- `js/shared/ships.js`: capital ships, the armored flagship, fighters, the interceptor, freighters, glow and hull-panel textures.
- `js/shared/fx.js`: energy bolts, explosions, smoke trails and smoke puffs. Needs `scene`, `renderer` and `glow` defined first.
- `js/shared/combat.js`: ship hulls (sliced boxes) for collision and hit tests, ship name/HP tags, damage fires, crosshair aim, homing missiles.
- `js/shared/shiphud.js`: the interceptor's cockpit strip at the top centre (shield, hull, speed, zeal, missiles, and the city's integrity in Tide City), shared by both chapters.
- `js/shared/audio.js`: all sound, synthesized with WebAudio (guns, cannons, lasers, torpedoes, flak, explosions sized to the blast, missiles, the jet engine, drones for shields and charging weapons, hits and alarms) and the radio spoken with the most natural voices the device offers. Each chapter adds a small glue file (`js/space/03-audio.js`, `js/tide/13-audio.js`) for its own events.
- `js/shared/progress.js`: points and kill combos, objectives, per-run challenges, achievements, Remnant Marks and interceptor paints, saved in the browser.
- `js/space/`: the Astraea chapter (setup, then battle and HUD).
- `js/tide/`: the Tide City chapter in load order; `02-city.js` builds the capital ships (aliens red, Hollow fleet purple); `10-combat.js` adds hulls, tags, missiles and progress; `11-story.js` adds the Spear of Destiny, the arrival, the Empty Host ground strike (troopers path around buildings on a distance field over the core platform), the Keeper guards and the radio; `12-siege.js` adds your shield and hull, towers that collapse under fire, city integrity and the city's fall; `13-audio.js` hooks Tide City's events into the shared audio; `14-zeal.js` adds Zeal.

## Controls

PC: click to lock the mouse (Esc releases), mouse aims, right-click fires guns, left-click or F fires homing missiles, WASD to fly, Space/Q up and down, Shift boosts. Z fires Zeal once the meter is full (both chapters).
Phone: left thumb flies, right thumb aims, hold FIRE, tap MSL for missiles, ZEAL when charged. In Tide City the ship strip sits at the top and the compass at the bottom left.
Tide City: G crews the nearest sea gun and G again returns you to your interceptor (PC).
Sound: M or the Sound button mutes, in both chapters; the choice is remembered.

The menu shows your service record, achievements, and the interceptor paints that Remnant Marks unlock.

Backups of earlier versions live on the `backup-*` branches. What's left to build is in `ROADMAP.md`.
