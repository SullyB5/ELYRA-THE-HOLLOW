# The Last Signal · script

Last Transmission · Level 05 · 13.03.2237. Every spoken line, in the order it plays, with an ID (`LS-001`…) so recorded files can be named by it (`LS-014.mp3`).

Everything is **Claude's draft for Bryce to rewrite**, except the final scene in the dropship, which is **Bryce's, word for word** (the v3.1 level brief). Lines that only play in one branch (a squadmate down, a turret warning) are included where they live in the code. Code: `js/signal/` (`02-story.js` the play, `03-air.js` the flight, `04-scenes.js` the cutscenes).

The two crew in the cells speak as **"Pathfinder crew"**: which of Marsh, Okafor, Thorne and Landry survived is still open (v3.1). Name them in `CREW_NAMES` (js/signal/02-story.js) and the radio uses the names.

## The opening (cutscene)

- `LS-001` **ELYRA:** Lieutenant. Part of the Pathfinder’s last transmission isn’t a recording. It’s still going out. Now.
- `LS-002` **Lt. Michael:** From where?
- `LS-003` **ELYRA:** Elyra’s southern mountains. A valley Command has no name for.
- `LS-004` **Elias Veyr:** One interceptor, Michael. No noise. If it’s them, bring them home. If it isn’t, come home anyway.
- `LS-005` **Lt. Michael:** Understood, Master.

## Down on the pad (cutscene)

- `LS-006` **Lt. Michael:** ELYRA, I’m down.
- `LS-007` **ELYRA:** I have you. The facility runs back over the summit and down into the peak. The signal is coming from that mast, on the very top.
- `LS-008` **Lt. Michael:** Then I go through it.

## The valley (flight)

- `LS-009` **ELYRA:** Lieutenant! Hull failure, eject, eject!
- `LS-010` **ELYRA:** Terrain! Pull up, Lieutenant!
- `LS-011` **ELYRA:** Lieutenant, you’re climbing out of the valley. Their sensors on that peak are looking for anything up high. Stay low, stay in it.
- `LS-012` **ELYRA:** Signal holding, Lieutenant. It’s coming from the head of this valley. Thirty kilometres south of the mountain.
- `LS-013` **Lt. Michael:** Is it them?
- `LS-014` **ELYRA:** Voice match: Captain A. Rhen. But the recording is older than the carrier it rides on. Someone is broadcasting it again, now.
- `LS-015` **Lt. Michael:** Or he is.
- `LS-016` **ELYRA:** Two contacts! Host fighters, coming off the ridge!
- `LS-017` **Lt. Michael:** So much for quiet.
- `LS-018` **ELYRA:** Clear. They didn’t call it in, as far as I can hear. Keep going.
- `LS-019` **ELYRA:** The signal is strengthening. Lieutenant, there are words under the static now.
- `LS-020` **Captain Rhen (signal):** …Tide City… this is Pathfinder… if anyone hears this… don’t…
- `LS-021` **ELYRA:** The same eleven seconds, over and over. And something else on the carrier I can’t read.
- `LS-022` **ELYRA:** Three more! One of them is behind you!
- `LS-023` **ELYRA:** That’s the last of them. Lieutenant… the peak ahead. Something built right over the top of it. A landing pad on its shoulder, lights off.
- `LS-024` **Lt. Michael:** A transfer station. On top of the mountain.

## The summit, the facility, the cells, the vault, the peak (play and in-level cutscenes)

