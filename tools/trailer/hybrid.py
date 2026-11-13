"""Epic Hybrid (Nov 13 2026, Bryce: "take the beginning of Epic Two but the rest of Epic One, copying the beginning of Epic Two's
beat, and make it a little quicker after the first 20 seconds so it feels like it's speeding up").
  0 - 6.73 s   epic-cinematic-2 as it is (its opening hit and first bars, ~111 bpm)
  then         epic-cinematic-1 from 24.57 s (a bar before its first big hit) to the end, time-stretched by rubberband (pitch kept)
               from its ~90 bpm up to Epic Two's 111 bpm (x1.233); from 20 s into the song the tempo ramps up another 6.5% over
               20 s and holds there. 0.3 s crossfade at the join.
  Then the first 40 s are cut off (Bryce), so the song begins inside Epic One, already at the faster tempo.
usage: python3 hybrid.py  ->  audio/music/epic-hybrid.mp3"""
import os, subprocess, numpy as np
D = os.path.dirname(os.path.abspath(__file__)); M = os.path.join(D, '../../audio/music'); SR = 48000
J, X, EC1_IN = 6.73, .3, 24.57
r0 = 111 / 90.; r1 = r0 * 1.065
def pcm(args):
    raw = subprocess.run(['ffmpeg', '-v', 'error'] + args + ['-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)
# the tempo curve, as rubberband commands on the input clock
cmds, tin, tout = [], 0.0, J
while tin < 200:
    r = r0 + (r1 - r0) * min(1, max(0, (tout - 20) / 20)); cmds.append('%.3f rubberband tempo %.4f' % (tin, r)); tin += .25; tout += .25 / r
cf = '/tmp/elyra-hybrid-ramp.cmd'; open(cf, 'w').write(';\n'.join(cmds) + ';\n')
a = pcm(['-i', os.path.join(M, 'epic-cinematic-2.mp3'), '-t', str(J + X)])
b = pcm(['-ss', str(EC1_IN), '-i', os.path.join(M, 'epic-cinematic-1.mp3'), '-af', 'asendcmd=f=%s,rubberband=tempo=%.4f:transients=crisp:pitchq=quality' % (cf, r0)])
n, x = int(J * SR), int(X * SR); start = n - x // 2
out = np.zeros((start + len(b), 2), np.float32)
A = a[:start + x].copy(); A[start:start + x] *= np.linspace(1, 0, x)[:, None]; out[:start + x] += A
B = b.copy(); B[:x] *= np.linspace(0, 1, x)[:, None]; out[start:] += B
# (Nov 13, Bryce: "it sounds great but remove the first 40 seconds") the song starts 40 s in, eased in over 1.5 s
out = out[40 * SR:].copy(); out[:int(1.5 * SR)] *= np.linspace(0, 1, int(1.5 * SR))[:, None]
o = (out / np.abs(out).max() * .97 * 32767).astype('<i2')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-b:a', '192k', os.path.join(M, 'epic-hybrid.mp3')], input=o.tobytes(), check=True)
print('epic-hybrid.mp3', round(len(out) / SR, 1), 's')
