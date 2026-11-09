#!/usr/bin/env python3
"""Elyra · the darker in-level score (Nov 9, Bryce: "darker and deeper music on the Pathfinder mission and throughout the game;
the calm relaxing music is saved for the menu and Tide City; the first level wasn't bad but needs to be more intense; all the
other levels need to be more energetic or dark and deep, not happy and calm").

Built from the game's own tracks, nothing new downloaded:
  dark-bones-abyss   quiet-bones-deep tape-slowed two semitones lower and darker, its own low end doubled under it, and a slow
                     heartbeat (lub-dub) on its beat grid: the between-fights music on every level, deep and uneasy
  dark-bones-pulse   Bones' original sound with its drums taken out and its top darkened, over a driving low pulse (taiko on the
                     beat, low ghost hits on the eighths, a tom run into every eighth bar) and a ticking 16th: tense and moving
                     without being a fight. Site K's quiet part, and in the rotation everywhere else
  awe-bones-dark     Bones of the First Sky itself two semitones down (top kept clear, not muffled), a sub swell and a taiko on each bar where the
                     song is up: the level cutscenes' "awe" and "calm" moods (the original stays the menu's)
Run: python3 tools/dark-score.py        (needs ffmpeg, numpy, scipy, librosa)
"""
import os, subprocess, tempfile
import numpy as np, librosa
from scipy.signal import butter, sosfiltfilt

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUS = os.path.join(ROOT, 'audio/music')
rng = np.random.default_rng(9)