- `LS-025` **Captain Rhen:** Hall’s down! Get him up!
- `LS-026` **ELYRA:** Lieutenant! Your vitals are failing. Get up. Get up.
- `LS-027` **ELYRA:** Captain Rhen is down. He has the device, Lieutenant. Get to him.
- `LS-028` **ELYRA:** Host on the ledge. Behind the barricade.
- `LS-029` **ELYRA:** A gun on the cliff side. Rifles won’t crack it, Lieutenant. The Breaker will.
- `LS-030` **ELYRA:** Dropship. They know someone’s on the shelf.
- `LS-031` **ELYRA:** The outer yard. Host behind the barricades.
- `LS-032` **ELYRA:** Riflemen up on the terraces, and a wall gun. Keep to cover.
- `LS-033` **ELYRA:** They’re holding the gate.
- `LS-034` **Lt. Michael:** Inside. A guard room.
- `LS-035` **ELYRA:** The corridor turns north here. Host in the room.
- `LS-036` **ELYRA:** Cells, under the galleries, both sides. Riflemen up on the walkways.
- `LS-037` **ELYRA:** More on the walkways. The live cells are at the far end. I can hear heartbeats.
- `LS-038` **ELYRA:** Lock’s open. The gate is moving.
- `LS-039` **Pathfinder crew:** Do you hear that?
- `LS-040` **Lt. Michael:** Voices. Like under the mountain.
- `LS-041` **Captain Rhen:** Don’t answer them. Whatever they say. Keep walking.
- `LS-042` **ELYRA:** Lieutenant, my readings of this corridor don’t agree with each other. The walls are where they should be. The distances aren’t.
- `LS-043` **ELYRA:** Thermal signatures inside the rock. Dozens of them. Some of them are human, Lieutenant.
- `LS-044` **Lt. Michael:** Then that’s where I’m going.
- `LS-045` **ELYRA:** You’re in. Security halls. Quietly, if you can.
- `LS-046` **ELYRA:** The gate’s locked from that guard post. Left side. I can walk you through the override.
- `LS-047` **ELYRA:** Lieutenant. Your right. Behind the glass.
- `LS-048` **Lt. Michael:** Prisoners. They’re putting them on a transport.
- `LS-049` **ELYRA:** Human, all of them. The transport is spun up. They mean to move tonight.
- `LS-050` **Pathfinder (stolen radio):** …Keeper channel… is that a Keeper on the pad? Interceptor Wing transponder…
- `LS-051` **Pathfinder (stolen radio):** …Hall? Lieutenant Michael Hall?
- `LS-052` **Lt. Michael:** Who is this?
- `LS-053` **Pathfinder (stolen radio):** Pathfinder. What’s left of us. Cell block, north of you, past the halls. They move us at first light. Hurry.
- `LS-054` **Lt. Michael:** Hold on. I’m coming.
- `LS-055` **ELYRA:** The three cells at the far end, Lieutenant. The rest are empty.
- `LS-056` **Captain Rhen:** They took the device off us at the White City. It isn’t going on that transport.
- `LS-057` **Lt. Michael:** Where is it?
- `LS-058` **Captain Rhen:** A vault, at the bottom of this place, behind a field. They kept us close to it. I could feel it through the floor.
- `LS-059` **Lt. Michael:** Then we take it back.
- `LS-060` **Captain Rhen:** We take it back.
- `LS-061` **Pathfinder crew:** Behind us! They’re coming down the wing!
- `LS-062` **Captain Rhen:** Contact, round the corner!
- `LS-063` **Pathfinder crew:** Doors are sealing behind us! Only way is up!
- `LS-064` **Captain Rhen:** Floor guns! Breaker on them!
- `LS-065` **ELYRA:** Lieutenant, every system in the facility just woke up. I’ve called the dropship. Mercy is four minutes out. I told her two.
- `LS-066` **Dropship Mercy:** Mercy, inbound. Give me somewhere flat, Lieutenant, and keep it clear.
- `LS-067` **Dropship Mercy:** Ramp’s down! Get on, get on!
- `LS-068` **Dropship Mercy:** I see your beacon, Lieutenant. A minute out, a little more. There’s a Host gunship circling that peak with you.
- `LS-069` **Captain Rhen:** More of them, up the ramp!
- `LS-070` **Pathfinder crew:** Captain, I’m nearly dry!
- `LS-071` **Dropship Mercy:** I can’t take that gunship on, Lieutenant. I’m coming in under it.
- `LS-072` **Dropship Mercy:** Thirty seconds! Hold that pad!
- `LS-073` **Captain Rhen:** It’s getting warm on my back, Hall. Whatever it is, it wants to leave too.
- `LS-074` **Captain Rhen:** Good hit! She’s still up, but that rattled her!
- `LS-075` **Dropship Mercy:** Keep it up, Lieutenant. Every time you hit her she stops shooting at you.
- `LS-076` **Captain Rhen:** This is it. They brought us past this door on the way down.
- `LS-077` **Lt. Michael:** The voices… they’re louder here.
- `LS-078` **Captain Rhen:** There. We carried it off a dead moon and across half of Astraea. They took it off us in an hour.
- `LS-079` **Lt. Michael:** What is it?
- `LS-080` **Captain Rhen:** I don’t know. I know what it did over the White City.
- `LS-081` **ELYRA:** Three emitters are holding that field, Lieutenant. Shut them down and it fails.
- `LS-082` **Lt. Michael:** Then we shut them down.
- `LS-083` **Captain Rhen:** North door! They’re coming through!
- `LS-084` **Captain Rhen:** That’s the last one! The field’s going down!
- `LS-085` **Pathfinder crew:** More of them! Hold the vault!
- `LS-086` **Captain Rhen:** Not while that field’s up, Hall. The emitters first.
- `LS-087` **ELYRA:** Room’s clear. Three emitters. Shut them down.
- `LS-088` **ELYRA:** The field is down to nothing, Lieutenant. It’s just hanging there.
- `LS-089` **Lt. Michael:** It’s… quiet.
- `LS-090` **Captain Rhen:** It does that.
- `LS-091` **Lt. Michael:** The voices are gone. All of them.
- `LS-092` **Captain Rhen:** Not gone. Smaller. It won’t stop a bullet, Hall. Remember that.
- `LS-093` **Host speaker:** Seraveth. Oruun kael sera. Seraveth vael.
- `LS-094` **Captain Rhen:** Now they know.
- `LS-095` **Captain Rhen:** Open air. Thank God.
- `LS-096` **ELYRA:** Lieutenant. Something big, climbing up the side of the mountain.
- `LS-097` **Lt. Michael:** Mercy, the pad’s hot! There’s a Host gunship on it! Come in from the east, low and fast!
- `LS-098` **Dropship Mercy:** Copy. A minute, a little more. Keep them off that pad.

