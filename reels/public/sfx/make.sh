#!/usr/bin/env bash
# Our own sound effects and music bed, synthesised with ffmpeg (no licences needed). Re-run to regenerate.
set -euo pipefail
cd "$(dirname "$0")"
f() { ffmpeg -v error -y "$@"; }
f -f lavfi -i "anoisesrc=d=0.5:c=pink:a=0.6" -af "bandpass=f=900:w=1400,afade=t=in:d=0.18,afade=t=out:st=0.2:d=0.3,volume=0.8" -ar 48000 whoosh.wav
f -f lavfi -i "sine=f=1800:d=0.04" -af "afade=t=out:st=0.005:d=0.035,volume=0.5" -ar 48000 click.wav
f -f lavfi -i "anoisesrc=d=0.03:c=white:a=0.4" -af "highpass=f=2500,afade=t=out:st=0.005:d=0.025" -ar 48000 type.wav
f -f lavfi -i "sine=f=1318.5:d=0.9" -f lavfi -i "sine=f=1975.5:d=0.9" -filter_complex "amix=inputs=2,afade=t=out:st=0.02:d=0.88,volume=0.9" -ar 48000 ding.wav
f -f lavfi -i "sine=f=520:d=0.12" -af "asetrate=48000*1.6,aresample=48000,afade=t=out:st=0.02:d=0.1,volume=0.7" pop.wav
# Music bed: 4 soft chords (Am F C G), 4 s each, looped to 40 s, low-passed with a gentle echo.
chord() { # $1..$3 = frequencies
  echo "sine=f=$1:d=4,volume=0.33[a];sine=f=$2:d=4,volume=0.33[b];sine=f=$3:d=4,volume=0.33[c];[a][b][c]amix=inputs=3"
}
i=0; for c in "220 261.6 329.6" "174.6 220 261.6" "130.8 196 261.6" "196 246.9 293.7"; do
  f -f lavfi -i "$(chord $c)" -af "afade=t=in:d=1.2,afade=t=out:st=2.6:d=1.4" -ar 48000 chord$i.wav; i=$((i+1)); done
f -i chord0.wav -i chord1.wav -i chord2.wav -i chord3.wav -filter_complex "[0][1][2][3]concat=n=4:v=0:a=1,aloop=loop=2:size=768000,atrim=0:40,lowpass=f=1800,tremolo=f=0.25:d=0.3,aecho=0.8:0.7:180:0.35,loudnorm=I=-24" -ar 48000 bed.wav && ffmpeg -v error -y -i bed.wav -c:a aac -b:a 96k bed.m4a && rm bed.wav
rm chord*.wav
