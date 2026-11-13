"""Soundtracks for the action trailer and the Believe clip, mixed from the game's own music and sound (audio/), no outside files.
usage: python3 mix.py action|believe OUT.wav
Each cue: (time in the clip, file under audio/, gain, pan -1..1, {from: s into the file, dur: s, fade: s, lp: low-pass Hz, rate: playback speed})."""
import sys, os, subprocess, numpy as np
from scipy.signal import butter, sosfilt
SR = 48000
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../audio')
_cache = {}
def load(f):
    if f not in _cache:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(ROOT, f), '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
        _cache[f] = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
    return _cache[f]
def place(buf, t, f, g=1.0, pan=0.0, o=None):
    o = o or {}
    a = load(f)
    s0 = int(o.get('from', 0) * SR); a = a[s0:]
    if 'dur' in o: a = a[:int(o['dur'] * SR)]
    if o.get('rate', 1) != 1:
        n = int(len(a) / o['rate']); idx = np.linspace(0, len(a) - 1, n)
        a = np.stack([np.interp(idx, np.arange(len(a)), a[:, c]) for c in (0, 1)], 1)
    a = a.copy()
    if o.get('lp'): a = sosfilt(butter(4, o['lp'], 'low', fs=SR, output='sos'), a, axis=0)
    fi = int(o.get('fadein', 0.005) * SR); fo = int(o.get('fade', 0.03) * SR)
    if fi: a[:fi] *= np.linspace(0, 1, min(fi, len(a)))[:, None][:len(a[:fi])]
    if fo: a[-fo:] *= np.linspace(1, 0, min(fo, len(a)))[:, None][-len(a[-fo:]):]
    a[:, 0] *= g * min(1, 1 - pan); a[:, 1] *= g * min(1, 1 + pan)
    i0 = int(t * SR)
    if i0 < 0: a = a[-i0:]; i0 = 0
    n = min(len(a), len(buf) - i0)
    if n > 0: buf[i0:i0 + n] += a[:n]
def tone(buf, t0, dur, hz, g):
    n = int(dur * SR); x = np.arange(n) / SR
    env = np.minimum(1, x / .05) * np.exp(-x / (dur * .45))
    s = np.sin(2 * np.pi * hz * x) * env * g
    i0 = int(t0 * SR); n = min(n, len(buf) - i0); buf[i0:i0 + n] += s[:n, None]
def gain_ramp(buf, t0, t1, g0, g1):
    i0, i1 = int(t0 * SR), int(t1 * SR); buf[i0:i1] *= np.linspace(g0, g1, i1 - i0)[:, None]

