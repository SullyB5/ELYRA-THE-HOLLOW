#!/usr/bin/env python3
"""Elyra · score remixes (Nov 4, Bryce's notes). Builds four tracks in audio/music/ from the source MP3s in a folder:

  quiet-bones          Bones of the First Sky's opening (0:00-0:50) and its 2:20-2:50 passage, each extended with beat-aligned loops,
                       then a long fade: the quiet part that sounds like the menu theme
  market-jazz-noir     the jazz noir pushed closer to Bones: ~9% faster (same pitch), a retro drum machine on its own beat grid
                       (kick, gated clap, hats), a darker tape-saturated tone. Still chill, less relaxed
  drive-gritty         a second fight track from Epic Action: tape-slowed 7% (a touch lower and heavier), saturated, darker top,
                       the low end and the lift of the strings kept: gritty, somber, still hopeful
  epic-cinematic-1     the same track with heavy cinematic drums under it (taiko, low toms, a sub boom on the phrase), riding the
                       track's own beat grid and only where the track is up (behind the vocals), never in its quiet passages

Run: python3 tools/score-remix.py SOURCE_DIR      (needs ffmpeg, numpy, librosa)
"""
import sys, os, glob, subprocess, tempfile
import numpy as np, librosa

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUS = os.path.join(ROOT, 'audio/music')
SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
rng = np.random.default_rng(7)

def src(frag): return glob.glob(os.path.join(SRC, '*' + frag + '*.mp3'))[0]
def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path] + (['-af', af] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    r = subprocess.run(cmd, capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2).copy()
def save(y, name, lufs, extra=''):
    with tempfile.NamedTemporaryFile(suffix='.f32') as f:
        y.astype(np.float32).tofile(f.name)
        af = (extra + ',' if extra else '') + 'loudnorm=I=%d:TP=-1.5:LRA=14' % lufs
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', f.name, '-af', af,
                        '-c:a', 'libmp3lame', '-b:a', '96k', os.path.join(MUS, name + '.mp3')], check=True)
    print('%-20s %5.1f s  %4.1f MB' % (name, len(y) / SR, os.path.getsize(os.path.join(MUS, name + '.mp3')) / 1e6))
def beats(y):
    m = librosa.resample(y.mean(1), orig_sr=SR, target_sr=22050)
    _, b = librosa.beat.beat_track(y=m, sr=22050, units='time'); return b
def feat(y):
    m = librosa.resample(y.mean(1), orig_sr=SR, target_sr=22050)
    F = np.vstack([librosa.feature.chroma_stft(y=m, sr=22050, hop_length=512), librosa.feature.mfcc(y=m, sr=22050, hop_length=512, n_mfcc=13) / 40])
    return F / (np.linalg.norm(F, axis=0) + 1e-9)
def xfade(a, b, sec=.12):
    n = int(SR * sec); t = np.linspace(0, np.pi / 2, n)[:, None]
    return np.concatenate([a[:-n], a[-n:] * np.cos(t) + b[:n] * np.sin(t), b[n:]])

def best_loop(y, F, bt, a, b, min_beats=16):
    """the most seamless loop [s,e) with s,e on beats inside [a,b] and a length that is a whole number of 4-beat bars"""
    cand = [i for i, t in enumerate(bt) if a <= t <= b]; best = (-1, None, None); w = int(2.0 * 22050 / 512)
    fr = lambda t: int(t * 22050 / 512)
    for i in cand:
        for j in cand:
            if j - i < min_beats or (j - i) % 4: continue
            fi, fj = fr(bt[i]), fr(bt[j])
            if fj + w >= F.shape[1]: continue
            sc = float((F[:, fi:fi + w] * F[:, fj:fj + w]).sum(0).mean())
            if sc > best[0]: best = (sc, bt[i], bt[j])
    return best

# ---------- drums, synthesized ----------
def env(n, dec): return np.exp(-np.arange(n) / (SR * dec))
def taiko(v=1., f0=120, f1=52, dec=.42, ln=1.2):
    n = int(SR * ln); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / .05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, dec)
    skin = rng.standard_normal(n) * env(n, .03); skin = np.convolve(skin, np.ones(18) / 18, 'same')
    return v * (body * .9 + skin * .5)
def boom(v=1., ln=2.6):
    n = int(SR * ln); t = np.arange(n) / SR; f = 34 + 40 * np.exp(-t / .12)
    return v * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .7)
