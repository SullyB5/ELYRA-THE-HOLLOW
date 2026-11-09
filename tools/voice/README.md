# ELYRA voices

Every spoken line in the game is a recorded clip in `audio/voice/` (`<id>.mp3`), listed in `audio/voice/index.json` as
`"speaker|delivery|text": [id, seconds]`. Deliveries: `''` normal, `a` combat (alert/sharp), `t` tired, `w` whisper,
`s` soft, `h` ELYRA signal-degraded, `e`/`e2` Rhen's voice out of the cave. Playback: `js/shared/voice-files.js`.

The cast was locked by Bryce on Nov 8 2026 over three audition rounds; it lives in `CAST` in `render_all.py`
(Kokoro v1.0 voices, blended, pitched and filtered per character).

## Adding or changing lines

1. `python3 extract.py <repo>` pulls every line out of `js/` (speaker literals, ternary branches, pick() pools,
   shorthand speakers) into `lines2.json`.
2. `python3 expand.py` fills the variable parts (carrier names, compass points, counts) and writes `render_list.json`.
   A new variable line needs its values added in `vals()`.
3. `python3 render_all.py 0 1` renders whatever clips are missing (needs `pip install kokoro-onnx soundfile`, ffmpeg,
   and `kokoro-v1.0.onnx` + `voices-v1.0.bin` from github.com/thewh1teagle/kokoro-onnx releases, model-files-v1.0).
4. `python3 build_index.py` copies the clips into `audio/voice/` and rewrites `index.json`.

Paths at the top of each script point at the working folder they were first run in; adjust them to yours.
A line the game speaks with no clip shows its subtitle only and is logged: `VOICEFILES.missed` in the console.
