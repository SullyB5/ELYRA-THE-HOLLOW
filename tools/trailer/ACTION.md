# ELYRA action trailer and "Believe" clip (Nov 13 2026)

Bryce asked for a completely new trailer, "less about the story, more about the action": 20 to 30 seconds, with the story second
(action, adventure, loss, retribution). Then, partway through, he asked for a separate Halo 3 style clip: short and simple, one Keeper
jumping into the fight, using a shield, killing a Hollow heavy, then the word BELIEVE. He'll decide later where it goes in the cut.
Neither is part of the game. The pages are never linked from the menu. The original 50 s trailer (`trailer.html`, README.md) is unchanged.

Both are built on the main menu's night world (`js/trailer/world.js`) under a red war sky, with the Herald fleet over Tide City,
Bryce's rigged characters (`models/chars/rigged/`), his hog, mech, jetpack and ship models, and the game's own music and sound.
The soundtracks are mixed by `mix.py` from `audio/`, so no outside files are needed. Picture: 2.39:1 letterbox, 30 fps.

## Action trailer: `trailer-action.html` + `js/trailer/action.js` (26.5 s)
Cut to drive-total-war (the track's 38.96 s hit is the first cut at 1.0; its own break, 48.6 to 51.75 s, is the loss).

| Time | Shot |
|---|---|
| 0–1 | black, the war under it |
| 1.0–2.98 | the squad sprints across the dunes under Hollow fire, a blast behind them |
| 2.98–4.28 | on an interceptor's tail round the Spear; the Hollow fighter blows apart |
| 4.28–5.51 | the rocket hog flat out along the beach, rockets into a target ahead |
| 5.51–6.51 | the Hollow come out of the smoke firing; a Keeper round hits the lead |
| 6.51–7.5 | the Herald fleet burning the districts, a Keeper wing tears past the camera |
| 7.5–8.34 | the Keeper mech planted on the dunes, both guns open |
| 8.34–10.6 | a Hollow bomber walks its bombs up the beach to the camera, to white |
| 10.6–13.79 | LOSS: slow motion, three of them on the dunes as a Keeper dropship burns and falls. "THEY TOOK EVERYTHING" |
| 13.79–15.0 | the Keeper fleet lights its engines and climbs out of Tide City |
| 15.0–17.0 | Michael walks out of the fire, the squad behind him. "NOW WE TAKE IT BACK" |
| 17.0–18.51 | interceptors fire missiles; they walk down a Herald capital ship's hull |
| 18.51–19.51 | the hog off a dune crest over the camera |
| 19.51–20.51 | the mech's cannons land in the Hollow ranks |
| 20.51–21.67 | the capital ship comes down into the sea |
| 21.67–26.5 | logo, ELYRATHEHOLLOW.COM |

## Believe: `trailer-believe.html` + `js/trailer/believe.js` (24.6 s)
Music: Epic Hybrid (`hybrid.py`, Bryce's call: Epic Two's opening, then the rest of Epic One at Epic Two's beat, speeding up a
little; then its first 40 s cut off). From 9.5 s into the song at the fade-in (0.9), it builds through a quiet stretch to its big hit
on the kill (11.8). At the cut to black (15.5) it jumps to 33.65, so BELIEVE sits on the music dying into silence, and its next hit
lands on the logo (22.0).
`believe.js` starts with a copy of action.js's world, effects and actors, with the capital ship left in the sky.

| Time | Shot |
|---|---|
| 0.9–2.75 | the dropship over the burning dunes, toward the city |
| 2.75–5.6 | Michael steps off, jetpack lit, lands on one knee in a ring of sand |
| 5.6–7.85 | the run at the Hollow line under fire |
| 7.85–10.25 | the shield dome goes up and takes their fire (hex-cut, rippling where hit) |
| 10.25–11.8 | a Hollow heavy charges; he walks out of the dome, rifle up |
| 11.8–13.45 | the kill, in slow motion |
| 13.45–15.6 | the dome dies; the camera rises over him to the Spear |
| 15.95–19.0 | BELIEVE |
| 19.1–21.95 | the squad on the ridge, the Spear across the water |
| 22–24.6 | logo, ELYRATHEHOLLOW.COM |

Michael's jetpack and rifle are placed on his bones (`mixamorigSpine2`, `mixamorigRightHand`) every frame. His arms are turned onto
the aim line after the clip's pose (`aim()`).

## Make them

    python3 -m http.server 8123                       # from the repo root
    cd tools/trailer
    python3 drive.py http://localhost:8123/trailer-action.html  out/action-frames  --from 0 --to 26.5 --fps 30
    python3 drive.py http://localhost:8123/trailer-believe.html out/believe-frames --from 0 --to 24.6 --fps 30
    ./assemble-clip.sh action      # -> out/elyra-action-1080p.mp4, out/elyra-action-vertical.mp4
    python3 hybrid.py              # -> audio/music/epic-hybrid.mp3 (once)
    ./assemble-clip.sh believe     # -> out/elyra-believe-1080p.mp4, out/elyra-believe-vertical.mp4

About 7 s a frame in software GL on a 2-CPU box (`--times 3.5,11.8` renders test frames). `drive.py` needs three@0.128.0 in
tools/render/node_modules (`npm i three@0.128.0 --no-save` there).
