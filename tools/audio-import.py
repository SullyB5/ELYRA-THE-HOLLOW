#!/usr/bin/env python3
"""Elyra · sound import (Nov 3). Turns the originals in audio/sfx/raw/ that this script knows about into the game's files in
audio/sfx/, and (when given --music DIR) the score tracks into audio/music/. Needs ffmpeg and numpy.

  SFX: trimmed, cut into single hits where a recording holds many (footsteps, casings, rounds), loudness-levelled like
       audio/sfx/process.sh does (RMS of the audible part to a target, never above a -1 dBFS peak), mono MP3.
  Music: trimmed, loudness-normalised (EBU R128) so every track sits at the same level, stereo MP3 at 96 kbps (small enough to
       stream on a phone). The track list is MUSIC below: source file name fragment -> game name, loudness target.

Run:  python3 tools/audio-import.py                 (SFX only)
      python3 tools/audio-import.py --music ~/dl     (SFX, then any MUSIC sources found in ~/dl)
"""
import os, sys, subprocess, tempfile, glob
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'audio/sfx/raw'); OUT = os.path.join(ROOT, 'audio/sfx'); MUS = os.path.join(ROOT, 'audio/music')
SR = 44100; CEIL = -1.0

def load(path):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()

def onsets(x, gap=.18, rel=.25):
    h = int(SR * .005); n = len(x) // h
    db = 20 * np.log10(np.sqrt((x[:n * h].reshape(n, h) ** 2).mean(1) + 1e-12)); thr = db.max() + 20 * np.log10(rel)
    out = []; last = -1e9
    for i in range(2, n):
        if db[i] > thr and db[i] - db[i - 2] > 6 and (i * h / SR - last) > gap:
            out.append((i * h / SR, float(db[i:i + 10].max()))); last = i * h / SR
    return out

def trim(x, floor=-60):
    a = np.abs(x); t = 10 ** (floor / 20); idx = np.where(a > t)[0]
    return x[max(0, idx[0] - 40):idx[-1] + 1] if len(idx) else x

def level(x, target, fade_out=.03):
    if fade_out and len(x) > SR * fade_out * 2:
        n = int(SR * fade_out); x = x.copy(); x[-n:] *= np.linspace(1, 0, n)
    rms = 20 * np.log10(np.sqrt((x[np.abs(x) > 1e-3] ** 2).mean() + 1e-12)); peak = 20 * np.log10(np.abs(x).max() + 1e-12)
    g = target - rms
    if peak + g > CEIL: g = CEIL - peak
    return x * 10 ** (g / 20), rms, peak, g

def write(x, name):
    with tempfile.NamedTemporaryFile(suffix='.f32') as f:
        x.astype(np.float32).tofile(f.name)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', f.name, '-c:a', 'libmp3lame', '-q:a', '3',
                        os.path.join(OUT, name + '.mp3')], check=True)

def out(x, name, target=-20, fade=.03):
    y, rms, peak, g = level(trim(x), target, fade); write(y, name)
    print('%-22s %5.2fs  rms %6.1f  peak %6.1f  gain %+6.2f' % (name, len(y) / SR, rms, peak, g))

def cut(x, a, b): return x[int(a * SR):int(b * SR)]

def slices(x, n, maxlen, target, name, pre=.01, pick='loud', gap=.18):
    """the n best single hits of a many-hit recording, each until just before the next one (at most maxlen)"""
    o = onsets(x, gap=gap); segs = []
    for i, (t, pk) in enumerate(o):
        end = min(o[i + 1][0] - .02 if i + 1 < len(o) else len(x) / SR, t + maxlen)
        if end - t > .12: segs.append((pk, t, end))
    segs.sort(key=lambda s: -s[0])
    # skip the very loudest (often a scuff or a clipped one) when there is plenty to choose from
    if len(segs) > n + 4: segs = segs[1:]
    chosen = sorted(segs[:n], key=lambda s: s[1])
    for k, (pk, t, end) in enumerate(chosen, 1): out(cut(x, max(0, t - pre), end), '%s-%d' % (name, k), target, fade=.04)