def kick(v=1.):
    n = int(SR * .45); t = np.arange(n) / SR; f = 48 + 110 * np.exp(-t / .03)
    return v * (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .16) + rng.standard_normal(n) * env(n, .004) * .15)
def clap(v=1.):
    n = int(SR * .5); x = np.zeros(n)
    for k, d in enumerate([0, .011, .022, .034]):
        i = int(d * SR); m = n - i; x[i:] += rng.standard_normal(m) * env(m, .012 if k < 3 else .09) * (1 if k == 3 else .6)
    # band-pass ~1.4 kHz, then a short gated room (the 80s snare)
    x = np.diff(np.concatenate([[0], x])); x = np.convolve(x, np.hanning(14) / 7, 'same')
    room = np.convolve(x, rng.standard_normal(int(SR * .18)) * env(int(SR * .18), .06) * .08)[:n]
    gate = np.ones(n); gate[int(SR * .2):] = np.linspace(1, 0, n - int(SR * .2)) ** 3
    return v * (x + room) * gate
def hat(v=1.):
    n = int(SR * .06); x = np.diff(np.concatenate([[0], rng.standard_normal(n)])); return v * x * env(n, .012)
def put(out, s, t, pan=0., g=1.):
    i = int(t * SR)
    if i >= len(out): return
    m = min(len(s), len(out) - i); L, R = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[i:i + m, 0] += s[:m] * L * g * 1.414; out[i:i + m, 1] += s[:m] * R * g * 1.414
def rms_curve(y, sec=.5):
    h = int(SR * sec); n = len(y) // h; e = np.sqrt((y[:n * h].mean(1).reshape(n, h) ** 2).mean(1) + 1e-12)
    return lambda t: e[min(n - 1, int(t / sec))]

# ---------- 1. quiet-bones ----------
def quiet_bones():
    y = load(src('bones-of-the-first-sky')); F = feat(y); bt = beats(y)
    A = y[:int(50 * SR)]
    sa, s0, e0 = best_loop(y, F, bt, 18, 50)
    sb, s1, e1 = best_loop(y, F, bt, 140, 170)
    print('  intro loop %.2f-%.2f (match %.2f), 2:20 loop %.2f-%.2f (match %.2f)' % (s0, e0, sa, s1, e1, sb))
    seg = lambda a, b: y[int(a * SR):int(b * SR)]
    out = seg(0, e0)
    for _ in range(2): out = xfade(out, seg(s0, e0))
    # into the 2:20 passage on a beat, with a 3 s blend
    b140 = bt[np.argmin(np.abs(bt - 140))]
    out = xfade(out, seg(b140, e1), 3.0)
    for _ in range(2): out = xfade(out, seg(s1, e1))
    # and out: the passage plays on and fades over its last 12 s
    tail = seg(s1, s1 + 18); fade = np.ones(len(tail)); fade[-int(12 * SR):] = np.linspace(1, 0, int(12 * SR)) ** 1.5
    out = xfade(out, tail * fade[:, None])
    save(out, 'quiet-bones', -19)

# ---------- 1b. more from the opening alone (0:00-0:45, Bryce: "is pure") ----------
def bones_intro():
    y = load(src('bones-of-the-first-sky')); F = feat(y); bt = beats(y); seg = lambda a, b: y[int(a * SR):int(b * SR)]
    sc, s0, e0 = best_loop(y, F, bt, 16, 45); print('  opening loop %.2f-%.2f (match %.2f)' % (s0, e0, sc))
    # pure: the opening as written, then its loop round and round, then out the way it came in
    out = seg(0, e0)
    for _ in range(4): out = xfade(out, seg(s0, e0))
    out = xfade(out, seg(s0, s0 + 14) * np.linspace(1, 0, int(14 * SR))[:len(seg(s0, s0 + 14)), None] ** 1.3)
    save(out, 'quiet-bones-opening', -19)
    # deep: the same opening a fifth lower and slower (tape-speed), in a big hall: for night, ice and the Hollow
    d = load(src('bones-of-the-first-sky'), 'atrim=0:45,asetrate=%d,aresample=%d' % (int(SR * .667), SR))
    F2 = feat(d); bt2 = beats(d); sc2, s2, e2 = best_loop(d, F2, bt2, 14, len(d) / SR - 3, 24)
    print('  deep loop %.2f-%.2f (match %.2f)' % (s2, e2, sc2)); sg = lambda a, b: d[int(a * SR):int(b * SR)]
    out = sg(0, e2)
    for _ in range(3): out = xfade(out, sg(s2, e2), .4)
    out = xfade(out, sg(s2, e2) * np.linspace(1, 0, len(sg(s2, e2)))[:, None], .4)
    save(out, 'quiet-bones-deep', -20, 'aecho=0.8:0.6:180|340:0.25|0.15')
    # pulse: the opening with a slow heartbeat kick on its beat and the jazz map's hats, a little more forward (between fights)
    y2 = seg(0, e0)
    for _ in range(3): y2 = xfade(y2, seg(s0, e0))
    b2 = beats(y2); dr = np.zeros_like(y2)
    for i, t in enumerate(b2):
        if t < 15: continue
        if i % 4 == 0: put(dr, kick(.5), t)
        if i % 4 == 2: put(dr, kick(.32), t)
        put(dr, hat(.06), t, .3)
    save(y2 + dr, 'quiet-bones-pulse', -18)