def action():
    L = 26.5; mus = np.zeros((int(L * SR), 2), np.float32); fx = np.zeros_like(mus)
    # the score: drive-total-war, its 38.96 s hit on the first cut (t 1.0); its own break (48.6-51.75) is the loss
    place(mus, 0, 'music/drive-total-war.mp3', 1.0, 0, {'from': 37.96, 'dur': L, 'fade': 1.6})
    gain_ramp(mus, 0, 1.0, 0.0, 0.55)
    S = 'sfx/'
    cues = [
        (0.05, 'distant-burst.mp3', .35, -.3), (0.45, 'distant-shot-a.mp3', .3, .4), (0.7, 'bullet-whizz.mp3', .5, -.5),
        # the charge
        (1.0, 'expl-loud-a.mp3', .95, 0), (1.12, 'expl-boom.mp3', .45, -.5), (1.3, 'bullet-whizz.mp3', .5, .6), (1.68, 'expl-loud-b.mp3', .85, .3),
        (1.9, 'bullet-whizz.mp3', .45, -.4), (2.42, 'expl-boom.mp3', .6, .6), (2.6, 'ray-gun-blast.mp3', .3, -.6),
        # the dogfight
        (2.95, 'ship-flyby-large.mp3', .75, 0), (3.02, 'laser-cannon.mp3', .45, 0), (3.4, 'laser-cannon.mp3', .4, .1), (4.02, 'expl-loud-a.mp3', .9, 0), (4.05, 'expl-fx.mp3', .55, .2),
        # the hog
        (4.28, 'car-engine-roaring.mp3', .8, -.4, {'dur': 1.25, 'fade': .2}), (4.62, 'rocket-launcher-rpg.mp3', .6, .1), (4.86, 'rocket-launcher-rpg.mp3', .55, .3),
        (5.02, 'missile-explosion.mp3', .7, .5), (5.36, 'expl-boom.mp3', .6, .6),
        # the Hollow
        (5.53, 'ray-gun-blast.mp3', .55, -.2), (5.66, 'scifi-zap-8.mp3', .45, .3), (5.8, 'bullet-whizz.mp3', .5, .5), (5.92, 'scifi-pulse-15.mp3', .4, -.3),
        (6.1, 'ray-gun-blast.mp3', .45, .2), (6.26, 'rifle-m16-a.mp3', .7, 0), (6.32, 'hit-body.mp3', .7, 0),
        # the fleet
        (6.51, 'ship-flyby-large.mp3', .6, -.3), (6.55, 'laser-cannon.mp3', .4, -.4), (6.7, 'distant-burst.mp3', .5, .3), (7.05, 'distant-burst.mp3', .4, -.2),
        # the mech
        (7.5, 'machine-gun-a.mp3', .75, 0, {'dur': .9, 'fade': .1}), (7.52, 'mech-step-2.mp3', .5, 0), (7.75, 'expl-boom.mp3', .35, -.3), (7.95, 'shell-drop-1.mp3', .4, .3),
        (8.1, 'shell-drop-3.mp3', .35, .4), (7.91, 'expl-boom.mp3', .3, .3),
        # the bomber
        (8.34, 'rocket-engine-large.mp3', .7, 0, {'dur': 2.3, 'fade': .2}),
        # retribution
        (13.79, 'rocket-engine-large.mp3', .65, 0, {'dur': 1.3, 'fade': .3}), (13.82, 'scifi-rise-16.mp3', .5, 0), (14.1, 'ship-flyby-large.mp3', .45, .4),
        (15.0, 'step-concrete-1.mp3', .3, 0), (15.75, 'step-concrete-2.mp3', .3, 0), (16.5, 'step-concrete-3.mp3', .3, 0),
        (17.0, 'ship-flyby-large.mp3', .85, 0), (17.08, 'rocket-launcher-rpg.mp3', .5, -.2), (17.2, 'rocket-launcher-rpg.mp3', .45, .2),
        (17.62, 'missile-explosion.mp3', .55, -.2), (17.8, 'missile-explosion.mp3', .5, .2), (17.97, 'missile-explosion.mp3', .5, 0), (18.25, 'expl-massive.mp3', .8, 0),
        (18.51, 'car-engine-roaring.mp3', .7, 0, {'dur': .95, 'fade': .2}), (19.41, 'car-hit-2.mp3', .8, 0), (19.43, 'expl-boom.mp3', .3, 0),
        (20.51, 'rocket-engine-large.mp3', .45, -.3, {'dur': 1.0, 'fade': .3}), (21.3, 'expl-massive.mp3', 1.0, 0), (21.33, 'expl-underwater.mp3', .6, 0),
        (21.67, '../music/sting-drum-hit.mp3', 1.0, 0), (21.67, '../music/sting-sub-drop.mp3', .8, 0, {'from': 1.0, 'dur': 4.5, 'fade': 1.5}),
    ]
    bombs = [8.7, 8.98, 9.24, 9.48, 9.7, 9.9, 10.08, 10.24, 10.4, 10.53]
    for i, b in enumerate(bombs): cues.append((b, 'expl-loud-a.mp3' if i % 2 else 'expl-loud-b.mp3', .35 + .06 * i, (i % 3 - 1) * .3))
    cues.append((10.53, 'expl-massive.mp3', 1.0, 0))
    for k, t0 in enumerate([19.58, 19.8, 20.02, 20.2, 20.36]): cues += [(t0, 'cannon-shot.mp3', .7, .3), (t0 + .13, 'expl-boom.mp3', .45, -.2 + .1 * k)]
    for c in cues: place(fx, c[0], S + c[1], c[2], c[3], c[4] if len(c) > 4 else None)
    # the loss: everything muffled, a ringing in the ears, a few notes of piano under it
    loss = np.zeros_like(fx)
    place(loss, 10.62, S + 'expl-massive.mp3', .9, 0, {'lp': 300, 'rate': .6, 'dur': 3.0, 'fade': 1.2})
    place(loss, 11.3, S + 'expl-boom.mp3', .4, .4, {'lp': 250, 'rate': .5, 'dur': 2.0, 'fade': .8})
    place(loss, 10.9, 'music/sorrow-tragic-piano.mp3', .55, 0, {'dur': 3.0, 'fade': 1.0, 'fadein': .3})
    tone(loss, 10.6, 3.1, 3150, .045)
    gain_ramp(fx, 10.62, 10.62 + 1e-3, 1, 1); fx[int(10.65 * SR):int(13.79 * SR)] *= .0
    return mus * .8 + fx * .75 + loss * .6

