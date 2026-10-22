# Pathfinder · Side mission S1 · script as built

Bryce's opening ("PATHFINDER · Opening Mission", Oct 21) as it plays in `pathfinder.html`. His lines are kept word for word. Lines marked *(draft)* are Claude's filler for gameplay radio. Rewrite those freely.

Each spoken line has an ID for voice files (`PF-014.mp3`). The code holds the text in:
- `js/pathfinder/03-sets.js`: the opening, the chase and the crash.
- `js/pathfinder/02-story.js`: the mission, the chamber and the gunship.

**Cast**
- **Captain A. Rhen** (you): Bryce's TEAM LEADER.
- **Sergeant O. Marsh**: SECOND SOLDIER.
- **Ensign P. Landry**: PILOT. She flies the Pathfinder's dropship.
- **Okafor** and **Thorne**: the rest of the strike team.

Rhen, Marsh and Landry are the names carved under the Hollow King's mountain in Archive 01, dated 08.03.2237. That is today's date.

The "Hollow" forces in the script are the **Empty Host**, the Hollow King's army. The installation sits on a dead moon. The planet they fall to is **Astraea**.

## Before: the opening cutscene
| ID | Shot | Who | Line |
|---|---|---|---|
| | Black. *Side mission S1 · 08.03.2237 · PATHFINDER* | | |
| | The moon from orbit; a black installation sunk into it, lights crawling across it; a low hum | | |
| PF-001 | INT. the dropship's bay. Red light, shaking, weapons checked | Landry | We're thirty seconds out. |
| PF-002 | The holo table: **UNKNOWN ARTIFACT** | Rhen | We get in. We find it. We get out. |
| PF-003 | | Marsh | That's it? |
| PF-004 | | Rhen | That's what we're told. |
| PF-005 | The ship drops; everyone grabs a rail | Landry | Brace! |
| | The rear ramp opens on wind and dark; the team jumps; the fall through cloud and flak; landing in the crater | | |
| | Card: *Get in. Find it. Get out.* | | |

## The mission
| ID | When | Who | Line |
|---|---|---|---|
| PF-010 | The crater | Marsh | Quiet landing. That won't last. *(draft)* |
| PF-011 | | Landry | Pathfinder, overhead and holding. I can't come lower with those spires lit, Captain. Call it when you want out. *(draft)* |
| PF-012 | Yard contact | Marsh | Contact! Host on the barricades! *(draft)* |
| PF-013 | | Okafor | Wall guns, and riflemen on the terrace! *(draft)* |
| PF-014 | | Marsh | They're holding the gate! *(draft)* |
| PF-015 | Plant the charge | Marsh | Charge set! Everybody back! *(draft)* |
| PF-016 | | Okafor | Gate's down. We're in. *(draft)* |
| PF-017 | Host halls | Thorne | Inside! Short range, watch the pods! *(draft)* |
| PF-018 | | Thorne | Schematics put the vault three hundred metres in, Captain. Straight through. *(draft)* |
| PF-019 | Big hall | Marsh | They're on the galleries! Both sides! *(draft)* |
| PF-020 | The old stone begins | Marsh | These walls aren't Host. Look at the joins. *(draft)* |
| PF-021 | | Okafor | There aren't any. *(draft)* |
| PF-022 | | Thorne | Captain... the schematics end here. *(draft)* |
| PF-023 | Scan rigs and sample racks before the door | Thorne | Scan rigs. Sample racks. They weren't storing something down here, Captain. They were studying it. *(draft, Oct 22: the Host were researching the object)* |

## The chamber (cutscene)
| ID | Shot | Who | Line |
|---|---|---|---|
| PF-030 | The sealed door | Rhen | This wasn't on the schematics. |
| | The door's six stone petals turn aside. Silence. The object in its containment field | | |
| PF-031 | The scanner; the display glitches (NO MATCH) | Marsh | What the hell is that? |
| PF-032 | | Rhen | I don't know. |
| | It reacts: every light goes out. Dark. **THOOM.** Emergency light; the field flickering | | |
| PF-033 | | Rhen | Take it. |
| PF-034 | | Marsh | Command said recover the package. |
| PF-035 | | Rhen | That is the package. |
| PF-036 | One alarm, another, dozens | Host speaker | *Seraveth. Oruun kael sera. Seraveth vael.* (subtitle: [Unknown language]) |
| PF-037 | | Rhen | We're out of time. |

