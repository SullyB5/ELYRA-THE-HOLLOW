# ELYRA trailer (Nov 12 2026)

Bryce's original 50-second trailer, same cut, same lines, same soundtrack, with every shot rebuilt in the game's current look.
Not part of the game: `trailer.html` (repo root) is never linked from the menu.

| Time | Shot | Built from |
|---|---|---|
| 0–4.4 | Incoming transmission (typed, signal trace, red interference) | overlay |
| 4.4–9.8 | The Hollow King walks out of the open door: "The door was never meant to open" | Bryce's rigged `hollow-king` (Walking clip), a vaulted hall in Metal039, mirrored floor, the light beyond the door |
| 9.8–15 | Tide City from above, its lights going out district by district; the Spear's light still burning | the main menu's night world (`js/trailer/world.js`, from `js/menu/halo-scene.js`): Spear, Tide City kit, sea reflections |
| 15–19.8 | "Then they came": Herald ships (`harrower`) out of Slipscape over the Spear | same world |
| 19.8–26.4 | Montage: beams on the districts, the Hollow marching (`hollow-commander`, `hollow-heavy`, rigged), a Keeper flight (`raven`) kills a `wraith`, "The last outpost", the march under the fleet, the Spear fires, "Holds the line" | same world |
| 26.4–35.9 | The White City through the ring: "Someone was here before us", then the dome rising and its first flicker | `js/trailer/whitecity.js` (built after the level's plan; the dome is the level's own shader) |
| 36–39.5 | "Don't let it in", the corruption's veins | overlay |
| 39.5–50 | Logo (Vanguard type) and end card over the Spear at night | menu world |

## Make it

    python3 -m http.server 8123                        # from the repo root
    cd tools/trailer
    python3 drive.py http://localhost:8123/trailer.html out/frames --from 0 --to 50.0667 --fps 30   # ~4 s a frame in software GL
    ./assemble.sh                                      # + audio.wav → out/elyra-trailer-1080p.mp4 and out/elyra-trailer-vertical.mp4

`drive.py` skips frames already on disk, so a stopped render picks up where it left off. `--times 7,11.5` renders single test frames.
`TRAILER.frame(t)` poses everything for trailer time t, so any frame can be rendered alone.
`audio.wav` and `out/` are kept out of git (the original trailer's soundtrack: take it from the original video with
`ffmpeg -i original.mov -vn -ac 2 -ar 48000 audio.wav`).
