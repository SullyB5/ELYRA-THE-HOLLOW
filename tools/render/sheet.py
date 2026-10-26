import sys, glob, os
from PIL import Image, ImageDraw
# usage: sheet.py DIR OUT [cols] [start] [count] [w]
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
start = int(sys.argv[4]) if len(sys.argv) > 4 else 0
cnt = int(sys.argv[5]) if len(sys.argv) > 5 else 12
W = int(sys.argv[6]) if len(sys.argv) > 6 else 480
fs = sorted(glob.glob(os.path.join(d, '*.jpg')))[start:start + cnt]
if not fs: sys.exit('no frames')
H = W * 9 // 16
rows = (len(fs) + cols - 1) // cols
im = Image.new('RGB', (W * cols, H * rows))
dr = ImageDraw.Draw(im)
for i, f in enumerate(fs):
    x, y = (i % cols) * W, (i // cols) * H
    im.paste(Image.open(f).convert('RGB').resize((W, H)), (x, y))
    dr.text((x + 4, y + 4), os.path.basename(f)[:-4], fill=(255, 255, 0))
im.save(out, quality=85)
print(len(fs), 'frames')
