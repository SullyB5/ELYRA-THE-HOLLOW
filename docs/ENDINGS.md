# The First Word · the two endings (Bryce, Oct 26)

**Built Oct 27** (`js/tide/19-endings.js`); see “As built” at the end. Placeholder dialogue throughout, for Bryce’s rewrite. The Spear's FIRE / HOLD prompt (js/tide/11-story.js, SPEAR_ORDER)
already exists and records the choice in `localStorage['elyra.spear']`; everything below hangs off it.

## The idea
All the hints about not firing the Spear (the Drowned Watcher warning Michael, footage 03, the Herald convoy that never fires back)
are about this: **the Spear kills everyone in the sky when it fires, our own people included.**

## Normal ending · the Spear fires
- The Spear's discharge kills everyone in the sky over Tide City: **Michael** (in his interceptor) and anyone else up there. A
  cutscene shows it.
- Tide City is saved.
- *Then* the Hollow suppressor is used.
- We learn that the Heralds (the ones the Hollow had not corrupted) had been trying to get us to use it all along.
- Missions after this go on **without Michael** (and without whoever else was in the sky).

## Secret ending · the Spear never fires
- The Heralds are spared, and so are the main characters (Michael and everyone else in the sky).
- The Hollow suppressor is used **before** the Heralds are destroyed.
- Cutscene: everyone saved.

## Settled (Bryce, Oct 26)
- **What counts as firing:** any shot from the Spear. One shot and you're on the normal ending.
- **The suppressor's dome (Bryce's rule):**
  - It **suppresses the Hollow's effect on people** inside it.
  - It **destroys anyone fully corrupted** who is inside it.
  - It acts as a **shock wall** against the fully corrupted trying to get in.
  - (Lore v3.1 only says it reduces the Hollow's influence; Bryce will add this to the lore docs.)
- **How we learn what the uncorrupted Heralds wanted:** hints spread through the game: murals around the maps, footage logs, and more
  through the levels.
- **After the normal ending:** later missions follow a Pathfinder.
- **Who else is in the sky besides Michael:** not decided (N/A for now).

## Still to answer (after the playthrough)
1. In the hold route, who uses the suppressor, when, and where? How big is the dome (over Tide City only, or out over the King's fleet)?
2. What happens to the Hollow King and the Harbinger in each ending?
3. In the normal ending, who uses the suppressor after the Spear, and does its dome also incinerate the corrupted left over?
4. Which Pathfinder leads the later missions (Rhen, Marsh, Thorne)? Do they appear in the secret route too?
5. How does the game remember the route (Michael dead or alive) for the menu, the save and later levels?
6. Which murals, footage logs and other hints to add, and in which levels?
7. While holding, can Tide City still fall (a fail state), or does the suppressor always arrive in time?
8. Does anything else change between the two routes (Elias, the Vigil, the Herald convoy)?

## As built (Oct 27)
- **Who raises the device (Bryce's pick):** Elias, from the Vigil in her cradle. The dome is centred on the Vigil, 13.5 km across:
  the whole city and the Hollow King's fleet overhead. In game text it stays "the device / what Michael carried down off that mountain".
- **FIRE (normal ending):** the first Spear shot ends the battle. A shell of light goes out from the Spear's tip across the sky and
  brings down everything in it: his fleet, his fighters, any Herald still flying, and Michael's interceptor (it falls burning into the
  bay). Then Elias raises the device; the Host on the plinth burn inside the dome; the Heralds' broadcast comes through clean ("raise
  what the Pathfinders carried... do not fire the weapon beneath you"). Card: "Lieutenant Michael · lost over Tide City".
- **HOLD (secret ending):** HOLD starts the device: 75 s to wake (radio lines and 25/50/75% pop-ups). The city can still fall, and the
  Spear still asks again at 40% and 20% (firing then is the normal ending). When it wakes, or if his fleet comes down to the guns first,
  the dome rises: his escorts break up at its edge, the Harbinger turns and jumps (the King defeated, not confirmed dead), the Host on
  the plinth are gone, the Herald transport and escorts come back under it with guns cold and speak. Card: "The First Word".
- **Saved:** `localStorage['elyra.route']` = {route:'spear'|'hold', michael:'dead'|'alive'}; `elyra.flags` gets spearFired /
  michaelLost / heraldsSpared. Nothing reads them yet (menu/campaign/later levels: still open, #5 above).
- Still open from the list above: 2 (the Harbinger's and King's fate beyond "jumps out"), 4, 5 (what reads the route), 6, 8.