def believe():
    L = 24.6; mus = np.zeros((int(L * SR), 2), np.float32); fx = np.zeros_like(mus)
    # Epic Hybrid (hybrid.py, its first 40 s cut off). From 9.5 s into it at the fade-in (0.9): it builds through a quiet stretch
    # to its big hit (20.5) on the kill (11.8). At 15.5 (the cut to black) it jumps to 33.65, so BELIEVE sits on the music dying
    # away into silence, and its next hit (40.0) lands on the logo (22.0)
    a = np.zeros_like(mus); b = np.zeros_like(mus)
    place(a, 0.9, 'music/epic-hybrid.mp3', 1.0, 0, {'from': 9.5, 'dur': 14.6 + .3, 'fade': .6, 'fadein': .4})
    place(b, 15.5 - .3, 'music/epic-hybrid.mp3', 1.0, 0, {'from': 33.65 - .3, 'dur': L, 'fade': 1.4, 'fadein': .6})
    mus = a + b
    S = 'sfx/'
    cues = [(0.9, 'distant-burst.mp3', .3, -.3), (1.0, 'drone-engine-loop.mp3', .35, 0, {'dur': 2.0, 'fade': .6, 'fadein': .6}), (1.4, 'distant-shot-b.mp3', .25, .5),
        (2.2, 'distant-burst.mp3', .25, .4), (3.05, 'scifi-rise-16.mp3', .45, 0), (3.05, 'rocket-engine-large.mp3', .5, 0, {'dur': 1.5, 'fade': .3}),
        (4.5, 'expl-boom.mp3', .75, 0), (4.5, '../music/sting-drum-hit.mp3', .55, 0), (4.6, 'casing-2.mp3', .2, .3),
        (6.0, 'bullet-whizz.mp3', .55, .5), (6.7, 'bullet-whizz.mp3', .5, -.5), (7.3, 'bullet-whizz.mp3', .5, .3),
        (7.92, 'scifi-bass-heavy.mp3', .85, 0), (7.95, 'shield-impact.mp3', .7, 0),
        (10.35, 'mech-step-1.mp3', .35, -.2), (10.75, 'mech-step-3.mp3', .4, -.1), (11.1, 'mech-step-5.mp3', .45, 0), (11.42, 'mech-step-2.mp3', .5, 0),
        (11.8, 'hit-body.mp3', .8, 0), (11.8, 'expl-fx.mp3', .6, 0, {'lp': 1800}), (11.8, '../music/sting-sub-drop.mp3', .75, 0, {'from': 1.0, 'dur': 4, 'fade': 1.5}),
        (12.6, 'casing-4.mp3', .25, .2), (13.9, 'scifi-warped-06.mp3', .45, 0),
        (22.0, '../music/sting-drum-hit.mp3', 1.0, 0)]
    for i in range(24):   # the Hollow line firing from 5.4 to 11.2
        t0 = 5.45 + i * .24 + (i % 3) * .04; cues.append((t0, ['ray-gun-blast.mp3', 'scifi-zap-8.mp3', 'scifi-pulse-15.mp3'][i % 3], .28, ((i * 7) % 5 - 2) * .2))
    for i in range(14):   # the shield taking it
        cues.append((8.0 + i * .16, 'shield-impact.mp3', .22 + .02 * (i % 3), ((i * 3) % 5 - 2) * .25, {'dur': .5}))
    for t0 in [11.5, 11.6, 11.68, 11.75]: cues.append((t0, 'rifle-m16-b.mp3', .7, .1))
    for c in cues: place(fx, c[0], S + c[1], c[2], c[3], c[4] if len(c) > 4 else None)
    return mus * .85 + fx * .7

out = {'action': action, 'believe': believe}[sys.argv[1]]()
pk = np.abs(out).max(); out = np.tanh(out / pk * 1.4) / np.tanh(1.4) * .93
raw = (np.clip(out, -1, 1) * 32767).astype('<i2').tobytes()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', sys.argv[2]], input=raw, check=True)
print('wrote', sys.argv[2], len(out) / SR, 's')
