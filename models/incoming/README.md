# Incoming models (ELYRA), Nov 10 2026: all placed

Bryce's batch of Sketchfab models for ELYRA and The Arc. Every file has now been placed in the game and **moved out of `incoming/` into `models/`** (same file names). `previews/` keeps the 320x240 render of each one, for reference. The Arc repo still has its own copies of the shared files in its `incoming/shared/`.

How they were prepared (raw uploads were ~2.2 GB, now ~53 MB): the meshes were flattened and joined per material, simplified with meshoptimizer where they were heavy, and the textures were resized (1024, or 2048 for big pieces) and converted to WebP. Everything is meshopt-compressed. Each model is rescaled to metres, with its origin centred on X/Z and the floor at Y = 0.

**How the game loads them:** `js/shared/furnish.js` (`FURN`), through the same `GLTFLoader` + `MeshoptDecoder` loader that `MODELS` uses. Props are drawn instanced: one draw call per material, per prop, per 140 m zone. Packs (chairs-set, medbay-pack, floor-modular, floor-section, floor-section-b) are split when they load. `FURN.PIECES` holds each piece's box in the pack. The boxes were found offline from triangle islands, merged where their footprints overlap. Each pack downloads once, however many of its pieces a level uses. The hidden things in each level (carvings, footage logs, Marks caches) are in `js/shared/finds.js` (`FIND`).

Two fixes apply to every file: a material that asked for vertex colours or a normal map draws without them, because both came out black on the unpacked geometry.

**Changes to the files themselves:**
- `hallway.glb` was simplified from 245k to 71k triangles (6.5 → 3.4 MB): welded by position, then flat normals. Its greebles were the weight.
- The hull of `fighter-cockpit` is cut at load to the tub round the seat, so the X-wing's nose and outside are never drawn.

## Where each one went
| File | Placed in |
|---|---|
| `bed-led.glb` | Keel (new TakeOver map): the officer's bed in the bunk room |
| `chairs-set.glb` (pack) | Pieces: `swivel` at The Last Signal's server-room console and Keel's hold console; `sofa` in Keel's bunk room. Other pieces are named in `FURN.PIECES`, ready to use |
| `control-panel.glb` | Keel: on the crew table in the bunk room |
| `dj-stage.glb` | Midnight Market: the club's DJ stage at 2.05x, against the back wall where the bar was. 2.5x would have covered the back door. Both clubs |
| `fighter-cockpit.glb` | First-person cockpit view for the interceptor, inside only: V (or COCKPIT on a phone) in The Last Signal's valley flight and The Heralds |
| `glyph-panel.glb` | The hidden Remnant carving in each on-foot campaign level (Site K, Dead Ground, The White City, The Mountain, The Last Signal), weathered and half-sunk. Walk up and it's read aloud: hints about the uncorrupted Heralds |
| `greek-pillar.glb` | The White City: a broken colonnade before the tower's door. Fallen Spire: round the fountain court. Gilded Shore: the plazas' pillars |
| `hardware-display.glb` | The Vigil's bridge set: small and see-through, hanging over the hologram table |
| `hologram-table.glb` | The Vigil's bridge set (Rhen's briefing before Site K, Elias in the ending where the device rises) |
| `nav-table.glb` | Main menu (night): the centrepiece on a shore overlook that the camera circles first while the menu comes up |
| `neon-planet-sign.glb` | Midnight Market: two inside each club |
| `smartphone.glb` | Footage logs (data pads): Dead Ground, The Mountain, The Last Signal. Also Dead Ground's Herald data slate |
| `starship-bridge.glb` | The Vigil's bridge set (`FURN.bridgeSet`): Site K's opening briefing, and the secret ending's first shot |
| `stasis-capsule.glb` | The Last Signal: four line the detention wing by Rhen's cell. Two at Site K, two below The Mountain. Recoloured to the Host's violet in Hollow levels |
| `table-chairs.glb` | Keel: the crew table in the bunk room |
| `treasure-chest.glb` | A hidden Remnant Marks cache (scaled down), one per on-foot campaign level |
| `wall-a.glb` | Hollow walls: Site K (2), below The Mountain (2), The Last Signal (2), Husk (2 a side) |
| `bed.glb` | Keel: three bunks |
| `catwalk-bridge.glb` | Keel: the ramps up to the hold's walkway |
| `ceiling-light.glb` | Keel: the bay, the crawl and the bunks |
| `chairs-x4.glb` | Keel: drop seats along both walls of each bay |
| `cinema-camera.glb` | Footage logs (field recorders): Site K, The White City. Also Dead Ground's fighter flight recorder |
| `computer-console.glb` | The Last Signal's server room, Keel's hold |
| `corridor.glb` | Keel: the dark service crawl |
| `floor-material.glb` | Keel: its texture on the hold's and the corridors' floors (the 180 m card itself isn't drawn) |
| `floor-modular.glb` (pack) | Keel: hatch, grille and plate tiles set into the hold's and the bunks' floors |
| `floor-panel.glb` | Keel: the bays' landing-deck plate |
| `floor-section-b.glb` (pack) | Keel: piece `b` is the hold's raised walkway |
| `floor-section.glb` (pack) | Husk: piece `b` laid on the hangar floor, sunk so only its ribs show |
| `floor-tiles.glb` | Keel: its texture on the bays' and bunks' floors |
| `fuel-cell.glb` | Cover and dressing: Site K, Dead Ground's settlements, below The Mountain and its landing zone, Vigil Harbour, Keel |
| `gas-bottle.glb` | Same places as the fuel cells |
| `hallway.glb` | Keel: the white Keeper spine corridor (two sections each half) |
| `keypad-panel.glb` | Keel: by each bay's door |
| `locker.glb` | Keel: the bays, the bunks and the hold |
| `medbay-pack.glb` (pack) | The Last Signal: `surgery` and `cart` in the west room. Other pieces are named in `FURN.PIECES` |
| `medkit-case.glb` | Dead Ground: the wreck's med kit, the thing you pick up |
| `medkit-small.glb` | Keel: on each bay's wall |
| `roof-panel.glb` | Keel: the hold's ceiling plates |
| `server-rack.glb` | The Last Signal's server room |
| `server-tower.glb` | The Last Signal's server room, Site K, Husk |
| `statue.glb` | Beside each hidden Remnant carving (the stone beast) |
| `stone-arch-ruins.glb` | Dead Ground (south of the desert stretch), The White City (the way round), Fallen Spire (the plaza's far edge), Gilded Shore (both beaches) |
| `stone-pillar.glb` | The White City, Fallen Spire, Gilded Shore |
| `walkie-talkie.glb` | Dead Ground: the emergency locator by the wreck |
| `wall-2.glb` | Keel: the hold's long walls |
| `wall-3.glb` | Keel: its texture on the walls (the card itself isn't drawn) |
| `wall-4.glb` | Keel: the machinery wall in the bunks |
| `wall-b.glb` | Keel: two hull windows in each bay's back wall |
| `wall-c.glb` | Keel: trim on the bunk room's wall |
| `wall-screen.glb` | The Last Signal's server room |
