#!/usr/bin/env python3
"""Elyra · quiet Bones tracks that don't audibly repeat (Nov 7, Bryce: "I can hear it repeat").

Everything comes from Bones of the First Sky alone. Instead of looping one passage, each track:
  - cuts the song into 4-beat bars on its own beat grid and walks through them, carrying on naturally most of the time and
    jumping only where two bars sound near-identical; no three-bar run plays twice, and each bar is used sparingly
  - draws on four parts of the song: the opening (0:00-0:55), the 2:20 passage, the ending (3:20), and the busy middle
    (1:00-2:15) with its drums taken out and its top darkened, so there's new melody at the same quiet level
  - gives each section its own treatment (as is, drumless, warm, distant, high shimmer) so a returning bar sounds different
  - lays an always-changing pad underneath: chords from the song frozen and stretched (paulstretch), drifting from one to the next
  - ends on the song's own ending instead of a fade
Run: python3 tools/bones-evolve.py audio/music/awe-bones-of-the-first-sky.mp3 audio/music [track ...]     tracks: quiet_bones transmission drift deep
"""
import sys, os, subprocess, tempfile
import numpy as np, librosa
from scipy.signal import fftconvolve, butter, sosfiltfilt

SR = 44100
SRC, OUT = sys.argv[1], sys.argv[2]

def ff(path_or_arr, af):
    """run an ffmpeg filter over a file or a stereo array, return a stereo float array"""
    if isinstance(path_or_arr, str):
        cmd = ['ffmpeg', '-v', 'error', '-i', path_or_arr]; tmp = None
    else:
        tmp = tempfile.NamedTemporaryFile(suffix='.f32', delete=False); path_or_arr.astype(np.float32).tofile(tmp.name); tmp.close()
        cmd = ['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', tmp.name]
    cmd += (['-af', af] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    r = subprocess.run(cmd, capture_output=True, check=True)
    if tmp: os.unlink(tmp.name)
    return np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2).copy()

