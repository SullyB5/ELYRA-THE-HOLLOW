"""Turn hq.py's output into the briefing backdrop files.
usage: python3 hqmap.py OUTDIR      (OUTDIR = what hq.py wrote: color.png, depth.raw, depth.json)
Writes img/hq-loading-pc.webp (1920x1080), -phone.webp (1280x720 downscale) and -depth.png (960x540, white = near).
The depth is matched to the old map's gray values: the old gray is fitted against the new linear depth on matching pixels
(median gray per depth bin, forced to fall with distance), so the loading screen's parallax keeps the same strength.
Background (the window) stays black. Run before overwriting: it reads the old depth map from img/.
"""
import sys, os, json
import numpy as np
from PIL import Image

OUT = sys.argv[1]
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
IMG = os.path.join(ROOT, 'img')

info = json.load(open(os.path.join(OUT, 'depth.json')))
w, h, near, far = info['w'], info['h'], info['near'], info['far']
px = np.frombuffer(open(os.path.join(OUT, 'depth.raw'), 'rb').read(), np.uint8).reshape(h, w, 4).astype(np.float64) / 255.0
px = px[::-1]                                     # readPixels is bottom-up
# three r128 RGBADepthPacking: r is the least significant byte, a the most
d = (255 / 256) * (px[..., 0] / 256 ** 3 + px[..., 1] / 256 ** 2 + px[..., 2] / 256 + px[..., 3])
bg = d >= 0.99999                                 # cleared to white: nothing drawn (the window)
d = np.clip(d, 0, 0.999999)
lin = near * far / (far - d * (far - near))       # view-space distance in metres
lin[bg] = np.inf

# down to the depth map's size (nearest of a 2x2 block's minimum, so thin near edges survive)
H2, W2 = 540, 960
fy, fx = h // H2, w // W2
blk = lin[:H2 * fy, :W2 * fx].reshape(H2, fy, W2, fx)
lin2 = blk.min(axis=(1, 3))
bg2 = ~np.isfinite(lin2)

old = np.asarray(Image.open(os.path.join(IMG, 'hq-loading-depth.png')).convert('L'), np.float64)
m = (~bg2) & (old > 2)                             # pixels drawn in both
ld = np.log(lin2[m]); g = old[m]
edges = np.quantile(ld, np.linspace(0, 1, 41))
cx, cy = [], []
for a, b in zip(edges[:-1], edges[1:]):
    s = (ld >= a) & (ld <= b)
    if s.sum() < 50: continue
    cx.append(np.median(ld[s])); cy.append(np.median(g[s]))
cx, cy = np.array(cx), np.array(cy)
# gray must fall as distance grows: pool adjacent violators
vals = [[y, 1] for y in cy]
i = 0
while i < len(vals) - 1:
    if vals[i][0] < vals[i + 1][0]:
        a, b = vals[i], vals[i + 1]
        vals[i] = [(a[0] * a[1] + b[0] * b[1]) / (a[1] + b[1]), a[1] + b[1]]; del vals[i + 1]
        i = max(i - 1, 0)
    else:
        i += 1
fy_ = np.concatenate([[v[0]] * v[1] for v in vals])
gray = np.interp(np.log(np.where(bg2, 1, lin2)), cx, fy_)
gray[bg2] = 0
res = np.abs(np.interp(ld, cx, fy_) - g)
print('fit: %d bins, gray %.0f..%.0f over %.1f..%.1f m; median abs residual %.1f gray levels on %d px' %
      (len(cx), fy_.max(), fy_.min(), np.exp(cx.min()), np.exp(cx.max()), np.median(res), m.sum()))

Image.fromarray(np.clip(gray, 0, 255).round().astype(np.uint8), 'L').save(os.path.join(IMG, 'hq-loading-depth.png'), optimize=True)
c = Image.open(os.path.join(OUT, 'color.png')).convert('RGB')
if c.size != (1920, 1080): c = c.resize((1920, 1080), Image.LANCZOS)
c.save(os.path.join(IMG, 'hq-loading-pc.webp'), quality=82, method=6)
c.resize((1280, 720), Image.LANCZOS).save(os.path.join(IMG, 'hq-loading-phone.webp'), quality=78, method=6)
print('wrote', [f for f in os.listdir(IMG) if f.startswith('hq-loading')])
