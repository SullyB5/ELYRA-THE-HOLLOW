# Incoming models (ELYRA), Nov 10 2026

Bryce's batch of Sketchfab models for ELYRA and The Arc, sorted and prepared here so each game's chat can place them. **Nothing loads these yet.** Once a model is placed in a level, move it out of `incoming/` into the game's normal models folder and tick it off.

- `elyra/` is only for ELYRA
- `shared/` fits both games. The same files are also in the The Arc repo's `incoming/shared/`, so the two copies are independent
- `previews/` has a 320x240 render of every model (open the .jpg to see one)

How they were prepared (raw uploads were ~2.2 GB, now ~53 MB in this repo): meshes flattened and joined per material, simplified with meshoptimizer where heavy, textures resized (1024, or 2048 for big pieces) and converted to WebP, meshopt-compressed. **Load with `GLTFLoader` + `setMeshoptDecoder(MeshoptDecoder)`.** Each model is rescaled to metres, with its origin centred on X/Z and at floor level (Y = 0). Facing direction was left as authored. "Packs" (chairs-set, medbay-pack, floor-modular, floor-section*) are several pieces laid out in one file: split them by mesh before placing.

## ELYRA only
| File | What it is | Size (WxHxD) | Tris | Weight | Use here | Original upload |
|---|---|---|---|---|---|---|
| `bed-led.glb` | Double bed with a lit LED frame | 2.10x0.87x1.91 m | 28,721 | 0.7 MB | Tide City apartments, officer quarters on the Vigil | `futuristic_sci-fi_bed_with_led_lights` |
| `chairs-set.glb` | Pack of ~30 futuristic chairs and stools laid out in a grid (split into pieces before use) | 19.83x1.67x13.38 m | 109,394 | 1.1 MB | Ship crew seats, Tide City cafes, briefing rooms | `sci-fi_chairs` |
| `control-panel.glb` | Red/gold handheld-size control panel (scaled to 0.6 m wall panel) | 0.60x0.11x0.52 m | 1,371 | 0.4 MB | Keeper door/console controls, interactables | `sci_fi_panel_control` |
| `dj-stage.glb` | Club DJ stage with LED screen wall, speakers and decks (~3 m wide; scale ~2.5x for a club stage) | 3.27x1.40x1.87 m | 87,921 | 1.0 MB | Midnight Market nightclub room (the Reach nightclub reference) | `dj_booth_for_stage_-_nolight` |
| `fighter-cockpit.glb` | STAR WARS X-WING NOSE + COCKPIT (14.6 m long). Recognisable IP: use the cockpit interior only for first-person flight views, or restyle it; don't show the exterior in the public game | 2.12x2.19x14.58 m | 41,928 | 1.6 MB | Interceptor first-person cockpit view | `x-wing_cockpit_version_2` |
| `glyph-panel.glb` | Carved stone glyph tablet (4.2 x 3.5 m) | 4.17x3.47x0.64 m | 34,048 | 0.4 MB | Wall murals hinting at the uncorrupted Heralds / secret ending | `xunantunich_glyph_panel_1` |
| `greek-pillar.glb` | White marble column, 3.45 m | 0.75x3.45x0.75 m | 3,466 | 0.2 MB | The White City colonnades and plazas | `greek_pillar` |
| `hardware-display.glb` | Large animated holographic UI display (keeps its 1 animation clip) | 6.05x3.21x7.82 m | 25,359 | 0.5 MB | Command centres, Tide City control rooms | `hardware_3d_ui` |
| `hologram-table.glb` | Table with orange/blue glowing holo rings | 2.62x1.15x3.34 m | 15,416 | 0.7 MB | War room / mission briefing table (Rhen's briefing) | `hologram_table__game_ready_asset` |
| `nav-table.glb` | Octagonal star-map navigation table | 2.71x0.91x2.37 m | 466 | 0.3 MB | Vigil command deck, menu backdrop, ship bridges | `celestial_navigation_table` |
| `neon-planet-sign.glb` | Ringed-planet neon wall sign (emissive tube, ~1 m) | 0.03x1.05x1.16 m | 13,344 | 0.1 MB | Midnight Market bars/clubs, Tide City streets | `planet_neon_sign__neon_sign_for_room` |
| `smartphone.glb` | Sci-fi phone / data pad (17 cm) | 0.10x0.01x0.17 m | 60 | 0.1 MB | Pickups for footage logs and lore datapads | `scifi_prop_-_smartphone` |
| `starship-bridge.glb` | Full starship bridge: curved consoles, captain's area, viewport | 9.72x4.00x9.67 m | 150,711 | 3.6 MB | Vigil / Keeper capital-ship bridge for cutscenes; Hollow ship TakeOver interior | `galactic_command_station__starship_bridge` |
| `stasis-capsule.glb` | Upright stasis/growth capsule with a creature in green fluid | 0.68x1.83x1.57 m | 21,396 | 2.8 MB | Hollow labs and prisons (corruption experiments), The Last Signal facility | `sci-fi_fetus_capsule` |
| `table-chairs.glb` | White/black futuristic table with chairs | 1.52x0.49x1.75 m | 7,204 | 0.6 MB | Keeper briefing rooms, White City interiors | `sci_fi_table__chairs` |
| `treasure-chest.glb` | Blue cylindrical supply capsule on a pad | 4.77x2.38x4.69 m | 100,540 | 3.9 MB | Remnant Marks cache / Armory reward / secret pickups | `sci-fi_treasure_chest` |
| `wall-a.glb` | Black wall panel with red glowing lines (4 x 2.6 m) | 4.00x2.60x0.18 m | 8,438 | 0.7 MB | Hollow bases and the prison under the mountain | `sci_fi_wall` |

## Shared (both games)
| File | What it is | Size (WxHxD) | Tris | Weight | Use here | Original upload |
|---|---|---|---|---|---|---|
| `bed.glb` | Bunk with shelving and orange screens | 0.59x1.18x2.00 m | 14,124 | 0.4 MB | Crew quarters on ships and outposts *(The Arc: Crash-site sleeping pods, Arc main structure bunks)* | `sci-fi_bed` |
| `catwalk-bridge.glb` | Short metal catwalk ramp with lit edges (6.5 m) | 6.46x0.77x3.00 m | 536 | 0.1 MB | Hangars, facility walkways *(The Arc: Wreck walkways, gate catwalks)* | `sci-fi_bridge` |
| `ceiling-light.glb` | Long strip ceiling light (1.5 m) | 0.30x0.10x1.50 m | 12,064 | 0.3 MB | Any interior *(The Arc: Station wreck and Arc interiors)* | `sci-fi_style_ceiling_light` |
| `chairs-x4.glb` | Four padded seats in a row (2.7 m) | 2.72x0.88x0.61 m | 67,244 | 3.6 MB | Dropship / shuttle seating *(The Arc: Station seating, the crashed section's seats)* | `sci-fi_chairs_x4_by_jungle_jim (+ identical __1_ copy, skipped)` |
| `cinema-camera.glb` | Rigged-out film camera with cable (15 cm) | 0.15x0.08x0.12 m | 27,182 | 1.1 MB | Footage-log recorder prop *(The Arc: Found recorder / salvage)* | `sony_fx_300_-_jackal` |
| `computer-console.glb` | Laptop-style computer terminal with glowing screen (1.5 m) | 1.48x1.16x1.21 m | 2,060 | 0.3 MB | Terminals / hack points *(The Arc: Station computers, radio room)* | `sci_-_fi_computer_game_ready` |
| `corridor.glb` | Dark corridor tube with red lights (8 m) | 2.60x2.08x8.15 m | 29,980 | 2.1 MB | Hollow ship interiors *(The Arc: Damaged section of the wreck)* | `sci-fi_corridor_-_revisited_2019` |
| `floor-material.glb` | Rusty tileable sci-fi floor (180 m plane; mostly use its textures) | 180.00x0.00x180.00 m | 4,194 | 1.4 MB | Hollow floors *(The Arc: Wreck floors, industrial yards)* | `sci-fi_floor_material` |
| `floor-modular.glb` | Pack of black modular floor tiles laid out (split into pieces) | 6.90x0.07x5.30 m | 35,687 | 0.6 MB | Ship floors *(The Arc: Station floors)* | `modular_sci-fi_floor` |
| `floor-panel.glb` | Floor panel with red light strips (20 x 8 m) | 20.00x0.08x8.00 m | 34,760 | 1.2 MB | Hangar/runway floors *(The Arc: Landing pad, wreck floor)* | `sci_fi_floor_panel01_medium_4x10` |
| `floor-section-b.glb` | Two grated floor sections (11 x 12 m spread) | 10.76x1.20x12.48 m | 51,042 | 0.3 MB | Catwalk floors *(The Arc: Wreck floors)* | `sci-fi_floor_section_kb011` |
| `floor-section.glb` | Two greebled floor sections (34 x 22 m spread) | 34.00x1.06x21.93 m | 59,933 | 0.3 MB | Hollow base floors, ship decks *(The Arc: Wreck decks)* | `sci-fi_floor_section_kb019` |
| `floor-tiles.glb` | Flat blue tile plane (15 x 6 m, 2 triangles; texture only) | 15.00x0.00x6.00 m | 24 | 0.1 MB | Floors *(The Arc: Floors)* | `sci-fi_modular_floor_tiles` |
| `fuel-cell.glb` | Glowing orange fuel-cell canister (75 cm) | 0.66x0.75x0.64 m | 8,132 | 0.1 MB | Pickups, generators, explosive barrels *(The Arc: Salvage from the wreck / power cells for the base)* | `sci-fi_fuel_cell_canister` |
| `gas-bottle.glb` | Green N2 gas bottle with valve (1.44 m) | 0.39x1.44x0.41 m | 4,090 | 0.4 MB | Labs, hangars *(The Arc: Workshops, explosive salvage)* | `nitrogen_bottle` |
| `hallway.glb` | White modular corridor section (4.5 x 3.3 x 5.9 m) | 4.47x3.29x5.92 m | 245,333 | 6.2 MB | Keeper ship/outpost corridors *(The Arc: Inside the Arc station wreck)* | `sci_fi_hallway_free` |
| `keypad-panel.glb` | Wall keypad with an ENTER PIN screen (2 m panel) | 2.00x2.00x0.18 m | 884 | 0.2 MB | Locked doors, puzzle doors *(The Arc: Locked bunker/vault doors)* | `simple_sci-fi_wall_panel` |
| `locker.glb` | Red metal locker (1.73 m) | 0.76x1.73x1.33 m | 1,452 | 0.1 MB | Keeper barracks, armouries *(The Arc: Arc station wreck interior, barracks, storage loot container)* | `sci-fi_locker` |
| `medbay-pack.glb` | Grimy medical pack laid out in a row: drip stands, carts, scanners, cabinets (split into pieces) | 15.85x3.20x3.07 m | 15,974 | 1.4 MB | Hollow labs, Last Signal facility medbay *(The Arc: Arc infirmary, crash-site med bay)* | `nursing_sci-fi_pack_terror_version` |
| `medkit-case.glb` | White medical case (62 cm) | 0.42x0.18x0.62 m | 25,906 | 0.6 MB | Health pickup / medbay prop *(The Arc: Med loot crate)* | `sci-fi_med_kit` |
| `medkit-small.glb` | Red wall-mounted medkit (40 cm) | 0.11x0.40x0.23 m | 744 | 0.3 MB | Health pickup *(The Arc: Med supplies pickup / infirmary wall)* | `sci-fi_medkit` |
| `roof-panel.glb` | Grey grated roof/ceiling plate (4.5 x 6.4 m) | 4.53x0.19x6.35 m | 156 | 1.3 MB | Ceilings *(The Arc: Ceilings and scrap roofing)* | `sci-fi_roof_panel` |
| `server-rack.glb` | Open server rack (2 m) | 1.27x2.00x0.82 m | 29,625 | 1.6 MB | Facility server rooms (The Last Signal) *(The Arc: Arc tech room, salvage)* | `server_rack` |
| `server-tower.glb` | Plain dark server tower (2 m, 90 triangles) | 0.60x2.09x0.60 m | 90 | 0.0 MB | Background filler *(The Arc: Background filler)* | `server` |
| `statue.glb` | Dark stone animal statue (7.8 m) | 3.02x7.79x4.49 m | 1,496 | 0.4 MB | White City / Remnant shrine *(The Arc: Ruins landmark)* | `statue` |
| `stone-arch-ruins.glb` | Row of broken stone arches with rubble (17.5 m) | 17.55x4.95x4.10 m | 39,307 | 4.9 MB | Remnant ruins on Elyra/Astraea *(The Arc: Ancient ruins landmark)* | `stone_arch_pillars_-_ruins` |
| `stone-pillar.glb` | Weathered marble pillar (3.7 m) | 1.39x3.66x1.39 m | 908 | 0.3 MB | White City ruins *(The Arc: Ruins in the wild / Cinder City)* | `stone_pillar` |
| `walkie-talkie.glb` | Handheld radio (36 cm) | 0.14x0.36x0.05 m | 7,173 | 0.1 MB | Comms prop / pickup *(The Arc: Radios to contact the station / other settlers)* | `starmax-8000_sci-fi_walkie-talkie` |
| `wall-2.glb` | White panelled wall with diagonal braces (11 x 5.6 m) | 11.27x5.63x1.02 m | 55,113 | 0.4 MB | Keeper interiors *(The Arc: Arc main structure walls)* | `sci-fi_wall_2` |
| `wall-3.glb` | Flat dark wall/floor plate texture card (5.3 x 3.6 m) | 5.31x0.14x3.55 m | 12 | 0.2 MB | Filler panels *(The Arc: Filler panels)* | `sci-fi_wall_3` |
| `wall-4.glb` | Teal machinery/electrical wall section (2 m tall) | 0.39x2.00x1.43 m | 12,844 | 0.5 MB | Engine rooms, Tide City utility *(The Arc: Power room, wreck machinery)* | `sci-fi_wall_4` |
| `wall-b.glb` | Curved grey hull wall with a window (4.5 x 3.8 m) | 4.49x3.83x2.41 m | 1,908 | 0.5 MB | Ship hulls, outposts *(The Arc: Broken hull pieces at the crash site)* | `sci-fi_wall` |
| `wall-c.glb` | Curved white wall panel (2.6 m) | 2.57x1.24x0.33 m | 98 | 2.1 MB | Interior trim *(The Arc: Arc interior trim)* | `sci-fi_wall__1_` |
| `wall-screen.glb` | Wall monitor with a radar UI (3 x 2 m) | 2.99x2.01x0.13 m | 220 | 0.1 MB | Command rooms *(The Arc: Arc command/radio room)* | `full_screen` |
