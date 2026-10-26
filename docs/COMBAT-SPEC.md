# ELYRA: THE HOLLOW — MASTER COMBAT SPECIFICATION

**Status:** Approved baseline as of October 25, 2026. Values below are locked decisions unless explicitly marked **TBD**. "Approved" means selected as a starting design specification, not validated by playtesting. Covers combat, vehicles, ships, and planned future multiplayer (not the full game's story/lore).

## 1. Core health and damage rules

- Standard ground player: **100 HP + 25 shield = 125 total**.
- Standard ground NPC enemy: **100 HP + 25 shield = 125 total**.
- Player craft: **100 HP + 25 shield = 125 total**.
- Other aircraft and special vehicles use the separate class health pools below.
- Damage uses three ground-unit locations: **head, torso, remaining body**.
- Damage to a shielded target **carries through the shield into HP in the same hit**.
- Weapon damage for the player is shared between single-player and future player-versus-player combat.
- No friendly fire in either mode.

## 2. Player ground weapon damage

| Weapon | Head | Torso | Remaining body | Hits to defeat full 125: H/T/O |
|---|---:|---:|---:|---|
| Assault rifle | 125 | 65 | 45 | 1 / 2 / 3 |
| Sniper rifle | 150 | 125 | 65 | 1 / 1 / 2 |
| Pistol | 65 | 45 | 35 | 2 / 3 / 4 |
| SMG | 65 | 35 | 25 | 2 / 4 / 5 |
| Breaker (future PvP only) | 250 | 250 | 250 | 1 / 1 / 1 |
| Ground rocket launcher | TBD | TBD | TBD | TBD |

Hit counts above assume each hit is in the same region, the target begins at 125 total, and there is no healing or shield recovery between hits. **Breaker** also deals area-of-effect damage, but its area damage and radius are **TBD**. Ground rocket launcher damage is separately **TBD**; do not substitute aircraft rocket damage automatically.

## 3. Ground fire rates, magazines and reloads

| Weapon | Fire rate | Magazine | Reload |
|---|---|---:|---:|
| Assault rifle | **2–3 shots/sec** (specific value TBD) | 40 | 4 sec |
| Sniper rifle | 1 shot per 3 sec | 10 | 4 sec |
| Pistol | 4 shots/sec | 18 | 3 sec |
| SMG | 6 shots/sec | 40 | 3 sec |
| Ground rocket launcher | 1 shot per 3 sec | 1 | 4 sec |
| Breaker | TBD | TBD | TBD |

- Ground gun hit detection: **hitscan**.
- **No effective range limit**, **no damage falloff**, **no recoil/spread penalties**, and **no alternate firing modes** were requested.
- Exact default trigger behavior for each gun is not additionally specified.
- With a one-round magazine and four-second reload, the ground rocket's nominal three-second firing interval does not itself establish its sustained firing rate. Interaction of cooldown and reload is **TBD**.

## 4. NPC difficulty, damage and accuracy

| Difficulty | Ground NPC outgoing damage versus matching player attack | NPC hit chance | NPC aircraft outgoing damage versus matching base attack |
|---|---:|---:|---:|
| Survivor | 20% | 20% | 15% |
| Keeper | 40% | 40% | 30% |
| Hollow | 60% | 60% | 45% |

NPC aircraft have an **additional 25% outgoing damage reduction**, hence 15/30/45% effective rather than 20/40/60%. NPC fire rates, magazine sizes and reloads match player equivalents. Difficulty currently **does not** change AI aggression, movement, cover usage or reaction time. Accuracy percentages were confirmed as **chances to hit**, rather than percentages of an unstated baseline.

**Ground NPC damage, each cell Head / Torso / Other**

| Weapon | Survivor | Keeper | Hollow |
|---|---|---|---|
| Assault rifle | 25 / 13 / 9 | 50 / 26 / 18 | 75 / 39 / 27 |
| Sniper | 30 / 25 / 13 | 60 / 50 / 26 | 90 / 75 / 39 |
| Pistol | 13 / 9 / 7 | 26 / 18 / 14 | 39 / 27 / 21 |
| SMG | 13 / 7 / 5 | 26 / 14 / 10 | 39 / 21 / 15 |

## 5. Shield regeneration and health healing

**Ground player shields**: after **5 consecutive seconds without damage**, recharge an empty 25 shield in **8 seconds** (3.125 shield/sec while actively refilling).

**Ground NPC shields**: after **10 consecutive seconds without damage**, recharge an empty 25 shield in **16 seconds** (1.5625 shield/sec while actively refilling).

- After incoming damage, recovery pauses; already restored shield points are preserved.
- A new damage-free window must be satisfied following the **latest hit** before recharging continues.
- Player's craft shields use the **same 5-second wait + 8-second refill**.
- **Enemy aircraft/ships do not regenerate shields or HP**, even when they have nonzero shield capacity.
- No regeneration or repair applies to other special vehicles unless separately approved.

**Ground health healing:** One med supply type restores **50 HP**, immediately, including during combat. No healing stations. NPC ground enemies do not use medical supplies. Ground HP does **not** regenerate automatically.

**Player craft hull HP:** Automatically regenerates over time (exception to the no-hull-repair rule). **Rate and HP regeneration delay are TBD**. No repair consumables or stations.

## 6. Vehicle and ship durability

| Unit | HP | Shield | Total | Auto hull HP recovery | Auto shield recovery |
|---|---:|---:|---:|---|---|
| Player Craft | 100 | 25 | **125** | Yes — speed TBD | Yes — player normal timing |
| Fighter (NPC) | 100 | 25 | **125** | No | No |
| Bomber | 175 | 25 | **200** | No | No |
| Dropship | 300 | 0 | **300** | No | No |
| Warthog | 175 | 0 | **175** | No | No |
| Mech | 500 | 0 | **500** | No | No |
| Flagship | 800 | 200 | **1,000** | No | No |
| Main Flagship | 1,600 | 500 | **2,100** | No | No |

- The player craft is **distinct from** the fighter class despite matching HP/shield amounts.
- Exactly one mech class is currently planned.
- **No repair methods for vehicles**, aside from the player's craft automatic hull restoration.
- Both flagships can be destroyed by **ordinary fighter weapons** through sufficient damage; no special weak point is mandatory.
- Shields on other ships are finite and **do not regenerate**; therefore their 200/500-point capacities do not require assigned regeneration times.

## 7. Air weapons and ground/air interactions

| Aircraft weapon | Player base damage/hit | Survivor enemy aircraft damage | Keeper enemy aircraft damage | Hollow enemy aircraft damage |
|---|---:|---:|---:|---:|
| Turret | **35** | **5.25** | **10.50** | **15.75** |
| Rocket | **80** | **12** | **24** | **36** |

Fractional enemy turret values are shown precisely; **rounding behavior is TBD**. Aircraft hit locations do **not** create damage multipliers. Aircraft turret and rocket rates, magazines, reloads and projectile characteristics are **TBD**; these values are not inherited from similarly named ground weapons.

- Ground units **can shoot air targets**; air units **can shoot ground targets**.
- **Keep the approved weapon damage** in both directions; no additional cross-target damage modifiers.
- Vehicles/ships may have distinct HP values as approved above.
- Enemy aircraft outgoing damage alone has the extra 25% reduction; aircraft enemy counts and attack frequencies are **TBD**.

## 8. Future multiplayer plan

Multiplayer **is not currently implemented**.

- Shared player weapon base damage and ground health system.
- Spawn/respawn with **full 100 HP + 25 shield**.
- Same shield and medical healing behavior as single-player.
- Friendly fire disabled.
- Breaker exclusive to future multiplayer: **250 direct hit** and confirmed **area-of-effect damage** (AoE number/radius TBD).
- NPC damage difficulty multipliers do not apply to human-player outgoing damage.

## 9. Deliberately unresolved (TBD)

1. Final chosen assault rifle cadence within **2–3 shots/sec**.
2. Ground rocket damage and any splash characteristics.
3. Ground rocket firing cooldown versus reload interaction.
4. Breaker AoE damage, radius, falloff and weapon cadence/ammunition.
5. Medical supply carry limit and any usage cooldown.
6. Total reserve ammunition and ammo acquisition.
7. Detailed automatic/semi-automatic trigger behavior (no alternate modes selected).
8. Player craft hull HP restoration **rate and delay**.
9. Aircraft turret/rocket fire rate, ammunition, reload and projectile behavior.
10. Fractional NPC aircraft damage rounding.
11. Optional special-vehicle weak points or additional non-air location rules.
12. In-progress regeneration wait timer bookkeeping, beyond the latest-hit damage-free window and preservation of already regenerated shield points.
13. Multiplayer respawn timing and game-mode details.
14. Any unapproved AI behaviors, inventories or mission-dependent mechanics.

**Important:** Never treat the TBD items as approved values. Preserve the numbers and exceptions above when producing game code, tuning proposals or future revisions.

## 10. Bryce's decisions after the spec (Oct 25, 2026)

These override or extend the sections above and are what `js/shared/damage.js` uses.

- Assault rifle cadence: **4 shots/sec** (outside the 2–3 range above, by choice).
- The **Breaker** is the launcher in the campaign too: **250** on a direct hit, at the ground launcher's cadence (1 round, 4 s reload). Its area damage stays TBD; until it is set, the old blast carries on as a stand-in.
- NPC shots on the player always land on the **torso**.
- Troopers are tuned for a squad of four firing at once: per torso hit **Survivor 3.25, Keeper 2.6, Hollow 2.6** (a squad of four drops a full 125 in about 12 s / 7.5 s / 5 s).
- **Zeal** doubles damage, fire rate and shield regeneration.
- **Mobile shield**: 100 HP. **Shoulder sentry**: assault-rifle damage and rate. **Hollow turrets**: 30 per hit, 1 shot/sec, threat-level hit chance. **Squadmates**: 100 HP, no shield.
- Everything else not named in this spec (grenades, ammo pickups, revives, turret plating) keeps its old feel, converted to the new pools.
- Player craft (The Heralds, Tide City in the air): **hull and shield both recover**, 5 s after the latest hit, each empty to full in 8 s (twice as fast in Zeal). The walker, skiff and other special vehicles still don't.
- The craft's guns fire at **half their old rate** (one shot every 0.22 s; Zeal doubles it), so Herald ships don't melt.
- Fractional NPC aircraft damage (5.25, 10.5…) is kept as is; the Breaker's old blast stays as its area damage.
