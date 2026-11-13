#!/bin/sh
# Join the trailer's frames with the original trailer's sound into the finished videos.
#   out/frames/f00000.jpg ... (30 fps, trailer.html)   +   audio.wav (the original trailer's soundtrack)
#   -> out/elyra-trailer-1080p.mp4 (16:9)  and  out/elyra-trailer-vertical.mp4 (9:16, blurred fill, for TikTok/Shorts)
set -e
cd "$(dirname "$0")"
ffmpeg -y -v error -framerate 30 -i out/frames/f%05d.jpg -i audio.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 256k -shortest -movflags +faststart out/elyra-trailer-1080p.mp4
ffmpeg -y -v error -i out/elyra-trailer-1080p.mp4 -filter_complex \
  "[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.12[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy -movflags +faststart out/elyra-trailer-vertical.mp4
