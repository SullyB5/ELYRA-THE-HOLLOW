#!/bin/sh
# Join a clip's frames with its mixed soundtrack: ./assemble-clip.sh action|believe
#   out/<name>-frames/f00000.jpg ... (30 fps)  +  mix.py <name>  ->  out/elyra-<name>-1080p.mp4 (16:9) and out/elyra-<name>-vertical.mp4 (9:16)
set -e
cd "$(dirname "$0")"
N=$1
python3 mix.py "$N" "out/$N.wav"
ffmpeg -y -v error -framerate 30 -i "out/$N-frames/f%05d.jpg" -i "out/$N.wav" -map 0:v -map 1:a -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 256k -shortest -movflags +faststart "out/elyra-$N-1080p.mp4"
# vertical: the letterboxed picture cropped tighter, over a blurred copy of itself
ffmpeg -y -v error -i "out/elyra-$N-1080p.mp4" -filter_complex \
  "[0:v]crop=1920:804:0:138,split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.15[bg];[b]crop=1440:804:240:0,scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2" \
  -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a copy -movflags +faststart "out/elyra-$N-vertical.mp4"
echo "out/elyra-$N-1080p.mp4  out/elyra-$N-vertical.mp4"