def save(y, name, lufs, extra=''):
    with tempfile.NamedTemporaryFile(suffix='.f32') as f:
        y.astype(np.float32).tofile(f.name)
        af = (extra + ',' if extra else '') + 'loudnorm=I=%d:TP=-1.5:LRA=14,alimiter=limit=0.84:level=false' % lufs
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', f.name, '-af', af,
                        '-c:a', 'libmp3lame', '-b:a', '96k', os.path.join(OUT, name + '.mp3')], check=True)
    if JUMPS: print('  jumps: %d, match min %.2f median %.2f' % (len(JUMPS), min(JUMPS), np.median(JUMPS))); JUMPS.clear()
    print('%-26s %d:%02d  %4.1f MB' % (name, len(y) / SR // 60, len(y) / SR % 60, os.path.getsize(os.path.join(OUT, name + '.mp3')) / 1e6))

def fit(x, n):
    return x[:n] if len(x) >= n else np.concatenate([x, np.zeros((n - len(x), 2), np.float32)])
def lp(x, f, o=4): return sosfiltfilt(butter(o, f, 'low', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def hp(x, f, o=4): return sosfiltfilt(butter(o, f, 'high', fs=SR, output='sos'), x, axis=0).astype(np.float32)
def hall(x, sec=3.2, dec=.9, wet=.35, seed=1):
    r = np.random.default_rng(seed); n = int(SR * sec); e = np.exp(-np.arange(n) / (SR * dec / 3))
    ir = r.standard_normal((n, 2)) * e[:, None]; ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum(0))
    w = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return (x * (1 - wet) + w * wet * 1.4).astype(np.float32)

def harmonic(y):
    out = []
    for c in range(2):
        S = librosa.stft(y[:, c], n_fft=4096, hop_length=1024)
        H, _ = librosa.decompose.hpss(S, margin=2.0)
        out.append(librosa.istft(H, hop_length=1024, length=len(y)))
    return np.stack(out, 1).astype(np.float32)

def paulstretch(x, stretch, win=1.0, seed=0):
    """the classic paulstretch: windowed FFT frames, phases randomised, overlap-added at a slower hop"""
    r = np.random.default_rng(seed); N = int(SR * win) // 2 * 2; w = np.hanning(N) ** 1.0
    hop_out = N // 4; hop_in = hop_out / stretch; n_out = int(len(x) * stretch) + N
    out = np.zeros((n_out, 2)); pos = 0.0; k = 0
    while int(pos) + N < len(x):
        fr = x[int(pos):int(pos) + N] * w[:, None]; F = np.abs(np.fft.rfft(fr, axis=0))
        ph = np.exp(2j * np.pi * r.random(F.shape)); g = np.fft.irfft(F * ph, n=N, axis=0) * w[:, None]
        out[k * hop_out:k * hop_out + N] += g; pos += hop_in; k += 1
    return (out[:k * hop_out] / (np.abs(out).max() + 1e-9)).astype(np.float32)

_BT = []
def orig_beats():
    if not len(_BT):
        m = librosa.resample(ff(SRC, None).mean(1), orig_sr=SR, target_sr=22050)
        _BT.append(librosa.beat.beat_track(y=m, sr=22050, units='time')[1])
    return _BT[0]

class Song:
    """the (already transformed) source, its variants on the same timeline, its bars, and bar-to-bar similarity"""
    def __init__(self, y, scale=1.0):
        self.y, self.scale = y, scale
        m = librosa.resample(y.mean(1), orig_sr=SR, target_sr=22050)
        bt = orig_beats() * scale          # the original's beat grid, stretched with the track (tempo changes are uniform)
        self.bars = [(bt[i], bt[i + 4]) for i in range(0, len(bt) - 4, 4)]
        F = np.vstack([librosa.feature.chroma_cqt(y=m, sr=22050, hop_length=512),
                       librosa.feature.mfcc(y=m, sr=22050, hop_length=512, n_mfcc=13) / 40])
        F /= np.linalg.norm(F, axis=0) + 1e-9
        w = int(1.6 * 22050 / 512); fr = lambda t: min(F.shape[1] - w - 1, int(t * 22050 / 512))
        V = np.stack([F[:, fr(a):fr(a) + w].reshape(-1) for a, _ in self.bars]); V /= np.linalg.norm(V, axis=1, keepdims=True)
        self.S = V @ V.T
        print('  %d bars, bar %.2f s' % (len(self.bars), np.median([b - a for a, b in self.bars])))
        H = harmonic(y)
        sh = hp(ff(H, 'rubberband=pitch=2.0'), 1200)
        self.var = {
            'orig': y,
            'harm': H,
            'warm': lp(H, 1700) * 1.15,
            'air': H + fit(sh, len(H)) * .22,
            'distant': hall(lp(H, 1100), 4.0, 1.2, .55) * .7,
            'mid': hall(lp(H, 1500), 3.2, 1.0, .4) * .8,
        }
        self.H = H

    def region(self, a, b):
        a, b = a * self.scale, b * self.scale
        return [i for i, (s, e) in enumerate(self.bars) if s >= a - .05 and e <= b + .05]

JUMPS = []
def walk(song, reg, n, rng, used, grams, start=None, straight=False, p_jump=.22):
    """n bars through region reg. Mostly the song carries on as written; now and then (only after a run of at least 2 bars) it jumps
    to a bar that sounds near-identical to what would have come next, so phrases stay whole but the order is new. No 3-bar run is
    repeated, and worn bars are avoided."""
    regs = sorted(reg); reg = set(reg)
    if start is None:
        fresh = sorted(regs[2:], key=lambda j: (used.get(j, 0), rng.random()))[:max(3, len(regs) // 3)]; start = int(rng.choice(fresh))
    seq = [start]; run = 1
    while len(seq) < n:
        i = seq[-1]; nxt = i + 1
        cont_ok = nxt in reg and (len(seq) < 2 or (seq[-2], i, nxt) not in grams)
        want_jump = (not straight) and run >= 2 and rng.random() < p_jump
        if cont_ok and not want_jump:
            j = nxt
        else:
            ref = min(nxt, len(song.bars) - 1)
            c = [(j, song.S[ref, j] - .1 * used.get(j, 0)) for j in regs
                 if abs(j - nxt) >= 3 and j != i and j not in seq[-8:] and (len(seq) < 2 or (seq[-2], i, j) not in grams)]
            c.sort(key=lambda x: -x[1]); c = c[:4]
            if not c or (cont_ok and c[0][1] < .8): j = nxt if cont_ok else regs[0]
            else:
                w = np.exp((np.array([x[1] for x in c], np.float64) - c[0][1]) * 40); j = c[rng.choice(len(c), p=w / w.sum())][0]
        if j != i + 1: JUMPS.append(float(song.S[min(nxt, len(song.bars) - 1), j]))
        run = run + 1 if j == i + 1 else 1
        if len(seq) >= 2: grams.add((seq[-2], i, j))
        seq.append(int(j))
    for j in seq: used[j] = used.get(j, 0) + 1
    return seq

def render(song, seq, variant, ext):
    """bars to audio; contiguous runs stay continuous, cuts get a short equal-power blend centred on the beat"""
    y = song.var[variant]; runs = []; r = [seq[0]]
    for j in seq[1:]:
        if j == r[-1] + 1: r.append(j)
        else: runs.append(r); r = [j]
    runs.append(r)
    xf = int(.09 * SR); out = None
    for r in runs:
        a, b = int(song.bars[r[0]][0] * SR), int(song.bars[r[-1]][1] * SR)
        seg = y[max(0, a - xf // 2):b + xf // 2].copy()
        if out is None: out = seg; continue
        t = np.linspace(0, np.pi / 2, xf)[:, None]
        out = np.concatenate([out[:-xf], out[-xf:] * np.cos(t) + seg[:xf] * np.sin(t), seg[xf:]])
    tail_b = int(song.bars[seq[-1]][1] * SR)   # a little run-on past the last bar, for the blend into the next section
    out = np.concatenate([out, y[tail_b + xf // 2:tail_b + xf // 2 + ext]])
    return out

def pad_bed(song, regs, length, rng, stretch=7.0):
    """the pad: two-second grabs of the song's own chords, frozen and stretched, blending one into the next, never the same twice"""
    pool = sorted(set(i for r in regs for i in r)); out = np.zeros((length, 2), np.float32); t = 0; k = 0
    while t < length:
        i = rng.choice(pool); a = int(song.bars[i][0] * SR); g = paulstretch(lp(song.H[a:a + int(2.2 * SR)], 3000), stretch, 1.2, seed=k)
        L = len(g); env = np.sin(np.linspace(0, np.pi, L)) ** 1.5; g = g * env[:, None]
        m = min(L, length - t); out[t:t + m] += g[:m]; t += int(L * .5); k += 1
    return out

def build(song, plan, rng, pad_regs, pad_lvl=.09, pad_curve=None):
    used, grams = {}, set(); secs = []
    for p in plan:
        reg = song.region(*p['r'])
        if p.get('tail'):
            a = int(p['r'][0] * song.scale * SR); xf = int(.09 * SR); seg = song.var[p['v']][a - xf // 2:]
            print('   %-8s %-7s raw %.1f s to the end' % (p['r'], p['v'], len(seg) / SR)); secs.append((seg, p)); continue
        elif p.get('from_start'):
            seq = list(reg[:p['n']])
            for j in seq: used[j] = used.get(j, 0) + 1
            grams.update(zip(seq, seq[1:], seq[2:]))
        else: seq = walk(song, reg, p['n'], rng, used, grams)
        print('   %-8s %-7s %s' % (p['r'], p['v'], ' '.join(str(j) for j in seq)))
        secs.append((render(song, seq, p['v'], int(SR * p.get('xf', 2.5))), p))
    out = secs[0][0] * secs[0][1].get('g', 1.)
    for seg, p in secs[1:]:
        n = int(SR * p.get('xf', 2.5)); seg = seg * p.get('g', 1.); prev_ext = n
        t = np.linspace(0, np.pi / 2, n)[:, None]
        out = np.concatenate([out[:-n], out[-n:] * np.cos(t) + seg[:n] * np.sin(t), seg[n:]])
    bed = pad_bed(song, [song.region(*r) for r in pad_regs], len(out), rng)
    curve = np.ones(len(out)) if pad_curve is None else pad_curve(len(out))
    fade = np.minimum(1, np.arange(len(out)) / (SR * 20))      # the pad creeps in after the pure opening
    out = out + bed * (pad_lvl * curve * fade)[:, None]
    # trim the song's trailing silence, then a short tail so the last note rings out
    e = np.sqrt(np.convolve(out.mean(1) ** 2, np.ones(4410) / 4410, 'same')); last = np.nonzero(e > 10 ** (-58 / 20))[0][-1]
    out = out[:min(len(out), last + int(SR * 1.0))]
    end = np.ones(len(out)); end[-int(SR * 3):] = np.linspace(1, 0, int(SR * 3)) ** 2; end[:int(SR * .03)] = np.linspace(0, 1, int(SR * .03))
    return out * end[:, None]

# ------------------------------------------------------------------------------------------------------------------------------
INTRO, MIDDLE, BRIDGE, ENDING = (0, 58), (58, 137), (139, 171), (198, 230)

def quiet_bones():
    rng = np.random.default_rng(11); s = Song(ff(SRC, None))
    plan = [
        dict(r=INTRO, v='orig', n=21, from_start=True),       # the pure opening, untouched
        dict(r=INTRO, v='harm', n=8),
        dict(r=BRIDGE, v='orig', n=12, from_start=True, xf=3),
        dict(r=MIDDLE, v='warm', n=12, g=.85, xf=3),           # the middle's melody, drums out, dark: new ground
        dict(r=INTRO, v='distant', n=8, g=.9, xf=3.5),
        dict(r=MIDDLE, v='air', n=12, g=.85, xf=3),
        dict(r=BRIDGE, v='air', n=9, xf=3),
        dict(r=MIDDLE, v='mid', n=12, g=.8, xf=3),
        dict(r=INTRO, v='orig', n=7, xf=2.5),
        dict(r=ENDING, v='orig', tail=True, xf=3),            # the song's own ending
    ]
    y = build(s, plan, rng, [INTRO, BRIDGE, ENDING], .08)
    save(y, 'quiet-bones', -19)

def transmission():
    rng = np.random.default_rng(23); base = ff(SRC, 'rubberband=tempo=0.94'); s = Song(base, 1 / .94)
    plan = [
        dict(r=INTRO, v='orig', n=17, from_start=True),
        dict(r=INTRO, v='harm', n=8),
        dict(r=MIDDLE, v='warm', n=14, xf=3),
        dict(r=INTRO, v='orig', n=8, xf=2),
        dict(r=BRIDGE, v='harm', n=12, from_start=True, xf=3),
        dict(r=MIDDLE, v='mid', n=14, xf=3),
        dict(r=INTRO, v='distant', n=8, xf=3),
        dict(r=MIDDLE, v='warm', n=8, xf=3),
        dict(r=INTRO, v='harm', n=7, xf=2.5),
        dict(r=ENDING, v='orig', tail=True, xf=3),
    ]
    y = build(s, plan, rng, [INTRO, ENDING], .07)
    # the radio: a narrow band whose centre drifts as if the signal's being re-tuned, tape wow, a bit crushed, mono
    n = len(y); S = [librosa.stft(y[:, c], n_fft=2048, hop_length=512) for c in range(2)]; T = S[0].shape[1]
    freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)
    walkc = np.cumsum(rng.standard_normal(T)) ; walkc = np.convolve(walkc, np.ones(400) / 400, 'same'); walkc = (walkc - walkc.mean()) / (walkc.std() + 1e-9)
    lo = 380 * 2 ** (walkc * .45); hi = 3000 * 2 ** (walkc * .35)
    M = 1 / (1 + (lo[None, :] / (freqs[:, None] + 1)) ** 4) / (1 + (freqs[:, None] / hi[None, :]) ** 4)
    y = np.stack([librosa.istft(Sc * M, hop_length=512, length=n) for Sc in S], 1).astype(np.float32)
    y = ff(y, 'vibrato=f=0.45:d=0.05,acrusher=bits=9:mix=0.35:mode=log,pan=stereo|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1')[:n]
    hiss = rng.standard_normal(n); hiss = np.convolve(hiss, np.ones(6) / 6, 'same') - np.convolve(hiss, np.ones(60) / 60, 'same')
    g = np.ones(n); t = 16.0
    while t < n / SR - 8:      # it breaks up now and then, never on a pattern: short dips, and once in a while a long fade under static
        a = int(t * SR); L = int((rng.uniform(.5, 1.6) if rng.random() < .8 else rng.uniform(3, 5)) * SR); w = np.hanning(L)
        g[a:a + L] -= rng.uniform(.6, .9) * w[:n - a]; hiss[a:a + L] *= 1 + 5 * w[:n - a]; t += rng.uniform(11, 31)
    y = (y * g[:, None] + (hiss * .012)[:, None]) * np.minimum(1, np.arange(n) / (SR * .05))[:, None]
    save(y, 'quiet-bones-transmission', -20)

def drift():
    rng = np.random.default_rng(37); base = ff(SRC, 'rubberband=pitch=1.4983:tempo=0.8,highpass=f=200'); s = Song(base, 1 / .8)
    plan = [
        dict(r=BRIDGE, v='air', n=12, from_start=True),
        dict(r=BRIDGE, v='harm', n=7),
        dict(r=INTRO, v='air', n=10, xf=3.5),
        dict(r=MIDDLE, v='distant', n=12, g=.95, xf=4),
        dict(r=BRIDGE, v='orig', n=7, xf=3),
        dict(r=MIDDLE, v='mid', n=12, xf=4),
        dict(r=INTRO, v='distant', n=9, xf=3.5),
        dict(r=MIDDLE, v='air', n=8, g=.9, xf=4),
        dict(r=ENDING, v='air', tail=True, xf=4),
    ]
    y = build(s, plan, rng, [BRIDGE, INTRO, ENDING], .1)
    d = int(.011 * SR); y[:, 1] = np.concatenate([np.zeros(d, np.float32), y[:-d, 1]])
    save(y, 'quiet-bones-drift', -21, 'aecho=0.8:0.7:420|760|1130:0.3|0.22|0.14')

def deep():
    rng = np.random.default_rng(53); base = lp(ff(SRC, 'asetrate=%d,aresample=%d' % (int(SR * .667), SR)), 2600); s = Song(base, 1 / .667)
    plan = [
        dict(r=INTRO, v='orig', n=14, from_start=True),
        dict(r=INTRO, v='harm', n=6),
        dict(r=MIDDLE, v='warm', n=10, xf=4),
        dict(r=INTRO, v='distant', n=6, xf=4),
        dict(r=BRIDGE, v='orig', n=8, from_start=True, xf=3.5),
        dict(r=MIDDLE, v='mid', n=10, xf=4),
        dict(r=INTRO, v='orig', n=6, xf=3.5),
        dict(r=ENDING, v='orig', tail=True, xf=4),
    ]
    y = build(s, plan, rng, [INTRO, BRIDGE, ENDING], .09)
    save(y, 'quiet-bones-deep', -20, 'aecho=0.8:0.6:180|340:0.25|0.15')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for f in (sys.argv[3:] or ['quiet_bones', 'transmission', 'drift', 'deep']): print(f); globals()[f]()
