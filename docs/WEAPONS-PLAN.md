# Weapons plan (Oct 27 2026)

## Done (Oct 27)
- Two weapons carried: primary (key 1) and secondary (key 2), wheel / Tab / phone ⇄ swap. You spawn with the assault rifle and the pistol.
- The mission screen asks for the loadout every on-foot level: assault rifle (Pulse), sniper (Lance), rocket launcher (Breaker) or pistol (Sidearm), any weapon in either slot. In a campaign the next level now waits on that screen instead of starting on its own.
- Grenades: key 3 on PC (phone unchanged). 3 per mission, up to 5 carried, ~11% of fallen enemies drop one (a green twin-sphere pickup).
- Zeal: key 4 or the middle mouse button (was Z), on foot, in space and over Tide City.
- The shield / sentry / grenade / Zeal strip is gone from the bottom left; keys are in the pause menu's Controls. The grenade count sits under the weapon panel on PC, and on the NADE button on a phone.
- Armory skins are skins for the weapons (they show in whichever slot the weapon is carried), all locked, 100 Remnant Marks each for now (`SKIN_PRICE` in js/shared/progress.js; each skin's old price kept as `list`).
- models/weapon-rack.glb: the rack recoloured to Keeper white, blue shelves, gold hazard stripes, cyan lights; the old emblem painted out.
- models/weapon-case.glb: the sniper case with its ground disc removed (it has a lid animation).

## Still to build
1. **Weapons on the ground** (rocket launchers and snipers at the stops): a `weapon` pickup that shows the gun model lying down; walk up + E / USE swaps it with the gun in your hand, and the gun you drop stays there with its ammo. Needs: the swap in js/origin/03-play.js (`GUNS[P.gun]=WEAPONS[id]`, ammo travels with the gun), a prompt pop-up, and a placement list per level like the `addPick` lists.
2. **Enemy gun drops**: Host pulse gun, Herald rifle, Hollow/Herald heavies as WEAPONS entries (models exist: hollow-gun, herald-rifle, hollow-heavy, herald-heavy; each plays its enemy's sound). Decide their damage in COMBAT-SPEC terms.
3. **Gun crates at level starts**: the rack offers 3–4 guns to pick from (pop-up list, pick one into the slot in hand); the case holds one special gun and opens with its lid animation. Once crates exist, the mission-screen picker can be retired or kept as the starting pick.
4. **Ammo**: ammo boxes now refill both carried guns (not the pistol, which never runs dry) by half; rocket pickups only help if you carry the launcher. To decide: shared ammo vs. per-type (light / sniper / rockets), a refill crate model at stops, and enemies dropping ammo for what you carry.
5. **Balance**: reserves with two slots; a sniper + launcher loadout has no infinite fallback (a respawn gives the primary two magazines).
6. **Armory**: price skins one by one later.