# ---------- 2. jazz noir, pushed toward Bones ----------
def jazz():
    k = 1.09
    y = load(src('jazz-noir'), 'rubberband=tempo=%g' % k); bt = beats(y); lv = rms_curve(y)
    d = np.zeros_like(y); ref = np.percentile([lv(t) for t in bt], 70)
    for i, t in enumerate(bt):
        if t < 9: continue                                    # the track's own intro stays bare
        g = min(1.2, lv(t) / ref) ** 1.2
        if i % 2 == 1: put(d, kick(.55), t, 0, g)
        else: put(d, clap(.32), t, .05, g)
        if i + 1 < len(bt):
            for j in range(2): put(d, hat(.10 if j else .14), t + (bt[i + 1] - t) * j / 2, -.25 + .5 * j, g)
    y = y * .9 + d
    # darker, a little tape: low shelf up, top rolled, soft saturation
    save(y, 'market-jazz-noir', -18, 'bass=g=3:f=90,treble=g=-3:f=7000,asoftclip=type=tanh:threshold=0.8')

# ---------- 3. drive-gritty ----------
def drive():
    y = load(src('bombinsound-epic-action'), 'asetrate=%d,aresample=%d' % (int(SR * .93), SR))
    save(y, 'drive-gritty', -16, 'bass=g=4:f=70,equalizer=f=2500:t=q:w=1:g=-2,treble=g=-4:f=8000,'
                                  'acompressor=threshold=0.25:ratio=4:attack=8:release=120:makeup=2,asoftclip=type=atan:threshold=0.6:output=0.9,'
                                  'aecho=0.8:0.5:60|110:0.18|0.1')

# ---------- 4. epic-cinematic-1 with heavy drums ----------
def epic():
    y = load(src('cinematic-epic-sound-001')); bt = beats(y); lv = rms_curve(y, 1.0)
    vals = np.array([lv(t) for t in bt]); lo, hi = np.percentile(vals, 35), np.percentile(vals, 85)
    d = np.zeros_like(y)
    for i, t in enumerate(bt):
        g = np.clip((lv(t) - lo) / (hi - lo), 0, 1.15)
        if g <= .05: continue
        p = (i - 2) % 16                                       # the track's strongest low beat starts the pattern
        if p in (0, 6, 10): put(d, taiko(.9 if p == 0 else .7), t, 0, g)
        if p in (3, 13): put(d, taiko(.5, 160, 70, .3), t, -.35, g)
        if p in (12, 14, 15): put(d, taiko(.45, 190, 85, .25), t, .35, g)
        if p == 0 and (i - 2) % 32 == 0: put(d, boom(.8), t, 0, g)
    # a big hall on the drums so they sit behind, not on top
    ir = rng.standard_normal(int(SR * 2.2)) * env(int(SR * 2.2), .45) * .02
    for c in range(2): d[:, c] = d[:, c] * .85 + np.convolve(d[:, c], ir)[:len(d)]
    save(y + d * .8, 'epic-cinematic-1', -16)

if __name__ == '__main__':
    for f in (sys.argv[2:] or ['quiet_bones', 'bones_intro', 'jazz', 'drive', 'epic']): globals()[f]()
