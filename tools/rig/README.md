# Rigging the cast in Mixamo (Nov 8 2026)

Why: the game still bends every Meshy character with a skeleton built in code, and every cutscene pose is a typed shoulder and
elbow angle. A real rig plus Mixamo's clips turns poses into animations, so a scene is fixed once instead of every time a model changes.

The game side is ready: `MODELS.actor()` in `js/shared/models.js` loads `models/chars/rigged/<kind>.glb`, scales and turns it, and
plays its clips (idle → walk → run crossfaded by speed, or `H.actor.play('kneel')` in a cutscene). A kind listed in `RIGGED` (same
file) is dressed that way automatically; nothing changes for a kind that isn't listed.

## Order
1. `keeper-pathfinder` (in the most cutscenes) 2. `michael-hall` 3. `hollow-footsoldier` 4. `hollow-king`

## In Mixamo (mixamo.com, free with an Adobe account)
1. Upload the character: the **PC** file, `models/pc/chars/<kind>.glb`, converted to FBX or OBJ (Mixamo takes FBX/OBJ/ZIP). In
   Blender: File → Import → glTF, then File → Export → FBX (Path Mode: Copy, the little box next to it on, to pack the textures).
2. Place the markers (chin, wrists, elbows, knees, groin). Skeleton LOD: **Standard**.
3. Download the character once **With Skin** (Format FBX Binary, 30 fps, any pose): name it `<kind>.fbx`.
4. For each clip, pick the animation, tick **In Place** where Mixamo offers it, and download **Without Skin**, named by what it is:
   `idle.fbx`, `walk.fbx`, `run.fbx`, `kneel.fbx`, `sit.fbx`, `aim.fbx` (more are fine: `wounded.fbx`, `salute.fbx`...).
5. Send all the FBX files for that character to Claude (or run the next step yourself).

## Merging them (Claude can do this)
    cd tools/rig && npm install
    node rig.mjs keeper-pathfinder keeper-pathfinder.fbx idle.fbx walk.fbx run.fbx kneel.fbx sit.fbx aim.fbx
Then add the kind to `RIGGED` in `js/shared/models.js` and play the scenes it's in.

## The Meshy rule for the next batch (makes Mixamo work first time)
T-pose or arms hanging free of the body, legs apart and nothing fused to them, weapon as its own file, facing the same way as every
other model, feet on the ground, centred.