## Rhen's cell (cutscene)

- `LS-099` **Captain Rhen:** Interceptor Wing.
- `LS-100` **Lt. Michael:** Lieutenant Hall, Captain. I followed your signal.
- `LS-101` **Captain Rhen:** Then it’s still going out.
- `LS-102` **Captain Rhen:** Good.
- `LS-103` **Captain Rhen:** Two more of mine, down the row. Get them out. I’ll take a rifle off one of these.

## The Last Transmission: the dropship (cutscene) · Bryce's words

- `LS-104` **Lt. Michael:** I heard your voice beneath the mountain.
- `LS-105` **Captain Rhen:** Then you heard the warning.
- `LS-106` **Lt. Michael:** I heard you calling my name.
- `LS-107` **Captain Rhen:** I heard it too. Before I knew who you were.
- `LS-108` **Lt. Michael:** What did you find on Astraea?
- `LS-109` **Captain Rhen:** A civilization that destroyed itself trying to fight something it didn’t understand.
- `LS-110` **Lt. Michael:** The Heralds?
- `LS-111` **Captain Rhen:** No. The people who came before them.
- `LS-112` **Captain Rhen:** We didn’t bring back a weapon, Lieutenant.
- `LS-113` **Lt. Michael:** Then what is it?
- `LS-114` **Captain Rhen:** A chance.
- `LS-115` **ELYRA:** Lieutenant Hall. Coordinates recovered from the Pathfinder’s original transmission. Destination: Astraea.
