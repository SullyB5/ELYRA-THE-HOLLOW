# Elyra · Level 1

Walkable WebGL chapters from the Vista 3D series, built with three.js r128 (cdnjs) as plain static files. Open `index.html` or deploy the folder as a static site; there is no build step.

## Chapters

| # | Page | What happens |
|---|------|--------------|
| 1 | Origin | Coming soon. The Keepers fight the Hollow King and his Empty Host on Elyra, then sail for Astraea. |
| 2 | `space.html` | Astraea. The planet lights up, three waves of unknown aliens (fighters; fighters and bombers; warships) while the Hollow King, an enemy back on Elyra, cheers them on, the Covenant is destroyed, the Vigil jumps home. |
| 3 | `tide-city.html` | Tide City, the final chapter. The fleet attack on Elyra beneath the Spear of Destiny. |

`index.html` is the chapter menu.

## Code layout

Classic scripts that share one global scope, loaded in the order each page lists them.

- `js/shared/core.js`: seeded random numbers, noise, geometry merger, helpers.
- `js/shared/ships.js`: capital ships, the armored flagship, fighters, the interceptor, freighters, glow and hull-panel textures.
- `js/shared/fx.js`: energy bolts, explosions, smoke trails and smoke puffs. Needs `scene`, `renderer` and `glow` defined first.
- `js/space/`: the Astraea chapter (setup, then battle and HUD).
- `js/tide/`: the Tide City chapter, split into nine files in load order.

## Controls

PC: click to lock the mouse (Esc releases), mouse aims, right-click fires, WASD to fly, Space/Q up and down, Shift boosts. In space, Z fires Zeal once the meter is full.
Phone: left thumb flies, right thumb aims, hold FIRE.

Backups of earlier versions live on the `backup-*` branches.
