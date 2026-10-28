# Weapons (Oct 27–28 2026)

## How it works now
- Two weapons carried: primary (key 1) and secondary (key 2), wheel / Tab / phone ⇄ swap. Every mission starts with the assault rifle and the pistol; no picker on the mission screen (campaign levels run straight on again).
- **Gun racks** (models/weapon-rack.glb, Keeper colours): look at a gun on a rack from within reach for a moment and it's yours with a full magazine; the gun you held goes back on the rack. The rack holds the Keeper guns in their standard looks only: Pulse rifle, Lance, Breaker, and the sidearm on the top shelf (enemy guns only come off the fallen). A spot that is not walkable yet (behind a shut door, as in The Last Signal) gets its rack once you come near and it opens.
- **Ammo box** (models/ammo-crate.glb) beside every rack: E / USE fills everything you carry. One ammo type for now; ammo pickups fill everything too.
- **Where racks stand**: the start of every mission (where you first get control), every settlement (the spare-rover spots), every old Breaker-rocket pickup spot, and every hold-out (any objective starting "Hold"). Each backs onto the nearest wall, facing into the open, off the road's middle lane.
- **Guns on the ground**: E / USE while looking at one. It comes with only the ammo in it; your old gun lies where it was, with its magazine. Enemies drop them sometimes (rifles 1 in 16, heavies 1 in 4; gone after 60 s). Enemy guns keep their makers' sound and bolt colour and use your damage numbers (rifles = assault rifle, heavies = Breaker): Hollow pulse gun, Herald rifle (amber / red), Hollow heavy blaster, Herald heavy.
- **Five classes** (Oct 28): pistol, assault rifle, SMG, sniper, rocket launcher (the Armory shows them in that order). The SMG has the pistol's damage at 5x its rate (20 rounds a second, 40-round magazine) and every SMG fires the pistol's sound, fast.
- **Enemy guns** (Oct 28; `EGUN` in js/origin/03-play.js, by side and unit): the Hollow carry the Hollow assault rifle (the old Herald rifle model), the Hollow SMG (the old Hollow rifle model), the Red Fang and the Red Longshot; the Heralds carry the Red Carbine and the Red Ripper (bolts in their side's colour); heavies keep their launchers. Each enemy fires at his gun's class rate and drops exactly the gun he holds.
- Grenades: key 3 (3 a mission, up to 5, dropped by the fallen). Zeal: key 4 or middle click.
- Armory skins: locked, 100 Remnant Marks each; they show on the gun in your hands.

## Next
- Tune where racks land per level after a playthrough (some levels get a dozen; spots closer than 4 m are skipped).
- Separate ammo types once the gun system settles.
- The sniper case (models/weapon-case.glb, lid animation) as a single special-gun crate.