def sfx():
    R = lambda n: load(os.path.join(RAW, n + '.mp3'))
    # whole files
    for n, tg in [('shield-impact', -14), ('cannon-shot', -16), ('distant-shot-a', -22), ('pistol-9mm', -18), ('expl-loud-a', -16), ('expl-loud-b', -16),
                  ('expl-fx', -17), ('expl-massive', -15), ('expl-boom', -17), ('expl-sfx', -16), ('expl-underwater', -17), ('scifi-zap-8', -20),
                  ('scifi-beam-12', -20), ('scifi-pulse-15', -20), ('scifi-rise-16', -20), ('scifi-bass-heavy', -18), ('scifi-laser-04', -19),
                  ('scifi-warped-06', -19), ('bullet-whizz', -20), ('ricochet-metal', -20), ('bullet-hit-metal', -20), ('bullet-hit-b', -20),
                  ('bullet-impact', -20), ('hit-body', -19)]:
        out(R(n), n, tg)
    out(cut(R('distant-shot-b'), 0, 3.2), 'distant-shot-b', -22, fade=.6)
    out(cut(R('distant-burst-a'), 2.62, 3.6), 'distant-shot-c', -22, fade=.25)
    out(cut(R('distant-burst-b'), 0, 2.7), 'distant-burst', -22, fade=.3)
    out(cut(R('rifle-m16'), .055, .47), 'rifle-m16-a', -18, fade=.05)
    out(cut(R('rifle-m16'), .855, 1.83), 'rifle-m16-b', -18, fade=.15)
    out(cut(R('laser-cannon'), .1, 3.0), 'laser-cannon', -18, fade=.4)
    car = R('bullet-hits-car')
    for k, t in enumerate([.17, 1.80, 3.72], 1): out(cut(car, t - .01, t + 1.3), 'car-hit-%d' % k, -20, fade=.2)
    slices(R('casings'), 6, .9, -26, 'casing')
    slices(R('shell-drop'), 5, .7, -28, 'shell-drop')
    slices(R('steps-monster'), 6, .34, -18, 'mech-step')
    for s, n in [('steps-concrete', 8), ('steps-metal', 8), ('steps-sand', 8), ('steps-snow', 8), ('steps-gravel', 8), ('steps-trail', 8), ('steps-stairs', 6)]:
        slices(R(s), n, .36, -27, s.replace('steps-', 'step-'))

# score tracks: (fragment of the source file name, game name, integrated loudness target in LUFS)
MUSIC = [('leberch-piano-627002', 'quiet-piano', -19), ('leberch-sad-piano', 'quiet-sad-piano', -19), ('leberch-melancholy', 'quiet-melancholy', -19),
         ('viramiller-melancholy-dreamscape', 'quiet-dreamscape', -19), ('leberch-documentaries-piano', 'calm-documentary-piano', -18),
         ('atlasaudio-tragic-piano', 'sorrow-tragic-piano', -18), ('bombinsound-epic-action', 'drive-epic-action', -16),
         ('audioatlant-total-war', 'drive-total-war', -16), ('soundorbit24-cinematic-epic-sound-001', 'epic-cinematic-1', -16),
         ('soundorbit24-cinematic-epic-sound-002', 'epic-cinematic-2', -16), ('psychronic-bones-of-the-first-sky', 'awe-bones-of-the-first-sky', -17),
         ('the_mountain-jazz-noir', 'market-jazz-noir', -18), ('asproductionmusic-cinematic-drum-hit', 'sting-drum-hit', -14),
         ('emand_edroff-cinematic-sub-bass-drop-hit', 'sting-sub-drop', -15)]

def music(src):
    os.makedirs(MUS, exist_ok=True)
    for frag, name, lufs in MUSIC:
        m = [f for f in glob.glob(os.path.join(src, '*.mp3')) if frag in os.path.basename(f)]
        if not m: print('  (no source for %s)' % name); continue
        af = ('silenceremove=start_periods=1:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse,'
              'loudnorm=I=%d:TP=-1.5:LRA=14' % lufs)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', m[0], '-af', af, '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '96k',
                        os.path.join(MUS, name + '.mp3')], check=True)
        print('%-28s %5.1f MB' % (name, os.path.getsize(os.path.join(MUS, name + '.mp3')) / 1e6))

if __name__ == '__main__':
    sfx()
    if '--music' in sys.argv: music(sys.argv[sys.argv.index('--music') + 1])