## Extraction
| ID | When | Who | Line |
|---|---|---|---|
| PF-040 | | Landry | Captain, the whole moon just lit up down there. What did you do? *(draft)* |
| PF-041 | | Landry | Copy, east face, the hangar. I'll find a way in. Keep moving. *(draft)* |
| PF-042 | The shutter slams behind you | Okafor | Doors are sealing behind us! Only way is up! *(draft)* |
| PF-043 | Floor guns rise | Marsh | Floor guns! They're waking the whole place up! *(draft)* |
| PF-044 | If Marsh goes down | Okafor | Marsh is down! He's got the package! Captain, get to him! *(draft)* |
| PF-050 | The hangar (cutscene) | Landry | I have your beacon, Captain. I'm coming round to the east face now. *(draft)* |
| PF-051 | | Marsh | Contact above! Something big! *(draft)* |
| | The Host gunship tears through the roof; it comes down in pieces | | |
| PF-052 | | Rhen | Landry, the roof's gone! Come in from the east, low and fast! *(draft)* |
| PF-053 | | Landry | Copy. Forty seconds. Keep them off that deck. *(draft)* |
| PF-054 | Hold the deck | Landry | Captain, I see your beacon. Forty seconds. That gunship is circling you, so am I. *(draft)* |
| PF-055 | | Marsh | More of them coming up the ramp! *(draft)* |
| PF-056 | | Landry | I can't get a lock on that thing. It's too big, Captain. I'm coming in under it. *(draft)* |
| PF-057 | | Okafor | Captain, the case. It's getting warm. *(draft)* |
| PF-058 | Board | Landry | Ramp's down! Get on, get on! *(draft)* |

## After: the chase (playable), the fall, the crash
| ID | Shot | Who | Line |
|---|---|---|---|
| PF-060 | The dropship lifts off the hangar | Landry | Everyone's aboard! Hold on to something! |
| PF-061 | Host fighters come off the spires | Landry | We've got company! |
| | **You fly the dropship** toward the Pathfinder in orbit. It's a fight you can't win | | |
| PF-062 | | Landry | You fly, Captain! I need both hands on these engines! Get us to the Pathfinder! *(draft)* |
| PF-063 | | Marsh | Fighters behind us! They're coming round! *(draft)* |
| PF-064 | | Landry | Pathfinder, this is the dropship, open the bay! We're coming in hot! *(draft)* |
| PF-065 | | Okafor | Captain, those are Host warships on her! Two of them! *(draft)* |
| | Two Host warships break the Pathfinder in two in front of you | | |
| PF-066 | | Marsh | She's breaking up! The Pathfinder's breaking up! *(draft)* |
| PF-067 | | Rhen | Pathfinder, respond. Pathfinder! *(draft)* |
| PF-068 | | Landry | She's gone, Captain. She's gone. And our way home went with her. *(draft)* |
| PF-070 | Cockpit: alarms | Marsh | We're losing shields! |
| PF-071 | | Landry | I know! |
| | A hit; the ship spins; Astraea fills the canopy | | |
| PF-072 | | Rhen | Can we make Slipscape? |
| PF-073 | | Landry | No. |
| PF-074 | | Rhen | Try again. |
| PF-075 | | Landry | I said no. |
| PF-076 | Missile warning | Landry | MISSILE! |
| | The dive; the missile misses by inches | | |
| PF-077 | Into Astraea's air, on fire | Landry | We're in her atmosphere! I've got nothing, Captain, nothing! *(draft)* |
| | The object wakes; a pulse goes through the ship; Landry's display shows a shape buried under the planet, then nothing | | |
| PF-078 | | Landry | What was that? |
| | No answer. Through the cloud; the crash through the white growths; silence | | |
| PF-080 | INT. the wreck. Smoke, sparks | Rhen | Status. |
| PF-081 | Okafor groans | Marsh | Alive. |
| PF-082 | | Landry | Ship's dead. |
| | The case on the rack, cracked, glowing. A distant explosion. Through the torn roof: a Host ship coming down, then another | | |
| PF-083 | | Marsh | They followed us. |
| PF-084 | | Rhen | Then we'd better figure out what we stole. |
| | Black. *Astraea · 08.03.2237 · PATHFINDER* | | |
