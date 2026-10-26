#!/usr/bin/env bash
# Elyra · one-time sound processing (ffmpeg). Reads the untouched originals in audio/sfx/raw/ and writes the game's files to audio/sfx/:
#   1. cut the one-shots out of the burst files (times are in the raw files),
#   2. trim the silent head and tail (anything under -60 dBFS),
#   3. loudness-normalise: the RMS of what's left to TARGET dBFS, but never louder than a -1 dBFS peak (so nothing clips),
#   4. mono, 44.1 kHz, MP3 (plays everywhere).
# Run it again after adding a file to raw/ (and give the new file a line in js/shared/sfx-map.js). Needs ffmpeg with libmp3lame.
set -euo pipefail
cd "$(dirname "$0")"
RAW=raw
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
TARGET=-20      # dBFS RMS of the audible part
CEIL=-1         # dBFS peak ceiling

# per-file loudness offsets (dB) on top of TARGET: loops and long beds sit lower, doors a touch higher than a gunshot's RMS suggests
declare -A OFFSET=( [car-engine-loop]=-4 [car-engine-roaring]=-3 [missile-explosion]=-1 [drone-engine-loop]=-4 [rocket-engine-large]=-2 [ship-flyby-large]=-2 [door-scifi-a]=0 [door-scifi-b]=2 )

trim(){ # in out : drop silence at both ends
  ffmpeg -v error -y -i "$1" -ac 1 -ar 44100 -af "silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.004,areverse,silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.004,areverse" "$2"; }
stat(){ # file key : print astats value (RMS level dB / Peak level dB)
  ffmpeg -v info -i "$1" -af astats=measure_overall="$2":measure_perchannel=none -f null - 2>&1 | awk -F': ' '/Overall/{f=1} f&&/(RMS level dB|Peak level dB)/{print $2;exit}'; }
norm(){ # in name
  local rms peak off gain
  rms=$(stat "$1" RMS_level); peak=$(stat "$1" Peak_level); off=${OFFSET[$2]:-0}
  gain=$(awk -v t="$TARGET" -v o="$off" -v r="$rms" -v p="$peak" -v c="$CEIL" 'BEGIN{g=t+o-r; if(p+g>c)g=c-p; printf "%.2f", g}')
  ffmpeg -v error -y -i "$1" -af "volume=${gain}dB" -c:a libmp3lame -q:a 3 "$2.mp3"
  printf '%-28s rms %6.1f  peak %6.1f  gain %+6.2f dB\n' "$2" "$rms" "$peak" "$gain"; }

# a single round with the burst's own tail: round [a,b] crossfaded into tail [c,d]
single(){ # src a b c d name
  ffmpeg -v error -y -i "$RAW/$1.mp3" -filter_complex \
    "[0]atrim=$2:$3,asetpts=N/SR/TB,afade=t=out:st=$(awk -v a="$2" -v b="$3" 'BEGIN{print b-a-0.012}'):d=0.012[r];[0]atrim=$4:$5,asetpts=N/SR/TB,afade=t=in:d=0.012[t];[r][t]acrossfade=d=0.012:c1=tri:c2=tri,aformat=sample_rates=44100:channel_layouts=mono" \
    "$TMP/$6.cut.wav"; }
# a plain cut [a,b] with a short fade out
cut(){ # src a b name
  ffmpeg -v error -y -i "$RAW/$1.mp3" -ac 1 -ar 44100 -af "atrim=$2:$3,asetpts=N/SR/TB,afade=t=out:st=$(awk -v a="$2" -v b="$3" 'BEGIN{print b-a-0.15}'):d=0.15" "$TMP/$4.cut.wav"; }

# gun-shots-multi is three short bursts; the last round of each rings out on its own, so those are the one-shots
cut gun-shots-multi 1.818 2.580 gun-shots-multi-1
cut gun-shots-multi 3.219 4.020 gun-shots-multi-2
cut gun-shots-multi 4.273 5.500 gun-shots-multi-3
# the first round of each machine-gun burst, crossfaded into that burst's tail (after its last round)
single machine-gun-a           0.022 0.076 0.500 1.900 machine-gun-a-single
single machine-gun-b           0.024 0.108 0.860 1.450 machine-gun-b-single
single machine-gun-burst-clean 0.020 0.128 1.400 1.620 machine-gun-clean-single
# the steady middle of the roaring car engine, looped in the game (it crossfades the seam as it decodes)
ffmpeg -v error -y -i "$RAW/car-engine-roaring.mp3" -ac 1 -ar 44100 -af "atrim=0.2:1.65,asetpts=N/SR/TB" "$TMP/car-engine-loop.cut.wav"

for f in "$RAW"/*.mp3; do n=$(basename "$f" .mp3); trim "$f" "$TMP/$n.wav"; norm "$TMP/$n.wav" "$n"; done
for f in "$TMP"/*.cut.wav; do n=$(basename "$f" .cut.wav); trim "$f" "$TMP/$n.wav"; norm "$TMP/$n.wav" "$n"; done
