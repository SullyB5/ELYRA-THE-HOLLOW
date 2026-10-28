# Pathfinder · Arc 03 · The White City · script as built (Oct 22)

Built on the locked outcomes in `docs/lore-2026-10-22/pathfinder-the-lost-expedition.md` and Bryce's dome (`docs/PATHFINDER-3-DOME.md`). Rhen's warning to Tide City is Bryce's, word for word; every other line is Claude's draft for Bryce to rewrite. The object stays unnamed ("the case", "the object"). The Hollow is never shown as a creature.

Each spoken line has an ID for voice files (`P3-014.mp3`). The code holds the text in `js/pathfinder3/03-story.js` (cutscenes, the streets, the tower, the ending) and `js/pathfinder3/02-air.js` (the flight in). Footage 07's lines are in `docs/FOOTAGE-SCRIPT.md`.

**Flow:** opening cutscene → you fly Dropship Two in (six fighters, the three amber guns on the wall, the Host's fighters; the case opens the round opening in the wall) → down hard in the plaza → the streets (a three-way war: amber holds, red plants charges to bring the street down, the Host lands among both; the whole city is walkable, every building solid, the wall keeps you in) → the tower door opens for the case → the spiral (three murals, optional) → the barrier: hold 45 s while Thorne opens it → the chamber, amber's guardians round the socket → the ending.

**Test jumps:** `pathfinder-3.html?at=air`, `streets`, `tower`, `interface`, `chamber`, `socket`. In Pathfinder (the menu entry) it is part 3 of 3, after Site K and Dead Ground, played straight through (`?campaign=pf`).

## Before: the opening cutscene · `03-story.js · introScene`
| ID | Shot | Who | Line |
|---|---|---|---|
| | Black. *Pathfinder · Arc 03 · 10.03.2237 · The White City* | | |
| | Low over the dunes in the dark; the city glowing on the horizon; Herald fighters crossing | | |
| P3-001 | Alongside Dropship Two | Landry | I’m not seeing any landing infrastructure. |
| P3-002 |  | Thorne | There isn’t any. |
| P3-003 |  | Marsh | Then how did they build it? |
| P3-004 |  | Thorne | I don’t think they did. |
| P3-005 | The wall from in front: one round opening, sealed with light; the war over it | Okafor | There’s a war on top of it. |
| P3-006 |  | Thorne | Both sides. Red’s hitting the city. Amber’s holding it. |
| P3-007 | Behind the dropship | Rhen | Find somewhere to put us down. |
| P3-008 |  | Landry | Inside that wall, Captain, or nowhere. And I can’t fly and keep the core alive. |
| P3-009 | Behind her, the city ahead | Rhen | Then I’ll fly. |

## The air (you fly Dropship Two) · `02-air.js`
| ID | Shot | Who | Line |
|---|---|---|---|
| P3-010 | Approach | Landry | You fly, Captain. I’m keeping the core alive. One flight, remember. |
| P3-011 |  | Thorne | Both sides are up there. Red’s hitting the city. Amber’s defending it. |
| P3-012 |  | Marsh | And both of them have just noticed us. |
| P3-013 | The guns | Landry | Guns on the wall, either side of the opening! Amber’s! They’ll tear us apart going in! |
| P3-014 |  | Okafor | Get in close and low, Captain! Under their arc! |
| P3-015 | A gun down | Thorne | Gun’s down. *(two / one)* left on the wall. |
| P3-016 |  | Marsh | That’s the last gun on the wall. |
| P3-017 | The Host | Okafor | New contacts! North-west! Purple! |
| P3-018 |  | Rhen | The Host. Here? |
| P3-019 |  | Thorne | They’re not after the Heralds. They’re after us. |
| P3-020 | The opening | Landry | Captain, there’s no way in! That opening’s sealed! |
| P3-021 |  | Marsh | The case. It’s waking up again. |
| P3-022 |  | Thorne | The opening. Look at the opening! |
| P3-023 |  | Rhen | Landry. Take us in. |
| P3-024 |  | Landry | No, sir. You take us in. I’m holding her together. |
| P3-025 | Radio (when needed) | Landry | Pull up! Pull up! |
| P3-026 |  | Landry | Captain, the city’s behind us. Turn her round. |
| P3-027 |  | Landry | Something’s pushing us off the city, Captain. We go in by the front, or not at all. |
| P3-028 |  | Landry | We’re hit! We’re going down! |

## Down in the plaza (cutscene) · `03-story.js · landScene`
| ID | Shot | Who | Line |
|---|---|---|---|
| P3-029 | Through the opening, down hard | Landry | Hold on! She’s coming down hard! |
| P3-030 | Out of her | Landry | That’s it. Core’s gone. She’s done. |
| P3-031 |  | Rhen | Then we walk. Everybody out. |
| P3-032 | The five of them, the tower far up the street | Thorne | The tower. Every street in this city runs to it. |
| P3-033 |  | Rhen | Then so do we. |

## The streets · `03-story.js · director / streetWar`
| ID | Shot | Who | Line |
|---|---|---|---|
| P3-034 |  | Thorne | Amber, holding the street. Red, beyond them. |
| P3-035 |  | Thorne | No joins. Anywhere. It’s one piece of stone, the whole street. |
| P3-036 | The first charge arms | Landry | Captain, red has something at the foot of that building. A charge. They’re bringing the street down. |
| P3-037 | A charge pulled | Thorne | Charge is out. Red’s set more up the street. |
| P3-038 |  | Thorne | That’s the last of their charges. |
| P3-039 | A charge goes off | Okafor | Charge went! Part of the street’s coming down! |
| P3-040 |  | Okafor | Host dropship! Coming down in the street ahead! |
| P3-041 |  | Marsh | They’re not here for the Heralds. |
| P3-042 |  | Thorne | The arcade, left! Red’s in there! |
| P3-043 |  | Landry | The tower’s the middle of everything. Every street runs to it. |
| P3-044 |  | Marsh | Last of the street. That door’s the way in. |
| P3-045 |  | Okafor | Host, behind us! They came down the street after us! |
| P3-046 | The tower door | Marsh | The case. Again. |
| P3-047 |  | Thorne | The door’s answering it. |
| P3-048 |  | Rhen | Then it wants us inside. Go. |

## The tower and the spiral · `03-story.js`
| ID | Shot | Who | Line |
|---|---|---|---|
| P3-049 |  | Thorne | The air’s different in here. Still. |
| P3-050 |  | Okafor | And it goes up. All the way round. |
| P3-051 |  | Okafor | Host! They’re already in here! |
| P3-052 |  | Rhen | Pictures on the walls. Thorne, eyes on them when we can. |
| P3-053 |  | Thorne | Amber, up ahead. Guardians. They’re not letting anyone up. |
| P3-054 | Mural 1 · the cities (optional) | Thorne | Cities. Dozens of them. On more than one world. |
| P3-055 |  | Marsh | Herald cities? |
| P3-056 |  | Thorne | No. This wasn’t built by the Heralds. |
| P3-057 |  | Marsh | Then who built it? |
| P3-058 |  | Thorne | Someone who was here long before them. |
| P3-059 | Mural 2 · the fall (optional) | Thorne | And then this. Everything coming apart at once. |
| P3-060 |  | Rhen | What happened to them? |
| P3-061 |  | Thorne | I don’t know. |
| P3-062 |  | Okafor | That spiral. It’s on every one of them. |
| P3-063 | Mural 3 · the dome (optional) | Thorne | Captain. This one’s later. The cities are still standing. |
| P3-064 |  | Landry | Then what are we looking at? |
| P3-065 |  | Thorne | Evidence that whatever happened here didn’t have to end the way it did. |
| P3-066 | The barrier (hold 45 s) | Thorne | A wall of light. There’s a panel. I can open it. I need time. |
| P3-067 |  | Rhen | How long? |
| P3-068 |  | Thorne | Less if nobody shoots me. |
| P3-069 |  | Marsh | They’re coming up behind us. Both of them. |
| P3-070 |  | Okafor | More of them! Coming up the spiral! |
| P3-071 |  | Thorne | Halfway. It’s not a lock. It’s asking me something. |
| P3-072 |  | Thorne | It wants the case. It’s reading the case. |
| P3-073 |  | Thorne | It’s open! Go, go! |

## The chamber · `03-story.js`
| ID | Shot | Who | Line |
|---|---|---|---|
| P3-074 |  | Okafor | Open to the sky. All the way up. |
| P3-075 |  | Thorne | Captain. The middle of the floor. |
| P3-076 |  | Rhen | I see it. |
| P3-077 |  | Landry | Amber! Round the socket! Guarding it! |
| P3-078 |  | Okafor | Host, behind us, up the spiral! |
| P3-079 |  | Marsh | Clear! |
| P3-080 |  | Thorne | Captain. That slot. It’s the same shape. |
| P3-081 |  | Rhen | I know. |

## The ending · `03-story.js · endScene`
| ID | Shot | Who | Line |
|---|---|---|---|
| P3-082 | The object in Rhen’s hands, over the slot | Okafor | What happens when it goes in? |
| P3-083 |  | Rhen | We find out what they were afraid of. |
| | It goes in; gold runs out across the floor; a pillar of light up the shaft; outside, the dome rises from the wall and closes over the city | | |
| | In the street a red pair and an amber pair lower their rifles and look up | | |
| P3-084 | The crew under it | Landry | What is that? |
| P3-085 |  | Thorne | I don’t know. But whatever’s been in the air since we landed... it’s gone. |
| P3-086 |  | Rhen | They built this to keep something out. |
| P3-087 | Landry kneels at the transmitter; Rhen crosses to her | Rhen | Landry. Tide City. Everything you’ve got. |
| P3-088 |  | Landry | One burst. Maybe. Go. |
| P3-089 | Rhen, kneeling, close *(Bryce’s words)* | Rhen | Tide City Command. This is Captain Rhen of the Pathfinder. |
| P3-090 |  | Rhen | If this reaches you, listen carefully. |
| P3-091 |  | Rhen | We were wrong about the Heralds. |
| P3-092 |  | Rhen | They’re not invading us. They’re running. |
| P3-093 |  | Rhen | We found something here. Something older than them. |
| P3-094 |  | Rhen | Whatever destroyed their civilization, it doesn’t have to happen again. |
| P3-095 |  | Rhen | There was another people here before them. They found a way to hold it back. |
| P3-096 |  | Rhen | We have evidence. We have to get it home. |
| P3-097 | Looking up the shaft: fire in the sky | Landry | Captain. Something’s entering the atmosphere. |
| P3-098 |  | Rhen | Command, do not activate the Spear until we— |
| | The Host fleet over the dome; it flickers and thins; Host troopers walk in through its edge from the desert | | |
| P3-099 | The chamber: they come up the spiral | Marsh | Captain. There’s too many. |
| P3-100 |  | Rhen | ...Weapons down. |
| P3-101 |  | Marsh | Captain— |
| P3-102 |  | Rhen | Down. They want us alive. |
| P3-103 | The officer at the socket, to his troopers; he pulls the object out | Host officer | *Seraveth. Oruun vael.* (subtitle: [Unknown language]; the Host tongue from Site K's intercom, PF-036) |
| P3-103a | | Host officer | You carried it a long way, Captain. It was never yours. |
| | The dome comes apart. On their knees; the transmitter’s light, blinking. Black. *The White City* | | |

## Radio during fights
| ID | Shot | Who | Line |
|---|---|---|---|
| P3-106 | The first store room (both ways round) | Okafor / Thorne | Host! Dug in by that store room! |
| P3-107 |  | Thorne | That’s theirs. They brought it here in pieces. They were here before us. |
| P3-108 |  | Rhen | Then they knew where we were going before we did. |
| P3-109 | West · the Cistern Court | Okafor | Red’s hitting the Host’s store rooms! Both of them, dead ahead! |
| P3-110 | East · the Choir Hall | Thorne | Amber’s holding the hall. Host coming out of the store rooms behind them! |
| P3-111 | West · the Fallen Arch | Okafor | Host gun by the store rooms! Amber’s pinned under it! |
| P3-112 | East · the Signal Mast | Thorne | Host gun at the mast! Red’s throwing themselves at it! |
| P3-113 | The Host depot (both) | Marsh | A whole depot. That’s the last thing between us and the plaza. |
| P3-114 |  | Rhen | Through it. Don’t stop. |
| P3-104 |  | Marsh | Captain’s down! Thorne, get him up! |
| P3-105 |  | Marsh / Thorne | *(name)* is down! Someone get to them! |

## Recovered footage 07 · The Prisoners

Its lines (`C7-001`–`C7-017`) are in `docs/FOOTAGE-SCRIPT.md` with the other six reels and the menu's voices.