def load(name, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', os.path.join(MUS, name + '.mp3')] + (['-af', af] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).copy()
def save(y, name, lufs, extra=''):
    with tempfile.NamedTemporaryFile(suffix='.f32') as f:
        y.astype(np.float32).tofile(f.name)
        af = (extra + ',' if extra else '') + 'loudnorm=I=%d:TP=-1.5:LRA=14,alimiter=limit=0.84:level=false' % lufs
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', f.name, '-af', af,
                        '-c:a', 'libmp3lame', '-b:a', '96k', os.path.join(MUS, name + '.mp3')], check=True)
    print('%-18s %d:%02d  %4.1f MB' % (name, len(y) / SR // 60, len(y) / SR % 60, os.path.getsize(os.path.join(MUS, name + '.mp3')) / 1e6))
def lp(x, f, o=4): return sosfiltfilt(butter(o, f, 'low', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def hp(x, f, o=4): return sosfiltfilt(butter(o, f, 'high', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def bp(x, a, b, o=2): return sosfiltfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def tape(semis): r = 2 ** (semis / 12); return 'asetrate=%d,aresample=%d' % (int(SR * r), SR)   # lower and slower together, like tape
def rms(x): return float(np.sqrt(np.mean(x ** 2)) + 1e-9)

def beats(y):
    m = librosa.resample(y.mean(1), orig_sr=SR, target_sr=22050)
    tempo, b = librosa.beat.beat_track(y=m, sr=22050, units='time')
    b = np.asarray(b) * SR
    return float(np.atleast_1d(tempo)[0]), b.astype(int)
def harmonic(y):
    out = []
    for c in range(2):
        S = librosa.stft(y[:, c], n_fft=4096, hop_length=1024)
        H, _ = librosa.decompose.hpss(S, margin=2.0)
        out.append(librosa.istft(H, hop_length=1024, length=len(y)))
    return np.stack(out, 1).astype(np.float32)

# ---------- drums, synthesized ----------
def hit(f0, f1, dec, v, noise=.35, nlp=600, n=None):
    n = n or int(SR * (dec * 5 + .05)); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / .07); ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / dec)
    nz = rng.standard_normal(n) * np.exp(-t / .03); nz = sosfiltfilt(butter(2, nlp, 'low', fs=SR, output='sos'), nz)
    x = (body + noise * nz) * v; x[:64] *= np.linspace(0, 1, 64)
    return np.stack([x, x], 1).astype(np.float32)
def tick(v):
    n = int(SR * .05); t = np.arange(n) / SR
    x = rng.standard_normal(n) * np.exp(-t / .008); x = sosfiltfilt(butter(2, [5000, 9000], 'band', fs=SR, output='sos'), x) * v
    return np.stack([x * .8, x], 1).astype(np.float32)
def place(buf, x, at, pan=0.):
    at = int(at)
    if at < 0 or at >= len(buf): return
    e = min(len(buf), at + len(x)); seg = x[:e - at].copy()
    if pan: seg[:, 0] *= 1 - max(0, pan); seg[:, 1] *= 1 + min(0, pan)
    buf[at:e] += seg
def grid(b):
    """eighth-note grid between the beats librosa found"""
    g = []
    for i in range(len(b) - 1): g += [b[i], (b[i] + b[i + 1]) // 2]
    return np.array(g + [b[-1]])
def env_at(y, at, win=SR):
    a = max(0, int(at) - win // 2); return rms(y[a:a + win])

# ---------- dark-bones-abyss ----------
def abyss():
    y = load('quiet-bones-deep', tape(-2))
    y = lp(y, 3000) + lp(y, 140, 2) * .8                         # darker top, its own low end doubled (not so much a phone loses it)
    y = np.tanh(y * 1.4) / 1.4                                   # a little weight
    tempo, b = beats(y); print('  abyss tempo %.0f, %d beats' % (tempo, len(b)))
    d = np.zeros_like(y); ref = rms(y)
    lub, dub = hit(70, 38, .22, .55, .25, 300), hit(62, 34, .18, .35, .2, 260)
    gap = int(np.median(np.diff(b)) * .32) if len(b) > 2 else int(SR * .25)
    for i, at in enumerate(b):
        if i % 2: continue                                        # a heartbeat every other beat: slow, under it all
        k = min(1.2, env_at(y, at) / ref)
        if i % 32 >= 28: k *= .3                                  # it drops away now and then, so the silence lands
        place(d, lub * k, at); place(d, dub * k, at + gap)
    y = y + lp(d, 900)
    fade = int(SR * 4); y[:fade] *= np.linspace(0, 1, fade)[:, None]; y[-fade * 2:] *= np.linspace(1, 0, fade * 2)[:, None]
    save(y, 'dark-bones-abyss', -20, 'aecho=0.8:0.6:240|470:0.22|0.12')

# ---------- dark-bones-pulse ----------
def pulse():
    y = load('quiet-bones', tape(-1))
    tempo, b = beats(y); print('  pulse tempo %.0f, %d beats' % (tempo, len(b)))   # the grid from the song as it is
    y = harmonic(y)                                               # then Bones' own drums out
    y = lp(y, 3200) + lp(y, 160, 2) * 1.2
    g = grid(b); d = np.zeros_like(y); t16 = np.zeros_like(y); ref = rms(y)
    taiko, ghost, tom = hit(95, 46, .3, .9, .45, 700), hit(80, 50, .12, .28, .3, 500), hit(140, 80, .18, .45, .4, 900)
    start = int(SR * 12)                                          # the pulse waits ~12 s, then builds in over 16 s
    for i, at in enumerate(g):
        if at < start: continue
        k = min(1., (at - start) / (SR * 16)); beat = i // 2; bar = beat // 4
        if bar % 16 == 15 and beat % 4 >= 2: continue             # a breath at the end of every 16 bars
        if i % 2 == 0 and beat % 2 == 0: place(d, taiko * k, at)
        elif i % 2 == 0: place(d, ghost * 1.6 * k, at)
        else: place(d, ghost * k, at)
        if bar % 8 == 7 and beat % 4 == 3:                        # a low tom run into the next phrase
            st = (g[min(i + 1, len(g) - 1)] - at) // 2 or 1
            for j in range(4): place(d, tom * k * (.6 + .12 * j), at + j * st // 2, (-.3, .3)[j % 2])
        if i + 1 < len(g):                                        # the ticking 16ths, quiet, panned a touch
            h = (g[i + 1] - at) // 2
            place(t16, tick(.05 * k), at, -.2); place(t16, tick(.03 * k), at + h, .2)
    y = y + lp(d, 1400) * (ref / .12) + t16 * (ref / .12)
    y = np.tanh(y * 1.2) / 1.2
    fade = int(SR * 3); y[:fade] *= np.linspace(0, 1, fade)[:, None]; y[-fade * 2:] *= np.linspace(1, 0, fade * 2)[:, None]
    save(y, 'dark-bones-pulse', -19)

# ---------- awe-bones-dark ----------
def awe_dark():
    y = load('awe-bones-of-the-first-sky', tape(-2))
    y = lp(y, 9000, 2) + lp(y, 120, 2) * .7                     # (Nov 9, Bryce: too muffled) the top kept open, just a touch of weight
    tempo, b = beats(y); print('  awe tempo %.0f, %d beats' % (tempo, len(b)))
    d = np.zeros_like(y); ref = rms(y)
    taiko, sub = hit(85, 40, .4, 1.0, .4, 600), hit(48, 30, .9, .7, .05, 200)
    for i, at in enumerate(b):
        if i % 4: continue
        k = env_at(y, at, SR * 2) / ref
        if k < .9: continue                                       # only where the song is up
        place(d, taiko * min(1.3, k), at)
        if i % 16 == 0: place(d, sub * min(1.3, k), at)
    y = y + lp(d, 1000) * (ref / .12)
    y = np.tanh(y * 1.1) / 1.1
    save(y, 'awe-bones-dark', -19, 'aecho=0.8:0.5:200|390:0.12|0.06')

if __name__ == '__main__':
    import sys
    for k in (sys.argv[1:] or ['abyss', 'pulse', 'awe_dark']): globals()[k]()
