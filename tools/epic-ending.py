#!/usr/bin/env python3
"""Elyra · the prologue's ending cue (Nov 8, Bryce: "when it ends play some parts of the Epic Action").
Builds audio/music/cut-epic-action-ending.mp3 from audio/music/drive-epic-action.mp3: the track's opening four bars (its first
hit lands as the title card comes up) spliced on the bar line into its last bars and natural ending. ~20 s.

Epic Action is ~99.4 bpm: beat 0.604 s, bar 2.415 s, first downbeat at 1.07 s (librosa beat_track).
Run: python3 tools/epic-ending.py      (needs ffmpeg, numpy)
"""
import os, subprocess
import numpy as np

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUS = os.path.join(ROOT, 'audio/music')
SRC = os.path.join(MUS, 'drive-epic-action.mp3')
OUT = os.path.join(MUS, 'cut-epic-action-ending.mp3')

D0, BAR = 1.07, 2.415           # first downbeat, one bar
PRE = 0.10                      # a hair before the first hit, so it isn't clipped
A = (D0 - PRE, D0 + 4 * BAR)    # the opening: four bars
B0 = D0 + 22 * BAR              # bar 22: the last phrase, through the track's own ending
XF = 0.06                       # crossfade at the splice (on the bar line)

r = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
x = np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2).copy()
s = lambda t: int(round(t * SR))

a = x[s(A[0]):s(A[1]) + s(XF)].copy()
b = x[s(B0):].copy()
a[:s(PRE)] *= np.linspace(0, 1, s(PRE))[:, None]               # soft in over the pre-roll
n = s(XF); w = np.linspace(0, 1, n)[:, None]
mid = a[-n:] * np.cos(w * np.pi / 2) + b[:n] * np.sin(w * np.pi / 2)  # equal-power splice
y = np.concatenate([a[:-n], mid, b[n:]])
# trim the silent tail, with a short fade so it doesn't click
e = np.abs(y).max(axis=1); last = np.nonzero(e > 1e-3)[0][-1] + s(0.3); y = y[:last]
y[-s(0.3):] *= np.linspace(1, 0, s(0.3))[:, None]

subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '128k', OUT],
               input=y.astype(np.float32).tobytes(), check=True)
print(f'{OUT}: {len(y) / SR:.1f} s (opening {A[1] - A[0]:.1f} s + ending from {B0:.1f} s)')
